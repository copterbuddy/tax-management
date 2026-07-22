# Progress - Thailand Tax Management Tracker

## Current Status: Phase 1 — Core Implementation Complete

Phase 1 is fully implemented with all core features working.

## What Works

### ✅ Type System (`src/types/trade.ts`)
- `TradeTransaction` interface with all fields (id, date, symbol, assetType, type, quantity, priceUSD, commissionUSD, fxRateTHB, notes)
- `FifoLot`, `FifoMatchDetail`, `RealizedGainResult` types for FIFO matching
- `TaxSummary` and `AssetTypeBreakdown` for yearly aggregation
- `AssetType` ('FOREIGN_STOCK' | 'CRYPTO') and `TradeType` ('BUY' | 'SELL') union types

### ✅ FIFO Engine (`src/engine/fifoEngine.ts`)
- `calculateRealizedGains(trades)` — pure function, FIFO matching of sells against buys
- `calculateTaxSummary(trades)` — aggregates gains by year and asset type
- Correct THB cost basis: `(qty × priceUSD + commissionUSD) × fxRateTHB`
- Correct THB revenue: `(qty × priceUSD − commissionUSD) × fxRateTHB`
- Handles partial fills across multiple buy lots

### ✅ Redux Store
- **tradeSlice**: addTrade, updateTrade, deleteTrade, loadFromStorage, importTrades actions
- **taxSlice**: Derived tax summary selector from trade entries
- **localStorage middleware**: Auto-persists trades to localStorage key `"taxTrades"`
- **Typed hooks**: useAppDispatch, useAppSelector

### ✅ Dashboard (`src/components/Dashboard.tsx`)
- Year filter dropdown (dynamic years from trade data)
- 5 KPI cards: Total Realized Gain/Loss, Trade Count, Total Volume, Stock Gain/Loss, Crypto Gain/Loss
- Responsive grid layout

### ✅ KPI Card (`src/components/KpiCard.tsx`)
- Styled glassmorphism card
- Label, formatted value (THB with commas), optional sub-value
- Color coding: green for gains, red for losses

### ✅ Trade Form (`src/components/TradeForm.tsx`)
- Modal form for adding and editing trades
- All fields: date, symbol, asset type, trade type, quantity, price USD, commission USD, FX rate THB, notes
- Form validation
- Pre-fills values when editing existing trades

### ✅ Trade Table (`src/components/TradeTable.tsx`)
- Sortable columns (date, symbol, type, quantity, price, total THB, gain/loss)
- FIFO gain display inline on sell rows
- Edit and delete action buttons per row
- "No trades yet" empty state

### ✅ Export/Import (`src/components/ExportImportDrawer.tsx`)
- Slide-out drawer panel
- Export to Markdown table format
- Export to CSV format
- Import from Markdown table format (parses Markdown tables)
- Copy-to-clipboard functionality

### ✅ Styling
- Dark mode aesthetic with CSS variables
- Glassmorphism cards (`rgba` backgrounds + `backdrop-filter: blur()`)
- Responsive design
- Inter font family
- Consistent spacing and color palette

### ✅ App Shell
- `App.tsx`: Layout with header, conditional TradeForm modal, ExportImportDrawer
- `main.tsx`: Redux Provider wrapping App
- `index.html`: Entry point with dark background and favicon

## What's Left to Build

### Phase 2 (Future — Not Started)
- [ ] **Task 2.1**: Automated FX Rate fetcher (Bank of Thailand / Exchange Rate API)
- [ ] **Task 2.2**: Tax Loss Harvesting Suggestion Engine
- [ ] **Task 2.3**: Multi-Currency Support (EUR, JPY, SGD)
- [ ] **Task 2.4**: P.N.D.90/91 Thai Tax Filing report export (PDF)

### Technical Improvements
- [ ] Unit tests for `fifoEngine.ts`
- [ ] Unit tests for Redux slices
- [ ] Integration tests for UI components
- [ ] Performance optimization: memoization for large trade sets
- [ ] Error boundary component
- [ ] Accessibility audit (keyboard navigation, screen reader support)

## Known Issues
- No automated test coverage
- FX rates must be manually entered (no auto-fetch)
- Only USD foreign currency supported
- No undo/redo for trade operations
- localStorage has ~5MB limit — very large trade histories may need IndexedDB migration

## Evolution of Project Decisions
1. **Initial**: Vite + React + TypeScript template chosen for fast dev experience
2. **Redux Toolkit**: Chosen over Zustand/Context API for structured state management with middleware support
3. **Pure FIFO Engine**: Separated from UI concerns for testability and correctness
4. **localStorage over IndexedDB**: Chosen for simplicity; adequate for typical trade volumes
5. **CSS Variables over CSS-in-JS**: Chosen for zero-runtime-cost theming
6. **Oxlint over ESLint**: Chosen for speed (Rust-based), configured in Vite template