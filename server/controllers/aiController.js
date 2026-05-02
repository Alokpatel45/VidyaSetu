import tryCatch from "../middlewares/tryCatch.js";
import { generateAiText } from "../services/aiService.js";

const aiController = tryCatch(async (req, res) => {
  const { question } = req.body;

  const text = await generateAiText(question);
  const reply = text ?? "No response";
  res.json({ reply });
});

export default aiController;
