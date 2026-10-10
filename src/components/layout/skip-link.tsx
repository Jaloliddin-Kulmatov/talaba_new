"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Keyboard users can jump past the navigation straight to the page's <main>. Visible only on focus. */
export default function SkipLink() {
  const pathname = usePathname();
  // Give whichever <main> is on screen the id the link points at. A MutationObserver keeps this
  // right when the layout swaps (e.g. the account chrome appearing after sign-in resolves).
  useEffect(() => {
    const tag = () => { const main = document.querySelector("main:not([id])"); if (main) main.id = "main-content"; };
    tag();
    let raf = 0;
    const obs = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tag); });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => { obs.disconnect(); cancelAnimationFrame(raf); };
  }, [pathname]);

  return (
    <a
      href="#main-content"
      onClick={(e) => {
        const main = document.querySelector("main");
        if (!main) return;
        e.preventDefault();
        main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: false });
        main.scrollIntoView();
      }}
      className="sr-only fixed left-3 top-3 z-[300] rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xl focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white"
    >
      Asosiy kontentga o&apos;tish
    </a>
  );
}
