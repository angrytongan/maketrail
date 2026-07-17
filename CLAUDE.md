# maketrail

Browser app to design and visualise a mountain bike trail: a 2D heightmap editor (import lat/lon/height points, raise/lower vertices, place obstacles, mark the trail line) paired with a 3D render of the same terrain. Units are metric throughout.

Default terrain: 20m x 20m x 0 elevation grid, vertex spacing 0.5m, grid size configurable.

## Decisions

[docs/decisions.md](docs/decisions.md) — scope/architecture decisions (persistence, trail marking, obstacle editing, difficulty rating, undo, future build-export). Check this before assuming how something should work.

## Research

Read only the file(s) relevant to the current task — don't load all of them if you're focused on one concept.

- [research/rollers.md](research/rollers.md) — sine-wave profile, height:length ratios, spacing rules
- [research/berms.md](research/berms.md) — lean-angle physics, banking angle by difficulty, dimensions
- [research/jumps.md](research/jumps.md) — projectile-motion model, takeoff angle, landing checks
- [research/pump-tracks.md](research/pump-tracks.md) — Velosolutions track-wide standards (width, turn height/radius, materials)
- [research/simulation.md](research/simulation.md) — rider+bike sim design, checks that flag bad geometry, links back to the above
- [research/sources-to-review.md](research/sources-to-review.md) — IMBA PDFs found but not yet read; download + OCR later
- [research/build-plans.md](research/build-plans.md) — Lunch Ride MTB physical build blueprints (kicker, skinny, manual machine); not yet read
- [research/velomaster-features.md](research/velomaster-features.md) — Velosolutions Velomaster obstacle catalog; candidates for new obstacle types (skinny/rail, seesaw)

## Stack

Vite + TypeScript + Three.js, npm, Vitest, ESLint (flat config, `typescript-eslint` recommended). `npm run dev` / `build` / `test` / `lint` / `typecheck`. No framework (plain TS), no backend — see [docs/decisions.md](docs/decisions.md) for why.

## Status

Terrain spike (`src/terrain/`) — imports mock lat/lon/height points, converts to local meters, triangulates with `d3-delaunay` into a Three.js mesh (native irregular mesh, not resampled to a grid, per decisions), renders with OrbitControls.

Roller obstacle (`src/obstacles/roller.ts`) — parametric mesh, `periods` full sine-wave periods chained end-to-end (crest at length/4, trough at 3·length/4 within each period, per research/rollers.md), overlaid on the terrain as a separate object.

Berm obstacle (`src/obstacles/berm.ts`) — parametric banked-arc mesh (radius, sweep angle, bank angle, width; cross-section is a flat tilted plane, not Velosolutions' full concave profile). Only turns toward one side (fixed center of curvature) — mirroring needs a future direction flag.

Kicker obstacle (`src/obstacles/kicker.ts`) — takeoff ramp only (no linked gap/landing yet), a circular arc from height + lip angle (research/jumps.md's cutlaps.com model). Unlike the roller/berm, Y is anchored at 0 for the base rather than symmetric — a kicker is inherently asymmetric (flat base, rising to the lip). One-way/directional per docs/decisions.md, arrow indicator not built yet.

All three obstacles follow the same convention: geometry centered on its own local origin (X-centered at minimum) so position/rotation pivots around the obstacle's actual center, not a corner.

**Multi-instance + 2D placement** is now real (`src/obstacles/instance.ts`, wired up in `main.ts`): an arbitrary number of obstacle instances (any mix of the 3 types) live in an `instances` array. "+ Roller / + Berm / + Kicker" buttons spawn new ones (staggered default position); clicking one in the 2D Plan View selects it (hit-tested by distance via `getFootprintRadius`, not a `Raycaster` — the 2D camera is a simple top-down orthographic projection, so screen↔world is direct math, see `src/view2d/projection.ts`). Selecting an instance shows its type's slider panel (reusing the previous per-type panels, now dynamic) and a yellow selection ring + rotate handle in the scene (visible in both views since they share one `Scene`). Dragging the body moves it; dragging the handle rotates it (yaw only, per the decision that 3-axis rotation would require 3D manipulation, which conflicts with 2D-only editing). Elevation is no longer a slider — it's auto-sampled from the terrain via nearest-neighbor lookup (`src/terrain/sample.ts`) every time an instance's x/z changes.

**Terrain vertex editing** (`src/terrain/brush.ts`, wired up in `main.ts`) is a brush, not one-vertex-at-a-time — dragging every point individually would be tedious. `getPointsInBrush` finds every terrain point within an adjustable radius of the cursor with a cosine falloff (full effect at center, tapering to zero at the edge, so strokes don't leave a flat plateau with a hard edge). An `editMode: "obstacles" | "terrain"` toggle (buttons in the "Editor" card header) switches the 2D view's click/drag behavior between the two — they'd otherwise be ambiguous. In Terrain mode: small marker dots (a single `THREE.Points` with per-vertex colors) appear over all mock survey points, highlighting yellow when under the brush (even on hover, before dragging); dragging applies an incremental height delta based on vertical mouse movement since the *previous* move event (not a fixed start reference), so sweeping the brush across an area while moving the mouse up/down sculpts continuously. Known gap: obstacles don't auto-resample elevation when nearby terrain changes — only the next time that obstacle itself is moved.

UI is split into cards (`index.html`): a "2D Plan View" card and a "3D View" card side by side, plus a single "Editor" card below (mode toggle, then either the obstacles add/remove toolbar + selected instance panel, or the terrain brush-size toolbar, depending on mode). Both views render the *same* Three.js `scene` — 3D uses `PerspectiveCamera` + `OrbitControls`, 2D uses a static top-down `OrthographicCamera` (no pan/zoom yet) and is the interactive surface for both obstacle and terrain editing. Trail marking isn't built yet — separate future feature per docs/decisions.md.

No real heightmap import, no trail marking, no landing ramp for the kicker yet — next step is likely one of those (see docs/decisions.md).
