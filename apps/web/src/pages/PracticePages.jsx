import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Clock, Loader2, Timer,
    Trophy, XCircle, Sparkles, FileText,
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

const CODES = ['waec', 'jamb', 'gce', 'neco', 'kcse'];

function authHeaders() {
    const raw = localStorage.getItem('pocketbase_auth');
    if (!raw) return {};
    const bytes = new TextEncoder().encode(raw);
    return { Authorization: `Bearer ${btoa(String.fromCharCode(...bytes))}` };
}

const Shell = ({ title, description, children }) => (
    <div className="min-h-screen bg-background text-foreground">
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
        </Helmet>
        <SiteHeader />
        <main className="mx-auto max-w-[80rem] px-4 py-8 sm:px-6">{children}</main>
    </div>
);

/* ---------------- 2.1 Browse exams ---------------- */
export function ExamsPage() {
    const { t } = useTranslation();
    const [exams, setExams] = useState([]);
    const [subjectsByExam, setSubjectsByExam] = useState({});
    const [meta, setMeta] = useState({});
    const [active, setActive] = useState('');
    const [state, setState] = useState('loading');

    useEffect(() => {
        (async () => {
            try {
                const [ex, subs, links] = await Promise.all([
                    pb.collection('exams').getFullList({ sort: 'name', requestKey: 'ex-all' }),
                    pb.collection('subjects').getFullList({ sort: 'order', requestKey: 'sub-all' }),
                    pb.collection('exam_subjects').getFullList({ requestKey: 'es-all' }).catch(() => []),
                ]);
                const supported = ex.filter((e) => CODES.includes(e.code));
                const grouped = {};
                subs.forEach((s) => {
                    (grouped[s.exam] = grouped[s.exam] || []).push(s);
                });
                const m = {};
                links.forEach((l) => { m[`${l.exam}:${l.subject}`] = l; });
                setExams(supported);
                setSubjectsByExam(grouped);
                setMeta(m);
                setActive(supported[0]?.id || '');
                setState('ready');
            } catch (_) {
                setState('error');
            }
        })();
    }, []);

    const activeExam = exams.find((e) => e.id === active);

    return (
        <Shell title={t('exams.pageTitle')} description={t('exams.heroDesc')}>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {t('practice.backToDashboard')}
            </Link>
            <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">{t('exams.heroTitle')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('exams.heroBody')}</p>

            {state === 'loading' && (
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
                </div>
            )}
            {state === 'error' && <p className="mt-8 text-sm text-destructive">{t('practice.loadCatalogueErr')}</p>}

            {state === 'ready' && (
                <>
                    <div className="mt-6 flex flex-wrap gap-2">
                        {exams.map((e) => (
                            <button
                                key={e.id}
                                type="button"
                                onClick={() => setActive(e.id)}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                    active === e.id
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-card text-foreground hover:border-primary/50'
                                }`}
                            >
                                {e.name}
                            </button>
                        ))}
                    </div>

                    {activeExam && (
                        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
                            <div className="flex flex-wrap items-baseline gap-3">
                                <h2 className="font-display text-xl font-bold">{activeExam.name}</h2>
                                <span className="text-xs uppercase tracking-wide text-muted-foreground">{activeExam.country}</span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{activeExam.description}</p>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {(subjectsByExam[activeExam.id] || []).map((s) => {
                                    const info = meta[`${activeExam.id}:${s.id}`];
                                    return (
                                        <Link
                                            key={s.id}
                                            to={`/practice/${s.id}`}
                                            className="group flex items-start justify-between gap-3 rounded-xl border border-border bg-background p-4 transition hover:border-primary hover:shadow-sm active:scale-[0.99]"
                                        >
                                            <div>
                                                <p className="font-semibold">{s.name}</p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {info?.typical_question_count
                                                        ? t('practice.examQuestions', { count: info.typical_question_count })
                                                        : t('practice.practiceAvailable')}
                                                    {info?.core ? ` · ${t('practice.coreSubject')}` : ''}
                                                </p>
                                            </div>
                                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                                        </Link>
                                    );
                                })}
                                {(subjectsByExam[activeExam.id] || []).length === 0 && (
                                    <p className="text-sm text-muted-foreground">{t('practice.noSubjectsYet')}</p>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </Shell>
    );
}

/* ---------------- 2.2 Practice session player ---------------- */
export function PracticeSessionPage() {
    const { subjectId } = useParams();
    const { user } = useAuth();
    const { isFreemium } = useSubscription();
    const { language } = useLocale();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const locale = language === 'fr' ? 'fr-FR' : 'en-GB';

    const [subject, setSubject] = useState(null);
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [state, setState] = useState('loading');
    const [started, setStarted] = useState(false);
    const [timed, setTimed] = useState(false);
    const [idx, setIdx] = useState(0);
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [seconds, setSeconds] = useState(0);
    const [qSeconds, setQSeconds] = useState(60);
    const [finished, setFinished] = useState(false);
    const [prevAvg, setPrevAvg] = useState(null);
    const sessionRef = useRef(null);
    const startRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const sub = await pb.collection('subjects').getOne(subjectId, { requestKey: 'sub-one' });
                const ex = await pb.collection('exams').getOne(sub.exam, { requestKey: 'ex-one' });
                const qs = await pb.collection('questions').getFullList({
                    filter: pb.filter('subject = {:s}', { s: subjectId }),
                    requestKey: 'q-list',
                });
                let prev = null;
                try {
                    const past = await pb.collection('practice_sessions').getFullList({
                        filter: pb.filter('subject = {:s} && status = "completed"', { s: subjectId }),
                        requestKey: 'past-sess',
                    });
                    const scored = past.filter((p) => p.score_percent != null);
                    if (scored.length) prev = Math.round(scored.reduce((a, p) => a + p.score_percent, 0) / scored.length);
                } catch (_) {}
                setSubject(sub);
                setExam(ex);
                setPrevAvg(prev);
                setQuestions(qs.sort(() => Math.random() - 0.5).slice(0, 10));
                setState('ready');
            } catch (_) {
                setState('error');
            }
        })();
    }, [subjectId]);

    // total elapsed timer
    useEffect(() => {
        if (!started || finished) return;
        const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
        return () => clearInterval(timer);
    }, [started, finished]);

    const q = questions[idx];
    const choices = useMemo(() => (Array.isArray(q?.choices) ? q.choices : []), [q]);

    const submitAnswer = useCallback((choice) => {
        if (revealed || !q) return;
        const isCorrect = choice === q.answer;
        setSelected(choice);
        setRevealed(true);
        if (isCorrect) setCorrectCount((c) => c + 1);
        setAnswers((a) => [...a, { question: q.id, chosen: choice, correct: isCorrect }]);
    }, [revealed, q]);

    // per-question countdown in timed mode
    useEffect(() => {
        if (!started || finished || revealed || !timed) return;
        if (qSeconds <= 0) { submitAnswer('__timeout__'); return; }
        const timer = setTimeout(() => setQSeconds((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [started, finished, revealed, timed, qSeconds, submitAnswer]);

    const start = async () => {
        if (!user?.id) return;
        startRef.current = new Date();
        try {
            sessionRef.current = await pb.collection('practice_sessions').create({
                user: user.id,
                exam: exam.id,
                subject: subject.id,
                mode: timed ? 'timed' : 'drill',
                status: 'in_progress',
                questions_total: questions.length,
                questions_correct: 0,
                score_percent: 0,
                started_at: startRef.current.toISOString(),
            });
        } catch (_) {}
        setStarted(true);
        setQSeconds(60);
    };

    const finish = useCallback(async (finalCorrect, finalAnswers) => {
        setFinished(true);
        const score = questions.length ? Math.round((finalCorrect / questions.length) * 100) : 0;
        if (sessionRef.current) {
            try {
                await pb.collection('practice_sessions').update(sessionRef.current.id, {
                    status: 'completed',
                    questions_correct: finalCorrect,
                    score_percent: score,
                    duration_seconds: seconds,
                    answers: finalAnswers,
                    finished_at: new Date().toISOString(),
                });
            } catch (_) {}
        }
    }, [questions.length, seconds]);

    const next = useCallback(() => {
        if (idx + 1 >= questions.length) {
            finish(correctCount, answers);
        } else {
            setIdx((i) => i + 1);
            setSelected(null);
            setRevealed(false);
            setQSeconds(60);
        }
    }, [idx, questions.length, correctCount, answers, finish]);

    // auto-advance 3s after feedback
    useEffect(() => {
        if (!revealed || finished) return;
        const timer = setTimeout(next, 3000);
        return () => clearTimeout(timer);
    }, [revealed, finished, next]);

    const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');

    return (
        <Shell
            title={t('practice.pageTitle', { subject: subject?.name || 'Practice' })}
            description={t('practice.pageDesc', { subject: subject?.name || 'exam' })}
        >
            <Link to="/exams" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {t('practice.backToExams')}
            </Link>

            {state === 'loading' && <div className="mt-8 h-64 animate-pulse rounded-2xl bg-muted" />}
            {state === 'error' && <p className="mt-8 text-sm text-destructive">{t('practice.couldNotLoad')}</p>}

            {state === 'ready' && (
                <>
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{exam?.name}</p>
                            <h1 className="font-display text-3xl font-bold">{subject?.name}</h1>
                        </div>
                        {started && !finished && (
                            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium">
                                <Clock className="h-4 w-4 text-muted-foreground" /> {mm}:{ss}
                            </div>
                        )}
                    </div>

                    {/* Pre-start */}
                    {!started && (
                        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
                            {questions.length === 0 ? (
                                <>
                                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                                    <p className="mt-3 font-semibold">{t('practice.noQuestionsTitle')}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t('practice.noQuestionsBody', { subject: subject?.name })}
                                    </p>
                                    <Link to="/exams" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
                                        {t('practice.browseSubjects')}
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="font-semibold">{t('practice.readyToPractise')}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t('practice.readyBody', { count: questions.length })}
                                    </p>
                                    <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-sm">
                                        <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
                                        <Timer className="h-4 w-4 text-muted-foreground" /> {t('practice.timedModeLabel')}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={start}
                                        className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
                                    >
                                        {t('practice.startSession')} <ChevronRight className="h-4 w-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Player */}
                    {started && !finished && q && (
                        <div className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{t('practice.questionLabel', { current: idx + 1, total: questions.length })}</span>
                                {timed && !revealed && (
                                    <span className={qSeconds <= 10 ? 'font-bold text-destructive' : ''}>
                                        {t('practice.secondsLeft', { seconds: qSeconds })}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((idx) / questions.length) * 100}%` }} />
                            </div>

                            <p className="mt-5 text-base font-medium leading-relaxed sm:text-lg">{q.prompt}</p>

                            <div className="mt-5 grid gap-2.5">
                                {choices.map((c) => {
                                    const isAnswer = c === q.answer;
                                    const isChosen = c === selected;
                                    let cls = 'border-border bg-background hover:border-primary';
                                    if (revealed && isAnswer) cls = 'border-emerald-500 bg-emerald-500/10';
                                    else if (revealed && isChosen) cls = 'border-destructive bg-destructive/10';
                                    else if (revealed) cls = 'border-border bg-background opacity-60';
                                    return (
                                        <button
                                            key={c}
                                            type="button"
                                            disabled={revealed}
                                            onClick={() => submitAnswer(c)}
                                            className={`flex min-h-[44px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${cls}`}
                                        >
                                            <span>{c}</span>
                                            {revealed && isAnswer && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                                            {revealed && isChosen && !isAnswer && <XCircle className="h-4 w-4 shrink-0 text-destructive" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {revealed && isFreemium && idx % 3 === 2 && (
                                <div className="mt-4">
                                    <AdBanner placement="practice" />
                                </div>
                            )}

                            {revealed && (
                                <div className="mt-5 rounded-xl border border-border bg-accent/40 p-4">
                                    <p className={`text-sm font-bold ${selected === q.answer ? 'text-emerald-600' : 'text-destructive'}`}>
                                        {selected === q.answer
                                            ? t('practice.correctLabel')
                                            : selected === '__timeout__'
                                                ? t('practice.timesUp')
                                                : t('practice.wrongLabel')}
                                    </p>
                                    <p className="mt-1 text-sm">
                                        <span className="font-semibold">{t('practice.answerLabel')}</span> {q.answer}
                                    </p>
                                    {q.explanation && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{q.explanation}</p>}
                                    <button
                                        type="button"
                                        onClick={next}
                                        className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
                                    >
                                        {idx + 1 >= questions.length ? t('practice.seeResults') : t('practice.nextBtn')} <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <p className="mt-2 text-xs text-muted-foreground">{t('practice.autoAdvance')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Summary */}
                    {finished && (
                        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
                            <Trophy className={`mx-auto h-10 w-10 ${score >= 70 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                            <p className="mt-3 font-display text-5xl font-bold">{score}%</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('practice.correctOfTotal', { correct: correctCount, total: questions.length, time: `${mm}:${ss}` })}
                            </p>
                            {prevAvg != null && (
                                <p className={`mt-2 text-sm font-semibold ${score - prevAvg >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                                    {t('practice.masteryDelta', {
                                        delta: `${score - prevAvg >= 0 ? '+' : ''}${score - prevAvg}`,
                                        subject: subject?.name,
                                        prev: prevAvg,
                                    })}
                                </p>
                            )}
                            {score >= 90 && (
                                <p className="mt-3 inline-block rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
                                    {t('practice.heroFeatureEarned')}
                                </p>
                            )}
                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="min-h-[44px] rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
                                >
                                    {t('practice.practiseAgain')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/leaderboard')}
                                    className="min-h-[44px] rounded-full border border-border px-6 text-sm font-semibold"
                                >
                                    {t('practice.viewLeaderboard')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="min-h-[44px] rounded-full border border-border px-6 text-sm font-semibold"
                                >
                                    {t('nav.dashboard')}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </Shell>
    );
}

/* ---------------- 2.3 Essay assessment ---------------- */
const ESSAY_TYPES_EN = ['Narrative Essay', 'Argumentative Essay', 'Expository Essay', 'Letter Writing', 'Literature Essay', 'Article Writing'];
const ESSAY_TYPES_FR = ['Dissertation narrative', 'Dissertation argumentative', 'Dissertation expository', 'Rédaction de lettre', 'Dissertation littéraire', 'Rédaction d\'article'];

export function EssayPage() {
    const { t, i18n } = useTranslation();
    const ESSAY_TYPES = i18n.language === 'fr' ? ESSAY_TYPES_FR : ESSAY_TYPES_EN;

    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [examId, setExamId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [essayType, setEssayType] = useState('');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    // Update essay type when language changes
    useEffect(() => {
        const types = i18n.language === 'fr' ? ESSAY_TYPES_FR : ESSAY_TYPES_EN;
        setEssayType(types[0]);
    }, [i18n.language]);

    useEffect(() => {
        pb.collection('exams').getFullList({ sort: 'name', requestKey: 'essay-ex' })
            .then((ex) => {
                const s = ex.filter((e) => CODES.includes(e.code));
                setExams(s);
                setExamId(s[0]?.id || '');
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!examId) return;
        pb.collection('subjects').getFullList({
            filter: pb.filter('exam = {:e}', { e: examId }),
            sort: 'order',
            requestKey: `essay-sub-${examId}`,
        }).then((s) => { setSubjects(s); setSubjectId(''); }).catch(() => {});
    }, [examId]);

    const submit = async () => {
        setError('');
        setResult(null);
        if (body.trim().length < 50) { setError(t('essay.minCharsError')); return; }
        setBusy(true);
        try {
            const res = await fetch(`${API_SERVER_URL}/grade-essay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ body, title, examId, subjectId, essayType }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || t('common.error'));
            setResult(data.result);
        } catch (err) {
            setError(err.message || t('common.error'));
        } finally {
            setBusy(false);
        }
    };

    const words = body.trim() ? body.trim().split(/\s+/).length : 0;

    return (
        <Shell title={t('essay.pageTitle')} description={t('essay.pageDesc')}>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {t('practice.backToDashboard')}
            </Link>
            <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">{t('essay.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('essay.subtitle')}</p>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="text-xs text-muted-foreground">{t('essay.examLabel')}</label>
                            <select value={examId} onChange={(e) => setExamId(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary">
                                {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">{t('essay.subjectLabel')}</label>
                            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary">
                                <option value="">{t('essay.selectSubject')}</option>
                                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">{t('essay.essayTypeLabelShort')}</label>
                            <select value={essayType} onChange={(e) => setEssayType(e.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary">
                                {ESSAY_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">{t('essay.essayTitleLabel')}</label>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('essay.essayTitlePlaceholder')} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary" />
                        </div>
                    </div>

                    <label className="mt-4 block text-xs text-muted-foreground">{t('essay.bodyLabel')}</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={14}
                        placeholder={t('essay.bodyPlaceholder')}
                        className="mt-1 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:border-primary"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t('essay.wordCount', { count: words })}</span>
                        {error && <span className="font-medium text-destructive">{error}</span>}
                    </div>

                    <button
                        type="button"
                        onClick={submit}
                        disabled={busy}
                        className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
                    >
                        {busy
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('essay.submittingBtn')}</>
                            : <><Sparkles className="h-4 w-4" /> {t('essay.submitBtn')}</>
                        }
                    </button>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5">
                    {!result && !busy && (
                        <div className="flex h-full min-h-[240px] flex-col items-center justify-center text-center">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                            <p className="mt-3 text-sm text-muted-foreground">{t('essay.feedbackPlaceholder')}</p>
                        </div>
                    )}
                    {busy && (
                        <div className="space-y-3">
                            {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${90 - i * 12}%` }} />)}
                        </div>
                    )}
                    {result && (
                        <div>
                            <div className="flex items-baseline gap-3">
                                <p className="font-display text-4xl font-bold">{result.score}%</p>
                                {result.grade && <span className="rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">Grade {result.grade}</span>}
                            </div>
                            <p className="mt-3 text-sm leading-relaxed">{result.summary}</p>

                            {Array.isArray(result.rubric) && (
                                <div className="mt-5 space-y-3">
                                    {result.rubric.map((r) => (
                                        <div key={r.criterion}>
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>{r.criterion}</span>
                                                <span className="text-muted-foreground">{r.score}/{r.max || 25}</span>
                                            </div>
                                            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <div className="h-full rounded-full bg-primary" style={{ width: `${(r.score / (r.max || 25)) * 100}%` }} />
                                            </div>
                                            {r.comment && <p className="mt-1 text-xs text-muted-foreground">{r.comment}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {Array.isArray(result.strengths) && result.strengths.length > 0 && (
                                <div className="mt-5">
                                    <p className="text-sm font-semibold text-emerald-600">{t('essay.strengthsLabel')}</p>
                                    <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                                        {result.strengths.map((s, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />{s}</li>)}
                                    </ul>
                                </div>
                            )}
                            {Array.isArray(result.improvements) && result.improvements.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-semibold text-primary">{t('essay.improvementsLabel')}</p>
                                    <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                                        {result.improvements.map((s, i) => <li key={i} className="flex gap-2"><ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{s}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Shell>
    );
}

/* ---------------- 2.4 Leaderboard ---------------- */
export function LeaderboardPage() {
    const { t } = useTranslation();
    const { language } = useLocale();
    const { user, isAuthed } = useAuth();
    const { isFreemium } = useSubscription();
    const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
    const [entries, setEntries] = useState([]);
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [examId, setExamId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [sort, setSort] = useState('score');
    const [state, setState] = useState('loading');
    const [profile, setProfile] = useState(null);
    const [savingOptOut, setSavingOptOut] = useState(false);

    useEffect(() => {
        pb.collection('exams').getFullList({ sort: 'name', requestKey: 'lb-ex' })
            .then((ex) => setExams(ex.filter((e) => CODES.includes(e.code))))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!examId) { setSubjects([]); setSubjectId(''); return; }
        pb.collection('subjects').getFullList({
            filter: pb.filter('exam = {:e}', { e: examId }),
            sort: 'order',
            requestKey: `lb-sub-${examId}`,
        }).then((s) => { setSubjects(s); setSubjectId(''); }).catch(() => {});
    }, [examId]);

    useEffect(() => {
        if (!isAuthed || !user?.id) return;
        pb.collection('profiles').getFirstListItem(pb.filter('user = {:u}', { u: user.id }), { requestKey: 'lb-prof' })
            .then(setProfile)
            .catch(() => {});
    }, [isAuthed, user?.id]);

    useEffect(() => {
        setState('loading');
        const params = new URLSearchParams();
        if (examId) params.set('exam', examId);
        if (subjectId) params.set('subject', subjectId);
        fetch(`${API_SERVER_URL}/leaderboard?${params.toString()}`)
            .then((r) => r.json())
            .then((d) => { setEntries(d.entries || []); setState('ready'); })
            .catch(() => setState('error'));
    }, [examId, subjectId]);

    const toggleOptOut = async () => {
        if (!profile) return;
        setSavingOptOut(true);
        try {
            const updated = await pb.collection('profiles').update(profile.id, {
                leaderboard_opt_out: !profile.leaderboard_opt_out,
            });
            setProfile(updated);
        } catch (_) {} finally {
            setSavingOptOut(false);
        }
    };

    const sorted = useMemo(() => {
        const list = [...entries];
        if (sort === 'date') list.sort((a, b) => new Date(b.date) - new Date(a.date));
        else if (sort === 'subject') list.sort((a, b) => a.subject.localeCompare(b.subject));
        else if (sort === 'exam') list.sort((a, b) => a.exam.localeCompare(b.exam));
        else list.sort((a, b) => b.score - a.score);
        return list;
    }, [entries, sort]);

    return (
        <Shell title={t('leaderboard.pageTitle')} description={t('leaderboard.pageDesc')}>
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {t('practice.backToDashboard')}
            </Link>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold sm:text-4xl">{t('leaderboard.title')}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">{t('leaderboard.subtitle')}</p>
                </div>
                {profile && (
                    <button
                        type="button"
                        onClick={toggleOptOut}
                        disabled={savingOptOut}
                        className="rounded-full border border-border px-4 py-2 text-xs font-semibold transition hover:border-primary disabled:opacity-60"
                    >
                        {profile.leaderboard_opt_out ? t('leaderboard.optInBtn') : t('leaderboard.optOutBtn')}
                    </button>
                )}
            </div>

            {isFreemium ? (
                <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
                    <Trophy className="mx-auto h-8 w-8 text-primary" />
                    <p className="mt-3 font-semibold">{t('leaderboard.premiumOnly')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t('leaderboard.upgradeMsg')}</p>
                    <a href="/upgrade" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">{t('leaderboard.upgradeBtn')}</a>
                    <div className="mt-5"><AdBanner placement="leaderboard" /></div>
                </div>
            ) : (
                <>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <select value={examId} onChange={(e) => setExamId(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary">
                            <option value="">{t('leaderboard.filterExam')}</option>
                            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!examId} className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary disabled:opacity-50">
                            <option value="">{t('leaderboard.filterSubject')}</option>
                            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary">
                            <option value="score">{t('leaderboard.sortByScore')}</option>
                            <option value="date">{t('leaderboard.sortByDate')}</option>
                            <option value="exam">{t('leaderboard.sortByExam')}</option>
                            <option value="subject">{t('leaderboard.sortBySubject')}</option>
                        </select>
                    </div>
                    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
                        {state === 'loading' && <div className="space-y-2 p-5">{[0, 1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}</div>}
                        {state === 'error' && <p className="p-5 text-sm text-destructive">{t('leaderboard.loadError')}</p>}
                        {state === 'ready' && sorted.length === 0 && (
                            <div className="p-8 text-center">
                                <Trophy className="mx-auto h-8 w-8 text-muted-foreground" />
                                <p className="mt-3 text-sm text-muted-foreground">{t('leaderboard.noData')}</p>
                                <Link to="/exams" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">{t('leaderboard.browseExams')}</Link>
                            </div>
                        )}
                        {state === 'ready' && sorted.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px] text-sm">
                                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3">{t('leaderboard.rankLabel')}</th>
                                            <th className="px-4 py-3">{t('leaderboard.nameLabel')}</th>
                                            <th className="px-4 py-3">{t('leaderboard.scoreLabel')}</th>
                                            <th className="px-4 py-3">{t('leaderboard.examLabel')}</th>
                                            <th className="px-4 py-3">{t('leaderboard.subjectLabel')}</th>
                                            <th className="px-4 py-3">{t('leaderboard.dateLabel')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {sorted.map((e, i) => (
                                            <tr key={e.id} className="transition hover:bg-accent/30">
                                                <td className="px-4 py-3 font-semibold text-muted-foreground">{i + 1}</td>
                                                <td className="px-4 py-3 font-medium">{e.name}</td>
                                                <td className="px-4 py-3"><span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600">{e.score}%</span></td>
                                                <td className="px-4 py-3">{e.exam}</td>
                                                <td className="px-4 py-3">{e.subject}</td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(e.date, { locale })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </Shell>
    );
}
