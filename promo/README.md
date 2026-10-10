# TALABA promo videos

| File | Format | Length |
|---|---|---|
| `talaba-youtube-16x9.mp4` | 1920×1080, 30 fps | ~60 s (YouTube) |
| `talaba-instagram-9x16.mp4` | 1080×1920, 30 fps | ~30 s (Reels / Stories) |

Uzbek voice-over: Microsoft neural voice `uz-UZ-SardorNeural`. Music and sound effects are synthesized in code
(no licensed audio). Captions are burned in so the videos work with sound off.

## Edit the script / regenerate

1. `python3 -m venv .venv && .venv/bin/pip install edge-tts`
2. Edit the lines in `script.py` (`SCRIPTS`: scene, spoken text, on-screen caption), then
   `.venv/bin/python script.py "+4%"` — re-synthesizes `audio/*.mp3` and rewrites `timeline.json`
   (scene timing follows the real length of each voice line).
3. `python3 serve.py` and open `http://127.0.0.1:3200/player.html?v=yt` (or `?v=ig`) in Chrome.
   - **Ko'rish** previews with sound.
   - **MP4 (kadrma-kadr)** renders frame by frame (H.264 + AAC, faster than real time) and saves to `out/`.
     It needs a Chromium browser with WebCodecs AAC encoding and loads `mp4-muxer` from jsDelivr.
   - Append `&t=12.5` to preview a single still frame at that time.

Scenes and brand colours live in `player.html`; the numbers shown in the mock UI (GPA 4.71, 12 days, …) are sample data.
