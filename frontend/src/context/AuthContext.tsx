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
const COOKIE_DAYS = 30;

function setTokenCookie(tokenVal: string, days = COOKIE_DAYS) {
    const maxAge = days * 24 * 60 * 60;
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(tokenVal)}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

function getTokenCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const nameEQ = `${TOKEN_KEY}=`;
    const parts = document.cookie.split(';');
    for (let i = 0; i < parts.length; i++) {
        const c = parts[i].trim();
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length));
        }
    }
    return null;
}

function removeTokenCookie() {
    if (typeof document === 'undefined') return;
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

function getPersistedToken(): string | null {
    // 1. Try reading from cookie first
    const cookieToken = getTokenCookie();
    if (cookieToken) return cookieToken;

    // 2. Fall back to localStorage (and migrate to cookie)
    try {
        const localToken = localStorage.getItem(TOKEN_KEY);
        if (localToken) {
            setTokenCookie(localToken);
            return localToken;
        }
    } catch {
        // localStorage might be unavailable or restricted in some privacy modes
    }
    return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setTokenState] = useState<string | null>(() => getPersistedToken());
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
        removeTokenCookie();
        try {
            localStorage.removeItem(TOKEN_KEY);
        } catch {
            // Ignore storage errors
        }
        setTokenState(null);
        setUser(null);
    }, [token]);

    const setToken = useCallback((newToken: string | null) => {
        if (newToken) {
            setTokenCookie(newToken);
            try {
                localStorage.setItem(TOKEN_KEY, newToken);
            } catch {
                // Ignore storage errors
            }
        } else {
            removeTokenCookie();
            try {
                localStorage.removeItem(TOKEN_KEY);
            } catch {
                // Ignore storage errors
            }
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
