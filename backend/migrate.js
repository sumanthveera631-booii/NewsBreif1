require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./models/Article');
const { generateEnrichedContentWithFallback } = require('./services/ai');

async function migrateData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB. Starting migration...');

    const articles = await Article.find({});
    console.log(`Found ${articles.length} total articles.`);

    let dateStringCount = 0;
    let aiEnrichCount = 0;

    for (const article of articles) {
      let needsSave = false;

      // 1. Backfill dateString if missing so "Yesterday" tab works
      if (!article.dateString) {
        if (article.publishedDate) {
          article.dateString = article.publishedDate;
        } else if (article.date) {
          const istOffset = 5.5 * 60 * 60 * 1000;
          article.dateString = new Date(article.date.getTime() + istOffset).toISOString().slice(0, 10);
        } else {
          // Absolute fallback for today
          const istOffset = 5.5 * 60 * 60 * 1000;
          article.dateString = new Date(Date.now() + istOffset).toISOString().slice(0, 10);
        }
        needsSave = true;
        dateStringCount++;
      }

      // 2. Fix the "all 3 tabs have the same articles" issue
      // Articles that hit the old circuit breaker have 3 categories and 0 quizzes.
      if (article.categories && article.categories.length === 3 && (!article.quiz || article.quiz.length === 0)) {
        console.log(`Re-analyzing article: ${article.title}`);
        try {
          const enriched = await generateEnrichedContentWithFallback(article.title, article.content);
          
          if (enriched && enriched.categories && enriched.categories.length > 0 && enriched.aiEnriched !== false) {
            article.categories = enriched.categories.map(c => c.toLowerCase());
            article.bulletPoints = enriched.bulletPoints || [];
            article.wordSummary = enriched.wordSummary || '';
            article.deepDive = enriched.deepDive || '';
            article.quiz = enriched.quiz || [];
            article.mcqs = enriched.quiz || [];
            needsSave = true;
            aiEnrichCount++;
          }
        } catch (aiErr) {
          console.error(`AI Enrichment failed for ${article.title}:`, aiErr.message);
        }
      }

      if (needsSave) {
        await article.save();
      }
    }

    console.log(`Migration complete!`);
    console.log(`Backfilled dateString for ${dateStringCount} articles.`);
    console.log(`Re-enriched ${aiEnrichCount} articles to fix overlapping categories.`);
    process.exit(0);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateData();
