import { Box, Typography, Alert } from "@mui/material";

export function SignInAlert() {
  return (
    <Box>
      <Typography variant="h4">Study</Typography>
      <Alert severity="info" sx={{ mt: 2 }}>
        Sign in to study your vocabulary.
      </Alert>
    </Box>
  );
}
