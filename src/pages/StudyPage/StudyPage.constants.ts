export const STUDY_RATING_LABELS = {
  Again: 'Again',
  Hard: 'Hard',
  Good: 'Good',
  Easy: 'Easy',
} as const

/** Exercise type labels and difficulty for UI. */
export const EXERCISE_TYPE_OPTIONS = [
  {
    type: 'flashcard' as const,
    label: 'Flashcard (word → translation)',
    difficulty: 'Easy',
    description: 'See the word, reveal the translation, then rate yourself.',
  },
  {
    type: 'reverse_flashcard' as const,
    label: 'Reverse flashcard (translation → word)',
    difficulty: 'Medium',
    description: 'See the translation, reveal the word, then rate yourself.',
  },
  {
    type: 'typing' as const,
    label: 'Written (type the translation)',
    difficulty: 'Hard',
    description: 'See the word, type the translation.',
  },
  {
    type: 'multiple_choice' as const,
    label: 'Multiple choice',
    difficulty: 'Easy (word) / Medium (phrase)',
    description: 'See the word or phrase, pick the correct translation from 4 options.',
  },
] as const
