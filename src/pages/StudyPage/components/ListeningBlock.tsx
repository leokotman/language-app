import { memo } from "react";
import { Typography, Box, Button } from "@mui/material";

type ListeningBlockProps = {
  onPlayWord: () => void;
  options: string[];
  answered: boolean;
  onSelect: (option: string) => void;
};

function ListeningBlockInner({
  onPlayWord,
  options,
  answered,
  onSelect,
}: ListeningBlockProps) {
  return (
    <>
      <Button
        variant="contained"
        aria-label="Play word"
        startIcon={<span aria-hidden>🔊</span>}
        onClick={onPlayWord}
        sx={{ mb: 2 }}
      >
        Play word
      </Button>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Pick the correct translation
      </Typography>
      <Box display="flex" flexDirection="column" gap={0.5}>
        {options.map((option) => (
          <Button
            key={option}
            variant="outlined"
            onClick={() => onSelect(option)}
            disabled={answered}
          >
            {option}
          </Button>
        ))}
      </Box>
    </>
  );
}

export const ListeningBlock = memo(ListeningBlockInner);
