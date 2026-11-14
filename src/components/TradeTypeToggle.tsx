import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { TradeType } from '../types/trade';

interface TradeTypeToggleProps {
  value: TradeType;
  onChange: (type: TradeType) => void;
  labelId: string;
}

const OPTIONS: readonly TradeType[] = ['BUY', 'SELL'];

export function TradeTypeToggle({ value, onChange, labelId }: TradeTypeToggleProps) {
  const { t } = useTranslation();
  const buttonsRef = useRef<Record<TradeType, HTMLButtonElement | null>>({ BUY: null, SELL: null });

  const select = (next: TradeType) => {
    onChange(next);
    buttonsRef.current[next]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = OPTIONS.indexOf(value);
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (index + 1) % OPTIONS.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (index - 1 + OPTIONS.length) % OPTIONS.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = OPTIONS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const next = OPTIONS[nextIndex];
    if (next !== value) {
      select(next);
    }
  };

  return (
    <div className="trade-type-toggle" role="radiogroup" aria-labelledby={labelId}>
      {OPTIONS.map((type) => {
        const checked = type === value;
        const label = type === 'BUY' ? t('trade:tradeTypeBuy') : t('trade:tradeTypeSell');

        return (
          <button
            key={type}
            ref={(element) => {
              buttonsRef.current[type] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={label}
            tabIndex={checked ? 0 : -1}
            className={`trade-type-btn trade-type-btn--${type.toLowerCase()}`}
            onClick={() => select(type)}
            onKeyDown={handleKeyDown}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}