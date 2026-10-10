"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Flag, LogIn, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fieldCls } from "@/components/tools/ui";

/** Shown wherever an action needs an account. Reading is always public. */
export function LoginGate({ text = "Davom etish uchun hisobingizga kiring.", className }: { text?: string; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4 text-center", className)}>
      <p className="text-sm text-foreground">{text}</p>
      <div className="mt-3 flex justify-center gap-2">
        <Button asChild size="sm"><Link href="/login?force=1"><LogIn size={14} className="mr-1.5" /> Kirish</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href="/register">Ro&apos;yxatdan o&apos;tish</Link></Button>
      </div>
    </div>
  );
}

export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  const full = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= full ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} yulduz`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n === value ? 0 : n)}
          className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Star size={30} className={(hover || value) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35"} />
        </button>
      ))}
    </div>
  );
}

/** Small "report this" control: button → reason box → send. */
export function ReportBox({ onSend }: { onSend: (reason: string) => Promise<string> }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (msg) return <p className="text-xs text-muted-foreground" role="status">{msg}</p>;
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600">
        <Flag size={12} /> Shikoyat qilish
      </button>
    );
  }
  return (
    <div className="flex gap-2">
      <input
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Sababi (masalan, spam, aldov)"
        maxLength={200}
        aria-label="Shikoyat sababi"
        className={cn(fieldCls, "h-9 text-xs")}
      />
      <Button
        size="sm"
        variant="destructive"
        disabled={busy}
        onClick={async () => { setBusy(true); setMsg(await onSend(reason)); setBusy(false); }}
      >
        Yuborish
      </Button>
    </div>
  );
}
