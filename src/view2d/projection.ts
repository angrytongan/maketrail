/**
 * Converts a 2D-view canvas pixel position to world ground-plane (x, z),
 * for the top-down orthographic camera in main.ts (position (0, h, 0),
 * up (0, 0, -1), looking at the origin). Derived from that camera's basis:
 * screen-right maps to world +X, screen-up maps to world -Z.
 */
export function screenToWorld(
  px: number,
  py: number,
  canvasWidth: number,
  canvasHeight: number,
  left: number,
  right: number,
  top: number,
  bottom: number,
): { x: number; z: number } {
  const ndcX = (px / canvasWidth) * 2 - 1;
  const ndcY = 1 - (py / canvasHeight) * 2;

  const x = left + ((ndcX + 1) / 2) * (right - left);
  const upComponent = bottom + ((ndcY + 1) / 2) * (top - bottom);

  return { x, z: -upComponent };
}
