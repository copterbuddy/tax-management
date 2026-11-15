/**
 * Which dashboard tab is open, kept in the URL fragment so a reload (F5) or a
 * shared link lands on the same tab. One responsibility: tab ↔ URL.
 */

import { useCallback, useEffect, useState } from 'react';

export const TAB_IDS = ['trades', 'dividends', 'remittances'] as const;
export type TabId = (typeof TAB_IDS)[number];

export const DEFAULT_TAB: TabId = 'trades';

/** The tab named by a URL fragment; anything unknown falls back to the default. */
export function tabFromHash(hash: string): TabId {
  const raw = hash.replace(/^#/, '');
  return (TAB_IDS as readonly string[]).includes(raw) ? (raw as TabId) : DEFAULT_TAB;
}

/** The fragment that represents a tab. */
export function hashForTab(tab: TabId): string {
  return `#${tab}`;
}

/** Path + query + a fragment, so replacing the tab never drops other URL state. */
function urlWithFragment(tab: TabId): string {
  const { pathname, search } = window.location;
  return `${pathname}${search}${hashForTab(tab)}`;
}

function currentUrl(): string {
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

/**
 * Active tab plus a selector that keeps the fragment in sync.
 * `replaceState` is deliberate: switching tabs is not history the user should
 * have to walk back through, and it must not reload the page.
 */
export function useActiveTab(): [TabId, (tab: TabId) => void] {
  const [activeTab, setActiveTab] = useState<TabId>(() => tabFromHash(window.location.hash));

  const selectTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    if (currentUrl() !== urlWithFragment(tab)) {
      window.history.replaceState(null, '', urlWithFragment(tab));
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => setActiveTab(tabFromHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return [activeTab, selectTab];
}