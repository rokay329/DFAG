'use strict';
// ==================================================================================================
// 잿빛 왕관 원정대 — 43_grs.js : v3.22 그레이브(거너) 무기별 우클릭 기술 (41_krs.js · 42_ars.js와 같은 방식)
//  · 레어 · 유니크 · 레전더리 총은 무기마다 고유한 우클릭 기술을 씀 (커먼 · 초록 총은 기본 「파열탄」)
//  · 쿨타임은 무기마다 따로 돎 (KRS.tick이 함께 관리) · 고유 우클릭은 장탄을 쓰지 않음
//  · 연출은 모두 2px 칸 · 도트 선 · 도트 고리 (KRS.FXK · ARS 도트 도우미 공유)
// ==================================================================================================
const GRS = (() => {
  const DEF = {
    blunder: { n: '나팔 포효', cd: 8, d: '나팔총으로 잡동사니를 넓게 터뜨립니다. 앞쪽 넓은 부채꼴의 적에게 큰 피해를 주고 멀리 날려 보내며, 0.8초 동안 기절시킵니다.' },
    harpoon: { n: '고래잡이', cd: 9, d: '작살을 세게 쏩니다. 작살은 닿는 적을 모두 꿰어 달고 처음 만나는 벽이나 장애물까지 밀고 가 박히며, 박힌 적은 큰 피해를 받고 오래 기절합니다. 보스는 꿰뚫고 지나갑니다.' },
    duck: { n: '오리 행진', cd: 9, d: '고무 오리 다섯 마리를 풀어 놓습니다. 오리는 통통 뛰어 가까운 적을 쫓아가 「꽥」 하고 터집니다.' },
    longrifle: { n: '관통 저격', cd: 10, d: '잠시 조준한 뒤 화면 끝까지 꿰뚫는 한 발을 쏩니다. 줄 위의 모든 적에게 아주 큰 피해를 줍니다. 조준하는 동안 방향을 바꿀 수 있습니다.' },
    revolver: { n: '팬 해머', cd: 7, d: '두 리볼버의 공이를 손바닥으로 연달아 쳐 0.6초 동안 12발을 쏟아붓습니다. 앞쪽의 적을 번갈아 노립니다.' },
    cannon: { n: '일제 포격', cd: 10, d: '하늘로 무거운 포탄 세 발을 쏘아 올립니다. 조준한 지점 주변에 차례로 떨어져 크게 폭발하고, 폭발한 자리에 불길이 남습니다.' },
    puffer: { n: '거대 복어', cd: 9, d: '큰 복어를 굴려 보냅니다. 복어는 벽에 튕기며 점점 부풀고, 닿는 적을 밀쳐낸 뒤 터져 가시를 사방으로 쏩니다.' },
    match: { n: '화염 방사', cd: 9, d: '1초 동안 앞으로 불을 뿜습니다. 불길에 닿은 적은 계속 피해를 받고 불이 붙으며, 지나간 바닥에 불길이 남습니다. 뿜는 동안 방향을 바꿀 수 있습니다.' },
    undertaker: { n: '장례 행렬', cd: 11, d: '혼불 해골탄 여섯 발을 줄지어 쏩니다. 해골탄은 크게 한 바퀴 돌아 적의 등 뒤로 파고들어 반드시 치명타를 주고 폭발합니다.' },
    kingrev: { n: '왕의 처결', cd: 11, d: '주변의 적 최대 여섯에게 왕관 표식을 띄우고, 몸 주위로 금탄 여섯 발을 돌립니다. 금탄이 하나씩 날아가 표식에 꽂히며 터지고, 마지막 탄은 크게 폭발합니다.' },
  };
  for (const k in DEF) SK_META[k] = Object.assign(SK_META[k] || {}, { K: DEF[k].n, KD: DEF[k].d });
  const K = { g: null, tr: [], marks: [], beams: [], crowns: [], coffins: [], blasts: [], scorch: [] };
  const def = () => (G && G.cls === 'gunner' ? DEF[wSkill()] || null : null);
  const FXK = KRS.FXK, lerp = (a, b, t) => a + (b - a) * t, dot = ARS.dot, pxLine = ARS.pxLine, slash = ARS.slash;
  const big = e => e.type === 'boss' || isElite(e) || isSemi(e) || isDummy(e);
  const live = e => e && !e.dead && e.type !== 'flag';
  const foes = () => G.enemies.filter(live);
  const pop = (x, y, v, c, s) => FXK.pop(x, y, v, c, s);
  const aimPt = (P, maxD) => { let tx, ty; if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; } else { tx = P.x + Math.cos(P.ang) * maxD; ty = P.y + Math.sin(P.ang) * maxD; }
    const d = Math.hypot(tx - P.x, ty - P.y); if (d > maxD) { tx = P.x + (tx - P.x) / d * maxD; ty = P.y + (ty - P.y) / d * maxD; }
    return { x: clamp(tx, A.x0 + 16, A.x1 - 16), y: clamp(ty, A.y0 + 16, A.y1 - 16) }; };
  const wallAt = (x0, y0, x1, y1) => segSolid(x0, y0, x1, y1, 4) || x1 < A.x0 + 6 || x1 > A.x1 - 6 || y1 < A.y0 + 6 || y1 > A.y1 - 6;
  const tracer = (x0, y0, x1, y1, c, w, t) => K.tr.push({ x0, y0, x1, y1, c, w: w || 1, t: t || 0.12, max: t || 0.12 });
  const flashM = (s, a) => { const m = muzzle(); G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang: a == null ? G.player.blade : a, s: s || 1.6, t: 0.16, max: 0.16 }); return m; };
  const rayHit = (x, y, a, len, w, skip) => foes().filter(e => !(skip && skip.has(e))).map(e => { const dx = e.x - x, dy = e.y - 10 - y, along = dx * Math.cos(a) + dy * Math.sin(a), perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a)); return { e, along, perp }; }).filter(o => o.along > 0 && o.along < len && o.perp < w + o.e.r).sort((p, q) => p.along - q.along);
  const boom = (x, y, r, coef, cols, light, word) => { for (const e of foes()) if (Math.hypot(e.x - x, (e.y - y) / 0.8) < r + e.r) damageEnemy(e, coef, { ang: angTo({ x, y }, e), kb: big(e) ? 0 : 220, grogi: 8, heavy: true, gauge: 3 });
    FXK.ring(x, y - 4, cols[0], r * 6, 0.3, 6); FXK.burst(x, y - 6, cols, 14, 230, 0, true, 0.35); FXK.rays(x, y - 6, 8, r * 1.3, cols[1] || cols[0], 0.18); FXK.light(x, y, r * 2.6, 0.9, light, 0.25); dust(x, y, 6); if (word) pop(x, y - 30, word, cols[0], 2); };

  // 도트 폭발: 하얀 섬광 → 노란 불덩이 → 주황 → 검은 연기 (2px 칸 · 디더로 흩어짐) + 연기 기둥
  const PAL_F = ['#ffffff', '#fff2a0', '#ffb040', '#e05a20', '#5a4a48', '#2a2228'], PAL_G = ['#ffffff', '#d8ffe0', '#7aff9a', '#30c060', '#2a4a38', '#141c18'], PAL_Y = ['#ffffff', '#fff6c0', '#ffd34d', '#c9952a', '#5a4a38', '#2a2218'];
  const blast = (x, y, s, pal, scorch, ry) => { K.blasts.push({ x, y, s, pal: pal || PAL_F, t: 0, max: 0.32 + s * 0.007, seed: Math.random() * 99, ry: ry || (s >= 40 ? 0.62 : 0.85) }); // v3.22 큰 폭발은 바닥 타원
    for (let i = 0; i < Math.round(s / 6); i++) G.parts.push({ x: x + rand(-s, s) * 0.4, y: y - rand(0, s * 0.4), vx: rand(-30, 30), vy: rand(-70, -30), t: rand(0.5, 0.9), c: pick(['#3a3540', '#5b5560', '#2a2228']), g: -30 });
    if (scorch) K.scorch.push({ x, y: y + s * 0.2, r: s * 0.7, t: 5, seed: Math.random() * 99 }); };

  // ---------------------------------------------------------------- 시작
  function start() {
    const D = def(); if (!D) return false;
    const P = G.player, k = wSkill();
    P.atkAng = P.ang; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.blade = P.ang; P.combo = 0; P.queued = false;
    P.grs = { k, t: 0, hit: new Set(), did: {}, dur: 0.5, a: P.ang };
    const R = P.grs; P.state = 'grs';
    if (k === 'blunder') { R.dur = 0.55; sfx('reload', 0.8); }
    else if (k === 'harpoon') { R.dur = 0.35; }
    else if (k === 'duck') { R.dur = 0.42; }
    else if (k === 'longrifle') { R.dur = 1.0; sfx('aim'); }
    else if (k === 'revolver') { R.dur = 0.9; const L = foes().filter(e => dist(P, e) < 230 && coneIn(P, e, P.ang, 1.0)).sort((a, b) => dist(P, a) - dist(P, b)); R.tg = L; }
    else if (k === 'cannon') { R.dur = 0.5; const T = aimPt(P, 200); R.T = T;
      const OFF = [[0, 0], [-44, 22], [44, -18]]; OFF.forEach(([dx, dy], i) => K.marks.push({ x: clamp(T.x + dx, A.x0 + 10, A.x1 - 10), y: clamp(T.y + dy, A.y0 + 10, A.y1 - 10), t: 0, land: 0.78 + i * 0.26, r: 52 })); R.dur = 0.72; }
    else if (k === 'puffer') { R.dur = 0.35; }
    else if (k === 'match') { R.dur = 1.25; }
    else if (k === 'undertaker') { R.dur = 0.48; const L = foes().filter(e => dist(P, e) < 280).sort((a, b) => dist(P, a) - dist(P, b)).slice(0, 6); R.tg = L; sfx('warn', 0.7); }
    else if (k === 'kingrev') { R.dur = 1.2; let L = foes().filter(e => dist(P, e) < 270).sort((a, b) => dist(P, a) - dist(P, b)); R.tg = []; if (L.length) for (let i = 0; i < 6; i++) R.tg.push(L[i % L.length]);
      K.cyl = { t: 0, gone: [] }; sfx('reload', 1.2); FXK.ring(P.x, P.y - 8, '#ffd34d', 160, 0.3, 6); }
    return true;
  }

  // ---------------------------------------------------------------- 진행
  function update(dt) {
    const P = G.player, R = P.grs; if (!R) { P.state = 'idle'; return; }
    R.t += dt; const t = R.t, k = R.k;
    P.blade = R.a; P.face = Math.cos(R.a) > 0 ? 1 : -1;
    if (k === 'blunder') {
      if (t < 0.12) { P.blade = R.a - P.face * 0.25 * (t / 0.12); if (Math.random() < 0.5) { const m = muzzle(); G.parts.push({ x: m.x, y: m.y, vx: rand(-20, 20), vy: rand(-40, -10), t: 0.3, c: pick(['#e0b860', '#ffffff']), g: 0, glow: true }); } }
      else if (!R.did.f) { R.did.f = true; const m = flashM(3.2), a = R.a;
        for (const e of foes()) { const d = dist(P, e); if (d < 140 + e.r && coneIn(P, e, a, 1.05)) { damageEnemy(e, 1.7 * (1 - Math.min(d, 140) / 140 * 0.4), { ang: angTo(P, e), kb: big(e) ? 0 : 420, grogi: 12, heavy: true, stagger: 0.8, gauge: 5 }); applySt(e, 'stun', 0.8); sparks(e.x, e.y - 12, angTo(P, e), '#ffe0a0', 6); blast(e.x, e.y - 10, 12); } }
        for (let i = 0; i < 4; i++) slash(m.x + Math.cos(a) * (8 + i * 22), m.y + Math.sin(a) * (6 + i * 16), a, 14 + i * 12, 2.0, i % 2 ? '#e0b860' : '#ffe8a0', '#ffffff', 3 - (i > 1 ? 1 : 0), 0.22 + i * 0.05);
        for (let i = 0; i < 34; i++) { const b = a + rand(-1.0, 1.0), sp = rand(160, 380); G.parts.push({ x: m.x, y: m.y, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.8 - rand(0, 60), t: rand(0.25, 0.55), c: pick(['#b08038', '#e0b860', '#8d9097', '#c8c8c8', '#6a4818']), g: 260 }); }
        for (let i = 0; i < 9; i++) { const b = a + (i - 4) * 0.24; tracer(m.x, m.y, m.x + Math.cos(b) * rand(90, 140), m.y + Math.sin(b) * rand(70, 110), i % 2 ? '#ffe0a0' : '#ffffff', 1, 0.14); }
        blast(m.x + Math.cos(a) * 14, m.y + Math.sin(a) * 10, 22); FXK.ring(m.x, m.y, '#ffe0a0', 360, 0.3, 8); FXK.light(m.x, m.y, 160, 1, '255,210,140', 0.25); FXK.flash('#fff0c0', 0.06); FXK.punch(9, 0.035, 0.07, a + Math.PI);
        P.recoil = 3; P.x -= Math.cos(a) * 30; P.y -= Math.sin(a) * 22; solveObs(P, P.r); sfx('shotgun'); sfx('blast', 0.8); goldCasing(); }
    } else if (k === 'harpoon') {
      if (!R.did.f) { R.did.f = true; const m = flashM(2.2); (G.wproj = G.wproj || []).push({ k: 'grsHarp', x: m.x, y: m.y, a: R.a, d: 0, sp: 640, max: 1400, car: [], stuck: false, life: 3, ox: m.x, oy: m.y, pierced: new Set() });
        P.recoil = 2.2; FXK.punch(5, 0.015, 0.03, R.a + Math.PI); sfx('shot', 0.7); sfx('bolt', 0.8); tracer(m.x, m.y, m.x + Math.cos(R.a) * 40, m.y + Math.sin(R.a) * 30, '#ffffff', 2, 0.1); }
    } else if (k === 'duck') {
      if (!R.did.f && t > 0.06) { R.did.f = true; const m = flashM(1.8); for (let i = 0; i < 5; i++) { const a = R.a + (i - 2) * 0.32; (G.wproj = G.wproj || []).push({ k: 'grsDuck', x: m.x, y: m.y + 6, vx: Math.cos(a) * 150, vy: Math.sin(a) * 110, t: 0, life: 2.6 + i * 0.12, hop: rand(0, 1), face: Math.cos(a) > 0 ? 1 : -1 }); }
        P.recoil = 1.6; sfx('shot', 1.6); sfx('blip', 1.4); FXK.burst(m.x, m.y, ['#f0c838', '#ffffff', '#f08a2a'], 10, 160, 0, false, 0.3); }
    } else if (k === 'longrifle') {
      if (t < 0.55) { R.a = lerpAng(R.a, P.ang, dt * 6); P.blade = R.a; const q = t / 0.55; if (Math.random() < q) { const m = muzzle(); G.parts.push({ x: m.x + rand(-2, 2), y: m.y + rand(-2, 2), vx: 0, vy: -10, t: 0.2, c: '#ffd080', g: 0, glow: true }); } }
      else if (!R.did.f) { R.did.f = true; const m = flashM(3), a = R.a, L = 640; let ex = m.x + Math.cos(a) * L, ey = m.y + Math.sin(a) * L;
        K.beams.push({ x0: m.x, y0: m.y, x1: ex, y1: ey, t: 0.4, max: 0.4 });
        const hits = rayHit(m.x, m.y, a, L, 10); blast(m.x + Math.cos(a) * 12, m.y + Math.sin(a) * 8, 20); hits.forEach((o, i) => { if (i === 0) P.critNext = true; blast(o.e.x, o.e.y - 12, 22); damageEnemy(o.e, 3.2, { ang: a, kb: big(o.e) ? 0 : 160, grogi: 20, heavy: true, stagger: 0.6, gauge: 8 }); sparks(o.e.x, o.e.y - 12, a, '#ffffff', 10); FXK.ring(o.e.x, o.e.y - 10, '#ffe0a0', 200, 0.25, 4); G.parts.push(...Array.from({ length: 8 }, () => ({ x: o.e.x, y: o.e.y - 12, vx: Math.cos(a) * rand(80, 260) + rand(-40, 40), vy: Math.sin(a) * rand(80, 200) + rand(-80, 20), t: 0.4, c: pick(['#ffffff', '#ffe0a0', '#c03030']), g: 200 }))); });
        FXK.flash('#fff6e0', 0.08); FXK.punch(11, 0.04, 0.1, a + Math.PI); FXK.light(m.x, m.y, 180, 1, '255,230,180', 0.3); P.recoil = 3.5; P.x -= Math.cos(a) * 18; P.y -= Math.sin(a) * 14; solveObs(P, P.r); sfx('snipe'); sfx('blast', 1.2); goldCasing(); }
    } else if (k === 'revolver') {
      const n = Math.floor((t - 0.05) / 0.05);
      if (t >= 0.05 && n < 12 && n !== R.n) { R.n = n; const L = R.tg.filter(live), e = L.length ? L[n % L.length] : null, a = e ? angTo(P, e) + rand(-0.05, 0.05) : R.a + rand(-0.3, 0.3);
        P.blade = a; R.ba = a; const m = muzzle(), off = n % 2 ? 4 : -4, mx = m.x - Math.sin(a) * off, my = m.y + Math.cos(a) * off * 0.6;
        G.fx.push({ kind: 'muzzle', x: mx, y: my, ang: a, s: 1.3, t: 0.1, max: 0.1 });
        const h = rayHit(mx, my, a, 260, 6)[0], tx = h ? h.e.x : mx + Math.cos(a) * 240, ty = h ? h.e.y - 10 : my + Math.sin(a) * 180;
        tracer(mx, my, tx, ty, n % 2 ? '#ffe0a0' : '#ffffff', 1, 0.08);
        if (h) { blast(h.e.x + rand(-4, 4), h.e.y - 12 + rand(-4, 4), 9); damageEnemy(h.e, 0.38, { ang: a, kb: big(h.e) ? 0 : 50, grogi: 3, gauge: 1 }); sparks(h.e.x, h.e.y - 12, a, '#ffe0a0', 3); }
        P.recoil = 1.2; addShake(1.5, a + Math.PI); sfx('shot', 1.3 + (n % 3) * 0.1); if (n % 2) goldCasing(); FXK.light(mx, my, 50, 0.5, '255,210,140', 0.05);
        }
      if (t >= 0.66) { R.a = R.ba == null ? R.a : R.ba; P.blade = R.a + (t - 0.66) / 0.24 * TAU * 2 * P.face; if (!R.did.tw) { R.did.tw = true; sfx('reload', 1.4); FXK.ring(P.x, P.y - 8, '#ffe0a0', 120, 0.25, 6); } }
    } else if (k === 'cannon') {
      const up = Math.cos(R.a) >= 0 ? -1.1 : -Math.PI + 1.1, n = Math.floor(t / 0.24), ph = t - n * 0.24;
      P.blade = up + (Math.cos(R.a) >= 0 ? -1 : 1) * Math.max(0, 0.25 - ph) * 0.8; // 쏠 때마다 반동으로 들림
      if (n < 3 && n !== R.n) { R.n = n; const m = flashM(3.4, up); P.recoil = 3.2; FXK.punch(9, 0.03, 0.06, Math.PI / 2); FXK.flash('#fff0c0', 0.04); sfx('blast', 0.55); sfx('shotgun', 0.6);
        blast(m.x, m.y - 4, 20); FXK.ring(m.x, m.y, '#ffe0a0', 260, 0.25, 6); FXK.light(m.x, m.y, 150, 1, '255,200,120', 0.2); 
        for (let i = 0; i < 14; i++) G.parts.push({ x: m.x + rand(-4, 4), y: m.y, vx: rand(-50, 50), vy: rand(-160, -50), t: rand(0.6, 1.2), c: pick(['#5b5560', '#8d8496', '#3a3540', '#2a2228']), g: -20 });
        dust(P.x, P.y, 10); G.fx.push({ kind: 'streak', px: true, x0: m.x, y0: m.y, x1: m.x + Math.cos(up) * 90, y1: m.y - 120, t: 0.18, max: 0.18, c: '#ffe0a0' }); }
    } else if (k === 'puffer') {
      if (!R.did.f) { R.did.f = true; const m = flashM(2); (G.wproj = G.wproj || []).push({ k: 'grsPuff', x: m.x, y: P.y + 2, vx: Math.cos(R.a) * 170, vy: Math.sin(R.a) * 130, t: 0, life: 1.7, sz: 1, hitT: new Map(), roll: 0 });
        P.recoil = 2; sfx('shot', 0.8); FXK.burst(m.x, m.y, ['#f0d050', '#4a7a8a', '#ffffff'], 10, 160, 0, false, 0.3); }
    } else if (k === 'match') {
      R.a = lerpAng(R.a, P.ang, dt * 5); P.blade = R.a;
      if (t >= 0.1 && t < 1.15) { const m = muzzle(), a = R.a; if (!R.did.s) { R.did.s = true; sfx('fireball', 0.8); }
        for (let i = 0; i < 5; i++) { const b = a + rand(-0.26, 0.26), sp = rand(180, 300); G.parts.push({ x: m.x, y: m.y, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.8 - rand(0, 30), t: rand(0.3, 0.45), c: pick(['#ffe060', '#ffb030', '#ff6a20', '#ff3020', '#ffffff']), g: -60, glow: true }); }
        if (Math.random() < 0.5) G.parts.push({ x: m.x + Math.cos(a) * rand(40, 110), y: m.y + Math.sin(a) * rand(30, 80), vx: rand(-20, 20), vy: rand(-60, -30), t: rand(0.5, 0.9), c: pick(['#3a3540', '#5b5560']), g: -20 });
        FXK.light(m.x + Math.cos(a) * 50, m.y + Math.sin(a) * 36, 110, 0.35, '255,140,50', 0.03); P.recoil = 0.6 + Math.random() * 0.4; addShake(0.8, a + Math.PI);
        if ((R.tk = (R.tk || 0) - dt) <= 0) { R.tk = 0.1; for (const e of foes()) { const d = dist(m, e); if (d < 120 + e.r && coneIn(m, e, a, 0.4)) { damageEnemy(e, 0.26, { ang: a, kb: big(e) ? 0 : 40, grogi: 2, gauge: 1, dot: false }); addBurn(e, 3, 0.35); } } sfx('whoosh', 0.5 + rand(0, 0.2)); }
        if ((R.fb = (R.fb || 0) - dt) <= 0) { R.fb = 0.09; const d = rand(40, 115); blast(m.x + Math.cos(a) * d + rand(-8, 8), m.y + Math.sin(a) * d * 0.8 + rand(-6, 6), rand(10, 18)); }
        if ((R.fz = (R.fz || 0) - dt) <= 0) { R.fz = 0.16; const d = rand(50, 110); (G.pfire = G.pfire || []).push({ x: m.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d * 0.8 + 4, t: 2.2, tick: 0 }); } }
    } else if (k === 'undertaker') { const n = Math.floor((t - 0.04) / 0.07);
      if (t >= 0.04 && n < 6 && n !== R.n) { R.n = n; const L = R.tg.filter(live), tg = L.length ? L[n % L.length] : null, side = n % 2 ? 1 : -1, m = flashM(2.2), a0 = R.a + side * 0.5;
        (G.wproj = G.wproj || []).push({ k: 'grsSkull', ph: 'loop', x: m.x, y: m.y, x0: m.x, y0: m.y, a0, side, tg, t: 0, loop: 0.62 + n * 0.03, life: 2.6, hist: [], vx: 0, vy: 0 });
        P.recoil = 1.8; FXK.punch(3, 0.01, 0.02, R.a + Math.PI); blast(m.x, m.y, 10, PAL_G); sfx('shot', 0.8 + n * 0.06); FXK.light(m.x, m.y, 70, 0.6, '110,255,150', 0.1); }
    } else if (k === 'kingrev') {
      // 0~0.42 표식 · 0.45~ 여섯 발
      const L = R.tg; for (let i = 0; i < L.length; i++) { const e = L[i]; if (t > i * 0.06 && !R.did['m' + i]) { R.did['m' + i] = true; if (live(e)) { K.crowns.push({ e, t: 0, i, n: L.filter(x => x === e).length }); FXK.ring(e.x, e.y - 30, '#ffd34d', 100, 0.2, 3); sfx('blip', 1.4 + i * 0.1); } } }
      const n = Math.floor((t - 0.45) / 0.1);
      if (t >= 0.45 && n < L.length && n !== R.n) { R.n = n; const e = L[n], last = n === L.length - 1;
        if (live(e)) { const a = angTo(P, e); R.a = a; P.blade = a; const m = flashM(last ? 2.8 : 1.8, a), c = K.cyl, oa = n / 6 * TAU + (c ? c.t * 7 : 0), ox = P.x + Math.cos(oa) * 22, oy = P.y - 10 + Math.sin(oa) * 12;
          if (c) c.gone.push(n); (G.wproj = G.wproj || []).push({ k: 'grsKing', x: ox, y: oy, tg: e, last, n, t: 0, hist: [], a: Math.atan2(e.y - 12 - oy, e.x - ox) }); blast(m.x, m.y, 10, PAL_Y);
          const ci = K.crowns.findIndex(c => c.e === e); if (ci >= 0) K.crowns.splice(ci, 1);
          P.recoil = last ? 3 : 1.6; FXK.punch(last ? 6 : 3, last ? 0.02 : 0.01, 0.02, a + Math.PI); sfx('shot', 0.9 + n * 0.05); goldCasing(); } }
    }
    if (t >= R.dur) end(P);
  }
  function end(P) { P.state = 'idle'; P.grs = null; P.t = 0; }

  // ---------------------------------------------------------------- 날아가는 것들
  function tick(dt) {
    if (K.g !== G) { K.g = G; K.tr = []; K.marks = []; K.beams = []; K.crowns = []; K.coffins = []; K.cyl = null; K.blasts = []; K.scorch = []; }
    const P = G.player; if (!P) return;
    for (const s of K.tr) s.t -= dt; K.tr = K.tr.filter(s => s.t > 0);
    for (const b of K.blasts) b.t += dt; K.blasts = K.blasts.filter(b => b.t < b.max);
    for (const c of K.scorch) c.t -= dt; K.scorch = K.scorch.filter(c => c.t > 0);
    for (const s of K.beams) s.t -= dt; K.beams = K.beams.filter(s => s.t > 0);
    for (const c of K.crowns) c.t += dt; K.crowns = K.crowns.filter(c => live(c.e) && c.t < 2);
    if (K.cyl) { K.cyl.t += dt; if (K.cyl.t > 1.3 || K.cyl.gone.length >= 6) K.cyl = null; }
    // 포탄 낙하
    for (const M of K.marks) { M.t += dt; if (M.t >= M.land && !M.done) { M.done = true; blast(M.x, M.y - 10, 50, PAL_F, true); boom(M.x, M.y, M.r, 1.6, ['#ffb050', '#fff0c0', '#8a5a30', '#ffffff'], '255,170,80', null);
        FXK.ring(M.x, M.y, '#ffffff', 520, 0.35, 12); FXK.debris(M.x, M.y, 16); FXK.debris(M.x, M.y, 10, ['#ff8a30', '#ffd060', '#5a4a48']); FXK.flash('#fff0c0', 0.07); FXK.punch(12, 0.045, 0.09); 
        (G.pfire = G.pfire || []).push({ x: M.x, y: M.y, t: 2.5, tick: 0 }); for (let i = 0; i < 3; i++) (G.pfire = G.pfire || []).push({ x: M.x + rand(-26, 26), y: M.y + rand(-12, 12), t: 1.8, tick: 0 });
        sfx('blast', 0.6); sfx('heavy', 0.7); sfx('crunch', 0.5); } }
    K.marks = K.marks.filter(M => !M.done || M.t < M.land + 0.05);
    // 관
    for (const C of K.coffins) { C.t += dt;
      if (C.t >= C.land && !C.hit) { C.hit = true; for (const e of foes()) if (Math.hypot(e.x - C.x, (e.y - C.y) / 0.7) < 46 + e.r) { damageEnemy(e, 2.0, { ang: angTo(C, e), kb: big(e) ? 0 : 240, grogi: 16, heavy: true, gauge: 6 }); applySt(e, 'stun', 0.8); }
        FXK.ring(C.x, C.y, '#7aff9a', 280, 0.35, 10); FXK.debris(C.x, C.y, 12); FXK.burst(C.x, C.y - 10, ['#7aff9a', '#30c060', '#d8d0b8'], 12, 220, 0, true, 0.35); FXK.light(C.x, C.y, 150, 0.9, '110,255,150', 0.3); FXK.punch(9, 0.035, 0.08); dust(C.x, C.y, 14); sfx('heavy', 0.7); sfx('crunch', 0.5); }
      if (C.t >= C.land + 0.45 && !C.open) { C.open = true; sfx('awaken', 1.4); FXK.ring(C.x, C.y - 14, '#7aff9a', 160, 0.3, 4); 
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.5; (G.wproj = G.wproj || []).push({ k: 'grsSkull', x: C.x, y: C.y - 18, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, t: 0, life: 2.4, tg: null, hist: [] }); } } }
    K.coffins = K.coffins.filter(C => C.t < C.life);
    tickProj(dt);
  }
  function tickProj(dt) {
    if (!G.wproj || !G.wproj.length) return; const P = G.player;
    for (const w of G.wproj) {
      if (w.k === 'grsHarp') { w.life -= dt; if (w.life <= 0) { w.dead = true; continue; }
        if (!w.stuck) { const st = w.sp * dt, nx = w.x + Math.cos(w.a) * st, ny = w.y + Math.sin(w.a) * st * 0.8; w.d += st;
          if (wallAt(w.x, w.y + 10, nx, ny + 10) || w.d >= w.max) { w.stuck = true; w.life = 1.2; impactHarp(w, true); continue; }
          w.x = nx; w.y = ny; if (Math.random() < 0.7) G.parts.push({ x: w.x, y: w.y, vx: 0, vy: 0, t: 0.25, c: '#d8d0b8', g: 0 });
          for (const e of foes()) { if (w.car.includes(e) || Math.hypot(e.x - w.x, e.y - 10 - w.y) > 10 + e.r) continue;
            if (e.type === 'boss') { if (w.pierced.has(e)) continue; w.pierced.add(e); damageEnemy(e, 2.0, { ang: w.a, kb: 0, grogi: 18, heavy: true, gauge: 6 }); blast(e.x, e.y - 12, 16, PAL_Y); sparks(e.x, e.y - 12, w.a, '#ffffff', 10); continue; }
            w.car.push(e); damageEnemy(e, 0.6, { ang: w.a, kb: 0, grogi: 6, gauge: 2 }); sparks(e.x, e.y - 10, w.a, '#ffffff', 6); sfx('crunch', 1.3); addShake(2, w.a); }
          w.car.forEach((e, i) => { if (!live(e)) return; e.x = w.x - Math.cos(w.a) * (8 + i * 10); e.y = w.y + 10 - Math.sin(w.a) * (8 + i * 10) * 0.8; e.vx = e.vy = 0; if (e.st) e.st.stunT = Math.max(e.st.stunT || 0, 0.2); else e.st = { stunT: 0.2 }; }); } }
      else if (w.k === 'grsDuck') { w.t += dt; w.hop += dt * 3.2; let tg = null, bd = 1e9; for (const e of foes()) { const d = Math.hypot(e.x - w.x, e.y - w.y); if (d < bd && d < 220) { bd = d; tg = e; } }
        if (tg && w.t > 0.15) { const a = Math.atan2(tg.y - w.y, tg.x - w.x); w.vx += (Math.cos(a) * 130 - w.vx) * Math.min(1, dt * 4); w.vy += (Math.sin(a) * 100 - w.vy) * Math.min(1, dt * 4); }
        const ox = w.x, oy = w.y; w.x += w.vx * dt; w.y += w.vy * dt; if (wallAt(ox, oy, w.x, w.y)) { w.x = ox; w.y = oy; w.vx *= -1; w.vy *= -1; } if (Math.abs(w.vx) > 5) w.face = w.vx > 0 ? 1 : -1;
        if (w.hop % 1 < dt * 3.2) { dust(w.x, w.y, 1); if (Math.random() < 0.3) sfx('blip', 1.8 + rand(0, 0.4)); }
        if ((tg && bd < 12 + tg.r) || w.t >= w.life) { w.dead = true; blast(w.x, w.y - 6, 24); boom(w.x, w.y, 38, 0.9, ['#f0c838', '#ffffff', '#f08a2a'], '255,220,90', null); FXK.punch(3, 0.01, 0.02); sfx('blast', 1.3); for (let i = 0; i < 6; i++) G.parts.push({ x: w.x, y: w.y - 6, vx: rand(-140, 140), vy: rand(-200, -80), t: 0.6, c: pick(['#f0c838', '#c09018']), g: 500 }); } }
      else if (w.k === 'grsPuff') { w.t += dt; w.sz = 1 + Math.min(1, w.t / 1.4) * 1.3; w.roll += dt * 10; const R0 = 8 * w.sz;
        const ox = w.x, oy = w.y; w.x += w.vx * dt; w.y += w.vy * dt;
        if (w.x < A.x0 + R0 || w.x > A.x1 - R0 || segSolid(ox, oy, w.x, oy, R0 * 0.6)) { w.x = ox; w.vx *= -1; sfx('blip', 0.8); dust(w.x, w.y, 4); addShake(2, 0); }
        if (w.y < A.y0 + R0 || w.y > A.y1 - 4 || segSolid(w.x, oy, w.x, w.y, R0 * 0.6)) { w.y = oy; w.vy *= -1; sfx('blip', 0.8); dust(w.x, w.y, 4); addShake(2, 0); }
        for (const [e, c] of w.hitT) { if (c - dt <= 0) w.hitT.delete(e); else w.hitT.set(e, c - dt); }
        for (const e of foes()) if (!w.hitT.has(e) && Math.hypot(e.x - w.x, (e.y - w.y) / 0.8) < R0 + e.r) { w.hitT.set(e, 0.3); damageEnemy(e, 0.45, { ang: angTo(w, e), kb: big(e) ? 0 : 200, grogi: 5, gauge: 2 }); sparks(e.x, e.y - 10, angTo(w, e), '#f0d050', 4); sfx('hit', 1.0); }
        if (w.t >= w.life) { w.dead = true; blast(w.x, w.y - 8, 36, PAL_Y, true); FXK.flash('#fff6d0', 0.05); boom(w.x, w.y, 48, 1.0, ['#f0d050', '#ffffff', '#4a7a8a'], '255,230,120', null); FXK.punch(7, 0.03, 0.05); sfx('blast', 1.0);
          for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; G.wproj.push({ k: 'grsSpike', x: w.x, y: w.y - 8, a, t: 0, life: 0.45, hit: new Set() }); } } }
      else if (w.k === 'grsSpike') { w.t += dt; w.x += Math.cos(w.a) * 340 * dt; w.y += Math.sin(w.a) * 260 * dt; if (w.t >= w.life || wallAt(w.x, w.y + 8, w.x, w.y + 8)) { w.dead = true; continue; }
        for (const e of foes()) if (!w.hit.has(e) && Math.hypot(e.x - w.x, e.y - 10 - w.y) < 6 + e.r) { w.hit.add(e); damageEnemy(e, 0.45, { ang: w.a, kb: 60, grogi: 3, gauge: 1 }); } }
      else if (w.k === 'grsKing') { w.t += dt; if (live(w.tg)) { const a = Math.atan2(w.tg.y - 12 - w.y, w.tg.x - w.x); w.a = a; } const sp = 300 + w.t * 1600; w.x += Math.cos(w.a) * sp * dt; w.y += Math.sin(w.a) * sp * dt; w.hist.push({ x: w.x, y: w.y, t: 0.16 }); for (const q of w.hist) q.t -= dt; w.hist = w.hist.filter(q => q.t > 0);
        if (Math.random() < 0.7) G.parts.push({ x: w.x, y: w.y, vx: rand(-20, 20), vy: rand(-20, 20), t: 0.25, c: pick(['#fff2b0', '#ffd34d']), g: 0, glow: true }); FXK.light(w.x, w.y, 40, 0.2, '255,210,90', 0.03);
        const e = w.tg, hitE = live(e) && Math.hypot(e.x - w.x, e.y - 12 - w.y) < 8 + e.r;
        if (hitE || w.t > 0.8 || !live(e)) { w.dead = true; if (hitE) { P.critNext = true; damageEnemy(e, w.last ? 1.4 : 0.9, { ang: w.a, kb: big(e) ? 0 : 100, grogi: 8, heavy: w.last, gauge: 3 }); pop(e.x, e.y - 34, ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ'][w.n], '#ffe080', w.last ? 3 : 2); }
          blast(w.x, w.y, w.last ? 54 : 16, PAL_Y, w.last); FXK.ring(w.x, w.y, '#ffd34d', w.last ? 420 : 180, 0.25, 4); sparks(w.x, w.y, w.a, '#ffd34d', 6); sfx('blast', w.last ? 0.7 : 1.5);
          if (w.last) { boom(w.x, w.y + 12, 58, 1.6, ['#ffd34d', '#fff2b0', '#c9952a', '#ffffff'], '255,210,90', null); FXK.flash('#fff2b0', 0.09); FXK.punch(12, 0.045, 0.1); FXK.rays(w.x, w.y, 16, 90, '#fff2b0', 0.25); sfx('heavy', 0.8); sfx('perfect'); } else FXK.punch(4, 0.012, 0.02); } }
      else if (w.k === 'grsSkull') { w.t += dt; if (!live(w.tg)) { let bd = 1e9; w.tg = null; for (const e of foes()) { const d = Math.hypot(e.x - w.x, e.y - w.y); if (d < bd) { bd = d; w.tg = e; } } }
        const ox = w.x, oy = w.y;
        if (w.ph === 'loop') { const q = Math.min(1, w.t / w.loop), T = w.tg, fa = T ? Math.atan2(T.y - P.y, T.x - P.x) : w.a0, tx = T ? T.x : w.x0 + Math.cos(w.a0) * 160, ty = (T ? T.y : w.y0 + Math.sin(w.a0) * 120) - 12;
          const bx = tx + Math.cos(fa) * ((T ? T.r : 8) + 34), by = ty + Math.sin(fa) * ((T ? T.r : 8) + 34) * 0.8, px = -Math.sin(fa) * w.side, py = Math.cos(fa) * w.side;
          const c1x = w.x0 + Math.cos(w.a0 + w.side * 1.1) * 120, c1y = w.y0 + Math.sin(w.a0 + w.side * 1.1) * 90, c2x = bx + px * 110 + Math.cos(fa) * 60, c2y = by + py * 80 + Math.sin(fa) * 40, u = 1 - q;
          w.x = u * u * u * w.x0 + 3 * u * u * q * c1x + 3 * u * q * q * c2x + q * q * q * bx; w.y = u * u * u * w.y0 + 3 * u * u * q * c1y + 3 * u * q * q * c2y + q * q * q * by;
          if (q >= 1) { w.ph = 'strike'; const a = T ? Math.atan2(ty - w.y, tx - w.x) : fa + Math.PI; w.vx = Math.cos(a) * 520; w.vy = Math.sin(a) * 520; w.t2 = 0; FXK.ring(w.x, w.y, '#7aff9a', 100, 0.15, 3); sfx('whoosh', 1.5); } }
        else { w.t2 += dt; if (live(w.tg)) { const a = Math.atan2(w.tg.y - 12 - w.y, w.tg.x - w.x); w.vx += (Math.cos(a) * 520 - w.vx) * Math.min(1, dt * 10); w.vy += (Math.sin(a) * 520 - w.vy) * Math.min(1, dt * 10); } w.x += w.vx * dt; w.y += w.vy * dt; }
        w.ang = Math.atan2(w.y - oy, w.x - ox); w.hist.push({ x: w.x, y: w.y, t: 0.3 }); for (const q of w.hist) q.t -= dt; w.hist = w.hist.filter(q => q.t > 0);
        if (Math.random() < 0.6) G.parts.push({ x: w.x, y: w.y, vx: rand(-15, 15), vy: rand(-30, -10), t: 0.35, c: pick(['#7aff9a', '#30c060', '#d8ffe0']), g: 0, glow: true });
        FXK.light(w.x, w.y, 44, 0.18, '110,255,150', 0.03);
        const hitE = w.ph === 'strike' && w.tg && Math.hypot(w.tg.x - w.x, w.tg.y - 12 - w.y) < 8 + w.tg.r;
        if (hitE || w.t >= w.life || (w.ph === 'strike' && w.t2 > 0.6)) { w.dead = true;
          if (hitE) { P.critNext = true; damageEnemy(w.tg, 1.15, { ang: Math.atan2(w.vy, w.vx), kb: big(w.tg) ? 0 : 160, grogi: 10, heavy: true, gauge: 4, stagger: 0.4 }); 
            for (const o of foes()) if (o !== w.tg && Math.hypot(o.x - w.x, o.y - 12 - w.y) < 30 + o.r) damageEnemy(o, 0.5, { ang: angTo(w, o), kb: 80, grogi: 4, gauge: 1 }); }
          blast(w.x, w.y, 20, PAL_G); FXK.ring(w.x, w.y, '#7aff9a', 220, 0.25, 5); FXK.burst(w.x, w.y, ['#7aff9a', '#ffffff', '#30c060'], 10, 200, 0, true, 0.3); FXK.punch(4, 0.012, 0.03); sfx('blast', 1.3); sfx('hit', 0.7); } }
    }
    G.wproj = G.wproj.filter(w => !w.dead);
  }
  function impactHarp(w, wall, bigE) {
    const n = w.car.filter(live).length;
    for (const e of w.car) if (live(e)) { damageEnemy(e, wall ? 1.6 : 0.9, { ang: w.a, kb: 0, grogi: 14, heavy: true, gauge: 5 }); applySt(e, 'stun', wall ? 1.5 : 0.7); }
    blast(w.x, w.y + 6, 20 + n * 6, PAL_Y, true); FXK.flash('#fff6e0', 0.05); FXK.ring(w.x, w.y + 6, '#ffffff', 300, 0.3, 8); FXK.burst(w.x, w.y, ['#ffffff', '#d8d0b8', '#8a8e98'], 14, 240, 0, false, 0.35); FXK.debris(w.x, w.y + 10, wall ? 10 : 5); FXK.rays(w.x, w.y, 8, 50, '#e8e0d0', 0.18);
    FXK.punch(wall ? 9 : 5, wall ? 0.035 : 0.015, wall ? 0.08 : 0.03, w.a); FXK.light(w.x, w.y, 120, 0.8, '230,230,240', 0.25); sfx('crunch', 0.7); sfx('heavy', 1.2);
    (n > 1 && pop(w.x, w.y - 30, n + '마리 꽂기!', '#ffffff', 4)); dust(w.x, w.y + 10, 8);
  }

  // ---------------------------------------------------------------- 그리기 (2px 칸)
  function drawGround() {
    for (const c of K.scorch) { const al = Math.min(1, c.t / 1); ctx.globalAlpha = al * 0.8; for (let yy = -c.r; yy <= c.r; yy += 2) for (let xx = -c.r; xx <= c.r; xx += 2) { const e = Math.hypot(xx, yy * 2) / c.r; if (e > 1) continue; const h = Math.sin((xx * 12.9898 + yy * 78.233 + c.seed) * 43758.5) * 0.5 + 0.5; if (h < e * 0.9) continue; dot(c.x + xx, c.y + yy, e < 0.4 ? '#0e0a0c' : '#1e1618'); } ctx.globalAlpha = 1; }
    for (const M of K.marks) { if (M.done) continue; const q = Math.min(1, M.t / M.land), r = M.r * (1.25 - 0.25 * q), n = Math.ceil(r * 1.4), bl = q > 0.7 && Math.floor(M.t * 20) % 2;
      for (let i = 0; i < n; i++) { if (i % 2) continue; const a = i / n * TAU + M.t; dot(M.x + Math.cos(a) * r, M.y + Math.sin(a) * r * 0.55, bl ? '#ffffff' : '#ff8a40'); }
      const ir = r * q; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; dot(M.x + Math.cos(a) * ir, M.y + Math.sin(a) * ir * 0.55, '#c04020'); }
      pxLine(M.x - 4, M.y, M.x + 4, M.y, '#ff8a40'); pxLine(M.x, M.y - 3, M.x, M.y + 3, '#ff8a40'); }
    for (const C of K.coffins) { if (C.t >= C.land) continue; const q = C.t / C.land, w = 6 + q * 12; dshEll(ctx, C.x, C.y, w, 3, 0.5); } /* v3.23 디더 그림자 */
  }
  function drawCoffin(C) { const q = Math.min(1, C.t / C.land), y = C.y - (1 - q * q) * 260, x = snap2(C.x), Y = snap2(y), al = Math.min(1, (C.life - C.t) / 0.4);
    ctx.globalAlpha = al; const sink = C.t > C.life - 0.6 ? Math.round((C.t - (C.life - 0.6)) / 0.6 * 10) * 2 : 0;
    // 관: 위가 넓고 아래가 좁은 육각 (세로 28px)
    const rows = [6, 8, 10, 10, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5]; rows.forEach((hw, i) => { if (i * 2 >= 28 - sink) return; ctx.fillStyle = i === 0 || i === 13 ? '#d8d0b8' : '#0b0a0e'; ctx.fillRect(x - hw - 2, Y - 28 + i * 2 + sink, hw * 2 + 4, 2); ctx.fillStyle = i === 0 ? '#d8d0b8' : i % 4 === 1 ? '#6a4a30' : '#8a6440'; if (i) { ctx.fillRect(x - hw, Y - 28 + i * 2 + sink, hw * 2, 2); ctx.fillStyle = '#a87a4c'; ctx.fillRect(x - hw, Y - 28 + i * 2 + sink, 2, 2); } ctx.fillRect(x - hw, Y - 28 + i * 2 + sink, hw * 2, 2); });
    FXK.light(C.x, y - 14, 60, 0.2, '110,255,150', 0.02); if (!C.open) { ctx.fillStyle = '#e8e8f0'; ctx.fillRect(x - 1, Y - 24 + sink, 2, 12); ctx.fillRect(x - 4, Y - 20 + sink, 8, 2); }
    else { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(x - 6, Y - 24 + sink, 12, 18); ctx.fillStyle = '#7aff9a'; if (Math.floor(C.t * 10) % 2) ctx.fillRect(x - 2, Y - 18 + sink, 4, 2); }
    ctx.globalAlpha = 1; }
  // 금탄 한 발 (2px 칸): 뒤 테 · 놋쇠 몸통(위 밝음 · 아래 어둠) · 은빛 탄두
  function drawRound(x, y, a, sc, dim) { const ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux, L = sc > 0.8 ? 5 : 4;
    for (let i = -L; i <= L; i++) { const cx = x + ux * i * 2, cy = y + uy * i * 2, tip = i >= L - 1, rim = i === -L;
      if (!tip) { dot(cx + px * 2, cy + py * 2, rim ? '#5a4218' : dim ? '#8a6420' : '#fff2b0'); dot(cx - px * 2, cy - py * 2, rim ? '#5a4218' : dim ? '#5a4218' : '#a87a20'); }
      dot(cx, cy, tip ? (i === L ? '#ffffff' : '#e8e8f0') : rim ? '#8a6420' : dim ? '#a87a20' : '#ffd34d'); } }
  // v3.22 폭발끼리 겹치는 칸은 바둑판 디더: 이번 프레임에 이미 다른 폭발이 칠한 칸이면 한 칸 건너 하나만 칠해 뒤 폭발이 비쳐 보이게
  const bdot = (x, y, id, c) => SKD.pd(x, y, id, c); // v3.22 겹침 디더 (41_krs.js SKD.pd 공용)
  function drawBlast(b) { const p = b.t / b.max, s = b.s, R = s * (0.35 + 0.65 * (1 - (1 - p) * (1 - p))), cy = b.y - p * s * 0.3, pal = b.pal, ci = p < 0.1 ? 0 : p < 0.25 ? 1 : p < 0.45 ? 2 : p < 0.65 ? 3 : p < 0.85 ? 4 : 5;
    for (let yy = -R; yy <= R; yy += 2) { const w = Math.sqrt(Math.max(0, R * R - yy * yy)); for (let xx = -w; xx <= w; xx += 2) { const h = Math.sin((xx * 12.9898 + yy * 78.233 + b.seed) * 43758.5) * 0.5 + 0.5, edge = Math.hypot(xx, yy) / R;
      if (p > 0.45 && h < (p - 0.45) * 2.2) continue; bdot(b.x + xx, cy + yy * b.ry, b.seed, pal[edge < 0.55 - p * 0.4 && ci > 0 && ci < 4 ? ci - 1 : ci]); } }
    if (p < 0.5) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + b.seed, r = R + 2 + (i % 3) * 2; bdot(b.x + Math.cos(a) * r, cy + Math.sin(a) * r * b.ry, b.seed, pal[1]); } }
  let SEL = null;
  function drawOver() {
    const P = G.player;
    for (const b of K.blasts) if (b === SEL) drawBlast(b);
    ctx.globalCompositeOperation = 'lighter';
    for (const s of K.tr) { if (s !== SEL) continue; const p = 1 - s.t / s.max; for (let j = 0; j < s.w; j++) pxLine(s.x0 + (s.x1 - s.x0) * p * 0.5, s.y0 + (s.y1 - s.y0) * p * 0.5 + j * 2, s.x1, s.y1 + j * 2, j ? '#c08a40' : s.c); }
    for (const b of K.beams) { if (b !== SEL) continue; const p = 1 - b.t / b.max, w = Math.max(1, Math.round(4 * (1 - p))); for (let j = -w; j <= w; j++) pxLine(b.x0, b.y0 + j * 2, b.x1, b.y1 + j * 2, Math.abs(j) < w - 1 || w === 1 ? '#ffffff' : '#ffd080'); }
    ctx.globalCompositeOperation = 'source-over';
    // 저격 조준선
    if (SEL === 'aim' && P.state === 'grs' && P.grs && P.grs.k === 'longrifle' && P.grs.t < 0.55) { const m = muzzle(), a = P.grs.a, q = P.grs.t / 0.55, n = 90; for (let i = 0; i < n; i++) { if ((i + Math.floor(P.grs.t * 30)) % 3 === 0 && q < 0.8) continue; dot(m.x + Math.cos(a) * i * 6, m.y + Math.sin(a) * i * 6, q > 0.75 && Math.floor(P.grs.t * 24) % 2 ? '#ffffff' : '#ff3020'); } }
    // 작살 줄 · 작살
    for (const w of (G.wproj || [])) { if (w !== SEL) continue;
      if (w.k === 'grsHarp') { const h = w.stuck ? { x: w.ox, y: w.oy } : muzzle(), L = Math.hypot(w.x - h.x, w.y - h.y), n = Math.max(1, Math.floor(L / 3)); ctx.globalAlpha = Math.min(1, w.life / 0.3);
        for (let i = 0; i <= n; i++) { const u = i / n, sag = w.stuck ? Math.sin(u * Math.PI) * 6 : 0; dot(lerp(h.x, w.x, u), lerp(h.y, w.y, u) + sag, i % 3 ? '#d8d0b8' : '#8a7a5a'); }
        const ux = Math.cos(w.a), uy = Math.sin(w.a); pxLine(w.x - ux * 14, w.y - uy * 10, w.x, w.y, '#6b4a2a'); for (const s of [-1, 1]) pxLine(w.x + ux * 6, w.y + uy * 5, w.x - ux * 2 - uy * 5 * s, w.y - uy * 2 + ux * 4 * s, '#d8dce4'); dot(w.x + ux * 6, w.y + uy * 5, '#ffffff');
        ctx.globalAlpha = 1; }
      else if (w.k === 'grsDuck') { const hy = Math.abs(Math.sin(w.hop * Math.PI)) * 10, x = snap2(w.x), y = snap2(w.y - hy), f = w.face;
        dshEll(ctx, x, w.y + 1, 5, 2, 0.5); /* v3.23 디더 그림자 */
        ctx.fillStyle = '#1a120a'; ctx.fillRect(x - 6, y - 8, 12, 8); ctx.fillStyle = '#f0c838'; ctx.fillRect(x - 5, y - 6, 9, 5); ctx.fillStyle = '#c09018'; ctx.fillRect(x - 5, y - 2, 9, 1);
        ctx.fillStyle = '#f0c838'; ctx.fillRect(x + f * 2 - 2, y - 11, 5, 5); ctx.fillStyle = '#1a120a'; ctx.fillRect(x + f * 3, y - 10, 1, 1); ctx.fillStyle = '#f08a2a'; ctx.fillRect(x + (f > 0 ? 5 : -7), y - 9, 2, 2); }
      else if (w.k === 'grsPuff') { const r = Math.round(8 * w.sz / 2) * 2, x = snap2(w.x), y = snap2(w.y - r), fl = w.t > w.life - 0.3 && Math.floor(w.t * 20) % 2;
        dshEll(ctx, x, w.y + 1, r, 3, 0.5); /* v3.23 디더 그림자 */
        for (let yy = -r; yy < r; yy += 2) { const hw = Math.round(Math.sqrt(r * r - (yy + 1) * (yy + 1)) / 2) * 2; ctx.fillStyle = '#2a2010'; ctx.fillRect(x - hw - 2, y + yy, hw * 2 + 4, 2); ctx.fillStyle = fl ? '#ffffff' : yy > r * 0.3 ? '#fff0b0' : '#f0d050'; ctx.fillRect(x - hw, y + yy, hw * 2, 2); }
        const n = 12; for (let i = 0; i < n; i++) { const a = i / n * TAU + w.roll * 0.3; dot(x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3), '#c0a020'); }
        ctx.fillStyle = '#1a120a'; ctx.fillRect(x + (w.vx > 0 ? 2 : -4), y - 4, 2, 2); ctx.fillRect(x + (w.vx > 0 ? 6 : -8), y - 4, 2, 2); ctx.fillStyle = '#c03030'; ctx.fillRect(x + (w.vx > 0 ? 4 : -6), y + 2, 2, 2); }
      else if (w.k === 'grsSpike') { const ux = Math.cos(w.a), uy = Math.sin(w.a); pxLine(w.x - ux * 6, w.y - uy * 5, w.x, w.y, '#f0d050'); dot(w.x, w.y, '#ffffff'); }
      else if (w.k === 'grsKing') { for (const q of w.hist) { ctx.globalAlpha = q.t / 0.16; dot(q.x, q.y, '#ffd34d', 4); } ctx.globalAlpha = 1; drawRound(w.x, w.y, w.a, 1, false); }
      else if (w.k === 'grsSkull') { for (const q of w.hist) { const k = q.t / 0.3; ctx.globalAlpha = k * 0.9; dot(q.x - 1, q.y - 1, k > 0.6 ? '#d8ffe0' : k > 0.3 ? '#7aff9a' : '#30c060', k > 0.5 ? 4 : 2); } ctx.globalAlpha = 1; const x = snap2(w.x), y = snap2(w.y), f = Math.cos(w.ang || 0) >= 0 ? 1 : -1;
        ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 5, y - 5, 10, 10); ctx.fillStyle = '#e8e8ec'; ctx.fillRect(x - 4, y - 4, 8, 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4, y - 4, 4, 2);
        ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 3 + (f > 0 ? 1 : 0), y - 2, 2, 2); ctx.fillRect(x + 1 + (f > 0 ? 1 : 0), y - 2, 2, 2); ctx.fillStyle = '#7aff9a'; ctx.fillRect(x - 3 + (f > 0 ? 1 : 0), y - 2, 1, 1); ctx.fillRect(x + 1 + (f > 0 ? 1 : 0), y - 2, 1, 1);
        ctx.fillStyle = '#a8a8b0'; ctx.fillRect(x - 3, y + 2, 6, 2); ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 1, y + 2, 1, 2); ctx.fillRect(x + 1, y + 2, 1, 2); }
    }
    // 포탄 떨어짐
    for (const M of K.marks) { if (M !== SEL || M.done || M.t < M.land - 0.22) continue; const q = (M.t - (M.land - 0.22)) / 0.22, y = M.y - 10 - (1 - q) * 260, X = snap2(M.x), Y = snap2(y);
      for (let j = 0; j < 8; j++) dot(M.x + rand(-3, 3), y - 10 - j * 5, j < 3 ? '#ffe0a0' : j < 6 ? '#ff8a30' : '#5a4a48');
      ctx.fillStyle = '#0b0a0e'; ctx.fillRect(X - 7, Y - 5, 14, 10); ctx.fillRect(X - 5, Y - 7, 10, 14); ctx.fillStyle = '#3a3e48'; ctx.fillRect(X - 5, Y - 5, 10, 10); ctx.fillStyle = '#6a7080'; ctx.fillRect(X - 5, Y - 5, 4, 4); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(X - 3, Y - 3, 2, 2);
      ctx.fillStyle = '#ff7a30'; ctx.fillRect(X - 1, Y - 9, 2, 2); }
    for (const C of K.coffins) if (C === SEL) drawCoffin(C);
    // 왕관 표식
    for (const c of K.crowns) { if (c !== SEL) continue; const e = c.e, x = snap2(e.x), y = snap2(e.y - (e.tall || 30) - 12 - Math.round(Math.sin(c.t * 8))) , s = Math.min(1, c.t / 0.12);
      if (s < 1) { FXK.light(e.x, e.y - 30, 30, 0.3, '255,210,90', 0.02); }
      ctx.fillStyle = '#5a4218'; ctx.fillRect(x - 6, y - 2, 12, 6); ctx.fillStyle = '#ffd34d'; ctx.fillRect(x - 5, y, 10, 3); for (const dx of [-5, -1, 3]) ctx.fillRect(x + dx, y - 4, 2, 4); ctx.fillStyle = '#c03030'; ctx.fillRect(x - 1, y + 1, 2, 1);
      const n = 14; for (let i = 0; i < n; i++) { if ((i + Math.floor(c.t * 16)) % 3 === 0) continue; const a = i / n * TAU; dot(e.x + Math.cos(a) * (e.r + 8), e.y - 10 + Math.sin(a) * (e.r + 8) * 0.6, '#ffd34d'); } }
    // 실린더
    if (SEL === K.cyl && K.cyl && P.state === 'grs') { const c = K.cyl, sp = c.t * 7, ap = Math.min(1, c.t / 0.2), cx = P.x, cy = P.y - 10;
      const RS = []; for (let i = 0; i < 6; i++) { if (c.gone.includes(i)) continue; const a = i / 6 * TAU + sp, r = 22 * ap, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.55; RS.push({ x, y, a, z: Math.sin(a) }); }
      RS.sort((p, q) => p.z - q.z);
      const n = 28; for (let i = 0; i < n; i++) { if ((i + Math.floor(c.t * 30)) % 4 === 0) continue; const a = i / n * TAU - sp * 0.5; dot(cx + Math.cos(a) * 22 * ap, cy + Math.sin(a) * 12 * ap, i % 7 === 0 ? '#ffffff' : '#c9952a'); }
      for (const r of RS) { drawRound(r.x, r.y, Math.atan2(Math.sin(r.a) * 0.55, Math.cos(r.a)), 1, r.z < 0); if (r.z > 0.7 && Math.random() < 0.15) G.parts.push({ x: r.x, y: r.y, vx: 0, vy: -20, t: 0.25, c: '#ffffff', g: 0, glow: true }); }
      FXK.light(cx, cy, 70, 0.15, '255,210,90', 0.03); }
  }

  const _dgg = drawGearGround, gd = SKD.ground(drawGround); drawGearGround = function () { _dgg(); ctx.save(); gd(); ctx.restore(); };
  SKD.add(ents => { if (!G) return; const P = G.player, one = it => SKD.one(drawOver, v => SEL = v, it);
    for (const b of K.blasts) ents.push({ y: b.y + 12, d: one(b) });
    for (const s of K.tr) ents.push({ y: Math.max(s.y0, s.y1) + 12, d: one(s) });
    for (const b of K.beams) ents.push({ y: b.y0 + 12, d: one(b) });
    if (P && P.state === 'grs' && P.grs && P.grs.k === 'longrifle') ents.push({ y: P.y + 1, d: one('aim') });
    for (const w of (G.wproj || [])) if (/^grs/.test(w.k)) ents.push({ y: w.k === 'grsDuck' || w.k === 'grsPuff' ? w.y + 1 : w.y + 12, d: one(w) });
    for (const M of K.marks) ents.push({ y: M.y + 1, d: one(M) });
    for (const C of K.coffins) ents.push({ y: C.y + 1, d: one(C) });
    for (const c of K.crowns) ents.push({ y: c.e.y + 1, d: one(c) });
    if (K.cyl && P) ents.push({ y: P.y + 1, d: one(K.cyl) }); });
  const _ie = itemExtra;
  itemExtra = function (it, cls) { const base = _ie(it, cls); if (!it || it.wk == null || it.cls !== 'gunner') return base;
    const sk = (wcat('gunner')[it.wk] || {}).sk, D = DEF[sk]; if (!D) return base;
    return base + `<div class="fx">우클릭 「${D.n}」 · 쿨타임 ${D.cd}초 — ${D.d}</div>`; };

  return SKD.wrapAll({ start, update, tick, def, DEF, blast, PAL_F, PAL_G, PAL_Y });
})();
