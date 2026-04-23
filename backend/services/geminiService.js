const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateExplanation = async (issue) => {
  try {
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key is missing');
      return 'Explanation not available';
    }

    const prompt = `
You are helping a beginner developer understand a GitHub issue.

Explain this issue clearly and simply.

Title: ${issue.title}

Description: ${issue.body || "No description provided"}

Your response should include:

1. What this issue means
2. Why it is important
3. Step-by-step solution approach

Keep it simple.
`;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await axios.post(
          GEMINI_ENDPOINT,
          {
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': GEMINI_API_KEY
            },
            timeout: 15000
          }
        );

        const text =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        return text || "No explanation generated";
      } catch (error) {
        const status = error.response?.status;

        if (!RETRYABLE_STATUS_CODES.has(status) || attempt === 3) {
          throw error;
        }

        await sleep(1000 * attempt);
      }
    }

  } catch (error) {
    console.error("Gemini FULL ERROR:");
    console.error(error.response?.data || error.message);
    return "Explanation not available";
  }
};

module.exports = { generateExplanation };
