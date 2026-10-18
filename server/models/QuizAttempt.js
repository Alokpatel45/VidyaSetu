import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [String],
  correctAnswer: { type: String, required: true },
  explanation: { type: String, required: true },
}, { _id: false });
const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  selectedAnswer: String,
  correctAnswer: String,
  isCorrect: Boolean,
  explanation: String,
}, { _id: false });
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Courses", required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
  // Browser-generated practice questions are untrusted study material, not exam certification.
  generationSource: { type: String, enum: ["server", "browser-puter"], default: "server" },
  questions: { type: [questionSchema], required: true },
  answers: { type: [answerSchema], default: [] },
  score: { type: Number, default: 0 },
  status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
  completedAt: Date,
}, { timestamps: true });
schema.index({ user: 1, status: 1, completedAt: -1 });
export const QuizAttempt = mongoose.model("QuizAttempt", schema);
