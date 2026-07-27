import vision from "@google-cloud/vision";
import fs from "fs";
import path from "path";

const client = new vision.ImageAnnotatorClient({
  projectId: process.env.GOOGLE_PROJECT_ID!,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  },
});

export async function extractTextFromImage(gcsOrUrlOrBuffer: string | Buffer) {
  const isString = typeof gcsOrUrlOrBuffer === "string";

  // Minimal terminal logs
  console.log("🔵 [OCR] INPUT TYPE:", isString ? "string" : "buffer");
  if (!isString) {
    console.log("🔵 [OCR] BUFFER SIZE:", (gcsOrUrlOrBuffer as Buffer).length);
  }

  // Run OCR exactly as before
  const [result] = await client.textDetection(
    isString
      ? gcsOrUrlOrBuffer
      : { image: { content: gcsOrUrlOrBuffer } }
  );

  const annotation = result.fullTextAnnotation;
  const text = annotation?.text ?? "";

  // Write OCR output to file instead of terminal
  try {
    const logDir = path.join(process.cwd(), "ocr_logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filePath = path.join(logDir, `ocr-${timestamp}.txt`);

    fs.writeFileSync(filePath, text, "utf8");

    console.log("🔵 [OCR] Output written to:", filePath);
  } catch (err) {
    console.error("❌ [OCR] Failed to write log file:", err);
  }

  return text;
}
