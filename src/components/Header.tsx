"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	BookOpen,
	Code2,
	FolderGit2,
	Home,
	Menu,
	MessageSquare,
	User,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
	{ id: "home", label: "Home", icon: Home, isSection: true },
	{ id: "about", label: "About", icon: User, isSection: true },
	{ id: "opensource", label: "Open Source", icon: Code2, isSection: true },
	{ id: "contact", label: "Contact", icon: MessageSquare, isSection: true },
	{
		id: "projects",
		label: "Projects",
		icon: FolderGit2,
		isSection: false,
		path: "/projects",
	},
	{
		id: "blog",
		label: "Blog",
		icon: BookOpen,
		isSection: false,
		path: "/blog",
	},
];

interface HeaderProps {
	activeSection?: string;
	onNavigate?: (section: string) => void;
}

export const Header = ({ activeSection, onNavigate }: HeaderProps) => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const pathname = usePathname();
	const isHomePage = pathname === "/";

	const handleNavClick = (item: (typeof navItems)[0]) => {
		if (item.isSection && onNavigate && isHomePage) {
			onNavigate(item.id);
			setIsMobileMenuOpen(false);
		} else if (item.isSection && !isHomePage) {
			// Navigate to home page then scroll to section (without hash in URL)
			window.location.href = `/#${item.id}`;
		}
	};

	const isActiveSection = (id: string) => isHomePage && activeSection === id;
	const isActivePage = (path?: string) => path && pathname.startsWith(path);

	return (
		<>
			{/* Desktop Header */}
			<header className="fixed top-0 left-0 right-0 z-50 hidden lg:block">
				<div className="flex justify-center px-4 py-4">
					<nav className="flex items-center justify-center gap-1 bg-card/80 backdrop-blur-md border border-border rounded-full px-2 py-2">
						{navItems.map((item) => {
							const isActive = item.isSection
								? isActiveSection(item.id)
								: isActivePage(item.path);
							const showSeparator = item.id === "contact";

							if (item.isSection) {
								return (
									<div key={item.id} className="flex items-center">
										<button
											onClick={() => handleNavClick(item)}
											className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
												isActive
													? "text-foreground"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											{isActive && (
												<motion.div
													layoutId="activeNavBg"
													className="absolute inset-0 bg-primary/20 rounded-full"
													transition={{
														type: "spring",
														bounce: 0.2,
														duration: 0.6,
													}}
												/>
											)}
											<item.icon size={16} className="relative z-10" />
											<span className="relative z-10">{item.label}</span>
										</button>
										{showSeparator && (
											<div className="h-6 w-px bg-border mx-2" />
										)}
									</div>
								);
							}

							return (
								<Link
									key={item.id}
									href={item.path!}
									className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
										isActive
											? "text-foreground"
											: "text-muted-foreground hover:text-foreground"
									}`}
								>
									{isActive && (
										<motion.div
											layoutId="activeNavBg"
											className="absolute inset-0 bg-primary/20 rounded-full"
											transition={{
												type: "spring",
												bounce: 0.2,
												duration: 0.6,
											}}
										/>
									)}
									<item.icon size={16} className="relative z-10" />
									<span className="relative z-10">{item.label}</span>
								</Link>
							);
						})}
						<div className="h-6 w-px bg-border mx-1" />
						<ThemeToggle />
					</nav>
				</div>
			</header>

			{/* Mobile Menu Button */}
			<div className="fixed top-4 right-4 z-50 flex items-center gap-2 lg:hidden">
				<ThemeToggle />
				<button
					onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					className="p-3 rounded-full bg-card/80 backdrop-blur-md border border-border"
					aria-label="Toggle menu"
				>
					{isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
				</button>
			</div>

			{/* Mobile Menu Overlay */}
			<AnimatePresence>
				{isMobileMenuOpen && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-background/90 backdrop-blur-md z-40 lg:hidden flex items-center justify-center"
						onClick={() => setIsMobileMenuOpen(false)}
					>
						<motion.nav
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							className="flex flex-col items-center gap-4"
							onClick={(e) => e.stopPropagation()}
						>
							{navItems.map((item, index) => {
								const isActive = item.isSection
									? isActiveSection(item.id)
									: isActivePage(item.path);

								if (item.isSection) {
									return (
										<motion.button
											key={item.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05 }}
											onClick={() => handleNavClick(item)}
											className={`flex items-center gap-3 px-6 py-3 rounded-full text-lg font-medium transition-colors ${
												isActive
													? "text-primary bg-primary/10"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											<item.icon size={20} />
											<span>{item.label}</span>
										</motion.button>
									);
								}

								return (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<Link
											href={item.path!}
											onClick={() => setIsMobileMenuOpen(false)}
											className={`flex items-center gap-3 px-6 py-3 rounded-full text-lg font-medium transition-colors ${
												isActive
													? "text-primary bg-primary/10"
													: "text-muted-foreground hover:text-foreground"
											}`}
										>
											<item.icon size={20} />
											<span>{item.label}</span>
										</Link>
									</motion.div>
								);
							})}
						</motion.nav>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Mobile Bottom Nav */}
			<nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border z-40 lg:hidden">
				<div className="flex items-center justify-around py-2 px-2">
					{navItems
						.filter((i) => i.isSection)
						.map((item) => {
							const isActive = isActiveSection(item.id);

							return (
								<button
									key={item.id}
									onClick={() => handleNavClick(item)}
									className={`p-3 rounded-full transition-colors ${
										isActive
											? "text-primary bg-primary/10"
											: "text-muted-foreground"
									}`}
									aria-label={item.label}
								>
									<item.icon size={20} />
								</button>
							);
						})}
				</div>
			</nav>
		</>
	);
};
