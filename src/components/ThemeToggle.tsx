"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Avoid hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="p-2 rounded-full bg-card border border-border w-10 h-10" />
		);
	}

	return (
		<motion.button
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			className="p-2 rounded-full bg-card border border-border hover:border-primary/50 transition-colors"
			whileTap={{ scale: 0.95 }}
			aria-label="Toggle theme"
		>
			{theme === "dark" ? (
				<Sun size={18} className="text-terminal-yellow" />
			) : (
				<Moon size={18} className="text-primary" />
			)}
		</motion.button>
	);
};
