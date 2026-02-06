import { useState } from 'react'
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
import { useUserLanguages, useAddUserLanguage, useRemoveUserLanguage } from '@/hooks/useUserLanguages'
import { isSupabaseTableMissingError } from '@/lib/errors'
import { SUPPORTED_LANGUAGE_PAIRS } from '@/types'

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id
  const { data: userLangs, isLoading, error } = useUserLanguages(userId)
  const addMutation = useAddUserLanguage()
  const removeMutation = useRemoveUserLanguage(userId ?? '')

  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0)
  const [removePairId, setRemovePairId] = useState<string | null>(null)

  const alreadyAdded = new Set(
    (userLangs ?? []).map((ul) => `${ul.learning_code}-${ul.native_code}`)
  )
  const availablePairs = SUPPORTED_LANGUAGE_PAIRS.filter(
    (p) => !alreadyAdded.has(`${p.learning}-${p.native}`)
  )

  const handleAdd = () => {
    if (!userId || availablePairs.length === 0) return
    const pair = availablePairs[selectedPairIndex >= availablePairs.length ? 0 : selectedPairIndex]
    addMutation.mutate({
      user_id: userId,
      learning_code: pair.learning,
      native_code: pair.native,
    })
  }

  const handleRemoveClick = (id: string) => {
    setRemovePairId(id)
  }

  const handleConfirmRemovePair = () => {
    if (removePairId) {
      removeMutation.mutate(removePairId, { onSuccess: () => setRemovePairId(null) })
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
        Choose which languages you want to learn (e.g. English → Russian). You can add multiple
        pairs.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {isSupabaseTableMissingError(error) ? (
            <>
              Database tables for language pairs are missing. In your Supabase project: open{' '}
              <strong>SQL Editor</strong>, paste and run the contents of{' '}
              <strong>docs/supabase-migrations/002_core_data_layer.sql</strong> from this repo (see{' '}
              <strong>docs/SUPABASE_SETUP.md</strong> step 8).
            </>
          ) : (
            'Failed to load language pairs. Check your connection and try again.'
          )}
        </Alert>
      )}

      {error && isSupabaseTableMissingError(error) ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          After running the migration, refresh this page.
        </Typography>
      ) : isLoading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading…</Typography>
        </Box>
      ) : (
        <>
          <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
            {(userLangs ?? []).length === 0 ? (
              <ListItem>
                <ListItemText primary="No language pairs yet. Add one below." />
              </ListItem>
            ) : (
              (userLangs ?? []).map((ul) => {
                const label =
                  SUPPORTED_LANGUAGE_PAIRS.find(
                    (p) => p.learning === ul.learning_code && p.native === ul.native_code
                  )?.label ?? `${ul.native_code} → ${ul.learning_code}`
                return (
                  <ListItem key={ul.id}>
                    <ListItemText primary={label} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="Remove language pair"
                        onClick={() => handleRemoveClick(ul.id)}
                        disabled={removeMutation.isPending}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              })
            )}
          </List>

          {availablePairs.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="language-pair-label">Add language pair</InputLabel>
                <Select
                  labelId="language-pair-label"
                  value={selectedPairIndex}
                  label="Add language pair"
                  onChange={(e) => setSelectedPairIndex(Number(e.target.value))}
                >
                  {availablePairs.map((p, i) => (
                    <MenuItem key={`${p.learning}-${p.native}`} value={i}>
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
            open={!!removePairId}
            title="Remove language pair"
            message="Remove this language pair? Your words for this pair will stay in My Library."
            confirmLabel="Remove"
            cancelLabel="Cancel"
            confirmColor="error"
            loading={removeMutation.isPending}
            onConfirm={handleConfirmRemovePair}
            onCancel={() => setRemovePairId(null)}
          />
        </>
      )}
    </>
  )
}
