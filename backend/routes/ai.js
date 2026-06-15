const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const Article = require('../models/Article');
const { askAI } = require('../services/ai');
const router = express.Router();

// @route   POST /api/ai/explain
// @desc    Generate AI explanations for an article
router.post('/explain', ensureAuthenticated, async (req, res) => {
  try {
    const { articleId, action } = req.body;

    if (!articleId || !action) {
      return res.status(400).json({ error: 'Missing articleId or action parameter' });
    }

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    let systemPrompt = '';
    const contentContext = `\n\nTitle: ${article.title}\nSource: ${article.source}\nContent:\n${article.content}`;

    switch (action) {
      case 'explain_simply':
        systemPrompt = 'Explain the following news article in extremely simple terms, as if explaining to a 10-year-old. Use analogies where appropriate. Keep it under 150 words.';
        break;
      case 'explain_teacher':
        systemPrompt = 'Act as an expert UPSC/Banking exam tutor. Explain the core concept of the following news article. Highlight why this is important from an examination perspective and what specific terminology the student should memorize. Keep it structured and under 250 words.';
        break;
      case 'generate_mcqs':
        systemPrompt = 'Generate 3 difficult Multiple Choice Questions (with 4 options each) based on the following article, formatted clearly with the correct answer and a brief explanation for each. Format as plain text with clear headings.';
        break;
      case 'create_flashcards':
        systemPrompt = 'Extract 5 key terms, acronyms, or facts from the following article. Format them as Flashcards: \nTerm: [Term]\nDefinition: [Definition].';
        break;
      case 'create_revision_notes':
        systemPrompt = 'Create highly condensed, bulleted revision notes for the following article. Focus only on numbers, dates, constitutional articles, or primary names mentioned. Keep it strictly under 100 words.';
        break;
      case 'translate':
        systemPrompt = 'Translate the core summary of the following article into Hindi and Telugu. Provide the Hindi translation first, followed by the Telugu translation. Keep each translation under 100 words.';
        break;
      case 'memory_tricks':
        systemPrompt = 'Create a mnemonic, memory trick, or a funny association to help remember the main subject or key numbers/names in the following article. Keep it short and memorable.';
        break;
      default:
        return res.status(400).json({ error: 'Invalid action specified' });
    }

    const fullPrompt = systemPrompt + contentContext;
    const explanation = await askAI(fullPrompt);

    return res.json({ success: true, explanation });
  } catch (error) {
    console.error('Error generating AI explanation:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
