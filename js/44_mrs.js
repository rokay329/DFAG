'use strict';
// ==================================================================================================
// 잿빛 왕관 원정대 — 44_mrs.js : v3.22 세리안(마법사) 무기별 우클릭 기술 (41 · 42 · 43과 같은 방식)
//  · 레어 · 유니크 · 레전더리 지팡이는 무기마다 고유한 우클릭 기술을 씀 (커먼 · 초록 지팡이는 기본 「화염구」)
//  · 쿨타임은 무기마다 따로 (KRS.tick) · 효과는 깊이 정렬(SKD)로 장애물 뒤에 가려짐 · 몸 동작은 SKP 공용
//  · 국자 · 거울 지팡이 · 잿빛 별의 홀: 화염구를 바꾸던 고유 효과를 기본 공격 쪽으로 옮김
//  · v3.22b 촛대 · 수정 · 해골 · 피뢰침 · 국자 · 거울 · 잿빛 별 · 모래시계 연출을 크게 다시 만듦
// ==================================================================================================
const MRS = (() => {
  const DEF = {
    candle: { n: '거대 화염구', cd: 10, d: '촛불을 모아 커다란 화염구를 만들어 날립니다. 적이나 벽에 닿으면 크게 폭발하고, 지나간 길과 터진 자리에 불길이 남습니다.' },
    rod: { n: '대어 낚기', cd: 9, d: '찌를 멀리 던져 떨어진 자리의 적을 한꺼번에 낚습니다. 낚인 적은 머리 위로 크게 넘어가 등 뒤 바닥에 내리꽂히고 1초 동안 기절합니다.' },
    crystal: { n: '보석 분출', cd: 10, d: '조준한 자리에서 거대한 보석 기둥이 무더기로 솟구쳐 적을 띄웁니다. 잠시 뒤 보석이 한꺼번에 깨지며 큰 피해를 주고, 조각이 사방으로 튑니다.' },
    broom: { n: '먼지 회오리', cd: 9, d: '빗자루를 타고 앞쪽으로 크게 한 바퀴 돌며 닿는 적을 쳐냅니다. 지나간 길에 먼지 구름이 남고, 돌아오며 바닥을 쓸어 고리 안의 적에게 피해를 줍니다.' },
    skull: { n: '뼈 무덤', cd: 10, d: '조준한 자리의 땅이 갈라지며 둘레로 뼈 가시가 솟구치고, 가운데서 거대한 뼈 가시 무리가 터져 나오며 초록 혼불을 터뜨립니다.' },
    lrod: { n: '연쇄 번개', cd: 11, d: '지팡이에서 굵은 번개를 세 번 내뿜습니다. 번개는 가까운 적에게서 적으로 최대 여섯 번 튀며 피해를 줍니다.' },
    ladle: { n: '수프 대폭발', cd: 10, d: '커다란 수프 덩어리를 던집니다. 떨어진 자리에 넓은 수프 웅덩이가 생겨 적을 태우고 느리게 하며, 내가 밟으면 조금 회복합니다.' },
    mirror: { n: '반사광 난사', cd: 10, d: '거울에서 빛줄기 열두 개를 사방으로 흩뿌립니다. 빛줄기는 크게 휘어 가까운 적을 쫓아가 꽂히며 터지고, 마지막 빛줄기는 더 굵고 크게 터집니다.' },
    ashstar2: { n: '유성우', cd: 11, d: '조준한 곳 주변에 2초 동안 불타는 유성이 쏟아집니다. 마지막에 커다란 잿빛 별이 떨어져 크게 폭발하고 불바다를 남깁니다.' },
    hourglass: { n: '멈춘 초침', cd: 12, d: '조준한 자리에 커다란 황금 시계판을 펼칩니다. 초침이 한 바퀴 돌며 지나가는 적을 멈춰 세우고, 열두 시에 시계판이 깨지며 멈춘 적 모두에게 큰 피해를 줍니다.' },
  };
  for (const k in DEF) SK_META[k] = Object.assign(SK_META[k] || {}, { K: DEF[k].n, KD: DEF[k].d });
  const K = { g: null, zones: [], bolts: [] };
  const def = () => (G && G.cls === 'mage' ? DEF[wSkill()] || null : null);
  const FXK = KRS.FXK, lerp = (a, b, t) => a + (b - a) * t, dot = ARS.dot, pxLine = ARS.pxLine, blast = GRS.blast, PAL_F = GRS.PAL_F, PAL_G = GRS.PAL_G, PAL_Y = GRS.PAL_Y;
  const PAL_B = ['#ffffff', '#e8f4ff', '#9ad8ff', '#4f8dff', '#2a3a6a', '#141a2a'], PAL_SOUP = ['#ffffff', '#ffe0a0', '#e8903a', '#c05a1a', '#5a3a1a', '#2a1a10'];
  const big = e => e.type === 'boss' || isElite(e) || isSemi(e) || isDummy(e);
  const live = e => e && !e.dead && e.type !== 'flag';
  const foes = () => G.enemies.filter(live);
  const inE = (e, x, y, r) => Math.hypot(e.x - x, (e.y - y) / 0.6) < r + e.r;
  const hsh = (a, b, s) => { const v = Math.sin(a * 12.9898 + b * 78.233 + s * 37.719) * 43758.5453; return v - Math.floor(v); };
  const aimPt = (P, maxD) => { let tx, ty; if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; } else { tx = P.x + Math.cos(P.ang) * maxD; ty = P.y + Math.sin(P.ang) * maxD; }
    const d = Math.hypot(tx - P.x, ty - P.y); if (d > maxD) { tx = P.x + (tx - P.x) / d * maxD; ty = P.y + (ty - P.y) / d * maxD; }
    return { x: clamp(tx, A.x0 + 20, A.x1 - 20), y: clamp(ty, A.y0 + 20, A.y1 - 20) }; };
  const zone = o => { o.t = 0; o.hit = o.hit || new Set(); o.did = {}; K.zones.push(o); return o; };
  const castFx = (c, r) => { const tp = staffTip(); G.fx.push({ kind: 'castfx', x: tp.x, y: tp.y, r: r || 26, t: 0.22, max: 0.22, col: c || '#e8c8ff' }); FXK.light(tp.x, tp.y, 90, 0.7, '230,200,255', 0.15); return tp; };
  // 번개 줄기: 들쭉날쭉한 마디 + 곁가지 (굵기 w: 1~3)
  const bolt = (x0, y0, x1, y1, w, t) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(4, Math.round(L / 14)), nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1), pts = [{ x: x0, y: y0 }];
    for (let i = 1; i < n; i++) { const u = i / n, j = rand(-1, 1) * Math.min(14, L * 0.12); pts.push({ x: lerp(x0, x1, u) + nx * j, y: lerp(y0, y1, u) + ny * j }); } pts.push({ x: x1, y: y1 });
    const br = []; for (let i = 1; i < n - 1; i++) if (Math.random() < 0.45) { const p = pts[i], a = Math.atan2(y1 - y0, x1 - x0) + rand(-1.2, 1.2), l = rand(10, 26); br.push([p, { x: p.x + Math.cos(a) * l, y: p.y + Math.sin(a) * l }]); }
    K.bolts.push({ pts, br, w: w || 2, t: t || 0.2, max: t || 0.2 }); };
  const disk = (x, y, r, c, ry) => { const id = SEL ? SKD.oid(SEL) : 0; for (let yy = -r; yy <= r; yy += 2) { const w = Math.sqrt(Math.max(0, r * r - yy * yy)), Y = y + yy * (ry || 1); for (let xx = -w; xx <= w; xx += 2) SKD.pd(x + xx, Y, id, c); } }; // v3.22 겹침 디더
  const ring = (x, y, r, c, gap, ry, off) => { const n = Math.max(8, Math.ceil(r * 1.3)); for (let i = 0; i < n; i++) { if (gap && (i + (off || 0)) % gap === 0) continue; const a = i / n * TAU; dot(x + Math.cos(a) * r, y + Math.sin(a) * r * (ry || 0.6), c); } };
  const star4 = (x, y, s, c) => { for (let i = -s; i <= s; i += 2) { dot(x + i, y, Math.abs(i) < 2 ? '#ffffff' : c); dot(x, y + i, Math.abs(i) < 2 ? '#ffffff' : c); } };

  // ---------------------------------------------------------------- 시작
  function start() {
    const D = def(); if (!D) return false;
    const P = G.player, k = wSkill();
    P.atkAng = P.ang; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.blade = P.ang; P.combo = 0; P.queued = false;
    P.mrs = { k, t: 0, did: {}, dur: 0.5, a: P.ang, hit: new Set() }; const R = P.mrs; P.state = 'mrs';
    if (k === 'candle') { R.dur = 0.62; }
    else if (k === 'rod') { R.dur = 1.15; R.T = aimPt(P, 200); }
    else if (k === 'crystal') { R.dur = 0.45; R.T = aimPt(P, 180); }
    else if (k === 'broom') { R.dur = 1.0; R.c = { x: clamp(P.x + Math.cos(P.ang) * 52, A.x0 + 20, A.x1 - 20), y: clamp(P.y + Math.sin(P.ang) * 40, A.y0 + 20, A.y1 - 20) }; R.a0 = Math.atan2(P.y - R.c.y, P.x - R.c.x); R.sx = P.x; R.sy = P.y; P.iframe = Math.max(P.iframe, 1.0); sfx('whoosh', 0.7); }
    else if (k === 'skull') { R.dur = 0.5; R.T = aimPt(P, 190); }
    else if (k === 'lrod') { R.dur = 1.15; }
    else if (k === 'ladle') { R.dur = 0.45; R.T = aimPt(P, 170); }
    else if (k === 'mirror') { R.dur = 0.95; R.tg = foes().filter(e => dist(P, e) < 280).sort((a, b) => dist(P, a) - dist(P, b)).slice(0, 6); }
    else if (k === 'ashstar2') { R.dur = 0.6; R.T = aimPt(P, 190); }
    else if (k === 'hourglass') { R.dur = 0.5; R.T = aimPt(P, 170); }
    sfx('aim'); return true;
  }

  // ---------------------------------------------------------------- 진행 (몸 · 지팡이)
  function update(dt) {
    const P = G.player, R = P.mrs; if (!R) { P.state = 'idle'; return; }
    R.t += dt; const t = R.t, k = R.k, up = (P.face > 0 ? -80 : -100) * DEG;
    const raise = q => { P.blade = lerpAng(R.a, up, q); }, swing = q => { P.blade = lerpAng(up, R.a, q); };
    if (k === 'candle') { // 지팡이 끝에 불덩이를 모았다가 던짐
      if (t < 0.4) { raise(Math.min(1, t / 0.15)); const tp = staffTip(), q = t / 0.4; R.cr = 4 + q * 14;
        for (let i = 0; i < 3; i++) { const a = rand(0, TAU), r = 30 + rand(0, 20); G.parts.push({ x: tp.x + Math.cos(a) * r, y: tp.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 3, vy: -Math.sin(a) * r * 3, t: 0.3, c: pick(['#ffe060', '#ff8a2a', '#ff3020']), g: 0, glow: true }); }
        FXK.light(tp.x, tp.y, 60 + q * 80, 0.5, '255,150,60', 0.04); if (Math.random() < 0.3) sfx('fireball', 0.6 + q); }
      else { swing(Math.min(1, (t - 0.4) / 0.07)); R.cr = 0;
        if (!R.did.f) { R.did.f = true; const tp = staffTip(), a = R.a; zone({ k: 'fireball', x: tp.x, y: tp.y + 10, a, sp: 250, life: 1.3, r: 18, trail: [] }); FXK.punch(8, 0.03, 0.05, a + Math.PI); blast(tp.x, tp.y, 20); sfx('fireball', 0.5); sfx('blast', 1.4); } }
    } else if (k === 'rod') {
      if (t < 0.12) raise(t / 0.12);
      else if (t < 0.2) { swing((t - 0.12) / 0.08); if (!R.did.f) { R.did.f = true; FXK.punch(3, 0.01, 0.01); sfx('whoosh', 0.9);
        R.Z = zone({ k: 'rod', x: R.T.x, y: R.T.y, sx: P.x, sy: P.y, tp: staffTip(), ph: 'fly', fish: [] }); } }
      else if (R.Z) { const Z = R.Z; // 줄을 당기는 동안 지팡이를 뒤로 젖힘
        if (Z.ph === 'tense') P.blade = R.a + (P.face > 0 ? -1 : 1) * (0.4 + Math.sin(t * 60) * 0.06);
        else if (Z.ph === 'yank' || Z.ph === 'slam') P.blade = lerpAng(R.a + (P.face > 0 ? -1 : 1) * 0.4, R.a + Math.PI * (P.face > 0 ? -1 : 1) * 0.9, Math.min(1, Z.pt / 0.35));
        if (Z.ph === 'yank' && !R.did.y) { R.did.y = true; FXK.punch(6, 0.02, 0.04, R.a + Math.PI); } }
    } else if (k === 'crystal') {
      if (t < 0.14) raise(t / 0.14); else { P.blade = up + Math.sin(t * 40) * 0.05;
        if (!R.did.f) { R.did.f = true; castFx('#c8e8ff'); FXK.punch(7, 0.025, 0.04); zone({ k: 'gems', x: R.T.x, y: R.T.y, gs: [] }); sfx('crunch', 1.5); } }
    } else if (k === 'broom') {
      const L = 0.8, Rr = Math.hypot(R.sx - R.c.x, R.sy - R.c.y) || 50;
      if (t < L) { const q = t / L, a = R.a0 + q * TAU * (P.face > 0 ? 1 : -1), nx = R.c.x + Math.cos(a) * Rr, ny = R.c.y + Math.sin(a) * Rr * 0.8; P.x = nx; P.y = ny;
        const ta = a + Math.PI / 2 * (P.face > 0 ? 1 : -1); P.blade = ta + Math.PI; P.lift = 6;
        if ((R.dc = (R.dc || 0) - dt) <= 0) { R.dc = 0.06; (G.dustC = G.dustC || []).push({ x: P.x, y: P.y, t: 2.2 }); for (let i = 0; i < 4; i++) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(0, 6), vx: rand(-30, 30), vy: rand(-30, -5), t: rand(0.5, 0.9), c: pick(['#a89c90', '#8a8078', '#c8b8a0']), g: -10 }); }
        for (const e of foes()) if (!R.hit.has(e) && Math.hypot(e.x - P.x, (e.y - P.y) / 0.8) < 16 + e.r) { R.hit.add(e); const oa = Math.atan2(e.y - R.c.y, e.x - R.c.x); damageEnemy(e, 0.7, { ang: oa, kb: big(e) ? 0 : 260, grogi: 6, gauge: 3 }); blast(e.x, e.y - 10, 12, ['#ffffff', '#f0e8d8', '#c8b8a0', '#8a8078', '#5a524c', '#2a2624']); FXK.punch(3, 0.01, 0.02, oa); }
        if (Math.random() < 0.4) sfx('whoosh', 1.4 + rand(0, 0.3)); }
      else { P.lift = 0; P.x = R.sx; P.y = R.sy; P.blade = lerpAng(up, R.a, Math.min(1, (t - L) / 0.08));
        if (!R.did.f) { R.did.f = true; const c = R.c; for (const e of foes()) if (inE(e, c.x, c.y, Rr + 4)) { damageEnemy(e, 1.0, { ang: angTo(c, e), kb: big(e) ? 0 : 120, grogi: 8, heavy: true, gauge: 4 }); zoneSlow(e, 0.4); }
          blast(c.x, c.y - 6, 44, ['#ffffff', '#f0e8d8', '#c8b8a0', '#8a8078', '#5a524c', '#2a2624']); FXK.ring(c.x, c.y, '#d8ccb8', 300, 0.35, Rr * 0.5); dust(c.x, c.y, 16); FXK.punch(7, 0.025, 0.05); sfx('heavy', 1.2); } }
    } else if (k === 'skull') {
      if (t < 0.12) raise(t / 0.12); else { P.blade = up + Math.sin(t * 30) * 0.04; if (!R.did.f) { R.did.f = true; castFx('#bfffcf'); zone({ k: 'grave', x: R.T.x, y: R.T.y, sp: [] }); FXK.punch(4, 0.012, 0.02); sfx('warn', 0.6); } }
    } else if (k === 'lrod') { // 번개를 세 번 내뿜음
      R.a = lerpAng(R.a, P.ang, dt * 6); const n = Math.floor((t - 0.08) / 0.34);
      if (t < 0.08) raise(t / 0.08); else { P.blade = R.a + Math.sin(t * 50) * 0.06; if (n < 3 && n !== R.n) { R.n = n; chain(P, R.a, n); } }
    } else if (k === 'ladle') {
      if (t < 0.15) raise(t / 0.15); else { swing(Math.min(1, (t - 0.15) / 0.08)); if (!R.did.f) { R.did.f = true; const tp = castFx('#ffc070'); zone({ k: 'soup', x: R.T.x, y: R.T.y, sx: tp.x, sy: tp.y, r: 82, dur: 5.2 }); FXK.punch(5, 0.015, 0.03); sfx('whoosh', 0.6); } }
    } else if (k === 'mirror') { // 지팡이를 세우고 0.06초마다 유도 빛줄기
      if (t < 0.12) raise(t / 0.12); else { P.blade = up + Math.sin(t * 50) * 0.05; const n = Math.floor((t - 0.12) / 0.055);
        if (n < 12 && n !== R.n) { R.n = n; const tp = staffTip(), L = R.tg.filter(live), tg = L.length ? L[n % L.length] : null, side = n % 2 ? 1 : -1, last = n === 11;
          const a0 = R.a + side * (0.9 + (n % 3) * 0.45) + Math.PI * (n % 4 === 3 ? 0.6 * side : 0);
          zone({ k: 'laser', x0: tp.x, y0: tp.y, x: tp.x, y: tp.y, a0, tg, fx: tp.x + Math.cos(R.a) * 180, fy: tp.y + Math.sin(R.a) * 130, dur: 0.32 + (n % 3) * 0.05, hist: [], last });
          G.fx.push({ kind: 'castfx', x: tp.x, y: tp.y, r: last ? 30 : 18, t: 0.15, max: 0.15, col: '#fff6d0' }); FXK.light(tp.x, tp.y, 90, 0.7, '255,240,190', 0.06); sfx('bolt', 1.5 + (n % 4) * 0.1); if (last) FXK.punch(5, 0.015, 0.03, R.a + Math.PI); else addShake(1.5, R.a + Math.PI); } }
    } else if (k === 'ashstar2') {
      if (t < 0.2) raise(t / 0.2); else { P.blade = up; if (!R.did.f) { R.did.f = true; castFx('#ffd080', 34); FXK.punch(6, 0.02, 0.03); const Z = zone({ k: 'star', x: R.T.x, y: R.T.y, ms: [] });
          for (let i = 0; i < 16; i++) { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * 100; Z.ms.push({ x: clamp(R.T.x + Math.cos(a) * r, A.x0 + 10, A.x1 - 10), y: clamp(R.T.y + Math.sin(a) * r * 0.6, A.y0 + 10, A.y1 - 10), land: 0.4 + i * 0.1, s: rand(4, 7) }); }
          Z.ms.push({ x: R.T.x, y: R.T.y, land: 2.25, big: true, s: 16 }); sfx('awaken', 0.8); } }
    } else if (k === 'hourglass') {
      if (t < 0.15) raise(t / 0.15); else { P.blade = up; if (!R.did.f) { R.did.f = true; castFx('#bfe8ff'); FXK.punch(5, 0.015, 0.03); zone({ k: 'clock', x: R.T.x, y: R.T.y, r: 84, frozen: new Set() }); sfx('reload', 0.6); } }
    }
    if (t >= R.dur) end(P);
  }
  function end(P) { P.state = 'idle'; P.mrs = null; P.t = 0; P.lift = 0; }
  // 연쇄 번개: 지팡이 → 가까운 적 → 그 옆 적 … (최대 6번)
  function chain(P, a, n) { const tp = staffTip(), hit = new Set(); let from = { x: tp.x, y: tp.y }, cur = null;
    let first = foes().filter(e => dist(P, e) < 220 && coneIn(P, e, a, 0.9)).sort((p, q) => dist(P, p) - dist(P, q))[0];
    FXK.flash('#e8f4ff', 0.05); FXK.punch(6 + n * 2, 0.02, 0.04, a + Math.PI); sfx('bolt', 0.8 + n * 0.15); sfx('blast', 1.6);
    if (!first) { const x = P.x + Math.cos(a) * 150, y = P.y + Math.sin(a) * 110; bolt(from.x, from.y, x, y - 6, 3, 0.25); blast(x, y - 6, 20, PAL_B); return; }
    cur = first;
    for (let i = 0; i < 6 && cur; i++) { hit.add(cur); const tx = cur.x, ty = cur.y - 12; bolt(from.x, from.y, tx, ty, i === 0 ? 3 : 2, 0.24); if (i === 0) bolt(from.x, from.y, tx, ty, 1, 0.18);
      damageEnemy(cur, i === 0 ? 0.9 : 0.6, { ang: Math.atan2(ty - from.y, tx - from.x), kb: big(cur) ? 0 : 60, grogi: 5, gauge: 2, stagger: 0.2 }); blast(tx, ty, 16 + (i === 0 ? 8 : 0), PAL_B);
      FXK.light(tx, ty, 110, 0.9, '170,210,255', 0.12); for (let j = 0; j < 6; j++) { const b = rand(0, TAU); G.parts.push({ x: tx, y: ty, vx: Math.cos(b) * rand(80, 200), vy: Math.sin(b) * rand(80, 200), t: 0.2, c: pick(['#ffffff', '#9ad8ff', '#4f8dff']), g: 0, glow: true }); }
      cur.zap = 0.5; from = { x: tx, y: ty }; cur = foes().filter(o => !hit.has(o) && Math.hypot(o.x - tx, o.y - ty) < 150).sort((p, q) => Math.hypot(p.x - tx, p.y - ty) - Math.hypot(q.x - tx, q.y - ty))[0]; } }

  // ---------------------------------------------------------------- 진(陣) · 소환물 진행
  function tick(dt) {
    if (K.g !== G) { K.g = G; K.zones = []; K.bolts = []; }
    if (!G.player) return; const P = G.player;
    for (const b of K.bolts) b.t -= dt; K.bolts = K.bolts.filter(b => b.t > 0);
    for (const e of G.enemies) if (e.zap > 0) { e.zap -= dt; if (Math.random() < 0.35) { const a = rand(0, TAU); K.bolts.push({ pts: [{ x: e.x + Math.cos(a) * 6, y: e.y - 12 + Math.sin(a) * 8 }, { x: e.x + Math.cos(a + 0.8) * 10 + rand(-3, 3), y: e.y - 12 + rand(-8, 8) }, { x: e.x + Math.cos(a + 1.6) * 7, y: e.y - 10 + rand(-6, 6) }], br: [], w: 1, t: 0.06, max: 0.06 }); } }
    for (const Z of K.zones) { Z.t += dt; const t = Z.t;
      if (Z.k === 'fireball') { const sp = Z.sp * (Z.t < 0.15 ? 0.6 : 1), ox = Z.x, oy = Z.y; Z.x += Math.cos(Z.a) * sp * dt; Z.y += Math.sin(Z.a) * sp * dt * 0.8; Z.r = Math.min(22, 18 + t * 4);
        Z.trail.push({ x: Z.x, y: Z.y, t: 0.35 }); for (const q of Z.trail) q.t -= dt; Z.trail = Z.trail.filter(q => q.t > 0);
        for (let i = 0; i < 4; i++) { const a = Z.a + Math.PI + rand(-0.7, 0.7); G.parts.push({ x: Z.x + rand(-8, 8), y: Z.y - 12 + rand(-8, 8), vx: Math.cos(a) * rand(40, 120), vy: Math.sin(a) * rand(40, 120) - 40, t: rand(0.3, 0.55), c: pick(['#ffe060', '#ffb030', '#ff6a20', '#ff3020', '#5a4a48']), g: -40, glow: true }); }
        if ((Z.ft = (Z.ft || 0) - dt) <= 0) { Z.ft = 0.08; (G.pfire = G.pfire || []).push({ x: Z.x, y: Z.y + 2, t: 1.6, tick: 0 }); }
        FXK.light(Z.x, Z.y - 12, 140, 0.35, '255,150,60', 0.03); if (Math.random() < 0.2) addShake(1, 0);
        const hitE = foes().find(e => Math.hypot(e.x - Z.x, (e.y - Z.y) / 0.8) < Z.r + e.r);
        if (hitE || t >= Z.life || segSolid(ox, oy, Z.x, Z.y, 6) || Z.x < A.x0 + 10 || Z.x > A.x1 - 10 || Z.y < A.y0 + 10 || Z.y > A.y1 - 10) { Z.dead = true; const x = Z.x, y = Z.y;
          for (const e of foes()) if (Math.hypot(e.x - x, (e.y - y) / 0.75) < 72 + e.r) damageEnemy(e, 3.0, { ang: angTo({ x, y }, e), kb: big(e) ? 0 : 320, grogi: 20, heavy: true, gauge: 8, stagger: 0.6 });
          for (const e of foes()) addBurn(e, Math.hypot(e.x - x, e.y - y) < 80 ? 3 : 0, 0.4);
          blast(x, y - 12, 74, PAL_F, true); blast(x - 26, y - 4, 34); blast(x + 28, y - 6, 34); blast(x, y - 34, 30);
          FXK.ring(x, y, '#ffffff', 600, 0.4, 14); FXK.ring(x, y, '#ffb040', 420, 0.5, 10); FXK.rays(x, y - 12, 18, 120, '#ffe0a0', 0.3); FXK.debris(x, y, 18, ['#ff8a30', '#ffd060', '#5a4a48', '#2a2228']);
          FXK.flash('#fff0c0', 0.12); FXK.punch(16, 0.06, 0.12); FXK.light(x, y, 260, 1, '255,170,80', 0.5); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; (G.pfire = G.pfire || []).push({ x: x + Math.cos(a) * rand(20, 50), y: y + Math.sin(a) * rand(12, 30), t: 3, tick: 0 }); }
          sfx('blast', 0.5); sfx('heavy', 0.6); sfx('fireball', 0.4); } }
      else if (Z.k === 'rod') { Z.pt = (Z.pt || 0) + dt;
        const tp = staffTip(); Z.lx = tp.x; Z.ly = tp.y;
        if (Z.ph === 'fly') { const q = Math.min(1, t / 0.3); Z.bx = lerp(Z.tp.x, Z.x, q); Z.by = lerp(Z.tp.y, Z.y - 4, q) - Math.sin(q * Math.PI) * 60;
          if (q >= 1) { Z.ph = 'tense'; Z.pt = 0; blast(Z.x, Z.y - 4, 18, PAL_B); FXK.ring(Z.x, Z.y, '#9ad8ff', 220, 0.3, 8); sfx('crunch', 1.6);
            for (const e of foes()) if (inE(e, Z.x, Z.y, 56)) { if (e.type === 'boss') { damageEnemy(e, 1.2, { ang: 0, kb: 0, grogi: 10, heavy: true, gauge: 4 }); continue; } Z.fish.push({ e, x0: e.x, y0: e.y }); damageEnemy(e, 0.4, { ang: angTo(Z, e), kb: 0, grogi: 6, gauge: 2 }); applySt(e, 'stun', 1.2); }
            for (let i = 0; i < 16; i++) { const a = rand(0, TAU); G.parts.push({ x: Z.x, y: Z.y - 4, vx: Math.cos(a) * rand(40, 140), vy: rand(-180, -60), t: rand(0.4, 0.7), c: pick(['#9ad8ff', '#e8f8ff', '#4f8dff']), g: 500 }); } } }
        else if (Z.ph === 'tense') { Z.bx = Z.x + rand(-2, 2); Z.by = Z.y - 4 + rand(-2, 2); for (const f of Z.fish) if (live(f.e)) { f.e.x = f.x0 + rand(-2, 2); } if (Z.pt > 0.28) { Z.ph = Z.fish.length ? 'yank' : 'back'; Z.pt = 0; sfx('whoosh', 0.6); } }
        else if (Z.ph === 'yank') { const q = Math.min(1, Z.pt / 0.42), back = Math.atan2(Z.y - Z.sy, Z.x - Z.sx) + Math.PI;
          Z.fish.forEach((f, i) => { if (!live(f.e)) return; const lx = clamp(Z.sx + Math.cos(back + (i - (Z.fish.length - 1) / 2) * 0.45) * 46, A.x0 + 16, A.x1 - 16), ly = clamp(Z.sy + Math.sin(back + (i - (Z.fish.length - 1) / 2) * 0.45) * 32, A.y0 + 16, A.y1 - 16);
            f.lx = lx; f.ly = ly; f.e.x = lerp(f.x0, lx, q); f.e.y = lerp(f.y0, ly, q) - Math.sin(q * Math.PI) * 70; f.e.vx = f.e.vy = 0; if (Math.random() < 0.5) G.parts.push({ x: f.e.x, y: f.e.y - 10, vx: 0, vy: 30, t: 0.3, c: pick(['#9ad8ff', '#e8f8ff']), g: 200 }); });
          const c = Z.fish.find(f => live(f.e)); if (c) { Z.bx = c.e.x; Z.by = c.e.y - 10; }
          if (q >= 1) { Z.ph = 'slam'; Z.pt = 0; for (const f of Z.fish) { if (!live(f.e)) continue; damageEnemy(f.e, 1.6, { ang: 0, kb: 0, grogi: 16, heavy: true, gauge: 5 }); applySt(f.e, 'stun', 1.0); blast(f.e.x, f.e.y - 6, 22, PAL_B); dust(f.e.x, f.e.y, 8); FXK.debris(f.e.x, f.e.y, 6); }
            FXK.punch(10, 0.04, 0.08); FXK.flash('#e8f8ff', 0.05); sfx('heavy', 0.8); sfx('crunch', 0.6); } }
        else if (Z.ph === 'back') { const q = Math.min(1, Z.pt / 0.25); Z.bx = lerp(Z.x, Z.lx, q); Z.by = lerp(Z.y, Z.ly, q); if (q >= 1) Z.dead = true; }
        else if (Z.ph === 'slam' && Z.pt > 0.3) Z.dead = true;
        if (t > 2.5) Z.dead = true; }
      else if (Z.k === 'gems') { // 거대 보석 무더기: 가운데 큰 기둥 3 + 둘레 9
        if (!Z.gs.length) { const C = ['sap', 'ame', 'eme', 'rub']; Z.gs.push({ x: Z.x, y: Z.y + 4, h: 86, w: 10, c: 'sap', d: 0.1 }, { x: Z.x - 22, y: Z.y + 8, h: 62, w: 8, c: 'ame', d: 0.14, lean: -1 }, { x: Z.x + 22, y: Z.y + 6, h: 66, w: 8, c: 'eme', d: 0.12, lean: 1 }, { x: Z.x - 6, y: Z.y + 14, h: 40, w: 6, c: 'rub', d: 0.16, lean: -0.5 });
          for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, r = 46 + (i % 2) * 10; Z.gs.push({ x: Z.x + Math.cos(a) * r, y: Z.y + Math.sin(a) * r * 0.6, h: 30 + (i % 3) * 10, w: 5 + (i % 2) * 2, c: C[i % 4], d: 0.02 * i, lean: Math.cos(a) > 0 ? 1 : -1 }); } }
        for (const g of Z.gs) if (t >= g.d && !g.up) { g.up = true; blast(g.x, g.y - g.h * 0.3, g.w * 3, PAL_B); FXK.debris(g.x, g.y, 3, ['#5a524c', '#8a7c70']); if (g.h > 40) { FXK.punch(6, 0.02, 0.03); sfx('crunch', 1.2); } }
        if (!Z.did.up) { Z.did.up = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 64)) { damageEnemy(e, 0.9, { ang: -Math.PI / 2, kb: big(e) ? 0 : 60, grogi: 10, heavy: true, gauge: 4 }); applySt(e, 'stun', 0.9); } FXK.ring(Z.x, Z.y, '#c8e8ff', 300, 0.35, 20); FXK.flash('#e8f4ff', 0.05); }
        if (Math.random() < 0.6) { const g = pick(Z.gs); if (g.up) Z.sp = (Z.sp || []).concat([{ x: g.x + rand(-g.w, g.w), y: g.y - rand(4, g.h), t: 0.3 }]); } if (Z.sp) { for (const s of Z.sp) s.t -= dt; Z.sp = Z.sp.filter(s => s.t > 0); }
        FXK.light(Z.x, Z.y - 30, 150, 0.3, '170,210,255', 0.03);
        if (t >= 1.1 && !Z.did.br) { Z.did.br = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 70)) damageEnemy(e, 1.8, { ang: angTo(Z, e), kb: big(e) ? 0 : 240, grogi: 16, heavy: true, gauge: 6 });
          for (const g of Z.gs) blast(g.x, g.y - g.h * 0.5, g.h > 40 ? 30 : 16, PAL_B); blast(Z.x, Z.y - 24, 60, PAL_B, true);
          FXK.flash('#ffffff', 0.1); FXK.punch(14, 0.05, 0.1); FXK.rays(Z.x, Z.y - 24, 18, 120, '#c8e8ff', 0.3); FXK.ring(Z.x, Z.y - 10, '#ffffff', 560, 0.4, 14); sfx('heavy', 1.4); sfx('crunch', 2.0); sfx('perfect');
          for (let i = 0; i < 46; i++) { const a = rand(0, TAU), sp = rand(160, 380); G.parts.push({ x: Z.x + rand(-20, 20), y: Z.y - rand(4, 50), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 140, t: rand(0.5, 0.9), c: pick(['#e8f8ff', '#9ad8ff', '#4f8dff', '#c8a0ff', '#8a5ae0', '#7affc0', '#ff7a9a', '#ffffff']), g: 520, glow: Math.random() < 0.5 }); }
          for (const e of foes()) { const d = Math.hypot(e.x - Z.x, (e.y - Z.y) / 0.6); if (d > 70 && d < 150) damageEnemy(e, 0.6, { ang: angTo(Z, e), kb: 100, grogi: 4, gauge: 1 }); } }
        if (t > 1.15) Z.dead = true; }
      else if (Z.k === 'grave') { // 땅이 갈라지고 거대 해골이 솟아 포효 · 둘레로 뼈 가시
        if (!Z.did.crack) { Z.did.crack = true; for (let i = 0; i < 6; i++) KRS.crack && KRS.crack({ x: Z.x, y: Z.y + 2, ang: i / 6 * TAU, len: 50, t: 1.8, max: 1.8, seed: Math.random() * 99 }); FXK.punch(5, 0.015, 0.02); dust(Z.x, Z.y, 10); }
        const N = 12; for (let i = 0; i < N; i++) if (t >= 0.12 + i * 0.035 && !Z.did['s' + i]) { Z.did['s' + i] = true; const a = i / N * TAU, r = 50 + (i % 2) * 8, x = Z.x + Math.cos(a) * r, y = Z.y + Math.sin(a) * r * 0.6; Z.sp.push({ x, y, t0: t, i, lean: Math.cos(a) });
          for (const e of foes()) if (Math.hypot(e.x - x, (e.y - y) / 0.7) < 18 + e.r && !Z.hit.has(e)) { Z.hit.add(e); damageEnemy(e, 0.7, { ang: angTo(Z, e), kb: big(e) ? 0 : 80, grogi: 8, gauge: 3 }); applySt(e, 'stun', 0.5); }
          FXK.debris(x, y, 3, ['#e8e8ec', '#a8a8b0', '#5a5a64']); dust(x, y, 3); if (i % 3 === 0) { sfx('crunch', 1.1 + i * 0.04); addShake(3, 0); } }
        if (t >= 0.6 && !Z.did.roar) { Z.did.roar = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 62)) damageEnemy(e, 1.7, { ang: angTo(Z, e), kb: big(e) ? 0 : 260, grogi: 16, heavy: true, gauge: 6 });
          blast(Z.x, Z.y - 34, 58, PAL_G, true); blast(Z.x - 30, Z.y - 10, 26, PAL_G); blast(Z.x + 30, Z.y - 10, 26, PAL_G); FXK.ring(Z.x, Z.y - 20, '#7aff9a', 480, 0.4, 12); FXK.rays(Z.x, Z.y - 34, 16, 100, '#bfffcf', 0.3);
          FXK.flash('#d8ffe0', 0.08); FXK.punch(13, 0.05, 0.1); FXK.light(Z.x, Z.y, 220, 1, '110,255,150', 0.4); sfx('roar', 0.7); sfx('heavy', 0.8);
          for (let i = 0; i < 30; i++) { const a = rand(0, TAU); G.parts.push({ x: Z.x, y: Z.y - 34, vx: Math.cos(a) * rand(100, 260), vy: Math.sin(a) * rand(60, 160) - 80, t: rand(0.5, 0.9), c: pick(['#7aff9a', '#30c060', '#d8ffe0', '#ffffff']), g: -40, glow: true }); } }
        if (t < 1.6 && Math.random() < 0.5) G.parts.push({ x: Z.x + rand(-50, 50), y: Z.y + rand(-20, 20), vx: 0, vy: rand(-50, -20), t: 0.6, c: pick(['#30c060', '#2a4a38', '#7aff9a']), g: 0, glow: true });
        FXK.light(Z.x, Z.y - 20, 130, 0.25, '110,255,150', 0.03);
        if (t > 1.7) Z.dead = true; }
      else if (Z.k === 'soup') { // 하나의 커다란 수프 덩어리 → 넓은 웅덩이
        if (t < 0.45) { const q = t / 0.45; Z.bx = lerp(Z.sx, Z.x, q); Z.by = lerp(Z.sy, Z.y, q) - Math.sin(q * Math.PI) * 90;
          if (Math.random() < 0.8) G.parts.push({ x: Z.bx + rand(-6, 6), y: Z.by + rand(-6, 6), vx: 0, vy: 40, t: 0.4, c: pick(['#e8903a', '#c05a1a', '#ffe0a0']), g: 300 }); }
        else { if (!Z.did.land) { Z.did.land = true; for (const e of foes()) if (inE(e, Z.x, Z.y, Z.r)) { damageEnemy(e, 1.4, { ang: angTo(Z, e), kb: big(e) ? 0 : 120, grogi: 12, heavy: true, gauge: 5 }); addBurn(e, 3, 0.4); }
            blast(Z.x, Z.y - 12, 56, PAL_SOUP); blast(Z.x - 40, Z.y, 26, PAL_SOUP); blast(Z.x + 40, Z.y, 26, PAL_SOUP); FXK.ring(Z.x, Z.y, '#ffe0a0', 420, 0.35, 12); FXK.flash('#fff0d0', 0.06); FXK.punch(11, 0.04, 0.08); sfx('heavy', 0.7); sfx('crunch', 0.6);
            for (let i = 0; i < 40; i++) { const a = rand(0, TAU), sp = rand(100, 280); G.parts.push({ x: Z.x, y: Z.y - 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - rand(80, 200), t: rand(0.5, 0.9), c: pick(['#e8903a', '#c05a1a', '#ffe0a0', '#7ab040', '#e87a30']), g: 520 }); } }
          const sp = Math.min(1, (t - 0.45) / 0.25); Z.cr = Z.r * (0.4 + 0.6 * sp);
          if ((Z.tk = (Z.tk || 0) - dt) <= 0) { Z.tk = 0.45; for (const e of foes()) if (inE(e, Z.x, Z.y, Z.cr - 6)) { addBurn(e, 1.2, 0.35); damageEnemy(e, 0.12, { ang: 0, kb: 0, grogi: 1, gauge: 0.5 }); } }
          for (const e of foes()) if (inE(e, Z.x, Z.y, Z.cr - 6)) { e.st = e.st || {}; e.st.hsT = 0.3; e.st.hsK = e.type === 'boss' ? 0.8 : 0.5; }
          if (!P.dead && Math.hypot(P.x - Z.x, (P.y - Z.y) / 0.6) < Z.cr) healPct(0.014 * dt);
          if (Math.random() < 0.4) G.parts.push({ x: Z.x + rand(-Z.cr, Z.cr) * 0.8, y: Z.y + rand(-Z.cr, Z.cr) * 0.4, vx: 0, vy: -20, t: 0.8, c: pick(['#5b5560', '#8d8496']), g: -10 });
          FXK.light(Z.x, Z.y, Z.cr * 1.6, 0.15, '255,170,80', 0.03); }
        if (t > Z.dur) Z.dead = true; }
      else if (Z.k === 'laser') { const q = Math.min(1, t / Z.dur), T = live(Z.tg) ? Z.tg : null, ex = T ? T.x : Z.fx, ey = T ? T.y - 12 : Z.fy;
        const cx = Z.x0 + Math.cos(Z.a0) * 95, cy = Z.y0 + Math.sin(Z.a0) * 70, u = 1 - q, e = q * q * (3 - 2 * q); // 크게 휘어 들어가는 2차 곡선
        Z.y = u * u * Z.y0 + 2 * u * q * cy + q * q * ey; Z.x = u * u * Z.x0 + 2 * u * q * cx + q * q * ex;
        Z.hist.push({ x: Z.x, y: Z.y }); if (Z.hist.length > 9) Z.hist.shift();
        if (Math.random() < 0.6) G.parts.push({ x: Z.x, y: Z.y, vx: rand(-20, 20), vy: rand(-20, 20), t: 0.25, c: pick(['#fff6d0', '#ffd34d', '#bfe8ff']), g: 0, glow: true });
        FXK.light(Z.x, Z.y, 40, 0.25, '255,240,190', 0.03);
        if (q >= 1 && !Z.did.hit) { Z.did.hit = true; Z.end = t;
          if (T) { if (Z.last) P.critNext = true; damageEnemy(T, Z.last ? 1.4 : 0.55, { ang: Math.atan2(ey - cy, ex - cx), kb: big(T) ? 0 : (Z.last ? 160 : 50), grogi: Z.last ? 12 : 4, heavy: Z.last, gauge: 2 }); }
          if (Z.last) for (const o of foes()) if (o !== T && Math.hypot(o.x - ex, o.y - 12 - ey) < 46 + o.r) damageEnemy(o, 0.6, { ang: angTo({ x: ex, y: ey }, o), kb: 100, grogi: 5, gauge: 2 });
          blast(ex, ey, Z.last ? 40 : 14, PAL_Y); for (let i = 0; i < (Z.last ? 14 : 6); i++) { const a = rand(0, TAU), sp = rand(80, 220); G.parts.push({ x: ex, y: ey, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0.25, c: pick(['#ffffff', '#fff6d0', '#bfe8ff']), g: 0, glow: true }); }
          if (Z.last) { FXK.ring(ex, ey + 10, '#fff6d0', 360, 0.35, 10); FXK.rays(ex, ey, 12, 70, '#fff6d0', 0.22); FXK.flash('#fff6d0', 0.06); FXK.punch(8, 0.03, 0.05); sfx('heavy', 1.3); } else { FXK.punch(2, 0.006, 0.01); sfx('hit', 1.6 + rand(0, 0.3)); } }
        if (Z.did.hit && t > Z.end + 0.14) Z.dead = true; }
      else if (Z.k === 'star') {
        for (const m of Z.ms) if (!m.done && t >= m.land) { m.done = true; const r = m.big ? 90 : 34;
          for (const e of foes()) if (inE(e, m.x, m.y, r)) damageEnemy(e, m.big ? 2.6 : 0.75, { ang: angTo(m, e), kb: big(e) ? 0 : (m.big ? 340 : 140), grogi: m.big ? 20 : 6, heavy: true, gauge: m.big ? 8 : 2 });
          blast(m.x, m.y - 10, m.big ? 92 : 36, PAL_F, true); FXK.debris(m.x, m.y, m.big ? 24 : 6, ['#5a4a48', '#8a7a70', '#ff8a30', '#ffd060']); FXK.ring(m.x, m.y, '#ffd080', m.big ? 700 : 260, m.big ? 0.5 : 0.25, m.big ? 18 : 6);
          if (m.big) { blast(m.x - 44, m.y, 40); blast(m.x + 44, m.y, 40); blast(m.x, m.y - 50, 40); FXK.flash('#fff0d0', 0.14); FXK.punch(18, 0.07, 0.14); FXK.rays(m.x, m.y - 10, 20, 150, '#ffe0a0', 0.35); FXK.light(m.x, m.y, 300, 1, '255,180,90', 0.6);
            for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; (G.pfire = G.pfire || []).push({ x: m.x + Math.cos(a) * rand(20, 70), y: m.y + Math.sin(a) * rand(12, 40), t: 3.5, tick: 0 }); } sfx('heavy', 0.5); sfx('blast', 0.5); sfx('perfect'); }
          else { FXK.punch(6, 0.02, 0.03); FXK.light(m.x, m.y, 120, 0.8, '255,170,80', 0.12); (G.pfire = G.pfire || []).push({ x: m.x, y: m.y, t: 1.4, tick: 0 }); sfx('blast', 0.9 + rand(0, 0.5)); } }
        if (t > 2.4) Z.dead = true; }
      else if (Z.k === 'clock') { const SW = 1.3, T0 = 0.25, ha = -Math.PI / 2 + Math.min(1, Math.max(0, t - T0) / SW) * TAU; Z.ha = ha;
        if (t > T0 && t < T0 + SW) for (const e of foes()) { if (Z.frozen.has(e) || !inE(e, Z.x, Z.y, Z.r)) continue; const ea = Math.atan2((e.y - Z.y) / 0.6, e.x - Z.x); if (Math.abs(angDiff(ea, ha)) < 0.2) { Z.frozen.add(e); applySt(e, 'stun', 1.8); damageEnemy(e, 0.5, { ang: 0, kb: 0, grogi: 6, gauge: 2 }); blast(e.x, e.y - 12, 16, PAL_Y); FXK.ring(e.x, e.y - 10, '#ffd34d', 160, 0.25, 4); sfx('reload', 1.6); } }
        if (t > T0 && Math.floor((t - T0) / (SW / 12)) !== Z.lt) { Z.lt = Math.floor((t - T0) / (SW / 12)); if (Z.lt <= 12) { sfx('blip', 1.4 + Z.lt * 0.03); const a = -Math.PI / 2 + Z.lt / 12 * TAU; for (let i = 0; i < 3; i++) G.parts.push({ x: Z.x + Math.cos(a) * Z.r, y: Z.y + Math.sin(a) * Z.r * 0.6, vx: Math.cos(a) * 40, vy: -40, t: 0.4, c: pick(['#ffd34d', '#fff2b0']), g: 0, glow: true }); } }
        if (t < T0 + SW) FXK.light(Z.x, Z.y, 180, 0.25, '255,220,140', 0.03);
        if (t >= T0 + SW && !Z.did.chime) { Z.did.chime = true; for (const e of Z.frozen) if (live(e)) { damageEnemy(e, 2.0, { ang: 0, kb: 0, grogi: 18, heavy: true, gauge: 7 }); blast(e.x, e.y - 12, 32, PAL_Y); }
          for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i / 12 * TAU; blast(Z.x + Math.cos(a) * Z.r, Z.y + Math.sin(a) * Z.r * 0.6, 14, i % 2 ? PAL_B : PAL_Y); }
          for (let i = 0; i < 4; i++) FXK.ring(Z.x, Z.y, i % 2 ? '#bfe8ff' : '#ffd34d', 260 + i * 120, 0.35 + i * 0.08, Z.r * 0.5); FXK.flash('#fff6d8', 0.12); FXK.punch(14, 0.05, 0.1); FXK.rays(Z.x, Z.y, 24, 140, '#ffe8a0', 0.3); sfx('perfect'); sfx('heavy', 1.4);
          for (let i = 0; i < 40; i++) { const a = rand(0, TAU), sp = rand(120, 300); G.parts.push({ x: Z.x + Math.cos(a) * Z.r * 0.8, y: Z.y + Math.sin(a) * Z.r * 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 100, t: rand(0.5, 0.9), c: pick(['#ffd34d', '#c9952a', '#fff2b0', '#9ad8ff', '#ffffff']), g: 420 }); } }
        if (t > T0 + SW + 0.3) Z.dead = true; }
    }
    K.zones = K.zones.filter(Z => !Z.dead);
  }
  const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, u = clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1); return Math.hypot(px - ax - dx * u, py - ay - dy * u); };

  // ---------------------------------------------------------------- 그리기 (2px 칸)
  let SEL = null;
  const GEM = { sap: ['#e8f4ff', '#9ad8ff', '#4f8dff', '#24408a'], ame: ['#f6e8ff', '#c8a0ff', '#8a5ae0', '#3a2470'], eme: ['#e8fff0', '#7affc0', '#2ab070', '#105a38'], rub: ['#ffe8ee', '#ff7a9a', '#d02848', '#6a1024'] };
  // 보석 기둥: 육각 기둥 (왼쪽 밝은 면 · 가운데 · 오른쪽 어두운 면) + 뾰족한 머리 + 반짝임
  // 보석 기둥: 육각 기둥 세 면(밝음 · 중간 · 어둠) + 세 갈래 깎인 머리 + 안쪽 굴절 빛줄기 + 제 빛깔 테두리 · 위로 갈수록 밝아짐
  function drawGem(x, y, h, w, c, lean, q, flash) { const P = GEM[c], H = Math.round(h * q / 2) * 2, Y = snap2(y), W = w * 2, tipH = Math.round(W * 0.9 / 2) * 2 + 2; if (H < 4) return;
    const sx0 = i => snap2(x + lean * i * 0.18), rowW = i => i > H - tipH ? Math.max(2, Math.round((H - i) / tipH * w) * 2) : W;
    // 테두리 (가장 어두운 제 빛깔) 한 칸 바깥
    for (let i = -2; i < H + 2; i += 2) { const ii = clamp(i, 0, H - 2), ww = rowW(ii), sx = sx0(ii) - ww / 2; ctx.fillStyle = i < 0 ? '#0b0a14' : P[3]; ctx.fillRect(sx - 2, Y - i, ww + 4, 2); }
    for (let i = 0; i < H; i += 2) { const k = i / H, ww = rowW(i), sx = sx0(i) - ww / 2, tip = i > H - tipH, t3 = Math.max(2, Math.round(ww / 3 / 2) * 2), mid = Math.max(0, ww - t3 * 2);
      const L = flash ? '#ffffff' : k > 0.45 ? P[0] : P[1], M = flash ? P[0] : k > 0.7 ? P[0] : k > 0.25 ? P[1] : (i % 4 ? P[1] : P[2]), Rr = flash ? P[1] : k > 0.5 ? P[2] : P[3];
      if (tip) { const half = ww / 2; ctx.fillStyle = L; ctx.fillRect(sx, Y - i, half, 2); ctx.fillStyle = Rr; ctx.fillRect(sx + half, Y - i, half, 2); if (ww > 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(sx + half - 2, Y - i, 2, 2); } continue; }
      ctx.fillStyle = L; ctx.fillRect(sx, Y - i, t3, 2); ctx.fillStyle = M; ctx.fillRect(sx + t3, Y - i, mid, 2); ctx.fillStyle = Rr; ctx.fillRect(sx + ww - t3, Y - i, t3, 2);
      if (i === H - tipH - 2 || i === H - tipH) { ctx.fillStyle = '#ffffff'; ctx.fillRect(sx, Y - i, ww - 2, 2); } } // 머리와 몸 사이 깎인 선
    // 굴절 빛줄기 두 개 (비스듬)
    for (const [o, len] of [[0.25, 0.3], [0.55, 0.2]]) { const i0 = Math.round(H * o / 2) * 2; for (let j = 0; j < len * H; j += 2) { const i = i0 + j, ww = rowW(i); if (i > H - tipH) break; const sx = sx0(i) - ww / 2 + 2 + Math.round((j / (len * H)) * (ww - 6) / 2) * 2; ctx.fillStyle = j % 4 ? P[0] : '#ffffff'; ctx.fillRect(sx, Y - i, 2, 2); } }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(sx0(H - tipH - 4) - W / 2, Y - (H - tipH - 4), 2, Math.min(10, H - tipH)); }
  // 보석 아래 작은 결정 조각 무리
  function drawShards(x, y, c, q, seed) { const P = GEM[c]; for (let i = 0; i < 3; i++) { const dx = (hsh(seed, i, 1) - 0.5) * 22, h = (6 + hsh(seed, i, 2) * 10) * q, ln = dx > 0 ? 1.4 : -1.4; drawGem(x + dx, y + 2 + i, h, 2, c, ln, 1); } }
  function drawBoneSpike(x, y, h, lean) { const X = snap2(x), Y = snap2(y); if (h < 2) return;
    for (let i = 0; i < h; i += 2) { const k = i / h, w = k > 0.8 ? 2 : k > 0.5 ? 4 : 6, sx = X + Math.round(lean * k * k * 10 / 2) * 2 - w / 2; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(sx - 2, Y - i - 2, w + 4, 4); }
    for (let i = 0; i < h; i += 2) { const k = i / h, w = k > 0.8 ? 2 : k > 0.5 ? 4 : 6, sx = X + Math.round(lean * k * k * 10 / 2) * 2 - w / 2; ctx.fillStyle = '#e8e4d8'; ctx.fillRect(sx, Y - i, w, 2); ctx.fillStyle = '#a8a49a'; ctx.fillRect(sx + w - 2, Y - i, 2, 2); if (i % 8 === 6 && k < 0.7) { ctx.fillStyle = '#c8c4b8'; ctx.fillRect(sx - 2, Y - i, w + 4, 2); } } }
  // 거대 해골 (가로 28 · 세로 26칸 정도): 땅에서 솟음 · 턱이 열리며 초록 혼불
  function drawBigSkull(x, y, rise, jaw, t) { const X = snap2(x), Y = snap2(y - rise), C = '#e8e4d8', D = '#a8a49a', K2 = '#0b0a0e';
    ctx.save(); ctx.beginPath(); ctx.rect(X - 60, Y - 80, 120, Math.max(0, snap2(y) - (Y - 80) + 2)); ctx.clip();
    const rows = [[-8, 8], [-12, 12], [-14, 14], [-14, 14], [-14, 14], [-14, 14], [-13, 13], [-12, 12], [-10, 10], [-9, 9], [-8, 8]];
    rows.forEach(([a, b], i) => { const yy = Y - 40 + i * 2 * 2; ctx.fillStyle = K2; ctx.fillRect(X + a * 2 - 2, yy - 2, (b - a) * 2 + 4, 6); });
    rows.forEach(([a, b], i) => { const yy = Y - 40 + i * 2 * 2; ctx.fillStyle = i < 2 ? '#ffffff' : C; ctx.fillRect(X + a * 2, yy, (b - a) * 2, 4); ctx.fillStyle = D; ctx.fillRect(X + b * 2 - 6, yy, 6, 4); });
    // 눈구멍 + 혼불
    for (const s of [-1, 1]) { ctx.fillStyle = K2; ctx.fillRect(X + s * 10 - 6, Y - 26, 12, 10); const fl = Math.floor(t * 12 + (s > 0 ? 1 : 0)) % 2; ctx.fillStyle = '#30c060'; ctx.fillRect(X + s * 10 - 4, Y - 24, 8, 6); ctx.fillStyle = '#d8ffe0'; ctx.fillRect(X + s * 10 - 2, Y - 22 - fl * 2, 4, 4); }
    ctx.fillStyle = K2; ctx.fillRect(X - 2, Y - 14, 4, 6); // 코
    // 윗니 · 턱
    ctx.fillStyle = K2; ctx.fillRect(X - 14, Y - 6, 28, 4); for (let i = -12; i <= 10; i += 4) { ctx.fillStyle = C; ctx.fillRect(X + i, Y - 6, 2, 4); }
    const jy = Y - 2 + jaw; ctx.fillStyle = K2; ctx.fillRect(X - 14, jy - 2, 28, 10); ctx.fillStyle = C; ctx.fillRect(X - 12, jy, 24, 6); ctx.fillStyle = D; ctx.fillRect(X + 6, jy, 6, 6); for (let i = -10; i <= 10; i += 4) { ctx.fillStyle = K2; ctx.fillRect(X + i, jy, 2, 2); }
    if (jaw > 2) { ctx.fillStyle = '#30c060'; ctx.fillRect(X - 10, Y - 2, 20, jaw); ctx.fillStyle = '#d8ffe0'; ctx.fillRect(X - 6, Y, 12, Math.max(0, jaw - 4)); }
    ctx.restore(); }
  function drawGround() {
    for (const Z of K.zones) { const t = Z.t;
      if (Z.k === 'gems') { const al = Math.min(1, t / 0.1); ctx.globalAlpha = al; // 바닥: 결정이 번진 서리 무늬 + 갈라진 틈 + 두 겹 고리
        for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.2; let px = Z.x, py = Z.y; for (let j = 1; j <= 6; j++) { const r = j * 11, nx = Z.x + Math.cos(a + (hsh(i, j, 4) - 0.5) * 0.4) * r, ny = Z.y + Math.sin(a + (hsh(i, j, 4) - 0.5) * 0.4) * r * 0.6; pxLine(px, py, nx, ny, j < 3 ? '#e8f4ff' : j < 5 ? '#9ad8ff' : '#4f8dff'); if (j % 2 === 0) { const ba = a + (hsh(i, j, 5) > 0.5 ? 0.7 : -0.7); pxLine(nx, ny, nx + Math.cos(ba) * 8, ny + Math.sin(ba) * 5, '#9ad8ff'); } px = nx; py = ny; } }
        ring(Z.x, Z.y, 70, '#c8e8ff', 3, 0.6, Math.floor(t * 12)); ring(Z.x, Z.y, 76, '#4f8dff', 2, 0.6, -Math.floor(t * 12)); ctx.globalAlpha = 1; }
      else if (Z.k === 'grave') { const al = Math.min(1, t / 0.15, (1.7 - t) / 0.4); ctx.globalAlpha = al; for (let yy = -40; yy <= 40; yy += 2) for (let xx = -70; xx <= 70; xx += 2) { const e = Math.hypot(xx / 70, yy / 40); if (e > 1) continue; if (hsh(xx, yy, 7) < e * 1.1 - 0.2) continue; dot(Z.x + xx, Z.y + yy * 0.6 / 0.6 * 0.6, e < 0.5 ? '#0e1a12' : '#1a2a1e'); } ring(Z.x, Z.y, 66, '#30c060', 3, 0.6, Math.floor(t * 10)); ctx.globalAlpha = 1; }
      else if (Z.k === 'soup' && Z.cr) { const r = Z.cr, al = Math.min(1, (Z.dur - t) / 0.6); ctx.globalAlpha = al;
        for (let yy = -r; yy <= r; yy += 2) for (let xx = -r; xx <= r; xx += 2) { const e = Math.hypot(xx, yy) / r + (hsh(Math.round(Math.atan2(yy, xx) * 6), 0, 1) - 0.5) * 0.12; if (e > 1) continue; const edge = e > 0.86, h = hsh(xx, yy, 2);
          dot(Z.x + xx, Z.y + yy * 0.6, edge ? (h > 0.5 ? '#5a3a1a' : '#8a4a1a') : e > 0.7 ? '#c05a1a' : h > 0.94 ? '#7ab040' : h > 0.9 ? '#e8a060' : (Math.floor(t * 3 + h * 4) % 4 === 0 && h > 0.7) ? '#f0a050' : '#e8903a'); }
        for (let i = 0; i < 10; i++) { const ph = (t * 1.3 + i * 0.37) % 1, a = hsh(i, 3, 3) * TAU, rr = hsh(i, 4, 4) * r * 0.75, bx = Z.x + Math.cos(a) * rr, by = Z.y + Math.sin(a) * rr * 0.6; if (ph < 0.7) ring(bx, by, 2 + ph * 6, ph > 0.5 ? '#ffe0a0' : '#f0b070', 0, 0.6); else dot(bx, by - 2, '#fff0d0'); }
        ctx.globalAlpha = 1; }
      else if (Z.k === 'star') for (const m of Z.ms) { if (m.done) continue; const q = Math.min(1, t / m.land), r = (m.big ? 80 : 26) * (1.2 - 0.2 * q); ring(m.x, m.y, r, q > 0.85 && Math.floor(t * 24) % 2 ? '#ffffff' : '#ff6a30', 2, 0.55); if (m.big) ring(m.x, m.y, r * 0.6, '#ffb040', 3, 0.55, Math.floor(t * 12)); }
      else if (Z.k === 'clock') { const al = Math.min(1, t / 0.25, (0.25 + 1.3 + 0.3 - t) / 0.3), r = Z.r * Math.min(1, t / 0.25); ctx.globalAlpha = al * 0.55;
        for (let yy = -r; yy <= r; yy += 2) { const w = Math.sqrt(Math.max(0, r * r - yy * yy)); for (let xx = -w; xx <= w; xx += 2) if (((xx + yy) / 2) % 2 === 0) dot(Z.x + xx, Z.y + yy * 0.6, Math.hypot(xx, yy) < r * 0.6 ? '#141a3a' : '#1e2a5a'); }
        ctx.globalAlpha = al;
        // 두 겹 금테 + 바깥 톱니
        ring(Z.x, Z.y, r, '#ffd34d', 0, 0.6); ring(Z.x, Z.y, r - 2, '#c9952a', 0, 0.6); ring(Z.x, Z.y, r - 10, '#ffd34d', 2, 0.6); const nT = 36; for (let i = 0; i < nT; i++) { const a = i / nT * TAU + t * 0.6; if (i % 2) continue; dot(Z.x + Math.cos(a) * (r + 4), Z.y + Math.sin(a) * (r + 4) * 0.6, '#c9952a', 4); }
        for (let i = 0; i < 60; i++) { const a = -Math.PI / 2 + i / 60 * TAU, big5 = i % 5 === 0, r0 = big5 ? r - 20 : r - 14; pxLine(Z.x + Math.cos(a) * r0, Z.y + Math.sin(a) * r0 * 0.6, Z.x + Math.cos(a) * (r - 12), Z.y + Math.sin(a) * (r - 12) * 0.6, big5 ? (i % 15 === 0 ? '#ffffff' : '#ffd34d') : '#5a6aa8'); }
        // 작은 톱니바퀴 두 개
        for (const [ox, oy, gr, sp] of [[-0.45, -0.2, 12, 2], [0.4, 0.25, 9, -3]]) { const gx = Z.x + ox * r, gy = Z.y + oy * r * 0.6; ring(gx, gy, gr, '#8a6a26', 0, 0.6); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * sp; dot(gx + Math.cos(a) * (gr + 3), gy + Math.sin(a) * (gr + 3) * 0.6, '#c9952a'); } }
        if (Z.ha != null) { // 초침 + 지나간 부채꼴 잔광
          const T0 = 0.25, sweep = Math.min(TAU, Math.max(0, t - T0) / 1.3 * TAU);
          for (let a = -Math.PI / 2; a < -Math.PI / 2 + sweep; a += 0.05) { const k = (a - (-Math.PI / 2 + sweep)) / 1.2; if (k < -1) continue; ctx.globalAlpha = al * Math.max(0, 1 + k) * 0.5; pxLine(Z.x, Z.y, Z.x + Math.cos(a) * (r - 16), Z.y + Math.sin(a) * (r - 16) * 0.6, '#ffd34d'); }
          ctx.globalAlpha = al; for (const w of [2, 0]) pxLine(Z.x + w, Z.y, Z.x + Math.cos(Z.ha) * (r - 8) + w, Z.y + Math.sin(Z.ha) * (r - 8) * 0.6, w ? '#c9952a' : '#ffffff');
          const ha2 = -Math.PI / 2 + sweep / 12; pxLine(Z.x, Z.y, Z.x + Math.cos(ha2) * r * 0.45, Z.y + Math.sin(ha2) * r * 0.45 * 0.6, '#ffd34d'); }
        dot(Z.x - 4, Z.y - 4, '#ffd34d', 8); dot(Z.x - 2, Z.y - 2, '#ffffff', 4); ctx.globalAlpha = 1; }
    }
  }
  function drawOver() { const P = G.player;
    for (const b of K.bolts) if (b === SEL) { const p = 1 - b.t / b.max, fl = Math.floor(b.t * 60) % 2;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 1; i < b.pts.length; i++) { const a = b.pts[i - 1], c = b.pts[i]; if (b.w >= 2) for (const o of [-4, -2, 2, 4]) pxLine(a.x + o * (b.w > 2 ? 1 : 0.5), a.y + o * 0.5, c.x + o * (b.w > 2 ? 1 : 0.5), c.y + o * 0.5, '#2a4a9a'); if (b.w >= 2) for (const o of [-2, 2]) pxLine(a.x + o * 0.5, a.y, c.x + o * 0.5, c.y, '#4f8dff'); pxLine(a.x, a.y, c.x, c.y, fl ? '#ffffff' : '#c8e8ff'); }
      for (const [a, c] of b.br) { pxLine(a.x, a.y, c.x, c.y, '#9ad8ff'); }
      ctx.restore(); }
    for (const Z of K.zones) { if (Z !== SEL) continue; const t = Z.t;
      if (Z.k === 'fireball') { for (const q of Z.trail) { const k = q.t / 0.35; disk(q.x, q.y - 12, Z.r * k * 0.8, k > 0.6 ? '#ffb030' : k > 0.3 ? '#ff6a20' : '#a3161c', 0.85); }
        const r = Z.r + Math.round(Math.sin(t * 30)) * 2; disk(Z.x, Z.y - 12, r + 2, '#2a0a08', 0.9); disk(Z.x, Z.y - 12, r, '#c02010', 0.9); disk(Z.x, Z.y - 12, r - 4, '#ff6a20', 0.9); disk(Z.x, Z.y - 12, r - 8, '#ffb030', 0.9); disk(Z.x, Z.y - 12, r - 12, '#ffe060', 0.9); disk(Z.x + 2, Z.y - 14, Math.max(2, r - 15), '#ffffff', 0.9);
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 8, rr = r + 2 + hsh(i, Math.floor(t * 20), 1) * 6; dot(Z.x + Math.cos(a) * rr, Z.y - 12 + Math.sin(a) * rr * 0.9, i % 2 ? '#ffb030' : '#ff3020', 4); } }
      else if (Z.k === 'gems') { const gs = Z.gs.slice().sort((a, b) => a.y - b.y); const br = Z.did.br, fl = t > 0.85 && Math.floor(t * 24) % 2 === 0;
        if (!br) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const g of gs) if (g.up) { const P = GEM[g.c]; ctx.globalAlpha = 0.1 + Math.sin(t * 9 + g.x) * 0.04; disk(g.x, g.y - g.h * 0.45, g.w * 2 + 8, P[2], 1.6); } ctx.restore(); ctx.globalAlpha = 1; }
        for (const g of gs) { if (!g.up || br) continue; const q = Math.min(1, (t - g.d) / 0.1), ov = q < 1 ? q * 1.25 : 1 + Math.max(0, 0.15 - (t - g.d - 0.1)); drawShards(g.x, g.y, g.c, Math.min(1, q * 1.5), g.x * 3.1); drawGem(g.x, g.y, g.h * Math.min(ov, 1.2), g.w, g.c, g.lean || 0, 1, fl); }
        if (!br && t > 0.85) for (const g of gs) if (g.up) { let x = g.x, y = g.y - g.h * 0.2; for (let j = 0; j < 5; j++) { const nx = x + (hsh(g.x, j, 9) - 0.5) * g.w * 2, ny = y - g.h * 0.14; pxLine(x, y, nx, ny, '#ffffff'); x = nx; y = ny; } }
        if (Z.sp) for (const s of Z.sp) star4(s.x, s.y, s.t > 0.15 ? 4 : 2, '#c8e8ff');
        if (t > 0.9 && !Z.did.br && Math.floor(t * 24) % 2) for (const g of Z.gs) if (g.up) pxLine(g.x - 3, g.y - g.h * 0.3, g.x + 3, g.y - g.h * 0.6, '#ffffff'); }
      else if (Z.k === 'rod' && Z.bx != null) { const n = Math.max(1, Math.floor(Math.hypot(Z.bx - Z.lx, Z.by - Z.ly) / 3)); for (let i = 0; i <= n; i++) { const u = i / n, sag = Z.ph === 'fly' || Z.ph === 'back' ? Math.sin(u * Math.PI) * 8 : 0; dot(lerp(Z.lx, Z.bx, u), lerp(Z.ly, Z.by, u) + sag, '#e8e8ec'); }
        if (Z.ph !== 'yank') { const X = snap2(Z.bx), Y = snap2(Z.by); ctx.fillStyle = '#0b0a0e'; ctx.fillRect(X - 3, Y - 5, 6, 10); ctx.fillStyle = '#e83030'; ctx.fillRect(X - 2, Y - 4, 4, 4); ctx.fillStyle = '#ffffff'; ctx.fillRect(X - 2, Y, 4, 4); } }
      else if (Z.k === 'grave') { const sk = Z.sp.slice().sort((a, b) => a.y - b.y), fade = t > 1.2 ? Math.max(0, 1 - (t - 1.2) / 0.5) : 1;
        const rise = Math.min(1, Math.max(0, t - 0.15) / 0.4), jaw = t > 0.5 ? Math.min(10, (t - 0.5) * 60) * (t < 1.1 ? 1 : Math.max(0, 1 - (t - 1.1) / 0.3)) : 0;
        const back = sk.filter(s => s.y <= Z.y), front = sk.filter(s => s.y > Z.y);
        ctx.globalAlpha = fade; for (const s of back) drawBoneSpike(s.x, s.y, Math.round(Math.min(1, (t - s.t0) / 0.07) * (26 + (s.i % 3) * 8) / 2) * 2, s.lean);
        if (t > 0.5) { const q = Math.min(1, (t - 0.5) / 0.08), over = q < 1 ? q * 1.2 : 1 + Math.max(0, 0.1 - (t - 0.58)) ; // 가운데 거대 뼈 가시 무리
          for (const [dx, dy, h, ln] of [[-14, -6, 44, -1], [14, -4, 48, 1], [0, -10, 64, 0], [-24, 4, 32, -1.5], [24, 6, 34, 1.5], [-6, 8, 40, -0.5], [8, 10, 38, 0.6]]) drawBoneSpike(Z.x + dx, Z.y + dy, Math.round(h * over * fade / 2) * 2, ln * 1.2); }
        for (const s of front) drawBoneSpike(s.x, s.y, Math.round(Math.min(1, (t - s.t0) / 0.07) * (26 + (s.i % 3) * 8) / 2) * 2, s.lean); ctx.globalAlpha = 1; }
      else if (Z.k === 'soup' && t < 0.45) { const r = 12 + Math.round(Math.sin(t * 30)); disk(Z.bx, Z.by, r + 2, '#2a1a10', 0.85); disk(Z.bx, Z.by, r, '#c05a1a', 0.85); disk(Z.bx, Z.by, r - 3, '#e8903a', 0.85); disk(Z.bx - 3, Z.by - 3, 4, '#ffe0a0', 0.85); dot(Z.bx + 4, Z.by + 2, '#7ab040', 4); dot(Z.bx - 6, Z.by + 4, '#e87a30', 4); }
      else if (Z.k === 'laser') { const H = Z.hist, n = H.length, fade = Z.did.hit ? Math.max(0, 1 - (t - Z.end) / 0.14) : 1; if (n < 2) continue; ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 1; i < n; i++) { const k = i / (n - 1), a = H[i - 1], b = H[i]; ctx.globalAlpha = fade * (0.3 + 0.7 * k);
          if (k > 0.25) { pxLine(a.x, a.y - 2, b.x, b.y - 2, '#c9952a'); pxLine(a.x, a.y + 2, b.x, b.y + 2, '#c9952a'); }
          if (Z.last && k > 0.4) { pxLine(a.x, a.y - 4, b.x, b.y - 4, '#8a6420'); pxLine(a.x, a.y + 4, b.x, b.y + 4, '#8a6420'); pxLine(a.x + 2, a.y, b.x + 2, b.y, '#fff6d0'); }
          pxLine(a.x, a.y, b.x, b.y, k > 0.6 ? '#ffffff' : '#fff6d0'); }
        ctx.globalAlpha = fade; if (!Z.did.hit) { const h = H[n - 1]; star4(h.x, h.y, Z.last ? 8 : 5, '#ffd34d'); dot(h.x - 2, h.y - 2, '#ffffff', 4); }
        ctx.restore(); }
      else if (Z.k === 'star') for (const m of Z.ms) { if (m.done || t < m.land - 0.32) continue; const q = (t - (m.land - 0.32)) / 0.32, x = m.x - (1 - q) * 130, y = m.y - 10 - (1 - q) * 260, s = m.s;
          for (let j = 0; j < 16; j++) { const tx = x - j * 4.2, ty = y - j * 8.4, k = j / 16; disk(tx + rand(-1, 1), ty, Math.max(2, s * (1 - k) * 0.9), k < 0.15 ? '#fff0d0' : k < 0.4 ? '#ffb040' : k < 0.7 ? '#ff5a20' : '#5a4a48'); }
          disk(x, y, s + 2, '#1a0a08'); disk(x, y, s, '#8a3a20'); disk(x - 2, y - 2, s - 3, '#ffb040'); disk(x - 3, y - 3, Math.max(2, s - 7), '#fff0d0'); }
      else if (Z.k === 'clock') for (const e of Z.frozen) if (live(e) && !Z.did.chime) { const n = 16; for (let i = 0; i < n; i++) { if ((i + Math.floor(t * 16)) % 3 === 0) continue; const a = i / n * TAU + t; dot(e.x + Math.cos(a) * (e.r + 8), e.y - 12 + Math.sin(a) * (e.r + 8) * 0.7, i % 2 ? '#ffd34d' : '#9ad8ff'); }
          const X = snap2(e.x), Y = snap2(e.y - (e.tall || 30) - 10); ctx.fillStyle = '#0b0a0e'; ctx.fillRect(X - 5, Y - 5, 10, 10); ctx.fillStyle = '#ffd34d'; ctx.fillRect(X - 4, Y - 4, 8, 8); ctx.fillStyle = '#ffffff'; ctx.fillRect(X - 2, Y - 2, 4, 4); ctx.fillStyle = '#0b0a0e'; ctx.fillRect(X, Y - 3, 1, 3); ctx.fillRect(X, Y, 2, 1); }
    }
  }
  SKD.add(ents => { if (!G) return; const one = it => SKD.one(drawOver, v => SEL = v, it);
    for (const b of K.bolts) ents.push({ y: Math.max(...b.pts.map(p => p.y)) + 12, d: one(b) });
    for (const Z of K.zones) ents.push({ y: Z.k === 'rod' && Z.ph === 'yank' ? G.player.y + 2 : Z.k === 'fireball' ? Z.y + 2 : Z.k === 'laser' ? Math.max(Z.y, Z.y0) + 14 : Z.k === 'soup' ? (Z.t < 0.45 ? Z.by + 20 : Z.y - 200) : Z.y + 1, d: one(Z) }); });
  const _dgg = drawGearGround, gd = SKD.ground(drawGround); drawGearGround = function () { _dgg(); ctx.save(); gd(); ctx.restore(); };
  const _ie = itemExtra;
  itemExtra = function (it, cls) { const base = _ie(it, cls); if (!it || it.wk == null || it.cls !== 'mage') return base;
    const sk = (wcat('mage')[it.wk] || {}).sk, D = DEF[sk]; if (!D) return base;
    return base + `<div class="fx">우클릭 「${D.n}」 · 쿨타임 ${D.cd}초 — ${D.d}</div>`; };

  // ---------------------------------------------------------------- 옮긴 고유 효과 (화염구 → 기본 공격)
  const _cb = castBolt;
  castBolt = function () { const P = G.player, n0 = G.mproj.length; _cb(); if (G.cls !== 'mage') return; const sk = wSkill(), nb = G.mproj.slice(n0).filter(p => p.kind === 'bolt'); if (!nb.length) return; const b = nb[0];
    if (sk === 'mirror') { const mx = P.x - Math.cos(P.ang) * 34, my = P.y - Math.sin(P.ang) * 24; G.mproj.push(Object.assign({}, b, { x: mx, y: my - 12, hist: [], hitS: new Set() })); G.fx.push({ kind: 'ghost', x: mx, y: my, face: P.face, rot: 0, t: 0.3, max: 0.3, tint: true }); }
    if (sk === 'ashstar2' && b.big) for (const s of [-1, 1]) G.mproj.push(Object.assign({}, b, { ang: b.ang + s * 0.26, hist: [], hitS: new Set() })); };
  const _woh = weaponOnHit;
  weaponOnHit = function (e, o, crit) { _woh(e, o, crit); if (G.cls === 'mage' && o && o.basic && wSkill() === 'ladle' && !e.dead) addBurn(e, 1.5, 0.25); };

  return SKD.wrapAll({ start, update, tick, def, DEF });
})();
