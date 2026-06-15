const express = require('express');
const mongoose = require('mongoose');
const { ensureAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Article = require('../models/Article');
const QuizAttempt = require('../models/QuizAttempt');
const RevisionQueue = require('../models/RevisionQueue');
const { triggerManualScrape } = require('../cron/pipeline');
const router = express.Router();

// @route   GET /api/admin/metrics
// @desc    Get admin dashboard metrics
router.get('/metrics', ensureAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalArticles = await Article.countDocuments();
    const totalAttempts = await QuizAttempt.countDocuments();
    const totalPendingRevisions = await RevisionQueue.countDocuments({ status: "pending" });

    // Mock pipeline fail logs
    const pipelineFails = [
      { id: "1", date: new Date().toISOString(), source: "PRS Legislative Research", reason: "Invalid XML encoding format" },
      { id: "2", date: new Date().toISOString(), source: "The Hindu RSS Feed", reason: "Gemini API Timeout error on generation" }
    ];

    // Estimated Gemini Token cost usage metric based on articles processed
    const processedArticlesCount = totalArticles;
    const estGeminiTokensUsed = processedArticlesCount * 2200; 
    const estUsageCostUSD = estGeminiTokensUsed * 0.000075 / 1000;

    return res.json({
      success: true,
      metrics: {
        totalUsers,
        totalArticles,
        totalAttempts,
        totalPendingRevisions,
        mongoState: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
        geminiTokens: estGeminiTokensUsed,
        geminiCost: estUsageCostUSD.toFixed(4),
        failedArticles: pipelineFails
      }
    });
  } catch (error) {
    console.error("Admin metrics fetch failed:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route   POST /api/admin/scrape-now
// @desc    Manually trigger the scraping pipeline
router.post('/scrape-now', ensureAdmin, async (req, res) => {
  try {
    const result = await triggerManualScrape();
    return res.status(202).json({ success: true, ...result });
  } catch (error) {
    console.error('[ADMIN SCRAPE] Manual scrape endpoint failed:', error);
    return res.status(500).json({ success: false, message: 'Manual scrape trigger failed.' });
  }
});

module.exports = router;
