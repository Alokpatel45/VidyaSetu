import { generateGeminiText } from "./gemini.js";
import { generateGroqText } from "./groq.js";

/**
 * Unified AI text generator
 * Priority: Groq (if key exists) > Gemini (if key exists)
 */
export async function generateAiText(prompt, history = []) {
  // Check for Groq
  if (process.env.GROQ_API_KEY) {
    try {
      return await generateGroqText(prompt, history);
    } catch (error) {
      console.warn("Groq failed, trying Gemini fallback...", error.message);
    }
  }

  // Check for Gemini
  if (process.env.GEMINI_API) {
    return await generateGeminiText(prompt, history);
  }

  throw new Error("No AI API keys configured (GEMINI_API or GROQ_API_KEY).");
}
