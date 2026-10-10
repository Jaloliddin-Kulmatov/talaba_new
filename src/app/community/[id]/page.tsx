"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Link from "next/link";
import {
  ArrowLeft, Users, MessageSquare, Info, Globe, MapPin, Clock,
  Phone, Link as LinkIcon, Send, Loader2, CornerUpLeft, X, Lock,
  ExternalLink, CheckCircle2, Crown, Settings,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("talaba_token") : null;
}

function getClubCoverUrl(club: { id: number; name: string; category: string; club_type?: string; region?: string | null }): string {
  const name = club.name.toLowerCase();
  const matchers: [RegExp, string][] = [
    [/gitara|musiqa|xor|piano|nog'ora|jazz|rok|qoshiq|orkestr|cholg'u/i, "music,concert"],
    [/badminton/i, "badminton,sport"],
    [/basketbol/i, "basketball"],
    [/futbol|futzal/i, "soccer,football"],
    [/voleybol/i, "volleyball,sport"],
    [/suzish|basseyn/i, "swimming,pool"],
    [/velosiped/i, "cycling,bicycle"],
    [/tennis|stol tennisi/i, "tennis,sport"],
    [/poxod|tog'|alp|yayov|trekking/i, "hiking,mountain"],
    [/yugurish|marafon/i, "running,marathon"],
    [/yoga|salomatlik|meditatsiya|pilates/i, "yoga,wellness"],
    [/raqs|balet|xoreografiya/i, "dance,performance"],
    [/oshpazlik|pazandachilik|taom/i, "cooking,food"],
    [/foto|kamera|film|kino/i, "photography,camera"],
    [/rasm|chizmachilik|hunarmandchilik|kulolchilik/i, "art,painting"],
    [/dizayn|grafik|vizual|illyustratsiya/i, "design,creative"],
    [/dasturlash|kodlash|IT|sun'iy intellekt|robot|kompyuter|hakaton/i, "technology,coding"],
    [/ekologiya|tabiat|o'rmon|qayta ishlash/i, "nature,environment"],
    [/volontyor|xayriya|ijtimoiy xizmat/i, "volunteer,community"],
    [/til|ingliz|rus|xitoy|yapon|arab|fransuz|ispan/i, "language,study"],
    [/kitob|adabiyot|yozuvchilik|she'riyat|kutubxona/i, "books,reading"],
    [/biznes|tadbirkorlik|startap|moliya|investitsiya/i, "business,office"],
    [/jurnalistika|media|radio|matbuot/i, "journalism,media"],
    [/debat|notiqlik|diplomatiya|nutq/i, "debate,speech"],
    [/shaxmat|nastolniy o'yin|kiber sport/i, "chess,strategy"],
    [/fan|tadqiqot|laboratoriya|muhandislik|matematika|fizika|kimyo|biologiya/i, "science,laboratory"],
    [/madaniyat|an'ana|meros|festival/i, "culture,tradition"],
    [/masjid|diniy|ibodat/i, "faith,community"],
  ];
  for (const [regex, kw] of matchers) {
    if (regex.test(name)) return `https://loremflickr.com/600/200/${kw}?lock=${club.id}`;
  }
  const catKw: Record<string, string> = {
    sports: "sports,stadium", academic: "university,studying",
    culture: "culture,art", social: "people,friends",
    language: "language,study", tech: "technology,computer",
    arts: "art,creative", volunteer: "volunteer,community",
    "national community": "uzbekistan,culture",
    "religion & culture": "culture,tradition", "support & community": "community,people",
  };
  const kw = catKw[club.category?.toLowerCase()] || "students,university";
  return `https://loremflickr.com/600/200/${kw}?lock=${club.id}`;
}

async function apiFetch(method: string, path: string, body?: object) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

interface Club {
  id: number;
  name: string;
  description: string;
  category: string;
  university: string;
  meeting_time: string;
  location: string;
  member_count: number;
  pending_count: number;
  my_status: "pending" | "approved" | null;
  is_creator: boolean;
  creator_name: string | null;
  club_type: "club" | "community";
  region: string | null;
  website: string;
  cover_image: string;
  telegram_link: string | null;
  contact: string | null;
  created_at: string;
}

interface ChatMessage {
  id: number;
  club_id: number;
  user_id: number;
  author_name: string;
  content: string;
  reply_to_id: number | null;
  reply_to_name: string | null;
  reply_to_content: string | null;
  created_at: string;
}

interface Member {
  membership_id: number | null;
  user_id: number;
  name: string;
  university: string;
  region: string;
  funding_type: string;
  joined_at: string;
}

const AVATAR_GRADIENTS = [
  "from-blue-500 to-emerald-600",
  "from-emerald-500 to-cyan-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-teal-500 to-emerald-600",
  "from-fuchsia-500 to-pink-600",
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const CATEGORY_COLORS: Record<string, string> = {
  academic:            "text-blue-500 bg-blue-500/10 border-blue-500/25",
  sports:              "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
  culture:             "text-violet-500 bg-violet-500/10 border-violet-500/25",
  social:              "text-cyan-500 bg-cyan-500/10 border-cyan-500/25",
  language:            "text-amber-500 bg-amber-500/10 border-amber-500/25",
  tech:                "text-blue-500 bg-blue-500/10 border-blue-500/25",
  arts:                "text-pink-500 bg-pink-500/10 border-pink-500/25",
  volunteer:           "text-orange-500 bg-orange-500/10 border-orange-500/25",
  "national community":"text-violet-500 bg-violet-500/10 border-violet-500/25",
  "religion & culture":"text-amber-500 bg-amber-500/10 border-amber-500/25",
  "support & community":"text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
};

const CATEGORY_LABELS_UZ: Record<string, string> = {
  academic: "Ilmiy", sports: "Sport", culture: "Madaniyat", social: "Ijtimoiy",
  language: "Til", tech: "IT", arts: "San'at", volunteer: "Volontyorlik",
  "national community": "Viloyat jamiyati", "religion & culture": "Din va madaniyat",
  "support & community": "Qo'llab-quvvatlash",
};

// ── Manage Requests Modal ─────────────────────────────────────
function ManageModal({
  club,
  onClose,
  onUpdate,
}: {
  club: Club;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [requests, setRequests] = useState<
    { membership_id: number; user_id: number; name: string; university: string; region: string; funding_type: string }[]
  >([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("GET", `/clubs/${club.id}/requests`).then((d) => {
      setRequests(d.requests || []);
      setLoading(false);
    });
  }, [club.id]);

  const handle = async (userId: number, action: "approve" | "reject") => {
    setBusy(userId);
    await apiFetch("POST", `/clubs/${club.id}/${action}/${userId}`);
    setRequests((prev) => prev.filter((r) => r.user_id !== userId));
    setBusy(null);
    onUpdate();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0e0e1a] border border-white/12 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-sm font-bold text-white">
            Boshqarish — {club.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs font-semibold text-white/45 uppercase tracking-widest mb-3">
            A'zolikka so'rovlar ({requests.length})
          </p>
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 size={18} className="animate-spin text-white/40" />
            </div>
          )}
          {!loading && requests.length === 0 && (
            <p className="text-sm text-white/50 text-center py-6">
              Kutilayotgan so'rovlar yo'q.
            </p>
          )}
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.user_id}
                className="p-3.5 rounded-xl border border-white/8 bg-white/3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {r.name}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {r.university}
                      {r.region ? ` · ${r.region}` : ""}
                      {r.funding_type ? ` · ${r.funding_type}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handle(r.user_id, "approve")}
                      disabled={busy === r.user_id}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                    >
                      {busy === r.user_id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        "Qabul qilish"
                      )}
                    </button>
                    <button
                      onClick={() => handle(r.user_id, "reject")}
                      disabled={busy === r.user_id}
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      Rad etish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function CommunityDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const clubId = parseInt(params.id as string);

  const [club, setClub] = useState<Club | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [tab, setTab] = useState<"chat" | "members" | "about">("chat");
  const [joining, setJoining] = useState(false);
  const [showManage, setShowManage] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const lastIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Members
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // ── Fetch club ──
  const fetchClub = useCallback(async () => {
    try {
      const d = await apiFetch("GET", `/clubs/${clubId}`);
      if (d.error) {
        setPageError(d.error);
        setPageLoading(false);
        return;
      }
      setClub(d.club);
    } catch {
      setPageError("Yuklashda xatolik yuz berdi.");
    } finally {
      setPageLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  // ── Chat: fetch messages ──
  const fetchMessages = useCallback(
    async (after = 0) => {
      if (!club) return;
      const ok = club.my_status === "approved" || club.is_creator;
      if (!ok) return;
      const res = await fetch(`${API}/clubs/${clubId}/chat?after=${after}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) return;
      const d = await res.json();
      const msgs: ChatMessage[] = d.messages || [];
      if (msgs.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          return [...prev, ...msgs.filter((m) => !ids.has(m.id))];
        });
        lastIdRef.current = msgs[msgs.length - 1].id;
      }
      setChatLoading(false);
    },
    [club, clubId]
  );

  useEffect(() => {
    if (!club) return;
    const ok = club.my_status === "approved" || club.is_creator;
    if (ok && tab === "chat") {
      setChatLoading(messages.length === 0);
      fetchMessages(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club?.id, club?.my_status, club?.is_creator, tab]);

  // Poll every 4s
  useEffect(() => {
    if (!club) return;
    const ok = club.my_status === "approved" || club.is_creator;
    if (!ok) return;
    const id = setInterval(() => fetchMessages(lastIdRef.current), 4000);
    return () => clearInterval(id);
  }, [club, fetchMessages]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Members ──
  const fetchMembers = useCallback(async () => {
    if (!club) return;
    const ok = club.my_status === "approved" || club.is_creator;
    if (!ok) return;
    setMembersLoading(true);
    const d = await apiFetch("GET", `/clubs/${clubId}/members`);
    setMembers(d.members || []);
    setMembersLoading(false);
  }, [club, clubId]);

  useEffect(() => {
    if (tab === "members") fetchMembers();
  }, [tab, fetchMembers]);

  // ── Join / Leave ──
  const handleJoin = async () => {
    if (!club) return;
    setJoining(true);
    const ok = club.my_status === "approved" || club.is_creator;
    const path = ok ? `/clubs/${club.id}/leave` : `/clubs/${club.id}/request`;
    const d = await apiFetch("POST", path);
    if (d.club) setClub(d.club);
    setJoining(false);
  };

  // ── Send message ──
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !club) return;
    setSending(true);
    const body: { content: string; reply_to_id?: number } = { content: text };
    if (replyTo) body.reply_to_id = replyTo.id;
    const d = await apiFetch("POST", `/clubs/${club.id}/chat`, body);
    if (d.message) {
      setMessages((prev) => [...prev, d.message]);
      lastIdRef.current = d.message.id;
      setInput("");
      setReplyTo(null);
    }
    setSending(false);
  };

  // Focus input when replying
  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  // ── Loading / Error states ──
  if (pageLoading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );

  if (pageError || !club)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">{pageError || "Klub topilmadi."}</p>
        <Link
          href="/community"
          className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
        >
          ← Hamjamiyatga qaytish
        </Link>
      </div>
    );

  const isApproved = club.my_status === "approved" || club.is_creator;
  const isPending = club.my_status === "pending";
  const isCC = club.club_type === "community";
  const colorCls = CATEGORY_COLORS[club.category] || CATEGORY_COLORS.social;
  const locationDisplay = isCC
    ? club.region || club.location || "O'zbekiston"
    : club.university;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {showManage && club.is_creator && (
        <ManageModal
          club={club}
          onClose={() => setShowManage(false)}
          onUpdate={fetchClub}
        />
      )}

      <main className="pt-16 pb-24 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {/* Back */}
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 group"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Hamjamiyatga qaytish
          </Link>

          {/* ── Hero header ── */}
          {(() => {
            const coverUrl = club.cover_image || getClubCoverUrl(club);
            return (
              <div className="relative rounded-2xl border border-border overflow-hidden mb-5">
                {/* Cover */}
                <div className="relative h-52 sm:h-64 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverUrl}
                    alt={club.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/talaba-${club.id}/800/300`; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Action buttons — top right */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    {club.is_creator && (
                      <button
                        onClick={() => setShowManage(true)}
                        className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm border border-white/15 text-xs text-white/80 hover:text-amber-400 hover:border-amber-500/40 transition-all"
                      >
                        <Settings size={12} /> Boshqarish
                        {club.pending_count > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                            {club.pending_count}
                          </span>
                        )}
                      </button>
                    )}
                    {user && !club.is_creator && (
                      <button
                        onClick={handleJoin}
                        disabled={joining || isPending}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 backdrop-blur-sm ${
                          isApproved
                            ? "bg-black/50 border border-white/15 text-white/70 hover:text-red-400 hover:border-red-500/30"
                            : isPending
                            ? "bg-black/50 border border-amber-500/30 text-amber-400 cursor-default"
                            : "bg-blue-600 border border-blue-400/30 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/25"
                        }`}
                      >
                        {joining ? <Loader2 size={12} className="animate-spin" /> : null}
                        {isApproved ? "Chiqish" : isPending ? "Kutilmoqda…" : "Qo'shilish"}
                      </button>
                    )}
                    {!user && (
                      <Link
                        href="/login"
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 border border-blue-400/30 text-white text-xs font-semibold hover:bg-blue-700 transition-colors backdrop-blur-sm"
                      >
                        Qo'shilish uchun kiring
                      </Link>
                    )}
                  </div>

                  {/* Title + meta overlaid at bottom of cover */}
                  <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-8">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold backdrop-blur-sm ${colorCls}`}>
                        {CATEGORY_LABELS_UZ[club.category] || club.category}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold backdrop-blur-sm ${
                        isCC
                          ? "text-violet-300 bg-violet-500/20 border-violet-500/30"
                          : "text-blue-300 bg-blue-500/20 border-blue-500/30"
                      }`}>
                        {isCC ? "🌍 Jamiyat" : "🎓 Klub"}
                      </span>
                      {isApproved && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border text-emerald-300 bg-emerald-500/20 border-emerald-500/30 backdrop-blur-sm flex items-center gap-1">
                          <CheckCircle2 size={9} /> Qo'shilgan
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border text-amber-300 bg-amber-500/20 border-amber-500/30 backdrop-blur-sm">
                          Kutilmoqda
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1.5 leading-tight">
                      {club.name}
                    </h1>
                    <div className="flex items-center gap-3 text-[11px] text-white/55 flex-wrap">
                      <span className="flex items-center gap-1"><Users size={11} />{club.member_count} a'zo</span>
                      {locationDisplay && <span className="flex items-center gap-1"><MapPin size={11} />{locationDisplay}</span>}
                      {club.creator_name && <span>muallif: {club.creator_name}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Tabs ── */}
          <div className="flex gap-0.5 mb-5 border-b border-border overflow-x-auto scrollbar-hide">
            {(
              [
                { key: "chat",    icon: MessageSquare, label: "Chat" },
                { key: "members", icon: Users,         label: `A'zolar (${club.member_count})` },
                { key: "about",   icon: Info,          label: "Ma'lumot" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                  tab === t.key
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════
               CHAT TAB
          ══════════════════════════════ */}
          {tab === "chat" && (
            <div
              className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col"
              style={{
                height: "calc(100vh - 360px)",
                minHeight: "320px",
                maxHeight: "600px",
              }}
            >
              {!isApproved ? (
                /* Locked */
                <div className="flex flex-col items-center justify-center flex-1 gap-5 p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                    <Lock size={24} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground mb-1">
                      Faqat a'zolar uchun
                    </p>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {isPending
                        ? "So'rovingiz kutilmoqda. Egasi tez orada tasdiqlaydi!"
                        : "Boshqa a'zolar bilan chatlashish uchun ushbu hamjamiyatga qo'shiling."}
                    </p>
                  </div>
                  {!isPending && user && (
                    <button
                      onClick={handleJoin}
                      disabled={joining}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      {joining && (
                        <Loader2 size={14} className="animate-spin" />
                      )}
                      Qo'shilish
                    </button>
                  )}
                  {!user && (
                    <Link
                      href="/login"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Qo'shilish uchun kiring
                    </Link>
                  )}
                </div>
              ) : (
                /* Chat UI */
                <>
                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                    {chatLoading && (
                      <div className="flex justify-center pt-10">
                        <Loader2
                          size={20}
                          className="animate-spin text-muted-foreground"
                        />
                      </div>
                    )}
                    {!chatLoading && messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
                        <MessageSquare
                          size={32}
                          className="text-muted-foreground/25"
                        />
                        <p className="text-sm text-muted-foreground">
                          Hali xabar yo'q.{" "}
                          <span className="font-medium text-foreground">
                            Salom bering!
                          </span>{" "}
                          👋
                        </p>
                      </div>
                    )}

                    {messages.map((m) => {
                      const isMe = m.user_id === user?.id;
                      const grad =
                        AVATAR_GRADIENTS[m.user_id % AVATAR_GRADIENTS.length];
                      return (
                        <div
                          key={m.id}
                          className={`group flex gap-3 ${
                            isMe ? "flex-row-reverse" : ""
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5 shadow-sm`}
                          >
                            {initials(m.author_name)}
                          </div>

                          {/* Bubble column */}
                          <div
                            className={`max-w-[68%] sm:max-w-[60%] flex flex-col gap-1 ${
                              isMe ? "items-end" : "items-start"
                            }`}
                          >
                            {/* Name + time */}
                            <div className="flex items-center gap-2">
                              {!isMe && (
                                <span className="text-xs font-semibold text-foreground">
                                  {m.author_name}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {formatRelativeTime(m.created_at)}
                              </span>
                            </div>

                            {/* Reply preview */}
                            {m.reply_to_name && (
                              <div
                                className={`text-[11px] px-3 py-1.5 rounded-xl border w-full ${
                                  isMe
                                    ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                    : "bg-muted border-border text-muted-foreground"
                                }`}
                              >
                                <span className="font-semibold">
                                  ↩ {m.reply_to_name}:{" "}
                                </span>
                                <span className="opacity-70 line-clamp-1">
                                  {m.reply_to_content}
                                </span>
                              </div>
                            )}

                            {/* Message bubble */}
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                                isMe
                                  ? "bg-blue-600 text-white rounded-tr-sm"
                                  : "bg-muted text-foreground rounded-tl-sm"
                              }`}
                            >
                              {m.content}
                            </div>

                            {/* Reply button */}
                            <button
                              onClick={() => setReplyTo(m)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-muted-foreground hover:text-blue-500 px-1 mt-0.5"
                            >
                              <CornerUpLeft size={11} /> Javob berish
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>

                  {/* Reply preview bar */}
                  {replyTo && (
                    <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-muted/40">
                      <CornerUpLeft
                        size={13}
                        className="text-blue-500 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {replyTo.author_name}{" "}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {replyTo.content}
                        </span>
                      </div>
                      <button
                        onClick={() => setReplyTo(null)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {/* Input row */}
                  <div className="px-4 py-3 border-t border-border shrink-0">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl bg-gradient-to-br ${
                          AVATAR_GRADIENTS[
                            (user?.id || 0) % AVATAR_GRADIENTS.length
                          ]
                        } flex items-center justify-center text-white text-[11px] font-bold shrink-0`}
                      >
                        {user ? initials(user.name) : "?"}
                      </div>
                      <input
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && !e.shiftKey && sendMessage()
                        }
                        placeholder={
                          replyTo
                            ? `${replyTo.author_name} ga javob…`
                            : "Xabar yozing…"
                        }
                        className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={sending || !input.trim()}
                        className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40"
                      >
                        {sending ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Send size={15} />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════════════════════════
               MEMBERS TAB
          ══════════════════════════════ */}
          {tab === "members" && (
            <div>
              {!isApproved ? (
                <div className="rounded-2xl border border-border bg-card p-14 text-center">
                  <Lock
                    size={28}
                    className="text-muted-foreground/30 mx-auto mb-3"
                  />
                  <p className="text-sm text-muted-foreground">
                    Boshqa a'zolarni ko'rish uchun ushbu hamjamiyatga qo'shiling.
                  </p>
                </div>
              ) : membersLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2
                    size={20}
                    className="animate-spin text-muted-foreground"
                  />
                </div>
              ) : members.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-14 text-center">
                  <Users
                    size={28}
                    className="text-muted-foreground/30 mx-auto mb-3"
                  />
                  <p className="text-sm text-muted-foreground">
                    Hali tasdiqlangan a'zolar yo'q.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map((m) => {
                    const grad =
                      AVATAR_GRADIENTS[m.user_id % AVATAR_GRADIENTS.length];
                    const isCreator = m.name.includes("(Creator)");
                    const displayName = m.name.replace(" (Creator)", "");
                    return (
                      <div
                        key={m.user_id}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-blue-500/20 hover:shadow-sm transition-all"
                      >
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}
                        >
                          {initials(displayName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {displayName}
                            </p>
                            {isCreator && (
                              <Crown
                                size={11}
                                className="text-amber-400 shrink-0"
                              />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {[m.region, m.university, m.funding_type]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════
               ABOUT TAB
          ══════════════════════════════ */}
          {tab === "about" && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {/* Description — wider */}
              <div className="md:col-span-3 p-5 rounded-2xl border border-border bg-card">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Bu {isCC ? "jamiyat" : "klub"} haqida
                </h3>
                {club.description ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {club.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Hali tavsif yo'q.
                  </p>
                )}
              </div>

              {/* Details sidebar */}
              <div className="md:col-span-2 space-y-3">
                <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Tafsilotlar
                  </h3>
                  {club.meeting_time && (
                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Clock
                        size={14}
                        className="text-blue-500 shrink-0 mt-0.5"
                      />
                      <span>{club.meeting_time}</span>
                    </div>
                  )}
                  {club.location && (
                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <MapPin
                        size={14}
                        className="text-violet-500 shrink-0 mt-0.5"
                      />
                      <span>{club.location}</span>
                    </div>
                  )}
                  {locationDisplay && (
                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Globe
                        size={14}
                        className="text-cyan-500 shrink-0 mt-0.5"
                      />
                      <span>{locationDisplay}</span>
                    </div>
                  )}
                  {club.website && (
                    <a
                      href={club.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Rasmiy veb-sayt →
                    </a>
                  )}
                </div>

                {/* Members-only info */}
                {isApproved && (club.telegram_link || club.contact) && (
                  <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-3">
                    <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <Lock size={12} /> Faqat a'zolar uchun
                    </h3>
                    {club.telegram_link && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <LinkIcon
                          size={13}
                          className="text-blue-500 shrink-0"
                        />
                        <a
                          href={
                            club.telegram_link.startsWith("http")
                              ? club.telegram_link
                              : `https://${club.telegram_link}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-400 transition-colors"
                        >
                          Telegram guruhi →
                        </a>
                      </div>
                    )}
                    {club.contact && (
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Phone size={13} className="shrink-0" />
                        <span>{club.contact}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
