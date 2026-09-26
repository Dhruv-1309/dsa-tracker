import { useAuth } from '../context/AuthContext';
import { useCallback } from 'react';
import { API_BASE_URL } from './config';

const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds — handles Render cold-start delays

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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
                ...options,
                headers,
                signal: controller.signal,
            });

            // Only force-logout if we actually sent a token and the server says it's invalid.
            // Do NOT logout on network errors or timeouts.
            if ((response.status === 401 || response.status === 403) && token) {
                logout();
            }

            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }, [token, logout]);

    return fetchApi;
}
