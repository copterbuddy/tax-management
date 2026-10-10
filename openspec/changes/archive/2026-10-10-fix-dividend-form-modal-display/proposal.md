# fix-dividend-form-modal-display

## Why

The "➕ บันทึกเงินปันผล" button in DividendTab opens DividendForm but the modal overlay (.modal-overlay) lacks proper CSS positioning (fixed, z-index, backdrop), so the form HTML is rendered inline below the table instead of as a centered popup overlay like TradeForm / RemitForm. User observed DOM being appended instead of modal behavior.

## What Changes

- Add / fix CSS for .modal-overlay: position fixed, full viewport, dark backdrop (rgba), z-index high.
- Add / fix CSS for .modal-content: position relative, centered (margin auto / flex), z-index above overlay.
- Add / fix modal close behavior (click overlay closes).
- Add Jest unit test for DividendForm open/close state (test first: assert modal renders when open=true, null when open=false; assert overlay click triggers onClose).
- Ensure test passes before CSS fix applied.

## Capabilities

### New Capabilities
- `dividend-form-modal-display`: DividendForm renders as a centered modal overlay when open=true, hidden when open=false.

### Modified Capabilities
- (none — pure display / CSS change with test coverage)

## Impact
- `src/components/DividendForm.tsx` (CSS class names, structure unchanged)
- `src/components/DividendTab.tsx` (no logic change, only button behavior verified)
- New test file: `src/components/DividendForm.spec.tsx` (test-first)
- Potentially global styles or component-level CSS file.
