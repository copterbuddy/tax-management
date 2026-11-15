# Design

## Context

`Dashboard.tsx` holds `activeTab` in `useState<'trades' | 'dividends' | 'remittances'>('trades')` and the three tab buttons call `setActiveTab`. Nothing outside the component can see or set it.

## Decisions

### D1 — The URL fragment is the state, not localStorage

A fragment survives reload, is shareable, and costs no storage key or migration. `localStorage` would survive reload too, but a link would still open on Trades and the "last tab" would follow the user into a fresh context where it is not true.

### D2 — `replaceState`, not `pushState`

Switching tabs is not navigation the user should have to walk back through. `replaceState` keeps the back button meaning "leave the app", and avoids a history entry per tab click.

### D3 — One helper writes both

`selectTab(tab)` sets component state and writes the fragment. Tab buttons call it, so the DOM state and the URL cannot drift. A `hashchange` listener keeps back/forward working by reading the fragment back into state.

### D4 — Unknown fragments fall back to Trades

`#anything-else` (including an empty hash) resolves to `trades` rather than throwing or rendering nothing. This also keeps the existing default behaviour for every current bookmark.

## Risks / Trade-offs

- A fragment that matches no tab silently opens Trades. Acceptable: the app has exactly three fixed tabs and no deep-link semantics beyond them.
- Tests that render the dashboard now depend on `window.location.hash`; the spec resets it between cases so one test cannot leak into the next.

## Migration Plan

None. Existing URLs without a hash behave exactly as before.
