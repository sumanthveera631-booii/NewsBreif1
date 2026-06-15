const express = require('express');
const mongoose = require('mongoose');
const { ensureAuthenticated } = require('../middleware/auth');
const Article = require('../models/Article');
const router = express.Router();

// @route   GET /api/articles
// @desc    Get all articles with filters
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const { date, category } = req.query;
    
    let query = {};
    if (date) {
      query.dateString = date;
    }
    if (category && category.trim() !== '' && category !== 'All') {
      query.categories = category.toLowerCase();
    }

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .select('-content -quiz -summaryDeepDive');

    const total = await Article.countDocuments(query);

    return res.json({
      success: true,
      articles,
      pagination: {
        total,
        page: 1,
        limit: articles.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// @route   GET /api/articles/:id
// @desc    Get single article by id
router.get('/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid Article ID' });
  }

  try {
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    return res.json({ article });
  } catch (error) {
    console.error('Error fetching article details:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
