const express = require('express');
const { runDailyScrapePipeline } = require('../services/scraper');
const router = express.Router();

const cronSecret = process.env.CRON_SECRET || 'default-cron-secret-key';

// @route   GET or POST /api/cron/daily
// @desc    Run the daily RSS scraping & AI pipeline manually
router.all('/daily', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '') || req.query.key;

  const isAdminSession = req.isAuthenticated && req.isAuthenticated() && req.user?.email === process.env.ADMIN_EMAIL;
  const isValidToken = token && token === cronSecret;

  if (!isAdminSession && !isValidToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const pipelineResult = await runDailyScrapePipeline();
    if (!pipelineResult.success) {
      return res.status(500).json({ success: false, error: pipelineResult.error });
    }
    return res.json({ success: true, ...pipelineResult });
  } catch (error) {
    console.error('Manual cron trigger failed:', error);
    return res.status(500).json({ success: false, error: 'Pipeline execution failed' });
  }
});

module.exports = router;
