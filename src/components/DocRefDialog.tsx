import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DocRefDialogProps {
  /** Remittance label shown in the title, e.g. "ALLW · 2026-04-07". */
  subject: string;
  value?: string;
  onSave: (docRef: string | null) => void;
  onClose: () => void;
}

const isWebUrl = (value: string): boolean => /^https?:\/\/\S+$/i.test(value.trim());

/**
 * Attach, change or remove the link to a remittance's supporting document.
 * Knows nothing about trades or dividends — one dialog for both.
 */
export function DocRefDialog({ subject, value, onSave, onClose }: DocRefDialogProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState(value ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      onSave(null);
      return;
    }
    if (!isWebUrl(trimmed)) {
      setError(t('remittance:docInvalid'));
      return;
    }
    onSave(trimmed);
  };

  return (
    <div className="trade-form-overlay" role="dialog" aria-modal="true" aria-label={t('remittance:docDialogTitle')}>
      <div className="trade-form-modal doc-dialog">
        <div className="trade-form-header">
          <h2>{t('remittance:docDialogTitle')}</h2>
          <button className="btn-close" onClick={onClose} aria-label={t('common:close')}>
            &times;
          </button>
        </div>

        <p className="filing-subtitle">{subject} — {t('remittance:docHint')}</p>

        {value && (
          <p className="doc-open-line">
            <a href={value} target="_blank" rel="noopener noreferrer">{t('remittance:docOpen')}</a>
          </p>
        )}

        <div className="form-group">
          <label htmlFor="doc-ref-url">{t('remittance:docUrlLabel')}</label>
          <input
            id="doc-ref-url"
            type="url"
            inputMode="url"
            placeholder="https://"
            value={url}
            onChange={e => { setUrl(e.target.value); setError(null); }}
            className={error ? 'input-error' : ''}
          />
          {error && <span className="error-msg">{error}</span>}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common:cancel')}
          </button>
          {value && (
            <button type="button" className="btn btn-secondary" onClick={() => onSave(null)}>
              {t('remittance:docRemove')}
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            {t('remittance:docSave')}
          </button>
        </div>
      </div>
    </div>
  );
}
