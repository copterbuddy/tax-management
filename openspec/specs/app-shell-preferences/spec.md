# app-shell-preferences Specification

## Purpose

Defines application-level shell behavior: light/dark theme persistence with transition-flash prevention, Thai/English i18n initialization and switching, and render error boundary recovery (`src/context/ThemeContext.tsx`, `src/i18n/index.ts`, `src/components/ErrorBoundary.tsx`).

## Requirements

### Requirement: Theme preference switches between dark and light and persists

`ThemeProvider` SHALL initialize theme from `localStorage['tax_tracker_theme']` if `'light'` or `'dark'`, otherwise check `prefers-color-scheme: dark`, and otherwise default to `'dark'`. Applying a theme SHALL set `data-theme` on `<html>` while temporarily applying `.no-transitions` across two `requestAnimationFrame` ticks, and persist changes to `localStorage['tax_tracker_theme']`.

#### Scenario: First-time user with no stored theme defaults to dark

- **WHEN** `localStorage['tax_tracker_theme']` is absent
- **THEN** `ThemeProvider` sets `data-theme="dark"` on `<html>`

#### Scenario: Toggling theme persists the new selection

- **WHEN** the user clicks the theme toggle in the dashboard header
- **THEN** `data-theme` switches between `dark` and `light` and updates `localStorage['tax_tracker_theme']`

### Requirement: Application supports Thai and English i18n with persistent selection

`i18next` SHALL initialize with `'th'` as the fallback language across the four namespaces (`common`, `trade`, `remittance`, `dividend`), read initial language from `localStorage['lang']` (`'th'` or `'en'`), configure `returnNull: false`, and persist language switches made from the header switcher via `persistLanguage`.

#### Scenario: Switching language updates UI copy and persists to localStorage

- **WHEN** the user clicks `EN` in the dashboard header
- **THEN** `i18next` switches to `'en'` and stores `'en'` in `localStorage['lang']`

### Requirement: AppErrorBoundary catches render errors with a localized recovery screen

`AppErrorBoundary` SHALL wrap the application root outside `ThemeProvider` and Redux `Provider`, catching React render errors and rendering a localized fallback card displaying the error details and a reload/reset button.

#### Scenario: Render error displays fallback UI instead of blank screen

- **WHEN** a child component throws during React rendering
- **THEN** `AppErrorBoundary` renders the localized error card with a reset button
