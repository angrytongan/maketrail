import { describe, expect, it } from "vitest";
import { createWaypoint } from "./waypoint";

describe("createWaypoint", () => {
  it("defaults the handle to +X when there's no previous waypoint", () => {
    const wp = createWaypoint(2, 3);
    expect(wp.x).toBe(2);
    expect(wp.z).toBe(3);
    expect(wp.handleX).toBeCloseTo(3, 6);
    expect(wp.handleZ).toBeCloseTo(3, 6);
  });

  it("defaults the handle to continue the direction from the previous waypoint", () => {
    const prev = createWaypoint(0, 0);
    const wp = createWaypoint(3, 4, prev); // direction (3,4)/5 = (0.6, 0.8)
    expect(wp.handleX).toBeCloseTo(3.6, 6);
    expect(wp.handleZ).toBeCloseTo(4.8, 6);
  });

  it("falls back to +X when the previous waypoint is at the same position", () => {
    const prev = createWaypoint(5, 5);
    const wp = createWaypoint(5, 5, prev);
    expect(wp.handleX).toBeCloseTo(6, 6);
    expect(wp.handleZ).toBeCloseTo(5, 6);
  });

  it("gives each waypoint a unique id", () => {
    const a = createWaypoint(0, 0);
    const b = createWaypoint(0, 0);
    expect(a.id).not.toBe(b.id);
  });
});
