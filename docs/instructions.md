# Bug Fix: Liquid Button Physics Explosion

**Target:** `src/components/EndScreen.tsx` (or `LiquidButtonCanvas`).
**Issue:** The canvas flashes and dies instantly on hover because the spring-mass physics loop is propagating `NaN` values, causing the 2D context to crash.

## Strict Execution Steps

1. **Resolution Synchronization:**
   * Inside the `useEffect`, before starting the physics loop, explicitly set the canvas internal resolution to match its CSS size: 
     `canvas.width = canvas.offsetWidth;`
     `canvas.height = canvas.offsetHeight;`
   * Re-run this on window resize.

2. **The Y-Axis Target Logic:**
   * In HTML Canvas, `Y=0` is the top edge. 
   * Empty state (mouse leave): `fillTarget.current = canvas.height` (water at the bottom).
   * Hover state (mouse enter): `fillTarget.current = 0` (water at the top).

3. **Physics Clamping (Anti-Explosion):**
   * Inside the `requestAnimationFrame` loop, apply strict clamping to the spring physics to prevent `NaN` cascading.
   * `spring.velocity += force;`
   * `spring.velocity *= 0.95;` (Friction/Damping safeguard).
   * `spring.height += spring.velocity;`
   * **CRITICAL CLAMP:** `spring.height = Math.max(-50, Math.min(canvas.height + 50, spring.height));`
   
4. **Safe Splash Injection:**
   * In the `onMouseMove` handler, clamp the injected velocity so aggressive mouse movements don't break the system.
   * `const splashForce = Math.min(Math.max(movementY, -20), 20);`
   * Apply this clamped force to the nearest spring's velocity.

5. **Rendering Path:**
   * Start the polygon at the bottom-left `(0, canvas.height)`.
   * Loop through springs: `ctx.lineTo(x, spring.height)`.
   * End at bottom-right `(canvas.width, canvas.height)`.
   * `ctx.fill()` with the blue/purple gradient.