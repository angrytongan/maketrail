# Drops

Sources:
- https://www.imba.com/resource/trail-difficulty-rating-system
- https://morgantilton.com/how-to-ride-drops-on-your-mountain-bike/
- https://gyroorboard.com/blogs/learn-with-gyroor/mountain-biking-drops-mastering-the-art-of-controlled-descents

## Mechanism

A rider rides off a raised lip/ledge and free-falls briefly before landing on a lower surface — distinct from a [[jumps]]-style kicker in that there's no upward takeoff arc; the bike leaves the lip roughly horizontally (or following the trail's existing grade) and gravity alone determines the fall. Structurally, a drop has:

- A **lip** — the edge the rider leaves from, usually just the trail surface ending abruptly (often natural: a rock ledge, root step, or a built wooden edge) rather than a shaped ramp.
- A **fall height** — vertical distance from lip to landing.
- A **landing surface** — either flat/hardpack (higher impact for a given height) or a sloped/ramped transition (absorbs impact, effectively allowing a taller drop at the same felt difficulty). This is the same lip/landing distinction as [[jumps]], but a drop's "takeoff" contributes no lift of its own.

## Difficulty bands (IMBA trail-rating system)

IMBA's system rates unavoidable obstacle/drop height per trail color, the same green/blue/black/double-black vocabulary already used for [[berms]]' difficulty bands:

| Level | Max unavoidable drop/obstacle height |
|-------|----------------------------------------|
| Green (easy) | ≤0.2m (8in) |
| Blue (intermediate) | ≤0.38m (15in) |
| Black (advanced) | ≤0.38m (15in), but steeper approach/more consequence |
| Double black (expert) | can exceed 1.2m (48in); landing/deck explicitly "unpredictable" |

These are IMBA's general natural-obstacle thresholds (drops, ledges, roots, rocks), not drop-specific engineering figures — no dedicated drop calculator was found (unlike [[jumps]]'s cutlaps.com or [[berms]]' mtbtrailbuilding.com). Treat these bands as a first-pass default, to revisit if a drop-specific source turns up.

## Relevance to maketrail

- New obstacle type, structurally closer to the kicker ([[jumps]]) than the roller/berm: an edge/lip, a fall height, and a landing. Candidate params: `height` (fall height), `landingSlope` (0 = flat, >0 = ramped transition — reusing the kicker's lip-angle-style parameter for the landing side instead of the takeoff side), `width`.
- Unlike the kicker, there's no takeoff arc to model — the geometry is closer to "flat run-in, vertical (or near-vertical) face, then landing surface at `-height`" rather than a circular arc.
- The height/difficulty table above is a direct candidate for the same kind of **simulation lint check** used elsewhere: flag a drop whose height exceeds the target rider profile's difficulty band, same pattern as the berm's lean-angle-vs-banking-angle check. See [[simulation]].
- One-way/directional by nature (same as the kicker) — see [[decisions]]'s "Obstacle directionality" note, which already anticipates non-roller obstacles needing this.
