import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useApiClient } from '../api/useApiClient';
import type { Problem } from '../types/problem';
import {
  Container,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import TodayIcon from '@mui/icons-material/Today';
import UpcomingIcon from '@mui/icons-material/Upcoming';
import HelpOutlinedIcon from '@mui/icons-material/HelpOutlined';

type Bucket = 'overdue' | 'due' | 'upcoming' | 'unscheduled';

export default function RevisitQueue() {
  const fetchApi = useApiClient();
  const navigate = useNavigate();
  const [activeBucket, setActiveBucket] = useState<Bucket>('due');

  const { data: problems = [], isLoading, error } = useQuery<Problem[]>({
    queryKey: ['revisitQueue', activeBucket],
    queryFn: async () => {
      const res = await fetchApi(`/revisit-queue?bucket=${activeBucket}`);
      if (!res.ok) throw new Error('Failed to fetch queue');
      return res.json();
    },
  });

  const getDifficultyChip = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return (
          <Chip
            label="Easy"
            size="small"
            sx={{ backgroundColor: '#DEF7EC', color: '#03543F', fontWeight: 600, fontSize: '0.75rem' }}
          />
        );
      case 'MEDIUM':
        return (
          <Chip
            label="Medium"
            size="small"
            sx={{ backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 600, fontSize: '0.75rem' }}
          />
        );
      case 'HARD':
        return (
          <Chip
            label="Hard"
            size="small"
            sx={{ backgroundColor: '#FDECEC', color: '#9B1C1C', fontWeight: 600, fontSize: '0.75rem' }}
          />
        );
      default:
        return <Chip label={diff || '-'} size="small" variant="outlined" />;
    }
  };

  const tabs: { id: Bucket; label: string; icon: React.ReactElement; color?: string }[] = [
    { id: 'overdue', label: 'Overdue', icon: <EventBusyIcon sx={{ fontSize: 18 }} /> },
    { id: 'due', label: 'Due Today', icon: <TodayIcon sx={{ fontSize: 18 }} /> },
    { id: 'upcoming', label: 'Upcoming', icon: <UpcomingIcon sx={{ fontSize: 18 }} /> },
    { id: 'unscheduled', label: 'Unscheduled', icon: <HelpOutlinedIcon sx={{ fontSize: 18 }} /> },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
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
          Spaced Repetition Queue
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Strengthen neural recall by re-attempting problems on their optimal retention day.
        </Typography>
      </Box>

      {/* Tabs Filter Paper */}
      <Paper elevation={0} sx={{ mb: 3, border: '1px solid #E3E6EF', borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={activeBucket}
          onChange={(_, val) => setActiveBucket(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            borderBottom: '1px solid #E3E6EF',
            backgroundColor: '#FAFBFC',
            '& .MuiTab-root': {
              minHeight: 56,
              fontWeight: 600,
              fontSize: '0.9rem',
              textTransform: 'none',
              color: '#64748B',
              '&.Mui-selected': {
                color: activeBucket === 'overdue' ? '#DC2626' : '#4F3FF0',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: activeBucket === 'overdue' ? '#DC2626' : '#4F3FF0',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              icon={tab.icon}
              iconPosition="start"
              label={tab.label}
            />
          ))}
        </Tabs>

        {/* Content area inside paper */}
        <Box sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
              <CircularProgress size={36} sx={{ color: '#4F3FF0', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Loading queue items...
              </Typography>
            </Box>
          ) : error ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">Failed to load revisit queue. Please try again.</Alert>
            </Box>
          ) : problems.length === 0 ? (
            <Box sx={{ py: 8, px: 3, textAlign: 'center' }}>
              <Typography
                variant="h6"
                sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 1, color: '#171A2B' }}
              >
                No problems in the {activeBucket} queue
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 3 }}>
                {activeBucket === 'overdue'
                  ? 'Great work! You have no overdue problems waiting for review.'
                  : activeBucket === 'due'
                  ? 'All caught up for today! Check upcoming problems or log new ones.'
                  : 'Problems solved will be scheduled here automatically based on performance.'}
              </Typography>
              <Button
                component={RouterLink}
                to="/problems"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Browse All Problems
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Problem Title</TableCell>
                    <TableCell>Topic</TableCell>
                    <TableCell>Difficulty</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Revisit Date</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {problems.map((p) => (
                    <TableRow
                      key={p.id}
                      hover
                      sx={{
                        transition: 'background-color 0.15s ease',
                        '&:hover': { backgroundColor: '#F8FAFC !important' },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#171A2B' }}>
                          {p.title}
                        </Typography>
                        {p.platform && (
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            {p.platform}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={p.primaryTopicName || 'General'}
                          size="small"
                          sx={{ backgroundColor: '#F1F5F9', color: '#334155', fontWeight: 500, fontSize: '0.75rem' }}
                        />
                      </TableCell>

                      <TableCell>{getDifficultyChip(p.difficulty)}</TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: p.currentStatus === 'Solved' || p.currentStatus === 'Solved optimally' ? 600 : 500,
                            color: p.currentStatus === 'Solved' || p.currentStatus === 'Solved optimally' ? '#065F46' : '#64748B',
                          }}
                        >
                          {p.currentStatus}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: '"IBM Plex Mono", monospace',
                            fontSize: '0.825rem',
                            color: activeBucket === 'overdue' ? '#DC2626' : '#171A2B',
                            fontWeight: activeBucket === 'overdue' ? 600 : 400,
                          }}
                        >
                          {p.nextRevisitDate || 'Unscheduled'}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title="Attempt with Blind Mode" arrow>
                          <Button
                            variant="contained"
                            size="small"
                            color={activeBucket === 'overdue' ? 'error' : 'primary'}
                            startIcon={<PlayArrowIcon sx={{ fontSize: 16 }} />}
                            onClick={() => navigate(`/problems/${p.id}/attempts`)}
                            sx={{
                              px: 2,
                              py: 0.6,
                              borderRadius: 2,
                              fontWeight: 600,
                              fontSize: '0.8rem',
                            }}
                          >
                            Attempt Now
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
