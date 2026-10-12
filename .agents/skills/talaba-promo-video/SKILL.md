---
name: talaba-promo-video
description: Use to edit, re-render, or verify the Talaba promo videos (YouTube 16:9 ~60s, Instagram 9:16 ~30s, Uzbek voice-over) in /promo, or to make a new cut.
---

# Promo videos (`promo/`)

Pipeline: `script.py` (Uzbek lines → `audio/*.mp3` via Microsoft `uz-UZ-SardorNeural` using `edge-tts`, measures durations → `timeline.json`) → `player.html` (canvas scenes + synthesized music/SFX + captions) → in-browser **offline frame-by-frame** render with WebCodecs (H.264 + AAC) muxed with `mp4-muxer` → `out/*.mp4`.

## Steps
1. Edit `SCRIPTS` in `script.py` (scene, spoken text, on-screen caption). Spoken text may differ from the caption (e.g. "nuqta uz" vs "talaba.uz"). `python script.py "+4%"` regenerates audio + timeline.
2. `python serve.py` (port 3200) and open `http://127.0.0.1:3200/player.html?v=yt` (or `v=ig`). Add `&t=12.5` for a still frame. Review stills at full size (use a canvas `toBlob` → POST to `/save?name=x.png`).
3. Render with **MP4 (kadrma-kadr)** button / `renderOffline()`. It does **not** need the pane visible. (Real-time `MediaRecorder` capture needs a visible pane — a hidden pane records a blank video.)
4. **Verify the file natively** — never trust a `<video>` element in a hidden page. macOS: AVFoundation (`AVAssetImageGenerator` for frames, `afconvert -f WAVE -d LEI16` for audio analysis).
   Check: resolution/fps, duration ≈ timeline total, audio peak < 0.95 (no clipping), voice 9–12 dB above music, scenes/captions clear of the caption zone.
5. Content-safe zones: landscape content above y≈830; portrait between y≈230 and 1490 (Instagram UI overlays top/bottom). Captions are burned in for muted viewing.

## Rules
- No fabricated stats or testimonials; mock UI numbers are sample data.
- Music/SFX are synthesized in code (no licensing). Voice terms: Microsoft's unofficial Edge TTS — check terms before commercial use.
- MP4 renders are git-ignored; keep sources small.
