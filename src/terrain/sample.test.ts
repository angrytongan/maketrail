import { describe, expect, it } from "vitest";
import { sampleTerrainHeight } from "./sample";

describe("sampleTerrainHeight", () => {
  const points = [
    { x: 0, y: 0, z: 1 },
    { x: 10, y: 0, z: 2 },
    { x: 0, y: 10, z: 3 },
    { x: 10, y: 10, z: 4 },
  ];

  it("returns the exact point's height when queried at its own position", () => {
    expect(sampleTerrainHeight(points, 10, 0)).toBe(2);
  });

  it("returns the nearest point's height for an off-grid query", () => {
    expect(sampleTerrainHeight(points, 9, 1)).toBe(2);
    expect(sampleTerrainHeight(points, 1, 9)).toBe(3);
  });

  it("returns the single point's height when only one point exists", () => {
    expect(sampleTerrainHeight([{ x: 5, y: 5, z: 42 }], 0, 0)).toBe(42);
  });
});
