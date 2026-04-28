import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { IoArrowBack, IoArrowForward } from 'react-icons/io5';
import { LuCamera } from 'react-icons/lu';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser } from '../context/useUser';
import { IUser } from '../models/user';
import { IResponse } from '../models/response';
import {
    updateUserProfile,
    uploadProfileIcon as uploadProfileIconApi,
    changePassword as changePasswordApi,
    logoutUser,
    resolveMediaUrl,
} from '../hooks/UseUser';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { isRtlLanguage } from '../i18n';
import { profileDetailsSchema, profilePasswordSchema } from '../validation/forms';

type ProfileDetailsValues = z.infer<typeof profileDetailsSchema>;
type ProfilePasswordValues = z.infer<typeof profilePasswordSchema>;

const DEFAULT_AVATAR =
    'https://www.prtfl.co.il/wp-content/uploads/2023/11/WhatsApp-Image-2023-11-20-at-14.19.59-1.jpg';
const MAX_AVATAR_SIZE = 3 * 1024 * 1024; // 3 MB
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const Profile: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const userContext = useUser();
    const isRtl = isRtlLanguage(i18n.language);
    const BackIcon = isRtl ? IoArrowForward : IoArrowBack;

    const user = userContext?.user as IUser | null;

    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSaving, setProfileSaving] = useState(false);

    const [avatarUploading, setAvatarUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSaving, setPasswordSaving] = useState(false);

    const [loggingOut, setLoggingOut] = useState(false);
    const detailsForm = useForm<ProfileDetailsValues>({
        resolver: zodResolver(profileDetailsSchema),
        defaultValues: { username: '', email: '', phone: '' },
    });
    const passwordForm = useForm<ProfilePasswordValues>({
        resolver: zodResolver(profilePasswordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    });

    useEffect(() => {
        if (!userContext || !user) {
            navigate('/', { replace: true });
        }
    }, [user, userContext, navigate]);

    useEffect(() => {
        if (!user) return;
        detailsForm.reset({
            username: user.username ?? '',
            email: user.email ?? '',
            phone: user.phone ?? '',
        });
    }, [user]);

    const avatarSrc = useMemo(() => {
        if (previewUrl) return previewUrl;
        const icon = user?.profileIcon;
        if (!icon) return DEFAULT_AVATAR;
        return resolveMediaUrl(icon) || DEFAULT_AVATAR;
    }, [previewUrl, user?.profileIcon]);

    const isGoogleOnly = !!user && !user.password;

    if (!user) return null;

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
            toast.error(t('profile.avatar.invalidType'));
            return;
        }
        if (file.size > MAX_AVATAR_SIZE) {
            toast.error(t('profile.avatar.tooLarge'));
            return;
        }

        const blobUrl = URL.createObjectURL(file);
        setPreviewUrl(blobUrl);
        setAvatarUploading(true);

        const res: IResponse = await uploadProfileIconApi(file);

        setAvatarUploading(false);
        URL.revokeObjectURL(blobUrl);
        setPreviewUrl(null);

        if (!res.isSuccessful || !res.data) {
            toast.error(res.displayMessage || t('profile.messages.avatarFailed'));
            return;
        }
        userContext?.saveUser(res.data as IUser);
        toast.success(t('profile.messages.avatarUpdated'));
    };

    const handleProfileSubmit = async (values: ProfileDetailsValues) => {
        setProfileError(null);

        setProfileSaving(true);
        const res: IResponse = await updateUserProfile({
            username: values.username.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
        });
        setProfileSaving(false);

        if (!res.isSuccessful || !res.data) {
            const msg = res.displayMessage || t('profile.messages.saveFailed');
            setProfileError(msg);
            toast.error(msg);
            return;
        }
        userContext?.saveUser(res.data as IUser);
        toast.success(t('profile.messages.saved'));
    };

    const handlePasswordSubmit = async (values: ProfilePasswordValues) => {
        setPasswordError(null);

        setPasswordSaving(true);
        const res: IResponse = await changePasswordApi(values.currentPassword, values.newPassword);
        setPasswordSaving(false);

        if (!res.isSuccessful) {
            const msg = res.displayMessage || t('profile.messages.passwordFailed');
            setPasswordError(msg);
            toast.error(msg);
            return;
        }
        passwordForm.reset();
        toast.success(t('profile.messages.passwordUpdated'));
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        const res = await logoutUser();
        setLoggingOut(false);
        if (!res.isSuccessful) {
            toast.error(res.displayMessage || t('profile.messages.logoutFailed'));
        }
        userContext?.logout();
        navigate('/', { replace: true });
    };

    return (
        <main className="min-h-svh bg-slate-900 text-slate-200 py-4 px-3 sm:py-8 sm:px-6 select-none">
            <div className="max-w-2xl mx-auto">
                <header className="flex items-center gap-3 mb-6">
                    <button
                        type="button"
                        aria-label={t('common.back')}
                        onClick={() => navigate('/home')}
                        className="inline-flex items-center justify-center h-10 w-10 rounded-md text-slate-300 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                    >
                        <BackIcon size={22} />
                    </button>
                    <h1 className="flex-1 text-2xl font-bold text-slate-100">
                        {t('profile.title')}
                    </h1>
                    <LanguageSwitcher />
                </header>

                <section
                    aria-labelledby="profile-avatar-title"
                    className="bg-slate-800 rounded-lg p-5 sm:p-6 mb-5 border border-slate-700"
                >
                    <h2 id="profile-avatar-title" className="sr-only">
                        {t('profile.avatar.title')}
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center gap-5">
                        <div className="relative">
                            <img
                                src={avatarSrc}
                                alt={t('profile.avatar.altFor', { name: user.username })}
                                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-slate-700 bg-slate-700"
                            />
                            {avatarUploading && (
                                <div
                                    aria-live="polite"
                                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"
                                    />
                                    <span className="sr-only">
                                        {t('profile.avatar.uploading')}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-center sm:text-start">
                            <p className="text-lg font-semibold text-slate-100">
                                {user.username}
                            </p>
                            <p className="text-sm text-slate-400 mb-3">{user.email}</p>
                            <div className="flex justify-center sm:justify-start">
                                <Button
                                    variant="secondary"
                                    size="md"
                                    onClick={handleAvatarClick}
                                    isLoading={avatarUploading}
                                    aria-label={t('profile.avatar.change')}
                                >
                                    <LuCamera size={18} aria-hidden="true" />
                                    <span>{t('profile.avatar.change')}</span>
                                </Button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/gif,image/webp"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                {t('profile.avatar.hint')}
                            </p>
                        </div>
                    </div>
                </section>

                <section
                    aria-labelledby="profile-details-title"
                    className="bg-slate-800 rounded-lg p-5 sm:p-6 mb-5 border border-slate-700"
                >
                    <h2
                        id="profile-details-title"
                        className="text-lg font-semibold text-slate-100 mb-4"
                    >
                        {t('profile.details.title')}
                    </h2>
                    <form onSubmit={detailsForm.handleSubmit(handleProfileSubmit)} className="space-y-4" noValidate>
                        <Input
                            id="profile-username"
                            label={t('auth.fields.username')}
                            placeholder={t('auth.fields.usernamePlaceholder')}
                            autoComplete="username"
                            minLength={2}
                            {...detailsForm.register('username')}
                            required
                            error={
                                detailsForm.formState.errors.username
                                    ? t('profile.messages.usernameShort')
                                    : null
                            }
                        />
                        <Input
                            id="profile-email"
                            type="email"
                            label={t('auth.fields.email')}
                            placeholder={t('auth.fields.emailPlaceholder')}
                            autoComplete="email"
                            {...detailsForm.register('email')}
                            required
                            error={
                                detailsForm.formState.errors.email
                                    ? t('profile.messages.emailInvalid')
                                    : null
                            }
                        />
                        <Input
                            id="profile-phone"
                            type="tel"
                            label={t('auth.fields.phone')}
                            placeholder={t('auth.fields.phonePlaceholder')}
                            autoComplete="tel"
                            {...detailsForm.register('phone')}
                            required
                            error={
                                detailsForm.formState.errors.phone
                                    ? t('profile.messages.phoneInvalid')
                                    : null
                            }
                        />

                        {profileError && (
                            <p role="alert" className="text-sm text-red-400">
                                {profileError}
                            </p>
                        )}

                        <div className="flex justify-end">
                            <Button type="submit" size="md" isLoading={profileSaving}>
                                {t('profile.details.save')}
                            </Button>
                        </div>
                    </form>
                </section>

                <section
                    aria-labelledby="profile-password-title"
                    className="bg-slate-800 rounded-lg p-5 sm:p-6 mb-5 border border-slate-700"
                >
                    <h2
                        id="profile-password-title"
                        className="text-lg font-semibold text-slate-100 mb-4"
                    >
                        {t('profile.password.title')}
                    </h2>
                    {isGoogleOnly ? (
                        <p className="text-sm text-slate-400">
                            {t('profile.password.googleOnly')}
                        </p>
                    ) : (
                        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4" noValidate>
                            <Input
                                id="profile-current-password"
                                type={showCurrent ? 'text' : 'password'}
                                label={t('profile.password.current')}
                                autoComplete="current-password"
                                {...passwordForm.register('currentPassword')}
                                required
                                error={
                                    passwordForm.formState.errors.currentPassword
                                        ? t('auth.messages.fillAllFields')
                                        : null
                                }
                                trailing={
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent((v) => !v)}
                                        aria-label={t(
                                            showCurrent
                                                ? 'auth.actions.hidePassword'
                                                : 'auth.actions.showPassword',
                                        )}
                                        aria-pressed={showCurrent}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                                    >
                                        {showCurrent ? (
                                            <VscEye size={20} />
                                        ) : (
                                            <VscEyeClosed size={20} />
                                        )}
                                    </button>
                                }
                            />
                            <Input
                                id="profile-new-password"
                                type={showNew ? 'text' : 'password'}
                                label={t('profile.password.new')}
                                autoComplete="new-password"
                                hint={t('profile.password.hint')}
                                {...passwordForm.register('newPassword')}
                                required
                                error={
                                    passwordForm.formState.errors.newPassword
                                        ? t('profile.messages.passwordWeak')
                                        : null
                                }
                                trailing={
                                    <button
                                        type="button"
                                        onClick={() => setShowNew((v) => !v)}
                                        aria-label={t(
                                            showNew
                                                ? 'auth.actions.hidePassword'
                                                : 'auth.actions.showPassword',
                                        )}
                                        aria-pressed={showNew}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                                    >
                                        {showNew ? (
                                            <VscEye size={20} />
                                        ) : (
                                            <VscEyeClosed size={20} />
                                        )}
                                    </button>
                                }
                            />
                            <Input
                                id="profile-confirm-password"
                                type={showConfirm ? 'text' : 'password'}
                                label={t('profile.password.confirm')}
                                autoComplete="new-password"
                                {...passwordForm.register('confirmPassword')}
                                required
                                error={
                                    passwordForm.formState.errors.confirmPassword?.message ===
                                    'password_mismatch'
                                        ? t('auth.messages.passwordsDoNotMatch')
                                        : passwordForm.formState.errors.confirmPassword
                                          ? t('auth.messages.fillAllFields')
                                          : null
                                }
                                trailing={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((v) => !v)}
                                        aria-label={t(
                                            showConfirm
                                                ? 'auth.actions.hidePassword'
                                                : 'auth.actions.showPassword',
                                        )}
                                        aria-pressed={showConfirm}
                                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                                    >
                                        {showConfirm ? (
                                            <VscEye size={20} />
                                        ) : (
                                            <VscEyeClosed size={20} />
                                        )}
                                    </button>
                                }
                            />

                            {passwordError && (
                                <p role="alert" className="text-sm text-red-400">
                                    {passwordError}
                                </p>
                            )}

                            <div className="flex justify-end">
                                <Button type="submit" size="md" isLoading={passwordSaving}>
                                    {t('profile.password.submit')}
                                </Button>
                            </div>
                        </form>
                    )}
                </section>

                <section
                    aria-labelledby="profile-account-title"
                    className="bg-slate-800 rounded-lg p-5 sm:p-6 border border-slate-700"
                >
                    <h2
                        id="profile-account-title"
                        className="text-lg font-semibold text-slate-100 mb-4"
                    >
                        {t('profile.account.title')}
                    </h2>
                    <div className="flex flex-wrap gap-3 justify-end">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={handleLogout}
                            isLoading={loggingOut}
                        >
                            {t('auth.logout')}
                        </Button>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Profile;
