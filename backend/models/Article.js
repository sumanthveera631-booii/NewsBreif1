const mongoose = require('mongoose');

const MCQSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, required: true }
});

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  source: { type: String, required: true },
  sourceUrl: { type: String, required: true, unique: true, sparse: true },
  link: { type: String, unique: true, sparse: true },
  date: { type: Date, default: Date.now },
  dateString: { 
    type: String, 
    required: true, 
    default: function() { 
      const istOffset = 5.5 * 60 * 60 * 1000;
      return new Date(Date.now() + istOffset).toISOString().slice(0, 10);
    } 
  },
  publishedDate: { type: String, index: true },
  imageUrl: { type: String, default: '' }, // For og:image
  content: { type: String, required: true },
  importanceScore: { type: Number, required: true, min: 1, max: 100 },
  examProbabilityScore: { type: Number, required: true, min: 1, max: 100 },
  examSyllabusTags: [{ type: String }],
  categories: [{ type: String, enum: ['upsc', 'banking', 'ssc_cgl'] }],
  bulletPoints: [{ type: String, default: '' }],
  wordSummary: { type: String, default: '' },
  deepDive: { type: String, default: '' },
  summaries: {
    fifteenSecond: { type: String, default: '' },
    oneHundredWord: { type: String, default: '' },
    deepDive: { type: String, default: '' }
  },
  summary15s: { type: String, required: true },
  summary100w: { type: String, required: true },
  summaryDeepDive: { type: String, required: true },
  insights: [{ type: String, required: true }],
  quiz: [MCQSchema],
  mcqs: [MCQSchema],
  tags: [{ type: String }],
  revisionNotes: { type: String },
  exams: [{ 
    type: String, 
    enum: ['UPSC', 'BANKING', 'SSC']
  }]
}, {
  timestamps: true
});

// Index for full-text search
ArticleSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.models.Article || mongoose.model('Article', ArticleSchema);
