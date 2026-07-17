import { describe, expect, it } from "vitest";
import { buildTerrainGeometry } from "./mesh";
import type { LocalPoint } from "./coords";

describe("buildTerrainGeometry", () => {
  // a simple 3x3 grid of points, treated as scattered/irregular input
  const points: LocalPoint[] = [];
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      points.push({ x, y, z: (x + y) * 0.1 });
    }
  }

  it("keeps one vertex per input point", () => {
    const geometry = buildTerrainGeometry(points);
    expect(geometry.getAttribute("position").count).toBe(points.length);
  });

  it("produces a triangle index with no leftover vertices", () => {
    const geometry = buildTerrainGeometry(points);
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    expect(index!.count).toBeGreaterThan(0);
  });

  it("places height (z) into the Y slot of every vertex with no NaNs", () => {
    const geometry = buildTerrainGeometry(points);
    const position = geometry.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      expect(position.getY(i)).toBeCloseTo(points[i].z, 6);
      expect(Number.isNaN(position.getX(i))).toBe(false);
      expect(Number.isNaN(position.getZ(i))).toBe(false);
    }
  });

  it("computes vertex normals", () => {
    const geometry = buildTerrainGeometry(points);
    expect(geometry.getAttribute("normal")).toBeDefined();
  });
});
