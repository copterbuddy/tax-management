import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

  // ─── Date Validation Tests ──────────────────────────────────────────────
  
  test('date input has max attribute set to today', () => {
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
    expect(dateInput.max).toBe(today);
  });

  test('rejects future date with validation error', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    render(
      <DividendForm 
        open={true} 
        onClose={mockOnClose}
        onSave={() => {}}
        editRecord={undefined}
        availableSymbols={['AAPL']}
      />
    );
    
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: tomorrowStr } });
    
    const saveBtn = screen.getByRole('button', { name: /บันทึก|Save/i });
    fireEvent.click(saveBtn);
    
    // wait for state update and error render
    await act(async () => {});
    
    // i18n not configured in test — check for key
    expect(screen.getByText(/dividend:formDateFutureError|วันที่ได้รับไม่สามารถเลือกเกินวันปัจจุบันได้|Date received cannot be later than today/i)).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('accepts today as valid date', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    render(
      <DividendForm 
        open={true} 
        onClose={mockOnClose}
        onSave={() => {}}
        editRecord={undefined}
        availableSymbols={['AAPL']}
      />
    );
    
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    expect(dateInput.value).toBe(today);
    
    const symbolSelect = screen.getByLabelText(/symbol/i) as HTMLSelectElement;
    fireEvent.change(symbolSelect, { target: { value: 'AAPL' } });
    
    const grossInput = screen.getByLabelText(/gross|จำนวนเงินปันผล/i) as HTMLInputElement;
    fireEvent.change(grossInput, { target: { value: '100' } });
    
    const fxInput = screen.getByLabelText(/fx|fx rate/i) as HTMLInputElement;
    fireEvent.change(fxInput, { target: { value: '35' } });
    
    const saveBtn = screen.getByRole('button', { name: /บันทึก|Save/i });
    fireEvent.click(saveBtn);
    
    await act(async () => {});
    
    expect(screen.queryByText(/วันที่ได้รับไม่สามารถเลือกเกินวันปัจจุบันได้|Date received cannot be later than today/i)).not.toBeInTheDocument();
  });

  test('accepts past date as valid', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    render(
      <DividendForm 
        open={true} 
        onClose={mockOnClose}
        onSave={() => {}}
        editRecord={undefined}
        availableSymbols={['AAPL']}
      />
    );
    
    const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: yesterdayStr } });
    
    const symbolSelect = screen.getByLabelText(/symbol/i) as HTMLSelectElement;
    fireEvent.change(symbolSelect, { target: { value: 'AAPL' } });
    
    const grossInput = screen.getByLabelText(/gross|จำนวนเงินปันผล/i) as HTMLInputElement;
    fireEvent.change(grossInput, { target: { value: '100' } });
    
    const fxInput = screen.getByLabelText(/fx|fx rate/i) as HTMLInputElement;
    fireEvent.change(fxInput, { target: { value: '35' } });
    
    const saveBtn = screen.getByRole('button', { name: /บันทึก|Save/i });
    fireEvent.click(saveBtn);
    
    await act(async () => {});
    
    expect(screen.queryByText(/วันที่ได้รับไม่สามารถเลือกเกินวันปัจจุบันได้|Date received cannot be later than today/i)).not.toBeInTheDocument();
  });
});