import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useApiClient } from '../api/useApiClient';
import Heatmap from '../components/Heatmap';
import type { Problem } from '../types/problem';
import type { StatsSummary } from '../types/stats';
import { AnimatedNumber } from '../components/motion/AnimatedNumber';
import { TextEffect } from '../components/motion/TextEffect';
import { InView } from '../components/motion/InView';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
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
  'Not Attempted': '#94A3B8',
  'Tried': '#F59E0B',
  'Could not solve': '#8B7FF5',
  'Solved': '#4F3FF0',
  'Solved optimally': '#10B981',
};

export default function Dashboard() {
  const fetchApi = useApiClient();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery<StatsSummary>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetchApi('/stats/summary');
      if (!res.ok) throw new Error('Failed to fetch dashboard');
      return res.json();
    },
    retry: 1,
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

  const revisitRows = [
    ...overdue.map((p) => ({ ...p, urgency: 'overdue' as const, label: 'Overdue' })),
    ...due.map((p) => ({ ...p, urgency: 'today' as const, label: 'Due today' })),
  ].slice(0, 5);

  const diffCounts = data?.difficultyCounts || {};
  const maxDiff = Math.max(...Object.values(diffCounts), 1);
  const sortedDiffs = Object.entries(diffCounts).sort((a, b) => b[1] - a[1]);

  const queueCount = overdue.length + due.length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Top Banner / Greeting with Motion Primitive TextEffect */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'flex-start' },
          mb: 4,
          gap: 2.5,
        }}
      >
        <Box sx={{ maxWidth: 640 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontFamily: '"Space Grotesk", sans-serif',
              fontWeight: 700,
              color: '#171A2B',
              letterSpacing: '-0.02em',
              mb: 0.5,
              lineHeight: 1.2,
            }}
          >
            <TextEffect per="word">{greeting}</TextEffect> 👋
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Here is your daily algorithmic practice summary and retention status.
          </Typography>
        </Box>

        <Box sx={{ pt: { xs: 0, sm: 0.5 }, flexShrink: 0 }}>
          <Button
            component={RouterLink}
            to="/queue"
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              fontWeight: 600,
              py: 0.9,
              px: 2.2,
              borderColor: queueCount > 0 ? '#D97706' : '#E3E6EF',
              color: queueCount > 0 ? '#B45309' : '#4F3FF0',
              backgroundColor: queueCount > 0 ? '#FFFBEB' : '#FFFFFF',
              '&:hover': {
                borderColor: queueCount > 0 ? '#B45309' : '#4F3FF0',
                backgroundColor: queueCount > 0 ? '#FEF3C7' : '#F8FAFC',
              },
            }}
          >
            Open Queue ({queueCount})
          </Button>
        </Box>
      </Box>

      {isError ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
          <Typography variant="h6" sx={{ color: '#DC2626', fontWeight: 700 }}>
            Couldn't reach the server
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 380 }}>
            The backend may be waking up from sleep (Render free tier). Wait a few seconds and try again.
          </Typography>
          <Button
            variant="contained"
            onClick={() => refetch()}
            sx={{ borderRadius: 2.5, fontWeight: 600, mt: 1 }}
          >
            Retry
          </Button>
        </Box>
      ) : isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12 }}>
          <CircularProgress size={40} sx={{ color: '#4F3FF0', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Gathering practice analytics...
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, opacity: 0.6 }}>
            Backend may be waking up — this can take ~30s on first load
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* Key Metric Cards with Motion Primitive AnimatedNumber */}
          <InView delay={0.1}>
            <Grid container spacing={2.5}>
              {/* Total Problems */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid #E3E6EF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
                      borderColor: '#4F3FF0',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 1.5,
                      backgroundColor: '#EEEBFF',
                      color: '#4F3FF0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 26 }} />
                  </Box>
                  <div>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                      Tracked problems
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontWeight: 700,
                        color: '#171A2B',
                        lineHeight: 1.1,
                        mt: 0.5,
                      }}
                    >
                      <AnimatedNumber value={total} />
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
                    borderRadius: 2,
                    border: '1px solid #E3E6EF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
                      borderColor: '#0E9F6E',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 1.5,
                      backgroundColor: '#DEF7EC',
                      color: '#0E9F6E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircleIcon sx={{ fontSize: 26 }} />
                  </Box>
                  <div>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                      Solved optimally
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontWeight: 700,
                        color: '#0E9F6E',
                        lineHeight: 1.1,
                        mt: 0.5,
                      }}
                    >
                      <AnimatedNumber value={solvedCount} />
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
                    borderRadius: 2,
                    border: '1px solid #E3E6EF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
                      borderColor: overdue.length > 0 ? '#DC2626' : '#D97706',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 1.5,
                      backgroundColor: overdue.length > 0 ? '#FDECEC' : '#FEF3C7',
                      color: overdue.length > 0 ? '#DC2626' : '#D97706',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <WarningAmberIcon sx={{ fontSize: 26 }} />
                  </Box>
                  <div>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                      Revisit needed
                    </Typography>
                    <Typography
                      variant="h4"
                      component="div"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontWeight: 700,
                        color: overdue.length > 0 ? '#DC2626' : '#D97706',
                        lineHeight: 1.1,
                        mt: 0.5,
                      }}
                    >
                      <AnimatedNumber value={overdue.length + due.length} />
                    </Typography>
                  </div>
                </Paper>
              </Grid>
            </Grid>
          </InView>

          {/* Progress Breakdown Card */}
          <InView delay={0.2}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #E3E6EF' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}
                >
                  Practice Outcome Distribution
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {total > 0 ? Math.round((solvedCount / total) * 100) : 0}% Solve Rate
                </Typography>
              </Box>

              {/* Multi-segmented status bar */}
              <Box
                sx={{
                  height: 12,
                  borderRadius: 9999,
                  overflow: 'hidden',
                  display: 'flex',
                  backgroundColor: '#F1F5F9',
                  mb: 2.5,
                }}
              >
                {STATUS_ORDER.map((st) => {
                  const count = statusCounts[st] || 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <Tooltip key={st} title={`${st}: ${count} (${Math.round(pct)}%)`} arrow>
                      <Box
                        sx={{
                          width: `${pct}%`,
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
          </InView>

          {/* Activity Heatmap */}
          <InView delay={0.25}>
            <Heatmap />
          </InView>

          {/* Two-Column Detail Grid */}
          <InView delay={0.3}>
            <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
              {/* Revisit Due Widget */}
              <Grid size={{ xs: 12, md: 7 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid #E3E6EF',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      minHeight: 36,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}
                    >
                      Due for Revisit
                    </Typography>
                    <Button
                      component={RouterLink}
                      to="/queue"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      sx={{ fontWeight: 600, color: '#4F3FF0', p: 0, minWidth: 0, '&:hover': { background: 'transparent' } }}
                    >
                      View All
                    </Button>
                  </Box>

                  {revisitRows.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center', my: 'auto' }}>
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
                              borderRadius: 1.5,
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
                                borderRadius: 1.5,
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
              <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', flexDirection: 'column' }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid #E3E6EF',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      minHeight: 36,
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}
                    >
                      By Difficulty
                    </Typography>
                  </Box>

                  <Stack spacing={2} sx={{ mb: 2 }}>
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
                            value={pct}
                            sx={{
                              height: 6,
                              borderRadius: 9999,
                              backgroundColor: '#F1F5F9',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: color,
                                borderRadius: 9999,
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </InView>
        </Stack>
      )}
    </Container>
  );
}
