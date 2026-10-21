"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Ban, Check, CheckCheck, MessageSquare, Search, Send, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { EmptyState, FormError, Skeleton, fieldCls } from "@/components/tools/ui";
import { LoginGate, ReportBox } from "@/components/community/ui";

interface Person { id: number; name: string; university: string }
interface Msg { id: number; sender_id: number; body: string; created_at: string; read: boolean; mine: boolean }
interface Convo { user: Person; last: Msg; unread: number }
interface Thread { user: Person; messages: Msg[]; blocked: boolean; blocked_me: boolean }

const initials = (n: string) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 text-xs font-bold text-white" aria-hidden>
      {initials(name)}
    </div>
  );
}

export default function MessagesApp() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const withId = Number(params.get("with")) || null;

  const [convos, setConvos] = useState<Convo[] | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Person[] | null>(null);
  const lastId = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);

  const loadConvos = useCallback(async () => {
    const r = await api.get<{ conversations: Convo[] }>("/messages/conversations");
    if (r.data) setConvos(r.data.conversations);
    else if (r.status === 401) setConvos([]);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadConvos();
    const t = window.setInterval(() => { if (document.visibilityState === "visible") loadConvos(); }, 15000);
    return () => window.clearInterval(t);
  }, [user, loadConvos]);

  // Open / poll the thread
  useEffect(() => {
    if (!user || !withId) { setThread(null); return; }
    let alive = true;
    lastId.current = 0;
    setThread(null);
    const pull = async (first: boolean) => {
      const r = await api.get<Thread>(`/messages/with/${withId}${first ? "" : `?after=${lastId.current}`}`);
      if (!alive) return;
      if (r.error || !r.data) { if (first) setError(r.error ?? "Yuklab bo'lmadi."); return; }
      const d = r.data;
      if (first) { setError(null); setThread(d); }
      else if (d.messages.length || d.blocked !== undefined) {
        setThread((t) => t ? { ...t, blocked: d.blocked, blocked_me: d.blocked_me, messages: [...t.messages.filter((m) => !d.messages.some((n) => n.id === m.id)), ...d.messages] } : t);
      }
      if (d.messages.length) { lastId.current = Math.max(lastId.current, ...d.messages.map((m) => m.id)); if (!first) loadConvos(); }
    };
    pull(true).then(loadConvos);
    const t = window.setInterval(() => { if (document.visibilityState === "visible") pull(false); }, 5000);
    return () => { alive = false; window.clearInterval(t); };
  }, [user, withId, loadConvos]);

  useEffect(() => { if (thread) lastId.current = Math.max(lastId.current, ...thread.messages.map((m) => m.id), 0); bottom.current?.scrollIntoView({ block: "end" }); }, [thread]);

  // People search
  useEffect(() => {
    if (q.trim().length < 2) { setResults(null); return; }
    const id = window.setTimeout(async () => {
      const r = await api.get<{ users: Person[] }>(`/messages/users?q=${encodeURIComponent(q.trim())}`);
      setResults(r.data?.users ?? []);
    }, 300);
    return () => window.clearTimeout(id);
  }, [q]);

  const open = (id: number) => { setQ(""); setResults(null); router.replace(`/dashboard/messages?with=${id}`, { scroll: false }); };
  const back = () => router.replace("/dashboard/messages", { scroll: false });

  const send = async () => {
    const body = text.trim();
    if (!body || !withId || sending) return;
    setSending(true); setError(null);
    const r = await api.post<{ message: Msg }>(`/messages/with/${withId}`, { body });
    setSending(false);
    if (r.error || !r.data) { setError(r.error); return; }
    setText("");
    setThread((t) => (t ? { ...t, messages: [...t.messages, r.data!.message] } : t));
    loadConvos();
  };

  const toggleBlock = async () => {
    if (!thread) return;
    const r = thread.blocked ? await api.delete(`/messages/block/${thread.user.id}`) : await api.post(`/messages/block/${thread.user.id}`, {});
    if (!r.error) { setThread({ ...thread, blocked: !thread.blocked }); loadConvos(); }
  };

  if (!user) return <LoginGate text="Xabarlar uchun hisobingizga kiring." />;

  const listVisible = !withId;   // on phones: either the list or the thread

  return (
    <>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><MessageSquare size={20} /></div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Xabarlar</h1>
          <p className="text-xs text-muted-foreground">Boshqa talabalar bilan shaxsiy yozishmalar</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        {/* ── Left: search + conversations ── */}
        <aside className={cn("space-y-3", !listVisible && "hidden md:block")}>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Talabani ism bo'yicha qidiring" aria-label="Talabani qidirish" maxLength={60} className={cn(fieldCls, "pl-9")} />
          </div>

          {results !== null ? (
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {results.length === 0 && <li className="p-4 text-center text-xs text-muted-foreground">Hech kim topilmadi.</li>}
              {results.map((p) => (
                <li key={p.id}>
                  <button onClick={() => open(p.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent">
                    <Avatar name={p.name} size={34} />
                    <span className="min-w-0"><span className="block truncate text-sm font-medium text-foreground">{p.name}</span><span className="block truncate text-[11px] text-muted-foreground">{p.university}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          ) : convos === null ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : convos.length === 0 ? (
            <EmptyState icon={MessageSquare} title="Hali xabarlar yo'q" text="Yuqoridan talabani qidirib, suhbat boshlang yoki savol-javob bo'limida “Xabar yozish” tugmasini bosing." />
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-border bg-card">
              {convos.map((c) => (
                <li key={c.user.id} className="border-b border-border last:border-0">
                  <button onClick={() => open(c.user.id)} className={cn("flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-accent", withId === c.user.id && "bg-accent")}>
                    <Avatar name={c.user.name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">{c.user.name}</span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{formatRelativeTime(c.last.created_at)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={cn("truncate text-xs", c.unread ? "font-medium text-foreground" : "text-muted-foreground")}>{c.last.mine ? "Siz: " : ""}{c.last.body}</span>
                        {c.unread > 0 && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white" aria-label={`${c.unread} ta o'qilmagan`}>{c.unread}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* ── Right: thread ── */}
        <section className={cn("flex min-h-[60vh] flex-col rounded-2xl border border-border bg-card", listVisible && "hidden md:flex")}>
          {!withId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">Suhbatni tanlang yoki yangisini boshlang.</div>
          ) : !thread ? (
            <div className="space-y-3 p-4">{error ? <FormError text={error} /> : [0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-border p-3">
                <button onClick={back} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent md:hidden" aria-label="Orqaga"><ArrowLeft size={18} /></button>
                <Avatar name={thread.user.name} size={36} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{thread.user.name}</p><p className="truncate text-[11px] text-muted-foreground">{thread.user.university}</p></div>
                <button onClick={toggleBlock} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                  {thread.blocked ? <><ShieldOff size={13} /> Blokdan chiqarish</> : <><Ban size={13} /> Bloklash</>}
                </button>
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: "55vh" }} aria-live="polite">
                {thread.messages.length === 0 && <p className="py-10 text-center text-xs text-muted-foreground">Birinchi xabarni yozing.</p>}
                {thread.messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", m.mine ? "bg-blue-600 text-white" : "bg-muted text-foreground")}>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", m.mine ? "text-blue-100" : "text-muted-foreground")}>
                        {formatRelativeTime(m.created_at)}
                        {m.mine && (m.read ? <><CheckCheck size={11} /> O&apos;qildi</> : <><Check size={11} /> Yuborildi</>)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottom} />
              </div>

              <footer className="border-t border-border p-3">
                {thread.blocked || thread.blocked_me ? (
                  <p className="text-center text-xs text-muted-foreground">{thread.blocked ? "Siz bu foydalanuvchini bloklagansiz." : "Bu foydalanuvchiga xabar yubora olmaysiz."}</p>
                ) : (
                  <>
                    <FormError text={error} />
                    <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
                      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Xabar yozing…" maxLength={1000} aria-label="Xabar" className={fieldCls} />
                      <Button type="submit" disabled={sending || !text.trim()} aria-label="Yuborish"><Send size={16} /></Button>
                    </form>
                    <div className="mt-2"><ReportBox onSend={async (reason) => (await api.post<{ message: string }>(`/messages/report/${thread.user.id}`, { reason })).data?.message ?? "Yuborib bo'lmadi."} /></div>
                  </>
                )}
              </footer>
            </>
          )}
        </section>
      </div>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">Hurmatli bo&apos;ling. Haqoratli yoki yoqimsiz xabarlarni <Link href="/terms" className="underline">shikoyat</Link> qiling.</p>
    </>
  );
}
