const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  completionTime: { type: Number, required: true }, // in seconds
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', QuizAttemptSchema);
