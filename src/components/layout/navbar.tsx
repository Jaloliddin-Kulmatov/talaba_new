"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, Menu, X, Search, Sparkles,
  Users, Briefcase, Globe, MessageSquare,
  LayoutDashboard, LogIn, LogOut, ShieldCheck, LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import SearchModal from "@/components/ui/search-modal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useNotifCount } from "@/hooks/use-notif-count";

// Universities was retired from the primary nav on both desktop and mobile —
// the page still exists at /universities (linked from ambassador flows / direct
// URL) but it's no longer a top-level destination. Desktop and mobile now share
// the same link set.
const desktopNavLinks = [
  { href: "/tools", label: "Asboblar", icon: LayoutGrid },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/community", label: "Klublar", icon: Users },
  { href: "/jobs", label: "Ishlar", icon: Briefcase },
  { href: "/support", label: "Hayot va yordam", icon: Globe, also: ["/daily-life", "/news"] },
];

const mobileNavLinks = desktopNavLinks;

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const notifCount = useNotifCount(user?.id);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  // ⌘K / Ctrl+K shortcut
  const handleGlobalKey = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [handleGlobalKey]);

  const active = (href: string, also: string[] = []) =>
    [href, ...also].some((h) => pathname === h || (h !== "/" && pathname.startsWith(h)));

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled || !transparent
            ? "bg-background/85 backdrop-blur-xl border-b border-border shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} prefetch className="flex items-center gap-2 group shrink-0">
            <img
              src="/logo.svg"
              alt="TALABA logotipi"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full shadow-sm group-hover:shadow-[0_0_16px_rgba(37,99,235,0.5)] transition-shadow select-none"
              draggable={false}
            />
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base tracking-tight text-foreground">
                TALABA<span className="text-blue-500">.</span>
              </span>
              <span className="text-[9px] text-muted-foreground font-medium tracking-wide hidden sm:block">
                O'zbek talabalari uchun platforma
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Asosiy menyu" className="hidden md:flex items-center gap-0.5">
            {desktopNavLinks.map(({ href, label, icon: Icon, ...rest }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 xl:px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  active(href, "also" in rest ? rest.also : [])
                    ? "text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon size={14} className="hidden xl:block" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            {/* Search — always visible */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground text-xs hover:border-blue-500/30 hover:text-foreground transition-colors"
            >
              <Search size={13} />
              <span>Qidirish</span>
              <kbd className="hidden xl:inline-flex h-4 px-1 rounded bg-muted text-foreground text-[10px] font-mono">⌘K</kbd>
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Qidirish"
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Search size={16} />
            </button>

            {user ? (
              <>
                <Button variant="ghost" size="icon-sm" asChild title="AI Yordamchi">
                  <Link href="/dashboard/ai">
                    <Sparkles size={15} className="text-violet-500" />
                  </Link>
                </Button>

                <Button variant="ghost" size="icon-sm" className="relative" title="Bildirishnomalar" asChild>
                  <Link href="/dashboard/notifications">
                    <Bell size={15} />
                    {notifCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none pointer-events-none">
                        {notifCount > 9 ? "9+" : notifCount}
                      </span>
                    )}
                  </Link>
                </Button>

                <Link
                  href="/dashboard/profile"
                  aria-label="Profilim"
                  className="flex items-center gap-2 ml-1 px-2 py-1 rounded-xl hover:bg-accent transition-colors"
                >
                  <Avatar size="sm" online>
                    <AvatarFallback className="text-xs font-semibold">
                      {user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-foreground leading-tight">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{user.university || "TALABA"}</p>
                  </div>
                </Link>
              </>
            ) : (
              <>
                {/* Sign in: only useful for returning users — force=1 bypasses the
                    "new visitors go to /register" redirect on the login page. */}
                <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                  <Link href="/login?force=1">Kirish</Link>
                </Button>
                <Button size="sm" asChild className="gap-1.5">
                  <Link href="/register">
                    <LogIn size={13} />
                    Boshlash
                  </Link>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label={mobileOpen ? "Menyuni yopish" : "Menyuni ochish"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 md:hidden bg-background/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed top-16 inset-x-0 z-40 md:hidden bg-background border-b border-border p-4 space-y-1 shadow-lg animate-slide-up">
            {mobileNavLinks.map(({ href, label, icon: Icon, ...rest }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  active(href, "also" in rest ? rest.also : [])
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border space-y-1">
              {user ? (
                <>
                  <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
                    <LayoutDashboard size={17} />
                    Boshqaruv paneli
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-500 hover:bg-amber-500/10 transition-colors"
                    >
                      <ShieldCheck size={17} />
                      Admin panel
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMobileOpen(false); router.push("/"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={17} />
                    Chiqish
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <Button className="w-full gap-2" asChild>
                    <Link href="/register">
                      <LogIn size={14} />
                      Bepul ro'yxatdan o'tish
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login?force=1">
                      Kirish
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
