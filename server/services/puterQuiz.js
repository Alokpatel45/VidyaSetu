import axios from "axios";
import { generateAiText } from "./aiService.js";

// Use the native Puter chat driver with the server-owned credential.
// Learners never supply a Puter token or receive a Puter sign-in prompt.
export const PUTER_CHAT_URL = "https://api.puter.com/drivers/call";

function providerError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

export function requirePuterToken(token) {
  if (typeof token !== "string" || !token.trim() || token.length > 16384 || /[\r\n]/.test(token)) {
    throw providerError("Quiz generation is temporarily unavailable. Please try again later.", 503, "PUTER_SERVER_AUTH_FAILED");
  }
  return token;
}

function driverError(status, body) {
  const code = body?.error?.code || body?.code;
  const effectiveStatus = body?.error?.status || status;
  if (status === 401 || effectiveStatus === 401 || code === "token_auth_failed") {
    return providerError("Quiz generation is temporarily unavailable. Please try again later.", 503, "PUTER_SERVER_AUTH_FAILED");
  }
  if (code === "permission_denied" || status === 403 || effectiveStatus === 403) {
    return providerError("Quiz generation is temporarily unavailable. Please try again later.", 503, "PUTER_SERVER_PERMISSION_REQUIRED");
  }
  if ([402, 429].includes(effectiveStatus) || code === "insufficient_funds" || body?.metadata?.usage_limited === true) {
    return providerError("Quiz generation has reached its AI usage limit. Please try again later.", 429, "PUTER_LIMIT_REACHED");
  }
  return providerError("Puter could not generate the quiz. Please try again.", 502, "PUTER_UNAVAILABLE");
}

export async function generatePuterQuizText(prompt, token, post = axios.post) {
  requirePuterToken(token);
  let response;
  try {
    response = await post(PUTER_CHAT_URL, {
      interface: "puter-chat-completion",
      driver: "ai-chat",
      method: "complete",
      args: {
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 16000,
      },
      auth_token: token,
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 90000,
      maxContentLength: 1024 * 1024,
    });
  } catch (error) {
    // Never return/log Axios errors: they contain the credential-bearing body.
    throw driverError(error.response?.status, error.response?.data);
  }
  const body = response.data;
  // Native drivers can report failure inside an HTTP 200 response.
  if (body?.success === false || body?.code === "token_auth_failed") {
    throw driverError(response.status, body);
  }
  const result = body?.result !== undefined ? body.result : body;
  const content = result?.message?.content;
  const text = Array.isArray(content) ? content.map(part => part.text || "").join("") : content;
  if (typeof text !== "string" || !text.trim()) {
    throw providerError("Puter returned an empty quiz. Please try again.", 502, "PUTER_UNAVAILABLE");
  }
  return text;
}


// Preserve the existing no-popup server AI route when it is already configured.
// Puter is preferred as soon as the owner configures PUTER_AUTH_TOKEN.
export async function generateQuizText(prompt, {
  env = process.env,
  puter = generatePuterQuizText,
  server = generateAiText,
} = {}) {
  if (env.PUTER_AUTH_TOKEN) return puter(prompt, env.PUTER_AUTH_TOKEN);
  if (env.GROQ_API_KEY || env.GEMINI_API) return server(prompt);
  throw providerError("Quiz generation is temporarily unavailable. Please try again later.", 503, "QUIZ_AI_NOT_CONFIGURED");
}
