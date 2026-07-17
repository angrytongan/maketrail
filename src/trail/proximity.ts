import type { Point2D } from "./spline";

/**
 * Nearest-neighbor check against sampled centerline points (same
 * simplification style as terrain/sample.ts's sampleTerrainHeight) rather
 * than exact point-to-polyline distance — good enough given how densely
 * the spline is sampled.
 */
export function isNearTrail(x: number, z: number, centerline: Point2D[], width: number): boolean {
  const halfWidthSq = (width / 2) ** 2;
  return centerline.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 <= halfWidthSq);
}
