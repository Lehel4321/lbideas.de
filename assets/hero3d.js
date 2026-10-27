// Header scene: a small machine line. An indexing conveyor carries parts under a
// servo-driven eccentric press; a photo-eye sees each part, a stack light shows
// the state. Plain three.js, self-hosted. Loaded by index.html only when WebGL works.
import * as THREE from '/assets/vendor/three-0.160.1.module.min.js';

export function start(host) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssColor = name => new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888');

  // RENDERER / SCENE / CAMERA
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const target = new THREE.Vector3(0.1, 0.95, 0);

  scene.add(new THREE.HemisphereLight(0xe2eaef, 0x2c3237, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(2.5, 6, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 16 });
  sun.shadow.radius = 4;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xffd29a, 0.7);
  rim.position.set(-4, 3, -3);
  scene.add(rim);

  // MATERIALS (accent follows the site theme)
  const mAccent = new THREE.MeshStandardMaterial({ color: cssColor('--accent'), metalness: 0.3, roughness: 0.45 });
  const mFrame = new THREE.MeshStandardMaterial({ color: 0x2f373c, metalness: 0.55, roughness: 0.4 });
  const mDark = new THREE.MeshStandardMaterial({ color: 0x1c2125, metalness: 0.4, roughness: 0.55 });
  const mBelt = new THREE.MeshStandardMaterial({ color: 0x15191c, metalness: 0.0, roughness: 0.9 });
  const mSteel = new THREE.MeshStandardMaterial({ color: 0xaab4ba, metalness: 0.9, roughness: 0.28 });
  const mPart = new THREE.MeshStandardMaterial({ color: 0xc3ccd1, metalness: 0.75, roughness: 0.35 });
  const mHole = new THREE.MeshStandardMaterial({ color: 0x0b0d0f, roughness: 1 });

  const mesh = (geo, mat, parent, pos, rot) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    parent.add(m);
    return m;
  };
  const Q = Math.PI / 2;

  // FLOOR: shadow catcher + grid
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.ShadowMaterial({ opacity: 0.28 }));
  floor.rotation.x = -Q;
  floor.receiveShadow = true;
  scene.add(floor);
  let grid;
  function makeGrid() {
    if (grid) { scene.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
    const c = cssColor('--line');
    grid = new THREE.GridHelper(8, 16, c, c);
    grid.position.y = 0.002;
    scene.add(grid);
  }
  makeGrid();

  // CONVEYOR along X: frame, legs, belt, end rollers, cleats
  const LEN = 4.8, BW = 0.72, TOP = 0.72, ROLL = 0.09;
  const conveyor = new THREE.Group(); scene.add(conveyor);
  [-1, 1].forEach(s => mesh(new THREE.BoxGeometry(LEN + 0.1, 0.16, 0.06), mFrame, conveyor, [0, TOP - 0.06, s * (BW / 2 + 0.05)]));
  for (const x of [-2.1, -0.9, 0.9, 2.1]) for (const s of [-1, 1])
    mesh(new THREE.BoxGeometry(0.07, TOP - 0.1, 0.07), mFrame, conveyor, [x, (TOP - 0.1) / 2, s * (BW / 2 + 0.05)]);
  mesh(new THREE.BoxGeometry(LEN, 0.02, BW), mBelt, conveyor, [0, TOP - 0.01, 0]);
  const rollers = [-1, 1].map(s => mesh(new THREE.CylinderGeometry(ROLL, ROLL, BW, 24), mSteel, conveyor, [s * LEN / 2, TOP - ROLL, 0], [Q, 0, 0]));
  const CLEAT = 0.4, cleats = [];
  for (let i = 0; i < LEN / CLEAT; i++) cleats.push(mesh(new THREE.BoxGeometry(0.025, 0.012, BW - 0.04), mDark, conveyor, [0, TOP + 0.006, 0]));
  // drive motor at the outfeed end
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.34, 28), mAccent, conveyor, [LEN / 2 - 0.15, TOP - 0.2, BW / 2 + 0.28], [Q, 0, 0]);
  mesh(new THREE.BoxGeometry(0.2, 0.2, 0.14), mFrame, conveyor, [LEN / 2 - 0.15, TOP - 0.2, BW / 2 + 0.1]);

  // PRESS PORTAL over x = 0: two columns, crown with servo motor, flywheel and crank
  const press = new THREE.Group(); scene.add(press);
  const CROWN = 1.92;
  [-1, 1].forEach(s => mesh(new THREE.BoxGeometry(0.16, CROWN + 0.2, 0.16), mFrame, press, [0, (CROWN + 0.2) / 2, s * 0.56]));
  mesh(new THREE.BoxGeometry(0.62, 0.42, 1.32), mFrame, press, [0, CROWN, 0]);
  mesh(new THREE.BoxGeometry(0.5, 0.06, 0.9), mDark, press, [0, TOP - 0.09, 0]);   // die plate under the belt
  mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.46, 32), mAccent, press, [0, CROWN + 0.02, -0.92], [Q, 0, 0]);  // servo motor
  mesh(new THREE.CylinderGeometry(0.155, 0.155, 0.05, 32), mDark, press, [0, CROWN + 0.02, -1.16], [Q, 0, 0]);
  [-1, 1].forEach(s => mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 12), mSteel, press, [s * 0.2, CROWN - 0.62, 0]));  // ram guides

  const CR = 0.17, ROD = 0.56, FZ = 0.7;    // crank radius, conrod length, flywheel plane (front)
  const crankC = new THREE.Vector3(0, CROWN, FZ);
  const flywheel = new THREE.Group(); flywheel.position.copy(crankC); press.add(flywheel);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 40), mAccent, flywheel, null, [Q, 0, 0]);
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 20), mSteel, flywheel, null, [Q, 0, 0]);
  const crankPin = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 16), mSteel, flywheel, [0, CR, 0.07], [Q, 0, 0]);
  const conrod = mesh(new THREE.BoxGeometry(0.06, ROD, 0.04), mSteel, press);
  const ram = new THREE.Group(); press.add(ram);
  mesh(new THREE.BoxGeometry(0.46, 0.26, 0.42), mDark, ram, [0, -0.13, 0]);
  mesh(new THREE.BoxGeometry(0.1, 0.1, FZ - 0.05), mDark, ram, [0, -0.06, (FZ - 0.05) / 2 + 0.1]);   // arm out to the crank plane
  mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 24), mSteel, ram, [0, -0.33, 0]);              // punch
  const PUNCH = 0.4;   // ram pin to punch tip

  // STACK LIGHT on the crown
  const lamp = (color, y) => {
    const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.05, roughness: 0.4, transparent: true, opacity: 0.92 });
    mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 20), m, press, [0.2, y, 0.5]);
    return m;
  };
  mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 10), mSteel, press, [0.2, CROWN + 0.27, 0.5]);
  const lGreen = lamp(0x2fbf5b, CROWN + 0.39), lAmber = lamp(0xf0a02c, CROWN + 0.51), lRed = lamp(0xd8423a, CROWN + 0.63);
  mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 20), mDark, press, [0.2, CROWN + 0.71, 0.5]);

  // PHOTO-EYE before the press: sensor, reflector, beam
  const EYE_X = -0.9, EYE_Y = TOP + 0.07;
  mesh(new THREE.BoxGeometry(0.08, 0.12, 0.08), mAccent, scene, [EYE_X, EYE_Y, BW / 2 + 0.12]);
  mesh(new THREE.BoxGeometry(0.07, 0.1, 0.03), mDark, scene, [EYE_X, EYE_Y, -BW / 2 - 0.1]);
  [1, -1].forEach(s => mesh(new THREE.BoxGeometry(0.03, EYE_Y, 0.03), mFrame, scene, [EYE_X, EYE_Y / 2, s * (BW / 2 + 0.11)]));
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.25 });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, BW + 0.2, 6), beamMat);
  beam.rotation.x = Q; beam.position.set(EYE_X, EYE_Y, 0.01);
  scene.add(beam);

  // PARTS: blanks ride the belt one pitch apart; the press punches a hole in each
  const PITCH = 0.8, NP = 6, PW = 0.34, PH = 0.1;
  const parts = [];
  for (let i = 0; i < NP; i++) {
    const g = new THREE.Group(); scene.add(g);
    mesh(new THREE.BoxGeometry(PW, PH, PW * 0.8), mPart, g, [0, PH / 2, 0]);
    const hole = mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.004, 24), mHole, g, [0, PH + 0.002, 0]);
    hole.visible = false;
    parts.push({ g, hole, x: -LEN / 2 + i * PITCH });
  }

  // CYCLE: index the belt one pitch (S-curve), then one full crank turn (S-curve)
  const T_INDEX = 0.75, T_PRESS = 1.05, T = T_INDEX + T_PRESS;
  const ease = x => x * x * x * (x * (6 * x - 15) + 10);
  let t = 0, belt = 0, beltPrev = 0, theta = 0, punched = false;

  function update(dt) {
    t += dt;
    const k = Math.floor(t / T), u = t - k * T;
    belt = k * PITCH + (u < T_INDEX ? PITCH * ease(u / T_INDEX) : PITCH);
    theta = u < T_INDEX ? 0 : 2 * Math.PI * ease((u - T_INDEX) / T_PRESS);
    if (u < T_INDEX) punched = false;

    const ds = belt - beltPrev; beltPrev = belt;
    // parts move with the belt, leave at the end and come back as fresh blanks
    let underEye = false;
    for (const p of parts) {
      p.x += ds;
      if (p.x > LEN / 2 + 0.05) { p.x -= NP * PITCH; p.hole.visible = false; }
      const edge = Math.min(1, (LEN / 2 + 0.05 - Math.abs(p.x)) / 0.35);
      p.g.scale.setScalar(Math.max(0.001, edge));
      p.g.position.set(p.x, TOP, 0);
      if (Math.abs(p.x - EYE_X) < PW / 2) underEye = true;
    }
    // crank -> conrod -> ram (eccentric press kinematics)
    flywheel.rotation.z = -theta;
    const pinX = crankC.x + CR * Math.sin(theta), pinY = crankC.y + CR * Math.cos(theta);
    const ramY = pinY - Math.sqrt(ROD * ROD - (pinX - crankC.x) ** 2);
    ram.position.set(0, ramY, 0);
    conrod.position.set((pinX + crankC.x) / 2, (pinY + ramY) / 2, FZ + 0.09);
    conrod.rotation.z = Math.atan2(pinX - crankC.x, pinY - ramY);
    // bottom dead centre: the punch has gone through the part under the press
    if (!punched && theta > Math.PI) {
      punched = true;
      const p = parts.find(q => Math.abs(q.x) < 0.1);
      if (p) p.hole.visible = true;
    }
    const tip = ramY - PUNCH;
    // belt details
    cleats.forEach((c, i) => {
      let x = ((i * CLEAT + belt) % LEN + LEN) % LEN - LEN / 2;
      c.position.x = x;
      c.visible = Math.abs(x) < LEN / 2 - 0.05;
    });
    rollers.forEach(r => { r.rotation.y = -belt / ROLL; });
    // signals
    beamMat.opacity = underEye ? 0.9 : 0.22;
    lGreen.emissiveIntensity = 1.6;
    lAmber.emissiveIntensity = tip < TOP + PH + 0.12 ? 1.8 : 0.05;
    lRed.emissiveIntensity = 0.05;
  }

  // CAMERA: slow drift plus a little pointer parallax
  let px = 0, py = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', e => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  function placeCamera(time) {
    px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    const az = 0.95 + Math.sin(time * 0.1) * 0.2 + px * 0.22;
    const el = 0.42 + py * 0.05;
    const R = 8.3;
    camera.position.set(target.x + R * Math.cos(el) * Math.cos(az), target.y + R * Math.sin(el), target.z + R * Math.cos(el) * Math.sin(az));
    camera.lookAt(target);
  }

  // SIZE / THEME
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();
  new MutationObserver(() => { mAccent.color.copy(cssColor('--accent')); makeGrid(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // LOOP: runs only while the header is on screen and the tab is visible
  const clock = new THREE.Clock();
  let time = 0, raf = 0, visible = true;
  update(T_INDEX + T_PRESS * 0.35);   // start mid-stroke so the still frame shows the press working
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    time += dt;
    update(dt);
    placeCamera(time);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function run() {
    cancelAnimationFrame(raf);
    if (visible && !document.hidden) { clock.getDelta(); raf = requestAnimationFrame(frame); }
  }
  placeCamera(0);
  renderer.render(scene, camera);
  host.classList.add('on');
  if (reduce) {
    window.addEventListener('resize', () => renderer.render(scene, camera));
    return;
  }
  new IntersectionObserver(e => { visible = e[0].isIntersecting; run(); }).observe(host);
  document.addEventListener('visibilitychange', run);
  run();
}
