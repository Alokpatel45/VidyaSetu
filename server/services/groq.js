import axios from "axios";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Generate text using Groq API (Llama 3)
 * Much faster than Gemini for most tasks.
 */
export async function generateGroqText(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing in environment variables.");
  }

  try {
    const { data } = await axios.post(
      GROQ_URL,
      {
        model: "llama-3.3-70b-versatile", // High performance model
        messages: [
          {
            role: "system",
            content: "You are VidyaSetu Assistant, a helpful and friendly AI tutor for the VidyaSetu E-Learning platform. Your goal is to help students understand their courses, lectures, and study materials. You should be encouraging, professional, and clear. Always refer to the platform as VidyaSetu. If a student asks about their account or payments, guide them to the 'Account' section."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    return data?.choices?.[0]?.message?.content ?? null;
  } catch (error) {
    console.error("Groq error:", error.response?.data || error.message);
    const err = new Error("Error fetching from Groq API");
    err.statusCode = 502;
    throw err;
  }
}
