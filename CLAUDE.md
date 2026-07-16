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

## Status

Research phase — no application code yet.
