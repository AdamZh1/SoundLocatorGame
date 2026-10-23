# Architecture Fix List

_Review date: October 8, 2026. Status: open, none of these have been fixed yet._

## 1. Where `architecture.md` is wrong

| Doc says | Code does |
|---|---|
| A `src/types/index.ts` file holds shared interfaces | It doesn't exist. Types are written inline and copy-pasted. |
| 3 components | 13 components (`HomeScreen`, `EndScreen`, `CalibrationModal`, `MiniRadar`, `ResultRadar`, `ScorePopup`, `FireButtonCanvas`, `LiquidButtonCanvas`, …) plus `utils/` and `audioConfig.ts` |
| `AudioController` uses `useSpatialAudio` and fires `onPlayComplete` | `App` uses the hook. `AudioController` is a plain view component. `onPlayComplete` doesn't exist. |
| Moving to `GUESSING` happens when the sound ends | It's a `setTimeout(1000)` after `playAudio` returns, and `playAudio` returns as soon as the sound *starts* (`App.tsx:59`) |
| `playAudio(x, z, volume)` | `playAudio(x, z, volume, soundName, dotRef, ringRef)`. The audio hook takes DOM refs. |
| `inverse` distance model | `linear` with `rolloffFactor = 0`, plus a hand-written attenuation curve (`useSpatialAudio.ts:46-48, 77-78`) |
| `MatchHistory` shows a rolling average error | It shows total score out of 50,000. The `currentRound` prop is passed in but never used. |
| No mention of these | Calibration mode, a separate `appStage` (HOME/GAME), the scoring system, pending vs. confirmed guesses, drag-to-adjust |

The docs also disagree with each other:
- `CLAUDE.md` still requires the `inverse` model. `progress.md` (July 29) records the switch away from it.
- `progress.md` says scoring uses "exponential decay with divisor 30". The code uses quadratic falloff: `1 - (d/30)²`.
- `docs/instructions.md` is a finished one-off bug-fix task. Its numbers no longer match `LiquidButtonCanvas` (damping 0.9 vs. 0.95, clamp ±20 vs. ±50). It should be deleted or archived so an agent doesn't "re-apply" it.

## 2. Architectural issues (highest impact)

**a. The audio hook is tied to the UI.** `useSpatialAudio` takes `dotRef`/`ringRef` and writes `style.transform` onto RadarCanvas's DOM nodes. Because of that, `App` creates `listenerDotRef` and `radarRef` only to pass them through. Calibration passes in dummy `{ current: null }` refs to work around it. The hook should expose audio levels instead (an `AnalyserNode` or a `subscribe(level => …)` method), and RadarCanvas should run its own animation.

**b. Every sound shares one gain node, which also does two jobs.**
- `gainNode` holds both master volume and distance attenuation (`volume * attenuation`).
- `setVolume()` sets gain to the raw `volume`, which wipes the attenuation. Moving the slider during playback makes a 30m sound as loud as a 1m sound.
- This breaks the PRD rule that the slider "must not affect the spatial math".
- Fix: one gain node for distance (per sound) and a separate master gain node.

**c. One panner for all sounds, and leaky animation loops.** Every source goes through the same `PannerNode`, so overlapping plays move each other. Calibration makes this easy to hit: `isPlaying` resets almost immediately because `playAudio` returns at start. Each play also starts a new animation loop and overwrites `animationFrameRef`, so the earlier loop can never be cancelled. Create the filter, panner and gain nodes per sound (they're cheap) and return a Promise that resolves on `onended`. That also fixes the timing in section 1.

**d. Audio loading.**
- It creates an `AudioContext` on mount, before any user click. That conflicts with the PRD's autoplay rule and logs warnings. `OfflineAudioContext` or the real context after the first click would avoid this.
- Under StrictMode it runs twice and builds two contexts.
- Files are fetched one at a time with no `try/catch`. One bad decode leaves `loaded = false` forever, and the Play button stays disabled with no error shown.

**e. The game flow is implicit and the guess is stored in three places.**
- The game's state transitions are spread across seven handlers in `App`, plus a separate `appStage`.
- The guess lives in `pendingGuess` (App), `finalGuess` (App) and `markerPos`/`markerPosRef` (RadarCanvas).
- `finalGuess` duplicates the last `matchHistory` entry.
- `handlePlayAgain` doesn't reset `finalGuess` or `pendingGuess`.
- A `useReducer` holding a typed state machine fits within `CLAUDE.md`'s "no external state libraries" rule. It puts every transition in one place, makes impossible states unrepresentable, and can be tested as a pure function.

**f. No single coordinate system.** The meters-to-pixels conversion is written separately in RadarCanvas (twice), ResultRadar and MiniRadar, and they don't agree:
- Main radar: 400px wide = 40m radius.
- MiniRadar: 200px = **20m** radius (`metersPerPixel = 40 / rect.width`), yet it draws the same ring sizes as ResultRadar. Its rings therefore mean 5/10/15m while looking like 10/20/30m.
- Calibration can't select anything beyond ~20m, even though game targets go out to 35m.

One `radarMath.ts` file (`metersToPx`, `pxToMeters`, `RADAR_MAX_M`, `RING_DISTANCES`) plus one shared `<Radar>` base component would fix this and remove about 150 duplicated lines.

## 3. Code-level issues

- **Constants hard-coded in many places:** 5 rounds, 50,000, 40m, 35m, 30m and 10,000 points are written directly in 4–5 files. They belong in a `gameConfig.ts`.
- **Duplicated types:** the history-entry type is written out in full 3 times, and the `gameState` union twice.
- **Refs read during render:** RadarCanvas reads `radarRef.current.offsetWidth` while rendering. This is a React anti-pattern; it only works because the fallback of 200 happens to match the hard-coded `w-[400px]`.
- **Scoring logic inside a click handler:** it's inline in `handleGuessSubmit`. Pull it out as a pure `scoreGuess(target, guess)` function and add a unit test, since the formula has already changed twice.
- **UI sounds bypass the audio system:** each hover creates a `new Audio()` element and ignores master volume. A small `uiSounds` module that reuses preloaded buffers through the same context would be cleaner.
- **Mouse-only input:** drag uses `mousedown/mousemove`, so it doesn't work on touch screens. Pointer events cover both for free.
- **Fixed layout:** `w-1/4 / w-1/2 / w-1/4`, `h-screen` and a fixed 400px radar, so nothing adapts to screen size.
- **Volume display hack:** the slider's max is 0.5 and it's displayed as `volume * 200`%. Use a 0–1 slider and map it to gain inside the audio layer.
- **Weak types in places:** `any` in `FireButtonCanvas` particles and in `webkitAudioContext`. That goes against `CLAUDE.md`'s strict-typing rule.
- **Error stored rounded:** `error` is saved with `Math.round`, so any future average-error stat will be imprecise. Store raw values and round only for display.
- **Leftover files:** `prototype.html` is still tracked at the repo root, and `LiquidButtonCanvas` still has a "Debug" stroke in it.

## 4. Suggested order

1. ✅ _Done Oct 9, 2026: kept the manual curve and quadratic scoring; docs updated to match._ **Decide and document the truth:** confirm the attenuation model (manual curve vs. `inverse`) and the scoring formula, then update `CLAUDE.md` and rewrite `architecture.md` to match the code. Delete `instructions.md`.
2. ✅ _Done Oct 9, 2026: added and adopted by App, RadarCanvas, ResultRadar, MatchHistory, EndScreen, CalibrationModal, audioConfig, useSpatialAudio. MiniRadar left for step 5._ Add `types/`, `gameConfig.ts` and `radarMath.ts`. These carry little risk and unblock everything else.
3. ✅ _Done Oct 10, 2026 (fixes 2a–2d and the 1-second timing guess from section 1)._ Rework `useSpatialAudio`: per-sound node chain, separate master gain, a Promise that resolves when the sound ends, levels exposed instead of DOM refs, and safe loading.
4. ✅ _Done Oct 10, 2026: `game/gameReducer.ts` + `game/scoring.ts`; RadarCanvas is controlled; Play Again fully resets; `error` stored unrounded._ Move game state into a `useReducer` state machine and keep a single copy of the guess.
5. ✅ _Done Oct 10, 2026: shared `Radar`/`RadarPoint` in `components/Radar.tsx`, percentage positioning, MiniRadar now 40m._ Merge the three radar components onto the shared math.

Steps 3 and 4 fix real bugs, not just tidiness: volume overriding distance, overlapping plays, the leaked animation loop, the 1-second timing guess, and the MiniRadar scale.
