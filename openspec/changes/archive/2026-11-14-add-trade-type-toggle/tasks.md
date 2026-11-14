# Tasks

## 1. Theme tokens

- [x] 1.1 Add the six toggle tokens (`--toggle-buy-fg`, `--toggle-buy-bg`, `--toggle-buy-border`, `--toggle-sell-fg`, `--toggle-sell-bg`, `--toggle-sell-border`) to the light `:root` block in `src/index.css` using the light values from design.md D3. Verify with `Select-String -Path src\index.css -Pattern "--toggle-"` that exactly six are present in that block.
- [x] 1.2 Add the same six tokens with the dark values to the `[data-theme="dark"]` block. Verify the `--toggle-` count is now twelve and that the dark values match D3 (`#34d399` / `rgba(52, 211, 153, 0.14)` / `rgba(52, 211, 153, 0.45)` for BUY).
- [x] 1.3 Add the same six dark tokens to the `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` block. Verify the `--toggle-` count is eighteen, and that all three blocks declare the identical token names (diff the three name lists).

## 2. Segmented control styles

- [x] 2.1 Add `.trade-type-toggle` (2-column grid, `gap: 2px`, `padding: 2px`, `border-radius: var(--radius-sm)`, full width) and `.trade-type-btn` (transparent background, `1px solid var(--color-border)`, `var(--color-text-secondary)`, `min-height: 40px`, `font: inherit`, `cursor: pointer`, `transition`) to `src/index.css` near the existing form styles. Verify `npm run lint` passes and the form renders the pair side by side with the default (unselected) look.
- [x] 2.2 Add the state styles: `.trade-type-btn:hover` (`--color-surface-hover` + `--color-text-primary`), `.trade-type-btn:focus-visible` (`box-shadow: 0 0 0 3px` in the type's border token), `.trade-type-btn--buy[aria-checked="true"]` and `.trade-type-btn--sell[aria-checked="true"]` (tint background, border, foreground, `font-weight: 600`). Verify in the browser that clicking each button swaps exactly one tinted button in both light and dark themes.
- [x] 2.3 Confirm the control needs no mobile override: at ≤767px it must stay full width and above the date row. Verify by narrowing the devtools viewport to 375px — the segmented pair is first, full width, and no `.form-row` collapse rule affects it.

## 3. TradeTypeToggle component

- [x] 3.1 Create `src/components/TradeTypeToggle.tsx`: props `{ value: TradeType; onChange: (t: TradeType) => void; labelId: string }`; wrapper `div role="radiogroup"` with `aria-labelledby={labelId}`; two `<button type="button" role="radio" aria-checked>` with class `trade-type-btn trade-type-btn--buy|--sell`; labels and `aria-label`s from `t('trade:tradeTypeBuy')` / `t('trade:tradeTypeSell')`; roving tabindex (selected `0`, other `-1`) and `ArrowLeft/ArrowUp/ArrowRight/ArrowDown/Home/End` handling that calls `onChange` and moves focus. Verify the file has no `any` and passes `npm run lint`.
- [x] 3.2 Create `src/components/TradeTypeToggle.spec.tsx` covering: BUY renders `aria-checked="true"` and SELL `false` (and the inverse); clicking SELL calls `onChange('SELL')` once; the unselected button has `tabindex="-1"` while the selected one has `tabindex="0"`; `ArrowRight` on BUY calls `onChange('SELL')`; `Home`/`End` select the first/last option; the group is labelled by the given `labelId`. Verify with `npx jest TradeTypeToggle` that all cases pass.

## 4. TradeForm integration

- [x] 4.1 Render `<TradeTypeToggle>` as the first child of `<form className="trade-form">` — above the date+symbol `.form-row`, outside any `.form-row` — with the existing visible label `t('trade:formTradeType')` carrying `id="trade-type-label"` and no `htmlFor`. Delete the old type `.form-row` (label + `<select id="trade-type" disabled={!!trade}>`) and stop importing `Controller` only if it becomes unused. Verify in the browser that the pair is the first field, above the date, full width, and that the edit dialog no longer disables it.
- [x] 4.2 In `TradeForm`, replace the `previousTypeRef` + `useEffect` type-reset block with a `handleTypeChange(next)` handler: return early when `next === getValues('type')`; otherwise `clearErrors()` and `reset()` with the blank value object (same defaults as the `trade`-sync effect, `provider: 'Dime'`, numeric fields `0`) merged with `date: getValues('date')`. Remove the now-unused `useRef` import. Verify no `useRef` remains and `npm run lint` passes.
- [x] 4.3 Create `src/components/TradeForm.spec.tsx` (imports `i18next from '../i18n/index'` and awaits `changeLanguage`, following `TradesTab.spec.tsx`) covering, in add mode: default type is BUY; clicking SELL clears symbol/quantity/price/fees/notes and leaves the date intact; re-clicking the active BUY after typing does not clear the fields; a form-level error set before the switch is gone afterwards; in edit mode (`trade` prop) both type buttons are enabled. Verify with `npx jest TradeForm` that all cases pass.

## 5. Edit-mode safety guards

- [x] 5.1 In `TradeForm.onFormSubmit`, call `onValidate?.(tradeData)` for every type instead of only SELL (drop the `tradeData.type === 'SELL' &&` condition at the call site); `handleValidate` keeps its own SELL branch. Verify a BUY submit with `onValidate` returning `null` still saves, and one returning a message shows the root error (add both as cases in `TradeForm.spec.tsx`).
- [x] 5.2 In `Dashboard.handleValidate`, build the candidate trade set (`trades` with the edited trade replaced, or appended for a new trade) and call `computeAllRealizedGains(candidateSet)` inside `try/catch`, returning the caught message before the existing SELL branch runs. Verify by editing a BUY's quantity down so a later SELL can no longer match: the form shows the error and `npm test` passes.
- [x] 5.3 Add `trade:fifoLotsConflict` to both `src/i18n/locales/en/trade.json` and `src/i18n/locales/th/trade.json` (user-facing wording of the insufficient-lots conflict), and use it for the message surfaced by 5.2 rather than the raw engine string. Verify both JSON files still parse and `grep -c fifoLotsConflict` finds it in each.
- [x] 5.4 Wrap the `dispatch(updateTrade(...))` in `Dashboard.handleUpdateTrade` in `try/catch`, alerting the same message on failure as a crash backstop. Verify a normal edit still saves and closes the dialog.
- [x] 5.5 Add regression cases to `Dashboard.spec.tsx` (or `TradeForm.spec.tsx` where the fixture is simpler): a SELL trade with remittances cannot be opened for edit (existing `handleEditTrade` guard, unchanged), and a SELL trade with no remittances can. Verify with `npx jest Dashboard`.

## 6. Integration verification

- [x] 6.1 Run `npm test` and confirm every suite passes, including the three new/extended spec files.
- [x] 6.2 Run `npm run lint` and confirm zero findings (do not use `npm run build` as the gate — it is already red for an unrelated `tsconfig.app.json` jest-types gap).
- [x] 6.3 Manually walk the flow in `npm run dev` in both themes and both languages: add a trade switching BUY↔SELL several times, confirm colors and contrast, confirm the date survives and everything else clears, confirm ≤767px layout, then edit an existing trade and switch its type.
- [x] 6.4 Run `graphify update .` so `graphify-out/` reflects the new `TradeTypeToggle` node and the removed type-reset effect.

## Workflow follow-up

- Validate and archive the change with `/opsx-archive` once the project review requirements are satisfied.
- Sync the delta specs into `openspec/specs/` at archive time; the new `trade-type-toggle` capability will be created there and `sell-symbol-dropdown` updated in place.