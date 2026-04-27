import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import Login from '../../pages/Login';

const loginMock = vi.fn();
const googleLoginMock = vi.fn();
const requestOtpMock = vi.fn();
const verifyOtpMock = vi.fn();
const saveUserMock = vi.fn();
const navigateMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('../../hooks/UseUser', () => ({
  login: (...args: unknown[]) => loginMock(...args),
  googleLogin: (...args: unknown[]) => googleLoginMock(...args),
  requestOtp: (...args: unknown[]) => requestOtpMock(...args),
  verifyOtp: (...args: unknown[]) => verifyOtpMock(...args),
}));

vi.mock('../../context/useUser', () => ({
  useUser: () => ({ saveUser: saveUserMock }),
}));

vi.mock('../../components/ui/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher" />,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: ReactNode }) => children,
  GoogleLogin: () => <div data-testid="google-login-mock" />,
}));

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation message when submitting empty form', async () => {
    render(<Login />);

    fireEvent.click(screen.getByRole('button', { name: 'auth.actions.submitLogin' }));

    expect(await screen.findAllByText('auth.messages.fillAllFields')).toHaveLength(2);
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('logs in successfully and navigates home', async () => {
    loginMock.mockResolvedValue({
      isSuccessful: true,
      displayMessage: null,
      data: { _id: 'user-1', username: 'ella' },
    });

    render(<Login />);

    fireEvent.change(screen.getByLabelText('auth.fields.username'), {
      target: { value: 'ella' },
    });
    fireEvent.change(screen.getByLabelText('auth.fields.password'), {
      target: { value: 'Password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'auth.actions.submitLogin' }));

    await waitFor(() => {
      expect(saveUserMock).toHaveBeenCalledWith({ _id: 'user-1', username: 'ella' });
      expect(navigateMock).toHaveBeenCalledWith('/home');
    });
    expect(toastSuccessMock).toHaveBeenCalledWith('auth.messages.loginSuccess');
  });
});
