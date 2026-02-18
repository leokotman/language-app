import { FormControl, InputLabel, InputAdornment, MenuItem, Select, TextField } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { MAX_SEARCH_LENGTH, clampAndStripControlChars } from '@/lib/sanitize'

export type LibraryFilterBarProps = {
  search: string
  languageFilter: string
  filterOptions: { value: string; label: string }[]
  onSearchChange: (value: string) => void
  onLanguageFilterChange: (value: string) => void
}

export function LibraryFilterBar({
  search,
  languageFilter,
  filterOptions,
  onSearchChange,
  onLanguageFilterChange,
}: LibraryFilterBarProps) {
  return (
    <>
      <TextField
        size="small"
        placeholder="Search word or translation…"
        value={search}
        onChange={(e) => onSearchChange(clampAndStripControlChars(e.target.value, MAX_SEARCH_LENGTH))}
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
          onChange={(e) => onLanguageFilterChange(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          {filterOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  )
}
