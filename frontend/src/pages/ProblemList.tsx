import { useState, useMemo, useDeferredValue, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useApiClient } from '../api/useApiClient';
import type { Problem } from '../types/problem';
import { sanitizeUrl } from '../utils/security';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Link,
  CircularProgress,
  LinearProgress,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';

export default function ProblemList() {
  const fetchApi = useApiClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || '';
  const urlTopic = searchParams.get('topic') || '';
  const urlStatus = searchParams.get('status') || '';
  const urlSort = searchParams.get('sort') || 'date_desc';

  const [search, setSearch] = useState(urlSearch);
  const [topic, setTopic] = useState(urlTopic);
  const [status, setStatus] = useState(urlStatus);
  const [sortBy, setSortBy] = useState(urlSort);

  // Sync state if URL search parameters change (e.g. navigation from Topics page or browser back/forward)
  useEffect(() => {
    setTopic(searchParams.get('topic') || '');
    setStatus(searchParams.get('status') || '');
    setSearch(searchParams.get('search') || '');
    setSortBy(searchParams.get('sort') || 'date_desc');
  }, [searchParams]);

  const updateFilterParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const deferredSearch = useDeferredValue(search);
  const deferredTopic = useDeferredValue(topic);

  const queryParams = new URLSearchParams();
  if (deferredSearch) queryParams.append('search', deferredSearch);
  if (deferredTopic) queryParams.append('topic', deferredTopic);
  if (status) queryParams.append('status', status);
  queryParams.append('sort', 'createdAt,desc');

  const { data: problems = [], isLoading, isFetching, error } = useQuery<Problem[]>({
    queryKey: ['problems', deferredSearch, deferredTopic, status],
    queryFn: async () => {
      const res = await fetchApi(`/problems?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch problems');
      return res.json();
    },
    placeholderData: (previousData) => previousData,
  });

  const filteredProblems = useMemo(() => {
    let list = [...problems];
    if (deferredTopic && deferredTopic.trim()) {
      const topicLower = deferredTopic.trim().toLowerCase();
      list = list.filter((p) => {
        const primaryMatch = p.primaryTopicName?.toLowerCase() === topicLower ||
                             p.primaryTopicName?.toLowerCase().includes(topicLower);
        const extraMatch = p.extraTopicNames?.some((t) =>
          t.toLowerCase() === topicLower || t.toLowerCase().includes(topicLower)
        );
        return primaryMatch || extraMatch;
      });
    }
    if (deferredSearch && deferredSearch.trim()) {
      const searchLower = deferredSearch.trim().toLowerCase();
      list = list.filter((p) =>
        p.title?.toLowerCase().includes(searchLower) ||
        p.platform?.toLowerCase().includes(searchLower)
      );
    }
    if (status) {
      list = list.filter((p) => p.currentStatus === status);
    }
    return list;
  }, [problems, deferredTopic, deferredSearch, status]);

  const sortedProblems = useMemo(() => {
    const list = [...filteredProblems];
    list.sort((a, b) => {
      const timeA = new Date(a.lastSuccessfulAt || a.createdAt).getTime();
      const timeB = new Date(b.lastSuccessfulAt || b.createdAt).getTime();

      if (sortBy === 'date_asc') {
        return timeA - timeB;
      }
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'difficulty') {
        const diffWeight: Record<string, number> = { HARD: 3, MEDIUM: 2, EASY: 1 };
        return (diffWeight[b.difficulty] || 0) - (diffWeight[a.difficulty] || 0);
      }
      // Default: date_desc (newest first)
      if (timeB !== timeA) return timeB - timeA;
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [filteredProblems, sortBy]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchApi(`/problems/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete problem');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] });
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const getDifficultyChip = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return (
          <Chip
            label="Easy"
            size="small"
            sx={{
              backgroundColor: '#DEF7EC',
              color: '#03543F',
              fontWeight: 600,
              fontSize: '0.75rem',
              border: '1px solid #BCF0DA',
            }}
          />
        );
      case 'MEDIUM':
        return (
          <Chip
            label="Medium"
            size="small"
            sx={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              fontWeight: 600,
              fontSize: '0.75rem',
              border: '1px solid #FDE68A',
            }}
          />
        );
      case 'HARD':
        return (
          <Chip
            label="Hard"
            size="small"
            sx={{
              backgroundColor: '#FDECEC',
              color: '#9B1C1C',
              fontWeight: 600,
              fontSize: '0.75rem',
              border: '1px solid #F8B4B4',
            }}
          />
        );
      default:
        return <Chip label={diff || '-'} size="small" variant="outlined" />;
    }
  };

  const getStatusChip = (st: string) => {
    const isSolved = st === 'Solved' || st === 'Solved optimally';
    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: isSolved ? '#10B981' : st === 'Tried' ? '#F59E0B' : '#94A3B8',
          }}
        />
        <Typography
          variant="body2"
          sx={{
            fontWeight: isSolved ? 600 : 500,
            color: isSolved ? '#065F46' : '#475569',
            fontSize: '0.85rem',
          }}
        >
          {st || 'Not Attempted'}
        </Typography>
      </Box>
    );
  };

  const hasActiveFilters = Boolean(search || topic || status || sortBy !== 'date_desc');

  const resetFilters = () => {
    setSearch('');
    setTopic('');
    setStatus('');
    setSortBy('date_desc');
    setSearchParams({}, { replace: true });
  };

  // Quick summary counts
  const solvedCount = useMemo(() => {
    return sortedProblems.filter((p) => p.currentStatus === 'Solved' || p.currentStatus === 'Solved optimally').length;
  }, [sortedProblems]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
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
            Problems Directory
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Manage your logged algorithmic challenges and review intervals.
            </Typography>
            <Chip
              label={`${sortedProblems.length} total`}
              size="small"
              sx={{ backgroundColor: '#F1F5F9', fontWeight: 600, color: '#475569' }}
            />
            {solvedCount > 0 && (
              <Chip
                icon={<CheckCircleOutlinedIcon sx={{ fontSize: '0.9rem !important', color: '#047857 !important' }} />}
                label={`${solvedCount} solved`}
                size="small"
                sx={{ backgroundColor: '#DEF7EC', fontWeight: 600, color: '#047857' }}
              />
            )}
          </Stack>
        </div>

        <Button
          component={RouterLink}
          to="/problems/new"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            px: 2.5,
            py: 1,
            fontWeight: 600,
            borderRadius: 2.5,
            alignSelf: { xs: 'stretch', sm: 'auto' },
          }}
        >
          Add Problem
        </Button>
      </Box>

      {/* Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          border: '1px solid #E3E6EF',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            placeholder="Search problems by name or keyword..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateFilterParam('search', e.target.value);
            }}
            size="small"
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearch('');
                        updateFilterParam('search', '');
                      }}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          <TextField
            placeholder="Filter by topic (e.g. DP)"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              updateFilterParam('topic', e.target.value);
            }}
            size="small"
            sx={{ width: { xs: '100%', md: 220 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon sx={{ color: '#94A3B8', fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: topic ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setTopic('');
                        updateFilterParam('topic', '');
                      }}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          <FormControl size="small" sx={{ width: { xs: '100%', md: 190 } }}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              value={status}
              label="Status"
              onChange={(e) => {
                setStatus(e.target.value);
                updateFilterParam('status', e.target.value);
              }}
            >
              <MenuItem value="">
                <em>All Statuses</em>
              </MenuItem>
              <MenuItem value="Not Attempted">Not Attempted</MenuItem>
              <MenuItem value="Tried">Tried</MenuItem>
              <MenuItem value="Could not solve">Could not solve</MenuItem>
              <MenuItem value="Solved">Solved</MenuItem>
              <MenuItem value="Solved optimally">Solved optimally</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: { xs: '100%', md: 210 } }}>
            <InputLabel id="sort-label">Sort By</InputLabel>
            <Select
              labelId="sort-label"
              value={sortBy}
              label="Sort By"
              onChange={(e) => {
                const val = e.target.value;
                setSortBy(val);
                updateFilterParam('sort', val === 'date_desc' ? '' : val);
              }}
            >
              <MenuItem value="date_desc">Date (Newest first)</MenuItem>
              <MenuItem value="date_asc">Date (Oldest first)</MenuItem>
              <MenuItem value="title_asc">Title (A to Z)</MenuItem>
              <MenuItem value="difficulty">Difficulty (Hard to Easy)</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {hasActiveFilters && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              mt: 2,
              pt: 1.5,
              borderTop: '1px solid #F1F5F9',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
              Active Filters:
            </Typography>
            {topic && (
              <Chip
                label={`Topic: ${topic}`}
                size="small"
                onDelete={() => {
                  setTopic('');
                  updateFilterParam('topic', '');
                }}
                sx={{
                  backgroundColor: '#EEEBFF',
                  color: '#4F3FF0',
                  fontWeight: 600,
                  '& .MuiChip-deleteIcon': { color: '#7062F8' },
                }}
              />
            )}
            {status && (
              <Chip
                label={`Status: ${status}`}
                size="small"
                onDelete={() => {
                  setStatus('');
                  updateFilterParam('status', '');
                }}
                sx={{ fontWeight: 600 }}
              />
            )}
            {search && (
              <Chip
                label={`Search: "${search}"`}
                size="small"
                onDelete={() => {
                  setSearch('');
                  updateFilterParam('search', '');
                }}
                sx={{ fontWeight: 600 }}
              />
            )}
            {sortBy !== 'date_desc' && (
              <Chip
                label={`Sort: ${
                  sortBy === 'date_asc'
                    ? 'Oldest first'
                    : sortBy === 'title_asc'
                    ? 'A-Z'
                    : 'Difficulty'
                }`}
                size="small"
                onDelete={() => {
                  setSortBy('date_desc');
                  updateFilterParam('sort', '');
                }}
                sx={{ fontWeight: 600 }}
              />
            )}
            <Button
              variant="text"
              color="inherit"
              size="small"
              onClick={resetFilters}
              sx={{ whiteSpace: 'nowrap', color: '#64748B', fontSize: '0.75rem', p: 0.5 }}
            >
              Reset All
            </Button>
          </Stack>
        )}
      </Paper>

      {/* Table Content */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12 }}>
          <CircularProgress size={36} sx={{ color: '#4F3FF0', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading problem collection...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Error loading problems. Please refresh the page.
        </Alert>
      ) : sortedProblems.length === 0 ? (
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
          <Typography
            variant="h6"
            sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 1, color: '#171A2B' }}
          >
            {hasActiveFilters ? 'No matching problems found' : 'No problems logged yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 3 }}>
            {hasActiveFilters
              ? 'Try modifying or clearing your search filters to view your problem collection.'
              : 'Add your first algorithm problem to schedule automated spaced-repetition revisits.'}
          </Typography>
          {hasActiveFilters ? (
            <Button variant="outlined" onClick={resetFilters}>
              Clear All Filters
            </Button>
          ) : (
            <Button
              component={RouterLink}
              to="/problems/new"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ borderRadius: 2.5 }}
            >
              Log First Problem
            </Button>
          )}
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid #E3E6EF',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {isFetching && !isLoading && (
            <LinearProgress
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                zIndex: 2,
                backgroundColor: 'transparent',
                '& .MuiLinearProgress-bar': { backgroundColor: '#4F3FF0' },
              }}
            />
          )}
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Problem Title</TableCell>
                <TableCell>Topic</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Next Revisit</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProblems.map((p) => (
                <TableRow
                  key={p.id}
                  hover
                  sx={{
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                      backgroundColor: '#F8FAFC !important',
                    },
                  }}
                >
                  {/* Title & Platform */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Link
                        component={RouterLink}
                        to={`/problems/${p.id}/attempts`}
                        sx={{
                          fontWeight: 600,
                          color: '#171A2B',
                          textDecoration: 'none',
                          fontSize: '0.925rem',
                          '&:hover': {
                            color: '#4F3FF0',
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {p.title}
                      </Link>
                      {sanitizeUrl(p.url) && (
                        <Tooltip title="Open problem on platform" arrow>
                          <IconButton
                            size="small"
                            component="a"
                            href={sanitizeUrl(p.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: '#94A3B8', p: 0.5, '&:hover': { color: '#4F3FF0' } }}
                          >
                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    {p.platform && (
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.25 }}>
                        {p.platform}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Primary Topic */}
                  <TableCell>
                    <Chip
                      label={p.primaryTopicName || 'General'}
                      size="small"
                      sx={{
                        backgroundColor: '#F1F5F9',
                        color: '#334155',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>

                  {/* Difficulty */}
                  <TableCell>{getDifficultyChip(p.difficulty)}</TableCell>

                  {/* Status */}
                  <TableCell>{getStatusChip(p.currentStatus)}</TableCell>

                  {/* Date (Solved or Logged) */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: p.lastSuccessfulAt ? '#047857' : '#475569',
                      }}
                    >
                      {p.lastSuccessfulAt
                        ? new Date(p.lastSuccessfulAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : new Date(p.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem' }}>
                      {p.lastSuccessfulAt ? 'Solved' : 'Logged'}
                    </Typography>
                  </TableCell>

                  {/* Next Revisit */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: '0.8rem',
                        color: p.nextRevisitDate ? '#171A2B' : '#94A3B8',
                      }}
                    >
                      {p.nextRevisitDate || 'Unscheduled'}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      <Tooltip title="Attempt Problem (Blind Mode)" arrow>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<PlayArrowOutlinedIcon sx={{ fontSize: 16 }} />}
                          onClick={() => navigate(`/problems/${p.id}/attempts`)}
                          sx={{
                            px: 1.5,
                            py: 0.4,
                            fontSize: '0.775rem',
                            fontWeight: 600,
                            borderRadius: 2,
                          }}
                        >
                          Attempt
                        </Button>
                      </Tooltip>

                      <Tooltip title="Edit Problem Details" arrow>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/problems/${p.id}/edit`)}
                          sx={{ color: '#64748B', '&:hover': { color: '#4F3FF0' } }}
                        >
                          <EditOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete Problem" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(p.id, p.title)}
                          disabled={deleteMutation.isPending}
                          sx={{ color: '#64748B', '&:hover': { color: '#DC2626' } }}
                        >
                          <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
