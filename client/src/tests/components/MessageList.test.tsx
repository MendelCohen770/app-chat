import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MessageList from '../../components/MessageList';

const chatState = {
  selectedUser: { _id: 'other-1' },
  searchQuery: '',
  scrollToBottomRequestId: 0,
};

const emitMessagesReadMock = vi.fn();
const subscribeToMessageStatusMock = vi.fn();
const onNewMessageMock = vi.fn();
const subscribeToMessageEditedMock = vi.fn();
const subscribeToMessageDeletedMock = vi.fn();
const subscribeToMessageReactedMock = vi.fn();
const apiGetMock = vi.fn();

vi.mock('../../context/useUser', () => ({
  useUser: () => ({
    user: { _id: 'me-1' },
  }),
}));

vi.mock('../../context/useChat', () => ({
  useChat: () => chatState,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      typeof options?.count === 'number' ? `${key}:${options.count}` : key,
  }),
}));

vi.mock('../../components/MessageItem', () => ({
  default: ({ message }: { message: { text: string } }) => <div>{message.text}</div>,
}));

vi.mock('../../components/ui/States', () => ({
  MessageListSkeleton: () => <div>loading</div>,
  LoadingState: ({ title }: { title: string }) => <div>{title}</div>,
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  ErrorState: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../../service/socket', () => ({
  onNewMessage: (...args: unknown[]) => onNewMessageMock(...args),
  subscribeToMessageStatus: (...args: unknown[]) => subscribeToMessageStatusMock(...args),
  subscribeToMessageEdited: (...args: unknown[]) => subscribeToMessageEditedMock(...args),
  subscribeToMessageDeleted: (...args: unknown[]) => subscribeToMessageDeletedMock(...args),
  subscribeToMessageReacted: (...args: unknown[]) => subscribeToMessageReactedMock(...args),
  emitMessagesRead: (...args: unknown[]) => emitMessagesReadMock(...args),
}));

vi.mock('../../service/apiClient', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
  },
}));

describe('MessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chatState.searchQuery = '';
    apiGetMock.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              _id: 'm1',
              sender: 'me-1',
              receiver: 'other-1',
              content: 'hello there',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          nextCursor: null,
          hasMore: false,
        },
      },
    });
    subscribeToMessageStatusMock.mockReturnValue(() => {});
    subscribeToMessageEditedMock.mockReturnValue(() => {});
    subscribeToMessageDeletedMock.mockReturnValue(() => {});
    subscribeToMessageReactedMock.mockReturnValue(() => {});
  });

  it('loads and renders messages from API', async () => {
    render(<MessageList />);

    expect(await screen.findByText('hello there')).toBeInTheDocument();
    expect(apiGetMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(onNewMessageMock).toHaveBeenCalledTimes(1);
      expect(subscribeToMessageStatusMock).toHaveBeenCalledTimes(1);
    });
  });

  it('shows no matches state when search has no results', async () => {
    chatState.searchQuery = 'absent';
    render(<MessageList />);

    await waitFor(() => {
      expect(screen.getByText('chat.searchInChat.noMatches')).toBeInTheDocument();
    });
  });
});
