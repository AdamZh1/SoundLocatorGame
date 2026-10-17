# Project Progress

## Summary of Work (July 29, 2026)
- Investigated and addressed issues with spatial audio attenuation.
- Transitioned to custom, manual distance-based volume attenuation calculation.
- Improved the balance between close-range volume and distance-based falloff.

## Summary of Work (July 31, 2026)
- Refined the spatial audio attenuation formula to increase perceptibility at close range.
- Added labeled distance rings to the RadarCanvas for improved visual feedback.
- Implemented direct canvas clicking for placing and submitting guesses.

## Bugs Fixed
- Resolved a double-submission bug during drag-and-drop operations.
- Fixed coordinate stale state issues where guesses used pre-drag positions.

## Summary of Work (August 6, 2026)
- Implemented "Confirm Guess" button to transition from automatic guess submission to manual confirmation.
- Refactored UI layout in `App.tsx` for the center panel to use a relative wrapper, preventing layout shifts when the "Confirm Guess" button appears.

## Summary of Work (August 7, 2026)
- Implemented scoring system based on Euclidean distance error with exponential decay for point calculation (max 10,000 points).
- Added total score counter (out of 50,000) to the match history panel.
- Replaced auto-progression with a manual "Next Round" / "See Final Score" button.
- Visualized the target location on the radar with a blue dot and coordinate label.
- Constrained target generation to be within the radar's circular bounds.

## Bugs Fixed
- Fixed coordinate system inconsistencies (mixing X/Y vs X/Z) causing NaN labels and incorrect marker positioning on the canvas.
- Fixed target generation logic that allowed sound sources to appear outside the radar boundaries.

## Summary of Work (August 10, 2026)
- Implemented switchable sound effect support using `AudioBufferSourceNode`.
- Refactored `useSpatialAudio` to support pre-loading multiple audio assets from `public/` using `src/audioConfig.ts`.
- Added a "Calibration" mode (modal) for testing spatial audio behavior (distances/directions) and volume adjustment.
- Connected the calibration volume slider to the main app volume state.

## Bugs / Known Issues
- Calibration modal playback is inconsistent (audio sometimes fails to play).
- Calibration volume slider is not perfectly synced with the main side-panel slider.

## Summary of Work (August 11, 2026)
- Refactored `useSpatialAudio` to decouple audio buffer loading from `AudioContext` initialization.
- Fixed inconsistent calibration audio playback by enforcing lazy initialization.
- Synchronized volume slider ranges and steps between the main `AudioController` and the `CalibrationModal`.

## Bugs Fixed
- Resolved calibration audio failure to play on initial interaction.
- Fixed volume slider range/synchronization discrepancy between the main panel and calibration modal.

## Summary of Work (August 16, 2026)
- Implemented a Pinna Filter in `useSpatialAudio.ts` using a `BiquadFilterNode` (`highshelf`) to solve front-back acoustic confusion, utilizing a smooth linear ramp for gain reduction on sounds behind the player.
- Enhanced `CalibrationModal` by adding an interactive mini-radar canvas with concentric rings (10m, 20m, 30m) and a mode-switching UI, allowing users to select target coordinates visually or via buttons.

## Bugs Fixed
- Corrected inverted Pinna Filter directionality (front-back confusion).
- Adjusted Pinna Filter intensity for a more natural sound profile.
- Resolved UI state regression in `CalibrationModal` caused by experimental coordinate input features.

## Bugs / Known Issues
- Intermittent initial audio glitch: sounds briefly play at the origin `(0, 0, 0)` on the very first play, specifically in the calibration mode.

## Summary of Work (August 21, 2026 - Continued)
- Verified that the new "Home Screen" entry point successfully resolves the intermittent initial audio origin-glitch by ensuring `AudioContext` is fully initialized and resumed via user interaction before game start.

## Bugs Fixed
- Resolved the intermittent initial audio glitch (sounds playing at `(0, 0, 0)` on the first play).

## Summary of Work (August 23, 2026)
- Implemented interactive End Screen with scrollable, multi-accordion round summaries using Tailwind CSS.
- Implemented real-time audio visualization: center listener dot and outer radar ring pulse in sync with audio volume using AnalyserNode.
- Added animated score popup on ROUND_REVEAL (currently non-functional).

## Bugs Fixed
- Fixed coordinate mapping error in ResultRadar (radius vs. diameter issue).
- Fixed listener dot alignment glitch caused by CSS transform conflicts.
- Fixed green guess marker appearing automatically before user click.

## Bugs / Known Issues
- Score popup animation is currently not rendering/animating correctly.

## Summary of Work (August 27, 2026)
- Adjusted `ScorePopup` animation to start/end higher for better positioning.
- Added continuous pulsating animation (`pulse-size`) to the `ScorePopup` text.
- Updated audio file loading paths to `public/game_audio_comp/`.
- Implemented UI sound playback (`jingles_STEEL10.ogg`) triggered upon `ScorePopup` appearance.

## Bugs Fixed
- Adjusted animation keyframes to prevent overlapping/clipping and achieve desired positioning.

## Summary of Work (August 29, 2026)
- Implemented "Pure Black Void" minimalist UI theme across the entire application.
- Added and refined a minimalist, breathing monochromatic underglow for the `RadarCanvas`.
- Adjusted the scoring system formula to be stricter (decay divisor 40 -> 30).
- Unified UI button interaction sounds to `jingles_NES10.ogg` using a new `audioHelper` utility.
- Restored `jingles_STEEL10.ogg` specifically for the `ScorePopup`.

## Bugs Fixed
- Resolved UI gradient border offset issues on the Start button by adjusting container sizing and centering.
- Corrected audio playback assignment for the `ScorePopup`.

## Summary of Work (August 29, 2026 - Continued)
- Added hover sound effects (`mouserelease1.ogg`) to UI buttons.
- Implemented high-performance, stateless 2D liquid physics simulation for the 'Play Again' button.

## Bugs Fixed
- Resolved layout conflicts caused by mixing Tailwind classes and absolute positioning.
- Fixed canvas initialization and React strict mode issues to ensure stable animation.

## Summary of Work (August 31, 2026)
- Refactored `audioConfig.ts` to support display names for audio files, updating `CalibrationModal` and `useSpatialAudio` accordingly.
- Added `playHoverSound` to the homepage "Start" button.
- Implemented a custom canvas-based, procedural blue-fire effect on the homepage "Start" button hover, featuring smooth fade-in/out and organic flame motion.

## Bugs Fixed
- Resolved Type-safety errors caused by incorrect import syntax in `FireButtonCanvas` and `HomeScreen`.
- Fixed canvas rendering and particle visibility issues in `FireButtonCanvas`.
- Corrected the leftward bias in the flame particle animation using phase-based randomization.
- Resolved uniform particle cutoff at the top of the flame effect.

## Next Steps
- None. UI sound effects implementation complete.

## Summary of Work (October 9, 2026)
- Architecture fix list step 1: synced docs with the code.
- Confirmed the manual attenuation curve `max(0, 1 - (d/50)^0.75)` as the official distance model (panner is `linear` with `rolloffFactor = 0`). Updated `CLAUDE.md` and `features.md`, which still required `inverse`.
- Clarified scoring: it is quadratic falloff `10000 * (1 - (error/30)^2)`, not exponential decay as written above on August 7/29.
- Rewrote `docs/architecture.md` to describe the current code.
- Deleted `docs/instructions.md` (finished one-off bug-fix task with outdated values).
- Architecture fix list step 2: added `src/types/index.ts`, `src/gameConfig.ts` and `src/utils/radarMath.ts`, and replaced duplicated inline types and hard-coded constants with them. No behavior change.

## Summary of Work (October 10, 2026)
Finished steps 3–5 of `docs/ArchitectureFixList.md` (all five steps are now done).

- **Step 3: reworked `useSpatialAudio`.**
  - Each sound gets its own filter → panner → distance gain chain, feeding a shared master gain (volume slider) → analyser.
  - `playAudio(x, z, soundName)` resolves when the sound ends; the game moves to GUESSING right after, replacing the fixed 1s timeout.
  - The hook no longer takes DOM refs. It exposes `subscribeLevel`, and `RadarCanvas` animates its own listener dot and ring.
  - Sounds load in parallel via `OfflineAudioContext` (no `AudioContext` before the first click), once per page, with per-file error handling. A load failure is shown under the Play button.
- **Step 4: moved the round loop into a `useReducer` state machine** (`src/game/gameReducer.ts`).
  - Phases are a discriminated union; the guess only exists on the `GUESSING` phase, and the revealed guess is read from the last `history` entry. `pendingGuess`, `finalGuess` and RadarCanvas's `markerPos` copy are gone.
  - `RadarCanvas` is now controlled: it draws the `guess` prop and reports moves via `onGuessChange`.
  - Scoring and target generation moved to pure functions in `src/game/scoring.ts` (`scoreGuess`, `randomTarget`).
  - `RoundResult.error` is stored unrounded; `MatchHistory` and `EndScreen` round it for display.
- **Step 5: merged the three radars onto shared code.**
  - New `Radar` base component and `RadarPoint` marker (`src/components/Radar.tsx`). `RadarCanvas`, `ResultRadar` and `MiniRadar` are now thin wrappers around it.
  - Positions are CSS percentages of the radar (`toRadarPosition` in `radarMath.ts`), so radars no longer read their size from the DOM during render. Rings are generated from `RING_DISTANCES_M`.
  - `MiniRadar` is controlled by `CalibrationModal` and now shows ring labels.
- Kept `docs/architecture.md` in sync with each step. Lint went from 17 problems (start of the fix list) to 5.

## Bugs Fixed
- Moving the volume slider during playback no longer overrides distance attenuation (a 30m sound used to become as loud as a 1m sound).
- Overlapping plays in Calibration no longer move each other's position; the Calibration Play button now stays disabled until the sound ends.
- The level-meter animation loop no longer leaks when sounds overlap.
- One bad audio file no longer leaves the Play button disabled forever with no error.
- Play Again now fully resets the round state (it used to leave `finalGuess`/`pendingGuess` behind).
- Removed the first-render target of `(0, 0)` that was replaced by an effect; the first target is now generated with the initial state.
- MiniRadar used a 20m radius while drawing rings that looked like 10/20/30m; it now uses the same 40m scale as every other radar, so Calibration can pick points out to the full game range.
- The calibration marker no longer disappears when switching between Select and Radar modes while the picked point is still used.
- ResultRadar's guess-to-target line used `calc()` in SVG `<line>` attributes, which is not valid there (the line likely never drew correctly); it now uses plain percentages.

## Bugs / Known Issues
- The Vite dev server sometimes misses file changes (the project is in a OneDrive folder) and serves stale modules. Symptom today: a white screen with "listenerDotRef is not defined" after the step 3 edits, although the code on disk was correct. Fix: restart `npm run dev` and hard-refresh. If it keeps happening, enable `server.watch.usePolling` in `vite.config.ts`.
- Remaining lint (all pre-existing): ref read during render in `EndScreen`, empty interfaces in `FireButtonCanvas`/`LiquidButtonCanvas`, an `any` in `FireButtonCanvas`, and a missing-dependency warning on RadarCanvas's drag effect.
- Not yet checked in the browser: steps 4 and 5 (drag smoothness, calibration radar labels at 200px, the ResultRadar line).

## Next Steps
- Play through a full match and a calibration session to verify steps 3–5.
- Commit the fix-list work.
- Remaining smaller items from section 3 of the fix list: pointer events for touch, UI sounds through the master volume, 0–1 volume slider, responsive layout, leftover files (`prototype.html`, the "Debug" stroke in `LiquidButtonCanvas`).
- Optional: add Vitest and keep a unit test for `gameReducer` and `scoreGuess`.
