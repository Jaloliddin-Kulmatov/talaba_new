"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/config";
import { api } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { FormError } from "./ui";

interface CvMeta { filename: string; size: number; updated_at: string }
const token = () => (typeof window !== "undefined" ? localStorage.getItem("talaba_token") : null);
const MB = 1024 * 1024;

/** Keep one ready-made CV (PDF or Word, up to 2 MB) on the account, e.g. to attach to job applications. Only its owner can read it. */
export default function CvUploadCard() {
  const [cv, setCv] = useState<CvMeta | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const r = await api.get<{ cv: CvMeta | null }>("/cv");
    setCv(r.data ? r.data.cv : null);
  }, []);
  useEffect(() => { load(); }, [load]);

  const upload = async (file: File) => {
    setError(null);
    if (file.size > 2 * MB) { setError("Fayl juda katta (ko'pi bilan 2 MB)."); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/cv`, { method: "PUT", headers: { Authorization: `Bearer ${token()}` }, body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setError(j.error || "Yuklab bo'lmadi.");
      else setCv(j.cv);
    } catch { setError("Serverga ulanib bo'lmadi."); }
    setBusy(false);
    if (input.current) input.current.value = "";
  };

  const download = async () => {
    const res = await fetch(`${API_BASE}/cv/download`, { headers: { Authorization: `Bearer ${token()}` } });
    if (!res.ok || !cv) { setError("Yuklab olib bo'lmadi."); return; }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url; a.download = cv.filename; a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async () => {
    if (!confirm("Yuklangan CV o'chirilsinmi?")) return;
    const r = await api.delete("/cv");
    if (!r.error) setCv(null); else setError(r.error);
  };

  return (
    <section className="mb-5 rounded-2xl border border-border bg-card p-4 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><FileText size={18} /></div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Tayyor CV faylingiz</p>
            <p className="truncate text-xs text-muted-foreground">
              {cv === undefined ? "Yuklanmoqda…" : cv ? `${cv.filename} · ${(cv.size / 1024).toFixed(0)} KB · ${formatRelativeTime(cv.updated_at)}` : "PDF yoki Word (.docx), 2 MB gacha. Faqat siz ko'ra olasiz."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input ref={input} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" aria-label="CV faylini tanlash" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {cv && <Button variant="outline" size="sm" onClick={download}><Download size={14} className="mr-1.5" /> Yuklab olish</Button>}
          <Button size="sm" disabled={busy || cv === undefined} onClick={() => input.current?.click()}><Upload size={14} className="mr-1.5" /> {cv ? "Almashtirish" : "Yuklash"}</Button>
          {cv && <button onClick={remove} aria-label="CV'ni o'chirish" className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600"><Trash2 size={15} /></button>}
        </div>
      </div>
      <FormError text={error} />
    </section>
  );
}
