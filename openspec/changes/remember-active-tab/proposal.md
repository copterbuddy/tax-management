# Proposal

## Why

The dashboard forgets which tab is open. Press F5 on the Dividend tab (or on the Remittances tab) and the app returns to Trades every time — during reconciliation work that is a lost click on every reload, and a link sent to anyone else always lands on the wrong tab.

## What Changes

- The active tab lives in the URL fragment (`#trades`, `#dividends`, `#remittances`). The app reads it on load, so a reload or a bookmark restores the same tab.
- Clicking a tab updates the fragment with `history.replaceState`, so switching tabs does not add history entries and does not reload.
- Back/forward between fragments switches tabs, and an empty or unknown fragment falls back to the Trades tab.
- No storage key is added: the fragment is the state, so nothing new is persisted in localStorage and no migration is needed.

## Capabilities

### Modified Capabilities

- `dashboard-tab-layout`: the active tab is addressable — it is read from the URL on load and written back when the user switches.

## Impact

- `src/components/Dashboard.tsx` — initial state from the fragment, a `selectTab` helper that also writes the fragment, and a `hashchange` listener.
- `Dashboard.spec.tsx` — cases for restore-on-load, fragment update on click, unknown fragment fallback, and back/forward.
- No rendering change, no styling change, no data change.