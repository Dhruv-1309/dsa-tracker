import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Paper, Stack, Link } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { token } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F6FA',
        px: 2,
        py: 6,
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Link
          component={RouterLink}
          to={token ? '/dashboard' : '/login'}
          sx={{ display: 'inline-flex', textDecoration: 'none', color: 'inherit' }}
        >
          <Logo size={32} />
        </Link>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, sm: 6 },
          maxWidth: 540,
          width: '100%',
          textAlign: 'center',
          borderRadius: 3.5,
          border: '1px solid #E3E6EF',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        }}
      >
        <Typography
          variant="h1"
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 800,
            fontSize: { xs: '4.5rem', sm: '6rem' },
            lineHeight: 1,
            color: '#4F3FF0',
            letterSpacing: '-0.04em',
            mb: 1.5,
          }}
        >
          404
        </Typography>

        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            color: '#171A2B',
            mb: 1.5,
          }}
        >
          Page Not Found
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: '#64748B',
            mb: 4,
            fontSize: '0.95rem',
            lineHeight: 1.6,
          }}
        >
          The page or problem resource you are searching for does not exist, was moved, or requires you to sign in.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'center' }}
        >
          <Button
            component={RouterLink}
            to={token ? '/dashboard' : '/login'}
            variant="contained"
            color="primary"
            startIcon={<HomeOutlinedIcon />}
            sx={{
              py: 1.2,
              px: 3,
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            {token ? 'Go to Dashboard' : 'Go to Login'}
          </Button>

          {token && (
            <Button
              component={RouterLink}
              to="/problems"
              variant="outlined"
              color="inherit"
              startIcon={<FormatListBulletedIcon />}
              sx={{
                py: 1.2,
                px: 3,
                borderRadius: 2,
                fontWeight: 600,
                color: '#475569',
                borderColor: '#E3E6EF',
              }}
            >
              Problem Library
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
