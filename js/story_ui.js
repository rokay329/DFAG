'use strict';
// 잿빛 왕관 원정대 · story_ui.js — 합친 파일: 68_ashgrip.js, 69_grabpose.js, 70_loading.js, 71_informant.js, 72_cinema.js, 73_baldor_free.js, 74_notebook.js (v3.84 파일 정리 · typeof로 먼저 확인하는 이름 몇 개는 var로 선언)

// ==================================================================== 68_ashgrip.js
'use strict';
// 잿빛 왕관 토벌대 — 68_ashgrip.js : v3.46 4장 「재의 잠식」 (시안 _시안/4장_재잠식_움짤시안12)
// 4장 모든 전투방(일반 · 버티기 · 엘리트, v3.51부터 크기 제한 없음)에서 전투 중 6~8초마다 주인공 발밑에 재가 맴도는 전조(1.0초, 소리 없음)
// v3.52 → 전조가 끝나면 원 둘레에서 재가 솟아오름(0.45초) · 솟는 동안 원 안에 들어와 있으면 붙잡힘 → 재가 가라앉음(0.35초, 판정 없음).
//        전조는 다른 몬스터와 같은 붉은 원 예고(G.tele, 빗금 · 차오름 · 테두리 빛 · 위험 화면 테두리)로 그림 · 원 반지름 26 (예전 22×9 타원)
//        솟는 재는 어두운 재 색 + 잉걸 불티, 어둠(조명) 위에 그림.
// 붙잡히면 몸이 아래부터 재 색으로 굳어 가슴까지(0.22초) → 1.5초 동안 머리끝까지 차오름. 이동 · 점멸 불가, 다른 적에게는 맞지 않음(잡기 공통).
// SPACE 연타 4번이면 껍질이 깨지며 풀려남 (v3.47, 처음엔 공격 3번) · 버티면 온몸이 재가 되고 잉걸 금이 번진 뒤(0.18초) 부서지며 하트 1칸.
// 그림은 새 도트 없이, 그리는 동안 캐릭터 도트의 덮인 줄만 재 색 다섯 단계로 바꿈 (직업 · 망토 상관없이 몸에 맞음).
const ASHG = (() => {
  const TELE = 1.0, ERUPT = 0.45, FADE = 0.35, RISE = 0.22, HOLD = 1.5, CRACK = 0.18, NEED = 4, AR = 26, FROM = 0.47;
  const DK = ['#141210', '#1e1b18', '#2a2622', '#38332e', '#4a453e']; // 솟는 재 (어둡게)
  const ASH = ['#242019', '#3a3630', '#56524a', '#787268', '#9c968a'], EM = ['#9a2a14', '#ff7a30', '#ffd070'];
  const ACH = ['α', 'β', 'γ', 'δ', 'ε'], ECH = ['ζ', 'η', 'θ']; // 덧붙이는 팔레트 글자 (원래 팔레트 글자와 겹치지 않게)
  const sn = v => Math.round(v / 2) * 2, ease = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  const lum = h => 0.3 * parseInt(h.slice(1, 3), 16) + 0.59 * parseInt(h.slice(3, 5), 16) + 0.11 * parseInt(h.slice(5, 7), 16);
  const NZ = i => ((i * 37 + 11) % 5) / 4 * 1.6; // 열마다 경계 높낮이 (울퉁불퉁한 재 껍질)
  const hh = (a, b) => (((a * 73856093) ^ (b * 19349663)) >>> 0) % 1000 / 1000; // 칸마다 고정된 난수
  let DRAW = null;
  // ---------------------------------------------------------------- 방 준비 · 갱신
  function setup(R) {
    G.ag = null;
    if (G.stage !== 4 || !R || !['combat', 'survive', 'elite'].includes(R.type) || R.cleared || (G.dun && G.dun.forge)) return; // v3.51 크기 상관없이 모든 전투방 (일반 · 버티기 · 엘리트, 보스방 제외)
    G.ag = { on: false, end: false, cd: 0, tel: null, chips: [] };
  }
  function update(dt) {
    const S = G.ag; if (!S) return;
    for (const c of S.chips) { c.t -= dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 300 * dt; } S.chips = S.chips.filter(c => c.t > 0);
    const P = G.player, R = G.dun && G.dun.cur, rs = G.rs;
    if (!S.end && R && R.cleared) { S.end = true; dropTel(); }
    if (S.end || !P) return;
    if (!S.on) { if (rs && (rs.state === 'run' || rs.state === 'invade') && G.enemies.some(e => !e.dead && !isDummy(e))) { S.on = true; S.cd = 2.5; } else return; }
    if (P.dead) { dropTel(); return; }
    if (S.tel) { const T = S.tel; T.t += dt;
      if (T.tv) T.tv.t = Math.min(T.t, TELE - 1e-4); // 붉은 예고원은 우리 시간에 맞춤
      if (T.t >= TELE && !T.up) { if (T.tv) { const i = G.tele.indexOf(T.tv); if (i >= 0) G.tele.splice(i, 1); T.tv = null; } T.up = true; sfx('whoosh', 0.4); addShake(1.5); burst(T); } // 재가 솟음
      if (T.up && !T.hit && T.t < TELE + ERUPT && tryGrip(T)) T.hit = true; // 솟는 동안 원 안이면 붙잡힘
      if (T.t >= TELE + ERUPT + FADE) { S.tel = null; S.cd = rand(6, 8); }
      return; }
    if (P.grab) return;
    S.cd -= dt; if (S.cd <= 0) { const tv = { shape: 'circle', x: P.x, y: P.y, r: AR, t: 0, dur: TELE, owner: undefined, noImpact: true, ashg: true }; G.tele.push(tv); S.tel = { x: P.x, y: P.y, t: 0, tv }; }
  }
  function dropTel() { const S = G.ag; if (S && S.tel && S.tel.tv) { const i = G.tele.indexOf(S.tel.tv); if (i >= 0) G.tele.splice(i, 1); } if (S) S.tel = null; }
  function tryGrip(T) {
    const P = G.player;
    if (Math.hypot(P.x - T.x, P.y - T.y) > AR + (P.r || 8) * 0.4 || P.grab || P.dead || P.iframe > 0 || P.inv > 0 || P.state === 'dodge' || (typeof GOD_MODE !== 'undefined' && GOD_MODE)) return false;
    P.grab = { kind: 'ash', by: null, t: 0, need: NEED, mash: 0, crackT: null };
    P.state = 'grabbed'; P.kx = P.ky = 0; P.vx = P.vy = 0; P.queued = false; P.lift = 0;
    sfx('heavy', 0.7); puff(P.x, P.y, 10); return true;
  }
  function wDust(P) { const S = G.ag; if (!S) return; const f = P.face || 1; sfx('whoosh', 0.7);
    for (let i = 0; i < 16; i++) S.chips.push({ x: P.x + f * rand(4, 20), y: P.y - rand(4, 22), vx: f * rand(-10, 40), vy: -rand(30, 90), t: rand(0.3, 0.6), c: i % 6 ? pick([DK[2], DK[3], DK[4], ASH[3]]) : EM[1] }); }
  function burst(T) { const S = G.ag; for (let i = 0; i < 30; i++) { const a = i / 30 * 6.283; S.chips.push({ x: T.x + Math.cos(a) * AR * rand(0.85, 1), y: T.y + Math.sin(a) * AR * rand(0.85, 1), vx: Math.cos(a) * rand(10, 30), vy: -rand(90, 170), t: rand(0.35, 0.6), c: i % 5 ? pick([DK[1], DK[2], DK[3]]) : EM[1] }); } }
  function puff(x, y, n) { const S = G.ag; if (!S) return; for (let i = 0; i < n; i++) S.chips.push({ x: x + rand(-12, 12), y: y - rand(0, 6), vx: rand(-20, 20), vy: rand(-60, -20), t: rand(0.3, 0.6), c: pick([ASH[2], ASH[3]]) }); }
  // 붙잡힌 동안 (10_player.js의 updateGrabbed 대신)
  function tick(P, dt) {
    const g = P.grab; g.t += dt; P.kx = P.ky = 0; P.vx = P.vy = 0; P.lift = 0;
    if (!g.wGone && g.t >= RISE * 0.7) { g.wGone = true; wDust(P); } // v3.52 재가 손까지 차오르면 든 무기가 재로 흩어져 사라짐 (풀려나면 다시 보임)
    take('j'); take('k'); take('e'); take('l'); // v3.47 SPACE 연타 4번으로만 벗어남 (잡기 공통)
    if (g.crackT == null) {
      if (take(' ')) { g.mash++; hitFx(P, g); if (g.mash >= NEED) { shatter(P, false); return; } }
      if (g.t >= RISE + HOLD) { g.crackT = 0; sfx('heavy', 0.5); }
    } else { take(' '); g.crackT += dt; if (g.crackT >= CRACK) shatter(P, true); }
  }
  function cover(g) { return g.t < RISE ? FROM * ease(g.t / RISE) : FROM + (1.08 - FROM) * Math.min(1, (g.t - RISE) / HOLD); }
  function hitFx(P, g) {
    const S = G.ag, f = P.face || 1; sfx('hit', 1.5); addShake(1.5); P.hurtT = 0.06;
    if (S) for (let i = 0; i < 8; i++) S.chips.push({ x: P.x + rand(-8, 8), y: P.y - rand(4, 14), vx: rand(-80, 80), vy: rand(-110, -40), t: rand(0.25, 0.45), c: i % 3 ? ASH[3] : EM[1] });
  }
  function shatter(P, full) {
    const S = G.ag, g = P.grab, h = 30 * Math.min(1, cover(g)) + 4;
    if (S) for (let i = 0; i < (full ? 46 : 30); i++) { const y = P.y - rand(0, h), a = Math.atan2(y - (P.y - 14), rand(-10, 10)) + rand(-0.6, 0.6), v = rand(50, 120) * (full ? 1.3 : 1);
      S.chips.push({ x: P.x + rand(-10, 10), y, vx: Math.cos(a) * v, vy: -rand(50, 120) * (full ? 1.3 : 1), t: rand(0.3, 0.55), c: Math.random() < (full ? 0.18 : 0.1) ? pick([EM[1], EM[2]]) : pick([ASH[1], ASH[2], ASH[3], ASH[4]]) }); }
    P.grab = null; P.state = 'idle'; P.t = 0; P.lift = 0;
    if (full) { sfx('blast', 0.5); addShake(4); P.inv = 0; P.poisonT = Math.max(P.poisonT || 0, 0.001); hurtPlayer(1, null, true); } // 하트 방식: 중독 하트 규칙으로 이번 한 번만 한 칸
    else { sfx('block', 0.8); P.iframe = Math.max(P.iframe, 0.45); P.inv = Math.max(P.inv, 0.5); }
  }
  function release() { const P = G.player; if (P && P.grab && P.grab.kind === 'ash') { P.grab = null; P.state = 'idle'; P.t = 0; P.lift = 0; } }
  // ---------------------------------------------------------------- 그리기
  function agPal(pal) { const k = 'ag_' + pal; if (!PAL[k]) { const o = Object.assign({}, PAL[pal]); ACH.forEach((c, i) => { o[c] = ASH[i]; }); ECH.forEach((c, i) => { o[c] = EM[i]; }); PAL[k] = o; } return k; }
  function agMap(map, pal, D) {
    const rows = MAPS[map], H = rows.length, cut = Math.round(H * (1 - D.cover)), cr = Math.round(D.crack * 3), key = map + '__ag' + cut + '_' + cr + '_' + D.fl;
    if (MAPS[key]) return key;
    const p = PAL[pal], crack = cr / 3;
    MAPS[key] = rows.map((r, j) => { let s = ''; for (let i = 0; i < r.length; i++) { const ch = r[i];
      if (ch === '.' || ch === ',' || !p[ch] || ch === 'k' || j < cut + NZ(i)) { s += ch; continue; }
      let c = j < cut + NZ(i) + 1 ? ACH[4] : ACH[Math.min(4, Math.floor(lum(p[ch]) / 52))];
      if ((i * 7 + j * 13) % 23 === 0) c = (D.fl + i) % 3 ? ECH[0] : ECH[1]; // 잉걸 틈
      if (crack > 0 && ((i * 5 + j * 3) % 9 === 0 || ((i + j) % 6 === 0 && j > cut + 1)) && ((i * 13 + j * 7) % 10) / 10 < crack) c = crack > 0.6 ? ECH[2] : ECH[1]; // 금
      s += c; } return s; });
    if (typeof PLAYER_MAPS !== 'undefined' && PLAYER_MAPS.add) PLAYER_MAPS.add(key);
    return key;
  }
  function state(g) { return { cover: Math.min(1.1, cover(g)), crack: g.crackT != null ? Math.min(1, g.crackT / CRACK) : g.mash / NEED, fl: Math.floor(time * 8) % 2 }; }
  // 어둠(조명) 아래 바닥 층: 솟는 동안 재가 덮인 바닥 (전조는 G.tele 붉은 예고원이 그림)
  function floor() {
    const S = G.ag; if (!S || !S.tel || !S.tel.up) return; const T = S.tel, cx = T.x, gy = T.y, f = Math.max(0, (T.t - TELE - ERUPT) / FADE);
    for (let Y = -AR; Y <= AR; Y += 2) for (let X = -AR; X <= AR; X += 2) { const q = (X * X + Y * Y) / (AR * AR); if (q > 1 || hh(X + 99, Y + 99) > 1 - f * 0.85) continue;
      ctx.fillStyle = q > 0.7 ? DK[2] : DK[1]; ctx.fillRect(sn(cx + X), sn(gy + Y), 2, 2); }
  }
  function top() { // 조명 위 층: 솟는 재 · 재 조각
    const S = G.ag; if (!S) return; const P = G.player, t = time;
    if (S.tel && S.tel.up) { // 원 둘레를 따라 어두운 재 기둥이 솟았다가 가라앉음 (가운데는 성기게 → 붙잡힌 몸이 보임)
      const T = S.tel, cx = T.x, gy = T.y, e = Math.min(1, (T.t - TELE) / ERUPT), f = Math.max(0, (T.t - TELE - ERUPT) / FADE), H = 38 * ease(e / 0.6) * (1 - f * 0.5), dens = 1 - f, tt = Math.floor(t * 24), N = 48;
      for (let i = 0; i < N; i++) { const a = i / N * 6.283, sa = Math.sin(a), bx = cx + Math.cos(a) * AR, by = gy + sa * AR, h = H * (0.55 + 0.45 * hh(i, 5)) * (0.85 + 0.15 * Math.sin(t * 14 + i)) * (sa < 0 ? 0.75 : 1);
        for (let j = 0; j < h; j += 2) { const u = j / Math.max(1, h); if (hh(i * 3 + j, tt) > dens * (1.05 - u * 0.7)) continue;
          const w = Math.sin(j * 0.25 + t * 9 + i) * u * 2, r = hh(i + j, tt);
          ctx.fillStyle = r < 0.04 + 0.1 * (1 - f) * u ? (tt % 2 ? EM[1] : EM[2]) : r < 0.12 ? EM[0] : u < 0.35 ? DK[0] : u < 0.7 ? DK[1 + (j >> 1) % 2] : DK[3 + (r > 0.7 ? 1 : 0)];
          ctx.fillRect(sn(bx + w), sn(by - j - f * u * 10), 2, 2); } }
      for (let i = 0; i < 18 * dens; i++) { const X = (hh(i, 11) * 2 - 1) * (AR - 4), Y = (hh(i, 17) * 2 - 1) * (AR - 6), ph = (e * 1.4 + hh(i, 13)) % 1; ctx.fillStyle = hh(i, tt) < 0.15 ? EM[1] : ph < 0.4 ? DK[2] : DK[3]; ctx.fillRect(sn(cx + X), sn(gy + Y - ph * H * 0.9), 2, 2); } // 가운데 재 가루
    }
    for (const c of S.chips) { if (c.t < 0.15 && ((sn(c.x) + sn(c.y)) / 2 & 1)) continue; ctx.fillStyle = c.c; ctx.fillRect(sn(c.x), sn(c.y), 2, 2); }
    if (P && P.grab && P.grab.kind === 'ash') { const cv = Math.min(1, cover(P.grab)); for (let i = 0; i < 5; i++) { const ph = (time * 0.9 + i / 5) % 1, x = P.x - 8 + ((i * 11) % 18), y = P.y - 4 - cv * 28 - ph * 18; if ((Math.floor(time * 20) + i) % 3) { ctx.fillStyle = ph < 0.5 ? ASH[3] : ASH[2]; ctx.fillRect(sn(x + Math.sin(ph * 6 + i) * 3), sn(y), 2, 2); } } }
  }
  return { setup, update, tick, release, state, agMap, agPal, floor, top, get DRAW() { return DRAW; }, set DRAW(v) { DRAW = v; } };
})();
{ const o = enterRoom; enterRoom = function (R) { ASHG.release(); const r = o.apply(this, arguments); try { ASHG.setup(R); } catch (e) { G.ag = null; } return r; }; }
{ const o = updateEProj; updateEProj = function (dt) { const r = o.apply(this, arguments); ASHG.update(dt); return r; }; }
{ const o = updateGrabbed; updateGrabbed = function (P, dt) { if (P.grab && P.grab.kind === 'ash') return ASHG.tick(P, dt); return o.apply(this, arguments); }; }
{ const o = releaseGrab; releaseGrab = function () { const P = G && G.player; if (P && P.grab && P.grab.kind === 'ash') return ASHG.release(); return o.apply(this, arguments); }; }
{ const o = drawAshClouds; drawAshClouds = function () { ASHG.floor(); return o.apply(this, arguments); }; }
{ const o = drawOrcWorld; drawOrcWorld = function () { ASHG.top(); return o.apply(this, arguments); }; }
{ const o = drawPlayer; drawPlayer = function () { const P = G && G.player, g = P && P.grab; if (!g || g.kind !== 'ash') return o.apply(this, arguments); ASHG.DRAW = ASHG.state(g); if (g.wGone) ROLL_HIDEW = true; /* v3.52 재가 되는 동안 무기 숨김 (drawPlayer가 끝나며 되돌림) */ try { return o.apply(this, arguments); } finally { ASHG.DRAW = null; } }; }
{ const o = drawSprite; drawSprite = function (map, pal, scale, x, y, flip, opt) { const D = ASHG.DRAW; if (!D || !MAPS[map] || !PAL[pal] || String(pal).startsWith('ag_')) return o.apply(this, arguments); return o.call(this, ASHG.agMap(map, pal, D), ASHG.agPal(pal), scale, x, y, flip, opt); }; }
;

// ==================================================================== 69_grabpose.js
'use strict';
// 잿빛 왕관 토벌대 — 69_grabpose.js : v3.48 오크에게 잡혔을 때 공용 모션 (v3.64부터 오크 잡기는 들이받기로 바뀌어 쓰이지 않음 · 재의 잠식은 그대로)
// · 버둥거림: 몸이 0.11초마다 좌우로 2px 흔들리고(오크 잡기는 매달려 좌우로 한 칸씩 기울어짐) · 머리 양옆에 버둥 선이 번갈아 튐
// · SPACE를 누를 때마다 몸이 위로 홱 튀고 버둥 선이 크게 · 오크는 팔을 들어 들어 올리고 무기는 등에 멤(12_chapter3.js)
const GRABPOSE = (() => {
  let ROT = 0;
  const sn = v => Math.round(v / 2) * 2;
  function px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(sn(x), sn(y), 2, 2); }
  function jolt(g) { if (g._m == null) g._m = g.mash || 0; if ((g.mash || 0) > g._m) { g._m = g.mash; g.joltAt = time; } return g.joltAt != null && time - g.joltAt < 0.14 ? 1 - (time - g.joltAt) / 0.14 : 0; }
  function wrapDraw(o) {
    return function () {
      const P = G && G.player, g = P && P.grab; if (!g || P.dead || g.kind === 'ash') return o.apply(this, arguments);
      const orc = g.kind !== 'ash', j = jolt(g), ph = Math.floor(time / 0.11) % 2;
      const jx = (ph ? 2 : -2) * (j > 0 ? 1.5 : 1), jy = j > 0 ? -2 : 0;
      ROT = orc ? (ph ? 1 : -1) * Math.PI / 20 : 0;
      ctx.save(); ctx.translate(Math.round(jx), jy);
      try { o.apply(this, arguments); } finally { ROT = 0; ctx.restore(); }
      const lift = P.lift || 0, cx = P.x + jx, top = P.y - lift - 30 + jy;
      // 버둥 선 (머리 양옆, 번갈아)
      const big = j > 0 ? 1 : 0, col = j > 0 ? '#ffffff' : '#fff0d0';
      for (const s of [-1, 1]) { const on = (ph === (s > 0 ? 1 : 0)) || big; if (!on) continue; const bx = cx + s * (14 + big * 2);
        px(bx, top + 4, col); px(bx + s * 2, top + 2, col); px(bx + s * 2, top + 10, col); px(bx + s * 4, top + 10 + 0, col); px(bx, top + 16, col); px(bx + s * 2, top + 18, col);
        if (big) { px(bx + s * 4, top + 2, col); px(bx + s * 6, top + 10, col); px(bx + s * 4, top + 18, col); } }
    };
  }
  return { wrapDraw, get ROT() { return ROT; } };
})();
{ drawPlayer = GRABPOSE.wrapDraw(drawPlayer); }
{ const o = drawSprite; drawSprite = function (map, pal, scale, x, y, flip, opt) { const r = GRABPOSE.ROT; if (!r || typeof PLAYER_MAPS === 'undefined' || !PLAYER_MAPS.has(String(map).split('__ag')[0])) return o.apply(this, arguments); return o.call(this, map, pal, scale, x, y, flip, Object.assign({}, opt || {}, { rot: ((opt && opt.rot) || 0) + r })); }; }
;

// ==================================================================== 70_loading.js
'use strict';
// 잿빛 왕관 원정대 — 70_loading.js : v3.65 진짜 로딩 — 「다시 뜨는 초승달」 창을 로딩 화면으로 씀
//  · 로딩 작업 목록(LOADQ): 한 프레임에 약 12ms씩 작업을 처리 · 작업이 다 끝나고 최소 시간이 지나야 닫힘 · 키 · 클릭으로 넘길 수 없음 (v3.66 준비가 끝나고 달이 정해진 바퀴 수만큼 졌다가 다시 떠야 닫힘 — 해가 뜨지 않는 세계)
//  · 처음 시작 · 원정 실패 뒤 다시 깨어날 때(시작 장소): 1장 던전을 미리 만들고 들머리 · 가까운 방 바닥 그림을 미리 그려 둠
//  · 장 넘어갈 때: 던전 생성 + 들머리 · 가까운 방 바닥 그림을 달 창이 도는 동안 처리한 뒤 월드맵으로
//  · 게임 중 틈날 때(방을 비우고 손을 놓고 서 있는 동안): 문으로 이어진 이웃 방 바닥 그림을 1.5초에 한 방씩 미리 그림 (v3.83 걷는 중엔 안 그림)
window.MOONSKY_OFF = true; // 예전 「실패 뒤 초승달」 연출은 이 로딩 화면이 대신함
const LOADQ = (() => {
  let S = null;
  const DUR = MOONSKY.DUR, LOOP = DUR - 0.75;
  // ---------------------------------------------------------------- 방 그림 미리 그리기 (지금 보이는 방의 상태를 건드리지 않게 저장 → 그리기 → 되돌림)
  const tmp = {};
  const snapCv = (k, cv) => { const c = tmp[k] || (tmp[k] = mkCanvas(cv.width, cv.height)[0]); const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.drawImage(cv, 0, 0); return c; };
  const backCv = (k, gg) => { const c = tmp[k]; gg.clearRect(0, 0, gg.canvas.width, gg.canvas.height); gg.drawImage(c, 0, 0); };
  function withCtx(D, fn) {
    const k = { A: Object.assign({}, A), CX, CY, PIL: PILLARS.slice(), TOR: TORCHES.map(t => Object.assign({}, t)), DOOR: JSON.parse(JSON.stringify(DOOR)), NC, NR, RS: ROOMSTYLE, CR: CUR_ROOM, st: G.stage, dun: G.dun, fl: G.flatLights, FO: FRONT_ON, cur: D.cur };
    snapCv('fg', floor); snapCv('fmg', floorM); snapCv('ffg', frontM);
    G.stage = D.stage || G.stage; G.dun = D;
    try { return fn(); } finally {
      Object.assign(A, k.A); CX = k.CX; CY = k.CY; PILLARS = k.PIL; TORCHES = k.TOR; for (const d in k.DOOR) Object.assign(DOOR[d], k.DOOR[d]); NC = k.NC; NR = k.NR;
      ROOMSTYLE = k.RS; CUR_ROOM = k.CR; G.stage = k.st; G.dun = k.dun; G.flatLights = k.fl; FRONT_ON = k.FO; D.cur = k.cur;
      backCv('fg', fg); backCv('fmg', fmg); backCv('ffg', ffg);
    }
  }
  const cached = (D, R) => FL_CACHE.some(c => c.key === (D.stage || G.stage) + ':' + R.id && c.dun === D);
  function prePaint(D, R) {
    if (!D || !R || cached(D, R) || ['forge', 'home', 'lab', 'archive', 'den', 'ruin', 'ancArena'].includes(R.type)) return false;
    withCtx(D, () => { D.cur = R; setArena(SHAPES[R.shape]); roomPillars(R);
      if (!R.sprites || (R.spritesN != null && R.spritesN !== spriteObsN(R))) { R.sprites = makeObsSprites(R); R.spritesN = spriteObsN(R); }
      floorCached(R); });
    return true;
  }
  // 들머리부터 문으로 이어진 순서대로 n개
  function nearRooms(D, R0, n) { const out = [], seen = new Set([R0.id]), q = [R0];
    while (q.length && out.length < n) { const R = q.shift(); out.push(R); for (const d in R.doors) { const id = R.doors[d]; if (id == null || seen.has(id)) continue; seen.add(id); q.push(D.rooms[id]); } }
    return out; }
  const paintJobs = (D, n) => nearRooms(D, D.start, n).map(R => () => prePaint(D, R));
  // ---------------------------------------------------------------- 로딩 화면
  function run(jobs, o = {}) {
    S = { jobs: jobs.slice(), t: 0, loops: o.loops || 1, done: o.done || null, out: -1, ready: false }; // v3.66 시간이 아니라 달이 지고 다시 뜨는 바퀴 수로 끊음
    document.body.classList.add('moonsky'); clearKeys();
  }
  function clearKeys() { for (const k in pressed) pressed[k] = false; if (typeof mouse !== 'undefined') { mouse.down = false; mouse.rdown = false; } }
  function tick(dt) {
    if (!S) return; S.t += dt;
    if (S.out >= 0) { S.out += dt; clearKeys(); if (S.out >= 0.4) { S = null; document.body.classList.remove('moonsky'); clearKeys(); } return; }
    const t0 = performance.now();
    while (S.jobs.length && performance.now() - t0 < 12) { const j = S.jobs.shift(); try { const more = j(); if (Array.isArray(more)) S.jobs.unshift(...more); } catch (e) { console.error(e); } }
    if (!S.jobs.length && !S.ready) S.ready = true;
    if (S.t >= 0.3 + S.loops * LOOP && !S.ready) S.loops++; // 바퀴를 다 돌았는데 아직 준비 중이면 한 바퀴 더
    if (S.ready && S.t >= 0.3 + S.loops * LOOP) { /* v3.66 키 · 클릭으로 넘길 수 없음 — 준비가 끝나고 달이 정해진 바퀴를 다 돌아 다시 떠오른 순간 닫힘 */ const f = S.done; S.done = null; S.out = 0; try { if (f) f(); } catch (e) { console.error(e); } }
    clearKeys(); // 로딩 중 눌린 키는 버림 (화면 넘기기 · 조작이 새지 않게)
  }
  function draw() {
    if (!S) return; let t;
    if (S.out >= 0) t = DUR - 0.4 + S.out; else if (S.t < 0.3) t = S.t; else t = 0.3 + ((S.t - 0.3) % LOOP);
    MOONSKY.draw(Math.min(DUR - 0.001, t));
  }
  // ---------------------------------------------------------------- 연결
  // 1) 시작 장소에 들어올 때 (처음 시작 · 원정 실패 뒤): 1장 던전을 미리 만들고 가까운 방 바닥까지
  { const o = HOME.enter; HOME.enter = function (...a) { const fail = MOONSKY.pending; const r = o.apply(this, a);
      if (G && G.home) { G.preDun = G.preDun || {};
        run([() => { const D = withCtx({ stage: 1 }, () => genDungeon(1)); D.stage = D.stage || 1; G.preDun[1] = D; return paintJobs(D, 6); }], { loops: 1 });
        if (fail) sfx('blip', 0.5); }
      return r; }; }
  // 2) 장 넘어갈 때: newDungeon을 로딩 화면으로 (테스트 키는 G.noLoad로 바로)
  { const o = newDungeon; newDungeon = function () {
      const st = G.stage, pre = G.preDun && G.preDun[st]; if (pre) delete G.preDun[st];
      const finish = () => { G.mood = null; enterRoom(G.dun.start, null); if (!wmStart()) showStageParchment(G.stage, G.cls); };
      if (pre && cached(pre, pre.start)) { G.dun = pre; G.noLoad = false; finish(); return; } // 이미 다 준비됨 → 바로
      if (G.noLoad) { G.noLoad = false; if (pre) { G.dun = pre; finish(); } else o.apply(this, arguments); return; }
      run([() => { const D = pre || genDungeon(st); D.stage = D.stage || st; G.dun = D; return paintJobs(D, 6); }], { loops: 1, done: finish }); }; }
  // 3) 업데이트 · 그리기: 로딩 중엔 게임을 멈추고 달 창만 · 틈날 때 이웃 방 미리 그리기
  let calmT = 0, nextPre = 0;
  { const o = update; update = function (dt) { if (S) { tick(dt); return; } const r = o.apply(this, arguments);
      try { const D = G && G.dun, R = D && D.cur;
        const calm = mode === 'play' && R && !D.home && !D.forge && !D.lab && !D.anc && R.cleared && !G.sealed && !G.trans && !G.cine && !G.enemies.some(e => !e.dead && !isDummy(e));
        calmT = calm ? calmT + dt : 0;
        if (calmT > 1.0 && time > nextPre && G.player && (G.player.idleT || 0) > 0.6) { /* v3.83 손을 놓고 서 있을 때만 — 방 하나를 통째로 그리느라(2장은 특히 무거움) 걷는 도중 1.5초마다 뚝 끊기던 문제 */ nextPre = time + 1.5; for (const d in R.doors) { const id = R.doors[d]; if (id == null) continue; if (prePaint(D, D.rooms[id])) break; } }
      } catch (e) { console.error(e); }
      return r; }; }
  { const o = render; render = function () { if (S) { draw(); return; } return o.apply(this, arguments); }; }
  return { run, prePaint, get on() { return !!S; }, get ready() { return !!(S && S.ready); } };
})();
;

// ==================================================================== 71_informant.js
'use strict';
// 잿빛 왕관 원정대 — 71_informant.js : v3.69 정보원 PRS-22(오목눈이) · DW-5000(햄스터) 등장 장면 (시안 _시안/정보원_PRS-22_DW-5000.html)
//  · 일반 루트: 장마다 첫 번째 보스 문 열쇠(정령의 불씨 · 기사단 인장 조각 · 전사의 엄니 · 붉은 보석)를 줍는 순간 (v3.69b 두 번째 → 첫 번째)
//  · v3.80 시선: 눈·부리(코)를 앞쪽으로 옮기고 눈을 한 줄 올려, 플레이어 쪽을 올려다봄 (시안 _시안/정보원_시선_시안01.html C안)
//  · 흐름: 근처 장애물 뒤가 바스락거림 → 둘이 튀어나와 플레이어 양옆에 내려앉음 → 속담 「밤말은 새가 듣고, / 쥐가 듣는다.」 → PRS-22 봉인 소문 → DW-5000 왕관 조각 소문
//          → PRS-22는 날아가고 DW-5000은 땅을 파고 사라짐 · 장마다 대사가 다름 · 한 판에 장마다 한 번
const INFORM = (() => {
  const PR = {"m": [".....kkkkk.....", "....kBWWWBk....", "...kBWEWWWEk...", "...kWWWWWywk...", "...kWWWWWWwk...", "..kBWWWWWWwBk..", "..kBPWWWWWPBk..", "..kBpPWWWPpBk..", ".kBkkpPPPpkk...", "kBk..kkkkk.....", "kk...kf.kf.....", ".....kk.kk....."], "p": {"k": "#0b0a0e", "W": "#f6f2ee", "w": "#d6cfd2", "B": "#57505f", "b": "#4a4452", "P": "#e9bcc0", "p": "#c4929c", "E": "#0b0a0e", "e": "#ffffff", "y": "#4a3a36", "f": "#6a5650"}, "bob": 5, "face": "W"};
  const DW = {"m": [".kk.......kk.", "knOk.....kOnk", "kNOkkkkkkkONk", ".kOOOEOOOEOk.", "kOOOOXOOOXOOk", "kWOOOOOnOOOWk", "kWWWOOONOWWWk", "kWWWWWWWWWWWk", "kOWWfWWWfWWok", "kOOWWWWWWWOok", ".kOOWWWWWOok.", "..kfkkkkkfk..", "..kk.....kk.."], "p": {"k": "#0b0a0e", "O": "#e8a35a", "o": "#c47e3c", "d": "#9a5c2a", "W": "#fbf3e6", "w": "#e2d6c4", "n": "#f0a0a8", "N": "#d07884", "E": "#0b0a0e", "e": "#ffffff", "f": "#f0b8b0", "X": "#5a3420"}, "bob": 7, "face": "O"};
  // 장마다 소문 (말주머니는 문장마다 하나)
  const LINES = {
    1: { intro: [['prs', '잠깐. 무기는 내려 둬.'], ['prs', '우린 소문에 죽고 소문에 살지.'], ['prs', '나는 PRS-22.'], ['dw', '나는 DW-5000.'], ['prs', '밤말은 새가 듣고,'], ['dw', '쥐가 듣는다.']] /* 1장은 소개 사이에 속담 */, // v3.69c 1장: 처음 만나는 자리라 자기소개
      prs: ['어디서 들은 얘긴데.', '정령의 불씨 두 개를 문 앞에 바치면 봉인이 풀린대.', '방금 하나를 주웠으니, 남은 건 하나야.', '나머지는 다른 우두머리의 굴에 있대.'], dw: ['이건 볼주머니에 넣어 둔 소문인데.', '문 너머 구루그가 왕관 조각 하나를 삼키고 있대.', '조각을 다 모으면 잿빛 왕에게 닿는다나 봐.'] },
    2: { prs: ['어디서 들은 얘긴데.', '쪼개진 기사단 인장을 맞추면 성채의 문이 열린대.', '네가 주운 건 반쪽뿐이야.', '나머지 반쪽은 다른 처형장에 있대.'], dw: ['볼주머니에서 꺼낸 소문이야.', '발도르는 왕관 조각을 지키느라 성채를 떠나지 않는대.', '조각을 다 모으면 잿빛 왕에게 닿는다나 봐.'] },
    3: { prs: ['어디서 들은 얘긴데.', '전사의 엄니 두 개를 꽂으면 부락의 문이 열린대.', '결투에서 진 전사들의 엄니라던데.', '남은 하나는 다른 결투장에 있대.'], dw: ['볼주머니 깊숙이 넣어 둔 소문인데.', '크루가쉬는 왕관 조각을 전리품처럼 지니고 있대.', '피 냄새를 따라가면 찾을 수 있다나 봐.'] },
    4: { prs: ['어디서 들은 얘긴데.', '붉은 보석 두 개가 마지막 문을 연대.', '남은 하나는 다른 알현실에 있대.', '그 너머엔 잿빛 왕이 있다지.'], dw: [], bye: [['prs', '우리가 줄 수 있는 소문은 여기까지야.'], ['dw', '건투를 빌게.']] } /* v3.80 4장: 이미 왕관을 맞춰 들어온 뒤라 왕관 소문 대신 마지막 인사 */,
  };
  let S = null;
  // v3.66 정보원이 사라진 뒤 주인공 혼잣말 (장 · 캐릭터별, 말주머니는 문장마다 하나 · 주인공은 멈춰 서서 F로 넘김)
  const AFTER = {"1": {"knight": ["잿빛 왕…", "그 이름을 들으니 팔의 상처가 욱신거리는군…"], "ranger": ["첫 번째 대상이 조각을 삼켰다고…?", "우연이겠지.", "우선 처리 대상부터 제거하자."], "mage": ["조각을 모으면 잿빛 왕에게 닿는다…", "마력이 끌려가던 방향과 같네요.", "우연이라고 하기엔 너무 잘 맞아요."], "priest": ["잿빛 왕에게 닿는 조각이라…", "이 순례길도 왕도로 이어져 있어요.", "신께서 침묵하시는 이유도 그곳에 있을까요?"], "gunner": ["조각을 다 모으면 왕에게 닿는다라.", "소문치곤 친절하군.", "점액 덩어리.", "그걸 죽여 보면 알겠지."]}, "2": {"knight": ["조각을 지키는 기사라…", "발도르에게 이 통증에 대한 단서가 있을지도 몰라."], "ranger": ["두 번째 대상도 조각을 지키고 있다니.", "이 성채의 문양… 첫 파편과 같은 문양이군.", "의뢰인, 당신은 도대체 무얼 찾고 있던 거지…?"], "mage": ["조각 때문에 성채를 떠나지 않는 기사라…", "지키는 걸까요, 묶여 있는 걸까요?", "그 조각을 직접 확인해 봐야겠어요."], "priest": ["조각을 지키느라 성채를 떠나지 못한다니…", "그건 지키는 게 아니라 갇혀 있는 거예요."], "gunner": ["조각 하나 지키겠다고 성채에 눌러앉은 기사라.", "고집 하나는 알아줘야겠군."]}, "3": {"knight": ["왕관 조각을 손에 넣을 때마다 통증이 강해져.", "역시 이 통증이 나를 이끄는군."], "ranger": ["피 냄새라면 내 전문이지.", "마지막 대상도 조각을 가졌군.", "의뢰와 왕관 조각을 찾는 일이 같은 곳을 향하고 있어…"], "mage": ["조각을 전리품처럼 지니고 있다니…", "크루가쉬는 그 가치를 알고 있는 걸까요?", "세 조각이 모이면 무슨 일이 생기는지, 이제 확인할 수 있겠네요."], "priest": ["조각을 전리품처럼 지니고 있다니…", "그 조각 때문에 이 부락의 싸움이 끝나지 않는 걸까요?"], "gunner": ["피 냄새라면 이 부락에 넘쳐나는데.", "제일 진한 쪽으로 가면 되겠군."]}, "4": {"knight": ["잿빛 왕.", "곧 답을 들을 수 있겠군."], "ranger": ["보수는 상관없어.", "이 일의 끝에 무엇이 있는지 직접 확인해야겠어."], "mage": ["그 너머에 잿빛 왕이…", "더는 멀리서 추측하지 않겠어요."], "priest": ["붉은 보석 너머에 잿빛 왕이…", "더는 응답을 기다리지 않겠어요."], "gunner": ["붉은 보석 두 개, 그 너머에 왕.", "길은 다 들었군.", "이제 방아쇠만 당기면 돼."]}}; // v3.83 대사 개정 (claude/주인공_대사정리_소문_왕관조각_v3.83.md)
  function afterTalk(st) { try { const L = AFTER[st] && AFTER[st][G.cls]; if (L && L.length && G.player && !G.player.dead) TRUTH.talk(L.map(t => ['me', t])); } catch (e) { console.error(e); } }
  const sn = v => Math.round(v / 2) * 2;
  // ---------------------------------------------------------------- 그리기 (2px 칸 · 발 가운데 기준 · face: 1 오른쪽)
  function drawGuy(it, x, y, z, face, bob, blink, al) {
    const m = it.m, H = m.length, W = m[0].length, X0 = sn(x) - Math.floor(W / 2) * 2, B = sn(y - z);
    ctx.save(); if (al != null && al < 1) ctx.globalAlpha = al;
    for (let j = H - 1; j >= 0; j--) for (let i = 0; i < W; i++) { let c = m[j][i]; if (c === '.') continue;
      if (blink && c === 'E' && j + 1 < H && m[j + 1][i] === 'X') c = it.face; else if (blink && c === 'X') c = 'k'; else if (blink && c === 'E') c = it.face;
      const ii = face < 0 ? W - 1 - i : i; ctx.fillStyle = it.p[c]; ctx.fillRect(X0 + ii * 2, B - (H - j) * 2 + (j < it.bob ? bob * 2 : 0), 2, 2); }
    ctx.restore();
  }
  function shadow(x, y, w, a) { ctx.save(); ctx.fillStyle = 'rgba(4,3,8,.8)'; ctx.globalAlpha = a; for (let yy = -2; yy <= 2; yy += 2) for (let xx = -w; xx <= w; xx += 2) if (((xx + yy) / 2 & 1) === 0 && (xx / w) ** 2 + (yy / 3) ** 2 <= 1) ctx.fillRect(sn(x) + xx, sn(y) + yy, 2, 2); ctx.restore(); }
  // ---------------------------------------------------------------- 시작
  function hideSpot(R, P, used) { // 플레이어 가까운 장애물 뒤 (없으면 방 위쪽 끝)
    let best = null, bd = 1e9;
    for (const b of R.obs || []) { const bx = b.x != null ? b.x : (b.x0 + b.x1) / 2, by = b.y != null ? b.y : b.y0; if (bx == null || by == null) continue; const d = Math.hypot(bx - P.x, by - P.y);
      if (d < 70 || d > 320 || used.some(u => Math.hypot(u.x - bx, u.y - by) < 60)) continue; if (d < bd) { bd = d; best = { x: bx, y: by - (b.r || 10) - 2 }; } }
    return best || { x: clamp(P.x + (used.length ? 140 : -140), A.x0 + 30, A.x1 - 30), y: A.y0 + 14 };
  }
  function start() {
    const D = G.dun, R = D && D.cur, P = G.player; if (!R || !P) return;
    const h1 = hideSpot(R, P, []), h2 = hideSpot(R, P, [h1]);
    const side = h1.x <= h2.x ? [-1, 1] : [1, -1];
    const land = s => ({ x: clamp(P.x + s * 46, A.x0 + 24, A.x1 - 24), y: clamp(P.y + 18, A.y0 + 24, A.y1 - 10) /* v3.80 올려다보니 주인공보다 살짝 앞(아래)에 내려앉음 */ });
    S = { t: 0, ph: 'rustle', st: G.stage, a: { it: PR, h: h1, l: land(side[0]), x: h1.x, y: h1.y, z: 0, show: false }, b: { it: DW, h: h2, l: land(side[1]), x: h2.x, y: h2.y, z: 0, show: false }, parts: [] };
    TRUTH.freeze(); P.state = 'idle'; P.face = 1; sfx('blip', 1.4);
  }
  function puff(x, y, cols, n, up) { for (let i = 0; i < n; i++) S.parts.push({ x: x + rand(-8, 8), y: y - rand(0, 10), vx: rand(-50, 50), vy: -rand(20, up || 80), t: rand(0.3, 0.6), c: pick(cols), g: 240 }); }
  const LEAF = ['#6a8a4a', '#4a6a34', '#8aa060', '#5a4a36'];
  function tick(dt) {
    const s = S; s.t += dt; const t = s.t, P = G.player;
    for (const q of s.parts) { q.t -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; } s.parts = s.parts.filter(q => q.t > 0);
    if (s.ph === 'rustle') { // 장애물 뒤가 바스락 (두 번)
      for (const [o, d] of [[s.a, 0], [s.b, 0.25]]) if (t > d && Math.random() < dt * 18) puff(o.h.x + rand(-10, 10), o.h.y + 4, LEAF, 1, 50);
      if (t > 0.9) { s.ph = 'pop'; s.t = 0; sfx('dodge', 1.3); }
    } else if (s.ph === 'pop') { // 튀어나와 포물선으로 내려앉음 (PRS-22는 날갯짓으로 조금 더 높이)
      for (const [o, d, hgt] of [[s.a, 0, 46], [s.b, 0.18, 30]]) { const k = Math.min(1, Math.max(0, (t - d) / 0.5)); if (k > 0 && !o.show) { o.show = true; puff(o.h.x, o.h.y + 2, LEAF, 8, 120); sfx('swing', o === s.a ? 1.7 : 1.4); }
        o.x = o.h.x + (o.l.x - o.h.x) * k; o.y = o.h.y + (o.l.y - o.h.y) * k; o.z = Math.sin(k * Math.PI) * hgt; if (k >= 1 && !o.landed) { o.landed = true; o.z = 0; puff(o.x, o.y, ['#8a8a8a', '#6a6a6a'], 4, 30); sfx('step', 1.2); } }
      if (t > 0.9) { s.ph = 'talk'; s.t = 0; P.face = Math.sign((s.a.x + s.b.x) / 2 - P.x) || 1;
        const L = LINES[s.st] || LINES[1], lines = [...(L.intro || [['prs', '밤말은 새가 듣고,'], ['dw', '쥐가 듣는다.']]), ...L.prs.map(x => ['prs', x]), ...L.dw.map(x => ['dw', x]), ...(L.bye || [['prs', '그럼, 우린 이만.'], ['dw', '들은 건 비밀이야.']])];
        TRUTH.talk(lines, () => { if (S) { S.ph = 'exit'; S.t = 0; sfx('dodge', 1.2); } }); }
    } else if (s.ph === 'exit') { // PRS-22는 비스듬히 날아오르고, DW-5000은 땅을 파고 들어감
      const a = s.a, b = s.b, ka = Math.min(1, t / 0.8);
      a.z = ka * ka * 260; a.x = a.l.x - (a.l.x < P.x ? 1 : -1) * ka * 120; a.al = 1 - Math.max(0, (ka - 0.6) / 0.4);
      const kb = Math.min(1, t / 0.6); b.sink = kb; if (Math.random() < dt * 30 && kb < 1) puff(b.x, b.y, ['#6a5040', '#4a3828', '#8a6a4a'], 1, 60);
      if (t > 0.9) { if (dg) { dg.fillStyle = 'rgba(30,20,14,.6)'; for (let y = -2; y <= 2; y += 2) for (let x = -6; x <= 6; x += 2) if ((x / 6) ** 2 + (y / 3) ** 2 <= 1) dg.fillRect(sn(b.x) + x, sn(b.y) + y, 2, 2); } // 파고 들어간 자리
        S = null; afterTalk(s.st); }
    }
    if (S && S.ph !== 'talk') { TRUTH.freeze(); G.prompt = null; }
  }
  function ents(list) {
    if (!S) return; const now = time;
    for (const [o, k] of [[S.a, 0], [S.b, 1]]) { if (!o.show) continue; const P = G.player, face = (o.x <= P.x ? 1 : -1) * (k === 0 ? 1 : 1);
      const bob = Math.floor(now * 2 + k * 0.5) % 2, blink = ((now + k * 0.9) % 3.4) < 0.13, flap = k === 0 && o.z > 2;
      list.push({ y: o.y, d: () => { shadow(o.x, o.y, o.it === DW ? 8 : 9, 0.8 * (1 - Math.min(1, o.z / 80)) * (o.al == null ? 1 : o.al) * (1 - (o.sink || 0)));
        if (o.sink) { ctx.save(); ctx.beginPath(); ctx.rect(o.x - 40, o.y - 80, 80, 80 + 1); ctx.clip(); drawGuy(o.it, o.x, o.y + o.sink * 28, 0, face, bob, blink, 1); ctx.restore(); return; }
        drawGuy(o.it, o.x, o.y, o.z, face, flap ? Math.floor(now * 14) % 2 : bob, blink, o.al); } }); }
    for (const q of S.parts) list.push({ y: q.y + 30, d: () => { ctx.fillStyle = q.c; ctx.fillRect(sn(q.x), sn(q.y), 2, 2); } });
  }
  function spk(who) { if (!S) return null; const o = who === 'prs' ? S.a : who === 'dw' ? S.b : null; return o ? { x: o.x, y: o.y - 34 } : null; }
  // ---------------------------------------------------------------- 연결
  { const o = collectLoot; collectLoot = function (l) { const r = o.apply(this, arguments);
      try { const D = G && G.dun; if (l && l.type === 'sealkey' && D && !D.home && !D.forge && D.keys >= 1 && !D.informed) { D.informed = true; PEND = { t: 0, st: G.stage }; } /* v3.79 바로 등장 (적이 남아 있거나 방을 옮기는 중이면 그게 끝난 뒤) — 몸에 남던 이펙트는 72_cinema가 대화 중에도 흘려보냄 */ } catch (e) { console.error(e); }
      return r; }; }
  // v3.79 조각을 줍고 2.4초쯤 지나 한숨 돌린 뒤 등장 — 그동안 조작이 자유로울 때만 시간이 흐름 (방을 옮기는 중 · 다른 대화 · 살아 있는 적이 있으면 기다림)
  let PEND = null;
  const FIELD = ['combat', 'elite', 'survive', 'start']; // v3.80 전투를 끝낸 싸움터에서만 등장 — 열쇠를 줍자마자 문으로 나가면 비스트로 · 상점 · 빛의 샘 같은 곳에서 튀어나오던 문제 → 다음 싸움터를 정리한 뒤로 미룸
  { const o = update; update = function (rdt) { const r = o.apply(this, arguments);
      try { if (PEND && G && G.player && mode === 'play' && !S) { const R0 = G.dun.cur, free = R0 && FIELD.includes(R0.type) && R0.cleared && !G.dun.home && !G.dun.forge && !G.trans && !G.cine && !G.player.dead && !TRUTH.busy() && !(typeof LOADQ !== 'undefined' && LOADQ.on) && !G.enemies.some(e => !e.dead && e.type !== 'anc' && e.type !== 'dummy' && !e.ally) /* v3.80 들머리 허수아비는 빼고 */;
          if (free) { PEND.t -= rdt; if (PEND.t <= 0) { PEND = null; start(); } } }
        if (PEND && (!G || G.stage !== PEND.st)) PEND = null; /* 다른 장으로 넘어가면 취소 */ } catch (e) { console.error(e); PEND = null; }
      return r; }; }
  { const o = TRUTH.busy; TRUTH.busy = function () { if (S && S.ph !== 'talk') { if (G) G.prompt = null; return true; } return o.apply(this, arguments); }; }
  { const o = TRUTH.update; TRUTH.update = function (rdt) { if (S && S.ph !== 'talk') { tick(rdt); return; } const r = o.apply(this, arguments); if (S && S.ph === 'talk') { /* 대화 중에도 알갱이는 흩어짐 */ for (const q of S.parts) { q.t -= rdt; q.x += q.vx * rdt; q.y += q.vy * rdt; q.vy += q.g * rdt; } S.parts = S.parts.filter(q => q.t > 0); } return r; }; }
  { const o = TRUTH.ents; TRUTH.ents = function (list) { o.apply(this, arguments); ents(list); }; }
  { const o = TRUTH3.spk; TRUTH3.spk = function (who) { const q = spk(who); return q || o.apply(this, arguments); }; }
  return { start, abort() { S = null; PEND = null; } /* v3.80 테스트 Shift+7 */, get on() { return !!S; } };
})();
;

// ==================================================================== 72_cinema.js
'use strict';
// 잿빛 왕관 원정대 — 72_cinema.js : v3.70 대화 시네마 모드 — 대화 · 연출 장면이 시작되면
//  · 화면 위아래에 검은 띠(레터박스, 높이 36칸=화면의 약 8%)가 0.25초 동안 들어옴 · 띠 끝은 2px 망점
//  · HUD(체력 · 스킬 칸 · 미니맵 · 알림 · 보스 막대 · 열쇠 · 조작 안내) 숨김 — 대화 글상자는 그대로
//  · 카메라는 시작할 때 한 번만 맞추고 고정 (v3.72) — 띠에 가리는 사람이 있을 때만 그만큼 옮김 · 작은 방에서도 방 끝 제한을 풀어 엠브라즈 등이 띠에 가리지 않게
//  · 말주머니가 띠에 걸리면 띠 아래로 내림
//  대상: 진엔딩 · NPC 대화(TRUTH) · 용의 유적(RUIN) · 안전 놀이터(DEN) 대화 · 연출 (다가가면 혼자 하는 인사 말주머니는 해당 없음)
const CINE = (() => {
  const BAR = 36;
  let FOC = null, focOn = false; // v3.80 화면 중앙에 둘 자리 (크루가쉬 대화 등) — 대화가 끝나면 풀림
  let k = 0, ox = 0, oy = 0, tx = 0, ty = 0, lockT = -1, lockN = 0, base = null, seen = [], pts = [], on = false;
  { const st = document.createElement('style'); st.textContent = 'body.cine #party,body.cine #phase,body.cine #bkPanel,body.cine #boss,body.cine #skills,body.cine #keyguide,body.cine #lootFeed,body.cine #gearCmp,body.cine #mute,body.cine #trQuest,body.cine #devKeys{visibility:hidden!important}'; document.head.appendChild(st); }
  const busy = () => { try { return !!((TRUTH.busy && TRUTH.busy()) || (typeof RUIN !== 'undefined' && (RUIN.talking ? RUIN.talking() : RUIN.busy())) || (typeof DEN !== 'undefined' && DEN.busy && DEN.busy())); } catch (e) { return false; } };
  const ease = v => v * v * (3 - 2 * v);
  const camOk = () => G && G.player && mode === 'play' && !G.cine && !CA.busy() && !END.busy() && !(typeof LOADQ !== 'undefined' && LOADQ.on);
  // v3.79 대화 중엔 게임 업데이트가 멈춰 막 생긴 이펙트(줍기 고리 · 불티 · 숫자)가 몸에 얼어붙은 채 남음 → 대화 중에도 꾸밈 이펙트만 계속 흘러가 사라지게
  function fadeFx(dt) {
    for (const p of G.parts) { p.t -= dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; p.vy = (p.vy || 0) + (p.g || 0) * dt; p.vx = (p.vx || 0) * 0.96; if (p.floor && p.y > p.floor && p.g > 0) p.t = 0; }
    { let j = 0; const A_ = G.parts; for (let i = 0; i < A_.length; i++) if (A_[i].t > 0) A_[j++] = A_[i]; A_.length = j; }
    for (const n of G.nums) { n.t -= dt; n.y += (n.vy == null ? -24 : n.vy) * dt; } G.nums = G.nums.filter(n => n.t > 0);
    for (const f of G.fx) { if (f.kind === 'lob') continue; f.t -= dt; if (f.grow) f.r += f.grow * dt; } G.fx = G.fx.filter(f => f.t > 0);
  }
  function tick(dt) {
    on = camOk() && busy();
    if (on && G && G.parts) try { fadeFx(dt); } catch (e) { /* 이펙트 */ }
    k = Math.max(0, Math.min(1, k + (on ? 1 : -1) * dt / 0.25));
    document.body.classList.toggle('cine', on);
    if (!camOk()) { ox = oy = 0; lockT = -1; return; }
    if (!on) lockT = -1;
    if (!on && !ox && !oy) return;
    // v3.73 카메라 완전 고정 — 대화가 시작된 순간의 화면을 그대로 붙잡음 (카메라를 다시 계산하지 않음 · 화자를 따라가지 않음)
    //  · 띠에 가리는 사람이 있을 때만, 띠가 들어오는 도중(0.15초) 한 번 '컷'으로 옮기고 끝까지 그대로 · 나중에 나온 말주머니는 띠 아래로 내리기만 함
    if (on && FOC) { // v3.80 지정한 자리를 화면 한가운데로 — 부드럽게 옮겨 고정
      focOn = true; if (lockT < 0) { lockT = 0; lockN = 4; base = { x: cam.x - ox, y: cam.y - oy }; }
      tx = Math.round(FOC.x - VW / 2 - base.x); ty = Math.round(FOC.y - VH / 2 - base.y); const a = Math.min(1, dt * 7); ox += (tx - ox) * a; oy += (ty - oy) * a; if (Math.abs(tx - ox) < 0.5) ox = tx; if (Math.abs(ty - oy) < 0.5) oy = ty;
      cam.x = base.x + ox; cam.y = base.y + oy; cam.clX = false; cam.clY = false; return;
    }
    if (!on && focOn) { focOn = false; FOC = null; }
    if (on) {
      if (lockT < 0) { lockT = 0; lockN = 0; seen = []; base = { x: cam.x - ox, y: cam.y - oy }; tx = ty = 0; }
      if (lockT < 0.15 || lockN < 4) { lockT += dt; lockN++; seen.push(...pts); { const r = typeof RUIN !== 'undefined' && RUIN.talkAt && RUIN.talkAt(); if (r) seen.push(r); }
        if (lockT >= 0.15 && lockN >= 4) { const P = G.player, L = [[P.x, P.y - 24], [P.x, P.y], ...seen]; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
          for (const q of L) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
          const fit = (lo, hi, a, b) => { const n0 = lo - a, n1 = hi - b; return n0 < 0 && n1 > 0 ? (n0 + n1) / 2 : n0 < 0 ? n0 : n1 > 0 ? n1 : 0; };
          tx = Math.round(fit(x0 - base.x, x1 - base.x, 56, VW - 56)); ty = Math.round(fit(y0 - base.y, y1 - base.y, BAR + 52, VH - BAR - 14)); ox = tx; oy = ty; } }
      cam.x = base.x + ox; cam.y = base.y + oy; if (ox || oy) { cam.clX = false; cam.clY = false; }
      return;
    }
    // 끝나면: 원래 카메라로 (옮겼던 경우만 띠가 빠지는 동안 빠르게 돌아감)
    lockT = -1; updateCamera(dt);
    const a = Math.min(1, dt * 10); ox -= ox * a; oy -= oy * a; if (Math.abs(ox) < 0.5) ox = 0; if (Math.abs(oy) < 0.5) oy = 0;
    cam.x += ox; cam.y += oy; if (ox || oy) { cam.clX = false; cam.clY = false; }
  }
  // ---------- v3.70 테스트 Shift+7: 시네마 모드가 나오는 대화 장면으로 차례대로 바로 가서 시작 (누를 때마다 다음 장면)
  const ready = () => G && G.player && !G.player.dead && mode === 'play' && !G.trans && !G.cine && G.dun && G.dun.cur && !(typeof LOADQ !== 'undefined' && LOADQ.on) && !busy();
  const feed = (t, c = '#9fd2ff') => lootFeed(t, c, 3200);
  const sub = () => !!(G.dun.home || G.dun.forge || G.dun.lab || G.dun.den);
  // n장으로 (이미 n장이고 원래 던전이면 그대로 · 유적 · 놀이터 · 실험실 같은 딴 곳에 있으면 그 장을 새로 엶)
  const toStage = n => () => { if (G.stage === n && !sub()) return; G.stage = n - 1; if (n === 4) G.altarDone = true; G.noLoad = true; nextStage(); if (mode === 'wmap') wmEnd(); if (mode === 'parchment') closeStageParchment(); };
  const here = () => () => { if (sub()) toStage(Math.max(1, G.stage))(); };
  const EV = [
    ['정보원 PRS-22 · DW-5000 (지금 장의 첫 열쇠)', [here(), () => { const D = G.dun, P = G.player, k0 = D.keys; D.informed = false; D.keys = 0; collectLoot({ type: 'sealkey', x: P.x, y: P.y, life: 1 }); D.keys = Math.max(D.keys, k0); }]],
    ['키륵 첫 만남 (1장 구덩이 실험실)', [toStage(1), () => { const q = TRUTH.Q; q.met = false; q.q = 0; q.book = false; if (G.dun.cur.type !== 'lab') TRUTH.dbgLab(); }, () => { if (!TRUTH.Q.met) TRUTH.dbgKirk(); }]],
    ['키륵에게 연구 일지 건네기 (1장 구덩이 실험실)', [toStage(1), () => { const q = TRUTH.Q; q.met = true; q.q = 1; q.book = false; if (G.dun.cur.type !== 'lab') TRUTH.dbgLab(); }, () => TRUTH.dbgJournal()]],
    ['엠브라즈 (용의 유적)', [here(), () => RUIN.debugEnter(), () => RUIN.dbgHead(), () => RUIN.dbgTalk()]],
    ['도박사 명수 (안전 놀이터)', [here(), () => DEN.debugEnter(), () => DEN.dbgTalk(0)]],
    ['도박사 영수 (안전 놀이터)', [here(), () => DEN.debugEnter(), () => DEN.dbgTalk(1)]],
    ['쿠키 (비스트로)', [here(), () => { if (G.dun.cur.type !== 'rest') debugToRest(); }, () => { if (G.dun.cur.type === 'rest' && G.dun.cur.bis) BISTRO.act({ who: 'cookie' }); else feed('테스트 — 이 층에는 비스트로가 없습니다', '#9a8f8a'); }]],
    ['쿠오 (비스트로)', [here(), () => { if (G.dun.cur.type !== 'rest') debugToRest(); }, () => { if (G.dun.cur.type === 'rest' && G.dun.cur.bis) BISTRO.act({ who: 'kuo' }); else feed('테스트 — 이 층에는 비스트로가 없습니다', '#9a8f8a'); }]],
    ['세 선조의 마지막 대화 (3장 선조의 결투장)', [() => { if (!TRUTH3.inArena()) TRUTH3.debugAnc(); }, { until: () => TRUTH3.inArena() }, () => TRUTH3.dbgFinale()]],
    ['크루가쉬 · 약속의 결투 (3장 보스)', [toStage(3), () => { TRUTH3.T3.freed = true; debugToBoss(); }, { until: () => G.enemies.some(e => e.kind === 'krugash' && e.kg && e.kg.ph === 'wait' && e.kg.t > 0.7) }, () => { const b = G.enemies.find(e => e.kind === 'krugash'); Object.assign(G.player, { x: b.x, y: b.y + 60 }); TRUTH.act({ a: 'c3kg' }); }]], // v3.76 말을 걸어야 시작
  ];
  let evI = -1, Q = null; // Q: { steps, i, wait }
  function skipTalk() { // v3.80 진행 중인 대화 · 연출을 모두 끊음 (테스트 전용)
    const f = [() => TRUTH.abort(), () => INFORM.abort(), () => RUIN.abortTalk(), () => DEN.abort(), () => { if (G.cine) { G.cine = null; if (typeof setHudDim === 'function') setHudDim(false); } }];
    for (const x of f) try { x(); } catch (e) { /* 없는 모듈 */ }
    if (G && G.player) { G.player.state = 'idle'; G.prompt = null; } Q = null;
  }
  function dbg(dt) {
    if (typeof DEV !== 'undefined' && DEV && !DEVK.has('sd7')) DEVK.set('sd7', '대화 장면(시네마 모드)으로 차례대로 가기');
    if (typeof DEV !== 'undefined' && DEV && pressed['sd7'] === 'shift' && G && mode === 'play') { pressed['sd7'] = false;
      if (busy() || G.cine) skipTalk(); // v3.80 대화 중에 눌러도 지금 대화를 끊고 바로 다음 장면으로
      if (G.trans) { feed('테스트 — 방을 옮기는 중입니다. 잠시 뒤 눌러 주세요', '#9a8f8a'); }
      else { evI = (evI + 1) % EV.length; Q = { steps: EV[evI][1], i: 0, wait: 0, lim: 12 }; feed(`테스트 — 대화 장면 ${evI + 1}/${EV.length} · ${EV[evI][0]} (Shift+7 다음)`); sfx('blip'); } }
    if (!Q) return;
    Q.lim -= dt; if (Q.lim < 0) { Q = null; return; } // 12초 안에 못 가면 포기
    if (Q.wait > 0) { Q.wait -= dt; return; }
    if (!ready()) return;
    const st = Q.steps[Q.i];
    if (st.until) { if (!st.until()) return; } else st(); // { until }: 될 때까지 기다리는 단계
    Q.i++; Q.wait = 0.35; if (Q.i >= Q.steps.length) Q = null;
  }
  { const o = update; update = function (dt) { const r = o.apply(this, arguments); try { tick(dt); dbg(dt); } catch (e) { console.error(e); } return r; }; }
  // 말주머니: 지난 화면의 자리를 카메라 초점으로 · 띠에 걸리면 띠 아래로
  { const o = flushBubbles; flushBubbles = function () {
      if (on) pts = BUBBLES.filter(b => b[3] >= 0).map(b => [b[1], b[2] - 15]).slice(0, 4); else pts = [];
      if (k > 0) { const h = BAR * ease(k); for (const b of BUBBLES) { const top = b[2] - 30 - CAMY; if (top < h + 4) b[2] += h + 4 - top; const bot = b[2] - CAMY; if (bot > VH - h - 4) b[2] -= bot - (VH - h - 4); } }
      return o.apply(this, arguments); }; }
  { const o = drawMinimap; drawMinimap = function () { if (k > 0.01) return; return o.apply(this, arguments); }; }
  { const o = render; render = function () { const r = o.apply(this, arguments);
      if (k > 0 && !(typeof LOADQ !== 'undefined' && LOADQ.on)) { const h = Math.round(BAR * ease(k) / 2) * 2; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, VW, h); ctx.fillRect(0, VH - h, VW, h);
        if (h > 0) for (let x = 0; x < VW; x += 4) { ctx.fillRect(x, h, 2, 2); ctx.fillRect(x + 2, VH - h - 2, 2, 2); } // 띠 끝 망점 한 줄
        ctx.restore(); }
      return r; }; }
  return { focus(x, y) { FOC = { x, y }; }, get on() { return on; }, get k() { return k; }, get dbgT() { return [tx, ty, ox, oy, lockT, seen.length]; } };
})();
;

// ==================================================================== 73_baldor_free.js
'use strict';
// 잿빛 왕관 원정대 — 73_baldor_free.js : v3.80 발도르 해방 컷신
//  · 진엔딩 루트(이번 판에 2장 「저주의 주문」을 읽음)에서 발도르를 쓰러뜨리면: 그 자리에 멈춤 → 컷신(대화) 「…드디어, 해방이군.」 / 「고맙네. 낯선 이여.」 → 원래 사망 장면
//  · 주문 「해가 뜨지 않는 한, 너는 눕지 못하리라」와 이어짐 · 대사는 다가가지 않아도 바로 나옴
const BALFREE = (() => {
  const LINES = [['bal', '…드디어, 해방이군.'], ['bal', '고맙네. 낯선 이여.']];
  const isBal = e => e && e.type === 'boss' && !e.kind && G && G.stage === 2;
  const on = () => !!(G && G.truthRun && G.truthRun.t2);
  let B = null;
  function hold(e) { try { cancelTele(e); } catch (x) { /* 없음 */ } e.steps = null; e.dash = null; e.air = null; e.z = 0; e.state = 'recover'; e.t = 99; e.hold = true; e.vx = 0; e.vy = 0; }
  { const o = killEnemy; killEnemy = function (e, silent) {
      if (isBal(e) && !e.dead && !e.balPass && on()) { if (!e.balD) { e.balD = { t: 0 }; e.hp = 1; hold(e); B = e;
          G.tele = G.tele.filter(t => t.owner !== e); G.eproj = []; G.mproj = []; G.hazards = []; G.vortex = null; /* 칠흑의 장막도 걷힘 */ sfx('growl', 0.5); addShake(4); } return; }
      return o.apply(this, arguments); }; }
  { const o = damageEnemy; damageEnemy = function (e) { if (e && e.balD) return; return o.apply(this, arguments); }; }
  { const o = update; update = function (dt) { const r = o.apply(this, arguments);
      try { if (B && G && !B.dead && mode === 'play') { const D = B.balD; hold(B); D.t += dt;
          if (D.t >= 0.6 && !D.talk) { D.talk = true; const e = B, P = G.player; try { CINE.focus(Math.round((e.x + P.x) / 2), Math.round((e.y - 34 + P.y - 12) / 2)); } catch (x) { /* 시네마 없음 */ } /* 발도르와 주인공 사이를 화면 한가운데로 */ TRUTH.talk(LINES, () => { e.balPass = true; B = null; killEnemy(e); }); } }
        if (B && (!G || B.dead)) B = null; } catch (x) { console.error(x); B = null; }
      return r; }; }
  { const o = TRUTH3.spk; TRUTH3.spk = function (who) { if (who === 'bal' && B) return { x: B.x, y: B.y - (B.tall || 64) - 26 }; return o.apply(this, arguments); }; }
  return { get on() { return !!B; } };
})();
;

// ==================================================================== 74_notebook.js
'use strict';
// 잿빛 왕관 원정대 — 74_notebook.js : v3.80 원정 수첩 (시안 _시안/원정수첩_시안02.html) · 메모 색연필 밑줄 (시안 _시안/원정수첩_메모_색연필_시안03 · 밑줄은 일자)
//  · 주인공이 대화로 「들은 것」을 그대로 적어 두는 수첩 — 힌트 · 진행 상태 · 빈칸 없음 (기억하기 위한 기능)
//  · 여는 방법: N 키 · 인벤토리(I) 아래 「원정 수첩」 단추 · 닫기: N / ESC
//  · 탭: N번째 밤(이번 판에 들은 것) · 소문(음유시인 · 정보원) · 진실 기록(양피지 · 판이 바뀌어도 남음, F로 다시 펼침) · 해(「해」가 나온 말)
//  · 적는 곳: TRUTH.talk(11d) 시작 · 엠브라즈 대화(36_ruin)가 끝날 때 → NOTEBOOK.heard(lines) · 아래 TITLE 표에 있는 대화만 적음
const NOTEBOOK = (() => {
  const POR = {"kirk": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAOCAYAAAAi2ky3AAABTklEQVR4AYSRIUtDcRTFjy8YDCIGMYgMk8Egpn2C4ScwmPwGwoKIwWAQMYiWZfOyQRaMsiDDYBDDeIhZxLC6vd9l5+394Y2Nd94999zzP+/yX6Y5v9X1lXEd5thVG0TA1+BFVZzc7AswU80vYwA8g3PAvetF6y5o86ghPNEULziIjTxEcMh1ry2j8CdP1Q9nmP3/jpb63VwIABE8NCUAJ5DKVrsHa9DSz1kyYiMIAghX8TrtS6Cg8RAGPgd/0eMFnEWIIAgCeDx/p9Vl61bwKtAYOgA/PSiDaAwOX/XO4l/izgw0e7hPc2oSxHBv+1DgrbOp4+WNANyo2yYJckhja0dG+372HWt8BC8gwAgnIutbXFQJw885eyOIS+NeLLqyRXUr61T8nIODCIIY+c8wqGs00xca4dM2KWUQ6R/fzwL5sBv16bUTFc3csyRF0gQAAP//59qnzgAAAAZJREFUAwAL8Me54qHVHgAAAABJRU5ErkJggg==", "owl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAPCAYAAAARZmTlAAACHElEQVR4AYSTTUhUURiGX4cImWCIGFyEoIsICZGBZhG0GSpaRQnSrFrprqKfTa2y27SIIoiiwkXTIqRCUESkhdggIoPEKBE0TEY/xiAhg4mkiwjqPmc6l9NV78h9zne+9/t5nb+YGvztiif+RLU0qjMbacKCnlRSRJrDoG9XpwbMRJrQ0NmelF3EkAs6dfpc6Dl1IK65wgPzD25rQiNLGGbR9e4OhUGnjk4/960ITGhysc29uTuyWI1oNSJ5mExnsw4euaD1jbUmY8LywgtPLgydu3qeoB1VT13pbmOGwGKr2ZwI7LqX3aPLQyvGAC2GOHzthH6US/9B0aU8mjJp9njcRA6rcY8ixsvpuTmuMAw9uv1Qn97P63erZ/g542li6islk6OTPO2/QjAfMpfTuUFCgHm7yPKXMnJBG35b05dbTzR55qxhdmBZiUrc3K3W1nVSN0Yr+jiU1WsvrWrllT687Gc8MA1MjOofh/av+Wf96WuJq/h9RbnmFj3el9pE37tqsPxb+bN67xbrg/55MZP0z/qzyWR2IVGv+Gd+eUOT7R1Ktu71s60flruVw+ljbmrugUmxtCAXqnz/F9/Mq1ZdIm3IyNiAINwYmORnluRCI+810WVuZNxNddQraezfl2F1+pnA5rbRmKz7P5gozKspTKjmw+D04PMmzNp27xTcn6oZMwyBHNhJvzHh0ojF1V8Ct48c0FgYBh3+AgAA//9xKNqIAAAABklEQVQDADOcLT5BvjrxAAAAAElFTkSuQmCC", "prs": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAMCAYAAAC9QufkAAAAt0lEQVR4XmNkwAK4ufj+owt//faJEZtaFADSGB4Q///bp3dwDOJjM5CgRpghBA0AmQ5SDKNhGkH8a+cvYdjOhM0fr188AAuHeHiAaRgfHcA1g0z3cQtEkV+zYwcKHySP7HcMmz+fuoQ1UIXfvsNtMwzcvnYHwwCQgSBxdACOO5iTt+xaD5bf2dHHoKqlgmKge0URmI8S37B4RfYLiI2OsfoFpghZEiSWFRYAFkNmEwWQDcRmOAwAAPibhedyYTu4AAAAAElFTkSuQmCC", "dw": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAANCAYAAABy6+R8AAAA3ElEQVR4XmNgYGBg4Obi+w/CIDYugKIGxPmwYMX/F4ujcGoEqQHJg9SB2Cwgkx/cuMMgoQ2xA5+NIHUgwAhTeHemDz7XgYFy+haGr98+MTKBTEbWAJJABsh8kDqQeiaQAuGAHrg6fy0hMJvjrx+YhvGR1TGCA+LlDbimtxtKwOwXV7UYJLSvoSgGAQFxDUxNhABIE9h5MNNB4OvRUyj6kPknu8PAcmBNyBq5rc1QNMH4yAYzgYIQFkLIEsgAJH7n9iMG955L4CCHy4EDZMcGcIyjY5g4hn/xpT90OQBdfG4PGKR6gQAAAABJRU5ErkJggg==", "krug": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAfCAYAAADwbH0HAAADt0lEQVR4AbSWT0hUURTGTyLRHxESMSgpFy1CokW5lhCiP7QQpoIktEVZtKiQkJjEhQspCfuzKmtRBrYoRSS0DNRyUYmFhIVKyFiThMkIMSMW0tTv5nncefNeM6UJ35xzz/2+8917593nZIjP3+pV2fG7hYXx8ty8OLkPLakMFx0gTyIsFJKMIYPrBfnyZGpadublLlD/LqClB72AW51gDAEyQNg6O+fmpxzHZr8uOxEKOwsOrFoh9KO3LXaMmZh41yl7OpvMTtWUBdiCdHN0ugB60hsP1RtjCkw0NlwydUxZOdDcTKT5YeswV9npIyWCF2NjTDI4OCjFJTtkY+FeQUgN2DnjdKE6Ij21v+odYy38z/isp89pn8HWOeaioiIJlNcm7NZhLTJh1/Suqj4reOGZsGP7O1ikV4IcIwz1GWLSMXZ/B0wuJdz9MzgGvnyOGiylmd2L3gAvPJ0dK4kj4Wh0vNhIL3q6+yQYcxygtbnO3DdEbkG6Y7SAXvQEtjbB2J5glQCxwp73ypVHRAvsK2RrjDFnztnrhE1GzNNOpKFy3JE55cHVeV5KmuOBF2NjTEKBu0Zukxlz//QqYOAFN48x0E3QGw9qwDFmwAQEJVMDmIaj6ySw/7DcaGp2MDo27uTUq2pbBB4aBZugJ721RkwwpgDh6u0e887maKix4/ysSVLp7u52EAzWOjl1CMpDC7xM4SUZU8RcgRiwmP6R+wJG5jsFRDe8MJFcAQ++3YfcDU9jN2lX1SZT6spcKyuHZuRlSKQ5lCX1Pd9NjD4IOzWIyif3wx+NeYjY+ePG90ZftiYqm6u3SqzjkWwf+iDBkuUmDkwOS6Akx4whwkeHnrEXfI0RcS2IvAS8xBh41eGjU70Xx9cY8oGDlUIT3rHE0d6IYFZcsVs4TkX5lTJTZw6e8muDNbTxhK8xRzUwHJaLDU2irzuuDMj/lNgLw7JDx8zVYgZ+R1u73Gl/7fv/3deYo6oo3SaYt3Z9lOm5AnrK8cpyCa8XaTp6TeYfRkyNnbfcuylPe/sNDy6m6OljSK4PX2N2jBh+8fMuaRupM2AMKm+dksx9OcZcF/Dqc6vhxOuDUP5txygxJ4LweEQA+Y83Manfkm123XDu90lQn/kScziMbT1jG747tknkb9sjAnh4Llw+L6HMUvPdE0/WnDEP4dTwN8OBnwoZqQismt/GRLgtHWMCAr9+GCoYA+bh2XxqXkhpjIhmRDDY1yaAXOuMATWgdXI/pGVsiyemZwWkqtnzXvlPAAAA///t5NaDAAAABklEQVQDAH6zbG0A0cXGAAAAAElFTkSuQmCC", "bal": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAARCAYAAAAyhueAAAAB50lEQVR4Xo2UTShEURTHz2jkK0zCkEYhhpGahdHMgsKKbLCapJSFrZpiY4lQs2FloRQ1i/GxkWxQLIjNRAgTZcIQLx9jEEX/y33ue/Pe5F/Tvffc//3NuefcGSINJRqTvvARt/haPXKJZxK0oFBbS7cCcLrkZmv1CC/i8HMZ9KDcuLA0xSwzfRUx1s6xIzkB+D4+3xlPF8ozyMu1UPg2RK7qJrKW2hTgaZ+X+D4H/gsKGKQGigJchOrWFNf/DxDqcnvk+kNGvZpCwbM9Mj3e0ETDIrn9DqX14oh8nkhsPF5NkamtzEGZGdns6uGbC8ozF8pgcY35ypo/fqPENyqCtcSBkGb3AZuvqaXgncRM/WcHMqewoJzMOfnyejewrvgOze5zINS+s8mKz4XuAmqzVlFP6gBNRgfpXrpjYLUPcN1GNVqW/6C/MwAtNiv1HA7QsNTLolo+9qR4lrMnQXb10eJKuppLYL+Y1VCzDEeGocNjNnJhHz7v+CW5UtIZK+6TgnB1aKjDQM462Edogoy0vRGmzsDfviiD2JxtSSJnVlZMk9Ewh72exVFHcd5qyqfztxcqSUujq2iEtl6ff6CcAsPiw7Xm0yktqmLx0/N9xRyyJ2dQ4O1JPseg/DmIc1Hq/1ZROKtmfAMNOeioeiVKoQAAAABJRU5ErkJggg==", "gor": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAXCAYAAACFxybfAAACtklEQVR4Xp1VPWhTURQ+DUFEOoQ2BDEdMhQrHYpKoAVDkLhn6CAdCkqHUtChSOkkuGQKHboI4iAIRUqQDEWKDpYSnhDhoSIU0lKkQ+wQ+uAhoiCFyHfCiffd93efHzzeffedv3vOd84dIQ1XLmT6+h5w+scdCdqPQmJbUMDTd4/7nbfb/JYH3/LfJBCRhZ6JrRSMQul7z6a9nWc+H4dtm6bmioT/eMJOJxBbkA0CbMGPaislSiogCOc6sBcViG4LdoJsCMRWGhtyWijlc35FCAcFZYJKdcUn5suScEDqHmQYJ9Rrq5dF+KRyKax0qizsciaC0qYCnVGprjBvoqBmCxmI6ihVNi0fcUpSNrWe+VxxmLkgUodBP1Q6Lgsq3PQEdZoP6d7Tz/Tx/Qdq7r6h2Tu3eO0S8frlgxvUyyx4uiVuxqSSEK61Z7EDOJ3NvmZHWAP4xloPIKqbBIkyMdNuU2F9gei8S07jnCZpe2jIIaJMuUvVcoGmRi/S5kY4e0BMtXwptCSeqJRB6evaIi1Z+8ydk/o/5yqyLYv/5yv3CfJRkFkE38b3AQJ5UbrNdh+19ungd4ecJ7Whn3J9y7M3s7HF/2TGqPNC7bL/CqI4NxF5wvH1VXLqmxwEsiuplwaQwShDETI8J5LirFwKnYQIQIW0o+5DLX+icoihpcvTtLp402O3sdOh2pF3mMW1poBv0TjoN2NpMkd2u8tq48uDu+Zu9Ro9vjpYm964xkFIAKilOlPADQTgPLd9gaDekEUbxl39gBEn3s2vsVOQTToEkADwFkhJ0K6SrTgYBWEd9+hb7yfbwqy4filD9OnLoAyuRY1XGNpegCOnP37F+WcYEVNSKkTD93y2EOigeXYybE0ImJDTKBNBhqbHshyE2hEgJvZrR3bspaXCKBM6dLLJUFLlTDIg+Av9KNzBzkdlkgAAAABJRU5ErkJggg==", "zak": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAiCAYAAAA3WXuFAAAEX0lEQVR4AbSWTWhUVxTHT7KwpWSR1lSk4yKEIYa2hNAK7SKEErKQOoSQRSkltGK7abTtUFIJrcVRggTJwo/oQhBUgkgWQUTcKEFCEBdRRFRMCJKFERE/shCJbuL9HXMe992ZN8nMxPD+73yf85/zbt5MtbzHv8/W1S4BG+Hr5gvleyHEYDD/ZEoAOjA9JOHba0qIoYDBQAc9XlBSke2c5ACn5l0xQklJeVWBgzrA0PnbVyS1YYuII6JwudNnL4hBc7zNuXDsighpw9cvBBnLWMEg34ZAINXcIfOuD5LS6fEJRAQjhoM66tENSggnTaZv3DX/qqTWuU8bJp8+fDJGKoxjQwwZQgmFzpJt7/GUUgupcEtlE4q2A5llFvaYlk0V7dn9MjxwRpDqCG4hqWpt7J655Y1fm1zxHGkNj2qZDEQAPQ4cHEIoOAYoR7vqEUoqiZgmuFv1ozcLVakPPnZq6RckAD1A2IG+3XX18sf5OUESJ68YqYKPbDVbojlgAJKt+dvBBx68WhADNqAmJGVnqSAhiowUg7B90JB3DZI4KESGmoaPauWWIwXIx1cI1k8Jkch6N3/9RSwXUoCBIUjEBxGAbfjlr1+FfmYjmYE0YIdbIqaEUEigSUiKGKRCQAIQ9+GT4dyMPZ0Tevs5puOHlP+fFhEiiYQkUsTBcGeP/N2RQc2DkaFPXrCIY/NPnVE0RggvzYwU2wL4DUevZU1VCQkDddRrwN04zE6s6oqdobCCpjQ3HBkaFsPO/utSv3WrjJw9p7AcJHX04mzxuFY6yOSGyNuQJVjzru4f1XWs/0OVdrt84ktVP29x3+xOs3ynlnRRZ9uhMJEQn9LIkLhzcBERAbuxIa02pMhXo4wbpKwskRAJMw9mEVJMGilNdDeItbh3z1iR/y6XlngVJETTbF+/Fh0b/FYlpC6P9kTkQv/YpYvRdyAvQy0q45ZHCDI0/6c3I/duTUmqMSt9NTWybmZWnp2YknMdTYptLTmV2OR801Qr9iHK4BGV5BEiMjE+KamG1tgLbe7lgqzft4ew4owj3HZwJPKR39beqrFyHxfFMUK2nUNDg8RiqK+plWd7B2K+id09su3Td4+Ug9n9fabiLcUIMY3tIBmANPz5VYus352V5qGRCNhsynKQtiX0chAjBAm2g/Sb7Zi8KuD/5p9lT+OWCLw/IEg+2+VlyJaw/fpS9BghCv1mpzY2LekQ9yOLWGt6g/zQ2aQYmJnSH13EIUN8LZBHyJoyJLOjQ3LbW4VDOj6c0y0dGrkpoxfuy4FPNsqu3HaN3e7rEUCe1ZcrEwl5DVVt35UTXnjpN8/l4sNZGV1cFHwa9G7+hj33qtWihNiEnRE6Zjal5VXdJkECfIAcctErRSIhPunvbTXRu4jDzDDOTu+dK1VIfIBcbCQ5lSCREE2rjp+vQgJIABs6/9t3gg2Imx+9EhQlVKjxUm/XEn6fLPZaIZHQv3VpHRzK/0bv6OzQb7YGK7i9BQAA///A5OhUAAAABklEQVQDACpBajpRq5lcAAAAAElFTkSuQmCC", "utu": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAqCAYAAADS4VmSAAAEJklEQVR4AcyXT0hUQRzHf3aIqAgpCWk9SAhFgUR46OBBwlNJhHQrCiJCpCIiOtgfKkIiPEQH8bQgFISEhIhUmIissMISIhoaEhJtLCK1RIgUZO8zu7/H7NvZt4vuQsL3/f7NzPc782bmrVsk5G/f1ur1kHJZSgUFQJ5cTgi2LEwFBikooED7sqedAph1cma07GSuAZ0C7IYIQZCdK6efJwAySMtJEjZWjoAc8tpqkVTa9EUQNROU+ZEj4NvvdFWksTWPghy1vEIZEjkC/PG82V89dMaElSSHwC2ACvCEYCqJcAGVZM6O/X8KOFnfKoMrSxLZ2ySV2nzZBRDnCuzf7h1Br0WlyT0KtwAKQXAP2AjWNxo7V8AeTEn5MtrQvN12I36oAEiUVH6tiY3qvyJjQ32b/lyHCoDcJw1Mb24pJu1tHZsWkSOAGR/xNiAnwCcPEGt4uL5ZECFfUpsSkSOAwfUE4AOIFMSA2Lb4LjAh4KppLk+AFjZiIbOR/Lkoyc+x0H1SVMCc964RoxZ/sPc+JvMKjJd5KCGkmYzIwkjml5UK07zaggK4BWXnNtPOJmf5D5xo9cmPX7kvx091mHb6UFLii9e6MaLiVAiWQkEB3IK2CAaFnE742Mj+Zn9gYheiz7r8tPazxfgCUKQnAHJi09M7/xAza2JWo70z8wqIgQ6MXyq0jy+AjnoCIOcYAmYJKSKClj793nF8eOupdO+ulbO1TdLfdEbsOH6vT1q8ox1sR57+OQJIAIgX4gkBgyPDMjWfluibjJ3788OPaftubU3uPbkuXd9ThHIh8cqPX6QScuxhh4yvpuWCt5m1nebp4BQAMRtraGJJJsZitPMx9X7S93EYDAtsn7gUOAVAzj542vNYGuNxSXf3SMPYyzyUQmC30RNh55wCIGcfRJtbpOlYndyYGJc9D+7Y/Zx+v7cfnIVs0j4R2VTm9wBkegK0YNu5lYREdhyUxp7nOdA2rplprZj1V0BPABsQQXS8GBs3hHcbz8vMzXN5oA3QmbHROAXkFMWsL0AbmsvHCxACPFeunzuKKQmcgpIaZhvlCSAPMSeh/2AboSTiX43dyKPY63EKeNt+U2omYv7ZVmJbyHA085Fh49kXD6/Aji9X7w6/iHjf7TX1wo8Qdj9kscVlGRiaxzV49mFazvcOCxZi/AHvAqK46YsIUpucOJr6KI8+Jcz/BMTT3k3WVtcgYLWmzlh8BNiXj/rFlp1+ii04kGAVxGC98/Q6OXwsQFjn7GgVltgFPRWuWjBnBASTGlf1vq5SH1KgYpKXWrQUavUrGmyk+VABwU7Euiq2OB2Muo3Irgbha6o5fTWaZzIFBXTVNJjlD9rbA7NmPPIMoIOZZPahgqiDbFomF8eMSw4QFBTQvbJolr+YZSCFimHW5CAA+FrDJ6f4BwAA//+YOfUiAAAABklEQVQDAFtmYV4WAXJKAAAAAElFTkSuQmCC"}; // 게임 도트 그대로 (1칸 = 1px 원본 → 화면에서 2배)
  const WHO = { kirk: ['키륵', '구덩이 실험실', ['kirk']], owl: ['음유시인', '대장간', ['owl']], inf: ['PRS-22 · DW-5000', '정보원', ['prs', 'dw']], krug: ['크루가쉬', '핏빛 엄니 부락', ['krug']], bal: ['발도르', '무너진 성채', ['bal']], cult: ['용혈 덩어리', '지하 석실', []] /* v3.84 교주가 남긴 덩어리 (초상 없음 · 주인공 혼잣말) */, anc: ['세 선조', '선조의 결투장', ['gor']] /* v3.53 초상은 고르마크 하나만 대표로 (셋을 넣으면 화면이 깨짐) */, emb: ['엠브라즈', '용의 유적', []], doc: ['', '', []] };
  const NPC = { kirk: 'kirk', owl: 'owl', prs: 'inf', dw: 'inf', krug: 'krug', bal: 'bal', zak: 'anc', gor: 'anc', utu: 'anc', emb: 'emb', cult: 'cult' };
  const SPK = { prs: 'PRS-22', dw: 'DW-5000', zak: '자카', gor: '고르마크', utu: '우투르' }; // 여럿이 말하는 장면만 이름표
  const TITLE = [ // [누가, 대사 속 글귀, 수첩 제목]
    ['owl', '시큼한 점액', '시큼한 점액 냄새'], ['owl', '이상한 그림', '성채 벽의 그림'], ['owl', '피로 그린 원', '결투의 장소'], ['owl', '휘파람', '제단의 바람 소리'],
    ['kirk', '무기 든 사람', '구덩이의 고블린'], ['kirk', '배 속', '초록 왕의 배 속'], ['kirk', '안 떠', '{해}, 안 떠'], ['kirk', '죽었어?', '녹아 버린 책'],
    ['inf', '정령의 불씨', '정령의 불씨'], ['inf', '기사단 인장', '쪼개진 기사단 인장'], ['inf', '전사의 엄니', '전사의 엄니'], ['inf', '붉은 보석', '붉은 보석'],
    ['krug', '머리가 맑다', '약속의 결투'], ['krug', '약속대로', '크루가쉬의 마지막 말'], ['bal', '해방', '해방'],
    ['anc', '들어주도록', '선조의 바람'], ['anc', '저주에서 풀려난', '답하지 못한 선조'],
    ['emb', '엠브라즈.', '엠브라즈의 부탁'], ['emb', '가려움이 사라졌군', '근원을 끊어 달라'],
    /* v3.84 */ ['cult', '맥박처럼', '용혈 덩어리'], ['cult', '이런 게', '용혈 덩어리'], ['cult', '굳은 피', '용혈 덩어리'], ['cult', '따뜻해요', '용혈 덩어리'], ['cult', '뜨끈하군', '용혈 덩어리'],
    ['emb', '저주라네', '비늘을 삼킨 자'], ['emb', '밤이 번갈아', '{해}와 {낮}'], ['emb', '장본인', '애쉬른'], ['emb', '섭리에서 벗어난', '봉인된 용'], ['emb', '정화해야 하네', '{낮}의 세계로 가는 길'], ['emb', '세 가지로 빚어진다네', '태양석의 재료'], ['emb', '태양석일세', '태양석']];
  // 수첩 오른쪽 아래 메모 — 완벽한 실마리가 아니라 「무엇을 해 볼까」 정도만 (제목 기준)
  const MEMO = { '시큼한 점액 냄새': '냄새의 근원을 찾아보자.', '성채 벽의 그림': '벽에 그려진 그림을 찾아보자.', '결투의 장소': '피로 그린 원… 어딘가에 있을지도.', '제단의 바람 소리': '제단 쪽에 귀를 기울여 보자.',
    '구덩이의 고블린': '말이 통하는 고블린이다.', '초록 왕의 배 속': '초록 왕과 싸울 때 잘 살펴보자.', '{해}, 안 떠': '{해}라는 말을 기억해 두자.', '녹아 버린 책': '이미 늦어 버렸다.',
    '정령의 불씨': '남은 불씨 하나를 찾자.', '쪼개진 기사단 인장': '남은 반쪽을 찾자.', '전사의 엄니': '남은 엄니 하나를 찾자.', '붉은 보석': '남은 보석 하나를 찾자.',
    '약속의 결투': '도끼를 꺾으면 이야기를 들을 수 있다.', '크루가쉬의 마지막 말': '왕관과 {해}. 무슨 뜻일까.', '해방': '무언가에 묶여 있었던 걸까.',
    '선조의 바람': '선조들의 뜻을 크루가쉬에게 전하자.', '답하지 못한 선조': '답을 들을 기회를 놓쳤다.', '엠브라즈의 부탁': '가려움의 원인을 찾아보자.', '근원을 끊어 달라': '꼬리 쪽 구멍 너머를 살펴보자.',
    '용혈 덩어리': '엠브라즈에게 가져가 보자.', '비늘을 삼킨 자': '비늘의 힘은 저주였다.', '{해}와 {낮}': '{해}가 뜨면 {낮}이 온다.', '애쉬른': '이 밤을 만든 자의 이름이다.', '봉인된 용': '엠브라즈의 몸은 {낮}의 세계에 있다.', '{낮}의 세계로 가는 길': '{해}의 빛으로 왕관을 정화해야 한다.', '태양석의 재료': '영혼과 피, 불의 정수. 약속하면 덩어리를 태양석으로 바꿔 준다.', '태양석': '왕관을 {해}의 빛으로 정화하자.' };
  // 색연필 밑줄 칠 낱말 (제목 기준) — [낱말, 이 글귀가 든 줄에서만] · 없으면 TITLE 표의 「대사 속 글귀」 (시안 _시안/원정수첩_메모_색연필_시안03)
  const ULW = { '시큼한 점액 냄새': ['시큼한 점액 냄새'], '{해}, 안 떠': ['{해}', '안 떠'], '크루가쉬의 마지막 말': ['{해}'], '엠브라즈의 부탁': ['엠브라즈'], '녹아 버린 책': ['죽었어'] };
  const ulWord = ttl => ULW[ttl] || (() => { const t = TITLE.find(x => x[2] === ttl); return t ? [t[1].replace(/[.?!…\s]+$/, '')] : null; })();
  const PEN = ['#e89a80', '#d0603e', '#b8402a']; // 색연필: 연함 · 보통 · 진함
  function ulImg(n, seed) { // 밑줄 그림: n칸 길이 · 두 칸 굵기로 꽉 차게 + 아래 한 칸은 군데군데 연하게 · 일자 (1칸 = 2px)
    const c = document.createElement('canvas'); c.width = n; c.height = 3; const g = c.getContext('2d'); let sd = seed; const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    for (let x = 0; x < n; x++) { const edge = x === 0 || x === n - 1; g.fillStyle = PEN[edge ? 0 : rnd() < 0.12 ? 1 : 2]; g.fillRect(x, 0, 1, 1); g.fillStyle = PEN[edge ? 0 : rnd() < 0.45 ? 1 : 2]; g.fillRect(x, 1, 1, 1); if (!edge && rnd() < 0.35) { g.fillStyle = PEN[0]; g.fillRect(x, 2, 1, 1); } }
    return c.toDataURL(); }
  const CHN = { 1: '1장 · 빛바랜 초원', 2: '2장 · 무너진 성채', 3: '3장 · 핏빛 엄니 부락', 4: '4장 · 잿빛 왕도' };
  const STATIC = [ // 예전 판에 본 진실 (이 수첩이 생기기 전 기록)
    ['t1', { no: '구덩이 실험실', title: '키륵의 연구 일지', ac: '#7ac050', paras: ["셋째 배양체 관찰. 동화 속도가 공급량을 상회하여 기아에 이르는 시간이 현저히 단축됨. 유기물과 무기물을 가리지 않는 무차별 포식성 확인.", "조각 주변의 채도가 점진적으로 감쇠함. 흡수라기보다 전송의 양상. 소실된 색의 수신처는 미상.", "본인은 조각의 보존을 최우선 과제로 상정하고 있음. 그 근거를 기술하고자 하였으나 전제가 성립하지 않음.", "제단으로의 이송이 필연이라는 확신이 존재함. 확신의 출처 불명. 재검토 필요.", "재검토 결과. 보존해야 함. 이송해야 함. 확신 출처 불명. 재검토 필요."] }],
    ['t2', { no: '기사단 밀실', title: '바닥에 새겨진 주문', ac: '#b070ff', paras: ["기사단장 발도르여,", "{해}가 뜨지 않는 한, 너는 눕지 못하리라.", "빈 자리를 지키는 자여, 네 이름은 그 자리에 묶이리라.", "왕관이 돌아올 때마다 너는 다시 눈을 뜨리라.", "재가 되어도, 서약은 재가 되지 않으리라."] }],
    ['t3', { no: '핏빛 엄니 부락', title: '크루가쉬의 마지막 말', ac: '#ff5040', paras: ['"왕관은 {해}에 의해 정화되어야 한다…"', '"왕관의 주인은 {해}가 비치는 곳에…"', '말을 끝맺지 못한 채 크루가쉬는 무릎을 꿇었고, 다시는 일어나지 않았다.'] }]];
  const S = s => String(s).replace(/\{해\}/g, '<span class="nbSun">해</span>').replace(/\{낮\}/g, '<span class="nbSun">낮</span>').replace(/\[\(.*?\)\]/g, '');
  const plain = s => String(s).replace(/\{(해|낮)\}/g, '$1');
  const N = () => (G && (G.note || (G.note = { e: [] }))) || { e: [] };
  // v3.53 「해」 탭: 키륵에게서(누구에게든) 「해」를 처음 듣기 전엔 탭 이름을 ??? (강조 색 없이) · 내용도 비움. 캐릭터별로 기억
  const sunOn = () => typeof SAVE !== 'undefined' && !!SAVE.sunKnown;
  // ---------------------------------------------------------------- 적기
  function heard(lines) {
    if (!G || !Array.isArray(lines)) return;
    const said = lines.filter(l => l && NPC[l[0]] && typeof l[1] === 'string' && !/^[\s….!?…]*$/.test(l[1]));
    if (!said.length) return;
    if (!SAVE.sunKnown && said.some(l => l[1].includes('{해}'))) { SAVE.sunKnown = true; persist(); }
    const cnt = {}; for (const l of said) cnt[NPC[l[0]]] = (cnt[NPC[l[0]]] || 0) + 1;
    const who = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0], txt = said.map(l => l[1]).join(' ');
    const T = TITLE.find(t => t[0] === who && txt.includes(t[1])); if (!T) return; // 표에 없는 대화(인사 · 되풀이)는 적지 않음
    const nb = N(); if (nb.e.some(e => e.who === who && e.ttl === T[2])) return;
    nb.e.push({ who, ttl: T[2], ch: G.stage, at: who === 'owl' && !(G.dun && G.dun.forge) ? '원정 길목' : null, q: said.filter(l => NPC[l[0]] === who).map(l => [l[0], l[1]]), nw: true });
    lootFeed(`수첩에 적었다 — ${plain(T[2])}`, '#e8dcc0', 2600);
  }
  { const o = showTruthParchment; showTruthParchment = function (p) { try { if (p && p.title && p.paras && !p.clue /* v3.81 단서 양피지는 진실 기록에 넣지 않음 */ && typeof SAVE !== 'undefined') { const D = SAVE.noteTruth || (SAVE.noteTruth = {}); if (!D[p.title]) { D[p.title] = { no: p.no, title: p.title, ac: p.ac, paras: p.paras, pages: p.pages, night: SAVE.runs }; persist(); } } } catch (e) { console.error(e); } return o.apply(this, arguments); }; }
  function truths() { const D = (typeof SAVE !== 'undefined' && SAVE.noteTruth) || {}, out = Object.values(D).map(t => Object.assign({ who: 'doc', ttl: t.title, truth: t }, {}));
    const TS = (typeof SAVE !== 'undefined' && SAVE.truth) || {}; for (const [k, t] of STATIC) if (TS[k] && !D[t.title]) out.push({ who: 'doc', ttl: t.title, truth: t });
    return out; }
  // ---------------------------------------------------------------- 화면
  let el = null, tab = 0, sel = 0, from = 'play';
  const nightName = () => `${(typeof SAVE !== 'undefined' && SAVE.runs) || 1}번째 밤`;
  const josa = n => { const c = n.charCodeAt(n.length - 1) - 0xac00; return c >= 0 && c % 28 ? '이' : '가'; };
  const TABS = () => [[nightName(), () => N().e], ['소문', () => N().e.filter(e => e.who === 'owl' || e.who === 'inf')], ['진실 기록', truths], ['{해}', () => N().e.filter(e => e.q.some(q => q[1].includes('{해}')))]];
  function css() { if (document.getElementById('nbCss')) return; const s = document.createElement('style'); s.id = 'nbCss'; s.textContent = `
  #ovNote { z-index: 41; }
  .nbWin { width: 660px; height: 404px; max-width: 96%; display: flex; flex-direction: column; box-sizing: border-box; }
  .nbWin h2 { text-align: center; margin: 0; }
  .nbSub { font: 10px 'Galmuri9'; color: var(--quiet); text-align: center; margin: 2px 0 7px; }
  .nbTabs { display: flex; gap: 3px; margin-bottom: 7px; }
  .nbTab { flex: 1; font: 10px 'Galmuri9'; color: var(--quiet); background: rgba(0,0,0,.4); border: 1px solid #2a2430; padding: 4px 0; cursor: pointer; text-align: center; position: relative; }
  .nbTab.on { color: var(--gold-l); border-color: var(--gold-d); background: #241c14; }
  .nbTab .nw { position: absolute; right: 5px; top: 3px; width: 4px; height: 4px; background: #ff6a50; box-shadow: 0 0 0 1px #000; }
  .nbBook { position: relative; flex: 1; min-height: 0; }
  .nbBook canvas { position: absolute; left: 0; top: 0; width: 632px; height: 300px; image-rendering: pixelated; }
  .nbPg { position: absolute; top: 26px; height: 248px; color: #3a2a1a; overflow: hidden; }
  .nbL { left: 36px; width: 254px; overflow-y: auto; scrollbar-width: none; } .nbR { left: 352px; width: 236px; overflow-y: auto; scrollbar-width: none; top: 22px; height: 252px; }
  .nbCh { font: 9px 'Galmuri7'; color: #8a6a40; margin: 7px 0 3px; letter-spacing: 1px; display: flex; align-items: center; gap: 5px; }
  .nbCh:first-child { margin-top: 0; } .nbCh::after { content: ''; flex: 1; height: 2px; background: repeating-linear-gradient(90deg, #c4a878 0 2px, transparent 2px 4px); }
  .nbIt { display: flex; align-items: center; gap: 6px; height: 18px; padding: 0 8px 0 10px; cursor: pointer; font: 10px 'Galmuri9'; color: #4a3420; white-space: nowrap; }
  .nbIt.sel { background: #d8c08c; box-shadow: inset 2px 0 0 #6a1a14; color: #2a1808; }
  .nbIt .w { margin-left: auto; font: 8px 'Galmuri7'; color: #9a7a50; } .nbIt .d { width: 4px; height: 4px; background: #c0401e; flex: none; }
  .nbHd { display: flex; align-items: flex-end; gap: 10px; min-height: 0; border-bottom: 2px solid #c4a878; padding-bottom: 6px; }
  .nbPor { width: 64px; min-height: 30px; display: flex; align-items: flex-end; justify-content: center; gap: 2px; flex: none; } .nbPor img { image-rendering: pixelated; }
  .nbNm { font: bold 12px 'Galmuri11'; color: #6a1a14; } .nbNm small { display: block; font: 9px 'Galmuri7'; color: #8a6a40; margin-top: 4px; font-weight: normal; }
  .nbQ { position: relative; margin: 6px 0 0; font: 10px/18px 'Galmuri9'; color: #3a2a1a; }
  .nbQ::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(to bottom, transparent 0 16px, #d6c296 16px 18px); -webkit-mask: repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 4px); mask: repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 4px); } /* 공책 줄: 글줄에 맞춰 따라감 */
  .nbQ p { position: relative; }
  .nbQ p { margin: 0; padding-left: 10px; text-indent: -10px; color: #3a2a1a; font: 10px/18px 'Galmuri9'; } .nbQ .tx::before { content: '「'; color: #9a7a50; } .nbQ .tx::after { content: '」'; color: #9a7a50; }
  .nbQ .sp { font: 8px 'Galmuri7'; color: #9a7a50; margin-right: 3px; }
  .nbQ.doc p { text-indent: 0; padding-left: 0; } .nbQ.doc .tx::before, .nbQ.doc .tx::after { content: ''; }
  .nbMemo { position: absolute; left: 360px; width: 230px; top: 252px; display: none; text-align: right; font: 10px 'Galmuri9'; color: #c04a30; } /* 메모: 밑줄과 같은 붉은 색연필 색 · 글씨는 또렷하게 */
  .nbMemo .nbSun { color: #c04a30; } .nbMemo .hid { opacity: 0; } .nbMemo .nbBy { font: 8px 'Galmuri7'; color: #9a7a50; margin-right: 4px; }
  .nbUl { position: relative; } .nbUl i { position: absolute; left: -2px; bottom: -6px; height: 6px; background-repeat: no-repeat; background-size: 100% 100%; image-rendering: pixelated; pointer-events: none; }
  .nbR.memo { height: 226px; }
  .nbOpen { margin-top: 10px; font: 9px 'Galmuri7'; color: #8a6a40; }
  .nbEmpty { margin-top: 40px; text-align: center; font: 10px 'Galmuri9'; color: #9a7a50; }
  .nbCnt { font: 9px 'Galmuri7'; color: #8a6a40; margin-bottom: 6px; } .nbCnt b { font: bold 14px 'Galmuri11'; color: #c0401e; margin: 0 3px; }
  .nbSun { color: #c0401e; }
  .nbKeys { margin-top: 6px; display: flex; justify-content: center; gap: 14px; font: 9px 'Galmuri7'; color: var(--quiet); } .nbKeys .key { margin-right: 3px; }`; document.head.appendChild(s); }
  function build() { if (el) return el; css();
    el = document.createElement('div'); el.className = 'ov'; el.id = 'ovNote';
    el.innerHTML = `<div class="pf win nbWin"><h2>원정 수첩</h2><div class="nbSub"></div><div class="nbTabs"></div><div class="nbBook"><canvas width="316" height="150"></canvas><div class="nbPg nbL"></div><div class="nbPg nbR"></div><div class="nbMemo"></div></div>
      <div class="nbKeys"><span><span class="key">←</span><span class="key">→</span>탭</span><span><span class="key">↑</span><span class="key">↓</span>고르기</span><span><span class="key">N</span><span class="key">ESC</span>닫기</span></div></div>`;
    $('ovInv').parentNode.appendChild(el); book(el.querySelector('canvas'));
    el.addEventListener('mousedown', e => { if (e.target === el) close(); });
    return el; }
  const imgs = (who, sc) => (WHO[who] ? WHO[who][2] : []).map(k => `<img src="${POR[k]}" style="width:${sc * (POR[k + '_w'] || 16)}px">`).join('');
  function render() {
    const T = TABS(), L = tab === 3 && !sunOn() ? [] : T[tab][1](); if (sel >= L.length) sel = Math.max(0, L.length - 1);
    for (const e of L) e.nw = false;
    const nm = CLASSES[G.cls] ? CLASSES[G.cls].name : '';
    el.querySelector('.nbSub').textContent = `${nightName()} · ${nm}${josa(nm)} 들은 것들`;
    el.querySelector('.nbTabs').innerHTML = T.map((t, i) => `<div class="nbTab${i === tab ? ' on' : ''}" data-i="${i}">${i === 3 && !sunOn() ? '???' : S(t[0])}${i !== tab && (i !== 3 || sunOn()) && t[1]().some(e => e.nw) ? '<span class="nw"></span>' : ''}</div>`).join('');
    el.querySelectorAll('.nbTab').forEach(b => b.onclick = () => { tab = +b.dataset.i; sel = 0; sfx('blip'); render(); });
    let h = '', last = -1;
    if (tab === 3 && sunOn()) h += `<div class="nbCnt">${nightName()} <span class="nbSun">해</span>를 들은 횟수<b>${L.reduce((a, e) => a + e.q.reduce((b, q) => b + q[1].split('{해}').length - 1, 0), 0)}</b></div>`;
    L.forEach((e, i) => { if (tab !== 2 && e.ch !== last) { last = e.ch; h += `<div class="nbCh">${CHN[e.ch] || ''}</div>`; }
      h += `<div class="nbIt${i === sel ? ' sel' : ''}" data-i="${i}"><span class="t">${S(e.ttl)}</span><span class="w">${e.truth ? (e.truth.night ? e.truth.night + '번째 밤' : '') : WHO[e.who][0]}</span></div>`; });
    if (!L.length) h = `<div class="nbEmpty">${tab === 2 ? '아직 기록한 진실이 없습니다.' : '아직 적은 것이 없습니다.'}</div>`;
    const Lp = el.querySelector('.nbL'); Lp.innerHTML = h;
    Lp.querySelectorAll('.nbIt').forEach(b => b.onclick = () => { sel = +b.dataset.i; sfx('blip', 1.2); render(); });
    const s = Lp.querySelector('.nbIt.sel'); if (s) { const top = s.offsetTop, bot = top + s.offsetHeight; if (top < Lp.scrollTop) Lp.scrollTop = top - 20; else if (bot > Lp.scrollTop + Lp.clientHeight) Lp.scrollTop = bot - Lp.clientHeight + 4; }
    const e = L[sel], R = el.querySelector('.nbR'), M = el.querySelector('.nbMemo'), mt = e && !e.truth && MEMO[e.ttl];
    M.style.display = mt ? 'block' : 'none'; if (mt) M.innerHTML = `<span class="nbBy">${nm}의 메모</span>` + S(mt); /* v3.53 메모 앞에 「(캐릭터)의 메모」 */ R.classList.toggle('memo', !!mt); clearTimeout(ulT);
    if (!e) { R.innerHTML = ''; return; }
    if (e.truth) { const t = e.truth; R.innerHTML = `<div class="nbHd"><div class="nbNm">${S(t.title)}<small>${t.no || ''}${t.night ? ' · ' + t.night + '번째 밤에 기록' : ''}</small></div></div><div class="nbQ doc">${t.paras.map(p => `<p><span class="tx">${S(p)}</span></p>`).join('')}</div><div class="nbOpen"><span class="key">F</span>양피지 펼치기</div>`; return; }
    const multi = new Set(e.q.map(q => q[0])).size > 1;
    R.innerHTML = `<div class="nbHd"><div class="nbPor">${imgs(e.who, 2)}</div><div class="nbNm">${S(e.ttl)}<small>${WHO[e.who][0]} · ${e.at || WHO[e.who][1]}</small></div></div>
      <div class="nbQ">${ulLines(e).map(q => `<p>${multi && SPK[q[0]] ? `<span class="sp">${SPK[q[0]]}</span>` : ''}<span class="tx">${q[2]}</span></p>`).join('')}</div>`; R.scrollTop = 0;
    /* v3.53 밑줄 · 한 글자씩 써지는 메모 연출 폐기 (메모 글만 바로 보임) */
    { const q = R.querySelector('.nbQ'); if (q) q.style.minHeight = Math.max(0, Math.floor((R.clientHeight - q.offsetTop) / 18) * 18) + 'px'; } } // 공책 줄이 쪽 아래(메모 위)까지 이어지게
  // ---------------------------------------------------------------- 색연필 밑줄 · 써지는 메모
  let ulT = 0;
  function ulLines(e) { const w = null; let done = true; /* v3.53 붉은 밑줄 폐기 — 대사는 그대로 */
    return e.q.map(q => { let h = S(q[1]); if (!done && (!w[1] || q[1].includes(w[1]))) { const i = q[1].indexOf(w[0]); if (i >= 0) { done = true; h = S(q[1].slice(0, i)) + '<span class="nbUl">' + S(w[0]) + '<i></i></span>' + S(q[1].slice(i + w[0].length)); } } return [q[0], q[1], h]; }); }
  function ulDraw(e, mt) { const u = el.querySelector('.nbR .nbUl'), M = el.querySelector('.nbMemo');
    let i = null; if (u) { i = u.querySelector('i'); const n = Math.ceil(u.offsetWidth / 2) + 3; i.style.width = n * 2 + 'px'; i.style.backgroundImage = `url(${ulImg(n, e.ttl.length * 37 + n * 13)})`; }
    if (e.ulSeen) return; e.ulSeen = true; // 처음 펼칠 때만: 밑줄이 왼쪽부터 그어지고(0.45초) → 메모가 한 글자씩(0.7초)
    const t0 = performance.now(), txt = mt ? String(mt) : '', step = () => { if (!el || !el.classList.contains('on') || !M.isConnected) return; const t = (performance.now() - t0) / 1000;
      if (i) { const k = Math.min(1, t / 0.45); i.style.clipPath = `inset(0 ${Math.round((1 - k) * 100)}% 0 0)`; }
      if (txt) { const km = Math.max(0, Math.min(1, (t - 0.5) / 0.7)), n0 = Math.floor(txt.length * km), n = txt.lastIndexOf('{', n0) > txt.lastIndexOf('}', n0 - 1) ? txt.indexOf('}', n0) + 1 : n0;
        M.innerHTML = S(txt.slice(0, n)) + '<span class="hid">' + S(txt.slice(n)) + '</span>'; }
      if (t < 1.25) ulT = setTimeout(step, 16); };
    step(); }
  function open(f) { if (!G) return; build(); from = f || 'play'; mode = 'note'; tab = 0; sel = Math.max(0, N().e.length - 1);
    for (const k in pressed) pressed[k] = false; if (from === 'inv') $('ovInv').classList.remove('on'); el.classList.add('on'); sfx('blip'); render(); }
  function close() { if (!el) return; el.classList.remove('on'); for (const k in pressed) pressed[k] = false;
    if (from === 'inv') { $('ovInv').classList.add('on'); mode = 'inv'; } else mode = 'play'; sfx('blip'); }
  function reopenTruth(t) { el.classList.remove('on'); showTruthParchment({ no: t.no, title: t.title, ac: t.ac, paras: t.paras, pages: t.pages, onClose: () => { mode = 'note'; el.classList.add('on'); render(); } }); }
  // ---------------------------------------------------------------- 수첩 그림 (1칸 = 2px)
  function book(c) { const g = c.getContext('2d'), W = c.width, H = c.height, K = '#0b0a0e', px = (x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    let sd = 7; const rnd = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    // ① 가죽 표지: 외곽선 · 결(두 톤 망점) · 위 밝은 테 · 아래 어두운 테 · 가장자리 바느질
    px(1, 2, K, W - 2, H - 4); px(2, 1, K, W - 4, H - 2);
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { let col = '#4a2c1c'; const n = rnd();
      if (n < 0.08) col = '#3e2416'; else if (n < 0.12) col = '#56341f'; if (y < 4) col = '#6a4228'; if (y > H - 5) col = '#2e1a10'; if (x < 4 || x > W - 5) col = ((x + y) & 1) ? '#3a2214' : col; px(x, y, col); }
    for (let x = 6; x < W - 6; x += 3) { px(x, 3, '#7a5434'); px(x, H - 4, '#5a3c24'); } for (let y = 6; y < H - 6; y += 3) { px(3, y, '#684628'); px(W - 4, y, '#684628'); } // 박음질은 가죽 결에 눌러 붙게 (낮은 대비)
    // ② 쇠 모서리 장식 + 못
    for (const [x, y, sx, sy] of [[2, 2, 1, 1], [W - 3, 2, -1, 1], [2, H - 3, 1, -1], [W - 3, H - 3, -1, -1]]) {
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8 - i; j++) px(x + sx * i, y + sy * j, i + j === 7 ? K : i === 0 || j === 0 ? '#f0d488' : (i + j) % 4 === 0 ? '#7a5a24' : '#b8903e');
      px(x + sx * 2, y + sy * 2, K); px(x + sx * 3, y + sy * 2, '#fff0b0'); }
    const y0 = 7, y1 = H - 7; // 가죽 여백: 네 둘레 모두 4칸
    // ④ 종이 (제본 쪽 그늘은 망점 · 바깥 가장자리 살짝 누렇게 · 섬유 티)
    const page = (x0, x1, left) => {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const dg = left ? x1 - 1 - x : x - x0, de = left ? x - x0 : x1 - 1 - x, ed = Math.min(de, y - y0, y1 - 1 - y);
        let col = '#efe0b8'; if (dg < 1) col = '#c4a87a'; else if (dg < 3) col = ((x + y) & 1) ? '#d0b88a' : '#e0cca0'; else if (dg < 7) col = ((x + y) & 1) ? '#dcc89c' : '#efe0b8'; else if (dg < 11) col = ((x + y) % 4 === 0) ? '#e2d0a6' : '#efe0b8';
        else if (ed < 2) col = ((x + y) & 1) ? '#e0cc9e' : '#efe0b8'; else if (ed < 4 && (x + y) % 4 === 0) col = '#e6d4aa';
        if (col === '#efe0b8' && rnd() < 0.012) col = '#e0cca0'; px(x, y, col); } };
    page(7, 158, true); page(158, W - 7, false); px(6, y0 - 1, K, W - 12, 1); px(6, y0 - 1, K, 1, y1 - y0 + 1); px(W - 7, y0 - 1, K, 1, y1 - y0 + 1); // 한 장으로 이어진 펼친 면
    px(6, y1, K, W - 12, 1); // 아래 외곽선 (겹친 종이 끝 표현 없음)
    // ⑤ 오른쪽 쪽: 공책 줄 + 붉은 여백 선 · 왼쪽 쪽: 위 머리띠 줄
    for (let y = y0 + 2; y < y1 - 1; y += 1) if (y % 3) px(172, y, '#d89a86');
    for (let x = 20; x < 150; x += 2) px(x, 9, '#d6c296');
    // ⑥ 쪽 번호 · 잉크 얼룩
    const num = (cx, d) => { const D = { 1: ['.k.', 'kk.', '.k.', '.k.', 'kkk'], 2: ['kk.', '..k', '.k.', 'k..', 'kkk'], 3: ['kk.', '..k', '.k.', '..k', 'kk.'] }; D[d].forEach((r, j) => [...r].forEach((q, i) => { if (q === 'k') px(cx + i, y1 - 8 + j, '#a88a5e'); })); px(cx - 4, y1 - 6, '#c4a878', 2, 1); px(cx + 5, y1 - 6, '#c4a878', 2, 1); };
    // 쪽 번호 없음 (v3.80)
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [3, 3], [-2, 3]]) px(26 + dx, y1 - 10 + dy, dx === 3 || dx === -2 ? '#8a9ab0' : '#5a6a88');
    // ⑦ 가운데 접힘: 가는 골 + 골을 따라 드문드문 보이는 실 땀
    for (let y = y0; y < y1; y++) { px(157, y, '#b89a6c'); px(158, y, '#c8ae80'); }
    for (let y = y0 + 6; y < y1 - 6; y += 12) { px(157, y, '#8a7656', 1, 3); px(158, y + 1, '#a8946a'); }
  }
  // 도트 원래 폭
  for (const k in POR) { const im = new Image(); im.onload = () => { POR[k + '_w'] = im.width; }; im.src = POR[k]; }
  // ---------------------------------------------------------------- 연결 (N 키 · 인벤토리 단추)
  { const o = update; update = function (dt) {
      try { if (G && mode === 'play' && pressed['n'] === true && !G.cine && !G.trans && !G.player.dead && !(typeof TRUTH !== 'undefined' && TRUTH.busy()) && !(typeof LOADQ !== 'undefined' && LOADQ.on)) { pressed['n'] = false; open('play'); }
        else if (G && mode === 'inv' && pressed['n'] === true) { pressed['n'] = false; open('inv'); }
        else if (mode === 'note' && el) { const L = TABS()[tab][1]();
          if (take('n') || take('escape')) close();
          else if (take('arrowleft') || take('a')) { tab = (tab + 3) % 4; sel = 0; sfx('blip'); render(); }
          else if (take('arrowright') || take('d')) { tab = (tab + 1) % 4; sel = 0; sfx('blip'); render(); }
          else if (take('arrowup') || take('w')) { if (sel > 0) { sel--; sfx('blip', 1.2); render(); } }
          else if (take('arrowdown') || take('s')) { if (sel < L.length - 1) { sel++; sfx('blip', 1.2); render(); } }
          else if ((take('f') || take('enter')) && tab === 2 && L[sel]) reopenTruth(L[sel].truth); } } catch (e) { console.error(e); }
      return o.apply(this, arguments); }; }
  { const b = document.createElement('button'); b.className = 'pbtn'; b.id = 'ivNote'; b.style.marginRight = '6px'; b.innerHTML = '원정 수첩 <span class="key kc">N</span>'; b.onclick = () => open('inv');
    const c = $('ivClose'); if (c && c.parentNode) c.parentNode.insertBefore(b, c.parentNode.firstChild); } // v3.83 창 왼쪽 끝에 맞춤 (닫기는 오른쪽)
  return { heard, open, close, get on() { return mode === 'note'; } };
})();
;
