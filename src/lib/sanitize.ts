/**
 * Input sanitization layer for user-controlled data (OWASP-oriented).
 * Use for: auth forms, Library add/edit word, search, and any future free-text inputs.
 *
 * Rules:
 * - Trim leading/trailing whitespace on all text.
 * - Enforce max length per field to limit payload size and DB/storage abuse.
 * - Strip control characters (e.g. NUL, other ASCII 0x00–0x1F except newline/tab).
 * - React escapes by default when rendering; no HTML sanitization here unless we
 *   ever render raw HTML from user input (then add e.g. DOMPurify).
 */

/** Max length for email (RFC 5321). */
export const MAX_EMAIL_LENGTH = 255

/** Min/max length for password (Supabase min 6; upper bound to avoid abuse). */
export const MIN_PASSWORD_LENGTH = 6
export const MAX_PASSWORD_LENGTH = 128

/** Max length for vocabulary word and translation (DB: text, no limit; we cap for safety). */
export const MAX_WORD_LENGTH = 500
export const MAX_TRANSLATION_LENGTH = 500

/** Max length for search query (debounce is applied in UI where needed). */
export const MAX_SEARCH_LENGTH = 200

/** Strip control chars except tab (0x09), newline (0x0A), carriage return (0x0D). */
function stripControlChars(value: string): string {
  let out = ''
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i)
    if (charCode === 9 || charCode === 10 || charCode === 13) out += value[i]
    else if (charCode < 32 || charCode === 127) continue
    else out += value[i]
  }
  return out
}

/**
 * Trim and strip control characters from a string.
 * Use before validating length or sending to API.
 */
export function normalizeText(value: string): string {
  return stripControlChars(value).trim()
}

/**
 * Sanitize text: trim, strip control chars, then clamp to max length.
 * Returns the sanitized string (may be empty).
 */
export function sanitizeText(value: string, maxLength: number): string {
  const normalized = normalizeText(value)
  return normalized.length > maxLength ? normalized.slice(0, maxLength) : normalized
}

/**
 * Sanitize email: trim and clamp to MAX_EMAIL_LENGTH.
 * Does not validate format; use type="email" or a validator for that.
 */
export function sanitizeEmail(value: string): string {
  return sanitizeText(value, MAX_EMAIL_LENGTH)
}

/**
 * Clamp length and strip control chars only (no trim). Use in onChange so typing is not disrupted.
 */
export function clampAndStripControlChars(value: string, maxLength: number): string {
  const stripped = stripControlChars(value)
  return stripped.length > maxLength ? stripped.slice(0, maxLength) : stripped
}

/**
 * Sanitize password: trim and clamp to MAX_PASSWORD_LENGTH (use on submit).
 * Does not check minimum length; validate that in the form.
 */
export function sanitizePassword(value: string): string {
  return stripControlChars(value).trim().slice(0, MAX_PASSWORD_LENGTH)
}

/**
 * Sanitize vocabulary word or translation.
 */
export function sanitizeWord(value: string): string {
  return sanitizeText(value, MAX_WORD_LENGTH)
}

export function sanitizeTranslation(value: string): string {
  return sanitizeText(value, MAX_TRANSLATION_LENGTH)
}

/**
 * Sanitize search query (e.g. Library search).
 */
export function sanitizeSearch(value: string): string {
  return sanitizeText(value, MAX_SEARCH_LENGTH)
}
