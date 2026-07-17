import { describe, expect, it } from "vitest";
import { isNearTrail } from "./proximity";

describe("isNearTrail", () => {
  const centerline = [
    { x: 0, z: 0 },
    { x: 5, z: 0 },
  ];

  it("is near a point exactly on the centerline", () => {
    expect(isNearTrail(0, 0, centerline, 2)).toBe(true);
  });

  it("is near a point within half the width of a centerline sample", () => {
    expect(isNearTrail(0, 0.9, centerline, 2)).toBe(true);
  });

  it("is not near a point beyond half the width of every centerline sample", () => {
    expect(isNearTrail(0, 1.1, centerline, 2)).toBe(false);
  });

  it("is near exactly at the half-width boundary", () => {
    expect(isNearTrail(0, 1, centerline, 2)).toBe(true);
  });

  it("is never near when there's no centerline", () => {
    expect(isNearTrail(0, 0, [], 2)).toBe(false);
  });
});
