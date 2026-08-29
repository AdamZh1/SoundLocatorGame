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

## Next Steps
- Investigate and resolve the intermittent initial audio glitch (sounds playing at origin on first play).

## Summary of Work (August 21, 2026 - Continued)
- Verified that the new "Home Screen" entry point successfully resolves the intermittent initial audio origin-glitch by ensuring `AudioContext` is fully initialized and resumed via user interaction before game start.

## Bugs Fixed
- Resolved the intermittent initial audio glitch (sounds playing at `(0, 0, 0)` on the first play).

## Next Steps
- Implement quality-of-life improvements.
- Enhance visual aesthetics using Tailwind CSS.

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

## Next Steps
- Continue UI refinements and audio enhancement tasks.

