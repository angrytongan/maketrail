import { describe, expect, it } from "vitest";
import { buildBermGeometry } from "./berm";

describe("buildBermGeometry", () => {
  const params = { radius: 4, sweepAngle: 90, bankAngle: 35, width: 2 };

  it("centers the arc's midpoint at local origin (x=0, z=0)", () => {
    const geometry = buildBermGeometry(params);
    const position = geometry.getAttribute("position");
    // 24 arc segments -> midpoint is index 12
    const midInner = 12 * 2;
    const midOuter = midInner + 1;
    expect(position.getX(midInner)).toBeCloseTo(0, 6);
    expect(position.getX(midOuter)).toBeCloseTo(0, 6);
  });

  it("banks the outer edge above the inner edge by width * tan(bankAngle)", () => {
    const geometry = buildBermGeometry(params);
    const position = geometry.getAttribute("position");
    const expectedRise = params.width * Math.tan((params.bankAngle * Math.PI) / 180);

    for (let i = 0; i <= 24; i++) {
      const inner = i * 2;
      const outer = inner + 1;
      expect(position.getY(outer) - position.getY(inner)).toBeCloseTo(expectedRise, 6);
    }
  });

  it("places the arc endpoints at the expected swept position", () => {
    const geometry = buildBermGeometry(params);
    const position = geometry.getAttribute("position");
    const sweepRad = (params.sweepAngle * Math.PI) / 180;
    const tStart = -sweepRad / 2;
    const expectedX = params.radius * Math.sin(tStart);
    const expectedZ = params.radius - params.radius * Math.cos(tStart);

    // endpoint centerline sits midway between the inner (index 0) and outer
    // (index 1) edge vertices
    const startX = (position.getX(0) + position.getX(1)) / 2;
    const startZ = (position.getZ(0) + position.getZ(1)) / 2;
    expect(startX).toBeCloseTo(expectedX, 6);
    expect(startZ).toBeCloseTo(expectedZ, 6);
  });

  it("produces a valid triangle index with no NaNs", () => {
    const geometry = buildBermGeometry(params);
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
    const geometry = buildBermGeometry(params);
    expect(geometry.getAttribute("normal")).toBeDefined();
  });

  it("faces upward — the tread surface's normal should point roughly +Y, not into the ground", () => {
    const geometry = buildBermGeometry(params);
    const normal = geometry.getAttribute("normal");
    for (let i = 0; i < normal.count; i++) {
      expect(normal.getY(i)).toBeGreaterThan(0);
    }
  });
});
