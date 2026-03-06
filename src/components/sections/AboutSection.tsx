"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import config from "@/config.json";
import { Skills } from "./Skills";

export const AboutSection = () => {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: true, margin: "-100px" });

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
	};

	return (
		<section id="about" className="py-24" ref={ref}>
			<motion.div
				variants={containerVariants}
				initial="hidden"
				animate={isInView ? "visible" : "hidden"}
				className="max-w-6xl mx-auto px-6"
			>
				{/* Section Header */}
				<motion.div variants={itemVariants} className="mb-12">
					<div className="flex items-center gap-4 mb-4">
						<span className="font-mono text-primary text-sm">01.</span>
						<h2 className="font-mono text-2xl md:text-3xl font-bold text-foreground">
							About Me
						</h2>
						<div className="flex-1 h-px bg-border" />
					</div>
				</motion.div>

				{/* About Content */}
				<div className="grid md:grid-cols-5 gap-12 mb-16">
					<motion.div
						variants={itemVariants}
						className="md:col-span-3 space-y-4 text-muted-foreground leading-relaxed"
					>
						<p>
							Hello! I&apos;m{" "}
							<span className="text-foreground font-medium">KMohZaid</span>, a
							passionate developer who loves building things that live on the
							internet. My fascination with computers started way back in class
							6–7 when I used to play online games on my father&apos;s office
							PC. He taught me how to use a browser, search the web, and find
							games to play. Out of all the games I discovered, I played{" "}
							<a
								href="https://disney.fandom.com/wiki/Transport-inators_of_Doooom!"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline"
							>
								Phineas and Ferb: Transport-inators of Doooom!
							</a>{" "}
							the most — a memory I still cherish. Those old browser games are
							all gone now, but I hope to find or run them again someday.
						</p>
						<p>
							My whole family supported me every step of the way. I learned
							about computers from my father, and my family always encouraged me
							whenever I tried to learn something new. I used my mom&apos;s
							phone as a second device to experiment — automating apps, trying
							control tools — and she never once stopped me, even when things
							could go wrong. Once I accidentally messed up the partition
							settings on my dad&apos;s office PC and it wouldn&apos;t boot.
							Instead of getting upset, he calmly said &quot;it&apos;s fine, you
							can try tomorrow, and if not we&apos;ll bring someone and you can
							learn from them.&quot; I already knew the fix from a past incident
							where a tech guy had wiped my PC saying it wasn&apos;t recoverable
							— this time I wanted to prove I could do it myself. Next day, I
							fixed it using a live USB recovery. My knowledge even helped my
							dad later when he found an old hard disk he thought was broken —
							the partition table was simply missing, and I recovered it.
						</p>
						<p>
							Even with all that early interest, I never pursued computers
							formally — I thought I should focus on school first and computing
							would come naturally later. That mindset changed when the 2020
							lockdown gave me the time to finally dive in. I love to use
							anime-based alias names over the internet such as{" "}
							<span className="text-primary font-medium">Chika Fujiwara</span>{" "}
							and more. When I&apos;m not writing code, you&apos;ll find me
							exploring new tools, learning from the developer community, or
							working on personal projects that push my boundaries.
						</p>
					</motion.div>

					{/* Terminal-style About Card */}
					<motion.div variants={itemVariants} className="md:col-span-2">
						<div className="terminal-window">
							<div className="terminal-header">
								<span className="terminal-dot bg-terminal-red" />
								<span className="terminal-dot bg-terminal-yellow" />
								<span className="terminal-dot bg-terminal-green" />
								<span className="ml-2 text-xs text-muted-foreground font-mono">
									about.sh
								</span>
							</div>
							<div className="p-4 font-mono text-xs space-y-2">
								<div>
									<span className="text-terminal-green">$</span>
									<span className="text-muted-foreground ml-2">
										cat profile.json
									</span>
								</div>
								<div className="text-muted-foreground pl-2">
									<div>{"{"}</div>
									<div className="pl-2">
										<span className="text-terminal-green">"name"</span>:{" "}
										<span className="text-terminal-yellow">
											"{config.personal.name}"
										</span>
										,
									</div>
									<div className="pl-2">
										<span className="text-terminal-green">"alias"</span>:{" "}
										<span className="text-terminal-yellow">
											"Chika Fujiwara"
										</span>
										,
									</div>
									<div className="pl-2">
										<span className="text-terminal-green">"focus"</span>:{" "}
										<span className="text-terminal-yellow">
											"Backend & APIs"
										</span>
										,
									</div>
									<div className="pl-2">
										<span className="text-terminal-green">"passion"</span>:{" "}
										<span className="text-terminal-yellow">"Open Source"</span>,
									</div>
									<div className="pl-2">
										<span className="text-terminal-green">"learning"</span>:{" "}
										<span className="text-terminal-purple">true</span>
									</div>
									<div>{"}"}</div>
								</div>
							</div>
						</div>
					</motion.div>
				</div>

				{/* Section Header for Skills */}
				<motion.div variants={itemVariants} className="mb-8">
					<div className="flex items-center gap-4 mb-4">
						<h3 className="font-mono text-xl md:text-2xl font-bold text-foreground">
							Skills
						</h3>
						<div className="flex-1 h-px bg-border" />
					</div>
				</motion.div>

				{/* Skills Component */}
				<Skills />
			</motion.div>
		</section>
	);
};
