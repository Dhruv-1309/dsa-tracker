import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';
import { useApiClient } from '../api/useApiClient';
import type { Friend, FriendCodeResponse, FriendRequest } from '../types/friend';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import MarkEmailUnreadOutlinedIcon from '@mui/icons-material/MarkEmailUnreadOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

export default function Friends() {
  const fetchApi = useApiClient();
  const queryClient = useQueryClient();

  // State
  const [inputCode, setInputCode] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [copiedSnackbar, setCopiedSnackbar] = useState(false);

  // Dialog state
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);
  const [removeFriendTarget, setRemoveFriendTarget] = useState<Friend | null>(null);
  const [declineTarget, setDeclineTarget] = useState<{ id: string; name: string } | null>(null);

  // 1. Fetch current user's friend code
  const { data: codeData, isLoading: codeLoading } = useQuery<FriendCodeResponse>({
    queryKey: ['myFriendCode'],
    queryFn: async () => {
      const res = await fetchApi('/v1/users/me/friend-code');
      if (!res.ok) {
        // Fallback for non-v1
        const fallback = await fetchApi('/users/me/friend-code');
        if (!fallback.ok) throw new Error('Failed to fetch friend code');
        return fallback.json();
      }
      return res.json();
    },
  });

  // 2. Fetch incoming pending requests
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery<FriendRequest[]>({
    queryKey: ['friendRequests'],
    queryFn: async () => {
      const res = await fetchApi('/v1/friends/requests');
      if (!res.ok) {
        const fallback = await fetchApi('/friends/requests');
        if (!fallback.ok) throw new Error('Failed to fetch friend requests');
        return fallback.json();
      }
      return res.json();
    },
  });

  // 3. Fetch accepted friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<Friend[]>({
    queryKey: ['friendsList'],
    queryFn: async () => {
      const res = await fetchApi('/v1/friends');
      if (!res.ok) {
        const fallback = await fetchApi('/friends');
        if (!fallback.ok) throw new Error('Failed to fetch friends');
        return fallback.json();
      }
      return res.json();
    },
  });

  // Mutation: Regenerate code
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetchApi('/v1/users/me/friend-code/regenerate', { method: 'POST' });
      if (!res.ok) {
        const fallback = await fetchApi('/users/me/friend-code/regenerate', { method: 'POST' });
        if (!fallback.ok) throw new Error('Failed to regenerate friend code');
        return fallback.json();
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['myFriendCode'], data);
      setRegenConfirmOpen(false);
    },
  });

  // Mutation: Send friend request
  const sendRequestMutation = useMutation({
    mutationFn: async (code: string) => {
      setAddError(null);
      setAddSuccess(null);
      const res = await fetchApi('/v1/friends/requests', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errorMsg =
          errJson?.error ||
          errJson?.message ||
          (res.status === 404
            ? 'User not found with provided friend code'
            : res.status === 400
            ? 'Cannot send friend request to yourself'
            : res.status === 409
            ? 'Friend request already sent or you are already friends'
            : res.status === 429
            ? 'Too many friend requests sent. Please try again after 60 seconds.'
            : 'Failed to send friend request');
        throw new Error(errorMsg);
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status === 'ACCEPTED') {
        setAddSuccess('Mutual request detected! You are now friends.');
      } else {
        setAddSuccess('Friend request sent successfully.');
      }
      setInputCode('');
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
    },
    onError: (err: Error) => {
      setAddError(err.message);
    },
  });

  // Mutation: Accept request
  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetchApi(`/v1/friends/requests/${requestId}/accept`, { method: 'POST' });
      if (!res.ok) {
        const fallback = await fetchApi(`/friends/requests/${requestId}/accept`, { method: 'POST' });
        if (!fallback.ok) throw new Error('Failed to accept request');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
    },
  });

  // Mutation: Decline request
  const declineMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetchApi(`/v1/friends/requests/${requestId}/decline`, { method: 'POST' });
      if (!res.ok) {
        const fallback = await fetchApi(`/friends/requests/${requestId}/decline`, { method: 'POST' });
        if (!fallback.ok) throw new Error('Failed to decline request');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });

  // Mutation: Remove friend
  const removeMutation = useMutation({
    mutationFn: async (friendUserId: string) => {
      const res = await fetchApi(`/v1/friends/${friendUserId}`, { method: 'DELETE' });
      if (!res.ok) {
        const fallback = await fetchApi(`/friends/${friendUserId}`, { method: 'DELETE' });
        if (!fallback.ok) throw new Error('Failed to remove friend');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
      setRemoveFriendTarget(null);
    },
  });

  const handleCopyCode = () => {
    const code = codeData?.code || codeData?.friendCode;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedSnackbar(true);
    }
  };

  const myCode = codeData?.code || codeData?.friendCode || '';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 700,
            color: '#171A2B',
            letterSpacing: '-0.02em',
            mb: 0.5,
          }}
        >
          Friends & Sharing
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Exchange friend codes to share and explore each other's solved algorithmic problems and daily activity heatmaps.
        </Typography>
      </Box>

      {/* Top Section: Your Code & Add a Friend */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
        {/* Your Friend Code Card */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid #E3E6EF',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
                color: '#171A2B',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <PeopleAltOutlinedIcon sx={{ color: '#4F3FF0', fontSize: 22 }} />
              Your Friend Code
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Share this unique 10-character code with your peers so they can connect with you.
            </Typography>

            {codeLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                <CircularProgress size={20} sx={{ color: '#4F3FF0' }} />
                <Typography variant="body2" color="text.secondary">Loading code...</Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1.5,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: '#F8FAFC',
                  border: '1px dashed #CBD5E1',
                  mb: 2.5,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontWeight: 700,
                    fontSize: '1.45rem',
                    letterSpacing: '0.12em',
                    color: '#4F3FF0',
                  }}
                >
                  {myCode || '----------'}
                </Typography>
                <Tooltip title="Copy code to clipboard">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                    onClick={handleCopyCode}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                  >
                    Copy
                  </Button>
                </Tooltip>
              </Box>
            )}
          </Box>

          <Box sx={{ pt: 1 }}>
            <Button
              variant="text"
              size="small"
              startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
              onClick={() => setRegenConfirmOpen(true)}
              disabled={regenerateMutation.isPending || codeLoading}
              sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.8rem', p: 0.5, '&:hover': { color: '#4F3FF0' } }}
            >
              Regenerate Code
            </Button>
          </Box>
        </Paper>

        {/* Add Friend Card */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid #E3E6EF',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 600,
                color: '#171A2B',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <PersonAddOutlinedIcon sx={{ color: '#4F3FF0', fontSize: 22 }} />
              Add a Friend
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Enter a friend's 10-character code to send them a connection request.
            </Typography>

            <Stack
              component="form"
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              onSubmit={(e) => {
                e.preventDefault();
                if (inputCode.trim()) {
                  sendRequestMutation.mutate(inputCode);
                }
              }}
            >
              <TextField
                placeholder="e.g. 9X4KD72MNP"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  if (addError) setAddError(null);
                  if (addSuccess) setAddSuccess(null);
                }}
                size="small"
                fullWidth
                slotProps={{
                  htmlInput: { maxLength: 12 },
                }}
                sx={{
                  '& input': {
                    fontFamily: '"IBM Plex Mono", monospace',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!inputCode.trim() || sendRequestMutation.isPending}
                sx={{
                  px: 3,
                  fontWeight: 600,
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  backgroundColor: '#4F3FF0',
                  color: '#FFFFFF !important',
                  '&.Mui-disabled': {
                    backgroundColor: '#4F3FF0',
                    color: 'rgba(255, 255, 255, 0.85) !important',
                    opacity: 0.7,
                  },
                  '&:hover': {
                    backgroundColor: '#4335D6',
                  },
                }}
              >
                {sendRequestMutation.isPending ? <CircularProgress size={20} color="inherit" /> : 'Send Request'}
              </Button>
            </Stack>

            {/* Inline feedback */}
            {addError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2, fontSize: '0.85rem' }}>
                {addError}
              </Alert>
            )}
            {addSuccess && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: 2, fontSize: '0.85rem' }}>
                {addSuccess}
              </Alert>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Pending Requests Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
          <MarkEmailUnreadOutlinedIcon sx={{ color: '#4F3FF0', fontSize: 22 }} />
          <Typography
            variant="h6"
            sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, color: '#171A2B' }}
          >
            Incoming Requests
          </Typography>
          <Chip
            label={pendingRequests.length}
            size="small"
            sx={{
              backgroundColor: pendingRequests.length > 0 ? '#EEEBFF' : '#F1F5F9',
              color: pendingRequests.length > 0 ? '#4F3FF0' : '#64748B',
              fontWeight: 600,
            }}
          />
        </Stack>

        {requestsLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 3 }}>
            <CircularProgress size={24} sx={{ color: '#4F3FF0' }} />
            <Typography variant="body2" color="text.secondary">Loading pending requests...</Typography>
          </Box>
        ) : pendingRequests.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2.5,
              border: '1px dashed #E3E6EF',
              backgroundColor: '#FAFBFC',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No pending friend requests at this time.
            </Typography>
          </Paper>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ borderRadius: 3, border: '1px solid #E3E6EF', overflowX: 'auto' }}
          >
            <Table sx={{ minWidth: 460 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Requester</TableCell>
                  <TableCell>Requested On</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingRequests.map((req) => (
                  <TableRow key={req.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#171A2B' }}>
                      {req.requesterName}
                    </TableCell>
                    <TableCell sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          disabled={acceptMutation.isPending || declineMutation.isPending}
                          onClick={() => acceptMutation.mutate(req.id)}
                          sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.75rem', px: 1.8 }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          disabled={acceptMutation.isPending || declineMutation.isPending}
                          onClick={() => setDeclineTarget({ id: req.id, name: req.requesterName })}
                          sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.75rem', px: 1.8, color: '#64748B' }}
                        >
                          Decline
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Accepted Friends Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
          <PeopleAltOutlinedIcon sx={{ color: '#4F3FF0', fontSize: 22 }} />
          <Typography
            variant="h6"
            sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 600, color: '#171A2B' }}
          >
            Your Friends
          </Typography>
          <Chip
            label={friends.length}
            size="small"
            sx={{
              backgroundColor: '#F1F5F9',
              color: '#64748B',
              fontWeight: 600,
            }}
          />
        </Stack>

        {friendsLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 3 }}>
            <CircularProgress size={24} sx={{ color: '#4F3FF0' }} />
            <Typography variant="body2" color="text.secondary">Loading friends list...</Typography>
          </Box>
        ) : friends.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2.5,
              border: '1.5px dashed #E3E6EF',
              backgroundColor: '#FAFBFC',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#171A2B', mb: 0.5 }}>
              No friends added yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share your friend code or enter a peer's code above to start sharing solved challenge logs!
            </Typography>
          </Paper>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ borderRadius: 3, border: '1px solid #E3E6EF', overflowX: 'auto' }}
          >
            <Table sx={{ minWidth: 460 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Connected Since</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {friends.map((friend) => (
                  <TableRow key={friend.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#171A2B' }}>
                      {friend.displayName}
                    </TableCell>
                    <TableCell sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                      {new Date(friend.respondedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          component={RouterLink}
                          to={`/friends/${friend.friendUserId}`}
                          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
                          sx={{ borderRadius: 2, fontWeight: 600, fontSize: '0.75rem', px: 1.8 }}
                        >
                          View Log
                        </Button>
                        <Tooltip title="Remove friend" arrow>
                          <IconButton
                            size="small"
                            onClick={() => setRemoveFriendTarget(friend)}
                            sx={{ color: '#64748B', '&:hover': { color: '#DC2626' } }}
                          >
                            <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Confirmation Dialog: Regenerate Code */}
      <Dialog
        open={regenConfirmOpen}
        onClose={() => setRegenConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 3, p: 1 } },
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
          Regenerate Friend Code?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569', fontSize: '0.9rem' }}>
            Your existing friend code will stop working immediately. Anyone trying to send a request using your previous code will not be able to find you.
            <br /><br />
            <strong>Note:</strong> Your existing friendships and pending requests will not be affected.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRegenConfirmOpen(false)} sx={{ color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {regenerateMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'Yes, Regenerate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog: Remove Friend */}
      <Dialog
        open={Boolean(removeFriendTarget)}
        onClose={() => setRemoveFriendTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 3, p: 1 } },
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
          Remove Friend?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569', fontSize: '0.9rem' }}>
            Are you sure you want to remove <strong>{removeFriendTarget?.displayName}</strong> as a friend?
            <br /><br />
            Both of you will immediately lose access to view each other's solved challenges and activity heatmaps.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoveFriendTarget(null)} sx={{ color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (removeFriendTarget) {
                removeMutation.mutate(removeFriendTarget.friendUserId);
              }
            }}
            disabled={removeMutation.isPending}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {removeMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'Remove Friend'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog: Decline Request */}
      <Dialog
        open={Boolean(declineTarget)}
        onClose={() => setDeclineTarget(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 3, p: 1 } },
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Space Grotesk", sans-serif', fontWeight: 700 }}>
          Decline Friend Request?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569', fontSize: '0.9rem' }}>
            Are you sure you want to decline the friend request from <strong>{declineTarget?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeclineTarget(null)} sx={{ color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (declineTarget) {
                declineMutation.mutate(declineTarget.id);
                setDeclineTarget(null);
              }
            }}
            disabled={declineMutation.isPending}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {declineMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'Decline Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Copy notification */}
      <Snackbar
        open={copiedSnackbar}
        autoHideDuration={2500}
        onClose={() => setCopiedSnackbar(false)}
        message="Friend code copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
