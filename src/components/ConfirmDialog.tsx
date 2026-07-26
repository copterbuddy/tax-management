import { useEffect } from 'react';

interface ConfirmDialogProps {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div className="trade-form-overlay" onClick={onCancel}>
      <div className="trade-form-modal" style={{ width: 400 }} onClick={e => e.stopPropagation()}>
        <div className="trade-form-header">
          <h2>{message}</h2>
        </div>
        <div className="trade-form">
          <div className="form-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
            <button className="btn btn-secondary" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
              autoFocus
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
