---
name: talaba-uzbek-copy
description: Use when writing or reviewing any user-facing text for Talaba (UI, errors, emails, metadata, promo scripts) — Uzbek Latin voice, glossary, formatting, and what claims to avoid.
---

# Uzbek copy for Talaba

**Voice**: friendly, direct, "siz" form, short sentences, student-to-student. Verbs on buttons: *Saqlash, Qo'shish, Yuborish, Bekor qilish, O'chirish*. Errors say what to do next.

**Script**: Uzbek Latin. Use ASCII apostrophe for o' g' and the tutuq: `o'zbek`, `g'oya`, `ma'lumot`, `qo'shish`. In JSX escape as `&apos;`.

**Glossary** (keep consistent): dars jadvali · juftlik (double period) · toq/juft hafta · vazifa · imtihon · davomat · qoldirilgan soat · ko'nikma · sharh · e'lon · yo'qolgan/topilgan · eslatma · sinxronlash · zaxira nusxa · universitet · kurs · semestr · kredit · stipendiya · grant/kontrakt · turargoh · amaliyot · qisman bandlik.

**Formats**: dates `9-oktabr` (helpers in `lib/toolkit/time.ts`: `formatShortDate`, `timeAgoUz`, `relativeDay`), time `08:30` 24h, money `45 000 so'm` (`formatPrice`), "Tekin" for free, "Kelishiladi" for negotiable. Weeks start Monday.

**Never**: invent numbers, user counts, testimonials, partner names, or "verified" claims. If a figure isn't from real data, don't show it. Sample data in mockups must be labelled "Namuna".

**Locale quirks**: native `<input type="time">`/`date` follow the OS locale — that's fine. `Intl` has weak `uz` data — use the helpers instead.

Before shipping copy: read it aloud once; check it fits on a 375px phone and in the Segmented controls.
