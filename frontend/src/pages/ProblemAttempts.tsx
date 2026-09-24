import { useState } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../api/useApiClient';
import type { Problem } from '../types/problem';
import type { Attempt, AttemptRequest } from '../types/attempt';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Switch,
  FormControlLabel,
  Collapse,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import CloseIcon from '@mui/icons-material/Close';

const CONFIDENCE_OPTIONS = [
  { value: 1, label: '1 — Unfamiliar' },
  { value: 2, label: '2 — Foggy' },
  { value: 3, label: '3 — Forming' },
  { value: 4, label: '4 — Clear' },
  { value: 5, label: '5 — Teachable' },
];

const LANGUAGES = ['Python', 'Java', 'C++', 'TypeScript', 'JavaScript', 'Go', 'Rust'];

const relativeTime = (iso?: string) => {
  if (!iso) return 'Never';
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

export default function ProblemAttempts() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetchApi = useApiClient();
  const queryClient = useQueryClient();

  const [blindMode, setBlindMode] = useState(true);
  const [showNewAttemptForm, setShowNewAttemptForm] = useState(false);
  const [revisitDate, setRevisitDate] = useState('');
  const [scheduleSuccess, setScheduleSuccess] = useState('');

  // New attempt form state
  const [newResult, setNewResult] = useState<'Solved' | 'Tried' | 'Could not solve'>('Solved');
  const [newConfidence, setNewConfidence] = useState<number>(4);
  const [newUnderstood, setNewUnderstood] = useState(true);
  const [newLogicFound, setNewLogicFound] = useState(true);
  const [newCodeCompleted, setNewCodeCompleted] = useState(true);
  const [newTimeTakenMin, setNewTimeTakenMin] = useState<number>(30);
  const [newLanguage, setNewLanguage] = useState('Python');
  const [newApproach, setNewApproach] = useState('');
  const [newMistakes, setNewMistakes] = useState('');

  // Fetch problem metadata
  const { data: problem, isLoading: isProblemLoading, isError: isProblemError } = useQuery<Problem>({
    queryKey: ['problem', id],
    queryFn: async () => {
      const res = await fetchApi(`/problems/${id}`);
      if (!res.ok) throw new Error('Problem not found');
      return res.json();
    },
  });

  // Fetch attempts list
  const { data: attempts = [], isLoading: isAttemptsLoading } = useQuery<Attempt[]>({
    queryKey: ['attempts', id],
    queryFn: async () => {
      const res = await fetchApi(`/problems/${id}/attempts`);
      if (!res.ok) throw new Error('Failed to load attempts');
      return res.json();
    },
  });

  // Create attempt mutation
  const attemptMutation = useMutation({
    mutationFn: async (payload: AttemptRequest) => {
      const res = await fetchApi(`/problems/${id}/attempts`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save attempt');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attempts', id] });
      queryClient.invalidateQueries({ queryKey: ['problem', id] });
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowNewAttemptForm(false);
      setNewApproach('');
      setNewMistakes('');
      setBlindMode(false); // Reveal so user can verify their new entry
    },
  });

  // Schedule revisit mutation
  const scheduleMutation = useMutation({
    mutationFn: async (dateStr: string) => {
      if (!problem) return;
      // We can update the problem's revisit date or send through attempt
      const res = await fetchApi(`/problems/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: problem.title,
          platform: problem.platform,
          url: problem.url,
          difficulty: problem.difficulty,
          primaryTopicId: problem.primaryTopicId,
          optimalTime: problem.optimalTime,
          optimalSpace: problem.optimalSpace,
          nextRevisitDate: dateStr,
        }),
      });
      if (!res.ok) throw new Error('Failed to set revisit date');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problem', id] });
      queryClient.invalidateQueries({ queryKey: ['problems'] });
      queryClient.invalidateQueries({ queryKey: ['revisitQueue'] });
      setScheduleSuccess(`Revisit scheduled for ${revisitDate}`);
      setTimeout(() => setScheduleSuccess(''), 3000);
    },
  });

  const handleSaveAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    attemptMutation.mutate({
      attemptedAt: new Date().toISOString(),
      result: newResult,
      understood: newUnderstood,
      logicFound: newLogicFound,
      codeCompleted: newCodeCompleted,
      timeTakenMin: Number(newTimeTakenMin) || 30,
      timeComplexity: problem?.optimalTime || 'O(n)',
      spaceComplexity: problem?.optimalSpace || 'O(1)',
      confidence: newConfidence,
      approach: newApproach.trim() || 'Logged attempt.',
      mistakes: newMistakes.trim(),
      code: '',
      language: newLanguage,
      mistakeTagIds: [],
    });
  };

  const handleQuickScheduleDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().slice(0, 10);
    setRevisitDate(dateStr);
    scheduleMutation.mutate(dateStr);
  };

  if (isProblemLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={36} sx={{ color: '#4F3FF0', mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading problem details...
        </Typography>
      </Container>
    );
  }

  if (isProblemError || !problem) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">Problem not found. It may have been deleted.</Alert>
        <Button component={RouterLink} to="/problems" sx={{ mt: 2 }}>
          Back to Problems
        </Button>
      </Container>
    );
  }

  const getDifficultyChip = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return <Chip label="Easy" size="small" sx={{ backgroundColor: '#DEF7EC', color: '#03543F', fontWeight: 600 }} />;
      case 'MEDIUM':
        return <Chip label="Medium" size="small" sx={{ backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 600 }} />;
      case 'HARD':
        return <Chip label="Hard" size="small" sx={{ backgroundColor: '#FDECEC', color: '#9B1C1C', fontWeight: 600 }} />;
      default:
        return <Chip label={diff} size="small" />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button */}
      <Button
        component={RouterLink}
        to="/problems"
        startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
        sx={{ color: '#64748B', mb: 2, pl: 0, '&:hover': { background: 'transparent', color: '#171A2B' } }}
      >
        Problem Library
      </Button>

      {/* Hero Header Card */}
      <Paper elevation={0} sx={{ p: 3.5, mb: 3, borderRadius: 3, border: '1px solid #E3E6EF' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 2.5,
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
                mb: 1.5,
              }}
            >
              {problem.title}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {getDifficultyChip(problem.difficulty)}
              <Chip
                label={problem.currentStatus || 'Not Attempted'}
                size="small"
                sx={{
                  backgroundColor:
                    problem.currentStatus === 'Solved' || problem.currentStatus === 'Solved optimally'
                      ? '#DEF7EC'
                      : '#F1F5F9',
                  color:
                    problem.currentStatus === 'Solved' || problem.currentStatus === 'Solved optimally'
                      ? '#03543F'
                      : '#475569',
                  fontWeight: 600,
                }}
              />
              <Chip
                label={problem.primaryTopicName || 'General'}
                size="small"
                sx={{ backgroundColor: '#EEEBFF', color: '#4F3FF0', fontWeight: 600 }}
              />
              {problem.platform && (
                <Chip label={problem.platform} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
              )}
              {problem.url && (
                <Button
                  component="a"
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                  sx={{
                    color: '#4F3FF0',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    p: 0,
                    ml: 1,
                    '&:hover': { background: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  Open on {problem.platform || 'source'}
                </Button>
              )}
            </Stack>
          </div>

          {/* Quick Action Buttons */}
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditOutlinedIcon />}
              onClick={() => navigate(`/problems/${id}/edit`)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Edit Details
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setShowNewAttemptForm(!showNewAttemptForm)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              {showNewAttemptForm ? 'Close Form' : 'New Attempt'}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Top 3 Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E3E6EF' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Attempt Count
            </Typography>
            <Typography variant="h4" sx={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, mt: 0.5 }}>
              {attempts.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last thought: {relativeTime(problem.lastSuccessfulAt)}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E3E6EF' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Target Complexity
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontWeight: 700,
                color: blindMode ? '#94A3B8' : '#171A2B',
                fontStyle: blindMode ? 'italic' : 'normal',
                mt: 0.5,
              }}
            >
              {blindMode ? 'Hidden in Blind Mode' : `${problem.optimalTime || 'O(n)'} time`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {blindMode ? 'Toggle blind mode to view' : `Space: ${problem.optimalSpace || 'O(1)'}`}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E3E6EF' }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Next Revisit
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontWeight: 700,
                color: problem.nextRevisitDate ? '#4F3FF0' : '#94A3B8',
                mt: 0.5,
              }}
            >
              {problem.nextRevisitDate || 'Unscheduled'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {problem.nextRevisitDate ? 'Retention review scheduled' : 'Pick a date in the sidebar'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Two-Column Layout */}
      <Grid container spacing={3}>
        {/* Left Column: Attempt Timeline & Form */}
        <Grid size={{ xs: 12, md: 7.5 }}>
          <Stack spacing={3}>
            {/* Inline New Attempt Form */}
            <Collapse in={showNewAttemptForm}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: 3,
                  border: '1.5px solid #4F3FF0',
                  backgroundColor: '#FBFBFF',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
                    Log New Practice Attempt
                  </Typography>
                  <IconButton size="small" onClick={() => setShowNewAttemptForm(false)}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>

                <Box component="form" onSubmit={handleSaveAttempt} noValidate>
                  <Stack spacing={2.5}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                          Result
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={newResult}
                            onChange={(e) => setNewResult(e.target.value as 'Solved' | 'Tried' | 'Could not solve')}
                          >
                            <MenuItem value="Solved">Solved</MenuItem>
                            <MenuItem value="Tried">Tried (Partial)</MenuItem>
                            <MenuItem value="Could not solve">Could not solve</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                          Confidence Level
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={newConfidence}
                            onChange={(e) => setNewConfidence(Number(e.target.value))}
                          >
                            {CONFIDENCE_OPTIONS.map((c) => (
                              <MenuItem key={c.value} value={c.value}>
                                {c.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                          Time Taken (minutes)
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          size="small"
                          value={newTimeTakenMin}
                          onChange={(e) => setNewTimeTakenMin(Number(e.target.value))}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                          Language
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                          >
                            {LANGUAGES.map((lang) => (
                              <MenuItem key={lang} value={lang}>
                                {lang}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    {/* Checkbox markers */}
                    <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={newUnderstood}
                            onChange={(e) => setNewUnderstood(e.target.checked)}
                            color="primary"
                          />
                        }
                        label={<Typography variant="body2">Understood question</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={newLogicFound}
                            onChange={(e) => setNewLogicFound(e.target.checked)}
                            color="primary"
                          />
                        }
                        label={<Typography variant="body2">Logic found independently</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={newCodeCompleted}
                            onChange={(e) => setNewCodeCompleted(e.target.checked)}
                            color="primary"
                          />
                        }
                        label={<Typography variant="body2">Code passed all cases</Typography>}
                      />
                    </Stack>

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                        Approach Reasoning *
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="What invariant or key observation guided you?"
                        value={newApproach}
                        onChange={(e) => setNewApproach(e.target.value)}
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                        Mistakes to Watch (Optional)
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Note any false start, off-by-one, or edge cases."
                        value={newMistakes}
                        onChange={(e) => setNewMistakes(e.target.value)}
                      />
                    </Box>

                    <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
                      <Button variant="outlined" onClick={() => setShowNewAttemptForm(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={attemptMutation.isPending}
                        sx={{ fontWeight: 600 }}
                      >
                        {attemptMutation.isPending ? 'Saving...' : 'Save Attempt'}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              </Paper>
            </Collapse>

            {/* Blind Mode Callout Banner */}
            {blindMode && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #BFDBFE',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <VisibilityOffOutlinedIcon sx={{ color: '#2563EB', fontSize: 26 }} />
                  <div>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E40AF' }}>
                      Blind Practice Mode Active
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#3B82F6' }}>
                      Notes and past mistakes are hidden to simulate true interview conditions.
                    </Typography>
                  </div>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setBlindMode(false)}
                  sx={{
                    color: '#2563EB',
                    borderColor: '#93C5FD',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    '&:hover': { borderColor: '#2563EB', background: 'rgba(37,99,235,0.04)' },
                  }}
                >
                  Reveal Notes
                </Button>
              </Paper>
            )}

            {/* Attempt Timeline Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
                  Attempt Timeline
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chronological record of how your understanding developed.
                </Typography>
              </div>

              {!showNewAttemptForm && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowNewAttemptForm(true)}
                  sx={{ fontWeight: 600 }}
                >
                  Log Attempt
                </Button>
              )}
            </Box>

            {/* Attempt Cards List */}
            {isAttemptsLoading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CircularProgress size={32} />
              </Box>
            ) : attempts.length === 0 ? (
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
                  No attempts recorded yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
                  Log your first attempt above to track your reasoning, false starts, and time complexity.
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowNewAttemptForm(true)}>
                  Log First Attempt
                </Button>
              </Paper>
            ) : blindMode ? (
              /* Blind Mode Hidden View */
              <Paper
                elevation={0}
                sx={{
                  py: 8,
                  px: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  border: '1px solid #E3E6EF',
                  backgroundColor: '#FAFBFC',
                }}
              >
                <PsychologyAltIcon sx={{ fontSize: 36, color: '#4F3FF0', mb: 1.5 }} />
                <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700, mb: 1 }}>
                  {attempts.length} Previous {attempts.length === 1 ? 'Attempt' : 'Attempts'} Logged
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mb: 3 }}>
                  Try solving the problem right now on your IDE or editor before checking your past approach.
                </Typography>
                <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center' }}>
                  <Button variant="contained" onClick={() => setShowNewAttemptForm(true)}>
                    Log New Pass
                  </Button>
                  <Button variant="outlined" onClick={() => setBlindMode(false)}>
                    Show Previous Notes
                  </Button>
                </Stack>
              </Paper>
            ) : (
              /* Full Attempt Cards */
              <Stack spacing={2}>
                {attempts.map((a, idx) => (
                  <Paper
                    key={a.id}
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid #E3E6EF',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <div>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                          <Chip
                            label={a.result}
                            size="small"
                            sx={{
                              backgroundColor:
                                a.result === 'Solved' ? '#DEF7EC' : a.result === 'Tried' ? '#FEF3C7' : '#FDECEC',
                              color:
                                a.result === 'Solved' ? '#03543F' : a.result === 'Tried' ? '#92400E' : '#9B1C1C',
                              fontWeight: 700,
                            }}
                          />
                          <Chip
                            label={`${a.confidence || 3}/5 confidence`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.725rem' }}
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Attempt #{attempts.length - idx} • {new Date(a.attemptedAt).toLocaleDateString()} •{' '}
                          {a.timeTakenMin || 30} mins • {a.language || 'Python'}
                        </Typography>
                      </div>
                    </Box>

                    {/* Breakdown metrics */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #F1F5F9',
                        mb: 2,
                      }}
                    >
                      <div>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                          Logic Found
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: a.logicFound ? '#0E9F6E' : '#64748B' }}>
                          {a.logicFound ? 'Yes' : 'Not yet'}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                          Code Complete
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: a.codeCompleted ? '#0E9F6E' : '#64748B' }}>
                          {a.codeCompleted ? 'Yes' : 'Partial'}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                          Time
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600 }}>
                          {a.timeComplexity || 'O(n)'}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem' }}>
                          Space
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600 }}>
                          {a.spaceComplexity || 'O(1)'}
                        </Typography>
                      </div>
                    </Box>

                    {/* Approach */}
                    {a.approach && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mb: 0.5 }}>
                          Approach
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#171A2B', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                          {a.approach}
                        </Typography>
                      </Box>
                    )}

                    {/* Mistakes to watch */}
                    {a.mistakes && (
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: '#FEF3C7',
                          border: '1px solid #FDE68A',
                          mt: 1.5,
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400E', display: 'block' }}>
                          Mistake to Watch:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#78350F', fontSize: '0.85rem', mt: 0.25 }}>
                          {a.mistakes}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </Grid>

        {/* Right Column: Revisit & Settings Sidebar */}
        <Grid size={{ xs: 12, md: 4.5 }}>
          <Stack spacing={3} sx={{ position: { md: 'sticky' }, top: 84 }}>
            {/* Revisit Scheduler Widget */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E3E6EF' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <RotateRightIcon sx={{ color: '#4F3FF0' }} />
                <Typography variant="h6" sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
                  Revisit this Problem
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Put this problem back on your queue to test retention when the pattern is ready to stick.
              </Typography>

              {scheduleSuccess && (
                <Alert severity="success" sx={{ mb: 2, py: 0.5 }}>
                  {scheduleSuccess}
                </Alert>
              )}

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                    Select Target Date
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    value={revisitDate || problem.nextRevisitDate || ''}
                    onChange={(e) => setRevisitDate(e.target.value)}
                  />
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => handleQuickScheduleDays(1)}
                    sx={{ fontWeight: 600 }}
                  >
                    Tomorrow
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => handleQuickScheduleDays(7)}
                    sx={{ fontWeight: 600 }}
                  >
                    In a week
                  </Button>
                </Stack>

                <Button
                  variant="contained"
                  fullWidth
                  disabled={!revisitDate || scheduleMutation.isPending}
                  onClick={() => scheduleMutation.mutate(revisitDate)}
                  sx={{ fontWeight: 600, mt: 1 }}
                >
                  {scheduleMutation.isPending ? 'Scheduling...' : 'Confirm Revisit Date'}
                </Button>
              </Stack>
            </Paper>

            {/* Blind Mode Toggle Card */}
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E3E6EF' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#171A2B' }}>
                    Blind Interview Mode
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hides target complexity and past attempt notes.
                  </Typography>
                </div>
                <Switch
                  checked={blindMode}
                  onChange={(e) => setBlindMode(e.target.checked)}
                  color="primary"
                />
              </Box>
            </Paper>

            {/* Study Philosophy Callout */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
                💡 Pattern Note
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.6, display: 'block' }}>
                The goal is not to remember the code. It is to recognize the decision that makes the answer inevitable.
              </Typography>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
