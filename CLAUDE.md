### Agent Instructions
# Project Memory: Spatial Audio Radar Minigame

## 1. Project Identity & Goal
* **Description:** A 5-round, 2D radar minigame designed to train spatial audio localization for tactical shooters.
* **Vibe/Aesthetic:** Minimalist, dark-mode, highly responsive (similar to dialed.gg). 
* **Scope:** Strictly limited to the MVP features defined in `docs/features.md`. Do not add state managers (like Redux) or routing (like React Router) unless explicitly instructed.

## 2. Tech Stack & Enforcement
* **Framework:** React (via Vite)
* **Language:** TypeScript (Strict typing is mandatory for all component props, state, and event handlers)
* **Styling:** Tailwind CSS (Default to dark mode classes, e.g., `bg-gray-900`, `text-white`)
* **Audio Engine:** Native Browser Web Audio API

## 3. Architectural Rules (CRITICAL)
* **Separation of Audio and UI:** React's render cycle is too slow/heavy for real-time audio manipulation. You MUST keep the `AudioContext`, `PannerNode`, and `GainNode` logic inside React `useRef` hooks to isolate them from component re-renders. 
* **State Management:** Use standard React `useState`. State should be kept as localized as possible. If global state is needed for the 5-round loop, lift it to `App.tsx`, but do not over-engineer with external libraries.
* **Web Audio API Math:**
    * Always use `panningModel = 'HRTF'` for 3D spatialization.
    * Distance falloff is done **manually**, not by the panner. The `PannerNode` uses `distanceModel = 'linear'` with `rolloffFactor = 0` (so it only handles direction), and volume is attenuated by gain: `attenuation = max(0, 1 - (distance / 50)^0.75)`. Do NOT switch back to the `inverse` model; it was replaced on purpose (see `docs/progress.md`, July 29) because it made distance too hard to hear.
    * Assume a right-hand Cartesian coordinate system where the listener is permanently fixed at `(0, 0, 0)`, facing `-Z`. On the radar, `+X` is right and `+Z` is down (behind the listener).
* **Scoring:** Per round, `score = max(0, round(10000 * (1 - (error / 30)^2)))`, where `error` is the Euclidean distance in meters between guess and target. 5 rounds, max 50,000.
* **Docs:** `docs/architecture.md` describes the current code. Update it when you change structure, data flow or the audio pipeline.

## 4. Coding Standards
* **Components:** Use functional components with arrow functions.
* **File Structure:** Keep all UI components in `src/components/`. 
* **Clean Code:** Avoid writing deeply nested ternary operators. Extract complex audio initialization logic into a custom hook (e.g., `useSpatialAudio.ts`) to keep the UI components clean.