import { describe, expect, it } from "vitest";
import { buildRollerGeometry } from "./roller";

describe("buildRollerGeometry", () => {
  const params = { length: 3, height: 0.3, width: 1.2, periods: 1 };

  it("is a full sine period: crest at length/4, trough at 3*length/4, back to 0 at mid/ends", () => {
    const geometry = buildRollerGeometry(params);
    const position = geometry.getAttribute("position");
    // 32 length segments: quarter=8, mid=16, three-quarter=24, end=32
    const quarterIndex = 8 * 2;
    const midIndex = 16 * 2;
    const threeQuarterIndex = 24 * 2;

    expect(position.getY(quarterIndex)).toBeCloseTo(params.height / 2, 6);
    expect(position.getY(midIndex)).toBeCloseTo(0, 6);
    expect(position.getY(threeQuarterIndex)).toBeCloseTo(-params.height / 2, 6);
    expect(position.getX(midIndex)).toBeCloseTo(0, 6);
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

  it("chains periods end-to-end, keeping each hump's own length (total footprint = length * periods)", () => {
    const chained = { ...params, periods: 2 };
    const geometry = buildRollerGeometry(chained);
    const position = geometry.getAttribute("position");

    // 32 segments per period * 2 periods = 64 segments, so the pattern from
    // a single period (quarter/mid/three-quarter/end) repeats at the same
    // segment offsets in the second period.
    const quarterIndex = 8 * 2;
    const secondPeriodQuarterIndex = (32 + 8) * 2;
    const totalLength = chained.length * chained.periods;

    expect(position.getY(quarterIndex)).toBeCloseTo(chained.height / 2, 6);
    expect(position.getY(secondPeriodQuarterIndex)).toBeCloseTo(chained.height / 2, 6);
    expect(position.getX(0)).toBeCloseTo(-totalLength / 2, 6);
    expect(position.getX(position.count - 2)).toBeCloseTo(totalLength / 2, 6);
  });
});
