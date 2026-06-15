require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./models/Article');

const upscKeywords = ['government', 'policy', 'minister', 'foreign', 'environment', 'defense', 'court', 'law', 'supreme', 'parliament', 'constitution', 'international', 'summit', 'treaty', 'climate', 'election', 'modi', 'scheme', 'pib'];
const bankingKeywords = ['economy', 'bank', 'rbi', 'market', 'finance', 'trade', 'investment', 'rupee', 'inflation', 'stock', 'nirmala', 'sitharaman', 'forex', 'oil', 'crude', 'export', 'import', 'sensex', 'nifty', 'credit'];
const sscKeywords = ['railway', 'police', 'exam', 'recruitment', 'sports', 'awards', 'science', 'technology', 'states', 'cm', 'chief minister', 'local', 'arrested', 'murder', 'crime', 'regional', 'airport', 'flight', 'karnataka', 'bihar', 'kerala'];

function categorizeText(text) {
  const lowerText = text.toLowerCase();
  const categories = [];

  let upscScore = 0;
  for (const word of upscKeywords) {
    if (lowerText.includes(word)) upscScore++;
  }

  let bankingScore = 0;
  for (const word of bankingKeywords) {
    if (lowerText.includes(word)) bankingScore++;
  }

  let sscScore = 0;
  for (const word of sscKeywords) {
    if (lowerText.includes(word)) sscScore++;
  }

  // Assign categories based on scores. Allow overlap.
  if (upscScore > 0) categories.push('upsc');
  if (bankingScore > 0) categories.push('banking');
  if (sscScore > 0) categories.push('ssc_cgl');

  // Fallback if none match
  if (categories.length === 0) {
    // Random fallback or default to UPSC
    categories.push('upsc');
  }

  return categories;
}

async function runHeuristicCategorization() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB. Starting heuristic categorization...');

    const articles = await Article.find({});
    let updateCount = 0;

    for (const article of articles) {
      const fullText = (article.title + ' ' + article.content);
      const newCategories = categorizeText(fullText);

      // Only update if it's different from the existing one, or just overwrite to be safe
      article.categories = newCategories;
      await article.save();
      updateCount++;
    }

    console.log(`Successfully categorized ${updateCount} articles using heuristics!`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runHeuristicCategorization();
