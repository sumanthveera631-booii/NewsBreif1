const RSSParser = require('rss-parser');
const cheerio = require('cheerio');
const axios = require('axios');
const { Resend } = require('resend');
const { askAI } = require('./ai');
const Article = require('../models/Article');

const parser = new RSSParser();
const resend = new Resend(process.env.RESEND_API_KEY);

const FEEDS = [
  { name: 'PIB National', url: 'https://pib.gov.in/RssMain.aspx', exams: ['UPSC', 'SSC'] },
  { name: 'The Hindu National', url: 'https://www.thehindu.com/news/national/feeder/default.rss', exams: ['UPSC'] },
  { name: 'The Hindu Economy', url: 'https://www.thehindu.com/business/economy/feeder/default.rss', exams: ['UPSC', 'BANKING'] },
  { name: 'Indian Express India', url: 'https://indianexpress.com/section/india/feed/', exams: ['UPSC', 'BANKING', 'SSC'] },
  { name: 'Indian Express Economy', url: 'https://indianexpress.com/section/economy/feed/', exams: ['UPSC', 'BANKING'] },
  { name: 'Economic Times Economy', url: 'https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms', exams: ['BANKING', 'UPSC'] },
  { name: 'Hindustan Times India', url: 'https://www.hindustantimes.com/rss/india-news/rssfeed.xml', exams: ['UPSC', 'BANKING', 'SSC'] },
  { name: 'NDTV India', url: 'https://feeds.feedburner.com/ndtvnews-india', exams: ['UPSC', 'BANKING', 'SSC'] },
  { name: 'News18 India', url: 'https://www.news18.com/rss/india.xml', exams: ['UPSC', 'SSC'] }
];

const FALLBACK_FEEDS = [
  { name: 'The Hindu International', url: 'https://www.thehindu.com/news/international/feeder/default.rss', exams: ['UPSC'] },
  { name: 'Economic Times Markets', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021503.cms', exams: ['BANKING', 'UPSC'] },
  { name: 'Indian Express Politics', url: 'https://indianexpress.com/section/india/politics/feed/', exams: ['UPSC', 'SSC'] },
  { name: 'Hindustan Times Business', url: 'https://www.hindustantimes.com/rss/business/rssfeed.xml', exams: ['BANKING', 'UPSC'] },
  { name: 'LiveMint Policy', url: 'https://www.livemint.com/rss/politics', exams: ['UPSC', 'SSC'] },
  { name: 'News18 Business', url: 'https://www.news18.com/rss/business.xml', exams: ['BANKING', 'UPSC'] }
];

function getIstDate(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  // Convert UTC time to IST date string (YYYY-MM-DD)
  const utcMillis = parsed.getTime();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(utcMillis + istOffset);
  return istDate.toISOString().slice(0, 10);
}

function getIstToday() {
  const nowUtc = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(nowUtc.getTime() + istOffset);
  return istNow.toISOString().slice(0, 10);
}

async function extractArticleBody(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    const $ = cheerio.load(response.data);

    const imageUrl = $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('article img').first().attr('src') ||
      $('img').first().attr('src') || '';

    const contentSelectors = [
      'article p',
      '.article-body p',
      '.story-details p',
      '.paywall p',
      '.js-article-text p',
      '.story p',
      '#content p',
      '.content p'
    ];

    let content = '';
    for (const selector of contentSelectors) {
      if (content.length > 250) break;
      const paragraphs = $(selector)
        .map((i, el) => $(el).text().trim())
        .get()
        .filter((text) => text.length > 50);
      if (paragraphs.length > 0) {
        content += paragraphs.join('\n\n');
      }
    }

    if (!content) {
      content = $('p')
        .map((i, el) => $(el).text().trim())
        .get()
        .filter((text) => text.length > 50)
        .join('\n\n');
    }

    return { content: content.substring(0, 5000), imageUrl: imageUrl || '' };
  } catch (err) {
    console.error(`Media fallback tracking for URL: ${url}`, err.message);
    return { content: '', imageUrl: '' };
  }
}

async function fetchRssFeed(url) {
  try {
    const response = await axios.get(url, {
      timeout: 15000,
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*;q=0.1',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: url.includes('business-standard') ? 'https://www.business-standard.com/' : 'https://www.google.com/'
      }
    });

    let xml = response.data;
    xml = xml.replace(/&(?!amp;|lt;|gt;|apos;|quot;|#\d+;|#x[0-9A-Fa-f]+;)/g, '&amp;');
    return await parser.parseString(xml);
  } catch (err) {
    console.error(`RSS fetch failure for ${url}:`, err.message);
    try {
      return await parser.parseURL(url);
    } catch (fallbackErr) {
      console.error(`RSS fallback parse failure for ${url}:`, fallbackErr.message);
      return null;
    }
  }
}

async function collectFeedArticles(feed, todayStr) {
  const collected = [];
  try {
    const feedData = await fetchRssFeed(feed.url);
    if (!feedData || !feedData.items) return collected;

    for (const item of feedData.items) {
      const itemPub = item.isoDate || item.pubDate || item.date;
      const itemDate = itemPub ? getIstDate(itemPub) : null;
      if (!itemPub || !itemDate || itemDate !== todayStr) continue;

      const { content: rawText, imageUrl } = await extractArticleBody(item.link);
      if (!rawText || rawText.length < 250) {
        continue;
      }

      collected.push({
        title: item.title,
        source: feed.name,
        sourceUrl: item.link,
        content: rawText,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800',
        exams: feed.exams,
        publishedDate: itemDate
      });
    }
  } catch (err) {
    console.error(`Feed failure on ${feed.name}:`, err.message);
  }
  return collected;
}

function deduplicateByUrl(articles) {
  return Array.from(new Map(articles.map((article) => [article.sourceUrl, article])).values());
}

function normalizeCategories(categoryTags = []) {
  const normalized = new Set();
  categoryTags.forEach((tag) => {
    if (!tag || typeof tag !== 'string') return;
    const lower = tag.toLowerCase();
    if (lower.includes('bank') || lower.includes('monetary') || lower.includes('inflation') || lower.includes('currency') || lower.includes('reserve') || lower.includes('interest') || lower.includes('finance') || lower.includes('rbi') || lower.includes('banking')) {
      normalized.add('banking');
    }
    if (lower.includes('ssc') || lower.includes('cgl') || lower.includes('award') || lower.includes('sports') || lower.includes('appointment') || lower.includes('general knowledge') || lower.includes('gk') || lower.includes('festival') || lower.includes('history') || lower.includes('culture')) {
      normalized.add('ssc_cgl');
    }
    if (lower.includes('policy') || lower.includes('foreign') || lower.includes('diplomacy') || lower.includes('governance') || lower.includes('international') || lower.includes('geopolitics') || lower.includes('constitution') || lower.includes('environment') || lower.includes('defense') || lower.includes('upsc')) {
      normalized.add('upsc');
    }
  });
  return Array.from(normalized);
}

async function runDailyScrapePipeline() {
  console.log('[PIPELINE STARTED] Running daily scraping pipeline...');
  const istToday = getIstDate(new Date());
  let aggregatedArticles = [];

  // Always exhaust ALL feeds — never skip or break early
  for (const feed of FEEDS) {
    aggregatedArticles.push(...await collectFeedArticles(feed, istToday));
  }

  for (const feed of FALLBACK_FEEDS) {
    aggregatedArticles.push(...await collectFeedArticles(feed, istToday));
  }

  // Deduplicate by URL but do NOT cap the count — process everything found
  const uniqueArticles = deduplicateByUrl(aggregatedArticles);
  let totalProcessed = 0;
  let totalDeduplicated = 0;

  function buildArticleRecord(articleMeta, aiData = {}, aiError = null) {
    const fallbackSummary15s = 'AI summary unavailable due to quota limits. Review the source article for details.';
    const fallbackSummary100w = 'AI summary unavailable due to quota limits. The article is saved and will be enriched once AI access is restored.';
    const fallbackSummaryDeepDive = 'AI deep-dive content could not be generated because the Gemini API quota was exhausted.';

    const summary15s = aiData.summaries?.fifteenSecond || aiData.summary15s || aiData.bulletPoints?.join('\n') || fallbackSummary15s;
    const summary100w = aiData.wordSummary || aiData.summaries?.oneHundredWord || aiData.summary100w || fallbackSummary100w;
    const summaryDeepDive = aiData.deepDive || aiData.summaries?.deepDive || aiData.summaryDeepDive || fallbackSummaryDeepDive;

    const categories = Array.isArray(aiData.categories) && aiData.categories.length > 0
      ? aiData.categories.map((cat) => cat.toLowerCase())
      : normalizeCategories(articleMeta.exams);

    return {
      title: articleMeta.title,
      source: articleMeta.source,
      sourceUrl: articleMeta.sourceUrl,
      link: articleMeta.sourceUrl,
      date: new Date(),
      publishedDate: articleMeta.publishedDate,
      imageUrl: articleMeta.imageUrl,
      content: articleMeta.content,
      importanceScore: aiData.importanceScore || 50,
      examProbabilityScore: aiData.examProbabilityScore || 50,
      examSyllabusTags: aiData.examSyllabusTags || [],
      categories,
      bulletPoints: aiData.bulletPoints || [],
      wordSummary: aiData.wordSummary || summary100w,
      deepDive: aiData.deepDive || summaryDeepDive,
      summaries: {
        fifteenSecond: summary15s,
        oneHundredWord: summary100w,
        deepDive: summaryDeepDive
      },
      summary15s,
      summary100w,
      summaryDeepDive,
      insights: aiError ? ['AI unavailable due to quota limits.'] : aiData.insights || [],
      tags: aiData.tags || [],
      revisionNotes: aiData.revisionNotes || '',
      quiz: (aiData.quiz || aiData.mcqs || []).map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: String(q.correctAnswer || ''),
        explanation: q.explanation
      })).filter(q => q.question && q.options && q.options.length >= 2 && q.correctAnswer && q.explanation),
      mcqs: (aiData.mcqs || aiData.quiz || []).map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: String(q.correctAnswer || ''),
        explanation: q.explanation
      })).filter(q => q.question && q.options && q.options.length >= 2 && q.correctAnswer && q.explanation),
      exams: articleMeta.exams,
      aiError: aiError ? aiError.message || String(aiError) : undefined,
      aiRawResponse: aiError ? '' : undefined
    };
  }

  for (const articleMeta of uniqueArticles) {
    // Strict per-article dedup by unique link (primary) or sourceUrl (fallback)
    const articleLink = articleMeta.sourceUrl;
    const uniqueExists = await Article.findOne({ link: articleLink });
    if (uniqueExists) {
      totalDeduplicated++;
      console.log(`[DEDUP SKIP] Already in DB: ${articleMeta.title}`);
      continue;
    }

    console.log(`Generating AI insights for: ${articleMeta.title}`);

    const aiPrompt = `You are a senior academic content director specializing in Indian Competitive Exams (UPSC Civil Services, RBI Grade B, Banking, and SSC CGL exams).
Analyze the provided real news text and generate a child-friendly explanatory brief written as if for a bright 10-year-old who wants to study smart.

News Source: ${articleMeta.source}
Title: ${articleMeta.title}
URL: ${articleMeta.sourceUrl}

Content:
${articleMeta.content}

Your output must be valid JSON with these keys only:
{
  "importanceScore": number (1-100),
  "examProbabilityScore": number (1-100),
  "examSyllabusTags": [string],
  "categories": [string],
  "bulletPoints": [string],
  "wordSummary": string,
  "deepDive": string,
  "quiz": [
    {
      "question": string,
      "options": [string],
      "correctAnswer": string,
      "explanation": string
    }
  ]
}

Instructions:
- Keep the tone simple, direct, and analogical.
- Bullet points should be 4 short, easy sentences that anyone can remember.
- Word summary should be a clear story in about 100 words.
- Deep dive should be structured into three sections: Background, Current News, Why it Matters.
- Categories should include any relevant values from ['upsc', 'banking', 'ssc_cgl'], and can include more than one.
- Use exam-focused examples and explain why the news matters for each category.
- Do not invent facts. Stick strictly to the article content and what is already known.
`;

    let articleRecord;
    try {
      const aiResponseStr = await askAI(aiPrompt);
      let cleanedResponse = aiResponseStr.trim();
      // Robust cleanup: strip ALL markdown code fences Gemini might wrap around JSON
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      const aiData = JSON.parse(cleanedResponse);
      
      // Ensure correctAnswer is always stored as a string (the answer text)
      if (aiData.quiz && Array.isArray(aiData.quiz)) {
        aiData.quiz = aiData.quiz.map(q => ({
          ...q,
          correctAnswer: String(q.correctAnswer || '')
        })).filter(q => q.correctAnswer);
      }
      
      articleRecord = buildArticleRecord(articleMeta, aiData, null);
    } catch (err) {
      console.error(`AI Generation failed for ${articleMeta.title}:`, err.message);
      articleRecord = buildArticleRecord(articleMeta, {
        examSyllabusTags: [],
        categories: normalizeCategories(articleMeta.exams),
        bulletPoints: [],
        wordSummary: '',
        deepDive: '',
        summaries: {},
        quiz: [],
        mcqs: []
      }, err);
    }

    try {
      await Article.create(articleRecord);
      totalProcessed++;
    } catch (saveError) {
      console.error(`Article save failed for ${articleMeta.title}:`, saveError.message);
    }
  }

  console.log(`[PIPELINE SUCCESS] Processed: ${totalProcessed}, Deduplicated: ${totalDeduplicated}`);

  if (process.env.ADMIN_EMAIL) {
    try {
      await resend.emails.send({
        from: 'NewsBrief <onboarding@resend.dev>',
        to: process.env.ADMIN_EMAIL,
        subject: `NewsBrief Pipeline Complete: ${totalProcessed} articles`,
        html: `<p>The daily pipeline ran successfully.</p><p>Articles Processed: ${totalProcessed}</p><p>Duplicates skipped: ${totalDeduplicated}</p>`
      });
    } catch (sendError) {
      console.error('Email digest send failed:', sendError.message);
    }
  }

  return { success: true, articlesProcessed: totalProcessed, deduplicated: totalDeduplicated, totalFetched: uniqueArticles.length };
}

module.exports = { runDailyScrapePipeline };
