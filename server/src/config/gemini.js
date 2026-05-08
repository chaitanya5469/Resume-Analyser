import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

export function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment');
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function getGeminiModel(modelName = 'gemini-flash-latest') {
  return getGeminiClient().getGenerativeModel({ model: modelName });
}
