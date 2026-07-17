import { describe, expect, it } from "vitest";
import { getPointsInBrush } from "./brush";

describe("getPointsInBrush", () => {
  const points = [
    { x: 0, y: 0, z: 0 }, // center
    { x: 2, y: 0, z: 0 }, // half radius
    { x: 4, y: 0, z: 0 }, // at radius
    { x: 5, y: 0, z: 0 }, // outside radius
  ];
  const radius = 4;

  it("gives the center point full weight (1)", () => {
    const effects = getPointsInBrush(points, 0, 0, radius);
    expect(effects.find((e) => e.index === 0)?.weight).toBeCloseTo(1, 6);
  });

  it("gives the point exactly at the radius ~zero weight", () => {
    const effects = getPointsInBrush(points, 0, 0, radius);
    expect(effects.find((e) => e.index === 2)?.weight).toBeCloseTo(0, 6);
  });

  it("gives a half-radius point 0.5 weight (cosine falloff midpoint)", () => {
    const effects = getPointsInBrush(points, 0, 0, radius);
    expect(effects.find((e) => e.index === 1)?.weight).toBeCloseTo(0.5, 6);
  });

  it("excludes points outside the radius", () => {
    const effects = getPointsInBrush(points, 0, 0, radius);
    expect(effects.find((e) => e.index === 3)).toBeUndefined();
  });

  it("returns nothing for a zero or negative radius", () => {
    expect(getPointsInBrush(points, 0, 0, 0)).toEqual([]);
    expect(getPointsInBrush(points, 0, 0, -1)).toEqual([]);
  });
});
