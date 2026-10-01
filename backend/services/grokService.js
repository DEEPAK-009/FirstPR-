const axios = require('axios');
require('../config/env');

const MAX_BODY_CHARACTERS = 3000;
const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-20b';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const RETRYABLE_STATUS_CODES = new Set([408, 409, 429, 500, 502, 503, 504]);

const getGroqApiKey = () =>
  process.env.GROK_API_KEY || process.env.GROQ_API_KEY || '';

const getGroqModel = () => {
  const configured = (process.env.GROQ_MODEL || process.env.GROK_MODEL || '').trim();
  // Groq deprecated llama-3.1-8b-instant; safely fall back to fast openai/gpt-oss-20b
  if (!configured || configured.includes('llama-3.1')) {
    return DEFAULT_GROQ_MODEL;
  }
  return configured;
};

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

    let model = getGroqModel();
    const sanitizedBody = sanitizeIssueBody(issue.body);

    const messages = [
      {
        role: 'system',
        content:
          'You are an expert open-source mentor helping beginner contributors. ' +
          'Analyze GitHub issues and produce a structured, high-signal guide with a short summary, key technical bullet points, and numbered action steps. ' +
          'Always ensure your explanation is completely finished and never cut off mid-thought. ' +
          'Never output a dense wall of text. Avoid generic filler advice like "clone the repository" or "open the project". ' +
          'If the issue already contains specific files, classes, error logs, or maintainer directions, preserve and highlight them directly in the steps.'
      },
      {
        role: 'user',
        content: `Explain and structure this GitHub issue for a contributor:

Title: ${issue.title}
Labels: ${issue.labels ? (Array.isArray(issue.labels) ? issue.labels.map((l) => l.name || l).join(', ') : issue.labels) : 'None'}
Description:
${sanitizedBody}

Format your response strictly using this structure:

**What this issue is about:**
[1-2 clear sentences in plain English explaining the core problem and why it matters]

**Key Details:**
- [Bullet point with affected component, file, or root cause]
- [Bullet point with expected vs actual behavior]

**How to solve it:**
1. [Specific, actionable step preserving any files/code mentioned by the maintainer]
2. [Next actionable step]
3. [Testing or verification step]

Keep each step concise and actionable, and ensure every numbered step is fully formulated and complete.`
      }
    ];

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await axios.post(
          GROQ_ENDPOINT,
          {
            model,
            messages,
            temperature: 0.2,
            max_tokens: 1500
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`
            },
            timeout: 30000
          }
        );

        const text = extractText(response.data);
        return text || 'No explanation generated';
      } catch (error) {
        const status = error.response?.status;

        if (status === 404 && model !== DEFAULT_GROQ_MODEL) {
          console.warn(`Groq model "${model}" not found, falling back to "${DEFAULT_GROQ_MODEL}"`);
          model = DEFAULT_GROQ_MODEL;
          continue;
        }

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
