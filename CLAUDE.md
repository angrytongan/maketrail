# maketrail

Browser app to design and visualise a mountain bike trail: a 2D heightmap editor (import lat/lon/height points, raise/lower vertices, place obstacles, mark the trail line) paired with a 3D render of the same terrain. Units are metric throughout.

Default terrain: 20m x 20m x 0 elevation grid, vertex spacing 0.5m, grid size configurable.

## Decisions

[docs/decisions.md](docs/decisions.md) — scope/architecture decisions (persistence, trail marking, obstacle editing, difficulty rating, undo, future build-export). Check this before assuming how something should work.

## Feature backlog

[docs/features.md](docs/features.md) — not-yet-built features and known gaps. Check here for what's next; once an item is built, remove it from there and describe it in the Status section below instead.

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
- [research/teeter-totter.md](research/teeter-totter.md) — pivoting-plank mechanism, dimensions, approach angle; only obstacle whose ridden geometry changes dynamically
- [research/drops.md](research/drops.md) — lip/fall-height/landing model, IMBA difficulty-band drop heights
- [research/skinnies.md](research/skinnies.md) — narrow balance beam, width (skill) vs. height (risk) as independent params

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

**Multi-instance + 2D placement** is now real (`src/obstacles/instance.ts`, wired up in `main.ts`): an arbitrary number of obstacle instances (any mix of the 3 types) live in an `instances` array. "+ Roller / + Berm / + Kicker" buttons spawn new ones (staggered default position); clicking one in the 2D Plan View selects it (hit-tested by distance via `getFootprintRadius`, not a `Raycaster` — the 2D camera is a simple top-down orthographic projection, so screen↔world is direct math, see `src/view2d/projection.ts`). Selecting an instance shows its type's slider panel (reusing the previous per-type panels, now dynamic), a yellow selection ring, and **four** rotate handles at 0/90/180/270° around it (not one — a single handle can land inside terrain or off-screen and become unreachable; grabbing any of the four rotates the obstacle the same way, see `findGrabbedHandleOffset`/`DragMode`'s `handleOffset`). Dragging the body moves it; dragging a handle rotates it (yaw only, per the decision that 3-axis rotation would require 3D manipulation, which conflicts with 2D-only editing). Position (x/z) and rotation have no sliders either — the 2D view (drag the body / drag a handle) is the only way to move or rotate an obstacle, same as elevation, which is auto-sampled from the terrain via nearest-neighbor lookup (`src/terrain/sample.ts`) every time an instance's x/z changes. The per-type panels are shape params only.

**Terrain vertex editing** (`src/terrain/brush.ts`, wired up in `main.ts`) is a brush, not one-vertex-at-a-time — dragging every point individually would be tedious. `getPointsInBrush` finds every terrain point within an adjustable radius of the cursor with a cosine falloff (full effect at center, tapering to zero at the edge, so strokes don't leave a flat plateau with a hard edge). An `editMode: "obstacles" | "terrain"` toggle (buttons in the "Editor" card header) switches the 2D view's click/drag behavior between the two — they'd otherwise be ambiguous. In Terrain mode: small marker dots (a single `THREE.Points` with per-vertex colors) appear over all mock survey points, highlighting yellow when under the brush (even on hover, before dragging) — 2D-view-only (same `layers` mechanism as the camera helper below), since they're a 2D editing aid and would just clutter the 3D view.

Within Terrain mode, a `terrainTool: "sculpt" | "smooth"` toggle picks the brush behavior: **Raise/Lower** applies an incremental height delta from vertical mouse movement since the *previous* move event, with the brush's world position locked at drag-start (moving the mouse vertically maps to world Z in this top-down view, so the brush can't also follow the cursor without fighting height control). **Smooth** pulls each affected point toward the brush area's own weighted-average height each stroke (a Laplacian-style blur using the brush region as its own neighborhood, `SMOOTH_STRENGTH` per event) — it has no such conflict, so it *does* follow the live cursor while dragging, letting you sweep it across an area.

A `<header>` above the app (bike icon, "maketrail" title, an "in development" pill, a GitHub link icon to the repo) sits outside the main grid — `body` is a flex column so the header takes its natural height and `.app` fills the rest (`flex: 1; min-height: 0`) rather than both trying to claim 100% of the viewport.

UI is split into cards (`index.html`), laid out as a 2-column CSS grid (`grid-template-areas`): the "2D Plan View" card and a single "Editor" card (mode toggle, then either the obstacles add/remove toolbar + selected instance panel, the terrain brush-size toolbar, or the trail width/delete toolbar, depending on mode) are stacked in the left column; the "3D View" card fills the whole right column, spanning both rows so it's taller than either left-column card individually. Both views render the *same* Three.js `scene` — 3D uses `PerspectiveCamera` + `OrbitControls`, 2D uses a static top-down `OrthographicCamera` (no pan/zoom yet) and is the interactive surface for obstacle, terrain, and trail editing. The 2D view also shows a `CameraHelper` for the 3D camera (its position + frustum), so orbiting/zooming the 3D view is visible from above; kept 2D-only via Three.js `layers` (helper on layer 1, only `camera2d` has it enabled) rather than cluttering the 3D view with its own frustum. The helper is built from a proxy camera cloned from `camera3d` with a short `far` (8m, vs. the real camera's 1000) — synced to `camera3d`'s position/rotation every frame in `animate()` — so the frustum shows position/direction without drawing all the way to the real (and much longer) render distance.

**Trail marking** (`src/trail/waypoint.ts`, `src/trail/spline.ts`, `src/trail/proximity.ts`, all pure/tested; wired up in `main.ts` as a third `editMode: "trail"`): click the 2D Plan View to add waypoints; a cubic-Bezier spline runs through them, each waypoint carrying **one** tangent handle (mirrored across the waypoint for the incoming/outgoing control points, like a vector-graphics pen tool's "smooth point" — not two independent handles). New waypoints default their handle to continue the previous direction of travel. Selecting a waypoint (click it) shows its handle and enables a "Delete waypoint" button; dragging the body moves it, dragging the handle reshapes the curve. The actual trail is **not** a separate mesh overlaid on the terrain (an earlier ribbon-mesh version never quite conformed to the terrain's shape) — `updateTerrainColors` tints the terrain's own vertex colors wherever `isNearTrail` finds them within `trailWidth` (default 2m, adjustable via a slider) of the sampled spline centerline, nearest-neighbor style like `sampleTerrainHeight`. This renders in **both** views automatically, since it's the terrain mesh itself; the waypoint dots and the selected handle are 2D-only (same `layers` mechanism as the camera helper/terrain vertex markers), since the spline/handle representation is a 2D-editing concept, not part of the "real" trail (per docs/decisions.md). Waypoints, handles, and trail width are all covered by undo/redo — `restoreState` restores them *before* `writeHeightsToGeometry` runs, since that call recolors the terrain (including the trail tint) from whatever `waypoints`/`trailWidth` currently hold.

**Undo / redo** (`src/history/stack.ts` — generic, pure, tested; wired up in `main.ts`): an in-session snapshot stack, per docs/decisions.md. Each snapshot is `{ instances, heights }` (obstacle instances + terrain vertex heights); camera/view state is deliberately never snapshotted, so orbiting/panning is never undoable. Covers obstacle add/remove (`performAtomicAction`), obstacle move/rotate drags and terrain sculpt/smooth brush strokes (`beginHistoryGesture`/`commitHistoryGesture`, snapshotting once at gesture start and committing once at gesture end so a whole drag is one undo step, not one per pointermove tick), and obstacle parameter sliders (snapshotted on the first `input` of a hold, committed on `change`). No-op gestures (e.g. a click without movement) are detected via a `JSON.stringify` before/after comparison and never pushed. Triggered by Undo/Redo buttons in the Editor card header and Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z (or Ctrl+Y) keyboard shortcuts.

See [docs/features.md](docs/features.md) for what's not built yet.
