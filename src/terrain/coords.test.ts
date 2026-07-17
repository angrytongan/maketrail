import { describe, expect, it } from "vitest";
import { toLocal } from "./coords";

describe("toLocal", () => {
  const origin = { lat: 0, lon: 0, height: 100 };

  it("returns the zero vector for the origin itself", () => {
    expect(toLocal(origin, origin)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("converts a 1-degree latitude offset to ~111.32km north", () => {
    const point = { lat: 1, lon: 0, height: 100 };
    const { x, y, z } = toLocal(point, origin);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(111319.49, 0);
    expect(z).toBeCloseTo(0, 6);
  });

  it("shrinks a longitude offset by cos(latitude) away from the equator", () => {
    const highLatOrigin = { lat: 60, lon: 0, height: 0 };
    const point = { lat: 60, lon: 1, height: 0 };
    const { x } = toLocal(point, highLatOrigin);
    // at 60 degrees, cos(60) = 0.5, so the same 1-degree offset is half the
    // ground distance it would be at the equator
    expect(x).toBeCloseTo(111319.49 * 0.5, 0);
  });

  it("passes height through as a simple offset from the origin's height", () => {
    const point = { lat: 0, lon: 0, height: 105.5 };
    expect(toLocal(point, origin).z).toBeCloseTo(5.5, 6);
  });
});
