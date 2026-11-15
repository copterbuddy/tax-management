# Tasks

## 1. Tab state in the URL

- [x] 1.1 Extract the tab ↔ URL logic into `src/hooks/useActiveTab.ts` (pure `tabFromHash` / `hashForTab` plus a `useActiveTab` hook that reads the fragment on mount and writes it with `history.replaceState`, preserving path and query).
- [x] 1.2 Keep the `hashchange` listener inside the hook, cleaned up on unmount.
- [x] 1.3 Extract the presentational tab bar into `src/components/TabNav.tsx` (role=tablist/tab, aria-selected) and have `Dashboard` render it with the hook's tab and selector.

## 2. Tests

- [x] 2.1 `Dashboard.spec.tsx` covers the integration (restore on load, unknown fragment, click writes the fragment, hashchange switches); `useActiveTab.spec.ts` covers the pure helpers and the hook (query preserved, listener removed on unmount). Both reset the URL between cases.

## 3. Verification

- [x] 3.1 Run `npm test` and `npm run lint`; both pass. `npm run build` stays red for the pre-existing spec-types reason.
- [x] 3.2 In the browser: open the app, switch to the Dividend tab, reload, and confirm the Dividend tab is still active and the URL ends with `#dividends`.
- [x] 3.3 Run `openspec validate remember-active-tab --strict`, then archive the change so the requirement lands in `dashboard-tab-layout`.
