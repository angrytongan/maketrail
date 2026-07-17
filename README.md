# maketrail

Browser app for designing and visualising a mountain bike trail: a 2D heightmap editor (import real-world lat/lon/height points, edit terrain, place obstacles, mark the trail) next to a 3D render of the same terrain.

See [research/](research/) and [docs/decisions.md](docs/decisions.md) for design notes and scope decisions.

## Running

```
npm install
npm run dev        # start the dev server
npm test           # run tests
npm run lint        # lint
npm run typecheck   # type-check
```

Currently a spike: mock survey points → local meters → triangulated mesh → rendered in Three.js. The "Editor" card toggles between three modes: **Obstacles** (add/select/drag-to-move/drag-handle-to-rotate parametric roller/berm/kicker instances), **Terrain** (a brush with an adjustable radius, with a **Raise/Lower** tool — drag up to raise, down to lower — and a **Smooth** tool that blurs bumps toward the local average), and **Trail** (click to add waypoints, drag to move one or reshape its curve handle, rendered as a width-configurable ribbon draped on the terrain). All three work in the 2D Plan View with the 3D view updating live. Terrain is shaded by a green→brown height color ramp in both views, with the 3D view additionally lit by a raking directional light and shadows. Obstacle, terrain, and trail edits all support undo/redo (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, or the Undo/Redo buttons) — camera movement is never part of it. No real heightmap import yet — see [CLAUDE.md](CLAUDE.md) for status.
