# Tasks

## 1. Tab state in the URL

- [ ] 1.1 In `Dashboard.tsx`, derive the initial tab from `window.location.hash` (falling back to `trades`), and add a `selectTab` helper that sets state and calls `history.replaceState` with `#<tab>`.
- [ ] 1.2 Add a `hashchange` listener so back/forward switches tabs, cleaned up on unmount.
- [ ] 1.3 Replace the three tab buttons' `setActiveTab(...)` calls with `selectTab(...)`.

## 2. Tests

- [ ] 2.1 `Dashboard.spec.tsx`: loading with `#dividends` renders the dividend year control and not the trades one; clicking a tab writes the matching fragment; an unknown fragment opens Trades; a dispatched `hashchange` switches the tab. Reset `window.location.hash` between cases.

## 3. Verification

- [ ] 3.1 Run `npm test` and `npm run lint`; both pass. `npm run build` stays red for the pre-existing spec-types reason.
- [ ] 3.2 In the browser: open the app, switch to the Dividend tab, reload, and confirm the Dividend tab is still active and the URL ends with `#dividends`.
- [ ] 3.3 Run `openspec validate remember-active-tab --strict`, then archive the change so the requirement lands in `dashboard-tab-layout`.
