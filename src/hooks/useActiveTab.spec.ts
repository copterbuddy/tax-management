import '@testing-library/jest-dom';
import { act, renderHook } from '@testing-library/react';
import { TAB_IDS, hashForTab, tabFromHash, useActiveTab } from './useActiveTab';

beforeEach(() => {
  window.history.replaceState(null, '', window.location.pathname);
});

describe('tabFromHash', () => {
  it('maps every known fragment to its tab', () => {
    for (const id of TAB_IDS) {
      expect(tabFromHash(hashForTab(id))).toBe(id);
      expect(tabFromHash(id)).toBe(id);
    }
  });

  it('falls back to the default for an empty or unknown fragment', () => {
    expect(tabFromHash('')).toBe('trades');
    expect(tabFromHash('#')).toBe('trades');
    expect(tabFromHash('#not-a-tab')).toBe('trades');
  });
});

describe('useActiveTab', () => {
  it('starts on the tab named by the fragment', () => {
    window.history.replaceState(null, '', '#dividends');
    const { result } = renderHook(() => useActiveTab());
    expect(result.current[0]).toBe('dividends');
  });

  it('writes the fragment on select without dropping the query string', () => {
    window.history.replaceState(null, '', '/?keep=1#trades');
    const { result } = renderHook(() => useActiveTab());

    act(() => result.current[1]('remittances'));

    expect(window.location.hash).toBe('#remittances');
    expect(window.location.search).toBe('?keep=1');
    expect(result.current[0]).toBe('remittances');
  });

  it('follows a hashchange event', () => {
    const { result } = renderHook(() => useActiveTab());

    act(() => {
      window.history.replaceState(null, '', '#dividends');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(result.current[0]).toBe('dividends');
  });

  it('removes its listener on unmount', () => {
    const { result, unmount } = renderHook(() => useActiveTab());
    unmount();

    act(() => {
      window.history.replaceState(null, '', '#remittances');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    expect(result.current[0]).toBe('trades');
  });
});