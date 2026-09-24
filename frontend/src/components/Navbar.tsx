import { useState } from 'react';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from '../api/useApiClient';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Container,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ReplayIcon from '@mui/icons-material/Replay';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import TagIcon from '@mui/icons-material/Tag';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const fetchApi = useApiClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetchApi('/users/me', { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        logout();
        navigate('/register');
      }
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardOutlinedIcon sx={{ fontSize: 19 }} /> },
    { label: 'Problems', path: '/problems', icon: <FormatListBulletedIcon sx={{ fontSize: 19 }} /> },
    { label: 'Revisit Queue', path: '/queue', icon: <ReplayIcon sx={{ fontSize: 19 }} /> },
    { label: 'Topics', path: '/topics', icon: <TagIcon sx={{ fontSize: 19 }} /> },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E3E6EF',
        color: '#171A2B',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 64, justifyContent: 'space-between' }}>
          {/* Brand Logo */}
          <Stack
            direction="row"
            spacing={1.5}
            component={RouterLink}
            to="/dashboard"
            sx={{ textDecoration: 'none', color: 'inherit', alignItems: 'center' }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                backgroundColor: '#4F3FF0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(79, 63, 240, 0.3)',
              }}
            >
              <TerminalIcon sx={{ color: '#FFFFFF', fontSize: 22 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#171A2B',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              DSA Tracker
            </Typography>
          </Stack>

          {/* Desktop Nav Items */}
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: active ? '#4F3FF0' : '#64748B',
                    backgroundColor: active ? '#EEEBFF' : 'transparent',
                    fontWeight: active ? 600 : 500,
                    px: 2,
                    py: 0.8,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: active ? '#E5E1FF' : '#F8FAFC',
                      color: active ? '#4F3FF0' : '#171A2B',
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          {/* Actions: Add Problem & User Menu */}
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Button
              component={RouterLink}
              to="/problems/new"
              variant="contained"
              color="primary"
              size="small"
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 0.8,
                fontSize: '0.875rem',
                fontWeight: 600,
                display: { xs: 'none', sm: 'inline-flex' },
              }}
            >
              Log Problem
            </Button>

            <IconButton
              onClick={handleMenuOpen}
              sx={{
                p: 1,
                border: '1px solid #E3E6EF',
                borderRadius: 2,
                backgroundColor: '#F8FAFC',
              }}
            >
              <AccountCircleOutlinedIcon sx={{ color: '#475569' }} />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              slotProps={{
                paper: {
                  elevation: 3,
                  sx: {
                    minWidth: 200,
                    borderRadius: 2.5,
                    mt: 1,
                    border: '1px solid #E3E6EF',
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {/* Mobile menu items */}
              <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                {navLinks.map((item) => (
                  <MenuItem
                    key={item.path}
                    onClick={() => {
                      handleMenuClose();
                      navigate(item.path);
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </MenuItem>
                ))}
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate('/problems/new');
                  }}
                >
                  <ListItemIcon>
                    <AddIcon sx={{ color: '#4F3FF0' }} />
                  </ListItemIcon>
                  <ListItemText primary="Log Problem" />
                </MenuItem>
                <Divider sx={{ my: 1 }} />
              </Box>

              <MenuItem onClick={handleLogout} sx={{ color: '#475569' }}>
                <ListItemIcon>
                  <LogoutIcon sx={{ color: '#475569', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary="Sign Out" />
              </MenuItem>

              <Divider sx={{ my: 1 }} />

              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  setDeleteDialogOpen(true);
                }}
                sx={{ color: '#DC2626' }}
              >
                <ListItemIcon>
                  <DeleteOutlinedIcon sx={{ color: '#DC2626', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText primary="Delete Account" />
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </Container>

      {/* Account Deletion Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626' }}>
          Delete Account & All Data?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569', fontSize: '0.925rem' }}>
            This will permanently delete your account, your problem records, attempt history, and revision schedule. This action is irreversible and compliant with complete data removal.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            disabled={deleting}
            variant="contained"
            color="error"
            startIcon={deleting && <CircularProgress size={16} color="inherit" />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {deleting ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
