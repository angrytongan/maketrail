import { BufferGeometry, Float32BufferAttribute } from "three";

export interface RollerParams {
  length: number;
  height: number;
  width: number;
  periods: number;
}

const SEGMENTS_PER_PERIOD = 32;

/**
 * Builds a roller obstacle: `periods` full sine-wave periods chained
 * end-to-end, each spanning `length` (crest at length/4, trough at
 * 3*length/4 within its own period), flat across `width` — per
 * research/rollers.md. `length` is the per-period length, so chaining more
 * periods grows the obstacle's total footprint (`length * periods`) rather
 * than compressing each hump.
 *
 * Geometry is centered on the local origin (x spans
 * -totalLength/2..totalLength/2, z spans -width/2..width/2) so that an
 * obstacle's position/rotation transform pivots around its own center, not a
 * corner — the convention all obstacle geometry should follow.
 */
export function buildRollerGeometry(params: RollerParams): BufferGeometry {
  const { length, height, width, periods } = params;
  const totalLength = length * periods;
  const segments = SEGMENTS_PER_PERIOD * periods;
  const positions: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * totalLength;
    const x = t - totalLength / 2;
    const y = (height / 2) * Math.sin((t / length) * 2 * Math.PI);
    for (const z of [-width / 2, width / 2]) {
      positions.push(x, y, z);
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < segments; i++) {
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
