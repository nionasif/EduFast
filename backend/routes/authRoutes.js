const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const {
  generateSecureOtp,
  hashOtp,
  sendOtpEmail,
  preRegistrationOtps,
  preVerifiedEmails
} = require('../services/otpService');

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
router.post(['/api/auth/register', '/api/save-student'], async (req, res) => {
  const { name, fathersName, mothersName, dob, mobile, email, group, ssc, hsc, password, isPreVerified } = req.body;

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
            sscRoll = ?, sscReg = ?, sscBoard = ?, sscGpa = ?, sscSchool = ?,
            hscRoll = ?, hscReg = ?, hscBoard = ?, hscGpa = ?, hscCollege = ?,
            password = ?, isVerified = 1, otpHash = NULL, otpExpiresAt = NULL, otpAttempts = 0
          WHERE id = ?
        `, [
          name, fathersName || null, mothersName || null, dob || null, mobile, group || 'Science',
          ssc?.roll || null, ssc?.reg || null, ssc?.board || null, Number(ssc?.gpa) || 0.0, ssc?.school || null,
          hsc?.roll || null, hsc?.reg || null, hsc?.board || null, Number(hsc?.gpa) || 0.0, hsc?.school || hsc?.college || null,
          password || existingStudent.password || null,
          existingStudent.id
        ]);

        const verifiedUser = await db.get('SELECT * FROM students WHERE id = ?', [existingStudent.id]);
        return res.json({
          success: true,
          isVerified: true,
          message: 'Account registered and verified successfully!',
          user: verifiedUser
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
          sscRoll = ?, sscReg = ?, sscBoard = ?, sscGpa = ?, sscSchool = ?,
          hscRoll = ?, hscReg = ?, hscBoard = ?, hscGpa = ?, hscCollege = ?,
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
        hsc?.roll || null,
        hsc?.reg || null,
        hsc?.board || null,
        Number(hsc?.gpa) || 0.0,
        hsc?.school || hsc?.college || null,
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
        sscRoll, sscReg, sscBoard, sscGpa, sscSchool,
        hscRoll, hscReg, hscBoard, hscGpa, hscCollege,
        password, isVerified, otpHash, otpExpiresAt, otpAttempts, lastOtpSentAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
      hsc?.roll || null,
      hsc?.reg || null,
      hsc?.board || null,
      Number(hsc?.gpa) || 0.0,
      hsc?.school || hsc?.college || null,
      password || null,
      isAlreadyEmailVerified ? 1 : 0,
      isAlreadyEmailVerified ? null : hashed,
      isAlreadyEmailVerified ? null : expiresAt,
      0,
      sentAt
    ]);

    if (isAlreadyEmailVerified) {
      const verifiedStudent = await db.get('SELECT * FROM students WHERE id = ?', [result.lastID]);
      return res.json({
        success: true,
        isVerified: true,
        message: 'Account registered and email verified!',
        email: cleanEmail,
        studentId: result.lastID,
        user: verifiedStudent
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

    // Successful Verification: Clear OTP fields and activate user
    await db.run(`
      UPDATE students SET
        isVerified = 1,
        otpHash = NULL,
        otpExpiresAt = NULL,
        otpAttempts = 0
      WHERE id = ?
    `, [user.id]);

    const verifiedUser = await db.get('SELECT * FROM students WHERE id = ?', [user.id]);

    return res.json({
      success: true,
      message: 'Email verified successfully! Your EduFast account is now active.',
      user: {
        id: verifiedUser.id,
        name: verifiedUser.name,
        email: verifiedUser.email,
        mobile: verifiedUser.mobile,
        group: verifiedUser.academicGroup,
        isVerified: true
      }
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
// AUTH ROUTE 4: LOGIN WITH EMAIL/MOBILE & PASSWORD
// -------------------------------------------------------------
router.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email/Mobile number and password are required.'
    });
  }

  const identifier = String(email).trim();
  const cleanEmail = identifier.toLowerCase();
  const cleanMobile = identifier.replace(/[^0-9]/g, '');

  try {
    const db = getDb();

    // Check if user exists by Email or Mobile Number
    const user = await db.get(
      `SELECT * FROM students 
       WHERE LOWER(email) = ? 
          OR mobile = ? 
          OR (length(?) >= 10 AND mobile LIKE ?)`,
      [cleanEmail, identifier, cleanMobile, `%${cleanMobile.slice(-10)}%`]
    );

    // Static Demo Mock User Fallback
    if (!user) {
      if (
        (cleanEmail === 'student@edufast.com' || cleanEmail === 'student' || identifier === '01823456789' || identifier === '01712345678') &&
        (password === 'password123' || password === 'student123')
      ) {
        return res.json({
          success: true,
          isVerified: true,
          message: 'Login successful!',
          user: {
            id: 9999,
            name: 'Sadman Sakib',
            email: 'student@edufast.com',
            mobile: '01823456789',
            group: 'Science',
            dob: '2006-05-14',
            isVerified: true,
            ssc: {
              roll: '109823',
              reg: '2013897456',
              board: 'Dhaka',
              gpa: 5.0,
              school: 'Dhaka Residential Model College'
            },
            hsc: {
              roll: '402834',
              reg: '2013897456',
              board: 'Dhaka',
              gpa: 5.0,
              school: 'Notre Dame College'
            },
            purchasedCourses: []
          }
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. No student account found with this email or mobile number.'
      });
    }

    // If user has a set password, verify it
    if (user.password) {
      if (user.password !== password) {
        return res.status(401).json({
          success: false,
          error: 'Invalid password. Please check and try again.'
        });
      }

      // Password matches! If the user was marked unverified, activate them immediately.
      if (user.isVerified === 0) {
        await db.run('UPDATE students SET isVerified = 1, otpHash = NULL, otpExpiresAt = NULL WHERE id = ?', [user.id]);
        user.isVerified = 1;
      }
    } else {
      // If user has NO password set in database yet:
      // If unverified, generate and send a fresh OTP immediately
      if (user.isVerified === 0) {
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
        `, [hashed, expiresAt, sentAt, user.id]);

        try {
          await sendOtpEmail(user.email, user.name, otp);
        } catch (e) {
          console.warn('[Login OTP Send Warning]:', e.message);
        }

        return res.status(403).json({
          success: false,
          isVerified: false,
          requiresVerification: true,
          email: user.email,
          error: 'Please verify your email before logging in. A 6-digit OTP code has been sent to your inbox.'
        });
      }
    }

    return res.json({
      success: true,
      isVerified: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        group: user.academicGroup,
        dob: user.dob,
        isVerified: true,
        ssc: {
          roll: user.sscRoll,
          reg: user.sscReg,
          board: user.sscBoard,
          gpa: user.sscGpa,
          school: user.sscSchool
        },
        hsc: {
          roll: user.hscRoll,
          reg: user.hscReg,
          board: user.hscBoard,
          gpa: user.hscGpa,
          school: user.hscCollege
        },
        purchasedCourses: []
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while logging in.'
    });
  }
});

module.exports = router;
