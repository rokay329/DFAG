'use strict';
// 잿빛 왕관 원정대 · world.js — 합친 파일: 04_monsters.js, 05_dungeon.js, 06_rooms_decor.js, 07_worldmap.js (v3.84 파일 정리 · typeof로 먼저 확인하는 이름 몇 개는 var로 선언)

// ==================================================================== 04_monsters.js
'use strict';
// 잿빛 왕관 토벌대 — 04_monsters.js : 1·2·4장 몬스터와 엘리트(성채 확장, 초원 확장, 기사단, 왕도 몬스터, 모르드레드·왕비), 1장 슬라임·점액왕, 스테이지 정의
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ↓ 06_rooms_decor.js에서 옮겨 옴 (이 파일을 불러올 때 바로 쓰임)
  function dirtCol(o, hw, x, y) {
    const t = Math.abs(o) / hw, B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], d = (lv, ox, oy) => lv * 16 > B4[(((y >> 1) + oy) & 3) * 4 + (((x >> 1) + ox) & 3)];
    if (t < 0.5) { const r = Math.random(); return r < 0.04 ? '#8a8478' : r < 0.18 ? '#7e6040' : '#62482e'; }
    const lv = Math.max(0, Math.min(1, (1.4 - t) / 0.9));
    if (d(lv, 0, 0)) return Math.random() < 0.35 ? '#56402a' : '#62482e';
    if (d(lv * 0.85, 1, 2)) return Math.random() < 0.5 ? '#3e3a22' : '#3a4426';
    return null;
  }

  // ↓ 06_rooms_decor.js에서 옮겨 옴 (이 파일을 불러올 때 바로 쓰임)
  // v3.19 옛 돌길 (징검돌 자리): 폐허와 같은 돌빛의 판석 세 줄 · 군데군데 빠진 돌 · 이끼 · 금 · 틈새 풀 — 흙 오솔길과 같은 역할
  function paintPaved(g, c) {
    const L = 150, C = ['#676b60', '#565a51', '#474b44', '#3a3d39', '#1a2816'], MO = ['#3e6228', '#325220', '#26421a'], GR = ['#4a7a34', '#56883a', '#3e6a2c']; // 숲 바닥에 묻히게 폐허보다 두 단계 어둡게
    const fade = t => { const r = Math.min(1, c.fadeA ? (t - c.a) / L : 1, c.fadeB ? (c.b - t) / L : 1); return r * r * (3 - 2 * r); };
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 2, 2); };
    for (let t = c.a & ~1; t < c.b; t += 2) { const m = Math.round(c.at(t) / 2) * 2, f = fade(t); for (let o = -14; o < 16; o += 2) if (Math.random() < 0.28 * f) px(c.vert ? m + o : t, c.vert ? t : m + o, Math.random() < 0.5 ? '#2a3020' : '#34361f'); } // 돌 밑 흙 바탕
    for (let ri = 0; ri < 3; ri++) { let t = (c.a & ~1) - (ri === 1 ? 6 : ri === 2 ? 2 : 0);
      while (t < c.b - 6) { const len = 10 + 2 * randi(0, 3), f = fade(t + len / 2), m = Math.round(c.at(t + len / 2) / 2) * 2, o = -14 + ri * 10 + (Math.random() < 0.2 ? 2 : 0);
        const x = c.vert ? m + o : t, y = c.vert ? t : m + o, w = c.vert ? 8 : len, h = c.vert ? len : 8;
        if (t >= c.a && Math.random() < (ri === 1 ? 0.88 : 0.62) * (0.1 + 0.9 * f)) { const base = Math.random() < 0.3 ? 2 : 1;
          for (let j = 0; j < h; j += 2) for (let i = 0; i < w; i += 2) { const cor = (i === 0 || i === w - 2) && (j === 0 || j === h - 2); if (cor && Math.random() < 0.6) continue; px(x + i, y + j, j === 0 || i === 0 ? C[base - 1] : (j === h - 2 || i === w - 2) ? C[base + 1] : C[base]); }
          for (let i = 2; i < w; i += 2) px(x + i, y + h, C[4]);
          const r = Math.random();
          if (r < 0.4) { const mx = x + (Math.random() < 0.5 ? 0 : w - 4), my = y + (Math.random() < 0.5 ? 0 : h - 4); px(mx, my, MO[0]); px(mx + 2, my, MO[1]); px(mx, my + 2, MO[1]); if (Math.random() < 0.5) px(mx + 2, my + 2, MO[2]); }
          else if (r < 0.5 && w >= 10 && h >= 8) { const cx0 = x + 2 * randi(1, (w >> 1) - 3); px(cx0, y + 2, C[3]); px(cx0 + 2, y + 4, C[3]); }
        } else if (t >= c.a && Math.random() < 0.6 * f) { const gx = x + 2 * randi(0, (w >> 1) - 1), gy = y + 4; g.fillStyle = pick(GR); g.fillRect(gx, gy, 1, 3); g.fillRect(gx + 1, gy - 2, 1, 4); g.fillRect(gx + 3, gy, 1, 2); }
        t += len + 2; } }
  }
  function paintMeadowCurve(g, c) {
    if (c.kind === 'stones') return paintPaved(g, c);
    const L = 150, B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let t = c.a & ~1; t < c.b; t += 2) {
      if (c.clip && !c.clip(t)) continue;
      const m = Math.round(c.at(t) / 2) * 2;
      const rawFade = Math.min(1, c.fadeA ? (t - c.a) / L : 1, c.fadeB ? (c.b - t) / L : 1), f = rawFade * rawFade * (3 - 2 * rawFade);
      if (c.kind === 'stones') { if (t % 22 === 0 && Math.random() < 0.08 + 0.92 * f) gPaint(g, STONEPAD, STONEPAD_PAL, (c.vert ? m : t) - 6 + randi(-4, 4), (c.vert ? t : m) - 4 + randi(-4, 4)); continue; }
      const hw = Math.max(4, Math.round((c.kind === 'brook' ? 12 + (Math.random() < 0.3 ? 2 : 0) : 10 + (Math.random() < 0.3 ? 2 : 0)) * (c.kind === 'brook' ? 0.45 + 0.55 * f : 0.72 + 0.28 * f) / 2) * 2);
      const span = c.kind === 'brook' ? hw : Math.ceil(hw * 1.4 / 2) * 2;
      for (let o = -span - 2; o <= span; o += 2) {
        const x = c.vert ? m + o : t, y = c.vert ? t : m + o, edge = o < -hw || o >= hw;
        if (c.kind === 'brook') { g.fillStyle = edge ? (Math.random() < 0.7 ? '#4a3424' : '#2e5222') : o <= -hw + 2 ? '#0c1a2c' : Math.random() < 0.06 ? '#6a9ac0' : o > hw - 6 ? '#1c4466' : '#13304c'; g.fillRect(x, y, 2, 2); continue; }
        if (f < 1 && !(f * 16 > B4[((y >> 1) & 3) * 4 + ((x >> 1) & 3)])) continue;
        const col = dirtCol(o + 1, hw, x, y); if (col) { g.fillStyle = col; g.fillRect(x, y, 2, 2); }
      }
      if (c.kind === 'brook' && t % 40 === 0 && Math.random() < 0.6) stamp(g, DECO_MAPS.rockB, DECO, (c.vert ? m : t) - 6, (c.vert ? t : m) - 4, 2);
    }
    if (c.kind === 'brook' && !c.noBridge && CUR_ROOM && CUR_ROOM.bridges) for (const b of CUR_ROOM.bridges) { const gr = genBridge(c.vert); gPaint(g, gr, BRIDGE_PAL, b.x - gr[0].length, b.y - gr.length); }
  }

  // ↓ 06_rooms_decor.js에서 옮겨 옴 (이 파일을 불러올 때 바로 쓰임)
  function meadowCurves() {
    const st = ROOMSTYLE.path || 'wind', w = A.x1 - A.x0, h = A.y1 - A.y0, vert = h > w * 1.3, out = [];
    const doors = ROOMSTYLE.doors || [];
    if (st === 'none' && !doors.length) return out;
    // 문이 있는 방에서는 장식용 길 없음 스타일도 문 앞까지 가는 흙길로 바꾼다.
    const pathStyle = st === 'none' ? 'wind' : st;
    const kind = pathStyle === 'brook' ? 'brook' : ROOMSTYLE.pave ? 'stones' : 'dirt'; // v3.19 흙길이 기본 · 폐허(벽)나 저수지가 있는 방만 옛 돌길
    // 길·개울은 벽까지 닿지 않고 방 안에서 가늘어지며 끝난다 (ea·eb·ec = 끝에서 비우는 비율)
    const ea = ROOMSTYLE.ea != null ? ROOMSTYLE.ea : 0.12, eb = ROOMSTYLE.eb != null ? ROOMSTYLE.eb : 0.12, ec = ROOMSTYLE.ec != null ? ROOMSTYLE.ec : 0.12;
    const full = kind === 'brook'; // 개울은 맵 끝까지 이어진다
    if (kind === 'brook' && ROOMSTYLE.side) { // v0.68: 개울은 가운데가 아니라 문이 없는 벽 쪽 가장자리를 따라 흐른다
      const sd = ROOMSTYLE.side, ph = ROOMSTYLE.ph || 0;
      if (sd === 'n' || sd === 's') { const amp = Math.min(12, h * 0.035), base = sd === 's' ? A.y1 - Math.max(30, h * 0.13) : A.y0 + Math.max(34, h * 0.14); out.push({ vert: false, kind, at: x => base + Math.sin(x * 0.009 + ph) * amp + Math.sin(x * 0.025) * 3, a: A.x0 - 400, b: A.x1 + 400, fadeA: false, fadeB: false }); } // v3.19 개울이 숲 가운데서 뚝 끊기지 않게 맵 끝까지
      else { const amp = Math.min(12, w * 0.035), base = sd === 'e' ? A.x1 - Math.max(30, w * 0.11) : A.x0 + Math.max(30, w * 0.11); out.push({ vert: true, kind, at: y => base + Math.sin(y * 0.011 + ph) * amp + Math.sin(y * 0.03) * 3, a: A.y0 - 40, b: A.y1 + 400, fadeA: false, fadeB: false }); }
      return out;
    }
    const ph = ROOMSTYLE.ph || 0;
    if (vert) {
      const amp = pathStyle === 'straight' ? 5 : Math.min(22, w * 0.075), center = y => { const edge = clamp(Math.min(y - A.y0, A.y1 - y) / 140, 0, 1), env = edge * edge * (3 - 2 * edge); return CX + (Math.sin(y * 0.012 + ph) * amp + Math.sin(y * 0.028 + ph * 1.7) * 5) * env; };
      const main = { vert: true, kind, at: center, a: doors.includes('n') ? A.y0 + 10 : A.y0 + h * ea, b: doors.includes('s') ? A.y1 + 2 : A.y1 - h * eb, fadeA: true, fadeB: !doors.includes('s') }; /* v2.21 위로 가는 길은 북문에 닿기 전에 디더로 사라짐 */
      out.push(main);
      // 좌우 문에서는 문턱에서 중앙 세로길까지 짧게 연결한다.
      for (const d of ['w', 'e']) if (doors.includes(d)) {
        const x0 = d === 'w' ? A.x0 - 2 : center(CY), x1 = d === 'w' ? center(CY) : A.x1 + 2;
        out.push({ vert: false, kind, at: x => CY + Math.sin((x - x0) / Math.max(1, x1 - x0) * Math.PI) * 3, a: x0, b: x1, fadeA: false, fadeB: false });
      }
      return out;
    }
    const amp = pathStyle === 'straight' ? 5 : Math.min(22, h * 0.09), base = h > 400 ? CY + clamp(ROOMSTYLE.off || 0, -0.18, 0.18) * Math.min(120, h * 0.22) : CY;
    const center = x => { const edge = clamp(Math.min(x - A.x0, A.x1 - x) / 140, 0, 1), env = edge * edge * (3 - 2 * edge); return CY + ((base - CY) + Math.sin(x * 0.009 + ph) * amp + Math.sin(x * 0.021 + ph * 1.7) * Math.min(7, amp * 0.3)) * env; };
    const main = { vert: false, kind, at: center, a: doors.includes('w') ? A.x0 - 2 : A.x0 + w * ea, b: doors.includes('e') ? A.x1 + 2 : A.x1 - w * eb, fadeA: !doors.includes('w'), fadeB: !doors.includes('e') };
    out.push(main);
    // 위아래 문에서 주 오솔길까지 연결되는 가지길.
    for (const d of ['n', 's']) if (doors.includes(d)) {
      const xDoor = DOOR[d].x, yRoad = center(xDoor), y0 = d === 'n' ? A.y0 + 10 : yRoad, y1 = d === 'n' ? yRoad : A.y1 + 2;
      if (Math.abs(yRoad - (d === 'n' ? A.y0 : A.y1)) > 5) out.push({ vert: true, kind, at: y => xDoor + Math.sin((y - y0) / Math.max(1, y1 - y0) * Math.PI) * 3, a: y0, b: y1, fadeA: d === 'n', fadeB: false }); /* v2.21 북문 쪽 끝은 디더로 사라짐 */
    }
    return out;
  }

  // ↓ 05_dungeon.js에서 옮겨 옴 (이 파일을 불러올 때 바로 쓰임)
  function withSeed(seed, fn) {
    const R0 = Math.random; let s = (seed >>> 0) || 1;
    Math.random = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    try { return fn(); } finally { Math.random = R0; }
  }

  // ================================================================ 성채 확장: 역병 까마귀 · 역병 어미
  function crowTick(e, dt) {
    e.walk += dt * 14;
    const target = e.state === 'dive' ? 4 : 18 + Math.sin(time * 5 + e.orbP) * 3;
    e.z += (target - e.z) * Math.min(1, dt * (e.state === 'dive' ? 10 : 4));
    if (e.orb == null) { e.orb = Math.random() < 0.5 ? 1 : -1; e.orbP = rand(0, 6); }
  }
  function updateCrow(e, dt, d, a) {
    const P = G.player;
    if (e.state === 'chase') {
      const R0 = 90, off = d > R0 * 1.2 ? 0.45 : d < R0 * 0.7 ? 2.4 : 1.45;
      const ang = a + off * e.orb;
      e.x += Math.cos(ang) * e.spd * dt; e.y += Math.sin(ang) * e.spd * dt;
      if (Math.abs(Math.cos(ang)) > 0.2) e.face = Math.cos(ang) > 0 ? 1 : -1;
      if (Math.random() < dt * 0.3) e.orb = -e.orb;
      if (e.cd <= 0 && d < 210) {
        e.state = 'wind'; e.lockAng = a; e.face = Math.cos(a) > 0 ? 1 : -1;
        G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 180, w: 12, t: 0, dur: 0.6, owner: e, thin: true,
          onFire: () => { e.state = 'dive'; e.t = 0.42; e.hitPlayer = false; sfx('swing'); } });
      }
    } else if (e.state === 'dive') {
      e.x += Math.cos(e.lockAng) * 400 * dt; e.y += Math.sin(e.lockAng) * 400 * dt;
      if (dashBlocked(e, false)) { solveObs(e, e.r, true); e.t = 0; dust(e.x, e.y, 6); G.parts.push({ x: e.x, y: e.y - 8, vx: 0, vy: -30, t: 0.4, c: '#2a2430', g: 60 }); }
      if (Math.random() < 0.6) G.parts.push({ x: e.x, y: e.y - e.z, vx: rand(-20, 20), vy: rand(-10, 10), t: 0.3, c: '#2a2430', g: 40 });
      if (!e.hitPlayer && dist(e, P) < e.r + P.r + 3) { e.hitPlayer = true; hurtPlayer(e.atk, e); if (e.ash === 'moth') burnPlayer(2.5, e.atk * 0.25); }
      if (e.t <= 0) { e.state = 'recover'; e.t = 0.45; e.cd = rand(1.8, 2.8); }
    }
  }
  function drawCrow(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0, z = e.z || 0;
    drawShadow(e.x, e.y + 1, 6);
    const mo = e.ash === 'moth', frame = mo ? (Math.floor(e.walk * 1.5) % 2 ? 'mothA' : 'mothB') : e.state === 'dive' ? 'crowB' : Math.floor(e.walk) % 2 ? 'crowA' : 'crowB';
    const M = nrMotion(e), up = frame === 'crowA' || frame === 'mothA' ? -2 : 0; // v1.54 기울이지 않고 칸 단위로: 날갯짓마다 몸이 한 칸 오르내림, 준비는 뒤로 물러서 떨고, 급강하는 아래로
    const dx = e.state === 'wind' ? -e.face * (2 + (M.f >= 4 ? (M.f % 2) * 2 : 0)) : 0, dy = e.state === 'wind' ? -2 : e.state === 'dive' ? 2 : M.m === 'hurt' ? [-2, 0, 0, 0][M.f] : up;
    drawSprite(frame, mo ? 'moth' : 'crow', 2, e.x + dx, e.y - z + ya + dy, flip, { white, alpha: al });
    if (mo && Math.random() < 0.25) G.parts.push({ x: e.x + rand(-6, 6), y: e.y - z - 4, vx: rand(-6, 6), vy: rand(10, 30), t: 0.4, c: pick(['#ff7a30', '#ffc070']), g: 40, glow: true });
    if (e.state === 'wind') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,60,40,.9)'; ctx.fillRect(Math.round(e.x + e.face * 6), Math.round(e.y - z - 8 + ya), 2, 2); ctx.restore(); }
  }

  function motherTick(e, dt) {
    if (!e.enraged && e.hp < e.maxHp * 0.5 && !e.dead) {
      e.enraged = true; e.spd *= 1.25;
      G.fx.push({ kind: 'ring', x: e.x, y: e.y - 24, r: 8, t: 0.5, max: 0.5, c: '#9ae050', grow: 300 }); addShake(5); sfx('roar'); alertMark(e, 70, true);
    }
    e.broodT = (e.broodT == null ? 5 : e.broodT) - dt;
    if (Math.random() < dt * 4) G.parts.push({ x: e.x + rand(-10, 10), y: e.y - rand(14, 30), vx: rand(-4, 4), vy: -rand(8, 20), t: 0.7, c: pick(['#9ae050', '#4a7a20', '#6a6a3a']), g: 0, glow: Math.random() < 0.3 });
  }
  function updateMother(e, dt, d, a, moveTo) {
    if (e.state === 'bilecharge') {
      const k = 1 - e.t / e.chargeMax, mx = e.x + e.face * 1, my = e.y - 32;
      e.lean = -0.18 * e.face * k; e.face = Math.cos(a) > 0 ? 1 : -1;
      for (let i = 0; i < 2; i++) { const aa = rand(0, TAU), r = rand(16, 34) * (1 - k * 0.5); G.parts.push({ x: mx + Math.cos(aa) * r, y: my + Math.sin(aa) * r, vx: -Math.cos(aa) * r * 4, vy: -Math.sin(aa) * r * 4, t: 0.22, c: pick(['#9ae050', '#d8f0a0', '#6a9a2a']), g: 0, glow: true }); }
      if (e.t <= 0) motherBileFire(e);
      return;
    }
    if (e.state !== 'chase') return;
    if (d > 80) moveTo(a, e.spd);
    if (e.cd > 0) return;
    if (e.broodT <= 0 && G.enemies.filter(x => !x.dead && x.type === 'ghoul').length < 5) return motherBrood(e);
    if (d < 90) motherMiasma(e); else motherBile(e, a);
  }
  function motherBrood(e) { // 배를 움켜쥐고 시체를 땅에서 끌어올린다
    e.state = 'wind'; e.pat = 'brood'; e.broodT = e.enraged ? 10 : 13; alertMark(e, 64, true); sfx('warn');
    const n = e.enraged ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const pt = { x: clamp(e.x + rand(-110, 110), A.x0 + 20, A.x1 - 20), y: clamp(e.y + rand(-70, 80), A.y0 + 20, A.y1 - 20) };
      G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: 11, t: 0, dur: 1.1 + i * 0.12, owner: e,
        onFire: () => {
          const g = makeEnemy('ghoul', pt.x, pt.y); g.rise = 0.6; G.enemies.push(g);
          burst(pt.x, pt.y - 6, '#4a7a20', 10); dust(pt.x, pt.y, 8); splat(pt.x, pt.y, 10, '50,60,20');
          if (i === n - 1) { e.state = 'recover'; e.t = 0.7; e.cd = rand(1.0, 1.6); }
        } });
    }
  }
  function motherBile(e, a) { // 담즙 토하기: 범위 표시 없이 입에 독을 모으는 동작으로 예고
    e.state = 'bilecharge'; e.t = 0.95; e.chargeMax = 0.95; e.face = Math.cos(a) > 0 ? 1 : -1; alertMark(e, 64); sfx('warn');
  }
  function motherBileFire(e) {
    const tt = { ang: angTo(e, G.player) };
    e.face = Math.cos(tt.ang) > 0 ? 1 : -1;
    for (let w = 0; w < (e.enraged ? 2 : 1); w++) for (let i = 0; i < 7; i++) {
      const ang = tt.ang + (i - 3) * (70 * DEG / 6) + w * 0.09;
      G.eproj.push({ x: e.x + Math.cos(ang) * 16, y: e.y + Math.sin(ang) * 12, ang, sp: 210 - w * 50, r: 5, dmg: e.atk * 0.7, t: 1.8, hist: [], kind: 'bile', poison: true });
    }
    const mx = e.x + e.face * 1, my = e.y - 32;
    for (let i = 0; i < 16; i++) { const aa = tt.ang + rand(-0.6, 0.6), sp = rand(60, 180); G.parts.push({ x: mx, y: my, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, t: rand(0.2, 0.45), c: pick(['#9ae050', '#d8f0a0', '#4a7a20']), g: 120, glow: true }); }
    G.fx.push({ kind: 'ring', x: mx, y: my, r: 4, grow: 160, t: 0.22, max: 0.22, c: '#c8f070' });
    e.lean = 0.3 * e.face; sfx('fireball'); addShake(3, tt.ang);
    e.state = 'recover'; e.t = 0.8; e.cd = rand(1.2, 1.8);
  }
  function motherMiasma(e) { // 독기 분출: 몸 주위를 독으로 덮는다
    e.state = 'wind'; e.pat = 'miasma'; alertMark(e, 64, true); sfx('warn');
    G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 84, t: 0, dur: 1.1, owner: e, heavy: true,
      onFire: tt => {
        const P = G.player;
        if (!P.dead && inShape(tt, P.x, P.y, P.r)) poisonHit(e); // v2.50 독은 피해 없이 중독만
        G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 10, t: 0.5, max: 0.5, c: '#9ae050', grow: 300 });
        G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 8, t: 0.4, max: 0.4, c: '#d8f0a0', grow: 200 });
        for (let i = 0; i < 40; i++) { const aa = rand(0, TAU), sp = rand(40, 160); G.parts.push({ x: e.x, y: e.y - 8, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.6, t: rand(0.4, 0.9), c: pick(['#9ae050', '#4a7a20', '#c8d870', '#6a6a3a']), g: 0, glow: Math.random() < 0.4 }); }
        splat(e.x, e.y, 30, '50,60,20'); addShake(5); sfx('blast');
        e.state = 'recover'; e.t = 0.9; e.cd = rand(1.3, 1.9);
      } });
  }
  // v1.38 역병 어미: 몸통·소매 팔·다리를 따로 — 걷기(다리 번갈아·팔 흔들기·디딜 때 내려앉음) / 시체 끌어올리기: 두 팔로 배를 움켜쥐고 떨림
  //   독기: 두 팔을 벌려 치켜들며 몸이 부풂(몸만 칸 단위로) / 담즙: 몸을 뒤로 젖히며 팔을 뒤로 뺌
  function drawMother(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0, F = flip ? -1 : 1, st = e.state, g = e.glow || 0;
    let sx = 1, sy = 1, tr = 0, rot = e.lean + (e.grogiT > 0 ? 0.25 * e.face : 0), bob = 0, lL = 0, lR = 0, aL = [0, 0], aR = [0, 0];
    if (st === 'chase') { const ph = Math.floor(e.walk * 0.9) % 4; if (ph === 0) { lL = -2; aR = [0, -2]; } else if (ph === 2) { lR = -2; aL = [0, -2]; } else bob = 2; }
    if (st === 'bilecharge') { const k = 1 - e.t / e.chargeMax; rot = -0.18 * e.face * k; aL = aR = [-2, -2]; bob = 2; if (k > 0.7) tr = Math.floor(time * 18) % 2 ? 2 : 0; }
    if (st === 'wind' && e.pat === 'brood') { aL = [4, 2]; aR = [-4, 2]; bob = 2; tr = g > 0.2 ? (Math.floor(time * 16) % 2 ? 2 : 0) : 0; }
    if (st === 'wind' && e.pat === 'miasma') { aL = [-2, -4]; aR = [2, -4]; sx = 1 + 0.1 * g; sy = 1 + 0.06 * g; }
    if (st === 'wind' && e.pat === 'bile') rot = -0.15 * e.face * g;
    drawShadow(e.x, e.y + 2, 12);
    if (e.state === 'wind' && e.pat === 'miasma' && !white) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = dRadial(ctx, e.x, e.y - 10, 0, e.x, e.y - 10, 30 + 50 * e.glow); gr.addColorStop(0, `rgba(150,220,80,${0.35 * e.glow})`); gr.addColorStop(1, 'rgba(150,220,80,0)'); ctx.fillStyle = gr.p(ctx); ctx.fillRect(e.x - 90, e.y - 100, 180, 180); ctx.restore(); }
    { const by0 = e.y + 2 + ya, by = by0 + bob, o = (m, dx, dy, ex) => drawSprite(m, 'mother', 2, e.x + tr + dx * F, dy, flip, Object.assign({ white, rot, alpha: al }, ex || {}));
      { const q = nmPose(e); if (st === 'chase') { q.sx = 1; q.sy = 1; } else { q.sx *= sx; q.sy *= sy; } if (st !== 'chase') q.rot = rot; drawNM(e, 'nMother', null, e.x + tr, by0, q, white, al); } // v2.44 새 정면 도트
      if (!white && al > 0.5) { // v1.52 배 속에서 무언가 꿈틀 · 맞은 직후 작은 손이 배를 밀고 나옴
        if (e._mf > 0 && e.flash <= 0) e.handUntil = time + 0.12; e._mf = e.flash;
        const bx = (e.x + tr) & ~1, bcy = (by0 - 10) & ~1;
        if (e.handUntil > time) { ctx.fillStyle = '#4a7a20'; ctx.fillRect(bx - 6, bcy + 4, 10, 2); ctx.fillStyle = '#c8b0a0';
          ['.w.w.', 'ww.ww', 'wwwww', '.www.'].forEach((row, j) => { for (let i = 0; i < 5; i++) if (row[i] === 'w') ctx.fillRect(bx - 6 + i * 2, bcy - 4 + j * 2, 2, 2); }); }
        else { const B = [[0, 0], [2, 1], [1, 2], [-1, 1], [1, 0], [2, 2]][Math.floor(time * 6 + e.x) % 6], qx = bx + (B[0] - 1) * 2 * F, qy = bcy + (B[1] - 1) * 2;
          ctx.fillStyle = '#b8f070'; ctx.fillRect(qx, qy, 4, 4); ctx.fillStyle = '#4a7a20'; ctx.fillRect(qx - 2, qy + 2, 2, 2); ctx.fillRect(qx + 4, qy + 2, 2, 2); }
      } }
    if (!white) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.35 + 0.25 * Math.sin(time * 4) + (e.state === 'wind' ? 0.4 * e.glow : 0);
      const gr = dRadial(ctx, e.x, e.y - 8 + ya, 0, e.x, e.y - 8 + ya, 14); gr.addColorStop(0, `rgba(170,240,90,${pulse})`); gr.addColorStop(1, 'rgba(170,240,90,0)');
      ctx.fillStyle = gr.p(ctx); ctx.fillRect(e.x - 14, e.y - 22 + ya, 28, 28);
      ctx.restore();
    }
    if (e.state === 'bilecharge' && !white) {
      const k = 1 - e.t / e.chargeMax, mx = e.x + e.face * 1, my = e.y - 16 + ya;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const rr = 4 + 12 * k, gr = dRadial(ctx, mx, my, 0, mx, my, rr);
      gr.addColorStop(0, `rgba(230,255,170,${0.6 + 0.4 * k})`); gr.addColorStop(0.5, `rgba(150,230,70,${0.5 * k + 0.2})`); gr.addColorStop(1, 'rgba(150,230,70,0)');
      ctx.fillStyle = gr.p(ctx); ctx.fillRect(mx - rr, my - rr, rr * 2, rr * 2);
      if (k > 0.75 && Math.floor(time * 20) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 1, 3, 3); }
      ctx.restore();
    }
    if (e.grogiT > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(e.y - 38 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); }
  }

  // ================================================================ 초원 확장: 엘리트 2종 · 고블린 아처 · 독침 슬라임 · 소품
  // ================================================================ v0.95 챕터 2 기사단 엘리트
  // 판정 순간 무기가 이미 70% 내려와 있게 (엇박 금지)
  function slamBlade(e, to, side, dur = 0.06) { e.bladeAng += angDiff(to, e.bladeAng) * 0.7; startSwing(e, to, side, dur); }
  function eAtkFx(x, y, power, c) { addShake(4 + 4 * power); dust(x, y, 8 * power); debris(x, y, 10 * power); G.fx.push({ kind: 'ring', x, y, r: 6, t: 0.35, max: 0.35, c: c || '#e0d8c8', grow: 200 * power }); }
  // ---- 기사단 처형인: 처형 내려찍기 · 회전 베기 2연 · 사슬 갈고리(끌어당긴 뒤 곧바로 내려찍기)
  function execTick(e, dt) {
    const P = G.player;
    if (e.hook) { e.hook.t += dt; if (e.hook.t > e.hook.dur + (e.pull ? 0.45 : 0.15)) e.hook = null; }
    if (e.pull) { e.pull.t -= dt; const dd = dist(P, e); if (dd > 46 && !P.dead) { const k = Math.min(1, 560 * dt / dd); P.x += (e.x - P.x) * k; P.y += (e.y - P.y) * k; } if (e.pull.t <= 0) e.pull = null; }
    if (e.state === 'chase') e.vuln = 1;
  }
  function updateExec(e, dt, d, a, moveTo) {
    const P = G.player;
    if (d > 64) moveTo(a, e.spd * (d > 200 ? 1.3 : 1));
    if (e.cd > 0) return;
    e.face = Math.cos(a) > 0 ? 1 : -1;
    let pat = e.forceChop ? 'chop' : d < 95 ? wpick2([['chop', 4], ['spin', 2]]) : d < 170 ? wpick2([['spin', 2], ['chop', 1], ['hook', 2]]) : d < 330 ? 'hook' : null;
    if (!pat) return;
    if (pat === e.lastPat && pat !== 'chop') pat = 'chop';
    e.lastPat = pat; const fast = e.forceChop; e.forceChop = false;
    const side = e.face;
    if (pat === 'chop') { // 처형 내려찍기: 도끼를 등 뒤로 크게 치켜들었다가 앞으로 내리꽂음
      e.state = 'wind'; e.bladeTarget = a - side * 160 * DEG; e.lean = -0.2 * side; alertMark(e, 56, true); sfx('warn');
      G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 132, w: 40, t: 0, dur: fast ? 0.55 : 0.85, owner: e,
        onFire: tt => { if (e.dead) return; slamBlade(e, tt.ang + side * 25 * DEG, side); e.lean = 0.3 * side; hitShape(tt, e.atk * 1.4); sfx('heavy'); sfx('blast', 0.7);
          const ex = e.x + Math.cos(tt.ang) * 90, ey = e.y + Math.sin(tt.ang) * 70; eAtkFx(ex, ey, 1.2); crack(ex, ey); hitstop = Math.max(hitstop, 0.04);
          e.state = 'recover'; e.t = 1.0; e.vuln = 1.3; e.cd = rand(0.8, 1.3); G.nums.push({ x: e.x, y: e.y - 70, v: '도끼가 박혔다!', t: 0.8, c: '#ffd34d', s: 1, txt: true }); } });
    } else if (pat === 'spin') { // 회전 베기 2연: 원 경고 → 한 바퀴 → 짧은 원 경고 → 한 바퀴
      e.state = 'wind'; e.bladeTarget = a + Math.PI; e.lean = -0.25 * side; alertMark(e, 56, true); sfx('warn');
      const spin = (mul) => tt => { if (e.dead) return; startSwing(e, e.bladeAng + side * (TAU - 0.01), side, 0.26); hitShape(tt, e.atk * mul); sfx('whoosh'); sfx('heavy', 0.8); eAtkFx(e.x, e.y, 0.8);
        G.fx.push({ kind: 'arcwave', x: e.x, y: e.y - 8, ang: 0, arc: TAU, r0: 20, r1: tt.r + 10, t: 0.28, max: 0.28, c: '230,220,210' }); };
      G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 86, t: 0, dur: 0.8, owner: e, onFire: tt => { spin(0.9)(tt); if (e.dead) return;
        G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 86, t: 0, dur: 0.38, owner: e, onFire: spin(0.9) }); e.state = 'recover'; e.t = 0.38 + 0.75; e.cd = rand(0.9, 1.4); } });
    } else { // 사슬 갈고리: 가는 선 경고 → 갈고리를 던져 맞으면 끌어당기고 곧바로 내려찍기
      e.state = 'wind'; e.lean = -0.15 * side; e.bladeTarget = restAng(e); alertMark(e, 56); sfx('warn', 0.8);
      G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 320, w: 16, t: 0, dur: 0.65, owner: e, thin: true,
        onFire: tt => { if (e.dead) return; e.hook = { ang: tt.ang, t: 0, dur: 0.2, len: 320, hit: false }; sfx('whoosh');
          if (!P.dead && inShape(tt, P.x, P.y, P.r)) { const hp0 = P.hp; hurtPlayer(e.atk * 0.5, e); if (P.hp < hp0) { e.hook.hit = true; e.pull = { t: 0.42 }; G.nums.push({ x: P.x, y: P.y - 40, v: '끌려간다!', t: 0.8, c: '#ff8a5a', s: 1, txt: true }); } }
          e.state = 'recover'; e.t = e.hook.hit ? 0.45 : 0.75; e.cd = e.hook.hit ? 0 : rand(1.0, 1.5); e.forceChop = e.hook.hit; } });
    }
  }
  Object.assign(MAPS, {"exLegL": [",..................,", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....kkkk............", "....kBBk............", "...kBBBk............", "...kkkkk............"], "exLegR": [",..................,", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", ".........kkkk.......", ".........kBBk.......", ".........kBBBk......", ".........kkkkk......"], "exBody": [",.....kkkkkk.......,", ".....kHHHHHHk.......", "....kHhhhhhhHk......", "....kHhhhhhhHk......", "....kHhkehkehk......", "....kHhhhhhhHk......", "....kHHhhhhHHk......", "...kkHHHHHHHHkk.....", "..kHHHssssssHHHk....", ".kHHsssssssssHHk....", ".kHsssbssssbssHk....", "..kssssbssbssssk....", "..kssssssbbssssk....", "...kAAAAAAAAAAk.....", "...kAaaaaaaaaAk.....", "...kAarraaaaaAk.....", "...kAaaaaraaaAk.....", "....kkkkrkkkkk......", "....................", "....................", "....................", "...................."], "moArmL": [",..................,", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", ".k..................", ".k..................", "kHkkk...............", "kHksk...............", "kkksk...............", "..ksk...............", "..kbk...............", "..k.k...............", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "...................."], "moArmR": [",..................,", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "..................k.", "..................k.", "...............kkkHk", "...............kskHk", "................kskk", "................ksk.", "................kbk.", "................k.k.", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "...................."], "moLegL": [",..................,", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "...kkkkk............", "....kSSk............", "...kSSSk............", "...kkkkk............"], "moLegR": [",..................,", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "....................", "............kkkkk...", "............kSSk....", "............kSSSk...", "............kkkkk..."], "moBody": [",.....kkkkkkkk.....,", ".....kHHhhhhHHk.....", "....kHhhhhhhhhHk....", "...kHhhhSSSSShhHk...", "...kHhSsssssssShk...", "...kHhssessseshHk...", "...kHhsssssssssHk...", "..kHHhsSsmmmsSsHHk..", "..kHHkhSsmmmsSkHHk..", "..kHkkkksssskkkkHk..", "..kkkSSSkkkkSSSkkk..", ".....kssSssSssk.....", ".....kssvvvvssk.....", "......ksvVVVvsk.....", "......ksvVVVVsk.....", "......ksvvVVvsk.....", "......kSsvvvsSk.....", ".....krRrRrRrRk.....", "....krRrRrRrRrRk....", "...krRrRrRrRrRrRk...", "...kkkkkRrRrkkkkk...", "........kkkk........", "....................", "....................", "...................."]}); // v1.38 처형인·역병 어미 부위 분리 (첫 줄 양끝 ',' = 투명 기준점)
  // v1.38 처형인: 몸통·다리를 따로 — 걷기 4장면(다리 번갈아·디딜 때 내려앉음), 준비 때 칸 단위로 웅크림(누르기 제거), 회전 베기 때 다리를 벌려 버팀
  function drawExec(e, ya, al) { // v2.44 새 정면 도트: 도끼는 손에서
    const white = e.flash > 0, st = e.state, o = nmPose(e), f = e.face;
    if (st === 'wind') { const k = Math.min(1, e.glow / 0.6); o.dx = -2 * f * k; o.sy = 1 - 0.1 * k; o.sx = 1 + 0.08 * k; o.rot = -0.16 * f * k; }
    if (e.sw) { o.dx = 3 * f; o.sx = 1.1; o.sy = 0.92; o.rot = 0.2 * f; }
    const by = e.y + 2 + ya, X = e.x + o.dx, shY = by - 16 + o.bob, fx = X + f * 8;
    const held = !e.sw && (st === 'chase' || st === 'recover' && !e.hook), bl = BLADES.headsman; // 평소엔 도끼 자루를 어깨에 걸쳐 멘다
    const hx = held ? X + f * NM_HAND : fx + Math.cos(e.bladeAng) * 8, hy = held ? by - 7 + o.bob : shY + Math.sin(e.bladeAng) * 8, behind = !e.sw && Math.cos(e.bladeAng) * f < -0.2;
    drawShadow(e.x, e.y + 2, 12);
    if (behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
    enemyTrail(e, e.trail, hx, hy, 14, bl.reach, '230,220,210', true);
    drawNM(e, 'nExec', null, e.x, by, o, white, al);
    if (!behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
    if (e.hook) { // 사슬: 2px 고리 마디 + 갈고리
      const H2 = e.hook, k = H2.hit && e.pull ? Math.max(0, dist(G.player, e) / H2.len) : Math.min(1, H2.t / H2.dur) * (H2.t > H2.dur ? Math.max(0, 1 - (H2.t - H2.dur) / 0.15) : 1), L = H2.len * k, ux = Math.cos(H2.ang), uy = Math.sin(H2.ang);
      for (let i = 0; i < L; i += 4) { const x = Math.round(fx + ux * i) & ~1, y = Math.round(shY + uy * i) & ~1; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 1, y - 1, 4, 4); ctx.fillStyle = i % 8 ? '#5a5e68' : '#9aa0ac'; ctx.fillRect(x, y, 2, 2); }
      const tx = Math.round(fx + ux * L) & ~1, ty = Math.round(shY + uy * L) & ~1; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(tx - 3, ty - 3, 8, 8); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(tx - 1, ty - 1, 4, 4); ctx.fillRect(tx + Math.round(-uy * 4) - 1, ty + Math.round(ux * 4) - 1, 2, 2);
    }
    if (e.grogiT > 0) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 14), Math.round(by - 38 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); } }
  }

  const isEliteT = t => t === 'panda' || t === 'reaper' || t === 'weasel' || t === 'shrewA' || t === 'shrewB' || t === 'gbrute' || t === 'boar' || t === 'mother' || t === 'urg' || t === 'troll' || t === 'exec' || t === 'mordred' || t === 'queen';
  const isElite = e => isEliteT(e.type);
  const ELITE_NAMES = { weasel: '무법자 「검은 안대」', shrewA: '형 땃쥐 「은고리」', shrewB: '아우 땃쥐 「금고리」', shrews: '차크람 땃쥐 형제', reaper: '수확자 「흑각」', panda: '떠돌이 석궁사수 「붉은 꼬리」', gbrute: '고블린 챔피언', boar: '가시등 멧돼지', mother: '역병 어미', exec: '기사단 처형인', urg: '투기장 챔피언 우르그', troll: '사슬 풀린 트롤 그러크' };
  const eliteName = e => ELITE_NAMES[e.type];
  const ELITE_TOP = { gbrute: 34, boar: 30, mother: 38, exec: 38 }; // v2.44 새 도트 키 // 머리 위 (이름표·HP 막대 높이)
  const SEMI_T = new Set(['ocharge', 'otroll', 'ogrip']), isSemi = e => SEMI_T.has(e.type);
  const INVADER_T = new Set(['panda', 'reaper', 'shrewA', 'shrewB', 'weasel']); // 난입자
  // ================================================================ v1.24 STAGE 4 몬스터 — 죽은 왕국의 시민·신하·근위대 (2px 칸 · 검은 외곽선 · 왼쪽 위 빛)
  // 재 망자·잉걸 나방·재사냥개는 구울·까마귀·사냥개의 움직임을 쓰고 모습·색·부가 효과만 다르다
  const ASH_ALIAS = { husk: 'ghoul', moth: 'crow', lancer: 'dog' }; // v1.25 재사냥개 → 근위 돌격병 → v1.27 잿더미(재가 뭉친 무더기, 일직선 재 사태 돌진). 내부 이름 lancer 그대로
  const ASH_NAMES = { coffin: '관 운반자', herald: '왕의 기수' }; // v1.29 전령(나팔) → 기수(왕기)
  Object.assign(PAL, {
    husk: { k: '#0b0a09', s: '#a8a296', S: '#7a746c', c: '#524e48', C: '#34312c', e: '#ff7a30', b: '#ffb060', m: '#2a1a12' },
    ashHound: { k: '#0b0a09', d: '#5e5a54', D: '#3a3732', l: '#8a847a', L: '#a8a296', t: '#e0d8c8', e: '#ff7a30', m: '#6a6460', r: '#5a2a1c', R: '#3a1a10', g: '#b09040' },
    moth: { k: '#140a06', e: '#ff7a30', E: '#ffd080', D: '#3a2a22', d: '#5a4434', w: '#c8b8a0' },
    cantor: { k: '#0b0a09', a: '#b0aa9e', A: '#7a746c', d: '#4a4642', D: '#2e2b28', e: '#ff7a30', E: '#ffc070', g: '#9a7a38' },
    aguard: { k: '#0b0a09', a: '#a49e94', A: '#7a746c', d: '#524e48', D: '#34312c', g: '#9a7a38', e: '#ff7a30' },
    coffinB: { k: '#0b0a09', a: '#a8a296', A: '#7a746c', d: '#5a5048', D: '#3a332c', e: '#ff7a30', w: '#8a7a66', W: '#64564a', g: '#9a7a38', c: '#2a2420' },
    herald: { k: '#0b0a09', a: '#a8a296', A: '#7a746c', r: '#6a2a1e', R: '#4a1c14', g: '#c8a050', e: '#ff7a30' },
  });
  Object.assign(MAPS, {
    mothA: ['.kk......kk.', 'kEek....keEk', 'kEeek..keeEk', '.keeekkeeek.', '..kkeDDekk..', '....kDDk....', '...kDkkDk...', '....k..k....'],
    mothB: ['............', '....kDDk....', '.kkkeDDekkk.', 'kEeeeDDeeeEk', 'kEeeekkeeeEk', '.kEek..keEk.', '..kk....kk..', '............'],
    cantor: ['....kkkk....', '...kAaaAk...', '..kAaAAaAk..', '..kAkkkkAk..', '..kAekkeAk..', '..kAkEEkAk..', '..kAAkkAAk..', '.kdAAAAAAdk.', 'kdddAggAdddk', '.kdddaaddDk.', '.kdddddddDk.', '.kdDddddDDk.', '..kdddddDk..', '..kDdkdDDk..', '...kd.kD.k..', '....k...k...'],
    cantorUp: ['....kkkk....', '...kAaaAk...', '..kAaAAaAk..', '..kAkkkkAk..', '..kAekkeAk..', '..kAkEEkAk..', 'kk.kAkkAk.kk', 'kak.kAAk.kak', '.kakAAAAkak.', '..kddggddk..', '.kdddddddDk.', '.kdDddddDDk.', '..kdddddDk..', '..kDdkdDDk..', '...kd.kD.k..', '....k...k...'],
    aguard: ['....kkkk....', '...kaaaAk...', '..kaaaaAAk..', '..kaakkkAk..', '..kakeekAk..', '..kaAAAAAk..', '.kkgAAAAgkk.', 'kaaAAAAAAddk', 'kaAkAAAAkdDk', 'kaAkAAAdkdDk', '.kkkAgAdkkk.', '...kAAddk...', '...kAAddk...', '..kaAk.kdDk.', '..kaAk.kdDk.', '..kkkk.kkkk.'],
    aguardB: ['....kkkk....', '...kaaaAk...', '..kaaaaAAk..', '..kaakkkAk..', '..kakeekAk..', '..kaAAAAAk..', '.kkgAAAAgkk.', 'kaaAAAAAAddk', 'kaAkAAAAkdDk', 'kaAkAAAdkdDk', '.kkkAgAdkkk.', '...kAAddk...', '..kaAkdDk...', '..kaAkkdDk..', '.kaAk..kdDk.', '.kkkk..kkkk.'],
    aguardShield: ['kkkkkk', 'kaAAdk', 'kAgAdk', 'kggggk', 'kAgAdk', 'kAgAdk', 'kAAAdk', '.kAdk.', '..kk..'],
  });
  Object.assign(MAPS, { // v1.25 전령·관 운반자 다시 그림, 근위 돌격병
    herald: ["......kk........", ".....kRRk.......", "....kRrRk.......", ".....kRkkkk.....", "....kgggggk.....", "...kAAAAAAAk....", "....kakkkAk.....", "....kaekeAk.....", "....kAkkkAk.....", "...kkgAAAgkk....", "..kDkrrrrrkDk...", ".kDakrgrgrkDdk..", ".kDakrgggrkDdk..", ".kDakrrgrrkDdk..", ".kDkkgggggkkDk..", ".kD.krRrRrk.Dk..", ".kD.krRrRrk.Dk..", "..k.kRrkrRk.k...", "....kAAkAAk.....", "....kAAkAAk.....", "...kkDDkDDkk....", "...kkkk.kkkk...."],
    heraldB: ["......kk........", ".....kRRk.......", "....kRrRk.......", ".....kRkkkk.....", "....kgggggk.....", "...kAAAAAAAk....", "....kakkkAk.....", "....kaekeAk.....", "....kAkkkAk.....", "...kkgAAAgkk....", "..kDkrrrrrkDk...", ".kDakrgrgrkDdk..", ".kDakrgggrkDdk..", ".kDakrrgrrkDdk..", ".kDkkgggggkkDk..", ".kD.krRrRrk.Dk..", ".kD.krRrRrk.Dk..", "..k.kRrkrRk.k...", "....kAAkkAk.....", "...kAAk.kAk.....", "...kDDk.kDDk....", "...kkkk.kkkk...."],
    coffinBody: [".......kkkkk........", "......kdDDDdk.......", ".....kdDDDDDdk......", ".....kDkkkkkDk......", ".....kDkekekDk......", ".....kDkkakkDk......", ".....kdDDDDDdk......", "....kaAdDcDDdAk.....", "....kAAAdDcDdAk.....", "....kAAAAddcDdk.....", "....kAAAAAddcdk.....", "....kAAAAAAddck.....", "....kAAAAeAdcAk.....", ".....kAAAAAAAck.....", ".....kdddddddk......", ".....kdDdDdDdk......", ".....kddDdddDdk.....", "....kdDk...kdDk.....", "....kdDk...kdDk.....", "....kdDk...kdDk.....", "...kaaAk...kaaAk....", "...kkkkk...kkkkk...."], // v1.29 팔은 따로 그림 (pxArm)
    coffinUp: ["...kkkkkk...", "..kwwwwwwk..", ".kwWWWWWWDk.", "kwWWWgWWWDDk", "kWWWWgWWWWDk", "kiiiiiiiiiik", "kWWgggggWWDk", "kWWWWgWWWWDk", "kWWWWgWWWWDk", "kWWWWWWWWWDk", ".kWWWWWWWDk.", ".kiiiiiiiik.", ".kWWWWWWWDk.", ".kWWWWWWWDk.", "..kWWWWWDk..", "..kWWWWWDk..", "..kiiiiiik..", "...kkkkkk..."],
    coffinUpOpen: ["...kkkkkk...", "..kccccccWk.", ".kcccccccWDk", "kcceccecccDk", "kcccccccccDk", "kiccccccccik", "kccccccccWDk", "kcccEcccccDk", "kccccccEccDk", "kcccccccccDk", ".kcccccccDk.", ".kiiiiiiiik.", ".kWWWWWWWDk.", ".kWWWWWWWDk.", "..kWWWWWDk..", "..kWWWWWDk..", "..kiiiiiik..", "...kkkkkk..."],
    coffinFlat: ["..kkkkkkkkkkkkkkkkkk..", ".kwwwiwwwwwwwwwiwwwwk.", "kwWWWiWWWWgWWWWiWWWWDk", "kWWWWiWWgggggWWiWWWDDk", "kWWWWiWWWWgWWWWiWWDDDk", ".kDDDiDDDDDDDDDiDDDDk.", "..kkkkkkkkkkkkkkkkkk.."],
  });
  // v1.27 잿더미: 타 버린 왕도 사람들의 재가 뭉친 무더기 — 거친 재 알갱이(디더) · 부서지는 가장자리 · 가슴 틈의 잉걸 심장 · 잉걸 눈 · 박힌 뼛조각. 매끈한 광택·말랑한 탄성 없음 (슬라임과 구분)
  PAL.ashHeap = { k: '#0b0a09', W: '#d4cec2', L: '#aaa498', l: '#86807a', d: '#5e5a54', D: '#3a3732', e: '#ff7a30', E: '#ffc070', r: '#8a3418', b: '#d8cfbc', B: '#9a907c' };
  Object.assign(MAPS, {
heapA:[
"................",
"........k.......",
"......kkWk.k....",
".....kWLLkkWk...",
"....kWLlLllLk...",
"...kWLlklllkdk..",
"..kWLlkEkllEkdk.",
"..kLlLllllllldk.",
".kLlLllkekkldDk.",
".kLlllkeEelldDk.",
"kLlLlllkekldbBDk",
"kldlLdllkldbdDDk",
".kkdkkdkkdDkkDk.",
"..k..k..k..k.k..",
],
heapB:[
"................",
"................",
".........k......",
".......kkWk.k...",
"......kWLLkkWk..",
"....kWLlLlllLk..",
"...kWLlklllklddk",
"..kWLlkEkllEkldk",
".kLLlLlllllllldk",
".kLlLllkekklldDk",
"kLllllkeEelldbBk",
"kldlLdllkekdbdDk",
".kdkkdkkdkDkDkk.",
"..k...k..k...k..",
],
heapUp:[
"........k.......",
".......kWk......",
"......kWLk......",
".....kWLLlk.....",
"....kWLlLllk....",
"....kLlklkldk...",
"...kWlkEklEkdk..",
"...kLlLllllldk..",
"...kLlkeekkldDk.",
"..kLlkeEEeklldk.",
"..kLlkeEEekldDk.",
".kLlLlkeeklbBDk.",
".kldlLdlkldbdDDk",
"kldlldlldddDdDDk",
".kkdkkdkkdDkkDk.",
],
heapDash:[
"................",
"................",
"................",
".........kkkk...",
".......kkWWLLk..",
"......kWLLlllLk.",
"..k..kWLllkkLlLk",
".kWkkLLlllkEkElk",
"kWLLLllkekllllk.",
"kLlLllkeEekldk..",
"kldlLlllkeklDk..",
".kddkddldddDDk..",
"..kk.kkdkkkkk...",
"................",
],
heapFlat:[
"................",
"................",
"................",
"................",
"................",
"................",
"................",
"......kkkk......",
"....kkWLLLkk....",
"..kkLLlklllkkk..",
".kLLlllEllkEldk.",
"kLlLlllkekldbBDk",
"kldlLdllkldbdDDk",
".kkdkkdkkdDkkDk.",
],
  });
  // v1.28 재 망자: 재로 굳은 사람이 녹아내린다 — 머리 위만 밝고 아래로 갈수록 흘러내린 재 줄무늬, 잉걸 눈에서 불 눈물이 흘러내림, 늘어진 턱, 녹아 처진 팔 끝 방울, 발 대신 바닥에 고인 재 웅덩이
  PAL.ashHusk = { k: '#0b0a09', W: '#d4cec2', L: '#aaa498', l: '#86807a', d: '#5e5a54', D: '#3a3732', e: '#ff7a30', E: '#ffc070', r: '#8a3418' };
  Object.assign(MAPS, {
huskA:[
".....kkkk.......",
"....kWWLLk......",
"...kWLLLlLk.....",
"...kLkElkEk.....",
"...kLkelkedk....",
"...kllrllrdk....",
"...kdlkkkldk....",
"..kkLlkrkldkk...",
".kLLlllllllddk..",
".kLkLllelllkdk..",
".kLkkLlleldkkdk.",
".kLk.kLllldkkdk.",
".kdk.kLlllldkdk.",
"..d..kLlldldk.d.",
"..d.kLldlddDk...",
"...kLldLldlLdk..",
"..kLldLldlLddDDk",
"...kkdkkdkkkkk..",
],
huskB:[
"................",
".....kkkk.......",
"....kWWLLk......",
"...kWLLLlLk.....",
"...kLkElkEk.....",
"...kLkelkedk....",
"...kllrllrdk....",
"..kkdlkrkldkk...",
".kLLlllllllddk..",
".kLkLllelllkdk..",
".kLkkLlleldkkdk.",
".kdk.kLllldkkdk.",
"..d..kLlllldkdk.",
"..d..kLlldldk...",
"....kLlllddDk.d.",
"..kLldLldlLddk..",
".kLldLldlLdddDk.",
"..kkkdkkdkkkkk..",
],
huskUp:[
".kWk.......kLk..",
".kLk.kkkk..kdk..",
".kLkkWWLLk.kdk..",
".kdkWLLLlLkkdk..",
"..kdLkElkEkdk...",
"...kLkelkedk....",
"...kllrllrdk....",
"...kdlkkkldk....",
"...kkLkrkldk....",
"...kLllllllk....",
"...kLlleEldk....",
"...kLllllelk....",
"...kLllllldk....",
"...kLlldlddk....",
"...kLlldlddDk...",
"..kLldLldlLddk..",
".kLldLldlLdddDk.",
"..kkkdkkdkkkkk..",
],
  });
  PAL.coffinB.E = '#ffc070'; PAL.coffinB.i = '#4a4642'; PAL.coffinB.c = '#140e0a';
  Object.assign(PAL.herald, { D: '#2e2b28', d: '#4a4642' });
  SEMI_T.add('coffin'); SEMI_T.add('herald');
  // ---------- 화상 (잉걸 나방): 짧은 도트 피해, 불티
  function burnPlayer(dur, dmg) { const P = G.player; if (P.dead) return; P.burnT = Math.max(P.burnT || 0, dur); P.burnDmg = Math.max(1, Math.round(dmg)); P.burnTick = P.burnTick > 0 ? P.burnTick : 0.5; }
  function updateBurn(dt) {
    const P = G.player; if (!(P.burnT > 0) || P.dead) return;
    P.burnT -= dt; P.burnTick -= dt;
    if (Math.random() < dt * 14) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(2, 22), vx: rand(-6, 6), vy: -rand(20, 40), t: rand(0.25, 0.5), c: pick(['#ff7a30', '#ffc070', '#ff4020']), g: 0, glow: true });
    if (P.burnTick <= 0) { P.burnTick = 0.5; hurtPlayer(P.burnDmg, null, false, true); }
  }
  // ---------- 재 구름 (재 망자가 부서진 자리): 안에 있으면 느려진다
  function updateAshClouds(dt) {
    const P = G.player; P.ashSlow = false; if (!G.ashClouds) return;
    for (const c of G.ashClouds) { c.t -= dt; if (Math.hypot(P.x - c.x, (P.y - c.y) * 1.4) < c.r) P.ashSlow = true; }
    G.ashClouds = G.ashClouds.filter(c => c.t > 0);
  }
  function drawAshClouds() {
    if (!G.ashClouds) return;
    for (const c of G.ashClouds) { const k = Math.min(1, c.t / 0.4) * Math.min(1, (c.max - c.t) / 0.15), rx = c.r, ry = c.r * 0.6;
      for (let y = Math.round(c.y - ry) & ~1; y <= c.y + ry; y += 2) for (let x = Math.round(c.x - rx) & ~1; x <= c.x + rx; x += 2) { const q = Math.hypot((x - c.x) / rx, (y - c.y) / ry); if (q > 1) continue;
        const v = (1 - q) * 0.9 * k + 0.15 * Math.sin(x * 0.3 + time * 3) * Math.cos(y * 0.4 - time * 2); if (!dith(x >> 1, y >> 1, v)) continue; ctx.fillStyle = q < 0.5 ? 'rgba(170,164,154,.75)' : 'rgba(120,114,106,.6)'; ctx.fillRect(x, y - 6, 2, 2); } }
  }
  // ---------- 재의 성가대원: 거리를 두고 떠 있다가, 노래로 플레이어 발밑에 재 원을 그린다 (유도 없음 · 1초 뒤 터짐)
  function updateCantor(e, dt, d, a, moveTo) {
    e.walk += dt * 3; e.z = 4 + Math.sin(time * 2.4 + e.x) * 2;
    if (e.state === 'sing') { if (e.t <= 0) { e.state = 'recover'; e.t = 0.6; e.cd = rand(2.6, 3.6); } return; }
    if (e.state !== 'chase') return;
    if (d < 130) moveTo(a + Math.PI, e.spd); else if (d > 230) moveTo(a, e.spd); else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.45);
    if (Math.random() < dt * 0.4) e.strafe = -(e.strafe || 1);
    e.face = Math.cos(a) > 0 ? 1 : -1;
    if (e.cd <= 0 && d < 300) {
      const P = G.player, tx = P.x, ty = P.y; e.state = 'sing'; e.t = 1.2; sfx('warn', 0.7);
      (G.ashShots = G.ashShots || []).push({ x0: e.x, y0: e.y - 26 - (e.z || 0), y0g: e.y, x1: tx, y1: ty, t: 0, dur: 1.0, h: 60 });
      G.tele.push({ shape: 'circle', x: tx, y: ty, r: 34, t: 0, dur: 1.0, owner: e,
        onFire: tt => { hitShape(tt, e.atk); for (let i = 0; i < 14; i++) { const q = rand(0, TAU), r = rand(4, 30); G.parts.push({ x: tx + Math.cos(q) * r, y: ty + Math.sin(q) * r * 0.6, vx: Math.cos(q) * 30, vy: -rand(30, 70), t: rand(0.4, 0.8), c: pick(['#cdc7ba', '#8a847a', '#ff7a30']), g: 60, glow: Math.random() < 0.3 }); } sfx('heavy', 1.3); dust(tx, ty, 10); } });
    }
  }
  function drawCantor(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0, z = e.z || 0, sing = e.state === 'sing';
    drawShadow(e.x, e.y + 1, 8);
    { const M = nrMotion(e); nrBiped(e, M.m === 'wind' ? 'cantorUp' : 'cantor', 'cantor', e.x, e.y + 2 - z + ya, flip, { white, alpha: al }, M); } // v1.54
    if (sing && Math.random() < 0.5) G.parts.push({ x: e.x + e.face * 1, y: e.y - 20 - z, vx: e.face * rand(10, 30), vy: -rand(10, 30), t: 0.6, c: pick(['#ffc070', '#cdc7ba']), g: 0, glow: true }); // 노랫소리 대신 재 음표
  }
  // ---------- 잿빛 근위병: 앞쪽 방패(정면 피해 -60%), 창 찌르기 2연속 — 등 뒤나 찌르는 순간을 노려라
  function updateAGuard(e, dt, d, a, moveTo) {
    e.walk += dt * 4;
    if (e.state === 'thrust') { // 찌르기 사이: 다음 찌르기 조준
      if (e.t <= 0) { if (e.step < 2) guardThrust(e); else { e.state = 'recover'; e.t = 0.8; e.cd = rand(1.4, 2.0); } }
      return;
    }
    if (e.state !== 'chase') return;
    e.face = Math.cos(a) > 0 ? 1 : -1; e.spearAng = lerpAng(e.spearAng == null ? a : e.spearAng, a, dt * 4);
    if (d > 52) moveTo(a, e.spd); else if (d < 36) moveTo(a + Math.PI, e.spd * 0.5);
    if (e.cd <= 0 && d < 80) { e.step = 0; guardThrust(e); }
  }
  function guardThrust(e) {
    const P = G.player, a = angTo(e, P); e.state = 'thrust'; e.step++; e.spearAng = a; e.face = Math.cos(a) > 0 ? 1 : -1; e.t = 0.95;
    G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 70, w: 14, t: 0, dur: e.step === 1 ? 0.55 : 0.4, owner: e,
      onFire: tt => { e.poke = 0.18; hitShape(tt, e.atk); sfx('swing', 1.2); G.fx.push({ kind: 'claw', x: e.x + Math.cos(a) * 30, y: e.y - 10 + Math.sin(a) * 20, ang: a, r: 20, w: 2, glow: true, c: '230,220,200', t: 0.15, max: 0.15 }); e.t = 0.3; } });
  }
  const guardFront = (e, ax) => e.type === 'aguard' && e.state === 'chase' && Math.sign(ax - e.x) === e.face; // 플레이어가 앞쪽에서 때렸나
  function drawAGuard(e, ya, al, bob) { // v2.44 새 정면 도트: 볏 달린 투구 · 판금 어깨 · 금 테 겉옷 / 앞에 탑 방패, 그 위로 창
    const white = e.flash > 0, flip = e.face < 0, f = e.face, o = nmPose(e), y = e.y + 2 + ya;
    if (e.poke > 0) { o.dx = 3 * f; o.sx = 1.08; o.sy = 0.94; o.rot = 0.12 * f; }
    drawShadow(e.x, e.y + 1, 10);
    const sa = e.spearAng == null ? (f > 0 ? 0 : Math.PI) : e.spearAng, poke = e.poke > 0 ? 12 : 0; e.poke = Math.max(0, (e.poke || 0) - 1 / 60);
    const X = e.x + o.dx, hx = X + f * 4, hy = y - 13 + o.bob;
    const drawSpear = () => { // 창: 굵은 자루(외곽선 포함 2칸) + 넓은 창날 + 붉은 술
      for (let i = -10; i < 30; i += 2) { const px = Math.round(hx + Math.cos(sa) * (i + poke)) & ~1, py = Math.round(hy + Math.sin(sa) * (i + poke) * 0.7) & ~1; ctx.fillStyle = '#0b0a09'; ctx.fillRect(px - 1, py - 1, 4, 4); }
      for (let i = -10; i < 30; i += 2) { const px = Math.round(hx + Math.cos(sa) * (i + poke)) & ~1, py = Math.round(hy + Math.sin(sa) * (i + poke) * 0.7) & ~1; ctx.fillStyle = white ? '#fff' : i % 8 === 0 ? '#4a3a2a' : '#6a5038'; ctx.fillRect(px, py, 2, 2); }
      const tip = (d, w, c) => { const px = Math.round(hx + Math.cos(sa) * (d + poke)) & ~1, py = Math.round(hy + Math.sin(sa) * (d + poke) * 0.7) & ~1, nx = Math.round(-Math.sin(sa) * w) & ~1, ny = Math.round(Math.cos(sa) * w * 0.7) & ~1;
        ctx.fillStyle = '#0b0a09'; ctx.fillRect(px - nx - 1, py - ny - 1, 4 + Math.abs(nx) * 2, 4 + Math.abs(ny) * 2); ctx.fillStyle = white ? '#fff' : c; ctx.fillRect(Math.min(px - nx, px + nx), Math.min(py - ny, py + ny), 2 + Math.abs(nx) * 2, 2 + Math.abs(ny) * 2); };
      tip(30, 2, '#c8c2b6'); tip(33, 2, '#e8e2d6'); tip(36, 0, '#f4f0e8'); tip(27, 0, '#8a2e20'); };
    if (Math.sin(sa) < -0.3) drawSpear();
    drawNM(e, 'nGuard', null, e.x, y, o, white, al);
    if (Math.sin(sa) >= -0.3) drawSpear();
    drawSprite('nGuardShield', 'nGuard', 2, X + f * 9, y - 1 + o.bob, flip, { white, alpha: al }); // 앞을 막는 탑 방패
  }

  // ---------- 잿더미 (v1.27, 근위 돌격병 대체): 재가 뭉쳐 기어 다니다가, 몸을 쌓아 올려 잉걸 심장을 달군 뒤 낮게 무너지며 일직선으로 쏟아져 들어온다 (움직임은 사냥개의 돌진을 빌림)
  function drawAshHeap(e, ya, al, bob) {
    const white = e.flash > 0, flip = e.face < 0, st = e.state, f = e.face, by = e.y + 2 + ya;
    drawShadow(e.x, e.y + 1, st === 'dash' ? 14 : 12);
    const rec = st === 'recover' && e.t > 0.45, map = st === 'dash' ? 'heapDash' : st === 'wind' ? 'heapUp' : rec ? 'heapFlat' : 'heapA';
    { const M = nrMotion(e), q = M.f, off = M.m === 'walk' ? { top: [[0, 1, 0, -1][q], [0, 0, -1, 0][q]] } : M.m === 'idle' ? { top: [0, [0, -1, -1, 0][q]] } : M.m === 'wind' ? { top: [q >= 4 ? -(q % 2) : 0, 0] } : M.m === 'hurt' ? { top: [[-1, -2, -1, 0][q], 0], bot: [[-1, -1, 0, 0][q], 0] } : M.m === 'hit' ? { top: [-1, 0] } : {}; // v1.54
      const F = flip ? -1 : 1, kb = nrPart(map, 'bot'), kt = nrPart(map, 'top'), [tx, ty] = off.top || [0, 0], [bx2, by2] = off.bot || [0, 0];
      if (kb) drawSprite(kb, 'ashHeap', 2, e.x + bx2 * 2 * F, by + by2 * 2, flip, { white, alpha: al });
      if (kt) for (let s2 = 0; s2 >= ty; s2--) drawSprite(kt, 'ashHeap', 2, e.x + tx * 2 * F, by + s2 * 2, flip, { white, alpha: al }); }
    if (al < 0.5) return;
    const P = (x, y, vx, vy, t, c, glow) => G.parts.push({ x, y, vx, vy, t, c, g: 0, glow });
    if (st === 'dash') { // 재 사태: 뒤로 흩날리는 재 + 앞쪽 불티
      for (let i = 0; i < 2; i++) P(e.x - f * rand(4, 16), e.y - rand(0, 10), -f * rand(10, 40), -rand(4, 16), rand(0.4, 0.8), pick(['#86807a', '#5e5a54', '#aaa498']), false);
      if (Math.random() < 0.5) P(e.x + f * rand(0, 10), e.y - rand(4, 14), rand(-10, 10), -rand(20, 40), rand(0.2, 0.4), pick(['#ff7a30', '#ffc070']), true);
    } else if (st === 'wind') { // 몸을 쌓아 올리며 심장이 달아오른다: 위로 빨려 올라가는 불티
      if (Math.random() < 0.6) P(e.x + rand(-12, 12), e.y - rand(0, 6), 0, -rand(30, 60), rand(0.3, 0.5), pick(['#ff7a30', '#ffc070', '#cdc7ba']), Math.random() < 0.6);
    } else { // 평소: 꼭대기에서 재 연기, 가장자리에서 재 부스러기가 떨어진다
      if (Math.random() < 0.12) P(e.x + rand(-4, 4), by - 24, rand(-4, 4), -rand(10, 20), rand(0.6, 1.0), pick(['#5e5a54', '#86807a']), false);
      if (Math.random() < 0.08) P(e.x + pick([-1, 1]) * rand(10, 15), by - rand(2, 10), 0, rand(4, 10), rand(0.3, 0.5), '#86807a', false);
    }
  }
  // 성가대원의 재 덩어리: 손에서 떠올라 포물선으로 날아가 재 원 위에 떨어진다 (보이는 투사체)
  function updateAshShots(dt) { if (!G.ashShots) return; for (const s of G.ashShots) { s.t += dt; if (Math.random() < 0.7) { const k = Math.min(1, s.t / s.dur), x = s.x0 + (s.x1 - s.x0) * k, y = s.y0 + (s.y1 - s.y0) * k - Math.sin(Math.PI * k) * s.h; G.parts.push({ x: x + rand(-2, 2), y: y + rand(-2, 2), vx: rand(-6, 6), vy: rand(-6, 6), t: rand(0.25, 0.45), c: pick(['#ff7a30', '#cdc7ba', '#8a847a']), g: 0, glow: Math.random() < 0.4 }); } } G.ashShots = G.ashShots.filter(s => s.t < s.dur); }
  function ashShotEnts(ents) { if (!G.ashShots) return; for (const s of G.ashShots) { const k = Math.min(1, s.t / s.dur), gx = s.x0 + (s.x1 - s.x0) * k, gy = s.y0g + (s.y1 - s.y0g) * k, y = s.y0 + (s.y1 - s.y0) * k - Math.sin(Math.PI * k) * s.h;
    ents.push({ y: gy + 200, d: () => { drawShadow(gx, gy + 1, 4); const x0 = Math.round(gx) & ~1, y0 = Math.round(y) & ~1, fl = Math.floor(time * 12) % 2;
      ctx.fillStyle = '#0b0a09'; ctx.fillRect(x0 - 4, y0 - 6, 8, 12); ctx.fillRect(x0 - 6, y0 - 4, 12, 8);
      ctx.fillStyle = '#5e5a54'; ctx.fillRect(x0 - 4, y0 - 4, 8, 8); ctx.fillStyle = '#a8a296'; ctx.fillRect(x0 - 4, y0 - 4, 4, 4);
      ctx.fillStyle = fl ? '#ff7a30' : '#ffc070'; ctx.fillRect(x0, y0, 2, 2); ctx.fillRect(x0 - 2, y0 + 2, 2, 2); } }); } }
  // ---------- 관 운반자 (준엘리트): 관 내려찍기(원형 충격파) · 관을 열어 재 망자 둘을 꺼낸다
  function updateCoffin(e, dt, d, a, moveTo) {
    e.walk += dt * 2.6; e.summonT = (e.summonT == null ? 4 : e.summonT) - dt;
    if (e.state === 'slam') { if (e.t <= 0) { e.state = 'recover'; e.t = 1.0; e.cd = rand(1.6, 2.4); e.swingRet = true; } return; } // v1.26 메고 있던 관을 그대로 휘두른다 (그림은 coffinSwing)
    if (e.state === 'open') { if (e.t <= 0) { e.state = 'recover'; e.t = 0.6; e.cd = rand(1.0, 1.6); e.opened = false; } return; }
    if (e.state !== 'chase') return;
    e.swingRet = false; e.face = Math.cos(a) > 0 ? 1 : -1;
    if (d > 50) moveTo(a, e.spd);
    if (e.cd > 0) return;
    if (e.summonT <= 0 && G.enemies.filter(x => !x.dead && x.ash === 'husk').length < 6) { // 관 뚜껑을 연다
      e.state = 'open'; e.t = 1.4; e.opened = true; e.summonT = 12; sfx('block', 0.6); alertMark(e, 54, true);
      for (let i = 0; i < 2; i++) { const pt = { x: clamp(e.x + (i ? 1 : -1) * rand(30, 60), A.x0 + 20, A.x1 - 20), y: clamp(e.y + rand(-20, 30), A.y0 + 20, A.y1 - 20) };
        G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: 10, t: 0, dur: 0.9 + i * 0.15, owner: e, onFire: () => { const g = makeEnemy('husk', pt.x, pt.y); g.rise = 0.5; G.enemies.push(g); dust(pt.x, pt.y, 8); } }); }
      return;
    }
    if (d < 110) { // 관 내려찍기: 앞쪽에 큰 원
      const cx = e.x + e.face * 26, cy = e.y + 4; e.state = 'slam'; e.t = e.tMax = 1.05; sfx('warn'); alertMark(e, 54);
      G.tele.push({ shape: 'circle', x: cx, y: cy, r: 58, t: 0, dur: 0.95, owner: e, heavy: true, onFire: tt => { hitShape(tt, e.atk * 1.2); addShake(5); sfx('blast'); debris(cx, cy, 14); dust(cx, cy, 16); G.fx.push({ kind: 'ring', x: cx, y: cy, r: 8, t: 0.4, max: 0.4, c: '#cdc7ba', grow: 200 }); } });
    }
  }
  // v1.26 관 휘두르기: 등에 멘 관(coffinUp) 모양 그대로, 아래 끝(손잡이)을 축으로 칸 단위 회전 — 뒤로 젖혀 들었다가 머리 위로 넘겨 앞쪽 바닥에 내려찍고, 잠깐 박아 둔 뒤 다시 등으로
  const COFFIN_REST = { x: -10, y: -14, a: 0 }, COFFIN_UP = { x: -6, y: -24, a: -0.4 }, COFFIN_HIT = { x: 12, y: -10, a: 1.9 }; // v2.44 새 도트(몸이 작아짐)에 맞춤
  // v1.29 도트 팔: 어깨 → 손을 2px 칸으로 잇는다 (검은 외곽선 · 4px 굵기 · 손은 조금 크게). 휘두르는 동안 손이 쥔 곳을 따라간다
  function pxArm(ax, ay, bx, by, c, white) { // c = [밝은, 중간, 어두운]
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2)), pts = [];
    for (let i = 0; i <= n; i++) pts.push([snap2(ax + (bx - ax) * i / n), snap2(ay + (by - ay) * i / n)]);
    ctx.fillStyle = '#0b0a09'; for (const [x, y] of pts) ctx.fillRect(x - 3, y - 3, 6, 6); ctx.fillRect(pts[n][0] - 4, pts[n][1] - 4, 8, 8);
    for (const [x, y] of pts) { ctx.fillStyle = white ? '#fff' : c[1]; ctx.fillRect(x - 1, y - 1, 2, 2); }
    const [hx, hy] = pts[n]; ctx.fillStyle = white ? '#fff' : c[1]; ctx.fillRect(hx - 2, hy - 2, 4, 4); ctx.fillStyle = white ? '#fff' : c[0]; ctx.fillRect(hx - 2, hy - 2, 2, 2); ctx.fillStyle = white ? '#fff' : c[2]; ctx.fillRect(hx, hy, 2, 2);
  }
  const COFFIN_ARM = ['#c8c2b6', '#a8a296', '#7a746c'], COFFIN_ARM_B = ['#8a847a', '#7a746c', '#5a5550'];
  function coffinSwing(e) {
    const L = (p, q, u) => ({ x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u, a: p.a + (q.a - p.a) * u });
    if (e.state === 'slam') { const k = 1 - e.t / e.tMax, hit = 0.95 / 1.05; // 바닥 경고가 끝나는 순간 = 관이 바닥에 닿는 순간
      if (k < 0.62) { const p = L(COFFIN_REST, COFFIN_UP, easeOut(k / 0.62)); p.h = Math.min(1, k / 0.22); return p; } // h: 손이 관 끝을 쥐러 가는 정도
      if (k < hit) { const u = (k - 0.62) / (hit - 0.62), w = u * u, p = L(COFFIN_UP, COFFIN_HIT, w); p.y -= Math.sin(Math.PI * w) * 10; p.h = 1; return p; } // 머리 위로 크게 넘긴다
      return { ...COFFIN_HIT, h: 1 };
    }
    if (e.state === 'recover' && e.swingRet) { const g = 1 - e.t; // 0.35초 박아 두었다가 0.45초에 걸쳐 다시 등으로
      if (g < 0.35) return { ...COFFIN_HIT, h: 1 };
      const u = Math.min(1, (g - 0.35) / 0.45), s = u * u * (3 - 2 * u), p = L(COFFIN_HIT, COFFIN_REST, s); p.y -= Math.sin(Math.PI * s) * 12; p.h = 1 - clamp((s - 0.7) / 0.3, 0, 1); return p;
    }
    return null;
  }
  // v1.31 관 운반자 팔: 찢어진 수의 소매(너덜한 끝단) → 재빛 맨살 아래팔에 감은 수의 붕대 두 줄 → 손목 쇠고랑 + 늘어진 사슬 두 마디 → 마디 굵은 손과 손가락
  const SHROUD = { h: '#8a7e6e', d: '#5a5048', D: '#3a332c', a: '#c8c2b6', A: '#a8a296', s: '#7a746c', w: '#d8d0bc', W: '#a89c84', i: '#8a8680', I: '#4a4642', j: '#2a2724' };
  const SHROUD_B = { h: '#6a6054', d: '#463e38', D: '#2c2622', a: '#9a948a', A: '#827c72', s: '#5e5a54', w: '#aaa290', W: '#827866', i: '#6a6662', I: '#3a3734', j: '#201e1c' };
  function drawShroudArm(sx, sy, hx, hy, white, back, grip, tw) {
    const C = back ? SHROUD_B : SHROUD, shade = (lit, hi, mid, lo) => lit > 0.45 ? hi : lit < -0.25 ? lo : mid;
    const dd0 = Math.hypot(hx - sx, hy - sy), L1 = grip ? Math.max(8, dd0 * 0.46) : 8, L2 = grip ? Math.max(10, dd0 * 0.58) : 10; // v1.35 관을 쥘 땐 손이 관 끝까지 닿게
    const [el, hd] = limbIK(sx, sy, hx, hy, L1, L2, 1, tw), ux = hd[0] - el[0], uy = hd[1] - el[1], ul = Math.hypot(ux, uy) || 1, fx = ux / ul, fy = uy / ul;
    const wx = hd[0] - fx * 3, wy = hd[1] - fy * 3; // 손목
    drawLimbCells([
      { seg: [sx, sy, el[0], el[1]], r0: 3.4, r1: 3.0, col: (t, lit, dd) => (t > 0.72 && (Math.round(dd * 3 + t * 9) % 2)) ? shade(lit, C.a, C.A, C.s) : shade(lit, C.h, C.d, C.D) }, // 수의 소매 · 너덜한 끝
      { seg: [el[0], el[1], wx, wy], r0: 2.4, r1: 2.2, col: (t, lit) => ((t > 0.12 && t < 0.28) || (t > 0.46 && t < 0.6)) ? (lit > 0 ? C.w : C.W) : shade(lit, C.a, C.A, C.s) }, // 맨살 + 붕대 두 줄
      { disc: [wx, wy], r: 3.2, col: (lit, dd) => dd > 0.45 ? (lit > 0.3 ? C.i : lit < -0.2 ? C.j : C.I) : C.A }, // 쇠고랑
      { disc: [hd[0], hd[1]], r: 2.6, col: (lit) => shade(lit, C.a, C.A, C.s) }, // 손등
    ], white);
    const P2 = (x, y, c) => { ctx.fillStyle = white ? '#fff' : c; ctx.fillRect(snap2(x), snap2(y), 2, 2); }, K2 = (x, y) => { ctx.fillStyle = '#0b0a09'; ctx.fillRect(snap2(x) - 2, snap2(y) - 2, 6, 6); };
    // 손가락: 쥐었을 땐 짧게 말아 쥐고, 늘어뜨렸을 땐 길게 뻗는다
    const fg = grip ? [[fx * 3 + fy * 2, fy * 3 - fx * 2], [fx * 2 + fy * 3, fy * 2 - fx * 3]] : [[fx * 4 - fy, fy * 4 + fx], [fx * 4 + fy, fy * 4 - fx]]; // v1.32 늘어뜨린 손가락은 아래로 모음
    for (const [dx, dy] of fg) K2(hd[0] + dx, hd[1] + dy);
    for (const [dx, dy] of fg) P2(hd[0] + dx, hd[1] + dy, C.A);
    // 손목 쇠고랑에서 늘어진 사슬 두 마디 (항상 아래로)
    for (const [dx, dy, c] of [[0, 4, C.I], [0, 8, C.i]]) { K2(wx + dx, wy + dy); }
    for (const [dx, dy, c] of [[0, 4, C.I], [0, 8, C.i]]) P2(wx + dx, wy + dy, c);
    if (!white) { ctx.fillStyle = C.j; ctx.fillRect(snap2(wx), snap2(wy + 6), 2, 2); }
  }
  function drawCoffin(e, ya, al, bob) { // v1.25 관은 등에 세워 쇠사슬로 묶어 멘다 · 꺼낼 땐 등 뒤 관 뚜껑이 열린다 / v1.26 휘두를 때도 관 모양은 그대로
    const white = e.flash > 0, flip = e.face < 0, mv = e.state === 'chase', by = e.y + 2 + (mv ? bob : 0) + ya, f = e.face;
    drawShadow(e.x, e.y + 1, 11);
    const sw = coffinSwing(e), front = sw && sw.a > 0.9;
    const lean = sw ? (sw.a < 0 ? 0.25 * sw.a : 0.12 * Math.min(1, sw.a / 1.9)) * f : 0; // 젖힐 땐 몸도 뒤로, 내려찍을 땐 앞으로
    const coffin = () => { if (sw) drawSprite('coffinUp', 'coffinB', 2, e.x + sw.x * f, by + sw.y, flip, { white, alpha: al, rot: sw.a * f });
      else drawSprite(e.opened ? 'coffinUpOpen' : 'coffinUp', 'coffinB', 2, e.x + COFFIN_REST.x * f, by + COFFIN_REST.y, flip, { white, alpha: al }); }; // v1.31 걸을 때 관이 들썩이지 않음
    // 팔: 평소엔 양옆으로 늘어뜨림(v1.31 걸을 때 흔들지 않음) → 휘두를 땐 두 손이 관 아래 끝(회전축)을 쥔다
    const sh = [[8, -20], [-8, -20]], hang = [[10, -8], [-10, -8]]; // v2.44 새 도트의 어깨·손 // v1.32 어깨 바로 아래로 곧게 · v1.34 좌우 반전 (뒷팔 = 앞쪽 어깨, 앞팔 = 관 쪽 어깨)
    const grip = sw ? [sw.x, sw.y + 2] : null, hb = sw ? (sw.h == null ? 1 : sw.h) : 0;
    const hand = i => { const hx = hang[i][0] + ((grip ? grip[0] + (i ? -2 : 2) : 0) - hang[i][0]) * hb, hy = hang[i][1] + ((grip ? grip[1] : 0) - hang[i][1]) * hb; return [e.x + hx * f, by + hy]; };
    const brot = (e.lean || 0) + lean, bc = Math.cos(brot), bs = Math.sin(brot), shP = i => { const x = sh[i][0] * f, y = sh[i][1]; return [e.x + x * bc - y * bs, by + x * bs + y * bc]; }; // v1.35 어깨가 몸 기울기를 따라 돈다
    const arm = i => { if (al < 0.5 || hb < 0.5) return; /* v2.44 평소 팔은 몸 도트에 그려져 있음 */ const [hx, hy] = hand(i), [sx0, sy0] = shP(i); drawShroudArm(sx0, sy0, hx, hy, white, !i, hb > 0.5, hb < 0.5 ? [e.x, by - 20] : null); }; // 늘어뜨릴 땐 팔꿈치를 몸 쪽으로
    if (!front) coffin();
    arm(0);
    { const q = nmPose(e); q.rot += lean; drawNM(e, 'nCoffin', null, e.x, e.y + 2 + ya, q, white, al); } // v2.44 새 정면 도트
    if (front) coffin();
    arm(1);
    if (e.opened && Math.random() < 0.6) G.parts.push({ x: e.x - e.face * 8 + rand(-8, 8), y: by - 30, vx: rand(-6, 6), vy: -rand(20, 40), t: 0.6, c: pick(['#ff7a30', '#cdc7ba']), g: 0, glow: true });
  }
  // ---------- 왕의 기수 (준엘리트, v1.29 전령에서 바뀜): 멀찍이 서서 왕기를 들어 올렸다 내리꽂으면 주변 적이 강해진다 (발밑 금빛 고리) — 먼저 잡아야 할 표적
  function updateHerald(e, dt, d, a, moveTo) {
    e.walk += dt * 3.5;
    if (e.state === 'blow') { if (e.t <= 0) { heraldBlow(e); e.state = 'recover'; e.t = 0.6; e.cd = rand(7, 9); } return; }
    if (e.state !== 'chase') return;
    e.face = Math.cos(a) > 0 ? 1 : -1;
    if (d < 140) moveTo(a + Math.PI, e.spd * 1.1); else if (d > 240) moveTo(a, e.spd); else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.5);
    if (Math.random() < dt * 0.4) e.strafe = -(e.strafe || 1);
    if (e.cd <= 0 && G.enemies.some(o => o !== e && !o.dead && Math.hypot(o.x - e.x, o.y - e.y) < 170)) { e.state = 'blow'; e.t = 0.9; alertMark(e, 50, true); sfx('warn', 0.8); }
  }
  function heraldBlow(e) {
    e.blowAt = time; dust(e.x + e.face * 12, e.y, 8); // v1.29 깃대를 땅에 내리꽂는다
    sfx('roar', 1.6); G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 10, t: 0.55, max: 0.55, c: '#ffd060', grow: 300 });
    for (const o of G.enemies) if (o !== e && !o.dead && o.type !== 'boss' && Math.hypot(o.x - e.x, o.y - e.y) < 170) { if (!o.rallied) { o.atkBase = o.atk; o.atk *= 1.25; o.rallied = true; } o.rallyT = 6; o.haste = 3; }
    banner2(e, '왕의 명이다!');
  }
  // v1.29 왕의 기수: 나팔 대신 키 큰 왕기(붉은 천 · 금빛 왕관 · 찢어진 술)를 세워 든다. 「왕의 명」: 깃대를 뒤로 젖혀 높이 들어 올렸다가 → 땅에 쾅 내리꽂고 깃발이 크게 펄럭인다
  const BANNER = (() => { // 깃발 천 9×12칸: r 붉은 · R 어두운 · g 금 · k 외곽선(자동)
    const m = ['RrrrrrrrR', 'RrrrrrrrR', 'RrrgrgrrR', 'RrrgggrrR', 'RrrrgrrrR', 'RrrgggrrR', 'RrrrrrrrR', 'RggggggrR', 'RrrrrrrrR', 'RrrrrrrrR', 'Rrr.rrr.R', 'R.r..r..R'];
    return m; })();
  function drawHerald(e, ya, al, bob) {
    const white = e.flash > 0, flip = e.face < 0, mv = e.state === 'chase', by = e.y + 2 + ya, f = e.face, st = e.state;
    drawShadow(e.x, e.y + 1, 9);
    const hOff = nrPoseB(nrMotion(e)), [hox, hoy] = nrHand(hOff, e); // v1.54
    // 들어 올리기 k (0→1) · 내리꽂은 뒤 펄럭임 wv (1→0)
    const k = st === 'blow' ? clamp(1 - e.t / 0.9, 0, 1) : 0, up = easeOut(k), wv = e.blowAt != null ? clamp(1 - (time - e.blowAt) / 0.9, 0, 1) : 0;
    const lift = Math.round(14 * up / 2) * 2, tilt = (-0.22 * up + (wv > 0.75 ? 0.08 : 0)) * f; // 뒤로 젖힘 → 내리꽂는 순간 살짝 앞으로
    const bx = e.x + f * NM_HAND, bY = by - 4 - lift, H = 50, ca = Math.sin(tilt), cy = Math.cos(tilt); // 깃대 밑동 · 길이
    const at = d => [bx + ca * d, bY - cy * d];
    const P2 = (x, y, c) => { ctx.fillStyle = white ? '#fff' : c; ctx.fillRect(snap2(x), snap2(y), 2, 2); };
    const K2 = (x, y) => { ctx.fillStyle = '#0b0a09'; ctx.fillRect(snap2(x) - 2, snap2(y) - 2, 6, 6); };
    const drawBanner = () => {
      // 깃대 (외곽선 → 나무 → 금 꼭지)
      for (let d = 0; d <= H; d += 2) K2(...at(d));
      for (let d = 0; d <= H; d += 2) P2(...at(d), d % 10 === 4 ? '#4a3a2a' : '#6a5038');
      const [tx, ty] = at(H + 4); for (const [dx, dy] of [[0, 0], [-2, 2], [2, 2], [0, 2], [0, -2]]) K2(tx + dx, ty + dy);
      for (const [dx, dy, c] of [[0, -2, '#f0d890'], [-2, 2, '#c8a050'], [2, 2, '#c8a050'], [0, 2, '#e0c070'], [0, 0, '#e0c070']]) P2(tx + dx, ty + dy, c);
      // 가로대 + 매달린 천 (앞쪽으로 펼침, 아랫줄일수록 크게 흔들림)
      const [cx0, cy0] = at(H - 2), amp = 1 + wv * 3 + (mv ? 0.5 : 0), cells = [];
      for (let y = 0; y < BANNER.length; y++) { const sway = Math.round(Math.sin(time * (4 + wv * 8) + y * 0.55 + e.x) * amp * (y / BANNER.length)) * 2;
        for (let x = 0; x < 9; x++) { const c = BANNER[y][x]; if (c === '.') continue; cells.push([cx0 + f * (x * 2 + 2) + sway * f, cy0 + 2 + y * 2, c]); } }
      for (const [x, y] of cells) K2(x, y);
      for (let x = -2; x <= 20; x += 2) K2(cx0 + f * x, cy0);
      for (const [x, y, c] of cells) P2(x, y, c === 'r' ? '#7a2a1e' : c === 'R' ? '#4a1c14' : '#c8a050');
      for (let x = -2; x <= 20; x += 2) P2(cx0 + f * x, cy0, x === -2 || x === 20 ? '#e0c070' : '#8a6a30');
    };
    { const q = nmPose(e); if (k > 0) { q.sy = 1 + 0.06 * up; q.rot = -0.14 * f * up; } drawNM(e, 'nHerald', null, e.x, by, q, white, al); } // v2.44 새 정면 도트
    if (al >= 0.5) { drawBanner();
    } // v2.44 손은 몸 도트에 그려져 있음
    if (k > 0.5 && Math.random() < 0.4) { const [x, y] = at(H + 4); G.parts.push({ x, y, vx: rand(-10, 10), vy: -rand(10, 30), t: 0.4, c: '#ffd060', g: 0, glow: true }); }
  }


  // ================================================================ v1.30 4장 엘리트 — 근위대장 모르드레드 · 상복의 왕비 (2장 엘리트 임시 배치를 대체)
  // 모르드레드: 재에 그을린 판금 · 왕관 볏 투구(잉걸 눈) · 찢어진 붉은 망토와 왕관 겉옷 · 잉걸 룬이 새겨진 의장 대검 + 왕관 문장 탑 방패
  //   ① 왕명 베기 2연(넓은 부채꼴 → 되돌아오는 부채꼴) ② 방패 돌진(일직선, 벽에 박히면 기절) ③ 근위의 맹세(방패를 세우면 정면 공격을 막고 즉시 방패 치기 — 뒤로 돌아가라) ④ 재의 행군(HP 55%·25%: 근위병 둘을 재에서 일으킴)
  // 상복의 왕비: 검은 상복 · 검은 베일 위 녹슨 왕관 · 재처럼 하얀 얼굴과 잉걸 눈물 · 시든 검은 꽃다발 · 떠다니며 치맛자락이 재로 흩어진다
  //   ① 흐느낌의 고리(눈물 탄막, 틈으로 빠져나가기) ② 잿빛 눈물비(플레이어 둘레 원 다섯 곳에 차례로) ③ 검은 베일(가까우면 휘감기 — 맞으면 재 구름으로 느려짐) ④ 베일 걸음(가까이 붙으면 재로 흩어졌다가 표식 자리에서 나타남 — 단계로 보여 줌) ⑤ 장례 행렬(HP 60%·30%: 재 망자 둘)
  Object.assign(PAL, {
    mordred: { k: '#0b0a09', W: '#dcd6ca', P: '#aaa49a', p: '#7e7870', q: '#56514b', Q: '#36322e', g: '#c8a050', G: '#8a6a30', y: '#f0d890', r: '#8a2e20', R: '#4e1c14', e: '#ff7a30', E: '#ffc070', m: '#2a1a14',
      hl: '#dcd6ca', s: '#aaa49a', S: '#7e7870', c: '#4e1c14', C: '#2a1a14', a: '#c8a050', A: '#8a6a30', b: '#f0d890' },
    mshield: { k: '#0b0a09', W: '#dcd6ca', P: '#aaa49a', p: '#7e7870', q: '#56514b', r: '#8a2e20', R: '#5a2016', g: '#c8a050', G: '#8a6a30', e: '#ff7a30', E: '#ffc070' },
    queen: { k: '#0b0a09', v: '#5e5466', V: '#3e3648', n: '#251f2c', x: '#9a90a4', s: '#d8d0c4', S: '#a89e92', t: '#7a7068', g: '#c8a050', G: '#8a6a30', e: '#ff7a30', E: '#ffc070', a: '#8a847a', A: '#5e5a54', w: '#ece6da' },
    qflower: { k: '#0b0a09', n: '#1e1a22', N: '#3a3040', e: '#ff7a30', E: '#ffc070', G: '#4a5038', g: '#6a6a48' },
  });
  Object.assign(MAPS, {
    mordred: ["...........y..y..y......", "..........kgkkgkkgk.....", "..........kgggGgggk.....", ".........kWWPPPPPPpk....", ".........kWPPPPPPpqk....", ".........kWPPPPPppqk....", ".........kPPkkkkkkkk....", ".........kPPkEekEekk....", ".........kPPpkkkkkqk....", ".........kPppqpqpqqk....", "...kRk...kqppppqqQk.....", "..kRrRkkkkkqqeqqkkkkk...", ".kRrRkWWPPPkkqkkWPPPPk..", ".kRrRkWPPPppkWPkPPpppqk.", ".kRrRkPPpppqkPPkkpppqqk.", ".kRRRkkqqqqkPrrrkkqqqkk.", ".kRrRk.kPPPprrgrrPqk....", ".kRrRk.kPpppprgggrpqk...", ".kRRrRkkPpppqrrgrrqqk...", ".kRrRRkkqpeppqrrrrqQk...", "..kRrRkkGgggGgyGgggGk...", "..kRRRkkqpppkrrrkpqqk...", "..kRrRRkPpqqkrRrkpqQk...", "...kRRkkPpqk.krRk.kqQk..", "...kRk.kPeqk.kRk..kqQk..", "...kk..kPPqk..k..kPPqk..", "......kWPpqk.....kWPpqk.", "......kPPPpqk...kPPPPqk.", "......kkkkkkk...kkkkkkk."],
    queen: ["...........kgkgkgk......", "..........kgGgGgGk......", "..........knnnnnnk......", ".........kxVVVVVVnk.....", "........kxVVvvvvVVnk....", "......kVkxVvkkkkvVVk....", "......kVkxvkwsssSkvVk...", "......kVkxvksekeSkvVk...", "......kxkxvkSESESkvVk...", ".....kvVkxvVkssSkvVVk...", ".....kvVkxVvkkSkkvVnk...", "....kxVkxVVvVkkkvVVVnk..", "....kvxkxvvVgGgGgvVVnk..", "...kVvVkxvVnnVvVnnVvVk..", "...kxvVkxvVnVvvvVnVvVk..", "..kVxVkxvvVnVvvvVnVvVnk.", "..kVvxkxvVVnVGgGVnVVvnk.", "..kVvVkxVvVnnVvVnnVvVnk.", "kvxvVkxvnVvnVVnvVnVvnVk.", "kvVxVkxvnVvnVVnvVnVvnVk.", "kvVvxkxvnVvnVVnvVnVvnVVk", ".kVvVkxvnVvnVVnvVnVvnVVk", ".kxvVkxvnVvnVVnvVnVvnVVk", "..kxVkxvnVvnVVnvVnVvnVnk", ".....kxvnVvnVVnvVnVvnVnk", ".....kxVxVxVxVxVxVxVxVxk", "......kakkAkkakkAkkakAk.", ".......a..A..a..A..a.A.."], // v1.30 등 뒤로 흘러내린 베일 자락 (왼쪽 5칸)
    mshield: ['..kkkkkk..', '.kWPPPPpk.', 'kWPrrrrpqk', 'kPrrgrgrqk', 'kPrrgggrqk', 'kPrrrgrrqk', 'kPrgggggqk', 'kPrrrrrrqk', 'kPrRrrerqk', 'kPrrRreeqk', 'kPrrrRrrqk', '.kPrrrRqk.', '.kPrrrrqk.', '..kPrrqk..', '...kPqk...', '....kk....'],
    mshieldS: ['.kkk.', 'kWPpk', 'kPrqk', 'kPgqk', 'kPrqk', 'kPgqk', 'kPrqk', 'kPrqk', 'kPeqk', 'kPrqk', 'kPrqk', 'kPrqk', '.kPk.', '.kpk.', '..k..'], // 옆으로 든 방패 (평소)
    qflower: ['.k.kk.k.', 'kNkNNkNk', 'kNnkeNnk', '.knNnEk.', '..kGgk..', '...kGk..', '...kgk..', '....k...'],
  });
  BLADES.royal = cellBlade({ len: 56, wide: 9, grip: 11, tip: 9, handle: '#3a2418', gold: '#c8a050', mid: '#8a8680', edge: '#d8d4cc', dark: '#4a4642', rune: '#ff7a30' });
  ELITE_NAMES.mordred = '근위대장'; ELITE_NAMES.queen = '상복의 왕비'; ELITE_TOP.mordred = 70; ELITE_TOP.queen = 74;

  // v1.31 엘리트 팔: 어깨-팔꿈치-손 두 마디를 2px 칸 격자로 채운다 (왼쪽 위 빛 · 검은 외곽선). 마디마다 복식에 맞는 색 함수
  const LIMB_L = [-0.6, -0.8];
  function limbIK(sx, sy, hx, hy, L1, L2, down, tw) { // 팔꿈치 위치 (두 마디 길이로 굽힘, 아래쪽으로 — tw가 있으면 그 점 쪽으로)
    let dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy) || 1; if (d > L1 + L2 - 0.5) { const k = (L1 + L2 - 0.5) / d; hx = sx + dx * k; hy = sy + dy * k; dx = hx - sx; dy = hy - sy; d = L1 + L2 - 0.5; }
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a)), px = sx + dx * a / d, py = sy + dy * a / d, nx = -dy / d, ny = dx / d;
    const e1 = [px + nx * h, py + ny * h], e2 = [px - nx * h, py - ny * h]; if (tw) return [Math.hypot(e1[0] - tw[0], e1[1] - tw[1]) < Math.hypot(e2[0] - tw[0], e2[1] - tw[1]) ? e1 : e2, [hx, hy]];
    return [(down > 0 ? e1[1] > e2[1] : e1[1] < e2[1]) ? e1 : e2, [hx, hy]];
  }
  function drawLimbCells(parts, white) { // parts: {seg:[ax,ay,bx,by], r0, r1, col(t, lit)} | {disc:[x,y], r, col(lit)}
    const grid = new Map(), K = (x, y) => x + ',' + y;
    for (const p of parts) {
      if (p.seg) { const [ax, ay, bx, by] = p.seg, vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1, R = Math.max(p.r0, p.r1) + 1;
        for (let cy = Math.floor((Math.min(ay, by) - R) / 2); cy <= Math.floor((Math.max(ay, by) + R) / 2); cy++) for (let cx = Math.floor((Math.min(ax, bx) - R) / 2); cx <= Math.floor((Math.max(ax, bx) + R) / 2); cx++) {
          const x = cx * 2 + 1, y = cy * 2 + 1, t = clamp(((x - ax) * vx + (y - ay) * vy) / l2, 0, 1), ox = x - ax - vx * t, oy = y - ay - vy * t, dd = Math.hypot(ox, oy), r = p.r0 + (p.r1 - p.r0) * t;
          if (dd <= r) grid.set(K(cx, cy), p.col(t, dd < 0.5 ? 0 : (ox * LIMB_L[0] + oy * LIMB_L[1]) / Math.max(1, r), dd / Math.max(1, r))); } }
      else { const [x0, y0] = p.disc; for (let cy = Math.floor((y0 - p.r) / 2); cy <= Math.floor((y0 + p.r) / 2); cy++) for (let cx = Math.floor((x0 - p.r) / 2); cx <= Math.floor((x0 + p.r) / 2); cx++) {
          const x = cx * 2 + 1, y = cy * 2 + 1, ox = x - x0, oy = y - y0, dd = Math.hypot(ox, oy); if (dd <= p.r) grid.set(K(cx, cy), p.col((ox * LIMB_L[0] + oy * LIMB_L[1]) / Math.max(1, p.r), dd / Math.max(1, p.r))); } }
    }
    ctx.fillStyle = '#0b0a09';
    for (const k of grid.keys()) { const [cx, cy] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!grid.has(K(cx + dx, cy + dy))) ctx.fillRect((cx + dx) * 2, (cy + dy) * 2, 2, 2); }
    for (const [k, c] of grid) { const [cx, cy] = k.split(',').map(Number); ctx.fillStyle = white ? '#fff' : c; ctx.fillRect(cx * 2, cy * 2, 2, 2); }
  }
  // 모르드레드 판금 팔: 위팔 갑옷(판 이음 줄) → 팔꿈치 덮개(둥근 판 + 금 징) → 아래팔 갑옷 → 금 테 두른 건틀릿
  const PLATE = { W: '#dcd6ca', P: '#aaa49a', p: '#7e7870', q: '#56514b', Q: '#36322e', g: '#c8a050', G: '#8a6a30', e: '#ff7a30' }, PLATE_B = { W: '#9a948a', P: '#7e7870', p: '#5e5952', q: '#45413c', Q: '#2c2926', g: '#8a6a30', G: '#5a4420', e: '#c85a20' };
  function drawPlateArm(sx, sy, hx, hy, white, back) {
    const C = back ? PLATE_B : PLATE, shade = (lit, hi, mid, lo) => lit > 0.45 ? hi : lit < -0.25 ? lo : mid;
    const [el, hd] = limbIK(sx, sy, hx, hy, 10, 10, 1), ux = hd[0] - el[0], uy = hd[1] - el[1], ul = Math.hypot(ux, uy) || 1;
    drawLimbCells([
      { seg: [sx, sy, el[0], el[1]], r0: 3.4, r1: 2.8, col: (t, lit) => (t > 0.38 && t < 0.52) ? C.Q : shade(lit, C.W, C.P, C.q) }, // 위팔: 겹친 판 이음
      { seg: [el[0], el[1], hd[0] - ux / ul * 3, hd[1] - uy / ul * 3], r0: 3.0, r1: 3.2, col: (t, lit) => t > 0.78 ? (lit > 0.2 ? C.g : C.G) : (t > 0.3 && t < 0.4) ? C.q : shade(lit, C.P, C.p, C.Q) }, // 아래팔 + 손목 금 테
      { disc: [el[0], el[1]], r: 4.4, col: (lit, dd) => dd < 0.3 ? C.g : dd > 0.78 ? (lit > -0.1 ? C.g : C.G) : shade(lit, C.W, C.P, C.q) }, // 팔꿈치 덮개: 금 테 + 가운데 금 징
      { disc: [hd[0], hd[1]], r: 4.0, col: (lit, dd) => dd > 0.7 && lit < 0 ? C.Q : shade(lit, C.P, C.q, C.Q) }, // 건틀릿 주먹 (어둡게)
    ], white);
    if (!white) { ctx.fillStyle = C.Q; const kx = snap2(hd[0] + ux / ul * 2), ky = snap2(hd[1] + uy / ul * 2); ctx.fillRect(kx, ky, 2, 2); } // 손가락 마디 줄
    return hd;
  }
  // 왕비 상복 소매: 어깨 주름(레이스) → 몸에 붙는 윗소매 → 아래로 갈수록 종 모양으로 퍼지는 소매 끝(안쪽 어둠 · 레이스 끝단) → 하얀 손과 가는 손가락
  const SLEEVE = { x: '#c8bcd0', v: '#7a6e86', V: '#4e4458', n: '#2c2534', i: '#120f16', s: '#e0d8cc', S: '#a89e92', w: '#f4eee4' };
  function drawMourningArm(sx, sy, hx, hy, white, back) {
    const C = SLEEVE, dim = back ? 0.75 : 1, shade = (lit, hi, mid, lo) => lit > 0.45 ? hi : lit < -0.25 ? lo : mid;
    const [el, hd] = limbIK(sx, sy, hx, hy, 9, 11, 1), ux = hd[0] - el[0], uy = hd[1] - el[1], ul = Math.hypot(ux, uy) || 1, cx = hd[0] - ux / ul * 4, cy = hd[1] - uy / ul * 4;
    const lace = t => t > 0.8;
    drawLimbCells([
      { seg: [sx, sy, el[0], el[1]], r0: 2.6, r1: 2.4, col: (t, lit) => shade(lit, back ? C.V : C.v, C.V, C.n) },
      { seg: [el[0], el[1], cx, cy], r0: 2.4, r1: 6.4, col: (t, lit, dd) => lace(t) ? (dd > 0.45 || lit > 0.2 ? C.x : C.i) : (t > 0.6 && lit < -0.2) ? C.i : (t > 0.3 && dd > 0.8 && lit > 0) ? C.x : shade(lit, back ? C.V : C.v, C.V, C.n) }, // 종 모양 소매: 밝은 레이스 끝단 · 안쪽 어둠 · 소매 가장자리 빛
      { disc: [sx, sy], r: 3.4, col: (lit, dd) => dd > 0.6 && lit > -0.2 ? C.x : C.V }, // 어깨 주름
    ], white);
    // 손: 소매 끝에서 나온 하얀 손 + 두 손가락
    const fx = ux / ul, fy = uy / ul, P2 = (x, y, c) => { ctx.fillStyle = white ? '#fff' : c; ctx.fillRect(snap2(x), snap2(y), 2, 2); }, K2 = (x, y) => { ctx.fillStyle = '#0b0a09'; ctx.fillRect(snap2(x) - 2, snap2(y) - 2, 6, 6); };
    const pts = [[cx + fx * 2, cy + fy * 2], [cx + fx * 4, cy + fy * 4], [cx + fx * 6 - fy * 2, cy + fy * 6 + fx * 2], [cx + fx * 6 + fy * 1, cy + fy * 6 - fx * 1]];
    for (const [x, y] of pts) K2(x, y);
    P2(...pts[0], C.S); P2(...pts[1], C.s); P2(...pts[2], C.w); P2(...pts[3], C.s);
    return hd;
  }
  // ---------- 근위대장 모르드레드
  function mordredTick(e, dt) {
    if (e.state === 'chase') { e.vuln = 1; e.shieldUp = 0; }
    e.rage = e.hp < e.maxHp * 0.5;
    if (e.state === 'dash') { // 방패 돌진
      const P = G.player, sp = 430; e.x += Math.cos(e.lockAng) * sp * dt; e.y += Math.sin(e.lockAng) * sp * dt; e.t -= dt;
      if (Math.random() < 0.7) G.parts.push({ x: e.x - Math.cos(e.lockAng) * 14 + rand(-6, 6), y: e.y + rand(-2, 2), vx: -Math.cos(e.lockAng) * rand(20, 50), vy: -rand(5, 20), t: rand(0.3, 0.6), c: pick(['#86807a', '#5e5a54', '#aaa498']), g: 0 });
      if (!e.hitPlayer && !P.dead && dist(e, P) < e.r + P.r + 8) { e.hitPlayer = true; const hp0 = P.hp; hurtPlayer(e.atk * 1.2, e); if (P.hp < hp0) { P.kx = Math.cos(e.lockAng) * 380; P.ky = Math.sin(e.lockAng) * 380; } sfx('blast', 0.8); sparks(P.x, P.y - 12, e.lockAng, '#ffd060', 6); }
      const bonk = dashBlocked(e) || e.x < A.x0 + e.r + 1 || e.x > A.x1 - e.r - 1 || e.y < A.y0 + e.r + 1 || e.y > A.y1 - e.r - 1;
      if (bonk) { solveObs(e, e.r); e.x = clamp(e.x, A.x0 + e.r + 1, A.x1 - e.r - 1); e.y = clamp(e.y, A.y0 + e.r + 1, A.y1 - e.r - 1); e.state = 'recover'; e.t = 1.4; e.vuln = 1.4; e.cd = rand(0.6, 1.0); e.shieldUp = 0; addShake(5, e.lockAng); debris(e.x + Math.cos(e.lockAng) * 16, e.y, 14); sfx('blast'); sfx('block', 0.7);
        G.nums.push({ x: e.x, y: e.y - 76, v: '방패가 박혔다!', t: 0.9, c: '#ffd34d', s: 1, txt: true }); return; }
      if (e.t <= 0) { e.state = 'recover'; e.t = 0.75; e.cd = rand(0.9, 1.4); e.shieldUp = 0; dust(e.x, e.y, 8); }
    }
    if (e.state === 'guard') { e.t -= dt; e.bladeTarget = e.face > 0 ? -18 * DEG : -162 * DEG; // 방패 위로 칼끝을 겨눈다
      if (Math.random() < dt * 10) G.parts.push({ x: e.x + e.face * rand(14, 22), y: e.y - rand(8, 40), vx: 0, vy: -rand(10, 25), t: 0.4, c: pick(['#ffd060', '#c8a050']), g: 0, glow: true });
      if (e.t <= 0 && !e.counterT) { e.state = 'recover'; e.t = 0.35; e.cd = rand(0.8, 1.2); e.shieldUp = 0; } }
  }
  const mordredFrontHit = (e, ax) => e.type === 'mordred' && e.state === 'guard' && Math.sign(ax - e.x) === e.face;
  function mordredCounter(e) { // 근위의 맹세: 정면을 맞으면 곧바로 방패 치기 (짧은 경고)
    if (e.counterT) return; e.counterT = true; const a = angTo(e, G.player); e.face = Math.cos(a) > 0 ? 1 : -1; sfx('warn', 1.2); banner2(e, '어림없다!');
    G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: a, r: 74, arc: 120 * DEG, t: 0, dur: 0.38, owner: e, onFire: tt => { if (e.dead) return; e.counterT = false;
      const P = G.player, hp0 = P.hp; hitShape(tt, e.atk * 1.1); if (P.hp < hp0) { P.kx = Math.cos(tt.ang) * 420; P.ky = Math.sin(tt.ang) * 420; }
      e.bash = 0.2; sfx('blast', 0.7); sfx('block'); eAtkFx(e.x + Math.cos(tt.ang) * 30, e.y + Math.sin(tt.ang) * 20, 0.8, '#ffd060'); e.state = 'recover'; e.t = 0.6; e.cd = rand(0.6, 1.0); e.shieldUp = 0; } });
  }
  function updateMordred(e, dt, d, a, moveTo) {
    if (e.state !== 'chase') return;
    const P = G.player, rs = e.rage ? 0.8 : 1;
    if (d > 72) moveTo(a, e.spd * (e.rage ? 1.15 : 1) * (d > 220 ? 1.3 : 1));
    e.face = Math.cos(a) > 0 ? 1 : -1;
    if (e.cd > 0) return;
    let pat = null;
    if (!e.call1 && e.hp < e.maxHp * 0.55 || !e.call2 && e.hp < e.maxHp * 0.25) pat = 'muster';
    else pat = d < 105 ? wpick2([['cleave', 4], ['guard', 1.6]]) : d < 230 ? wpick2([['charge', 3], ['cleave', 1], ['guard', 1]]) : d < 380 ? 'charge' : null;
    if (!pat) return;
    if (pat === e.lastPat && pat !== 'cleave') pat = d < 105 ? 'cleave' : 'charge';
    e.lastPat = pat; const side = e.face;
    if (pat === 'cleave') { // 왕명 베기 2연: 대검을 등 뒤로 크게 젖혔다가 넓게 → 곧바로 되돌아오며 한 번 더
      e.state = 'wind'; e.bladeTarget = a - side * 150 * DEG; e.lean = -0.2 * side; alertMark(e, 70, true); sfx('warn');
      G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: a, r: 96, arc: 150 * DEG, t: 0, dur: 0.78 * rs, owner: e, onFire: tt => { if (e.dead) return;
        slamBlade(e, tt.ang + side * 75 * DEG, side, 0.08); e.lean = 0.25 * side; hitShape(tt, e.atk * 1.1); sfx('whoosh'); sfx('heavy', 0.9); eAtkFx(e.x + Math.cos(tt.ang) * 56, e.y + Math.sin(tt.ang) * 42, 0.9);
        const q = angTo(e, G.player);
        G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: q, r: 84, arc: 130 * DEG, t: 0, dur: 0.42 * rs, owner: e, onFire: t2 => { if (e.dead) return;
          startSwing(e, t2.ang - side * 70 * DEG, -side, 0.1); e.lean = -0.15 * side; hitShape(t2, e.atk); sfx('whoosh'); sfx('heavy', 0.7); eAtkFx(e.x + Math.cos(t2.ang) * 50, e.y + Math.sin(t2.ang) * 38, 0.7);
          e.state = 'recover'; e.t = 0.85; e.cd = rand(0.9, 1.4); } }); } });
    } else if (pat === 'charge') { // 방패 돌진: 방패를 앞세우고 몸을 낮춘 뒤 일직선으로
      e.state = 'wind'; e.shieldUp = 1; e.lockAng = a; e.lean = 0.12 * side; e.bladeTarget = side > 0 ? -150 * DEG : -30 * DEG; alertMark(e, 70, true); sfx('warn');
      G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 240, w: 34, t: 0, dur: 0.8 * rs, owner: e, onFire: () => { if (e.dead) return; e.state = 'dash'; e.t = 0.56; e.hitPlayer = false; sfx('whoosh'); sfx('roar', 0.7); } });
    } else if (pat === 'guard') { // 근위의 맹세: 방패를 세우고 버틴다 — 정면 공격은 막고 반격, 등 뒤가 빈다
      e.state = 'guard'; e.t = 1.7; e.shieldUp = 1; e.counterT = false; sfx('block', 0.8); banner2(e, '방패를 세운다');
    } else { // 재의 행군: 대검을 높이 치켜들면 양옆 재에서 근위병이 일어난다
      if (e.hp < e.maxHp * 0.55) e.call1 = true; if (e.hp < e.maxHp * 0.25) e.call2 = true;
      e.state = 'wind'; e.bladeTarget = -90 * DEG; e.lean = 0; alertMark(e, 70, true); sfx('roar', 0.9); banner2(e, '근위대, 집결!');
      const n = G.enemies.filter(o => !o.dead && o.type === 'aguard').length >= 3 ? 1 : 2;
      for (let i = 0; i < n; i++) { const pt = { x: clamp(e.x + (i ? 1 : -1) * rand(50, 80), A.x0 + 20, A.x1 - 20), y: clamp(e.y + rand(-30, 30), A.y0 + 20, A.y1 - 20) };
        G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: 12, t: 0, dur: 1.0 + i * 0.12, owner: e, onFire: () => { const g = makeEnemy('aguard', pt.x, pt.y); g.rise = 0.5; G.enemies.push(g); dust(pt.x, pt.y, 10); } }); }
      G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 18, t: 0, dur: 1.0, owner: e, onFire: () => { if (e.dead) return; e.state = 'recover'; e.t = 0.4; e.cd = rand(0.8, 1.2); } });
    }
  }
  function drawMordred(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0, f = e.face, st = e.state, bob = st === 'chase' ? Math.sin(e.walk) * 0.8 : 0;
    const guard = st === 'guard', low = guard ? 4 : (st === 'wind' && e.shieldUp) ? 2 : 0, by = e.y + 2 + ya + low, shY = by - 18; // v2.44 새 도트
    const fx = e.x + f * 8, bx = e.x - f * NM_HAND;
    const bl = BLADES.royal, held = !e.sw && Math.sin(e.bladeAng) < -0.35, hx = held ? e.x + f * NM_HAND : fx + Math.cos(e.bladeAng) * 9, hy = held ? by - 7 : shY + Math.sin(e.bladeAng) * 9, behind = !e.sw && Math.cos(e.bladeAng) * f < -0.2; // 칼이 위를 향하면 손은 가슴 앞, 칼등은 어깨에
    const fore = e.shieldUp || guard || st === 'dash';
    drawShadow(e.x, e.y + 2, 12);
    if (!fore) drawSprite('mshieldS', 'mshield', 2, bx, by - 2, flip, { white, alpha: al }); // 뒷손에 쥔 방패
    if (behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
    enemyTrail(e, e.trail, hx, hy, 14, bl.reach, '255,170,90', true);
    { const q = nmPose(e); if (guard) q.sy *= 0.94; if (e.sw) { q.dx = 3 * f; q.sx = 1.08; q.sy = 0.94; q.rot = 0.18 * f; } drawNM(e, 'nMordred', null, e.x, by, q, white, al); } // v2.44 새 정면 도트 (팔은 몸 도트에)
    if (!behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
    if (fore) { const bash = e.bash > 0 ? 8 : 0; e.bash = Math.max(0, (e.bash || 0) - 1 / 60);
      drawSprite('mshield', 'mshield', 2, e.x + f * (12 + bash), by - (guard ? 0 : 2), flip, { white, alpha: al });
      if (guard && !white) { const k = 0.5 + 0.5 * Math.sin(time * 12); ctx.fillStyle = `rgba(255,210,100,${0.25 + 0.25 * k})`; for (let y = 0; y < 30; y += 2) ctx.fillRect(snap2(e.x + f * (12 + 11)) - (f > 0 ? 0 : 2), snap2(by - 32 + y), 2, 2); } }
    if (al > 0.5 && Math.random() < 0.05) G.parts.push({ x: e.x + f * 4, y: by - 26, vx: rand(-4, 4), vy: -rand(10, 20), t: 0.6, c: '#ff7a30', g: 0, glow: true }); // 투구 틈 불티
  }

  // ---------- 상복의 왕비
  const QUEEN_ARM = ['#9a90a4', '#5e5466', '#3e3648'];
  function queenTick(e, dt) {
    e.hover = Math.sin(time * 2.2 + e.x * 0.01) * 3;
    if (e.state === 'chase') e.vuln = 1;
    const P = G.player, d = dist(e, P);
    e.closeT = d < 80 ? (e.closeT || 0) + dt : Math.max(0, (e.closeT || 0) - dt * 2);
    if (e.drops) { for (const q of e.drops) q.t += dt; e.drops = e.drops.filter(q => q.t < q.dur + 0.05); }
    if (e.blink) { const b = e.blink; b.t += dt; // 베일 걸음: 흩어짐 0.45 → 사라짐 0.3 → 나타남 0.3
      if (b.t < 0.45) e.fadeA = 1 - b.t / 0.45; else if (b.t < 0.75) { e.fadeA = 0; if (!b.moved) { b.moved = true; e.x = b.x; e.y = b.y; } } else e.fadeA = Math.min(1, (b.t - 0.75) / 0.3);
      if (Math.random() < 0.8) G.parts.push({ x: e.x + rand(-10, 10), y: e.y - rand(4, 44), vx: rand(-20, 20), vy: -rand(10, 40), t: rand(0.4, 0.8), c: pick(['#3e3842', '#5e5662', '#8a847a']), g: 0 });
      if (b.t >= 1.05) { e.blink = null; e.fadeA = 1; e.state = 'chase'; e.cd = 0.25; e.forceWail = true; } }
  }
  function queenDest(e) { const P = G.player; let best = null;
    for (let i = 0; i < 12; i++) { const a = rand(0, TAU), r = rand(160, 220), x = clamp(P.x + Math.cos(a) * r, A.x0 + 40, A.x1 - 40), y = clamp(P.y + Math.sin(a) * r * 0.8, A.y0 + 40, A.y1 - 40), sc = Math.hypot(x - P.x, y - P.y) + Math.hypot(x - e.x, y - e.y) * 0.3;
      if (!best || sc > best.sc) best = { x, y, sc }; }
    return best; }
  function updateQueen(e, dt, d, a, moveTo) {
    if (e.state !== 'chase') return;
    const P = G.player, rs = e.hp < e.maxHp * 0.5 ? 0.85 : 1;
    if (d < 130) moveTo(a + Math.PI, e.spd); else if (d > 250) moveTo(a, e.spd); else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.6);
    if (Math.random() < dt * 0.35) e.strafe = -(e.strafe || 1);
    e.face = Math.cos(a) > 0 ? 1 : -1;
    if (e.closeT > 1.0 && !e.blink && e.cd < 0.6) { // 베일 걸음
      const dst = queenDest(e); e.state = 'blink'; e.blink = { t: 0, x: dst.x, y: dst.y }; e.closeT = 0; sfx('whoosh', 0.7);
      G.tele.push({ shape: 'spawn', x: dst.x, y: dst.y, r: 18, t: 0, dur: 1.05, owner: e }); return; }
    if (e.cd > 0) return;
    let pat = null;
    if (!e.call1 && e.hp < e.maxHp * 0.6 || !e.call2 && e.hp < e.maxHp * 0.3) pat = 'procession';
    else if (e.forceWail) pat = 'wail';
    else pat = d < 95 ? wpick2([['lash', 4], ['wail', 1]]) : wpick2([['wail', 3], ['rain', 3]]);
    e.forceWail = false;
    if (pat === e.lastPat && pat !== 'lash') pat = pat === 'wail' ? 'rain' : 'wail';
    e.lastPat = pat;
    if (pat === 'wail') { // 흐느낌의 고리: 얼굴을 감싸 쥐고 흐느끼다 → 잉걸 눈물이 고리로 퍼진다 (틈 두 곳)
      e.state = 'wind'; e.pose = 'weep'; alertMark(e, 74, true); sfx('warn', 0.8);
      G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 34, t: 0, dur: 0.95 * rs, owner: e, onFire: () => { if (e.dead) return; e.pose = 'spread'; sfx('roar', 1.8);
        const rings = e.hp < e.maxHp * 0.5 ? 2 : 1, n = 18;
        for (let ring = 0; ring < rings; ring++) { const gap = randi(0, n - 1), gap2 = (gap + randi(6, 11)) % n;
          for (let k = 0; k < n; k++) { if (k === gap || k === (gap + 1) % n || k === gap2) continue; const aa = (k + ring * 0.5) / n * TAU;
            G.eproj.push({ x: e.x + Math.cos(aa) * 14, y: e.y + Math.sin(aa) * 10, ang: aa, sp: 115 - ring * 30, r: 5, dmg: e.atk * 0.6, t: 3.0, hist: [], kind: 'tear' }); } }
        e.state = 'recover'; e.t = 0.8; e.cd = rand(1.2, 1.7); } });
    } else if (pat === 'rain') { // 잿빛 눈물비: 두 팔을 들어 올리면 플레이어 둘레 다섯 곳에 차례로 잉걸 눈물이 떨어진다
      e.state = 'wind'; e.pose = 'raise'; alertMark(e, 74, true); sfx('warn', 0.8); e.drops = e.drops || [];
      const pts = [{ x: P.x, y: P.y }]; for (let i = 0; i < 4; i++) { const aa = rand(0, TAU), r = rand(40, 95); pts.push({ x: clamp(P.x + Math.cos(aa) * r, A.x0 + 16, A.x1 - 16), y: clamp(P.y + Math.sin(aa) * r * 0.75, A.y0 + 16, A.y1 - 16) }); }
      pts.forEach((pt, i) => { const dur = (0.95 + i * 0.2) * rs; e.drops.push({ x: pt.x, y: pt.y, t: 0, dur });
        G.tele.push({ shape: 'circle', x: pt.x, y: pt.y, r: 28, t: 0, dur, owner: e, onFire: tt => { if (e.dead) return; hitShape(tt, e.atk * 0.9); sfx('fireball', 0.7);
          for (let j = 0; j < 10; j++) G.parts.push({ x: tt.x + rand(-6, 6), y: tt.y - rand(0, 6), vx: rand(-60, 60), vy: -rand(30, 90), t: rand(0.3, 0.6), c: pick(['#ff7a30', '#ffc070', '#8a3418']), g: 260, glow: true, floor: tt.y + 2 });
          G.fx.push({ kind: 'ring', x: tt.x, y: tt.y, r: 6, t: 0.3, max: 0.3, c: '#ff9a50', grow: 120 }); if (i === pts.length - 1) { e.state = 'recover'; e.t = 0.5; e.cd = rand(1.0, 1.5); e.pose = null; } } }); });
    } else if (pat === 'lash') { // 검은 베일: 소매를 앞으로 휘둘러 베일로 휘감는다 — 맞으면 발밑에 재 구름(느려짐)
      e.state = 'wind'; e.pose = 'reach'; alertMark(e, 74); sfx('warn', 0.9);
      G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: a, r: 88, arc: 110 * DEG, t: 0, dur: 0.62 * rs, owner: e, onFire: tt => { if (e.dead) return; e.pose = 'lash'; e.lashAng = tt.ang; e.lashT = time;
        const P2 = G.player; if (inShape(tt, P2.x, P2.y, P2.r)) { hurtPlayer(e.atk, e); (G.ashClouds = G.ashClouds || []).push({ x: P2.x, y: P2.y, r: 34, t: 1.6, max: 1.6 }); }
        sfx('whoosh', 0.8); G.fx.push({ kind: 'arcwave', x: e.x, y: e.y - 24, ang: tt.ang, arc: 110 * DEG, r0: 20, r1: 86, t: 0.25, max: 0.25, c: '120,105,125' });
        e.state = 'recover'; e.t = 0.7; e.cd = rand(0.9, 1.3); } });
    } else { // 장례 행렬: 꽃다발을 내려놓으면 재 망자 둘이 조문하러 일어난다
      if (e.hp < e.maxHp * 0.6) e.call1 = true; if (e.hp < e.maxHp * 0.3) e.call2 = true;
      e.state = 'wind'; e.pose = 'weep'; alertMark(e, 74, true); banner2(e, '조문하라…'); sfx('roar', 1.5);
      for (let i = 0; i < 2; i++) { const pt = { x: clamp(e.x + (i ? 1 : -1) * rand(40, 70), A.x0 + 20, A.x1 - 20), y: clamp(e.y + rand(-20, 30), A.y0 + 20, A.y1 - 20) };
        G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: 10, t: 0, dur: 0.9 + i * 0.15, owner: e, onFire: () => { const g = makeEnemy('husk', pt.x, pt.y); g.rise = 0.5; G.enemies.push(g); dust(pt.x, pt.y, 8); } }); }
      G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 16, t: 0, dur: 1.05, owner: e, onFire: () => { if (e.dead) return; e.state = 'recover'; e.t = 0.4; e.cd = rand(0.8, 1.2); e.pose = null; } });
    }
  }
  function drawQueen(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0, f = e.face, fa = e.fadeA == null ? 1 : e.fadeA, A2 = al; // al에 fadeA가 이미 들어 있음
    const by = e.y - 6 + ya - (e.hover || 0);
    // 떨어지는 잉걸 눈물 (눈물비): 마지막 0.35초에 하늘에서 떨어진다
    if (e.drops) for (const q of e.drops) { const k = (q.t - (q.dur - 0.35)) / 0.35; if (k < 0 || k > 1) continue; const y = q.y - 150 * (1 - k * k);
      ctx.fillStyle = '#0b0a09'; ctx.fillRect(snap2(q.x) - 4, snap2(y) - 8, 8, 12); ctx.fillStyle = '#ff7a30'; ctx.fillRect(snap2(q.x) - 2, snap2(y) - 4, 4, 6); ctx.fillStyle = '#ffc070'; ctx.fillRect(snap2(q.x) - 2, snap2(y) - 6, 2, 4);
      ctx.fillStyle = 'rgba(255,140,60,.5)'; for (let j = 4; j < 20; j += 4) ctx.fillRect(snap2(q.x), snap2(y) - 6 - j, 2, 2); }
    if (A2 < 0.05) return;
    dshEll(ctx, e.x, e.y + 1, 14, 4, 0.5 * fa);
    // v1.33 팔 없이 몸 전체의 움직임으로 공격을 보여 준다 (기울이기·늘이기는 칸 단위). k = 준비 진행도(바닥 경고), u = 공격 뒤 시간
    const pose = e.state === 'wind' || e.state === 'recover' ? e.pose : null, k = clamp(e.glow || 0, 0, 1), ez = k * k * (3 - 2 * k);
    let dx = 0, dy = 0, rot = 0, sx = 1, sy = 1;
    if (pose === 'weep') { dy = 4 * ez; rot = 0.14 * f * ez; sy = 1 - 0.06 * ez; if (k > 0.35) dx = (Math.floor(time * 10) % 2 ? 2 : 0) * f; } // 흐느낌: 고개를 떨구고 웅크리며 어깨가 들썩인다
    else if (pose === 'raise') { dy = -12 * ez; sy = 1 + 0.08 * ez; } // 눈물비: 하늘로 떠오르며 길게 늘어난다
    else if (pose === 'spread') { const u = clamp((0.8 - e.t) / 0.3, 0, 1); sx = 1.14 - 0.14 * u; sy = 0.92 + 0.08 * u; dy = -4 * (1 - u); } // 고리를 터뜨리는 순간: 옆으로 확 퍼졌다가 돌아온다
    else if (pose === 'reach') { rot = -0.16 * f * ez; dx = -6 * f * ez; dy = -3 * ez; } // 베일 준비: 뒤로 젖히며 물러선다
    else if (pose === 'lash') { const u = clamp((0.7 - e.t) / 0.35, 0, 1), w = 1 - u; rot = 0.22 * f * w; dx = 10 * f * w; sx = 1 + 0.1 * w; } // 베일 휘감기: 앞으로 확 쏠리며 덮친다
    if (e.grogiT > 0) rot = 0.2 * f;
    ctx.save(); ctx.globalAlpha = A2;
    { const q = nmPose(e); if (pose) Object.assign(q, { dx, rot, sx, sy, wf: -1 }); else q.dx += dx; drawNM(e, 'nQueen', null, e.x, by + dy, q, white, 1); } // v2.44 새 정면 도트 (떠다님)
    // v2.44 새 도트는 팔이 없어 꽃다발은 그리지 않음
    ctx.restore();
    if (pose === 'lash' && e.t > 0.45 && al > 0.5) for (let i = 0; i < 3; i++) G.parts.push({ x: e.x + f * rand(10, 40), y: by - rand(14, 40), vx: f * rand(40, 90), vy: rand(-10, 10), t: rand(0.2, 0.35), c: pick(['#3e3648', '#5e5466', '#9a90a4']), g: 0 }); // 휘감기는 베일 자락
    if (pose === 'raise' && k > 0.3 && Math.random() < 0.5) G.parts.push({ x: e.x + rand(-14, 14), y: by + dy - rand(0, 10), vx: 0, vy: -rand(30, 60), t: 0.5, c: pick(['#ff7a30', '#ffc070']), g: 0, glow: true });
    if (fa > 0.5 && al > 0.5) { // 잉걸 눈물 · 치맛자락 재
      if (Math.random() < (pose === 'weep' ? 0.6 : 0.08)) G.parts.push({ x: e.x + f * rand(-2, 3) + (pose === 'weep' ? 2 * f : 0), y: by - 20 + (pose === 'weep' ? 4 : 0), vx: 0, vy: rand(10, 24), t: 0.5, c: pick(['#ff7a30', '#ffc070']), g: 40, glow: true });
      if (Math.random() < 0.35) G.parts.push({ x: e.x + rand(-16, 16), y: by - rand(0, 4), vx: rand(-8, 8), vy: -rand(4, 14), t: rand(0.4, 0.8), c: pick(['#5e5662', '#8a847a', '#3e3842']), g: 0 }); }
  }

  // 바닥 꾸미기 중(DEC)에는 서 있는 장식(바위·그루터기·통나무·뼈·깔개 등)이 장애물·소품·중요 지점·서로와 겹치지 않게 건너뛴다 (v0.59)
  let DEC = null;
  const rectHit = (a, b, m = 0) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;
  function propRect(p) { const sp = PROPS[p.name]; if (sp.pit || !PROP_MAPS[p.name]) { const w = sp.w || (sp.r || 8) * 2, h = sp.h || (sp.r || 8) * 2; return { x0: p.x - w / 2, y0: p.y - (sp.pit ? h / 2 : h), x1: p.x + w / 2, y1: p.y + (sp.pit ? h / 2 : 0) }; } const c = propCanvas(p.name), x = (p.x - c.width / 2) & ~1, y = (p.y - c.height + (sp.foot || 0) * 2) & ~1; return { x0: x, y0: y, x1: x + c.width, y1: y + c.height }; }
  function decBlock(cv, x, y, w, h) {
    if (!DEC || cv !== DEC.g) return false;
    if (w * h < 160) return DEC.solid.some(a => rectHit({ x0: x, y0: y, x1: x + w, y1: y + h }, a, 2)); // v2.80 작은 장식도 소품·장애물 위엔 안 찍음
    const me = { x0: x, y0: y, x1: x + w, y1: y + h };
    if (DEC.solid.some(a => rectHit(me, a, 4)) || DEC.rects.some(a => rectHit(me, a, 2))) return true;
    DEC.rects.push(me); return false;
  }
  function withDecor(g, R, fn) {
    if (!R) return fn();
    if (['shrine', 'shop', 'rest', 'reward', 'secret'].includes(R.type)) return; // v3.25 특수방(빛의 샘 · 상점 · 비스트로 · 숨은 보고 · 잊힌 틈새)은 바닥 집기 · 환경 장식 없음 (사용자 결정)
    const solid = [];
    for (const sp of R.sprites || []) solid.push({ x0: sp.x, y0: sp.y, x1: sp.x + sp.cv.width, y1: sp.y + sp.cv.height });
    for (const b of R.obs || []) if (!b.c) solid.push({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 }); else solid.push({ x0: b.x - b.r, y0: b.y - b.r, x1: b.x + b.r, y1: b.y + b.r });
    for (const p of R.props || []) solid.push(propRect(p));
    if (R.srp && typeof srRect === 'function') for (const s of R.srp) { const q = srRect(s); if (q) solid.push(q); } // v2.80 특별방 시설
    if (R.altars) for (const a of R.altars) solid.push({ x0: a.x - 24, y0: a.y - 42, x1: a.x + 24, y1: a.y + 6 });
    const key = (x, y, r) => solid.push({ x0: x - r, y0: y - r, x1: x + r, y1: y + r });
    for (const d in R.doors) if (R.doors[d] != null) { const q = doorIn(d, 34); key(q.x, q.y, 30); }
    if (R.tele) key(R.tele.x, R.tele.y, 42); if (R.chest) key(R.chest.x, R.chest.y, 30); if (R.shop) for (const q of R.shop) key(q.x, q.y, 24);
    if (R.bridges) for (const q of R.bridges) key(q.x, q.y, 26);
    key(CX, CY - 10, CLEAR_R - 8);
    DEC = { g, solid, rects: [] };
    try { fn(); } finally { DEC = null; }
  }
  // v2.80 바닥 자국(뼈 조각·돌·핏자국·발자국 등)을 직접 찍는 곳에서 쓰는 검사: 소품·시설·장애물·상자 자리는 비워 둔다
  let DECF = null;
  function decFree(x, y, r = 6) {
    const R = typeof CUR_ROOM !== 'undefined' ? CUR_ROOM : null; if (!R || !G) return true;
    const n = (R.props || []).length + (R.srp || []).length + (R.obs || []).length;
    if (!DECF || DECF.R !== R || DECF.n !== n) {
      const s = [];
      for (const b of R.obs || []) if (b.t !== 'pit') s.push(b.c ? { x0: b.x - b.r, y0: b.y - b.r * 1.6, x1: b.x + b.r, y1: b.y + b.r } : { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 });
      for (const p of R.props || []) s.push(propRect(p));
      if (R.srp && typeof srRect === 'function') for (const q of R.srp) { const o = srRect(q); if (o) s.push(o); }
      for (const sp of R.sprites || []) s.push({ x0: sp.x, y0: sp.y, x1: sp.x + sp.cv.width, y1: sp.y + sp.cv.height });
      const key = (x, y, r) => s.push({ x0: x - r, y0: y - r, x1: x + r, y1: y + r });
      if (R.chest) key(R.chest.x, R.chest.y - 8, 22); if (R.tele) key(R.tele.x, R.tele.y, 36); if (R.shop) for (const q of R.shop) key(q.x, q.y - 6, 16);
      if (R.altars) for (const a of R.altars) s.push({ x0: a.x - 24, y0: a.y - 42, x1: a.x + 24, y1: a.y + 6 });
      DECF = { R, n, s };
    }
    const me = { x0: x - r, y0: y - r, x1: x + r, y1: y + r };
    return !DECF.s.some(a => rectHit(me, a, 2));
  }
  function stamp(g, map, pal, x, y, sc = 2, flip) {
    const w = map[0].length;
    if (sc === 2) { x = Math.round(x / 2) * 2; y = Math.round(y / 2) * 2; } // 2px 칸에 맞춤 (홀수 자리에 찍히면 칸이 어긋남)
    if (DEC && decBlock(g, x, y, w * sc, map.length * sc)) return;
    map.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { const ch = r[xx]; if (ch === '.' || !pal[ch]) continue; g.fillStyle = pal[ch]; g.fillRect(Math.round(x + (flip ? w - 1 - xx : xx) * sc), Math.round(y + yy * sc), sc, sc); } });
  }
  const DECO_MAPS = {
    rockA: ['..kkkkk..', '.kGGggdk.', 'kGGgggddk', 'kGgggdddk', 'kggMmdddk', 'kmmmMdDDk', '.kkkkkkk.'],
    rockB: ['.kkkkk.', 'kGgggdk', 'kgggddk', '.kkkkk.'],
    rockC: ['.kk..kk.', 'kGgk.kGk', 'kddk.kdk', '.kk.kkk.', '...kGgk.', '...kkkk.'],
    rockD: ['..kkk..', '.kMmmk.', 'kMmGgdk', 'kmGggdk', 'kGggddk', 'kggdddk', 'kgdddDk', 'kmdDDmk', '.kkkkk.'],
    rune: ['.kkkk.', 'kGggdk', 'kGgddk', 'kgrrdk', 'kgdrdk', 'kgrrdk', 'kgddDk', 'kgdrdk', 'kgddDk', 'kmmdDk', 'kMmmmk', 'kkkkkk'],
    stump: ['.kkkkkk.', 'kwbwwbwk', 'kbwBBwbk', 'kBbbbbBk', 'kBbBbbBk', 'kkBkkBkk'],
    log: ['.kkkkkkkkkkkk.', 'kbbbBbbbbBbkwk', 'kBbbbbBbbbbkbk', 'kbBbbbbbBbbkwk', '.kkkkkkkkkkkk.'],
    bush: ['...kkkk...', '.kkmMMmkk.', 'kmMMmrMmmk', 'kmMrmmMmrk', 'kmmmMmmrmk', '.kmmmmmmk.', '..kkkkkk..'],
    scarecrow: ['....kkk....', '...ksssk...', '..kskSksk..', '..ksssssk..', '..kSkkkSk..', '...ksssk...', 'kkkkkbkkkkk', 'kcCcCbcCcCk', '.kcCcbcCck.', '..kCcbcCk..', '..kcCbCck..', '...kCbCk...', '...kcbck...', '....kbk....', '....kbk....', '....kbk....', '...kkbkk...', '..kkkkkkk..'],
    tuft1: ['.m.m.', 'mMmMm', '.mmm.'], tuft2: ['M...M', '.m.m.', 'mmMmm'], tuft3: ['..M..', '.mMm.', 'm.m.m'],
    flowerY: ['.y.y.', 'yoymy', '.m.m.'], flowerP: ['p...p', '.p.p.', '.mpm.'], flowerW: ['.W.W.', 'WoW.W', '.m.m.'],
    rockBig: ['....kkkkk.....', '..kkGGGggkk...', '.kGGGGgggddk..', 'kGGGgggggdddk.', 'kGGgggggddddkk', 'kgggggggdddDDk', 'kMmgggggddDDDk', 'kmMmmgggdDDDmk', '.kmMmmmmmmmmk.', '..kkkkkkkkkk..'],
    fenceA: ['.kk........', 'kwbk.......', 'kbBk.......', 'kbBkkkkkkkk', 'kbBkwbbwbbk', 'kbBkkkkkkkk', 'kbBk.......', 'kbBkkkkkkkk', 'kbBkbbwbbbk', 'kbBkkkkkkkk', 'kbBk.......', 'kkkk.......'],
    fenceB: ['.kk........', 'kwbk.......', 'kbBk.......', 'kbBkkkkkkkk', 'kbBkwbbwbbk', 'kbBkkkkkkkk', 'kbBk.......', 'kbBkkkkk...', 'kbBkbbwk.k.', 'kbBkkkk..kk', 'kbBk.......', 'kkkk.......'],
    fenceC: ['.kk........', 'kwbk.......', 'kbBk.......', 'kbBkkkkkkkk', 'koookbbwbbk', 'kooBkkkkkkk', 'kbBk.......', 'kbBkkkkkkkk', 'kbBkbbwbbbk', 'kbBkkkkkkkk', 'kbBk.......', 'kkkk.......'],
    fenceD: ['.kk..', 'kwbk.', 'kbBk.', 'kbBk.', 'kbBk.', 'kbBk.', 'kbBk.', 'kbBkk', 'kbBkk', 'kbBk.', 'kbBk.', 'kkkk.'],
    fenceV: ['.kk.', 'kwbk', 'kbBk', 'kbBk', 'kkkk', '.kb.', '.kw.', '.kb.', '.kb.', '.kw.', '.kb.'],
    fenceVo: ['.kk.', 'kwbk', 'kooo', 'kbBk', 'kkkk', '.kb.', '.kw.', '.kb.', '.kb.', '.kw.', '.kb.'],
    boulder: ['..kkkkk..', '.kGGggdk.', 'kGGgggddk', 'kGgggdddk', 'kgggddddk', 'kgddddDDk', '.kkkkkkk.'],
  };
  const DECO = { k: '#121214', G: '#b0aeb4', g: '#7c7a82', d: '#4c4a52', D: '#34323a', m: '#3e6a2c', M: '#6a9a44', r: '#b03030',
    w: '#8a6a48', b: '#6a4a30', B: '#4a3220', o: '#c8b080', s: '#a08a5a', S: '#6a5a3a', c: '#5a3a5a', C: '#3a2a3a',
    y: '#e8d040', p: '#b080e0', W: '#f0ece0', R: '#a83030' };
  // v2.81 1장 바닥 장식 · 바위 다시 그림
  Object.assign(DECO, {"1": "#a07a4a", "2": "#7a5634", "3": "#58391f", "4": "#3a2412", "5": "#24160a", "6": "#c03040", "7": "#7a1820", "8": "#e0c040", "9": "#a08020", "a": "#d8c890", "e": "#a8945e", "f": "#8a7a68", "h": "#5a4c40", "i": "#f04a3a", "j": "#ff9a7a", "l": "#e8e0c8", "q": "#b8ae98", "t": "#6a4a7a", "v": "#4a3058", "n": "#24401c"});
  Object.assign(DECO_MAPS, { rockA: ["...kkkk...", "..kGMmgk..", ".kGGmGggk.", "kgggDGgggk", "kgggDddDDk", "kgggDddDDk", ".kggdddDk.", "..kDDDDk.."], rockB: ["..kkk..", ".kGGgk.", "kGGDggk", "gggDdDD", "kggddDk", ".kDDDk."], rockC: ["....kkkk....", "..kkMMmmkk..", ".kMMGGmgmmk.", "kMmggGDggmmk", "kggggdDddDDk", "kggggdDddGgk", ".kgggdddggDD", "..kkDDDDkgdk"], rockD: ["...kkk...", "..kMGgk..", ".kMmGgmk.", "kGGGDggmk", "kgggDdDDk", "kgggDdDDk", "kDggddDDk", ".kggddDk.", "..kDDDk.."], stump: ["................", "................", "....kkkkkkkk....", "...k3aeeeea3k...", "..k3aeaeeeea3k..", "..k13aeeeee34k..", "..k1242343344k..", "..k1242333344k..", "..k124234334lk..", "..kM2423433466k.", ".k2M242333344qk.", "kk21M223333443k.", "222kk22kkk33kk3k", "2kk.k2k...k3k.k3"], log: [".................k1k......", "..kkkkkkkkkkkkkkk2kkkkkk..", ".k111MMM1111MM1121111111k.", "k12222m22222m422222242221k", "k422222242222224222222422k", "k334333333433333343333334k", "k3333433333343333334l3333k", ".k4444444444444444446644k.", "..kkkkkkkkkkkkkkkkkkkkqk.."], bush2: ["......kkkkk.....", ".....kMMMMmkk...", "..kkkMMMjmmmMkk.", ".kMMMMMmm6mMmMmk", ".kMjMMmmmmmmnmmk", "kMMM6mMMMnmjnmmm", "kMMMMMMMmMmM6mMn", "kMMMMMjmmMnmMmmn", ".kMMjMM6mjnmnmnk", ".kMMM6mmmm6mmmnk", "..kMnmmnmmmmnnk.", "...kkknnnnnkkk.."], rune: ["..kgggdk...", ".kGMMgddk..", ".kGgggdDDk.", "kGGgggdDDk.", "kGGgjiDDDk.", "kGGgiiDdDk.", "kGGggiDdDk.", "kGGggiidDk.", "kGGgg6ddDk.", "kGGg6g6dDk.", "kGGgg6ddDk.", "kGGgg6ddDk.", "kMGgggddDk.", "kMGgggddDk.", "kMGgggddDk.", "kGMgggddDmk", "kDDDDDDDmDk", ".kkkkkkkmk."], scarecrow: [".....k889999k.....", ".....k889999k.....", "...kkk777777kkk...", "..k888889999999k..", "...kkkaaaeeekkk...", ".....kaaaeeek.....", ".....ka4ae4ek.....", ".....kaaaeeek.....", ".....ka4444ek.....", "......kkhhkk......", ".kkkkkkk23kkkkkkk.", "k222ttttvvvvv2222k", "k333tttteevvv3333k", "kakkttttvvvvvkkkek", "akakttttvvvfvkkeke", "k.kttfttvvvvvvkk.k", "..ktttttvvvvvvk...", "..ktttttvvvvvvk...", "..kttttfvvvvvvk...", "..kttkktvvvkvvk...", "...kk.kkvvkkek....", ".....kak23ekk.....", "......kk23k.......", ".......k23k.......", ".......k23k.......", ".......k23k.......", ".......k23k.......", ".......k23k......."] });
  PAL.deco = DECO;
  MAPS.boulder = DECO_MAPS.boulder;
  const WOOD = [{ w: '#8a6a48', b: '#6a4a30', B: '#4a3220' }, { w: '#7a5e40', b: '#5a3e28', B: '#3e2a1a' }, { w: '#968060', b: '#6e5a40', B: '#4a3c2a' }];
  const woodPal = () => Object.assign({}, DECO, pick(WOOD));

  // ---------- 초원 위쪽 숲: 나무를 도트로 생성 (둥근 활엽수 · 전나무 · 자작나무 · 고사목 · 단풍)
  const TREE_PAL = {
    green: { D: '#0e200c', d: '#1a3a16', l: '#2e5a22', h: '#4a7e30' },
    deep: { D: '#081610', d: '#10281a', l: '#1c4026', h: '#2c5a34' },
    autumn: { D: '#3a140c', d: '#6a2a12', l: '#a04a1a', h: '#d8883a' },
    gold: { D: '#3a2a0c', d: '#6a5014', l: '#a08020', h: '#d8c050' },
    dusk: { D: '#16122a', d: '#261e40', l: '#3a3060', h: '#584a84' },
    birch: { D: '#1e3010', d: '#36561c', l: '#5a8a2c', h: '#8ab84a' },
  };
  const TRUNK = { k: '#07070a', t: '#3a2a1c', T: '#22180e', w: '#d8d0c0', x: '#2a2420', c: '#0b0a0e', e: '#c03030' };
  function genTree(kind) {
    const Wd = kind === 'pine' ? 17 : kind === 'dead' ? 21 : kind === 'birch' ? 17 : 25, Ht = kind === 'pine' ? 34 : kind === 'dead' ? 30 : kind === 'birch' ? 34 : 32; // v2.21 잎 덩어리가 칸 밖으로 나가 좌우·위가 잘리던 것 → 칸을 넓히고 덩어리는 외곽선 1칸까지 안쪽에
    const g = Array.from({ length: Ht }, () => Array(Wd).fill('.')), cx = Math.floor(Wd / 2);
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && x < Wd - 1 && y >= 1 && y < Ht) g[y][x] = c; }; // 가장자리 1칸은 외곽선 자리
    const shade = (dx, dy, r) => { const v = (dx + dy) / (r * 1.4) + rand(-0.25, 0.25); return v < -0.55 ? 'h' : v < -0.05 ? 'l' : v < 0.5 ? 'd' : 'D'; };
    if (kind === 'dead') {
      const branch = (x, y, ang, len, dep) => {
        for (let i = 0; i < len; i++) { set(x, y, dep > 2 ? 't' : (i % 3 ? 't' : 'T')); if (dep > 2) set(x + 1, y, 'T'); x += Math.cos(ang); y += Math.sin(ang); }
        if (dep <= 0) return;
        branch(x, y, ang - rand(0.35, 0.7), len * rand(0.55, 0.75), dep - 1);
        branch(x, y, ang + rand(0.35, 0.7), len * rand(0.55, 0.75), dep - 1);
      };
      branch(cx, Ht - 1, -Math.PI / 2 + rand(-0.1, 0.1), 11, 3);
      set(cx - 2, Ht - 1, 'T'); set(cx + 2, Ht - 1, 'T');
      if (Math.random() < 0.6) { const by = randi(6, 12); for (let x = 0; x < Wd; x++) if (g[by][x] === 't' || g[by][x] === 'T') { set(x, by - 1, 'c'); set(x + 1, by - 1, 'c'); set(x, by - 2, 'c'); set(x + 1, by - 2, 'e'); break; } } // 까마귀
    } else if (kind === 'pine') {
      for (let y = Ht - 7; y < Ht; y++) { set(cx, y, 't'); set(cx + 1, y, 'T'); }
      for (let tier = 0; tier < 5; tier++) {
        const top = 1 + tier * 5, h = 9;
        for (let y = 0; y < h; y++) { const hw = Math.floor((y + 1) * (0.55 + tier * 0.08)); for (let x = -hw; x <= hw; x++) set(cx + x, top + y, x < -hw / 3 ? (y < 3 ? 'h' : 'l') : x < hw / 3 ? 'd' : 'D'); }
      }
    } else {
      const birch = kind === 'birch';
      const tH = birch ? 14 : 10;
      for (let y = Ht - tH; y < Ht; y++) { set(cx, y, birch ? 'w' : 't'); set(cx + 1, y, birch ? (y % 4 === 0 ? 'x' : 'w') : 'T'); if (!birch) set(cx - 1, y, 't'); if (birch && y % 5 === 2) set(cx, y, 'x'); }
      if (!birch) { set(cx - 2, Ht - 1, 't'); set(cx + 2, Ht - 1, 'T'); set(cx + 3, Ht - 1, 'T'); }
      const blobs = [], n = birch ? 3 : randi(4, 6);
      { const r0 = birch ? rand(4, 5) : rand(5.5, 7.5); blobs.push({ x: cx + 0.5 + rand(-1, 1), y: Math.max(r0 + 1, Ht - tH - r0 * 0.6), r: r0 }); } // v1.53 첫 덩어리는 줄기 끝에 붙이고
      for (let i = 1; i < n; i++) { const p = pick(blobs), r = birch ? rand(3.5, 5) : rand(4.5, 7.5), a = -Math.PI / 2 + rand(-1.3, 1.3) * (birch ? 0.6 : 1), d = p.r * rand(0.45, 0.85); // 나머지는 이미 있는 덩어리에 겹쳐 이어 붙여 잎이 떨어져 보이지 않게
        blobs.push({ x: clamp(p.x + Math.cos(a) * d, r + 1, Wd - 2 - r), y: Math.max(r + 1, p.y + Math.sin(a) * d), r }); }
      for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) for (const b of blobs) {
        const dx = x - b.x, dy = y - b.y;
        if (dx * dx + dy * dy <= b.r * b.r) { set(x, y, shade(dx, dy, b.r)); break; }
      }
      if (!birch) for (let i = 0; i < 3; i++) set(cx + randi(-1, 2), Ht - tH - randi(0, 2), 'T'); // 가지 틈
    }
    // 윤곽선
    const out = g.map(r => r.slice());
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g[y + b] && g[y + b][x + a] && g[y + b][x + a] !== '.')) out[y][x] = 'k';
    return out.map(r => r.join(''));
  }
  const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A1 = p(a), B1 = p(b); return '#' + A1.map((v, i) => Math.round(v + (B1[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  // 숲과 풀밭이 만나는 곳: 들쭉날쭉한 디더링 그늘 (나무보다 먼저)
  function paintForestShadow(g) {
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let x = 0; x < W; x += 2) {
      const depth = 30 + Math.sin(x * 0.045) * 8 + Math.sin(x * 0.13 + 1) * 5 + rand(-3, 3);
      for (let y = A.y0 - 30; y < A.y0 + depth; y += 2) {
        const t = (y - (A.y0 - 30)) / (depth + 30), lv = Math.pow(1 - t, 1.3) * 0.95;
        if (lv * 16 > B[((y >> 1) & 3) * 4 + ((x >> 1) & 3)]) { g.fillStyle = t < 0.35 ? '#0a1408' : '#12200e'; g.fillRect(x, y, 2, 2); }
      }
    }
  }
  // 나무 밑동 앞쪽 덤불·고사리·키 큰 풀·뿌리 (나무 다음에)
  function paintUndergrowth(g) {
    for (let x = -10; x < W; x += randi(10, 22)) {
      const y = A.y0 + 8 + randi(0, 2) * 2, r = Math.random(); // v3.25 위쪽 울타리 발치(울타리 아래 끝 A.y0+6) 바로 아래 몇 px에만 — 울타리 뒤 · 울타리에 겹쳐 나오지 않게
      if (r < 0.3) stamp(g, DECO_MAPS.bush, Object.assign({}, DECO, { m: pick(['#1e3a18', '#24401c']), M: pick(['#2e5222', '#36602a']), r: pick(['#8a2030', '#5a3a7a', '#2e5222']) }), x, y, 2, Math.random() < 0.5);
      else if (r < 0.55 && G) gPaint(g, genFern(), { m: '#24401c', M: '#3e6a2c', d: '#16280f' }, x - 8, y);
      else if (r < 0.85) stamp(g, DECO_MAPS[pick(['tuft1', 'tuft2', 'tuft3'])], Object.assign({}, DECO, { m: '#2e5222', M: '#4a7a34' }), x, y + 2, 2, Math.random() < 0.5);
      else { g.fillStyle = '#22180e'; for (let k = 0; k < randi(3, 6); k++) g.fillRect((x + k * 2) & ~1, (y + 4 + (k % 2) * 2) & ~1, 2, 2); }
    }
  }
  // 나무 그림 풀: 종류·색·어둡기마다 4가지 모양을 한 번만 만들어 두고 찍는다 (방에 들어갈 때마다 수백 그루를 칸 단위로 새로 그리면 프레임이 끊김)
  const TREE_POOL = new Map();
  function treeCv(kind, palK, dimCol, dim, v) {
    const key = kind + '|' + palK + '|' + dimCol + dim + '|' + v; let c = TREE_POOL.get(key);
    if (!c) { const kk = kind + '|' + v; let map = TREE_POOL.get(kk); if (!map) { map = withSeed(7919 * (v + 1) + kind.length * 131 + kind.charCodeAt(0), () => genTree(kind)); TREE_POOL.set(kk, map); }
      const pal = Object.assign({}, TRUNK, TREE_PAL[palK]); if (dim) for (const k in pal) pal[k] = mixHex(pal[k], dimCol, dim);
      const [cv2, g2] = mkCanvas(map[0].length * 2, map.length * 2); map.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { const ch = r[xx]; if (ch === '.' || !pal[ch]) continue; g2.fillStyle = pal[ch]; g2.fillRect(xx * 2, yy * 2, 2, 2); } });
      c = cv2; TREE_POOL.set(key, c); }
    return c;
  }
  function stampTree(g, c, x, y, flip) { x = Math.round(x / 2) * 2; y = Math.round(y / 2) * 2; if (flip) { g.save(); g.translate(x + c.width, y); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); } else g.drawImage(c, x, y); }
  // v2.21 문으로 이어지는 길 위에는 나무를 두지 않음 (나무 그림 사각형이 길 폭 ±20px과 겹치면 건너뜀)
  function onDoorPath(tx, ty, w, h) {
    const R = CUR_ROOM, D = R && G ? R.doors : null; if (!D) return false;
    const open = d => D[d] != null && !(R.crack && R.crack.dir === d && !R.crack.broken), PW = 20;
    if (open('s') && tx < DOOR.s.x + PW && tx + w > DOOR.s.x - PW && ty + h > A.y1) return true;
    if (open('w') && tx < A.x0 && ty < DOOR.w.y + PW && ty + h > DOOR.w.y - PW) return true;
    if (open('e') && tx + w > A.x1 && ty < DOOR.e.y + PW && ty + h > DOOR.e.y - PW) return true;
    return false;
  }
  // v3.19 개울이 숲을 지날 때: 숲 구간의 개울은 나무보다 먼저 그리고(앞쪽 나무가 개울을 가림), 물에 밑동이 잠기는 나무는 세우지 않음
  function brookCurve() { if (typeof ROOMSTYLE === 'undefined' || !ROOMSTYLE || ROOMSTYLE.path !== 'brook' || !ROOMSTYLE.side) return null; const c = meadowCurves()[0]; return c && c.kind === 'brook' ? c : null; }
  const brookIn = (c, t) => c.vert ? t >= A.y0 - 20 && t <= A.y1 + 12 : t >= A.x0 - 12 && t <= A.x1 + 12; // 방 안 구간 (울타리 포함)
  const brookWet = (c, x, y) => Math.abs((c.vert ? x : y) - c.at(c.vert ? y : x)) < 20;
  function paintTreeline(g) {
    const bk = brookCurve(); if (bk && bk.vert) paintMeadowCurve(g, Object.assign({}, bk, { clip: t => t < A.y0 - 20, noBridge: true }));
    const row = (yBase, dim, step) => {
      for (let x = -20; x < W + 20; x += randi(step[0], step[1])) {
        const r = Math.random(), kind = r < 0.45 ? 'round' : r < 0.8 ? 'pine' : 'dead'; // v3.20 숲 줄에서도 자작나무(흰 줄기) 삭제
        const palK = kind === 'pine' ? (Math.random() < 0.5 ? 'deep' : 'green') : kind === 'birch' ? 'birch' : kind === 'dead' ? 'green' : pick(['green', 'green', 'deep', 'autumn', 'gold', 'dusk']);
        const c = treeCv(kind, palK, '#140e22', dim, randi(0, 3)), y = Math.max(12, yBase - c.height + randi(-6, 6)); // v2.21 바닥 캔버스 위 끝(카메라 최상단)에서 나무 꼭대기가 잘리지 않게
        if (onDoorPath(x - c.width * 0.2, y, c.width * 0.4, c.height)) continue; // 잎 가운데 40%만 판정
        if (bk && bk.vert && !dim && brookWet(bk, x, y + c.height)) continue;
        stampTree(g, c, x - c.width / 2, y, Math.random() < 0.5);
      }
    };
    row(A.y0 - 26, 0.5, [16, 26]);   // 뒷줄 (어둡게 깔린다)
    row(A.y0 + 4, 0, [26, 40]);      // 앞줄
    // v3.20 뿌리 쪽 덤불 삭제 — 위쪽 울타리 뒤로 덤불이 비치지 않게 (덤불은 울타리 앞에만 듬성듬성)
  }
  function paintMeadowProps(g) {
    if (G) withDecor(g, CUR_ROOM, () => paintMeadowDecor(g, CUR_ROOM));
    // v3.26 울타리는 「한 묶음」 단위: 모서리 기둥(세로 울타리 자리)이나 문 자리 기둥에서 시작해 반드시 기둥으로 끝남
    //   칸(기둥 + 가로대)을 무작위로 끊어 늘어놓지 않음 — 부러진 가로대(fenceB) · 가로대 끝이 허공에 걸린 칸 없음, 간격은 22px 이하로 고르게 맞춤
    const DR = CUR_ROOM && G ? CUR_ROOM.doors : {}, WP = woodPal(), XL = A.x0 - 10, XR = A.x1 + 2;
    const POST = DECO_MAPS.fenceP || (DECO_MAPS.fenceP = DECO_MAPS.fenceD.map(r => r.slice(0, 4))); // 가로대 없는 기둥
    const runs = (a, b, gap) => gap == null ? [[a, b]] : [[a, gap - 32], [gap + 22, b]].filter(([p, q]) => q - p >= 8);
    const hRun = (x0, x1, y, both, tufts) => { // x0 · x1 = 처음 · 마지막 기둥 자리
      const n = Math.max(1, Math.ceil((x1 - x0) / 22)), st = (x1 - x0) / n, put = both ? stampBoth : stamp;
      for (let i = 0; i < n; i++) { const x = Math.round((x0 + st * i) / 2) * 2; put(g, DECO_MAPS[Math.random() < 0.15 ? 'fenceC' : 'fenceA'], WP, x, y, 2);
        if (tufts && Math.random() < 0.6) put(g, DECO_MAPS[pick(['tuft1', 'tuft2'])], DECO, x + rand(-2, 4), A.y1 + 2, 2); }
      put(g, POST, WP, Math.round(x1 / 2) * 2, y, 2); }; // 끝 기둥
    // 아래쪽 가로 울타리 (캐릭터 앞 레이어에도) · 위쪽 가로 울타리 (북쪽 문 자리는 비움)
    for (const [p, q] of runs(XL, XR, DR.s != null ? DOOR.s.x : null)) hRun(p, q, A.y1 - 16, true, true);
    for (const [p, q] of runs(XL, XR, DR.n != null ? DOOR.n.x : null)) hRun(p, q, A.y0 - 18, false, false);
    // v3.19 위쪽 울타리 발치의 덤불 · 풀은 울타리 위로 올라오게 (울타리를 찍은 뒤에 한 번 더)
    for (let x = A.x0 - 4 + randi(0, 30); x < A.x1 - 8; x += randi(40, 90)) { if (DR.n != null && x + 16 > DOOR.n.x - 30 && x < DOOR.n.x + 30) continue; stamp(g, DECO_MAPS[pick(['bush', 'bush', 'tuft1', 'tuft2'])], Object.assign({}, DECO, { m: '#1e3a18', M: '#2e5222', r: pick(['#8a2030', '#4a3070']) }), x, A.y0 + 8 + randi(0, 2) * 2, 2, Math.random() < 0.5); } // v3.20 울타리 줄에 겹치지 않게 울타리 발치 앞으로 내림 · v3.25 울타리 아래 끝(A.y0+6) 밑으로
    // 양옆 세로 울타리 — 위쪽 모서리 기둥 아래에서 시작해 아래쪽 모서리 기둥까지 이어지고, 옆문 자리는 기둥으로 끝맺음
    { const VP = DECO_MAPS.fenceVp || (DECO_MAPS.fenceVp = DECO_MAPS.fenceV.slice(0, 5)), Y0 = A.y0 + 8, Y1 = A.y1 - 16;
      const vRun = (x, y0, y1, endPost) => { const n = Math.max(1, Math.ceil((y1 - y0) / 22)), st = (y1 - y0) / n;
        for (let i = 0; i < n; i++) stamp(g, DECO_MAPS[Math.random() < 0.2 ? 'fenceVo' : 'fenceV'], WP, x, Math.round((y0 + st * i) / 2) * 2, 2);
        if (endPost) stamp(g, VP, WP, x, Math.round(y1 / 2) * 2, 2); };
      for (const [x, open] of [[XL, DR.w != null], [XR, DR.e != null]]) {
        if (!open) { vRun(x, Y0, Y1, false); continue; } // 아래 끝은 가로 울타리 모서리 기둥이 받음
        vRun(x, Y0, CY - 34, true); vRun(x, CY + 24, Y1, false); } }
  }

  // ---------- 독 (플레이어 상태이상)
  // v2.50 중독: 독 공격 자체는 피해가 없고, 맞으면 맨 위 하트가 중독 하트(초록)로 바뀐다.
  //   중독 동안 다음 피격은 반 칸 대신 한 칸을 잃고 풀린다. 맞지 않고 POISON_T(15)초가 지나면 저절로 풀린다(마지막 2초는 하트가 깜빡임). 물약·부활로도 풀린다
  const POISON_T = 15;
  function poisonPlayer() {
    const P = G.player; if (P.dead) return;
    const was = P.poisonT > 0; P.poisonT = POISON_T; // 다시 맞으면 시간만 처음으로
    G.nums.push({ x: P.x, y: P.y - 30, v: '중독!', t: 0.7, c: '#8ae050', s: 1, txt: true }); // 독에 맞을 때마다
    sfx('hurt', 0.6);
    for (let i = 0; i < 10; i++) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(4, 18), vx: rand(-20, 20), vy: rand(-40, -10), t: rand(0.3, 0.6), c: pick(['#b070e0', '#8ae050']), g: 0 });
  }
  function poisonHit(src) { // 독 공격 판정: 피해 없이 중독만 (회피·무적·보호막은 평소 피격과 똑같이 막는다)
    const P = G.player;
    if (P.dead || mode !== 'play' || G.decoyUpd || GOD_MODE || P.grab) return;
    if (P.miracleT > 0 || P.shieldT > 0 || (P.stealthT > 0)) return;
    if (P.iframe > 0) { if (P.state === 'dodge' && P.dodgeT < PD_WIN() && !P.perfectUsed) perfectDodge(); return; }
    if (P.inv > 0) return;
    P.inv = 0.4; P.hurtT = 0.12; poisonPlayer();
  }
  function updatePoison(dt) {
    const P = G.player; if (!(P.poisonT > 0) || P.dead) return;
    P.poisonT -= dt; // 자연 회복
    if (P.poisonT <= 0) { P.poisonT = 0; return; }
    if (Math.random() < dt * 4) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(2, 20), vx: rand(-4, 4), vy: rand(-30, -14), t: rand(0.3, 0.6), c: pick(['#8ae050', '#6cc040', '#b070e0']), g: 0 }); // 중독 표시 거품
  }
  // 포물선으로 날아가는 투척물 (바위·독액). d0 이전에는 아직 손에 들고 있다
  // 크루가쉬 십자·X 공격의 솟는 바위 가시 (v0.81): 2px 칸 도트, 검은 외곽선, 왼쪽 위 빛 4단계 명암
  const ROCK_PAL = { k: '#140c08', h: '#c8a882', l: '#946e50', m: '#6a4c3a', d: '#3e2a20', c: '#24160f' };
  function genRockSpike(v) {
    let seed = 7 + v * 131; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const W = 30, H = 30, g = mkGrid(W, H), base = H - 2;
    const shard = (cx, h, w, lean) => {
      for (let r = 0; r <= h; r++) {
        const t = r / h, hw = Math.max(0.6, (w / 2) * Math.pow(t, 0.75)) + (r > 3 && rnd() < 0.18 ? (rnd() < 0.5 ? -0.7 : 0.7) : 0), c = cx + lean * (1 - t) * h, y = base - h + r;
        for (let x = Math.floor(c - hw); x <= Math.ceil(c + hw); x++) {
          if (x < 1 || x >= W - 1 || y < 1 || Math.abs(x - c) > hw) continue;
          const rel = (x - c) / Math.max(1, hw);
          g[y][x] = rel < -0.45 ? 'l' : rel > 0.35 ? 'd' : 'm';
          if (rel < -0.45 && x <= c - hw + 1 && r < h * 0.7) g[y][x] = 'h';
          if (r > 3 && Math.abs(rel) < 0.3 && rnd() < 0.08) g[y][x] = 'c';
        }
      }
    };
    const hs = [[25, 22, 26, 20][v], [13, 16, 11, 15][v], [9, 7, 12, 10][v]];
    shard(9, hs[1], 9, -0.3); shard(22, hs[2], 8, 0.34); shard(15, hs[0], 12, rnd() * 0.14 - 0.07);
    // 밑동의 잔돌
    for (const [x, y] of [[3, base], [4, base], [4, base - 1], [26, base], [27, base], [26, base - 1]]) g[y][x] = 'd';
    return gOutline(g);
  }
  function drawRockSpike(f, p) {
    const spr = art('rspk' + f.v, () => gCanvas(genRockSpike(f.v), ROCK_PAL)), W = spr.width, H = spr.height, bx = Math.round(f.x) & ~1, by = Math.round(f.y) & ~1;
    // 솟기: 0~0.07 쑥 올라오며 살짝 튀었다 자리 잡고, 0.72부터 바스러지며 땅속으로 가라앉는다
    const up = p < 0.07 ? easeOut(p / 0.07) * 1.12 : p < 0.13 ? 1.12 - (p - 0.07) / 0.06 * 0.12 : p < 0.72 ? 1 : Math.max(0, 1 - (p - 0.72) / 0.28);
    const vis = Math.min(H, Math.round(H * up / 2) * 2);
    dshEll(ctx, bx, by, 14, 5, 0.5);
    if (p < 0.2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,110,40,${0.55 * (1 - p / 0.2)})`; ctx.fillRect(bx - 12, by - 4, 24, 6); ctx.restore(); }
    if (vis > 0) {
      ctx.save(); if (f.fl) { ctx.translate(bx * 2, 0); ctx.scale(-1, 1); }
      const sh = p < 0.07 ? Math.round((1 - p / 0.07) * 2) * 2 * (((p * 60) | 0) & 1 ? 1 : -1) : 0;
      if (p > 0.72) { // 바스러짐: 2px 디더로 구멍이 점점 늘어난다
        const k = (p - 0.72) / 0.28; ctx.beginPath();
        for (let y = by - vis + 2; y < by + 2; y += 2) for (let x = bx - W / 2; x < bx + W / 2; x += 2) if (!dith(x >> 1, y >> 1, k * 0.95)) ctx.rect(x, y, 2, 2);
        ctx.clip();
      }
      ctx.drawImage(spr, 0, 0, W, vis, bx - W / 2 + sh, by - vis + 2, W, vis);
      ctx.restore();
    }
    // 튀는 돌조각 (외곽선 있는 4px 덩이)
    if (p < 0.45) { let sd = f.sd | 0; const rnd = () => (sd = (sd * 16807 + 11) % 2147483647) / 2147483647, tt = p * f.max;
      for (let i = 0; i < 5; i++) { const vx = (rnd() - 0.5) * 140, vy = -(70 + rnd() * 110), x = Math.round((bx + vx * tt) / 2) * 2, y = Math.round((by - 14 + vy * tt + 380 * tt * tt) / 2) * 2; if (y > by + 4) continue;
        ctx.fillStyle = '#140c08'; ctx.fillRect(x - 2, y - 2, 8, 8); ctx.fillStyle = i % 2 ? '#7c604a' : '#ae8e6c'; ctx.fillRect(x, y, 4, 4); ctx.fillStyle = i % 2 ? '#4c3829' : '#e2ccaa'; ctx.fillRect(i % 2 ? x + 2 : x, i % 2 ? y + 2 : y, 2, 2); }
    }
  }
  const THROW_AXE = cellWeapon(12, 9, 6, 4, { o: '#8a6034', O: '#5a3a1e', b: '#7a5034', m: '#a4a4b0', M: '#5e5e6a', n: '#e4e4ec' }, put => { // v2.45 던지는 손도끼 (가운데가 회전축)
    for (let x = 1; x < 11; x++) put(x, 4, x % 3 === 0 ? 'b' : 'o');
    for (let x = 7; x <= 10; x++) for (let y = 0; y <= 3; y++) put(x, y, y === 0 || x === 10 ? 'n' : 'm'); put(7, 5, 'M'); put(8, 5, 'M'); });
  const THROW_AXE_B = cellWeapon(12, 9, 6, 4, { o: '#ffffff', b: '#ffffff', m: '#ffffff', M: '#ffffff', n: '#ffffff' }, (put, g) => { THROW_AXE.cells.forEach((r, y) => r.forEach((c, x) => { if (c !== '.') put(x, y, c); })); });
  // v2.46 보스 특대형 무기 (몸은 파티와 같은 비율 → 위압감은 무기로)
  const BOSS_SWORD = cellWeapon(50, 17, 11, 8, { G: '#e0b860', g: '#a87a30', c: '#c09048', V: '#d17aff', u: '#b450d8', h: '#1d1a24', H: '#3a3448', j: '#2a2534', w: '#f4f0ff', P: '#7a7090', p: '#4d465c', m: '#655d7a', s: '#9a92b0', S: '#c8c0e0' }, put => {
    const L = 38, sw = (u, v) => { const av = Math.abs(v);
      if (u === -9 && av <= 1) return v ? 'G' : 'V';
      if (u === -8 && av <= 2) return av === 2 ? 'g' : 'G';
      if (u >= -7 && u <= -1 && av <= 1) return u % 2 === 0 ? 'h' : v === 0 ? 'H' : 'j';
      if (u === 0 || u === 1) { if (av <= 6) return av === 0 && u === 0 ? 'V' : u === 0 ? 'G' : 'g'; if (av === 7 && u === 1) return 'g'; }
      if (u === 2 && (av === 6 || av === 7)) return 'g';
      if (u >= 2 && u <= 4 && av <= 2) return av === 2 ? 'g' : v === 0 ? 'G' : 'c';
      if (u >= 5 && u < L) { const wv = u < L - 6 ? 3 : Math.max(0, Math.round((L - u) / 2)); if (av <= wv) {
        if (av === wv) return v > 0 ? 'w' : 'P'; if (v === 0) return u % 4 === 1 && u < L - 7 ? 'V' : 'j'; if (av === 1) return v < 0 ? 'p' : 'm'; return v < 0 ? 's' : 'S'; } }
      return null; };
    for (let u = -9; u < L; u++) for (let v = -7; v <= 7; v++) { const c = sw(u, v); if (c) put(u + 11, v + 8, c); }
  });
  const KRUG_AXE = cellWeapon(44, 31, 6, 15, { w: '#ece0c4', W: '#b8ac90', k: '#0b0a0e', e: '#ff3a20', o: '#6a4a28', O: '#4a3018', r: '#a32a2a', R: '#5e1416', E: '#e04838', n: '#ffe0d0' }, put => {
    const L = 30, uc = L - 6;
    for (let u = -5; u <= L; u++) for (let v = 0; v <= 1; v++) put(u + 6, v + 15, u % 7 === 0 ? 'r' : v === 0 ? 'o' : 'O');
    for (const [u, v] of [[-6, 0], [-6, 1], [-7, 0], [-7, 1]]) put(u + 6, v + 15, 'w'); // 뼈 물미
    for (let du = -9; du <= 9; du++) for (const sg of [-1, 1]) for (let w = 1; w <= 14; w++) { // 초승달 양날: 바깥은 볼록, 자루 쪽은 오목 → 날끝이 갈고리처럼
      const wo = 4 + 9 * Math.sqrt(Math.max(0, 1 - (du / 9.5) ** 2)), wi = 1 + (wo - 1) * Math.pow(Math.abs(du) / 9.5, 1.4) * 0.92;
      if (w < wi || w > wo) continue; const d = wo - w, v = sg > 0 ? w + 1 : -w;
      put(uc + du + 6, v + 15, d < 1 ? 'n' : d < 2.2 ? 'E' : w < wi + 1.2 ? 'R' : 'r'); }
    // 도끼 끝의 해골 장식 (자루 끝에 박힘)
    const sk = ['.www.', 'wkwkw', 'wwwww', 'wwkww', '.WwW.', '.w.w.'];
    for (let i = 0; i < sk.length; i++) for (let j = 0; j < 5; j++) { const c = sk[i][j]; if (c !== '.') put(L + 1 + (5 - i) + 6, j - 2 + 15 + (j > 2 ? 1 : 0) * 0, c); }
  });
  function drawLob(f, p) {
    const k = (p - (f.d0 || 0)) / (1 - (f.d0 || 0)); if (k < 0) return;
    const x = f.x0 + (f.x1 - f.x0) * k, gy = f.gy0 + (f.y1 - f.gy0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * f.h;
    dshEll(ctx, x, gy, f.rock ? 8 : 4, f.rock ? 3 : 2, 0.5);
    if (f.rock) { drawSprite('boulder', 'deco', 2, x, y + 7, false, { rot: k * 6 }); return; }
    if (f.meat) { // 관중의 선물: 빙글빙글 도는 뼈 달린 고깃덩이
      const X = Math.round(x) & ~1, Y = Math.round(y) & ~1, fl = Math.floor(k * 8) % 2;
      ctx.fillStyle = '#0b0806'; ctx.fillRect(X - 6, Y - 6, 12, 10); ctx.fillRect(fl ? X + 4 : X - 10, Y - 2, 8, 4);
      ctx.fillStyle = '#a83a2a'; ctx.fillRect(X - 4, Y - 4, 8, 6); ctx.fillStyle = '#d86a4a'; ctx.fillRect(X - 4, Y - 4, 4, 2); ctx.fillStyle = '#6a1a12'; ctx.fillRect(X, Y, 4, 2);
      ctx.fillStyle = '#ece0c4'; ctx.fillRect(fl ? X + 4 : X - 8, Y - 2, 4, 2); ctx.fillRect(fl ? X + 6 : X - 10, Y, 2, 2); return; }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(170,90,230,.45)'; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#120816'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a4aa0'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#9ae060'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 2, 2);
    if (Math.random() < 0.6) G.parts.push({ x, y, vx: rand(-10, 10), vy: rand(10, 30), t: 0.3, c: pick(['#b070e0', '#8ae050']), g: 60, glow: true });
  }

  // ---------- 독침 슬라임
  function updateToxSlime(e, dt, d, a) {
    const P = G.player;
    if (e.state === 'chase') {
      if (e.hop) stepHop(e, dt);
      else if (e.cd <= 0 && d < 240 && d > 40) {
        e.state = 'spit'; e.t = 0.6; e.holdMax = 0.6; e.face = Math.cos(a) > 0 ? 1 : -1;
        const tx = clamp(P.x, A.x0 + 10, A.x1 - 10), ty = clamp(P.y, A.y0 + 10, A.y1 - 10), dur = 1.15;
        G.fx.push({ kind: 'lob', x0: e.x, y0: e.y - 12, gy0: e.y, x1: tx, y1: ty, h: 46, d0: 0.5, t: dur, max: dur, owner: e });
        G.tele.push({ shape: 'circle', x: tx, y: ty, r: 26, t: 0, dur, owner: e,
          onFire: tt => {
            const P2 = G.player;
            if (!P2.dead && inShape(tt, P2.x, P2.y, P2.r)) poisonHit(e); // v2.50 독은 피해 없이 중독만
            G.fx.push({ kind: 'ring', x: tt.x, y: tt.y, r: 4, grow: 140, t: 0.25, max: 0.25, c: '#c890ff' });
            for (let i = 0; i < 14; i++) { const aa = rand(0, TAU), sp = rand(30, 110); G.parts.push({ x: tt.x, y: tt.y - 4, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.5 - 40, t: rand(0.3, 0.6), c: pick(['#8a4aa0', '#b070e0', '#8ae050']), g: 220, floor: tt.y + rand(-4, 6) }); }
            splat(tt.x, tt.y, 16, '80,30,90'); sfx('hit');
          } });
      } else {
        e.hopT = (e.hopT || 0) - dt;
        if (e.hopT <= 0) {
          e.hopT = rand(0.35, 0.7);
          const ang = d < 90 ? a + Math.PI + rand(-0.5, 0.5) : d > 170 ? a + rand(-0.4, 0.4) : a + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
          e.hop = { t: 0, dur: 0.42, ang: steer(e, ang), sp: e.spd, h: 7 };
        }
      }
    } else if (e.state === 'spit') {
      if (e.t <= 0) { e.state = 'recover'; e.t = 0.45; e.cd = rand(2.4, 3.2); e.squash = 0.18; sfx('swing'); }
    }
  }

  // ---------- 엘리트: 고블린 챔피언
  function bruteTick(e, dt) {
    e.rockT = Math.max(0, (e.rockT || 0) - dt); e.slamT = Math.max(0, (e.slamT || 0) - dt); e.beatT = Math.max(0, (e.beatT || 0) - dt);
    if (!e.enraged && e.hp < e.maxHp * 0.5 && !e.dead) {
      e.enraged = true; e.spd *= 1.2;
      G.fx.push({ kind: 'ring', x: e.x, y: e.y - 24, r: 8, t: 0.5, max: 0.5, c: '#ffb030', grow: 300 }); addShake(5); sfx('roar'); alertMark(e, 66, true);
    }
    if (e.enraged && Math.random() < 0.4) G.parts.push({ x: e.x + rand(-10, 10), y: e.y - rand(20, 44), vx: rand(-6, 6), vy: -rand(20, 40), t: 0.4, c: pick(['#ffb030', '#c0c0c0']), g: 0, glow: true });
  }
  function updateBrute(e, dt, d, a, moveTo) {
    const P = G.player;
    e.rallyT = (e.rallyT == null ? 7 : e.rallyT) - dt;
    if (e.state !== 'chase') return;
    if (d > 56) moveTo(a, e.spd);
    if (e.cd > 0) return;
    if (e.rallyT <= 0 && G.enemies.filter(x => !x.dead && x.type === 'goblin').length < 4) return bruteRally(e);
    if (d < 100) bruteQuake(e, a); else if (d < 290) bruteBoulder(e);
  }
  function bruteQuake(e, a) { // 지면 연쇄 강타: 앞으로 3~4번 땅이 터져 나간다
    const n = e.enraged ? 4 : 3;
    e.state = 'wind'; e.pose = 'up'; e.face = Math.cos(a) > 0 ? 1 : -1; e.lean = -0.15 * e.face; alertMark(e, 58); sfx('warn');
    for (let i = 0; i < n; i++) {
      const dd = 34 + i * 38, r = 28 + i * 4;
      G.tele.push({ shape: 'circle', x: e.x + Math.cos(a) * dd, y: e.y + Math.sin(a) * dd * 0.85, r, t: 0, dur: 0.85 + i * 0.17, owner: e, heavy: i === n - 1,
        onFire: tt => {
          if (i === 0) { e.pose = null; e.slamT = 0.25; e.lean = 0.25 * e.face; addShake(7); flashT = 0.04; flashColor = '#ffb030'; }
          hitShape(tt, e.atk * (i === 0 ? 1.15 : 0.9));
          G.fx.push({ kind: 'ring', x: tt.x, y: tt.y, r: 6, t: 0.35, max: 0.35, c: '#e0c080', grow: 200 });
          for (let k = 0; k < 4; k++) G.fx.push({ kind: 'arcwave', x: tt.x, y: tt.y, ang: k / 4 * TAU + rand(-0.3, 0.3), arc: 50 * DEG, r0: 6, r1: tt.r + 10, t: 0.25, max: 0.25, c: '230,190,110' });
          debris(tt.x, tt.y, 14); dust(tt.x, tt.y, 12); crack(tt.x, tt.y); sfx(i === n - 1 ? 'blast' : 'heavy'); addShake(4);
          if (i === n - 1) { e.state = 'recover'; e.t = 0.9; e.cd = rand(1.2, 1.8); }
        } });
    }
  }
  function bruteBoulder(e) { // 바위를 머리 위로 들어 던진다
    const P = G.player, n = e.enraged ? 2 : 1;
    e.state = 'wind'; e.pose = 'scoop'; e.face = P.x >= e.x ? 1 : -1; alertMark(e, 40); sfx('warn'); // v2.45 곤봉으로 바닥을 내려쳐 바위를 쳐 올린 뒤 던진다
    e.scoop0 = time; e.scoopX = e.x + e.face * 16; debris(e.scoopX, e.y, 12); dust(e.scoopX, e.y, 10); addShake(4); sfx('heavy');
    for (let j = 0; j < n; j++) {
      const tx = clamp(P.x + (j ? rand(-70, 70) : 0), A.x0 + 20, A.x1 - 20), ty = clamp(P.y + (j ? rand(-50, 50) : 0), A.y0 + 20, A.y1 - 20), dur = 1.35 + j * 0.45;
      e.rockT = dur * 0.5 + j * 0.45;
      G.fx.push({ kind: 'lob', x0: e.scoopX, y0: e.y - 30, gy0: e.y, x1: tx, y1: ty, h: 80, d0: (dur * 0.5 + j * 0.2) / dur, t: dur, max: dur, rock: true, owner: e });
      G.tele.push({ shape: 'circle', x: tx, y: ty, r: 46, t: 0, dur, owner: e, heavy: true,
        onFire: tt => {
          hitShape(tt, e.atk * 1.2);
          G.fx.push({ kind: 'ring', x: tt.x, y: tt.y, r: 8, t: 0.4, max: 0.4, c: '#e0c080', grow: 240 });
          debris(tt.x, tt.y, 24); dust(tt.x, tt.y, 18); crack(tt.x, tt.y); addShake(7); sfx('blast');
          for (let k = 0; k < (e.enraged ? 8 : 6); k++) { const aa = k / (e.enraged ? 8 : 6) * TAU + rand(-0.15, 0.15); G.eproj.push({ x: tt.x, y: tt.y, ang: aa, sp: 170, r: 4, dmg: e.atk * 0.5, t: 0.8, hist: [], kind: 'rock' }); }
          if (j === n - 1) { e.state = 'recover'; e.t = 0.7; e.cd = rand(1.3, 1.9); e.pose = null; e.scoop0 = null; }
        } });
    }
  }
  function bruteRally(e) { // 가슴을 두드리며 고블린을 부르고 주변 고블린을 흥분시킨다
    e.rallyT = 16; e.state = 'recover'; e.t = 1.1; e.beatT = 1.1; e.cd = 0.6;
    sfx('roar'); addShake(5); alertMark(e, 66, true);
    G.fx.push({ kind: 'ring', x: e.x, y: e.y - 24, r: 10, t: 0.6, max: 0.6, c: '#ffb030', grow: 360 });
    for (let i = 0; i < 2; i++) queueSpawn('goblin', { x: clamp(e.x + rand(-90, 90), A.x0 + 20, A.x1 - 20), y: clamp(e.y + rand(-60, 60), A.y0 + 20, A.y1 - 20) });
    for (const g of G.enemies) if (!g.dead && g.type === 'goblin' && dist(g, e) < 260) { g.haste = 6; alertMark(g, 34); }
  }
  Object.assign(MAPS, {"gbBody": [",..........kkkkkk..........,", "..........khhhhssk..........", ".........khhhhssssk.........", "..kk....khhhsssssrsk...kk...", ".khhkk.khhhsssssssrskkkhhk..", "..kShhkkhsSSSSSSSrsSkhhSk...", "...kSshkssseesseesSSksSk....", "....kSrksssskssskSSSkSk.....", ".....kSksssssSSSSSSSkk......", "......kkssswsSSSwSSSk.......", "........ksswkkkkwSSk........", "......kkkkSSSSSSSSkkkk......", ".....khhsskkSSSSkkhhssk.....", ".....ksssshbkkkkssssssk.....", ".....kkkSShssssssssskkk.....", "........kSsssssssssk........", "........kssSSssSSSSk........", "........kssssssSSSSk........", "........kkkkkkkkkkkk........", "........kCCCCCCCCCCk........", "........kCccCccCccCk........", ".........kkkkkkkkkk.........", "............................", "............................", "............................"], "gbArmL": [",..........................,", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "....kkkk....................", "...khskk....................", "...kssSk....................", "...khssk....................", "...kssSk....................", "...kSSSk....................", "....kkk.....................", "............................", "............................", "............................"], "gbArmR": [",..........................,", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "....................kkkk....", "....................kkssk...", "....................ksssk...", "....................khssk...", "....................kssSk...", "....................kSSSk...", ".....................kkk....", "............................", "............................", "............................"], "gbLegL": [",..........................,", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", ".........kkkk...............", "........kSSSk...............", ".........kkkk..............."], "gbLegR": [",..........................,", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", ".............kkkkkk.........", ".............kSSSSSk........", "..............kkkkk........."], "gbUpL": [",..........................,", "...kkkk.....................", "..khhssk....................", "..khsssk....................", "..kssSSk....................", "...kssk.....................", "...khsk.....................", "...kssk.....................", "...khsSk....................", "..kkssSk....................", "..khssSk....................", "..kssSSk....................", "...kkkk.....................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................"], "gbUpR": [",..........................,", ".....................kkkk...", "....................khhssk..", "....................khsssk..", "....................kssSSk..", ".....................kssk...", ".....................khsk...", ".....................kssk...", ".....................khsSk..", "....................kkssSk..", "....................khssSk..", "....................kssSSk..", ".....................kkkk...", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................"], "gbChestR": [",..........................,", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", ".................kkkk.......", "................khhssk......", "...............khsssSSk.....", "...............kssSSSSk.....", "................kkkkkk......", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................"], "gbChestL": [",..........................,", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", ".......kkkk.................", "......khhssk................", ".....khsssSSk...............", ".....kssSSSSk...............", "......kkkkkk................", "............................", "............................", "............................", "............................", "............................", "............................", "............................", "............................"]}); // v1.36 고블린 챔피언 부위 분리 (첫 줄 양끝 ','= 투명 기준점, 부위 정렬 유지)
  // v1.36 고블린 챔피언 움직임: 몸통·팔·다리를 따로 2px 칸 단위로 — 걷기 4장면(다리 번갈아 들고 반대 팔 흔들기, 디딜 때 몸 내려앉음)
  //   준비: 처음엔 웅크렸다가(몸·팔 내려앉음) 두 팔을 머리 위로 / 내려찍기: 크게 웅크리며 두 팔을 땅으로 / 집결: 두 주먹으로 가슴을 번갈아 두드림
  const BRUTE_CLUB = cellWeapon(18, 9, 1, 4, { o: '#8a6034', O: '#5a3a1e', b: '#a87c4c', B: '#6a4a28', n: '#d8d0b8' }, put => { // v2.44 고블린 챔피언의 나무 곤봉: 가죽 감은 손잡이 → 옹이 박힌 굵은 머리
    for (let x = 0; x < 8; x++) { put(x, 4, x % 3 === 1 ? 'O' : 'o'); put(x, 5, 'O'); }
    for (let x = 7; x < 18; x++) { const r = Math.min(4, 1 + Math.round((x - 7) * 0.45)); for (let y = 4 - r; y <= 4 + r; y++) put(x, y, y === 4 - r ? 'b' : y >= 4 + r - 1 ? 'B' : (x + y) % 5 === 0 ? 'O' : 'o'); }
    for (const [x, y] of [[11, 1], [14, 0], [16, 2], [13, 8], [16, 7]]) put(x, y, 'n'); // 박힌 뼈 가시
  });
  function drawBrute(e, ya, al) { // v2.44 새 정면 도트
    const white = e.flash > 0, st = e.state, k = e.glow || 0, o = nmPose(e), f = e.face;
    const up = st === 'wind' && e.pose === 'up' && k >= 0.2; if (up) { o.sy *= 1.08; o.sx *= 0.96; } // 곤봉을 들어 올림 → 몸을 늘임
    const scoop = st === 'wind' && e.pose === 'scoop' && e.scoop0 != null, su = scoop ? clamp((time - e.scoop0) / 0.6, 0, 1) : 0;
    if (scoop) { const kk = su < 0.25 ? su / 0.25 : 1 - (su - 0.25) * 0.6; o.sy *= 1 - 0.12 * kk; o.sx *= 1 + 0.08 * kk; o.rot += 0.18 * f * kk; o.dx += 2 * f * kk; } // 몸을 숙여 바닥을 내려침
    if (e.slamT > 0) { o.sy *= 0.86; o.sx *= 1.1; }
    if (e.beatT > 0) o.dx += (Math.floor(time * 7) % 2 ? 1 : -1) * f; // 가슴 두드리기
    const tr = up && k > 0.7 ? (Math.floor(time * 18) % 2 ? 2 : 0) : 0, y = e.y + 2 + ya;
    drawShadow(e.x, e.y + 2, 12);
    // 곤봉: 평소엔 어깨에 걸쳐 메고 → 내려찍기 준비 때 머리 뒤로 높이 → 내려찍는 순간 앞으로
    const f2 = f > 0 ? 1 : 0, tgt = e.slamT > 0 || (scoop && su < 0.6) ? (f2 ? 55 : 125) : up && e.rockT <= 0 ? (f2 ? -150 : -30) : (f2 ? -115 : -65);
    if (e._club == null) e._club = tgt * DEG; e._club = lerpAng(e._club, tgt * DEG, e.slamT > 0 ? 0.6 : 0.25);
    const hx = e.x + tr + o.dx + f * NM_HAND, hy = y - 7 + o.bob, back = Math.sin(e._club) < -0.3;
    if (back) drawBlade(BRUTE_CLUB, hx, hy, e._club, al, white);
    drawNM(e, 'nBrute', null, e.x + tr, y, o, white, al);
    if (!back) drawBlade(BRUTE_CLUB, hx, hy, e._club, al, white);
    if (e.slamT > 0.12 && !white) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,220,150,.6)'; for (let t = 8; t < 34; t += 2) ctx.fillRect(snap2(hx + Math.cos(e._club - 0.5 * f) * t), snap2(hy + Math.sin(e._club - 0.5 * f) * t), 2, 2); ctx.restore(); } // 휘두른 자국
    if (scoop && e.rockT > 0 && !white) { const r = easeOut(clamp((su - 0.2) / 0.8, 0, 1)); drawSprite('boulder', 'deco', 2, e.scoopX, e.y + 7 - r * 30, false, { rot: r * 2 }); if (Math.random() < 0.5) dust(e.scoopX + rand(-6, 6), e.y, 1); } // 바닥에서 솟아오르는 바위
    if (up && st === 'wind' && e.rockT <= 0) holdGlow(e.x, e.y - 34, k, '255,180,60');
    if (scoop && su < 0.3 && !white) holdGlow(e.scoopX, e.y - 2, 1 - su / 0.3, '255,200,120'); // 내려친 자리
    if (e.grogiT > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 14), Math.round(e.y - 36 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); }
  }


  // ---------- 엘리트: 가시등 멧돼지
  function boarTick(e, dt) {
    if (!e.enraged && e.hp < e.maxHp * 0.5 && !e.dead) {
      e.enraged = true; e.spd *= 1.2;
      G.fx.push({ kind: 'ring', x: e.x, y: e.y - 14, r: 8, t: 0.5, max: 0.5, c: '#ff4030', grow: 300 }); addShake(5); sfx('roar'); alertMark(e, 50, true);
    }
    if (e.state === 'wind' && e.pat === 'rush' && Math.random() < dt * 24) { dust(e.x - e.face * 10, e.y, 1); G.parts.push({ x: e.x - e.face * 12, y: e.y - 2, vx: -e.face * rand(30, 70), vy: -rand(20, 50), t: 0.3, c: '#5a4a36', g: 200 }); }
    if (e.enraged && Math.random() < 0.3) G.parts.push({ x: e.x + e.face * 18, y: e.y - 12, vx: e.face * 20, vy: -10, t: 0.35, c: '#c8c0c0', g: 0 });
  }
  function updateBoar(e, dt, d, a, moveTo) {
    const P = G.player;
    if (e.state === 'dash') {
      const sp = e.enraged ? 420 : 380;
      e.x += Math.cos(e.lockAng) * sp * dt; e.y += Math.sin(e.lockAng) * sp * dt;
      if (Math.random() < 0.8) dust(e.x - Math.cos(e.lockAng) * 10, e.y, 1);
      if (Math.random() < 0.5) G.fx.push({ kind: 'ghost', x: e.x, y: e.y, face: e.face, rot: 0, t: 0.18, max: 0.18, map: 'boar', pal: 'shadeBoar', sc: 2, glowy: true });
      if (!e.hitPlayer && dist(e, P) < e.r + P.r + 4) { e.hitPlayer = true; hurtPlayer(e.atk, e); }
      const wall = e.x < A.x0 + e.r + 1 || e.x > A.x1 - e.r - 1 || e.y < A.y0 + e.r + 1 || e.y > A.y1 - e.r - 1 || dashBlocked(e);
      if (e.t <= 0 || wall) {
        solveObs(e, e.r);
        e.x = clamp(e.x, A.x0 + e.r + 2, A.x1 - e.r - 2); e.y = clamp(e.y, A.y0 + e.r + 2, A.y1 - e.r - 2);
        dust(e.x, e.y, 10); addShake(wall ? 6 : 3, e.lockAng);
        if (wall) { debris(e.x, e.y, 12); sfx('blast'); G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 8, t: 0.35, max: 0.35, c: '#ff8060', grow: 200 }); }
        e.chargesLeft--;
        if (e.chargesLeft > 0) boarRush(e, angTo(e, P), e.chargesLeft, true);
        else { e.state = 'recover'; e.t = 1.1; e.cd = rand(1.4, 2.0); }
      }
      return;
    }
    if (e.state !== 'chase') return;
    if (d > 70) moveTo(a, e.spd); else moveTo(a + Math.PI / 2, e.spd * 0.5);
    if (e.cd > 0) return;
    if (d < 64) boarGore(e, a);
    else if (Math.random() < 0.4) boarQuills(e);
    else boarRush(e, a, e.enraged ? 4 : 3);
  }
  function boarRush(e, a, n, quick) { // 연속 돌진: 매번 방향을 다시 잡는다
    e.chargesLeft = n; e.state = 'wind'; e.pat = 'rush'; e.lockAng = a; e.face = Math.cos(a) > 0 ? 1 : -1;
    if (!quick) alertMark(e, 40); sfx('warn');
    G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 250, w: 24, t: 0, dur: quick ? 0.5 : 0.9, owner: e, heavy: true,
      onFire: () => { e.state = 'dash'; e.t = 0.66; e.hitPlayer = false; sfx('whoosh'); } });
  }
  function boarQuills(e) { // 등가시 난사
    e.state = 'wind'; e.pat = 'quill'; alertMark(e, 40); sfx('warn');
    G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 38, t: 0, dur: 0.85, owner: e,
      onFire: tt => {
        hitShape(tt, e.atk * 0.8);
        for (let ring = 0; ring < (e.enraged ? 2 : 1); ring++) for (let k = 0; k < 12; k++) { const aa = k / 12 * TAU + ring * TAU / 24; G.eproj.push({ x: e.x + Math.cos(aa) * 14, y: e.y + Math.sin(aa) * 10, ang: aa, sp: 210 - ring * 50, r: 3, dmg: e.atk * 0.6, t: 1.5, hist: [], kind: 'quill' }); }
        G.fx.push({ kind: 'ring', x: e.x, y: e.y - 10, r: 6, t: 0.3, max: 0.3, c: '#f0e8d0', grow: 200 }); addShake(4); sfx('heavy');
        e.state = 'recover'; e.t = 0.7; e.cd = rand(1.2, 1.8);
      } });
  }
  function boarGore(e, a) { // 엄니 올려치기
    e.state = 'wind'; e.pat = 'gore'; e.face = Math.cos(a) > 0 ? 1 : -1; e.lean = 0.2 * e.face; sfx('warn');
    G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: a, arc: 100 * DEG, r: 56, t: 0, dur: 0.6, owner: e,
      onFire: tt => {
        e.x += Math.cos(tt.ang) * 16; e.y += Math.sin(tt.ang) * 16; e.lean = -0.35 * e.face;
        hitShape(tt, e.atk * 1.1);
        G.fx.push({ kind: 'claw', x: e.x, y: e.y - 8, ang: tt.ang, r: 40, w: 3, c: '255,240,220', glow: true, t: 0.22, max: 0.22 });
        G.fx.push({ kind: 'arcwave', x: e.x, y: e.y - 6, ang: tt.ang, arc: tt.arc, r0: 12, r1: 66, t: 0.25, max: 0.25, c: '255,200,170' });
        addShake(4, tt.ang); sfx('heavy');
        e.state = 'recover'; e.t = 0.7; e.cd = rand(0.9, 1.4);
      } });
  }
  Object.assign(MAPS, {"boLegBF": [",................................,", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "....kkkk..........................", "....kDDk..........................", "....khhk..........................", ".....kkk..........................", ".................................."], "boLegBN": [",................................,", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "........kkkkk.....................", "........kDddk.....................", "........khhhk.....................", ".........kkk......................", ".................................."], "boLegFF": [",................................,", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "................kkkk..............", "................kDDk..............", "................khhk..............", ".................kkk..............", ".................................."], "boLegFN": [",................................,", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "....................kkkkk.........", "....................kDddk.........", "....................khhhk.........", ".....................kkk..........", ".................................."], "boQuill": [",................................,", "........k..k......................", "......kkbkkbkk....................", ".....kbkkbbkbbkk..................", "...k.kbbkbbkbbkkk.................", "..kbkkbkkkkkkkk...................", "...kbkk...........................", "....k.............................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", "..................................", ".................................."], "boBody": [",...................k............,", "...................kdk............", "...................kpDk...........", ".................kkdpDkkkkk.......", ".................kdddDDLLLL.......", "...............kkdDLLLLLLLd.......", ".......kkkkkkkkDdDLLLLLLddd.......", "k..k.kkLLLLLLLDdDLLLLLddkkk.......", "Dk.kkLLLLLLddddDdLLddddddke.......", "kDkLLLLdddddddDdDddddddddke.......", "kdkddddddddddddDddddddddddd.......", ".kkdddddddddddddDddddddddDD.......", "..kddddddddddDDDDddddddDDDD.......", "...kddddddDDDDDDDDdddDDDDDD.......", "....kdDDDDDDDDDDDDDDDDDkkkw.......", "....kkkkkkkkkDDDkkkkkkkkkDD.......", ".............kkk.........kk.......", "..................................", "..................................", "..................................", ".................................."], "boHead": [",................................,", "..................................", "..................................", ".......................kkkk.......", ".......................LLLLk......", ".......................LLLddk.....", ".......................Ldddddk....", ".......................dkkkDddk...", ".......................ddkedddk...", ".......................ddkeddpkk..", ".......................ddddpppPPk.", ".......................ddDDpppPk..", ".......................DDDDwppPPk.", ".......................DDDDwppPk..", ".......................kkkwwkpk...", ".......................kkDDk.k....", "..................................", "..................................", "..................................", "..................................", ".................................."]}); // v1.37 멧돼지·고블린 대장 부위 분리 (첫 줄 양끝 ',' = 투명 기준점)
  // v1.37 가시등 멧돼지 움직임: 몸통·머리·등가시·다리 넷을 따로 2px 칸 단위로
  //   종종걸음 4장면(대각선 다리 짝이 번갈아 앞으로 들림, 머리 끄덕임) / 돌진 준비: 머리를 낮추고 몸을 뒤로 빼며 앞발로 땅을 긁음
  //   돌진: 다리를 앞뒤로 쭉 뻗었다 모으는 질주 2장면(늘이기 제거) / 가시 준비: 웅크리며 등가시가 곤두섬 / 엄니 올려치기: 머리를 숙였다 위로 쳐올림
  function drawBoar(e, ya, al) { // v2.44 새 도트 (옆모습 2등신)
    const white = e.flash > 0, st = e.state, k = e.glow || 0, o = nmPose(e), f = e.face;
    let tr = 0;
    if (st === 'wind' && e.pat === 'rush') { o.rot = 0; o.sy = 0.9; o.sx = 1.08; o.dx = -2 * f; if (k > 0.6) tr = Math.floor(time * 18) % 2 ? 2 : 0; }
    if (st === 'dash') { o.rot = 0; o.wf = Math.floor(time * 22) % 4; o.sx = 1.08; o.sy = 0.94; }
    if (st === 'wind' && e.pat === 'quill') { o.sy = 0.9; if (k > 0.6) tr = Math.floor(time * 18) % 2 ? 2 : 0; }
    if (st === 'wind' && e.pat === 'gore') { o.rot = 0.2 * f; o.dx = -2 * f; }
    if (st === 'recover' && e.pat === 'gore' && e.t > 0.45) { o.rot = -0.25 * f; o.dx = 4 * f; }
    const by = e.y + 3 + ya;
    drawShadow(e.x, e.y + 2, 14);
    drawNM(e, 'nBoar', null, e.x + tr, by, o, white, al);
    if (!white && st === 'wind' && e.pat === 'quill' && k > 0.3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,240,200,${0.3 + 0.5 * k})`; for (let i = 0; i < 3; i++) ctx.fillRect(snap2(e.x + tr + (-12 + i * 6) * f), snap2(by - 24 - (i % 2) * 2), 2, 2); ctx.restore(); }
    if (e.grogiT > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 14), Math.round(e.y - 30 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); }
  }


  // ---------- 고블린 아처의 활
  function drawBow(e, ya) {
    const aim = e.state === 'wind' ? e.lockAng : (e.face > 0 ? 0.5 : Math.PI - 0.5);
    const hx = e.x + Math.cos(aim) * 6, hy = e.y - 13 + ya + Math.sin(aim) * 3, pull = e.state === 'wind' ? Math.min(1, e.glow * 1.3) : 0;
    const ux = Math.cos(aim), uy = Math.sin(aim), nx = -uy, ny = ux, R = 9;
    const pts = []; for (let i = -4; i <= 4; i++) { const t = i / 4, bend = (1 - t * t) * 4; pts.push({ x: hx + nx * t * R + ux * bend, y: hy + ny * t * R + uy * bend }); }
    const sx = hx - ux * (1 + pull * 6), sy = hy - uy * (1 + pull * 6);
    ctx.strokeStyle = 'rgba(220,210,190,.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(sx, sy); ctx.lineTo(pts[8].x, pts[8].y); ctx.stroke();
    for (const q of pts) { ctx.fillStyle = '#0b0a0e'; ctx.fillRect(Math.round(q.x) - 1, Math.round(q.y) - 1, 3, 3); }
    for (const q of pts) { ctx.fillStyle = '#7a5232'; ctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }
    if (pull > 0) {
      ctx.strokeStyle = '#0b0a0e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx + ux * 7, hy + uy * 7); ctx.stroke();
      ctx.strokeStyle = '#a07a50'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx + ux * 7, hy + uy * 7); ctx.stroke();
      ctx.fillStyle = '#d8dce4'; ctx.fillRect(Math.round(hx + ux * 7) - 1, Math.round(hy + uy * 7) - 1, 2, 2);
      if (pull > 0.75 && Math.floor(time * 20) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(hx + ux * 8), Math.round(hy + uy * 8), 1, 1); }
    }
  }

  // ================================================================ 1스테이지: 빛바랜 초원 — 슬라임 · 고블린 · 점액왕
  const isSlime = e => e.type === 'slime' || e.type === 'bigslime' || e.kind === 'slimeking';
  const bloodOf = e => e.rs ? '#8f1418' /* v3.20 용의 유적 혈액 슬라임 · 용종 */ : e.type === 'ghost' ? '#9cc1ea' : e.type === 'crow' ? '#3a3446' : e.type === 'mother' ? '#6a8a2a' : isSlime(e) ? '#7ac843' : '#8f1418';
  const splatOf = e => isSlime(e) && !e.rs ? '60,120,30' : '110,10,16';
  const SLIME_COL = {
    slime: { k: '#0c160a', d: '#3a7a26', m: '#62b03a', l: '#b8f080' },
    bigslime: { k: '#081414', d: '#1f6a6a', m: '#3aa8a0', l: '#a0f0e0' },
    king: { k: '#0a1408', d: '#2e6a20', m: '#5aa032', l: '#a8e070' },
    toxslime: { k: '#120816', d: '#4a2060', m: '#7a3a92', l: '#d090f0' },
    kingR: { k: '#160810', d: '#6a2050', m: '#a0407a', l: '#f0a0d0' },
  };
  // 픽셀 돔(점액) 그리기
  function drawBlob(cx, by, w, h, C, o = {}) {
    const px = 2, rows = Math.max(3, Math.round(h / px));
    const rowW = t => (w / 2) * Math.sqrt(Math.max(0, 1 - Math.pow(1 - t, 2))) * (t > 0.85 ? 1 - (t - 0.85) * 0.8 : 1);
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 0.92 : o.alpha;
    const top = Math.round(by - h); let topX = cx;
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < rows; i++) {
      const t = (i + 0.5) / rows, J = o.jelly, wv = J ? 1 + Math.sin(i * 0.55 - (J.t != null ? J.t : time) * 7 + J.ph) * J.wave * (1 - t * 0.6) : 1, hw = Math.round(rowW(t) * wv / px) * px + (pass === 0 ? px : 0), y = top + i * px - (pass === 0 && i === 0 ? px : 0);
      if (hw <= 0) continue;
      const X = J ? Math.round((cx + J.lean * h * (1 - t) * (1 - t) * 0.9 + Math.sin((J.t != null ? J.t : time) * 5 - t * 4 + J.ph) * J.wave * 20 * (1 - t)) / px) * px : cx; if (i === 2) topX = X;
      if (pass === 0) { ctx.fillStyle = o.white ? '#ffffff' : C.k; ctx.fillRect(Math.round(X - hw), y, hw * 2, px + (i === rows - 1 ? px : 0) + (i === 0 ? px : 0)); continue; }
      ctx.fillStyle = o.white ? '#ffffff' : C.m; ctx.fillRect(Math.round(X - hw), y, hw * 2, px);
      if (!o.white) {
        const sh = Math.max(px, Math.round(hw * 0.35 / px) * px);
        ctx.fillStyle = C.d; ctx.fillRect(Math.round(X + hw - sh), y, sh, px);
        if (i >= rows - 2) ctx.fillRect(Math.round(X - hw), y, hw * 2, px);
      }
    }
    if (!o.white && !o.noShine) { // v2.93 noShine: 왼쪽 위 반사광 없이 (점액왕)
      ctx.fillStyle = C.l;
      ctx.fillRect(Math.round(topX - w * 0.22) & ~1, top + px * 2, px * 2, px); ctx.fillRect(Math.round(topX - w * 0.28) & ~1, top + px * 3, px, px * 2);
      if (o.jelly) { ctx.fillRect(Math.round(topX - w * 0.16) & ~1, top + px * 2, px * 3, px); ctx.globalAlpha *= 0.6; ctx.fillRect(Math.round(topX - w * 0.32) & ~1, top + px * 6, px, px * 3); }
    }
    ctx.restore();
  }
  function stepHop(e, dt) {
    const h = e.hop; h.t += dt;
    const k = Math.min(1, h.t / h.dur);
    e.x += Math.cos(h.ang) * h.sp * dt; e.y += Math.sin(h.ang) * h.sp * dt;
    e.z = Math.sin(k * Math.PI) * h.h;
    if (Math.abs(Math.cos(h.ang)) > 0.2) e.face = Math.cos(h.ang) > 0 ? 1 : -1;
    if (k >= 1) { e.hop = null; e.z = 0; e.squash = 0.18; dust(e.x, e.y, 2); }
  }
  function updateSlime(e, dt, d, a) {
    const P = G.player, big = e.type === 'bigslime';
    if (e.state === 'chase') {
      if (e.hop) stepHop(e, dt);
      else if (d < (big ? 48 : 38) && e.cd <= 0) { e.state = 'sqz'; e.t = big ? 0.7 : 0.55; e.holdMax = e.t; e.face = Math.cos(a) > 0 ? 1 : -1;
        const dd0 = Math.min(d, big ? 72 : 58); e.lockX = e.x + Math.cos(a) * dd0; e.lockY = e.y + Math.sin(a) * dd0; /* v3.65 웅크릴 때 착지점 고정 */
        weakTele(e, { shape: 'circle', x: e.lockX, y: e.lockY, r: e.r + (big ? 14 : 10) }, e.t + 0.3, ['sqz', 'leap']); }
      else { e.hopT = (e.hopT || 0) - dt; if (e.hopT <= 0) { e.hopT = rand(0.3, 0.6); e.hop = { t: 0, dur: 0.42, ang: steer(e, a) + rand(-0.4, 0.4), sp: e.spd, h: big ? 9 : 7 }; } }
    } else if (e.state === 'sqz') {
      if (e.t <= 0) {
        const lk = e.lockX != null ? { x: e.lockX, y: e.lockY } : P, ang = angTo(e, lk), dd = Math.min(dist(e, lk), big ? 72 : 58); e.lockX = null;
        e.state = 'leap'; e.hop = { t: 0, dur: 0.3, ang, sp: dd / 0.3, h: big ? 22 : 16 }; sfx('swing');
      }
    } else if (e.state === 'leap') {
      if (e.hop) stepHop(e, dt);
      if (!e.hop) {
        if (dist(e, P) < e.r + P.r + (big ? 14 : 10)) hurtPlayer(e.atk, e);
        G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 6, grow: big ? 200 : 140, t: 0.25, max: 0.25, c: e.rs ? '#ff8a6a' : big ? '#a0f0e0' : '#b8f080' }); // v3.20 용의 유적 혈액 슬라임은 붉게
        splat(e.x, e.y, big ? 14 : 8, splatOf(e)); dust(e.x, e.y, big ? 8 : 4); if (big) addShake(3);
        e.state = 'recover'; e.t = 0.6; e.cd = rand(0.9, 1.5);
      }
    }
  }
  function drawSlime(e, ya, al) {
    const big = e.type === 'bigslime', tox = e.type === 'toxslime', C = SLIME_COL[e.type], white = e.flash > 0, z = e.z || 0;
    const w0 = big ? 34 : tox ? 24 : 22, h0 = big ? 26 : tox ? 18 : 16;
    let sx = 1, sy = 1, tr = 0;
    const M = nrMotion(e); // v1.54 칸 단위
    if (e.state === 'sqz' || e.state === 'spit') { const k = 1 - e.t / e.holdMax; sx = 1 + 0.3 * k; sy = 1 - 0.3 * k; tr = k > 0.6 ? (Math.floor(time * 16) % 2) * 2 : 0; }
    else if (z > 0) { sx = 0.88; sy = 1.14; }
    else if (e.squash > 0) { const k = e.squash / 0.18; sx = 1 + 0.25 * k; sy = 1 - 0.22 * k; }
    else if (M.m === 'hurt') { const a = [2, 1, 0, 0][M.f]; sx = 1 + a * 4 / w0; sy = 1 - a * 2 / h0; }
    else { const a = [0, 0, 1, 1][M.f]; sx = 1 + a * 4 / w0; sy = 1 - a * 2 / h0; }
    sx = Math.round(w0 * sx / 4) * 4 / w0; sy = Math.round(h0 * sy / 2) * 2 / h0;
    drawShadow(e.x, e.y + 1, (big ? 16 : 11) * (1 - Math.min(0.5, z / 60)));
    const cx = Math.round(e.x + tr) & ~1, by = Math.round(e.y + 2 + ya - z) & ~1;
    drawBlob(cx, by, w0 * sx, h0 * sy, C, { white, alpha: 0.92 * al });
    if (!white && !tox) { // v1.52 속이 비치는 점액: 삼킨 투구·뼈·손이 몸속을 천천히 떠돎
      if (e.gut == null) e.gut = big ? 3 : randi(0, 2);
      const GUT = [['.ggg.', 'gGGgd', 'gddkd', '.d.d.'], ['W...W', 'WWWWW', 'W...W'], ['.w.w.', 'wwwww', 'wwww.', '.www.']], GC = { g: '#9aa0ac', G: '#d8dce4', d: '#6a707c', k: '#1a1a1a', W: '#e8e0cc', w: '#d8b8a0' };
      const ph = Math.floor(time * 1.6 + e.x * 0.05) % 6, PX = [0, 1, 1, 0, -1, -1], PY = [0, 0, -1, -1, -1, 0];
      ctx.save(); ctx.globalAlpha = 0.7 * al;
      for (const [gi, ox, ob] of e.gut === 3 ? [[0, -6, 2], [1, 1, 3]] : [[e.gut, -3, 2]]) { const g = GUT[gi], x0 = cx + (ox + PX[(ph + gi * 2) % 6]) * 2, y0 = by - (ob + g.length + PY[(ph + gi * 2) % 6]) * 2;
        g.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') { ctx.fillStyle = GC[row[i]]; ctx.fillRect(x0 + i * 2, y0 + j * 2, 2, 2); } }); }
      ctx.restore();
    }
    if (!white) {
      const ey = Math.round(by - h0 * (e._nrSy || sy) * 0.6) & ~1, ex = (cx + e.face * 2) & ~1; e._nrSy = sy;
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(ex - 6, ey, 4, 4); ctx.fillRect(ex + 2, ey, 4, 4);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(ex - 6, ey, 2, 2); ctx.fillRect(ex + 2, ey, 2, 2);
      if (tox) { ctx.fillStyle = '#9ae060'; ctx.fillRect(Math.round(cx - 7), Math.round(by - h0 * 0.35), 2, 2); ctx.fillRect(Math.round(cx + 5), Math.round(by - h0 * 0.25), 2, 2); ctx.fillRect(Math.round(cx - 1), Math.round(by - h0 * 0.8), 2, 2); }
      if (big) { ctx.fillStyle = 'rgba(10,30,30,.5)'; ctx.fillRect(Math.round(cx - 3), Math.round(by - h0 * 0.3), 4, 3); ctx.fillRect(Math.round(cx + 5), Math.round(by - h0 * 0.45), 2, 2); }
    }
    if (e.state === 'sqz' || e.state === 'spit') holdGlow(cx, by - h0 * 0.5, 1 - e.t / e.holdMax, big ? '120,255,230' : tox ? '200,110,255' : '160,255,90');
  }

  // ---------- 점액왕 구루그
  function spawnSlimeKing() {
    const P0 = G.player, S = STG(), b = makeEnemy('ghoul', clamp(P0.x, A.x0 + 80, A.x1 - 80), clamp(P0.y - 170, A.y0 + 50, A.y1 - 50));
    Object.assign(b, { type: 'boss', kind: 'slimeking', r: 22, hp: 2400 * S.hpMul, maxHp: 2400 * S.hpMul, atk: 15 * S.atkMul, def: 50, spd: 40, kbRes: 0, grogiMax: 90,
      stage: 1, state: 'idle', cd: 1.6, shield: false, summonT: 4, nextPat: 0, blade: null, rise: 0.8, z: 0, squash: 0, rollA: 0 });
    ascBoss(b);
    G.boss = b; G.enemies.push(b);
    dust(b.x, b.y, 30); splat(b.x, b.y, 40, '60,120,30');
    G.fx.push({ kind: 'skybeam', x: b.x, y: b.y, w: 60, c: '140,230,90', t: 0.7, max: 0.7 });
    bossRoar(b, '#8fe060');
  }
  function slimeKingStage(b) {
    const pct = b.hp / b.maxHp;
    if (b.stage === 1 && pct <= 0.65) { b.stage = 2; banner('2단계', '새끼 점액 소환 · 연속 도약'); bossRoar(b, '#8fe060'); cancelTele(b); b.state = 'idle'; b.cd = 0.6; b.z = 0; b.summonT = 0; }
    if (b.stage === 2 && pct <= 0.3) { b.stage = 3; banner('폭주', '점액왕이 날뛴다'); bossRoar(b, '#ff60b0'); cancelTele(b); b.state = 'idle'; b.cd = 0.6; b.z = 0; b.spd *= 1.3; }
  }
  function updateSlimeKing(b, dt) {
    const P = G.player;
    // 말캉함 (v0.87): 세로 늘어남(jy)과 기울기(jl)를 감쇠 스프링으로 — 맞거나 착지하면 출렁, 움직이면 윗부분이 늦게 따라온다
    { const z = b.z || 0, T = b.grogiT > 0 ? -0.2 : b.squash > 0 ? -0.24 * Math.min(1, b.squash / 0.3) : z > 4 ? 0.2 : b.state === 'roll' ? -0.1 : 0;
      if (b.flash > (b._pf || 0) + 0.01) { b.jyv = (b.jyv || 0) - 3.2 - Math.random() * 1.5; b.jlv = (b.jlv || 0) + Math.sign(b.x - P.x || 1) * (1.6 + Math.random()); } b._pf = b.flash;
      if ((b._pz || 0) > 4 && z <= 4) b.jyv = (b.jyv || 0) - 4.5; b._pz = z;
      if (b.squash > (b._psq || 0) + 0.05) b.jyv = (b.jyv || 0) - 3; b._psq = b.squash;
      const st = Math.min(dt, 1 / 30); b.jyv = (b.jyv || 0) + (-170 * ((b.jy || 0) - T) - 7 * (b.jyv || 0)) * st; b.jy = clamp((b.jy || 0) + b.jyv * st, -0.42, 0.42);
      const mvx = (b.x - (b._px == null ? b.x : b._px)) / Math.max(dt, 1e-3); b._px = b.x;
      b.jlv = (b.jlv || 0) + (-110 * ((b.jl || 0) - clamp(-mvx / 900, -0.25, 0.25)) - 6 * (b.jlv || 0)) * st; b.jl = clamp((b.jl || 0) + b.jlv * st, -0.35, 0.35); }
    b.flash = Math.max(0, b.flash - dt); b.rise = Math.max(0, b.rise - dt); b.squash = Math.max(0, b.squash - dt);
    b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= Math.pow(0.001, dt); b.vy *= Math.pow(0.001, dt);
    b.glow = 0;
    for (const t of G.tele) if (t.owner === b && t.shape !== 'spawn') b.glow = Math.max(b.glow, t.t / t.dur);
    if (Math.random() < 0.4) G.parts.push({ x: b.x + rand(-20, 20), y: b.y - rand(0, 8) - b.z, vx: 0, vy: rand(10, 30), t: 0.5, c: pick(['#5aa032', '#2e6a20']), g: 80, floor: b.y + 2 });
    G.bossTime -= dt;
    if (G.bossTime <= 0 && !b.wipe) {
      b.wipe = true; cancelTele(b); banner('전멸기', '제한 시간 초과');
      sfx('roar'); G.tele.push({ shape: 'circle', x: CX, y: CY, r: 700, t: 0, dur: 2.0, owner: b, heavy: true, onFire: () => { hurtPlayer(9999, b, true); flashT = 0.3; flashColor = '#ffffff'; } });
    }
    if (b.grogiT > 0) { b.grogiT -= dt; b.z = Math.max(0, b.z - dt * 300); if (b.grogiT <= 0) { b.state = 'idle'; b.cd = 0.8; } return; }
    if (b.state === 'wind') return;
    if (P.dead) return;
    const enr = b.stage === 3, d = dist(b, P), a = angTo(b, P);
    if (b.state === 'idle' && Math.abs(Math.cos(a)) > 0.2) b.face = Math.cos(a) > 0 ? 1 : -1;
    if (b.stage >= 2 && b.state === 'idle') {
      b.summonT -= dt;
      if (b.summonT <= 0) {
        b.summonT = enr ? 14 : 18;
        if (G.enemies.filter(e => !e.dead && e.type === 'slime').length < 6) {
          for (let i = 0; i < 3; i++) {
            const pt = { x: clamp(b.x + rand(-100, 100), A.x0 + 30, A.x1 - 30), y: clamp(b.y + rand(-50, 70), A.y0 + 30, A.y1 - 30) };
            G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: 10, t: 0, dur: 0.8, owner: b, onFire: () => { G.enemies.push(makeEnemy('slime', pt.x, pt.y)); burst(pt.x, pt.y - 6, '#7ac843', 10); } });
          }
          b.state = 'cast'; b.t = 0.9; b.squash = 0.3; sfx('warn');
          for (let i = 0; i < 16; i++) { const aa = rand(0, TAU), sp = rand(60, 160); G.parts.push({ x: b.x, y: b.y - 20, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.6 - 60, t: rand(0.4, 0.8), c: pick(['#62b03a', '#b8f080']), g: 280, floor: b.y + rand(-10, 20) }); }
          return;
        }
      }
    }
    if (b.state === 'cast' || b.state === 'recover') { b.t -= dt; if (b.t <= 0) { b.state = 'idle'; b.cd = enr ? 0.35 : 0.75; } return; }
    if (b.state === 'jump') {
      b.jt += dt;
      if (b.jt < 0) { b.squash = Math.max(b.squash, 0.3); return; } // 웅크림
      const k = Math.min(1, b.jt / b.jdur), kk = k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
      b.x = b.jx0 + (b.jtx - b.jx0) * kk; b.y = b.jy0 + (b.jty - b.jy0) * kk;
      b.z = Math.sin(k * Math.PI) * 90;
      return;
    }
    if (b.state === 'roll') {
      const sp = enr ? 430 : 370;
      b.x += Math.cos(b.lockAng) * sp * dt; b.y += Math.sin(b.lockAng) * sp * dt; b.dashLeft -= sp * dt; b.rollA += dt * 18 * b.face;
      if (Math.random() < 0.9) splat(b.x + rand(-10, 10), b.y + rand(-3, 3), 3, '60,120,30');
      if (Math.random() < 0.6) dust(b.x, b.y, 1);
      if (!b.hitPlayer && dist(b, P) < b.r + P.r + 4) { b.hitPlayer = true; hurtPlayer(b.atk * 1.15, b); }
      if (b.dashLeft <= 0 || b.x < A.x0 + b.r || b.x > A.x1 - b.r || b.y < A.y0 + b.r || b.y > A.y1 - b.r || dashBlocked(b)) {
        solveObs(b, b.r); b.x = clamp(b.x, A.x0 + b.r, A.x1 - b.r); b.y = clamp(b.y, A.y0 + b.r, A.y1 - b.r);
        b.state = 'recover'; b.t = enr ? 0.6 : 0.95; b.squash = 0.3; addShake(7, b.lockAng); sfx('blast');
        G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 10, t: 0.4, max: 0.4, c: '#b8f080', grow: 240 });
        if (b.stage >= 2) kingBurst(b, 6);
      }
      return;
    }
    // idle: 출렁이며 다가온다. 멀면 더 빨리 좁혀 오고 다음 패턴도 빨리 고른다 (v0.88)
    const far = d > 200;
    if (d > 80) { const sp = b.spd * (far ? 1.6 : 1); b.x += Math.cos(a) * sp * dt; b.y += Math.sin(a) * sp * dt; b.walk += dt * (far ? 6 : 4); }
    b.cd -= dt * (far ? 1.6 : 1);
    if (b.cd > 0) return;
    // v0.88: 거리별 가중치 — 멀면 도약·구르기로 붙고, 제자리 산성 뱉기는 가끔만. 뱉기는 연속 금지
    let pat = far ? wpick2([['jump', 5], ['roll', 4], ['spit', b.lastPat === 'spit' ? 0 : 1.2]])
      : d > 90 ? wpick2([['jump', 3], ['roll', 3], ['spit', b.lastPat === 'spit' ? 0 : 1.5]])
      : wpick2([['jump', 4], ['roll', 2]]);
    b.lastPat = pat;
    if (pat === 'jump') kingJump(b, enr ? 3 : b.stage >= 2 ? 2 : 1, 0.45);
    else if (pat === 'spit') kingSpit(b, a);
    else kingRoll(b, a);
  }
  function kingJump(b, n, crouch) {
    const P = G.player;
    b.jumpsLeft = n - 1; b.state = 'jump'; b.jt = -crouch; b.jdur = 0.85;
    b.jx0 = b.x; b.jy0 = b.y; b.jtx = clamp(P.x, A.x0 + 30, A.x1 - 30); b.jty = clamp(P.y, A.y0 + 30, A.y1 - 30);
    if (Math.abs(b.jtx - b.x) > 4) b.face = b.jtx > b.x ? 1 : -1;
    alertMark(b, 70, true); sfx('warn');
    G.tele.push({ shape: 'circle', x: b.jtx, y: b.jty, r: 72, t: 0, dur: crouch + b.jdur, owner: b, heavy: true, onFire: tt => kingLand(b, tt) });
  }
  function kingLand(b, tt) {
    b.x = tt.x; b.y = tt.y; b.z = 0; b.squash = 0.35;
    sigHit(() => hitShape(tt, b.atk * 1.2)); // v1.50 점액왕 도약 착지도 대표 패턴
    G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 10, t: 0.45, max: 0.45, c: '#b8f080', grow: 300 });
    G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 6, t: 0.3, max: 0.3, c: '#ffffff', grow: 200 });
    for (let i = 0; i < 6; i++) G.fx.push({ kind: 'arcwave', x: b.x, y: b.y, ang: i / 6 * TAU + rand(-0.2, 0.2), arc: 40 * DEG, r0: 12, r1: 80, t: 0.3, max: 0.3, c: '150,230,90' });
    for (let i = 0; i < 30; i++) { const aa = rand(0, TAU), sp = rand(60, 220); G.parts.push({ x: b.x, y: b.y - 6, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.6 - 60, t: rand(0.4, 0.8), c: pick(['#62b03a', '#b8f080', '#3a7a26']), g: 300, floor: b.y + rand(-8, 14) }); }
    splat(b.x, b.y, 50, '60,120,30'); dust(b.x, b.y, 20); crack(b.x, b.y);
    addShake(10); sfx('blast'); flashT = 0.05; flashColor = '#b8f080';
    if (b.stage >= 2) kingBurst(b, 8);
    if (b.jumpsLeft > 0) { const left = b.jumpsLeft; kingJump(b, left, 0.3); b.jumpsLeft = left - 1; }
    else { b.state = 'recover'; b.t = b.stage === 3 ? 0.7 : 1.1; }
  }
  function kingBurst(b, n) { // 사방으로 점액 덩어리
    for (let i = 0; i < n; i++) { const aa = i / n * TAU + rand(-0.1, 0.1); G.eproj.push({ x: b.x + Math.cos(aa) * 20, y: b.y + Math.sin(aa) * 14, ang: aa, sp: 150, r: 5, dmg: b.atk * 0.6, t: 1.6, hist: [], kind: 'acid' }); }
  }
  function kingSpit(b, a) {
    const n = b.stage >= 2 ? 7 : 5, spread = 0.85;
    b.state = 'wind'; b.squash = 0.4; alertMark(b, 70, true); sfx('warn');
    G.tele.push({ shape: 'cone', x: b.x, y: b.y, ang: a, arc: spread * 2 + 0.25, r: 150, t: 0, dur: 0.8, owner: b, follow: true,
      onFire: tt => {
        for (let k = 0; k < (b.stage === 3 ? 2 : 1); k++) for (let i = 0; i < n; i++) {
          const ang = tt.ang + (i - (n - 1) / 2) * (spread * 2 / (n - 1)) + k * 0.12;
          G.eproj.push({ x: b.x + Math.cos(ang) * 22, y: b.y + Math.sin(ang) * 14, ang, sp: 190 - k * 40, r: 6, dmg: b.atk * 0.8, t: 2.4, hist: [], kind: 'acid' });
        }
        b.squash = 0.3; sfx('whoosh'); sfx('fireball'); addShake(3, tt.ang);
        b.state = 'recover'; b.t = 0.7;
      } });
  }
  function kingRoll(b, a) {
    b.state = 'wind'; b.lockAng = a; b.face = Math.cos(a) > 0 ? 1 : -1; b.squash = 0.4; alertMark(b, 70, true); sfx('warn');
    G.tele.push({ shape: 'line', x: b.x, y: b.y, ang: a, len: 320, w: 46, t: 0, dur: 0.95, owner: b, heavy: true,
      onFire: () => { b.state = 'roll'; b.dashLeft = 320; b.hitPlayer = false; sfx('whoosh'); dust(b.x, b.y, 12); } });
  }
  let CROWN_G = null;
  // v2.93 점액왕: 눈 없이 삼킨 해골이 얼굴 자리에서 둥둥 떠다님 · 몸속 넓적다리뼈 · 갈비뼈 · 아래쪽 빛 띠 (왼쪽 위 반사광 없음)
  const SK_BONE = { w: '#e0d8c4', W: '#a49c88', s: '#24301c' };
  let SK_ART = null; // gOutline · fromRows는 05_dungeon.js에 있어서 처음 그릴 때 만든다
  const skArt = () => SK_ART || (SK_ART = { // 플레이어 캐릭터와 같은 2등신: 큰 해골 · 작은 늑골 · 짧은 팔 · 작은 골반
    skull: gOutline(fromRows(["..wwwwww..", ".wwwwwwwwW", "wwwwwwwwwW", "wssswwsssW", "wssswwsssW", "wwwwsswwwW", ".WwwwwwwW.", "..wswswW.."]), 's'),
    skullO: gOutline(fromRows(["..wwwwww..", ".wwwwwwwwW", "wwwwwwwwwW", "wssswwsssW", "wssswwsssW", "wwwwsswwwW", ".WwwwwwwW.", "..........", "..wswswW.."]), 's'), // 턱이 벌어짐
    rib: gOutline(fromRows([".wwwW.", "w.ww.W", ".wwwW.", "..wW.."]), 's'),
    armL: gOutline(fromRows(["..w", ".wW", "ww.", "w.w"]), 's'),
    armL2: gOutline(fromRows(["..w", "ww.", "w..", ".ww"]), 's'), // 팔이 다른 각도로 휘청
    pelvis: gOutline(fromRows(["wwwwwW", "w....W"]), 's'),
  });
  const flipG = g => g.map(r => r.slice().reverse());
  // 점액 속에 잠긴 색: 뼈 · 안구 색을 점액 색 쪽으로 섞는다 (점액 색마다 한 번만)
  const SK_TINT = {};
  const skTint = (pal, C, t) => { const k = C.m + t + Object.values(pal).join(); if (SK_TINT[k]) return SK_TINT[k];
    const hx = v => [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16)), m = hx(C.m), o = {};
    for (const q in pal) { const c = hx(pal[q]); o[q] = '#' + c.map((x, i) => Math.round(x + (m[i] - x) * t).toString(16).padStart(2, '0')).join(''); }
    return (SK_TINT[k] = o); };
  let SK_EYEBALL_G = null;
  Object.defineProperty(window, 'SK_EYEBALL', { configurable: true, get: () => SK_EYEBALL_G || (SK_EYEBALL_G = gOutline(fromRows(['.wwww.', 'wwwwwW', 'wwwwwW', 'rwwwwW', 'wrwwWW', '.WWWW.']), 's')) }); // 안구 6칸 (둥근 흰자 · 그늘 · 핏줄)
  const SK_DRIFT = [[0, 0], [2, 0], [4, -2], [4, -4], [2, -4], [0, -4], [-2, -2], [-2, 0]]; // 해골이 떠도는 길 (2px 칸)
  function drawSlimeKing(e, ya, al) {
    const C = SLIME_COL[e.stage === 3 ? 'kingR' : 'king'], white = e.flash > 0, z = e.z || 0;
    // 스프링 값으로 늘어나고(세로) 그만큼 퍼지며(가로, 부피 유지) — 시간은 초당 6장면, 크기는 가로 4px · 세로 2px 단위
    const tq = Math.floor(time * 6) / 6;
    let sy = 1 + (e.jy || 0) + Math.sin(tq * 4) * 0.04, sx = 1 / Math.sqrt(Math.max(0.3, sy)) * (1 + Math.max(0, -(e.jy || 0)) * 0.35);
    const GG = typeof GRG !== 'undefined' && GRG.ph(e); // v3.84 그로기: 웅덩이처럼 퍼짐 → 부르르 떨다가 뿅 부풀며 회복
    if (GG) { const h = GG.hold, pop = GG.rec > 0.7 ? Math.sin((GG.rec - 0.7) / 0.3 * Math.PI) * 0.28 : 0, qv = GG.rec > 0 && GG.rec <= 0.7 ? (Math.floor(time * 20) % 2 ? 0.07 : -0.07) : 0;
      sy = 1 - 0.42 * h + pop + (GG.br ? 0.04 : 0); sx = 1 + 0.42 * h - pop * 0.5 + qv; }
    const W0 = 64, H0 = 50, cx = Math.round(e.x) & ~1, by = Math.round(e.y + 2 + ya - z) & ~1;
    sx = Math.round(W0 * sx / 4) * 4 / W0; sy = Math.round(H0 * sy / 2) * 2 / H0;
    drawShadow(e.x, e.y + 2, 30 * (1 - Math.min(0.55, z / 200)));
    if (e.glow > 0 && !white) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = dRadial(ctx, cx, by - 24, 0, cx, by - 24, 50); gr.addColorStop(0, `rgba(160,255,90,${0.4 * e.glow})`); gr.addColorStop(1, 'rgba(160,255,90,0)'); ctx.fillStyle = gr.p(ctx); ctx.fillRect(cx - 50, by - 74, 100, 100); ctx.restore(); }
    drawBlob(cx, by, W0 * sx, H0 * sy, C, { white, noShine: true, alpha: 0.86 * al, jelly: { lean: Math.round(((e.jl || 0) + Math.sin(tq * 2.6) * 0.05) * 50) / 50, wave: 0.05 + Math.min(0.08, Math.abs(e.jyv || 0) * 0.012), ph: e.x * 0.01, t: tq } });
    const lx = (e.jl || 0) * H0 * sy * 0.5; // 이후 장식은 기울기 따라 옮긴다
    if (white) return;
    const h = H0 * sy, w = W0 * sx;
    // 몸속 유골 (반쯤 비침, 칸 단위로 천천히 떠돎): 얼굴 자리의 해골 · 아래쪽 넓적다리뼈 · 갈비뼈 조각
    ctx.save(); ctx.globalAlpha = 0.6 * al;
    // 해골 · 늑골 · 양팔뼈가 한 몸처럼 둥둥 떠다니며(초당 3칸), 턱이 딱딱거리고 팔이 제각각 휘청인다 — 기괴하게
    const A = skArt();
    // 뼈마다 2px씩 떨어져 있고, 저마다 다른 박자로 떠돈다 (해골 · 늑골 · 골반은 떠도는 길의 다른 칸, 팔은 따로 휘청)
    const fx = (Math.round(cx + e.face * 4 + lx * 0.62) & ~1) - 12, fy = Math.round(by - h * 0.88) & ~1, st = Math.floor(time * 3), N = SK_DRIFT.length;
    const at = (ph, half) => { const d = SK_DRIFT[(st + ph) % N]; return half ? [Math.round(d[0] / 4) * 2, Math.round(d[1] / 4) * 2] : d; };
    const dS = at(0), dR = at(3, true), dP = at(6, true), dAL = at(1, true), dAR = at(5, true);
    const jaw = Math.floor(time * 3.5) % 3 === 0, swL = Math.floor(time * 2.4) % 2, swR = Math.floor(time * 1.9 + 0.5) % 2;
    const BP = skTint(SK_BONE, C, 0.32); ctx.globalAlpha = 0.8 * al;
    gPaint(ctx, A.pelvis, BP, fx + 4 + dP[0] * e.face, fy + 36 + dP[1]);
    gPaint(ctx, swL ? A.armL2 : A.armL, BP, fx - 8 + dAL[0] * e.face, fy + 22 + dAL[1] + (swL ? 2 : 0));
    gPaint(ctx, flipG(swR ? A.armL2 : A.armL), BP, fx + 22 + dAR[0] * e.face, fy + 22 + dAR[1] + (swR ? 2 : 0));
    gPaint(ctx, A.rib, BP, fx + 4 + dR[0] * e.face, fy + 22 + dR[1]);
    gPaint(ctx, jaw ? A.skullO : A.skull, BP, fx + dS[0] * e.face, fy + dS[1]);
    // 점액 너머로 보이게: 몸속 물체 위로 점액 결(반투명 가로 띠)이 천천히 흘러내림
    ctx.globalAlpha = 0.32 * al; ctx.fillStyle = C.m;
    for (let k = 0; k < 7; k++) { const yy = (Math.round(by - h * 0.9) & ~1) + ((k * 8 + Math.floor(time * 3) * 2) % 56), t = (yy - (by - h)) / h; if (t <= 0.12 || t >= 0.9) continue; // 몸 모양(drawBlob과 같은 식) 안쪽으로만
      const hw = Math.round(w * 0.5 * Math.sqrt(Math.max(0, 1 - Math.pow(1 - t, 2))) * 0.8 / 2) * 2; ctx.fillRect(cx - hw + (lx * (1 - t) & ~1), yy, hw * 2, k % 2 ? 2 : 4); }
    ctx.globalAlpha = 0.6 * al;
    // 떠다니는 안구 둘 (점액 결보다 앞, 잘 보이게): 흰자 · 핏줄, 눈동자는 플레이어 쪽을 칸 단위로 바라봄 (뼈와 엇박자)
    { const P0 = G && G.player, lk = P0 ? [Math.sign(Math.round((P0.x - e.x) / 40)), Math.sign(Math.round((P0.y - (by - h * 0.5)) / 40))] : [e.face, 0];
      for (const [ox, oy, ph] of [[-16, 0.68, 2], [8, 0.5, 7]]) { const d = SK_DRIFT[(Math.floor(time * 2) + ph) % SK_DRIFT.length], X = (cx + ox + d[1] + lx * 0.5) & ~1, Y = (Math.round(by - h * oy) & ~1) + d[0];
        const a0 = ctx.globalAlpha; ctx.globalAlpha = 0.92 * al;
        const EP = skTint({ w: '#f0ece0', W: '#c8c0b0', r: '#c03030', s: '#24301c', i: '#c83a30', I: '#6a1414', p: '#0c0606' }, C, 0.12);
        gPaint(ctx, SK_EYEBALL, EP, X, Y);
        const L = GG && GG.hold > 0.3 ? [Math.round(Math.cos(time * 8 + ph)), Math.round(Math.sin(time * 8 + ph))] : lk; // 그로기: 눈알이 빙글빙글
        const ix = X + 6 + L[0] * 2, iy = Y + 4 + (GG && GG.hold > 0.3 ? L[1] * 2 : 0); // 홍채 3칸(가장자리 짙게) · 가운데 동공 · 왼쪽 위 흰 반사점
        ctx.fillStyle = EP.I; ctx.fillRect(ix, iy, 6, 6); ctx.fillStyle = EP.i; ctx.fillRect(ix, iy, 6, 4); ctx.fillStyle = EP.p; ctx.fillRect(ix + 2, iy + 2, 2, 2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(ix, iy, 2, 2);
        ctx.globalAlpha = a0; } }
    if (e.state === 'roll') { ctx.fillStyle = C.l; for (let i = 0; i < 3; i++) { const aa = e.rollA + i * 2.1; ctx.fillRect(Math.round(cx + Math.cos(aa) * 20) & ~1, Math.round(by - h / 2 + Math.sin(aa) * 14) & ~1, 4, 4); } }
    ctx.restore();
    // 부글거림: 바닥에서 기포가 칸 단위로 떠올라(초당 6칸) 위에서 톡 터진다 — 작은 점 기포와 속이 빈 동그라미 기포
    ctx.save(); ctx.globalAlpha = 0.9 * al; ctx.fillStyle = C.l;
    const BUB = [[-22, 0, 1], [-8, 7, 0], [6, 3, 1], [18, 11, 0], [-14, 15, 0], [12, 18, 1]];
    for (const [ox, ph, big] of BUB) {
      const len = Math.round(h * 0.75 / 2), k = (Math.floor(time * 6) + ph * 3) % (len + 3), bx = (cx + ox + lx * 0.5) & ~1, yy = (by - 6 - k * 2) & ~1;
      if (k >= len) { if (k === len) { ctx.fillRect(bx - 4, yy + 2, 2, 2); ctx.fillRect(bx + 4, yy + 2, 2, 2); ctx.fillRect(bx, yy - 2, 2, 2); } continue; } // 터짐
      if (big && k > 3) { ctx.fillRect(bx, yy - 2, 2, 2); ctx.fillRect(bx - 2, yy, 2, 2); ctx.fillRect(bx + 2, yy, 2, 2); ctx.fillRect(bx, yy + 2, 2, 2); }
      else ctx.fillRect(bx, yy, 2, 2);
    }
    ctx.restore();
    // 오른쪽 위 밝은 광원: 몸 가장자리를 따라 휘는 반사광 + 반짝임 (젤리 느낌)
    ctx.save(); ctx.globalAlpha = 0.9 * al; ctx.fillStyle = e.stage === 3 ? '#ffd8ec' : '#e0fcc0';
    const rx0 = (Math.round(cx + w * 0.4 + lx * 0.8) & ~1), ry0 = (Math.round(by - h * 0.66) & ~1);
    ctx.fillRect(rx0 - 6, ry0 - 4, 4, 2); ctx.fillRect(rx0 - 2, ry0 - 2, 2, 2); ctx.fillRect(rx0, ry0, 2, 6); ctx.fillRect(rx0 + 2, ry0 + 6, 2, 4);
    if (Math.floor(time * 2) % 3) { ctx.fillStyle = '#ffffff'; ctx.fillRect(rx0 - 6, ry0 + 2, 2, 2); }
    ctx.restore();
    // 아래쪽 안으로 비치는 빛 띠
    ctx.save(); ctx.globalAlpha = 0.3 * al; ctx.fillStyle = C.l; ctx.fillRect(Math.round(cx - w * 0.28) & ~1, (by - 8) & ~1, Math.round(w * 0.4 / 2) * 2, 2); ctx.restore();
    // 왕관
    const cs = GG ? GRG.R2(12 * GG.hold) * e.face : 0, crY = (Math.round(by - h - 8 + Math.max(0, -(e.jy || 0)) * 6) & ~1) + (GG ? GRG.R2(2 * GG.hold) : 0), crX = (Math.round(cx - 10 + e.face * 2 + lx) & ~1) + cs; // 그로기: 왕관이 한쪽으로 미끄러져 기울어짐
    const CRG = CROWN_G || (CROWN_G = gOutline(fromRows(['y...yy...y', 'yy.yyyy.yy', 'YyyyyrryyY', 'YYYYYYYYYY']))), CRP = { y: '#e8c060', Y: '#a8822e', r: '#b01c22', k: '#0b0a0e' };
    if (GG && GG.hold > 0.4) { const tl = GG.hold > 0.8 ? 4 : 2, lo = e.face > 0; const bx3 = [-1e5, crX + 6, crX + 14, 1e5]; for (let i = 0; i < 3; i++) { ctx.save(); ctx.beginPath(); ctx.rect(bx3[i], -1e5, bx3[i + 1] - bx3[i], 2e5); ctx.clip(); gPaint(ctx, CRG, CRP, crX, crY + [0, GRG.R2(tl / 2), tl][lo ? i : 2 - i]); ctx.restore(); } }
    else gPaint(ctx, CRG, CRP, crX, crY);
    if (e.grogiT > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(cx + Math.cos(time * 6 + i * 2.1) * 20) & ~1, Math.round(by - h - 14 + Math.sin(time * 6 + i * 2.1) * 3) & ~1, 2, 2); }
  }

  // ---------- 초원 배경
  // 초원 흙길의 중심선: 넓은 방은 아래쪽으로 굽이치고, 좁은 오솔길은 가운데를 따라 흐른다
  let CUR_ROOM = null, ROOMSTYLE = { path: 'wind', wall: null };
  function meadowPath() {
    const w = A.x1 - A.x0, h = A.y1 - A.y0;
    if (h > w * 1.3) { const amp = Math.min(40, w * 0.14); return { vert: true, at: y => CX + Math.sin(y * 0.012) * amp + Math.sin(y * 0.03) * 4 }; }
    const amp = Math.min(70, h * 0.13), base = h > 400 ? CY + Math.min(120, h * 0.22) : CY;
    return { vert: false, at: x => base + Math.sin(x * 0.007) * amp + Math.sin(x * 0.02) * Math.min(8, amp * 0.3) };
  }
  // 전투장 바깥: 어두운 숲 (도트 나무를 촘촘히 세우고 멀수록 디더링으로 어둡게)
  // 1장 아래쪽 울타리·숲 나무는 캐릭터보다 앞에 보여야 한다 — 바닥과 같은 그림을 투명한 앞 레이어에도 찍어, 캐릭터·몬스터를 그린 뒤 위에 덮는다
  const [frontM, ffg] = mkCanvas(W, H);
  let FRONT_ON = false;
  function stampBoth(g, map, pal, x, y, sc, flip) { stamp(g, map, pal, x, y, sc, flip); if (g === fmg) stamp(ffg, map, pal, x, y, sc, flip); }
  function paintForestBorder(g) {
    g.fillStyle = '#0a140a';
    g.fillRect(0, A.y0 + 12, A.x0 - 4, H); g.fillRect(A.x1 + 4, A.y0 + 12, W - A.x1, H); g.fillRect(0, A.y1 + 4, W, H - A.y1); // v2.21 위쪽 나무 줄 밑동을 덮어 잘라먹지 않게 A.y0+12부터
    g.fillStyle = '#070d07'; { const F = 96; if (A.x0 - F > 0) g.fillRect(0, A.y0 + 12, A.x0 - F, H); g.fillRect(A.x1 + F, A.y0 + 12, W, H); g.fillRect(0, A.y1 + F, W, H); } // 먼 숲 바닥은 한 단계 더 어둡게 (망점 없이)
    if (CUR_ROOM && G) paintMeadowDoorPaths(g, CUR_ROOM); // 문 길은 숲 나무보다 먼저
    const bk = brookCurve(); if (bk) paintMeadowCurve(g, Object.assign({}, bk, { clip: t => !brookIn(bk, t) && (!bk.vert || t > A.y1), noBridge: true }));
    const pts = [];
    const band = (x0, x1, y0, y1) => { for (let y = y0; y < y1; y += 30) for (let x = x0; x < x1; x += 26) pts.push({ x: x + rand(-8, 8), y: y + rand(-8, 8) }); };
    band(Math.min(A.x0 - 230, -10), A.x0 - 6, A.y0 + 10, A.y1 + 200); band(A.x1 + 10, Math.max(A.x1 + 240, W + 10), A.y0 + 10, A.y1 + 200); /* v2.21 좁은 방에서도 화면 끝까지 숲이 차게 */ band(A.x0 - 6, A.x1 + 10, A.y1 + 30, A.y1 + 200);
    const D0 = CUR_ROOM && G ? CUR_ROOM.doors : {}, onDoor = p => (D0.s != null && Math.abs(p.x - DOOR.s.x) < 26 && p.y > A.y1) || (D0.w != null && Math.abs(p.y - CY) < 26 && p.x < A.x0) || (D0.e != null && Math.abs(p.y - CY) < 26 && p.x > A.x1);
    pts.sort((a, b) => a.y - b.y);
    for (const p of pts) {
      if (onDoor({ x: p.x, y: p.y - 20 })) continue;
      const kind = pick(['round', 'round', 'pine', 'pine', 'dead']), palK = kind === 'pine' ? 'deep' : pick(['deep', 'dusk', 'green']);
      const dx = p.x < A.x0 ? A.x0 - p.x : p.x > A.x1 ? p.x - A.x1 : 0, dy = p.y > A.y1 ? p.y - A.y1 : 0, d = Math.max(dx, dy); // 멀수록 어둡게: 나무 색 자체를 5단계로 (망점으로 덮으면 화면이 움직일 때 우글거림)
      const dim = +(Math.round(clamp((d - 12) / 150, 0, 1) * 5) / 5 * 0.78 + 0.1).toFixed(3), c = treeCv(kind, palK, '#050905', dim, randi(0, 3));
      const fl = Math.random() < 0.5; let tx = p.x - c.width / 2, ty = p.y - c.height;
      // 울타리 안쪽(놀이 공간)으로 가지가 넘어오지 않게 밀어냄: 양옆은 세로 울타리 바깥, 아래는 가로 울타리 아래
      if (p.x < A.x0) tx = Math.min(tx, A.x0 - 12 - c.width); else if (p.x > A.x1) tx = Math.max(tx, A.x1 + 12); else ty = Math.max(ty, A.y1 + 10);
      ty = Math.max(ty, 12); // v2.21 위 끝에서 꼭대기가 잘리지 않게
      if (onDoorPath(tx + c.width * 0.3, ty + c.height * 0.2, c.width * 0.4, c.height * 0.8)) continue;
      if (bk && brookWet(bk, tx + c.width / 2, ty + c.height - 4)) continue;
      stampTree(g, c, tx, ty, fl);
      if (g === fmg && ty + c.height > A.y1 + 6) stampTree(ffg, c, tx, ty, fl); // 아래쪽 숲 나무는 앞 레이어에도
    }
  }
  const [floorM, fmg] = mkCanvas(W, H);
  function paintMeadowFloor(g) {
    if (g === fmg) { ffg.clearRect(0, 0, W, H); FRONT_ON = true; }
    const sky = dLinear(g, 0, 0, 0, A.y0); sky.addColorStop(0, '#1e1830'); sky.addColorStop(0.55, '#4a2e48'); sky.addColorStop(1, '#8a5040');
    g.fillStyle = sky.p(g, 0, 0, W, A.y0, 14); g.fillRect(0, 0, W, A.y0);
    // 지는 해
    g.fillStyle = 'rgba(255,170,90,.5)'; g.beginPath(); g.arc(CX + 100, A.y0 - 34, 22, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,200,120,.8)'; g.beginPath(); g.arc(CX + 100, A.y0 - 34, 14, 0, TAU); g.fill();
    g.fillStyle = '#1e3018'; g.fillRect(0, A.y0 - 40, W, H);
    { const cols = ['#24401c', '#2a4820', '#22401a'], n = Math.floor(11000 * (W * (H - A.y0)) / (1152 * 630) / 3); // 색마다 한 번에 칠함 (점마다 색을 바꾸면 느림)
      for (const c of cols) { g.fillStyle = c; g.beginPath(); for (let i = 0; i < n; i++) g.rect(randi(0, W), randi(A.y0 - 40, H), randi(1, 3), 1); g.fill(); } }
    for (let i = 0; i < 16; i++) { const x = rand(A.x0, A.x1), y = rand(A.y0, A.y1), r = rand(20, 60); const gr = dRadial(g, x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(90,130,50,.18)'); gr.addColorStop(1, 'rgba(90,130,50,0)'); g.fillStyle = gr.p(g); g.fillRect(x - r, y - r, r * 2, r * 2); }
    // 풀 무더기
    for (let i = 0; i < 420 * (A.x1 - A.x0) * (A.y1 - A.y0) / 540000; i++) {
      const x = randi(A.x0 - 20, A.x1 + 20), y = randi(A.y0, A.y1 + 20);
      g.fillStyle = pick(['#4a7a34', '#56883a', '#3e6a2c', '#68984a']);
      g.fillRect(x, y, 1, 2); g.fillRect(x + 1, y - 1, 1, 3); g.fillRect(x + 2, y + 1, 1, 1);
    }
    // 들꽃
    for (let i = 0; i < 36; i++) { const x = randi(A.x0, A.x1), y = randi(A.y0, A.y1); g.fillStyle = '#3e6a2c'; g.fillRect(x, y + 1, 1, 2); g.fillStyle = pick(['#e8e0c0', '#e0c040', '#b080e0', '#e07090', '#f0f0f0']); g.fillRect(x, y, 1, 1); if (Math.random() < 0.4) { g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); } }
    paintForestShadow(g);
    paintTreeline(g);
    paintUndergrowth(g);
    paintForestBorder(g);
    paintMeadowProps(g);
    // 길을 마지막에 그려 잔디·꽃·덤불이 덮거나 끊어 보이지 않게 한다.
    for (const c of meadowCurves()) paintMeadowCurve(g, c.kind === 'brook' && ROOMSTYLE.side ? Object.assign({}, c, { clip: t => brookIn(c, t) }) : c);
    nightGrade(g); if (g === fmg) nightGrade(ffg);
  }
  // v3.23 밤 공기: 풀(초록)과 흙(갈색)만 골라 푸른 초록 · 낮은 채도로 옮김. 꽃 · 돌 · 물 등 다른 색은 그대로. window.NIGHT_GROUND = false면 끔
  function nightGrade(g) { if (window.NIGHT_GROUND === false) return; const c = g.canvas, w = c.width, h = c.height; let id; try { id = g.getImageData(0, 0, w, h); } catch (e) { return; } const d = id.data;
    for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), dl = mx - mn; if (dl < 0.04) continue;
      let hh = mx === r ? ((gg - b) / dl) % 6 : mx === gg ? (b - r) / dl + 2 : (r - gg) / dl + 4; hh *= 60; if (hh < 0) hh += 360; let s = dl / mx, v = mx;
      if (hh >= 55 && hh <= 175) { hh += (158 - hh) * 0.55; s *= 0.62; v *= 0.9; } // 풀 · 이끼 · 나뭇잎
      else if (hh >= 12 && hh < 55 && s < 0.85) { hh += (hh < 40 ? 6 : 0); s *= 0.55; v *= 0.86; } // 흙 · 마른 풀 · 나무 밑동
      else continue;
      const C = v * s, X = C * (1 - Math.abs((hh / 60) % 2 - 1)), m = v - C, k = Math.floor(hh / 60) % 6, rr = [C, X, 0, 0, X, C][k], g2 = [X, C, C, X, 0, 0][k], b2 = [0, 0, X, C, C, X][k];
      d[i] = Math.round((rr + m) * 255); d[i + 1] = Math.round((g2 + m) * 255); d[i + 2] = Math.round((b2 + m) * 255); }
    g.putImageData(id, 0, 0); }
  paintMeadowFloor(fmg);

  // ---------- 스테이지 정의
  const PHASES_MEADOW = {
    1: [[['slime', 4]], [['slime', 3], ['goblin', 2]]],
    2: [[['goblin', 4]], [['slime', 3], ['toxslime', 1], ['bigslime', 1]]],
    3: [[['goblin', 3], ['garcher', 2]], [['slime', 3], ['toxslime', 2], ['goblin', 1]]],
    4: [[['gbrute', 1], ['goblin', 3]], [['boar', 1], ['slime', 2], ['goblin', 1]]], // v2.33 엘리트 2
    6: [[['goblin', 5], ['garcher', 3]], [['bigslime', 2], ['toxslime', 3], ['slime', 3]], [['goblin', 5], ['slime', 2], ['garcher', 2]]],
    7: [[['slime', 5], ['bigslime', 2], ['toxslime', 2]], [['goblin', 6], ['garcher', 3]], [['boar', 1], ['slime', 3], ['goblin', 2]]],
    8: [[['goblin', 6], ['garcher', 3]], [['bigslime', 3], ['toxslime', 2], ['goblin', 3]], [['gbrute', 1], ['goblin', 3], ['garcher', 2]]],
    9: [[['boar', 1], ['goblin', 4], ['garcher', 1]], [['gbrute', 1], ['boar', 1], ['goblin', 2]]],
  };
  // 챕터 3 웨이브 (※ ocharge·odrum·ogrip = 준엘리트)
  const PHASES_ASH = { // v1.24 STAGE 4 왕도 — 엘리트(4·9)는 5단계 전까지 임시로 성채 엘리트
    1: [[['husk', 4]], [['husk', 3], ['moth', 4]]],
    2: [[['husk', 3], ['lancer', 2]], [['husk', 3], ['cantor', 2]]],
    3: [[['aguard', 2], ['husk', 3]], [['moth', 5], ['lancer', 2], ['herald', 1]]],
    4: [[['mordred', 1], ['husk', 3], ['cantor', 1]], [['mordred', 1], ['aguard', 2]]], // v1.30 4장 엘리트 · v2.33 엘리트 2
    6: [[['coffin', 1], ['husk', 3], ['moth', 3]], [['aguard', 3], ['cantor', 2]], [['lancer', 4], ['herald', 1], ['husk', 2]]],
    7: [[['coffin', 1], ['aguard', 2], ['cantor', 1]], [['herald', 1], ['aguard', 3], ['lancer', 2]], [['husk', 5], ['moth', 4], ['cantor', 1]]],
    8: [[['coffin', 1], ['herald', 1], ['husk', 4]], [['aguard', 3], ['lancer', 3], ['cantor', 2]], [['moth', 6], ['aguard', 2], ['herald', 1]]],
    9: [[['queen', 1], ['aguard', 2], ['husk', 1]], [['mordred', 1], ['cantor', 2]]], // v2.33 엘리트 2
  };
  const PHASES_ORC = {
    1: [[['orc', 3], ['slave', 3]], [['orc', 2], ['othrow', 2], ['slave', 2]]],
    2: [[['wolf', 3], ['orc', 2]], [['orc', 3], ['shaman', 1], ['ocharge', 1]]],
    3: [[['orc', 4], ['othrow', 2]], [['slave', 5], ['wolf', 2], ['otroll', 1]]],
    4: [[['urg', 1], ['orc', 2]], [['troll', 1], ['orc', 1]]], // v2.33 엘리트 2
    6: [[['ogrip', 1], ['orc', 3], ['slave', 3]], [['wolf', 4], ['othrow', 2], ['shaman', 1]], [['ocharge', 1], ['orc', 4]]],
    7: [[['otroll', 1], ['orc', 4], ['othrow', 1]], [['slave', 6], ['shaman', 2]], [['ogrip', 1], ['wolf', 3], ['othrow', 2]]],
    8: [[['ocharge', 1], ['orc', 5], ['othrow', 2]], [['otroll', 1], ['wolf', 4], ['shaman', 1]], [['ogrip', 1], ['ocharge', 1], ['orc', 3]]],
    9: [[['troll', 1], ['ogrip', 1], ['orc', 2], ['shaman', 1]], [['urg', 1], ['othrow', 2]]], // v2.33 엘리트 2
  };
  const STAGES = {
    1: { n: '빛바랜 초원', sub: '재가 서리처럼 내려앉은 변경의 들판', diff: 1, hpMul: 1.15, atkMul: 1.45, dark: 0.34, ash: '205,240,120', torches: false,
      phases: PHASES_MEADOW, survive: [['slime', 0.3], ['goblin', 0.3], ['garcher', 0.15], ['bigslime', 0.1], ['toxslime', 0.15]], surviveMax: 10,
      boss: '점액왕 구루그', bossSub: '첫 번째 파편', bossGold: 160, elite: '고블린 챔피언 · 가시등 멧돼지' },
    2: { n: '무너진 성채', sub: '주인을 잃은 기사단의 옛 의식장', diff: 2, hpMul: 1.15, atkMul: 0.95, dark: 0.66, ash: '160,150,170', torches: true,
      phases: PHASES, survive: [['ghoul', 0.4], ['dog', 0.15], ['bloat', 0.15], ['cultist', 0.15], ['crow', 0.15]], surviveMax: 12,
      boss: '타락 기사단장 발도르', bossSub: '두 번째 파편', bossGold: 250, elite: '기사단 처형인 · 역병 어미' },
    3: { n: '핏빛 엄니 부락', sub: '잿불이 식지 않는 협곡 바닥의 전장', diff: 3, hpMul: 1.4, atkMul: 1.32, dark: 0.5, ash: '255,140,60', torches: true, embers: true,
      phases: PHASES_ORC, survive: [['orc', 0.35], ['othrow', 0.15], ['wolf', 0.2], ['slave', 0.2], ['shaman', 0.1]], surviveMax: 14, surviveSemi: 20,
      boss: '핏빛 엄니 대족장 크루가쉬', bossSub: '세 번째 파편', bossGold: 360, elite: '투기장 챔피언 우르그 · 사슬 풀린 트롤 그러크' },
    // v1.22 STAGE 4 잿빛 왕도 (1단계: 공간만 — 몬스터·보스는 임시로 성채 것을 쓴다)
    4: { n: '잿빛 왕도', sub: '재가 눈처럼 가라앉은 옛 왕국의 수도', diff: 4, hpMul: 1.55, atkMul: 1.4, dark: 0.6, ash: '196,190,180', torches: true, ashCity: true,
      phases: PHASES_ASH, survive: [['husk', 0.35], ['moth', 0.2], ['lancer', 0.15], ['cantor', 0.15], ['aguard', 0.15]], surviveMax: 16,
      boss: '잿빛 왕', bossSub: '재의 왕관의 주인', bossGold: 480, elite: '근위대장 · 상복의 왕비' },
  };
  // 이번 런의 마지막 스테이지: STAGE 2를 한 번 클리어하면 STAGE 3(오크 부락)이 열린다
  const lastStage = () => (G && G.last) || 4; // v1.22 3장을 깨면 항상 4장으로
  let STAGE = STAGES[SAVE.lastStage] ? SAVE.lastStage : 1;
  let FORGE_STG = null; // v1.02 대장간 방은 성채 설정에 대장간 분위기를 덮어씀
  const STG = () => G && G.dun && G.dun.forge ? ((FORGE_STG = FORGE_STG || {})[G.dun.forgeKey] || (FORGE_STG[G.dun.forgeKey] = Object.assign({}, STAGES[2], FORGE_STGS[G.dun.forgeKey] || FORGE_STGS.A, { torches: false }))) : STAGES[G ? G.stage : STAGE]; // v1.71 출장 대장간 3종
;

// ==================================================================== 05_dungeon.js
'use strict';
// 잿빛 왕관 토벌대 — 05_dungeon.js : 던전 생성·방 진입·상호작용·길찾기·바닥 그리기, 오브젝트 도트, 보스 문 봉인, 특별한 방(상인·보물·야영지)
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ 던전 (v0.23) — 엔터 더 건전식 방 구조
  // 한 스테이지 = 방 그래프. 격전지는 들어가면 문이 잠기고 적을 모두 쓰러뜨려야 열린다.
  // 강적의 거처 2곳을 처치하면 보스 방 봉인이 풀린다. 갈림길·순환 고리·막다른 길 끝의 보물·상인, 금 간 벽 너머 잊힌 틈새.
  const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
  const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };
  const DOOR = { n: { x: 719, y: A.y0 }, s: { x: 719, y: A.y1 }, w: { x: A.x0, y: CY }, e: { x: A.x1, y: CY } };
  // 방 크기·모양 (v0.25): 스테이지마다 5종
  const SHAPES = {
    field: { w: 1000, h: 540, n: '들판' }, trail: { w: 1100, h: 210, n: '오솔길' }, trailV: { w: 300, h: 640, n: '숲길' }, glade: { w: 560, h: 360, n: '숲속 빈터' }, plain: { w: 1060, h: 580, n: '너른 벌판' },
    square: { w: 1000, h: 540, n: '부락 광장' }, fence: { w: 1100, h: 200, n: '말뚝 사이 길' }, canyon: { w: 300, h: 640, n: '협곡 비탈길' }, tents: { w: 560, h: 360, n: '천막 골목' }, arena: { w: 1060, h: 580, n: '투기장' }, arenaBoss: { w: 1180, h: 640, n: '투기장' } /* v2.86 큰 방 1180×640 → 1060×580 · 3장 보스방은 그대로 */,
    hall: { w: 1000, h: 540, n: '의식장' }, nook: { w: 480, h: 270, n: '아늑한 자리' }, vault: { w: 400, h: 240, n: '숨은 방' }, forge: { w: 420, h: 240, n: '대장간' } /* v1.71 500×280 → 420×240 */, corridor: { w: 1100, h: 190, n: '복도' }, corridorV: { w: 280, h: 640, n: '탑 계단' }, chamber: { w: 540, h: 340, n: '작은 방' }, greathall: { w: 1060, h: 580, n: '대회랑' },
    plaza: { w: 1000, h: 540, n: '재의 광장' }, gallery: { w: 1100, h: 200, n: '무너진 회랑' }, belfry: { w: 290, h: 640, n: '종탑 계단' }, sanctum: { w: 540, h: 340, n: '성소' }, court: { w: 1060, h: 580, n: '왕궁 앞뜰' }, coronation: { w: 1180, h: 640, n: '대관식장' }, altar: { w: 640, h: 300, n: '왕도 성문 앞' } /* v2.52 재의 제단 */,
    start1: { w: 700, h: 400, n: '초원 어귀' }, start2: { w: 700, h: 400, n: '성채 앞마당' }, start3: { w: 700, h: 400, n: '부락 어귀' }, start4: { w: 700, h: 400, n: '왕도 어귀' }, // v3.20 장마다 들머리 (작게 · 그 장의 시설물을 정해진 자리에)
  };
  function setArena(sh) {
    A.x0 = 136 + Math.max(0, Math.round((1000 - sh.w) / 4) * 2); A.x1 = A.x0 + sh.w;
    A.y0 = 100 + Math.max(0, Math.round((540 - sh.h) / 4) * 2); A.y1 = A.y0 + sh.h;
    CX = (A.x0 + A.x1) / 2; CY = (A.y0 + A.y1) / 2;
    PILLARS = []; for (let x = A.x0 + 34; x <= A.x1 - 20; x += 157) PILLARS.push(x);
    if (G && (G.stage === 2 || G.stage === 4)) { const n = PILLARS.length; PILLARS = PILLARS.map((_, k) => Math.round((CX + (k - (n - 1) / 2) * 157) / 2) * 2); } // v3.29 2장 · 4장 기둥은 방 가운데 기준 좌우 대칭
    TORCHES = PILLARS.map(x => ({ x, y: A.y0 - 38 }));
    // 문은 장식 기둥 간격에 맞추지 않고 각 변의 정확한 중앙에 고정한다.
    const nx = Math.round(CX / 2) * 2;
    Object.assign(DOOR.n, { x: nx, y: A.y0 }); Object.assign(DOOR.s, { x: nx, y: A.y1 }); Object.assign(DOOR.w, { x: A.x0, y: CY }); Object.assign(DOOR.e, { x: A.x1, y: CY });
    NC = Math.ceil((A.x1 - A.x0) / NAV); NR = Math.ceil((A.y1 - A.y0) / NAV);
  }
  const doorIn = (d, k = 26) => ({ x: DOOR[d].x + (d === 'w' ? k : d === 'e' ? -k : 0), y: DOOR[d].y + (d === 'n' ? k : d === 's' ? -k : 0) });
  const ROOM_N = { shrine: '빛의 샘', altar: '왕도 성문', forge: '쿤의 대장간', start: '들머리', combat: '격전지', elite: '강적의 거처', survive: '닫힌 결계', rest: '쿠키 · 쿠오의 출장 비스트로', reward: '숨은 보고', shop: '살구의 비밀상점', secret: '잊힌 틈새', boss: '보스', hidden: '숨은 공터', lab: '구덩이 실험실', chapel: '기사단 밀실' };
  // v1.21 챕터마다 다른 강적의 거처 이름·문구 (tier 4 = 첫째 강적의 거처, tier 9 = 둘째)
  const ELITE_ROOM = {
    1: { n: '우두머리의 굴', tag: '굴', foe: '우두머리', clear: '우두머리 처치', loot: '우두머리의 전리품',
      sub: { 4: '고블린 챔피언이 식지 않은 불씨를 쥐고 놓지 않는다', 9: '가시등 멧돼지가 불씨 주위를 맴돌며 땅을 판다' } },
    2: { n: '처형장', tag: '처형장', foe: '처형장', clear: '처형장 제압', loot: '처형장의 전리품',
      sub: { 4: '기사단 처형인이 아직 끝나지 않은 판결을 기다린다', 9: '처형인 곁, 역병 어미가 무너진 돌 틈에 둥지를 틀었다' } },
    3: { n: '결투장', tag: '결투장', foe: '결투', clear: '결투 승리', loot: '결투의 전리품',
      sub: { 4: '투기장 챔피언 우르그가 부러진 엄니를 걸고 서 있다', 9: '사슬이 끊어진 트롤 그러크가 우리 밖을 배회한다' } },
    4: { n: '알현실', tag: '알현실', foe: '알현', clear: '알현 종료', loot: '왕실의 하사품',
      sub: { 4: '근위대장이 주인 없는 문을 여전히 지킨다', 9: '상복의 왕비가 빈 왕좌 앞에서 재를 매만진다' } },
  };
  const ER = () => ELITE_ROOM[G && G.stage] || ELITE_ROOM[1];
  const roomName = t => t === 'ruin' ? RUIN.name() : t === 'den' ? DEN.name() : t === 'archive' ? ARCH.name() : t === 'home' && G ? HOME.name(G.cls) : t === 'elite' && G && G.dun && !G.dun.forge ? ER().n : ROOM_N[t];
  const roomTag = t => t === 'elite' ? ER().tag : ROOM_TAG[t];
  const ROOM_TAG = { shrine: '빛', altar: '성문', forge: '대장간', start: '시작', combat: '전투', elite: '엘리트', survive: '봉인', rest: '비스트로', reward: '보물', shop: '상인', secret: '비밀', boss: '보스', hidden: '공터', lab: '실험실', chapel: '밀실' };

  // withSeed: 04_monsters.js에서 불러올 때 먼저 써서 그쪽으로 옮김

  // ---------- 생성
  function genDungeon(stage) {
    for (let i = 0; i < 600; i++) { const D = tryGenDungeon(stage); if (D) return D; }
    throw new Error('던전 생성 실패');
  }
  function tryGenDungeon(stage) {
    const N = stage === 1 ? 12 : stage === 2 ? 13 : stage === 3 ? 14 : 15;
    const cells = new Map(), K = (x, y) => x + ',' + y, rooms = [];
    const add = (x, y) => { const r = { id: rooms.length, gx: x, gy: y, type: 'combat', doors: { n: null, s: null, w: null, e: null }, visited: false, seen: false, cleared: false, loot: [], seed: randi(1, 2e9) }; rooms.push(r); cells.set(K(x, y), r); return r; };
    const link = (a, b, d) => { a.doors[d] = b.id; b.doors[OPP[d]] = a.id; };
    const nbs = (x, y) => Object.keys(DIRS).filter(d => cells.has(K(x + DIRS[d][0], y + DIRS[d][1])));
    const at = (x, y, d) => cells.get(K(x + DIRS[d][0], y + DIRS[d][1]));
    add(0, 0);
    for (let guard = 0; rooms.length < N && guard < 3000; guard++) {
      const base = rooms[randi(0, rooms.length - 1)], d = pick(Object.keys(DIRS));
      const x = base.gx + DIRS[d][0], y = base.gy + DIRS[d][1];
      if (cells.has(K(x, y)) || nbs(x, y).length !== 1 || Math.abs(x) > 4 || Math.abs(y) > 3) continue;
      if (base.id === 0 && nbs(0, 0).length >= 3) continue;
      link(base, add(x, y), d);
    }
    if (rooms.length < N) return null;
    // 순환 고리: 양쪽에 방이 있는 빈 칸을 채워 두 갈래를 잇는다
    for (let l = 0; l < (stage === 1 ? 1 : 2); l++) {
      const cand = [];
      for (const r of rooms) for (const d in DIRS) { const x = r.gx + DIRS[d][0], y = r.gy + DIRS[d][1]; if (!cells.has(K(x, y)) && nbs(x, y).length === 2) cand.push([x, y]); }
      if (!cand.length) break;
      const [x, y] = pick(cand), nr = add(x, y);
      for (const d of nbs(x, y)) link(nr, at(x, y, d), d);
    }
    // 들머리에서의 거리
    const depth = rooms.map(() => -1); depth[0] = 0;
    for (const q = [0]; q.length;) { const r = rooms[q.shift()]; for (const d in r.doors) { const id = r.doors[d]; if (id != null && depth[id] < 0) { depth[id] = depth[r.id] + 1; q.push(id); } } }
    const deg = r => Object.values(r.doors).filter(v => v != null).length;
    const dead = rooms.filter(r => r.id !== 0 && deg(r) === 1).sort((a, b) => depth[b.id] - depth[a.id]);
    if (dead.length < 3) return null;
    const boss = dead[0]; if (depth[boss.id] < 4) return null;
    const foyer = rooms[Object.values(boss.doors).find(v => v != null)];
    if (foyer.id === 0) return null;
    rooms[0].type = 'start'; boss.type = 'boss';
    const free = () => rooms.filter(r => r.type === 'combat' && r !== foyer);
    const de = dead.filter(r => r.type === 'combat' && r !== foyer);
    if (de.length < 2) return null;
    de[0].type = 'reward';
    const shop = de.length > 1 ? de[de.length - 1] : pick(free()); shop.type = 'shop';
    let F = free().filter(r => depth[r.id] >= 2).sort((a, b) => depth[a.id] - depth[b.id]);
    if (F.length < 4) return null;
    const e1 = F[Math.floor((F.length - 1) / 2)], e2 = F[F.length - 1];
    e1.type = 'elite'; e1.tier = 4; e2.type = 'elite'; e2.tier = 9;
    F = free().sort((a, b) => Math.abs(depth[a.id] - 3) - Math.abs(depth[b.id] - 3));
    if (!F.length) return null;
    F[0].type = 'rest'; F[0].tier = 5;
    if (stage <= 4) { F = free().filter(r => depth[r.id] >= 2).sort((a, b) => Math.abs(depth[a.id] - 4) - Math.abs(depth[b.id] - 4)); if (!F.length) return null; F[0].type = 'shrine'; F[0].tier = 5; } // v3.25 빛의 샘 (1~4장 · 챕터마다 1개)
    F = free().filter(r => depth[r.id] >= 2);
    if (!F.length) return null;
    const sv = pick(F); sv.type = 'survive'; sv.tier = 10;
    const combats = rooms.filter(r => r.type === 'combat').sort((a, b) => depth[a.id] - depth[b.id]);
    if (combats.length < 3) return null;
    const TIERS = [1, 2, 3, 6, 7, 8];
    combats.forEach((r, i) => { r.tier = TIERS[Math.min(5, Math.floor(i * 6 / combats.length))]; });
    // 잊힌 틈새: 보스 옆이 아닌 빈 칸, 이웃이 하나뿐인 깊은 자리를 우선
    const sc = [];
    for (const r of rooms) {
      if (r.type === 'boss' || r.type === 'start') continue;
      for (const d in DIRS) {
        const x = r.gx + DIRS[d][0], y = r.gy + DIRS[d][1];
        if (cells.has(K(x, y)) || r.doors[d] != null) continue;
        const n = nbs(x, y);
        if (n.some(nd => at(x, y, nd).type === 'boss')) continue;
        sc.push({ x, y, r, d, n: n.length });
      }
    }
    if (!sc.length) return null;
    sc.sort((a, b) => (a.n - b.n) || (depth[b.r.id] - depth[a.r.id]));
    const s0 = pick(sc.filter(s => s.n === sc[0].n).slice(0, 4));
    const sec = add(s0.x, s0.y); sec.type = 'secret';
    link(s0.r, sec, s0.d); s0.r.crack = { dir: s0.d, hp: 3, broken: false };
    for (const r of rooms) {
      r.depth = depth[r.id] == null || depth[r.id] < 0 ? depth[s0.r.id] + 1 : depth[r.id];
      if (!r.tier) r.tier = Math.max(1, Math.min(8, r.depth + 1));
      if (r.type === 'boss') r.tier = 11;
    }
    // 텔레포터: 시작·상인·모닥불·보물·봉인·보스 앞방 + 일부 격전지
    for (const r of rooms) if (['start', 'shop', 'rest', 'reward', 'survive', 'boss', 'shrine'].includes(r.type) || r === foyer || (r.type === 'combat' && Math.random() < 0.3)) r.hasTele = true;
    // 방 모양: 양쪽 문만 있는 격전지는 오솔길·복도가 되기 쉽고, 엘리트·봉인은 넓은 방, 쉼터는 작은 방
    const [STD, COR, CORV, SMALL, BIG] = stage === 1 ? ['field', 'trail', 'trailV', 'glade', 'plain'] : stage === 4 ? ['plaza', 'gallery', 'belfry', 'sanctum', 'court'] : stage === 2 ? ['hall', 'corridor', 'corridorV', 'chamber', 'greathall'] : ['square', 'fence', 'canyon', 'tents', 'arena'];
    const wpick = arr => { let t = Math.random() * arr.reduce((a, b) => a + b[1], 0); for (const [k, w] of arr) { if (t < w) return k; t -= w; } return arr[0][0]; };
    for (const r of rooms) {
      const ds = Object.keys(r.doors).filter(d => r.doors[d] != null), hz = ds.every(d => d === 'w' || d === 'e'), vt = ds.every(d => d === 'n' || d === 's');
      r.shape = r.type === 'boss' ? (stage === 3 ? 'arenaBoss' : stage === 4 ? 'coronation' : STD)
        : r.type === 'combat' ? (hz && Math.random() < 0.8 ? COR : vt && Math.random() < 0.8 ? CORV : wpick([[STD, 3], [SMALL, 2], [BIG, 2], [COR, ds.length <= 3 && !ds.includes('n') ? 1 : 0], [CORV, ds.length <= 3 && !ds.includes('w') ? 1 : 0]]))
        : r.type === 'elite' ? wpick([[STD, 2], [BIG, 3]])
        : r.type === 'survive' ? wpick([[STD, 1], [BIG, 2]])
        : r.type === 'start' ? 'start' + stage
        : r.type === 'secret' ? 'vault' // v1.11 특별한 방은 작게
        : ['shop', 'rest', 'reward', 'shrine'].includes(r.type) ? 'nook'
        : SMALL;
    }
    // 모든 칸에 적어도 오솔길/복도 하나는 나오게
    if (!rooms.some(r => r.shape === COR || r.shape === CORV)) { const nsCount = r => ['n', 's'].filter(d => r.doors[d] != null).length; const c = rooms.filter(r => r.type === 'combat').sort((a, b) => nsCount(a) - nsCount(b))[0]; if (c) c.shape = nsCount(c) <= 1 ? COR : CORV; }
    for (const r of rooms) { r.waves = r.type === 'combat' || r.type === 'elite' ? STAGES[stage].phases[r.tier] : null; setArena(SHAPES[r.shape]); layoutRoom(r, stage); if (['combat', 'elite', 'survive'].includes(r.type)) r.hue = pick(['r', 'b', 'g']); } // v2.34 방 색 성향 · v2.46 보스방은 색 성향 없음 (잿빛·색 물결·빛 조각 없음)
    setArena(SHAPES[STD]);
    const loop2 = TRUTH.loop2(); /* v2.74 진엔딩 단서는 그 캐릭터의 전기가 만들어진 뒤(2회차)부터 */ if (loop2 && stage === 1 && !TRUTH.prep1(rooms)) return null; if (loop2 && stage === 2 && G.truthRun && G.truthRun.t1 && !TRUTH.prep2(rooms)) return null; /* v3.20 2장 단서: 이번 판에 1장 진실을 봤을 때만 */ // v2.59 2장: 벽의 인장 · 밀실 · 문장 석상 // v2.58 진엔딩 1장 단서: 점액 묻은 나무 · 숨은 방 · 문 앞 점액 · 폭발 흔적
    // 지도 경계
    const xs = rooms.map(r => r.gx), ys = rooms.map(r => r.gy);
    { const D0 = { rooms }; markInvader(D0, stage); } // v1.57 난입 방 지정
    return { rooms, start: rooms[0], boss, foyer, cur: null, eliteDone: 0, keys: 0, sock: [false, false], bossOpen: false, gate: null, stage, bx0: Math.min(...xs), bx1: Math.max(...xs), by0: Math.min(...ys), by1: Math.max(...ys) };
  }

  // ---------- 방 구조물: 기둥(나무) · 무너진 벽(덤불) · 잔해(바위) · 구덩이(연못)
  const U = (u, v) => ({ x: A.x0 + u * (A.x1 - A.x0), y: A.y0 + v * (A.y1 - A.y0) });
  const LAYOUTS = {
    open: () => [],
    pillars4: () => [['p', .28, .3], ['p', .72, .3], ['p', .28, .72], ['p', .72, .72]],
    pillars6: () => [['p', .22, .3], ['p', .5, .3], ['p', .78, .3], ['p', .22, .72], ['p', .5, .72], ['p', .78, .72]],
    ring: () => Array.from({ length: 8 }, (_, i) => ['p', .5 + Math.cos(i / 8 * TAU + 0.39) * 0.2, .52 + Math.sin(i / 8 * TAU + 0.39) * 0.3]),
    centerPit: () => [['pit', .5, .24, 260, 70], ['pit', .5, .82, 260, 70]], // v3.19 둘 이상이면 같은 크기 · 줄 맞춤
    twinPits: () => [['pit', .3, .5, 150, 220], ['pit', .7, .5, 150, 220]],
    cross: () => [['w', .5, .2, 26, 120], ['w', .5, .84, 26, 120], ['w', .2, .52, 120, 26], ['w', .8, .52, 120, 26]], // v3.19 네 팔 길이 통일
    lanes: () => [['w', .5, .33, 560, 26], ['w', .5, .7, 560, 26], ['r', .14, .5, 16], ['r', .86, .5, 16]],
    rubble: () => { const out = [], k = randi(2, 3); // v2.91 고르게 흩뿌린 8개 → 2~3무더기 (무더기마다 1~3개)
      for (let i = 0; i < k; i++) { const u = rand(.18, .82), v = rand(.22, .8), m = randi(1, 3); for (let j = 0; j < m; j++) out.push(['r', u + (j ? rand(-.06, .06) : 0), v + (j ? rand(-.08, .08) : 0), j ? rand(10, 14) : rand(15, 22)]); }
      return out; },
    pitBand: () => [['pit', .25, .52, 290, 64], ['pit', .75, .52, 290, 64], ['p', .5, .25], ['p', .5, .8]],
    blocks: () => [['w', .22, .27, 170, 90], ['w', .78, .27, 170, 90], ['w', .22, .78, 170, 90], ['w', .78, .78, 170, 90]],
    pitsScatter: () => [['pit', .25, .28, 110, 70], ['pit', .75, .28, 110, 70], ['pit', .25, .78, 110, 70], ['pit', .75, .78, 110, 70], ['r', .5, .3, 15], ['r', .5, .8, 15]], // v3.19 제각각이던 구덩이 다섯 → 같은 크기 넷을 격자로
    halls: () => [['w', .36, .5, 26, 300], ['w', .64, .5, 26, 300], ['r', .18, .3, 18], ['r', .82, .74, 18]],
    pond: () => [['pit', .5, .2, 220, 80], ['p', .2, .3], ['p', .8, .3], ['p', .2, .78], ['p', .8, .78]],
  };
  // 모양 전용 배치 (크기 그대로)
  const LAYOUTS_SHAPE = {
    trailEdge: () => [...[.08, .3, .52, .74, .94].map(u => ['p', u, .1]), ...[.2, .42, .64, .86].map(u => ['p', u, .92]), ['r', .76, .5, 13]],
    trailZig: () => [['w', .2, .3, 46, 120], ['w', .42, .72, 46, 120], ['w', .64, .3, 46, 120], ['w', .86, .72, 46, 120]],
    trailPond: () => [['pit', .24, .5, 170, 70], ['pit', .76, .5, 170, 70], ['p', .2, .12], ['p', .8, .9]],
    vZig: () => [['w', .32, .24, 150, 30], ['w', .68, .5, 150, 30], ['w', .32, .76, 150, 30]],
    vEdge: () => [['p', .12, .18], ['p', .88, .32], ['p', .12, .48], ['p', .88, .62], ['p', .12, .8], ['r', .5, .35, 12]],
    colonnade: () => [...[.08, .26, .44, .62, .8, .96].map(u => ['p', u, .16]), ...[.08, .26, .44, .62, .8, .96].map(u => ['p', u, .86])],
    corrRubble: () => [['r', .18, .28, 22], ['r', .38, .72, 22], ['r', .58, .28, 22], ['r', .78, .72, 22]],
    corrPits: () => [['pit', .3, .3, 220, 56], ['pit', .7, .7, 220, 56]],
    vColon: () => [...[.12, .3, .48, .66, .84].map(v => ['p', .16, v]), ...[.12, .3, .48, .66, .84].map(v => ['p', .84, v])],
    vRubble: () => [['r', .3, .25, 20], ['r', .7, .45, 20], ['r', .3, .7, 20]],
    glade1: () => [['p', .2, .3], ['p', .8, .3], ['r', .5, .75, 14]],
    nave: () => [...[.12, .26, .4, .6, .74, .88].map(u => ['p', u, .3]), ...[.12, .26, .4, .6, .74, .88].map(u => ['p', u, .72])],
    groves: () => [['p', .2, .25], ['p', .27, .34], ['p', .14, .38], ['p', .8, .68], ['p', .87, .6], ['p', .74, .8], ['pit', .55, .2, 220, 80], ['r', .3, .75, 18]],
    sideHalls: () => [['w', .5, .3, 500, 30], ['w', .5, .72, 500, 30], ['p', .15, .5], ['p', .85, .5]],
  };
  Object.assign(LAYOUTS, LAYOUTS_SHAPE);
  const LAYOUT_SHAPE_POOL = {
    trail: ['trailEdge', 'trailZig', 'trailPond'], trailV: ['vZig', 'vEdge'], glade: ['glade1', 'open', 'pillars4'],
    corridor: ['colonnade', 'corrRubble', 'corrPits'], corridorV: ['vColon', 'vRubble'], chamber: ['open', 'pillars4', 'rubble'],
  };
  const BIG_RECT = ['centerPit', 'twinPits', 'pond', 'pitBand', 'blocks', 'halls'], LAYOUT_RECT = { centerPit: 1, twinPits: 1, pitBand: 1, pitsScatter: 1, pond: 1, groves: 1, trailPond: 1, corrPits: 1, cross: 2, lanes: 2, blocks: 2, halls: 2, trailZig: 2, vZig: 2, sideHalls: 2 }; // v3.19 1 = 구덩이류, 2 = 벽류
  const LAYOUT_BIG_EXTRA = { plain: ['groves'], greathall: ['nave', 'sideHalls'] };
  const LAYOUT_BY = {
    combat: ['pillars4', 'pillars6', 'ring', 'centerPit', 'twinPits', 'cross', 'lanes', 'rubble', 'pitBand', 'blocks', 'pitsScatter', 'halls', 'pond'],
    elite: ['open', 'pillars4', 'pillars6', 'ring', 'rubble', 'centerPit'],
    survive: ['pillars4', 'ring', 'rubble', 'pond', 'pitBand'],
  };
  function mkObs(spec, sx = 1, sy = 1) {
    let [k, u, v, a, b] = spec; const p = U(u, v);
    if (k === 'r') a = Math.max(10, Math.min(26, a * Math.min(sx, sy))); else if (k !== 'p') { a = Math.round(a * sx / 2) * 2; b = Math.round(b * sy / 2) * 2; }
    if (k === 'p') return { t: 'pillar', c: true, x: p.x, y: p.y, r: 13 };
    if (k === 'r') return { t: 'rock', c: true, x: p.x, y: p.y, r: a };
    const t = k === 'w' ? 'wall' : 'pit';
    return { t, c: false, x: p.x, y: p.y, w: a, h: b, x0: p.x - a / 2, y0: p.y - b / 2, x1: p.x + a / 2, y1: p.y + b / 2 };
  }
  // v2.91 격자처럼 줄 맞춰 보이지 않게: 둥근 장애물(나무 · 기둥 · 바위)은 칸 단위로 살짝 비틀고, 많이 늘어선 배치는 몇 개를 뺀다
  //        벽 · 구덩이도 조금 비튼다 (방 가운데 · 문 앞 · 길 연결 검사는 이 뒤에 그대로 함)
  const NAT_ROW = { colonnade: 1, nave: 1, vColon: 1, trailEdge: 1, vEdge: 1, pillars6: 1, ring: 1, groves: 1 };
  function naturalize(obs, name, gridPillar) { // v3.19 gridPillar: 성채(2장 · 4장)의 돌기둥은 비틀지 않고 줄을 맞춤 — 1장 나무 · 3장은 그대로
    const W = A.x1 - A.x0, H = A.y1 - A.y0, s2 = v => Math.round(v / 2) * 2;
    const rnd = obs.filter(b => b.c), jx = Math.min(26, W * 0.035), jy = Math.min(22, H * 0.05), nRect = obs.length - rnd.length; // v3.19 벽 · 구덩이가 둘 이상이면 비틀지 않고 줄을 맞춤
    for (const b of obs) {
      if (b.c && gridPillar && b.t === 'pillar') { b.x = s2(b.x); b.y = s2(b.y); }
      else if (b.c) { b.x = s2(b.x + rand(-jx, jx)); b.y = s2(b.y + rand(-jy, jy)); if (b.t === 'rock') b.r = Math.max(10, Math.round(b.r * rand(0.85, 1.12))); }
      else if (nRect < 2) { const dx = s2(rand(-10, 10)), dy = s2(rand(-8, 8)); b.x += dx; b.y += dy; b.x0 += dx; b.x1 += dx; b.y0 += dy; b.y1 += dy; }
    }
    if (NAT_ROW[name] && rnd.length >= 6) { // 줄지어 선 배치: 25%씩 빼되 4개는 남김
      let left = rnd.length; const gone = new Set();
      for (const b of rnd.slice().sort(() => Math.random() - 0.5)) if (left > 4 && Math.random() < 0.25) { gone.add(b); left--; }
      obs = obs.filter(b => !gone.has(b));
    }
    return obs;
  }
  function obsHitL(list, x, y, r, solidOnly) {
    for (const b of list) {
      if (b.ghost || (solidOnly && b.t === 'pit')) continue;
      if (b.c) { if (Math.hypot(x - b.x, y - b.y) < b.r + r) return b; }
      else { const cx = clamp(x, b.x0, b.x1), cy = clamp(y, b.y0, b.y1); if (Math.hypot(x - cx, y - cy) < r) return b; }
    }
    return null;
  }
  const solidAt = (x, y, r = 2) => !!(G && G.obs && G.obs.length && obsHitL(G.obs, x, y, r, true));
  // 투사체는 이전 위치→새 위치 선분을 4px 간격으로 검사해 얇은 장애물도 건너뛰지 않는다 (v0.59)
  function segSolid(x0, y0, x1, y1, r = 3) { if (!G || !G.obs || !G.obs.length) return false; const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / 4)); for (let i = 1; i <= n; i++) { const t = i / n; if (obsHitL(G.obs, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, true)) return true; } return false; }
  // 돌진은 장애물(구덩이 포함)에 닿으면 멈춘다
  const dashBlocked = (e, pits = true) => !!(G && G.obs && G.obs.length && obsHitL(G.obs, e.x, e.y, e.r, !pits));
  // 원(유닛)을 장애물 밖으로 밀어낸다
  const WALL_SIDE = 7;
  function solveObs(o, r, ignorePit) {
    const L = G && G.obs; if (!L || !L.length) return false;
    let hit = false;
    for (const b of L) {
      if (b.ghost || (ignorePit && b.t === 'pit')) continue;
      if (b.c) {
        let dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy); const m = b.r + r;
        if (d < m) { if (d < 0.01) { dx = 1; dy = 0; d = 1; } o.x = b.x + dx / d * m; o.y = b.y + dy / d * m; hit = true; }
      } else {
        const sp = b.t === 'wall' ? WALL_SIDE : 0, bx0 = b.x0 - sp, bx1 = b.x1 + sp; // v3.19 벽은 양옆으로 7px 더 막음 — 옆에 붙어 섰을 때 몸이 벽 그림에 반쯤 가려져 벽 안으로 들어간 것처럼 보이던 문제
        const cx = clamp(o.x, bx0, bx1), cy = clamp(o.y, b.y0, b.y1), dx = o.x - cx, dy = o.y - cy, d = Math.hypot(dx, dy);
        if (d < r) {
          if (d > 0.01) { o.x = cx + dx / d * r; o.y = cy + dy / d * r; }
          else {
            const l = o.x - bx0, rr = bx1 - o.x, t = o.y - b.y0, bt = b.y1 - o.y, m = Math.min(l, rr, t, bt);
            if (m === l) o.x = bx0 - r; else if (m === rr) o.x = bx1 + r; else if (m === t) o.y = b.y0 - r; else o.y = b.y1 + r;
          }
          hit = true;
        }
      }
    }
    return hit;
  }
  // 길찾기 격자 (10px)
  const NAV = 10; let NC = Math.ceil((A.x1 - A.x0) / NAV), NR = Math.ceil((A.y1 - A.y0) / NAV);
  const navIdx = (x, y) => { const i = Math.floor((x - A.x0) / NAV), j = Math.floor((y - A.y0) / NAV); return i < 0 || j < 0 || i >= NC || j >= NR ? -1 : j * NC + i; };
  function buildNav(obs, r = 9) {
    const f = new Uint8Array(NC * NR);
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) f[j * NC + i] = obsHitL(obs, A.x0 + (i + 0.5) * NAV, A.y0 + (j + 0.5) * NAV, r) ? 0 : 1;
    return f;
  }
  function navFlood(nav, sx, sy) {
    const dist = new Int16Array(NC * NR).fill(-1), s = navIdx(sx, sy);
    if (s < 0) return dist;
    const q = new Int32Array(NC * NR); let h = 0, t = 0;
    dist[s] = 0; q[t++] = s;
    while (h < t) {
      const c = q[h++], i = c % NC, j = (c / NC) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NC || nj >= NR) continue;
        const n = nj * NC + ni; if (dist[n] >= 0 || !nav[n]) continue;
        if (di && dj && (!nav[j * NC + ni] || !nav[nj * NC + i])) continue;
        dist[n] = dist[c] + 1; q[t++] = n;
      }
    }
    return dist;
  }
  // v3.20 들머리 장애물 (방 비율 u · v): 기둥 · 바위는 방 가운데 기준 좌우 대칭 · 같은 크기
  const START_OBS = {
    1: [['p', 0.13, 0.24], ['p', 0.87, 0.24], ['w', 0.2, 0.74, 132, 74], ['h', 0.8, 0.74, 132, 74]], // 이끼 낀 부러진 돌기둥 둘 · 아래 좌우: 무너진 폐허 + 폐허 저수지 (같은 크기)
    2: [['p', 0.14, 0.26], ['p', 0.86, 0.26], ['w', 0.2, 0.76, 132, 70], ['w', 0.8, 0.76, 132, 70]], // 기둥 둘 · 아래 좌우: 쇠 울타리 두른 낭떠러지 (같은 크기)
    3: [['w', 0.2, 0.77, 152, 64], ['h', 0.8, 0.77, 152, 64]], // 아래 좌우: 짐승 우리 + 피웅덩이 (같은 크기)
    4: [['w', 0.19, 0.76, 140, 76], ['w', 0.81, 0.76, 140, 76]] }; // 아래 좌우: 늘어선 집 (같은 크기)
  const CLEAR_R = 64; // 방 가운데 비워 둘 반지름
  const THICK3 = 56; // v3.19 3장: 우리 · 피웅덩이의 최소 두께 (가늘고 긴 벽이 실처럼 보이지 않게, 가운데를 기준으로 양쪽으로 넓힘)
  const MIN1 = [120, 90]; // v3.19 1장: 속이 빈 폐허 · 저수지(폭 56px 이상 덩어리)의 최소 크기 — 좁으면 안쪽 잔해가 뭉쳐 보임. 가는 돌담은 그대로
  function min1(b) { if (b.c || b.brook || b.pool || (b.t !== 'wall' && b.t !== 'pit') || Math.min(b.w, b.h) < 56) return b; if (b.w < MIN1[0]) { b.w = MIN1[0]; b.x0 = b.x - b.w / 2; b.x1 = b.x + b.w / 2; } if (b.h < MIN1[1]) { b.h = MIN1[1]; b.y0 = b.y - b.h / 2; b.y1 = b.y + b.h / 2; } return b; }
  function thick3(b) { if (b.c) return b; if (b.w < THICK3) { b.w = THICK3; b.x0 = b.x - THICK3 / 2; b.x1 = b.x + THICK3 / 2; } if (b.h < THICK3) { b.h = THICK3; b.y0 = b.y - THICK3 / 2; b.y1 = b.y + THICK3 / 2; } return b; }
  function layoutRoom(r, stage) {
    const realStage = stage; if (stage === 4) stage = 2; // v1.22 왕도의 방 배치·장식은 우선 성채 규칙을 빌린다
    withSeed(r.seed, () => {
      const keyPts = []; // 문 앞, 텔레포터, 상자 등 비워 둘 자리
      for (const d in r.doors) if (r.doors[d] != null) keyPts.push(doorIn(d, 34));
      if (r.crack) keyPts.push(doorIn(r.crack.dir, 34));
      const fight = !!LAYOUT_BY[r.type], sh = r.shape, own = LAYOUT_SHAPE_POOL[sh];
      let pool = !fight ? (sh === 'glade' && r.type === 'start' ? ['glade1'] : ['open']) : own ? own.slice() : LAYOUT_BY[r.type].concat(r.type === 'combat' ? LAYOUT_BIG_EXTRA[sh] || [] : []);
      const sx = (A.x1 - A.x0) / 1000, sy = (A.y1 - A.y0) / 540, scaled = n => !LAYOUTS_SHAPE[n];
      // v3.19 큰 방(900×450 이상 전투방)에는 벽 · 웅덩이류가 반드시 하나 이상 — 4장은 구덩이가 잔해로 바뀌므로 벽(집 · 성벽)만 셈
      const big = fight && A.x1 - A.x0 >= 900 && A.y1 - A.y0 >= 450, rectOk = b => !b.c && (b.t === 'wall' || b.t === 'pit'); // v3.19 4장도 불탄 자리가 웅덩이 자리
      if (big) { const p2 = [...new Set(pool.concat(r.type === 'combat' ? [] : BIG_RECT))].filter(n => LAYOUT_RECT[n] === 2 || LAYOUT_RECT[n] === 1); if (p2.length) pool = p2; }
      let obs = [];
      for (let tries = 0; tries < 12 && pool.length; tries++) {
        const name = pool.splice(randi(0, pool.length - 1), 1)[0];
        obs = naturalize(LAYOUTS[name]().map(sp => scaled(name) ? mkObs(sp, sx, sy) : mkObs(sp)), name, stage === 2 || stage === 3 /* v3.26 3장 토템도 2장 기둥처럼 줄 맞춤 */).map(b => stage === 3 ? thick3(b) : realStage === 1 ? min1(b) : b).filter(b => !keyPts.some(p => obsHitL([b], p.x, p.y, Math.min(62, (Math.min(A.x1 - A.x0, A.y1 - A.y0)) * 0.22))));
        // 방 가운데(보상 상자·텔레포터 자리)는 비운다: 큰 벽·구덩이가 걸리면 다른 배치, 바위·기둥은 빼기 (v0.59)
        if (obs.some(b => !b.c && obsHitL([b], CX, CY - 10, CLEAR_R))) { obs = []; continue; }
        obs = obs.filter(b => !obsHitL([b], CX, CY - 10, CLEAR_R));
        if (stage === 3) { const sgD = (px, py, ax, ay) => { const vx = CX - ax, vy = CY - ay, L = vx * vx + vy * vy || 1, t = clamp(((px - ax) * vx + (py - ay) * vy) / L, 0, 1); return Math.hypot(px - ax - vx * t, py - ay - vy * t); }; // v3.26 바위 · 토템 등 둥근 장애물은 문 → 가운데 길을 막지 않게
          const drs = Object.keys(r.doors).filter(d => r.doors[d] != null).map(d => DOOR[d]); obs = obs.filter(b => !b.c || drs.every(q => sgD(b.x, b.y, q.x, q.y) > b.r + 24)); }
        if (big && !obs.some(rectOk)) { obs = []; continue; }
        // 둥근 장애물끼리 겹치지 않게
        obs = obs.filter((b, i) => !b.c || !obs.slice(0, i).some(o => o.c ? Math.hypot(o.x - b.x, o.y - b.y) < o.r + b.r + (stage === 3 ? 30 : 10) : obsHitL([o], b.x, b.y, b.r + 6)));
        if (!obs.length && name !== 'open') continue;
        const nav = buildNav(obs), ok = keyPts.length < 2 || (() => { const dd = navFlood(nav, keyPts[0].x, keyPts[0].y); return keyPts.every(p => dd[navIdx(p.x, p.y)] >= 0); })();
        const center = navFlood(nav, CX, CY + 40);
        if (ok && keyPts.every(p => center[navIdx(p.x, p.y)] >= 0 || !nav[navIdx(CX, CY + 40)])) { r.layout = name; break; }
        obs = [];
      }
      if (r.type === 'start' && START_OBS[realStage]) { obs = START_OBS[realStage].map(sp => mkObs(sp)).filter(b => !keyPts.some(p => obsHitL([b], p.x, p.y, 40))); r.layout = 'start'; } // v3.20 들머리: 방 가운데 기준 좌우 대칭 고정 배치
      if (realStage <= 4 && r.type !== 'start') { // v3.19 같은 크기의 벽 · 웅덩이는 섞여 나올 수 있음 (3장: 우리 + 피웅덩이) (예: 벽 하나 + 웅덩이 하나, 벽 셋 + 웅덩이 하나) — 가늘고 긴 벽(폭 56px 미만)은 제외
        const RB = obs.filter(b => !b.c && (b.t === 'wall' || b.t === 'pit') && Math.min(b.w, b.h) >= 56);
        if (RB.length >= 2 && Math.random() < 0.6) { const sh = RB.slice().sort(() => Math.random() - 0.5), k = randi(1, RB.length - 1); for (let i = 0; i < k; i++) sh[i].t = sh[i].t === 'wall' ? 'pit' : 'wall'; }
      }
      if (realStage === 4) { // v1.23 왕도엔 구덩이 없음 — 그 자리엔 잔해·깨진 종이 줄지어 놓인다
        const add = [];
        const thin4 = b => b.t === 'pit' && (b.c || Math.min(b.w, b.h) < 56); // v3.19 폭 56px 이상 구덩이는 불탄 자리로 남고, 가는 것만 예전처럼 잔해 줄로
        for (const b of obs) if (thin4(b)) { const along = b.w >= b.h, L = along ? b.w : b.h, n = Math.max(1, Math.round(L / 70));
          for (let i = 0; i < n; i++) { if (n > 2 && Math.random() < 0.3) continue; const t = (i + 0.5) / n - 0.5 + rand(-0.12, 0.12) / n, rr = randi(11, 17), off = rand(-16, 16); add.push({ t: 'rock', c: true, x: Math.round((b.x + (along ? t * L : off)) / 2) * 2, y: Math.round((b.y + (along ? off : t * L)) / 2) * 2, r: rr }); } } // v2.91 한 줄로 반듯하게 늘어서지 않게
        obs = obs.filter(b => !thin4(b)).concat(add.filter(b => !obsHitL([{ t: 'x', c: true, x: CX, y: CY - 10, r: 0 }], b.x, b.y, CLEAR_R + b.r)));
      }
      if (stage === 3) for (const b of obs) {
        const sq = b.w <= 150 && b.h <= 150 && b.w / b.h > 0.5 && b.w / b.h < 2;
        const NO_TOWER3 = true; // v3.26 망루 삭제 (false로 두면 예전처럼 망루가 나옴)
        if (b.t === 'pit') { if (sq && !NO_TOWER3) { b.t = 'wall'; b.tower = true; } } // v3.19 네모난 작은 구덩이만 망루로 — 나머지는 피웅덩이로 남음
        else if (!NO_TOWER3 && b.t === 'wall' && sq && b.w >= 36 && Math.random() < 0.5) b.tower = true;
      }
      // v0.99 망루는 네 기둥만 막힌다 — 발판 아래로 지나갈 수 있음 (그림은 b, 판정은 기둥 4개)
      if (stage === 3) for (const b of obs.slice()) if (b.tower) { b.ghost = true; for (const [x, y] of [[b.x0 + 7, b.y0 + 2], [b.x1 - 7, b.y0 + 2], [b.x0 + 3, b.y1 - 4], [b.x1 - 3, b.y1 - 4]]) obs.push({ t: 'post', c: true, x, y, r: 5, of: b }); }
      // 특별한 방의 큰 소품은 막힌 자리 (v0.76)
      const box = (x0, y0, x1, y1) => obs.push({ t: 'prop', c: false, x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, x0, y0, x1, y1 }), ring = (x, y, rr) => obs.push({ t: 'prop', c: true, x, y, r: rr });
      if (r.type === 'rest') ring(CX + SR_FIRE.dx, CY + SR_FIRE.dy, 18);
      r.obs = obs; r.nav = buildNav(obs);
      // 특수 지점
      const freeSpot = (cands) => cands.map(([u, v]) => U(u, v)).find(p => !obsHitL(obs, p.x, p.y, 34)) || U(.5, .5);
      if (r.hasTele) { // v1.90 방 가운데는 보상 상자·봉인 열쇠 자리 → 텔레포터는 비켜서 둠
        const okT = p => !obsHitL(obs, p.x, p.y, 34) && Math.hypot(p.x - CX, p.y - (CY - 10)) > 90 && Math.hypot(p.x - CX, p.y - (CY + 44)) > 60;
        r.tele = [[.25, .5], [.75, .5], [.3, .3], [.7, .7], [.7, .3], [.3, .7], [.5, .2], [.5, .82], [.15, .2], [.85, .8], [.15, .8], [.85, .2]].map(([u, v]) => U(u, v)).find(okT) || (() => { let best = null, bd = -1; for (let u = 0.15; u <= 0.86; u += 0.05) for (let v = 0.18; v <= 0.84; v += 0.06) { const q = U(u, v); if (obsHitL(obs, q.x, q.y, 34)) continue; const d = Math.min(Math.hypot(q.x - CX, q.y - (CY - 10)), Math.hypot(q.x - CX, q.y - (CY + 44)) + 30); if (d > bd) { bd = d; best = q; } } return best || freeSpot([[.25, .5], [.75, .5]]); })(); }
      if (SR_TELE[r.type]) r.tele = { x: CX + SR_TELE[r.type][0], y: CY + SR_TELE[r.type][1] }; // v1.11
      if (r.type === 'boss') { const far = q => !obsHitL(obs, q.x, q.y, 34) && (!r.tele || Math.hypot(q.x - r.tele.x, q.y - r.tele.y) > 80) && Math.hypot(q.x - CX, q.y - (CY - 10)) > 70; // v1.01 다음 스테이지 출구
        r.exitP = [[.5, .22], [.5, .78], [.3, .25], [.7, .25], [.22, .5], [.78, .5], [.3, .75], [.7, .75]].map(([u, v]) => U(u, v)).find(far) || U(.5, .22); }
      if (r.type === 'reward') r.chest = { x: CX, y: CY - 20, opened: false, kind: 'reward' };
      if (r.type === 'secret') { r.chest = { x: CX, y: CY - 10, opened: false, kind: 'secret' }; r.altars = [{ x: CX - 96, y: CY + 44, k: 'gear' }, { x: CX + 96, y: CY + 44, k: 'heart' }]; } // v2.02 피의 제단
      if (r.type === 'shop') {
        const mul = realStage === 4 ? 1.9 : stage === 2 ? 1.3 : stage === 3 ? 1.6 : 1;
        const all = [['meat', 100], ['orb', 45], ['vial', 55], ['gear', 650], ['iron', 30], ['armor', 220]].filter(([k]) => !(k === 'orb' && G && G.cls === 'priest')); // v2.00 방패 조각 · v3.83 성직자는 투지 결정 없음
        const pickd = [all.find(x => x[0] === 'meat'), all.find(x => x[0] === 'gear'), ['heartUp', 800], ...all.filter(x => x[0] !== 'meat' && x[0] !== 'gear').sort(() => Math.random() - 0.5).slice(0, 1)].sort((a, b) => a[1] - b[1]); // v2.02 빈 하트 그릇은 가게마다 하나
        r.shop = pickd.map(([k, p], i) => ({ k, price: Math.round(p * mul * ASCF.shop() / 5) * 5, x: CX - 135 + i * 90, y: CY + 40, sold: false }));
      }
      // 방 꾸미기 설정과 서 있는 소품
      r.style = stage === 3
        ? { orc: true, ground: pick(['tread', 'tread', 'ring', 'none']), wall: Array.from({ length: 10 }, () => pick(['hide', 'hide', 'skull', 'skull', 'banner', 'spikes', 'none'])) }
        : stage === 1
        ? { path: pick(['wind', 'wind', 'wind', 'straight', 'straight', 'stones', 'brook', 'none']), ph: rand(0, 6), off: pick([-1, 1]) * rand(0.5, 1), ea: rand(0.04, 0.22), eb: rand(0.04, 0.22), ec: rand(0.06, 0.2), doors: Object.keys(r.doors).filter(d => r.doors[d] != null) }
        : { wall: Array.from({ length: 8 }, () => pick(['window', 'window', 'window', 'tapestry', 'tapestry', 'shieldSwords', 'shieldSwords', 'portrait', 'chains', 'skullNiche'])) };
      if (SR_LAYOUT[r.type] && stage === 1) { r.style.path = 'none'; r.style.doors = []; } // v1.11 특별한 방엔 길 없음
      const brookSide = () => { if (r.style.path !== 'brook') return; const free = ['n', 's', 'w', 'e'].filter(d => r.doors[d] == null && !(r.crack && r.crack.dir === d)); if (!free.length) { r.style.path = 'wind'; return; } r.style.side = pick(free); };
      const spots = keyPts.concat(r.tele ? [r.tele] : [], r.chest ? [r.chest] : [], r.shop || [], r.type === 'rest' ? [{ x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy }] : []);
      if (stage === 1) brookSide();
      if (stage === 1 && (r.style.path !== 'none' || r.style.doors.length)) { // 길이 나무·덤불·연못 밑으로 지나가지 않게
        const RS0 = ROOMSTYLE, clash = () => { brookSide(); ROOMSTYLE = r.style; const cs = meadowCurves(); ROOMSTYLE = RS0; return cs.some(c => { for (let t = c.a; t < c.b; t += 4) { const m = c.at(t); const px = c.vert ? m : t, py = c.vert ? t : m; if (obsHitL(obs, px, py, c.kind === 'brook' ? 30 : 28) || (c.kind === 'brook' && (Math.hypot(px - CX, py - (CY - 10)) < CLEAR_R + 18 || spots.some(q => Math.hypot(px - q.x, py - q.y) < 46)))) return true; } return false; }); };
        for (let k = 0; k < 10 && clash(); k++) Object.assign(r.style, { path: pick(['wind', 'wind', 'straight', 'stones', 'brook']), ph: rand(0, 6), off: pick([-1, 1]) * rand(0.5, 1) });
        if (clash()) {
          r.style.path = 'straight'; r.style.ph = 0; r.style.off = 0;
          ROOMSTYLE = r.style; const safePaths = meadowCurves(); ROOMSTYLE = RS0;
          const blocksRoad = b => safePaths.some(c => { for (let t = c.a; t <= c.b; t += 4) { const m = c.at(t), px = c.vert ? m : t, py = c.vert ? t : m; if (obsHitL([b], px, py, 28)) return true; } return false; });
          const kept = obs.filter(b => !blocksRoad(b));
          if (big && !kept.some(rectOk)) { r.style.path = 'none'; r.style.doors = []; } // v3.19 큰 방의 벽 · 웅덩이가 길 때문에 다 빠지면 길을 없앰
          else { obs = kept; r.obs = obs; r.nav = buildNav(obs); }
        }
      }
      const pts = keyPts.slice(); pts.push({ x: CX, y: CY - 10, big: true });
      if (r.tele) pts.push(r.tele); if (r.chest) pts.push(r.chest); if (r.shop) pts.push(...r.shop, { x: CX, y: CY - 70 }, { x: CX + 30, y: CY - 70 }); if (r.type === 'rest') pts.push({ x: CX - 4, y: CY - 10 }); // 모닥불 옆 (불 자체는 막힌 자리라 연결 검사에서 빼야 소품이 지워지지 않는다)
      if (r.type === 'boss' && r.style.path === 'brook') r.style.path = 'wind'; // 보스 방에는 개울 없음
      if (stage === 1 && realStage === 1) r.style.pave = obs.some(b => !b.c && (b.t === 'wall' || (b.t === 'pit' && !b.brook && !b.pool))); // v3.19 폐허(벽)나 저수지가 있는 방만 옛 돌길, 나머지는 흙길
      if (r.type !== 'boss' || stage === 3) decorRoom(r, realStage, pts); else r.props = [];
      r.spritesN = spriteObsN(r); // v2.85 장애물 그림은 배치 때 한 번 만들어 그대로 씀 (점유 지도가 실제 그림으로 잼)
    });
  }
  const spriteObsN = R => R.obs.filter(b => !['pit', 'prop', 'drum', 'chest'].includes(b.t)).length;

  // ---------- 진입·진행
  function newDungeon() {
    G.dun = genDungeon(G.stage);
    G.mood = null;
    enterRoom(G.dun.start, null);
    if (!wmStart()) showStageParchment(G.stage, G.cls);
  }
  function setMood(m) { if (G.mood !== m) { G.mood = m; window.AudioSys.setMood(m, true); } }
  // v1.81: 챕터(1~4)마다 다른 칩튠 곡 — 탐험 '' · 봉인 'Survive' · 보스 'Boss' · 휴식 'Rest'
  function stageMood(k) { return 's' + clamp((G && G.stage) | 0, 1, 4) + k; }
  const hiddenDoor = (R, d) => (R.crack && R.crack.dir === d && !R.crack.broken) || TRUTH.sealHidden(R, d); // v2.59 인장 벽(닫힘)도 숨은 문
  function roomPillars(R) { // v3.65 방마다 벽 기둥 · 횃불 자리 정리 (enterRoom · 미리 그리기 공용)
    if (R.sealW) { PILLARS = PILLARS.filter(x => Math.abs(x - DOOR.n.x) > 100); TORCHES = TORCHES.filter(t => Math.abs(t.x - DOOR.n.x) > 100); }
    if (R.doors && R.doors.n != null && !R.sealW) { PILLARS = PILLARS.filter(x => Math.abs(x - DOOR.n.x) > 78); TORCHES = TORCHES.filter(t => Math.abs(t.x - DOOR.n.x) > 78); }
    if (R.type === 'altar') { PILLARS = [CX - 290, CX - 190, CX + 190, CX + 290]; TORCHES = PILLARS.map(x => ({ x, y: A.y0 - 38 })); }
  }
  function enterRoom(R, entry, opt = {}) {
    const D = G.dun, P = G.player, prevR = D.cur; // v3.64 직전 방
    if (G.kgAuto && D.cur && D.cur !== R) { G.kg = false; G.kgAuto = false; } // v2.19 다음 방으로 넘어가면 조작 안내를 접는다 (H로 다시)
    if (D.cur && D.cur !== R) D.cur.loot = G.loot.filter(l => l.life > 0);
    setArena(SHAPES[R.shape]);
    roomPillars(R);
    if (false) { PILLARS = PILLARS.filter(x => Math.abs(x - DOOR.n.x) > 100); TORCHES = TORCHES.filter(t => Math.abs(t.x - DOOR.n.x) > 100); } // v2.64 인장 벽 둘레엔 벽 기둥·깃발·횃불 없음
    if (false) { /* v3.65 roomPillars로 옮김 · v3.20 모든 장: 3장 부락에서도 북문 안에 횃불이 서던 문제 */ PILLARS = PILLARS.filter(x => Math.abs(x - DOOR.n.x) > 78); TORCHES = TORCHES.filter(t => Math.abs(t.x - DOOR.n.x) > 78); } // v3.19 북문 자리의 벽 기둥 · 횃불은 뺌 (문 · 문 옆 화로와 겹침)
    if (false) { /* v3.65 roomPillars로 옮김 */ } // v3.20 왕도 성문 방: 뒷벽 기둥 · 창 · 횃불을 성문 기준 좌우 대칭으로 (방 왼쪽 끝 기준이라 한쪽으로 쏠렸음)
    END.prepRoom(R); // v2.54 2회차부터 대관식장 가운데에 잿빛 왕의 흔적
    R.socks = sealSocks(R);
    D.cur = R; R.visited = true; R.seen = true;
    for (const d in R.doors) if (R.doors[d] != null && !hiddenDoor(R, d)) D.rooms[R.doors[d]].seen = true;
    G.meteorAim = false; G.wproj = []; G.dustC = []; G.soup = []; G.smoke = []; G.harp = null; G.mmet = []; G.tstopT = 0; G.enemies = []; G.tele = []; G.hazards = []; G.ashClouds = []; G.ashShots = []; G.proj = []; G.eproj = []; G.mproj = []; G.meteor = null; G.vortex = null; G.boss = null; G.bonfire = null;
    G.fx = []; G.parts = []; G.nums = []; G.corpses = R.keepC ? R.keepC.slice() : []; G.spawning = 0; // v2.38 난입자 시체는 방에 남음
    G.drums = R.drum ? [R.drum] : []; G.shocks = []; P.grab = null; P.thrown = null; P.lift = 0;
    G.loot = R.loot || []; R.loot = []; G.pfire = [];
    if (G.stats && G.stats.efx.has('first') && !R.cleared && ['combat', 'elite', 'survive', 'boss'].includes(R.type)) { P.critNext = true; P.firstCrit = true; P.firstN = 2; } /* v1.51 첫 적중 + 2번 더 */
    G.obs = R.obs; G.nav = R.nav; G.navDist = null; G.navT = 0;
    if (!R.sprites || (R.spritesN != null && R.spritesN !== spriteObsN(R))) { R.sprites = makeObsSprites(R); R.spritesN = spriteObsN(R); } // v2.85 장애물이 바뀐 방(진엔딩 단서 등)만 다시
    G.flies = G.stage === 1 && R.type !== 'forge' && R.type !== 'home' ? Array.from({ length: randi(6, 14) }, () => ({ x: rand(A.x0 + 20, A.x1 - 20), y: rand(A.y0 + 10, A.y1 - 20), rx: rand(10, 30), ry: rand(6, 16), s: rand(0.6, 1.4), p: rand(0, 6) })) : null;
    dg.clearRect(0, 0, W, H);
    floorCached(R); G.entryDt = true; P.staffUntil = time + 3; // v2.36 순례자의 지팡이 // v2.35 다시 들어간 방은 그려 둔 바닥을 그대로 · 들어온 직후 한 프레임은 시간 점프 없이
    G.phase = R.tier || 1;
    G.rs = { state: 'idle', t: 0, wave: 0, surviveT: 0 };
    G.sealed = false;
    // 플레이어 위치
    let p = entry ? doorIn(entry, 30) : opt.tele && R.tele ? { x: R.tele.x, y: R.tele.y + 22 } : { x: CX, y: Math.min(CY + 60, A.y1 - 30) };
    if (!entry && !opt.tele && R.type === 'boss') p = { x: CX, y: A.y1 - 60 };
    Object.assign(P, { x: p.x, y: p.y, state: 'idle', t: 0, lift: 0, giant: 0, queued: false, trail: [], trail2: [], inv: Math.max(P.inv, 0.6), iframe: 0 });
    solveObs(P, P.r);
    // 방 종류별
    const fresh = !R.cleared;
    if (R.type === 'combat' || R.type === 'elite' || R.type === 'survive' || R.type === 'boss') {
      if (fresh) { G.rs.state = 'intro'; sealRoom(true); }
    } else R.cleared = true;
    if (fresh && R.type === 'elite') banner(ER().n, ER().sub[R.tier] || STG().elite);
    if (fresh && R.type === 'survive') banner('닫힌 결계', `문이 닫혔다 · ${SURV_N}차례의 습격을 견뎌야 한다`);
    if (fresh && R.type === 'boss') { const kgQuiet = G.stage === 3 && typeof TRUTH3 !== 'undefined' && TRUTH3.T3 && TRUTH3.T3.freed; /* v3.80 저주가 풀린 크루가쉬: 이름 배너 · 보스 등장음 없이 조용히 (결투가 시작될 때 「약속의 결투」) */ if (!kgQuiet) banner(STG().boss, STG().bossSub); $('bossName').textContent = STG().boss; if (!kgQuiet) sfx('boss'); G.bossTime = 300; G.phase = 11; }
    if (R.type === 'shop') shopHeartFix(R);
    if (R.type === 'rest') { G.bonfire = { x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy }; if (!R.healed) { R.healed = true; if (hasRelic('lantern')) { addArmor(1); lootFeed('희망의 등불 — 방패 +1', '#ffd34d'); } /* v2.36 */ P.hp = ascOn(9) ? Math.min(G.stats.hp, P.hp + Math.round((G.stats.hp - P.hp) * 0.5 * ASCF.heal())) : G.stats.hp; /* v1.96 꺼진 모닥불 */ banner(BISTRO.NAME, '언제든 식사 됩니다.', false, CX); /* v3.10 맵 가운데 */ /* v3.10 */ } }
    if (R.type === 'shop' && !R.greeted) { R.greeted = true; banner('살구의 비밀상점', '네고 없음, 환불 불가'); }
    if (R.type === 'reward' && !R.greeted) { R.greeted = true; banner('숨은 보고', ''); }
    if (hasRelic('oldmap')) for (const r of G.dun.rooms) if (r.type === 'secret') r.seen = true; // v2.29 낡은 지도
    if (fresh && R.type === 'boss' && hasRelic('gravedirt')) { addArmor(1); lootFeed('무덤 흙 — 방패 +1', '#c8a880'); }
    if (R.type === 'secret' && !R.greeted) { rec('secret'); R.greeted = true; banner('잊힌 틈새', '잊힌 틈새에 남은 물건이 있다'); }
    const RM = { den: 'den', ruin: 'ruin', rest: 'rmBistro', shop: 'rmShop', reward: 'rmReward', secret: 'rmSecret' }; // v3.19 쉬는 방마다 전용 곡 (비스트로 · 상점 · 숨은 보고 · 잊힌 틈새)
    if (RM[R.type]) setMood(RM[R.type]); else
    setMood(stageMood(R.type === 'boss' && fresh ? 'Boss' : R.type === 'survive' && fresh ? 'Survive' : ['rest', 'shop', 'secret', 'reward', 'shrine'].includes(R.type) ? 'Rest' : ''));
    if (R.type === 'shrine' && !R.greeted) { R.greeted = true; banner('빛의 샘', '세 빛이 겹친 자리에 흰 빛이 떠 있다'); } // v3.25
    if (R.type === 'start') {
      spawnDummy(); // v2.04 들머리 허수아비 (무기 시험용)
      if (G.stage === 1 && !SAVE.tutDone && !G.tutDone) { G.tut = { step: 0, moveT: 0, atkN: 0, skN: 0, awkN: 0, dashN: 0, doneT: 0 }; G.sealed = true; G.tutSeal = true; } // v3.64 튜토리얼을 마쳐야 통로가 열림
    } else if (G.tut) {
      G.tut = null;
    }
    if (R.type !== 'start' && prevR && prevR !== R && prevR.type === 'start' && G.player) { G.player.gauge = 0; } // v3.64 들머리를 나가면 궁극기 게이지 0 (튜토리얼 · 허수아비로 채운 게이지를 들고 나가지 않게)
    updateCamera(0, true);
  }
  // v2.04 허수아비: 맞고, 상태 이상이 걸리고, 죽지 않는다 (HP가 바닥나면 다시 가득) · 움직이거나 공격하지 않음
  function spawnDummy() {
    const cands = [[90, -30], [-90, -30], [90, 30], [-90, 30], [0, -60], [120, 0], [-120, 0]];
    let px = CX + 90, py = CY - 30;
    for (const [dx, dy] of cands) { const x = CX + dx, y = CY + dy; if (!obsHitL(G.obs || [], x, y, 16) && Math.hypot(x - G.player.x, y - G.player.y) > 40) { px = x; py = y; break; } }
    G.enemies.push({ type: 'dummy', x: px, y: py, hx: px, hy: py, z: 0, r: 9, hp: 500, maxHp: 500, atk: 0, def: 0, spd: 0, kbRes: 0, vx: 0, vy: 0, face: -1, walk: 0, lean: 0, flash: 0, rise: 0, state: 'idle', t: 0, squash: 0, glow: 0, hitT: 0 });
  }
  const isDummy = e => e && e.type === 'dummy';
  function restartRoom() { enterRoom(G.dun.cur, null); }
  function sealRoom(on) {
    if (G.sealed === on) return;
    G.sealed = on; if (!on) pasOnClear(); // v2.22 보관 패시브 (방을 비움)
    sfx(on ? 'heavy' : 'ready'); addShake(on ? 4 : 2);
    for (const d in DIRS) if (G.dun.cur.doors[d] != null && !hiddenDoor(G.dun.cur, d)) { const q = doorIn(d, 4); dust(q.x, q.y, 8); }
  }
  function doorState(R, d) {
    const id = R.doors[d]; if (id == null) return 'none';
    if (hiddenDoor(R, d)) return R.crack && R.crack.dir === d ? 'crack' : 'none';
    if (G.sealed) return 'sealed';
    if (G.dun.rooms[id].type === 'boss' && !G.dun.bossOpen) return 'boss';
    return 'open';
  }
  function goRoom(R, entry, tele) {
    if (G.trans) return;
    sfx(tele ? 'awaken' : 'dodge');
    G.trans = { t: 0, dur: tele ? 0.3 : 0.16, phase: 'out', go: () => enterRoom(R, entry, { tele }) };
  }
  function updateTrans(rdt) {
    const tr = G.trans; if (!tr) return false;
    tr.t += rdt;
    if (tr.phase === 'out') { if (tr.t >= tr.dur) { tr.go(); tr.phase = 'in'; tr.t = 0; } return true; }
    if (tr.t >= tr.dur) G.trans = null;
    return false;
  }
  function updateRoom(dt) {
    const D = G.dun, R = D.cur, rs = G.rs, P = G.player;
    rs.t += dt;
    const alive = G.enemies.filter(e => !e.dead).length;
    if (rs.state === 'intro' && rs.t > (R.type === 'boss' ? 1.4 : 0.55)) {
      rs.state = 'run'; rs.t = 0;
      if (R.waves) spawnWave(R.waves[0]);
      if (R.type === 'survive') { G.spawnT = 0; rs.ph = 0; rs.phT = 0; rs.idleT = 0; survivePhase(0); }
      if (R.type === 'boss') { G.bossClean = true; /* v2.02 무피격 판정 시작 */ if (G.stage === 1) spawnSlimeKing(); else if (G.stage === 3) spawnKrugash(); else if (G.stage === 4) spawnAshKing(); else spawnBoss(); }
    } else if (rs.state === 'invade') { if (alive === 0 && G.spawning === 0 && rs.t > 0.8) roomClear(); // v1.57 난입자를 쓰러뜨리면 클리어
    } else if (rs.state === 'run') {
      if (R.waves) {
        const last = rs.wave >= R.waves.length - 1;
        if (G.spawning === 0 && (last ? alive === 0 : alive <= (R.type === 'elite' || G.enemies.some(x => !x.dead && isSemi(x)) ? 0 : 2) && rs.t > 1.5)) { rs.wave++; rs.t = 0; if (rs.wave < R.waves.length) { spawnWave(R.waves[rs.wave]); sfx('growl', 0.8); addShake(2); } else roomClear(); }
      } else if (R.type === 'survive') { // v0.76: 4페이즈 리젠 방 — 페이즈마다 적이 계속 다시 나타나고, 시간이 지나면(또는 잠시 적이 없으면) 다음 페이즈. 4페이즈가 끝나면 남은 적을 정리
        rs.surviveT += dt; rs.phT += dt; G.spawnT -= dt;
        const PT = SURV_PT(), last = rs.ph >= SURV_N - 1, regen = !(last && rs.phT >= PT);
        if (regen && G.spawnT <= 0 && alive + G.spawning < survCap(rs.ph)) { G.spawnT = (G.stage === 1 ? 1.5 : 1.2) * (1 - rs.ph * 0.12); let r = Math.random(); for (const [t, w] of STG().survive) { if (r < w) { queueSpawn(t); break; } r -= w; } }
        rs.idleT = alive + G.spawning === 0 ? rs.idleT + dt : 0;
        if (!last && (rs.phT >= PT || (rs.idleT > 1.2 && rs.phT > 4))) { rs.ph++; rs.phT = 0; survivePhase(rs.ph); }
        else if (last && rs.phT >= PT && !rs.final) { rs.final = true; banner('습격 종료', '남은 적을 정리하면 봉인이 풀린다'); sfx('grogi'); }
        { const c = Math.ceil(PT - rs.phT), k = rs.ph * 10 + c; if (c >= 1 && c <= 3 && rs.cdK !== k) { rs.cdK = k; banner(String(c), last ? '끝까지 버텨야 한다' : '다음 무리가 다가온다'); sfx('blip', c === 1 ? 1.5 : 1); } }
        if (last && rs.phT >= PT && alive === 0 && G.spawning === 0) roomClear();
      }
    }
    updateNav(dt);
    G.crackCd = Math.max(0, (G.crackCd || 0) - dt);
    updateGate(dt); updateAmbush(dt);
    if (!G.sealed && !G.trans && !P.dead) checkDoors();
    // 상호작용 (F)
    G.prompt = P.dead ? null : nearInteract();
    updateGearCmp();
    if (take('f') && G.prompt) doInteract(G.prompt);
    { // v2.19 F 홀드: 주변에 상호작용할 것이 없으면 들고 있는 무기를 바닥에 내려놓는다 (장비창 안 열고)
      const cw = eqWeapon(G.cls), ok = cw && !P.dead && !G.trans && !(G.dun && G.dun.cur && G.dun.cur.type === 'forge');
      if (!keys['f']) G.dropHold = 0;
      else if (G.prompt || !ok) G.dropHold = -1; // 상호작용으로 누른 F는 버리기로 이어지지 않게 (뗄 때까지 잠금)
      else if (G.dropHold >= 0) { G.dropHold += dt; if (G.dropHold >= 0.7) { G.dropHold = -1; dropWeapon(cw, P.x + 16 * P.face, P.y + 8); G.stats = calcStats(G.buffs); P.hp = Math.min(P.hp, G.stats.hp); P.chainL = null; P.whipL = null; persist(); sfx('drop'); lootFeed(`「${cw.name}」 버림`, gradeOf(cw).c, 1400); } }
    }
    // 비밀 벽 힌트: 가까이 가면 가끔 먼지가 떨어진다
    if (R.crack && !R.crack.broken) { const c = crackPoint(R); if (Math.hypot(P.x - c.x, P.y - c.y) < 220 && Math.random() < dt * 2.5) G.parts.push({ x: c.x + rand(-12, 12), y: c.y - rand(0, 20), vx: rand(-6, 6), vy: rand(10, 30), t: rand(0.4, 0.8), c: pick(['#6a6470', '#4d4858', '#8a8478']), g: 60 }); }
    // 텔레포터 위 F 안내는 nearInteract에서
  }
  // 4페이즈 리젠 방 설정: 페이즈 길이, 페이즈별 최대 동시 적 수, 페이즈 시작 시 한꺼번에 몰려오는 적
  const SURV_CRY = { // v1.18 습격마다 표시되는 문구
    1: ['덤불 너머에서 기척이 일어난다', '고블린 무리가 발소리를 죽이지 않고 몰려든다', '바닥 틈에서 탁한 점액이 스며 나온다', '거대 점액이 깨어났다 · 끝까지 버텨야 한다'],
    2: ['석관 덮개가 비틀리며 열린다', '이름을 잃은 망자들이 어둠 속에서 걸어 나온다', '짙은 역병의 악취가 방 안을 채운다', '부푼 시체가 기어온다 · 끝까지 버텨야 한다'],
    4: ['먼 곳에서 깨진 종소리가 울린다', '닫혀 있던 관들이 하나씩 열린다', '가라앉지 않은 재가 숨통을 조여 온다', '왕의 기수가 깃발을 세운다 · 끝까지 버텨야 한다'],
    3: ['협곡 바닥을 울리는 낮은 함성이 들린다', '부락의 전사들이 사방에서 들이닥친다', '피에 젖은 정예들이 대열을 갖춘다', '대족장의 친위대다 · 끝까지 버텨야 한다'],
  };
  const SURV_N = 4, SURV_PT = () => G.stage === 1 ? 14 : G.stage === 2 ? 15 : 16;
  const survCap = ph => Math.round(STG().surviveMax * (0.5 + ph * 0.17));
  function survivePhase(ph) {
    banner(ph === SURV_N - 1 ? '마지막 습격' : `습격 ${ph + 1}/${SURV_N}`, (SURV_CRY[G.stage] || SURV_CRY[1])[Math.min(ph, 3)]); sfx('growl', 0.8 - ph * 0.05); addShake(3 + ph);
    const n = 2 + ph; for (let i = 0; i < n; i++) { let r = Math.random(); for (const [t, w] of STG().survive) { if (r < w) { queueSpawn(t); break; } r -= w; } }
    if (G.stage === 3 && ph >= 2) queueSpawn(pick(['ocharge', 'otroll', 'ogrip']));
    if (G.stage !== 3 && ph === SURV_N - 1) queueSpawn(G.stage === 1 ? 'bigslime' : G.stage === 4 ? 'coffin' : 'bloat');
    if (G.stage === 4 && ph === 2) queueSpawn('herald');
  }
  function roomClear() {
    const R = G.dun.cur;
    if (R.invade && !R.invaded) { R.invaded = true; startInvasion(R); return; } // v1.57 난입
    R.cleared = true; R.clearAt = time; G.rs.state = 'done'; startPaint(R, G.player.x, G.player.y - 8); skShake(7, G.lastKillAng); // v2.34 빛 조각 · v3.25 마지막 적을 쓰러뜨리면 화면 흔들림
    sealRoom(false);
    if (R.type === 'elite') {
      const n = ++G.dun.eliteDone;
      banner(`${ER().clear} ${Math.min(n, 2)}/2`, SK().drop); sfx('grogi');
      { const q = freePoint(CX, CY + 44); spawnLoot('sealkey', q.x, q.y); G.fx.push({ kind: 'skybeam', x: q.x, y: q.y, w: 22, c: SK().rgb, t: 0.8, max: 0.8, up: true }); } // v1.18 봉인 열쇠
      // v2.32 정예 방은 상자 없음 (사용자 결정) — 봉인 열쇠 + 하트 또는 골드 확정
      { const P = G.player, q = freePoint(CX, CY - 10), heart = P.hp < G.stats.hp && Math.random() < 0.5; if (heart) spawnLoot('bigmeat', q.x, q.y); else { spawnLoot('pouch', q.x, q.y); spawnLoot('pouch', q.x, q.y); } G.fx.push({ kind: 'skybeam', x: q.x, y: q.y, w: 22, c: heart ? '255,90,100' : '255,210,120', t: 0.6, max: 0.6, up: true }); }
    } else if (R.type === 'survive') {
      banner('봉인 해제', '침묵이 돌아왔다 · 상자가 모습을 드러냈다');
      R.chest = { x: CX, y: CY - 10, opened: false, kind: 'reward' };
      G.fx.push({ kind: 'skybeam', x: CX, y: CY - 10, w: 30, c: '255,210,120', t: 0.6, max: 0.6 });
    }
    if (R.invaded) { rec('invader'); rec('inv_' + (R.invade || 'panda')); /* v3.00 난입자별 기록 (기록보관소 석상) */ banner('난입자 격퇴', '전리품 상자가 남았다'); R.chest = { x: CX, y: CY - 10, opened: false, kind: 'elite', inv: true }; if (ascOn(7)) { G.crystal++; lootFeed('난입자 격퇴 — 정령의 결정 +1', '#9fd2ff'); } G.fx.push({ kind: 'skybeam', x: CX, y: CY - 10, w: 30, c: '255,120,80', t: 0.6, max: 0.6 }); } // v1.57 난입자 처치 → 장비 3택1
    // 건전식 방 클리어 보상: 일정 확률로 보급품
    if (R.type === 'combat' && Math.random() < 0.35) { const p = freePoint(CX, CY); spawnLoot(pick(['meat', 'meat', 'orb', 'pouch']), p.x, p.y); }
    if (R.tele && !G.dun.teleHint) { G.dun.teleHint = true; lootFeed(TOUCH.on ? '텔레포터 활성화 — 지도에서 순간이동' : '텔레포터 활성화 — <span class="key">TAB</span> 지도에서 순간이동', '#9fd2ff'); }
  }
  function freePoint(x, y) { for (let i = 0; i < 30; i++) { const a = rand(0, TAU), d = i * 6; const px = clamp(x + Math.cos(a) * d, A.x0 + 20, A.x1 - 20), py = clamp(y + Math.sin(a) * d, A.y0 + 20, A.y1 - 20); if (!obsHitL(G.obs || [], px, py, 14)) return { x: px, y: py }; } return { x, y }; }
  function checkDoors() {
    const P = G.player, R = G.dun.cur;
    for (const d in DIRS) {
      if (doorState(R, d) !== 'open') continue;
      if (R.sealW && R.sealW.dir === d) continue; // v2.67 인장 문은 F로 들어감
      const D0 = DOOR[d], inX = Math.abs(P.x - D0.x) < 20, inY = Math.abs(P.y - D0.y) < 20;
      if ((d === 'n' && inX && P.y <= A.y0 + P.r + 1) || (d === 's' && inX && P.y >= A.y1 - P.r - 1) || (d === 'w' && inY && P.x <= A.x0 + P.r + 1) || (d === 'e' && inY && P.x >= A.x1 - P.r - 1)) {
        goRoom(G.dun.rooms[R.doors[d]], OPP[d]); return;
      }
    }
  }
  function debugClearRoom() {
    const R = G.dun.cur;
    if (!G.rs || (G.rs.state !== 'intro' && G.rs.state !== 'run' && G.rs.state !== 'invade') || R.type === 'boss') return;
    G.enemies.forEach(e => { if (!e.dead) killEnemy(e, true); }); G.tele = []; G.spawning = 0;
    if (R.type === 'elite' || R.type === 'combat' || R.type === 'survive') roomClear();
  }
  function debugToBoss() {
    const D = G.dun; D.eliteDone = 2; D.sock = [true, true]; D.bossOpen = true; D.gate = null;
    const entry = Object.keys(D.boss.doors).find(d => D.boss.doors[d] != null);
    D.foyer.visited = D.foyer.seen = true; D.foyer.cleared = true;
    goRoom(D.boss, entry);
  }

  function debugToShrine() { // v3.25 테스트: 빛의 샘으로 (Shift+H) · 다시 쓸 수 있게 · 빛 각 45개
    const D = G.dun, R = D.rooms && D.rooms.find(r => r.type === 'shrine');
    if (!R) { lootFeed('테스트 — 이 층에는 빛의 샘이 없습니다', '#9a8f8a', 2500); return; }
    R.shrineUsed = false; R.shrineOpts = null; R.visited = R.seen = true; for (const c of ['r', 'b', 'g']) G.pal[c] = Math.max(G.pal[c] || 0, 45); renderPal(); /* 해금 기록이 남지 않게 hueGain을 거치지 않음 */
    if (D.cur === R) { lootFeed('테스트 — 흰 빛을 다시 쓸 수 있습니다', '#9fd2ff', 2000); return; }
    goRoom(R, Object.keys(R.doors).find(d => R.doors[d] != null));
  }
  function debugToRest() { // v3.10 테스트: 휴게방(비스트로)으로 바로 이동 (Shift+R). 이미 휴게방이면 주문만 다시 가능하게
    const D = G.dun, R = D.rooms && D.rooms.find(r => r.type === 'rest');
    if (!R) { lootFeed('테스트 — 이 층에는 휴게방이 없습니다', '#9a8f8a', 2500); return; }
    R.used = false; R.visited = R.seen = true;
    if (D.cur === R) { lootFeed('테스트 — 다시 주문할 수 있습니다', '#9fd2ff', 2000); return; }
    goRoom(R, Object.keys(R.doors).find(d => R.doors[d] != null));
  }

  // ---------- 비밀 벽
  function crackPoint(R) { const d = R.crack.dir, p = DOOR[d]; return { x: p.x + (d === 'w' ? 6 : d === 'e' ? -6 : 0), y: p.y + (d === 'n' ? 6 : d === 's' ? -6 : 0) }; }
  function hitCrack(x, y, power = 1, rad = 40) { const a = (G && G.drums && G.drums.length ? hitDrums(x, y, power, rad) : false) | hitFolk(x, y, rad); return hitCrack0(x, y, power, rad) || a; }
  function hitCrack0(x, y, power = 1, rad = 40) {
    const R = G && G.dun && G.dun.cur; if (!R || !R.crack || R.crack.broken) return false;
    const c = crackPoint(R); if (Math.hypot(x - c.x, y - c.y) > rad) return false;
    if (G.crackCd > 0) return true;
    G.crackCd = 0.22; R.crack.hp -= power;
    debris(c.x, c.y, 10); sfx('block'); addShake(3); /* v1.08 역경직 제거 */
    G.fx.push({ kind: 'hitspark', x: c.x, y: c.y - 6, ang: rand(0, TAU), rot: 0, t: 0.12, max: 0.12, r: 18, c: '230,220,200' });
    if (R.crack.hp <= 0) {
      R.crack.broken = true;
      const S = G.dun.rooms[R.doors[R.crack.dir]]; S.seen = true;
      sfx('blast'); addShake(9); flashT = 0.08; flashColor = '#fff0d0'; debris(c.x, c.y, 30); dust(c.x, c.y, 20);
      banner('비밀 통로', '금 간 벽 너머로 길이 이어진다');
      paintRoomFloor(R); { const i = FL_CACHE.findIndex(c => c.key === G.stage + ':' + R.id); if (i >= 0) FL_CACHE.splice(i, 1); }
    }
    return true;
  }

  // ---------- 상호작용: 상자 · 상인 · 텔레포터 · 모닥불
  // v2.02 피의 제단 도트: 돌 제단 + 핏물 그릇 + 촛불, 앞면 문양 (하트 = 장비를 바쳐 하트 / 칼 = 하트를 바쳐 장비)
  // v2.80 피의 제단 키움 (22×20칸): 받침 · 위로 좁아지는 몸통 · 앞면 문양 판 · 핏물 그릇 · 흘러내린 피 · 양끝 초 (하트 = 장비를 바쳐 하트 / 칼 = 하트를 바쳐 장비)
  const BALT = {"balt_gear": ["......................", "......................", ".......kkkkkkkk.......", ".kk...k11112222k..kk..", "kwWk.k1RrerrRRR2kkwWk.", "kwWkkk22RRrrRR22kkwWk.", "k1w111133333r331111w4k", "k13333r33333r33333334k", ".kk122R22223RR33344kk.", "..k1222444444443344k..", "..k124245E5E5523344k..", "..k12224EEEEE523344k..", "..k12224EEEEE524344k..", "..k122245EEE5523344k..", "..k1224455E55523344k..", "..k1222422222223344k..", ".kk1555555555555544kk.", "k22222222222222222222k", "k33333333333333444444k", "k55555555555555555555k"], "balt_gear_u": ["......................", "......................", ".k.....kkkkkkkk...k...", "k4k...k11112222k.k4k..", "kwWk.k1544444452kkwWk.", "kwWkkk2255445522kkwWk.", "k1w1111333333331111w4k", "k13333333333333333334k", ".kk1222222233333344kk.", "..k1222444444443344k..", "..k124245R5R5523344k..", "..k12224RRRRR523344k..", "..k12224RRRRR524344k..", "..k122245RRR5523344k..", "..k1224455R55523344k..", "..k1222422222223344k..", ".kk1555555555555544kk.", "k22222222222222222222k", "k33333333333333444444k", "k55555555555555555555k"], "balt_heart": ["......................", "......................", ".......kkkkkkkk.......", ".kk...k11112222k..kk..", "kwWk.k1RrerrRRR2kkwWk.", "kwWkkk22RRrrRR22kkwWk.", "k1w111133333r331111w4k", "k13333r33333r33333334k", ".kk122R22223RR33344kk.", "..k1222444444443344k..", "..k1242455S55523344k..", "..k1222455S55523344k..", "..k1222455S55524344k..", "..k122245SSS5523344k..", "..k1224455s55523344k..", "..k1222422222223344k..", ".kk1555555555555544kk.", "k22222222222222222222k", "k33333333333333444444k", "k55555555555555555555k"], "balt_heart_u": ["......................", "......................", ".k.....kkkkkkkk...k...", "k4k...k11112222k.k4k..", "kwWk.k1544444452kkwWk.", "kwWkkk2255445522kkwWk.", "k1w1111333333331111w4k", "k13333333333333333334k", ".kk1222222233333344kk.", "..k1222444444443344k..", "..k1242455355523344k..", "..k1222455355523344k..", "..k1222455355524344k..", "..k1222453335523344k..", "..k1224455355523344k..", "..k1222422222223344k..", ".kk1555555555555544kk.", "k22222222222222222222k", "k33333333333333444444k", "k55555555555555555555k"]};
  const ALTAR_PAL = { k: '#0e0a0c', y: '#ffd060', Y: '#fff0b0', w: '#e8e0cc', W: '#bcb4a0', R: '#5a0a10', r: '#a01218', e: '#d83a3a', '1': '#8a8478', '2': '#6a665c', '3': '#4e4a42', '4': '#34312c', '5': '#24221e', g: '#c9952a', G: '#8a6418', E: '#e0303a', S: '#d8d8e0', s: '#9a9aa8' };
  function drawAltar(a) {
    const key = 'balt_' + a.k + (a.used ? '_u' : ''), cv = art(key, () => gCanvas(fromRows(BALT[key]), ALTAR_PAL));
    drawShadow(a.x, a.y + 1, 20);
    const x0 = snap2(a.x - cv.width / 2), y0 = snap2(a.y - cv.height + 2);
    ctx.drawImage(cv, x0, y0);
    if (!a.used) for (const cx of [1, 18]) { const f = (Math.floor(time * 7) + cx) % 3; ctx.fillStyle = '#ff8a2a'; ctx.fillRect(x0 + cx * 2, y0 + 4, 2, 2); ctx.fillStyle = '#fff3c0'; ctx.fillRect(x0 + cx * 2 + (f === 1 ? 2 : 0), y0 + 2 - (f === 2 ? 2 : 0), 2, 2); }
  }
  function nearInteract() {
    const P = G.player, R = G.dun.cur, near = (o, d = 34) => Math.hypot(P.x - o.x, P.y - o.y) < d;
    { const ti = TRUTH.interact(); if (ti) return ti; } // v2.58 진엔딩 단서
    { const fi = forgeInteract(); if (fi) return fi; }
    { const ai = CA.interact(); if (ai) return ai; } // v2.52 재의 제단
    { const ei = END.interact(); if (ei) return ei; } // v2.54 떨어진 왕관
    { const hi = HOME.interact(); if (hi) return hi; } // v2.55 시작 장소 출구
    { const ri = ARCH.interact(); if (ri) return ri; } // v3.00 코코아의 기록 보관소
    { const di = DEN.interact(); if (di) return di; } // v3.17 영수 명수의 안전 놀이터
    if (R.chest && (!R.chest.opened || R.chest.pending) && !R.chest.fall && near(R.chest, 36)) return { k: 'chest', o: R.chest, x: R.chest.x, y: R.chest.y - 30, t: R.chest.pending ? 'F 보류한 전리품 고르기' : R.chest.kind === 'boss' ? 'F 보스의 전리품' : 'F 상자 열기' };
    { const gl = nearGear(); if (gl) return { k: 'gear', o: gl, x: gl.x, y: gl.y - 30, t: wFull(G.cls) && gl.it.cls === G.cls ? 'F 바꿔 들기' : 'F 줍기' }; }
    if (R.socks && !G.dun.bossOpen && !G.dun.gate) for (const s of R.socks) if (!(s.dual ? G.dun.sock[0] && G.dun.sock[1] : G.dun.sock[s.i]) && near(s, 36)) { const K = SK(), y = s.y - SOCK_H[SST()] - 8; return G.dun.keys > 0 ? { k: 'sock', o: s, x: s.x, y, t: `F ${K.act}` } : { k: 'none', o: s, x: s.x, y, t: K.need, bad: true }; }
    if (R.exit && near(R.exit, 26)) return { k: 'exit', o: R.exit, x: R.exit.x, y: R.exit.y - 30, t: R.type === 'forge' ? `F STAGE ${G.stage + 1}로` : G.stage < lastStage() ? `F 다음 스테이지로 · 대장간` : 'F 원정 완료' };
    if (R.shop) for (const it of R.shop) if (!it.sold && near(it, 26)) return { k: 'shop', o: it, x: it.x, y: it.y - 34, t: `F ${SHOP_N[it.k]} · ${it.price}G`, bad: G.gold < it.price };
    if (R.altars) for (const a of R.altars) if (!a.used && near(a, 30)) { const t = altarText(a); return { k: 'altar', o: a, x: a.x, y: a.y - 40, t: t.t, bad: !t.ok }; }
    { const bi = BISTRO.interact(); if (bi) return bi; } // v3.10 쿠오 · 쿠키에게 말 걸기
    { const si = SHRINE.interact(R); if (si) return si; } // v3.25 빛의 샘
    if (G.bonfire && !R.used && near(G.bonfire, 50)) return { k: 'rest', o: G.bonfire, x: G.bonfire.x, y: G.bonfire.y + 20, t: 'F 주문하기' }; // v3.10 비스트로
    if (R.tele && R.cleared && near(R.tele, 22)) return { k: 'tele', o: R.tele, x: R.tele.x, y: R.tele.y - 24, t: 'F 지도 · 순간이동' };
    return null;
  }
  // v2.02 피의 제단: 바칠 장비 = 장착하지 않은 레어 이상 중 가장 낮은 것
  const GRADE_I = { common: 0, rare: 1, unique: 2, legend: 3, rby: 4 };
  function altarFodder() {
    const eqIds = new Set(Object.values(eqOf(G.cls)));
    return SAVE.inv.filter(i => !eqIds.has(i.id) && GRADE_I[i.grade] >= 1 && i.grade !== 'rby').sort((a, b) => GRADE_I[a.grade] - GRADE_I[b.grade] || (a.lv || 0) - (b.lv || 0))[0] || null;
  }
  function altarText(a) {
    if (a.k === 'gear') { const f = altarFodder(); if (G.stats.hp >= HEART_CAP) return { t: 'F 피의 제단 — 하트 가득', ok: false };
      return f ? { t: `F 피의 제단 — 「${f.name}」 → 하트 +1`, ok: true } : { t: 'F 피의 제단 — 바칠 장비 없음', ok: false }; }
    return G.stats.hp > 4 ? { t: 'F 피의 제단 — 하트 2칸 → 무기 (레어 20% · 유니크 76.5% · 레전더리 3% · ??? 0.5%)', ok: true } : { t: 'F 피의 제단 — 하트 부족 (3칸 이상)', ok: false }; // v2.21 하트 2칸, 등급은 확률
  }
  function useAltar(a) {
    const t = altarText(a); if (!t.ok) { sfx('block'); lootFeed(t.t.replace('F ', ''), '#ff7070'); return; }
    const R0 = G.dun && G.dun.cur; if (R0 && R0.altars) for (const o of R0.altars) o.used = true; // v2.21 두 제단 중 하나만 — 하나를 쓰면 다른 쪽도 닫힘
    flashT = 0.15; flashColor = '#a01218'; sfx('boss'); burst(a.x, a.y - 14, '#a3161c', 18);
    G.fx.push({ kind: 'skybeam', x: a.x, y: a.y - 6, w: 22, c: '200,30,40', t: 0.6, max: 0.6, up: true });
    if (a.k === 'gear') { const f = altarFodder(); SAVE.inv = SAVE.inv.filter(i => i !== f); G.fieldItems = G.fieldItems.filter(i => i !== f); persist(); heartUp(1, `「${f.name}」을 바쳤다`); }
    else { heartDown(2); const r = Math.random() * 100; if (r >= 99.5) { const it = makeRBY(G.cls); spawnLoot('gear', a.x, a.y - 4, it); lootFeed('하트 두 칸을 바쳤다 — <b style="color:#ff2a2a">RGB?</b>', '#ff2a2a', 4000); return; } /* v2.40 RGB? 0.5% */ const gk = r < 20 ? 'rare' : r < 96.5 ? 'unique' : 'legend', owned = new Set(SAVE.inv.filter(i => i.cls === G.cls && i.wk != null).map(i => i.wk)), cands = wcat(G.cls).filter(o => o.grade === gk && !(o.i === 10 && !leg2Open(G.cls)) && !weaponLocked(G.cls, o.i)), fresh = cands.filter(o => !owned.has(o.i)), pickW = pick(fresh.length ? fresh : cands), it = makeItem(G.cls, pickW ? { grade: gk, wk: pickW.i } : { grade: gk }); /* 확률 그대로 (잿불 단계 보정 없음) */ spawnLoot('gear', a.x, a.y - 4, it); lootFeed(`하트 두 칸을 바쳤다 — ${gradeOf(it).n} 무기`, gradeOf(it).c, 3000); }
  }
  function shopHeartFix(R) { // v2.39 최대 하트(6칸)면 상점의 빈 하트 그릇을 다른 물건으로 바꿈
    if (!R || !R.shop || !G || !G.stats || G.stats.hp < HEART_CAP) return;
    const s = R.shop.find(x => x.k === 'heartUp' && !x.sold); if (!s) return;
    const have = new Set(R.shop.map(x => x.k)), alt = [['armor', 220], ['vial', 55], ['orb', 45], ['iron', 30], ['meat', 100]].find(([k]) => !have.has(k) && !(k === 'orb' && G.cls === 'priest')) || ['armor', 220];
    const mul = G.stage === 4 ? 1.9 : G.stage === 2 ? 1.3 : G.stage === 3 ? 1.6 : 1;
    s.k = alt[0]; s.price = Math.round(alt[1] * mul * ASCF.shop() / 5) * 5;
  }
  const SHOP_N = { heartUp: '빈 하트 그릇', meat: '하트 반 칸', orb: '투지 결정', vial: '핏빛 영약', gear: '장비 꾸러미', iron: '철광석 3개', armor: '방패 조각' };
  function rollGradeW(w) { w = ascGradeW(w); let r = Math.random() * w.reduce((a, b) => a + b, 0); const ks = ['common', 'rare', 'unique', 'legend']; for (let i = 0; i < 4; i++) { if (r < w[i]) return ks[i]; r -= w[i]; } return 'common'; }
  function doInteract(it) {
    const R = G.dun.cur;
    if (it.k === 'station') { openForge('station', it.o.k); return; }
    if (it.k === 'truth') { TRUTH.act(it); return; } // v2.58
    if (it.k === 'crownAltar') { CA.start(); return; } // v2.52
    if (it.k === 'endCrown') { END.start(); return; } // v2.54
    if (it.k === 'homeExit') { HOME.leave(); return; } // v2.55
    if (it.k === 'bounty') { BOUNTY.open(); return; } // v3.16 단군의 난입자 의뢰서
    if (it.k === 'homeTalk') { HOME.talkNpc(it.who); return; } // v3.16 하비 · 단군 대화
    if (it.k === 'arch') { ARCH.act(it); return; } // v3.00 코코아의 기록 보관소
    if (it.k === 'den') { DEN.act(it); return; } // v3.17 영수 명수의 안전 놀이터
    if (it.k === 'bis') { BISTRO.act(it); return; } // v3.10 쿠오 · 쿠키 대화
    if (it.k === 'none') { sfx('block'); return; }
    if (it.k === 'sock') { placeSeal(it.o); return; }
    if (it.k === 'exit') { // v1.01: 주우지 않은 보스 전리품이 있으면 한 번 더 확인
      if (R.type === 'forge') { sfx('awaken'); flashT = 0.15; flashColor = '#ffe0b0'; leaveForge(); return; }
      const left = (R.chest && R.chest.kind === 'boss' && !R.chest.opened) || G.dun.rooms.some(r => r.chest && r.chest.pending) || G.loot.some(l => l.type === 'gear');
      if (left && !(G.exitArm > time)) { G.exitArm = time + 3; sfx('block'); lootFeed('아직 챙기지 않은 전리품이 있다 — 다시 F를 누르면 출발', '#ffb060', 3000); return; }
      sfx('awaken'); flashT = 0.15; flashColor = '#ffe0b0'; G.exitArm = 0;
      if (G.stage < lastStage()) stageClear(); else showResult(true); return;
    }
    if (it.k === 'gear') { collectLoot(it.o); it.o.life = -1; G.loot = G.loot.filter(l => l !== it.o); gearCmpId = null; sfx('select'); return; }
    if (it.k === 'chest') {
      const c = it.o; if (c.pending) { c.pending = false; spawnLoot('gear', c.x, c.y + 6, (c.pick && c.pick[0]) || rollChestWeapon(c.kind, c)); c.pick = null; return; } // 예전 저장의 보류 상자
      c.opened = true; c.openT = 0; if (hasRelic('glove')) { G.gold += 30; G.nums.push({ x: c.x, y: c.y - 26, v: '+30G', t: 0.9, c: '#ffd34d', s: 1 }); } // v2.29 도둑의 장갑
      sfx('drop'); sfx('coin'); addShake(3);
      G.fx.push({ kind: 'skybeam', x: c.x, y: c.y, w: 26, c: c.kind === 'secret' ? '200,140,255' : '255,210,120', t: 0.5, max: 0.5, up: true });
      spawnLoot('pouch', c.x, c.y + 6);
      if (c.kind === 'boss') { openBossChest(c); return; } // v0.98: 보스 장비는 상자에서
      if (c.kind !== 'reward' && (Math.random() < 0.3 + hueChest() || (c.inv && hasRelic('invhorn'))) && chestRelic(c)) { if (c.kind === 'secret') { spawnLoot('orb', c.x, c.y + 6); spawnLoot('bigmeat', c.x, c.y + 6); spawnLoot('armor', c.x, c.y + 6); G.crystal++; lootFeed('정령의 결정 +1', '#9fd2ff'); } return; } // v2.32 숨은 보고 밖의 상자: 30% 유물 · 70% 무기
      if (c.kind === 'reward' || c.kind === 'elite') { const w = rollChestWeapon(c.kind, c); spawnLoot('gear', c.x, c.y + 6, w); if (w.grade === 'legend') sfx('legend'); return; } // v2.19 고르기 없이 무기 하나가 튀어나온다 (F로 줍기)
      const g = rollGradeW(c.kind === 'secret' ? [0, 66, 33, 1] : [40, 52, 7.7, 0.3]); // v2.40 잊힌 틈새 레전더리 4% → 1%
      spawnLoot('gear', c.x, c.y + 6, makeItem(G.cls, { grade: g }));
      if (c.kind === 'secret') { spawnLoot('orb', c.x, c.y + 6); spawnLoot('bigmeat', c.x, c.y + 6); spawnLoot('armor', c.x, c.y + 6); G.crystal++; lootFeed('정령의 결정 +1', '#9fd2ff'); }
    } else if (it.k === 'shop') {
      const s = it.o;
      const half = hasRelic('twincoin') && G.freeBuy !== G.stage, price = half ? Math.ceil(s.price / 2) : s.price; // v2.29 쌍둥이 동전: 챕터마다 1개 50%
      if (G.gold < price) { sfx('block'); NPC_TALK.merchant = { line: pick([`${price - G.gold}G 모자라. 외상은 안 돼`, `${price - G.gold}G만 더 가져와`, `${price - G.gold}G가 모자라는데?`]), until: time + 2.6, next: time + 9, near: true }; return; } // v2.93 골드 부족은 상인이 말주머니로
      if (half) { G.freeBuy = G.stage; lootFeed(`쌍둥이 동전 — 반값 (${price}G)`, '#f0c040'); } G.gold -= price; rec('spent', price); s.sold = true; sfx('coin');
      if (s.k === 'iron') { G.iron += 3; lootFeed('철광석 조각 +3', '#c9b07a'); }
      else if (s.k === 'gear') spawnLoot('gear', s.x, s.y + 4, makeItem(G.cls, { grade: rollGradeW([0, 85, 14.5, 0.5]) }) /* v2.40 레전더리 1.5% → 0.5% */);
      else spawnLoot(s.k, s.x, s.y + 4);
      G.nums.push({ x: s.x, y: s.y - 30, v: String(s.price), t: 0.8, c: '#ffd34d', s: 2 });
    } else if (it.k === 'altar') {
      useAltar(it.o);
    } else if (it.k === 'shrine') { SHRINE.open();
    } else if (it.k === 'rest') {
      openRest();
    } else if (it.k === 'tele') openMap();
  }
  // ---------- v0.98 전리품 3택1: 서로 다른 부위 3개 중 하나를 골라 바로 장착 (이전 장비는 가방으로)
  const PICK_W = { reward: { 1: [42, 52, 5.8, 0.2], 2: [35, 58, 6.75, 0.25], 3: [28, 63, 8.65, 0.35], 4: [23, 66, 10.5, 0.5] }, elite: { 1: [52, 45, 2.9, 0.1], 2: [44, 52, 3.85, 0.15], 3: [36, 58, 5.8, 0.2], 4: [30, 62, 7.65, 0.35] } }; // v2.40 레전더리 약 1/3로 // v1.98 유니크·레전더리 확률 크게 내림, 4장 표 추가
  function pickCompare(it) {
    if (!canEquip(it, G.cls)) return '<div class="pkCmp">다른 직업 무기</div>';
    SAVE.inv.push(it); const nx = statsIf(eqTarget(G.cls, it), it.id); SAVE.inv.pop(); const cur = calcStats(G.buffs);
    const curIt = eqCurFor(G.cls, it);
    const rows = INV_STATS.map(([k, n, f]) => { const dv = nx[k] - cur[k], tiny = ['crit', 'critDmg', 'cdr'].includes(k) ? 0.0005 : 0.5; if (Math.abs(dv) < tiny) return ''; return `<span class="${dv > 0 ? 'up' : 'dn'}">${n} ${dv > 0 ? '▲' : '▼'}${f(Math.abs(dv)).replace('%', '')}${['crit', 'critDmg', 'cdr'].includes(k) ? '%' : ''}</span>`; }).join('');
    return `<div class="pkCmp"><i>${curIt ? `가방으로 · 「${curIt.name}」 대신 끼면` : '빈 칸 — 바로 장착'}</i>${rows || '<span>능력치 변화 없음</span>'}</div>`;
  }
  function rollChestWeapon(kind, c) { // v2.19 상자 무기 한 개 (예전 세 개 중 고르기와 같은 등급 규칙)
    const w = PICK_W[kind][G.stage] || PICK_W[kind][1], up = c && c.inv && ascOn(7);
    let gk = rollGradeW(w); if (up) gk = GRADES[Math.min(3, GI[gk] + 1)].k;
    if (kind === 'elite' && ascOn(3) && gk === 'common') gk = rollGradeW([0, w[1] || 1, w[2] || 0, w[3] || 0]); // 날 선 칼: 레어 이상 보장
    return makeItem(G.cls, { grade: gk, slot: 'weapon' });
  }
  // v0.98 보스 전리품 상자: 열면 장비가 튀어나와 등급 빛기둥을 세우고, 잠시 뒤 대장간(또는 결과 화면)으로
  function chestRelic(c, i, n) { // v2.32 상자에서 유물: 아직 없고 해금된 것 중 하나 (바닥에 떨어진 것도 제외)
    const onFloor = new Set(G.loot.filter(l => l.type === 'relic' && l.life > 0).map(l => l.relic)), left = Object.keys(RELICS).filter(k => !hasRelic(k) && !relicLocked(k) && !onFloor.has(k) && !RELICS[k].den); // v3.18 놀이터 전용 유물은 보스가 떨어뜨리지 않음
    if (!left.length) return false;
    const l0 = G.loot.length; spawnLoot('relic', c.x, c.y + 6); const L = G.loot[l0]; if (!L) return false; L.relic = pick(left);
    if (n > 1) { const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.7; L.vx = Math.cos(a) * 90 + (i - (n - 1) / 2) * 40; L.vy = Math.sin(a) * 70; L.vz = 170; }
    lootFeed(`<b style="color:${RELICS[L.relic].c}">유물 · ${RELICS[L.relic].n}</b>`, RELICS[L.relic].c, 3500); sfx('legend'); return true;
  }
  function openBossChest(c) {
    c.items = c.items.filter((it, i) => !(Math.random() < 0.3 + hueChest() && chestRelic(c, i, c.items.length))); // v2.32 보스 상자도 칸마다 30% 유물
    G.newItems = []; const n = c.items.length; // v1.01: 보스 장비도 바닥에 떨어지고 F로 줍는다
    c.items.forEach((it, i) => { spawnLoot('gear', c.x, c.y + 6, it); const l = G.loot[G.loot.length - 1], a = Math.PI / 2 + (i - (n - 1) / 2) * 0.7; l.vx = Math.cos(a) * 90 + (i - (n - 1) / 2) * 40; l.vy = Math.sin(a) * 70; l.vz = 170; });
    addShake(6); flashT = 0.12; flashColor = '#fff0c0';
    G.fx.push({ kind: 'ring', x: c.x, y: c.y - 6, r: 8, grow: 220, t: 0.5, max: 0.5, c: '#ffd34d' });
    if (c.items.some(it => it.grade === 'legend')) setTimeout(() => { if (G) sfx('legend'); }, 500);
    c.items.forEach(it => lootFeed(`<b style="color:${gradeOf(it).c}">[${gradeOf(it).n}] ${it.name}</b>${it.set ? ` · ${SETS[it.set].n}` : ''}${it.curse ? ' · 저주' : ''}`, gradeOf(it).c, 4200));
    lootFeed('장비는 가까이 가서 F로 줍는다', '#9a8f8a');
  }
  function restDone() { G.dun.cur.used = true; const [a, b] = BISTRO.doneText(); banner(a, b, false, CX); } // 맵 가운데 // v3.10

  // ---------- 적 길찾기 (흐름장)
  function updateNav(dt) {
    if (!G.obs || !G.obs.length) { G.navDist = null; return; }
    G.navT -= dt; if (G.navT > 0 && G.navDist) return;
    G.navT = 0.25;
    G.navDist = navFlood(G.nav, G.player.x, G.player.y);
  }
  function losClear(x0, y0, x1, y1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8);
    for (let k = 1; k < n; k++) { const i = navIdx(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n); if (i >= 0 && !G.nav[i]) return false; }
    return true;
  }
  // 포위: 근접 잡몹은 각자 플레이어 둘레의 자리(slotAng)를 향해 다가가 사방을 막는다
  const SURROUND = new Set(['ghoul', 'dog', 'goblin', 'slime', 'bigslime', 'bloat']);
  function assignSlots() {
    const P = G.player, es = G.enemies.filter(e => !e.dead && SURROUND.has(e.type));
    if (!es.length) return;
    const an = e => Math.atan2(e.y - P.y, e.x - P.x);
    es.sort((a, b) => an(a) - an(b));
    const base = an(es[0]), n = es.length;
    es.forEach((e, i) => { e.slotAng = base + i * TAU / Math.max(n, 3); });
  }
  function slotAng(e, ang) {
    if (e.slotAng == null || !SURROUND.has(e.type)) return ang;
    const P = G.player, dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy), toP = Math.atan2(dy, dx);
    if (d > 240 || d < 34 || Math.abs(angDiff(ang, toP)) > 0.5) return ang;
    const R = Math.min(d * 0.55, 36);
    return Math.atan2(P.y + Math.sin(e.slotAng) * R - e.y, P.x + Math.cos(e.slotAng) * R - e.x);
  }
  function steer(e, ang) {
    ang = slotAng(e, ang);
    if (!G.navDist || e.type === 'crow' || e.type === 'boss') return ang;
    const P = G.player, toP = Math.atan2(P.y - e.y, P.x - e.x);
    if (Math.abs(angDiff(ang, toP)) > 0.8 || losClear(e.x, e.y, P.x, P.y)) return ang;
    const c = navIdx(e.x, e.y); if (c < 0) return ang;
    const i = c % NC, j = (c / NC) | 0; let best = -1, bd = 1e9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NC || nj >= NR) continue;
      const n = nj * NC + ni, v = G.navDist[n]; if (v >= 0 && v < bd) { bd = v; best = n; }
    }
    if (best < 0) return ang;
    return Math.atan2(A.y0 + (((best / NC) | 0) + 0.5) * NAV - e.y, A.x0 + (best % NC + 0.5) * NAV - e.x);
  }

  // ---------- 그리기: 바닥(문·구덩이), 구조물 스프라이트
  const FL_CACHE = []; // v2.35 최근 방 바닥 (v3.65 4개 → 8개 · 미리 그린 방도 여기에) (방 들어갈 때 바닥을 새로 그리던 60~90ms 멈춤 제거)
  function floorCached(R) {
    const m = G.stage === 1 && R.type !== 'forge' && R.type !== 'home' && R.type !== 'lab' && R.type !== 'archive' && R.type !== 'den' && R.type !== 'ruin', key = G.stage + ':' + R.id, i = FL_CACHE.findIndex(c => c.key === key && c.dun === G.dun);
    if (R.type !== 'forge' && R.type !== 'home' && R.type !== 'lab' && R.type !== 'archive' && R.type !== 'den' && R.type !== 'ruin' && i >= 0) { const c = FL_CACHE.splice(i, 1)[0]; FL_CACHE.unshift(c);
      ROOMSTYLE = R.style || { path: 'wind' }; CUR_ROOM = R;
      if (m) { fmg.clearRect(0, 0, W, H); fmg.drawImage(c.a, 0, 0); ffg.clearRect(0, 0, W, H); ffg.drawImage(c.b, 0, 0); FRONT_ON = true; } else { fg.clearRect(0, 0, W, H); fg.drawImage(c.a, 0, 0); }
      if (G) G.flatLights = c.fl || []; // v3.65 바닥 그림과 같이 만든 빛도 되살림
      return; }
    paintRoomFloor(R);
    if (R.type === 'forge' || R.type === 'home' || R.type === 'lab' || R.type === 'archive' || R.type === 'den' || R.type === 'ruin') return;
    let c = FL_CACHE.length >= 8 ? FL_CACHE.pop() : null; if (!c) c = { a: mkCanvas(W, H)[0], b: mkCanvas(W, H)[0] };
    c.key = key; c.dun = G.dun; const ga = c.a.getContext('2d'), gb = c.b.getContext('2d'); ga.clearRect(0, 0, W, H); gb.clearRect(0, 0, W, H);
    ga.drawImage(m ? floorM : floor, 0, 0); if (m) gb.drawImage(frontM, 0, 0); c.fl = G.flatLights || []; FL_CACHE.unshift(c);
  }
  function paintRoomFloor(R) {
    withSeed(R.seed, () => {
      ROOMSTYLE = R.style || { path: 'wind' }; CUR_ROOM = R;
      if (R.type === 'forge') { paintForgeOut(fg, R); return; } // v1.71 출장 대장간 야외 바닥
      if (R.type === 'home') { HOME.paint(fg, R); return; } // v2.55 시작 장소
      if (R.type === 'archive') { ARCH.paint(fg, R); return; } // v3.00 코코아의 기록 보관소
      if (R.type === 'lab') { TRUTH.paintLab(fg, R); return; } // v2.58 구덩이 실험실
      if (R.type === 'den') { DEN.paint(fg, R); return; } // v3.17 영수 명수의 안전 놀이터
      const ac = G.stage === 4;
      if (G.stage === 1) paintMeadowFloor(fmg); else if (G.stage === 3) { paintOrcFloor(fg, R); paintOrcWall(fg, R); } else { paintCastle.noRite = ac; paintCastle(fg); paintCastle.noRite = false; paintCastleWall(fg); if (R.type !== 'altar') { if (!ac) withDecor(fg, R, () => paintCastleDecor(fg, R)); } /* v2.89 4장은 21_ash4.js 바닥 자국 */ }
      const g = G.stage === 1 ? fmg : fg;
      for (const b of R.obs) if (b.t === 'pit') (G.stage === 1 ? paintPond : G.stage === 3 && typeof CAMP3 !== 'undefined' ? paintBlood : G.stage === 4 && typeof TOWN4 !== 'undefined' ? () => {} /* v3.19 불탄 자리는 바닥의 재 덧칠에 묻히지 않게 장애물 그림 쪽에서 맨 아래에 그림 */ : paintChasm)(g, b);
      if (G.stage === 2 && typeof KEEP2 !== 'undefined') for (const b of R.obs) if (b.t === 'wall' && fencedPit(b)) paintChasm(g, b); // v3.19 울타리 낭떠러지: 바닥은 낭떠러지, 울타리는 장애물 그림으로
      if (ac) ashCityFloor(fg, R); // v1.22 왕도: 성채 바닥을 재로 덮고 가운데 왕관 모자이크 — 문보다 먼저 깔아 문이 재에 묻히지 않게
      for (const d in R.doors) if (R.doors[d] != null && !hiddenDoor(R, d) && !(R.sealW && R.sealW.dir === d)) (G.stage === 1 ? paintDoorMeadow : G.stage === 3 ? paintDoorOrc : paintDoorCastle)(g, d);
      if (SR_LAYOUT[R.type]) srFloor(g, R); // v1.11
      if (R.tele) paintTelePad(g, R.tele);
      TRUTH.floor(g, R); // v2.59 벽의 인장 · 밀실 바닥 원
    });
  }
  // ---------- 방 그래픽 (v0.24): 게임 전체와 같은 도트 규칙 — 2px 칸, 검은 외곽선, 4단계 명암, 그라데이션 대신 디더링
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const dith = (x, y, lv) => lv * 16 > BAYER[(y & 3) * 4 + (x & 3)]; // lv 0..1, 참이면 칠한다
  const mkGrid = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
  const gAt = (g, x, y) => (g[y] && g[y][x]) || '.';
  function gOutline(g, ch = 'k', skip = '') {
    const out = g.map(r => r.slice());
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
      if (g[y][x] !== '.') continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = gAt(g, x + dx, y + dy); if (c !== '.' && c !== ch && !skip.includes(c)) { out[y][x] = ch; break; } }
    }
    return out;
  }
  function gCanvas(g, pal) {
    const [c, cx] = mkCanvas(g[0].length * 2, g.length * 2);
    gPaint(cx, g, pal, 0, 0);
    return c;
  }
  function gPaint(cx, g, pal, x0, y0) {
    x0 = Math.round(x0 / 2) * 2; y0 = Math.round(y0 / 2) * 2;
    if (DEC && decBlock(cx, x0, y0, g[0].length * 2, g.length * 2)) return;
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) { const ch = g[y][x]; if (ch === '.' || !pal[ch]) continue; cx.fillStyle = pal[ch]; cx.fillRect(x0 + x * 2, y0 + y * 2, 2, 2); }
  }
  const fromRows = rows => { const w = Math.max(...rows.map(r => r.length)); return rows.map(r => r.padEnd(w, '.').split('')); };
  // 명암: 왼쪽 위에서 빛
  const shade4 = (dx, dy, r, j = 0.22) => { const v = (dx + dy * 1.1) / (r * 1.4) + rand(-j, j); return v < -0.5 ? 'h' : v < 0 ? 'l' : v < 0.5 ? 'd' : 'D'; };

  const STONE = { H: '#7a7488', k: '#0b0a0e', K: '#050407', h: '#5e5868', l: '#423d4c', d: '#2d2935', D: '#1c1922', m: '#3a5226', M: '#567234', w: '#a49c8e', W: '#d8d0c0', r: '#7a1820' };
  const LEAF = Object.assign({ k: '#07100a', r: '#b83040', y: '#e0c040', p: '#a070d0', t: '#3a2a1c', T: '#22180e' }, TREE_PAL.green);

  // --- 장애물 생성기 -------------------------------------------------
  // 초원 덤불 벽: 잎 뭉치를 겹쳐 쌓는다 (발자국 wc×hc칸 + 높이 HH칸)

  // 성채 기둥: 기둥머리·몸통(세로 4단 명암)·주춧돌, 부서진 것도 있다
  // 성채 무너진 벽: 윗면 벽돌 + 앞면 어두운 벽돌, 윗면 가장자리가 깨져 있다
  // ================================================================ v1.03 오브젝트 도트 다시 그리기 — 덩어리 대신 구조가 읽히게
  // 챕터 1 수풀: 둥근 덤불 여러 무더기(뒤→앞), 가장자리는 잎끝이 톡톡 튀어나오고, 안쪽은 잎 모양 무늬(밝은 칸+어두운 칸 짝)
  function genHedge(wc, hc) {
    const HH = 9, W0 = wc + 4, H0 = hc + HH + 4, g = mkGrid(W0, H0);
    const TONE = ['h', 'l', 'd', 'D'], tone = i => TONE[clamp(i, 0, 3)];
    const cl = [], n = Math.max(3, Math.round(W0 / 9) + Math.round(H0 / 14));
    for (let i = 0; i < n * 2; i++) { const R = rand(5, 8.5); cl.push({ x: rand(R * 0.7, W0 - R * 0.7), y: rand(R * 0.6 + 1, H0 - R * 0.75 - 2), R, ph: rand(0, 6) }); }
    for (let x = 4; x < W0 - 2; x += 7) cl.push({ x: x + rand(-1, 1), y: H0 - rand(6, 7.5), R: rand(5, 6.5), ph: rand(0, 6) });
    // 빈틈은 그늘로 칠하지 않고 그 자리에 작은 덤불을 더 놓아 메움 (충돌 영역이 다 덮이게)
    for (let it = 0; it < 600; it++) { let gap = null;
      for (let y = 8; y < H0 - 7 && !gap; y += 2) for (let x = 7; x < W0 - 7 && !gap; x += 2) if (!cl.some(c => Math.hypot(x - c.x, (y - c.y) * 1.12) < c.R * 0.95)) gap = { x, y }; // 안쪽만 (가장자리는 울퉁불퉁하게 둠)
      if (!gap) break; cl.push({ x: gap.x + rand(-0.5, 0.5), y: gap.y + rand(-0.5, 0.5), R: rand(4.5, 6), ph: rand(0, 6) }); }
    cl.sort((a, b) => a.y - b.y);
    const own = mkGrid(W0, H0);
    cl.forEach((c, ci) => {
      for (let y = 1; y < H0 - 1; y++) for (let x = 1; x < W0 - 1; x++) {
        const dx = x - c.x, dy = (y - c.y) * 1.12, a = Math.atan2(dy, dx), d = Math.hypot(dx, dy), edge = c.R * (1 + 0.1 * Math.sin(a * 6 + c.ph)) + (((x * 7 + y * 3) % 5 === 0) ? 0.6 : 0);
        if (d > edge) continue;
        const t = (dx * 0.62 + dy * 0.8) / c.R; let i = t < -0.5 ? 0 : t < 0.05 ? 1 : t < 0.55 ? 2 : 3;
        if (y > hc + 2) i += 1; // 앞면(세로)은 한 단계 어둡게
        if (d > edge - 1.1 && own[y][x] !== '.' && own[y][x] !== ci) i = 3; // 앞 무더기와 뒤 무더기 사이 그늘
        g[y][x] = tone(i); own[y][x] = ci;
      }
    });
    // 잎 무늬: 엇갈린 격자마다 밝은 칸 + 그 오른쪽 아래 어두운 칸
    for (let y = 2; y < H0 - 2; y += 2) for (let x = 2 + (y >> 1) % 3; x < W0 - 2; x += 3) {
      const c = g[y][x], j = TONE.indexOf(c); if (j < 0 || g[y + 1][x + 1] === '.') continue;
      if (j > 0) g[y][x] = TONE[j - 1]; const c2 = TONE.indexOf(g[y + 1][x + 1]); if (c2 >= 0 && c2 < 3) g[y + 1][x + 1] = TONE[c2 + 1];
    }
    // 꽃: 밝은 쪽에 작은 송이 몇 개만 (점 노이즈 대신 모아서)
    const fl = pick(['r', 'y', 'p']);
    for (let k = 0, tries = 0; k < Math.max(1, Math.round(W0 * H0 / 260)) && tries < 80; tries++) { const x = randi(3, W0 - 4), y = randi(2, hc + 2); if (g[y][x] !== 'h' && g[y][x] !== 'l') continue;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) if ('hl'.includes(g[y + dy][x + dx])) g[y + dy][x + dx] = dx || dy ? fl : 'y'; k++; }
    // 밑동: 그늘 + 줄기 + 풀잎
    for (let x = 2; x < W0 - 2; x++) { let y = H0 - 2; while (y > 0 && g[y][x] === '.') y--; if (y < 1) continue; g[y][x] = 'D'; if (x % 5 === 2 && y + 1 < H0 - 1) g[y + 1][x] = 't'; if (x % 4 === 1 && g[y - 1][x] !== '.') g[y - 1][x] = 'D'; }
    for (let x = 3; x < W0 - 3; x += randi(3, 5)) { let y = H0 - 2; while (y > 0 && g[y][x] === '.') y--; if (y > 2) { g[y][x] = 'l'; g[y - 1][x] = 'h'; } }
    return { g: gOutline(g), HH };
  }
  // 챕터 2 벽: 위는 판석 덮개(크기 제각각·이끼·금), 테두리 처마 그늘, 앞면은 크기 다른 벽돌마다 명암, 빠진 벽돌, 담쟁이, 밑동 이끼·돌부스러기, 가끔 찢어진 기사단 깃발
  function genWallBlock(wc, hc) {
    const HH = 12, W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0);
    // 위: 판석
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) g[y][x] = 'l';
    for (let y = 1; y <= hc;) { const rh = randi(3, 4); let x = 1;
      while (x <= wc) { const w = randi(4, 8);
        for (let yy = y; yy < Math.min(y + rh, hc + 1); yy++) for (let xx = x; xx < Math.min(x + w, wc + 1); xx++) {
          const top = yy === y, left = xx === x, right = xx === x + w - 1 || xx === wc, bot = yy === y + rh - 1;
          g[yy][xx] = (top || left) && !(right || bot) ? 'h' : right || bot ? 'D' : 'l';
        }
        if (w > 5 && Math.random() < 0.35) { let cx = x + randi(1, w - 2), cy = y; for (let k = 0; k < rh; k++) { if (g[cy] && g[cy][cx]) g[cy][cx] = 'd'; cx += pick([-1, 0, 1]); cy++; } } // 금
        x += w; }
      y += rh; }
    for (let k = 0; k < Math.max(1, wc * hc / 160); k++) { const mx = randi(2, wc - 1), my = randi(2, hc - 1), R0 = rand(1.5, 3); for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) { const d = Math.hypot(x - mx, (y - my) * 1.3); if (d < R0 && dith(x, y, 1 - d / R0 + 0.2)) g[y][x] = d < R0 * 0.5 ? 'M' : 'm'; } }
    // 처마: 밝은 테 + 아래 짙은 그늘
    for (let x = 1; x <= wc; x++) { g[hc][x] = 'h'; g[hc + 1][x] = 'K'; }
    // 앞: 벽돌 (줄마다 2칸 벽돌 + 1칸 줄눈, 너비 제각각)
    for (let row = 0, y = hc + 2; y <= hc + HH; row++, y += 3) { let x = 1 - (row % 2) * randi(1, 3);
      while (x <= wc) { const w = randi(3, 6), shade = Math.random(), miss = Math.random() < 0.05;
        for (let xx = Math.max(1, x); xx < Math.min(x + w, wc + 1); xx++) for (let yy = y; yy < Math.min(y + 2, hc + HH + 1); yy++) {
          const last = xx === x + w - 1, lit = shade < 0.6; let c = last ? 'D' : yy === y ? (lit ? 'l' : 'd') : (lit ? 'd' : 'D'); if (!last && yy === y && xx === Math.max(1, x) && lit) c = 'h';
          if (miss && !last) c = yy === y ? 'K' : 'k';
          g[yy][xx] = c; }
        x += w; }
      if (y + 2 <= hc + HH) for (let x2 = 1; x2 <= wc; x2++) g[y + 2][x2] = y + 2 >= hc + HH - 1 ? 'K' : 'D'; }
    // 담쟁이: 처마에서 늘어진 줄기 1~2개
    for (let k = 0; k < (wc > 30 ? 2 : 1); k++) { if (Math.random() < 0.35) continue; let x = randi(3, wc - 3); const L = randi(5, HH - 2);
      for (let j = 0; j < L; j++) { const y = hc + 1 + j; g[y][x] = 'M'; if (j % 2 === 0 && x + 1 <= wc) g[y][x + 1] = 'm'; else if (x - 1 >= 1) g[y][x - 1] = 'm'; if (Math.random() < 0.3) x = clamp(x + pick([-1, 1]), 2, wc - 1); } }
    // 기사단 깃발 (넓은 벽에서 가끔): 찢어진 붉은 천 + 금빛 테
    if (wc >= 34 && Math.random() < 0.3) { const bx = randi(6, wc - 10), L = HH - 3;
      for (let j = 0; j < L; j++) for (let i = 0; i < 6; i++) { const torn = j === L - 1 && (i === 1 || i === 4); if (torn) continue; g[hc + 2 + j][bx + i] = i === 0 || i === 5 ? 'w' : j === 0 ? 'w' : (j + i) % 5 === 0 ? 'D' : 'r'; } }
    // 밑동: 이끼 · 돌부스러기
    for (let x = 1; x <= wc; x++) { if (Math.random() < 0.4) g[hc + HH][x] = pick(['m', 'M']); if (Math.random() < 0.18) g[hc + HH - 1][x] = 'm'; }
    // 덮개 가장자리 깨짐
    for (let x = 1; x <= wc; x++) if (Math.random() < 0.18) { g[1][x] = '.'; if (Math.random() < 0.4 && g[2]) g[2][x] = 'd'; }
    return { g: gOutline(g), HH };
  }

  // 성채 잔해: 작은 돌 여러 개 + 뼈
  // v2.81
  // 초원 바위 더미 (기존 rockBig/rockA를 2px로 조합)

  // --- 바닥: 구덩이 · 연못 · 길 · 텔레포터 -------------------------
  function genChasm(wc, hc) {
    const W0 = wc + 2, H0 = hc + 2, g = mkGrid(W0, H0);
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) {
      const rim = y === 1 || y === hc || x === 1 || x === wc;
      if (rim) { g[y][x] = y === 1 ? 'h' : (x + y) % 5 === 0 ? 'D' : 'l'; continue; }
      const dy = y - 2; // 안쪽 윗벽: 벽돌이 아래로 갈수록 어두워진다
      if (dy < 7) {
        const off = (Math.floor(dy / 2) % 2) * 3, mort = dy % 2 === 1 || (x + off) % 6 === 0;
        g[y][x] = dy < 2 ? (mort ? 'D' : 'l') : dy < 4 ? (mort ? 'K' : 'd') : dith(x, y, (7 - dy) / 4) ? 'D' : 'K';
      } else g[y][x] = x === 2 || x === wc - 1 ? (dith(x, y, 0.5) ? 'D' : 'K') : 'K';
    }
    for (const [x, y] of [[1, 1], [wc, 1], [1, hc], [wc, hc]]) g[y][x] = '.';
    for (let i = 0; i < wc / 5; i++) { const x = randi(2, wc - 1); if (g[hc][x] === 'l') g[hc][x] = 'd'; }
    for (let i = 0; i < wc * hc / 70; i++) { const x = randi(3, wc - 2), y = randi(Math.min(hc - 1, 10), hc - 1); if (g[y][x] === 'K') g[y][x] = 'p'; }
    return gOutline(g);
  }
  const CHASM_PAL = Object.assign({}, STONE, { p: '#3a1e58' });
  function genPond(wc, hc, style = 'clear', shape = 'blob') {
    const W0 = wc + 14, H0 = hc + 18, g = mkGrid(W0, H0), cx = W0 / 2, cy = H0 / 2, rx = wc / 2, ry = hc / 2, a1 = rand(0, 6), a2 = rand(0, 6);
    const lobes = shape === 'lobes' ? [[-0.45, 0.12, 0.55], [0.42, -0.1, 0.58], [0, 0.05, 0.72]] : shape === 'kidney' ? [[-0.38, 0.05, 0.62], [0.36, -0.12, 0.64]] : null;
    const inside = (x, y) => {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, an = Math.atan2(dy, dx);
      if (lobes) return lobes.some(([ox, oy, r]) => ((dx - ox) / r) ** 2 + ((dy - oy) / r) ** 2 < 1 - 0.07 * Math.sin(an * 4 + a1));
      return dx * dx + dy * dy < 1 - 0.1 * Math.sin(an * 3 + a1) - 0.07 * Math.sin(an * 5 + a2);
    };
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) if (inside(x, y)) g[y][x] = 'W';
    // 가운데 작은 섬
    const isl = style === 'island' ? { x: cx + rand(-rx * 0.2, rx * 0.2), y: cy + rand(-ry * 0.1, ry * 0.15), r: Math.max(3, Math.min(rx, ry) * 0.32) } : null;
    if (isl) for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) { const e = ((x - isl.x) / isl.r) ** 2 + ((y - isl.y) / (isl.r * 0.7)) ** 2; if (e < 1 && g[y][x] === 'W') g[y][x] = e < 0.45 ? 'i' : e < 0.8 ? 'I' : 'B'; }
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
      if (g[y][x] !== 'W') continue;
      const up1 = !'Wiw'.includes(gAt(g, x, y - 1)) && gAt(g, x, y - 1) !== 'I', up2 = gAt(g, x, y - 2) === '.', up3 = gAt(g, x, y - 3) === '.';
      if (gAt(g, x, y - 1) === '.') g[y][x] = 'b'; else if (up2) g[y][x] = 'B'; else if (up3) g[y][x] = 'D';
      else { const t = (y - (cy + ry * 0.2)) / (ry * 0.4); if (t > 1 || (t > 0 && dith(x, y, t))) g[y][x] = 'w'; }
    }
    // 물결·달빛 줄기·녹조
    for (let i = 0; i < wc * hc / 100 + 1; i++) { const x = randi(3, W0 - 6), y = randi(4, H0 - 4); for (let k = 0; k < randi(2, 3); k++) if ('Ww'.includes(gAt(g, x + k, y)) && Math.random() < 0.65) g[y][x + k] = 'h'; }
    if (style !== 'swamp' && Math.random() < 0.3) { const mx = Math.round(cx + rand(-rx * 0.3, rx * 0.3)); for (let y = 3; y < H0 - 3; y += 4) for (let k = -1; k <= 1; k++) if ('Ww'.includes(gAt(g, mx + k + (y % 4 ? 1 : 0), y)) && Math.random() < 0.3) g[y][mx + k + (y % 4 ? 1 : 0)] = 'h'; }
    if (style === 'swamp') for (let i = 0; i < wc * hc / 60 + 3; i++) { const bx = rand(2, W0 - 2), by = rand(3, H0 - 2), br = rand(1.5, 4); for (let y = Math.floor(by - br); y <= by + br; y++) for (let x = Math.floor(bx - br * 1.5); x <= bx + br * 1.5; x++) { if (!'Ww'.includes(gAt(g, x, y))) continue; const e = ((x - bx) / (br * 1.5)) ** 2 + ((y - by) / br) ** 2; if (e < 1 && Math.random() < 1 - e * 0.6) g[y][x] = e < 0.35 ? 'o' : 'a'; } }
    // 수련 (맑은 물), 거품 (늪), 떠다니는 낙엽
    if (style === 'clear' || style === 'island') for (let i = 0; i < wc * hc / 90 + 1; i++) { const x = randi(3, W0 - 5), y = randi(5, H0 - 5); if (g[y][x] === 'W' && g[y][x + 1] === 'W' && g[y + 1][x] !== '.') { g[y][x] = 'L'; g[y][x + 1] = 'l'; g[y + 1][x] = 'L'; if (Math.random() < 0.4) g[y][x + 1] = 'f'; } }
    if (Math.random() < 0.35) for (let i = 0; i < wc * hc / 120 + 1; i++) { const x = randi(3, W0 - 4), y = randi(4, H0 - 4); if ('Ww'.includes(g[y][x])) g[y][x] = 'A'; }
    if (isl && Math.random() < 0.7) { const x = Math.round(isl.x), y = Math.round(isl.y) - 1; for (const [dx, dy, c] of [[-1, 0, 'L'], [0, -1, 'l'], [1, 0, 'L'], [0, 0, 'L'], [0, 1, 'k']]) if (g[y + dy]) g[y + dy][x + dx] = c; }
    const o = gOutline(g);
    // 물가: 갈대·풀 (늪은 갈대가 훨씬 많다), 돌 테두리 (바위 연못)
    const reedP = style === 'swamp' ? 0.45 : 0.18;
    for (let x = 1; x < W0 - 1; x++) for (let y = 1; y < H0 - 1; y++) {
      if (o[y][x] !== 'k') continue;
      if (style === 'rocky' && Math.random() < 0.22) { const w = randi(2, 3); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= w; dx++) { const yy = y + dy, xx = x + dx; if (!o[yy] || o[yy][xx] === undefined || 'WwDbBhLlfA'.includes(o[yy][xx])) continue; o[yy][xx] = dy === -1 || dx === -1 || dx === w || dy === 1 ? (o[yy][xx] === '.' || o[yy][xx] === 'k' ? 'K' : o[yy][xx]) : dx === 0 ? 'G' : dx === w - 1 ? 'd' : 'g'; } continue; }
      if (o[y - 1][x] !== '.') continue;
      if (Math.random() < reedP) { const h = randi(2, style === 'swamp' ? 6 : 4); for (let k = 1; k <= h; k++) if (o[y - k] && o[y - k][x] === '.') o[y - k][x] = k === h ? (style === 'swamp' && Math.random() < 0.5 ? 'T' : 'M') : 'R'; }
      else if (Math.random() < 0.25) o[y - 1][x] = 'm';
    }
    if (style === 'swamp') for (let x = 1; x < W0 - 1; x++) for (let y = 1; y < H0 - 1; y++) if ('Wwa'.includes(o[y][x]) && Math.random() < 0.01) { o[y][x] = 'R'; if (o[y - 1][x] !== '.') o[y - 1][x] = 'T'; }
    return o;
  }
  const POND_PALS = {
    clear: { W: '#13304c', w: '#1c4466', D: '#0c1a2c', h: '#456780' },
    island: { W: '#13304c', w: '#1c4466', D: '#0c1a2c', h: '#456780' },
    rocky: { W: '#0f2a46', w: '#18406a', D: '#081624', h: '#587b98' },
    swamp: { W: '#16221a', w: '#1e3024', D: '#0c140c', h: '#5a6a3a' },
  };
  const POND_PAL = { Y: '#a08a4a', K: '#0b0a0e', a: '#3a5a22', o: '#6a8a3a', A: '#c86a2a', I: '#2e5222', i: '#4a7a34', T: '#5a3a20', G: '#8a8494', g: '#6a6474', d: '#4a4554', k: '#081210', b: '#6e5236', B: '#4a3424', D: '#0c1a2c', W: '#13304c', w: '#1c4466', h: '#456780', L: '#3e6a2c', l: '#6a9a44', f: '#e8b8d0', R: '#4a6a2e', M: '#8aa84a', m: '#2e5222' };
  // 흙길 한 조각: dir 방향으로 이어지는 길, far 쪽은 디더링으로 어두워진다
  function genPath(wc, hc, vert, farSide) {
    const g = mkGrid(wc, hc), half = vert ? wc / 2 : hc / 2, len = vert ? hc : wc;
    for (let i = 0; i < len; i++) {
      const w = 5 + (Math.sin(i * 0.7) > 0.6 ? 1 : 0) + randi(0, 1);
      const span = Math.ceil(w * 1.4);
      for (let j = -span; j <= span; j++) {
        const x = vert ? Math.round(half + j) : i, y = vert ? i : Math.round(half + j);
        if (x < 0 || y < 0 || x >= wc || y >= hc) continue;
        const t = Math.abs(j + 0.5) / w;
        if (t < 0.5) { g[y][x] = Math.random() < 0.025 ? 'g' : Math.random() < 0.08 ? 'w' : 'b'; continue; }
        const lv = clamp((1.4 - t) / 0.9, 0, 1);
        if (dith(x, y, lv)) g[y][x] = Math.random() < 0.35 ? 'B' : 'b'; else if (dith(x + 1, y + 2, lv * 0.85)) g[y][x] = 'e';
      }
    }
    // 길가 풀
    for (let i = 0; i < len * 0.6; i++) { const x = randi(0, wc - 1), y = randi(0, hc - 1); if (g[y][x] === '.') g[y][x] = pick(['m', 'M', '.']); }
    // 먼 쪽 어둠
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const t = farSide === 'n' ? 1 - y / hc : farSide === 's' ? y / hc : farSide === 'w' ? 1 - x / wc : x / wc;
      const lv = clamp((t - 0.35) / 0.55, 0, 1);
      if (lv > 0 && g[y][x] !== '.' && dith(x, y, lv)) g[y][x] = lv > 0.85 ? '.' : 'k';
    }
    return g;
  }
  const PATH_PAL = { e: '#3a4426', k: '#081008', b: '#62482e', w: '#7e6040', B: '#56402a', g: '#8a8478', m: '#2e5222', M: '#4a7a34' };
  function genTelePad() {
    const W0 = 19, H0 = 11, g = mkGrid(W0, H0), cx = 9, cy = 5;
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
      const dx = (x - cx) / 8.6, dy = (y - cy) / 4.6, e = dx * dx + dy * dy;
      if (e < 1) g[y][x] = e > 0.5 ? (y < cy ? 'l' : 'd') : e > 0.38 ? 'D' : 'K';
    }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, x = Math.round(cx + Math.cos(a) * 7.2), y = Math.round(cy + Math.sin(a) * 3.8); g[y][x] = 'r'; }
    return gOutline(g);
  }
  const TELE_PAL = Object.assign({}, STONE, { r: '#2a2840' });

  // --- 문 · 봉쇄 -------------------------------------------------------
  // 성채 북문: 아치형 돌문틀 + 위로 오르는 계단이 어둠 속으로
  function genArch() {
    const W0 = 27, H0 = 36, g = mkGrid(W0, H0), cx = 13, top = 12;
    const outer = (x, y) => y >= top ? x >= 1 && x <= 25 : Math.hypot(x - cx, (y - top) * 1.0) <= 12.5;
    const inner = (x, y) => y >= top ? x >= 4 && x <= 22 : Math.hypot(x - cx, (y - top)) <= 9.4;
    for (let y = 0; y < H0 - 1; y++) for (let x = 0; x < W0; x++) {
      if (!outer(x, y)) continue;
      if (inner(x, y)) {
        const fromBottom = H0 - 2 - y; // 계단: 아래 6칸만 밝다
        if (fromBottom < 8) g[y][x] = fromBottom % 3 === 0 ? 'l' : 'd';
        else g[y][x] = 'K';
        if (fromBottom >= 5 && fromBottom < 13 && g[y][x] === 'K' && dith(x, y, (13 - fromBottom) / 9)) g[y][x] = 'D';
      } else {
        const ang = Math.atan2(y - top, x - cx), seam = y < top ? Math.abs(Math.sin(ang * 5)) < 0.18 : (y - top) % 4 === 3;
        g[y][x] = seam ? 'D' : x < cx ? 'h' : 'l';
        if (y >= top && x > 22) g[y][x] = seam ? 'K' : 'd';
      }
    }
    for (let y = 0; y < 3; y++) for (let x = cx - 1; x <= cx + 1; x++) if (g[y][x] !== '.') g[y][x] = y === 0 ? 'h' : 'w';
    return gOutline(g);
  }
  // 성채 남·서·동문: 바닥 돌판이 밖으로 이어지며 어두워진다
  function genFloorExit(wc, hc, farSide) {
    const g = mkGrid(wc, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const vert = farSide === 's', i = vert ? y : x, j = vert ? x : y, off = (Math.floor(i / 6) % 2) * 3;
      g[y][x] = i % 6 === 5 || (j + off) % 6 === 5 ? 'D' : (i % 6 === 0 ? 'l' : 'd');
      const t = farSide === 's' ? y / hc : farSide === 'w' ? 1 - x / wc : x / wc, lv = clamp((t - 0.15) / 0.7, 0, 1);
      if (dith(x, y, lv)) g[y][x] = 'K';
    }
    return g;
  }
  function genDoorPost(h) { const g = mkGrid(5, h + 2); for (let y = 1; y <= h; y++) for (let x = 1; x <= 3; x++) g[y][x] = y === 1 ? 'h' : (y - 1) % 4 === 0 ? 'D' : x === 1 ? 'h' : x === 2 ? 'l' : 'd'; return gOutline(g); }
  // 쇠창살 (n/s는 세로 창살, w/e는 가로)
  function genBars(wc, hc, vert) {
    const g = mkGrid(wc, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const along = vert ? x : y, cross = vert ? y : x, L = vert ? hc : wc;
      if (along % 4 === 1) g[y][x] = 'G'; else if (along % 4 === 2) g[y][x] = 'g'; else if (along % 4 === 3) g[y][x] = 'k';
      if (cross === Math.floor(L * 0.28) || cross === Math.floor(L * 0.68)) g[y][x] = along % 4 === 1 ? 'W' : 'g';
      if (vert && y === hc - 1 && along % 4 !== 1 && along % 4 !== 2) g[y][x] = '.';
    }
    return g;
  }
  const BAR_PAL = { k: '#0b0a0e', g: '#4a4656', G: '#7a7488', W: '#a49cb0' };
  const WOOD_BAR = { k: '#0b0806', g: '#553620', G: '#8a6034', W: '#e0d6c4' };
  // 가시덤불: v3.49 네모난 띠 대신 울퉁불퉁한 덤불 덩어리 — 덩굴 뭉치(둥근 덩어리 여럿) · 위는 잎이 빛을 받고 아래로 갈수록 어둡게 · 겉으로 삐죽 나온 가시 · 덩어리를 가로지르는 굵은 덩굴 · 열매 몇 알
  function genThorns(wc, hc, vert) {
    const g = mkGrid(wc, hc), span = vert ? wc : hc, thick = vert ? hc : wc, at = (u, v) => vert ? [u, v] : [v, u];
    const set = (u, v, c) => { const [x, y] = at(u, v); if (x >= 0 && y >= 0 && x < wc && y < hc) g[y][x] = c; }, get = (u, v) => { const [x, y] = at(u, v); return x >= 0 && y >= 0 && x < wc && y < hc ? g[y][x] : '#'; };
    // 둥근 덤불 덩어리를 두 줄로 엇갈려 쌓음 (뒤 → 앞 순서, 앞 덩어리 가장자리엔 어두운 테 → 덩어리마다 구분)
    const n = Math.max(3, Math.round(span / 5)), blobs = [];
    for (let i = 0; i < n; i++) { const r = Math.min(thick / 2 - 1.2, span / n * 0.78) * rand(0.86, 1.04);
      blobs.push({ u: 1 + (i + 0.5) * (span - 2) / n + rand(-0.6, 0.6), v: thick / 2 + (i % 2 ? 1 : -1) * thick * 0.13 + rand(-0.5, 0.5), r }); }
    blobs.sort((p, q) => (vert ? p.v - q.v : p.u - q.u));
    for (const B of blobs) for (let v = 0; v < thick; v++) for (let u = 0; u < span; u++) {
      const nu = (u + 0.5 - B.u) / B.r, nv = (v + 0.5 - B.v) / B.r, d = Math.hypot(nu, nv); if (d > 1) continue;
      const [sx, sy] = vert ? [nu, nv] : [nv, nu], lit = -(sx * 0.55 + sy * 0.85), dz = ((u * 3 + v * 5) % 4) / 10 - 0.15; // 왼쪽 위에서 빛 · 잔 디더
      set(u, v, d > 0.86 ? 'V' : lit + dz > 0.42 ? 'l' : lit + dz > 0 ? 'L' : lit + dz > -0.45 ? 'v' : 'V'); }
    // 덩어리를 가로지르는 굵은 덩굴 두세 가닥 (위에 겹침)
    for (let k = 0; k < 3; k++) { const ph = rand(0, 6), base = thick * (0.3 + k * 0.2); for (let u = 0; u < span; u++) { const v = Math.round(base + Math.sin(u * 0.5 + ph) * 1.4); if (get(u, v) !== '.' && get(u, v) !== '#') { set(u, v, 'v'); if (get(u, v + 1) !== '.' && get(u, v + 1) !== '#') set(u, v + 1, 'V'); } } }
    // 겉으로 삐죽 나온 가시
    for (let v = 0; v < thick; v++) for (let u = 0; u < span; u++) if (get(u, v) === '.') { let nb = 0; for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = get(u + du, v + dv); if (q !== '.' && q !== '#' && q !== 't') nb++; } if (nb === 1 && rand(0, 1) < 0.45) { set(u, v, 't'); const du = u - (vert ? 0 : 0); } } // v3.49 가시 더 많이
    for (let v = 0; v < thick; v++) for (let u = 0; u < span; u++) if ((get(u, v) === 'v' || get(u, v) === 'V') && rand(0, 1) < 0.07) set(u, v, 't'); // 덤불 안쪽에도 가시
    // 열매
    for (let i = 0; i < Math.max(2, span / 8); i++) { const u = randi(2, span - 3), v = randi(1, thick - 2); if (get(u, v) === 'L' || get(u, v) === 'v') set(u, v, 'r'); }
    return gOutline(g, 'k', 't');
  }
  const THORN_PAL = { k: '#070a04', V: '#1e2610', v: '#3e4a20', t: '#c8b888', L: '#2e5222', l: '#5a8a3a', r: '#c03040' };
  // 보스 문장: 붉은 해골
  const SIGIL = fromRows(['..kkkkkk..', '.krrRRrrk.', 'krRRRRRRrk', 'krkkRRkkrk', 'krkKRRkKrk', 'krRRkkRRrk', '.krRRRRrk.', '..kRkRkRk.', '...kkkkk..']);
  const SIGIL_PAL = { k: '#1a0408', K: '#ff5060', r: '#7a1020', R: '#c02838' };
  // 상자
  const CHEST_C = fromRows(["..kkkkkkkkkkkkkk..", ".kyYwwywwwwywwYyk.", "kyYwwbywwwwybwwYyk", "kybbbbybbbbybbbbyk", "kyBbbbyBbbbyBbbByk", "kkkkkkkkYYkkkkkkkk", "kyYbbbykYYkybbbYyk", "kybbbbykyykybbbbyk", "kybBbbybkkbybbBbyk", "kybbbbybbbbybbbbyk", "kyBbbbyBbbbyBbbByk", "kybbbbybbbbybbbbyk", "kyYBBBByBBByBBBYyk", "kkkkkkkkkkkkkkkkkk"]); // v2.32 보물상자 다시 (18×14칸 · 둥근 뚜껑 · 쇠띠 · 자물쇠)
  const CHEST_O = fromRows(["..kkkkkkkkkkkkkk..", ".kyBbbybbbbybbByk.", "kyBKKKKKKKKKKKKByk", "kyKKKKKKKKKKKKKKyk", "kkkkkkkkkkkkkkkkkk", "kyKKKoKKKKKKoKKKyk", "kyYbbbykYYkybbbYyk", "kybbbbykyykybbbbyk", "kybBbbybkkbybbBbyk", "kybbbbybbbbybbbbyk", "kyBbbbyBbbbyBbbByk", "kybbbbybbbbybbbbyk", "kyYBBBByBBByBBBYyk", "kkkkkkkkkkkkkkkkkk"]);
  const CHEST_PAL = {"k": "#0b0a0e", "K": "#140c06", "w": "#a87e52", "b": "#7a5434", "B": "#4e3420", "y": "#b88a30", "Y": "#f0d070", "o": "#ffd34d"};
  const CHEST_PAL_B = {"k": "#0b0a0e", "K": "#160608", "w": "#c03a42", "b": "#7e2028", "B": "#4a1016", "y": "#e0a830", "Y": "#fff0a0", "o": "#ffe080"}; // 보스 전리품 상자: 핏빛 칠 · 금 장식
  const CHEST_PAL_S = {"k": "#0b0a0e", "K": "#120a1c", "w": "#9a7ac0", "b": "#5a3e84", "B": "#34224e", "y": "#a890d8", "Y": "#f4e8ff", "o": "#f0d8ff"}; // 잊힌 틈새 상자: 보랏빛
  // 상인: 두건 쓴 떠돌이 상인과 짐수레
  // v2.93 상인 「살구」: 왕관앵무 수인 (크림 노랑 몸 · 노란 얼굴 · 주황 볼 · 세로 눈 · 큰 등짐과 침낭 · 한쪽 날개를 펼쳐 손님을 반김)
  const MERCHANT_ROWS = ['.'.repeat(20)].concat(["...Yy.............", "....yY.Yy.........", "rRRr.yYyY.YPPP....", "rSSr..yYyyYQQPP...", ".PP..gyYYyg.PcP...", ".PPPgyYYYYygPPQ...", ".QPgYYYYYYYYgPP...", ".PPgYeYYYeYYgPP...", ".PPooEYbbEYooPP...", ".QPgoYYBBYYogPdW..", ".PP.gyYYYYygGWWdW.", ".PdGPgcCcgPGWWdWd.", "..dWPggcggPdWdWd..", "..dWggggggg.d.d...", "...ddggggg........", "......ggg.........", "......l.l.........", ".....lL.lL........"].map(r => '.' + r + '.')); // 바깥 1칸 여백 (외곽선 자리)
  const MERCHANT_PAL = {"k": "#0b0a0e", "y": "#f0cc40", "Y": "#fbe680", "o": "#e8703a", "b": "#b8a8a0", "B": "#7a6a66", "e": "#141014", "w": "#ffffff", "g": "#ead79a", "G": "#f8eecc", "d": "#c0a45c", "c": "#e8902a", "C": "#9a5210", "P": "#7a4e2c", "Q": "#a8744a", "E": "#6a3a22", "R": "#b04038", "S": "#7a2828", "r": "#e0c8a0", "W": "#dcc078", "l": "#d4a098", "L": "#9a6a62"};
  // 장면: wing 펼친 날개를 한 칸 들어 퍼덕임 · crest 볏 끝이 한 칸 흔들림 · blink 눈 감음
  function merchantGrid(wing, crest, blink) {
    const g = MERCHANT_ROWS.map(r => r.split(''));
    if (wing) { const mv = []; for (let y = 10; y <= 14; y++) for (let x = 12; x < 20; x++) if ('WdG'.includes(g[y][x])) { mv.push([y, x, g[y][x]]); g[y][x] = '.'; } for (const [y, x, c] of mv) g[y - 1][x] = c; }
    if (crest) { for (const y of [1, 2]) { const r = g[y]; for (let x = 8; x >= 3; x--) if ('yY'.includes(r[x]) && r[x + 1] === '.') { r[x + 1] = r[x]; r[x] = '.'; } } }
    if (blink) for (const x of [6, 10]) { g[8][x] = 'Y'; g[9][x] = 'e'; }
    return gOutline(g);
  }
  const merchantArt = (wing, crest, blink) => art('merch' + (+wing) + (+crest) + (+blink), () => gCanvas(merchantGrid(wing, crest, blink), MERCHANT_PAL));
  const MERCHANT = merchantGrid(false, false, false); // 예전 그림 자리 (노점 · 수레 장면)
  const STAND = fromRows(['kkkkkkkkkkk', 'kwwwwwwwwwk', 'kbbbbbbbbbk', 'kbBkkkkkBbk', 'kbBk...kBbk', 'kkkk...kkkk']);
  const STAND_PAL = { k: '#0b0a0e', w: '#8a6a48', b: '#6a4a30', B: '#4a3220' };
  const GEARBOX = fromRows(["....kk....kk....", "...kRRk..kRRk...", "..kRrRRkkRRrRk..", "..kRrrRkkRrrRk..", "...kRRRooRRRk...", ".kkkkkkRRkkkkkk.", "kWLLLLkRrkLLLLdk", "kLlLLLkRrkLLLldk", "kkkkkkkRrkkkkkkk", ".kBBpBkRrkBpBbk.", ".kBBBBkRrkBBbbk.", ".kBpBBkRrkBBpbk.", ".kBBBBkRrkBBbbk.", ".kBBBpkRrkpBbbk.", ".kbbbbkrrkbbbbk.", ".kkkkkkkkkkkkkk."]); // v2.38 장비 꾸러미(선물상자) 16칸 · 리본 매듭 · 물방울 무늬
  const GEARBOX_PAL = {"k": "#0b0a0e", "R": "#ffd34d", "r": "#b08020", "o": "#fff6c8", "W": "#ff9aa0", "L": "#e05060", "l": "#a83040", "d": "#6a1828", "B": "#c8404e", "b": "#7a1e2e", "p": "#ff8a90"};
  const IRONORE = fromRows(["...kkkk.....", "..kNnnnkk...", ".kNnTSnnnk..", "kNnSTsnunnk.", "knnsnnnnTSk.", "knunnTSnsnNk", "kNnnSsnnnNNk", ".kNNnnnuNNk.", "..kkNNNNkk..", "....kkkk...."]); // v2.32 철광석 다시
  const IRONORE_PAL = { k: '#0b0a0e', n: '#6a6470', N: '#45404c', S: '#a8b8c8', s: '#6a7a8c', T: '#e8f0f8', u: '#b06a3a' };

  const artCache = {};
  const art = (key, fn) => artCache[key] || (artCache[key] = fn());

  // --- 바닥에 찍기 -----------------------------------------------------
  function paintBlood(g, b) { const c = CAMP3.bloodPool(b.w, b.h, (Math.random() * 1e6) | 0); g.drawImage(c, (Math.round(b.x0) & ~1) - c.pad * 2, (Math.round(b.y0) & ~1) - c.pad * 2); } // v3.19 3장 피웅덩이
  function paintChasm(g, b) { gPaint(g, genChasm(Math.round(b.w / 2), Math.round(b.h / 2)), CHASM_PAL, b.x0 - 2, b.y0 - 2); }
  // 샘물 웅덩이 (손으로 그린 3가지 크기): 흙 둑, 가운데 솟는 물결, 돌·수련·갈대
  const SPRINGS = {
    springS: fromRows([".....kkkkkk.....", "...kkbbbbbbkk...", "..kbBBBBBBBBbk..", ".kBDDDDDDDDDDBk.", ".kDWWWWhhWWWWDk.", "kgWWWWhWWhWWWWkM", "kGgWWWWhhWWWwwkm", ".kdwwwwwwwwwwk..", "..kkwwwwwwwkk...", "....kkkkkkk....."]),
    springM: fromRows(["........kkkkkk........", ".....kkkbbbbbbkkk.....", "...kkbbBBBBBBBBbbkk...", "..kbBBDDDDDDDDDDBBbk..", ".kGBDDWWWWWWWWWWDDBk..", "kGgdDWWWWWhhhWWWWWDk.R", "kgdkWWWWWhWWWhWWWWWkRY", ".kmWWLlWWWhhhWWWWWwkR.", ".kMwLLWWWWWWWWWwwwwk..", "..kwwwwwwwwwwwwwwwkM..", "..kkwwwwwwwwwwwwwkkm..", "....kkkwwwwwwwkkk.....", ".......kkkkkkk........"]),
    springL: fromRows(["..........kkkkkkkk..........", ".......kkkbbbbbbbbkkk.......", "....kkkbbBBBBBBBBBBbbkkk....", "...kbbBBBDDDDDDDDDDBBBbbk...", "..kGgBDDDDWWWWWWWWDDDDBBk...", ".kGGgdDWWWWWWWWWWWWWWDDBk.RY", "kGggdkWWWWWWhhhhWWWWWWWDk.R.", "kgddkWWWWWWhWWWWhWWWWWWWkkR.", ".kkmWWLlWWWhWWWWhWWWGgWWWkk.", ".kMWWLLWWWWWhhhhWWWWdkWWWk..", "..kmwwwWWWWWWWWWWWWWWWwwwk..", "..kMwwwwwwwwWWWWWwwwwwwwkGgk", "...kkwwwwwwwwwwwwwwwwwkkgddk", ".....kkwwwwwwwwwwwwwkk.kkkk.", ".......kkkkkkkkkkkkk........"]),
  };
  function paintPool(g, b) {
    withSeed(b.seed, () => {
      if (b.pool === 'poolM') { const sp = SPRINGS[pick(['springM', 'springL'])], f = Math.random() < 0.5 ? sp.map(r => r.slice().reverse()) : sp; gPaint(g, f, POND_PAL, b.x - f[0].length, b.y - f.length + 2); return; }
      const wc = b.pool === 'poolL' ? 34 : 48, hc = b.pool === 'poolL' ? 18 : 26, style = pick(['clear', 'clear', 'rocky', 'swamp', b.pool === 'poolXL' ? 'island' : 'clear']);
      const gr = genPond(wc, hc, style, pick(['blob', 'blob', 'kidney'])), pal = Object.assign({}, POND_PAL, POND_PALS[style]);
      // 가운데 솟는 물결
      const cx = Math.round(gr[0].length / 2), cy = Math.round(gr.length / 2);
      if (style !== 'island') for (const [dx, dy] of [[-2, 0], [2, 0], [-1, -1], [0, -1], [1, -1], [-1, 1], [0, 1], [1, 1]]) if ('Ww'.includes(gAt(gr, cx + dx, cy + dy))) gr[cy + dy][cx + dx] = 'h';
      gPaint(g, gr, pal, b.x - gr[0].length, b.y - gr.length);
    });
  }
  function paintPond(g, b) {
    if (b.brook) return;
    if (b.pool) return paintPool(g, b);
    if (typeof RUIN1 !== 'undefined') { const c = RUIN1.reservoir(b.w, b.h, (Math.random() * 1e6) | 0); g.drawImage(c, (Math.round(b.x0) & ~1) - 12, (Math.round(b.y0) & ~1) - 12); return; } // v3.19 큰 연못 → 폐허 저수지 (작은 물웅덩이 M · L · XL은 그대로)
    const wc = Math.round(b.w / 2), hc = Math.round(b.h / 2), style = pick(wc >= 50 && hc >= 30 ? ['clear', 'clear', 'swamp', 'rocky', 'island', 'island'] : ['clear', 'swamp', 'rocky']), shape = pick(wc > hc * 1.6 ? ['blob', 'kidney', 'lobes'] : ['blob', 'blob', 'kidney']); gPaint(g, genPond(wc, hc, style, shape), Object.assign({}, POND_PAL, POND_PALS[style]), b.x0 - 6, b.y0 - 6); }
  // 텔레포터 마법진 (v0.62): 바깥 고리 · 룬 띠 · 안쪽 고리 · 육망성 · 가운데 원. 'a'=고리 'b'=별 'c'=룬 'o'=가운데
  const MC_W = 36, MC_H = 18;
  function genMagicCircle() {
    const g = mkGrid(MC_W, MC_H), cx = (MC_W - 1) / 2, cy = (MC_H - 1) / 2, RX = MC_W / 2 - 0.6, RY = MC_H / 2 - 0.6;
    for (let y = 0; y < MC_H; y++) for (let x = 0; x < MC_W; x++) {
      const e = Math.hypot((x - cx) / RX, (y - cy) / RY);
      if (e <= 1 && e > 0.88) g[y][x] = 'a';
      else if (e <= 0.68 && e > 0.58) g[y][x] = 'a';
      else if (e <= 0.18) g[y][x] = 'o';
    }
    const line = (x0, y0, x1, y1) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); if (g[y] && g[y][x] === '.') g[y][x] = 'b'; } };
    for (const off of [-Math.PI / 2, Math.PI / 2]) { const v = [0, 1, 2].map(i => ({ x: cx + Math.cos(off + i * TAU / 3) * RX * 0.58, y: cy + Math.sin(off + i * TAU / 3) * RY * 0.58 })); for (let i = 0; i < 3; i++) line(v[i].x, v[i].y, v[(i + 1) % 3].x, v[(i + 1) % 3].y); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, x = Math.round(cx + Math.cos(a) * RX * 0.78), y = Math.round(cy + Math.sin(a) * RY * 0.78); if (g[y]) { g[y][x] = 'c'; if (i % 2 === 0 && g[y][x + 1] === '.') g[y][x + 1] = 'c'; } }
    return g;
  }
  function paintTelePad(g, p) { // 바닥에 새겨진 마법진 (꺼진 상태)
    const mc = genMagicCircle().map(r => r.map(c => c === '.' ? '.' : c === 'a' || c === 'o' ? 'K' : c === 'c' ? 'r' : 'D'));
    gPaint(g, mc, Object.assign({}, TELE_PAL, { K: '#121019', D: '#1c1a26', r: '#2a3450' }), p.x - MC_W, p.y - MC_H);
  }
  // 켜진 마법진: 고리·별·룬이 빛나고 룬 점이 고리를 따라 돈다
  function drawMagicCircle(p) {
    const on = 0.65 + 0.35 * Math.sin(time * 3.2), x0 = (Math.round(p.x) - MC_W) & ~1, y0 = (Math.round(p.y) - MC_H) & ~1;
    const glow = art('mcGlow', () => gCanvas(genMagicCircle(), { a: '#9fd2ff', b: '#6fa8ff', c: '#e8f6ff', o: '#bfe2ff' }));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45 + 0.35 * on; ctx.drawImage(glow, x0, y0);
    ctx.globalAlpha = 1;
    const cx = p.x, cy = p.y - 1;
    for (let i = 0; i < 10; i++) { const a = time * 0.9 + i / 10 * TAU; ctx.fillStyle = i % 2 ? 'rgba(220,240,255,.95)' : 'rgba(140,190,255,.9)'; ctx.fillRect((Math.round(cx + Math.cos(a) * (MC_W - 2)) & ~1), (Math.round(cy + Math.sin(a) * (MC_H - 1)) & ~1), 2, 2); }
    for (let i = 0; i < 6; i++) { const a = -time * 1.6 + i / 6 * TAU; ctx.fillStyle = 'rgba(200,230,255,.8)'; ctx.fillRect((Math.round(cx + Math.cos(a) * MC_W * 0.36) & ~1), (Math.round(cy + Math.sin(a) * MC_H * 0.36) & ~1), 2, 2); }
    ctx.restore();
  }
  // 빛기둥: 마법진에서 위로 솟는 디더링 빛 + 오르내리는 밝은 띠 (엔티티 위에 더한다)
  function drawExit(p) { // v1.01 다음 스테이지 출구: 텔레포터(푸른색)와 구분되는 핏빛·금빛 마법진
    const on = 0.65 + 0.35 * Math.sin(time * 3.6), x0 = (Math.round(p.x) - MC_W) & ~1, y0 = (Math.round(p.y) - MC_H) & ~1;
    const glow = art('mcGlowExit', () => gCanvas(genMagicCircle(), { a: '#ffb060', b: '#d0402a', c: '#fff0c0', o: '#ffd080' }));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.4 * on; ctx.drawImage(glow, x0, y0); ctx.globalAlpha = 1;
    for (let i = 0; i < 12; i++) { const a = -time * 1.1 + i / 12 * TAU; ctx.fillStyle = i % 3 ? 'rgba(255,120,60,.9)' : 'rgba(255,230,160,.95)'; ctx.fillRect(Math.round(p.x + Math.cos(a) * (MC_W - 2)) & ~1, Math.round(p.y - 1 + Math.sin(a) * (MC_H - 1)) & ~1, 2, 2); }
    ctx.restore();
  }
  const RGBAQ = new Map(); const rgbaQ = (c, a) => { const q = Math.round(a * 40), k = c + q; let v = RGBAQ.get(k); if (!v) { v = `rgba(${c},${q / 40})`; RGBAQ.set(k, v); } return v; }; // v1.78 색 문자열 캐시 (알파 1/40 단위)
  function drawExitPillar() {
    const R = G.dun && G.dun.cur; if (!R || !R.exit) return;
    const p = R.exit, H0 = 150, w0 = 44, pulse = 0.8 + 0.2 * Math.sin(time * 5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let y = 0; y < H0; y += 2) { const k = 1 - y / H0, hw = Math.round((w0 / 2) * (0.5 + 0.5 * k) + Math.sin(time * 7 + y * 0.25)) & ~1;
      for (let x = -hw; x < hw; x += 2) { const edge = Math.abs(x + 1) / hw, lv = Math.min(1, (0.35 + k) * (1 - edge * 0.7) * pulse); if (!dith((x + 64) >> 1, (y + Math.floor(time * 26)) >> 1, lv)) continue;
        ctx.fillStyle = edge < 0.35 ? rgbaQ('255,236,190', 0.25 + 0.6 * k) : rgbaQ('230,70,40', 0.25 + 0.5 * k); ctx.fillRect((Math.round(p.x) + x) & ~1, (Math.round(p.y - 2) - y) & ~1, 2, 2); } }
    for (let i = 0; i < 3; i++) { const yy = (time * 60 + i * H0 / 3) % H0; ctx.fillStyle = `rgba(255,220,160,${0.55 * (1 - yy / H0)})`; ctx.fillRect((Math.round(p.x) - 10) & ~1, Math.round(p.y - 2 - yy) & ~1, 20, 2); }
    ctx.restore();
    if (Math.random() < 0.7) G.parts.push({ x: p.x + rand(-16, 16), y: p.y - rand(0, 8), vx: rand(-5, 5), vy: -rand(50, 110), t: rand(0.5, 1.0), c: pick(['#ffb060', '#ff6a3a', '#fff0c0']), g: 0, glow: true });
  }
  function drawTelePillar() {
    const R = G.dun && G.dun.cur; if (!R || !R.tele || !R.cleared) return;
    const p = R.tele, H0 = 120, w0 = 40, pulse = 0.8 + 0.2 * Math.sin(time * 4.2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const L = pxLayer((Math.round(p.x) - w0 / 2 - 4) & ~1, (Math.round(p.y - 2) - H0 - 2) & ~1, w0 + 10, H0 + 6, true); // v1.17 한 장으로
    for (let y = 0; y < H0; y += 2) {
      const k = 1 - y / H0, hw = Math.round((w0 / 2) * (0.55 + 0.45 * k) + Math.sin(time * 6 + y * 0.2)) & ~1;
      for (let x = -hw; x < hw; x += 2) {
        const edge = Math.abs(x + 1) / hw, lv = Math.min(1, (0.35 + k) * (1 - edge * 0.7) * pulse);
        if (!dith((x + 64) >> 1, (y + Math.floor(time * 20)) >> 1, lv)) continue;
        if (edge < 0.35) L.rect((Math.round(p.x) + x) & ~1, (Math.round(p.y - 2) - y) & ~1, 2, 2, 225, 242, 255, 0.25 + 0.6 * k);
        else L.rect((Math.round(p.x) + x) & ~1, (Math.round(p.y - 2) - y) & ~1, 2, 2, 110, 170, 255, 0.2 + 0.5 * k);
      }
    }
    L.flush();
    for (let i = 0; i < 2; i++) { const yy = ((time * 50 + i * H0 / 2) % H0); ctx.fillStyle = `rgba(230,245,255,${0.5 * (1 - yy / H0)})`; ctx.fillRect((Math.round(p.x) - 8) & ~1, (Math.round(p.y - 2 - yy)) & ~1, 16, 2); }
    ctx.restore();
    if (Math.random() < 0.6) G.parts.push({ x: p.x + rand(-14, 14), y: p.y - rand(0, 8), vx: rand(-4, 4), vy: -rand(40, 90), t: rand(0.5, 1.0), c: pick(['#bfe2ff', '#9fd2ff', '#ffffff']), g: 0, glow: true });
  }
  // v2.21 2~4장 좌우 문: 벽을 뚫고 밖으로 이어지는 통로 (위 벽면·바닥 타일·아래 벽 윗면 + 문턱 계단, 밖으로 갈수록 어둠)
  function genSideGate(d, wood) {
    const wc = 40, hc = 28, g = mkGrid(wc, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const dist = d === 'w' ? wc - 1 - x : x; let c;
      if (y <= 3) { // 위쪽 벽면
        c = y === 0 ? 'h' : wood ? ((dist % 4 === 0) ? 'D' : dist % 4 === 1 ? 'h' : 'l') : (((dist + (y % 2) * 3) % 6 === 0) ? 'D' : y === 1 ? 'l' : 'd');
      } else if (y === 4) c = 'D'; // 벽 그늘
      else if (y <= 23) { // 바닥
        const r = y - 5, off = (Math.floor(r / 5) % 2) * 3;
        c = wood ? ((dist % 5 === 4) ? 'D' : r % 7 === 0 ? 'l' : 'd') : (r % 5 === 4 || (dist + off) % 6 === 5) ? 'D' : r % 5 === 0 ? 'l' : 'd';
        if (dist <= 1) c = dist === 0 ? 'h' : 'l'; // 문턱 돌
        else if (dist === 8 || dist === 16) c = wood ? 'l' : 'h'; else if (dist === 9 || dist === 17) c = 'D'; // 내려가는 계단 두 단
      } else c = y === 24 ? 'h' : y === 25 ? 'l' : 'D'; // 아래 벽 윗면
      const t = dist / wc, lv = clamp((t - 0.12) / 0.7, 0, 1);
      if (dith(x, y, lv)) c = 'K'; else if (lv > 0.55 && c !== 'K') c = 'D';
      g[y][x] = c;
    }
    return g;
  }
  function paintDoorCastle(g, d) {
    const p = DOOR[d];
    if (d === 'n') { gPaint(g, genArch(), STONE, p.x - 27, p.y - 70); return; }
    if (d === 's') { gPaint(g, genFloorExit(20, 36, 's'), STONE, p.x - 20, p.y); gPaint(g, genDoorPost(14), STONE, p.x - 30, p.y - 2); gPaint(g, genDoorPost(14), STONE, p.x + 20, p.y - 2); return; }
    gPaint(g, genSideGate(d, false), STONE, d === 'w' ? p.x - 80 : p.x, p.y - 28); // v2.21
  }
  function paintMeadowDoorPaths(g, R) {
    const curve = (d) => {
      const p = DOOR[d], ph = rand(0, 6);
      for (let t = 0; t < 150; t += 2) {
        const c = Math.round(((d === 's' ? p.x : p.y) + Math.sin(t * 0.05 + ph) * 5) / 2) * 2, hw = 10 - Math.floor(t / 50) * 2 + (Math.random() < 0.3 ? 2 : 0);
        const span = Math.ceil(hw * 1.4 / 2) * 2;
        for (let o = -span; o <= span; o += 2) {
          const x = (d === 's' ? c + o : d === 'w' ? p.x - t : p.x + t) & ~1, y = (d === 's' ? p.y - 14 + t : c + o) & ~1;
          if (t < 20 && dith(x >> 1, y >> 1, 1 - (t + 4) / 24)) continue; // 벽선에서 시작하는 부분은 성기게
          const col = dirtCol(o, hw, x, y); if (col) { g.fillStyle = col; g.fillRect(x, y, 2, 2); }
        }
      }
    };
    for (const d of ['s', 'w', 'e']) if (R.doors[d] != null && !(R.crack && R.crack.dir === d && !R.crack.broken)) curve(d);
  }
  function paintDoorMeadow(g, d) {
    const p = DOOR[d];
    const bushes = (pts) => { for (const [x, y, f] of pts) stamp(g, DECO_MAPS.bush, Object.assign({}, DECO, { m: '#1e3a18', M: '#2e5222', r: '#8a2030' }), Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, f); };
    if (d === 'n') {
      // 나무 사이로 뚫린 잎 터널: 아치 모양 그늘 + 바닥 흙길, 가장자리는 잎 뭉치
      const W0 = 30, H0 = 40, cx = 14.5, top = 13, gg = mkGrid(W0, H0);
      const inShape = (x, y) => y >= top ? x >= 4 && x <= 25 : Math.hypot(x - cx, y - top) <= 10.5;
      const path = genPath(W0, H0, true, 'n');
      for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
        if (inShape(x, y)) { const t = y / H0; if (y > H0 - 8 && !dith(x, y, (H0 - 1 - y) / 8)) continue; gg[y][x] = dith(x, y, clamp((0.85 - t) / 0.35, 0, 1)) ? 'K' : 'q'; }
        else if (inShape(x - 2, y) || inShape(x + 2, y) || inShape(x, y + 2) || inShape(x - 1, y + 1) || inShape(x + 1, y + 1)) { if (y < H0 - 1) gg[y][x] = shade4(x - cx, y - top, 12, 0.35); }
      }
      for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) if (gg[y][x] === '.' && y > H0 - 9 && x > 5 && x < 24) gg[y][x] = '_'; // 아래쪽 디더링 빈칸은 외곽선을 두르지 않음
      const og = gOutline(gg).map(r => r.map(c => c === '_' ? '.' : c));
      if (false) gPaint(g, og, Object.assign({ q: '#1a2a14', K: '#050905', k: '#07100a' }, PATH_PAL, { h: TREE_PAL.green.h, l: TREE_PAL.green.l, d: TREE_PAL.green.d, D: TREE_PAL.green.D }), p.x - 30, p.y - 78); /* v2.21 사용자 결정: 초록 잎 터널(아치) 없앰 — 불기둥 + 울타리로 문 표시 */
      // 터널 안 어둠에서 시작해 문턱 아래 풀밭으로 흐려지는 흙길
      const ph = rand(0, 6), B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (let y = (p.y - 58) & ~1; false && y < p.y + 30; y += 2) { /* v2.21 북문 바깥 흙길 없앰 */
        const c = Math.round((p.x + Math.sin(y * 0.06 + ph) * 3) / 2) * 2, f = Math.min(1, (y - (p.y - 60)) / 34, (p.y + 30 - y) / 26), hw = Math.round((4 + 6 * clamp((y - (p.y - 50)) / 60, 0, 1)) / 2) * 2;
        for (let o = -14; o <= 14; o += 2) {
          const x = c + o; if (y < p.y - 2 && Math.abs(x - p.x) > 18) continue;
          if (!((0.15 + f * 1.1) * 16 > B4[((y >> 1) & 3) * 4 + ((x >> 1) & 3)])) continue;
          const col = dirtCol(o, hw, x, y); if (col) { g.fillStyle = y < p.y ? mixHex(col, '#050905', clamp((p.y - y) / 60, 0, 0.75)) : col; g.fillRect(x, y, 2, 2); }
        }
      }
    }
  }

  // --- 장애물 스프라이트 ------------------------------------------------
  const fencedPit = b => Math.min(b.w, b.h) >= 56; // v3.19 2장 벽: 덩어리는 울타리 낭떠러지, 폭 56px 미만은 쇠 창살 벽
  function makeObsSprites(R) {
    const out = [];
    withSeed(R.seed ^ 0x5bd1, () => {
      for (const b of R.obs) {
        if (b.t === 'pit' && !b.c && G.stage === 4 && typeof TOWN4 !== 'undefined') { const c = TOWN4.scorch(b.w, b.h, (Math.random() * 1e6) | 0); out.push({ cv: c, x: (Math.round(b.x0) & ~1) - c.pad * 2, y: (Math.round(b.y0) & ~1) - c.pad * 2, sy: -1e5, raw: true }); continue; } // v3.19 4장 불탄 자리 (웅덩이 자리 · 바닥 바로 위에 깔림)
        if (b.t === 'pit' || b.t === 'prop' || b.t === 'drum') continue;
        if (G.stage === 3) continue;
        if (G.stage === 1) {
          if (b.t === 'pillar') {
            const kind = pick(['round', 'round', 'pine']); // v3.19 흰 줄기 작은 나무(자작나무) 삭제
            if (kind === 'round' && typeof RUIN1 !== 'undefined') { const c = RUIN1.tree(pick(['green', 'green', 'deep', 'autumn', 'dusk']), (Math.random() * 1e6) | 0); out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 10) & ~1, sy: b.y }); continue; } // v3.19 둥근 나무: 잎 뭉치 · 줄기 결 · 뿌리 (29_ruin1.js)
            const map = genTree(kind), pal = Object.assign({}, TRUNK, TREE_PAL[kind === 'pine' ? 'deep' : kind === 'birch' ? 'birch' : pick(['green', 'green', 'deep', 'autumn', 'dusk'])]);
            const w = map[0].length * 2, h = map.length * 2, [c, g] = mkCanvas(w + 8, h + 6);
            dshRect(g, 6, h, w - 4, 2, 0.5); dshRect(g, 10, h + 2, w - 12, 2, 0.3);
            stamp(g, map, pal, 4, 0, 2, Math.random() < 0.5);
            if (typeof RUIN1 !== 'undefined') { out.push({ cv: RUIN1.withShadow(c), x: (Math.round(b.x - w / 2 - 4) & ~1) - 8, y: (Math.round(b.y - h + 2) & ~1) - 8, sy: b.y }); continue; } // v3.19 전나무 · 자작나무: 납작 띠 → 붙은 그림자
            out.push({ cv: c, x: Math.round(b.x - w / 2 - 4) & ~1, y: Math.round(b.y - h + 2) & ~1, sy: b.y });
          } else if (b.t === 'rock') {
            if (typeof RUIN1 !== 'undefined') { // v3.19 폐허에서 떨어져 나온 돌 — 연달아 나오지 않게: 260px 안에 이미 있거나 방에 둘이 있으면 이끼 바위로
              const sd = (Math.random() * 1e6) | 0, ruin = out.filter(o => o.ruin).length < 2 && !out.some(o => o.ruin && Math.hypot(o.rx - b.x, o.ry - b.y) < 260), c = ruin ? (b.r > 17 ? RUIN1.chunkL(sd) : RUIN1.chunkS(sd)) : RUIN1.boulder(b.r, sd);
              out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 14) & ~1, sy: b.y, ruin, rx: b.x, ry: b.y }); continue; }
          } else {
            if (typeof RUIN1 !== 'undefined') { const c = RUIN1.ruinBlock(b.w, b.h, (Math.random() * 1e6) | 0); out.push({ cv: c, x: (Math.round(b.x0) & ~1) - 12, y: (Math.round(b.y0 - c.HH * 2) & ~1) - 12, sy: b.y1 }); continue; } // v3.19 산울타리 → 이끼 낀 폐허 돌담 · 한 면이 열린 폐허
            const { g, HH } = genHedge(Math.round(b.w / 2), Math.round(b.h / 2));
            out.push({ cv: gCanvas(g, LEAF), x: Math.round(b.x0 - 4) & ~1, y: Math.round(b.y0 - HH * 2 - 4) & ~1, sy: b.y1 });
          }
        } else if (G.stage === 4) { const n0 = out.length; // v1.23 왕도: 녹아내린 왕의 동상 · 부서진 기둥 / 깨진 종 · 잔해 / 마차 · 무너진 성벽, 모두 위에 재
          if (b.t === 'pillar') {
            const king = Math.random() < 0.35 && false /* v2.82 녹아내린 왕 동상 삭제 (사용자 결정) — 부서진 기둥만 */, lp = !king, c = king ? gCanvas(genMeltKing(), KING4) : ASH4.lamp() /* v2.89 녹아내린 가로등 (v3.20 옛 기둥 genPillar 삭제) */;
            out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 6) & ~1, sy: b.y, raw: king || lp });
          } else if (b.t === 'rock') {
            const bell = b.r >= 10 && Math.random() < 0.55, jk = !bell, c = bell ? gCanvas(genBell(b.r), BELL4) : ASH4.junk(b); // v2.87 4장 고유: 짐 더미 · 우물 · 무구 더미
            out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 6) & ~1, sy: b.y, raw: bell || jk });
          } else {
            const wc = Math.round(b.w / 2), hc = Math.round(b.h / 2);
            const hs = typeof HOUSE4 !== 'undefined' && wc >= 24 && hc >= 8 /* v2.88 불탄 집 — 폭이 모자라면 성벽 덩어리 */, { g, HH } = hs ? (HOUSE4.genRow || HOUSE4.gen)(wc, hc) /* v3.19 길면 모양이 다른 집 여러 채 + 보도블록 단 + 가로등 */ : genWallBlock(wc, hc);
            out.push({ cv: hs ? gCanvas(g, HOUSE4.pal) : gCanvas(ashCap(g, hc), STONE4), x: Math.round(b.x0 - 2) & ~1, y: Math.round(b.y0 - HH * 2 - 2) & ~1, sy: b.y1, raw: hs });
          }
          if (typeof RUIN1 !== 'undefined') for (let i = n0; i < out.length; i++) { const o = out[i]; o.cv = RUIN1.withShadow(o.cv); o.x -= 8; o.y -= 8; } // v3.19 4장도 밑동에 붙은 그림자
        } else {
          if (G.stage === 2 && typeof KEEP2 !== 'undefined') { // v3.19 2장: 새 돌기둥 · 돌무더기 · 석벽 덩어리 → 쇠 울타리를 두른 낭떠러지 (가늘고 긴 벽은 쇠 창살 벽)
            const sd = (Math.random() * 1e6) | 0;
            if (b.t === 'pillar') { const c = KEEP2.pillar(Math.random() < 0.35, sd); out.push({ cv: c, x: Math.round(b.x - 31) & ~1, y: Math.round(b.y - c.height + 14) & ~1, sy: b.y }); }
            else if (b.t === 'rock') { const c = KEEP2.rubble(b.r, sd); out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 14) & ~1, sy: b.y }); }
            else { const c = fencedPit(b) ? KEEP2.fence(b.w, b.h, sd) : KEEP2.fenceWall(b.w, b.h, sd); out.push({ cv: c, x: (Math.round(b.x0) & ~1) - 8, y: (Math.round(b.y0) & ~1) - c.FH * 2 - 8, sy: b.y1 }); }
            continue;
          }
          if (b.t !== 'pillar' && b.t !== 'rock') {
            const { g, HH } = genWallBlock(Math.round(b.w / 2), Math.round(b.h / 2));
            out.push({ cv: gCanvas(g, STONE), x: Math.round(b.x0 - 2) & ~1, y: Math.round(b.y0 - HH * 2 - 2) & ~1, sy: b.y1 });
          }
        }
      }
      if (G.stage === 3) makeOrcObsSprites(R, out);
    });
    if (G.stage === 4) for (const o of out) if (!o.raw) o.cv = ashify(o.cv);
    return out;
  }

  // --- 동적: 잠긴 문 · 금 간 벽 · 텔레포터 · 상자 · 상인 -----------------
  function drawRoomBack() {
    const R = G.dun.cur;
    const sa0 = G.sealAnim || 0;
    G.sealAnim = Math.min(1, (G.sealAnim || 0) + (G.sealed ? 1 : -1) * 0.08);
    if (!G.sealed && G.sealAnim < 0) G.sealAnim = 0;
    if (sa0 < 1 && G.sealAnim >= 1 && G.stage >= 2) { sfx('block'); addShake(2); for (const d of ['w', 'e']) if (R.doors[d] != null && !hiddenDoor(R, d)) { const q = doorIn(d, 2); dust(q.x, q.y, 10); for (let i = 0; i < 6; i++) G.parts.push({ x: q.x, y: q.y + rand(-4, 4), vx: rand(-60, 60), vy: rand(-80, -20), t: rand(0.2, 0.4), c: pick(['#ffd080', '#ffffff', '#ff9a40']), g: 300, glow: true }); } } // v2.21 문짝이 맞물리는 순간
    for (const d in DIRS) {
      const st = doorState(R, d); if (st === 'none') continue;
      if (st === 'crack') drawCrack(R, d);
      else if (G.stage >= 2 && (d === 'w' || d === 'e')) drawSideLeaves(d, st === 'boss' ? gateK() : G.sealAnim); // v2.21 좌우 문은 문짝이 여닫힘
      else if (st === 'boss') drawSeal(d, gateK());
      else if (G.sealAnim > 0) drawSeal(d, G.sealAnim);
      if (R.doors[d] != null && G.dun.rooms[R.doors[d]].type === 'boss' && st !== 'crack') drawBossSigil(d, st === 'boss');
    }
    if (R.tele && R.cleared) drawMagicCircle(R.tele);
    if (R.exit) drawExit(R.exit);
    drawAshClouds();
  }
  // v2.21 2~4장 좌우 문: 경첩 달린 두 짝 문 — 열려 있으면 통로 벽에 붙어 바깥을 향하고, 봉쇄되면 안쪽으로 닫혀 가운데서 맞물린다 (k: 0 열림 → 1 닫힘)
  const LEAF_PAL = { 4: { k: '#0b0a09', h: '#5a4232', l: '#3e2e22', d: '#241a12', b: '#3a3940', B: '#7c7a84' } /* v2.90 4장 탄 문짝 */, 2: { k: '#0b0a0e', h: '#7a5a3a', l: '#5a3e26', d: '#3e2a18', b: '#4a4656', B: '#8a8498' }, 3: { k: '#0b0806', h: '#9a6a40', l: '#7a5030', d: '#553620', b: '#3a2a1a', B: '#c8a070' } };
  function drawSideLeaves(d, k) {
    const p = DOOR[d], pal = LEAF_PAL[G.stage === 3 ? 3 : G.stage === 4 ? 4 : 2], e = k * k * (3 - 2 * k), out = d === 'w' ? Math.PI : 0, one = G.stage !== 3, L = one ? 19 : 10; // 2·4장은 외짝 문(21칸, 위 경첩) · 3장은 두 짝(11칸씩)
    for (const s of one ? [-1] : [-1, 1]) { // 위 짝(s=-1) · 아래 짝(s=1)
      const hx = p.x, hy = p.y + s * 18, closed = s < 0 ? Math.PI / 2 : -Math.PI / 2, a = out + (((closed - out + Math.PI * 3) % TAU) - Math.PI) * e;
      const ca = Math.cos(a), sa = Math.sin(a), cells = new Map();
      for (let i = 0; i < L; i++) for (let j = -1; j <= 2; j++) {
        const cx = Math.round((hx + ca * i * 2 - sa * j * 2) / 2), cy = Math.round((hy + sa * i * 2 + ca * j * 2) / 2);
        cells.set(cx + ',' + cy, i % 4 === 1 ? (j === -1 ? 'B' : 'b') : j === -1 ? 'h' : j === 2 ? 'd' : (i + j) % 5 === 0 ? 'd' : 'l');
      }
      ctx.fillStyle = pal.k;
      for (const key of cells.keys()) { const [x, y] = key.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!cells.has((x + dx) + ',' + (y + dy))) ctx.fillRect((x + dx) * 2, (y + dy) * 2, 2, 2); }
      for (const [key, c] of cells) { const [x, y] = key.split(',').map(Number); ctx.fillStyle = pal[c]; ctx.fillRect(x * 2, y * 2, 2, 2); }
      // 경첩 축: 문짝이 도는 쇠 기둥 (위에서 본 둥근 머리 + 아래로 보이는 몸통)
      const ax = (Math.round(hx / 2) - 2) * 2, ay = (Math.round(hy / 2) - 3) * 2;
      const AX = ['.kkk.', 'kWBbk', 'kBBbk', 'kbbdk', 'kbbdk', 'kbbdk', '.kkk.'], AP = { k: pal.k, W: '#e8e4f0', B: pal.B, b: pal.b, d: '#1a1820' };
      AX.forEach((r, yy) => { for (let xx = 0; xx < 5; xx++) { const c = AP[r[xx]]; if (c && r[xx] !== '.') { ctx.fillStyle = c; ctx.fillRect(ax + xx * 2, ay + yy * 2, 2, 2); } } });
    }
  }
  // 봉쇄: 성채는 쇠창살이 내려오고, 초원은 가시덤불이 자라난다 (k: 0→1)
  function drawSeal(d, k) {
    const p = DOOR[d], meadow = G.stage === 1, vert = d === 'n' || d === 's';
    const key = (meadow ? 'th' : 'bar' + G.stage) + d;
    const spr = art(key, () => withSeed(d.charCodeAt(0) * 99, () => meadow
      ? gCanvas(vert ? genThorns(22, d === 'n' ? 18 : 16, true) : genThorns(18, 24, false), THORN_PAL)
      : gCanvas(vert ? genBars(19, d === 'n' ? 28 : 16, true) : genBars(17, 21, false), G.stage === 3 ? WOOD_BAR : BAR_PAL)));
    const W0 = spr.width, H0 = spr.height;
    let x = vert ? p.x - W0 / 2 : d === 'w' ? p.x - W0 + 4 : p.x - 4, y = d === 'n' ? p.y - H0 + 2 : d === 's' ? p.y - 6 : p.y - H0 / 2;
    x = Math.round(x) & ~1; y = Math.round(y) & ~1;
    if (meadow) { // 문 가장자리에서 가운데로 자라난다
      const sw = Math.round(W0 * k / 2) & ~1, sh = Math.round(H0 * k / 2) & ~1;
      if (vert) { ctx.drawImage(spr, 0, 0, sw, H0, x, y, sw, H0); ctx.drawImage(spr, W0 - sw, 0, sw, H0, x + W0 - sw, y, sw, H0); }
      else { ctx.drawImage(spr, 0, 0, W0, sh, x, y, W0, sh); ctx.drawImage(spr, 0, H0 - sh, W0, sh, x, y + H0 - sh, W0, sh); }
    } else { // 위에서 떨어진다
      const sh = Math.round(H0 * k) & ~1;
      if (sh > 0) ctx.drawImage(spr, 0, H0 - sh, W0, sh, x, y, W0, sh);
    }
  }
  function drawBossSigil(d, locked) {
    const q = d === 'n' ? { x: DOOR.n.x, y: DOOR.n.y - 84 } : doorIn(d, -18);
    const spr = art('sigil', () => gCanvas(SIGIL, SIGIL_PAL)), glow = art('sigilG', () => gCanvas(SIGIL.map(r => r.map(c => c === 'K' || c === 'R' ? c : '.')), { K: '#ffb0b0', R: '#ff4050' }));
    const x = Math.round(q.x - spr.width / 2) & ~1, y = Math.round(q.y - spr.height / 2) & ~1;
    ctx.drawImage(spr, x, y);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = locked ? 0.25 + 0.25 * Math.sin(time * 3) : 0.7; ctx.drawImage(glow, x, y); ctx.restore();
    if (locked) { const t = `${SK().unit} ${sealPlaced()}/2`; ctx.font = '8px Galmuri7'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; fillTextW(t, q.x + 1, q.y + 19); ctx.fillStyle = '#ff8080'; fillTextW(t, q.x, q.y + 18); }
  }
  // ================================================================ v1.18 보스 문 봉인 기믹
  // 엘리트를 쓰러뜨리면 「봉인 열쇠」가 떨어진다. 주워서 보스 방 앞 받침 2곳에 바치면(F) 챕터마다 다른 연출로 문이 열린다.
  // 1장 빛바랜 초원: 정령의 불씨 → 화톳대에 초록 불 → 가시덤불이 타서 걷힘
  // 2장 무너진 성채: 기사단 인장 조각 → 문장 받침에 반쪽씩 → 방패가 맞물리면 쇠사슬이 끊기고 창살이 오름
  // 3장 핏빛 엄니 부락: 전사의 엄니 → 해골 토템에 걸면 눈이 붉게 타오름 → 뿔나팔·북소리와 함께 통나무 문이 올라감
  const SEAL = {
    1: { key: '정령의 불씨', unit: '불씨', sockN: '화톳대', act: '정령의 불씨 붙이기', need: '불씨가 없다 · 우두머리의 굴로 향해야 한다', c: '#c8f070', rgb: '190,240,110',
      intro: '두 우두머리가 쥔 정령의 불씨로 보스 방 앞 가시덤불을 태워야 한다', drop: '정령의 불씨를 얻었다 · 보스 방 앞 화톳대로',
      put: '화톳대에 초록 불이 붙었다', open: ['가시덤불이 재로 사그라졌다', '점액왕의 둥지로 가는 길이 열렸다'] },
    2: { key: '기사단 인장 조각', unit: '인장', sockN: '문장 받침', act: '인장 조각 끼우기', need: '인장 조각이 없다 · 처형장을 지나야 한다', c: '#ffd070', rgb: '255,205,110',
      intro: '두 처형장에 나뉜 기사단 인장을 맞춰야 문이 열린다', drop: '기사단 인장 조각을 거두었다 · 보스 방 앞 받침으로',
      put: '인장 조각이 받침에 끼워졌다', put2: '두 조각이 하나의 문장으로 맞물렸다', open: ['기사단의 인장이 제자리를 찾았다', '녹슨 쇠사슬이 끊어지며 창살이 오른다'] },
    3: { key: '전사의 엄니', unit: '엄니', sockN: '해골 토템', act: '엄니 바치기', need: '바칠 엄니가 없다 · 결투장을 거쳐야 한다', c: '#ff8a60', rgb: '255,110,70',
      intro: '결투장 두 곳의 엄니를 해골 토템에 바쳐야 한다', drop: '전사의 엄니를 거두었다 · 보스 방 앞 토템으로',
      put: '해골 토템의 빈 눈구멍에 불이 붙었다', open: ['토템이 피를 마셨다', '낮은 뿔나팔 소리와 함께 투기장 문이 오른다'] },
  };
  SEAL[4] = { key: '붉은 보석', unit: '보석', sockN: '보석 홈', act: '보석 끼우기', need: '끼울 보석이 없다 · 알현실로 향해야 한다', c: '#ff8090', rgb: '255,120,140',
    intro: '알현실 두 곳에서 붉은 보석을 거두어 보스 방 앞 홈에 끼워야 문이 열린다', drop: '붉은 보석을 거두었다 · 보스 방 앞 홈으로',
    put: '보석이 홈에 박혔다', open: ['왕이 눈을 떴다', '대관식의 문이 천천히 열린다'] }; // v2.55 왕관과 상관없이 돌기둥의 홈에 보석을 끼운다
  const SK = () => SEAL[G && G.stage] || SEAL[1];
  const SST = () => G.stage; // v2.55 4장은 문 양옆 돌기둥의 보석 홈 (성채 받침 그림을 빌리던 것 대체)
  const sealPlaced = () => (G.dun && G.dun.sock ? G.dun.sock.filter(Boolean).length : 0);
  // v2.51 보스 문 열쇠 패널 (미니맵 아래): 칸 2개 — 빈 칸(못 얻음) · 열쇠(가지고 있음) · 금 테두리(받침에 설치함)
  const SKEY_URL = {};
  function skeyURL() { const st = SST() in SKEY_ART ? SST() : 1; return SKEY_URL[st] || (SKEY_URL[st] = gCanvas(fromRows(SKEY_ART[st][0]), SKEY_PAL[st]).toDataURL()); }
  let bkTop = 160, bkTopAt = 0;
  function updateBossKeys() {
    const el = $('bkPanel'); if (!el) return; const D = G && G.dun, R = D && D.cur;
    const show = !!(D && !D.forge && !D.home && !D.bossOpen && R && R.type !== 'boss' && mode !== 'map' && mode !== 'wmap' && $('phase').style.display !== 'none');
    if (!show) { if (el.style.display !== 'none') el.style.display = 'none'; hudPrev.bk = ''; return; }
    if (!(bkTopAt > performance.now())) { const pe = $('party'); bkTop = pe ? pe.offsetTop + pe.offsetHeight + 6 : 160; bkTopAt = performance.now() + 500; } /* v3.83 패널 위치는 0.5초마다만 잼 (매 프레임 재면 레이아웃을 다시 계산함) */
    const put = sealPlaced(), held = D.keys || 0, top = bkTop, // v2.53 왼쪽 캐릭터·빛 패널 바로 아래
       key = `${G.stage}|${put}|${held}|${top}`;
    if (el.style.display === 'none') el.style.display = '';
    if (key === hudPrev.bk) return; hudPrev.bk = key; el.style.top = top + 'px';
    const u = skeyURL(), K = SK(); el.dataset.name = K.key; el.dataset.tip = `${K.key} 2개를 보스 문 앞 ${K.sockN}에 바치면 보스 방이 열립니다. 정예 몬스터가 지키는 방에서 얻을 수 있습니다.`;
    const mir = SST() === 2; // 인장 조각은 오른쪽 칸을 뒤집어 좌우 대칭
    el.innerHTML = `<span class="lb">${K.key}</span>` + [0, 1].map(i => { const st = i < put ? 'put' : i < put + held ? 'on' : 'off'; return `<span class="kslot ${st}${mir ? (i === 1 ? ' mir' : ' mirL') : ''}">${st === 'off' ? '' : `<img src="${u}" alt="">`}</span>`; }).join(''); // 못 얻은 칸은 비워 둠
  }
  function sealHud() { const D = G.dun; if (!D || D.forge || D.home) return ''; const K = SK(); return D.bossOpen ? '보스 방 열림' : `${K.unit} ${sealPlaced()}/2${D.keys ? ` (+${D.keys})` : ''}`; }
  // 보스 문 양옆 받침 2곳: 문이 난 벽에 붙여 세운다 (몸이 걸리지 않는 장식 — 바닥 장애물과 별개)
  function sealSocks(R) {
    const D = G.dun; if (!D || D.forge || D.home || !R.doors) return null;
    const d = Object.keys(R.doors).find(k => R.doors[k] != null && D.rooms[R.doors[k]] && D.rooms[R.doors[k]].type === 'boss'); if (!d) return null;
    const p = DOOR[d];
    if (SST() === 2) { const q = d === 'n' ? { x: p.x + 60, y: A.y0 + 26 } : d === 's' ? { x: p.x + 60, y: A.y1 - 8 } : { x: d === 'w' ? A.x0 + 24 : A.x1 - 24, y: p.y + 66 }; return [Object.assign(q, { i: 0, d, dual: true })]; } // v1.21 성채는 받침 하나에 인장 두 조각을 맞춘다
    return [-1, 1].map((s, i) => d === 'n' ? { x: p.x + s * 60, y: A.y0 + 26, i, d } : d === 's' ? { x: p.x + s * 60, y: A.y1 - 8, i, d }
      : { x: d === 'w' ? A.x0 + 24 : A.x1 - 24, y: p.y + s * 50 + 16, i, d });
  }
  const SOCK_H = { 1: 30, 2: 38, 3: 44, 4: 36 };
  // 받침 그림 (2px 칸)
  const SOCK_PAL = {
    1: { k: '#0b0a0e', H: '#9a9488', h: '#6a6474', l: '#4a4554', d: '#2d2935', D: '#1c1922', a: '#2a2622', A: '#4a423a', m: '#4a6a2a', M: '#6a8a3a' },
    2: { k: '#0b0a0e', H: '#8a8496', h: '#5e5868', l: '#423d4c', d: '#2d2935', D: '#1c1922', s: '#7a7488', S: '#141218', G: '#e0b040', g: '#8a6420', R: '#a01828', r: '#6a0c18', W: '#f0e8d0', c: '#3a3442' },
    3: { k: '#0b0806', W: '#e0d6c4', w: '#a49a84', b: '#c8bca0', B: '#8a7e66', t: '#6b4a2a', T: '#3a2416', r: '#a01820', e: '#1a0c08', E: '#ff4020', u: '#f0e6c8', U: '#b8a880', f: '#2e1d12' },
    4: { k: '#0b0a0e', H: '#8a8496', h: '#5e5868', l: '#423d4c', d: '#2d2935', D: '#1c1922', e: '#16131a', E: '#0b0a0e', a: '#9a948c', R: '#c02838', r: '#6a0c18', W: '#ffd0d8' },
  };
  const SOCK_ART = {
    1: ['.kk......kk.', '.kHk....kHk.', 'kHhkkkkkkhHk', 'khaAaaAaaAhk', 'kHhhhhhhhhHk', '.kllllllldk.', '..kldddddk..', '...kkddkk...', '....khdk....', '....kmdk....', '....khdk....', '...kkhdkk...', '..khMmhddk..', '.kHhhhhhddk.', '.kkkkkkkkkk.'],
    2: ['..kkkkkkkk..', '.kssssssssk.', '.ksSSSSSSsk.', '.ksSSSSSSsk.', '.ksSSSSSSsk.', '..ksSSSSsk..', '...ksSSsk...', '....kssk....', '.kkkkkkkkkk.', 'kHhhhhhhhhHk', '.kllllllldk.', '.khlllllldk.', '.khlccccldk.', '.khllllldDk.', '.khllllldDk.', '.khllllldDk.', 'kkhhhhhhhdkk', 'kHhhhhhhhhHk', 'kkkkkkkkkkkk'],
    3: ['.k........k.', 'kWk......kWk', 'kWWk....kWWk', '.kWWkkkkWWk.', '..kbbbbbbk..', '..kbBbbBbk..', '..kbebbebk..', '..kbbbbbbk..', '..kbWbbWbk..', '...kWkkWk...', '....kttk....', '...kttTtk...', '...ktrrTk...', '...kttTtk...', '...ktTTtk...', '...kttTtk...', '...ktrrTk...', '...kttTtk...', '...kttTtk...', '..kkttTtkk..', '.kfttttTTfk.', '.kkkkkkkkkk.'],
    4: ['..kkkkkkkk..', '.kHHaHHHaHk.', 'kHhhhhhhhhHk', 'kkkkkkkkkkkk', '.khhhhhhhdk.', '.khhhkkhhdk.', '.khhkeekhdk.', '.khkeEEekdk.', '.khkeEEekdk.', '.khhkeekhdk.', '.khhhkkhhdk.', '.khhhhhhhdk.', '.khlllllldk.', '.khllllldDk.', '.khllllldDk.', 'kkhhhhhhhdkk', 'kHhhhhhhhhHk', 'kkkkkkkkkkkk'], // v2.55 돌기둥 앞면의 마름모 홈
  };
  function sockArt(st, i, on) {
    const g = fromRows(SOCK_ART[st]);
    if (st === 2 && on) { // 인장 받침 하나: on 비트 1 = 왼쪽 반, 2 = 오른쪽 반 → 둘 다면 온전한 방패
      for (let y = 1; y <= 7; y++) for (let x = 0; x < g[y].length; x++) {
        const c = g[y][x]; if (c !== 's' && c !== 'S') continue;
        if (x <= 5 ? !(on & 1) : !(on & 2)) continue;
        g[y][x] = c === 's' ? 'G' : (x === 5 || x === 6) && y >= 2 && y <= 6 || y === 3 && x >= 3 && x <= 8 ? 'W' : (x + y) % 3 ? 'R' : 'r';
      }
      if (on !== 3) for (let y = 1; y <= 7; y++) { const x = on === 1 ? 5 : 6; if (g[y][x] === 'G' && y > 1) g[y][x] = 'g'; } // 반쪽일 때 금 간 단면
    }
    if (st === 3) {
      if (on) { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) if (g[y][x] === 'e') g[y][x] = 'E';
        // 끈에 매단 엄니 (문 반대쪽으로 늘어뜨림)
        const T = [[9, 10, 'f'], [9, 11, 'k'], [10, 11, 'f'], [10, 12, 'k'], [11, 12, 'k'], [10, 13, 'u'], [11, 13, 'k'], [10, 14, 'u'], [11, 14, 'U'], [12, 14, 'k'], [11, 15, 'u'], [12, 15, 'k'], [11, 16, 'U'], [12, 16, 'k'], [11, 17, 'r'], [12, 17, 'k'], [11, 18, 'k']];
        for (const r of g) if (i === 0) r.unshift('.', '.'); else r.push('.', '.');
        for (const [x, y, c] of T) g[y][i === 0 ? 13 - x : x] = c;
      }
    }
    if (st === 4 && on) { let first = true; for (const r of g) for (let x = 0; x < r.length; x++) { if (r[x] === 'e') r[x] = 'r'; else if (r[x] === 'E') { r[x] = first ? 'W' : 'R'; first = false; } } } // 홈에 박힌 붉은 보석
    return gCanvas(g, SOCK_PAL[st]);
  }
  // 초록 정령불 (칸 단위로 흔들림)
  function spiritFlame(x, y, big) {
    const n = big ? 7 : 5, base = big ? 14 : 8;
    for (let i = 0; i < n; i++) { const c = i - (n - 1) / 2, ph = Math.sin(time * 12 + i * 2.1 + x), h = (base + (ph + 1) * 4 - Math.abs(c) * 3) | 0, fx = (x - n + i * 2) & ~1;
      if (h <= 0) continue;
      ctx.fillStyle = '#2a7a3a'; ctx.fillRect(fx, y - (h & ~1), 2, h & ~1);
      if (Math.abs(c) < n / 2 - 1) { ctx.fillStyle = '#7ad040'; ctx.fillRect(fx, y - ((h * 0.72) & ~1), 2, (h * 0.72) & ~1); }
      if (Math.abs(c) < 1.5) { ctx.fillStyle = '#eaffb8'; ctx.fillRect(fx, y - ((h * 0.4) & ~1), 2, (h * 0.4) & ~1); } }
  }
  function drawSock(s) {
    const D = G.dun, st = SST() in SOCK_ART ? SST() : 1, mask = s.dual ? (D.sock[0] ? 1 : 0) | (D.sock[1] ? 2 : 0) : D.sock[s.i] ? 1 : 0, on = mask > 0, full = s.dual ? mask === 3 : on;
    const spr = art(`sock${st}${s.i}${mask}`, () => sockArt(st, s.i, st === 2 ? mask : on));
    const bx = Math.round(s.x) & ~1, by = Math.round(s.y) & ~1, x = (bx - spr.width / 2) & ~1, y = by - spr.height;
    dshRect(ctx, x + 4, by - 2, spr.width - 8, 4, 0.5);
    ctx.drawImage(spr, x, y);
    const pt = s.putT != null ? time - s.putT : 9;
    if (st === 1 && on) { spiritFlame(bx, y + 6, D.gate || pt < 0.6); if (Math.random() < 0.15) G.parts.push({ x: bx + rand(-4, 4), y: y - 4, vx: rand(-6, 6), vy: -rand(25, 45), t: rand(0.4, 0.8), c: pick(['#c8f070', '#7ad040', '#eaffb8']), g: 0, glow: true }); }
    if (st === 3 && on && Math.floor(time * 8 + s.i * 3) % 3 === 0) { const ex = x + (s.i === 0 ? 4 : 0); ctx.fillStyle = '#ffc080'; ctx.fillRect(ex + 8, y + 12, 2, 2); ctx.fillRect(ex + 14, y + 12, 2, 2); }
    if (st === 3 && on && Math.random() < 0.08) { const ex = x + (s.i === 0 ? 4 : 0); G.parts.push({ x: ex + 8 + rand(0, 6), y: y + 12, vx: rand(-4, 4), vy: -rand(10, 25), t: rand(0.3, 0.6), c: pick(['#ff4020', '#ff8040']), g: 0, glow: true }); }
    if (st === 4 && on && Math.floor(time * 3 + s.i * 1.5) % 4 === 0) { ctx.fillStyle = '#fff0f4'; ctx.fillRect(x + 10, y + 12, 2, 2); } // 보석 반짝임
    if (st === 2 && on && Math.floor(time * 3 + s.i * 1.5) % 4 === 0) { ctx.fillStyle = '#fff6d0'; ctx.fillRect(x + (s.i === 0 ? 8 : 14), y + 4, 2, 2); }
    if (pt < 0.35) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - pt / 0.35; ctx.drawImage(art(`sockW${st}${s.i}`, () => { const c = sockArt(st, s.i, st === 2 ? (s.dual ? 3 : 1) : true), [o, ox] = mkCanvas(c.width, c.height); ox.drawImage(c, 0, 0); ox.globalCompositeOperation = 'source-in'; ox.fillStyle = '#fff'; ox.fillRect(0, 0, c.width, c.height); return o; }), x, y); ctx.restore(); }
    // 열쇠를 들고 있으면 빈 받침 위에서 깜빡이는 화살표
    if (!full && D.keys > 0 && !D.gate && Math.floor(time * 3) % 2 === 0) { const ay = y - 8 + (Math.floor(time * 3) % 4 === 0 ? 2 : 0), K = SK(); ctx.fillStyle = '#000'; ctx.fillRect(bx - 4, ay - 2, 8, 2); ctx.fillRect(bx - 2, ay, 4, 2); ctx.fillStyle = K.c; ctx.fillRect(bx - 4, ay - 4, 8, 2); ctx.fillRect(bx - 2, ay - 2, 4, 2); }
  }
  // 떨어진 봉인 열쇠 (불씨·인장 조각·엄니) + 위로 오르는 빛
  const SKEY_ART = {
    1: [['...k..', '..kyk.', '.kyYk.', '.kYWyk', 'kyWWYk', 'kYWWYk', '.kYYk.', '..kk..'], ['..k...', '.kyk..', '.kYyk.', 'kyWYk.', 'kYWWyk', 'kYWWYk', '.kYYk.', '..kk..']],
    2: [['kkkk...', 'kGGGk..', 'kGRRWk.', 'kGRWWWk', 'kGRRWk.', '.kGRgk.', '..kGgk.', '...kk..']],
    3: [['....kk.', '...kWk.', '..kWWk.', '..kWwk.', '.kWwk..', '.kWwk..', 'kWwk...', 'krrk...', '.kk....']],
    4: [['..kk..', '.kRWk.', 'kRRWRk', 'krRRRk', '.krrk.', '..kk..'], ['..kk..', '.kRRk.', 'kRRRWk', 'krRRRk', '.krrk.', '..kk..']],
  };
  const SKEY_PAL = { 4: { k: '#0b0a0e', R: '#c02838', r: '#6a0c18', W: '#ffd0d8' }, 1: { k: '#0c1406', y: '#5a9a2a', Y: '#a8e050', W: '#f0ffc0' }, 2: { k: '#0b0a0e', G: '#e0b040', g: '#8a6420', R: '#a01828', W: '#f0e8d0' }, 3: { k: '#0b0806', W: '#f0e6c8', w: '#b8a880', r: '#a01820' } };
  function drawSealKey(l, x, y) {
    const st = SST() in SKEY_ART ? SST() : 1, fr = SKEY_ART[st], f = Math.floor(time * 6) % fr.length;
    const spr = art(`skey${st}${f}`, () => gCanvas(fromRows(fr[f]), SKEY_PAL[st])), K = SK();
    const bx = Math.round(x) & ~1, by = Math.round(l.y) & ~1, h = 70 * Math.min(1, l.t * 2), pulse = 0.75 + Math.sin(time * 5) * 0.25;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let yy = 16; yy < h; yy += 2) { const k = yy / h; for (let c = -2; c < 2; c++) { const edge = c === -2 || c === 1; if (!dith((bx >> 1) + c, (by - yy) >> 1, (1 - k) * (edge ? 0.4 : 0.85) * pulse)) continue; ctx.fillStyle = `rgba(${K.rgb},${(edge ? 0.45 : 0.8) * (1 - k * 0.6)})`; ctx.fillRect(bx + c * 2, by - yy, 2, 2); } }
    ctx.restore();
    ctx.drawImage(spr, (bx - spr.width / 2) & ~1, (Math.round(y) & ~1) - spr.height + 2);
  }
  function placeSeal(s) {
    const D = G.dun, K = SK(), idx = s.dual ? D.sock.indexOf(false) : s.i; if (D.keys <= 0 || idx < 0 || D.sock[idx]) return;
    D.keys--; D.sock[idx] = true; s.putT = time;
    const top = s.y - SOCK_H[SST()] + 6, n = sealPlaced();
    G.fx.push({ kind: 'ring', x: s.x, y: top, r: 6, grow: 120, t: 0.4, max: 0.4, c: K.c }); burst(s.x, top, K.c, 14);
    if (SST() === 1) { sfx('fireball'); sfx('ready'); }
    else if (SST() === 2) { sfx('block'); sfx('heavy'); debris(s.x, top, 6); }
    else if (SST() === 4) { sfx('coin'); sfx('block', 1.3); for (let i = 0; i < 8; i++) G.parts.push({ x: s.x + rand(-4, 4), y: top + 14, vx: rand(-20, 20), vy: -rand(20, 50), t: rand(0.3, 0.6), c: pick(['#ff8090', '#ffd0d8', '#c02838']), g: 0, glow: true }); }
    else { sfx('hit'); sfx('growl', 0.7); for (let i = 0; i < 6; i++) G.parts.push({ x: s.x + rand(-4, 4), y: top + 10, vx: rand(-10, 10), vy: rand(10, 40), t: rand(0.3, 0.6), c: '#a01820', g: 200 }); }
    if (n >= 2) { D.gate = { t: 0, fired: {} }; banner(K.put2 || K.put, '봉인의 기운이 흔들린다'); }
    else { banner(K.put, `하나 더 바치면 길이 열린다 (${n}/2)`); }
  }
  // 문이 열리는 동안 봉쇄 그림의 남은 비율 (1 → 0)
  function gateK() { const g = G.dun && G.dun.gate; return g ? clamp(1 - (g.t - 0.8) / 1.0, 0, 1) : 1; }
  function updateGate(dt) {
    const D = G.dun, g = D && D.gate; if (!g) return;
    g.t += dt; const R = D.cur, S = R && R.socks, st = SST(), once = (k, at, fn) => { if (g.t >= at && !g.fired[k]) { g.fired[k] = 1; fn(); } };
    if (S) {
      const d = S[0].d, q = doorIn(d, 2), along = d === 'n' || d === 's' ? [1, 0] : [0, 1];
      const onDoor = (c, vy = -30) => { const o = rand(-22, 22); G.parts.push({ x: q.x + along[0] * o + rand(-4, 4), y: q.y + along[1] * o - rand(0, 10), vx: rand(-10, 10), vy: vy * rand(0.6, 1.3), t: rand(0.4, 0.8), c, g: vy > 0 ? 300 : 0, glow: vy < 0 }); };
      if (st === 1) { // 화톳대에서 덤불로 초록 불길이 번진다
        if (g.t < 0.8) for (const s of S) if (Math.random() < 0.6) { const k = g.t / 0.8, sx = s.x + (q.x - s.x) * k, sy = s.y - 24 + (q.y - s.y + 24) * k; G.parts.push({ x: sx + rand(-3, 3), y: sy + rand(-3, 3), vx: 0, vy: -20, t: 0.35, c: pick(['#c8f070', '#7ad040']), g: 0, glow: true }); }
        if (g.t > 0.6 && g.t < 1.9) for (let i = 0; i < 3; i++) onDoor(pick(['#c8f070', '#7ad040', '#ffb040', '#ff7020', '#eaffb8']), -50);
        once('ign', 0.7, () => { sfx('fireball'); sfx('blast', 1.4); });
      } else if (st === 2) { // 쇠사슬이 끊기고 창살이 오른다
        once('c1', 0.2, () => { sfx('block', 0.8); onDoor('#a49cb0', 40); }); once('c2', 0.45, () => { sfx('block', 0.7); }); once('c3', 0.7, () => { sfx('heavy'); sfx('crunch'); for (let i = 0; i < 10; i++) onDoor(pick(['#7a7488', '#a49cb0', '#ffe0a0']), 60); });
        if (g.t > 0.8 && g.t < 1.8 && Math.random() < 0.5) onDoor('#4a4656', 30);
      } else if (st === 4) { // 두 홈의 보석에서 붉은 빛이 문으로 흘러 들어가고, 무거운 문이 열린다
        if (g.t < 0.8) for (const s of S) if (Math.random() < 0.6) { const k = g.t / 0.8, sx = s.x + (q.x - s.x) * k, sy = s.y - 22 + (q.y - s.y + 22) * k; G.parts.push({ x: sx + rand(-3, 3), y: sy + rand(-3, 3), vx: 0, vy: -10, t: 0.35, c: pick(['#ff8090', '#c02838']), g: 0, glow: true }); }
        once('h1', 0.1, () => sfx('coin', 0.7)); once('h2', 0.8, () => { sfx('heavy'); sfx('crunch'); });
        if (g.t > 0.8 && g.t < 1.8 && Math.random() < 0.5) onDoor('#8a8496', 30);
      } else { // 뿔나팔 · 북 세 번 · 통나무 문이 끌려 올라간다
        once('horn', 0.05, () => sfx('roar', 0.8)); once('b1', 0.6, () => sfx('beat')); once('b2', 0.9, () => sfx('beat')); once('b3', 1.2, () => { sfx('beat'); sfx('heavy'); });
        if (g.t > 0.8 && g.t < 1.8 && Math.random() < 0.5) dust(q.x + rand(-16, 16), q.y, 2);
      }
    }
    if (g.t >= 2) { D.gate = null; D.bossOpen = true; const K = SK(); banner(K.open[0], K.open[1]); sfx('grogi'); flashT = 0.08; flashColor = st === 1 ? '#d0ffa0' : st === 2 ? '#fff0c0' : '#ffb090'; if (S) { const q = doorIn(S[0].d, 6); dust(q.x, q.y, 14); } }
  }
  // 금 간 벽: 성채는 벽면의 갈라짐, 초원은 숲길을 막은 바위 더미 (맞을수록 금이 늘어난다)
  function drawCrack(R, d) {
    const c = crackPoint(R), stage = 3 - Math.max(0, R.crack.hp);
    const spr = art(`crack${G.stage}${d}${stage}`, () => withSeed(77 + stage, () => {
      if (G.stage === 1) {
        const [cv, cx] = mkCanvas(60, 40);
        stamp(cx, DECO_MAPS.rockBig, DECO, 2, 10, 2); stamp(cx, DECO_MAPS.rockBig, DECO, 26, 12, 2, true); stamp(cx, DECO_MAPS.rockA, DECO, 18, 0, 2);
        const g = mkGrid(30, 20); let x = 14, y = 4; for (let i = 0; i < 6 + stage * 4; i++) { g[y][x] = 'k'; x = clamp(x + randi(-1, 1), 2, 27); y = clamp(y + (Math.random() < 0.6 ? 1 : 0), 2, 18); }
        gPaint(cx, g, { k: '#121214' }, 0, 0);
        return cv;
      }
      const g = mkGrid(22, 18);
      for (let s = 0; s < 3 + stage * 2; s++) { let x = 11 + randi(-2, 2), y = 8 + randi(-2, 2); for (let i = 0; i < 4 + stage * 2; i++) { g[y][x] = 'K'; if (Math.random() < 0.4 && g[y][x + 1] === '.') g[y][x + 1] = 'D'; x = clamp(x + randi(-1, 1), 0, 21); y = clamp(y + randi(-1, 1), 0, 17); } }
      for (let i = 0; i < 3 + stage * 2; i++) { const x = randi(5, 16), y = randi(14, 17); g[y][x] = pick(['l', 'd', 'h']); }
      return gCanvas(g, G.stage === 3 ? WOODPAL : STONE);
    }));
    let x = c.x - spr.width / 2, y = d === 'n' ? c.y - spr.height + 4 : c.y - spr.height / 2;
    if (G.stage === 1 && d === 'w') x = c.x - spr.width + 16; if (G.stage === 1 && d === 'e') x = c.x - 16;
    ctx.drawImage(spr, Math.round(x) & ~1, Math.round(y) & ~1);
  }
  function drawChest(c) {
    const sec = c.kind === 'secret', boss = c.kind === 'boss', key = (c.opened ? 'chO' : 'chC') + (sec ? 's' : boss ? 'b' : '');
    const spr = art(key, () => gCanvas(c.opened ? CHEST_O : CHEST_C, sec ? CHEST_PAL_S : boss ? CHEST_PAL_B : CHEST_PAL));
    if (boss && !c.opened && !c.fall) { const bx = Math.round(c.x) & ~1, by = Math.round(c.y) & ~1; ctx.save(); ctx.globalCompositeOperation = 'lighter'; // 바닥 금빛 고리 + 위로 오르는 불티
      for (let i = 0; i < 14; i++) { const a = i * TAU / 14 + time * 0.6; ctx.fillStyle = `rgba(255,${190 + (i % 2) * 40},90,${0.55 + 0.3 * Math.sin(time * 4 + i)})`; ctx.fillRect(Math.round(bx + Math.cos(a) * 20) & ~1, Math.round(by + 2 + Math.sin(a) * 7) & ~1, 2, 2); }
      for (let i = 0; i < 5; i++) { const k = (time * 0.7 + i / 5) % 1; ctx.fillStyle = `rgba(255,210,110,${0.8 * (1 - k)})`; ctx.fillRect(Math.round(bx - 12 + i * 6 + Math.sin(time * 3 + i) * 2) & ~1, Math.round(by - 14 - k * 40) & ~1, 2, 2); }
      ctx.restore(); }
    const bob = !c.opened && Math.floor(time * 2) % 2 ? 2 : 0, x = Math.round(c.x - spr.width / 2) & ~1, y = Math.round(c.y - spr.height + 2 - (c.lift || 0)) & ~1;
    { const xa = x + 2, xb = x + spr.width - 2; if (xb > xa) dshRect(ctx, xa, y + spr.height + (c.kind === 'boss' ? c.lift || 0 : 0), Math.ceil((xb - xa) / 2) * 2, 2, 0.5); } // 떨어지는 보스 상자는 그림자가 바닥에 남는다
    ctx.drawImage(spr, x, y - bob);
    if (!c.opened && Math.floor(time * 6) % 7 === 0) { ctx.fillStyle = sec ? '#f0e0ff' : '#fff0b0'; ctx.fillRect((x + 6 + Math.floor(time * 6) % 14 * 1) & ~1, y + 4 - bob, 2, 2); }
  }
  // ================================================================ 특별한 방 (v0.76): 상인의 노점 · 보물 제단 · 야영지
  // 공통: 2px 칸 · 검은 외곽선 · 왼쪽 위 빛. 그리드에 칠한 뒤 gOutline → gCanvas
  const SP_PAL = { k: '#140c08', R: '#b8342c', r: '#7e2220', C: '#efe2c4', c: '#bba886', S: '#1c130d', w: '#7a5232', W: '#a0703f', b: '#4a3020', B: '#2e1d12',
    y: '#ffd34d', Y: '#c9952a', Z: '#fff4b8', P: '#5a2a6a', p: '#3a1a48', g: '#8a8478', G: '#b4ada0', d: '#4e4a44', D: '#2e2b28',
    '1': '#e0303a', '2': '#4f8dff', '3': '#7ac843', '4': '#e8e0d0', '5': '#c07a3a', '6': '#b05cff', f: '#ff8a2a', F: '#ffe28a', e: '#e2501c', n: '#6a2a1a', N: '#9a3a22' };
  const spGrid = (w, h, fn) => { const g = mkGrid(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); if (c) g[y][x] = c; } return g; };
  const spCv = (key, w, h, fn) => art('sp_' + key, () => gCanvas(gOutline(spGrid(w, h, fn)), SP_PAL));
  // 소품 등록 도우미 (3장 부락 소품이 씀)
  function spProp(name, w, h, fn, opt, pal) { if (PROP_MAPS[name]) return; const g = gOutline(spGrid(w, h, fn)); PROP_MAPS[name] = [g.map(r => r.join('')), pal || SP_PAL]; PROPS[name] = Object.assign({ foot: 1 }, opt || {}); }
  // --- 상인의 노점: 줄무늬 차양 · 기둥 · 물건이 놓인 뒷선반 · 동전 간판 / 앞 계산대(보라 천)
  const STALL_W = 84;
  // --- 보물 제단: 금 상감 원형 단 · 금화 더미 · 금 화로 4개 · 위에서 내리는 금빛 기둥
  const GOLDPILE = (v) => spCv('gold' + v, 24, 12, (x, y) => { const e = Math.hypot((x - 11.5) / 12, (y - 11) / (10 + v)); if (e > 1) return null; const h = (x * 7 + y * 13 + v * 5) % 11; return h === 0 ? 'Z' : h === 3 && y > 6 ? (v ? '1' : '2') : h < 4 ? 'y' : (x + y) % 3 ? 'Y' : 'y'; });
  const GOLDBRAZIER = () => spCv('gbraz', 10, 16, (x, y) => { if (y < 4) return Math.abs(x - 4.5) < 4 - y * 0.3 ? (y < 2 ? 'F' : 'f') : null; if (y < 7) return x >= 1 && x <= 8 ? (y === 4 ? 'Z' : 'y') : null; if (y < 14) return x >= 3 && x <= 6 ? (x === 3 ? 'y' : 'Y') : null; return x >= 1 && x <= 8 ? 'Y' : null; });
  function paintTreasureFloor(g, R) {
    const c = R.chest; if (!c) return; const cx = c.x, cy = c.y + 4, st = G.stage;
    if (st === 1) { // 잊힌 성소: 이끼 낀 돌 원판과 들꽃
      for (let y = -40; y <= 40; y += 2) for (let x = -76; x <= 76; x += 2) { const e = Math.hypot(x / 76, y / 40); if (e > 1) continue; const edge = !(Math.hypot((x - 2) / 76, y / 40) <= 1 && Math.hypot((x + 2) / 76, y / 40) <= 1 && Math.hypot(x / 76, (y - 2) / 40) <= 1 && Math.hypot(x / 76, (y + 2) / 40) <= 1); const stone = ((Math.floor((x + 80) / 14) + Math.floor((y + 40) / 10)) % 2), seam = (x + 80) % 14 < 2 || (y + 40) % 10 < 2, moss = Math.sin(x * 0.2 + y * 0.31) > 0.55;
        g.fillStyle = edge ? '#2a2e26' : seam ? '#2e3328' : moss ? (stone ? '#4a6a34' : '#3e5a2c') : stone ? '#6a6a62' : '#5a5a52'; g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2); }
      for (let i = 0; i < 60; i++) { const a = rand(0, TAU), r = rand(76, 150); g.fillStyle = pick(['#e8e0c0', '#e0c040', '#b080e0', '#e07090']); g.fillRect((cx + Math.cos(a) * r) & ~1, (cy + Math.sin(a) * r * 0.5) & ~1, 2, 2); }
      return;
    }
    if (st === 3) { // 약탈품 더미: 짓밟힌 흙·핏자국·흩어진 금화
      for (let y = -46; y <= 46; y += 2) for (let x = -96; x <= 96; x += 2) { const e = Math.hypot(x / 96, y / 46); if (e > 1 || !dith((x + 200) >> 1, (y + 200) >> 1, 1 - e * 0.8)) continue; g.fillStyle = Math.sin(x * 0.13) * Math.cos(y * 0.2) > 0.6 ? '#4a0c0c' : e < 0.5 ? '#2a1a10' : '#3a2416'; g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2); }
      for (let i = 0; i < 70; i++) { const a = rand(0, TAU), r = rand(10, 110); g.fillStyle = pick(['#ffd34d', '#c9952a', '#fff4b8', '#a8aeb6']); g.fillRect((cx + Math.cos(a) * r) & ~1, (cy + Math.sin(a) * r * 0.5) & ~1, 2, 2); }
      return;
    }
    const RX = 66, RY = 34; // 성채 보물고: 금 상감 원형 단
    for (let y = -RY - 4; y <= RY + 4; y += 2) for (let x = -RX - 6; x <= RX + 6; x += 2) {
      const e = Math.hypot(x / RX, y / RY), E = (u, v) => Math.hypot(u / RX, v / RY); if (e > 1.06) continue;
      if (e > 1 && !(E(x - 2, y) <= 1 || E(x + 2, y) <= 1 || E(x, y - 2) <= 1 || E(x, y + 2) <= 1)) continue; // v2.80 바깥 테두리는 1칸만
      const a = Math.atan2(y / RY, x / RX), ray = Math.abs(Math.sin(a * 6)) < 0.12 && e > 0.3 && e < 0.88;
      g.fillStyle = e > 1 ? '#140c08' : e > 0.92 ? '#c9952a' : e > 0.86 ? '#6a5a3a' : ray ? '#c9952a' : e < 0.28 ? (e > 0.22 ? '#ffd34d' : '#5a4a32') : ((x >> 1) + (y >> 1)) % 2 ? '#4a4038' : '#3e352e';
      g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2);
    }
    for (let i = 0; i < 40; i++) { const a = rand(0, TAU), r = rand(70, 120); g.fillStyle = pick(['#ffd34d', '#c9952a', '#fff4b8']); g.fillRect((cx + Math.cos(a) * r) & ~1, (cy + Math.sin(a) * r * 0.55) & ~1, 2, 2); }
  }

  const PEDESTAL = () => spCv('pedestal', 28, 13, (x, y) => { if (y < 5) return Math.abs(x - 13.5) <= 13 - (y === 0 ? 1 : 0) ? (y === 4 ? 'y' : y === 0 ? 'G' : (x + y) % 5 ? 'g' : 'G') : null; if (x < 1 || x > 26) return null; return y === 12 ? 'Y' : (x - 1) % 6 === 0 ? 'D' : y === 7 && x % 3 === 0 ? 'Y' : y > 9 ? 'D' : 'd'; });
  function drawTreasure(R) { // 받침대 (금화 더미·화로 등은 소품으로 배치)
    const c = R.chest, pd = PEDESTAL(); ctx.drawImage(pd, (c.x - pd.width / 2) & ~1, (c.y + 6 - pd.height) & ~1); c.lift = 12;
  }

  function drawTreasureBeam(R) { // 열지 않은 상자 위로 내리는 금빛 기둥 + 떠다니는 금가루
    const c = R && R.chest; if (!c || c.opened || R.type !== 'reward') return;
    const H0 = 150, pulse = 0.75 + 0.25 * Math.sin(time * 2.5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const L = pxLayer((Math.round(c.x) - 34) & ~1, (Math.round(c.y - 36) - H0 - 2) & ~1, 72, H0 + 6, true); // v1.17 한 장으로
    for (let y = 0; y < H0; y += 2) { const k = y / H0, hw = Math.round((10 + 18 * k) / 2) * 2; for (let x = -hw; x < hw; x += 2) { const ed = Math.abs(x) / hw; if (!dith((x + 64) >> 1, (y + Math.floor(time * 8)) >> 1, (1 - k * 0.6) * (1 - ed) * 0.55 * pulse)) continue; if (ed < 0.4) L.rect((Math.round(c.x) + x) & ~1, (Math.round(c.y - 36) - (H0 - y)) & ~1, 2, 2, 255, 240, 190, 0.5); else L.rect((Math.round(c.x) + x) & ~1, (Math.round(c.y - 36) - (H0 - y)) & ~1, 2, 2, 255, 200, 90, 0.35); } }
    L.flush(); ctx.restore();
    if (Math.random() < 0.5) G.parts.push({ x: c.x + rand(-20, 20), y: c.y - rand(10, 120), vx: rand(-5, 5), vy: rand(8, 20), t: rand(0.8, 1.4), c: pick(['#ffd34d', '#fff4b8']), g: 0, glow: true });
  }
  // --- 야영지: 큰 모닥불(돌 둘레·장작·삼발이 냄비) · 천막 · 통나무 의자 · 침낭 · 장작더미
  const TENT = () => spCv('camptent', 36, 26, (x, y) => { const h = 24 - Math.abs(x - 17.5) * 1.35; if (y < 25 - h - 1 || y > 24) return x === 17 && y < 25 - h - 1 && y > 25 - h - 4 ? 'b' : null; const door = Math.abs(x - 17.5) < (y - 6) * 0.38 && y > 8; if (door) return y > 20 ? 'S' : 'B'; return x < 17 ? (x % 6 === 0 ? 'c' : 'C') : (x % 6 === 0 ? 'Y' : 'c'); });
  const LOGSEAT = () => spCv('logseat', 28, 8, (x, y) => (x <= 2 || x >= 25) ? (Math.hypot(x <= 2 ? x - 2 : x - 25, y - 3.5) < 3.4 ? (Math.hypot(x <= 2 ? x - 2 : x - 25, y - 3.5) < 1.6 ? 'W' : 'w') : null) : y === 0 ? 'W' : y > 5 ? 'b' : x % 7 === 0 ? 'B' : 'w');
  const BEDROLL = () => spCv('bedroll', 26, 9, (x, y) => x > 21 ? (Math.hypot(x - 22, y - 4) < 4.4 ? (y < 4 ? 'R' : 'r') : null) : (y >= 1 && y <= 7 ? (x % 5 === 0 ? 'C' : y < 3 ? 'R' : 'r') : null));
  const WOODPILE = () => spCv('woodpile', 20, 13, (x, y) => { const row = Math.floor((12 - y) / 4), off = row % 2 ? 2 : 0, cx = (x - off) % 4; if (y > 12 || x - off < 0 || x - off > 19 - row * 4) return null; return cx === 0 ? 'B' : (12 - y) % 4 === 3 ? 'b' : cx === 1 ? 'W' : 'w'; });
  function drawCampFire(b) {
    const x = Math.round(b.x) & ~1, y = Math.round(b.y) & ~1;
    { const rb = srArt('ringBack', G.stage, SR.ringBack); ctx.drawImage(rb, x - rb.width / 2, y - rb.height + 4); } // v1.11 돌 둘레 뒤쪽 반
    // v2.78 엇갈린 장작 (껍질 · 숯 · 잉걸) + 물방울 모양 불꽃 (가장자리 붉게 → 안쪽 노랗게 → 심지 하얗게 · 칸 단위로 일렁임)
    const P2 = (px, py, c) => { ctx.fillStyle = c; ctx.fillRect(px & ~1, py & ~1, 2, 2); };
    for (const sx of [-1, 1]) for (let i = -6; i <= 6; i++) { const px = x + i * 2, py = y - 6 + Math.round(i * sx * 0.5) * 2, end = Math.abs(i) >= 5; // 엇갈린 장작 두 개 (위 껍질 빛 · 아래 숯 · 가운데 잉걸)
      P2(px, py - 2, '#140c08'); P2(px, py, end ? (i * sx > 0 ? '#c8a070' : '#6b4a2a') : Math.abs(i) < 2 ? '#2a1a10' : '#8a6038'); P2(px, py + 2, Math.abs(i) < 3 ? '#ff7020' : '#3a2416'); P2(px, py + 4, '#140c08'); }
    const ft = Math.floor(time * 10), nz = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233 + ft * 3.1) * 43758.5453; return v - Math.floor(v); };
    for (let yy = 0; yy < 30; yy += 2) { const k = yy / 30, sway = Math.round(Math.sin(time * 5 + yy * 0.22) * 2.5 * k), hw = (11 * (1 - k * 0.92)) * (0.85 + 0.2 * Math.sin(time * 9 + yy * 0.5));
      for (let xx = -12; xx <= 12; xx += 2) { const d = Math.abs(xx - sway) / Math.max(1, hw); if (d > 1 || (d > 0.75 && nz(xx, yy) < 0.4)) continue;
        P2(x + xx, y - 6 - yy, d < 0.3 && k < 0.55 ? '#fff4c8' : d < 0.55 && k < 0.75 ? '#ffd060' : d < 0.8 ? '#ff8a2a' : '#e2501c'); } }
    for (let i = 0; i < 3; i++) { const k = ((time * 1.6 + i / 3) % 1), px = x + Math.round(Math.sin(i * 2.1 + time * 3) * 6), py = y - 34 - Math.round(k * 14); if (nz(i, 9) < 0.7) P2(px, py, k < 0.5 ? '#ff8a2a' : '#e2501c'); } // 떨어져 나가는 불꽃 조각
    { const rf = srArt('ringFront', G.stage, SR.ringFront); ctx.drawImage(rf, x - rf.width / 2, y - 4); } // 앞쪽 반
    if (G.stage === 3) { // 꼬챙이 고기 굽기
      ctx.fillStyle = '#2e1d12'; for (const s of [-1, 1]) { ctx.fillRect(x + s * 18 - 1, y - 24, 2, 22); ctx.fillRect(x + s * 18 - 3, y - 26, 6, 2); }
      ctx.fillStyle = '#140c08'; ctx.fillRect(x - 22, y - 26, 44, 2); const rot = Math.floor(time * 3) % 2;
      ctx.fillStyle = '#140c08'; ctx.fillRect(x - 10, y - 32, 20, 12); ctx.fillStyle = rot ? '#8a3a22' : '#9a4a2a'; ctx.fillRect(x - 8, y - 30, 16, 8); ctx.fillStyle = '#c87040'; ctx.fillRect(x - 6, y - 30, 8, 2); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + 8, y - 28, 4, 2);
      if (Math.random() < 0.2) G.parts.push({ x: x + rand(-6, 6), y: y - 22, vx: 0, vy: 30, t: 0.3, c: '#ffb050', g: 200 }); // 떨어지는 기름
      return;
    }
    // 삼발이와 냄비
    ctx.fillStyle = '#2e1d12'; for (const [dx, dy] of [[-16, 0], [16, 0]]) for (let k = 0; k < 18; k += 2) ctx.fillRect((x + dx - Math.sign(dx) * k * 0.8) & ~1, (y + dy - k * 1.9) & ~1, 2, 4);
    ctx.fillStyle = '#140c08'; ctx.fillRect(x - 1, y - 36, 2, 8); ctx.fillRect(x - 7, y - 30, 14, 10); ctx.fillStyle = '#4e4a44'; ctx.fillRect(x - 5, y - 28, 10, 6); ctx.fillStyle = '#8a8478'; ctx.fillRect(x - 5, y - 28, 10, 2);
    if (Math.random() < 0.25) G.parts.push({ x: x + rand(-3, 3), y: y - 32, vx: rand(-4, 4), vy: -18, t: 1.2, c: 'rgba(200,200,210,.5)', g: 0 }); // 냄비 김
    if (Math.random() < 0.6) G.parts.push({ x: x + rand(-6, 6), y: y - 14, vx: rand(-10, 10), vy: -rand(30, 60), t: rand(0.6, 1.1), c: pick(['#ffb050', '#ff7030', '#ffe28a']), g: 0, glow: true });
  }
  function drawCamp(R) { // y 정렬 소품: 천막 · 통나무 의자 2 · 침낭 · 장작더미
    const b = G.bonfire; if (!b) return []; const t = TENT(), lg = LOGSEAT(), bd = BEDROLL(), wp = WOODPILE();
    return [
      { y: b.y - 46, d: () => ctx.drawImage(t, (b.x - 92 - t.width / 2) & ~1, (b.y - 46 - t.height + 2) & ~1) },
      { y: b.y - 22, d: () => ctx.drawImage(lg, (b.x - lg.width / 2) & ~1, (b.y - 22 - lg.height + 2) & ~1) },
      { y: b.y + 30, d: () => ctx.drawImage(lg, (b.x - lg.width / 2) & ~1, (b.y + 30 - lg.height + 2) & ~1) },
      { y: b.y + 8, d: () => ctx.drawImage(bd, (b.x + 44) & ~1, (b.y + 8 - bd.height + 2) & ~1) },
      { y: b.y - 30, d: () => ctx.drawImage(wp, (b.x + 48) & ~1, (b.y - 30 - wp.height + 2) & ~1) },
      { y: b.y, d: () => drawCampFire(b) },
    ];
  }
  function paintCampFloor(g, R) { // 불 주변 그을리고 다져진 땅
    const b = { x: CX + 40, y: CY - 10 };
    for (let y = -48; y <= 48; y += 2) for (let x = -96; x <= 96; x += 2) { const e = Math.hypot(x / 96, y / 48); if (e > 1 || !dith((x + 200) >> 1, (y + 200) >> 1, (1 - e) * 0.8)) continue; g.fillStyle = e < 0.25 ? '#1a120c' : e < 0.5 ? '#2a1e14' : '#3a2c1e'; g.fillRect((b.x + x) & ~1, (b.y + y) & ~1, 2, 2); }
    for (let i = 0; i < 18; i++) { g.fillStyle = pick(['#4e4a44', '#2e2b28', '#6b6560']); g.fillRect((b.x + rand(-26, 26)) & ~1, (b.y + rand(-8, 8)) & ~1, 2, 2); } // 재
  }
  // 상점 바닥: 노점 앞에 깔린 큰 직물 깔개
  function paintShopFloor(g, R) { // 상품을 늘어놓은 낡은 누비 깔개 두 장 (가장자리가 해지고 비뚤어짐)
    const pals = [['#6a5030', '#5a4228', '#8a6a40', '#3a5a3a', '#7a3028'], ['#5a4a6a', '#4a3a58', '#7a6a50', '#6a3028', '#4a5a30']];
    for (const [ox, oy, w, h, k] of [[CX - 162, CY + 8, 176, 44, 0], [CX + 6, CY + 12, 158, 40, 1]]) {
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
        const wob = Math.sin(x * 0.11 + k) * 3 + Math.sin(y * 0.3) * 2, ey = y + wob * 0.3, frayed = x < 4 + (y * 7 % 5) || x > w - 6 + (y * 3 % 4) || ey < 2 + (x * 5 % 4) || ey > h - 4 + (x * 3 % 3);
        if (frayed && ((x + y) >> 1) % 3 === 0) continue;
        const patch = (Math.floor((x + 6 * k) / 22) * 7 + Math.floor(y / 14) * 3) % 5, seam = x % 22 === 0 || y % 14 === 0;
        g.fillStyle = frayed ? '#2a1e14' : seam ? '#1e150e' : pals[k][patch]; g.fillRect((ox + x) & ~1, (oy + y + Math.round(wob * 0.3) * 2) & ~1, 2, 2);
      }
    }
  }

  // ---- v0.77: 특별한 방을 챕터별 장면으로 — 생성한 도트 소품을 일반 소품(PROPS)으로 등록해 y정렬·조명·막힘을 그대로 쓴다
  Object.assign(SP_PAL, { m: '#4a7a34', M: '#6e9a4a', h: '#9a7450', H: '#6a4a30', v: '#5a6638', V: '#3c4628', s: '#a8aeb6', q: '#5a6068', o: '#d8d0b8', O: '#a89880' });
  let SP_READY = false;
  // ================================================================ v1.11 특별한 방 다시 그리기 (대장간 수준): 상인 · 모닥불 · 숨은 보고 · 잊힌 틈새
  // 2px 칸 · 검은 외곽선 · 왼쪽 위 빛 · 4단계 명암. 챕터별로 팔레트만 바꿔 같은 물건을 다른 재질로
  const SRPAL = { k: '#0b0a0e',
    o: '#b07c44', O: '#83592f', p: '#5c3c20', P: '#3c2614', // 나무
    e: '#e8705a', r: '#c03c30', R: '#86241e', E: '#4e1214', // 붉은 천
    c: '#f2e4c2', C: '#d0b98c', v: '#a08658', V: '#6a5636', // 생천 · 캔버스
    '1': '#9a94a4', '2': '#706a80', '3': '#4c4758', '4': '#2e2a36', // 돌
    y: '#fff3c0', Y: '#ffd060', g: '#e0a030', G: '#9a6418', // 금
    i: '#e0e4ec', I: '#a8aeb8', j: '#6e747e', J: '#43474f', // 쇠
    m: '#8cc058', M: '#5a8a34', n: '#34522a', N: '#1e3218', // 풀 · 이끼
    u: '#8ac4e8', U: '#4078a8', q: '#b080d8', Q: '#6a3e8a', z: '#3e2458', // 파랑 · 보라
    f: '#ffb040', F: '#ff6a2a', w: '#ffffff', // 불 · 흰빛
    b: '#ece4cc', B: '#bcae8c', x: '#7a6e56', // 뼈
    h: '#b08458', H: '#7a5636', a: '#4e3626', A: '#2e2018', // 털가죽
    d: '#24202a', D: '#16131a', s: '#5a5a62', S: '#3a3a42', l: '#f2f0f6', L: '#cfcbd9', t: '#a29eb2', T: '#68647a', // l~T 대리석
    '5': '#9894a6', '6': '#726e84', '7': '#4e4a60', '8': '#302c3e', '9': '#1e1b28' }; // v2.80 5~9 어두운 대리석 (비밀방 제단)
  // 챕터별 재질 바꾸기: 키는 SRPAL 글자, 값은 바꿀 색
  const SR_ST = {
    1: {},
    2: { '1': '#a8a4b4', '2': '#7c7890', '3': '#56526a', '4': '#34303e' },
    3: { '1': '#a08868', '2': '#7a6448', '3': '#54442e', '4': '#33281c', c: '#d8b48a', C: '#b08a60', v: '#86643e', V: '#5a4028', r: '#a83a24', R: '#70241a', e: '#d06040' },
  };
  const srPal = st => Object.assign({}, SRPAL, SR_ST[st] || {});
  // v3.19 상점 소품 다시 그림 (비스트로 수레 수준: 재질마다 3~4단 명암 · 왼쪽 위 빛 · 주름 · 결 · 쇠 장식) — 칸 그림 + 외곽선 포함
  const SR_NEW = {"stall":[".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.","k21212121212121212121212121212121212121212121212121212121212121212121k",".krrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwk.","krrrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwwk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","kssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxk","kssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxk","kSSsssSSXXxxxXXSSsssSSXXxxxXXSSsssSSXXxxxXXSSsssSSXXxxxXXSSsssSSXXxxxk",".kksss6666xxx6666sss6666xxx6666sss6666xxx6666sss6666xxx6666sss6623xxxk","..k2355555555555555555555555555555555555555555555555555555555555235kk.","..k235344453444J344453444534445344453444535445344453J44534J45344235k..","..k2Z5344423442J344453444534445344452444234445354453J44534J453432Z5k..","..k2353444334JJJJJ4453444534445344453444334445344422222222222344235k..","..k2353444R34JlLLJ4XXX44453444534445G444P3444XXX442333yyY3335344235k..","..k235354rRs4JLlLJxxxxx445344453444gGh4pPq44xxxxx4233yyYYY335354235k..","..k235344wRs5JoooJYzzzZ445344453444wGh4wPq43xXXXv4233yYzYY335344235k..","..k235344rRs4JoooJYwzzZ44cccccccc44gGh3pPq44xwXXv4233YYYYZ335344235k..","..k235344rRs4bJJJ4YWWWZ44XCCRsCCX34gGh4pPq44xWWWv42333YYZ3335344235k..","..k235344rRs4bBn34YzzzZ44CCCsCCCC44gGh4pPq44xXXXv425555555555344235k..","..k235344rRs4bBn34YZZZZ34vvvvvvvv44gGh4pPq44xvvvv453444534445344235k..","..k2352222222222222222222222222222222222222222222222222222222222235k..","..k2354445444444445444444445444444445444444445444444445444444445235k..","..k235343J53444534445344453444534445344453444535445344453444J344235k..","..k235344j53444534445344453444534445344XXX44453Bn45Pq445G444j344235k..","..k23534445344453444534x4534x4534x4534xxxxx44RsYnGhYq4G5h5G45343235k..","..k2Z5354YYYYYYYYY445rrrrsbbbbnppppq34iIIIj44YsBnYhPq4h5h4h453542Z5k..","..k235344z333y333z445rwRRsbwBBnpwPPq34iwIIj44RsBnGhPq34hhh445344235k..","..k235344z444Y444z445rrrrsbbbbnppppq34iWWWj44RsBnGhPq44hhh445344235k..","..k235344z4444444z445rRRRsbBBBnpPPPq34iIIIj34RsBnGhPq44555445344235k..","..k235344zzzzzzzzz445rrrrsbbbbnppppq34ijjjj44RsBnGhPq445h4445344235k..","..k2352222222222222222222222222222222222222222222222222222222222235k..","..k2354445444444445444444445444444445444444445444444445444444445235k..","..k235344J53444534445343453444534445344453544534445344453444J344235k..","..k235344j53444534345344453444534445344453444535445344453444j344235k..","..k2353444534345344453444534445344453444534445344453544534445344235k..","..k2352222222222222222222222222222222222222222222222222222222222235k..","..k2355333333335333333335333333335333333335333333335333333335333235k..","..k2355444444445444444445444444445444444445444444445444444445444235k..","..k2355444444445444444445444444445444444445444444445444444445444235k..","..k2355444444445444444445444444445444444445444444445444444445444235k..","..k235kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk235k..","..k2Z5k........................................................k2Z5k..","..k235k........................................................k235k..","..k235k........................................................k235k..","...kkk..........................................................kkk..."],"counter":[".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.","k2222222122222221222222212222222122222221222222212222k","k3333333333433333333334333333333343333333333433333333k",".kzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYk.",".kPppPPPqqQPppPPPqqQPppPPPqqQPppPPPqqQPppPPPqqQPppPPk.",".kPppPPPqqQPppPPPqqQPppPPPYqQPppPPPqqQPppPPPqqQPppPPk.",".kPppPPPqqQPppPPPqqQPppPPYyYQPppPPPqqQPppPPPqqQPppPPk.",".kPppPPPqqQPppPPPqqQPppPPPYzQPppPPPqqQPppPPPqqQPppPPk.",".kPppPPPqqQPppPPPqqQPppPPPqqQPppPPPqqQPppPPPqqQPppPPk.",".kqqqqqqQQQqqqqqqQQQqqqqqqQQQqqqqqqQQQqqqqqqQQQqqqqqk.","..kYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkk..","...k.kzk.k.kzk.k.kzk.k.kzk.k.kzk.k.kzk.k.kzk.k.kzk...."],"stand":[".kkkkkkkkkkkkkkkkkk.","krwrrrrrrrrrrrrrrrrk","kRRssRRssRRssRRssRRk","kRRssRRssRRssRRssRRk","kRRssRRssRRssRRssRRk","kszYzYzYzYzYzYzYzYsk",".k3kk5kkkkkkkk5kk3k.",".k3kk5k......k5kk3k.",".k3kk5k......k5kk3k.",".k3kk5k......k5kk3k.",".k5k.k........k.k5k.","..k..............k.."],"banner":["kkkCkkkkCkkk","Y2222222222Y","z4444444444z","kzgGGhhGGhZk","kzYYYYYYYYZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgYGYYGYhZk","kzgyYYYYYhZk","kzgyYRsYYhZk","kzgZZZZZZhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk",".kGGGGhhhhk.","..kGGGhhhk..","...kGGhhk...","....kGhk....",".....kk.....","............","............","............"],"banner_2":["kkkCkkkkCkkk","Y2222222222Y","z4444444444z","kzBnnNNnnNZk","kzYYYYYYYYZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBYnYYnYNZk","kzByYYYYYNZk","kzByYRsYYNZk","kzBZZZZZZNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk",".knnnnNNNNk.","..knnnNNNk..","...knnNNk...","....knNk....",".....kk.....","............","............","............"],"banner_3":["kkkCkkkkCkkk","Y2222222222Y","z4444444444z","kzrRRssRRsZk","kzYYYYYYYYZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRwwWRRsZk","kzrwwWWWRsZk","kzrwkWWkRsZk","kzrWWWxxRsZk","kzrRWxxRRsZk","kzrRxWxWRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk",".kRRRRssssk.","..kRRRsssk..","...kRRssk...","....kRsk....",".....kk.....","............","............","............"]};
  const SR_NEWPAL = {"k":"#0b0a0e","1":"#e0b07a","2":"#c89260","3":"#a06e40","4":"#7a4e2a","5":"#5a3a20","6":"#3a2416","r":"#f07060","R":"#d84a4a","s":"#a8303a","S":"#7a2028","w":"#fffaf0","W":"#f4ead6","x":"#d4c4a4","X":"#b0a080","p":"#d8a8f0","P":"#a868d8","q":"#7a40a8","Q":"#4e2870","b":"#b8e0f8","B":"#7ab0d8","n":"#4a7aa8","N":"#2a4a70","g":"#b8e890","G":"#6cc048","h":"#4a9a34","H":"#2a6a24","y":"#fff4c0","Y":"#f2c84a","z":"#d8a030","Z":"#9a6a18","i":"#d8dce4","I":"#a8aeb8","j":"#6a6e78","J":"#3e4250","l":"#fff9d8","L":"#ffe08a","o":"#ffb050","O":"#e07a30","c":"#e8d8b8","C":"#c0a880","v":"#8a7458"};
  const srArt = (k, st, fn) => art('sr_' + k + '_' + st, () => { const nk = SR_NEW[k + '_' + st] || SR_NEW[k]; return nk ? gCanvas(fromRows(nk), SR_NEWPAL) : gCanvas(fn(st), srPal(st)); }); // 벽 깃발은 장마다 색 (2 파랑 · 3 붉은 해골)
  const SR = {};
  // 판자 (세로결): x0~x1 너비, 왼쪽이 밝음
  const plank = (x, w) => x === 0 ? 'o' : x === w - 1 ? 'p' : 'O';

  // ---- 상인 ----------------------------------------------------------------
  // 노점 뒤편: 줄무늬 차양(물결 끝단) · 두 기둥 · 판자 벽 · 선반 2단(병·단지·두루마리·작은 함) · 매단 등 · 동전 간판
  SR.stall = st => { const W = 70, H = 50, g = FG.mk(W, H);
    // 판자 벽
    FG.rect(g, 6, 12, W - 7, 44, (x, y) => (x - 6) % 7 === 0 ? 'P' : (x - 6) % 7 === 1 ? 'O' : ((x * 5 + y * 3) % 23 === 0 ? 'P' : 'p'));
    // 선반 2단
    for (const sy of [24, 35]) { FG.rect(g, 6, sy, W - 7, sy, 'o'); FG.rect(g, 6, sy + 1, W - 7, sy + 1, 'P'); for (const bx of [10, W - 11]) FG.rect(g, bx, sy + 2, bx, sy + 3, 'P'); }
    // 윗단 물건: 병 · 단지 · 두루마리 · 병
    const bottle = (x, y, c1, c2) => { FG.rect(g, x + 1, y - 7, x + 1, y - 6, 'V'); FG.put(g, x + 1, y - 8, 'v'); FG.rect(g, x, y - 5, x + 2, y - 1, (xx, yy) => xx === x ? (yy === y - 5 ? 'w' : c1) : c2); };
    const jar = (x, y, c1, c2) => { FG.rect(g, x + 1, y - 5, x + 3, y - 5, 'v'); FG.rect(g, x, y - 4, x + 4, y - 1, (xx, yy) => xx === x ? c1 : xx === x + 4 || yy === y - 1 ? c2 : (yy === y - 3 && xx === x + 1 ? 'c' : c1)); };
    const scroll = (x, y) => { FG.rect(g, x, y - 3, x + 7, y - 1, (xx, yy) => yy === y - 3 ? 'c' : yy === y - 1 ? 'v' : 'C'); FG.put(g, x + 3, y - 2, 'r'); FG.put(g, x + 3, y - 3, 'R'); };
    bottle(9, 23, 'e', 'R'); bottle(13, 23, 'u', 'U'); jar(18, 23, 'h', 'H'); scroll(25, 23); bottle(35, 23, 'm', 'M'); bottle(39, 23, 'q', 'Q'); jar(44, 23, 'C', 'v'); scroll(51, 23); bottle(60, 23, 'Y', 'G');
    // 아랫단: 작은 함 · 천 두루마리 · 단지 · 해골잔(3)/촛대(2)/허브다발(1)
    FG.rect(g, 9, 29, 17, 33, (x, y) => y === 29 ? 'g' : x === 9 ? 'o' : x === 17 || y === 33 ? 'p' : y === 31 ? 'G' : 'O'); FG.put(g, 13, 31, 'Y');
    for (const [x, c1, c2] of [[21, 'r', 'R'], [26, 'u', 'U'], [31, 'm', 'M']]) FG.rect(g, x, 30, x + 4, 34, (xx, yy) => yy === 30 ? 'c' : xx === x ? c1 : xx === x + 4 ? c2 : (yy % 2 ? c1 : c2));
    jar(39, 34, 'I', 'j'); jar(46, 34, 'e', 'R');
    if (st === 3) { FG.ell(g, 57, 31, 3, 2.6, (dx, dy) => dx + dy < -1 ? 'b' : dx + dy > 1.5 ? 'x' : 'B'); FG.put(g, 56, 31, 'k'); FG.put(g, 58, 31, 'k'); }
    else if (st === 2) { FG.rect(g, 57, 29, 57, 34, 'j'); FG.rect(g, 55, 34, 59, 34, 'J'); FG.put(g, 57, 28, 'c'); FG.put(g, 57, 27, 'f'); }
    else { for (const x of [55, 57, 59]) FG.line(g, 57, 34, x, 28, 'M'); FG.put(g, 55, 28, 'm'); FG.put(g, 59, 28, 'm'); FG.put(g, 57, 28, 'Y'); FG.rect(g, 56, 33, 58, 33, 'v'); }
    // 아래 판자 받침
    FG.rect(g, 6, 40, W - 7, 44, (x, y) => y === 40 ? 'o' : (x - 6) % 9 === 0 ? 'P' : 'O');
    // 기둥 2개
    for (const x0 of [3, W - 6]) FG.rect(g, x0, 6, x0 + 2, H - 1, (x) => plank(x - x0, 3));
    // 차양: 줄무늬 · 위는 밝고 아래는 어두움 · 물결 끝단
    for (let y = 0; y <= 14; y++) for (let x = 0; x < W; x++) {
      const inset = Math.max(0, 3 - y); if (x < inset || x > W - 1 - inset) continue;
      const sx = Math.floor(x / 7), red = sx % 2 === 0, lx = x % 7;
      if (y >= 11) { const bump = Math.hypot(lx - 3, (y - 10.5) * 1.3); if (bump > 3.6) continue; }
      let c = red ? (y < 3 ? 'e' : y < 9 ? 'r' : 'R') : (y < 3 ? 'c' : y < 9 ? 'C' : 'v');
      if (lx === 0) c = red ? 'R' : 'v'; // 주름
      if (y === 9) c = red ? 'E' : 'V';
      FG.put(g, x, y, c);
    }
    FG.rect(g, 1, 0, W - 2, 0, 'p'); // 위 장대
    // 매단 등 (왼쪽) · 동전 간판 (오른쪽)
    FG.rect(g, 15, 13, 15, 15, 'J'); FG.rect(g, 13, 16, 17, 16, 'J'); FG.rect(g, 13, 17, 17, 20, (x, y) => x === 13 || x === 17 ? 'J' : y === 17 ? 'y' : 'Y'); FG.rect(g, 14, 21, 16, 21, 'J');
    FG.rect(g, 52, 13, 52, 14, 'J'); FG.rect(g, 58, 13, 58, 14, 'J'); FG.rect(g, 50, 15, 60, 21, (x, y) => x === 50 || y === 15 ? 'o' : x === 60 || y === 21 ? 'P' : 'O');
    FG.ell(g, 55, 18, 2.4, 2.4, (dx, dy) => dx + dy < -1 ? 'y' : dx + dy > 1.2 ? 'G' : 'Y'); FG.put(g, 55, 18, 'g');
    return gOutline(g); };
  // 노점 앞 계산대: 판자 + 늘어진 보라 천(금테·술)
  SR.counter = st => { const W = 54, H = 12, g = FG.mk(W, H);
    FG.rect(g, 0, 0, W - 1, 1, (x, y) => y === 0 ? 'o' : 'O');
    FG.rect(g, 1, 2, W - 2, 9, (x, y) => { const fold = (x % 9); if (y === 2) return 'g'; if (y === 9) return x % 3 === 1 ? 'Y' : 'G'; return fold === 0 ? 'z' : fold < 3 ? 'q' : fold > 6 ? 'z' : 'Q'; });
    for (let x = 2; x < W - 2; x += 4) FG.put(g, x, 10, 'g');
    FG.put(g, Math.floor(W / 2), 5, 'Y'); FG.put(g, Math.floor(W / 2) - 1, 5, 'g'); FG.put(g, Math.floor(W / 2) + 1, 5, 'g'); FG.put(g, Math.floor(W / 2), 4, 'g'); FG.put(g, Math.floor(W / 2), 6, 'g');
    return gOutline(g); };
  // 물건 진열대: 다리 넷 + 붉은 천 덮개(금테)
  SR.stand = st => { const W = 20, H = 12, g = FG.mk(W, H);
    for (const x of [2, W - 3]) FG.rect(g, x, 5, x, H - 1, (xx, y) => y === H - 1 ? 'P' : 'p'); for (const x of [4, W - 5]) FG.rect(g, x, 5, x, H - 2, 'P');
    FG.rect(g, 0, 0, W - 1, 1, (x, y) => y === 0 ? 'e' : 'r'); FG.rect(g, 0, 2, W - 1, 4, (x, y) => y === 4 ? (x % 2 ? 'Y' : 'G') : x % 5 === 0 ? 'R' : 'r');
    return gOutline(g); };

  // ---- 모닥불 --------------------------------------------------------------
  // 돌 둘레(앞뒤 반쪽으로 나눠 불꽃이 사이에): 크기 제각각 돌 + 그을음
  SR.ringBack = st => { const W = 32, H = 10, g = FG.mk(W, H);
    for (let i = 0; i < 6; i++) { const a = Math.PI + (i + 0.5) / 6 * Math.PI, cx = 16 + Math.cos(a) * 12.5, cy = 7 + Math.sin(a) * 4.6, r = i % 3 === 1 ? 2.7 : 2.2; FG.ell(g, cx, cy, r + 0.9, r * 0.8 + 0.9, 'k'); FG.ell(g, cx, cy, r, r * 0.8, (dx, dy) => dx + dy < -0.8 ? '1' : dx + dy > 1 ? '3' : '2'); }
    return gOutline(g); };
  SR.ringFront = st => { const W = 34, H = 10, g = FG.mk(W, H);
    for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * Math.PI, cx = 17 + Math.cos(a) * 13.5, cy = 2.8 + Math.sin(a) * 4.8, r = i % 2 ? 2.9 : 2.4; FG.ell(g, cx, cy, r + 0.9, r * 0.8 + 0.9, 'k'); FG.ell(g, cx, cy, r, r * 0.8, (dx, dy) => dx + dy < -0.8 ? '1' : dx + dy > 1 ? '4' : '2'); FG.put(g, Math.round(cx - r * 0.4), Math.round(cy - r * 0.4), 'b'); }
    return gOutline(g); };
  // 통나무 의자: 나무껍질 결 · 잘린 단면 나이테 · 이끼(1)
  SR.log = st => { const W = 32, H = 10, g = FG.mk(W, H);
    FG.rect(g, 3, 1, W - 4, 8, (x, y) => y === 1 ? 'O' : y === 8 ? 'P' : (x * 3 + y * 7) % 11 === 0 ? 'P' : y < 4 ? (x % 5 === 0 ? 'p' : 'O') : 'p');
    for (const cx of [3, W - 4]) FG.ell(g, cx, 4.5, 2.6, 3.8, (dx, dy, q) => q > 0.7 ? 'O' : q > 0.35 ? 'h' : 'c');
    if (st === 1) for (const x of [10, 11, 12, 20, 21]) FG.put(g, x, 1, x % 2 ? 'm' : 'M');
    if (st === 3) { FG.ell(g, 16, 1.2, 4, 1.5, (dx) => dx < 0 ? 'h' : 'H'); } // 털가죽 깔개
    return gOutline(g); };

  // ---- 숨은 보고 --------------------------------------------------------------
  // 키 큰 화로: 받침 · 기둥 · 넓은 그릇 (불꽃은 따로 움직임)
  // v2.80 화로대 작게: 세 발 · 마디 기둥 · 넓은 그릇 · 숯 (0 9 % & = 챕터 재질 밝은→어두운)
  const BRAZ2 = ["..............", "..............", ".kkkkkkkkkkkk.", "kddFddFddFDDDk", "0000099999%%%%", "k0009999%%%&&k", "k0009999%%%&&k", ".k009999%%%&k.", "..kkk999%kkk..", ".....k0&k.....", ".....k0&k.....", ".....k0&k.....", "....k99%%k....", ".....k0&k.....", ".....k0&k.....", "....kk0&k.....", "...k%%9&&k....", "..kk%k9&k&k...", ".k%%%k9&kk&kk.", "k0%kkk9&k.k&&k"];
  SR.brazier = st => { const m = st === 2 ? ['y', 'Y', 'g', 'G'] : st === 3 ? ['I', 'j', 'J', 'S'] : ['1', '2', '3', '4'], M = { '0': m[0], '9': m[1], '%': m[2], '&': m[3] }; return fromRows(BRAZ2).map(r => r.map(c => M[c] || c)); };
  // 금화 더미: 동전 결 · 보석 · 금잔 · 왕관
  // v2.80 보물 더미(큰 언덕 · 흘러내린 동전 · 금잔 · 왕관 · 보석)와 금화 더미(낮은 더미 · 동전 탑)를 따로
  const GOLD2 = ["......................................", "......................................", "......................................", "...................kk.................", "..................kYYkk.kk..k.........", "...........kkkkkkkyYYYYkYYkkYk........", "..........kyyyyyyyGYYyYYYYYYYk........", ".......kkkyyYYYYYGYGYyqYrYYuYk........", "......kyYYYGGyyYGYyYYGGGGGGGGgk.......", "......kywYYGYYYYYYYggggggggggYgk......", "......kyYYYGYGYYYYGyGggggyggggGGk.....", "....kkyyYYYGYYYGYgGgggGgggwggGGGk.....", "...kyyGGygYGYYwgggGyggygGgugGGGGGk....", "..kyYYYYYgyYYGrygggyggggggGGGGGGGGk...", ".kGGYyYGGGGGggGgggggGggYGGGYGGGGGGYk..", ".kYYGyYYYYYgggggGggygggGGGGGGYGwGYGGk.", "kyYyyywyYYggggGyyGgGYgGGGGGGGGGmYGGGGk", "kYYGYYqYggGGygGGgggwgGGGGGYGGGGGGGGGGk", ".kGYYyygggggGygggYgrGGGGGGGGGGGGGGGGk.", "..kYGYggGggggGgGgYGGGGGGGGGGGGGGGYGk.k", "k..kGgGggggggggGgGGGYGGGGGGGGGGGGGk.kg", "Yk..kkkgggggggYYGGGGGGGGGGGGGGGkkk.k.k", "k.k....kkkkkggGGGYGGGGGGGGkkkkk...kgk.", ".kYk....kYk.kkkkkkkkkkkkkk..kgk....k.."], COINS2 = ["........................", "........................", "........................", ".........kkkkkk.........", ".......kkyywYYYkk.......", "......kyyYYrYYYYYk......", "...kkkyYGYyYYYYggyk.....", "..kyYGYYyYYyYYuggGgk....", "..kygGYYqyYyggggggggk...", "..kyYGYYYGYgggggygyYGk..", ".kyygGYYyggggggggGygGYk.", "kyYyYGYYggGggyggGGyYGGGk", "kYYygGggggggggGGGGygGGGk", "YkkYYgygGggGgGYGGGGGGkk.", "k..kkkgggggGGGGGGGkkk.k.", "..kYk.kkkkkkkkkkkk...kgk"];
  SR.gold = st => fromRows(GOLD2);
  SR.coins = st => fromRows(COINS2);
  // 수호 석상: 받침 위에 칼을 짚은 기사 (1 이끼 낀 돌 · 2 흰 대리석 · 3 나무 토템 우상)
  // v2.77 수호 석상 (외곽선은 1칸만): 재의 제단 근위기사와 같은 비율(큰 투구 · 짧은 몸) + 깃털 장식 · 뒤로 늘어진 망토 · 받침 (1 이끼 돌 · 2 흰 대리석과 금 · 4 잿빛). 3장은 나무 토템 그대로
  const STATUE_K = ["...........kkk......", "..........ka12k.....", ".........ka1k33k....", "........k121kk44k...", "........kkkk..k4k...", ".......k1a13k..k....", "......kkk13kkk......", ".....k1a111223k.....", "....k1a12222223k....", "....kGGGGGGGGG4k....", "....k44e444e444k....", "....k1222422223k....", ".....kk12k223kk.....", "...kk1112GGGk33kk...", "..k1a111kGGk22233k..", "..k1122k1GG3k2233k..", "..k112k1aGG33k233k..", "...kkkGGGGGGGGGkk...", "..k2k4122a32234k4k..", ".k22k4122a32334k44k.", ".k22k4122a32334k44k.", ".k22k412Ga3G334k44k.", "k222k4421a33344k444k", "k222k44k1a33k44k444k", "k22k44k111k33k44k44k", "k22kkkkkk33kkkkkk44k", "kkkkkkkkkkkkkkkkkkkk", "ka11111111111111123k", "k222222222222222234k", ".kkkkkkkkkkkkkkkkkk.", ".k1222222222222224k.", ".k133PPPPPPPPPP334k.", ".k13P3333333333P34k.", ".k133PPPPPPPPPP334k.", ".k1333333333333334k.", "kkkkkkkkkkkkkkkkkkkk", "ka1111111111111113kk", "k444444444444444444k", "kkkkkkkkkkkkkkkkkkkk"];
  const STATUE_MAT = { 1: { a: 'L', G: '3', P: 'n', e: '4' }, 2: { a: 'l', G: 'g', P: 'G', e: '4' }, 4: { a: 'L', G: '3', P: '4', e: '4' } };
  SR.statue = st => { if (st !== 3) { const M = STATUE_MAT[st] || STATUE_MAT[1]; const rows = STATUE_K.map(r => [...r].map(c => M[c] || c));
      if (st === 1) [[7, 7], [6, 8], [10, 5], [3, 14], [4, 15], [4, 14], [16, 20], [17, 21], [2, 23], [3, 22], [3, 27], [4, 27], [5, 28], [15, 27], [3, 31], [16, 34], [2, 36], [3, 36]].forEach(([x, y], i) => { if ('1234LIl'.includes(rows[y][x])) rows[y][x] = i % 2 ? 'm' : 'M'; }); // 이끼
      return fromRows(rows.map(r => r.join(''))); }
    const W = 22, H = 46, g = FG.mk(W, H), m = ['1', '2', '3', '4'];
    FG.rect(g, 1, 38, 20, 45, (x, y) => y === 38 ? m[0] : y === 45 || x === 20 ? m[3] : y === 41 ? m[3] : x === 1 ? m[1] : m[2]); // 받침
    FG.rect(g, 3, 36, 18, 37, (x, y) => y === 36 ? m[0] : m[2]);
    if (st === 3) { // 토템: 쌓인 얼굴 셋 + 날개
      for (const [y0, ey] of [[4, 'F'], [15, 'Y'], [26, 'F']]) { FG.rect(g, 5, y0, 16, y0 + 10, (x, y) => x === 5 ? 'o' : x === 16 ? 'p' : y === y0 ? 'o' : y === y0 + 10 ? 'P' : 'O');
        FG.rect(g, 7, y0 + 3, 8, y0 + 4, ey); FG.rect(g, 13, y0 + 3, 14, y0 + 4, ey); FG.rect(g, 8, y0 + 7, 13, y0 + 8, (x, y) => (x % 2) ? 'b' : 'k'); }
      FG.rect(g, 0, 15, 4, 17, (x, y) => y === 15 ? 'e' : 'r'); FG.rect(g, 17, 15, 21, 17, (x, y) => y === 15 ? 'e' : 'R'); FG.rect(g, 8, 0, 13, 3, (x, y) => y === 0 ? 'b' : 'B');
      return gOutline(g); }
    // 망토 (뒤, 아래로 넓어짐)
    for (let y = 12; y <= 35; y++) { const hw = 6 + (y - 12) * 0.16; for (let x = Math.ceil(11 - hw); x <= Math.floor(11 + hw); x++) FG.put(g, x, y, x - 11 < -hw + 1.5 ? m[1] : x - 11 > hw - 2 ? m[3] : m[2]); }
    for (let y = 20; y <= 35; y += 1) { FG.put(g, 6, y, m[3]); FG.put(g, 16, y, m[3]); } // 망토 주름
    // 몸통 (갑옷) · 허리띠 · 다리
    FG.rect(g, 8, 12, 14, 24, (x, y) => x === 8 ? m[0] : x === 14 ? m[2] : y === 21 ? m[3] : (y === 13 && x < 12) ? m[0] : m[1]);
    FG.rect(g, 8, 25, 10, 35, (x) => x === 8 ? m[0] : m[1]); FG.rect(g, 12, 25, 14, 35, (x) => x === 14 ? m[3] : m[2]);
    // 어깨받이
    FG.ell(g, 7, 12.5, 2.6, 2, (dx, dy) => dx + dy < -0.5 ? m[0] : m[1]); FG.ell(g, 15, 12.5, 2.6, 2, (dx, dy) => dx + dy < -0.5 ? m[1] : m[3]);
    // 투구 + 깃털장식 + 눈구멍
    FG.ell(g, 11, 7, 3.6, 4, (dx, dy) => dx + dy < -1.5 ? m[0] : dx + dy > 2 ? m[3] : m[1]); FG.rect(g, 9, 7, 13, 7, m[3]); FG.put(g, 11, 8, m[3]); FG.rect(g, 10, 10, 12, 11, m[2]);
    FG.rect(g, 10, 1, 11, 3, (x) => x === 10 ? m[0] : m[1]); FG.rect(g, 12, 0, 14, 2, (x, y) => y === 0 ? m[1] : m[2]); FG.put(g, 15, 2, m[2]);
    // 짚은 칼: 손잡이 · 가로날 · 칼날 (밝은 면 + 어두운 날선)
    FG.rect(g, 11, 14, 11, 16, m[3]); FG.put(g, 11, 13, m[0]);
    FG.rect(g, 9, 17, 13, 18, (x, y) => y === 17 ? m[0] : m[2]); FG.rect(g, 7, 18, 15, 18, (x) => x === 7 ? m[0] : x === 15 ? m[3] : m[2]);
    FG.rect(g, 10, 19, 12, 36, (x, y) => x === 10 ? m[0] : x === 12 ? m[3] : y > 33 ? m[2] : m[1]);
    if (st === 1) for (const [x, y] of [[5, 11], [6, 11], [7, 12], [16, 30], [17, 31], [5, 38], [6, 38], [7, 39], [14, 38], [3, 44], [18, 40], [11, 4]]) FG.put(g, x, y, (x + y) % 2 ? 'm' : 'M'); // 이끼
    if (st === 2) { FG.put(g, 11, 22, 'Y'); FG.put(g, 11, 23, 'g'); FG.rect(g, 3, 41, 18, 41, 'g'); } // 금 장식
    return gOutline(g); };
  // 걸개 깃발 (숨은 보고·상인): 장대 + 천 + 문장
  SR.banner = st => { const W = 16, H = 40, g = FG.mk(W, H), L = st === 3 ? ['h', 'H', 'a', 'A'] : st === 2 ? ['u', 'U', 'z', 'D'] : ['m', 'M', 'n', 'N'];
    FG.rect(g, 0, 0, 15, 1, (x, y) => y === 0 ? 'o' : 'p');
    FG.rect(g, 2, 2, 13, 30, (x, y) => x === 2 ? L[0] : x === 13 ? L[3] : x === 3 || x === 12 ? 'g' : y === 3 ? 'g' : (x % 4 === 0 ? L[2] : L[1]));
    for (let x = 2; x <= 13; x++) { const d = Math.abs(x - 7.5); for (let y = 31; y < 31 + Math.max(0, 6 - d * 0.9); y++) FG.put(g, x, y, x < 7 ? L[1] : L[2]); }
    // 문장: 왕관(1·2) / 해골(3)
    if (st === 3) { FG.ell(g, 7.5, 14, 3, 3, (dx, dy) => dy > 1.5 ? 'B' : 'b'); FG.put(g, 6, 14, 'k'); FG.put(g, 9, 14, 'k'); FG.rect(g, 6, 17, 9, 18, (x) => x % 2 ? 'b' : 'k'); }
    else { FG.rect(g, 4, 13, 11, 16, (x, y) => y === 16 ? 'G' : x === 4 ? 'y' : 'Y'); for (const x of [4, 7, 8, 11]) FG.put(g, x, 12, 'Y'); FG.put(g, 7, 15, 'r'); FG.put(g, 8, 15, 'r'); }
    return gOutline(g); };

  // ---- 잊힌 틈새 --------------------------------------------------------------
  // 대리석 제단: 윗판(상자가 놓이는 면) · 금테 두른 몸체 · 보랏빛 룬 판 · 계단 받침, 대리석 결
  // ---- 배치: 큰 물건은 뒷벽을 따라 (가운데 북문 자리는 비움), 가운데는 그 방의 쓰임새, 아래 모서리엔 잡동사니
  // ================================================================ v2.78 시설물 정비 B: 모닥불 방 · 잊힌 틈새 · 상인 등불 (진엔딩 시설과 같은 품질 · 외곽선 1칸 · 왼쪽 위 빛)
  { const hh = (x, y, s = 0) => { const v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.7) * 43758.5453; return v - Math.floor(v); };
    // 통나무 의자: 위가 밝은 껍질 · 세로 껍질 골 · 양끝도 껍질로 둥글게(단면 안 보임) · 이끼(1) / 붉은 깔개(2) / 털가죽(3)
    SR.log = st => { const W = 34, H = 12, g = FG.mk(W, H);
      FG.rect(g, 3, 1, W - 5, 10, (x, y) => { const seg = Math.floor((x + y * 3) / 4), dash = y >= 3 && y <= 8 && hh(seg, y, 3) < 0.28; return y <= 2 ? 'O' : y >= 9 ? 'P' : dash ? (y <= 4 ? 'p' : 'P') : y <= 4 ? 'o' : 'p'; }); // 결을 따라 짧게 끊긴 껍질 골
      for (const cx of [3, W - 5]) FG.ell(g, cx + (cx < 10 ? 0 : 1), 5.5, 2.8, 4.6, (dx, dy) => dy < -2.5 ? 'O' : dy > 2.5 ? 'P' : dx * (cx < 10 ? -1 : 1) > 1.4 ? 'P' : 'p'); // 끝도 껍질로 둥글게 (단면 안 보임)
      if (st === 1) for (const [x, y] of [[9, 1], [10, 1], [11, 1], [10, 2], [19, 1], [20, 1], [24, 2], [25, 1]]) FG.put(g, x, y, (x + y) % 2 ? 'm' : 'M');
      if (st === 2) FG.rect(g, 12, 1, 20, 3, (x, y) => y === 3 ? (x % 2 ? 'g' : 'R') : y === 1 ? 'e' : 'r');
      if (st === 3) FG.ell(g, 16, 2, 6, 1.8, (dx, dy) => (dx < 0 ? 'h' : 'H'));
      return gOutline(g); };
    // 불 둘레 돌: 둥근 돌마다 위 빛 · 아래 그늘 · 반짝이는 결 · 그을음
    const stone = (g, cx, cy, r, front) => FG.ell(g, cx, cy, r, r * 0.78, (dx, dy, q) => q > 0.7 && dy > 0 ? '4' : dx + dy * 1.3 < -r * 0.55 ? '1' : dx + dy > r * 0.6 ? (front ? '3' : '4') : (front ? '2' : '3')); // 위 빛 · 아래 그늘 · 그을린 밑동
    SR.ringBack = st => { const W = 34, H = 12, g = FG.mk(W, H);
      for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) / 7 * Math.PI, r = 2.2 + hh(i, 1) * 0.8; stone(g, 17 + Math.cos(a) * 13, 8 + Math.sin(a) * 5, r, false); }
      return gOutline(g); };
    SR.ringFront = st => { const W = 36, H = 12, g = FG.mk(W, H);
      for (let i = 0; i < 7; i++) { const a = (i + 0.5) / 7 * Math.PI, r = 2.6 + hh(i, 2) * 0.8; stone(g, 18 + Math.cos(a) * 14, 3 + Math.sin(a) * 5, r, true); }
      return gOutline(g); };
    // 잊힌 틈새 제단: 위 판(대리석 결 · 금 테) · 몸통 새김판(금 테두리 · 보랏빛 보석) · 양 끝 촛대 · 계단 받침
    // v2.80 돌은 어두운 대리석(5~9, 왼쪽 위 빛 · 오른쪽 그늘 · 결) · 붉은 융은 윗판에만 넓게 걸침(모서리에서 부풂 · 물결 단 · 금 테 · 금실 마름모 · 술)
    SR.altar = st => { const W = 50, H = 22, g = FG.mk(W, H), vein = (x, y) => hh(x, y, 5) < 0.09, sh = (x, a, b, c) => x < 16 ? a : x < 36 ? b : c;
      FG.rect(g, 0, 19, W - 1, 21, (x, y) => y === 19 ? (x < W - 8 ? '5' : '6') : y === 21 ? '9' : x === 0 ? '6' : vein(x, y) ? '6' : sh(x, '6', '7', '8')); // 계단 받침
      FG.rect(g, 4, 6, W - 5, 18, (x, y) => x === 4 ? '5' : x === 5 ? '6' : x === W - 5 ? '9' : x === W - 6 ? '8' : y === 18 ? '8' : y === 6 ? '9' : vein(x, y) ? sh(x, '5', '6', '7') : sh(x, '6', '7', '8')); // 몸통 (윗판 아래 그늘 한 줄)
      FG.rect(g, 1, 1, W - 2, 5, (x, y) => y === 1 ? '5' : y === 5 ? '8' : x === 1 ? '5' : x === W - 2 ? '8' : y === 4 ? ((x % 2) ? 'g' : 'Y') : vein(x, y) ? sh(x, '5', '5', '6') : y === 2 ? sh(x, '5', '6', '6') : sh(x, '6', '6', '7')); // 위 판 · 금 테
      FG.rect(g, 8, 8, W - 9, 16, (x, y) => (x === 8 || x === W - 9 || y === 8 || y === 16) ? ((x + y) % 2 ? 'g' : 'G') : y === 9 || x === 9 ? '9' : '8'); // 새김판 금 테두리 · 안쪽 그늘
      for (const gx of [13.5, W - 14.5]) { FG.ell(g, gx, 12.5, 2.4, 1.7, (dx, dy) => dx + dy < -1 ? 'q' : dx + dy > 1 ? 'z' : 'Q'); FG.put(g, Math.round(gx - 1), 12, 'w'); } // 양쪽 보석
      for (let x = 9; x <= 40; x++) { const t = (x - 9) / 31, hem = 8 + ((x - 9) % 6 < 3 ? 0 : 1) + (x === 9 || x === 40 ? -1 : 0), fold = (x - 9) % 5; // 위에만 넓게 걸친 붉은 융 (모서리를 감싸며 부풂 · 아래 끝은 물결 단 · 금 테)
        for (let y = 1; y <= hem; y++) FG.put(g, x, y, y === hem ? (x % 2 ? 'Y' : 'g') : (x === 9 || x === 40) && y > 3 ? (x === 9 ? 'g' : 'G') : y <= 3 ? (t < 0.6 ? 'e' : 'r') : y <= 5 ? (t < 0.7 ? 'r' : 'R') : fold === 1 && t < 0.5 ? 'e' : fold <= 2 ? (t > 0.7 ? 'R' : 'r') : fold === 3 ? 'R' : 'E');
        if ((x - 9) % 6 === 1) { FG.put(g, x, hem + 1, 'g'); FG.put(g, x, hem + 2, 'G'); } } // 술
      FG.rect(g, 8, 4, 8, 6, 'R'); FG.rect(g, 41, 4, 41, 6, 'E'); // 모서리에서 부푼 자락
      for (const [dx, dy] of [[0, -2], [-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2]]) FG.put(g, 24 + dx, 5 + dy, dy <= 0 ? 'Y' : 'g'); FG.put(g, 24, 5, 'r'); // 금실 마름모
      for (const cx of [5, W - 6]) FG.rect(g, cx - 1, 0, cx + 1, 0, (x) => x === cx - 1 ? 'g' : 'G'); // 촛대 받침
      return gOutline(g); };
  }
  // [종류, dx, dy, 막힘(반지름 또는 [가로, 세로]), 벽에 붙음]
  const SR_LAYOUT = {
    shop: st => [['stall', 0, -36, [134, 14]], ['counter', 0, -20, [100, 8]], ['banner', 212, -78, 0, 1], ['banner', -212, -78, 0, 1]], // v3.19 상인 노점은 가운데 · 진열대와 깃발만 (깔개 걸이 · 상자 · 술통 · 가로등 뺌)
    rest: st => [/* v3.12 비스트로: 텐트 · 장작 대신 출장 식당 소품(수레 · 술통 · 볏짚 포대)은 BISTRO가 그림 · 통나무 의자는 그대로 */ ['log', -78, 46, [52, 8]], ['log', 78, 46, [52, 8]], ...(st === 2 ? [['banner', 0, -112, 0, 1]] : [])],
    reward: st => [['statue', -118, -74, 14], ['statue', 118, -74, 14], ['brazier', -64, -36, 9], ['brazier', 64, -36, 9], ['gold', -96, 34, 20], ['coins', 98, 38, 12], /* v2.80 보물 더미 하나 + 작은 금화 더미 하나 */
      ['banner', -196, -86, 0, 1], ['banner', 196, -86, 0, 1], ['brazier', -190, 90, 9], ['brazier', 190, 90, 9]],
    secret: st => [['altar', 0, -11, [92, 14]]], // v1.11 대리석 제단 위 상자 하나만
    shrine: st => [], // v3.25 빛의 샘: 시설물 없이 원형 돌바닥 · 세 빛의 마법진 · 빛기둥 · 흰 구체 (51_shrine.js가 바닥과 빛을 그림)
  };
  const SR_TELE = { shop: [-188, 54], rest: [150, 70], reward: [-150, 66], shrine: [-206, 96] };
  const SR_FIRE = { dx: 0, dy: 10 };
  function srPlace(r, stage) {
    r.props = []; r.srp = [];
    const keep = [...Object.keys(r.doors).filter(d => r.doors[d] != null).map(d => doorIn(d, 40)), ...(r.crack ? [doorIn(r.crack.dir, 40)] : []), ...(r.tele ? [r.tele] : [])];
    const fits = (x, y, rad) => x > A.x0 + 6 && x < A.x1 - 6 && y > A.y0 - 4 && y < A.y1 - 4 && !keep.some(q => Math.hypot(q.x - x, q.y - y) < rad + 30);
    for (const [k, dx, dy, blk, wall] of SR_LAYOUT[r.type](stage)) {
      if (k === 'banner' && stage === 1) continue; // 숲엔 걸 벽이 없음
      const rad = Array.isArray(blk) ? blk[0] / 2 : blk || 10;
      let x = CX + dx, y = CY + dy;
      if ((k === 'stall' || k === 'counter') && r.type === 'shop') { const sx = r._stallX != null ? r._stallX : [0, 110, -110].find(o => fits(CX + o, CY - 36, 67)); if (sx == null) continue; r._stallX = sx; x = CX + sx; } // v3.19 상인 노점은 가운데 (북문이 있으면 옆으로)
      else if (k !== 'altar' && !fits(x, y, rad)) { x = CX - dx; if (!fits(x, y, rad)) continue; }
      if (k !== 'counter' && r.srp.some(s => s.k !== 'counter' && s.k !== 'stall' && Math.hypot(s.x - x, s.y - y) < 20)) continue;
      const s = { k, x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2, flip: x < CX && (k === 'skeleton') };
      if (k === 'banner') s.y = Math.round((A.y0 - 4) / 2) * 2; // v3.19 깃발은 작게 · 벽 위쪽에 매닮 (바닥에 서 있지 않게)
      r.srp.push(s);
      if (wall || !blk) continue;
      if (Array.isArray(blk)) { const [w, h] = blk; r.obs.push({ t: 'prop', c: false, x: s.x, y: s.y - h / 2, w, h, x0: s.x - w / 2, y0: s.y - h, x1: s.x + w / 2, y1: s.y }); }
      else r.obs.push({ t: 'prop', c: true, x: s.x, y: s.y - 2, r: blk });
    }
    // 상인: 노점 계산대 뒤에 앉음
    const st0 = r.srp.find(s => s.k === 'stall'); if (st0) r.keeper = { x: st0.x, y: st0.y + 6 };
    if (r.type === 'rest') BISTRO.place(r); // v3.10 쿠키 · 쿠오의 출장 비스트로
    const al = r.srp.find(s => s.k === 'altar'); if (al && r.chest) { al.foot = r.chest.y + 8 - al.y; r.chest.lift = 30; /* v2.80 상자가 윗판 위에 온전히 */ } // 제단은 상자보다 먼저 그림
    r.nav = buildNav(r.obs);
  }
  const SR_FOOT = { stall: 2, counter: 2, statue: 2 };
  // v2.80 시설이 차지하는 그림 칸 (바닥 자국이 겹치지 않게) — 벽에 거는 깃발은 뺌
  function srRect(s) { if (s.k === 'banner') return null; try { const st = G.stage === 4 ? 2 : G.stage, c = srArt(s.k, st, SR[s.k]); const x = s.x - c.width / 2, yb = s.y + (s.foot || 0) + 2; return { x0: x, y0: yb - c.height - (s.k === 'brazier' ? 22 : 0), x1: x + c.width, y1: yb }; } catch (e) { return null; } }
  function drawSR(s) {
    const st = G.stage === 4 ? 2 : G.stage, k = s.k;
    const c = ash4(srArt(k, st, SR[k]), 'sr_' + k);
    const x = (s.x - c.width / 2) & ~1, y = (s.y + (s.foot || 0) - c.height + 2) & ~1;
    if (k !== 'banner') { const xa = x + 4, xb = x + c.width - 4; if (xb > xa) dshRect(ctx, xa, s.y + (s.foot || 0), Math.ceil((xb - xa) / 2) * 2, 2, 0.5); }
    if (s.flip) { ctx.save(); ctx.translate(x + c.width, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0); ctx.restore(); } else ctx.drawImage(c, x, y);
    const fl = Math.floor(time * 10 + s.x * 0.37);
    if (k === 'brazier') { // 그릇 위 불꽃: 칸 단위로 일렁임
      const ph = ((fl % 4) + 4) % 4; let fc = SR_FLAME[ph]; // v1.17 불꽃 4장면을 미리 그려 둠
      if (!fc) fc = SR_FLAME[ph] = gCanvas(fromRows(FLAME2[ph]), { r: '#c83018', F: '#ff6a2a', f: '#ffb040', y: '#fff3c0' }); // v2.80 세 갈래 불꽃 혀 · 흰 심지 · 불티
      ctx.drawImage(fc, x + 2, y - 20);
      if (Math.random() < 0.25) G.parts.push({ x: s.x + rand(-6, 6), y: y - 6, vx: rand(-6, 6), vy: -rand(20, 45), t: rand(0.4, 0.8), c: pick(['#ffb040', '#ff6a2a']), g: 0, glow: true });
    }
  }
  const SR_FLAME = [], FLAME2 = [[".y....f.....", "............", "............", "......FF....", "......FF....", "......ff....", ".....Fff....", ".....FffF...", "...FFfyyF.FF", "...fFfyyF.fF", "..FfffyyFFff", "..fffyyyffff", ".Ffffyyyffff", ".FFffffffFFf"], ["............", "............", "....y....f..", "............", ".....r......", ".....FF.....", ".....FF.F...", ".F...ffFFF..", ".FF.FffFff..", ".ffFFyyfffF.", ".fffFyyffff.", ".fffFyyyfffF", ".ffffyyyfffF", ".FFffffffFFf"], ["............", "..f....y....", ".......r....", ".......F....", "......FF....", "......ffF...", "......ffF...", ".....FffF.F.", ".....FyyF.F.", "...F.fyyfffF", "..FfFfyyfffF", "..ffFyyyfffF", ".Ffffyyyffff", ".FFffffffFFf"], [".....f....y.", "............", "............", ".....r......", ".....F......", "....FFF.....", "....Fff..F..", "..F.FffF.F..", "..F.FyyF.fF.", ".FffFyyfFff.", ".FfffyyfFff.", ".FfffyyyFffF", ".ffffyyyfffF", ".FFffffffFFf"]];
  const SR_LIGHT = { brazier: [-30, 84, '255,150,60', 0.2], stall: [-70, 90, '255,200,120', 0.12] };
  function srLights(lights, R) { if (R.srp) for (const s of R.srp) { const L = SR_LIGHT[s.k]; if (L) lights.push({ x: s.x + (s.k === 'lampPost' ? 14 : s.k === 'stall' ? -56 : 0), y: s.y + L[0], r: L[1] + Math.sin(time * 9 + s.x) * 3, a: 0.75, c: L[2], ca: L[3] }); } }
  // ---- 바닥 그림 (2px 칸, 디더)
  function srFloor(g, R) {
    const st = G.stage, P = srPal(st), px = (x, y, c) => { g.fillStyle = c; g.fillRect(x & ~1, y & ~1, 2, 2); };
    const blot = (cx, cy, rx, ry, lv, col) => { for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) { const q = Math.hypot(x / rx, y / ry); if (q < 1 && dith((cx + x) >> 1, (cy + y) >> 1, lv * (1 - q))) px(cx + x, cy + y, col); } };
    if (R.type === 'shrine') SHRINE.floor(g, px, dith); // v3.25 빛의 샘: 원형 돌바닥 + 세 빛의 마법진
    if (R.type === 'shop') { // 물건 아래 짠 깔개: 테두리 띠 · 마름모 줄무늬 · 양끝 술
      const W0 = 160, H0 = 22, x0 = (CX - W0) & ~1, y0 = (CY + 28) & ~1, C = st === 2 ? ['#1e2a44', '#34406a', '#4a5c94', '#b8863a', '#d8c09a'] : st === 3 ? ['#2e1c10', '#5a3418', '#7a4a22', '#c08a3a', '#e0c08a'] : ['#2a1610', '#5a2a1a', '#7e3a22', '#c09040', '#e8d0a0'];
      for (let j = 0; j < H0; j++) for (let i = 0; i < W0; i++) { const e = Math.min(i, W0 - 1 - i, j, H0 - 1 - j); let c = e === 0 ? C[0] : e === 1 ? C[3] : e === 2 ? C[1] : ((i + j) % 8 < 1 || (i - j + 400) % 8 < 1) ? C[2] : (j === H0 >> 1 && i % 4 < 2) ? C[4] : C[1]; if (e > 2 && Math.random() < 0.04) c = C[0]; px(x0 + i * 2, y0 + j * 2, c); }
      for (let j = 1; j < H0 - 1; j += 2) { px(x0 - 2, y0 + j * 2, C[4]); px(x0 + W0 * 2, y0 + j * 2, C[4]); }
      blot(CX - 100, CY - 28, 90, 26, 0.5, 'rgba(0,0,0,.35)'); // 노점 아래 그늘
    }
    if (R.type === 'rest') { const f = { x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy };
      // v3.25 모닥불 화덕 자리: 돌을 둥글게 두른 화덕 · 안쪽 숯 바닥 · 둘레로 번진 그을음과 재 (가장자리는 디더로 바닥에 녹아듦). 천 · 나무 · 짚처럼 불붙는 깔개는 쓰지 않음
      const hsh = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }, cl = v => Math.max(0, Math.min(1, v));
      const vn = (x, y, s, k) => { const X = x / s, Y = y / s, x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, sm = t => t * t * (3 - 2 * t), a = hsh(x0 * 7 + k, y0), b = hsh(x0 * 7 + 7 + k, y0), c = hsh(x0 * 7 + k, y0 + 1), d = hsh(x0 * 7 + 7 + k, y0 + 1), u = sm(fx), v = sm(fy); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
      const SR = 64, SRY = 26, ST = { 1: ['#7a7a70', '#5e5e56', '#42423c'], 2: ['#6e6a78', '#55515f', '#3a3644'], 3: ['#7e7062', '#605448', '#443a30'], 4: ['#86828c', '#686470', '#4a4650'] }[st] || ['#6e6a78', '#55515f', '#3a3644'];
      // 1) 그을음 · 재: 화덕에서 멀수록 옅게, 덩어리 소음으로 가장자리가 들쭉날쭉
      for (let y = -60; y <= 60; y += 2) for (let x = -134; x <= 134; x += 2) { const X = f.x + x, Y = f.y + y, u = Math.hypot(x / 130, y / 56); if (u > 1.05) continue;
        const N = vn(X, Y * 2.2, 14, 21), lv = cl((1 - u) * 1.15 + (N - 0.5) * 0.7) * 0.9; if (!dith(X >> 1, Y >> 1, lv)) { if (u < 0.95 && dith((X >> 1) + 2, (Y >> 1) + 1, 0.05)) px(X, Y, '#6a645c'); continue; } // 가장자리엔 재 티끌
        px(X, Y, u < 0.5 ? (hsh(X, Y) < 0.5 ? '#221e1c' : '#2a2522') : u < 0.78 ? '#332e2a' : '#3e3832'); }
      // 2) 화덕 안쪽: 숯 바닥 + 사그라든 불씨
      for (let y = -SRY; y <= SRY; y += 2) for (let x = -SR; x <= SR; x += 2) { const u = Math.hypot(x / (SR - 7), y / (SRY - 4)); if (u > 1) continue; const X = f.x + x, Y = f.y + y, n = hsh(X * 3, Y);
        px(X, Y, n < 0.04 ? '#c0501a' : n < 0.06 ? '#ff8a3a' : n < 0.4 ? '#1a1614' : '#14100f'); }
      // 3) 화덕 돌: 둥글게 두른 돌 16개 — 두어 개는 빠지거나 밖으로 굴러가 있음
      const NS = 22;
      for (let k = 0; k < NS; k++) { const a = k / NS * TAU + 0.1, r0 = hsh(k, 41); if (r0 < 0.12) continue; const out = r0 > 0.9 ? 1.45 : 1;
        const sx = Math.round((f.x + Math.cos(a) * SR * out) / 2) * 2, sy = Math.round((f.y + Math.sin(a) * SRY * out) / 2) * 2, w = 4 + (hsh(k, 43) < 0.5 ? 1 : 0), h = 3;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const e = (i === 0 || i === w - 1) && (j === 0 || j === h - 1); if (e) continue;
          px(sx + (i - (w >> 1)) * 2, sy + (j - 1) * 2, j === 0 ? ST[0] : j === h - 1 ? ST[2] : ST[1]); }
        px(sx + ((w >> 1) - 1) * 2, sy + 4, '#1a1614'); } // 돌 아래 그늘 한 칸
    }
    if (R.type === 'reward') { // 판석 원판 · 금 상감 고리 · 룬 — v3.25 빛의 샘처럼 가장자리가 부서지며 바닥에 녹아듦 (계단 옆면 · 외곽선 없앰)
      const cx = CX, cy = CY - 14, RX = 112, RY = 52, S = [P['1'], P['2'], P['3'], P['4']];
      const hsh = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }, cl = v => Math.max(0, Math.min(1, v));
      const vn = (x, y, s, k) => { const X = x / s, Y = y / s, x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, sm = t => t * t * (3 - 2 * t), a = hsh(x0 * 7 + k, y0), b = hsh(x0 * 7 + 7 + k, y0), c = hsh(x0 * 7 + k, y0 + 1), d = hsh(x0 * 7 + 7 + k, y0 + 1), u = sm(fx), v = sm(fy); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
      for (let y = -RY - 2; y <= RY + 2; y += 2) for (let x = -RX - 2; x <= RX + 2; x += 2) {
        const q = Math.hypot(x / RX, y / RY); if (q > 1) continue;
        const ang = Math.atan2(y / RY, x / RX), ring = q * 5 | 0, seg = ((ang + Math.PI) / TAU * (8 + ring * 4)) | 0, X = cx + x, Y = cy + y, bx = X >> 1, by = Y >> 1;
        const N = vn(X, Y * 2.1, 16, 3), N2 = vn(X, Y * 2.1, 6, 8), keep = 1 - cl((q - 0.72) / 0.28 * 1.15 + (N - 0.5) * 0.9 + (N2 - 0.5) * 0.35);
        if (keep < 1 && !dith(bx, by, keep)) { if (keep > 0.15 && dith(bx + 1, by + 2, 0.12)) px(X, Y, S[3]); continue; } // 깎인 가장자리 · 부스러기
        if (ring >= 3 && hsh(seg * 31 + ring, 17) < (ring - 2) * 0.22) { if (dith(bx, by, 0.16)) px(X, Y, S[3]); continue; } // 바깥 고리 판석이 군데군데 빠짐
        let c = (seg + ring) % 2 ? S[1] : S[2];
        if (Math.abs(q - 0.62) < 0.035 || Math.abs(q - 0.93) < 0.03) c = Math.abs(q - 0.62) < 0.035 ? '#e0a030' : S[3];
        if (q < 0.25) c = (x + y) % 4 ? S[0] : S[1];
        if (q > 0.7 && q < 0.88 && seg % 3 === 0 && Math.abs((q - 0.79)) < 0.04) c = '#ffd060'; // 룬 점
        if ((x * 3 + y * 7) % 37 === 0) c = S[3]; // 금
        px(X, Y, c);
      }
    }
    if (R.type === 'secret') blot(CX, CY - 4, 70, 18, 0.6, 'rgba(0,0,0,.35)'); // v1.11 제단 그늘만
  }
  // 방 종류·챕터별 배치표: [소품, x, y] — 큰 장면 하나가 아니라 이야기가 있는 자리 배치
;

// ==================================================================== 06_rooms_decor.js
'use strict';
// 잿빛 왕관 토벌대 — 06_rooms_decor.js : NPC 말주머니, 전설 무기 독백·시네마틱, 방 꾸미기, 4장 왕도 오브젝트, 맵 분위기, 칸 묶음 최적화, 문 표시, 미니맵·지도·순간이동
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ v1.10 NPC 말주머니 · 가격표
  // 말주머니: 밝은 바탕 + 검은 외곽선 + 아래 꼬리 (2px 칸). 가까이 오면 한 번 인사, 머무는 동안은 9~13초마다 한 줄, 3.2초 보임. 같은 줄 연달아 안 나옴
  const NPC_TALK = {};
  function npcTalk(key, near, lines, greet) {
    const s = NPC_TALK[key] || (NPC_TALK[key] = { line: null, until: 0, next: 0, near: false });
    if (near && !s.near && time >= s.next - 7) { s.line = greet ? pick(greet) : pick(lines); s.until = time + 3.2; s.next = time + rand(9, 13); }
    else if (near && time >= s.next) { let l = pick(lines); if (l === s.line && lines.length > 1) l = pick(lines.filter(x => x !== s.line)); s.line = l; s.until = time + 3.2; s.next = time + rand(9, 13); }
    s.near = near;
    return time < s.until ? s : null;
  }
  const BUBBLES = [], BUB_RECTS = [], BUB_LAST = new Map(); // BUB_RECTS: 이번 화면에 그린 말주머니 · 키 안내 자리 (화면 좌표) — 그 위에선 마우스 커서를 숨김
  function drawBubble(text, x, y, side = 0) { if (drawBubble.mute) return; BUBBLES.push([text, x, y, side]); } // mute: 흑백 연출용으로 앞쪽 물체를 한 번 더 그릴 때는 말주머니를 다시 넣지 않음 (v3.19 말주머니가 두 개씩 뜨던 문제)
  // v3.18 대화 말주머니의 F 안내: 방금 그린 말주머니 오른쪽 위 모서리에, 말주머니 오른쪽 끝을 넘지 않게 (화면 좌표)
  function bubbleKey(text, label, fx, fy) { const b = BUB_LAST.get(text); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const bob = Math.floor(time * 2.5) % 2;
    if (!b) drawKeyTag(ctx, fx, fy, 'F', label, { left: true });
    else { ctx.font = '9px Galmuri9'; const lw = Math.round(ctx.measureText(label).width); ctx.font = '8px Galmuri7'; const kw = Math.max(11, Math.round(ctx.measureText('F').width) + 8), tw = 4 + kw + 4 + lw + 6, x0 = Math.round(b.x + b.w - 6);
      if (x0 + tw <= VW - 2) drawKeyTag(ctx, x0, b.y + 8 + bob, 'F', label, { left: true }); // 평소: 말주머니 오른쪽 위 모서리에 걸쳐 바깥으로 (글자를 가리지 않음)
      else drawKeyTag(ctx, b.x + b.w, b.y - 8 + bob, 'F', label, { right: true }); } // 화면 오른쪽 끝이라 나가면: 말주머니 위로 올려 오른쪽 끝에 맞춤
    ctx.restore(); }
  function flushBubbles() {
    BUB_LAST.clear(); drawBubble.mute = false;
    if (G && G.player && !G.player.dead && P_BUBBLE.until > time && P_BUBBLE.text) {
      if (P_BUBBLE.seq) for (const q of P_BUBBLE.seq) if (q.s <= time) P_BUBBLE.text = q.t; drawBubble(P_BUBBLE.text, G.player.x, G.player.y - 38, 0); // v3.19 말주머니는 캐릭터 동작(들림 · 숨쉬기)에 따라 위아래로 흔들리지 않음
    }
    // v3.18 말주머니끼리 겹치면 나중 것을 겹친 말주머니 위로 올려 쌓음 (겹쳐 그려져 깨져 보이지 않게)
    const placed = []; ctx.font = '10px Galmuri9';
    for (const b of BUBBLES) { if (b[3] < 0) continue; const note = b[0].endsWith('♪'), t = (note ? b[0].slice(0, -1) : b[0]).replace(/[{}]/g, ''), w = ((Math.ceil(ctx.measureText(t).width) + (note ? 14 : 0) + 14) & ~1) + 6, h = 30;
      for (let k = 0; k < 6; k++) { const x0 = b[1] - w / 2, y0 = b[2] - h, hit = placed.find(p => x0 < p[0] + p[2] && p[0] < x0 + w && y0 < p[1] + p[3] && p[1] < y0 + h); if (!hit) break; b[2] = hit[1] - 2; }
      placed.push([b[1] - w / 2, b[2] - h, w, h]); }
    for (const b of BUBBLES) paintBubble(b[0], b[1], b[2], b[3]);
    BUBBLES.length = 0;
  }
  // ---------------------------------------------------------------- [1] 전설 무기 독백·말풍선 데이터 및 렌더러
  const SK_TO_FX = {
    sun: 'bulwark', exec: 'execsword',
    fangs2: 'fangs', nine: 'nine',
    ashstar2: 'ashstar', hourglass: 'hourglass',
    dawn: 'dawn', spear: 'spearrain',
    undertaker: 'undertaker', kingrev: 'kingrev',
  };

  const LEGEND_LORE = {
    // 1. 기사 (인간 / 대검)
    bulwark: {
      cls: 'knight', name: '별의 서약 대검', c: '#ffc040',
      pickupBubble: '…아직 따뜻하네.',
      pickupMono: [
        '자루에 묶인 붉은 천이 잿가루 속에서도 색을 잃지 않았다.',
        '누가 묶어줬는지는 잘 기억나지 않는다.',
        '그래도 손에 쥐니, 오래 식어 있던 금속에서 희미한 온기가 올라온다.',
      ],
      bossBubble: '이 밤도 슬슬 끝낼 때가 됐지.',
      bossIntro: [
        '그 왕관 아래에 남은 불씨가 아직 꺼지지 않았군.',
        '내가 들고 온 이 검이, 길었던 밤을 끝낼 수 있을지 보자.',
      ],
      coronationBubble: '왕관을 고쳐 쓰는 손길이… 어딘가 익숙한데.',
    },
    execsword: {
      cls: 'knight', name: '잿빛 왕의 처형검', c: '#ff7a30',
      pickupBubble: '사슬이 손목에 감기네.',
      pickupMono: [
        '붉은 천 대신 차가운 쇠사슬이 자루에 감겨 있다.',
        '들어 올리자마자 사슬이 손목을 따라 단단히 조여 든다.',
        '처음 보는 검인데도, 손바닥의 굳은살이 자루의 홈에 딱 맞는다.',
      ],
      bossBubble: '거울을 마주 보고 선 기분이네.',
      bossIntro: [
        '네가 짚고 선 홀의 금 간 자국과, 이 검날의 결이 똑같군.',
        '그 투구 안에 누구 얼굴이 들어 있는지는 묻지 않겠다.',
        '집행인은 원래 상대 얼굴을 기억하지 않는 법이니까.',
      ],
      coronationBubble: '아직 끝난 거 아니다.',
    },

    // 2. 암살자 (고양이 수인 / 쌍검)
    fangs: {
      cls: 'ranger', name: '쌍둥이 송곳니', c: '#ff5060',
      pickupBubble: '오래된 피 냄새가 배어 있네.',
      pickupMono: [
        '가드 아래 홈을 따라 검붉은 자국이 희미하게 남아 있다.',
        '그림자 안으로 몸을 숨길 때마다 등 뒤가 서늘하다.',
        '예전에 실패했던 의뢰의 감각이 칼날에 그대로 남아 있는 듯하다.',
      ],
      bossBubble: '이번엔 빗나가지 않아.',
      bossIntro: [
        '등 뒤를 잡는 건 내 쪽이 훨씬 빠르지.',
        '네 목이 이미 한쪽으로 꺾여 있고, 가슴엔 불씨만 남았어도 상관없어.',
        '숨통이 없다면, 그 불씨라도 끄고 갈게.',
      ],
      coronationBubble: '그림자가 겹치네… 빠져나갈 생각 마.',
    },
    nine: {
      cls: 'ranger', name: '아홉 목숨', c: '#a890ff',
      pickupBubble: '아직 한 번쯤은 더 남았겠지.',
      pickupMono: [
        '자루에 박힌 노란 보석이 촛불처럼 희미하게 반짝인다.',
        '허공을 베면 반 박자 늦게 옅은 잔상이 같은 자리를 따라 벤다.',
        '하나, 둘… 여덟. 전부 내가 여기까지 오면서 흘려둔 흔적들이구나.',
      ],
      bossBubble: '이번엔 혼자 온 게 아니야.',
      bossIntro: [
        '여기까지 오는 동안 여덟 번은 쓰러졌던 것 같아.',
        '그때마다 남았던 그림자들이 아직 내 뒤에 남아 있거든.',
        '이번이 아홉 번째야. 더 아껴둘 목숨도 없으니 끝까지 가보자.',
      ],
      coronationBubble: '다들 지켜보고 있어. 이제 그만 끝내자.',
    },

    // 3. 마법사 (여우 수인 / 지팡이)
    ashstar: {
      cls: 'mage', name: '잿빛 별의 홀', c: '#ffb060',
      pickupBubble: '그날 밤 떨어진 별 조각이 아직 뜨겁네.',
      pickupMono: [
        '유리 구슬 안에서 식지 않은 재가 천천히 맴돈다.',
        '왕도 위로 쏟아지던 유성을 이 작은 구슬에 담아보려 했었지.',
        '무리한 계산이었다는 걸… 아직도 식지 않은 이 열기가 말해준다.',
      ],
      bossBubble: '아직 그날 밤에서 못 벗어났군요, 폐하.',
      bossIntro: [
        '왕관에 박힌 세 파편이 내 지팡이의 별과 같은 빛을 내고 있어요.',
        '우리가 지키려던 성은 이미 바닥의 돌조각과 함께 재가 됐는데,',
        '당신도 나도 아직 그 밤에 멈춰 서 있네요.',
      ],
      coronationBubble: '부서진 궤도를 억지로 붙잡아봐야 무너질 뿐이에요.',
    },
    hourglass: {
      cls: 'mage', name: '모래시계 지팡이', c: '#ffd34d',
      pickupBubble: '…결국 이걸 다시 잡게 되네.',
      pickupMono: [
        '금빛 톱니 안쪽에서 모래알이 거꾸로 위를 향해 올라간다.',
        '째깍이는 소리 하나 없이 조용하다.',
        '멸망을 찰나의 시간만큼 미뤄보겠다고 돌렸던 지팡이가, 다시 내 손에 들어왔다.',
      ],
      bossBubble: '멈춘 시간 속에서 우리만 지쳐가네요.',
      bossIntro: [
        '원망해도 할 말은 없어요.',
        '당신이 죽지도 못한 채 왕좌를 지키게 붙들어 둔 건, 시간을 되돌린 내 술식이었으니까.',
        '자, 모래시계를 한 번만 더 뒤집어 볼까요. 미뤄둔 끝이 어떻게 올지.',
      ],
      coronationBubble: '모래가 거꾸로 쏟아져… 예전 일까지 끌어오려는 건가!',
    },

    // 4. 사제 (토끼 수인 / 메이스)
    dawn: {
      cls: 'priest', name: '별빛 성가', c: '#ffe08a',
      pickupBubble: '…이 빛, 어디서 오는 걸까요.',
      pickupMono: [
        '날개 장식 안쪽의 보석에서 미지근한 온기가 번진다.',
        '깊은 상처를 아물게 하진 못해도, 잠시 통증을 덮어줄 수는 있는 빛.',
        '다들 기도를 멈춘 뒤에도, 이 메이스만은 옛 성가의 가락을 기억하고 있나 보다.',
      ],
      bossBubble: '이제는 편히 쉬실 때가 됐습니다.',
      bossIntro: [
        '성 밖에서 왕비께서 아직도 당신을 기다리며 울고 계셨습니다.',
        '응답은 오지 않았고 기도는 닿지 않았지만,',
        '지친 그 어깨에 마지막 축복을 올릴 힘 정도는 아직 남아 있습니다.',
      ],
      coronationBubble: '편히 눈을 감는 것조차 허락받지 못하셨군요.',
    },
    spearrain: {
      cls: 'priest', name: '날개 달린 성창', c: '#ff9a8a',
      pickupBubble: '기도만으론 아무도 못 살려요.',
      pickupMono: [
        '날개 장식 아래, 검붉게 물든 붉은 리본이 단단히 묶여 있다.',
        '어느 기사의 검에서 풀려나 내 창에 묶인, 끝내 지키지 못한 약속.',
        '기적이라는 건 기도가 아니라, 누군가의 피로 겨우 이어지는 거라는 걸 이제는 안다.',
      ],
      bossBubble: '그 불씨를 빌려서라도 이 기적을 이어가겠습니다.',
      bossIntro: [
        '저 위로 떨어지는 빛의 창들을 보십시오.',
        '예전처럼 상처를 꿰매던 사제는 성채가 무너지던 날 이미 죽었습니다.',
        '당신 가슴속에 남은 그 불씨를 보태서라도, 꺼지지 않는 성소를 세우겠습니다.',
      ],
      coronationBubble: '더 불러내십시오. 기적이 멈추지 않게.',
    },

    // 5. 거너 (늑대 수인 / 머스킷)
    undertaker: {
      cls: 'gunner', name: '장의사의 머스킷', c: '#7aff9a',
      pickupBubble: '익숙한 나무 냄새네. 내가 짜던 관짝이랑 같아.',
      pickupMono: [
        '개머리판에 박힌 은 못이 손바닥에 서늘하게 닿는다.',
        '왕도의 시신들을 묻을 때 쓰던 연장이, 이제는 총이 되어 어깨에 걸린다.',
        '땅에 묻혀야 할 것들이 걸어 다니니, 장의사가 총을 드는 것도 이상할 건 없지.',
      ],
      bossBubble: '네 치수에 맞는 관은 아직 못 짰는데 말이야.',
      bossIntro: [
        '성문 밖에서 네 근위병들이 아직도 빈 관을 메고 돌아다니더군.',
        '내가 직접 못을 박아 묻어줬던 녀석들인데 말이야.',
        '죽은 사람이 땅 위를 어슬렁거리는 건 질색이야. 이제 그만 누워, 폐하.',
      ],
      coronationBubble: '남의 무덤까지 다 헤집어 놓을 셈인가.',
    },
    kingrev: {
      cls: 'gunner', name: '왕의 연발총', c: '#ffd34d',
      pickupBubble: '…여섯 번째 약실은 아직 비어 있네.',
      pickupMono: [
        '낡은 붉은 손잡이 위로 작은 왕관 문양이 새겨져 있다.',
        '실린더를 돌려 닫자 묵직한 쇠 소리가 손목에 울린다.',
        '내가 정신을 잃으면 여섯 번째 탄환으로 끝내 달라고… 그때 분명 그렇게 말했지.',
      ],
      bossBubble: '약속했던 여섯 발이야. 이번엔 끝내자.',
      bossIntro: [
        '아직 사람의 눈을 하고 있을 때, 네가 내 손에 직접 쥐여준 총이야.',
        '앞의 다섯 발은 네 움직임을 멈추는 데 쓰지.',
        '마지막 여섯 번째 탄환은, 그 왕관을 부수는 데 쓸 거다.',
      ],
      coronationBubble: '실린더 돈다. 비켜, 마지막 한 발 남았어.',
    },
  };

  // 현재 장착 중인 전설 무기의 LEGEND_LORE 키 반환
  function eqLegendKey() {
    if (!G) return null;
    const it = eqWeapon(G.cls);
    if (!it) return null;
    if (it.fx && LEGEND_LORE[it.fx]) return it.fx;
    const sk = wSkill();
    return (sk && SK_TO_FX[sk]) || null;
  }

  // 플레이어 머리 위 도트 말풍선 타이머 상태 (전투 중 단문용)
  const P_BUBBLE = { text: null, until: 0 };
  function sayPlayer(text, dur = 3.8) {
    if (!text) return;
    // v3.20 문장이 둘 이상이면 한 말주머니에 몰지 않고 문장마다 차례로 띄움 (문장당 최소 1.6초) · '|'가 있으면 그 자리에서만 나눔
    const parts = (String(text).includes('|') ? String(text).split('|') : String(text).split(/(?<=[.!?])\s+/)).map(s => s.trim()).filter(Boolean), per = parts.length > 1 ? Math.max(1.6, dur / parts.length) : dur;
    P_BUBBLE.text = parts[0]; P_BUBBLE.seq = parts.length > 1 ? parts.map((t, i) => ({ t, s: time + i * per })) : null;
    P_BUBBLE.until = time + per * parts.length;
  }

  // 시네마틱 암전 스포트라이트 + 레터박스 시스템 (방식 1)
  function setHudDim(on) {
    const ids = ['party', 'phase', 'bkPanel', 'boss', 'skills', 'keyguide', 'lootFeed', 'gearCmp', 'mute', 'banner', 'tutBar'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.style.transition = 'opacity 0.25s ease';
      el.style.opacity = on ? '0' : '';
      el.style.pointerEvents = on ? 'none' : '';
    }
  }

  function ensureCineBox() {
    let el = document.getElementById('cineBox');
    if (el) return el;
    const ui = document.getElementById('ui');
    if (!ui) return null;
    el = document.createElement('div');
    el.id = 'cineBox';
    el.style.cssText = [
      'position:absolute',
      'left:50%',
      'bottom:26px',
      'transform:translateX(-50%)',
      'width:640px',
      'max-width:92%',
      'text-align:center',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 0.2s ease',
      'z-index:60',
    ].join(';');
    ui.appendChild(el);
    return el;
  }

  function renderCineBox() {
    const c = G && G.cine;
    const el = ensureCineBox();
    if (!el) return;
    if (!c) { el.style.opacity = '0'; el.innerHTML = ''; return; }
    const line = c.lines[c.idx] || '';
    el.innerHTML = `<div style="font:11px Galmuri9;color:#ffffff;line-height:1.55;letter-spacing:0.2px">${line}</div>`;
    el.style.opacity = '1';
  }

  function startCinematic(lines, title, col = '#ffd34d', focus = 'player', onDone = null) {
    if (!G || !lines || !lines.length) return;
    G.cine = {
      lines: lines.slice(),
      idx: 0,
      title,
      col,
      focus,
      t: 0,
      cd: 0.22,
      click: false,
      onDone,
    };
    for (const k in keys) keys[k] = false;
    for (const k in pressed) pressed[k] = false;
    mouse.down = false; mouse.rdown = false;
    setHudDim(true);
    renderCineBox();
  }

  function endCinematic() {
    if (!G || !G.cine) return;
    const cb = G.cine.onDone;
    G.cine = null;
    for (const k in keys) keys[k] = false;
    for (const k in pressed) pressed[k] = false;
    setHudDim(false);
    renderCineBox();
    if (cb) cb();
  }

  function updateCine(rdt) {
    const c = G && G.cine;
    if (!c) return;
    c.t += rdt;
    c.cd = Math.max(0, c.cd - rdt);
    const esc = take('escape');
    const next = take(' ') || take('f') || take('enter') || take('j') || c.click;
    c.click = false;
    if (c.cd > 0) return;
    if (esc) { sfx('blip'); endCinematic(); return; }
    if (next) {
      sfx('blip');
      if (c.idx < c.lines.length - 1) {
        c.idx++;
        c.cd = 0.16;
        renderCineBox();
      } else {
        endCinematic();
      }
    }
  }

  // 2px 도트 격자 기반 4x4 바이어 디더 원형 스포트라이트 (맵 전체 완전 블랙)
  const CINE_B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let CINE_CV = null, CINE_CTX = null, CINE_IM = null;
  function drawCinematic() {
    const c = G && G.cine;
    if (!c) return;
    const k = Math.min(1, c.t / 0.24);
    const cw = VW >> 1, ch = VH >> 1; // 384 x 216 (2px 도트 단위)
    if (!CINE_CV) {
      CINE_CV = document.createElement('canvas');
      CINE_CV.width = cw; CINE_CV.height = ch;
      CINE_CTX = CINE_CV.getContext('2d');
      CINE_IM = CINE_CTX.createImageData(cw, ch);
    }
    const P = G.player;
    const px = (P ? P.x - cam.x : VW / 2) * 0.5;
    const py = (P ? P.y - 14 - cam.y : VH / 2) * 0.5;
    const B = G.boss && !G.boss.dead && c.focus === 'both' ? G.boss : null;
    const bx = B ? (B.x - cam.x) * 0.5 : px;
    const by = B ? (B.y - 24 - cam.y) * 0.5 : py;
    const rP = 34 * k + (1 - k) * 180; // 플레이어 스포트라이트 반경 (2px 셀 기준)
    const rB = 46 * k + (1 - k) * 180; // 보스 스포트라이트 반경
    const feather = 18;
    const d = CINE_IM.data;
    for (let y = 0; y < ch; y++) {
      const y4 = (y & 3) << 2;
      const dyP = y - py, dyB = y - by;
      for (let x = 0; x < cw; x++) {
        const dxP = x - px;
        let light = 1 - (Math.hypot(dxP, dyP) - (rP - feather)) / feather;
        if (B) {
          const dxB = x - bx;
          const lB = 1 - (Math.hypot(dxB, dyB) - (rB - feather)) / feather;
          if (lB > light) light = lB;
        }
        light = light < 0 ? 0 : light > 1 ? 1 : light;
        // 4x4 바이어 디더: 빛이 닿는 원 안쪽은 투명(0), 바깥쪽은 완전 블랙(255)
        const thr = (CINE_B4[y4 | (x & 3)] + 0.5) / 16;
        const a = light > thr ? 0 : Math.round(255 * k);
        const idx = (y * cw + x) << 2;
        d[idx] = 0; d[idx + 1] = 0; d[idx + 2] = 0; d[idx + 3] = a;
      }
    }
    CINE_CTX.putImageData(CINE_IM, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(CINE_CV, 0, 0, VW, VH);
    ctx.restore();
  }

  // (A) 전설 무기 최초 습득 트리거 -> 시네마틱
  function triggerLegendPickup(it) {
    if (!it || it.grade !== 'legend') return;
    const fxKey = (it.fx && LEGEND_LORE[it.fx]) ? it.fx : (it.wk != null && it.cls ? (wcat(it.cls)[it.wk] || {}).fx : null);
    const L = fxKey && LEGEND_LORE[fxKey];
    if (!L) return;
    G.seenLegendLore = G.seenLegendLore || {};
    if (G.seenLegendLore[fxKey]) return;
    G.seenLegendLore[fxKey] = true;
    sayPlayer(L.pickupBubble, 3.5); // v3.19 암전 독백 연출 삭제 (사용자 결정) — 말주머니만 남김
  }

  // (B) 4장 잿빛 왕 조우 트리거 -> 시네마틱 (플레이어 + 왕 스포트라이트)
  function triggerAshKingIntro() {
    const fxKey = eqLegendKey(), L = fxKey && LEGEND_LORE[fxKey];
    if (!L) return;
    sayPlayer(L.bossBubble, 3.8); // v3.19 암전 독백 연출 삭제 (사용자 결정) — 말주머니만 남김
  }

  // (C) 4장 잿빛 왕 2단계 『대관식』 전환 트리거 -> 전투 중이므로 짧은 말풍선만 유지
  function triggerAshKingCoronation() {
    const fxKey = eqLegendKey(), L = fxKey && LEGEND_LORE[fxKey];
    if (!L) return;
    sayPlayer(L.coronationBubble, 4.0);
  }

  // (D) v2.55 처치 직후 무기별 시네마틱 「왕관의 잔향」 폐기 — 엔딩은 무기와 상관없이 하나
  // v2.93 말끝의 ♪는 글꼴에 없어서 2px 칸 도트 음표로 그린다
  const NOTE_G = ['..kkk', '..k.k', '..k..', 'kkk..', 'kkk..'];
  function paintBubble(text, x, y, side) { // (x, y) = 꼬리 끝. side 0: 몸통이 위, 꼬리 아래로 / side -1: 몸통이 왼쪽, 꼬리 오른쪽으로
    const note = text.endsWith('♪'); if (note) text = text.slice(0, -1);
    ctx.font = '10px Galmuri9'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const plain = text.replace(/[{}]/g, ''), HLF = 'bold 12px Galmuri11', segW = () => text.split(/(\{[^}]*\})/).filter(Boolean).reduce((a_, q) => { if (q[0] === '{') { ctx.font = HLF; const v = ctx.measureText(q.slice(1, -1)).width; ctx.font = '10px Galmuri9'; return a_ + v; } return a_ + ctx.measureText(q).width; }, 0), tw = Math.ceil(plain === text ? ctx.measureText(plain).width : segW()) + (note ? 14 : 0), /* v3.84 {강조}는 한 단계 큰 굵은 글꼴(Galmuri11 Bold) */ w = (tw + 14) & ~1, h = 16, X = Math.round(x) & ~1, Y = Math.round(y) & ~1;
    let bx = side < 0 ? X - 6 - w : (X - (w >> 1)) & ~1; const by = side < 0 ? Y - 8 : Y - h - 6;
    { const m = ctx.getTransform(); // v3.18 화면 밖으로 잘리지 않게 몸통만 안쪽으로 (꼬리는 그대로) · 말주머니 자리를 기록해 마우스 커서를 숨김
      if (side >= 0 && m.a === 1) { const sx = bx + m.e, lo = 4 - sx, hi = VW - 4 - (sx + w); if (lo > 0) bx += (lo + 1) & ~1; else if (hi < 0) bx -= (-hi + 1) & ~1; bx = Math.max(Math.min(bx, X - 6), X + 6 - w); } // 꼬리는 몸통 안쪽에 남게
      BUB_RECTS.push([m.a * (bx - 2) + m.e, m.d * (by - 2) + m.f, m.a * (w + 4), m.d * (h + 10)]); BUB_LAST.set(text, { x: m.a * bx + m.e, y: m.d * by + m.f, w: m.a * w }); }
    ctx.fillStyle = '#0b0a0e'; ctx.fillRect(bx + 2, by - 2, w - 4, h + 4); ctx.fillRect(bx, by, w, h); ctx.fillRect(bx - 2, by + 2, w + 4, h - 4); // 외곽선(모서리 깎음)
    ctx.fillStyle = '#f4ead2'; ctx.fillRect(bx + 2, by, w - 4, h); ctx.fillRect(bx, by + 2, w, h - 4);
    ctx.fillStyle = '#d8c8a4'; ctx.fillRect(bx + 2, by + h - 2, w - 4, 2); // 아래 그늘
    if (side < 0) { // 오른쪽 꼬리
      const ty = by + 4; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(bx + w, ty - 2, 2, 8); ctx.fillRect(bx + w + 2, ty, 2, 4); ctx.fillRect(bx + w + 4, ty + 2, 2, 2);
      ctx.fillStyle = '#f4ead2'; ctx.fillRect(bx + w - 2, ty, 4, 4);
    } else {
      const tx = X - 2; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(tx - 2, by + h, 8, 2); ctx.fillRect(tx, by + h + 2, 4, 2); ctx.fillRect(tx + 2, by + h + 4, 2, 2);
      ctx.fillStyle = '#d8c8a4'; ctx.fillRect(tx, by + h, 4, 2); ctx.fillStyle = '#f4ead2'; ctx.fillRect(tx, by + h - 2, 4, 2);
    }
    if (plain === text) { ctx.fillStyle = '#2a1e18'; fillTextW(text, bx + w / 2 - (note ? 7 : 0), by + 12); }
    else { ctx.textAlign = 'left'; let cx = Math.round(bx + w / 2 - (note ? 7 : 0) - segW() / 2); // v3.20 {강조}: 해 · 낮 같은 말은 다른 색 (엠브라즈 말주머니와 같은 색)
      for (const [s_, hl] of text.split(/(\{[^}]*\})/).filter(Boolean).map(q => q[0] === '{' ? [q.slice(1, -1), 1] : [q, 0])) { ctx.font = hl ? HLF : '10px Galmuri9'; ctx.fillStyle = hl ? '#c0601a' : '#2a1e18'; fillTextW(s_, cx, by + 12 + hl); cx += ctx.measureText(s_).width; }
      ctx.font = '10px Galmuri9'; ctx.textAlign = 'center'; }
    if (note) { const nx = (bx + w - 18) & ~1, ny = by + 3; NOTE_G.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === 'k') ctx.fillRect(nx + i * 2, ny + j * 2, 2, 2); }); }
  }
  function drawPriceTag(price, x, y, ok) { // 동전 + 가격, 어두운 판 (y = 판 위쪽)
    ctx.font = '10px Galmuri9'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const t = String(price), tw = Math.ceil(ctx.measureText(t).width), w = (tw + 20) & ~1, h = 14, bx = (Math.round(x) - (w >> 1)) & ~1, by = Math.round(y) & ~1;
    ctx.fillStyle = '#0b0a0e'; ctx.fillRect(bx, by - 2, w, h + 4); ctx.fillRect(bx - 2, by, w + 4, h);
    ctx.fillStyle = ok ? '#2a2018' : '#2a1416'; ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = ok ? '#4a3a26' : '#4a2226'; ctx.fillRect(bx, by, w, 2);
    const cx = bx + 4, cy = by + 3; // 동전 8x8
    ctx.fillStyle = ok ? '#8a5a10' : '#5a4040'; ctx.fillRect(cx + 2, cy, 4, 8); ctx.fillRect(cx, cy + 2, 8, 4);
    ctx.fillStyle = ok ? '#ffd34d' : '#9a7a7a'; ctx.fillRect(cx + 2, cy, 4, 6); ctx.fillRect(cx, cy + 2, 6, 2);
    ctx.fillStyle = ok ? '#fff0b0' : '#c0a8a8'; ctx.fillRect(cx + 2, cy + 2, 2, 2);
    ctx.fillStyle = ok ? '#ffe08a' : '#ff7a6a'; fillTextW(t, bx + 15, by + 11);
  }
  // 상인 「살구」(왕관앵무): 계산대 뒤에 서서 숨 쉬듯 들썩이고, 볏이 흔들리고, 펼친 날개를 이따금 두 번 퍼덕이고, 눈을 깜빡인다
  function drawShopKeeper(R) {
    const x = ((R.keeper ? R.keeper.x : CX) + 2) & ~1, y = ((R.keeper ? R.keeper.y - 4 : CY - 26)) & ~1, bob = Math.floor(time * 1.5) % 2 ? 2 : 0;
    const ph = time % 2.6, wing = ph < 0.6 && Math.floor(ph * 6.67) % 2 === 0, crest = Math.floor(time * 1.4) % 2 === 1, blink = time % 3.7 < 0.15;
    const m = merchantArt(wing, crest, blink);
    ctx.drawImage(m, x - 18, y - m.height + 2 - bob); // 몸통 가운데가 x에 오게 (펼친 날개는 오른쪽으로)
    const P = G.player, sy = npcTalk('merchant', P && Math.hypot(P.x - x, P.y - y) < 120, ['싸게 줄게', '골라 봐', '이건 귀한 물건이야', '외상은 안 돼', '살아남으려면 사 둬'], ['어서 와♪', '살구의 비밀상점이야♪']);
    if (sy) drawBubble(sy.line, x, y - m.height + 6); // v3.19 몸이 들썩여도 말주머니는 제자리
  }
  function drawShopItem(s) {
    const x = Math.round(s.x) & ~1, y = Math.round(s.y) & ~1, st = srArt('stand', G.stage, SR.stand); // v1.11 천 덮인 진열대
    { const xa = x - st.width / 2 + 4, xb = x + st.width / 2 - 4; if (xb > xa) dshRect(ctx, xa, y + 2, Math.ceil((xb - xa) / 2) * 2, 2, 0.5); }
    ctx.drawImage(st, x - st.width / 2, y - st.height + 4);
    if (s.sold) return;
    const by = (y - st.height + 8 + (Math.floor(time * 2 + x) % 2 ? 0 : -2)) & ~1;
    if (s.k === 'gear') { const g = art('gearbox2', () => gCanvas(GEARBOX, GEARBOX_PAL)), gx = x - g.width / 2, gy = by - g.height + 4; ctx.drawImage(g, gx, gy); const ph = Math.floor(time * 3 + x) % 6; if (ph < 2) { ctx.fillStyle = '#fffbe6'; const sx = gx + (ph ? 26 : 4), sy = gy + (ph ? 14 : 4); ctx.fillRect(sx, sy, 2, 2); ctx.globalAlpha = 0.6; ctx.fillRect(sx - 2, sy, 2, 2); ctx.fillRect(sx + 2, sy, 2, 2); ctx.fillRect(sx, sy - 2, 2, 2); ctx.fillRect(sx, sy + 2, 2, 2); ctx.globalAlpha = 1; } } // v2.38 반짝임
    else if (s.k === 'iron') { const g = art('ironore', () => gCanvas(IRONORE, IRONORE_PAL)); ctx.drawImage(g, x - g.width / 2, by - g.height + 4); }
    else { const L = LOOT[s.k]; drawSprite(L.map, L.pal || 'loot', L.sc, x, by + 4, false); }
    { const pr = hasRelic('twincoin') && G.freeBuy !== G.stage ? Math.ceil(s.price / 2) : s.price; drawPriceTag(pr, x, y + 8, G.gold >= pr); } // v1.10 가격표 · v2.29 쌍둥이 동전 반값 표시
  }
  const PROP_MAPS = {
    goblinStatue: [[".....kkkkkk.....", "....k23aaaak....", ".kkka111111a1kk.", ".k221e111e1123k.", "...kka22211kk...", ".....kka1kk.....", "....k2222223k...", "...ka2322321k...", "..ka.k2323k.ak..", "..k2.k2233k.2k..", "..kk.k3333k.kk..", ".....k3k.k3k....", "....kk3k.k3kk...", "kkkkkkkkkkkkkkkk", "ka1111111111123k", "k23222222222324k", ".kkkkkkkkkkkkkk.", ".k123222222234k.", ".k122223323334k.", "kkkkkkkkkkkkkkkk", "k44444444444444k", "kkkkkkkkkkkkkkkk"], {"k": "#0b0a0e", "a": "#bcb6c4", "1": "#9a94a4", "2": "#706a80", "3": "#4c4758", "4": "#2e2a36", "e": "#1a1820", "M": "#5a8a34", "m": "#34522a"}], // v2.77 고블린 몬스터 도트를 그대로 돌로 깎은 석상 + 돌 받침 (2장 성채)
    armor: [["......krRk......", ".....krrRRk.....", "......kkkk......", ".....k1a13k.....", "....kkk13kkk....", "...k1a111223k...", "..k1a12222223k..", "..k3333333334k..", "..k4444444444k..", "..k1222422223k..", "...kk12k2233k3k.", ".kk1112a22k33kk.", "k1a111ka2k22233k", "k1122k1a23k2233k", ".k12k1aa233k23k.", "..kkaaaa22222k3k", "..k4122232234kk.", "..k4122232334k..", "..k4122232334k..", "...kkkkopkkkk...", "......kopk......", "......kopk......", "......kopk......", ".....kkkkkk.....", "...kkooopppkk...", "..kPPkkkkkkPPk.."], {"k": "#0b0a0e", "a": "#d8d4e0", "1": "#a8a4b4", "2": "#7c7890", "3": "#56526a", "4": "#34303e", "r": "#a8382a", "R": "#6e2018", "o": "#b07c44", "p": "#83592f", "P": "#5c3c20"}], // v2.77 근위기사와 같은 비율의 빈 갑옷 + 나무 받침대 (외곽선 1칸)
    brazier: [["...o..O...", "..oOyoOo..", ".OoyyyoOO.", "kOryyyyrOk", "kGGGGGggdk", ".kgggggdk.", "..kgggdk..", "...kgdk...", "...kgdk...", "..kggddk..", ".kkkkkkkk."], {"k": "#0b0a0e", "G": "#7a7488", "g": "#4e4a5a", "d": "#2e2a36", "o": "#ffd060", "O": "#ff8a2a", "r": "#c03018", "y": "#fff0b0"}],
    candelabra: [[".o...o...o.", ".y...y...y.", "kWk.kWk.kWk", "kWk.kWk.kWk", "kgkkkgkkkgk", ".kgggggggk.", "....kgk....", "....kgk....", "....kgk....", "....kgk....", "....kgk....", "...kgggk...", "..kgggddk..", "..kkkkkkk.."], {"k": "#0b0a0e", "G": "#7a7488", "g": "#4e4a5a", "d": "#2e2a36", "o": "#ffd060", "O": "#ff8a2a", "r": "#c03018", "y": "#fff0b0", "W": "#e8e0c8"}],
    bookshelf: [["WWWWWWWWWWWWWWWWWWWWWW", "BwwwwwwwwwwwwwwwwwxxbB", "BPPPPPPPPPPPPPPPPPxxbB", "BPPPPPPPHhhPPPPPPxVPbB", "BUuVvvNnHhhvVvvPVvVPbB", "BUuVvvNnHhhvVvvvVvVPbB", "BwwwwwwwwwbbbbbbbbbbbB", "BPPPPPPPPPPPPPPPPPPPbB", "BHhhQqUuVvvPPPPPVvPPbB", "BHhhQqUuVvvUuXxxVvVPbB", "BHhhHHUuVvvUuDxDVvHPbB", "BHhhQqUuVvvUuXDxVvVPbB", "BwwwwwwwwwbbbbbbbbbbbB", "BPPPPPPPPPPPPPPPPPPPbB", "BQqPPPPPPVvvPPPPPPPPbB", "BHHvUuVvPVvvQqqPNnnPbB", "BQqvUuVvvVvvQqqvNnnPbB", "BwwwwwwwwwbbbbbbbbbbbB", "BBBBBBBBBBBBBBBBBBBBBB"], {"k": "#0b0a0e", "W": "#c09060", "w": "#9a7048", "b": "#74522f", "B": "#523822", "P": "#3a2614", "X": "#ece4d0", "x": "#bcb2a0", "z": "#7a7262", "D": "#1a1418", "q": "#7a2430", "Q": "#a83a46", "n": "#2e4e30", "N": "#4a7a4a", "u": "#30346a", "U": "#4e5aa0", "h": "#8a6420", "H": "#c89a40", "v": "#4a2450", "V": "#74407a"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    chairBroken: [[".kwkkkbk.....", ".kWWWWWk.....", ".kwkkkbk.....", ".kwkkkbk.....", ".kwwwwwk.....", ".kwkkkbk.....", ".kwkkkbk.....", "kWWWWWWkkkkk.", "kwwwwwwwwwwwk", ".kwkkkbbbbbbk", ".kbk.kBkkkkk.", ".kbk..kBkkkBk", ".kbk...kkbBBk"], {"k": "#0b0a0e", "W": "#c09060", "w": "#9a7048", "b": "#74522f", "B": "#523822", "P": "#3a2614"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    table: [["...kok........kkkk....", "...kXxk......kGgggk...", "kkkkXxkkkkkkkkGggkkkkk", "WWWWWWWWWWWWWWWWWWWWWW", "wwwwwwwBwwwwwwBwwwwwww", "wwwwwwwBwwwwwwBwwwwwww", "kbbbbbbbbbbbbbbbbbbbbk", "kBBBBBBBBBBBBBBBBBBBBk", ".kbPkkkkkkkkkkkkkkkbPk", ".kbPk.............kbPk", ".kbPk.............kbPk", ".kbPk.............kbPk", ".kbPk.............kbPk"], {"k": "#0b0a0e", "W": "#c09060", "w": "#9a7048", "b": "#74522f", "B": "#523822", "P": "#3a2614", "X": "#ece4d0", "x": "#bcb2a0", "z": "#7a7262", "a": "#c4c0d0", "G": "#8e889c", "g": "#615c72", "d": "#3e3a4a", "D": "#26222e", "o": "#ffd060"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    cage: [["....kkkkk....", "...kGgggdk...", "..kkkkkkkkk..", "..kG.g.g.dk..", "..kG.g.g.dk..", "..kG.g.W.dk..", "..kG.gWWdd k.", "..kG.g.W.dk..", "..kGkgkgkdk..", "..kkkkkkkkk.."], {"k": "#0b0a0e", "G": "#7a7488", "g": "#4e4a5a", "d": "#2e2a36", "o": "#ffd060", "O": "#ff8a2a", "r": "#c03018", "y": "#fff0b0", "W": "#d8d0c0"}],
    tapestry: [["kkkkkkkkkkkk", "kbbbbbbbbbbk", "kRRRRRRRRRRk", "kRyyyyyyyyRk", "kRyRRRRRRyRk", "kRyRRYYRRyRk", "kRyRYrrYRyRk", "kRyRRYYRRyRk", "kRyRRYYRRyRk", "kRyRRRRRRyRk", "kRyyyyyyyyRk", "kRRRRRRRRRRk", "kRRRRRRRRRRk", "kRkRkRkRkRkk", "k.k.k.k.k.k."], {"k": "#0b0a0e", "r": "#6a1018", "R": "#9a1c28", "y": "#c9a24a", "Y": "#e8c860", "p": "#3a1a48", "P": "#5a2a6a", "b": "#3a3036"}],
    shieldSwords: [["kW............Wk", ".kW..kkkkkk..Wk.", "..kWkYyyyyykWk..", "...kWRRrrRWyk...", "...kyWRrrWryk...", "...kyRWrWRryk...", "...kyRRWRRryk...", "...kyRWrWRryk...", "....kyRrrRyk....", "...kWkyRRyk.k...", "..kW..kyyk..Wk..", ".kW....kk....Wk.", "kk............kk"], {"k": "#0b0a0e", "W": "#d0ccd8", "G": "#9a94a8", "g": "#66627a", "r": "#8a1c28", "R": "#b82a38", "y": "#c9a24a", "Y": "#e8c860"}],
    portrait: [["kkkkkkkkkkkk", "kYyyyyyyyyYk", "kyddddddddyk", "kydddSSSddyk", "kyddSsssSdyk", "kyddsrssrsyk", "kyddSsssSdyk", "kydddSssSdyk", "kydDDDsDDDyk", "kyDDDDDDDDyk", "kyDDDDDDDDyk", "kYyyyyyyyyYk", "kkkkkkkkkkkk"], {"k": "#0b0a0e", "y": "#a8822e", "Y": "#e0b850", "d": "#1a1620", "D": "#2a2232", "s": "#8a6a5a", "S": "#5a4038", "r": "#ff3040"}],
    chains: [[".kaggk..kaggk.", ".kaggk..kaggk.", "..kak....kak..", ".kaDgk..kaDgk.", ".kGDdk..kGDdk.", "..kgk....kgk..", "..kGk....kGk..", "..kak....kak..", ".kaDgk..kaDgk.", ".kGDdk..kGDdk.", "..kgk....kgk..", "..kGk....kGk..", "..kak....kak..", ".kaDgk..kaDgk.", ".kGDdk..kGDdk.", "..kgk....kgk..", "..kGk....kGk.."], {"k": "#0b0a0e", "a": "#c4c0d0", "G": "#8e889c", "g": "#615c72", "d": "#3e3a4a", "D": "#26222e"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    skullNiche: [["...kkkkkk...", "..kllllllk..", ".klDDDDDDlk.", "klDDDDDDDDlk", "klDDkkkkDDlk", "klDkWWWWkDlk", "klDWkWWkWDlk", "klDWWwwWWDlk", "klDkWkWkWDlk", "klllllllllk.", "kkkkkkkkkkk."], {"k": "#0b0a0e", "D": "#100c14", "d": "#2a2632", "W": "#d8d0c0", "w": "#a49c8e", "o": "#ffd060", "y": "#fff0b0", "l": "#4a4554"}],
    signpost: [["..................", ".......kkk........", ".kkkkkkWwbkkkkk...", "kWMMWWWWWWWWWWWk..", "kwwwwwwwwwwwwwwwk.", "kwwBBBBBwwBBBwwwwk", "kwwwwwwwwwwwwwwwk.", "kbbbbbbbbbbbbbbk..", ".kkkkkkWwbkkkkkk..", ".kwwwwwwwwwwwwMMk.", "kbbbbbbbbbbbbbbbk.", "bbbbbBBBBbbBBBBbk.", "kbbbbbbbbbbbbbbbk.", ".kBBBBBBBBBBBBBBk.", "..kkkkkWwbkkkkkk..", ".....kkWwbkkmk....", "....kmkWwbkMk.....", "...kMMmMMmMMmk...."], {"k": "#0b0a0e", "W": "#c09060", "w": "#9a7048", "b": "#74522f", "B": "#523822", "P": "#3a2614", "m": "#3e6a2c", "M": "#6a9a44"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    campfire: [["...kkkkkk...", ".kkGgcCcgkk.", "kGgcCwoCcGdk", "kgcwCOowCcdk", "kgcCcoCcwcdk", ".kkgdccdgkk.", "...kkkkkk..."], {"k": "#0b0a0e", "G": "#9a94a4", "g": "#6a6474", "d": "#3a3644", "c": "#1a1410", "C": "#2a2018", "o": "#ff8a2a", "O": "#ffd060", "w": "#6a4a30"}],
    deerSkull: [["kW.......Wk", ".kW.k.k.Wk.", "..kWWkWWk..", "...kWWWk...", "..kWWWWwk..", "..kWkWkwk..", "...kWWwk...", "...kwWwk...", "....kwk....", "....kk....."], {"k": "#0b0a0e", "W": "#e0d8c8", "w": "#a8a090", "d": "#5a5448"}],
    ruinPillar: [["........k......", ".......k1k.....", "....kkka31k....", "...kamk1341k...", "..kam3a1442k...", "..ka13114221k..", "..ka131142231k.", "..ka131142232k.", "..ka131442232k.", "..ka131432232k.", "..kM131142232k.", "..km131132232k.", "..kam31132232k.", "..km131132232k.", "..ka131132232k.", "..ka131132M32k.", ".k111Mm1111M11k", ".k333333333333k", "k22333333333333", ".kkkkkkkkkkkk33"], {"k": "#0b0a0e", "a": "#bcb6c4", "1": "#9a94a4", "2": "#76708a", "3": "#55506a", "4": "#38344a", "m": "#3e6a2c", "M": "#6a9a44"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    wheel: [[".....kkkkkkk.....", "...kkGGWWWGGkk...", "..kGWwkkkkkWWGk..", ".kGWkkwk.kkkkWGk.", "kGWk.kwwkbbk.kWGk", "kGWkkkkWPBkkkkWGk", "kgbbbbbWBBwwwwbgk", "kgbkkkkbkbbkkkbgk", ".kgbkkbk.kbkkbgk.", "..kgbbkkkkkbbgk..", ".kmkkggbbbggkkmk.", "kMkMkkkkkkkkkMkMk"], {"k": "#0b0a0e", "W": "#c09060", "w": "#9a7048", "b": "#74522f", "B": "#523822", "P": "#3a2614", "a": "#c4c0d0", "G": "#8e889c", "g": "#615c72", "d": "#3e3a4a", "D": "#26222e", "m": "#3e6a2c", "M": "#6a9a44"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
  };
  // ================================================================ 방 꾸미기 (v0.26) — 초원은 숲 느낌, 성채는 고성 느낌의 소품을 방마다 무작위로
  // 서 있는 소품: r=충돌 반지름(없으면 밟고 지나감), w/h=사각 충돌, light=빛, flame=불꽃 위치(칸)
  const PROPS = {
    goblinStatue: { r: 12, foot: 2 }, armor: { r: 9, foot: 2 }, brazier: { r: 9, foot: 2, light: { r: 90, c: '255,150,60', ca: 0.2, dy: -18 }, flame: [[3, 0], [5, 0], [7, 0]] },
    candelabra: { r: 7, foot: 2, light: { r: 60, c: '255,190,90', ca: 0.14, dy: -26 }, flame: [[1, 0], [5, 0], [9, 0]] },
    bookshelf: { w: 34, h: 10, foot: 2 }, table: { w: 30, h: 8, foot: 2 }, chairBroken: { foot: 2 }, cage: { r: 11, foot: 2 },
    ruinPillar: { r: 10, foot: 2 }, signpost: { r: 4, foot: 2 },
    smileFlower: { r: 6, anim: 'flower' }, meatPole: { r: 5, anim: 'meat' }, breathHeap: { r: 12, anim: 'heap' }, ashCitizen: { r: 8, anim: 'citizen' }, // v1.52
    poolM: { w: 38, h: 18, pit: true }, poolL: { w: 64, h: 32, pit: true }, poolXL: { w: 92, h: 46, pit: true },
  };
  // ================================================================ v1.23 STAGE 4 왕도 오브젝트 — 2px 칸 · 검은 외곽선 · 왼쪽 위 빛 · 윗면에 재가 쌓임
  const STONE4 = Object.assign({}, STONE, { a: '#bdb7ab', A: '#8e887e', m: '#8e887e', M: '#a8a296' });
  // 윗면 재 더께: 열마다 맨 위 칸부터 1~2칸을 재 색으로, 윗면 안쪽에도 디더로 재
  function ashCap(g, topRows = 0) {
    const H0 = g.length, W0 = g[0].length, SH = 'HhlLdD';
    for (let x = 0; x < W0; x++) { let y = 0; while (y < H0 && (g[y][x] === '.' || g[y][x] === 'k')) y++; if (y >= H0) continue;
      const n = Math.random() < 0.6 ? 2 : 1; for (let j = 0; j < n && y + j < H0; j++) if (SH.includes(g[y + j][x])) g[y + j][x] = j ? 'A' : 'a'; }
    const ph = rand(0, 6); for (let y = 1; y <= topRows; y++) for (let x = 1; x < W0 - 1; x++) { const v = 0.5 + 0.5 * Math.sin(x * 0.45 + ph) * Math.cos(y * 0.6 + ph * 0.7); if ('hlLdD'.includes(g[y][x]) && v > 0.62 && dith(x, y, (v - 0.55) * 2.2)) g[y][x] = v > 0.85 ? 'a' : 'A'; }
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) if (g[y][x] === 'm') g[y][x] = 'A'; else if (g[y][x] === 'M') g[y][x] = 'a';
    return g;
  }
  // 녹아내린 옛 왕의 동상: 받침 위 망토 두른 왕, 왕관·왕홀, 아래로 흘러내린 자국
  const KING4 = { k: '#0b0a09', h: '#a49e94', l: '#7c766e', d: '#56524c', D: '#3a3732', a: '#c4beb2', A: '#948e84', g: '#c8a850', G: '#8a7034', e: '#2a2622', c: '#24221e' };
  function genMeltKing() {
    const W0 = 19, H0 = 30, g = mkGrid(W0, H0), cx = 9;
    const sh = (x, c0, w) => { const t = (x - (c0 - w)) / (2 * w + 0.001); return t < 0.22 ? 'h' : t < 0.55 ? 'l' : t < 0.82 ? 'd' : 'D'; };
    // 받침
    for (let y = 23; y <= 28; y++) for (let x = 1; x <= 17; x++) g[y][x] = y === 23 ? 'h' : y === 28 ? 'D' : y === 24 ? 'D' : x <= 4 ? 'l' : x >= 14 ? 'D' : 'd';
    for (let x = 3; x <= 15; x += 4) g[26][x] = 'c';
    // 망토(사다리꼴) — 아래로 갈수록 넓고, 끝단이 흘러내림
    for (let y = 8; y <= 22; y++) { const w = Math.round(3 + (y - 8) * 0.3); for (let x = cx - w; x <= cx + w; x++) g[y][x] = sh(x, cx, w); }
    for (let i = 0; i < 6; i++) { const x = randi(cx - 6, cx + 6), L = randi(1, 4); for (let j = 0; j < L; j++) if (g[23 + j]) g[23 + j][x] = j === L - 1 ? 'D' : 'd'; }
    // 어깨 · 팔(가슴에 모은 손)
    for (let x = cx - 4; x <= cx + 4; x++) g[8][x] = x < cx ? 'h' : 'l';
    g[12][cx - 1] = 'h'; g[12][cx] = 'l'; g[13][cx - 1] = 'l'; g[13][cx] = 'd';
    // 머리 (한쪽이 녹아 흘러내림)
    for (let y = 4; y <= 7; y++) for (let x = cx - 2; x <= cx + 2; x++) g[y][x] = x === cx - 2 ? 'h' : x === cx + 2 ? 'D' : x < cx ? 'l' : 'd';
    g[7][cx + 2] = '.'; g[8][cx + 3] = 'd'; g[9][cx + 4] = 'D';
    g[5][cx - 1] = 'e'; g[5][cx + 1] = 'e'; g[7][cx] = 'c';
    // 왕관
    for (let x = cx - 2; x <= cx + 2; x++) { g[3][x] = x === cx + 2 ? 'G' : 'g'; }
    for (const x of [cx - 2, cx, cx + 2]) g[2][x] = 'g'; g[1][cx] = 'g';
    // 왕홀 (오른손)
    for (let y = 6; y <= 20; y++) g[y][cx + 6] = y === 6 ? 'g' : 'G';
    g[5][cx + 6] = 'g'; g[5][cx + 5] = 'G'; g[5][cx + 7] = 'G'; g[4][cx + 6] = 'g';
    for (let y = 13; y <= 14; y++) { g[y][cx + 5] = 'l'; }
    // 금
    let x0 = randi(cx - 2, cx + 2), y0 = 10; for (let i = 0; i < 6; i++) { if ('hldD'.includes(g[y0][x0])) g[y0][x0] = 'c'; x0 += randi(-1, 1); y0++; }
    ashCap(g); return gOutline(g);
  }
  // 떨어져 깨진 종: 옆으로 누운 청동 종, 입구는 오른쪽, 금이 가고 윗면엔 재
  const BELL4 = { k: '#0b0806', h: '#c8a060', l: '#94723e', d: '#64492a', D: '#3e2c18', K: '#140e08', v: '#5e7e6a', V: '#3e5a4c', c: '#1a120a', a: '#c4beb2', A: '#948e84' };
  function genBell(r) {
    const L = Math.max(14, Math.round(r * 1.25)), R0 = Math.max(7, Math.round(r * 0.62)), W0 = L + 5, H0 = Math.round(R0 * 1.5) + 6, g = mkGrid(W0, H0), cy = Math.round(H0 / 2) - 1;
    for (let x = 0; x < L; x++) { const t = x / (L - 1), rad = R0 * (0.5 + 0.5 * Math.pow(t, 1.6)) + (t > 0.9 ? 1 : 0), ry = rad * 0.72;
      for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) { const v = (y - (cy - ry)) / (2 * ry); g[y][x + 2] = v < 0.22 ? 'h' : v < 0.55 ? 'l' : v < 0.82 ? 'd' : 'D'; }
      if (x % 5 === 2 && t > 0.15 && t < 0.85) for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) if (g[y][x + 2] !== 'h') g[y][x + 2] = 'D'; // 띠
    }
    // 입구 (오른쪽 끝 안쪽 어둠)
    { const rad = R0 + 1, ry = rad * 0.72; for (let y = Math.ceil(cy - ry + 1); y <= cy + ry - 1; y++) { g[y][L] = 'K'; if (Math.abs(y - cy) < ry - 2) g[y][L - 1] = 'K'; } }
    // 꼭지 고리 (왼쪽)
    for (let y = cy - 2; y <= cy + 2; y++) g[y][1] = y === cy - 2 ? 'h' : 'd'; g[cy - 1][0] = 'l'; g[cy + 1][0] = 'D';
    // 녹청 · 금
    for (let i = 0; i < L * 0.8; i++) { const x = randi(3, L), y = randi(cy - 3, cy + 3); if ('ld'.includes(g[y][x])) g[y][x] = Math.random() < 0.5 ? 'v' : 'V'; }
    let x0 = L - 1, y0 = cy - 2; for (let i = 0; i < L * 0.55; i++) { if (g[y0] && 'hldDvV'.includes(g[y0][x0])) g[y0][x0] = 'c'; x0--; y0 += randi(-1, 1); y0 = clamp(y0, 1, H0 - 2); }
    ashCap(g, 0); return gOutline(g);
  }
  // 재에 묻힌 마차: 판자 짐칸(윗면) + 앞면 바퀴 둘, 짐칸 위로 재가 수북
  // 재가 된 사람들 (서 있는 소품, 2px 칸) — 막은 팔, 무릎 꿇고 비는 이, 아이를 안은 어머니. 'e'는 눈 자리
  const FOLK_PAL = { k: '#0b0a09', h: '#b2ac9e', l: '#8a847a', d: '#625e56', D: '#423f3a', a: '#cdc7ba', A: '#9a948a', e: '#2a2622', c: '#26231f', w: '#c8c2b4' };
  const FOLK_RAW = {
    folkA: ['............', '.....hl.....', '....hlld....', '...hhlldd...', '..hhhhlddd..', '....hledd...', '...hhlldd...', '..hllllllddD', '..hllcllld.D', '..hlllllldd.', '...hlllldd..', '...hlllldd..', '...hllllldd.', '..hllllllld.', '..hll..lldd.', '.hll....ldd.', '.hl......dd.', 'aaAa....AAa.', 'AAAAAaaAAAAA', '............'],
    folkB: ['............', '....hhld....', '...hhlldd...', '...hlledd...', '....hlld....', '...hhhlldd..', '..hhllllddd.', '..hlhhhhldd.', '..hllhhlldd.', '..hllllllddd', '.hhlllcllddd', 'hhllllllllld', 'aaaaaaaAAAAA', 'AAAAAAAAAAAA', '............'],
    folkC: ['............', '.....hld....', '....hlldd...', '....hledd...', '.....hld....', '...hhhlldd..', '..hhwwllddd.', '..hwwwhlddd.', '..hlwwhhddd.', '...hllhhdd..', '...hlllldd..', '...hllcldd..', '..hllllllddd', '..hlllllllld', '.hllllllllld', 'aaaAaaaAAAAA', 'AAAAAAAAAAAA', '............'],
  };
  const FOLK_EYE = { folkA: [5, 5], folkB: [5, 3], folkC: [5, 3] }; // 외곽선을 둘러도 칸 위치는 같다
  for (const n in FOLK_RAW) PROP_MAPS[n] = [gOutline(fromRows(FOLK_RAW[n])).map(r => r.join('')), FOLK_PAL];
  // 꺼진 가로등: 쇠기둥 + 깨진 등갓, 기둥 아래 재
  PROP_MAPS.ashLamp = [["...kgk....", "..kkGdkkk.", ".ksssssssk", "..kGGggkk.", "...kkkkk..", "..kgggggk.", "..kGDCDgk.", "..kGDcDgk.", "..kGSDDgk.", "..kaagggk.", "...kGdkk..", "...kGdk...", "..kaaggk..", "...kGdk...", "...kGdk...", "..kkGdkk..", ".kaaGGggk.", "kssSSSgggk"], {"k": "#0b0a0e", "a": "#a8a4ae", "G": "#7e7a88", "g": "#5c5866", "d": "#403c4a", "D": "#2a2632", "s": "#c8c2c0", "S": "#8e8884", "c": "#3a2a24", "C": "#6a3a28"}]; // v2.80 잿빛 왕도 가로등 다시 그림
  Object.assign(PROPS, { folkA: { r: 6, foot: 1, folk: true }, folkB: { r: 7, foot: 1, folk: true }, folkC: { r: 6, foot: 1, folk: true }, ashLamp: { r: 4, foot: 1 } });
  // 왕도 장식: 북쪽 벽 아래 가로등·갑옷, 방 곳곳에 재가 된 사람들 (격전지에선 일부가 매복)
  function decorAsh(r, add, W0, H0) {
    const nx = DOOR.n.x, topY = A.y0 + 18, fight = r.type === 'combat';
    const n = Math.max(1, Math.floor(W0 / 240));
    for (let i = 0; i < n; i++) if (Math.random() < 0.7) { const x = A.x0 + 50 + (i + rand(0.2, 0.8)) * (W0 - 100) / n; if (Math.abs(x - nx) > 70) add(pick(['ashLamp', 'ashLamp', 'royalBanner']), x, topY); /* v2.89 갑옷 장식 → 그을린 왕실 깃대 */ }
    if (r.doors.n != null && Math.random() < 0.4) { add('royalBanner', nx - 46, topY + 4); add('royalBanner', nx + 46, topY + 4); }
    const cnt = r.type === 'boss' ? 0 : r.shape === 'gallery' || r.shape === 'belfry' ? randi(1, 3) : randi(3, 6);
    let ambN = fight ? (Math.random() < 0.25 ? 0 : randi(1, 2)) : 0;
    for (let i = 0, tries = 0; i < cnt && tries < 40; tries++) {
      const x = rand(A.x0 + 40, A.x1 - 40), y = rand(A.y0 + 40, A.y1 - 30); if (Math.hypot(x - CX, y - CY) < 120) continue;
      const nm = pick(['folkA', 'folkA', 'folkB', 'folkC']); if (!add(nm, x, y)) continue;
      i++; const p = r.props[r.props.length - 1]; if (ambN > 0) { p.amb = true; ambN--; }
    }
    if (r.shape === 'sanctum' && Math.random() < 0.6) { const x = CX + rand(-W0 * 0.25, W0 * 0.25), y = CY + rand(-H0 * 0.2, H0 * 0.2); if (add('feastTable', x, y) && Math.random() < 0.7) add('feastChair', x + pick([-40, 40]), y + 6); } // v2.89 연회 식탁 · 의자
    if (Math.random() < 0.5) { const cs = [[A.x0 + 26, A.y0 + 30], [A.x1 - 26, A.y0 + 30]]; for (const c of cs) add('crownBrazier', ...c); } // v2.89 왕관 테 화로
  }
  // 재의 사람들: 매복 조각상이 깨지며 적이 튀어나온다 (재 망자)
  function breakFolk(R, p, spawn) {
    const i = R.props.indexOf(p); if (i < 0) return; R.props.splice(i, 1);
    R.obs = R.obs.filter(b => !(b.t === 'prop' && b.c && b.x === p.x && b.y === p.y)); R.nav = buildNav(R.obs);
    if (G.dun.cur === R) { G.obs = R.obs; G.nav = R.nav; G.navDist = null; }
    debris(p.x, p.y - 14, 14); dust(p.x, p.y - 4, 12); sfx('crunch'); sfx('block', 0.6);
    for (let k = 0; k < 10; k++) G.parts.push({ x: p.x + rand(-6, 6), y: p.y - rand(4, 30), vx: rand(-30, 30), vy: -rand(10, 50), t: rand(0.4, 0.9), c: pick(['#b2ac9e', '#8a847a', '#cdc7ba']), g: 160 });
    if (spawn) { queueSpawn('husk', { x: p.x, y: p.y + 4 }); G.nums.push({ x: p.x, y: p.y - 40, v: '매복!', t: 0.9, c: '#ff9a50', s: 1, txt: true }); }
  }
  function updateAmbush(dt) {
    const R = G.dun && G.dun.cur, rs = G.rs; if (!R || !R.props || G.stage !== 4) return;
    const live = rs && rs.state === 'run' && !R.cleared;
    if (!live) return;
    R.ambT = (R.ambT || 0) + dt;
    for (const p of R.props.slice()) { if (!p.amb) continue;
      if (p.wakeT == null) p.wakeT = rand(2, 9);
      p.warn = R.ambT > p.wakeT - 1.1;
      if (R.ambT >= p.wakeT) breakFolk(R, p, true); }
  }
  // 플레이어 공격·투사체가 조각상에 닿으면 부서진다 (매복이었으면 그 자리에서 깨어남)
  function hitFolk(x, y, rad) {
    const R = G && G.dun && G.dun.cur; if (!R || !R.props || G.stage !== 4) return false;
    let hit = false;
    for (const p of R.props.slice()) if (PROPS[p.name].folk && Math.hypot(p.x - x, p.y - 8 - y) < rad * 0.7 + 8) { breakFolk(R, p, p.amb && !R.cleared && G.rs && G.rs.state === 'run'); hit = true; }
    return hit;
  }
  const propCanvas = name => art('prop_' + name, () => gCanvas(fromRows(PROP_MAPS[name][0]), PROP_MAPS[name][1]));
  // 방 스타일: 바닥을 칠할 때 쓰는 방별 설정 (타이틀 화면은 기본값)

  // ---------- 방 생성 때: 서 있는 소품 배치 (큰 것은 장애물이 되고, 문 사이 길이 막히면 뺀다)
  function decorRoom(r, stage, keyPts) {
    const st4 = stage === 4; if (st4) stage = 2;
    r.props = [];
    const W0 = A.x1 - A.x0, H0 = A.y1 - A.y0;
    const previousStyle = ROOMSTYLE; ROOMSTYLE = stage === 1 ? r.style : ROOMSTYLE;
    const paths = stage === 1 ? meadowCurves() : []; ROOMSTYLE = previousStyle;
    const onRoad = (x, y, clearance) => paths.some(c => { for (let t = c.a; t <= c.b; t += 6) { const m = c.at(t), px = c.vert ? m : t, py = c.vert ? t : m; if (Math.hypot(px - x, py - y) < clearance) return true; } return false; });
    if (SR_LAYOUT[r.type]) { srPlace(r, stage); return; } // v1.11 특별한 방은 정해진 배치만
    const ok = (x, y, rad) => x > A.x0 + rad + 4 && x < A.x1 - rad - 4 && y > A.y0 + 8 && y < A.y1 - rad - 4 && !obsHitL(r.obs, x, y, rad + 8) && !onRoad(x, y, rad + 20)
      && !keyPts.some(p => Math.hypot(p.x - x, p.y - y) < rad + (p.big ? CLEAR_R : 46)) && !r.props.some(p => Math.hypot(p.x - x, p.y - y) < rad + p.rad + 12);
    // 그려지는 모양(높이 포함)끼리도 겹치지 않게: 소품끼리, 소품과 나무·바위·벽 (v0.59)
    const obsVis = b => b.c ? (b.t === 'pillar' ? { x0: b.x - b.r * 2.4, y0: b.y - b.r * 6, x1: b.x + b.r * 2.4, y1: b.y + b.r } : { x0: b.x - b.r - 2, y0: b.y - b.r * 1.8, x1: b.x + b.r + 2, y1: b.y + b.r }) : b.t === 'pit' ? { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 } : { x0: b.x0, y0: b.y0 - (b.tower ? 90 : 40), x1: b.x1, y1: b.y1 };
    const ONE = ['brazier', 'cage', 'table', 'campfire', 'crownBrazier', 'feastTable']; // v3.29 눈에 띄는 소품(화로 · 우리 · 탁자)은 방마다 하나만 (2장 · 4장)
    const add = (name, x, y) => { if (stage === 2 && ONE.includes(name) && r.props.some(p => p.name === name)) return false; const sp = PROPS[name], rad = sp.r || (sp.w ? (sp.pit ? Math.max(sp.w, sp.h) / 2 + 6 : sp.w / 2) : 8);
      if (typeof OCC !== 'undefined' && OCC.on()) { // v2.85 점유 지도: 발 자리 · 실제 그림으로 겹침 판정
        if (!(x > A.x0 + rad + 4 && x < A.x1 - rad - 4 && y > A.y0 + 8 && y < A.y1 - rad - 4) || onRoad(x, y, rad + 20)) return false;
        const q = { name, x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2, rad }; if (typeof PATHCLR !== 'undefined' && PATHCLR.hitRect(r, propRect(q))) return false; /* v3.26 길 둘레 비우기 */ if (!OCC.prop(q)) return false; r.props.push(q); return true; }
      if (!ok(x, y, rad)) return false;
      const q = { name, x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2, rad }, me = propRect(q); if (typeof PATHCLR !== 'undefined' && PATHCLR.hitRect(r, me)) return false; // v3.26 길 둘레 비우기
      if (r.props.some(p => rectHit(me, propRect(p), 6)) || r.obs.some(b => rectHit(me, obsVis(b), 4))) return false;
      r.props.push(q); return true; };
    const fightRoom = ['combat', 'elite', 'survive', 'start'].includes(r.type);
    if (r.type === 'start') decorStart(r, st4 ? 4 : stage, add, W0, H0); // v3.20 들머리: 그 장의 시설물을 정해진 자리에
    else if (stage === 3) decorOrc(r, add, W0, H0, keyPts);
    else if (st4) decorAsh(r, add, W0, H0);
    else if (stage === 2) {
      const nx = DOOR.n.x, topY = A.y0 + 18;
      if (r.doors.n != null && Math.random() < 0.5) { const nm = pick(['goblinStatue', 'goblinStatue', 'armor']); add(nm, nx - 46, topY + 4); add(nm, nx + 46, topY + 4); }
      const n = Math.max(1, Math.floor(W0 / 260));
      const pool = r.shape === 'chamber' ? ['bookshelf', 'bookshelf', 'candelabra', 'armor'] : ['armor', 'goblinStatue', 'candelabra', 'brazier', 'armor'];
      for (let i = 0; i < n; i++) if (Math.random() < 0.7) { const x = A.x0 + 50 + (i + rand(0.2, 0.8)) * (W0 - 100) / n; if (Math.abs(x - nx) > 70) add(pick(pool), x, topY); }
      if (Math.random() < 0.6) { const cs = [[A.x0 + 26, A.y0 + 30], [A.x1 - 26, A.y0 + 30], [A.x0 + 26, A.y1 - 24], [A.x1 - 26, A.y1 - 24]].sort(() => Math.random() - 0.5); const m = pick(['brazier', 'candelabra']); add(m, ...cs[0]); add(m, ...cs[1]); }
      if (r.shape === 'chamber' || (r.shape === 'hall' && Math.random() < 0.3)) {
        if (Math.random() < 0.6) { const x = CX + rand(-W0 * 0.25, W0 * 0.25), y = CY + rand(-H0 * 0.2, H0 * 0.2); if (add('table', x, y) && Math.random() < 0.7) add('chairBroken', x + pick([-28, 28]), y + 6); }
        if (Math.random() < 0.35) add('cage', pick([A.x0 + 40, A.x1 - 40]), A.y1 - 40);
      }
      if (r.shape === 'corridorV' && Math.random() < 0.6) { add('candelabra', A.x0 + 22, CY - 120); add('candelabra', A.x1 - 22, CY + 120); }
    } else {
      // 개울: 걸어서 못 건넘(투사체는 넘어감). 문 앞을 지나면 그 자리에 다리, 길이 막히면 다리를 더 놓는다
      r.bridges = null;
      if (r.style && r.style.path === 'brook') {
        const RS0 = ROOMSTYLE; ROOMSTYLE = r.style; const bc = meadowCurves()[0]; ROOMSTYLE = RS0;
        const lo = bc.vert ? A.y0 : A.x0, hi = bc.vert ? A.y1 : A.x1, at = t => { const m = bc.at(t); return bc.vert ? { x: m, y: t } : { x: t, y: m }; };
        const br = [];
        for (const kp of keyPts) { let bt = null, bd = 1e9; for (let t = lo; t <= hi; t += 4) { const q = at(t), d = Math.hypot(q.x - kp.x, q.y - kp.y); if (d < bd) { bd = d; bt = t; } } if (bd < 70 && !br.some(b => Math.abs(b - bt) < 60)) br.push(bt); }
        if (!br.length) br.push(lo + (hi - lo) * rand(0.3, 0.7));
        if (Math.random() < 0.5) { const t = lo + (hi - lo) * rand(0.12, 0.88); if (!br.some(b => Math.abs(b - t) < 120)) br.push(t); }
        const segs = () => { const out = []; for (let t = lo - 14; t <= hi + 14; t += 12) { if (br.some(b => Math.abs(b - t) < 20)) continue; const q = at(t), hw = bc.vert ? 16 : 7, hh = bc.vert ? 7 : 16; out.push({ t: 'pit', c: false, brook: true, x: q.x, y: q.y, w: hw * 2, h: hh * 2, x0: q.x - hw, x1: q.x + hw, y0: q.y - hh, y1: q.y + hh }); } return out; };
        for (let k = 0; k < 6; k++) {
          if (keyPts.length < 2) break;
          const nav = buildNav(r.obs.concat(segs())), dd = navFlood(nav, keyPts[0].x, keyPts[0].y);
          const miss = keyPts.find(p => dd[navIdx(p.x, p.y)] < 0); if (!miss) break;
          let bt = lo, bd = 1e9; for (let t = lo; t <= hi; t += 4) { const q = at(t), d = Math.hypot(q.x - miss.x, q.y - miss.y); if (d < bd) { bd = d; bt = t; } } br.push(bt);
        }
        r.obs = r.obs.concat(segs());
        r.bridges = br.map(t => at(t));
      }
      if (Math.random() < 0.4) { const k = randi(1, W0 > 900 ? 2 : 1), put = []; for (let i = 0; i < k; i++) for (let t = 0; t < 8; t++) { const x = rand(A.x0 + 40, A.x1 - 40), y = rand(A.y0 + 30, A.y1 - 40); if (put.some(q => Math.hypot(q.x - x, q.y - y) < 320) || r.obs.some(b => b.t === 'rock' && Math.hypot(b.x - x, b.y - y) < 220)) continue; add('ruinPillar', x, y); put.push({ x, y }); break; } } // v3.19 부러진 돌기둥: 서로 320px · 바위(떨어진 돌)와 220px 이상 떨어뜨림, 방에 많아야 둘
      if (Math.random() < 0.3) { const ds = Object.keys(r.doors).filter(d => r.doors[d] != null); if (ds.length) { const q = doorIn(pick(ds), 70); add('signpost', q.x + pick([-40, 40]), q.y); } }
      // 물웅덩이 M·L·XL: 못 건너가는 장애물, 흙길·개울과 겹치지 않게
      if (r.type !== 'boss') {
        const farFromPath = (x, y, w, h) => !onRoad(x, y, Math.max(w, h) / 2 + 28);
        const n = Math.random() < 0.35 ? 0 : randi(1, W0 * H0 > 400000 ? 3 : 2);
        for (let i = 0; i < n; i++) {
          const k = pick(W0 > 500 && H0 > 300 ? ['poolM', 'poolM', 'poolL', 'poolL', 'poolXL'] : ['poolM', 'poolM', 'poolL']), sp = PROPS[k];
          for (let tries = 0; tries < 12; tries++) {
            const x = rand(A.x0 + sp.w / 2 + 30, A.x1 - sp.w / 2 - 30), y = rand(A.y0 + sp.h / 2 + 30, A.y1 - sp.h / 2 - 30);
            if (!farFromPath(x, y, sp.w, sp.h)) continue;
            if (add(k, x, y)) break;
          }
        }
      }
    }
    // v1.52 기괴한 소품 배치
    if (r.type !== 'boss' && r.type !== 'start') {
      const rx = () => rand(A.x0 + 60, A.x1 - 60), ry = () => rand(A.y0 + 50, A.y1 - 40);
      const tryAdd = (nm, n) => { for (let t = 0; t < 10; t++) if (add(nm, rx(), ry())) { if (--n <= 0) return; } };
      if (st4) {
        if (Math.random() < 0.4) tryAdd('breathHeap', 1);
        if (Math.random() < 0.35) for (let t = 0; t < 8; t++) { const x = rx(), y = ry(), n0 = r.props.length; let k = 0;
          for (const o of [-30, 0, 30]) if (add('ashCitizen', x + o, y + (o ? 6 : 0))) { const q = r.props[r.props.length - 1]; q.kind = 'h'; /* v3.19 왕의 기수 석상 삭제 (사용자 결정) — 재 시민 석상만 */ q.fl = Math.random() < 0.5; k++; }
          if (k >= 2) break; r.props.length = n0; }
      } else if (stage === 3) { if (Math.random() < 0.4) tryAdd('meatPole', 1); }
      else if (stage === 1) { if (Math.random() < 0.45) tryAdd('smileFlower', randi(1, 2)); }
    }
    // 장애물로 등록 + 문 사이 길 검사
    const solid = p => PROPS[p.name].r || PROPS[p.name].w;
    const toObs = p => { const sp = PROPS[p.name]; if (sp.pit) return { t: 'pit', c: false, pool: p.name, seed: p.x * 31 + p.y, x: p.x, y: p.y, w: sp.w, h: sp.h, x0: p.x - sp.w / 2, y0: p.y - sp.h / 2, x1: p.x + sp.w / 2, y1: p.y + sp.h / 2 }; return sp.w ? { t: 'prop', c: false, x: p.x, y: p.y, w: sp.w, h: sp.h, x0: p.x - sp.w / 2, y0: p.y - sp.h, x1: p.x + sp.w / 2, y1: p.y } : { t: 'prop', c: true, x: p.x, y: p.y, r: sp.r }; };
    const base = r.obs.slice();
    for (;;) {
      const obs = base.concat(r.props.filter(solid).map(toObs)), nav = buildNav(obs);
      const conn = keyPts.length < 2 || (() => { const dd = navFlood(nav, keyPts[0].x, keyPts[0].y); return keyPts.every(p => dd[navIdx(p.x, p.y)] >= 0); })();
      if (conn || !r.props.some(solid)) { r.obs = obs; r.nav = nav; break; }
      const i = r.props.map(solid).lastIndexOf(true); r.props.splice(i, 1);
    }
  }
  // v3.20 들머리 시설물 — 방 비율 자리 [이름, u, v] · 좌우 대칭으로 짝지어 놓음 (문 앞 · 방 가운데는 add가 알아서 비킴)
  const START_PROPS = {
    1: [['signpost', 0.36, 0.16], ['ruinPillar', 0.05, 0.5], ['ruinPillar', 0.95, 0.5]],
    2: [['brazier', 0.05, 0.12], ['brazier', 0.95, 0.12], ['armor', 0.3, 0.08], ['armor', 0.7, 0.08], ['candelabra', 0.05, 0.56], ['candelabra', 0.95, 0.56], ['table', 0.5, 0.88], ['chairBroken', 0.42, 0.9]],
    3: [['orcFire', 0.24, 0.3], ['orcFire', 0.76, 0.3], ['hideRack', 0.06, 0.14], ['meatRack', 0.94, 0.14], ['skullPike', 0.36, 0.06], ['skullPike', 0.64, 0.06], ['woodPile', 0.42, 0.9], ['boneHeap', 0.58, 0.9]],
    4: [['ashLamp', 0.2, 0.12], ['ashLamp', 0.8, 0.12], ['royalBanner', 0.36, 0.06], ['royalBanner', 0.64, 0.06], ['crownBrazier', 0.05, 0.14], ['crownBrazier', 0.95, 0.14], ['folkA', 0.4, 0.86], ['folkB', 0.6, 0.86]] };
  function decorStart(r, stage, add, W0, H0) { if (stage === 3) ensureOrcProps(); for (const [nm, u, v] of START_PROPS[stage] || []) add(nm, A.x0 + u * W0, A.y0 + v * H0); }
  function drawGroProp(p, sp) { // v1.52 움직이는 기괴한 소품 (칸 단위로만 움직임)
    const P = G.player, dx = P ? P.x - p.x : 999, d = P ? Math.hypot(dx, P.y - p.y) : 999, by = p.y + 2;
    if (sp.anim === 'flower') { // 웃는 꽃: 가까이 오면 이빨 난 입을 벌리고 고개를 돌림
      const near = d < 90, hx = near && Math.abs(dx) > 8 ? (dx > 0 ? 2 : -2) : 0;
      drawSprite('flStem', 'gro', 2, p.x, by, false); drawSprite(near ? 'flHeadO' : 'flHead', 'gro', 2, p.x + hx, by, false);
    } else if (sp.anim === 'meat') { // 고기 장식: 바람도 없는데 흔들리고, 피가 떨어짐
      const sw = [0, 2, 2, 0, -2, -2][Math.floor(time * 6 + p.x) % 6], X = p.x + 14;
      drawSprite('mpPole', 'gro', 2, X, by, false); drawSprite('mpMeat', 'gro', 2, X + sw, by, false);
      if (Math.random() < 0.012) G.parts.push({ x: X - 18 + 27 + sw, y: by - 56 + 26, vx: 0, vy: 10, t: 0.5, c: '#a82a2a', g: 220 });
    } else if (sp.anim === 'heap') { // 숨 쉬는 재 더미: 가까이 가면 숨을 멈추고 잉걸 눈이 깜빡
      const near = d < 70, br = near ? 0 : Math.floor((time + p.x * 0.013) / 0.34) % 2;
      drawSprite('ghBot', 'ashHeap', 2, p.x, by, false); drawSprite('ghTop', 'ashHeap', 2, p.x, by - br * 2, false);
      if (near && Math.floor(time * 3) % 2 === 0) { ctx.fillStyle = '#ff7a30'; ctx.fillRect((p.x - 16 + 12) & ~1, (by - 28 + 10) & ~1, 2, 2); }
    } else if (sp.anim === 'citizen') { // 잿빛 시민: 등을 돌린 사이 자세가 바뀌어 있음
      if (P) { const away = (p.x > P.x ? 1 : -1) !== (P.face || 1); if (away && !p._away && Math.random() < 0.5) { p.pose = !p.pose; p.fl = P.x < p.x; } p._away = away; }
      const h = p.kind !== 'b', m = h ? (p.pose ? 'huskUp' : 'huskA') : (p.pose ? 'heraldB' : 'herald');
      if (!h) { const pd = art('heraldPed', () => gCanvas(fromRows(['kkkkkkkkkkkkkkkkkk', 'ka11111111111111kk', 'k2222222222222234k', 'kkkkkkkkkkkkkkkkkk', '.k3333333333333k.'.padEnd(18, '.'), '.kkkkkkkkkkkkkkk..'.padEnd(18, '.')]), { k: '#0b0a09', a: '#b9b9af', '1': '#9a9a92', '2': '#6f6f69', '3': '#43433f', '4': '#292926' })); // v2.77 왕의 기수 석상 받침
        ctx.drawImage(pd, (p.x - pd.width / 2) & ~1, (by - pd.height + 2) & ~1); drawSprite(m, 'statueB', 2, p.x, by - pd.height + 6, !!p.fl); }
      else drawSprite(m, 'statueH', 2, p.x, by, !!p.fl);
    }
  }
  function drawProp(p) {
    const s1 = G.stage >= 1 && G.stage <= 4 && typeof RUIN1 !== 'undefined'; // v3.19 1장: 납작 띠 그림자 → 밑동에 붙은 그림자 (오른쪽 2칸 · 끝줄 디더)
    if (PROPS[p.name].anim) { const sp = PROPS[p.name]; if (s1) { const bx = (p.x & ~1) - 2; dshRect(ctx, bx, p.y, 8, 2, 0.5); dshRect(ctx, bx + 2, p.y + 2, 8, 2, 0.4); dshRect(ctx, bx + 4, p.y + 4, 6, 2, 0.25); } else dshRect(ctx, (p.x - (sp.r || 8)) & ~1, p.y, ((sp.r || 8) * 2) & ~1, 2, 0.5); drawGroProp(p, sp); return; }
    if (p.name === 'ruinPillar' && G.stage === 1 && typeof RUIN1 !== 'undefined') { const c = drawProp._rs || (drawProp._rs = RUIN1.stub(9)); ctx.drawImage(c, (p.x - c.width / 2) & ~1, (p.y - 50) & ~1); return; } // v3.19 1장: 폐허의 부러진 돌기둥 (붙은 그림자 포함)
    if (p.name === 'orcFire' && typeof CAMP3 !== 'undefined') { const c = drawProp._of || (drawProp._of = CAMP3.orcFire(10)), x = (p.x - c.width / 2) & ~1, y = (p.y - 36) & ~1, f = Math.floor(time * 10 + p.x) % 3; ctx.drawImage(c, x, y); ctx.fillStyle = '#ffd060'; ctx.fillRect(x + 32 + (f === 1 ? 2 : 0), y + 12 - (f === 2 ? 2 : 0), 2, 2); ctx.fillStyle = '#f08a28'; ctx.fillRect(x + 28 + (f === 0 ? 2 : 0), y + 16 - (f === 1 ? 2 : 0), 2, 2); return; } // v3.19 오크 모닥불: 돌 고리 · 장작 · 꼬치 (불꽃 끝은 3프레임으로 일렁임)
    if (p.name === 'cage' && G.stage === 2 && typeof KEEP2 !== 'undefined') { const c = drawProp._cg || (drawProp._cg = KEEP2.cage(4)); ctx.drawImage(c, (p.x - c.width / 2) & ~1, (p.y - 50) & ~1); return; } // v3.19 2장 철창: 둥근 지붕 · 쇠살 · 안에 해골
    const sp = PROPS[p.name], c = sp.raw ? propCanvas(p.name) : ash4(propCanvas(p.name), 'prop_' + p.name), x = (p.x - c.width / 2) & ~1, y = (p.y - c.height + (sp.foot || 0) * 2) & ~1;
    if (s1 && !sp.pit) { const m = drawProp._sh || (drawProp._sh = {}); const sk = (G.stage === 4 ? '4_' : '') + p.name; ctx.drawImage(m[sk] || (m[sk] = RUIN1.withShadow(c)), x - 8, y - 8); } else {
    { const xa = x + 2, xb = x + c.width - 2; if (xb > xa) dshRect(ctx, xa, p.y, Math.ceil((xb - xa) / 2) * 2, 2, 0.5); } }
    if (p.amb && sp.folk) { // 매복 조각상: 눈에 희미한 불씨, 깨어나기 직전엔 떨린다
      const R = G.dun && G.dun.cur, on = R && !R.cleared, sx = p.warn && on ? (Math.floor(time * 24) % 2 ? 2 : -2) : 0, e = FOLK_EYE[p.name];
      ctx.drawImage(c, x + sx, y);
      if (on && (p.warn || Math.floor(time * 3 + p.x) % 5 === 0)) { ctx.fillStyle = p.warn ? '#ffb060' : '#ff6a2a'; ctx.fillRect(x + sx + (e[0] + 0) * 2, y + e[1] * 2, 2, 2); }
      if (p.warn && on && Math.random() < 0.4) G.parts.push({ x: p.x + rand(-6, 6), y: p.y - rand(4, 28), vx: rand(-8, 8), vy: -rand(10, 30), t: 0.4, c: pick(['#cdc7ba', '#8a847a']), g: 0 });
    } else ctx.drawImage(c, x, y);
    if (sp.flame) for (const [fx, fy] of sp.flame) {
      const f = Math.floor(time * 10 + fx * 3 + p.x) % 3;
      ctx.fillStyle = '#ff8a2a'; ctx.fillRect(x + fx * 2, y + fy * 2 - 2 - (f === 1 ? 2 : 0), 2, 2);
      ctx.fillStyle = '#ffe08a'; ctx.fillRect(x + fx * 2 + (f === 2 ? 2 : 0), y + fy * 2 - 4 - (f === 0 ? 2 : 0), 2, 2);
    }
  }

  // ---------- 바닥 무늬 생성기 (모두 2px 칸)
  function genFern() {
    const g = mkGrid(15, 10);
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI / 2 + (f - 2) * 0.6, L = rand(4.5, 6.5);
      for (let t = 1; t < L; t++) {
        const x = Math.round(7 + Math.cos(a) * t), y = Math.round(9 + Math.sin(a) * t * 0.85 + t * t * 0.07 * Math.abs(f - 2));
        if (!g[y] || g[y][x] === undefined) continue;
        g[y][x] = t > L - 1.5 ? 'M' : 'm';
        if (t % 2 === 0 && t < L - 1) { const sx = x + (Math.cos(a) > 0 ? 1 : -1); if (g[y - 1] && g[y - 1][sx] !== undefined) g[y - 1][sx] = 'd'; }
      }
    }
    return g;
  }
  const FERN_PAL = { m: '#36602a', M: '#6a9a44', d: '#24401c' };
  const SHROOMS = {
    red: fromRows(['.kkk.', 'kRWRk', 'kRRRk', 'kkkkk', '.kwk.', '.kkk.']),
    brown: fromRows(['.kkkk.', 'kbBbbk', 'kkkkkk', '.kwwk.', '.kkkk.']),
    tall: fromRows(['.kk.', 'kWWk', 'kkkk', '.kw.', '.kw.', '.kk.']),
    glow: fromRows(['.kkk.', 'kcCck', 'kkkkk', '.kwk.', '.kk.']),
  };
  const SHROOM_PAL = { k: '#121214', R: '#a83030', W: '#f0ece0', w: '#d8d0c0', b: '#8a5a30', B: '#a87040', c: '#3aa0b8', C: '#a0f0ff' };
  const BONES = fromRows(["..............", "........k.kkk.", "......kkWkWWwk", "....kkwwWWWWww", "k.kkwwwkkWdWdw", "Wkwwkkk.kwwwww", "wwkkwwwk.kwdwk", "wkkwwkk...kkk."]); // v2.81
  const STONEPAD = fromRows(['.kkkk.', 'kGGggk', 'kGgggk', 'kgggdk', '.kkkk.']);
  const STONEPAD_PAL = { k: '#121214', G: '#a8a4ae', g: '#7c7a82', d: '#4c4a52' };
  const CANDLES = fromRows([".....ok.....", "....keEk....", "..okkeek....", ".keEkeEkok..", ".keekeEkeEok", ".keEkeEkeeeE", ".keEkeEkeEee", "kEeEEeEweEeE", "kEEEEEwwwwww"]); // v2.81
  // 타원 영역에 점을 디더링으로 흩뿌린다
  function scatterPatch(g, cx, cy, rx, ry, cols, dens) {
    for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) {
      const e = (x * x) / (rx * rx) + (y * y) / (ry * ry); if (e > 1) continue;
      if (Math.random() < dens * (1 - e * 0.7)) { g.fillStyle = pick(cols); g.fillRect(((cx + x) & ~1), ((cy + y) & ~1), 2, 2); }
    }
  }
  function genWeb() {
    const g = mkGrid(12, 10);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI / 2; for (let t = 0; t < 11; t++) { const x = Math.round(Math.cos(a) * t), y = Math.round(Math.sin(a) * t * 0.85); if (g[y] && g[y][x] !== undefined) g[y][x] = 'w'; } }
    for (const R of [4, 7, 10]) for (let a = 0; a < Math.PI / 2; a += 0.12) { const x = Math.round(Math.cos(a) * R), y = Math.round(Math.sin(a) * R * 0.85); if (g[y] && g[y][x] !== undefined && Math.random() < 0.85) g[y][x] = 'W'; }
    return g;
  }
  function genCarpet(len, wid, vert) {
    // 붉은 융단: 금실 테두리, 마름모 무늬, 끝은 술 장식, 군데군데 해지고 바랬다
    const L = len, Wd = wid, g = mkGrid(vert ? Wd : L, vert ? L : Wd);
    const set = (i, j, c) => { const x = vert ? j : i, y = vert ? i : j; if (g[y] && g[y][x] !== undefined) g[y][x] = c; };
    for (let i = 0; i < L; i++) for (let j = 0; j < Wd; j++) {
      const e = Math.min(j, Wd - 1 - j), endD = Math.min(i, L - 1 - i);
      let c = e === 0 ? 'k' : e === 1 ? 'y' : e === 2 ? 'D' : 'R';
      if (c === 'R') { const m = ((i % 14) + 14) % 14, dj = Math.abs(j - (Wd - 1) / 2); if (Math.abs(m - 7) + dj === Math.round(Wd / 4) || (m === 7 && dj < 1)) c = 'y'; else if (Math.abs(m - 7) + dj < Wd / 4) c = 'r'; }
      if (endD === 0) c = j % 2 ? 'y' : '.'; else if (endD === 1) c = 'k';
      if (endD > 1 && endD < 10 && Math.random() < (10 - endD) / 40) c = '.';
      set(i, j, c);
    }
    for (let k = 0; k < L / 30; k++) { const i = randi(8, L - 9), j = randi(3, Wd - 4); for (let d = 0; d < 6; d++) set(i + randi(-2, 2), j + randi(-1, 1), dith(i + d, j, 0.5) ? 'D' : '.'); }
    return g;
  }
  const CARPET_PAL = { k: '#1a0c10', y: '#a8822e', D: '#4a0c14', R: '#7a1420', r: '#5a0e18' };
  function genRug(rx, ry) {
    const g = mkGrid(rx * 2 + 1, ry * 2 + 1);
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const e = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry)); if (e > 1) continue;
      g[y + ry][x + rx] = e > 0.92 ? 'k' : e > 0.84 ? 'y' : e > 0.62 ? 'P' : e > 0.55 ? 'y' : e > 0.25 ? ((Math.abs(x) + Math.abs(y)) % 4 === 0 ? 'p' : 'R') : 'y';
    }
    return g;
  }
  const RUG_PAL = { k: '#120a10', y: '#a8822e', P: '#3a1848', p: '#5a2a6a', R: '#6a1420' };
  const RUG_PALS = [
    RUG_PAL,
    { k: '#0a0c14', y: '#b8a060', P: '#142a4a', p: '#2a4a78', R: '#1a3050' },
    { k: '#0a100a', y: '#9a8a4a', P: '#1a3a22', p: '#2e5a36', R: '#5a1418' },
    { k: '#140c08', y: '#c8a050', P: '#4a2a14', p: '#7a4a22', R: '#7a2a14' },
    { k: '#0e0a10', y: '#8a8494', P: '#2a2232', p: '#4a3e5a', R: '#3a1a2a' },
  ];
  // 무늬가 다른 원형 (0 동심원, 1 햇살, 2 점박이)
  function genRugRound(rx, ry, pat) {
    const g = mkGrid(rx * 2 + 1, ry * 2 + 1);
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const e = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry)); if (e > 1) continue;
      const an = Math.atan2(y / ry, x / rx);
      let c = e > 0.92 ? 'k' : e > 0.84 ? 'y' : 'R';
      if (c === 'R') {
        if (pat === 0) c = e > 0.62 ? 'P' : e > 0.55 ? 'y' : e > 0.25 ? ((Math.abs(x) + Math.abs(y)) % 4 === 0 ? 'p' : 'R') : 'y';
        else if (pat === 1) c = e < 0.18 ? 'y' : Math.floor((an + Math.PI) / (TAU / 16)) % 2 ? (e > 0.6 ? 'P' : 'R') : (e > 0.6 ? 'p' : 'P');
        else c = e > 0.7 ? 'P' : (Math.round(x / 3 + y / 2) % 3 === 0 && (x + y) % 2 === 0 ? 'y' : e < 0.3 ? 'p' : 'R');
      }
      g[y + ry][x + rx] = c;
    }
    return g;
  }
  // 사각 융단: 무늬 띠 테두리, 가운데 마름모 문장, 네 귀 장식, 짧은 변에 술
  function genRugRect(wc, hc, torn) {
    const g = mkGrid(wc + 4, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const e = Math.min(x, y, wc - 1 - x, hc - 1 - y);
      let c = e === 0 ? 'k' : e === 1 ? 'y' : e <= 3 ? ((x + y) % 3 === 0 ? 'y' : 'P') : e === 4 ? 'y' : 'R';
      if (c === 'R') {
        const dx = Math.abs(x - (wc - 1) / 2) / (wc / 2), dy = Math.abs(y - (hc - 1) / 2) / (hc / 2), d = dx + dy;
        if (d < 0.42) c = d > 0.36 ? 'y' : d > 0.2 ? 'P' : d > 0.12 ? 'p' : 'y';
        else if (Math.min(x, wc - 1 - x) + Math.min(y, hc - 1 - y) < 11 && Math.min(x, wc - 1 - x) > 4 && Math.min(y, hc - 1 - y) > 4) c = 'p';
        else if ((x * 3 + y * 5) % 17 === 0) c = 'P';
      }
      if (torn && (Math.sin(x * 0.7) + Math.sin(y * 0.9 + 1) > 1.4 || (x > wc * 0.7 && y > hc * 0.6 && dith(x, y, (x / wc - 0.7) * 3)))) c = '.';
      g[y][x + 2] = c;
    }
    for (let y = 1; y < hc - 1; y += 2) { g[y][0] = 'y'; g[y][1] = 'y'; g[y][wc + 2] = 'y'; g[y][wc + 3] = 'y'; }
    return g;
  }
  // 팔각 깔개: 별 무늬
  function genRugOct(r) {
    const n = r * 2 + 1, g = mkGrid(n, Math.round(n * 0.62));
    const ry = (g.length - 1) / 2;
    for (let y = 0; y < g.length; y++) for (let x = 0; x < n; x++) {
      const dx = Math.abs(x - r) / r, dy = Math.abs(y - ry) / ry, o = Math.max(dx, dy, (dx + dy) * 0.72);
      if (o > 1) continue;
      const an = Math.atan2((y - ry) / ry, (x - r) / r), star = o < 0.55 * (0.7 + 0.3 * Math.cos(an * 8));
      g[y][x] = o > 0.92 ? 'k' : o > 0.84 ? 'y' : star ? (o < 0.15 ? 'y' : 'p') : o > 0.66 && o < 0.72 ? 'y' : 'R';
    }
    return g;
  }
  // 짐승 가죽 깔개 (머리·다리 달린 털가죽)
  const PELT = fromRows([
    '.....kk.........kk.....', '....kFFk.......kFFk....', '.....kFFkkkkkkkFFk.....', '.......kFfffffffFk......', '.....kkFfffFffffFkk.....', '....kFFfffffffffffFFk...',
    '...kFffffDffffDfffffFk..', '..kFfffffffffffffffffFk.', '..kFffDfffffffffDffffFk.', '..kFfffffffDffffffffFk..', '...kFfffffffffffffffFk..', '....kFFfffDfffffffFFk...',
    '.....kkFffffffffFkk.....', '.......kFFkkkkFFk.......', '......kWkk....kkWk......', '.....kFk........kFk.....', '......k..........k......']);
  const PELT_PAL = { k: '#140c06', F: '#4a3018', f: '#6e4a2a', D: '#3a2412', W: '#d8d0c0' };

  // ---------- 바닥 꾸미기: 초원
  function paintMeadowDecor(g, R) {
    const fl = G ? (G.flatLights = []) : []; fl.room = R; // v3.74 어느 방 바닥의 빛인지 표시 (다른 방에 남은 빛이 안 보이게)
    const MPs = meadowCurves(), onPath = (x, y, clearance = 20) => MPs.some(c => { for (let t = c.a; t <= c.b; t += 6) { const m = c.at(t), px = c.vert ? m : t, py = c.vert ? t : m; if (Math.hypot(px - x, py - y) < clearance) return true; } return false; });
    const busy = (x, y, r) => (R && obsHitL(R.obs, x, y, r)) || onPath(x, y, r + 20) || !decFree(x, y, Math.max(r, 6));
    const spot = (pad = 20, r = 10) => { for (let i = 0; i < 30; i++) { const x = rand(A.x0 + pad, A.x1 - pad), y = rand(A.y0 + pad, A.y1 - pad - 10); if (!busy(x, y, r)) return { x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2 }; } return null; };
    const area = (A.x1 - A.x0) * (A.y1 - A.y0) / 540000;
    const shopR = R && R.type === 'shop'; // v3.19 상점은 집기 없이 (통나무 · 그루터기 · 이야기 소품 뺌)
    // 땅 얼룩: 이끼·맨흙·짙은 풀
    for (let i = 0; i < 6 * area + 2; i++) { const p = spot(30, 0); if (p) scatterPatch(g, p.x, p.y, randi(20, 50), randi(12, 26), pick([['#2e5222', '#36602a'], ['#3a3020', '#46382a'], ['#1a2e14', '#22381a']]), 0.35); }
    // 낙엽 더미 (가을빛)
    for (let i = 0; i < randi(1, 4) * area; i++) { const p = spot(30, 10); if (p) scatterPatch(g, p.x, p.y, randi(18, 34), randi(10, 18), ['#a04a1a', '#d8883a', '#6a2a12', '#d8c050', '#8a3a14'], 0.45); }
    // 꽃밭
    for (let i = 0; i < randi(0, 3) * area; i++) { const p = spot(30, 10); if (p) { scatterPatch(g, p.x, p.y, randi(16, 30), randi(8, 16), ['#3e6a2c', '#4a7a34'], 0.5); scatterPatch(g, p.x, p.y, randi(14, 26), randi(7, 14), pick([['#e8e0c0', '#e0c040'], ['#b080e0', '#e8e0c0'], ['#e07090', '#e0c040']]), 0.22); } }
    // 고사리 · 키 큰 풀
    for (let i = 0; i < randi(6, 14) * area; i++) { const p = spot(10, 8); if (p) gPaint(g, genFern(), FERN_PAL, p.x - 14, p.y - 18); }
    for (let i = 0; i < 40 * area; i++) { const p = spot(6, 0); if (p) { const t = pick(['tuft1', 'tuft2', 'tuft3']); stamp(g, DECO_MAPS[t], Object.assign({}, DECO, Math.random() < 0.5 ? { m: '#4a7a34', M: '#78a850' } : { m: '#36602a', M: '#5a8a3a' }), p.x, p.y, 2, Math.random() < 0.5); } }
    for (let i = 0; i < 14 * area; i++) { const p = spot(6, 0); if (p) stamp(g, DECO_MAPS[pick(['flowerY', 'flowerP', 'flowerW'])], DECO, p.x, p.y, 2, Math.random() < 0.5); }
    // 바위 · 그루터기 · 통나무(버섯 돋은) · 덤불
    // v2.91 바위는 방 전체에 고르게 뿌리지 않고 몇 무더기로만 · 바위 장애물이 많은 방은 그만큼 덜 놓음
    { const obsRock = R ? R.obs.filter(b => b.t === 'rock').length : 0, big = Math.max(0, Math.round(randi(0, 2) * Math.min(area, 1.6)) - (obsRock > 2 ? 1 : 0));
      for (let i = 0; i < big; i++) { const p = spot(40, 20); if (p) { stamp(g, DECO_MAPS.rockBig, DECO, p.x, p.y, 2, Math.random() < 0.5); if (Math.random() < 0.6) stamp(g, DECO_MAPS.rockB, DECO, p.x + pick([-18, 24]), p.y + randi(5, 8) * 2, 2); } }
      const clumps = Math.max(0, Math.round(randi(1, 3) * Math.min(area, 1.6)) - Math.floor(obsRock / 3));
      for (let i = 0; i < clumps; i++) { const p = spot(24, 10); if (!p) continue; const m = randi(1, 3);
        for (let j = 0; j < m; j++) { const x = p.x + (j ? randi(-9, 9) * 2 : 0), y = p.y + (j ? randi(-5, 5) * 2 : 0); if (j && !decFree(x, y, 6)) continue; stamp(g, DECO_MAPS[pick(j ? ['rockB', 'rockA'] : ['rockA', 'rockC', 'rockD'])], DECO, x, y, 2, Math.random() < 0.5); } } }
    for (let i = 0; i < randi(0, 3) * (shopR ? 0 : area); i++) { const p = spot(30, 12); if (p) { stamp(g, DECO_MAPS.stump, woodPal(), p.x, p.y, 2); if (Math.random() < 0.5) gPaint(g, SHROOMS.brown, SHROOM_PAL, p.x + 14, p.y + 4); } }
    for (let i = 0; i < randi(0, 2) * (shopR ? 0 : area); i++) { const p = spot(40, 16); if (p) { stamp(g, DECO_MAPS.log, woodPal(), p.x, p.y, 2, Math.random() < 0.5); for (let k = 0; k < randi(1, 3); k++) gPaint(g, pick([SHROOMS.brown, SHROOMS.red, SHROOMS.tall]), SHROOM_PAL, p.x + 4 + k * 8, p.y - 8); } }
    for (let i = 0; i < randi(2, 6) * area; i++) { const p = spot(20, 10); if (p) stamp(g, DECO_MAPS.bush2, Object.assign({}, DECO, pick([{ '6': '#c03040' }, { '6': '#6a40a0' }, { '6': '#e0c040' }])), p.x, p.y, 2, Math.random() < 0.5); }
    // 버섯: 요정의 고리(종류·크기 무작위) 또는 흩어진 무리
    const kinds = ['red', 'brown', 'tall', 'glow'];
    if (Math.random() < 0.4) {
      const rx = randi(36, 80), ry = Math.round(rx * 0.62), c = spot(rx + 20, rx * 0.6);
      if (c) { const k1 = pick(kinds), k2 = pick(kinds), n = Math.round(rx / 5.5); for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-0.1, 0.1), k = Math.random() < 0.8 ? k1 : k2, x = c.x + Math.cos(a) * rx, y = c.y + Math.sin(a) * ry; gPaint(g, SHROOMS[k], SHROOM_PAL, x - 5, y - 10); if (k === 'glow' && i % 3 === 0) fl.push({ x, y: y - 4, r: 34, a: 0.35, c: '120,230,255', ca: 0.12 }); } }
    }
    for (let i = 0; i < randi(1, 5) * area; i++) { const p = spot(20, 10); if (!p) continue; const k = pick(kinds); for (let j = 0; j < randi(2, 5); j++) gPaint(g, SHROOMS[k], SHROOM_PAL, p.x + randi(-10, 10), p.y + randi(-6, 6)); if (k === 'glow') fl.push({ x: p.x, y: p.y, r: 40, a: 0.4, c: '120,230,255', ca: 0.14 }); }
    if (Math.random() < 0.45) { const p = spot(40, 24); if (p && !onPath(p.x, p.y, 52)) { const sp = SPRINGS.springS; gPaint(g, sp, POND_PAL, p.x - sp[0].length, p.y - sp.length); } }
    // 이야기 소품: 꺼진 모닥불, 짐승 뼈, 부서진 수레바퀴, 거미줄, 룬 비석, 허수아비
    if (shopR) return;
    if (Math.random() < 0.35) { const p = spot(40, 20); if (p) { gPaint(g, fromRows(PROP_MAPS.campfire[0]), PROP_MAPS.campfire[1], p.x - 12, p.y - 6); fl.push({ x: p.x, y: p.y, r: 30, a: 0.3, c: '255,120,50', ca: 0.14, flick: true }); for (let k = 0; k < 2; k++) gPaint(g, STONEPAD, STONEPAD_PAL, p.x + pick([-30, 22]), p.y + randi(-4, 8)); } }
    if (Math.random() < 0.4) { const p = spot(30, 10); if (p) gPaint(g, fromRows(PROP_MAPS.deerSkull[0]), PROP_MAPS.deerSkull[1], p.x, p.y); }
    if (Math.random() < 0.4) { const p = spot(30, 10); if (p) gPaint(g, BONES, PROP_MAPS.deerSkull[1], p.x, p.y); }
    if (Math.random() < 0.25) { const p = spot(30, 10); if (p) gPaint(g, fromRows(PROP_MAPS.wheel[0]), PROP_MAPS.wheel[1], p.x, p.y); }
    if (Math.random() < 0.5) { const left = Math.random() < 0.5, web = genWeb(); gPaint(g, left ? web : web.map(r => r.slice().reverse()), { w: 'rgba(200,200,215,.55)', W: 'rgba(230,230,240,.75)' }, left ? A.x0 + 2 : A.x1 - 26, A.y0 + 2); }
    if (Math.random() < 0.4) { const p = spot(40, 14); if (p) { stamp(g, DECO_MAPS.rune, DECO, p.x, p.y, 2); fl.push({ x: p.x + 6, y: p.y + 12, r: 30, a: 0.25, c: '255,60,60', ca: 0.1 }); } }
    // v3.63 일반 허수아비 소품 삭제 (들머리 훈련 허수아비는 그대로)
  }
  // 초원 길 모양: 구불길·곧은길·갈림길·교차·징검돌·개울·없음
  // meadowCurves: 04_monsters.js에서 불러올 때 먼저 써서 그쪽으로 옮김
  // 흙길 한 칸 색: 가운데는 흙, 가장자리로 갈수록 흙 점이 성겨지며 풀색과 디더링으로 섞인다 (null = 칠하지 않음, 풀 그대로)
  // dirtCol: 04_monsters.js에서 불러올 때 먼저 써서 그쪽으로 옮김
  // 나무다리: 개울을 가로지르는 널판 (vertFlow = 개울이 세로로 흐름)
  function genBridge(vertFlow) {
    const L = 22, Wd = 12, g = mkGrid(vertFlow ? L : Wd, vertFlow ? Wd : L);
    for (let i = 0; i < L; i++) for (let j = 0; j < Wd; j++) {
      const rail = j <= 1 || j >= Wd - 2, end = i === 0 || i === L - 1;
      let c = rail ? (j === 0 || j === Wd - 1 ? 'k' : (i % 6 === 0 ? 'k' : 'B')) : i % 3 === 2 ? 'k' : (i % 6 < 3 ? 'w' : 'b');
      if (!rail && i % 3 === 0 && (j === 3 || j === Wd - 4)) c = 'y';
      if (end && !rail) c = 'k';
      const x = vertFlow ? i : j, y = vertFlow ? j : i; g[y][x] = c;
    }
    return g;
  }
  const BRIDGE_PAL = { k: '#0b0a0e', w: '#8a6a48', b: '#6a4a30', B: '#4a3220', y: '#a8a090' };
  // paintMeadowCurve: 04_monsters.js에서 불러올 때 먼저 써서 그쪽으로 옮김

  // ---------- 바닥 꾸미기: 성채
  function paintCastleDecor(g, R) {
    const fl = G ? (G.flatLights = []) : []; fl.room = R; // v3.74 어느 방 바닥의 빛인지 표시 (다른 방에 남은 빛이 안 보이게)
    const busy = (x, y, r) => (R && obsHitL(R.obs, x, y, r)) || !decFree(x, y, Math.max(r, 6));
    const spot = (pad = 20, r = 10) => { for (let i = 0; i < 30; i++) { const x = rand(A.x0 + pad, A.x1 - pad), y = rand(A.y0 + pad, A.y1 - pad); if (!busy(x, y, r)) return { x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2 }; } return null; };
    const W0 = A.x1 - A.x0, H0 = A.y1 - A.y0, area = W0 * H0 / 540000, sh = R ? R.shape : 'hall';
    // 붉은 융단
    const cp = { hall: 0.55, greathall: 0.75, corridor: 0.7, corridorV: 0.7, chamber: 0 }[sh] || 0;
    let carpet = false; // v1.53 긴 융단을 깐 방엔 작은 깔개를 겹쳐 깔지 않음
    if (Math.random() < cp) { const D0 = DEC; DEC = null;
      // 융단이 기둥·잔해·벽·소품 밑으로 지나가면 깔지 않는다 (v0.59)
      const clear = (x0, y0, x1, y1) => !R || (!R.obs.some(o => o.c ? o.x + o.r > x0 - 4 && o.x - o.r < x1 + 4 && o.y + o.r > y0 - 4 && o.y - o.r * 1.6 < y1 + 4 : o.x1 > x0 - 4 && o.x0 < x1 + 4 && o.y1 > y0 - 4 && o.y0 - 30 < y1 + 4) && !(R.props || []).some(q => rectHit(propRect(q), { x0, y0, x1, y1 }, 4)));
      if (sh === 'corridorV' || (sh !== 'corridor' && R && R.doors.n != null && Math.random() < 0.45)) { const wd = sh === 'corridorV' ? 18 : 24, len = Math.floor((A.y1 - A.y0 - 20) / 2); if (clear(DOOR.n.x - wd, A.y0 + 6, DOOR.n.x + wd, A.y1 - 14)) carpet = true, gPaint(g, genCarpet(len, wd, true), CARPET_PAL, DOOR.n.x - wd, A.y0 + 6); }
      else { const wd = sh === 'corridor' ? 20 : 24, len = Math.floor((W0 - 60) / 2); if (clear(A.x0 + 30, CY - wd, A.x1 - 30, CY + wd)) carpet = true, gPaint(g, genCarpet(len, wd, false), CARPET_PAL, A.x0 + 30, CY - wd); }
      DEC = D0; }
    // 깔개: 원형(무늬 3종)·사각 문장 융단·해진 융단·팔각 별 무늬·짐승 가죽, 색 5종
    const nRug = sh === 'chamber' ? (Math.random() < 0.85 ? 1 : 0) : sh === 'greathall' ? randi(0, 2) : sh === 'hall' ? (Math.random() < 0.4 ? 1 : 0) : sh === 'corridorV' || sh === 'corridor' ? 0 : 0;
    for (let i = 0; i < (carpet ? 0 : nRug); i++) {
      const kind = pick(['round', 'rect', 'rect', 'torn', 'oct', 'pelt']), pal = pick(RUG_PALS);
      let grid, gp = pal;
      if (kind === 'round') { const rx = randi(24, 38); grid = genRugRound(rx, Math.round(rx * 0.6), randi(0, 2)); }
      else if (kind === 'rect' || kind === 'torn') grid = genRugRect(randi(30, 46), randi(18, 26), kind === 'torn');
      else if (kind === 'oct') grid = genRugOct(randi(18, 26));
      else { grid = Math.random() < 0.5 ? PELT : PELT.map(r => r.slice().reverse()); gp = PELT_PAL; }
      const p = spot(grid[0].length + 30, grid[0].length * 0.9); if (p) gPaint(g, grid, gp, p.x - grid[0].length, p.y - grid.length);
    }
    // 깨진 바닥판
    for (let i = 0; i < randi(2, 5) * area; i++) { const p = spot(20, 0); if (!p) continue; for (let k = 0; k < randi(4, 9); k++) { g.fillStyle = pick(['#121017', '#0b0a0e', '#3a3642']); g.fillRect(p.x + randi(-8, 8) * 2, p.y + randi(-4, 4) * 2, 2 * randi(1, 3), 2); } }
    // 핏자국 웅덩이 (도트)
    for (let i = 0; i < randi(0, 3) * area; i++) { const p = spot(30, 0); if (p) scatterPatch(g, p.x, p.y, randi(10, 22), randi(6, 12), ['#4a0c12', '#5a1016', '#3a080c'], 0.6); }
    // 뼈 · 해골
    for (let i = 0; i < randi(1, 4) * area; i++) { const p = spot(20, 6); if (p) gPaint(g, BONES, PROP_MAPS.deerSkull[1], p.x, p.y); }
    for (let i = 0; i < randi(0, 2) * area; i++) { const p = spot(20, 6); if (p) gPaint(g, fromRows(['.kkk.', 'kWWWk', 'kkWkk', 'kWWWk', '.kWk.']), PROP_MAPS.deerSkull[1], p.x, p.y); }
    // 바닥 촛불 무리 (벽 가까이)
    for (let i = 0; i < randi(0, 3); i++) { const x = rand(A.x0 + 30, A.x1 - 30), y = pick([A.y0 + 12, A.y1 - 14]); if (busy(x, y, 8)) continue; gPaint(g, CANDLES, { e: '#e8e0c8', E: '#bcb4a0', w: '#a49c8e', k: '#0b0a0e', o: '#ffc060' }, x, y - 10); fl.push({ x: x + 6, y: y - 6, r: 44, a: 0.45, c: '255,190,90', ca: 0.14, flick: true }); }
    // 잔해 조각
    for (let i = 0; i < 6 * area; i++) { const p = spot(10, 0); if (p) { g.fillStyle = pick(['#2a2731', '#3a3642', '#4d4858']); g.fillRect(p.x, p.y, 2 * randi(1, 3), 2 * randi(1, 2)); } }
  }
  // 성채 윗벽 장식: 창문 자리마다 창·태피스트리·방패·초상화·사슬·해골 벽감 중 하나
  function paintCastleWall(g) {
    const T0 = A.y0 - 100;
    for (let i = 0; i < PILLARS.length - 1; i++) {
      const mx = Math.round((PILLARS[i] + PILLARS[i + 1]) / 4) * 2;
      if (Math.abs(mx - DOOR.n.x) < (CUR_ROOM && CUR_ROOM.doors && CUR_ROOM.doors.n != null ? 40 : 8) || (CUR_ROOM && CUR_ROOM.sealW && Math.abs(mx - DOOR.n.x) < 110)) continue; // v2.59 인장 벽 둘레엔 장식 없음
      if (typeof WDECO !== 'undefined' && G && G.stage === 2) { const k2 = WDECO.pick(CUR_ROOM, i, T0); if (k2 && k2 !== 'w2') WDECO.draw(g, k2, WDECO.slotX(i), T0); continue; } // v3.29 2장 새 벽장식 · 대칭 배치 (창은 03에서)
      const k = ROOMSTYLE.wall ? ROOMSTYLE.wall[i % ROOMSTYLE.wall.length] : 'window';
      if (k === 'window') continue;
      { const m0 = PROP_MAPS[k], g0 = fromRows(m0[0]), w0 = g0[0].length * 2, h0 = g0.length * 2, y0 = T0 + 30 - h0 / 2 + (k === 'tapestry' ? 6 : 0); if (typeof OCC !== 'undefined' && !OCC.wall(mx - w0 / 2, y0, w0, h0)) continue; } // v2.85 벽 장식은 앞에 선 소품 · 장애물 그림과 겹치면 걸지 않음
      // 창을 벽돌로 덮고 장식을 건다
      g.fillStyle = '#121017'; g.fillRect(mx - 14, T0 + 2, 28, 40);
      for (let y = T0 + 2; y < T0 + 42; y += 8) for (let x = mx - 14 + ((y / 8) % 2) * 9 - 9; x < mx + 14; x += 18) { g.fillStyle = '#2a2731'; g.fillRect(Math.max(mx - 14, x), y, Math.min(17, mx + 14 - Math.max(mx - 14, x)), 7); }
      const m = PROP_MAPS[k];
      const grid = fromRows(m[0]), w = grid[0].length * 2, h = grid.length * 2;
      gPaint(g, grid, m[1], mx - w / 2, T0 + 30 - h / 2 + (k === 'tapestry' ? 6 : 0));
    }
  }
  // ================================================================ v1.55 맵 분위기 (모두 2px 칸 단위 · 디더는 그늘에만)
  // 챕터1: 구름 그림자 · 반딧불이 깜빡임 · 날리는 꽃씨 · 연못 물고기 / 챕터2: 달빛 줄기+먼지 · 횃불 3단계 일렁임 · 쥐 · 물방울
  // 챕터3: 횃불 불티 · 연기 · 울타리 위 까마귀 / 챕터4: 재 눈(절반) · 성벽 너머 잉걸 섬광 · 화로·횃불 불꽃 3단계 + 연기
  const AMB = { room: null, s: null };
  const BAY4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let CLOUD_CV = null;
  function cloudStamp() { // 구름 그림자: 가운데로 갈수록 칸이 촘촘한 디더 그늘 (검은 2px 칸만)
    if (CLOUD_CV) return CLOUD_CV;
    const W = 170, H = 74, [cv, g] = mkCanvas(W * 2, H * 2); g.fillStyle = '#000';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const e = ((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2 + 0.12 * Math.sin(x * 0.21) * Math.cos(y * 0.33); if (e < 1 && Math.min(1, (1 - e) * 1.7) * 16 > BAY4[(y & 3) * 4 + (x & 3)]) g.fillRect(x * 2, y * 2, 2, 2); }
    return (CLOUD_CV = cv);
  }
  const aS2 = v => Math.round(v / 2) * 2, hsh = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  const crowX = () => { for (let t = 0; t < 20; t++) { const x = aS2(rand(A.x0 + 60, A.x1 - 60)); if (TORCHES.every(tc => Math.abs(tc.x - x) > 20) && Math.abs(x - DOOR.n.x) > 40) return x; } return aS2(A.x0 + 90); }; // 울타리 가로대 위
  function ambState() {
    const R = G.dun && G.dun.cur; if (!R || G.dun.forge || G.dun.home) return null;
    if (AMB.room === R) return AMB.s;
    AMB.room = R; const st = G.stage, S = AMB.s = { st, t0: time };
    if (st === 1) {
      S.clouds = [0, 1].map(i => ({ x: A.x0 - 340 - i * 620 + rand(0, 200), y: rand(A.y0 + 40, A.y1 - 160), v: rand(10, 14) }));
      S.seeds = Array.from({ length: 9 }, () => ({ x: rand(0, VW), y: rand(0, VH), c: pick(['#f0ecdc', '#f0b4d2', '#f0ecdc', '#e8d890']), p: rand(0, 6) }));
      S.ponds = (R.obs || []).filter(b => b.pool); S.fish = null; S.nextFish = time + rand(3, 7);
    } else if (st === 2) {
      const xs = PILLARS.slice(0, -1).map((x, i) => (x + PILLARS[i + 1]) / 2).filter(x => !R.sealW || x < DOOR.n.x - 150 || x > DOOR.n.x + 100); S.beams = []; // v2.64 달빛 줄기가 인장 벽을 가리지 않게
      for (const x of xs) if (hsh(x, R.x || 0) < 0.45) S.beams.push({ x: aS2(x - 30), motes: Array.from({ length: 7 }, () => ({ u: rand(0, 40), v: rand(0, 1), p: rand(0, 9) })) });
      if (!S.beams.length && xs.length) S.beams.push({ x: aS2(xs[1 % xs.length] - 30), motes: Array.from({ length: 7 }, () => ({ u: rand(0, 40), v: rand(0, 1), p: rand(0, 9) })) });
      S.hole = aS2(rand(A.x0 + 60, A.x1 - 60)); S.rat = null; S.nextRat = time + rand(2, 6); S.drips = []; S.nextDrip = time + rand(1, 3);
    } else if (st === 3) {
      S.crow = { x: crowX(), y: A.y0 - 30, state: 'perch', t: 0 }; S.nextCrow = 0;
      S.embers = []; S.smoke = [];
    } else if (st === 4) { S.smoke = []; }
    return S;
  }
  // v3.19 웅덩이 자리의 잔움직임 — 1장 저수지 · 샘 / 3장 피웅덩이: 가끔 보글거림, 4장 불탄 자리: 잔불이 깜빡이고 일렁임 (캐릭터 · 적이 앞을 가리면 그리지 않음)
  function pitFx(S) {
    const R = G.dun.cur, st = S.st; if (st < 1 || st > 4) return;
    const hid = (x, y) => { const h = o => o && Math.abs(o.x - x) < 16 && o.y > y - 4 && o.y < y + 40; return h(G.player) || (G.enemies || []).some(h) || (G.allies || []).some(h); };
    if (st === 4) { // 잔불: 뜨거운 자리마다 느리게 숨 쉬는 빛 + 낱알이 자리를 바꿔 깜빡임 + 드물게 불티
      (R.sprites || []).forEach((sp, si) => { const H = sp.cv && sp.cv.hot; if (!H) return; H.forEach(([hx, hy], i) => { const x = sp.x + hx * 2, y = sp.y + hy * 2; if (hid(x, y)) return;
        const ph = time * 2.2 + i * 1.7 + si, br = 0.5 + 0.5 * Math.sin(ph) * Math.sin(ph * 0.37 + 1), k = Math.floor(time * 7 + i * 3 + si * 5);
        ctx.fillStyle = `rgba(255,120,40,${(0.08 + 0.14 * br).toFixed(3)})`; ctx.fillRect(x - 10, y - 4, 20, 10); ctx.fillRect(x - 6, y - 6, 12, 14);
        for (let n = 0; n < 3; n++) { const a = hsh(k + n * 13, i + si * 7), b = hsh(k + n * 29, i * 3 + si); if (a > 0.35 + 0.5 * br) continue; ctx.fillStyle = b < 0.4 ? '#ffe08a' : '#ffa040'; ctx.fillRect(aS2(x - 8 + a * 40 % 16), aS2(y - 4 + b * 8), 2, 2); }
        if (Math.random() < 0.012) G.parts.push({ x: x + rand(-6, 6), y: y + rand(-2, 2), vx: rand(-8, 8), vy: -rand(18, 34), t: rand(0.5, 0.9), c: pick(['#ffa040', '#e8601c', '#ffe08a']), g: -10 }); }); });
      return; }
    if (st === 2) { // 낭떠러지: 어둠에서 흐린 먼지 · 찬 안개가 천천히 떠오름 + 가끔 가장자리에서 돌 부스러기가 떨어져 어둠 속으로 사라짐
      if (!S.chasms) { S.chasms = (R.obs || []).filter(b => !b.c && Math.min(b.w, b.h) >= 40 && (b.t === 'pit' || (b.t === 'wall' && Math.min(b.w, b.h) >= 56))); S.peb = []; S.nextPeb = time + rand(2, 5); }
      S.chasms.forEach((b, bi) => { const n = Math.max(2, Math.min(8, Math.round(b.w * b.h / 2200))), yb = b.y1 - 16, yt = b.y0 + 8; if (yb - yt < 10) return;
        for (let i = 0; i < n; i++) { const per = 4.5 + hsh(i, bi + 3) * 3.5, tt = time / per + hsh(i * 7, bi), u = tt - Math.floor(tt), cyc = Math.floor(tt), bx = b.x0 + 10 + hsh(i + cyc * 5, bi * 3 + 1) * (b.w - 20), rise = Math.min(yb - yt, 46 + hsh(i, cyc) * 30), y0 = yb - hsh(cyc, i + bi) * Math.max(0, yb - yt - rise);
          const x = aS2(bx + Math.sin(time * 0.8 + i * 2.1) * 4), y = aS2(y0 - u * rise), al = Math.sin(Math.PI * u) * 0.6; if (al < 0.06 || hid(x, y)) continue;
          ctx.globalAlpha = al; ctx.fillStyle = i % 3 === 0 ? '#8296b4' : '#566a8a'; ctx.fillRect(x, y, 2, 2);
          if (i % 4 === 1) { ctx.globalAlpha = al * 0.55; ctx.fillStyle = '#3e4c68'; ctx.fillRect(x - 2, y + 2, 2, 2); ctx.fillRect(x + 2, y + 2, 2, 2); ctx.fillRect(x, y + 4, 2, 2); ctx.fillRect(x + 4, y, 2, 2); } }
        ctx.globalAlpha = 1; });
      if (S.chasms.length && time > S.nextPeb) { const b = pick(S.chasms), side = Math.random(), x = aS2(side < 0.6 ? rand(b.x0 + 8, b.x1 - 8) : side < 0.8 ? b.x0 + 4 : b.x1 - 6), y = aS2(side < 0.6 ? b.y0 + 2 : rand(b.y0 + 4, b.y0 + b.h * 0.4));
        for (let i = 0; i < (Math.random() < 0.4 ? 2 : 1); i++) S.peb.push({ x: x + i * 4, y, t: time + i * 0.12, d: Math.min(b.y1 - 14 - y, rand(34, 60)) }); S.nextPeb = time + rand(4, 9) / Math.min(2, S.chasms.length); }
      for (let i = S.peb.length - 1; i >= 0; i--) { const q = S.peb[i], el = time - q.t; if (el < 0) continue; const u = el / 0.55; if (u > 1 || q.d < 8) { S.peb.splice(i, 1); continue; } const y = aS2(q.y + u * u * q.d); if (hid(q.x, y)) continue;
        if (u < 0.2) { ctx.fillStyle = '#6e6860'; ctx.fillRect(q.x - 4, q.y - 2, 2, 2); ctx.fillRect(q.x + 4, q.y, 2, 2); } // 가장자리에서 부스러지는 먼지
        ctx.globalAlpha = 1 - u * 0.8; ctx.fillStyle = u < 0.35 ? '#a8a296' : u < 0.7 ? '#6e6860' : '#3a3940'; ctx.fillRect(q.x, y, 2, 2); if (u < 0.5) { ctx.fillStyle = '#4e4a44'; ctx.fillRect(q.x + 2, y, 2, 2); } ctx.globalAlpha = 1; }
      return; }
    if (!S.bubPits) { S.bubPits = (R.obs || []).filter(b => b.t === 'pit' && !b.c && !b.brook && Math.min(b.w, b.h) >= 30); S.bub = []; S.nextBub = time + rand(0.5, 2); }
    if (S.bubPits.length && time > S.nextBub) { const b = pick(S.bubPits), ix = Math.min(16, b.w * 0.25), x = aS2(rand(b.x0 + ix, b.x1 - ix)), y = aS2(rand(b.y0 + Math.min(24, b.h * 0.45), b.y1 - Math.min(10, b.h * 0.2))), n = Math.random() < 0.35 ? 2 : 1;
      for (let i = 0; i < n; i++) S.bub.push({ x: x + i * randi(2, 4) * 2, y: y + i * randi(-2, 2) * 2, t: time + i * 0.18, big: Math.random() < 0.4 }); S.nextBub = time + rand(0.7, 2.6) / Math.min(3, S.bubPits.length); }
    const C = st === 3 ? ['#c83a34', '#7c1416', '#f08a80', '#2c050a'] : ['#8ab0c8', '#3e5a82', '#d8ecf4', '#1c3048']; // 테 · 그늘 · 반짝임 · 터진 자국
    for (let i = S.bub.length - 1; i >= 0; i--) { const q = S.bub[i], k = Math.floor((time - q.t) / 0.13); if (k < 0) continue; if (k > (q.big ? 5 : 4)) { S.bub.splice(i, 1); continue; } if (hid(q.x, q.y)) continue;
      const px = (dx, dy, c) => { ctx.fillStyle = c; ctx.fillRect(q.x + dx * 2, q.y + dy * 2, 2, 2); }, top = q.big ? 3 : 2;
      if (k === 0) px(0, 0, C[1]);
      else if (k === 1) { px(0, 0, C[0]); px(1, 0, C[1]); }
      else if (k < top + 1) { px(0, -1, C[0]); px(1, -1, C[0]); px(-1, 0, C[0]); px(2, 0, C[1]); px(0, 0, C[2]); px(1, 0, C[3]); px(0, 1, C[1]); px(1, 1, C[1]); if (q.big && k === top) { px(-1, -1, C[0]); px(2, -1, C[1]); px(0, -2, C[0]); px(1, -2, C[0]); px(0, -1, C[2]); } }
      else { const r = k - top; px(-1 - r, 0, C[0]); px(2 + r, 0, C[0]); px(0, -1 - r, C[2]); px(1, 1, C[3]); px(0, 1, C[3]); } }
  }
  // 어둠보다 아래(세계 좌표): 구름 그림자 · 물고기 · 쥐 · 물방울 · 연기 · 까마귀
  function ambBack() {
    const S = ambState(); if (!S) return; const st = S.st, P = G.player;
    pitFx(S);
    if (st === 1) {
      ctx.save(); ctx.globalAlpha = 0.3;
      for (const c of S.clouds) { const x = aS2(c.x + (time - S.t0) * c.v); if (x > A.x1 + 40) c.x -= (A.x1 - A.x0) + 760; ctx.drawImage(cloudStamp(), x, aS2(c.y)); }
      ctx.restore();
      if (S.ponds.length && !S.fish && time > S.nextFish) { const b = pick(S.ponds); S.fish = { x: aS2(b.x + rand(-b.w * 0.2, b.w * 0.2)), y: aS2(b.y + rand(-b.h * 0.15, b.h * 0.15)), t: time, d: Math.random() < 0.5 ? 1 : -1 }; }
      if (S.fish) { const f = S.fish, k = Math.floor((time - f.t) / 0.1);
        if (k < 6) { const a = [[0, 0], [1, -3], [3, -5], [5, -5], [7, -3], [8, 0]][k]; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(f.x + (a[0] * f.d - f.d) * 2, f.y + a[1] * 2, 2, 2); ctx.fillStyle = '#e6aa5a'; ctx.fillRect(f.x + a[0] * f.d * 2, f.y + a[1] * 2, 2, 2); ctx.fillStyle = '#c8783c'; ctx.fillRect(f.x + (a[0] * f.d + f.d) * 2, f.y + a[1] * 2, 2, 2); }
        for (const [kk, cx] of [[k, f.x], [k - 6, f.x + 16 * f.d]]) if (kk >= 0 && kk < 4) { ctx.fillStyle = kk < 2 ? '#7a98c0' : '#3e5a82'; const r = kk + 1; for (let a = 0; a < 12; a++) { const an = a / 12 * Math.PI * 2; ctx.fillRect(aS2(cx + Math.cos(an) * r * 3.2), aS2(f.y + 2 + Math.sin(an) * r * 1.4), 2, 2); } }
        if (k > 11) { S.fish = null; S.nextFish = time + rand(5, 11); } }
    } else if (st === 2) {
      const wy = A.y0 + 4; ctx.fillStyle = '#060508'; ctx.fillRect(S.hole, wy - 2, 6, 4); ctx.fillStyle = '#1a161e'; ctx.fillRect(S.hole - 2, wy - 4, 10, 2);
      if (!S.rat && time > S.nextRat) { const fromR = Math.random() < 0.5; S.rat = { x: aS2(fromR ? Math.min(A.x1 - 20, S.hole + rand(200, 420)) : Math.max(A.x0 + 20, S.hole - rand(200, 420))), d: fromR ? -1 : 1 }; }
      if (S.rat) { const r = S.rat; if (Math.floor(time * 30) % 2 === 0) r.x += r.d * 4; const leg = Math.floor(time * 15) % 2, d = r.d, X = r.x, Y = wy;
        if ((X - S.hole) * d >= 0) { S.rat = null; S.nextRat = time + rand(8, 15); }
        else { const C = (dx, dy, c) => { ctx.fillStyle = c; ctx.fillRect(X + dx * 2 * d, Y + dy * 2, 2, 2); };
          C(-2, 0, '#5a504c'); C(-3, 0 + leg, '#5a504c'); C(-1, 0, '#6e625c'); C(0, 0, '#6e625c'); C(1, 0, '#6e625c'); C(0, -1, '#5a504c'); C(2, 0, '#c87884'); C(1, -1, '#0b0a0e');
          C(0, 1 - leg, '#0b0a0e'); C(-1, leg, '#0b0a0e'); } }
      if (time > S.nextDrip) { S.drips.push({ x: aS2(rand(Math.max(A.x0, CAMX), Math.min(A.x1, CAMX + VW))), y0: A.y0 - 14, y1: aS2(A.y0 + rand(30, 150)), t: time }); S.nextDrip = time + rand(1.6, 3.4); }
      for (let i = S.drips.length - 1; i >= 0; i--) { const d = S.drips[i], el = time - d.t, fall = (d.y1 - d.y0) / 180;
        if (el < fall) { const y = aS2(d.y0 + el * 180); ctx.fillStyle = '#5a6e8c'; ctx.fillRect(d.x, y - 2, 2, 2); ctx.fillStyle = '#96aac8'; ctx.fillRect(d.x, y, 2, 2); }
        else { const k = Math.floor((el - fall) / 0.09); if (k > 3) { S.drips.splice(i, 1); continue; } ctx.fillStyle = k < 2 ? '#50648a' : '#323c54'; const r = k + 1; for (let a = 0; a < 8; a++) { const an = a / 8 * Math.PI * 2; ctx.fillRect(aS2(d.x + Math.cos(an) * r * 3), aS2(d.y1 + Math.sin(an) * r * 1.2), 2, 2); } } }
    } else if (st === 3 || st === 4) {
      // 연기: 3칸 → 2칸 → 1칸으로 줄며 오름 (녹아 사라지지 않음)
      TORCHES.forEach((tc, i) => { for (let n = 0; n < 2; n++) { const a = Math.floor((time * 6 + i * 5 + n * 8)) % 16, sz = a < 6 ? 3 : a < 11 ? 2 : a < 14 ? 1 : 0; if (!sz) continue;
        const x = aS2(tc.x - 2 + Math.floor(a / 5) * 2 * (i % 2 ? 1 : -1)), y = aS2(tc.y - 10 - a * 2);
        for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) { ctx.fillStyle = (dx + dy) % 2 ? '#3e322c' : '#5a4a40'; ctx.fillRect(x + dx * 2, y + dy * 2, 2, 2); } } });
      if (st === 3) { // 울타리 위 까마귀: 두리번대다 플레이어가 다가오면 날아감, 한참 뒤 다른 자리에 다시 앉음
        const c = S.crow;
        if (c.state === 'perch' && Math.abs(P.x - c.x) < 100 && P.y < A.y0 + 90) { c.state = 'fly'; c.t = time; c.d = P.x < c.x ? 1 : -1; }
        if (c.state === 'gone' && time > c.t) { c.x = crowX(); c.state = Math.hypot(P.x - c.x, P.y - c.y) > 160 ? 'perch' : 'gone'; c.t = time + 2; }
        const B = (dx, dy, col) => { ctx.fillStyle = col; ctx.fillRect(dx, dy, 2, 2); };
        if (c.state === 'perch') { const fl = Math.floor(time / 1.1 + c.x) % 3 === 0 ? -1 : 1, X = c.x, Y = c.y;
          for (const [x, y] of [[0, 0], [1, 0], [2, 0], [3, 0], [1, -1], [2, -1], [0, 1], [3, 1], [-1, 0]]) B(X + x * 2 * fl, Y + y * 2, '#1a161e');
          B(X + 4 * 2 * fl, Y - 2, '#1a161e'); B(X + 3 * 2 * fl, Y - 2, '#d84a32'); B(X + 5 * 2 * fl, Y - 2, '#c8a040'); }
        else if (c.state === 'fly') { const k = Math.floor((time - c.t) / 0.07), X = c.x + k * 8 * c.d, Y = c.y - k * 4, w = k % 2 ? -1 : 1;
          for (const [x, y] of [[0, 0], [1, 0], [2, 0], [-1, -w], [3, -w], [-2, -2 * w], [4, -2 * w]]) B(aS2(X) + x * 2 * c.d, aS2(Y) + y * 2, '#1a161e');
          if (k > 26) { c.state = 'gone'; c.t = time + rand(14, 24); } }
      }
    }
  }
  // 어둠보다 위(세계 좌표): 꽃씨 · 달빛 줄기 · 불티 · 잉걸 섬광 — 빛나는 것들
  function ambFront() {
    const S = ambState(); if (!S) return; const st = S.st;
    if (st === 1) { // 바람에 날리는 꽃씨·꽃잎 (0.1초마다 한 칸씩)
      const k = Math.floor(time * 10);
      for (const sd of S.seeds) { const x = ((aS2(sd.x) + k * 2) % (VW + 40) + VW + 40) % (VW + 40) - 20, y = ((aS2(sd.y) + (Math.floor(k / 4 + sd.p) % 3) * 2 - Math.floor(k / 8) * 2) % VH + VH) % VH;
        ctx.fillStyle = sd.c; ctx.fillRect(aS2(CAMX) + x, aS2(CAMY) + y, 2, 2); }
    } else if (st === 2) { // 높은 창의 달빛 줄기 (디더 없이 같은 세기, 가장자리는 칸 계단) + 그 안을 떠도는 먼지
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const b of S.beams) { const y0 = A.y0 - 100, L = 330; // v1.62 성벽 맨 위(맵 끝)에서 시작
        if (!AMB.beam) { const [bc, bg] = mkCanvas(44 + aS2(L * 0.55) + 2, L); for (let y = 0; y < L; y += 2) { bg.fillStyle = y < L - 50 ? 'rgba(70,84,130,.13)' : 'rgba(70,84,130,.07)'; bg.fillRect(aS2(y * 0.55), y, 44, 2); } AMB.beam = bc; }
        ctx.drawImage(AMB.beam, b.x, y0);
        for (const m of b.motes) { const v = ((m.v * L + Math.floor(time * 2.5 + m.p) * 2) % L), u = m.u + (Math.floor(time * 1.3 + m.p) % 2) * 2; ctx.fillStyle = Math.floor(time * 2 + m.p) % 7 ? 'rgba(190,200,230,.75)' : 'rgba(120,130,160,.6)'; ctx.fillRect(b.x + aS2(v * 0.55) + aS2(u), y0 + aS2(v), 2, 2); } }
      ctx.restore();
    } else if (st === 3) { // 횃불 불티: 칸 단위로 솟으며 식어감
      TORCHES.forEach((tc, i) => { for (let n = 0; n < 4; n++) { const ph = hsh(i, n) * 12, a = Math.floor(time * 9 + ph) % 12, dr = Math.round(hsh(n, i) * 2) - 1;
        ctx.fillStyle = a < 5 ? '#ffbe50' : a < 9 ? '#dc5a1e' : '#783214'; ctx.fillRect(aS2(tc.x + dr * Math.floor(a / 4) * 2 + (Math.floor(a / 2) % 2) * 2), aS2(tc.y - 8 - a * 2), 2, 2); } });
    } else if (st === 4) { // 성벽 너머 하늘의 잉걸 섬광: 가끔 두 번 번쩍 (계단식 세기)
      const c = (time % 9), lv = c < 0.12 ? 3 : c < 0.24 ? 5 : c < 0.36 ? 3 : c < 0.48 ? 1 : c > 1.2 && c < 1.32 ? 2 : c > 1.32 && c < 1.44 ? 4 : c > 1.44 && c < 1.56 ? 2 : 0;
      if (lv) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let r = 0; r < 7; r++) { ctx.fillStyle = `rgba(255,110,30,${(lv * (7 - r) / 7 * 0.035).toFixed(3)})`; ctx.fillRect(A.x0 - 40, A.y0 - 96 + r * 8, A.x1 - A.x0 + 80, 8); } ctx.restore(); }
    }
  }
  function drawFireflies() {
    if (G.stage !== 1 || !G.flies) return;
    for (const f of G.flies) {
      const tq = Math.floor(time * 4) / 4, x = aS2(f.x + Math.sin(tq * f.s + f.p) * f.rx), y = aS2(f.y + Math.sin(tq * f.s * 1.3 + f.p * 2) * f.ry), ph = Math.floor(time * 3 + f.p * 3) % 9; // v1.55
      if (ph >= 5) continue; f.cx = x; f.cy = y;
      if (ph === 1 || ph === 2) { ctx.fillStyle = 'rgba(200,255,120,.35)'; ctx.fillRect(x - 2, y, 6, 2); ctx.fillRect(x, y - 2, 2, 6); }
      ctx.fillStyle = ph === 1 || ph === 2 ? '#e8ff8a' : '#86b84a'; ctx.fillRect(x, y, 2, 2);
    }
  }
  // ---------------------------------------------------------------- 적 투사체 (v0.37): 조명 위에 2px 도트로, 검은 외곽선 + 밝은 심 + 깜빡이는 테두리 + 잔상
  // ================================================================ v1.17 최적화: 칸 무더기를 한 장으로 모아 그리기
  // fillRect를 수백 번 부르던 이펙트(텔레포터 빛기둥·보물 기둥·깃발·버프 고리)를 메모리 버퍼에 칠한 뒤 drawImage 한 번으로. 겉모습은 같음
  // __proto.opt = false 로 끄면 예전처럼 fillRect로 바로 그림 (같은 화면 비교용)
  let OPT = true;
  const LY = { buf: null, cap: 0, cv: null, g: null, imgs: new Map() };
  function pxLayer(x0, y0, w, h, add) {
    x0 = Math.floor(x0); y0 = Math.floor(y0); w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
    if (!OPT) return { rect(x, y, rw, rh, r, g, b, a) { ctx.fillStyle = `rgba(${r},${g},${b},${a})`; ctx.fillRect(x, y, rw, rh); }, flush() {} };
    const n = w * h * 4; if (LY.cap < n) { LY.buf = new Float32Array(n); LY.cap = n; } else LY.buf.fill(0, 0, n);
    const B = LY.buf; let any = false;
    return {
      rect(x, y, rw, rh, r, g, b, a) {
        if (a <= 0) return; any = true;
        let xa = Math.max(0, x - x0), ya = Math.max(0, y - y0); const xb = Math.min(w, x - x0 + rw), yb = Math.min(h, y - y0 + rh);
        const pr = r * a, pg = g * a, pb = b * a, ia = 1 - a;
        for (let yy = ya; yy < yb; yy++) for (let xx = xa, i = (yy * w + xa) * 4; xx < xb; xx++, i += 4) {
          if (add) { B[i] += pr; B[i + 1] += pg; B[i + 2] += pb; B[i + 3] += a; }
          else { B[i] = pr + B[i] * ia; B[i + 1] = pg + B[i + 1] * ia; B[i + 2] = pb + B[i + 2] * ia; B[i + 3] = a + B[i + 3] * ia; }
        }
      },
      flush() {
        if (!any) return;
        const key = w + 'x' + h; let img = LY.imgs.get(key); if (!img) { if (LY.imgs.size > 48) LY.imgs.clear(); img = new ImageData(w, h); LY.imgs.set(key, img); }
        const d = img.data;
        for (let i = 0; i < n; i += 4) { const A = B[i + 3]; if (A <= 0) { d[i + 3] = 0; continue; } const k = 1 / A; d[i] = B[i] * k; d[i + 1] = B[i + 1] * k; d[i + 2] = B[i + 2] * k; d[i + 3] = (A > 1 ? 1 : A) * 255; }
        if (!LY.cv || LY.cv.width < w || LY.cv.height < h) { [LY.cv, LY.g] = mkCanvas(Math.max(w, LY.cv ? LY.cv.width : 0), Math.max(h, LY.cv ? LY.cv.height : 0)); }
        LY.g.putImageData(img, 0, 0); ctx.drawImage(LY.cv, 0, 0, w, h, x0, y0, w, h);
      } };
  }
  const RGBN = new Map(); // 'r,g,b' 문자열 → 숫자 배열
  const rgbN = c => { let v = RGBN.get(c); if (!v) { v = c.split(',').map(Number); RGBN.set(c, v); } return v; };
  const HEXN = new Map();
  const hexN = c => { let v = HEXN.get(c); if (!v) { v = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; HEXN.set(c, v); } return v; };
  // 둥근 판(투사체 등): 반지름·색·좌표 짝홀마다 한 번만 칠해 두고 붙임
  const DISC = new Map();
  function pxDisc(cx, cy, r, col) {
    const rx = Math.round(cx), ry = Math.round(cy);
    if (!OPT) { ctx.fillStyle = col; const R = r * r; for (let y = -r; y <= r; y += 2) for (let x = -r; x <= r; x += 2) if (x * x + y * y <= R + 1) ctx.fillRect((Math.round(cx + x)) & ~1, (Math.round(cy + y)) & ~1, 2, 2); return; }
    const px = rx & 1, py = ry & 1, key = r + '|' + col + '|' + px + py; let e = DISC.get(key);
    if (!e) { const S = 2 * r + 6, [c, g] = mkCanvas(S, S), o = r + 2, R = r * r; g.fillStyle = col; let minX = 1e9, minY = 1e9;
      for (let y = -r; y <= r; y += 2) for (let x = -r; x <= r; x += 2) if (x * x + y * y <= R + 1) { const X = ((px + x) & ~1), Y = ((py + y) & ~1); g.fillRect(X + o, Y + o, 2, 2); }
      e = { c, o }; if (DISC.size > 200) DISC.clear(); DISC.set(key, e); }
    ctx.drawImage(e.c, rx - px - e.o, ry - py - e.o);
  }

  // v1.05 투사체·방향 화살표 도트 (회전은 rotW가 칸 단위로)
  const PROJ_W = (() => {
    const arrow = head => cellWeapon(14, 5, 7, 2, { k: '#0b0a0e', w: '#d8bd82', W: '#a8875a', m: head, M: '#ffffff', r: '#a92c30', R: '#e85a48' }, put => {
      for (let x = 2; x <= 9; x++) put(x, 2, 'w'); put(1, 2, 'W'); for (const y of [1, 2, 3]) put(10, y, 'm'); put(11, 2, 'm'); put(12, 2, 'M');
      for (const y of [1, 3]) { put(0, y, 'r'); put(1, y, 'r'); put(2, y, 'R'); } });
    const spear = head => cellWeapon(20, 5, 9, 2, { k: '#0b0a0e', o: '#9a673d', O: '#6a4428', g: '#d7a653', m: head, M: '#f0e5c8' }, put => {
      for (let x = 0; x <= 12; x++) put(x, 2, x === 0 ? 'O' : 'o'); for (const x of [6, 9]) for (const y of [1, 2, 3]) put(x, y, 'g');
      for (const y of [1, 2, 3]) { put(13, y, 'm'); put(14, y, 'm'); } put(15, 1, 'm'); put(15, 2, 'M'); put(15, 3, 'm'); put(16, 2, 'm'); put(17, 2, 'M'); });
    return { arrow: arrow('#c8ccd4'), arrowB: arrow('#ffffff'), spear: spear('#c8cbd0'), spearB: spear('#fff4dc') };
  })();
  const TRI_W = {}, triW = (col, n) => TRI_W[col + n] || (TRI_W[col + n] = cellWeapon(n + 2, n * 2 + 3, 1 + (n >> 1), n + 1, { k: '#000000', c: `rgb(${col})` }, put => { for (let x = 0; x <= n; x++) for (let y = -(n - x); y <= n - x; y++) put(x + 1, n + 1 + y, 'c'); }));
  // v3.63 투사체 회피 신호: 닿기 0.2초 전(퍼펙트 판정 구간)부터 투사체 자체가 하얗게 반짝임 — 처음엔 0.05초 간격으로 깜빡이다 닿기 직전 0.06초는 계속 하얗게
  const PW = document.createElement('canvas'); PW.width = PW.height = 96; const PWg = PW.getContext('2d');
  const projFlash = pr => pr.tti < 0.06 || Math.floor(pr.tti / 0.05) % 2 === 0;
  function projWhite(pr, one) { // 투사체를 작은 캔버스에 같은 변환으로 그린 뒤 흰색으로 칠해 그 자리에 찍음
    const M = ctx.getTransform(), sx = M.a * pr.x + M.c * (pr.y - 10) + M.e, sy = M.b * pr.x + M.d * (pr.y - 10) + M.f, ox = Math.round(sx) - 48, oy = Math.round(sy) - 48;
    PWg.setTransform(1, 0, 0, 1, 0, 0); PWg.globalCompositeOperation = 'source-over'; PWg.globalAlpha = 1; PWg.clearRect(0, 0, 96, 96); PWg.setTransform(M.a, M.b, M.c, M.d, M.e - ox, M.f - oy); PWg.imageSmoothingEnabled = false;
    dshEll(ctx, Math.round(pr.x) & ~1, Math.round(pr.y) & ~1, 5, 2, 0.5); const main = ctx; ctx = PWg; pr._ns = true; try { one(pr); } finally { ctx = main; pr._ns = false; }
    PWg.setTransform(1, 0, 0, 1, 0, 0); PWg.globalCompositeOperation = 'source-atop'; PWg.fillStyle = '#ffffff'; PWg.fillRect(0, 0, 96, 96);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(PW, ox, oy); ctx.restore();
  }
  function drawEProjs() {
    const blink = Math.floor(time * 14) % 2;
    for (const pr of G.eproj) { if (pr.warn && projFlash(pr)) { projWhite(pr, one); continue; } ctx.save(); if (pr.dodged) ctx.globalAlpha = 0.4; one(pr); ctx.restore(); } // v3.63 피한 투사체는 반투명 · 곧 닿을 투사체는 하얗게 반짝임
    function one(pr) {
      const gx = Math.round(pr.x) & ~1, gy = Math.round(pr.y) & ~1, hy = pr.y - 10;
      // 바닥 그림자 (날아가는 높이를 보여 준다)
      if (!pr._ns) dshEll(ctx, gx, gy, 5, 2, 0.5); // v3.20 디더 (하얗게 반짝일 땐 그림자는 따로 그림)
      if (pr.kind === 'fireball') { drawMProj({ kind: 'fireball', x: pr.x, y: pr.y - 10, r: pr.r, hist: pr.hist.map(q => ({ x: q.x, y: q.y - 10 })) }); return; } // v3.20 갱도 교단 마법사: 여우 마법사 불덩이와 같은 모습
      if (pr.kind === 'arrow' || pr.kind === 'spear') {
        drawBlade(pr.kind === 'arrow' ? (blink ? PROJ_W.arrowB : PROJ_W.arrow) : (blink ? PROJ_W.spearB : PROJ_W.spear), gx, hy, pr.ang); // v1.05 칸 단위 회전 도트 (투척꾼은 다시 투창)
        return;
      }
      if (pr.kind === 'ember') { const I = invInit(); pr.hist.forEach((q, i) => { if (i % 2) return; ctx.fillStyle = `rgba(255,140,50,${0.45 * (i + 1) / pr.hist.length})`; ctx.fillRect(Math.round(q.x) & ~1, Math.round(q.y - 10) & ~1, 2, 2); }); drawBlade(blink ? I.emberB : I.ember, gx, hy, pr.ang); return; } // v1.65 총잡이 잉걸 탄
      if (pr.kind === 'crescent') { const I = invInit(); drawBlade(blink ? I.crescentB : I.crescent, gx, hy, pr.ang); return; } // v1.59 낫잡이 초승달 탄
      if (pr.kind === 'quill') {
        const ux = Math.cos(pr.ang), uy = Math.sin(pr.ang), L = 12;
        ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let k = L; k < L + 14; k += 2) ctx.fillRect(Math.round(pr.x - ux * k) & ~1, Math.round(hy - uy * k) & ~1, 2, 2);
        ctx.fillStyle = '#0b0a0e'; for (let k = 0; k <= L; k += 2) ctx.fillRect((Math.round(pr.x - ux * k) & ~1) - 2, (Math.round(hy - uy * k) & ~1) - 2, 6, 6);
        ctx.fillStyle = '#fff4dc'; for (let k = 2; k <= L; k += 2) ctx.fillRect((Math.round(pr.x - ux * k) & ~1) - 1, (Math.round(hy - uy * k) & ~1) - 1, 4, 4);
        ctx.fillStyle = blink ? '#ffffff' : '#ffc890'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 6, 6);
        return;
      }
      if (pr.kind === 'tear') { // v1.30 왕비의 잉걸 눈물: 검은 외곽선 물방울 + 꼬리
        const ux = Math.cos(pr.ang), uy = Math.sin(pr.ang);
        pr.hist.forEach((q, i) => { ctx.fillStyle = `rgba(255,140,60,${0.4 * (i + 1) / pr.hist.length})`; ctx.fillRect(Math.round(q.x) & ~1, Math.round(q.y - 10) & ~1, 2, 2); });
        ctx.fillStyle = '#0b0a09'; ctx.fillRect(gx - 4, (Math.round(hy) & ~1) - 4, 8, 8); ctx.fillRect((Math.round(pr.x - ux * 6) & ~1) - 2, (Math.round(hy - uy * 6) & ~1) - 2, 6, 6);
        ctx.fillStyle = '#ff7a30'; ctx.fillRect(gx - 2, (Math.round(hy) & ~1) - 2, 4, 4); ctx.fillRect(Math.round(pr.x - ux * 6) & ~1, Math.round(hy - uy * 6) & ~1, 2, 2);
        ctx.fillStyle = blink ? '#ffffff' : '#ffc070'; ctx.fillRect(gx - 2, (Math.round(hy) & ~1) - 2, 2, 2);
        return;
      }
      if (pr.kind === 'rock') {
        pr.hist.forEach((q, i) => { ctx.fillStyle = `rgba(200,190,170,${0.25 * (i + 1) / pr.hist.length})`; ctx.fillRect(Math.round(q.x) & ~1, Math.round(q.y - 10) & ~1, 2, 2); });
        pxDisc(pr.x, hy, 9, '#0b0a0e'); pxDisc(pr.x, hy, 7, blink ? '#d0c8d8' : '#9a94a4'); pxDisc(pr.x, hy, 5, '#7a7484'); ctx.fillStyle = '#d0c8d8'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 4, 2);
        if (blink) { ctx.fillStyle = '#ffffff'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 2, 2); }
        return;
      }
      const green = pr.kind === 'acid' || pr.kind === 'bile';
      const body = green ? (pr.kind === 'bile' ? '#c8e040' : '#80e040') : '#ff3048', rim = green ? '#f0ffb0' : '#ffd0d8', trail = green ? '150,230,60' : '255,60,80';
      pr.hist.forEach((q, i) => { const k = (i + 1) / pr.hist.length; ctx.fillStyle = `rgba(${trail},${0.55 * k})`; const rr = Math.max(2, Math.round(pr.r * k)); ctx.fillRect((Math.round(q.x) & ~1) - (rr & ~1) / 2, (Math.round(q.y - 10) & ~1) - (rr & ~1) / 2, rr & ~1 || 2, rr & ~1 || 2); });
      const r = Math.max(4, Math.round(pr.r + 1));
      pxDisc(pr.x, hy, r + 3, '#0b0a0e');
      pxDisc(pr.x, hy, r + 1, blink ? rim : body);
      pxDisc(pr.x, hy, r - 1, body);
      ctx.fillStyle = '#ffffff'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 4, 4);
    }
  }
  // v2.64 키캡 한 개: DOM .key와 같은 크기 (글자 폭 + 8 × 11, 글자 8px Galmuri7 · 정수 좌표라 글자가 깨지지 않음). (X, Y)는 왼쪽 위
  function keyCap(c, X, Y, key, off) {
    c.font = '8px Galmuri7'; X = Math.round(X); Y = Math.round(Y);
    const tw = Math.round(c.measureText(key).width), w = Math.max(11, tw + 8), H = 11;
    c.fillStyle = '#000'; c.fillRect(X, Y, w, H);
    c.fillStyle = off ? '#241b2b' : '#f2d78c'; c.fillRect(X + 1, Y + 1, w - 2, H - 2);
    c.fillStyle = off ? '#4a3d52' : '#fff4c8'; c.fillRect(X + 1, Y + 1, w - 2, 1);
    c.fillStyle = off ? '#0a070c' : '#a8883a'; c.fillRect(X + 1, Y + H - 2, w - 2, 1);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = off ? '#9a8ea5' : '#1a1208'; c.fillText(key, X + Math.floor((w - tw) / 2), Y + 9);
    return w;
  }
  // v2.62 F 키 안내 공통 모양: 금빛 키캡 + 글자, 어두운 판 + 금 테
  function drawKeyTag(c, x, y, key, label, o = {}) {
    c.save(); c.textBaseline = 'alphabetic';
    c.font = '9px Galmuri9'; const lw = label ? Math.round(c.measureText(label).width) : 0;
    c.font = '8px Galmuri7'; const kw = Math.max(11, Math.round(c.measureText(key).width) + 8);
    const gap = label ? 4 : 0, w = 4 + kw + gap + lw + 6, Y = Math.round(y) - 11, H = 15; let X = Math.round(o.right ? x - w : o.left ? x : x - w / 2);
    { const m = c.getTransform(); if (c === ctx && m.a === 1) { const sx = X + m.e; if (sx + w > VW - 2) X -= sx + w - (VW - 2); else if (sx < 2) X += 2 - sx; } // v3.18 화면 끝에서 잘리지 않게
      if (c === ctx) BUB_RECTS.push([m.a * X + m.e, m.d * Y + m.f, m.a * w, m.d * H]); }
    if (!o.bare) { c.fillStyle = 'rgba(10,8,14,.88)'; c.fillRect(X, Y, w, H); c.strokeStyle = o.border || '#c9a24a'; c.lineWidth = 1; c.strokeRect(X + 0.5, Y + 0.5, w - 1, H - 1); }
    keyCap(c, X + 4, Y + 2, key, !!o.capOff);
    if (label) { c.font = '9px Galmuri9'; c.textAlign = 'left'; c.fillStyle = o.color || '#ffe9b0'; c.fillText(label, X + 4 + kw + gap, Y + 11); }
    c.restore();
    return w;
  }
  // v2.63 키 안내 한 줄: [['TAB','지도'],['ENTER','이동'],'문장'] → 키캡 + 글자 (o.align: center|right|left). y는 글자 기준선
  function drawKeyRow(c, x, y, items, o = {}) {
    const seg = [], gap = 8; let W = 0;
    c.save(); c.textBaseline = 'alphabetic'; c.font = '8px Galmuri7';
    for (const it of items) { if (typeof it === 'string') { const w = Math.round(c.measureText(it).width); seg.push({ t: it, w }); W += w + gap; }
      else { const kw = Math.max(11, Math.round(c.measureText(it[0]).width) + 8), lw = it[1] ? Math.round(c.measureText(it[1]).width) + 3 : 0; seg.push({ k: it[0], l: it[1], kw, w: kw + lw }); W += kw + lw + gap; } }
    W -= gap; let X = Math.round(o.align === 'right' ? x - W : o.align === 'left' ? x : x - W / 2); const Y = Math.round(y);
    if (o.box) { c.fillStyle = 'rgba(10,8,14,.8)'; c.fillRect(X - 5, Y - 11, W + 10, 15); }
    for (const s of seg) {
      c.font = '8px Galmuri7'; c.textAlign = 'left';
      if (s.t) { c.fillStyle = '#000'; c.fillText(s.t, X + 1, Y + 1); c.fillStyle = o.color || '#8a8496'; c.fillText(s.t, X, Y); }
      else { keyCap(c, X, Y - 9, s.k);
        if (s.l) { c.font = '8px Galmuri7'; c.textAlign = 'left'; c.fillStyle = '#000'; c.fillText(s.l, X + s.kw + 4, Y + 1); c.fillStyle = o.color || '#8a8496'; c.fillText(s.l, X + s.kw + 3, Y); } }
      X += s.w + gap;
    }
    c.restore(); return W;
  }
  // v3.13 줍지 않고 남겨 둔 아이템 가까이 가면 이름표 (이름 · 이유 한 줄, 가장 가까운 하나만)
  const LT_WHY = { relic: '유물 칸이 가득 찼습니다', meat: '체력이 가득 찼습니다', bigmeat: '체력이 가득 찼습니다', crumb: '체력이 가득 찼습니다', carrot: '체력이 가득 찼습니다', fish: '체력이 가득 찼습니다', mochi: '체력이 가득 찼습니다', orb: '투지가 가득 찼습니다', armor: '방패가 가득 찼습니다', heartUp: '최대 하트가 한도에 도달했습니다', medal: '최대 하트가 한도에 도달했습니다' };
  function lootTag() {
    const P = G.player; if (!P || P.dead || mode !== 'play') return;
    let best = null, bd = 26;
    for (const l of G.loot) { if (!LT_WHY[l.type] || lootWanted(l)) continue; const d = Math.hypot(l.x - P.x, (l.y - P.y) * 1.3); if (d < bd) { bd = d; best = l; } }
    if (!best) return;
    const L = LOOT[best.type], x = Math.round(best.x) & ~1, top = (Math.round(best.y) - 30) & ~1;
    ctx.textBaseline = 'alphabetic'; ctx.font = '9px Galmuri9'; ctx.textAlign = 'left';
    const a = L.n, b = ' · ' + LT_WHY[best.type], wa = ctx.measureText(a).width, wb = ctx.measureText(b).width, w = (Math.ceil(wa + wb) + 12) & ~1, h = 14, bx = (x - w / 2) & ~1, by = top - h;
    ctx.fillStyle = '#0b0a0e'; ctx.fillRect(bx + 2, by - 2, w - 4, h + 4); ctx.fillRect(bx, by, w, h); ctx.fillRect(bx - 2, by + 2, w + 4, h - 4); // 외곽선 (모서리 깎음)
    ctx.fillStyle = '#1e1826'; ctx.fillRect(bx + 2, by, w - 4, h); ctx.fillRect(bx, by + 2, w, h - 4); ctx.fillStyle = '#2c2436'; ctx.fillRect(bx + 2, by, w - 4, 2);
    ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 4, by + h, 8, 2); ctx.fillRect(x - 2, by + h + 2, 4, 2); ctx.fillStyle = '#1e1826'; ctx.fillRect(x - 2, by + h, 4, 2); // 꼬리
    ctx.fillStyle = L.c || '#ffe9b0'; ctx.fillText(a, bx + 6, by + 10); ctx.fillStyle = '#a89cb4'; ctx.fillText(b, bx + 6 + wa, by + 10);
  }
  function drawPrompt() {
    lootTag();
    const p0 = G.prompt; if (!p0 || p0.hide || mode !== 'play') return;
    const p = TOUCH.on ? Object.assign({}, p0, { t: p0.t.replace(/^F\s+/, '') }) : p0; // v2.26 모바일은 F 없이 (오른쪽 행동 버튼)
    if (!TOUCH.on && /^F\s+/.test(p0.t)) { drawKeyTag(ctx, p.x, p.y + Math.sin(time * 4) * 1.5, 'F', p0.t.replace(/^F\s+/, ''), p.bad ? { border: '#a04040', color: '#ff9090' } : {}); return; } // v2.62 키 캡 모양 통일
    ctx.font = '9px Galmuri9'; ctx.textAlign = 'center';
    const w = ctx.measureText(p.t).width + 10, x = Math.round(p.x), y = Math.round(p.y + Math.sin(time * 4) * 1.5);
    ctx.fillStyle = 'rgba(10,8,14,.85)'; ctx.fillRect(x - w / 2, y - 10, w, 14);
    ctx.strokeStyle = p.bad ? '#a04040' : '#c9a24a'; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2 + 0.5, y - 9.5, w - 1, 13);
    ctx.fillStyle = p.bad ? '#ff9090' : '#ffe9b0'; ctx.fillText(p.t, x, y);
  }
  // ================================================================ 문 표시: 문마다 양옆 기둥 + 불 — "불 두 개가 켜진 곳 = 나가는 문"
  // 1장 이끼 낀 통나무 · 2장 돌기둥 · 3장 밧줄 감은 통나무 · 4장 잿빛 돌기둥. 불은 열려 있으면 주황, 봉쇄·보스 봉인 중이면 붉게 낮아짐
  const GATE_PAL = {
    1: { k: '#0b0806', s: '#c8a070', w: '#b08a5a', h: '#8a6a44', l: '#6a4e30', d: '#4a3420', D: '#2e1e12', m: '#3a6a2a', M: '#5a8a3a', i: '#1a1820', I: '#5a5664' },
    2: { k: '#0b0a0e', s: '#d8d0c0', w: '#a49c8e', h: '#6e687a', l: '#504a5c', d: '#36313f', D: '#211e28', m: '#3a5226', M: '#567234', i: '#1a1820', I: '#6a6478' },
    3: { k: '#0b0806', s: '#c8a070', w: '#9a6a40', h: '#8a6038', l: '#6a4628', d: '#4a301a', D: '#2a1a0e', m: '#8a6034', M: '#c8a070', i: '#1a1210', I: '#5a4a3c' },
  };
  GATE_PAL[4] = GATE_PAL[2];
  const gateMat = () => (G.stage === 2 || G.stage === 4 ? 'stone' : G.stage === 3 ? 'rope' : 'moss');
  function genGatePost(hc, mat, bowl) { // 칸 단위 (가로 10 = 몸 6 + 머리·받침 8 + 외곽선)
    const top = bowl ? 2 : 0, H0 = top + 2 + hc + 2 + 1, g = mkGrid(10, H0 + 1);
    if (bowl) { for (let x = 2; x <= 7; x++) g[1][x] = 'I'; for (let x = 3; x <= 6; x++) g[2][x] = 'i'; }
    const y0 = top + 1;
    for (let x = 1; x <= 8; x++) { g[y0][x] = mat === 'stone' ? 'w' : 's'; g[y0 + 1][x] = x === 8 ? 'd' : 'h'; }
    for (let y = y0 + 2; y < y0 + 2 + hc; y++) {
      const r = y - y0 - 2;
      for (let x = 2; x <= 7; x++) g[y][x] = x === 2 ? 'h' : x <= 4 ? 'l' : x <= 6 ? 'd' : 'D';
      if (mat === 'stone' && r % 5 === 4) for (let x = 2; x <= 7; x++) g[y][x] = 'D';
      if (mat !== 'stone' && r % 6 === 5) for (let x = 3; x <= 6; x++) g[y][x] = 'D';
      if (mat === 'rope' && (r === 2 || r === hc - 4)) for (let x = 2; x <= 7; x++) g[y][x] = x % 2 ? 'M' : 'm';
      if (mat === 'moss' && (r * 7 + 3) % 5 === 0) g[y][2 + (r % 2)] = 'M';
    }
    const yb = y0 + 2 + hc; for (let x = 1; x <= 8; x++) { g[yb][x] = mat === 'moss' && x % 3 === 0 ? 'm' : 'l'; g[yb + 1][x] = 'd'; }
    return gOutline(g);
  }
  function genGateBeam(wc, mat) { // 남쪽 문 상인방 (양 끝에 불그릇)
    const g = mkGrid(wc + 2, 9);
    for (const ex of [3, wc - 4]) { for (let x = ex - 2; x <= ex + 3; x++) g[1][x] = 'I'; for (let x = ex - 1; x <= ex + 2; x++) g[2][x] = 'i'; }
    for (let x = 1; x <= wc; x++) {
      g[3][x] = mat === 'stone' ? 'w' : 's'; g[4][x] = 'h'; g[5][x] = (x % 6 === 0) ? 'D' : 'l'; g[6][x] = 'd'; g[7][x] = 'D';
      if (mat === 'moss' && (x * 5) % 7 === 0) g[3][x] = 'M';
      if (mat === 'rope' && (x === 6 || x === wc - 5)) for (let y = 4; y <= 7; y++) g[y][x] = y % 2 ? 'M' : 'm';
    }
    if (mat === 'stone') { const c = Math.floor(wc / 2); for (let x = c - 1; x <= c + 2; x++) { g[2][x] = 'w'; g[3][x] = 's'; g[4][x] = 'w'; } }
    return gOutline(g);
  }
  const gateArt = (key, fn) => art('gate' + G.stage + key, () => { const c = fn(); return G.stage === 4 ? ashify(c) : c; });
  function gateParts(d) { // 문 하나의 기둥·상인방 위치(월드 px)와 불 자리
    const p = DOOR[d], mat = gateMat(), out = [], fl = [];
    const post = (cx, baseY, hc, bowl) => { const c = gateArt('p' + hc + (bowl ? 'b' : ''), () => gCanvas(genGatePost(hc, mat, bowl), GATE_PAL[G.stage] || GATE_PAL[2])); const x = (Math.round(cx - c.width / 2) & ~1), y = (Math.round(baseY - c.height) & ~1); out.push({ c, x, y, sy: baseY }); if (bowl) fl.push({ x: x + c.width / 2, y: y + 4 }); };
    if (d === 'n') { post(p.x - 46, A.y0 + 10, 14, true); post(p.x + 46, A.y0 + 10, 14, true); }
    else if (d === 's') {
      post(p.x - 32, A.y1 + 10, 14, true); post(p.x + 32, A.y1 + 10, 14, true); // 상인방 없이 양옆 기둥만
    } else { const cx = d === 'w' ? A.x0 - 2 : A.x1 + 2; post(cx, p.y - 22, 5, true); post(cx, p.y + 44, 5, true); }
    return { parts: out, flames: fl };
  }
  const GATE_FLAME = [
    ['..o..', '.oyo.', '.oyo.', 'oyWyo', 'oyWyo', '.ooo.'],
    ['.o...', '.oo..', '.oyo.', 'oyWyo', 'oyWyo', '.ooo.'],
    ['...o.', '..oo.', '.oyo.', 'oyWyo', 'oyWyo', '.ooo.'],
  ];
  const GATE_FC = { open: { o: '#e2501c', y: '#ff9a2e', W: '#ffe28a' }, ash: { o: '#a02818', y: '#e05a2a', W: '#ffb070' }, shut: { o: '#5e0c14', y: '#b01e2a', W: '#ff6a5a' } };
  function gateFlameKind(st) { return st === 'open' ? (G.stage === 4 ? 'ash' : 'open') : 'shut'; }
  function drawGateFlame(f, kind, i) {
    const fr = kind === 'shut' ? 0 : Math.floor(time * 8 + i * 1.7) % 3, rows = GATE_FLAME[fr].slice(kind === 'shut' ? 2 : 0), pal = GATE_FC[kind];
    const x0 = (Math.round(f.x) - 5) & ~1, y0 = (Math.round(f.y) - rows.length * 2) & ~1;
    rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { const c = pal[r[xx]]; if (c) { ctx.fillStyle = c; ctx.fillRect(x0 + xx * 2, y0 + yy * 2, 2, 2); } } });
  }
  function gateEnts(ents) {
    const R = G.dun && G.dun.cur; if (!R || G.dun.forge || G.dun.home) return;
    for (const d in DIRS) {
      const st = doorState(R, d); if (st === 'none' || st === 'crack') continue;
      const { parts, flames } = gateParts(d), kind = gateFlameKind(st);
      parts.forEach((q, k) => ents.push({ y: q.sy, d: () => { ctx.drawImage(q.c, q.x, q.y); if (G.stage === 1) TRUTH.gatePost(R, d, k, q); /* v2.67 점액 묻은 문 기둥 */ if (k === parts.length - 1) flames.forEach((f, i) => drawGateFlame(f, kind, i + d.charCodeAt(0))); } }));
    }
  }
  function gateLights(lights) {
    const R = G.dun && G.dun.cur; if (!R || G.dun.forge || G.dun.home) return;
    for (const d in DIRS) { const st = doorState(R, d); if (st === 'none' || st === 'crack') continue; const k = gateFlameKind(st);
      for (const f of gateParts(d).flames) lights.push({ x: f.x, y: f.y - 6, r: k === 'shut' ? 44 : 64 + Math.sin(time * 9 + f.x) * 2, a: k === 'shut' ? 0.45 : 0.7, c: k === 'shut' ? '255,60,60' : k === 'ash' ? '255,120,70' : '255,170,80', ca: k === 'shut' ? 0.12 : 0.18 }); }
  }
  function roomEnts(ents) {
    const R = G.dun && G.dun.cur; if (!R) return;
    gateEnts(ents);
    if (R.sprites) for (const s of R.sprites) ents.push({ y: s.sy, d: s.ob && s.ob.tower ? () => { const P = G.player, b = s.ob, under = P.x > b.x0 - 6 && P.x < b.x1 + 6 && P.y > b.y0 - 50 && P.y < b.y1; ctx.globalAlpha = under ? 0.55 : 1; ctx.drawImage(s.cv, s.x, s.y); ctx.globalAlpha = 1; } : () => ctx.drawImage(s.cv, s.x, s.y) });
    if (R.props) for (const p of R.props) if (!PROPS[p.name].pit) ents.push({ y: p.y, d: () => drawProp(p) });
    if (G.drums) for (const dm of G.drums) ents.push({ y: dm.y, d: () => drawWarDrum(dm) });
    if (R.chest) ents.push({ y: R.chest.y + (R.chest.lift && !(R.chest.fall > 0) ? 1 : 0) /* v2.80 제단 위 상자는 제단 다음에 */, d: () => drawChest(R.chest) });
    if (R.socks) for (const s of R.socks) ents.push({ y: s.y, d: () => drawSock(s) });
    ashShotEnts(ents);
    if (R.srp) for (const s of R.srp) ents.push({ y: s.y, d: () => drawSR(s) });
    if (R.type === 'shop') { ents.push({ y: R.keeper ? R.keeper.y - 5 : CY - 28, d: () => drawShopKeeper(R) }); for (const s of R.shop) ents.push({ y: s.y, d: () => drawShopItem(s) }); }
    if (R.type === 'reward' && R.chest) ents.push({ y: R.chest.y - 1, d: () => drawTreasure(R) });
    if (R.type === 'shrine') SHRINE.ents(R, ents); // v3.25 빛의 샘: 빛기둥 · 흰 구체
    if (R.altars) for (const a of R.altars) ents.push({ y: a.y, d: () => drawAltar(a) }); // v2.02 피의 제단
    if (R.type === 'rest' && G.bonfire) BISTRO.ents(ents); // v3.10 모닥불 위 큰 솥 · 쿠오 · 쿠키
    if (R.type === 'home') HOME.ents(ents); // v2.97 시작 장소 NPC (역참 단군)
    if (R.type === 'archive') ARCH.ents(ents); // v3.00 코코아의 기록 보관소
  }
  function roomLights(lights) {
    const R = G.dun && G.dun.cur; if (!R) return;
    srLights(lights, R); if (R.type === 'shop') lights.push({ x: CX, y: CY + 40, r: 140, a: 0.45, c: '255,200,140', ca: 0.06 });
    if (R.type === 'reward' && R.chest) { lights.push({ x: R.chest.x, y: R.chest.y - 10, r: R.chest.opened ? 80 : 120, a: 0.75, c: '255,210,110', ca: R.chest.opened ? 0.1 : 0.22 }); }
    if (R.type === 'rest' && G.bonfire) lights.push({ x: G.bonfire.x, y: G.bonfire.y - 10, r: 150 + Math.sin(time * 8) * 6, a: 0.85, c: '255,150,60', ca: 0.22 });
    if (R.type === 'rest') BISTRO.lights(lights); // v3.10 쿠오 · 쿠키 · 메뉴판
    if (R.type === 'shrine') SHRINE.lights(R, lights); // v3.25
    if (R.exit) { lights.push({ x: R.exit.x, y: R.exit.y, r: 90, a: 0.7, c: '255,120,60', ca: 0.22 }); lights.push({ x: R.exit.x, y: R.exit.y - 70, r: 60, a: 0.45, c: '255,170,90', ca: 0.14 }); }
    if (R.tele && R.cleared) { lights.push({ x: R.tele.x, y: R.tele.y, r: 70, a: 0.6, c: '120,180,255', ca: 0.18 }); lights.push({ x: R.tele.x, y: R.tele.y - 60, r: 50, a: 0.4, c: '150,200,255', ca: 0.1 }); }
    if (R.props) for (const p of R.props) { const L = PROPS[p.name].light; if (L) lights.push({ x: p.x, y: p.y + L.dy, r: L.r + Math.sin(time * 9 + p.x) * 3, a: 0.8, c: L.c, ca: L.ca }); }
    for (const e of G.enemies) if (!e.dead && INV_MAP[e.type] && (e.fadeA == null || e.fadeA > 0.2)) lights.push({ x: e.x, y: e.y - 14, r: 64, a: 0.5, c: e.type === 'reaper' ? '200,140,255' : '255,180,120', ca: 0.12 }); // v1.59 난입자는 어둠 속에서도 보이게
    for (const e of G.enemies) if (!e.dead && e.type === 'reaper' && e.echoes) for (const q of e.echoes) if (!q.done) lights.push({ x: q.x, y: q.y - 14, r: 40, a: 0.35, c: '200,140,255', ca: 0.14 });
    for (const e of G.enemies) if (e.chak && e.chak.st !== 'held') lights.push({ x: e.chak.x, y: e.chak.y - 10, r: 30, a: 0.45, c: e.type === 'shrewB' ? '255,210,90' : '220,225,240', ca: 0.12 });
    for (const pr of G.eproj) if (pr.kind === 'ember') lights.push({ x: pr.x, y: pr.y - 10, r: 18, a: 0.35, c: '255,150,60', ca: 0.12 });
    for (const pr of G.eproj) if (pr.kind === 'crescent') lights.push({ x: pr.x, y: pr.y - 10, r: 22, a: 0.4, c: '200,140,255', ca: 0.12 });
    if (G.flatLights && G.flatLights.room === R) for (const l of G.flatLights) lights.push( /* v3.74 지금 방 바닥에서 만든 빛만 — 예전 방의 버섯 · 룬 · 모닥불 빛이 유적 · 놀이터 같은 다른 방 어둠 속에 떠 보이던 것 */l.flick ? Object.assign({}, l, { r: l.r + Math.sin(time * 10 + l.x) * 2 }) : l);
    if (G.stage === 1 && G.flies) for (const f of G.flies) if (f.cx != null) lights.push({ x: f.cx, y: f.cy, r: 14, a: 0.35, c: '220,255,120', ca: 0.2 });
    if (R.socks) for (const s of R.socks) { const on = s.dual ? G.dun.sock[0] || G.dun.sock[1] : G.dun.sock[s.i]; lights.push({ x: s.x, y: s.y - SOCK_H[SST()] + 6, r: on ? 64 + Math.sin(time * 9 + s.i) * 3 : 30, a: on ? 0.8 : 0.35, c: on ? SK().rgb : '200,200,220', ca: on ? 0.22 : 0.05 }); }
    if (R.chest && !R.chest.opened) lights.push({ x: R.chest.x, y: R.chest.y - 10, r: 60, a: 0.6, c: R.chest.kind === 'secret' ? '200,140,255' : '255,200,110', ca: 0.18 });
    if (R.chest && R.chest.kind === 'boss' && !R.chest.fall) lights.push({ x: R.chest.x, y: R.chest.y - 10, r: R.chest.opened ? 90 : 130, a: 0.8, c: '255,190,90', ca: R.chest.opened ? 0.1 : 0.25 });
    if (G.stage >= 2) for (const b of R.obs) if (b.t === 'post') continue; else if (b.t === 'pit') lights.push({ x: b.x, y: b.y0 + 10, r: Math.max(b.w, b.h) * 0.55, a: 0.22 }); else lights.push({ x: b.x, y: b.y - (b.t === 'pillar' ? 20 : 8), r: b.c ? 42 : Math.max(b.w, b.h) * 0.6 + 20, a: 0.28 });
    for (const d in DIRS) { const st = doorState(R, d); if (st === 'open' || st === 'sealed') { const q = doorIn(d, 6); lights.push({ x: q.x, y: q.y, r: 50, a: 0.45, c: st === 'sealed' ? '255,60,60' : null, ca: 0.1 }); } }
    gateLights(lights); // 문 기둥의 불
  }

  // ---------- 미니맵 · 지도 · 순간이동
  const shapeFit = r => { const sh = SHAPES[r.shape] || SHAPES.field; return { w: sh.w >= 1300 ? 1 : sh.w >= 1000 ? 0.82 : sh.w >= 500 ? 0.6 : 0.36, h: sh.h >= 700 ? 1 : sh.h >= 500 ? 0.82 : sh.h >= 300 ? 0.6 : 0.36 }; };
  const roomColor = (r) => ({ shrine: '#8a7ac8', boss: '#a02a34', shop: '#b08a2a', rest: '#c06a2a', reward: '#c0a040', secret: '#8a5ac0', elite: '#7a2a40', survive: '#5a4a7a', start: '#4a6a4a' }[r.type] || '#3a3444');
  const FIGHT_T = new Set(['combat', 'elite', 'survive', 'boss']);
  // 클리어 표시: 금색 체크 (검은 외곽선, s = 칸 크기)
  function drawCheck(x, y, s) {
    const cells = [[0, 2], [1, 3], [2, 2], [3, 1], [4, 0]], put = (c, col, o) => { ctx.fillStyle = col; for (const [cx, cy] of cells) { ctx.fillRect(x + cx * s - o, y + cy * s - o, s + o * 2, s + o * 2); ctx.fillRect(x + cx * s - o, y + (cy + 1) * s - o, s + o * 2, s + o * 2); } };
    put(cells, '#000', 1); put(cells, '#7dff9a', 0);
  }
  // v3.19 미니맵도 실제 방 크기 비율 (TAB 지도와 같은 규칙: 가장 큰 방 1180×640이 한 칸 + 틈 60% · 가 보지 않은 방은 같은 크기 네모)
  const mmSize = (r, cw, ch, gap) => { if (!r.visited) return { w: Math.round(cw * 0.5 / 2) * 2, h: Math.round(ch * 0.6 / 2) * 2 }; const sh = SHAPES[r.shape] || SHAPES.field, k = Math.min((cw + gap * 0.6) / 1180, (ch + gap * 0.6) / 640); return { w: Math.max(6, Math.round(sh.w * k / 2) * 2), h: Math.max(6, Math.round(sh.h * k / 2) * 2) }; };
  const MM = { phT: -1, phH: 52, key: '', c: null }; // v1.78 미니맵 방 그림 캐시 (방 상태가 바뀔 때만 다시 그림)
  // v1.90 방 바닥에 남은 아이템 → 지도 아이콘 (장비가 있으면 가장 높은 등급 색)
  function roomLoot(r) {
    const arr = r === G.dun.cur ? G.loot : r.loot; if (!arr || !arr.length) return null;
    let n = 0, gi = -1;
    for (const l of arr) { if (!(l.life > 0)) continue; n++; if (l.type === 'gear') gi = Math.max(gi, { common: 0, rare: 1, unique: 2, legend: 3, rby: 4 }[l.it.grade]); }
    return n ? { n, c: gi >= 0 ? GRADES.find(g => g.k === ['common', 'rare', 'unique', 'legend', 'rby'][gi]).c : '#f0e8c8' } : null;
  }
  // v1.92 TAB 지도: 방 바닥 아이템 종류별 [아이콘 그리는 함수, 개수]
  function roomLootCats(r) {
    const arr = (r === G.dun.cur ? G.loot : r.loot) || [];
    const GI = { common: 0, rare: 1, unique: 2, legend: 3, rby: 4 }; let gear = null, gn = 0; const n = {}, key = {};
    for (const l of arr) { if (!(l.life > 0)) continue; if (l.type === 'gear') { gn++; if (!gear || GI[l.it.grade] > GI[gear.grade]) gear = l.it; } else { const k = l.type === 'bigmeat' ? 'meat' : l.type; n[k] = (n[k] || 0) + 1; if (k === 'sealkey') key.l = l; } }
    const out = [];
    if (r.chest && !r.chest.opened) out.unshift([(x, y) => drawMapIcon(MAP_CHEST, x, y), 1]); // v1.93 열지 않은 보물상자
    if (gear) out.push([(x, y) => drawMapIcon(MAP_SWORD, x, y), gn]); // v1.93 장비는 검 모양 하나로
    if (n.pouch) out.push([(x, y) => drawSprite('pouch', 'loot', 2, x, y, false), n.pouch]); // v3.26 지도에는 작은 금화 주머니 (v3.13 새 도트 pouchX는 바닥용 · 팔레트도 달라 지도에서 크게 깨져 보였음)
    if (n.meat) out.push([(x, y) => drawSprite('heartHalf', 'loot', 2, x, y, false), n.meat]);
    if (n.vial) out.push([(x, y) => drawSprite('vial', 'loot', 2, x, y, false), n.vial]);
    if (n.orb) out.push([(x, y) => drawSprite('orb', 'loot', 2, x, y, false), n.orb]);
    if (n.sealkey) out.push([(x, y) => drawSealKey(key.l, x, y), n.sealkey]);
    return out;
  }
  // v1.93 지도용 작은 아이콘 (2px 칸, 아래 가운데 기준)
  const MAP_SWORD = { rows: ['......wk', '.....wwk', '....wwk.', 'k..wwk..', 'kkwwk...', '.kgk....', 'kgkk....', 'kk......'], pal: { w: '#e8ecf4', k: '#1a1820', g: '#c8a050' } };
  const MAP_CHEST = { rows: ['.kkkkkk.', 'kyyyyyyk', 'kbbybbbk', 'kkkgkkkk', 'kbbgbbbk', 'kbbbbbbk', '.kkkkkk.'], pal: { k: '#140c08', y: '#ffd34d', b: '#8a5a2a', g: '#ffe9a0' } };
  function drawMapIcon(ic, x, y) {
    const h = ic.rows.length, w = ic.rows[0].length, x0 = (Math.round(x) & ~1) - w, y0 = (Math.round(y) & ~1) - h * 2;
    ic.rows.forEach((row, j) => { for (let i = 0; i < w; i++) { const c = ic.pal[row[i]]; if (!c) continue; ctx.fillStyle = c; ctx.fillRect(x0 + i * 2, y0 + j * 2, 2, 2); } });
  }
  function drawRoomLoot(cats, x, y, rw, rh) { // 아이콘(16px) + 개수 — 방 폭에 안 들어가면 개수부터 빼고, 그래도 넘치면 앞에서부터 들어가는 만큼 + 「+」
    const avail = rw - 14, wOf = cnt => cats.reduce((a, c) => a + 16 + (cnt && c[1] > 1 ? 12 : 0), 0) + (cats.length - 1) * 4;
    const cnt = wOf(true) <= avail; let list = cats, more = false;
    if (!cnt && wOf(false) > avail) { const n = Math.max(1, Math.floor((avail - 8 + 4) / 20)); list = cats.slice(0, n); more = n < cats.length; }
    const ws = list.map(c => 16 + (cnt && c[1] > 1 ? 12 : 0)), W = ws.reduce((a, b) => a + b, 0) + (list.length - 1) * 4 + (more ? 8 : 0), by = y + Math.max(rh - 5, Math.round(rh / 2) + 8); // v3.19 낮은 방에서는 아이콘을 방 가운데에
    let cx = Math.round(x + (rw - 12) / 2 - W / 2 + 2);
    ctx.save(); ctx.font = '8px Galmuri7'; ctx.textAlign = 'left';
    list.forEach(([draw, k], i) => {
      draw(cx + 8, by);
      if (cnt && k > 1) { ctx.fillStyle = '#000'; ctx.fillText('×' + k, cx + 18, by); ctx.fillStyle = '#f0e8d8'; ctx.fillText('×' + k, cx + 17, by - 1); }
      cx += ws[i] + 4;
    });
    if (more) { ctx.fillStyle = '#000'; ctx.fillText('+', cx + 1, by); ctx.fillStyle = '#f0e8d8'; ctx.fillText('+', cx, by - 1); }
    ctx.restore();
  }
  function drawLootMark(x, y, c, big) { // 작은 보석 모양 (검은 테두리)
    const s = big ? 2 : 1;
    ctx.fillStyle = '#000'; ctx.fillRect(x - s, y - 2 * s, 3 * s, 5 * s); ctx.fillRect(x - 2 * s, y - s, 5 * s, 3 * s);
    ctx.fillStyle = c; ctx.fillRect(x, y - s, s, 3 * s); ctx.fillRect(x - s, y, 3 * s, s);
  }
  const HF = { t: 0, L: null, R: null, dimL: false, dimR: false, a: 1 };
  function hudFade() {
    if (!G || !G._wt) return; const T = G._wt;
    if (!(time < HF.t)) { HF.t = time + 0.5; const pa = $('party'), ph = $('phase'); HF.L = pa ? { x: pa.offsetLeft, y: pa.offsetTop, w: pa.offsetWidth, h: pa.offsetHeight } : null; HF.R = ph ? { x: VW - 8 - 140, y: 8, w: 140, h: (MM.bot || 160) - 8 } : null; }
    const pts = []; const P = G.player; if (P && !P.dead) pts.push([P.x, P.y - 16]);
    for (const e of G.enemies) if (!e.dead && !isDummy(e)) pts.push([e.x, e.y - 14]);
    const hit = r => r && pts.some(([x, y]) => { const sx = T.a * x + T.e, sy = T.d * y + T.f; return sx > r.x - 8 && sx < r.x + r.w + 8 && sy > r.y - 8 && sy < r.y + r.h + 12; });
    const dl = hit(HF.L), dr = hit(HF.R);
    if (dl !== HF.dimL) { HF.dimL = dl; const pa = $('party'); if (pa) pa.classList.toggle('hudDim', dl); }
    if (dr !== HF.dimR) { HF.dimR = dr; const ph = $('phase'); if (ph) ph.classList.toggle('hudDim', dr); }
    HF.a += ((dr ? 0.28 : 1) - HF.a) * 0.25;
  }
  function drawMinimap() {
    const D = G.dun; if (!D) return;
    if (!(time < MM.phT)) { const ph = $('phase'); MM.phH = ph && ph.offsetHeight ? ph.offsetHeight : 52; MM.phT = time + 0.5; } // v1.78 패널 높이는 0.5초마다만 읽음
    const W0 = 140, H0 = 100, x0 = VW - 8 - W0, y0 = 8 + MM.phH + 6, cw = 30, ch = 20, gap = 8; // v1.39 단계 패널 바로 아래 6px · v1.91 방을 크게(16×11 → 30×20), 내 방 주변만
    MM.bot = y0 + H0;
    const key = D.cur.id + '|' + D.rooms.map(r => (r.seen ? 1 : 0) + (r.visited ? 2 : 0) + (r.cleared ? 4 : 0) + (r.tele ? 8 : 0) + (r.exit ? 16 : 0) + (r.chest && !r.chest.opened ? 32 : 0) + (r.crack && r.crack.broken ? 64 : 0) + (r.visited ? (((q) => q ? 'L' + q.n + q.c : '')(roomLoot(r))) : '')).join(',');
    const blink = Math.floor(time * 4) % 2;
    if (MM.key !== key || !MM.c || MM.dun !== D) { MM.key = key; MM.dun = D; const [mc, mg] = MM.c ? [MM.c, MM.g] : mkCanvas(W0, H0); MM.c = mc; MM.g = mg; mg.clearRect(0, 0, W0, H0);
      const ctx0 = ctx; ctx = mg; try { drawMinimapRooms(D, 0, 0, W0, H0, cw, ch, gap); } finally { ctx = ctx0; } }
    ctx.save(); ctx.globalAlpha = HF.a; /* v2.38 캐릭터·적이 뒤에 있으면 미니맵도 흐리게 */ ctx.drawImage(MM.c, x0, y0);
    ctx.font = '8px Galmuri7'; ctx.textAlign = 'right'; if (!TOUCH.on) drawKeyRow(ctx, VW - 12, y0 + H0 + 11, [['TAB', '지도']], { align: 'right' }); // v2.63 키캡
    { const cur = D.cur, ms = mmSize(cur, cw, ch, gap), rw = ms.w, rh = ms.h, x = Math.round(x0 + W0 / 2 - rw / 2), y = Math.round(y0 + H0 / 2 - rh / 2);
      ctx.save(); ctx.strokeStyle = blink ? '#ffe39a' : '#fff'; ctx.lineWidth = 1; ctx.strokeRect(x - 0.5, y - 0.5, rw + 1, rh + 1); ctx.restore(); }
    ctx.restore();
  }
  function drawMinimapRooms(D, x0, y0, W0, H0, cw, ch, gap) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,6,12,.72)'; ctx.fillRect(x0, y0, W0, H0);
    ctx.strokeStyle = 'rgba(201,162,74,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, W0 - 1, H0 - 1);
    ctx.beginPath(); ctx.rect(x0 + 1, y0 + 1, W0 - 2, H0 - 2); ctx.clip();
    const cx = x0 + W0 / 2, cy = y0 + H0 / 2, cur = D.cur;
    const pos = r => ({ x: cx + (r.gx - cur.gx) * (cw + gap), y: cy + (r.gy - cur.gy) * (ch + gap) });
    ctx.fillStyle = '#6a6478';
    for (const r of D.rooms) { if (!r.visited) continue; for (const d in r.doors) { const id = r.doors[d]; if (id == null || hiddenDoor(r, d)) continue; const o = D.rooms[id]; if (!o.seen) continue; const p = pos(r), q = pos(o); if (DIRS[d][0]) ctx.fillRect(Math.round(Math.min(p.x, q.x)), Math.round(p.y) - 1, Math.round(Math.abs(q.x - p.x)), 2); else ctx.fillRect(Math.round(p.x) - 1, Math.round(Math.min(p.y, q.y)), 2, Math.round(Math.abs(q.y - p.y))); } } // v1.91 통로를 선으로
    for (const r of D.rooms) {
      if (!r.seen) continue;
      const ms = mmSize(r, cw, ch, gap), rw = ms.w, rh = ms.h, p = pos(r), x = Math.round(p.x - rw / 2), y = Math.round(p.y - rh / 2);
      if (r.visited) { ctx.fillStyle = roomColor(r); ctx.fillRect(x, y, rw, rh); }
      else { ctx.fillStyle = r.type === 'boss' ? 'rgba(160,40,52,.35)' : 'rgba(40,36,48,.9)'; ctx.fillRect(x, y, rw, rh); ctx.strokeStyle = r.type === 'boss' ? '#a02a34' : '#5a5466'; ctx.strokeRect(x + 0.5, y + 0.5, rw - 1, rh - 1); }
      if (r.visited && r.tele && r.cleared) { ctx.fillStyle = '#9fd2ff'; ctx.fillRect(x + rw - 6, y + 2, 4, 4); }
      if (r.exit) { ctx.fillStyle = '#ff7a40'; ctx.fillRect(x + 2, y + 2, 4, 4); }
      if (r.wellSeen) { ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x + 1, y + rh - 7, 6, 6); ctx.fillStyle = '#e09a30'; ctx.fillRect(x + 2, y + rh - 6, 4, 4); ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x + 3, y + rh - 5, 2, 2); } // v3.19 다녀온 버려진 우물 (왼쪽 아래 · 호박색 고리)
      if (r.chest && !r.chest.opened && r.visited) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(x + 2, y + 2, 4, 4); }
      if (r.cleared && FIGHT_T.has(r.type)) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y, rw, rh); drawCheck(Math.round(p.x - 5), Math.round(p.y - 3), 2); }
      if (r.visited) { const q = roomLoot(r); if (q) drawLootMark(x + rw - 4, y + rh - 4, q.c, true); } // v1.90 바닥 아이템 (오른쪽 아래 모서리)
    }
    ctx.restore();
  }
  const teleRooms = () => G.dun.rooms.filter(r => r.visited && r.tele && r.cleared);
  function openMap() {
    if (mode !== 'play' || G.trans) return;
    mode = 'map'; sfx('blip');
    const L = teleRooms(); G.mapSel = L.includes(G.dun.cur) ? G.dun.cur : L[0] || null;
    for (const k in pressed) pressed[k] = false;
  }
  function closeMap() { mode = 'play'; for (const k in pressed) pressed[k] = false; }
  function mapLayout() {
    const D = G.dun, cols = D.bx1 - D.bx0 + 1, rows = D.by1 - D.by0 + 1;
    // v1.92~93 화면에 꽉 차게: 가로 728 · 세로 308(제목 아래 ~ 범례 위) 안에서 칸을 최대한 크게
    const side = G.stage === 2 && D.rooms.some(r => r.type === 'chapel' && r.oath && r.oath.read.length) ? 200 : 0, AW = 728 - side; // v2.66 「주운 구절」 패널 자리만큼 지도를 왼쪽으로
    const cw = Math.floor(clamp(AW / (cols * 1.3 - 0.3), side ? 36 : 50, 120) / 2) * 2, gap = Math.round(cw * 0.3 / 2) * 2;
    const ch = Math.floor(clamp(Math.min(cw * 0.64, 308 / (rows * 1.4 - 0.4)), 24, 80) / 2) * 2, gapY = Math.max(8, Math.round(ch * 0.4 / 2) * 2);
    const ox = (VW - side) / 2 - (cols * (cw + gap) - gap) / 2, oy = 64 + Math.max(0, (308 - (rows * (ch + gapY) - gapY)) / 2);
    return { cw, ch, gap, gapY, pos: r => ({ x: ox + (r.gx - D.bx0) * (cw + gap), y: oy + (r.gy - D.by0) * (ch + gapY) }) };
  }
  function updateMap() {
    if (take('tab') || take('escape') || take('m')) { closeMap(); return; }
    const L = teleRooms();
    const mv = [['arrowup', 'w', 0, -1], ['arrowdown', 's', 0, 1], ['arrowleft', 'a', -1, 0], ['arrowright', 'd', 1, 0]];
    for (const [k1, k2, dx, dy] of mv) if (take(k1) || take(k2)) {
      const s = G.mapSel || G.dun.cur; let best = null, bd = 1e9;
      for (const r of L) { const vx = r.gx - s.gx, vy = r.gy - s.gy, along = vx * dx + vy * dy; if (along <= 0) continue; const sc = along + Math.abs(vx * dy - vy * dx) * 2; if (sc < bd) { bd = sc; best = r; } }
      if (best) { G.mapSel = best; sfx('blip'); }
    }
    let go = take('enter') || take(' ') || take('f');
    if (take('j') && mouse.active > 0) {
      const M = mapLayout();
      const hit = L.find(r => { const p = M.pos(r); return mouse.x >= p.x && mouse.x <= p.x + M.cw && mouse.y >= p.y && mouse.y <= p.y + M.ch; });
      if (hit) { G.mapSel = hit; go = true; }
    }
    if (go && G.mapSel) {
      if (G.sealed) { sfx('block'); lootFeed('전투 중에는 순간이동할 수 없다', '#ff7070'); return; }
      const t = G.mapSel; closeMap();
      if (t !== G.dun.cur) goRoom(t, null, true);
    }
  }
  function drawMapOverlay() {
    const D = G.dun, M = mapLayout(), L = teleRooms();
    ctx.fillStyle = 'rgba(6,5,10,.86)'; ctx.fillRect(0, 0, VW, VH);
    ctx.textAlign = 'center'; ctx.font = 'bold 12px Galmuri11'; ctx.fillStyle = '#ffe39a';
    const solo = D.rooms.length === 1; // v3.19 시작 장소 · 대장간 · 안전 놀이터처럼 방 하나짜리 장소는 장 번호 없이 그 장소만 따로 띄움
    if (solo) ctx.fillText(roomName(D.cur.type) || '', VW / 2, 40);
    else { ctx.fillText(`STAGE ${G.stage} · ${STG().n}`, VW / 2, 40);
    ctx.font = '8px Galmuri7'; ctx.fillStyle = '#9a92a8';
    ctx.fillText(`${ER().foe} ${D.eliteDone}/2 · ${sealHud()} · ${D.bossOpen ? '보스 방 열림' : '보스 방 봉인'} · 골드 ${G.gold}G`, VW / 2, 54); }
    // 통로
    ctx.fillStyle = '#5a5466';
    for (const r of D.rooms) { if (!r.visited) continue; const p = M.pos(r); for (const d in r.doors) { const id = r.doors[d]; if (id == null || hiddenDoor(r, d) || !D.rooms[id].seen) continue; const q = M.pos(D.rooms[id]), cx0 = p.x + M.cw / 2, cy0 = p.y + M.ch / 2, cx1 = q.x + M.cw / 2, cy1 = q.y + M.ch / 2; if (DIRS[d][0]) ctx.fillRect(Math.round(Math.min(cx0, cx1)), Math.round(cy0) - 2, Math.round(Math.abs(cx1 - cx0)), 4); else ctx.fillRect(Math.round(cx0) - 2, Math.round(Math.min(cy0, cy1)), 4, Math.round(Math.abs(cy1 - cy0))); } } // v1.93 통로 = 방 가운데끼리 잇는 선
    for (const r of D.rooms) {
      if (!r.seen) continue;
      const lootCats = r.visited ? roomLootCats(r) : [];
      // v3.19 가 본 방은 실제 방 크기 비율 그대로 (가장 큰 방 1180×640이 한 칸에 꽉 참 · 가로세로 같은 배율) — 가 보지 않은 방만 같은 크기의 네모
      const sh0 = SHAPES[r.shape] || SHAPES.field, kk = Math.min((M.cw + M.gap * 0.6) / 1180, (M.ch + M.gapY * 0.6) / 640) * (solo ? 2.2 : 1); // 칸 사이 틈의 60%까지 써서 조금 더 크게
      const rw = r.visited ? Math.max(12, Math.round(sh0.w * kk / 2) * 2) : Math.round(M.cw * 0.5 / 2) * 2, rh = r.visited ? Math.max(10, Math.round(sh0.h * kk / 2) * 2) : Math.round(M.ch * 0.6 / 2) * 2, p0 = M.pos(r), x = Math.round(p0.x + (M.cw - rw) / 2), y = Math.round(p0.y + (M.ch - rh) / 2);
      ctx.fillStyle = r.visited ? roomColor(r) : 'rgba(30,27,36,.95)'; ctx.fillRect(x, y, rw, rh);
      if (r.cleared && FIGHT_T.has(r.type)) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x, y, rw, rh); }
      ctx.strokeStyle = r.visited ? 'rgba(255,255,255,.15)' : r.type === 'boss' ? '#a02a34' : '#5a5466'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, rw - 1, rh - 1);
      ctx.font = '8px Galmuri7'; ctx.fillStyle = r.visited ? '#f0e8d8' : r.type === 'boss' ? '#ff8080' : '#6a6478';
      if (!lootCats.length || rh >= 34) ctx.fillText(r.visited || r.type === 'boss' ? (solo ? '현재 위치' : roomTag(r.type) || roomName(r.type) || '') : '?', x + rw / 2, lootCats.length ? y + 12 : y + rh / 2 + 3); // 낮은 방은 아이콘만 (방 종류는 색으로)
      if (r.visited && r.tele) { ctx.fillStyle = r.cleared ? '#9fd2ff' : '#4a4560'; ctx.fillRect(x + rw - 6, y + 2, 4, 4); }
      if (r.cleared && FIGHT_T.has(r.type)) { drawCheck(x + rw - 5, y + rh - 6, 2); ctx.font = "8px Galmuri7"; }
      if (lootCats.length) drawRoomLoot(lootCats, x, y, rw, rh); // v1.92 바닥 아이템을 실제 모양(장비·골드·물약…)으로
      if (r === D.cur) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - 1, rw + 2, rh + 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + rw / 2 - 2, y - 7, 4, 4); }
      if (r === G.mapSel) { ctx.strokeStyle = Math.floor(time * 5) % 2 ? '#9fd2ff' : '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x - 3, y - 3, rw + 6, rh + 6); }
    }
    ctx.font = '8px Galmuri7'; ctx.fillStyle = '#8a8496';
    if (solo) { if (TOUCH.on) ctx.fillText('지도 버튼으로 닫기', VW / 2, VH - 26); else drawKeyRow(ctx, VW / 2, VH - 25, [['TAB', '닫기']]); ctx.textAlign = 'left'; return; } // 방 하나짜리 장소: 범례 · 순간이동 안내 없음
    if (TOUCH.on) ctx.fillText(L.length ? '방을 탭하면 순간이동 · 지도 버튼으로 닫기' : '방을 클리어하면 그 방의 텔레포터가 켜진다 · 지도 버튼으로 닫기', VW / 2, VH - 26);
    else drawKeyRow(ctx, VW / 2, VH - 25, L.length ? [['↑↓←→', '선택'], ['ENTER', '이동'], ['TAB', '닫기']] : ['방을 클리어하면 그 방의 텔레포터가 켜진다', ['TAB', '닫기']]); // v2.63 키캡
    ctx.textAlign = 'left'; const lg = (x, txt) => { ctx.fillStyle = '#8a8496'; ctx.fillText(txt, x, VH - 40); };
    ctx.fillStyle = '#9fd2ff'; ctx.fillRect(VW / 2 - 196, VH - 44, 4, 4); lg(VW / 2 - 189, '텔레포터');
    drawMapIcon(MAP_CHEST, VW / 2 - 134, VH - 36); lg(VW / 2 - 123, '보물상자');
    drawMapIcon(MAP_SWORD, VW / 2 - 70, VH - 36); lg(VW / 2 - 59, '장비');
    ctx.fillStyle = '#a02a34'; ctx.fillRect(VW / 2 - 28, VH - 44, 4, 4); lg(VW / 2 - 21, '보스');
    ctx.fillStyle = '#5a5466'; ctx.fillRect(VW / 2 + 8, VH - 44, 4, 4); lg(VW / 2 + 15, '? 가 보지 않은 방');
    drawCheck(VW / 2 + 98, VH - 46, 1); lg(VW / 2 + 107, '클리어');

    ctx.textAlign = 'left';
  }
;

// ==================================================================== 07_worldmap.js
'use strict';
// 잿빛 왕관 원정대 — 07_worldmap.js : 챕터 시작 월드맵
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ v1.69 챕터 시작 월드맵
  // 240×160 도트 월드맵(4개 지역)을 화면 2px 칸으로 띄우고, 이번 챕터 지역만 밝히고(나머지는 어둡게),
  // 지나온 길을 이어 그은 뒤 금빛 테두리·노드 고리·챕터 이름 패찰을 보여 주고 F를 누르면 게임으로 넘어간다 (v2.56, 그리는 중 F는 건너뜀)
  const WM_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAACgCAMAAAAFBRFXAAAC8VBMVEXo2Ljw2JDYyLDYyJq44IrIyNDwwGDYwJjQwKjIuKDgvGDIsIjwoEjooEjIoFC4qJDwijjgiDjEmlqogEyghGaKipaKgHhqjpp+lE5emjqGhI/gcCjIaiqgekygekSgfDSKcFaKajBmeEdtbHVuanRqaHRqaHJxaGJ2aVNVeohVZz2KZkCKZECKYjiKWjB6WjR6WiSCWDRuZmBqYlxfXWZdXGRcWmVgWVQ9YHBNZjhGVzWgShyKShx6SipwSixkVCtuTDBaVFBYUElVUEtSTEhQT1dQT1U+VTAuSlpqRjBiRihLSVJOSUVYQyVKSFJKREBGRU5DQ0ozSVE4Ry0zSCp6OhhePCRaQihaPCJFQT1APkY+PUVCPTpAPDk+O0Q8O0M+OTY7ODQ8NzQ2Nz0uODIkOUOoMCqgMBiKKiJuHhZqGhZaFBBMMB5KMhxKLhhJNh9DMRw+MiY+LxU6NTM6Kh46Khw6Jho6JBg6JBQ+Eg83Njw2NT0zMjk2Mi82MS4zMC44JBUzIRMrNiUyMjgqNB8sKzIqKzAuKigsKjIrKjAqKjAsKCcsKCYoKCwqJiQoJSMnJCQyIRMtHBIqHBYsGw4qGxAqGhIqGhApGhAqGBAoGQ0mNj0iMB8kMhwlLCgmLhsbKzIhKhseKhgfJxcmJismJSolJSolJCklIiAkIycbJhUiISggISQZIBYZHxQUISgSIA4iHh0hHhweHiEgHRweHCAeHBsdHiEcGxkcGhocGhkcGRgiFQ4iFQ0aGhoZGRwbGBcaGBgYGBsYFxwYFhwXFxoXFRUWFRQTGRATGBAQFgwPFQ0kFAoiFAwfEw0aEhAXFBQXEw8VExMUEhIaEAoUEBAaDggUCgQSExUTEhYTERERERMSEBAREBAQEBMQEBASDgwQDg4SDAkQDQ0OEgwODhANDQ8ODAwNDA4NDAwMDA4OCwoMCwsMCwoOCggNCgoMCgoMCQgLCQkKCQkJCQkPCAQOBwQLCAcIBwcIBgYGBQVqlPrZAAAwWUlEQVR42uV9f5wcZ3mf6aYoBkdOg3u2hSoMMUlzkX3h0lycdbz4ql6xoLGYLhkM8oHtcVMog5rWls9FiQdt6IoKIsaosjkqB2KpKS62orMQzVZVqCXXqhKp1lXew3V9KfTaqliCnt02YP7q8/t53jnxKf/zDns7Ozuzer/zfX6/z5hLVsN4+UdkINZLAO3q9/6IDMQKgBdPnKhO0GuxWly8MLiwuFjDsekTf3QCPuMx/LzI+3Iczq3h3BrP5Rdcd4E+02/h+XyOXM/X8nf0b1ygY0f3LOaLe47mR/F19GjJ78/NPPccvI4+V+ILjud7HtyT79lzlPbp8x78vKfz4IP8Lp/5d5q/B9fxbx3NEfDqCuZRwfym6b2GmdSL1R9N44bHYaMj+g2cx8f5c83vgGFwAfeqxZvk9+jX9J2+oX3+xL+1WME8bYP58d8S0JaAlLccjnZgkzPoc06fOw/C36PyzseO6m/lfK1e9xx/ApF++b2LjErnMrggqBK8tc/yxPTbq8XXLdZvpyO2EWJDSL/HmBb17vAx+Tf4bh2tjuYnbIbPlTzP52RLEPu8DYffJUV61N8beOn39rz3ZQBMM7lj14mqgvnUMIsaPleAeBoQ43uFx2CGA/oOPr/p7dWbqre/qX6zHucXXEu/4a/Fqk5edIzOq+UdzuvkwF8Ocyxhjv56riz5WJ7DvDsw8/A9HstLeNF1+dHwjr/Fx/U62Kfr4C4QYLzb37vjjl2LilhmdsJQEypgkBH/w+p1b3r76+BFs+fj4W7g+XJ9RGvo9Y4i4upoNQ4M54bmuXKGkMrnnF653JHw/VFG4Xcp53P3yLl7GD3Ieqfjd/JozgwDNy+++OIuwAcbzMoGfMYBxwAXDOCEvv2NX/gF/B/sAU48zt/UfEXVHLX8Zs37d+zCD7vuqPCa8fGzwHAH5ghTgtcMbCXMFD7DltMLv5cz8FsceJTOKPUovF9eXk7n4tV0pVwnv43Sbgwv0qxqm12tnwkzwiHES4Oav62W6Ps34/Elxru2tnsVf6vm4UdeBGGq6l133PFiXdbjAPgszZCBzCjiXFHlgjjP9VvCbFjpqpkZuhbx5gGv3Sk6E2286DDpUl3VgV1HbAwDriWa+5vh+2sFDRxdSjEZpyQtde3f8jcoTHW1C96qatOnPnUWBszvcth0/sxtrrPvCGK7I/K936UZvgvAMPPLd9DuVEAsDC9Wi46Q52XzrKb5MyFeO5CZX/uBT9aK+No6oqqTXyLZ4Fe8j6IbmwTwWZhRwOuoI96v45gxxCwFLMuMWHUhN3nPTTcEb6lWOtFbnZkitnkTNv762k8+bd9cm+KsG9ob7p3rMW3f9JFf3hHEqpkmzaLDb3jDG26DMSMaLFosOs24FWEYnQZiAsy+U62UMBp0b0llt2ZeCe8HDDFil7EUkKV4ya5VKtm4V1b5dJXXubPi0uwMunS/4ed//icBsPHLKFiW5RgiJjnwO+K/POM6TFEWY8WxDIiXfbZVvWTzVl6v/QDgffrpabo7137gaZFROpPx2n3Tu6fWznQb8E6Pqy3N1W4FKcTPV1yjkomAb0TAZstKs3Ol2vWyFDko83TwmWqlOQKqKsaLiJcDMzXJMX9ShgEwIP4k2bMqMHxt5d7JJfcpRUy/ZxJU5WChc/cjhtM8TnnvFYIYzvg6j4TfYNXZquUiB3mZbnRXMAZjhpHftczw34KNOA6SqEYJLdXTTzPepcv+0hJQDNfAh6efFnt1rXDKd0J4f2ryKbZ6ItfVTeLtySWJ5+ioPQ1eJS/vvffea8xaX3eqvO1UGfR8FeytAiSrYP/14nFdDvi8ZGikxVmDxxlA8LJYZRzAoMx1CUdNAv2BG298GjiGa/igSnxl/CrGupqsLHKh4IUtYwkmGg20zLQTrY3xMjPjnF9X3laeEq19/apyrFyXw6vk12mRE5WDGfXNM+qzgh/GLIH4XQaGlxHwciV8EF5gkCOpkQ2371higSYdBrqn4eCGHay7dKbwO+2aCwxPB8S13BEz0J23ue9MEIs10nEd4D1F0rmqPI0gYZuBDd9Pj53urKI7p3LAeM1H5wnDlTK8jNI8jSZLJZAs89OfZAYZ21IcFd8Fk/hPJgzT2LVrl/g1Ixi/z6s8rzoe/aX+xDXU9Pq62xBNuWpsZh3gK7fksJVbZuAF+MfeeRoIX0VyMHNqxhkOsRlmUGqlZZaM13R4wIYKdZT4Gtlwzw6CSOP2HTt2LCHDcPAZxEFnugZXKyKQun6qtvsxDn8T3TXcs/B3tsxNB8VqXXcqB+5m1o0hvrHTC7lvp38KAI/lY+tEDsyWxTgGMwr1wxc09lgmhzQdbIwwSTI7srQE2ATw7QT4qxUdTM50O1zXy/SK9ku8NFroTtWxCFHeCfNsOasetpyFv7Nkha/rABYQXyHURCFHvGNjHz2dbwHMAPi6UxZ5JYABb4ileR7LyxYz1JIDjWwgzSWGly4Thu+B/92+4x5iGA8+g9fLmVVArLewYn9VT9aGFyz0dIx7zQ8DL7NlbtEEoGf+r7tt1SkAvGUBCUZ8atxO/xQceCccWdgCgE+tQjlwax7iVGd4UbOl5RWxtACm+Y4s3TiCnG5YWoKDwCwzDAcJmwOOmcgyRxws0ZNPsf8SC111pmPEYZqLFJtMzoofPrX9137z1Ne3//npdQDwne8ExOVG3IBfBPzOjwLifMt1Y2LLRSdC/IZ1EI+leVuu60a2hIDvQcBVzQYZgS1dBjINzCLzdPCr02yviXPPENjDebQF9ouApxY6Ly0+Fks1O2sWehZVusPjN8c+v7Cd+AWAgI/wlqc/qgNIX7jutrFTp/z39C9J0h7LhxephuMxvuYz5IuWlsQMCzYEfOPIPbfDH/6ktPKZVbgWLf5yXac5hEToJVlpyXNnLBomzzlb+rHZWfHSq8a2AN484Cs3bgTEG0+P3bbuO9+5//7TGEqf+vznQQ4+97kyjbVyZniPVjwWq2XmN0T3IpWgo6bDG26/p2GlWaOFYTpz2jMHstfLdVpTMMT5OMB9m2b2gWEGbMdmxYavG1tYQOSOb6PI9NhtY3SAYC38+divlZ8rP5ei7eTBSnOdcpnxalZba+Y7QkySl7qIlX6GrTRZKj7Ts0y21/irdDcT61BWJRZ3QiXDsp8Zi5Fch2EAwcy04RO8pR3Yvn07/sjnx/5q+R8Qsekxj6Oqw4CX9Dfef8NbXcRKg41GB7RjB/GNB7+KbPKZ0yHL5GoJ/fbytFlvlmgu7ojNcobdn8wEPYSz1m1ZYE00fOV9iDfH7T7ZtuMFC2PrPK+eVRm54po8Vi1Bh5frZYs2Qv5qVhoZBoPMDC9dhjaLGUYrjQijlfbcUBFXgeGyVjstWXyqww0PyjNftcBxCertfffdJy9AuxFfgPb1hBhvz5ZVWvdCAWG8kHj9gzzUpVHulo1brULiO/CJmstG63aNtJZuRPlNrPS0npnWKjlqQ3c8HWJOL3V41dHj56RGJ5/XLZBEb8QtR27vI2Y32nY6R75JjddFuz9L75h47fF8GNYCBsvMKewAzmXGDcMZVmwx8HhGrfS0inSwepob092sLG/Mq3q8VkyQ8IoUw14T70zge6zMFTHiA2zXv/b6fKN+zjG+3hgSR6uZzJYSp+7RfBj9MGFUWRbhZsTibMgP37OBo+fESt9jDItbctmt6rVSI1v2igoABvUVS0IpPg3c4/mRnSqtMiPyvSUPDNP22je+dmNHNwwvTyPDeOm6MtQ60K9pLO116QsiyQNBLLkwvINRukcZft+GLwGnP7vhfbD99u1f2vElsFY/u+G3d/wvsdKXUXIhHDPDUG9nwJJvP4wD7RXPCSVNAOOeMOIa6DZsYcx0OCf/e/0b/+4br9+In/FF8TV8VZJBt/ol/MJsyP/ND1+ItgoEEOVbVhpGlm5CZzNSj1S/fOeOr7xSjfzynZ+5E/634zNf+cor0/Dpzq+88jeqkWqE3dJ0UsvHevu0VkKr6Yfv5/Ew2ivLgMvcVxPg02yoxbt+L/x9kmniE23z9RtnZ2c3Xi+MS3xNMj2zbstnNfsSkWGZPpow7BkrMLw8sLUV1syRH2aIla49xuB6u63gPHz/N/7iN2AY4qQaZ1aGIulYlcT9hS1juSDOxQNfT5LNeNdpfJ3PjI0teAXeLX7ua0saV+o60WBZ9+vq7AiaJ/C5yWCAzYN05vTZ5vpDxPuXaSBitNCN+qxwPDub2C3evyT/v5DfE+L8x2Fju7WRrVaIr8FiQYTy8Ubt1yIPq1ou1l51ijp89izztmFkB5pm+/sqjA3JkXs28Jlnz9YJx6FiCwL9DYCMDN//xrLlc5qJlXSMFcIQhi4pF/7pOvp644/jYD1m/e2E+HrVGEQon83T2qbF0lKXPlGxnVaJdrbrpxTw7TvYMvPfV19lxBvicRHpp6oYj+v6I4w3ovZ+g/iFkQ87LdTiVt4yeeaZzeZ5o+qI877kN9Bs0QnCsPKLNlrj6xy4XojV/FKrCx3Ph3nlX9fLBm6vBwNIYDmc+KEA05mU81pEHmW6fvh+lmlE/DBMaZjTn2GJkAG3VyjLFetMJdQst7DY8/0SmWbEEm6uOj02tmVLWK8J9Z2QD2MFzy10mstNCsMYZnCwQX9ffXXt2ldfjUfuMYYnq2QlSWqYuE8izUaLAJvNGuKchkh2noe1U2cIZ3x/vhAUfWPCMQJe9Z37obq3ZWEhZTesRqofZoZdmmuv4AFd4HVv/9LS+4BD8L7699VXf/3XgeFwBP7ymcjwQFdWbPWR9jepV1K8ZWKhgWrgvNVKGDbEwHD5b0CjuY61ii5gHcY7tCrfvm772Nj2LQvbt388j/Udt/PY+2M67PlCjAyxxAp+9jNfeeXO23fcCUP/skjHI/CHz9SqRh3XlwnxN1vfND/caVagtcaTD4etPOFGtBCu4tnjSVifzFfRq0OvdVC/y8e2fA7o3W6rcDE2J4Y7HksviheymofcgbP12Qq3V/h92rbz58/TEfnet1dcPuqow1XVGsJnirQ86ijN37q4DpvyWIZIk7LlfAzxQSG6s64DL8Q6hkXqBVtFbTCseDtSl1YrlfRjaM7Ex/61raaiTp4/D018589fpG+ggjNjPUd0eLpqVUP6NVkDlxUlQxJWONGAXcw/W/ZY5lu25GPJBqYKC9Qf90jGf9ms9IMd1eFF6tJxvaud4Up5fKVyjs+vfs1DDz0EkPGbusnyfzS8A6sJtqaHfAd90d8YzhOGabYg1ittjmTOsN6Ug2WilYcObLQCsbAwU342/2zejGQSK90RHZ5Wm9XsShiEzgyKi2UVmfEy4irpFGhUPPV4qzWsBO+nPiWAz4a+hDJ2sNCxYXOFPFZxkbGPA6FIaofey/KzurbcieuuVtXqRB0GK435sK9ZOz9uxWrKAxjQ+dUPPfQa2B5afd46W+K6f2rrW3U9HHKmPdgUAJ8NEXQZpJbn2DLv5L0AZbBvWr3vNOye9e3kaecEW+lcGJ5O5xz5sTX7mvtuBC8DfggplqhMVxymK+9sQLRkquS+fDMdpa/dr+BmqP1GyQqqvSuqjts9x9uJ6+thdUOzJVgfRisd5BLnt+sO78ph1nRVnwG/hgFrTBavDWMIG2cjNWZgVOqoV+ZIV1yT9t54/NGIicPqmq6ah3woz8Pq3Io+D8uHpzmW9k405Ikax9KenmlhjwA/JAxrPBr6fQRxq9US1GuxbERFFFxCq9PeC5wjVTuSzhuYdatjzGKldjZGIUEeAl7h+G22wt5pdPFYpLXIiMWNEGYS4IQ1lVZFTDo8bA1aA8bWsjoHyDEp7tDqRGsHghebHKrU08DcuLUhdCqhWGIAoszOchpf5mGN3Cq8keFE2kOvTEl9mns8lm503lkOa9UKWNq13jpwwmql6+EAZJawDVsttMdVC+V4GOWaM87l2vvuEryNfgeRyk6uiPHsWddV7NnzFfQy1nR/eIZZh6s6eqa1SZ8ahshmyxgxeiVOKTl6Rls8RKW12tigtqwTisBoose57y7xktdckfZ2mH4KYk4ZZ01uL29kBzNhvaIM3aV5J7EVrsOU/1vXqMce3qmGzE6a3YI3jbS4asAZofnxkGHGuiDaZRBpNs/uYwDvFfcmNrpjyAkxIZidNTuNPXt53qxda09HGfugnN2cswdfH75wMT/q3XnEsCBi+wSxtPngwWTIPWJ/yMCrCmyjSYfrNN+9BjS4E2PrwLUhnm3y7/XrMlmRwutN6NPM2mpaYqPjKph3CaoWUxJUhdgzeGrqZKhjvOHZQ5Ru1eHEz1hfc8c8jcliTklyRwDnQd8v0kPsNU7AuzIbSzvxqEvd8aWZQ6MLOFojvir26dgaDVfGlgPPFkaXdWNtPuhds+qBJON3IFExbnIJbuDFlQpqFA+xmdjyo/rMA9e0ku7ShlQncddTla8wDhp9d4O42lov37Qc6qEhqqTYw6t2xvDKziX4btjqdMRmuP9VnU10FI9ecc1M7J/I4z3xquUJegYhRP9JLJH2T7P8DpRPlwqvEllNbNk/p2F0XedpT1LHOkx5fDjkeMOWZWfmwVasMcrvYQgzs6Kmxee6Dp9odg67RE+v5Hwydk7CkbXWNZ+ss6KdWraaQt0Io+s6yVXjALQf/shHPvLhD6uEd0J25rZtxXoqcUohTJkHTxf626xfmjvxpr1nX6PjOuQDio8Zvsn66sKaaO3rFcQ/LGA4w67feN4MLhJ7F7txDC7ncsIriOmOUHbGkWxqe2fK2CHv2MjTxZoBVQ28X/rE9InIZOWIq+kVvgrNtcnvINGDwLsgjhiTmug4LouXCV7yJog4YThnvBa7C8PXXGFV+hX2OidPZ3rs96TRTZvI7qAO+XFYRwjWKz0jPM+jfggCaGM47eDBJKJ0xCp9l8OsADU+rPHhUBOw0J0p7hDeK+61Jx0aXXfRiiUr7NZrCd203h2ePnvjcRe2Odcr84hQ/zIZDzybHMe1F+nDW4veacY7OcrLwZ9wTHF5UotqMgyIkULrl20825OHDi0RBDmaMLw2MHxT6lND91bs5lc/7Drq+qtxZax1ezQj/R1lOZixXp289GgJkAMCXCnnGOSiOhz6Zb0nOq1akiCInQAztifkw6bDbrcGam/VP/EDZVVVNzmLEWQquzwo+9d6Nwwz1eGprDzOnDbOkYnPkJ3lK2TV+iKS55l4Q0HgbxB6J9S0EHFVN62tSSjOlh4oS7owLW4O7F4MM/onr/DrNTMD4zfiZcwwyMFI/G/Z2TBmg3ZvZkKulFZT5LuSdACfujU/zNHSHbumQy93qMzDPPnpxCQG2TR+xFfRDXFdhz4+1oHlRlWT7st4Mssy4NXqs+dQEmnBN61W2fRC3vuSxOExj9K69IMpw/xU4MUYrhv8EOBN4+NHjtiZrr+N59S8R4ZaPeplwTt+dmYws6IHzxj2Xnh6P09woWI9bK1gWPU5L5v99HoH6d6BRD+oVUt8arYWEv3puUGdPisZe9vB9Nz16U8feeGIY5wcOePcxnVI6qCotQOdj5GhThj2JzJmgi1LanEMuWyVFx1J5a4ZlyQrD4QYkSQ5QH0xH1oZ45MjcwD4CHJM2DZNjoz84hz2QoOgJz2MlDPpuoaQzYZ6fKVMGy9lXCFKVxSGJNep7w0dw2XoKwjequNrSycsxqqaeWDSf+neqQK8I2fmkGHg9Qg+NwkH4MgZUOzxv/5Cun4xWPaVSephFUON4Ufp9fQQP2gPxEzSH2rYhpgmN3KlxnOL6SpLrjIdnkyLjAziGvHKOInxAp9zR44Qr0cA76YHNj0wB+Mu4j34q2DFB9zgSL8hzw5H26QjKwvewrMLWbl+/c3r188UovPD2NHQ4Dtgj1K+J/RangjchtXsFR6XhH7T+AsA74EHgM854vUXzxyZ3LRpEx85cxfy/kKIPt2uoXRrRuLPDif1Dp4lYrt5ffA35fqbn8Vx8/pihnsQZYUxzxv9TRep5eaNLp4LAXGIECPisNaEMgvwmE/jdZMegUGafaSuEo+lVn9ZsytfRrRsmOee5TevJ3DPIuY+bMUMHtmNAw8KlmFr5TNOwUfnyTqEZIfWaxn846C5jojHxeMCt2icGS/wGXhFynlv7syRF8CivWD6MUjiTslSQjmgE5/bh4kquN2MGf+HR4qif7hPkIW5Yb4izkgtmNRS7ByraRnDYWaxax+mTx4X7dERwst8TkZefW8OBR30G+/SII7ac+yk/hHnDboK4PKiPFz2GTOO3btnDoNS9/v9Eo6tt+fYWjE/Vm+MCZdXUzq2BuU1LX1eOomwPDBCuwSsHUHHC9rJeGFMyrvwusn2yKKdmRsffwERA+6gw4zXSx/wLTZNuwbf/Ozu7HCRFTiQURr9ol/gMfh7ONv97M0qqSTW1EUR+1cuz2M91LsMlOFvA8NPjh+JeON/pQCnPweWGGV5BOzyEeZ1k/DrvOoeSvwDrMxwAcdjsGP5SHgyfpy+dX4L5BeQEV7gExQYmC4OI7eFjLxgjkWRrU/GogxhOHhkY/hmAvzCt9EQvXAk1HECYrZLaH3vIt8LHJ8bhU34dV7nzvAe4aUr5kg2MB6jK8ECJNYBwq1Nd5FN97VwwosD2USUiJP3ioLuBG6A+GZZGw79qh5TJesXfuzo+u8yw0e+fde/RdPaHTTqrCBvjMuYm0Pfe+TF9osk2CnDc3PnYIhFE1VG2UCiyWuDBUjsP+JlocnzDPkF37P7MONCjH3G6Xt4L+C78jCarvU3Z+XNSb9qjFMRI/2m/1cSAO9/FYZf+DbGS6Bxm1CydUZwbFx4nDuzFhlkNoHjShQ56jBuT3Qn5Tjyq7IxqbYcrrT4HPgmvGwfcEbke4RHxVnIXsFanDHiomATvv7ZtF817YZI/xsB8Pvf3X1MGZ68A+OlI+hiQdnY61IMtcn5ci0FSs79gKEW/IG5uSAbJgeo1Ozj2OJP8hnwg+J7Asa+4rR3lWlEnpMJT/tVy7g2AfyySyvQk5fZ+vXf3f0/c2F4khkgszQyd4YyXYmNWU9TLZ1rn2t/r93t/n6XXr0n4P2JXq/3RG/SeJ8z2Zhz2ThDuoz2YhN66iMmA8Axwj1sUnzc9hgpD9VhJPpwloFvTvpV43/LBty5hC8MGwK13YeyQ8zw5JMPPMlxsGgdBVMaQwWGbbSfadeAkl+D3qDb6wLgXoPqFbIhuvxpCsETGcBLgAqB2WfAhlf3CDPhzqZAtvPDZdKvmpUaq2U5IdTwhV35sfwYA558ctOTEhkrJ3c1Yqi5M40N+O22aaPBeHvENfL+782GR9lwXRZPHWQgO/w4yy7jfGvgVXD2VbsJ7xQihhH6VT3qzDkULQ6jLxdXDhJxKGMdRrxPcmSsd7wRQ0WGlULgtt0mxMhz70N/4UMEme+D+eh45aT/pv474QzxRLy9dduXG4iLQqwW40fEfBfcD5PpzoBfNgc5nEuxWb88nKMSAN6CACO/EhmbfU1iqHPdc93vod6Oou6ea38CkCKP7dF2W3nuXap4YQQb7lIxGX9TuQ8yIFiI33e/+8tfLtxGFcVLxUvBSivDbL8o0sI9FF9R192o44XcQ7puKpsyhh8ghidT+xo97DPdZ0BrvwobvtewdbuDi8q0420ybBE4D/0mmniT3be+e9uXt5l/Im5fIllnhkWHM7VfcGyIp4F/3s3qWkI8pt5NrB0xzIBHv3/u+22zMmZfYwyFOCp41coocpogloF4R2HubRT6c+dAHvhl/tl+U5ktHofZ/y7M//Esk9kf55EVL2UvKWLBS7wmA7lGwMI3qmtxWG253TPaPyYMf2v0W+3/7Vp30RiqavMG+sqor+oh4q7gVdTwTXv0E6OfAIn/fX7h1uV4pPmbqryKozDEa2jA55cMLVtt4dXOnjLrpdqNcXfDh+knwJsxw/tGVQof4JzgIjFUW0aX/3a7jz76qFhqZ5rw4vBzu3SyxSPJb8pG884YN89+zcTErduOKzKPukSSlVveWJuzVmby73G3yj3vK8Mn2ifOff/c/3cww+36kUcI73ve855HewY8SnTbht4R53fTxQz+OdVNzRrWTGwGwM6b4i3WpNKsf/HMoVq8fkTssVnhOtze1/5vIJ9P0Kvb/Ra8/x94fQvjJ/SrbXopiEfe8Q5ADHh/BRALcGb4KsGLiJFlseFt0Wd9mV7fcO7c4zCVx7MUL8x5zcTx4wSYvzF+10z0nVnm1ux1qwgMR4tuGmBW+kT7QPcCWNkBGNmBRE4D2hNbrNpJEvoIjHYbcSJgA25nMN52wIv3DfQZ/j7Be+DXHt/7t2/5O/sfzxLfY3wC4Mu2HffY2QKwCXiPEq36D2PYUqvcjLsLw3uIdbh9gDBdZdZH7BHu9XpRWhXRKCMWghmwf9vQY7NnieTvveHKW/Ybr2qFRCzXbD5+45rj/p3EX2vWTNzqgLPEgoFMiz6E6My9GEmCxtKLwO8BjovJvxK7YI+Ra0ZsHghmCjpLSB7d+igeN10OHLNEkwVrs/+COEzB9vjX9t5wyy037C+KRPYEWcZGy/Jf5XjN5olbb+2nkhqw4R3w+Ax+KEYegPexqUMMGNAeMDxd8TbttjOMc1QkBJA43sqcAXDCgIIeZGBUNZl/71KntycME+AsWl6NmLM1f/whtNITsu3cubOYgA3uwwQcnkoR9wOH8skiUZVw/G7qrwFiYRgQd83HdDUP0ujJIsY2SfKvEGKX1a30Pdkyk3ixWXB/Hn3U9CMiFoaD58ic4WLNH/+9zduO/801MgDwNtphb5VF3YwMt5DhxHKpzVaGp0yHm1s3jRhxjlcJYKLYo2iRCbZlrL2jb+E3kYeuRyWuGQJ4SjSxcL76BBiQ3apjzc5t/E7GO8ua9kh0fWqYMBxrYaLDU48R4AOA+IDZFYqlyD73Asemn+yGFG+X8fZEfyXuiHjFhus5ihzwXomAFW8/VrIAMFL5sYnNE8c3T8DfnaC8mwnwZRSPWL6I7zvdDrfkdwRn3/w3YT40degxZfiAzh+ti7FG8wShDDI9isaKbTFqbRJTirUCvG9hzG234WoXdNv7c7c08bo97nPgAXxOHJ+Qcevx4wgYjHeWRow7f2anMizBh9lqwytR3CHR4ZNdQRysi3qmnlph18+t4m84Aml6rVHxSazDcnWUATp77y2pBpvfZJ1j2f3Y8Z+YMMS3Hv+JW/k+uOYSNgVckBKH3LnQqhjnz8EPd092LUJOMp+uR1TtgJixSARC57GFHm0gVuclePWMLhkswSvRc2CYdJhkd+L4r05sPj5BQg07v7pZrHRim/1aGMaw8KzV+yzbOcWIjeF9Ynd7YcPPQSg9rtDMYJSmf5Vw3dbISnDxtlXsgMkA6e8tt+xvh2xWc12NHDjw+NgEESzmmYwW5xTB6/i1wWa7hRYbjWJA+bD6YcA7qrMUm6u+ONhZc7Og6DFeJgvtUUeQ3HYjvqLzMcYi+6yRf0aTNvSYIxAyluVt/x3GGgZMTCc2ugh+GONpZ7gownoFAob8sDgmVnofZogi1cgtUqa2i4TSoxHaLm17/NjtJjoaYlKWEQ6yTKZHRX2nNN6ItkUjQQb8L1iWETAoL5hpC8Acb9BSrXsUAa8yTAPwFpItxdgXZ0/qqX5nazvapa7JLfsfj800kjTvLXfhUrlzfA3i3a+VCon8Y7ZLXAGyzcrwBAFWkZ7wnCIzG2dxcyuNR4KVVsTKcHtfkOheiJ09Dkn9qEdTZtH1fvU8Wukl8TPx+3OIV61VQJxE1Uzlxy4CGO4DJlOhdhuyhdawSGIOt9J05Pniec2HR/elmU03WCDN47umm7yfSLTeA5PwFC/vI78cX3m2IxUajf8I75qJNe+a+OC2/zTxrs3vmvgdAvw7Ex/c/MFbf3riXRP/+PjXAPe2ULlxnR5m4T6EtRo9pgwDv+CHg6VpIKYjq3ELnqud4DUNbauN75mtZ/TouRDwlTfs76YVOLPSgnjNxLZfev8/+a0/+LN//n4aCPj97/8tGL8Eb3/wZ4h327YVdat+K/FH/QQxffN80OFYr4pI/TP+P/esdo4DwzHOSuo9kWE0g8ywERxy2pThguog8BnrmL8rr8fpVRRfK/4dvMKai9VJhsEDN9akRKYjw/uCBO+FcQP+accY5ODBgzGvEH+baoD4MMspFH+Pc4vRLAAumvpWeIb7Ndgeh9rP44AVt8d1w2/6/4PuSMTMCtwPK1FWCfD1jH7Q4fY+i/wBq4+9e82jHLz66qsPejymWT7F3leJHEhYZvcizZXofPj1/VPKpM8lRh4WOSR1jRhX/Ctdc8gKlYsWEqyrbmr9sthL0Cer1WSY8N6igxAfJMQHr/4xQez1D0JwaTdUbjksk1gr1rs07mgTxVqNddvSQCxLh1msDDRWEkKtCvEOG+vIcVVC/5XngWPXYeGM8V7piA9efRDnevDq/wLbQZLcg7F+FWNkKWFyJDbaXZErsV+6cv+Urf0VRVwDNjZ9nWEqSysEYR2B/5LdU7weO4fhefHziZVmpm5Qgq9kwCTJxPDVvNft4i2IFXnD26N6D36+lO0Zi3S05GS3btjfTmS6IcMcT4RIpIBe6VgTKZJ8CbLgbBhXJ6L1jjYbbFbUYZHMKNEAWCW5q4B576BXL0Wy21K72qr2m45x7hzqZBCbgVDv5ygrC7aF9oLV7tuaXybd8IEvj0GLrNWaGkY9LYqkwhervIjYIi1luKHDAScOwvtjAXGT4ZhFUq6Uxml0nO1WkN24vh/uA34POY49d5isE8lfsFVDtwf8K/NwfD70v1jhA/CqDofsvWGlFaflhXILQq0dqyBYuhU9xX2tWiaxaduyJQA8FfRLbWuxovYKSU547rBo1LFaLaxFB3sgV80X81ynn4dv5vVepNkSbFdphPwW88PdbsocYeBbEPPetupqqHmNjoaKAr9fxecXEG3tn0rqzRF1otkE2J5ZsuOtotXCSHKYrJd5Xjgv9m5qHvDiNTtJQwCv6fCfPKK1jFHTQEEQ48bRNF/Sqoa531Er4/raUrcZn++V2KPwGCvp5XAbBjvJU2kthEox1XAY/FKjMg8oLWqdz+S+kbY4w3/yjn/5iCECmTR+UnRgLduh0qrrKlq6bY/6vtZ4uhpLG2zIlwAwzITmlfQjXaQnLXnuEID2h97dEzEH3S7mUYsBMNA7r4IiDKsOY+An2S3LpGpgWE0aFWsZ74Csm8klNGj/LWanOcaMiIVg4YHmS00avk4UaxXy3/1hwDj9+f4PRGz3b14q79n8fPBPzjBFWuZJPDwMTAIus5ZxDUlzhq2PmibA/lu8bml4e5JDUajVFX4Jn7XhJLUZQgWqyjr8GtbhecarY55sckGV6aj/8xTEoJ2Yjx7bezywwiP1iyif7RBHjQZr2W3ibY9uVby45iSV+HZkWKu+tGiIlpQB70S81g7bRNwCVQ3PHaJ+pj2JLLOkokXRWHkJOhx6Hpjh0S+M7rP5SnhoOiioTLZWn48VyBUWzOMOxYsdXFbnJoJZ0RDvz+xM2mHNn8KAVQTMf/r23GGWECyIyQYD4KRfD630vPU1WQR7TOvSgHc01M8pPBqFsvOo+VbFK8bDcsMUcVKJD4gvDRWivbpmWBjg0A5rawatvpZr+oXYDpLQeYuo+qSr80V/Ze7L8jOVIiaZlpUHlOh9gaOtiMDXFUgqE2vZbXnlvt1YLaceAcevFS2pfVANfj/pG+tw2g5rGd6wH7Nb8A4ScyYMo5j0L5LpiydOcu6CGT5kOiwhktsorTVLnJQA7sGzcKlMxzjEFk7NDyvaHoo0eqVQS07aYTWuiHm7ZE0UmxXzRYpw3qPQJPYg5TaNVq+lKw+ULXW9WtFOqxk812AtwQYNh+12q93qrlhb0oXTUA3rBhuNiLEM73XopB2WkLSGha/d4wayAFGiV/sC4vlYiQ92i2U/+vidxPCUMByz9TT61zm3grWU3GfYHgLiVqPbIXaoxbWMnvaLaK+Det3QDsv0DkPczzOeF7xZjB+T9fAs1DgKtuYBb6ZrLarDwO+BFd0psSqNlJq1lN5Z/GbY7Q57rVbskmh3fZ0ixtPujb27g4f74RZb5pjpM3/zU2mlx2KOFR1Zclfmw5qErbXY2tIoIm6si6Z16RbyI9aSMV3qq5/DYQ+sGGp16A3RGpavnHu1WhYPnSmKtFrodvtpj7BGUPPsZbyGkfY6NbrzdN01VAM4l9A+LcR7steT7hS3tcZwa8hzBWsZ+5iskxYEAGC3EXa3ZbXqJPaI3RNgq2d1sP61INUb0mJn6JkN7+C0p9KqnHPNUXmhEj2VeZ2jiOswhFd7LXmOW+OKGdta4hHwpvNN+zV8bWlIG9HtDI+mvonPXa+jaHFaOxw2enISHZ1PK9nJGiFF5YUjDtlEGm1nwUpjF4+vfnW5C+kR9cPDNndU9nqxq8eiCe9jE/xIN3wCIUfnBeBRI1q0dVn4u39FB6V6ab3Nq3SWI8wXoSqbNbpI5dvE5WZ3J2vIDT9MXilZEfX8tdttWVqfdDGFFRnDyn0BmlcOke42vcFvD2kjKYCjzrD34IRIoWmnU41O6xsUcUZ5uLu4O5MtRWwMH2hzn1ZzjRcxgW55hd29S7uB2OybRh3eUYzrTam3hr+mw8UPQNyoYQSrjOfsTHzsfMALaO/+PR13w6ewBmGxNNcsGxGi4EA62qHCTueBU0pyx5A9cGatFRNZtbhYjsGdD/sb62rZxfqvGp3eFIKHdaVs3qvXyOrv+UD81mmaNRi2zpMQQbS0IhW7s+C8S3klSbou27H7wzIHXSc1vnn90KpEhbQ+FN7d3ox/o42KWssVjABY78rdgV4huX+39uK5H+Y+rRArqPcF86ySiSlUqNrYytlFuislGw7+2LqcQh2kvYLhuMoQ7sJU9Lv92J2jMfaUX0sMK8cZMdz3Gr/6Yewt/UcipZ73obkJNcetzjzb5FAaCR0fbck02zHi8j7r0EXNy0ztLMsanf1J136KVxBb78bOKVq1QZmeZ+lYocPhyVSo8GTaxcN9Kt1YXW/ZSkqjaic4NBZN+0lHQ2+4W+/RVO75Gq7mpfqb9kHHyCnot2VRINrQIwsXz6se43dioafuzu6O/Zbkl4zhLtqtZ1cLH+A1W+h920nnka0mSQShi6Eyfyx2xqx4ZX025NDwnu1VDbbupaxIoo4si74oy9KOsz7p8pRzHNcsAHWWPi/BPS1Sl0aZhpk8u3o1z+sqjhwaz6t0GZXHTdzQRHlE6KNWO+wdAEntM0j0ldYvHfW3iIhN1qc0Cyq8TiWyAQRzNhVjsMRrqze2ujT3WnaJYQqRpFvrkZRhQeWItxImrOB4H7X7HbDR1AEQ+05HtbDfZRW2Fe3sB8YaWbRdtIzidVd92mN+PouIQ19AxO1rSwcY17OCF/OA2J1mXR1qp0J3k9ol9dRey2v3evrES+KvLKfayxlTZpZ2RU2mCD4au91jWB3xcn1gKjyPGGrV4UkQZ/gkRVrPdinmHUq+TkWe2Dc4avFHyG97kjkEJyV3qec1haSqIKPARbVCK8ixu6WfyqUxvDMTirNmZJIZw40opYir6ce817IrfhgijeGK/E9zW/CvHn+EjF5Wx2Ut2Hste9GOWx+X10BkDcJ9abC/SbeDcExFC8wUI17NGpXhqSzpFIi/FPulmWGU5l7Pn+sIFThEjPEExR/SnyUD82bCszVdH+0lNYUYt8qzI23sfmibT0r+SxaNbha6KwI4yQ5dbkP8kdRC4nNL+sxD94CyOeyFZ5YaDPN60VZfCeU8wrOF5NlEQbz1UfdLsXbLdxOF2p8w83XtIolBXIuzKY4jGxUdf+pyyp7eWslw6Ig/YDIde+j8eQbtk/QOcM/pu6mmd9NKmNQUkifb4rmIuJulT/HELpwkl0ozf/PToYYTPXrsAjEdPnQoeeahG592SPBar3P0pUlc4tcp17FLtZusztgzqdwNkOREcW04sdONqDpgDPbankRM8y799WPZoeCH97X56Ra22XSM9knD29RT3eZ1xn3hXPzL58uZdC5/e7In18pv2HXtfXLtvvaf3vLF/Qcw5it8w34qese/mNPxhjUpOsIbH8FN9qf07zE5Kr/H5/PvWSzdpl4tXH9A60UvYAHfT/JnWk/F73FNBuNQvIbOafP3mF+ejNe2bR+O95J/Y59cC7+z94sQbx2jKAhjXX5/nj5jnxGuB2GWoy9kCV9YY0adlOP0FBY+lyTH5Liey7/blz6t1avh7u+Du08vuP8H4N7bC78Dhg4cGN33BfkezoPv4J3PPQnnnMT3kydlnz7z7+g5J+nfGMV/Q/8t+o0Df3rDH37xP/efP4Z9kBjrAhe4/zyw/DwdA73DPPZY44XPIMHrEH0/9dhjj8nnQ3Q+7KfXHaPfg9fq1ZesfpmeefgCrZmqrJG88j6/0xkskyqZ8q5yLBLtOmDSrbI9alrh0r33n93yh/tRhp8niTPp6/OxYyK3QY5Zhum5OpX1x6Yeg+cKH/NjUyLhWeMX+8+/jIBfXv3eH5GBWC/BPuiXf0QGYv1/sIy8bdgQT4QAAAAASUVORK5CYII=';
  const WM_REGI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAACgCAMAAAAFBRFXAAADAFBMVEUAAAABAQECAgIDAwMEBAQFBQUGBgYHBwcICAgJCQkKCgoLCwsMDAwNDQ0ODg4PDw8QEBARERESEhITExMUFBQVFRUWFhYXFxcYGBgZGRkaGhobGxscHBwdHR0eHh4fHx8gICAhISEiIiIjIyMkJCQlJSUmJiYnJycoKCgpKSkqKiorKyssLCwtLS0uLi4vLy8wMDAxMTEyMjIzMzM0NDQ1NTU2NjY3Nzc4ODg5OTk6Ojo7Ozs8PDw9PT0+Pj4/Pz9AQEBBQUFCQkJDQ0NERERFRUVGRkZHR0dISEhJSUlKSkpLS0tMTExNTU1OTk5PT09QUFBRUVFSUlJTU1NUVFRVVVVWVlZXV1dYWFhZWVlaWlpbW1tcXFxdXV1eXl5fX19gYGBhYWFiYmJjY2NkZGRlZWVmZmZnZ2doaGhpaWlqampra2tsbGxtbW1ubm5vb29wcHBxcXFycnJzc3N0dHR1dXV2dnZ3d3d4eHh5eXl6enp7e3t8fHx9fX1+fn5/f3+AgICBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4ODh4eHi4uLj4+Pk5OTl5eXm5ubn5+fo6Ojp6enq6urr6+vs7Ozt7e3u7u7v7+/w8PDx8fHy8vLz8/P09PT19fX29vb39/f4+Pj5+fn6+vr7+/v8/Pz9/f3+/v7////isF19AAAB1UlEQVR42u3cbW6DMBREUS/MC5uFvYV5CVVVtWkhFGJMbDx3/oGIlAP+eMhAKj0T708qxYsMeHZxd3ABDJg+DJhpaViwW6XlVlqGGTgAzw0OwIDpw4ABAwYMGDDz8I29/cDhBY7wAocZOLzAEV7gADw3OAADpg8DZh4GPFRpCRgwYAYtwBQegLl5AAwYMGBGaQoPx5uHYgf2Wz3sKGZBnEceeKgFMM9pcYUBAwYMGDBgCo87vV0qabVDq52zvD8sLXnSet88b4jrTxabZ8UDfgNAe5nrKw86knqvasD5MxeBpUvFqgKXLW/Viajx1opVCS5580ycu8R6IY/fvOKtBH+16ic51aZVn8Pe6ibdzKtGOcatbtK7eTtY/5cvPxuNm3Q/75K8dVDKzS9uL+9v8fYxqZWxxqvm2R/9Umkv7uc9kHToX+bTGQ7culWP6v0Gt+/Hg3ofTfrKFDfw0wCeHZwBAwYMmFEa8DBgmYHlBZa8wDIDywsseYEFeG6wANOkATMtAR670gJMLQ0YMGAGLcAUHoABc7fEFQbMtGRZWtottfgtpvktlxouiPMkngE424EzYMCAGbQAAwYMGDDTEuD7iPuCsx0424Ez4NnBGTBg+vCZfAA0Ld/zdJjdIwAAAABJRU5ErkJggg==';
  const WM_PATH = [[12,150],[13,149],[15,148],[16,148],[17,147],[18,146],[19,146],[20,145],[21,144],[22,144],[24,143],[25,142],[26,141],[27,141],[28,140],[29,139],[30,138],[31,138],[32,137],[33,136],[34,135],[35,134],[36,133],[37,132],[38,131],[39,131],[40,130],[41,129],[42,129],[43,128],[44,128],[45,128],[46,128],[48,128],[49,128],[50,128],[52,128],[53,129],[54,129],[56,129],[57,130],[59,130],[60,131],[62,131],[63,131],[65,132],[66,132],[68,132],[69,133],[71,133],[72,133],[74,133],[75,134],[77,134],[79,134],[80,135],[82,135],[84,135],[85,135],[87,135],[89,136],[90,136],[92,136],[94,136],[96,136],[97,136],[99,136],[101,136],[103,136],[105,136],[107,136],[109,136],[111,136],[113,136],[114,136],[116,136],[118,136],[119,136],[121,136],[122,136],[124,136],[125,136],[127,135],[128,135],[129,135],[130,135],[132,134],[133,134],[134,134],[135,134],[136,133],[137,133],[138,133],[139,132],[140,132],[142,131],[143,131],[145,130],[146,129],[148,128],[149,127],[151,127],[152,126],[153,125],[155,125],[156,124],[157,124],[158,123],[160,123],[162,122],[163,122],[164,122],[165,122],[167,122],[168,121],[170,121],[171,121],[173,121],[175,121],[177,120],[179,120],[181,120],[182,120],[184,120],[186,119],[187,119],[189,118],[190,118],[191,117],[192,117],[194,116],[195,116],[196,115],[197,114],[198,113],[199,113],[200,112],[201,111],[201,110],[202,109],[203,108],[204,107],[204,105],[204,103],[204,102],[204,100],[203,98],[202,96],[201,94],[200,93],[200,91],[199,90],[198,88],[198,87],[197,85],[196,84],[195,83],[194,82],[193,80],[192,79],[191,78],[190,77],[189,76],[188,75],[186,74],[185,73],[183,71],[182,71],[181,70],[180,70],[179,69],[178,68],[177,68],[176,67],[175,67],[174,66],[173,65],[172,65],[171,64],[170,63],[169,63],[168,62],[167,61],[166,61],[165,60],[164,59],[163,58],[162,58],[162,57],[161,56],[160,55],[159,54],[158,54],[157,53],[156,52],[156,51],[155,51],[154,50],[153,49],[152,47],[151,46],[150,44],[149,43],[148,42],[146,41],[145,40],[144,40],[143,40],[141,39],[139,39],[137,38],[135,38],[132,38],[130,37],[128,37],[125,37],[123,37],[121,36],[119,36],[117,36],[115,36],[113,36],[112,36],[111,36],[109,36],[108,37],[108,39],[108,40],[107,41],[106,42],[104,43],[103,43],[102,44],[101,45],[100,45],[98,46],[97,46],[96,47],[94,47],[93,48],[91,49],[90,49],[89,49],[87,50],[86,50],[85,50],[83,50],[82,51],[81,51],[79,51],[78,51],[77,51],[75,51],[74,51],[73,50],[72,50],[70,50],[69,50],[68,50],[67,50],[65,50],[63,50],[62,49],[60,49],[59,49],[58,49],[57,48]]; // 길 픽셀 [x, y] 순서대로 (시작 → 1 → 2 → 3 → 4)
  const WM_FORGE = { 2: 90, 3: 156, 4: 221 }; // v1.89 2~4장 출발점 = 앞 장 끝의 출장 대장간 (길 번호)
  const WM_NODE = {"1":[44,128,30],"2":[164,122,111],"3":[168,62,181],"4":[56,48,266]}; // 스테이지 → [x, y, 길 번호]
  const WM_W = 240, WM_H = 160, WM_S = 2, WM_X = (VW - WM_W * WM_S) / 2, WM_Y = 4, WM_T = 6.0; // v1.70 4.4→7초 (사용자 요청: 더 길게) · v1.89 7→6초
  const WM = { ready: false, base: null, dim: {}, edge: {} };
  (function wmLoad() {
    const a = new Image(), b = new Image(); let n = 0;
    const done = () => { if (++n === 2) { try { wmBuild(a, b); } catch (err) { console.error(err); } } };
    a.onload = done; b.onload = done; a.src = WM_IMG; b.src = WM_REGI;
  })();
  function wmBuild(a, b) {
    const w = WM_W, h = WM_H, cv0 = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const cb = cv0(), xb = cb.getContext('2d'); xb.drawImage(a, 0, 0);
    const px = xb.getImageData(0, 0, w, h).data;
    const cr = cv0(), xr = cr.getContext('2d'); xr.drawImage(b, 0, 0);
    const rd = xr.getImageData(0, 0, w, h).data, reg = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) reg[i] = Math.round(rd[i * 4] / 60);
    const frame = (x, y) => x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
    for (let k = 1; k <= 4; k++) {
      const cd = cv0(), xd = cd.getContext('2d'), id = xd.createImageData(w, h), D = id.data;
      const ce = cv0(), xe = ce.getContext('2d'), ie = xe.createImageData(w, h), E = ie.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, o = i * 4;
        if (frame(x, y)) continue;
        if (reg[i] !== k) { // 다른 지역: 채도를 빼고 푸르스름하게 어둡게
          const l = px[o] * 0.3 + px[o + 1] * 0.59 + px[o + 2] * 0.11;
          D[o] = l * 0.38 + px[o] * 0.06; D[o + 1] = l * 0.38 + px[o + 1] * 0.06; D[o + 2] = l * 0.46 + px[o + 2] * 0.08; D[o + 3] = 255;
        } else { // 이번 지역의 가장자리 = 금빛 테두리
          let edge = false;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 2 && ny >= 2 && nx < w - 2 && ny < h - 2 && reg[ny * w + nx] !== k) edge = true; }
          if (edge) { E[o] = 255; E[o + 1] = 214; E[o + 2] = 120; E[o + 3] = 255; }
        }
      }
      xd.putImageData(id, 0, 0); xe.putImageData(ie, 0, 0);
      WM.dim[k] = cd; WM.edge[k] = ce;
    }
    WM.base = cb; WM.ready = true;
  }
  function wmStart() {
    if (!WM.ready || !WM_NODE[G.stage]) return false;
    G.wm = { t: 0, s: G.stage, arrived: false };
    { const sk = $('wmSkip'); if (sk && !sk.wired) { sk.wired = true; sk.addEventListener('click', () => { if (G && G.wm) G.wm.skipClick = true; }); } }
    mode = 'wmap';
    for (const k in pressed) pressed[k] = false;
    return true;
  }
  function wmEnd() {
    G.wm = null; G.wmHome = null; { const ft = $('wmFoot'); if (ft) ft.classList.remove('on'); }
    for (const k in pressed) pressed[k] = false;
    if (CA.isRoom()) CA.greet(); else showStageParchment(G.stage, G.cls); // v2.52 왕도 성문 앞에서는 진입 문구를 성문이 열린 뒤로
  }
  function updateWorldIntro(dt) {
    const m = G.wm; if (!m) { mode = 'play'; return; }
    m.t += dt;
    // v2.56 F 키로 진행: 그리는 중이든 다 그린 뒤든 F 한 번이면 넘어감, 누르지 않으면 다 그린 뒤 기다린다 (터치는 탭) · ESC·「건너뛰기」 클릭도 같음
    const HOLD = WM_T - 0.7, go = () => take('f') || take('escape') || m.skipClick || (TOUCH.on && (take(' ') || take('enter') || take('j') || take('k')));
    { const ft = $('wmFoot'), on = !m.go && m.t >= 1.95; if (ft && ft.classList.contains('on') !== on) ft.classList.toggle('on', on); } // v2.56 지역 이름·설명이 다 나온 뒤 「F 건너뛰기」
    if (!m.go) {
      if (m.t > 0.5 && go()) { m.t = Math.max(m.t, HOLD); m.go = true; m.arrived = m.trace = true; sfx('select'); } // v2.56 F 한 번이면 언제든 바로 넘어감
      if (!m.go && m.t > HOLD) { m.t = HOLD; m.wait = (m.wait || 0) + dt; }
    }
    if (!m.trace && m.t >= 0.9) { m.trace = true; sfx('blip', 0.8); }
    if (!m.arrived && m.t >= 2.1) { m.arrived = true; sfx('select'); }
    if (m.t >= WM_T) wmEnd();
  }
  const wmStep = (v, n = 4) => Math.floor(clamp(v, 0, 1) * n) / n; // 페이드도 계단식(도트 느낌)
  function drawWorldIntro() {
    const m = G.wm; if (!m || !WM.ready) return;
    const t = m.t, s = m.s, S = WM_S, X0 = WM_X, Y0 = WM_Y;
    const A = t < 0.35 ? wmStep(t / 0.35) : t > WM_T - 0.7 ? wmStep((WM_T - t) / 0.7) : 1;
    if (A <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = A;
    ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, VW, VH);
    ctx.drawImage(WM.base, X0, Y0, WM_W * S, WM_H * S);
    // 다른 지역 어둡게
    const dA = wmStep((t - 0.45) / 0.4);
    if (dA > 0) { ctx.globalAlpha = A * dA; ctx.drawImage(WM.dim[s], X0, Y0, WM_W * S, WM_H * S); ctx.globalAlpha = A; }
    const P = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(X0 + x * S, Y0 + y * S, S, S); };
    // 지나온 길 (금빛) — 이번 구간은 이어 그어짐
    const i0 = s > 1 ? (WM_FORGE[s] != null ? WM_FORGE[s] : WM_NODE[s - 1][2]) : 0, i1 = WM_NODE[s][2];
    const tp = clamp((t - 0.9) / 1.2, 0, 1), ep = 1 - (1 - tp) * (1 - tp);
    const pre = (s === 1 && G.wmHome && HOME.wmPath(G.wmHome)) || [], tot = pre.length + (i1 - i0), cT = Math.round(tot * ep); // v2.55 시작 장소에서 출발하는 짧은 길
    const cur = i0 + Math.max(0, cT - pre.length);
    if (pre.length) { const [hx, hy] = pre[0]; for (const [dx, dy, c] of [[0, -2, '#c8a050'], [-1, -1, '#c8a050'], [1, -1, '#c8a050'], [-1, 0, '#8a6a3a'], [0, 0, '#100c08'], [1, 0, '#8a6a3a']]) P(hx + dx, hy + dy, c); // 시작 장소 표시 (작은 지붕)
      for (let i = 1; i < Math.min(cT, pre.length); i++) if (i % 4 !== 3) P(pre[i][0], pre[i][1], '#ffd86a'); }
    if (cT >= pre.length) for (let i = 0; i <= cur; i++) { if (i % 4 === 3) continue; const [x, y] = WM_PATH[i]; P(x, y, i <= i0 ? '#b08a3a' : '#ffd86a'); }
    // 지나온 노드는 붉은 X 표시
    for (let k = 1; k < s; k++) { const [x, y] = WM_NODE[k]; for (let d = -2; d <= 2; d++) { P(x + d, y + d, '#c83a2a'); P(x + d, y - d, '#c83a2a'); } }
    // 지역 테두리 (깜빡이다 고정)
    if (t > 1.0 && (t > 2.6 || Math.floor(t * 6) % 2 === 0)) ctx.drawImage(WM.edge[s], X0, Y0, WM_W * S, WM_H * S);
    // 원정대 깃발 (길 끝을 따라 이동, 2칸씩 통통)
    { const [x, y] = cT < pre.length ? pre[Math.max(0, cT)] : WM_PATH[cur], bob = m.arrived ? (Math.floor(t * 3) % 2) : 0;
      const FL = ['.kkk.', 'kyyyk', 'kyrrk', 'kyyk.', 'kp...', 'kp...', 'kp...'];
      const FC = { k: '#100c08', y: '#e8c060', r: '#a8302a', p: '#6a4a2a' };
      FL.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (FC[row[i]]) P(x - 1 + i, y - 12 + j - bob, FC[row[i]]); }); }
    // 노드 고리 (도착 후 퍼지는 도트 고리)
    if (m.arrived) {
      const [nx, ny] = WM_NODE[s], ph = ((t - 2.1) * 1.2) % 1, r = 8 + Math.floor(ph * 4) * 2;
      const seen = new Set(), col = ph < 0.5 ? '#ffe7a0' : '#c8a050';
      for (let a = 0; a < 64; a++) { const x = Math.round(nx + Math.cos(a / 64 * Math.PI * 2) * r), y = Math.round(ny + Math.sin(a / 64 * Math.PI * 2) * r * 0.8), key = x * 999 + y; if (!seen.has(key)) { seen.add(key); P(x, y, col); } }
    }
    // v3.84 네 지역을 묶은 이름(영원한 어둠의 땅) 띠는 월드맵에서 뺌
    // 챕터 이름 패찰
    const pA = wmStep((t - 1.6) / 0.35);
    if (pA > 0) {
      ctx.globalAlpha = A * pA;
      const st = STAGES[s], pw = 400, ph = 74, px0 = Math.round((VW - pw) / 2), py0 = Y0 + WM_H * S + 8;
      ctx.fillStyle = '#0c0908'; ctx.fillRect(px0 - 2, py0 - 2, pw + 4, ph + 4);
      ctx.fillStyle = '#6a4c2a'; ctx.fillRect(px0, py0, pw, ph);
      ctx.fillStyle = '#1e140e'; ctx.fillRect(px0 + 2, py0 + 2, pw - 4, ph - 4);
      ctx.fillStyle = '#c8a050'; for (const [cx, cy] of [[px0, py0], [px0 + pw - 6, py0], [px0, py0 + ph - 6], [px0 + pw - 6, py0 + ph - 6]]) { ctx.fillRect(cx, cy, 6, 2); ctx.fillRect(cx, cy, 2, 6); ctx.fillRect(cx + 4, cy, 2, 6); ctx.fillRect(cx, cy + 4, 6, 2); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const tx = VW / 2, tl = (txt, y, font, c) => { ctx.font = font; ctx.fillStyle = '#000'; ctx.fillText(txt, tx + 2, y + 2); ctx.fillStyle = c; ctx.fillText(txt, tx, y); };
      tl(`STAGE ${s}${G.asc ? ' · 잿불 ' + G.asc : ''}`, py0 + 20, '16px Galmuri7', G.asc ? '#ffb040' : '#c8a050');
      tl(st.n, py0 + 46, '24px Galmuri11', '#f4e6bc');
      tl(st.sub, py0 + 66, '10px Galmuri9', '#a89a84');
    }
    ctx.globalAlpha = A;
    ctx.restore();
  }
  function drawTransition() {
    const tr = G && G.trans; if (!tr) return;
    const a = tr.phase === 'out' ? tr.t / tr.dur : 1 - tr.t / tr.dur;
    ctx.fillStyle = `rgba(0,0,0,${clamp(a, 0, 1)})`; ctx.fillRect(0, 0, VW, VH);
  }

  function startPhase(p) {
    window.AudioSys.setMood(stageMood(p === 11 ? 'Boss' : p === 5 ? 'Rest' : p === 10 ? 'Survive' : ''), true);
    G.phase = p; G.enemies = []; G.tele = []; G.hazards = []; G.proj = []; G.eproj = []; G.bonfire = null; G.vortex = null; G.boss = null;
    G.waveIdx = 0; G.spawning = 0; G.phaseT = 0; G.surviveT = 0; G.spawnT = 0; G.hazardT = 2;
    G.phaseState = 'intro';
    const P = G.player; P.state = 'idle'; P.dead = false; P.hp = Math.max(P.hp, 1);
    if (p === 11) { banner(STG().boss, STG().bossSub); $('bossName').textContent = STG().boss; sfx('boss'); G.bossTime = 300; }
    else banner(`STAGE ${G.stage} · PHASE ${p}`, p === 1 ? `${STG().n} — ${phaseLabel(p)}` : phaseLabel(p));
    if (p === 5) { G.bonfire = { x: clamp(P.x + 40, A.x0 + 30, A.x1 - 30), y: clamp(P.y - 20, A.y0 + 30, A.y1 - 30) }; P.hp = G.stats.hp; }
  }
  function phaseScale() { const p = Math.min(G.phase, 10); return { hp: 1 + 0.07 * (p - 1), atk: 1 + 0.05 * (p - 1) }; }

  function spawnPoint() {
    // 65%는 벽 가장자리·문 쪽에서 몰려 들어오고, 나머지는 방 안 빈자리. 플레이어와는 적당히 떨어진 곳
    const P = G.player, dmin = clamp(Math.min(A.x1 - A.x0, A.y1 - A.y0) * 0.45, 90, 200), obs = G.obs || [];
    const doors = G.dun && G.dun.cur ? Object.keys(G.dun.cur.doors).filter(d => G.dun.cur.doors[d] != null) : [];
    let best = null, bd = -1;
    for (let i = 0; i < 60; i++) {
      let x, y;
      const r = Math.random();
      if (r < 0.25 && doors.length) { const q = doorIn(pick(doors), 30); x = q.x + rand(-24, 24); y = q.y + rand(-14, 14); }
      else if (r < 0.65) { const side = randi(0, 3); x = side === 0 ? A.x0 + 24 : side === 1 ? A.x1 - 24 : rand(A.x0 + 24, A.x1 - 24); y = side === 2 ? A.y0 + 24 : side === 3 ? A.y1 - 24 : rand(A.y0 + 24, A.y1 - 24); }
      else { x = rand(A.x0 + 22, A.x1 - 22); y = rand(A.y0 + 22, A.y1 - 22); }
      x = clamp(x, A.x0 + 18, A.x1 - 18); y = clamp(y, A.y0 + 18, A.y1 - 18);
      if (obsHitL(obs, x, y, 18)) continue;
      const d = Math.hypot(x - P.x, y - P.y);
      if (d >= dmin && d < 480) return { x, y };
      if (d > bd) { bd = d; best = { x, y }; }
    }
    return best || freePoint(CX, CY);
  }
  function queueSpawn(type, at) {
    const pt = at || spawnPoint();
    G.spawning++;
    G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: isEliteT(type) ? 16 : type === 'bigslime' ? 13 : 10, t: 0, dur: 0.7, owner: null, onFire: () => { G.spawning--; G.enemies.push(makeEnemy(type, pt.x, pt.y)); burst(pt.x, pt.y - 6, '#2a1830', 10); } });
  }
  function spawnWave(w) { for (const [type, n] of w) for (let i = 0; i < n; i++) queueSpawn(type); const R = G.dun && G.dun.cur; if (ascOn(4) && w.length && R && (R.type === 'combat' || R.type === 'survive' || R.type === 'elite')) queueSpawn(w[0][0]); } // v1.96 무리: 웨이브마다 +1

  function updatePhase(dt) {
    G.phaseT += dt;
    const p = G.phase, alive = G.enemies.filter(e => !e.dead).length;
    if (G.phaseState === 'intro') {
      if (G.phaseT > 1.4) {
        G.phaseState = 'run'; G.phaseT = 0;
        if (STG().phases[p]) spawnWave(STG().phases[p][0]);
        if (p === 5) setTimeout(() => { if (G && G.phase === 5 && mode === 'play') openRest(); }, 900);
        if (p === 11) { if (G.stage === 1) spawnSlimeKing(); else if (G.stage === 3) spawnKrugash(); else if (G.stage === 4) spawnAshKing(); else spawnBoss(); }
      }
      return;
    }
    if (G.phaseState !== 'run') return;
    const PH = STG().phases;
    if (PH[p]) {
      if (alive === 0 && G.spawning === 0) {
        G.waveIdx++;
        if (G.waveIdx < PH[p].length) spawnWave(PH[p][G.waveIdx]);
        else phaseClear();
      }
    } else if (p === 10) {
      G.surviveT += dt;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && alive + G.spawning < STG().surviveMax) { G.spawnT = G.stage === 1 ? 1.7 : 1.35; let r = Math.random(); for (const [t, w] of STG().survive) { if (r < w) { queueSpawn(t); break; } r -= w; } }
      if (G.surviveT >= 60) {
        G.enemies.forEach(e => { if (!e.dead) killEnemy(e, true); });
        G.tele = [];
        phaseClear();
      }
    }
  }
  function phaseClear() {
    G.phaseState = 'clear'; G.phaseT = 0;
    banner('PHASE CLEAR', G.phase === 10 ? '무언가 다가온다…' : '');
    setTimeout(() => { if (G && mode === 'play' && G.phaseState === 'clear') startPhase(G.phase + 1); }, 1600);
  }

  // ---------------------------------------------------------------- 무기 휘두르기 (공용)
  // 적·보스 무기: bladeAng를 목표 각도로 따라가고, swing이 있으면 빠르게 휘두르며 잔상을 남긴다
  function startSwing(e, toAng, side, dur) {
    let d = angDiff(toAng, e.bladeAng);
    if (side > 0 && d < 0) d += TAU; if (side < 0 && d > 0) d -= TAU;
    e.sw = { from: e.bladeAng, d, t: 0, dur };
  }
  function updateBlade(e, dt) {
    if (e.sw) {
      e.sw.t += dt;
      e.bladeAng = e.sw.from + e.sw.d * easeOut(e.sw.t / e.sw.dur);
      e.trail.push({ a: e.bladeAng, t: 0.11 });
      if (e.sw.t >= e.sw.dur) e.sw = null;
    } else e.bladeAng = lerpAng(e.bladeAng, e.bladeTarget, dt * 9);
    for (const s of e.trail) s.t -= dt;
    e.trail = e.trail.filter(s => s.t > 0);
  }
;
