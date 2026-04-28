import React, { useState } from 'react';
import { VscEyeClosed, VscEye } from 'react-icons/vsc';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signup } from '../hooks/UseUser';
import { ISignup } from '../models/signup';
import { IResponse } from '../models/response';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { signupSchema } from '../validation/forms';

type SignupFormValues = z.infer<typeof signupSchema>;

const Signup = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
    },
  });

  const toFieldError = (name: 'username' | 'email' | 'phone' | 'password' | 'confirmPassword') => {
    const code = errors[name]?.message;
    if (!code) return null;
    if (code === 'password_mismatch') return t('auth.messages.passwordsDoNotMatch');
    if (code === 'username_short') return t('profile.messages.usernameShort');
    if (code === 'email_invalid') return t('profile.messages.emailInvalid');
    if (code === 'phone_invalid') return t('profile.messages.phoneInvalid');
    return t('auth.messages.fillAllFields');
  };

  const onSubmit = async (values: SignupFormValues) => {
    setFormError(null);

    const user: ISignup = {
      username: values.username.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      password: values.password,
    };
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
    reset();
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            id="username"
            name="username"
            label={t('auth.fields.username')}
            placeholder={t('auth.fields.usernamePlaceholder')}
            autoComplete="username"
            minLength={3}
            {...register('username')}
            required
            error={toFieldError('username')}
          />
          <Input
            id="email"
            name="email"
            type="email"
            label={t('auth.fields.email')}
            placeholder={t('auth.fields.emailPlaceholder')}
            autoComplete="email"
            {...register('email')}
            required
            error={toFieldError('email')}
          />
          <Input
            id="phone"
            name="phone"
            type="tel"
            label={t('auth.fields.phone')}
            placeholder={t('auth.fields.phonePlaceholder')}
            autoComplete="tel"
            {...register('phone')}
            required
            error={toFieldError('phone')}
          />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            label={t('auth.fields.password')}
            placeholder={t('auth.fields.passwordPlaceholder')}
            autoComplete="new-password"
            {...register('password')}
            required
            error={toFieldError('password')}
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
            {...register('confirmPassword')}
            required
            error={toFieldError('confirmPassword')}
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

          {formError && (
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
