import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useVocabularyScores } from "@/hooks/useVocabulary";
import { useDueToday } from "@/hooks/useVocabulary";
import { aggregateProgressByPair } from "./ProgressPage.helpers";
import type {
  ProgressDirectionStats,
  ProgressPairStats,
} from "./ProgressPage.models";

function formatLastStudied(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString();
}

function DirectionRow({ stats }: { stats: ProgressDirectionStats }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        py: 0.5,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {stats.directionLabel}
      </Typography>
      <Chip size="small" label={`${stats.wordCount} words`} />
      <Chip size="small" label={`Avg ${stats.averageScore}`} />
      {stats.learntCount > 0 && (
        <Chip
          size="small"
          color="success"
          label={`${stats.learntCount} learnt`}
        />
      )}
      <Typography variant="caption" color="text.secondary">
        Last: {formatLastStudied(stats.lastStudiedAt)}
      </Typography>
    </Box>
  );
}

function PairCard({ pair }: { pair: ProgressPairStats }) {
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {pair.pairLabel}
        </Typography>
        {pair.directionFromTo && <DirectionRow stats={pair.directionFromTo} />}
        {pair.directionToFrom && <DirectionRow stats={pair.directionToFrom} />}
      </CardContent>
    </Card>
  );
}

export function ProgressPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const {
    data: scoreRows = [],
    isLoading: scoresLoading,
    error: scoresError,
  } = useVocabularyScores(userId);
  const { data: dueTodayCards = [] } = useDueToday(userId);

  const pairStats = aggregateProgressByPair(scoreRows);
  const totalDueToday = dueTodayCards.length;

  if (!userId) {
    return (
      <Box>
        <Typography variant="h4">Progress</Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          Sign in to see your progress, stats by language pair, and words due
          today.
        </Alert>
      </Box>
    );
  }

  if (scoresLoading) {
    return (
      <Box>
        <Typography variant="h4">Progress</Typography>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          mt={2}
          data-testid="progress-loading"
        >
          <CircularProgress size={24} />
          <Typography color="text.secondary">Loading progress…</Typography>
        </Box>
      </Box>
    );
  }

  if (scoresError) {
    return (
      <Box>
        <Typography variant="h4">Progress</Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to load progress. Try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4">Progress</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Stats by language pair: words practised, average score, learnt count,
        and last studied. Score 0–50: learning; 50–100: learnt.
      </Typography>

      {totalDueToday > 0 && (
        <Alert severity="info" sx={{ mt: 2 }} data-testid="progress-due-today">
          You have <strong>{totalDueToday}</strong> card
          {totalDueToday !== 1 ? "s" : ""} due today. Go to Study to review.
        </Alert>
      )}

      {pairStats.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No progress yet. Add words to your library and complete study sessions
          to see stats here.
        </Typography>
      ) : (
        <Box sx={{ mt: 2 }}>
          {pairStats.map((pair) => (
            <PairCard key={pair.pairKey} pair={pair} />
          ))}
        </Box>
      )}
    </Box>
  );
}
