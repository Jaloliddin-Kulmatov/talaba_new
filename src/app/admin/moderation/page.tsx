"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Flag, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { timeAgoUz } from "@/lib/toolkit/time";
import { ConfirmButton, EmptyState, FormError, Panel, Skeleton } from "@/components/tools/ui";

interface Stats {
  users: number; users_7d: number; reviews: number; market_active: number; lostfound_open: number;
  new_7d: number; flagged: number; hidden: number;
}
interface QueueItem {
  kind: "review" | "market" | "lostfound"; id: number; title: string; preview: string; hidden: boolean;
  report_count: number; reasons: string[]; author: { id: number; name: string; email: string } | null; created_at: string | null;
}
const KIND_LABEL = { review: "Sharh", market: "Bozor e'loni", lostfound: "Yo'qolgan/topilgan" } as const;

export default function ModerationPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, q] = await Promise.all([api.get<Stats>("/moderation/stats"), api.get<{ items: QueueItem[] }>("/moderation/queue")]);
    if (s.error || q.error) { setError(s.error || q.error); setQueue([]); return; }
    setError(null); setStats(s.data); setQueue(q.data?.items ?? []);
  }, []);

  useEffect(() => { if (user?.role === "admin") void load(); }, [user, load]);

  const act = async (it: QueueItem, action: "restore" | "hide" | "delete") => {
    setBusy(`${it.kind}-${it.id}`);
    const path = `/moderation/${it.kind}/${it.id}`;
    const r = action === "delete" ? await api.delete(path) : await api.post(`${path}/${action}`, {});
    setBusy(null);
    if (r.error) return setError(r.error);
    await load();
  };

  if (loading) return <DashboardLayout><Skeleton className="h-40" /></DashboardLayout>;
  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <EmptyState icon={ShieldCheck} title="Faqat administrator uchun" text="Bu sahifani ko'rish uchun administrator hisobi bilan kiring." />
      </DashboardLayout>
    );
  }

  const tiles: [string, number | undefined, string][] = [
    ["Foydalanuvchilar", stats?.users, ""], ["Shu hafta qo'shilgan", stats?.users_7d, "text-emerald-600 dark:text-emerald-400"],
    ["Faol sharhlar", stats?.reviews, ""], ["Bozordagi e'lonlar", stats?.market_active, ""],
    ["Ochiq yo'qolgan/topilgan", stats?.lostfound_open, ""], ["Shu hafta yangi kontent", stats?.new_7d, "text-emerald-600 dark:text-emerald-400"],
    ["Shikoyat qilingan", stats?.flagged, "text-amber-600 dark:text-amber-400"], ["Yashirilgan", stats?.hidden, "text-red-600 dark:text-red-400"],
  ];

  return (
    <DashboardLayout>
      <header className="mb-6 flex items-start gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-red-500 text-white shadow-lg"><ShieldCheck size={22} /></div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">Moderatsiya</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Shikoyat qilingan va avtomatik yashirilgan sharhlar, e&apos;lonlar. 3 ta alohida shikoyatdan keyin kontent o&apos;zi yashiriladi.</p>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(([label, v, tone]) => (
          <div key={label} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
            <p className={cn("font-display text-2xl font-extrabold tabular-nums text-foreground", tone)}>{v ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <FormError text={error} />

      {queue === null ? (
        <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : queue.length === 0 ? (
        <EmptyState icon={Flag} title="Ko'rib chiqiladigan narsa yo'q" text="Hozircha hech qanday shikoyat tushmagan. Yaxshi!" />
      ) : (
        <ul className="space-y-3">
          {queue.map((it) => {
            const key = `${it.kind}-${it.id}`;
            return (
              <li key={key}>
                <Panel>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground">{KIND_LABEL[it.kind]}</span>
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", it.hidden ? "bg-red-500/10 text-red-700 dark:text-red-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
                      {it.hidden ? "Yashirilgan" : "Ko'rinib turibdi"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Flag size={12} /> {it.report_count} ta shikoyat</span>
                    {it.created_at && <span className="ml-auto text-xs text-muted-foreground">{timeAgoUz(it.created_at)}</span>}
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-foreground">{it.title}</h2>
                  {it.preview && <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{it.preview}</p>}
                  {it.reasons.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {it.reasons.map((r, i) => <li key={i} className="rounded-lg bg-muted px-2 py-1 text-xs text-foreground">“{r}”</li>)}
                    </ul>
                  )}
                  {it.author && <p className="mt-2 text-xs text-muted-foreground">Muallif: {it.author.name} · {it.author.email}</p>}
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="outline" disabled={busy === key} onClick={() => act(it, "restore")}><RotateCcw size={13} className="mr-1.5" /> Tiklash (shikoyatlar yolg&apos;on)</Button>
                    {!it.hidden && <Button size="sm" variant="outline" disabled={busy === key} onClick={() => act(it, "hide")}><EyeOff size={13} className="mr-1.5" /> Yashirish</Button>}
                    {it.hidden && <span className="inline-flex items-center gap-1 px-1 text-xs text-muted-foreground"><Eye size={12} /> Foydalanuvchilarga ko&apos;rinmaydi</span>}
                    <ConfirmButton className="h-8 rounded-lg px-3 text-xs" confirmLabel="Ha, o'chirish" onConfirm={() => act(it, "delete")}><Trash2 size={13} /> O&apos;chirish</ConfirmButton>
                  </div>
                </Panel>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardLayout>
  );
}
