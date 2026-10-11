import { Coffee, Github, Linkedin, Mail, Send, Twitter } from "lucide-react";
import config from "@/config.json";
import { AdminLink } from "@/components/blog/AdminLink";

type IconComponent = typeof Github;
const iconMap: Record<string, IconComponent> = { github: Github, linkedin: Linkedin, twitter: Twitter, telegram: Send, email: Mail, buymeacoffee: Coffee };
const socialLinks = Object.entries(config.social).filter(([, url]) => url !== "none").map(([key, url]) => ({ icon: iconMap[key] || Mail, href: key === "email" ? `mailto:${url}` : url, label: key.charAt(0).toUpperCase() + key.slice(1) }));

export const Footer = () => <footer className="border-t border-border py-12"><div className="mx-auto max-w-4xl px-6 text-center"><div className="mb-8 flex items-center justify-center gap-4">{socialLinks.map((social) => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border bg-card p-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary" aria-label={social.label}><social.icon size={20} /></a>)}</div><div className="space-y-2"><p className="font-mono text-sm text-muted-foreground">Designed &amp; Built by <span className="font-medium text-primary">{config.personal.name}</span></p><p className="font-mono text-xs text-muted-foreground/60">Built with {config.site.built_with}</p>{config.site.repo_url !== "none" && <p className="font-mono text-xs text-muted-foreground/60">This website is <a href={config.site.repo_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">open sourced</a> — feel free to fork it!</p>}</div><div className="mt-4 flex justify-center"><AdminLink /></div></div></footer>;
