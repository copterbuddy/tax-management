// ─── Error Boundary ────────────────────────────────────────────────────────
// Catches render errors in the component tree and shows a graceful fallback UI
// instead of a white screen. Uses react-error-boundary for production-grade handling.

import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

// ─── Fallback UI ───────────────────────────────────────────────────────────

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { t } = useTranslation();
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div className="error-boundary-fallback">
      <div className="error-boundary-card">
        <div className="error-boundary-icon">⚠️</div>
        <h2>{t('common:errorTitle')}</h2>
        <p>{t('common:errorMessage')}</p>
        {message && (
          <details className="error-boundary-details">
            <summary>Details</summary>
            <pre>{message}</pre>
          </details>
        )}
        <button className="btn btn-primary" onClick={resetErrorBoundary}>
          {t('common:reload')}
        </button>
      </div>
    </div>
  );
}

// ─── Wrapper ───────────────────────────────────────────────────────────────

interface AppErrorBoundaryProps {
  children: ReactNode;
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset app state if needed — currently just re-renders
      }}
      onError={(error, info) => {
        console.error('Uncaught error:', error, info);
        // Could send to error tracking service here
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
