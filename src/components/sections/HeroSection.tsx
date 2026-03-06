"use client";

import { motion } from "framer-motion";
import { ArrowDown, Terminal } from "lucide-react";
import config from "@/config.json";
import { TypewriterText } from "../TypewriterText";
import { Button } from "../ui/button";

export const HeroSection = () => {
	const scrollTo = (id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
	};

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.15,
				delayChildren: 0.2,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
	};

	return (
		<section
			id="home"
			className="min-h-screen flex flex-col relative pt-20 pb-16"
		>
			<div className="flex-1 flex items-center justify-center">
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="visible"
					className="max-w-6xl mx-auto w-full px-6"
				>
					<div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16">
						{/* Left — Text Content */}
						<div className="flex-1 text-center">
							{/* Terminal Badge */}
							<motion.div
								variants={itemVariants}
								className="flex justify-center mb-8"
							>
								<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
									<Terminal size={16} className="text-terminal-green" />
									<span className="text-sm font-mono text-muted-foreground">
										~/portfolio <span className="text-terminal-green">$</span>{" "}
										whoami
									</span>
								</div>
							</motion.div>

							{/* Main Heading */}
							<motion.h1
								variants={itemVariants}
								className="text-4xl md:text-5xl lg:text-6xl font-mono font-bold mb-6"
							>
								<span className="text-muted-foreground">{">"}</span>{" "}
								<span className="text-foreground">Hi, I'm </span>
								<span className="text-gradient">{config.personal.name}</span>
							</motion.h1>

							{/* Typewriter Subtitle */}
							<motion.div
								variants={itemVariants}
								className="text-xl md:text-2xl text-muted-foreground mb-8 h-8"
							>
								<TypewriterText
									texts={config.personal.typewriter_texts}
									className="font-mono"
								/>
							</motion.div>

							{/* Description */}
							<motion.p
								variants={itemVariants}
								className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
							>
								{config.personal.tagline}
							</motion.p>

							{/* CTAs */}
							<motion.div
								variants={itemVariants}
								className="flex flex-wrap items-center justify-center gap-4"
							>
								<Button
									size="lg"
									className="font-mono gap-2 glow"
									onClick={() => scrollTo("about")}
								>
									<span>About Me</span>
									<ArrowDown size={18} />
								</Button>
								<Button
									variant="outline"
									size="lg"
									className="font-mono gap-2 border-muted-foreground/30 hover:border-primary hover:bg-primary hover:text-primary-foreground"
									onClick={() => scrollTo("contact")}
								>
									<span>Get in Touch</span>
								</Button>
							</motion.div>
						</div>

						{/* Right — Avatar */}
						{config.personal.avatar !== "none" && (
							<motion.div variants={itemVariants} className="flex-shrink-0">
								<motion.div
									className="relative w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72"
									whileHover={{ scale: 1.05 }}
									transition={{ type: "spring", stiffness: 300 }}
								>
									<div className="absolute -inset-2 rounded-full bg-gradient-to-br from-primary via-accent to-primary animate-spin-slow opacity-50 blur-lg" />
									<div className="relative w-full h-full rounded-full border-2 border-primary/50 overflow-hidden bg-card shadow-2xl shadow-primary/20">
										<img
											src={config.personal.avatar}
											alt={config.personal.name}
											className="w-full h-full object-cover"
										/>
									</div>
								</motion.div>
							</motion.div>
						)}
					</div>

					{/* Floating Code Snippet */}
					<motion.div
						variants={itemVariants}
						className="mt-16 terminal-window max-w-md mx-auto text-left"
					>
						<div className="terminal-header">
							<span className="terminal-dot bg-terminal-red" />
							<span className="terminal-dot bg-terminal-yellow" />
							<span className="terminal-dot bg-terminal-green" />
							<span className="ml-2 text-xs text-muted-foreground font-mono">
								developer.ts
							</span>
						</div>
						<div className="p-4 font-mono text-sm">
							<div className="text-muted-foreground">
								<span className="text-terminal-purple">const</span>{" "}
								<span className="text-primary">developer</span>{" "}
								<span className="text-muted-foreground">=</span>{" "}
								<span className="text-terminal-yellow">{"{"}</span>
							</div>
							<div className="pl-4">
								<span className="text-terminal-green">name</span>
								<span className="text-muted-foreground">:</span>{" "}
								<span className="text-terminal-yellow">
									"{config.personal.name}"
								</span>
								<span className="text-muted-foreground">,</span>
							</div>
							<div className="pl-4">
								<span className="text-terminal-green">role</span>
								<span className="text-muted-foreground">:</span>{" "}
								<span className="text-terminal-yellow">
									"{config.personal.role}"
								</span>
								<span className="text-muted-foreground">,</span>
							</div>
							<div className="pl-4">
								<span className="text-terminal-green">available</span>
								<span className="text-muted-foreground">:</span>{" "}
								<span className="text-terminal-purple">
									{config.personal.availability ? "true" : "false"}
								</span>
							</div>
							<div className="text-terminal-yellow">{"}"}</div>
						</div>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
};
