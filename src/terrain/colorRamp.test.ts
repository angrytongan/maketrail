import { describe, expect, it } from "vitest";
import { heightToColor } from "./colorRamp";

describe("heightToColor", () => {
  it("returns the low-stop color at the minimum height", () => {
    expect(heightToColor(0, 0, 10)).toEqual([0.176, 0.29, 0.176]);
  });

  it("returns the mid-stop color at the midpoint", () => {
    const [r, g, b] = heightToColor(5, 0, 10);
    expect(r).toBeCloseTo(0.604, 6);
    expect(g).toBeCloseTo(0.698, 6);
    expect(b).toBeCloseTo(0.325, 6);
  });

  it("returns the high-stop color at the maximum height", () => {
    const [r, g, b] = heightToColor(10, 0, 10);
    expect(r).toBeCloseTo(0.541, 6);
    expect(g).toBeCloseTo(0.4, 6);
    expect(b).toBeCloseTo(0.259, 6);
  });

  it("falls back to the midpoint color when min equals max (flat terrain)", () => {
    const [r, g, b] = heightToColor(3, 3, 3);
    expect(r).toBeCloseTo(0.604, 6);
    expect(g).toBeCloseTo(0.698, 6);
    expect(b).toBeCloseTo(0.325, 6);
  });
});
