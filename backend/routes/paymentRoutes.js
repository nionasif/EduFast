const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { optionalAuth, verifyToken } = require('../middleware/authMiddleware');

// Subscription Plans Catalog
const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    price: 0,
    originalPrice: 0,
    period: 'আজীবন ফ্রি',
    badge: 'Basic',
    color: '#64748b',
    features: [
      'সব সরকারি বিশ্ববিদ্যালয়ের সার্কুলার ও ডেডলাইন ট্র্যাকিং',
      '৩টি ফ্রি ফুল-লেংথ ভর্তি মডেল টেস্ট',
      'EduFast AI চ্যাটবট অ্যাসিস্ট্যান্ট',
      'জিএসটি ও ঢাবি জিপিএ এলিজিবিলিটি চেকার'
    ]
  },
  {
    id: 'pro_monthly',
    name: 'Pro Admission Pass',
    price: 499,
    originalPrice: 999,
    period: '১ মাস (৩০ দিন)',
    badge: 'জনপ্রিয় (Most Popular)',
    color: '#0d9488',
    isPopular: true,
    features: [
      'আনলিমিটেড টাইমড মডেল টেস্ট ও নেগেটিভ মার্কিং',
      'প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান',
      'AI স্মার্ট টাইমটেবিল ও দৈনিক রিভিশন রুটিন',
      '২৪/৭ বুয়েট ও মেডিকেল মেন্টর ডাউট সলভ প্যানেল',
      'সকল অধ্যায়ের প্রশ্নব্যাংক পিডিএফ ডাউনলোড'
    ]
  },
  {
    id: 'pro_varsity',
    name: 'Varsity Conqueror',
    price: 1499,
    originalPrice: 2999,
    period: 'সম্পূর্ণ ভর্তি সেশন (৬ মাস)',
    badge: 'সেরা ডিল (Best Value)',
    color: '#d97706',
    features: [
      'সকল প্রিমিয়াম কোর্সে ফ্রি ও আনলিমিটেড অ্যাক্সেস',
      'লাইভ ইন্টারেক্টিভ ক্লাস ও ক্লাসরুম রেকর্ডিং',
      'বিগত ১০ বছরের প্রশ্নব্যাংক সল্যুশন লেকচার',
      '১-অন-১ বুয়েট/ঢাবি মেন্টর গাইডেন্স ও স্ট্র্যাটেজি সেশন',
      'পরীক্ষার আগের স্পেশাল লাস্ট-মিনিট সুপার সাজেশন'
    ]
  }
];

/**
 * 1. GET /api/payment/plans - Get all subscription packages
 */
router.get('/api/payment/plans', (req, res) => {
  return res.json({
    success: true,
    data: SUBSCRIPTION_PLANS
  });
});

/**
 * 2. POST /api/payment/checkout - Process bKash / Nagad / Rocket transaction
 */
router.post('/api/payment/checkout', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const {
      paymentMethod = 'bKash', // 'bKash' | 'Nagad' | 'Rocket'
      paymentType = 'subscription', // 'subscription' | 'course'
      targetId,
      targetTitle,
      amount,
      senderNumber,
      pin, // simulated validation
      studentEmail: reqEmail,
      studentName: reqName,
      studentMobile: reqMobile
    } = req.body;

    const studentEmail = req.user?.email || reqEmail;
    const studentName = req.user?.name || reqName || 'Student';
    const studentMobile = req.user?.mobile || reqMobile || senderNumber;

    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        error: 'অনুগ্রহ করে লগইন করুন অথবা আপনার ইমেইল প্রদান করুন।'
      });
    }

    if (!senderNumber || String(senderNumber).replace(/\D/g, '').length < 11) {
      return res.status(400).json({
        success: false,
        error: 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন।'
      });
    }

    const payAmount = Number(amount) || (targetId === 'pro_monthly' ? 499 : targetId === 'pro_varsity' ? 1499 : 500);

    // Generate unique TrxID
    const prefix = paymentMethod.toUpperCase().slice(0, 3);
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transactionId = `${prefix}${Date.now().toString().slice(-6)}${randomHex}`;
    const paymentId = 'pay_' + Date.now();

    // 1. Save payment record
    await db.run(
      `INSERT INTO payments 
       (id, studentEmail, studentName, studentMobile, amount, currency, paymentMethod, paymentType, targetId, targetTitle, transactionId, senderNumber, status)
       VALUES (?, ?, ?, ?, ?, 'BDT', ?, ?, ?, ?, ?, ?, 'completed')`,
      [
        paymentId,
        studentEmail.toLowerCase(),
        studentName,
        studentMobile,
        payAmount,
        paymentMethod,
        paymentType,
        targetId || 'pro_monthly',
        targetTitle || 'EduFast Premium',
        transactionId,
        senderNumber
      ]
    );

    let planExpiry = null;

    // 2. If subscription, upgrade student to Pro in database
    if (paymentType === 'subscription') {
      const now = new Date();
      const daysToAdd = targetId === 'pro_varsity' ? 180 : 30;
      now.setDate(now.getDate() + daysToAdd);
      planExpiry = now.toISOString();

      await db.run(
        `UPDATE students SET
          isPremium = 1,
          subscriptionPlan = ?,
          subscriptionExpiresAt = ?
         WHERE LOWER(email) = LOWER(?)`,
        [targetId || 'pro_monthly', planExpiry, studentEmail.toLowerCase()]
      );
    }

    // 3. If course purchase, automatically enroll student into course
    if (paymentType === 'course' && targetId) {
      const existingEnroll = await db.get(
        'SELECT * FROM enrollments WHERE LOWER(studentEmail) = LOWER(?) AND courseId = ?',
        [studentEmail.toLowerCase(), targetId]
      );

      if (!existingEnroll) {
        await db.run(
          `INSERT INTO enrollments (studentEmail, studentName, courseId, courseTitle, progressPercent)
           VALUES (?, ?, ?, ?, 0)`,
          [studentEmail.toLowerCase(), studentName, targetId, targetTitle || 'Enrolled Course']
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: `🎉 অভিনন্দন! ${paymentMethod} এর মাধ্যমে ৳${payAmount} সফলভাবে পরিশোধ করা হয়েছে।`,
      data: {
        paymentId,
        transactionId,
        paymentMethod,
        amount: payAmount,
        targetTitle: targetTitle || 'EduFast Pro Pass',
        paymentType,
        senderNumber,
        paidAt: new Date().toISOString(),
        expiresAt: planExpiry,
        isPremium: true
      }
    });

  } catch (err) {
    console.error('Payment checkout error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'পেমেন্ট সম্পন্ন করতে সমস্যা হয়েছে: ' + err.message
    });
  }
});

/**
 * 3. GET /api/payment/subscription-status - Get current student's subscription info
 */
router.get('/api/payment/subscription-status', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const studentEmail = req.user?.email || req.query.email || req.query.studentEmail;

    if (!studentEmail) {
      return res.json({
        success: true,
        data: { isPremium: false, plan: 'free', planName: 'Free Starter' }
      });
    }

    const student = await db.get(
      'SELECT isPremium, subscriptionPlan, subscriptionExpiresAt FROM students WHERE LOWER(email) = LOWER(?)',
      [studentEmail.toLowerCase()]
    );

    if (!student) {
      return res.json({
        success: true,
        data: { isPremium: false, plan: 'free', planName: 'Free Starter' }
      });
    }

    let isPremium = Boolean(student.isPremium);
    if (isPremium && student.subscriptionExpiresAt) {
      const expiry = new Date(student.subscriptionExpiresAt);
      if (expiry < new Date()) {
        isPremium = false; // Expired
      }
    }

    const planObj = SUBSCRIPTION_PLANS.find(p => p.id === student.subscriptionPlan) || SUBSCRIPTION_PLANS[0];

    return res.json({
      success: true,
      data: {
        isPremium,
        plan: student.subscriptionPlan || 'free',
        planName: planObj.name,
        expiresAt: student.subscriptionExpiresAt,
        badge: isPremium ? 'PRO MEMBER' : 'FREE'
      }
    });
  } catch (err) {
    console.error('Subscription status check error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve subscription status.' });
  }
});

/**
 * 4. GET /api/payment/history - List student's payment receipts
 */
router.get('/api/payment/history', optionalAuth, async (req, res) => {
  try {
    const db = getDb();
    const studentEmail = req.user?.email || req.query.email || req.query.studentEmail;

    if (!studentEmail) {
      return res.status(400).json({ success: false, error: 'Student email is required.' });
    }

    const rows = await db.all(
      `SELECT * FROM payments WHERE LOWER(studentEmail) = LOWER(?) ORDER BY createdAt DESC`,
      [studentEmail.toLowerCase()]
    );

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    console.error('Payment history error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve payment history.' });
  }
});

module.exports = router;
