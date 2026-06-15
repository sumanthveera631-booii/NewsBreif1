const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { runDailyScrapePipeline } = require('../services/scraper');

// @route   GET /api/admin/force-sync-today
// @desc    Clear existing articles and force ingest today's live news
router.get('/force-sync-today', async (req, res) => {
  try {
    // Data retention constraint: Never delete existing articles
    const data = await runDailyScrapePipeline();
    return res.status(200).json({
      success: true,
      countStored: data.articlesProcessed || 0,
      message: 'Database updated with today\'s live verification news successfully!',
      pipelineReport: data
    });
  } catch (error) {
    console.error('Force sync failed:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
