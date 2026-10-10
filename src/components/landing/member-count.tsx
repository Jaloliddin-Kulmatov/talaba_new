"use client";

import { useEffect, useState, useRef } from "react";
import { Users } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export default function MemberCount() {
  const [target, setTarget] = useState<number | null>(null);
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Fetch the NUU (O'zbekiston Milliy universiteti) member count once on mount.
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/track/stats`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const n = Number(d?.nuu_members) || 0;
        setTarget(n);
      })
      .catch(() => setTarget(0));
    return () => { cancelled = true; };
  }, []);

  // Count-up animation when the target arrives.
  useEffect(() => {
    if (target === null) return;
    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  // Hide until we have a real number — never show "0 students" (also what a failed
  // request or a sleeping backend would otherwise produce).
  if (!target) return null;

  return (
    <div className="mt-8 flex justify-center lg:justify-start animate-fade-in" style={{ animationDelay: "0.35s" }}>
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-emerald-500/25 bg-emerald-500/8 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <Users size={14} className="text-emerald-500" />
        <span className="text-sm text-foreground">
          <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {display.toLocaleString()}
          </span>{" "}
          NUU talabasi allaqachon qo&apos;shildi
        </span>
      </div>
    </div>
  );
}
