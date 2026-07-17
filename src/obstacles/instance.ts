import type { RollerParams } from "./roller";
import type { BermParams } from "./berm";
import { kickerBaseLength, type KickerParams } from "./kicker";

export type ObstacleType = "roller" | "berm" | "kicker";

export type ObstacleParams = RollerParams | BermParams | KickerParams;

export interface ObstacleInstance {
  id: string;
  type: ObstacleType;
  params: ObstacleParams;
  x: number;
  z: number;
  rotation: number;
}

const DEFAULT_PARAMS: Record<ObstacleType, ObstacleParams> = {
  roller: { length: 3, height: 0.3, width: 1.2, periods: 1 },
  berm: { radius: 4, sweepAngle: 90, bankAngle: 35, width: 2 },
  kicker: { height: 0.5, lipAngle: 25, width: 1.2 },
};

export function createInstance(type: ObstacleType, x: number, z: number): ObstacleInstance {
  return {
    id: crypto.randomUUID(),
    type,
    params: { ...DEFAULT_PARAMS[type] },
    x,
    z,
    rotation: 0,
  };
}

/** Rough hit-test/handle-placement radius — doesn't need to be pixel-perfect. */
export function getFootprintRadius(instance: ObstacleInstance): number {
  switch (instance.type) {
    case "roller": {
      const p = instance.params as RollerParams;
      return Math.max(p.length * p.periods, p.width) / 2;
    }
    case "berm": {
      const p = instance.params as BermParams;
      return Math.max(p.radius, p.width);
    }
    case "kicker": {
      const p = instance.params as KickerParams;
      return Math.max(kickerBaseLength(p), p.width) / 2;
    }
  }
}

/**
 * Lowest local-Y point of an obstacle's geometry. Roller/berm geometry is
 * built symmetric around y=0 (see their own doc comments), so placing a mesh
 * at y=0 would sink half of it below the terrain; this offset lets callers
 * anchor the obstacle's actual lowest point at the terrain surface instead.
 * Kicker's base is already anchored at y=0, so its offset is 0.
 */
export function getMinY(instance: ObstacleInstance): number {
  switch (instance.type) {
    case "roller":
      return -(instance.params as RollerParams).height / 2;
    case "berm": {
      const p = instance.params as BermParams;
      return -(p.width * Math.tan((p.bankAngle * Math.PI) / 180)) / 2;
    }
    case "kicker":
      return 0;
  }
}
