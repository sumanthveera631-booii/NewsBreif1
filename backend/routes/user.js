const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const Article = require('../models/Article');
const QuizAttempt = require('../models/QuizAttempt');
const RevisionQueue = require('../models/RevisionQueue');
const router = express.Router();
const { z } = require('zod');

// @route   GET /api/user/profile
// @desc    Get user profile with stats
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('bookmarks', 'title source date tags');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const quizAttempts = await QuizAttempt.find({ userId: req.user.id }).sort({ date: -1 }).limit(10);
    const completedRevisions = await RevisionQueue.countDocuments({ userId: req.user.id, status: 'completed' });
    const pendingRevisions = await RevisionQueue.countDocuments({ userId: req.user.id, status: 'pending' });

    res.json({
      success: true,
      user,
      quizAttempts,
      revisionStats: {
        completed: completedRevisions,
        pending: pendingRevisions
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PreferenceSchema = z.object({
  examPreference: z.enum(['UPSC', 'BANKING', 'SSC']).optional(),
  prepLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  dailyGoal: z.union([z.literal(15), z.literal(30), z.literal(60)]).optional(),
});

// @route   PUT /api/user/preference
// @desc    Update user preferences
router.put('/preference', ensureAuthenticated, async (req, res) => {
  try {
    const result = PreferenceSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid parameters', details: result.error.format() });
    }

    const updates = result.data;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// @route   POST /api/user/bookmark
// @desc    Toggle bookmark
router.post('/bookmark', ensureAuthenticated, async (req, res) => {
  try {
    const { articleId } = req.body;
    if (!articleId) return res.status(400).json({ error: 'Article ID required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isBookmarked = user.bookmarks.some((id) => id.toString() === articleId);
    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter((id) => id.toString() !== articleId);
    } else {
      user.bookmarks.push(articleId);
    }

    await user.save();
    res.json({ success: true, bookmarked: !isBookmarked, bookmarks: user.bookmarks });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// @route   POST /api/user/onboard
// @desc    Onboard user (set initial preferences)
router.post('/onboard', ensureAuthenticated, async (req, res) => {
  try {
    const result = PreferenceSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid parameters', details: result.error.format() });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        examPreference: result.data.examPreference,
        prepLevel: result.data.prepLevel,
        dailyGoal: result.data.dailyGoal,
      },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error onboarding user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
