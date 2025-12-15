import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

// =======================================================
//  SETUP SCENE
// =======================================================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0.8, 12, -35); // Posisi Start
camera.rotation.y = Math.PI; // Rotasi 180 derajat

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// door config
const doorsConfig = [
    {
        doorName: "door_1",
        handleName: "door_2",
        pivot: new THREE.Vector3(-4.1, 0, -0.8),
        direction: -1, // 1 atau -1 (Arah putar)
    },
    {
        doorName: "door001",
        handleName: "door001_1",
        pivot: new THREE.Vector3(-22, 0, 18.8),
        direction: -1,
    },
    {
        doorName: "Door",
        handleName: "Door_1",
        pivot: new THREE.Vector3(-15, 0, 26.4),
        direction: -1,
    },
];

const switchConfig = [
    { switchName: "saklar_depan1", targetLights: ["lampu_depan1"] },
    { switchName: "saklar_depan2", targetLights: ["lampu_depan2"] },
    { switchName: "saklar_dalem1", targetLights: ["lampu_dalem1A", "lampu_dalem1B"] },
    { switchName: "saklar_dalem2", targetLights: ["lampu_dalem2"] },
    { switchName: "saklar_KM_L", targetLights: ["lampu_KM_L"] },
    { switchName: "saklar_KM_R", targetLights: ["lampu_KM_R"] },
];

let doorSystems = [];
let switchSystems = [];
let mirror; // Global variable for mirror

const blocker = document.createElement("div");
blocker.style.position = "absolute";
blocker.style.top = "50%";
blocker.style.left = "50%";
blocker.style.transform = "translate(-50%, -50%)";
blocker.style.color = "white";
blocker.style.fontSize = "24px";
blocker.style.fontFamily = "Arial";
blocker.style.backgroundColor = "rgba(0,0,0,0.5)";
blocker.style.padding = "20px";
blocker.style.cursor = "pointer";
blocker.innerHTML = "KLIK UNTUK MULAI";
document.body.appendChild(blocker);

const debugDiv = document.createElement("div");
debugDiv.style.position = "absolute";
debugDiv.style.top = "10px";
debugDiv.style.left = "10px";
debugDiv.style.color = "white";
debugDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
debugDiv.style.padding = "10px";
debugDiv.style.fontFamily = "monospace";
debugDiv.style.fontSize = "14px";
debugDiv.style.pointerEvents = "none";
document.body.appendChild(debugDiv);

const crosshair = document.createElement("div");
crosshair.style.position = "absolute";
crosshair.style.top = "50%";
crosshair.style.left = "50%";
crosshair.style.width = "8px";
crosshair.style.height = "8px";
crosshair.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
crosshair.style.borderRadius = "50%";
crosshair.style.border = "1px solid black";
crosshair.style.transform = "translate(-50%, -50%)";
crosshair.style.pointerEvents = "none";
crosshair.style.display = "none";
document.body.appendChild(crosshair);

const controls = new PointerLockControls(camera, document.body);

blocker.addEventListener("click", () => controls.lock());
controls.addEventListener("lock", () => {
    blocker.style.display = "none";
    crosshair.style.display = "block";
});
controls.addEventListener("unlock", () => {
    blocker.style.display = "block";
    crosshair.style.display = "none";
});

// Lights
// const light = new THREE.DirectionalLight(0xffffff, 0.1);
// light.position.set(5, 10, 8);
// scene.add(light);
const ambient = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambient);

// =======================================================
//  LOADER & MULTI-DOOR LOGIC
// =======================================================
const raycaster = new THREE.Raycaster();
const raycasterDown = new THREE.Raycaster();
const raycasterUp = new THREE.Raycaster();
const interactionRaycaster = new THREE.Raycaster();
const collidableMeshList = [];

const loader = new GLTFLoader();

loader.load("/model16.glb", (gltf) => {
    const model = gltf.scene;

    model.scale.set(0.2, 0.2, 0.2);
    model.position.set(0, 0, -4.99);
    model.rotation.y = Math.PI;

    scene.add(model);

    // 1. Masukkan semua mesh ke collision list dulu
    //    dan buat dictionary sementara untuk memudahkan pencarian nama
    const meshMap = {}; // Key: nama mesh, Value: Object3D

    model.traverse((child) => {
        if (child.isMesh) {
            if (!child.name) child.name = "Unknown Mesh";
            collidableMeshList.push(child);
            meshMap[child.name] = child; // Simpan ke map
        }
    });

    // 2. SETUP PIVOT UNTUK SETIAP PINTU DI CONFIG
    doorsConfig.forEach((config) => {
        const doorMesh = meshMap[config.doorName];
        const handleMesh = meshMap[config.handleName];

        if (doorMesh) {
            const pivot = new THREE.Object3D();
            pivot.position.copy(config.pivot);
            scene.add(pivot);

            // Attach Pintu ke Pivot
            pivot.attach(doorMesh);

            // Attach Gagang ke Pivot (Jika ditemukan)
            if (handleMesh) {
                pivot.attach(handleMesh);
            }

            // Simpan sistem pintu ini ke array global
            doorSystems.push({
                id: config.doorName, // ID unik
                pivot: pivot, // Object yang akan diputar
                isOpen: false, // Status
                initialRot: pivot.rotation.y,
                targetRot: pivot.rotation.y,
                direction: config.direction, // Arah putar spesifik pintu ini
                meshes: [doorMesh, handleMesh], // Daftar mesh yang 'milik' pintu ini (untuk raycaster)
            });

            console.log(`Setup Door: ${config.doorName} Success`);
        } else {
            console.warn(
                `Pintu dengan nama ${config.doorName} tidak ditemukan di model!`
            );
        }
    });

    // 3. SETUP LIGHTS UNTUK OBJEK LAMPU
    const lampNames = [
        "lampu_depan1",
        "lampu_depan2",
        "lampu_dalem1A",
        "lampu_dalem1B",
        "lampu_dalem2",
        "lampu_KM_L",
        "lampu_KM_R"
    ];

    lampNames.forEach((name) => {
        const lampObject = model.getObjectByName(name);

        if (lampObject) {
            // Pasang PointLight
            const light = new THREE.PointLight(0xe3dac9, 10, 40, 1); // Warna emas, intensity 5, distance 20
            light.position.set(0, -1, 0); // Di tengah object
            lampObject.add(light);

            // Buat materialnya menyala (emissive)
            if (lampObject.isMesh) {
                lampObject.material = lampObject.material.clone();
                lampObject.material.emissive.set(0xe3dac9);
                lampObject.material.emissiveIntensity = 3;
            }

            console.log(`[LAMP] Light added to ${name}`);
        } else {
            console.warn(`[LAMP] Object ${name} not found!`);
        }
    });

    // 4. SETUP CERMIN (REFLECTOR) UNTUK OBJEK "Plane"
    const mirrorObj = model.getObjectByName("mirror");
    if (mirrorObj) {
        // Kita butuh geometry-nya
        const mirrorGeo = mirrorObj.geometry.clone(); // Clone biar aman

        // Buat Reflector
        mirror = new Reflector(mirrorGeo, {
            clipBias: 0.003,
            textureWidth: window.innerWidth * window.devicePixelRatio * 0.5,
            textureHeight: window.innerHeight * window.devicePixelRatio * 0.5,
            color: 0x777777
        });

        // Samakan transform (posisi, rotasi, scale) dengan objek asli
        mirror.position.copy(mirrorObj.position);
        mirror.rotation.copy(mirrorObj.rotation);

        // KOREKSI ARAH: User bilang muka cermin arah Z negatif.
        // Reflector Three.js biasanya menghadap Z positif. 
        // Jadi kita putar 180 derajat (PI) di sumbu Y agar pas.
        mirror.rotateY(Math.PI);

        mirror.scale.copy(mirrorObj.scale);

        // Jika objek asli ada di dalam parent (bukan langsung root model), kita harus attach ke parent yang sama
        // Tapi karena kita pakai `model.getObjectByName`, posisi relatifnya mungkin perlu diperhatikan.
        // Cara paling aman: masukkan mirror ke parent dari mirrorObj, lalu sembunyikan mirrorObj.

        if (mirrorObj.parent) {
            mirrorObj.parent.add(mirror);
        } else {
            // Kalau tidak punya parent (jarang terjadi di gltf loaded scene kecuali root), add ke model
            model.add(mirror);
        }

        // Sembunyikan objek asli (jangan dihapus biar tidak error kalau ada referensi lain)
        mirrorObj.visible = false;

        console.log("[MIRROR] Cermin berhasil dipasang pada 'Plane'");

    } else {
        console.warn("[MIRROR] Object 'Plane' tidak ditemukan!");
    }

    // 6. SETUP SWITCHES
    switchConfig.forEach((cfg) => {
        const switchObj = model.getObjectByName(cfg.switchName);
        if (switchObj) {
            // Find target lights
            const targets = [];
            cfg.targetLights.forEach((tName) => {
                const tObj = model.getObjectByName(tName);
                if (tObj) targets.push(tObj);
                else console.warn(`[SWITCH] Target light ${tName} not found!`);
            });

            if (targets.length > 0) {
                switchSystems.push({
                    switchMesh: switchObj,
                    targets: targets,
                    isOn: true // Default on
                });
                console.log(`[SWITCH] Setup ${cfg.switchName} -> ${cfg.targetLights.join(", ")}`);
            }
        } else {
            console.warn(`[SWITCH] Saklar ${cfg.switchName} tidak ditemukan!`);
        }
    });
});

// =======================================================
//  PHYSICS & MOVEMENT
// =======================================================
const clock = new THREE.Clock();
const moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
};
const velocity = new THREE.Vector3();
let verticalVelocity = 0;
let canJump = false;
const moveSpeed = 150;
const damping = 10;
const gravity = 30.0;
const jumpStrength = 15.0;
const playerHeight = 11;

const keyToState = {
    KeyW: "forward",
    ArrowUp: "forward",
    KeyS: "backward",
    ArrowDown: "backward",
    KeyA: "left",
    ArrowLeft: "left",
    KeyD: "right",
    ArrowRight: "right",
    Space: "jump",
};

window.addEventListener("keydown", (e) => {
    if (!e.repeat && keyToState[e.code]) moveState[keyToState[e.code]] = true;
});
window.addEventListener("keyup", (e) => {
    if (keyToState[e.code]) moveState[keyToState[e.code]] = false;
});

function updateCameraMovement(delta) {
    // ... Movement Logic (Standard) ...
    const lookDirection = new THREE.Vector3();
    camera.getWorldDirection(lookDirection);
    const flatForward = new THREE.Vector3(
        lookDirection.x,
        0,
        lookDirection.z
    ).normalize();
    const flatRight = new THREE.Vector3()
        .crossVectors(flatForward, camera.up)
        .normalize();

    const desired = new THREE.Vector3();
    if (moveState.forward) desired.add(flatForward);
    if (moveState.backward) desired.sub(flatForward);
    if (moveState.right) desired.add(flatRight);
    if (moveState.left) desired.sub(flatRight);
    if (desired.lengthSq() > 0) desired.normalize();

    velocity.x += desired.x * moveSpeed * delta;
    velocity.z += desired.z * moveSpeed * delta;
    velocity.x -= velocity.x * damping * delta;
    velocity.z -= velocity.z * damping * delta;

    // Collision
    const dist = Math.sqrt(velocity.x ** 2 + velocity.z ** 2) * delta;
    if (dist > 0) {
        const dir = new THREE.Vector3(velocity.x, 0, velocity.z).normalize();
        raycaster.set(camera.position, dir);
        const hit = raycaster.intersectObjects(collidableMeshList, true);
        if (hit.length > 0 && hit[0].distance < dist + 2) {
            velocity.x = 0;
            velocity.z = 0;
        }
    }
    camera.position.x += velocity.x * delta;
    camera.position.z += velocity.z * delta;

    // Gravity
    verticalVelocity -= gravity * delta;
    raycasterDown.set(camera.position, new THREE.Vector3(0, -1, 0));
    const floor = raycasterDown.intersectObjects(collidableMeshList, true);
    const ERROR = 0.3;
    if (floor.length > 0 && floor[0].distance < playerHeight) {
        if (verticalVelocity < 0) {
            verticalVelocity = 0;
            camera.position.y = floor[0].point.y - ERROR + playerHeight;
            canJump = true;
        }
    } else canJump = false;

    // CEILING COLLISION
    if (verticalVelocity > 0) {
        raycasterUp.set(camera.position, new THREE.Vector3(0, 1, 0));
        const ceiling = raycasterUp.intersectObjects(collidableMeshList, true);
        if (ceiling.length > 0 && ceiling[0].distance < 2) {
            verticalVelocity = 0;
        }
    }

    if (moveState.jump && canJump) {
        verticalVelocity = jumpStrength;
        canJump = false;
    }
    camera.position.y += verticalVelocity * delta;
    if (camera.position.y < -50) {
        verticalVelocity = 0;
        camera.position.set(0, 15, 0);
    }
}

// =======================================================
//  ANIMATE LOOP
// =======================================================
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (controls.isLocked) updateCameraMovement(delta);

    // --- MIRROR FRUSTUM CULLING CHECK ---
    if (mirror) {
        const frustum = new THREE.Frustum();
        const matrix = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(matrix);

        // Cek bounding sphere/box. Reflector punya geometry.
        if (!frustum.intersectsObject(mirror)) {
            mirror.visible = false;
        } else {
            mirror.visible = true;
        }
    }

    // --- INTERAKSI VISUAL (Nama Target) ---
    const lookDir = new THREE.Vector3();
    camera.getWorldDirection(lookDir);
    interactionRaycaster.set(camera.position, lookDir);
    const intersects = interactionRaycaster.intersectObjects(
        collidableMeshList,
        true
    );

    let targetText = "-";

    if (intersects.length > 0) {
        const hitObj = intersects[0].object;
        const hitDist = intersects[0].distance;

        // Cek apakah objek yang dilihat adalah bagian dari SALAH SATU sistem pintu
        const foundDoor = doorSystems.find((system) =>
            system.meshes.includes(hitObj)
        );

        // Cek apakah objek adalah saklar
        const foundSwitch = switchSystems.find((s) => s.switchMesh === hitObj);

        if (foundDoor && hitDist <= 6) {
            targetText = `[E] ${foundDoor.isOpen ? "Tutup" : "Buka"} ${foundDoor.id}`;
        } else if (foundSwitch && hitDist <= 6) {
            targetText = `[E] ${foundSwitch.isOn ? "Matikan" : "Nyalakan"} Lampu`;
        } else if (hitDist < 50) {
            targetText = hitObj.name;
        }
    }

    // --- ANIMASI SEMUA PINTU ---
    // Kita loop semua pintu yang ada di array dan update rotasinya masing-masing
    doorSystems.forEach((door) => {
        door.pivot.rotation.y = THREE.MathUtils.lerp(
            door.pivot.rotation.y,
            door.targetRot,
            5 * delta
        );
    });

    debugDiv.innerHTML = `
        <strong>FPS Mode</strong><br>
        X: ${camera.position.x.toFixed(2)}<br>
        Y: ${camera.position.y.toFixed(2)}<br>
        Z: ${camera.position.z.toFixed(2)}<br>
        Target: <span style="color: yellow;">${targetText}</span>
    `;

    renderer.render(scene, camera);
}
animate();

// =======================================================
//  INTERACTION EVENT (TOMBOL E)
// =======================================================
window.addEventListener("keydown", (e) => {
    if (e.code === "KeyE") {
        const lookDir = new THREE.Vector3();
        camera.getWorldDirection(lookDir);
        interactionRaycaster.set(camera.position, lookDir);
        const intersects = interactionRaycaster.intersectObjects(
            collidableMeshList,
            true
        );

        if (intersects.length > 0) {
            const hitObj = intersects[0].object;
            const hitDist = intersects[0].distance;

            if (hitDist <= 7.0) {
                // Cari pintu mana yang sedang dilihat
                const targetDoor = doorSystems.find((system) =>
                    system.meshes.includes(hitObj)
                );

                // Cari saklar
                const targetSwitch = switchSystems.find((s) => s.switchMesh === hitObj);

                if (targetDoor) {
                    // Toggle status pintu TERSEBUT
                    targetDoor.isOpen = !targetDoor.isOpen;

                    // Update Target Rotasi pintu TERSEBUT
                    if (targetDoor.isOpen) {
                        targetDoor.targetRot =
                            targetDoor.initialRot +
                            targetDoor.direction * (Math.PI / 2);
                    } else {
                        targetDoor.targetRot = targetDoor.initialRot;
                    }
                } else if (targetSwitch) {
                    // TOGGLE SWITCH
                    targetSwitch.isOn = !targetSwitch.isOn;
                    // Update Lights
                    targetSwitch.targets.forEach(t => {
                        // Jika target adalah Light (PointLight/SpotLight)
                        if (t.isLight) {
                            if (!t.userData.originalIntensity) t.userData.originalIntensity = t.intensity;

                            t.intensity = targetSwitch.isOn ? t.userData.originalIntensity : 0;
                            // Jangan ubah visible, biar shader tidak recompile
                        }
                        // Jika target adalah Mesh (ada material emissive)
                        if (t.isMesh) {
                            // Kita asumsi material sudah di-clone saat setup
                            if (targetSwitch.isOn) {
                                t.material.emissiveIntensity = 3; // Balikin ke terang
                            } else {
                                t.material.emissiveIntensity = 0; // Gelap
                            }
                        }

                        t.children.forEach(child => {
                            if (child.isLight) {
                                if (!child.userData.originalIntensity) child.userData.originalIntensity = child.intensity;
                                child.intensity = targetSwitch.isOn ? child.userData.originalIntensity : 0;
                            }
                        });
                    });
                }
            }
        }
    }
});

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
