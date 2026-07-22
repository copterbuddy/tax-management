# AI Agent Task & Tax Specification - Thailand Trading History Tracker

This document serves as persistent context and task tracking for AI Agents (Antigravity, Claude, Gemini, etc.) working on this repository now and in future iterations.

---

## 1. Overview & Business Rules

### Thai Revenue Department (RD) Tax Rules for Trading
1. **Scope**: Foreign stock transactions (e.g. US stock markets) and Crypto / Digital asset transactions.
2. **Cost Basis Accounting**: Must use **FIFO (First-In, First-Out)**. When selling an asset, shares or coins are matched against the earliest un-matched Buy lots.
3. **Foreign Exchange Conversion**: All foreign transactions (prices, fees, realized gains) must be converted into Thai Baht (THB) using the exchange rate (FX Rate THB) applicable on the transaction date or settlement date.
4. **Commission & Fees**: Commissions and direct trading expenses reduce the taxable capital gain (added to cost basis on Buy, deducted from gross revenue on Sell).
5. **Realized Capital Gain / Loss**:
   $$\text{Gross THB Cost Basis} = (\text{Quantity} \times \text{Buy Price USD} + \text{Buy Commission USD}) \times \text{Buy FX Rate THB}$$
   $$\text{Gross THB Revenue} = (\text{Quantity} \times \text{Sell Price USD} - \text{Sell Commission USD}) \times \text{Sell FX Rate THB}$$
   $$\text{Realized Capital Gain (THB)} = \text{Gross THB Revenue} - \text{Gross THB Cost Basis}$$

---

## 2. Trade Record Data Schema

| Field Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique identifier (UUID or timestamp) | `"trd_1721569200"` |
| `date` | `string (YYYY-MM-DD)` | Date of trade | `"2026-03-15"` |
| `symbol` | `string` | Ticker symbol or crypto pair | `"AAPL"`, `"BTC"` |
| `assetType` | `'FOREIGN_STOCK' \| 'CRYPTO'` | Category of asset | `"FOREIGN_STOCK"` |
| `type` | `'BUY' \| 'SELL'` | Transaction direction | `"BUY"` |
| `quantity` | `number` | Number of shares / coins | `10.5` |
| `priceUSD` | `number` | Unit trade price in foreign currency | `185.50` |
| `commissionUSD` | `number` | Broker / exchange fee in foreign currency | `1.50` |
| `fxRateTHB` | `number` | Foreign exchange rate to THB | `36.50` |
| `notes` | `string (optional)` | Additional note / broker reference | `"Brokerage account trade"` |

---

## 3. Sample Trade Log & Markdown Template

Below is a standard Markdown trade log format that can be copied, edited, or exported by users or AI subagents.

### Example Trade Table
| Date | Symbol | Type | Quantity | Unit Price (USD) | Fee (USD) | FX Rate (THB) | Total THB | FIFO Realized Gain (THB) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-01-10 | AAPL | BUY | 10 | $150.00 | $1.00 | 35.00 | ฿52,535.00 | - |
| 2026-02-15 | AAPL | BUY | 10 | $170.00 | $1.00 | 35.50 | ฿60,385.50 | - |
| 2026-05-20 | AAPL | SELL | 15 | $200.00 | $2.00 | 36.00 | ฿107,928.00 | **+฿24,635.50** |

---

## 4. AI Agent Task Backlog & Implementation Roadmap

> **Guideline for AI Agents**: Update the status of items below when completing tasks in current or future chat sessions.

### Phase 1: Core Tax Engine & UI Foundation (CURRENT IN-PROGRESS)
- [x] Establish `AI_TAX_TRACKER_SPEC.md` specification and task matrix.
- [ ] Implement TypeScript data models & pure FIFO tax engine module.
- [ ] Build Redux Toolkit store with `localStorage` persistence.
- [ ] Build responsive dark-mode React interface:
  - [ ] Tax dashboard header & year filter.
  - [ ] Realized gain/loss KPI cards.
  - [ ] Interactive trade entry/edit form.
  - [ ] Trade transaction history table with FIFO gain indicators.
  - [ ] Markdown & CSV export/import drawer.

### Phase 2: Enhanced Analytics & Advanced Features (FUTURE AI TASKS)
- [ ] **Task 2.1**: Automated FX Rate fetcher (integrate Bank of Thailand / Exchange Rate API for auto-filling `fxRateTHB`).
- [ ] **Task 2.2**: Tax Loss Harvesting Suggestion Engine (identify unrealized loss positions to offset gains before year-end).
- [ ] **Task 2.3**: Multi-Currency Support (EUR, JPY, SGD in addition to USD).
- [ ] **Task 2.4**: Form P.N.D.90/91 Thai Tax Filing helper report export (PDF / Official Tax Worksheet format).

---

## 5. Architectural Conventions for AI Developers
- State management: Redux Toolkit (`@reduxjs/toolkit` and `react-redux`).
- Styling: Modern Vanilla CSS with CSS variables (`src/index.css`), dark mode aesthetic, glassmorphism card surfaces.
- Component architecture: Clean, modular functional components in `src/components/`.
