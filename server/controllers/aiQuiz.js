import mongoose from "mongoose";
import tryCatch from "../middlewares/tryCatch.js";
import { generateQuizText } from "../services/puterQuiz.js";
import { Courses } from "../models/Courses.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { submitAnswer } from "../services/quizScoring.js";
import { parseGeneratedQuiz, publicAttempt } from "../services/quizValidation.js";
import { z } from "zod";

const validId = id => typeof id === "string" && mongoose.isObjectIdOrHexString(id);

const aiQuiz = tryCatch(async (req, res) => {
  const { courseId, numQuestions, difficulty, generatedQuiz } = req.body;
  if (!validId(courseId)) return res.status(400).json({ message: "Invalid course ID" });
  const course = await Courses.findById(courseId);
  if (!course) return res.status(404).json({ message: "Course not found" });
  const prompt = `Generate ${numQuestions} different multiple-choice questions about ${JSON.stringify(course.title)} at ${difficulty} difficulty. Return ONLY a JSON array. Each object must have question (string), options (four distinct strings), correctAnswer (exactly one of the options), and explanation (a concise explanation of why the answer is correct).`;
  let raw = generatedQuiz;
  if (raw === undefined) {
    try {
      raw = await generateQuizText(prompt);
    } catch {
      // Match the tutor's browser Puter fallback; no API key or owner token is
      // required when the browser already has the tutor's working Puter session.
      return res.status(503).json({
        code: "QUIZ_BROWSER_GENERATION_REQUIRED",
        message: "Use the tutor's AI connection to generate this practice quiz.",
        prompt,
      });
    }
  }
  let questions;
  try {
    questions = parseGeneratedQuiz(raw || "", numQuestions);
  } catch {
    return res.status(generatedQuiz === undefined ? 502 : 400).json({ message: "AI returned an invalid quiz; please try again" });
  }
  const attempt = await QuizAttempt.create({
    user: req.user._id, courseId, topic: course.title, difficulty, questions,
    generationSource: generatedQuiz === undefined ? "server" : "browser-puter",
  });
  res.status(201).json({ attempt: publicAttempt(attempt) });
});

export const getQuizAttempt = tryCatch(async (req, res) => {
  if (!validId(req.params.attemptId)) return res.status(400).json({ message: "Invalid attempt ID" });
  const attempt = await QuizAttempt.findOne({ _id: req.params.attemptId, user: req.user._id }).lean();
  if (!attempt) return res.status(404).json({ message: "Quiz attempt not found" });
  res.json({ attempt: publicAttempt(attempt) });
});

const answerSchema = z.object({
  questionIndex: z.number().int().min(0).max(49),
  selectedAnswer: z.string().min(1).max(2000),
});
export const checkQuizAnswer = tryCatch(async (req, res) => {
  if (!validId(req.params.attemptId)) return res.status(400).json({ message: "Invalid attempt ID" });
  const parsed = answerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid answer submission" });
  const filter = { _id: req.params.attemptId, user: req.user._id };
  const attempt = await QuizAttempt.findOne(filter).lean();
  if (!attempt) return res.status(404).json({ message: "Quiz attempt not found" });
  const { questionIndex, selectedAnswer } = parsed.data;
  // Safe retry after a lost response. A different answer can never replace a checked one.
  if (attempt.answers[questionIndex]?.selectedAnswer === selectedAnswer) {
    return res.json({ attempt: publicAttempt(attempt) });
  }
  let next;
  try {
    next = submitAnswer(attempt, questionIndex, selectedAnswer);
  } catch (error) {
    return res.status(409).json({ message: error.message });
  }
  const updated = await QuizAttempt.findOneAndUpdate({
    ...filter, status: "in_progress", __v: attempt.__v,
  }, {
    $set: { answers: next.answers, score: next.score, status: next.status, completedAt: next.completedAt },
    $inc: { __v: 1 },
  }, { new: true, runValidators: true }).lean();
  if (!updated) return res.status(409).json({ message: "Attempt changed; reload before continuing" });
  res.json({ attempt: publicAttempt(updated) });
});

export const listQuizAttempts = tryCatch(async (req, res) => {
  const parsedPage = Number(req.query.page || 1);
  if (!Number.isSafeInteger(parsedPage) || parsedPage < 1 || parsedPage > 10000) {
    return res.status(400).json({ message: "Invalid page" });
  }
  const attempts = await QuizAttempt.find({ user: req.user._id, status: "completed" })
    .sort({ completedAt: -1, _id: -1 }).skip((parsedPage - 1) * 20).limit(21)
    .select("topic courseId difficulty score completedAt createdAt questions.question").lean();
  res.json({
    tests: attempts.slice(0, 20).map(a => ({
      _id: a._id, topic: a.topic, courseId: a.courseId, difficulty: a.difficulty,
      score: a.score, totalQuestions: a.questions.length, completedAt: a.completedAt,
    })),
    hasMore: attempts.length > 20,
  });
});

export default aiQuiz;
