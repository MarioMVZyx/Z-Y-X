import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.getElementById("dragonCanvas");
const host = document.querySelector(".cover-object");
const loading = document.getElementById("dragonLoading");

if (canvas && host) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.15, 7.2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  scene.add(new THREE.HemisphereLight(0x9edfff, 0x080b10, 1.7));

  const keyLight = new THREE.DirectionalLight(0x00d5ff, 4.2);
  keyLight.position.set(-3.5, 4.5, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x318bff, 3.4);
  rimLight.position.set(4, 1, -4);
  scene.add(rimLight);

  const fillLight = new THREE.PointLight(0x94eaff, 12, 12);
  fillLight.position.set(0, -2.5, 3);
  scene.add(fillLight);

  let mixer = null;
  let dragon = null;
  let targetRotationX = 0;
  let targetRotationY = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragRotationX = 0;
  let dragRotationY = 0;

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function normalizeModel(root) {
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const largest = Math.max(size.x, size.y, size.z);
    const scale = 4.35 / largest;

    root.position.sub(center);
    root.scale.setScalar(scale);
    root.position.y -= 0.12;
  }

  const loader = new GLTFLoader();
  loader.load(
    "./assets/models/black-dragon.glb",
    gltf => {
      dragon = gltf.scene;
      dragon.rotation.set(0.05, -0.18, 0);
      normalizeModel(dragon);
      scene.add(dragon);

      dragon.traverse(child => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          if (!material) return;
          material.transparent = material.opacity < 1;
          material.needsUpdate = true;
          if (material.color) material.color.multiplyScalar(0.78);
          material.envMapIntensity = 0.4;
        });
      });

      mixer = new THREE.AnimationMixer(dragon);
      if (gltf.animations?.length) {
        const idle = gltf.animations.find(animation =>
          /idle|fly|breath|wait/i.test(animation.name)
        ) || gltf.animations[0];
        mixer.clipAction(idle).reset().play();
      }

      loading?.classList.add("loaded");
    },
    undefined,
    () => {
      if (loading) {
        loading.textContent = "Modelo no disponible";
      }
    }
  );

  host.addEventListener("pointermove", event => {
    if (dragging) {
      const dx = event.clientX - dragStartX;
      const dy = event.clientY - dragStartY;
      targetRotationY = dragRotationY + dx * 0.006;
      targetRotationX = dragRotationX + dy * 0.004;
      return;
    }
    if (window.matchMedia("(pointer:fine)").matches) {
      const rect = host.getBoundingClientRect();
      targetRotationY = ((event.clientX - rect.left) / rect.width - 0.5) * 0.32;
      targetRotationX = ((event.clientY - rect.top) / rect.height - 0.5) * -0.18;
    }
  });

  host.addEventListener("pointerleave", () => {
    if (!dragging) {
      targetRotationX = 0;
      targetRotationY = 0;
    }
  });

  canvas.addEventListener("pointerdown", event => {
    dragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragRotationX = targetRotationX;
    dragRotationY = targetRotationY;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointerup", event => {
    dragging = false;
    canvas.releasePointerCapture(event.pointerId);
  });

  const clock = new THREE.Clock();
  function animate() {
    const delta = Math.min(clock.getDelta(), 0.05);
    mixer?.update(reducedMotion ? 0 : delta);

    if (dragon) {
      dragon.rotation.x += (targetRotationX - dragon.rotation.x) * 0.055;
      dragon.rotation.y += (targetRotationY - 0.18 - dragon.rotation.y) * 0.055;
      if (!reducedMotion && !dragging) {
        dragon.position.y = -0.12 + Math.sin(clock.elapsedTime * 1.15) * 0.08;
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize);
  animate();
}
