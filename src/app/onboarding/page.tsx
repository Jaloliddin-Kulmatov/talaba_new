"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Globe, FileText, ArrowRight, Loader2, CheckCircle2, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { UNIVERSITIES, FUNDING_TYPES, REGIONS } from "@/lib/constants";
import { api } from "@/lib/api";

/**
 * /onboarding — forced profile completion for users who signed up via
 * Google (and therefore skipped the email/password registration form).
 *
 * Required: university, region, funding_type. Until all three are saved
 * the user cannot leave the page (the navbar is intentionally absent).
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser, logout } = useAuth();

  const [step, setStep] = useState<0 | 1>(0); // 0 = university, 1 = region + funding type
  const [form, setForm] = useState({ university: "", region: "", funding_type: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Guard the route ────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    // Pre-fill anything that already exists (in case user came back to /onboarding)
    setForm({
      university: user.university || "",
      region: user.region || "",
      funding_type: user.funding_type || "",
    });
    // If the user actually already has everything, skip the page.
    if ((user.university || "").trim() && (user.region || "").trim() && (user.funding_type || "").trim()) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const isValidUniversity = !!form.university.trim();
  const isValidProfile    = !!form.region.trim() && !!form.funding_type.trim();

  const handleNext = () => {
    setError("");
    if (!isValidUniversity) {
      setError("Iltimos, universitetingizni tanlang.");
      return;
    }
    setStep(1);
  };

  const handleFinish = async () => {
    setError("");
    if (!isValidUniversity) { setStep(0); setError("Iltimos, universitetingizni tanlang."); return; }
    if (!isValidProfile)    { setError("Iltimos, viloyat va ta'lim shaklingizni tanlang."); return; }

    setSaving(true);
    const { error: apiError } = await api.patch<{ user: unknown }>("/auth/me", {
      university: form.university.trim(),
      region: form.region.trim(),
      funding_type: form.funding_type.trim(),
    });
    setSaving(false);
    if (apiError) {
      setError(apiError);
      return;
    }
    await refreshUser();
    router.replace("/dashboard");
  };

  // Loading auth context
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        {/* Brand row + sign-out escape hatch */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">TA</span>
            </div>
            <span className="text-xl font-bold text-foreground">TALABA<span className="text-blue-600">.</span></span>
          </Link>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Chiqish"
          >
            <LogOut size={13} /> Chiqish
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-7">
          <h1 className="text-2xl font-bold text-foreground mb-1.5">
            Xush kelibsiz, {user.name?.split(" ")[0] || "talaba"} 👋
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Sizni to&apos;g&apos;ri klublar, ish o&apos;rinlari va vaziyatingizga mos ma&apos;lumotlar bilan
            bog&apos;lash uchun yana bir nechta tafsilot kerak.
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i <= step ? "bg-blue-600" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* ── Step 0: University ── */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <GraduationCap size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-bold text-foreground">Universitetingiz</h2>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Universitet *</label>
                <select
                  value={form.university}
                  onChange={(e) => setForm((p) => ({ ...p, university: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  required
                >
                  <option value="">Universitetingizni tanlang…</option>
                  {UNIVERSITIES.map((u) => (
                    <option key={u.id} value={u.name}>{u.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Ro&apos;yxatda yo&apos;qmi? Eng yaqinini tanlang — buni keyinroq Sozlamalarda o&apos;zgartirishingiz mumkin.
                </p>
              </div>

              <button
                onClick={handleNext}
                disabled={!isValidUniversity}
                className="w-full h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                Keyingisi <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* ── Step 1: Region + Funding type ── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <Globe size={15} className="text-violet-500" />
                </div>
                <h2 className="text-sm font-bold text-foreground">O&apos;zingiz haqingizda</h2>
              </div>

              {/* Region */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Viloyat *</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm((p) => ({ ...p, region: e.target.value }))}
                  className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  required
                >
                  <option value="">Viloyatingizni tanlang…</option>
                  {REGIONS.map((r) => (
                    <option key={r.code} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Funding type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <FileText size={11} /> Ta&apos;lim shakli *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FUNDING_TYPES.map((v) => (
                    <button
                      key={v.code}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, funding_type: v.code }))}
                      className={`h-10 rounded-xl border text-xs font-semibold transition-all ${
                        form.funding_type === v.code
                          ? "border-blue-600 bg-blue-500/10 text-blue-600"
                          : "border-border bg-background text-muted-foreground hover:border-blue-500/40 hover:text-foreground"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Grant = davlat homiyligidagi o&apos;qish. Kontrakt = pullik ta&apos;lim.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 h-11 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  Orqaga
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={!isValidProfile || saving}
                  className="flex-1 h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><Loader2 size={14} className="animate-spin" /> Saqlanmoqda…</>
                  ) : (
                    <><CheckCircle2 size={14} /> Yakunlash</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-5">
          Bu ma&apos;lumotlarni istalgan vaqtda Sozlamalarda yangilashingiz mumkin.
        </p>
      </div>
    </div>
  );
}
