import Link from "next/link";
import { BookOpen, Home, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "support", href: "/support", label: "Qo'llanmalar", icon: BookOpen },
  { id: "daily-life", href: "/daily-life", label: "Kundalik hayot", icon: Home },
  { id: "news", href: "/news", label: "Yangiliklar", icon: Newspaper },
] as const;

/**
 * "Hayot va yordam" is one section in the main menu. Its parts — step-by-step guides (/support),
 * everyday life (/daily-life) and news (/news) — switch through this tab strip, shown at the top of each page.
 */
export default function LifeTabs({ active }: { active: (typeof TABS)[number]["id"] }) {
  return (
    <div className="sticky top-16 z-30 mt-16 border-b border-border bg-background/90 backdrop-blur-xl">
      <nav aria-label="Hayot va yordam" className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center gap-1 py-2">
        {TABS.map(({ id, href, label, icon: Icon }) => {
          const isActive = id === active;
          return (
            <Link
              key={id}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
