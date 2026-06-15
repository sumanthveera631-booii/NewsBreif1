const mongoose = require('mongoose');

const RevisionQueueSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  articleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Article', 
    required: true 
  },
  scheduledDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed'], 
    default: 'pending' 
  },
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness for pending items per user/article
RevisionQueueSchema.index({ userId: 1, articleId: 1, scheduledDate: 1 }, { unique: true });

module.exports = mongoose.models.RevisionQueue || mongoose.model('RevisionQueue', RevisionQueueSchema);
