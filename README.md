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

Currently a spike: mock survey points → local meters → triangulated mesh → rendered in Three.js, plus parametric roller, berm, and kicker obstacles overlaid on it with live-updating controls. The UI is split into cards — a 2D plan view (static top-down projection for now) and a 3D view, both showing the same scene. No drag-and-drop placement, no multi-instance obstacles, no trail marking, no real import yet — see [CLAUDE.md](CLAUDE.md) for status.
