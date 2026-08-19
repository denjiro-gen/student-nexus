require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function testModel(modelName) {
  const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });
  console.log(`\nTesting ${modelName}...`);
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Say "hello" and nothing else.',
    });
    console.log(`✅ Success (${modelName}): ${response.text}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed (${modelName}): Code ${err.status} - ${err.message}`);
    return false;
  }
}

async function runTests() {
  const modelsToTest = [
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-flash-latest'
  ];

  for (const model of modelsToTest) {
    await testModel(model);
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

runTests();
