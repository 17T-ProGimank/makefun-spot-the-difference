# Twin Lookout — Spot the Difference

[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/17T-ProGimank/makefun-spot-the-difference/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/17T-ProGimank/makefun-spot-the-difference/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

Two pictures. Seven differences. One sharp eye.

**Twin Lookout** is an original spot-the-difference game built for the
[make.fun bounty](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451).
Every scene is painted fresh in code on a canvas — no image files, no network,
no libraries. Play it with mouse or keyboard, in any desktop browser, straight
from the static files under `game/`.

Play it via my referral link: https://make.fun/r/m4psg5rh

## How to play

- Study the twin scenes side by side and **click a difference on either
  picture**. Found differences get a red ring on both panels.
- **7 differences per scene, 3 scenes**: a lakeside cabin, a night campfire,
  and a harbour at sunrise. Clear all three before the clock runs out.
- **Scoring**: +100 per find (Blitz: +150), +10 per streak step, −25 for a
  wrong click, time bonus of +5 per second left at the end of a round.
- **Hints**: press `H` or the Hint button — a pulsing ring points at one
  remaining difference (−50 points, 3 per round).
- **Keyboard**: arrow keys move the crosshair, `Enter`/`Space` picks,
  `H` hint, `P` pause, `M` mute. `Shift` + arrows moves the crosshair slowly.
- **Difficulties**: Relaxed (3:00), Classic (2:00), Blitz (1:00, ×1.5 points).
- Best score is saved in your browser.

## Screenshots

The cover shows a mid-hunt moment: three differences found and ringed, four
still hiding, the counter reading `3 / 7 found · 4 left`. The set also shows
the menu, a late hunt with a hint pulsing on the last difference, and a
cleared scene with its score breakdown.

## Files

- `game/index.html` — page, HUD and overlays
- `game/styles.css` — lodge-paper look
- `game/src/scenes.js` — the three procedural scenes and their 21 differences
- `game/src/game.js` — rounds, timer, score, hints, input, frame loop
- `game/src/audio.js` — synthesized WebAudio sounds (no audio files)
- `game/src/rng.js` — seeded random helpers
- `game/src/main.js` — bootstrap and `?shot=` staging for screenshots
- `main.ts` — hand-in program (copies `game/` + `screenshots/`, writes the dossier)
- `serve.ts` — tiny local static server (`node serve.ts`, then http://localhost:8080)

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## License

MIT — see [LICENSE](LICENSE).
