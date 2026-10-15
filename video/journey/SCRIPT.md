# Journey film — voiceover script

Verbatim lines from the task brief. Voice: Kokoro-82M `af_heart`, speed 0.9, generated locally
with `npx hyperframes@0.8.161 tts "<line>" -v af_heart -s 0.9 -o lN.wav`. Each take is placed at
its offset, mixed to one track, gained +5.5 dB with a −2 dBFS peak limiter (≈ −17 LUFS), and saved
as `assets/voiceover.wav` (58.0 s, 24 kHz mono).

| # | Offset (s) | Scene | Line |
|---|---|---|---|
| 1 | 1.2 | S1 vague message (0–5.6) | You found a bug. Now you have to explain it. |
| 2 | 6.2 | S2 install (5.6–12.2) | Bugmark is a free Chrome extension. Add it in two clicks — no account. |
| 3 | 12.8 | S3 capture (12.2–20.4) | When something breaks, click Bugmark. Circle the problem, or record your screen. |
| 4 | 21.0 | S4 report builds itself (20.4–32.6) | Behind the scenes, Bugmark notes every step you took and what went wrong inside the page — the details developers always ask for. |
| 5 | 33.2 | S5 send (32.6–41.4) | Send it straight to GitHub, or share it however your team works. |
| 6 | 42.0 | S6 developer fixes it (41.4–50.4) | Your developer sees exactly what you saw — and fixes it, without the back-and-forth. |
| 7 | 51.0 | S7 outro (50.4–58.0) | Bugmark. Bug reports anyone can send. |

Caption cues in `compositions/captions.html` split each line at its spoken pauses (measured with
ffmpeg `silencedetect` on each take), so caption text always equals the spoken words.

Voice-only: the film ships with narration only, no music bed. The licence for "Happy Beats /
Business Moves vol. 12" by ende.app (used in the earlier Bugmark film) is unconfirmed and this
repo is public, so the music carve was removed. Licensed music can be added back later.
