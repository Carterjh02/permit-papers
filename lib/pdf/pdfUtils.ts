export function bufferToBase64(buffer: Uint8Array): string {
  return Buffer.from(buffer).toString("base64");
}

export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}
