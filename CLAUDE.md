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

Lighting: a low, raking `DirectionalLight` (not overhead) plus a dimmer `AmbientLight`, so subtle height changes cast visible shading rather than washing out flat. Shadow mapping is on for both renderers (terrain and obstacles cast/receive) — the strongest depth cue for small bumps.

Terrain height color ramp (`src/terrain/colorRamp.ts`), shared by both views: the single terrain mesh uses a `vertexColors` material — a 3-stop hypsometric tint (green → yellow-green → brown) normalized to the terrain's current min/max height, so it always uses full contrast regardless of the actual elevation range. Colors are recomputed every time `writeHeightsToGeometry()` runs, so the ramp updates live as the brush sculpts/smooths. In the 3D view this combines with the raking directional light/shadows above; the 2D view relies on the color ramp alone since its straight-down angle gives lighting almost no depth cue. No vertical exaggeration — deliberately out of scope, the geometry itself is never altered for display.

Roller obstacle (`src/obstacles/roller.ts`) — parametric mesh, `periods` full sine-wave periods chained end-to-end (crest at length/4, trough at 3·length/4 within each period, per research/rollers.md), overlaid on the terrain as a separate object.

Berm obstacle (`src/obstacles/berm.ts`) — parametric banked-arc mesh (radius, sweep angle, bank angle, width; cross-section is a flat tilted plane, not Velosolutions' full concave profile). Only turns toward one side (fixed center of curvature) — mirroring needs a future direction flag.

Kicker obstacle (`src/obstacles/kicker.ts`) — takeoff ramp only (no linked gap/landing yet), a circular arc from height + lip angle (research/jumps.md's cutlaps.com model). Unlike the roller/berm, Y is anchored at 0 for the base rather than symmetric — a kicker is inherently asymmetric (flat base, rising to the lip). One-way/directional per docs/decisions.md, arrow indicator not built yet.

All three obstacles follow the same convention: geometry centered on its own local origin (X-centered at minimum) so position/rotation pivots around the obstacle's actual center, not a corner.

**Multi-instance + 2D placement** is now real (`src/obstacles/instance.ts`, wired up in `main.ts`): an arbitrary number of obstacle instances (any mix of the 3 types) live in an `instances` array. "+ Roller / + Berm / + Kicker" buttons spawn new ones (staggered default position); clicking one in the 2D Plan View selects it (hit-tested by distance via `getFootprintRadius`, not a `Raycaster` — the 2D camera is a simple top-down orthographic projection, so screen↔world is direct math, see `src/view2d/projection.ts`). Selecting an instance shows its type's slider panel (reusing the previous per-type panels, now dynamic), a yellow selection ring, and **four** rotate handles at 0/90/180/270° around it (not one — a single handle can land inside terrain or off-screen and become unreachable; grabbing any of the four rotates the obstacle the same way, see `findGrabbedHandleOffset`/`DragMode`'s `handleOffset`). Dragging the body moves it; dragging a handle rotates it (yaw only, per the decision that 3-axis rotation would require 3D manipulation, which conflicts with 2D-only editing). Elevation is no longer a slider — it's auto-sampled from the terrain via nearest-neighbor lookup (`src/terrain/sample.ts`) every time an instance's x/z changes.

**Terrain vertex editing** (`src/terrain/brush.ts`, wired up in `main.ts`) is a brush, not one-vertex-at-a-time — dragging every point individually would be tedious. `getPointsInBrush` finds every terrain point within an adjustable radius of the cursor with a cosine falloff (full effect at center, tapering to zero at the edge, so strokes don't leave a flat plateau with a hard edge). An `editMode: "obstacles" | "terrain"` toggle (buttons in the "Editor" card header) switches the 2D view's click/drag behavior between the two — they'd otherwise be ambiguous. In Terrain mode: small marker dots (a single `THREE.Points` with per-vertex colors) appear over all mock survey points, highlighting yellow when under the brush (even on hover, before dragging) — 2D-view-only (same `layers` mechanism as the camera helper below), since they're a 2D editing aid and would just clutter the 3D view.

Within Terrain mode, a `terrainTool: "sculpt" | "smooth"` toggle picks the brush behavior: **Raise/Lower** applies an incremental height delta from vertical mouse movement since the *previous* move event, with the brush's world position locked at drag-start (moving the mouse vertically maps to world Z in this top-down view, so the brush can't also follow the cursor without fighting height control). **Smooth** pulls each affected point toward the brush area's own weighted-average height each stroke (a Laplacian-style blur using the brush region as its own neighborhood, `SMOOTH_STRENGTH` per event) — it has no such conflict, so it *does* follow the live cursor while dragging, letting you sweep it across an area. Known gap: obstacles don't auto-resample elevation when nearby terrain changes — only the next time that obstacle itself is moved.

UI is split into cards (`index.html`): a "2D Plan View" card and a "3D View" card side by side, plus a single "Editor" card below (mode toggle, then either the obstacles add/remove toolbar + selected instance panel, or the terrain brush-size toolbar, depending on mode). Both views render the *same* Three.js `scene` — 3D uses `PerspectiveCamera` + `OrbitControls`, 2D uses a static top-down `OrthographicCamera` (no pan/zoom yet) and is the interactive surface for both obstacle and terrain editing. The 2D view also shows a `CameraHelper` for the 3D camera (its position + frustum), so orbiting/zooming the 3D view is visible from above; kept 2D-only via Three.js `layers` (helper on layer 1, only `camera2d` has it enabled) rather than cluttering the 3D view with its own frustum. The helper is built from a proxy camera cloned from `camera3d` with a short `far` (8m, vs. the real camera's 1000) — synced to `camera3d`'s position/rotation every frame in `animate()` — so the frustum shows position/direction without drawing all the way to the real (and much longer) render distance. Trail marking isn't built yet — separate future feature per docs/decisions.md.

No real heightmap import, no trail marking, no landing ramp for the kicker yet — next step is likely one of those (see docs/decisions.md).
