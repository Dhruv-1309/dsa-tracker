import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
import InsightsIcon from '@mui/icons-material/Insights';
import { TextEffect } from '../components/motion/TextEffect';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        navigate('/login');
      } else {
        const text = await res.text();
        setError(text || 'Registration failed. This email may already be registered.');
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
            background: 'linear-gradient(145deg, #171A2B 0%, #1A213D 45%, #0E9F6E 100%)',
            color: '#FFFFFF',
            p: { xs: 4, sm: 6 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle background glow */}
          <Box
            sx={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(14, 159, 110, 0.25) 0%, rgba(0,0,0,0) 70%)',
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
                  backgroundColor: '#0E9F6E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(14, 159, 110, 0.4)',
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
              icon={<InsightsIcon sx={{ fontSize: '1rem !important', color: '#DEF7EC !important' }} />}
              label="Systematic Technical Preparation"
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#DEF7EC',
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
              <TextEffect per="word">Transform practice into permanent recall.</TextEffect>
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
              Stop re-solving the same problems from scratch without progress.
              DSA Tracker schedules targeted revisions so your intuition never fades.
            </Typography>

            <Stack spacing={2} sx={{ mt: 2 }}>
              {[
                'Automated spaced repetition intervals (1, 3, 7, 21 days)',
                'Categorize failure modes & mistake patterns',
                'Comprehensive progress metrics by platform & difficulty',
              ].map((text, idx) => (
                <Stack key={idx} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <CheckCircleOutlinedIcon sx={{ color: '#31C48D', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: '#E2E4EC' }}>
                    {text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </div>

          <Box sx={{ mt: { xs: 4, md: 6 } }}>
            <Typography variant="caption" sx={{ color: '#8F97B2' }}>
              Designed for serious interview preparation.
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
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set up your tracker and log your first algorithmic challenge.
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
                  placeholder="Minimum 6 characters"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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
                  background: 'linear-gradient(135deg, #0E9F6E 0%, #057A55 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #04744E 0%, #0E9F6E 100%)',
                    boxShadow: '0 4px 12px rgba(14, 159, 110, 0.25)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Get Started Free'}
              </Button>
            </Stack>

            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: '#0E9F6E',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign in
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
