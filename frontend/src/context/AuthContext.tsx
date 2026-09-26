import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../api/config';
import type { UserProfile } from '../types/user';

interface AuthContextType {
    token: string | null;
    user: UserProfile | null;
    loading: boolean;
    setToken: (token: string | null) => void;
    setUser: (user: UserProfile | null) => void;
    refreshUser: () => Promise<UserProfile | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'dsa_tracker_token';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const logout = useCallback(() => {
        if (token) {
            fetch(`${API_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).catch(() => {
                // Ignore network errors on logout
            });
        }
        localStorage.removeItem(TOKEN_KEY);
        setTokenState(null);
        setUser(null);
    }, [token]);

    const setToken = useCallback((newToken: string | null) => {
        if (newToken) {
            localStorage.setItem(TOKEN_KEY, newToken);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
        setTokenState(newToken);
    }, []);

    const fetchUserProfile = useCallback(async (authToken: string): Promise<UserProfile | null> => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (res.ok) {
                const profile: UserProfile = await res.json();
                setUser(profile);
                return profile;
            } else if (res.status === 401 || res.status === 403) {
                logout();
                return null;
            }
        } catch (err) {
            console.error('Failed to load user profile', err);
        }
        return null;
    }, [logout]);

    const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
        if (!token) return null;
        return fetchUserProfile(token);
    }, [token, fetchUserProfile]);

    useEffect(() => {
        let isMounted = true;
        if (token) {
            fetchUserProfile(token).finally(() => {
                if (isMounted) setLoading(false);
            });
        } else {
            setUser(null);
            setLoading(false);
        }
        return () => {
            isMounted = false;
        };
    }, [token, fetchUserProfile]);

    return (
        <AuthContext.Provider value={{ token, user, loading, setToken, setUser, refreshUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
