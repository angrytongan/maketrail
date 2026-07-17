import { describe, expect, it } from "vitest";
import { buildKickerGeometry } from "./kicker";

describe("buildKickerGeometry", () => {
  const params = { height: 0.5, lipAngle: 25, width: 1.2 };

  function expectedBaseLength(): number {
    const lipAngleRad = (params.lipAngle * Math.PI) / 180;
    const radius = params.height / (1 - Math.cos(lipAngleRad));
    return radius * Math.sin(lipAngleRad);
  }

  it("starts flat (y=0) at the centered base (-baseLength/2)", () => {
    const geometry = buildKickerGeometry(params);
    const position = geometry.getAttribute("position");
    const baseLength = expectedBaseLength();
    expect(position.getX(0)).toBeCloseTo(-baseLength / 2, 6);
    expect(position.getY(0)).toBeCloseTo(0, 6);
  });

  it("reaches the lip at (baseLength/2, height)", () => {
    const geometry = buildKickerGeometry(params);
    const position = geometry.getAttribute("position");
    const baseLength = expectedBaseLength();
    const lastPairStart = position.count - 2;
    expect(position.getX(lastPairStart)).toBeCloseTo(baseLength / 2, 6);
    expect(position.getY(lastPairStart)).toBeCloseTo(params.height, 6);
  });

  it("spans the full width at each step, centered on z=0", () => {
    const geometry = buildKickerGeometry(params);
    const position = geometry.getAttribute("position");
    expect(position.getZ(0)).toBeCloseTo(-params.width / 2, 6);
    expect(position.getZ(1)).toBeCloseTo(params.width / 2, 6);
  });

  it("produces a valid triangle index with no NaNs", () => {
    const geometry = buildKickerGeometry(params);
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

  it("faces upward — normals should point roughly +Y, not into the ramp", () => {
    const geometry = buildKickerGeometry(params);
    const normal = geometry.getAttribute("normal");
    for (let i = 0; i < normal.count; i++) {
      expect(normal.getY(i)).toBeGreaterThan(0);
    }
  });
});
