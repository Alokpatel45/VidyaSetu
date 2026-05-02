import { z } from "zod";

/**
 * Gemini Prompt Schema
 * BEFORE: No validation, unsanitized prompts sent directly to API
 * AFTER: Length limit, required field, safe string validation
 */
export const geminiPromptSchema = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(10000, "Question must not exceed 10000 characters")
    .trim()
    .refine((val) => val.length > 0, "Question cannot contain only whitespace"),
});

/**
 * Gemini Quiz Schema
 * BEFORE: No validation on quiz structure
 * AFTER: Strict schema validation for quiz generation
 */
export const geminiQuizSchema = z.object({
  topic: z
    .string()
    .min(3, "Topic must be at least 3 characters")
    .max(200, "Topic must not exceed 200 characters")
    .trim(),
  numQuestions: z.coerce
    .number()
    .int("Number of questions must be an integer")
    .min(1, "Must request at least 1 question")
    .max(50, "Cannot request more than 50 questions"),
  difficulty: z
    .enum(["easy", "medium", "hard"], {
      errorMap: () => ({
        message: "Difficulty must be 'easy', 'medium', or 'hard'",
      }),
    })
    .optional()
    .default("medium"),
});
