import { configureStore } from '@reduxjs/toolkit';
import dividendReducer, { repairRemittanceData, addDividend } from './dividendSlice';
import type { DividendRecord, DividendRemittance } from '../types/trade';

describe('repairRemittanceData', () => {
  it('copies remitTHB to reportableIncomeTHB when different', () => {
    const store = configureStore({ reducer: { dividend: dividendReducer } });
    const record: DividendRecord = {
      id: 'div_bad',
      date: '2026-01-15',
      symbol: 'AAPL',
      country: 'US',
      grossAmountUSD: 1000,
      whtRate: 15,
      whtAmountUSD: 150,
      netAmountUSD: 850,
      dividendFxRate: 30, // wrong rate used for reportableIncome
      grossAmountTHB: 35000,
      whtAmountTHB: 5250,
      netAmountTHB: 29750,
      totalRemittedUSD: 500,
      remainingToRemitUSD: 350,
      remittances: [
        {
          id: 'rem_bad',
          dividendId: 'div_bad',
          amountUSD: 500,
          remitDate: '2026-06-01',
          remitFxRate: 31,
          remitTHB: 15500, // correct: 500 * 31
          reportableIncomeTHB: 15000, // wrong: 500 * 30 (dividendFxRate)
          whtCreditTHB: 2750,
        } as DividendRemittance,
      ],
      notes: undefined,
    };

    store.dispatch(addDividend(record));
    // Before repair: different
    expect(store.getState().dividend.records[0].remittances[0].reportableIncomeTHB).toBe(15000);

    store.dispatch(repairRemittanceData());

    // After repair: fixed
    expect(store.getState().dividend.records[0].remittances[0].reportableIncomeTHB).toBe(15500);
    expect(store.getState().dividend.records[0].remittances[0].reportableIncomeTHB).toBe(
      store.getState().dividend.records[0].remittances[0].remitTHB
    );
  });

  it('leaves correct remittances unchanged', () => {
    const store = configureStore({ reducer: { dividend: dividendReducer } });
    const record: DividendRecord = {
      id: 'div_ok',
      date: '2026-01-15',
      symbol: 'AAPL',
      country: 'US',
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
      notes: undefined,
    };
    store.dispatch(addDividend(record));

    // No remittances to repair — should not crash
    expect(() => store.dispatch(repairRemittanceData())).not.toThrow();
  });
});
