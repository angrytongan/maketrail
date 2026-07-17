import {
  AmbientLight,
  DirectionalLight,
  GridHelper,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { toLocal, type GeoPoint } from "./terrain/coords";
import { buildTerrainGeometry } from "./terrain/mesh";
import { buildRollerGeometry } from "./obstacles/roller";
import { buildBermGeometry } from "./obstacles/berm";
import { buildKickerGeometry } from "./obstacles/kicker";

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
const terrainMaterial = new MeshLambertMaterial({ color: 0x6b8f5a });
const terrain = new Mesh(terrainGeometry, terrainMaterial);
scene.add(terrain);

// Roller obstacle: a separate object overlaid on the terrain (per
// docs/decisions.md), not a deformation of it. Geometry is centered on its
// own local origin (see buildRollerGeometry) so rotation pivots around the
// obstacle's center, not a corner.
const rollerMaterial = new MeshLambertMaterial({ color: 0xb5652d });
const roller = new Mesh(buildRollerGeometry({ length: 3, height: 0.3, width: 1.2, periods: 1 }), rollerMaterial);
scene.add(roller);

function updateRoller(): void {
  const length = Number(lengthInput.value);
  const height = Number(heightInput.value);
  const width = Number(widthInput.value);
  const periods = Number(periodsInput.value);

  roller.geometry.dispose();
  roller.geometry = buildRollerGeometry({ length, height, width, periods });

  roller.position.set(Number(posXInput.value), Number(elevationInput.value), Number(posZInput.value));
  roller.rotation.y = (Number(rotationInput.value) * Math.PI) / 180;

  lengthValue.textContent = `${length.toFixed(1)}m`;
  heightValue.textContent = `${height.toFixed(2)}m`;
  widthValue.textContent = `${width.toFixed(1)}m`;
  periodsValue.textContent = `${periods}`;
  posXValue.textContent = `${Number(posXInput.value).toFixed(1)}m`;
  posZValue.textContent = `${Number(posZInput.value).toFixed(1)}m`;
  elevationValue.textContent = `${Number(elevationInput.value).toFixed(1)}m`;
  rotationValue.textContent = `${rotationInput.value}°`;
}

const lengthInput = document.querySelector<HTMLInputElement>("#roller-length")!;
const heightInput = document.querySelector<HTMLInputElement>("#roller-height")!;
const widthInput = document.querySelector<HTMLInputElement>("#roller-width")!;
const periodsInput = document.querySelector<HTMLInputElement>("#roller-periods")!;
const posXInput = document.querySelector<HTMLInputElement>("#roller-pos-x")!;
const posZInput = document.querySelector<HTMLInputElement>("#roller-pos-z")!;
const elevationInput = document.querySelector<HTMLInputElement>("#roller-elevation")!;
const rotationInput = document.querySelector<HTMLInputElement>("#roller-rotation")!;
const lengthValue = document.querySelector<HTMLSpanElement>("#roller-length-value")!;
const heightValue = document.querySelector<HTMLSpanElement>("#roller-height-value")!;
const widthValue = document.querySelector<HTMLSpanElement>("#roller-width-value")!;
const periodsValue = document.querySelector<HTMLSpanElement>("#roller-periods-value")!;
const posXValue = document.querySelector<HTMLSpanElement>("#roller-pos-x-value")!;
const posZValue = document.querySelector<HTMLSpanElement>("#roller-pos-z-value")!;
const elevationValue = document.querySelector<HTMLSpanElement>("#roller-elevation-value")!;
const rotationValue = document.querySelector<HTMLSpanElement>("#roller-rotation-value")!;

for (const input of [lengthInput, heightInput, widthInput, periodsInput, posXInput, posZInput, elevationInput, rotationInput]) {
  input.addEventListener("input", updateRoller);
}
updateRoller();

// Berm obstacle: same "separate object overlaid on terrain, centered on its
// own local origin" convention as the roller (see buildBermGeometry).
const bermMaterial = new MeshLambertMaterial({ color: 0x8a6bb0 });
const berm = new Mesh(buildBermGeometry({ radius: 4, sweepAngle: 90, bankAngle: 35, width: 2 }), bermMaterial);
scene.add(berm);

function updateBerm(): void {
  const radius = Number(bermRadiusInput.value);
  const sweepAngle = Number(bermSweepInput.value);
  const bankAngle = Number(bermBankInput.value);
  const width = Number(bermWidthInput.value);

  berm.geometry.dispose();
  berm.geometry = buildBermGeometry({ radius, sweepAngle, bankAngle, width });

  berm.position.set(Number(bermPosXInput.value), Number(bermElevationInput.value), Number(bermPosZInput.value));
  berm.rotation.y = (Number(bermRotationInput.value) * Math.PI) / 180;

  bermRadiusValue.textContent = `${radius.toFixed(1)}m`;
  bermSweepValue.textContent = `${sweepAngle}°`;
  bermBankValue.textContent = `${bankAngle}°`;
  bermWidthValue.textContent = `${width.toFixed(1)}m`;
  bermPosXValue.textContent = `${Number(bermPosXInput.value).toFixed(1)}m`;
  bermPosZValue.textContent = `${Number(bermPosZInput.value).toFixed(1)}m`;
  bermElevationValue.textContent = `${Number(bermElevationInput.value).toFixed(1)}m`;
  bermRotationValue.textContent = `${bermRotationInput.value}°`;
}

const bermRadiusInput = document.querySelector<HTMLInputElement>("#berm-radius")!;
const bermSweepInput = document.querySelector<HTMLInputElement>("#berm-sweep")!;
const bermBankInput = document.querySelector<HTMLInputElement>("#berm-bank")!;
const bermWidthInput = document.querySelector<HTMLInputElement>("#berm-width")!;
const bermPosXInput = document.querySelector<HTMLInputElement>("#berm-pos-x")!;
const bermPosZInput = document.querySelector<HTMLInputElement>("#berm-pos-z")!;
const bermElevationInput = document.querySelector<HTMLInputElement>("#berm-elevation")!;
const bermRotationInput = document.querySelector<HTMLInputElement>("#berm-rotation")!;
const bermRadiusValue = document.querySelector<HTMLSpanElement>("#berm-radius-value")!;
const bermSweepValue = document.querySelector<HTMLSpanElement>("#berm-sweep-value")!;
const bermBankValue = document.querySelector<HTMLSpanElement>("#berm-bank-value")!;
const bermWidthValue = document.querySelector<HTMLSpanElement>("#berm-width-value")!;
const bermPosXValue = document.querySelector<HTMLSpanElement>("#berm-pos-x-value")!;
const bermPosZValue = document.querySelector<HTMLSpanElement>("#berm-pos-z-value")!;
const bermElevationValue = document.querySelector<HTMLSpanElement>("#berm-elevation-value")!;
const bermRotationValue = document.querySelector<HTMLSpanElement>("#berm-rotation-value")!;

for (const input of [
  bermRadiusInput,
  bermSweepInput,
  bermBankInput,
  bermWidthInput,
  bermPosXInput,
  bermPosZInput,
  bermElevationInput,
  bermRotationInput,
]) {
  input.addEventListener("input", updateBerm);
}
updateBerm();

// Kicker obstacle: same overlaid-on-terrain convention as the roller/berm.
// X is centered but Y stays anchored at 0 for the base (see
// buildKickerGeometry) since a kicker is inherently asymmetric.
const kickerMaterial = new MeshLambertMaterial({ color: 0xc94f4f });
const kicker = new Mesh(buildKickerGeometry({ height: 0.5, lipAngle: 25, width: 1.2 }), kickerMaterial);
scene.add(kicker);

function updateKicker(): void {
  const height = Number(kickerHeightInput.value);
  const lipAngle = Number(kickerLipAngleInput.value);
  const width = Number(kickerWidthInput.value);

  kicker.geometry.dispose();
  kicker.geometry = buildKickerGeometry({ height, lipAngle, width });

  kicker.position.set(Number(kickerPosXInput.value), Number(kickerElevationInput.value), Number(kickerPosZInput.value));
  kicker.rotation.y = (Number(kickerRotationInput.value) * Math.PI) / 180;

  kickerHeightValue.textContent = `${height.toFixed(2)}m`;
  kickerLipAngleValue.textContent = `${lipAngle}°`;
  kickerWidthValue.textContent = `${width.toFixed(1)}m`;
  kickerPosXValue.textContent = `${Number(kickerPosXInput.value).toFixed(1)}m`;
  kickerPosZValue.textContent = `${Number(kickerPosZInput.value).toFixed(1)}m`;
  kickerElevationValue.textContent = `${Number(kickerElevationInput.value).toFixed(1)}m`;
  kickerRotationValue.textContent = `${kickerRotationInput.value}°`;
}

const kickerHeightInput = document.querySelector<HTMLInputElement>("#kicker-height")!;
const kickerLipAngleInput = document.querySelector<HTMLInputElement>("#kicker-lip-angle")!;
const kickerWidthInput = document.querySelector<HTMLInputElement>("#kicker-width")!;
const kickerPosXInput = document.querySelector<HTMLInputElement>("#kicker-pos-x")!;
const kickerPosZInput = document.querySelector<HTMLInputElement>("#kicker-pos-z")!;
const kickerElevationInput = document.querySelector<HTMLInputElement>("#kicker-elevation")!;
const kickerRotationInput = document.querySelector<HTMLInputElement>("#kicker-rotation")!;
const kickerHeightValue = document.querySelector<HTMLSpanElement>("#kicker-height-value")!;
const kickerLipAngleValue = document.querySelector<HTMLSpanElement>("#kicker-lip-angle-value")!;
const kickerWidthValue = document.querySelector<HTMLSpanElement>("#kicker-width-value")!;
const kickerPosXValue = document.querySelector<HTMLSpanElement>("#kicker-pos-x-value")!;
const kickerPosZValue = document.querySelector<HTMLSpanElement>("#kicker-pos-z-value")!;
const kickerElevationValue = document.querySelector<HTMLSpanElement>("#kicker-elevation-value")!;
const kickerRotationValue = document.querySelector<HTMLSpanElement>("#kicker-rotation-value")!;

for (const input of [
  kickerHeightInput,
  kickerLipAngleInput,
  kickerWidthInput,
  kickerPosXInput,
  kickerPosZInput,
  kickerElevationInput,
  kickerRotationInput,
]) {
  input.addEventListener("input", updateKicker);
}
updateKicker();

scene.add(new GridHelper(20, 20));
scene.add(new AmbientLight(0xffffff, 0.6));
const sun = new DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 15, 5);
scene.add(sun);

const view3dBody = document.querySelector<HTMLDivElement>("#view-3d-body")!;
const view2dBody = document.querySelector<HTMLDivElement>("#view-2d-body")!;

// 3D perspective view, orbit-controllable.
const camera3d = new PerspectiveCamera(60, 1, 0.1, 1000);
camera3d.position.set(15, 12, 15);

const renderer3d = new WebGLRenderer({ antialias: true });
view3dBody.appendChild(renderer3d.domElement);

const controls = new OrbitControls(camera3d, renderer3d.domElement);
controls.target.set(0, 0, 0);

// 2D top-down view: an orthographic camera looking straight down at the same
// scene. Static for now — a preview of the card layout, not the real
// interactive 2D editor (vertex editing, obstacle placement) planned in
// docs/decisions.md.
const PLAN_VIEW_EXTENT = 12;
const camera2d = new OrthographicCamera(-PLAN_VIEW_EXTENT, PLAN_VIEW_EXTENT, PLAN_VIEW_EXTENT, -PLAN_VIEW_EXTENT, 0.1, 100);
camera2d.position.set(0, 50, 0);
camera2d.up.set(0, 0, -1);
camera2d.lookAt(0, 0, 0);

const renderer2d = new WebGLRenderer({ antialias: true });
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

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer3d.render(scene, camera3d);
  renderer2d.render(scene, camera2d);
}
animate();
