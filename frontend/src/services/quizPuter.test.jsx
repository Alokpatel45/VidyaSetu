import { beforeEach, expect, test, vi } from "vitest";
import { puter } from "@heyputer/puter.js";
import { getQuizPuterToken } from "./quizPuter.js";
vi.mock("@heyputer/puter.js", () => ({ puter: { authToken: null, auth: { signIn: vi.fn() } } }));
beforeEach(() => { puter.authToken = null; puter.auth.signIn.mockReset(); });
test("reuses an existing SDK session without opening a popup", async () => {
  puter.authToken = "existing-session";
  expect(await getQuizPuterToken()).toBe("existing-session");
  expect(puter.auth.signIn).not.toHaveBeenCalled();
});
test("obtains a Puter session directly from sign-in", async () => {
  puter.auth.signIn.mockResolvedValue({ success: true, token: "new-session" });
  const pending = getQuizPuterToken();
  // Sign-in is invoked before any asynchronous boundary, preserving the click gesture.
  expect(puter.auth.signIn).toHaveBeenCalledTimes(1);
  expect(await pending).toBe("new-session");
});
test("explicit reconnect ignores a stale cached session", async () => {
  puter.authToken = "stale";
  puter.auth.signIn.mockResolvedValue({ success: true, token: "fresh-session" });
  expect(await getQuizPuterToken(true)).toBe("fresh-session");
  expect(puter.auth.signIn).toHaveBeenCalledWith({ request_auth: true });
});
test("blocked popup, cancellation and missing token give clear retry messages", async () => {
  puter.auth.signIn.mockRejectedValueOnce({ error: "popup_blocked" });
  await expect(getQuizPuterToken()).rejects.toThrow("Allow the Puter sign-in popup");
  puter.auth.signIn.mockRejectedValueOnce({ error: "auth_window_closed" });
  await expect(getQuizPuterToken()).rejects.toThrow("not completed");
  puter.auth.signIn.mockResolvedValueOnce({ success: true });
  await expect(getQuizPuterToken()).rejects.toThrow("not completed");
});
