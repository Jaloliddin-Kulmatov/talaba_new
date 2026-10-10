"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellOff, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  CLASS_MIN_CHOICES, DEFAULT_PREFS, currentSubscription, disablePush, enablePush, isIOS, isStandalone,
  pushSupported, savePrefs, sendTest, serverStatus, type ReminderPrefs,
} from "@/lib/push";
import { FormError, Panel, fieldCls } from "./ui";

type State =
  | { kind: "loading" }
  | { kind: "unsupported" }
  | { kind: "needs-install" }
  | { kind: "denied" }
  | { kind: "off" }
  | { kind: "on"; endpoint: string; prefs: ReminderPrefs };

export default function ReminderCard() {
  const { user, loading } = useAuth();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    // iOS only exposes push to home-screen apps, so check that first (Safari tabs have no PushManager at all)
    if (isIOS() && !isStandalone()) return setState({ kind: "needs-install" });
    if (!pushSupported()) return setState({ kind: "unsupported" });
    if (Notification.permission === "denied") return setState({ kind: "denied" });
    const sub = await currentSubscription();
    if (!sub) return setState({ kind: "off" });
    const st = await serverStatus(sub.endpoint);
    if (st.data?.subscribed) return setState({ kind: "on", endpoint: sub.endpoint, prefs: st.data.prefs ?? DEFAULT_PREFS });
    setState({ kind: "off" });
  }, []);

  useEffect(() => { if (user) void refresh(); }, [user, refresh]);

  if (loading) return null;

  const shell = (icon: React.ReactNode, title: string, body: React.ReactNode, action?: React.ReactNode) => (
    <Panel className="mt-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">{icon}</span>
          <div className="max-w-xl">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <div className="mt-0.5 text-sm text-muted-foreground">{body}</div>
          </div>
        </div>
        {action}
      </div>
    </Panel>
  );

  if (!user) {
    return shell(<BellOff size={18} />, "Dars va imtihon eslatmalari", "Dars boshlanishidan oldin, imtihon arafasida va vazifa muddati kuni telefoningizga eslatma yuboramiz. Buning uchun hisobga kiring.",
      <Button asChild><Link href="/login?force=1">Kirish</Link></Button>);
  }
  if (state.kind === "loading") return null;
  if (state.kind === "unsupported") return shell(<BellOff size={18} />, "Eslatmalar", "Bu brauzer bildirishnomalarni qo'llab-quvvatlamaydi. Chrome, Edge, Firefox yoki Safari (Bosh ekranga qo'shilgan ilova) dan foydalaning.");
  if (state.kind === "needs-install") return shell(<BellOff size={18} />, "Eslatmalar", "iPhone/iPad'da eslatmalar faqat Bosh ekranga qo'shilgan ilovada ishlaydi: «Ulashish» → «Bosh ekranga qo'shish», keyin ilovani shu yerdan oching.");
  if (state.kind === "denied") return shell(<BellOff size={18} />, "Eslatmalar bloklangan", "Brauzer sozlamalarida TALABA uchun bildirishnomalarga ruxsat bering, so'ng sahifani yangilang.");

  const turnOn = async () => {
    setBusy(true); setError(null); setNote(null);
    const r = await enablePush(DEFAULT_PREFS);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    await refresh();
    setNote("Eslatmalar yoqildi. Sinov eslatmasini yuborib ko'ring.");
  };

  if (state.kind === "off") {
    return shell(<BellRing size={18} />, "Dars va imtihon eslatmalari",
      <>Dars boshlanishidan oldin, imtihon arafasida va vazifa muddati kuni telefoningizga eslatma keladi — ilova yopiq bo&apos;lsa ham. Jadvalingiz hisobingiz bilan sinxronlanadi.<FormError text={error} /></>,
      <Button onClick={turnOn} disabled={busy}>{busy ? <Loader2 size={15} className="mr-2 animate-spin" /> : <BellRing size={15} className="mr-2" />} Eslatmalarni yoqish</Button>);
  }

  const { endpoint, prefs } = state;
  const update = async (p: Partial<ReminderPrefs>) => {
    setState({ kind: "on", endpoint, prefs: { ...prefs, ...p } });
    const r = await savePrefs(endpoint, p);
    if (r.error) { setError(r.error); void refresh(); }
  };

  return shell(<BellRing size={18} />, "Eslatmalar yoqilgan",
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          Darsdan
          <select value={prefs.classMin} onChange={(e) => update({ classMin: Number(e.target.value) })} className={`${fieldCls} h-8 w-24 py-0 text-xs`} aria-label="Dars eslatmasi vaqti">
            {CLASS_MIN_CHOICES.map((m) => <option key={m} value={m}>{m} daqiqa</option>)}
          </select>
          oldin
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={prefs.exams} onChange={(e) => update({ exams: e.target.checked })} className="h-4 w-4 accent-blue-600" /> Imtihonlar</label>
        <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={prefs.tasks} onChange={(e) => update({ tasks: e.target.checked })} className="h-4 w-4 accent-blue-600" /> Vazifalar (har ertalab)</label>
      </div>
      {note && <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{note}</p>}
      <FormError text={error} />
    </div>,
    <div className="flex gap-2">
      <Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); setError(null); const r = await sendTest(endpoint); setBusy(false); r.error ? setError(r.error) : setNote("Sinov eslatmasi yuborildi."); if (r.status === 410) void refresh(); }}>Sinov</Button>
      <Button variant="ghost" disabled={busy} onClick={async () => { setBusy(true); await disablePush(); setBusy(false); setNote(null); await refresh(); }}>O&apos;chirish</Button>
    </div>);
}
