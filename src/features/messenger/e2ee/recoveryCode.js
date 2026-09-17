/**
 * Chat recovery codes.
 *
 * 24 Crockford Base32 characters (120 bits of randomness), shown to the user in
 * dashed blocks of 4:  WGN2-8F9K-M3NP-7X4R-29TV-B8CQ
 *
 * Crockford's alphabet drops I, L, O and U so a code read aloud or copied by
 * hand can't be confused; when typed back in, I/L are read as 1 and O as 0.
 *
 * The normalized form (no dashes, upper case) is the secret fed into PBKDF2.
 */

export const RECOVERY_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const RECOVERY_CODE_LENGTH = 24;
const GROUP_SIZE = 4;

/** New random recovery code, formatted for display ("XXXX-XXXX-...-XXXX"). */
export function generateRecoveryCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(RECOVERY_CODE_LENGTH));
  // 256 is a multiple of 32, so masking to 5 bits keeps every character equally likely
  const raw = Array.from(bytes, (b) => RECOVERY_ALPHABET[b & 31]).join("");
  return formatRecoveryCode(raw);
}

/** Groups a normalized code into dashed blocks of 4 for display. */
export function formatRecoveryCode(code) {
  const normalized = normalizeRecoveryCode(code);
  return normalized.match(new RegExp(`.{1,${GROUP_SIZE}}`, "g"))?.join("-") ?? "";
}

/**
 * Cleans up what the user typed or pasted: drops dashes and whitespace,
 * upper-cases, and maps look-alike characters (I/L -> 1, O -> 0).
 * Does not check length or alphabet — use {@link isValidRecoveryCode} for that.
 */
export function normalizeRecoveryCode(input) {
  return String(input ?? "")
    .replace(/[\s-]+/g, "")
    .toUpperCase()
    .replace(/[IL]/g, "1")
    .replace(/O/g, "0");
}

/** True when the input normalizes to exactly 24 valid Crockford Base32 characters. */
export function isValidRecoveryCode(input) {
  const normalized = normalizeRecoveryCode(input);
  return (
    normalized.length === RECOVERY_CODE_LENGTH &&
    [...normalized].every((c) => RECOVERY_ALPHABET.includes(c))
  );
}
