"use client";

import { useEffect, useState } from "react";

export const GridBackground = () => {
	const [scrollY, setScrollY] = useState(0);

	useEffect(() => {
		const handleScroll = () => {
			setScrollY(window.scrollY);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<div
			className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
			suppressHydrationWarning
		>
			{/* Parallax Grid */}
			<div
				className="absolute inset-0 opacity-[0.03]"
				style={{
					backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
					backgroundSize: "50px 50px",
					transform: `translateY(${scrollY * 0.1}px)`,
				}}
				suppressHydrationWarning
			/>

			{/* Parallax Floating Orbs */}
			<div
				className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
				style={{
					transform: `translateY(${scrollY * 0.2}px)`,
				}}
				suppressHydrationWarning
			/>
			<div
				className="absolute top-40 right-1/4 w-64 h-64 rounded-full bg-terminal-purple/5 blur-3xl"
				style={{
					transform: `translateY(${scrollY * 0.15}px)`,
				}}
				suppressHydrationWarning
			/>
			<div
				className="absolute top-[60vh] left-1/3 w-80 h-80 rounded-full bg-terminal-green/5 blur-3xl"
				style={{
					transform: `translateY(${scrollY * 0.25}px)`,
				}}
				suppressHydrationWarning
			/>
		</div>
	);
};
