import { useMemo, useState, useEffect } from 'react'
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
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Link,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuthStore } from '@/stores/authStore'
import { useUserLanguages } from '@/hooks/useUserLanguages'
import {
  useUserVocabularyList,
  useAddWordToLibrary,
  useUpdateVocabulary,
  useDeleteVocabulary,
} from '@/hooks/useVocabulary'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
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
  const [addWord, setAddWord] = useState('')
  const [addTranslation, setAddTranslation] = useState('')
  const [addLanguagePair, setAddLanguagePair] = useState('')
  const [editingItem, setEditingItem] = useState<{
    vocabulary_id: string
    word: string
    translation: string
  } | null>(null)
  const [deleteVocabularyId, setDeleteVocabularyId] = useState<string | null>(null)

  const { data: userLangs, isLoading: langsLoading } = useUserLanguages(userId)
  const { data: libraryItems = [], isLoading: listLoading, error } = useUserVocabularyList(userId)
  const addMutation = useAddWordToLibrary(userId ?? '')
  const updateMutation = useUpdateVocabulary(userId ?? '')
  const deleteMutation = useDeleteVocabulary(userId ?? '')

  const languageOptions = useMemo(() => {
    if (!userLangs?.length) return []
    return userLangs.map((ul) => ({
      value: `${ul.native_code}-${ul.learning_code}`,
      label: languagePairLabel(ul.native_code, ul.learning_code),
    }))
  }, [userLangs])

  useEffect(() => {
    if (languageOptions.length > 0 && !addLanguagePair) {
      setAddLanguagePair(languageOptions[0].value)
    }
  }, [languageOptions, addLanguagePair])

  const handleAddWord = () => {
    if (!userId || !addLanguagePair || !addWord.trim() || !addTranslation.trim()) return
    const [language_from, language_to] = addLanguagePair.split('-')
    addMutation.mutate(
      {
        word: addWord.trim(),
        translation: addTranslation.trim(),
        language_from,
        language_to,
      },
      {
        onSuccess: () => {
          setAddWord('')
          setAddTranslation('')
        },
      }
    )
  }

  const handleSaveEdit = () => {
    if (!editingItem || !editingItem.word.trim() || !editingItem.translation.trim()) return
    updateMutation.mutate(
      {
        id: editingItem.vocabulary_id,
        updates: { word: editingItem.word.trim(), translation: editingItem.translation.trim() },
      },
      { onSuccess: () => setEditingItem(null) }
    )
  }

  const handleConfirmDelete = () => {
    if (deleteVocabularyId) {
      deleteMutation.mutate(deleteVocabularyId, { onSuccess: () => setDeleteVocabularyId(null) })
    }
  }

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
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Add word
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                size="small"
                label="Word"
                placeholder="e.g. hello"
                value={addWord}
                onChange={(e) => setAddWord(e.target.value)}
                sx={{ minWidth: 160 }}
              />
              <TextField
                size="small"
                label="Translation"
                placeholder="e.g. привет"
                value={addTranslation}
                onChange={(e) => setAddTranslation(e.target.value)}
                sx={{ minWidth: 160 }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="add-lang-pair">Language pair</InputLabel>
                <Select
                  labelId="add-lang-pair"
                  value={addLanguagePair}
                  label="Language pair"
                  onChange={(e) => setAddLanguagePair(e.target.value)}
                >
                  {languageOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddWord}
                disabled={
                  addMutation.isPending || !addWord.trim() || !addTranslation.trim()
                }
              >
                {addMutation.isPending ? 'Adding…' : 'Add'}
              </Button>
            </Box>
            {addMutation.isError && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                Could not add word. Try again.
              </Typography>
            )}
          </Paper>

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
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="Edit"
                        onClick={() =>
                          v && setEditingItem({
                            vocabulary_id: item.vocabulary_id,
                            word: v.word,
                            translation: v.translation,
                          })
                        }
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="Delete"
                        onClick={() => setDeleteVocabularyId(item.vocabulary_id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              })}
            </List>
          )}

          <Dialog open={!!editingItem} onClose={() => setEditingItem(null)}>
            <DialogTitle>Edit word</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, minWidth: 320 }}>
                <TextField
                  autoFocus
                  label="Word"
                  value={editingItem?.word ?? ''}
                  onChange={(e) =>
                    setEditingItem((prev) => (prev ? { ...prev, word: e.target.value } : null))
                  }
                />
                <TextField
                  label="Translation"
                  value={editingItem?.translation ?? ''}
                  onChange={(e) =>
                    setEditingItem((prev) =>
                      prev ? { ...prev, translation: e.target.value } : null
                    )
                  }
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSaveEdit}
                disabled={
                  !editingItem?.word.trim() ||
                  !editingItem?.translation.trim() ||
                  updateMutation.isPending
                }
              >
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>

          <ConfirmDialog
            open={!!deleteVocabularyId}
            title="Remove word"
            message="Remove this word from your library? This cannot be undone."
            confirmLabel="Remove"
            cancelLabel="Cancel"
            confirmColor="error"
            loading={deleteMutation.isPending}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteVocabularyId(null)}
          />
        </>
      )}
    </>
  )
}
