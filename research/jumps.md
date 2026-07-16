# Jumps (kickers / landers)

Sources:
- https://mtbtrailbuilding.com/calculators/jump-design
- https://cutlaps.com/pages/kicker-calculator

## Model

Calculator is explicit that it uses **projectile motion** — no proprietary formula disclosed, it's plain physics:

```
vx = v * cos(θ)
vy = v * sin(θ)
t_flight = 2 * vy / g          # flat landing; use landing-slope-aware version below for real trails
range = vx * t_flight
peak_height = vy² / (2 * g)
```

For a landing that isn't at the same height as takeoff (the normal case — landings are usually built sloped/downhill from takeoff), solve the projectile's `y(t) = vy*t - 0.5*g*t²` against the landing ramp's line/slope instead of assuming `y=0` at landing — that gives correct distance and landing angle instead of the flat-ground approximation.

## Inputs / outputs (as exposed by the calculator UI)

- Inputs: rider speed (mph/km/h), takeoff angle (deg), unit system.
- Outputs: trajectory (parabola), air time, landing angle, jump distance, jump height.
- Typical takeoff angle range: **15–30°**.
- Explicit caveat on the site: "guideline only, results may include a margin of error" — i.e. don't treat this as exact, real jumps are tuned/tested empirically too.

## Circular-arc kicker shape (cutlaps.com)

Where the mtbtrailbuilding calculator models the *rider's flight*, cutlaps.com models the *takeoff ramp itself* as a circular arc, tangent to flat ground at its base and ending at the lip angle. Inputs are just **height** and **lip angle**; it outputs radius, base length, chord length, and arc length. The page doesn't publish its formulas, but they follow directly from the arc geometry (tangent-to-horizontal at the base, angle θ at the lip):

```
R = radius
θ = lip angle (radians)

height (rise)  = R * (1 - cos θ)
base_length    = R * sin θ
chord_length   = 2R * sin(θ/2)
arc_length     = R * θ
```

Given height + θ (the calculator's own inputs), solve the first equation for `R = height / (1 - cos θ)`, then the rest follow.

Reference radii by bike/use case (converted to metric):
- BMX: 2.4–3m
- Dirt jump: 3–4m
- Dual suspension (trail/enduro): 4–6.1m
- Recommended beginner lip angle: 25° (consistent with the 15–30° range above)

This is an alternative to a sine-wave takeoff (see [[rollers]] for the sine model) — circular arc is simpler to reason about for a fixed lip angle, sine is smoother/more "flowy" for continuously-varying-radius features. Worth supporting both as kicker profile options.

## Design principles mentioned (not calculator inputs, but construction guidance)

- Clothoid (spiral, gradually-tightening-radius) transitions on takeoff lips rather than a fixed-radius circular arc — smoother rider load-up.
- Landing zone width should be generous relative to expected speed variance between riders.
- Tabletop (flat gap that can be rolled if under-shot) vs. true gap jump (empty space) — tabletop is the safer default for a design tool aimed at avoiding "case" (short) landings.

## Relevance to maketrail

- Jump obstacle params: `takeoff_angle`, `takeoff_height`, `takeoff_profile` (circular-arc radius vs. sine), `gap_length` or derive gap from landing slope, `landing_slope_angle`, optionally `table` (bool) for tabletop vs gap.
- Simulation check: given simulated approach speed + takeoff angle, compute projectile landing point and compare against the actual landing ramp position — flag "landing too short" (case) or "overshoot" (flat landing past the down-ramp). See [[simulation]].
- Reuse the same speed/angle inputs as [[rollers]] (they share the same rider+bike model).
