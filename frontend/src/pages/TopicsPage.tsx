import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useApiClient } from '../api/useApiClient';
import type { TopicProgress } from '../types/stats';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Paper,
  LinearProgress,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TagIcon from '@mui/icons-material/Tag';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

export default function TopicsPage() {
  const fetchApi = useApiClient();
  const navigate = useNavigate();

  const { data: topics = [], isLoading, error } = useQuery<TopicProgress[]>({
    queryKey: ['statsTopics'],
    queryFn: async () => {
      const res = await fetchApi('/stats/topics');
      if (!res.ok) throw new Error('Failed to load topic progress');
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
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
            Topic Map
          </Typography>
          <Typography variant="body2" color="text.secondary">
            See the shape of your practice across algorithmic domains and pinpoint gaps.
          </Typography>
        </div>

        <Button
          component={RouterLink}
          to="/problems/new"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 2.5, fontWeight: 600 }}
        >
          Add Problem
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12 }}>
          <CircularProgress size={36} sx={{ color: '#4F3FF0', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading topic coverage...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load topic progress. Please refresh the page.
        </Alert>
      ) : topics.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 3,
            textAlign: 'center',
            borderRadius: 3,
            border: '1.5px dashed #E3E6EF',
            backgroundColor: '#FAFBFC',
          }}
        >
          <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 1 }}>
            No topics tracked yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 3 }}>
            Topics will populate automatically as you log problems from LeetCode or other platforms.
          </Typography>
          <Button component={RouterLink} to="/problems/new" variant="contained">
            Log First Problem
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {topics.map((t) => {
            const pct = t.totalProblems > 0 ? Math.round((t.solvedProblems / t.totalProblems) * 100) : 0;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t.topicId}>
                <Paper
                  elevation={0}
                  onClick={() => navigate(`/problems?topic=${encodeURIComponent(t.topicName)}`)}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid #E3E6EF',
                    backgroundColor: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 160,
                    '&:hover': {
                      borderColor: '#4F3FF0',
                      boxShadow: '0 6px 20px rgba(79, 63, 240, 0.08)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <div>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          backgroundColor: '#EEEBFF',
                          color: '#4F3FF0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <TagIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: '"Space Grotesk", sans-serif',
                          fontWeight: 700,
                          color: '#171A2B',
                          fontSize: '1.05rem',
                        }}
                        noWrap
                      >
                        {t.topicName}
                      </Typography>
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      {t.totalProblems} logged •{' '}
                      <span style={{ color: '#0E9F6E', fontWeight: 600 }}>{t.solvedProblems} solved</span>
                    </Typography>
                  </div>

                  <div>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 7,
                        borderRadius: 3.5,
                        backgroundColor: '#F1F5F9',
                        mb: 1.5,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: pct === 100 ? '#0E9F6E' : pct > 50 ? '#4F3FF0' : '#8B7FF5',
                          borderRadius: 3.5,
                        },
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        {pct === 100 && (
                          <CheckCircleOutlinedIcon sx={{ color: '#0E9F6E', fontSize: 15 }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontWeight: 600,
                            color: pct === 100 ? '#0E9F6E' : '#64748B',
                          }}
                        >
                          {pct}% clear
                        </Typography>
                      </Stack>

                      <Typography
                        variant="caption"
                        sx={{
                          color: '#4F3FF0',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        View problems <ArrowForwardIcon sx={{ fontSize: 12 }} />
                      </Typography>
                    </Box>
                  </div>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}
