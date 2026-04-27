import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatContext, type ChatContextType } from '../../context/ChatContext';
import { useChat } from '../../context/useChat';

const createChatValue = (): ChatContextType => ({
  selectedUser: null,
  setSelectedUser: vi.fn(),
  searchOpen: false,
  openSearch: vi.fn(),
  closeSearch: vi.fn(),
  searchQuery: '',
  setSearchQuery: vi.fn(),
  scrollToBottomRequestId: 0,
  requestScrollToBottom: vi.fn(),
});

describe('useChat', () => {
  it('returns context value when wrapped by provider', () => {
    const value = createChatValue();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    );

    const { result } = renderHook(() => useChat(), { wrapper });

    expect(result.current).toBe(value);
  });

  it('returns undefined and logs when used without provider', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { result } = renderHook(() => useChat());

    expect(result.current).toBeUndefined();
    expect(logSpy).toHaveBeenCalledWith('useChat must be used within a ChatProvider');
    logSpy.mockRestore();
  });
});
