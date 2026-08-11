import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check, X, Zap, Crown, ArrowLeft, Loader2, Shield, Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useLocale } from '@/contexts/LocaleContext';
import apiServerClient from '@/lib/apiServerClient';

export default function UpgradePage() {
  const { user, isAuthed } = useAuth();
  const { isPremium } = useSubscription();
  const { country } = useLocale();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pricing, setPricing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [demoSuccess, setDemoSuccess] = useState(false);

  const FEATURES = [
    { labelKey: 'upgrade.feature_dailyPractice', freeVal: t('upgrade.feature_dailyFree'), premiumVal: t('upgrade.feature_dailyPremium') },
    { labelKey: 'upgrade.feature_essays', freeVal: t('upgrade.feature_essaysFree'), premiumVal: t('upgrade.feature_essaysPremium') },
    { labelKey: 'upgrade.feature_aiGoal', freeVal: true, premiumVal: true },
    { labelKey: 'upgrade.feature_scoreTrend', freeVal: true, premiumVal: true },
    { labelKey: 'upgrade.feature_leaderboard', freeVal: false, premiumVal: true },
    { labelKey: 'upgrade.feature_adFree', freeVal: false, premiumVal: true },
    { labelKey: 'upgrade.feature_prioritySupport', freeVal: false, premiumVal: true },
    { labelKey: 'upgrade.feature_essayRubric', freeVal: false, premiumVal: true },
  ];

  useEffect(() => {
    apiServerClient.fetch(`/payment/pricing?country=${country}`)
      .then(r => r.json())
      .then(setPricing)
      .catch(() => setPricing({ display: '$5.99', currency: 'USD' }));
  }, [country]);

  const handleSubscribe = async () => {
    if (!isAuthed) { navigate('/signup'); return; }
    setError('');
    setBusy(true);
    try {
      const res = await apiServerClient.fetch('/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email, country }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('common.error'));

      if (data.demo) {
        const verifyRes = await apiServerClient.fetch('/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: data.reference, userId: user.id }),
        });
        const vData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(vData.error || t('common.error'));
        setDemoSuccess(true);
        setTimeout(() => navigate('/dashboard'), 2500);
      } else {
        window.location.href = data.authorization_url;
      }
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{t('upgrade.pageTitle')}</title>
        <meta name="description" content={t('upgrade.pageDesc')} />
      </Helmet>

      <div className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[80rem] items-center gap-4 px-5 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="font-display text-lg font-extrabold uppercase tracking-[0.14em]">Testnia</span>
          </Link>
          <Link to="/dashboard" className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t('upgrade.backToDashboard')}
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-[80rem] px-4 py-12 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Crown className="h-3.5 w-3.5" /> {t('upgrade.badge')}
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{t('upgrade.heroTitle')}</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">{t('upgrade.heroBody')}</p>
        </div>

        {isPremium && (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
            <Crown className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-3 font-display text-xl font-bold text-emerald-600">{t('upgrade.alreadyPremium')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('upgrade.alreadyPremiumBody')}</p>
            <Link to="/dashboard" className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
              {t('upgrade.goToDashboard')}
            </Link>
          </div>
        )}

        {demoSuccess && (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
            <Check className="mx-auto h-8 w-8 text-emerald-600" />
            <p className="mt-3 font-display text-xl font-bold">{t('upgrade.welcomePremium')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('upgrade.redirecting')}</p>
          </div>
        )}

        {!isPremium && !demoSuccess && (
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
              {/* Free card */}
              <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <p className="font-display text-xl font-bold">{t('upgrade.freemiumPlan')}</p>
                  <span className="rounded-full bg-muted px-3 py-0.5 text-xs font-semibold text-muted-foreground">{t('upgrade.currentPlan')}</span>
                </div>
                <p className="mt-1 text-3xl font-bold">Free</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('upgrade.priceForever')}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {FEATURES.map(f => (
                    <li key={f.labelKey} className="flex items-start gap-2.5 text-sm">
                      {typeof f.freeVal === 'boolean'
                        ? f.freeVal
                          ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          : <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
                        : <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      }
                      <span className={typeof f.freeVal === 'boolean' && !f.freeVal ? 'text-muted-foreground/60 line-through' : ''}>
                        {t(f.labelKey)}
                        {typeof f.freeVal === 'string' && (
                          <span className="ml-1 font-semibold text-muted-foreground">({f.freeVal})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
                  {t('upgrade.basicAccess')}
                </div>
              </div>

              {/* Premium card */}
              <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-6 shadow-lg shadow-primary/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                    <Zap className="h-3 w-3" /> {t('upgrade.recommended')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-display text-xl font-bold">{t('upgrade.premiumPlan')}</p>
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                {pricing
                  ? <p className="mt-1 text-3xl font-bold">{pricing.display}</p>
                  : <div className="mt-1 h-8 w-24 animate-pulse rounded bg-muted" />
                }
                <p className="mt-1 text-xs text-muted-foreground">{t('upgrade.perMonth')}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {FEATURES.map(f => (
                    <li key={f.labelKey} className="flex items-start gap-2.5 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>
                        {t(f.labelKey)}
                        {typeof f.premiumVal === 'string' && (
                          <span className="ml-1 font-semibold text-primary">({f.premiumVal})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={busy}
                  className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
                >
                  {busy
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('upgrade.processing')}</>
                    : <><Crown className="h-4 w-4" /> {t('upgrade.subscribeBtn')}</>
                  }
                </button>

                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> {t('upgrade.securePayment')}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {t('upgrade.thirtyDayAccess')}</span>
                </div>

                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  Accepts Mastercard, Visa, Verve, Mobile Money
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto mt-12 max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('upgrade.paymentMethods')}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            {['Mastercard', 'Visa', 'Verve', 'Mobile Money'].map(m => (
              <span key={m} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold">{m}</span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t('upgrade.poweredBy')}</p>
        </div>
      </main>
    </div>
  );
}
