export interface Waypoint {
  id: string;
  x: number;
  z: number;
  /** Absolute position of this waypoint's single tangent handle (not an offset). */
  handleX: number;
  handleZ: number;
}

const DEFAULT_HANDLE_LENGTH = 1;

/**
 * Creates a waypoint with its tangent handle defaulted to continue the
 * direction of travel from `prev` (a "smooth point" heuristic, like a vector
 * editor's default when adding a node) — fully overridable by dragging the
 * handle afterwards. With no previous waypoint (or a coincident one, where
 * direction is undefined), defaults to +X.
 */
export function createWaypoint(x: number, z: number, prev?: Waypoint): Waypoint {
  let dirX = 1;
  let dirZ = 0;
  if (prev) {
    const dx = x - prev.x;
    const dz = z - prev.z;
    const len = Math.hypot(dx, dz);
    if (len > 0) {
      dirX = dx / len;
      dirZ = dz / len;
    }
  }

  return {
    id: crypto.randomUUID(),
    x,
    z,
    handleX: x + dirX * DEFAULT_HANDLE_LENGTH,
    handleZ: z + dirZ * DEFAULT_HANDLE_LENGTH,
  };
}
