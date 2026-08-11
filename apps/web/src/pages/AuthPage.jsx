import React, { useState } from 'react';
import Helmet from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SiteHeader, { LOGO_URL } from '@/components/SiteHeader';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';

const AuthPage = ({ mode = 'login' }) => {
    const isSignup = mode === 'signup';
    const { login, signup } = useAuth();
    const { country, language } = useLocale();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [form, setForm] = useState({ email: '', password: '', full_name: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    });

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            if (isSignup) {
                await signup(form.email, form.password, {
                    full_name: form.full_name,
                    country,
                    language,
                });
                navigate('/onboarding');
                return;
            } else {
                await login(form.email, form.password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err?.message || t('auth.genericError'));
        } finally {
            setBusy(false);
        }
    };

    const inputClass =
        'mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30';

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>{isSignup ? t('auth.signupPageTitle') : t('auth.loginPageTitle')}</title>
                <meta name="description" content={isSignup ? t('auth.signupPageDesc') : t('auth.loginPageDesc')} />
            </Helmet>
            <SiteHeader />
            <main className="mx-auto flex max-w-md flex-col px-5 py-16">
                <img src={LOGO_URL} alt="Testnia logo" className="h-12 w-12 rounded-xl object-cover" />
                <h1 className="mt-6 font-display text-3xl font-bold">
                    {isSignup ? t('auth.signupTitle') : t('auth.loginTitle')}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    {isSignup
                        ? t('auth.signupSubtitle', { country, lang: language.toUpperCase() })
                        : t('auth.loginSubtitle')}
                </p>

                <form onSubmit={submit} className="mt-8 flex flex-col gap-5">
                    {isSignup && (
                        <div>
                            <label htmlFor="full_name" className="text-sm font-medium">{t('auth.fullName')}</label>
                            <input id="full_name" className={inputClass} autoComplete="name" {...field('full_name')} />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="text-sm font-medium">{t('auth.email')}</label>
                        <input id="email" type="email" required autoComplete="email" className={inputClass} {...field('email')} />
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-medium">{t('auth.password')}</label>
                        <input
                            id="password"
                            type="password"
                            required
                            minLength={8}
                            autoComplete={isSignup ? 'new-password' : 'current-password'}
                            className={inputClass}
                            {...field('password')}
                        />
                        {isSignup && (
                            <p className="mt-2 text-xs text-muted-foreground">{t('auth.passwordHint')}</p>
                        )}
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <button
                        type="submit"
                        disabled={busy}
                        className="min-h-[48px] rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
                    >
                        {busy ? t('auth.loadingBtn') : isSignup ? t('auth.signupBtn') : t('auth.loginBtn')}
                    </button>
                </form>

                <p className="mt-6 text-sm text-muted-foreground">
                    {isSignup ? t('auth.alreadyRegistered') + ' ' : t('auth.noAccount') + ' '}
                    <Link to={isSignup ? '/login' : '/signup'} className="font-semibold text-primary">
                        {isSignup ? t('auth.signInLink') : t('auth.createLink')}
                    </Link>
                </p>
            </main>
        </div>
    );
};

export default AuthPage;
