const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // For local authentication
  googleId: { type: String },
  authProviders: { type: [String], default: [] },
  image: { type: String },
  examPreference: { 
    type: String, 
    enum: ['UPSC', 'BANKING', 'SSC'], 
    default: 'UPSC' 
  },
  prepLevel: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced'], 
    default: 'Beginner' 
  },
  dailyGoal: { 
    type: Number, 
    enum: [15, 30, 60], 
    default: 15 
  },
  currentStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date },
  xp: { type: Number, default: 0 },
  badges: [{ type: String }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }]
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
