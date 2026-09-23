const express = require('express');
const router = express.Router();
const { scrapeResult } = require('../services/scraperService');

// ROUTE: Fetch and verify result from education board portal
router.post('/api/fetch-result', async (req, res) => {
  const { examType, roll, reg, board, year } = req.body;

  if (!examType || !roll || !reg || !board || !year) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters: examType, roll, reg, board, year.'
    });
  }

  const result = await scrapeResult(examType, board, year, roll, reg);
  if (result.success) {
    return res.json(result);
  } else {
    return res.status(500).json(result);
  }
});

module.exports = router;
