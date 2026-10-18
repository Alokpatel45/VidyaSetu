import { beforeEach, expect, test, vi } from "vitest";
import { puter } from "@heyputer/puter.js";
import { askPuter } from "./puterChat";
vi.mock("@heyputer/puter.js", () => ({
  puter: {
    auth: { isSignedIn: vi.fn(), signIn: vi.fn() },
    ai: { chat: vi.fn() },
  },
}));
beforeEach(() => vi.resetAllMocks());
test("tutor and quiz share the same model, SDK session and text normalization", async () => {
  puter.auth.isSignedIn.mockReturnValue(true);
  puter.ai.chat.mockResolvedValue({
    message: { content: [{ text: "part one" }, { text: " part two" }] },
  });
  const messages = [{ role: "user", content: "Study" }];
  expect(await askPuter(messages)).toBe("part one part two");
  expect(await askPuter(messages, { existingSessionOnly: true })).toBe(
    "part one part two",
  );
  expect(puter.ai.chat.mock.calls).toEqual([
    [messages, { model: "gemini-2.5-flash" }],
    [messages, { model: "gemini-2.5-flash" }],
  ]);
  expect(puter.auth.signIn).not.toHaveBeenCalled();
});
test("quiz without a tutor session does not trigger SDK authentication or chat", async () => {
  puter.auth.isSignedIn.mockReturnValue(false);
  await expect(askPuter("Quiz", { existingSessionOnly: true })).rejects.toThrow(
    "not connected",
  );
  expect(puter.ai.chat).not.toHaveBeenCalled();
  expect(puter.auth.signIn).not.toHaveBeenCalled();
});
test.each(["plain", { text: "plain" }, { message: { content: "plain" } }])(
  "supports tutor response shape %j",
  async (response) => {
    puter.ai.chat.mockResolvedValue(response);
    expect(await askPuter("Hi")).toBe("plain");
  },
);
test("empty AI response fails without attempting to save a quiz", async () => {
  puter.ai.chat.mockResolvedValue({ message: { content: [] } });
  await expect(askPuter("Quiz")).rejects.toThrow("empty response");
});
