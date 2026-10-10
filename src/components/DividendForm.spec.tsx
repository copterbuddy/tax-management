import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { DividendForm } from './DividendForm';

// ─── Unit test for DividendForm modal display ───────────────────────────────────

describe('DividendForm modal display', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    mockOnClose.mockClear();
  });

  test('renders overlay when open=true', () => {
    render(
      <DividendForm 
        open={true} 
        onClose={mockOnClose}
        onSave={() => {}}
        editRecord={undefined}
        availableSymbols={['AAPL', 'MSFT']}
      />
    );
    
    // Modal should have role="dialog"
    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
  });

  test('returns null when open=false', () => {
    render(
      <DividendForm 
        open={false} 
        onClose={mockOnClose}
        onSave={() => {}}
        editRecord={undefined}
        availableSymbols={[]}
      />
    );
    
    // No modal should be rendered
    const dialog = screen.queryByRole('dialog');
    expect(dialog).toBeNull();
  });

  test('clicking modal content does not close modal', () => {
    render(
      <DividendForm 
        open={true} 
        onClose={mockOnClose}
        onSave={() => {}}
        editRecord={undefined}
        availableSymbols={[]}
      />
    );
    
    // Click on the modal content
    const modal = screen.getByRole('dialog');
    fireEvent.click(modal);
    
    // onClose should NOT be called
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('modal has proper accessibility attributes', () => {
    render(
      <DividendForm 
        open={true} 
        onClose={mockOnClose}
        onSave={() => {}}
        editRecord={undefined}
        availableSymbols={[]}
      />
    );
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  test('date field defaults to today when opening for new dividend', () => {
    render(
      <DividendForm 
        open={true} 
        onClose={mockOnClose}
        onSave={() => {}}
        editRecord={undefined}
        availableSymbols={[]}
      />
    );
    
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    const today = new Date().toISOString().split('T')[0];
    expect(dateInput.value).toBe(today);
  });

  test('date field shows editRecord date when editing existing dividend', () => {
    const existingRecord = {
      id: 'div_1',
      date: '2026-03-15',
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
    };
    
    render(
      <DividendForm 
        open={true} 
        onClose={mockOnClose}
        onSave={() => {}}
        editRecord={existingRecord}
        availableSymbols={[]}
      />
    );
    
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    expect(dateInput.value).toBe('2026-03-15');
  });
});