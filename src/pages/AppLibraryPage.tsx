import { useMemo, useState, useEffect } from 'react'
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
  IconButton,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useAuthStore } from '@/stores/authStore'
import {
  useVocabularyList,
  useAddToUserLibrary,
  useUserVocabularyList,
} from '@/hooks/useVocabulary'
import { isSupabaseTableMissingError } from '@/lib/errors'
import { sanitizeSearch, clampAndStripControlChars, MAX_SEARCH_LENGTH } from '@/lib/sanitize'
import { BIDIRECTIONAL_PAIRS, VIRTUAL_PAIR_RU_SR } from '@/types'
import type { VocabularyRow } from '@/types/database'

const APP_LIBRARY_PAIR_OPTIONS = [
  { value: BIDIRECTIONAL_PAIRS[0].key, label: BIDIRECTIONAL_PAIRS[0].label },
  { value: BIDIRECTIONAL_PAIRS[1].key, label: BIDIRECTIONAL_PAIRS[1].label },
  { value: VIRTUAL_PAIR_RU_SR.key, label: VIRTUAL_PAIR_RU_SR.label },
] as const

export function AppLibraryPage() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id ?? ''
  const [pairKey, setPairKey] = useState<string>(APP_LIBRARY_PAIR_OPTIONS[0].value)
  const [search, setSearch] = useState('')

  const [lang1, lang2] = useMemo(() => {
    if (pairKey === VIRTUAL_PAIR_RU_SR.key) return ['ru', 'sr'] as const
    const [a, b] = pairKey.split('-')
    return [a ?? 'en', b ?? 'ru'] as const
  }, [pairKey])

  const query1 = useVocabularyList({
    languageFrom: lang1,
    languageTo: lang2,
    includeUserCreated: false,
  })
  const query2 = useVocabularyList({
    languageFrom: lang2,
    languageTo: lang1,
    includeUserCreated: false,
  })

  const { data: userLibraryItems = [] } = useUserVocabularyList(userId)
  const addToLibraryMutation = useAddToUserLibrary(userId)

  const userVocabularyIds = useMemo(
    () => new Set(userLibraryItems.map((item) => item.vocabulary_id)),
    [userLibraryItems]
  )

  const appVocabulary = useMemo((): VocabularyRow[] => {
    const list1 = (query1.data ?? []) as VocabularyRow[]
    const list2 = (query2.data ?? []) as VocabularyRow[]
    const combined = [...list1, ...list2]
    combined.sort((a, b) => a.word.localeCompare(b.word, undefined, { sensitivity: 'base' }))
    return combined
  }, [query1.data, query2.data])

  const filteredVocabulary = useMemo(() => {
    const q = sanitizeSearch(search)
    if (!q) return appVocabulary
    const lower = q.toLowerCase()
    return appVocabulary.filter(
      (row) =>
        row.word.toLowerCase().includes(lower) || row.translation.toLowerCase().includes(lower)
    )
  }, [appVocabulary, search])

  const isLoading = query1.isLoading || query2.isLoading
  const error = query1.error ?? query2.error
  const isMigrationMissing = isSupabaseTableMissingError(error)

  useEffect(() => {
    if (!pairKey && APP_LIBRARY_PAIR_OPTIONS.length > 0) {
      setPairKey(APP_LIBRARY_PAIR_OPTIONS[0].value)
    }
  }, [pairKey])

  const handleAddToLibrary = (vocabularyId: string) => {
    if (!userId) return
    addToLibraryMutation.mutate({ user_id: userId, vocabulary_id: vocabularyId })
  }

  const pairLabel = APP_LIBRARY_PAIR_OPTIONS.find((o) => o.value === pairKey)?.label ?? pairKey

  if (!userId) return null

  return (
    <>
      <Typography variant="h4">App Library</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        Browse curated words and add them to your library. Run{' '}
        <strong>docs/supabase-migrations/003_seed_vocabulary.sql</strong> in Supabase to load the
        seed data.
      </Typography>

      {isMigrationMissing && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Database tables are missing. In your Supabase project: open <strong>SQL Editor</strong>,
          paste and run <strong>docs/supabase-migrations/002_core_data_layer.sql</strong> (see{' '}
          <strong>docs/SUPABASE_SETUP.md</strong> step 8), then refresh.
        </Alert>
      )}

      {!isMigrationMissing && (
        <>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="app-lib-pair">Language pair</InputLabel>
                <Select
                  labelId="app-lib-pair"
                  value={pairKey}
                  label="Language pair"
                  onChange={(e) => setPairKey(e.target.value)}
                >
                  {APP_LIBRARY_PAIR_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                placeholder="Search words…"
                value={search}
                onChange={(e) =>
                  setSearch(clampAndStripControlChars(e.target.value, MAX_SEARCH_LENGTH))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 220 }}
              />
            </Box>
          </Paper>

          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {!isLoading && appVocabulary.length === 0 && (
            <Alert severity="info">
              No words in the app library for {pairLabel}. Run{' '}
              <strong>003_seed_vocabulary.sql</strong> in Supabase SQL Editor to load seed data
              (see docs/SUPABASE_SETUP.md step 9).
            </Alert>
          )}

          {!isLoading && appVocabulary.length > 0 && filteredVocabulary.length === 0 && (
            <Alert severity="info">No words match your search.</Alert>
          )}

          {!isLoading && filteredVocabulary.length > 0 && (
            <List component={Paper} variant="outlined">
              {filteredVocabulary.map((row) => {
                const inLibrary = userVocabularyIds.has(row.id)
                return (
                  <ListItem key={row.id} divider>
                    <ListItemText
                      primary={row.word}
                      secondary={row.translation}
                      primaryTypographyProps={{ fontWeight: 500 }}
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
                          aria-label="Add to my library"
                          onClick={() => handleAddToLibrary(row.id)}
                          disabled={addToLibraryMutation.isPending}
                          color="primary"
                        >
                          <AddCircleOutlineIcon />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              })}
            </List>
          )}
        </>
      )}
    </>
  )
}
