import {
  AmbientLight,
  DirectionalLight,
  GridHelper,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { toLocal, type GeoPoint } from "./terrain/coords";
import { buildTerrainGeometry } from "./terrain/mesh";

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

scene.add(new GridHelper(20, 20));
scene.add(new AmbientLight(0xffffff, 0.6));
const sun = new DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 15, 5);
scene.add(sun);

const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 12, 15);

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
