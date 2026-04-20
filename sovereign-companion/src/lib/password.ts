import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const [, salt, expectedHex] = stored.split("$");
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const derived = scryptSync(password, salt, KEY_LEN);
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
