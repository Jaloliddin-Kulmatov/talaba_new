"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";
import { UNIVERSITIES } from "@/lib/constants";
import {
  MessageSquare, Plus, ImageIcon, X, Loader2, Sparkles,
  AlertCircle, ShieldCheck, ArrowRight, Search, MapPin,
  Globe2, GraduationCap,
  CheckCircle2,
} from "lucide-react";


import { API_BASE as API } from "@/lib/config";
interface ChatPost {
  id: number;
  user_id: number;
  author_name: string;
  author_university: string;
  author_region: string;
  title: string;
  content: string;
  image_url: string;
  // "" = global (Butun O'zbekiston). A university token (e.g. "nuu") = visible
  // only inside that university's chat, never in the global feed.
  scope: string;
  answer_count: number;
  solved?: boolean;
  created_at: string;
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("talaba_token") : null;
}

// Resize a File to a max width of 1024px and return a base64 data URL
// (under ~450KB so it fits inside our backend's 600KB limit).
async function fileToCompressedDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Yaroqli rasm emas"));
      img.onload = () => {
        const maxW = 1024;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas mavjud emas"));
        ctx.drawImage(img, 0, 0, w, h);
        // Try 0.8 quality; bump down if too big
        let q = 0.8;
        let out = canvas.toDataURL("image/jpeg", q);
        while (out.length > 450_000 && q > 0.3) {
          q -= 0.1;
          out = canvas.toDataURL("image/jpeg", q);
        }
        resolve(out);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ChatPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ChatPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  // Two-tab view: "all" shows every question, "uni" filters to questions
  // from students at the user's university (e.g. "NUU Chat"). Defaults to
  // "all" when the user has no university or isn't signed in.
  const [tab, setTab] = useState<"all" | "uni">("all");
  const [unansweredOnly, setUnansweredOnly] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Send the token so the server can include posts scoped to the user's
      // own university (scoped posts are no longer returned to anonymous calls).
      const token = getToken();
      const res = await fetch(`${API}/chat/posts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setPosts(data.posts || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Resolve the signed-in user's university to a region (city + viloyat +
  // university name variants). Used to surface posts from your area first —
  // NUU students see Toshkent questions before random Samarqand ones.
  const myRegion = useMemo(() => {
    const raw = (user?.university || "").trim();
    if (!raw) return null;
    const lc = raw.toLowerCase();
    const uni = UNIVERSITIES.find(
      (u) =>
        u.id.toLowerCase() === lc ||
        u.shortName.toLowerCase() === lc ||
        u.name.toLowerCase() === lc
    );
    if (!uni) return null;
    return {
      uniLabel: uni.shortName,
      uniTokens: [uni.id, uni.shortName, uni.name]
        .filter(Boolean).map((s) => s.toLowerCase()),
      cityTokens: [uni.city].filter(Boolean).map((s) => s.toLowerCase()),
      regionTokens: [uni.region].filter(Boolean).map((s) => s.toLowerCase()),
    };
  }, [user?.university]);

  // "Near you" badge: posts that mention your university / city / region.
  const rankPost = useCallback((p: ChatPost): number => {
    if (!myRegion) return 0;
    const hay = `${p.title} ${p.content} ${p.author_university} ${p.author_region}`.toLowerCase();
    let score = 0;
    if (myRegion.uniTokens.some((t) => hay.includes(t))) score += 3;
    if (myRegion.cityTokens.some((t) => hay.includes(t))) score += 2;
    if (myRegion.regionTokens.some((t) => hay.includes(t))) score += 1;
    return score;
  }, [myRegion]);

  // True when a post's scope targets *my* university.
  const scopeMatchesMyUni = useCallback((scope: string): boolean => {
    if (!myRegion) return false;
    const s = (scope || "").toLowerCase().trim();
    if (!s) return false;
    return myRegion.uniTokens.some((t) => s === t || s.includes(t) || t.includes(s));
  }, [myRegion]);

  // Global feed: posts with no scope (backend returns newest-first).
  const globalPosts = useMemo(
    () => posts.filter((p) => !(p.scope || "").trim()),
    [posts]
  );

  // My university chat: posts scoped to my university.
  const uniPosts = useMemo(
    () => (myRegion ? posts.filter((p) => scopeMatchesMyUni(p.scope)) : []),
    [posts, myRegion, scopeMatchesMyUni]
  );

  // Pick the feed for the active tab, then sort:
  //   • top 3 newest first (backend already returns newest-first, so just slice)
  //   • remaining posts sorted by most answers desc, ties break by newest
  // When a search is active just filter without reordering.
  const tabFilteredPosts = tab === "uni" && myRegion ? uniPosts : globalPosts;

  const visiblePosts = useMemo(() => {
    const pool = unansweredOnly ? tabFilteredPosts.filter(p => p.answer_count === 0) : tabFilteredPosts;
    const base = !search
      ? pool
      : pool.filter(p =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.content.toLowerCase().includes(search.toLowerCase())
        );

    if (search) return base;

    // Top 3 newest (backend order)
    const latest = base.slice(0, 3);
    const latestIds = new Set(latest.map(p => p.id));

    // Rest: most answered first, then newest
    const rest = base
      .filter(p => !latestIds.has(p.id))
      .sort((a, b) =>
        b.answer_count - a.answer_count ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    return [...latest, ...rest];
  }, [tabFilteredPosts, search, unansweredOnly]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-10">
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-b from-blue-500/5 to-transparent">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
            <Badge variant="default" className="mb-3 text-xs px-3 py-1 gap-1.5">
              <Sparkles size={11} className="text-violet-500 dark:text-violet-400" /> Hamjamiyat savol-javobi
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">
              Hamjamiyatdan so'rang
            </h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Biror narsada qiynalyapsizmi? Savol bering — shu yo'lni bosib o'tgan
              talabalar o'z tajribasini ulashadi.
            </p>

            {myRegion && tab === "uni" && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                <GraduationCap size={11} />
                Faqat {myRegion.uniLabel} talabalari uchun — bu savollar umumiy bo'limda ko'rsatilmaydi
              </div>
            )}

            {/* Tabs — only render when the user belongs to a recognised
                university. Tabs let you switch between the global feed and
                a uni-only feed (e.g. "NUU Chat"). */}
            {myRegion && (
              <div className="mt-5 inline-flex items-center gap-1 p-1 rounded-xl border border-border bg-card">
                <button
                  onClick={() => setTab("all")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    tab === "all"
                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Globe2 size={12} />
                  Butun O'zbekiston
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                    tab === "all" ? "bg-blue-500/20" : "bg-muted"
                  }`}>{globalPosts.length}</span>
                </button>
                <button
                  onClick={() => setTab("uni")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    tab === "uni"
                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <GraduationCap size={12} />
                  {myRegion.uniLabel} Chat
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                    tab === "uni" ? "bg-blue-500/20" : "bg-muted"
                  }`}>{uniPosts.length}</span>
                </button>
              </div>
            )}

            <div className="mt-5 flex items-center gap-2">
              <button
                aria-pressed={!unansweredOnly}
                onClick={() => setUnansweredOnly(false)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${!unansweredOnly ? "border-blue-600 bg-blue-600 text-white" : "border-border text-muted-foreground hover:bg-accent"}`}
              >
                Hammasi
              </button>
              <button
                aria-pressed={unansweredOnly}
                onClick={() => setUnansweredOnly(true)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${unansweredOnly ? "border-blue-600 bg-blue-600 text-white" : "border-border text-muted-foreground hover:bg-accent"}`}
              >
                Javobsiz
              </button>
            </div>

            <div className="mt-4 flex gap-3 flex-col sm:flex-row">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Savollarni qidiring…"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                />
              </div>
              {user ? (
                <button
                  onClick={() => setShowComposer(true)}
                  className="h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center shrink-0"
                >
                  <Plus size={14} /> Savol berish
                </button>
              ) : (
                <Link
                  href="/login?force=1"
                  className="h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center shrink-0"
                >
                  Savol berish uchun kiring
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-3">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 size={24} className="animate-spin text-muted-foreground mx-auto" />
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {search
                ? `"${search}" bo'yicha savol topilmadi.`
                : tab === "uni" && myRegion
                  ? `${myRegion.uniLabel} talabalaridan hali savol yo'q. Birinchi bo'lib so'rang!`
                  : "Hali savol yo'q. Birinchi bo'lib so'rang!"}
            </div>
          ) : (
            visiblePosts.map((p) => {
              const isLocal = rankPost(p) > 0;
              return (
              <Link
                key={p.id}
                href={`/chat/${p.id}`}
                className={`block p-4 sm:p-5 rounded-2xl border bg-card hover:shadow-sm transition-all ${
                  isLocal
                    ? "border-blue-500/30 ring-1 ring-blue-500/10"
                    : "border-border hover:border-blue-500/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {p.author_name[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1 flex-wrap">
                      <span className="font-medium text-foreground">{p.author_name}</span>
                      {p.author_university && <span>· {p.author_university}</span>}
                      {p.author_region && <span>· {p.author_region}</span>}
                      <span>· {formatRelativeTime(p.created_at)}</span>
                      {p.scope && scopeMatchesMyUni(p.scope) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full font-semibold">
                          <GraduationCap size={9} /> Faqat {myRegion?.uniLabel}
                        </span>
                      ) : isLocal && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full font-semibold">
                          <MapPin size={9} /> Sizga yaqin
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-bold text-foreground leading-snug mb-1">
                      {p.solved && (
                        <span className="mr-2 inline-flex items-center gap-1 align-middle rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 size={10} /> Hal qilindi
                        </span>
                      )}
                      {p.title}
                    </h2>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                      {p.content}
                    </p>
                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="max-h-32 rounded-lg border border-border object-cover mb-2"
                      />
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={11} />
                        {p.answer_count} {p.answer_count === 1 ? "javob" : "ta javob"}
                      </span>
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        O'qish va javob berish <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              );
            })
          )}
        </div>
      </main>

      <Footer />

      {showComposer && (
        <ComposerModal
          uniLabel={myRegion?.uniLabel ?? null}
          defaultScope={tab === "uni" && myRegion ? "uni" : "all"}
          onClose={() => setShowComposer(false)}
          onCreated={(p) => {
            setPosts((prev) => [p, ...prev]);
            setShowComposer(false);
          }}
        />
      )}
    </div>
  );
}

function ComposerModal({
  uniLabel, defaultScope, onClose, onCreated,
}: {
  uniLabel: string | null;
  defaultScope: "all" | "uni";
  onClose: () => void;
  onCreated: (post: ChatPost) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  // Audience: "all" (global) or "uni" (only my university's chat). The uni
  // option is only offered when the user belongs to a recognised university.
  const [scope, setScope] = useState<"all" | "uni">(uniLabel ? defaultScope : "all");

  const handleImage = async (file?: File | null) => {
    if (!file) return;
    setError("");
    try {
      const dataUrl = await fileToCompressedDataURL(file);
      setImageUrl(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rasmni o'qib bo'lmadi");
    }
  };

  const submit = async () => {
    setError("");
    if (!title.trim() || !content.trim()) {
      setError("Savolingizga sarlavha va tafsilot kiriting.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/chat/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
          scope: scope === "uni" ? "university" : "all",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Savolingizni joylab bo'lmadi.");
        return;
      }
      onCreated(data.post);
    } catch {
      setError("Tarmoq xatoligi. Qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center px-0 sm:px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-xl bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-emerald-500/10">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Plus size={15} className="text-blue-500" /> Savol berish
          </h2>
          <button
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Sarlavha *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Masalan: Kontraktdan grantga qanday o'tsam bo'ladi?"
              maxLength={200}
              className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{title.length}/200</p>
          </div>

          {/* Audience — only shown to students with a recognised university. */}
          {uniLabel && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Qayerga joylash</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    scope === "all"
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-600"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-blue-500/30"
                  }`}
                >
                  <Globe2 size={14} />
                  <span className="text-left leading-tight">Butun O'zbekiston<br /><span className="text-[10px] font-normal opacity-70">Hamma ko'radi</span></span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope("uni")}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    scope === "uni"
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-600"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-blue-500/30"
                  }`}
                >
                  <GraduationCap size={14} />
                  <span className="text-left leading-tight">{uniLabel} Chat<br /><span className="text-[10px] font-normal opacity-70">Faqat {uniLabel} talabalari</span></span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Savolingiz *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tafsilotlarni ulashing — nimani sinab ko'rdingiz, qayerda qiynalyapsiz. Qancha ko'p kontekst bo'lsa, javob shuncha yaxshi bo'ladi."
              rows={6}
              maxLength={5000}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{content.length}/5000</p>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Rasm qo'shish (ixtiyoriy)</label>
            {imageUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-full max-h-48 object-cover rounded-xl border border-border" />
                <button
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                  type="button"
                  aria-label="Rasmni o'chirish"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-blue-500/30 hover:text-foreground transition-all">
                <ImageIcon size={14} className="text-blue-500" />
                Rasm tanlash
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImage(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground">
            <ShieldCheck size={13} className="text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              TALABA Chat xavfsiz makon. Terror, zo'ravonlik, jinsiy yoki
              nafrat mazmunidagi postlar avtomatik bloklanadi va lentaga chiqmaydi.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-10 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              Bekor qilish
            </button>
            <button
              onClick={submit}
              disabled={submitting || !title.trim() || !content.trim()}
              className="flex-1 h-10 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Joylanmoqda…</>
              ) : (
                <><Plus size={14} /> Savolni joylash</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
