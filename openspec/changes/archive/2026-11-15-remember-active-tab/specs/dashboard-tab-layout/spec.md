# Spec Delta

## Purpose

Which tab the dashboard opens on, and how that choice survives a reload or a shared link.

## ADDED Requirements

### Requirement: The active tab is addressable in the URL

The dashboard SHALL read the active tab from the URL fragment on load and SHALL write the fragment when the user switches tabs, using a history replacement rather than a new history entry. An empty or unrecognised fragment SHALL open the Trades tab.

#### Scenario: Reload restores the tab

- **WHEN** the app is loaded with the fragment `#dividends`
- **THEN** the Dividend tab is active
- **AND** the Trades tab content is not rendered

#### Scenario: Switching tabs updates the fragment

- **WHEN** the user selects the Remittances tab
- **THEN** the fragment becomes `#remittances`
- **AND** no page reload occurs

#### Scenario: An unknown fragment falls back to Trades

- **WHEN** the app is loaded with no fragment, or with a fragment that names no tab
- **THEN** the Trades tab is active

#### Scenario: Back and forward move between tabs

- **WHEN** the user navigates back to a previous fragment
- **THEN** the tab that fragment names becomes active
