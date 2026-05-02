import express from "express";
import aiController from "../controllers/aiController.js";
import aiQuiz from "../controllers/aiQuiz.js";
import { validate } from "../middlewares/validate.js";
import { geminiPromptSchema, geminiQuizSchema } from "../schemas/geminiSchema.js";

const router = express.Router();

// BEFORE: router.post("/", aiController);
// AFTER: Added validation for prompt input with length limits
router.post("/", validate(geminiPromptSchema), aiController);

router.post("/quiz", validate(geminiQuizSchema), aiQuiz);

export default router;
