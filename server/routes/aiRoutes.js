import express from "express";
import aiController from "../controllers/aiController.js";
import aiQuiz from "../controllers/aiQuiz.js";
const router = express.Router();
router.post("/", aiController);
router.post("/quiz", aiQuiz);
export default router;
