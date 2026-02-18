import { memo } from "react";
import { Typography, Box, Button } from "@mui/material";

type MultipleChoiceBlockProps = {
  word: string;
  options: string[];
  answered: boolean;
  onSelect: (option: string) => void;
};

function MultipleChoiceBlockInner({
  word,
  options,
  answered,
  onSelect,
}: MultipleChoiceBlockProps) {
  return (
    <>
      <Typography variant="h5" component="p" sx={{ mb: 2 }}>
        {word}
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

export const MultipleChoiceBlock = memo(MultipleChoiceBlockInner);
