"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, Mail, MapPin, Phone, Plus, Printer, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useHydrated, useLocalStore } from "@/lib/store";
import { toolById } from "@/lib/toolkit/tools";
import { uid } from "@/lib/toolkit/time";
import { EMPTY_SKILLS, SKILLS_KEY, type Skill } from "@/lib/toolkit/skills";
import {
  ACCENTS, CV_KEY, EMPTY_CV, HEADINGS, LANG_LABEL, LEVEL_OPTIONS, completeness, period, skillList,
  type CvData, type CvLang, type CvTemplate,
} from "@/lib/toolkit/cv";
import { Field, Panel, Segmented, Skeleton, ToolHeader, fieldCls } from "./ui";

type Tab = "edit" | "preview";

export default function CvApp() {
  const tool = toolById("cv");
  const hydrated = useHydrated();
  const { user } = useAuth();
  const [cv, setCv] = useLocalStore(CV_KEY, EMPTY_CV);
  const [skillsData] = useLocalStore(SKILLS_KEY, EMPTY_SKILLS);
  const [tab, setTab] = useState<Tab>("edit");
  const prefilled = useRef(false);

  // First visit: start from the account profile instead of a blank page.
  useEffect(() => {
    if (!hydrated || prefilled.current || !user) return;
    prefilled.current = true;
    if (cv.fullName || cv.email || cv.education.length) return;
    setCv((p) => ({
      ...p,
      fullName: user.name ?? "",
      email: user.email ?? "",
      education: user.university ? [{ id: uid(), school: user.university, degree: "Bakalavr", from: "", to: "" }] : [],
    }));
  }, [hydrated, user, cv, setCv]);

  const patch = (p: Partial<CvData>) => setCv((prev) => ({ ...prev, ...p }));
  const skills = skillList(cv, skillsData.skills);
  const score = completeness(cv, skills.length);

  return (
    <>
      <ToolHeader
        tool={tool}
        actions={<Button onClick={() => window.print()} disabled={!cv.fullName.trim()}><Printer size={15} className="mr-2" /> PDF sifatida saqlash</Button>}
      />

      {!hydrated ? (
        <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-96" /></div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 lg:hidden">
            <Segmented<Tab> label="Bo'lim" value={tab} onChange={setTab} options={[{ value: "edit", label: "Tahrirlash" }, { value: "preview", label: "Ko'rinish" }]} />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div className={cn("space-y-4", tab === "preview" && "hidden lg:block")}>
              <Completeness pct={score.pct} tips={score.tips} />
              <Settings cv={cv} onChange={patch} />
              <Personal cv={cv} onChange={patch} />
              <ListSection
                title="Ta'lim" addLabel="Ta'lim qo'shish" items={cv.education}
                onAdd={() => patch({ education: [...cv.education, { id: uid(), school: "", degree: "", from: "", to: "" }] })}
                onRemove={(id) => patch({ education: cv.education.filter((e) => e.id !== id) })}
                render={(e) => (
                  <>
                    <input value={e.school} onChange={(x) => patch({ education: cv.education.map((i) => (i.id === e.id ? { ...i, school: x.target.value } : i)) })} className={fieldCls} placeholder="Universitet" maxLength={120} aria-label="Universitet" />
                    <input value={e.degree} onChange={(x) => patch({ education: cv.education.map((i) => (i.id === e.id ? { ...i, degree: x.target.value } : i)) })} className={fieldCls} placeholder="Daraja / yo'nalish (masalan, Bakalavr, Iqtisodiyot)" maxLength={120} aria-label="Yo'nalish" />
                    <Dates from={e.from} to={e.to} onChange={(from, to) => patch({ education: cv.education.map((i) => (i.id === e.id ? { ...i, from, to } : i)) })} />
                  </>
                )}
              />
              <ListSection
                title="Tajriba" addLabel="Tajriba qo'shish" items={cv.experience}
                onAdd={() => patch({ experience: [...cv.experience, { id: uid(), org: "", role: "", from: "", to: "", desc: "" }] })}
                onRemove={(id) => patch({ experience: cv.experience.filter((e) => e.id !== id) })}
                render={(e) => (
                  <>
                    <input value={e.role} onChange={(x) => patch({ experience: cv.experience.map((i) => (i.id === e.id ? { ...i, role: x.target.value } : i)) })} className={fieldCls} placeholder="Lavozim" maxLength={100} aria-label="Lavozim" />
                    <input value={e.org} onChange={(x) => patch({ experience: cv.experience.map((i) => (i.id === e.id ? { ...i, org: x.target.value } : i)) })} className={fieldCls} placeholder="Tashkilot" maxLength={100} aria-label="Tashkilot" />
                    <Dates from={e.from} to={e.to} onChange={(from, to) => patch({ experience: cv.experience.map((i) => (i.id === e.id ? { ...i, from, to } : i)) })} />
                    <textarea value={e.desc} onChange={(x) => patch({ experience: cv.experience.map((i) => (i.id === e.id ? { ...i, desc: x.target.value } : i)) })} rows={3} className={cn(fieldCls, "h-auto py-2.5")} placeholder="Nima qildingiz va qanday natija bergansiz? Har bir qatorga bitta yutuq, raqamlar bilan." maxLength={600} aria-label="Tavsif" />
                  </>
                )}
              />
              <ListSection
                title="Loyihalar" addLabel="Loyiha qo'shish" items={cv.projects}
                onAdd={() => patch({ projects: [...cv.projects, { id: uid(), name: "", link: "", desc: "" }] })}
                onRemove={(id) => patch({ projects: cv.projects.filter((e) => e.id !== id) })}
                render={(e) => (
                  <>
                    <input value={e.name} onChange={(x) => patch({ projects: cv.projects.map((i) => (i.id === e.id ? { ...i, name: x.target.value } : i)) })} className={fieldCls} placeholder="Loyiha nomi" maxLength={100} aria-label="Loyiha nomi" />
                    <input value={e.link} onChange={(x) => patch({ projects: cv.projects.map((i) => (i.id === e.id ? { ...i, link: x.target.value } : i)) })} className={fieldCls} placeholder="Havola (GitHub, sayt) — ixtiyoriy" maxLength={160} aria-label="Havola" />
                    <textarea value={e.desc} onChange={(x) => patch({ projects: cv.projects.map((i) => (i.id === e.id ? { ...i, desc: x.target.value } : i)) })} rows={2} className={cn(fieldCls, "h-auto py-2.5")} placeholder="Nima qiladi, qaysi texnologiyalar bilan?" maxLength={400} aria-label="Loyiha tavsifi" />
                  </>
                )}
              />
              <SkillsLangs cv={cv} onChange={patch} trackedCount={skillsData.skills.length} />
            </div>

            <div className={cn("lg:sticky lg:top-20", tab === "edit" && "hidden lg:block")}>
              <Preview cv={cv} tracked={skillsData.skills} />
              <p className="mt-2 text-center text-xs text-muted-foreground">«PDF sifatida saqlash» tugmasini bosib, chop etish oynasida «PDF sifatida saqlash»ni tanlang.</p>
            </div>
          </div>
          {/* Print-only copy: lives directly under <body> so the app chrome can be hidden and long CVs flow onto page 2. */}
          {createPortal(
            <div id="cv-print-root" className="hidden bg-white text-slate-900"><CvSheet cv={cv} tracked={skillsData.skills} /></div>,
            document.body,
          )}
        </>
      )}
    </>
  );
}

// ── form pieces ─────────────────────────────────────────────────────────

function Completeness({ pct, tips }: { pct: number; tips: string[] }) {
  return (
    <Panel>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">CV to&apos;liqligi</h2>
        <span className="text-sm font-bold tabular-nums text-foreground">{pct}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="CV to'liqligi">
        <div className={cn("h-full rounded-full transition-all duration-500", pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${pct}%` }} />
      </div>
      {tips.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">{tips.slice(0, 3).map((t) => <li key={t}>• {t}</li>)}</ul>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"><Check size={14} /> CV tayyor — PDF qilib saqlang.</p>
      )}
    </Panel>
  );
}

function Settings({ cv, onChange }: { cv: CvData; onChange: (p: Partial<CvData>) => void }) {
  return (
    <Panel className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">CV tili</span>
          <Segmented<CvLang> size="sm" label="CV tili" value={cv.lang} onChange={(lang) => onChange({ lang })} options={(Object.keys(LANG_LABEL) as CvLang[]).map((l) => ({ value: l, label: LANG_LABEL[l] }))} />
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Shablon</span>
          <Segmented<CvTemplate> size="sm" label="Shablon" value={cv.template} onChange={(template) => onChange({ template })} options={[{ value: "ats", label: "Oddiy (ATS)" }, { value: "modern", label: "Zamonaviy" }]} />
        </div>
      </div>
      {cv.template === "modern" && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Rang:</span>
          {ACCENTS.map((c) => (
            <button key={c} type="button" aria-label={`Rang ${c}`} aria-pressed={cv.accent === c} onClick={() => onChange({ accent: c })} className={cn("h-7 w-7 rounded-full ring-offset-2 ring-offset-card transition-transform hover:scale-110", cv.accent === c && "ring-2 ring-foreground")} style={{ background: c }} />
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">«Oddiy» shablon ish beruvchilarning avtomatik tizimlari (ATS) uchun qulay: bitta ustun, rasm va jadvalsiz.</p>
    </Panel>
  );
}

function Personal({ cv, onChange }: { cv: CvData; onChange: (p: Partial<CvData>) => void }) {
  return (
    <Panel className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Shaxsiy ma&apos;lumotlar</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="To'liq ism *"><input value={cv.fullName} onChange={(e) => onChange({ fullName: e.target.value })} className={fieldCls} maxLength={80} autoComplete="name" /></Field>
        <Field label="Lavozim / maqsad *"><input value={cv.title} onChange={(e) => onChange({ title: e.target.value })} className={fieldCls} maxLength={80} placeholder="masalan, Frontend stajyor" /></Field>
        <Field label="Email"><input type="email" value={cv.email} onChange={(e) => onChange({ email: e.target.value })} className={fieldCls} maxLength={100} autoComplete="email" /></Field>
        <Field label="Telefon"><input value={cv.phone} onChange={(e) => onChange({ phone: e.target.value })} className={fieldCls} maxLength={30} placeholder="+998…" autoComplete="tel" /></Field>
        <Field label="Telegram"><input value={cv.telegram} onChange={(e) => onChange({ telegram: e.target.value })} className={fieldCls} maxLength={40} placeholder="@username" /></Field>
        <Field label="Shahar"><input value={cv.city} onChange={(e) => onChange({ city: e.target.value })} className={fieldCls} maxLength={60} placeholder="Toshkent" /></Field>
      </div>
      <Field label="Men haqimda" hint="2–3 jumla: kimsiz, nimada kuchlisiz, nimani izlayapsiz.">
        <textarea value={cv.summary} onChange={(e) => onChange({ summary: e.target.value })} rows={3} className={cn(fieldCls, "h-auto py-2.5")} maxLength={500} />
      </Field>
    </Panel>
  );
}

function Dates({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <input value={from} onChange={(e) => onChange(e.target.value, to)} className={fieldCls} placeholder="Boshlanish (2023)" maxLength={20} aria-label="Boshlanish" />
      <input value={to} onChange={(e) => onChange(from, e.target.value)} className={fieldCls} placeholder="Tugash (bo'sh = hozir)" maxLength={20} aria-label="Tugash" />
    </div>
  );
}

function ListSection<T extends { id: string }>({
  title, addLabel, items, onAdd, onRemove, render,
}: { title: string; addLabel: string; items: T[]; onAdd: () => void; onRemove: (id: string) => void; render: (item: T) => React.ReactNode }) {
  return (
    <Panel className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Button size="sm" variant="outline" onClick={onAdd}><Plus size={13} className="mr-1" /> {addLabel}</Button>
      </div>
      {items.length === 0 && <p className="text-xs text-muted-foreground">Hali qo&apos;shilmagan.</p>}
      {items.map((it) => (
        <div key={it.id} className="relative space-y-2 rounded-xl border border-border p-3">
          {render(it)}
          <button onClick={() => onRemove(it.id)} aria-label={`${title}: o'chirish`} className="absolute -right-2 -top-2 rounded-full border border-border bg-card p-1.5 text-muted-foreground shadow-sm hover:text-red-600"><Trash2 size={12} /></button>
        </div>
      ))}
    </Panel>
  );
}

function SkillsLangs({ cv, onChange, trackedCount }: { cv: CvData; onChange: (p: Partial<CvData>) => void; trackedCount: number }) {
  const opts = LEVEL_OPTIONS[cv.lang];
  return (
    <Panel className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Ko&apos;nikmalar</h2>
        <label className="mt-2 flex items-start gap-2.5 text-sm text-foreground">
          <input type="checkbox" checked={cv.includeTrackedSkills} onChange={(e) => onChange({ includeTrackedSkills: e.target.checked })} className="mt-1 h-4 w-4 accent-blue-600" />
          <span>
            «Ko&apos;nikmalar» bo&apos;limidagi {trackedCount} ta ko&apos;nikmani avtomatik qo&apos;shish
            {trackedCount === 0 && <> — <Link href="/tools/skills" className="font-medium text-blue-600 hover:underline dark:text-blue-400">ko&apos;nikma qo&apos;shing</Link></>}
          </span>
        </label>
        <Field label="Qo'shimcha ko'nikmalar" className="mt-3" hint="Vergul bilan ajrating">
          <textarea value={cv.extraSkills} onChange={(e) => onChange({ extraSkills: e.target.value })} rows={2} className={cn(fieldCls, "h-auto py-2.5")} placeholder="Git, Photoshop, Public speaking" maxLength={300} />
        </Field>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Tillar</h2>
          <Button size="sm" variant="outline" onClick={() => onChange({ languages: [...cv.languages, { id: uid(), name: "", level: opts[2] }] })}><Plus size={13} className="mr-1" /> Til qo&apos;shish</Button>
        </div>
        <div className="mt-2 space-y-2">
          {cv.languages.map((l) => (
            <div key={l.id} className="flex gap-2">
              <input value={l.name} onChange={(e) => onChange({ languages: cv.languages.map((x) => (x.id === l.id ? { ...x, name: e.target.value } : x)) })} className={fieldCls} placeholder="masalan, Ingliz tili" maxLength={30} aria-label="Til" />
              <select value={l.level} onChange={(e) => onChange({ languages: cv.languages.map((x) => (x.id === l.id ? { ...x, level: e.target.value } : x)) })} className={cn(fieldCls, "w-40")} aria-label="Daraja">
                {Array.from(new Set([l.level, ...opts])).map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <button onClick={() => onChange({ languages: cv.languages.filter((x) => x.id !== l.id) })} aria-label="Tilni o'chirish" className="rounded-lg px-2 text-muted-foreground hover:text-red-600"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ── live A4 preview (also what gets printed) ────────────────────────────

function Preview({ cv, tracked }: { cv: CvData; tracked: Skill[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / 794));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrap} className="w-full overflow-hidden rounded-2xl border border-border bg-muted/40 shadow-sm" style={{ height: 1123 * scale }}>
      <div style={{ width: 794, minHeight: 1123, transform: `scale(${scale})`, transformOrigin: "top left" }} className="bg-white text-slate-900">
        <CvSheet cv={cv} tracked={tracked} />
      </div>
    </div>
  );
}

export function CvSheet({ cv, tracked }: { cv: CvData; tracked: Skill[] }) {
  const h = HEADINGS[cv.lang];
  const skills = skillList(cv, tracked);
  const modern = cv.template === "modern";
  const accent = modern ? cv.accent : "#0f172a";
  const contacts = [
    cv.email && { icon: Mail, text: cv.email }, cv.phone && { icon: Phone, text: cv.phone },
    cv.telegram && { icon: Send, text: cv.telegram }, cv.city && { icon: MapPin, text: cv.city },
  ].filter(Boolean) as { icon: typeof Mail; text: string }[];

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mt-5 break-inside-avoid">
      <h2 className="mb-2 border-b pb-1 text-[13px] font-bold uppercase tracking-wider" style={{ color: accent, borderColor: modern ? accent : "#cbd5e1" }}>{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="p-[46px] text-[12.5px] leading-[1.5]" style={{ fontFamily: "Inter, Arial, sans-serif" }}>
      <header className={cn(modern && "-mx-[46px] -mt-[46px] mb-1 px-[46px] pb-5 pt-[46px] text-white")} style={modern ? { background: accent } : undefined}>
        <h1 className="text-[30px] font-extrabold leading-tight tracking-tight">{cv.fullName || "Ism Familiya"}</h1>
        {cv.title && <p className={cn("text-[15px] font-medium", modern ? "text-white/90" : "text-slate-600")}>{cv.title}</p>}
        {contacts.length > 0 && (
          <ul className={cn("mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px]", modern ? "text-white/90" : "text-slate-600")}>
            {contacts.map(({ icon: I, text }) => <li key={text} className="inline-flex items-center gap-1"><I size={12} /> {text}</li>)}
          </ul>
        )}
      </header>

      {cv.summary.trim() && <Section title={h.summary}><p className="whitespace-pre-wrap">{cv.summary}</p></Section>}

      {cv.experience.some((e) => e.role || e.org) && (
        <Section title={h.experience}>
          {cv.experience.filter((e) => e.role || e.org).map((e) => (
            <div key={e.id} className="mb-3 break-inside-avoid">
              <div className="flex justify-between gap-4"><b>{e.role}{e.role && e.org ? " · " : ""}{e.org}</b><span className="shrink-0 text-slate-500">{period(e.from, e.to, h.present)}</span></div>
              {e.desc.trim() && <ul className="mt-0.5 list-disc pl-5">{e.desc.split("\n").filter((l) => l.trim()).map((l, i) => <li key={i}>{l.replace(/^[-•*]\s*/, "")}</li>)}</ul>}
            </div>
          ))}
        </Section>
      )}

      {cv.projects.some((p) => p.name) && (
        <Section title={h.projects}>
          {cv.projects.filter((p) => p.name).map((p) => (
            <div key={p.id} className="mb-2 break-inside-avoid">
              <b>{p.name}</b>{p.link && <span className="ml-2 text-slate-500">{p.link}</span>}
              {p.desc.trim() && <p>{p.desc}</p>}
            </div>
          ))}
        </Section>
      )}

      {cv.education.some((e) => e.school) && (
        <Section title={h.education}>
          {cv.education.filter((e) => e.school).map((e) => (
            <div key={e.id} className="mb-2 break-inside-avoid">
              <div className="flex justify-between gap-4"><b>{e.school}</b><span className="shrink-0 text-slate-500">{period(e.from, e.to, h.present)}</span></div>
              {e.degree && <p className="text-slate-600">{e.degree}</p>}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title={h.skills}>
          {modern ? (
            <ul className="flex flex-wrap gap-1.5">{skills.map((s) => <li key={s} className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium" style={{ background: `${accent}18`, color: accent }}>{s}</li>)}</ul>
          ) : <p>{skills.join(" · ")}</p>}
        </Section>
      )}

      {cv.languages.some((l) => l.name) && (
        <Section title={h.languages}>
          <p>{cv.languages.filter((l) => l.name).map((l) => `${l.name} — ${l.level}`).join("  ·  ")}</p>
        </Section>
      )}
    </div>
  );
}
