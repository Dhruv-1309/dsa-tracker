/**
 * Base API URL configured via environment variables.
 * In development, this is empty so requests route through Vite's local proxy.
 * In production (e.g. Vercel -> Render), set VITE_API_BASE_URL to your backend's URL.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
