/* eslint-disable @typescript-eslint/no-require-imports */

const Tesseract = require("tesseract.js-node");

/**
 * Runs OCR on an image buffer using tesseract.js-node (server-safe).
 */
export async function runOCR(imageBuffer: Buffer): Promise<string> {
  try {
    const result = await Tesseract.recognize(imageBuffer, "eng", {
      logger: () => {}, // silence logs
    });

    return result?.data?.text?.trim() || "";
  } catch (err) {
    console.error("❌ OCR ERROR:", err);
    throw new Error("Failed to extract text from image.");
  }
}
