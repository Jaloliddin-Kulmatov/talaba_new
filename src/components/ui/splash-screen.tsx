"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "talaba_splash_seen";

/**
 * App-launch splash. Shown only when TALABA is opened as an installed app
 * (home-screen / standalone) and only once per session — in a normal browser
 * tab it would just delay the content the visitor came for.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    let standalone = false;
    try {
      standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (!standalone || sessionStorage.getItem(SEEN_KEY)) return;
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      return;
    }
    setVisible(true);
    const t1 = setTimeout(() => setFading(true), 700);
    const t2 = setTimeout(() => setVisible(false), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-blue-500/20 to-emerald-500/20 blur-3xl" />
      <div className="relative flex flex-col items-center gap-5 animate-fade-in">
        <img src="/logo.svg" alt="" width={80} height={80} className="h-20 w-20 drop-shadow-xl" />
        <div className="text-center">
          <p className="font-display text-3xl font-extrabold tracking-tight text-foreground">
            TALABA<span className="text-blue-500">.</span>
          </p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            O&apos;zbek talabalari uchun
          </p>
        </div>
      </div>
    </div>
  );
}
