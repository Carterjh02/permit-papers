import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient({
  projectId: process.env.GOOGLE_PROJECT_ID!,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  },
});

export async function extractTextFromImage(gcsOrUrlOrBuffer: string | Buffer) {
  const isString = typeof gcsOrUrlOrBuffer === "string";

  const [result] = await client.textDetection(
    isString
      ? gcsOrUrlOrBuffer
      : { image: { content: gcsOrUrlOrBuffer } }
  );

  return result.fullTextAnnotation?.text ?? "";
}
