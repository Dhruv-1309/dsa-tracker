/**
 * Safely sanitizes external URLs to prevent Stored XSS via `javascript:` or `data:` URI schemes.
 * Only HTTP and HTTPS schemes are permitted for external links.
 */
export function sanitizeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}
