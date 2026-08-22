import tryCatch from "../middlewares/tryCatch.js";
import { generateAiText } from "../services/aiService.js";
import { generateEmbedding, findTopKSimilarChunks } from "../services/embeddingService.js";

const aiController = tryCatch(async (req, res) => {
  const { question, history } = req.body;
  const userId = req.user?._id;

  let ragContextPrompt = question;

  // Perform RAG Vector Search if user is authenticated
  if (userId) {
    try {
      const queryEmbedding = await generateEmbedding(question);

      if (queryEmbedding) {
        // Retrieve top 5 matching document chunks from MongoDB
        const topChunks = await findTopKSimilarChunks(userId, queryEmbedding, 5);

        if (topChunks.length > 0) {
          const contextText = topChunks
            .map(
              (c, idx) =>
                `[Source ${idx + 1}: ${c.fileName} (Chunk ${c.chunkIndex + 1})]\n${c.text}`
            )
            .join("\n\n");

          ragContextPrompt = `You are providing a context-grounded answer based on the student's uploaded study documents.

RELEVANT CONTEXT FROM UPLOADED DOCUMENTS:
${contextText}

STUDENT QUESTION:
${question}

INSTRUCTIONS: Use the provided document context above to accurately answer the question. Format your response cleanly with markdown.`;
        }
      }
    } catch (ragErr) {
      console.warn("RAG retrieval failed, continuing with standard prompt:", ragErr.message);
    }
  }

  const text = await generateAiText(ragContextPrompt, history);
  const reply = text ?? "No response";
  res.json({ reply });
});

export default aiController;
