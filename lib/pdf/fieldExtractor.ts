import { PDFDocument } from "pdf-lib";

/**
 * Extract all AcroForm field names from a PDF buffer.
 */
export async function extractPdfFieldNames(buffer: Buffer): Promise<string[]> {
  const pdfDoc = await PDFDocument.load(buffer);
  const form = pdfDoc.getForm();

  const fields = form.getFields();
  const names = fields.map((field) => field.getName());

  return Array.from(new Set(names)).sort();
}
