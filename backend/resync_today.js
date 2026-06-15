require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./models/Article');
const { runDailyScrapePipeline } = require('./services/scraper');

async function resyncToday() {
  await mongoose.connect(process.env.MONGODB_URI);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const todayStr = new Date(Date.now() + istOffset).toISOString().slice(0, 10);
  
  // Delete articles from today so they get re-scraped
  console.log(`Deleting articles with publishedDate: ${todayStr}`);
  const result = await Article.deleteMany({ publishedDate: todayStr });
  console.log(`Deleted ${result.deletedCount} articles.`);
  
  console.log('Running scraper...');
  await runDailyScrapePipeline();
  
  console.log('Done!');
  process.exit(0);
}

resyncToday();
