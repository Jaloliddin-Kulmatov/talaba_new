import asyncio, json, os, sys
import edge_tts
VOICE = "uz-UZ-SardorNeural"
RATE = sys.argv[1] if len(sys.argv) > 1 else "+0%"

# scene = which visual plays while this line is spoken; caption = what is burned in on screen.
SCRIPTS = {
 "yt": [
  ("hook",      "Dars jadvali bir joyda, GPA boshqa joyda, vazifalar esa umuman esdan chiqqan. Tanish holatmi?",
                "Jadval bir joyda, GPA boshqa joyda, vazifalar esdan chiqqan. Tanish holatmi?"),
  ("brand",     "Endi hammasi bir joyda. TALABA — o'zbek talabalari uchun yagona platforma.",
                "Endi hammasi bir joyda. TALABA — o'zbek talabalari uchun yagona platforma."),
  ("timetable", "Dars jadvalingizni bir marta kiriting. Hozirgi va keyingi darsingiz doim ko'z oldingizda. Toq va juft haftalar ham hisobga olinadi, jadvalni esa bir bosishda Telegramga ulashasiz.",
                "Jadvalni bir marta kiriting. Toq va juft haftalar, Telegramga ulashish."),
  ("gpa",       "GPA ni hisoblang va maqsadingizga erishish uchun qanday baho kerakligini darhol bilib oling.",
                "GPA ni hisoblang — maqsadga qanday baho kerakligini bilib oling."),
  ("tools",     "Vazifalar va imtihongacha qolgan kunlar, fokus taymer, davomat nazorati. Hammasi qo'lingizda.",
                "Vazifalar, imtihon sanog'i, fokus taymer va davomat nazorati. Hammasi qo'lingizda."),
  ("platform",  "Bundan tashqari — talabalar klublari, ish va amaliyot, qabul va DTM bo'yicha qo'llanmalar, turargoh, stipendiya va har doim yoningizda bo'ladigan sun'iy intellekt yordamchisi.",
                "Klublar, ish va amaliyot, qabul va DTM, turargoh, stipendiya va AI yordamchi."),
  ("cta",       "Ro'yxatdan o'tmasdan ham ishlaydi. Bepul. TALABA nuqta uz. Hoziroq boshlang!",
                "Ro'yxatdan o'tmasdan ham ishlaydi. Bepul. Hoziroq boshlang!"),
 ],
 "ig": [
  ("hook",      "Jadval alohida, GPA alohida, vazifalar esdan chiqqan? Yetar!",
                "Jadval alohida, GPA alohida, vazifalar esdan chiqqan? Yetar!"),
  ("brand",     "TALABA — o'zbek talabalari uchun yagona platforma.",
                "TALABA — o'zbek talabalari uchun yagona platforma."),
  ("timetable", "Dars jadvalingiz doim ko'z oldingizda. Toq va juft haftalar bilan.",
                "Dars jadvalingiz doim ko'z oldingizda."),
  ("tools",     "GPA kalkulyator, vazifalar, fokus taymer va davomat nazorati.",
                "GPA, vazifalar, fokus taymer, davomat."),
  ("platform",  "Klublar, ish, qabul va sun'iy intellekt yordamchi ham shu yerda.",
                "Klublar, ish, qabul va AI yordamchi ham shu yerda."),
  ("cta",       "Bepul va ro'yxatdan o'tmasdan. TALABA nuqta uz!",
                "Bepul. Ro'yxatdan o'tmasdan. talaba.uz"),
 ],
}

async def main():
    out = {}
    for name, segs in SCRIPTS.items():
        out[name] = []
        for i, (scene, speak, caption) in enumerate(segs):
            fn = f"audio/{name}-{i}.mp3"
            await edge_tts.Communicate(speak, VOICE, rate=RATE).save(fn)
            dur = os.path.getsize(fn) * 8 / 48000      # edge-tts emits 48 kbps CBR mp3
            out[name].append({"scene": scene, "caption": caption, "file": fn, "dur": round(dur, 2)})
    json.dump(out, open("timeline.json", "w"), ensure_ascii=False, indent=1)
    for name, segs in out.items():
        tot = sum(s["dur"] for s in segs)
        print(name, "voice total %.1fs" % tot, [s["dur"] for s in segs])

asyncio.run(main())
