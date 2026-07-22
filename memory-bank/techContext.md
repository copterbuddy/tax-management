# Tech Context - Thailand Tax Management Tracker

## Technologies Used

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | LTS |
| Framework | React | 19.2.7 |
| Language | TypeScript | 6.0.2 |
| Build Tool | Vite | 8.1.1 |
| State Management | Redux Toolkit | 2.12.0 |
| React-Redux | react-redux | 9.3.0 |
| Linting | Oxlint | 1.71.0 |
| Styling | Vanilla CSS (CSS Variables) | — |

## Development Setup

### Prerequisites
- Node.js (LTS)
- npm

### Commands
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server with HMR
npm run build        # TypeScript type-check + Vite production build
npm run lint         # Run Oxlint
npm run preview      # Preview production build locally
```

### Project Structure
```
tax-managenment/
├── index.html                  # Entry HTML
├── package.json                # Dependencies and scripts
├── tsconfig.json               # Base TypeScript config
├── tsconfig.app.json           # App-specific TS config
├── tsconfig.node.json          # Node/Vite TS config
├── vite.config.ts              # Vite configuration
├── .oxlintrc.json              # Oxlint rules
├── docs/
│   └── AI_TAX_TRACKER_SPEC.md  # Full project specification
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Root component
│   ├── App.css                 # App-specific styles
│   ├── index.css               # Global styles + CSS variables
│   ├── assets/                 # Static assets
│   ├── types/
│   │   └── trade.ts            # All TypeScript interfaces/types
│   ├── engine/
│   │   └── fifoEngine.ts       # Pure FIFO calculation engine
│   ├── store/
│   │   ├── index.ts            # Redux store config + localStorage middleware
│   │   ├── hooks.ts            # Typed dispatch/selector hooks
│   │   ├── tradeSlice.ts       # Trade CRUD slice
│   │   └── taxSlice.ts         # Tax summary computed slice
│   └── components/
│       ├── Dashboard.tsx       # Year filter + KPI cards
│       ├── KpiCard.tsx         # Single KPI display card
│       ├── TradeForm.tsx       # Add/Edit trade modal form
│       ├── TradeTable.tsx      # Trade list with FIFO gain indicators
│       └── ExportImportDrawer.tsx  # Export/Import panel
└── memory-bank/                # Cline Memory Bank (this directory)
    ├── projectbrief.md
    ├── productContext.md
    ├── activeContext.md
    ├── systemPatterns.md
    ├── techContext.md
    └── progress.md
```

## Technical Constraints

1. **No Backend**: All data is client-side only via localStorage. No server, no database.
2. **Single Currency (USD)**: Currently only supports USD as the foreign currency for trades. THB is the target currency.
3. **Browser Only**: Runs entirely in the browser. No SSR, no Node.js server needed.
4. **localStorage Size Limit**: ~5MB per origin. Large trade histories may hit this limit.
5. **No Authentication**: No user accounts. Data is local to the browser.
6. **Manual FX Rates**: Users must manually enter FX rates. No API integration for auto-fetching.

## Dependencies

### Production Dependencies
- **@reduxjs/toolkit** (2.12.0): Redux state management with simplified API
- **react** (19.2.7): UI library
- **react-dom** (19.2.7): React DOM rendering
- **react-redux** (9.3.0): React bindings for Redux

### Dev Dependencies
- **@types/node** (24.13.2): Node.js type definitions
- **@types/react** (19.2.17): React type definitions
- **@types/react-dom** (19.2.3): React DOM type definitions
- **@vitejs/plugin-react** (6.0.3): Vite plugin for React (uses Oxc compiler)
- **oxlint** (1.71.0): Fast Rust-based linter
- **typescript** (6.0.2): TypeScript compiler
- **vite** (8.1.1): Build tool and dev server

## Tool Usage Patterns

### Vite HMR
- Vite dev server provides Hot Module Replacement
- No special configuration; works out of the box with @vitejs/plugin-react

### TypeScript Configuration
- `tsconfig.json`: References `tsconfig.app.json` and `tsconfig.node.json`
- `tsconfig.app.json`: App source configuration (`src/`)
- `tsconfig.node.json`: Vite config file configuration

### Oxlint
- Configured in `.oxlintrc.json`
- Enforces `react/rules-of-hooks` and `react/only-export-components` rules
- Type-aware linting available but not currently enabled

### localStorage Key
- Trade data stored under key: `"taxTrades"`
- Tax summary is derived (not stored separately)
- Format: JSON-serialized `TradeTransaction[]`