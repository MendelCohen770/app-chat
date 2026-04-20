import React, { useState } from 'react';
import { VscEyeClosed, VscEye } from 'react-icons/vsc';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { signup } from '../hooks/UseUser';
import { ISignup } from '../models/signup';
import { IResponse } from '../models/response';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';

const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setMismatch(false);

    if (!username || !email || !password || !confirmPassword || !phone) {
      setFormError(t('auth.messages.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      setMismatch(true);
      setFormError(t('auth.messages.passwordsDoNotMatch'));
      return;
    }

    const user: ISignup = { username, password, email, phone };
    setLoading(true);
    const response: IResponse = await signup(user);
    setLoading(false);

    if (!response?.isSuccessful) {
      const msg = response?.displayMessage || t('auth.messages.genericFailure');
      setFormError(msg);
      toast.error(msg);
      return;
    }
    toast.success(t('auth.messages.signupSuccess'));
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    navigate('/');
  };

  return (
    <main className="flex items-center justify-center min-h-svh bg-slate-900 px-4 py-6 select-none">
      <section
        aria-labelledby="signup-title"
        className="bg-slate-800 p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-sm"
      >
        <header className="flex items-center justify-between mb-6 gap-2">
          <h1 id="signup-title" className="text-2xl font-bold text-slate-100">
            {t('auth.signup')}
          </h1>
          <LanguageSwitcher />
        </header>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            id="username"
            name="username"
            label={t('auth.fields.username')}
            placeholder={t('auth.fields.usernamePlaceholder')}
            autoComplete="username"
            minLength={3}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            id="email"
            name="email"
            type="email"
            label={t('auth.fields.email')}
            placeholder={t('auth.fields.emailPlaceholder')}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            id="phone"
            name="phone"
            type="tel"
            label={t('auth.fields.phone')}
            placeholder={t('auth.fields.phonePlaceholder')}
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label={t('auth.fields.password')}
            placeholder={t('auth.fields.passwordPlaceholder')}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            error={mismatch ? t('auth.messages.passwordsDoNotMatch') : null}
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
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            label={t('auth.fields.confirmPassword')}
            placeholder={t('auth.fields.confirmPasswordPlaceholder')}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            error={mismatch ? t('auth.messages.passwordsDoNotMatch') : null}
            trailing={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={t(showConfirmPassword ? 'auth.actions.hidePassword' : 'auth.actions.showPassword')}
                aria-pressed={showConfirmPassword}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
              >
                {showConfirmPassword ? <VscEye size={20} /> : <VscEyeClosed size={20} />}
              </button>
            }
          />

          {formError && !mismatch && (
            <p role="alert" className="text-sm text-red-400 text-center">
              {formError}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" isLoading={loading}>
            {t('auth.actions.submitSignup')}
          </Button>

          <p className="text-center text-sm text-slate-300">
            {t('auth.links.haveAccount')}{' '}
            <a
              href="/"
              className="text-orange-400 hover:text-orange-300 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded"
            >
              {t('auth.login')}
            </a>
          </p>
        </form>
      </section>
    </main>
  );
};

export default Signup;
