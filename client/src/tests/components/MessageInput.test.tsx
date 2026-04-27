import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MessageInput from '../../components/MessageInput';

const emitTypingStartMock = vi.fn();
const emitTypingStopMock = vi.fn();
const sendMessageSpy = vi.fn();

vi.mock('../../context/useUser', () => ({
  useUser: () => ({
    user: { _id: 'me-1' },
  }),
}));

vi.mock('../../context/useChat', () => ({
  useChat: () => ({
    selectedUser: { _id: 'other-1' },
  }),
}));

vi.mock('../../service/socket', () => ({
  emitTypingStart: (...args: unknown[]) => emitTypingStartMock(...args),
  emitTypingStop: (...args: unknown[]) => emitTypingStopMock(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../components/MediaUploader', () => ({
  default: () => <div data-testid="media-uploader" />,
}));

vi.mock('../../components/Recordings', () => ({
  default: () => <div data-testid="recordings" />,
}));

vi.mock('../../components/SendButton', () => ({
  default: ({ onSend, disabled }: { onSend: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onSend} disabled={disabled} aria-label="send">
      send
    </button>
  ),
}));

vi.mock('emoji-picker-react', () => ({
  default: () => <div data-testid="emoji-picker" />,
  Theme: {},
}));

describe('MessageInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );
  });

  it('shows recordings when empty and send button once text exists', () => {
    render(<MessageInput sendMessage={sendMessageSpy} />);

    expect(screen.getByTestId('recordings')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('chat.messageInputPlaceholder'), {
      target: { value: 'hello' },
    });

    expect(screen.getByRole('button', { name: 'send' })).toBeInTheDocument();
    expect(emitTypingStartMock).toHaveBeenCalledWith('other-1');
  });

  it('sends trimmed message and clears typing state', async () => {
    render(<MessageInput sendMessage={sendMessageSpy} />);

    fireEvent.change(screen.getByLabelText('chat.messageInputPlaceholder'), {
      target: { value: ' hello world ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'send' }));

    await waitFor(() => {
      expect(sendMessageSpy).toHaveBeenCalledWith('hello world');
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(emitTypingStopMock).toHaveBeenCalledWith('other-1');
  });
});
