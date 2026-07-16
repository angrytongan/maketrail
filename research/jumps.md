# Jumps (kickers / landers)

Source: https://mtbtrailbuilding.com/calculators/jump-design

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

## Design principles mentioned (not calculator inputs, but construction guidance)

- Clothoid (spiral, gradually-tightening-radius) transitions on takeoff lips rather than a fixed-radius circular arc — smoother rider load-up.
- Landing zone width should be generous relative to expected speed variance between riders.
- Tabletop (flat gap that can be rolled if under-shot) vs. true gap jump (empty space) — tabletop is the safer default for a design tool aimed at avoiding "case" (short) landings.

## Relevance to maketrail

- Jump obstacle params: `takeoff_angle`, `takeoff_height`, `gap_length` or derive gap from landing slope, `landing_slope_angle`, optionally `table` (bool) for tabletop vs gap.
- Simulation check: given simulated approach speed + takeoff angle, compute projectile landing point and compare against the actual landing ramp position — flag "landing too short" (case) or "overshoot" (flat landing past the down-ramp). See [[simulation]].
- Reuse the same speed/angle inputs as [[rollers]] (they share the same rider+bike model).
