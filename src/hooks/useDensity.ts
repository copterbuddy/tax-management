import { useCallback, useEffect, useState } from 'react';

export type DisplayDensity = 'comfortable' | 'compact';

const STORAGE_KEY = 'tax_tracker_density';

function getInitialDensity(): DisplayDensity {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'compact' || stored === 'comfortable') return stored;
  } catch {
    // localStorage unavailable
  }
  return 'comfortable';
}

export function useDensity(): [DisplayDensity, () => void] {
  const [density, setDensity] = useState<DisplayDensity>(getInitialDensity);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
    try {
      localStorage.setItem(STORAGE_KEY, density);
    } catch {
      // localStorage unavailable
    }
  }, [density]);

  const toggleDensity = useCallback(() => {
    setDensity(prev => (prev === 'comfortable' ? 'compact' : 'comfortable'));
  }, []);

  return [density, toggleDensity];
}
