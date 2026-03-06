"use client";

import confetti from "canvas-confetti";
import { motion, useInView } from "framer-motion";
import { Calendar, Coffee, Heart, MapPin, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import config from "@/config.json";
import { Button } from "../ui/button";

export const ContactSection = () => {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: "-100px" });
	const [loveCount, setLoveCount] = useState(0);
	const [hasLoved, setHasLoved] = useState(false);
	const [loadingLikes, setLoadingLikes] = useState(true);

	useEffect(() => {
		// Check cookie first
		const liked = document.cookie
			.split(";")
			.some((c) => c.trim().startsWith("portfolio_liked="));
		setHasLoved(liked);

		fetch("/api/likes")
			.then((res) => res.json())
			.then((data) => setLoveCount(data.count || 0))
			.catch(() => {})
			.finally(() => setLoadingLikes(false));
	}, []);

	const handleLove = async () => {
		if (hasLoved) return;
		setLoveCount((prev) => prev + 1);
		setHasLoved(true);

		// Set cookie that expires in 10 years
		document.cookie = `portfolio_liked=1; path=/; max-age=${60 * 60 * 24 * 365 * 10}; SameSite=Lax`;

		confetti({
			particleCount: 100,
			spread: 70,
			origin: { y: 0.6 },
			colors: ["#60a5fa", "#c084fc", "#22c55e"],
		});

		try {
			const res = await fetch("/api/likes", { method: "POST" });
			const data = await res.json();
			if (data.count !== undefined) setLoveCount(data.count);
		} catch {}
	};

	const telegramUrl =
		config.social.telegram !== "none" ? config.social.telegram : "#";
	const coffeeUrl =
		config.social.buymeacoffee !== "none" ? config.social.buymeacoffee : "#";

	return (
		<section id="contact" className="py-24 pb-32 lg:pb-24" ref={ref}>
			<motion.div
				initial={{ opacity: 0 }}
				animate={isInView ? { opacity: 1 } : { opacity: 0 }}
				transition={{ duration: 0.6 }}
				className="max-w-6xl mx-auto px-6"
			>
				{/* Section Header */}
				<div className="mb-12">
					<div className="flex items-center gap-4 mb-4">
						<span className="font-mono text-primary text-sm">05.</span>
						<h2 className="font-mono text-2xl md:text-3xl font-bold text-foreground">
							Get In Touch
						</h2>
						<div className="flex-1 h-px bg-border" />
					</div>
				</div>

				{/* Terminal Contact Card */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					className="terminal-window text-left mb-12 max-w-2xl mx-auto"
				>
					<div className="terminal-header">
						<span className="terminal-dot bg-terminal-red" />
						<span className="terminal-dot bg-terminal-yellow" />
						<span className="terminal-dot bg-terminal-green" />
						<span className="ml-2 text-xs text-muted-foreground font-mono">
							contact.sh
						</span>
					</div>
					<div className="p-6 font-mono text-sm space-y-3">
						<div>
							<span className="text-terminal-green">$</span>
							<span className="text-muted-foreground ml-2">
								cat contact.json
							</span>
						</div>
						<div className="text-muted-foreground pl-2">
							<div>{"{"}</div>
							<div className="pl-4 flex items-center gap-2">
								<Send size={14} className="text-primary" />
								<span className="text-terminal-green">"telegram"</span>:
								<span>
									<a
										href={telegramUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-terminal-yellow"
									>
										"
										<span className="hover:underline">
											{config.social.telegram !== "none"
												? config.social.telegram
												: "N/A"}
										</span>
										"
									</a>
									,
								</span>
							</div>
							<div className="pl-4 flex items-center gap-2">
								<MapPin size={14} className="text-primary" />
								<span className="text-terminal-green">"location"</span>:
								<span>
									<span className="text-terminal-yellow">
										"{config.personal.location}"
									</span>
									,
								</span>
							</div>
							<div className="pl-4 flex items-center gap-2">
								<Calendar size={14} className="text-primary" />
								<span className="text-terminal-green">"availability"</span>:
								<span className="text-terminal-purple">
									{config.personal.availability ? "true" : "false"}
								</span>
							</div>
							<div>{"}"}</div>
						</div>
					</div>
				</motion.div>

				{/* Message */}
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.5, delay: 0.3 }}
					className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed text-center mx-auto"
				>
					I'm always open to interesting conversations, collaborations, or just
					a friendly hello. Feel free to reach out!
				</motion.p>

				{/* CTAs */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.5, delay: 0.4 }}
					className="flex flex-wrap items-center justify-center gap-4 mb-12"
				>
					<Button size="lg" className="font-mono gap-2 glow" asChild>
						<a href={telegramUrl} target="_blank" rel="noopener noreferrer">
							<Send size={18} />
							<span>Say Hello</span>
						</a>
					</Button>
					<Button
						variant="outline"
						size="lg"
						className="font-mono gap-2 border-terminal-yellow/50 text-terminal-yellow hover:bg-terminal-yellow/10 hover:border-terminal-yellow"
						asChild
					>
						<a href={coffeeUrl} target="_blank" rel="noopener noreferrer">
							<Coffee size={18} />
							<span>Buy Me a Coffee</span>
						</a>
					</Button>
				</motion.div>

				{/* Love Button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.5, delay: 0.5 }}
					className="flex flex-col items-center gap-4 mb-16"
				>
					<p className="text-sm text-muted-foreground">Enjoyed my portfolio?</p>
					<motion.button
						onClick={handleLove}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						initial={{ scale: 1 }}
						className={`flex items-center gap-3 px-6 py-3 rounded-full border transition-colors duration-300 ${
							hasLoved
								? "bg-primary/10 border-primary text-primary"
								: "bg-card border-border text-muted-foreground hover:border-primary hover:text-primary"
						}`}
					>
						<motion.div
							animate={
								hasLoved ? { scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] } : {}
							}
							transition={{ duration: 0.4 }}
						>
							{hasLoved ? (
								<Sparkles size={20} className="text-primary" />
							) : (
								<Heart size={20} />
							)}
						</motion.div>
						<span className="font-mono font-medium">
							{loadingLikes ? "..." : `${loveCount} loves`}
						</span>
					</motion.button>
				</motion.div>
			</motion.div>
		</section>
	);
};
