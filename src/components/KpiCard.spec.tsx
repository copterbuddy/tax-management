import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { KpiCard } from './KpiCard';

// ─── Variants the component defines ─────────────────────────────────────────
// "default" applies no extra class; every other variant maps to `kpi-<variant>`.
const VARIANTS = ['default', 'positive', 'negative', 'neutral', 'highlight', 'warning'] as const;

describe('KpiCard variants', () => {
  it.each(VARIANTS)('renders variant "%s" with its expected class', variant => {
    const { container } = render(<KpiCard title="t" value="1" variant={variant} />);
    const card = container.querySelector('.kpi-card');
    expect(card).not.toBeNull();
    if (variant === 'default') {
      expect(card!.className.trim()).toBe('kpi-card');
    } else {
      expect(card!.classList.contains(`kpi-${variant}`)).toBe(true);
    }
  });

  it('defaults to the default variant when none is given', () => {
    const { container } = render(<KpiCard title="t" value="1" />);
    expect(container.querySelector('.kpi-card')!.className.trim()).toBe('kpi-card');
  });
});
