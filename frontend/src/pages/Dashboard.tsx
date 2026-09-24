import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useApiClient } from '../api/useApiClient';
import Heatmap from '../components/Heatmap';
import type { Problem } from '../types/problem';
import type { StatsSummary } from '../types/stats';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Stack,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const STATUS_ORDER = ['Not Attempted', 'Tried', 'Could not solve', 'Solved', 'Solved optimally'];
const STATUS_COLORS: Record<string, string> = {
  'Not Attempted': '#E2E4EC',
  'Tried': '#C7CCE3',
  'Could not solve': '#8B7FF5',
  'Solved': '#4F3FF0',
  'Solved optimally': '#10B981',
};

function useCountUp(target: number, active: boolean, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let raf: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

export default function Dashboard() {
  const fetchApi = useApiClient();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const { data, isLoading } = useQuery<StatsSummary>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetchApi('/stats/summary');
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      return res.json();
    },
  });

  const { data: overdue = [] } = useQuery<Problem[]>({
    queryKey: ['revisitQueue', 'overdue'],
    queryFn: async () => {
      const res = await fetchApi('/revisit-queue?bucket=overdue');
      return res.ok ? res.json() : [];
    },
  });

  const { data: due = [] } = useQuery<Problem[]>({
    queryKey: ['revisitQueue', 'due'],
    queryFn: async () => {
      const res = await fetchApi('/revisit-queue?bucket=due');
      return res.ok ? res.json() : [];
    },
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const total = data?.totalProblems || 0;
  const statusCounts = data?.statusCounts || {};
  const solvedCount = (statusCounts['Solved'] || 0) + (statusCounts['Solved optimally'] || 0);

  const animatedTotal = useCountUp(total, mounted && !isLoading);
  const animatedSolved = useCountUp(solvedCount, mounted && !isLoading);

  const revisitRows = [
    ...overdue.map((p) => ({ ...p, urgency: 'overdue' as const, label: 'Overdue' })),
    ...due.map((p) => ({ ...p, urgency: 'today' as const, label: 'Due today' })),
  ].slice(0, 5);

  const diffCounts = data?.difficultyCounts || {};
  const maxDiff = Math.max(...Object.values(diffCounts), 1);
  const sortedDiffs = Object.entries(diffCounts).sort((a, b) => b[1] - a[1]);

  const platformCounts = data?.platformCounts || {};

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Top Banner / Greeting */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 4,
          gap: 2,
        }}
      >
        <div>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              color: '#171A2B',
              letterSpacing: '-0.02em',
              mb: 0.5,
            }}
          >
            {greeting} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Here is your daily algorithmic practice summary and retention status.
          </Typography>
        </div>

        <Stack direction="row" spacing={1.5}>
          <Button
            component={RouterLink}
            to="/queue"
            variant="outlined"
            sx={{ borderRadius: 2.5, fontWeight: 600 }}
          >
            Open Queue ({overdue.length + due.length})
          </Button>
          <Button
            component={RouterLink}
            to="/problems/new"
            variant="contained"
            sx={{ borderRadius: 2.5, fontWeight: 600 }}
          >
            + Log Problem
          </Button>
        </Stack>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12 }}>
          <CircularProgress size={40} sx={{ color: '#4F3FF0', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Gathering practice analytics...
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* Key Metric Cards */}
          <Grid container spacing={2.5}>
            {/* Total Problems */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #E3E6EF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    backgroundColor: '#EEEBFF',
                    color: '#4F3FF0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 28 }} />
                </Box>
                <div>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                    Tracked Problems
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontWeight: 700,
                      color: '#171A2B',
                      lineHeight: 1.1,
                      mt: 0.5,
                    }}
                  >
                    {animatedTotal}
                  </Typography>
                </div>
              </Paper>
            </Grid>

            {/* Total Solved */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #E3E6EF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    backgroundColor: '#DEF7EC',
                    color: '#0E9F6E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 28 }} />
                </Box>
                <div>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                    Solved Optimally
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontWeight: 700,
                      color: '#0E9F6E',
                      lineHeight: 1.1,
                      mt: 0.5,
                    }}
                  >
                    {animatedSolved}
                  </Typography>
                </div>
              </Paper>
            </Grid>

            {/* Overdue / Due */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #E3E6EF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2.5,
                    backgroundColor: overdue.length > 0 ? '#FDECEC' : '#FEF3C7',
                    color: overdue.length > 0 ? '#DC2626' : '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WarningAmberIcon sx={{ fontSize: 28 }} />
                </Box>
                <div>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                    Revisit Needed
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: '"IBM Plex Mono", monospace',
                      fontWeight: 700,
                      color: overdue.length > 0 ? '#DC2626' : '#D97706',
                      lineHeight: 1.1,
                      mt: 0.5,
                    }}
                  >
                    {overdue.length + due.length}
                  </Typography>
                </div>
              </Paper>
            </Grid>
          </Grid>

          {/* Progress Breakdown Card */}
          <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #E3E6EF' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
                Practice Outcome Distribution
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {total > 0 ? Math.round((solvedCount / total) * 100) : 0}% Solve Rate
              </Typography>
            </Box>

            {/* Multi-segmented status bar */}
            <Box
              sx={{
                height: 14,
                borderRadius: 7,
                overflow: 'hidden',
                display: 'flex',
                backgroundColor: '#F1F5F9',
                mb: 3,
              }}
            >
              {STATUS_ORDER.map((st) => {
                const count = statusCounts[st] || 0;
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <Tooltip key={st} title={`${st}: ${count} (${Math.round(pct)}%)`} arrow>
                    <Box
                      sx={{
                        width: mounted ? `${pct}%` : '0%',
                        backgroundColor: STATUS_COLORS[st],
                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>

            {/* Legend */}
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
              {STATUS_ORDER.map((st) => (
                <Box key={st} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: STATUS_COLORS[st] }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.825rem' }}>
                    {st}:{' '}
                    <strong style={{ color: '#171A2B', fontFamily: '"IBM Plex Mono", monospace' }}>
                      {statusCounts[st] || 0}
                    </strong>
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* Activity Heatmap */}
          <Heatmap />

          {/* Two-Column Detail Grid */}
          <Grid container spacing={3}>
            {/* Revisit Due Widget */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E3E6EF', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
                    Due for Revisit
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/queue"
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    sx={{ fontWeight: 600, color: '#4F3FF0' }}
                  >
                    View All
                  </Button>
                </Box>

                {revisitRows.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <AutoAwesomeIcon sx={{ fontSize: 32, color: '#10B981', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No problems are currently overdue for review!
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1.5}>
                    {revisitRows.map((p) => {
                      const isOverdue = p.urgency === 'overdue';
                      return (
                        <Box
                          key={p.id}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid #F1F5F9',
                            backgroundColor: '#FAFBFC',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              backgroundColor: '#F8FAFC',
                              borderColor: '#E2E8F0',
                            },
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#171A2B' }} noWrap>
                              {p.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {p.primaryTopicName || 'General'} •{' '}
                              <span style={{ color: isOverdue ? '#DC2626' : '#D97706', fontWeight: 600 }}>
                                {p.label}
                              </span>
                            </Typography>
                          </Box>

                          <Button
                            variant="contained"
                            size="small"
                            color={isOverdue ? 'error' : 'primary'}
                            startIcon={<PlayArrowIcon sx={{ fontSize: 16 }} />}
                            onClick={() => navigate(`/problems/${p.id}/attempts`)}
                            sx={{
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 2,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Attempt
                          </Button>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Paper>
            </Grid>

            {/* Breakdown by Difficulty & Platform */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E3E6EF', height: '100%' }}>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, mb: 2 }}
                >
                  By Difficulty
                </Typography>

                <Stack spacing={2} sx={{ mb: 3 }}>
                  {sortedDiffs.map(([diff, count]) => {
                    const pct = Math.round((count / maxDiff) * 100);
                    const color =
                      diff === 'EASY' ? '#0E9F6E' : diff === 'MEDIUM' ? '#D97706' : '#DC2626';
                    return (
                      <Box key={diff}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                            {diff.toLowerCase()}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600 }}
                          >
                            {count}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={mounted ? pct : 0}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#F1F5F9',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: color,
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>

                {Object.keys(platformCounts).length > 0 && (
                  <>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: '#64748B', mb: 1.5, textTransform: 'uppercase' }}
                    >
                      Platforms
                    </Typography>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {Object.entries(platformCounts).map(([platform, count]) => (
                        <Chip
                          key={platform}
                          label={`${platform}: ${count}`}
                          size="small"
                          sx={{
                            backgroundColor: '#F1F5F9',
                            fontWeight: 600,
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: '0.75rem',
                          }}
                        />
                      ))}
                    </Stack>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Container>
  );
}
