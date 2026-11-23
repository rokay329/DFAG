'use strict';
// 잿빛 왕관 원정대 — 47_awk.js : v3.23 각성기 개편 (그레이브 「등 맡기기」는 그대로)
//  · 기사 「성채의 맹세」: 8초 — 갑옷이 빛나며 넉백·경직 무시, 평타 3타마다 빛의 검 충격파
//  · 어쌔신 「개다래나무 가지」: 7초 — 몸에 붉은 오라, 눈이 붉어짐. 공격 속도 · 이동 속도(대폭) · 치명타 확률 증가
//  · 마법사 「영혼박리」: 10초 — 마나로 된 분신이 따라다니며 평타(마력탄)를 따라 쏨. 우클릭 기술은 따라 하지 않음
//  · 성직자 「기적」: 패시브 — 직접 쓸 수 없음. 한 판에 한 번, 쓰러지면 하트 1.5칸으로 되살아남
const AWK = (() => {
  const DUR = { knight: 8, ranger: 7, mage: 10 };
  const S = { g: null, waves: [], clone: null, q: [], bolts: [] };
  const reset = () => { if (S.g !== G) { S.g = G; S.waves = []; S.clone = null; S.q = []; S.bolts = []; } };
  const on = cls => { const P = G && G.player; return !!(P && G.cls === cls && P.awakenT > 0 && P.awkCls === cls && !P.dead); };
  const FXK = KRS.FXK, blast = GRS.blast;
  const live = e => e && !e.dead && e.type !== 'flag', foes = () => G.enemies.filter(live);
  const px2 = (x, y, c, s = 2) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, s, s); };

  function start() {
    reset(); const P = G.player, c = G.cls; let d = DUR[c]; if (!d) return false;
    if (c === 'mage' && wSkill() === 'hourglass') d += 4; // 모래시계 지팡이: 분신이 더 오래 남음
    P.gauge = 0; P.awakenT = d; P.awkMax = d; P.awkCls = c; P.queued = false;
    sfx('awaken'); FXK.punch(8, 0.03, 0.06);
    if (c === 'knight') { FXK.flash('#fff0b0', 0.12); FXK.ring(P.x, P.y, '#ffe08a', 380, 0.4, 10); FXK.rays(P.x, P.y - 14, 16, 90, '#fff0b0', 0.3); for (let i = 0; i < 18; i++) { const a = rand(0, TAU); G.parts.push({ x: P.x + Math.cos(a) * 10, y: P.y - 10 + Math.sin(a) * 8, vx: Math.cos(a) * 90, vy: Math.sin(a) * 60 - 40, t: 0.5, c: pick(['#ffe08a', '#fffbe6', '#d8a038']), g: 0, glow: true }); } sfx('block', 0.6); }
    if (c === 'ranger') { FXK.flash('#ff2030', 0.1); FXK.ring(P.x, P.y, '#ff3040', 340, 0.35, 8); for (let i = 0; i < 20; i++) { const a = rand(0, TAU); G.parts.push({ x: P.x, y: P.y - 10, vx: Math.cos(a) * rand(60, 140), vy: Math.sin(a) * rand(40, 90) - 30, t: 0.45, c: pick(['#ff3040', '#ff8080', '#a01018']), g: 0, glow: true }); } sfx('growl', 1.4); }
    if (c === 'mage') { S.clone = { x: P.x - P.face * 4, y: P.y, face: P.face, t: 0, a: 0 }; FXK.flash('#a8d8ff', 0.1); FXK.ring(P.x, P.y, '#9ad8ff', 300, 0.4, 8); for (let i = 0; i < 16; i++) { const a = rand(0, TAU); G.parts.push({ x: P.x, y: P.y - 12, vx: Math.cos(a) * 80, vy: Math.sin(a) * 50, t: 0.5, c: pick(['#9ad8ff', '#e0f4ff', '#4a8cff']), g: 0, glow: true }); } sfx('blip', 0.6); }
    return true;
  }

  // ---------------------------------------------------------------- 기사: 빛의 검 충격파
  function wave() { const P = G.player; S.waves.push({ x: P.x + Math.cos(P.atkAng) * 16, y: P.y - 6 + Math.sin(P.atkAng) * 12, a: P.atkAng, t: 0, life: 0.5, hit: new Set(), lastF: 0, ex: wSkill() === 'exec' }); sfx('whoosh', 0.8); sfx('bolt', 1.3); FXK.punch(3, 0.01, 0.01, P.atkAng); }
  function updWaves(dt) {
    for (const W of S.waves) { W.t += dt; const sp = 430 * (1 - W.t / W.life * 0.4); W.x += Math.cos(W.a) * sp * dt; W.y += Math.sin(W.a) * sp * dt * 0.8;
      if (blocked(W.x - Math.cos(W.a) * sp * dt, W.y + 6 - Math.sin(W.a) * sp * dt * 0.8, W.x, W.y + 6)) { W.t = W.life; FXK.ring(W.x, W.y + 6, '#ffe08a', 160, 0.25, 4); }
      const nx = -Math.sin(W.a), ny = Math.cos(W.a);
      for (const e of foes()) { if (W.hit.has(e)) continue; const dx = e.x - W.x, dy = e.y - 8 - W.y, along = dx * Math.cos(W.a) + dy * Math.sin(W.a), side = dx * nx + dy * ny;
        if (Math.abs(along) < 16 + e.r && Math.abs(side) < 28 + e.r) { W.hit.add(e); damageEnemy(e, 1.6, { ang: W.a, kb: 140, grogi: 10, gauge: 0 }); blast(e.x, e.y - 12, 16, ['#ffffff', '#fffbe6', '#ffe08a', '#d8a038', '#7a5a18', '#2a1e08']); sfx('hit', 1.2); } }
      if (W.ex && W.t - W.lastF > 0.07) { W.lastF = W.t; (G.pfire = G.pfire || []).push({ x: W.x, y: W.y + 8, t: 4, tick: 0 }); }
      if (Math.random() < 0.8) G.parts.push({ x: W.x + nx * rand(-24, 24), y: W.y + ny * rand(-24, 24) * 0.8, vx: -Math.cos(W.a) * 40, vy: -20, t: 0.3, c: pick(['#ffe08a', '#fffbe6']), g: 0, glow: true }); }
    S.waves = S.waves.filter(W => W.t < W.life);
  }
  const blocked = (x0, y0, x1, y1) => segSolid(x0, y0, x1, y1, 4) || x1 < A.x0 + 6 || x1 > A.x1 - 6 || y1 < A.y0 + 6 || y1 > A.y1 - 6;
  function drawWave(W) { const k = W.t / W.life, al = k < 0.8 ? 1 : (1 - k) / 0.2, nx = -Math.sin(W.a), ny = Math.cos(W.a), ux = Math.cos(W.a), uy = Math.sin(W.a) * 0.8;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let tr = 3; tr >= 0; tr--) { ctx.globalAlpha = al * (tr ? 0.25 * (4 - tr) / 3 : 1); const bx = W.x - ux * tr * 9, by = W.y - uy * tr * 9;
      for (let s = -28; s <= 28; s += 2) { const bow = (1 - (s / 28) ** 2) * 10, x = bx + nx * s + ux * bow, y = by + ny * s * 0.8 + uy * bow; const edge = Math.abs(s) > 22;
        px2(x, y, tr ? '#d8a038' : edge ? '#ffe08a' : '#ffffff'); if (!tr && !edge) { px2(x - ux * 2, y - uy * 2, '#fff0b0'); px2(x - ux * 4, y - uy * 4, '#d8a038'); } } }
    ctx.restore(); }

  // ---------------------------------------------------------------- 공용: 몸 둘레 빛 테두리 (회피 테두리와 같은 방식)
  let OA = null, OB = null;
  function bodyGlow(col, alpha, thick, at) { // at: 몸을 그릴 위치 {x,y} (없으면 플레이어 자리), tint: 몸 자체를 물들일 색
    const P = G.player, WT = ctx.getTransform(); if (!OA) { OA = document.createElement('canvas'); OB = document.createElement('canvas'); }
    if (OA.width !== cv.width || OA.height !== cv.height) for (const c of [OA, OB]) { c.width = cv.width; c.height = cv.height; }
    const a = OA.getContext('2d'), b = OB.getContext('2d'), PB = 80, s = Math.round(WT.a * 2) || 2, X = at ? at.x : P.x, Y = at ? at.y : P.y;
    const bx = Math.max(0, Math.floor(WT.a * X + WT.e - PB)), by = Math.max(0, Math.floor(WT.d * (Y - 16) + WT.f - PB)), bw = Math.min(cv.width - bx, PB * 2), bh = Math.min(cv.height - by, PB * 2); if (bw <= 0 || bh <= 0) return;
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1; a.clearRect(bx, by, bw, bh); a.setTransform(WT);
    const main = ctx, wt0 = WTEXT.length, np = G.parts.length, nf = G.fx.length, ox = P.x, oy = P.y;
    const t1 = P.trail, t2 = P.trail2; // 공격 궤적은 테두리를 두르지 않음
    try { if (at) { P.x = X; P.y = Y; } P.trail = []; if (t2) P.trail2 = []; ctx = a; drawPlayer(); } finally { ctx = main; P.x = ox; P.y = oy; P.trail = t1; if (t2) P.trail2 = t2; WTEXT.length = wt0; G.parts.length = Math.min(G.parts.length, np); G.fx.length = Math.min(G.fx.length, nf); }
    a.setTransform(1, 0, 0, 1, 0, 0);
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; b.clearRect(bx, by, bw, bh);
    if (at && at.tint) { b.drawImage(OA, bx, by, bw, bh, bx, by, bw, bh); b.globalCompositeOperation = 'source-atop'; b.globalAlpha = 0.72; b.fillStyle = at.tint; b.fillRect(bx, by, bw, bh); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = at.alpha; ctx.drawImage(OB, bx, by, bw, bh, bx, by, bw, bh); ctx.restore(); b.clearRect(bx, by, bw, bh); }
    const off = []; for (let r = 1; r <= thick; r++) off.push([s * r, 0], [-s * r, 0], [0, s * r], [0, -s * r]); if (thick > 1) off.push([s, s], [-s, s], [s, -s], [-s, -s]);
    for (const [dx, dy] of off) b.drawImage(OA, bx, by, bw, bh, bx + dx, by + dy, bw, bh);
    b.globalCompositeOperation = 'destination-out'; b.drawImage(OA, bx, by, bw, bh, bx, by, bw, bh);
    b.globalCompositeOperation = 'source-in'; b.fillStyle = col; b.fillRect(bx, by, bw, bh); b.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(OB, bx, by, bw, bh, bx, by, bw, bh); ctx.restore();
  }

  // ---------------------------------------------------------------- 어쌔신: 붉은 오라 · 붉은 눈
  function drawAura() { const P = G.player, t = time;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const ph = (t * 1.6 + i * 0.37) % 1, a = i / 14 * TAU + Math.sin(t * 2 + i) * 0.3, r = 9 + Math.sin(i * 2.3) * 3, x = P.x + Math.cos(a) * r, y = P.y - 2 + Math.sin(a) * r * 0.45 - ph * 26;
      ctx.globalAlpha = (1 - ph) * 0.8; px2(x, y, ph < 0.4 ? '#ff6060' : '#c01828', ph < 0.3 ? 4 : 2); }
    ctx.restore(); }
  const REDEYE = {}; // 붉은 눈 도트: 고양이 눈(검은 눈동자 'k' 위 · 초록 'G' 아래)을 붉게
  function redEyeKey(k) { if (REDEYE[k] !== undefined) return REDEYE[k]; REDEYE[k] = null; const M = MAPS[k]; if (!M || k.endsWith('B')) return null;
    const R = M.map(r => [...r]); let n = 0;
    for (const o of [0, 1]) for (const cols of [[9, 13], [10, 14]]) for (const c of cols) if (R[5 + o] && R[6 + o] && R[5 + o][c] === 'k' && R[6 + o][c] === 'G') { R[5 + o][c] = '!'; R[6 + o][c] = '¡'; n++; }
    if (!n) return null; const g = k + 'X'; MAPS[g] = R.map(r => r.join('')); if (typeof PLAYER_MAPS !== 'undefined') PLAYER_MAPS.add(g); return REDEYE[k] = g; }
  if (PAL.hRanger) Object.assign(PAL.hRanger, { '!': '#ff3a3a', '¡': '#a01818' });
  const _ds = drawSprite;
  drawSprite = function (key, pal, ...a) { if (pal === 'hRanger' && typeof key === 'string' && G && G.player && on('ranger')) { const r = redEyeKey(key); if (r) key = r; } return _ds.call(this, key, pal, ...a); };

  // ---------------------------------------------------------------- 마법사: 마나 분신
  function updClone(dt) { const P = G.player, C = S.clone; if (!C) return;
    if (!on('mage')) { C.a -= dt * 3; if (C.a <= 0) { S.clone = null; return; } } else C.a = Math.min(1, C.a + dt * 4);
    C.t += dt; const tx = P.x - P.face * 22, ty = P.y - 6 + Math.sin(C.t * 2.2) * 2;
    C.x += (tx - C.x) * Math.min(1, dt * 6); C.y += (ty - C.y) * Math.min(1, dt * 6); C.face = P.face;
    for (const q of S.q) q.t -= dt;
    for (const q of S.q.filter(q => q.t <= 0)) cloneShot(q);
    S.q = S.q.filter(q => q.t > 0);
    if (on('mage') && Math.random() < 0.35) G.parts.push({ x: C.x + rand(-8, 8), y: C.y - rand(4, 24), vx: rand(-8, 8), vy: rand(-30, -12), t: 0.5, c: pick(['#9ad8ff', '#e0f4ff', '#4a8cff']), g: 0, glow: true });
  }
  function cloneShot(q) { const P = G.player, C = S.clone; if (!C) return;
    const sx = C.x + C.face * 12, sy = C.y - 16, tx = P.x + Math.cos(q.ang) * 260, ty = P.y - 8 + Math.sin(q.ang) * 260, ang = Math.atan2(ty - sy, tx - sx);
    S.bolts.push({ x: sx, y: sy, ang, sp: q.big ? 360 : 420, t: 0.72, r: q.big ? 6 : 4, coef: (q.big ? 0.6 : 0.33) * (1 + pasV('meteor')), big: q.big, hist: [] }); // 기본 마력탄(0.66 · 큰 탄 1.2)의 50% · 평타에 붙는 효과는 받지 않음
    G.fx.push({ kind: 'castfx', x: sx, y: sy, r: 14, t: 0.18, max: 0.18, col: '#9ad8ff' }); S.n = (S.n || 0) + 1; }
  function updBolts(dt) {
    for (const b of S.bolts) { b.hist.push({ x: b.x, y: b.y }); if (b.hist.length > 6) b.hist.shift();
      let best = null, bd = 170; for (const e of foes()) { const d = Math.hypot(e.x - b.x, e.y - 8 - b.y); if (d < bd && Math.abs(angDiff(Math.atan2(e.y - 8 - b.y, e.x - b.x), b.ang)) < 0.9) { bd = d; best = e; } }
      if (best) b.ang = lerpAng(b.ang, Math.atan2(best.y - 8 - b.y, best.x - b.x), dt * 3.2);
      const ox = b.x, oy = b.y; b.x += Math.cos(b.ang) * b.sp * dt; b.y += Math.sin(b.ang) * b.sp * dt; b.t -= dt;
      let hit = null; for (const e of foes()) if (Math.hypot(e.x - b.x, e.y - 8 - b.y) < b.r + e.r + 6) { hit = e; break; }
      const wall = blocked(ox, oy + 8, b.x, b.y + 8);
      if (hit || wall || b.t <= 0) { b.dead = true;
        if (hit) damageEnemy(hit, b.coef, { ang: b.ang, grogi: b.big ? 1 : 0.4, kb: b.big ? 50 : 16, gauge: 0, stagger: 0.08 });
        G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 3, grow: b.big ? 110 : 60, t: 0.16, max: 0.16, c: '#9ad8ff' });
        for (let i = 0; i < (b.big ? 8 : 4); i++) { const a = rand(0, TAU), sp = rand(30, 100); G.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: rand(0.15, 0.3), c: pick(['#9ad8ff', '#e0f4ff']), g: 0, glow: true }); } }
      else if (Math.random() < 0.6) G.parts.push({ x: b.x + rand(-2, 2), y: b.y + rand(-2, 2), vx: -Math.cos(b.ang) * 30, vy: -Math.sin(b.ang) * 30 - 10, t: 0.25, c: pick(['#9ad8ff', '#e0f4ff', '#4a8cff']), g: 0, glow: true }); }
    S.bolts = S.bolts.filter(b => !b.dead);
  }
  function drawBolt(b) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
    b.hist.forEach((q, i) => { const k = (i + 1) / b.hist.length; ctx.globalAlpha = 0.5 * k; px2(q.x - 1, q.y - 1, '#4a8cff', b.big ? 4 : 2); });
    ctx.globalAlpha = 1; const R = b.r; for (let y = -R; y <= R; y += 2) for (let x = -R; x <= R; x += 2) { const d = Math.hypot(x, y); if (d <= R) px2(b.x + x, b.y + y, d < R * 0.5 ? '#ffffff' : '#7ac0ff'); }
    ctx.restore(); }
  const _cb = castBolt;
  castBolt = function (...a) { const P = G.player, n0 = G.mproj.length; const r = _cb.apply(this, a); if (on('mage') && S.clone) { const big = G.mproj.slice(n0).some(m => m.big); S.q.push({ t: 0.09, ang: P.ang, big }); } return r; };
  function drawClone() { const C = S.clone, P = G.player; if (!C || C.a <= 0) return;
    const pulse = 0.72 + Math.sin(time * 5) * 0.08;
    bodyGlow('#9ad8ff', 0.9 * C.a, 1, { x: Math.round(C.x / 2) * 2, y: Math.round(C.y / 2) * 2, tint: '#4a8cff', alpha: pulse * C.a });
  }

  // ---------------------------------------------------------------- 성직자: 기적 (패시브 부활)
  const _pd = playerDie;
  playerDie = function () { const P = G.player;
    if (G.cls === 'priest' && !G.miracleUsed && wSkill() !== 'nine') { G.miracleUsed = true; P.hp = Math.min(3, G.stats.hp); P.inv = 2; startMiracle(true); banner('기적', '빛이 미레아를 다시 일으켜 세운다'); return; }
    return _pd.apply(this, arguments); };

  // ---------------------------------------------------------------- 연결
  function tick(dt) { reset(); if (!G.player) return; const P = G.player;
    if (G.cls === 'priest') P.gauge = G.miracleUsed ? 0 : 100;
    if (P.awakenT <= 0 && P.awkCls) P.awkCls = null;
    updWaves(dt); updClone(dt); updBolts(dt);
    if (on('knight') && Math.random() < 0.5) G.parts.push({ x: P.x + rand(-9, 9), y: P.y - rand(2, 26), vx: 0, vy: rand(-30, -12), t: 0.45, c: pick(['#ffe08a', '#fffbe6']), g: 0, glow: true });
    if (on('ranger') && Math.random() < 0.6) G.parts.push({ x: P.x + rand(-8, 8), y: P.y - rand(0, 20), vx: rand(-6, 6), vy: rand(-50, -24), t: 0.4, c: pick(['#ff3040', '#ff8080', '#a01018']), g: 0, glow: true });
  }
  const _wse = weaponSwingEnd; weaponSwingEnd = function (...a) { const r = _wse.apply(this, a); if (G.cls === 'knight' && on('knight')) wave(); return r; };
  const _es = engSteady; engSteady = function () { return _es() || on('knight'); };
  const _ea = engAspd; engAspd = function () { return _ea() * (on('ranger') ? 1.35 : 1); };
  const _hud = hud; hud = function (...a) { const r = _hud.apply(this, a); if (G && G.cls === 'priest' && G.player) { const el = $('skL'); if (el) { const n = el.querySelector('.num'); if (n) n.textContent = ''; el.classList.toggle('used', !!G.miracleUsed); } } if (G) { const k = $('skL') && $('skL').querySelector('.key'); if (k) { const t = G.cls === 'priest' ? '패시브' : (typeof TOUCH !== 'undefined' && TOUCH.on ? k.textContent : 'E'); if (k.textContent !== t) k.textContent = t; } } return r; };
  SKD.add(ents => { if (!G || !G.player) return; const P = G.player;
    for (const W of S.waves) ents.push({ y: W.y + 14, d: () => drawWave(W) });
    if (S.clone) ents.push({ y: S.clone.y - 0.5, d: drawClone });
    for (const b of S.bolts) ents.push({ y: b.y + 14, d: () => drawBolt(b) });
    if (on('ranger')) { ents.push({ y: P.y - 0.5, d: drawAura }); ents.push({ y: P.y + 0.5, d: () => bodyGlow(Math.floor(time * 12) % 2 ? '#ff3040' : '#c01828', 0.75, 1) }); }
    if (on('knight')) ents.push({ y: P.y + 0.5, d: () => bodyGlow(Math.floor(time * 8) % 2 ? '#ffe08a' : '#fff6c8', 0.55 + Math.sin(time * 6) * 0.15, 1) });
  });
  return {
    start, tick, on, get shots() { return S.n || 0; },
    spd: () => (on('ranger') ? 1.5 : 1), crit: () => (on('ranger') ? 0.2 : 0),
    press() { const P = G.player; if (G.cls === 'priest') { G.nums.push({ x: P.x, y: P.y - 30, v: '쓰러지면 저절로 발동', t: 0.9, c: '#ffe39a', s: 1, txt: true }); sfx('blip', 0.7); return; } start(); },
  };
})();
