import axios from "axios";
import DocumentChunk from "../models/DocumentChunk.js";

const PRIMARY_EMBEDDING_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent";

const FALLBACK_EMBEDDING_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

/**
 * Generate vector embedding for a string using Gemini embedding API
 */
export async function generateEmbedding(text) {
  const apiKey = process.env.GEMINI_API;

  if (!apiKey) {
    throw new Error("GEMINI_API key is missing in environment variables.");
  }

  // Clean and truncate text if too long for single embedding
  const sanitizedText = text.replace(/\s+/g, " ").trim().slice(0, 2048);
  if (!sanitizedText) return null;

  const payloadPrimary = {
    model: "models/gemini-embedding-2",
    content: {
      parts: [{ text: sanitizedText }],
    },
  };

  try {
    const { data } = await axios.post(
      `${PRIMARY_EMBEDDING_URL}?key=${apiKey}`,
      payloadPrimary,
      { headers: { "Content-Type": "application/json" } }
    );

    return data?.embedding?.values ?? null;
  } catch (primaryError) {
    console.warn("Gemini embedding-2 failed, trying fallback...", primaryError.message);

    try {
      const payloadFallback = {
        model: "models/gemini-embedding-001",
        content: {
          parts: [{ text: sanitizedText }],
        },
      };

      const { data } = await axios.post(
        `${FALLBACK_EMBEDDING_URL}?key=${apiKey}`,
        payloadFallback,
        { headers: { "Content-Type": "application/json" } }
      );

      return data?.embedding?.values ?? null;
    } catch (fallbackError) {
      console.error("Gemini embedding API error:", fallbackError.response?.data || fallbackError.message);
      throw new Error("Failed to generate vector embedding from Gemini API.");
    }
  }
}

/**
 * Chunk raw text into overlapping segments of specified size
 */
export function chunkText(rawText, chunkSize = 700, overlap = 100) {
  if (!rawText) return [];

  // Normalize newlines and extra spacing
  const normalized = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (normalized.length <= chunkSize) {
    return [normalized];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < normalized.length) {
    let endIndex = startIndex + chunkSize;

    // Try to break at paragraph or sentence end near chunkSize
    if (endIndex < normalized.length) {
      const nextBreak = normalized.lastIndexOf("\n", endIndex);
      if (nextBreak > startIndex + chunkSize * 0.5) {
        endIndex = nextBreak + 1;
      } else {
        const nextPeriod = normalized.lastIndexOf(". ", endIndex);
        if (nextPeriod > startIndex + chunkSize * 0.5) {
          endIndex = nextPeriod + 2;
        }
      }
    }

    const chunk = normalized.slice(startIndex, endIndex).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }

    startIndex = endIndex - overlap;
    if (startIndex >= normalized.length - 20) break;
  }

  return chunks;
}

/**
 * Calculate Cosine Similarity between two numeric vectors
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search MongoDB document chunks for top K most relevant matches to queryEmbedding
 */
export async function findTopKSimilarChunks(userId, queryEmbedding, topK = 5) {
  if (!userId || !queryEmbedding || queryEmbedding.length === 0) {
    return [];
  }

  // Fetch all chunks for this user from MongoDB
  const chunks = await DocumentChunk.find({ userId }).lean();
  if (chunks.length === 0) return [];

  // Calculate similarity for each chunk
  const scoredChunks = chunks.map((chunk) => {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    return {
      ...chunk,
      similarity,
    };
  });

  // Sort descending by similarity score
  scoredChunks.sort((a, b) => b.similarity - a.similarity);

  // Return top K chunks above a minimum relevance threshold (0.2)
  return scoredChunks.filter((c) => c.similarity > 0.2).slice(0, topK);
}
