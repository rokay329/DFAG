'use strict';
// 잿빛 왕관 원정대 — 66_wallholes.js : v3.36 2장 · 4장 성벽 공격 구멍 (시안 _시안/2장4장_성벽공격구멍_움짤시안07.html)
//  · 2장: 윗벽 벽돌 덩어리(줄눈을 따라 자른 위 1장 · 가운데 2장 · 아래 1장)가 뒤로 쑥 들어갔다가 옆으로 밀려 열림 → 검은 구멍 속 해골 궁수의 붉은 눈, 조준할 때 화살촉 → 화살
//  · 4장: 문 없이 윗벽에 잿불 마법진이 그려지고 가운데서 마법탄이 자람 → 마법탄 (발사 뒤 흩어져 사라짐)
//  · 쏘기 전 바닥에 일자 전조(구멍 아래 ~ 방 아래 벽) 0.7초. 구멍 둘씩 0.35초 엇갈려 열리고 2.4초 뒤 나머지
//  · 일반 전투 방만: 너비 1050 이상 4구 · 900 이상 3구 (작은 방 · 복도 · 좁은 방은 없음). 구멍은 벽 장식 · 기둥과 겹치지 않는 빈 벽에
//  · 방의 전투가 끝나면 열려 있던 구멍이 닫히고 다시 열리지 않음 (예고 · 날아가던 탄도 사라짐)
const WALLH = (() => {
  const OPEN = 0.4, AIM = 0.7, HOLD = 0.3, CLOSE = 0.3, CYC = 4.8, LAG = 0.35, HALF = 2.4, WARM = 1.2;
  const WHO = { type: 'wallhole', dead: false, x: 0, y: 0 }; // 예고 주인 (전투가 끝나면 이 주인의 예고만 지움)
  const sn = v => Math.round(v / 2) * 2;
  const hash = (a, b, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(sn(x), sn(y), 2, 2); };
  function dith(cx, cy, rx, ry, col) { ctx.fillStyle = col; for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) { if ((x * x) / (rx * rx) + (y * y) / (ry * ry) > 1) continue; const X = sn(cx + x), Y = sn(cy + y); if (((X + Y) / 2) % 2 === 0) ctx.fillRect(X, Y, 2, 2); } }
  // ---------------------------------------------------------------- 자리 찾기 (바닥 그림에서 빈 벽돌 벽을 읽음)
  function find(R, n) {
    const fc = fg.canvas, y0 = Math.max(0, A.y0 - 100), y1 = A.y0, x0 = Math.max(0, A.x0), x1 = Math.min(fc.width, A.x1);
    let D; try { D = fg.getImageData(x0, y0, x1 - x0, y1 - y0); } catch (e) { return []; }
    const W = D.width, H = D.height, d = D.data, key = (x, y) => { const i = ((y - y0) * W + (x - x0)) * 4; return (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; };
    const lum = (x, y) => { const i = ((y - y0) * W + (x - x0)) * 4; return d[i] + d[i + 1] + d[i + 2]; };
    // 벽 바탕: 벽돌 · 줄눈처럼 어둡고 무채색인 칸 (기둥은 밝고, 깃발 · 초상화 · 창은 색이 있어 빠짐)
    const ls = []; for (let y = y0; y < y1; y += 3) for (let x = x0; x < x1; x += 3) ls.push(lum(x, y)); ls.sort((a, b) => a - b); const med = ls[ls.length >> 1];
    const isWall = (x, y) => { const i = ((y - y0) * W + (x - x0)) * 4, r = d[i], g = d[i + 1], b = d[i + 2], L = r + g + b; return L <= med + 50 && L >= med - 70 && Math.max(r, g, b) - Math.min(r, g, b) <= 24; };
    const O = R.occ, occWall = (xa, ya, xb, yb) => { if (!O || !O.vis) return false; for (let y = ya; y <= yb; y += 4) for (let x = xa; x <= xb; x += 4) { const cx = Math.floor((x - O.x0) / 4), cy = Math.floor((y - O.y0) / 4); if (cx < 0 || cy < 0 || cx >= O.w || cy >= O.h) continue; const v = O.vis[cy * O.w + cx]; if (v && v <= 4) return true; } return false; };
    const plain = x => { const xa = x - 22, xb = x + 22, ya = A.y0 - 78, yb = A.y0 - 30; if (xa < x0 + 6 || xb > x1 - 6 || ya < y0) return false;
      let ok = 0, all = 0; for (let y = ya; y <= yb; y += 1) for (let xx = xa; xx <= xb; xx += 1) { all++; if (isWall(xx, y)) ok++; }
      return ok / all >= 0.95 && !occWall(xa, ya, xb, yb); };
    // 후보: 기둥 사이 칸마다 — 빈 칸은 가운데, 장식이 걸린 칸은 장식 옆 빈 벽 (벽 장식 배치표 WDECO와 기둥 자리 PILLARS를 그대로 읽음)
    const cand = [], doorN = R.doors && R.doors.n != null;
    const ART = G.stage === 4 ? { banner: 'crest4', banner2: 'crest4b', portrait: 'portrait4', niche: 'urn4', window: 'w4' } : { banner: 'tapestry2', banner2: 'tapestry2t', portrait: 'portrait2', chains: 'chains2', niche: 'niche2', window: 'w2' };
    if (typeof PILLARS !== 'undefined' && PILLARS.length > 1 && typeof WDECO !== 'undefined') {
      const L = WDECO.layout(R);
      for (let i = 0; i + 1 < PILLARS.length; i++) { const pa = PILLARS[i] + 32, pb = PILLARS[i + 1] - 32, mx = WDECO.slotX(i), k = L[i]; if (pb - pa < 0) continue;
        if (pb - pa > 160) { for (const f of [0.22, 0.78]) cand.push(Math.round((pa + (pb - pa) * f) / 2) * 2); continue; } // 넓은 칸(북문 칸): 문 양옆
        if (!k || k === 'empty') cand.push(mx);
        else { const w = ART[k] ? WDECO.size(ART[k])[0] : 44, off = w / 2 + 24; for (const sx of [mx - off, mx + off]) if (sx >= pa && sx <= pb) cand.push(Math.round(sx / 2) * 2); } }
    } else for (let x = x0 + 40; x <= x1 - 40; x += 2) cand.push(x);
    for (let i = cand.length - 1; i >= 0; i--) { const x = cand[i]; if (!plain(x) || (doorN && Math.abs(x - CX) < 70)) cand.splice(i, 1); }
    const out = [], span = x1 - x0;
    for (let i = 0; i < n; i++) { const tx = x0 + (i + 0.5) * span / n; let best = null;
      for (const c of cand) { if (Math.abs(c - tx) > 80 || out.some(o => Math.abs(o - c) < 84)) continue; if (best == null || Math.abs(c - tx) < Math.abs(best - tx)) best = c; }
      if (best != null) out.push(best); }
    return out.map(x => ({ x, bricks: G.stage === 2 ? bricksAt(x, lum, y0, y1, x0, x1) : null }));
  }
  // 벽돌 줄눈 읽기: 가로 줄눈(어두운 줄) · 세로 줄눈(어두운 칸) → 위 1장 · 가운데 2장 · 아래 1장
  function bricksAt(x, lum, y0, y1, x0, x1) {
    const rowL = y => { let s = 0; for (let xx = x - 20; xx <= x + 20; xx++) s += lum(xx, y); return s / 41; };
    const ys = []; for (let y = Math.max(y0 + 1, A.y0 - 90); y < Math.min(y1 - 1, A.y0 - 20); y++) ys.push([y, rowL(y)]);
    const mean = ys.reduce((a, b) => a + b[1], 0) / ys.length;
    const M = ys.filter(([y, v], i) => v < mean * 0.82 && (i === 0 || v <= ys[i - 1][1]) && (i === ys.length - 1 || v <= ys[i + 1][1])).map(q => q[0]).filter((y, i, a) => i === 0 || y - a[i - 1] > 2);
    let j = -1, bd = 1e9; for (let i = 0; i + 3 < M.length; i++) { const dd = Math.abs(M[i] - (A.y0 - 67)); if (dd < bd) { bd = dd; j = i; } }
    const fallback = () => { const hx = x; return { hx, rects: [[hx - 9, A.y0 - 66, 18, 7], [hx - 18, A.y0 - 58, 36, 7], [hx - 9, A.y0 - 50, 18, 7]] }; };
    if (j < 0) return fallback();
    const rows = [[M[j] + 1, M[j + 1]], [M[j + 1] + 1, M[j + 2]], [M[j + 2] + 1, M[j + 3]]];
    const cols = (ya, yb) => { const v = []; for (let xx = Math.max(x0 + 1, x - 44); xx <= Math.min(x1 - 2, x + 44); xx++) { let s = 0; for (let y = ya; y < yb; y++) s += lum(xx, y); v.push([xx, s / Math.max(1, yb - ya)]); }
      const m = v.reduce((a, b) => a + b[1], 0) / v.length; return v.filter(([xx, q], i) => q < m * 0.82 && (i === 0 || q <= v[i - 1][1]) && (i === v.length - 1 || q <= v[i + 1][1])).map(q => q[0]).filter((c, i, a) => i === 0 || c - a[i - 1] > 3); };
    const mid = cols(rows[1][0], rows[1][1]); if (mid.length < 3) return fallback();
    let c = mid.reduce((a, b) => Math.abs(b - x) < Math.abs(a - x) ? b : a), ci = mid.indexOf(c); if (ci <= 0 || ci >= mid.length - 1) return fallback();
    const hx = c, rects = [];
    const one = r => { const cs = cols(r[0], r[1]); const L = cs.filter(q => q < hx).pop(), Rr = cs.find(q => q > hx); if (L == null || Rr == null) return null; return [L + 1, r[0], Rr - L - 1, r[1] - r[0]]; };
    const a = one(rows[0]), b = [mid[ci - 1] + 1, rows[1][0], mid[ci + 1] - mid[ci - 1] - 1, rows[1][1] - rows[1][0]], e = one(rows[2]);
    if (!a || !e || b[2] > 60 || a[2] > 40 || e[2] > 40) return fallback();
    return { hx, rects: [a, b, e] };
  }
  // ---------------------------------------------------------------- 방 준비
  function setup(R) {
    G.wh = null;
    if (!(G.stage === 2 || G.stage === 4) || !R || R.type !== 'combat' || R.cleared || (G.dun && G.dun.forge)) return;
    const w = A.x1 - A.x0, h = A.y1 - A.y0, n = w >= 1050 && h >= 400 ? 4 : w >= 900 && h >= 400 ? 3 : 0;
    if (!n) return;
    const H = find(R, n); if (!H.length) return;
    H.sort((a, b) => a.x - b.x).forEach((q, i) => { const g = i % 2, k = (i - g) / 2; q.off = g * HALF + k * LAG; q.cyc = -1; q.k = 0; q.aimT = null; q.firedT = null; });
    G.wh = { st: G.stage, holes: H, t: 0, on: false, end: false, endT: 0 };
  }
  const dmgOf = st => (st === 2 ? 16 : 18) * ((typeof STG === 'function' && STG().atkMul) || 1);
  function fire(q, st) {
    const len = A.y1 - A.y0 - 4, x = q.bricks ? q.bricks.hx : q.x;
    if (st === 2) { G.eproj.push({ x, y: A.y0 + 4, ang: Math.PI / 2, sp: 900, r: 4, dmg: dmgOf(2), t: len / 900, hist: [], kind: 'arrow', wh: true }); sfx('swing', 0.6); }
    else { G.eproj.push({ x, y: A.y0 + 4, ang: Math.PI / 2, sp: 470, r: 6, dmg: dmgOf(4), t: len / 470, hist: [], kind: 'fireball', wh: true }); sfx('whoosh', 0.6); }
  }
  function update(dt) {
    const W = G.wh; if (!W) return;
    const R = G.dun && G.dun.cur, rs = G.rs;
    if (!W.end && R && R.cleared) { W.end = true; W.endT = 0; G.tele = G.tele.filter(t => t.owner !== WHO); G.eproj = G.eproj.filter(p => !p.wh); }
    if (W.end) { W.endT += dt; for (const q of W.holes) q.k = Math.max(0, q.k - dt / CLOSE); return; }
    if (!W.on) { if (rs && (rs.state === 'run' || rs.state === 'invade') && G.enemies.some(e => !e.dead && !isDummy(e))) { W.on = true; W.t = -WARM; } else return; }
    W.t += dt;
    for (const q of W.holes) {
      const tt0 = W.t - q.off; if (tt0 < 0) { q.k = 0; continue; }
      const cyc = Math.floor(tt0 / CYC), tt = tt0 - cyc * CYC;
      q.aim = null; q.fired = null;
      if (tt < OPEN) q.k = tt / OPEN; else if (tt < OPEN + AIM) { q.k = 1; q.aim = (tt - OPEN) / AIM; } else if (tt < OPEN + AIM + HOLD) { q.k = 1; q.fired = tt - OPEN - AIM; } else if (tt < OPEN + AIM + HOLD + CLOSE) q.k = 1 - (tt - OPEN - AIM - HOLD) / CLOSE; else q.k = 0;
      if (tt >= OPEN && q.cyc !== cyc) { q.cyc = cyc; const x = q.bricks ? q.bricks.hx : q.x, st = W.st; // 조준: 바닥 일자 예고 → 끝나면 발사
        sfx('warn', 0.35);
        G.tele.push({ shape: 'line', x, y: A.y0 + 2, ang: Math.PI / 2, len: A.y1 - A.y0 - 2, w: 14, t: 0, dur: AIM, owner: WHO, heavy: true, noImpact: true, onFire: () => { if (G.wh === W && !W.end) fire(q, st); } }); }
    }
  }
  // ---------------------------------------------------------------- 그리기 (바닥 층: 벽 그림 바로 위)
  function launcherless2(q) { // 2장 벽돌 비밀문
    const B = q.bricks, k = q.k; if (!B || k <= 0) return;
    const hx = B.hx, Rr = B.rects, push = Math.min(1, k / 0.45), slide = Math.max(0, (k - 0.45) / 0.55), depth = Math.round(push * 2) * 2, dx = Math.round(slide * 38 / 2) * 2;
    const top = Math.min(...Rr.map(r => r[1])), bot = Math.max(...Rr.map(r => r[1] + r[3]));
    ctx.save(); ctx.beginPath(); for (const r of Rr) ctx.rect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2); ctx.clip();
    ctx.fillStyle = '#000000'; ctx.fillRect(hx - 40, top - 2, 80, bot - top + 4);
    if (slide > 0.55) { const ey = top + 10; px(hx - 6, ey, '#ff3a2a'); px(hx + 4, ey, '#ff3a2a'); px(hx - 6, ey - 2, '#7a1810'); px(hx + 4, ey - 2, '#7a1810'); // 해골 궁수 붉은 눈
      if (q.aim != null) { px(hx - 1, top + 18, '#e8e0cc'); px(hx - 1, top + 20, '#a09888'); px(hx - 3, top + 18, '#5a4a38'); px(hx + 1, top + 18, '#5a4a38'); } } // 화살촉
    for (const r of Rr) { const X = r[0] + dx;
      ctx.drawImage(fg.canvas, r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2, X - 1, r[1] - 1, r[2] + 2, r[3] + 2);
      ctx.fillStyle = `rgba(0,0,0,${0.12 + push * 0.38})`; ctx.fillRect(X - 1, r[1] - 1, r[2] + 2, r[3] + 2);
      if (depth > 0) { ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(X - 1, r[1] - 1, r[2] + 2, depth); ctx.fillRect(X - 1, r[1] - 1, depth, r[3] + 2); }
      if (slide > 0) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(X - 3, r[1] - 1, 2, r[3] + 2); } }
    ctx.restore();
    const inS = (x, y) => Rr.some(r => x >= r[0] - 1 && x < r[0] + r[2] + 1 && y >= r[1] - 1 && y < r[1] + r[3] + 1);
    ctx.fillStyle = `rgba(4,2,6,${Math.min(1, push * 1.6)})`;
    for (const r of Rr) for (let x = r[0] - 2; x <= r[0] + r[2] + 1; x++) for (let y = r[1] - 2; y <= r[1] + r[3] + 1; y++) { if (inS(x, y)) continue; if (inS(x + 1, y) || inS(x - 1, y) || inS(x, y + 1) || inS(x, y - 1)) ctx.fillRect(x, y, 1, 1); }
  }
  function orb(x, y, R) { const f = Math.floor(time * 14), cx = sn(x), cy = sn(y);
    dith(cx, cy, R * 2 + 6, R * 2 + 6, 'rgba(255,110,30,.25)');
    for (let j = -R - 1; j <= R + 1; j++) for (let i = -R - 1; i <= R + 1; i++) { const n = (hash(i + 40, j + 40, f) - 0.5) * 0.8, q = Math.hypot(i, j) / (R + n * 0.5); let c = null;
      if (q <= 1) c = q < 0.4 ? '#ffd060' : q < 0.7 ? (hash(i, j, f) < 0.25 ? '#ffd060' : '#ff7a20') : '#c0401a'; else if (q <= 1.15) c = '#2a2420'; if (c) { ctx.fillStyle = c; ctx.fillRect(cx + i * 2, cy + j * 2, 2, 2); } } }
  function rune4(q) { // 4장 벽면 마법진
    const k = q.k, fade = q.fired != null ? q.fired / HOLD : (q.aim == null && k < 1 && q.k > 0 && q.cyc >= 0 && q.closing ? 1 : null);
    if (k <= 0) return; const closing = q.aim == null && q.fired == null && k < 1 && q.wasOpen; const al = q.fired != null ? Math.max(0, 1 - q.fired / HOLD) : closing ? 0 : 1; if (al <= 0) return;
    const cx = q.x, cy = A.y0 - 50, R = 16, sweep = Math.min(1, k / 0.6), inner = Math.max(0, (k - 0.4) / 0.6), t = time;
    ctx.save(); ctx.globalAlpha = al;
    dith(cx, cy, R + 4, R + 4, 'rgba(255,110,30,.18)');
    const ringPx = (r, frac, col) => { const n = Math.round(r * 6.3); for (let i = 0; i < n * frac; i++) { const a = -Math.PI / 2 + i / n * TAU; px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, col); } };
    ringPx(R, sweep, '#ff7a20'); ringPx(R - 3, sweep, '#c0401a');
    if (inner > 0) { ringPx(8, inner, '#ffd060');
      for (let i = 0; i < 6; i++) { const a = t * 1.6 + i / 6 * TAU, x = cx + Math.cos(a) * (R - 1.5), y = cy + Math.sin(a) * (R - 1.5); px(x, y, '#ffd060'); px(x + Math.cos(a + 1.57) * 2, y + Math.sin(a + 1.57) * 2, '#ff7a20'); }
      for (let i = 0; i < 3; i++) { const a = -t * 2.2 + i / 3 * TAU; for (let d = 2; d <= 7; d += 2) px(cx + Math.cos(a) * d, cy + Math.sin(a) * d, inner > 0.8 ? '#ff7a20' : '#c0401a'); } }
    if (q.fired != null && q.fired < HOLD * 0.25) dith(cx, cy, R + 2, R + 2, '#ffd060');
    ctx.restore();
    if (q.aim != null && q.aim > 0) orb(cx, cy, 1 + Math.round(q.aim * 3));
  }
  function draw() {
    const W = G.wh; if (!W) return;
    for (const q of W.holes) { if (q.k >= 1) q.wasOpen = true; if (q.k <= 0) q.wasOpen = false; if (W.st === 2) launcherless2(q); else rune4(q); }
  }
  return { setup, update, draw, find };
})();
{ const o = enterRoom; enterRoom = function (R) { const r = o.apply(this, arguments); try { WALLH.setup(R); } catch (e) { G.wh = null; } return r; }; }
{ const o = updateEProj; updateEProj = function (dt) { const r = o.apply(this, arguments); WALLH.update(dt); return r; }; }
{ const o = drawAshClouds; drawAshClouds = function () { WALLH.draw(); return o.apply(this, arguments); }; }
