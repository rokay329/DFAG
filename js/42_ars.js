'use strict';
// ==================================================================================================
// 잿빛 왕관 원정대 — 42_ars.js : v3.22 어세신 무기별 우클릭 기술 (41_krs.js 기사와 같은 방식)
//  · 레어 · 유니크 · 레전더리 어세신 무기는 무기마다 고유한 우클릭 기술을 씀 (커먼 · 초록 무기는 기본 「그림자 도약」)
//  · 쿨타임은 무기마다 따로 돎 (41_krs.js KRS.tick이 함께 관리)
//  · 그림자 사슬낫: 우클릭 「그림자 사슬」로 옮기고 새 고유 효과(3타 사슬 휘두르기)를 붙임
//  · 쌍둥이 송곳니: 「그림자 도약」을 쓰던 고유 효과를 우클릭 기술 기준으로 바꿈
//  · 연출은 모두 2px 칸 · 도트 선 · 도트 고리 (KRS.FXK 도우미 공유)
// ==================================================================================================
const ARS = (() => {
  const DEF = {
    claw: { n: '냥냥 난타', cd: 7, d: '앞으로 뛰어들며 발톱으로 쉴 새 없이 할퀸 뒤, 마지막에 크게 세 줄로 찢습니다. 마지막 공격은 출혈을 2중첩 부여합니다.' },
    mackerel: { n: '찰싹 연타', cd: 7, d: '고등어로 네 번 연달아 후려칩니다. 칠수록 점점 세게 밀쳐내고, 마지막 한 방은 적을 멀리 날려 보내며 생선 뼈를 흩뿌립니다.' },
    sickle: { n: '사신의 원무', cd: 8, d: '쌍낫을 던져 2초 동안 몸 주위를 빙글빙글 돌게 합니다. 낫은 점점 넓게 돌며 닿는 적을 계속 베고, 끝나면 손으로 돌아옵니다.' },
    fan: { n: '회오리 부채', cd: 8, d: '부채를 크게 휘둘러 앞으로 나아가는 회오리를 일으킵니다. 회오리는 적을 빨아들이며 계속 피해를 주고 투사체를 지우며, 끝날 때 터져 적을 밀쳐냅니다.' },
    needle: { n: '바느질', cd: 9, d: '앞쪽의 적을 최대 5명까지 차례로 꿰뚫으며 순간 이동합니다. 마지막에 실을 당겨 꿰인 적을 한곳으로 모으고 1.2초 동안 묶습니다.' },
    kusari: { n: '그림자 사슬', cd: 8, d: '사슬낫을 길게 던져 일직선 위의 적을 최대 4명까지 한 번에 꿰어 겁니다. 작은 적은 모두 끌어오고, 큰 적이 걸리면 내가 그쪽으로 끌려갑니다. 도착하면 사슬낫을 크게 휘둘러 주변을 벱니다.' },
    yarn: { n: '털실 그물', cd: 9, d: '털실 공을 던져 떨어진 자리에 3초 동안 털실 그물을 펼칩니다. 그물 안의 적은 묶였다가 크게 느려지고, 그물이 끊어질 때 피해를 받습니다.' },
    moons: { n: '월식', cd: 9, d: '은달과 흑달을 양쪽으로 던집니다. 두 달이 조준한 지점에서 겹치면 1초 동안 검은 달이 떠 주변 적을 빨아들이며 피해를 주고, 마지막에 폭발합니다.' },
    fangs2: { n: '박쥐 떼', cd: 10, d: '박쥐 떼로 흩어져 조준한 방향으로 날아가며 지나가는 적을 물어 출혈을 일으킵니다. 다시 모이며 핏빛 X자로 베고, 이 공격은 반드시 치명타가 됩니다.' },
    nine: { n: '아홉 생', cd: 12, d: '주변의 적 사이를 아홉 번 순간 이동하며 벱니다. 벤 자리에 남은 혼불 아홉 개가 모여들어 크게 폭발합니다.' },
  };
  for (const k in DEF) SK_META[k] = Object.assign(SK_META[k] || {}, { K: DEF[k].n, KD: DEF[k].d });
  const K = { g: null, slashes: [], threads: [], webs: [], bats: [], souls: [], dark: 0, darkMax: 0 };
  const def = () => (G && G.cls === 'ranger' ? DEF[wSkill()] || null : null);
  const FXK = KRS.FXK, lerp = (a, b, t) => a + (b - a) * t;
  const big = e => e.type === 'boss' || isElite(e) || isSemi(e) || isDummy(e);
  const live = e => e && !e.dead && e.type !== 'flag';
  const foes = () => G.enemies.filter(live);
  const aimPt = (P, maxD) => { let tx, ty; if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; } else { tx = P.x + Math.cos(P.ang) * maxD; ty = P.y + Math.sin(P.ang) * maxD; }
    const d = Math.hypot(tx - P.x, ty - P.y); if (d > maxD) { tx = P.x + (tx - P.x) / d * maxD; ty = P.y + (ty - P.y) / d * maxD; }
    return { x: clamp(tx, A.x0 + 16, A.x1 - 16), y: clamp(ty, A.y0 + 16, A.y1 - 16) }; };
  const hands = P => ({ fx: P.x + P.face * 7, fy: P.y - 5, bx: P.x - P.face * 7, by: P.y - 6 });
  const setRel = (P, d1, d2) => { P.blade = P.atkAng + P.sign * d1 * DEG; P.blade2 = P.atkAng - P.sign * (d2 == null ? d1 : d2) * DEG; };
  const out = k => (G.wproj || []).some(w => w.k === k);
  const bleed = (e, n, a) => { if (!(e.bleedT > 0)) gxSpurt(e, 8, a || 0); e.bleedT = 3; e.bleedN = Math.max(e.bleedN || 1, n); if (!(e.bleedTick > 0)) e.bleedTick = 0.5; };
  const moveP = (P, dx, dy) => { const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 3)); for (let i = 0; i < n; i++) { P.x += dx / n; P.y += dy / n; if (G.obs && G.obs.length) solveObs(P, P.r, false); } P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r); };
  const cone = (P, ang, reach, half, set) => foes().filter(e => !(set && set.has(e)) && dist(P, e) < reach + e.r && coneIn(P, e, ang, half));
  // 도트 칼자국: 초승달 모양 2px 칸 (뒤로 갈수록 가늘어짐)
  const slash = (x, y, ang, r, arc, c, c2, w, t, ry) => K.slashes.push({ x, y, ang, r, arc, c, c2: c2 || '#ffffff', w: w || 3, t, max: t, ry: ry || 0.75 });
  const pop = (x, y, v, c, s) => FXK.pop(x, y, v, c, s);
  const ghost = (P, pal, t) => G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0, t: t || 0.35, max: t || 0.35, map: 'hRanger', pal: pal || 'hRangerShadow', sc: 2 });

  // ---------------------------------------------------------------- 시작
  function start() {
    const D = def(); if (!D) return false;
    const P = G.player, k = wSkill();
    if ((k === 'sickle' && out('arsSickle'))) return false;
    P.atkAng = P.ang; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.sign = P.face; P.combo = 0; P.queued = false; P.trail = []; P.trail2 = [];
    P.ars = { k, t: 0, hit: new Set(), did: {}, dur: 0.6 };
    const R = P.ars, h = hands(P);
    P.state = 'ars';
    if (k === 'claw') { R.dur = 0.98; P.iframe = Math.max(P.iframe, 0.2); sfx('whoosh', 1.4); }
    else if (k === 'mackerel') { R.dur = 0.95; sfx('whoosh', 1.2); }
    else if (k === 'sickle') { R.dur = 0.22;
      for (const s of [0, 1]) (G.wproj = G.wproj || []).push({ k: 'arsSickle', s, t: 0, life: 2.0, a0: P.atkAng + s * Math.PI, x: P.x, y: P.y - 8, spin: 0, hitT: new Map(), hist: [] });
      FXK.burst(P.x, P.y - 8, ['#a070ff', '#d8c8ff', '#ffffff'], 10, 160, 0, true, 0.3); FXK.ring(P.x, P.y - 6, '#a070ff', 200, 0.3, 6); sfx('whoosh', 0.9); }
    else if (k === 'fan') { R.dur = 0.5; sfx('whoosh', 0.7); }
    else if (k === 'needle') { const T = cone(P, P.ang, 240, 0.75).sort((a, b) => dist(P, a) - dist(P, b)).slice(0, 5);
      R.tg = T; R.from = { x: P.x, y: P.y }; R.pts = [{ x: P.x, y: P.y - 8 }]; R.dur = T.length ? 0.08 + T.length * 0.1 + 0.55 : 0.5; P.iframe = Math.max(P.iframe, R.dur);
      K.threads.push(R.th = { pts: R.pts, t: R.dur + 1.2, max: R.dur + 1.2, tight: 0 }); sfx('dodge'); }
    else if (k === 'kusari') { // 일직선으로 길게 던져 최대 4명을 꿴다
      const L = foes().filter(e => { const d = dist(P, e), da = angDiff(angTo(P, e), P.ang); return d < 250 && Math.abs(da) < 1.2 && Math.abs(Math.sin(da) * d) < 22 + e.r; }).sort((a, b) => dist(P, a) - dist(P, b)).slice(0, 4);
      R.tg = L; R.bigT = L.find(big) || null; const far = L.length ? L[L.length - 1] : null, reach = far ? dist(P, far) + 10 : 200;
      R.hx = h.fx; R.hy = h.fy; R.tx = P.x + Math.cos(P.ang) * reach; R.ty = P.y - 8 + Math.sin(P.ang) * reach * 0.8; R.dur = L.length ? 0.78 : 0.4; P.iframe = Math.max(P.iframe, 0.45); sfx('bolt', 0.6); }
    else if (k === 'yarn') { R.dur = 0.28; const T = aimPt(P, 170);
      (G.wproj = G.wproj || []).push({ k: 'arsYarn', x0: h.fx, y0: h.fy - 4, tx: T.x, ty: T.y, x: h.fx, y: h.fy, t: 0, fly: 0.42, spin: 0 }); sfx('whoosh', 1.1); }
    else if (k === 'moons') { R.dur = 0.3; const T = aimPt(P, 190), id = Math.random();
      for (const s of [-1, 1]) (G.wproj = G.wproj || []).push({ k: 'arsMoon', s, id, x0: P.x, y0: P.y - 10, tx: T.x, ty: T.y - 6, x: P.x, y: P.y - 10, t: 0, fly: 0.5, hit: new Set(), hist: [] });
      FXK.burst(P.x, P.y - 10, ['#e8eef8', '#5a4a8a', '#ffffff'], 10, 150, 0, true, 0.3); sfx('whoosh', 1.0); }
    else if (k === 'fangs2') { R.dur = 0.82; const T = aimPt(P, 210); R.tx = T.x; R.ty = T.y; R.sx = P.x; R.sy = P.y; P.iframe = Math.max(P.iframe, 0.9);
      K.bats = []; for (let i = 0; i < 16; i++) K.bats.push({ ox: rand(-14, 14), oy: rand(-16, 4), ph: rand(0, TAU), sp: rand(10, 16), x: P.x, y: P.y - 8 });
      smoke(P.x, P.y, 14); FXK.burst(P.x, P.y - 8, ['#c02030', '#3a0e14', '#ff3040'], 10, 170, 0, false, 0.4); sfx('dodge'); sfx('whoosh', 0.6); }
    else if (k === 'nine') { const L = foes().filter(e => dist(P, e) < 260).sort((a, b) => dist(P, a) - dist(P, b)).slice(0, 5);
      R.tg = L; R.sx = P.x; R.sy = P.y; R.dur = 1.42; R.pts = []; P.iframe = Math.max(P.iframe, 1.5); K.dark = K.darkMax = 1.5;
      FXK.flash('#0a0620', 0.1); sfx('awaken'); }
    return true;
  }

  // ---------------------------------------------------------------- 진행
  function update(dt) {
    const P = G.player, R = P.ars; if (!R) { P.state = 'idle'; return; }
    R.t += dt; const t = R.t, k = R.k, h = hands(P);
    P.arsFront = false; P.arsHide = false;
    if (k === 'claw') {
      if (t < 0.08) setRel(P, -120, -100);
      else { if (!R.did.lunge) { R.did.lunge = true; ghost(P, 'hRangerShadow', 0.25); dust(P.x, P.y, 6); }
        if (t < 0.2) moveP(P, Math.cos(P.atkAng) * 260 * dt, Math.sin(P.atkAng) * 200 * dt);
        if (t < 0.76) { P.arsFront = true; const n = Math.floor((t - 0.08) / 0.055);
          if (n !== R.n) { R.n = n; const fr = n % 2 === 0, a = P.atkAng + rand(-0.5, 0.5), rr = rand(12, 18), cx = P.x + Math.cos(P.atkAng) * 22 + rand(-6, 6), cy = P.y - 10 + Math.sin(P.atkAng) * 16 + rand(-6, 6);
            if (fr) P.blade = P.atkAng + P.sign * rand(-150, 150) * DEG; else P.blade2 = P.atkAng - P.sign * rand(-150, 150) * DEG;
            for (let j = -1; j <= 1; j++) slash(cx + Math.cos(a + Math.PI / 2) * j * 4, cy + Math.sin(a + Math.PI / 2) * j * 3, a + (fr ? 0 : Math.PI), rr, 1.2, j ? '#f0a0b0' : '#ffd6e0', '#ffffff', 2, 0.16);
            (fr ? P.trail : P.trail2).push({ a: fr ? P.blade : P.blade2, t: 0.1 });
            for (const e of cone(P, P.atkAng, 46, 0.95)) { damageEnemy(e, 0.22, { ang: P.atkAng, kb: big(e) ? 0 : 30, grogi: 2, gauge: 1 }); sparks(e.x, e.y - 12, P.atkAng, '#ffd6e0', 3); }
            if (n % 2 === 0) sfx('hit', 1.6 + rand(0, 0.4)); 
            FXK.light(cx, cy, 50, 0.4, '255,170,200', 0.06); addShake(1.2, P.atkAng); } }
        else { setRel(P, lerp(-150, 140, Math.min(1, (t - 0.76) / 0.06)), lerp(150, -140, Math.min(1, (t - 0.76) / 0.06))); P.arsFront = t < 0.86;
          if (!R.did.fin) { R.did.fin = true; const cx = P.x + Math.cos(P.atkAng) * 26, cy = P.y - 10 + Math.sin(P.atkAng) * 18;
            for (let j = -1; j <= 1; j++) slash(cx + Math.cos(P.atkAng + Math.PI / 2) * j * 7, cy + Math.sin(P.atkAng + Math.PI / 2) * j * 5, P.atkAng - Math.PI / 2 * P.sign, 30, 1.7, '#ff7aa0', '#ffffff', 4, 0.35);
            for (const e of cone(P, P.atkAng, 60, 1.1)) { damageEnemy(e, 1.3, { ang: P.atkAng, kb: big(e) ? 0 : 200, grogi: 12, heavy: true, gauge: 5, stagger: 0.4 }); bleed(e, 2, P.atkAng); FXK.ring(e.x, e.y - 10, '#ffb0c4', 160, 0.25, 4); }
            FXK.burst(cx, cy, ['#ffffff', '#ffb0c4', '#ff7aa0'], 14, 240, 0, true, 0.3); FXK.ring(cx, cy, '#ff9ab8', 260, 0.3, 8); FXK.rays(cx, cy, 8, 46, '#ffd6e0', 0.18, P.atkAng);
            FXK.light(cx, cy, 120, 0.9, '255,160,200', 0.25); FXK.punch(6, 0.03, 0.06, P.atkAng); sfx('heavy', 1.4); } } }
    } else if (k === 'mackerel') {
      const HIT = [0.12, 0.3, 0.48, 0.72], i = HIT.findIndex(x => t < x + 0.1), ci = i < 0 ? 3 : i, fr = ci % 2 === 0, base = ci === 0 ? 0 : HIT[ci - 1] + 0.1;
      const q = clamp((t - base) / (HIT[ci] - base), 0, 1), sw = q < 1 ? lerp(-140, -170, q) : lerp(-170, 120, Math.min(1, (t - HIT[ci]) / 0.06));
      if (fr) setRel(P, sw, 90); else setRel(P, 90, sw); P.arsFront = q >= 1;
      if (q >= 1 && !R.did['h' + ci]) { R.did['h' + ci] = true; const last = ci === 3, pw = [140, 190, 240, 440][ci], cx = P.x + Math.cos(P.atkAng) * 26, cy = P.y - 10 + Math.sin(P.atkAng) * 18;
        slash(cx, cy, P.atkAng + (fr ? -1 : 1) * Math.PI / 2 * P.sign, last ? 30 : 20, 1.6, '#6aa0a0', '#e8f4f0', last ? 5 : 3, 0.25);
        let any = false; for (const e of cone(P, P.atkAng, last ? 62 : 52, 1.05)) { any = true; damageEnemy(e, last ? 1.3 : 0.45, { ang: P.atkAng + (fr ? -0.4 : 0.4), kb: big(e) ? 0 : pw, grogi: last ? 14 : 5, heavy: last, gauge: last ? 5 : 2 });
          for (let j = 0; j < (last ? 12 : 5); j++) G.parts.push({ x: e.x, y: e.y - 12, vx: Math.cos(P.atkAng) * rand(60, 200) + rand(-60, 60), vy: rand(-180, -60), t: rand(0.3, 0.55), c: pick(['#9ad8e8', '#e8f8ff', '#5aa8c8']), g: 420 }); }
        sfx('hit', 1.9 - ci * 0.15); FXK.punch(2 + ci * 2, ci === 3 ? 0.03 : 0.01, last ? 0.07 : 0.02, P.atkAng);
        FXK.ring(cx, cy, '#bfe8f0', 140 + ci * 60, 0.22, 4); FXK.light(cx, cy, 60 + ci * 20, 0.6, '180,230,240', 0.1);
        if (last) { FXK.burst(cx, cy, ['#ffffff', '#e8e0c8', '#c8c0a0'], 16, 280, 300, false, 0.5); FXK.rays(cx, cy, 10, 56, '#e8f8ff', 0.2); FXK.flash('#e8fbff', 0.04); sfx('crunch', 1.4);
          for (let j = 0; j < 6; j++) { const a = P.atkAng + rand(-0.8, 0.8); G.fx.push({ kind: 'streak', px: true, x0: cx, y0: cy, x1: cx + Math.cos(a) * rand(30, 60), y1: cy + Math.sin(a) * rand(20, 40), t: 0.2, max: 0.2, c: '#e8e0c8' }); } } }
    } else if (k === 'sickle') { setRel(P, lerp(-60, 160, Math.min(1, t / 0.12))); P.arsFront = true;
    } else if (k === 'fan') {
      if (t < 0.2) setRel(P, lerp(-60, -170, t / 0.2), 80);
      else { setRel(P, lerp(-170, 150, Math.min(1, (t - 0.2) / 0.1)), 80); P.arsFront = t < 0.34; if (t < 0.32) P.trail.push({ a: P.blade, t: 0.2 });
        if (!R.did.go) { R.did.go = true; const x = P.x + Math.cos(P.atkAng) * 30, y = P.y + Math.sin(P.atkAng) * 22;
          (G.wproj = G.wproj || []).push({ k: 'arsTornado', x, y, ang: P.atkAng, t: 0, life: 1.6, sp: 115, tick: 0, spin: 0 });
          slash(P.x + Math.cos(P.atkAng) * 16, P.y - 10 + Math.sin(P.atkAng) * 12, P.atkAng, 34, 2.2, '#d8dce4', '#ffffff', 4, 0.3);
          for (let j = 0; j < 7; j++) { const a = P.atkAng + (j - 3) * 0.22; G.fx.push({ kind: 'streak', px: true, x0: P.x + Math.cos(a) * 20, y0: P.y - 10 + Math.sin(a) * 14, x1: P.x + Math.cos(a) * 64, y1: P.y - 10 + Math.sin(a) * 44, t: 0.18, max: 0.18, c: j % 2 ? '#a8b0bc' : '#e8ecf2' }); }
          FXK.punch(4, 0.015, 0.03, P.atkAng); sfx('whoosh', 0.6); sfx('bolt', 0.5); } }
    } else if (k === 'needle') {
      const n = R.tg.length;
      if (!n) { if (t < 0.25) { moveP(P, Math.cos(P.atkAng) * 440 * dt, Math.sin(P.atkAng) * 330 * dt); setRel(P, 0, 120); P.arsFront = true; R.pts[1] = { x: P.x, y: P.y - 8 };
          for (const e of cone(P, P.atkAng, 30, 1.4, R.hit)) { R.hit.add(e); damageEnemy(e, 0.9, { ang: P.atkAng, kb: 80, grogi: 6, gauge: 3 }); } } }
      else { const i = Math.floor((t - 0.08) / 0.1);
        if (t >= 0.08 && i < n && i !== R.i) { R.i = i; const e = R.tg[i];
          if (live(e)) { const from = { x: P.x, y: P.y }, a = angTo(from, e); P.x = clamp(e.x + Math.cos(a) * (e.r + 12), A.x0 + P.r, A.x1 - P.r); P.y = clamp(e.y + Math.sin(a) * (e.r + 12) * 0.8, A.y0 + P.r, A.y1 - P.r);
            P.atkAng = a; P.face = Math.cos(a) > 0 ? 1 : -1; P.sign = P.face; setRel(P, 180, 120);
            R.pts.push({ e, x: e.x, y: e.y - 10 }); ghost({ x: from.x, y: from.y, face: P.face }, 'hRangerShadow', 0.3);
            G.fx.push({ kind: 'streak', px: true, x0: from.x, y0: from.y - 10, x1: P.x, y1: P.y - 10, t: 0.12, max: 0.12, c: '#ffffff' });
            P.critNext = true; damageEnemy(e, 0.75, { ang: a, kb: 0, grogi: 8, gauge: 3 }); applySt(e, 'bind', 0.5);
            slash(e.x, e.y - 10, a, 14, 0.6, '#c0303a', '#ffffff', 2, 0.2); sparks(e.x, e.y - 12, a, '#ffffff', 6); FXK.ring(e.x, e.y - 10, '#ff6070', 140, 0.2, 3);
            FXK.light(e.x, e.y, 60, 0.6, '255,90,100', 0.1); sfx('hit', 1.3 + i * 0.1); addShake(2, a); } }
        const tp = 0.08 + n * 0.1 + 0.18;
        if (t >= tp && !R.did.pull) { R.did.pull = true; R.th.tight = 1; sfx('bolt', 1.4); sfx('heavy', 1.3); FXK.punch(6, 0.03, 0.05);
          const L = R.pts[R.pts.length - 1];
          for (const p of R.pts) { const e = p.e; if (!live(e)) continue; if (!big(e)) { e.pullTo = { x: L.x + rand(-14, 14), y: L.y + 10 + rand(-8, 8), t: 0.18 }; } }
          R.pullL = L; }
        if (R.did.pull) { for (const p of R.pts) { const e = p.e; if (!e || !e.pullTo) continue; const q = Math.min(1, dt / Math.max(0.01, e.pullTo.t)); e.x += (e.pullTo.x - e.x) * q; e.y += (e.pullTo.y - e.y) * q; e.pullTo.t -= dt; p.x = e.x; p.y = e.y - 10; if (e.pullTo.t <= 0) e.pullTo = null; } }
        if (t >= tp + 0.2 && !R.did.bind) { R.did.bind = true; const L = R.pullL;
          for (const p of R.pts) { const e = p.e; if (!live(e)) continue; damageEnemy(e, 0.6, { ang: 0, kb: 0, grogi: 10, heavy: true, gauge: 3 }); applySt(e, 'bind', 1.2);
            for (let j = -1; j <= 1; j += 2) slash(e.x, e.y - 10, j * 0.78 + Math.PI / 2, 10, 0.3, '#c0303a', '#ff9aa0', 2, 0.6); }
          FXK.ring(L.x, L.y, '#c0303a', 220, 0.35, 8); FXK.burst(L.x, L.y, ['#c0303a', '#ff6070', '#ffffff'], 14, 220, 0, true, 0.35); FXK.rays(L.x, L.y, 8, 50, '#ff8a90', 0.2);
          FXK.light(L.x, L.y, 130, 0.9, '255,80,90', 0.25); } }
    } else if (k === 'kusari') {
      const TT = 0.14, L = R.tg.filter(live), B = R.bigT && live(R.bigT) ? R.bigT : null;
      if (t < TT) { const q = t / TT; R.cx = lerp(R.hx, R.tx, q); R.cy = lerp(R.hy, R.ty, q); setRel(P, 0, 120); P.arsFront = true;
        for (const e of L) if (!R.hit.has(e) && Math.hypot(e.x - R.cx, e.y - 8 - R.cy) < 16 + e.r) { R.hit.add(e); damageEnemy(e, 0.5, { ang: angTo(e, P), kb: 0, grogi: 6, gauge: 2 }); sparks(e.x, e.y - 10, angTo(e, P), '#d8c8ff', 6); FXK.ring(e.x, e.y - 10, '#a070ff', 150, 0.22, 4); sfx('crunch', 1.1 + R.hit.size * 0.1); addShake(2, 0); applySt(e, 'stun', 0.5); } }
      else if (!R.tg.length) { const q = Math.min(1, (t - TT) / 0.16); R.cx = lerp(R.tx, h.fx, q); R.cy = lerp(R.ty, h.fy, q); if (q >= 1) R.cx = null; }
      else {
        if (!R.did.grab) { R.did.grab = true; R.px = P.x; R.py = P.y; for (const e of L) { e.kx0 = e.x; e.ky0 = e.y; } if (B) ghost(P, 'hRangerShadow', 0.3); FXK.punch(4, 0.015, 0.03); sfx('bolt', 1.2);
          if (B) { const a = angTo(B, { x: R.px, y: R.py }); R.dx = clamp(B.x + Math.cos(a) * (B.r + 14), A.x0 + P.r, A.x1 - P.r); R.dy = clamp(B.y + Math.sin(a) * (B.r + 14) * 0.8, A.y0 + P.r, A.y1 - P.r); } else { R.dx = P.x; R.dy = P.y; } }
        const PULL = 0.18;
        if (t < TT + PULL) { const q = easeOut((t - TT) / PULL);
          if (B) { P.x = lerp(R.px, R.dx, q); P.y = lerp(R.py, R.dy, q); P.arsHide = q > 0.15 && q < 0.85; G.fx.push({ kind: 'streak', px: true, x0: P.x, y0: P.y - 10, x1: lerp(R.px, R.dx, Math.max(0, q - 0.2)), y1: lerp(R.py, R.dy, Math.max(0, q - 0.2)) - 10, t: 0.08, max: 0.08, c: '#6a5a8a' }); }
          R.links = [];
          for (const e of L) { if (e === B) { R.links.push({ x: e.x, y: e.y - 8 }); continue; } const a = angTo({ x: R.dx, y: R.dy }, { x: e.kx0, y: e.ky0 }), gx = R.dx + Math.cos(a) * (P.r + e.r + 10), gy = R.dy + Math.sin(a) * (P.r + e.r + 10) * 0.8;
            e.x = lerp(e.kx0, gx, q); e.y = lerp(e.ky0, gy, q); e.vx = e.vy = 0; R.links.push({ x: e.x, y: e.y - 8 });
            if (Math.random() < 0.5) G.parts.push({ x: e.x, y: e.y - rand(4, 16), vx: rand(-20, 20), vy: rand(-20, 0), t: 0.3, c: pick(['#3a2a48', '#6a5a8a', '#120818']), g: 0 }); }
          R.cx = null; }
        else { R.links = null; R.cx = null; const q = Math.min(1, (t - TT - PULL) / 0.3); setRel(P, -180 + 540 * q, 360 * q); P.arsFront = true; P.trail.push({ a: P.blade, t: 0.15 }); P.trail2.push({ a: P.blade2, t: 0.15 });
          if (!R.did.spin) { R.did.spin = true;
            if (B) { const a = angTo(P, B), cx = B.x, cy = B.y - 12; for (const d of [-0.78, 0.78]) slash(cx, cy, a + Math.PI / 2 + d, 26, 0.01, '#a070ff', '#ffffff', 4, 0.32); xLine(cx, cy, a, 30, '#a070ff'); P.critNext = true; damageEnemy(B, 1.4, { ang: a, kb: 0, grogi: 14, heavy: true, gauge: 5, stagger: 0.5 }); applySt(B, 'stun', 0.4); }
            slash(P.x, P.y - 8, 0, 50, TAU * 0.95, '#a070ff', '#efe6ff', 4, 0.4, 0.55); slash(P.x, P.y - 8, 1, 38, TAU * 0.9, '#6a5a8a', '#d8c8ff', 3, 0.35, 0.55);
            FXK.ring(P.x, P.y - 6, '#a070ff', 300, 0.38, 12); FXK.burst(P.x, P.y - 8, ['#a070ff', '#d8c8ff', '#ffffff', '#3a2a48'], 18, 260, 0, true, 0.4); FXK.rays(P.x, P.y - 8, 10, 64, '#d8c8ff', 0.2);
            for (const o of foes()) if (dist(P, o) < 66 + o.r && o !== B) damageEnemy(o, 1.2, { ang: angTo(P, o), kb: big(o) ? 0 : 260, grogi: 12, heavy: true, gauge: 5 });
            FXK.punch(7, 0.03, 0.06); FXK.light(P.x, P.y, 140, 0.9, '170,120,255', 0.3); (L.length > 1 && pop(P.x, P.y - 40, L.length + '연쇄!', '#d8c8ff', 3)); sfx('whoosh', 0.7); sfx('heavy', 1.1); } } }
    } else if (k === 'yarn') { setRel(P, lerp(-150, 120, Math.min(1, t / 0.12)), 60); P.arsFront = t < 0.16;
    } else if (k === 'moons') { setRel(P, lerp(-150, 120, Math.min(1, t / 0.1)), lerp(150, -120, Math.min(1, t / 0.1))); P.arsFront = t < 0.16;
    } else if (k === 'fangs2') {
      const FLY = 0.62;
      if (t < FLY) { P.arsHide = true; const q = easeOut(t / FLY), nx = lerp(R.sx, R.tx, q), ny = lerp(R.sy, R.ty, q); moveP(P, nx - P.x, ny - P.y);
        if ((R.bt = (R.bt || 0) - dt) <= 0) { R.bt = 0.12; for (const e of foes()) if (Math.hypot(e.x - P.x, (e.y - P.y) / 0.8) < 30 + e.r) { damageEnemy(e, 0.35, { ang: angTo(P, e), kb: 0, grogi: 3, gauge: 2 }); bleed(e, 2, angTo(P, e)); G.parts.push({ x: e.x, y: e.y - 12, vx: rand(-60, 60), vy: rand(-90, -30), t: 0.4, c: pick(['#c02030', '#ff3040']), g: 300 }); } sfx('hit', 2.0); }
        if (Math.random() < 0.6) G.parts.push({ x: P.x + rand(-10, 10), y: P.y - rand(2, 18), vx: 0, vy: 20, t: 0.4, c: pick(['#3a0e14', '#6a1a22', '#c02030']), g: 0 });
        FXK.light(P.x, P.y, 50, 0.15, '255,60,80', 0.04); }
      else { if (!R.did.x) { R.did.x = true; const a = P.atkAng, cx = P.x + Math.cos(a) * 10, cy = P.y - 10;
          smoke(P.x, P.y, 10); for (const d of [-0.78, 0.78]) slash(cx, cy, a + Math.PI / 2 + d, 36, 0.01, '#ff3040', '#ffffff', 5, 0.4); xLine(cx, cy, a, 44, '#ff3040');
          for (const e of foes()) if (dist(P, e) < 56 + e.r) { P.critNext = true; damageEnemy(e, 1.6, { ang: angTo(P, e), kb: big(e) ? 0 : 180, grogi: 14, heavy: true, gauge: 6 }); bleed(e, 3, angTo(P, e)); }
          FXK.burst(cx, cy, ['#ff3040', '#c02030', '#ffffff', '#3a0e14'], 18, 260, 0, true, 0.4); FXK.ring(cx, cy, '#ff3040', 300, 0.35, 10); FXK.rays(cx, cy, 12, 64, '#ff8090', 0.22);
          FXK.flash('#3a0008', 0.08); FXK.light(cx, cy, 150, 1, '255,50,70', 0.3); FXK.punch(8, 0.035, 0.08); sfx('heavy', 1.0); sfx('perfect'); }
        const q = Math.min(1, (t - FLY) / 0.12); setRel(P, -160 + 320 * q); P.arsFront = q < 1; }
    } else if (k === 'nine') {
      const T0 = 0.14, ST = 0.085, N = 9, i = Math.floor((t - T0) / ST);
      if (t >= T0 && i < N && i !== R.i) { R.i = i; const L = R.tg.filter(live), e = L.length ? L[i % L.length] : null, from = { x: P.x, y: P.y, face: P.face };
        let a; if (e) { a = rand(0, TAU); P.x = clamp(e.x + Math.cos(a) * (e.r + 16), A.x0 + P.r, A.x1 - P.r); P.y = clamp(e.y + Math.sin(a) * (e.r + 16) * 0.8, A.y0 + P.r, A.y1 - P.r); a = angTo(P, e); }
        else { a = i / N * TAU; P.x = clamp(R.sx + Math.cos(a) * 40, A.x0 + P.r, A.x1 - P.r); P.y = clamp(R.sy + Math.sin(a) * 30, A.y0 + P.r, A.y1 - P.r); a += Math.PI; }
        P.atkAng = a; P.face = Math.cos(a) > 0 ? 1 : -1; P.sign = P.face; setRel(P, 150, -150);
        ghost(from, 'hRangerGhost', 0.5); const cx = e ? e.x : P.x + Math.cos(a) * 24, cy = (e ? e.y : P.y) - 12;
        xLine(cx, cy, a + rand(-0.6, 0.6), 34, '#7af0ff'); slash(cx, cy, a + Math.PI / 2, 22, 1.2, '#7af0ff', '#ffffff', 3, 0.25);
        if (e) { damageEnemy(e, 0.6, { ang: a, kb: 0, grogi: 6, gauge: 2 }); sparks(e.x, e.y - 12, a, '#e8ffff', 5); }
        R.pts.push({ x: cx, y: cy }); K.souls.push({ x: cx, y: cy, t: 0, i, gx: 0, gy: 0 });
        pop(cx, cy - 24, String(i + 1), '#bff8ff', 1 + (i === N - 1 ? 2 : 0)); sfx('whoosh', 1.2 + i * 0.06); addShake(2, a); FXK.light(cx, cy, 60, 0.6, '120,240,255', 0.12); }
      const TB = T0 + N * ST + 0.12;
      if (t >= T0 + N * ST && !R.did.back) { R.did.back = true; ghost(P, 'hRangerGhost', 0.4); P.x = R.sx; P.y = R.sy; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.sign = P.face; P.atkAng = P.ang; smoke(P.x, P.y, 10); for (const s of K.souls) { s.gx = P.x; s.gy = P.y - 12; s.go = true; } }
      if (R.did.back) setRel(P, -120 + Math.min(1, (t - TB) / 0.1) * 0, 120);
      if (t >= TB + 0.2 && !R.did.boom) { R.did.boom = true; K.souls = []; const cx = P.x, cy = P.y - 10;
        for (const e of foes()) if (dist(P, e) < 84 + e.r) damageEnemy(e, 1.5, { ang: angTo(P, e), kb: big(e) ? 0 : 260, grogi: 16, heavy: true, gauge: 8 });
        FXK.ring(cx, cy, '#7af0ff', 380, 0.4, 10); FXK.ring(cx, cy, '#ffffff', 240, 0.3, 6); FXK.burst(cx, cy, ['#7af0ff', '#bff8ff', '#ffffff', '#6a5ab8'], 22, 300, 0, true, 0.45); FXK.rays(cx, cy, 14, 80, '#bff8ff', 0.25);
        FXK.flash('#bff8ff', 0.08); FXK.light(cx, cy, 180, 1, '120,240,255', 0.4); FXK.punch(10, 0.04, 0.1); sfx('heavy', 0.8); sfx('perfect'); }
    }
    if (t >= R.dur) end(P);
  }
  function end(P) { const k = P.ars && P.ars.k; P.state = 'idle'; P.arsFront = false; P.arsHide = false; P.ars = null; P.t = 0;
    if (k === 'fangs2' || (k && wSkill() === 'fangs2')) { P.stealthT = 2; smoke(P.x, P.y, 10); } }
  const xLine = (x, y, a, L, c) => { for (const d of [-0.78, 0.78]) { const b = a + Math.PI / 2 + d; G.fx.push({ kind: 'streak', px: true, x0: x - Math.cos(b) * L * 0.5, y0: y - Math.sin(b) * L * 0.4, x1: x + Math.cos(b) * L * 0.5, y1: y + Math.sin(b) * L * 0.4, t: 0.2, max: 0.2, c }); } };

  // ---------------------------------------------------------------- 던진 무기 · 회오리 · 그물
  function tick(dt) {
    if (K.g !== G) { K.g = G; K.slashes = []; K.threads = []; K.webs = []; K.bats = []; K.souls = []; K.dark = 0; }
    const P = G.player; if (!P) return;
    for (const s of K.slashes) s.t -= dt; K.slashes = K.slashes.filter(s => s.t > 0);
    for (const s of K.threads) s.t -= dt; K.threads = K.threads.filter(s => s.t > 0);
    K.dark = Math.max(0, K.dark - dt);
    for (const s of K.souls) { s.t += dt; if (s.go) { s.x += (s.gx - s.x) * Math.min(1, dt * 12); s.y += (s.gy - s.y) * Math.min(1, dt * 12); } if (Math.random() < 0.4) G.parts.push({ x: s.x + rand(-2, 2), y: s.y, vx: 0, vy: -30, t: 0.3, c: pick(['#7af0ff', '#bff8ff']), g: 0, glow: true }); }
    // 그물
    for (const W of K.webs) { W.t -= dt; W.age += dt;
      for (const e of foes()) if (Math.hypot(e.x - W.x, (e.y - W.y) / 0.55) < W.r) { e.st = e.st || {}; e.st.slowT = Math.max(e.st.slowT || 0, 0.25); e.st.slowK = Math.min(e.st.slowK || 1, 0.35); }
      if (W.t <= 0) { for (const e of foes()) if (Math.hypot(e.x - W.x, (e.y - W.y) / 0.55) < W.r + 6) { damageEnemy(e, 1.1, { ang: angTo(W, e), kb: big(e) ? 0 : 120, grogi: 10, heavy: true, gauge: 4 }); }
        FXK.burst(W.x, W.y - 4, ['#ff9ab0', '#e85a7a', '#ffd0dc'], 16, 240, 200, false, 0.5); FXK.ring(W.x, W.y - 2, '#ff9ab0', 260, 0.3, W.r * 0.6); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; G.fx.push({ kind: 'streak', px: true, x0: W.x + Math.cos(a) * 10, y0: W.y + Math.sin(a) * 6, x1: W.x + Math.cos(a) * (W.r + 10), y1: W.y + Math.sin(a) * (W.r + 10) * 0.55, t: 0.16, max: 0.16, c: '#ffd0dc' }); }
        sfx('crunch', 1.6); FXK.punch(4, 0.015, 0.03); } }
    K.webs = K.webs.filter(W => W.t > 0);
    tickEclipse(dt);
    // 박쥐: 플레이어 주위로 맴돎
    if (P.state === 'ars' && P.ars && P.ars.k === 'fangs2' && P.arsHide) for (const b of K.bats) { b.ph += dt * b.sp; const tx = P.x + b.ox + Math.cos(b.ph) * 8, ty = P.y - 8 + b.oy + Math.sin(b.ph * 1.3) * 6; b.x += (tx - b.x) * Math.min(1, dt * 14); b.y += (ty - b.y) * Math.min(1, dt * 14); }
    else K.bats = [];
    if (G.cls === 'ranger') { const sk = wSkill(); if (G.wproj && G.wproj.length) G.wproj = G.wproj.filter(w => !(w.k === 'arsSickle' && sk !== 'sickle')); P.arsHideW = out('arsSickle'); }
    else P.arsHideW = false;
    tickProj(dt);
  }
  function tickProj(dt) {
    if (!G.wproj || !G.wproj.length) return; const P = G.player;
    for (const w of G.wproj) {
      if (w.k === 'arsSickle') { w.t += dt; const L = w.life, rr = w.t < 0.45 ? lerp(10, 56, easeOut(w.t / 0.45)) : w.t > L - 0.3 ? lerp(56, 6, (w.t - (L - 0.3)) / 0.3) : 56 + Math.sin(w.t * 6) * 4, a = w.a0 + w.t * 8.5;
        w.x = P.x + Math.cos(a) * rr; w.y = P.y - 8 + Math.sin(a) * rr * 0.6; w.spin += dt * 30; w.hist.push({ x: w.x, y: w.y, t: 0.14 }); for (const q of w.hist) q.t -= dt; w.hist = w.hist.filter(q => q.t > 0);
        for (const [e, c] of w.hitT) { if (c - dt <= 0) w.hitT.delete(e); else w.hitT.set(e, c - dt); }
        for (const e of foes()) { if (w.hitT.has(e)) continue; if (Math.hypot(e.x - w.x, (e.y - 8 - w.y) / 0.8) < 12 + e.r) { w.hitT.set(e, 0.28); const oa = angTo(P, e); damageEnemy(e, 0.45, { ang: oa, kb: big(e) ? 0 : 90, grogi: 3, gauge: 1 }); sparks(e.x, e.y - 12, oa, '#d8c8ff', 4); FXK.ring(e.x, e.y - 10, '#a070ff', 120, 0.18, 3); sfx('hit', 1.5); } }
        if (Math.random() < 0.5) G.parts.push({ x: w.x, y: w.y, vx: rand(-20, 20), vy: rand(-20, 10), t: 0.3, c: pick(['#a070ff', '#d8c8ff', '#3a2a48']), g: 0, glow: true });
        FXK.light(w.x, w.y, 34, 0.12, '170,120,255', 0.04);
        if (w.t >= L) { w.dead = true; if (w.s === 0) { FXK.burst(P.x, P.y - 8, ['#d8c8ff', '#ffffff'], 8, 120, 0, true, 0.25); FXK.ring(P.x, P.y - 6, '#d8c8ff', 120, 0.2, 4); sfx('block', 1.5); } } }
      else if (w.k === 'arsTornado') { w.t += dt; w.spin += dt * 14; const sp = w.sp * (w.t < 0.2 ? 1.6 : 1); w.x += Math.cos(w.ang) * sp * dt; w.y += Math.sin(w.ang) * sp * dt * 0.8;
        if (segSolid(w.x - Math.cos(w.ang) * 4, w.y, w.x, w.y, 4) || w.x < A.x0 + 10 || w.x > A.x1 - 10 || w.y < A.y0 + 10 || w.y > A.y1 - 10) w.t = Math.max(w.t, w.life);
        const RR = 50 + Math.min(1, w.t / 0.3) * 10;
        for (const e of foes()) { const d = Math.hypot(e.x - w.x, (e.y - w.y) / 0.6); if (d < RR + e.r && !big(e)) { const q = Math.min(1, dt * 5); e.x += (w.x - e.x) * q * 0.9 + Math.cos(w.ang) * sp * dt; e.y += (w.y - e.y) * q * 0.9 + Math.sin(w.ang) * sp * dt * 0.8; } }
        if ((w.tick -= dt) <= 0) { w.tick = 0.18; for (const e of foes()) if (Math.hypot(e.x - w.x, (e.y - w.y) / 0.6) < 34 + e.r) { damageEnemy(e, 0.28, { ang: w.ang, kb: 0, grogi: 3, gauge: 1 }); sparks(e.x, e.y - 14, rand(0, TAU), '#e8ecf2', 1); } sfx('whoosh', 1.6 + rand(0, 0.3)); }
        for (const pr of (G.eproj || [])) if (pr.t > 0 && Math.hypot(pr.x - w.x, pr.y - (w.y - 16)) < 36) { pr.t = 0; sparks(pr.x, pr.y, rand(0, TAU), '#ffffff', 4); }
        for (let i = 0; i < 2; i++) { const a = rand(0, TAU), r = rand(20, 44); G.parts.push({ x: w.x + Math.cos(a) * r, y: w.y - rand(0, 40), vx: -Math.sin(a) * 160, vy: rand(-80, -30), t: 0.3, c: pick(['#a8b0bc', '#d8dce4', '#8a7c70', '#b0242c']), g: 0 }); }
        dust(w.x, w.y, 1); FXK.light(w.x, w.y - 26, 100, 0.22, '220,225,235', 0.03);
        if (w.t >= w.life) { w.dead = true; for (const e of foes()) if (Math.hypot(e.x - w.x, (e.y - w.y) / 0.6) < 60 + e.r) damageEnemy(e, 0.9, { ang: angTo(w, e), kb: big(e) ? 0 : 300, grogi: 10, heavy: true, gauge: 4 });
          FXK.ring(w.x, w.y - 10, '#e8ecf2', 320, 0.35, 10); FXK.burst(w.x, w.y - 16, ['#ffffff', '#d8dce4', '#b0242c'], 18, 280, 0, false, 0.45); FXK.rays(w.x, w.y - 12, 10, 60, '#e8ecf2', 0.2); dust(w.x, w.y, 12); FXK.punch(5, 0.02, 0.04); sfx('heavy', 1.3); } }
      else if (w.k === 'arsYarn') { w.t += dt; const q = Math.min(1, w.t / w.fly); w.x = lerp(w.x0, w.tx, q); w.y = lerp(w.y0, w.ty, q) - Math.sin(q * Math.PI) * 50; w.spin += dt * 16;
        if (Math.random() < 0.6) G.parts.push({ x: w.x, y: w.y, vx: 0, vy: 0, t: 0.35, c: pick(['#e85a7a', '#ff9ab0']), g: 0 });
        if (q >= 1) { w.dead = true; const W = { x: w.tx, y: w.ty, r: 58, t: 3, max: 3, age: 0, seed: Math.random() * 99 }; K.webs.push(W);
          for (const e of foes()) if (Math.hypot(e.x - W.x, (e.y - W.y) / 0.55) < W.r) { applySt(e, 'bind', 1.0); damageEnemy(e, 0.5, { ang: angTo(W, e), kb: 0, grogi: 6, gauge: 2 }); }
          FXK.ring(W.x, W.y - 2, '#ff9ab0', 240, 0.3, 8); FXK.burst(W.x, W.y - 6, ['#ff9ab0', '#e85a7a', '#ffd0dc'], 14, 200, 0, false, 0.35); FXK.light(W.x, W.y, 120, 0.8, '255,150,180', 0.3); sfx('crunch', 1.3); FXK.punch(3, 0.01, 0.02); } }
      else if (w.k === 'arsMoon') { w.t += dt; const q = Math.min(1, w.t / w.fly), dx = w.tx - w.x0, dy = w.ty - w.y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w.s, ny = dx / L * w.s, bend = Math.sin(q * Math.PI) * Math.min(90, L * 0.5);
        w.x = w.x0 + dx * q + nx * bend; w.y = w.y0 + dy * q + ny * bend * 0.7; w.hist.push({ x: w.x, y: w.y, t: 0.22 }); for (const o of w.hist) o.t -= dt; w.hist = w.hist.filter(o => o.t > 0);
        for (const e of foes()) if (!w.hit.has(e) && Math.hypot(e.x - w.x, e.y - 10 - w.y) < 14 + e.r) { w.hit.add(e); const S = e.st = e.st || {}; if (w.s < 0) S.moonS = true; else S.moonD = true; S.moonT = 4; damageEnemy(e, 0.5, { ang: angTo({ x: w.x, y: w.y }, e), kb: 0, grogi: 4, gauge: 2 }); sparks(e.x, e.y - 12, 0, w.s < 0 ? '#e8eef8' : '#a090e0', 5); }
        FXK.light(w.x, w.y, 40, 0.15, w.s < 0 ? '220,230,255' : '140,110,220', 0.04);
        if (q >= 1) { w.dead = true; if (w.s > 0) eclipse(w.tx, w.ty); } }
    }
    G.wproj = G.wproj.filter(w => !w.dead);
  }
  function eclipse(x, y) {
    K.eclipse = { x, y, t: 0, dur: 1.0, tick: 0 };
    FXK.flash('#0a0618', 0.06); FXK.ring(x, y, '#e8eef8', 200, 0.3, 6); FXK.burst(x, y, ['#e8eef8', '#5a4a8a', '#ffffff'], 10, 160, 0, true, 0.3); sfx('bolt', 0.4); FXK.punch(4, 0.015, 0.03);
  }
  function tickEclipse(dt) { const E = K.eclipse; if (!E) return; E.t += dt;
    if (E.boom) { if (E.t > E.boom + 0.35) K.eclipse = null; return; }
    const RR = 120;
    for (const e of foes()) { const d = Math.hypot(e.x - E.x, e.y - 10 - E.y); if (d > RR + e.r || d < 6) continue; const k = big(e) ? 0.25 : 1, sp = (160 + (RR - d) * 2.2) * k * dt, a = Math.atan2(E.y + 10 - e.y, E.x - e.x); e.x += Math.cos(a) * Math.min(sp, d - 4); e.y += Math.sin(a) * Math.min(sp, d - 4); e.vx = e.vy = 0; }
    if ((E.tick -= dt) <= 0) { E.tick = 0.15; for (const e of foes()) if (Math.hypot(e.x - E.x, e.y - 10 - E.y) < 40 + e.r) { damageEnemy(e, 0.22, { ang: 0, kb: 0, grogi: 3, gauge: 1 }); const S = e.st = e.st || {}; S.moonS = S.moonD = true; S.moonT = 4; } sfx('hit', 0.6); }
    for (let i = 0; i < 3; i++) { const a = rand(0, TAU), r = rand(50, 110); G.parts.push({ x: E.x + Math.cos(a) * r, y: E.y + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * r * 3 - Math.sin(a) * 80, vy: -Math.sin(a) * r * 2.1 + Math.cos(a) * 56, t: 0.3, c: pick(['#e8eef8', '#a090e0', '#5a4a8a', '#2a2440']), g: 0, glow: true }); }
    FXK.light(E.x, E.y, 90, 0.18, '200,190,255', 0.03); addShake(0.8, 0);
    if (E.t >= E.dur) { E.boom = E.t; const x = E.x, y = E.y;
      for (const e of foes()) if (Math.hypot(e.x - x, (e.y - 10 - y) / 0.8) < 72 + e.r) { const S = e.st = e.st || {}; S.moonS = S.moonD = true; S.moonT = 4; damageEnemy(e, 1.8, { ang: angTo({ x, y }, e), kb: big(e) ? 0 : 300, grogi: 16, heavy: true, gauge: 6 }); }
      FXK.flash('#e8eef8', 0.08); FXK.ring(x, y, '#0e0a1c', 300, 0.4, 10); FXK.ring(x, y, '#e8eef8', 400, 0.45, 14); FXK.rays(x, y, 16, 84, '#e8eef8', 0.25);
      FXK.burst(x, y, ['#e8eef8', '#5a4a8a', '#ffffff', '#a090e0'], 22, 300, 0, true, 0.45); FXK.light(x, y, 180, 1, '220,230,255', 0.4); FXK.punch(10, 0.04, 0.09); sfx('heavy', 0.9); sfx('perfect'); } }

  // ---------------------------------------------------------------- 그리기 (모두 2px 칸)
  const dot = (x, y, c, s) => { let f; if (SKD.mask && (f = SKD.occ(x, y)) > 0) { const a = ctx.globalAlpha; ctx.globalAlpha = a * (1 - 0.7 * f); ctx.fillStyle = c; ctx.fillRect(snap2(x), snap2(y), s || 2, s || 2); ctx.globalAlpha = a; return; } ctx.fillStyle = c; ctx.fillRect(snap2(x), snap2(y), s || 2, s || 2); };
  function pxLine(x0, y0, x1, y1, c, gap) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2)); ctx.fillStyle = c; for (let i = 0; i <= n; i++) { if (gap && i % gap === gap - 1) continue; ctx.fillRect(snap2(x0 + (x1 - x0) * i / n), snap2(y0 + (y1 - y0) * i / n), 2, 2); } }
  function drawSlash(s) { const p = 1 - s.t / s.max, grow = Math.min(1, p * 3), arc = s.arc * grow, n = Math.max(6, Math.ceil(s.r * Math.max(arc, 0.4) / 2)), a0 = s.ang - s.arc / 2;
    if (s.arc < 0.05) return;
    for (let i = 0; i <= n; i++) { const u = i / n, a = a0 + arc * u, w = Math.max(1, Math.round(s.w * Math.sin(u * Math.PI) * (1 - p * 0.6))), fade = p > 0.6 && ((i + Math.floor(p * 20)) % 3 === 0); if (fade) continue;
      for (let j = 0; j < w; j++) { const rr = s.r - j * 2, x = s.x + Math.cos(a) * rr, y = s.y + Math.sin(a) * rr * s.ry; SKD.pd(x, y, SKD.oid(s), j === 0 ? s.c2 : s.c); } } }
  function drawGround() {
    for (const W of K.webs) { const al = Math.min(1, W.t / 0.4), sp = Math.min(1, W.age / 0.18), r = W.r * sp; ctx.globalAlpha = al;
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + W.seed; pxLine(W.x, W.y, W.x + Math.cos(a) * r, W.y + Math.sin(a) * r * 0.55, i % 2 ? '#e85a7a' : '#ff9ab0', 0); }
      for (const f of [0.35, 0.65, 0.95]) { const n = Math.ceil(r * f * 0.8); for (let i = 0; i < n; i++) { const a = i / n * TAU, wob = Math.sin(a * 12 + W.seed) * 2; dot(W.x + Math.cos(a) * (r * f + wob), W.y + Math.sin(a) * (r * f + wob) * 0.55, i % 4 ? '#ff9ab0' : '#ffd0dc'); } }
      const bob = Math.round(Math.sin(W.age * 6)) * 2; ctx.fillStyle = '#b03050'; ctx.fillRect(snap2(W.x) - 4, snap2(W.y) - 8 + bob, 8, 8); ctx.fillStyle = '#e85a7a'; ctx.fillRect(snap2(W.x) - 4, snap2(W.y) - 8 + bob, 6, 6); ctx.fillStyle = '#ffd0dc'; ctx.fillRect(snap2(W.x) - 2, snap2(W.y) - 6 + bob, 2, 2);
      ctx.globalAlpha = 1; }
  }
  let SEL = null;
  function drawOver() {
    const P = G.player;
    if (SEL === 'top') { if (K.dark > 0) { const a = Math.min(1, K.dark / 0.25, (K.darkMax - K.dark) / 0.1) * 0.5; ctx.fillStyle = `rgba(8,4,24,${a})`; ctx.fillRect(cam.x - 50, cam.y - 50, 1000, 600); } return; }
    if (SEL === K.eclipse && K.eclipse && !K.eclipse.boom) { const E = K.eclipse, p = E.t / E.dur, r = Math.min(1, E.t / 0.15) * (14 + p * 10) + Math.round(Math.sin(E.t * 30)) * 2;
      // 빨려드는 소용돌이 점
      for (let arm = 0; arm < 4; arm++) for (let j = 0; j < 14; j++) { const u = ((j / 14 + E.t * 1.6) % 1), rr = r + 4 + (1 - u) * 70, a = arm / 4 * TAU + (1 - u) * 3.2 - E.t * 5; dot(E.x + Math.cos(a) * rr, E.y + Math.sin(a) * rr * 0.7, u > 0.7 ? '#ffffff' : u > 0.35 ? '#a090e0' : '#5a4a8a'); }
      ctx.fillStyle = '#05030c'; for (let yy = -r; yy <= r; yy += 2) { const w = Math.sqrt(Math.max(0, r * r - yy * yy)); ctx.fillRect(snap2(E.x - w), snap2(E.y + yy), snap2(w * 2), 2); }
      const n = Math.ceil(r * 3); for (let i = 0; i < n; i++) { const a = i / n * TAU + E.t * 4; dot(E.x + Math.cos(a) * (r + 2), E.y + Math.sin(a) * (r + 2), i % 3 ? '#e8eef8' : '#ffffff'); if (i % 2) dot(E.x + Math.cos(a) * (r + 5 + (i % 4) * 2), E.y + Math.sin(a) * (r + 5 + (i % 4) * 2), '#a090e0'); } }
    // 실 (바느질)
    for (const T of K.threads) { if (T !== SEL) continue; const al = Math.min(1, T.t / 0.4); ctx.globalAlpha = al; const pts = T.pts;
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], sag = T.tight ? 0 : 8; let px = a.x, py = a.y; for (let s = 1; s <= 8; s++) { const u = s / 8, x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) + Math.sin(u * Math.PI) * sag; pxLine(px, py, x, y, '#c0303a'); px = x; py = y; } }
      ctx.globalAlpha = 1; }
    // 사슬 (그림자 사슬)
    if (SEL === 'chain' && P.state === 'ars' && P.ars && P.ars.k === 'kusari' && P.ars.links) { const h = hands(P); for (const l of P.ars.links) { const L = Math.hypot(l.x - h.fx, l.y - h.fy), n = Math.max(1, Math.floor(L / 4)); for (let i = 0; i <= n; i++) { const u = i / n; dot(lerp(h.fx, l.x, u), lerp(h.fy, l.y, u), i % 2 ? '#5a5a6a' : '#a8a0c8'); } dot(l.x - 2, l.y - 2, '#d8c8ff', 4); } }
    if (SEL === 'chain' && P.state === 'ars' && P.ars && P.ars.k === 'kusari' && P.ars.cx != null) { const R = P.ars, h = hands(P), L = Math.hypot(R.cx - h.fx, R.cy - h.fy), n = Math.max(1, Math.floor(L / 4));
      for (let i = 0; i <= n; i++) { const u = i / n; dot(lerp(h.fx, R.cx, u), lerp(h.fy, R.cy, u), i % 2 ? '#5a5a6a' : '#a8a0c8'); }
      const r = rotW(weaponTex('ranger'), Math.atan2(R.cy - h.fy, R.cx - h.fx), 1); ctx.drawImage(r.c, snap2(R.cx) - r.o + 1, snap2(R.cy) - r.o + 1); }
    for (const w of (G.wproj || [])) { if (w !== SEL) continue;
      if (w.k === 'arsSickle') { for (const q of w.hist) { ctx.globalAlpha = q.t / 0.14 * 0.6; dot(q.x, q.y, '#a070ff', 4); } ctx.globalAlpha = 1; const r = rotW(weaponTex('ranger'), w.spin, 1); ctx.drawImage(r.c, snap2(w.x) - r.o + 1, snap2(w.y) - r.o + 1); }
      else if (w.k === 'arsTornado') { const al = Math.min(1, (w.life - w.t) / 0.2, w.t / 0.1); ctx.globalAlpha = al;
        for (const back of [true, false]) { ctx.globalCompositeOperation = back ? 'source-over' : 'lighter'; for (let lv = 0; lv < 11; lv++) { const yy = w.y - lv * 5, sw = Math.sin(lv * 0.7 + w.t * 7) * (2 + lv * 0.4), rx = 6 + lv * 3.6, ry = 2 + lv * 0.9, n = Math.ceil(rx * 1.6);
          for (let i = 0; i < n; i++) { const a = i / n * TAU + w.spin * (1 + lv * 0.06), front = Math.sin(a) > 0; if (front === back) continue; if ((i + lv + Math.floor(w.spin)) % 5 === 0) continue;
            dot(w.x + sw + Math.cos(a) * rx, yy + Math.sin(a) * ry, back ? (lv % 2 ? '#5a6270' : '#6a7280') : ((i + lv) % 6 === 0 ? '#b0242c' : (i % 3 ? '#e8ecf2' : '#ffffff'))); } } }
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
      else if (w.k === 'arsYarn') { const s = Math.floor(w.spin) % 4; ctx.fillStyle = '#b03050'; ctx.fillRect(snap2(w.x) - 4, snap2(w.y) - 4, 8, 8); ctx.fillStyle = '#e85a7a'; ctx.fillRect(snap2(w.x) - 4 + (s & 1) * 2, snap2(w.y) - 4, 6, 6); ctx.fillStyle = '#ffd0dc'; ctx.fillRect(snap2(w.x) - 2 + (s >> 1) * 2, snap2(w.y) - 2, 2, 2); }
      else if (w.k === 'arsMoon') { const c = w.s < 0 ? ['#ffffff', '#e8eef8', '#a8b8d0'] : ['#d8c8ff', '#5a4a8a', '#2a2440'];
        for (const q of w.hist) { ctx.globalAlpha = q.t / 0.22 * 0.7; dot(q.x, q.y, c[1], 4); } ctx.globalAlpha = 1;
        const sp = w.t * 22 * w.s; for (let i = 0; i < 14; i++) { const u = i / 13, a = sp + (u - 0.5) * 3.2, th = Math.round(Math.sin(u * Math.PI) * 2) + 1; for (let j = 0; j < th; j++) dot(w.x + Math.cos(a) * (9 - j * 2), w.y + Math.sin(a) * (9 - j * 2), j === 0 ? c[0] : c[1 + (j > 1 ? 1 : 0)]); } }
    }
    // 박쥐 떼
    if (SEL === K.bats) for (const b of K.bats) { const f = Math.floor(b.ph * 2) % 2; ctx.fillStyle = '#1a0a0e'; ctx.fillRect(snap2(b.x) - 2, snap2(b.y), 6, 2); ctx.fillStyle = '#3a0e14'; if (f) { ctx.fillRect(snap2(b.x) - 4, snap2(b.y) - 2, 2, 2); ctx.fillRect(snap2(b.x) + 4, snap2(b.y) - 2, 2, 2); } else { ctx.fillRect(snap2(b.x) - 4, snap2(b.y) + 2, 2, 2); ctx.fillRect(snap2(b.x) + 4, snap2(b.y) + 2, 2, 2); } ctx.fillStyle = '#ff3040'; ctx.fillRect(snap2(b.x), snap2(b.y), 2, 2); }
    // 혼불
    for (const s of K.souls) { if (s !== SEL) continue; const fl = Math.floor(s.t * 12) % 2; dot(s.x - 2, s.y - 2, '#6a5ab8', 6); dot(s.x - 2, s.y - 4 - fl * 2, '#7af0ff', 4); dot(s.x, s.y - 2, '#ffffff', 2); }
    ctx.globalCompositeOperation = 'lighter'; for (const s of K.slashes) if (s === SEL) drawSlash(s); ctx.globalCompositeOperation = 'source-over';
  }

  // ---------------------------------------------------------------- 그림자 사슬낫 새 고유 효과: 3타에 사슬낫을 한 바퀴 휘두름
  const _wse = weaponSwingEnd;
  weaponSwingEnd = function () { _wse(); const P = G.player; if (G.cls !== 'ranger' || wSkill() !== 'kusari') return;
    slash(P.x, P.y - 8, 0, 40, TAU * 0.9, '#6a5a8a', '#d8c8ff', 3, 0.3, 0.55); FXK.ring(P.x, P.y - 6, '#a070ff', 200, 0.25, 6); sfx('whoosh', 0.9);
    for (const e of foes()) if (dist(P, e) < 54 + e.r) { damageEnemy(e, 0.6, { proc: true, ang: angTo(e, P), kb: big(e) ? 0 : 60, grogi: 4, gauge: 1 }); } };
  // 낫을 던진 동안은 기본 공격을 하지 않음
  const _sa = startAttack;
  startAttack = function (i) { const P = G.player; if (G.cls === 'ranger' && P.arsHideW) return; return _sa(i); };
  const _dgg = drawGearGround, gd = SKD.ground(drawGround); drawGearGround = function () { _dgg(); ctx.save(); gd(); ctx.restore(); };
  const _dwp = drawWproj; drawWproj = function () { _dwp(); ctx.save(); SEL = 'top'; try { drawOver(); } finally { SEL = null; ctx.restore(); } };
  SKD.add(ents => { if (!G) return; const P = G.player, one = it => SKD.one(drawOver, v => SEL = v, it);
    if (K.eclipse && !K.eclipse.boom) ents.push({ y: K.eclipse.y + 12, d: one(K.eclipse) });
    for (const T of K.threads) ents.push({ y: Math.max(...T.pts.map(p => p.y)) + 10, d: one(T) });
    if (P && P.state === 'ars' && P.ars && P.ars.k === 'kusari') ents.push({ y: P.y + 1, d: one('chain') });
    for (const w of (G.wproj || [])) if (/^ars/.test(w.k)) ents.push({ y: w.k === 'arsTornado' ? w.y + 2 : w.k === 'arsYarn' ? w.ty : w.y + 12, d: one(w) });
    if (K.bats.length && P) ents.push({ y: P.y + 1, d: one(K.bats) });
    for (const s of K.souls) ents.push({ y: s.y + 12, d: one(s) });
    for (const s of K.slashes) ents.push({ y: s.y + 12, d: () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawSlash(s); ctx.restore(); } }); });
  const _ie = itemExtra;
  itemExtra = function (it, cls) { const base = _ie(it, cls); if (!it || it.wk == null || it.cls !== 'ranger') return base;
    const sk = (wcat('ranger')[it.wk] || {}).sk, D = DEF[sk]; if (!D) return base;
    return base + `<div class="fx">우클릭 「${D.n}」 · 쿨타임 ${D.cd}초 — ${D.d}</div>`; };

  return SKD.wrapAll({ start, update, tick, def, DEF, slash, dot, pxLine, xLine });
})();
