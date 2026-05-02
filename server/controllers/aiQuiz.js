import tryCatch from "../middlewares/tryCatch.js";
import { generateAiText } from "../services/aiService.js";

const aiQuiz = tryCatch(async (req, res) => {
  const { topic, numQuestions, difficulty } = req.body;

  const prompt = `
Generate ${numQuestions} multiple-choice questions on the subject "${topic}" at ${difficulty} difficulty level.

Each question should be a JSON object with:
- "question": string
- "options": array of 4 strings
- "correctAnswer": one of the options

Return ONLY a JSON array of such objects.
Do NOT include any explanation, markdown (like \`\`\`json), or additional text.
Ensure the questions are different on each request.
`;

  const raw = await generateAiText(prompt);
  if (!raw) {
    return res.status(500).json({ error: "No response from AI" });
  }

  // Robust JSON extraction: look for the first [ and last ]
  let jsonString = raw;
  const startIdx = raw.indexOf("[");
  const endIdx = raw.lastIndexOf("]");
  
  if (startIdx !== -1 && endIdx !== -1) {
    jsonString = raw.substring(startIdx, endIdx + 1);
  } else {
    // If no brackets found, try cleaning markdown as a fallback
    jsonString = raw.replace(/```json|```/g, "").trim();
  }

  let quizArray;
  try {
    quizArray = JSON.parse(jsonString);
  } catch (parseError) {
    console.error("JSON parse error:", parseError.message, "Raw:", raw);
    return res.status(500).json({
      error: "Failed to parse quiz response from AI",
      details: "The AI did not return a valid JSON array.",
    });
  }

  res.json({ quiz: quizArray });
});

export default aiQuiz;
