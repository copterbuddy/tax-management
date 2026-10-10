# Spec: Exchange Fee and TAF Fee Fields

## Capability

Add Exchange Fee (ค่าธรรมเนียมตลาดหลักทรัพย์) and TAF Fee (ค่าธรรมเนียมการขาย) as separate fields from Commission Fee to match broker statement itemization, with Exchange Fee applying to both BUY/SELL and TAF Fee applying to SELL only.

Reference BA spec (preserved in docs/ archive): `docs/specs/commission-fee-fields.md`

## ADDED Requirements

### Requirement: New fee fields added to TradeTransaction schema

- **Given** `TradeTransaction` interface
- **When** extending with fee fields
- **Then** adds `exchangeFeeUSD: number` and `tafFeeUSD: number` (default 0)
- **And** both fields validate as `z.number().min(0)`

### Requirement: Fee aggregation logic updated in FIFO engine

- **Given** BUY trade with quantity, price, commission, exchangeFee, tafFee
- **When** calculating cost basis
- **Then** `calculateBuyCostUSD` includes `commissionUSD + exchangeFeeUSD` (tafFeeUSD = 0 for BUY)
- **Given** SELL trade with quantity, price, commission, exchangeFee, tafFee
- **When** calculating net proceeds
- **Then** `calculateSellRevenueUSD` subtracts `commissionUSD + exchangeFeeUSD + tafFeeUSD`

### Requirement: TradeForm UI shows conditional TAF Fee field

- **Given** TradeForm is in BUY mode
- **When** rendering fee inputs
- **Then** shows Commission Fee and Exchange Fee inputs only
- **Given** TradeForm is in SELL mode
- **When** rendering fee inputs
- **Then** shows Commission Fee, Exchange Fee, and TAF Fee inputs
- **And** TAF Fee input toggles visibility when switching BUY↔SELL

### Requirement: TradeTable shows Total Fees column and updated totals

- **Given** Desktop view
- **When** displaying TradeTable
- **Then** replaces "Commission Fee (USD)" column with "Total Fees (USD)" column
- **And** column value = sum of commissionUSD + exchangeFeeUSD + tafFeeUSD
- **Given** BUY/SELL total column calculations
- **When** updating total column
- **Then** BUY: `qty×price + totalFees`, SELL: `qty×price - totalFees`
- **Given** Mobile card view
- **When** displaying trade summary
- **Then** shows "Total Fees" aggregate row

### Requirement: Migration sets default 0 for old trades

- **Given** old trade lacking new fee fields in localStorage
- **When** loading trade via `migrateTrade()`
- **Then** sets `exchangeFeeUSD: 0` and `tafFeeUSD: 0` if undefined
- **And** does NOT overwrite existing values if present

### Requirement: i18n keys added for new fields and table column

- **Given** English locale
- **When** loading i18n
- **Then** adds: `formExchangeFee`, `formTafFee`, `colTotalFees`
- **Given** Thai locale
- **When** loading i18n
- **Then** adds: `ค่าธรรมเนียมตลาดหลักทรัพย์ (USD)`, `ค่าธรรมเนียม TAF (USD)`, `ค่าธรรมเนียมรวม (USD)`