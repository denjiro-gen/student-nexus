require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });

async function test() {
  try {
    const prompt = `You are the OSAS Intelligent Agent. Respond ONLY with a valid JSON object in this exact format, with no markdown code blocks wrapping the JSON:
{
  "text": "Your highly professional and friendly response formatted in Markdown...",
  "intent": "intent_name",
  "filter": "filter_name or null"
}
User input: "Hello"`;
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
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
