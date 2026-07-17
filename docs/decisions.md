# Design decisions

Scope/architecture decisions made during research phase, so they don't need re-asking each session. Update this file when a decision changes rather than leaving it stale.

## Persistence

Local only — browser storage plus explicit import/export of JSON files. No backend, no accounts, no server-side sharing. Revisit only if a real need for cross-device sync or sharing shows up.

## Terrain

- Blank-canvas default (no import yet — the common first-run case, since users won't usually have import data on hand): 20m x 20m, 0 elevation, regular grid, vertex spacing 0.5m. This is an arbitrary starting point, not a load-bearing architectural assumption.
- Imported terrain (sparse lat/lon/height points) keeps its own **native irregular triangulated mesh** rather than being resampled onto the regular grid — more faithful to survey data. Provide user-facing knobs for mesh **subdivision** (add detail) and **decimation** (reduce detail), rather than forcing one fixed resampling behavior.
- So there are two terrain representations to support: regular grid (blank canvas / hand-authored) and irregular mesh (imported). Vertex-editing (raise/lower) needs to work on both.
- Intended real-world trail scale (tens of meters vs hundreds of meters to km) is still undecided — keep grid size configurable and revisit once building for real; don't hard-code assumptions that only work at one scale.

## Trail marking

Implemented: `src/trail/waypoint.ts`, `src/trail/spline.ts`, `src/trail/proximity.ts` (all pure, tested), wired up in `main.ts` as a third `editMode: "trail"`.

- User clicks a sequence of waypoints on the 2D heightmap (a new "Trail" mode alongside Obstacles/Terrain).
- A cubic-Bezier spline runs through them. Each waypoint has **one** tangent handle (not two) — the handle is the outgoing control point for the segment to the next waypoint, and its mirror across the waypoint is the incoming control point for the segment from the previous one (the same "smooth point" model a vector-graphics pen tool uses). A new waypoint's handle defaults to continuing the direction of travel from the previous waypoint, fully overridable by dragging.
- In the 3D view, the trail is **not** rendered as a separate ribbon mesh overlaid on the terrain — an initial ribbon-mesh implementation was replaced (per direct feedback) with painting the trail color directly onto the terrain's own vertex colors (`isNearTrail` checks each terrain vertex against the sampled spline centerline, nearest-neighbor style like `sampleTerrainHeight`). An overlaid mesh never quite conforms to the terrain's actual shape; tinting the terrain's own vertices always matches it exactly, with no separate geometry to keep in sync. The spline/handle representation (waypoint dots, the selected waypoint's handle) is still a 2D-editor-only concept, kept 2D-only via the same `layers` mechanism as the camera helper/terrain vertex markers.
- The trail has a **configurable width** (not just a centerline) — default 2m, adjustable via a slider, per the ~2m corridor referenced in [research/pump-tracks.md](../research/pump-tracks.md) — used as the tint radius around the centerline rather than a mesh width.
- Waypoints, their handles, and trail width are covered by undo/redo (see "Undo / history" below) — add/move/reshape/delete/width-change are all undoable, consistent with obstacles and terrain.

## Obstacle editing

- All placement and parameter editing happens in the 2D top-down editor only — no direct manipulation (drag/rotate) in the 3D viewport for now.
- Obstacles are defined parametrically (type + params, e.g. a roller's length/height ratio). Editing params updates the 3D view in real time.
- Placement is **free** — drag an obstacle anywhere on the heightmap and rotate it freely. Not snapped or tied to the trail spline in any way (trail marking and obstacle placement are independent concerns).
- Obstacles are **separate 3D objects overlaid on the terrain**, not a deformation of the terrain height field. Terrain and obstacles stay as two independent data structures — simpler to implement/edit parametrically, at the cost of possible clipping if placed on steeply sloped terrain (acceptable for now).
- Every obstacle's geometry is built **centered on its own local origin** (extents span symmetrically, e.g. `-length/2..length/2`), so that the position/rotation transform applied on top pivots around the obstacle's actual center rather than a corner. See `src/obstacles/roller.ts` for the pattern to follow for berms/kickers.
- Beyond the shared placement params (position, rotation), each obstacle type has its own **type-specific parameters** on top of the base shape params (e.g. the roller's `periods`, letting several humps chain into one obstacle instance rather than placing/aligning separate rollers by hand). Expect berms/kickers to need their own type-specific params too (e.g. a kicker's takeoff-profile choice from research/jumps.md).
- MVP build order: **roller first** — simplest shape (single sine curve, no separate linked pieces), proves the terrain-mesh + parametric-obstacle + live-3D pipeline before tackling berms (banking/turn blending) or kickers (linked takeoff/gap/landing pieces).

## Obstacle terrain transitions

Not implemented yet — noted for later. A berm's cross-section is banked immediately at both ends of its sweep (see `src/obstacles/berm.ts`), so there's currently no smooth ramp from the surrounding terrain's actual height up onto the berm's raised edge — a rider would hit a lip rather than transition on. Proposed: a per-instance option (e.g. `generateTransitions: boolean`) that, when enabled, builds lead-in/lead-out connector geometry from the ground terrain height to the obstacle's entry/exit edges. Likely relevant to other obstacles with a raised entry/exit too, not just berms (see [research/berms.md](../research/berms.md)).

## Obstacle directionality

Not implemented yet — noted for later. Some obstacle types are one-way: an asymmetric kicker/lander (arc'd takeoff, sloped landing) only works ridden in the intended direction, unlike a symmetric roller which is the same either way. Not yet designed, but will need:
- A per-obstacle-type flag (or per-instance override) for whether it's directional.
- A visual indicator on directional obstacles — likely an arrow rendered on/above the obstacle showing entry → exit — so it's obvious in both the 2D editor and 3D view which way it's meant to be ridden.
- The trail simulation ([[simulation]]) should flag a directional obstacle that the trail line approaches from its exit side, since that's a real "you built this backwards" error, not just a style nitpick.

## Difficulty rating

Want both:
- Per-obstacle flags from the trail simulation (sharp turn, under-banked berm, jump too long/short, etc — see [research/simulation.md](../research/simulation.md)).
- An aggregate trail-level difficulty rating (green/blue/black/double-black style), rolled up from the per-obstacle results. Not yet designed — candidate input: [research/sources-to-review.md](../research/sources-to-review.md)'s "Guidelines for a Quality Trail Experience" once reviewed.

## Rendering style

Simple/schematic for the 3D view — flat-shaded or basic materials, solid colors, no textures. Prioritizes shape/geometry correctness over visual polish. Revisit once the core pipeline (terrain + obstacles + trail) is proven.

## Simulation trigger

On-demand only — user clicks "run simulation" to get flagged issues, rather than continuous live validation while editing. Avoids performance concerns from re-running physics checks on every edit; revisit if the checks turn out to be cheap enough to run live.

## Simulation scope

Since obstacle placement is free (not tied to the trail), simulation only evaluates obstacles that the trail line actually passes through/near — not every obstacle placed on the map.

## Rider/bike profile

Named presets (e.g. beginner/intermediate/advanced/expert, matching the difficulty bands already in [research/berms.md](../research/berms.md)) with sensible mass/wheelbase/speed defaults per preset, selected for a simulation run. Presets feed into the aggregate difficulty rating above.

## Undo / history

Implemented: an in-session undo/redo stack (`src/history/stack.ts` for the generic push/undo/redo mechanics, wired up in `main.ts`). No versioned save-point system, no persistence across page reloads.

Snapshot-based, not command-based — each step is a full clone of the mutable state (obstacle instances, terrain heights, trail waypoints + width), which is simplest given how little mutable state there is. Camera/view state is deliberately excluded from snapshots, so orbiting/panning is never undoable. Covers: obstacle add/remove, obstacle move/rotate (2D drag), obstacle parameter sliders, terrain sculpt/smooth brush strokes, and trail waypoint add/move/reshape/delete + width changes. A whole drag or a whole slider-hold is one undo step (snapshotted at gesture start, committed at gesture end only if something actually changed), not one step per intermediate event.

## Real-world build output

Out of scope for now — the tool is visualization/planning only. Noted for the future:
- Export a build document per obstacle instance (dimensions/plans), likely informed by [research/build-plans.md](../research/build-plans.md) and [research/jumps.md](../research/jumps.md) / [research/berms.md](../research/berms.md) / [research/rollers.md](../research/rollers.md) geometry.
- Export a record of terrain modifications made from the original imported heightmap (i.e. a cut/fill diff), relevant to the excavation-volume/materials-estimator calculators noted in research.
