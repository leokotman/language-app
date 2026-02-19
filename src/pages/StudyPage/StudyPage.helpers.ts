import type { StudyCardItem } from "./StudyPage.models";
import type { ExerciseType } from "./StudyPage.models";

/** Normalize user answer for comparison: trim, collapse spaces, lowercase. */
export function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Check if user's answer matches the correct translation (normalized). */
export function isAnswerCorrect(
  userAnswer: string,
  correctTranslation: string,
): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctTranslation);
}

/** Deterministic shuffle so option order is stable for the same card. */
function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i);
  const rand = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 2 ** 32;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Pick N distractors (wrong answers) from other cards' translations. Prefer similar length. Order deterministic by seed. */
export function pickDistractors(
  cards: StudyCardItem[],
  currentCard: StudyCardItem,
  count: number,
): string[] {
  const correct = currentCard.vocabulary?.translation?.trim() ?? "";
  const others = cards
    .filter((c) => c.id !== currentCard.id)
    .map((c) => c.vocabulary?.translation?.trim())
    .filter((t): t is string => !!t && t !== correct);
  const unique = Array.from(new Set(others));
  if (unique.length <= count) return shuffleWithSeed(unique, currentCard.id);
  const correctLen = correct.length;
  const bySimilarity = [...unique].sort(
    (a, b) => Math.abs(a.length - correctLen) - Math.abs(b.length - correctLen),
  );
  const similar = bySimilarity.slice(0, count * 2);
  const shuffled = shuffleWithSeed(similar, currentCard.id);
  return shuffled.slice(0, count);
}

/** Build 4 options (translations): correct + 3 distractors, shuffled (deterministic per card). */
export function buildMultipleChoiceOptions(
  cards: StudyCardItem[],
  currentCard: StudyCardItem,
): string[] {
  const correct = currentCard.vocabulary?.translation?.trim() ?? "—";
  const distractors = pickDistractors(cards, currentCard, 3);
  const options = [correct, ...distractors];
  return shuffleWithSeed(options, currentCard.id);
}

/** Pick N distractors (wrong words) from other cards for reverse multiple choice. */
function pickWordDistractors(
  cards: StudyCardItem[],
  currentCard: StudyCardItem,
  count: number,
): string[] {
  const correct = currentCard.vocabulary?.word?.trim() ?? "";
  const others = cards
    .filter((c) => c.id !== currentCard.id)
    .map((c) => c.vocabulary?.word?.trim())
    .filter((w): w is string => !!w && w !== correct);
  const unique = Array.from(new Set(others));
  if (unique.length <= count) return shuffleWithSeed(unique, currentCard.id);
  const correctLen = correct.length;
  const bySimilarity = [...unique].sort(
    (a, b) => Math.abs(a.length - correctLen) - Math.abs(b.length - correctLen),
  );
  const similar = bySimilarity.slice(0, count * 2);
  const shuffled = shuffleWithSeed(similar, currentCard.id);
  return shuffled.slice(0, count);
}

/** Build 4 options (words) for reverse multiple choice: correct + 3 distractors. */
export function buildReverseMultipleChoiceOptions(
  cards: StudyCardItem[],
  currentCard: StudyCardItem,
): string[] {
  const correct = currentCard.vocabulary?.word?.trim() ?? "—";
  const distractors = pickWordDistractors(cards, currentCard, 3);
  const options = [correct, ...distractors];
  return shuffleWithSeed(options, currentCard.id);
}

/** Assign exercise type per card: random among enabled types. */
export function assignExerciseTypes(
  cardCount: number,
  enabledTypes: ExerciseType[],
): ExerciseType[] {
  if (enabledTypes.length === 0) return [];
  if (enabledTypes.length === 1) return Array(cardCount).fill(enabledTypes[0]);
  const result: ExerciseType[] = [];
  for (let i = 0; i < cardCount; i++) {
    result.push(enabledTypes[Math.floor(Math.random() * enabledTypes.length)]);
  }
  return result;
}

/** Map app language code to BCP 47 for SpeechSynthesis. Use script where it helps (e.g. Serbian Latin). */
const LANG_TO_BCP47: Record<string, string> = {
  en: "en",
  ru: "ru",
  sr: "sr-Latn", // Serbian Latin so TTS uses correct pronunciation for words like "veče"
};

/** Human-readable language names for messages (e.g. "Install Serbian voice"). */
export const LANG_DISPLAY_NAMES: Record<string, string> = {
  en: "English",
  ru: "Russian",
  sr: "Serbian",
};

const TTS_DEBUG = true; // set to false when done debugging

/**
 * Pick a voice that matches the requested language so TTS uses the word's language
 * instead of OS/browser default. Returns null if none found (browser will choose).
 */
function getVoiceForLang(
  synth: SpeechSynthesis,
  bcp47: string,
): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  if (TTS_DEBUG) {
    console.group("[TTS] getVoiceForLang");
    console.log("requested bcp47:", bcp47);
    console.log(
      "voices count:",
      voices.length,
      voices.map((v) => ({ lang: v.lang, name: v.name, default: v.default })),
    );
  }
  const primary = bcp47.split("-")[0].toLowerCase();
  // Prefer exact lang match, then any voice whose lang starts with the primary tag (e.g. sr-RS, sr-Latn).
  const exact = voices.find(
    (v) => v.lang.toLowerCase() === bcp47.toLowerCase(),
  );
  if (exact) {
    if (TTS_DEBUG)
      console.log("selected voice (exact):", exact.lang, exact.name);
    if (TTS_DEBUG) console.groupEnd();
    return exact;
  }
  const primaryMatch = voices.find((v) =>
    v.lang.toLowerCase().startsWith(primary + "-"),
  );
  if (primaryMatch) {
    if (TTS_DEBUG)
      console.log(
        "selected voice (primary match):",
        primaryMatch.lang,
        primaryMatch.name,
      );
    if (TTS_DEBUG) console.groupEnd();
    return primaryMatch;
  }
  const fallback = voices.find(
    (v) => v.lang.toLowerCase().split("-")[0] === primary,
  );
  if (TTS_DEBUG)
    console.log(
      "selected voice:",
      fallback ? `${fallback.lang} ${fallback.name}` : "none",
    );
  if (TTS_DEBUG) console.groupEnd();
  return fallback ?? null;
}

/**
 * Check if the device has a TTS voice for the given language.
 * Returns false when voices are not loaded yet (e.g. Chrome) or when no matching voice exists.
 */
export function hasVoiceForLang(langCode: string): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return false; // voices may load async (Chrome)
  const bcp47 = LANG_TO_BCP47[langCode] ?? langCode;
  return getVoiceForLang(window.speechSynthesis, bcp47) !== null;
}

export type SpeakWordResult =
  | { spoke: true }
  | { spoke: false; missingLang: string };

/**
 * Speak text using the Web Speech API (TTS). Uses the word's language (en, ru, sr), not OS/browser locale.
 * If no voice is available for that language, does not speak (to avoid wrong pronunciation) and returns
 * missingLang so the UI can ask the user to install a TTS voice in system settings.
 */
export function speakWord(text: string, langCode: string): SpeakWordResult {
  if (TTS_DEBUG) {
    console.group("[TTS] speakWord");
    console.log("text:", text, "| langCode:", langCode);
  }
  if (typeof window === "undefined" || !window.speechSynthesis) {
    if (TTS_DEBUG) console.log("result: no window/speechSynthesis");
    if (TTS_DEBUG) console.groupEnd();
    return { spoke: false, missingLang: langCode };
  }
  const synth = window.speechSynthesis;
  const bcp47 = LANG_TO_BCP47[langCode] ?? langCode;
  if (TTS_DEBUG) console.log("bcp47:", bcp47);
  const voice = getVoiceForLang(synth, bcp47);
  const voices = synth.getVoices();
  // Only speak when we have a matching voice. If voices haven't loaded yet (Chrome: voices.length === 0)
  // or there is no voice for this language, don't speak — otherwise the browser uses default (e.g. English).
  if (!voice) {
    if (TTS_DEBUG)
      console.log(
        "result: no matching voice",
        voices.length === 0 ? "(voices not loaded yet)" : "→ missingLang",
        langCode,
      );
    if (TTS_DEBUG) console.groupEnd();
    return { spoke: false, missingLang: langCode };
  }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = bcp47;
  utterance.rate = 0.9;
  utterance.voice = voice;
  if (TTS_DEBUG)
    console.log(
      "speaking with utterance.lang:",
      utterance.lang,
      "utterance.voice:",
      utterance.voice?.name ?? utterance.voice?.lang ?? "none",
    );
  synth.cancel();
  synth.speak(utterance);
  if (TTS_DEBUG) console.log("result: spoke: true");
  if (TTS_DEBUG) console.groupEnd();
  return { spoke: true };
}

/** Play a recording blob via an Audio element; revokes the object URL when done. */
export function playRecordingBlob(blob: Blob): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.onerror = () => URL.revokeObjectURL(url);
  audio.play().catch(() => URL.revokeObjectURL(url));
}
