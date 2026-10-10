import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/react';
import { DividendRemitForm } from './DividendRemitForm';

describe('DividendRemitForm submit button state', () => {
  const mockOnClose = jest.fn();
  const mockOnRemit = jest.fn();

  const dividend = {
    id: 'div-1',
    date: '2026-09-01',
    symbol: 'AAPL',
    country: 'US' as const,
    grossAmountUSD: 1000,
    whtRate: 15,
    whtAmountUSD: 150,
    netAmountUSD: 850,
    dividendFxRate: 35,
    grossAmountTHB: 35000,
    whtAmountTHB: 5250,
    netAmountTHB: 29750,
    totalRemittedUSD: 0,
    remainingToRemitUSD: 850,
    remittances: [],
    notes: '',
  };

  function getSubmitButton(container: HTMLElement) {
    return container.querySelector('.btn-primary') as HTMLButtonElement;
  }

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnRemit.mockClear();
  });

  test('submit disabled when amount is 0', () => {
    const { container } = render(
      <DividendRemitForm
        open={true}
        onClose={mockOnClose}
        onRemit={mockOnRemit}
        dividend={dividend}
      />,
    );
    expect(getSubmitButton(container)).toHaveAttribute('disabled');
  });

  test('submit disabled when amount is negative', () => {
    const { container } = render(
      <DividendRemitForm
        open={true}
        onClose={mockOnClose}
        onRemit={mockOnRemit}
        dividend={dividend}
      />,
    );
    fireEvent.change(container.querySelector('#dremit-amount')!, {
      target: { value: '-50' },
    });
    expect(getSubmitButton(container)).toHaveAttribute('disabled');
  });

  test('submit disabled when FX rate is 0', () => {
    const { container } = render(
      <DividendRemitForm
        open={true}
        onClose={mockOnClose}
        onRemit={mockOnRemit}
        dividend={dividend}
      />,
    );
    fireEvent.change(container.querySelector('#dremit-fx')!, {
      target: { value: '0' },
    });
    expect(getSubmitButton(container)).toHaveAttribute('disabled');
  });

  test('submit disabled when date is missing', () => {
    const { container } = render(
      <DividendRemitForm
        open={true}
        onClose={mockOnClose}
        onRemit={mockOnRemit}
        dividend={dividend}
      />,
    );
    fireEvent.change(container.querySelector('#dremit-date')!, {
      target: { value: '' },
    });
    expect(getSubmitButton(container)).toHaveAttribute('disabled');
  });

  test('submit enabled when amount, FX, and date are all valid', () => {
    const { container } = render(
      <DividendRemitForm
        open={true}
        onClose={mockOnClose}
        onRemit={mockOnRemit}
        dividend={dividend}
      />,
    );
    fireEvent.change(container.querySelector('#dremit-amount')!, {
      target: { value: '100' },
    });
    fireEvent.change(container.querySelector('#dremit-fx')!, {
      target: { value: '35' },
    });
    fireEvent.change(container.querySelector('#dremit-date')!, {
      target: { value: '2026-10-10' },
    });
    expect(getSubmitButton(container)).not.toHaveAttribute('disabled');
  });

  test('submit disabled when amount is empty string', () => {
    const { container } = render(
      <DividendRemitForm
        open={true}
        onClose={mockOnClose}
        onRemit={mockOnRemit}
        dividend={dividend}
      />,
    );
    fireEvent.change(container.querySelector('#dremit-amount')!, {
      target: { value: '' },
    });
    expect(getSubmitButton(container)).toHaveAttribute('disabled');
  });
});