# fix-dividend-form-modal-display

Fix DividendForm modal display: button '➕ บันทึกเงินปันผล' should open as a popup (modal overlay with fixed position) instead of being appended to DOM below. Add CSS positioning (fixed, z-index, backdrop) to .modal-overlay and .modal-content, and include unit tests to verify modal open/close behavior.
