# Feature backlog

Not-yet-built features and known gaps. Check [docs/decisions.md](decisions.md) for the scope/design reasoning behind an item before starting it. When an item is built, remove it from here and describe it in `CLAUDE.md`'s Status section instead — this file is only the "not done yet" list.

## Terrain

- [ ] Real heightmap import — file upload/parser for real lat/lon/height survey data. Currently only mock-generated points (`mockSurveyPoints` in `src/main.ts`).

## Obstacles

- [ ] Kicker landing/gap piece — the takeoff ramp exists (`src/obstacles/kicker.ts`); no linked gap or landing yet.
- [ ] Obstacle directionality arrows — a visual entry→exit indicator for one-way obstacles (kickers, and any other asymmetric type). See decisions.md "Obstacle directionality".
- [ ] Berm terrain lead-in/lead-out — optional generated transition geometry from the surrounding ground height up onto a berm's raised edge, instead of hitting a lip. See decisions.md "Obstacle terrain transitions".
- [ ] Berm mirroring — `buildBermGeometry` only turns toward one side (fixed center of curvature); needs a direction flag to mirror the other way.
- [ ] Obstacles auto-resampling elevation when nearby terrain changes — currently only resamples the next time the obstacle itself is moved, so a terrain edit near a stationary obstacle leaves it visually stale.

### New obstacle types (researched, not yet built)

- [ ] Teeter-totter (seesaw) — pivoting plank on an off-center fulcrum; the only obstacle whose ridden geometry changes dynamically rather than being a static mesh, so likely wants a static "resting position" mesh as a smaller first cut before any tipping animation. See [research/teeter-totter.md](../research/teeter-totter.md).
- [ ] Drop — lip + fall height + landing (flat or ramped transition), no takeoff arc unlike the kicker. Directional, and a natural fit for a difficulty-band simulation check (IMBA height bands). See [research/drops.md](../research/drops.md).
- [ ] Skinny — narrow raised balance beam, simplest obstacle geometrically (flat extrusion, no curve). Width (skill) and height off ground (risk) are independent params, both worth their own simulation check. See [research/skinnies.md](../research/skinnies.md).

## Editor

- [ ] Flatten the selection ring and rotate handles against the terrain — `updateSelectionVisuals` in `src/main.ts` currently draws a flat horizontal disc/handles at a single Y height, so on sloped terrain it floats above or clips into the ground instead of hugging the surface.
- [ ] Resizable panes — the 2D/3D/Editor card grid (`index.html`'s `.app`, `grid-template-areas`) has fixed column/row proportions; no way to drag a divider to resize.
- [ ] Fix the Editor card's height so it doesn't change size as different obstacle panels (roller/berm/kicker) or modes (obstacles/terrain) show different numbers of controls — its grid row is currently `auto`, so switching panels reflows the shared row and changes the 2D view's size along with it.
- [ ] Improve height detection and placement for obstacles — `sampleTerrainHeight` (`src/terrain/sample.ts`) is nearest-neighbor, not barycentric interpolation on the actual triangulated mesh (a known, flagged simplification), so placement can be slightly off on sparser/coarser terrain; obstacles are also placed level (Y-elevation only) rather than oriented to match local terrain slope.
- [ ] A way to disable/hide the terrain vertex markers in the 2D view — currently they always show in Terrain mode (`vertexMarkers.visible = mode === "terrain"` in `src/main.ts`), with no option to turn them off if they're cluttering the view.

## Trail

- [ ] Split a trail at a waypoint — cut one continuous trail into two separate trails at a selected marker.
- [ ] On deleting the selected waypoint, select the previous waypoint in the sequence instead of clearing selection entirely (`deleteSelectedWaypoint` in `src/main.ts` currently calls `selectWaypoint(null)`) — lets you delete several waypoints in a row without re-clicking each time.

## Difficulty / simulation

- [ ] Rider+bike simulation — checks that flag bad geometry (sharp turns, under-banked berms, jump too long/short). Design in [research/simulation.md](../research/simulation.md).
- [ ] Aggregate trail difficulty rating (green/blue/black/double-black), rolled up from per-obstacle simulation results. See decisions.md "Difficulty rating".

## Build output (further out)

- [ ] Export a build document per obstacle instance (dimensions/plans), informed by research/build-plans.md, research/jumps.md, research/berms.md, research/rollers.md.
- [ ] Export a cut/fill diff of terrain modifications from the originally imported heightmap.

## Deployment

- [ ] Set up deploy to GitHub Pages — static build (`npm run build`), no backend, so should be a straightforward Actions workflow publishing `dist/`.
