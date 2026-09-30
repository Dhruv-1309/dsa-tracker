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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function Terms() {
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
                label="Terms of Service"
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
              Terms and Conditions
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', mt: 1, lineHeight: 1.6 }}>
              Welcome to DSA Tracker. These terms outline straightforward, plain-language guidelines for using our study platform responsibly.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* Section 1: Personal Project & As-Is Service */}
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <InfoOutlinedIcon sx={{ color: '#4F3FF0', fontSize: 24 }} />
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, color: '#171A2B' }}
              >
                1. Personal Project & "As-Is" Service
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mb: 1 }}>
              DSA Tracker is an independent personal project created to help software engineers systematically prepare for technical interviews.
            </Typography>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                mb: 1,
              }}
            >
              <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 600, mb: 0.5 }}>
                No Uptime Guarantee:
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
                The service is provided on an "as-is" and "as-available" basis without warranties of any kind. While we strive to maintain high availability and reliability, there is no uptime service-level agreement (SLA) or guarantee of uninterrupted, error-free operation.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* Section 2: Account Security & Logged Content */}
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <SecurityOutlinedIcon sx={{ color: '#4F3FF0', fontSize: 24 }} />
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, color: '#171A2B' }}
              >
                2. Account Security & Your Content
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mb: 1 }}>
              You are responsible for keeping your login credentials confidential and for all activity that occurs under your account:
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0, color: '#475569', lineHeight: 1.7, fontSize: '0.875rem' }}>
              <li>
                <strong>Credentials:</strong> Choose a strong, unique password. If you suspect unauthorized access, update your password immediately in Settings.
              </li>
              <li>
                <strong>Practice Content:</strong> You own the problems, approaches, mistake analyses, and code solutions you log. You are responsible for ensuring your logged content does not contain trade secrets, proprietary employer code, or confidential interview questions covered by active non-disclosure agreements.
              </li>
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* Section 3: Friend Sharing & Anti-Harassment */}
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <PeopleAltOutlinedIcon sx={{ color: '#4F3FF0', fontSize: 24 }} />
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, color: '#171A2B' }}
              >
                3. Friend Sharing & Acceptable Use
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7, mb: 1.5 }}>
              The peer friend-sharing feature is provided solely for mutual study accountability and collaborative learning.
            </Typography>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                mb: 1.5,
              }}
            >
              <Typography variant="body2" sx={{ color: '#991B1B', fontWeight: 600, mb: 0.5 }}>
                Zero Tolerance for Spam or Harassment:
              </Typography>
              <Typography variant="body2" sx={{ color: '#7F1D1D', lineHeight: 1.6 }}>
                You must not use friend requests, friend codes, or the platform to spam, harass, stalk, or send unwanted messages to other users. You may not attempt to brute-force friend codes or scrape other users' logs without explicit permission.
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
              Misuse of the friend feature or harassment of any user will result in immediate removal of the connection and may lead to permanent account suspension.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* Section 4: Account Deletion & Termination */}
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5 }}>
              <DeleteOutlinedIcon sx={{ color: '#DC2626', fontSize: 24 }} />
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, color: '#171A2B' }}
              >
                4. Account Deletion & Removal
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.7 }}>
              You may delete your account at any time directly through your Settings page. Deleting your account immediately and permanently purges your profile, logged problems, attempt histories, and active friend connections. We also reserve the right to remove accounts that violate these terms, abuse API rate limits, or engage in malicious activity.
            </Typography>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* Section 5: Transparency Notice */}
          <Box sx={{ backgroundColor: '#F8FAFC', p: 2, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.6 }}>
              <strong>Notice:</strong> This document represents a plain-language summary of terms governing the use of DSA Tracker. By creating an account or accessing the platform, you acknowledge and agree to these terms and our Privacy Policy.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
