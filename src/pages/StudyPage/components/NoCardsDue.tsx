import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

type PairOption = { key: string; label: string };

type NoCardsDueProps = {
  pairOptions: PairOption[];
  selectedPairKey: string;
  onPairChange: (pairKey: string) => void;
};

export function NoCardsDue({
  pairOptions,
  selectedPairKey,
  onPairChange,
}: NoCardsDueProps) {
  return (
    <Box>
      <Typography variant="h4">Study</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        No cards due today for this language pair. Add words in Library or come
        back later.
      </Typography>
      {pairOptions.length > 0 && (
        <FormControl size="small" sx={{ mt: 2, minWidth: 220 }}>
          <InputLabel>Language pair</InputLabel>
          <Select
            value={selectedPairKey}
            label="Language pair"
            onChange={(event) => onPairChange(event.target.value)}
          >
            {pairOptions.map((opt) => (
              <MenuItem key={opt.key} value={opt.key}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
}
