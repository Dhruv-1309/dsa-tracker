/**
 * Base API URL configured via environment variables.
 * In development, this is empty so requests route through Vite's local proxy.
 * In production (e.g. Vercel -> Render), set VITE_API_BASE_URL to your backend's URL.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export const GOOGLE_CLIENT_ID: string =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID || '268901294445-dg2ejtiatbgtfu5jp1vc9mpn5abrrbt7.apps.googleusercontent.com').trim();
