# Trail simulation

Not sourced from an external site — this is our own design notes for the "simulate a rider running the trail and flag problems" feature, built from the physics/rules already gathered in [[berms]], [[rollers]], and [[jumps]].

## Goal

Given a rider+bike profile and the marked trail line over the (edited) heightmap, run a simulated pass and flag geometry that's unsafe or won't flow, rather than requiring the user to manually check every obstacle against a rulebook.

## Rider/bike model (inputs)

Minimum params needed to drive the checks below:
- `mass` (rider + bike, kg)
- `wheelbase` (m) — for the "20% spare wheelbase over a roller" check
- `entry_speed` (m/s or km/h) — either a fixed assumed speed, or derived by integrating pump/pedal input + gravity along the trail profile (more accurate, more work — start with fixed/assumed speed per section)

## Checks to run (mapped to research already done)

1. **Turn sharpness / berm banking** ([[berms]]): at each marked turn, compute `required_lean = arctan(v²/(g·r))` from the simulated speed and the turn's actual radius. If the berm's built banking angle is well below `required_lean`, flag "under-banked for this speed" (rider would have to counter-steer against the berm). If there's no berm and `required_lean` is high (e.g. >25–30°), flag "turn too sharp for an unbanked corner."
2. **Roller spacing/height consistency** ([[rollers]]): flag rollers <3m apart, and flag a roller crest whose height deviates a lot from its neighbors (breaks the "same-height crests" flow rule).
3. **Jump gap vs. landing** ([[jumps]]): project the takeoff (speed + takeoff angle) as a parabola and check where it intersects the landing ramp. Flag "case" (lands short of the down-ramp — flat/dangerous landing) or "overshoot" (lands past the down-ramp, i.e. gap built too short for the speed it'll actually be hit at).
4. **Wheelbase clearance on rollers** ([[rollers]]): flag a roller where the rider's wheelbase leaves <20% spare on the up/down ramp.
5. **Grade sustainability** (from the mtbtrailbuilding trail-grade calculator — see note below): flag trail sections where the tread grade exceeds roughly half the underlying hillside grade, or where outslope is outside 3–5% (drainage risk rather than rider-safety, lower priority).

## Output

Simulation pass produces a list of flagged sections `{trail_position, issue_type, severity, message}` that can be highlighted on both the 2D heightmap and the 3D view — reuse the same trail-position addressing the editor already needs for placing obstacles along the marked line.

## Note: trail grade calculator

mtbtrailbuilding.com/calculators/trail-grade exposes only two concrete numbers (the rest is behind its interactive tool, not disclosed on the page):
- **Half rule**: trail grade should be no more than half the grade of the hillside it crosses.
- **Outslope**: 3–5% outslope on the tread for drainage.

Low priority relative to berms/rollers/jumps — revisit if/when drainage or long-term erosion modeling becomes a real feature request.

## Open questions (not yet answered by research)

- Whether to simulate speed as user-supplied per-section constants, or actually integrate physics (gravity + rolling resistance + pump input) along the heightmap profile. Latter is more correct but a much bigger build — start with the constant/assumed-speed version.
- How much of this becomes real-time feedback while editing vs. an on-demand "run simulation" pass.
