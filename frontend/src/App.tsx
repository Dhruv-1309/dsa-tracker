import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/theme';
import { Box, CircularProgress } from '@mui/material';

// Lazy-loaded pages for fast initial bundle load
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ProblemList = lazy(() => import('./pages/ProblemList'));
const ProblemForm = lazy(() => import('./pages/ProblemForm'));
const ProblemAttempts = lazy(() => import('./pages/ProblemAttempts'));
const RevisitQueue = lazy(() => import('./pages/RevisitQueue'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TopicsPage = lazy(() => import('./pages/TopicsPage'));
const Settings = lazy(() => import('./pages/Settings'));

// Aggressive caching to eliminate repeated network calls
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes fresh cache
      gcTime: 1000 * 60 * 15,    // Keep unused data in memory for 15 minutes
    },
  },
});

const PageFallback = () => (
  <Box sx={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
    <CircularProgress size={36} sx={{ color: '#4F3FF0' }} />
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/problems" element={<ProblemList />} />
                  <Route path="/queue" element={<RevisitQueue />} />
                  <Route path="/topics" element={<TopicsPage />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/problems/new" element={<ProblemForm />} />
                  <Route path="/problems/:id/edit" element={<ProblemForm />} />
                  <Route path="/problems/:id/attempts" element={<ProblemAttempts />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
