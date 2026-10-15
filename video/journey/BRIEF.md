---
workflow: product-launch-video
flow: automation
storyboard: no
message: "Anyone who finds a website bug can send a report developers can act on — in one minute, no account."
destination: website-embed
aspect: 1920x1080
language: en
audience: "Non-technical people who find bugs — testers, PMs, designers, clients"
length: 60s
angle: journey
vo_mode: verbatim
---

## Intent

A ~60-second product-journey film for the Bugmark marketing site ("See Bugmark in one
minute" section). Show the whole journey: install → capture a bug → the report builds
itself → send → the developer fixes it. Calm, warm, plain-spoken; plain words only — no
"payload", "console", "network request", "HAR".

## Assets

- ../../web/public/screens/*.webp — real product screenshots (capture-menu, annotate,
  recording-bar, steps, console, network-response, github-dialog, export-dialog,
  report-cover, before-after), copied into assets/screens/.
- ../../web/public/logo.png — Bugmark app icon, copied to assets/logo.png.
- ../../web/app/fonts/BricolageGrotesque-latin-600-800.woff2 — display font.
- Geist (web/node_modules/geist) — UI text font.

## Customizations

- Voiceover lines are verbatim from the task brief (see SCRIPT.md).
- Captions burned in, synced to the voiceover, ≥ 44px at 1080p, bottom-centred on a
  subtle backing.
- Soft instrumental bed ducked under the voice; voiceover also exported to
  assets/voiceover.wav.

## Notes

- Visual language: Bugmark design system — white/neutral canvas, hairline borders, one
  blue accent #0071E3, Bricolage Grotesque display. Calm motion: punch-ins, slides,
  soft crossfades; no bounce, no flash.
- Price on screen is $7.99 one-time. Never $15.
- Output: 1920×1080, 30fps, 55–65s, web copy ≤ 8 MB at web/public/video/journey.mp4.
- No-capture mode: the brief supplies all source material; no site crawl.
- CLI pinned to hyperframes@0.8.161 (the installed skills target it; the earlier film used 0.8.72).
- Voice: local Kokoro-82M `af_heart` (no HeyGen/ElevenLabs credentials configured). See SCRIPT.md.
- Voice-only release: no music bed. The licence for "Happy Beats / Business Moves vol. 12" by
  ende.app (used in the earlier Bugmark film) is unconfirmed and this repo is public, so the film
  ships with narration only. Licensed music can be added back later.
