# Input sanitization

All user-controlled text in the app is sanitized via `src/lib/sanitize.ts` to limit abuse (payload size, control characters). Use this layer for **any new free-text input** (forms, search, etc.).

## Rules

- **Trim** leading/trailing whitespace when submitting (e.g. login, add word).
- **Max length** per field: email 255, password 128, word/translation 500, search 200.
- **Control characters** (ASCII 0x00–0x1F except tab/newline, and 0x7F) are stripped.
- **HTML**: We do not render user input as raw HTML; React escapes by default. If you ever use `dangerouslySetInnerHTML` or inject user content into attributes, add HTML sanitization (e.g. DOMPurify) and keep it in this layer.

## Usage

- **On submit**: Use `sanitizeEmail`, `sanitizePassword`, `sanitizeWord`, `sanitizeTranslation`, or `sanitizeSearch` so the value sent to the API/DB is trimmed, stripped, and length-limited.
- **On change (optional)**: Use `clampAndStripControlChars(value, maxLength)` so the input field cannot exceed the limit and control chars are removed as the user types; avoid trimming on every keystroke so UX is not surprising.

## Where it’s applied

- **Auth**: Login, Signup, Forgot password — email and password.
- **Library**: Add word (word, translation), Edit word (word, translation), Search.
- **Settings**: No free text; only selects from app-defined options.

## Adding new inputs

1. If the field has a new semantic (e.g. “notes”), add a constant and helper in `sanitize.ts` (e.g. `MAX_NOTES_LENGTH`, `sanitizeNotes`).
2. Use the sanitizer on submit and, if desired, `clampAndStripControlChars` in `onChange`.
3. Document the new limit in this file.
