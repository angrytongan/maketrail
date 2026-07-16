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

Currently a spike: mock survey points → local meters → triangulated mesh → rendered in Three.js, plus a parametric roller obstacle overlaid on it with live-updating controls (length/height/width/position/rotation). No 2D editor, drag-and-drop placement, or trail marking yet — see [CLAUDE.md](CLAUDE.md) for status.
