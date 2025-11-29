import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(4, 2, 6);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth movement
controls.dampingFactor = 0.05;
controls.target.set(0, 1.5, 0); // look at center of room
controls.enablePan = false;

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 8);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

// =======================================================
//  LOAD model8.glb
// =======================================================

const loader = new GLTFLoader();

loader.load("/model8.glb", (gltf) => {
  const door = gltf.scene;

  door.scale.set(0.2, 0.2, 0.2);
  door.position.set(0, 0, -4.99); // near the back wall
  door.rotation.y = Math.PI; // face forward

  scene.add(door);
});

// =======================================================
//  Camera movement (WASD + QE/Shift/Space)
// =======================================================
const clock = new THREE.Clock();
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
};

const velocity = new THREE.Vector3();
const lookDirection = new THREE.Vector3();
const flatForward = new THREE.Vector3();
const flatRight = new THREE.Vector3();
const moveSpeed = 80;
const damping = 10;

const keyToState = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "backward",
  ArrowDown: "backward",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  KeyE: "up",
  Space: "up",
  KeyQ: "down",
  ShiftLeft: "down",
  ShiftRight: "down",
};

function handleKey(event, isDown) {
  if (event.repeat) return;
  const stateKey = keyToState[event.code];
  if (stateKey) {
    moveState[stateKey] = isDown;
  }
}

window.addEventListener("keydown", (e) => handleKey(e, true));
window.addEventListener("keyup", (e) => handleKey(e, false));

function updateCameraMovement(delta) {
  // Get current look direction (used for forward/right vectors)
  camera.getWorldDirection(lookDirection);

  flatForward.set(lookDirection.x, 0, lookDirection.z);
  if (flatForward.lengthSq() === 0) {
    flatForward.set(0, 0, -1);
  } else {
    flatForward.normalize();
  }

  flatRight.crossVectors(flatForward, camera.up).normalize();

  const desired = new THREE.Vector3();
  if (moveState.forward) desired.add(flatForward);
  if (moveState.backward) desired.sub(flatForward);
  if (moveState.right) desired.add(flatRight);
  if (moveState.left) desired.sub(flatRight);
  if (moveState.up) desired.add(camera.up);
  if (moveState.down) desired.sub(camera.up);

  if (desired.lengthSq() > 0) desired.normalize();

  velocity.addScaledVector(desired, moveSpeed * delta);
  velocity.multiplyScalar(Math.exp(-damping * delta));

  camera.position.addScaledVector(velocity, delta);

  // Keep OrbitControls target just ahead of the camera for a first-person feel
  controls.target.copy(camera.position).add(lookDirection);
}

// Animate
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  updateCameraMovement(delta);
  controls.update(); // <--- make camera move
  renderer.render(scene, camera);
}
animate();
