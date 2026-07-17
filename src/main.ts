import {
  AmbientLight,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  RingGeometry,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { toLocal, type GeoPoint } from "./terrain/coords";
import { buildTerrainGeometry } from "./terrain/mesh";
import { heightToColor } from "./terrain/colorRamp";
import { sampleTerrainHeight } from "./terrain/sample";
import { getPointsInBrush } from "./terrain/brush";
import { buildRollerGeometry, type RollerParams } from "./obstacles/roller";
import { buildBermGeometry, type BermParams } from "./obstacles/berm";
import { buildKickerGeometry, type KickerParams } from "./obstacles/kicker";
import { createInstance, getFootprintRadius, type ObstacleInstance, type ObstacleType } from "./obstacles/instance";
import { screenToWorld } from "./view2d/projection";

// Mock survey data: a scattered, irregularly-spaced set of points forming a
// gentle bump, standing in for a real GPS/lat-lon-height import.
function mockSurveyPoints(): GeoPoint[] {
  const origin = { lat: 45, lon: -110, height: 0 };
  const points: GeoPoint[] = [];
  const metersPerDegreeLat = 1 / 111320;

  for (let gy = -10; gy <= 10; gy++) {
    for (let gx = -10; gx <= 10; gx++) {
      // jitter the grid so the input is irregular, like a real survey
      const jitterX = gx + (Math.random() - 0.5) * 0.6;
      const jitterY = gy + (Math.random() - 0.5) * 0.6;
      const distFromCenter = Math.sqrt(jitterX ** 2 + jitterY ** 2);
      const height = Math.max(0, 3 - distFromCenter * 0.3);

      points.push({
        lat: origin.lat + jitterY * metersPerDegreeLat,
        lon: origin.lon + jitterX * metersPerDegreeLat * (1 / Math.cos((origin.lat * Math.PI) / 180)),
        height,
      });
    }
  }
  return points;
}

const origin: GeoPoint = { lat: 45, lon: -110, height: 0 };
const localPoints = mockSurveyPoints().map((p) => toLocal(p, origin));

const scene = new Scene();
scene.background = null;

const terrainGeometry = buildTerrainGeometry(localPoints);
// Height-based color ramp instead of a flat color, so both views read
// elevation the same way — flat terrain is hard to judge from directly
// overhead, where lighting/shading gives almost no depth cue.
terrainGeometry.setAttribute("color", new Float32BufferAttribute(new Float32Array(localPoints.length * 3), 3));
const terrainMaterial = new MeshLambertMaterial({ vertexColors: true });
const terrain = new Mesh(terrainGeometry, terrainMaterial);
scene.add(terrain);

function updateTerrainColors(): void {
  const colorAttr = terrainGeometry.getAttribute("color");
  let min = Infinity;
  let max = -Infinity;
  for (const p of localPoints) {
    if (p.z < min) min = p.z;
    if (p.z > max) max = p.z;
  }
  localPoints.forEach((p, i) => colorAttr.setXYZ(i, ...heightToColor(p.z, min, max)));
  colorAttr.needsUpdate = true;
}
updateTerrainColors();

scene.add(new GridHelper(20, 20));
scene.add(new AmbientLight(0xffffff, 0.3));
// Low, raking angle (not overhead) so small height changes cast visible
// shading/shadows across the terrain instead of washing out flat.
const sun = new DirectionalLight(0xffffff, 1.6);
sun.position.set(-14, 7, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const shadowExtent = 14;
sun.shadow.camera.left = -shadowExtent;
sun.shadow.camera.right = shadowExtent;
sun.shadow.camera.top = shadowExtent;
sun.shadow.camera.bottom = -shadowExtent;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 50;
scene.add(sun);

terrain.receiveShadow = true;
terrain.castShadow = true;

// --- Terrain vertex markers + brush --------------------------------------
// Editing is brush-based rather than one-vertex-at-a-time (dragging every
// point individually would be tedious): every terrain point within the
// brush radius of the cursor is affected together, tapering off toward the
// brush edge (see terrain/brush.ts). Markers are a single Points object
// (not one mesh per point) with per-vertex colors so points currently under
// the brush can be highlighted without any separate hit-test geometry.

const MARKER_Y_OFFSET = 0.05;
const MARKER_BASE_COLOR = [0.6, 0.63, 0.68];
const MARKER_HIGHLIGHT_COLOR = [1, 0.878, 0.4]; // 0xffe066

const markerPositions = new Float32Array(localPoints.length * 3);
const markerColors = new Float32Array(localPoints.length * 3);
localPoints.forEach((p, i) => {
  markerPositions[i * 3] = p.x;
  markerPositions[i * 3 + 1] = p.z + MARKER_Y_OFFSET;
  markerPositions[i * 3 + 2] = p.y;
  markerColors.set(MARKER_BASE_COLOR, i * 3);
});

const markerGeometry = new BufferGeometry();
markerGeometry.setAttribute("position", new Float32BufferAttribute(markerPositions, 3));
markerGeometry.setAttribute("color", new Float32BufferAttribute(markerColors, 3));
const vertexMarkers = new Points(markerGeometry, new PointsMaterial({ size: 6, sizeAttenuation: false, vertexColors: true }));
vertexMarkers.visible = false;
scene.add(vertexMarkers);

const brushRing = new Mesh(new RingGeometry(0.92, 1, 32), new MeshBasicMaterial({ color: 0xffe066, side: DoubleSide }));
brushRing.rotation.x = -Math.PI / 2;
brushRing.visible = false;
scene.add(brushRing);

let brushRadius = 2;

function resetBrushHighlight(): void {
  const colorAttr = markerGeometry.getAttribute("color");
  for (let i = 0; i < localPoints.length; i++) {
    colorAttr.setXYZ(i, ...(MARKER_BASE_COLOR as [number, number, number]));
  }
  colorAttr.needsUpdate = true;
  brushRing.visible = false;
}

function updateBrushHighlight(worldX: number, worldZ: number): void {
  const effects = getPointsInBrush(localPoints, worldX, worldZ, brushRadius);
  const highlighted = new Set(effects.map((e) => e.index));

  const colorAttr = markerGeometry.getAttribute("color");
  for (let i = 0; i < localPoints.length; i++) {
    const color = highlighted.has(i) ? MARKER_HIGHLIGHT_COLOR : MARKER_BASE_COLOR;
    colorAttr.setXYZ(i, ...(color as [number, number, number]));
  }
  colorAttr.needsUpdate = true;

  brushRing.visible = true;
  brushRing.position.set(worldX, sampleTerrainHeight(localPoints, worldX, worldZ) + MARKER_Y_OFFSET, worldZ);
  brushRing.scale.setScalar(brushRadius);
}

/** Pushes localPoints' current heights into the terrain mesh + marker geometries. */
function writeHeightsToGeometry(): void {
  const terrainPosition = terrain.geometry.getAttribute("position");
  const markerPosition = markerGeometry.getAttribute("position");

  for (let i = 0; i < localPoints.length; i++) {
    terrainPosition.setY(i, localPoints[i].z);
    markerPosition.setY(i, localPoints[i].z + MARKER_Y_OFFSET);
  }

  terrainPosition.needsUpdate = true;
  markerPosition.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
  updateTerrainColors();
}

function applyBrushStroke(worldX: number, worldZ: number, deltaHeight: number): void {
  const effects = getPointsInBrush(localPoints, worldX, worldZ, brushRadius);
  for (const { index, weight } of effects) {
    localPoints[index].z += deltaHeight * weight;
  }
  writeHeightsToGeometry();
}

// Fraction each affected point moves toward the brush area's (weighted)
// average height, per stroke event — a standard blur/Laplacian-style
// smoothing brush, using the brush region itself as the smoothing
// neighborhood rather than a separate per-point neighbor search.
const SMOOTH_STRENGTH = 0.15;

function applySmoothStroke(worldX: number, worldZ: number): void {
  const effects = getPointsInBrush(localPoints, worldX, worldZ, brushRadius);
  if (effects.length === 0) return;

  let weightedSum = 0;
  let weightTotal = 0;
  for (const { index, weight } of effects) {
    weightedSum += localPoints[index].z * weight;
    weightTotal += weight;
  }
  const average = weightedSum / weightTotal;

  for (const { index, weight } of effects) {
    const current = localPoints[index].z;
    localPoints[index].z = current + (average - current) * SMOOTH_STRENGTH * weight;
  }
  writeHeightsToGeometry();
}

// --- Obstacle instances -----------------------------------------------
// Each obstacle is a separate object overlaid on the terrain (per
// docs/decisions.md), centered on its own local origin so position/rotation
// pivots around its actual center. Elevation isn't stored — it's sampled
// from the terrain each time an instance's x/z changes.

// Obstacle geometry is an open single-sided surface (no back faces), so
// DoubleSide is needed or the mesh disappears when viewed from below/behind.
const OBSTACLE_MATERIALS: Record<ObstacleType, MeshLambertMaterial> = {
  roller: new MeshLambertMaterial({ color: 0xb5652d, side: DoubleSide }),
  berm: new MeshLambertMaterial({ color: 0x8a6bb0, side: DoubleSide }),
  kicker: new MeshLambertMaterial({ color: 0xc94f4f, side: DoubleSide }),
};

function buildGeometryForInstance(instance: ObstacleInstance) {
  switch (instance.type) {
    case "roller":
      return buildRollerGeometry(instance.params as RollerParams);
    case "berm":
      return buildBermGeometry(instance.params as BermParams);
    case "kicker":
      return buildKickerGeometry(instance.params as KickerParams);
  }
}

const instances: ObstacleInstance[] = [];
const meshesById = new Map<string, Mesh>();
let selectedId: string | null = null;

function findInstance(id: string): ObstacleInstance | undefined {
  return instances.find((instance) => instance.id === id);
}

function repositionMesh(instance: ObstacleInstance): void {
  const mesh = meshesById.get(instance.id);
  if (!mesh) return;
  const elevation = sampleTerrainHeight(localPoints, instance.x, instance.z);
  mesh.position.set(instance.x, elevation, instance.z);
  mesh.rotation.y = instance.rotation;
}

function rebuildInstanceGeometry(instance: ObstacleInstance): void {
  const mesh = meshesById.get(instance.id);
  if (!mesh) return;
  mesh.geometry.dispose();
  mesh.geometry = buildGeometryForInstance(instance);
}

function addObstacle(type: ObstacleType): void {
  const spawnIndex = instances.length;
  const x = (spawnIndex % 5) * 3 - 6;
  const z = Math.floor(spawnIndex / 5) * 3 - 6;
  const instance = createInstance(type, x, z);
  instances.push(instance);

  const mesh = new Mesh(buildGeometryForInstance(instance), OBSTACLE_MATERIALS[type]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  meshesById.set(instance.id, mesh);
  repositionMesh(instance);

  selectInstance(instance.id);
}

function removeSelected(): void {
  if (!selectedId) return;
  const mesh = meshesById.get(selectedId);
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
    meshesById.delete(selectedId);
  }
  const index = instances.findIndex((instance) => instance.id === selectedId);
  if (index !== -1) instances.splice(index, 1);
  selectInstance(null);
}

// --- Selection visuals (shared across both views) -----------------------

const selectionRing = new Mesh(new RingGeometry(0.92, 1, 32), new MeshBasicMaterial({ color: 0xffe066, side: DoubleSide }));
selectionRing.rotation.x = -Math.PI / 2;
selectionRing.visible = false;
scene.add(selectionRing);

// Four rotate handles (at 0/90/180/270° around the obstacle), not one —
// a single handle can end up unreachable if it happens to land inside
// terrain or off the visible area; having one on each side means there's
// always a free one to grab. Dragging any of them rotates the obstacle
// the same way (see findGrabbedHandleOffset / the pointerdown/move
// handlers below, which track *which* handle was grabbed).
const ROTATE_HANDLE_OFFSETS = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
const rotateHandleGeometry = new SphereGeometry(0.15, 12, 12);
const rotateHandleMaterial = new MeshBasicMaterial({ color: 0xffe066 });
const rotateHandles = ROTATE_HANDLE_OFFSETS.map(() => {
  const handle = new Mesh(rotateHandleGeometry, rotateHandleMaterial);
  handle.visible = false;
  scene.add(handle);
  return handle;
});

function updateSelectionVisuals(instance: ObstacleInstance): void {
  const mesh = meshesById.get(instance.id);
  if (!mesh) return;
  const radius = getFootprintRadius(instance);

  selectionRing.visible = true;
  selectionRing.position.set(instance.x, mesh.position.y + 0.02, instance.z);
  selectionRing.scale.setScalar(radius);

  const handleDistance = radius + 0.6;
  ROTATE_HANDLE_OFFSETS.forEach((offset, i) => {
    const angle = instance.rotation + offset;
    const handle = rotateHandles[i];
    handle.visible = true;
    handle.position.set(instance.x + handleDistance * Math.cos(angle), mesh.position.y + 0.3, instance.z - handleDistance * Math.sin(angle));
  });
}

// --- Per-type control panels ---------------------------------------------
// Only the panel matching the selected instance's type is shown. Sliders
// both write into the selected instance (on 'input') and get resynced from
// it (after a drag/rotate on the 2D canvas), so they always reflect
// whichever instance is currently selected.

const rollerPanel = document.querySelector<HTMLDivElement>("#roller-panel")!;
const bermPanel = document.querySelector<HTMLDivElement>("#berm-panel")!;
const kickerPanel = document.querySelector<HTMLDivElement>("#kicker-panel")!;
const noSelectionHint = document.querySelector<HTMLDivElement>("#no-selection-hint")!;
const removeButton = document.querySelector<HTMLButtonElement>("#remove-selected-btn")!;

const lengthInput = document.querySelector<HTMLInputElement>("#roller-length")!;
const heightInput = document.querySelector<HTMLInputElement>("#roller-height")!;
const widthInput = document.querySelector<HTMLInputElement>("#roller-width")!;
const periodsInput = document.querySelector<HTMLInputElement>("#roller-periods")!;
const posXInput = document.querySelector<HTMLInputElement>("#roller-pos-x")!;
const posZInput = document.querySelector<HTMLInputElement>("#roller-pos-z")!;
const rotationInput = document.querySelector<HTMLInputElement>("#roller-rotation")!;
const lengthValue = document.querySelector<HTMLSpanElement>("#roller-length-value")!;
const heightValue = document.querySelector<HTMLSpanElement>("#roller-height-value")!;
const widthValue = document.querySelector<HTMLSpanElement>("#roller-width-value")!;
const periodsValue = document.querySelector<HTMLSpanElement>("#roller-periods-value")!;
const posXValue = document.querySelector<HTMLSpanElement>("#roller-pos-x-value")!;
const posZValue = document.querySelector<HTMLSpanElement>("#roller-pos-z-value")!;
const rotationValue = document.querySelector<HTMLSpanElement>("#roller-rotation-value")!;

const bermRadiusInput = document.querySelector<HTMLInputElement>("#berm-radius")!;
const bermSweepInput = document.querySelector<HTMLInputElement>("#berm-sweep")!;
const bermBankInput = document.querySelector<HTMLInputElement>("#berm-bank")!;
const bermWidthInput = document.querySelector<HTMLInputElement>("#berm-width")!;
const bermPosXInput = document.querySelector<HTMLInputElement>("#berm-pos-x")!;
const bermPosZInput = document.querySelector<HTMLInputElement>("#berm-pos-z")!;
const bermRotationInput = document.querySelector<HTMLInputElement>("#berm-rotation")!;
const bermRadiusValue = document.querySelector<HTMLSpanElement>("#berm-radius-value")!;
const bermSweepValue = document.querySelector<HTMLSpanElement>("#berm-sweep-value")!;
const bermBankValue = document.querySelector<HTMLSpanElement>("#berm-bank-value")!;
const bermWidthValue = document.querySelector<HTMLSpanElement>("#berm-width-value")!;
const bermPosXValue = document.querySelector<HTMLSpanElement>("#berm-pos-x-value")!;
const bermPosZValue = document.querySelector<HTMLSpanElement>("#berm-pos-z-value")!;
const bermRotationValue = document.querySelector<HTMLSpanElement>("#berm-rotation-value")!;

const kickerHeightInput = document.querySelector<HTMLInputElement>("#kicker-height")!;
const kickerLipAngleInput = document.querySelector<HTMLInputElement>("#kicker-lip-angle")!;
const kickerWidthInput = document.querySelector<HTMLInputElement>("#kicker-width")!;
const kickerPosXInput = document.querySelector<HTMLInputElement>("#kicker-pos-x")!;
const kickerPosZInput = document.querySelector<HTMLInputElement>("#kicker-pos-z")!;
const kickerRotationInput = document.querySelector<HTMLInputElement>("#kicker-rotation")!;
const kickerHeightValue = document.querySelector<HTMLSpanElement>("#kicker-height-value")!;
const kickerLipAngleValue = document.querySelector<HTMLSpanElement>("#kicker-lip-angle-value")!;
const kickerWidthValue = document.querySelector<HTMLSpanElement>("#kicker-width-value")!;
const kickerPosXValue = document.querySelector<HTMLSpanElement>("#kicker-pos-x-value")!;
const kickerPosZValue = document.querySelector<HTMLSpanElement>("#kicker-pos-z-value")!;
const kickerRotationValue = document.querySelector<HTMLSpanElement>("#kicker-rotation-value")!;

function rotationDegrees(instance: ObstacleInstance): number {
  return Math.round((((instance.rotation * 180) / Math.PI) % 360) + 360) % 360;
}

function syncRollerPanel(instance: ObstacleInstance): void {
  const p = instance.params as RollerParams;
  lengthInput.value = String(p.length);
  heightInput.value = String(p.height);
  widthInput.value = String(p.width);
  periodsInput.value = String(p.periods);
  posXInput.value = String(instance.x);
  posZInput.value = String(instance.z);
  rotationInput.value = String(rotationDegrees(instance));

  lengthValue.textContent = `${p.length.toFixed(1)}m`;
  heightValue.textContent = `${p.height.toFixed(2)}m`;
  widthValue.textContent = `${p.width.toFixed(1)}m`;
  periodsValue.textContent = `${p.periods}`;
  posXValue.textContent = `${instance.x.toFixed(1)}m`;
  posZValue.textContent = `${instance.z.toFixed(1)}m`;
  rotationValue.textContent = `${rotationInput.value}°`;
}

function syncBermPanel(instance: ObstacleInstance): void {
  const p = instance.params as BermParams;
  bermRadiusInput.value = String(p.radius);
  bermSweepInput.value = String(p.sweepAngle);
  bermBankInput.value = String(p.bankAngle);
  bermWidthInput.value = String(p.width);
  bermPosXInput.value = String(instance.x);
  bermPosZInput.value = String(instance.z);
  bermRotationInput.value = String(rotationDegrees(instance));

  bermRadiusValue.textContent = `${p.radius.toFixed(1)}m`;
  bermSweepValue.textContent = `${p.sweepAngle}°`;
  bermBankValue.textContent = `${p.bankAngle}°`;
  bermWidthValue.textContent = `${p.width.toFixed(1)}m`;
  bermPosXValue.textContent = `${instance.x.toFixed(1)}m`;
  bermPosZValue.textContent = `${instance.z.toFixed(1)}m`;
  bermRotationValue.textContent = `${bermRotationInput.value}°`;
}

function syncKickerPanel(instance: ObstacleInstance): void {
  const p = instance.params as KickerParams;
  kickerHeightInput.value = String(p.height);
  kickerLipAngleInput.value = String(p.lipAngle);
  kickerWidthInput.value = String(p.width);
  kickerPosXInput.value = String(instance.x);
  kickerPosZInput.value = String(instance.z);
  kickerRotationInput.value = String(rotationDegrees(instance));

  kickerHeightValue.textContent = `${p.height.toFixed(2)}m`;
  kickerLipAngleValue.textContent = `${p.lipAngle}°`;
  kickerWidthValue.textContent = `${p.width.toFixed(1)}m`;
  kickerPosXValue.textContent = `${instance.x.toFixed(1)}m`;
  kickerPosZValue.textContent = `${instance.z.toFixed(1)}m`;
  kickerRotationValue.textContent = `${kickerRotationInput.value}°`;
}

function syncPanel(instance: ObstacleInstance): void {
  if (instance.type === "roller") syncRollerPanel(instance);
  else if (instance.type === "berm") syncBermPanel(instance);
  else syncKickerPanel(instance);
}

function selectInstance(id: string | null): void {
  selectedId = id;
  const instance = id ? findInstance(id) : undefined;

  rollerPanel.style.display = instance?.type === "roller" ? "" : "none";
  bermPanel.style.display = instance?.type === "berm" ? "" : "none";
  kickerPanel.style.display = instance?.type === "kicker" ? "" : "none";
  noSelectionHint.style.display = instance ? "none" : "";
  removeButton.disabled = !instance;

  if (instance) {
    syncPanel(instance);
    updateSelectionVisuals(instance);
  } else {
    selectionRing.visible = false;
    rotateHandles.forEach((handle) => (handle.visible = false));
  }
}

function applyRollerInput(): void {
  const instance = selectedId ? findInstance(selectedId) : undefined;
  if (!instance || instance.type !== "roller") return;
  const p = instance.params as RollerParams;
  p.length = Number(lengthInput.value);
  p.height = Number(heightInput.value);
  p.width = Number(widthInput.value);
  p.periods = Number(periodsInput.value);
  instance.x = Number(posXInput.value);
  instance.z = Number(posZInput.value);
  instance.rotation = (Number(rotationInput.value) * Math.PI) / 180;

  rebuildInstanceGeometry(instance);
  repositionMesh(instance);
  updateSelectionVisuals(instance);
  syncPanel(instance);
}

function applyBermInput(): void {
  const instance = selectedId ? findInstance(selectedId) : undefined;
  if (!instance || instance.type !== "berm") return;
  const p = instance.params as BermParams;
  p.radius = Number(bermRadiusInput.value);
  p.sweepAngle = Number(bermSweepInput.value);
  p.bankAngle = Number(bermBankInput.value);
  p.width = Number(bermWidthInput.value);
  instance.x = Number(bermPosXInput.value);
  instance.z = Number(bermPosZInput.value);
  instance.rotation = (Number(bermRotationInput.value) * Math.PI) / 180;

  rebuildInstanceGeometry(instance);
  repositionMesh(instance);
  updateSelectionVisuals(instance);
  syncPanel(instance);
}

function applyKickerInput(): void {
  const instance = selectedId ? findInstance(selectedId) : undefined;
  if (!instance || instance.type !== "kicker") return;
  const p = instance.params as KickerParams;
  p.height = Number(kickerHeightInput.value);
  p.lipAngle = Number(kickerLipAngleInput.value);
  p.width = Number(kickerWidthInput.value);
  instance.x = Number(kickerPosXInput.value);
  instance.z = Number(kickerPosZInput.value);
  instance.rotation = (Number(kickerRotationInput.value) * Math.PI) / 180;

  rebuildInstanceGeometry(instance);
  repositionMesh(instance);
  updateSelectionVisuals(instance);
  syncPanel(instance);
}

for (const input of [lengthInput, heightInput, widthInput, periodsInput, posXInput, posZInput, rotationInput]) {
  input.addEventListener("input", applyRollerInput);
}
for (const input of [bermRadiusInput, bermSweepInput, bermBankInput, bermWidthInput, bermPosXInput, bermPosZInput, bermRotationInput]) {
  input.addEventListener("input", applyBermInput);
}
for (const input of [kickerHeightInput, kickerLipAngleInput, kickerWidthInput, kickerPosXInput, kickerPosZInput, kickerRotationInput]) {
  input.addEventListener("input", applyKickerInput);
}

document.querySelector<HTMLButtonElement>("#add-roller-btn")!.addEventListener("click", () => addObstacle("roller"));
document.querySelector<HTMLButtonElement>("#add-berm-btn")!.addEventListener("click", () => addObstacle("berm"));
document.querySelector<HTMLButtonElement>("#add-kicker-btn")!.addEventListener("click", () => addObstacle("kicker"));
removeButton.addEventListener("click", removeSelected);

selectInstance(null);

// --- Edit mode: Obstacles vs Terrain -------------------------------------
// Both target the same 2D view, so an explicit mode avoids ambiguity about
// what a click/drag affects (docs/decisions.md).

type EditMode = "obstacles" | "terrain";
let editMode: EditMode = "obstacles";

const modeObstaclesBtn = document.querySelector<HTMLButtonElement>("#mode-obstacles-btn")!;
const modeTerrainBtn = document.querySelector<HTMLButtonElement>("#mode-terrain-btn")!;
const obstaclesToolbar = document.querySelector<HTMLDivElement>("#obstacles-toolbar")!;
const terrainToolbar = document.querySelector<HTMLDivElement>("#terrain-toolbar")!;
const brushSizeInput = document.querySelector<HTMLInputElement>("#brush-size")!;
const brushSizeValue = document.querySelector<HTMLSpanElement>("#brush-size-value")!;

function setEditMode(mode: EditMode): void {
  editMode = mode;
  modeObstaclesBtn.classList.toggle("active", mode === "obstacles");
  modeTerrainBtn.classList.toggle("active", mode === "terrain");
  obstaclesToolbar.style.display = mode === "obstacles" ? "" : "none";
  terrainToolbar.style.display = mode === "terrain" ? "" : "none";
  vertexMarkers.visible = mode === "terrain";

  if (mode === "terrain") {
    selectInstance(null);
  } else {
    resetBrushHighlight();
  }
}

modeObstaclesBtn.addEventListener("click", () => setEditMode("obstacles"));
modeTerrainBtn.addEventListener("click", () => setEditMode("terrain"));
brushSizeInput.addEventListener("input", () => {
  brushRadius = Number(brushSizeInput.value);
  brushSizeValue.textContent = `${brushRadius.toFixed(1)}m`;
});
brushSizeValue.textContent = `${brushRadius.toFixed(1)}m`;

setEditMode("obstacles");

// --- Terrain tool: Raise/Lower vs Smooth ---------------------------------

type TerrainTool = "sculpt" | "smooth";
let terrainTool: TerrainTool = "sculpt";

const toolSculptBtn = document.querySelector<HTMLButtonElement>("#tool-sculpt-btn")!;
const toolSmoothBtn = document.querySelector<HTMLButtonElement>("#tool-smooth-btn")!;
const terrainToolHint = document.querySelector<HTMLSpanElement>("#terrain-tool-hint")!;

function setTerrainTool(tool: TerrainTool): void {
  terrainTool = tool;
  toolSculptBtn.classList.toggle("active", tool === "sculpt");
  toolSmoothBtn.classList.toggle("active", tool === "smooth");
  terrainToolHint.textContent =
    tool === "sculpt"
      ? "Drag on the 2D Plan View to raise (up) / lower (down) terrain within the brush."
      : "Click or drag on the 2D Plan View to smooth terrain within the brush toward its local average.";
}

toolSculptBtn.addEventListener("click", () => setTerrainTool("sculpt"));
toolSmoothBtn.addEventListener("click", () => setTerrainTool("smooth"));

// --- Views ---------------------------------------------------------------

const view3dBody = document.querySelector<HTMLDivElement>("#view-3d-body")!;
const view2dBody = document.querySelector<HTMLDivElement>("#view-2d-body")!;

// 3D perspective view, orbit-controllable.
const camera3d = new PerspectiveCamera(60, 1, 0.1, 1000);
camera3d.position.set(15, 12, 15);

const renderer3d = new WebGLRenderer({ antialias: true });
renderer3d.shadowMap.enabled = true;
view3dBody.appendChild(renderer3d.domElement);

const controls = new OrbitControls(camera3d, renderer3d.domElement);
controls.target.set(0, 0, 0);

// 2D top-down view: an orthographic camera looking straight down at the same
// scene, and the interactive surface for selecting/moving/rotating
// obstacles (per docs/decisions.md's 2D-only editing decision). Vertex
// editing and trail marking aren't built yet.
const PLAN_VIEW_EXTENT = 12;
const camera2d = new OrthographicCamera(-PLAN_VIEW_EXTENT, PLAN_VIEW_EXTENT, PLAN_VIEW_EXTENT, -PLAN_VIEW_EXTENT, 0.1, 100);
camera2d.position.set(0, 50, 0);
camera2d.up.set(0, 0, -1);
camera2d.lookAt(0, 0, 0);

const renderer2d = new WebGLRenderer({ antialias: true });
renderer2d.shadowMap.enabled = true;
view2dBody.appendChild(renderer2d.domElement);

function resizeToContainer(renderer: WebGLRenderer, container: HTMLDivElement, camera: PerspectiveCamera | OrthographicCamera): void {
  const { clientWidth: width, clientHeight: height } = container;
  if (width === 0 || height === 0) return;

  renderer.setSize(width, height);
  if (camera instanceof PerspectiveCamera) {
    camera.aspect = width / height;
  } else {
    const halfHeight = PLAN_VIEW_EXTENT;
    const halfWidth = halfHeight * (width / height);
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
  }
  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(() => {
  resizeToContainer(renderer3d, view3dBody, camera3d);
  resizeToContainer(renderer2d, view2dBody, camera2d);
});
resizeObserver.observe(view3dBody);
resizeObserver.observe(view2dBody);

// --- 2D view interaction: select, drag-to-move, drag-handle-to-rotate ----

const HANDLE_HIT_RADIUS = 0.5;

function canvasEventToWorld(event: PointerEvent): { x: number; z: number } {
  const rect = renderer2d.domElement.getBoundingClientRect();
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;
  return screenToWorld(px, py, rect.width, rect.height, camera2d.left, camera2d.right, camera2d.top, camera2d.bottom);
}

function findInstanceAt(worldX: number, worldZ: number): ObstacleInstance | undefined {
  return instances.find((instance) => {
    const r = getFootprintRadius(instance);
    const dx = instance.x - worldX;
    const dz = instance.z - worldZ;
    return dx * dx + dz * dz <= r * r;
  });
}

/** Returns the offset (from ROTATE_HANDLE_OFFSETS) of whichever handle was hit, if any. */
function findGrabbedHandleOffset(instance: ObstacleInstance, worldX: number, worldZ: number): number | undefined {
  const r = getFootprintRadius(instance) + 0.6;
  return ROTATE_HANDLE_OFFSETS.find((offset) => {
    const angle = instance.rotation + offset;
    const handleX = instance.x + r * Math.cos(angle);
    const handleZ = instance.z - r * Math.sin(angle);
    const dx = handleX - worldX;
    const dz = handleZ - worldZ;
    return dx * dx + dz * dz <= HANDLE_HIT_RADIUS * HANDLE_HIT_RADIUS;
  });
}

type DragMode = { kind: "move"; instanceId: string } | { kind: "rotate"; instanceId: string; handleOffset: number } | null;
let dragMode: DragMode = null;

// Terrain-brush dragging fixes the brush's world (x, z) at wherever the drag
// started — vertical mouse movement only ever changes height, never the
// brush's ground position. This matters because the 2D view's screen-Y maps
// to world Z (see view2d/projection.ts): if we kept recomputing (x, z) from
// the live cursor position while dragging, moving the mouse vertically to
// control height would also drag the brush around the ground plane, since
// that's the same screen axis. Each move event still applies an incremental
// height delta (based on how far the mouse moved since the previous event),
// which is what lets you keep raising/lowering in one continuous stroke.
const HEIGHT_DRAG_SENSITIVITY = 0.02; // metres per pixel
let terrainDrag: { x: number; z: number; lastClientY: number } | null = null;

renderer2d.domElement.addEventListener("pointerdown", (event) => {
  const { x, z } = canvasEventToWorld(event);

  if (editMode === "terrain") {
    terrainDrag = { x, z, lastClientY: event.clientY };
    if (terrainTool === "smooth") applySmoothStroke(x, z);
    updateBrushHighlight(x, z);
    return;
  }

  const selected = selectedId ? findInstance(selectedId) : undefined;
  if (selected) {
    const handleOffset = findGrabbedHandleOffset(selected, x, z);
    if (handleOffset !== undefined) {
      dragMode = { kind: "rotate", instanceId: selected.id, handleOffset };
      return;
    }
  }

  const hit = findInstanceAt(x, z);
  if (hit) {
    selectInstance(hit.id);
    dragMode = { kind: "move", instanceId: hit.id };
  } else {
    selectInstance(null);
  }
});

renderer2d.domElement.addEventListener("pointermove", (event) => {
  const { x, z } = canvasEventToWorld(event);

  if (editMode === "terrain") {
    if (terrainDrag && terrainTool === "sculpt") {
      // Locked at the drag-start position — see the comment on terrainDrag:
      // vertical mouse movement controls height, so it can't also move the
      // brush (screen-Y maps to world Z in this top-down view).
      const deltaPixels = terrainDrag.lastClientY - event.clientY;
      applyBrushStroke(terrainDrag.x, terrainDrag.z, deltaPixels * HEIGHT_DRAG_SENSITIVITY);
      terrainDrag.lastClientY = event.clientY;
      updateBrushHighlight(terrainDrag.x, terrainDrag.z);
    } else if (terrainDrag) {
      // Smoothing has no such conflict, so the brush follows the live
      // cursor — drag to sweep the smoothing effect across an area.
      applySmoothStroke(x, z);
      updateBrushHighlight(x, z);
    } else {
      updateBrushHighlight(x, z);
    }
    return;
  }

  if (!dragMode) return;
  const instance = findInstance(dragMode.instanceId);
  if (!instance) return;

  if (dragMode.kind === "move") {
    instance.x = x;
    instance.z = z;
  } else {
    const grabbedAngle = Math.atan2(-(z - instance.z), x - instance.x);
    instance.rotation = grabbedAngle - dragMode.handleOffset;
  }

  repositionMesh(instance);
  updateSelectionVisuals(instance);
  syncPanel(instance);
});

renderer2d.domElement.addEventListener("pointerleave", () => {
  if (editMode === "terrain") resetBrushHighlight();
});

window.addEventListener("pointerup", () => {
  dragMode = null;
  terrainDrag = null;
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer3d.render(scene, camera3d);
  renderer2d.render(scene, camera2d);
}
animate();
