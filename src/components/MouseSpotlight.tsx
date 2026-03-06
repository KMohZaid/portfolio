"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const MouseSpotlight = () => {
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			setMousePosition({ x: e.clientX, y: e.clientY });
		};

		window.addEventListener("mousemove", handleMouseMove);
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, []);

	return (
		<motion.div
			className="pointer-events-none fixed inset-0 z-0"
			animate={{
				background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, hsl(280 75% 65% / 0.18), hsl(340 70% 55% / 0.1) 40%, transparent 60%)`,
			}}
			transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
		/>
	);
};
