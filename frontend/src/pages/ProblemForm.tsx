import { useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '../api/useApiClient';
import type { Problem, ProblemRequest } from '../types/problem';
import type { Topic } from '../types/topic';
import type { AttemptRequest } from '../types/attempt';
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
  InputAdornment,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SparklesIcon from '@mui/icons-material/AutoAwesome';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';

const PLATFORMS = ['LeetCode', 'NeetCode', 'Codeforces', 'HackerRank', 'CodeChef', 'Other'];
const LANGUAGES = ['Python', 'Java', 'C++', 'TypeScript', 'JavaScript', 'Go', 'Rust'];
const CONFIDENCE_OPTIONS = [
  { value: 1, label: '1 — Unfamiliar (needed full editorial)' },
  { value: 2, label: '2 — Foggy (vague intuition, many hints)' },
  { value: 3, label: '3 — Forming (understood core idea with effort)' },
  { value: 4, label: '4 — Clear (solved with minor guidance)' },
  { value: 5, label: '5 — Teachable (solved independently & optimally)' },
];

export default function ProblemForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fetchApi = useApiClient();
  const queryClient = useQueryClient();

  // Problem metadata
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('LeetCode');
  const [url, setUrl] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [primaryTopicId, setPrimaryTopicId] = useState('');
  const [extraTopicsText, setExtraTopicsText] = useState('');
  const [optimalTime, setOptimalTime] = useState('O(n)');
  const [optimalSpace, setOptimalSpace] = useState('O(1)');

  // Attempt state (for new problem pass)
  const logFirstAttempt = true;
  const [result, setResult] = useState<'Solved' | 'Tried' | 'Could not solve'>('Solved');
  const [confidence, setConfidence] = useState<number>(4);
  const [timeTakenMin, setTimeTakenMin] = useState<number>(30);
  const [language, setLanguage] = useState('Python');
  const [approach, setApproach] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [mistakeTagsText, setMistakeTagsText] = useState('');
  const [nextRevisitDate, setNextRevisitDate] = useState('');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch topics
  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: async () => {
      const res = await fetchApi('/topics');
      if (!res.ok) throw new Error('Failed to fetch topics');
      return res.json();
    },
  });

  // Fetch problem details if edit mode
  const { isLoading: isProblemLoading } = useQuery({
    queryKey: ['problem', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetchApi(`/problems/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data: Problem = await res.json();
      setTitle(data.title);
      setPlatform(data.platform || 'LeetCode');
      setUrl(data.url || '');
      setDifficulty(data.difficulty || 'MEDIUM');
      setPrimaryTopicId(data.primaryTopicId || '');
      setOptimalTime(data.optimalTime || 'O(n)');
      setOptimalSpace(data.optimalSpace || 'O(1)');
      if (data.extraTopicNames) {
        setExtraTopicsText(data.extraTopicNames.join(', '));
      }
      return data;
    },
    enabled: isEdit,
  });

  // Quick preset revisit helper
  const setQuickRevisitDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setNextRevisitDate(d.toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a problem title.');
      return;
    }

    if (!primaryTopicId && topics.length > 0) {
      setFormError('Please select a primary topic.');
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        // Edit mode: update problem metadata
        const updatePayload: ProblemRequest = {
          title: title.trim(),
          platform,
          url: url.trim(),
          difficulty,
          primaryTopicId: primaryTopicId || topics[0]?.id || '',
          optimalTime: optimalTime.trim(),
          optimalSpace: optimalSpace.trim(),
        };

        const res = await fetchApi(`/problems/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updatePayload),
        });

        if (!res.ok) throw new Error('Failed to update problem.');
        queryClient.invalidateQueries({ queryKey: ['problems'] });
        queryClient.invalidateQueries({ queryKey: ['problem', id] });
        navigate(`/problems/${id}/attempts`);
      } else {
        // Create mode: create problem, then optionally log initial attempt
        const createPayload: ProblemRequest = {
          title: title.trim(),
          platform,
          url: url.trim(),
          difficulty,
          primaryTopicId: primaryTopicId || topics[0]?.id || '',
          optimalTime: optimalTime.trim(),
          optimalSpace: optimalSpace.trim(),
        };

        const res = await fetchApi('/problems', {
          method: 'POST',
          body: JSON.stringify(createPayload),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || 'Failed to create problem.');
        }

        const createdProblem: Problem = await res.json();

        // If user logged attempt reasoning
        if (logFirstAttempt && (approach.trim() || mistakes.trim() || result)) {
          const attemptPayload: AttemptRequest = {
            attemptedAt: new Date().toISOString(),
            result,
            understood: result !== 'Could not solve',
            logicFound: result === 'Solved',
            codeCompleted: result === 'Solved',
            timeTakenMin: Number(timeTakenMin) || 30,
            timeComplexity: optimalTime.trim() || 'O(n)',
            spaceComplexity: optimalSpace.trim() || 'O(1)',
            confidence,
            approach: approach.trim() || 'First pass completed.',
            mistakes: mistakes.trim(),
            code: '',
            language,
            mistakeTagIds: [],
            nextRevisitDate: nextRevisitDate || undefined,
          };

          await fetchApi(`/problems/${createdProblem.id}/attempts`, {
            method: 'POST',
            body: JSON.stringify(attemptPayload),
          });
        }

        queryClient.invalidateQueries({ queryKey: ['problems'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        navigate(`/problems/${createdProblem.id}/attempts`);
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && isProblemLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={36} sx={{ color: '#4F3FF0', mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading problem details...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Top Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          component={RouterLink}
          to="/problems"
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          sx={{ color: '#64748B', mb: 1, pl: 0, '&:hover': { background: 'transparent', color: '#171A2B' } }}
        >
          Back to Problem Library
        </Button>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            color: '#171A2B',
            letterSpacing: '-0.02em',
          }}
        >
          {isEdit ? 'Edit Problem Details' : 'Capture the First Pass'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {isEdit
            ? 'Update target complexity and core metadata for this problem.'
            : 'A useful log keeps the shape of your thinking visible, including the part that went wrong.'}
        </Typography>
      </Box>

      {formError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }}>
          {formError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          {/* Main Left Column: Problem Context & First Attempt */}
          <Grid size={{ xs: 12, md: 7.5 }}>
            <Stack spacing={3}>
              {/* Section 1: Problem Context */}
              <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #E3E6EF' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 700,
                    color: '#171A2B',
                    mb: 2.5,
                  }}
                >
                  Problem Context
                </Typography>

                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                      Problem Title *
                    </Typography>
                    <TextField
                      required
                      fullWidth
                      placeholder="e.g. Longest Increasing Subsequence"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      size="small"
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                        Platform
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={platform}
                          onChange={(e) => setPlatform(e.target.value)}
                        >
                          {PLATFORMS.map((p) => (
                            <MenuItem key={p} value={p}>
                              {p}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 7 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                        Problem URL
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="https://leetcode.com/problems/..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        size="small"
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                        Difficulty Level
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
                        >
                          <MenuItem value="EASY">Easy</MenuItem>
                          <MenuItem value="MEDIUM">Medium</MenuItem>
                          <MenuItem value="HARD">Hard</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                        Primary Topic *
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={primaryTopicId || (topics[0]?.id ?? '')}
                          onChange={(e) => setPrimaryTopicId(e.target.value)}
                        >
                          {topics.map((t) => (
                            <MenuItem key={t.id} value={t.id}>
                              {t.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                      Additional Topics / Tags{' '}
                      <span style={{ fontWeight: 400, color: '#64748B' }}>(comma-separated)</span>
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Binary Search, Sliding Window, DP"
                      value={extraTopicsText}
                      onChange={(e) => setExtraTopicsText(e.target.value)}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Paper>

              {/* Section 2: First Attempt (Only when creating a problem) */}
              {!isEdit && (
                <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #E3E6EF' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <div>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: '"Space Grotesk", sans-serif',
                          fontWeight: 700,
                          color: '#171A2B',
                        }}
                      >
                        First Attempt Reasoning
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Capture your intuition while the problem is fresh in mind.
                      </Typography>
                    </div>
                  </Box>

                  <Stack spacing={2.5} sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                          Outcome Result
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={result}
                            onChange={(e) => setResult(e.target.value as 'Solved' | 'Tried' | 'Could not solve')}
                          >
                            <MenuItem value="Solved">Solved</MenuItem>
                            <MenuItem value="Tried">Tried (Partial)</MenuItem>
                            <MenuItem value="Could not solve">Could not solve (Stuck)</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 7 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                          Confidence Level
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={confidence}
                            onChange={(e) => setConfidence(Number(e.target.value))}
                          >
                            {CONFIDENCE_OPTIONS.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                        How did you approach it?
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="What did you notice first? Which invariant or data structure guided your solution?"
                        value={approach}
                        onChange={(e) => setApproach(e.target.value)}
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                        What got in the way? (Mistakes & false starts)
                      </Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Name the specific false start or edge case (e.g. forgot boundary condition, wrong window shrink)."
                        value={mistakes}
                        onChange={(e) => setMistakes(e.target.value)}
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                        Mistake Tags <span style={{ fontWeight: 400, color: '#64748B' }}>(comma-separated)</span>
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="off-by-one, greedy choice failure, memory limit"
                        value={mistakeTagsText}
                        onChange={(e) => setMistakeTagsText(e.target.value)}
                        size="small"
                      />
                    </Box>
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Grid>

          {/* Right Column: Complexity & Spaced Revisit */}
          <Grid size={{ xs: 12, md: 4.5 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3,
                border: '1px solid #E3E6EF',
                position: { md: 'sticky' },
                top: 84,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700,
                  color: '#171A2B',
                  mb: 2.5,
                }}
              >
                Complexity & Revisit
              </Typography>

              <Stack spacing={2.5}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                      Time Complexity
                    </Typography>
                    <TextField
                      fullWidth
                      value={optimalTime}
                      onChange={(e) => setOptimalTime(e.target.value)}
                      placeholder="O(n log n)"
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                      Space Complexity
                    </Typography>
                    <TextField
                      fullWidth
                      value={optimalSpace}
                      onChange={(e) => setOptimalSpace(e.target.value)}
                      placeholder="O(n)"
                      size="small"
                    />
                  </Grid>
                </Grid>

                {!isEdit && (
                  <>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                          Time Taken (min)
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          value={timeTakenMin}
                          onChange={(e) => setTimeTakenMin(Number(e.target.value))}
                          size="small"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <TimerOutlinedIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                          Language
                        </Typography>
                        <FormControl fullWidth size="small">
                          <Select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
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

                    <Divider sx={{ my: 1 }} />

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                        Next Revisit Date
                      </Typography>
                      <TextField
                        fullWidth
                        type="date"
                        value={nextRevisitDate}
                        onChange={(e) => setNextRevisitDate(e.target.value)}
                        size="small"
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarTodayOutlinedIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />

                      {/* Quick preset chips */}
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                        <Chip
                          label="Tomorrow (+1d)"
                          size="small"
                          onClick={() => setQuickRevisitDays(1)}
                          sx={{ fontSize: '0.725rem', cursor: 'pointer' }}
                        />
                        <Chip
                          label="In 3 days (+3d)"
                          size="small"
                          onClick={() => setQuickRevisitDays(3)}
                          sx={{ fontSize: '0.725rem', cursor: 'pointer' }}
                        />
                        <Chip
                          label="In 1 week (+7d)"
                          size="small"
                          onClick={() => setQuickRevisitDays(7)}
                          sx={{ fontSize: '0.725rem', cursor: 'pointer' }}
                        />
                      </Stack>
                    </Box>
                  </>
                )}

                {/* Inspiration callout */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                  }}
                >
                  <SparklesIcon sx={{ fontSize: 18, color: '#4F3FF0', mt: 0.25 }} />
                  <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.5 }}>
                    A short, honest note now is more useful than a polished explanation later. Return to the hard ones.
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={saving}
                  endIcon={!saving && <ArrowForwardIcon />}
                  sx={{
                    py: 1.25,
                    fontWeight: 600,
                    borderRadius: 2.5,
                    fontSize: '0.95rem',
                  }}
                >
                  {saving ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : isEdit ? (
                    'Save Changes'
                  ) : (
                    'Save Problem & Attempt'
                  )}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
