# System Patterns - Thailand Tax Management Tracker

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    index.html                       │
│                  (Entry Point)                      │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                   main.tsx                          │
│           (React DOM Render + Redux Provider)       │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                   App.tsx                           │
│  ┌──────────────────────────────────────────────┐   │
│  │              Header (Title + Actions)        │   │
│  ├──────────────────────────────────────────────┤   │
│  │            Dashboard.tsx                     │   │
│  │  ┌─────────┬─────────┬─────────┬─────────┐  │   │
│  │  │KpiCard  │KpiCard  │KpiCard  │KpiCard  │  │   │
│  │  │Total    │Trade    │Total    │Stock/   │  │   │
│  │  │Gain/    │Count    │Volume   │Crypto   │  │   │
│  │  │Loss     │         │         │Breakdown│  │   │
│  │  └─────────┴─────────┴─────────┴─────────┘  │   │
│  ├──────────────────────────────────────────────┤   │
│  │          TradeTable.tsx                      │   │
│  │  (Sortable table with FIFO gain indicators)  │   │
│  ├──────────────────────────────────────────────┤   │
│  │        TradeForm.tsx (Modal)                 │   │
│  │  (Add/Edit trade form with validation)       │   │
│  ├──────────────────────────────────────────────┤   │
│  │     ExportImportDrawer.tsx (Slide Panel)     │   │
│  │  (Markdown/CSV export & Markdown import)     │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Data Flow

```
User Action (Add/Edit/Delete Trade, Import)
        │
        ▼
  Redux Action Dispatched (tradeSlice)
        │
        ▼
  Reducer Updates tradeState.entries[]
        │
        ├──────────────────────────────┐
        ▼                              ▼
  localStorage Middleware         taxSlice Selector
  (persists to localStorage)      (derives taxSummary
        │                        from tradeState entries)
        │                              │
        ▼                              ▼
  Data Survives Reload           Dashboard Re-renders
                                 (KPI Cards Update)
```

## Key Technical Decisions

### 1. Redux Toolkit for State Management
- **Why**: Complex state with trades array + derived tax computations. Redux Toolkit provides structured reducers, selectors, and middleware.
- **Pattern**: Two slices — `tradeSlice` (source of truth for trade entries) and `taxSlice` (derived/computed from trades).

### 2. Pure FIFO Engine (No Side Effects)
- **Why**: Tax calculation must be deterministic and testable. The engine is a pure function: `trades[] → gainResults[]`.
- **Pattern**: Engine lives in `src/engine/` with zero React/Redux dependencies. Can be unit-tested independently.

### 3. localStorage Middleware
- **Why**: Data persistence without a backend. The Redux middleware pattern intercepts every state change and writes to localStorage.
- **Pattern**: Custom middleware in store configuration that serializes tradeState to localStorage after each action.

### 4. CSS Variables for Theming
- **Why**: Consistent dark mode aesthetic without a CSS-in-JS library. Easy to maintain and modify.
- **Pattern**: All colors, spacing, radii, shadows defined as CSS custom properties in `:root` of `index.css`.

### 5. Glassmorphism Card Design
- **Why**: Modern, professional look that differentiates from generic CRUD apps.
- **Pattern**: Semi-transparent backgrounds (`rgba`), `backdrop-filter: blur()`, subtle borders, CSS variables for consistency.

## Component Relationships

```
App
 ├── Dashboard
 │   └── KpiCard (×5)
 ├── TradeTable
 │   └── (inline FIFO gain display per sell row)
 ├── TradeForm (modal, triggered from App header + TradeTable edit button)
 └── ExportImportDrawer (slide panel, triggered from App header)
```

### State Dependencies
- **Dashboard**: reads `taxSummary` (via selector from taxSlice)
- **TradeTable**: reads `tradeEntries` + `gainResults` (from tradeSlice + fifoEngine)
- **TradeForm**: dispatches `addTrade` / `updateTrade` (to tradeSlice)
- **ExportImportDrawer**: reads `tradeEntries` for export; dispatches `importTrades` for import

## Critical Implementation Paths

### FIFO Gain Calculation (Hot Path)
1. `TradeTable` renders → selector reads `tradeEntries`
2. `calculateRealizedGains(tradeEntries)` called (memoized via `useMemo`)
3. Engine sorts trades by date, iterates chronologically
4. Buys build up `FifoLot[]` pool; sells consume from pool (FIFO order)
5. Each sell gets `RealizedGainResult` with matched lots and THB gain
6. Table displays gain inline for each sell row

### Data Persistence Flow
1. Any trade mutation → `tradeSlice` reducer runs
2. `localStorageMiddleware` intercepts next state
3. Serializes to JSON → `localStorage.setItem('taxTrades', json)`
4. On app load → `tradeSlice.loadFromStorage()` → `localStorage.getItem('taxTrades')`
5. Parsed JSON → initial state for Redux store