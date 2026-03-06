import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useDueToday, useVocabularyScores } from "@/hooks/useVocabulary";
import { HOME_QUICK_ACTIONS } from "./HomePage.constants";
import { buildHomeStats } from "./HomePage.helpers";

function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data: scoreRows = [],
    isLoading: scoresLoading,
    error: scoresError,
  } = useVocabularyScores(userId);
  const {
    data: dueTodayCards = [],
    isLoading: dueLoading,
    error: dueError,
  } = useDueToday(userId);

  const stats = buildHomeStats(scoreRows);
  const isLoading = scoresLoading || dueLoading;
  const hasError = Boolean(scoresError || dueError);

  if (!userId) {
    return (
      <Box>
        <Typography variant="h4">Home</Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          Sign in to view your dashboard, due cards, and progress summary.
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4">Home</Typography>
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          mt={2}
          data-testid="home-loading"
        >
          <CircularProgress size={24} />
          <Typography color="text.secondary">Loading dashboard...</Typography>
        </Box>
      </Box>
    );
  }

  if (hasError) {
    return (
      <Box>
        <Typography variant="h4">Home</Typography>
        <Alert severity="error" sx={{ mt: 2 }} data-testid="home-error">
          Failed to load dashboard data. Please try again later.
        </Alert>
      </Box>
    );
  }

  const totalDueToday = dueTodayCards.length;
  const hasNoData = totalDueToday === 0 && stats.trackedWords === 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Home
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Your learning dashboard with due reviews, progress, and quick actions.
      </Typography>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard title="Due today" value={totalDueToday} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard title="Tracked words" value={stats.trackedWords} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard title="Learnt words" value={stats.learntWords} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard title="Average score" value={stats.averageScore} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DashboardCard
            title="Active language pairs"
            value={stats.pairCount}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DashboardCard
            title="Due card status"
            value={totalDueToday > 0 ? "Needs review" : "Up to date"}
          />
        </Grid>
      </Grid>

      {hasNoData && (
        <Alert severity="info" sx={{ mt: 2 }} data-testid="home-empty">
          No study data yet. Add words to your library and complete a study
          session to see your dashboard stats.
        </Alert>
      )}

      <Typography variant="h6" sx={{ mt: 3 }}>
        Quick actions
      </Typography>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        {HOME_QUICK_ACTIONS.map((action) => (
          <Grid key={action.to} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle1">{action.label}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {action.description}
                </Typography>
                <Button
                  component={Link}
                  to={action.to}
                  variant="contained"
                  size="small"
                  sx={{ mt: 2 }}
                  data-testid={action.testId}
                >
                  Open {action.label}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
