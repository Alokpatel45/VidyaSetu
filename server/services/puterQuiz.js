import axios from "axios";

// Puter's OpenAI-compatible gateway. No Google/Groq API key is involved.
export const PUTER_CHAT_URL = "https://api.puter.com/puterai/openai/v1/chat/completions";

function providerError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

export function requirePuterToken(token) {
  if (typeof token !== "string" || !token.trim() || token.length > 16384 || /[\r\n]/.test(token)) {
    throw providerError("Connect your Puter account to generate a quiz.", 400, "PUTER_AUTH_REQUIRED");
  }
  return token;
}

export async function generatePuterQuizText(prompt, token, post = axios.post) {
  requirePuterToken(token);
  let response;
  try {
    response = await post(PUTER_CHAT_URL, {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      stream: false,
      max_tokens: 16000,
    }, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: 90000,
      maxContentLength: 1024 * 1024,
    });
  } catch (error) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      throw providerError("Your Puter session expired. Start again to reconnect Puter.", 401, "PUTER_AUTH_REQUIRED");
    }
    if (status === 402 || status === 429) {
      throw providerError("Puter usage limit reached. Check your Puter credits or try again later.", 429, "PUTER_LIMIT_REACHED");
    }
    // Never return/log the upstream error: Axios errors can contain bearer tokens.
    throw providerError("Puter could not generate the quiz. Please try again.", 502, "PUTER_UNAVAILABLE");
  }
  const content = response.data?.choices?.[0]?.message?.content;
  const text = Array.isArray(content) ? content.map(part => part.text || "").join("") : content;
  if (typeof text !== "string" || !text.trim()) {
    throw providerError("Puter returned an empty quiz. Please try again.", 502, "PUTER_UNAVAILABLE");
  }
  return text;
}
