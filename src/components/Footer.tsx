import { Coffee, Github, Linkedin, Mail, Send, Twitter } from "lucide-react";
import config from "@/config.json";

type IconComponent = typeof Github;

const iconMap: Record<string, IconComponent> = {
	github: Github,
	linkedin: Linkedin,
	twitter: Twitter,
	telegram: Send,
	email: Mail,
	buymeacoffee: Coffee,
};

const socialLinks = Object.entries(config.social)
	.filter(([, url]) => url !== "none")
	.map(([key, url]) => ({
		icon: iconMap[key] || Mail,
		href: key === "email" ? `mailto:${url}` : url,
		label: key.charAt(0).toUpperCase() + key.slice(1),
	}));

export const Footer = () => {
	return (
		<footer className="py-12 border-t border-border">
			<div className="max-w-4xl mx-auto px-6 text-center">
				{/* Social Links */}
				<div className="flex items-center justify-center gap-4 mb-8">
					{socialLinks.map((social) => (
						<a
							key={social.label}
							href={social.href}
							target="_blank"
							rel="noopener noreferrer"
							className="p-3 rounded-full bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
							aria-label={social.label}
						>
							<social.icon size={20} />
						</a>
					))}
				</div>

				{/* Credits */}
				<div className="space-y-2">
					<p className="font-mono text-sm text-muted-foreground">
						Designed & Built by{" "}
						<span className="text-primary font-medium">
							{config.personal.name}
						</span>
					</p>
					<p className="font-mono text-xs text-muted-foreground/60">
						Built with {config.site.built_with}
					</p>
					{config.site.repo_url !== "none" && (
						<p className="font-mono text-xs text-muted-foreground/60">
							This website is{" "}
							<a
								href={config.site.repo_url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline"
							>
								open sourced
							</a>{" "}
							— feel free to fork it!
						</p>
					)}
				</div>
			</div>
		</footer>
	);
};
