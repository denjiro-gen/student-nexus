require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });

async function test() {
  try {
    const prompt = `You are the OSAS Intelligent Agent. Respond ONLY with a valid JSON object.
User input: "Hello"`;
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: "OBJECT",
          properties: {
            text: { type: "STRING" },
            intent: { type: "STRING" },
            filter: { type: "STRING" }
          },
          required: ["text", "intent"]
        }
      }
    });
    console.log('RAW RESPONSE:');
    console.log(JSON.stringify(aiResponse.text));
    console.log('---');
    console.log(aiResponse.text);
  } catch(e) {
    console.error(e);
  }
}
test();
