import { puter } from "@heyputer/puter.js";

// Called directly from Begin Now / Try Again so the sign-in popup has a user gesture.
export async function getQuizPuterToken(forceSignIn = false) {
  if (!forceSignIn && puter.authToken) return puter.authToken;
  let result;
  try {
    result = await puter.auth.signIn(forceSignIn ? { request_auth: true } : undefined);
  } catch (error) {
    if (error?.error === "popup_blocked") {
      throw new Error("Allow the Puter sign-in popup, then start the quiz again.");
    }
    throw new Error("Puter sign-in was not completed. Start again to connect Puter.");
  }
  if (!result?.success || !result.token) {
    throw new Error("Puter sign-in was not completed. Start again to connect Puter.");
  }
  return result.token;
}
