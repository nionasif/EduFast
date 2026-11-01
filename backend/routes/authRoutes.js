const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../config/db');
const { generateToken, verifyToken } = require('../middleware/authMiddleware');
const {
  generateSecureOtp,
  hashOtp,
  sendOtpEmail,
  preRegistrationOtps,
  preVerifiedEmails
} = require('../services/otpService');

/**
 * Normalizes and formats full student record for client session
 */
function formatStudentResponse(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || 'Student',
    email: row.email || '',
    mobile: row.mobile || '',
    fathersName: row.fathersName || '',
    mothersName: row.mothersName || '',
    dob: row.dob || '',
    group: row.academicGroup || 'Science',
    academicGroup: row.academicGroup || 'Science',
    avatar: row.avatar || null,
    isVerified: Boolean(row.isVerified),
    coins: (row.coins !== null && row.coins !== undefined && Number(row.coins) > 0) ? Number(row.coins) : 100,
    score: Number(row.score) || 0.0,
    streak: Number(row.streak) || 0,
    target: row.target || '',
    ssc: {
      roll: row.sscRoll || '',
      reg: row.sscReg || '',
      board: row.sscBoard || 'Dhaka',
      year: row.sscYear || '2024',
      gpa: row.sscGpa !== null && row.sscGpa !== undefined ? Number(row.sscGpa) : 0.0,
      school: row.sscSchool || ''
    },
    hsc: {
      roll: row.hscRoll || '',
      reg: row.hscReg || '',
      board: row.hscBoard || 'Dhaka',
      year: row.hscYear || '2026',
      gpa: row.hscGpa !== null && row.hscGpa !== undefined ? Number(row.hscGpa) : 0.0,
      school: row.hscCollege || '',
      college: row.hscCollege || ''
    },
    purchasedCourses: []
  };
}

// -------------------------------------------------------------
// AUTH: PRE-REGISTRATION EMAIL OTP DISPATCH
// -------------------------------------------------------------
router.post('/api/auth/send-email-otp', async (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email address is required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  try {
    const db = getDb();
    // Check if user already exists and is verified
    const existing = await db.get('SELECT id, isVerified FROM students WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing && existing.isVerified === 1) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email is already verified. Please log in.'
      });
    }

    // Cooldown check (60s)
    const now = Date.now();
    const prev = preRegistrationOtps.get(cleanEmail);
    if (prev && now - prev.lastSentAt < 60000) {
      const waitSec = Math.ceil((60000 - (now - prev.lastSentAt)) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${waitSec}s before requesting another verification code.`,
        retryAfter: waitSec
      });
    }

    const otp = generateSecureOtp();
    const hashed = hashOtp(otp);
    const expiresAt = now + 5 * 60 * 1000;

    preRegistrationOtps.set(cleanEmail, {
      otpHash: hashed,
      expiresAt,
      attempts: 0,
      lastSentAt: now
    });

    await sendOtpEmail(cleanEmail, name || 'Student', otp);

    return res.json({
      success: true,
      message: `6-digit verification code sent to ${cleanEmail}.`
    });
  } catch (err) {
    console.error('[send-email-otp] Error:', err);
    return res.status(500).json({
      success: false,
      error: "Could not send verification email. " + (err.message || 'Please check SMTP settings.')
    });
  }
});

// -------------------------------------------------------------
// AUTH: PRE-REGISTRATION EMAIL OTP VERIFY
// -------------------------------------------------------------
router.post('/api/auth/verify-email-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: 'Email and OTP code are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  const record = preRegistrationOtps.get(cleanEmail);
  if (!record) {
    return res.status(400).json({
      success: false,
      error: 'No verification code requested for this email. Please click Send OTP first.'
    });
  }

  if (Date.now() > record.expiresAt) {
    preRegistrationOtps.delete(cleanEmail);
    return res.status(400).json({
      success: false,
      error: 'Verification code has expired (5 minutes). Please request a new code.'
    });
  }

  if (record.attempts >= 5) {
    preRegistrationOtps.delete(cleanEmail);
    return res.status(400).json({
      success: false,
      error: 'Too many incorrect attempts. Please request a new verification code.'
    });
  }

  if (hashOtp(cleanOtp) !== record.otpHash) {
    record.attempts += 1;
    if (record.attempts >= 5) {
      preRegistrationOtps.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        error: 'Too many incorrect attempts. Please request a new verification code.'
      });
    }
    const remaining = 5 - record.attempts;
    return res.status(400).json({
      success: false,
      error: `Invalid verification code. (${remaining} attempt${remaining > 1 ? 's' : ''} left)`
    });
  }

  // OTP is valid!
  preRegistrationOtps.delete(cleanEmail);
  preVerifiedEmails.add(cleanEmail);

  return res.json({
    success: true,
    isVerified: true,
    message: 'Email address verified successfully!'
  });
});

// -------------------------------------------------------------
// AUTH ROUTE 1: REGISTER WITH EMAIL OTP DISPATCH
// -------------------------------------------------------------
router.post(['/api/auth/register', '/api/save-student', '/api/mentor/register'], async (req, res) => {
  const { name, fathersName, mothersName, dob, mobile, email, group, ssc, hsc, password, isPreVerified, role, institution, subject } = req.body;

  // 1. MENTOR REGISTRATION HANDLER
  if (role === 'mentor') {
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    try {
      const db = getDb();
      const existingMentor = await db.get('SELECT * FROM mentors WHERE LOWER(email) = ?', [cleanEmail]);
      const existingAuth = await db.get('SELECT * FROM users_auth WHERE LOWER(email) = ?', [cleanEmail]);

      if (existingMentor || existingAuth) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists. Please log in.'
        });
      }

      const mentorId = `mentor-${Date.now()}`;
      const mentorMobile = mobile && String(mobile).trim() ? String(mobile).trim() : `017${Date.now().toString().slice(-8)}`;

      // Insert into mentors table
      await db.run(`
        INSERT INTO mentors (
          id, name, email, mobile, subject, institution, bio, rating, doubtsResolved, isVerified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 5.0, 0, 1)
      `, [
        mentorId,
        String(name).trim(),
        cleanEmail,
        mentorMobile,
        subject || 'Physics',
        institution ? String(institution).trim() : 'Top University',
        'Senior Academic Mentor & Doubt Solver'
      ]);

      // Insert into users_auth table for unified login
      await db.run(
        'INSERT OR REPLACE INTO users_auth (role, email, mobile, password, isVerified) VALUES (?, ?, ?, ?, 1)',
        ['mentor', cleanEmail, mentorMobile, password]
      );

      const created = await db.get('SELECT * FROM mentors WHERE id = ?', [mentorId]);
      const formatted = formatMentorResponse(created);
      const token = generateToken({
        id: formatted.id,
        email: formatted.email,
        role: 'mentor',
        name: formatted.name
      });

      return res.status(201).json({
        success: true,
        message: 'Mentor registered successfully!',
        token,
        role: 'mentor',
        user: { ...formatted, token, role: 'mentor' }
      });
    } catch (mErr) {
      console.error('Mentor registration error:', mErr);
      return res.status(500).json({
        success: false,
        error: 'Failed to create mentor account: ' + mErr.message
      });
    }
  }

  // 2. STUDENT REGISTRATION
  if (!name || !mobile || !email) {
    return res.status(400).json({
      success: false,
      error: 'Name, Mobile number, and Email address are required.'
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid email address.'
    });
  }

  try {
    const db = getDb();
    // Check if user already exists by email
    const existingStudent = await db.get('SELECT * FROM students WHERE LOWER(email) = ?', [cleanEmail]);

    const isAlreadyEmailVerified = Boolean(isPreVerified || preVerifiedEmails.has(cleanEmail));
    if (isAlreadyEmailVerified) {
      preVerifiedEmails.delete(cleanEmail);
    }

    if (existingStudent) {
      // If already verified, reject duplicate registration
      if (existingStudent.isVerified === 1) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists and is verified. Please log in.'
        });
      }

      if (isAlreadyEmailVerified) {
        await db.run(`
          UPDATE students SET
            name = ?, fathersName = ?, mothersName = ?, dob = ?, mobile = ?, academicGroup = ?,
            sscRoll = ?, sscReg = ?, sscBoard = ?, sscGpa = ?, sscSchool = ?, sscYear = ?,
            hscRoll = ?, hscReg = ?, hscBoard = ?, hscGpa = ?, hscCollege = ?, hscYear = ?,
            password = ?, isVerified = 1, otpHash = NULL, otpExpiresAt = NULL, otpAttempts = 0
          WHERE id = ?
        `, [
          name, fathersName || null, mothersName || null, dob || null, mobile, group || 'Science',
          ssc?.roll || null, ssc?.reg || null, ssc?.board || null, Number(ssc?.gpa) || 0.0, ssc?.school || null, ssc?.year || null,
          hsc?.roll || null, hsc?.reg || null, hsc?.board || null, Number(hsc?.gpa) || 0.0, hsc?.school || hsc?.college || null, hsc?.year || null,
          password || existingStudent.password || null,
          existingStudent.id
        ]);

        const verifiedUser = await db.get('SELECT * FROM students WHERE id = ?', [existingStudent.id]);
        return res.json({
          success: true,
          isVerified: true,
          message: 'Account registered and verified successfully!',
          user: formatStudentResponse(verifiedUser)
        });
      }

      // If existing but unverified: Enforce 60-second resend cooldown
      const now = Date.now();
      const lastSent = existingStudent.lastOtpSentAt ? new Date(existingStudent.lastOtpSentAt).getTime() : 0;
      if (now - lastSent < 60000) {
        const remainingSeconds = Math.ceil((60000 - (now - lastSent)) / 1000);
        return res.status(429).json({
          success: false,
          error: `Please wait ${remainingSeconds}s before requesting another verification code.`,
          retryAfter: remainingSeconds
        });
      }

      // Generate fresh OTP
      const otp = generateSecureOtp();
      const hashed = hashOtp(otp);
      const expiresAt = new Date(now + 5 * 60 * 1000).toISOString();
      const sentAt = new Date(now).toISOString();

      // Update student record
      const updateQuery = `
        UPDATE students SET
          name = ?, fathersName = ?, mothersName = ?, dob = ?, mobile = ?, academicGroup = ?,
          sscRoll = ?, sscReg = ?, sscBoard = ?, sscGpa = ?, sscSchool = ?, sscYear = ?,
          hscRoll = ?, hscReg = ?, hscBoard = ?, hscGpa = ?, hscCollege = ?, hscYear = ?,
          password = ?, otpHash = ?, otpExpiresAt = ?, otpAttempts = 0, lastOtpSentAt = ?
        WHERE id = ?
      `;

      await db.run(updateQuery, [
        name,
        fathersName || null,
        mothersName || null,
        dob || null,
        mobile,
        group || 'Science',
        ssc?.roll || null,
        ssc?.reg || null,
        ssc?.board || null,
        Number(ssc?.gpa) || 0.0,
        ssc?.school || null,
        ssc?.year || null,
        hsc?.roll || null,
        hsc?.reg || null,
        hsc?.board || null,
        Number(hsc?.gpa) || 0.0,
        hsc?.school || hsc?.college || null,
        hsc?.year || null,
        password || existingStudent.password || null,
        hashed,
        expiresAt,
        sentAt,
        existingStudent.id
      ]);

      // Send OTP via Gmail SMTP
      await sendOtpEmail(cleanEmail, name, otp);

      return res.json({
        success: true,
        message: 'Verification code sent to your email.',
        email: cleanEmail,
        isVerified: false
      });
    }

    // New student registration
    const now = Date.now();
    const otp = generateSecureOtp();
    const hashed = hashOtp(otp);
    const expiresAt = new Date(now + 5 * 60 * 1000).toISOString();
    const sentAt = new Date(now).toISOString();

    const insertQuery = `
      INSERT INTO students (
        name, fathersName, mothersName, dob, mobile, email, academicGroup,
        sscRoll, sscReg, sscBoard, sscGpa, sscSchool, sscYear,
        hscRoll, hscReg, hscBoard, hscGpa, hscCollege, hscYear,
        password, isVerified, otpHash, otpExpiresAt, otpAttempts, lastOtpSentAt,
        coins
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const result = await db.run(insertQuery, [
      name,
      fathersName || null,
      mothersName || null,
      dob || null,
      mobile,
      cleanEmail,
      group || 'Science',
      ssc?.roll || null,
      ssc?.reg || null,
      ssc?.board || null,
      Number(ssc?.gpa) || 0.0,
      ssc?.school || null,
      ssc?.year || null,
      hsc?.roll || null,
      hsc?.reg || null,
      hsc?.board || null,
      Number(hsc?.gpa) || 0.0,
      hsc?.school || hsc?.college || null,
      hsc?.year || null,
      password || null,
      isAlreadyEmailVerified ? 1 : 0,
      isAlreadyEmailVerified ? null : hashed,
      isAlreadyEmailVerified ? null : expiresAt,
      0,
      sentAt,
      100 // 100 Welcome Coins for new registered student!
    ]);

    if (isAlreadyEmailVerified) {
      const verifiedStudent = await db.get('SELECT * FROM students WHERE id = ?', [result.lastID]);
      return res.json({
        success: true,
        isVerified: true,
        message: 'Account registered and email verified!',
        email: cleanEmail,
        studentId: result.lastID,
        user: formatStudentResponse(verifiedStudent)
      });
    }

    // Send OTP via Gmail SMTP
    await sendOtpEmail(cleanEmail, name, otp);

    return res.json({
      success: true,
      message: 'Verification code sent to your email.',
      email: cleanEmail,
      studentId: result.lastID,
      isVerified: false
    });
  } catch (err) {
    console.error('Registration/OTP error:', err);

    if (err.message && err.message.includes('UNIQUE constraint failed: students.mobile')) {
      return res.status(409).json({
        success: false,
        error: 'A student with this mobile number has already registered.'
      });
    }

    if (err.message && (err.message.includes('Email service configuration missing') || err.message.includes('EAUTH') || err.message.includes('Invalid login'))) {
      return res.status(500).json({
        success: false,
        error: "We couldn't send the verification email. " + (err.message || 'Please verify your Gmail App Password in backend/.env.')
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to complete registration. ' + (err.message || '')
    });
  }
});

// -------------------------------------------------------------
// AUTH ROUTE 2: VERIFY 6-DIGIT EMAIL OTP
// -------------------------------------------------------------
router.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      error: 'Email and 6-digit verification code are required.'
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanOtp = String(otp).trim();

  try {
    const db = getDb();
    const user = await db.get('SELECT * FROM students WHERE LOWER(email) = ?', [cleanEmail]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address.'
      });
    }

    if (user.isVerified === 1) {
      return res.json({
        success: true,
        message: 'Account is already verified. You can log in.',
        alreadyVerified: true
      });
    }

    // Check if max attempts reached (5 maximum)
    if (user.otpAttempts >= 5) {
      await db.run('UPDATE students SET otpHash = NULL, otpExpiresAt = NULL WHERE id = ?', [user.id]);
      return res.status(400).json({
        success: false,
        error: 'Too many incorrect attempts. Please request a new verification code.'
      });
    }

    // Check if OTP expired (5 minutes)
    if (!user.otpExpiresAt || new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({
        success: false,
        error: 'This verification code has expired. Please request a new code.'
      });
    }

    // Verify hashed OTP
    const incomingHash = hashOtp(cleanOtp);
    if (incomingHash !== user.otpHash) {
      const nextAttempts = (user.otpAttempts || 0) + 1;
      await db.run('UPDATE students SET otpAttempts = ? WHERE id = ?', [nextAttempts, user.id]);

      if (nextAttempts >= 5) {
        await db.run('UPDATE students SET otpHash = NULL, otpExpiresAt = NULL WHERE id = ?', [user.id]);
        return res.status(400).json({
          success: false,
          error: 'Too many incorrect attempts. Please request a new verification code.'
        });
      }

      const remaining = 5 - nextAttempts;
      return res.status(400).json({
        success: false,
        error: `Invalid verification code. Please try again. (${remaining} attempt${remaining > 1 ? 's' : ''} left)`
      });
    }

    // Successful Verification: Clear OTP fields and activate user (with 100 welcome coins guarantee)
    await db.run(`
      UPDATE students SET
        isVerified = 1,
        otpHash = NULL,
        otpExpiresAt = NULL,
        otpAttempts = 0,
        coins = CASE WHEN coins IS NULL OR coins < 100 THEN 100 ELSE coins END
      WHERE id = ?
    `, [user.id]);

    const verifiedUser = await db.get('SELECT * FROM students WHERE id = ?', [user.id]);

    return res.json({
      success: true,
      message: 'Email verified successfully! Your EduFast account is now active.',
      user: formatStudentResponse(verifiedUser)
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during OTP verification.'
    });
  }
});

// -------------------------------------------------------------
// AUTH ROUTE 3: RESEND OTP WITH 60-SECOND COOLDOWN
// -------------------------------------------------------------
router.post('/api/auth/resend-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email address is required.'
    });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  try {
    const db = getDb();
    const user = await db.get('SELECT * FROM students WHERE LOWER(email) = ?', [cleanEmail]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address.'
      });
    }

    if (user.isVerified === 1) {
      return res.status(400).json({
        success: false,
        error: 'This account is already verified. Please log in.'
      });
    }

    // Enforce 60-second cooldown on backend
    const now = Date.now();
    const lastSent = user.lastOtpSentAt ? new Date(user.lastOtpSentAt).getTime() : 0;
    if (now - lastSent < 60000) {
      const waitSeconds = Math.ceil((60000 - (now - lastSent)) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${waitSeconds}s before requesting another code.`,
        retryAfter: waitSeconds
      });
    }

    // Generate new OTP, hash, and set 5-minute expiry
    const otp = generateSecureOtp();
    const hashed = hashOtp(otp);
    const expiresAt = new Date(now + 5 * 60 * 1000).toISOString();
    const sentAt = new Date(now).toISOString();

    await db.run(`
      UPDATE students SET
        otpHash = ?,
        otpExpiresAt = ?,
        otpAttempts = 0,
        lastOtpSentAt = ?
      WHERE id = ?
    `, [hashed, expiresAt, sentAt, user.id]);

    // Send email via Gmail SMTP
    await sendOtpEmail(cleanEmail, user.name, otp);

    return res.json({
      success: true,
      message: 'A new verification code has been sent to your email.'
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({
      success: false,
      error: "We couldn't send the verification email. " + (err.message || 'Please try again.')
    });
  }
});

// -------------------------------------------------------------
// Helper for safe password comparison (supports both bcrypt hash & legacy plain passwords, auto-migrating)
async function verifyPassword(inputPassword, storedHashOrPlain) {
  if (!storedHashOrPlain) return false;
  try {
    if (storedHashOrPlain.startsWith('$2a$') || storedHashOrPlain.startsWith('$2b$')) {
      return await bcrypt.compare(inputPassword, storedHashOrPlain);
    }
  } catch {}
  return inputPassword === storedHashOrPlain;
}

function formatMentorResponse(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || 'Mentor',
    email: row.email || '',
    mobile: row.mobile || '',
    subject: row.subject || 'Higher Mathematics',
    institution: row.institution || 'BUET',
    bio: row.bio || '',
    avatar: row.avatar || null,
    rating: Number(row.rating) || 5.0,
    doubtsResolved: Number(row.doubtsResolved) || 0,
    role: 'mentor',
    isVerified: Boolean(row.isVerified !== 0)
  };
}

// -------------------------------------------------------------
// AUTH ROUTE 4: UNIFIED MULTI-ROLE LOGIN (Student, Teacher, Mentor, Admin)
// -------------------------------------------------------------
router.post('/api/auth/login', async (req, res) => {
  const { email, identifier, username, password, role } = req.body;
  const rawId = (email || identifier || username || '').trim();

  if (!rawId || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email/Mobile/Username and password are required.'
    });
  }

  const cleanId = rawId.toLowerCase();
  const cleanMobile = rawId.replace(/[^0-9]/g, '');
  const requestedRole = (role || '').toLowerCase();

  try {
    const db = getDb();

    // -------------------------------------------------------------
    // STRICT ROLE IDENTIFICATION & ENFORCEMENT
    // Detect the account's actual registered role across all tables
    // -------------------------------------------------------------
    let registeredRole = null;
    const authUser = await db.get(
      'SELECT * FROM users_auth WHERE LOWER(email) = ? OR mobile = ?',
      [cleanId, cleanMobile || rawId]
    );

    if (authUser && authUser.role) {
      registeredRole = authUser.role.toLowerCase();
    } else {
      // Check teachers table
      const teacherRecord = await db.get(
        'SELECT * FROM teachers WHERE LOWER(email) = ? OR mobile = ? OR id = ?',
        [cleanId, rawId, rawId]
      );
      if (teacherRecord) {
        registeredRole = 'teacher';
      } else {
        // Check mentors table
        const mentorRecord = await db.get(
          'SELECT * FROM mentors WHERE LOWER(email) = ? OR mobile = ? OR id = ?',
          [cleanId, rawId, rawId]
        );
        if (mentorRecord) {
          registeredRole = 'mentor';
        } else {
          // Check students table
          const studentRecord = await db.get(
            `SELECT * FROM students 
             WHERE LOWER(email) = ? 
                OR mobile = ? 
                OR (length(?) >= 10 AND mobile LIKE ?)`,
            [cleanId, rawId, cleanMobile, `%${cleanMobile.slice(-10)}%`]
          );
          if (studentRecord) {
            registeredRole = 'student';
          }
        }
      }
    }

    // Special check for built-in admin credentials
    if (!registeredRole && (cleanId === 'admin' || cleanId === 'admin@edufast.com')) {
      registeredRole = 'admin';
    }

    // Role Mismatch Enforcement:
    // If a specific role portal/tab was requested and the account belongs to a DIFFERENT role, reject immediately!
    if (requestedRole && registeredRole && registeredRole !== requestedRole) {
      const roleLabels = {
        mentor: 'Mentor (মেন্টর)',
        student: 'Student (শিক্ষার্থী)',
        teacher: 'Teacher (শিক্ষক)',
        admin: 'Admin (অ্যাডমিন)'
      };
      const actualLabel = roleLabels[registeredRole] || registeredRole;
      const requestedLabel = roleLabels[requestedRole] || requestedRole;

      let mismatchError = `এই অ্যাকাউন্টটি একজন ${actualLabel} হিসেবে নিবন্ধিত। আপনি '${requestedLabel}' সেকশন থেকে লগইন করতে পারবেন না। অনুগ্রহ করে সঠিক '${actualLabel}' সেকশন বা ট্যাব নির্বাচন করে লগইন করুন।`;
      if (requestedRole === 'admin') {
        mismatchError = `এই অ্যাকাউন্টটি একজন ${actualLabel} হিসেবে নিবন্ধিত। অ্যাডমিন পোর্টালে আপনার অ্যাক্সেস নেই।`;
      }

      return res.status(400).json({
        success: false,
        error: mismatchError,
        roleMismatch: true,
        actualRole: registeredRole,
        requestedRole: requestedRole
      });
    }

    const effectiveRole = requestedRole || registeredRole;

    // -------------------------------------------------------------
    // 1. ADMIN AUTHENTICATION
    // -------------------------------------------------------------
    if (effectiveRole === 'admin') {
      const adminAuth = await db.get(
        "SELECT * FROM users_auth WHERE role = 'admin' AND (LOWER(email) = ? OR mobile = ? OR LOWER(email) LIKE 'admin%')",
        [cleanId, rawId]
      );

      const isValidPass = adminAuth
        ? await verifyPassword(password, adminAuth.password)
        : (password === 'admin123' || password === 'admin');

      if ((cleanId === 'admin' || cleanId === 'admin@edufast.com' || adminAuth) && isValidPass) {
        const adminPayload = {
          id: adminAuth ? adminAuth.id : 1,
          email: adminAuth?.email || 'admin@edufast.com',
          name: 'EduFast Administrator',
          role: 'admin'
        };
        const token = generateToken(adminPayload);
        return res.json({
          success: true,
          message: 'Admin login successful!',
          token,
          role: 'admin',
          user: { ...adminPayload, token }
        });
      }

      return res.status(401).json({
        success: false,
        error: 'ভুল পাসওয়ার্ড। দয়া করে সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।'
      });
    }

    // -------------------------------------------------------------
    // 2. TEACHER AUTHENTICATION
    // -------------------------------------------------------------
    if (effectiveRole === 'teacher') {
      const teacher = await db.get(
        'SELECT * FROM teachers WHERE LOWER(email) = ? OR mobile = ? OR id = ?',
        [cleanId, rawId, rawId]
      );
      const teacherAuth = await db.get(
        "SELECT * FROM users_auth WHERE role = 'teacher' AND (LOWER(email) = ? OR mobile = ?)",
        [cleanId, rawId]
      );

      if (!teacher && !teacherAuth) {
        return res.status(401).json({
          success: false,
          error: 'No teacher account found with this email or mobile number.'
        });
      }

      const passToCheck = teacherAuth?.password || 'teacher123';
      const isValid = await verifyPassword(password, passToCheck);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'ভুল পাসওয়ার্ড। দয়া করে সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।'
        });
      }

      const formatted = teacher ? formatTeacherResponse(teacher) : {
        id: `teacher-${teacherAuth.id}`,
        name: teacherAuth.email.split('@')[0],
        email: teacherAuth.email,
        mobile: teacherAuth.mobile,
        role: 'teacher'
      };
      const token = generateToken({ id: formatted.id, email: formatted.email, role: 'teacher', name: formatted.name });
      return res.json({
        success: true,
        message: 'Teacher login successful!',
        token,
        role: 'teacher',
        user: { ...formatted, token, role: 'teacher' }
      });
    }

    // -------------------------------------------------------------
    // 3. MENTOR AUTHENTICATION
    // -------------------------------------------------------------
    if (effectiveRole === 'mentor') {
      const mentor = await db.get(
        'SELECT * FROM mentors WHERE LOWER(email) = ? OR mobile = ? OR id = ?',
        [cleanId, rawId, rawId]
      );
      const mentorAuth = await db.get(
        "SELECT * FROM users_auth WHERE role = 'mentor' AND (LOWER(email) = ? OR mobile = ?)",
        [cleanId, rawId]
      );

      if (!mentor && !mentorAuth) {
        return res.status(401).json({
          success: false,
          error: 'No mentor account found with this email or mobile number.'
        });
      }

      const passToCheck = mentorAuth?.password || 'mentor123';
      const isValid = await verifyPassword(password, passToCheck);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'ভুল পাসওয়ার্ড। দয়া করে সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।'
        });
      }

      const formatted = mentor ? formatMentorResponse(mentor) : {
        id: mentorAuth ? `mentor-${mentorAuth.id}` : 'mentor-default',
        name: 'Academic Mentor',
        email: mentorAuth?.email || cleanId,
        role: 'mentor'
      };
      const token = generateToken({ id: formatted.id, email: formatted.email, role: 'mentor', name: formatted.name });
      return res.json({
        success: true,
        message: 'Mentor login successful!',
        token,
        role: 'mentor',
        user: { ...formatted, token, role: 'mentor' }
      });
    }

    // -------------------------------------------------------------
    // 4. STUDENT AUTHENTICATION
    // -------------------------------------------------------------
    if (effectiveRole === 'student') {
      const studentAuth = await db.get(
        "SELECT * FROM users_auth WHERE role = 'student' AND (LOWER(email) = ? OR mobile = ?)",
        [cleanId, cleanMobile || rawId]
      );

      const student = await db.get(
        `SELECT * FROM students 
         WHERE LOWER(email) = ? 
            OR mobile = ? 
            OR (length(?) >= 10 AND mobile LIKE ?)`,
        [cleanId, rawId, cleanMobile, `%${cleanMobile.slice(-10)}%`]
      );

      if (!studentAuth && !student) {
        return res.status(401).json({
          success: false,
          error: 'কোনো শিক্ষার্থী অ্যাকাউন্ট পাওয়া যায়নি। সঠিক ইমেইল বা মোবাইল নম্বর দিন।'
        });
      }

      const passToCheck = studentAuth?.password || student?.password;
      if (passToCheck) {
        const isPassValid = await verifyPassword(password, passToCheck);
        if (!isPassValid) {
          return res.status(401).json({
            success: false,
            error: 'ভুল পাসওয়ার্ড। দয়া করে সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।'
          });
        }
      }

      if (student) {
        if (student.isVerified === 0) {
          const otp = generateSecureOtp();
          const hashed = hashOtp(otp);
          const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          const sentAt = new Date().toISOString();

          await db.run(`
            UPDATE students SET
              otpHash = ?,
              otpExpiresAt = ?,
              otpAttempts = 0,
              lastOtpSentAt = ?
            WHERE id = ?
          `, [hashed, expiresAt, sentAt, student.id]);

          try {
            await sendOtpEmail(student.email, student.name, otp);
          } catch (e) {
            console.warn('[Login OTP Send Warning]:', e.message);
          }

          return res.status(403).json({
            success: false,
            isVerified: false,
            requiresVerification: true,
            email: student.email,
            error: 'Please verify your email before logging in. A 6-digit OTP code has been sent to your inbox.'
          });
        }

        const formatted = formatStudentResponse(student);
        const token = generateToken({ id: formatted.id, email: formatted.email, role: 'student', name: formatted.name });
        return res.json({
          success: true,
          message: 'Login successful!',
          token,
          role: 'student',
          user: { ...formatted, token, role: 'student' }
        });
      }

      if (studentAuth) {
        const formatted = { id: studentAuth.id, email: studentAuth.email, name: 'Student', role: 'student' };
        const token = generateToken({ id: formatted.id, email: formatted.email, role: 'student', name: formatted.name });
        return res.json({
          success: true,
          token,
          role: 'student',
          user: { ...formatted, token, role: 'student' }
        });
      }
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. No account found with this email or mobile number.'
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while logging in: ' + err.message
    });
  }
});

// GET /api/auth/me - Protected Route to fetch current logged in session
router.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const db = getDb();
    const { id, email, role } = req.user;

    if (role === 'teacher') {
      const teacher = await db.get('SELECT * FROM teachers WHERE id = ? OR LOWER(email) = ?', [id, (email || '').toLowerCase()]);
      if (!teacher) return res.status(404).json({ success: false, error: 'Teacher not found' });
      return res.json({ success: true, role: 'teacher', user: formatTeacherResponse(teacher) });
    }

    if (role === 'mentor') {
      const mentor = await db.get('SELECT * FROM mentors WHERE id = ? OR LOWER(email) = ?', [id, (email || '').toLowerCase()]);
      if (!mentor) return res.status(404).json({ success: false, error: 'Mentor not found' });
      return res.json({ success: true, role: 'mentor', user: formatMentorResponse(mentor) });
    }

    if (role === 'admin') {
      return res.json({
        success: true,
        role: 'admin',
        user: { id: 'admin', name: 'EduFast Administrator', email: 'admin@edufast.com', role: 'admin' }
      });
    }

    // Default: student
    const student = await db.get('SELECT * FROM students WHERE id = ? OR LOWER(email) = ?', [id, (email || '').toLowerCase()]);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });
    return res.json({ success: true, role: 'student', user: formatStudentResponse(student) });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve profile: ' + err.message });
  }
});

// -------------------------------------------------------------
// TEACHER API: PROFILE, REGISTRATION & UPDATE
// -------------------------------------------------------------
function formatTeacherResponse(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name || 'Instructor',
    email: row.email || '',
    mobile: row.mobile || '',
    fathersName: row.fathersName || '',
    dob: row.dob || '',
    group: row.academicGroup || row.group || 'Science',
    wing: row.academicGroup || row.group || 'Science',
    subject: row.subject || 'Higher Mathematics',
    institution: row.institution || '',
    qualification: row.qualification || '',
    experience: row.experience || '5+ Years',
    designation: row.designation || 'Senior Instructor',
    department: row.department || `${row.designation || 'Senior Instructor'}, ${row.academicGroup || 'Science'} Wing`,
    bio: row.bio || '',
    avatar: row.avatar || null,
    rating: Number(row.rating) || 5.0,
    studentsCount: Number(row.studentsCount) || 0,
    coursesCount: Number(row.coursesCount) || 0,
    liveHours: Number(row.liveHours) || 0,
    isVerified: Boolean(row.isVerified !== 0)
  };
}

// 1. GET Teacher Profile
router.get('/api/teachers/profile', async (req, res) => {
  try {
    const db = getDb();
    const { email, id } = req.query;
    if (!email && !id) {
      return res.status(400).json({ success: false, error: 'Teacher email or id is required.' });
    }

    const teacher = email
      ? await db.get('SELECT * FROM teachers WHERE LOWER(email) = LOWER(?)', [String(email).trim()])
      : await db.get('SELECT * FROM teachers WHERE id = ?', [id]);

    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher profile not found.' });
    }

    return res.json({
      success: true,
      teacher: formatTeacherResponse(teacher)
    });
  } catch (err) {
    console.error('Get teacher profile error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch teacher profile.' });
  }
});

// 2. REGISTER Teacher
router.post('/api/teachers/register', async (req, res) => {
  try {
    const db = getDb();
    const {
      name, email, mobile, fathersName, dob, group, subject, institution,
      qualification, experience, designation, bio, password
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required for teacher.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const teacherId = req.body.id || `teacher-${Date.now()}`;
    const department = req.body.department || `${designation || 'Senior Instructor'}, ${group || 'Science'} Wing`;

    // Check existing
    const existing = await db.get('SELECT * FROM teachers WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing) {
      await db.run(`
        UPDATE teachers SET
          name = ?, mobile = ?, fathersName = ?, dob = ?, academicGroup = ?,
          subject = ?, institution = ?, qualification = ?, experience = ?,
          designation = ?, department = ?, bio = ?, isVerified = 1
        WHERE id = ?
      `, [
        name, mobile || existing.mobile, fathersName || existing.fathersName, dob || existing.dob,
        group || existing.academicGroup, subject || existing.subject, institution || existing.institution,
        qualification || existing.qualification, experience || existing.experience,
        designation || existing.designation, department, bio || existing.bio, existing.id
      ]);

      const updated = await db.get('SELECT * FROM teachers WHERE id = ?', [existing.id]);
      return res.json({
        success: true,
        message: 'Teacher profile updated.',
        teacher: formatTeacherResponse(updated)
      });
    }

    await db.run(`
      INSERT INTO teachers (
        id, name, email, mobile, fathersName, dob, academicGroup, subject,
        institution, qualification, experience, designation, department, bio,
        rating, studentsCount, coursesCount, liveHours, isVerified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      teacherId, name, cleanEmail, mobile || '', fathersName || '', dob || '',
      group || 'Science', subject || 'Higher Mathematics', institution || '',
      qualification || '', experience || '5+ Years', designation || 'Senior Instructor',
      department, bio || '', 5.0, 0, 0, 0
    ]);

    // Also register in users_auth
    if (password) {
      await db.run('INSERT OR IGNORE INTO users_auth (role, email, mobile, password, isVerified) VALUES (?, ?, ?, ?, 1)',
        ['teacher', cleanEmail, mobile || `017${Date.now().toString().slice(-8)}`, password]);
    }

    const created = await db.get('SELECT * FROM teachers WHERE id = ?', [teacherId]);
    return res.json({
      success: true,
      message: 'Teacher registered successfully.',
      teacher: formatTeacherResponse(created)
    });
  } catch (err) {
    console.error('Teacher register error:', err);
    return res.status(500).json({ success: false, error: 'Failed to register teacher: ' + err.message });
  }
});

// 3. UPDATE Teacher Profile
router.post('/api/teachers/update-profile', async (req, res) => {
  try {
    const db = getDb();
    const {
      id, email, name, fathersName, dob, mobile, group, wing,
      subject, institution, qualification, experience, designation, department,
      bio, avatar
    } = req.body;

    if (!id && !email) {
      return res.status(400).json({ success: false, error: 'Teacher ID or Email is required.' });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    let teacher = null;
    if (id) {
      teacher = await db.get('SELECT * FROM teachers WHERE id = ?', [id]);
    }
    if (!teacher && cleanEmail) {
      teacher = await db.get('SELECT * FROM teachers WHERE LOWER(email) = ?', [cleanEmail]);
    }

    const targetGroup = group || wing || teacher?.academicGroup || 'Science';
    const targetDept = department || `${designation || teacher?.designation || 'Instructor'}, ${targetGroup} Wing`;

    if (teacher) {
      await db.run(`
        UPDATE teachers SET
          name = COALESCE(?, name),
          mobile = COALESCE(?, mobile),
          fathersName = COALESCE(?, fathersName),
          dob = COALESCE(?, dob),
          academicGroup = COALESCE(?, academicGroup),
          subject = COALESCE(?, subject),
          institution = COALESCE(?, institution),
          qualification = COALESCE(?, qualification),
          experience = COALESCE(?, experience),
          designation = COALESCE(?, designation),
          department = COALESCE(?, department),
          bio = COALESCE(?, bio),
          avatar = COALESCE(?, avatar)
        WHERE id = ?
      `, [
        name || null, mobile || null, fathersName || null, dob || null, targetGroup,
        subject || null, institution || null, qualification || null, experience || null,
        designation || null, targetDept, bio || null, avatar || null, teacher.id
      ]);

      const updated = await db.get('SELECT * FROM teachers WHERE id = ?', [teacher.id]);
      return res.json({
        success: true,
        message: 'Teacher profile updated successfully.',
        teacher: formatTeacherResponse(updated)
      });
    } else {
      // Create if not found
      const newId = id || `teacher-${Date.now()}`;
      await db.run(`
        INSERT INTO teachers (
          id, name, email, mobile, fathersName, dob, academicGroup, subject,
          institution, qualification, experience, designation, department, bio, avatar, isVerified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        newId, name || 'Instructor', cleanEmail || '', mobile || '', fathersName || '', dob || '',
        targetGroup, subject || 'Higher Mathematics', institution || '', qualification || '',
        experience || '5+ Years', designation || 'Senior Instructor', targetDept, bio || '', avatar || null
      ]);

      const created = await db.get('SELECT * FROM teachers WHERE id = ?', [newId]);
      return res.json({
        success: true,
        message: 'Teacher profile created successfully.',
        teacher: formatTeacherResponse(created)
      });
    }
  } catch (err) {
    console.error('Teacher update-profile error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update teacher profile: ' + err.message });
  }
});

module.exports = router;

