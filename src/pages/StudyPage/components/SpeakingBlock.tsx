import { memo } from "react";
import { Typography, Box, Button } from "@mui/material";

type SpeakingBlockProps = {
  word: string;
  onPlayWord: () => void;
  isRecording: boolean;
  recordingBlob: Blob | null;
  recordingError: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayBack: () => void;
};

function SpeakingBlockInner({
  word,
  onPlayWord,
  isRecording,
  recordingBlob,
  recordingError,
  onStartRecording,
  onStopRecording,
  onPlayBack,
}: SpeakingBlockProps) {
  return (
    <>
      <Typography variant="h5" component="p" sx={{ mb: 1 }}>
        {word}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Say the word, then record yourself. Play back to check, then rate.
      </Typography>
      <Button
        variant="outlined"
        size="small"
        aria-label="Play word"
        startIcon={<span aria-hidden>🔊</span>}
        onClick={onPlayWord}
        sx={{ mr: 1, mb: 1 }}
      >
        Play word
      </Button>
      <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
        {!isRecording ? (
          <Button
            variant="contained"
            color="primary"
            onClick={onStartRecording}
            data-testid="study-speaking-record"
          >
            Record
          </Button>
        ) : (
          <Button
            variant="contained"
            color="error"
            onClick={onStopRecording}
            data-testid="study-speaking-stop"
          >
            Stop
          </Button>
        )}
        {recordingBlob && !isRecording && (
          <Button
            variant="outlined"
            onClick={onPlayBack}
            data-testid="study-speaking-playback"
          >
            Play back
          </Button>
        )}
      </Box>
      {recordingError && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {recordingError}
        </Typography>
      )}
    </>
  );
}

export const SpeakingBlock = memo(SpeakingBlockInner);
