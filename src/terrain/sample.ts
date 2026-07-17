import type { LocalPoint } from "./coords";

/**
 * Looks up terrain height at a ground-plane position (world X/Z, matching
 * the Y-up mapping in terrain/mesh.ts: LocalPoint.x -> world X, LocalPoint.y
 * -> world Z) via nearest-neighbor on the survey points.
 *
 * ponytail: nearest-neighbor, not barycentric interpolation on the actual
 * triangulated mesh — good enough at the current survey density; revisit if
 * placement accuracy on sparser/coarser terrain becomes a problem.
 */
export function sampleTerrainHeight(points: LocalPoint[], worldX: number, worldZ: number): number {
  let nearest = points[0];
  let nearestDistSq = Infinity;

  for (const point of points) {
    const distSq = (point.x - worldX) ** 2 + (point.y - worldZ) ** 2;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = point;
    }
  }

  return nearest.z;
}
