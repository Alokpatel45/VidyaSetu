import axios from "axios";

const GEMINI_MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function generateGeminiText(prompt) {
  try {
    const { data } = await axios.post(
      GEMINI_MODEL_URL,
      {
        system_instruction: {
          parts: [{ text: "You are VidyaSetu Assistant, a helpful and friendly AI tutor for the VidyaSetu E-Learning platform. Your goal is to help students understand their courses, lectures, and study materials. You should be encouraging, professional, and clear. Always refer to the platform as VidyaSetu." }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API,
        },
      }
    );

    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (error) {
    console.error("Gemini error:", error.response?.data || error.message);
    const err = new Error("Error fetching from Gemini API");
    err.statusCode = 500;
    throw err;
  }
}
