const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const Article = require('../models/Article');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const router = express.Router();

// @route   GET /api/quiz/questions
// @desc    Get random questions for quiz
router.get('/questions', ensureAuthenticated, async (req, res) => {
  try {
    const { count = 5, exam } = req.query;
    const numQuestions = parseInt(count, 10);

    const user = await User.findById(req.user.id);
    const examPreference = (exam || user?.examPreference || 'UPSC').toUpperCase();

    const articles = await Article.aggregate([
      {
        $match: {
          exams: examPreference,
          $or: [
            { quiz: { $exists: true, $not: { $size: 0 } } },
            { mcqs: { $exists: true, $not: { $size: 0 } } }
          ]
        }
      },
      { $sample: { size: numQuestions } },
      { $project: { _id: 1, quiz: 1, mcqs: 1, title: 1, source: 1 } }
    ]);

    if (!articles || articles.length === 0) {
      return res.status(404).json({ error: 'No quiz questions available for your preference currently.' });
    }

    const questions = articles.flatMap((article) => {
      const sourceList = Array.isArray(article.quiz) && article.quiz.length > 0 ? article.quiz : article.mcqs || [];
      if (!sourceList.length) return [];
      const randomQuiz = sourceList[Math.floor(Math.random() * sourceList.length)];
      
      // Resolve correctAnswer text to option index for the frontend
      let correctAnswerIndex = -1;
      const rawAnswer = randomQuiz.correctAnswer;
      
      // If it's already an index string from older bugs (e.g. "1")
      if (typeof rawAnswer === 'number' || (typeof rawAnswer === 'string' && !isNaN(parseInt(rawAnswer)) && String(parseInt(rawAnswer)) === rawAnswer)) {
        correctAnswerIndex = parseInt(rawAnswer);
      } else {
        const correctAnswerText = String(rawAnswer || '').trim().toLowerCase();
        correctAnswerIndex = randomQuiz.options.findIndex(
          opt => opt.trim().toLowerCase() === correctAnswerText
        );
      }

      // Skip malformed quiz questions where the answer doesn't match any option
      if (correctAnswerIndex === -1 || correctAnswerIndex >= randomQuiz.options.length) return [];

      return {
        _id: randomQuiz._id,
        articleId: article._id,
        articleTitle: article.title,
        source: article.source,
        question: randomQuiz.question,
        options: randomQuiz.options,
        correctAnswer: correctAnswerIndex,
        explanation: randomQuiz.explanation
      };
    });

    res.json({ questions });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// @route   POST /api/quiz/attempt
// @desc    Submit a quiz attempt
router.post('/attempt', ensureAuthenticated, async (req, res) => {
  try {
    const { score, totalQuestions, completionTime } = req.body;

    if (score === undefined || !totalQuestions || !completionTime) {
      return res.status(400).json({ error: 'Missing required quiz metrics' });
    }

    const attempt = await QuizAttempt.create({
      userId: req.user.id,
      score,
      totalQuestions,
      completionTime
    });

    const user = await User.findById(req.user.id);
    let xpAwarded = score * 10;
    let newBadges = [];
    if (user) {
      const today = new Date().setHours(0, 0, 0, 0);
      const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).setHours(0, 0, 0, 0) : null;

      if (!lastActive || lastActive < today) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastActive === yesterday.getTime()) {
          user.currentStreak += 1;
        } else {
          user.currentStreak = 1;
        }
      }
      user.lastActiveDate = new Date();
      user.xp += xpAwarded;
      await user.save();

      // Simplified badge logic
      if (user.currentStreak > 0 && user.currentStreak % 7 === 0) {
        user.badges.push(`Streak ${user.currentStreak}`);
        newBadges.push(`Streak ${user.currentStreak}`);
        await user.save();
      }
    }

    res.json({
      success: true,
      attempt,
      xpAwarded,
      newStreak: user?.currentStreak,
      newXp: user?.xp,
      newBadges
    });
  } catch (error) {
    console.error('Error logging quiz attempt:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
