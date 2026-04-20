const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const generateExplanation = async (issue) => {
  try {
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

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return text || "No explanation generated";

  } catch (error) {
    console.error("Gemini FULL ERROR:");
    console.error(error.response?.data || error.message);
    return "Explanation not available";
  }
};

module.exports = { generateExplanation };