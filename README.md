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

Currently a spike: mock survey points → local meters → triangulated mesh → rendered in Three.js, with parametric roller/berm/kicker obstacles you can add, select, drag to move, and drag-handle to rotate in the 2D Plan View — the 3D view updates live. Elevation auto-follows the terrain. No vertex editing, no trail marking, no real import yet — see [CLAUDE.md](CLAUDE.md) for status.
