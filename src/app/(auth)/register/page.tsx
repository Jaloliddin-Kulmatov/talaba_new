"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { UNIVERSITIES, FUNDING_TYPES, REGIONS } from "@/lib/constants";
import GoogleSignInButton, { GOOGLE_AUTH_ENABLED } from "@/components/auth/google-signin-button";

const steps = [
  { label: "Hisob", hint: "Kirish ma'lumotlaringiz" },
  { label: "Universitet", hint: "Qayerda o'qiysiz" },
  { label: "Profil", hint: "O'zingiz haqingizda" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "invalid" | "ok">("idle");
  const [emailMessage, setEmailMessage] = useState("");

  const handleGoogleSuccess = async (accessToken: string) => {
    setError("");
    const result = await loginWithGoogle(accessToken, "register");
    if ("error" in result) {
      const err = result.error;
      const alreadyExists =
        err.code === "ACCOUNT_EXISTS" ||
        err.status === 409 ||
        (err.message || "").toLowerCase().includes("allaqachon mavjud") ||
        (err.message || "").toLowerCase().includes("tizimga kiring");
      if (alreadyExists) {
        setError("Sizda allaqachon hisob bor — tizimga kirish sahifasiga yo'naltirilmoqda…");
        setTimeout(() => router.push("/login?force=1&exists=1"), 1500);
        return;
      }
      setError(err.message || "Google orqali ro'yxatdan o'tishda xatolik yuz berdi.");
      return;
    }
    // Brand-new Google account → onboarding to fill in university / funding type / region.
    // (Even if profile_complete were somehow true here, we still want them to confirm.)
    router.push(result.ok.profileComplete ? "/dashboard" : "/onboarding");
  };
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    university: "", funding_type: "", region: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const checkEmail = async (email: string): Promise<boolean> => {
    if (!isValidEmail(email)) return false;
    setEmailStatus("checking");
    setEmailMessage("");
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const res = await fetch(`${BASE}/auth/check-email?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (!json.valid) {
        setEmailStatus("invalid");
        setEmailMessage(json.message || "Bu email manzili yaroqsiz.");
        return false;
      }
      setEmailStatus("ok");
      setEmailMessage("");
      return true;
    } catch {
      setEmailStatus("idle");
      return true; // fail open
    }
  };

  const canNext = () => {
    if (step === 0) return form.name.trim() && isValidEmail(form.email) && form.password.length >= 6 && emailStatus !== "invalid" && emailStatus !== "checking";
    if (step === 1) return !!form.university;
    return true;
  };

  const handleNext = async () => {
    setError("");
    if (step === 0) {
      if (!form.name.trim()) { setError("Iltimos, to'liq ismingizni kiriting."); return; }
      if (!isValidEmail(form.email)) { setError("Iltimos, haqiqiy email manzil kiriting (masalan, siz@gmail.com)."); return; }
      if (emailStatus === "checking") { setError("Email tekshirilayotgan paytda kuting."); return; }
      if (emailStatus === "invalid") { setError(emailMessage || "Bu email manzili yaroqsiz."); return; }
      if (form.password.length < 6) { setError("Parol kamida 6 belgidan iborat bo'lishi kerak."); return; }
      // If user skipped the blur, check now
      if (emailStatus === "idle") {
        const ok = await checkEmail(form.email);
        if (!ok) return;
      }
      setStep(1); return;
    }
    if (step === 1) {
      if (!form.university) { setError("Iltimos, universitetingizni tanlang."); return; }
      setStep(2); return;
    }
    setLoading(true);
    const err = await register(form);
    setLoading(false);
    if (err) {
      // If the account already exists, send them to sign-in with a friendly
      // notice + their email prefilled instead of showing a dead-end error.
      if (err.toLowerCase().includes("allaqachon mavjud")) {
        setError("Sizda allaqachon hisob bor — tizimga kirish sahifasiga yo'naltirilmoqda…");
        setTimeout(
          () => router.push(`/login?force=1&exists=1&email=${encodeURIComponent(form.email)}`),
          1200
        );
        return;
      }
      setError(err);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 mesh-gradient dot-grid">
      <div className="fixed top-1/3 right-1/4 w-72 h-72 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-sm">TA</span>
            </div>
            <span className="text-xl font-bold text-foreground">TALABA<span className="text-blue-600">.</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-5 mb-0.5">Hisob yaratish</h1>
          <p className="text-sm text-muted-foreground">{steps[step].hint}</p>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {steps.map((s, i) => (
            <React.Fragment key={s.label}>
              <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                i === step ? "text-blue-600" : i < step ? "text-emerald-500" : "text-muted-foreground"
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${
                  i < step
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
                    : i === step
                    ? "bg-blue-500/15 border-blue-500/30 text-blue-600"
                    : "bg-muted border-border text-muted-foreground"
                }`}>
                  {i < step ? <CheckCircle2 size={11} /> : i + 1}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px max-w-8 ${i < step ? "bg-emerald-500/40" : "bg-border"}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="glass-card p-7">
          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 animate-fade-in">
              {error}
            </div>
          )}

          {/* Step 0 — Account */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              {/* Google OAuth — only when configured */}
              {GOOGLE_AUTH_ENABLED && (
                <>
                  <GoogleSignInButton
                    onSuccess={handleGoogleSuccess}
                    onError={setError}
                    loading={googleLoading}
                    setLoading={setGoogleLoading}
                    disabled={loading}
                  />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-3 bg-card text-xs text-muted-foreground">yoki email bilan ro&apos;yxatdan o&apos;ting</span>
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">To&apos;liq ism</label>
                <Input placeholder="To'liq ismingiz" value={form.name} onChange={(e) => set("name", e.target.value)} icon={<User size={14} />} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email manzil</label>
                <Input
                  type="email"
                  placeholder="siz@gmail.com"
                  value={form.email}
                  onChange={(e) => { set("email", e.target.value); setError(""); setEmailStatus("idle"); setEmailMessage(""); }}
                  onBlur={(e) => checkEmail(e.target.value)}
                  icon={<Mail size={14} />}
                />
                {form.email && !isValidEmail(form.email) && (
                  <p className="text-[11px] text-red-400 pl-1">Haqiqiy email kiriting (masalan, siz@gmail.com)</p>
                )}
                {emailStatus === "checking" && (
                  <p className="text-[11px] text-muted-foreground pl-1">Email tekshirilmoqda…</p>
                )}
                {emailStatus === "invalid" && (
                  <p className="text-[11px] text-red-400 pl-1">
                    {emailMessage}
                    {emailMessage?.toLowerCase().includes("allaqachon mavjud") && (
                      <> <button type="button" className="underline font-semibold" onClick={() => router.push(`/login?force=1&exists=1&email=${encodeURIComponent(form.email)}`)}>Tizimga kiring</button></>
                    )}
                  </p>
                )}
                {emailStatus === "ok" && (
                  <p className="text-[11px] text-emerald-500 pl-1">Bu email band emas</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Parol</label>
                <Input type="password" placeholder="Kamida 6 belgi" value={form.password} onChange={(e) => set("password", e.target.value)} icon={<Lock size={14} />} />
              </div>
            </div>
          )}

          {/* Step 1 — University */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">Universitetingiz</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                  {UNIVERSITIES.map((u) => (
                    <button key={u.id} type="button" onClick={() => set("university", u.id)}
                      className={`p-3 rounded-xl border text-left transition-all text-xs ${
                        form.university === u.id
                          ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "border-border hover:border-border-medium hover:bg-accent text-muted-foreground hover:text-foreground"
                      }`}>
                      <div className="font-semibold mb-0.5">{u.shortName}</div>
                      <div className="text-[10px] opacity-70 truncate">{u.name}</div>
                    </button>
                  ))}
                  <button type="button" onClick={() => set("university", "other")}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      form.university === "other"
                        ? "border-blue-500/50 bg-blue-500/10 text-blue-600"
                        : "border-dashed border-border text-muted-foreground hover:border-border-medium"
                    }`}>
                    <div className="font-semibold">Boshqa</div>
                    <div className="text-[10px] opacity-60">Ro&apos;yxatda yo&apos;q</div>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">Ta&apos;lim shakli</label>
                <div className="grid grid-cols-3 gap-2">
                  {FUNDING_TYPES.map((v) => (
                    <button key={v.code} type="button" onClick={() => set("funding_type", v.code)}
                      className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                        form.funding_type === v.code
                          ? "border-blue-500/50 bg-blue-500/10 text-blue-600"
                          : "border-border text-muted-foreground hover:border-border-medium hover:text-foreground"
                      }`}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Profile */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-medium text-foreground block mb-2">Qaysi viloyatdansiz</label>
                <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto scrollbar-thin pr-1">
                  {REGIONS.map((r) => (
                    <button
                      key={r.code}
                      type="button"
                      onClick={() => set("region", r.name)}
                      className={`flex items-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-medium transition-all ${
                        form.region === r.name
                          ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "border-border text-muted-foreground hover:border-border-medium hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      <span className="truncate">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 space-y-2">
                <p className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Hammasi tayyor!
                </p>
                {[
                  "Hamjamiyatga kirish — darhol",
                  "Ish e'lonlari — doim bepul",
                  "AI yordamchi — bepul kiritilgan",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-6">
            {step > 0 && (
              <Button variant="outline" size="lg" className="gap-1" onClick={() => setStep(step - 1)}>
                <ChevronLeft size={14} />
              </Button>
            )}
            <Button size="lg" className="flex-1 gap-2" onClick={handleNext} disabled={!canNext() || loading}>
              {loading
                ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
                : step < 2 ? <>Davom etish <ArrowRight size={14} /></>
                : <>Hisob yaratish <ArrowRight size={14} /></>
              }
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Hisobingiz bormi?{" "}
          <Link href="/login?force=1" className="text-blue-600 hover:text-blue-500 font-medium">Kirish</Link>
        </p>
      </div>
    </div>
  );
}
