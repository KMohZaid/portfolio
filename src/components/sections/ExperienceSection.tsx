"use client";

import { motion, useInView } from "framer-motion";
import { GitCommit, Rocket } from "lucide-react";
import { useRef } from "react";

const journey = [
	{
		id: 1,
		date: "January 2026 – Present",
		title: "Semester 4 & CTF Champion",
		description:
			"Started 4th semester in Canada — taking a Fullstack Development course with Node.js, Express, and React. Learning the same tech from a different professor gives a totally new perspective.",
		highlights: [
			'During 20–22 February 2026, competed in a college CTF event as a solo team under alias "Chika Fujiwara"',
			"Scored rank 1 in the college division and rank 3 in the open division (all of Canada)",
			"Rank 1 & 2 in open division were multi-member teams (University of Toronto Club & Maple Fan Club) — as an individual player, scored #1 MVP",
			"Moved back to Arch Linux from NixOS due to disk space issues with generations and unstable packages",
		],
	},
	{
		id: 2,
		date: "2025",
		title: "Moved to Canada for Studies",
		description:
			"Moved abroad to Canada for a diploma program. Many concepts overlap with what I learned in India, but new ones keep things interesting. Completed 3 semesters — was consistently ahead of the class.",
		highlights: [
			'Professors started saying "I know you know the answer, let someone else try" — so I just started answering without raising my hand',
			"Used NixOS on my laptop for the full year — it was smooth once I figured it out the second time around",
		],
	},
	{
		id: 3,
		date: "April 2024",
		title: "Full Switch to Linux",
		description:
			"Got the urge to fully commit to Linux. Used my Android phone with rsync over USB tethering to back up ~100GB of important files from Windows before wiping it.",
		highlights: [
			"Started with Arch Linux — loved it from day one",
			"Switched to NixOS in August for its declarative config, went back to Arch after a month, then returned to NixOS in December",
			"Had previously dual-booted openSUSE and tried Arch and Kali Linux (in VM) in 2022, so the transition was natural",
			"Made the final switch just a week before the flight to Canada in December",
		],
	},
	{
		id: 4,
		date: "2023",
		title: "New Laptop, New Tools",
		description:
			"Got my own laptop, explored better development tools and workflows.",
		highlights: [
			"Discovered Obsidian for note-taking (tried Logseq first but preferred Obsidian's paragraph-based approach)",
			"Picked up Neovim as primary editor alongside VS Code",
			"Explored more developer tooling and Linux configurations",
		],
	},
	{
		id: 5,
		date: "2022",
		title: "Got a PC & Expanded Skills",
		description:
			"Got my own PC at home, moved to VS Code, and started building more seriously. Semester 4–5 brought Java, Network Security, and more.",
		highlights: [
			"Helped friends on Telegram with encoder bots and various coding tasks — GitHub still has traces of those collaborations",
			"Network Security became my favorite course — professor was an experienced cybersecurity professional who knew I already had the concepts",
			'During a Caesar cipher lab, automated the entire thing with JavaScript instead of doing it manually — professor joked "I told you to do the lab and here you are trying to find vulnerabilities in the website!"',
			"Since semester 3, every professor knew me — always finished assignments first and helped classmates with theirs",
			"Used to explore the shared network in the lab — opening \\\\STAFF-PC via Run dialog to browse shared folders",
			"Evenings after college work were for Genshin Impact and GTA V",
		],
	},
	{
		id: 6,
		date: "2021",
		title: "Rapid Learning & First Exams",
		description:
			"Picked up multiple languages and tools while balancing diploma coursework. Started contributing to the Telegram community.",
		highlights: [
			"Learned C++, SQL, Bash scripting, and networking basics",
			"Semester 1 offline math exam — scored 100% on everything I wrote (still proud of that)",
			"Actively helping people on Telegram with bots and coding tasks",
			"Started using Vim in Termux after Pydroid packages stopped installing (brief love affair with Nano before that)",
			'In C advance concepts lab, professor asked if I did struct/class work manually or from online — said "good" when I confirmed it was manual',
			"Asked my database professor about a SQL command that wasn't even taught yet",
		],
	},
	{
		id: 7,
		date: "May – December 2020",
		title: "The Beginning — Lockdown Era",
		description:
			"Class 10 finished in February 2020. After a vacation in March–April, the lockdown gave me the time to finally dive into programming.",
		highlights: [
			"Started learning C language around May–June 2020",
			"Diploma college began in September 2020",
			"By December 2020, blasted through a full Python course in days — the C fundamentals made it click instantly",
			"Got deeply involved in the Telegram userbot community — writing custom features and hosting bots on Heroku's free tier (23–25 days on free dyno)",
			"Coded entirely on Android using Termux and Pydroid IDE throughout 2020–2021",
		],
	},
];

export const ExperienceSection = () => {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: "-100px" });

	return (
		<section id="experience" className="py-24" ref={ref}>
			<motion.div
				initial={{ opacity: 0 }}
				animate={isInView ? { opacity: 1 } : { opacity: 0 }}
				transition={{ duration: 0.6 }}
				className="max-w-6xl mx-auto px-6"
			>
				{/* Section Header */}
				<div className="mb-12">
					<div className="flex items-center gap-4 mb-4">
						<span className="font-mono text-primary text-sm">02.</span>
						<h2 className="font-mono text-2xl md:text-3xl font-bold text-foreground">
							My Journey
						</h2>
						<div className="flex-1 h-px bg-border" />
					</div>
					<p className="text-muted-foreground font-mono text-sm">
						<span className="text-terminal-green">$</span> git log --oneline
						--graph journey
					</p>
				</div>

				{/* Still Improving Notice */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
					transition={{ duration: 0.5 }}
					className="mb-10 p-4 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-3"
				>
					<Rocket size={20} className="text-primary flex-shrink-0" />
					<p className="text-sm text-muted-foreground">
						<span className="text-primary font-medium">Still improving!</span>{" "}
						This is just the beginning — constantly learning and growing every
						day.
					</p>
				</motion.div>

				{/* Timeline */}
				<div className="relative">
					{/* Vertical Line */}
					<div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

					{/* Journey Items */}
					<div className="space-y-12">
						{journey.map((item, index) => (
							<motion.div
								key={item.id}
								initial={{ opacity: 0, x: -20 }}
								animate={
									isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }
								}
								transition={{ duration: 0.5, delay: index * 0.15 }}
								className="relative pl-10"
							>
								{/* Git Commit Dot */}
								<div className="absolute left-0 top-1">
									<motion.div
										whileHover={{ scale: 1.2 }}
										className="w-6 h-6 rounded-full bg-card border-2 border-primary flex items-center justify-center"
									>
										<GitCommit size={12} className="text-primary" />
									</motion.div>
								</div>

								{/* Content */}
								<div className="group">
									{/* Date */}
									<span className="font-mono text-sm text-primary">
										{item.date}
									</span>

									{/* Title */}
									<h3 className="font-mono text-lg font-semibold text-foreground mt-1">
										{item.title}
									</h3>

									{/* Description */}
									<p className="text-muted-foreground mt-2 leading-relaxed">
										{item.description}
									</p>

									{/* Highlights */}
									<ul className="mt-4 space-y-2">
										{item.highlights.map((highlight, i) => (
											<li
												key={i}
												className="flex items-start gap-2 text-sm text-muted-foreground"
											>
												<span className="text-primary mt-1">▹</span>
												<span>{highlight}</span>
											</li>
										))}
									</ul>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</motion.div>
		</section>
	);
};
