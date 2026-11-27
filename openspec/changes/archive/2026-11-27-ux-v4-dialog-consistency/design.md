# Design: UX v4 — Dialog Consistency, Modal Ergonomics & Crisp Tooltips

## Decisions

1. **Modal Body Padding & Backdrop Click**:
   - `FilingSummarySheet.tsx`: Wrap subtitle, figures, issues, lock section, and actions inside `<div className="trade-form">`; attach `onClick={onClose}` on `.trade-form-overlay` and `onClick={e => e.stopPropagation()}` on `.trade-form-modal`; add `Escape` keydown listener.
   - `DocRefDialog.tsx`: Same `.trade-form` body wrapper, backdrop click dismissal, and `Escape` keydown listener.
2. **Close Button & Escape Consistency**:
   - `DividendRemitForm.tsx`: Replace `.modal-close` with `.btn-close`, add `Escape` keydown listener when `open` is true.
   - `MarkReinvestedDialog.tsx`: Add `Escape` keydown listener calling `onCancel`.
3. **Tooltip SVG Icon**:
   - Export `IconInfo` in `src/components/Icons.tsx` and render `<IconInfo size={14} />` as default trigger content in `src/components/Tooltip.tsx`.
