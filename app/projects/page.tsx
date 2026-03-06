"use client";

import { ArrowLeft, FolderGit2 } from "lucide-react";
import Link from "next/link";
import { GridBackground } from "@/components/GridBackground";
import { Header } from "@/components/Header";
import { MouseSpotlight } from "@/components/MouseSpotlight";

export default function ProjectsPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<GridBackground />
			<MouseSpotlight />
			<Header />
			<div className="relative z-10 flex items-center justify-center min-h-screen px-6">
				<div className="max-w-md w-full text-center">
					<div className="terminal-window mb-8">
						<div className="terminal-header">
							<span className="terminal-dot bg-terminal-red" />
							<span className="terminal-dot bg-terminal-yellow" />
							<span className="terminal-dot bg-terminal-green" />
							<span className="ml-2 text-xs text-muted-foreground font-mono">
								projects.sh
							</span>
						</div>
						<div className="p-6 font-mono text-sm text-left">
							<div className="text-terminal-yellow mb-2">
								$ status --projects
							</div>
							<div className="text-muted-foreground">
								Projects showcase is currently under construction. Stay tuned!
							</div>
						</div>
					</div>

					<FolderGit2 size={48} className="mx-auto mb-4 text-primary" />
					<h1 className="text-4xl font-mono font-bold mb-4">
						<span className="text-gradient">Coming Soon</span>
					</h1>
					<p className="text-lg text-muted-foreground mb-8">
						Project showcase is being built. Check back later!
					</p>

					<Link
						href="/"
						className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-mono"
					>
						<ArrowLeft size={18} />
						Back to Home
					</Link>
				</div>
			</div>
		</div>
	);
}
