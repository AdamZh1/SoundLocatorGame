# Product Requirements Document: Spatial Audio Minigame (MVP)

## 1. Project Overview
A single-page, 5-round audio localization minigame. The user listens to a 3D spatialized sound effect exactly once per round and clicks on a 2D radar to guess the sound source's coordinates. The app evaluates accuracy across a 5-round match and displays a history log.

---

## 2. Core Feature Specifications

_Layout (UI revamp, October 16, 2026): the three-panel layout was replaced by a single-stage HUD. The radar fills the screen; the former left/right panel features live in its corners (round progress top-left, total score top-right, volume bottom-left, calibration bottom-right). The features below are unchanged in behavior; their panel names are historical._

### Feature 1: The Tactical 2D Radar (Center Panel)
*   **Visual Structure:** A circular canvas centered on the screen.
*   **Revamp additions:** compass ticks, a rotating sweep while idle, a crosshair with a live `distance · bearing` readout while guessing, and an animated reveal ending in a grade word (DEAD ON / SHARP / CLOSE / WIDE / MISS). The guess marker uses the accent color; the target is white.
*   **Coordinate System:** 
    *   The center of the canvas represents the `Listener` at local coordinates `(0, 0, 0)`.
    *   The canvas must render three concentric, labeled rings representing visual anchors at distances of **10 meters**, **20 meters**, and **30 meters**.
*   **Interactions:**
    *   **State: Waiting for Play** -> Canvas is locked; clicking does nothing.
    *   **State: Audio Played** -> Canvas is active. Clicking anywhere capturing the precise `(X, Z)` coordinate relative to the center origin.
    *   **State: Guess Submitted** -> Canvas temporarily locks. Render two distinct markers: a white dot for the user's guess, and a colored dot for the actual audio location, with a dashed line connecting them.

### Feature 2: Audio Controller (Left Panel → radar center + HUD)
*   **Play Audio Button:** now the radar's center node (also Space).
    *   **State 1 (Round Start):** Active. Clicking triggers a single playback of the spatialized 3D audio via the Web Audio API at a randomized coordinate between 1 and 35 meters.
    *   **State 2 (Audio Playing/Played):** Grayed out (`disabled`). The user is strictly penalized/limited to **one play per round**.
*   **Volume Slider:**
    *   A standard slider adjusting the global `GainNode` of the Web Audio API context. Must not affect the spatial math, only the master gain.

### Feature 3: Match Progress & Results Log (Right Panel → HUD pips + end screen)
*   **Current UI:** five round segments (filled with each round's grade color) and a rolling total score in the HUD; the per-round breakdown is on the end screen.
*   **Match Structure:** A fixed loop of exactly 5 rounds.
*   **Data Aggregation:** For each round, calculate the distance error using the Euclidean distance formula:
    $$\text{Error} = \sqrt{(X_{\text{actual}} - X_{\text{guess}})^2 + (Z_{\text{actual}} - Z_{\text{guess}})^2}$$
*   **UI Display:** A vertical list tracking the 5 rounds. 
    *   Unplayed rounds display as "Round X: Pending".
    *   Completed rounds instantly update to show: `Round X: [Error Meter Amount]m Error`.
    *   After Round 5, display a summary block showing the "Average Match Error".

---

## 3. Technical Constraints & State Logic

### Core App States
The application must strictly cycle through these states per round:
1.  `INIT`: Waiting for user to click "Play Audio". Radar is unclickable.
2.  `AUDIO_PLAYING`: Spatial audio is active. Play button disables.
3.  `GUESSING`: Audio finished. Radar canvas listens for a single click event.
4.  `ROUND_REVEAL`: Click registered. Show actual vs. guess markers on radar, update Right Panel log. Display a "Next Round" button.
5.  `MATCH_OVER`: Triggered after Round 5 reveal. Show final average score and a "Play Again" reset button.

### Keyboard Shortcuts
Space = start (home) / play (INIT); Enter = lock in guess (GUESSING); N or Enter = next round (ROUND_REVEAL); Enter = play again (end screen); Esc = close calibration.

### Web Audio API Guardrails
*   The `AudioContext` must only initialize upon the very first user interaction (the first click of the Play button) to comply with browser autoplay policies.
*   The sound spatialization must utilize `panningModel = 'HRTF'` to process the X, Y, Z coordinates. Distance falloff uses a manual attenuation curve instead of the panner's distance model (originally `inverse`; changed July 29, 2026, see `CLAUDE.md`).