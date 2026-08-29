declare module '@/contexts/AuthContext' {
	interface AuthUser {
		id: string;
		email: string;
		full_name?: string;
		[key: string]: unknown;
	}

	interface AuthContextValue {
		user: AuthUser | null;
		isAuthed: boolean;
		login: (email: string, password: string) => Promise<unknown>;
		signup: (email: string, password: string, extraFields?: Record<string, unknown>) => Promise<unknown>;
		logout: () => void;
	}

	export function useAuth(): AuthContextValue;
	export const AuthProvider: React.FC<{ children: React.ReactNode }>;
}

declare module '@/contexts/LocaleContext' {
	interface LocaleContextValue {
		country: string;
		language: string;
		setCountry: (country: string) => void;
		setLanguage: (lang: string) => void;
	}

	export function useLocale(): LocaleContextValue;
	export const LocaleProvider: React.FC<{ children: React.ReactNode }>;
}

declare module '@/hooks/useSubscription' {
	export function useSubscription(): {
		isPremium: boolean;
		isFreemium: boolean;
		subscription: unknown;
		loading: boolean;
	};
}

declare module '@/components/LocaleSwitcher' {
	import { type ComponentPropsWithoutRef } from 'react';
	const LocaleSwitcher: React.FC<ComponentPropsWithoutRef<'div'>>;
	export default LocaleSwitcher;
}

declare module '@/components/ProtectedRoute' {
	import { type ReactNode } from 'react';
	const ProtectedRoute: React.FC<{ children: ReactNode }>;
	export default ProtectedRoute;
}

declare module '@/components/ScrollToTop' {
	const ScrollToTop: React.FC;
	export default ScrollToTop;
}

declare module '@/components/ChatWidget' {
	const ChatWidget: React.FC;
	export default ChatWidget;
}

declare module '@/components/CookieConsent' {
	const CookieConsent: React.FC;
	export default CookieConsent;
}

declare module '@/lib/pocketbaseClient' {
	const pocketbaseClient: import('pocketbase').default;
	export default pocketbaseClient;
	export { pocketbaseClient };
}

declare module 'react-helmet' {
	import { type ReactNode } from 'react';
	interface HelmetProps {
		title?: string;
		meta?: Array<{ name?: string; property?: string; content?: string }>;
		children?: ReactNode;
	}
	const Helmet: React.FC<HelmetProps>;
	export default Helmet;
}
