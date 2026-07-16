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

Both obstacles follow the same convention: geometry centered on its own local origin so position/rotation pivots around the obstacle's actual center, not a corner. `index.html`/`main.ts` wire up a live slider panel per obstacle (one hardcoded instance each, not yet placeable/multi-instance) that rebuilds the geometry and updates the mesh transform in real time.

UI is split into cards (`index.html`): a "2D Plan View" card and a "3D View" card side by side, plus Roller/Berm controls cards below. Both views render the *same* Three.js `scene` — 3D uses `PerspectiveCamera` + `OrbitControls`, 2D uses a static top-down `OrthographicCamera` (no pan/zoom yet). The 2D card is currently just a top-down projection of the 3D scene, not the real interactive 2D editor — that (vertex editing, drag-drop obstacle placement, trail waypoints) is still a separate future feature per docs/decisions.md.

No drag-and-drop placement, no multi-instance obstacles, no trail marking, no real import yet — next step is likely the kicker obstacle, or tackling multi-instance + real 2D placement (see docs/decisions.md).
