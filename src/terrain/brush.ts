import type { LocalPoint } from "./coords";

export interface BrushEffect {
  index: number;
  weight: number;
}

/**
 * Finds every terrain point within `radius` of a ground-plane position,
 * with a cosine falloff weight (1 at the center, 0 at the edge) so a brush
 * stroke tapers smoothly instead of leaving a flat-topped plateau with a
 * hard edge.
 */
export function getPointsInBrush(points: LocalPoint[], worldX: number, worldZ: number, radius: number): BrushEffect[] {
  if (radius <= 0) return [];

  const effects: BrushEffect[] = [];
  points.forEach((point, index) => {
    const dist = Math.hypot(point.x - worldX, point.y - worldZ);
    if (dist <= radius) {
      const weight = (Math.cos((Math.PI * dist) / radius) + 1) / 2;
      effects.push({ index, weight });
    }
  });
  return effects;
}
