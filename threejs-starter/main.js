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

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 8);
scene.add(light);

const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);

// =======================================================
//  ROOM (10×10 floor, 5 height)
// =======================================================

// Floor
const floorGeo = new THREE.PlaneGeometry(10, 10);
const floorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Ceiling
const ceilGeo = new THREE.PlaneGeometry(10, 10);
const ceilMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
ceiling.position.y = 5;
ceiling.rotation.x = Math.PI / 2;
scene.add(ceiling);

// Wall Material
const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

// Back Wall (door will be here)
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), wallMat);
backWall.position.set(0, 2.5, -5);
scene.add(backWall);

// Front wall
const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), wallMat);
frontWall.position.set(0, 2.5, 5);
frontWall.rotation.y = Math.PI;
scene.add(frontWall);

// Left wall
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), wallMat);
leftWall.position.set(-5, 2.5, 0);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), wallMat);
rightWall.position.set(5, 2.5, 0);
rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);

// =======================================================
//  LOAD DOOR
// =======================================================

const loader = new GLTFLoader();

loader.load("/door_with_frame.glb", (gltf) => {
  const door = gltf.scene;

  door.scale.set(0.2, 0.2, 0.2);
  door.position.set(0, 0, -4.99); // near the back wall
  door.rotation.y = Math.PI; // face forward

  scene.add(door);
});

// =======================================================
//  LOAD TOILET
// =======================================================

loader.load("/toilet.glb", (gltf) => {
  const toilet = gltf.scene;

  toilet.scale.set(1.2, 1.2, 1.2);
  toilet.position.set(-2, 0, 1);

  scene.add(toilet);
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // <--- make camera move
  renderer.render(scene, camera);
}
animate();
