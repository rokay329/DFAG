'use strict';
// 잿빛 왕관 토벌대 — 20_occupancy.js (v2.85) : 방마다 하나의 점유 지도
// 장애물 · 소품 · 특별방 시설 · 벽 장식 · 바닥 장식 · 진엔딩 단서가 모두 같은 지도를 보고 자리를 잡는다.
// 4px 칸 격자에 칸마다 두 가지를 기록: 발 자리(foot · 땅에 닿는 판정) / 그림 자리(vis · 실제로 그려지는 픽셀)
// 먼저 놓인 것이 이기고 나중 것이 비켜 간다: 예약(문 앞 · 상자 · 텔레포터 · 진엔딩 단서) → 장애물 → 소품 · 시설 → 벽 장식 → 큰 바닥 장식 → 작은 자국
const OCC = (() => {
  const C = 4;
  const KEY = 1, WALL = 2, OBS = 3, PROP = 4, BIG = 5, SMALL = 6, CEN = 7;
  const NAME = { 1: '예약', 2: '벽 장식', 3: '장애물', 4: '소품 · 시설', 5: '큰 바닥 장식', 6: '작은 자국', 7: '방 가운데' };
  const B = (...ls) => ls.reduce((m, l) => m | (1 << l), 0);
  // ---------------------------------------------------------------- 여유 거리 표 (칸 = 4px) · 여기 한 곳에서 조절
  // 놓으려는 것 → [발 자리와 겹치면 안 되는 층, 칸 여유] · [그림 자리와 겹치면 안 되는 층, 칸 여유]
  const RULE = {
    prop: { foot: [B(KEY, OBS, PROP, CEN), 2], vis: [B(OBS, PROP), 1] },        // 서 있는 소품: 발은 8px, 그림은 4px 띄움
    wall: { foot: [0, 0], vis: [B(OBS, PROP), 0] },                              // 벽 장식: 앞에 선 그림과 겹치지 않게
    big: { foot: [B(KEY, OBS, PROP, CEN), 1], vis: [B(OBS, PROP, BIG, SMALL), 0] }, // 깔개 · 큰 바닥 장식
    small: { foot: [B(KEY, OBS, PROP), 0], vis: [B(OBS, PROP, BIG, SMALL), 0] },   // 뼈 · 자갈 · 돌 · 풀 등 (서로도 겹치지 않음)
    tiny: { foot: [B(KEY, OBS, PROP), 0], vis: [B(OBS, PROP, BIG, SMALL), 0] },    // 아주 작은 점(풀잎 · 꽃): 검사만 하고 자리는 남기지 않음
    blood: { foot: [B(KEY, OBS, PROP), 2], vis: [B(OBS, PROP), 1] },            // 3장 피의 결투 원
  };
  const TINY_AREA = 160, BIG_AREA = 1600;
  let CUR = null, BUILD = false, STAT = null;

  // ---------------------------------------------------------------- 격자
  function grid() {
    const x0 = Math.floor((A.x0 - 96) / C) * C, y0 = Math.floor((A.y0 - 200) / C) * C, w = Math.ceil((A.x1 + 96 - x0) / C), h = Math.ceil((A.y1 + 96 - y0) / C);
    return { x0, y0, w, h, foot: new Uint8Array(w * h), vis: new Uint8Array(w * h), skip: {} };
  }
  const cellOf = (O, x, y) => { const cx = Math.floor((x - O.x0) / C), cy = Math.floor((y - O.y0) / C); return cx < 0 || cy < 0 || cx >= O.w || cy >= O.h ? -1 : cy * O.w + cx; };
  function rectCells(O, x0, y0, x1, y1) {
    const out = [], a = Math.max(0, Math.floor((x0 - O.x0) / C)), b = Math.min(O.w - 1, Math.floor((x1 - 1 - O.x0) / C)), c = Math.max(0, Math.floor((y0 - O.y0) / C)), d = Math.min(O.h - 1, Math.floor((y1 - 1 - O.y0) / C));
    for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) out.push(y * O.w + x);
    return out;
  }
  function ellCells(O, cx, cy, rx, ry) {
    ry = ry || rx; const out = [];
    for (const i of rectCells(O, cx - rx, cy - ry, cx + rx + 1, cy + ry + 1)) { const x = O.x0 + (i % O.w) * C + C / 2, y = O.y0 + Math.floor(i / O.w) * C + C / 2; if (((x - cx) / (rx + C / 2)) ** 2 + ((y - cy) / (ry + C / 2)) ** 2 <= 1) out.push(i); }
    return out;
  }
  // 그림의 실제 픽셀 (2px 칸마다 투명하지 않은 곳) — 그림마다 한 번만 읽음
  const ALPHA = new WeakMap();
  function alphaOff(cv) {
    let a = ALPHA.get(cv); if (a) return a;
    a = []; try { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      for (let y = 0; y < cv.height; y += 2) for (let x = 0; x < cv.width; x += 2) { const k = (y * cv.width + x) * 4 + 3; if (d[k] > 60 || (x + 1 < cv.width && d[k + 4] > 60) || (y + 1 < cv.height && d[k + cv.width * 4] > 60)) a.push(x, y); } } catch (e) { a = null; }
    ALPHA.set(cv, a); return a;
  }
  function maskCells(O, cv, x, y, flip) {
    const a = alphaOff(cv); if (!a) return rectCells(O, x, y, x + cv.width, y + cv.height);
    const s = new Set();
    for (let k = 0; k < a.length; k += 2) { const i = cellOf(O, x + (flip ? cv.width - 2 - a[k] : a[k]), y + a[k + 1]); if (i >= 0) s.add(i); }
    return [...s];
  }
  function hit(O, arr, cells, mask, dil) {
    if (!mask) return false;
    for (const c of cells) { const cx = c % O.w, cy = (c / O.w) | 0;
      for (let dy = -dil; dy <= dil; dy++) { const y = cy + dy; if (y < 0 || y >= O.h) continue;
        for (let dx = -dil; dx <= dil; dx++) { const x = cx + dx; if (x < 0 || x >= O.w) continue; const v = arr[y * O.w + x]; if (v && (mask >> v) & 1) return true; } } }
    return false;
  }
  function mark(arr, cells, v) { for (const c of cells) if (!arr[c] || arr[c] > v) arr[c] = v; }
  function fits(O, rule, foot, vis) { const R = RULE[rule]; return !hit(O, O.foot, foot, R.foot[0], R.foot[1]) && !hit(O, O.vis, vis, R.vis[0], R.vis[1]); }
  function put(O, v, foot, vis) { mark(O.foot, foot, v); mark(O.vis, foot, v); if (vis) mark(O.vis, vis, v); }
  const skip = (O, k) => { O.skip[k] = (O.skip[k] || 0) + 1; };

  // ---------------------------------------------------------------- 방에 이미 있는 것들을 지도에 올림
  function obsFoot(O, b) { return b.c ? ellCells(O, b.x, b.y, b.r, b.r) : rectCells(O, b.x0, b.y0, b.x1, b.y1); }
  function propCells(O, q) {
    const sp = PROPS[q.name]; let foot, vis;
    if (sp.pit) foot = rectCells(O, q.x - sp.w / 2, q.y - sp.h / 2, q.x + sp.w / 2, q.y + sp.h / 2);
    else foot = ellCells(O, q.x, q.y - 2, q.rad || sp.r || 8, Math.max(4, (q.rad || sp.r || 8) * 0.6));
    if (PROP_MAPS[q.name]) { const c = propCanvas(q.name), x = (q.x - c.width / 2) & ~1, y = (q.y - c.height + (sp.foot || 0) * 2) & ~1; vis = maskCells(O, c, x, y); }
    else { const r = propRect(q); vis = rectCells(O, r.x0, r.y0, r.x1, r.y1); }
    return { foot, vis };
  }
  function keysOf(R) { // 비워 둘 자리
    const out = [];
    for (const d in R.doors) if (R.doors[d] != null) out.push([doorIn(d, 34), 40]);
    if (R.crack) out.push([doorIn(R.crack.dir, 34), 40]);
    if (R.tele) out.push([R.tele, 42]); if (R.chest) out.push([R.chest, 30]); if (R.exitP) out.push([R.exitP, 34]);
    if (R.shop) for (const q of R.shop) out.push([q, 24]);
    if (R.bridges) for (const q of R.bridges) out.push([q, 26]);
    if (R.type === 'rest') out.push([{ x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy }, 30]);
    if (R.keeper) out.push([R.keeper, 20]);
    return out;
  }
  function truthKeys(O, R) { // 진엔딩 단서 자리
    if (R.pond && R.pond.x != null) put(O, KEY, ellCells(O, R.pond.x, R.pond.y, 74, 32));
    if (R.slimeTree) put(O, KEY, ellCells(O, R.slimeTree.x, R.slimeTree.y - 10, 40, 30));
    if (R.bloodSpot) put(O, KEY, ellCells(O, R.bloodSpot.x, R.bloodSpot.y, 44, 22));
    if (R.blood && R.blood.x != null) put(O, KEY, ellCells(O, R.blood.x, R.blood.y, 44, 22));
    if (R.sealW) put(O, KEY, rectCells(O, DOOR.n.x - 110, A.y0 - 110, DOOR.n.x + 110, A.y0 + 30));
  }
  function build(R, keyPts) {
    const O = grid();
    if (keyPts) for (const p of keyPts) { if (p.big) put(O, CEN, ellCells(O, CX, CY - 10, CLEAR_R, CLEAR_R)); else put(O, KEY, ellCells(O, p.x, p.y, 40, 40)); }
    else { for (const [p, r] of keysOf(R)) put(O, KEY, ellCells(O, p.x, p.y, r, r)); if (['combat', 'elite', 'survive', 'boss', 'start', 'reward', 'secret'].includes(R.type)) put(O, CEN, ellCells(O, CX, CY - 10, CLEAR_R - 8, CLEAR_R - 8)); }
    truthKeys(O, R);
    for (const b of R.obs || []) if (b.t !== 'chest') put(O, b.t === 'prop' ? PROP : OBS, obsFoot(O, b));
    for (const s of R.sprites || []) mark(O.vis, maskCells(O, s.cv, s.x, s.y), OBS);
    for (const q of R.props || []) { const c = propCells(O, q); put(O, PROP, c.foot, c.vis); }
    if (R.srp && typeof srRect === 'function') for (const s of R.srp) { const q = srRect(s); if (q) mark(O.vis, rectCells(O, q.x0, q.y0, q.x1, q.y1), PROP); }
    if (R.altars) for (const a of R.altars) put(O, PROP, rectCells(O, a.x - 24, a.y - 42, a.x + 24, a.y + 6));
    O.R = R; return O;
  }

  // ---------------------------------------------------------------- 장애물끼리: 실제 그림이 크게 겹치는 둥근 장애물(바위 · 나무 · 기둥)은 뺀다
  function pruneObs(r) {
    const S = r.sprites || []; if (!S.length) return;
    const O = grid(), of = new Map();
    for (const s of S) { const cx = s.x + s.cv.width / 2; const b = r.obs.find(o => o.c && !of.has(o) && (o.t === 'rock' || o.t === 'pillar') && !o.of && Math.abs(o.y - s.sy) <= 2 && Math.abs(o.x - cx) <= 8); if (b) of.set(b, s); }
    for (const s of S) if (![...of.values()].includes(s)) mark(O.vis, maskCells(O, s.cv, s.x, s.y), OBS); // 벽 · 망루 등은 먼저
    const gone = new Set();
    for (const b of r.obs) { const s = of.get(b); if (!s) continue; const cells = maskCells(O, s.cv, s.x, s.y);
      let n = 0; for (const c of cells) if (O.vis[c]) n++;
      if (n > 6) { gone.add(b); continue; } mark(O.vis, cells, OBS); }
    if (!gone.size) return;
    r.obs = r.obs.filter(b => !gone.has(b)); r.sprites = S.filter(s => ![...gone].some(b => of.get(b) === s)); r.nav = buildNav(r.obs);
    if (STAT) STAT.pruned = (STAT.pruned || 0) + gone.size;
  }
  // 3장 피의 결투 원 자리 (전투 방마다 미리 잡아 둠 — 고른 방 하나만 보임)
  function bloodSpot(r) {
    if (r.type !== 'combat' || !SHAPES[r.shape] || SHAPES[r.shape].w < 480 || SHAPES[r.shape].h < 300) return;
    const O = CUR, doors = Object.keys(r.doors).filter(d => r.doors[d] != null).map(d => doorIn(d, 30));
    for (const [dx, dy] of [[0, 30], [0, -30], [-120, 20], [120, 20], [-120, -40], [120, -40], [0, 90], [-200, 0], [200, 0], [0, -90], [-200, 70], [200, 70]]) {
      const x = Math.round((CX + dx) / 2) * 2, y = Math.round((CY + dy) / 2) * 2;
      if (x < A.x0 + 60 || x > A.x1 - 60 || y < A.y0 + 40 || y > A.y1 - 40 || doors.some(q => Math.hypot(q.x - x, q.y - y) < 90)) continue;
      const cells = ellCells(O, x, y, 44, 22); if (!fits(O, 'blood', cells, cells)) continue;
      r.bloodSpot = { x, y }; put(O, KEY, cells); return;
    }
  }

  // ---------------------------------------------------------------- 게임 함수 연결
  const ORIG = { decorRoom, paintRoomFloor, decBlock, withDecor, decFree };
  decorRoom = function (r, stage, keyPts) {
    r.sprites = makeObsSprites(r); pruneObs(r);
    const O0 = CUR, B0 = BUILD; CUR = build(r, keyPts); BUILD = true;
    try { ORIG.decorRoom(r, stage, keyPts); if (G.stage === 3) bloodSpot(r); }
    finally { CUR = O0; BUILD = B0; }
  };
  paintRoomFloor = function (R) {
    const O0 = CUR; CUR = build(R, null);
    try { return ORIG.paintRoomFloor(R); } finally { R.occ = CUR; CUR = O0; }
  };
  decBlock = function (cv, x, y, w, h) {
    if (!DEC || cv !== DEC.g) return false;
    const O = CUR; if (!O) return ORIG.decBlock(cv, x, y, w, h);
    const cells = rectCells(O, x, y, x + w, y + h), a = w * h, k = a < TINY_AREA ? 'tiny' : a >= BIG_AREA ? 'big' : 'small';
    if (!fits(O, k, cells, cells)) { skip(O, k); return true; }
    if (k !== 'tiny') put(O, k === 'big' ? BIG : SMALL, cells);
    return false;
  };
  withDecor = function (g, R, fn) {
    if (!R) return fn();
    const O0 = CUR; if (!CUR || CUR.R !== R) CUR = build(R, null);
    const D0 = DEC; DEC = { g, solid: [], rects: [] };
    try { fn(); } finally { DEC = D0; CUR = O0 || CUR; }
  };
  decFree = function (x, y, r = 6, claim) {
    const R = typeof CUR_ROOM !== 'undefined' ? CUR_ROOM : null; if (!R || !G) return true;
    if (!CUR || CUR.R !== R) CUR = build(R, null);
    const cells = rectCells(CUR, x - r, y - r, x + r, y + r);
    if (!fits(CUR, 'small', cells, cells)) { skip(CUR, 'small'); return false; }
    if (claim) put(CUR, SMALL, cells);
    return true;
  };
  // 6 · 12에서 부름
  const on = () => BUILD && !!CUR;
  function prop(q) { const O = CUR, c = propCells(O, q); if (!fits(O, 'prop', c.foot, c.vis)) { skip(O, 'prop'); return false; } put(O, PROP, c.foot, c.vis); return true; }
  function wall(x, y, w, h) { const O = CUR; if (!O) return true; const cells = rectCells(O, x, y, x + w, y + h); if (!fits(O, 'wall', [], cells)) { skip(O, 'wall'); return false; } mark(O.vis, cells, WALL); return true; }
  function stamp(x, y, w, h) { const O = CUR; if (!O) return true; const cells = rectCells(O, x, y, x + w, y + h), k = w * h < TINY_AREA ? 'tiny' : 'small'; if (!fits(O, k, cells, cells)) { skip(O, k); return false; } if (k !== 'tiny') put(O, SMALL, cells); return true; }

  // ---------------------------------------------------------------- 디버그 표시 (Shift+U): 칸마다 층 색 · 발 자리는 진하게, 그림 자리는 테두리만
  const COL = { 1: '255,220,60', 2: '200,120,255', 3: '255,60,60', 4: '60,160,255', 5: '60,230,140', 6: '170,255,120', 7: '255,255,255' };
  let DBG = false;
  function dbgTick() { if (pressed['u'] === 'shift') { pressed['u'] = false; DBG = !DBG; lootFeed(DBG ? '테스트 — 점유 지도 켜짐 (Shift+U)' : '테스트 — 점유 지도 꺼짐', '#9fd2ff', 2500); } }
  function dbgDraw() {
    const R = G && G.dun && G.dun.cur, O = R && R.occ; if (!DBG || !O) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, -CAMX, -CAMY);
    for (let i = 0; i < O.w * O.h; i++) { const f = O.foot[i], v = O.vis[i]; if (!f && !v) continue; const x = O.x0 + (i % O.w) * C, y = O.y0 + Math.floor(i / O.w) * C;
      if (f) { ctx.fillStyle = `rgba(${COL[f]},.38)`; ctx.fillRect(x, y, C, C); } else { ctx.fillStyle = `rgba(${COL[v]},.55)`; ctx.fillRect(x, y, C, 1); ctx.fillRect(x, y, 1, C); } }
    ctx.restore();
  }
  function dbgHud() {
    if (!DBG || mode !== 'play') { const el = document.getElementById('occDbg'); if (el) el.style.display = 'none'; return; }
    const R = G && G.dun && G.dun.cur, O = R && R.occ; let el = document.getElementById('occDbg');
    if (!el) { el = document.createElement('div'); el.id = 'occDbg'; el.className = 'hud pf glass'; el.style.cssText = 'left:8px;top:120px;padding:6px 8px;font:8px/12px Galmuri7;color:var(--ink);white-space:nowrap'; document.getElementById('ui').appendChild(el); }
    const sk = O ? Object.entries(O.skip).map(([k, n]) => `${k} ${n}`).join(' · ') : '';
    const key = (O ? R.id : '') + sk; if (el.dataset.k === key) { el.style.display = 'block'; return; } el.dataset.k = key;
    el.innerHTML = Object.entries(NAME).map(([v, n]) => `<span style="color:rgb(${COL[v]})">■</span> ${n}`).join('<br>') + `<br>진하게 = 발 자리 · 선 = 그림 자리<br>비켜 간 수: ${sk || '없음'}`;
    el.style.display = 'block';
  }
  { const T = TRUTH, o = { tick: T.tick, top: T.top, hud: T.hud };
    T.tick = dt => { o.tick(dt); dbgTick(); };
    T.hud = () => { o.hud(); dbgDraw(); dbgHud(); }; }

  return { on, prop, wall, stamp, RULE, get cur() { return CUR; }, set stat(v) { STAT = v; }, get stat() { return STAT; }, get dbg() { return DBG; }, set dbg(v) { DBG = !!v; } };
})();
