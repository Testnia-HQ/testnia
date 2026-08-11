import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import SiteHeader from '@/components/SiteHeader';
import { Shield, FileText, Cookie, ChevronRight } from 'lucide-react';

const Section = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="font-display font-bold text-xl text-foreground mb-3">{title}</h2>
        <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </div>
);

const LegalLayout = ({ icon: Icon, title, desc, lastUpdated, children }) => (
    <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-5 py-12">
            <div className="mb-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                    <Icon className="h-3.5 w-3.5" />
                    {lastUpdated}
                </div>
                <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">{title}</h1>
                <p className="mt-3 text-muted-foreground">{desc}</p>
            </div>
            <div className="prose-like">{children}</div>
            <div className="mt-12 flex flex-wrap gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
                <Link to="/privacy" className="hover:text-foreground transition">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-foreground transition">Terms of Service</Link>
                <Link to="/cookies" className="hover:text-foreground transition">Cookie Policy</Link>
            </div>
        </main>
        <footer className="border-t border-border">
            <div className="mx-auto flex max-w-3xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
                <span>© {new Date().getFullYear()} Testnia. All rights reserved.</span>
                <span>contact@testnia.com</span>
            </div>
        </footer>
    </div>
);

export const PrivacyPage = () => {
    const { t } = useTranslation();
    return (
        <LegalLayout icon={Shield} title={t('legal.privacyTitle')} desc={t('legal.privacyDesc')} lastUpdated={t('legal.lastUpdated') + ': August 2026'}>
            <Helmet>
                <title>{t('legal.privacyTitle')} — Testnia</title>
                <meta name="description" content="Testnia Privacy Policy — how we collect, store, and use your data in compliance with GDPR." />
            </Helmet>
            <Section title={t('legal.whoWeAre')}>
                <p>{t('legal.whoWeAreText')}</p>
            </Section>
            <Section title={t('legal.dataWeCollect')}>
                <p>{t('legal.dataWeCollectIntro')}</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    {['legal.dataItem1','legal.dataItem2','legal.dataItem3','legal.dataItem4','legal.dataItem5'].map(k => (
                        <li key={k}>{t(k)}</li>
                    ))}
                </ul>
            </Section>
            <Section title={t('legal.howWeUseData')}>
                <p>{t('legal.howWeUseDataText')}</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    {['legal.useItem1','legal.useItem2','legal.useItem3','legal.useItem4'].map(k => (
                        <li key={k}>{t(k)}</li>
                    ))}
                </ul>
            </Section>
            <Section title={t('legal.dataStorage')}>
                <p>{t('legal.dataStorageText')}</p>
            </Section>
            <Section title={t('legal.dataSharing')}>
                <p>{t('legal.dataSharingText')}</p>
            </Section>
            <Section title={t('legal.yourRights')}>
                <p>{t('legal.yourRightsIntro')}</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    {['legal.right1','legal.right2','legal.right3','legal.right4','legal.right5','legal.right6'].map(k => (
                        <li key={k}>{t(k)}</li>
                    ))}
                </ul>
                <p className="mt-2">{t('legal.yourRightsContact')}</p>
            </Section>
            <Section title={t('legal.dataRetention')}>
                <p>{t('legal.dataRetentionText')}</p>
            </Section>
            <Section title={t('legal.cookiesRef')}>
                <p>{t('legal.cookiesRefText')} <Link to="/cookies" className="text-primary underline underline-offset-2">{t('legal.cookiePolicy')}</Link>.</p>
            </Section>
            <Section title={t('legal.contactUs')}>
                <p>{t('legal.contactUsText')}</p>
            </Section>
        </LegalLayout>
    );
};

export const TermsPage = () => {
    const { t } = useTranslation();
    return (
        <LegalLayout icon={FileText} title={t('legal.termsTitle')} desc={t('legal.termsDesc')} lastUpdated={t('legal.lastUpdated') + ': August 2026'}>
            <Helmet>
                <title>{t('legal.termsTitle')} — Testnia</title>
                <meta name="description" content="Testnia Terms of Service — user conduct, subscription terms, and liability." />
            </Helmet>
            <Section title={t('legal.termsAcceptance')}>
                <p>{t('legal.termsAcceptanceText')}</p>
            </Section>
            <Section title={t('legal.termsEligibility')}>
                <p>{t('legal.termsEligibilityText')}</p>
            </Section>
            <Section title={t('legal.termsAccounts')}>
                <p>{t('legal.termsAccountsText')}</p>
            </Section>
            <Section title={t('legal.termsConduct')}>
                <p>{t('legal.termsConductIntro')}</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                    {['legal.conduct1','legal.conduct2','legal.conduct3','legal.conduct4','legal.conduct5'].map(k => (
                        <li key={k}>{t(k)}</li>
                    ))}
                </ul>
            </Section>
            <Section title={t('legal.termsSubscriptions')}>
                <p>{t('legal.termsSubscriptionsText')}</p>
            </Section>
            <Section title={t('legal.termsPayments')}>
                <p>{t('legal.termsPaymentsText')}</p>
            </Section>
            <Section title={t('legal.termsRefunds')}>
                <p>{t('legal.termsRefundsText')}</p>
            </Section>
            <Section title={t('legal.termsIP')}>
                <p>{t('legal.termsIPText')}</p>
            </Section>
            <Section title={t('legal.termsLiability')}>
                <p>{t('legal.termsLiabilityText')}</p>
            </Section>
            <Section title={t('legal.termsTermination')}>
                <p>{t('legal.termsTerminationText')}</p>
            </Section>
            <Section title={t('legal.termsGoverning')}>
                <p>{t('legal.termsGoverningText')}</p>
            </Section>
            <Section title={t('legal.termsChanges')}>
                <p>{t('legal.termsChangesText')}</p>
            </Section>
            <Section title={t('legal.contactUs')}>
                <p>{t('legal.contactUsText')}</p>
            </Section>
        </LegalLayout>
    );
};

export const CookiesPage = () => {
    const { t } = useTranslation();
    return (
        <LegalLayout icon={Cookie} title={t('legal.cookiePolicyTitle')} desc={t('legal.cookiePolicyDesc')} lastUpdated={t('legal.lastUpdated') + ': August 2026'}>
            <Helmet>
                <title>{t('legal.cookiePolicyTitle')} — Testnia</title>
                <meta name="description" content="Testnia Cookie Policy — essential, analytics, and marketing cookies explained." />
            </Helmet>
            <Section title={t('legal.whatAreCookies')}>
                <p>{t('legal.whatAreCookiesText')}</p>
            </Section>
            <Section title={t('cookies.essential')}>
                <p>{t('legal.essentialCookiesText')}</p>
                <div className="mt-3 rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50"><tr>
                            <th className="text-left px-4 py-2 font-semibold text-foreground">{t('legal.cookieName')}</th>
                            <th className="text-left px-4 py-2 font-semibold text-foreground">{t('legal.cookiePurpose')}</th>
                            <th className="text-left px-4 py-2 font-semibold text-foreground">{t('legal.cookieDuration')}</th>
                        </tr></thead>
                        <tbody className="divide-y divide-border">
                            <tr><td className="px-4 py-2 font-mono text-xs">pocketbase_auth</td><td className="px-4 py-2">{t('legal.cookieAuthPurpose')}</td><td className="px-4 py-2">{t('legal.cookieSession')}</td></tr>
                            <tr><td className="px-4 py-2 font-mono text-xs">testnia_lang</td><td className="px-4 py-2">{t('legal.cookieLangPurpose')}</td><td className="px-4 py-2">1 {t('legal.year')}</td></tr>
                            <tr><td className="px-4 py-2 font-mono text-xs">testnia_cookie_consent</td><td className="px-4 py-2">{t('legal.cookieConsentPurpose')}</td><td className="px-4 py-2">1 {t('legal.year')}</td></tr>
                        </tbody>
                    </table>
                </div>
            </Section>
            <Section title={t('cookies.analytics')}>
                <p>{t('legal.analyticsCookiesText')}</p>
            </Section>
            <Section title={t('cookies.marketing')}>
                <p>{t('legal.marketingCookiesText')}</p>
            </Section>
            <Section title={t('legal.manageCookiesTitle')}>
                <p>{t('legal.manageCookiesText')}</p>
                <button
                    onClick={() => window.__openCookieModal?.()}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
                >
                    <Cookie className="h-4 w-4" />
                    {t('cookies.manageCookies')}
                </button>
            </Section>
            <Section title={t('legal.contactUs')}>
                <p>{t('legal.contactUsText')}</p>
            </Section>
        </LegalLayout>
    );
};
