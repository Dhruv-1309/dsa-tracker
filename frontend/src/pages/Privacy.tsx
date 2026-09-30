import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Divider,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function Privacy() {
  const { token } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
      {/* Header bar with Logo and Return navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Logo size={28} />
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(token ? '/dashboard' : '/login')}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {token ? 'Back to Dashboard' : 'Back to Login'}
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          border: '1px solid #E3E6EF',
          backgroundColor: '#FFFFFF',
        }}
      >
        <Stack spacing={3.5}>
          {/* Title & Badge */}
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <Chip
                label="Transparency Notice"
                size="small"
                sx={{
                  backgroundColor: '#EEEBFF',
                  color: '#4F3FF0',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Last updated: September 2026
              </Typography>
            </Stack>
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
              Privacy Policy
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', mt: 1, lineHeight: 1.6 }}>
              DSA Tracker is built to help software engineers systematically prepare for technical interviews. We believe in total transparency regarding what data is stored and how sharing works.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* Section 1: What is Stored */}
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <StorageOutlinedIcon sx={{ color: '#4F3FF0', fontSize: 24 }} />
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, color: '#171A2B' }}
              >
                1. What We Store
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mb: 1 }}>
              When you use DSA Tracker, we collect and store only the information necessary to provide your study tracking:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, color: '#475569', lineHeight: 1.7, fontSize: '0.875rem' }}>
              <li>
                <strong>Account credentials:</strong> Your email address and a securely salted password hash (or Google account identifier if you choose Google Sign-In).
              </li>
              <li>
                <strong>Profile settings:</strong> Your optional display username and uniquely generated friend code.
              </li>
              <li>
                <strong>Problem records:</strong> Problem titles, source platforms (LeetCode, HackerRank, etc.), difficulty levels, topics, URLs, and time/space complexity notes.
              </li>
              <li>
                <strong>Attempt logs:</strong> Every attempt you log, including outcome status, confidence ratings, time taken, written approaches, identified mistakes, and code solutions.
              </li>
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* Section 2: Friend Sharing */}
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <PeopleAltOutlinedIcon sx={{ color: '#4F3FF0', fontSize: 24 }} />
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, color: '#171A2B' }}
              >
                2. Friend Sharing & Visibility
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mb: 1.5 }}>
              Connecting with peers via friend codes allows collaborative accountability. Here is exactly what happens when you connect:
            </Typography>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                mb: 1.5,
              }}
            >
              <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600, mb: 0.5 }}>
                Complete Read-Only Log Access:
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
                Once you accept a friend's request, that user can view your complete problem library and attempt history in read-only mode — including every problem regardless of status (unsolved, tried, or solved), along with your approach notes, mistake analyses, and logged code.
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
              <strong>Revoking access:</strong> You can remove a friend at any time from the Friends tab. Removing a friend immediately terminates access in both directions. Revision intervals and private revisit buckets are never exposed to friends.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* Section 3: No Sale or Sharing Outside App */}
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <SecurityOutlinedIcon sx={{ color: '#0E9F6E', fontSize: 24 }} />
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, color: '#171A2B' }}
              >
                3. No External Sharing or Sale of Data
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
              We do not sell, rent, monetize, or disclose your personal data, email, problem logs, or notes to any third parties, advertisers, or data brokers. Your practice data belongs entirely to you and is used solely to power your spaced repetition dashboard and direct peer sharing.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* Section 4: Deletion & Control */}
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <DeleteOutlinedIcon sx={{ color: '#DC2626', fontSize: 24 }} />
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, color: '#171A2B' }}
              >
                4. Data Retention & Account Deletion
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
              You maintain full control of your records. You may delete individual problems or attempts at any time. If you wish to delete your account, you can permanently delete your profile, problems, attempt history, and friendships with a single confirmation in your Settings page. Deletion is immediate and irreversible.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* Section 5: Transparency Disclaimer */}
          <Box sx={{ backgroundColor: '#F8FAFC', p: 2, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.6 }}>
              <strong>Notice:</strong> This document represents a plain-language transparency summary describing how the application processes and shares data. It is intended for informational clarity and does not constitute formal legal counsel.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
