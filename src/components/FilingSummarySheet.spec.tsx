import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import i18next from '../i18n/index';
import { FilingSummarySheet } from './FilingSummarySheet';
import type { FilingFigures } from '../engine/filingSummary';

const figures: FilingFigures = {
  year: 2026,
  dividendGrossTHB: 15.94,
  dividendCreditTHB: 2.39,
  capitalGainTHB: 10958.25,
  totalAssessableTHB: 10974.19,
  remittedUSD: 15881.86,
};

beforeEach(async () => {
  await act(async () => { await i18next.changeLanguage('th'); });
});

describe('FilingSummarySheet', () => {
  it('reports the year and the figures a return asks for', () => {
    render(<FilingSummarySheet figures={figures} issues={[]} onExport={() => {}} onClose={() => {}} onLock={() => {}} onUnlock={() => {}} />);

    expect(screen.getByRole('heading', { name: /2569|2026/ })).toBeInTheDocument();
    expect(screen.getByText('฿15.94')).toBeInTheDocument();
    expect(screen.getAllByText('฿2.39').length).toBeGreaterThan(0);
    expect(screen.getByText('฿10,958.25')).toBeInTheDocument();
    expect(screen.getByText('฿10,974.19')).toBeInTheDocument();
  });

  it('says the year is ready when nothing blocks it', () => {
    render(<FilingSummarySheet figures={figures} issues={[]} onExport={() => {}} onClose={() => {}} onLock={() => {}} onUnlock={() => {}} />);
    expect(screen.getByText(/พร้อมยื่น/)).toBeInTheDocument();
  });

  it('lists blocking issues instead of the ready line', () => {
    render(
      <FilingSummarySheet
        figures={figures}
        issues={[{ code: 'unapplied', count: 2 }]}
        onExport={() => {}}
        onClose={() => {}}
        onLock={() => {}}
        onUnlock={() => {}}
      />,
    );

    expect(screen.getByText(/2 รายการนำเข้า/)).toBeInTheDocument();
    expect(screen.queryByText(/พร้อมยื่น/)).toBeNull();
  });

  it('translates the issues into English', async () => {
    await act(async () => { await i18next.changeLanguage('en'); });
    render(
      <FilingSummarySheet
        figures={figures}
        issues={[{ code: 'noData', count: 0 }]}
        onExport={() => {}}
        onClose={() => {}}
        onLock={() => {}}
        onUnlock={() => {}}
      />,
    );

    expect(screen.getByText(/No remittances recorded for 2026/)).toBeInTheDocument();
  });

  it('calls export and close', () => {
    const onExport = jest.fn();
    const onClose = jest.fn();
    const { container } = render(
      <FilingSummarySheet figures={figures} issues={[]} onExport={onExport} onClose={onClose}
        onLock={() => {}} onUnlock={() => {}} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /CSV/ }));
    fireEvent.click(container.querySelector('.form-actions .btn-secondary') as HTMLElement);

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── Locked year ────────────────────────────────────────────────────────────

describe('FilingSummarySheet — year lock', () => {
  const locked = { lockedAt: '2027-03-01T10:00:00.000Z', figures };

  it('offers to lock when the year is not locked', () => {
    render(
      <FilingSummarySheet figures={figures} issues={[]} onLock={() => {}} onUnlock={() => {}}
        onExport={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /ล็อกปีนี้/ })).toBeInTheDocument();
  });

  it('reports the lock date and that the figures still match', () => {
    render(
      <FilingSummarySheet figures={figures} issues={[]} locked={locked} onLock={() => {}} onUnlock={() => {}}
        onExport={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByText(/2027-03-01/)).toBeInTheDocument();
    expect(screen.getByText(/ยังตรงกับที่ยื่นไว้/)).toBeInTheDocument();
  });

  it('names the field that moved since filing', () => {
    const moved = { ...figures, capitalGainTHB: 11000, totalAssessableTHB: 11015.94 };
    render(
      <FilingSummarySheet figures={moved} issues={[]} locked={locked} onLock={() => {}} onUnlock={() => {}}
        onExport={() => {}} onClose={() => {}} />,
    );
    expect(document.querySelector('.filing-lock-warn')?.textContent).toMatch(/กำไรจากเงินลงทุน/);
    expect(screen.queryByText(/ยังตรงกับที่ยื่นไว้/)).toBeNull();
  });

  it('unlocks through the button', () => {
    const onUnlock = jest.fn();
    render(
      <FilingSummarySheet figures={figures} issues={[]} locked={locked} onLock={() => {}} onUnlock={onUnlock}
        onExport={() => {}} onClose={() => {}} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /ปลดล็อก/ }));
    expect(onUnlock).toHaveBeenCalledTimes(1);
  });
});

// ─── Tax estimate ───────────────────────────────────────────────────────────

describe('FilingSummarySheet — tax estimate', () => {
  const renderSheet = () =>
    render(
      <FilingSummarySheet figures={figures} issues={[]} onLock={() => {}} onUnlock={() => {}}
        onExport={() => {}} onClose={() => {}} />,
    );

  it('is collapsed until asked, with the standard deduction prefilled', () => {
    const { container } = renderSheet();
    const details = container.querySelector('.filing-estimate') as HTMLDetailsElement;

    expect(details.open).toBe(false);
    expect((container.querySelector('#estimate-deductions') as HTMLInputElement).value).toBe('160000');
  });

  it('recomputes the tax when other income is entered', () => {
    const { container } = renderSheet();
    (container.querySelector('.filing-estimate') as HTMLDetailsElement).open = true;

    fireEvent.change(container.querySelector('#estimate-other-income') as HTMLInputElement, {
      target: { value: '500000' },
    });

    const lines = container.querySelector('.estimate-lines')?.textContent ?? '';
    expect(lines).toContain('350,974.19');
    expect(lines).toContain('12,597.42');
    expect(lines).toContain('12,595.03');
    expect(lines).toContain('10%');
  });

  it('shows the overpaid line when the credit covers the tax', () => {
    const { container } = renderSheet();
    (container.querySelector('.filing-estimate') as HTMLDetailsElement).open = true;

    fireEvent.change(container.querySelector('#estimate-deductions') as HTMLInputElement, {
      target: { value: '200000' },
    });

    expect(container.querySelector('.estimate-overpaid')?.textContent).toBe('฿2.39');
  });
});
