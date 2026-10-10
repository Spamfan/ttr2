import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export const WEAPON_REGISTRY = [
  {
    id: 'peashooter',
    name: 'PEASHOOTER MK1',
    cost: 0,
    cooldown: 0.22,
    bulletSpeed: 52,
    damage: 25,
    color: 0xffee44,
    scale: 0.35,
    desc: 'Low damage. High emotional toll.'
  },
  {
    id: 'regret',
    name: 'TUBE OF REGRET',
    cost: 45,
    cooldown: 0.45,
    bulletSpeed: 64,
    damage: 60,
    color: 0xff4422,
    scale: 0.6,
    desc: 'Loud, crude, violates warranty.'
  },
  {
    id: 'noscoper',
    name: '360 NOSCOPER',
    cost: 150,
    cooldown: 0.12,
    bulletSpeed: 85,
    damage: 100,
    color: 0x33ffff,
    scale: 0.4,
    desc: 'Unethical rapid plasma dispersal.'
  }
];

export function initCombat(scene) {
  const projectiles = [];
  const targets = [];
  const scraps = [];

  // Low-poly target dummies (Halo CE style drones)
  const botMat = new THREE.MeshLambertMaterial({
    color: 0x8b3232,
    flatShading: true
  });
  const botGeo = new THREE.DodecahedronGeometry(1.4, 0);

  for (let i = 0; i < 8; i++) {
    const mesh = new THREE.Mesh(botGeo, botMat);
    mesh.castShadow = true;
    resetTarget(mesh);
    scene.add(mesh);
    targets.push({ mesh, hp: 60 });
  }

  return { projectiles, targets, scraps };
}

function resetTarget(mesh) {
  const angle = Math.random() * Math.PI * 2;
  const dist = 18 + Math.random() * 40;
  mesh.position.set(Math.cos(angle) * dist, 1.5, Math.sin(angle) * dist);
}

export function fireWeapon(scene, tank, weapon, combat) {
  tank.recoil = 1.0;

  const bulletMat = new THREE.MeshBasicMaterial({ color: weapon.color });
  const bulletGeo = new THREE.BoxGeometry(
    weapon.scale,
    weapon.scale,
    weapon.scale * 2.2
  );
  const mesh = new THREE.Mesh(bulletGeo, bulletMat);

  // Calculate tip of barrel
  const worldAim = tank.yaw + tank.turretRoot.rotation.y;
  mesh.position.copy(tank.position);
  mesh.position.y = 1.7;
  mesh.position.x += -Math.sin(worldAim) * 3.4;
  mesh.position.z += -Math.cos(worldAim) * 3.4;
  mesh.rotation.y = worldAim;

  scene.add(mesh);
  combat.projectiles.push({
    mesh,
    dir: new THREE.Vector3(-Math.sin(worldAim), 0, -Math.cos(worldAim)),
    speed: weapon.bulletSpeed,
    damage: weapon.damage,
    life: 2.5
  });
}

export function updateCombat(scene, player, combat, dt, onScrapCollected, onToast) {
  // Update Projectiles
  for (let i = combat.projectiles.length - 1; i >= 0; i--) {
    const p = combat.projectiles[i];
    p.life -= dt;
    p.mesh.position.addScaledVector(p.dir, p.speed * dt);

    let hit = false;
    for (const target of combat.targets) {
      if (target.mesh.position.distanceTo(p.mesh.position) < 2.2) {
        target.hp -= p.damage;
        hit = true;

        if (target.hp <= 0) {
          spawnScrap(scene, combat, target.mesh.position);
          resetTarget(target.mesh);
          target.hp = 60;
          onToast('DRONE DECONSTRUCTED. SALVAGE IT.');
        }
        break;
      }
    }

    if (hit || p.life <= 0) {
      scene.remove(p.mesh);
      combat.projectiles.splice(i, 1);
    }
  }

  // Update Scrap Pickups
  const scrapGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
  const scrapMat = new THREE.MeshBasicMaterial({ color: 0x66ff88 });

  for (let i = combat.scraps.length - 1; i >= 0; i--) {
    const s = combat.scraps[i];
    s.mesh.rotation.y += 3.0 * dt;

    // Vacuum towards player
    const dist = player.position.distanceTo(s.mesh.position);
    if (dist < 6.0) {
      const pull = new THREE.Vector3()
        .subVectors(player.position, s.mesh.position)
        .normalize();
      s.mesh.position.addScaledVector(pull, 14.0 * dt);
    }

    if (dist < 1.8) {
      scene.remove(s.mesh);
      combat.scraps.splice(i, 1);
      onScrapCollected(s.value);
    }
  }
}

function spawnScrap(scene, combat, pos) {
  const scrapMat = new THREE.MeshLambertMaterial({
    color: 0x55f26c,
    flatShading: true
  });
  const scrapGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);

  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(scrapGeo, scrapMat);
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 2,
      0.8,
      pos.z + (Math.random() - 0.5) * 2
    );
    scene.add(mesh);
    combat.scraps.push({ mesh, value: 10 });
  }
}