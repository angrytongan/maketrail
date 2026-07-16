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

Roller obstacle (`src/obstacles/roller.ts`) — parametric sine-wave mesh (single hump, per the module's own comment on why it deviates from research/rollers.md's full-period formula), overlaid on the terrain as a separate object. `index.html`/`main.ts` wire up plain HTML range-input controls (length, height, position, rotation) that rebuild the geometry and update the mesh transform live, proving the parametric-obstacle + live-3D pipeline from docs/decisions.md.

UI is now split into cards (`index.html`): a "2D Plan View" card and a "3D View" card side by side, plus a controls card below. Both views render the *same* Three.js `scene` — 3D uses the existing `PerspectiveCamera` + `OrbitControls`, 2D uses a static top-down `OrthographicCamera` (no pan/zoom yet). The 2D card is currently just a top-down projection of the 3D scene, not the real interactive 2D editor — that (vertex editing, drag-drop obstacle placement, trail waypoints) is still a separate future feature per docs/decisions.md.

No drag-and-drop placement, no trail marking, no real import, no 2D-specific interactions yet — next step is likely building real interactivity into the 2D view or extending the obstacle set to berms/kickers.
