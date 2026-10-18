import test from "node:test";
import assert from "node:assert/strict";
import { generatePuterQuizText, generateQuizText, PUTER_CHAT_URL } from "../services/puterQuiz.js";

test("native Puter generation isolates credentials between calls without Gemini/Groq keys", async () => {
  const saved = [process.env.GEMINI_API, process.env.GROQ_API_KEY];
  delete process.env.GEMINI_API; delete process.env.GROQ_API_KEY;
  try {
    const calls = [];
    const post = async (...args) => { calls.push(args); return { data: { success: true, result: { message: { content: "[]" } } } }; };
    assert.equal(await generatePuterQuizText("Quiz", "learner-A", post), "[]");
    assert.equal(await generatePuterQuizText("Quiz", "learner-B", post), "[]");
    assert.equal(calls[0][0], PUTER_CHAT_URL);
    assert.equal(PUTER_CHAT_URL, "https://api.puter.com/drivers/call");
    assert.equal(calls[0][1].interface, "puter-chat-completion");
    assert.equal(calls[0][1].driver, "ai-chat");
    assert.equal(calls[0][1].method, "complete");
    assert.equal(calls[0][1].args.model, "gemini-2.5-flash");
    assert.equal(calls[0][1].auth_token, "learner-A");
    assert.equal(calls[1][1].auth_token, "learner-B");
    assert.equal(calls[0][1].args.stream, false);
    assert.equal(calls[0][2].timeout, 90000);
  } finally {
    for (const [key, value] of [["GEMINI_API", saved[0]], ["GROQ_API_KEY", saved[1]]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
test("missing and malformed Puter tokens fail before any provider request", async () => {
  for (const token of [undefined, "", "  ", "bad\r\ntoken", "a".repeat(16385)]) {
    await assert.rejects(generatePuterQuizText("Quiz", token, () => assert.fail("must not call Puter")), error => error.code === "PUTER_SERVER_AUTH_FAILED");
  }
});
test("server authentication, permission and quota failures do not leak provider details", async () => {
  for (const [status, code, statusCode] of [[401,"PUTER_SERVER_AUTH_FAILED",503],[403,"PUTER_SERVER_PERMISSION_REQUIRED",503],[402,"PUTER_LIMIT_REACHED",429],[429,"PUTER_LIMIT_REACHED",429],[500,"PUTER_UNAVAILABLE",502]]) {
    await assert.rejects(generatePuterQuizText("Quiz", "private-token", async () => {
      throw Object.assign(new Error("private-token upstream details"), { response: { status }, config: { headers: { Authorization: "Bearer private-token" } } });
    }), error => error.code === code && error.statusCode === statusCode && !error.message.includes("private-token") && !error.config);
  }
});
test("normalizes text blocks and rejects empty provider responses", async () => {
  assert.equal(await generatePuterQuizText("Quiz", "session", async () => ({ data: { success: true, result: { message: { content: [{ type: "text", text: "[" }, { type: "text", text: "]" }] } } } })), "[]");
  await assert.rejects(generatePuterQuizText("Quiz", "session", async () => ({ data: {} })), error => error.code === "PUTER_UNAVAILABLE");
});


test("native HTTP 200 error envelopes distinguish permission, quota and authentication failures", async () => {
  for (const [body, expected] of [
    [{ success: false, error: { code: "permission_denied" } }, "PUTER_SERVER_PERMISSION_REQUIRED"],
    [{ success: false, error: { code: "insufficient_funds" } }, "PUTER_LIMIT_REACHED"],
    [{ success: false, metadata: { usage_limited: true } }, "PUTER_LIMIT_REACHED"],
    [{ success: false, error: { code: "token_auth_failed" } }, "PUTER_SERVER_AUTH_FAILED"],
    [{ code: "token_auth_failed" }, "PUTER_SERVER_AUTH_FAILED"],
  ]) {
    await assert.rejects(generatePuterQuizText("Quiz", "session", async () => ({ status: 200, data: body })), e => e.code === expected);
  }
});
test("accepts the unwrapped native SDK response shape", async () => {
  assert.equal(await generatePuterQuizText("Quiz", "session", async () => ({ data: { message: { content: "[]" } } })), "[]");
});


test("server-owned Puter is preferred without learner credentials or Google/Groq keys", async () => {
  let called = false;
  assert.equal(await generateQuizText("Quiz", {
    env: { PUTER_AUTH_TOKEN: "owner-session" },
    puter: async (prompt, token) => { called = true; assert.equal(token, "owner-session"); return "[]"; },
    server: () => assert.fail("must not call provider-key fallback"),
  }), "[]");
  assert.equal(called, true);
});
test("existing configured server AI remains available without a Puter popup", async () => {
  assert.equal(await generateQuizText("Quiz", {
    env: { GROQ_API_KEY: "configured" },
    puter: () => assert.fail("no Puter credential configured"),
    server: async prompt => { assert.equal(prompt, "Quiz"); return "[]"; },
  }), "[]");
});
test("no configured provider gives an explicit service setup error, not a learner login request", async () => {
  await assert.rejects(generateQuizText("Quiz", { env: {} }), e => e.code === "QUIZ_AI_NOT_CONFIGURED" && e.statusCode === 503 && !e.message.includes("sign"));
});
