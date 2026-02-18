import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { MAX_WORD_LENGTH, MAX_TRANSLATION_LENGTH, clampAndStripControlChars } from '@/lib/sanitize'

export type AddWordFormProps = {
  word: string
  translation: string
  pairKey: string
  direction: string
  pairOptions: { value: string; label: string }[]
  directionOptions: { value: string; label: string }[]
  placeholders: { word: string; translation: string }
  onWordChange: (value: string) => void
  onTranslationChange: (value: string) => void
  onPairKeyChange: (value: string) => void
  onDirectionChange: (value: string) => void
  onAdd: () => void
  isPending: boolean
  hasError: boolean
}

export function AddWordForm({
  word,
  translation,
  pairKey,
  direction,
  pairOptions,
  directionOptions,
  placeholders,
  onWordChange,
  onTranslationChange,
  onPairKeyChange,
  onDirectionChange,
  onAdd,
  isPending,
  hasError,
}: AddWordFormProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
      <TextField
        size="small"
        label="Word"
        placeholder={placeholders.word}
        value={word}
        onChange={(e) => onWordChange(clampAndStripControlChars(e.target.value, MAX_WORD_LENGTH))}
        sx={{ minWidth: 160 }}
      />
      <TextField
        size="small"
        label="Translation"
        placeholder={placeholders.translation}
        value={translation}
        onChange={(e) =>
          onTranslationChange(clampAndStripControlChars(e.target.value, MAX_TRANSLATION_LENGTH))
        }
        sx={{ minWidth: 160 }}
      />
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="add-lang-pair">Language pair</InputLabel>
        <Select
          labelId="add-lang-pair"
          value={pairKey}
          label="Language pair"
          onChange={(e) => onPairKeyChange(e.target.value)}
        >
          {pairOptions.map((option) => (
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
          value={direction}
          label="Direction"
          onChange={(e) => onDirectionChange(e.target.value)}
        >
          {directionOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
        disabled={isPending || !word.trim() || !translation.trim() || !direction}
      >
        {isPending ? 'Adding…' : 'Add'}
      </Button>
      {hasError && (
        <Typography color="error" variant="body2" sx={{ mt: 1, width: '100%' }}>
          Could not add word. Try again.
        </Typography>
      )}
    </Box>
  )
}
