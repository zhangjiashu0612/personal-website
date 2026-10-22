/* Lucas Zhang: a brain in pieces, as a portfolio.
   Reads window.SITE (pieces.js), assets/brain.{json,bin} (build_assets.py) and assets/frame.glb. Three.js r128. */
(() => {
'use strict';
const S = window.SITE;
const $ = (s, el = document) => el.querySelector(s);
const stage = $('#stage'), canvas = $('#brain');
const el = {
  loading: $('#loading'), counter: $('#counter'), caption: $('#caption'), hint: $('#hint'), labels: $('#labels'), weather: $('#weather'), mech: $('#mech'),
  float: $('#floatlabel'), tip: $('#regiontip'), views: $('#views'), card: $('#card'), cardClose: $('#card-close'),
  kicker: $('#card-kicker'), title: $('#card-title'), body: $('#card-body'), status: $('#card-status'),
  signal: $('#card-signal'), signalLabel: $('#card-signal-label'), links: $('#card-links'), paper: $('#paper'),
  areas: $('#areas'), missingList: $('#missing-list'), choices: $('#choices'), statecard: $('#statecard'), statecardText: $('#statecard-text'),
  buildStory: $('#build-story'), buildMech: $('#build-mech'), buildPicked: $('#build-picked'), buildTabs: $('#build-tabs')
};
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
let hovered = null, selected = null, hoverSource = null, hoveredPiece = null;

const PAPER = 0xF2EDE4, INK = 0x2E2C29, NEUTRAL = 0xD4CDC0, ACCENT = 0xB5362A;
const CSS = { ink: '#2E2C29', accent: '#B5362A', light: '#A89F94', mid: '#6B6560', soft: 'rgba(181,54,42,0.12)', sheet: '#F8F4EC', grid: 'rgba(46,44,41,0.06)', gridMajor: 'rgba(46,44,41,0.13)' };
const FONT_DISPLAY = '"Bodoni Moda", Georgia, serif', FONT_BODY = '"DM Sans", sans-serif';
const srgb = hex => new THREE.Color(hex).convertSRGBToLinear();
const NAMES = { bankssts: 'Banks of the superior temporal sulcus', caudalanteriorcingulate: 'Caudal anterior cingulate', caudalmiddlefrontal: 'Caudal middle frontal', cuneus: 'Cuneus', entorhinal: 'Entorhinal', fusiform: 'Fusiform', inferiorparietal: 'Inferior parietal', inferiortemporal: 'Inferior temporal', isthmuscingulate: 'Isthmus cingulate', lateraloccipital: 'Lateral occipital', lateralorbitofrontal: 'Lateral orbitofrontal', lingual: 'Lingual', medialorbitofrontal: 'Medial orbitofrontal', middletemporal: 'Middle temporal', parahippocampal: 'Parahippocampal', paracentral: 'Paracentral', parsopercularis: 'Pars opercularis', parsorbitalis: 'Pars orbitalis', parstriangularis: 'Pars triangularis', pericalcarine: 'Pericalcarine', postcentral: 'Postcentral', posteriorcingulate: 'Posterior cingulate', precentral: 'Precentral', precuneus: 'Precuneus', rostralanteriorcingulate: 'Rostral anterior cingulate', rostralmiddlefrontal: 'Rostral middle frontal', superiorfrontal: 'Superior frontal', superiorparietal: 'Superior parietal', superiortemporal: 'Superior temporal', supramarginal: 'Supramarginal', frontalpole: 'Frontal pole', temporalpole: 'Temporal pole', transversetemporal: 'Transverse temporal', insula: 'Insula', medialwall: 'Medial wall' };
const prettyRegion = name => { const [h, r] = name.split('-'); return (h === 'lh' ? 'Left ' : 'Right ') + (NAMES[r] || r).toLowerCase(); };

// ---------- content: everything on the left comes from pieces.js ----------
const items = [];
S.projects.forEach((p, i) => items.push({ ...p, kind: 'project', index: i, pieces: [] }));
S.missing.forEach((m, i) => items.push({ ...m, kind: 'missing', index: S.projects.length + i, pieces: [] }));
const byKey = new Map(items.map(it => [it.key, it]));

$('#hello-hey').textContent = S.hello.hey; $('#hello-h1').textContent = S.hello.h1; $('#hello-lead').textContent = S.hello.lead; $('#hello-toc').textContent = S.hello.toc || '';
$('#mail-link').href = 'mailto:' + S.email; $('#mail-link').textContent = S.email;
['#rail-gh', '#top-gh', '#who-github'].forEach(q => { $(q).href = S.github; }); ['#rail-mail', '#top-mail', '#who-mail'].forEach(q => { $(q).href = 'mailto:' + S.email; });
$('#who-lines').innerHTML = S.who.map(l => `<span>${l}</span>`).join('<br>');
if (S.cv) { const a = $('#cv-link'); a.href = S.cv; a.hidden = false; }
if (S.photo) { $('#who-photo').innerHTML = `<img src="${S.photo}" alt="Lucas Zhang">`; $('#portrait').innerHTML = `<img src="${S.photo}" alt="Lucas Zhang">`; }
$('#looking-text').textContent = S.looking;
$('#now-when').textContent = S.now.when;
$('#now-lines').innerHTML = S.now.lines.map(l => `<li>${l}</li>`).join('');
$('#now-photos').innerHTML = S.now.photos.map(p => `<figure>${p.src ? `<img src="${p.src}" alt="" loading="lazy">` : `<div class="ph">photo</div>`}<figcaption>${p.caption}</figcaption></figure>`).join('');
$('#question-text').textContent = S.question;
el.buildStory.innerHTML = S.build.story.map(t => `<p>${t}</p>`).join('');
el.buildMech.innerHTML = S.build.mechanics.map(([h, t]) => `<p>${h ? `<b>${h}</b>` : ''}${t}</p>`).join('');

function li(it) {
  const node = document.createElement('li'); node.dataset.key = it.key;
  const chip = `<span class="chip ${it.kind === 'missing' ? 'hollow' : ''}" style="${it.kind === 'project' ? 'background:' + it.color : ''}"></span>`;
  const year = `<span class="year">${it.kind === 'project' ? it.year : '?'}</span>`;
  const text = it.kind === 'project' ? it.blurb.split(/(?<=\.)\s/)[0] : it.question;
  const show = `<a href="#" class="showme">show on the brain</a>`;
  const links = (it.links || []).map(l => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join('');
  const dossier = it.kind === 'project'
    ? `<div class="dossier"><p>${it.blurb}</p>${it.how ? `<p><b>How</b>${it.how}</p>` : ''}${it.result ? `<p><b>What came out</b>${it.result}</p>` : ''}${it.figure ? `<figure><img src="${it.figure}" alt="" loading="lazy"><figcaption>${it.figcaption || ''}</figcaption></figure>` : ''}<p class="l">${links}${show}</p></div>`
    : `<div class="dossier"><p>${it.question}</p><p class="l"><a href="mailto:${S.email}?subject=${encodeURIComponent(it.title)}">Write to me</a>${show}</p></div>`;
  node.innerHTML = `<div class="head">${chip}${year}<div><div class="t">${it.title}</div><p class="d">${text}</p>${it.then ? `<p class="then">${it.then}</p>` : ''}</div></div>${dossier}`;
  const head = node.querySelector('.head');
  head.addEventListener('mouseenter', () => { if (!coarse) hover(it, 'list'); });
  head.addEventListener('mouseleave', () => { if (!coarse) hover(null, 'list'); });
  head.addEventListener('click', () => { const open = !node.classList.contains('open'); document.querySelectorAll('.piece-list li.open').forEach(n => { if (n !== node) n.classList.remove('open'); }); node.classList.toggle('open', open); });
  node.querySelector('.showme').addEventListener('click', e => { e.preventDefault(); select(it); if (innerWidth <= 900) stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); });
  return node;
}
S.areas.forEach(a => {
  const box = document.createElement('div'); box.className = 'area'; box.innerHTML = `<h3>${a.title}</h3>`;
  const ol = document.createElement('ol'); ol.className = 'piece-list';
  a.keys.forEach(k => { const it = byKey.get(k); if (it) ol.appendChild(li(it)); });
  box.appendChild(ol); el.areas.appendChild(box);
});
function renderMissing(firstKey) {
  el.missingList.innerHTML = '';
  const list = items.filter(i => i.kind === 'missing').slice();
  if (firstKey) { const i = list.findIndex(x => x.key === firstKey); if (i > 0) list.unshift(list.splice(i, 1)[0]); }
  list.forEach(it => el.missingList.appendChild(li(it)));
}
renderMissing(null);

// ---------- renderer / scene ----------
let renderer = null;
try {
  if (location.search.includes('nowebgl')) throw new Error('forced');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('no context');
} catch (e) {
  document.body.classList.add('no-webgl'); el.loading.classList.add('off');
  stage.insertAdjacentHTML('afterbegin', `<img class="still" src="assets/brain-still.webp" alt="The brain as a puzzle: coloured pieces are projects, pale ones are open questions"><p class="still-note">Your browser has WebGL switched off, so the brain is a picture here. In Chrome or Safari with hardware acceleration on, it turns and answers.</p>`);
}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 60); scene.add(camera);
scene.add(new THREE.HemisphereLight(0xfff8ee, 0xc9cfc6, 0.56));
const lamp = (c, i, x, y, z) => { const l = new THREE.DirectionalLight(c, i); l.position.set(x, y, z); camera.add(l); return l; };
lamp(0xfff4e6, 0.62, -5, 4.5, 1.5); lamp(0xffffff, 0.30, 4, 2, -9); lamp(0xffffff, 0.10, 3, -1.5, 2);
const world = new THREE.Group(); scene.add(world);

function aoMat(opts) {
  const m = new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.62, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }, opts));
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float ao; varying float vAo;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvAo = ao * 1.275;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vAo;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb *= vAo;');
  };
  m.customProgramCacheKey = () => 'ao';
  return m;
}
const matNeutral = aoMat({ color: srgb(NEUTRAL), transparent: true, opacity: 0 });
const matNeutralHot = aoMat({ color: srgb(NEUTRAL), emissive: srgb(ACCENT), emissiveIntensity: 0.14 });
const matMissing = aoMat({ color: srgb(PAPER), transparent: true, opacity: 0 });
const matMissingHot = aoMat({ color: srgb(PAPER), emissive: srgb(ACCENT), emissiveIntensity: 0.10 });
items.forEach(it => { if (it.kind === 'project') { const c = srgb(it.color); it.mat = aoMat({ color: c }); it.hot = aoMat({ color: c.clone(), emissive: c.clone(), emissiveIntensity: 0.28 }); it.fade = aoMat({ color: c.clone() }); } });

// ---------- tweens ----------
const tweens = new Set();
const easeOutCubic = k => 1 - Math.pow(1 - k, 3), easeInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const easeOutBack = k => { const c = 1.25; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
function tween(dur, fn, ease = easeOutCubic) { return new Promise(res => { if (dur <= 0 || reduceMotion) { fn(1); res(); return; } tweens.add({ t0: performance.now(), dur, fn, ease, res }); }); }
function runTweens(now) { for (const t of tweens) { const k = Math.min(1, (now - t.t0) / t.dur); t.fn(t.ease(k)); if (k >= 1) { tweens.delete(t); t.res(); } } }
const wait = ms => new Promise(r => setTimeout(r, reduceMotion ? 0 : ms));

// ---------- camera ----------
let fit = 4.4, brainR = 1.5; const C0 = new THREE.Vector3(); const brainBox = new THREE.Box3();
const HOME = { theta: -2.2, phi: 1.15 };
const cam = { theta: 1.3, phi: 1.2, r: 4.4, tx: 0, ty: 0, tz: 0 };
const goal = { theta: HOME.theta, phi: HOME.phi, r: 4.4, tx: 0, ty: 0, tz: 0 };
let sway = 0, swayAmp = 0.16, lastInput = -1e9, flying = false, camOwner = 'section';
function computeFit() { const vf = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect); const f = brainR / Math.sin(Math.min(vf, hf) / 2) * 1.04; if (fit) { const k = f / fit; cam.r *= k; goal.r *= k; } fit = f; }
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
const home = (extra = {}) => ({ theta: HOME.theta, phi: HOME.phi, r: fit, tx: 0, ty: 0, tz: 0, ...extra });
function viewOf(it, zoom = 0.7, pull = 0.45) { const o = it.out; return { theta: Math.atan2(o.x, o.z), phi: Math.min(2.6, Math.max(0.5, Math.acos(Math.max(-1, Math.min(1, o.y))))), r: fit * zoom, tx: (it.center.x - C0.x) * pull, ty: (it.center.y - C0.y) * pull, tz: (it.center.z - C0.z) * pull }; }

// ---------- the brain ----------
const hemis = {}, pieces = [], pieceById = new Map(); let meshes = [], mats = null;
async function load() {
  const [meta, buf] = await Promise.all([fetch('assets/brain.json').then(r => r.json()), fetch('assets/brain.bin').then(r => r.arrayBuffer())]);
  const view = k => { const L = meta.layout[k]; const T = { int16: Int16Array, uint16: Uint16Array, uint8: Uint8Array }[L.dtype]; return new T(buf, L.offset, L.length); };
  for (const h of ['L', 'R']) {
    const q = view(h + '.pos'), pos = new Float32Array(q.length); for (let i = 0; i < q.length; i++) pos[i] = q[i] * meta.scale;
    const idx = view(h + '.idx'), full = new THREE.BufferGeometry(), posAttr = new THREE.BufferAttribute(pos, 3);
    full.setAttribute('position', posAttr); full.setIndex(new THREE.BufferAttribute(idx, 1)); full.computeVertexNormals();
    const group = new THREE.Group(); world.add(group);
    hemis[h] = { posAttr, nrmAttr: full.getAttribute('normal'), aoAttr: new THREE.BufferAttribute(view(h + '.ao'), 1, true), idx, reg: view(h + '.reg'), edges: view(h + '.edges'), group };
  }
  for (const p of meta.pieces) {
    if (!p.faces) continue;
    const H = hemis[p.hemi], g = new THREE.BufferGeometry();
    g.setAttribute('position', H.posAttr); g.setAttribute('normal', H.nrmAttr); g.setAttribute('ao', H.aoAttr);
    g.setIndex(new THREE.BufferAttribute(H.idx.subarray(p.faces[0] * 3, (p.faces[0] + p.faces[1]) * 3), 1));
    const center = new THREE.Vector3(...p.center); g.boundingSphere = new THREE.Sphere(center.clone(), p.radius);
    const mesh = new THREE.Mesh(g, matNeutral); mesh.position.copy(center).negate();
    const pivot = new THREE.Group(); pivot.position.copy(center); pivot.add(mesh); H.group.add(pivot);
    const piece = { id: p.id, name: p.name, hemi: p.hemi, mesh, pivot, center, out: new THREE.Vector3(...p.out), anchor: p.anchor ? new THREE.Vector3(...p.anchor) : center.clone(), kind: 'neutral', owner: null };
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
    it.anchor = it.pieces.length ? it.pieces[0].anchor : it.center; it.hemi = it.pieces.length ? it.pieces[0].hemi : 'L';
  });
  meshes = pieces.map(p => p.mesh);
  for (const h of ['L', 'R']) brainBox.expandByObject(hemis[h].group); brainBox.getCenter(C0); world.position.copy(C0).negate();
  let r2 = 0; for (const h of ['L', 'R']) { const A = hemis[h].posAttr.array; for (let i = 0; i < A.length; i += 3) { const d = (A[i] - C0.x) ** 2 + (A[i + 1] - C0.y) ** 2 + (A[i + 2] - C0.z) ** 2; if (d > r2) r2 = d; } }
  brainR = Math.sqrt(r2); fit = 0; computeFit(); cam.r = goal.r = fit;
  const edgeMat = new THREE.LineBasicMaterial({ color: srgb(INK), transparent: true, opacity: 0 });
  for (const h of ['L', 'R']) { const g = new THREE.BufferGeometry(); g.setAttribute('position', hemis[h].posAttr); g.setIndex(new THREE.BufferAttribute(hemis[h].edges, 1)); hemis[h].group.add(new THREE.LineSegments(g, edgeMat)); }
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
  items.filter(it => it.kind === 'missing').forEach(it => {
    const q = document.createElement('button'); q.className = 'q'; q.textContent = '?'; q.setAttribute('aria-label', it.title);
    q.addEventListener('click', () => select(it, true)); q.addEventListener('mouseenter', () => { if (!coarse) hover(it, 'label'); }); q.addEventListener('mouseleave', () => { if (!coarse) hover(null, 'label'); });
    el.labels.appendChild(q); it.marker = q;
  });
  // the electrode: a small gold dot that sits on the temple whenever the story wants it
  const dot = document.createElement('span'); dot.className = 'edot'; el.labels.appendChild(dot); electrodeDot = dot;
  return { edgeMat, dashMat };
}
let electrodeDot = null;

// ---------- hover / select / card ----------
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
function paint(it, hot) { it.pieces.forEach(p => { p.mesh.material = it.kind === 'project' ? (hot ? it.hot : it.mat) : (hot ? matMissingHot : matMissing); }); if (it.kind === 'project') it.outline.forEach(o => o.visible = hot); }
function hover(it, source) {
  if (it === hovered) return;
  if (hovered && hovered !== selected) paint(hovered, false);
  hovered = it; hoverSource = source;
  if (hovered) paint(hovered, true);
  document.querySelectorAll('.piece-list li.on').forEach(n => n.classList.remove('on'));
  const show = hovered || selected; if (show) document.querySelectorAll(`.piece-list li[data-key="${show.key}"]`).forEach(n => n.classList.add('on'));
  if (!selected) showCard(hovered, false);
  canvas.classList.toggle('hot', !!hovered && source === 'canvas');
  el.float.classList.toggle('on', !!hovered); if (hovered) el.float.textContent = hovered.title;
}
function revealRow(it) {
  const row = document.querySelector(`.piece-list li[data-key="${it.key}"]`); if (!row) return;
  document.querySelectorAll('.piece-list li.open').forEach(n => { if (n !== row) n.classList.remove('open'); }); row.classList.add('open');
  const r = row.getBoundingClientRect(); if (r.top < 80 || r.bottom > innerHeight - 40) row.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
}
function select(it, fromBrain) {
  if (selected && selected !== it) paint(selected, false);
  selected = it;
  if (!it) { hideFrame(); showCard(hovered, false); if (hovered) paint(hovered, true); camOwner = 'section'; applySection(true); return; }
  if (it.key === 'focuskit') showFrame(true); else hideFrame();
  paint(it, true); showCard(it, true);
  document.querySelectorAll('.piece-list li.on').forEach(n => n.classList.remove('on'));
  document.querySelectorAll(`.piece-list li[data-key="${it.key}"]`).forEach(n => n.classList.add('on'));
  camOwner = 'select'; flyTo(it.key === 'focuskit' ? { theta: -2.35, phi: 1.25, r: fit * 1.12, tx: 0, ty: -0.12, tz: -0.15 } : viewOf(it), 1000);
  el.views.querySelectorAll('button').forEach(b => b.classList.remove('on'));
  if (fromBrain) revealRow(it);
}
function showCard(it, full) {
  el.card.classList.toggle('on', !!it); el.card.classList.toggle('selected', !!it && full);
  if (!it) return;
  el.card.dataset.kind = it.kind;
  el.kicker.textContent = it.kind === 'project' ? `${it.year} · ${it.where}` : `Missing · ${it.where}`;
  el.title.textContent = it.title; el.body.textContent = it.kind === 'project' ? it.blurb : it.question;
  el.status.textContent = it.kind === 'project' ? it.status : 'If this is your question too, write to me.';
  el.links.innerHTML = (it.kind === 'project' ? (it.links || []) : [{ label: 'Write to me', href: 'mailto:' + S.email + '?subject=' + encodeURIComponent(it.title) }])
    .map(l => `<a href="${l.href}" ${l.href.startsWith('mailto') ? '' : 'target="_blank" rel="noopener"'}>${l.label}</a>`).join('');
  if (full && it.kind === 'project') requestAnimationFrame(() => drawSignal(it.signal, el.signal, el.signalLabel));
  else { el.signal.style.display = 'none'; el.signalLabel.style.display = 'none'; }
}
el.cardClose.addEventListener('click', () => select(null));
addEventListener('keydown', e => {
  if (e.key === 'Escape') select(null);
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const i = selected ? selected.index : -1, n = items.length; select(items[(i + (e.key === 'ArrowRight' ? 1 : n - 1) + n) % n], true); }
});

// ---------- pointer: orbit and pick ----------
const pointers = new Map(); let dragging = false, moved = 0, pinch0 = 0, r0 = 0, lastDown = 0;
function pick(x, y) {
  const b = canvas.getBoundingClientRect(); ndc.set(((x - b.left) / b.width) * 2 - 1, -((y - b.top) / b.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(meshes.filter(m => m.visible && m.parent.parent.visible), false)[0];
  return hit ? hit.object.userData.piece : null;
}
canvas.addEventListener('pointerdown', e => {
  lastDown = performance.now(); canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); lastInput = performance.now();
  if (pointers.size === 1) { dragging = true; moved = 0; canvas.classList.add('dragging'); }
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); r0 = goal.r; }
  if (assembling) finishAssembly(); if (story.on) endStory();
});
canvas.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) {
    const p = pointers.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; lastInput = performance.now();
    if (pointers.size === 1 && dragging) { moved += Math.abs(dx) + Math.abs(dy); if (moved > 6) camOwner = 'user'; goal.theta -= dx * 0.0065; goal.phi = Math.min(2.95, Math.max(0.2, goal.phi - dy * 0.0065)); el.hint.classList.add('off'); }
    else if (pointers.size === 2) { const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0) goal.r = Math.min(fit * 1.7, Math.max(fit * 0.45, r0 * pinch0 / d)); camOwner = 'user'; }
    return;
  }
  if (coarse) return;
  const pc = pick(e.clientX, e.clientY); hoveredPiece = pc; hover(pc && pc.owner ? pc.owner : null, 'canvas');
  const b = stage.getBoundingClientRect();
  if (pc && !pc.owner) { el.tip.textContent = prettyRegion(pc.name); el.tip.classList.add('on'); el.tip.style.left = (e.clientX - b.left) + 'px'; el.tip.style.top = (e.clientY - b.top) + 'px'; } else el.tip.classList.remove('on');
  if (hovered) { el.float.style.left = (e.clientX - b.left) + 'px'; el.float.style.top = (e.clientY - b.top) + 'px'; }
});
const endPointer = e => {
  if (!pointers.has(e.pointerId)) return; pointers.delete(e.pointerId);
  if (pointers.size === 0) { canvas.classList.remove('dragging'); if (dragging && moved < 6) { const pc = pick(e.clientX, e.clientY); if (pc && pc.owner) select(pc.owner === selected ? null : pc.owner, true); else if (selected) select(null); } dragging = false; }
  pinch0 = 0;
};
canvas.addEventListener('pointerup', endPointer); canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => { if (!coarse && hoverSource === 'canvas') { hover(null, 'canvas'); el.tip.classList.remove('on'); } });
canvas.addEventListener('click', e => { if (performance.now() - lastDown < 600) return; if (assembling) { finishAssembly(); return; } if (story.on) { endStory(); return; } const pc = pick(e.clientX, e.clientY); if (pc && pc.owner) select(pc.owner === selected ? null : pc.owner, true); else if (selected) select(null); });
canvas.addEventListener('wheel', e => { e.preventDefault(); goal.r = Math.min(fit * 1.7, Math.max(fit * 0.45, goal.r * (1 + e.deltaY * 0.0012))); lastInput = performance.now(); camOwner = 'user'; el.hint.classList.add('off'); }, { passive: false });
const VIEWS = { left: [-Math.PI / 2, 1.45], front: [Math.PI, 1.3], top: [-2.2, 0.12], right: [Math.PI / 2, 1.45], below: [-2.2, 3.0], inside: [Math.PI / 2, 1.5] };
let insideOn = false;
function showHemis(L = true, R = true) { if (hemis.L) hemis.L.group.visible = L; if (hemis.R) hemis.R.group.visible = R; }
el.views.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const v = b.dataset.view; lastInput = performance.now(); camOwner = 'user';
  el.views.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  if (v === 'inside') { insideOn = !insideOn; b.classList.toggle('on', insideOn); if (!insideOn) { showHemis(true, true); flyTo(home()); return; } } else insideOn = false;
  showHemis(true, !insideOn);
  const [theta, phi] = VIEWS[v]; flyTo({ theta, phi, r: fit, tx: insideOn ? -0.3 : 0, ty: 0, tz: 0 });
});

// ---------- assembly: the brain puts itself together ----------
let assembling = false, assembled = false, finishAssembly = () => {};
async function assemble(quick) {
  assembling = true; assembled = true; const ST = quick ? 170 : 300, DUR = quick ? 700 : 950;
  const projects = items.filter(i => i.kind === 'project'), missing = items.filter(i => i.kind === 'missing');
  projects.forEach(it => it.pieces.forEach(p => { p.pivot.visible = false; p.socket.visible = true; }));
  let done = false;
  const finalState = () => {
    done = true; tweens.clear();
    for (const m of [matNeutral, matMissing]) { m.opacity = 1; m.transparent = false; m.needsUpdate = true; } mats.edgeMat.opacity = 0.16; mats.dashMat.opacity = 0.9;
    items.forEach(it => it.pieces.forEach(p => { p.pivot.visible = true; p.pivot.position.copy(p.center); p.pivot.quaternion.identity(); if (p.socket) p.socket.visible = false; }));
    missing.forEach(it => it.marker.classList.add('on'));
    Object.assign(cam, home()); Object.assign(goal, home()); flying = false;
    el.caption.classList.remove('on'); el.counter.textContent = `${projects.length} pieces placed · ${missing.length} missing`;
    assembling = false; lastInput = performance.now() - 2500; applySection(true);
  };
  finishAssembly = finalState;
  if (reduceMotion) { finalState(); return; }
  if (!quick) {
    tween(3800, k => { cam.theta = 1.3 + (HOME.theta - 1.3) * k; goal.theta = cam.theta; }, easeInOut);
    await tween(900, k => { matNeutral.opacity = k; matMissing.opacity = k; mats.edgeMat.opacity = 0.16 * k; });
    for (const m of [matNeutral, matMissing]) { m.transparent = false; m.needsUpdate = true; }
  } else await wait(120);
  if (done) return;
  el.caption.classList.add('on');
  const axis = new THREE.Vector3(), q0 = new THREE.Quaternion(), qi = new THREE.Quaternion();
  for (const it of projects) {
    if (done) return;
    el.caption.textContent = `${it.year} · ${it.title}`;
    it.pieces.forEach((p, j) => {
      p.pivot.visible = true; axis.copy(p.out).cross(new THREE.Vector3(0, 1, 0)).normalize(); if (!axis.lengthSq()) axis.set(1, 0, 0);
      q0.setFromAxisAngle(axis, 0.55 * (j % 2 ? -1 : 1));
      tween(DUR + j * 60, k => { p.pivot.position.copy(p.center).addScaledVector(p.out, 1.25 * (1 - k)); p.pivot.quaternion.copy(q0).slerp(qi, k); }, easeOutBack).then(() => { p.socket.visible = false; });
    });
    await wait(ST);
  }
  await wait(500); if (done) return;
  el.caption.textContent = 'and what is missing';
  await tween(900, k => { mats.dashMat.opacity = 0.9 * k; });
  missing.forEach(it => it.marker.classList.add('on'));
  await wait(700); if (!done) finalState();
}

// ---------- the glasses: his frame, docked where a face would be ----------
let frame = null, frameRest = null, frameLoading = null, frameToken = 0;
function loadFrame() {
  if (frameLoading || !THREE.GLTFLoader) return frameLoading;
  frameLoading = new Promise(res => new THREE.GLTFLoader().load('assets/frame.glb', gltf => {
    const g = gltf.scene; const acetate = new THREE.MeshPhysicalMaterial({ color: srgb(0x625e58), metalness: 0, roughness: 0.62, clearcoat: 0.55, clearcoatRoughness: 0.16 });
    const gold = new THREE.MeshStandardMaterial({ color: srgb(0xD9B25A), metalness: 0.85, roughness: 0.3 });
    let bridge = null; g.traverse(o => { if (o.isMesh) { o.material = /Plate/.test(o.name) ? gold : acetate; } if (o.name === 'Bridge') bridge = o; });
    const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group(); const inner = new THREE.Group(); inner.add(g); holder.add(inner);
    g.position.sub(centre);                                                     // the frame's own centre at the origin
    if (bridge) { const bb = new THREE.Box3().setFromObject(bridge).getCenter(new THREE.Vector3()); if (bb.z > centre.z) inner.rotation.y = Math.PI; }   // the lenses face -z, like the brain's front
    const k = 2.95 / size.x; holder.scale.setScalar(k);
    const h = brainBox.getSize(new THREE.Vector3());
    const after = new THREE.Box3().setFromObject(holder);                       // where it ends up once scaled and turned
    const frontZ = (brainBox.min.z - C0.z) - 0.36, eyeY = (brainBox.min.y - C0.y) + 0.3 * h.y;
    holder.position.set(0, eyeY - (after.getCenter(new THREE.Vector3()).y), frontZ - after.min.z);
    frameRest = holder.position.clone(); holder.visible = false; scene.add(holder); frame = holder; res(holder);
  }, undefined, () => res(null)));
  return frameLoading;
}
async function showFrame(slide) {
  const my = ++frameToken; const f = await loadFrame(); if (!f || my !== frameToken) return;
  f.visible = true;
  if (!slide) { f.position.copy(frameRest); f.rotation.set(0, 0, 0); return; }
  const from = frameRest.clone().add(new THREE.Vector3(-3.6, 0.7, -2.4));
  await tween(2200, k => { f.position.lerpVectors(from, frameRest, k); f.rotation.y = -0.55 * (1 - k); f.rotation.z = 0.08 * (1 - k); }, easeOutCubic);
}
function hideFrame() { frameToken++; if (frame) frame.visible = false; }

// ---------- the paper strip: a live line from the temple ----------
const live = { on: false, t: 0, samples: [], last: 0, burst: 5 }; let noiseState = 0;
function fitCanvas(cv) { const dpr = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth || 300, H = cv.clientHeight || 100; if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); } const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); return [c, W, H]; }
function paperBackground(c, W, H, offset) {
  c.fillStyle = CSS.sheet; c.fillRect(0, 0, W, H);
  const minor = 8, major = 40, o = ((offset % major) + major) % major;
  c.lineWidth = 1; c.strokeStyle = CSS.grid; c.beginPath();
  for (let x = -o; x < W; x += minor) { const px = Math.round(x) + 0.5; c.moveTo(px, 0); c.lineTo(px, H); } for (let y = 0; y < H; y += minor) { const py = Math.round(y) + 0.5; c.moveTo(0, py); c.lineTo(W, py); }
  c.stroke(); c.strokeStyle = CSS.gridMajor; c.beginPath();
  for (let x = -o; x < W; x += major) { const px = Math.round(x) + 0.5; c.moveTo(px, 0); c.lineTo(px, H); } for (let y = 0; y < H; y += major) { const py = Math.round(y) + 0.5; c.moveTo(0, py); c.lineTo(W, py); }
  c.stroke(); c.fillStyle = 'rgba(46,44,41,0.18)'; c.fillRect(0, 0, W, 1);
}
let paperK = 0, paperTw = null;
function paperOn(on) {                                              // slid in and out by hand: a CSS transition on this canvas never started in Chrome
  if (on && !live.samples.length) { live.t = 0; live.last = 0; live.burst = 4; }
  if (on) live.on = true;
  const from = paperK, to = on ? 1 : 0; if (from === to) { if (!on) live.on = false; return; }
  const run = tween(700, k => { paperK = from + (to - from) * k; el.paper.style.transform = `translateY(${((1 - paperK) * 110).toFixed(2)}%)`; }, easeInOut);
  paperTw = run; run.then(() => { if (paperTw === run && !on) live.on = false; });
}
function liveFrame(dt) {
  if (!live.on) return;
  live.t += dt; const PX = 64, SR = 120;
  while (live.last < live.t) {
    live.last += 1 / SR; noiseState = noiseState * 0.86 + (Math.random() - 0.5) * 0.9;
    let v = noiseState * 0.3 + Math.sin(2 * Math.PI * 10 * live.last) * 0.2;
    const k = live.last - live.burst; if (k > 0 && k < 1.6) v += Math.sin(2 * Math.PI * 1.3 * k) * Math.sin(Math.PI * k / 1.6) * 0.9; if (k > 1.6) live.burst = live.last + 5 + Math.random() * 4;
    live.samples.push({ t: live.last, v });
  }
  const [c, W, H] = fitCanvas(el.paper); const cut = live.t - W / PX - 1; while (live.samples.length && live.samples[0].t < cut) live.samples.shift();
  paperBackground(c, W, H, live.t * PX);
  const penX = W - 72, x = t => penX - (live.t - t) * PX, y0 = H * 0.55, A = H * 0.26;
  c.beginPath(); let first = true; for (const s of live.samples) { const px = x(s.t); if (px < -2 || px > penX) continue; first ? c.moveTo(px, y0 - s.v * A) : c.lineTo(px, y0 - s.v * A); first = false; }
  c.strokeStyle = CSS.ink; c.lineWidth = 1.2; c.lineJoin = 'round'; c.stroke();
  const lv = live.samples.length ? live.samples[live.samples.length - 1].v : 0; c.fillStyle = CSS.ink; c.beginPath(); c.arc(penX, y0 - lv * A, 1.8, 0, Math.PI * 2); c.fill();
  c.fillStyle = CSS.light; c.font = `11px ${FONT_BODY}`; c.fillText('one channel at the temple · drawn', 12, 16);
}

// ---------- states: the question, and the words that drift like weather ----------
const stateByKey = new Map(S.states.map(s => [s.key, s]));
let chosen = (() => { try { return sessionStorage.getItem('state'); } catch (e) { return null; } })();
const hotNeutral = aoMat({ color: srgb(NEUTRAL), emissive: srgb(ACCENT), emissiveIntensity: 0.35 });
function stateRegions(st) { return st.regions.map(n => pieceById.get(n)).filter(Boolean); }
function stateAnchor(st) { const ps = stateRegions(st); if (!ps.length) return null; const a = new THREE.Vector3(); ps.forEach(p => a.add(p.anchor)); a.divideScalar(ps.length); const o = new THREE.Vector3(); ps.forEach(p => o.add(p.out)); o.normalize(); return { a, o, hemi: ps[0].hemi }; }
S.states.forEach(st => { const b = document.createElement('button'); b.textContent = st.label; b.dataset.key = st.key; b.addEventListener('click', () => chooseState(st.key, true)); el.choices.appendChild(b); });
$('#statecard-change').addEventListener('click', e => { e.preventDefault(); chooseState(null, true); });
function chooseState(key, animate) {
  chosen = key; try { key ? sessionStorage.setItem('state', key) : sessionStorage.removeItem('state'); } catch (e) {}
  el.choices.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.key === key));
  const st = key ? stateByKey.get(key) : null;
  el.statecard.hidden = !st; if (st) el.statecardText.textContent = st.card;
  el.buildPicked.hidden = !st; if (st) el.buildPicked.textContent = `You picked ${st.label}. Here is how it fits.`;
  renderMissing(st ? st.missing : null);
  if (!renderer || !meshes.length) return;
  if (!st) { showHemis(true, true); camOwner = 'section'; applySection(true); return; }
  camOwner = 'state'; showHemis(st.hide !== 'L', st.hide !== 'R');
  const an = stateAnchor(st); const t = an ? an.a.clone().sub(C0).multiplyScalar(0.35) : new THREE.Vector3();
  flyTo({ theta: st.view.theta, phi: st.view.phi, r: fit * 0.78, tx: t.x, ty: t.y, tz: t.z }, animate ? 1100 : 0);
  if (animate) pulse(stateRegions(st));
}
async function pulse(ps) {
  const owners = new Set(ps.map(p => p.owner).filter(Boolean));
  for (let i = 0; i < 3; i++) {
    ps.forEach(p => { p.mesh.material = p.owner ? (p.owner.kind === 'project' ? p.owner.hot : matMissingHot) : hotNeutral; }); await wait(260);
    ps.forEach(p => { p.mesh.material = p.owner ? (p.owner.kind === 'project' ? p.owner.mat : matMissing) : matNeutral; }); await wait(200);
  }
  owners.forEach(it => { if (it === hovered || it === selected) paint(it, true); });
}

// ---------- the build section: the story in three beats, or the mechanics ----------
let buildView = (() => { try { return localStorage.getItem('buildView') || 'story'; } catch (e) { return 'story'; } })();
const story = { on: false, t0: 0, played: false, done: false };
const weatherEls = new Map(), chipEls = new Map(); let mechEls = [];
function setBuildView(v, user) {
  buildView = v; try { localStorage.setItem('buildView', v); } catch (e) {}
  el.buildTabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  el.buildStory.hidden = v !== 'story'; el.buildMech.hidden = v !== 'mechanics'; $('#replay').parentElement.hidden = v !== 'story';
  if (user && activeCam === 'build') { clearBuild(); applySection(true); }
}
el.buildTabs.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setBuildView(b.dataset.v, true); });
setBuildView(buildView, false);
$('#replay').addEventListener('click', e => { e.preventDefault(); story.played = false; clearBuild(); startStory(); });

function weatherEl(key, text, chip) { const m = chip ? chipEls : weatherEls; let s = m.get(key); if (!s) { s = document.createElement('span'); if (chip) s.className = 'chip'; el.weather.appendChild(s); m.set(key, s); } s.textContent = text; return s; }
function clearWeather() { el.weather.innerHTML = ''; weatherEls.clear(); chipEls.clear(); }
function clearBuild() { endStory(true); paperOn(false); clearWeather(); el.mech.innerHTML = ''; mechEls = []; el.caption.classList.remove('on'); stage.classList.remove('quiet'); items.forEach(it => { if (it.kind === 'project') it.pieces.forEach(p => { if (p.mesh.material === it.fade) p.mesh.material = it.mat; }); }); }
function startStory() {
  if (!renderer || !meshes.length || story.on) return;
  story.on = true; story.done = false; story.t0 = performance.now(); stage.classList.add('quiet');
  camOwner = 'story'; flyTo(home({ r: fit * 1.06 }), 1200);
  items.forEach(it => { if (it.kind === 'project') { it.fade.color.copy(it.mat.color); it.pieces.forEach(p => { p.mesh.material = it.fade; }); } });
  S.build.weather.forEach(w => weatherEl(w.key, w.word, false));
}
const grey = srgb(NEUTRAL);
function storyFrame(now) {
  if (!story.on) return;
  const t = (now - story.t0) / 1000;
  // beat 1: the colours drain, the words drift like weather
  const g = Math.min(1, t / 1.2); items.forEach(it => { if (it.kind === 'project') it.fade.color.copy(srgb(it.color)).lerp(grey, g * (t < 8.5 ? 1 : Math.max(0, 1 - (t - 8.5) / 1.5))); });
  S.build.weather.forEach((w, i) => {
    const s = weatherEls.get(w.key); if (!s) return; const st = stateByKey.get(w.key), an = stateAnchor(st); if (!an) return;
    const start = 0.6 + i * 0.9, hold = w.key === chosen ? 3.2 : 2.0, u = t - start;
    const op = u < 0 ? 0 : u < 0.7 ? u / 0.7 : u < 0.7 + hold ? 1 : Math.max(0, 1 - (u - 0.7 - hold) / 0.9);
    v3.copy(an.a).sub(C0).addScaledVector(an.o, 0.12).project(camera);
    s.style.left = ((v3.x + 1) / 2 * stage.clientWidth) + 'px'; s.style.top = ((1 - v3.y) / 2 * stage.clientHeight - Math.max(0, u) * 10) + 'px'; s.style.opacity = op;
  });
  // beat 2: the frame arrives
  if (t > 3.2 && !story.frameShown) { story.frameShown = true; flyTo({ theta: -2.5, phi: 1.25, r: fit * 1.1, tx: 0, ty: 0, tz: 0 }, 1600); }
  if (t > 4.2 && t < 7.6) { el.caption.textContent = 'A century ago, bad eyesight was fate.'; el.caption.classList.add('on'); }
  // beat 3: the temple lights, the line writes, the colours come back
  if (t > 7.6 && !story.paper) { story.paper = true; paperOn(true); el.caption.textContent = 'Measure it. See it change. Nudge it.'; const fk = byKey.get('focuskit'); pulse(fk.pieces); }
  if (t > 10.4 && !story.chips) { story.chips = true; el.caption.classList.remove('on'); Object.entries(S.build.chips).forEach(([k, txt]) => { const c = weatherEl(k, txt, true); c.style.opacity = 0; requestAnimationFrame(() => { c.style.opacity = 1; }); }); }
  if (t > 11.2) endStory(false);
}
function endStory(silent) {
  if (!story.on) return; story.on = false; story.played = true; story.frameShown = story.paper = story.chips = false;
  items.forEach(it => { if (it.kind === 'project') it.pieces.forEach(p => { if (p.mesh.material === it.fade) p.mesh.material = it.mat; }); });
  weatherEls.forEach(s => s.remove()); weatherEls.clear(); el.caption.classList.remove('on'); stage.classList.remove('quiet');
  if (silent) return;
  paperOn(true);
  if (!story.chips) Object.entries(S.build.chips).forEach(([k, txt]) => { weatherEl(k, txt, true).style.opacity = 1; });
  if (camOwner === 'story') camOwner = 'section';
}
function placeChips() {
  chipEls.forEach((s, key) => { const an = stateAnchor(stateByKey.get(key)); if (!an) return; camDir.copy(camera.position).sub(v3.copy(an.a).sub(C0)).normalize(); const facing = camDir.dot(an.o); v3.copy(an.a).sub(C0).addScaledVector(an.o, 0.06).project(camera); s.style.left = ((v3.x + 1) / 2 * stage.clientWidth) + 'px'; s.style.top = ((1 - v3.y) / 2 * stage.clientHeight) + 'px'; s.style.visibility = facing > 0.05 ? 'visible' : 'hidden'; });
}
function showMechanics() {
  paperOn(true); el.mech.innerHTML = ''; mechEls = [];
  const fk = byKey.get('focuskit'), pc = pieceById.get('lh-postcentral');
  const mk = (n, text, anchor) => { const d = document.createElement('div'); d.className = 'm'; d.innerHTML = `<i>${n}</i><b>${text}</b>`; el.mech.appendChild(d); mechEls.push({ el: d, anchor }); requestAnimationFrame(() => d.classList.add('on')); };
  mk(1, 'Readout', { a: fk.anchor, o: fk.out }); mk(2, 'Decision', { fixed: [0.12, 0.74] }); mk(3, 'Lever', pc ? { a: pc.anchor, o: pc.out } : { fixed: [0.5, 0.3] }); mk(4, 'Test', { fixed: [0.84, 0.74] });
}
function placeMech() {
  const w = stage.clientWidth, h = stage.clientHeight;
  for (const m of mechEls) {
    if (m.anchor.fixed) { m.el.style.left = (m.anchor.fixed[0] * w) + 'px'; m.el.style.top = (m.anchor.fixed[1] * h) + 'px'; continue; }
    v3.copy(m.anchor.a).sub(C0).addScaledVector(m.anchor.o, 0.08).project(camera); m.el.style.left = ((v3.x + 1) / 2 * w) + 'px'; m.el.style.top = ((1 - v3.y) / 2 * h) + 'px';
  }
}

// ---------- sections: what the brain does while you read ----------
const sections = [...document.querySelectorAll('.copy section')];
const dots = $('#rail-dots'); sections.forEach(s => { const a = document.createElement('a'); a.href = '#' + s.id; a.title = s.querySelector('h1, h2').textContent; dots.appendChild(a); });
let activeId = null, activeCam = null;
const mobile = matchMedia('(max-width: 900px)').matches;
const portrait = $('#portrait'), wrap = $('#brainwrap');
const em = { p: 0, target: 0, done: false };                                    // the emergence, scrubbed by scroll
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, k) => a + (b - a) * k;
function emergeTarget() { const h = $('#hello'); return Math.min(1, Math.max(0, scrollY / Math.max(1, h.offsetHeight * 0.38))); }
function applyEmerge(p) {
  const pr = portrait.getBoundingClientRect(), sr = stage.getBoundingClientRect(), H = S.photoHead || { x: 0.5, y: 0.34, crown: 0.19 };
  const cx = sr.width / 2, cy = sr.height / 2;
  const headX = pr.left - sr.left + H.x * pr.width, headY = pr.top - sr.top + H.y * pr.height, crownY = pr.top - sr.top + H.crown * pr.height;
  const R = 0.46 * Math.min(sr.width, sr.height), s0 = 0.22, s1 = 0.42;
  const a = smooth(0, 0.6, p), b = smooth(0.45, 1, p);
  const y0 = headY + 24, y1 = crownY - R * s1 * 1.02;
  const x = lerp(headX, cx, b), y = lerp(lerp(y0, y1, a), cy, b), k = lerp(lerp(s0, s1, a), 1, b);
  canvas.style.transform = `translate(${(x - cx).toFixed(1)}px, ${(y - cy).toFixed(1)}px) scale(${k.toFixed(4)})`;
  const line = crownY + b * (sr.height + 60 - crownY);                           // the soft edge the brain rises through, then it leaves
  const m = `linear-gradient(to bottom, #000 ${(line - 34).toFixed(1)}px, transparent ${line.toFixed(1)}px)`; wrap.style.webkitMaskImage = m; wrap.style.maskImage = m;
  portrait.style.opacity = (1 - b).toFixed(3); portrait.style.transform = `translate(-50%, calc(-50% + ${(b * 26).toFixed(1)}px)) scale(${(1 - 0.03 * b).toFixed(4)})`;
  cam.phi = lerp(0.72, HOME.phi, smooth(0, 1, p)); cam.theta = lerp(HOME.theta - 0.4, HOME.theta, smooth(0, 1, p)); cam.r = fit; cam.tx = cam.ty = cam.tz = 0; Object.assign(goal, cam);
}
function emergeFrame(dt) {
  if (em.done || !mats) return;
  em.p += (em.target - em.p) * (1 - Math.pow(0.0004, dt));
  applyEmerge(em.p);
  if (em.target >= 1 && em.p > 0.992) finishEmerge();
}
function finishEmerge() {
  if (em.done) return; em.done = true;
  canvas.style.transform = ''; wrap.style.webkitMaskImage = wrap.style.maskImage = ''; portrait.hidden = true; stage.classList.remove('quiet');
  Object.assign(cam, home()); Object.assign(goal, cam);
  if (!assembled) assemble(true);
}
function currentSection() {
  const mid = innerHeight * 0.45; let best = sections[0];
  for (const s of sections) { const r = s.getBoundingClientRect(); if (r.top <= mid) best = s; }
  return best;
}
function applySection(force) {
  const s = currentSection(); const id = s.id, camKind = s.dataset.cam;
  dots.querySelectorAll('a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  if (!force && id === activeId) return;
  const prev = activeCam; activeId = id; activeCam = camKind;
  if (!renderer || !meshes.length) return;
  if (id !== 'hello' && !em.done) finishEmerge();
  if (!em.done) return;
  if (assembling) { if (id === 'hello' || id === 'work') return; finishAssembly(); return; }
  if (prev === 'build' && camKind !== 'build') clearBuild();
  if (prev === 'temple' && camKind !== 'temple') { paperOn(false); electrodeDot.classList.remove('on'); }
  if (camKind !== 'hold' && camKind !== 'state') showHemis(true, true);
  if (camOwner === 'user' && !force) camOwner = 'section';
  if (camOwner === 'select' && selected && !force) return;
  swayAmp = 0.16;
  if (camKind === 'home') { camOwner = 'section'; flyTo(home(), 1100); }
  else if (camKind === 'temple') { camOwner = 'section'; const fk = byKey.get('focuskit'); flyTo(viewOf(fk, 0.8, 0.4), 1200); paperOn(true); electrodeDot.classList.add('on'); }
  else if (camKind === 'hold') { if (chosen) chooseState(chosen, false); else { camOwner = 'section'; flyTo(home({ r: fit * 0.95 }), 1000); } }
  else if (camKind === 'build') { if (buildView === 'story') { if (!story.played) startStory(); else { camOwner = 'section'; flyTo(home({ r: fit * 1.06 }), 1000); endStory(false); } } else { camOwner = 'section'; flyTo({ theta: -1.9, phi: 1.2, r: fit * 1.02, tx: 0, ty: 0, tz: 0 }, 1000); showMechanics(); } }
  else if (camKind === 'missing') { camOwner = 'section'; flyTo({ theta: -2.75, phi: 0.95, r: fit, tx: 0, ty: 0, tz: 0 }, 1100); }
  else if (camKind === 'orbit') { camOwner = 'section'; swayAmp = 0.32; flyTo(home({ r: fit * 1.08 }), 1200); }
}
let scrollTick = false; addEventListener('scroll', () => { if (!em.done) em.target = emergeTarget(); if (scrollTick) return; scrollTick = true; requestAnimationFrame(() => { scrollTick = false; applySection(false); }); }, { passive: true });

// ---------- labels that follow the brain ----------
const v3 = new THREE.Vector3(), camDir = new THREE.Vector3();
function placeLabels() {
  const w = stage.clientWidth, h = stage.clientHeight;
  for (const it of items) {
    if (!it.marker) continue;
    if (!it.pieces[0].pivot.visible || !hemis[it.hemi].group.visible) { it.marker.style.opacity = 0; continue; }
    v3.copy(it.anchor).sub(C0).addScaledVector(it.out, 0.02); camDir.copy(camera.position).sub(v3).normalize(); const facing = camDir.dot(it.out); v3.project(camera);
    it.marker.style.left = ((v3.x + 1) / 2 * w) + 'px'; it.marker.style.top = ((1 - v3.y) / 2 * h) + 'px';
    it.marker.style.opacity = it.marker.classList.contains('on') ? Math.max(0, Math.min(1, (facing - 0.05) / 0.25)) : 0; it.marker.style.pointerEvents = facing > 0.15 ? 'auto' : 'none';
  }
  if (electrodeDot && electrodeDot.classList.contains('on')) { const fk = byKey.get('focuskit'); v3.copy(fk.anchor).sub(C0).addScaledVector(fk.out, 0.01).project(camera); electrodeDot.style.left = ((v3.x + 1) / 2 * w) + 'px'; electrodeDot.style.top = ((1 - v3.y) / 2 * h) + 'px'; }
  placeChips(); placeMech();
}

// ---------- signal strips on the cards (drawn, not recorded) ----------
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function drawSignal(kind, cv, labelEl) {
  cv.style.display = 'block'; labelEl.style.display = 'block';
  const dpr = Math.min(devicePixelRatio || 1, 2), W = cv.clientWidth || 340, H = 72; cv.width = W * dpr; cv.height = H * dpr;
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  const ink = CSS.ink, acc = CSS.accent, mid = CSS.light, rnd = mulberry32(11), noise = () => rnd() + rnd() + rnd() - 1.5;
  const line = (pts, col, w = 1.2) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = col; c.lineWidth = w; c.lineJoin = 'round'; c.stroke(); };
  const text = (s, x, y, col = mid) => { c.fillStyle = col; c.font = `11px ${FONT_BODY}`; c.fillText(s, x, y); };
  const mark = (x, lab) => { c.fillStyle = acc; c.fillRect(x, 6, 1, H - 12); text(lab, x + 5, 14, acc); };
  let label = 'illustration';
  switch (kind) {
    case 'ssvep': { const pts = []; for (let x = 0; x < W; x++) { const t = x / W * 3, on = t > 1 ? Math.min(1, (t - 1) / 0.5) : 0; pts.push([x, H * 0.52 + on * Math.sin(2 * Math.PI * 12 * t) * H * 0.26 + noise() * H * 0.05 + Math.sin(2 * Math.PI * 0.7 * t) * H * 0.05]); } line(pts, ink); mark(W / 3, 'flicker on, 12 Hz'); label = 'occipital EEG while a 12 Hz target flickers · illustration'; break; }
    case 'erp': { const erp = (x, big) => { const t = x / W * 900 - 100, g = (m, s, a) => a * Math.exp(-((t - m) ** 2) / (2 * s * s)); return H * 0.5 - (g(100, 25, 6) - g(170, 30, 5) + (big ? g(400, 70, 16) : g(400, 70, 5))) * 1.6; }; const a = [], b = []; for (let x = 0; x < W; x++) { a.push([x, erp(x, false) + noise() * 0.8]); b.push([x, erp(x, true) + noise() * 0.8]); } line(a, mid); line(b, ink); mark(W * (100 / 900), '0 ms'); c.fillStyle = acc; c.fillRect(W * (500 / 900), 6, 1, H - 12); text('400 ms', W * (500 / 900) + 5, H - 6, acc); text('unexpected word', 6, H - 6, ink); label = 'N400: negative drawn downward · related (grey) vs unrelated (ink) · illustration'; break; }
    case 'meg': { const pts = []; for (let x = 0; x < W; x++) { const t = x / W * 1.2 - 0.2, ev = Math.exp(-((t - 0.1) ** 2) / 0.0012) * 10 - Math.exp(-((t - 0.19) ** 2) / 0.002) * 7 + Math.exp(-((t - 0.4) ** 2) / 0.01) * 4; pts.push([x, H * 0.5 - ev * 1.6 + noise() * 2.2 + Math.sin(t * 40) * 1.5]); } line(pts, ink); mark(W / 6, 'word onset'); label = 'one sensor, one word · illustration'; break; }
    case 'states': { const cols = ['#779E84', '#C2A05A', '#7B93BD', '#BE8591']; let s = 0, x = 0; while (x < W) { const len = 6 + rnd() * 26; c.fillStyle = cols[s]; c.fillRect(x, 18, len, 22); x += len; if (rnd() < 0.9) { let n = Math.floor(rnd() * 4); if (n === s) n = (n + 1) % 4; s = n; } } text('state 1', 2, 56, cols[0]); text('2', 48, 56, cols[1]); text('3', 64, 56, cols[2]); text('4', 80, 56, cols[3]); text('10 minutes of rest →', W - 120, 56); label = 'a four-state Markov chain over resting-state fMRI · synthetic'; break; }
    case 'dfc': { const bold = []; for (let x = 0; x < W; x++) { const t = x / W * 60; bold.push([x, 16 + Math.sin(t * 0.7) * 5 + Math.sin(t * 1.9 + 1) * 3 + noise() * 1.2]); } line(bold, ink); text('BOLD, one region, 2 s per sample', 6, 36); for (let r = 0; r < 5; r++) for (let i = 0; i < 70; i++) if (rnd() < 0.18) { c.fillStyle = mid; c.fillRect(rnd() * W, 42 + r * 5, 1, 4); } text('spikes, 5 electrodes, 100 ms bins', W - 190, H - 2); label = 'the same window slid over two scales · illustration'; break; }
    case 'bars': { const bars = [['untreated AD', 1, mid], ['+ isoorientin, mRNA', 2, ink], ['+ isoorientin, protein', 3, acc]], bw = (W - 40) / 3; bars.forEach(([n, v, col], i) => { const x = 20 + i * bw, hgt = v / 3 * 44; c.fillStyle = col; c.fillRect(x, 50 - hgt, bw - 24, hgt); text(n, x, 62); text(v + '×', x, 50 - hgt - 4, col); }); label = 'Nt5c1a relative to untreated AD mice · ratios as reported'; break; }
    case 'zone': { const pts = [], vals = []; let v = 0; for (let x = 0; x < W; x++) { v = v * 0.985 + noise() * 0.12; vals.push(v); } const sd = Math.sqrt(vals.reduce((a, b) => a + b * b, 0) / W) || 1; vals.forEach((v, x) => { if (Math.abs(v) > sd) { c.fillStyle = CSS.soft; c.fillRect(x, 6, 1, H - 12); } pts.push([x, H * 0.5 - v / sd * 14]); }); line(pts, ink); text('reaction-time variability; shaded = out of the zone', 6, H - 6); label = 'the behaviour the brain states are matched against · illustration'; break; }
    case 'slow': { const pts = []; for (let x = 0; x < W; x++) { const t = x / W * 8, slow = t > 4.5 ? Math.sin(2 * Math.PI * 1.2 * (t - 4.5)) * Math.min(1, (t - 4.5) / 1.5) * 9 : 0; pts.push([x, H * 0.5 + Math.sin(2 * Math.PI * 10 * t) * 2.2 * (t < 4.5 ? 1 : 0.4) + noise() * 1.8 + slow]); } line(pts, ink); mark(W * 0.93, 'tap'); text('slow waves creep in', W * 0.6, 14); label = 'one temple channel in the seconds before a lapse · illustration'; break; }
    default: cv.style.display = 'none'; labelEl.style.display = 'none'; return;
  }
  labelEl.textContent = label;
}

// ---------- main loop ----------
function resize() { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h || !renderer) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (meshes.length) computeFit(); }
new ResizeObserver(resize).observe(stage); resize();
let last = performance.now();
function frameLoop(now) {
  requestAnimationFrame(frameLoop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  runTweens(now); emergeFrame(dt); storyFrame(now); liveFrame(dt);
  if (!flying && em.done) { const k = 1 - Math.pow(0.001, dt); for (const key of ['theta', 'phi', 'r', 'tx', 'ty', 'tz']) cam[key] += (goal[key] - cam[key]) * k; }
  const idle = (now - lastInput) / 1000 > 3 && !selected && !assembling && em.done && !story.on && !reduceMotion && camOwner !== 'state';
  const swayGoal = idle ? Math.sin(now * 0.00035) * swayAmp : 0;
  sway += (swayGoal - sway) * (1 - Math.pow(idle ? 0.3 : 0.02, dt));
  applyCamera(); placeLabels(); renderer.render(scene, camera);
}
if (chosen) chooseState(chosen, false);
window.__brain = { pick: (x, y) => pick(x, y), items, pieces, camera, get meshes() { return meshes; }, hover, select, chooseState, startStory, applySection, showFrame, hideFrame, get frame() { return frame; }, brainBox, C0, flyTo, get fit() { return fit; } };
if (renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputEncoding = THREE.sRGBEncoding; renderer.setClearColor(0x000000, 0);
  load().then(m => { mats = m; el.loading.classList.add('off'); for (const x of [matNeutral, matMissing]) { x.opacity = 1; x.transparent = false; x.needsUpdate = true; } mats.edgeMat.opacity = 0.16; items.forEach(it => it.pieces.forEach(p => { if (it.kind === 'project') { p.pivot.visible = false; p.socket.visible = true; } })); stage.classList.add('quiet'); em.target = emergeTarget(); em.p = em.target >= 1 ? 1 : 0; applyEmerge(em.p); applyCamera(); requestAnimationFrame(frameLoop); loadFrame(); if (em.target >= 1 || currentSection().id !== 'hello') finishEmerge(); })
    .catch(err => { console.error(err); el.loading.textContent = 'The brain did not load. The pieces are listed below.'; });
}
})();
