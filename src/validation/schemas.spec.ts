/**
 * Validation Schemas — Unit Tests
 * Tests Zod schemas for trade and remittance validation.
 */

import {
  tradeTransactionSchema,
  remittanceRecordSchema,
  providerTypeSchema,
  realizedGainSchema,
  gainsArraySchema,
  safeParse,
} from './schemas';

describe('tradeTransactionSchema', () => {
  const validTrade = {
    id: 't_1',
    date: '2026-01-15',
    symbol: 'AAPL',
    type: 'BUY' as const,
    provider: 'Dime' as const,
    quantity: 10,
    priceUSD: 150.5,
    commissionUSD: 1.5,
    exchangeFeeUSD: 0.25,
    tafFeeUSD: 0,
    commissionRebateUSD: 0,
    vatUSD: 0,
  };

  it('parses a valid trade', () => {
    const result = tradeTransactionSchema.safeParse(validTrade);
    expect(result.success).toBe(true);
  });

  it('rejects negative price', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, priceUSD: -10 });
    expect(result.success).toBe(false);
  });

  it('rejects zero quantity', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, quantity: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, quantity: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects empty symbol', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, symbol: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, date: '01-15-2026' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid provider', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, provider: 'Binance' as any });
    expect(result.success).toBe(false);
  });

  it('accepts optional notes', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, notes: 'My first trade' });
    expect(result.success).toBe(true);
  });

  it('rejects symbol longer than 10 chars', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, symbol: 'VERYLONGSYMBOL' });
    expect(result.success).toBe(false);
  });

  it('rejects quantity over 1,000,000', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, quantity: 1_000_001 });
    expect(result.success).toBe(false);
  });

  it('rejects commission over max price', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, priceUSD: 1_000_001 });
    expect(result.success).toBe(false);
  });

  it('rejects negative exchangeFeeUSD', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, exchangeFeeUSD: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects negative tafFeeUSD', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, tafFeeUSD: -0.5 });
    expect(result.success).toBe(false);
  });

  it('accepts valid exchangeFeeUSD and tafFeeUSD', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, exchangeFeeUSD: 0.5, tafFeeUSD: 0.15 });
    expect(result.success).toBe(true);
  });

  it('defaults missing exchangeFeeUSD to 0', () => {
    const { exchangeFeeUSD, ...tradeWithoutExchange } = validTrade;
    const result = tradeTransactionSchema.safeParse(tradeWithoutExchange);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.exchangeFeeUSD).toBe(0);
    }
  });

  it('defaults missing tafFeeUSD to 0', () => {
    const { tafFeeUSD, ...tradeWithoutTaf } = validTrade;
    const result = tradeTransactionSchema.safeParse(tradeWithoutTaf);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tafFeeUSD).toBe(0);
    }
  });

  it('rejects negative commissionRebateUSD', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, commissionRebateUSD: -0.5 });
    expect(result.success).toBe(false);
  });

  it('accepts valid commissionRebateUSD', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, commissionRebateUSD: 1 });
    expect(result.success).toBe(true);
  });

  it('defaults missing commissionRebateUSD to 0', () => {
    const { commissionRebateUSD, ...tradeWithoutRebate } = validTrade;
    const result = tradeTransactionSchema.safeParse(tradeWithoutRebate);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.commissionRebateUSD).toBe(0);
    }
  });

  it('rejects negative vatUSD', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, vatUSD: -0.5 });
    expect(result.success).toBe(false);
  });

  it('accepts valid vatUSD', () => {
    const result = tradeTransactionSchema.safeParse({ ...validTrade, vatUSD: 0.07 });
    expect(result.success).toBe(true);
  });

  it('defaults missing vatUSD to 0', () => {
    const { vatUSD, ...tradeWithoutVat } = validTrade;
    const result = tradeTransactionSchema.safeParse(tradeWithoutVat);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vatUSD).toBe(0);
    }
  });
});

describe('remittanceRecordSchema', () => {
  const validRemit = {
    id: 'r_1',
    sellTradeId: 's_1',
    amountUSD: 500,
    remitDate: '2026-02-01',
    fxRateTHB: 35.5,
  };

  it('parses a valid remittance', () => {
    const result = remittanceRecordSchema.safeParse(validRemit);
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = remittanceRecordSchema.safeParse({ ...validRemit, amountUSD: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = remittanceRecordSchema.safeParse({ ...validRemit, amountUSD: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid fxRate below minimum', () => {
    const result = remittanceRecordSchema.safeParse({ ...validRemit, fxRateTHB: 15 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid fxRate above maximum', () => {
    const result = remittanceRecordSchema.safeParse({ ...validRemit, fxRateTHB: 60 });
    expect(result.success).toBe(false);
  });

  it('accepts optional notes', () => {
    const result = remittanceRecordSchema.safeParse({ ...validRemit, notes: 'Wire transfer' });
    expect(result.success).toBe(true);
  });
});

describe('providerTypeSchema', () => {
  it('accepts Dime', () => {
    expect(providerTypeSchema.safeParse('Dime').success).toBe(true);
  });

  it('accepts Liberator', () => {
    expect(providerTypeSchema.safeParse('Liberator').success).toBe(true);
  });

  it('accepts FinansiaSyrus', () => {
    expect(providerTypeSchema.safeParse('FinansiaSyrus').success).toBe(true);
  });

  it('rejects unknown provider', () => {
    expect(providerTypeSchema.safeParse('Unknown').success).toBe(false);
  });
});

describe('safeParse', () => {
  it('returns data on success', () => {
    const result = safeParse(tradeTransactionSchema, {
      id: 't1', date: '2026-01-01', symbol: 'AAPL', type: 'BUY',
      provider: 'Dime', quantity: 10, priceUSD: 150, commissionUSD: 1,
      exchangeFeeUSD: 0, tafFeeUSD: 0, commissionRebateUSD: 0, vatUSD: 0,
    }, null as any);
    expect(result.id).toBe('t1');
  });

  it('returns fallback on failure', () => {
    const fallback = { id: 'fallback' } as any;
    const result = safeParse(tradeTransactionSchema, { broken: true }, fallback);
    expect(result.id).toBe('fallback');
  });
});

describe('realizedGainSchema', () => {
  it('parses a valid gain result', () => {
    const gain = {
      sellTradeId: 's1', sellDate: '2026-01-10', symbol: 'AAPL', provider: 'Dime' as const,
      sellQuantity: 10, sellRevenueUSD: 1998, buyCostBasisUSD: 1501, gainUSD: 497,
      gainPercent: 0.249, matchedLots: [], totalRemittedUSD: 0, remainingProceedsUSD: 1998,
      remittances: [], taxableGainTHB: 0,
    };
    expect(realizedGainSchema.safeParse(gain).success).toBe(true);
  });

  it('accepts remittance in gain', () => {
    const gain = {
      sellTradeId: 's1', sellDate: '2026-01-10', symbol: 'AAPL', provider: 'Dime' as const,
      sellQuantity: 10, sellRevenueUSD: 1998, buyCostBasisUSD: 1501, gainUSD: 497,
      gainPercent: 0.249, matchedLots: [], totalRemittedUSD: 1000, remainingProceedsUSD: 998,
      remittances: [{ id: 'r1', sellTradeId: 's1', amountUSD: 1000, remitDate: '2026-02-01', fxRateTHB: 36 }],
      taxableGainTHB: 9000,
    };
    expect(realizedGainSchema.safeParse(gain).success).toBe(true);
  });
});
