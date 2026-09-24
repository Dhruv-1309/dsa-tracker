import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TerminalIcon from '@mui/icons-material/Terminal';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import { TextEffect } from '../components/motion/TextEffect';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        navigate('/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch {
      setError('Unable to reach server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F6FA',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 1040,
          borderRadius: 4,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          border: '1px solid #E3E6EF',
        }}
      >
        {/* Left Brand Feature Panel */}
        <Box
          sx={{
            flex: { md: 1.1 },
            background: 'linear-gradient(145deg, #171A2B 0%, #1F2238 45%, #4F3FF0 100%)',
            color: '#FFFFFF',
            p: { xs: 4, sm: 6 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle background glow effect */}
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(142, 126, 255, 0.25) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <div>
            {/* Logo Header */}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 6 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  backgroundColor: '#4F3FF0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(79, 63, 240, 0.4)',
                }}
              >
                <TerminalIcon sx={{ color: '#FFFFFF', fontSize: 24 }} />
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                DSA Tracker
              </Typography>
            </Stack>

            <Chip
              icon={<AutoGraphIcon sx={{ fontSize: '1rem !important', color: '#EEEBFF !important' }} />}
              label="Spaced Repetition for Engineers"
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#EEEBFF',
                backdropFilter: 'blur(8px)',
                mb: 3,
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            />

            <Typography
              variant="h3"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                lineHeight: 1.15,
                mb: 2.5,
                fontSize: { xs: '1.75rem', sm: '2.25rem' },
              }}
            >
              <TextEffect per="word">Master algorithms. Never forget a pattern.</TextEffect>
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: '#C7CCE3',
                lineHeight: 1.6,
                mb: 4,
                fontSize: '0.95rem',
              }}
            >
              Log problems from any platform, record insights, and revisit them
              on an evidence-based spaced repetition curve.
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
              {[
                'Track approach, complexity & core intuition',
                'Simulate interview conditions with Blind Mode',
                'Activity heatmap & revision timeline alerts',
              ].map((text, idx) => (
                <Stack key={idx} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <CheckCircleOutlinedIcon sx={{ color: '#10B981', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#E2E4EC' }}>
                    {text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </div>

          <Box sx={{ mt: { xs: 4, md: 6 } }}>
            <Typography variant="caption" sx={{ color: '#8F97B2' }}>
              Built for disciplined algorithmic practice.
            </Typography>
          </Box>
        </Box>

        {/* Right Form Panel */}
        <Box
          sx={{
            flex: { md: 1 },
            p: { xs: 4, sm: 6 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                color: '#171A2B',
                mb: 1,
              }}
            >
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your credentials to continue your practice session.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                  Email Address
                </Typography>
                <TextField
                  required
                  fullWidth
                  id="email"
                  name="email"
                  autoComplete="email"
                  placeholder="alex@example.com"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}>
                  Password
                </Typography>
                <TextField
                  required
                  fullWidth
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#94A3B8' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                endIcon={!loading && <ArrowForwardIcon />}
                sx={{
                  mt: 1,
                  py: 1.4,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: 2.5,
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Continue to Dashboard'}
              </Button>
            </Stack>

            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                New to DSA Tracker?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: '#4F3FF0',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Create an account
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
