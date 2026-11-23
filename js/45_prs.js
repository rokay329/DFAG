'use strict';
// ==================================================================================================
// 잿빛 왕관 원정대 — 45_prs.js : v3.22 미레아(사제) 무기별 우클릭 기술 (41 · 42 · 43 · 44와 같은 방식)
//  · 레어 · 유니크 · 레전더리 메이스는 무기마다 고유한 우클릭 기술을 씀 (커먼 · 초록은 기본 「치유의 빛」)
//  · 고해의 채찍은 우클릭 자체가 고유 효과(짧게 / 길게 누르기)라 그대로 둠
//  · 사제는 방패 · 버프 역할이라 고유 우클릭도 쓸 때 빛의 방패 1칸을 얻음 (성유물함은 2칸까지 · 별빛 성가는 2초 보호막)
//  · 쿨타임 무기마다 따로 (KRS.tick) · 깊이 정렬(SKD) · 겹침 디더(SKD.pd) · 몸 · 무기 동작(SKP) 공용
// ==================================================================================================
const PRS = (() => {
  const DEF = {
    censer: { n: '향연 회오리', cd: 9, d: '향로를 크게 세 바퀴 휘둘러 주변 적을 치고 밀쳐냅니다. 끝나면 둘레에 짙은 향 연기가 깔려, 그 안에서는 공격을 흘려낼 확률이 오릅니다.' },
    pan: { n: '무쇠 받아치기', cd: 8, d: '0.7초 동안 프라이팬을 앞으로 들어 정면의 투사체를 모두 되받아치고 피해를 막습니다. 이어서 팬을 크게 휘둘러 앞의 적을 멀리 날려 보내고 기절시킵니다.' },
    water: { n: '성수 소나기', cd: 10, d: '조준한 자리에 성수 구름을 띄워 2.4초 동안 성수 비를 내립니다. 빗속의 적은 계속 피해를 받고 느려지며, 빗속에 선 미레아는 조금씩 회복합니다.' },
    carrot: { n: '토끼 돌격대', cd: 9, d: '당근 밭에서 작은 토끼 다섯 마리가 뛰쳐나옵니다. 토끼는 깡충깡충 가까운 적에게 다가가 몸을 낮췄다가 돌진해 들이받고, 세 번 부딪히면 털뭉치로 사라집니다.' },
    bellh: { n: '대종 낙하', cd: 10, d: '조준한 자리에 커다란 황금 종을 떨어뜨려 안의 적을 가두고 기절시킵니다. 종이 세 번 크게 울리며 울림이 퍼질 때마다 주변 적에게 피해를 줍니다.' },
    reliq: { n: '성유물 수호', cd: 10, d: '빛의 방패를 2칸 얻고, 금 성유물 십자가 셋이 3.5초 동안 몸 둘레를 돌며 닿는 적을 칩니다.' },
    mochi: { n: '달떡 낙하', cd: 10, d: '하늘에서 커다란 떡이 쭉 늘어나며 떨어집니다. 철퍽 퍼졌다가 출렁이며 두 번 더 튀어 오를 때마다 적에게 피해를 주고, 마지막에 크게 내려앉아 끈적하게 붙어 적을 느리게 합니다.' },
    dawn: { n: '새벽 찬가', cd: 11, d: '발밑에 커다란 별빛 성좌를 펼칩니다. 2.4초 동안 성좌가 빛을 뿜으며 안의 적에게 빛기둥이 연달아 내리꽂히고, 끝나면 미레아를 조금 회복합니다.' },
    whip: { n: '참회의 난타', cd: 9, d: '1.3초 동안 채찍으로 양옆을 번갈아 마구 내리칩니다. 갈수록 빨라지고, 마지막에 앞으로 크게 휘둘러 터뜨리며 적을 기절시킵니다.' },
    spear: { n: '천상의 창', cd: 12, d: '미레아 뒤쪽 하늘에서 거대한 성창이 대각선으로 날아와 조준한 자리에 내리꽂힙니다. 꽂힌 자리에서 빛이 폭발하고, 잠시 뒤 성스러운 파동이 한 번 더 퍼집니다.' },
  };
  const SHD = ' 쓸 때 빛의 방패 1칸을 얻습니다.';
  for (const k in DEF) SK_META[k] = Object.assign(SK_META[k] || {}, { K: DEF[k].n, KD: DEF[k].d + SHD });
  const K = { g: null, zones: [] };
  const def = () => (G && G.cls === 'priest' ? DEF[wSkill()] || null : null);
  const FXK = KRS.FXK, lerp = (a, b, t) => a + (b - a) * t, dot = ARS.dot, pxLine = ARS.pxLine, slash = ARS.slash, blast = GRS.blast, PAL_F = GRS.PAL_F, PAL_Y = GRS.PAL_Y;
  const PAL_SMK = ['#ffffff', '#f0e8f8', '#c8b8d8', '#8a7a98', '#4a4458', '#2a2632'], PAL_W = ['#ffffff', '#e8f8ff', '#9ad8ff', '#4f8dff', '#2a3a6a', '#141a2a'], PAL_C = ['#ffffff', '#ffe0a0', '#ff9a3a', '#d8601a', '#5a3a1a', '#2a1a10'], PAL_M = ['#ffffff', '#fffaf0', '#f0e8d8', '#c8bca8', '#5a524c', '#2a2624'], PAL_H = ['#ffffff', '#fffbe6', '#ffe39a', '#c9952a', '#5a4a20', '#2a2410'];
  const big = e => e.type === 'boss' || isElite(e) || isSemi(e) || isDummy(e);
  const live = e => e && !e.dead && e.type !== 'flag';
  const foes = () => G.enemies.filter(live);
  const inE = (e, x, y, r) => Math.hypot(e.x - x, (e.y - y) / 0.6) < r + e.r;
  const hsh = (a, b, s) => { const v = Math.sin(a * 12.9898 + b * 78.233 + s * 37.719) * 43758.5453; return v - Math.floor(v); };
  const aimPt = (P, maxD) => { let tx, ty; if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; } else { tx = P.x + Math.cos(P.ang) * maxD; ty = P.y + Math.sin(P.ang) * maxD; }
    const d = Math.hypot(tx - P.x, ty - P.y); if (d > maxD) { tx = P.x + (tx - P.x) / d * maxD; ty = P.y + (ty - P.y) / d * maxD; }
    return { x: clamp(tx, A.x0 + 20, A.x1 - 20), y: clamp(ty, A.y0 + 20, A.y1 - 20) }; };
  const zone = o => { o.t = 0; o.hit = o.hit || new Set(); o.did = {}; K.zones.push(o); return o; };
  let SEL = null;
  const disk = (x, y, r, c, ry) => { const id = SEL ? SKD.oid(SEL) : 0; for (let yy = -r; yy <= r; yy += 2) { const w = Math.sqrt(Math.max(0, r * r - yy * yy)), Y = y + yy * (ry || 1); for (let xx = -w; xx <= w; xx += 2) SKD.pd(x + xx, Y, id, c); } };
  const run = (x, y, id, c, w) => { for (let i = 0; i < w; i += 2) SKD.pd(x + i, y, id, c); }; // 가로 한 줄 (높이 2px)
  const ring = (x, y, r, c, gap, ry, off) => { const n = Math.max(8, Math.ceil(r * 1.3)); for (let i = 0; i < n; i++) { if (gap && (i + (off || 0)) % gap === 0) continue; const a = i / n * TAU; dot(x + Math.cos(a) * r, y + Math.sin(a) * r * (ry || 0.6), c); } };
  const star4 = (x, y, s, c) => { for (let i = -s; i <= s; i += 2) { dot(x + i, y, Math.abs(i) < 2 ? '#ffffff' : c); dot(x, y + i, Math.abs(i) < 2 ? '#ffffff' : c); } };
  const tipPt = (P, d) => { const h = heroHand(); return { x: h.x + Math.cos(P.blade) * (d || 22), y: h.y - 4 + Math.sin(P.blade) * (d || 22) }; };
  // 빛의 방패 (치유의 빛과 같은 규칙: 성유물함은 2칸까지 · 별빛 성가는 2초 보호막)
  function giveShield(n) { const P = G.player, s = G.stats; const cap = wSkill() === 'reliq' ? 2 : 1; for (let i = 0; i < (n || 1); i++) if ((P.holyArmor || 0) < cap && (P.armor || 0) < ARMOR_MAX) addArmor(1, true);
    if (s.fx.has('dawn')) P.shieldT = 2; if (pasO('healShield')) P.shieldT = Math.max(P.shieldT || 0, pasV('healShield')); }
  // 하늘에서 떨어지는 빛기둥 (2px 칸 · 가운데 흰 심)
  const pillar = (x, y, w, t) => K.zones.push({ k: 'pillar', x, y, w, t: 0, dur: t || 0.35, hit: new Set(), did: {} });

  // ---------------------------------------------------------------- 시작
  function start() {
    const D = def(); if (!D) return false;
    const P = G.player, k = wSkill();
    P.atkAng = P.ang; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.blade = P.ang; P.combo = 0; P.queued = false; P.trail = [];
    P.prs = { k, t: 0, did: {}, dur: 0.5, a: P.ang, hit: new Set() }; const R = P.prs; P.state = 'prs';
    giveShield(k === 'reliq' ? 2 : 1); sfx('heal', 1.3);
    if (k === 'censer') { R.dur = 1.3; P.iframe = Math.max(P.iframe, 0.4); }
    else if (k === 'pan') { R.dur = 1.05; P.iframe = Math.max(P.iframe, 0.72); R.refl = 0; }
    else if (k === 'water') { R.dur = 0.45; R.T = aimPt(P, 170); }
    else if (k === 'carrot') { R.dur = 0.45; R.T = aimPt(P, 170); }
    else if (k === 'bellh') { R.dur = 0.45; R.T = aimPt(P, 170); }
    else if (k === 'reliq') { R.dur = 0.4; }
    else if (k === 'mochi') { R.dur = 0.45; R.T = aimPt(P, 160); }
    else if (k === 'dawn') { R.dur = 0.6; }
    else if (k === 'whip') { R.dur = 2; P.iframe = Math.max(P.iframe, 0.3); P.prsWhip = { tt: 0 }; }
    else if (k === 'spear') { R.dur = 0.55; R.T = aimPt(P, 190); P.iframe = Math.max(P.iframe, 0.55); }
    return true;
  }

  // ---------------------------------------------------------------- 진행 (몸 · 메이스)
  function update(dt) {
    const P = G.player, R = P.prs; if (!R) { P.state = 'idle'; return; }
    R.t += dt; const t = R.t, k = R.k, up = (P.face > 0 ? -75 : -105) * DEG;
    const raise = q => { P.blade = lerpAng(R.a, up, q); }, smash = q => { P.blade = lerpAng(up, R.a + P.face * 0.6, q); };
    P.prsFront = false;
    if (k === 'censer') { // 사슬 향로를 몸 둘레로 세 바퀴 (점점 빨라짐)
      const q = Math.min(1, t / 1.1), ang = R.a - P.face * Math.PI * 0.7 + P.face * (q * q * 0.35 + q * 0.65) * TAU * 3; P.blade = ang; P.prsFront = true; P.trail.push({ a: P.blade, t: 0.22 });
      P.face = Math.cos(ang) >= 0 ? 1 : -1; const rev = Math.floor(q * 3); if (R.rev !== rev && q < 1) { R.rev = rev; R.hit = new Set(); FXK.punch(2 + rev, 0.008, 0); sfx('whoosh', 0.8 + rev * 0.15); }
      const tp = tipPt(P, 34); for (let i = 0; i < 3; i++) G.parts.push({ x: tp.x + rand(-4, 4), y: tp.y + rand(-4, 4), vx: rand(-20, 20), vy: rand(-30, -10), t: rand(0.5, 1.0), c: pick(['#c8b8d8', '#8a7a98', '#f0e8f8', '#e8a060']), g: -20 });
      if (Math.random() < 0.5) G.parts.push({ x: tp.x, y: tp.y, vx: rand(-40, 40), vy: rand(-60, -20), t: 0.35, c: pick(['#ffb040', '#ffe060']), g: 60, glow: true });
      for (const e of foes()) if (!R.hit.has(e) && Math.hypot(e.x - tp.x, e.y - 10 - tp.y) < 18 + e.r) { R.hit.add(e); damageEnemy(e, 0.55, { ang: angTo(P, e), kb: big(e) ? 0 : 200, grogi: 5, gauge: 2 }); blast(e.x, e.y - 12, 14, PAL_SMK); FXK.punch(2, 0.006, 0.01, angTo(P, e)); }
      if (t >= 1.1 && !R.did.f) { R.did.f = true; const S = G.smoke = G.smoke || []; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; S.push({ x: P.x + Math.cos(a) * 44, y: P.y + Math.sin(a) * 26, t: 4.5 }); } S.push({ x: P.x, y: P.y, t: 4.5 });
        blast(P.x, P.y - 8, 56, PAL_SMK); FXK.ring(P.x, P.y, '#e8e0f0', 360, 0.4, 12); for (const e of foes()) if (inE(e, P.x, P.y, 64)) damageEnemy(e, 0.9, { ang: angTo(P, e), kb: big(e) ? 0 : 260, grogi: 10, heavy: true, gauge: 4 }); FXK.punch(7, 0.025, 0.05); sfx('heavy', 1.3); } }
    else if (k === 'pan') {
      if (t < 0.72) { P.blade = R.a + Math.sin(t * 45) * 0.03; R.guard = true; // 팬 받치기: 정면 투사체를 모두 되받아침
        for (const pr of (G.eproj || [])) { if (pr.friend || pr.t <= 0) continue; const d = Math.hypot(pr.x - P.x, pr.y - P.y + 8), a = Math.atan2(pr.y - P.y + 8, pr.x - P.x); if (d < 80 && Math.abs(angDiff(a, R.a)) < 1.3) { pr.friend = true; pr.ang = a; pr.sp = Math.max(pr.sp || 200, 280) * 1.3; pr.t = 2; pr.home = 0; pr.hist = []; R.refl++; blast(pr.x, pr.y, 12, PAL_Y); sfx('block', 0.6 + Math.min(R.refl, 6) * 0.06); FXK.punch(3, 0.01, 0.02, a); } } }
      else { R.guard = false; const q = Math.min(1, (t - 0.72) / 0.08); P.blade = R.a + P.face * lerp(-2.3, 1.1, q); P.prsFront = true; P.trail.push({ a: P.blade, t: 0.2 });
        if (!R.did.f) { R.did.f = true; const tp = tipPt(P, 28), a = R.a; for (const e of foes()) { const d = dist(P, e); if (d < 82 + e.r && Math.abs(angDiff(angTo(P, e), a)) < 1.05) { damageEnemy(e, 1.7, { ang: angTo(P, e), kb: big(e) ? 0 : 420, grogi: 16, heavy: true, stagger: 0.6, gauge: 6 }); applySt(e, 'stun', 0.7); blast(e.x, e.y - 12, 18, PAL_F); } }
          for (let i = 0; i < 3; i++) slash(P.x + Math.cos(a) * (18 + i * 14), P.y - 10 + Math.sin(a) * (14 + i * 10), a - P.face * Math.PI / 2, 26 + i * 10, 1.8, i ? '#d0d0d8' : '#ffffff', '#ffffff', 4 - i, 0.25 + i * 0.05);
          blast(P.x + Math.cos(a) * 34, P.y - 10 + Math.sin(a) * 24, 30, PAL_Y); FXK.ring(P.x + Math.cos(a) * 30, P.y + Math.sin(a) * 20, '#ffd34d', 360, 0.3, 10); FXK.rays(P.x + Math.cos(a) * 34, P.y - 10 + Math.sin(a) * 24, 12, 70, '#fff2b0', 0.2, a); FXK.flash('#fff6d0', 0.05); FXK.punch(11, 0.04, 0.08, a); sfx('block', 0.4); sfx('heavy', 1.1); } } }
    else if (k === 'water') { if (t < 0.15) raise(t / 0.15); else { P.blade = up + Math.sin(t * 30) * 0.06; if (!R.did.f) { R.did.f = true; zone({ k: 'rain', x: R.T.x, y: R.T.y, r: 72, dur: 3.0, drops: [] }); FXK.punch(3, 0.01, 0.01); sfx('aim'); } } }
    else if (k === 'carrot') { if (t < 0.18) raise(t / 0.18); else { smash(Math.min(1, (t - 0.18) / 0.07)); P.prsFront = t < 0.3; if (t < 0.3) P.trail.push({ a: P.blade, t: 0.15 }); if (!R.did.f) { R.did.f = true; FXK.punch(6, 0.02, 0.03); const tp = tipPt(P, 26); zone({ k: 'bunny', x: tp.x, y: P.y + Math.sin(R.a) * 14, a: R.a }); sfx('crunch', 0.7); } } }
    else if (k === 'bellh') { if (t < 0.18) raise(t / 0.18); else { P.blade = up; if (!R.did.f) { R.did.f = true; zone({ k: 'bell', x: R.T.x, y: R.T.y, land: 0.42 }); FXK.punch(3, 0.01, 0.01); sfx('warn', 0.6); } } }
    else if (k === 'reliq') { if (t < 0.15) raise(t / 0.15); else { P.blade = up; if (!R.did.f) { R.did.f = true; zone({ k: 'reliq', x: P.x, y: P.y, dur: 3.5, rs: [0, 1, 2].map(i => ({ a: i / 3 * TAU })), hitT: new Map() }); blast(P.x, P.y - 14, 26, PAL_Y); FXK.ring(P.x, P.y, '#ffe39a', 260, 0.3, 8); FXK.punch(5, 0.015, 0.02); sfx('perfect'); } } }
    else if (k === 'mochi') { if (t < 0.15) raise(t / 0.15); else { P.blade = up; if (!R.did.f) { R.did.f = true; zone({ k: 'mochi', x: R.T.x, y: R.T.y, goo: [] }); FXK.punch(3, 0.01, 0.01); sfx('warn', 0.8); } } }
    else if (k === 'dawn') { if (t < 0.25) raise(t / 0.25); else { P.blade = up + Math.sin(t * 20) * 0.05; if (!R.did.f) { R.did.f = true; zone({ k: 'dawn', x: P.x, y: P.y, r: 96, dur: 2.9, tick: 0 }); FXK.flash('#fffbe6', 0.06); FXK.punch(6, 0.02, 0.03); sfx('awaken', 1.1); } } }
    else if (k === 'whip') { // 기본 공격의 채찍질(1타 · 2타)을 양옆으로 번갈아 점점 빠르게 → 마지막은 3타(몸 둘레를 감아 도는 한 바퀴)를 조준 방향으로
      const W = P.prsWhip; if (!R.q) { R.q = []; let at = 0.04; for (let i = 0; i < 10; i++) { const sp = 1 + i * 0.09, c = i % 2, st = SWING_PW[c], d = (st.wind + st.swing + 0.07) / sp; R.q.push({ t0: at, d, sp, c, base: (i >> 1) % 2 ? Math.PI : 0 }); at += d; } const st = SWING_PW[2]; R.q.push({ t0: at, d: st.wind + st.swing + 0.2, sp: 1, c: 2, base: R.a, fin: true }); R.dur = at + st.wind + st.swing + 0.24; }
      const L = R.q.find(l => t >= l.t0 && t < l.t0 + l.d) || R.q[R.q.length - 1], tt = Math.min(L.d, t - L.t0) * L.sp, st = SWING_PW[L.c], te = st.wind + st.swing;
      P.combo = L.c; P.atkAng = L.base; P.face = Math.cos(L.base) >= 0 ? 1 : -1; P.sign = P.face; W.tt = tt; W.st = st;
      const rel = tt < st.wind ? st.a0 - 12 * (tt / st.wind) : tt < te ? st.a0 - 12 + (st.a1 - st.a0 + 12) * easeOut((tt - st.wind) / st.swing) : st.a1; P.blade = L.base + P.sign * rel * DEG;
      const idx = R.q.indexOf(L);
      if (tt >= st.wind + st.swing * 0.55 && R.ln !== idx) { R.ln = idx; const fin = !!L.fin, reach = fin ? 80 : 74, half = fin ? Math.PI : 1.3;
        for (const e of foes()) { const d = dist(P, e); if (d < reach + e.r && Math.abs(angDiff(angTo(P, e), L.base)) < half) { damageEnemy(e, fin ? 1.4 : 0.42, { ang: angTo(P, e), kb: big(e) ? 0 : (fin ? 260 : 70), grogi: fin ? 16 : 4, heavy: fin, gauge: fin ? 6 : 1.5 }); if (fin) applySt(e, 'stun', 0.8); if (fin || Math.random() < 0.5) { e.bleedT = 3; if (!(e.bleedTick > 0)) e.bleedTick = 0.5; } blast(e.x, e.y - 12, fin ? 20 : 12, ['#ffffff', '#fff0d0', '#e8a060', '#a3161c', '#4a1418', '#1a0a0c']); } }
        const tip = P.lashTip || { x: P.x + Math.cos(P.blade) * 60, y: P.y - 8 + Math.sin(P.blade) * 44 };
        blast(tip.x, tip.y, fin ? 30 : 10, ['#ffffff', '#fff6e0', '#ffe0a0', '#c87a5a', '#5a2a20', '#2a1410']); star4(tip.x, tip.y, fin ? 6 : 4, '#fff0d0'); FXK.ring(tip.x, tip.y + 6, '#fff0d0', fin ? 300 : 140, 0.18, 3);
        if (fin) { FXK.ring(P.x, P.y - 4, '#d02030', 360, 0.3, 30); FXK.flash('#fff0d0', 0.05); FXK.punch(10, 0.035, 0.07, L.base); sfx('heavy', 1.4); sfx('block', 0.5); } else { FXK.punch(2 + idx * 0.3, 0.006, 0.008, L.base); sfx('hit', 1.9 + (idx % 3) * 0.1); } sfx('whoosh', 1.4 + idx * 0.05); } }
    else if (k === 'spear') { // 날개를 펴듯 메이스를 높이 들었다가 아래로 내리그음
      if (t < 0.3) { raise(t / 0.3); P.lift = Math.round(Math.sin(t / 0.3 * Math.PI / 2) * 6); for (let i = 0; i < 2; i++) G.parts.push({ x: P.x + rand(-16, 16), y: P.y - rand(6, 22), vx: rand(-30, 30), vy: rand(10, 40), t: 0.6, c: pick(['#ffffff', '#fffbe6', '#ffe39a']), g: 40 }); }
      else { P.lift = Math.max(0, 6 - (t - 0.3) * 60); smash(Math.min(1, (t - 0.3) / 0.08)); P.prsFront = t < 0.42; if (t < 0.42) P.trail.push({ a: P.blade, t: 0.15 });
        if (!R.did.f) { R.did.f = true; const dx = R.T.x - P.x; zone({ k: 'spear', x: R.T.x, y: R.T.y, sx: P.x - Math.sign(dx || P.face) * 60 - dx * 0.2, sy: P.y - 260, land: 0.42 }); FXK.flash('#fffbe6', 0.05); FXK.punch(5, 0.015, 0.03); sfx('awaken', 1.4); } } }
    if (t >= R.dur) end(P);
  }
  function end(P) { P.prsWhip = null; P.state = 'idle'; P.prs = null; P.t = 0; P.lift = 0; P.prsFront = false; }

  // ---------------------------------------------------------------- 진 · 소환물
  function tick(dt) {
    if (K.g !== G) { K.g = G; K.zones = []; }
    if (!G.player) return; const P = G.player;
    for (const Z of K.zones) { Z.t += dt; const t = Z.t;
      if (Z.k === 'pillar') { if (!Z.did.h) { Z.did.h = true; for (const e of foes()) if (Math.hypot(e.x - Z.x, (e.y - Z.y) / 0.6) < Z.w + e.r) damageEnemy(e, 0.6, { ang: 0, kb: 0, grogi: 6, gauge: 2 }); blast(Z.x, Z.y - 8, Z.w * 1.6, PAL_H); FXK.light(Z.x, Z.y, 90, 0.8, '255,230,150', 0.15); addShake(2, 0); sfx('bolt', 1.6 + rand(0, 0.3)); } if (t > Z.dur) Z.dead = true; }
      else if (Z.k === 'rain') { const on = t > 0.35 && t < 2.75;
        if (on) { for (let i = 0; i < 4; i++) { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * Z.r; const dx = Math.max(-50, Math.min(50, Math.cos(a) * r)), dy = Math.sin(a) * r * 0.6; Z.drops.push({ x: Z.x + dx, y: Z.y + dy, h: dy + 84 - rand(0, 6), t: 0 }); } } // v3.22 빗줄기는 구름 아랫면에서부터
        for (const d of Z.drops) { d.t += dt; d.h -= dt * 420; if (d.h <= 0 && !d.sp) { d.sp = true; if (Math.random() < 0.35) G.parts.push({ x: d.x, y: d.y - 2, vx: rand(-30, 30), vy: rand(-50, -20), t: 0.25, c: pick(['#e8f8ff', '#9ad8ff']), g: 300 }); } } Z.drops = Z.drops.filter(d => d.t < 0.5);
        if (on && (Z.tk = (Z.tk || 0) - dt) <= 0) { Z.tk = 0.25; for (const e of foes()) if (inE(e, Z.x, Z.y, Z.r)) { damageEnemy(e, 0.24, { ang: 0, kb: 0, grogi: 2, gauge: 1 }); zoneSlow(e, 0.7); } }
        if (on && !P.dead && Math.hypot(P.x - Z.x, (P.y - Z.y) / 0.6) < Z.r) healPct(0.02 * dt);
        if (on) FXK.light(Z.x, Z.y - 30, 160, 0.2, '200,230,255', 0.03);
        if (t > Z.dur) Z.dead = true; }
      else if (Z.k === 'bunny') { // 토끼 다섯: 깡충 뛰어 가까운 적에게 다가가다 몸을 낮추고 돌진
        if (!Z.bs) { Z.bs = []; for (let i = 0; i < 5; i++) { const a = Z.a + (i - 2) * 0.45; Z.bs.push({ x: Z.x + Math.cos(a) * 6, y: Z.y + Math.sin(a) * 4, vx: Math.cos(a) * 120, vy: Math.sin(a) * 90, hop: i * 0.2, ph: 'hop', pt: 0, face: Math.cos(a) >= 0 ? 1 : -1, hits: 0, life: 3.2 + i * 0.1, tg: null }); }
          blast(Z.x, Z.y - 6, 22, ['#ffffff', '#fff0f4', '#ffc0d0', '#c08090', '#5a4050', '#2a2028']); FXK.ring(Z.x, Z.y, '#ffd0dc', 220, 0.3, 6); sfx('blip', 1.6); }
        for (const b of Z.bs) { if (b.dead) continue; b.pt += dt; b.life -= dt;
          if (!live(b.tg)) { let bd = 1e9; b.tg = null; for (const e of foes()) { const d = Math.hypot(e.x - b.x, e.y - b.y); if (d < bd && d < 240) { bd = d; b.tg = e; } } }
          const T = b.tg, ox = b.x, oy = b.y;
          if (b.ph === 'hop') { b.hop += dt * 3.4; if (T) { const a = Math.atan2(T.y - b.y, T.x - b.x); b.vx += (Math.cos(a) * 140 - b.vx) * Math.min(1, dt * 5); b.vy += (Math.sin(a) * 110 - b.vy) * Math.min(1, dt * 5); if (Math.hypot(T.x - b.x, T.y - b.y) < 60 + T.r && b.pt > 0.3) { b.ph = 'crouch'; b.pt = 0; } }
            b.x += b.vx * dt; b.y += b.vy * dt; if (b.hop % 1 < dt * 3.4) { dust(b.x, b.y, 1); if (Math.random() < 0.3) sfx('blip', 2.0 + rand(0, 0.3)); } }
          else if (b.ph === 'crouch') { if (b.pt > 0.14) { b.ph = 'dash'; b.pt = 0; const a = T ? Math.atan2(T.y - b.y, T.x - b.x) : Math.atan2(b.vy, b.vx); b.vx = Math.cos(a) * 420; b.vy = Math.sin(a) * 320; b.hitS = new Set(); sfx('whoosh', 1.8); } }
          else if (b.ph === 'dash') { b.x += b.vx * dt; b.y += b.vy * dt; if (Math.random() < 0.8) G.parts.push({ x: b.x - b.vx * 0.02, y: b.y - 4, vx: -b.vx * 0.1, vy: rand(-20, 0), t: 0.25, c: pick(['#ffffff', '#ffd0dc', '#e8e8f0']), g: 0 });
            for (const e of foes()) if (!b.hitS.has(e) && Math.hypot(e.x - b.x, (e.y - b.y) / 0.8) < 10 + e.r) { b.hitS.add(e); b.hits++; const a = Math.atan2(b.vy, b.vx); damageEnemy(e, 0.8, { ang: a, kb: big(e) ? 0 : 240, grogi: 8, heavy: true, gauge: 3 }); applySt(e, 'stun', 0.4);
              blast(e.x, e.y - 10, 18, ['#ffffff', '#fff0f4', '#ffc0d0', '#c08090', '#5a4050', '#2a2028']); FXK.ring(e.x, e.y, '#ffd0dc', 200, 0.25, 6); FXK.punch(4, 0.012, 0.02, a); sfx('hit', 1.3); b.vx *= -0.35; b.vy = -60; b.ph = 'bounce'; b.pt = 0; }
            if (b.pt > 0.3) { b.ph = 'hop'; b.pt = 0; } }
          else if (b.ph === 'bounce') { b.x += b.vx * dt; b.y += b.vy * dt * 0.3; if (b.pt > 0.3) { b.ph = 'hop'; b.pt = 0; } }
          if (segSolid(ox, oy, b.x, b.y, 4) || b.x < A.x0 + 8 || b.x > A.x1 - 8 || b.y < A.y0 + 8 || b.y > A.y1 - 8) { b.x = ox; b.y = oy; b.vx *= -1; b.vy *= -1; }
          if (Math.abs(b.vx) > 5) b.face = b.vx > 0 ? 1 : -1;
          if (b.life <= 0 || b.hits >= 3) { b.dead = true; blast(b.x, b.y - 6, 14, ['#ffffff', '#fff0f4', '#ffc0d0', '#c08090', '#5a4050', '#2a2028']); for (let j = 0; j < 8; j++) G.parts.push({ x: b.x, y: b.y - 6, vx: rand(-80, 80), vy: rand(-120, -40), t: 0.5, c: pick(['#ffffff', '#ffd0dc']), g: 300 }); sfx('blip', 1.2); } }
        if (Z.bs.every(b => b.dead)) Z.dead = true; }
      else if (Z.k === 'bell') { // 대종: 떨어져 가두고 → 세 번 울림 (울림 파동 · 소리 물결은 바닥에 그려 종에 가려짐)
        Z.waves = Z.waves || [];
        if (t >= Z.land && !Z.did.land) { Z.did.land = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 38)) { damageEnemy(e, 1.6, { ang: 0, kb: 0, grogi: 16, heavy: true, gauge: 6 }); applySt(e, 'stun', 1.4); Z.hit.add(e); }
          for (const e of foes()) if (!Z.hit.has(e) && inE(e, Z.x, Z.y, 70)) damageEnemy(e, 0.6, { ang: angTo(Z, e), kb: big(e) ? 0 : 200, grogi: 6, gauge: 2 });
          Z.waves.push({ t: 0, max: 0.5, r0: 30, r1: 120, c: '#fff6d0', w: 3 }); Z.cr = []; for (let i = 0; i < 10; i++) Z.cr.push({ a: i / 10 * TAU + rand(-0.2, 0.2), l: rand(30, 60), s: Math.random() * 99 });
          FXK.debris(Z.x, Z.y, 18); dust(Z.x - 40, Z.y, 10); dust(Z.x + 40, Z.y, 10); FXK.flash('#fff6d0', 0.07); FXK.punch(15, 0.055, 0.1); FXK.light(Z.x, Z.y, 220, 1, '255,230,150', 0.3); sfx('heavy', 0.5); sfx('crunch', 0.5); sfx('block', 0.3); }
        for (let i = 0; i < 3; i++) { const rt = Z.land + 0.4 + i * 0.42; if (t >= rt && !Z.did['r' + i]) { Z.did['r' + i] = true; Z.ringT = t; Z.ringN = i; const R2 = 80 + i * 30;
          for (const e of foes()) if (inE(e, Z.x, Z.y, R2)) damageEnemy(e, i === 2 ? 1.0 : 0.6, { ang: angTo(Z, e), kb: big(e) ? 0 : (i === 2 ? 260 : 90), grogi: 8, heavy: i === 2, gauge: 2 });
          for (let j = 0; j < 3; j++) Z.waves.push({ t: -j * 0.07, max: 0.55, r0: 40, r1: R2 + 20 + j * 10, c: j ? '#ffe39a' : '#ffffff', w: 3 - j });
          for (let j = 0; j < 14; j++) { const a = rand(0, TAU), sp = rand(120, 260); G.parts.push({ x: Z.x + Math.cos(a) * 30, y: Z.y - 40 + Math.sin(a) * 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 40, t: 0.4, c: pick(['#fff6d0', '#ffd34d', '#ffffff']), g: 200, glow: true }); }
          FXK.punch(7 + i * 2, 0.02 + i * 0.01, 0.03); FXK.light(Z.x, Z.y - 30, 180, 0.9, '255,230,150', 0.25); if (i === 2) FXK.flash('#fff6d0', 0.06); sfx('block', 0.3 + i * 0.04); sfx('heavy', 1.6 - i * 0.2); sfx('perfect'); } }
        for (const w of Z.waves) w.t += dt; Z.waves = Z.waves.filter(w => w.t < w.max);
        if (t > Z.land + 2.0) Z.dead = true; }
      else if (Z.k === 'reliq') { Z.x = P.x; Z.y = P.y;
        for (const [e, c] of Z.hitT) { if (c - dt <= 0) Z.hitT.delete(e); else Z.hitT.set(e, c - dt); }
        const spin = t * 6.5, R2 = Math.min(1, t / 0.2) * 38;
        Z.rs.forEach((r, i) => { const a = r.a + spin; r.x = P.x + Math.cos(a) * R2; r.y = P.y - 10 + Math.sin(a) * R2 * 0.6; r.z = Math.sin(a);
          if (t < Z.dur) for (const e of foes()) if (!Z.hitT.has(e) && Math.hypot(e.x - r.x, e.y - 10 - r.y) < 12 + e.r) { Z.hitT.set(e, 0.35); damageEnemy(e, 0.45, { ang: angTo(P, e), kb: big(e) ? 0 : 150, grogi: 4, gauge: 2 }); blast(r.x, r.y, 12, PAL_Y); FXK.punch(2, 0.006, 0.01); sfx('hit', 1.5); }
          if (Math.random() < 0.4) G.parts.push({ x: r.x, y: r.y, vx: rand(-15, 15), vy: rand(-25, -5), t: 0.35, c: pick(['#ffe39a', '#fffbe6']), g: 0, glow: true }); });
        FXK.light(P.x, P.y - 10, 90, 0.2, '255,230,150', 0.03);
        if (t > Z.dur + 0.3) Z.dead = true; }
      else if (Z.k === 'mochi') { // 쫀득한 큰 떡: 길게 늘어나며 떨어져 → 철퍽 퍼졌다가 출렁이며 두 번 튀고 → 크게 내려앉아 끈적하게 붙음
        const L = [0.42, 0.95, 1.45]; Z.goo = Z.goo || [];
        L.forEach((lt, i) => { if (t >= lt && !Z.did['l' + i]) { Z.did['l' + i] = true; Z.lt = t; Z.li = i; const last = i === 2, R2 = last ? 78 : 56;
          for (const e of foes()) if (inE(e, Z.x, Z.y, R2)) { damageEnemy(e, last ? 1.5 : i === 0 ? 1.1 : 0.6, { ang: angTo(Z, e), kb: big(e) ? 0 : (i === 0 ? 120 : 40), grogi: last ? 16 : 8, heavy: i !== 1, gauge: 3 }); applySt(e, 'slow', 3, 0.35); if (i !== 1) applySt(e, 'stun', last ? 0.9 : 0.5); }
          blast(Z.x, Z.y - 8, last ? 52 : 34, PAL_M); FXK.ring(Z.x, Z.y, '#fffaf0', last ? 480 : 300, 0.35, 12); FXK.punch(i === 1 ? 6 : 12, i === 1 ? 0.02 : 0.045, 0.06); dust(Z.x, Z.y, 14);
          for (let j = 0; j < (last ? 14 : 8); j++) { const a = rand(0, TAU), r = rand(30, R2 + 10); Z.goo.push({ x: Z.x, y: Z.y - 10, tx: Z.x + Math.cos(a) * r, ty: Z.y + Math.sin(a) * r * 0.6, t: 0, s: rand(3, 7) }); }
          if (last) { FXK.flash('#fffaf0', 0.08); FXK.rays(Z.x, Z.y - 14, 14, 100, '#fffaf0', 0.25); } sfx('heavy', 0.9); sfx('crunch', 0.4); } });
        for (const g of Z.goo) g.t += dt;
        if (t > 1.45 && t < 3.6) for (const e of foes()) if (inE(e, Z.x, Z.y, 70)) zoneSlow(e, 0.4);
        if (t > 3.6) Z.dead = true; }
      else if (Z.k === 'dawn') { Z.x = P.x; Z.y = P.y; const on = t > 0.3 && t < 2.5; Z.motes = Z.motes || [];
        if (on && (Z.tick -= dt) <= 0) { Z.tick = 0.11; const L = foes().filter(e => inE(e, Z.x, Z.y, Z.r)), e = L.length ? pick(L) : null, a = rand(0, TAU), r = rand(20, Z.r); pillar(e ? e.x : Z.x + Math.cos(a) * r, e ? e.y : Z.y + Math.sin(a) * r * 0.6, 14, 0.36); }
        if (on && Math.random() < 0.8) Z.motes.push({ x: Z.x + rand(-Z.r, Z.r), y: Z.y + rand(-Z.r, Z.r) * 0.5, t: 0, max: rand(0.6, 1.1) }); for (const m of Z.motes) { m.t += dt; m.y -= dt * 40; } Z.motes = Z.motes.filter(m => m.t < m.max);
        if (on && Math.random() < 0.3) G.parts.push({ x: Z.x + rand(-80, 80), y: Z.y - rand(80, 140), vx: rand(-20, 20), vy: rand(20, 50), t: 1.0, c: pick(['#ffffff', '#fffbe6']), g: 10 }); // 깃털처럼 내려오는 빛
        if (t >= 2.5 && !Z.did.b) { Z.did.b = true; healPct(0.05); sfx('heal', 0.7); } // v3.22 마지막 폭발 없음 — 조용히 회복만
        if (on) FXK.light(Z.x, Z.y, 190, 0.3, '255,230,150', 0.03);
        if (t > Z.dur) Z.dead = true; }
      else if (Z.k === 'spear') { // 성창 하나: 플레이어 쪽 하늘에서 대각선으로 내리꽂힘
        const q = Math.min(1, t / Z.land), e2 = q * q * q; Z.tx = lerp(Z.sx, Z.x, e2); Z.ty = lerp(Z.sy, Z.y, e2); (Z.hist = Z.hist || []).push({ x: Z.tx, y: Z.ty, t: 0.22 }); for (const h of Z.hist) h.t -= dt; Z.hist = Z.hist.filter(h => h.t > 0);
        if (t < Z.land && Math.random() < 0.8) G.parts.push({ x: Z.tx + rand(-6, 6), y: Z.ty + rand(-6, 6), vx: rand(-30, 30), vy: rand(-20, 30), t: 0.5, c: pick(['#ffffff', '#fffbe6', '#ffe39a']), g: 30, glow: true });
        if (t < Z.land) FXK.light(Z.tx, Z.ty, 90, 0.4, '255,240,190', 0.04);
        if (t >= Z.land && !Z.did.land) { Z.did.land = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 80)) { damageEnemy(e, 3.0, { ang: angTo(Z, e), kb: big(e) ? 0 : 340, grogi: 22, heavy: true, gauge: 8 }); applySt(e, 'stun', 0.9); }
          blast(Z.x, Z.y - 16, 90, PAL_H, true); blast(Z.x - 46, Z.y + 2, 34, PAL_H); blast(Z.x + 46, Z.y - 2, 34, PAL_H); blast(Z.x, Z.y - 60, 40, PAL_H);
          Z.cr = []; for (let i = 0; i < 12; i++) Z.cr.push({ a: i / 12 * TAU + rand(-0.15, 0.15), l: rand(40, 80), s: Math.random() * 99 });
          FXK.ring(Z.x, Z.y, '#ffffff', 760, 0.5, 18); FXK.ring(Z.x, Z.y, '#ffe39a', 520, 0.55, 12); FXK.rays(Z.x, Z.y - 24, 24, 160, '#fffbe6', 0.4); FXK.debris(Z.x, Z.y, 24); FXK.flash('#ffffff', 0.16); FXK.punch(20, 0.07, 0.15); FXK.light(Z.x, Z.y, 320, 1, '255,240,190', 0.6); sfx('heavy', 0.45); sfx('blast', 0.5); sfx('perfect'); }
        if (t >= Z.land + 0.5 && !Z.did.n) { Z.did.n = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 120)) damageEnemy(e, 1.1, { ang: angTo(Z, e), kb: big(e) ? 0 : 200, grogi: 10, heavy: true, gauge: 4 }); FXK.ring(Z.x, Z.y, '#fffbe6', 560, 0.4, 20); blast(Z.x, Z.y - 40, 50, PAL_H); FXK.punch(9, 0.03, 0.05); sfx('heal', 0.6); sfx('blast', 0.8); }
        if (t > Z.land + 0.2 && t < Z.land + 1.4 && Math.random() < 0.5) G.parts.push({ x: Z.x + rand(-20, 20), y: Z.y - rand(10, 60), vx: rand(-30, 30), vy: rand(-60, -20), t: 0.8, c: pick(['#ffffff', '#fffbe6', '#ffe39a']), g: -10, glow: true });
        if (t > Z.land + 1.8) Z.dead = true; }
    }
    K.zones = K.zones.filter(Z => !Z.dead);
  }

  // ---------------------------------------------------------------- 그리기 (2px 칸)
  // 성창: 금 자루 · 잎사귀 창날(흰 심) · 십자 코등이 · 작은 날개 · 붉은 리본 — 세로로 아래를 향함 (tipY = 창끝)
  // ---------------- 성창 (칸 격자 → 각도대로 돌려 그림: 빈틈 없게 화면 칸에서 거꾸로 되짚음) · 창끝이 (0, 8)
  const SPEAR = (() => { const W = 60, H = 19, cy = 9, g = Array.from({ length: H }, () => Array(W).fill(null)), put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    for (let x = 1; x <= 18; x++) { const hw = Math.round(4.4 * Math.pow(Math.sin(Math.PI * Math.min(1, x / 20)), 0.75)); for (let d = -hw; d <= hw; d++) put(x, cy + d, d === 0 ? (x > 3 && x < 16 ? (x % 2 ? '#ffffff' : '#d8e4f8') : '#ffffff') : d < 0 ? (d === -hw ? '#ffffff' : d === -1 ? '#f4f8ff' : '#e0eaff') : (d === hw ? '#7a8aa8' : d === 1 ? '#c8d4ec' : '#a8b8d4')); }
    put(0, cy, '#ffffff');
    for (let d = -7; d <= 7; d++) { put(19, cy + d, Math.abs(d) > 5 ? '#ffe08a' : '#fff2b0'); put(20, cy + d, Math.abs(d) > 5 ? '#c9952a' : '#ffd34d'); put(21, cy + d, '#8a6420'); } put(20, cy, '#c03030'); put(20, cy - 1, '#ff7a6a'); put(19, cy - 8, '#ffe08a'); put(19, cy + 8, '#c9952a');
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const x0 = 22 + k * 2, y0 = cy + s * 3, x1 = 27 + k * 3, y1 = cy + s * (8 - k * 0.5); const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); put(x, y, k % 2 ? '#e8ecf8' : '#ffffff'); put(x, y - s, i > n / 2 ? '#c8d0e4' : '#ffffff'); } }
    for (let x = 22; x <= 53; x++) { put(x, cy - 1, '#ffe08a'); put(x, cy, '#c9952a'); put(x, cy + 1, '#8a6420'); }
    for (const bx of [31, 42]) for (let d = -2; d <= 2; d++) { put(bx, cy + d, '#fff2b0'); put(bx + 1, cy + d, '#c9952a'); }
    for (const [x, y, c] of [[23, cy + 2, '#c03030'], [24, cy + 3, '#c03030'], [24, cy + 4, '#8a1820'], [25, cy + 5, '#c03030'], [26, cy + 5, '#c03030'], [27, cy + 6, '#8a1820'], [25, cy + 4, '#e84848']]) put(x, y, c);
    [1, 2, 3, 2, 1].forEach((hw, i) => { for (let d = -hw; d <= hw; d++) put(54 + i, cy + d, d < 0 ? '#ffe08a' : d > 0 ? '#8a6420' : '#c9952a'); }); put(56, cy, '#4f8dff'); put(56, cy - 1, '#9ad8ff');
    const src = g.map(r => r.slice()); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!src[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => src[y + dy] && src[y + dy][x + dx])) g[y][x] = '#1a1418';
    return { g, W, H, cy }; })();
  function drawSpearRot(tx, ty, ang, sc, groundY, glow) { const { g, W, H, cy } = SPEAR, c = Math.cos(ang), s = Math.sin(ang), L = W * 2 * sc + 4, id = SEL ? SKD.oid(SEL) : 0;
    const x0 = snap2(tx - L), x1 = snap2(tx + L), y0 = snap2(ty - L), y1 = snap2(ty + L);
    for (let Y = y0; Y <= y1; Y += 2) { if (groundY != null && Y > groundY) continue; for (let X = x0; X <= x1; X += 2) { const dx = X + 1 - tx, dy = Y + 1 - ty, u = (dx * c + dy * s) / (2 * sc), v = (-dx * s + dy * c) / (2 * sc), gx = Math.round(u), gy = Math.round(v) + cy;
      if (gx < 0 || gx >= W || gy < 0 || gy >= H) continue; const col = g[gy][gx]; if (!col) continue; SKD.pd(X, Y, id, glow && col !== '#1a1418' && Math.floor(time * 20) % 2 && gx < 19 ? '#ffffff' : col); } } }
  // ---------------- 쫀득한 떡 (흰 몸 · 아래로 갈수록 크림 · 볼터치 · 콩가루 점)
  function drawMochi(x, y, w, h, a) { const id = SEL ? SKD.oid(SEL) : 0, X = snap2(x), Y = snap2(y), R = Math.max(2, Math.round(h / 2) * 2);
    ctx.globalAlpha = a == null ? 1 : a;
    for (let yy = 0; yy < R; yy += 2) { const k = yy / R, hw = Math.max(2, Math.round(w * Math.sqrt(Math.max(0, 1 - ((k - 0.62) / 0.62) ** 2)) / 2) * 2); run(X - hw - 2, Y - R + yy, id, '#8a8070', hw * 2 + 4); }
    for (let yy = 0; yy < R; yy += 2) { const k = yy / R, hw = Math.max(2, Math.round(w * Math.sqrt(Math.max(0, 1 - ((k - 0.62) / 0.62) ** 2)) / 2) * 2), c = k > 0.86 ? '#d8ccb8' : k > 0.66 ? '#f0e8d8' : '#fffaf0'; run(X - hw, Y - R + yy, id, c, hw * 2);
      if (k < 0.4 && k > 0.12) run(X - hw + Math.round(hw * 0.4 / 2) * 2, Y - R + yy, id, '#ffffff', Math.max(2, Math.round(hw * 0.5 / 2) * 2)); }
    SKD.pd(X - Math.round(w * 0.55 / 2) * 2, Y - Math.round(R * 0.42 / 2) * 2, id, '#ffc0d0', 4); SKD.pd(X + Math.round(w * 0.45 / 2) * 2, Y - Math.round(R * 0.42 / 2) * 2, id, '#ffc0d0', 4);
    for (let i = 0; i < 6; i++) SKD.pd(X + Math.round((hsh(i, 1, 9) - 0.5) * w * 1.2 / 2) * 2, Y - R + 4 + Math.round(hsh(i, 2, 9) * R * 0.5 / 2) * 2, id, '#e8dcc0');
    ctx.globalAlpha = 1; }
  // ---------------- 칸 그림 도우미: rows(문자열 배열) + 팔레트를 2px 칸으로 (좌우 뒤집기 · 겹침 디더)
  const cellDraw = (rows, pal, x, y, flip, id) => { const W = rows[0].length; for (let r = 0; r < rows.length; r++) for (let c = 0; c < W; c++) { const ch = rows[r][flip ? W - 1 - c : c]; if (ch === '.' || !pal[ch]) continue; SKD.pd(x + c * 2, y + r * 2, id, pal[ch]); } };
  const withOutline = rows => { const H = rows.length, W = rows[0].length, g = rows.map(r => r.split('')); const o = g.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx] && g[y + dy][x + dx] !== '.' && g[y + dy][x + dx] !== 'k')) o[y][x] = 'k'; return o.map(r => r.join('')); };
  const pad = rows => { const W = rows[0].length + 2; return ['.'.repeat(W)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(W)]); };
  // ---------------- 토끼 (오른쪽을 봄): 긴 귀(분홍 속귀) · 큰 눈(반짝임) · 볼터치 · 분홍 코 · 몽실 꼬리 · 흰 몸 명암
  const BUN_PAL = { k: '#3a2a3a', w: '#ffffff', s: '#e6dcec', S: '#c8bcd4', p: '#ffb4c8', P: '#ff8aa8', e: '#2a1a2a', o: '#ffffff', n: '#ff6a8a', t: '#fff6fa' };
  const BUN = {
    hop: withOutline(pad([
      '......ww.ww..',
      '.....wpw.wpw.',
      '.....wps.wps.',
      '.....wps.wpw.',
      '.....wws.wws.',
      '....wwwwwwww.',
      '...wwwwwwwwww',
      '..twwwwwweoww',
      '.ttswwwwweewP',
      '..tswwwwwpwnw',
      '...swwwwwwwww',
      '...sswwwwwss.',
      '....sSs.sSs..'])),
    crouch: withOutline(pad([
      '.............',
      '.......ww.ww.',
      '......wpwwpw.',
      '......wpswps.',
      '.....wwwwwwww',
      '..twwwwwwweow',
      '.ttswwwwweewP',
      '..tswwwwwpwnw',
      '..sswwwwwwwww',
      '..sSSs..sSSs.'])),
    dash: withOutline(pad([
      'ww.ww..........',
      'wppwpw.........',
      '.wppswwww......',
      '..wwswwwwwwww..',
      '.twwwwwwwwweoww',
      'ttswwwwwwwweewP',
      '.tsswwwwwwwpwnw',
      '..ssswwwwwwwww.',
      '...sSSs...sSSs.'])) };
  function drawBunny(b) { const hop = b.ph === 'hop' ? Math.abs(Math.sin(b.hop * Math.PI)) * 10 : b.ph === 'bounce' ? 6 : 0, pose = b.ph === 'dash' ? BUN.dash : b.ph === 'crouch' ? BUN.crouch : BUN.hop, W = pose[0].length * 2, H = pose.length * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(snap2(b.x) - 8, snap2(b.y), 16, 2);
    const blink = Math.floor((time + b.life) * 2.3) % 9 === 0, P2 = blink ? Object.assign({}, BUN_PAL, { e: '#ffffff', o: '#2a1a2a' }) : BUN_PAL;
    cellDraw(pose, P2, snap2(b.x) - W / 2, snap2(b.y - hop) - H + 2, b.face < 0, SEL ? SKD.oid(SEL) : 0); }
  // ---------------- 대종: 시작방(종이 멈춘 수도원)의 청동 종과 같은 그리기 — 둥근 어깨 · 허리 · 넓은 소리 테 · 띠 둘 · 새긴 글자 띠 · 녹청 · 입술 타원 · 머리 고리 (크기 1.6배)
  const BELL = (() => { const base = [3, 4.5, 5.5, 6, 6.5, 6.8, 7, 7, 7, 7, 7.2, 7.4, 7.7, 8, 8.5, 9, 9.8, 10.6, 11.4, 12, 12.3], S = 1.6, H0 = Math.round(base.length * S), prof = Array.from({ length: H0 }, (_, r) => base[Math.min(base.length - 1, Math.floor(r / S))] * S);
    const BR = t => t < 0.06 ? '#6a4614' : t < 0.14 ? '#b08030' : t < 0.24 ? '#f6dc8c' : t < 0.34 ? '#e0b84a' : t < 0.58 ? '#c0902e' : t < 0.78 ? '#9a6e20' : t < 0.92 ? '#7a5418' : '#5a3a10';
    const MW = Math.round(prof[H0 - 1]) + 3, rows = [], K2 = '#1a1410', B1 = Math.round(4 * S), B2 = Math.round(15 * S), IN = Math.round(8 * S);
    for (let r = 0; r < H0; r++) { const hw = Math.round(prof[r]), row = []; for (let x = -MW; x <= MW; x++) { let c = null;
        if (Math.abs(x) === hw + 1 || (r === 0 && Math.abs(x) <= hw)) c = K2; else if (Math.abs(x) <= hw) { const u = (x + hw) / (hw * 2); c = BR(u);
          if (r === B1 || r === B2) c = u < 0.5 ? '#f0d080' : '#b08030'; if (r === B1 + 1 || r === B2 + 1) c = '#6a4614';
          if ((r === IN || r === IN + 1) && Math.abs(x) <= hw - 2 && ((x + r) & 1)) c = '#8a6220';
          if (r > 11 * S && r < 15 * S && hsh(x, r, 77) < 0.12 && ((x + r) & 1)) c = '#4a7a6a'; }
        row.push(c); } rows.push(row); }
    // 입술 타원 (앞 테두리 + 안쪽 어둠)
    for (let j = 1; j <= 5; j++) { const row = []; for (let x = -MW; x <= MW; x++) { const R2 = MW - 1.5, d = Math.round(Math.sqrt(Math.max(0, 1 - (x / R2) ** 2)) * 5); let c = null; if (Math.abs(x) <= R2 + 0.5) { if (j === 1) c = Math.abs(x) > R2 - 1 ? K2 : x < -R2 * 0.3 ? '#f0d080' : x < R2 * 0.3 ? '#c0902e' : '#7a5418'; else if (j <= d) c = j === d ? K2 : x < 0 ? '#9a6e20' : '#6a4614'; } row.push(c); } rows.push(row); }
    // 머리 고리
    const head = ['..kkkkkkk..', '.kYYOOOOOk.', 'kYk.....kOk', 'kOk.....kOk', 'kYk.....kOk', 'kkOOOOOOOkk', '.kOOOOOOOk.'], HP = { k: K2, O: '#9a6e20', Y: '#f0d080' };
    return { rows, MW, head, HP, H0 }; })();
  function drawBell(x, y, sway, flash) { const { rows, MW, head, HP, H0 } = BELL, id = SEL ? SKD.oid(SEL) : 0, N = rows.length, X = snap2(x), Y = snap2(y) - N * 2;
    for (let r = 0; r < N; r++) { const o = Math.round(sway * (r / N) / 2) * 2; for (let i = 0; i < rows[r].length; i++) { const c = rows[r][i]; if (!c) continue; SKD.pd(X + o + (i - MW) * 2, Y + r * 2, id, flash && c !== '#1a1410' && ((i + r) & 1) ? '#fff6d0' : c); } }
    cellDraw(head, HP, X - 10, Y - 12, false, id); }
  // ---------------- 성유물 십자가 (칸 그림): 꽃봉오리 네 끝 · 금 테두리 명암 · 새긴 점선 · 가운데 둥근 메달 + 붉은 보석 · 끝마다 작은 진주
  const CROSS = (() => { const W = 17, H = 23, cx = 8, cy = 9, g = Array.from({ length: H }, () => Array(W).fill('.')), put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    const arm = (x, y) => { const L = x - cx; return L < 0 ? 'Y' : L === 0 ? 'G' : 'O'; };
    for (let y = 2; y <= 20; y++) for (let x = cx - 1; x <= cx + 1; x++) put(x, y, x === cx - 1 ? 'Y' : x === cx ? 'G' : 'O');
    for (let x = 2; x <= 14; x++) for (let y = cy - 1; y <= cy + 1; y++) put(x, y, y === cy - 1 ? 'Y' : y === cy ? 'G' : 'O');
    for (const [bx, by] of [[cx, 1], [cx, 21], [1, cy], [15, cy]]) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (Math.abs(dx) + Math.abs(dy) <= 1 || (bx === cx ? dy === 0 : dx === 0)) put(bx + dx, by + dy, dx + dy < 0 ? 'Y' : dx + dy > 0 ? 'O' : 'G'); }
    for (const [bx, by] of [[cx, 0], [cx, 22], [0, cy], [16, cy]]) put(bx, by, 'w');
    for (let y = 4; y <= 18; y += 2) if (Math.abs(y - cy) > 2) put(cx, y, 'd'); for (let x = 4; x <= 12; x += 2) if (Math.abs(x - cx) > 2) put(x, cy, 'd');
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) put(cx + dx, cy + dy, dx * dx + dy * dy >= 4 ? (dx + dy < 0 ? 'Y' : 'O') : 'G');
    put(cx, cy, 'r'); put(cx - 1, cy, 'r'); put(cx, cy - 1, 'R'); put(cx + 1, cy, 'q'); put(cx, cy + 1, 'q'); put(cx - 1, cy - 1, 'w');
    return withOutline(pad(g.map(r => r.join('')))); })();
  const CROSS_PAL = { k: '#1a1410', Y: '#fff2b0', G: '#ffd34d', O: '#c9952a', d: '#8a6420', r: '#e03838', R: '#ff9a8a', q: '#8a1820', w: '#ffffff' }, CROSS_DIM = { k: '#1a1410', Y: '#a87a24', G: '#8a6420', O: '#5a4218', d: '#3a2a10', r: '#6a1a20', R: '#8a3a3a', q: '#3a0a10', w: '#c8c0b0' };
  function drawCross(x, y, dim, t) { const W = CROSS[0].length * 2, H = CROSS.length * 2, X = snap2(x) - W / 2, Y = snap2(y) - H / 2;
    if (!dim) { const n = 18; for (let i = 0; i < n; i++) { if ((i + Math.floor(t * 16)) % 3 === 0) continue; const a = i / n * TAU; dot(x + Math.cos(a) * 16, y - 2 + Math.sin(a) * 16, i % 4 ? '#ffe39a' : '#ffffff'); } }
    cellDraw(CROSS, dim ? CROSS_DIM : CROSS_PAL, X, Y, false, SEL ? SKD.oid(SEL) : 0);
    if (!dim && Math.floor(t * 10) % 3 === 0) star4(X + 8, Y + 10, 3, '#ffffff'); }
  function drawGround() {
    for (const Z of K.zones) { const t = Z.t;
      if (Z.k === 'rain') { const al = Math.min(1, t / 0.3, (Z.dur - t) / 0.3); ctx.globalAlpha = al; ring(Z.x, Z.y, Z.r, '#9ad8ff', 3, 0.6, Math.floor(t * 10)); ring(Z.x, Z.y, Z.r - 6, '#e8f8ff', 5, 0.6, -Math.floor(t * 10));
        for (let i = 0; i < 18; i++) { const ph = (t * 1.5 + i * 0.37) % 1, a = hsh(i, 1, 2) * TAU, r = Math.sqrt(hsh(i, 3, 4)) * Z.r * 0.9; if (t > 0.35 && t < 2.75) ring(Z.x + Math.cos(a) * r, Z.y + Math.sin(a) * r * 0.6, 2 + ph * 8, ph > 0.5 ? '#4f8dff' : '#9ad8ff', 0, 0.5); } ctx.globalAlpha = 1; }
      else if (Z.k === 'bell') { if (t < Z.land) { const q = t / Z.land, r = 40 * (1.3 - 0.3 * q); disk(Z.x, Z.y, Math.max(2, r * q), '#100c0a', 0.4); ring(Z.x, Z.y, r, Math.floor(t * 20) % 2 ? '#ffffff' : '#ffd34d', 2, 0.55); ring(Z.x, Z.y, r + 8, '#c9952a', 3, 0.55, Math.floor(t * 12)); }
        else { const al = Math.min(1, (Z.land + 2.0 - t) / 0.4); ctx.globalAlpha = al; for (const c of Z.cr || []) { let px = Z.x, py = Z.y; for (let j = 1; j <= 5; j++) { const r = c.l * j / 5, a = c.a + (hsh(c.s, j, 1) - 0.5) * 0.5, nx = Z.x + Math.cos(a) * r, ny = Z.y + Math.sin(a) * r * 0.6; pxLine(px, py, nx, ny, j < 3 ? '#100c0a' : '#2a2228'); px = nx; py = ny; } }
          if (Z.ringT && t - Z.ringT < 0.3) { const g = 1 - (t - Z.ringT) / 0.3; ctx.globalAlpha = al * g * 0.6; disk(Z.x, Z.y, 56, '#ffe39a', 0.5); }
          for (const w of Z.waves || []) { if (w.t < 0) continue; const p = w.t / w.max, r = lerp(w.r0, w.r1, 1 - (1 - p) * (1 - p)), n = Math.ceil(r * 1.4); ctx.globalAlpha = al * (1 - p * 0.7); for (let i = 0; i < n; i++) { if (p > 0.5 && (i >> 1) % 3 === 0) continue; const a = i / n * TAU; for (let d = 0; d < w.w; d++) SKD.pd(Z.x + Math.cos(a) * (r - d * 2), Z.y + Math.sin(a) * (r - d * 2) * 0.6, SKD.oid(w), d ? '#c9952a' : w.c); } }
          ctx.globalAlpha = 1; } }
      else if (Z.k === 'mochi') { if (t < 0.42) { const q = t / 0.42; disk(Z.x, Z.y, Math.max(2, 34 * q), '#100c0a', 0.35); ring(Z.x, Z.y, 40 * (1.3 - 0.3 * q), Math.floor(t * 20) % 2 ? '#ffffff' : '#fffaf0', 2, 0.55); }
        else { const al = Math.min(1, (3.6 - t) / 0.5); ctx.globalAlpha = al; const pr = t > 1.45 ? 56 : 40; disk(Z.x, Z.y, pr, '#d8ccb8', 0.5); disk(Z.x, Z.y - 2, pr - 4, '#f0e8d8', 0.5); disk(Z.x - 6, Z.y - 4, pr * 0.5, '#fffaf0', 0.5);
          for (const g of Z.goo || []) if (g.t > 0.3) { disk(g.tx, g.ty, g.s, '#d8ccb8', 0.6); disk(g.tx - 1, g.ty - 1, Math.max(2, g.s - 2), '#fffaf0', 0.6); } ctx.globalAlpha = 1; } }
      else if (Z.k === 'dawn') { const al = Math.min(1, t / 0.3, (Z.dur - t) / 0.4), r = Z.r * Math.min(1, t / 0.3), rot = t * 0.7; ctx.globalAlpha = al;
        if (t > 0.3 && t < 2.5) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const a = -t * 1.6 + i / 6 * TAU; for (let s = 0; s < 3; s++) { ctx.globalAlpha = al * (0.5 - s * 0.14); pxLine(Z.x, Z.y, Z.x + Math.cos(a - s * 0.05) * r, Z.y + Math.sin(a - s * 0.05) * r * 0.6, s ? '#8a6420' : '#ffe39a'); } } ctx.restore(); ctx.globalAlpha = al; }
        ring(Z.x, Z.y, r + 10, '#c9952a', 0, 0.6); for (let i = 0; i < 24; i++) { const a = -rot * 0.7 + i / 24 * TAU, px = Z.x + Math.cos(a) * (r + 10), py = Z.y + Math.sin(a) * (r + 10) * 0.6; dot(px - 2, py - 2, i % 3 ? '#ffe39a' : '#ffffff', i % 3 ? 2 : 4); }
        ring(Z.x, Z.y, r, '#ffe39a', 0, 0.6); ring(Z.x, Z.y, r - 6, '#fffbe6', 3, 0.6, Math.floor(t * 10)); ring(Z.x, Z.y, r * 0.55, '#ffe39a', 2, 0.6); ring(Z.x, Z.y, r * 0.3, '#fffbe6', 0, 0.6);
        for (let i = 0; i < 8; i++) { const a = rot + i / 8 * TAU, b = rot + (i + 3) / 8 * TAU; pxLine(Z.x + Math.cos(a) * r, Z.y + Math.sin(a) * r * 0.6, Z.x + Math.cos(b) * r, Z.y + Math.sin(b) * r * 0.6, i % 2 ? '#c9952a' : '#ffd34d'); }
        for (let i = 0; i < 6; i++) { const a = -rot * 1.4 + i / 6 * TAU, b = -rot * 1.4 + (i + 2) / 6 * TAU, q = r * 0.55; pxLine(Z.x + Math.cos(a) * q, Z.y + Math.sin(a) * q * 0.6, Z.x + Math.cos(b) * q, Z.y + Math.sin(b) * q * 0.6, '#fffbe6'); }
        for (let i = 0; i < 8; i++) { const a = rot + i / 8 * TAU; star4(Z.x + Math.cos(a) * r, Z.y + Math.sin(a) * r * 0.6, Math.floor(t * 12 + i) % 2 ? 6 : 4, '#ffe39a'); }
        disk(Z.x, Z.y, 8 + Math.sin(t * 10) * 2, '#fffbe6', 0.6); ctx.globalAlpha = 1; }
      else if (Z.k === 'spear' && t < Z.land) { const q = t / Z.land, r = 80 * (1.25 - 0.25 * q); ring(Z.x, Z.y, r, q > 0.7 && Math.floor(t * 24) % 2 ? '#ffffff' : '#ffe39a', 2, 0.55); ring(Z.x, Z.y, r * 0.6, '#fffbe6', 3, 0.55, Math.floor(t * 12)); ring(Z.x, Z.y, r * 0.25, '#ffe39a', 0, 0.55); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + t * 3; pxLine(Z.x + Math.cos(a) * r * 0.3, Z.y + Math.sin(a) * r * 0.18, Z.x + Math.cos(a) * r * 0.9, Z.y + Math.sin(a) * r * 0.54, '#ffe39a'); } }
      else if (Z.k === 'spear' && t >= Z.land) { const al = Math.min(1, (Z.land + 1.8 - t) / 0.4); ctx.globalAlpha = al;
        for (const c of Z.cr || []) { let px = Z.x, py = Z.y; for (let j = 1; j <= 5; j++) { const r = c.l * j / 5, a = c.a + (hsh(c.s, j, 1) - 0.5) * 0.5, nx = Z.x + Math.cos(a) * r, ny = Z.y + Math.sin(a) * r * 0.6; pxLine(px, py, nx, ny, '#100c0a'); if (j > 1) pxLine(px, py - 2, nx, ny - 2, t < Z.land + 1.0 && Math.floor(t * 14) % 2 ? '#ffe39a' : '#5a4a20'); px = nx; py = ny; } }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const pu = 0.5 + 0.5 * Math.sin(t * 12); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, L = 130 * Math.min(1, (t - Z.land) * 5); ctx.globalAlpha = al * (0.4 + 0.4 * pu); pxLine(Z.x, Z.y, Z.x + Math.cos(a) * L, Z.y + Math.sin(a) * L * 0.6, '#ffe39a'); pxLine(Z.x, Z.y - 2, Z.x + Math.cos(a) * L * 0.7, Z.y - 2 + Math.sin(a) * L * 0.42, '#fffbe6'); } ctx.restore(); ctx.globalAlpha = 1; }
    }
  }
  function drawOver() { const P = G.player; if (SEL && SEL.bunny) { drawBunny(SEL); return; }
    if (SEL === 'guard') { const R = P.prs; if (!R || R.k !== 'pan' || !R.guard) return; const a = R.a, cx = P.x + Math.cos(a) * 18, cy = P.y - 10 + Math.sin(a) * 12, pu = Math.floor(R.t * 20) % 2; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = -8; i <= 8; i++) { const b = a + i * 0.12, r = 30 + (i % 2) * 2; dot(cx + Math.cos(b) * r - Math.cos(a) * 14, cy + Math.sin(b) * r * 0.8 - Math.sin(a) * 10, Math.abs(i) > 6 ? '#c9952a' : pu ? '#fff2b0' : '#ffd34d'); } ctx.restore(); return; }
    for (const Z of K.zones) { if (Z !== SEL) continue; const t = Z.t;
      if (Z.k === 'pillar') { const p = t / Z.dur, w = Math.max(2, Math.round(Z.w * (p < 0.15 ? p / 0.15 : 1 - (p - 0.15) * 0.9) / 2) * 2), top = Z.y - 150, id = SKD.oid(Z); // 빛기둥: 끊김 없이 이어지고 위로 갈수록 투명
        for (let yy = top; yy < Z.y; yy += 2) { const k = (yy - top) / (Z.y - top); ctx.globalAlpha = Math.min(1, 0.15 + k * 1.3); run(Z.x - w - 2, yy, id, '#c9952a', 2); run(Z.x + w, yy, id, '#c9952a', 2); run(Z.x - w, yy, id, '#ffe39a', w * 2); run(Z.x - 2, yy, id, '#ffffff', 4); } ctx.globalAlpha = 1;
        ring(Z.x, Z.y, Z.w + 6, '#fffbe6', 2, 0.55); ring(Z.x, Z.y, Z.w + 12, '#c9952a', 3, 0.55); }
      else if (Z.k === 'rain') { const al = Math.min(1, t / 0.3, Math.max(0, (3.0 - t) / 0.3)); if (al <= 0) continue; const gr = Math.min(1, t / 0.3), cy = Z.y - 100 + Math.sin(t * 2) * 2; ctx.globalAlpha = al; // 통통한 성수 구름 + 빗줄기
        for (const d of Z.drops) if (d.h > 0) { pxLine(d.x, Math.max(d.y - d.h - 12, cy + 14), d.x, d.y - d.h, d.h > 50 ? '#9ad8ff' : '#e8f8ff'); dot(d.x, d.y - d.h, '#ffffff'); }
        const PF = [[-48, 6, 11], [-30, 9, 15], [-9, 10, 17], [13, 9, 16], [33, 8, 14], [50, 5, 10], [-36, -6, 14], [-16, -12, 19], [8, -15, 21], [29, -7, 16], [45, -2, 11], [-2, -26, 13], [18, -24, 10]].map(([dx, dy, r], i) => [Z.x + dx * gr, cy + dy * gr + Math.sin(t * 2.4 + i) * 1.2, Math.max(2, r * gr + Math.sin(t * 3 + i * 1.7))]);
        for (const [x, y, r] of PF) disk(x, y, r + 2, '#3a4660', 0.7);
        for (const [x, y, r] of PF) disk(x, y, r, '#8a9ab8', 0.7);
        for (const [x, y, r] of PF) disk(x - 1, y - 3, Math.max(2, r - 2), '#c8d8f0', 0.7);
        for (const [x, y, r] of PF) disk(x - 3, y - 5, Math.max(2, r - 6), '#eaf4ff', 0.7);
        for (const [x, y, r] of PF) if (r > 12) disk(x - 5, y - 7, Math.max(2, r - 11), '#ffffff', 0.7);
        for (let xx = -50; xx <= 50; xx += 2) { const by = cy + 16 * gr + Math.round(Math.sin(xx * 0.3 + t * 3)); dot(Z.x + xx * gr, by, '#5a6a8c'); if (xx % 6 === 0) dot(Z.x + xx * gr, by + 2, '#9ad8ff'); } // 아랫면 그늘 + 맺힌 물방울
        for (let i = 0; i < 7; i++) { if (Math.floor(t * 8 + i) % 3) continue; star4(Z.x + (i - 3) * 18 * gr, cy - 18 + (i % 2) * 8, 3, i % 2 ? '#ffe39a' : '#ffffff'); }
        ctx.globalAlpha = 1; }
      else if (Z.k === 'bell') { if (t > Z.land + 2.0) continue; const fall = t < Z.land ? (1 - (t / Z.land) ** 2) * 260 : 0, rise = t > Z.land + 1.6 ? (t - Z.land - 1.6) / 0.4 : 0, rr = Z.ringT ? t - Z.ringT : 9, sway = rr < 0.4 ? Math.sin(rr * 36) * (1 - rr / 0.4) * (8 + (Z.ringN || 0) * 3) : 0;
        if (t < Z.land) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let j = 0; j < 6; j++) dot(Z.x + rand(-30, 30), Z.y - fall - 90 - j * 12, '#ffe39a', 2); ctx.restore(); }
        ctx.globalAlpha = 1 - rise; drawBell(Z.x, Z.y - fall - rise * 30, sway, rr < 0.08); ctx.globalAlpha = 1;
        if (rr < 0.4 && !rise) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const p = rr / 0.4; for (let i = 0; i < 3; i++) { const r = 50 + p * 50 + i * 14; for (let a = -2.6; a < -0.5; a += 0.08) { if ((Math.round(a * 20) + i) % 3 === 0) continue; dot(Z.x + Math.cos(a) * r, Z.y - 50 + Math.sin(a) * r * 0.7, i ? '#ffe39a' : '#ffffff'); dot(Z.x - Math.cos(a) * r, Z.y - 50 + Math.sin(a) * r * 0.7, i ? '#ffe39a' : '#ffffff'); } } ctx.restore(); } }
      else if (Z.k === 'reliq') { ctx.globalAlpha = t < Z.dur ? 1 : Math.max(0, 1 - (t - Z.dur) / 0.3); for (const r of Z.rs.slice().sort((a, b) => a.z - b.z)) { if (r.x == null) continue; drawCross(r.x, r.y, r.z < -0.3, t); if (r.z > 0.3) star4(r.x + 8, r.y - 14, Math.floor(t * 16) % 2 ? 4 : 2, '#ffe39a'); }
        ctx.globalAlpha = 1;
        if (t < Z.dur) { const n = 30; for (let i = 0; i < n; i++) { if ((i + Math.floor(t * 30)) % 3 === 0) continue; const a = i / n * TAU - t * 3; dot(P.x + Math.cos(a) * 38, P.y - 10 + Math.sin(a) * 23, '#c9952a'); } } }
      else if (Z.k === 'mochi') { if (t > 3.6) continue; // v3.22 하늘의 달떡은 그리지 않음
        let w, h, yo = 0; const sq = (u, A) => Math.exp(-u * 7) * Math.cos(u * 26) * A;
        if (t < 0.42) { const q = t / 0.42; yo = -(1 - q * q) * 240; w = 24; h = 40; }
        else if (t < 0.95) { const u = t - 0.42, air = Math.sin(Math.min(1, u / 0.53) * Math.PI); yo = -air * 34; const s = sq(u, 0.5); w = air > 0.25 ? 26 : 34 * (1 + s); h = air > 0.25 ? 36 : 1000 / w; }
        else if (t < 1.45) { const u = t - 0.95, air = Math.sin(Math.min(1, u / 0.5) * Math.PI); yo = -air * 18; const s = sq(u, 0.45); w = air > 0.25 ? 30 : 38 * (1 + s); h = air > 0.25 ? 32 : 1000 / w; }
        else { const u = t - 1.45, s = sq(u, 0.35); w = 44 * (1 + s) + Math.min(10, u * 4); h = Math.max(8, 760 / w - u * 3); }
        if (yo < -4 && t > 0.42) { const top = Z.y + yo - 2; for (const dx of [-10, 0, 10]) { for (let yy = top; yy < Z.y; yy += 2) dot(Z.x + dx + Math.sin((yy - top) * 0.15 + dx) * 2, yy, '#f0e8d8'); } } // 쭉 늘어나는 떡 실
        drawMochi(Z.x, Z.y + yo, w, h, t > 3.0 ? Math.max(0, 1 - (t - 3.0) / 0.6) : 1);
        for (const g of Z.goo) if (g.t < 0.3) { const q = g.t / 0.3; disk(lerp(g.x, g.tx, q), lerp(g.y, g.ty, q) - Math.sin(q * Math.PI) * 30, g.s, '#fffaf0', 1); } }
      else if (Z.k === 'dawn') { for (const m of Z.motes || []) { const k = 1 - m.t / m.max; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k; dot(m.x, m.y, k > 0.6 ? '#ffffff' : '#ffe39a', k > 0.7 ? 4 : 2); ctx.restore(); }
        if (Z.bt && t - Z.bt < 0.45) { const p = (t - Z.bt) / 0.45, r = 20 + p * 90; ctx.save(); ctx.globalAlpha = 1 - p; disk(Z.x, Z.y - 40, r, '#fffbe6', 0.8); disk(Z.x, Z.y - 40, r * 0.6, '#ffffff', 0.8); ctx.restore(); } }
      else if (Z.k === 'spear') { const a = Math.atan2(Z.y - Z.sy, Z.x - Z.sx), fade = t > Z.land + 1.4 ? Math.max(0, 1 - (t - Z.land - 1.4) / 0.4) : 1;
        if (t < Z.land) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const H = Z.hist || []; for (let i = 1; i < H.length; i++) { const k = i / H.length; ctx.globalAlpha = k; for (let j = -2; j <= 2; j++) pxLine(H[i - 1].x - Math.sin(a) * j * 2, H[i - 1].y + Math.cos(a) * j * 2, H[i].x - Math.sin(a) * j * 2, H[i].y + Math.cos(a) * j * 2, Math.abs(j) < 1 ? '#ffffff' : Math.abs(j) < 2 ? '#fffbe6' : '#c9952a'); } ctx.restore(); ctx.globalAlpha = 1;
          if (Z.tx != null) drawSpearRot(Z.tx, Z.ty, a + Math.PI, 1.3, null, true); }
        else { const sink = 14, tx = Z.x + Math.cos(a) * sink, ty = Z.y + Math.sin(a) * sink; ctx.globalAlpha = fade; drawSpearRot(tx, ty, a + Math.PI, 1.3, Z.y + 1, t < Z.land + 0.3); ctx.globalAlpha = 1;
          if (t < Z.land + 0.8) { const p = (t - Z.land) / 0.8; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const w = Math.max(2, Math.round(22 * (1 - p) / 2) * 2); for (let yy = Z.y - 240; yy < Z.y; yy += 2) { ctx.globalAlpha = Math.min(1, 0.15 + (1 - (Z.y - yy) / 240) * 1.3); run(Z.x - w, yy, SKD.oid(Z), '#c9952a', w * 2); run(Z.x - w / 2, yy, SKD.oid(Z), '#fffbe6', w); } ctx.globalAlpha = 1; ctx.restore(); } } }
    }
  }
  SKD.add(ents => { if (!G) return; const P = G.player, one = it => SKD.one(drawOver, v => SEL = v, it);
    if (P && P.prs && P.prs.k === 'pan') ents.push({ y: P.y + 2, d: one('guard') });
    for (const Z of K.zones) { if (Z.k === 'bunny') { for (const b of Z.bs || []) if (!b.dead) { b.bunny = true; ents.push({ y: b.y, d: one(b) }); } continue; } ents.push({ y: Z.k === 'reliq' ? P.y + 1 : Z.k === 'rain' ? Z.y - 200 : Z.k === 'dawn' ? P.y + 1 : Z.y + 1, d: one(Z) }); } });
  const _dgg = drawGearGround, gd = SKD.ground(drawGround); drawGearGround = function () { _dgg(); ctx.save(); gd(); ctx.restore(); };
  const _woh = weaponOnHit; weaponOnHit = function (e, o, crit) { _woh(e, o, crit); const P = G.player; if (G.cls === 'priest' && o && o.basic && wSkill() === 'whip' && P.state === 'attack' && P.combo === 2 && !e.dead) { if (!(e.bleedT > 0)) gxSpurt(e, 8, o.ang || 0); e.bleedT = 3; if (!(e.bleedTick > 0)) e.bleedTick = 0.5; } };
  const _ie = itemExtra;
  itemExtra = function (it, cls) { const base = _ie(it, cls); if (!it || it.wk == null || it.cls !== 'priest') return base;
    const sk = (wcat('priest')[it.wk] || {}).sk, D = DEF[sk]; if (!D) return base;
    return base + `<div class="fx">우클릭 「${D.n}」 · 쿨타임 ${D.cd}초 — ${D.d}${SHD}</div>`; };

  return SKD.wrapAll({ start, update, tick, def, DEF });
})();
