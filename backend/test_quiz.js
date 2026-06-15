require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./models/Article');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const doc = await Article.findOne({
    $or: [
      { 'quiz.0': { $exists: true } },
      { 'mcqs.0': { $exists: true } }
    ]
  });
  console.log(doc ? 'Found quiz' : 'No quizzes at all');
  if (doc) {
    console.log(JSON.stringify(doc.quiz && doc.quiz.length ? doc.quiz : doc.mcqs, null, 2));
  }
  process.exit(0);
}
test();
