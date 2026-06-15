require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./models/Article');

async function fixEmptyCategories() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await Article.updateMany(
    { categories: { $size: 0 } },
    { $set: { categories: ['upsc', 'banking', 'ssc_cgl'] } }
  );
  console.log(`Fixed ${result.modifiedCount} articles with empty categories.`);
  process.exit(0);
}

fixEmptyCategories();
