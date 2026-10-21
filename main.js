/* Lucas Zhang: a brain in pieces.
   Reads window.SITE (pieces.js) and assets/brain.{json,bin} (build_assets.py). Three.js r128. */
(() => {
'use strict';
const S = window.SITE;
const $ = (s, el = document) => el.querySelector(s);
const stage = $('#stage'), canvas = $('#brain');
const el = {
  loading: $('#loading'), counter: $('#counter'), caption: $('#caption'), hint: $('#hint'), labels: $('#labels'),
  float: $('#floatlabel'), tip: $('#regiontip'), views: $('#views'), card: $('#card'), cardClose: $('#card-close'),
  kicker: $('#card-kicker'), title: $('#card-title'), body: $('#card-body'), status: $('#card-status'),
  signal: $('#card-signal'), signalLabel: $('#card-signal-label'), links: $('#card-links'),
  pieceList: $('#piece-list'), missingList: $('#missing-list')
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

const PAPER = 0xEDEFE8, INK = 0x1F231F, NEUTRAL = 0xCDD1C6, ACCENT = 0xC4573A;
const srgb = hex => new THREE.Color(hex).convertSRGBToLinear();
const NAMES = { bankssts: 'Banks of the superior temporal sulcus', caudalanteriorcingulate: 'Caudal anterior cingulate', caudalmiddlefrontal: 'Caudal middle frontal', cuneus: 'Cuneus', entorhinal: 'Entorhinal', fusiform: 'Fusiform', inferiorparietal: 'Inferior parietal', inferiortemporal: 'Inferior temporal', isthmuscingulate: 'Isthmus cingulate', lateraloccipital: 'Lateral occipital', lateralorbitofrontal: 'Lateral orbitofrontal', lingual: 'Lingual', medialorbitofrontal: 'Medial orbitofrontal', middletemporal: 'Middle temporal', parahippocampal: 'Parahippocampal', paracentral: 'Paracentral', parsopercularis: 'Pars opercularis', parsorbitalis: 'Pars orbitalis', parstriangularis: 'Pars triangularis', pericalcarine: 'Pericalcarine', postcentral: 'Postcentral', posteriorcingulate: 'Posterior cingulate', precentral: 'Precentral', precuneus: 'Precuneus', rostralanteriorcingulate: 'Rostral anterior cingulate', rostralmiddlefrontal: 'Rostral middle frontal', superiorfrontal: 'Superior frontal', superiorparietal: 'Superior parietal', superiortemporal: 'Superior temporal', supramarginal: 'Supramarginal', frontalpole: 'Frontal pole', temporalpole: 'Temporal pole', transversetemporal: 'Transverse temporal', insula: 'Insula', medialwall: 'Medial wall' };
const prettyRegion = name => { const [h, r] = name.split('-'); return (h === 'lh' ? 'Left ' : 'Right ') + (NAMES[r] || r).toLowerCase(); };

// ---------- contact links + lists (single source: pieces.js) ----------
$('#mail-link').href = 'mailto:' + S.email; $('#mail-link').textContent = S.email;
$('#github-link').href = S.github;
const items = [];
S.projects.forEach((p, i) => items.push({ ...p, kind: 'project', index: i, pieces: [] }));
S.missing.forEach((m, i) => items.push({ ...m, kind: 'missing', index: S.projects.length + i, pieces: [] }));
const byKey = new Map(items.map(it => [it.key, it]));

function li(it) {
  const node = document.createElement('li'); node.dataset.key = it.key;
  const chip = `<span class="chip ${it.kind === 'missing' ? 'hollow' : ''}" style="${it.kind === 'project' ? 'background:' + it.color : ''}"></span>`;
  const year = `<span class="year">${it.kind === 'project' ? it.year : '?'}</span>`;
  const links = it.links && it.links.length ? `<p class="l">${it.links.map(l => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join('')}</p>` : '';
  const text = it.kind === 'project' ? it.blurb.split(/(?<=\.)\s/)[0] : it.question;
  node.innerHTML = `${chip}${year}<div><div class="t">${it.title}</div><p class="d">${text}</p>${links}</div>`;
  node.addEventListener('mouseenter', () => { if (!coarse) hover(it, 'list'); });
  node.addEventListener('mouseleave', () => { if (!coarse) hover(null, 'list'); });
  node.addEventListener('click', e => { if (e.target.closest('a')) return; select(it); stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); });
  return node;
}
items.filter(i => i.kind === 'project').forEach(it => el.pieceList.appendChild(li(it)));
items.filter(i => i.kind === 'missing').forEach(it => el.missingList.appendChild(li(it)));

// ---------- renderer / scene ----------
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { el.loading.textContent = 'This browser cannot draw the brain (no WebGL). The pieces are listed below.'; return; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
scene.add(camera);
scene.add(new THREE.HemisphereLight(0xfff8ee, 0xc9cfc6, 0.56));
const lamp = (c, i, x, y, z) => { const l = new THREE.DirectionalLight(c, i); l.position.set(x, y, z); camera.add(l); return l; };
lamp(0xfff4e6, 0.62, -5, 4.5, 1.5); lamp(0xffffff, 0.30, 4, 2, -9); lamp(0xffffff, 0.10, 3, -1.5, 2);
const world = new THREE.Group(); scene.add(world);

function aoMat(opts) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.62, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }, opts));
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float ao; varying float vAo;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAo = ao * 1.275;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vAo;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vAo;');
  };
  m.customProgramCacheKey = () => 'ao';
  return m;
}
const matNeutral = aoMat({ color: srgb(NEUTRAL), transparent: true, opacity: 0 });
const matNeutralHot = aoMat({ color: srgb(NEUTRAL), emissive: srgb(0xffffff), emissiveIntensity: 0.10 });
const matMissing = aoMat({ color: srgb(PAPER), transparent: true, opacity: 0 });            // also the empty socket under a piece that has not landed
const matMissingHot = aoMat({ color: srgb(PAPER), emissive: srgb(ACCENT), emissiveIntensity: 0.10 });
items.forEach(it => { if (it.kind === 'project') { it.mat = aoMat({ color: srgb(it.color) }); it.hot = aoMat({ color: srgb(it.color), emissive: srgb(it.color), emissiveIntensity: 0.28 }); } });

// ---------- tweens ----------
const tweens = new Set();
const easeOutCubic = k => 1 - Math.pow(1 - k, 3), easeInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const easeOutBack = k => { const c = 1.25; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
function tween(dur, fn, ease = easeOutCubic) { return new Promise(res => { if (dur <= 0 || reduceMotion) { fn(1); res(); return; } tweens.add({ t0: performance.now(), dur, fn, ease, res }); }); }
function runTweens(now) { for (const t of tweens) { const k = Math.min(1, (now - t.t0) / t.dur); t.fn(t.ease(k)); if (k >= 1) { tweens.delete(t); t.res(); } } }
const wait = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));

// ---------- camera ----------
let fit = 4.4, brainR = 1.5; const C0 = new THREE.Vector3();                                                 // camera distance that frames the whole brain
const cam = { theta: 1.3, phi: 1.2, r: 4.4, tx: 0, ty: 0, tz: 0 };          // where it is
const goal = { theta: -2.2, phi: 1.15, r: 4.4, tx: 0, ty: 0, tz: 0 };       // where it wants to be
function computeFit() { const vf = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect); const f = brainR / Math.sin(Math.min(vf, hf) / 2) * 1.04; if (fit) { const k = f / fit; cam.r *= k; goal.r *= k; } fit = f; }
let sway = 0, lastInput = -1e9, flying = false;
const VIEWS = { left: [-Math.PI / 2, 1.45], front: [Math.PI, 1.3], top: [-2.2, 0.12], right: [Math.PI / 2, 1.45], below: [-2.2, 3.0], inside: [Math.PI / 2, 1.5] };
function applyCamera() {
  const th = cam.theta + sway, ph = cam.phi;
  camera.position.set(cam.tx + cam.r * Math.sin(ph) * Math.sin(th), cam.ty + cam.r * Math.cos(ph), cam.tz + cam.r * Math.sin(ph) * Math.cos(th));
  camera.lookAt(cam.tx, cam.ty, cam.tz);
}
function flyTo(g, dur = 900) {
  const from = { ...cam }; const to = { ...goal, ...g };
  let dth = to.theta - from.theta; dth = ((dth + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; to.theta = from.theta + dth;
  Object.assign(goal, to); flying = true;
  return tween(dur, k => { for (const key of ['theta', 'phi', 'r', 'tx', 'ty', 'tz']) cam[key] = from[key] + (to[key] - from[key]) * k; }, easeInOut).then(() => { flying = false; });
}

// ---------- load the brain ----------
const hemis = {}, pieces = [], pieceById = new Map();
let meshes = [];
async function load() {
  const [meta, buf] = await Promise.all([fetch('assets/brain.json').then(r => r.json()), fetch('assets/brain.bin').then(r => r.arrayBuffer())]);
  const view = k => { const L = meta.layout[k]; const T = { int16: Int16Array, uint16: Uint16Array, uint8: Uint8Array }[L.dtype]; return new T(buf, L.offset, L.length); };
  for (const h of ['L', 'R']) {
    const q = view(h + '.pos'), pos = new Float32Array(q.length);
    for (let i = 0; i < q.length; i++) pos[i] = q[i] * meta.scale;
    const idx = view(h + '.idx');
    const full = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(pos, 3);
    full.setAttribute('position', posAttr); full.setIndex(new THREE.BufferAttribute(idx, 1)); full.computeVertexNormals();
    const group = new THREE.Group(); world.add(group);
    hemis[h] = { posAttr, nrmAttr: full.getAttribute('normal'), aoAttr: new THREE.BufferAttribute(view(h + '.ao'), 1, true), idx, reg: view(h + '.reg'), edges: view(h + '.edges'), group };
  }
  for (const p of meta.pieces) {
    if (!p.faces) continue;
    const H = hemis[p.hemi];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', H.posAttr); g.setAttribute('normal', H.nrmAttr); g.setAttribute('ao', H.aoAttr);
    g.setIndex(new THREE.BufferAttribute(H.idx.subarray(p.faces[0] * 3, (p.faces[0] + p.faces[1]) * 3), 1));
    const center = new THREE.Vector3(...p.center);
    g.boundingSphere = new THREE.Sphere(center.clone(), p.radius);
    const mesh = new THREE.Mesh(g, matNeutral);
    mesh.position.copy(center).negate();
    const pivot = new THREE.Group(); pivot.position.copy(center); pivot.add(mesh); H.group.add(pivot);
    const piece = { id: p.id, name: p.name, hemi: p.hemi, net: p.net, mesh, pivot, center, out: new THREE.Vector3(...p.out), anchor: p.anchor ? new THREE.Vector3(...p.anchor) : center.clone(), kind: 'neutral', owner: null };
    mesh.userData.piece = piece; pieces.push(piece); pieceById.set(p.name, piece);
  }
  for (const it of items) for (const name of it.regions) {
    const pc = pieceById.get(name); if (!pc) { console.warn('no such region', name); continue; }
    pc.kind = it.kind; pc.owner = it; it.pieces.push(pc);
    pc.mesh.material = it.kind === 'project' ? it.mat : matMissing;
    if (it.kind === 'project') { const sk = new THREE.Mesh(pc.mesh.geometry, matMissing); sk.visible = false; hemis[pc.hemi].group.add(sk); pc.socket = sk; }
  }
  items.forEach(it => {
    it.center = it.pieces.reduce((a, p) => a.add(p.center), new THREE.Vector3()).divideScalar(it.pieces.length || 1);
    it.out = it.pieces.reduce((a, p) => a.add(p.out), new THREE.Vector3()).normalize();
    it.anchor = it.pieces.length ? it.pieces[0].anchor : it.center;
    it.hemi = it.pieces.length ? it.pieces[0].hemi : 'L';
  });
  meshes = pieces.map(p => p.mesh);
  let r2 = 0; for (const h of ['L', 'R']) { const P = hemis[h].posAttr.array; for (let i = 0; i < P.length; i += 3) { const d = P[i] * P[i] + P[i + 1] * P[i + 1] + P[i + 2] * P[i + 2]; if (d > r2) r2 = d; } }
  const bb = new THREE.Box3(); for (const h of ['L', 'R']) bb.expandByObject(hemis[h].group); bb.getCenter(C0); world.position.copy(C0).negate();   // brain centre becomes the origin
  const P = hemis.L.posAttr.array; r2 = 0; for (const h of ['L', 'R']) { const A = hemis[h].posAttr.array; for (let i = 0; i < A.length; i += 3) { const d = (A[i] - C0.x) ** 2 + (A[i + 1] - C0.y) ** 2 + (A[i + 2] - C0.z) ** 2; if (d > r2) r2 = d; } }
  brainR = Math.sqrt(r2); fit = 0; computeFit(); cam.r = goal.r = fit;

  // puzzle cut lines: every region boundary, faint
  const edgeMat = new THREE.LineBasicMaterial({ color: srgb(INK), transparent: true, opacity: 0 });
  for (const h of ['L', 'R']) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', hemis[h].posAttr); g.setIndex(new THREE.BufferAttribute(hemis[h].edges, 1));
    hemis[h].group.add(new THREE.LineSegments(g, edgeMat));
  }
  // one outline per item (the owner's outer boundary: edges with exactly one endpoint inside the owner)
  const outlineMat = new THREE.LineBasicMaterial({ color: srgb(INK), transparent: true, opacity: 0.9 });
  const dashMat = new THREE.LineDashedMaterial({ color: srgb(INK), dashSize: 0.028, gapSize: 0.016, transparent: true, opacity: 0 });
  items.forEach(it => {
    const set = new Set(it.pieces.map(p => p.id)); it.outline = [];
    for (const h of ['L', 'R']) {
      const E = hemis[h].edges, R = hemis[h].reg, P = hemis[h].posAttr.array, arr = [];
      for (let i = 0; i < E.length; i += 2) { const a = E[i], b = E[i + 1]; if (set.has(R[a]) !== set.has(R[b])) arr.push(P[3 * a], P[3 * a + 1], P[3 * a + 2], P[3 * b], P[3 * b + 1], P[3 * b + 2]); }
      if (!arr.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(arr), 3));
      const ls = new THREE.LineSegments(g, it.kind === 'missing' ? dashMat : outlineMat); ls.computeLineDistances();
      ls.visible = it.kind === 'missing'; ls.renderOrder = 3; hemis[h].group.add(ls); it.outline.push(ls);
    }
  });
  // "?" markers for the missing pieces
  items.filter(it => it.kind === 'missing').forEach(it => {
    const q = document.createElement('button'); q.className = 'q'; q.textContent = '?'; q.setAttribute('aria-label', it.title);
    q.addEventListener('click', () => select(it)); q.addEventListener('mouseenter', () => { if (!coarse) hover(it, 'label'); }); q.addEventListener('mouseleave', () => { if (!coarse) hover(null, 'label'); });
    el.labels.appendChild(q); it.marker = q;
  });
  return { edgeMat, dashMat };
}

// ---------- hover / select ----------
const raycaster = new THREE.Raycaster(); const ndc = new THREE.Vector2(); let hovered = null, selected = null, hoverSource = null, hoveredPiece = null;
function paint(it, hot) { it.pieces.forEach(p => { p.mesh.material = it.kind === 'project' ? (hot ? it.hot : it.mat) : (hot ? matMissingHot : matMissing); }); if (it.kind === 'project') it.outline.forEach(o => o.visible = hot); }
function hover(it, source) {
  if (it === hovered) return;
  if (hovered && hovered !== selected) paint(hovered, false);
  hovered = it; hoverSource = source;
  if (hovered) paint(hovered, true);
  document.querySelectorAll('.piece-list li.on').forEach(n => n.classList.remove('on'));
  const show = hovered || selected; if (show) document.querySelector(`.piece-list li[data-key="${show.key}"]`)?.classList.add('on');
  if (!selected) showCard(hovered, false);
  canvas.classList.toggle('hot', !!hovered && source === 'canvas');
  el.float.classList.toggle('on', !!hovered); if (hovered) el.float.textContent = hovered.title;
}
function select(it) {
  if (selected && selected !== it) paint(selected, false);
  selected = it;
  if (!it) { showCard(hovered, false); if (hovered) paint(hovered, true); flyTo({ r: fit, tx: 0, ty: 0, tz: 0 }, 800); return; }
  paint(it, true); showCard(it, true);
  document.querySelectorAll('.piece-list li.on').forEach(n => n.classList.remove('on'));
  document.querySelector(`.piece-list li[data-key="${it.key}"]`)?.classList.add('on');
  const o = it.out; const theta = Math.atan2(o.x, o.z), phi = Math.min(2.6, Math.max(0.5, Math.acos(Math.max(-1, Math.min(1, o.y)))));
  const t = it.center.clone().sub(C0).multiplyScalar(0.45);
  flyTo({ theta, phi, r: fit * 0.7, tx: t.x, ty: t.y, tz: t.z }, 1000);
  el.views.querySelectorAll('button').forEach(b => b.classList.remove('on'));
}
function showCard(it, full) {
  el.card.classList.toggle('on', !!it); el.card.classList.toggle('selected', !!it && full);
  if (!it) return;
  el.card.dataset.kind = it.kind;
  el.kicker.textContent = it.kind === 'project' ? `${it.year} · ${it.where}` : `Missing · ${it.where}`;
  el.title.textContent = it.title;
  el.body.textContent = it.kind === 'project' ? it.blurb : it.question;
  el.status.textContent = it.kind === 'project' ? it.status : 'If this is your question too, write to me.';
  el.links.innerHTML = (it.kind === 'project' ? (it.links || []) : [{ label: 'Write to me', href: 'mailto:' + S.email + '?subject=' + encodeURIComponent(it.title) }])
    .map(l => `<a href="${l.href}" ${l.href.startsWith('mailto') ? '' : 'target="_blank" rel="noopener"'}>${l.label}</a>`).join('');
  if (full && it.kind === 'project') { requestAnimationFrame(() => drawSignal(it.signal, el.signal, el.signalLabel)); }
  else { el.signal.style.display = 'none'; el.signalLabel.style.display = 'none'; }
}
el.cardClose.addEventListener('click', () => select(null));
addEventListener('keydown', e => {
  if (e.key === 'Escape') select(null);
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const i = selected ? selected.index : -1; const n = items.length; select(items[(i + (e.key === 'ArrowRight' ? 1 : n - 1) + n) % n]); }
});

// ---------- pointer: orbit, pick, pinch ----------
const pointers = new Map(); let dragging = false, moved = 0, pinch0 = 0, r0 = 0;
function pick(x, y) {
  const b = canvas.getBoundingClientRect(); ndc.set(((x - b.left) / b.width) * 2 - 1, -((y - b.top) / b.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(meshes.filter(m => m.visible && m.parent.parent.visible), false)[0];
  return hit ? hit.object.userData.piece : null;
}
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); lastInput = performance.now();
  if (pointers.size === 1) { dragging = true; moved = 0; canvas.classList.add('dragging'); }
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); r0 = goal.r; }
  if (assembling) finishAssembly();
});
canvas.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) {
    const p = pointers.get(e.pointerId); const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; lastInput = performance.now();
    if (pointers.size === 1 && dragging) { moved += Math.abs(dx) + Math.abs(dy); goal.theta -= dx * 0.0065; goal.phi = Math.min(2.95, Math.max(0.2, goal.phi - dy * 0.0065)); el.hint.classList.add('off'); }
    else if (pointers.size === 2) { const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0) goal.r = Math.min(fit * 1.7, Math.max(fit * 0.45, r0 * pinch0 / d)); }
    return;
  }
  if (coarse) return;
  const pc = pick(e.clientX, e.clientY); hoveredPiece = pc;
  hover(pc && pc.owner ? pc.owner : null, 'canvas');
  const b = stage.getBoundingClientRect();
  if (pc && !pc.owner) { el.tip.textContent = prettyRegion(pc.name); el.tip.classList.add('on'); el.tip.style.left = (e.clientX - b.left) + 'px'; el.tip.style.top = (e.clientY - b.top) + 'px'; }
  else el.tip.classList.remove('on');
  if (hovered) { el.float.style.left = (e.clientX - b.left) + 'px'; el.float.style.top = (e.clientY - b.top) + 'px'; }
});
const endPointer = e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (pointers.size === 0) {
    canvas.classList.remove('dragging');
    if (dragging && moved < 6) { const pc = pick(e.clientX, e.clientY); if (pc && pc.owner) select(pc.owner === selected ? null : pc.owner); else if (selected) select(null); }
    dragging = false;
  }
  pinch0 = 0;
};
canvas.addEventListener('pointerup', endPointer); canvas.addEventListener('pointercancel', endPointer);
let lastDown = 0; canvas.addEventListener('pointerdown', () => { lastDown = performance.now(); });
canvas.addEventListener('click', e => { if (performance.now() - lastDown < 600) return; if (assembling) { finishAssembly(); return; } const pc = pick(e.clientX, e.clientY); if (pc && pc.owner) select(pc.owner === selected ? null : pc.owner); else if (selected) select(null); });
canvas.addEventListener('pointerleave', () => { if (!coarse && hoverSource === 'canvas') { hover(null, 'canvas'); el.tip.classList.remove('on'); } });
canvas.addEventListener('wheel', e => { e.preventDefault(); goal.r = Math.min(fit * 1.7, Math.max(fit * 0.45, goal.r * (1 + e.deltaY * 0.0012))); lastInput = performance.now(); el.hint.classList.add('off'); }, { passive: false });

// view buttons
let insideOn = false;
el.views.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const v = b.dataset.view; lastInput = performance.now();
  el.views.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  if (v === 'inside') { insideOn = !insideOn; b.classList.toggle('on', insideOn); if (!insideOn) { hemis.R.group.visible = true; flyTo({ theta: -2.2, phi: 1.15, r: fit, tx: 0, ty: 0, tz: 0 }); return; } }
  else insideOn = false;
  hemis.R.group.visible = !insideOn;
  const [theta, phi] = VIEWS[v]; flyTo({ theta, phi, r: fit, tx: insideOn ? -0.3 : 0, ty: 0, tz: 0 });
});

// ---------- assembly: the brain puts itself together ----------
let assembling = false, finishAssembly = () => {};
async function assemble(mats) {
  assembling = true;
  const projects = items.filter(i => i.kind === 'project'), missing = items.filter(i => i.kind === 'missing');
  projects.forEach(it => it.pieces.forEach(p => { p.pivot.visible = false; p.socket.visible = true; }));
  let done = false;
  const finalState = () => {
    done = true; tweens.clear();
    for (const m of [matNeutral, matMissing]) { m.opacity = 1; m.transparent = false; m.needsUpdate = true; } mats.edgeMat.opacity = 0.16; mats.dashMat.opacity = 0.9;
    items.forEach(it => it.pieces.forEach(p => { p.pivot.visible = true; p.pivot.position.copy(p.center); p.pivot.quaternion.identity(); if (p.socket) p.socket.visible = false; }));
    missing.forEach(it => it.marker.classList.add('on'));
    Object.assign(cam, { theta: -2.2, phi: 1.15, r: fit, tx: 0, ty: 0, tz: 0 }); Object.assign(goal, { theta: -2.2, phi: 1.15, r: fit, tx: 0, ty: 0, tz: 0 });
    el.caption.classList.remove('on'); el.counter.textContent = `${projects.length} pieces placed · ${missing.length} missing`;
    assembling = false; lastInput = performance.now() - 2500;
  };
  finishAssembly = finalState;
  if (reduceMotion) { finalState(); return; }
  // the board fades in while the camera begins a slow sweep from the right side to the left
  tween(3800, k => { cam.theta = 1.3 + (-2.2 - 1.3) * k; goal.theta = cam.theta; }, easeInOut);
  await tween(900, k => { matNeutral.opacity = k; matMissing.opacity = k; mats.edgeMat.opacity = 0.16 * k; });
  for (const m of [matNeutral, matMissing]) { m.transparent = false; m.needsUpdate = true; }
  if (done) return;
  el.caption.classList.add('on');
  const axis = new THREE.Vector3(), q0 = new THREE.Quaternion(), qi = new THREE.Quaternion();
  for (const it of projects) {
    if (done) return;
    el.caption.textContent = `${it.year} · ${it.title}`;
    it.pieces.forEach((p, j) => {
      p.pivot.visible = true;
      axis.copy(p.out).cross(new THREE.Vector3(0, 1, 0)).normalize(); if (!axis.lengthSq()) axis.set(1, 0, 0);
      q0.setFromAxisAngle(axis, 0.55 * (j % 2 ? -1 : 1));
      tween(950 + j * 60, k => { p.pivot.position.copy(p.center).addScaledVector(p.out, 1.25 * (1 - k)); p.pivot.quaternion.copy(q0).slerp(qi, k); }, easeOutBack).then(() => { p.socket.visible = false; });
    });
    await wait(300);
  }
  await wait(500); if (done) return;
  el.caption.textContent = 'and what is missing';
  await tween(900, k => { mats.dashMat.opacity = 0.9 * k; });
  missing.forEach(it => it.marker.classList.add('on'));
  await wait(700);
  if (!done) finalState();
}

// ---------- labels that follow the brain ----------
const v3 = new THREE.Vector3(), camDir = new THREE.Vector3();
function placeLabels() {
  const w = stage.clientWidth, h = stage.clientHeight;
  for (const it of items) {
    if (!it.marker) continue;
    if (!it.pieces[0].pivot.visible || !hemis[it.hemi].group.visible) { it.marker.style.opacity = 0; continue; }
    v3.copy(it.anchor).addScaledVector(it.out, 0.02).sub(C0); camDir.copy(camera.position).sub(v3).normalize();
    const facing = camDir.dot(it.out);
    v3.project(camera);
    it.marker.style.left = ((v3.x + 1) / 2 * w) + 'px'; it.marker.style.top = ((1 - v3.y) / 2 * h) + 'px';
    it.marker.style.opacity = it.marker.classList.contains('on') ? Math.max(0, Math.min(1, (facing - 0.05) / 0.25)) : 0;
    it.marker.style.pointerEvents = facing > 0.15 ? 'auto' : 'none';
  }
}

// ---------- signal strips (drawn, not recorded) ----------
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function drawSignal(kind, cv, labelEl) {
  cv.style.display = 'block'; labelEl.style.display = 'block';
  const dpr = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth || 340, H = 72; cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const ink = '#1F231F', acc = '#C4573A', mid = '#9AA197', rnd = mulberry32(11);
  const noise = () => rnd() + rnd() + rnd() - 1.5;
  const line = (pts, col, w = 1.2) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'round'; c.stroke(); };
  const text = (s, x, y, col = mid) => { c.fillStyle = col; c.font = '11px "Albert Sans", sans-serif'; c.fillText(s, x, y); };
  const mark = (x, lab) => { c.fillStyle = acc; c.fillRect(x, 6, 1, H - 12); text(lab, x + 5, 14, acc); };
  let label = 'illustration';
  switch (kind) {
    case 'ssvep': { const pts = []; for (let x = 0; x < W; x++) { const t = x / W * 3; const on = t > 1 ? Math.min(1, (t - 1) / 0.5) : 0; pts.push([x, H * 0.52 + on * Math.sin(2 * Math.PI * 12 * t) * H * 0.26 + noise() * H * 0.05 + Math.sin(2 * Math.PI * 0.7 * t) * H * 0.05]); } line(pts, ink); mark(W / 3, 'flicker on, 12 Hz'); label = 'occipital EEG while a 12 Hz target flickers · illustration'; break; }
    case 'erp': { const erp = (x, big) => { const t = x / W * 900 - 100; const g = (m, s, a) => a * Math.exp(-((t - m) ** 2) / (2 * s * s)); return H * 0.5 - (g(100, 25, 6) - g(170, 30, 5) + (big ? g(400, 70, 16) : g(400, 70, 5))) * 1.6; }; const a = [], b = []; for (let x = 0; x < W; x++) { a.push([x, erp(x, false) + noise() * 0.8]); b.push([x, erp(x, true) + noise() * 0.8]); } line(a, mid); line(b, ink); mark(W * (100 / 900), '0 ms'); c.fillStyle = acc; c.fillRect(W * (500 / 900), 6, 1, H - 12); text('400 ms', W * (500 / 900) + 5, H - 6, acc); text('unexpected word', 6, H - 6, ink); label = 'N400: negative is drawn downward · related (grey) vs unrelated (ink) · illustration'; break; }
    case 'meg': { const pts = []; for (let x = 0; x < W; x++) { const t = x / W * 1.2 - 0.2; const ev = Math.exp(-((t - 0.1) ** 2) / 0.0012) * 10 - Math.exp(-((t - 0.19) ** 2) / 0.002) * 7 + Math.exp(-((t - 0.4) ** 2) / 0.01) * 4; pts.push([x, H * 0.5 - ev * 1.6 + noise() * 2.2 + Math.sin(t * 40) * 1.5]); } line(pts, ink); mark(W / 6, 'word onset'); label = 'one sensor, one word · illustration'; break; }
    case 'states': { const cols = ['#6E9C7A', '#C9A24F', '#6E8FC2', '#C27C8A']; let s = 0, x = 0; while (x < W) { const len = 6 + rnd() * 26; c.fillStyle = cols[s]; c.fillRect(x, 18, len, 22); x += len; if (rnd() < 0.9) { let n = Math.floor(rnd() * 4); if (n === s) n = (n + 1) % 4; s = n; } } text('state 1', 2, 56, cols[0]); text('2', 48, 56, cols[1]); text('3', 64, 56, cols[2]); text('4', 80, 56, cols[3]); text('10 minutes of rest →', W - 120, 56); label = 'a four-state Markov chain over resting-state fMRI · synthetic'; break; }
    case 'dfc': { const bold = []; for (let x = 0; x < W; x++) { const t = x / W * 60; bold.push([x, 16 + Math.sin(t * 0.7) * 5 + Math.sin(t * 1.9 + 1) * 3 + noise() * 1.2]); } line(bold, ink); text('BOLD, one region, 2 s per sample', 6, 36); for (let r = 0; r < 5; r++) for (let i = 0; i < 70; i++) if (rnd() < 0.18) { c.fillStyle = mid; c.fillRect(rnd() * W, 42 + r * 5, 1, 4); } text('spikes, 5 electrodes, 100 ms bins', W - 190, H - 2); label = 'the same window slid over two scales · illustration'; break; }
    case 'bars': { const bars = [['untreated AD', 1, mid], ['+ isoorientin, mRNA', 2, ink], ['+ isoorientin, protein', 3, acc]]; const bw = (W - 40) / 3; bars.forEach(([n, v, col], i) => { const x = 20 + i * bw, hgt = v / 3 * 44; c.fillStyle = col; c.fillRect(x, 50 - hgt, bw - 24, hgt); text(n, x, 62); text(v + '×', x, 50 - hgt - 4, col); }); label = 'Nt5c1a relative to untreated AD mice · ratios as reported'; break; }
    case 'zone': { const pts = []; let v = 0; const vals = []; for (let x = 0; x < W; x++) { v = v * 0.985 + noise() * 0.12; vals.push(v); } const sd = Math.sqrt(vals.reduce((a, b) => a + b * b, 0) / W) || 1; vals.forEach((v, x) => { if (Math.abs(v) > sd) { c.fillStyle = 'rgba(196,87,58,0.12)'; c.fillRect(x, 6, 1, H - 12); } pts.push([x, H * 0.5 - v / sd * 14]); }); line(pts, ink); text('reaction-time variability; shaded = out of the zone', 6, H - 6); label = 'the behaviour the brain states are matched against · illustration'; break; }
    case 'slow': { const pts = []; for (let x = 0; x < W; x++) { const t = x / W * 8; const slow = t > 4.5 ? Math.sin(2 * Math.PI * 1.2 * (t - 4.5)) * Math.min(1, (t - 4.5) / 1.5) * 9 : 0; pts.push([x, H * 0.5 + Math.sin(2 * Math.PI * 10 * t) * 2.2 * (t < 4.5 ? 1 : 0.4) + noise() * 1.8 + slow]); } line(pts, ink); mark(W * 0.93, 'tap'); text('slow waves creep in', W * 0.6, 14); label = 'one temple channel in the seconds before a lapse · illustration'; break; }
    default: cv.style.display = 'none'; labelEl.style.display = 'none'; return;
  }
  labelEl.textContent = label;
}

// ---------- main loop ----------
function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (meshes.length) computeFit(); }
new ResizeObserver(resize).observe(stage); resize();
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  runTweens(now);
  if (!flying) { const k = 1 - Math.pow(0.001, dt); for (const key of ['theta', 'phi', 'r', 'tx', 'ty', 'tz']) cam[key] += (goal[key] - cam[key]) * k; }
  const idle = (now - lastInput) / 1000 > 3 && !selected && !assembling && !reduceMotion;
  const swayGoal = idle ? Math.sin(now * 0.00035) * 0.16 : 0;
  sway += (swayGoal - sway) * (1 - Math.pow(idle ? 0.3 : 0.02, dt));
  applyCamera(); placeLabels();
  renderer.render(scene, camera);
}

window.__brain = { pick: (x, y) => pick(x, y), items, pieces, camera, get meshes() { return meshes; }, hover, select };
load().then(mats => {
  el.loading.classList.add('off'); applyCamera(); requestAnimationFrame(frame);
  assemble(mats);
}).catch(err => { console.error(err); el.loading.textContent = 'The brain did not load. The pieces are listed below.'; });
})();
