import { ArrowLeft, Terminal } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
			<div className="max-w-md w-full text-center">
				<div className="terminal-window mb-8">
					<div className="terminal-header">
						<span className="terminal-dot bg-terminal-red" />
						<span className="terminal-dot bg-terminal-yellow" />
						<span className="terminal-dot bg-terminal-green" />
						<span className="ml-2 text-xs text-muted-foreground font-mono">
							error.sh
						</span>
					</div>
					<div className="p-6 font-mono text-sm text-left">
						<div className="text-terminal-red mb-2">$ Error: 404</div>
						<div className="text-muted-foreground">
							Page not found. This route does not exist.
						</div>
					</div>
				</div>

				<h1 className="text-6xl font-mono font-bold mb-4">
					<span className="text-gradient">404</span>
				</h1>
				<p className="text-xl text-muted-foreground mb-8">
					Oops! This page seems to have wandered off...
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
	);
}
