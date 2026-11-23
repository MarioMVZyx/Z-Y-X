import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.getElementById("dragonCanvas");
const host = document.body;
const loading = document.getElementById("dragonLoading");

if (canvas && host) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(-0.38, 0.05, 9.8);

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
    const scale = 2.45 / largest;

    root.position.sub(center);
    root.scale.setScalar(scale);
    root.position.x += 0.18;
    root.position.y -= 0.12;
  }

  const loader = new GLTFLoader();
  loader.load(
    "./assets/models/black-dragon.glb?v=topmost-v4",
    gltf => {
      dragon = gltf.scene;
      dragon.rotation.set(0.05, -0.18, 0);

      const objectsToRemove = [];
      dragon.traverse(child => {
        const name = child.name || "";
        if (/^(Plane|Plane_Material)/i.test(name) || /\bplane\b/i.test(name)) {
          objectsToRemove.push(child);
        }
      });
      objectsToRemove.forEach(child => {
        child.visible = false;
        child.removeFromParent();
      });

      normalizeModel(dragon);
      scene.add(dragon);

      dragon.traverse(child => {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
        const coloredMaterials = sourceMaterials.map(source => {
          if (!source) return source;
          const material = source.clone();
          material.transparent = false;
          material.needsUpdate = true;
          if (/eye/i.test(child.name)) {
            material.color = new THREE.Color(0x00d5ff);
            material.emissive = new THREE.Color(0x00d5ff);
            material.emissiveIntensity = 2.8;
          } else {
            material.color = new THREE.Color(0xff3b20);
            material.emissive = new THREE.Color(0xff1600);
            material.emissiveIntensity = 1.65;
          }
          if ("metalness" in material) material.metalness = 0.22;
          if ("roughness" in material) material.roughness = 0.34;
          material.envMapIntensity = 1.15;
          return material;
        });
        child.material = Array.isArray(child.material) ? coloredMaterials : coloredMaterials[0];
      });

      mixer = new THREE.AnimationMixer(dragon);
      if (gltf.animations?.length) {
        const idle = gltf.animations.find(animation =>
          /idle|fly|breath|wait/i.test(animation.name)
        ) || gltf.animations[0];
        const filteredClip = idle.clone();
        filteredClip.tracks = filteredClip.tracks.filter(track =>
          !/(^|[._-])(Plane)([._-]|$)/i.test(track.name)
        );
        activeAction = mixer.clipAction(filteredClip);
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
    { id: "inicio", x: 0.84, y: 0.25, scale: 0.72 },
    { id: "finanzas", x: 0.88, y: 0.31, scale: 0.58 },
    { id: "tecnologia", x: 0.12, y: 0.31, scale: 0.60 },
    { id: "humanos", x: 0.88, y: 0.29, scale: 0.58 },
    { id: "riesgos", x: 0.12, y: 0.35, scale: 0.60 },
    { id: "decision", x: 0.88, y: 0.25, scale: 0.62 },
    { id: "evidencias", x: 0.12, y: 0.23, scale: 0.54 }
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
      const canvasWidth = mobile ? 210 : Math.min(viewportWidth * 0.24, 300);
      const canvasHeight = canvasWidth;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      const routeScale = activeRoute.scale;
      const routeX = mobile
        ? activeRoute.x * viewportWidth - canvasWidth * 0.52
        : activeRoute.x * viewportWidth - canvasWidth * 0.5;
      const routeY = activeRoute.y * viewportHeight - canvasHeight * (mobile ? 0.46 : 0.42);
      const flightRadiusX = mobile ? 18 : 34;
      const flightRadiusY = mobile ? 14 : 20;
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
