import { describe, it, expect } from 'vitest'
import {
  normalizeAnswer,
  isAnswerCorrect,
  pickDistractors,
  buildMultipleChoiceOptions,
  buildReverseMultipleChoiceOptions,
  assignExerciseTypes,
} from '@/pages/StudyPage/StudyPage.helpers'
import type { StudyCardItem } from '@/pages/StudyPage/StudyPage.models'

function makeCard(
  id: string,
  word: string,
  translation: string
): StudyCardItem {
  return {
    id,
    user_id: 'u1',
    vocabulary_id: 'v1',
    created_at: '',
    last_review: null,
    state: null,
    vocabulary: {
      id: 'v1',
      word,
      translation,
      language_from: 'en',
      language_to: 'ru',
      created_at: '',
    },
  }
}

describe('StudyPage.helpers', () => {
  describe('normalizeAnswer', () => {
    it('trims and lowercases', () => {
      expect(normalizeAnswer('  Привет  ')).toBe('привет')
    })
    it('collapses multiple spaces', () => {
      expect(normalizeAnswer('a   b')).toBe('a b')
    })
  })

  describe('isAnswerCorrect', () => {
    it('returns true when normalized match', () => {
      expect(isAnswerCorrect('привет', 'привет')).toBe(true)
      expect(isAnswerCorrect('  Привет  ', 'привет')).toBe(true)
    })
    it('returns false when different', () => {
      expect(isAnswerCorrect('hello', 'привет')).toBe(false)
    })
  })

  describe('pickDistractors', () => {
    it('returns shuffled unique translations from other cards', () => {
      const cards = [
        makeCard('1', 'hello', 'привет'),
        makeCard('2', 'bye', 'пока'),
        makeCard('3', 'yes', 'да'),
        makeCard('4', 'no', 'нет'),
      ]
      const distractors = pickDistractors(cards, cards[0], 3)
      expect(distractors).toHaveLength(3)
      expect(distractors).not.toContain('привет')
      expect(new Set(distractors).size).toBe(3)
    })
    it('returns fewer when not enough other cards', () => {
      const cards = [
        makeCard('1', 'hello', 'привет'),
        makeCard('2', 'bye', 'пока'),
      ]
      const distractors = pickDistractors(cards, cards[0], 3)
      expect(distractors).toHaveLength(1)
      expect(distractors[0]).toBe('пока')
    })
  })

  describe('buildMultipleChoiceOptions', () => {
    it('returns 4 options including correct', () => {
      const cards = [
        makeCard('1', 'hello', 'привет'),
        makeCard('2', 'bye', 'пока'),
        makeCard('3', 'yes', 'да'),
        makeCard('4', 'no', 'нет'),
        makeCard('5', 'one', 'один'),
      ]
      const options = buildMultipleChoiceOptions(cards, cards[0])
      expect(options).toHaveLength(4)
      expect(options).toContain('привет')
    })
  })

  describe('buildReverseMultipleChoiceOptions', () => {
    it('returns 4 options including correct word', () => {
      const cards = [
        makeCard('1', 'hello', 'привет'),
        makeCard('2', 'bye', 'пока'),
        makeCard('3', 'yes', 'да'),
        makeCard('4', 'no', 'нет'),
        makeCard('5', 'one', 'один'),
      ]
      const options = buildReverseMultipleChoiceOptions(cards, cards[0])
      expect(options).toHaveLength(4)
      expect(options).toContain('hello')
    })
  })

  describe('assignExerciseTypes', () => {
    it('returns empty array when enabledTypes is empty', () => {
      expect(assignExerciseTypes(5, [])).toEqual([])
    })
    it('returns same type for all when one enabled', () => {
      const result = assignExerciseTypes(3, ['typing'])
      expect(result).toEqual(['typing', 'typing', 'typing'])
    })
    it('returns array of length cardCount with values from enabledTypes', () => {
      const enabled: Array<'flashcard' | 'typing'> = ['flashcard', 'typing']
      const result = assignExerciseTypes(10, enabled)
      expect(result).toHaveLength(10)
      result.forEach((t) => {
        expect(enabled).toContain(t)
      })
    })
  })
})
