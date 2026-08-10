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

## Next Steps
- (Completed) Implement functionality to change the game's sound effect.
