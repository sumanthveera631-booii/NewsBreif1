require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./models/Article');

async function fixDates() {
  await mongoose.connect(process.env.MONGODB_URI);
  const articles = await Article.find();
  let count = 0;
  for (const article of articles) {
    if (!article.publishedDate) {
      // Derive from date
      const dateStr = article.date.toISOString().slice(0, 10);
      article.publishedDate = dateStr;
      await article.save();
      count++;
    }
  }
  console.log(`Updated ${count} articles with missing publishedDate.`);
  
  // Now list all unique publishedDates
  const dates = await Article.distinct('publishedDate');
  console.log('Available publishedDates:', dates);

  // Print yesterday's date in IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  const yesterdayMillis = Date.now() + istOffset - (24 * 60 * 60 * 1000);
  console.log('Yesterday IST:', new Date(yesterdayMillis).toISOString().slice(0, 10));

  process.exit(0);
}
fixDates();
