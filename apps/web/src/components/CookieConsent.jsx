import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Cookie, Settings, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import pb from '@/lib/pocketbaseClient';

const STORAGE_KEY = 'testnia_cookie_consent';

const defaultPrefs = { essential: true, analytics: false, marketing: false };

export function useCookieConsent() {
    const [prefs, setPrefs] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    return { prefs, setPrefs };
}

const CookieConsent = () => {
    const { t } = useTranslation();
    const { user, isAuthed } = useAuth();
    const [visible, setVisible] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [prefs, setPrefs] = useState({ ...defaultPrefs });

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) setVisible(true);
    }, []);

    // expose global open function for "Manage Cookies" link
    useEffect(() => {
        window.__openCookieModal = () => setShowModal(true);
        return () => { delete window.__openCookieModal; };
    }, []);

    const save = async (p) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
        setVisible(false);
        setShowModal(false);
        if (isAuthed && user?.id) {
            try {
                const recs = await pb.collection('profiles').getList(1, 1, {
                    filter: pb.filter('user = {:u}', { u: user.id }),
                });
                if (recs.items.length) {
                    await pb.collection('profiles').update(recs.items[0].id, {
                        learning_goal: {
                            ...(recs.items[0].learning_goal || {}),
                            cookie_consent: p,
                        },
                    });
                }
            } catch { /* non-critical */ }
        }
    };

    const acceptAll = () => save({ essential: true, analytics: true, marketing: true });
    const rejectNonEssential = () => save({ essential: true, analytics: false, marketing: false });
    const saveCustom = () => save({ ...prefs });

    if (!visible && !showModal) return null;

    return (
        <>
            {/* Bottom banner */}
            {visible && !showModal && (
                <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md shadow-2xl">
                    <div className="mx-auto flex max-w-[80rem] flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:gap-6">
                        <Cookie className="hidden h-5 w-5 shrink-0 text-primary sm:block" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">{t('cookies.bannerTitle')}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {t('cookies.bannerBody')}{' '}
                                <Link to="/cookies" className="text-primary underline underline-offset-2 hover:no-underline">
                                    {t('cookies.learnMore')}
                                </Link>
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0">
                            <button
                                onClick={() => setShowModal(true)}
                                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                            >
                                <Settings className="inline h-3.5 w-3.5 mr-1" />
                                {t('cookies.customize')}
                            </button>
                            <button
                                onClick={rejectNonEssential}
                                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                            >
                                {t('cookies.rejectNonEssential')}
                            </button>
                            <button
                                onClick={acceptAll}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
                            >
                                {t('cookies.acceptAll')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preferences modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h2 className="font-display font-bold text-foreground">{t('cookies.prefsTitle')}</h2>
                            <button onClick={() => { setShowModal(false); if (!localStorage.getItem(STORAGE_KEY)) setVisible(true); }}
                                className="rounded-full p-1 text-muted-foreground hover:text-foreground">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="divide-y divide-border px-6 py-2">
                            {[
                                { key: 'essential', labelKey: 'cookies.essential', descKey: 'cookies.essentialDesc', locked: true },
                                { key: 'analytics', labelKey: 'cookies.analytics', descKey: 'cookies.analyticsDesc', locked: false },
                                { key: 'marketing', labelKey: 'cookies.marketing', descKey: 'cookies.marketingDesc', locked: false },
                            ].map(({ key, labelKey, descKey, locked }) => (
                                <div key={key} className="flex items-start gap-4 py-4">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-foreground">{t(labelKey)}</p>
                                        <p className="text-sm text-muted-foreground mt-0.5">{t(descKey)}</p>
                                    </div>
                                    {locked ? (
                                        <span className="mt-0.5 flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                            <Check className="h-3 w-3" /> {t('cookies.alwaysOn')}
                                        </span>
                                    ) : (
                                        <button
                                            role="switch"
                                            aria-checked={prefs[key]}
                                            onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                                            className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none ${prefs[key] ? 'bg-primary' : 'bg-muted'}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                            <button onClick={rejectNonEssential} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition">
                                {t('cookies.rejectNonEssential')}
                            </button>
                            <button onClick={saveCustom} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]">
                                {t('cookies.savePrefs')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CookieConsent;
