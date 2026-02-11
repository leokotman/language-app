import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Typography,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
  clampAndStripControlChars,
  MAX_SEARCH_LENGTH,
  sanitizeWord,
  sanitizeTranslation,
  sanitizeSearch,
} from '@/lib/sanitize'
import { useAuthStore } from '@/stores/authStore'
import { useOfflineModeStore } from '@/stores/offlineModeStore'
import {
  useVocabularyList,
  useAddToUserLibrary,
  useAddWordToLibrary,
  useUserVocabularyList,
} from '@/hooks/useVocabulary'
import { lookup, getLookupCache, type DictionaryEntry } from '@/lib/dictionary'
import type { VocabularyRow } from '@/types/database'
import type { ResultItem } from './DictionaryPage.models'
import { DEBOUNCE_MS, DIRECTION_OPTIONS } from './DictionaryPage.constants'
import { offlineLog, dictPerfLog } from '@/lib/offlineDebug'

const STORE_FILTER_DEBOUNCE_MS = 100

export function DictionaryPage() {
  const userId = useAuthStore((state) => state.user?.id) ?? ''
  const offlineMode = useOfflineModeStore((state) => state.offlineMode)
  const [search, setSearch] = useState('')
  const [searchForFilter, setSearchForFilter] = useState('')
  const [direction, setDirection] = useState('en-ru')
  const [apiResults, setApiResults] = useState<DictionaryEntry[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const renderCountRef = useRef(0)
  renderCountRef.current += 1

  const storeResultsLengthRef = useRef(0)

  dictPerfLog('render', {
    renderCount: renderCountRef.current,
    searchLen: search.length,
    searchForFilterLen: searchForFilter.length,
    search,
    searchForFilter,
  })

  useEffect(() => {
    dictPerfLog('effect: search→searchForFilter scheduled', { search, delayMs: STORE_FILTER_DEBOUNCE_MS })
    const t = setTimeout(() => {
      dictPerfLog('effect: searchForFilter updated (timeout fired)', { from: search })
      setSearchForFilter(search)
    }, STORE_FILTER_DEBOUNCE_MS)
    return () => {
      dictPerfLog('effect: cleanup (timeout cleared)', {})
      clearTimeout(t)
    }
  }, [search])

  const translationDirection =
    DIRECTION_OPTIONS.find((option) => option.value === direction) ?? DIRECTION_OPTIONS[0]
  const languageSource = translationDirection.from
  const languageTarget = translationDirection.to

  const appVocabularySourceToTarget = useVocabularyList({
    languageFrom: languageSource,
    languageTo: languageTarget,
    includeUserCreated: false,
  })
  const appVocabularyTargetToSource = useVocabularyList({
    languageFrom: languageTarget,
    languageTo: languageSource,
    includeUserCreated: false,
  })
  const { data: userLibraryItems = [] } = useUserVocabularyList(userId)
  const addToLibraryMutation = useAddToUserLibrary(userId)
  const addWordMutation = useAddWordToLibrary(userId)

  const userVocabularyIds = useMemo(
    () => new Set(userLibraryItems.map((item) => item.vocabulary_id)),
    [userLibraryItems]
  )

  const appVocabulary = useMemo((): VocabularyRow[] => {
    const start = typeof performance !== 'undefined' ? performance.now() : 0
    const listSourceToTarget = (appVocabularySourceToTarget.data ?? []) as VocabularyRow[]
    const listTargetToSource = (appVocabularyTargetToSource.data ?? []) as VocabularyRow[]
    const combined = [...listSourceToTarget, ...listTargetToSource]
    combined.sort((rowA, rowB) =>
      rowA.word.localeCompare(rowB.word, undefined, { sensitivity: 'base' })
    )
    const ms = typeof performance !== 'undefined' ? (performance.now() - start).toFixed(2) : '?'
    dictPerfLog('appVocabulary useMemo ran', { ms, combinedLen: combined.length })
    offlineLog('Dictionary appVocabulary', {
      direction,
      languageSource,
      languageTarget,
      appVocabularyLen: combined.length,
      sourceToTargetLen: listSourceToTarget.length,
      targetToSourceLen: listTargetToSource.length,
    })
    return combined
  }, [direction, languageSource, languageTarget, appVocabularySourceToTarget.data, appVocabularyTargetToSource.data])

  const storeResults = useMemo((): ResultItem[] => {
    const start = typeof performance !== 'undefined' ? performance.now() : 0
    const searchQuery = sanitizeSearch(searchForFilter)
    if (!searchQuery) {
      dictPerfLog('storeResults useMemo ran', { ms: '0', matchedLen: 0, reason: 'empty searchForFilter' })
      return []
    }
    const searchLower = searchQuery.toLowerCase()
    const matched = appVocabulary.filter(
      (row) =>
        row.word.toLowerCase().includes(searchLower) ||
        row.translation.toLowerCase().includes(searchLower)
    )
    const ms = typeof performance !== 'undefined' ? (performance.now() - start).toFixed(2) : '?'
    dictPerfLog('storeResults useMemo ran', { ms, appVocabLen: appVocabulary.length, matchedLen: matched.length })
    return matched.map((row) => ({
      source: 'store' as const,
      vocabularyId: row.id,
      word: row.word,
      translation: row.translation,
      from: row.language_from,
      to: row.language_to,
    }))
  }, [searchForFilter, appVocabulary])

  storeResultsLengthRef.current = storeResults.length

  const runApiLookup = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setApiResults([])
        setApiError(null)
        return
      }
      if (offlineMode || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        setApiResults([])
        setApiError(null)
        return
      }
      if (translationDirection.from === translationDirection.to) {
        setApiResults([])
        return
      }
      const fromLang = translationDirection.from
      const toLang = translationDirection.to
      setApiLoading(true)
      setApiError(null)
      try {
        const entries = await lookup(query, fromLang, toLang, { offlineMode })
        setApiResults(entries)
      } catch {
        setApiError('Lookup failed. Check your connection and try again.')
        setApiResults([])
      } finally {
        setApiLoading(false)
      }
    },
    [translationDirection, offlineMode]
  )

  useEffect(() => {
    dictPerfLog('effect: lookup debounce scheduled', { search, delayMs: DEBOUNCE_MS })
    const timeoutId = setTimeout(() => {
      const hasStoreResultsNow = storeResultsLengthRef.current > 0
      dictPerfLog('effect: lookup debounce fired', { search, hasStoreResultsNow })
      if (hasStoreResultsNow) {
        setApiResults([])
        setApiError(null)
        return
      }
      const isOfflineNow = offlineMode || (typeof navigator !== 'undefined' && !navigator.onLine)
      if (isOfflineNow && search.trim()) {
        getLookupCache(
          translationDirection.from,
          translationDirection.to,
          search.trim()
        ).then((cached) => {
          if (cached && cached.length > 0) {
            setApiResults(cached)
            setApiError(null)
          } else {
            runApiLookup(search)
          }
        })
        return
      }
      runApiLookup(search)
    }, DEBOUNCE_MS)
    return () => {
      dictPerfLog('effect: lookup debounce cleared', {})
      clearTimeout(timeoutId)
    }
  }, [search, runApiLookup, offlineMode, translationDirection.from, translationDirection.to])

  const hasStoreResults = storeResults.length > 0
  const isOffline = offlineMode || (typeof navigator !== 'undefined' && !navigator.onLine)
  const apiSupported = true

  useEffect(() => {
    offlineLog('Dictionary state', {
      direction,
      appVocabularyLen: appVocabulary.length,
      isOffline,
    })
  }, [direction, appVocabulary.length, isOffline])

  const combinedResults: ResultItem[] = hasStoreResults
    ? storeResults
    : apiResults.map((entry) => ({ source: 'api' as const, entry }))

  const handleAddFromStore = (vocabularyId: string) => {
    if (!userId) return
    addToLibraryMutation.mutate({ user_id: userId, vocabulary_id: vocabularyId })
  }

  const handleAddFromApi = (entry: DictionaryEntry) => {
    if (!userId) return
    const word = sanitizeWord(entry.word)
    const translation = sanitizeTranslation(entry.translation)
    if (!word || !translation) return
    addWordMutation.mutate({
      word,
      translation,
      language_from: entry.language_from,
      language_to: entry.language_to,
    })
  }

  const isItemInLibrary = (item: ResultItem) => {
    if (item.source === 'store') return userVocabularyIds.has(item.vocabularyId)
    const dictionaryEntry = item.entry
    return userLibraryItems.some(
      (userVocab) =>
        userVocab.vocabulary?.word === dictionaryEntry.word &&
        userVocab.vocabulary?.translation === dictionaryEntry.translation &&
        userVocab.vocabulary?.language_from === dictionaryEntry.language_from &&
        userVocab.vocabulary?.language_to === dictionaryEntry.language_to
    )
  }

  return (
    <>
      <Typography variant="h4">Dictionary</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        Look up words and add them to your library. Results come from your saved words first; when
        you're online, we can also search the web for more.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search (e.g. hello, привет)…"
          value={search}
          onChange={(event) =>
            setSearch(clampAndStripControlChars(event.target.value, MAX_SEARCH_LENGTH))
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 260 }}
        />
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="dict-direction">Direction</InputLabel>
          <Select
            labelId="dict-direction"
            value={direction}
            label="Direction"
            onChange={(event) => setDirection(event.target.value)}
          >
            {DIRECTION_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isOffline && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {hasStoreResults
            ? "You're offline. Showing words from your library and the app dictionary."
            : "You're offline. Connect to the internet to search for more words."}
        </Alert>
      )}

      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError(null)} data-testid="dictionary-error">
          {apiError}
        </Alert>
      )}

      {apiLoading && !hasStoreResults && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }} data-testid="dictionary-loading">
          <CircularProgress size={24} />
          <Typography variant="body2">Searching…</Typography>
        </Box>
      )}

      {!apiLoading &&
        search.trim() &&
        combinedResults.length === 0 &&
        !hasStoreResults &&
        (isOffline || !apiSupported) && (
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }} data-testid="dictionary-empty">
            {isOffline
              ? 'Connect to the internet to look up this word.'
              : 'No results found. Try another word or direction.'}
          </Typography>
        )}

      {!apiLoading &&
        search.trim() &&
        combinedResults.length === 0 &&
        hasStoreResults === false &&
        apiSupported &&
        !isOffline &&
        !apiError && (
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }} data-testid="dictionary-empty">
            No translation found. Try another word.
          </Typography>
        )}

      {combinedResults.length > 0 && (
        <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
          {combinedResults.map((item, index) => {
            if (item.source === 'store') {
              const inLibrary = userVocabularyIds.has(item.vocabularyId)
              return (
                <ListItem key={`store-${item.vocabularyId}`} divider>
                  <ListItemText
                    primary={`${item.word} — ${item.translation}`}
                    secondary={`${item.from} → ${item.to}`}
                  />
                  <ListItemSecondaryAction>
                    {inLibrary ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography variant="body2" color="text.secondary">
                          In library
                        </Typography>
                      </Box>
                    ) : (
                      <IconButton
                        aria-label="Add to library"
                        onClick={() => handleAddFromStore(item.vocabularyId)}
                        disabled={addToLibraryMutation.isPending}
                        color="primary"
                      >
                        <AddCircleOutlineIcon />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              )
            }
            const { entry } = item
            const inLibrary = isItemInLibrary(item)
            return (
              <ListItem key={`api-${entry.word}-${entry.translation}-${index}`} divider>
                <ListItemText
                  primary={`${entry.word} — ${entry.translation}`}
                  secondary={`${entry.language_from} → ${entry.language_to}`}
                />
                <ListItemSecondaryAction>
                  {inLibrary ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        In library
                      </Typography>
                    </Box>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddFromApi(entry)}
                      disabled={!userId || addWordMutation.isPending}
                    >
                      {addWordMutation.isPending ? 'Adding…' : 'Add to library'}
                    </Button>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            )
          })}
        </List>
      )}

      {!search.trim() && !apiLoading && (
        <Typography color="text.secondary" variant="body2">
          Enter a word and choose a direction. Results from your saved words appear first; when
          you're online, we'll also search for more.
        </Typography>
      )}
    </>
  )
}
