import axios from "axios";

const PRIMARY_GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

const FALLBACK_GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function generateGeminiText(prompt, history = []) {
  const apiKey = process.env.GEMINI_API;

  if (!apiKey) {
    throw new Error("GEMINI_API key is missing in environment variables.");
  }

  const contents = [];

  if (Array.isArray(history) && history.length > 0) {
    history.forEach((item) => {
      if (item.question && item.answer) {
        contents.push({ role: "user", parts: [{ text: item.question }] });
        contents.push({ role: "model", parts: [{ text: item.answer }] });
      }
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  const payload = {
    system_instruction: {
      parts: [
        {
          text: "You are VidyaSetu Assistant, a helpful and friendly AI tutor for the VidyaSetu E-Learning platform. Your goal is to help students understand their courses, lectures, and study materials. You should be encouraging, professional, and clear. Always refer to the platform as VidyaSetu. Remember previous context in the conversation.",
        },
      ],
    },
    contents,
  };

  const headers = {
    "Content-Type": "application/json",
    "X-goog-api-key": apiKey,
  };

  // Try primary model (gemini-3.6-flash)
  try {
    const { data } = await axios.post(PRIMARY_GEMINI_URL, payload, { headers });
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (primaryError) {
    console.warn(
      "Gemini 3.6 Flash failed, attempting fallback model...",
      primaryError.response?.data?.error?.message || primaryError.message
    );

    // Try fallback model (gemini-1.5-flash)
    try {
      const { data } = await axios.post(FALLBACK_GEMINI_URL, payload, { headers });
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    } catch (fallbackError) {
      console.error("Gemini API error:", fallbackError.response?.data || fallbackError.message);
      const err = new Error("Error fetching from Gemini API");
      err.statusCode = 500;
      throw err;
    }
  }
}

