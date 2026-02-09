import { useMemo, useState, useEffect, useRef } from 'react'
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
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'
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
  sanitizeWord,
  sanitizeTranslation,
  sanitizeSearch,
  clampAndStripControlChars,
  MAX_WORD_LENGTH,
  MAX_TRANSLATION_LENGTH,
  MAX_SEARCH_LENGTH,
} from '@/lib/sanitize'
import {
  VIRTUAL_PAIR_RU_SR,
  LANGUAGE_PLACEHOLDERS,
  getBidirectionalKey,
} from '@/types'
import { exportToCsv, exportToJson, type LibraryExportRow } from '@/lib/importExport'
import type { LibraryItem, LibraryEditingItem } from './LibraryPage.models'
import {
  getLanguagePairLabel,
  processLibraryImport,
  buildLibraryImportMessage,
  downloadBlob,
  buildBidirectionalFilterOptions,
  buildDirectionOptionsForPair,
} from './LibraryPage.helpers'

export function LibraryPage() {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id
  const [search, setSearch] = useState('')
  const [languageFilter, setLanguageFilter] = useState<string>('')
  const [addWord, setAddWord] = useState('')
  const [addTranslation, setAddTranslation] = useState('')
  const [addPairKey, setAddPairKey] = useState('')
  const [addDirection, setAddDirection] = useState('')
  const [editingItem, setEditingItem] = useState<LibraryEditingItem | null>(null)
  const [deleteVocabularyId, setDeleteVocabularyId] = useState<string | null>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: userLangs, isLoading: langsLoading, error: userLangsError } = useUserLanguages(userId)
  const { data: libraryItems = [], isLoading: listLoading, error } = useUserVocabularyList(userId)

  const isMigrationMissing =
    isSupabaseTableMissingError(userLangsError) || isSupabaseTableMissingError(error)
  const addMutation = useAddWordToLibrary(userId ?? '')
  const updateMutation = useUpdateVocabulary(userId ?? '')
  const deleteMutation = useDeleteVocabulary(userId ?? '')

  const bidirectionalKeysFromUser = useMemo(() => {
    const keySet = new Set<string>()
    ;(userLangs ?? []).forEach((userLang) =>
      keySet.add(getBidirectionalKey(userLang.native_code, userLang.learning_code))
    )
    return Array.from(keySet)
  }, [userLangs])

  const hasVirtualPair =
    bidirectionalKeysFromUser.includes('en-ru') && bidirectionalKeysFromUser.includes('en-sr')

  const filterOptions = useMemo(
    () => buildBidirectionalFilterOptions(bidirectionalKeysFromUser, hasVirtualPair),
    [bidirectionalKeysFromUser, hasVirtualPair]
  )

  const addFormPairOptions = useMemo(
    () => buildBidirectionalFilterOptions(bidirectionalKeysFromUser, hasVirtualPair),
    [bidirectionalKeysFromUser, hasVirtualPair]
  )

  const directionOptionsForPair = useMemo(
    () => buildDirectionOptionsForPair(addPairKey, getLanguagePairLabel),
    [addPairKey]
  )

  const addFormPlaceholders = useMemo(() => {
    if (!addDirection) return { word: 'e.g. …', translation: 'e.g. …' }
    const [languageFrom, languageTo] = addDirection.split('-')
    return {
      word: LANGUAGE_PLACEHOLDERS[languageFrom] ?? `e.g. (${languageFrom})`,
      translation: LANGUAGE_PLACEHOLDERS[languageTo] ?? `e.g. (${languageTo})`,
    }
  }, [addDirection])

  useEffect(() => {
    if (addFormPairOptions.length > 0 && !addPairKey) {
      setAddPairKey(addFormPairOptions[0].value)
    }
  }, [addFormPairOptions, addPairKey])

  useEffect(() => {
    if (directionOptionsForPair.length > 0) {
      const isCurrentDirectionValid = directionOptionsForPair.some(
        (directionOption) => directionOption.value === addDirection
      )
      if (!isCurrentDirectionValid) setAddDirection(directionOptionsForPair[0].value)
    }
  }, [directionOptionsForPair, addDirection])

  const handleAddWord = () => {
    const word = sanitizeWord(addWord)
    const translation = sanitizeTranslation(addTranslation)
    if (!userId || !addDirection || !word || !translation) return
    const [languageFrom, languageTo] = addDirection.split('-')
    addMutation.mutate(
      { word, translation, language_from: languageFrom, language_to: languageTo },
      {
        onSuccess: () => {
          setAddWord('')
          setAddTranslation('')
        },
      }
    )
  }

  const handleSaveEdit = () => {
    if (!editingItem) return
    const word = sanitizeWord(editingItem.word)
    const translation = sanitizeTranslation(editingItem.translation)
    if (!word || !translation) return
    updateMutation.mutate(
      { id: editingItem.vocabulary_id, updates: { word, translation } },
      { onSuccess: () => setEditingItem(null) }
    )
  }

  const handleConfirmDelete = () => {
    if (deleteVocabularyId) {
      deleteMutation.mutate(deleteVocabularyId, { onSuccess: () => setDeleteVocabularyId(null) })
    }
  }

  const exportRows = useMemo((): LibraryExportRow[] => {
    return (libraryItems as LibraryItem[])
      .filter((item) => item.vocabulary)
      .map((item) => ({
        word: item.vocabulary!.word,
        translation: item.vocabulary!.translation,
        language_from: item.vocabulary!.language_from,
        language_to: item.vocabulary!.language_to,
      }))
  }, [libraryItems])

  const existingLibraryKey = useMemo(() => {
    const keySet = new Set<string>()
    for (const item of libraryItems as LibraryItem[]) {
      const vocabulary = item.vocabulary
      if (vocabulary) {
        keySet.add(
          `${vocabulary.word.toLowerCase()}|${vocabulary.translation.toLowerCase()}|${vocabulary.language_from}|${vocabulary.language_to}`
        )
      }
    }
    return keySet
  }, [libraryItems])

  const handleExportCsv = () => {
    const csv = exportToCsv(exportRows)
    downloadBlob(csv, 'text/csv;charset=utf-8', 'library.csv')
  }

  const handleExportJson = () => {
    const json = exportToJson(exportRows)
    downloadBlob(json, 'application/json', 'library.json')
  }

  const handleImportClick = () => {
    setImportMessage(null)
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !userId) return
    setIsImporting(true)
    setImportMessage(null)
    try {
      const result = await processLibraryImport(file, {
        addWordAsync: (row) =>
          addMutation.mutateAsync({
            word: row.word,
            translation: row.translation,
            language_from: row.language_from,
            language_to: row.language_to,
          }),
        existingKeys: existingLibraryKey,
      })
      setImportMessage(buildLibraryImportMessage(result))
    } catch (err) {
      setImportMessage(
        err instanceof Error
          ? err.message
          : 'Could not read file. Use CSV or JSON with word, translation, language_from, language_to.'
      )
    } finally {
      setIsImporting(false)
    }
  }

  const filteredItems = useMemo(() => {
    let items = libraryItems as LibraryItem[]
    const searchQuery = sanitizeSearch(search)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      items = items.filter((item) => {
        const vocabulary = item.vocabulary
        if (!vocabulary) return false
        return (
          vocabulary.word.toLowerCase().includes(searchLower) ||
          vocabulary.translation.toLowerCase().includes(searchLower)
        )
      })
    }
    if (languageFilter) {
      if (languageFilter === VIRTUAL_PAIR_RU_SR.key) {
        items = items.filter((item) => {
          const vocabulary = item.vocabulary
          if (!vocabulary) return false
          const fromTo = [vocabulary.language_from, vocabulary.language_to].sort().join('-')
          return fromTo === 'ru-sr'
        })
      } else {
        const [filterSourceLang, filterTargetLang] = languageFilter.split('-')
        items = items.filter((item) => {
          const vocabulary = item.vocabulary
          if (!vocabulary) return false
          const pairKey = getBidirectionalKey(vocabulary.language_from, vocabulary.language_to)
          return pairKey === `${filterSourceLang}-${filterTargetLang}`
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
          We couldn&apos;t load your library. Please refresh the page or try again later.
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
                onChange={(event) =>
                  setAddWord(clampAndStripControlChars(event.target.value, MAX_WORD_LENGTH))
                }
                sx={{ minWidth: 160 }}
              />
              <TextField
                size="small"
                label="Translation"
                placeholder={addFormPlaceholders.translation}
                value={addTranslation}
                onChange={(event) =>
                  setAddTranslation(
                    clampAndStripControlChars(event.target.value, MAX_TRANSLATION_LENGTH)
                  )
                }
                sx={{ minWidth: 160 }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="add-lang-pair">Language pair</InputLabel>
                <Select
                  labelId="add-lang-pair"
                  value={addPairKey}
                  label="Language pair"
                  onChange={(event) => setAddPairKey(event.target.value)}
                >
                  {addFormPairOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
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
                  onChange={(event) => setAddDirection(event.target.value)}
                >
                  {directionOptionsForPair.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
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

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Import / Export
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportCsv}
                disabled={exportRows.length === 0}
              >
                Export CSV
              </Button>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleExportJson}
                disabled={exportRows.length === 0}
              >
                Export JSON
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
              />
              <Button
                size="small"
                startIcon={<UploadIcon />}
                onClick={handleImportClick}
                disabled={isImporting}
              >
                {isImporting ? 'Importing…' : 'Import'}
              </Button>
              {importMessage && (
                <Typography variant="body2" color="text.secondary">
                  {importMessage}
                </Typography>
              )}
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search word or translation…"
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
              sx={{ minWidth: 220 }}
            />
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel id="library-lang-filter">Language pair</InputLabel>
              <Select
                labelId="library-lang-filter"
                value={languageFilter}
                label="Language pair"
                onChange={(event) => setLanguageFilter(event.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {filterOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
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
                    secondary={VIRTUAL_PAIR_RU_SR.label + ': direct Russian↔Serbian words only.'}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              )}
              {filteredItems.map((item) => {
                const vocabulary = item.vocabulary
                const label = vocabulary
                  ? (getBidirectionalKey(vocabulary.language_from, vocabulary.language_to) ===
                    VIRTUAL_PAIR_RU_SR.key
                      ? VIRTUAL_PAIR_RU_SR.directionLabels[
                          `${vocabulary.language_from}-${vocabulary.language_to}` as keyof typeof VIRTUAL_PAIR_RU_SR.directionLabels
                        ]
                      : getLanguagePairLabel(vocabulary.language_from, vocabulary.language_to))
                  : 'Unknown'
                const secondary =
                  languageFilter === VIRTUAL_PAIR_RU_SR.key &&
                  vocabulary &&
                  getBidirectionalKey(vocabulary.language_from, vocabulary.language_to) !==
                    VIRTUAL_PAIR_RU_SR.key
                    ? `${label} (via English)`
                    : label
                return (
                  <ListItem key={item.id} divider>
                    <ListItemText
                      primary={vocabulary ? `${vocabulary.word} — ${vocabulary.translation}` : '—'}
                      secondary={secondary}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="Edit"
                        onClick={() =>
                          vocabulary &&
                          setEditingItem({
                            vocabulary_id: item.vocabulary_id,
                            word: vocabulary.word,
                            translation: vocabulary.translation,
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
                  onChange={(event) =>
                    setEditingItem((prev) =>
                      prev
                        ? {
                            ...prev,
                            word: clampAndStripControlChars(event.target.value, MAX_WORD_LENGTH),
                          }
                        : null
                    )
                  }
                />
                <TextField
                  label="Translation"
                  value={editingItem?.translation ?? ''}
                  onChange={(event) =>
                    setEditingItem((prev) =>
                      prev
                        ? {
                            ...prev,
                            translation: clampAndStripControlChars(
                              event.target.value,
                              MAX_TRANSLATION_LENGTH
                            ),
                          }
                        : null
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
