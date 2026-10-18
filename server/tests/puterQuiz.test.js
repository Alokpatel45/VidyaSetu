import test from "node:test";
import assert from "node:assert/strict";
import { generatePuterQuizText, PUTER_CHAT_URL } from "../services/puterQuiz.js";

test("Puter generation uses only request-scoped Puter credentials without Gemini/Groq keys", async () => {
  const saved = [process.env.GEMINI_API, process.env.GROQ_API_KEY];
  delete process.env.GEMINI_API; delete process.env.GROQ_API_KEY;
  try {
    const calls = [];
    const post = async (...args) => { calls.push(args); return { data: { choices: [{ message: { content: "[]" } }] } }; };
    assert.equal(await generatePuterQuizText("Quiz", "learner-A", post), "[]");
    assert.equal(await generatePuterQuizText("Quiz", "learner-B", post), "[]");
    assert.equal(calls[0][0], PUTER_CHAT_URL);
    assert.equal(calls[0][1].model, "google/gemini-2.5-flash");
    assert.equal(calls[0][2].headers.Authorization, "Bearer learner-A");
    assert.equal(calls[1][2].headers.Authorization, "Bearer learner-B");
    assert.equal(calls[0][1].stream, false);
    assert.equal(calls[0][2].timeout, 90000);
  } finally {
    for (const [key, value] of [["GEMINI_API", saved[0]], ["GROQ_API_KEY", saved[1]]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
test("missing and malformed Puter tokens fail before any provider request", async () => {
  for (const token of [undefined, "", "  ", "bad\r\ntoken", "a".repeat(16385)]) {
    await assert.rejects(generatePuterQuizText("Quiz", token, () => assert.fail("must not call Puter")), error => error.code === "PUTER_AUTH_REQUIRED");
  }
});
test("expired sessions and quota failures return actionable errors without leaking provider details", async () => {
  for (const [status, code, statusCode] of [[401,"PUTER_AUTH_REQUIRED",401],[403,"PUTER_AUTH_REQUIRED",401],[402,"PUTER_LIMIT_REACHED",429],[429,"PUTER_LIMIT_REACHED",429],[500,"PUTER_UNAVAILABLE",502]]) {
    await assert.rejects(generatePuterQuizText("Quiz", "private-token", async () => {
      throw Object.assign(new Error("private-token upstream details"), { response: { status }, config: { headers: { Authorization: "Bearer private-token" } } });
    }), error => error.code === code && error.statusCode === statusCode && !error.message.includes("private-token") && !error.config);
  }
});
test("normalizes text blocks and rejects empty provider responses", async () => {
  assert.equal(await generatePuterQuizText("Quiz", "session", async () => ({ data: { choices: [{ message: { content: [{ type: "text", text: "[" }, { type: "text", text: "]" }] } }] } })), "[]");
  await assert.rejects(generatePuterQuizText("Quiz", "session", async () => ({ data: {} })), error => error.code === "PUTER_UNAVAILABLE");
});
