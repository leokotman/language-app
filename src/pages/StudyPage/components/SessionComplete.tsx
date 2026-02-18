import { Box, Typography, Button } from "@mui/material";

type SessionCompleteProps = {
  cardCount: number;
  onBack: () => void;
};

export function SessionComplete({ cardCount, onBack }: SessionCompleteProps) {
  return (
    <Box data-testid="study-session-complete">
      <Typography variant="h4">Session complete</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        You reviewed all {cardCount} cards. Great job!
      </Typography>
      <Button variant="outlined" sx={{ mt: 2 }} onClick={onBack}>
        Back to study
      </Button>
    </Box>
  );
}
