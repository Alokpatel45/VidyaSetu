import { puter } from "@heyputer/puter.js";

export const PUTER_TUTOR_MODEL = "gemini-2.5-flash";

export function puterResponseText(response) {
  if (typeof response === "string") return response;
  const content = response?.message?.content ?? response?.text;
  if (Array.isArray(content))
    return content.map((part) => part?.text || "").join("");
  return typeof content === "string" ? content : "";
}

// Both tutor and quiz use the same SDK singleton, model and response handling.
export async function askPuter(messages, { existingSessionOnly = false } = {}) {
  // Essential SDK methods can open authentication automatically. Practice quizzes
  // must reuse the tutor's session rather than launching a new sign-in popup.
  if (existingSessionOnly && !puter.auth.isSignedIn()) {
    throw new Error(
      "Quiz AI is not connected in this browser. Please contact the site owner.",
    );
  }
  const text = puterResponseText(
    await puter.ai.chat(messages, { model: PUTER_TUTOR_MODEL }),
  );
  if (!text.trim())
    throw new Error("AI returned an empty response. Please try again.");
  return text;
}
