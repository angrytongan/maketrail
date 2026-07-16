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

- User clicks a sequence of waypoints on the 2D heightmap.
- A spline runs through them, editable via per-point tangent handles (Bezier-style handles the user can drag), not just the waypoints themselves.
- In the 3D view, the trail is **not** rendered as a floating spline curve — it's a distinct-colored path draped directly onto the terrain surface. The spline/handle representation is a 2D-editor-only concept.

## Obstacle editing

- All placement and parameter editing happens in the 2D top-down editor only — no direct manipulation (drag/rotate) in the 3D viewport for now.
- Obstacles are defined parametrically (type + params, e.g. a roller's length/height ratio). Editing params updates the 3D view in real time.
- Placement is **free** — drag an obstacle anywhere on the heightmap and rotate it freely. Not snapped or tied to the trail spline in any way (trail marking and obstacle placement are independent concerns).
- MVP build order: **roller first** — simplest shape (single sine curve, no separate linked pieces), proves the terrain-mesh + parametric-obstacle + live-3D pipeline before tackling berms (banking/turn blending) or kickers (linked takeoff/gap/landing pieces).

## Difficulty rating

Want both:
- Per-obstacle flags from the trail simulation (sharp turn, under-banked berm, jump too long/short, etc — see [research/simulation.md](../research/simulation.md)).
- An aggregate trail-level difficulty rating (green/blue/black/double-black style), rolled up from the per-obstacle results. Not yet designed — candidate input: [research/sources-to-review.md](../research/sources-to-review.md)'s "Guidelines for a Quality Trail Experience" once reviewed.

## Rendering style

Simple/schematic for the 3D view — flat-shaded or basic materials, solid colors, no textures. Prioritizes shape/geometry correctness over visual polish. Revisit once the core pipeline (terrain + obstacles + trail) is proven.

## Simulation trigger

On-demand only — user clicks "run simulation" to get flagged issues, rather than continuous live validation while editing. Avoids performance concerns from re-running physics checks on every edit; revisit if the checks turn out to be cheap enough to run live.

## Undo / history

Not needed for the prototype phase. Add an in-session undo/redo stack later if it turns out to be missed; no versioned save-point system planned.

## Real-world build output

Out of scope for now — the tool is visualization/planning only. Noted for the future:
- Export a build document per obstacle instance (dimensions/plans), likely informed by [research/build-plans.md](../research/build-plans.md) and [research/jumps.md](../research/jumps.md) / [research/berms.md](../research/berms.md) / [research/rollers.md](../research/rollers.md) geometry.
- Export a record of terrain modifications made from the original imported heightmap (i.e. a cut/fill diff), relevant to the excavation-volume/materials-estimator calculators noted in research.
