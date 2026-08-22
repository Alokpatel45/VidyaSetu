import tryCatch from "../middlewares/tryCatch.js";
import { v4 as uuidv4 } from "uuid";
import { extractTextFromFile } from "../services/documentParserService.js";
import { chunkText, generateEmbedding } from "../services/embeddingService.js";
import DocumentChunk from "../models/DocumentChunk.js";

/**
 * Handle document upload (PDF, TXT, Image), text extraction, chunking, and embedding storage in MongoDB
 */
export const uploadDocument = tryCatch(async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: "Please upload a file (PDF, TXT, or Image)." });
  }

  const userId = req.user._id;
  const fileName = file.originalname;
  const mimeType = file.mimetype;

  let fileType = "txt";
  if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) {
    fileType = "pdf";
  } else if (mimeType.startsWith("image/")) {
    fileType = "image";
  }

  // 1. Extract text from file
  const rawText = await extractTextFromFile(file.buffer, fileType, mimeType);
  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ message: "Could not extract any text from the uploaded file." });
  }

  // 2. Chunk text
  const chunks = chunkText(rawText, 700, 100);
  if (chunks.length === 0) {
    return res.status(400).json({ message: "Extracted text was too short to generate chunks." });
  }

  const documentId = uuidv4();
  const chunkDocs = [];

  // 3. Generate embeddings & construct chunk documents
  for (let i = 0; i < chunks.length; i++) {
    const textChunk = chunks[i];
    try {
      const embedding = await generateEmbedding(textChunk);
      if (embedding && embedding.length > 0) {
        chunkDocs.push({
          userId,
          documentId,
          fileName,
          fileType,
          chunkIndex: i,
          text: textChunk,
          embedding,
        });
      }
    } catch (err) {
      console.warn(`Failed to generate embedding for chunk ${i} of ${fileName}:`, err.message);
    }
  }

  if (chunkDocs.length === 0) {
    return res.status(500).json({ message: "Failed to process document vector embeddings." });
  }

  // 4. Save to MongoDB
  await DocumentChunk.insertMany(chunkDocs);

  res.status(201).json({
    message: "Document uploaded and indexed successfully!",
    document: {
      documentId,
      fileName,
      fileType,
      chunkCount: chunkDocs.length,
      totalChars: rawText.length,
    },
  });
});

/**
 * List all indexed documents for current user
 */
export const getUserDocuments = tryCatch(async (req, res) => {
  const userId = req.user._id;

  const docs = await DocumentChunk.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: "$documentId",
        fileName: { $first: "$fileName" },
        fileType: { $first: "$fileType" },
        chunkCount: { $sum: 1 },
        createdAt: { $first: "$createdAt" },
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  res.json({ documents: docs });
});

/**
 * Delete a specific document and its vector chunks from MongoDB
 */
export const deleteUserDocument = tryCatch(async (req, res) => {
  const userId = req.user._id;
  const { documentId } = req.params;

  const result = await DocumentChunk.deleteMany({ userId, documentId });

  res.json({
    message: "Document deleted successfully",
    deletedChunks: result.deletedCount,
  });
});
