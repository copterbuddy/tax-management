# Product Context - Thailand Tax Management Tracker

## Why This Project Exists
Thai taxpayers who trade foreign stocks or crypto must report capital gains on their annual tax return (P.N.D.90/91). The Thai Revenue Department mandates FIFO cost basis accounting and THB conversion. Most generic portfolio trackers don't handle Thai-specific tax rules. This tool fills that gap.

## Problems It Solves
1. **Manual FIFO Calculation**: Calculating FIFO cost basis across many trades is tedious and error-prone in spreadsheets.
2. **FX Rate Tracking**: Each trade needs an FX rate for THB conversion; manual tracking is cumbersome.
3. **Tax Summary Generation**: Aggregating realized gains/losses by year and asset type (stock vs crypto) for tax filing.
4. **Data Portability**: Traders use multiple brokers; easy import/export in standard formats keeps data portable.

## How It Should Work
1. User enters trades manually via a form (date, symbol, asset type, buy/sell, quantity, price, commission, FX rate).
2. Trades are stored in a Redux store with localStorage persistence.
3. The FIFO engine automatically matches sell orders against earliest buy lots and calculates realized gain/loss in THB.
4. The dashboard displays yearly KPI cards: total realized gain/loss, trade count, total volume, with breakdowns by asset type.
5. A trade table shows all transactions with computed gain indicators.
6. Users can filter by year, edit/delete trades, and export/import data as Markdown or CSV.

## User Experience Goals
- **Professional Dark UI**: Glassmorphism cards, clean typography, responsive layout.
- **Immediate Feedback**: KPI cards update instantly when trades are added/modified.
- **Minimal Friction**: Form validation, numeric formatting (THB with commas, USD with 2 decimals).
- **Data Safety**: localStorage persistence with import/export as backup.
- **Clarity**: Each sell row shows the matched buy lots and the realized gain amount directly in the table.