"use client";

import React, { useEffect, useState } from "react";
import { MapPin, PackageSearch, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { UNIVERSITY_NAMES, serviceById, type LostItem } from "@/lib/community";
import { formatShortDate, isoDate, parseISODate, timeAgoUz } from "@/lib/toolkit/time";
import { ConfirmButton, EmptyState, Field, FormError, Segmented, Skeleton, ToolHeader, fieldCls } from "@/components/tools/ui";
import { LoginGate, ReportBox } from "./ui";

type Kind = "" | "lost" | "found";
const qs = (o: Record<string, string>) => new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();
const KIND = { lost: { label: "Yo'qotilgan", cls: "bg-red-500/10 text-red-700 dark:text-red-400" }, found: { label: "Topilgan", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" } };

export default function LostFoundApp() {
  const meta = serviceById("lostfound");
  const { user } = useAuth();
  const [kind, setKind] = useState<Kind>("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [mine, setMine] = useState(false);
  const [items, setItems] = useState<LostItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<LostItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setItems(null);
    api.get<{ items: LostItem[] }>(`/lostfound?${qs({ kind, q: debounced, mine: mine ? "1" : "" })}`).then((r) => {
      if (!alive) return;
      if (r.error || !r.data) { setError(r.error ?? "Yuklab bo'lmadi."); setItems([]); return; }
      setError(null); setItems(r.data.items);
    });
    return () => { alive = false; };
  }, [kind, debounced, mine, reload, user?.id]);

  const now = new Date();

  return (
    <>
      <ToolHeader tool={meta} actions={<Button onClick={() => setCreating(true)}><Plus size={16} className="mr-1.5" /> E&apos;lon berish</Button>} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented<Kind> label="Turi" value={kind} onChange={setKind} options={[{ value: "", label: "Hammasi" }, { value: "lost", label: "Yo'qotilgan" }, { value: "found", label: "Topilgan" }]} />
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buyum yoki joy nomi" aria-label="Qidirish" className={cn(fieldCls, "pl-9")} maxLength={80} />
        </div>
        {user && (
          <button aria-pressed={mine} onClick={() => setMine((m) => !m)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", mine ? "border-sky-600 bg-sky-600 text-white" : "border-border text-muted-foreground hover:bg-accent")}>
            Mening e&apos;lonlarim
          </button>
        )}
      </div>

      <FormError text={error} />

      {items === null ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="E'lonlar yo'q"
          text="Biror narsa yo'qotdingizmi yoki topdingizmi? E'lon bering — kampusdagi talabalar ko'rishadi."
          action={<Button onClick={() => setCreating(true)}>E&apos;lon berish</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id}>
              <button onClick={() => setOpen(it)} className="flex w-full items-start gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-card">
                <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", KIND[it.kind].cls)}>{KIND[it.kind].label}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold text-foreground">{it.title}</h2>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin size={11} />{it.place}</span>
                    <span>{formatShortDate(parseISODate(it.happened_on))}</span>
                    {it.university && <span>{it.university}</span>}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgoUz(it.created_at, now)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && <ItemDialog item={open} signedIn={!!user} onClose={() => setOpen(null)} onChanged={() => { setOpen(null); setReload((n) => n + 1); }} />}
      {creating && <CreateDialog signedIn={!!user} defaultUniversity={user?.university} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); setReload((n) => n + 1); }} />}
    </>
  );
}

function ItemDialog({ item, signedIn, onClose, onChanged }: { item: LostItem; signedIn: boolean; onClose: () => void; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={item.title} description={`${KIND[item.kind].label} · ${formatShortDate(parseISODate(item.happened_on))}`}>
        <p className="flex items-center gap-1.5 text-sm text-foreground"><MapPin size={14} className="text-muted-foreground" /> {item.place}{item.university ? ` · ${item.university}` : ""}</p>
        {item.description && <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{item.description}</p>}
        <div className="mt-5">
          {item.contact ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
              <p className="text-xs font-medium text-muted-foreground">Bog&apos;lanish</p>
              <p className="mt-0.5 break-all text-base font-semibold text-foreground">{item.contact}</p>
            </div>
          ) : <LoginGate text="E'lon egasi bilan bog'lanish uchun hisobingizga kiring." />}
        </div>
        <FormError text={error} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {item.is_mine ? (
            <>
              <ConfirmButton onConfirm={async () => { await api.delete(`/lostfound/${item.id}`); onChanged(); }}>O&apos;chirish</ConfirmButton>
              <Button onClick={async () => { const r = await api.patch(`/lostfound/${item.id}`, { status: "resolved" }); if (r.error) return setError(r.error); onChanged(); }}>
                {item.kind === "lost" ? "Topildi — yopish" : "Egasiga topshirildi — yopish"}
              </Button>
            </>
          ) : signedIn ? (
            <ReportBox onSend={async (reason) => {
              const r = await api.post<{ message: string }>(`/lostfound/${item.id}/report`, { reason });
              return r.data?.message ?? r.error ?? "Yuborilmadi.";
            }} />
          ) : <span />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateDialog({ signedIn, defaultUniversity, onClose, onCreated }: { signedIn: boolean; defaultUniversity?: string; onClose: () => void; onCreated: () => void }) {
  const [kind, setKind] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [day, setDay] = useState(isoDate(new Date()));
  const [description, setDescription] = useState("");
  const [university, setUniversity] = useState(defaultUniversity ?? "");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const r = await api.post("/lostfound", { kind, title, place, happened_on: day, description, university, contact });
    setBusy(false);
    if (r.error) return setError(r.error);
    onCreated();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="E'lon berish" description="Aloqa ma'lumotingiz faqat kirgan talabalarga ko'rinadi.">
        {!signedIn ? <LoginGate text="E'lon berish uchun hisobingizga kiring." /> : (
          <form onSubmit={submit} className="space-y-4">
            <Segmented label="Turi" value={kind} onChange={setKind} options={[{ value: "lost", label: "Yo'qotdim" }, { value: "found", label: "Topdim" }]} />
            <Field label="Buyum *"><input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls} maxLength={120} placeholder="masalan, qora hamyon, talaba kartasi" autoFocus /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Qayerda *"><input value={place} onChange={(e) => setPlace(e.target.value)} className={fieldCls} maxLength={160} placeholder="masalan, 2-bino kutubxonasi" /></Field>
              <Field label="Qachon *"><input type="date" value={day} max={isoDate(new Date())} onChange={(e) => setDay(e.target.value)} className={fieldCls} /></Field>
            </div>
            <Field label="Tavsif"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={800} className={cn(fieldCls, "h-auto py-2.5")} placeholder="Rangi, belgilari — egasini aniqlashga yordam beradigan ma'lumot (hammasini yozmang)." /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Universitet">
                <input list="lf-unis" value={university} onChange={(e) => setUniversity(e.target.value)} className={fieldCls} maxLength={120} />
                <datalist id="lf-unis">{UNIVERSITY_NAMES.map((n) => <option key={n} value={n} />)}</datalist>
              </Field>
              <Field label="Bog'lanish *"><input value={contact} onChange={(e) => setContact(e.target.value)} className={fieldCls} maxLength={120} placeholder="@telegram yoki +998…" /></Field>
            </div>
            <FormError text={error} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Bekor qilish</Button>
              <Button type="submit" disabled={busy}>E&apos;lon qilish</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
