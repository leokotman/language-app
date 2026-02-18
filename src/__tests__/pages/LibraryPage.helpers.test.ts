import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getLanguagePairLabel,
  buildLibraryImportMessage,
  buildBidirectionalFilterOptions,
  buildDirectionOptionsForPair,
  processLibraryImport,
  type ProcessLibraryImportResult,
} from '@/pages/LibraryPage/LibraryPage.helpers'

describe('LibraryPage.helpers', () => {
  describe('getLanguagePairLabel', () => {
    it('returns label for supported pair', () => {
      expect(getLanguagePairLabel('en', 'ru')).toBe('English → Russian')
      expect(getLanguagePairLabel('ru', 'en')).toBe('Russian → English')
    })
    it('returns fallback for unknown pair', () => {
      expect(getLanguagePairLabel('xx', 'yy')).toBe('xx → yy')
    })
  })

  describe('buildLibraryImportMessage', () => {
    it('returns failure message when only parse errors', () => {
      const result: ProcessLibraryImportResult = {
        added: 0,
        skipped: 0,
        parseErrors: ['Row 1: bad'],
      }
      expect(buildLibraryImportMessage(result)).toBe('Import failed: Row 1: bad')
    })
    it('truncates many parse errors with ellipsis', () => {
      const result: ProcessLibraryImportResult = {
        added: 0,
        skipped: 0,
        parseErrors: ['E1', 'E2', 'E3', 'E4'],
      }
      expect(buildLibraryImportMessage(result)).toBe('Import failed: E1; E2; E3…')
    })
    it('returns message with imported and errors when partial', () => {
      const result: ProcessLibraryImportResult = {
        added: 5,
        skipped: 2,
        parseErrors: ['Row 3: bad'],
      }
      const msg = buildLibraryImportMessage(result)
      expect(msg).toContain('Imported 5 words')
      expect(msg).toContain('skipped 2 duplicates')
      expect(msg).toContain('Some rows had errors')
    })
    it('returns success message when no errors', () => {
      expect(buildLibraryImportMessage({ added: 3, skipped: 0, parseErrors: [] })).toBe(
        'Imported 3 words. '
      )
    })
    it('includes skipped count when skipped > 0', () => {
      expect(buildLibraryImportMessage({ added: 1, skipped: 1, parseErrors: [] })).toBe(
        'Imported 1 words. Skipped 1 duplicates.'
      )
    })
  })

  describe('buildBidirectionalFilterOptions', () => {
    it('returns options for user keys', () => {
      const options = buildBidirectionalFilterOptions(['en-ru'], false)
      expect(options).toContainEqual({ value: 'en-ru', label: 'Russian ↔ English' })
      expect(options).toHaveLength(1)
    })
    it('adds virtual pair option when hasVirtualPair is true', () => {
      const options = buildBidirectionalFilterOptions(['en-ru', 'en-sr'], true)
      expect(options.some((o) => o.value === 'ru-sr')).toBe(true)
    })
  })

  describe('buildDirectionOptionsForPair', () => {
    it('returns empty array for empty pair key', () => {
      const getLabel = (_from: string, _to: string) => ''
      expect(buildDirectionOptionsForPair('', getLabel)).toEqual([])
    })
    it('returns two directions for normal pair', () => {
      const getLabel = (from: string, to: string) => `${from}→${to}`
      const options = buildDirectionOptionsForPair('en-ru', getLabel)
      expect(options).toHaveLength(2)
      expect(options.map((o) => o.value).sort()).toEqual(['en-ru', 'ru-en'])
    })
    it('returns virtual pair directions for ru-sr', () => {
      const getLabel = (_from: string, _to: string) => ''
      const options = buildDirectionOptionsForPair('ru-sr', getLabel)
      expect(options).toHaveLength(2)
      expect(options.map((o) => o.value).sort()).toEqual(['ru-sr', 'sr-ru'])
    })
  })

  describe('processLibraryImport', () => {
    it('returns parse errors when file has only invalid rows', async () => {
      const file = {
        name: 'x.json',
        text: () =>
          Promise.resolve(
            JSON.stringify([{ word: '', translation: 'x', language_from: 'en', language_to: 'ru' }])
          ),
      } as unknown as File
      const addWordAsync = vi.fn()
      const result = await processLibraryImport(file, {
        addWordAsync,
        existingKeys: new Set(),
      })
      expect(result.added).toBe(0)
      expect(result.skipped).toBe(0)
      expect(result.parseErrors.length).toBeGreaterThan(0)
      expect(addWordAsync).not.toHaveBeenCalled()
    })
    it('adds rows and skips duplicates', async () => {
      const file = {
        name: 'x.json',
        text: () =>
          Promise.resolve(
            JSON.stringify([
              { word: 'a', translation: 'b', language_from: 'en', language_to: 'ru' },
              { word: 'c', translation: 'd', language_from: 'en', language_to: 'ru' },
            ])
          ),
      } as unknown as File
      const addWordAsync = vi.fn().mockResolvedValue(undefined)
      const existingKeys = new Set<string>()
      const result = await processLibraryImport(file, { addWordAsync, existingKeys })
      expect(result.added).toBe(2)
      expect(result.skipped).toBe(0)
      expect(addWordAsync).toHaveBeenCalledTimes(2)
      expect(existingKeys.has('a|b|en|ru')).toBe(true)
      expect(existingKeys.has('c|d|en|ru')).toBe(true)
    })
    it('skips row when key already in existingKeys', async () => {
      const file = {
        name: 'x.json',
        text: () =>
          Promise.resolve(
            JSON.stringify([
              { word: 'a', translation: 'b', language_from: 'en', language_to: 'ru' },
            ])
          ),
      } as unknown as File
      const addWordAsync = vi.fn()
      const existingKeys = new Set(['a|b|en|ru'])
      const result = await processLibraryImport(file, { addWordAsync, existingKeys })
      expect(result.added).toBe(0)
      expect(result.skipped).toBe(1)
      expect(addWordAsync).not.toHaveBeenCalled()
    })
    it('throws when addWordAsync fails', async () => {
      const file = {
        name: 'x.json',
        text: () =>
          Promise.resolve(
            JSON.stringify([
              { word: 'fail', translation: 'x', language_from: 'en', language_to: 'ru' },
            ])
          ),
      } as unknown as File
      const addWordAsync = vi.fn().mockRejectedValue(new Error('DB error'))
      await expect(
        processLibraryImport(file, { addWordAsync, existingKeys: new Set() })
      ).rejects.toThrow(/Import stopped/)
    })
  })
})
