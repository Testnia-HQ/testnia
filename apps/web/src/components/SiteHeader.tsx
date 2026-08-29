import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';

export const LOGO_URL = '/logo.jpg';

const SiteHeader = () => {
	const auth = useAuth();
	const user = auth?.user;
	const isAuthed = auth?.isAuthed ?? false;
	const logout = auth?.logout ?? (() => {});
	const { isFreemium } = useSubscription();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		if (!isAuthed || !user?.email) { setIsAdmin(false); return; }
		pb.collection('admin_users')
			.getFirstListItem(`email = "${user.email}"`)
			.then((r) => setIsAdmin(r?.active ?? false))
			.catch(() => setIsAdmin(false));
	}, [isAuthed, user?.email]);

	return (
		<header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
			<div className="mx-auto flex max-w-[80rem] items-center gap-4 px-5 py-3">
				<Link to="/" className="flex items-center gap-2.5">
					<img
						src={LOGO_URL}
						alt="Testnia logo"
						className="h-9 w-9 rounded-lg object-cover"
					/>
					<span className="font-display text-lg font-extrabold uppercase tracking-[0.14em] text-foreground">
						Testnia
					</span>
				</Link>
				<nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
					<Link to="/exams" className="transition hover:text-foreground">{t('nav.exams')}</Link>
					<Link to="/essay" className="transition hover:text-foreground">{t('nav.essays')}</Link>
					<Link to="/leaderboard" className="transition hover:text-foreground">{t('nav.leaderboard')}</Link>
					{isAdmin && (
						<Link to="/admin/support" className="transition hover:text-foreground text-primary font-semibold">Support</Link>
					)}
				</nav>
				<LocaleSwitcher className="ml-auto md:ml-0" />
				{isAuthed ? (
					<div className="flex items-center gap-2">
						{isFreemium && (
							<Button variant="outline" size="sm" asChild className="hidden sm:inline-flex rounded-full border-primary/40 bg-primary/10 text-primary hover:bg-primary/20">
								<Link to="/upgrade">
									<Crown className="h-3 w-3" /> {t('nav.upgrade')}
								</Link>
							</Button>
						)}
						<Button variant="default" size="sm" asChild className="hidden sm:block rounded-full">
							<Link to="/dashboard">
								{t('nav.dashboard')}
							</Link>
						</Button>
						<button
							type="button"
							onClick={() => {
								logout();
								navigate('/');
							}}
							aria-label={t('nav.signOut')}
							className="rounded-full border border-border p-2 text-muted-foreground transition hover:text-foreground"
						>
							<LogOut className="h-4 w-4" />
						</button>
					</div>
				) : (
					<div className="flex items-center gap-2">
						<Link to="/login" className="hidden text-sm font-semibold text-foreground sm:block">
							{t('nav.signIn')}
						</Link>
						<Button variant="default" size="sm" asChild className="rounded-full">
							<Link to="/signup">
								{t('nav.startFree')}
							</Link>
						</Button>
					</div>
				)}
			</div>
		</header>
	);
};

export default SiteHeader;
