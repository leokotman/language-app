import { memo } from "react";
import { Typography, Button } from "@mui/material";

type FlashcardBlockProps = {
  word: string;
  translation: string;
  revealed: boolean;
  onReveal: () => void;
};

function FlashcardBlockInner({
  word,
  translation,
  revealed,
  onReveal,
}: FlashcardBlockProps) {
  return (
    <>
      <Typography variant="h5" component="p" sx={{ mb: 2 }}>
        {word}
      </Typography>
      {!revealed ? (
        <Button variant="contained" onClick={onReveal}>
          Reveal translation
        </Button>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          {translation}
        </Typography>
      )}
    </>
  );
}

export const FlashcardBlock = memo(FlashcardBlockInner);
