import { memo } from "react";
import { Typography, Box, Button } from "@mui/material";

type ReverseMultipleChoiceBlockProps = {
  translation: string;
  options: string[];
  answered: boolean;
  onSelect: (option: string) => void;
};

function ReverseMultipleChoiceBlockInner({
  translation,
  options,
  answered,
  onSelect,
}: ReverseMultipleChoiceBlockProps) {
  return (
    <>
      <Typography variant="h5" component="p" sx={{ mb: 2 }}>
        {translation}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Pick the correct word
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

export const ReverseMultipleChoiceBlock = memo(ReverseMultipleChoiceBlockInner);
