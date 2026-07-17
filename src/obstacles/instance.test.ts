import { describe, expect, it } from "vitest";
import { createInstance, getFootprintRadius } from "./instance";
import type { RollerParams } from "./roller";
import type { BermParams } from "./berm";
import type { KickerParams } from "./kicker";

describe("createInstance", () => {
  it("creates a roller with default params at the given position", () => {
    const instance = createInstance("roller", 2, -3);
    expect(instance.type).toBe("roller");
    expect(instance.x).toBe(2);
    expect(instance.z).toBe(-3);
    expect(instance.rotation).toBe(0);
    expect(instance.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("gives each instance a unique id", () => {
    const a = createInstance("berm", 0, 0);
    const b = createInstance("berm", 0, 0);
    expect(a.id).not.toBe(b.id);
  });
});

describe("getFootprintRadius", () => {
  it("computes a roller's radius from length * periods and width", () => {
    const instance = createInstance("roller", 0, 0);
    const params = instance.params as RollerParams;
    params.length = 4;
    params.periods = 2;
    params.width = 1;
    expect(getFootprintRadius(instance)).toBeCloseTo((4 * 2) / 2, 6);
  });

  it("computes a berm's radius from its own radius and width", () => {
    const instance = createInstance("berm", 0, 0);
    const params = instance.params as BermParams;
    params.radius = 5;
    params.width = 2;
    expect(getFootprintRadius(instance)).toBeCloseTo(5, 6);
  });

  it("computes a kicker's radius from its base length", () => {
    const instance = createInstance("kicker", 0, 0);
    const params = instance.params as KickerParams;
    params.height = 0.5;
    params.lipAngle = 25;
    params.width = 1;
    const lipAngleRad = (25 * Math.PI) / 180;
    const radius = 0.5 / (1 - Math.cos(lipAngleRad));
    const baseLength = radius * Math.sin(lipAngleRad);
    expect(getFootprintRadius(instance)).toBeCloseTo(baseLength / 2, 6);
  });
});
