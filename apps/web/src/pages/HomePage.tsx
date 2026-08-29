import { useEffect, useState } from 'react';
import Helmet from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpenCheck, LineChart, PenLine, ShieldCheck, Users } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import SiteHeader from '@/components/SiteHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ExamRecord {
	id: string;
	code: string;
	name: string;
	description: string;
	country: string;
}

const HERO_IMAGE = '/hero.jpg';

const TICKER = ['IELTS', 'SAT', 'GMAT', 'JAMB UTME', 'TOEFL', 'WAEC', 'GRE', 'NCLEX'];

const HomePage = () => {
	const { t } = useTranslation();
	const [exams, setExams] = useState<ExamRecord[]>([]);
	const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

	const PILLARS = [
		{ icon: BookOpenCheck, titleKey: 'home.pillar1Title', bodyKey: 'home.pillar1Body' },
		{ icon: PenLine, titleKey: 'home.pillar2Title', bodyKey: 'home.pillar2Body' },
		{ icon: Users, titleKey: 'home.pillar3Title', bodyKey: 'home.pillar3Body' },
		{ icon: LineChart, titleKey: 'home.pillar4Title', bodyKey: 'home.pillar4Body' },
	];

	useEffect(() => {
		let alive = true;
		pb.collection('exams')
			.getFullList({ sort: 'name', requestKey: 'home-exams' })
			.then((res) => {
				if (!alive) return;
				setExams(res as unknown as ExamRecord[]);
				setState(res.length ? 'ready' : 'empty');
			})
			.catch(() => alive && setState('error'));

		return () => { alive = false; };
	}, []);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Helmet>
				<title>Testnia — Exam preparation platform for global test takers</title>
				<meta
					name="description"
					content="Testnia is an exam prep platform with adaptive practice, essay grading, tutorial sessions and progress analytics for IELTS, SAT, GMAT and JAMB candidates."
				/>
			</Helmet>
			<SiteHeader />

			<section className="relative overflow-hidden border-b border-border">
				<div className="pointer-events-none absolute inset-0 grid-lines opacity-40" />
				<div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
				<div className="relative mx-auto grid max-w-[80rem] items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
					<div>
						<Badge variant="secondary" className="border-primary/30 bg-primary/10 text-primary uppercase tracking-[0.16em]">
							{t('home.badge')}
						</Badge>
						<h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
							A Simplified Way to Exams Success for African Students
							<span className="relative ml-3 inline-block">
								<span className="relative z-10">{t('home.heroHighlight')}</span>
								<motion.span
									initial={{ scaleX: 0 }}
									animate={{ scaleX: 1 }}
									transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
									style={{ originX: 0 }}
									className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-sm bg-primary/25"
								/>
							</span>
						</h1>
						<p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
							{t('home.heroBody')}
						</p>
						<div className="mt-9 flex flex-wrap items-center gap-3">
							<Button size="lg" asChild className="rounded-full px-6">
								<Link to="/signup">
									{t('home.ctaCreate')} <ArrowRight className="h-4 w-4" />
								</Link>
							</Button>
							<Button variant="outline" size="lg" asChild className="rounded-full px-6">
								<a href="#exams">
									{t('home.ctaBrowse')}
								</a>
							</Button>
						</div>
						<dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
							{[
								{ v: 12, s: '', lKey: 'home.stat1Label' },
								{ v: 4, s: '', lKey: 'home.stat2Label' },
								{ v: 100, s: '%', lKey: 'home.stat3Label' },
							].map((s) => (
								<div key={s.lKey}>
									<dt className="font-display text-3xl font-bold text-primary">
										<CountUp value={s.v} suffix={s.s} />
									</dt>
									<dd className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{t(s.lKey)}</dd>
								</div>
							))}
						</dl>
					</div>
					<Reveal y={28}>
						<div className="relative">
							<div className="absolute -bottom-5 -left-5 hidden h-full w-full rounded-2xl border border-primary/30 sm:block" />
							<img
								src={HERO_IMAGE}
								alt="Student practising exam questions on a laptop in a university library"
								className="relative w-full rounded-2xl border border-border object-cover shadow-2xl shadow-primary/10"
							/>
						</div>
					</Reveal>
				</div>
			</section>

			<div className="overflow-hidden border-b border-border bg-card py-4">
				<div className="marquee-track flex w-max gap-10 whitespace-nowrap">
					{[...TICKER, ...TICKER].map((t2, i) => (
						<span
							key={`${t2}-${i}`}
							className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground"
						>
							{t2}
						</span>
					))}
				</div>
			</div>

			<section id="exams" className="mx-auto max-w-[72rem] px-5 py-20">
				<Reveal>
					<h2 className="font-display text-3xl font-bold sm:text-4xl">{t('home.examsTitle')}</h2>
					<p className="mt-3 max-w-2xl text-muted-foreground">{t('home.examsBody')}</p>
				</Reveal>
				<div className="mt-10 divide-y divide-border border-y border-border">
					{state === 'loading' &&
						[0, 1, 2].map((i) => (
							<div key={i} className="flex items-center gap-6 py-6">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 flex-1" />
							</div>
						))}
					{state === 'error' && (
						<p className="py-6 text-sm text-destructive">{t('home.examsLoadErr')}</p>
					)}
					{state === 'empty' && (
						<p className="py-6 text-sm text-muted-foreground">{t('home.examsEmpty')}</p>
					)}
					{state === 'ready' &&
						exams.map((e, i) => (
							<Reveal key={e.id} delay={i * 0.05}>
								<article className="group flex flex-col gap-2 py-7 md:flex-row md:items-center md:gap-10">
									<span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
										{String(i + 1).padStart(2, '0')} · {e.code}
									</span>
									<h3 className="font-display text-xl font-semibold md:w-64">{e.name}</h3>
									<p className="flex-1 text-sm text-muted-foreground">{e.description}</p>
									<span className="text-xs uppercase tracking-wide text-muted-foreground">{e.country}</span>
								</article>
							</Reveal>
						))}
				</div>
			</section>

			<section id="platform" className="border-y border-border bg-card">
				<div className="mx-auto grid max-w-[72rem] gap-10 px-5 py-20 md:grid-cols-2">
					<Reveal>
						<h2 className="font-display text-3xl font-bold sm:text-4xl">{t('home.platformTitle')}</h2>
						<p className="mt-4 text-muted-foreground">{t('home.platformBody')}</p>
						<div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
							<ShieldCheck className="h-5 w-5" /> {t('home.platformBadge')}
						</div>
					</Reveal>
					<div id="how" className="grid gap-4 sm:grid-cols-2">
						{PILLARS.map((p, i) => (
							<Reveal key={p.titleKey} delay={i * 0.07}>
								<Card className="h-full p-5 transition hover:-translate-y-0.5 hover:border-primary/40">
									<p.icon className="h-5 w-5 text-primary" strokeWidth={2} />
									<h3 className="mt-4 font-display text-base font-semibold">{t(p.titleKey)}</h3>
									<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(p.bodyKey)}</p>
								</Card>
							</Reveal>
						))}
					</div>
				</div>
			</section>

			<footer className="mx-auto flex max-w-[80rem] flex-col gap-4 px-5 py-12 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
				<p className="font-display font-semibold uppercase tracking-[0.16em] text-foreground">Testnia</p>
				<nav className="flex flex-wrap gap-5">
					<a href="#exams" className="hover:text-foreground">{t('nav.exams')}</a>
					<Link to="/privacy" className="hover:text-foreground">{t('legal.privacyTitle')}</Link>
					<Link to="/terms" className="hover:text-foreground">{t('legal.termsTitle')}</Link>
					<Link to="/cookies" className="hover:text-foreground">{t('legal.cookiePolicyTitle')}</Link>
					<button onClick={() => window.__openCookieModal?.()} className="hover:text-foreground">{t('cookies.manageCookies')}</button>
				</nav>
				<p>© {new Date().getFullYear()} Testnia. {t('home.footerRights')}</p>
			</footer>
		</div>
	);
};

export default HomePage;
