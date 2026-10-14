import { timingSafeEqual } from "node:crypto";

/** Compare secrets without leaking their contents through ordinary string equality. */
export function safeEqual(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, "utf8");
    const rightBuffer = Buffer.from(right, "utf8");

    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}
