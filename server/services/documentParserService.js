import { createRequire } from "module";
import axios from "axios";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const GEMINI_VISION_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * Extract raw text from PDF buffer
 */
export async function extractTextFromPdf(buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result?.text || "";
  } catch (error) {
    console.error("PDF parsing error:", error.message || error);
    throw new Error("Failed to extract text from PDF file.");
  }
}

/**
 * Extract raw text from Plain Text buffer
 */
export function extractTextFromTxt(buffer) {
  try {
    return buffer.toString("utf-8");
  } catch (error) {
    console.error("TXT reading error:", error);
    throw new Error("Failed to read text file.");
  }
}

/**
 * Extract OCR text from Image buffer using Gemini Vision API
 */
export async function extractTextFromImage(buffer, mimeType = "image/png") {
  const apiKey = process.env.GEMINI_API;

  if (!apiKey) {
    throw new Error("GEMINI_API key is required for image text extraction.");
  }

  const base64Data = buffer.toString("base64");

  const payload = {
    contents: [
      {
        parts: [
          {
            text: "Extract all readable text, titles, headings, numbers, formulas, and data verbatim from this image.",
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
  };

  try {
    const { data } = await axios.post(
      `${GEMINI_VISION_URL}?key=${apiKey}`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch (error) {
    console.error("Image OCR Vision error:", error.response?.data || error.message);
    throw new Error("Failed to perform OCR text extraction from image.");
  }
}

/**
 * Unified text extractor based on file type
 */
export async function extractTextFromFile(buffer, fileType, mimeType) {
  if (fileType === "pdf") {
    return await extractTextFromPdf(buffer);
  }
  if (fileType === "txt") {
    return extractTextFromTxt(buffer);
  }
  if (fileType === "image") {
    return await extractTextFromImage(buffer, mimeType);
  }
  throw new Error(`Unsupported file type: ${fileType}`);
}
