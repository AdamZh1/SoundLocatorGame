# Architecture: Spatial Audio Minigame

_Describes the code as it is (last synced October 16, 2026). Known problems and planned changes live in `docs/ArchitectureFixList.md`._

## 1. Directory Structure

```text
src/
├── components/
│   ├── HomeScreen.tsx          # Landing page: kinetic title, ambient radar, Start (unlocks audio)
│   ├── FireButton.tsx          # Start button with accent flame canvas + crackle sound on hover
│   ├── Radar.tsx               # Shared radar base (disc, rings, click → meters), RadarPoint, BearingTicks, RadarSweep
│   ├── RadarCanvas.tsx         # Main radar: center play node, crosshair, guess placement/drag, reveal choreography
│   ├── RevealReadout.tsx       # Grade word, score and error under the radar on ROUND_REVEAL
│   ├── RoundPips.tsx           # HUD top-left: "02/05" + per-round segments colored by grade
│   ├── ScoreTicker.tsx         # HUD top-right: rolling match total
│   ├── VolumeControl.tsx       # Master volume slider (compact HUD version and full version)
│   ├── KeyHint.tsx             # <kbd> chip + label
│   ├── CountUp.tsx             # Number that rolls to a value (motion `animate`, writes textContent)
│   ├── CalibrationModal.tsx    # Right-side sheet for test-playing sounds at chosen positions
│   ├── MiniRadar.tsx           # Clickable radar inside CalibrationModal
│   ├── EndScreen.tsx           # MATCH_OVER page: total count-up, overall grade, per-round radars
│   ├── ResultRadar.tsx         # Small read-only radar per round in EndScreen
│   └── LiquidButton.tsx        # Play Again button that fills with accent liquid on hover
├── game/
│   ├── gameReducer.ts          # Round state machine: phases, actions, reducer, selectors (pure)
│   ├── scoring.ts              # scoreGuess, distanceBetween, randomTarget
│   └── grading.ts              # gradeFor(score) → { label, tone } + tone → Tailwind class maps
├── hooks/
│   ├── useSpatialAudio.ts      # Web Audio API: buffer loading, spatial playback, volume
│   ├── useKeyboardShortcuts.ts # Window keydown → handler map, with an enabled flag
│   └── useCanvasLoop.ts        # DPR-aware canvas + rAF loop that sleeps when idle (Fire/Liquid buttons)
├── types/
│   └── index.ts                # Shared types: Vec2, GameState, AppStage, RoundResult, SoundFile
├── utils/
│   ├── format.ts               # formatInt (thousands separators)
│   ├── audioHelper.ts          # UI click/hover sounds (HTMLAudioElement, not Web Audio)
│   └── radarMath.ts            # Radar scale (RADAR_MAX_M, RING_DISTANCES_M) and meters <-> screen conversion
├── audioConfig.ts              # List of game sounds: { name, file }
├── gameConfig.ts               # Rounds, score limits, target radius, attenuation distance
├── App.tsx                     # Owns all game state and the round loop
└── main.tsx                    # Vite entry point
public/
├── game_audio_comp/            # Spatialized game sounds (listed in audioConfig.ts)
└── ui_audio/                   # UI sounds
```

Shared types live in `src/types/index.ts`, game constants in `src/gameConfig.ts`. Use these instead of writing literals like `5`, `50000` or `35`.

## 2. State

All state is in `App.tsx`, passed down as props. The round loop is one `useReducer` (`game/gameReducer.ts`); the rest is `useState`.

| State | Type | Notes |
|---|---|---|
| `appStage` | `'HOME' \| 'GAME'` | `useState`. `HOME` renders `HomeScreen` only |
| `volume` | `number` | `useState`. Slider value 0–0.5, shown as `volume * 200`% |
| `isCalibrationOpen` | `boolean` | `useState` |
| `game` | `Game` | `useReducer(gameReducer)`, fields below |

`Game`:

| Field | Type | Notes |
|---|---|---|
| `phase` | `GamePhase` | Discriminated union on `name`: `INIT`, `AUDIO_PLAYING`, `GUESSING { guess: Vec2 \| null }`, `ROUND_REVEAL`, `MATCH_OVER` |
| `round` | `number` | 1–5 |
| `target` | `Vec2` | Random point, uniform over a 35m-radius disc |
| `history` | `RoundResult[]` | `error` is stored unrounded; components round it for display |

There is **one copy of the guess**: `phase.guess` while guessing. During reveal it's the last `history` entry's `guess`. `displayedGuess(game)` returns whichever applies, and `RadarCanvas` just draws it (controlled component).

Actions: `PLAY_STARTED`, `PLAY_ENDED`, `GUESS_MOVED { guess }`, `GUESS_CONFIRMED`, `NEXT_ROUND { target }`, `RESTART { target }`. New targets are passed in with the action so the reducer stays pure. Any action that doesn't fit the current phase is ignored.

## 3. Game Flow

1. **HOME → GAME:** Start (`FireButton`, or Space) calls `initAudio()` (creates/resumes the `AudioContext` from a user gesture), then `appStage = 'GAME'`. The home screen's ambient radar and the game radar share a motion `layoutId` (`RADAR_LAYOUT_ID`), so it morphs into place.
2. **INIT:** the radar's center node is the play button (`canPlay` = INIT and buffers `loaded`); Space does the same. The sweep wedge rotates at full opacity. Radar ignores placement clicks.
3. **AUDIO_PLAYING:** `handlePlay` dispatches `PLAY_STARTED`, picks a random loaded sound and awaits `playAudio(...)`, which resolves when the sound ends. Then it dispatches `PLAY_ENDED` → `GUESSING`.
4. **GUESSING:** a crosshair with a live `distance · bearing` readout follows the pointer (DOM writes, no re-render). Clicking places the accent marker; it can be dragged (pointer events with pointer capture, so touch works). Every click and drag move dispatches `GUESS_MOVED`. "Lock in" (or Enter) is enabled once a guess exists and dispatches `GUESS_CONFIRMED`.
5. **ROUND_REVEAL:** the reducer scores the guess with `scoreGuess` and appends a `RoundResult` to `history`. `RadarCanvas` plays the reveal: guess pulses and goes hollow, a line draws from guess to target, the target appears with ripples. `RevealReadout` then counts up score and error and shows the grade word (`gradeFor`). The round's `RoundPips` segment fills with the grade color and `ScoreTicker` rolls. Next round / See results (N or Enter).
6. **Next (`NEXT_ROUND`):** rounds 1–4 → new target, `INIT`. Round 5 → `MATCH_OVER`.
7. **MATCH_OVER:** `EndScreen` page: total counts up, overall grade (`gradeFor(total / TOTAL_ROUNDS)`), a `ResultRadar` per round. Play Again (`LiquidButton`, or Enter) dispatches `RESTART`, which rebuilds the whole `Game` (round 1, empty history, new target).

Screens (HOME / GAME / MATCH_OVER) and the calibration sheet are wrapped in `AnimatePresence`; the whole app is inside `<MotionConfig reducedMotion="user">`, and `useCanvasLoop` doesn't animate when the OS asks for reduced motion.

**Keyboard** (`useKeyboardShortcuts`, bindings chosen per phase in `App`): Space = play (INIT), Enter = lock in (GUESSING), N / Enter = next (ROUND_REVEAL). Disabled while the calibration sheet is open; ignores key repeats and keys typed into form fields. `HomeScreen` (Space = start) and `EndScreen` (Enter = play again) register their own.

**Grades** (`game/grading.ts`): ≥ 9000 DEAD ON, ≥ 7000 SHARP (both `good`, accent), ≥ 4000 CLOSE (`ok`), ≥ 1 WIDE, 0 MISS (both `bad`). Tones map to the `--color-good/ok/bad` theme tokens.

**Styling:** design tokens (`--color-bg/surface/line/fg/muted/accent`, grade tones, Geist + Geist Mono) are in the `@theme` block of `index.css`, along with the `.btn`, `.kbd`, `.label` and `.grain` component classes.

## 4. Scoring

```ts
error = sqrt((target.x - guess.x)^2 + (target.z - guess.z)^2)   // meters
score = max(0, round(10000 * (1 - (error / 30)^2)))             // quadratic falloff
```

Max 10,000 per round, 50,000 per match. Any guess 30m or more off scores 0. Computed by `scoreGuess(target, guess)` in `game/scoring.ts`. (`progress.md` calls this "exponential decay"; the formula has always been this quadratic form, only the divisor changed from 40 to 30.)

## 5. Coordinate System

- Listener fixed at `(0, 0, 0)`, facing `-Z` (Web Audio default). `Y` is always 0.
- Radar screen mapping: `+X` = right, `+Z` = down (behind the listener), `-Z` = up (in front).
- **Every radar's edge is 40m** (`RADAR_MAX_M`), whatever its pixel size, with rings at 10/20/30m (`RING_DISTANCES_M`). Main radar (`RadarCanvas`) is sized to the viewport (`min(62vh, 86vw)`); `ResultRadar` is 160px and `MiniRadar` 240px.
- Bearings (crosshair readout, `bearingDeg` in `radarMath.ts`): 0° = forward (−Z), clockwise, 90° = right.
- Targets are generated within 35m.

All three are built on the shared `<Radar>` component (`components/Radar.tsx`), which draws the disc and rings and turns clicks into meters (`onSelect`). Markers are `<RadarPoint pos={...}>` children. Positions are CSS percentages of the disc (`toRadarPosition`), so nothing measures the DOM during render. Screen → meters goes through `clientToMeters(clientX, clientY, rect)`; dragging clamps with `clampToRadius`. All in `utils/radarMath.ts`.

## 6. Audio: `useSpatialAudio.ts`

Called once in `App` as `useSpatialAudio(volume)`. Returns `{ playAudio, initAudio, subscribeLevel, soundFiles, loaded, loadError }`. It knows nothing about the DOM.

**Loading (on mount):** All files in `audioConfig.ts` are fetched in parallel and decoded with an `OfflineAudioContext`, so no real `AudioContext` exists before the user clicks. The load promise is module-level, so StrictMode's double mount doesn't load twice. Failed files are logged and skipped; `soundFiles` only lists sounds that loaded, and `loaded` is true if at least one did. If none load, `loadError` is set and `App` shows it under the radar instead of the play prompt.

**Context:** created on the first `initAudio()`/`playAudio()` call (the Start button), with one shared bus:

```text
Master GainNode (volume slider) → AnalyserNode (fftSize 32) → destination
```

**Per-sound chain** (new nodes for every `playAudio`, disconnected when the sound ends):

```text
AudioBufferSourceNode
  → BiquadFilterNode  (highshelf @ 5500Hz, "pinna filter")
  → PannerNode        (HRTF, distanceModel 'linear', rolloffFactor 0, position set before start)
  → GainNode          (distance attenuation)
  → master bus
```

Overlapping sounds don't affect each other's position or volume.

**Distance attenuation (manual):** the panner does direction only. Each sound's distance gain node applies:

```ts
attenuation = max(0, 1 - (distance / 50)^0.75)
```

**Master volume:** the `volume` argument only sets the master gain node, so moving the slider never changes the distance math.

**Pinna filter:** for sounds behind the listener (`z > 0`), highshelf gain = `-5 * min(z / 35, 1)` dB; 0 dB otherwise. This helps with front/back confusion.

**`playAudio(x, z, soundName)`** returns a Promise that resolves when the sound **ends** (`onended`).

**`subscribeLevel(listener)`** registers a callback that receives the output level (0–1) every animation frame while anything is playing, and `0` when playback stops. Returns an unsubscribe function. There is at most one `requestAnimationFrame` loop, and it only runs while sounds are active. `RadarCanvas` subscribes and scales its listener dot and fades in an accent ring on the radar rim.

**UI sounds** (`audioHelper.ts`, `RevealReadout` jingle, `FireButton` crackle) use `new Audio(...)` and are not affected by the volume slider.

## 7. Components

| Component | Props | Role |
|---|---|---|
| `HomeScreen` | `onStartGame` | Staggered title, tagline, ambient radar (shared `layoutId`), `FireButton` |
| `RadarCanvas` | `gameState, guess, onGuessChange, targetCoordinates, subscribeLevel, onPlay, canPlay` | Main radar: center play node, sweep, crosshair, click/drag guessing (controlled: draws `guess`), reveal choreography, audio-level ring |
| `RevealReadout` | `result` | Grade word, score/error count-up, jingle |
| `RoundPips` / `ScoreTicker` | `history, round` / `total` | HUD top corners |
| `VolumeControl` | `volume, onVolumeChange, compact?` | Master volume slider (HUD and calibration sheet) |
| `KeyHint` / `CountUp` | `keys, label` / `value, format?, from?, delay?, duration?` | Small shared pieces |
| `CalibrationModal` | `onClose, playAudio, volume, onVolumeChange, soundFiles, loaded` | Right-side sheet (Esc closes): play any sound at a chosen distance (5/15/25/35m) and direction, or a point picked on `MiniRadar` |
| `Radar` / `RadarPoint` | `sizePx?, className, ringClassName, showRingLabels, onSelect, ref` / `pos, className, ...div props` | Shared base for the three radars; `BearingTicks` and `RadarSweep` are optional layers |
| `MiniRadar` | `selected, onSelectCoordinate` | Click to pick a calibration position (controlled; `CalibrationModal` owns the point) |
| `EndScreen` | `history, onPlayAgain` | Total count-up, overall grade, a `ResultRadar` per round, `LiquidButton` |
| `ResultRadar` | `target, guess` | Static radar for one round |
| `FireButton` / `LiquidButton` | `onClick, children` | Self-contained buttons with decorative canvases driven by `useCanvasLoop` (DPR-aware, loop sleeps when idle; color read from `--color-accent`) |
