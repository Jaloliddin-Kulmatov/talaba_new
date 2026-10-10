"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles, ArrowRight, Users,
  GraduationCap, Globe, Pencil, X, Loader2, ExternalLink,
  Plus, LogOut, CheckCircle2, Calendar,
  Briefcase, MessageSquare, LayoutGrid,
} from "lucide-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import TodayOverview from "@/components/dashboard/today-overview";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("talaba_token") : null;
}
async function apiCall(method: string, path: string, body?: object) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "So'rov bajarilmadi");
  return data;
}

interface MyClub {
  id: number; name: string; description: string; category: string;
  university: string; club_type: string; region: string;
  meeting_time: string; location: string; contact: string;
  telegram_link: string; website: string; member_count: number;
}

const CLUB_CATEGORIES = ["academic", "sports", "culture", "social", "language", "tech", "arts", "volunteer"];

const quickLinks = [
  { href: "/tools",        icon: LayoutGrid,    label: "Asboblar",        tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { href: "/jobs",         icon: Briefcase,     label: "Ish va amaliyot", tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { href: "/chat",         icon: MessageSquare, label: "Chat",            tint: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  { href: "/community",    icon: Users,         label: "Klublar",         tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  { href: "/universities", icon: GraduationCap, label: "Universitetlar",  tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { href: "/support",      icon: Globe,         label: "Talaba hayoti",   tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const firstName = user?.name?.split(" ")[0] || "talaba";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Xayrli tong" : hour < 18 ? "Xayrli kun" : "Xayrli kech";

  // Force users without a complete profile (e.g. fresh Google sign-ups) to
  // finish onboarding before they can use the dashboard.
  useEffect(() => {
    if (authLoading || !user) return;
    const complete =
      !!(user.university || "").trim() &&
      !!(user.region || "").trim() &&
      !!(user.funding_type || "").trim();
    if (!complete) router.replace("/onboarding");
  }, [user, authLoading, router]);

  // ── My clubs state ─────────────────────────────────────────
  const [createdClubs, setCreatedClubs] = useState<MyClub[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<MyClub[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [editingClub, setEditingClub] = useState<MyClub | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", description: "", category: "", meeting_time: "",
    location: "", contact: "", telegram_link: "", website: "", region: "",
  });
  const [editBusy, setEditBusy] = useState(false);
  const [editMsg, setEditMsg] = useState("");

  const loadMyClubs = useCallback(async () => {
    try {
      const data = await apiCall("GET", "/clubs/mine");
      setCreatedClubs(data.created || []);
      setJoinedClubs(data.joined || []);
    } catch { /* ignore */ }
    finally { setClubsLoading(false); }
  }, []);

  useEffect(() => { if (user) loadMyClubs(); }, [user, loadMyClubs]);

  const openEdit = (club: MyClub) => {
    setEditingClub(club);
    setEditForm({
      name: club.name, description: club.description || "",
      category: club.category || "social",
      meeting_time: club.meeting_time || "", location: club.location || "",
      contact: club.contact || "", telegram_link: club.telegram_link || "",
      website: club.website || "", region: club.region || "",
    });
    setEditMsg("");
  };

  const handleSave = async () => {
    if (!editingClub) return;
    setEditBusy(true);
    try {
      await apiCall("PATCH", `/clubs/${editingClub.id}`, editForm);
      setEditMsg("Saqlandi!");
      loadMyClubs();
      setTimeout(() => { setEditingClub(null); setEditMsg(""); }, 800);
    } catch (err: unknown) {
      setEditMsg(err instanceof Error ? err.message : "Saqlab bo'lmadi");
    } finally { setEditBusy(false); }
  };

  const handleLeave = async (clubId: number) => {
    if (!confirm("Ushbu klub/hamjamiyatdan chiqmoqchimisiz?")) return;
    try {
      await apiCall("POST", `/clubs/${clubId}/leave`);
      loadMyClubs();
    } catch { /* ignore */ }
  };

  // Split by type
  const myUniversityClubs  = createdClubs.filter(c => c.club_type === "club");
  const myCommunities      = [
    ...createdClubs.filter(c => c.club_type === "community"),
    ...joinedClubs.filter(c => c.club_type === "community"),
  ];
  const myJoinedClubs      = joinedClubs.filter(c => c.club_type === "club");

  const mInputCls = "w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/60 transition-colors";

  return (
    <DashboardLayout>
      {/* Welcome header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{greeting}, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">TALABA-ga xush kelibsiz — universitetdagi hayotingiz uchun yo&apos;lboshchi.</p>
        </div>
        <Button variant="glass" size="sm" asChild className="gap-1.5 hidden sm:flex">
          <Link href="/dashboard/ai"><Sparkles size={14} className="text-violet-400" /> AI-dan so&apos;rash</Link>
        </Button>
      </div>

      <TodayOverview />

      {/* ── My Clubs & Communities + TALABA AI (side by side on desktop) ── */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clubs and Communities — separate sections, clubs first */}
        <div className="lg:col-span-2 space-y-6">
          {clubsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={18} className="animate-spin text-muted-foreground" />
            </div>
          ) : (createdClubs.length === 0 && joinedClubs.length === 0) ? (
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">Klublarim va hamjamiyatlarim</h2>
              <div className="p-6 rounded-2xl border border-dashed border-border text-center">
                <Users size={24} className="text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Siz hali hech qanday klub yoki hamjamiyatga qo&apos;shilmagansiz.</p>
                <Link href="/community" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Hamjamiyatlarni ko&apos;rish <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* ── 🎓 My Clubs ── */}
              {(myUniversityClubs.length > 0 || myJoinedClubs.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span>🎓</span> Klublarim
                      <span className="text-xs font-normal text-muted-foreground">
                        ({myUniversityClubs.length + myJoinedClubs.length})
                      </span>
                    </h2>
                    <Link href="/community" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      <Plus size={11} /> Ko&apos;rish
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myUniversityClubs.map(club => (
                      <ClubCard key={`c-${club.id}`} club={club} isOwner onEdit={() => openEdit(club)} />
                    ))}
                    {myJoinedClubs.map(club => (
                      <ClubCard key={`j-${club.id}`} club={club} isOwner={false} onLeave={() => handleLeave(club.id)} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── 🌍 My Communities ── */}
              {myCommunities.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span>🌍</span> Hamjamiyatlarim
                      <span className="text-xs font-normal text-muted-foreground">
                        ({myCommunities.length})
                      </span>
                    </h2>
                    <Link href="/community" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      <Plus size={11} /> Ko&apos;rish
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myCommunities.map(club => {
                      const isOwner = createdClubs.some(c => c.id === club.id);
                      return (
                        <ClubCard key={`cm-${club.id}`} club={club} isOwner={isOwner}
                          onEdit={isOwner ? () => openEdit(club) : undefined}
                          onLeave={!isOwner ? () => handleLeave(club.id) : undefined}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── TALABA AI card (prominent, sticky next to clubs) ── */}
        <aside className="lg:sticky lg:top-20 self-start">
          <Link
            href="/dashboard/ai"
            className="block rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-violet-500/10 to-purple-500/10 p-5 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">TALABA AI</p>
                <p className="text-[11px] text-emerald-500 leading-tight">Onlayn · zudlik bilan javob beradi</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              O&apos;zbekistondagi talaba hayoti haqida nimani bo&apos;lsa ham so&apos;rang — qabul, turargoh, stipendiya, ish. Javoblar 24/7 rejimda.
            </p>
            <div className="space-y-1.5">
              {[
                "Grant statusimni qanday tekshiraman?",
                "Talabalar turargohiga qanday joylashaman?",
                "Kampus yaqinidagi part-time ishlarni topish",
              ].map((q) => (
                <div key={q} className="flex items-center gap-2 text-[11px] text-foreground/80 bg-background/50 rounded-lg px-2.5 py-1.5 border border-border">
                  <Sparkles size={10} className="text-blue-600 shrink-0" />
                  <span className="truncate">{q}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-xs font-semibold group-hover:opacity-90 transition-opacity">
              Suhbatni boshlash <ArrowRight size={12} />
            </div>
          </Link>
        </aside>
      </div>

      {/* ── Quick actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {quickLinks.map(({ href, icon: Icon, label, tint }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card shadow-sm hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-card transition-all text-center"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
              <Icon size={19} />
            </span>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </Link>
        ))}
      </div>

      {/* ══════════ EDIT CLUB MODAL ══════════ */}
      {editingClub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm" onClick={() => setEditingClub(null)}>
          <div className="w-full max-w-lg bg-card text-card-foreground border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Pencil size={14} className="text-blue-400" />
                {editingClub.club_type === "community" ? "Hamjamiyatni tahrirlash" : "Klubni tahrirlash"}
              </h2>
              <button onClick={() => setEditingClub(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"><X size={15} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Nomi *</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className={mInputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Kategoriya</label>
                  <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} className={mInputCls}>
                    {CLUB_CATEGORIES.map(c => <option key={c} value={c} className="bg-background text-foreground">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                {editingClub.club_type === "community" && (
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Viloyat</label>
                    <input value={editForm.region} onChange={e => setEditForm(p => ({ ...p, region: e.target.value }))} placeholder="masalan, Samarqand viloyati" className={mInputCls} />
                  </div>
                )}
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Tavsif</label>
                <textarea rows={3} value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className={mInputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Uchrashuv vaqti</label>
                  <input value={editForm.meeting_time} onChange={e => setEditForm(p => ({ ...p, meeting_time: e.target.value }))} placeholder="masalan, Har chorshanba, 18:00" className={mInputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Manzil</label>
                  <input value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} placeholder="masalan, 304-xona" className={mInputCls} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Rasmiy veb-sayt</label>
                <input value={editForm.website} onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." className={mInputCls} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Telegram havolasi</label>
                <input value={editForm.telegram_link} onChange={e => setEditForm(p => ({ ...p, telegram_link: e.target.value }))} placeholder="https://t.me/..." className={mInputCls} />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Aloqa</label>
                <input value={editForm.contact} onChange={e => setEditForm(p => ({ ...p, contact: e.target.value }))} placeholder="email | telefon" className={mInputCls} />
              </div>

              {editMsg && (
                <p className={`text-xs text-center ${editMsg === "Saqlandi!" ? "text-emerald-400" : "text-red-400"}`}>{editMsg}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditingClub(null)} className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-accent transition-colors">Bekor qilish</button>
                <button onClick={handleSave} disabled={editBusy} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {editBusy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} O&apos;zgarishlarni saqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ── Club card component ────────────────────────────────────────
function ClubCard({ club, isOwner, onEdit, onLeave }: {
  club: MyClub;
  isOwner: boolean;
  onEdit?: () => void;
  onLeave?: () => void;
}) {
  const isCommunity = club.club_type === "community";
  const accentColor = isCommunity ? "text-violet-400" : "text-blue-400";
  const borderColor = isCommunity ? "border-violet-500/20" : "border-blue-500/20";
  const bgColor     = isCommunity ? "bg-violet-500/5"     : "bg-blue-500/5";

  return (
    <Link
      href={`/community/${club.id}`}
      className={`group p-4 rounded-2xl border ${borderColor} ${bgColor} flex flex-col gap-2.5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isCommunity ? "bg-violet-500/15 text-violet-400" : "bg-blue-500/15 text-blue-400"}`}>
              {isCommunity ? "Hamjamiyat" : "Klub"}
            </span>
            {isOwner && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400">Egasi</span>
            )}
          </div>
          <h3 className="text-sm font-bold text-foreground leading-tight truncate">{club.name}</h3>
          <p className="text-[11px] text-muted-foreground">{isCommunity && club.region ? club.region : club.university}</p>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isOwner && onEdit && (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} className={`p-1.5 rounded-lg ${accentColor} hover:bg-accent transition-all`} title="Tahrirlash">
              <Pencil size={12} />
            </button>
          )}
          {!isOwner && onLeave && (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLeave(); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-all" title="Chiqish">
              <LogOut size={12} />
            </button>
          )}
          {club.website && (
            <a href={club.website} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-400 hover:bg-accent transition-all" title="Veb-sayt">
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {club.description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{club.description}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground/70 mt-auto">
        {club.meeting_time && <span className="flex items-center gap-1"><Calendar size={9} />{club.meeting_time}</span>}
        {club.member_count > 0 && <span className="flex items-center gap-1"><Users size={9} />{club.member_count} a&apos;zo</span>}
        {club.location && <span className="flex items-center gap-1"><Globe size={9} />{club.location}</span>}
      </div>
    </Link>
  );
}
