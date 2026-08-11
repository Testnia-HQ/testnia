import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';

export const COUNTRIES = [
    { code: 'NG', label: 'Nigeria' },
    { code: 'GH', label: 'Ghana' },
    { code: 'KE', label: 'Kenya' },
    { code: 'GB', label: 'United Kingdom' },
    { code: 'US', label: 'United States' },
    { code: 'AE', label: 'United Arab Emirates' },
];

export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
];

const LocaleContext = createContext(null);

export const LocaleProvider = ({ children }) => {
    const { user, isAuthed } = useAuth();
    const { i18n } = useTranslation();
    const [country, setCountryState] = useState(() => localStorage.getItem('testnia_country') || 'NG');
    const [language, setLanguageState] = useState(() => localStorage.getItem('testnia_lang') || 'en');
    const [syncing, setSyncing] = useState(false);

    // Sync from user profile on login
    useEffect(() => {
        if (user?.country) setCountryState(user.country);
        if (user?.language) {
            const lang = user.language;
            setLanguageState(lang);
            i18n.changeLanguage(lang);
            localStorage.setItem('testnia_lang', lang);
        }
    }, [user?.country, user?.language, i18n]);

    const persist = useCallback(
        async (next) => {
            if (!isAuthed || !user?.id) return;
            setSyncing(true);
            try {
                await pb.collection('users').update(user.id, next);
            } catch (_) {
                /* keep local UI state when offline */
            } finally {
                setSyncing(false);
            }
        },
        [isAuthed, user?.id],
    );

    const setCountry = useCallback((c) => {
        setCountryState(c);
        localStorage.setItem('testnia_country', c);
        persist({ country: c });
    }, [persist]);

    const setLanguage = useCallback((l) => {
        setLanguageState(l);
        i18n.changeLanguage(l);
        localStorage.setItem('testnia_lang', l);
        persist({ language: l });
    }, [persist, i18n]);

    const value = useMemo(
        () => ({
            country,
            language,
            syncing,
            countries: COUNTRIES,
            languages: LANGUAGES,
            setCountry,
            setLanguage,
        }),
        [country, language, syncing, setCountry, setLanguage],
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => useContext(LocaleContext);

export default LocaleContext;
