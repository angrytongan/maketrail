import { describe, expect, it } from "vitest";
import { sampleSpline } from "./spline";
import { createWaypoint } from "./waypoint";
import type { Waypoint } from "./waypoint";

function withHandle(x: number, z: number, handleX: number, handleZ: number): Waypoint {
  return { id: "test", x, z, handleX, handleZ };
}

describe("sampleSpline", () => {
  it("returns an empty array for no waypoints", () => {
    expect(sampleSpline([])).toEqual([]);
  });

  it("returns a single point for one waypoint", () => {
    const wp = createWaypoint(1, 2);
    expect(sampleSpline([wp])).toEqual([{ x: 1, z: 2 }]);
  });

  it("starts and ends exactly at the waypoints", () => {
    const a = withHandle(0, 0, 1, 0);
    const b = withHandle(4, 0, 5, 0);
    const points = sampleSpline([a, b]);
    expect(points[0]).toEqual({ x: 0, z: 0 });
    const last = points[points.length - 1];
    expect(last.x).toBeCloseTo(4, 6);
    expect(last.z).toBeCloseTo(0, 6);
  });

  it("stays exactly on a straight line when all control points are collinear", () => {
    const a = withHandle(0, 0, 2, 0);
    const b = withHandle(6, 0, 4, 0);
    const points = sampleSpline([a, b]);
    for (const p of points) {
      expect(p.z).toBeCloseTo(0, 6);
    }
  });

  it("chains multiple segments in order", () => {
    const a = withHandle(0, 0, 1, 0);
    const b = withHandle(4, 0, 5, 0);
    const c = withHandle(8, 0, 9, 0);
    const points = sampleSpline([a, b, c]);
    // Should pass through b's position partway through the sampled points.
    const midIndex = Math.floor(points.length / 2);
    expect(points[midIndex].x).toBeCloseTo(4, 1);
  });
});
