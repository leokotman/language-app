import {
  Box,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { MAX_SEARCH_LENGTH, clampAndStripControlChars } from "@/lib/sanitize";
import { DIRECTION_OPTIONS } from "../DictionaryPage.constants";

export type DictionaryLookupBarProps = {
  search: string;
  direction: string;
  onSearchChange: (value: string) => void;
  onDirectionChange: (value: string) => void;
};

export function DictionaryLookupBar({
  search,
  direction,
  onSearchChange,
  onDirectionChange,
}: DictionaryLookupBarProps) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
      <TextField
        size="small"
        placeholder="Search (e.g. hello, привет)…"
        value={search}
        onChange={(event) =>
          onSearchChange(
            clampAndStripControlChars(event.target.value, MAX_SEARCH_LENGTH),
          )
        }
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ minWidth: 260 }}
      />
      <FormControl size="small" sx={{ minWidth: 240 }}>
        <InputLabel id="dict-direction">Direction</InputLabel>
        <Select
          labelId="dict-direction"
          value={direction}
          label="Direction"
          onChange={(event) => onDirectionChange(event.target.value)}
        >
          {DIRECTION_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
