"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Plus, Search, ShoppingBag, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  CONDITIONS, MARKET_CATEGORIES, UNIVERSITY_NAMES, categoryOf, formatPrice, serviceById, type MarketItem,
} from "@/lib/community";
import { timeAgoUz } from "@/lib/toolkit/time";
import { ConfirmButton, EmptyState, Field, FormError, NumInput, Segmented, Skeleton, ToolHeader, fieldCls } from "@/components/tools/ui";
import { LoginGate, ReportBox } from "./ui";

type Sort = "new" | "cheap";
const qs = (o: Record<string, string>) => new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();

export default function MarketApp() {
  const meta = serviceById("market");
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("");
  const [university, setUniversity] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [mine, setMine] = useState(false);
  const [items, setItems] = useState<MarketItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<MarketItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let alive = true;
    setItems(null);
    api.get<{ items: MarketItem[]; total: number }>(`/market?${qs({ q: debounced, category, university, sort, mine: mine ? "1" : "" })}`).then((r) => {
      if (!alive) return;
      if (r.error || !r.data) { setError(r.error ?? "Yuklab bo'lmadi."); setItems([]); return; }
      setError(null); setItems(r.data.items); setTotal(r.data.total);
    });
    return () => { alive = false; };
  }, [debounced, category, university, sort, mine, reload, user?.id]);

  const now = new Date();

  return (
    <>
      <ToolHeader tool={meta} actions={<Button onClick={() => setCreating(true)}><Plus size={16} className="mr-1.5" /> E&apos;lon qo&apos;yish</Button>} />

      <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nima qidiryapsiz?" aria-label="Qidirish" className={cn(fieldCls, "pl-9")} maxLength={80} />
        </div>
        <select value={university} onChange={(e) => setUniversity(e.target.value)} aria-label="Universitet" className={cn(fieldCls, "sm:w-48")}>
          <option value="">Barcha universitetlar</option>
          {UNIVERSITY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Saralash" className={cn(fieldCls, "sm:w-40")}>
          <option value="new">Yangilari</option>
          <option value="cheap">Arzonlari</option>
        </select>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[{ id: "", label: "Hammasi", emoji: "✨" }, ...MARKET_CATEGORIES].map((c) => (
          <button
            key={c.id}
            aria-pressed={category === c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              category === c.id ? "border-blue-600 bg-blue-600 text-white" : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span className="mr-1">{c.emoji}</span>{c.label}
          </button>
        ))}
        {user && (
          <button
            aria-pressed={mine}
            onClick={() => setMine((m) => !m)}
            className={cn("ml-auto rounded-full border px-3 py-1.5 text-xs font-medium", mine ? "border-pink-600 bg-pink-600 text-white" : "border-border text-muted-foreground hover:bg-accent")}
          >
            Mening e&apos;lonlarim
          </button>
        )}
      </div>

      <FormError text={error} />

      {items === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={mine ? "Sizda hali e'lon yo'q" : "E'lonlar topilmadi"}
          text="Kerak bo'lmay qolgan kitob yoki konspektingizni sotib, boshqa talabaga yordam bering."
          action={<Button onClick={() => setCreating(true)}>E&apos;lon qo&apos;yish</Button>}
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">{total} ta e&apos;lon</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <li key={it.id}>
                <button
                  onClick={() => setOpen(it)}
                  className={cn(
                    "flex h-full w-full flex-col rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-card",
                    it.status === "sold" && "opacity-60",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-2xl" aria-hidden>{categoryOf(it.category)?.emoji}</span>
                    {it.status === "sold" && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">SOTILDI</span>}
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">{it.title}</h2>
                  <p className={cn("mt-1 font-display text-lg font-extrabold", it.price === 0 ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>{formatPrice(it.price)}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-muted-foreground">
                    {it.condition && <span className="inline-flex items-center gap-1"><Tag size={11} />{CONDITIONS.find((c) => c.id === it.condition)?.label}</span>}
                    {it.university && <span className="inline-flex items-center gap-1"><MapPin size={11} />{it.university}</span>}
                    <span className="ml-auto">{timeAgoUz(it.created_at, now)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {open && (
        <ItemDialog
          item={open}
          signedIn={!!user}
          onClose={() => setOpen(null)}
          onChanged={() => { setOpen(null); setReload((n) => n + 1); }}
        />
      )}
      {creating && (
        <CreateDialog
          signedIn={!!user}
          defaultUniversity={user?.university}
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); setReload((n) => n + 1); }}
        />
      )}
    </>
  );
}

function ItemDialog({ item, signedIn, onClose, onChanged }: { item: MarketItem; signedIn: boolean; onClose: () => void; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const setStatus = async (status: "active" | "sold") => {
    const r = await api.patch(`/market/${item.id}`, { status });
    if (r.error) return setError(r.error);
    onChanged();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={item.title} description={`${categoryOf(item.category)?.label ?? ""} · ${item.seller_name}`}>
        <p className="font-display text-3xl font-extrabold text-foreground">{formatPrice(item.price)}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {item.condition && <span className="rounded-full bg-muted px-2.5 py-1 font-medium">{CONDITIONS.find((c) => c.id === item.condition)?.label}</span>}
          {item.university && <span className="rounded-full bg-muted px-2.5 py-1 font-medium">{item.university}</span>}
          {item.region && <span className="rounded-full bg-muted px-2.5 py-1 font-medium">{item.region}</span>}
        </div>
        {item.description && <p className="mt-4 whitespace-pre-wrap text-sm text-foreground">{item.description}</p>}

        <div className="mt-5">
          {item.contact ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
              <p className="text-xs font-medium text-muted-foreground">Bog&apos;lanish</p>
              <p className="mt-0.5 break-all text-base font-semibold text-foreground">{item.contact}</p>
            </div>
          ) : (
            <LoginGate text="Sotuvchi bilan bog'lanish uchun hisobingizga kiring. Bu soxta e'lonlarning oldini oladi." />
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Ehtiyot bo&apos;ling: oldindan pul o&apos;tkazmang, buyumni uchrashib ko&apos;rib oling va kampus kabi ommaviy joyda uchrashing.
        </p>
        <FormError text={error} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {item.is_mine ? (
            <>
              <ConfirmButton onConfirm={async () => { await api.delete(`/market/${item.id}`); onChanged(); }}>O&apos;chirish</ConfirmButton>
              {item.status === "active"
                ? <Button onClick={() => setStatus("sold")}>Sotildi deb belgilash</Button>
                : item.status === "sold" ? <Button variant="outline" onClick={() => setStatus("active")}>Qayta faollashtirish</Button> : null}
            </>
          ) : signedIn ? (
            <ReportBox onSend={async (reason) => {
              const r = await api.post<{ message: string }>(`/market/${item.id}/report`, { reason });
              return r.data?.message ?? r.error ?? "Yuborilmadi.";
            }} />
          ) : <span />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateDialog({ signedIn, defaultUniversity, onClose, onCreated }: { signedIn: boolean; defaultUniversity?: string; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("kitob");
  const [condition, setCondition] = useState("yaxshi");
  const [price, setPrice] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [university, setUniversity] = useState(defaultUniversity ?? "");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const r = await api.post("/market", { title, category, condition, price, description, university, contact });
    setBusy(false);
    if (r.error) return setError(r.error);
    onCreated();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="E'lon qo'yish" description="E'lon bepul. Aloqa ma'lumotingiz faqat kirgan talabalarga ko'rinadi.">
        {!signedIn ? <LoginGate text="E'lon qo'yish uchun hisobingizga kiring." /> : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Sarlavha *"><input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls} maxLength={120} placeholder="masalan, Oliy matematika darsligi" autoFocus /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Kategoriya *">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={fieldCls}>
                  {MARKET_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                </select>
              </Field>
              <Field label="Holati">
                <Segmented size="sm" label="Holati" value={condition} onChange={setCondition} options={CONDITIONS.map((c) => ({ value: c.id, label: c.label }))} />
              </Field>
            </div>
            <Field label="Narxi (so'm)" hint="Bo'sh qoldirsangiz — «Kelishiladi». 0 yozsangiz — «Tekin».">
              <NumInput value={price} onChange={setPrice} placeholder="masalan, 50000" />
            </Field>
            <Field label="Tavsif"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} className={cn(fieldCls, "h-auto py-2.5")} placeholder="Holati, nashr yili, sabab…" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Universitet">
                <input list="mk-unis" value={university} onChange={(e) => setUniversity(e.target.value)} className={fieldCls} maxLength={120} />
                <datalist id="mk-unis">{UNIVERSITY_NAMES.map((n) => <option key={n} value={n} />)}</datalist>
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
