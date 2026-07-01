"use client";

import React, { useState } from "react";
import { X, Loader2, CheckCircle2, Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { UNIVERSITIES, FUNDING_TYPES, REGIONS } from "@/lib/constants";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface Props { onClose: () => void; }

export default function AmbassadorModal({ onClose }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    university: user?.university || "",
    department: "",
    year: "",
    region: user?.region || "",
    funding_type: user?.funding_type || "",
    motivation: "",
    social: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const inputCls = "w-full bg-[#1a1a2e] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-blue-400/60 transition-colors [color-scheme:dark]";
  const labelCls = "text-xs font-medium text-white/55 mb-1.5 block";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("talaba_token") : null;
      if (!token) throw new Error("Elchi bo'lish uchun ariza berishdan oldin tizimga kiring.");
      const res = await fetch(`${API}/ambassador/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yuborib bo'lmadi");
      setEmailSent(!!data.email_sent);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0e0e1a] border border-white/12 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
              <Star size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Elchi bo'lishga ariza</h2>
              <p className="text-[11px] text-white/45">Universitetingizni TALABA'da vakillik qiling</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Ariza yuborildi! 🎉</h3>
            <p className="text-sm text-white/60 mb-1">Arizangiz TALABA jamoasi tomonidan qabul qilindi.</p>
            {emailSent ? (
              <p className="text-xs text-emerald-400 mb-6">
                ✅ Tasdiqlash xati <strong>{form.email}</strong> manziliga yuborildi
              </p>
            ) : (
              <p className="text-xs text-white/35 mb-6">
                Uni ko'rib chiqib, bir necha kun ichida javob beramiz.
              </p>
            )}
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              Yopish
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>To'liq ism *</label>
                <input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input required type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Universitet *</label>
              <select required value={form.university} onChange={e => setForm(p => ({...p, university: e.target.value}))} className={inputCls + " [color-scheme:dark]"}>
                {UNIVERSITIES.map(u => <option key={u.id} value={u.shortName} className="bg-[#1a1a2e] text-white">{u.shortName} — {u.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Yo'nalish / Mutaxassislik</label>
                <input value={form.department} onChange={e => setForm(p => ({...p, department: e.target.value}))} placeholder="masalan, Kompyuter fanlari" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Kurs</label>
                <select value={form.year} onChange={e => setForm(p => ({...p, year: e.target.value}))} className={inputCls + " [color-scheme:dark]"}>
                  <option value="" className="bg-[#1a1a2e]">Tanlang</option>
                  {["1-kurs","2-kurs","3-kurs","4-kurs","Magistratura","Doktorantura"].map(y => <option key={y} value={y} className="bg-[#1a1a2e] text-white">{y}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Viloyat</label>
                <select value={form.region} onChange={e => setForm(p => ({...p, region: e.target.value}))} className={inputCls + " [color-scheme:dark]"}>
                  <option value="" className="bg-[#1a1a2e]">Tanlang</option>
                  {REGIONS.map(r => <option key={r.code} value={r.name} className="bg-[#1a1a2e] text-white">{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Ta'lim shakli</label>
                <select value={form.funding_type} onChange={e => setForm(p => ({...p, funding_type: e.target.value}))} className={inputCls + " [color-scheme:dark]"}>
                  <option value="" className="bg-[#1a1a2e]">Tanlang</option>
                  {FUNDING_TYPES.map(v => <option key={v.code} value={v.code} className="bg-[#1a1a2e] text-white">{v.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Telegram username / Instagram / Kontakt</label>
              <input value={form.social} onChange={e => setForm(p => ({...p, social: e.target.value}))} placeholder="masalan, Telegram: @your_id" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Nima uchun TALABA elchisi bo'lishni xohlaysiz? *</label>
              <textarea
                required
                value={form.motivation}
                onChange={e => setForm(p => ({...p, motivation: e.target.value}))}
                rows={4}
                placeholder="O'zingiz, talabalik tajribangiz va nega yaxshi elchi bo'la olishingiz haqida yozing..."
                className={inputCls}
              />
            </div>

            {error && <p className="text-xs text-red-400 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">{error}</p>}
            <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Star size={15} />}
              Arizani yuborish
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
