import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

/**
 * Hash a portal password using scrypt with a per-user random salt.
 * Format: scrypt$<salt-hex>$<hash-hex>
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [scheme, salt, hash] = storedHash.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;

    const expected = Buffer.from(hash, "hex");
    const actual = scryptSync(password, salt, expected.length);

    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/**
 * Demo candidates created before portal passwords were introduced can sign in
 * with their CNIC digits, matching the guidance shown on the enrolment form.
 */
export function verifyCandidatePassword(
  password: string,
  cnic: string,
  storedHash?: string
): boolean {
  if (storedHash) return verifyPassword(password, storedHash);
  const digits = cnic.replace(/[^0-9]/g, "");
  return password.trim() === digits || password.trim() === cnic;
}
