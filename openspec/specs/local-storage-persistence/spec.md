# local-storage-persistence Specification

## Purpose

Defines client-side `localStorage` persistence, Zod schema fallback recovery on corrupted storage, legacy trade data migrations on load, and dividend remittance consistency repair (`src/store/tradeSlice.ts`, `src/store/dividendSlice.ts`, `src/store/filingSlice.ts`, `src/validation/schemas.ts`).

## Requirements

### Requirement: Domain data is persisted in localStorage under dedicated keys

The application SHALL persist state in browser `localStorage` under `tax_tracker_trades` (trades), `tax_tracker_gains` (realized gains and capital-gain remittances), `tax_tracker_dividends` (dividend records and dividend remittances), `tax_tracker_year_locks` (filed year locks), `tax_tracker_theme` (UI theme), and `lang` (UI language).

#### Scenario: Trade and dividend writes update localStorage immediately

- **WHEN** a trade, remittance, dividend, or year lock is added, updated, or deleted
- **THEN** the updated array or lock map is serialized to its corresponding `localStorage` key

### Requirement: Invalid or corrupted localStorage payloads fall back safely without throwing

Reading trades, gains, or dividends from `localStorage` SHALL parse JSON inside `try/catch` and validate via `safeParse` using Zod schemas (`tradeArraySchema`, `gainsArraySchema`, `dividendArraySchema`), returning an empty array `[]` if parsing or schema validation fails. Stored capital-gain remittances loaded via `gainsArraySchema` SHALL enforce `fxRateTHB` within `20–50`.

#### Scenario: Corrupted JSON in localStorage does not crash app initialization

- **WHEN** `localStorage` contains malformed JSON or an array failing `tradeArraySchema`
- **THEN** `safeParse` logs a warning and falls back to `[]` without throwing

### Requirement: Legacy trades are migrated and crypto trades are filtered on load

When loading trades from `localStorage`, `tradeSlice` SHALL run `migrateTrade` and `filterCrypto`: defaulting missing `provider` to `'Dime'`, removing deprecated `assetType` and `fxRateTHB` fields, defaulting undefined `exchangeFeeUSD`, `tafFeeUSD`, `commissionRebateUSD`, and `vatUSD` to `0`, and dropping legacy trades where `assetType === 'CRYPTO'`.

#### Scenario: Legacy trade without provider or new fee fields is upgraded

- **WHEN** a stored trade lacks `provider`, `exchangeFeeUSD`, `tafFeeUSD`, `commissionRebateUSD`, and `vatUSD` and carries legacy `fxRateTHB`
- **THEN** loading assigns `provider: 'Dime'`, defaults the missing fees to `0`, and strips `fxRateTHB`

#### Scenario: Legacy CRYPTO trade is excluded on load

- **WHEN** stored trades contain an entry with `assetType: 'CRYPTO'` alongside stock trades
- **THEN** `filterCrypto` removes the `'CRYPTO'` entry and keeps the stock trades

### Requirement: Trade summaries are recomputed from trades and gains on every mutation

`tradeSlice` SHALL never rely on stale cached summaries: on initial load and on every trade/remittance/reinvested mutation, it SHALL recompute `gains`, `remainingLots`, and `taxSummaries` directly via `fifoEngine` while preserving user-recorded remittances, reinvested amounts, and gain notes for matching sales.

#### Scenario: Recomputing after trade edit preserves sale metadata

- **WHEN** a trade is added or updated
- **THEN** `taxSummaries` and `remainingLots` are recomputed across all available years

### Requirement: Dividend remittance consistency repair aligns reportable income with remitted THB

`dividendSlice` SHALL provide `repairRemittanceData`, which scans all stored dividend remittances and sets `remit.reportableIncomeTHB = remit.remitTHB` wherever they differ, persisting changes to `localStorage` only when at least one record was repaired.

#### Scenario: Legacy dividend remittance with mismatched reportableIncomeTHB is repaired

- **WHEN** `repairRemittanceData` is dispatched and a remittance has `reportableIncomeTHB !== remitTHB`
- **THEN** `reportableIncomeTHB` is updated to equal `remitTHB` and saved to `tax_tracker_dividends`
