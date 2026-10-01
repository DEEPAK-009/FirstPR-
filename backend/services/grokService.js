const axios = require('axios');
require('../config/env');

const MAX_BODY_CHARACTERS = 1500;
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504]);

const getGroqApiKey = () =>
  process.env.GROK_API_KEY || process.env.GROQ_API_KEY || '';

const getGroqModel = () =>
  process.env.GROQ_MODEL || process.env.GROK_MODEL || DEFAULT_GROQ_MODEL;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeIssueBody = (body) => {
  if (!body || typeof body !== 'string') {
    return 'No description provided';
  }

  const trimmed = body.replace(/\r\n/g, '\n').trim();
  if (trimmed.length <= MAX_BODY_CHARACTERS) {
    return trimmed;
  }

  return `${trimmed.slice(0, MAX_BODY_CHARACTERS)}\n...[description truncated for brevity]`;
};

const extractText = (responseData) =>
  responseData?.choices?.[0]?.message?.content || null;

const generateExplanation = async (issue) => {
  try {
    const apiKey = getGroqApiKey();
    if (!apiKey) {
      console.warn('Groq API key is missing (set GROK_API_KEY in environment)');
      return 'Explanation not available';
    }

    const model = getGroqModel();
    const sanitizedBody = sanitizeIssueBody(issue.body);

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
Description: ${sanitizedBody}

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
            model,
            messages,
            temperature: 0.3,
            max_tokens: 220
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`
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

        const delay = status === 429 ? 2000 * attempt : 1000 * attempt;
        await sleep(delay);
      }
    }
  } catch (error) {
    console.error('Groq FULL ERROR:');
    console.error(error.response?.data || error.message);
    return 'Explanation not available';
  }
};

module.exports = { generateExplanation };
