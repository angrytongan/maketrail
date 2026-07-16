# Berms

Sources:
- https://mtbtrailbuilding.com/calculators/berm-turn
- https://velosolutions.com/velosolutions-pump-track-standards/

## Core physics

Required lean angle for a given speed and turn radius:

```
lean_angle = arctan(v² / (g * r))
```

- `v` = rider speed
- `g` = 9.81 m/s²
- `r` = turn radius

This is the angle a rider leans at; the berm's banking angle should be built to roughly match it (banking does the leaning for the rider, letting them stay more upright than an unbanked turn of the same radius/speed would require).

## Difficulty bands (mtbtrailbuilding.com)

| Level | Lean angle | Banking angle | Radius |
|-------|-----------|----------------|--------|
| Beginner | <20° | 25–35° | 3.7–4.6m+ |
| Intermediate | 20–30° | 30–45° | 2.4–3.7m |
| Advanced | 30–45° | 40–55° | 1.8–3m |
| Expert | >45° | 50–60° | — |

Input speed range assumed: 13–40 km/h (typical trail riding speed).

## Velosolutions standard (pump track, more aggressive)

- Turn steepness: minimum 55° banking; 50° tolerable, not below.
- Turn radius: minimum 3m, standard 4m — must correlate with expected rider speed (faster ⇒ bigger radius, consistent with the lean-angle formula above).
- Shape: concave/round profile, wide flat bottom (rideable at low speed / by beginners), steepening toward the top.
- Turn height must stay consistent entrance-to-exit: ≥1.30m for direction changes >90°, can be lower for <90° changes.

## Berm dimensions (general)

- Height ≈ 1/3 to 1/2 of berm width.
- Typical height: 0.3–0.9m.

## Relevance to maketrail

- Berm obstacle params: `radius`, `bank_angle`, `width`, `entry/exit height`. Height can default to `width * 0.4` (midpoint of the 1/3–1/2 rule) unless overridden.
- The `lean_angle = arctan(v²/gr)` formula is the key **simulation check**: given a simulated rider speed through the berm and its actual radius, compute required lean angle and compare to the berm's built banking angle — flag if the berm is under-banked for the speed it's likely to be taken at (or over-banked, which is just uncomfortable rather than dangerous).
- See [[simulation]].
