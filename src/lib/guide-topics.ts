/**
 * Suggests the step-by-step guide that matches a question ("Qabul", "Turargoh", …).
 * Pure and dependency-free so the phone app can use the very same file.
 */
export interface GuideLink { href: string; label: string }

const TOPICS: Array<{ link: GuideLink; words: RegExp }> = [
  { link: { href: "/support/qabul", label: "Qabul, DTM va status" }, words: /\b(dtm|qabul|grant|kontrakt|abituriyent|hujjat topshir|my\.dtm)/i },
  { link: { href: "/support/turargoh", label: "Turargoh va ijara" }, words: /(yotoqxona|turargoh|ijara|kvartira|xonadon|общежити|квартир)/i },
  { link: { href: "/support/stipendiya", label: "Stipendiya va moliya" }, words: /(stipendiya|stipendiy|plastik karta|uzcard|humo|bank hisob|стипенди)/i },
  { link: { href: "/support/harbiy", label: "Harbiy hisob" }, words: /(harbiy|komissariat|chaqiruv|военкомат|военн)/i },
  { link: { href: "/support/transport", label: "Transport" }, words: /(metro|avtobus|marshrutka|transport|taksi|yandex go|проезд)/i },
  { link: { href: "/support/til", label: "Til va ko'nikmalar" }, words: /(ielts|toefl|sat\b|til sertifikat|ingliz tili|rus tili|cefr|topik)/i },
  { link: { href: "/support/parttime", label: "Part-time ish" }, words: /(part-?time|qisman band|mehnat shartnoma|ishga kir|ish qidir|подработк)/i },
];

/** The best-matching guide for a question's text, or null when nothing fits. */
export function relatedGuide(text: string): GuideLink | null {
  let best: GuideLink | null = null;
  let bestHits = 0;
  for (const t of TOPICS) {
    const re = new RegExp(t.words.source, "gi");
    const hits = (text.match(re) || []).length;
    if (hits > bestHits) { best = t.link; bestHits = hits; }
  }
  return best;
}
