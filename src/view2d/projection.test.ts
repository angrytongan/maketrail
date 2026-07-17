import { describe, expect, it } from "vitest";
import { screenToWorld } from "./projection";

describe("screenToWorld", () => {
  const bounds = { left: -12, right: 12, top: 12, bottom: -12 };
  const size = { width: 800, height: 800 };

  it("maps the canvas center to world origin", () => {
    const { x, z } = screenToWorld(size.width / 2, size.height / 2, size.width, size.height, bounds.left, bounds.right, bounds.top, bounds.bottom);
    expect(x).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(0, 6);
  });

  it("maps the left edge to world left bound", () => {
    const { x } = screenToWorld(0, size.height / 2, size.width, size.height, bounds.left, bounds.right, bounds.top, bounds.bottom);
    expect(x).toBeCloseTo(bounds.left, 6);
  });

  it("maps the right edge to world right bound", () => {
    const { x } = screenToWorld(size.width, size.height / 2, size.width, size.height, bounds.left, bounds.right, bounds.top, bounds.bottom);
    expect(x).toBeCloseTo(bounds.right, 6);
  });

  it("maps the top edge (py=0) and bottom edge (py=height) consistently with screen-up = world -Z", () => {
    const topResult = screenToWorld(size.width / 2, 0, size.width, size.height, bounds.left, bounds.right, bounds.top, bounds.bottom);
    const bottomResult = screenToWorld(size.width / 2, size.height, size.width, size.height, bounds.left, bounds.right, bounds.top, bounds.bottom);
    expect(topResult.z).toBeCloseTo(-bounds.top, 6);
    expect(bottomResult.z).toBeCloseTo(-bounds.bottom, 6);
  });
});
