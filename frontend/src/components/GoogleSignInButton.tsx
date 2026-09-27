import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { API_BASE_URL, GOOGLE_CLIENT_ID } from '../api/config';

// TypeScript declarations for Google Identity Services API
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
          prompt?: () => void;
        };
      };
    };
  }
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);

  const handleCredentialResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        onError('No authentication credential received from Google.');
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.token) {
            onSuccess(data.token);
          } else {
            onError('Authentication succeeded but no authorization token was received.');
          }
        } else {
          let errorMessage = 'Google authentication failed.';
          try {
            const data = await res.json();
            if (data?.message) {
              errorMessage = data.message;
            }
          } catch {
            const textResponse = await res.text();
            if (textResponse) errorMessage = textResponse;
          }
          onError(errorMessage);
        }
      } catch (err) {
        console.error('Google sign-in network error:', err);
        onError('Unable to reach server. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  // Poll for Google Identity Services script availability
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.google?.accounts?.id) {
        setScriptLoaded(true);
        clearInterval(interval);
      } else if (attempts >= 40) {
        // 4 seconds elapsed without GIS loaded
        setLoadTimedOut(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Initialize and render Google button once GIS is ready and container is mounted
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any prior button instances before re-rendering
      containerRef.current.innerHTML = '';

      // Determine width clamped between 240px and 400px
      const measuredWidth = containerRef.current.parentElement?.clientWidth || 360;
      const targetWidth = Math.min(Math.max(measuredWidth, 240), 400);

      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: text,
        shape: 'rectangular',
        width: targetWidth,
        logo_alignment: 'left',
      });
    } catch (e) {
      console.error('Failed to render Google Sign-In button', e);
    }
  }, [scriptLoaded, text, handleCredentialResponse]);

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      {loadTimedOut && (
        <Alert severity="warning" sx={{ mb: 2, fontSize: '0.85rem', borderRadius: 2 }}>
          Google Sign-In could not load. You can sign in using your email and password below.
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 44,
          position: 'relative',
          opacity: disabled || loading ? 0.65 : 1,
          pointerEvents: disabled || loading ? 'none' : 'auto',
          '& > div': {
            width: '100% !important',
            display: 'flex !important',
            justifyContent: 'center !important',
          },
          '& iframe': {
            margin: '0 auto !important',
          },
        }}
      >
        <div ref={containerRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />

        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              borderRadius: 2,
              zIndex: 3,
            }}
          >
            <CircularProgress size={22} sx={{ color: '#4F3FF0' }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
