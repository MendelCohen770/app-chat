import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PresenceContext, type PresenceContextType } from '../../context/PresenceContext';
import { usePresence } from '../../context/usePresence';

describe('usePresence', () => {
  it('returns fallback value without provider', () => {
    const { result } = renderHook(() => usePresence());

    expect(result.current.onlineUserIds.size).toBe(0);
    expect(result.current.isOnline('123')).toBe(false);
  });

  it('returns context value when provider is present', () => {
    const value: PresenceContextType = {
      onlineUserIds: new Set(['abc']),
      isOnline: (userId) => userId === 'abc',
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
    );

    const { result } = renderHook(() => usePresence(), { wrapper });

    expect(result.current).toBe(value);
    expect(result.current.isOnline('abc')).toBe(true);
  });
});
