import { Delaunay } from "d3-delaunay";
import { BufferGeometry, Float32BufferAttribute } from "three";
import type { LocalPoint } from "./coords";

/**
 * Triangulates a set of local-meter points (ground-plane x/y, height z) into
 * a Three.js geometry, keeping their native irregular spacing rather than
 * resampling onto a regular grid. Three.js uses a Y-up convention, so height
 * (z) is placed in the Y slot of each vertex.
 */
export function buildTerrainGeometry(points: LocalPoint[]): BufferGeometry {
  const delaunay = Delaunay.from(
    points,
    (p) => p.x,
    (p) => p.y,
  );

  const positions = new Float32Array(points.length * 3);
  points.forEach((p, i) => {
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.z;
    positions[i * 3 + 2] = p.y;
  });

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(Array.from(delaunay.triangles));
  geometry.computeVertexNormals();

  return geometry;
}
