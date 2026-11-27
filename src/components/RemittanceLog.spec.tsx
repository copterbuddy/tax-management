import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import i18next from '../i18n/index';
import { RemittanceLog } from './RemittanceLog';
import type { RealizedGainResult } from '../types/trade';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const gain: RealizedGainResult = {
  sellTradeId: 'sell_allw',
  sellDate: '2026-02-13',
  symbol: 'ALLW',
  provider: 'Dime',
  sellQuantity: 7,
  sellRevenueUSD: 100,
  buyCostBasisUSD: 60,
  gainUSD: 40,
  gainPercent: 0.4,
  matchedLots: [],
  totalRemittedUSD: 75,
  remainingProceedsUSD: 25,
  taxableGainTHB: 960,
  remittances: [
    { id: 'r1', sellTradeId: 'sell_allw', amountUSD: 75, remitDate: '2026-03-09', fxRateTHB: 32 },
    { id: 'r2', sellTradeId: 'sell_allw', amountUSD: 180, remitDate: '2026-04-09', fxRateTHB: 32, unapplied: true },
  ],
};

function renderLog(overrides: Partial<RealizedGainResult> = {}) {
  const onEditRemittance = jest.fn();
  const onDeleteRemittance = jest.fn();
  const onSetDocRef = jest.fn();
  render(
    <RemittanceLog
      gains={[{ ...gain, ...overrides }]}
      onRecordRemit={jest.fn()}
      onEditRemittance={onEditRemittance}
      onDeleteRemittance={onDeleteRemittance}
      onSetDocRef={onSetDocRef}
    />
  );
  return { onEditRemittance, onDeleteRemittance, onSetDocRef };
}

beforeEach(async () => {
  await act(async () => { await i18next.changeLanguage('en'); });
});

// ─── Flagged records ────────────────────────────────────────────────────────

describe('RemittanceLog — unapplied remittances', () => {
  it('keeps a flagged record listed with a marker and a reason', () => {
    renderLog();

    expect(screen.getByText('Not counted')).toBeInTheDocument();
    expect(screen.getByText(/left out of every total/i)).toBeInTheDocument();
    expect(screen.getByText('2026-04-09')).toBeInTheDocument();
  });

  it('omits flagged amounts from the footer while still counting applied ones', () => {
    renderLog();

    // Applied: 75 USD -> 2400 THB; taxable 75 x 0.4 x 32 = 960 THB.
    const footer = screen.getByText(/^Total/).closest('tr') as HTMLTableRowElement;
    expect(footer).toHaveTextContent('$75.00');
    expect(footer).toHaveTextContent('฿2,400.00');
    expect(footer).toHaveTextContent('฿960.00');
    expect(footer).not.toHaveTextContent('$180.00');
    expect(screen.getByText(/^Total/)).toHaveTextContent('(1 remittances)');
  });

  it('passes a flagged record unchanged to the edit and delete handlers', () => {
    const { onEditRemittance, onDeleteRemittance } = renderLog();
    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });

    // Rows are newest-first, so the flagged record (2026-04-09) is the first row.
    fireEvent.click(editButtons[0]);
    expect(onEditRemittance).toHaveBeenCalledWith({
      id: 'r2',
      sellTradeId: 'sell_allw',
      amountUSD: 180,
      remitDate: '2026-04-09',
      fxRateTHB: 32,
      notes: undefined,
      unapplied: true,
    });

    fireEvent.click(deleteButtons[0]);
    expect(onDeleteRemittance).toHaveBeenCalledWith(expect.objectContaining({ id: 'r2', amountUSD: 180 }));
  });

  it('counts every record again once the flag is gone', () => {
    renderLog({ remittances: gain.remittances.map(r => ({ ...r, unapplied: undefined })) });

    expect(screen.queryByText('Not counted')).not.toBeInTheDocument();
    const footer = screen.getByText(/^Total/).closest('tr') as HTMLTableRowElement;
    expect(footer).toHaveTextContent('$255.00');
  });
});

// ─── Evidence link ──────────────────────────────────────────────────────────

describe('RemittanceLog — evidence link', () => {
  it('opens the dialog from the paperclip and saves the link', () => {
    const { onSetDocRef, onEditRemittance } = renderLog();

    const paperclips = document.querySelectorAll('.doc-link');
    expect(paperclips.length).toBe(2);
    const row = [...document.querySelectorAll('tbody tr')].find(tr => tr.textContent?.includes('2026-03-09'))!;
    fireEvent.click(row.querySelector('.doc-link') as HTMLElement);

    const input = document.querySelector('#doc-ref-url') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'https://example.com/slip.pdf' } });
    fireEvent.click(document.querySelector('.doc-dialog .btn-primary') as HTMLElement);

    expect(onSetDocRef).toHaveBeenCalledWith('sell_allw', 'r1', 'https://example.com/slip.pdf');
    expect(onEditRemittance).not.toHaveBeenCalled();
  });

  it('marks rows that already carry a document', () => {
    renderLog({
      remittances: [
        { id: 'r1', sellTradeId: 'sell_allw', amountUSD: 75, remitDate: '2026-03-09', fxRateTHB: 32, docRef: 'https://example.com/a.pdf' },
      ],
    });

    const paperclip = document.querySelector('.doc-link') as HTMLElement;
    expect(paperclip.className).toContain('has-doc');
  });
});

describe('RemittanceLog — stacked layout & quick filters', () => {
  it('marks the table with .remit-log-table and filters by search query and provider', () => {
    const otherGain: RealizedGainResult = {
      ...gain,
      sellTradeId: 'sell_msft',
      symbol: 'MSFT',
      provider: 'Liberator',
      remittances: [
        { id: 'r3', sellTradeId: 'sell_msft', amountUSD: 200, remitDate: '2026-05-01', fxRateTHB: 35, notes: 'wire transfer' },
      ],
    };
    const { container } = render(
      <RemittanceLog
        gains={[gain, otherGain]}
        onRecordRemit={jest.fn()}
        onEditRemittance={jest.fn()}
        onDeleteRemittance={jest.fn()}
        onSetDocRef={jest.fn()}
      />,
    );

    expect(container.querySelector('.trade-table.remit-log-table')).not.toBeNull();
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);

    fireEvent.change(screen.getByPlaceholderText('Search symbol or notes...'), { target: { value: 'msft' } });
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(container.querySelector('tbody')!.textContent).toContain('MSFT');
    expect(container.querySelector('tbody')!.textContent).toContain('@ 35.00');

    fireEvent.change(screen.getByPlaceholderText('Search symbol or notes...'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Liberator' }));
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
  });
});
