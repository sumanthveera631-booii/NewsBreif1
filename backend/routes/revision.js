const express = require('express');
const mongoose = require('mongoose');
const { ensureAuthenticated } = require('../middleware/auth');
const RevisionQueue = require('../models/RevisionQueue');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/revision
// @desc    Get user's revision queue (daily, weekly, monthly)
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const monthEnd = new Date(now);
    monthEnd.setMonth(now.getMonth() + 1);

    const pendingItems = await RevisionQueue.find({ 
      userId: req.user.id, 
      status: 'pending' 
    })
    .populate('articleId', 'title source')
    .sort({ scheduledDate: 1 });

    const daily = pendingItems.filter(item => item.scheduledDate <= todayEnd);
    const weekly = pendingItems.filter(item => item.scheduledDate > todayEnd && item.scheduledDate <= weekEnd);
    const monthly = pendingItems.filter(item => item.scheduledDate > weekEnd && item.scheduledDate <= monthEnd);

    return res.json({ success: true, daily, weekly, monthly });
  } catch (error) {
    console.error("Error fetching revision queue:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route   POST /api/revision/schedule
// @desc    Schedule an article for revision
router.post('/schedule', ensureAuthenticated, async (req, res) => {
  try {
    const { articleId, intervalDays } = req.body;

    if (!articleId || !intervalDays) {
      return res.status(400).json({ error: "articleId and intervalDays are required" });
    }

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + parseInt(intervalDays, 10));

    const existingItem = await RevisionQueue.findOne({
      userId: req.user.id,
      articleId,
      status: "pending"
    });

    if (existingItem) {
      existingItem.scheduledDate = scheduledDate;
      await existingItem.save();
      return res.json({ success: true, item: existingItem, message: "Updated existing schedule" });
    }

    const newItem = await RevisionQueue.create({
      userId: req.user.id,
      articleId,
      scheduledDate,
      status: "pending"
    });

    return res.json({ success: true, item: newItem });
  } catch (error) {
    console.error("Error scheduling revision:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// @route   POST /api/revision/complete
// @desc    Mark a revision as completed
router.post('/complete', ensureAuthenticated, async (req, res) => {
  try {
    const { revisionId } = req.body;

    if (!revisionId || !mongoose.isValidObjectId(revisionId)) {
      return res.status(400).json({ error: "Invalid Revision ID" });
    }

    const revisionItem = await RevisionQueue.findOneAndUpdate(
      { _id: revisionId, userId: req.user.id, status: "pending" },
      { status: "completed", completedAt: new Date() },
      { new: true }
    );

    if (!revisionItem) {
      return res.status(404).json({ error: "Revision item not found or already completed" });
    }

    const user = await User.findById(req.user.id);
    if (user) {
      user.xp = (user.xp || 0) + 5;
      await user.save();
    }

    return res.json({ success: true, revisionItem, userXp: user?.xp });
  } catch (error) {
    console.error("Error completing revision card:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
