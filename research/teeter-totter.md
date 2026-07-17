# Teeter-totter (seesaw)

Sources:
- https://www.singletracks.com/mtb-tips/mountain-bike-teeter-totter-assembly/
- https://cutlaps.com/en-us/blogs/trail-building/how-i-built-a-giant-mountain-bike-seesaw-diy-backyard-mtb-teeter-totter
- https://velosolutions.com/velomaster/ (lists "Seesaw" as a catalog feature — see [[velomaster-features]])

## Mechanism

A plank/deck pivoting on a raised fulcrum, not a symmetric 50/50 seesaw. The rider rides up the (longer/heavier) approach side while it's grounded; once their weight crosses the pivot point, the plank tips down under them and they ride down the now-lowered far side to the ground. Unlike a roller/berm, the obstacle's geometry **changes while being ridden** — this is a departure from every obstacle currently modeled (roller/berm/kicker are all static meshes).

- The plank rests approach-side-down at idle: it's built so the pivot sits off-center from the plank's midpoint, keeping the (usually longer) approach side grounded until a rider's weight physically crosses the fulcrum.
- Tipping too slowly (rider scrubs off speed climbing the approach side) can stall the plank partway and drop the rider — approach speed matters, not just weight.
- Some builds use an adjustable pivot position, so the same feature can be tuned less intimidating for beginners or less trivial for experts.

## Dimensions

- Length: commonly ~3.7m (12ft) for a basic build; ranges from ~2.4m (8ft) up to 6–7.6m (20–25ft) for larger/showpiece versions.
- Approach angle: ~20–22° from horizontal at the grounded end.
- Deck width: narrow "North Shore"-style builds run ~7.6cm (3in) — effectively a moving [[skinny]] — up to a full wood-deck width around 0.46–0.6m with double stringers.
- Pivot support height off the ground: modest, typically well under 0.5m (built from stacked beam sections with a captured pivot pipe) — the fulcrum itself stays low even though the plank's raised end can be higher.

## Relevance to maketrail

- Would need a new obstacle type distinct from the roller/berm/kicker pattern: params likely `length`, `deckWidth`, `pivotOffset` (fraction along the length, off-center) and `approachAngle` (or derive it from length + a fixed rise).
- Unlike the other three, its resting-state geometry (approach side down) is fixed/static for placement and rendering purposes — the tipping animation itself is a simulation/animation concern, not a geometry-authoring one, and out of scope until [[simulation]] is built.
- Candidate simulation checks once built: does the rider's speed at the pivot look sufficient to complete the tip (per the "scrubs off too much speed → stalls/tips over" failure mode above)?
- See [[decisions]]'s obstacle model — this is the first candidate obstacle whose *ridden* geometry isn't fully static, worth flagging as a scope decision before starting (a static "resting position" mesh is a much smaller first cut than modeling the pivot mechanism).
