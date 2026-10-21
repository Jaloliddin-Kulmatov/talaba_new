"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CalendarDays, CalendarPlus, MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatEventTime, formatEventWhen, googleCalendarUrl, localInputToIso, type ClubEvent } from "@/lib/events";
import { EmptyState, Field, FormError, Skeleton, fieldCls } from "@/components/tools/ui";

export default function ClubEvents({ clubId, canManage }: { clubId: number; canManage: boolean }) {
  const [events, setEvents] = useState<ClubEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", when: "", location: "", description: "" });

  const load = useCallback(async () => {
    const r = await api.get<{ events: ClubEvent[] }>(`/clubs/${clubId}/events`);
    if (r.data) { setEvents(r.data.events); setError(null); } else { setEvents([]); setError(r.error); }
  }, [clubId]);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    const iso = localInputToIso(form.when);
    if (!iso) { setError("Sana va vaqtni tanlang."); return; }
    setBusy(true); setError(null);
    const r = await api.post(`/clubs/${clubId}/events`, { title: form.title, description: form.description, location: form.location, starts_at: iso });
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    setForm({ title: "", when: "", location: "", description: "" }); setAdding(false); load();
  };

  const remove = async (id: number) => {
    if (!confirm("Tadbirni o'chirasizmi?")) return;
    await api.delete(`/clubs/${clubId}/events/${id}`);
    load();
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setAdding((a) => !a)}><Plus size={16} className="mr-1.5" /> Tadbir qo&apos;shish</Button>
        </div>
      )}

      {canManage && adding && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <Field label="Tadbir nomi"><input className={fieldCls} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sana va vaqt" hint="Toshkent vaqti bilan"><input type="datetime-local" className={fieldCls} value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })} /></Field>
            <Field label="Joyi"><input className={fieldCls} maxLength={160} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          </div>
          <Field label="Izoh"><textarea className={`${fieldCls} h-20 py-2`} maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Button disabled={busy || form.title.trim().length < 3 || !form.when} onClick={create}>Saqlash</Button>
        </div>
      )}

      <FormError text={error} />

      {events === null ? (
        <Skeleton className="h-24" />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Kelgusi tadbirlar yo'q" text={canManage ? "Birinchi tadbirni qo'shing — a'zolar ko'rishadi va kalendariga qo'shishadi." : "Klub tadbir qo'shganda shu yerda ko'rinadi."} />
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300" title={formatEventTime(e.starts_at)}>{formatEventWhen(e.starts_at)}</p>
                  <h3 className="mt-0.5 text-base font-bold text-foreground">{e.title}</h3>
                  {e.location && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={12} /> {e.location}</p>}
                  {e.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{e.description}</p>}
                  <a href={googleCalendarUrl(e)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:underline dark:text-blue-300">
                    <CalendarPlus size={13} /> Google Kalendarga qo&apos;shish
                  </a>
                </div>
                {canManage && <button onClick={() => remove(e.id)} aria-label="Tadbirni o'chirish" className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"><Trash2 size={14} /></button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
