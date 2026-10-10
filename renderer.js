import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function initEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance'
  });

  // Low-end mobile throttle: clamp pixel density
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a261a);
  scene.fog = new THREE.Fog(0x1a261a, 40, 110);

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.5,
    200
  );

  // Halo CE Directional Sun + Cool Fill
  const sunLight = new THREE.DirectionalLight(0xfff3d6, 1.6);
  sunLight.position.set(40, 60, 30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 150;
  const d = 45;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0x425244, 1.2);
  scene.add(ambientLight);

  buildArena(scene);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

function buildArena(scene) {
  // Low-poly desert/canyon floor
  const groundGeo = new THREE.PlaneGeometry(160, 160, 16, 16);
  const groundMat = new THREE.MeshLambertMaterial({
    color: 0x3d4734,
    flatShading: true
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Tactical Arena Wall Blocks
  const wallMat = new THREE.MeshLambertMaterial({
    color: 0x222c20,
    flatShading: true
  });
  const wallGeo = new THREE.BoxGeometry(4, 4, 4);

  for (let i = -70; i <= 70; i += 10) {
    [-70, 70].forEach((z) => {
      const blockA = new THREE.Mesh(wallGeo, wallMat);
      blockA.position.set(i, 2, z);
      blockA.castShadow = true;
      scene.add(blockA);

      const blockB = new THREE.Mesh(wallGeo, wallMat);
      blockB.position.set(z, 2, i);
      blockB.castShadow = true;
      scene.add(blockB);
    });
  }

  // Scattered Low-Poly Bunkers
  const bunkerGeo = new THREE.BoxGeometry(8, 3, 8);
  const bunkerPositions = [
    [-20, 1.5, -20],
    [25, 1.5, -15],
    [-25, 1.5, 25],
    [20, 1.5, 20]
  ];

  bunkerPositions.forEach(([x, y, z]) => {
    const bunker = new THREE.Mesh(bunkerGeo, wallMat);
    bunker.position.set(x, y, z);
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    scene.add(bunker);
  });
}