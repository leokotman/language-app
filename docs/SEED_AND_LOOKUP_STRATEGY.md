# Seed data and lookup strategy

This document captures two product/design decisions for Week 5 (app library) and dictionary behavior.

---

## 1. Seed data: aligned triples for virtual pair RU ↔ SR

### Requirement

The **virtual pair** "Russian ↔ Serbian (via English)" must translate correctly in **both directions**. That means the same **concept** must exist in all three languages (EN, RU, SR) so that:

- Russian → Serbian uses the same meaning as English (e.g. "любовь" → "ljubav", not a different sense).
- Serbian → Russian uses the same meaning (e.g. "ljubav" → "любовь").

So we do **not** seed EN↔RU and EN↔SR independently with different word lists. We seed **aligned triples**: each concept has one word in English, one in Russian, and one in Serbian.

### Data shape

For each concept we have a triple:

- `word_en` (English)
- `word_ru` (Russian)
- `word_sr` (Serbian, Latin)

Example: `("love", "любовь", "ljubav")`.

### How we store it in `vocabulary`

The `vocabulary` table has rows with `(word, translation, language_from, language_to, source)`. For each triple we insert **six rows** (all directions for the three pairs):

| word   | translation | language_from | language_to | source |
| ------ | ----------- | ------------- | ----------- | ------ |
| love   | любовь      | en            | ru          | app    |
| любовь | love        | ru            | en          | app    |
| love   | ljubav      | en            | sr          | app    |
| ljubav | love        | sr            | en          | app    |
| любовь | ljubav      | ru            | sr          | app    |
| ljubav | любовь      | sr            | ru          | app    |

So:

- **EN↔RU** and **EN↔SR** seeds come from the same triple set.
- **RU↔SR** (virtual pair) seeds use the same triple set: the same word in RU and SR always corresponds to the same concept (via the shared EN form).

### Sourcing seed data

- Build or obtain **one list of triples** (en, ru, sr) — e.g. ~500 common words/concepts.
- Generate the six rows per triple for the seed migration or script.
- This guarantees that when a user browses or studies "Russian ↔ Serbian (via English)", each word translates correctly in both directions and matches the same concept as in EN↔RU and EN↔SR.

---

## 2. Lookup logic: store first, then API (online vs offline)

### Requirement

When the user looks up a word (e.g. in the Dictionary or any translation feature):

1. **First** search in the data we already have in the **store** (app library + user’s personal library).
2. **If found** → use that; no API call.
3. **If not found** and we have **internet** and **Offline mode is off** → call the external API (e.g. MyMemory).
4. **If not found** and either **no internet** or **Offline mode is on** (PWA offline) → do **not** call the API; show a clear message, e.g. _"We need an internet connection to translate this word."_

So: **store-first**, then API only when online and not in Offline mode; otherwise show the offline message.

### Definitions

- **Store** = vocabulary data we have in the app:
  - **App library:** seeded vocabulary (from §1).
  - **User library:** user’s personal vocabulary (from Supabase).
  - Optionally, in a later step: **cached** API results (e.g. IndexedDB) can be considered part of “store” for lookup.
- **Online** = browser has network connectivity (navigator.onLine or similar).
- **Offline mode** = user toggle in navbar (persisted in localStorage); when on, we never call dictionary/translation APIs.

### Flow (summary)

| Store has result? | Online? | Offline mode? | Action                                                                                                            |
| ----------------- | ------- | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| Yes               | any     | any           | Return store result (no API)                                                                                      |
| No                | Yes     | Off           | Call API                                                                                                          |
| No                | No      | any           | Show: "We need an internet connection to translate this word."                                                    |
| No                | any     | On            | Show: "We need an internet connection to translate this word." (or "Turn off Offline mode to look up this word.") |

### Where this applies

- **Dictionary page:** lookup(query, from, to) should follow the flow above.
- Any future “translate this word” or “look up in dictionary” from other screens should use the same logic.

### Implementation notes

- **Store query:** For “search in store” we need to query (or replicate) app library + user library by (word or translation, language_from, language_to) — e.g. Supabase or a local cache of that data.
- **Offline detection:** Use `navigator.onLine` and/or network errors; when offline, skip API and show the message.
- **Offline mode toggle:** Already exists; when on, skip API and show the message even if navigator.onLine is true.
- **Message copy:** Can be one of:
  - _"We need an internet connection to translate this word."_
  - _"This word wasn’t found in your library. Turn off Offline mode or connect to the internet to look it up."_

Use the same logic for both “no connection” and “Offline mode on” so behavior is consistent (no API, show message).

---

_Last updated: design decision before Week 5 seed + app library implementation._
