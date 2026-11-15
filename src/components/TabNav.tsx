/**
 * Presentational tab bar. Knows how a tab looks, not what a tab contains.
 */

import { useTranslation } from 'react-i18next';
import { TAB_IDS, type TabId } from '../hooks/useActiveTab';

const TAB_META: Record<TabId, { icon: string; labelKey: string }> = {
  trades: { icon: '📊', labelKey: 'common:tabTrades' },
  dividends: { icon: '💵', labelKey: 'dividend:tabDividends' },
  remittances: { icon: '🏦', labelKey: 'common:tabRemittances' },
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
          {TAB_META[id].icon} {t(TAB_META[id].labelKey)}
        </button>
      ))}
    </div>
  );
}