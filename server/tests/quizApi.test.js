import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { Courses } from "../models/Courses.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import aiQuiz, { checkQuizAnswer, getQuizAttempt, listQuizAttempts } from "../controllers/aiQuiz.js";
import { parseGeneratedQuiz, publicAttempt } from "../services/quizValidation.js";
import { geminiQuizSchema } from "../schemas/geminiSchema.js";

const id = "507f1f77bcf86cd799439011";
const user = "507f1f77bcf86cd799439012";
const otherUser = "507f1f77bcf86cd799439013";
const question = { question: "FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], correctAnswer: "Queue", explanation: "A queue removes items in insertion order." };
const fresh = () => ({ _id: id, user, courseId: id, topic: "Data structures", difficulty: "medium", questions: [question], answers: [], status: "in_progress", score: 0, __v: 0 });
const req = (body = {}, owner = user) => ({ params: { attemptId: id }, user: { _id: owner }, body, query: {} });
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });
const originalCourseLookup = Courses.findById;
const originalCreate = QuizAttempt.create;
const originalPost = axios.post;
const originalPuterToken = process.env.PUTER_AUTH_TOKEN;
const originalGroqKey = process.env.GROQ_API_KEY;
const originalGeminiKey = process.env.GEMINI_API;
const original = { findOne: QuizAttempt.findOne, findOneAndUpdate: QuizAttempt.findOneAndUpdate, find: QuizAttempt.find };
afterEach(() => {
  Object.assign(QuizAttempt, original);
  Courses.findById = originalCourseLookup;
  QuizAttempt.create = originalCreate;
  axios.post = originalPost;
  for (const [key, value] of [["PUTER_AUTH_TOKEN", originalPuterToken], ["GROQ_API_KEY", originalGroqKey], ["GEMINI_API", originalGeminiKey]]) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});

function database() {
  let stored = fresh();
  QuizAttempt.findOne = filter => ({ lean: async () => filter.user === stored.user ? structuredClone(stored) : null });
  QuizAttempt.findOneAndUpdate = (filter, update, options) => ({ lean: async () => {
    assert.equal(filter.user, user);
    assert.equal(options.runValidators, true);
    assert.equal(options.new, true);
    if (stored.status !== filter.status || stored.__v !== filter.__v) return null;
    stored = { ...stored, ...update.$set, __v: stored.__v + update.$inc.__v };
    return structuredClone(stored);
  } });
  return () => stored;
}

test("public payload hides every unchecked answer and explanation", () => {
  const payload = publicAttempt(fresh());
  assert.deepEqual(payload.questions, [{ question: question.question, options: question.options }]);
  assert.equal(JSON.stringify(payload).includes(question.explanation), false);
  assert.equal(payload.user, undefined);
});
test("AI output validates exact count, distinct options, answer membership and explanation", () => {
  assert.deepEqual(parseGeneratedQuiz('```json\n' + JSON.stringify([question]) + '\n```', 1), [question]);
  for (const q of [{ ...question, correctAnswer: "Other" }, { ...question, options: ["A", "A", "B", "C"] }, { ...question, explanation: "" }]) {
    assert.throws(() => parseGeneratedQuiz(JSON.stringify([q]), 1));
  }
  assert.throws(() => parseGeneratedQuiz(JSON.stringify([question]), 2));
  assert.throws(() => parseGeneratedQuiz("not JSON", 1));
});
test("generation requires a real course ID and bounded question count", () => {
  assert.equal(geminiQuizSchema.safeParse({ courseId: id, numQuestions: 10 }).success, true);
  assert.equal(geminiQuizSchema.safeParse({ topic: "anything", numQuestions: 10 }).success, false);
  assert.equal(geminiQuizSchema.safeParse({ courseId: id, numQuestions: 51 }).success, false);
});
test("owners get feedback only after save; last check auto-completes with server score", async () => {
  const stored = database();
  const res = response();
  await checkQuizAnswer(req({ questionIndex: 0, selectedAnswer: "Queue", score: 999 }), res);
  assert.equal(res.code, 200);
  assert.equal(stored().status, "completed");
  assert.equal(stored().score, 1);
  assert.ok(stored().completedAt);
  assert.equal(res.body.attempt.answers[0].explanation, question.explanation);
});
test("same-answer retry is idempotent and changed answer stays locked", async () => {
  const stored = database();
  const body = { questionIndex: 0, selectedAnswer: "Stack" };
  await checkQuizAnswer(req(body), response());
  const retry = response();
  await checkQuizAnswer(req(body), retry);
  assert.equal(retry.code, 200);
  assert.equal(stored().__v, 1);
  const change = response();
  await checkQuizAnswer(req({ questionIndex: 0, selectedAnswer: "Queue" }), change);
  assert.equal(change.code, 409);
  assert.equal(stored().score, 0);
});
test("concurrent submissions cannot overwrite or double-score", async () => {
  const stored = database();
  const responses = [response(), response()];
  await Promise.all([
    checkQuizAnswer(req({ questionIndex: 0, selectedAnswer: "Stack" }), responses[0]),
    checkQuizAnswer(req({ questionIndex: 0, selectedAnswer: "Queue" }), responses[1]),
  ]);
  assert.deepEqual(responses.map(r => r.code).sort(), [200, 409]);
  assert.equal(stored().answers.length, 1);
  assert.equal(stored().__v, 1);
});
test("another user cannot read or grade an attempt", async () => {
  database();
  for (const handler of [getQuizAttempt, checkQuizAnswer]) {
    const res = response();
    await handler(req({ questionIndex: 0, selectedAnswer: "Queue" }, otherUser), res);
    assert.equal(res.code, 404);
    assert.equal(res.body.attempt, undefined);
  }
});
test("invalid IDs and answer shapes are rejected before database access", async () => {
  QuizAttempt.findOne = () => { throw new Error("must not query"); };
  for (const body of [{ questionIndex: -1, selectedAnswer: "Queue" }, { questionIndex: "0", selectedAnswer: "Queue" }, {}]) {
    const res = response(); await checkQuizAnswer(req(body), res); assert.equal(res.code, 400);
  }
  const res = response(); await getQuizAttempt({ ...req(), params: { attemptId: "bad" } }, res); assert.equal(res.code, 400);
});
test("history queries only this user's completed tests and uses bounded pagination", async () => {
  let filter;
  const query = {
    sort() { return this; }, skip(n) { assert.equal(n, 20); return this; },
    limit(n) { assert.equal(n, 21); return this; }, select() { return this; },
    lean: async () => Array.from({ length: 21 }, fresh),
  };
  QuizAttempt.find = value => { filter = value; return query; };
  const res = response(); await listQuizAttempts({ ...req(), query: { page: "2" } }, res);
  assert.deepEqual(filter, { user, status: "completed" });
  assert.equal(res.body.tests.length, 20);
  assert.equal(res.body.hasMore, true);
  assert.equal(res.body.tests[0].questions, undefined);
  const invalid = response(); await listQuizAttempts({ ...req(), query: { page: "-1" } }, invalid); assert.equal(invalid.code, 400);
});


test("server-owned Puter quiz needs no browser token and hides answer keys and owner credentials", async () => {
  process.env.PUTER_AUTH_TOKEN = "owner-session";
  Courses.findById = async () => ({ title: "Data structures" });
  axios.post = async (url, body, config) => {
    assert.equal(body.auth_token, "owner-session");
    return { data: { success: true, result: { message: { content: JSON.stringify([question]) } } } };
  };
  QuizAttempt.create = async data => {
    assert.equal(data.user, user);
    assert.equal(data.questions[0].correctAnswer, "Queue");
    assert.equal(data.puterToken, undefined);
    assert.equal(JSON.stringify(data).includes("owner-session"), false);
    return { ...fresh(), ...data };
  };
  const res = response();
  await aiQuiz(req({ courseId: id, numQuestions: 1, difficulty: "medium" }), res);
  assert.equal(res.code, 201);
  assert.deepEqual(res.body.attempt.questions, [{ question: question.question, options: question.options }]);
  assert.equal(JSON.stringify(res.body).includes("owner-session"), false);
});
test("browser-supplied Puter credentials are not used as a substitute for server configuration", async () => {
  delete process.env.PUTER_AUTH_TOKEN; delete process.env.GROQ_API_KEY; delete process.env.GEMINI_API;
  Courses.findById = async () => ({ title: "Data structures" });
  axios.post = () => assert.fail("must not use learner credential");
  const res = response();
  await aiQuiz({ ...req({ courseId: id, numQuestions: 1 }), headers: { "x-puter-token": "untrusted-browser-session" } }, res);
  assert.equal(res.code, 503);
  assert.equal(res.body.code, "QUIZ_BROWSER_GENERATION_REQUIRED");
  assert.match(res.body.prompt, /Data structures/);
});
test("invalid Puter-generated questions are rejected without creating an attempt", async () => {
  process.env.PUTER_AUTH_TOKEN = "owner-session";
  Courses.findById = async () => ({ title: "Data structures" });
  axios.post = async () => ({ data: { success: true, result: { message: { content: "[]" } } } });
  QuizAttempt.create = () => assert.fail("must not save malformed quiz");
  const res = response();
  await aiQuiz({ ...req({ courseId: id, numQuestions: 1 }), headers: { "x-puter-token": "session" } }, res);
  assert.equal(res.code, 502);
});


test("browser Puter practice is validated and persisted with server-owned identity and zero starting score", async () => {
  delete process.env.PUTER_AUTH_TOKEN; delete process.env.GROQ_API_KEY; delete process.env.GEMINI_API;
  Courses.findById = async () => ({ title: "Data structures" });
  axios.post = () => assert.fail("browser-generated practice needs no provider key");
  QuizAttempt.create = async data => {
    assert.equal(data.user, user);
    assert.equal(data.topic, "Data structures");
    assert.equal(data.generationSource, "browser-puter");
    assert.equal(data.score, undefined);
    assert.equal(data.status, undefined);
    assert.equal(data.answers, undefined);
    return { ...fresh(), ...data };
  };
  const res = response();
  await aiQuiz(req({ courseId: id, numQuestions: 1, difficulty: "medium", generatedQuiz: JSON.stringify([question]), score: 100, answers: [{ isCorrect: true }], status: "completed", user: otherUser }), res);
  assert.equal(res.code, 201);
  assert.equal(res.body.attempt.score, 0);
  assert.equal(res.body.attempt.status, "in_progress");
  assert.equal(res.body.attempt.questions[0].correctAnswer, undefined);
});
test("malformed browser output, wrong count and invalid answer keys cannot create practice attempts", async () => {
  Courses.findById = async () => ({ title: "Data structures" });
  QuizAttempt.create = () => assert.fail("must validate before saving");
  for (const raw of ["not JSON", "[]", JSON.stringify([{ ...question, correctAnswer: "Not an option" }])]) {
    const res = response();
    await aiQuiz(req({ courseId: id, numQuestions: 1, generatedQuiz: raw }), res);
    assert.equal(res.code, 400);
  }
  assert.equal(geminiQuizSchema.safeParse({ courseId: id, numQuestions: 1, generatedQuiz: "x".repeat(80001) }).success, false);
});
