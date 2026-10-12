---
name: talaba-design-system
description: Use when building or restyling UI in Talaba — brand tokens, primitives, dark/light rules, contrast, dialogs, tool UI kit, fonts, and responsive patterns.
---

# Talaba design system

**Brand**: blue `#2563eb` → cyan → emerald `#10b981` (logo gradient, `gradient-text`). Display font `font-display` (Plus Jakarta Sans 700–800) for headings and big numbers; body Inter.

**Tokens** (CSS vars in `globals.css`): `bg-background`, `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`, `bg-muted`, `bg-accent`. Light is the default theme; dark via `.dark`.

**Primitives**: `ui/button` (default = blue gradient, `outline`, `ghost`, `destructive`), `ui/card`, `ui/badge`, `ui/input`, `ui/dialog` (bottom sheet on phones, centred modal ≥ sm; Radix → focus trap/Escape for free). Tool kit: `components/tools/ui.tsx` (`Field`, `NumInput`, `Segmented`, `Panel`, `EmptyState`, `ConfirmButton`, `Notice`).

**Rules**
- Both themes. No raw `bg-white/…`, `text-white/…` or hex backgrounds in components (they only work in dark).
- Contrast ≥ 4.5:1: never fade text with opacity; status text in light mode = `-700` shade (`text-emerald-700 dark:text-emerald-400`); active nav `text-blue-700`.
- Tailwind `content` covers `src/{app,components,lib,pages}` — keep colour classes as complete strings (`COLORS` maps), no string-built class names.
- Cards `rounded-2xl border border-border shadow-sm`; hover `hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-card`.
- Mobile first: 375px works with a 16px gutter; modals become bottom sheets; bottom nav is 5 tabs; keep tap targets ≥ 40px.
- Icon-only buttons need `aria-label`; custom radios/toggles need role + `aria-checked/pressed`; loading = skeletons, not spinners-on-blank.
- Motion respects `prefers-reduced-motion` (global rule exists).
- Verify with the `talaba-a11y-seo-check` skill.

## Known debt (don't copy these patterns)
- `app/admin/page.tsx`, `app/community/page.tsx`, `app/community/[id]/page.tsx`, `components/ui/ambassador-modal.tsx` still use **always-dark** panels (`bg-[#0e0e1a]`, `text-white`, `text-*-400`). They look consistent but ignore the theme and fail light-mode contrast checks. Convert them to `bg-card`/tokens when touching them; the colour-swap sweeps deliberately skipped them.
- `app/admin/page.tsx` copy is English (the rest of the app is Uzbek); only `/admin/moderation` is Uzbek.
