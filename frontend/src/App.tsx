import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ProblemList from './pages/ProblemList';
import ProblemForm from './pages/ProblemForm';
import ProblemAttempts from './pages/ProblemAttempts';
import RevisitQueue from './pages/RevisitQueue';
import Dashboard from './pages/Dashboard';
import TopicsPage from './pages/TopicsPage';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/problems" element={<ProblemList />} />
              <Route path="/queue" element={<RevisitQueue />} />
              <Route path="/topics" element={<TopicsPage />} />
              <Route path="/problems/new" element={<ProblemForm />} />
              <Route path="/problems/:id/edit" element={<ProblemForm />} />
              <Route path="/problems/:id/attempts" element={<ProblemAttempts />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
