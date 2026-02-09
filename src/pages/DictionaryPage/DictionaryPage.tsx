import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { lookup, type DictionaryEntry } from '@/lib/dictionary'
import type { VocabularyRow } from '@/types/database'
import type { ResultItem } from './DictionaryPage.models'
import { DEBOUNCE_MS, DIRECTION_OPTIONS } from './DictionaryPage.constants'

export function DictionaryPage() {
  const userId = useAuthStore((state) => state.user?.id) ?? ''
  const offlineMode = useOfflineModeStore((state) => state.offlineMode)
  const [search, setSearch] = useState('')
  const [direction, setDirection] = useState('en-ru')
  const [apiResults, setApiResults] = useState<DictionaryEntry[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

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
    const listSourceToTarget = (appVocabularySourceToTarget.data ?? []) as VocabularyRow[]
    const listTargetToSource = (appVocabularyTargetToSource.data ?? []) as VocabularyRow[]
    const combined = [...listSourceToTarget, ...listTargetToSource]
    combined.sort((rowA, rowB) =>
      rowA.word.localeCompare(rowB.word, undefined, { sensitivity: 'base' })
    )
    return combined
  }, [appVocabularySourceToTarget.data, appVocabularyTargetToSource.data])

  const storeResults = useMemo((): ResultItem[] => {
    const searchQuery = sanitizeSearch(search)
    if (!searchQuery) return []
    const searchLower = searchQuery.toLowerCase()
    const matched = appVocabulary.filter(
      (row) =>
        row.word.toLowerCase().includes(searchLower) ||
        row.translation.toLowerCase().includes(searchLower)
    )
    return matched.map((row) => ({
      source: 'store' as const,
      vocabularyId: row.id,
      word: row.word,
      translation: row.translation,
      from: row.language_from,
      to: row.language_to,
    }))
  }, [search, appVocabulary])

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
    const timeoutId = setTimeout(() => {
      if (storeResults.length > 0) {
        setApiResults([])
        setApiError(null)
        return
      }
      runApiLookup(search)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [search, storeResults.length, runApiLookup])

  const hasStoreResults = storeResults.length > 0
  const isOffline = offlineMode || (typeof navigator !== 'undefined' && !navigator.onLine)
  const apiSupported = true

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
          You're offline. Connect to the internet to search for more words.
        </Alert>
      )}

      {apiError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setApiError(null)}>
          {apiError}
        </Alert>
      )}

      {apiLoading && !hasStoreResults && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2">Searching…</Typography>
        </Box>
      )}

      {!apiLoading &&
        search.trim() &&
        combinedResults.length === 0 &&
        !hasStoreResults &&
        (isOffline || !apiSupported) && (
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
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
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
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
