"use client";

import { BadgeIndianRupee } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PaywallSettings } from "./PaywallSettings";

export function PaywallDialogButton({ postId }: { postId: string }) {
  return <Dialog><DialogTrigger asChild><button type="button" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"><BadgeIndianRupee size={16} /> Paid access</button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Paid article settings</DialogTitle><DialogDescription>Set the price and duration of access for this article.</DialogDescription></DialogHeader><PaywallSettings postId={postId} compact /></DialogContent></Dialog>;
}
