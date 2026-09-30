import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import { Box } from '@mui/material';

export function ProtectedRoute() {
    const { token } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F5F6FA', display: 'flex', flexDirection: 'column' }}>
            <Box
                component="a"
                href="#main-content"
                sx={{
                    position: 'absolute',
                    top: -9999,
                    left: -9999,
                    zIndex: 9999,
                    px: 2.5,
                    py: 1.25,
                    backgroundColor: '#4F3FF0',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 4px 12px rgba(79, 63, 240, 0.3)',
                    '&:focus': {
                        top: 0,
                        left: 16,
                    },
                }}
            >
                Skip to main content
            </Box>
            <Navbar />
            <Box component="main" id="main-content" tabIndex={-1} sx={{ flexGrow: 1, outline: 'none' }}>
                <Outlet />
            </Box>
            <Footer />
        </Box>
    );
}
