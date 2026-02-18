import { memo } from "react";
import { Box, Button } from "@mui/material";
import { StudyRating } from "@/lib/fsrs";
import { STUDY_RATING_LABELS } from "../StudyPage.constants";

type RatingButtonsProps = {
  onRate: (rating: StudyRating) => void;
  isPending: boolean;
};

function RatingButtonsInner({ onRate, isPending }: RatingButtonsProps) {
  return (
    <Box display="flex" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
      {(
        Object.keys(STUDY_RATING_LABELS) as Array<
          keyof typeof STUDY_RATING_LABELS
        >
      ).map((label) => {
        const rating = StudyRating[label];
        return (
          <Button
            key={label}
            variant="contained"
            color={label === "Again" ? "error" : "primary"}
            size="small"
            disabled={false}
            aria-busy={isPending}
            onClick={() => onRate(rating)}
          >
            {STUDY_RATING_LABELS[label]}
          </Button>
        );
      })}
    </Box>
  );
}

export const RatingButtons = memo(RatingButtonsInner);
