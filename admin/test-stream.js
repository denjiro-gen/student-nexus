require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function testStream() {
  const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });
  const functionDeclarations = [{
    name: "getWeather",
    description: "Get the weather for a location",
  }];

  try {
    console.log("Starting stream...");
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.6-flash',
      contents: 'What is the weather in Paris?',
      config: { tools: [{ functionDeclarations }] }
    });

    for await (const chunk of responseStream) {
      if (chunk.functionCalls && chunk.functionCalls.length > 0) {
        console.log("Got function call chunk:", chunk.functionCalls[0]);
      } else {
        process.stdout.write(chunk.text || '');
      }
    }
    console.log("\nStream complete.");
  } catch (err) {
    console.error("Error:", err);
  }
}

testStream();
