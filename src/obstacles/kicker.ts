import { BufferGeometry, Float32BufferAttribute } from "three";

export interface KickerParams {
  height: number;
  lipAngle: number;
  width: number;
}

const ARC_SEGMENTS = 24;

/**
 * Builds a kicker (takeoff ramp) obstacle: a circular arc, tangent to
 * horizontal at its base, rising to `lipAngle` at the lip — per
 * research/jumps.md's cutlaps.com model. Radius is derived from height and
 * lipAngle (`R = height / (1 - cos(lipAngle))`) rather than exposed as its
 * own param, since height + lip angle are what a builder actually specifies.
 *
 * Flat across `width`, same construction as src/obstacles/roller.ts (and
 * the same triangle winding — this shape's coordinate structure matches the
 * roller's, so it doesn't need the winding flip src/obstacles/berm.ts did).
 *
 * Centering deviates from the roller/berm convention: X is centered
 * (-baseLength/2..baseLength/2) so rotation still pivots around the ramp's
 * midpoint, but Y stays anchored at 0 for the base rather than symmetric —
 * a kicker is inherently asymmetric (flat base, rising to the lip), and 0
 * is the meaningful "ground contact" reference for placement, the same
 * role it plays for the roller/berm.
 *
 * One-way/directional per docs/decisions.md — the entry/exit arrow
 * indicator noted there isn't built yet.
 */
/** Horizontal footprint of the ramp, per the same radius/baseLength derivation buildKickerGeometry uses. */
export function kickerBaseLength(params: Pick<KickerParams, "height" | "lipAngle">): number {
  const lipAngleRad = (params.lipAngle * Math.PI) / 180;
  const radius = params.height / (1 - Math.cos(lipAngleRad));
  return radius * Math.sin(lipAngleRad);
}

export function buildKickerGeometry(params: KickerParams): BufferGeometry {
  const { height, lipAngle, width } = params;
  const lipAngleRad = (lipAngle * Math.PI) / 180;
  const radius = height / (1 - Math.cos(lipAngleRad));
  const baseLength = radius * Math.sin(lipAngleRad);
  const positions: number[] = [];

  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const t = (i / ARC_SEGMENTS) * lipAngleRad;
    const x = radius * Math.sin(t) - baseLength / 2;
    const y = radius - radius * Math.cos(t);
    for (const z of [-width / 2, width / 2]) {
      positions.push(x, y, z);
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < ARC_SEGMENTS; i++) {
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
