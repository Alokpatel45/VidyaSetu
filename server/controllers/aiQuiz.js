import axios from "axios";

const aiQuiz = async (req, res) => {
  const subject = req.body.subject;
  const prompt = `
Generate a quiz of 10 multiple-choice questions on the subject "${subject}".

Each question should be a JSON object with:
- "question": string
- "options": array of 4 strings
- "correctAnswer": one of the options

Return ONLY a JSON array of such objects.
Do NOT include any explanation, markdown (like \`\`\`json), or additional text.
Ensure the questions are different on each request.
`;

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API,
        },
      }
    );

    let reply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

    reply = reply.replace(/```json|```/g, "").trim();

    const quizArray = JSON.parse(reply);

    res.json({ quiz: quizArray });
  } catch (error) {
    console.error("Gemini error:", error.response?.data || error.message);
    res.status(500).json({ error: "Error fetching from Gemini API" });
  }
};

export default aiQuiz;
