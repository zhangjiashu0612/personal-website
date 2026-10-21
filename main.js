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
const entry = $('#entry'); let pendingMode = null, enterImpl = null;
if (entry) entry.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
  entry.classList.add('off'); setTimeout(() => { entry.hidden = true; }, 750);
  if (enterImpl) enterImpl(b.dataset.mode); else pendingMode = b.dataset.mode;
}));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

const PAPER = 0xF2EDE4, INK = 0x2E2C29, NEUTRAL = 0xD4CDC0, ACCENT = 0xB5362A;
const CSS = { ink: '#2E2C29', accent: '#B5362A', light: '#A89F94', mid: '#6B6560', soft: 'rgba(181,54,42,0.12)', sheet: '#F8F4EC', grid: 'rgba(46,44,41,0.06)', gridMajor: 'rgba(46,44,41,0.13)' };
const srgb = hex => new THREE.Color(hex).convertSRGBToLinear();
const lifted = hex => new THREE.Color(hex);
const NAMES = { bankssts: 'Banks of the superior temporal sulcus', caudalanteriorcingulate: 'Caudal anterior cingulate', caudalmiddlefrontal: 'Caudal middle frontal', cuneus: 'Cuneus', entorhinal: 'Entorhinal', fusiform: 'Fusiform', inferiorparietal: 'Inferior parietal', inferiortemporal: 'Inferior temporal', isthmuscingulate: 'Isthmus cingulate', lateraloccipital: 'Lateral occipital', lateralorbitofrontal: 'Lateral orbitofrontal', lingual: 'Lingual', medialorbitofrontal: 'Medial orbitofrontal', middletemporal: 'Middle temporal', parahippocampal: 'Parahippocampal', paracentral: 'Paracentral', parsopercularis: 'Pars opercularis', parsorbitalis: 'Pars orbitalis', parstriangularis: 'Pars triangularis', pericalcarine: 'Pericalcarine', postcentral: 'Postcentral', posteriorcingulate: 'Posterior cingulate', precentral: 'Precentral', precuneus: 'Precuneus', rostralanteriorcingulate: 'Rostral anterior cingulate', rostralmiddlefrontal: 'Rostral middle frontal', superiorfrontal: 'Superior frontal', superiorparietal: 'Superior parietal', superiortemporal: 'Superior temporal', supramarginal: 'Supramarginal', frontalpole: 'Frontal pole', temporalpole: 'Temporal pole', transversetemporal: 'Transverse temporal', insula: 'Insula', medialwall: 'Medial wall' };
const prettyRegion = name => { const [h, r] = name.split('-'); return (h === 'lh' ? 'Left ' : 'Right ') + (NAMES[r] || r).toLowerCase(); };

// ---------- mode: which words the visitor gets ----------
let mode = (() => { try { return sessionStorage.getItem('mode'); } catch (e) { return null; } })();
const T = (it, field) => (mode === 'plain' && it[field + 'Plain']) ? it[field + 'Plain'] : it[field];

// ---------- contact links, who, longer version, lists (single source: pieces.js) ----------
$('#mail-link').href = 'mailto:' + S.email; $('#mail-link').textContent = S.email;
$('#github-link').href = S.github; $('#who-github').href = S.github; $('#who-mail').href = 'mailto:' + S.email;
['#rail-gh', '#top-gh'].forEach(q => { $(q).href = S.github; }); ['#rail-mail', '#top-mail'].forEach(q => { $(q).href = 'mailto:' + S.email; });
$('#who-lines').innerHTML = S.who.map(l => `<span>${l}</span>`).join('<br>');
if (S.cv) { const a = $('#cv-link'); a.href = S.cv; a.hidden = false; }
if (S.photo) { const im = $('#who-photo'); im.src = S.photo; im.hidden = false; }
$('#longer').innerHTML = S.longer.map(t => `<p>${t}</p>`).join('');
const items = [];
S.projects.forEach((p, i) => items.push({ ...p, kind: 'project', index: i, pieces: [] }));
S.missing.forEach((m, i) => items.push({ ...m, kind: 'missing', index: S.projects.length + i, pieces: [] }));
const byKey = new Map(items.map(it => [it.key, it]));

function li(it) {
  const node = document.createElement('li'); node.dataset.key = it.key;
  const chip = `<span class="chip ${it.kind === 'missing' ? 'hollow' : ''}" style="${it.kind === 'project' ? 'background:' + it.color : ''}"></span>`;
  const year = `<span class="year">${it.kind === 'project' ? it.year : '?'}</span>`;
  const text = it.kind === 'project' ? T(it, 'blurb').split(/(?<=\.)\s/)[0] : T(it, 'question');
  const show = `<a href="#" class="showme">show on the brain</a>`;
  const links = (it.links || []).map(l => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join('');
  const dossier = it.kind === 'project'
    ? `<div class="dossier"><p>${T(it, 'blurb')}</p>${it.how ? `<p><b>How</b>${it.how}</p>` : ''}${it.result ? `<p><b>What came out</b>${it.result}</p>` : ''}${it.figure ? `<figure><img src="${it.figure}" alt="" loading="lazy"><figcaption>${it.figcaption || ''}</figcaption></figure>` : ''}<p class="l">${links}${show}</p></div>`
    : `<div class="dossier"><p>${T(it, 'question')}</p><p class="l"><a href="mailto:${S.email}?subject=${encodeURIComponent(it.title)}">Write to me</a>${show}</p></div>`;
  node.innerHTML = `<div class="head">${chip}${year}<div><div class="t">${T(it, 'title')}</div><p class="d">${text}</p></div></div>${dossier}`;
  const head = node.querySelector('.head');
  head.addEventListener('mouseenter', () => { if (!coarse) hover(it, 'list'); });
  head.addEventListener('mouseleave', () => { if (!coarse) hover(null, 'list'); });
  head.addEventListener('click', () => { const open = !node.classList.contains('open'); document.querySelectorAll('.piece-list li.open').forEach(n => { if (n !== node) n.classList.remove('open'); }); node.classList.toggle('open', open); });
  node.querySelector('.showme').addEventListener('click', e => { e.preventDefault(); select(it); if (innerWidth <= 900) stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); });
  return node;
}

function renderLists() {
  el.pieceList.innerHTML = ''; el.missingList.innerHTML = '';
  items.filter(i => i.kind === 'project').forEach(it => el.pieceList.appendChild(li(it)));
  items.filter(i => i.kind === 'missing').forEach(it => el.missingList.appendChild(li(it)));
  $('#mode-switch').textContent = mode === 'plain' ? 'Switch to the technical words' : 'Switch to plain words';
}
renderLists();
$('#mode-switch').addEventListener('click', e => { e.preventDefault(); setMode(mode === 'plain' ? 'expert' : 'plain'); });
function setMode(m) { mode = m; try { sessionStorage.setItem('mode', m); } catch (e) {} renderLists(); if (selected) showCard(selected, true); else if (hovered) showCard(hovered, false); }

// ---------- renderer / scene ----------
let renderer;
try { if (location.search.includes('nowebgl')) throw new Error('forced'); renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); if (!renderer.getContext()) throw new Error('no context'); }
catch (e) {
  document.body.classList.add('no-webgl'); el.loading.classList.add('off');
  stage.insertAdjacentHTML('afterbegin', `<img class="still" src="assets/brain-still.webp" alt="The brain as a puzzle: coloured pieces are projects, pale ones are open questions"><p class="still-note">Your browser has WebGL switched off, so the brain is a picture here and the two games are hidden. In Chrome or Safari with hardware acceleration on, it turns, and you can play.</p>`); if (pendingMode) setMode(pendingMode === 'plain' ? 'plain' : 'expert'); enterImpl = m => setMode(m === 'plain' ? 'plain' : 'expert'); return; }
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
items.forEach(it => { if (it.kind === 'project') { const c = lifted(it.color).convertSRGBToLinear(); it.mat = aoMat({ color: c }); it.hot = aoMat({ color: c.clone(), emissive: c.clone(), emissiveIntensity: 0.28 }); } });

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
  el.float.classList.toggle('on', !!hovered); if (hovered) el.float.textContent = T(hovered, 'title');
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
  el.kicker.textContent = it.kind === 'project' ? `${it.year} · ${T(it, 'where')}` : `Missing · ${T(it, 'where')}`;
  el.title.textContent = T(it, 'title');
  el.body.textContent = it.kind === 'project' ? T(it, 'blurb') : T(it, 'question');
  el.status.textContent = it.kind === 'project' ? it.status : 'If this is your question too, write to me.';
  el.links.innerHTML = (it.kind === 'project' ? (it.links || []) : [{ label: 'Write to me', href: 'mailto:' + S.email + '?subject=' + encodeURIComponent(it.title) }])
    .map(l => `<a href="${l.href}" ${l.href.startsWith('mailto') ? '' : 'target="_blank" rel="noopener"'}>${l.label}</a>`).join('');
  if (it.kind === 'missing' && mode === 'plain') el.status.textContent = 'If this is your problem too, or your research, write to me.';
  if (full && it.kind === 'project') { requestAnimationFrame(() => drawSignal(it.signal, el.signal, el.signalLabel)); }
  else { el.signal.style.display = 'none'; el.signalLabel.style.display = 'none'; }
}
el.cardClose.addEventListener('click', () => select(null));
addEventListener('keydown', e => {
  if (G.on && (e.key === ' ' || e.code === 'Space')) { e.preventDefault(); tap(); return; }
  if (e.key === 'Escape') { if (!gm.sheet.hidden) { closeSheet(); return; } if (G.on) { endGame(true); return; } if (E.on) { endProbe(); return; } select(null); }
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
  if (!gm.sheet.hidden) { closeSheet(); return; }
  if (G.on) { e.preventDefault(); tap(); return; }
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
  if (E.on) { if (!coarse) probeHover(e.clientX, e.clientY); return; }
  if (G.on || coarse) return;
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
    if (dragging && moved < 6) { if (E.on) probePlace(e.clientX, e.clientY); else { const pc = pick(e.clientX, e.clientY); if (pc && pc.owner) select(pc.owner === selected ? null : pc.owner); else if (selected) select(null); } }
    dragging = false;
  }
  pinch0 = 0;
};
canvas.addEventListener('pointerup', endPointer); canvas.addEventListener('pointercancel', endPointer);
let lastDown = 0; canvas.addEventListener('pointerdown', () => { lastDown = performance.now(); });
canvas.addEventListener('click', e => { if (performance.now() - lastDown < 600) return; if (!gm.sheet.hidden) { closeSheet(); return; } if (assembling) { finishAssembly(); return; } if (G.on) { tap(); return; } if (E.on) { probePlace(e.clientX, e.clientY); return; } const pc = pick(e.clientX, e.clientY); if (pc && pc.owner) select(pc.owner === selected ? null : pc.owner); else if (selected) select(null); });
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
    assembling = false; lastInput = performance.now() - 2500; document.querySelector('.minis').classList.add('on');
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
  const ink = CSS.ink, acc = CSS.accent, mid = CSS.light, rnd = mulberry32(11);
  const noise = () => rnd() + rnd() + rnd() - 1.5;
  const line = (pts, col, w = 1.2) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'round'; c.stroke(); };
  const text = (s, x, y, col = mid) => { c.fillStyle = col; c.font = '11px "DM Sans", sans-serif'; c.fillText(s, x, y); };
  const mark = (x, lab) => { c.fillStyle = acc; c.fillRect(x, 6, 1, H - 12); text(lab, x + 5, 14, acc); };
  let label = 'illustration';
  switch (kind) {
    case 'ssvep': { const pts = []; for (let x = 0; x < W; x++) { const t = x / W * 3; const on = t > 1 ? Math.min(1, (t - 1) / 0.5) : 0; pts.push([x, H * 0.52 + on * Math.sin(2 * Math.PI * 12 * t) * H * 0.26 + noise() * H * 0.05 + Math.sin(2 * Math.PI * 0.7 * t) * H * 0.05]); } line(pts, ink); mark(W / 3, 'flicker on, 12 Hz'); label = 'occipital EEG while a 12 Hz target flickers · illustration'; break; }
    case 'erp': { const erp = (x, big) => { const t = x / W * 900 - 100; const g = (m, s, a) => a * Math.exp(-((t - m) ** 2) / (2 * s * s)); return H * 0.5 - (g(100, 25, 6) - g(170, 30, 5) + (big ? g(400, 70, 16) : g(400, 70, 5))) * 1.6; }; const a = [], b = []; for (let x = 0; x < W; x++) { a.push([x, erp(x, false) + noise() * 0.8]); b.push([x, erp(x, true) + noise() * 0.8]); } line(a, mid); line(b, ink); mark(W * (100 / 900), '0 ms'); c.fillStyle = acc; c.fillRect(W * (500 / 900), 6, 1, H - 12); text('400 ms', W * (500 / 900) + 5, H - 6, acc); text('unexpected word', 6, H - 6, ink); label = 'N400: negative is drawn downward · related (grey) vs unrelated (ink) · illustration'; break; }
    case 'meg': { const pts = []; for (let x = 0; x < W; x++) { const t = x / W * 1.2 - 0.2; const ev = Math.exp(-((t - 0.1) ** 2) / 0.0012) * 10 - Math.exp(-((t - 0.19) ** 2) / 0.002) * 7 + Math.exp(-((t - 0.4) ** 2) / 0.01) * 4; pts.push([x, H * 0.5 - ev * 1.6 + noise() * 2.2 + Math.sin(t * 40) * 1.5]); } line(pts, ink); mark(W / 6, 'word onset'); label = 'one sensor, one word · illustration'; break; }
    case 'states': { const cols = ['#6E9C7A', '#C9A24F', '#6E8FC2', '#C27C8A']; let s = 0, x = 0; while (x < W) { const len = 6 + rnd() * 26; c.fillStyle = cols[s]; c.fillRect(x, 18, len, 22); x += len; if (rnd() < 0.9) { let n = Math.floor(rnd() * 4); if (n === s) n = (n + 1) % 4; s = n; } } text('state 1', 2, 56, cols[0]); text('2', 48, 56, cols[1]); text('3', 64, 56, cols[2]); text('4', 80, 56, cols[3]); text('10 minutes of rest →', W - 120, 56); label = 'a four-state Markov chain over resting-state fMRI · synthetic'; break; }
    case 'dfc': { const bold = []; for (let x = 0; x < W; x++) { const t = x / W * 60; bold.push([x, 16 + Math.sin(t * 0.7) * 5 + Math.sin(t * 1.9 + 1) * 3 + noise() * 1.2]); } line(bold, ink); text('BOLD, one region, 2 s per sample', 6, 36); for (let r = 0; r < 5; r++) for (let i = 0; i < 70; i++) if (rnd() < 0.18) { c.fillStyle = mid; c.fillRect(rnd() * W, 42 + r * 5, 1, 4); } text('spikes, 5 electrodes, 100 ms bins', W - 190, H - 2); label = 'the same window slid over two scales · illustration'; break; }
    case 'bars': { const bars = [['untreated AD', 1, mid], ['+ isoorientin, mRNA', 2, ink], ['+ isoorientin, protein', 3, acc]]; const bw = (W - 40) / 3; bars.forEach(([n, v, col], i) => { const x = 20 + i * bw, hgt = v / 3 * 44; c.fillStyle = col; c.fillRect(x, 50 - hgt, bw - 24, hgt); text(n, x, 62); text(v + '×', x, 50 - hgt - 4, col); }); label = 'Nt5c1a relative to untreated AD mice · ratios as reported'; break; }
    case 'zone': { const pts = []; let v = 0; const vals = []; for (let x = 0; x < W; x++) { v = v * 0.985 + noise() * 0.12; vals.push(v); } const sd = Math.sqrt(vals.reduce((a, b) => a + b * b, 0) / W) || 1; vals.forEach((v, x) => { if (Math.abs(v) > sd) { c.fillStyle = CSS.soft; c.fillRect(x, 6, 1, H - 12); } pts.push([x, H * 0.5 - v / sd * 14]); }); line(pts, ink); text('reaction-time variability; shaded = out of the zone', 6, H - 6); label = 'the behaviour the brain states are matched against · illustration'; break; }
    case 'slow': { const pts = []; for (let x = 0; x < W; x++) { const t = x / W * 8; const slow = t > 4.5 ? Math.sin(2 * Math.PI * 1.2 * (t - 4.5)) * Math.min(1, (t - 4.5) / 1.5) * 9 : 0; pts.push([x, H * 0.5 + Math.sin(2 * Math.PI * 10 * t) * 2.2 * (t < 4.5 ? 1 : 0.4) + noise() * 1.8 + slow]); } line(pts, ink); mark(W * 0.93, 'tap'); text('slow waves creep in', W * 0.6, 14); label = 'one temple channel in the seconds before a lapse · illustration'; break; }
    default: cv.style.display = 'none'; labelEl.style.display = 'none'; return;
  }
  labelEl.textContent = label;
}


// ---------- sound: a pen on paper ----------
const Snd = {
  ctx: null, on: (() => { try { return localStorage.getItem('sound') !== 'off'; } catch (e) { return true; } })(),
  ensure() { if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; this.ctx = new AC(); } if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; },
  burst(dur, f0, f1, q, gain, type = 'bandpass') {
    if (!this.on) return; const c = this.ensure(); if (!c) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, c.currentTime); f.frequency.exponentialRampToValueAtTime(f1, c.currentTime + dur);
    const g = c.createGain(); g.gain.setValueAtTime(gain, c.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    src.connect(f).connect(g).connect(c.destination); src.start();
  },
  tick() { this.burst(0.035, 2600, 1800, 5, 0.22); },
  tear() { this.burst(0.42, 5000, 500, 0.8, 0.3, 'lowpass'); },
  place() { this.burst(0.05, 3200, 1200, 8, 0.18); }
};
const muteBtn = $('#mute');
function paintMute() { muteBtn.classList.toggle('off', !Snd.on); muteBtn.setAttribute('aria-label', Snd.on ? 'Sound on' : 'Sound off'); }
paintMute();
muteBtn.addEventListener('click', () => { Snd.on = !Snd.on; try { localStorage.setItem('sound', Snd.on ? 'on' : 'off'); } catch (e) {} paintMute(); if (Snd.on) Snd.tick(); });

// ---------- chart paper ----------
const FONT_DISPLAY = '"Bodoni Moda", Georgia, serif', FONT_BODY = '"DM Sans", sans-serif';
function fitCanvas(cv) {
  const dpr = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth || 300, H = cv.clientHeight || 100;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); return [c, W, H];
}
function paperBackground(c, W, H, offset) {
  c.fillStyle = CSS.sheet; c.fillRect(0, 0, W, H);
  const minor = 8, major = 40, o = ((offset % major) + major) % major;
  c.lineWidth = 1; c.strokeStyle = CSS.grid; c.beginPath();
  for (let x = -o; x < W; x += minor) { const px = Math.round(x) + 0.5; c.moveTo(px, 0); c.lineTo(px, H); }
  for (let y = 0; y < H; y += minor) { const py = Math.round(y) + 0.5; c.moveTo(0, py); c.lineTo(W, py); }
  c.stroke(); c.strokeStyle = CSS.gridMajor; c.beginPath();
  for (let x = -o; x < W; x += major) { const px = Math.round(x) + 0.5; c.moveTo(px, 0); c.lineTo(px, H); }
  for (let y = 0; y < H; y += major) { const py = Math.round(y) + 0.5; c.moveTo(0, py); c.lineTo(W, py); }
  c.stroke(); c.fillStyle = 'rgba(46,44,41,0.18)'; c.fillRect(0, 0, W, 1);
}

// ---------- the pictures in the viewfinder: streets and mountains, drawn ----------
let scenePool = null;
function makeScene(kind, seed) {
  const S = 300, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d'), r = mulberry32(seed);
  const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#dedad2'); g.addColorStop(1, '#b7b2a9'); c.fillStyle = g; c.fillRect(0, 0, S, S);
  if (kind === 'city') {
    let x = -10;
    while (x < S) { const w = 18 + r() * 40, h = 60 + r() * 150, sh = 70 + r() * 40; c.fillStyle = `rgb(${sh},${sh},${sh})`; c.fillRect(x, S - h, w, h); c.fillStyle = 'rgba(230,226,218,0.35)'; for (let wy = S - h + 8; wy < S - 10; wy += 11) for (let wx = x + 4; wx < x + w - 5; wx += 9) if (r() < 0.55) c.fillRect(wx, wy, 4, 6); x += w + 2 + r() * 6; }
    c.fillStyle = 'rgba(200,196,188,0.35)'; c.fillRect(0, S * 0.55, S, S * 0.45);
  } else {
    for (let L = 0; L < 3; L++) { const base = S * (0.45 + L * 0.15), amp = 40 - L * 8, sh = 150 - L * 35; c.fillStyle = `rgb(${sh},${sh},${sh})`; c.beginPath(); c.moveTo(0, S); for (let x = 0; x <= S; x += 4) c.lineTo(x, base - Math.abs(Math.sin(x * 0.021 + L * 1.7 + seed)) * amp - Math.sin(x * 0.09 + L) * 6 - (r() - 0.5) * 3); c.lineTo(S, S); c.closePath(); c.fill(); }
  }
  const img = c.getImageData(0, 0, S, S), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; } c.putImageData(img, 0, 0);
  return cv;
}
function scenes() { if (!scenePool) scenePool = { city: Array.from({ length: 7 }, (_, i) => makeScene('city', 11 + i)), mountain: Array.from({ length: 3 }, (_, i) => makeScene('mountain', 101 + i)) }; return scenePool; }

// ---------- a session: you are the lever ----------
const G = { on: false };
const PRE = 2.2, POST = 0.3, PX = 64, SR = 120, DUR = 30, SCENE = 0.8;
const gm = { root: $('#game'), paper: $('#paper'), vf: $('#vf'), vfBox: $('#viewfinder'), ripples: $('#ripples'), first: $('#firsttap'), sheet: $('#sheet'), sheetTrace: $('#sheet-trace'), yours: $('#sheet-yours'), chance: $('#sheet-chance'), fine: $('#sheet-fine') };
let gameMats = null, savedCam = null;
const dmnItems = () => items.filter(i => ['a3', 'hcp'].includes(i.key));
function startGame() {
  if (G.on) return; if (assembling) finishAssembly(); if (E.on) endProbe(); closeSheet();
  if (selected) { paint(selected, false); selected = null; el.card.classList.remove('on', 'selected'); }
  hover(null, 'game'); Snd.ensure();
  Object.assign(G, { on: true, t: 0, taps: 0, hits: 0, misses: 0, fas: 0, leads: [], drift: 0, fog: 0, samples: [], marks: [], all: [], lastSample: 0, lapses: [], scored: false, lastV: 0 });
  G.lapses.push({ t: 4.2, state: 'pending', demo: true });                        // the paper shows you one first
  let t = 8.4; for (let i = 0; i < 6; i++) { G.lapses.push({ t, state: 'pending' }); t += 2.9 + Math.random() * 1.6; }
  const P = scenes(), n = Math.ceil(DUR / SCENE) + 2; G.seq = [];
  for (let i = 0; i < n; i++) G.seq.push(P.city[Math.floor(Math.random() * P.city.length)]);
  for (const L of G.lapses) G.seq[Math.floor(L.t / SCENE) + 1] = P.mountain[Math.floor(Math.random() * P.mountain.length)];   // a mountain arrives at every lapse
  gameMats = dmnItems().map(it => { const m = it.mat.clone(); m.emissive = srgb(ACCENT); m.emissiveIntensity = 0; it.pieces.forEach(p => p.mesh.material = m); return m; });
  stage.classList.add('gaming'); gm.root.hidden = false; gm.sheet.hidden = true; gm.paper.classList.remove('tearing'); gm.paper.style.opacity = ''; gm.ripples.innerHTML = '';
  gm.first.textContent = coarse ? 'tap anywhere when you feel it slipping' : 'space, when you feel it slipping'; gm.first.hidden = false; gm.first.classList.remove('off'); setTimeout(() => gm.first.classList.add('off'), 3400);
  savedCam = { ...goal }; flyTo({ theta: -1.1, phi: 1.22, r: fit * 0.9, tx: 0, ty: 0.08, tz: 0 }, 900);
  stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}
function tap(auto) {
  if (!G.on) return;
  const L = G.lapses.find(l => l.state === 'pending' && G.t >= l.t - PRE && G.t <= l.t + POST);
  if (L && L.demo && !auto) return;             // the demonstration is the paper's turn
  if (!L && !G.scored) return;                  // nothing counts until it is over
  Snd.tick(); ripple();
  if (L) { L.state = 'hit'; L.at = G.t; if (!L.demo) { G.hits++; G.leads.push(L.t - G.t); G.taps++; } G.marks.push({ t: G.t, kind: 'hit', v: G.lastV }); G.fog = -0.6; }
  else { G.fas++; G.taps++; G.marks.push({ t: G.t, kind: 'early' }); }
}
function ripple() {
  const a = byKey.get('focuskit'); if (!a || reduceMotion) return;
  v3.copy(a.anchor).sub(C0).project(camera);
  const s = document.createElement('span'); s.style.left = ((v3.x + 1) / 2 * stage.clientWidth) + 'px'; s.style.top = ((1 - v3.y) / 2 * stage.clientHeight) + 'px';
  gm.ripples.appendChild(s); setTimeout(() => s.remove(), 900);
}
function gameFrame(dt) {
  if (!G.on) return;
  G.t += dt;
  for (const L of G.lapses) {
    if (L.demo && L.state === 'pending' && G.t >= L.t - 0.7) tap(true);
    if (L.state === 'pending' && G.t > L.t + POST) { L.state = 'miss'; if (!L.demo) G.misses++; G.fog = 1; G.marks.push({ t: L.t, kind: 'miss' }); }
    if (L.demo && L.state !== 'pending' && G.t > L.t + 1.2) G.scored = true;
  }
  let target = 0; for (const L of G.lapses) if (L.state === 'pending') { const k = 1 - (L.t - G.t) / PRE; if (k > 0 && k < 1.2) target = Math.max(target, Math.min(1, k)); }
  G.drift += (target - G.drift) * (1 - Math.pow(target > G.drift ? 0.1 : 0.002, dt));
  G.fog *= Math.pow(0.12, dt);
  gameMats.forEach(m => { m.emissiveIntensity = 0.55 * G.drift; });
  gm.vfBox.style.filter = `blur(${(G.drift * 4.5 + Math.max(0, G.fog) * 7).toFixed(2)}px)`;
  while (G.lastSample < G.t) { G.lastSample += 1 / SR; const v = traceValue(G.lastSample); G.lastV = v; G.samples.push({ t: G.lastSample, v }); if (G.all.length < G.lastSample * 60) G.all.push(v); }
  const cut = G.t - gm.paper.clientWidth / PX - 1; while (G.samples.length && G.samples[0].t < cut) G.samples.shift();
  drawPaper(); drawViewfinder();
  if (G.t >= DUR) endGame(false);
}
let noiseState = 0;
function traceValue(t) {
  noiseState = noiseState * 0.86 + (Math.random() - 0.5) * 0.9;
  let v = noiseState * 0.35 + Math.sin(2 * Math.PI * 10 * t) * 0.18 * (1 - 0.6 * G.drift);
  for (const L of G.lapses) {
    const k = 1 - (L.t - t) / PRE;
    if (L.state !== 'hit' && k > 0 && t <= L.t + POST) v += Math.sin(2 * Math.PI * 1.3 * (t - L.t)) * Math.min(1, k) * 0.9;
    else if (L.state === 'hit' && t > L.at && t < L.at + 0.6) v += Math.sin(2 * Math.PI * 1.3 * (t - L.t)) * 0.9 * (1 - (t - L.at) / 0.6);
  }
  return v;
}
function drawPaper() {
  const [c, W, H] = fitCanvas(gm.paper);
  paperBackground(c, W, H, G.t * PX);
  const penX = W - 96, x = t => penX - (G.t - t) * PX, y0 = H * 0.56, A = H * 0.26;
  for (const m of G.marks) if (m.kind === 'miss') { c.fillStyle = CSS.soft; c.fillRect(x(m.t - PRE), 1, PRE * PX, H - 1); }
  for (const L of G.lapses) if (L.demo && L.state !== 'pending') { const px = x(L.t - PRE + 0.2); if (px > -40 && px < W) { c.fillStyle = CSS.mid; c.font = `italic 15px ${FONT_DISPLAY}`; c.fillText('here', px, 20); } }
  c.beginPath(); let first = true;
  for (const s of G.samples) { const px = x(s.t); if (px < -2 || px > penX) continue; const py = y0 - s.v * A; first ? c.moveTo(px, py) : c.lineTo(px, py); first = false; }
  c.strokeStyle = CSS.ink; c.lineWidth = 1.25; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
  for (const m of G.marks) {
    const px = x(m.t); if (px < -6 || px > W) continue;
    if (m.kind === 'hit') { c.fillStyle = CSS.ink; c.beginPath(); c.arc(px, y0 - (m.v || 0) * A, 3.6, 0, Math.PI * 2); c.fill(); }
    else if (m.kind === 'early') { c.strokeStyle = CSS.light; c.lineWidth = 1; c.beginPath(); c.moveTo(px, y0 + A * 1.15); c.lineTo(px, y0 + A * 1.6); c.stroke(); }
  }
  c.fillStyle = CSS.ink; c.beginPath(); c.arc(penX, y0 - G.lastV * A, 1.8, 0, Math.PI * 2); c.fill();
}
function drawViewfinder() {
  const cv = gm.vf, c = cv.getContext('2d'), S = cv.width, i = Math.floor(G.t / SCENE), k = G.t / SCENE - i;
  const a = G.seq[Math.min(i, G.seq.length - 1)], b = G.seq[Math.min(i + 1, G.seq.length - 1)];
  c.globalAlpha = 1; c.drawImage(a, 0, 0, S, S); c.globalAlpha = k; c.drawImage(b, 0, 0, S, S); c.globalAlpha = 1;
}
function endGame(aborted) {
  if (!G.on) return; G.on = false;
  gameMats.forEach(m => m.dispose()); dmnItems().forEach(it => it.pieces.forEach(p => p.mesh.material = it.mat));
  gm.vfBox.style.filter = ''; gm.first.hidden = true;
  if (aborted) { gm.root.hidden = true; stage.classList.remove('gaming'); if (savedCam) { flyTo(savedCam, 900); savedCam = null; } return; }
  Snd.tear(); gm.paper.classList.add('tearing');
  setTimeout(() => { gm.paper.style.opacity = '0'; showSheet(); }, reduceMotion ? 0 : 520);
}
function showSheet() {
  const scored = G.lapses.filter(L => !L.demo), n = scored.length, taps = Math.max(1, G.taps);
  let sum = 0; const DRAWS = 400;
  for (let d = 0; d < DRAWS; d++) { const r = Array.from({ length: taps }, () => 8 + Math.random() * (DUR - 8)); sum += scored.filter(L => r.some(t => t >= L.t - PRE && t <= L.t + POST)).length; }
  const chance = sum / DRAWS, plain = mode === 'plain', lead = G.leads.length ? (G.leads.reduce((a, b) => a + b, 0) / G.leads.length).toFixed(1) : null;
  gm.yours.textContent = `${G.hits} of ${n}`; gm.chance.textContent = `${chance.toFixed(1)} of ${n}`;
  gm.fine.innerHTML = (plain
    ? `Your ${taps} tap${taps === 1 ? '' : 's'}, timed by the brain, against the same ${taps} at random. That gap is the whole product, and nobody has measured it on a real head.`
    : `${taps} tap${taps === 1 ? '' : 's'} timed by a state readout, against the same ${taps} on a yoked random schedule${lead ? `, landing ${lead} s ahead on average` : ''}. That contrast is the claim, and it has not been measured properly on a real head.`)
    + `<a href="#" id="sheet-missing">the missing piece</a><a href="#" id="sheet-again">again</a>`;
  gm.sheet.hidden = false; requestAnimationFrame(drawSheetTrace);
  $('#sheet-missing').onclick = e => { e.preventDefault(); closeSheet(); select(byKey.get('lever')); if (innerWidth <= 900) $('#missing').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); };
  $('#sheet-again').onclick = e => { e.preventDefault(); closeSheet(); startGame(); };
}
function drawSheetTrace() {
  const [c, W, H] = fitCanvas(gm.sheetTrace); paperBackground(c, W, H, 0);
  const x = t => t / DUR * W, y0 = H * 0.55, A = H * 0.3;
  for (const m of G.marks) if (m.kind === 'miss') { c.fillStyle = CSS.soft; c.fillRect(x(m.t - PRE), 1, PRE / DUR * W, H - 1); }
  c.beginPath(); G.all.forEach((v, i) => { const px = x(i / 60), py = y0 - v * A; i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.strokeStyle = CSS.ink; c.lineWidth = 1; c.stroke();
  for (const m of G.marks) { const px = x(m.t); if (m.kind === 'hit') { c.fillStyle = CSS.ink; c.beginPath(); c.arc(px, y0 - (m.v || 0) * A, 3, 0, Math.PI * 2); c.fill(); } else if (m.kind === 'early') { c.strokeStyle = CSS.light; c.lineWidth = 1; c.beginPath(); c.moveTo(px, y0 + A * 1.1); c.lineTo(px, y0 + A * 1.5); c.stroke(); } }
}
function closeSheet() {
  const wasOpen = !gm.sheet.hidden;
  gm.sheet.hidden = true; if (!G.on) { gm.root.hidden = true; stage.classList.remove('gaming'); }
  gm.paper.classList.remove('tearing'); gm.paper.style.opacity = '';
  if (wasOpen && savedCam && !G.on) { flyTo(savedCam, 900); savedCam = null; }
}
$('#run-btn').addEventListener('click', startGame); $('#run-mini').addEventListener('click', startGame);

// ---------- place the electrode: three leads into the same paper ----------
// A cartoon of the literature, not data: each scalp area gets a lead time, how many lapses it shows, and its usual noise.
const SITES = {
  temple:    { test: /pars(orbitalis|triangularis|opercularis)|temporalpole/, name: 'the temple', lead: 2.0, vis: 0.85, noise: 0.35, sig: 'slow' },
  frontal:   { test: /superiorfrontal|middlefrontal|frontalpole|lateralorbitofrontal/, name: 'the forehead', lead: 1.8, vis: 0.7, noise: 0.5, sig: 'slow' },
  occipital: { test: /lateraloccipital|cuneus|pericalcarine|lingual/, name: 'the back of the head', lead: 0.9, vis: 0.6, noise: 0.25, sig: 'alpha' },
  parietal:  { test: /parietal|supramarginal|precuneus|paracentral/, name: 'the crown', lead: 1.2, vis: 0.55, noise: 0.3, sig: 'slow' },
  central:   { test: /precentral|postcentral/, name: 'over the motor strip', lead: 0.6, vis: 0.3, noise: 0.3, sig: 'mu' },
  temporal:  { test: /middletemporal|inferiortemporal|superiortemporal|bankssts|transversetemporal|fusiform/, name: 'above the ear', lead: 1.4, vis: 0.5, noise: 0.75, sig: 'muscle' }
};
function siteOf(piece) { const r = piece.name.split('-')[1]; for (const k in SITES) if (SITES[k].test.test(r)) return { key: k, ...SITES[k] }; return null; }
const E = { on: false, placed: [] };
const pb = { root: $('#probe'), wires: $('#wires'), paper: $('#probe-paper'), line: $('#probe-line'), clear: $('#probe-clear'), done: $('#probe-done') };
const cupMat = new THREE.MeshStandardMaterial({ color: srgb(0xD9B25A), metalness: 0.85, roughness: 0.3 });
const cupGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.02, 24); cupGeo.rotateX(Math.PI / 2);
const cursorCup = new THREE.Mesh(cupGeo, cupMat.clone()); cursorCup.material.transparent = true; cursorCup.material.opacity = 0.7; cursorCup.visible = false; scene.add(cursorCup);
const up0 = new THREE.Vector3(0, 0, 1);
function placeCup(mesh, hit) { mesh.position.copy(hit.point).addScaledVector(hit.face.normal, 0.012); mesh.quaternion.setFromUnitVectors(up0, hit.face.normal); }
function hitAt(x, y) {
  const b = canvas.getBoundingClientRect(); ndc.set(((x - b.left) / b.width) * 2 - 1, -((y - b.top) / b.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObjects(meshes.filter(m => m.visible && m.parent.parent.visible), false)[0] || null;
}
function startProbe() {
  if (E.on) return; if (G.on) endGame(true); if (assembling) finishAssembly(); closeSheet();
  if (selected) { paint(selected, false); selected = null; el.card.classList.remove('on', 'selected'); }
  hover(null, 'probe'); if (insideOn) { insideOn = false; hemis.R.group.visible = true; }
  E.on = true; E.placed = []; stage.classList.add('probing'); pb.root.hidden = false; pb.wires.innerHTML = ''; footLine();
  savedCam = { ...goal }; flyTo({ theta: -2.0, phi: 1.25, r: fit, tx: 0, ty: 0, tz: 0 }, 900);
  stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}
let footTimer = 0;
function footLine(msg) {
  clearTimeout(footTimer);
  if (msg) { pb.line.textContent = msg; footTimer = setTimeout(() => footLine(), 1800); return; }
  const n = E.placed.length;
  pb.line.textContent = n === 0 ? (coarse ? 'tap the brain to drop an electrode' : 'drop an electrode on the brain') : n === 1 ? 'one more, to compare' : verdict();
}
function verdict() {
  const score = e => e.site.vis * (0.5 + e.site.lead / 2.5) - e.site.noise * 0.3;
  const best = [...E.placed].sort((a, b) => score(b) - score(a))[0];
  if (best.site.key === 'temple') return `${best.n} warns first, at the temple: where FocusKit's one electrode sits.`;
  return `${best.n} warns first. The temple would warn earlier, with fewer blinks: FocusKit's spot.`;
}
function probeHover(x, y) { const h = E.on ? hitAt(x, y) : null; cursorCup.visible = !!h && E.placed.length < 3; if (h) placeCup(cursorCup, h); }
function probePlace(x, y) {
  const h = hitAt(x, y); if (!h) return;
  if (E.placed.length >= 3) { footLine('three is enough'); return; }
  const piece = h.object.userData.piece, site = siteOf(piece);
  if (!site) { footLine('no scalp above this spot'); return; }
  Snd.place();
  const cup = new THREE.Mesh(cupGeo, cupMat); placeCup(cup, h); scene.add(cup);
  const badge = document.createElement('div'); badge.className = 'e'; badge.textContent = E.placed.length + 1; el.labels.appendChild(badge);
  const wire = document.createElementNS('http://www.w3.org/2000/svg', 'path'); pb.wires.appendChild(wire);
  const n = E.placed.length + 1;
  E.placed.push({ site, piece, cup, badge, wire, anchor: cup.position.clone(), normal: h.face.normal.clone(), n, t0: performance.now(), trace: makeSiteTrace(site, n) });
  cursorCup.visible = false; footLine();
}
function makeSiteTrace(site, seed) {
  const N = 420, span = 6, lapseT = 4.6, out = new Float32Array(N), rnd = mulberry32(3 + seed * 7 + Math.round(site.lead * 10)), noise = () => rnd() + rnd() + rnd() - 1.5; let ns = 0;
  for (let i = 0; i < N; i++) {
    const t = i / N * span; ns = ns * 0.85 + noise() * site.noise * 0.9;
    let v = ns * 0.3 + Math.sin(2 * Math.PI * 10 * t) * (site.sig === 'alpha' ? 0.25 + (t > lapseT - site.lead ? 0.45 * Math.min(1, (t - lapseT + site.lead) / site.lead) : 0) : 0.1);
    const k = (t - (lapseT - site.lead)) / site.lead;
    if (site.sig === 'slow' && k > 0 && t < lapseT + 0.3) v += Math.sin(2 * Math.PI * 1.3 * (t - lapseT)) * Math.min(1, k) * 0.9 * site.vis;
    if (site.sig === 'mu') v += Math.sin(2 * Math.PI * 11 * t) * 0.3 * (rnd() < 0.5 ? 1 : 0.3);
    if (site.sig === 'muscle') v += (rnd() - 0.5) * 1.2 * (Math.sin(t * 1.7) > 0.3 ? 1 : 0.2);
    if (site.key === 'frontal' && (Math.abs(t - 1.1) < 0.12 || Math.abs(t - 3.3) < 0.12)) v += 1.6 * Math.cos((t - (t < 2 ? 1.1 : 3.3)) / 0.12 * Math.PI / 2);
    out[i] = v;
  }
  return out;
}
function drawProbePaper() {
  const [c, W, H] = fitCanvas(pb.paper); paperBackground(c, W, H, 0);
  const n = E.placed.length; if (!n) return;
  const span = 6, lapseT = 4.6, left = 64, right = W - 28, x = t => left + t / span * (right - left), laneH = (H - 12) / 3;
  c.fillStyle = CSS.accent; c.fillRect(Math.round(x(lapseT)), 4, 1, H - 8);
  E.placed.forEach((e, i) => {
    const top = 8 + laneH * i, y0 = top + laneH * 0.58, A = laneH * 0.28, p = reduceMotion ? 1 : Math.min(1, (performance.now() - e.t0) / 1200);
    c.fillStyle = CSS.soft; c.fillRect(x(lapseT - e.site.lead), top + 2, e.site.lead / span * (right - left), laneH - 4);
    c.fillStyle = CSS.mid; c.font = `500 10.5px ${FONT_BODY}`; c.fillText(String(e.n), 28, y0 + 4);
    c.font = `italic 12px ${FONT_DISPLAY}`; c.fillStyle = CSS.light; c.fillText(e.site.name, 44, top + 12);
    const N = e.trace.length, upto = Math.floor(N * p); c.beginPath();
    for (let j = 0; j < upto; j++) { const px = x(j / N * span), py = y0 - e.trace[j] * A; j ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.strokeStyle = CSS.ink; c.lineWidth = 1.1; c.lineJoin = 'round'; c.stroke();
    if (p < 1 && upto) { c.fillStyle = CSS.ink; c.beginPath(); c.arc(x(upto / N * span), y0 - e.trace[upto - 1] * A, 1.8, 0, Math.PI * 2); c.fill(); }
  });
  c.fillStyle = CSS.light; c.font = `10.5px ${FONT_BODY}`; c.fillText('lapse', x(lapseT) + 5, H - 6);
}
function updateWires() {
  const w = stage.clientWidth, h = stage.clientHeight, paperTop = h - pb.paper.clientHeight;
  pb.wires.setAttribute('viewBox', `0 0 ${w} ${h}`);
  for (const e of E.placed) {
    v3.copy(e.anchor); camDir.copy(camera.position).sub(v3).normalize(); const facing = camDir.dot(e.normal); v3.project(camera);
    const x1 = (v3.x + 1) / 2 * w, y1 = (1 - v3.y) / 2 * h, x2 = 24 + (e.n - 1) * 9, y2 = paperTop + 1;
    const sag = 36 + Math.hypot(x2 - x1, y2 - y1) * 0.14, cx = (x1 + x2) / 2, cy = Math.max(y1, y2) + sag;
    e.wire.setAttribute('d', `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${Math.min(cy, y2 + 20).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    e.wire.style.opacity = facing > 0 ? 0.8 : 0.25;
    e.badge.style.left = x1 + 'px'; e.badge.style.top = y1 + 'px'; e.badge.style.opacity = facing > 0 ? 1 : 0.15;
  }
}
function placeProbeLabels() { if (!E.on) return; updateWires(); drawProbePaper(); }
function clearProbe() { E.placed.forEach(e => { scene.remove(e.cup); e.badge.remove(); e.wire.remove(); }); E.placed = []; footLine(); }
function endProbe() { if (!E.on) return; clearProbe(); E.on = false; cursorCup.visible = false; stage.classList.remove('probing'); pb.root.hidden = true; if (savedCam) { flyTo(savedCam, 900); savedCam = null; } }
$('#probe-btn').addEventListener('click', startProbe); $('#probe-mini').addEventListener('click', () => E.on ? endProbe() : startProbe());
pb.clear.addEventListener('click', e => { e.preventDefault(); clearProbe(); }); pb.done.addEventListener('click', e => { e.preventDefault(); endProbe(); });

// ---------- main loop ----------
function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (meshes.length) computeFit(); }
new ResizeObserver(resize).observe(stage); resize();
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  runTweens(now); gameFrame(dt);
  if (!flying) { const k = 1 - Math.pow(0.001, dt); for (const key of ['theta', 'phi', 'r', 'tx', 'ty', 'tz']) cam[key] += (goal[key] - cam[key]) * k; }
  const idle = (now - lastInput) / 1000 > 3 && !selected && !assembling && !reduceMotion;
  const swayGoal = idle ? Math.sin(now * 0.00035) * 0.16 : 0;
  sway += (swayGoal - sway) * (1 - Math.pow(idle ? 0.3 : 0.02, dt));
  applyCamera(); placeLabels(); placeProbeLabels();
  renderer.render(scene, camera);
}

window.__brain = { pick: (x, y) => pick(x, y), items, pieces, camera, get meshes() { return meshes; }, hover, select };
const ready = load().then(mats => { el.loading.classList.add('off'); applyCamera(); requestAnimationFrame(frame); return mats; })
  .catch(err => { console.error(err); el.loading.textContent = 'The brain did not load. The pieces are listed below.'; });
function enter(m) {
  setMode(m === 'plain' ? 'plain' : 'expert');
  entry.classList.add('off'); setTimeout(() => { entry.hidden = true; }, 750);
  ready.then(mats => { if (mats) assemble(mats); });
}
enterImpl = enter;
if (mode) { entry.hidden = true; renderLists(); ready.then(mats => { if (mats) assemble(mats); }); }
else if (pendingMode) enter(pendingMode);
})();
