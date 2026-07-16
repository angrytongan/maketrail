import { describe, expect, it } from "vitest";
import { buildRollerGeometry } from "./roller";

describe("buildRollerGeometry", () => {
  const params = { length: 3, height: 0.3, width: 1.2 };

  it("peaks at height/2 at the centered mid-length (x=0)", () => {
    const geometry = buildRollerGeometry(params);
    const position = geometry.getAttribute("position");
    // mid-length is the middle pair of vertices (32 segments -> index 16)
    const midIndex = 16 * 2;
    expect(position.getX(midIndex)).toBeCloseTo(0, 6);
    expect(position.getY(midIndex)).toBeCloseTo(params.height / 2, 6);
  });

  it("returns to ~0 height at both ends, centered at -length/2 and length/2", () => {
    const geometry = buildRollerGeometry(params);
    const position = geometry.getAttribute("position");
    const lastPairStart = position.count - 2;
    expect(position.getX(0)).toBeCloseTo(-params.length / 2, 6);
    expect(position.getY(0)).toBeCloseTo(0, 6);
    expect(position.getX(lastPairStart)).toBeCloseTo(params.length / 2, 6);
    expect(position.getY(lastPairStart)).toBeCloseTo(0, 6);
  });

  it("spans the full width at each length step, centered on z=0", () => {
    const geometry = buildRollerGeometry(params);
    const position = geometry.getAttribute("position");
    expect(position.getZ(0)).toBeCloseTo(-params.width / 2, 6);
    expect(position.getZ(1)).toBeCloseTo(params.width / 2, 6);
  });

  it("produces a valid triangle index with no NaNs", () => {
    const geometry = buildRollerGeometry(params);
    const position = geometry.getAttribute("position");
    const index = geometry.getIndex();
    expect(index).not.toBeNull();
    expect(index!.count % 3).toBe(0);
    for (let i = 0; i < position.count; i++) {
      expect(Number.isNaN(position.getX(i))).toBe(false);
      expect(Number.isNaN(position.getY(i))).toBe(false);
      expect(Number.isNaN(position.getZ(i))).toBe(false);
    }
  });

  it("computes vertex normals", () => {
    const geometry = buildRollerGeometry(params);
    expect(geometry.getAttribute("normal")).toBeDefined();
  });
});
