"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MessageSquare, Newspaper } from "lucide-react";
import { api } from "@/lib/api";
import { formatEventWhen, type ClubEvent } from "@/lib/events";
import { formatRelativeTime } from "@/lib/utils";

const card = "group flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

/** Dashboard row: unread messages, the next club events, the latest news. Every part hides itself when there is nothing to show. */
export default function CommunityStrip() {
  const [unread, setUnread] = useState(0);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [news, setNews] = useState<{ id: number; title: string; source: string; published_at: string } | null>(null);

  useEffect(() => {
    let alive = true;
    api.get<{ count: number }>("/messages/unread-count").then((r) => alive && r.data && setUnread(r.data.count));
    api.get<{ events: ClubEvent[] }>("/clubs/events/upcoming").then((r) => alive && r.data && setEvents(r.data.events.slice(0, 3)));
    api.get<{ items: { id: number; title: string; source: string; published_at: string }[] }>("/news?limit=1").then((r) => alive && r.data && setNews(r.data.items[0] ?? null));
    return () => { alive = false; };
  }, []);

  if (!unread && !events.length && !news) return null;

  return (
    <section aria-label="Hamjamiyat" className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
      {unread > 0 && (
        <Link href="/dashboard/messages" className={card}>
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><MessageSquare size={15} className="text-blue-600" /> Xabarlar</span>
          <p className="text-sm text-muted-foreground"><span className="font-bold text-foreground">{unread}</span> ta o&apos;qilmagan xabar</p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 dark:text-blue-300">Ochish <ArrowRight size={12} /></span>
        </Link>
      )}
      {events.length > 0 && (
        <Link href="/community" className={card}>
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><CalendarDays size={15} className="text-violet-600" /> Klub tadbirlari</span>
          <ul className="space-y-1.5">
            {events.map((e) => (
              <li key={e.id} className="text-xs"><span className="font-semibold text-foreground">{formatEventWhen(e.starts_at)}</span> <span className="text-muted-foreground">· {e.title} ({e.club_name})</span></li>
            ))}
          </ul>
        </Link>
      )}
      {news && (
        <Link href="/news" className={card}>
          <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><Newspaper size={15} className="text-emerald-600" /> So&apos;nggi yangilik</span>
          <p className="line-clamp-2 text-sm text-foreground">{news.title}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{news.source ? `${news.source} · ` : ""}{formatRelativeTime(news.published_at)}</p>
        </Link>
      )}
    </section>
  );
}
