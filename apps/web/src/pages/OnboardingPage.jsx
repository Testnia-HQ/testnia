import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { LOGO_URL } from '@/components/SiteHeader';
import { API_SERVER_URL } from '@/lib/apiServerClient';

const SUPPORTED_EXAM_CODES = ['waec', 'jamb', 'gce', 'neco', 'kcse'];

function getPocketbaseToken() {
    const raw = localStorage.getItem('pocketbase_auth');
    if (!raw) return null;
    const bytes = new TextEncoder().encode(raw);
    return btoa(String.fromCharCode(...bytes));
}

export default function OnboardingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const STUDY_HOURS_OPTIONS = [
        { value: 60, labelKey: 'onboarding.study1h' },
        { value: 120, labelKey: 'onboarding.study2h' },
        { value: 180, labelKey: 'onboarding.study3h' },
        { value: 240, labelKey: 'onboarding.study4h' },
        { value: 300, labelKey: 'onboarding.study5h' },
    ];

    const TIMEFRAME_OPTIONS = [
        { labelKey: 'onboarding.timeframe1m', months: 1 },
        { labelKey: 'onboarding.timeframe2m', months: 2 },
        { labelKey: 'onboarding.timeframe3m', months: 3 },
        { labelKey: 'onboarding.timeframe6m', months: 6 },
        { labelKey: 'onboarding.timeframe1y', months: 12 },
    ];

    const [step, setStep] = useState(1);
    const [exams, setExams] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [examDate, setExamDate] = useState('');
    const [timeframe, setTimeframe] = useState(null);
    const [weeklyMinutes, setWeeklyMinutes] = useState(120);
    const [error, setError] = useState('');
    const [generatingMsg, setGeneratingMsg] = useState('');

    useEffect(() => {
        setGeneratingMsg(t('onboarding.generatingMsg'));
    }, [t]);

    useEffect(() => {
        pb.collection('exams').getFullList({ sort: 'name', filter: 'active = true' })
            .then(all => setExams(all.filter(e => SUPPORTED_EXAM_CODES.includes(e.code))))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!selectedExam) return;
        pb.collection('subjects').getFullList({
            filter: pb.filter('exam = {:e}', { e: selectedExam.id }),
            sort: 'order',
        }).then(setAllSubjects).catch(() => {});
    }, [selectedExam]);

    const toggleSubject = (name) => {
        setSelectedSubjects(prev =>
            prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
        );
    };

    const computeExamDate = () => {
        if (examDate) return examDate;
        if (timeframe) {
            const d = new Date();
            d.setMonth(d.getMonth() + timeframe);
            return d.toISOString().split('T')[0];
        }
        return null;
    };

    const handleFinish = async () => {
        if (!user?.id) return;
        setStep(3);
        setError('');

        const finalExamDate = computeExamDate();

        let profileId;
        try {
            let existing;
            try {
                existing = await pb.collection('profiles').getFirstListItem(
                    pb.filter('user = {:u}', { u: user.id })
                );
            } catch (_) {}

            if (existing) {
                await pb.collection('profiles').update(existing.id, {
                    full_name: user.name || user.full_name || '',
                    country: user.country || '',
                    language: user.language || 'en',
                    target_exam: selectedExam?.id || '',
                    target_subjects: selectedSubjects,
                    exam_date: finalExamDate ? new Date(finalExamDate).toISOString() : '',
                    weekly_goal_minutes: weeklyMinutes,
                    onboarded: true,
                });
                profileId = existing.id;
            } else {
                const created = await pb.collection('profiles').create({
                    user: user.id,
                    full_name: user.name || user.full_name || '',
                    country: user.country || '',
                    language: user.language || 'en',
                    target_exam: selectedExam?.id || '',
                    target_subjects: selectedSubjects,
                    exam_date: finalExamDate ? new Date(finalExamDate).toISOString() : '',
                    weekly_goal_minutes: weeklyMinutes,
                    onboarded: true,
                });
                profileId = created.id;
            }
        } catch (err) {
            setError(t('onboarding.profileError') + ' ' + (err?.message || ''));
            setStep(2);
            return;
        }

        setGeneratingMsg(t('onboarding.generatingAI'));
        try {
            const token = getPocketbaseToken();
            await fetch(`${API_SERVER_URL}/generate-goal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });
        } catch (_) {}

        navigate('/dashboard');
    };

    if (step === 1) return (
        <OnboardingShell step={1}>
            <h1 className="font-display text-2xl font-bold">{t('onboarding.step1Title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.step1Subtitle')}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {exams.map(exam => (
                    <button
                        key={exam.id}
                        type="button"
                        onClick={() => { setSelectedExam(exam); setSelectedSubjects([]); }}
                        className={`rounded-2xl border px-5 py-4 text-left transition ${
                            selectedExam?.id === exam.id
                                ? 'border-primary bg-accent/60 ring-2 ring-primary/30'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                    >
                        <p className="font-semibold">{exam.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{exam.country}</p>
                    </button>
                ))}
            </div>
            <button
                type="button"
                disabled={!selectedExam}
                onClick={() => setStep(2)}
                className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
                {t('onboarding.continueBtn')} <ChevronRight className="h-4 w-4" />
            </button>
        </OnboardingShell>
    );

    if (step === 2) return (
        <OnboardingShell step={2}>
            <h1 className="font-display text-2xl font-bold">{t('onboarding.step2Title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.step2Subtitle')}</p>

            <div className="mt-6">
                <p className="text-sm font-semibold mb-3">
                    {t('onboarding.subjectsLabel')} <span className="font-normal text-muted-foreground">{t('onboarding.subjectsHint')}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                    {allSubjects.map(sub => (
                        <button
                            key={sub.id}
                            type="button"
                            onClick={() => toggleSubject(sub.name)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                selectedSubjects.includes(sub.name)
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border text-foreground hover:border-primary/50'
                            }`}
                        >
                            {sub.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                <p className="text-sm font-semibold mb-3">{t('onboarding.examDateLabel')}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                    {TIMEFRAME_OPTIONS.map(opt => (
                        <button
                            key={opt.labelKey}
                            type="button"
                            onClick={() => { setTimeframe(opt.months); setExamDate(''); }}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                timeframe === opt.months && !examDate
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border hover:border-primary/50'
                            }`}
                        >
                            {t(opt.labelKey)}
                        </button>
                    ))}
                </div>
                <input
                    type="date"
                    value={examDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => { setExamDate(e.target.value); setTimeframe(null); }}
                    className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus-visible:border-primary"
                />
            </div>

            <div className="mt-6">
                <p className="text-sm font-semibold mb-3">{t('onboarding.studyHoursLabel')}</p>
                <div className="flex flex-wrap gap-2">
                    {STUDY_HOURS_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setWeeklyMinutes(opt.value)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${
                                weeklyMinutes === opt.value
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border hover:border-primary/50'
                            }`}
                        >
                            {t(opt.labelKey)}
                        </button>
                    ))}
                </div>
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <div className="mt-8 flex gap-3">
                <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="min-h-[48px] flex-1 rounded-full border border-border text-sm font-semibold"
                >
                    {t('onboarding.backBtn')}
                </button>
                <button
                    type="button"
                    onClick={handleFinish}
                    disabled={selectedSubjects.length < 1 || (!examDate && !timeframe)}
                    className="inline-flex min-h-[48px] flex-[2] items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                    <Sparkles className="h-4 w-4" /> {t('onboarding.generateBtn')}
                </button>
            </div>
        </OnboardingShell>
    );

    return (
        <OnboardingShell step={3}>
            <div className="flex flex-col items-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <h1 className="mt-6 font-display text-2xl font-bold">{t('onboarding.generatingTitle')}</h1>
                <p className="mt-3 text-sm text-muted-foreground">{generatingMsg}</p>
            </div>
        </OnboardingShell>
    );
}

function OnboardingShell({ step, children }) {
    const { t } = useTranslation();
    const totalSteps = 2;
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>{t('onboarding.pageTitle')}</title>
                <meta name="description" content={t('onboarding.pageDesc')} />
            </Helmet>
            <div className="mx-auto flex max-w-lg flex-col px-5 py-12">
                <div className="flex items-center gap-3">
                    <img src={LOGO_URL} alt="Testnia" className="h-8 w-8 rounded-lg object-cover" />
                    <span className="font-display text-base font-extrabold uppercase tracking-widest text-foreground">Testnia</span>
                </div>
                {step <= totalSteps && (
                    <div className="mt-6 flex gap-2">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-all ${i < step ? 'bg-primary' : 'bg-muted'}`}
                            />
                        ))}
                    </div>
                )}
                <div className="mt-8">{children}</div>
            </div>
        </div>
    );
}
