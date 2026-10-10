# Architecture: Spatial Audio Minigame

_Describes the code as it is (last synced October 10, 2026). Known problems and planned changes live in `docs/ArchitectureFixList.md`._

## 1. Directory Structure

```text
src/
├── components/
│   ├── HomeScreen.tsx          # Landing page with "Start" button (unlocks audio)
│   ├── FireButtonCanvas.tsx    # Canvas fire effect behind the Start button
│   ├── AudioController.tsx     # Left panel: Play, Setup (calibration), volume slider
│   ├── RadarCanvas.tsx         # Center panel: main radar, guess placement/drag, reveal markers
│   ├── ScorePopup.tsx          # Animated "+N pts" shown on ROUND_REVEAL
│   ├── MatchHistory.tsx        # Right panel: per-round score/error and total score
│   ├── CalibrationModal.tsx    # Modal for test-playing sounds at chosen positions
│   ├── MiniRadar.tsx           # Clickable radar inside CalibrationModal
│   ├── EndScreen.tsx           # MATCH_OVER overlay with round summaries
│   ├── ResultRadar.tsx         # Small read-only radar per round in EndScreen
│   └── LiquidButtonCanvas.tsx  # Canvas liquid effect on the "Play Again" button
├── game/
│   ├── gameReducer.ts          # Round state machine: phases, actions, reducer, selectors (pure)
│   └── scoring.ts              # scoreGuess, distanceBetween, randomTarget
├── hooks/
│   └── useSpatialAudio.ts      # Web Audio API: buffer loading, spatial playback, volume
├── types/
│   └── index.ts                # Shared types: Vec2, GameState, AppStage, RoundResult, SoundFile
├── utils/
│   ├── audioHelper.ts          # UI click/hover sounds (HTMLAudioElement, not Web Audio)
│   └── radarMath.ts            # RADAR_MAX_M, RING_DISTANCES_M, metersToPx, pxToMeters
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

1. **HOME → GAME:** Start button calls `initAudio()` (creates/resumes the `AudioContext` from a user gesture), then `appStage = 'GAME'`.
2. **INIT:** Play button is enabled once buffers are `loaded`. Radar ignores clicks.
3. **AUDIO_PLAYING:** `handlePlay` dispatches `PLAY_STARTED`, picks a random loaded sound and awaits `playAudio(...)`, which resolves when the sound ends. Then it dispatches `PLAY_ENDED` → `GUESSING`.
4. **GUESSING:** Clicking the radar places a green marker; it can be dragged (mouse events only). Every click and drag move dispatches `GUESS_MOVED`. Confirm is enabled once a guess exists and dispatches `GUESS_CONFIRMED`.
5. **ROUND_REVEAL:** the reducer scores the guess with `scoreGuess` and appends a `RoundResult` to `history`. Radar shows guess (green) and target (blue) with coordinate labels. `ScorePopup` animates the score. Next/Finish button.
6. **Next (`NEXT_ROUND`):** rounds 1–4 → new target, `INIT`. Round 5 → `MATCH_OVER`.
7. **MATCH_OVER:** `EndScreen` overlay with total score and expandable per-round `ResultRadar`s. Play Again dispatches `RESTART`, which rebuilds the whole `Game` (round 1, empty history, new target).

## 4. Scoring

```ts
error = sqrt((target.x - guess.x)^2 + (target.z - guess.z)^2)   // meters
score = max(0, round(10000 * (1 - (error / 30)^2)))             // quadratic falloff
```

Max 10,000 per round, 50,000 per match. Any guess 30m or more off scores 0. Computed by `scoreGuess(target, guess)` in `game/scoring.ts`. (`progress.md` calls this "exponential decay"; the formula has always been this quadratic form, only the divisor changed from 40 to 30.)

## 5. Coordinate System

- Listener fixed at `(0, 0, 0)`, facing `-Z` (Web Audio default). `Y` is always 0.
- Radar screen mapping: `+X` = right, `+Z` = down (behind the listener), `-Z` = up (in front).
- **Main radar** (`RadarCanvas`): 400px wide, radius = 40m. Rings at 10/20/30m (100/200/300px diameter).
- **ResultRadar:** 200px wide, radius = 40m. Same ring meanings at half scale.
- **MiniRadar:** 200px wide, but uses `metersPerPixel = 40 / width`, so radius = **20m**. Its rings look like ResultRadar's but mean 5/10/15m. (Bug, see fix list 2f.)
- Targets are generated within 35m.

`RadarCanvas` and `ResultRadar` convert with `metersToPx`/`pxToMeters` from `utils/radarMath.ts`. `MiniRadar` still has its own (wrong) math, and ring sizes are still hard-coded pixels in all three (fix list step 5).

## 6. Audio: `useSpatialAudio.ts`

Called once in `App` as `useSpatialAudio(volume)`. Returns `{ playAudio, initAudio, subscribeLevel, soundFiles, loaded, loadError }`. It knows nothing about the DOM.

**Loading (on mount):** All files in `audioConfig.ts` are fetched in parallel and decoded with an `OfflineAudioContext`, so no real `AudioContext` exists before the user clicks. The load promise is module-level, so StrictMode's double mount doesn't load twice. Failed files are logged and skipped; `soundFiles` only lists sounds that loaded, and `loaded` is true if at least one did. If none load, `loadError` is set and `AudioController` shows it.

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

**`subscribeLevel(listener)`** registers a callback that receives the output level (0–1) every animation frame while anything is playing, and `0` when playback stops. Returns an unsubscribe function. There is at most one `requestAnimationFrame` loop, and it only runs while sounds are active. `RadarCanvas` subscribes and scales its own listener dot and radar ring.

**UI sounds** (`audioHelper.ts`, `ScorePopup`, `HomeScreen` fire crackle) use `new Audio(...)` and are not affected by the volume slider.

## 7. Components

| Component | Props | Role |
|---|---|---|
| `HomeScreen` | `onStartGame` | Title, description, Start button with fire effect and looping fire sound on hover |
| `AudioController` | `onPlay, onOpenCalibration, volume, onVolumeChange, disabled, loadError` | Presentational. Does not use the audio hook |
| `RadarCanvas` | `gameState, guess, onGuessChange, targetCoordinates, subscribeLevel` | Main radar, click/drag guessing (controlled: draws `guess`), reveal markers, audio-level pulse |
| `ScorePopup` | `score` | Counts up the score, plays a jingle |
| `MatchHistory` | `history, currentRound` (unused) | Lists `Round N: score pts - error m`, total score / 50,000 |
| `CalibrationModal` | `onClose, playAudio, volume, onVolumeChange, soundFiles, loaded` | Play any sound at a chosen distance (5/15/25/35m) and direction, or a point picked on `MiniRadar` |
| `MiniRadar` | `onSelectCoordinate` | Click to pick a calibration position |
| `EndScreen` | `history, onPlayAgain` | Final score, accordion of rounds |
| `ResultRadar` | `target, guess` | Static radar for one round |
| `FireButtonCanvas` / `LiquidButtonCanvas` | ref handle with `setHovered` | Decorative canvas animations |
