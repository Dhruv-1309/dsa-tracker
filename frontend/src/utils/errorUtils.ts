/**
 * Utility for translating technical, server, and network errors into
 * clean, simple, and friendly messages for end users.
 */

const TECHNICAL_PATTERNS = [
  /<!doctype/i,
  /<html/i,
  /<body/i,
  /internal server error/i,
  /bad gateway/i,
  /gateway time-out/i,
  /nullpointer/i,
  /psqlexception/i,
  /sqlexception/i,
  /syntaxerror/i,
  /failed to fetch/i,
  /networkerror/i,
  /econnrefused/i,
  /constraintviolation/i,
  /hibernate/i,
  /stack trace/i,
  /correlation id/i,
  /cannot deserialize/i,
  /unrecognized token/i,
  /unexpected token/i,
  /no static resource/i,
];

/**
 * Sanitizes an error message: transforms raw technical exceptions or HTML into human-readable messages.
 */
export function sanitizeErrorMessage(
  msg: string | null | undefined,
  statusCode?: number,
  fallback = 'Something went wrong. Please try again in a moment.'
): string {
  if (!msg || typeof msg !== 'string') {
    if (statusCode === 401) return 'Your session has expired. Please log in again.';
    if (statusCode === 403) return 'You do not have permission to perform this action.';
    if (statusCode === 404) return 'The requested item could not be found.';
    if (statusCode === 429) return 'Too many requests. Please wait a moment before trying again.';
    if (statusCode && statusCode >= 500) return 'The server is temporarily busy. Please try again in a moment.';
    return fallback;
  }

  const trimmed = msg.trim();

  // If message contains HTML or technical stack traces
  if (TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    if (statusCode === 404) return 'The requested item could not be found.';
    if (statusCode === 429) return 'Too many requests. Please wait a moment before trying again.';
    return 'The server is temporarily taking longer to respond. Please try again in a moment.';
  }

  // Friendly rewrites for common backend validation and exception strings
  if (/must be a well-formed email address/i.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  if (/newpassword.*size must be between 8/i.test(trimmed) || /size must be between 8 and/i.test(trimmed)) {
    return 'New password must be at least 8 characters long.';
  }
  if (/password.*size must be between 6/i.test(trimmed) || /size must be between 6 and/i.test(trimmed)) {
    return 'Password must be at least 6 characters long.';
  }
  if (/size must be between 2 and 50/i.test(trimmed)) {
    return 'Username must be between 2 and 50 characters.';
  }
  if (/must not be blank/i.test(trimmed)) {
    return 'Please fill in all required fields.';
  }
  if (/Email already exists/i.test(trimmed) || /duplicate key/i.test(trimmed)) {
    return 'An account with this email already exists.';
  }
  if (/Invalid email or password/i.test(trimmed) || /Bad credentials/i.test(trimmed)) {
    return 'Invalid email or password. Please try again.';
  }
  if (/Current password does not match/i.test(trimmed)) {
    return 'The current password you entered is incorrect.';
  }
  if (/Access denied: You are not accepted friends/i.test(trimmed)) {
    return 'You must be connected as friends to view this.';
  }

  // Avoid excessively long technical output
  if (trimmed.length > 200) {
    return 'An unexpected error occurred. Please try again in a moment.';
  }

  return trimmed;
}

/**
 * Extracts a friendly error message from a fetch Response.
 * Never throws and safely handles non-JSON or HTML server errors.
 */
export async function extractApiErrorMessage(
  res: Response,
  fallback = 'Something went wrong. Please try again.'
): Promise<string> {
  try {
    const text = await res.text();
    if (!text) {
      return sanitizeErrorMessage(null, res.status, fallback);
    }

    try {
      const data = JSON.parse(text);
      const rawError = data?.error || data?.message;
      return sanitizeErrorMessage(rawError, res.status, fallback);
    } catch {
      // Non-JSON response (e.g. HTML 502/504 gateway pages)
      return sanitizeErrorMessage(text, res.status, fallback);
    }
  } catch {
    return sanitizeErrorMessage(null, res.status, fallback);
  }
}

/**
 * Converts any caught error into a friendly message without technical terms.
 */
export function getFriendlyErrorMessage(
  err: unknown,
  fallback = 'Unable to connect to the server. Please check your internet connection and try again.'
): string {
  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return 'The request timed out. Please check your connection and try again.';
    }
    return sanitizeErrorMessage(err.message, undefined, fallback);
  }
  if (typeof err === 'string') {
    return sanitizeErrorMessage(err, undefined, fallback);
  }
  return fallback;
}
