# Tasks

## 1. Engine

- [ ] 1.1 Add `changedFilingFields(current, filed)` to `filingSummary.ts`, returning the names of fields whose THB value differs by more than a cent.
- [ ] 1.2 Tests: identical sets return nothing; each field alone is detected; sub-cent noise is ignored.

## 2. Store

- [ ] 2.1 Add `src/store/filingSlice.ts`: `locks: Record<number, { lockedAt: string; figures: FilingFigures }>`, `lockYear`, `unlockYear`, persisted under `tax_tracker_year_locks`.
- [ ] 2.2 Register the slice in `src/store/index.ts` and expose it in the app state type.
- [ ] 2.3 Tests: locking stores the figures and survives a fresh store; unlocking removes them; locking twice keeps the latest snapshot.

## 3. Sheet

- [ ] 3.1 `FilingSummarySheet` accepts `locked`, `onLock`, `onUnlock`; renders "ล็อกปีนี้" when unlocked, and when locked shows the timestamp plus the changed-field warning (or "ยังตรงกับที่ยื่น").
- [ ] 3.2 i18n keys in both languages.
- [ ] 3.3 Component tests: unlocked shows the lock action; a locked year with a moved field shows the warning; an unchanged locked year shows the agreement line.

## 4. Verification

- [ ] 4.1 `npm test`, `npm run lint` pass.
- [ ] 4.2 Browser: lock 2026, edit a remittance amount, reopen the sheet → warning names the changed field; unlock → warning gone.
- [ ] 4.3 `openspec validate year-lock --strict`, then archive.
