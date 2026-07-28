export type TradeType = 'BUY' | 'SELL';
export type ProviderType = 'Dime' | 'Liberator' | 'FinansiaSyrus';

export interface TradeTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  symbol: string;
  type: TradeType;
  provider: ProviderType;
  quantity: number;
  priceUSD: number; // Unit price in USD
  commissionUSD: number; // Total commission in USD
  exchangeFeeUSD: number; // Exchange/market fee in USD
  tafFeeUSD: number; // TAF (Trading Activity Fee) in USD — SELL only
  notes?: string;
}

export interface RemittanceRecord {
  id: string;
  sellTradeId: string;
  amountUSD: number; // Amount remitted in USD
  remitDate: string; // YYYY-MM-DD — date funds arrived in Thailand
  fxRateTHB: number; // Exchange rate on remittance date
  notes?: string;
}

export interface FifoLot {
  tradeId: string;
  date: string;
  symbol: string;
  provider: ProviderType;
  unitCostUSD: number; // Cost per unit in USD
  remainingQuantity: number;
  originalQuantity: number;
}

export interface FifoMatchDetail {
  buyTradeId: string;
  buyDate: string;
  buyProvider: ProviderType;
  matchedQuantity: number;
  buyUnitCostUSD: number;
  buyTotalCostUSD: number;
}

export interface RealizedGainResult {
  sellTradeId: string;
  sellDate: string;
  symbol: string;
  provider: ProviderType;
  sellQuantity: number;
  sellRevenueUSD: number; // Total USD revenue after deducting commission
  buyCostBasisUSD: number; // Total USD cost of matched buy lots
  gainUSD: number; // Revenue minus cost basis (USD)
  gainPercent: number; // gainUSD / sellRevenueUSD (0-1)
  matchedLots: FifoMatchDetail[];
  // Remittance tracking
  totalRemittedUSD: number;
  remainingProceedsUSD: number;
  remittances: RemittanceRecord[];
  taxableGainTHB: number; // Sum of (remitUSD × gainPercent × remitFX) across all remittances
}

export interface ProviderBreakdown {
  provider: ProviderType;
  taxableGainTHB: number;
  totalRemittedUSD: number;
  netGainUSD: number;
  sellCount: number;
}

export interface TaxSummary {
  taxYear: number;
  totalRevenueUSD: number;
  totalCostBasisUSD: number;
  netGainUSD: number;
  totalRemittedUSD: number;
  taxableGainUSD: number; // Gain portion of remittances (USD)
  taxableGainTHB: number; // Gain converted at remittance FX rates
  excludedLossesUSD: number; // Losses not deductible
  totalTransactions: number;
  totalBuyCount: number;
  totalSellCount: number;
  totalRemittanceCount: number;
  providerBreakdown: ProviderBreakdown[]; // Per-provider KPI
}
