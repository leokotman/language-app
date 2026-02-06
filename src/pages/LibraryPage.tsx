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
import { isSupabaseTableMissingError } from '@/lib/errors'
import {
  SUPPORTED_LANGUAGE_PAIRS,
  BIDIRECTIONAL_PAIRS,
  VIRTUAL_PAIR_RU_SR,
  LANGUAGE_PLACEHOLDERS,
  getBidirectionalKey,
} from '@/types'

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
  const [addPairKey, setAddPairKey] = useState('')
  const [addDirection, setAddDirection] = useState('')
  const [editingItem, setEditingItem] = useState<{
    vocabulary_id: string
    word: string
    translation: string
  } | null>(null)
  const [deleteVocabularyId, setDeleteVocabularyId] = useState<string | null>(null)

  const { data: userLangs, isLoading: langsLoading, error: userLangsError } = useUserLanguages(userId)
  const { data: libraryItems = [], isLoading: listLoading, error } = useUserVocabularyList(userId)

  const isMigrationMissing =
    isSupabaseTableMissingError(userLangsError) || isSupabaseTableMissingError(error)
  const addMutation = useAddWordToLibrary(userId ?? '')
  const updateMutation = useUpdateVocabulary(userId ?? '')
  const deleteMutation = useDeleteVocabulary(userId ?? '')

  const bidirectionalKeysFromUser = useMemo(() => {
    const set = new Set<string>()
    ;(userLangs ?? []).forEach((ul) => set.add(getBidirectionalKey(ul.native_code, ul.learning_code)))
    return Array.from(set)
  }, [userLangs])

  const hasVirtualPair =
    bidirectionalKeysFromUser.includes('en-ru') && bidirectionalKeysFromUser.includes('en-sr')

  const filterOptions = useMemo((): { value: string; label: string }[] => {
    const list: { value: string; label: string }[] = bidirectionalKeysFromUser
      .map((key) => BIDIRECTIONAL_PAIRS.find((p) => p.key === key))
      .filter(Boolean)
      .map((p) => ({ value: p!.key, label: p!.label }))
    if (hasVirtualPair) {
      list.push({ value: VIRTUAL_PAIR_RU_SR.key, label: VIRTUAL_PAIR_RU_SR.label })
    }
    return list
  }, [bidirectionalKeysFromUser, hasVirtualPair])

  const addFormPairOptions = useMemo((): { value: string; label: string }[] => {
    const list: { value: string; label: string }[] = bidirectionalKeysFromUser
      .map((key) => BIDIRECTIONAL_PAIRS.find((p) => p.key === key))
      .filter(Boolean)
      .map((p) => ({ value: p!.key, label: p!.label }))
    if (hasVirtualPair) {
      list.push({ value: VIRTUAL_PAIR_RU_SR.key, label: VIRTUAL_PAIR_RU_SR.label })
    }
    return list
  }, [bidirectionalKeysFromUser, hasVirtualPair])

  const directionOptionsForPair = useMemo(() => {
    if (!addPairKey) return []
    const [lang1, lang2] = addPairKey.split('-')
    if (!lang1 || !lang2) return []
    if (addPairKey === VIRTUAL_PAIR_RU_SR.key) {
      return [
        {
          value: 'ru-sr',
          label: VIRTUAL_PAIR_RU_SR.directionLabels['ru-sr'],
        },
        {
          value: 'sr-ru',
          label: VIRTUAL_PAIR_RU_SR.directionLabels['sr-ru'],
        },
      ]
    }
    return [
      { value: `${lang1}-${lang2}`, label: languagePairLabel(lang1, lang2) },
      { value: `${lang2}-${lang1}`, label: languagePairLabel(lang2, lang1) },
    ]
  }, [addPairKey])

  const addFormPlaceholders = useMemo(() => {
    if (!addDirection) return { word: 'e.g. …', translation: 'e.g. …' }
    const [language_from, language_to] = addDirection.split('-')
    return {
      word: LANGUAGE_PLACEHOLDERS[language_from] ?? `e.g. (${language_from})`,
      translation: LANGUAGE_PLACEHOLDERS[language_to] ?? `e.g. (${language_to})`,
    }
  }, [addDirection])

  useEffect(() => {
    if (addFormPairOptions.length > 0 && !addPairKey) {
      setAddPairKey(addFormPairOptions[0].value)
    }
  }, [addFormPairOptions, addPairKey])

  useEffect(() => {
    if (directionOptionsForPair.length > 0) {
      const currentValid = directionOptionsForPair.some((d) => d.value === addDirection)
      if (!currentValid) setAddDirection(directionOptionsForPair[0].value)
    }
  }, [directionOptionsForPair, addDirection])

  const handleAddWord = () => {
    if (!userId || !addDirection || !addWord.trim() || !addTranslation.trim()) return
    const [language_from, language_to] = addDirection.split('-')
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
      if (languageFilter === VIRTUAL_PAIR_RU_SR.key) {
        items = items.filter((item) => {
          const v = item.vocabulary
          if (!v) return false
          const fromTo = [v.language_from, v.language_to].sort().join('-')
          return fromTo === 'en-ru' || fromTo === 'en-sr'
        })
      } else {
        const [lang1, lang2] = languageFilter.split('-')
        items = items.filter((item) => {
          const v = item.vocabulary
          if (!v) return false
          const pairKey = getBidirectionalKey(v.language_from, v.language_to)
          return pairKey === `${lang1}-${lang2}`
        })
      }
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

      {isMigrationMissing && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Database tables are missing. In your Supabase project: open <strong>SQL Editor</strong>,
          paste and run <strong>docs/supabase-migrations/002_core_data_layer.sql</strong> (see{' '}
          <strong>docs/SUPABASE_SETUP.md</strong> step 8), then refresh.
        </Alert>
      )}

      {!isMigrationMissing && !userLangs?.length && !langsLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Add at least one language pair in{' '}
          <Link component={RouterLink} to="/settings">
            Settings
          </Link>{' '}
          to start building your library.
        </Alert>
      )}

      {!isMigrationMissing && (userLangs?.length ?? 0) > 0 && (
        <>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Add word
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                size="small"
                label="Word"
                placeholder={addFormPlaceholders.word}
                value={addWord}
                onChange={(e) => setAddWord(e.target.value)}
                sx={{ minWidth: 160 }}
              />
              <TextField
                size="small"
                label="Translation"
                placeholder={addFormPlaceholders.translation}
                value={addTranslation}
                onChange={(e) => setAddTranslation(e.target.value)}
                sx={{ minWidth: 160 }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="add-lang-pair">Language pair</InputLabel>
                <Select
                  labelId="add-lang-pair"
                  value={addPairKey}
                  label="Language pair"
                  onChange={(e) => setAddPairKey(e.target.value)}
                >
                  {addFormPairOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="add-direction">Direction</InputLabel>
                <Select
                  labelId="add-direction"
                  value={addDirection}
                  label="Direction"
                  onChange={(e) => setAddDirection(e.target.value)}
                >
                  {directionOptionsForPair.map((opt) => (
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
                  addMutation.isPending ||
                  !addWord.trim() ||
                  !addTranslation.trim() ||
                  !addDirection
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
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel id="library-lang-filter">Language pair</InputLabel>
              <Select
                labelId="library-lang-filter"
                value={languageFilter}
                label="Language pair"
                onChange={(e) => setLanguageFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {filterOptions.map((opt) => (
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
              {languageFilter === VIRTUAL_PAIR_RU_SR.key && filteredItems.length > 0 && (
                <ListItem sx={{ bgcolor: 'action.selected', py: 0.5 }}>
                  <ListItemText
                    secondary={VIRTUAL_PAIR_RU_SR.label + ': words from your Russian↔English and Serbian↔English lists.'}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              )}
              {filteredItems.map((item) => {
                const v = item.vocabulary
                const label = v
                  ? (getBidirectionalKey(v.language_from, v.language_to) ===
                    VIRTUAL_PAIR_RU_SR.key
                      ? VIRTUAL_PAIR_RU_SR.directionLabels[
                          `${v.language_from}-${v.language_to}` as keyof typeof VIRTUAL_PAIR_RU_SR.directionLabels
                        ]
                      : languagePairLabel(v.language_from, v.language_to))
                  : 'Unknown'
                const secondary =
                  languageFilter === VIRTUAL_PAIR_RU_SR.key &&
                  v &&
                  getBidirectionalKey(v.language_from, v.language_to) !== VIRTUAL_PAIR_RU_SR.key
                    ? `${label} (via English)`
                    : label
                return (
                  <ListItem key={item.id} divider>
                    <ListItemText
                      primary={v ? `${v.word} — ${v.translation}` : '—'}
                      secondary={secondary}
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
