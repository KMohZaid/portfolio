"use client";

import {
	AnimatePresence,
	motion,
	useMotionValue,
	useSpring,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface Sparkle {
	id: number;
	x: number;
	y: number;
	size: number;
	rotation: number;
}

export const CustomCursor = () => {
	const [isHovering, setIsHovering] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [isClicking, setIsClicking] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const [sparkles, setSparkles] = useState<Sparkle[]>([]);
	const sparkleIdRef = useRef(0);
	const lastSparklePos = useRef({ x: 0, y: 0 });

	const cursorX = useMotionValue(0);
	const cursorY = useMotionValue(0);

	const springConfig = { damping: 20, stiffness: 400, mass: 0.3 };
	const trailX = useSpring(cursorX, springConfig);
	const trailY = useSpring(cursorY, springConfig);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			cursorX.set(e.clientX);
			cursorY.set(e.clientY);
			if (!isVisible) setIsVisible(true);

			// Spawn sparkle particles when cursor moves enough
			const dx = e.clientX - lastSparklePos.current.x;
			const dy = e.clientY - lastSparklePos.current.y;
			if (dx * dx + dy * dy > 900) {
				lastSparklePos.current = { x: e.clientX, y: e.clientY };
				const id = sparkleIdRef.current++;
				setSparkles((prev) => [
					...prev.slice(-8),
					{
						id,
						x: e.clientX + (Math.random() - 0.5) * 24,
						y: e.clientY + (Math.random() - 0.5) * 24,
						size: Math.random() * 8 + 4,
						rotation: Math.random() * 360,
					},
				]);
				setTimeout(() => {
					setSparkles((prev) => prev.filter((s) => s.id !== id));
				}, 600);
			}
		},
		[cursorX, cursorY, isVisible],
	);

	useEffect(() => {
		if ("ontouchstart" in window) return;
		setIsMounted(true);

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseleave", () => setIsVisible(false));
		window.addEventListener("mouseenter", () => setIsVisible(true));
		window.addEventListener("mousedown", () => setIsClicking(true));
		window.addEventListener("mouseup", () => setIsClicking(false));

		const handleHoverStart = () => setIsHovering(true);
		const handleHoverEnd = () => setIsHovering(false);

		const interactiveSelector =
			'a, button, [role="button"], input, textarea, select, [data-cursor-hover]';

		const observe = () => {
			document.querySelectorAll(interactiveSelector).forEach((el) => {
				el.addEventListener("mouseenter", handleHoverStart);
				el.addEventListener("mouseleave", handleHoverEnd);
			});
		};

		observe();
		const observer = new MutationObserver(observe);
		observer.observe(document.body, { childList: true, subtree: true });

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			observer.disconnect();
			document.querySelectorAll(interactiveSelector).forEach((el) => {
				el.removeEventListener("mouseenter", handleHoverStart);
				el.removeEventListener("mouseleave", handleHoverEnd);
			});
		};
	}, [handleMouseMove]);

	if (!isMounted) return null;

	return (
		<>
			{/* Sparkle trail ✦ particles */}
			<AnimatePresence>
				{sparkles.map((sparkle) => (
					<motion.div
						key={sparkle.id}
						className="fixed z-[9997] pointer-events-none"
						initial={{ opacity: 0.85, scale: 1 }}
						animate={{ opacity: 0, scale: 0.2 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.6, ease: "easeOut" }}
						style={{
							left: sparkle.x,
							top: sparkle.y,
							translateX: "-50%",
							translateY: "-50%",
						}}
					>
						<svg
							width={sparkle.size}
							height={sparkle.size}
							viewBox="0 0 24 24"
							style={{ transform: `rotate(${sparkle.rotation}deg)` }}
						>
							<path
								d="M12 0L13.5 9.5L23 12L13.5 14.5L12 24L10.5 14.5L1 12L10.5 9.5Z"
								fill="rgba(240, 171, 252, 0.8)"
							/>
						</svg>
					</motion.div>
				))}
			</AnimatePresence>

			{/* Main cursor — anime 4-pointed star ✦ */}
			<motion.div
				className="fixed top-0 left-0 z-[9999] pointer-events-none"
				style={{
					x: cursorX,
					y: cursorY,
					translateX: "-50%",
					translateY: "-50%",
				}}
			>
				<motion.div
					animate={{
						scale: isClicking ? 0.5 : isHovering ? 1.8 : 1,
						opacity: isVisible ? 1 : 0,
					}}
					transition={{ type: "spring", damping: 20, stiffness: 400 }}
					style={{
						filter: isHovering
							? "drop-shadow(0 0 8px rgba(240, 171, 252, 0.9)) drop-shadow(0 0 20px rgba(192, 132, 252, 0.5))"
							: "drop-shadow(0 0 5px rgba(192, 132, 252, 0.7))",
					}}
				>
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						className="animate-spin-slow"
					>
						<path
							d="M12 0L13.5 9.5L23 12L13.5 14.5L12 24L10.5 14.5L1 12L10.5 9.5Z"
							fill={isHovering ? "#f9a8d4" : "#f0abfc"}
						/>
					</svg>
				</motion.div>
			</motion.div>

			{/* Trailing ring — anime magic circle */}
			<motion.div
				className="fixed top-0 left-0 z-[9998] pointer-events-none"
				style={{
					x: trailX,
					y: trailY,
					translateX: "-50%",
					translateY: "-50%",
				}}
			>
				<motion.div
					animate={{
						width: isHovering ? 56 : 36,
						height: isHovering ? 56 : 36,
						opacity: isVisible ? (isHovering ? 0.9 : 0.4) : 0,
					}}
					transition={{ type: "spring", damping: 20, stiffness: 300 }}
				>
					<div
						className="w-full h-full rounded-full animate-spin-reverse-slow"
						style={{
							border: isHovering
								? "2px solid rgba(249, 168, 212, 0.6)"
								: "1.5px dashed rgba(192, 132, 252, 0.4)",
							boxShadow: isHovering
								? "0 0 16px rgba(240, 171, 252, 0.3), inset 0 0 8px rgba(192, 132, 252, 0.1)"
								: "none",
						}}
					/>
				</motion.div>
			</motion.div>
		</>
	);
};
