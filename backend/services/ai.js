const { GoogleGenerativeAI } = require('@google/generative-ai');

// 4. Robust Sanitization Utility
function cleanAndParseJSON(rawResponse) {
  try {
    let cleaned = rawResponse.trim();
    // Aggressive regex to strip markdown code blocks and whitespace anomalies
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    // Strip strictly invalid control characters that break JSON.parse (like null bytes, vertical tabs, but preserving standard newlines/tabs)
    cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '');
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`JSON Parse Error: ${error.message}. Raw Output: ${rawResponse.substring(0, 100)}...`);
  }
}

// 3. Unified System Instructions & JSON Output Schema
const SYSTEM_INSTRUCTION = `You are a senior academic content director specializing in Indian Competitive Exams (UPSC Civil Services, RBI Grade B, Banking, and SSC CGL exams).
Analyze the provided news text and generate a child-friendly explanatory brief written as if for a bright 10-year-old who wants to study smart.

EVALUATE AND ASSIGN CATEGORIES USING THESE STRICT, HYPER-SELECTIVE RULES:

1. "upsc": 
- Inclusion Criteria: Deep, macro-level analytical topics. Focuses heavily on the "why" and "how" behind the news. Includes editorials, international relations, major national policy debates, constitutional matters, comprehensive environmental issues, and socio-economic governance.
- Exclusion: Do not tag as 'upsc' if it is a purely superficial, 2-sentence announcement or simple corporate score update.

2. "banking":
- Inclusion Criteria: Focuses heavily on numbers, financial definitions, and institutional updates. Must feature terms like Repo Rate, inflation data, fiscal numbers, GDP percentages, corporate actions, mergers, insurance updates, or direct notifications/guidelines from the Reserve Bank of India (RBI), SEBI, or the Finance Ministry.
- Exclusion: Do not tag as 'banking' for general political news, defense exercises, or sports.

3. "ssc_cgl":
- Inclusion Criteria: Purely factual, direct, objective data. Focuses on the "who, what, and where". Must feature specific keys like national/international awards, sports winners, major tournaments, military/defense exercises, administrative appointments, state/central welfare schemes, and static factual general knowledge events.
- Exclusion: Do not tag as 'ssc_cgl' for complex, multi-page analytical economic editorials.

STRICT OVERLAP RULES:
- An article can have multiple tags ONLY if it legitimately overlaps (e.g., An RBI policy update that changes interest rates can be tagged as both ['banking', 'upsc'] if it contains deep economic analysis).
- If a piece of news is strictly a sports award or a military exercise, it must ONLY contain ['ssc_cgl'].

Your response must be an absolute, raw JSON object (with no markdown wrappers) matching this exact schema structure:
{
  "categories": ["upsc" | "banking" | "ssc_cgl"],
  "bulletPoints": ["Sentence 1", "Sentence 2", "Sentence 3", "Sentence 4"],
  "wordSummary": "A concise 100-word explanation of the core event.",
  "deepDive": "Structured markdown breaking down: Background, Current Conflict/Issue, Future Outlook.",
  "quiz": [
    {
      "question": "Sample conceptual question statement?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Simple, accessible breakdown of why the answer is correct."
    }
  ]
}
Do not invent facts. Stick strictly to the article content.
CRITICAL: You must output valid JSON. Any newlines inside string values MUST be escaped as \\n. Do NOT use literal newlines inside string values.`;

// 2. High-Availability Fallback Architecture
async function generateEnrichedContentWithFallback(title, rawText) {
  const userMessage = `Title: ${title}\n\nContent:\n${rawText}`;
  
  // Tier 1 (Primary - Groq)
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) throw new Error('GROQ_API_KEY not configured');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2,
        max_tokens: 2500
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Groq request failed');
    if (!data.choices?.[0]?.message?.content) throw new Error('Malformed Groq response');

    return cleanAndParseJSON(data.choices[0].message.content);
  } catch (groqError) {
    console.warn(`[AI Warning] Groq Tier Failed. Falling back to Mistral... Details: ${groqError.message}`);
  }

  // Tier 2 (Secondary - Mistral)
  try {
    const mistralKey = process.env.MISTRAL_API_KEY;
    if (!mistralKey) throw new Error('MISTRAL_API_KEY not configured');

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mistralKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Mistral request failed');
    if (!data.choices?.[0]?.message?.content) throw new Error('Malformed Mistral response');

    return cleanAndParseJSON(data.choices[0].message.content);
  } catch (mistralError) {
    console.warn(`[AI Warning] Mistral Tier Failed. Falling back to Gemini... Details: ${mistralError.message}`);
  }

  // Tier 3 (Tertiary - Gemini)
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error('GEMINI_API_KEY not configured');

    const genAI = new GoogleGenerativeAI(geminiKey);
    // Gemini supports system instructions directly in the model config
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.2 }
    });

    return cleanAndParseJSON(result.response.text());
  } catch (geminiError) {
    console.error(`[AI Error] Gemini Tier Failed. All providers exhausted! Details: ${geminiError.message}`);
    
    // 5. Circuit Breaker / Failure Insulation
    return {
      aiEnriched: false,
      categories: ['upsc', 'banking', 'ssc_cgl'],
      bulletPoints: ["AI enrichment temporarily unavailable due to capacity limits.", "Please read the full raw article below."],
      wordSummary: "Summarization failed because all 3 AI providers (Groq, Mistral, Gemini) exhausted their quotas or timed out. The system has preserved the original article content.",
      deepDive: "Deep dive unavailable.",
      quiz: []
    };
  }
}

// Ensure the module is completely backwards compatible with the scraper.js pipeline.
// scraper.js invokes askAI(prompt) and expects a raw JSON string back which it parses itself.
async function askAI(legacyPrompt) {
  // Extract Title and Content from the legacy scraper prompt
  let title = "News Article";
  let rawText = legacyPrompt;
  
  const titleMatch = legacyPrompt.match(/Title:\s*(.+)/i);
  if (titleMatch) title = titleMatch[1];
  
  const contentMatch = legacyPrompt.match(/Content:\n([\s\S]+?)(?=\nYour output must be valid JSON|$)/i);
  if (contentMatch) rawText = contentMatch[1].trim();

  // Execute the robust multi-tier fallback generator
  const enrichedObject = await generateEnrichedContentWithFallback(title, rawText);
  
  // Return stringified JSON to match the existing interface expected by scraper pipeline 
  // (which performs its own `const aiData = JSON.parse(cleanedResponse);`)
  return JSON.stringify(enrichedObject);
}

module.exports = { 
  generateEnrichedContentWithFallback, 
  askAI,
  cleanAndParseJSON
};
