const express = require('express');
const router = express.Router();
const {
  scrapeResult,
  findInLocalRegistry,
  startVerificationSession,
  reloadSessionCaptcha,
  submitCaptchaAndGetResult,
  cancelVerificationSession
} = require('../services/scraperService');

// ROUTE 1: Start Live Verification Session & Fetch Captcha Image from educationboardresults.gov.bd
router.post('/api/board/start-session', async (req, res) => {
  try {
    const { examType, roll, reg, board, year } = req.body;

    if (!examType || !roll || !board || !year) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: examType, roll, board, year.'
      });
    }

    // Step 1: Check if this record is already verified in local registry/db
    const cached = await findInLocalRegistry(examType, board, year, roll, reg);
    if (cached) {
      return res.json({
        success: true,
        isInstant: true,
        source: 'verified_registry',
        data: cached
      });
    }

    // Step 2: Open real-time live session on government portal
    console.log(`[API /board/start-session] Initializing live board session for Roll: ${roll}`);
    const sessionResult = await startVerificationSession(examType, board, year, roll, reg);
    return res.json(sessionResult);
  } catch (err) {
    console.error('[API /board/start-session Error]:', err.message);
    return res.status(200).json({
      success: false,
      error: err.message || 'Education Board portal is temporarily busy. You can enter GPA manually.'
    });
  }
});

// ROUTE 2: Submit 4-digit captcha and receive real-time result
router.post('/api/board/submit-captcha', async (req, res) => {
  try {
    const { sessionId, captcha } = req.body;

    if (!sessionId || !captcha) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and 4-digit Captcha are required.'
      });
    }

    console.log(`[API /board/submit-captcha] Submitting captcha for session: ${sessionId}`);
    const result = await submitCaptchaAndGetResult(sessionId, captcha);
    return res.json(result);
  } catch (err) {
    console.error('[API /board/submit-captcha Error]:', err.message);
    return res.status(200).json({
      success: false,
      error: err.message || 'Failed to submit captcha to education board portal.'
    });
  }
});

// ROUTE 3: Reload captcha image if unreadable
router.post('/api/board/reload-captcha', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required.'
      });
    }

    const result = await reloadSessionCaptcha(sessionId);
    return res.json(result);
  } catch (err) {
    return res.status(200).json({
      success: false,
      error: err.message
    });
  }
});

// ROUTE 4: Cancel verification session cleanly
router.post('/api/board/cancel-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      await cancelVerificationSession(sessionId);
    }
    return res.json({ success: true });
  } catch {
    return res.json({ success: true });
  }
});

// ROUTE 4: Legacy / Fast-track fetch result
router.post('/api/fetch-result', async (req, res) => {
  try {
    const { examType, roll, reg, board, year } = req.body;

    if (!examType || !roll || !reg || !board || !year) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: examType, roll, reg, board, year.'
      });
    }

    const result = await scrapeResult(examType, board, year, roll, reg);
    return res.json(result);
  } catch (err) {
    console.error('[API Fetch Result Error]:', err.message);
    return res.status(200).json({
      success: false,
      error: 'Education Board verification failed. You may enter GPA manually.'
    });
  }
});

module.exports = router;
