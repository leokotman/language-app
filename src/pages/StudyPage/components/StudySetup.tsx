import { memo } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  CircularProgress,
} from "@mui/material";
import type { ExerciseType } from "../StudyPage.models";
import { EXERCISE_TYPE_OPTIONS } from "../StudyPage.constants";

type PairOption = { key: string; label: string };

type StudySetupProps = {
  pairOptions: PairOption[];
  selectedPairKey: string;
  onPairChange: (pairKey: string) => void;
  dueLoading: boolean;
  dueCount: number;
  enabledExerciseTypes: ExerciseType[];
  onToggleExerciseType: (type: ExerciseType, checked: boolean) => void;
  canStart: boolean;
  onStartSession: () => void;
};

function StudySetupInner({
  pairOptions,
  selectedPairKey,
  onPairChange,
  dueLoading,
  dueCount,
  enabledExerciseTypes,
  onToggleExerciseType,
  canStart,
  onStartSession,
}: StudySetupProps) {
  return (
    <Box>
      <Typography variant="h4">Study</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Choose a language pair and start a study session with cards due today.
      </Typography>
      {pairOptions.length > 0 && (
        <FormControl size="small" sx={{ mt: 2, minWidth: 220 }}>
          <InputLabel>Language pair</InputLabel>
          <Select
            value={selectedPairKey}
            label="Language pair"
            onChange={(event) => onPairChange(event.target.value)}
          >
            {pairOptions.map((opt) => (
              <MenuItem key={opt.key} value={opt.key}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {dueLoading ? (
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          mt={2}
          data-testid="study-due-loading"
        >
          <CircularProgress size={20} />
          <Typography color="text.secondary">Loading due cards…</Typography>
        </Box>
      ) : (
        <Box mt={2} data-testid="study-setup">
          <Typography sx={{ mb: 1 }}>
            <strong>{dueCount}</strong> card{dueCount !== 1 ? "s" : ""} due
            today
          </Typography>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mt: 2, mb: 0.5 }}
          >
            Exercise types
          </Typography>
          <FormGroup row>
            {EXERCISE_TYPE_OPTIONS.map((opt) => (
              <FormControlLabel
                key={opt.type}
                control={
                  <Checkbox
                    checked={enabledExerciseTypes.includes(opt.type)}
                    onChange={(_, checked) =>
                      onToggleExerciseType(opt.type, checked)
                    }
                  />
                }
                label={
                  <span>
                    {opt.label}{" "}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      ({opt.difficulty})
                    </Typography>
                  </span>
                }
              />
            ))}
          </FormGroup>
          <Button
            variant="contained"
            onClick={onStartSession}
            disabled={!canStart}
            sx={{ mt: 2 }}
            data-testid="study-start-session"
          >
            Start session
          </Button>
        </Box>
      )}
    </Box>
  );
}

export const StudySetup = memo(StudySetupInner);
