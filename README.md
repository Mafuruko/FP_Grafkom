# FP_Grafkom
Tugas Final Project membuat Kamar Mandi Informatika Cantik dengan three.js
# Kelompok 3
- Muhammad Naufal Dzakwan	5025231234
- Izan Nafis Rahman	5025231298
- Sebastian Vahenta Setjo	5025231294
- Muhammad Rafi Budiman	5025231297
- Sayyid Daffa ' Al Mubarok	5025231095

---

# 🎉 Three.js Starter Project

A simple starter template for learning and experimenting with **Three.js**.
This guide helps you (or your friends) understand **how to install**, **how to run**, and **how to start building** with Three.js using two methods:

### ✅ Method A — CDN + Live Server (easy, no install)

### ✅ Method B — NPM + Vite (recommended modern setup)

---

## 🔧 Requirements

Before starting, install:

* **Node.js** → [https://nodejs.org](https://nodejs.org)
  Check:

  ```bash
  node -v
  npm -v
  ```
* **VS Code (recommended)**
* **Live Server extension** (if using CDN method)

---

# 🚀 Method A — Use Three.js via CDN (EASIEST)

This is the simplest way to try Three.js.

### 1️⃣ Open the project folder in VS Code

Ensure you have:

```
index.html
script.js
```

### 2️⃣ Use CDN import inside `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Three.js Starter</title>
    <style>
      body { margin: 0; overflow: hidden; }
    </style>
  </head>
  <body>
    <script type="module">
      import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
      import "./script.js";
    </script>
  </body>
</html>
```

### 3️⃣ Run the project

Right-click `index.html` → **Open with Live Server**
Or use any static server:

```bash
npx http-server .
```

✔ Your Three.js scene should appear (rotating cube).

---

# 🚀 Method B — NPM + Vite (Recommended)

Use this if you want a real development workflow.

## 1️⃣ Install dependencies

Inside the project folder:

```bash
npm install
npm install vite --save-dev
npm install three
```

## 2️⃣ Add Vite dev script

In `package.json`, add:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

## 3️⃣ Use module script in `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Three.js + Vite</title>
    <style>
      body { margin: 0; overflow: hidden; }
    </style>
  </head>
  <body>
    <script type="module" src="/script.js"></script>
  </body>
</html>
```

## 4️⃣ Example `script.js`

```js
import * as THREE from "three";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);

scene.add(cube);

function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();
```

## 5️⃣ Start the server

```bash
npm run dev
```

Open the link Vite gives you, usually:

```
http://localhost:5173
```

---

# ❗ Common Issues & Fixes

### **White screen / nothing loads**

Check console (`F12`):

* `Failed to resolve module specifier "three"`
  → You're opening via `file://`. Use Vite or Live Server.

* `Cannot use import statement outside a module`
  → Ensure `<script type="module">` is used.

### **Black screen**

* Camera may be inside object
* No light (if using MeshStandardMaterial)
* Renderer canvas not attached

### **Assets not loading**

* Must use a local server (not `file://`)
* Check path (Three.js loaders use relative paths)

---

# 📁 Project Structure (Recommended)

```
project/
│── index.html
│── script.js
│── package.json
│── node_modules/
│── README.md
```

---

# 📚 Learn More

Search these resources:

* Three.js Official Documentation
* Three.js Journey (Bruno Simon)
* Three.js Examples Library
* Vite Documentation

