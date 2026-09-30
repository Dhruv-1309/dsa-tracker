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

export interface ProblemListProps {
  initialProblems?: Problem[];
  readOnly?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  friendUserId?: string;
}

export default function ProblemList({
  initialProblems,
  readOnly = false,
  headerTitle,
  headerSubtitle,
  friendUserId,
}: ProblemListProps = {}) {
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

  const { data: fetchedProblems = [], isLoading: isQueryLoading, isFetching: isQueryFetching, error } = useQuery<Problem[]>({
    queryKey: ['problems', deferredSearch, deferredTopic, status],
    queryFn: async () => {
      const res = await fetchApi(`/problems?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch problems');
      return res.json();
    },
    placeholderData: (previousData) => previousData,
    enabled: !initialProblems,
  });

  const problems = initialProblems ?? fetchedProblems;
  const isLoading = !initialProblems && isQueryLoading;
  const isFetching = !initialProblems && isQueryFetching;

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

const COLOR_TOKENS = {
  ink: '#171A2B',        // Primary text, titles, headings
  slate: '#475569',      // Secondary labels, topic chips
  muted: '#475569',      // Captions, table headers, reset actions (WCAG AA compliant)
  subtle: '#64748B',     // Input icons, subtle labels
  accent: '#4F3FF0',     // Primary brand links & buttons
  accentHover: '#3E30D6',
  success: '#047857',    // Consolidated green: Easy badge, Solved status, Solved date
  warning: '#92400E',    // Consolidated amber: Medium badge, Tried status
  danger: '#991B1B',     // Consolidated red: Hard badge, Delete hover
  purple: '#5B21B6',     // Consolidated purple: Could not solve status
};

const RADIUS = {
  container: 2, // 16px for Papers and TableContainers
  control: 1.5, // 12px for Buttons and Alerts
  sm: 1,        // 8px for Inputs
};

const filterControlSx = {
  '& .MuiOutlinedInput-root': {
    height: 40,
    borderRadius: RADIUS.control,
  },
};

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
              color: COLOR_TOKENS.success,
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
              color: COLOR_TOKENS.warning,
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
              color: COLOR_TOKENS.danger,
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
    const dotColor = isSolved
      ? '#10B981'
      : st === 'Tried'
      ? '#F59E0B'
      : st === 'Could not solve'
      ? '#8B7FF5'
      : COLOR_TOKENS.subtle;

    const textColor = isSolved
      ? COLOR_TOKENS.success
      : st === 'Tried'
      ? COLOR_TOKENS.warning
      : st === 'Could not solve'
      ? COLOR_TOKENS.purple
      : COLOR_TOKENS.slate;

    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: dotColor,
          }}
        />
        <Typography
          variant="body2"
          sx={{
            fontWeight: isSolved || st === 'Tried' ? 600 : 500,
            color: textColor,
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
            {headerTitle || 'Problems Directory'}
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {headerSubtitle || 'Manage your logged algorithmic challenges and review intervals.'}
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
      </Box>

      {/* Filter Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: RADIUS.container,
          border: '1px solid #E3E6EF',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '2fr 1.2fr 1fr 1.2fr',
            },
            gap: 2,
            alignItems: 'center',
            width: '100%',
          }}
        >
          <TextField
            placeholder="Search problems by name or keyword..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateFilterParam('search', e.target.value);
            }}
            size="small"
            fullWidth
            sx={filterControlSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: COLOR_TOKENS.subtle }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear search"
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
            fullWidth
            sx={filterControlSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon sx={{ color: COLOR_TOKENS.subtle, fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: topic ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="Clear topic filter"
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

          <FormControl size="small" fullWidth sx={filterControlSx}>
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

          <FormControl size="small" fullWidth sx={filterControlSx}>
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
        </Box>

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
        <Alert severity="error" sx={{ borderRadius: RADIUS.control }}>
          Error loading problems. Please refresh the page.
        </Alert>
      ) : sortedProblems.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 3,
            textAlign: 'center',
            borderRadius: RADIUS.container,
            border: '1.5px dashed #E3E6EF',
            backgroundColor: '#FAFBFC',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, mb: 1, color: COLOR_TOKENS.ink }}
          >
            {hasActiveFilters
              ? 'No matching problems found'
              : readOnly
              ? 'No solved problems logged yet'
              : 'No problems logged yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 3 }}>
            {hasActiveFilters
              ? 'Try modifying or clearing your search filters to view your problem collection.'
              : readOnly
              ? 'Your friend has not logged any solved problems yet.'
              : 'Add your first algorithm problem to schedule automated spaced-repetition revisits.'}
          </Typography>
          {hasActiveFilters ? (
            <Button variant="outlined" onClick={resetFilters} sx={{ borderRadius: RADIUS.control }}>
              Clear All Filters
            </Button>
          ) : !readOnly ? (
            <Button
              component={RouterLink}
              to="/problems/new"
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ borderRadius: RADIUS.control }}
            >
              Log First Problem
            </Button>
          ) : null}
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: RADIUS.container,
            border: '1px solid #E3E6EF',
            overflowX: 'auto',
            maxHeight: 'calc(100vh - 200px)',
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
                zIndex: 3,
                backgroundColor: 'transparent',
                '& .MuiLinearProgress-bar': { backgroundColor: COLOR_TOKENS.accent },
              }}
            />
          )}
          <Table stickyHeader sx={{ minWidth: 720, '& .MuiTableCell-stickyHeader': { backgroundColor: '#FFFFFF', zIndex: 2 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '33%', fontWeight: 600, color: COLOR_TOKENS.muted }}>Problem Title</TableCell>
                <TableCell sx={{ width: '13%', fontWeight: 600, color: COLOR_TOKENS.muted }}>Topic</TableCell>
                <TableCell sx={{ width: '11%', fontWeight: 600, color: COLOR_TOKENS.muted }}>Difficulty</TableCell>
                <TableCell sx={{ width: '14%', fontWeight: 600, color: COLOR_TOKENS.muted }}>Status</TableCell>
                <TableCell sx={{ width: '13%', fontWeight: 600, color: COLOR_TOKENS.muted }}>Date</TableCell>
                {!readOnly && <TableCell sx={{ width: '16%', fontWeight: 600, color: COLOR_TOKENS.muted }}>Next Revisit</TableCell>}
                {!readOnly && <TableCell align="right" sx={{ width: 'auto', fontWeight: 600, color: COLOR_TOKENS.muted }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProblems.map((p) => (
                <TableRow
                  key={p.id}
                  hover
                  sx={{
                    transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                    '&:hover': {
                      backgroundColor: '#F8FAFC !important',
                      boxShadow: `inset 3px 0 0 ${COLOR_TOKENS.accent}`,
                    },
                  }}
                >
                  {/* Title & Platform */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {readOnly && !friendUserId ? (
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: COLOR_TOKENS.ink,
                            fontSize: '0.925rem',
                          }}
                        >
                          {p.title}
                        </Typography>
                      ) : (
                        <Link
                          component={RouterLink}
                          to={friendUserId ? `/friends/${friendUserId}/problems/${p.id}` : `/problems/${p.id}/attempts`}
                          sx={{
                            fontWeight: 600,
                            color: COLOR_TOKENS.ink,
                            textDecoration: 'none',
                            fontSize: '0.925rem',
                            '&:hover': {
                              color: COLOR_TOKENS.accent,
                              textDecoration: 'underline',
                            },
                          }}
                        >
                          {p.title}
                        </Link>
                      )}
                      {sanitizeUrl(p.url) && (
                        <Tooltip title="Open problem on platform" arrow>
                          <IconButton
                            size="small"
                            component="a"
                            href={sanitizeUrl(p.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${p.title} on platform`}
                            sx={{ color: COLOR_TOKENS.subtle, p: 0.5, '&:hover': { color: COLOR_TOKENS.accent } }}
                          >
                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    {p.platform && (
                      <Typography variant="caption" sx={{ color: COLOR_TOKENS.subtle, display: 'block', mt: 0.25 }}>
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
                        color: COLOR_TOKENS.slate,
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  </TableCell>

                  {/* Difficulty */}
                  <TableCell>{getDifficultyChip(p.difficulty)}</TableCell>

                  {/* Status */}
                  <TableCell>{getStatusChip(p.currentStatus)}</TableCell>

                  {/* Date (Clean single line, no redundant status subtext) */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: '"IBM Plex Mono", monospace',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        color: COLOR_TOKENS.slate,
                      }}
                    >
                      {new Date(p.lastSuccessfulAt || p.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Typography>
                  </TableCell>

                  {/* Next Revisit (Accessible contrast and weight) */}
                  {!readOnly && (
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: '"IBM Plex Mono", monospace',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: p.nextRevisitDate ? COLOR_TOKENS.ink : COLOR_TOKENS.muted,
                        }}
                      >
                        {p.nextRevisitDate || 'Unscheduled'}
                      </Typography>
                    </TableCell>
                  )}

                  {/* Actions (Solid primary CTA, subtle secondary icons) */}
                  {!readOnly && (
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                        <Tooltip title="Attempt Problem (Blind Mode)" arrow>
                          <Button
                            size="small"
                            variant="contained"
                            disableElevation
                            startIcon={<PlayArrowOutlinedIcon sx={{ fontSize: 15 }} />}
                            onClick={() => navigate(`/problems/${p.id}/attempts`)}
                            aria-label={`Attempt ${p.title} in blind mode`}
                            sx={{
                              px: 1.5,
                              py: 0.45,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              borderRadius: RADIUS.control,
                              backgroundColor: COLOR_TOKENS.accent,
                              color: '#FFFFFF',
                              textTransform: 'none',
                              boxShadow: 'none',
                              '&:hover': {
                                backgroundColor: COLOR_TOKENS.accentHover,
                                boxShadow: 'none',
                              },
                            }}
                          >
                            Attempt
                          </Button>
                        </Tooltip>

                        <Tooltip title="Edit Problem Details" arrow>
                          <IconButton
                            size="small"
                            aria-label={`Edit ${p.title}`}
                            onClick={() => navigate(`/problems/${p.id}/edit`)}
                            sx={{ color: COLOR_TOKENS.muted, '&:hover': { color: COLOR_TOKENS.accent } }}
                          >
                            <EditOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Problem" arrow>
                          <IconButton
                            size="small"
                            aria-label={`Delete ${p.title}`}
                            onClick={() => handleDelete(p.id, p.title)}
                            disabled={deleteMutation.isPending}
                            sx={{ color: COLOR_TOKENS.muted, '&:hover': { color: COLOR_TOKENS.danger } }}
                          >
                            <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
