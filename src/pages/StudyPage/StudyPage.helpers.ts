import type { StudyCardItem } from './StudyPage.models'
import type { ExerciseType } from './StudyPage.models'

/** Normalize user answer for comparison: trim, collapse spaces, lowercase. */
export function normalizeAnswer(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/** Check if user's answer matches the correct translation (normalized). */
export function isAnswerCorrect(userAnswer: string, correctTranslation: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctTranslation)
}

/** Deterministic shuffle so option order is stable for the same card. */
function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const arr = [...items]
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i)
  const rand = () => {
    h = (h * 1664525 + 1013904223) >>> 0
    return h / 2 ** 32
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Pick N distractors (wrong answers) from other cards' translations. Prefer similar length. Order deterministic by seed. */
export function pickDistractors(
  cards: StudyCardItem[],
  currentCard: StudyCardItem,
  count: number
): string[] {
  const correct = currentCard.vocabulary?.translation?.trim() ?? ''
  const others = cards
    .filter((c) => c.id !== currentCard.id)
    .map((c) => c.vocabulary?.translation?.trim())
    .filter((t): t is string => !!t && t !== correct)
  const unique = Array.from(new Set(others))
  if (unique.length <= count) return shuffleWithSeed(unique, currentCard.id)
  const correctLen = correct.length
  const bySimilarity = [...unique].sort(
    (a, b) => Math.abs(a.length - correctLen) - Math.abs(b.length - correctLen)
  )
  const similar = bySimilarity.slice(0, count * 2)
  const shuffled = shuffleWithSeed(similar, currentCard.id)
  return shuffled.slice(0, count)
}

/** Build 4 options: correct + 3 distractors, shuffled (deterministic per card). */
export function buildMultipleChoiceOptions(
  cards: StudyCardItem[],
  currentCard: StudyCardItem
): string[] {
  const correct = currentCard.vocabulary?.translation?.trim() ?? '—'
  const distractors = pickDistractors(cards, currentCard, 3)
  const options = [correct, ...distractors]
  return shuffleWithSeed(options, currentCard.id)
}

/** Assign exercise type per card: random among enabled types. */
export function assignExerciseTypes(
  cardCount: number,
  enabledTypes: ExerciseType[]
): ExerciseType[] {
  if (enabledTypes.length === 0) return []
  if (enabledTypes.length === 1) return Array(cardCount).fill(enabledTypes[0])
  const result: ExerciseType[] = []
  for (let i = 0; i < cardCount; i++) {
    result.push(enabledTypes[Math.floor(Math.random() * enabledTypes.length)])
  }
  return result
}
