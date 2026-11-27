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
    if (['shrine', 'shop', 'rest', 'reward', 'secret'].includes(R.type)) return; // v3.25 특수방(빛의 방 · 상점 · 비스트로 · 보물 방 · 비밀 방)은 바닥 집기 · 환경 장식 없음 (사용자 결정)
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

  // ================================================================ 1스테이지: 황혼 초원 — 슬라임 · 고블린 · 점액왕
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
        const ix = X + 6 + lk[0] * 2, iy = Y + 4; // 홍채 3칸(가장자리 짙게) · 가운데 동공 · 왼쪽 위 흰 반사점
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
    const crY = Math.round(by - h - 8 + Math.max(0, -(e.jy || 0)) * 6) & ~1, crX = Math.round(cx - 10 + e.face * 2 + lx) & ~1;
    gPaint(ctx, CROWN_G || (CROWN_G = gOutline(fromRows(['y...yy...y', 'yy.yyyy.yy', 'YyyyyrryyY', 'YYYYYYYYYY']))), { y: '#e8c060', Y: '#a8822e', r: '#b01c22', k: '#0b0a0e' }, crX, crY);
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
    1: { n: '황혼 초원', sub: '재가 서리처럼 내려앉은 변경의 들판', diff: 1, hpMul: 1.15, atkMul: 1.45, dark: 0.34, ash: '205,240,120', torches: false,
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
