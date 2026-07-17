import type { Waypoint } from "./waypoint";

export interface Point2D {
  x: number;
  z: number;
}

const SEGMENTS_PER_CURVE = 16;

function bezierPoint(p0: Point2D, c1: Point2D, c2: Point2D, p1: Point2D, t: number): Point2D {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * c1.x + c * c2.x + d * p1.x,
    z: a * p0.z + b * c1.z + c * c2.z + d * p1.z,
  };
}

/**
 * Samples a cubic-Bezier curve through every waypoint. Each waypoint has one
 * tangent handle (not two): the handle itself is the outgoing control point
 * for the segment to the next waypoint, and its mirror across the waypoint
 * (`2*p - handle`) is the incoming control point for the segment from the
 * previous one — the same "smooth point" model a vector-graphics pen tool
 * uses, so there's only one handle per waypoint to draw/drag.
 */
export function sampleSpline(waypoints: Waypoint[]): Point2D[] {
  if (waypoints.length === 0) return [];
  if (waypoints.length === 1) return [{ x: waypoints[0].x, z: waypoints[0].z }];

  const points: Point2D[] = [{ x: waypoints[0].x, z: waypoints[0].z }];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const p0 = waypoints[i];
    const p1 = waypoints[i + 1];
    const c1: Point2D = { x: p0.handleX, z: p0.handleZ };
    const c2: Point2D = { x: 2 * p1.x - p1.handleX, z: 2 * p1.z - p1.handleZ };

    for (let s = 1; s <= SEGMENTS_PER_CURVE; s++) {
      const t = s / SEGMENTS_PER_CURVE;
      points.push(bezierPoint({ x: p0.x, z: p0.z }, c1, c2, { x: p1.x, z: p1.z }, t));
    }
  }
  return points;
}
