export type AssetType = 'FOREIGN_STOCK' | 'CRYPTO';
export type TradeType = 'BUY' | 'SELL';
export type ProviderType = 'Dime' | 'Liberator' | 'FinansiaSyrus';

export interface TradeTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  symbol: string;
  assetType: AssetType;
  type: TradeType;
  provider: ProviderType;
  quantity: number;
  priceUSD: number; // Unit price in USD (or foreign currency)
  commissionUSD: number; // Total commission in USD
  fxRateTHB: number; // Exchange rate to THB on trade date
  notes?: string;
}

export interface FifoLot {
  tradeId: string;
  date: string;
  symbol: string;
  provider: ProviderType;
  unitCostTHB: number; // Cost per unit in THB including proportional commission
  remainingQuantity: number;
  originalQuantity: number;
  fxRateTHB: number;
}

export interface FifoMatchDetail {
  buyTradeId: string;
  buyDate: string;
  buyProvider: ProviderType;
  matchedQuantity: number;
  buyUnitCostTHB: number;
  buyTotalCostTHB: number;
}

export interface RealizedGainResult {
  sellTradeId: string;
  sellDate: string;
  symbol: string;
  assetType: AssetType;
  provider: ProviderType;
  quantity: number;
  sellRevenueTHB: number; // Total THB revenue from sell after deducting commission
  buyCostBasisTHB: number; // Total THB cost of matched buy lots
  realizedGainTHB: number; // Revenue minus Cost Basis
  matchedLots: FifoMatchDetail[];
}

export interface TaxSummary {
  taxYear: number;
  totalRevenueTHB: number;
  totalCostBasisTHB: number;
  netRealizedGainTHB: number; // All gains minus all losses (legacy)
  taxableGainTHB: number; // Only positive gains — per Thai law, losses cannot offset
  excludedLossesTHB: number; // Sum of negative gains (absolute value) — not deductible
  totalTransactions: number;
  totalBuyCount: number;
  totalSellCount: number;
  assetTypeBreakdown: {
    FOREIGN_STOCK: {
      revenueTHB: number;
      costBasisTHB: number;
      gainTHB: number;
      taxableGainTHB: number; // Only positive gains
      excludedLossesTHB: number; // Losses not deductible
    };
    CRYPTO: {
      revenueTHB: number;
      costBasisTHB: number;
      gainTHB: number;
      taxableGainTHB: number;
      excludedLossesTHB: number;
    };
  };
}
