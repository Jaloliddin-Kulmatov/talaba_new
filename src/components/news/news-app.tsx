"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, Newspaper, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import { EmptyState, Field, FormError, Skeleton, fieldCls } from "@/components/tools/ui";

interface NewsItem { id: number; title: string; summary: string; url: string; source: string; published_at: string }

export default function NewsApp() {
  const { user } = useAuth();
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", summary: "", url: "", source: "" });
  const [busy, setBusy] = useState(false);

  const load = () =>
    api.get<{ items: NewsItem[] }>("/news?limit=50").then((r) => {
      if (r.error || !r.data) { setError(r.error ?? "Yuklab bo'lmadi."); setItems([]); return; }
      setError(null); setItems(r.data.items);
    });
  useEffect(() => { load(); }, []);

  const isAdmin = user?.role === "admin";

  const add = async () => {
    setBusy(true); setError(null);
    const r = await api.post<{ item: NewsItem }>("/news", form);
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    setForm({ title: "", summary: "", url: "", source: "" }); setAdding(false); load();
  };

  const remove = async (id: number) => {
    if (!confirm("Bu yangilikni o'chirasizmi?")) return;
    await api.delete(`/news/${id}`);
    load();
  };

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Yangiliklar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Qabul, grant, stipendiya va universitetlardagi muhim xabarlar.</p>
        </div>
        {isAdmin && <Button onClick={() => setAdding((a) => !a)}><Plus size={16} className="mr-1.5" /> Qo&apos;shish</Button>}
      </div>

      {isAdmin && adding && (
        <div className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4">
          <Field label="Sarlavha"><input className={fieldCls} value={form.title} maxLength={200} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Qisqacha mazmuni"><textarea className={`${fieldCls} h-24 py-2`} value={form.summary} maxLength={1500} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Manba (masalan, NUU)"><input className={fieldCls} value={form.source} maxLength={120} onChange={(e) => setForm({ ...form, source: e.target.value })} /></Field>
            <Field label="Havola (https://…)"><input className={fieldCls} value={form.url} maxLength={500} onChange={(e) => setForm({ ...form, url: e.target.value })} /></Field>
          </div>
          <Button disabled={busy || form.title.trim().length < 3} onClick={add}>Joylash</Button>
        </div>
      )}

      <FormError text={error} />

      {items === null ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Newspaper} title="Hozircha yangiliklar yo'q" text="Yangi xabarlar paydo bo'lganda shu yerda ko'rasiz." />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{n.source ? `${n.source} · ` : ""}{formatRelativeTime(n.published_at)}</p>
                  <h2 className="mt-1 text-base font-bold leading-snug text-foreground">{n.title}</h2>
                  {n.summary && <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{n.summary}</p>}
                  {n.url && (
                    <a href={n.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:underline dark:text-blue-300">
                      Manbada o&apos;qish <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                {isAdmin && (
                  <button onClick={() => remove(n.id)} aria-label="O'chirish" className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"><Trash2 size={14} /></button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
