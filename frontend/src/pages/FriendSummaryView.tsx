import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../api/useApiClient';
import type { FriendSummaryResponse } from '../types/friend';
import type { Problem } from '../types/problem';
import Heatmap from '../components/Heatmap';
import ProblemList from './ProblemList';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Stack,
  Chip,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

export default function FriendSummaryView() {
  const { friendUserId } = useParams<{ friendUserId: string }>();
  const navigate = useNavigate();
  const fetchApi = useApiClient();

  const { data: summary, isLoading, error } = useQuery<FriendSummaryResponse>({
    queryKey: ['friendSummary', friendUserId],
    queryFn: async () => {
      const res = await fetchApi(`/v1/friends/${friendUserId}/summary`);
      if (!res.ok) {
        const fallback = await fetchApi(`/friends/${friendUserId}/summary`);
        if (!fallback.ok) {
          if (fallback.status === 403 || res.status === 403) {
            throw new Error('Access denied: You must be accepted friends with this user to view their log.');
          }
          throw new Error('Failed to load friend log');
        }
        return fallback.json();
      }
      return res.json();
    },
    enabled: Boolean(friendUserId),
    retry: false,
  });

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CircularProgress size={36} sx={{ color: '#4F3FF0' }} />
          <Typography variant="body2" color="text.secondary">
            Loading friend's log...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !summary) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid #F8B4B4',
            backgroundColor: '#FDECEC',
            textAlign: 'center',
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 40, color: '#9B1C1C', mb: 1.5 }} />
          <Typography variant="h6" sx={{ color: '#9B1C1C', fontWeight: 700, mb: 1 }}>
            {error instanceof Error ? error.message : 'Unable to view friend log'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#771D1D', mb: 3 }}>
            You do not have an active, accepted friendship with this user. To view their log, send them a friend request and wait for them to accept.
          </Typography>
          <Button
            component={RouterLink}
            to="/friends"
            variant="contained"
            startIcon={<ArrowBackIcon />}
            sx={{
              backgroundColor: '#9B1C1C',
              '&:hover': { backgroundColor: '#771D1D' },
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            Back to Friends
          </Button>
        </Paper>
      </Container>
    );
  }

  // Convert solvedProblems to Problem[] shape for reuse with ProblemList
  const mappedProblems: Problem[] = (summary.solvedProblems || []).map((p) => ({
    id: p.id,
    title: p.title,
    platform: p.platform,
    url: p.url,
    difficulty: p.difficulty,
    primaryTopicId: '',
    primaryTopicName: p.primaryTopicName || 'General',
    extraTopicNames: [],
    currentStatus: p.currentStatus || 'Solved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return (
    <Box sx={{ py: 4 }}>
      {/* Header bar */}
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/friends')}
          sx={{
            mb: 2,
            color: '#64748B',
            fontWeight: 600,
            fontSize: '0.85rem',
            '&:hover': { color: '#4F3FF0' },
          }}
        >
          Back to Friends
        </Button>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            p: 3,
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E3E6EF',
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: '#EEEBFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4F3FF0',
              }}
            >
              <AccountCircleOutlinedIcon sx={{ fontSize: 32 }} />
            </Box>
            <div>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700,
                  color: '#171A2B',
                  letterSpacing: '-0.02em',
                }}
              >
                Viewing {summary.displayName}'s log
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Connected Friend
              </Typography>
            </div>
          </Stack>

          <Chip
            icon={<LockOutlinedIcon sx={{ fontSize: '0.9rem !important' }} />}
            label="Read-Only View"
            size="small"
            sx={{
              backgroundColor: '#F1F5F9',
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>
      </Container>

      {/* Reused Heatmap Component in read-only mode */}
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Heatmap data={summary.heatmap} readOnly={true} />
      </Container>

      {/* Reused ProblemList Component in read-only mode */}
      <ProblemList
        initialProblems={mappedProblems}
        readOnly={true}
        headerTitle={`${summary.displayName}'s Solved Problems`}
        headerSubtitle={`Displaying ${mappedProblems.length} solved algorithmic challenge${mappedProblems.length === 1 ? '' : 's'}.`}
      />
    </Box>
  );
}
