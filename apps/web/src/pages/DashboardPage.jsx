import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    Sparkles, Flame, Target, BookOpen, ChevronRight, Plus, RotateCcw, CheckCircle2, Circle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient';
import SiteHeader from '@/components/SiteHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useLocale } from '@/contexts/LocaleContext';
import AdBanner from '@/components/AdBanner';
import { formatDate } from '@/lib/format';
import { API_SERVER_URL } from '@/lib/apiServerClient';

const SUPPORTED_EXAM_CODES = ['waec', 'jamb', 'gce', 'neco', 'kcse'];

function getPocketbaseToken() {
    const raw = localStorage.getItem('pocketbase_auth');
    if (!raw) return null;
    const bytes = new TextEncoder().encode(raw);
    return btoa(String.fromCharCode(...bytes));
}

async function callGenerateGoal() {
    const token = getPocketbaseToken();
    const res = await fetch(`${API_SERVER_URL}/generate-goal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    });
    if (!res.ok) throw new Error('Goal generation failed');
    return res.json();
}

function computeStreak(sessions) {
    if (!sessions.length) return 0;
    const days = new Set(sessions.map(s => new Date(s.created).toISOString().split('T')[0]));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (days.has(d.toISOString().split('T')[0])) streak++;
        else if (i > 0) break;
    }
    return streak;
}

function computeMastery(sessions) {
    const map = {};
    sessions.forEach(s => {
        if (s.score_percent == null || !s.expand?.subject?.name) return;
        const name = s.expand.subject.name;
        if (!map[name]) map[name] = { total: 0, count: 0 };
        map[name].total += s.score_percent;
        map[name].count += 1;
    });
    return Object.entries(map).map(([name, { total, count }]) => ({
        name, avg: Math.round(total / count),
    })).sort((a, b) => b.avg - a.avg);
}

function computeTrend(sessions, locale) {
    return sessions.slice(0, 20).reverse()
        .filter(s => s.score_percent != null)
        .map(s => ({
            date: new Date(s.created).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
            score: Math.round(s.score_percent),
        }));
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { isFreemium } = useSubscription();
    const { language } = useLocale();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const locale = language === 'fr' ? 'fr-FR' : 'en-GB';

    const [profile, setProfile] = useState(null);
    const [exams, setExams] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [state, setState] = useState('loading');
    const [examId, setExamId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [examSubjects, setExamSubjects] = useState([]);
    const [busy, setBusy] = useState(false);
    const [generatingGoal, setGeneratingGoal] = useState(false);
    const goalDebounceRef = useRef(null);

    const load = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [ex, ses] = await Promise.all([
                pb.collection('exams').getFullList({ sort: 'name', filter: 'active = true', requestKey: 'dash-exams' }),
                pb.collection('practice_sessions').getFullList({ sort: '-created', expand: 'exam,subject', requestKey: 'dash-sessions' }),
            ]);
            let prof = null;
            try {
                prof = await pb.collection('profiles').getFirstListItem(pb.filter('user = {:u}', { u: user.id }), { requestKey: 'dash-profile' });
            } catch (_) {}
            const supportedExams = ex.filter(e => SUPPORTED_EXAM_CODES.includes(e.code));
            setExams(supportedExams);
            setSessions(ses);
            setProfile(prof);
            const defaultExam = prof?.target_exam
                ? supportedExams.find(e => e.id === prof.target_exam) || supportedExams[0]
                : supportedExams[0];
            if (defaultExam) setExamId(defaultExam.id);
            setState('ready');
        } catch (_) { setState('error'); }
    }, [user?.id]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!examId) return;
        pb.collection('subjects').getFullList({
            filter: pb.filter('exam = {:e}', { e: examId }),
            sort: 'order', requestKey: `subjects-${examId}`,
        }).then(subs => { setExamSubjects(subs); setSubjectId(''); }).catch(() => {});
    }, [examId]);

    const triggerGoalRecalibration = useCallback(() => {
        if (goalDebounceRef.current) clearTimeout(goalDebounceRef.current);
        goalDebounceRef.current = setTimeout(async () => {
            const lastGen = profile?.learning_goal?.generated_at;
            if (lastGen && Date.now() - new Date(lastGen).getTime() < 30 * 60 * 1000) return;
            try {
                const { goal } = await callGenerateGoal();
                setProfile(prev => prev ? { ...prev, learning_goal: goal } : prev);
            } catch (_) {}
        }, 3000);
    }, [profile?.learning_goal?.generated_at]);

    const todaySessions = sessions.filter(s => new Date(s.created).toDateString() === new Date().toDateString()).length;
    const freemiumLimitReached = isFreemium && todaySessions >= 5;

    const startSession = async () => {
        if (!examId || !user?.id) return;
        if (freemiumLimitReached) { navigate('/upgrade'); return; }
        setBusy(true);
        try {
            await pb.collection('practice_sessions').create({
                user: user.id, exam: examId,
                ...(subjectId && { subject: subjectId }),
                mode: 'drill', status: 'in_progress',
                questions_total: 10, questions_correct: 0, score_percent: 0,
                started_at: new Date().toISOString(),
            });
            await load();
            triggerGoalRecalibration();
        } catch (_) { setState('error'); }
        finally { setBusy(false); }
    };

    const generateGoal = async () => {
        setGeneratingGoal(true);
        try {
            const { goal } = await callGenerateGoal();
            setProfile(prev => prev ? { ...prev, learning_goal: goal } : prev);
        } catch (_) {} finally { setGeneratingGoal(false); }
    };

    const streak = computeStreak(sessions);
    const mastery = computeMastery(sessions);
    const trend = computeTrend(sessions, locale);
    const goal = profile?.learning_goal;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const avgScore = sessions.length
        ? Math.round(sessions.filter(s => s.score_percent != null).reduce((a, s) => a + s.score_percent, 0) / Math.max(sessions.filter(s => s.score_percent != null).length, 1))
        : 0;
    const recommended = mastery.length > 0 ? mastery[mastery.length - 1] : null;
    const firstName = user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'there';

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>{t('dashboard.pageTitle')}</title>
                <meta name="description" content={t('dashboard.pageDesc')} />
            </Helmet>
            <SiteHeader />

            <main className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl font-bold">{t('dashboard.greeting', { name: firstName })}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {profile?.onboarded
                                ? t('dashboard.readyMsg')
                                : <span>{t('dashboard.setupMsg')}{' '}
                                    <button onClick={() => navigate('/onboarding')} className="font-semibold text-primary underline">{t('dashboard.setupLink')}</button>
                                  </span>
                            }
                        </p>
                    </div>
                    {profile?.onboarded && !goal && (
                        <button type="button" onClick={generateGoal} disabled={generatingGoal}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                            <Sparkles className="h-4 w-4" />
                            {generatingGoal ? t('dashboard.generating') : t('dashboard.generateGoalBtn')}
                        </button>
                    )}
                </div>

                {isFreemium && (
                    <div className="mt-6"><AdBanner placement="dashboard" /></div>
                )}

                {freemiumLimitReached && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                        <span className="font-medium">{t('dashboard.freemiumLimitMsg')}</span>
                        <button onClick={() => navigate('/upgrade')} className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground">
                            {t('dashboard.upgradeUnlimited')}
                        </button>
                    </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard icon={<Flame className="h-5 w-5 text-orange-500" />} label={t('dashboard.streakLabel')} value={streak} unit={t('dashboard.streakUnit')} />
                    <StatCard icon={<BookOpen className="h-5 w-5 text-primary" />} label={t('dashboard.sessionsLabel')} value={completedSessions} unit="" />
                    <StatCard icon={<Target className="h-5 w-5 text-emerald-500" />} label={t('dashboard.avgScoreLabel')} value={`${avgScore}%`} unit="" />
                    <StatCard icon={<CheckCircle2 className="h-5 w-5 text-violet-500" />} label={t('dashboard.subjectsLabel')} value={mastery.length} unit="" />
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                    <div className="flex flex-col gap-6 lg:col-span-1">
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <p className="text-sm font-semibold">{t('dashboard.aiGoalTitle')}</p>
                                </div>
                                {goal && (
                                    <button onClick={generateGoal} disabled={generatingGoal} title={t('dashboard.recalibrateTitle')}
                                        className="rounded-full p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50">
                                        <RotateCcw className={`h-3.5 w-3.5 ${generatingGoal ? 'animate-spin' : ''}`} />
                                    </button>
                                )}
                            </div>
                            {!goal && !generatingGoal && (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    {profile?.onboarded ? t('dashboard.goalNotGenerated') : t('dashboard.completeOnboardingGoal')}
                                </p>
                            )}
                            {generatingGoal && (
                                <div className="mt-3 space-y-2">
                                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                                </div>
                            )}
                            {goal && (
                                <>
                                    <p className="mt-3 text-sm leading-relaxed">{goal.goal_summary}</p>
                                    {goal.priority_subjects?.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {goal.priority_subjects.slice(0, 4).map(s => (
                                                <span key={s} className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{s}</span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {goal?.milestones?.length > 0 && (
                            <div className="rounded-2xl border border-border bg-card p-5">
                                <p className="text-sm font-semibold">{t('dashboard.milestonesTitle')}</p>
                                <ol className="mt-3 space-y-3">
                                    {goal.milestones.map((m, i) => (
                                        <li key={i} className="flex gap-3 text-sm">
                                            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{m.title || `Week ${m.week}`}</p>
                                                <p className="text-xs text-muted-foreground">{m.checkpoint || m.description}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {recommended && (
                            <div className="rounded-2xl border border-primary/30 bg-accent/40 p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t('dashboard.recommendedTitle')}</p>
                                <p className="mt-1 font-semibold">{recommended.name}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{t('dashboard.recommendedAvg', { score: recommended.avg })}</p>
                                <button type="button"
                                    onClick={() => { const sub = examSubjects.find(s => s.name === recommended.name); if (sub) setSubjectId(sub.id); }}
                                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                                    {t('dashboard.practiceNow')} <ChevronRight className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-6 lg:col-span-2">
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <p className="text-sm font-semibold">{t('dashboard.scoreTrendTitle')}</p>
                            {trend.length === 0 ? (
                                <p className="mt-4 text-sm text-muted-foreground">{t('dashboard.noScoredSessions')}</p>
                            ) : (
                                <div className="mt-4 h-48">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                            <defs>
                                                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                                                formatter={(v) => [`${v}%`, t('common.score')]}
                                            />
                                            <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" fill="url(#scoreGrad)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(var(--primary))' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>

                        {mastery.length > 0 && (
                            <div className="rounded-2xl border border-border bg-card p-5">
                                <p className="text-sm font-semibold">{t('dashboard.masteryTitle')}</p>
                                <div className="mt-4 space-y-3">
                                    {mastery.map(({ name, avg }) => (
                                        <div key={name}>
                                            <div className="mb-1 flex justify-between text-xs">
                                                <span className="font-medium">{name}</span>
                                                <span className="text-muted-foreground">{avg}%</span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className={`h-full rounded-full transition-all ${avg >= 70 ? 'bg-emerald-500' : avg >= 45 ? 'bg-yellow-400' : 'bg-destructive'}`}
                                                    style={{ width: `${avg}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rounded-2xl border border-border bg-card p-5">
                            <p className="text-sm font-semibold">{t('dashboard.startSessionTitle')}</p>
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground">{t('dashboard.examLabel')}</label>
                                    <select value={examId} onChange={e => setExamId(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary">
                                        {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-muted-foreground">{t('dashboard.subjectLabel')}</label>
                                    <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
                                        className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary">
                                        <option value="">{t('dashboard.allSubjects')}</option>
                                        {examSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <button type="button" onClick={startSession} disabled={busy || !examId}
                                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                                    <Plus className="h-4 w-4" />
                                    {busy ? t('dashboard.startingBtn') : t('dashboard.startBtn')}
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card p-5">
                            <p className="text-sm font-semibold">{t('dashboard.recentSessionsTitle')}</p>
                            <div className="mt-3 divide-y divide-border">
                                {state === 'loading' && [0,1,2].map(i => <div key={i} className="h-12 animate-pulse bg-muted/50 my-1 rounded" />)}
                                {state === 'error' && <p className="py-4 text-sm text-destructive">{t('dashboard.loadError')}</p>}
                                {state === 'ready' && sessions.length === 0 && (
                                    <p className="py-4 text-sm text-muted-foreground">{t('dashboard.noSessionsYet')}</p>
                                )}
                                {sessions.slice(0, 8).map(s => (
                                    <div key={s.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                                        <span className="font-medium">{s.expand?.subject?.name || s.expand?.exam?.name || 'Practice'}</span>
                                        <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs uppercase tracking-wide text-accent-foreground">{s.mode || 'drill'}</span>
                                        {s.score_percent != null && (
                                            <span className={`text-xs font-semibold ${s.score_percent >= 70 ? 'text-emerald-600' : s.score_percent >= 45 ? 'text-yellow-600' : 'text-destructive'}`}>
                                                {Math.round(s.score_percent)}%
                                            </span>
                                        )}
                                        <span className="ml-auto text-xs text-muted-foreground">{formatDate(s.created, { locale })}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ icon, label, value, unit }) {
    return (
        <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                {icon}
                <span className="text-xs font-medium">{label}</span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold">
                {value}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
            </p>
        </div>
    );
}
