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
