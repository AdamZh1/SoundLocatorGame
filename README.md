# SoundLocator: Spatial Audio Training Tool

A high-performance web simulation designed to train spatial audio localization. Developed to help players improve their ability to pinpoint audio sources in 3D environments, useful for competitive FPS games. 

## Technical Overview

SoundLocator is a React-based simulation that directly manipulates native HRTF panning and frequency filtering to create realistic spatial audio without relying on heavy 3D graphics.

### Core Technologies
* **Frontend:** React (Vite), TypeScript, Tailwind CSS
* **Audio Engine:** Native Web Audio API
* **Styling/Animations:** Tailwind CSS, custom Canvas-based procedural effects

### Engineering Highlights
* **Low-Latency Spatialization:** Leverages `PannerNode` with HRTF panning models and inverse distance attenuation for realistic 3D sound positioning.
* **Separation of Concerns:** Implemented a strict architectural split where high-frequency audio logic resides outside of the React render cycle (via `useRef`), ensuring no jitter during playback.
* **Performance Optimization:** Utilizes `AnalyserNode` for real-time audio visualization synced with React state updates.
* **Procedural UI:** Features custom Canvas-based particle effects for high-fidelity UI feedback.

## Key Features

* **5-Round Localization Loop:** Progressive difficulty assessment with automated score tracking.
* **Interactive Radar:** A tactical 2D canvas for coordinate submission with visual feedback.
* **Calibration Mode:** Dedicated environment for testing spatial audio settings and volume parameters.
* **Minimalist Aesthetics:** "Pure Black Void" dark-mode theme for clean look and maximum focus

## Getting Started

### Prerequisites

* Node.js (v18+ recommended)
* npm or yarn

### Installation

1. Clone the repository:
   `git clone <repository-url>`

2. Install dependencies:
   `npm install`

3. Run the development server:
   `npm run dev`

The application will be available at `http://localhost:5173`.
