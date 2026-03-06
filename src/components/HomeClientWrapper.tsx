"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Header } from "./Header";

interface HomeClientWrapperProps {
	children: ReactNode;
}

export function HomeClientWrapper({ children }: HomeClientWrapperProps) {
	const [activeSection, setActiveSection] = useState("home");

	useEffect(() => {
		// If URL has a hash (e.g. from external navigation), scroll to it then clean URL
		if (window.location.hash) {
			const id = window.location.hash.slice(1);
			const el = document.getElementById(id);
			if (el) {
				setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
			}
			// Remove hash from URL without triggering navigation
			history.replaceState(null, "", window.location.pathname);
		}
	}, []);

	useEffect(() => {
		const handleScroll = () => {
			const sections = ["home", "about", "experience", "opensource", "contact"];
			const scrollPosition = window.scrollY + window.innerHeight / 3;

			let currentSection = "home";
			for (const section of sections) {
				const element = document.getElementById(section);
				if (element) {
					const offsetTop = element.offsetTop;
					if (scrollPosition >= offsetTop) {
						currentSection = section;
					}
				}
			}
			setActiveSection(currentSection);
		};

		window.addEventListener("scroll", handleScroll);
		handleScroll(); // Call once on mount
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const handleNavigate = (section: string) => {
		const element = document.getElementById(section);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<>
			<Header activeSection={activeSection} onNavigate={handleNavigate} />
			{children}
		</>
	);
}
