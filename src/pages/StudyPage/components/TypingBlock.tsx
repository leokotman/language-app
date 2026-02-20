import { memo } from "react";
import { Typography, TextField, Button } from "@mui/material";

type TypingBlockProps = {
  word: string;
  value: string;
  onChange: (value: string) => void;
  onCheck: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
};

function TypingBlockInner({
  word,
  value,
  onChange,
  onCheck,
  onKeyDown,
}: TypingBlockProps) {
  return (
    <>
      <Typography variant="h5" component="p" sx={{ mb: 2 }}>
        {word}
      </Typography>
      <TextField
        fullWidth
        label="Translation"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
        sx={{ mb: 1 }}
      />
      <Button variant="contained" onClick={onCheck}>
        Check
      </Button>
    </>
  );
}

export const TypingBlock = memo(TypingBlockInner);
