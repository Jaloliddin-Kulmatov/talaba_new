"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Cloud, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { SYNC_STATE_KEY, useLocalStore } from "@/lib/store";
import { syncNow, type SyncState } from "@/lib/sync";
import { timeAgoUz } from "@/lib/toolkit/time";
import { useNow } from "@/lib/toolkit/hooks";
import { Panel } from "./ui";

const EMPTY: SyncState = {};
const LABEL: Record<string, string> = {
  "talaba:timetable:v1": "dars jadvali", "talaba:gpa:v1": "GPA", "talaba:planner:v1": "vazifalar",
  "talaba:focus:v1": "fokus tarixi", "talaba:attendance:v1": "davomat", "talaba:skills:v1": "ko'nikmalar", "talaba:cv:v1": "CV",
};

export default function SyncCard() {
  const { user, loading } = useAuth();
  const [state] = useLocalStore(SYNC_STATE_KEY, EMPTY);
  const [busy, setBusy] = useState(false);
  const now = useNow(30_000);

  if (loading) return null;

  if (!user) {
    return (
      <Panel className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground"><CloudOff size={18} /></span>
            <div className="max-w-xl">
              <h2 className="text-base font-semibold text-foreground">Qurilmalar o&apos;rtasida sinxronlash</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Hisobga kirsangiz, jadval, GPA, vazifalar va davomat telefon, noutbuk va boshqa qurilmalaringizda avtomatik bir xil bo&apos;ladi.
              </p>
            </div>
          </div>
          <Button asChild><Link href="/login?force=1">Kirish</Link></Button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><Cloud size={18} /></span>
          <div className="max-w-xl">
            <h2 className="text-base font-semibold text-foreground">Sinxronlash yoqilgan</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {state.error ? (
                <span className="text-red-600 dark:text-red-400">{state.error}</span>
              ) : state.lastSyncedAt ? (
                <>Oxirgi sinxronlash: {now ? timeAgoUz(state.lastSyncedAt, now) : "…"}. O&apos;zgarishlar avtomatik saqlanadi.</>
              ) : (
                "Birinchi sinxronlash kutilmoqda…"
              )}
            </p>
            {state.replaced && state.replaced.length > 0 && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                Bulutdagi yangiroq nusxa ({state.replaced.map((k) => LABEL[k] ?? k).join(", ")}) qurilmadagisining o&apos;rniga olindi.
                Eski nusxa zaxirada saqlangan.
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Ikki qurilmada bir vaqtda o&apos;zgartirsangiz, har bir bo&apos;lim bo&apos;yicha oxirgi o&apos;zgarish saqlanadi.</p>
          </div>
        </div>
        <Button
          variant="outline"
          disabled={busy}
          onClick={async () => { setBusy(true); try { await syncNow(); } finally { setBusy(false); } }}
        >
          {busy ? <Loader2 size={15} className="mr-2 animate-spin" /> : <RefreshCw size={15} className="mr-2" />} Hozir sinxronlash
        </Button>
      </div>
    </Panel>
  );
}
