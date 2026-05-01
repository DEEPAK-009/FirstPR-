const axios = require('axios');

const GROQ_API_KEY = process.env.GROK_API_KEY || process.env.GROQ_API_KEY;
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_MODEL =
  process.env.GROQ_MODEL ||
  process.env.GROK_MODEL ||
  DEFAULT_GROQ_MODEL;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const extractText = (responseData) =>
  responseData?.choices?.[0]?.message?.content || null;

const generateExplanation = async (issue) => {
  try {
    if (!GROQ_API_KEY) {
      console.error('Groq API key is missing');
      return 'Explanation not available';
    }

    const messages = [
      {
        role: 'system',
        content: [
          {
            type: 'text',
            text: 'You explain GitHub issues to beginner developers in a short, practical way. Reply in 2 short paragraphs max.'
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Explain this GitHub issue clearly and simply for a beginner developer.

Title: ${issue.title}
Description: ${issue.body || 'No description provided'}

Include:
1. What the issue means
2. Why it matters
3. A short step-by-step way to approach it

Keep it concise and practical.`
          }
        ]
      }
    ];

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await axios.post(
          GROQ_ENDPOINT,
          {
            model: GROQ_MODEL,
            messages,
            temperature: 0.3,
            max_tokens: 220
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${GROQ_API_KEY}`
            },
            timeout: 15000
          }
        );

        const text = extractText(response.data);
        return text || 'No explanation generated';
      } catch (error) {
        const status = error.response?.status;

        if (!RETRYABLE_STATUS_CODES.has(status) || attempt === 3) {
          throw error;
        }

        await sleep(1000 * attempt);
      }
    }
  } catch (error) {
    console.error('Groq FULL ERROR:');
    console.error(error.response?.data || error.message);
    return 'Explanation not available';
  }
};

module.exports = { generateExplanation };
