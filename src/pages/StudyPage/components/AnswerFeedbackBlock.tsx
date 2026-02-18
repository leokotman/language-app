import { memo } from "react";
import { Typography } from "@mui/material";

type AnswerFeedbackBlockProps = {
  correct: boolean;
  userAnswer?: string;
  correctAnswer: string;
  ratingButtons: React.ReactNode;
};

function AnswerFeedbackBlockInner({
  correct,
  userAnswer,
  correctAnswer,
  ratingButtons,
}: AnswerFeedbackBlockProps) {
  return (
    <>
      {correct ? (
        <Typography color="success.main" sx={{ mb: 1 }}>
          Correct!
        </Typography>
      ) : (
        <Typography color="error" sx={{ mb: 1 }}>
          Wrong.{" "}
          {userAnswer != null && (
            <Typography component="span" color="text.secondary">
              Correct: {correctAnswer}
            </Typography>
          )}
        </Typography>
      )}
      {ratingButtons}
    </>
  );
}

export const AnswerFeedbackBlock = memo(AnswerFeedbackBlockInner);
