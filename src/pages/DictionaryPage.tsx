import { useState } from 'react'
import { Typography, Box, TextField, InputAdornment } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { clampAndStripControlChars, MAX_SEARCH_LENGTH } from '@/lib/sanitize'

export function DictionaryPage() {
  const [search, setSearch] = useState('')

  return (
    <>
      <Typography variant="h4">Dictionary</Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
        Look up words and add them to your library. Start with English ↔ Russian (more languages later).
      </Typography>

      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
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
          sx={{ maxWidth: 400 }}
        />
      </Box>

      <Typography color="text.secondary" variant="body2">
        Results will appear here. Online lookup coming next.
      </Typography>
    </>
  )
}
