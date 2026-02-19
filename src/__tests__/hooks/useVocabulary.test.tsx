import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  vocabularyListQueryKey,
  useVocabularyList,
  dueTodayQueryKey,
  useDueToday,
  useUserVocabularyList,
  useAddWordToLibrary,
} from '@/hooks/useVocabulary'
import * as vocabularyApi from '@/api/vocabulary'

vi.mock('@/api/vocabulary', () => ({
  listVocabulary: vi.fn(),
  listDueToday: vi.fn(),
  listUserVocabulary: vi.fn(),
  addWordToLibrary: vi.fn(),
  createVocabulary: vi.fn(),
  updateVocabulary: vi.fn(),
  deleteVocabulary: vi.fn(),
  listAllAppVocabulary: vi.fn(),
  getVocabularyById: vi.fn(),
  addToUserLibrary: vi.fn(),
  updateUserVocabulary: vi.fn(),
  removeFromUserLibrary: vi.fn(),
}))

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

describe('vocabularyListQueryKey', () => {
  it('returns key array with languageFrom, languageTo, includeUser, userId', () => {
    expect(vocabularyListQueryKey('en', 'ru', false, 'u1')).toEqual([
      'vocabulary',
      'en',
      'ru',
      false,
      'u1',
    ])
    expect(vocabularyListQueryKey('en', 'ru')).toEqual([
      'vocabulary',
      'en',
      'ru',
      false,
      null,
    ])
  })
})

describe('useVocabularyList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(vocabularyApi.listVocabulary).mockResolvedValue({
      data: [{ id: 'v1', word: 'hi', translation: 'привет', language_from: 'en', language_to: 'ru', source: 'app', created_by: null, created_at: '' }],
      error: null,
    })
  })

  it('returns vocabulary when params are set and fetch succeeds', async () => {
    const { result } = renderHook(
      () =>
        useVocabularyList({
          languageFrom: 'en',
          languageTo: 'ru',
        }),
      { wrapper }
    )
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].word).toBe('hi')
    expect(vocabularyApi.listVocabulary).toHaveBeenCalledWith({
      languageFrom: 'en',
      languageTo: 'ru',
      includeUserCreated: undefined,
      userId: undefined,
    })
  })

  it('does not run when languageFrom or languageTo is missing', () => {
    const { result: r1 } = renderHook(
      () => useVocabularyList({ languageFrom: '', languageTo: 'ru' }),
      { wrapper }
    )
    expect(r1.current.isFetching).toBe(false)
    expect(vocabularyApi.listVocabulary).not.toHaveBeenCalled()
  })
})

describe('dueTodayQueryKey', () => {
  it('returns key with userId and optional filters', () => {
    expect(dueTodayQueryKey('u1')).toEqual([
      'due-today',
      'u1',
      null,
      null,
      null,
    ])
    expect(dueTodayQueryKey('u1', { pairKey: 'en-ru' })).toEqual([
      'due-today',
      'u1',
      null,
      null,
      'en-ru',
    ])
  })
})

describe('useDueToday', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(vocabularyApi.listDueToday).mockResolvedValue({
      data: [],
      error: null,
    })
  })

  it('returns due items when userId is set', async () => {
    const { result } = renderHook(() => useDueToday('user-1'), { wrapper })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toEqual([])
    expect(vocabularyApi.listDueToday).toHaveBeenCalledWith('user-1', undefined)
  })

  it('does not run when userId is undefined', () => {
    const { result } = renderHook(() => useDueToday(undefined), { wrapper })
    expect(result.current.isFetching).toBe(false)
    expect(vocabularyApi.listDueToday).not.toHaveBeenCalled()
  })
})

describe('useUserVocabularyList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(vocabularyApi.listUserVocabulary).mockResolvedValue({
      data: [],
      error: null,
    })
  })

  it('returns list when userId is set', async () => {
    const { result } = renderHook(() => useUserVocabularyList('user-1'), {
      wrapper,
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data).toEqual([])
    expect(vocabularyApi.listUserVocabulary).toHaveBeenCalledWith('user-1')
  })
})

describe('useAddWordToLibrary', () => {
  it('calls addWordToLibrary and invalidates queries', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }
    vi.mocked(vocabularyApi.addWordToLibrary).mockResolvedValue({
      data: {
        id: 'uv-1',
        user_id: 'user-1',
        vocabulary_id: 'v-1',
        state: 0,
        due: '',
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        learning_steps: 0,
        reps: 0,
        lapses: 0,
        last_review: null,
        created_at: '',
        vocabulary: {
          id: 'v-1',
          word: 'hello',
          translation: 'привет',
          language_from: 'en',
          language_to: 'ru',
          source: 'user',
          created_by: 'user-1',
          created_at: '',
        },
      },
      error: null,
    })
    const { result } = renderHook(() => useAddWordToLibrary('user-1'), {
      wrapper: Wrapper,
    })
    await act(async () => {
      result.current.mutate({
        word: 'hello',
        translation: 'привет',
        language_from: 'en',
        language_to: 'ru',
      })
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(vocabularyApi.addWordToLibrary).toHaveBeenCalledWith('user-1', {
      word: 'hello',
      translation: 'привет',
      language_from: 'en',
      language_to: 'ru',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['user-vocabulary', 'user-1'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['vocabulary'] })
  })
})
