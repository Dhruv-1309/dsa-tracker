import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Link, Stack } from '@mui/material';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        mt: 'auto',
        borderTop: '1px solid #E3E6EF',
        backgroundColor: '#FFFFFF',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.85rem' }}>
            © {currentYear}{' '}
            <Link
              component={RouterLink}
              to="/"
              underline="hover"
              sx={{ color: '#171A2B', fontWeight: 600, '&:hover': { color: '#4F3FF0' } }}
            >
              DSA Tracker
            </Link>
            . Built for systematic interview mastery.
          </Typography>

          <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
            <Link
              component={RouterLink}
              to="/terms"
              underline="hover"
              sx={{
                color: '#64748B',
                fontSize: '0.85rem',
                fontWeight: 500,
                '&:hover': { color: '#4F3FF0' },
              }}
            >
              Terms & Conditions
            </Link>
            <Link
              component={RouterLink}
              to="/privacy"
              underline="hover"
              sx={{
                color: '#64748B',
                fontSize: '0.85rem',
                fontWeight: 500,
                '&:hover': { color: '#4F3FF0' },
              }}
            >
              Privacy Policy
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
