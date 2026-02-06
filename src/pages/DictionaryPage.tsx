import { useState, useEffect, useCallback } from 'react'
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
  CircularProgress,
  Alert,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import { clampAndStripControlChars, MAX_SEARCH_LENGTH, sanitizeWord, sanitizeTranslation } from '@/lib/sanitize'
import { useAuthStore } from '@/stores/authStore'
import { useOfflineModeStore } from '@/stores/offlineModeStore'
import { useAddWordToLibrary } from '@/hooks/useVocabulary'
import { lookup, type DictionaryEntry } from '@/lib/dictionary'

const DEBOUNCE_MS = 400

const DIRECTION_OPTIONS: { value: 'en-ru' | 'ru-en'; label: string; from: string; to: string }[] = [
  { value: 'en-ru', label: 'English → Russian', from: 'en', to: 'ru' },
  { value: 'ru-en', label: 'Russian → English', from: 'ru', to: 'en' },
]

export function DictionaryPage() {
  const userId = useAuthStore((s) => s.user?.id)
  const offlineMode = useOfflineModeStore((s) => s.offlineMode)
  const [search, setSearch] = useState('')
  const [direction, setDirection] = useState<'en-ru' | 'ru-en'>('en-ru')
  const [results, setResults] = useState<DictionaryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addMutation = useAddWordToLibrary(userId ?? '')

  const runLookup = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([])
        setError(null)
        return
      }
      if (offlineMode || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        setResults([])
        setError(null)
        return
      }
      const opt = DIRECTION_OPTIONS.find((d) => d.value === direction)
      if (!opt) return
      setLoading(true)
      setError(null)
      try {
        const entries = await lookup(query, opt.from, opt.to, { offlineMode })
        setResults(entries)
      } catch (err) {
        setError('Lookup failed. Check your connection and try again.')
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [direction, offlineMode]
  )

  useEffect(() => {
    const t = setTimeout(() => {
      runLookup(search)
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [search, runLookup])

  const handleAddToLibrary = (entry: DictionaryEntry) => {
    if (!userId) return
    const word = sanitizeWord(entry.word)
    const translation = sanitizeTranslation(entry.translation)
    if (!word || !translation) return
    addMutation.mutate({
      word,
      translation,
      language_from: entry.language_from,
      language_to: entry.language_to,
    })
  }

  const isOffline = offlineMode || (typeof navigator !== 'undefined' && !navigator.onLine)

  return (
    <>
      <Typography variant="h4">Dictionary</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        Look up words (English ↔ Russian) and add them to your library.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search word (e.g. hello, привет)…"
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
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="dict-direction">Direction</InputLabel>
          <Select
            labelId="dict-direction"
            value={direction}
            label="Direction"
            onChange={(e) => setDirection(e.target.value as 'en-ru' | 'ru-en')}
          >
            {DIRECTION_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {isOffline && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Offline. Turn off Offline mode and connect to the internet to search.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2">Looking up…</Typography>
        </Box>
      )}

      {!loading && search.trim() && !isOffline && results.length === 0 && !error && (
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          No translation found. Try another word.
        </Typography>
      )}

      {!loading && results.length > 0 && (
        <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
          {results.map((entry, idx) => (
            <ListItem key={`${entry.word}-${entry.translation}-${idx}`} divider>
              <ListItemText
                primary={`${entry.word} — ${entry.translation}`}
                secondary={`${entry.language_from} → ${entry.language_to}`}
              />
              <ListItemSecondaryAction>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddToLibrary(entry)}
                  disabled={!userId || addMutation.isPending}
                >
                  {addMutation.isPending ? 'Adding…' : 'Add to library'}
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {!search.trim() && !loading && (
        <Typography color="text.secondary" variant="body2">
          Enter a word and choose direction to look up. Results will appear above.
        </Typography>
      )}
    </>
  )
}
