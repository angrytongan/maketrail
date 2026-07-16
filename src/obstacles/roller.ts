import { BufferGeometry, Float32BufferAttribute } from "three";

export interface RollerParams {
  length: number;
  height: number;
  width: number;
}

const LENGTH_SEGMENTS = 32;

/**
 * Builds a roller obstacle: one full sine-wave period along `length`, flat
 * across `width`, per research/rollers.md (crest at length/4, trough at
 * 3*length/4) — this is what lets successive rollers tile into a continuous
 * pump-track sequence, rather than a single one-sided hump.
 *
 * Geometry is centered on the local origin (x and z both span
 * -length/2..length/2 and -width/2..width/2) so that an obstacle's
 * position/rotation transform pivots around its own center, not a corner —
 * the convention all obstacle geometry should follow.
 */
export function buildRollerGeometry(params: RollerParams): BufferGeometry {
  const { length, height, width } = params;
  const positions: number[] = [];

  for (let i = 0; i <= LENGTH_SEGMENTS; i++) {
    const t = (i / LENGTH_SEGMENTS) * length;
    const x = t - length / 2;
    const y = (height / 2) * Math.sin((t / length) * 2 * Math.PI);
    for (const z of [-width / 2, width / 2]) {
      positions.push(x, y, z);
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < LENGTH_SEGMENTS; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, b, c, b, d, c);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
