# fifo-capital-gains Specification

## Purpose

Defines core trade ledger validation, provider-isolated FIFO cost-basis matching, realized gain calculation, and Thai remittance-based capital-gain taxation rules (`src/engine/fifoEngine.ts`, `src/components/TradeForm.tsx`, `src/components/Dashboard.tsx`).

## Requirements

### Requirement: Trade inputs enforce field and date bounds

`TradeForm` SHALL uppercase and trim `symbol` (1–10 characters), require positive `quantity` up to `1,000,000`, require `priceUSD` between `0.0001` and `1,000,000`, and restrict trade dates from 5 years prior (`DATE_LIMITS.MAX_PAST_YEARS`) up to today (expanding the minimum bound when editing an older existing trade so its stored date remains valid).

#### Scenario: Symbol is normalized to uppercase on submit

- **WHEN** the user submits a trade with symbol `" aapl "`
- **THEN** the stored trade carries `symbol: "AAPL"`

#### Scenario: Editing an existing trade older than 5 years keeps its date valid

- **WHEN** a stored trade dated more than 5 years ago is opened in `TradeForm`
- **THEN** the date input minimum bound extends back to that trade's date so editing does not fail date constraints

### Requirement: FIFO lots are isolated by symbol and provider in chronological order

`computeAllRealizedGains` SHALL sort trades chronologically by `date` (lexicographic `YYYY-MM-DD` comparison) and maintain separate FIFO queues keyed by `symbol|provider`. A `SELL` trade SHALL consume lots only from the matching `symbol|provider` queue, never across providers, and SHALL compute unit buy cost as `calculateBuyCostUSD(buy) / buy.quantity`.

#### Scenario: Same symbol at different providers uses separate lot queues

- **WHEN** 10 shares of `AAPL` are bought via `Dime` at `$100` and 10 shares of `AAPL` are bought via `Liberator` at `$120`, followed by a `SELL` of 5 shares via `Liberator`
- **THEN** the sale matches against the `Liberator` lot at `$120` cost basis and leaves the `Dime` lot untouched

#### Scenario: Partial lot consumption updates remaining quantity

- **WHEN** 10 shares are bought at `$100.10` unit cost, 5 more at `$120.20`, and 12 shares are sold
- **THEN** FIFO consumes all 10 shares from the first lot and 2 shares from the second lot (`buyCostBasisUSD = 1241.40`), leaving 3 shares in `remainingLots`

### Requirement: Selling more shares than available in the provider queue is rejected

`validateSellLots` and `processSellTrade` SHALL reject a `SELL` when available remaining lots for `symbol|provider` are below `sell.quantity`. `Dashboard` pre-flight validation SHALL exclude the trade being edited (`excludeTradeId`) when checking available lots and SHALL verify the full candidate trade set still resolves all subsequent `SELL` trades via `computeAllRealizedGains`.

#### Scenario: Selling without sufficient lots is blocked

- **WHEN** a `SELL` requests 10 shares of `AAPL` via `Dime` while only 4 shares remain in `AAPL|Dime`
- **THEN** `validateSellLots` reports invalid with the available and requested quantities
- **AND** `processSellTrade` throws an insufficient-lots error if invoked directly

#### Scenario: Editing a BUY trade that breaks a later SELL is blocked

- **WHEN** the user attempts to reduce a `BUY` quantity below what a subsequent `SELL` requires
- **THEN** full-set FIFO pre-flight catches the conflict and blocks the update

### Requirement: Realized gain and gain percentage handle zero-revenue safely

For each `SELL`, `processSellTrade` SHALL compute `gainUSD = sellRevenueUSD - buyCostBasisUSD` and `gainPercent = sellRevenueUSD > 0 ? gainUSD / sellRevenueUSD : 0`, ensuring `gainPercent` is never `NaN`.

#### Scenario: Profitable sale computes positive gainPercent

- **WHEN** `sellRevenueUSD` is `1798.91` and `buyCostBasisUSD` is `1241.40`
- **THEN** `gainUSD` is `557.51` and `gainPercent` is `557.51 / 1798.91`

#### Scenario: Zero sell revenue avoids division by zero

- **WHEN** `sellRevenueUSD` is `0`
- **THEN** `gainPercent` is `0`

### Requirement: Capital gains become taxable only on remittance and losses cannot offset gains

`applyRemittance` and `computeTaxSummary` SHALL compute the assessable THB gain of each capital-gain remittance as `max(0, amountUSD * gainPercent) * fxRateTHB` using the remittance-date exchange rate and attributing it to the `remitDate` year. Loss-making sales (`gainPercent < 0`) SHALL yield `0` taxable THB and SHALL NOT reduce taxable gains from profitable sales.

#### Scenario: Profitable partial remittance converts only the gain slice at remittance FX

- **WHEN** a sale with `gainPercent = 0.3099` has `$1,000` remitted at `35.00` THB/USD
- **THEN** the taxable gain in THB is `1000 * 0.3099 * 35.00`

#### Scenario: Loss-making remittance contributes zero tax and does not offset gains

- **WHEN** a year contains both a profitable remittance (`+10,000` THB) and a remittance against a losing sale (`-500` USD gain)
- **THEN** `taxableGainTHB` remains `10,000` and `excludedLossesUSD` records the loss separately

### Requirement: SELL trades with recorded remittances cannot be edited

`Dashboard` SHALL block opening the edit modal for a `SELL` trade whose realized gain already has one or more remittances (`remittances.length > 0`), instructing the user to delete those remittances first.

#### Scenario: Editing a remitted SELL trade is blocked

- **WHEN** the user clicks edit on a `SELL` trade that has at least one recorded remittance
- **THEN** an alert is displayed and the edit trade modal does not open
