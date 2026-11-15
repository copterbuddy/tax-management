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
    render(<FilingSummarySheet figures={figures} issues={[]} onExport={() => {}} onClose={() => {}} />);

    expect(screen.getByRole('heading', { name: /2569|2026/ })).toBeInTheDocument();
    expect(screen.getByText('฿15.94')).toBeInTheDocument();
    expect(screen.getByText('฿2.39')).toBeInTheDocument();
    expect(screen.getByText('฿10,958.25')).toBeInTheDocument();
    expect(screen.getByText('฿10,974.19')).toBeInTheDocument();
  });

  it('says the year is ready when nothing blocks it', () => {
    render(<FilingSummarySheet figures={figures} issues={[]} onExport={() => {}} onClose={() => {}} />);
    expect(screen.getByText(/พร้อมยื่น/)).toBeInTheDocument();
  });

  it('lists blocking issues instead of the ready line', () => {
    render(
      <FilingSummarySheet
        figures={figures}
        issues={[{ code: 'unapplied', count: 2 }]}
        onExport={() => {}}
        onClose={() => {}}
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
      />,
    );

    expect(screen.getByText(/No remittances recorded for 2026/)).toBeInTheDocument();
  });

  it('calls export and close', () => {
    const onExport = jest.fn();
    const onClose = jest.fn();
    const { container } = render(
      <FilingSummarySheet figures={figures} issues={[]} onExport={onExport} onClose={onClose} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /CSV/ }));
    fireEvent.click(container.querySelector('.form-actions .btn-secondary') as HTMLElement);

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});