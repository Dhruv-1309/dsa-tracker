import { useAuth } from '../context/AuthContext';
import { useCallback } from 'react';

export function useApiClient() {
    const { token, logout } = useAuth();

    const fetchApi = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const headers = new Headers(options.headers);
        
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        
        if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(`/api${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401 || response.status === 403) {
            logout();
        }

        return response;
    }, [token, logout]);

    return fetchApi;
}
