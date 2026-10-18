import { z } from "zod";

const questionSchema = z.object({
  question: z.string().trim().min(1).max(3000),
  options: z.array(z.string().trim().min(1).max(2000)).length(4),
  correctAnswer: z.string().trim().min(1),
  explanation: z.string().trim().min(1).max(5000),
}).refine(q => new Set(q.options).size === 4 && q.options.includes(q.correctAnswer), {
  message: "Question must contain four unique options and a matching correct answer",
});
export function parseGeneratedQuiz(raw, count) {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start < 0 || end < start) throw new Error("AI returned an invalid quiz; please try again");
  return z.array(questionSchema).length(count).parse(JSON.parse(raw.slice(start, end + 1)));
}

export function publicAttempt(attempt) {
  return {
    _id: attempt._id,
    courseId: attempt.courseId,
    topic: attempt.topic,
    difficulty: attempt.difficulty,
    status: attempt.status,
    score: attempt.score,
    createdAt: attempt.createdAt,
    completedAt: attempt.completedAt,
    questions: attempt.questions.map(q => ({ question: q.question, options: q.options })),
    answers: attempt.answers,
  };
}
