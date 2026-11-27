import { useTranslation } from 'react-i18next';

export interface ToastNotice {
  message: string;
  variant?: 'warning' | 'error' | 'info';
}

interface ToastProps {
  notice: ToastNotice;
  onDismiss: () => void;
}

export function Toast({ notice, onDismiss }: ToastProps) {
  const { t } = useTranslation();
  const variant = notice.variant ?? 'warning';
  const role = variant === 'info' ? 'status' : 'alert';

  return (
    <div className={`toast-banner toast-${variant}`} role={role}>
      <span className="toast-message">{notice.message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={onDismiss}
        aria-label={t('common:dismiss')}
      >
        &times;
      </button>
    </div>
  );
}
