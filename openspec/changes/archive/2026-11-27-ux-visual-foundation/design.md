# Design: UX Visual Foundation (Loop 1)

## Decisions

### 1. Zero-Dependency SVG Icon Set (`src/components/Icons.tsx`)
- Create a small, strongly typed set of 16px/18px/20px Lucide-style stroke SVG components (`IconBarChart`, `IconCoins`, `IconLandmark`, `IconSun`, `IconMoon`, `IconPencil`, `IconTrash`, `IconPaperclip`, `IconTrendingUp`, `IconGlobe`, `IconWallet`, `IconReceipt`, `IconClock`, `IconCheckCircle`, `IconBuilding`, `IconPercent`, `IconChevronDown`, `IconChevronRight`, `IconXCircle`).
- Every icon accepts optional `size` and `className`, uses `stroke="currentColor"`, `strokeWidth="1.75"`, and `aria-hidden="true"` so screen readers rely on button text or `aria-label`.
- Avoids adding a third-party runtime dependency while delivering uniform visual weight across Light and Dark modes.

### 2. Calm Surface & Contrast Tokens (`src/index.css`)
- Light mode: `--color-text-tertiary: #64748b` (contrast ~4.6:1 on `#ffffff`).
- Dark mode: `--color-text-tertiary: #94a3b8` (contrast ~6.3:1 on `#1a1d28`).
- Remove the global `*, *::before, *::after { transition: ... 400ms }` rule; instead apply snappy `150ms` transitions only on interactive elements (buttons, inputs, table rows, cards) and apply smooth `250ms` theme transition on `body` and surface containers.
- Replace heavy zebra striping (`.trade-table tbody tr:nth-child(even)`) with clean subtle horizontal hairlines and a gentle hover highlight, plus slightly more vertical cell padding (`12px 16px` -> `13px 16px`) for easier horizontal scanning.
- Calm KPI cards:
  - `.kpi-card.kpi-positive`: `border-left: 3px solid var(--color-success);` on flat `--color-surface`
  - `.kpi-card.kpi-negative`: `border-left: 3px solid var(--color-danger);` on flat `--color-surface`
  - `.kpi-card.kpi-warning`: `border-left: 3px solid var(--color-warning);` on flat `--color-surface`
  - `.kpi-card.kpi-highlight`: `border-left: 3px solid var(--color-primary); background: var(--color-primary-bg);` (single hero accent)
  - `.kpi-icon`: subtle tinted icon badge (`36px × 36px` rounded container) with `currentColor` SVG instead of oversized 28px emoji.

### 3. CSS Bug Fixes
- Fix broken comment at `src/index.css:1827` (`/* ═══ Remittance evidence ... */`).
- Wrap `.remit-progress` and `.remit-text` in `.remit-progress-wrap` in `TradeTable.tsx` so `.remit-text` is never clipped by the 6px bar track's `overflow: hidden`.
- Fix `DividendTab.spec.tsx` `baseProps` by adding `onSetRemittanceDocRef: () => {}`.
