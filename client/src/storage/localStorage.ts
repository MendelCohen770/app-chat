const isBrowser = (): boolean => typeof window !== 'undefined' && !!window.localStorage;

export const STORAGE_KEYS = {
  currentUser: 'app-chat:user',
  selectedChatByUser: (userId: string) => `app-chat:selected-chat:${userId}`,
  draftMessageByChat: (userId: string, peerId: string) => `app-chat:draft:${userId}:${peerId}`,
} as const;

export const readStorage = <T>(key: string): T | null => {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Corrupted/stale values should not break app boot.
    window.localStorage.removeItem(key);
    return null;
  }
};

export const writeStorage = <T>(key: string, value: T): void => {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const removeStorage = (key: string): void => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
};
