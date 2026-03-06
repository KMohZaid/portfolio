"use client";

import { motion, useInView } from "framer-motion";
import { Activity, Code, GitMerge, Star, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import config from "@/config.json";

interface GitHubData {
	stats: {
		contributions: number;
		publicRepos: number;
		stars: number;
		followers: number;
	};
	contributionGraph: number[][];
	recentContributions: {
		repo: string;
		type: string;
		description: string;
		date: string;
		url: string;
	}[];
}

const formatNumber = (n: number) => {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return n.toLocaleString();
};

export const OpenSourceSection = () => {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: "-100px" });
	const [data, setData] = useState<GitHubData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/github")
			.then((res) => res.json())
			.then(setData)
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	const getLevelColor = (level: number) => {
		switch (level) {
			case 0:
				return "bg-secondary";
			case 1:
				return "bg-terminal-green/20";
			case 2:
				return "bg-terminal-green/40";
			case 3:
				return "bg-terminal-green/60";
			case 4:
				return "bg-terminal-green";
			default:
				return "bg-secondary";
		}
	};

	const stats = data
		? [
				{
					label: "Contributions",
					value: formatNumber(data.stats.contributions),
					icon: Activity,
				},
				{
					label: "Public Repos",
					value: formatNumber(data.stats.publicRepos),
					icon: Code,
				},
				{
					label: "Stars Earned",
					value: formatNumber(data.stats.stars),
					icon: Star,
				},
				{
					label: "Followers",
					value: formatNumber(data.stats.followers),
					icon: Users,
				},
			]
		: [];

	const contributionGraph = data?.contributionGraph || [];
	const recentContributions = data?.recentContributions || [];

	return (
		<section id="opensource" className="py-24" ref={ref}>
			<motion.div
				initial={{ opacity: 0 }}
				animate={isInView ? { opacity: 1 } : { opacity: 0 }}
				transition={{ duration: 0.6 }}
				className="max-w-6xl mx-auto px-6"
			>
				{/* Section Header */}
				<div className="mb-12">
					<div className="flex items-center gap-4 mb-4">
						<span className="font-mono text-primary text-sm">04.</span>
						<h2 className="font-mono text-2xl md:text-3xl font-bold text-foreground">
							Open Source
						</h2>
						<div className="flex-1 h-px bg-border" />
					</div>
					<p className="text-muted-foreground font-mono text-sm">
						<span className="text-terminal-green">$</span> gh contribution
						--user {config.personal.github_username}
					</p>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
					{loading
						? Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									className="p-4 rounded-lg bg-card border border-border text-center animate-pulse"
								>
									<div className="w-5 h-5 bg-muted rounded mx-auto mb-2" />
									<div className="h-8 bg-muted rounded w-16 mx-auto mb-2" />
									<div className="h-4 bg-muted rounded w-20 mx-auto" />
								</div>
							))
						: stats.map((stat, index) => (
								<motion.div
									key={stat.label}
									initial={{ opacity: 0, y: 20 }}
									animate={
										isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
									}
									transition={{ duration: 0.5, delay: index * 0.1 }}
									className="p-4 rounded-lg bg-card border border-border text-center"
								>
									<stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
									<div className="font-mono text-2xl font-bold text-foreground">
										{stat.value}
									</div>
									<div className="text-sm text-muted-foreground">
										{stat.label}
									</div>
								</motion.div>
							))}
				</div>

				{/* Contribution Graph */}
				{loading ? (
					<div className="terminal-window mb-12">
						<div className="terminal-header">
							<span className="terminal-dot bg-terminal-red" />
							<span className="terminal-dot bg-terminal-yellow" />
							<span className="terminal-dot bg-terminal-green" />
							<span className="ml-2 text-xs text-muted-foreground font-mono">
								contribution-graph.sh
							</span>
						</div>
						<div className="p-6">
							<div className="h-[100px] bg-muted/20 rounded animate-pulse" />
						</div>
					</div>
				) : contributionGraph.length > 0 ? (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
						transition={{ duration: 0.5, delay: 0.3 }}
						className="terminal-window mb-12"
					>
						<div className="terminal-header">
							<span className="terminal-dot bg-terminal-red" />
							<span className="terminal-dot bg-terminal-yellow" />
							<span className="terminal-dot bg-terminal-green" />
							<span className="ml-2 text-xs text-muted-foreground font-mono">
								contribution-graph.sh
							</span>
						</div>
						<div className="p-6 overflow-x-auto">
							<div className="flex gap-0.5 min-w-max">
								{contributionGraph.map((week, weekIndex) => (
									<div key={weekIndex} className="flex flex-col gap-0.5">
										{week.map((level, dayIndex) => (
											<motion.div
												key={`${weekIndex}-${dayIndex}`}
												initial={{ opacity: 0, scale: 0 }}
												animate={
													isInView
														? { opacity: 1, scale: 1 }
														: { opacity: 0, scale: 0 }
												}
												transition={{
													duration: 0.2,
													delay: 0.5 + (weekIndex * 7 + dayIndex) * 0.001,
												}}
												className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`}
											/>
										))}
									</div>
								))}
							</div>
							<div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
								<span>Less</span>
								{[0, 1, 2, 3, 4].map((level) => (
									<div
										key={level}
										className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`}
									/>
								))}
								<span>More</span>
							</div>
						</div>
					</motion.div>
				) : null}

				{/* Recent Activity */}
				{recentContributions.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
						transition={{ duration: 0.5, delay: 0.5 }}
					>
						<h3 className="font-mono text-lg text-foreground mb-6 flex items-center gap-2">
							<span className="text-primary">&gt;</span> Recent Activity
						</h3>
						<div className="space-y-4">
							{recentContributions.map((contribution, index) => (
								<motion.a
									key={index}
									href={contribution.url}
									target="_blank"
									rel="noopener noreferrer"
									initial={{ opacity: 0, x: -20 }}
									animate={
										isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
									}
									transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
									className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer group"
								>
									<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
										<GitMerge size={18} className="text-primary" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="font-mono text-sm text-primary group-hover:underline">
												{contribution.repo}
											</span>
											<span className="px-2 py-0.5 text-xs font-mono bg-terminal-green/20 text-terminal-green rounded">
												{contribution.type}
											</span>
										</div>
										<p className="text-sm text-muted-foreground mt-1 truncate">
											{contribution.description}
										</p>
									</div>
									<span className="text-xs text-muted-foreground flex-shrink-0">
										{contribution.date}
									</span>
								</motion.a>
							))}
						</div>
					</motion.div>
				)}
			</motion.div>
		</section>
	);
};
