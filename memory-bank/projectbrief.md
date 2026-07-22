# Project Brief - Thailand Tax Management Tracker

## Project Name
Tax Management (tax-managenment)

## Core Purpose
A web application for Thai taxpayers to track foreign stock and crypto trading history and calculate tax liability according to Thai Revenue Department (RD) rules.

## Key Requirements
1. **FIFO Cost Basis Accounting**: Match sell orders against earliest buy lots (mandatory per Thai RD).
2. **THB Conversion**: Convert all foreign currency transactions to Thai Baht using FX rates on transaction dates.
3. **Commission Handling**: Add buy commission to cost basis; deduct sell commission from gross revenue.
4. **Asset Types**: Support FOREIGN_STOCK and CRYPTO categories.
5. **Data Persistence**: All trade data persisted via localStorage.
6. **Export/Import**: Support Markdown table and CSV formats.
7. **Dark Mode UI**: Modern glassmorphism aesthetic with responsive design.

## Scope
- **In Scope**: Manual trade entry, FIFO gain/loss calculation, yearly tax summary, data export/import.
- **Phase 2 (Future)**: Auto FX rate fetching, tax loss harvesting suggestions, multi-currency support, P.N.D.90/91 report generation.

## Success Criteria
- Users can enter buy/sell trades for foreign stocks and crypto
- System correctly calculates realized gains/losses using FIFO
- All amounts display in THB with correct FX conversion
- Data persists across sessions via localStorage
- Users can export trade data to Markdown/CSV and import it back