import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for the frontend.
 * Only activates when VITE_SENTRY_DSN is set — safe to leave unset in local dev.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // 'development' | 'production'
    // Capture 10% of sessions for performance monitoring — adjust as needed
    tracesSampleRate: 0.1,
    // Ignore common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  });
}
