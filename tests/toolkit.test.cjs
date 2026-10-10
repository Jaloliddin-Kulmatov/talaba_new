// Pure-logic tests for the student toolkit (timetable, GPA, planner, focus, attendance, skills, job matching).
// Run:  npm run test:logic      (compiles src/lib/toolkit with tsc, then runs this file with node)
const assert = require("assert");
const t = require("../.test-out/lib/toolkit/timetable.js");
const g = require("../.test-out/lib/toolkit/gpa.js");
const p = require("../.test-out/lib/toolkit/planner.js");
const f = require("../.test-out/lib/toolkit/focus.js");
const a = require("../.test-out/lib/toolkit/attendance.js");
const time = require("../.test-out/lib/toolkit/time.js");
let n = 0; const ok = (name, fn) => { fn(); n++; console.log("  ✓", name); };

console.log("time");
ok("toMin / fmtMin roundtrip", () => { assert.equal(time.toMin("08:30"), 510); assert.equal(time.fmtMin(510), "08:30"); assert(Number.isNaN(time.toMin("x"))); });
ok("dayIndex Monday=0, Sunday=6", () => { assert.equal(time.dayIndex(new Date(2026,9,5)), 0); assert.equal(time.dayIndex(new Date(2026,9,11)), 6); });
ok("daysBetween ignores time of day", () => assert.equal(time.daysBetween(new Date(2026,9,9,23,59), new Date(2026,9,10,0,1)), 1));
ok("formatDuration", () => { assert.equal(time.formatDuration(80), "1 soat 20 daqiqa"); assert.equal(time.formatDuration(35), "35 daqiqa"); assert.equal(time.formatDuration(120), "2 soat"); });

console.log("timetable");
const anchor = { monday: "2026-10-05", odd: true };           // week of Mon 5 Oct is toq
ok("parity: anchor week is odd", () => assert.equal(t.parityOf(new Date(2026,9,7), anchor), "odd"));
ok("parity: next week even", () => assert.equal(t.parityOf(new Date(2026,9,14), anchor), "even"));
ok("parity: two weeks later odd again", () => assert.equal(t.parityOf(new Date(2026,9,21), anchor), "odd"));
ok("parity: weeks BEFORE the anchor alternate correctly", () => { assert.equal(t.parityOf(new Date(2026,9,1), anchor), "even"); assert.equal(t.parityOf(new Date(2026,8,24), anchor), "odd"); });
ok("parity: Sunday belongs to the Monday-started week", () => assert.equal(t.parityOf(new Date(2026,9,11), anchor), "odd"));
ok("anchorFor pins the chosen parity", () => { const an = t.anchorFor(new Date(2026,9,8), "even"); assert.equal(t.parityOf(new Date(2026,9,8), an), "even"); assert.equal(t.parityOf(new Date(2026,9,15), an), "odd"); });
const C = (o) => ({ id: Math.random()+"", subject: "S", day: 0, start: "09:00", end: "10:00", color: "blue", kind: "lecture", weeks: "all", ...o });
ok("layout: non-overlapping get 1 lane", () => { const r = t.layoutDay([C({start:"09:00",end:"10:00"}), C({start:"10:00",end:"11:00"})]); assert(r.every(x => x.lanes === 1 && x.lane === 0)); });
ok("layout: overlaps get side-by-side lanes", () => { const r = t.layoutDay([C({start:"09:00",end:"11:00"}), C({start:"10:00",end:"11:30"})]); assert(r.every(x => x.lanes === 2)); assert.deepEqual(r.map(x=>x.lane).sort(), [0,1]); });
ok("layout: lane freed after first ends is reused (3 classes, 2 lanes)", () => { const r = t.layoutDay([C({start:"09:00",end:"10:00"}), C({start:"09:30",end:"11:00"}), C({start:"10:00",end:"11:00"})]); assert(r.every(x => x.lanes === 2)); });
ok("layout: separate clusters don't share lane count", () => { const r = t.layoutDay([C({start:"09:00",end:"10:00"}), C({start:"09:30",end:"10:30"}), C({start:"13:00",end:"14:00"})]); const solo = r.find(x => x.entry.start === "13:00"); assert.equal(solo.lanes, 1); });
const data = { anchor, classes: [C({id:"a",day:2,start:"08:30",end:"09:50",subject:"Algebra"}), C({id:"b",day:2,start:"10:00",end:"11:20",subject:"Fizika",weeks:"even"}), C({id:"c",day:2,start:"11:30",end:"12:50",subject:"Ingliz",weeks:"odd"})] };
ok("parity filter: odd week shows all+odd only", () => assert.deepEqual(t.classesOn(data,2,"odd").map(c=>c.subject), ["Algebra","Ingliz"]));
ok("parity filter: even week shows all+even only", () => assert.deepEqual(t.classesOn(data,2,"even").map(c=>c.subject), ["Algebra","Fizika"]));
const wed = (h,m) => new Date(2026,9,7,h,m);                    // Wed 7 Oct 2026 = odd week
ok("nowStatus: before first class → next", () => { const s = t.nowStatus(t.todaysClasses(data, wed(8,0)), wed(8,0)); assert.equal(s.state,"next"); assert.equal(s.minsUntil,30); });
ok("nowStatus: during → minsLeft", () => { const s = t.nowStatus(t.todaysClasses(data, wed(9,0)), wed(9,0)); assert.equal(s.state,"during"); assert.equal(s.minsLeft,50); });
ok("nowStatus: end boundary is exclusive (09:50 → between classes)", () => { const s = t.nowStatus(t.todaysClasses(data, wed(9,50)), wed(9,50)); assert.equal(s.state,"next"); assert.equal(s.cls.subject,"Ingliz"); });
ok("nowStatus: after last → done; no classes → empty", () => { assert.equal(t.nowStatus(t.todaysClasses(data, wed(18,0)), wed(18,0)).state,"done"); assert.equal(t.nowStatus([], wed(9,0)).state,"empty"); });
ok("validateClass", () => { assert(t.validateClass({subject:" ",start:"09:00",end:"10:00"})); assert(t.validateClass({subject:"x",start:"10:00",end:"10:00"})); assert(t.validateClass({subject:"x",start:"",end:"10:00"})); assert.equal(t.validateClass({subject:"x",start:"09:00",end:"10:00"}), null); });
const ics = t.buildICS(data, wed(12,0));
ok("ICS: well-formed, CRLF, weekly rules", () => {
  assert(ics.startsWith("BEGIN:VCALENDAR\r\n")); assert(ics.endsWith("END:VCALENDAR\r\n"));
  assert.equal((ics.match(/BEGIN:VEVENT/g)||[]).length, 3);
  assert(ics.includes("RRULE:FREQ=WEEKLY;INTERVAL=1;COUNT=18")); assert(ics.includes("RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=9"));
  assert(!/[^\r]\n/.test(ics), "bare LF found");
});
ok("ICS: first date lands on right weekday & parity", () => {
  // 'Fizika' is even-week Wed. Today (Wed 7 Oct) is odd → first must be Wed 14 Oct.
  const blk = ics.split("BEGIN:VEVENT").find(b => b.includes("Fizika")); assert(blk.includes("DTSTART:20261014T100000"), blk);
  // 'Ingliz' odd-week Wed → today 7 Oct.
  const blk2 = ics.split("BEGIN:VEVENT").find(b => b.includes("Ingliz")); assert(blk2.includes("DTSTART:20261007T113000"), blk2);
});
ok("ICS: escapes commas/semicolons and folds long lines", () => {
  const x = t.buildICS({classes:[C({subject:"A, B; "+"x".repeat(100)})]}, wed(12,0));
  const BS = String.fromCharCode(92); assert(x.includes("A" + BS + ", B" + BS + "; ")); x.split("\r\n").forEach(l => assert(l.length <= 75, "line too long: "+l.length));
});
ok("scheduleText mentions subjects and parity", () => { const s = t.scheduleText(data,"odd"); assert(s.includes("toq hafta") && s.includes("Algebra") && !s.includes("Fizika")); });

console.log("gpa");
ok("points→grade boundaries", () => { assert.deepEqual([100,86,85,71,70,55,54,0].map(g.pointsToGrade), [5,5,4,4,3,3,2,2]); });
const cs = (credits, score) => ({ id: "x", name: "n", credits, score });
ok("uz5 points: credit-weighted GPA", () => { const s = g.statsFor("uz5","points",[{id:"s",name:"1",courses:[cs(4,90), cs(2,60)]}]); assert.equal(s.credits,6); assert.equal(s.weighted, 4*5+2*3); assert.ok(Math.abs(s.gpa - 26/6) < 1e-9); });
ok("uz5 grade mode ignores out-of-range", () => { const s = g.statsFor("uz5","grade",[{id:"s",name:"1",courses:[cs(3,5), cs(3,1), cs(3,6)]}]); assert.equal(s.count,1); assert.equal(s.gpa,5); });
ok("incomplete rows are skipped, not counted as zero", () => { const s = g.statsFor("uz5","points",[{id:"s",name:"1",courses:[cs(3,null), cs(null,80), cs(0,80), cs(3,80)]}]); assert.equal(s.count,1); assert.equal(s.credits,3); });
ok("failed course counts in GPA but not in earned credits", () => { const s = g.statsFor("uz5","points",[{id:"s",name:"1",courses:[cs(4,40), cs(4,90)]}]); assert.equal(s.credits,8); assert.equal(s.earned,4); assert.equal(s.gpa,(4*2+4*5)/8); });
ok("us4: A=4.0, F earns nothing", () => { const s = g.statsFor("us4","points",[{id:"s",name:"1",courses:[cs(3,4.0), cs(3,0)]}]); assert.equal(s.gpa,2); assert.equal(s.earned,3); });
ok("empty → gpa null", () => assert.equal(g.statsFor("uz5","points",[]).gpa, null));
const done = { credits: 60, weighted: 60*4.2, earned: 60, count: 10, gpa: 4.2 };
ok("goal: attainable", () => { const r = g.neededAverage("uz5", 4.5, done, 60); assert.equal(r.kind,"needs"); assert.ok(Math.abs(r.average - 4.8) < 1e-9); assert.equal(r.feasible, true); });
ok("goal: impossible flagged", () => { const r = g.neededAverage("uz5", 4.9, done, 30); assert.equal(r.kind,"needs"); assert.equal(r.feasible,false); });
ok("goal: already safe → reached", () => assert.equal(g.neededAverage("uz5", 3.0, done, 10).kind, "reached"));
ok("goal: no remaining credits → reached", () => assert.equal(g.neededAverage("uz5", 4.5, done, 0).kind, "reached"));

console.log("planner");
const now = new Date(2026,9,9,10,0);
const T = (o) => ({ id: Math.random()+"", title: "t", priority: "normal", done: false, ...o });
ok("task grouping", () => {
  const r = p.groupTasks([T({due:"2026-10-08"}),T({due:"2026-10-09"}),T({due:"2026-10-10"}),T({due:"2026-10-16"}),T({due:"2026-10-17"}),T({}),T({due:"2026-10-09",done:true})], now);
  assert.deepEqual(p.TASK_GROUP_ORDER.map(k=>r[k].length), [1,1,1,1,1,1]);
});
ok("high priority sorts first within same day", () => { const r = p.groupTasks([T({title:"a",due:"2026-10-09"}),T({title:"b",due:"2026-10-09",priority:"high"})], now); assert.equal(r.today[0].title,"b"); });
ok("exam today at a later hour is still upcoming; earlier hour is past", () => {
  const later = {id:"1",subject:"x",type:"final",date:"2026-10-09",time:"14:00"}, earlier = {id:"2",subject:"y",type:"final",date:"2026-10-09",time:"09:00"};
  assert.equal(p.upcomingExams([later,earlier],now).length,1); assert.equal(p.pastExams([later,earlier],now).length,1);
});
ok("exam with no time stays upcoming all day", () => assert.equal(p.upcomingExams([{id:"1",subject:"x",type:"dtm",date:"2026-10-09"}], new Date(2026,9,9,23,0)).length, 1));
ok("countdown labels", () => { const e = (d)=>({id:"1",subject:"x",type:"final",date:d}); assert.equal(p.examCountdown(e("2026-10-09"),now).label,"Bugun!"); assert.equal(p.examCountdown(e("2026-10-10"),now).label,"Ertaga"); const c = p.examCountdown(e("2026-10-20"),now); assert.equal(c.label,"11 kun"); assert.equal(c.urgent,false); });

console.log("focus");
const S = (iso, m) => ({ id: iso, at: iso, minutes: m });
ok("minutesOn sums per local day", () => { const log = {sessions:[S(new Date(2026,9,9,8,0).toISOString(),25),S(new Date(2026,9,9,20,0).toISOString(),50),S(new Date(2026,9,8,9,0).toISOString(),25)]}; assert.equal(f.minutesOn(log,new Date(2026,9,9)),75); });
ok("streak counts back from today", () => { const d=(day)=>S(new Date(2026,9,day,12,0).toISOString(),25); assert.equal(f.streak({sessions:[d(9),d(8),d(7)]}, now),3); });
ok("streak survives an unstudied today", () => { const d=(day)=>S(new Date(2026,9,day,12,0).toISOString(),25); assert.equal(f.streak({sessions:[d(8),d(7)]}, now),2); });
ok("streak breaks on a gap", () => { const d=(day)=>S(new Date(2026,9,day,12,0).toISOString(),25); assert.equal(f.streak({sessions:[d(9),d(7)]}, now),1); assert.equal(f.streak({sessions:[d(5)]}, now),0); });
ok("lastDays is 7 long, oldest first", () => { const r = f.lastDays({sessions:[]}, now); assert.equal(r.length,7); assert.equal(r[6].date.getDate(),9); assert.equal(r[0].date.getDate(),3); });
ok("fmtClock rounds up so 0.4s still shows 00:01", () => { assert.equal(f.fmtClock(25*60000),"25:00"); assert.equal(f.fmtClock(400),"00:01"); assert.equal(f.fmtClock(-5),"00:00"); });

console.log("attendance");
ok("limit math at 25% of 72h", () => { const s = a.statusOf({id:"1",name:"x",totalHours:72,missedHours:0,limitPct:25}); assert.equal(s.allowed,18); assert.equal(s.left,18); assert.equal(s.risk,"ok"); });
ok("warn at 60% used; danger at 100%; over counted", () => {
  const mk = (m)=>a.statusOf({id:"1",name:"x",totalHours:72,missedHours:m,limitPct:25});
  assert.equal(mk(10).risk,"ok"); assert.equal(mk(11).risk,"warn"); assert.equal(mk(18).risk,"danger"); assert.equal(mk(18).left,0); assert.equal(mk(22).over,4);
});
ok("zero allowance: any miss is danger, none is ok", () => { const mk=(m)=>a.statusOf({id:"1",name:"x",totalHours:2,missedHours:m,limitPct:25}); assert.equal(mk(0).risk,"ok"); assert.equal(mk(1).risk,"danger"); });

const sk = require("../.test-out/lib/toolkit/skills.js");
const m = require("../.test-out/lib/toolkit/matching.js");
console.log("skills");
const SK = (name, level = 3, logs = []) => ({ id: name, name, category: "dastur", level, goal: 5, logs, createdAt: "2026-01-01T00:00:00Z" });
ok("totalMinutes / weekMinutes only count the last 7 days", () => {
  const skill = SK("Python", 3, [{id:"1",date:"2026-10-09",minutes:30},{id:"2",date:"2026-10-03",minutes:45},{id:"3",date:"2026-10-02",minutes:60}]);
  assert.equal(sk.totalMinutes(skill), 135); assert.equal(sk.weekMinutes(skill, new Date(2026,9,9,12)), 75);
});
ok("goalProgress: level 3 of goal 5 is 50%; at/above goal is 100%", () => { assert.equal(sk.goalProgress({...SK("x",3), goal:5}), .5); assert.equal(sk.goalProgress({...SK("x",5), goal:5}), 1); assert.equal(sk.goalProgress({...SK("x",1), goal:5}), 0); });
ok("lastLogDate picks the newest", () => assert.equal(sk.lastLogDate(SK("x",1,[{id:"a",date:"2026-01-02",minutes:1},{id:"b",date:"2026-03-01",minutes:1}])), "2026-03-01"));
ok("fmtHours", () => { assert.equal(sk.fmtHours(45), "45 daq"); assert.equal(sk.fmtHours(120), "2 soat"); assert.equal(sk.fmtHours(90), "1.5 soat"); });
console.log("job matching");
const J = (o) => ({ id: "1", title: "Ish", company: "X", location: "Toshkent", type: "part-time", description: "", requirements: [], tags: [], scheduleCompatible: [], postedAt: "", applications: 0, ...o });
ok("a skill in the tags scores high and explains why", () => { const r = m.scoreJob(J({ title: "Backend stajyor", tags: ["Python","Django"] }), [SK("Python", 4)]); assert(r.score >= 60, r.score); assert(r.reasons.includes("Python ko'nikmangiz mos")); });
ok("no matching skill → 0", () => assert.equal(m.scoreJob(J({ title: "Kassir", tags: ["Savdo"] }), [SK("Python", 5)]).score, 0));
ok("body-only mention scores lower than a tag/title hit", () => { const a = m.scoreJob(J({ tags: ["Python"] }), [SK("Python")]).score, b = m.scoreJob(J({ description: "Python bilish afzallik" }), [SK("Python")]).score; assert(a > b && b > 0, a + " vs " + b); });
ok("higher self-rated level weighs more", () => assert(m.scoreJob(J({ tags: ["SQL"] }), [SK("SQL", 5)]).score > m.scoreJob(J({ tags: ["SQL"] }), [SK("SQL", 1)]).score));
ok("abbreviations: skill 'JavaScript' matches a React job", () => assert(m.scoreJob(J({ title: "React dasturchi" }), [SK("JavaScript")]).score > 0));
ok("whole-word match: 'js' does not match 'jsonwebtoken'", () => assert.equal(m.scoreJob(J({ description: "uses jsonwebtoken" }), [SK("JS")]).score, 0));
ok("regex special characters in a skill name cannot break matching", () => assert.doesNotThrow(() => m.scoreJob(J({ title: "C++ dasturchi" }), [SK("C++"), SK("(a"), SK("[x")])));
ok("student-friendly jobs get a bonus (only when a skill matched)", () => { const base = m.scoreJob(J({ tags: ["Excel"] }), [SK("Excel")]), fr = m.scoreJob(J({ tags: ["Excel"], studentFriendly: "ha" }), [SK("Excel")]); assert(fr.score > base.score && fr.reasons.includes("Talaba grafigiga mos")); assert.equal(m.scoreJob(J({ studentFriendly: "ha" }), [SK("Excel")]).score, 0); });
ok("rigid full-time jobs are penalised for students with many class hours", () => { const job = J({ type: "full-time", tags: ["Python"] }); assert(m.scoreJob(job, [SK("Python")], { classHoursPerWeek: 24 }).score < m.scoreJob(job, [SK("Python")], { classHoursPerWeek: 4 }).score); });
ok("score is clamped to 0–100", () => { const r = m.scoreJob(J({ title: "Python SQL Excel", tags: ["Python","SQL","Excel"], studentFriendly: "ha" }), [SK("Python",5), SK("SQL",5), SK("Excel",5)]); assert(r.score <= 100 && r.score >= 90); });
ok("rankJobs sorts best match first", () => { const r = m.rankJobs([J({ id: "a", title: "Kassir" }), J({ id: "b", tags: ["Python"] })], [SK("Python")]); assert.deepEqual(r.map(x => x.job.id), ["b","a"]); });
ok("weeklyClassHours: odd/even-week classes count half", () => assert.equal(t.weeklyClassHours({ classes: [C({start:"09:00",end:"11:00"}), C({start:"09:00",end:"11:00",weeks:"odd"})] }), 3));

console.log(`\n${n} checks passed`);
