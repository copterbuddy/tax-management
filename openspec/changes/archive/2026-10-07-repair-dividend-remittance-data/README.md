# repair-dividend-remittance-data

Repair stored dividend remittances where `reportableIncomeTHB !== remitTHB`.
The repair copies the always-correct `remitTHB` to the wrong `reportableIncomeTHB`.

This is a separate follow-up change from `add-dividend-remittance-tests`, agreed on 2026-10-05.