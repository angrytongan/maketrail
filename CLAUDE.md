# maketrail

Browser app to design and visualise a mountain bike trail: a 2D heightmap editor (import lat/lon/height points, raise/lower vertices, place obstacles, mark the trail line) paired with a 3D render of the same terrain. Units are metric throughout.

Default terrain: 20m x 20m x 0 elevation grid, vertex spacing 0.5m, grid size configurable.

## Decisions

[docs/decisions.md](docs/decisions.md) — scope/architecture decisions (persistence, trail marking, obstacle editing, difficulty rating, undo, future build-export). Check this before assuming how something should work.

## Feature backlog

[docs/features.md](docs/features.md) — not-yet-built features and known gaps. Check here for what's next; once an item is built, remove it from there and describe it in the Status section below instead.

## Research

See [research/CLAUDE.md](research/CLAUDE.md).

## Stack

Vite + TypeScript + Three.js, npm, Vitest, ESLint (flat config, `typescript-eslint` recommended). `npm run dev` / `build` / `test` / `lint` / `typecheck`. No framework (plain TS), no backend — see [docs/decisions.md](docs/decisions.md) for why.

## Status

[docs/status.md](docs/status.md) — what's built and how (terrain, lighting, obstacles, multi-instance placement, terrain editing, header/layout, trail marking, undo/redo). Update this after each completed feature.
