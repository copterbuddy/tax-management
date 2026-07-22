# Active Context - Thailand Tax Management Tracker

## Current Work Focus
**Phase 1: Core Tax Engine & UI Foundation** — Building the complete React application with FIFO engine, Redux store, and glassmorphism dark UI.

## What's Implemented

### Types (`src/types/trade.ts`)
Full TypeScript data models defined:
- `TradeTransaction` — core trade record (id, date, symbol, assetType, type, quantity, priceUSD, commissionUSD, fxRateTHB, notes)
- `FifoLot` — buy lot with remaining quantity for FIFO matching
- `FifoMatchDetail` — records how a sell matched against a specific buy lot
- `RealizedGainResult` — total gain/loss for a sell transaction
- `TaxSummary` — yearly aggregated tax data with asset-type breakdown

### FIFO Engine (`src/engine/fifoEngine.ts`)
Pure TypeScript FIFO calculation engine:
- `calculateRealizedGains(trades)` — processes all trades, matches sells against buys using FIFO, returns gain results per sell
- `calculateTaxSummary(trades)` — aggregates realized gains by year and asset type

### Redux Store
- **`src/store/index.ts`**: Configures Redux store with tradeSlice and taxSlice reducers; includes localStorage middleware for persistence
- **`src/store/hooks.ts`**: Typed `useAppDispatch` and `useAppSelector` hooks
- **`src/store/tradeSlice.ts`**: CRUD operations for trades (add, update, delete), load/save from localStorage, bulk import
- **`src/store/taxSlice.ts`**: Computed tax summary state derived from trades

### UI Components
- **`src/App.tsx`**: Root layout — header, Dashboard view, TradeForm, TradeTable, ExportImportDrawer
- **`src/main.tsx`**: React entry point with Redux Provider
- **`src/components/Dashboard.tsx`**: Year filter dropdown, KPI card grid (total gain/loss, trade count, total volume, stock gain, crypto gain)
- **`src/components/KpiCard.tsx`**: Individual KPI display card with label, value, and optional sub-value
- **`src/components/TradeForm.tsx`**: Modal form for adding/editing trades with validation
- **`src/components/TradeTable.tsx`**: Sortable trade list table showing all transactions with FIFO gain indicators on sell rows
- **`src/components/ExportImportDrawer.tsx`**: Slide-out panel with Markdown export, CSV export, and Markdown import

### Styling
- **`src/index.css`**: CSS variables (dark palette, glassmorphism, spacing), base reset, utility classes
- **`src/App.css`**: App-specific layout styles
- **`index.html`**: Entry HTML with dark background, Inter font, favicon

## Recent Changes
- Initial project scaffolded from Vite + React + TypeScript template
- All Phase 1 components built out with full functionality
- LocalStorage persistence middleware integrated into Redux store
- Export/Import (Markdown & CSV) implemented

## Known Issues / Technical Debt
- No automated tests yet
- FX rates are manually entered (no auto-fetch API)
- Only USD foreign currency supported currently
- No P.N.D.90/91 export format

## Next Steps
1. **Testing**: Add unit tests for fifoEngine and store slices
2. **Bug fixes**: Test edge cases (zero quantity, same-date trades, empty trade list)
3. **Phase 2 features**: Auto FX rate fetcher, tax loss harvesting, multi-currency, PDF export for Thai tax filing
4. **Performance**: Consider memoization for FIFO calculations on large trade sets