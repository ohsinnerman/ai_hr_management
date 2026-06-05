import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

/**
 * Generate a 768-dimensional embedding for a given text string.
 * Truncates to 8000 characters to stay within model limits.
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - Array of 768 floats
 */
export async function embed(text) {
  const result = await embeddingModel.embedContent(text.slice(0, 8000));
  return result.embedding.values; // number[] → 768 dims (NOT 1536)
}
