// Re-export from pipeline.js to avoid duplicate cron schedulers.
// The actual cron schedule and pipeline execution live in pipeline.js.
// This file exists for backward compatibility with any imports.
const { scheduleDailyScrape, ensureInitialScrape, triggerManualScrape } = require('./pipeline');

module.exports = { scheduleDailyScrape, ensureInitialScrape, triggerManualScrape };
