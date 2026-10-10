import { WEAPON_REGISTRY } from '../game/weapons.js';

export function initHUD(callbacks) {
  const inputState = {
    move: { x: 0, y: 0 },
    aimAngle: null,
    fireRequested: false
  };

  const keys = {};
  const scrapCountEl = document.getElementById('scrap-count');
  const weaponNameEl = document.getElementById('weapon-name');
  const radioTextEl = document.getElementById('radio-text');
  const shopModal = document.getElementById('shop-modal');
  const shopList = document.getElementById('shop-inventory');

  // Snarky radio log ticker
  const QUIPS = [
    'HQ: Ammo bills are deducted from your pension.',
    'WARNING: Friendly fire is currently hilarious.',
    'DISPATCH: Try driving with your eyes open.',
    'INTEL: Enemy armor made of recycled cardboard.',
    'TACTICAL: Standing still makes you a decorative vase.'
  ];

  setInterval(() => {
    const quip = QUIPS[Math.floor(Math.random() * QUIPS.length)];
    radioTextEl.textContent = quip;
  }, 12000);

  // Keyboard controls (Desktop)
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    updateKeyMove();
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    updateKeyMove();
  });

  function updateKeyMove() {
    let mx = 0;
    let my = 0;
    if (keys['a'] || keys['arrowleft']) mx -= 1;
    if (keys['d'] || keys['arrowright']) mx += 1;
    if (keys['w'] || keys['arrowup']) my -= 1;
    if (keys['s'] || keys['arrowdown']) my += 1;
    inputState.move.x = mx;
    inputState.move.y = my;
  }

  // Mouse controls (Desktop Aiming & Shooting)
  window.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // Map screen plane angle to 3D yaw
    inputState.aimAngle = Math.atan2(-dx, -dy);
  });

  window.addEventListener('mousedown', (e) => {
    if (e.target.tagName !== 'BUTTON') {
      inputState.fireRequested = true;
    }
  });

  window.addEventListener('mouseup', () => {
    inputState.fireRequested = false;
  });

  // Touch Controls (Mobile Dual Joysticks)
  setupTouchStick('stick-move-zone', 'stick-move-base', 'stick-move-knob', (vec) => {
    inputState.move.x = vec.x;
    inputState.move.y = vec.y;
  });

  setupTouchStick('stick-aim-zone', 'stick-aim-base', 'stick-aim-knob', (vec, active) => {
    if (active && (Math.abs(vec.x) > 0.1 || Math.abs(vec.y) > 0.1)) {
      inputState.aimAngle = Math.atan2(-vec.x, -vec.y);
      inputState.fireRequested = true;
    } else {
      inputState.fireRequested = false;
    }
  });

  // Armory Shop Toggle
  document.getElementById('shop-toggle-btn').addEventListener('click', () => {
    shopModal.classList.remove('modal-hidden');
    renderShop();
  });

  document.getElementById('shop-close-btn').addEventListener('click', () => {
    shopModal.classList.add('modal-hidden');
  });

  function renderShop() {
    shopList.innerHTML = '';
    const currentScrap = callbacks.getScrap();

    WEAPON_REGISTRY.forEach((w) => {
      const row = document.createElement('div');
      row.className = 'shop-item';
      row.innerHTML = `
        <div>
          <strong>${w.name}</strong> - <span>${w.cost} SCRAP</span>
          <div class="item-desc">${w.desc}</div>
        </div>
      `;
      const buyBtn = document.createElement('button');
      buyBtn.className = 'hud-btn';
      buyBtn.textContent = 'BUY';
      buyBtn.disabled = currentScrap < w.cost;
      buyBtn.addEventListener('click', () => {
        if (callbacks.buyWeapon(w)) {
          shopModal.classList.add('modal-hidden');
        }
      });
      row.appendChild(buyBtn);
      shopList.appendChild(row);
    });
  }

  return {
    inputState,
    updateScrapDisplay: (val) => {
      scrapCountEl.textContent = String(val).padStart(4, '0');
    },
    updateWeaponDisplay: (name) => {
      weaponNameEl.textContent = name;
    },
    showRadioToast: (msg) => {
      radioTextEl.textContent = msg;
    }
  };
}

function setupTouchStick(zoneId, baseId, knobId, onMove) {
  const zone = document.getElementById(zoneId);
  const base = document.getElementById(baseId);
  const knob = document.getElementById(knobId);

  let touchId = null;
  let origin = { x: 0, y: 0 };
  const RADIUS = 40;

  zone.addEventListener('touchstart', (e) => {
    if (touchId !== null) return;
    const t = e.changedTouches[0];
    touchId = t.identifier;
    origin = { x: t.clientX, y: t.clientY };

    base.style.left = `${origin.x}px`;
    base.style.top = `${origin.y}px`;
    base.style.display = 'block';
    knob.style.transform = 'translate(0px, 0px)';
  });

  zone.addEventListener('touchmove', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchId) {
        const dx = t.clientX - origin.x;
        const dy = t.clientY - origin.y;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, RADIUS);
        const angle = Math.atan2(dy, dx);

        const kx = Math.cos(angle) * clampedDist;
        const ky = Math.sin(angle) * clampedDist;
        knob.style.transform = `translate(${kx}px, ${ky}px)`;

        onMove({ x: kx / RADIUS, y: ky / RADIUS }, true);
      }
    }
  });

  const resetStick = (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchId) {
        touchId = null;
        base.style.display = 'none';
        onMove({ x: 0, y: 0 }, false);
      }
    }
  };

  zone.addEventListener('touchend', resetStick);
  zone.addEventListener('touchcancel', resetStick);
}