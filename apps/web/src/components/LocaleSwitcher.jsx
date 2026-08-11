import React from 'react';
import { Globe } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

const LocaleSwitcher = ({ className = '' }) => {
    const { country, language, countries, languages, setCountry, setLanguage, syncing } = useLocale();

    const selectClass =
        'appearance-none bg-transparent pr-5 text-xs font-medium uppercase tracking-wide text-foreground/80 outline-none focus-visible:text-primary';

    return (
        <div
            className={`flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 backdrop-blur ${className}`}
            aria-busy={syncing}
        >
            <Globe className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
            <select
                aria-label="Country"
                className={selectClass}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
            >
                {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                        {c.label}
                    </option>
                ))}
            </select>
            <span className="h-3 w-px bg-border" />
            <select
                aria-label="Language"
                className={selectClass}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
            >
                {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                        {l.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default LocaleSwitcher;
