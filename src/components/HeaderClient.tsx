"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Code2, FolderGit2, Home, LockKeyhole, LogIn, Menu, MessageSquare, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { id: "home", label: "Home", icon: Home, isSection: true },
  { id: "about", label: "About", icon: User, isSection: true },
  { id: "opensource", label: "Open Source", icon: Code2, isSection: true },
  { id: "contact", label: "Contact", icon: MessageSquare, isSection: true },
  { id: "projects", label: "Projects", icon: FolderGit2, isSection: false, path: "/projects" },
  { id: "blog", label: "Blog", icon: BookOpen, isSection: false, path: "/blog" },
];
interface HeaderProps { activeSection?: string; onNavigate?: (section: string) => void; initialAuthState: { authenticated: boolean; signedIn: boolean } }

export const HeaderClient = ({ activeSection, onNavigate, initialAuthState }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const initialAuthenticated = initialAuthState.authenticated;
  const initialSignedIn = initialAuthState.signedIn;
  const [authState, setAuthState] = useState(initialAuthState);
  useEffect(() => {
    void fetch("/api/auth/session", { cache: "no-store" }).then((response) => response.json()).then((data) => {
      setAuthState({ authenticated: Boolean(data.authenticated), signedIn: Boolean(data.signedIn) });
    }).catch(() => setAuthState({ authenticated: initialAuthenticated, signedIn: initialSignedIn }));
  }, [initialAuthenticated, initialSignedIn]);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const signInPath = `/login?returnTo=${encodeURIComponent(pathname || "/blog")}`;
  const links = [...navItems, ...(authState.signedIn ? [{ id: "account", label: "Account", icon: User, isSection: false, path: "/account" }] : [{ id: "signin", label: "Sign in", icon: LogIn, isSection: false, path: signInPath }]), ...(authState.authenticated ? [{ id: "admin", label: "Admin", icon: LockKeyhole, isSection: false, path: "/admin" }] : [])];
  const handleNavClick = (item: (typeof navItems)[number]) => {
    if (item.isSection && onNavigate && isHomePage) { onNavigate(item.id); setIsMobileMenuOpen(false); }
    else if (item.isSection && !isHomePage) window.location.href = `/#${item.id}`;
  };
  const isActiveSection = (id: string) => isHomePage && activeSection === id;
  const isActivePage = (path?: string) => path && pathname.startsWith(path);
  return <>
    <header className="fixed left-0 right-0 top-0 z-50 hidden lg:block"><div className="flex justify-center px-4 py-4"><nav className="flex items-center justify-center gap-1 rounded-full border border-border bg-card/80 px-2 py-2 backdrop-blur-md">{links.map((item) => {
      const active = item.isSection ? isActiveSection(item.id) : isActivePage(item.path);
      return item.isSection ? <div key={item.id} className="flex items-center"><button onClick={() => handleNavClick(item)} className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{active && <motion.div layoutId="activeNavBg" className="absolute inset-0 rounded-full bg-primary/20" />}<item.icon size={16} className="relative z-10" /><span className="relative z-10">{item.label}</span></button>{item.id === "contact" && <div className="mx-2 h-6 w-px bg-border" />}</div> : <Link key={item.id} href={item.path!} className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{active && <motion.div layoutId="activeNavBg" className="absolute inset-0 rounded-full bg-primary/20" />}<item.icon size={16} className="relative z-10" /><span className="relative z-10">{item.label}</span></Link>;
    })}<div className="mx-1 h-6 w-px bg-border" /><ThemeToggle /></nav></div></header>
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2 lg:hidden"><ThemeToggle /><button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-full border border-border bg-card/80 p-3 backdrop-blur-md" aria-label="Toggle menu">{isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button></div>
    <AnimatePresence>{isMobileMenuOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-background/90 backdrop-blur-md lg:hidden" onClick={() => setIsMobileMenuOpen(false)}><motion.nav initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="flex flex-col items-center gap-4" onClick={(event) => event.stopPropagation()}>{links.map((item, index) => {
      const active = item.isSection ? isActiveSection(item.id) : isActivePage(item.path);
      return item.isSection ? <motion.button key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }} onClick={() => handleNavClick(item)} className={`flex items-center gap-3 rounded-full px-6 py-3 text-lg font-medium ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><item.icon size={20} /><span>{item.label}</span></motion.button> : <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }}><Link href={item.path!} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-full px-6 py-3 text-lg font-medium ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><item.icon size={20} /><span>{item.label}</span></Link></motion.div>;
    })}</motion.nav></motion.div>}</AnimatePresence>
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/80 backdrop-blur-md lg:hidden"><div className="flex items-center justify-around px-2 py-2">{navItems.filter((item) => item.isSection).map((item) => <button key={item.id} onClick={() => handleNavClick(item)} className={`rounded-full p-3 transition-colors ${isActiveSection(item.id) ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} aria-label={item.label}><item.icon size={20} /></button>)}</div></nav>
  </>;
};
