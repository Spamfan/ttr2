import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export function createTank(scene) {
  const root = new THREE.Group();

  // Army Olive & Dark Poly Finishes
  const hullMat = new THREE.MeshLambertMaterial({
    color: 0x4a5d3b,
    flatShading: true
  });
  const treadMat = new THREE.MeshLambertMaterial({
    color: 0x1f231e,
    flatShading: true
  });
  const accentMat = new THREE.MeshLambertMaterial({
    color: 0x82944b,
    flatShading: true
  });

  // Chassis
  const hullGeo = new THREE.BoxGeometry(3.2, 1.0, 4.4);
  const hull = new THREE.Mesh(hullGeo, hullMat);
  hull.position.y = 0.9;
  hull.castShadow = true;
  root.add(hull);

  // Left & Right Treads
  const treadGeo = new THREE.BoxGeometry(0.8, 0.9, 4.8);
  const leftTread = new THREE.Mesh(treadGeo, treadMat);
  leftTread.position.set(-1.8, 0.65, 0);
  leftTread.castShadow = true;
  root.add(leftTread);

  const rightTread = new THREE.Mesh(treadGeo, treadMat);
  rightTread.position.set(1.8, 0.65, 0);
  rightTread.castShadow = true;
  root.add(rightTread);

  // Turret Base
  const turretRoot = new THREE.Group();
  turretRoot.position.set(0, 1.5, 0);

  const turretGeo = new THREE.BoxGeometry(2.0, 0.8, 2.4);
  const turret = new THREE.Mesh(turretGeo, accentMat);
  turret.position.set(0, 0.2, -0.2);
  turret.castShadow = true;
  turretRoot.add(turret);

  // Gun Barrel
  const barrelGeo = new THREE.CylinderGeometry(0.2, 0.25, 3.2, 8);
  barrelGeo.rotateX(Math.PI / 2);
  const barrel = new THREE.Mesh(barrelGeo, treadMat);
  barrel.position.set(0, 0.2, 1.6);
  barrel.castShadow = true;
  turretRoot.add(barrel);

  root.add(turretRoot);
  scene.add(root);

  return {
    root,
    turretRoot,
    barrel,
    position: root.position,
    yaw: 0,
    speed: 0,
    recoil: 0
  };
}

export function updateTank(tank, input, dt) {
  const ACCEL = 16.0;
  const ROT_SPEED = 3.2;
  const FRICTION = 8.0;

  // Steering
  if (input.move.x !== 0) {
    tank.yaw -= input.move.x * ROT_SPEED * dt;
  }
  tank.root.rotation.y = tank.yaw;

  // Drive forward/reverse
  const targetSpeed = -input.move.y * 14.0;
  if (Math.abs(targetSpeed) > 0.1) {
    tank.speed += (targetSpeed - tank.speed) * Math.min(ACCEL * dt, 1.0);
  } else {
    tank.speed -= tank.speed * Math.min(FRICTION * dt, 1.0);
  }

  const forwardX = -Math.sin(tank.yaw);
  const forwardZ = -Math.cos(tank.yaw);

  tank.position.x += forwardX * tank.speed * dt;
  tank.position.z += forwardZ * tank.speed * dt;

  // Arena bounds restraint
  tank.position.x = Math.max(-65, Math.min(65, tank.position.x));
  tank.position.z = Math.max(-65, Math.min(65, tank.position.z));

  // Turret Aiming
  if (input.aimAngle !== null) {
    tank.turretRoot.rotation.y = input.aimAngle - tank.yaw;
  }

  // Recoil recovery
  if (tank.recoil > 0) {
    tank.recoil = Math.max(0, tank.recoil - dt * 6.0);
    tank.barrel.position.z = 1.6 - tank.recoil * 0.4;
  }
}