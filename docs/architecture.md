# Architectural Blueprint: Spatial Audio Minigame

## 1. Directory Structure

```text
src/
├── components/
│   ├── AudioController.tsx   # Left Panel: Play button & Volume
│   ├── RadarCanvas.tsx       # Center Panel: 2D Canvas & Guessing UI
│   └── MatchHistory.tsx      # Right Panel: 5-Round Log & Stats
├── hooks/
│   └── useSpatialAudio.ts    # Custom hook encapsulating Web Audio API
├── types/
│   └── index.ts              # Global TypeScript interfaces
├── App.tsx                   # Main container & global state owner
└── main.tsx                  # Vite entry point
```

## 2. State Management Strategy

State will be managed centrally in `App.tsx` using standard React `useState` and passed down to child components via props. 

**Global State in `App.tsx`:**
* `gameState`: Enum (`'INIT' | 'AUDIO_PLAYING' | 'GUESSING' | 'ROUND_REVEAL' | 'MATCH_OVER'`)
* `currentRound`: Number (1 through 5)
* `matchHistory`: Array of `GuessData` objects
* `targetCoordinates`: Object `{ x: number, z: number }` (Generated at the start of each round)

## 3. Core Component Roles

### `<App />`
* **Role:** The main container. Holds the 3-column UI layout.
* **Data Flow:** Generates the random target coordinates, listens for guess submissions from `<RadarCanvas />`, calculates the distance error, updates the history array, and controls the state machine.

### `<AudioController />` (Left Panel)
* **Props Received:** `gameState`, `targetCoordinates`, `onPlayComplete` (callback).
* **Role:** Consumes the `useSpatialAudio` hook. When the user clicks play, it passes the `targetCoordinates` to the hook to trigger the sound. Once the sound finishes, it fires `onPlayComplete` to shift the app into the `GUESSING` state.

### `<RadarCanvas />` (Center Panel)
* **Props Received:** `gameState`, `targetCoordinates` (only used during reveal), `onGuessSubmit` (callback).
* **Role:** Renders the 3 concentric distance rings (10m, 20m, 30m). Listens for a mouse click only when `gameState === 'GUESSING'`. Translates the raw DOM click coordinates into local relative coordinates `(X, Z)` and sends them back to `<App />`.

### `<MatchHistory />` (Right Panel)
* **Props Received:** `matchHistory`, `currentRound`.
* **Role:** Purely a display component. Maps over the `matchHistory` array to render the list of past rounds. Calculates and displays the "Rolling Average Error" based on completed rounds.

## 4. Custom Hook: `useSpatialAudio.ts`
* **Role:** Isolates the Web Audio API to prevent React re-renders from stuttering the audio.
* **Implementation:** * Uses `useRef` to hold the `AudioContext`, `PannerNode` (set to `HRTF` and `inverse` distance model), and `GainNode`.
    * Exposes a `playAudio(x, z, volume)` function to be used by the UI components.