'use strict';
// 잿빛 왕관 원정대 — 80_firefx.js : v3.83 바닥불 공용 그림 (시안 _시안/교주2페이즈_불연출_바닥불_시안01.html)
//  · 유저 바닥불(G.pfire — 화상 장판 · 처형검 · 촛농 · 각성 등)과 교주 2페이즈 칼 궤적 불(G.vfire, 피해 없음)이 같은 그림을 씀
//  · 그을린 자국 · 깜빡이는 잉걸 바닥(8fps로 다시 그려 캐시) · 불꽃 혀(아래 넓고 위로 가늘어지며 12fps로 흔들림, 모양 캐시) · 꺼질 때 잉걸만 남았다가 그을린 자국이 디더로 사라짐
//  · 피해 판정은 그대로 (G.pfire 반지름 26px) — 그림만 바뀜
const FIREFX = (() => {
  const C = 2, FC = { r: '#b8300c', R: '#d8461a', o: '#ff7a1e', y: '#ffc848', w: '#fff2b8', k: '#4a0e06' };
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], dth = (x, y, v) => v > (BAY[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  const hh = (a, b, c = 0) => { const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return v - Math.floor(v); };
  const META = new WeakMap(); // 불 하나의 그림 정보 (불꽃 혀 자리 · 잉걸 캐시)
  function meta(f, r, nT) { let m = META.get(f); if (m) return m; const cx = Math.round(f.x / C), cy = Math.round(f.y / C), n = nT || Math.max(3, Math.round(r / 2.6)), tg = [];
    for (let i = 0; i < n; i++) { const a = (i / n + hh(cx, cy, i) * 0.25) * Math.PI * 2, d = i === 0 ? 0 : (0.45 + hh(cy, cx, i + 9) * 0.4) * r * 0.75; tg.push({ dx: Math.round(Math.cos(a) * d), dy: Math.round(Math.sin(a) * d * 0.6), H: (i === 0 ? 12 : 8) + Math.floor(hh(i, cx, cy) * 4), ph: hh(i, cy, 3) * 10 }); }
    tg.sort((p, q) => p.dy - q.dy); m = { cx, cy, r, tg, born: time, dur: f.dur || f.t || 1, cv: null, key: '' }; META.set(f, m); return m; }
  function life(m, u) { const grow = Math.min(1, u / 0.15), end = Math.max(0, Math.min(1, (m.dur - u) / 0.5));
    return { flame: u < m.dur ? Math.min(grow, end) : 0, bed: u < m.dur ? Math.min(1, u / 0.1) * (0.4 + 0.6 * end) : 0, scorch: u < m.dur ? Math.min(1, u / 0.3) : Math.max(0, 1 - (u - m.dur) / 0.8) }; }
  // 바닥 (그을림 + 잉걸): 8fps · 단계별로만 다시 그림
  function ground(m, L) { const st = Math.floor(time * 8), key = st + '|' + Math.round(L.bed * 6) + '|' + Math.round(L.scorch * 6); if (m.key === key && m.cv) return m.cv; m.key = key;
    const R = m.r, W = (R + 2) * 2 + 1, H = Math.ceil(R * 0.7 + 2) * 2 + 1; if (!m.cv) { m.cv = document.createElement('canvas'); m.cv.width = W * C; m.cv.height = H * C; }
    const g = m.cv.getContext('2d'); g.clearRect(0, 0, m.cv.width, m.cv.height); const ox = R + 2, oy = Math.ceil(R * 0.7 + 2);
    for (let y = -oy; y <= oy; y++) for (let x = -ox; x <= ox; x++) { const X = m.cx + x, Y = m.cy + y, q = Math.hypot(x / (R + 0.5), y / (R * 0.7 + 0.5)) + (hh(X, Y) - 0.5) * 0.35; if (q > 1) continue;
      if (L.scorch > 0 && dth(X, Y, 0.55 * L.scorch * (1.1 - q * 0.5))) { g.fillStyle = 'rgba(14,8,6,.75)'; g.fillRect((x + ox) * C, (y + oy) * C, C, C); }
      if (L.bed > 0 && q < 0.85) { const n = hh(X, Y, st % 5); if (dth(X, Y, L.bed * (1 - q) * 0.9)) { g.fillStyle = n > 0.82 ? FC.y : n > 0.55 ? FC.o : n > 0.25 ? FC.r : FC.k; g.fillRect((x + ox) * C, (y + oy) * C, C, C); } } }
    m.ox = ox; m.oy = oy; return m.cv; }
  // 불꽃 혀 모양 캐시 (높이 · 흔들림 단계 · 위상)
  const TC = new Map();
  function tongueCv(h, st, ph) { const key = h + '|' + (st % 8) + '|' + Math.floor(ph * 0.6); let c = TC.get(key); if (c) return c;
    const base = h >= 8 ? 2 : 1, cells = [];
    for (let j = 0; j < h; j++) { const tt = j / h, w = Math.round(base * Math.pow(1 - tt, 0.8) + (tt < 0.25 ? 0.4 : 0)), sway = j > h * 0.45 ? Math.round(Math.sin((st % 8) * 0.9 + Math.floor(ph * 0.6) * 1.7 + j * 0.5) * (j > h * 0.75 ? 1.4 : 0.8)) : 0;
      for (let m = -w; m <= w; m++) { const a = Math.abs(m) / Math.max(1, w), col = tt > 0.82 ? (a > 0.5 ? null : FC.o) : (tt < 0.45 && a < 0.4) ? (tt < 0.22 ? FC.w : FC.y) : a < 0.55 ? FC.o : (tt > 0.6 ? FC.r : FC.R); if (col) cells.push([m + sway, -j, col]); } }
    if (hh(st % 8, Math.floor(ph * 0.6), 7) > 0.6) cells.push([Math.round(Math.sin(st + ph) * 1.5), -h - 1 - (st % 2), FC.y]); // 떨어져 나간 불티
    const has = new Set(cells.map(q => q[0] * 999 + q[1])), PX = 5, cv = document.createElement('canvas'); cv.width = (PX * 2 + 1) * C; cv.height = (h + 4) * C; const g = cv.getContext('2d'), ox = PX, oy = h + 2;
    g.fillStyle = FC.k; for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1]]) if (!has.has((x + dx) * 999 + y + dy) && (dy === 1 || y > -h * 0.5)) g.fillRect((x + dx + ox) * C, (y + dy + oy) * C, C, C);
    for (const [x, y, col] of cells) { g.fillStyle = col; g.fillRect((x + ox) * C, (y + oy) * C, C, C); }
    c = { cv, ox, oy }; if (TC.size > 900) TC.clear(); TC.set(key, c); return c; }
  function drawTongue(x, y, H, ph, k) { const st = Math.floor(time * 12 + ph * 3), h = Math.max(0, Math.round(H * k * (0.82 + 0.18 * hh(st, ph)))); if (h < 2) return; const T = tongueCv(h, st, ph); ctx.drawImage(T.cv, (x - T.ox) * C, (y - T.oy) * C); }
  // ---------------------------------------------------------------- 목록: 유저 불(G.pfire · 남은 시간 t) + 교주 칼 궤적 불(G.vfire · t0/dur, 피해 없음) + 꺼진 뒤 그을린 자국(ASH)
  let ASH = [], LIVE = [], ROOM = null;
  const pr = f => f.r || 13;
  function sync() { const R = G && G.dun && G.dun.cur; if (R !== ROOM) { ROOM = R; ASH = []; LIVE = []; G.vfire = []; }
    const now = new Set(G.pfire || []); for (const f of LIVE) if (!now.has(f)) { const m = META.get(f); if (m) ASH.push({ m, t0: time }); } LIVE = [...now];
    ASH = ASH.filter(a => time - a.t0 < 0.8); if (G.vfire) G.vfire = G.vfire.filter(f => time - f.t0 < f.dur + 0.8); }
  function each(fn) { // 유저 불 · 교주 불 · 그을린 자국을 한 번에 (불이 많으면 불꽃 혀 수를 줄임)
    const P = G.pfire || [], V = G.vfire || [], n = P.length + V.length, cap = n > 12 ? Math.max(1, Math.floor(48 / n)) : 99;
    for (const f of P) { const m = meta(f, pr(f)); fn(m, life(m, m.dur - f.t), cap); }
    for (const f of V) { const u = time - f.t0; if (u < 0) continue; const m = meta(f, f.r, f.n); m.dur = f.dur; m.small = f.small || 1; fn(m, life(m, u), cap); }
    for (const a of ASH) fn(a.m, { flame: 0, bed: 0, scorch: Math.max(0, 1 - (time - a.t0) / 0.8) }, 0); }
  // 예전 그림 대신: 바닥은 drawGearGround에서 · 불꽃 혀는 깊이 정렬(gearEnts)에서
  { const o = drawGearGround; drawGearGround = function () { const keep = G && G.pfire; if (G) G.pfire = []; try { return o.apply(this, arguments); } finally { if (G) { G.pfire = keep; try { sync(); ctx.save(); ctx.globalCompositeOperation = 'source-over'; each((m, L) => { if (L.scorch <= 0 && L.bed <= 0) return; const cv = ground(m, L); ctx.drawImage(cv, (m.cx - m.ox) * C, (m.cy - m.oy) * C); }); ctx.restore(); } catch (e) { console.error(e); } } } }; }
  { const o = gearEnts; gearEnts = function (ents) { const keep = G && G.pfire; if (G) G.pfire = []; try { o.apply(this, arguments); } finally { if (G) G.pfire = keep; }
      try { each((m, L, cap) => { if (L.flame <= 0) return; const k = L.flame, sm = m.small || 1; m.tg.slice(0, cap).forEach(q => ents.push({ y: (m.cy + q.dy) * C, d: () => drawTongue(m.cx + q.dx, m.cy + q.dy, q.H * sm, q.ph, k) })); }); } catch (e) { console.error(e); } }; }
  // 교주 칼 궤적 불: 칼끝이 지나간 호를 따라 휘두르는 순서대로 켜졌다가 0.6초 뒤 꺼짐 (피해 없음)
  function trail(cx, cy, ang, arc, r, dir) { const n = Math.max(5, Math.round(arc * r / 14)); (G.vfire = G.vfire || []);
    for (let i = 0; i < n; i++) { const k = n > 1 ? i / (n - 1) : 0, a = ang - arc / 2 * (dir || 1) + arc * k * (dir || 1); G.vfire.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, r: 5, n: 2, small: 0.8, dur: 0.6, t0: time + k * 0.12 }); } }
  return { trail, sync };
})();
