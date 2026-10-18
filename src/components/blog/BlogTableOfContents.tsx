"use client";

import Link from "next/link";
import { List } from "lucide-react";
import { useEffect, useState } from "react";
import type { BlogHeading } from "@/lib/blog/render";

export function BlogTableOfContents({ headings }: { headings: BlogHeading[] }) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!headings.length) return null;
  return <>
    <nav aria-label="Table of contents" className="mb-8 rounded-xl border border-border bg-card p-4 md:p-5">
      <h2 className="font-mono text-sm font-semibold text-primary">On this page</h2>
      <ol className="mt-3 space-y-2 text-sm">{headings.map((heading, index) => <li key={`${heading.id}-${index}`} className={heading.level > 2 ? "pl-5" : heading.level === 2 ? "pl-2" : ""}><Link href={`#${heading.id}`} className="text-muted-foreground hover:text-primary">{heading.text}</Link></li>)}</ol>
    </nav>
    {visible && <div className="fixed right-4 top-20 z-50 flex flex-col items-end md:bottom-8 md:right-8 md:top-auto">
      {open && <nav aria-label="Floating table of contents" className="mb-3 max-h-[60vh] w-72 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-xl"><div className="flex items-center justify-between"><h2 className="font-mono text-sm font-semibold text-primary">Jump to</h2><button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button></div><ol className="mt-3 space-y-2 text-sm">{headings.map((heading, index) => <li key={`${heading.id}-${index}`} className={heading.level > 2 ? "pl-5" : heading.level === 2 ? "pl-2" : ""}><Link href={`#${heading.id}`} onClick={() => setOpen(false)} className="block text-muted-foreground hover:text-primary">{heading.text}</Link></li>)}</ol></nav>}
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg"><List size={17} /> Contents</button>
    </div>}
  </>;
}
