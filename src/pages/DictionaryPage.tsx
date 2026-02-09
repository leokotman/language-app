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

const DEBOUNCE_MS = 400

const DIRECTION_OPTIONS: { value: string; label: string; from: string; to: string }[] = [
  { value: 'en-ru', label: 'English → Russian', from: 'en', to: 'ru' },
  { value: 'ru-en', label: 'Russian → English', from: 'ru', to: 'en' },
  { value: 'en-sr', label: 'English → Serbian', from: 'en', to: 'sr' },
  { value: 'sr-en', label: 'Serbian → English', from: 'sr', to: 'en' },
  { value: 'ru-sr', label: 'Russian → Serbian (via English)', from: 'ru', to: 'sr' },
  { value: 'sr-ru', label: 'Serbian → Russian (via English)', from: 'sr', to: 'ru' },
]

type ResultItem =
  | { source: 'store'; vocabularyId: string; word: string; translation: string; from: string; to: string }
  | { source: 'api'; entry: DictionaryEntry }

export function DictionaryPage() {
  const userId = useAuthStore((s) => s.user?.id) ?? ''
  const offlineMode = useOfflineModeStore((s) => s.offlineMode)
  const [search, setSearch] = useState('')
  const [direction, setDirection] = useState('en-ru')
  const [apiResults, setApiResults] = useState<DictionaryEntry[]>([])
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const opt = DIRECTION_OPTIONS.find((d) => d.value === direction) ?? DIRECTION_OPTIONS[0]
  const lang1 = opt.from
  const lang2 = opt.to

  const appVocab1 = useVocabularyList({
    languageFrom: lang1,
    languageTo: lang2,
    includeUserCreated: false,
  })
  const appVocab2 = useVocabularyList({
    languageFrom: lang2,
    languageTo: lang1,
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
    const list1 = (appVocab1.data ?? []) as VocabularyRow[]
    const list2 = (appVocab2.data ?? []) as VocabularyRow[]
    const combined = [...list1, ...list2]
    combined.sort((a, b) => a.word.localeCompare(b.word, undefined, { sensitivity: 'base' }))
    return combined
  }, [appVocab1.data, appVocab2.data])

  const storeResults = useMemo((): ResultItem[] => {
    const q = sanitizeSearch(search)
    if (!q) return []
    const lower = q.toLowerCase()
    const matched = appVocabulary.filter(
      (row) =>
        row.word.toLowerCase().includes(lower) || row.translation.toLowerCase().includes(lower)
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
      if (opt.from === opt.to) {
        setApiResults([])
        return
      }
      const fromLang = opt.from
      const toLang = opt.to
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
    [opt, offlineMode]
  )

  useEffect(() => {
    const t = setTimeout(() => {
      if (storeResults.length > 0) {
        setApiResults([])
        setApiError(null)
        return
      }
      runApiLookup(search)
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
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

  const inLibrary = (item: ResultItem) => {
    if (item.source === 'store') return userVocabularyIds.has(item.vocabularyId)
    const e = item.entry
    return userLibraryItems.some(
      (uv) =>
        uv.vocabulary?.word === e.word &&
        uv.vocabulary?.translation === e.translation &&
        uv.vocabulary?.language_from === e.language_from &&
        uv.vocabulary?.language_to === e.language_to
    )
  }

  return (
    <>
      <Typography variant="h4">Dictionary</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        Look up words and add them to your library. Results come from your saved words first; when
        you’re online, we can also search the web for more.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search (e.g. hello, привет)…"
          value={search}
          onChange={(e) => setSearch(clampAndStripControlChars(e.target.value, MAX_SEARCH_LENGTH))}
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
            onChange={(e) => setDirection(e.target.value)}
          >
            {DIRECTION_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isOffline && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You’re offline. Connect to the internet to search for more words.
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

      {!apiLoading && search.trim() && combinedResults.length === 0 && hasStoreResults === false && apiSupported && !isOffline && !apiError && (
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          No translation found. Try another word.
        </Typography>
      )}

      {combinedResults.length > 0 && (
        <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
          {combinedResults.map((item, idx) => {
            if (item.source === 'store') {
              const inLib = userVocabularyIds.has(item.vocabularyId)
              return (
                <ListItem key={`store-${item.vocabularyId}`} divider>
                  <ListItemText
                    primary={`${item.word} — ${item.translation}`}
                    secondary={`${item.from} → ${item.to}`}
                  />
                  <ListItemSecondaryAction>
                    {inLib ? (
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
            const inLib = inLibrary(item)
            return (
              <ListItem key={`api-${entry.word}-${entry.translation}-${idx}`} divider>
                <ListItemText
                  primary={`${entry.word} — ${entry.translation}`}
                  secondary={`${entry.language_from} → ${entry.language_to}`}
                />
                <ListItemSecondaryAction>
                  {inLib ? (
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
          you’re online, we’ll also search for more.
        </Typography>
      )}
    </>
  )
}
