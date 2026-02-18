import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { VIRTUAL_PAIR_RU_SR } from '@/types'
import { getBidirectionalKey } from '@/types'
import { getLanguagePairLabel } from '../LibraryPage.helpers'
import type { LibraryItem, LibraryEditingItem } from '../LibraryPage.models'

export type LibraryListProps = {
  items: LibraryItem[]
  languageFilter: string
  onEdit: (item: LibraryEditingItem) => void
  onDelete: (vocabularyId: string) => void
  isLoading: boolean
  totalCount: number
  error: boolean
}

export function LibraryList({
  items,
  languageFilter,
  onEdit,
  onDelete,
  isLoading,
  totalCount,
  error,
}: LibraryListProps) {
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }} data-testid="library-error">
        Failed to load your library. Try again.
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} data-testid="library-loading">
        <CircularProgress size={24} />
        <Typography variant="body2">Loading…</Typography>
      </Box>
    )
  }

  if (items.length === 0) {
    return (
      <Typography color="text.secondary" data-testid="library-empty">
        {totalCount === 0
          ? 'No words yet. Add your first word below.'
          : 'No words match your search or filter.'}
      </Typography>
    )
  }

  return (
    <List
      dense
      disablePadding
      sx={{ bgcolor: 'action.hover', borderRadius: 1 }}
      data-testid="library-list"
    >
      {languageFilter === VIRTUAL_PAIR_RU_SR.key && items.length > 0 && (
        <ListItem sx={{ bgcolor: 'action.selected', py: 0.5 }}>
          <ListItemText
            secondary={VIRTUAL_PAIR_RU_SR.label + ': direct Russian↔Serbian words only.'}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </ListItem>
      )}
      {items.map((item) => {
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
                  onEdit({
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
                onClick={() => onDelete(item.vocabulary_id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        )
      })}
    </List>
  )
}
