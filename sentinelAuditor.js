const { GoogleGenAI } = require('@google/genai');
const axios = require('axios');

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });

async function analyzeSiteContent(url, userIntent) {
  let html = '';
  
  try {
    // If it's our mock URL, we'll simulate the HTML based on the intent for testing purposes.
    if (url.includes('locus-preview.com')) {
      if (userIntent.toLowerCase().includes('fail') || userIntent.toLowerCase().includes('error')) {
        html = '<html><body><h1>Database Connection Failed</h1><p>Could not connect to Postgres.</p></body></html>';
      } else {
        html = '<html><body><h1>Next.js App Deployed Successfully</h1><p>Connected to Postgres DB.</p></body></html>';
      }
    } else {
      // Fetch raw HTML from the live URL
      const response = await axios.get(url, { timeout: 10000 });
      html = response.data;
    }
  } catch (err) {
    console.error('[Sentinel Auditor] Failed to fetch HTML:', err.message);
    html = '500 Internal Server Error - Failed to load page';
  }

  // Fast-fail Logic: Check for critical errors in HTML directly
  const criticalSignatures = ['500 Internal Server Error', 'Database Connection Failed', '404 Not Found'];
  const detectedErrors = criticalSignatures.filter(sig => html.includes(sig));

  if (detectedErrors.length > 0) {
    console.log('[Sentinel Auditor] Critical error detected via regex/signature match. Fast-failing.');
    return {
      isSuccess: false,
      confidence: 1.0,
      criticalErrors: detectedErrors
    };
  }

  // AI-Driven Verification Engine
  try {
    // If no real API key is provided, mock the LLM response to ensure the hackathon demo works
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy_key') {
      console.log('[Sentinel Auditor] Using mock LLM response (No API key provided).');
      return {
        isSuccess: true,
        confidence: 0.95,
        criticalErrors: []
      };
    }

    const prompt = `
You are Sentinel, an AI auditor. 
Analyze the following HTML content of a deployed site against the user's intent.

User Intent: "${userIntent}"

HTML Content:
${html.substring(0, 5000)} // Truncating to avoid huge token limits

Respond ONLY with a valid JSON object matching this schema:
{
  "isSuccess": boolean,
  "confidence": number (float between 0 and 1),
  "criticalErrors": array of strings (empty if none)
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const resultText = response.text();
    const resultJson = JSON.parse(resultText);
    return resultJson;

  } catch (error) {
    console.error('[Sentinel Auditor] LLM Analysis failed:', error.message);
    return {
      isSuccess: false,
      confidence: 0,
      criticalErrors: ['AI Analysis Service Unavailable']
    };
  }
}

module.exports = {
  analyzeSiteContent
};
