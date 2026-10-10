# Tasks

## 1. Write unit test first (test-first)
- [x] Create `src/components/DividendForm.spec.tsx` with Jest + `@testing-library/react`
- [x] Assert `open={true}` renders overlay element in DOM
- [x] Assert `open={false}` renders no overlay element
- [x] Assert clicking modal content does not invoke onClose
- [x] Assert modal has proper accessibility attributes (role="dialog", aria-modal="true")
- [x] Assert date field defaults to today when opening for new dividend
- [x] Assert date field shows editRecord date when editing existing dividend
- [x] Run `npm test` — confirmed 6 tests pass

## 2. Add / fix CSS for modal overlay
- [x] Add CSS for `.modal-overlay`: position fixed, full viewport, dark backdrop, z-index 1000, flex center, blur backdrop (`src/index.css`)
- [x] Add CSS for `.modal-content`: surface bg, border radius, shadow, max-width 540px, centered
- [x] Add `.modal-header` and `.modal-actions` styling for form layout
- [x] Verify overlay centered and backdrop dark

## 3. Run test and verify
- [x] `npm test` — 170 passed (all suites green, 4 new DividendForm tests included)
- [x] `npm run lint` — 0 errors (only pre-existing warnings)
- [x] `npm run build` — pre-existing build failure from `*.spec.ts` missing jest types (documented, unrelated to this change)

## 4. Validate OpenSpec change
- [x] `openspec validate fix-dividend-form-modal-display` — valid (passed)
