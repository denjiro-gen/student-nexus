require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function listModels() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });
    // Attempt to list models
    // Based on standard Google Cloud APIs, it's typically ai.models.list() or similar.
    // Let's try to just fetch via native fetch if the SDK method is unclear.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.REACT_APP_GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log("Available Models:");
    if (data.models) {
      data.models.forEach(m => console.log(`- ${m.name} (supports: ${m.supportedGenerationMethods.join(', ')})`));
    } else {
      console.log(data);
    }
  } catch (err) {
    console.error('Error fetching models:', err.message);
  }
}

listModels();
