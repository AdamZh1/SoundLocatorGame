# UI Refactor: Pure Black Void & Minimalist Radar

**Target Files:** Read `src/components/RadarCanvas.tsx` and the main layout wrapper (e.g., `App.tsx`, `Layout.tsx`, or global CSS).
**Objective:** Convert the entire application to a pure black dark mode, ensuring the radar blends seamlessly into the background with a subtle monochromatic underglow.

## Strict Execution Steps

1. **Global Background:**
   * Locate the main application wrapper or global body style.
   * Change the background color to pure black (use `bg-black`).

2. **Seamless Radar Surface:**
   * Update the interactive radar container inside `RadarCanvas.tsx` to use `bg-transparent` or `bg-black` so it perfectly matches the new global background without creating a visible seam.
   * Maintain the ultra-subtle distance rings using `border border-white/10`.

3. **The Monochromatic Underglow:**
   * Ensure the absolutely positioned underglow `div` directly behind the radar uses a subtle, desaturated gradient to act as the only light source in the void: `bg-gradient-to-br from-zinc-800 via-zinc-900 to-black opacity-40 blur-[80px] animate-slow-breathe`.
   * Keep `pointer-events-none` on this layer.