// Pure-logic tests for the community helpers shared by the website and the phone app (guide suggestion, club events).
// Run:  npm run test:logic
const assert = require("assert");
const { relatedGuide } = require("../.test-out/lib/guide-topics.js");
const ev = require("../.test-out/lib/events.js");
const dl = require("../.test-out/lib/deadline.js");
let n = 0; const ok = (name, fn) => { fn(); n++; console.log("  ✓", name); };

console.log("related guide");
ok("DTM question → Qabul", () => assert.equal(relatedGuide("DTM da grant chegarasi qancha?").href, "/support/qabul"));
ok("dorm question → Turargoh", () => assert.equal(relatedGuide("Yotoqxonaga qanday joylashaman, ijara qimmatmi?").href, "/support/turargoh"));
ok("scholarship/card → Stipendiya", () => assert.equal(relatedGuide("Stipendiya qaysi kartaga tushadi, Humo yoki Uzcard?").href, "/support/stipendiya"));
ok("military → Harbiy", () => assert.equal(relatedGuide("Harbiy komissariatga qachon borish kerak").href, "/support/harbiy"));
ok("metro → Transport", () => assert.equal(relatedGuide("Metro va avtobusda talaba chegirmasi bormi").href, "/support/transport"));
ok("IELTS → Til", () => assert.equal(relatedGuide("IELTS ga qanday tayyorlanaman?").href, "/support/til"));
ok("part-time → Part-time", () => assert.equal(relatedGuide("Part-time ish topish va mehnat shartnomasi").href, "/support/parttime"));
ok("Russian keywords work", () => assert.equal(relatedGuide("Как получить место в общежитии?").href, "/support/turargoh"));
ok("most matches wins when topics mix", () => assert.equal(relatedGuide("IELTS, IELTS va TOEFL kerakmi? Yotoqxona haqida ham so'ramoqchiman").href, "/support/til"));
ok("no match → null", () => assert.equal(relatedGuide("Bugun ob-havo qanday?"), null));
ok("'sat' inside other words does not trigger Til", () => assert.equal(relatedGuide("Satrlar bilan ishlash"), null));

console.log("club events");
ok("Tashkent is UTC+5: 13:30Z → 18:30", () => assert.equal(ev.formatEventTime("2026-10-12T13:30:00Z"), "12-oktabr, 18:30"));
ok("crosses midnight into the next Tashkent day", () => assert.equal(ev.formatEventTime("2026-12-31T20:15:00Z"), "1-yanvar, 01:15"));
const now = new Date("2026-10-12T05:00:00Z");                       // 10:00 Tashkent, Mon 12 Oct
ok("today / tomorrow / date labels", () => {
  assert.equal(ev.formatEventWhen("2026-10-12T13:30:00Z", now), "Bugun 18:30");
  assert.equal(ev.formatEventWhen("2026-10-13T04:00:00Z", now), "Ertaga 09:00");
  assert.equal(ev.formatEventWhen("2026-10-20T04:00:00Z", now), "20-oktabr, 09:00");
});
ok("'today' uses the Tashkent date, not UTC (19:30Z on 11 Oct is already 12 Oct, 00:30)", () => assert.equal(ev.formatEventWhen("2026-10-11T19:30:00Z", now), "Bugun 00:30"));
ok("localInputToIso: valid → ISO, garbage → null", () => { assert.match(ev.localInputToIso("2026-10-12T18:30"), /^2026-10-1[12]T\d\d:30:00\.000Z$/); assert.equal(ev.localInputToIso("kecha"), null); });
ok("Google Calendar link: one-hour slot in UTC, escaped text", () => {
  const u = new URL(ev.googleCalendarUrl({ title: "Hackathon & demo", description: "Kod", location: "A-205", starts_at: "2026-10-12T13:30:00Z", club_name: "Python klubi" }));
  assert.equal(u.hostname, "calendar.google.com");
  assert.equal(u.searchParams.get("dates"), "20261012T133000Z/20261012T143000Z");
  assert.equal(u.searchParams.get("text"), "Hackathon & demo");
  assert.equal(u.searchParams.get("details"), "Python klubi\nKod");
});

console.log("job deadlines");
const today = new Date(2026, 9, 21);                                  // 21 Oct 2026, local
ok("far deadline: date and days", () => { const i = dl.deadlineInfo("2026-11-15", today); assert.equal(i.tone, "ok"); assert.equal(i.days, 25); assert.equal(i.label, "Muddat: 15-noy, 2026 (25 kun)"); });
ok("within 5 days → 'N kun qoldi' (soon)", () => { const i = dl.deadlineInfo("2026-10-24", today); assert.equal(i.tone, "soon"); assert.equal(i.label, "3 kun qoldi"); });
ok("today is the last day", () => { const i = dl.deadlineInfo("2026-10-21", today); assert.equal(i.tone, "today"); assert.equal(i.label, "Bugun oxirgi kun"); });
ok("yesterday → expired", () => { const i = dl.deadlineInfo("2026-10-20", today); assert.equal(i.tone, "expired"); assert.equal(i.days, -1); });
ok("blank → rolling", () => { const i = dl.deadlineInfo("", today); assert.equal(i.tone, "rolling"); assert.equal(i.days, null); });
ok("free text is shown as written", () => { const i = dl.deadlineInfo("Iyun 30", today); assert.equal(i.tone, "text"); assert.equal(i.label, "Muddat: Iyun 30"); });
ok("time of day never shifts the day count (23:59 vs 00:01)", () => { assert.equal(dl.daysUntil("2026-10-22", new Date(2026, 9, 21, 23, 59)), 1); assert.equal(dl.daysUntil("2026-10-22", new Date(2026, 9, 21, 0, 1)), 1); });
ok("deadlineRank: soonest first, rolling and expired last", () => { const r = (x) => dl.deadlineRank(x, today); assert(r("2026-10-22") < r("2026-11-20")); assert(r("2026-11-20") < r("")); assert(r("2026-10-01") >= r("2026-11-20")); assert.equal(r("Doimiy"), r("")); });

console.log(`\nsocial helpers: all ${n} passed`);
