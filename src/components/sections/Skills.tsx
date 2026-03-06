"use client";

import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ShieldCheck, Target, Wrench, Zap } from "lucide-react";
import { useState } from "react";
import config from "@/config.json";

interface IconEntry {
	iconify?: string;
	darkInvert?: boolean;
	fallback?: React.ComponentType<{
		className?: string;
		size?: string | number;
		style?: React.CSSProperties;
	}>;
	color?: string;
}

const iconMap: Record<string, IconEntry> = {
	python: { iconify: "logos:python" },
	javascript: { iconify: "logos:javascript" },
	nodejs: { iconify: "logos:nodejs-icon" },
	git: { iconify: "logos:git-icon" },
	linux: { iconify: "logos:linux-tux" },
	postgresql: { iconify: "logos:postgresql" },
	go: { iconify: "logos:go" },
	docker: { iconify: "logos:docker-icon" },
	redis: { iconify: "logos:redis" },
	rust: { iconify: "logos:rust", darkInvert: true },
	graphql: { iconify: "logos:graphql" },
	aws: { iconify: "logos:aws" },
	nginx: { iconify: "logos:nginx" },
	typescript: { iconify: "logos:typescript-icon" },
	mongodb: { iconify: "logos:mongodb-icon" },
	bash: { iconify: "logos:bash-icon" },
	react: { iconify: "logos:react" },
	nextjs: { iconify: "logos:nextjs-icon", darkInvert: true },
	java: { iconify: "logos:java" },
	android: { iconify: "logos:android-icon" },
	telegram: { iconify: "logos:telegram" },
	restapi: { iconify: "mdi:api", color: "#6366f1" },
	datascience: { iconify: "logos:tensorflow" },
	cybersecurity: { fallback: ShieldCheck, color: "#00C853" },
	devops: { iconify: "logos:docker-icon" },
};

interface Skill {
	name: string;
	icon: string;
	description: string;
}

const SkillIcon = ({
	entry,
	size,
}: {
	entry: IconEntry | undefined;
	size: number;
}) => {
	if (entry?.iconify) {
		const cls = entry.darkInvert
			? "skill-icon skill-icon-invert"
			: "skill-icon";
		return (
			<Icon
				icon={entry.iconify}
				width={size}
				height={size}
				className={cls}
				style={entry.color ? { color: entry.color } : undefined}
			/>
		);
	}
	if (entry?.fallback) {
		const FallbackIcon = entry.fallback;
		return (
			<FallbackIcon size={size} style={{ color: entry.color || "#c084fc" }} />
		);
	}
	return <span className="text-2xl">⚙️</span>;
};

const SkillCard = ({ skill }: { skill: Skill }) => {
	const [showTooltip, setShowTooltip] = useState(false);
	const entry = iconMap[skill.icon];

	return (
		<motion.div
			className="relative"
			onMouseEnter={() => setShowTooltip(true)}
			onMouseLeave={() => setShowTooltip(false)}
		>
			<motion.div
				whileHover={{ scale: 1.05, y: -2 }}
				className="flex items-center gap-3 px-5 py-4 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors cursor-default"
			>
				<SkillIcon entry={entry} size={24} />
				<span className="font-mono text-sm text-foreground">{skill.name}</span>
			</motion.div>

			<AnimatePresence>
				{showTooltip && skill.description && (
					<motion.div
						initial={{ opacity: 0, y: 8, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.95 }}
						transition={{ duration: 0.15 }}
						className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-3 rounded-lg bg-popover border border-border shadow-xl"
					>
						<div className="flex items-center gap-2 mb-1.5">
							<SkillIcon entry={entry} size={14} />
							<span className="font-mono text-xs font-semibold text-foreground">
								{skill.name}
							</span>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">
							{skill.description}
						</p>
						<div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
};

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const SkillGrid = ({ skills }: { skills: Skill[] }) => (
	<motion.div
		className="grid grid-cols-2 sm:grid-cols-3 gap-3"
		variants={containerVariants}
		initial="hidden"
		animate="visible"
	>
		{skills.map((skill) => (
			<motion.div key={skill.name} variants={itemVariants}>
				<SkillCard skill={skill} />
			</motion.div>
		))}
	</motion.div>
);

const categories = [
	{
		key: "mastering" as const,
		label: "Mastering",
		subtitle: "— Good at it",
		icon: Zap,
		iconColor: "text-terminal-green",
		bgColor: "bg-terminal-green/20",
	},
	{
		key: "learned_for_now" as const,
		label: "Learned for Now",
		subtitle: "— Learned but not mastering",
		icon: BookOpen,
		iconColor: "text-blue-400",
		bgColor: "bg-blue-400/20",
	},
	{
		key: "working_in_progress" as const,
		label: "Working in Progress",
		subtitle: "— Currently learning",
		icon: Wrench,
		iconColor: "text-primary",
		bgColor: "bg-primary/20",
	},
	{
		key: "on_my_radar" as const,
		label: "On My Radar",
		subtitle: "— Plan to learn",
		icon: Target,
		iconColor: "text-terminal-purple",
		bgColor: "bg-terminal-purple/20",
	},
];

export const Skills = () => {
	return (
		<motion.div variants={itemVariants} className="space-y-12">
			{categories.map((cat) => {
				const skills = config.skills[cat.key] as Skill[];
				if (!skills || skills.length === 0) return null;
				const CatIcon = cat.icon;

				return (
					<div key={cat.key} className="max-w-4xl mx-auto">
						<h3 className="font-mono text-lg text-foreground mb-6 flex items-center gap-3">
							<div className={`p-2 rounded-lg ${cat.bgColor}`}>
								<CatIcon size={18} className={cat.iconColor} />
							</div>
							<span>{cat.label}</span>
							<span className="text-xs text-muted-foreground font-normal">
								{cat.subtitle}
							</span>
						</h3>
						<SkillGrid skills={skills} />
					</div>
				);
			})}
		</motion.div>
	);
};
