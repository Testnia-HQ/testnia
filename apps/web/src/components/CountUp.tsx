import { useEffect, useRef, useState } from 'react';

const EASE_OUT_CUBIC = (progress: number) => 1 - Math.pow(1 - progress, 3);

interface CountUpProps {
	value: number;
	duration?: number;
	decimals?: number;
	prefix?: string;
	suffix?: string;
	locale?: string;
	className?: string;
}

const CountUp = ({ value, duration = 1600, decimals = 0, prefix = '', suffix = '', locale, className = '' }: CountUpProps) => {
	const [display, setDisplay] = useState(0);
	const ref = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		const node = ref.current;
		const target = Number(value) || 0;

		if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			setDisplay(target);
			return undefined;
		}

		let frame: number;
		const observer = new IntersectionObserver(([entry]) => {
			if (!entry.isIntersecting) return;

			observer.disconnect();

			const start = performance.now();
			const tick = (now: number) => {
				const progress = Math.min((now - start) / duration, 1);

				setDisplay(target * EASE_OUT_CUBIC(progress));

				if (progress < 1) frame = requestAnimationFrame(tick);
			};

			frame = requestAnimationFrame(tick);
		}, { threshold: 0.3 });

		observer.observe(node);

		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	}, [value, duration]);

	return (
		<span ref={ref} className={className}>
			{prefix}
			{display.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
			{suffix}
		</span>
	);
};

export default CountUp;

export { CountUp };
