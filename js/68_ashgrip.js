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
