import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
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
  CircularProgress,
  Alert,
  Link,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useAuthStore } from '@/stores/authStore'
import { useUserLanguages } from '@/hooks/useUserLanguages'
import { useUserVocabularyList } from '@/hooks/useVocabulary'
import { SUPPORTED_LANGUAGE_PAIRS } from '@/types'

type LibraryItem = {
  id: string
  vocabulary_id: string
  vocabulary: { word: string; translation: string; language_from: string; language_to: string } | null
}

function languagePairLabel(langFrom: string, langTo: string): string {
  const pair = SUPPORTED_LANGUAGE_PAIRS.find(
    (p) => p.native === langFrom && p.learning === langTo
  )
  if (pair) return pair.label
  return `${langFrom} → ${langTo}`
}

export function LibraryPage() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id
  const [search, setSearch] = useState('')
  const [languageFilter, setLanguageFilter] = useState<string>('')

  const { data: userLangs, isLoading: langsLoading } = useUserLanguages(userId)
  const { data: libraryItems = [], isLoading: listLoading, error } = useUserVocabularyList(userId)

  const languageOptions = useMemo(() => {
    if (!userLangs?.length) return []
    return userLangs.map((ul) => ({
      value: `${ul.learning_code}-${ul.native_code}`,
      label: languagePairLabel(ul.native_code, ul.learning_code),
    }))
  }, [userLangs])

  const filteredItems = useMemo(() => {
    let items = libraryItems as LibraryItem[]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter((item) => {
        const v = item.vocabulary
        if (!v) return false
        return v.word.toLowerCase().includes(q) || v.translation.toLowerCase().includes(q)
      })
    }
    if (languageFilter) {
      const [learning, native] = languageFilter.split('-')
      items = items.filter((item) => {
        const v = item.vocabulary
        if (!v) return false
        return v.language_from === native && v.language_to === learning
      })
    }
    return items
  }, [libraryItems, search, languageFilter])

  const isLoading = langsLoading || listLoading

  if (!userId) return null

  return (
    <>
      <Typography variant="h4">My Library</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        Your personal vocabulary. Add words and practice with spaced repetition.
      </Typography>

      {!userLangs?.length && !langsLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Add at least one language pair in{' '}
          <Link component={RouterLink} to="/settings">
            Settings
          </Link>{' '}
          to start building your library.
        </Alert>
      )}

      {userLangs?.length > 0 && (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search word or translation…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="library-lang-filter">Language pair</InputLabel>
              <Select
                labelId="library-lang-filter"
                value={languageFilter}
                label="Language pair"
                onChange={(e) => setLanguageFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {languageOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load your library. Try again.
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} />
              <Typography variant="body2">Loading…</Typography>
            </Box>
          ) : filteredItems.length === 0 ? (
            <Typography color="text.secondary">
              {libraryItems.length === 0
                ? 'No words yet. Add your first word below.'
                : 'No words match your search or filter.'}
            </Typography>
          ) : (
            <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
              {filteredItems.map((item) => {
                const v = item.vocabulary
                const label = v
                  ? languagePairLabel(v.language_from, v.language_to)
                  : 'Unknown'
                return (
                  <ListItem key={item.id} divider>
                    <ListItemText
                      primary={v ? `${v.word} — ${v.translation}` : '—'}
                      secondary={label}
                    />
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
