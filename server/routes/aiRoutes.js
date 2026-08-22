import express from "express";
import multer from "multer";
import aiController from "../controllers/aiController.js";
import aiQuiz from "../controllers/aiQuiz.js";
import { uploadDocument, getUserDocuments, deleteUserDocument } from "../controllers/ragController.js";
import { isAuth } from "../middlewares/isAuth.js";
import { validate } from "../middlewares/validate.js";
import { geminiPromptSchema, geminiQuizSchema } from "../schemas/geminiSchema.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = express.Router();

// AI Chat prompt endpoint (supports optional auth to attach RAG user documents)
router.post(
  "/",
  async (req, res, next) => {
    try {
      await isAuth(req, res, () => next());
    } catch {
      next();
    }
  },
  validate(geminiPromptSchema),
  aiController
);

router.post("/quiz", validate(geminiQuizSchema), aiQuiz);

// RAG Document Endpoints
router.post("/upload-doc", isAuth, upload.single("file"), uploadDocument);
router.get("/documents", isAuth, getUserDocuments);
router.delete("/documents/:documentId", isAuth, deleteUserDocument);

export default router;
