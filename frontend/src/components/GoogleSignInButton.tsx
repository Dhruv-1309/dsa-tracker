import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, CircularProgress, Box, Typography } from '@mui/material';
import { API_BASE_URL, GOOGLE_CLIENT_ID } from '../api/config';
import { extractApiErrorMessage, getFriendlyErrorMessage } from '../utils/errorUtils';

// TypeScript declarations for Google Identity Services OAuth2
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

// Pixel-perfect official Google 4-color "G" SVG icon
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface GoogleSignInButtonProps {
  onSuccess: (token: string) => void;
  onError: (errorMsg: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  disabled?: boolean;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'continue_with',
  disabled = false,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const tokenClientRef = useRef<{ requestAccessToken: (config?: { prompt?: string }) => void } | null>(null);

  const getButtonText = () => {
    switch (text) {
      case 'signup_with':
        return 'Sign up with Google';
      case 'signin_with':
        return 'Sign in with Google';
      case 'continue_with':
      default:
        return 'Continue with Google';
    }
  };

  const handleTokenResponse = useCallback(
    async (tokenResponse: { access_token?: string; error?: string; error_description?: string }) => {
      if (tokenResponse.error) {
        setLoading(false);
        if (tokenResponse.error !== 'popup_closed_by_user') {
          onError(tokenResponse.error_description || tokenResponse.error);
        }
        return;
      }

      if (!tokenResponse.access_token) {
        setLoading(false);
        onError('No authentication token received from Google.');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: tokenResponse.access_token }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.token) {
            onSuccess(data.token);
          } else {
            onError('Authentication succeeded but authorization token was missing.');
          }
        } else {
          const friendlyError = await extractApiErrorMessage(res, 'Google Sign-In is temporarily unavailable. Please try again or use email.');
          onError(friendlyError);
        }
      } catch (err) {
        console.error('Google OAuth request error:', err);
        onError(getFriendlyErrorMessage(err, 'Unable to connect to the server. Please check your internet connection.'));
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  // Initialize GIS OAuth2 token client
  useEffect(() => {
    const initClient = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'email profile openid',
            callback: handleTokenResponse,
          });
          return true;
        } catch (e) {
          console.error('GIS initTokenClient error', e);
        }
      }
      return false;
    };

    if (!initClient()) {
      const interval = setInterval(() => {
        if (initClient()) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleTokenResponse]);

  // Reset loading state if user cancels or closes the popup window
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        setLoading(false);
      }, 1200);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading || disabled) return;

    if (tokenClientRef.current) {
      setLoading(true);
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } else if (window.google?.accounts?.oauth2) {
      try {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: handleTokenResponse,
        });
        setLoading(true);
        tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
      } catch (e) {
        console.error('Failed to initialize Google token client:', e);
        onError('Failed to open Google sign-in. Please try again.');
      }
    } else {
      onError('Google Sign-In is initializing. Please try again in a few seconds.');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Button
        fullWidth
        variant="outlined"
        size="large"
        onClick={handleClick}
        disabled={disabled || loading}
        startIcon={
          loading ? (
            <CircularProgress size={18} sx={{ color: '#4285F4' }} />
          ) : (
            <GoogleLogo size={19} />
          )
        }
        sx={{
          py: 1.3,
          minHeight: 46,
          fontSize: '0.92rem',
          fontWeight: 600,
          fontFamily: '"Space Grotesk", "IBM Plex Sans", sans-serif',
          borderRadius: 2.5,
          borderColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          textTransform: 'none',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          transition: 'all 0.15s ease-in-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          '& .MuiButton-startIcon': {
            mr: 1.25,
            ml: 0,
          },
          '&:hover': {
            backgroundColor: '#F8FAFC',
            borderColor: '#CBD5E1',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)',
          },
          '&:active': {
            backgroundColor: '#F1F5F9',
            transform: 'scale(0.995)',
          },
          '&.Mui-disabled': {
            backgroundColor: '#F8FAFC',
            borderColor: '#E2E8F0',
            color: '#94A3B8',
          },
        }}
      >
        <Typography
          component="span"
          sx={{
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            fontSize: 'inherit',
            color: 'inherit',
          }}
        >
          {loading ? 'Connecting to Google...' : getButtonText()}
        </Typography>
      </Button>
    </Box>
  );
}
