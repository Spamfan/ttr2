import { initEngine } from './engine/renderer.js';
import { createTank, updateTank } from './game/tank.js';
import { initCombat, fireWeapon, updateCombat, WEAPON_REGISTRY } from './game/weapons.js';
import { initHUD } from './ui/hud.js';

let scrap = 0;
let currentWeapon = WEAPON_REGISTRY[0];
let fireTimer = 0;

const canvas = document.getElementById('game-canvas');
const { scene, camera, renderer } = initEngine(canvas);
const tank = createTank(scene);
const combat = initCombat(scene);

const hud = initHUD({
  getScrap: () => scrap,
  buyWeapon: (weaponDef) => {
    if (scrap >= weaponDef.cost) {
      scrap -= weaponDef.cost;
      currentWeapon = weaponDef;
      hud.updateScrapDisplay(scrap);
      hud.updateWeaponDisplay(currentWeapon.name);
      hud.showRadioToast(`MOUNTED ${currentWeapon.name}.`);
      return true;
    }
    return false;
  }
});

let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Update Tank kinematics
  updateTank(tank, hud.inputState, dt);

  // Camera follow behind tank
  const camDist = 18;
  const camHeight = 14;
  camera.position.x = tank.position.x;
  camera.position.y = tank.position.y + camHeight;
  camera.position.z = tank.position.z + camDist;
  camera.lookAt(tank.position.x, tank.position.y + 1.2, tank.position.z);

  // Weapon Firing
  fireTimer += dt;
  if (hud.inputState.fireRequested && fireTimer >= currentWeapon.cooldown) {
    fireTimer = 0;
    fireWeapon(scene, tank, currentWeapon, combat);
  }

  // Combat updates (Bullets, Drones, Scrap)
  updateCombat(
    scene,
    tank,
    combat,
    dt,
    (scrapGained) => {
      scrap += scrapGained;
      hud.updateScrapDisplay(scrap);
    },
    (toast) => {
      hud.showRadioToast(toast);
    }
  );

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
