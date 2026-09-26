import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/config';

export default function Settings() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Password validation
  const isLengthValid = newPassword.length >= 8;
  const isMatchValid = newPassword === confirmPassword && confirmPassword.length > 0;
  const isFormFilled = currentPassword.trim().length > 0 && newPassword.length > 0 && confirmPassword.length > 0;
  const isPasswordFormValid = isFormFilled && isLengthValid && isMatchValid;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!isPasswordFormValid) {
      if (!isLengthValid) {
        setPasswordError('New password must be at least 8 characters long.');
      } else if (!isMatchValid) {
        setPasswordError('New password and confirm password do not match.');
      }
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setPasswordSuccess('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else if (res.status === 401) {
        setPasswordError('Current password is incorrect');
      } else {
        const errorData = await res.json().catch(() => null);
        setPasswordError(errorData?.error || 'Failed to update password. Please try again.');
      }
    } catch {
      setPasswordError('Network error. Unable to reach server.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>
      {/* Header */}
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
          Settings
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Manage your account credentials and security settings.
        </Typography>
      </Box>

      <Stack spacing={4}>
        {/* Account Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E3E6EF',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                color: '#171A2B',
                mb: 0.5,
              }}
            >
              Account
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Your account details and security settings.
            </Typography>
          </Box>

          {/* Read-Only Email Field */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'block',
                mb: 1,
              }}
            >
              Account Email
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E3E6EF',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <EmailOutlinedIcon sx={{ color: '#64748B', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  color: '#64748B',
                  fontWeight: 500,
                }}
              >
                {user?.email || 'Loading account email...'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Change Password Form */}
          <Box component="form" onSubmit={handlePasswordSubmit} noValidate sx={{ mb: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                color: '#171A2B',
                mb: 0.5,
              }}
            >
              Change Password
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              Ensure your account stays secure by using a strong password of at least 8 characters.
            </Typography>

            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {passwordSuccess}
              </Alert>
            )}

            {passwordError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {passwordError}
              </Alert>
            )}

            <Stack spacing={2.5}>
              {/* Current Password */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}
                >
                  Current Password
                </Typography>
                <TextField
                  fullWidth
                  required
                  id="current-password"
                  name="currentPassword"
                  placeholder="Enter current password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle current password visibility"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                            size="small"
                          >
                            {showCurrentPassword ? (
                              <VisibilityOff sx={{ fontSize: 18 }} />
                            ) : (
                              <Visibility sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              {/* New Password */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}
                >
                  New Password
                </Typography>
                <TextField
                  fullWidth
                  required
                  id="new-password"
                  name="newPassword"
                  placeholder="At least 8 characters"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={newPassword.length > 0 && !isLengthValid}
                  helperText={
                    newPassword.length > 0 && !isLengthValid
                      ? 'Password must be at least 8 characters long.'
                      : undefined
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle new password visibility"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            size="small"
                          >
                            {showNewPassword ? (
                              <VisibilityOff sx={{ fontSize: 18 }} />
                            ) : (
                              <Visibility sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              {/* Confirm New Password */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: '#334155', mb: 0.75, display: 'block' }}
                >
                  Confirm New Password
                </Typography>
                <TextField
                  fullWidth
                  required
                  id="confirm-password"
                  name="confirmPassword"
                  placeholder="Re-type your new password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={confirmPassword.length > 0 && !isMatchValid}
                  helperText={
                    confirmPassword.length > 0 && !isMatchValid ? 'Passwords do not match.' : undefined
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff sx={{ fontSize: 18 }} />
                            ) : (
                              <Visibility sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              <Box sx={{ pt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={passwordLoading || !isPasswordFormValid}
                  startIcon={passwordLoading && <CircularProgress size={16} color="inherit" />}
                  sx={{
                    py: 1.2,
                    px: 3,
                    borderRadius: 2,
                    fontWeight: 600,
                  }}
                >
                  {passwordLoading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </Box>
            </Stack>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Logout Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', sm: 'center' },
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 600,
                  color: '#171A2B',
                }}
              >
                Session
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                End your current authenticated session on this browser.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              color="inherit"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                color: '#171A2B',
                borderColor: '#E3E6EF',
              }}
            >
              Log Out
            </Button>
          </Box>
        </Paper>
      </Stack>
    </Container>
  );
}
