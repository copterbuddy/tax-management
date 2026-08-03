export type TradeType = 'BUY' | 'SELL';
export type ProviderType = 'Dime' | 'Liberator' | 'FinansiaSyrus';
export type CountryCode = 'US' | 'UK' | 'SG' | 'OTHER';

export interface CountryWhtInfo {
  code: CountryCode;
  nameTH: string;
  nameEN: string;
  defaultWhtRate: number;
  hasDTATreaty: boolean;
  noteTH?: string;
  noteEN?: string;
}

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
  commissionRebateUSD: number; // Commission rebate/promotional discount in USD
  vatUSD: number; // VAT (Value Added Tax) in USD — 7% on fees
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

// ─── Dividend Types ──────────────────────────────────────────────────────────

export interface DividendRecord {
  id: string;
  date: string;                  // Dividend pay date (YYYY-MM-DD)
  symbol: string;                // Must exist in BUY trades
  country: CountryCode;

  // USD amounts
  grossAmountUSD: number;        // Total dividend before WHT
  whtRate: number;               // Percentage (user can override country default)
  whtAmountUSD: number;          // Auto: grossUSD × whtRate / 100
  netAmountUSD: number;          // Auto: grossUSD - whtUSD

  // THB snapshot — reference only, based on dividend receipt date FX
  dividendFxRate: number;
  grossAmountTHB: number;        // grossUSD × dividendFx
  whtAmountTHB: number;          // whtUSD × dividendFx
  netAmountTHB: number;          // netUSD × dividendFx

  // Remittance tracking
  totalRemittedUSD: number;      // Sum of all remittances
  remainingToRemitUSD: number;   // netUSD - totalRemittedUSD
  remittances: DividendRemittance[];

  notes?: string;
}

export interface DividendRemittance {
  id: string;
  dividendId: string;
  amountUSD: number;
  remitDate: string;             // YYYY-MM-DD
  remitFxRate: number;           // THB per 1 USD on remittance date
  remitTHB: number;              // amountUSD × remitFxRate
  reportableIncomeTHB: number;   // same as remitTHB — for PND 90
  whtCreditTHB: number;          // (amountUSD/netUSD) × whtUSD × remitFxRate
  notes?: string;
}

export interface DividendSummary {
  taxYear: number;                // Remittance year
  totalGrossUSD: number;
  totalWhtUSD: number;
  totalNetUSD: number;
  totalRemittedUSD: number;
  totalReportableIncomeTHB: number;
  totalWhtCreditTHB: number;
  totalUnremittedUSD: number;
  recordCount: number;
  remittedCount: number;
}
