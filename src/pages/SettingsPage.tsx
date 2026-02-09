import { useMemo, useState } from 'react'
import {
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useAuthStore } from '@/stores/authStore'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import {
  useUserLanguages,
  useAddBidirectionalPair,
  useRemoveUserLanguagesByIds,
} from '@/hooks/useUserLanguages'
import { isSupabaseTableMissingError } from '@/lib/errors'
import {
  BIDIRECTIONAL_PAIRS,
  VIRTUAL_PAIR_RU_SR,
  getBidirectionalKey,
} from '@/types'

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id
  const { data: userLangs, isLoading, error } = useUserLanguages(userId)
  const addMutation = useAddBidirectionalPair()
  const removeMutation = useRemoveUserLanguagesByIds(userId ?? '')

  const [selectedPairKey, setSelectedPairKey] = useState<string>(BIDIRECTIONAL_PAIRS[0]?.key ?? '')
  const [removePairKey, setRemovePairKey] = useState<string | null>(null)

  const bidirectionalPairsWithIds = useMemo(() => {
    const list = (userLangs ?? []).reduce<{ key: string; label: string; ids: string[] }[]>(
      (acc, ul) => {
        const key = getBidirectionalKey(ul.native_code, ul.learning_code)
        const existing = acc.find((p) => p.key === key)
        const label =
          BIDIRECTIONAL_PAIRS.find((p) => p.key === key)?.label ?? `${key} ↔`
        if (existing) {
          existing.ids.push(ul.id)
        } else {
          acc.push({ key, label, ids: [ul.id] })
        }
        return acc
      },
      []
    )
    return list
  }, [userLangs])

  const availableBidirectionalPairs = BIDIRECTIONAL_PAIRS.filter(
    (p) => !bidirectionalPairsWithIds.some((b) => b.key === p.key)
  )

  const hasVirtualPair =
    bidirectionalPairsWithIds.some((b) => b.key === 'en-ru') &&
    bidirectionalPairsWithIds.some((b) => b.key === 'en-sr')

  const handleAdd = () => {
    if (!userId || !selectedPairKey) return
    addMutation.mutate({ userId, key: selectedPairKey })
  }

  const handleRemoveClick = (key: string) => {
    setRemovePairKey(key)
  }

  const handleConfirmRemovePair = () => {
    if (!removePairKey) return
    const pair = bidirectionalPairsWithIds.find((p) => p.key === removePairKey)
    if (pair?.ids.length) {
      removeMutation.mutate(pair.ids, { onSuccess: () => setRemovePairKey(null) })
    } else {
      setRemovePairKey(null)
    }
  }

  return (
    <>
      <Typography variant="h4">Settings</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        Account and language preferences.
      </Typography>

      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
        Language pairs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Choose which language pairs you want to learn (e.g. Russian ↔ English). You can add
        multiple pairs. When adding a word, you still choose the direction (e.g. Russian → English).
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {isSupabaseTableMissingError(error)
            ? "We couldn't load language pairs. Please refresh the page or try again later."
            : 'Failed to load language pairs. Check your connection and try again.'}
        </Alert>
      )}

      {error && isSupabaseTableMissingError(error) ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          If the problem continues, try refreshing the page.
        </Typography>
      ) : isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading…</Typography>
        </Box>
      ) : (
        <>
          <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
            {bidirectionalPairsWithIds.length === 0 && !hasVirtualPair ? (
              <ListItem>
                <ListItemText primary="No language pairs yet. Add one below." />
              </ListItem>
            ) : (
              <>
                {bidirectionalPairsWithIds.map((pair) => (
                  <ListItem key={pair.key}>
                    <ListItemText primary={pair.label} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label={`Remove ${pair.label}`}
                        onClick={() => handleRemoveClick(pair.key)}
                        disabled={removeMutation.isPending}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {hasVirtualPair && (
                  <ListItem>
                    <ListItemText
                      primary={VIRTUAL_PAIR_RU_SR.label}
                      secondary="Available when you have Russian↔English and Serbian↔English. Words are used via English."
                    />
                  </ListItem>
                )}
              </>
            )}
          </List>

          {availableBidirectionalPairs.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel id="language-pair-label">Add language pair</InputLabel>
                <Select
                  labelId="language-pair-label"
                  value={selectedPairKey}
                  label="Add language pair"
                  onChange={(e) => setSelectedPairKey(e.target.value)}
                >
                  {availableBidirectionalPairs.map((p) => (
                    <MenuItem key={p.key} value={p.key}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={handleAdd}
                disabled={addMutation.isPending || !userId}
              >
                {addMutation.isPending ? 'Adding…' : 'Add'}
              </Button>
              {addMutation.isError && (
                <Typography color="error" variant="body2">
                  Could not add. Try again.
                </Typography>
              )}
            </Box>
          )}

          <ConfirmDialog
            open={!!removePairKey}
            title="Remove language pair"
            message="Remove this language pair? Your words for this pair will stay in My Library."
            confirmLabel="Remove"
            cancelLabel="Cancel"
            confirmColor="error"
            loading={removeMutation.isPending}
            onConfirm={handleConfirmRemovePair}
            onCancel={() => setRemovePairKey(null)}
          />
        </>
      )}
    </>
  )
}
