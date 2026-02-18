import { memo } from "react";
import { Typography, Button } from "@mui/material";

type ReverseFlashcardBlockProps = {
  word: string;
  translation: string;
  revealed: boolean;
  onReveal: () => void;
};

function ReverseFlashcardBlockInner({
  word,
  translation,
  revealed,
  onReveal,
}: ReverseFlashcardBlockProps) {
  return (
    <>
      <Typography variant="h5" component="p" sx={{ mb: 2 }}>
        {translation}
      </Typography>
      {!revealed ? (
        <Button variant="contained" onClick={onReveal}>
          Reveal word
        </Button>
      ) : (
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          {word}
        </Typography>
      )}
    </>
  );
}

export const ReverseFlashcardBlock = memo(ReverseFlashcardBlockInner);
