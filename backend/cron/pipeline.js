const cron = require('node-cron');
const Article = require('../models/Article');
const { runDailyScrapePipeline } = require('../services/scraper');

let isScraping = false;

async function executePipeline(triggerType) {
  if (isScraping) {
    console.log(`[PIPELINE SKIP] ${triggerType} trigger skipped because a scrape is already running.`);
    return { success: false, skipped: true, reason: 'Already running' };
  }

  isScraping = true;
  console.log(`[PIPELINE START] ${triggerType} trigger started.`);

  try {
    const result = await runDailyScrapePipeline();
    if (result && result.success) {
      console.log(`[PIPELINE SUCCESS] ${triggerType} trigger completed successfully.`);
    } else {
      console.error(`[PIPELINE FAILURE] ${triggerType} trigger finished with failure.`, result?.error || 'Unknown error');
    }
    return result;
  } catch (error) {
    console.error(`[PIPELINE ERROR] ${triggerType} trigger failed with exception:`, error);
    return { success: false, error: error.message || 'Unknown exception' };
  } finally {
    isScraping = false;
  }
}

function scheduleDailyScrape() {
  cron.schedule('0 1 * * *', async () => {
    console.log('[CRON ALERT] Initiating scheduled daily scrape pipeline (1:00 AM)...');
    await executePipeline('cron');
  });

  console.log('Cron scheduler initialized. Pipeline will run daily at 1:00 AM.');
}

async function ensureInitialScrape() {
  try {
    console.log('[BOOTUP CHECK] Triggering initial scrape pipeline...');
    return await executePipeline('bootup');
  } catch (error) {
    console.error('[BOOTUP CHECK] Bootup scrape failed:', error);
    return { success: false, error: error.message || 'Bootup scrape failed' };
  }
}

async function triggerManualScrape() {
  console.log('[MANUAL TRIGGER] Manual scrape request received. Scheduling background pipeline.');
  executePipeline('manual').catch((error) => {
    console.error('[MANUAL TRIGGER] Background pipeline error:', error);
  });
  return { message: 'Scraping pipeline manually initiated in the background.' };
}

module.exports = {
  scheduleDailyScrape,
  ensureInitialScrape,
  triggerManualScrape,
  isScraping
};
