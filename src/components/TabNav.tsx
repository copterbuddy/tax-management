/**
 * Presentational tab bar. Knows how a tab looks, not what a tab contains.
 */

import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { TAB_IDS, type TabId } from '../hooks/useActiveTab';
import { IconBarChart, IconCoins, IconLandmark } from './Icons';

const TAB_META: Record<TabId, { icon: ReactNode; labelKey: string }> = {
  trades: { icon: <IconBarChart size={16} />, labelKey: 'common:tabTrades' },
  dividends: { icon: <IconCoins size={16} />, labelKey: 'dividend:tabDividends' },
  remittances: { icon: <IconLandmark size={16} />, labelKey: 'common:tabRemittances' },
};

interface TabNavProps {
  activeTab: TabId;
  onSelect: (tab: TabId) => void;
}

export function TabNav({ activeTab, onSelect }: TabNavProps) {
  const { t } = useTranslation();

  return (
    <div className="tab-nav" role="tablist">
      {TAB_IDS.map(id => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeTab === id}
          className={`tab-btn ${activeTab === id ? 'active' : ''}`}
          onClick={() => onSelect(id)}
        >
          {TAB_META[id].icon}
          <span>{t(TAB_META[id].labelKey)}</span>
        </button>
      ))}
    </div>
  );
}