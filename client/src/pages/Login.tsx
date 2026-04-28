import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { VscEyeClosed, VscEye } from 'react-icons/vsc';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { login, googleLogin, requestOtp, verifyOtp } from '../hooks/UseUser';
import { IResponse } from '../models/response';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/useUser';
import { IUser } from '../models/user';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { loginSchema, otpRequestSchema, otpVerifySchema } from '../validation/forms';

type LoginFormValues = z.infer<typeof loginSchema>;
type OtpRequestValues = z.infer<typeof otpRequestSchema>;
type OtpVerifyValues = z.infer<typeof otpVerifySchema>;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type LoginMode = 'password' | 'otp';
type OtpStep = 'request' | 'verify';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<LoginMode>('password');
  const [otpStep, setOtpStep] = useState<OtpStep>('request');
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const userContext = useUser();
  const navigate = useNavigate();
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });
  const otpRequestForm = useForm<OtpRequestValues>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: { otpEmail: '' },
  });
  const otpVerifyForm = useForm<OtpVerifyValues>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { otpCode: '' },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    setLoginLoading(true);
    const res: IResponse = await login(values.username.trim(), values.password);
    setLoginLoading(false);
    if (!res.isSuccessful) {
      const msg = res.displayMessage || t('auth.messages.genericFailure');
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (!userContext) {
      toast.error(t('auth.messages.genericFailure'));
      return;
    }
    const { saveUser } = userContext;
    if (res.data && typeof res.data === 'object' && '_id' in (res.data as any)) {
      saveUser(res.data as IUser);
      toast.success(t('auth.messages.loginSuccess'));
      loginForm.reset();
      navigate('/home');
    } else {
      toast.error(t('auth.messages.genericFailure'));
    }
  };

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    const credential = credentialResponse.credential;
    if (!credential) {
      toast.error(t('auth.messages.googleFailed'));
      return;
    }
    const res: IResponse = await googleLogin(credential);
    if (!res.isSuccessful) {
      toast.error(res.displayMessage || t('auth.messages.googleFailed'));
      return;
    }
    if (!userContext) return;
    const { saveUser } = userContext;
    if (res.data && typeof res.data === 'object' && '_id' in (res.data as any)) {
      saveUser(res.data as IUser);
      toast.success(t('auth.messages.loginSuccess'));
      navigate('/home');
    } else {
      toast.error(t('auth.messages.genericFailure'));
    }
  };

  const switchMode = (next: LoginMode) => {
    setMode(next);
    setOtpStep('request');
    setOtpMessage(null);
    setOtpError(null);
    setFormError(null);
    otpRequestForm.reset();
    otpVerifyForm.reset();
  };

  const handleRequestOtp = async (values: OtpRequestValues) => {
    setOtpError(null);
    setOtpMessage(null);
    setOtpLoading(true);
    const email = values.otpEmail.trim();
    const res: IResponse = await requestOtp(email);
    setOtpLoading(false);
    if (!res.isSuccessful) {
      setOtpError(res.displayMessage || t('auth.messages.otpFailed'));
      return;
    }
    setOtpStep('verify');
    otpRequestForm.setValue('otpEmail', email);
    setOtpMessage(res.displayMessage || t('auth.messages.otpSent'));
  };

  const handleVerifyOtp = async (values: OtpVerifyValues) => {
    setOtpError(null);
    setOtpMessage(null);
    setOtpLoading(true);
    const otpEmail = otpRequestForm.getValues('otpEmail');
    const res: IResponse = await verifyOtp(otpEmail, values.otpCode.trim());
    setOtpLoading(false);
    if (!res.isSuccessful) {
      setOtpError(res.displayMessage || t('auth.messages.otpInvalid'));
      return;
    }
    if (!userContext) return;
    const { saveUser } = userContext;
    if (res.data && typeof res.data === 'object' && '_id' in (res.data as any)) {
      saveUser(res.data as IUser);
      toast.success(t('auth.messages.loginSuccess'));
      otpRequestForm.reset();
      otpVerifyForm.reset();
      setOtpStep('request');
      navigate('/home');
    } else {
      setOtpError(t('auth.messages.genericFailure'));
    }
  };

  const handleResendOtp = async () => {
    setOtpError(null);
    setOtpMessage(null);
    const otpEmail = otpRequestForm.getValues('otpEmail');
    if (!otpEmail) {
      setOtpError(t('auth.messages.enterEmail'));
      return;
    }
    setOtpLoading(true);
    const res: IResponse = await requestOtp(otpEmail);
    setOtpLoading(false);
    if (!res.isSuccessful) {
      setOtpError(res.displayMessage || t('auth.messages.otpFailed'));
      return;
    }
    setOtpMessage(res.displayMessage || t('auth.messages.otpResent'));
  };

  const tabBtn = (active: boolean) =>
    [
      'flex-1 h-10 text-sm font-medium transition-colors',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-inset',
      active ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600',
    ].join(' ');

  return (
    <main className="flex items-center justify-center min-h-svh bg-slate-900 px-4 py-6 select-none">
      <section
        aria-labelledby="login-title"
        className="bg-slate-800 p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-sm"
      >
        <header className="flex items-center justify-between mb-6 gap-2">
          <h1 id="login-title" className="text-2xl font-bold text-slate-100">
            {t('auth.login')}
          </h1>
          <LanguageSwitcher />
        </header>

        <div
          role="tablist"
          aria-label={t('auth.login')}
          className="flex mb-6 rounded-md overflow-hidden border border-slate-700"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'password'}
            aria-controls="panel-password"
            id="tab-password"
            onClick={() => switchMode('password')}
            className={tabBtn(mode === 'password')}
          >
            {t('auth.mode.password')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'otp'}
            aria-controls="panel-otp"
            id="tab-otp"
            onClick={() => switchMode('otp')}
            className={tabBtn(mode === 'otp')}
          >
            {t('auth.mode.otp')}
          </button>
        </div>

        {mode === 'password' ? (
          <form
            id="panel-password"
            role="tabpanel"
            aria-labelledby="tab-password"
            onSubmit={loginForm.handleSubmit(handleSubmit)}
            className="space-y-4"
            noValidate
          >
            <Input
              id="username"
              label={t('auth.fields.username')}
              placeholder={t('auth.fields.usernamePlaceholder')}
              autoComplete="username"
              {...loginForm.register('username')}
              required
              error={loginForm.formState.errors.username ? t('auth.messages.fillAllFields') : null}
            />

            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              label={t('auth.fields.password')}
              placeholder={t('auth.fields.passwordPlaceholder')}
              autoComplete="current-password"
              {...loginForm.register('password')}
              required
              error={loginForm.formState.errors.password ? t('auth.messages.fillAllFields') : null}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={t(showPassword ? 'auth.actions.hidePassword' : 'auth.actions.showPassword')}
                  aria-pressed={showPassword}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                >
                  {showPassword ? <VscEye size={20} /> : <VscEyeClosed size={20} />}
                </button>
              }
            />

            {formError && (
              <p role="alert" className="text-sm text-red-400 text-center">
                {formError}
              </p>
            )}

            {GOOGLE_CLIENT_ID ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => toast.error(t('auth.messages.googleFailed'))}
                  useOneTap
                />
              </div>
            ) : (
              <p className="text-xs text-amber-400 text-center">
                {t('auth.messages.googleUnavailable')}
              </p>
            )}

            <Button type="submit" fullWidth size="lg" isLoading={loginLoading}>
              {t('auth.actions.submitLogin')}
            </Button>

            <p className="text-center text-sm text-slate-300">
              {t('auth.links.noAccount')}{' '}
              <a
                href="/signup"
                className="text-orange-400 hover:text-orange-300 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded"
              >
                {t('auth.signup')}
              </a>
            </p>
          </form>
        ) : (
          <form
            id="panel-otp"
            role="tabpanel"
            aria-labelledby="tab-otp"
            onSubmit={
              otpStep === 'request'
                ? otpRequestForm.handleSubmit(handleRequestOtp)
                : otpVerifyForm.handleSubmit(handleVerifyOtp)
            }
            className="space-y-4"
            noValidate
          >
            <Input
              id="otp-email"
              type="email"
              label={t('auth.fields.email')}
              placeholder={t('auth.fields.emailPlaceholder')}
              autoComplete="email"
              {...otpRequestForm.register('otpEmail')}
              disabled={otpStep === 'verify'}
              required
              error={
                otpRequestForm.formState.errors.otpEmail
                  ? t('profile.messages.emailInvalid')
                  : null
              }
            />

            {otpStep === 'verify' && (
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                label={t('auth.fields.otpCode')}
                placeholder={t('auth.fields.otpCodePlaceholder')}
                {...otpVerifyForm.register('otpCode')}
                required
                className="tracking-widest text-center"
                error={otpVerifyForm.formState.errors.otpCode ? t('auth.messages.enterOtp') : null}
              />
            )}

            <div aria-live="polite" className="min-h-[1.25rem] text-center">
              {otpMessage && <p className="text-xs text-green-400">{otpMessage}</p>}
              {otpError && (
                <p role="alert" className="text-xs text-red-400">
                  {otpError}
                </p>
              )}
            </div>

            <Button type="submit" fullWidth size="lg" isLoading={otpLoading}>
              {otpLoading
                ? otpStep === 'request'
                  ? t('auth.actions.sending')
                  : t('auth.actions.verifying')
                : otpStep === 'request'
                ? t('auth.actions.sendOtp')
                : t('auth.actions.verifyOtp')}
            </Button>

            {otpStep === 'verify' && (
              <div className="flex justify-between text-sm gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOtpStep('request');
                    otpVerifyForm.reset();
                    setOtpError(null);
                    setOtpMessage(null);
                  }}
                >
                  {t('auth.actions.changeEmail')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={otpLoading}
                >
                  {t('auth.actions.resendOtp')}
                </Button>
              </div>
            )}

            <p className="text-center text-sm text-slate-300">
              {t('auth.links.noAccount')}{' '}
              <a
                href="/signup"
                className="text-orange-400 hover:text-orange-300 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded"
              >
                {t('auth.signup')}
              </a>
            </p>
          </form>
        )}
      </section>
    </main>
  );
};

const App: React.FC = () => {
  if (!GOOGLE_CLIENT_ID) {
    return <LoginPage />;
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginPage />
    </GoogleOAuthProvider>
  );
};

export default App;
