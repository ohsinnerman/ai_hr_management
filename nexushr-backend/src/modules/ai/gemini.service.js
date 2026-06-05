import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export function getModel(modelName = 'gemini-2.0-flash', systemInstruction = null) {
  const config = { safetySettings };
  if (systemInstruction) config.systemInstruction = systemInstruction;
  return genAI.getGenerativeModel({ model: modelName, ...config });
}

// Synchronous completion — returns full text (resume screening needs complete JSON).
export async function complete({ system, user, model = 'gemini-2.0-flash', maxTokens = 2048 }) {
  const geminiModel = getModel(model, system);
  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.1 }, // low temp = JSON consistency
  });
  return result.response.text();
}

// True only when an API key is configured (lets callers fall back gracefully).
export const isGeminiConfigured = () => Boolean(process.env.GEMINI_API_KEY);
