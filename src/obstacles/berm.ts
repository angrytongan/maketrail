import { BufferGeometry, Float32BufferAttribute } from "three";

export interface BermParams {
  radius: number;
  sweepAngle: number;
  bankAngle: number;
  width: number;
}

const ARC_SEGMENTS = 24;

/**
 * Builds a berm obstacle: a banked ramp surface following a circular arc.
 * radius/bankAngle are kept explicit (not derived from each other) because
 * the trail simulation (docs/decisions.md) needs to compare a berm's actual
 * banking angle against the physics-required lean angle for a given speed
 * and radius (research/berms.md's arctan(v^2/gr)).
 *
 * Cross-section is a flat tilted plane (inner edge low, outer edge high),
 * not Velosolutions' full concave profile — consistent with the
 * schematic-rendering decision. Only turns toward +Z (the arc's center of
 * curvature is fixed there); mirroring to the other direction needs a
 * future direction flag, not built yet.
 *
 * Geometry is centered on the local origin: the arc's midpoint sits at
 * (0, 0, 0) with its tangent along local +X, so an obstacle's
 * position/rotation transform pivots around its actual center, per the
 * convention in src/obstacles/roller.ts.
 */
export function buildBermGeometry(params: BermParams): BufferGeometry {
  const { radius, sweepAngle, bankAngle, width } = params;
  const sweepRad = (sweepAngle * Math.PI) / 180;
  const bankRad = (bankAngle * Math.PI) / 180;
  const rise = width * Math.tan(bankRad);
  const positions: number[] = [];

  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const t = -sweepRad / 2 + (i / ARC_SEGMENTS) * sweepRad;
    const centerX = radius * Math.sin(t);
    const centerZ = radius - radius * Math.cos(t);
    const outwardX = Math.sin(t);
    const outwardZ = -Math.cos(t);

    positions.push(centerX - outwardX * (width / 2), -rise / 2, centerZ - outwardZ * (width / 2));
    positions.push(centerX + outwardX * (width / 2), rise / 2, centerZ + outwardZ * (width / 2));
  }

  const indices: number[] = [];
  for (let i = 0; i < ARC_SEGMENTS; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
