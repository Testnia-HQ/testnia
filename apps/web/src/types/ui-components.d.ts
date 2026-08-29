declare module '@/components/ui/button' {
	import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

	interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
		variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		asChild?: boolean;
	}

	export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
}

declare module '@/components/ui/card' {
	import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

	export const Card: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
	export const CardHeader: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
	export const CardTitle: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
	export const CardDescription: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
	export const CardContent: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
	export const CardFooter: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/badge' {
	import { type ComponentPropsWithoutRef } from 'react';

	interface BadgeProps extends ComponentPropsWithoutRef<'div'> {
		variant?: 'default' | 'secondary' | 'destructive' | 'outline';
	}

	export const Badge: React.FC<BadgeProps>;
}

declare module '@/components/ui/skeleton' {
	import { type ComponentPropsWithoutRef } from 'react';

	export const Skeleton: React.FC<ComponentPropsWithoutRef<'div'>>;
}
