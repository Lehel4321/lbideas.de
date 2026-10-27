// Header scene: a 6-axis style robot doing pick and place with jerk-limited moves.
// Plain three.js, self-hosted. Loaded by index.html only when WebGL works.
import * as THREE from '/assets/vendor/three-0.160.1.module.min.js';

export function start(host) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = () => getComputedStyle(document.documentElement);
  const cssColor = name => new THREE.Color(css().getPropertyValue(name).trim() || '#888');

  // RENDERER / SCENE / CAMERA
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const target = new THREE.Vector3(0.1, 0.65, 0);

  scene.add(new THREE.HemisphereLight(0xdfe8ee, 0x30363b, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(3, 6, 2.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 15 });
  sun.shadow.radius = 4;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xffd29a, 0.8);
  rim.position.set(-4, 3, -3);
  scene.add(rim);

  // MATERIALS (accent follows the site theme)
  const mAccent = new THREE.MeshStandardMaterial({ color: cssColor('--accent'), metalness: 0.35, roughness: 0.42 });
  const mDark = new THREE.MeshStandardMaterial({ color: 0x2b3338, metalness: 0.6, roughness: 0.38 });
  const mSteel = new THREE.MeshStandardMaterial({ color: 0x9aa6ad, metalness: 0.85, roughness: 0.3 });
  const mBox = new THREE.MeshStandardMaterial({ color: 0xc8b48f, metalness: 0.0, roughness: 0.8 });
  const mStation = new THREE.MeshStandardMaterial({ color: 0x3a4349, metalness: 0.4, roughness: 0.55 });

  const mesh = (geo, mat, parent, pos, rot) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    if (pos) m.position.set(...pos);
    if (rot) m.rotation.set(...rot);
    parent.add(m);
    return m;
  };
  const along = Math.PI / 2;  // turn a Y-axis primitive onto X or Z

  // FLOOR: shadow catcher + polar grid
  const floor = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.ShadowMaterial({ opacity: 0.28 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  let grid;
  function makeGrid() {
    if (grid) { scene.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
    const c = cssColor('--line');
    grid = new THREE.PolarGridHelper(2.6, 16, 6, 64, c, c);
    grid.position.y = 0.002;
    scene.add(grid);
  }
  makeGrid();

  // ROBOT: base -> turret (J1) -> shoulder (J2) -> elbow (J3) -> wrist (J5) -> gripper
  const H0 = 0.78, L1 = 1.0, L2 = 0.92, LT = 0.31;
  const robot = new THREE.Group();
  scene.add(robot);
  mesh(new THREE.CylinderGeometry(0.4, 0.44, 0.16, 40), mDark, robot, [0, 0.08, 0]);
  const turret = new THREE.Group(); robot.add(turret);
  mesh(new THREE.CylinderGeometry(0.25, 0.31, 0.5, 40), mAccent, turret, [0, 0.41, 0]);
  mesh(new THREE.BoxGeometry(0.3, 0.26, 0.44), mAccent, turret, [0, H0 - 0.06, 0]);

  const shoulder = new THREE.Group(); shoulder.position.y = H0; turret.add(shoulder);
  mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.56, 32), mDark, shoulder, null, [along, 0, 0]);
  mesh(new THREE.CapsuleGeometry(0.13, L1 - 0.1, 8, 20), mAccent, shoulder, [L1 / 2, 0, 0.12], [0, 0, along]);

  const elbow = new THREE.Group(); elbow.position.x = L1; shoulder.add(elbow);
  mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.42, 32), mDark, elbow, null, [along, 0, 0]);
  mesh(new THREE.CapsuleGeometry(0.1, L2 - 0.12, 8, 20), mAccent, elbow, [L2 / 2, 0, -0.04], [0, 0, along]);

  const wrist = new THREE.Group(); wrist.position.x = L2; elbow.add(wrist);
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.26, 24), mDark, wrist, null, [along, 0, 0]);
  mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.08, 24), mSteel, wrist, [0.1, 0, 0], [0, 0, along]);
  mesh(new THREE.BoxGeometry(0.1, 0.12, 0.3), mDark, wrist, [0.17, 0, 0]);
  const fingers = [-1, 1].map(s => mesh(new THREE.BoxGeometry(0.17, 0.08, 0.035), mSteel, wrist, [0.3, 0, s * 0.16]));
  const tcp = new THREE.Object3D(); tcp.position.x = LT; wrist.add(tcp);

  // STATIONS AND BOX
  const BOX = 0.2, PED = 0.42;
  const stationAt = phi => ({ phi, r: 1.38, h: PED + BOX / 2 });
  const stations = [stationAt(THREE.MathUtils.degToRad(58)), stationAt(THREE.MathUtils.degToRad(-58))];
  const cyl = s => new THREE.Vector3(Math.cos(s.phi) * s.r, 0, -Math.sin(s.phi) * s.r);
  stations.forEach(s => {
    const p = cyl(s);
    mesh(new THREE.CylinderGeometry(0.2, 0.22, PED, 32), mStation, scene, [p.x, PED / 2, p.z]);
    mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 40), mAccent, scene, [p.x, PED + 0.002, p.z], [-Math.PI / 2, 0, 0]);
  });
  const box = mesh(new THREE.BoxGeometry(BOX, BOX, BOX), mBox, scene);
  const label = mesh(new THREE.PlaneGeometry(BOX * 0.62, BOX * 0.3), mAccent, box, [0, 0, BOX / 2 + 0.001]);
  label.castShadow = false;
  function placeBox(s) {
    scene.attach(box);
    const p = cyl(s);
    box.position.set(p.x, s.h, p.z);
    box.rotation.set(0, s.phi, 0);
  }

  // INVERSE KINEMATICS: gripper always points straight down
  function solve(phi, r, h) {
    turret.rotation.y = phi;
    const wx = r, wy = h + LT - H0;
    const d = Math.min(Math.hypot(wx, wy), L1 + L2 - 1e-3);
    const beta = Math.acos(THREE.MathUtils.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const gamma = Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    const a1 = Math.atan2(wy, wx) + beta;       // elbow up
    const a2 = -(Math.PI - gamma);
    shoulder.rotation.z = a1;
    elbow.rotation.z = a2;
    wrist.rotation.z = -Math.PI / 2 - (a1 + a2);
  }
  const setGrip = open => fingers.forEach((f, i) => { f.position.z = (i ? 1 : -1) * (BOX / 2 + 0.018 + open * 0.07); });

  // MOTION: S-curve (smootherstep) segments in cylindrical coordinates, like joint moves
  const ease = x => x * x * x * (x * (6 * x - 15) + 10);
  const UP = 0.42;
  let from = 0;  // station the box is on
  function plan() {
    const a = stations[from], b = stations[1 - from];
    const above = s => ({ phi: s.phi, r: s.r, h: s.h + UP });
    return [
      { kind: 'move', p: above(b), q: above(a), t: 1.5, lift: 0.18 },
      { kind: 'move', p: above(a), q: a, t: 0.65 },
      { kind: 'grip', open: [1, 0], t: 0.35, at: a, attach: true },
      { kind: 'move', p: a, q: above(a), t: 0.65 },
      { kind: 'move', p: above(a), q: above(b), t: 1.6, lift: 0.3 },
      { kind: 'move', p: above(b), q: b, t: 0.65 },
      { kind: 'grip', open: [0, 1], t: 0.35, at: b, release: true },
      { kind: 'move', p: b, q: above(b), t: 0.65 },
      { kind: 'wait', at: above(b), t: 0.5 },
    ];
  }
  let segs = plan(), seg = 0, segT = 0, gripOpen = 1;
  placeBox(stations[from]);

  function step(dt) {
    let s = segs[seg];
    segT += dt;
    while (segT >= s.t) {
      segT -= s.t;
      if (s.attach) tcp.attach(box);
      if (s.release) { placeBox(s.at); from = 1 - from; }
      seg++;
      if (seg >= segs.length) { segs = plan(); seg = 0; }
      s = segs[seg];
    }
    const u = ease(segT / s.t);
    if (s.kind === 'move') {
      const phi = s.p.phi + (s.q.phi - s.p.phi) * u;
      const r = s.p.r + (s.q.r - s.p.r) * u;
      const h = s.p.h + (s.q.h - s.p.h) * u + (s.lift || 0) * Math.sin(Math.PI * u);
      solve(phi, r, h);
    } else if (s.kind === 'grip') {
      solve(s.at.phi, s.at.r, s.at.h);
      gripOpen = s.open[0] + (s.open[1] - s.open[0]) * u;
    } else {
      solve(s.at.phi, s.at.r, s.at.h);
    }
    setGrip(gripOpen);
  }

  // TCP TRAIL
  const TRAIL = 140;
  const trailPos = new Float32Array(TRAIL * 3);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  const trailMat = new THREE.LineBasicMaterial({ color: mAccent.color, transparent: true, opacity: 0.55 });
  const trail = new THREE.Line(trailGeo, trailMat);
  trail.frustumCulled = false;
  scene.add(trail);
  const w = new THREE.Vector3();
  function pushTrail(fill) {
    tcp.getWorldPosition(w);
    if (fill) { for (let i = 0; i < TRAIL; i++) trailPos.set([w.x, w.y, w.z], i * 3); }
    else { trailPos.copyWithin(0, 3); trailPos.set([w.x, w.y, w.z], (TRAIL - 1) * 3); }
    trailGeo.attributes.position.needsUpdate = true;
  }

  // CAMERA: slow drift plus a little pointer parallax
  let px = 0, py = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', e => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });
  function placeCamera(t) {
    px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    const az = 0.32 + Math.sin(t * 0.12) * 0.22 + px * 0.25;
    const el = 0.4 + py * 0.06;
    const R = 5.9;
    camera.position.set(target.x + R * Math.cos(el) * Math.cos(az), target.y + R * Math.sin(el), target.z + R * Math.cos(el) * Math.sin(az));
    camera.lookAt(target);
  }

  // SIZE / THEME
  function resize() {
    const wpx = host.clientWidth, hpx = host.clientHeight;
    if (!wpx || !hpx) return;
    renderer.setSize(wpx, hpx, false);
    camera.aspect = wpx / hpx;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(host);
  resize();
  new MutationObserver(() => { mAccent.color.copy(cssColor('--accent')); makeGrid(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // LOOP: runs only while the header is on screen and the tab is visible
  const clock = new THREE.Clock();
  let t = 0, raf = 0, visible = true;
  step(0.8);
  pushTrail(true);
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    step(dt);
    pushTrail(false);
    placeCamera(t);
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
