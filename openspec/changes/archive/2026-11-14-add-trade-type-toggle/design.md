# Design

## Context

See `proposal.md` — Why. Constraints that shape the approach:

- `TradeForm` is a single 430-line component driven by react-hook-form + zod. The trade type lives in
  the same form state as every other field, and a `useEffect` currently watches `type` to clear
  `symbol`/`provider` on change (`src/components/TradeForm.tsx`, "Type toggle reset" block).
- Theme colours are CSS custom properties in `src/index.css`, declared **three times**: light `:root`,
  `[data-theme="dark"]`, and an `@media (prefers-color-scheme: dark)` block scoped to
  `:root:not([data-theme="light"])`. Any new token must be added to all three.
- Selected-state colour cannot reuse `--color-success` / `--color-danger` as a background+foreground
  pair: in light mode `#059669` on `#ecfdf5` is only **3.58:1** (fails AA). In dark mode `#34d399` is a
  pastel, so a filled green button cannot carry white text.
- `computeAllRealizedGains` **throws** on insufficient lots, and `tradeSlice` calls it unguarded inside
  reducers, so an invalid trade set that reaches dispatch throws inside Redux rather than returning an
  error.
- `Dashboard.handleEditTrade` **already** refuses to open a SELL trade for editing while it has
  remittances (using the existing `trade:remitBeforeEdit` string in both locales).
- `Dashboard.handleValidate` is already injected into `TradeForm` as `onValidate` and already runs a
  FIFO pre-flight (`computeAllRealizedGains(trades, trade.id)`) — but only for SELL submissions.

## Goals / Non-Goals

**Goals:**

- Type selection is one click, always visible, and visually weighted (green/red) so it reads as the
  form's primary decision.
- Colour choices are verifiable AA in both themes without touching existing tokens.
- Unlocking the type in edit mode cannot crash the app or silently delete remittance records.
- Reset semantics are explicit and testable, not an emergent side effect of `watch`.

**Non-Goals:**

- No change to the zod schema, `TradeTransaction`, storage keys, or the FIFO engine.
- Not redesigning the fee/rebate rows, the provider field, or the rest of the form layout.
- Not adding a confirmation dialog for the type switch (deliberate: the user chose an immediate clear).
- Not fixing the pre-existing `npm run build` type-check failure (unrelated `tsconfig.app.json` gap).

## Decisions

### D1. Two native `<button type="button">` elements with radio-group ARIA, not styled radio inputs

A `role="radiogroup"` wrapper labelled by the existing visible label, containing two `role="radio"`
buttons with `aria-checked`. Roving tabindex: the selected button is tabindex `0`, the other `-1`;
`ArrowLeft/ArrowUp` select the previous, `ArrowRight/ArrowDown` the next, `Home`/`End` the ends.

*Alternatives:* native `<input type="radio">` inside `<label>` (better built-in semantics, but the
label text, the tint, and the border all need restyling per state, and the inputs must be visually
hidden without losing focus rings — more CSS for the same result); a checkbox plus `:checked` sibling
selectors (fragile, and `:has()` support is not worth the risk); keeping the `<select>` (rejected —
that is the problem being fixed).

### D2. Extract `TradeTypeToggle` as its own presentational component

`src/components/TradeTypeToggle.tsx` with props `{ value: TradeType; onChange: (t: TradeType) => void }`
plus a `labelId`. `TradeForm` renders it as the first child of `.trade-form`.

*Rationale:* the keyboard/ARIA behavior is the most intricate part of this change and is far easier to
test in isolation than through `TradeForm` (which needs a Redux-free harness, fake lots, and a form
context). Keeps `TradeForm` from growing further. *Alternative:* inline markup in `TradeForm`
(rejected — pushes the file past 500 lines and forces every toggle test through react-hook-form).

### D3. New tint tokens rather than reusing `--color-success*` / `--color-danger*`

Six new tokens, each added to all three theme blocks:

| Token | Light | Dark |
|---|---|---|
| `--toggle-buy-fg` | `#047857` | `#34d399` |
| `--toggle-buy-bg` | `#ecfdf5` | `rgba(52, 211, 153, 0.14)` |
| `--toggle-buy-border` | `rgba(4, 120, 87, 0.35)` | `rgba(52, 211, 153, 0.45)` |
| `--toggle-sell-fg` | `#b91c1c` | `#f87171` |
| `--toggle-sell-bg` | `#fef2f2` | `rgba(248, 113, 113, 0.14)` |
| `--toggle-sell-border` | `rgba(185, 28, 28, 0.35)` | `rgba(248, 113, 113, 0.45)` |

Measured contrast of `fg` against `bg` (dark ratios composite the translucent tint over
`--color-surface` `#1a1d28`): BUY **5.20:1** light / **6.66:1** dark; SELL **5.91:1** light /
**4.94:1** dark — all pass AA for normal text, unlike the 3.58:1 the existing light success pair gives.
The border alphas (0.35/0.45 against 0.25/0.3) are raised so the tint reads as a deliberate selection
rather than as a card, while staying distinguishable from `--color-border`.

*Alternatives:* filled buttons with white text (fails in dark mode: white on `#34d399` is ~1.9:1);
reusing the existing success/danger pairs (fails AA in light mode, per Context); a border-only
selection (no colour signal, which is what the user asked for).

### D4. State-driven styling classes, inactive state from neutral tokens

`.trade-type-toggle` is a 2-column grid with `gap: 2px; padding: 2px; border-radius: var(--radius-sm)`
— the same segmented-control shape the app already uses for `.lang-switcher`. Each button is
`background: transparent; border: 1px solid var(--color-border); color: var(--color-text-secondary)`.
`aria-checked="true"` drives `.is-active`, which applies the type's three tokens plus `font-weight: 600`.
Hover on an inactive button uses `--color-surface-hover` / `--color-text-primary`. `:focus-visible` adds
`box-shadow: 0 0 0 3px <type border token>`. Selecting by `[aria-checked="true"]` instead of a separate
`.is-active` class keeps one source of truth for "selected"; the class is only used as a CSS hook.

Min height 40px per button so the pair meets touch-target guidance and matches `.form-group input`.

### D5. Reset happens in the click handler, not in a `useEffect` watching `type`

`TradeForm` passes `handleTypeChange(next)` to the toggle. That handler:

1. returns immediately if `next === getValues('type')` (the no-op guarantee);
2. builds the blank value object (the same defaults the `trade`-sync effect uses, with `provider: 'Dime'`
   and numeric fields `0`) and calls `reset({ ...blank, date: getValues('date') })`;
3. calls `clearErrors()`.

The existing `previousTypeRef` + `useEffect` block is deleted (and the now-unused `useRef` import
removed).

*Rationale:* a `useEffect` keyed on the watched value fires for **any** change to `type`, including the
programmatic `reset()` that runs when the `trade` prop arrives — exactly the kind of incidental clear
the no-op guarantee forbids, and impossible to distinguish from a user change after the fact. Handling
it in the click handler ties clearing to the only real trigger (a user choosing the other type) and
makes the behavior directly testable. *Alternative:* keep the effect but compare against a ref that is
also updated on programmatic reset (rejected — two refs and ordering assumptions to reproduce what a
one-line guard gives for free).

`reset()` (rather than ~10 `setValue` calls) is used so the defaults stay in one place and RHF clears
its own touched/dirty bookkeeping.

### D6. FIFO safety: pre-flight full-set simulation, surfaced through the existing `onValidate` seam

`TradeForm.onFormSubmit` calls `onValidate?.(tradeData)` for **every** type, not only SELL (the
`tradeData.type === 'SELL' &&` guard at the call site is dropped; `handleValidate` keeps its own
SELL-specific branch, so BUY submissions still return `null` unless the simulation throws).

`Dashboard.handleValidate` gains, before its existing SELL branch:

```
const candidateSet = isEdit ? trades.map(t => t.id === trade.id ? trade : t) : [...trades, trade];
try { computeAllRealizedGains(candidateSet); }        // no excludeId: validate the whole set
catch (e) { return (e as Error).message; }
```

A throw becomes the existing `errors.root` message path in `onFormSubmit`, so nothing is dispatched and
the stored trade is untouched. `handleUpdateTrade` also wraps its `dispatch` in `try/catch` as a
crash backstop (alerting the same message) for the case where the pre-flight and the dispatch disagree.

*Alternatives:* `try/catch` inside the `tradeSlice` reducers (rejected — reducers must stay pure, and
swallowing the error would leave `gains`/`remainingLots` inconsistent with `trades`); an error boundary
(rejected — masks the cause and still loses the user's form).

### D7. The remittance rule needs no new code

The proposal's "SELL with remittances cannot become BUY" is already enforced structurally:
`handleEditTrade` refuses to open a SELL trade that has remittances, so no such trade can reach the
type toggle at all — and the message it shows (`trade:remitBeforeEdit`, present in en and th) already
tells the user to delete the remittances first. The change therefore adds a regression test rather
than a guard, and must not weaken `handleEditTrade` while removing `disabled` from the type control.

### D8. i18n: reuse existing keys, add one

`trade:formTradeType` becomes the group label (via `aria-labelledby`, so no extra `htmlFor` target);
`trade:tradeTypeBuy` / `trade:tradeTypeSell` are the button labels; `trade:remitBeforeEdit` is reused.
One new key is needed in both locales: `trade:fifoLotsConflict`, the user-facing form of the engine's
`Insufficient lots` message (the raw engine string stays untranslated in `src/engine`, per the layering
rule).

### D9. Layout: first child of `.trade-form`, outside any `.form-row`

Placed directly under `<form className="trade-form">`, above the existing date+symbol `.form-row`. Not
wrapped in `.form-row` so it is naturally full width and stacks first in the single-column mobile
breakpoint (`max-width: 767px`, where `.form-row` collapses to `1fr`). The visible label
"ประเภทรายการ" is kept above the pair.

## Risks / Trade-offs

- **Switching type destroys typed input, with no undo** → Mitigated by the no-op guard (re-clicking the
  active type does nothing), by preserving the date (the most expensive field to retype), and by
  keeping the buttons visually adjacent so an accidental hit is noticed immediately. Accepted: the user
  explicitly chose immediate clear over a confirmation dialog.
- **Unlocking the type makes invalid trade sets reachable for the first time** → Mitigated by D6's
  full-set pre-flight, which blocks the save with a message instead of throwing inside Redux; the
  backstop `try/catch` in `handleUpdateTrade` covers a pre-flight/dispatch disagreement.
- **Three duplicated theme blocks** → A token added to only two of them silently regresses one theme.
  Mitigation: the tasks list all three blocks explicitly, and the manual check toggles the theme both
  ways.
- **`reset()` also clears RHF's validation state** → Intended, but `errors.root` is not owned by any
  field, so `clearErrors()` is called explicitly; a test asserts a prior root error disappears.
- **Full-set FIFO simulation runs on every submit, including BUY** → O(trades × lots) on a
  single-user dataset; measured nowhere near a concern. If it ever were, memoizing
  `computeAllRealizedGains(trades)` and only re-simulating edited symbols would be the next step.
- **`aria-checked` doubles as the CSS selection hook** → Correct, but couples styling to ARIA: changing
  the semantics later would restyle the control. Accepted for the single source of truth.

## Migration Plan

No data migration: no schema, storage key, or persisted field changes. The form's persisted output for
a given type is byte-identical before and after. Rollback is reverting the touched files; stored trades
and remittances are unaffected either way. Existing users see the new control on next load — a pure
presentation and interaction change.

## Open Questions

- Whether the segmented control should also show the quantity/colour hints of `.trade-type-badge` (used
  in tables) — deferred; purely cosmetic and does not affect the specs or the task breakdown.