# Skinnies

Sources:
- https://www.mtbr.com/threads/building-skinnies.393141/
- https://www.mtbr.com/threads/building-a-skinny.608912/
- https://mtbhopper.com/products/skinny-bike-training-set
- research/build-plans.md's "Simple Skinny Plans" (lunchridemtb.com, not yet reviewed) and [[velomaster-features]]'s "Rails / Balance (beam)" entry

## Mechanism

A narrow, raised beam/bridge that tests balance rather than pumping/jumping/turning — the rider's task is simply staying on a tread far narrower than their bike. Structurally the simplest of the obstacles researched so far: a flat tread at a fixed height, supported by posts along its length, with no profile curve at all (unlike every other obstacle here).

Two independent difficulty axes, not one:
- **Width** — determines the balance *skill* required. Riding a 10cm-wide beam takes the same skill whether it's on the ground or 3m up.
- **Height off the ground** — determines *risk/consequence* of a fall (the "fear factor"), independent of width.

This decouples cleanly into two obstacle params rather than one combined "difficulty" knob.

## Dimensions

| Level | Width | Typical height off ground |
|-------|-------|-----------------------------|
| Beginner/easy | ~30cm (12in) | ~0.45m (18in), sometimes ground-level (0.2–0.3m) |
| Intermediate | ~13cm (5in) | ~0.45–0.9m |
| Advanced | ~10cm (4in) | ~0.6–0.9m |
| Expert | ~5cm (2in) | up to ~1.2m (4ft) — height added deliberately for fear factor, not skill |

- Ground-level/"easy" skinnies are sometimes built directly on grade with only a low curb tread (~0.2–0.3m), used as an introductory version before raising the same width onto a beam.
- Builders commonly recommend a bypass route around a skinny plus a feature just before it (e.g. a small roller) to slow riders enough to judge the line and take the bypass if needed — a trail-layout/routing detail, not obstacle geometry, but worth remembering once [[decisions]]'s trail-marking feature exists.

## Relevance to maketrail

- New obstacle type, and the simplest to model geometrically: a flat rectangular tread, `length` × `width`, elevated `height` above its base, no curve/profile needed (a straight extrusion, simpler than the roller/berm/kicker's arcs). Optional support posts are a rendering-only detail, not a parametric requirement.
- The width/height independence above maps directly onto the difficulty-rating system ([[decisions]]' "Difficulty rating"): width feeds a skill-difficulty check, height feeds a separate risk/consequence flag — worth keeping as two separate simulation checks rather than one combined score. See [[simulation]].
- Like the kicker/drop, likely wants a directional bypass indicator eventually, though the bypass itself (an alternate trail route) is a trail-marking-level concern rather than an obstacle-model one.
