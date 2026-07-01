from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
import os

from app import db
from models import User, AISession

ai_bp = Blueprint("ai", __name__)

# Groq model — llama-3.3-70b-versatile is fast, free tier, and high quality.
# Alternatives: "llama-3.1-8b-instant" (ultra-fast), "mixtral-8x7b-32768" (large context)
GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """Siz TALABA AI — O'zbekistondagi universitetlarda o'qiydigan talabalar uchun rasmiy AI yordamchisisiz.

Siz talabalarga quyidagi mavzularda yordam berishga ixtisoslashgansiz:
- 🎓 Qabul va DTM (Davlat Test Markazi, ballar, hujjat topshirish jarayoni, qabul tartib-qoidalari)
- 🏠 Talabalar turargohi va ijara (yotoqxonaga joylashish, shartnoma, ijaraga uy topish)
- 💰 Stipendiya va moliya (grant/kontrakt statusi, stipendiya to'lovlari, bank hisobi ochish)
- 🪖 Harbiy hisob (harbiy komissariatda ro'yxatdan o'tish tartibi)
- 📚 Universitet hayoti (fanlarni tanlash, imtihonlar, akademik qarz)
- 💼 Ish va amaliyot (part-time ish topish, mehnat huquqlari, stajirovka)
- 🚌 Kundalik hayot (transport, ovqatlanish, shahar hayoti maslahatlari)
- 🌍 Til o'rganish (IELTS/TOEFL tayyorgarligi, chet tillarini o'rganish)
- 🆘 Favqulodda holatlar bo'yicha yo'l-yo'riq (politsiya 102, tez yordam 103)

Ko'rsatmalar:
- Iliq, rag'batlantiruvchi va amaliy bo'ling
- Kerak bo'lganda qadam-baqadam ko'rsatmalar bering
- Tegishli o'zbek davlat tizimlariga murojaat qiling (my.gov.uz, DTM sayti, soliq.uz)
- Javoblarni qisqa tuting — qadamlar uchun ro'yxatlardan foydalaning
- Talaba qaysi tilda yozsa, o'sha tilda javob bering (odatda o'zbek tilida)
"""


def _get_client():
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return None
    from groq import Groq
    return Groq(api_key=api_key)


@ai_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    history = data.get("history") or []

    if not message:
        return jsonify({"error": "Xabar matni talab qilinadi."}), 400

    client = _get_client()
    if client is None:
        return jsonify({
            "error": "AI sozlanmagan. backend/.env fayliga GROQ_API_KEY qo'shing."
        }), 503

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    for turn in history[-10:]:
        role = turn.get("role")
        content = turn.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=600,
            temperature=0.7,
        )
        reply = response.choices[0].message.content.strip()
    except Exception as e:
        return jsonify({"error": f"Groq xatoligi: {str(e)}"}), 502

    # Optionally save history if user is authenticated
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id:
            session = AISession.query.filter_by(user_id=int(user_id)).order_by(
                AISession.updated_at.desc()
            ).first()
            if not session:
                session = AISession(user_id=int(user_id), messages=[])
                db.session.add(session)
            msgs = list(session.messages or [])
            msgs.append({"role": "user", "content": message})
            msgs.append({"role": "assistant", "content": reply})
            session.messages = msgs[-40:]
            db.session.commit()
    except Exception:
        pass

    return jsonify({"reply": reply}), 200


@ai_bp.route("/translate", methods=["POST"])
def translate():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    target = data.get("target", "uz")

    if not text:
        return jsonify({"error": "Matn talab qilinadi."}), 400

    client = _get_client()
    if client is None:
        return jsonify({"error": "AI sozlanmagan."}), 503

    lang_names = {"uz": "Uzbek (Latin script)", "ru": "Russian", "en": "English"}
    lang_name = lang_names.get(target, "Uzbek (Latin script)")
    prompt = f"Translate the following text to {lang_name}. Return only the translation:\n\n{text}"

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.2,
        )
        translation = response.choices[0].message.content.strip()
    except Exception as e:
        return jsonify({"error": str(e)}), 502

    return jsonify({"translation": translation, "original": text, "target": target}), 200


@ai_bp.route("/restaurants", methods=["POST"])
def restaurants():
    data = request.get_json(silent=True) or {}
    city = (data.get("city") or "Toshkent").strip()
    region = (data.get("region") or "").strip()

    client = _get_client()
    if client is None:
        return jsonify({"error": "AI sozlanmagan."}), 503

    region_line = f"Talaba {region} viloyatidan." if region else "Talabaning qaysi viloyatdan ekani noma'lum."
    prompt = f"""Siz O'zbekistondagi talabalar uchun mahalliy taomlanish bo'yicha yo'l-yo'riq beruvchisiz.

{region_line}
Talaba hozir {city} shahrida.

Aynan quyidagi tuzilishga ega JSON obyektini qaytaring:
{{
  "milliy": [
    {{ "name": "...", "type": "...", "price": "...", "rating": 4.7, "note": "...", "emoji": "..." }}
  ],
  "boshqa": [
    {{ "name": "...", "type": "...", "price": "...", "rating": 4.5, "note": "...", "emoji": "..." }}
  ]
}}

Qoidalar:
- "milliy": {city} shahrida talabalar orasida mashhur, arzon 1 ta o'zbek milliy taomxonasi. Narxni so'mda ko'rsating.
- "boshqa": {city} shahrida joylashgan 4-5 ta xalqaro yoki boshqa mintaqaviy taom turlari (agar {region if region else "noma'lum"} viloyatiga xos taomxona bo'lsa, birinchi o'ringa qo'ying, keyin boshqa mashhur variantlarni — turk, koreys, italyan, xitoy va h.k.). Narxni so'mda ko'rsating.
- "note" — talaba uchun bir jumlalik amaliy maslahat.
- "emoji" — taom turiga mos bitta emoji.
- Faqat sof JSON qaytaring. Markdown, izoh yoki qo'shimcha matn bo'lmasin."""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=700,
            temperature=0.6,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        import json
        result = json.loads(raw)
    except Exception as e:
        return jsonify({"error": f"AI xatoligi: {str(e)}"}), 502

    return jsonify(result), 200


@ai_bp.route("/health", methods=["GET"])
def health():
    has_key = bool(os.environ.get("GROQ_API_KEY"))
    return jsonify({"status": "ok", "ai_configured": has_key, "provider": "groq", "model": GROQ_MODEL}), 200
