/**
 * Three-stop hypsometric tint: green (low) -> yellow-green (mid) -> brown
 * (high), normalized against the terrain's current min/max height so the
 * ramp always uses full contrast regardless of the actual elevation range.
 */
const LOW: [number, number, number] = [0.176, 0.29, 0.176];
const MID: [number, number, number] = [0.604, 0.698, 0.325];
const HIGH: [number, number, number] = [0.541, 0.4, 0.259];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function heightToColor(height: number, min: number, max: number): [number, number, number] {
  const t = max > min ? (height - min) / (max - min) : 0.5;
  return t < 0.5 ? lerpColor(LOW, MID, t / 0.5) : lerpColor(MID, HIGH, (t - 0.5) / 0.5);
}
