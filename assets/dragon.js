import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.getElementById("dragonCanvas");
const host = document.body;
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
  let activeAction = null;
  let dragon = null;
  let targetRotationX = 0;
  let targetRotationY = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragRotationX = 0;
  let dragRotationY = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
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
        if (
          /^(Plane|Plane_Material)/i.test(child.name) ||
          /plane/i.test(child.parent?.name || "") ||
          /plane/i.test(child.name)
        ) {
          child.visible = false;
          return;
        }
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(material => {
          if (!material) return;
          material.transparent = material.opacity < 1;
          material.needsUpdate = true;
          if (material.color) material.color.multiplyScalar(0.78);
          if ("emissive" in material) {
            material.emissive = new THREE.Color(0x176f9a);
            material.emissiveIntensity = 0.95;
          }
          if ("metalness" in material) material.metalness = Math.max(material.metalness || 0, 0.28);
          if ("roughness" in material) material.roughness = Math.min(material.roughness || 0.6, 0.48);
          material.envMapIntensity = 0.75;
        });
      });

      mixer = new THREE.AnimationMixer(dragon);
      if (gltf.animations?.length) {
        const idle = gltf.animations.find(animation =>
          /idle|fly|breath|wait/i.test(animation.name)
        ) || gltf.animations[0];
        activeAction = mixer.clipAction(idle);
        activeAction.reset();
        activeAction.setEffectiveTimeScale(reducedMotion ? 0 : 1.45);
        activeAction.play();
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

  window.addEventListener("pointermove", event => {
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

  window.addEventListener("pointerleave", () => {
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
  const flightRoutes = [
    { id: "inicio", x: 0.72, y: 0.23, scale: 0.88 },
    { id: "finanzas", x: 0.82, y: 0.30, scale: 0.68 },
    { id: "tecnologia", x: 0.20, y: 0.30, scale: 0.72 },
    { id: "humanos", x: 0.82, y: 0.28, scale: 0.70 },
    { id: "riesgos", x: 0.20, y: 0.34, scale: 0.72 },
    { id: "decision", x: 0.82, y: 0.24, scale: 0.78 },
    { id: "evidencias", x: 0.18, y: 0.22, scale: 0.64 }
  ];
  let activeRoute = flightRoutes[0];
  let flightX = window.innerWidth * activeRoute.x;
  let flightY = window.innerHeight * activeRoute.y;
  let wingBoost = 0;
  let sectionChangeTime = 0;

  function setRoute(id) {
    const route = flightRoutes.find(item => item.id === id);
    if (!route) return;
    activeRoute = route;
    wingBoost = 1;
    sectionChangeTime = clock.elapsedTime;
  }

  window.addEventListener("zyx-section-change", event => setRoute(event.detail.id));
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => setRoute(link.dataset.target));
  });

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

    if (!reducedMotion) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const mobile = viewportWidth <= 760;
      const canvasWidth = mobile ? 230 : Math.min(viewportWidth * 0.34, 410);
      const canvasHeight = canvasWidth;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      const routeScale = activeRoute.scale;
      const routeX = mobile
        ? activeRoute.x * viewportWidth - canvasWidth * 0.52
        : activeRoute.x * viewportWidth - canvasWidth * 0.5;
      const routeY = activeRoute.y * viewportHeight - canvasHeight * (mobile ? 0.46 : 0.42);
      const flightRadiusX = mobile ? 32 : 68;
      const flightRadiusY = mobile ? 24 : 38;
      const elapsed = clock.elapsedTime;
      const flutterX = Math.sin(elapsed * (wingBoost ? 0.92 : 0.42)) * flightRadiusX;
      const flutterY = Math.cos(elapsed * (wingBoost ? 1.18 : 0.72)) * flightRadiusY;

      flightX += (routeX - flightX) * 0.025;
      flightY += (routeY - flightY) * 0.025;
      canvas.style.left = `${flightX + flutterX}px`;
      canvas.style.top = `${flightY + flutterY}px`;
      canvas.style.transform = `scale(${routeScale}) rotateZ(${Math.sin(elapsed * 0.55) * 2}deg)`;

      if (elapsed - sectionChangeTime > 3.5) wingBoost = 0;

      if (activeAction && wingBoost) activeAction.setEffectiveTimeScale(2.25);
      else if (activeAction) activeAction.setEffectiveTimeScale(reducedMotion ? 0 : 1.45);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize);
  animate();
}
