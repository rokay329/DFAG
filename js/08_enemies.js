'use strict';
// 잿빛 왕관 토벌대 — 08_enemies.js : 무기 휘두르기, 적 공통, 난입자 1~4장, 적 상태 효과, 발도르, 잿빛 왕, 판정
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ---------------------------------------------------------------- 적
  function makeEnemy(type, x, y) {
    const sc = Object.assign({}, phaseScale());
    const base = {
      ghoul: { hp: 60, atk: 10, def: 20, spd: 46, r: 7, kb: 1, blade: 'squire' },
      exec: { hp: 420, atk: 19, def: 60, spd: 38, r: 12, kb: 0.25, grogiMax: 60, blade: 'headsman' }, mordred: { hp: 500, atk: 20, def: 70, spd: 40, r: 13, kb: 0.2, grogiMax: 70, blade: 'royal' }, queen: { hp: 400, atk: 17, def: 40, spd: 36, r: 11, kb: 0.3, grogiMax: 55 }, bearer: { hp: 400, atk: 18, def: 55, spd: 38, r: 11, kb: 0.25, grogiMax: 60, blade: 'pole' }, flag: { hp: 90, atk: 0, def: 0, spd: 0, r: 9, kb: 0 },
      dog: { hp: 42, atk: 12, def: 10, spd: 70, r: 7, kb: 1 },
      butcher: { hp: 380, atk: 22, def: 60, spd: 34, r: 12, kb: 0.25, grogiMax: 60 },
      ghost: { hp: 230, atk: 15, def: 40, spd: 56, r: 8, kb: 0.6 },
      cultist: { hp: 45, atk: 12, def: 10, spd: 40, r: 7, kb: 1 },
      bloat: { hp: 70, atk: 20, def: 5, spd: 30, r: 9, kb: 0.5 },
      slime: { hp: 34, atk: 7, def: 5, spd: 95, r: 7, kb: 1.2 },
      bigslime: { hp: 100, atk: 11, def: 10, spd: 80, r: 11, kb: 0.6 },
      goblin: { hp: 44, atk: 8, def: 10, spd: 58, r: 7, kb: 1 },
      gthrower: { hp: 36, atk: 9, def: 5, spd: 46, r: 7, kb: 1 },
      hob: { hp: 300, atk: 16, def: 45, spd: 36, r: 12, kb: 0.3, grogiMax: 55 },
      garcher: { hp: 36, atk: 9, def: 5, spd: 46, r: 7, kb: 1 },
      weasel: { hp: 560, atk: 12, def: 30, spd: 84, r: 7, kb: 0.35, grogiMax: 45 }, // v1.65 난입자 4장
      shrewA: { hp: 300, atk: 11, def: 20, spd: 86, r: 6, kb: 0.4, grogiMax: 30 }, shrewB: { hp: 300, atk: 11, def: 20, spd: 86, r: 6, kb: 0.4, grogiMax: 30 }, // v1.63 난입자 3장 (둘이 함께)
      reaper: { hp: 520, atk: 14, def: 30, spd: 72, r: 7, kb: 0.3, grogiMax: 45 }, // v1.59 난입자 2장
      panda: { hp: 440, atk: 10, def: 20, spd: 78, r: 7, kb: 0.35, grogiMax: 40 }, // v1.57 난입자 1장 · v2.40 체력 552 → 440
      toxslime: { hp: 40, atk: 7, def: 5, spd: 80, r: 8, kb: 1 },
      gbrute: { hp: 340, atk: 17, def: 45, spd: 34, r: 13, kb: 0.25, grogiMax: 60 },
      boar: { hp: 300, atk: 18, def: 35, spd: 52, r: 12, kb: 0.3, grogiMax: 55 },
      crow: { hp: 24, atk: 9, def: 0, spd: 105, r: 6, kb: 1.5 },
      mother: { hp: 440, atk: 20, def: 50, spd: 24, r: 14, kb: 0.2, grogiMax: 65 },
      orc: { hp: 85, atk: 14, def: 25, spd: 50, r: 8, kb: 0.9 }, othrow: { hp: 55, atk: 13, def: 10, spd: 42, r: 8, kb: 1 }, wolf: { hp: 60, atk: 13, def: 10, spd: 85, r: 7, kb: 1 },
      shaman: { hp: 60, atk: 11, def: 15, spd: 38, r: 8, kb: 1 }, slave: { hp: 30, atk: 7, def: 5, spd: 72, r: 6, kb: 1.2 },
      ocharge: { hp: 240, atk: 20, def: 35, spd: 46, r: 10, kb: 0.5, grogiMax: 30 }, odrum: { hp: 200, atk: 16, def: 30, spd: 34, r: 11, kb: 0.5, grogiMax: 30 }, otroll: { hp: 320, atk: 21, def: 40, spd: 42, r: 12, kb: 0.4, grogiMax: 30 }, ogrip: { hp: 290, atk: 22, def: 45, spd: 38, r: 11, kb: 0.5, grogiMax: 30 },
      husk: { hp: 70, atk: 11, def: 20, spd: 38, r: 7, kb: 0.9 }, moth: { hp: 22, atk: 8, def: 0, spd: 115, r: 6, kb: 1.5 }, lancer: { hp: 90, atk: 16, def: 30, spd: 58, r: 8, kb: 0.7 },
      cantor: { hp: 50, atk: 14, def: 10, spd: 40, r: 7, kb: 1 }, aguard: { hp: 110, atk: 15, def: 45, spd: 42, r: 8, kb: 0.6 },
      coffin: { hp: 300, atk: 20, def: 45, spd: 32, r: 12, kb: 0.3, grogiMax: 35 }, herald: { hp: 140, atk: 8, def: 20, spd: 50, r: 8, kb: 0.8, grogiMax: 25 },
      urg: { hp: 620, atk: 24, def: 60, spd: 40, r: 18, kb: 0.15, grogiMax: 75 }, troll: { hp: 580, atk: 22, def: 50, spd: 36, r: 20, kb: 0.15, grogiMax: 80 },
    }[type];
    const kind = type === 'hob' ? 'hob' : null;
    if (type === 'hob') type = 'butcher';
    const SM = STG(); sc.hp *= SM.hpMul * ASCF.eHp(); sc.atk *= SM.atkMul * ASCF.eAtk(); // v1.96 잿불 단계
    const ne = {
      type, kind, x, y, z: 0, squash: 0, r: base.r, hp: base.hp * sc.hp, maxHp: base.hp * sc.hp, atk: base.atk * sc.atk, def: base.def, spd: base.spd, kbRes: base.kb,
      state: 'chase', t: 0, cd: rand(0.4, 1.2), vx: 0, vy: 0, flash: 0, dead: false, face: 1, lockAng: 0, hitPlayer: false,
      grogiMax: (isEliteT(type) && !INVADER_T.has(type)) || SEMI_T.has(type) ? 0 : base.grogiMax || 0, grogi: 0, grogiT: 0, pat: 0, walk: rand(0, 6), lean: 0, /* 엘리트·준엘리트는 그로기 없음 (난입자는 그로기 있음) */
      blade: base.blade || null, bladeAng: 120 * DEG, bladeTarget: 120 * DEG, trail: [], sw: null, rise: 0.35,
    };
    if (NM_SMALL[ne.type]) ne.r = Math.min(ne.r, NM_SMALL[ne.type]); // v2.44 새 도트(파티와 같은 크기)에 맞춘 몸 반경
    if (ASH_ALIAS[ne.type]) { ne.ash = ne.type; ne.type = ASH_ALIAS[ne.type]; if (ne.ash === 'husk') { ne.sq = false; ne.blade = null; } } // v1.24 왕도 몬스터: 움직임은 원래 종을 빌린다
    if (ASH_NAMES[ne.type]) { ne.semiName = ASH_NAMES[ne.type]; ne.tall = ne.type === 'coffin' ? 70 : 76; /* v1.29 기수는 깃발 위로 이름표 */ }
    if (type === 'ghoul') { ne.sq = Math.random() < 0.5; if (ne.sq) ne.sv = randi(0, 2); else ne.blade = null; } // v0.96: 감염된 주민과 타락한 종자 반반, 종자는 외형 3종
    orcInit(ne);
    if (ascOn(10) && isEliteT(type)) { ne.ascAff = pick(Object.keys(ASC_AFF)); if (ne.ascAff === 'fast') ne.spd *= 1.3; else if (ne.ascAff === 'tough') { ne.hp *= 1.35; ne.maxHp *= 1.35; } else ne.atk *= 1.2; } // v1.96 잿빛 왕관 특성
    return ne;
  }
  function cancelTele(owner) { G.tele = G.tele.filter(t => t.owner !== owner); G.fx = G.fx.filter(f => !(f.kind === 'lob' && f.owner === owner)); }
  function alertMark(e, h, big) { G.fx.push({ kind: 'alert', o: e, h, s: big ? 3 : 2, t: 0.5, max: 0.5 }); }
  const restAng = e => e.blade === 'boss' ? (e.face > 0 ? -70 : -110) * DEG /* v2.50 발도르: 기사처럼 칼을 세워 듦 */ : e.type === 'mordred' ? (e.face > 0 ? -128 : -52) * DEG : e.type === 'exec' ? (e.face > 0 ? -152 : -28) * DEG : e.type === 'bearer' && !e.flagRef ? (e.face > 0 ? -78 : -102) * DEG : (e.face > 0 ? 125 : 55) * DEG; // 처형인은 도끼를 어깨에, 기수는 깃대를 세워 듦

  const INV = {};
  function invInit() {
    if (INV.ok) return INV; INV.ok = true;
    // 석궁: 머스킷과 같은 길이대(24~27칸), 앞쪽에 세로 활대
    const xbow = cellWeapon(27, 15, 4, 7, { b: '#6b4a2a', B: '#8a6236', i: '#5a5e68', I: '#8d9097', W: '#9aa0ac', w: '#d8dce4', S: '#d8d0c0', a: '#c8b090', r: '#a3222a', g: '#c9a24a' }, put => {
      const cy = 7;
      for (let x = 0; x < 12; x++) { put(x, cy - 1, x < 2 ? 'b' : 'B'); put(x, cy, 'b'); put(x, cy + 1, x < 9 ? 'b' : '.'); }
      put(3, cy + 2, 'b'); put(4, cy + 2, 'b'); put(4, cy + 3, 'b');
      for (let x = 10; x < 23; x++) { put(x, cy, 'i'); put(x, cy - 1, x % 5 === 0 ? 'g' : 'I'); }
      for (let y = 1; y <= 13; y++) put(21 + (y === 1 || y === 13 ? 1 : 0), y, Math.abs(y - cy) < 2 ? 'g' : 'W');
      put(22, 0, 'w'); put(22, 14, 'w');
      for (let t = 0; t <= 6; t++) { put(22 - Math.round(t * 1.2), 1 + t, 'S'); put(22 - Math.round(t * 1.2), 13 - t, 'S'); }
      for (let x = 13; x < 25; x++) put(x, cy - 2, x > 22 ? 'w' : 'a');
      put(25, cy - 2, 'w'); put(13, cy - 2, 'r'); put(14, cy - 2, 'r');
    });
    // 낫: 대검보다 긴 자루(32칸) + 끝에서 뒤로 휘는 날
    const scythe = cellWeapon(36, 17, 6, 14, { h: '#3a2a20', H: '#5a4030', w: '#eceff4', l: '#b9bfca', m: '#6b7280', d: '#3c404a', u: '#c070ff', g: '#8a8094', G: '#c9a24a' }, put => {
      const cy = 14;
      for (let x = 0; x < 33; x++) { put(x, cy, x % 7 === 3 ? 'g' : 'H'); put(x, cy + 1, 'h'); }
      // 날: 자루 끝(33,13)에서 위로 솟아 자루 쪽으로 휘어 내려옴 — 바깥(등)은 어둡고 안쪽(날)은 밝게
      const ox = 21, oy = 14, R0 = 12;
      for (let a = 0; a <= 48; a++) { const t = a / 48, ang = -0.02 - t * 1.95, w = Math.max(1, Math.round(4.5 * (1 - t) + 0.6));
        for (let k = 0; k < w; k++) { const r = R0 - k, x = Math.round(ox + Math.cos(ang) * r), y = Math.round(oy + Math.sin(ang) * r);
          put(x, y, k === w - 1 ? 'w' : k === w - 2 ? 'l' : k === 0 ? 'd' : 'm'); } }
      // 자루와 날을 잇는 쇠 고리
      for (let y = cy - 2; y <= cy + 2; y++) { put(32, y, 'G'); put(33, y, 'g'); }
      put(31, cy - 1, 'g'); put(31, cy + 2, 'g');
      put(26, 5, 'u'); put(25, 5, 'u'); // 보라 룬
    });
    // 초승달 탄: 앞으로 볼록한 보라 칼날 (칸 단위 회전)
    const crescent = cellWeapon(8, 13, 3, 6, { w: '#f4e8ff', l: '#c070ff', m: '#7a34a6' }, put => {
      for (let y = 0; y < 13; y++) for (let x = 0; x < 8; x++) { const o = Math.hypot((x - 0.5) / 7, (y - 6) / 6.5), i = Math.hypot((x + 1.5) / 6.2, (y - 6) / 5.2);
        if (o <= 1 && i > 1) put(x, y, o > 0.86 ? 'w' : i < 1.18 ? 'm' : 'l'); }
    });
    const crescentB = cellWeapon(8, 13, 3, 6, { w: '#ffffff', l: '#e0b0ff', m: '#a35fd0' }, (put, g) => { for (let y = 0; y < 13; y++) for (let x = 0; x < 8; x++) { const c = crescent.cells[y][x]; if (c !== '.') put(x, y, c); } });
    // 차크람: 머리보다 큰 고리 (지름 13칸), 바깥 날 8개 — 손에 쥘 때는 가장자리, 날아갈 때는 가운데가 축
    const chak = (pal, px, py) => cellWeapon(15, 15, px, py, pal, put => {
      const c = 7;
      for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) { const d = Math.hypot(x - c, y - c);
        if (d >= 3.6 && d < 6.2) put(x, y, d > 5.3 ? ((x - c) + (y - c) < 0 ? 'w' : 'l') : d < 4.4 ? 'd' : 'm'); }
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.3; put(Math.round(c + Math.cos(a) * 6.8), Math.round(c + Math.sin(a) * 6.8), 'w'); }
      put(c - 6, c, 'g'); put(c - 6, c + 1, 'g');
    });
    const CPA = { w: '#eceff4', l: '#b9bfca', m: '#6b7280', d: '#3c404a', g: '#a3222a' }, CPB = { w: '#fff0b0', l: '#ffd34d', m: '#c9a24a', d: '#7a5a22', g: '#3e6a2e' };
    // 권총: 쌍검과 같은 길이대(17칸)
    const pistol = cellWeapon(17, 8, 3, 4, { b: '#5a3c22', B: '#7a5232', i: '#3a3440', l: '#c8ccd4', m: '#8d9097', g: '#c9a24a' }, put => {
      for (const [x, y] of [[0, 6], [1, 6], [1, 5], [2, 5], [2, 4], [3, 4], [0, 7], [1, 7]]) put(x, y, 'b');
      put(2, 6, 'B'); put(3, 5, 'B');
      for (let x = 3; x < 9; x++) { put(x, 3, 'i'); put(x, 4, x < 5 ? 'b' : 'i'); }
      for (let x = 6; x < 17; x++) { put(x, 2, 'l'); put(x, 3, x < 9 ? 'i' : 'm'); }
      put(9, 2, 'g'); put(9, 3, 'g'); put(14, 2, 'g'); put(14, 3, 'g'); put(4, 1, 'm'); put(4, 2, 'i'); put(6, 5, 'm');
    });
    // 잉걸 탄: 앞이 하얗게 달군 납탄
    const ember = cellWeapon(6, 3, 2, 1, { w: '#fff4d0', y: '#ffb040', o: '#e0601c' }, put => { put(0, 1, 'o'); put(1, 1, 'o'); put(2, 1, 'y'); put(3, 1, 'y'); put(4, 1, 'w'); put(2, 0, 'o'); put(3, 0, 'y'); put(2, 2, 'o'); put(3, 2, 'y'); });
    const emberB = cellWeapon(6, 3, 2, 1, { w: '#ffffff', y: '#ffe090', o: '#ff8a3a' }, put => { for (let y = 0; y < 3; y++) for (let x = 0; x < 6; x++) { const c = ember.cells[y][x]; if (c !== '.') put(x, y, c); } });
    Object.assign(INV, { pistol, ember, emberB });
    Object.assign(INV, { xbow, scythe, crescent, crescentB, chakA: chak(CPA, 1, 7), chakB: chak(CPB, 1, 7), chakAf: chak(CPA, 7, 7), chakBf: chak(CPB, 7, 7) });
    return INV;
  }
  // ================================================================ 난입자 1장: 떠돌이 석궁사수 「붉은 꼬리」 (랫서팬더)
  // 플레이어와 같은 비율·같은 무기 규칙(cellWeapon). 거리를 벌리며 쏘고, 붙으면 플레이어처럼 점멸로 빠진다
  const PD = { keep: [140, 220], fanN: [4, 6], fanSp: 225, fanGap: 0.19, fanWind: 0.46, bounceN: [3, 4], bounceSp: 230, bounceWind: 0.44, snipeAim: 0.9, snipeLock: 0.34, snipeSp: 480, snipeTurn: 2.6,
    burstN: 3, burstGap: 0.15, burstSp: 280, volleyN: 6, cd: [0.6, 0.95], after: 0.3, dodgeD: 80, dodgeCharge: 1.5, pandaCharge: 2.2, pandaRead: 0.5 }; // v1.58 더 빠릿하게 · v2.40 1장 난입자 난이도 완화 (dodgeCharge는 다른 난입자도 씀)
  function pandaAim(e, a, rate, dt) { e.aim = e.aim == null ? a : e.aim + clamp(angDiff(a, e.aim), -rate * dt, rate * dt); e.face = Math.cos(e.aim) >= 0 ? 1 : -1; }
  function laserEnd(x, y, ang) { let L = 0; for (; L < 620; L += 6) { const px = x + Math.cos(ang) * L, py = y + Math.sin(ang) * L; if (px < A.x0 || px > A.x1 || py < A.y0 || py > A.y1 || obsHitL(G.obs, px, py, 1, true)) break; } return L; }
  function pandaShot(e, ang, sp, dmgK, o = {}) {
    G.eproj.push(Object.assign({ x: e.x + Math.cos(ang) * 12, y: e.y + Math.sin(ang) * 10, ang, sp, r: 3, dmg: e.atk * dmgK, t: 3, hist: [], kind: 'arrow' }, o));
  }
  // 점멸: 플레이어와 같은 규칙 — 2회 충전(1.5초마다 1회), 0.11초 동안 몸을 감추고 80px 이동, 그동안 무적, 출발점 잔상·도착점 빛
  function pandaDodge(e, ang) {
    if ((e.stam || 0) < 1) return false;
    const tx = e.x + Math.cos(ang) * PD.dodgeD, ty = e.y + Math.sin(ang) * PD.dodgeD;
    if (tx < A.x0 + 14 || tx > A.x1 - 14 || ty < A.y0 + 14 || ty > A.y1 - 14 || obsHitL(G.obs, tx, ty, e.r + 2)) { // 막히면 반대쪽 옆으로
      const alt = ang + Math.PI * (Math.random() < 0.5 ? 0.5 : -0.5), ax = e.x + Math.cos(alt) * PD.dodgeD, ay = e.y + Math.sin(alt) * PD.dodgeD;
      if (ax < A.x0 + 14 || ax > A.x1 - 14 || ay < A.y0 + 14 || ay > A.y1 - 14 || obsHitL(G.obs, ax, ay, e.r + 2)) return false; ang = alt; }
    e.stam--; e.prevPs = e.ps === 'dodge' ? e.prevPs : e.ps; e.ps = 'dodge'; e.t = 0; e.dvx = Math.cos(ang); e.dvy = Math.sin(ang); e.from = { x: e.x, y: e.y }; e.blinkEnd = false;
    const mp = INV_MAP[e.type] || 'invPanda'; G.fx.push({ kind: 'ghost', x: e.x, y: e.y, face: e.face, rot: 0, t: 0.35, max: 0.35, map: mp, pal: mp, sc: 2 });
    sfx('dodge'); return true;
  }

  // v1.67 난입자가 원거리 공격을 읽고 점멸: 날아오는 탄(검기·마력탄·화염구) / 거너가 자기를 겨눔(총알은 즉발이라 조준을 읽음) / 마력응축탄 조준 / 운석 낙하 지점
  function invRangedThreat(e, dt) {
    const P = G.player, side = ang => ang + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
    for (const pr of (G.proj || []).concat(G.mproj || [])) {
      if (pr.ang == null) continue; const dx = e.x - pr.x, dy = e.y - pr.y, dd = Math.hypot(dx, dy);
      const along = dx * Math.cos(pr.ang) + dy * Math.sin(pr.ang), off = Math.abs(-dx * Math.sin(pr.ang) + dy * Math.cos(pr.ang));
      if (along > 0 && off < (pr.r || 6) + e.r + 10 && along / (pr.sp || 300) < 0.32 && dd < 160) {
        pr.seen = pr.seen || new Set(); if (pr.seen.has(e)) continue; pr.seen.add(e);
        if (Math.random() < (e.type === 'panda' ? PD.pandaRead : 0.75)) { const cr = Math.cos(pr.ang) * dy - Math.sin(pr.ang) * dx; return pr.ang + Math.PI / 2 * (cr >= 0 ? 1 : -1); } // 탄이 오는 줄에서 먼 쪽 옆으로
      }
    }
    if (G.cls === 'gunner' && !P.dead) { // 거너가 겨누고 있으면 (즉발이라 쏘기 전에 읽음)
      const d = Math.hypot(e.x - P.x, e.y - P.y), on = Math.abs(angDiff(angTo(P, e), P.ang)) < Math.max(0.08, 14 / Math.max(d, 1));
      if (P.state === 'aim') { if (on && P.t > 1.55 && !e.snipeDodged) { e.snipeDodged = true; return side(P.ang); } } else e.snipeDodged = false; // 마력응축탄: 쏘기 직전
      e.aimedT = on && P.reload <= 0 && P.state !== 'aim' && d < 420 ? (e.aimedT || 0) + dt : 0;
      if (e.aimedT > 0.28 && Math.random() < dt * 4) { e.aimedT = 0; return side(P.ang); }
    }
    if (G.meteor && !G.meteor.fell && Math.hypot(e.x - G.meteor.x, e.y - G.meteor.y) < G.meteor.r + 10 && G.meteor.t > G.meteor.dur * 0.5) return Math.atan2(e.y - G.meteor.y, e.x - G.meteor.x) + rand(-0.4, 0.4); // 운석 밖으로
    return null;
  }
  function pandaThreat(e, d, a) { // 플레이어처럼 위험을 보고 피함
    const P = G.player, away = a + Math.PI, side = a + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
    if (d < 85) return away + rand(-0.6, 0.6);
    if (d < 115 && ['attack', 'charge', 'skill', 'shadow', 'butt', 'storm'].includes(P.state) && P.t < 0.2 && Math.random() < (e.type === 'panda' ? 0.55 : 0.8)) return Math.random() < 0.5 ? side : away;
    { const ra = invRangedThreat(e, 1 / 60); if (ra != null) return ra; }
    return null;
  }
  function invDodgeTick(e, dt) { // 난입자 점멸 진행 (플레이어 점멸과 같은 타이밍)
    if (e.ps !== 'dodge') return false;
    {
      e.t += dt * 2; // updateEnemy가 t를 줄이므로 되돌려 올림
      const k = e.t; 
      if (k < BLINK) { e.x += e.dvx * (PD.dodgeD / BLINK) * dt; e.y += e.dvy * (PD.dodgeD / BLINK) * dt; e.fadeA = 0;
        if (Math.random() < 0.7) G.parts.push({ x: e.x + rand(-4, 4), y: e.y - rand(2, 20), vx: -e.dvx * 40, vy: -e.dvy * 40, t: 0.3, c: pick(e.type === 'reaper' ? ['#c070ff', '#e8d0ff'] : e.type === 'shrewB' ? ['#ffd34d', '#fff0b0'] : e.type === 'shrewA' ? ['#d8dce4', '#ffffff'] : e.type === 'weasel' ? ['#ffb040', '#fff0c0'] : ['#ff9a6a', '#ffd0b0']), g: 0, glow: true }); }
      else if (!e.blinkEnd) { e.blinkEnd = true; solveObs(e, e.r); e.x = clamp(e.x, A.x0 + e.r, A.x1 - e.r); e.y = clamp(e.y, A.y0 + e.r, A.y1 - e.r);
        blinkBurst(e.x, e.y - 10); G.fx.push({ kind: 'streak', px: e.type === 'reaper' ? '#c48cff' : '#ffe6a0', x0: e.from.x, y0: e.from.y - 10, x1: e.x, y1: e.y - 10, t: 0.18, max: 0.18 }); }
      e.fadeA = k < BLINK ? 0 : clamp((k - BLINK) / 0.09, 0.5, 1);
      if (k >= BLINK + 0.09) { e.fadeA = 1; e.ps = e.prevPs === 'snipe' ? 'snipe' : 'move'; if (e.ps === 'move') e.cd = Math.min(e.cd, 0.15); }
      return true;
    }
  }
  function updatePanda(e, dt, d, a, moveTo) {
    const P = G.player, ph2 = e.hp < e.maxHp * 0.55;
    e.recoil = Math.max(0, (e.recoil || 0) - dt * 30);
    if (e.stam == null) e.stam = 2;
    if (e.stam < 2) { e.stamT = (e.stamT || 0) + dt; if (e.stamT >= PD.pandaCharge) { e.stamT = 0; e.stam++; } }
    if (!e.ps) { e.ps = 'intro'; e.t = 1.0; e.fadeA = 0; e.seq = 0; e.cd = 0.35; }
    if (e.ps === 'intro') { e.fadeA = clamp(1 - e.t / 1.0, 0, 1); pandaAim(e, a, 6, dt); if (e.t <= 0) { e.ps = 'move'; e.fadeA = 1; } return; }
    if (invDodgeTick(e, dt)) return;
    // 위험하면 점멸 (공격 준비 중에도 끊고 피함 — 저격 조준만은 이어감)
    { const da = e.ps !== 'snipe' || d < 70 ? pandaThreat(e, d, a) : invRangedThreat(e, dt); if (da != null && pandaDodge(e, da)) { e.t = 0; return; } } // 저격 조준 중에도 날아오는 탄은 피함
    if (e.ps === 'move') {
      pandaAim(e, a, 9, dt);
      if (d < PD.keep[0]) moveTo(a + Math.PI + (e.strafe || 1) * 0.5, e.spd);
      else if (d > PD.keep[1]) moveTo(a + (e.strafe || 1) * 0.35, e.spd);
      else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.75);
      e.moving = true; e.face = Math.cos(e.aim) >= 0 ? 1 : -1;
      if (Math.random() < dt * 0.8) e.strafe = -(e.strafe || 1);
      if (e.stam >= 2 && Math.random() < dt * 0.5) pandaDodge(e, a + Math.PI / 2 * (e.strafe || 1)); // 충전이 차 있으면 가끔 옆으로 점멸해 각을 바꿈
      if (e.cd <= 0) {
        const seq = ph2 ? ['fan', 'burst', 'snipe', 'volley', 'bounce', 'burst', 'fan', 'volley'] : ['fan', 'burst', 'snipe', 'bounce', 'burst'];
        const pat = e.forcePat || seq[e.seq++ % seq.length]; e.moving = false;
        if (pat === 'fan') { // 부채꼴: 가는 경고선 → 일제 발사 (2단계는 두 겹)
          e.ps = 'fan'; e.t = PD.fanWind; e.lockAng = a; const n = PD.fanN[ph2 ? 1 : 0];
          for (let i = 0; i < n; i++) G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a + (i - (n - 1) / 2) * PD.fanGap, len: 150, w: 8, t: 0, dur: PD.fanWind, owner: e, thin: true });
        } else if (pat === 'bounce') { // 반사: 벽 쪽으로 쏘아 한 번 튕겨 들어오게
          e.ps = 'bounce'; e.t = PD.bounceWind; e.lockAng = a; e.n = PD.bounceN[ph2 ? 1 : 0];
          for (let i = 0; i < e.n; i++) G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a + (i - (e.n - 1) / 2) * 0.5, len: 90, w: 8, t: 0, dur: PD.bounceWind, owner: e, thin: true });
        } else if (pat === 'burst') { e.ps = 'burst'; e.t = 0.28; e.n = PD.burstN + (ph2 ? 2 : 0); e.bt = 0; G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 160, w: 8, t: 0, dur: 0.28, owner: e, thin: true }); }
        else if (pat === 'snipe') { e.ps = 'snipe'; e.t = PD.snipeAim + PD.snipeLock; e.locked = false; sfx('warn'); }
        else if (pat === 'volley') { e.ps = 'volley'; e.t = 0.35; }
      }
      return;
    }
    if (e.ps === 'fan') {
      if (e.t <= 0) { const n = PD.fanN[ph2 ? 1 : 0];
        for (let i = 0; i < n; i++) pandaShot(e, e.lockAng + (i - (n - 1) / 2) * PD.fanGap, PD.fanSp, 0.5);
        if (ph2) for (let i = 0; i < n - 1; i++) pandaShot(e, e.lockAng + (i - (n - 2) / 2) * PD.fanGap, PD.fanSp * 0.75, 0.5); // 두 번째 겹은 느리게, 틈을 엇갈려
        e.recoil = 4; sfx('swing'); e.ps = 'after'; e.t = PD.after; e.cd = rand(...PD.cd); }
      return;
    }
    if (e.ps === 'burst') { // 연사: 조준해서 빠르게 여러 발 (매 발 다시 조준)
      pandaAim(e, a, 5, dt);
      if (e.t <= 0) { e.bt -= dt; if (e.bt <= 0) { e.bt = PD.burstGap; pandaShot(e, e.aim, PD.burstSp, 0.45); e.recoil = 3; sfx('swing'); if (--e.n <= 0) { e.ps = 'after'; e.t = PD.after; e.cd = rand(...PD.cd); } } }
      return;
    }
    if (e.ps === 'bounce') {
      if (e.t <= 0) { for (let i = 0; i < e.n; i++) pandaShot(e, e.lockAng + (i - (e.n - 1) / 2) * 0.5, PD.bounceSp, 0.5, { bounce: 1, t: 4 });
        e.recoil = 4; sfx('swing'); e.ps = 'after'; e.t = PD.after; e.cd = rand(...PD.cd); }
      return;
    }
    if (e.ps === 'snipe') { // 조준선이 따라오다(진홍) 굳고(금빛) → 경고가 끝나는 순간 발사
      if (!e.locked) { pandaAim(e, a, PD.snipeTurn, dt); if (e.t <= PD.snipeLock) { e.locked = true; sfx('blip'); } }
      if (e.t <= 0) { pandaShot(e, e.aim, PD.snipeSp, 1.05, { r: 4, t: 1.6 }); e.recoil = 7; sfx('blast'); burst(e.x + Math.cos(e.aim) * 22, e.y - 10 + Math.sin(e.aim) * 16, '#ffd34d', 8);
        e.ps = 'after'; e.t = PD.after; e.cd = rand(...PD.cd); }
      return;
    }
    if (e.ps === 'volley') { // 하늘로 쏘아 올린 화살비: 바닥 원이 끝나는 순간 꽂힘
      e.aim += angDiff(-Math.PI / 2 + e.face * 0.25, e.aim) * Math.min(1, dt * 14);
      if (e.t <= 0) {
        e.recoil = 4; sfx('swing');
        for (let i = 0; i < PD.volleyN; i++) { const r = i === 0 ? 0 : rand(30, 100), q = rand(0, TAU), lead = i === 0 ? 0 : 0.4, x = clamp(P.x + (P.vx || 0) * lead + Math.cos(q) * r, A.x0 + 14, A.x1 - 14), y = clamp(P.y + (P.vy || 0) * lead + Math.sin(q) * r * 0.8, A.y0 + 14, A.y1 - 14);
          G.tele.push({ shape: 'circle', x, y, r: 18, t: 0, dur: 0.65 + i * 0.09, owner: e,
            onFire: tt => { hitShape(tt, e.atk * 0.7); dust(tt.x, tt.y, 6); G.fx.push({ kind: 'ring', px: true, x: tt.x, y: tt.y, r: 4, t: 0.25, max: 0.25, c: '#ffd34d', grow: 70 });
              for (let k = 0; k < 4; k++) G.parts.push({ x: tt.x + rand(-2, 2), y: tt.y - 40 - k * 6, vx: 0, vy: 260, t: 0.15, c: '#e8dcc0', g: 0 }); } }); }
        e.ps = 'after'; e.t = PD.after; e.cd = rand(...PD.cd);
      }
      return;
    }
    if (e.ps === 'after') { pandaAim(e, a, 6, dt); if (e.t <= 0) e.ps = 'move'; return; }
  }
  // v2.43 난입자 공격 모션: 예비동작 동안 움츠리며 뒤로 기울고, 쏘거나 휘두르는 순간 앞으로 튕겼다가 탄성 있게 돌아온다
  const INV_WIND = { panda: e => ['fan', 'bounce', 'volley', 'burst', 'snipe'].includes(e.ps) && e.t > 0, reaper: e => ['reap', 'crescent', 'spin', 'chain'].includes(e.ps),
    shrewA: e => e.ps === 'throw' || e.ps === 'spinWind', shrewB: e => e.ps === 'throw' || e.ps === 'spinWind', weasel: e => ['fan', 'twin', 'spiral'].includes(e.ps) && e.t > 0 };
  const INV_DRAW = { panda: (...a) => drawPanda(...a), reaper: (...a) => drawReaper(...a), shrewA: (...a) => drawShrew(...a), shrewB: (...a) => drawShrew(...a), weasel: (...a) => drawWeasel(...a) };
  function invPose(e) {
    const wind = !e.dead && INV_WIND[e.type](e), f = e.face || 1, o = { dx: 0, sx: 1, sy: 1, rot: 0 };
    if (wind && !e._wOn) { e._wOn = true; e._w0 = time; }
    if (!wind && e._wOn) { e._wOn = false; e._kick = time; }
    if (wind) { const k = easeOut((time - e._w0) / 0.3); o.dx = -f * 2 * k; o.sx = 1 + 0.08 * k; o.sy = 1 - 0.1 * k; o.rot = -0.16 * f * k; }
    else if (e._kick != null && time - e._kick < 0.5) { const u = time - e._kick, d = Math.exp(-u * 9) * Math.cos(u * 22); o.dx = f * 3 * d; o.sx = 1 + 0.1 * d; o.sy = 1 - 0.08 * d; o.rot = 0.22 * f * d; }
    const rc = Math.min(6, e.recoil || 0); if (rc > 0) { o.dx -= f * rc * 0.5; o.rot -= 0.04 * f * rc; o.sx -= 0.012 * rc; o.sy += 0.012 * rc; }
    return o;
  }
  function invDraw(e, ya, al, white) { const ox = e.x, p = invPose(e); e.x += p.dx; e.INVP = p; try { INV_DRAW[e.type](e, ya, al, white); } finally { e.x = ox; e.INVP = null; } }
  // v2.93 난입자도 플레이어와 같은 걸음: 2·4장면은 몸이 1칸 내려가며 발을 들고(W1·W3), 3장면은 꼬리 · 옷자락이 한 칸 들썩(W2),
  //        멈춰 있으면 플레이어처럼 0.6초마다 숨 고르기(몸통 한 줄이 접혀 1칸 내려앉음)
  const invWalk = e => e.moving && (e.ps === 'move' || !e.ps) ? Math.floor(time / 0.08) % 4 : (!e.ps || e.ps === 'move' || e.ps === 'idle') && Math.floor(time / 0.6 + (e.x || 0) * 0.01) % 2 ? -2 : -1;
  for (const k of ['invPanda', 'invReaper', 'invShrew', 'invShrewB', 'invWeasel']) { // W2: 발이 시작하는 칸 왼쪽(꼬리 · 옷자락)을 한 줄 들어 올림
    if (!MAPS[k] || MAPS[k + 'W2']) continue;
    const R = MAPS[k], H = R.length, feet = R[H - 2], f0 = Math.max(0, feet.search(/[^.k]/) - 1), g = R.map(r => r.split(''));
    for (let x = 0; x < f0; x++) { for (let y = 0; y < H - 1; y++) g[y][x] = (R[y + 1] || '')[x] || '.'; g[H - 1][x] = '.'; }
    MAPS[k + 'W2'] = g.map(r => r.join('')); PLAYER_MAPS.add(k + 'W2');
  }
  const invOpt = (e, o) => { const p = e.INVP; return p ? Object.assign(o, { rot: p.rot, sx: p.sx, sy: p.sy }) : o; };
  function drawPanda(e, ya, al, white) {
    const I = invInit(), flip = e.face < 0;
    const wf = invWalk(e), bob = wf % 2 ? 2 : 0;
    drawShadow(e.x, e.y + 1, 8);
    // 저격 조준선 (2px 칸 디더): 따라오는 동안 진홍, 굳으면 금빛 점멸
    if (e.ps === 'snipe' && al > 0.5) {
      const sx = e.x + Math.cos(e.aim) * 20, sy = e.y - 10 + Math.sin(e.aim) * 14, L = laserEnd(e.x, e.y, e.aim);
      const on = !e.locked || Math.floor(time * 20) % 2 === 0;
      for (let t = 0; t < L; t += 2) { const x = (sx + Math.cos(e.aim) * t) & ~1, y = (sy + Math.sin(e.aim) * t) & ~1;
        ctx.fillStyle = e.locked ? (on ? '#ffd34d' : '#a3222a') : ((t >> 1) % 2 ? '#a3222a' : '#5c1016'); if (e.locked || (t >> 1) % 3) ctx.fillRect(x, y, 2, 2); }
    }
    const rc = e.recoil || 0, hx = e.x + e.face * 6 - Math.cos(e.aim || 0) * rc, hy = e.y - 9 + ya + bob; // v2.43 새 도트: 옆구리의 손
    if (e.ps === 'dodge' && e.t < BLINK) return; // 점멸 중에는 보이지 않는다 (플레이어와 같음)
    const sq = e.ps === 'fan' || e.ps === 'bounce' || e.ps === 'volley' ? 0.94 : 1;
    if (e.ps === 'intro') { // 난입: 붉은 실루엣이 칸 단위로 차오름
      drawSprite('invPanda', 'invPanda', 2, e.x, e.y + 2 + ya, flip, { white: true, alpha: (1 - al) * 0.9 });
    }
    drawSprite(walkMap('invPanda', wf), 'invPanda', 2, e.x, e.y + 2 + ya, flip, invOpt(e, { white, alpha: al, sy: sq }));
    if (!white) drawBlade(I.xbow, hx, hy + 4, e.aim || 0, al);
    if ((e.ps === 'fan' || e.ps === 'bounce' || (e.ps === 'burst' && e.t > 0)) && al > 0.5) holdGlow(e.x + Math.cos(e.aim) * 28, e.y - 8 + Math.sin(e.aim) * 18, 1 - e.t / 0.42, '255,200,60');
  }


  // ================================================================ v1.59 난입자 2장: 수확자 「흑각」 (검은 염소, 낫)
  // 붙어서 베는 근접형. 플레이어처럼 점멸로 피하고, 그림자 점멸(사라짐 → 바닥 경고 → 나타나 베기)로 파고든다. 떠난 자리의 잔상은 초승달 탄을 터뜨린다
  const RP = { cresN: [3, 5], cresSp: 240, cresGap: 0.32, cresWind: 0.4, reapR: 64, reapArc: 200 * DEG, reapWind: 0.36, shadowOut: 0.28, shadowMark: 0.62, spinWind: 0.45, spinN: 14, spinSp: 175, echoT: 0.55, echoN: 8, echoSp: 160, cd: [0.35, 0.65], after: 0.22 };
  function reaperSwing(e, from, to, dur) { e.sw = { from, to, t: 0, dur }; }
  function reaperRing(x, y, n, sp, off, gap, dmg) { for (let i = 0; i < n; i++) { if (gap != null && (i === gap || i === (gap + 1) % n)) continue; const ang = off + i / n * TAU; G.eproj.push({ x: x + Math.cos(ang) * 8, y: y + Math.sin(ang) * 6, ang, sp, r: 5, dmg, t: 3, hist: [], kind: 'crescent' }); } }
  function reaperShadow(e, P, fast) { // 그림자 점멸: 사라짐 → 바닥 원 경고 → 경고가 끝나기 직전 나타나 원 안을 벤다
    e.ps = 'shOut'; e.t = fast ? RP.shadowOut * 0.7 : RP.shadowOut; e.echoes.push({ x: e.x, y: e.y, face: e.face, t: RP.echoT + (fast ? 0.2 : 0.35) });
    const side = rand(0, TAU), x = clamp(P.x + Math.cos(side) * 34, A.x0 + 16, A.x1 - 16), y = clamp(P.y + Math.sin(side) * 24, A.y0 + 16, A.y1 - 16);
    e.mark = { x, y }; sfx('dodge');
    G.tele.push({ shape: 'circle', x: P.x, y: P.y, r: 46, t: 0, dur: e.t + (fast ? RP.shadowMark * 0.75 : RP.shadowMark), owner: e, heavy: true,
      onFire: tt => { hitShape(tt, e.atk * 0.95); G.fx.push({ kind: 'ring', px: true, x: tt.x, y: tt.y, r: 6, t: 0.3, max: 0.3, c: '#c070ff', grow: 200 }); dust(tt.x, tt.y, 10); sfx('blast');
        reaperSwing(e, angTo(e, tt) - 1.9 * e.face, angTo(e, tt) + 1.9 * e.face, 0.12); e.ps = 'after'; e.t = RP.after + 0.1; } });
    e.markTele = G.tele[G.tele.length - 1];
  }
  function updateReaper(e, dt, d, a, moveTo) {
    const P = G.player, ph2 = e.hp < e.maxHp * 0.55;
    if (e.stam == null) { e.stam = 2; e.echoes = []; e.trail = []; e.aim = a; }
    if (e.stam < 2) { e.stamT = (e.stamT || 0) + dt; if (e.stamT >= PD.dodgeCharge) { e.stamT = 0; e.stam++; } }
    // 잔상: 시간이 다 되면 초승달 탄 고리로 터짐
    for (const q of e.echoes) { q.t -= dt; if (q.t <= 0 && !q.done) { q.done = true; reaperRing(q.x, q.y, RP.echoN, RP.echoSp, rand(0, TAU), null, e.atk * 0.55); burst(q.x, q.y - 12, '#c070ff', 10); sfx('blip'); } }
    e.echoes = e.echoes.filter(q => q.t > -0.3);
    // 낫 휘두르기 (칸 단위 회전 + 궤적)
    if (e.sw) { e.sw.t += dt; const k = Math.min(1, e.sw.t / e.sw.dur); e.aim = e.sw.from + angDiff(e.sw.to, e.sw.from) * k; e.trail.push({ a: e.aim, t: 0.11 }); if (k >= 1) e.sw = null; }
    for (const q of e.trail) q.t -= dt; e.trail = e.trail.filter(q => q.t > 0);
    if (!e.ps) { e.ps = 'intro'; e.t = 1.0; e.fadeA = 0; e.seq = 0; e.cd = 0.3; }
    if (e.ps === 'intro') { e.fadeA = clamp(1 - e.t / 1.0, 0, 1); if (e.t <= 0) { e.ps = 'move'; e.fadeA = 1; } return; }
    if (invDodgeTick(e, dt)) return;
    if (['reap', 'spin', 'shHide', 'shIn'].includes(e.ps) && !G.tele.some(t => t.owner === e)) { e.stuckT = (e.stuckT || 0) + dt; if (e.stuckT > 0.3) { e.stuckT = 0; e.fadeA = 1; e.ps = 'after'; e.t = RP.after; e.chainLeft = 0; } } else e.stuckT = 0;
    if (e.ps === 'shOut') { e.fadeA = clamp(e.t / RP.shadowOut, 0, 1); if (e.t <= 0) { e.ps = 'shHide'; e.fadeA = 0; } return; }
    if (e.ps === 'shHide') { const tt = e.markTele; if (!tt || tt.t >= tt.dur - 0.2) { e.x = e.mark.x; e.y = e.mark.y; e.face = P.x > e.x ? 1 : -1; e.ps = 'shIn'; blinkBurst(e.x, e.y - 10); } return; }
    if (e.ps === 'shIn') { const tt = e.markTele; e.fadeA = tt ? clamp(1 - (tt.dur - tt.t) / 0.2, 0.3, 1) : 1; e.aim = a - 1.9 * e.face; return; } // 경고 onFire가 'after'로 넘김
    // 위험하면 점멸 (근접형이라 뒤가 아니라 옆·등 뒤로 돌아 들어감)
    if (e.ps === 'move' || e.ps === 'after') {
      const busy = ['attack', 'charge', 'skill', 'shadow', 'butt', 'storm'].includes(P.state) && P.t < 0.2 && d < 105;
      let da = null; if (busy && Math.random() < 0.7) da = a + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
      { const ra = invRangedThreat(e, dt); if (ra != null) da = ra; }
      if (da != null && pandaDodge(e, da)) { e.t = 0; return; }
    }
    if (e.ps === 'move') {
      e.aim += angDiff(e.face > 0 ? -96 * DEG : -84 * DEG, e.aim) * Math.min(1, dt * 8);
      const want = e.seqNext === 'reap' ? 52 : 120;
      if (d > want + 20) moveTo(a + (e.strafe || 1) * 0.25, e.spd * (d > 220 ? 1.25 : 1));
      else if (d < want - 30) moveTo(a + Math.PI + (e.strafe || 1) * 0.4, e.spd * 0.8);
      else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.7);
      e.moving = true; e.face = Math.cos(a) >= 0 ? 1 : -1;
      if (Math.random() < dt * 0.8) e.strafe = -(e.strafe || 1);
      const seq = ph2 ? ['crescent', 'reap', 'chain', 'spin', 'reap', 'shadow'] : ['crescent', 'reap', 'shadow', 'spin', 'reap'];
      e.seqNext = seq[e.seq % seq.length];
      if (e.cd <= 0 && (e.seqNext !== 'reap' || d < 90 || (e.reapWait = (e.reapWait || 0) + dt) > 1.4)) {
        const pat = e.forcePat || e.seqNext; e.seq++; e.reapWait = 0; e.moving = false;
        if (pat === 'reap' && d >= 90) { e.ps = 'lunge'; e.t = 0.35; return; }
        startReaperPat(e, pat, a, ph2, P);
      }
      return;
    }
    if (e.ps === 'lunge') { moveTo(a, e.spd * 2.6); e.face = Math.cos(a) >= 0 ? 1 : -1; if (e.t <= 0 || d < 60) startReaperPat(e, 'reap', a, ph2, P); return; }
    if (e.ps === 'crescent') { e.aim += angDiff(e.lockAng + Math.PI + 0.5 * e.face, e.aim) * Math.min(1, dt * 10);
      if (e.t <= 0) { const n = RP.cresN[ph2 ? 1 : 0]; for (let i = 0; i < n; i++) G.eproj.push({ x: e.x + Math.cos(e.lockAng) * 10, y: e.y + Math.sin(e.lockAng) * 8, ang: e.lockAng + (i - (n - 1) / 2) * RP.cresGap, sp: RP.cresSp, r: 5, dmg: e.atk * 0.6, t: 3, hist: [], kind: 'crescent' });
        reaperSwing(e, e.lockAng - 1.7 * e.face, e.lockAng + 1.2 * e.face, 0.12); sfx('swing'); e.ps = 'after'; e.t = RP.after; e.cd = rand(...RP.cd); }
      return; }
    if (e.ps === 'reap') { if (e.t > 0) { e.aim += angDiff(e.lockAng - 2.0 * e.face, e.aim) * Math.min(1, dt * 12); return; }
      return; } // 경고 onFire가 진행
    if (e.ps === 'spin') { e.aim += dt * 9 * e.face; return; }
    if (e.ps === 'chain') { if (e.t <= 0) { if (--e.n > 0) { reaperShadow(e, P, true); e.chainLeft = e.n; } else { e.ps = 'after'; e.t = RP.after; e.cd = rand(...RP.cd); } } return; }
    if (e.ps === 'after' && !e.sw) e.aim += angDiff(e.face > 0 ? -96 * DEG : -84 * DEG, e.aim) * Math.min(1, dt * 6);
    if (e.ps === 'after') { if (e.chainLeft > 0 && e.t <= 0) { e.chainLeft--; reaperShadow(e, P, true); return; } if (e.t <= 0) { e.ps = 'move'; if (e.cd < 0.2) e.cd = rand(...RP.cd); } return; }
  }
  function startReaperPat(e, pat, a, ph2, P) {
    e.lockAng = a; e.face = Math.cos(a) >= 0 ? 1 : -1;
    if (pat === 'crescent') { e.ps = 'crescent'; e.t = RP.cresWind; const n = RP.cresN[ph2 ? 1 : 0];
      for (let i = 0; i < n; i++) G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a + (i - (n - 1) / 2) * RP.cresGap, len: 140, w: 10, t: 0, dur: RP.cresWind, owner: e, thin: true }); }
    else if (pat === 'reap') { // 큰 반원 베기 (2단계는 되돌아 한 번 더)
      e.ps = 'reap'; e.t = RP.reapWind;
      const fire = (k2) => tt => { hitShape(tt, e.atk * 1.05); const s = k2 ? -1 : 1; reaperSwing(e, tt.ang - 1.75 * e.face * s, tt.ang + 1.75 * e.face * s, 0.13); sfx('swing'); dust(e.x + Math.cos(tt.ang) * 30, e.y + Math.sin(tt.ang) * 20, 6);
        if (ph2 && !k2) { G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: angTo(e, G.player), arc: RP.reapArc, r: RP.reapR, t: 0, dur: 0.3, owner: e, heavy: true, onFire: fire(true) }); }
        else { e.ps = 'after'; e.t = RP.after + 0.15; e.cd = rand(...RP.cd); } };
      G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: a, arc: RP.reapArc, r: RP.reapR, t: 0, dur: RP.reapWind, owner: e, heavy: true, onFire: fire(false) }); }
    else if (pat === 'shadow') reaperShadow(e, P, false);
    else if (pat === 'chain') { e.chainLeft = 2; reaperShadow(e, P, true); }
    else if (pat === 'spin') { // 회전 베기 → 초승달 고리 (2단계는 반 칸 엇갈린 두 번째 고리)
      e.ps = 'spin'; sfx('warn');
      G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 50, t: 0, dur: RP.spinWind, owner: e, heavy: true,
        onFire: tt => { hitShape(tt, e.atk * 0.9); const off = rand(0, TAU), gap = randi(0, RP.spinN - 1); reaperRing(e.x, e.y, RP.spinN, RP.spinSp, off, gap, e.atk * 0.55);
          G.fx.push({ kind: 'ring', px: true, x: e.x, y: e.y, r: 8, t: 0.35, max: 0.35, c: '#c070ff', grow: 220 }); sfx('blast');
          if (ph2) setTimeout(() => { if (!e.dead && G.enemies.includes(e)) { reaperRing(e.x, e.y, RP.spinN, RP.spinSp * 0.8, off + Math.PI / RP.spinN, (gap + RP.spinN / 2) % RP.spinN, e.atk * 0.55); } }, 280);
          e.ps = 'after'; e.t = RP.after + 0.1; e.cd = rand(...RP.cd); } }); }
  }
  function drawReaper(e, ya, al, white) {
    const I = invInit(), flip = e.face < 0;
    for (const q of e.echoes || []) { const k = q.done ? clamp(1 + q.t / 0.3, 0, 1) : 1, fl = q.t < 0.25 && !q.done && Math.floor(time * 20) % 2;
      drawSprite('invReaper', 'invReaperEcho', 2, q.x, q.y + 2, q.face < 0, { alpha: 0.5 * k, white: fl }); }
    if (e.ps === 'shHide' || (e.ps === 'dodge' && e.t < BLINK)) return;
    drawShadow(e.x, e.y + 1, 8);
    const wf = invWalk(e), bob = wf % 2 ? 2 : 0;
    const hx = e.x + e.face * 4, hy = e.y - 11 + ya + bob, behind = !e.sw && e.ps !== 'spin'; // v2.43 망토 속에서 낫을 쥠
    if (e.trail && e.trail.length > 1) drawSlashPx(e.trail, hx, hy + 4, I.scythe.reach + 2, '#c48cff', true); // v2.50 도트 궤적
    if (behind && !white) drawBlade(I.scythe, hx - e.face * 2, hy + 2, e.aim == null ? -96 * DEG : e.aim, al);
    if (e.ps === 'intro') drawSprite('invReaper', 'invReaper', 2, e.x, e.y + 2 + ya, flip, { white: true, alpha: (1 - al) * 0.9 });
    const sq = e.ps === 'reap' || e.ps === 'crescent' ? 0.94 : 1;
    drawSprite(walkMap('invReaper', wf), 'invReaper', 2, e.x, e.y + 2 + ya, flip, invOpt(e, { white, alpha: al, sy: sq }));
    if (!behind && !white) drawBlade(I.scythe, hx, hy + 4, e.aim, al);
    if ((e.ps === 'reap' || e.ps === 'crescent') && e.t > 0) holdGlow(e.x + e.face * 4, e.y - 30, 1 - e.t / 0.4, '200,140,255');
  }

  // ================================================================ v1.63 난입자 3장: 차크람 땃쥐 형제 (형 「은고리」 · 아우 「금고리」)
  // 둘이 플레이어 양쪽으로 갈라서서 차크람을 던진다. 차크람은 날아갔다 주인에게 돌아오고, 장애물에 맞으면 떨어져 주우러 가야 한다.
  // 두 차크람이 서로 부딪히면 튕겨 나가며 불꽃 파편을 흩뿌린다
  const SH = { throwSp: 330, range: 230, backSp: 340, wind: 0.32, curveW: 2.4, spinDash: 0.55, cd: [0.45, 0.8], flank: 165, spark: 6, sparkSp: 140 };
  function chakThrow(e, ang, curve) {
    const c = e.chak; Object.assign(c, { st: 'out', x: e.x + Math.cos(ang) * 10, y: e.y + Math.sin(ang) * 8, vx: Math.cos(ang), vy: Math.sin(ang), sp: SH.throwSp * (e.rage ? 1.15 : 1), dist: 0, w: curve || 0, hitCd: 0, bounced: 0 });
    e.recoil = 4; sfx('swing');
  }
  function chakHit(c, e) { const P = G.player; if (c.hitCd <= 0 && !P.dead && Math.hypot(c.x - P.x, c.y - P.y) < 9 + P.r) { hurtPlayer(e.atk * 0.6, e); c.hitCd = 0.45; sparks(c.x, c.y - 10, Math.atan2(c.vy, c.vx), '#ffffff', 4); } }
  function chakTick(e, dt) {
    const c = e.chak; if (!c || c.st === 'held') return;
    c.hitCd -= dt; c.spin = (c.spin || 0) + dt * 22;
    if (c.st === 'drop') { c.t = (c.t || 0) + dt; return; }
    if (c.st === 'out') {
      if (c.w) { const a = Math.atan2(c.vy, c.vx) + c.w * dt; c.vx = Math.cos(a); c.vy = Math.sin(a); }
      c.sp = Math.max(150, c.sp - 300 * dt);
    } else { const a = Math.atan2(e.y - c.y, e.x - c.x); c.vx = Math.cos(a); c.vy = Math.sin(a); c.sp = SH.backSp; }
    const ox = c.x, oy = c.y; c.x += c.vx * c.sp * dt; c.y += c.vy * c.sp * dt; c.dist += c.sp * dt;
    if (segSolid(ox, oy, c.x, c.y)) { c.x = ox; c.y = oy; c.st = 'drop'; c.t = 0; sparks(c.x, c.y - 10, 0, '#ffd34d', 8); sfx('block'); dust(c.x, c.y, 4); return; } // 장애물에 막혀 떨어짐
    if (c.x < A.x0 + 4 || c.x > A.x1 - 4 || c.y < A.y0 + 4 || c.y > A.y1 - 4) { c.x = clamp(c.x, A.x0 + 4, A.x1 - 4); c.y = clamp(c.y, A.y0 + 4, A.y1 - 4); c.st = 'back'; sparks(c.x, c.y - 10, 0, '#d8dce4', 4); }
    if (c.st === 'out' && c.dist > SH.range) c.st = 'back';
    if (c.st === 'back' && Math.hypot(e.x - c.x, e.y - c.y) < 12) { c.st = 'held'; return; }
    chakHit(c, e);
    // 형제의 차크람과 부딪히면 튕김 (탄성 충돌) + 불꽃 파편
    const b = e.bro && !e.bro.dead ? e.bro.chak : null;
    if (b && e.type === 'shrewA' && (b.st === 'out' || b.st === 'back') && Math.hypot(b.x - c.x, b.y - c.y) < 15 && (c.clank || 0) <= 0) {
      const nx = (b.x - c.x), ny = (b.y - c.y), nl = Math.hypot(nx, ny) || 1, ux = nx / nl, uy = ny / nl;
      const va = c.vx * c.sp * ux + c.vy * c.sp * uy, vb = b.vx * b.sp * ux + b.vy * b.sp * uy;
      let cvx = c.vx * c.sp + (vb - va) * ux, cvy = c.vy * c.sp + (vb - va) * uy, bvx = b.vx * b.sp + (va - vb) * ux, bvy = b.vy * b.sp + (va - vb) * uy;
      const cs = Math.max(220, Math.hypot(cvx, cvy)), bs = Math.max(220, Math.hypot(bvx, bvy));
      Object.assign(c, { vx: cvx / (Math.hypot(cvx, cvy) || 1), vy: cvy / (Math.hypot(cvx, cvy) || 1), sp: cs, st: 'out', dist: SH.range * 0.45, w: 0, bounced: (c.bounced || 0) + 1 });
      Object.assign(b, { vx: bvx / (Math.hypot(bvx, bvy) || 1), vy: bvy / (Math.hypot(bvx, bvy) || 1), sp: bs, st: 'out', dist: SH.range * 0.45, w: 0, bounced: (b.bounced || 0) + 1 });
      c.x -= ux * 4; c.y -= uy * 4; b.x += ux * 4; b.y += uy * 4; c.clank = 0.2;
      const mx = (c.x + b.x) / 2, my = (c.y + b.y) / 2, off = rand(0, TAU);
      for (let i = 0; i < SH.spark; i++) { const ang = off + i / SH.spark * TAU; G.eproj.push({ x: mx, y: my, ang, sp: SH.sparkSp, r: 3, dmg: e.atk * 0.4, t: 1.6, hist: [], kind: 'quill' }); }
      G.fx.push({ kind: 'ring', px: true, x: mx, y: my, r: 4, t: 0.3, max: 0.3, c: '#ffd34d', grow: 160 }); sparks(mx, my - 10, 0, '#ffd34d', 14); sfx('block'); sfx('blast'); addShake(2);
    }
    c.clank = (c.clank || 0) - dt;
  }
  function updateShrew(e, dt, d, a, moveTo) {
    const P = G.player, ph2 = e.hp < e.maxHp * 0.5;
    if (e.stam == null) { e.stam = 2; e.chak = { st: 'held', x: e.x, y: e.y }; e.aim = a; e.side = e.type === 'shrewA' ? 1 : -1; }
    if (e.stam < 2) { e.stamT = (e.stamT || 0) + dt; if (e.stamT >= PD.dodgeCharge) { e.stamT = 0; e.stam++; } }
    if (e.bro && e.bro.dead && !e.rage) { e.rage = true; e.spd *= 1.3; banner('복수!', `${ELITE_NAMES[e.type]}이(가) 분노했다`); sfx('growl', 1.1); e.haste = 0; }
    e.recoil = Math.max(0, (e.recoil || 0) - dt * 30);
    chakTick(e, dt);
    if (!e.ps) { e.ps = 'intro'; e.t = 1.0; e.fadeA = 0; e.cd = 0.3 + (e.type === 'shrewB' ? 0.5 : 0); }
    if (e.ps === 'intro') { e.fadeA = clamp(1 - e.t / 1.0, 0, 1); if (e.t <= 0) { e.ps = 'move'; e.fadeA = 1; } return; }
    if (invDodgeTick(e, dt)) return;
    if (e.ps !== 'spin' && e.ps !== 'dash') { const da = pandaThreat(e, d, a); if (da != null && pandaDodge(e, da)) { e.t = 0; return; } }
    const held = e.chak.st === 'held';
    if (e.ps === 'move') {
      e.aim = a; e.face = Math.cos(a) >= 0 ? 1 : -1;
      if (e.chak.st === 'drop') { const c = e.chak, ca = Math.atan2(c.y - e.y, c.x - e.x); moveTo(ca, e.spd * 1.15); e.moving = true; if (Math.hypot(c.x - e.x, c.y - e.y) < 14) { c.st = 'held'; sfx('blip'); } return; } // 주우러 감
      // 형제가 반대편에 서도록 (플레이어 기준으로 갈라섬)
      const bro = e.bro && !e.bro.dead ? e.bro : null, base = bro ? Math.atan2(bro.y - P.y, bro.x - P.x) + Math.PI : Math.atan2(e.y - P.y, e.x - P.x);
      const want = e.rage ? 130 : SH.flank, tx = clamp(P.x + Math.cos(base + (e.orbit || 0)) * want, A.x0 + 20, A.x1 - 20), ty = clamp(P.y + Math.sin(base + (e.orbit || 0)) * want * 0.8, A.y0 + 20, A.y1 - 20);
      e.orbit = (e.orbit || 0) + dt * 0.6 * e.side;
      if (Math.hypot(tx - e.x, ty - e.y) > 14) { moveTo(Math.atan2(ty - e.y, tx - e.x), e.spd); e.moving = true; } else e.moving = false;
      e.face = Math.cos(a) >= 0 ? 1 : -1;
      if (e.cd <= 0 && held) {
        e.moving = false;
        const broReady = bro && bro.ps === 'move' && bro.chak.st === 'held' && bro.cd < 0.4;
        const r = Math.random();
        if (broReady && e.type === 'shrewA' && r < 0.5) { for (const s of [e, bro]) { s.ps = 'throw'; s.t = SH.wind + 0.1; s.lockAng = angTo(s, P); s.curve = 0; G.tele.push({ shape: 'line', x: s.x, y: s.y, ang: s.lockAng, len: SH.range, w: 12, t: 0, dur: s.t, owner: s, thin: true }); } return; } // 협공: 둘이 동시에 — 가운데서 부딪히기 쉬움
        if (d < 80 || (r < 0.25 && d < 160)) { e.ps = 'spinWind'; e.t = 0.38; sfx('warn'); G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 150, w: 30, t: 0, dur: 0.38, owner: e, heavy: true }); e.lockAng = a; return; } // 회전 칼날 돌진
        e.ps = 'throw'; e.t = SH.wind; e.lockAng = a; e.curve = r < 0.6 ? 0 : (Math.random() < 0.5 ? 1 : -1) * SH.curveW;
        G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: e.curve ? 120 : SH.range, w: 12, t: 0, dur: SH.wind, owner: e, thin: true });
      }
      return;
    }
    if (e.ps === 'throw') { e.aim = e.lockAng; if (e.t <= 0) { chakThrow(e, e.curve ? e.lockAng - e.curve * 0.32 : e.lockAng, e.curve); e.ps = 'after'; e.t = 0.2; e.cd = rand(...SH.cd) * (e.rage ? 0.7 : 1) * (ph2 ? 0.8 : 1); } return; }
    if (e.ps === 'spinWind') { e.aim += dt * 20; if (e.t <= 0) { e.ps = 'spin'; e.t = SH.spinDash; e.hitOnce = false; sfx('whoosh'); } return; }
    if (e.ps === 'spin') { // 차크람을 몸 둘레로 돌리며 돌진
      e.aim += dt * 24; e.x += Math.cos(e.lockAng) * e.spd * 3 * dt; e.y += Math.sin(e.lockAng) * e.spd * 3 * dt; solveObs(e, e.r);
      e.x = clamp(e.x, A.x0 + 8, A.x1 - 8); e.y = clamp(e.y, A.y0 + 8, A.y1 - 8);
      if (!e.hitOnce && Math.hypot(P.x - e.x, P.y - e.y) < 24 + P.r) { e.hitOnce = true; hurtPlayer(e.atk * 0.8, e); }
      if (Math.random() < 0.6) G.parts.push({ x: e.x + rand(-10, 10), y: e.y - rand(4, 16), vx: 0, vy: -10, t: 0.25, c: e.type === 'shrewB' ? '#ffd34d' : '#d8dce4', g: 0, glow: true });
      if (e.t <= 0) { e.ps = 'after'; e.t = 0.3; e.cd = rand(...SH.cd); if (ph2 || e.rage) { const off = rand(0, TAU); for (let i = 0; i < 8; i++) G.eproj.push({ x: e.x, y: e.y, ang: off + i / 8 * TAU, sp: 150, r: 3, dmg: e.atk * 0.4, t: 1.4, hist: [], kind: 'quill' }); sfx('block'); } }
      return; }
    if (e.ps === 'after') { if (e.t <= 0) e.ps = 'move'; return; }
  }
  function drawShrew(e, ya, al, white) {
    const I = invInit(), flip = e.face < 0, mp = INV_MAP[e.type], gold = e.type === 'shrewB', c = e.chak;
    if (c && c.st !== 'held') { // 날아가는·떨어진 차크람 (칸 단위로 회전)
      const fl = gold ? I.chakBf : I.chakAf; ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect((Math.round(c.x) & ~1) - 8, Math.round(c.y) & ~1, 16, 2);
      if (c.st === 'drop') drawBlade(fl, c.x, c.y - 4, 0.3, Math.floor(time * 4) % 2 ? 1 : 0.7); else drawBlade(fl, c.x, c.y - 10, c.spin);
    }
    if (e.ps === 'dodge' && e.t < BLINK) return;
    drawShadow(e.x, e.y + 1, 7);
    const wf = invWalk(e), bob = wf % 2 ? 2 : 0, hx = e.x + e.face * 6, hy = e.y - 8 + ya + bob; // v2.43 새 도트(작은 키): 옆구리의 손
    if (e.ps === 'intro') drawSprite(mp, mp, 2, e.x, e.y + 2 + ya, flip, { white: true, alpha: (1 - al) * 0.9 });
    if (e.rage && Math.floor(time * 8) % 2) drawSprite(walkMap(mp, wf), mp, 2, e.x, e.y + 2 + ya, flip, invOpt(e, { white: true, alpha: 0.25 }));
    drawSprite(walkMap(mp, wf), mp, 2, e.x, e.y + 2 + ya, flip, invOpt(e, { white, alpha: al }));
    if (c && c.st === 'held' && !white) {
      if (e.ps === 'spin' || e.ps === 'spinWind') drawBlade(gold ? I.chakBf : I.chakAf, e.x + Math.cos(e.aim) * 16, e.y - 8 + Math.sin(e.aim) * 10, e.aim * 2, al);
      else drawBlade(gold ? I.chakB : I.chakA, hx - (e.recoil || 0) * e.face, hy + 4, e.ps === 'throw' ? e.lockAng + Math.PI : 15 * DEG * e.face + (e.face < 0 ? Math.PI : 0), al);
    }
    if (e.ps === 'throw' && al > 0.5) holdGlow(e.x - e.face * 6, e.y - 18, 1 - e.t / SH.wind, gold ? '255,210,90' : '220,225,240');
  }

  // ================================================================ v1.65 난입자 4장: 무법자 「검은 안대」 (족제비, 쌍권총)
  // 거너처럼 탄창이 있다: 12발을 다 쏘면 권총을 돌리며 재장전(공격 기회). 두 자루를 번갈아 쏘고, 제자리에서 돌며 나선을 그리고, 구르고 나서 바로 쏜다
  const WS = { mag: 12, reload: [1.1, 0.8], keep: [120, 200], twinN: 6, twinGap: 0.1, twinSp: 330, spiralN: 18, spiralGap: 0.07, spiralSp: 195, fanN: 7, fanSp: 265, fanGap: 0.13, cd: [0.35, 0.65] };
  function weaselShot(e, ang, sp, dmgK, hand) {
    if (e.ammo <= 0) return false; e.ammo--; e.hand = hand == null ? 1 - (e.hand || 0) : hand;
    const mx = e.x + Math.cos(ang) * 16, my = e.y + Math.sin(ang) * 12 - (e.hand ? 0 : 3);
    G.eproj.push({ x: mx, y: my, ang, sp, r: 3, dmg: e.atk * dmgK, t: 2.6, hist: [], kind: 'ember' });
    G.fx.push({ kind: 'muzzle', x: mx, y: my - 10, ang, s: 0.6, t: 0.18, max: 0.18, col: '#ffd080' }); e.recoil = 3; // v2.50 도트 총구 섬광 e.kick = e.hand; sfx('shot', 1.2 + Math.random() * 0.2);
    return true;
  }
  function updateWeasel(e, dt, d, a, moveTo) {
    const P = G.player, ph2 = e.hp < e.maxHp * 0.5;
    if (e.stam == null) { e.stam = 2; e.ammo = WS.mag; e.aim = a; e.spin = 0; }
    if (e.stam < 2) { e.stamT = (e.stamT || 0) + dt; if (e.stamT >= PD.dodgeCharge) { e.stamT = 0; e.stam++; } }
    e.recoil = Math.max(0, (e.recoil || 0) - dt * 30);
    if (!e.ps) { e.ps = 'intro'; e.t = 1.0; e.fadeA = 0; e.seq = 0; e.cd = 0.3; }
    if (e.ps === 'intro') { e.fadeA = clamp(1 - e.t / 1.0, 0, 1); e.aim = a; if (e.t <= 0) { e.ps = 'move'; e.fadeA = 1; } return; }
    if (invDodgeTick(e, dt)) { if (e.ps === 'move' && e.rollShot) { e.rollShot = false; startWeaselPat(e, 'fan', angTo(e, P), ph2); } return; }
    if (e.ps !== 'reload' && e.ps !== 'spiral') { const da = pandaThreat(e, d, a); if (da != null && pandaDodge(e, da)) { e.t = 0; e.rollShot = e.ammo >= 5 && Math.random() < 0.6; return; } } // 구른 뒤 바로 부채 난사
    if (e.ps === 'reload') { // 권총을 두 바퀴 돌리며 재장전 — 이때가 공격 기회
      e.spin += dt * 22 * e.face; moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.35); e.moving = true;
      if (e.t <= 0) { e.ammo = WS.mag; e.ps = 'move'; e.cd = 0.15; sfx('blip', 0.8); burst(e.x, e.y - 14, '#ffd080', 6); }
      return;
    }
    if (e.ps === 'move') {
      e.aim += angDiff(a, e.aim) * Math.min(1, dt * 12);
      if (d < WS.keep[0]) moveTo(a + Math.PI + (e.strafe || 1) * 0.5, e.spd);
      else if (d > WS.keep[1]) moveTo(a + (e.strafe || 1) * 0.35, e.spd);
      else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.75);
      e.moving = true; e.face = Math.cos(a) >= 0 ? 1 : -1;
      if (Math.random() < dt * 0.9) e.strafe = -(e.strafe || 1);
      if (e.ammo <= 0) { e.ps = 'reload'; e.t = WS.reload[ph2 ? 1 : 0]; e.spin = 0; sfx('reload'); return; }
      if (e.stam >= 2 && Math.random() < dt * 0.6) { if (pandaDodge(e, a + Math.PI / 2 * (e.strafe || 1))) { e.rollShot = e.ammo >= 5; return; } }
      if (e.cd <= 0) { const seq = ph2 ? ['twin', 'spiral', 'fan', 'twin', 'dump'] : ['twin', 'fan', 'spiral', 'twin']; const pat = e.forcePat || seq[e.seq++ % seq.length]; e.moving = false; startWeaselPat(e, pat, a, ph2); }
      return;
    }
    if (e.ps === 'twin') { // 두 자루 번갈아 연사 (매 발 다시 조준)
      e.aim += angDiff(a, e.aim) * Math.min(1, dt * 7); moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.45); e.face = Math.cos(e.aim) >= 0 ? 1 : -1;
      if (e.t <= 0) { e.bt -= dt; if (e.bt <= 0) { e.bt = WS.twinGap; if (!weaselShot(e, e.aim + rand(-0.06, 0.06), WS.twinSp, 0.45) || --e.n <= 0) { e.ps = 'after'; e.t = 0.2; e.cd = rand(...WS.cd); } } }
      return;
    }
    if (e.ps === 'fan') { e.aim = e.lockAng; if (e.t <= 0) { for (let i = 0; i < e.n; i++) weaselShot(e, e.lockAng + (i - (e.n - 1) / 2) * WS.fanGap, WS.fanSp, 0.45, i % 2); sfx('blast'); e.ps = 'after'; e.t = 0.25; e.cd = rand(...WS.cd); } return; }
    if (e.ps === 'spiral') { // 제자리에서 돌며 두 자루를 반대로 — 두 갈래 나선 (탄창 비우기는 네 갈래)
      if (e.t > 0) return;
      e.bt -= dt; e.aim += dt * 4.2 * e.dir;
      if (e.bt <= 0) { e.bt = WS.spiralGap; const arms = e.dump ? 4 : 2; let ok = true; for (let k = 0; k < arms; k++) ok = weaselShot(e, e.aim + k * TAU / arms, WS.spiralSp, 0.4, k % 2) && ok; if (!ok || --e.n <= 0) { e.ps = 'after'; e.t = 0.25; e.cd = rand(...WS.cd); } }
      return;
    }
    if (e.ps === 'after') { if (e.t <= 0) e.ps = 'move'; return; }
  }
  function startWeaselPat(e, pat, a, ph2) {
    e.lockAng = a; e.face = Math.cos(a) >= 0 ? 1 : -1;
    if (pat === 'twin') { e.ps = 'twin'; e.t = 0.22; e.n = WS.twinN + (ph2 ? 2 : 0); e.bt = 0; G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 170, w: 8, t: 0, dur: 0.22, owner: e, thin: true }); }
    else if (pat === 'fan') { e.ps = 'fan'; e.t = 0.32; e.n = Math.min(e.ammo, WS.fanN); for (let i = 0; i < e.n; i++) G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a + (i - (e.n - 1) / 2) * WS.fanGap, len: 120, w: 8, t: 0, dur: 0.32, owner: e, thin: true }); }
    else if (pat === 'spiral' || pat === 'dump') { e.ps = 'spiral'; e.dump = pat === 'dump'; e.t = 0.38; e.bt = 0; e.dir = Math.random() < 0.5 ? 1 : -1; e.n = e.dump ? 9 : WS.spiralN / 2 | 0; if (e.dump) e.ammo = Math.max(e.ammo, 36);
      G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 34, t: 0, dur: 0.38, owner: e, thin: true }); sfx('warn'); }
  }
  function drawWeasel(e, ya, al, white) {
    const I = invInit(), flip = e.face < 0;
    if (e.ps === 'dodge' && e.t < BLINK) return;
    drawShadow(e.x, e.y + 1, 8);
    const wf = invWalk(e), bob = wf % 2 ? 2 : 0, rc = e.recoil || 0;
    const reload = e.ps === 'reload', spiral = e.ps === 'spiral' && e.t <= 0;
    const a0 = reload ? e.spin : e.aim, a1 = reload ? -e.spin + 0.6 : spiral ? e.aim + (e.dump ? Math.PI / 2 : Math.PI) : e.aim - 0.12 * e.face;
    const back = [e.x - e.face * 6 - Math.cos(a1) * (e.kick === 0 ? rc : 0), e.y - 6 + ya + bob - Math.sin(a1) * (e.kick === 0 ? rc : 0)], front = [e.x + e.face * 6 - Math.cos(a0) * (e.kick === 1 ? rc : 0), e.y - 5 + ya + bob - Math.sin(a0) * (e.kick === 1 ? rc : 0)]; // v2.43 새 도트: 양 옆구리의 손
    if (!white) drawBlade(I.pistol, back[0], back[1], a1, al);
    if (e.ps === 'intro') drawSprite('invWeasel', 'invWeasel', 2, e.x, e.y + 2 + ya, flip, { white: true, alpha: (1 - al) * 0.9 });
    drawSprite(walkMap('invWeasel', wf), 'invWeasel', 2, e.x, e.y + 2 + ya, flip, invOpt(e, { white, alpha: al }));
    if (!white) drawBlade(I.pistol, front[0], front[1], a0, al);
    if ((e.ps === 'fan' || e.ps === 'twin' || e.ps === 'spiral') && e.t > 0 && al > 0.5) holdGlow(e.x + e.face * 8, e.y - 12, 1 - e.t / 0.38, '255,170,80');
  }
  // ================================================================ v1.57 난입: 챕터마다 가장 큰 전투 방 하나를 무작위로 골라 두고, 그 방을 클리어하면 난입자가 나타난다
  const INV_KIND = { 1: 'panda', 2: 'reaper', 3: 'shrews', 4: 'weasel' };
  // 난입자 대사: 등장할 때 머리 위, 쓰러질 때 쓰러진 자리에 도트 말풍선
  const INV_LINES = {
    panda: { in: '거기, 움직이지 마. 볼트 아까우니까.', out: '이번 사냥감은… 제법 질기군.' },
    reaper: { in: '…그림자가 하나 더 늘었군.', out: '…수확은 다음 밤으로.' },
    shrewA: { in: '각을 좁혀라. 빠져나갈 틈은 없다.', out: '…마무리 지어라.', last: '여기까지인가.' }, // out: 아우가 살아 있을 때 · last: 마지막으로 쓰러질 때
    shrewB: { in: '양쪽 다 신경 쓰일 텐데.', out: '미안하게 됐네, 형.', last: '혼자 가긴 심심하지 않겠어.' }, // out: 형이 살아 있을 때 · last: 마지막으로 쓰러질 때
    weasel: { in: '재투성이가 아직도 살아 있나?', out: '하… 한 발만 더 빨랐어도.' },
  };
  function sayEnemy(e, text, delay = 0, dur = 3.4) { if (e && text) e.say = { text, from: time + delay, until: time + delay + dur }; }
  function enemySays() { // 렌더에서 말풍선 큐에 넣는다
    for (const e of G.enemies) if (!e.dead && e.say && time >= e.say.from && time < e.say.until) drawBubble(e.say.text, e.x, e.y - 38 - (e.z || 0), 0);
    if (G.deadSays) { G.deadSays = G.deadSays.filter(d => time < d.until); for (const d of G.deadSays) drawBubble(d.text, d.x, d.y, 0); }
  }
  const INV_MAP = { weasel: 'invWeasel', panda: 'invPanda', reaper: 'invReaper', shrewA: 'invShrew', shrewB: 'invShrewB' }; // 2·3·4장 난입자는 다음 작업
  function ascBoss(b) { const kh = ASCF.eHp() * ASCF.bossHp(); b.hp *= kh; b.maxHp *= kh; b.atk *= ASCF.eAtk(); b.ascRise = ascOn(10); }
  // v1.96 잿빛 왕관(10단계): 정예 특성 · 보스가 HP 30% 아래로 처음 떨어지면 최대 HP 20% 회복하며 다시 일어섬
  const ASC_AFF = { fast: { n: '날랜', c: ['#9fd2ff', '#e4f2ff'] }, tough: { n: '단단한', c: ['#c8c8d0', '#8a8a96'] }, fury: { n: '격노한', c: ['#ff5040', '#ffb090'] } };
  function ascTick(dt) {
    if (!ascOn(10) || !G.enemies) return;
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (e.ascAff && Math.random() < dt * 5) G.parts.push({ x: e.x + rand(-8, 8), y: e.y - rand(4, 24), vx: 0, vy: -rand(15, 35), t: 0.45, c: pick(ASC_AFF[e.ascAff].c), g: 0, glow: true });
      if (e.type === 'boss' && e.ascRise && e.hp < e.maxHp * 0.3) { e.ascRise = false; e.ascRisen = true; e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.2); banner('잿빛 왕관', '재의 힘으로 다시 일어선다'); sfx('boss'); addShake(5); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 14, r: 10, grow: 260, t: 0.6, max: 0.6, c: '#ffb040' }); }
    }
  }
  function markInvader(D, stage) {
    const k = INV_KIND[stage]; if (!k) return;
    const fight = D.rooms.filter(r => r.type === 'combat' || r.type === 'survive'); if (!fight.length) return;
    const area = r => SHAPES[r.shape].w * SHAPES[r.shape].h, mx = Math.max(...fight.map(area));
    pick(fight.filter(r => area(r) === mx)).invade = k;
    if (ascOn(7)) { const rest = fight.filter(r => !r.invade).sort((a, b) => area(b) - area(a)); if (rest.length) rest[0].invade = k; } // v1.96 침입자의 땅
  }
  function startInvasion(R) {
    const P = G.player, k = R.invade || 'panda';
    G.rs.state = 'invade'; G.rs.t = 0; if (!G.sealed) sealRoom(true);
    let best = null, bd = -1; // 플레이어에게서 먼 빈자리
    for (let i = 0; i < 24; i++) { const x = rand(A.x0 + 40, A.x1 - 40), y = rand(A.y0 + 40, A.y1 - 40); if (obsHitL(G.obs, x, y, 16)) continue; const d = Math.hypot(x - P.x, y - P.y); if (d > bd && d < 420) { bd = d; best = { x, y }; } }
    if (!best) best = freePoint(CX, A.y0 + 60);
    invInit();
    const rings = [best];
    if (k === 'shrews') { // v1.88 형제는 플레이어를 가운데 두고 왼쪽(형)·오른쪽(아우)에서 동시에 등장
      const side = sx => { for (const dd of [150, 130, 110, 90, 70, 50]) for (const dy of [0, -16, 16, -32, 32]) { const x = clamp(P.x + sx * dd, A.x0 + 30, A.x1 - 30), y = clamp(P.y + dy, A.y0 + 30, A.y1 - 30); if (Math.abs(x - P.x) >= 40 && !obsHitL(G.obs, x, y, 16)) return { x, y }; } return freePoint(P.x + sx * 100, P.y); };
      const L = side(-1), Rt = side(1);
      const a2 = makeEnemy('shrewA', L.x, L.y), b2 = makeEnemy('shrewB', Rt.x, Rt.y); a2.bro = b2; b2.bro = a2; G.enemies.push(a2, b2);
      sayEnemy(a2, INV_LINES.shrewA.in, 0.3, 2.0); sayEnemy(b2, INV_LINES.shrewB.in, 2.3); // 형이 먼저 말하고 끝나면 아우가 이어서 (말풍선이 겹치지 않게)
      rings.length = 0; rings.push(L, Rt);
    }
    else { const iv = makeEnemy(k, best.x, best.y); G.enemies.push(iv); if (INV_LINES[k]) sayEnemy(iv, INV_LINES[k].in, 0.3); }
    banner('난입!', `${ELITE_NAMES[k]}이(가) 난입했다`); sfx('warn'); sfx('growl', 0.9); addShake(3);
    for (const q of rings) G.fx.push({ kind: 'ring', x: q.x, y: q.y, r: 6, t: 0.6, max: 0.6, c: '#ff4030', grow: 160 });
  }
  // ================================================================ v2.03 적 상태 효과 (둔화·기절). 적마다 시간 배율 → 움직임·공격 예고가 같이 느려지거나 멈춤
  // 보스는 지속 30%·기절은 둔화로, 정예는 60%. 같은 효과를 4초 안에 다시 맞으면 지속 ×0.7씩 (저항)
  function applySt(e, k, dur, power, full) {
    if (!e || e.dead || e.type === 'flag') return; const boss = e.type === 'boss';
    if (full) { e.st = e.st || {}; if (k === 'stun') e.st.stunT = Math.max(e.st.stunT || 0, dur); return; } // v2.35 역습 경직: 보스·정예·난입도 줄지 않음
    e.st = e.st || {}; const R = e.stRes = e.stRes || {}, r = R[k] && time - R[k].t < 4 ? R[k].n : 0; R[k] = { t: time, n: r + 1 };
    let d = dur * (boss ? 0.3 : isElite(e) ? 0.6 : 1) * Math.pow(0.7, r);
    if ((k === 'stun' || k === 'bind') && boss) { k = 'slow'; power = 0.5; }
    if (k === 'bind') { e.st.bindT = Math.max(e.st.bindT || 0, d); }
    if (k === 'slow') { e.st.slowT = Math.max(e.st.slowT || 0, d); e.st.slowK = Math.min(e.st.slowK || 1, power || 0.5); }
    if (k === 'stun') { e.st.stunT = Math.max(e.st.stunT || 0, d); }
  }
  const stScale = e => { const S = e && e.st; if (!S) return 1; if (S.stunT > 0 || S.bindT > 0) return 0; let k = S.slowT > 0 ? S.slowK : 1; if (S.hsT > 0) k = Math.min(k, S.hsK); return k; }; // v2.11 hs*: 표시 없는 둔화(수프)
  function stTick(e, dt) { const S = e.st; if (!S) return; if (S.hsT > 0) S.hsT -= dt; if (S.slowT > 0) { S.slowT -= dt; if (S.slowT <= 0) S.slowK = 1; } if (S.stunT > 0) S.stunT -= dt; if (S.bindT > 0) S.bindT -= dt; if (S.tsT > 0) S.tsT -= dt; if (S.moonT > 0) { S.moonT -= dt; if (S.moonT <= 0) S.moonS = S.moonD = false; } }
  function updateEnemy(e, dt) {
    const P = G.player;
    e.flash = Math.max(0, e.flash - dt); e.rise = Math.max(0, e.rise - dt);
    e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= Math.pow(0.0015, dt); e.vy *= Math.pow(0.0015, dt);
    e.lean *= Math.pow(0.02, dt);
    e.glow = 0;
    for (const t of G.tele) if (t.owner === e) e.glow = Math.max(e.glow, t.t / t.dur);
    if (e.blade) updateBlade(e, dt);
    if (e.type === 'butcher') eliteTick(e, dt);
    if (e.type === 'slime' || e.type === 'bigslime' || e.type === 'toxslime') e.squash = Math.max(0, e.squash - dt);
    if (e.type === 'gbrute') bruteTick(e, dt);
    if (e.type === 'boar') boarTick(e, dt);
    if (e.type === 'crow') crowTick(e, dt);
    if (e.type === 'mother') motherTick(e, dt);
    if (e.orc) orcTick(e, dt);
    if (e.rallyT > 0) { e.rallyT -= dt; if (e.rallyT <= 0 && e.rallied) { e.atk = e.atkBase; e.rallied = false; } }
    if (e.type === 'mordred') mordredTick(e, dt); else if (e.type === 'queen') queenTick(e, dt); else if (e.type === 'exec') execTick(e, dt); else if (e.type === 'bearer') bearerTick(e, dt); else if (e.type === 'flag') flagTick(e, dt);
    if (e.haste > 0) { e.haste -= dt; if (Math.random() < dt * 8) G.parts.push({ x: e.x + rand(-5, 5), y: e.y - rand(20, 30), vx: 0, vy: -20, t: 0.3, c: '#ff6040', g: 0, glow: true }); }
    if (e.grogiT > 0) { e.grogiT -= dt; e.bladeTarget = 90 * DEG; if (e.grogiT <= 0) e.state = 'chase'; return; }
    const d = dist(e, P), a = angTo(e, P);
    e.t -= dt; e.cd -= dt;
    const moveTo = (ang, spd) => { if (e.haste > 0) spd *= 1.5; if (e.rallyT > 0) spd *= 1.25; if (e.state === 'chase' && d > 130 && Math.abs(angDiff(ang, a)) < 0.6) spd *= 1.3; ang = steer(e, ang); e.x += Math.cos(ang) * spd * dt; e.y += Math.sin(ang) * spd * dt; e.walk += dt * spd / 7; if (Math.abs(Math.cos(ang)) > 0.2) e.face = Math.cos(ang) > 0 ? 1 : -1; };
    if (e.state === 'chase' && e.blade && !e.sw) e.bladeTarget = restAng(e);
    if (e.state === 'stun') { if (e.t <= 0) e.state = 'chase'; return; }
    if (e.state === 'recover') { if (e.t <= 0) e.state = 'chase'; return; }
    if (e.state === 'hold') {
      if (e.blade && !e.slammed && e.t <= 0.07) { e.slammed = true; const to = e.holdAng + e.face * 70 * DEG; e.bladeAng += angDiff(to, e.bladeAng) * 0.6; startSwing(e, to, e.face, 0.07); } // v0.95 종자: 판정 순간 칼이 내려와 있게
      if (e.t <= 0) { e.slammed = false;
        const tt = { shape: 'cone', x: e.x, y: e.y, ang: e.holdAng, arc: 110 * DEG, r: e.type === 'ghost' ? 38 : 30 };
        e.lean = 0.35 * e.face; e.x += Math.cos(e.holdAng) * 6; e.y += Math.sin(e.holdAng) * 6;
        G.fx.push({ kind: 'claw', x: e.x, y: e.y - 8, ang: e.holdAng, r: e.type === 'ghost' ? 28 : 22, w: 2, glow: true, c: e.type === 'ghost' ? '170,210,255' : '255,200,170', t: 0.18, max: 0.18 });
        dust(e.x + Math.cos(e.holdAng) * 14, e.y + Math.sin(e.holdAng) * 10, 4);
        hitShape(tt, e.atk); e.state = 'recover'; e.t = 0.6; e.cd = rand(0.8, 1.4);
      }
      return;
    }
    if (e.state === 'wind') return;
    if (P.dead) return;

    if (e.type === 'panda') updatePanda(e, dt, d, a, moveTo);
    else if (e.type === 'reaper') updateReaper(e, dt, d, a, moveTo);
    else if (e.type === 'shrewA' || e.type === 'shrewB') updateShrew(e, dt, d, a, moveTo);
    else if (e.type === 'weasel') updateWeasel(e, dt, d, a, moveTo);
    else if (e.orc) updateOrc(e, dt, d, a, moveTo);
    else if (e.type === 'slime' || e.type === 'bigslime') updateSlime(e, dt, d, a);
    else if (e.type === 'toxslime') updateToxSlime(e, dt, d, a);
    else if (e.type === 'gbrute') updateBrute(e, dt, d, a, moveTo);
    else if (e.type === 'boar') updateBoar(e, dt, d, a, moveTo);
    else if (e.type === 'crow') updateCrow(e, dt, d, a);
    else if (e.type === 'cantor') updateCantor(e, dt, d, a, moveTo);
    else if (e.type === 'aguard') updateAGuard(e, dt, d, a, moveTo);
    else if (e.type === 'coffin') updateCoffin(e, dt, d, a, moveTo);
    else if (e.type === 'herald') updateHerald(e, dt, d, a, moveTo);
    else if (e.type === 'mother') updateMother(e, dt, d, a, moveTo);
    else if (e.type === 'mordred') updateMordred(e, dt, d, a, moveTo);
    else if (e.type === 'queen') updateQueen(e, dt, d, a, moveTo);
    else if (e.type === 'exec') { if (e.state === 'chase') updateExec(e, dt, d, a, moveTo); }
    else if (e.type === 'bearer') { if (e.state === 'chase') updateBearer(e, dt, d, a, moveTo); }
    else if (e.type === 'flag') { /* 꽂힌 깃발: 움직이지 않음 */ }
    else if (e.type === 'ghoul' || e.type === 'ghost' || e.type === 'goblin') {
      if (e.state === 'chase') {
        if (d > 22) moveTo(a, e.spd);
        else if (e.cd <= 0) {
          // 바닥 표시 없이: 멈춰서 팔을 치켜들고 잠시 버틴 뒤 내려친다
          e.state = 'hold'; e.t = e.type === 'ghost' ? 0.7 : e.type === 'goblin' ? 0.55 : 0.6; e.holdMax = e.t; e.holdAng = a; if (e.blade) e.bladeTarget = a - (Math.cos(a) > 0 ? 1 : -1) * 120 * DEG;
          e.face = Math.cos(a) > 0 ? 1 : -1; e.lean = -0.2 * e.face;
        }
      }
    } else if (e.type === 'dog') {
      if (e.state === 'chase') {
        if (d > 120) moveTo(a, e.spd);
        else if (d < 70) moveTo(a + Math.PI, e.spd * 0.6);
        else moveTo(a + Math.PI / 2, e.spd * 0.4);
        if (e.cd <= 0 && d < 190) {
          e.state = 'wind'; e.lockAng = a; e.face = Math.cos(a) > 0 ? 1 : -1; alertMark(e, 30);
          G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 180, w: 16, t: 0, dur: 0.8, owner: e,
            onFire: () => { e.state = 'dash'; e.t = 0.5; e.hitPlayer = false; } });
        }
      } else if (e.state === 'dash') {
        e.x += Math.cos(e.lockAng) * 340 * dt; e.y += Math.sin(e.lockAng) * 340 * dt;
        if (Math.random() < 0.5) dust(e.x, e.y, 1);
        if (!e.hitPlayer && dist(e, P) < e.r + P.r + 2) { e.hitPlayer = true; hurtPlayer(e.atk, e); }
        const bonk = dashBlocked(e); if (bonk) { solveObs(e, e.r); dust(e.x, e.y, 6); addShake(2, e.lockAng); }
        if (e.t <= 0 || bonk) { e.state = 'recover'; e.t = bonk ? 1.1 : 0.9; e.cd = rand(1.4, 2.2); }
      }
    } else if (e.type === 'butcher') {
      if (e.state === 'dash') {
        const sp = e.enraged ? 400 : 360;
        e.x += Math.cos(e.lockAng) * sp * dt; e.y += Math.sin(e.lockAng) * sp * dt;
        G.fx.push({ kind: 'ghost', x: e.x, y: e.y, face: e.face, rot: 0.2 * e.face, t: 0.22, max: 0.22, map: e.kind === 'hob' ? 'butcher' : 'abom', pal: 'shadeB', sc: 2, glowy: true });
        if (Math.random() < 0.8) dust(e.x, e.y, 1);
        if (!e.hitPlayer && dist(e, P) < e.r + P.r + 4) { e.hitPlayer = true; hurtPlayer(e.atk * 1.1, e); }
        if (e.t <= 0 || e.x < A.x0 + e.r + 1 || e.x > A.x1 - e.r - 1 || e.y < A.y0 + e.r + 1 || e.y > A.y1 - e.r - 1 || dashBlocked(e)) {
          solveObs(e, e.r); e.state = 'recover'; e.t = 1.0; e.cd = rand(1.0, 1.6);
          addShake(6, e.lockAng); debris(e.x, e.y, 16); crack(e.x, e.y); sfx('blast');
          G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 8, t: 0.4, max: 0.4, c: '#ff4030', grow: 220 });
        }
      } else if (e.state === 'chase') {
        if (d > 40) moveTo(a, e.spd);
        if (e.cd <= 0) {
          if (d > 90 && d < 230) butcherAttack(e, a, 2);
          else if (d <= 75) butcherAttack(e, a, e.pat === 1 ? 0 : 1);
        }
      }
    } else if (e.type === 'cultist' || e.type === 'garcher') {
      // 피의 광신도: 거리를 벌리고 핏빛 구체를 쏜다
      if (e.state === 'chase') {
        if (d < 110) moveTo(a + Math.PI, e.spd);
        else if (d > 190) moveTo(a, e.spd);
        else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.5);
        if (Math.random() < dt * 0.5) e.strafe = -(e.strafe || 1);
        if (e.cd <= 0 && d < 270) {
          e.state = 'wind'; e.lockAng = a; e.face = Math.cos(a) > 0 ? 1 : -1;
          G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 300, w: 12, t: 0, dur: 0.85, owner: e, thin: true,
            onFire: () => {
              const bow = e.type === 'garcher';
              if (bow) for (const off of (Math.random() < 0.3 ? [-0.16, 0, 0.16] : [0])) G.eproj.push({ x: e.x + Math.cos(e.lockAng + off) * 10, y: e.y + Math.sin(e.lockAng + off) * 10, ang: e.lockAng + off, sp: 360, r: 3, dmg: e.atk, t: 1.2, hist: [], kind: 'arrow' });
              else G.eproj.push({ x: e.x + Math.cos(e.lockAng) * 10, y: e.y + Math.sin(e.lockAng) * 10, ang: e.lockAng, sp: 270, r: 5, dmg: e.atk, t: 1.6, hist: [] });
              if (bow) sfx('swing'); else { burst(e.x, e.y - 18, '#ff3040', 8); sfx('warn'); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 18, r: 4, t: 0.25, max: 0.25, c: '#ff5060', grow: 90 }); }
              e.state = 'recover'; e.t = 0.7; e.cd = rand(2.2, 3.2);
            } });
        }
      }
    } else if (e.type === 'bloat') {
      // 부풀어 오른 시체: 느리게 다가와 부풀어 터진다
      if (Math.random() < dt * 3) G.parts.push({ x: e.x + rand(-6, 6), y: e.y - rand(4, 18), vx: 0, vy: 30, t: 0.4, c: '#6a7a3a', g: 120 });
      if (e.state === 'chase') {
        moveTo(a, e.spd);
        if (d < 38) {
          e.state = 'wind'; alertMark(e, 38); sfx('warn');
          G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 54, t: 0, dur: 0.95, owner: e, heavy: true,
            onFire: tt => { e.exploded = true; bloatBlast(e.x, e.y, tt.r, e.atk); killEnemy(e, true); G.kills++; } });
        }
      }
    }
  }

  // 엘리트(도살꾼): 공격 3종 + 체력 50% 이하 격노
  function eliteTick(e, dt) {
    if (!e.enraged && e.hp < e.maxHp * 0.5 && !e.dead) {
      e.enraged = true; e.spd *= 1.25;
      G.fx.push({ kind: 'ring', x: e.x, y: e.y - 20, r: 8, t: 0.5, max: 0.5, c: '#ff3030', grow: 300 });
      addShake(5); sfx('roar'); alertMark(e, 70, true); burst(e.x, e.y - 24, '#ff3030', 16);
    }
    e.lift = 0;
    if (e.state === 'wind' && e.pat === 1) {
      const g = e.glow;
      e.lift = g < 0.25 ? 0 : g < 0.85 ? 26 * easeOut((g - 0.25) / 0.6) : 26 * (1 - (g - 0.85) / 0.15);
      if (e.lift > 4 && Math.random() < 0.5) G.fx.push({ kind: 'ghost', x: e.x, y: e.y - e.lift, face: e.face, rot: 0, t: 0.2, max: 0.2, map: e.kind === 'hob' ? 'butcher' : 'abom', pal: 'shadeB', sc: 2, glowy: true });
    }
    e.squash = Math.max(0, (e.squash || 0) - dt);
    // 팔: 상태마다 목표 각도, 공격 순간엔 빠르게 휘두른다
    if (e.armA == null) { e.armA = Math.PI / 2; e.armB = Math.PI / 2; e.armTrail = []; }
    const hang = Math.PI / 2, f = e.face;
    let ta, tb;
    if (e.grogiT > 0 || e.state === 'stun') { ta = hang + 0.35 * f; tb = hang - 0.25 * f; }
    else if (e.state === 'wind' && e.pat === 0) { ta = f > 0 ? -1.05 : Math.PI + 1.05; tb = hang - 0.7 * f; }
    else if (e.state === 'wind' && e.pat === 1) { ta = -Math.PI / 2 + 0.6 * f; tb = -Math.PI / 2 - 0.6 * f; }
    else if (e.state === 'wind') { ta = f > 0 ? Math.PI - 0.6 : 0.6; tb = f > 0 ? Math.PI + 0.3 : -0.3; }
    else if (e.state === 'dash') { ta = e.lockAng + Math.PI - 0.45 * f; tb = e.lockAng + Math.PI + 0.45 * f; }
    else { const sw = Math.sin(e.walk) * 0.35; ta = hang - 0.25 * f + sw; tb = hang + 0.15 * f - sw; }
    for (const k of ['A', 'B']) {
      const sw = e['sw' + k];
      if (sw) {
        sw.t += dt; e['arm' + k] = sw.from + sw.d * easeOut(sw.t / sw.dur);
        if (k === 'A') e.armTrail.push({ a: e.armA, t: 0.12 });
        if (sw.t >= sw.dur) e['sw' + k] = null;
      } else e['arm' + k] = lerpAng(e['arm' + k], k === 'A' ? ta : tb, dt * (e.state === 'wind' ? 14 : 8));
    }
    for (const s of e.armTrail) s.t -= dt;
    e.armTrail = e.armTrail.filter(s => s.t > 0);
    if (e.glow > 0 && Math.random() < 0.85) {
      const cx = e.x + e.face * 6, cy = e.y - 26 - e.lift, a = rand(0, TAU), r = rand(16, 30);
      G.parts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, t: 0.22, c: pick(['#ff3030', '#ff9060', '#a01010']), g: 0, glow: true });
    }
    if (e.enraged && Math.random() < 0.5) G.parts.push({ x: e.x + rand(-10, 10), y: e.y - rand(10, 40), vx: rand(-6, 6), vy: -rand(25, 50), t: 0.45, c: pick(['#ff3030', '#c0c0c0']), g: 0, glow: true });
  }
  function armSwing(e, k, to, side, dur) {
    const from = e['arm' + k]; let d = angDiff(to, from);
    if (side > 0 && d < 0) d += TAU; if (side < 0 && d > 0) d -= TAU;
    e['sw' + k] = { from, d, t: 0, dur };
  }
  function butcherAttack(e, a, pat) {
    const tm = e.enraged ? 0.85 : 1, side = e.face = Math.cos(a) > 0 ? 1 : -1;
    e.state = 'wind'; e.pat = pat; alertMark(e, 64); sfx('warn');
    if (pat === 0) { // 피의 손톱 할퀴기
      e.lean = -0.22 * side;
      G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: a, arc: 150 * DEG, r: 62, t: 0, dur: 0.95 * tm, owner: e, heavy: true,
        onFire: tt => {
          e.lean = 0.32 * side; e.x += Math.cos(tt.ang) * 14; e.y += Math.sin(tt.ang) * 14; hitShape(tt, e.atk);
          armSwing(e, 'A', tt.ang + side * 70 * DEG, side, 0.12); armSwing(e, 'B', tt.ang - side * 20 * DEG, side, 0.16);
          G.fx.push({ kind: 'claw', x: e.x, y: e.y - 14, ang: tt.ang, r: 50, w: 3, c: '255,70,50', glow: true, t: 0.26, max: 0.26 });
          G.fx.push({ kind: 'claw', x: e.x, y: e.y - 14, ang: tt.ang - 0.12 * side, r: 62, w: 2, c: '255,140,90', glow: true, t: 0.3, max: 0.3 });
          flashT = Math.max(flashT, 0.05); flashColor = '#ff5040';
          G.fx.push({ kind: 'claw', x: e.x, y: e.y - 14, ang: tt.ang + 0.15 * side, r: 36, w: 2, c: '255,200,180', glow: true, t: 0.2, max: 0.2 });
          G.fx.push({ kind: 'arcwave', x: e.x, y: e.y - 6, ang: tt.ang, arc: tt.arc, r0: 18, r1: 84, t: 0.28, max: 0.28, c: '255,60,40' });
          sparks(e.x + Math.cos(tt.ang) * 40, e.y + Math.sin(tt.ang) * 40, tt.ang, '#ff9070', 8);
          burst(e.x + Math.cos(tt.ang) * 30, e.y - 10, '#a3161c', 10, tt.ang);
          addShake(5, tt.ang); sfx('heavy');
          e.state = 'recover'; e.t = 0.9; e.cd = rand(1.0, 1.6);
        } });
    } else if (pat === 1) { // 도약 내려찍기
      e.lean = -0.1 * side;
      G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 70, t: 0, dur: 1.15 * tm, owner: e, heavy: true,
        onFire: tt => {
          e.lift = 0; e.squash = 0.2; hitShape(tt, e.atk * 1.2);
          armSwing(e, 'A', Math.PI / 2 + 0.4 * e.face, e.face, 0.08); armSwing(e, 'B', Math.PI / 2 - 0.2 * e.face, e.face, 0.08);
          G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 10, t: 0.45, max: 0.45, c: '#ff4030', grow: 280 });
          G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 6, t: 0.3, max: 0.3, c: '#ffe0d0', grow: 180 });
          for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU + rand(-0.2, 0.2); G.fx.push({ kind: 'arcwave', x: e.x, y: e.y, ang, arc: 40 * DEG, r0: 10, r1: 70, t: 0.3, max: 0.3, c: '255,120,80' }); }
          debris(e.x, e.y, 26); dust(e.x, e.y, 26); crack(e.x, e.y); crack(e.x + rand(-14, 14), e.y + rand(-8, 8));
          addShake(9); sfx('blast'); flashT = 0.06; flashColor = '#ff6040';
          e.state = 'recover'; e.t = 1.1; e.cd = rand(1.0, 1.6);
        } });
    } else { // 광란 돌진
      e.lockAng = a; e.lean = -0.25 * side;
      G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 230, w: 28, t: 0, dur: 0.9 * tm, owner: e, heavy: true,
        onFire: () => { e.state = 'dash'; e.t = 0.6; e.hitPlayer = false; sfx('whoosh'); addShake(3, a); dust(e.x, e.y, 10); } });
    }
  }
  function bloatBlast(x, y, r, dmg) {
    const P = G.player;
    if (!P.dead && Math.hypot(P.x - x, P.y - y) < r + P.r) hurtPlayer(dmg, null);
    G.fx.push({ kind: 'ring', x, y, r: 8, t: 0.45, max: 0.45, c: '#c8d080', grow: 220 });
    G.fx.push({ kind: 'ring', x, y, r: 6, t: 0.3, max: 0.3, c: '#ff8050', grow: 160 });
    G.fx.push({ kind: 'impact', shape: 'circle', x, y, r, t: 0.25, max: 0.25 });
    for (let i = 0; i < 30; i++) { const a = rand(0, TAU), sp = rand(60, 200); G.parts.push({ x, y: y - 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 60, t: rand(0.4, 0.8), c: pick(['#7a2a1c', '#8f9a6a', '#a3452e', '#5f6a45']), g: 300, floor: y + rand(-6, 10) }); }
    splat(x, y, 40, '70,80,30'); splat(x, y, 20);
    addShake(6); sfx('blast');
  }
  function updateEProj(dt) {
    const P = G.player;
    for (const pr of G.eproj) {
      pr.hist.push({ x: pr.x, y: pr.y }); if (pr.hist.length > 6) pr.hist.shift();
      if (pr.home && !P.dead) { const ta = Math.atan2(P.y - pr.y, P.x - pr.x); pr.ang += clamp(angDiff(ta, pr.ang), -pr.home * dt, pr.home * dt); }
      const pdt = G.tstopT > 0 ? 0 : dt; // v2.08 시간 정지
      const ox = pr.x, oy = pr.y; pr.x += Math.cos(pr.ang) * pr.sp * pdt; pr.y += Math.sin(pr.ang) * pr.sp * pdt; pr.t -= pdt;
      if (!pr.friend && G.eng && engEproj(pr)) { pr.t = 0; continue; } // v2.41 물결 장막 · 붉은 표적판
      const ec = pr.kind === 'spear' ? ['#c8a070', '#8a6a48'] : pr.kind === 'acid' ? ['#7ac843', '#b8f080'] : pr.kind === 'bile' ? ['#9ae050', '#d8f0a0'] : pr.kind === 'rock' ? ['#5b5560', '#3a3540'] : pr.kind === 'arrow' ? ['#c8ccd4', '#8a6a48'] : pr.kind === 'quill' ? ['#e0d8c0', '#8a7a60'] : pr.kind === 'tear' ? ['#ff7a30', '#ffc070'] : pr.kind === 'crescent' ? ['#c070ff', '#f4e8ff'] : pr.kind === 'ember' ? ['#ff9a3a', '#fff0c0'] : ['#ff3040', '#ff9080'];
      if (Math.random() < (pr.kind === 'rock' || pr.kind === 'arrow' || pr.kind === 'quill' || pr.kind === 'spear' ? 0.15 : 0.6)) G.parts.push({ x: pr.x + rand(-2, 2), y: pr.y - 10 + rand(-2, 2), vx: 0, vy: -12, t: 0.3, c: pick(ec), g: 0, glow: !['rock', 'arrow', 'quill', 'spear'].includes(pr.kind) });
      if (pr.friend) { for (const e of G.enemies) if (!e.dead && Math.hypot(pr.x - e.x, pr.y - (e.y - 8)) < pr.r + e.r + 4) { damageEnemy(e, 1.0, { proc: true, ang: pr.ang, kb: 160, grogi: 6, gauge: 1 }); pr.t = 0; burst(pr.x, pr.y - 10, '#ffd34d', 8); break; } }
      else if (!P.dead && !pr.passed && Math.hypot(pr.x - P.x, pr.y - P.y) < pr.r + P.r) {
        if (P.iframe > 0) { hurtPlayer(pr.dmg, null); pr.passed = true; }
        else { if (pr.poison) poisonHit(null); else hurtPlayer(pr.dmg, null); // v2.50 독 투사체는 피해 없이 중독만
 pr.t = 0; burst(pr.x, pr.y - 10, ec[0], 10); G.fx.push({ kind: 'ring', x: pr.x, y: pr.y - 10, r: 4, t: 0.25, max: 0.25, c: ec[1], grow: 90 }); }
      }
      if (pr.bounce > 0 && !segSolid(ox, oy, pr.x, pr.y) && (pr.x < A.x0 || pr.x > A.x1 || pr.y < A.y0 || pr.y > A.y1)) { // 난입자 반사 화살: 방 벽에서 한 번 튕김 (장애물엔 막힘)
        let vx = Math.cos(pr.ang), vy = Math.sin(pr.ang); if (pr.x < A.x0 || pr.x > A.x1) vx = -vx; if (pr.y < A.y0 || pr.y > A.y1) vy = -vy;
        pr.x = clamp(pr.x, A.x0 + 1, A.x1 - 1); pr.y = clamp(pr.y, A.y0 + 1, A.y1 - 1); pr.ang = Math.atan2(vy, vx); pr.bounce--; pr.hist = []; burst(pr.x, pr.y - 10, '#ffd34d', 5); sfx('blip');
      } else if (pr.x < A.x0 || pr.x > A.x1 || pr.y < A.y0 || pr.y > A.y1 || segSolid(ox, oy, pr.x, pr.y)) { pr.t = 0; burst(pr.x, pr.y - 10, ec[0], 6); }
      if (pr.t <= 0 && pr.kind === 'acid') splat(pr.x, pr.y, 6, '60,120,30');
    }
    G.eproj = G.eproj.filter(pr => pr.t > 0);
  }

  // ---------------------------------------------------------------- 보스: 타락 기사단장 발도르
  // ================================================================ v1.42 4장 보스 「잿빛 왕」 — 다 타 버린 채 허리가 굽고 뒤틀린 왕 (사용자 결정 초안 king4)
  // 숯처럼 탄 몸 · 등뼈 가시 · 옆으로 90° 돌아간 머리와 녹아 눌어붙은 왕관(세 파편: 초록·파랑·붉은) · 벌어진 갈비뼈 속 잉걸 심장 · 고리처럼 꺾여 얼굴 앞으로 휜 팔 · 왕보다 긴 왕홀
  // 움직임: 왕홀을 짚고 절뚝이며 경련하듯 칸 단위로 꺾임 / 공격 직전 머리가 45° 사이 장면을 거쳐 정면으로 홱 / 허리를 펴며 일어서 왕홀을 휘두름 (모두 2px 칸 단위)
  // 1단계 재의 왕(100~60%): 왕홀 3연격 · 왕의 행차(일직선 돌진 + 내려찍기) · 파편의 빛(초록 점액 덩이 / 파랑 그림자 걸음 베기 / 붉은 바위 가시)
  // 2단계 대관식(60~30%): 재 불길 고리 물결(틈 있음) · 「근위대, 왕비여」 모르드레드 돌진 그림자 + 왕비 눈물 고리
  // 3단계 타오르는 왕(30% 이하): 잉걸이 타오르고 넝마에 불 · 빨라짐 · 추격 중 재 비 · 15%에 「몰락」: 가장자리에서 재 벽 고리가 조여 옴(틈으로 빠져나가기)
  Object.assign(MAPS, {"akBody": [",..........................................,", "..........c.................................", ".........chc................................", "........cxhcc...............................", ".......cherchc.c............................", "......chetehxcchc...........................", ".....cseteeeehhxc.c.........................", "....cdsneehemeeercxc........................", "...cddsnfeeeemmmehhhc.......................", "...coddnfemehemmmeeetc......................", "..cddddffeeieemmimmtmmc.....................", "..cddddeeheBeheimeiimmmc....................", "..cddddeeeeeteemeecmmmmec...................", "..cddddeheBBBeheec.cmmmec...................", "..cddddteeBDDBeeec..cmiec...................", "..codddceheBBBehec...cme....................", ".cddddc.ceeeeeeec...........................", ".cddddc..cjyjyjc............................", ".cddddc..cdddddc............................", ".coddc..cdddddddc...........................", "cddddc..codododdc...........................", "cddddc...cdddddc............................", "cdddc.......................................", "cdddc.......................................", "cddc........................................", "cddc........................................", "cdc.........................................", "cdc.........................................", "cdc.........................................", ".c..........................................", "............................................", "............................................", "............................................"], "akLegL": [",..........................................,", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "...........ec..ec...........................", "..........ctc...ec..........................", "...........cmc...ec.........................", "............cmc..cmc........................", ".............cec..cec.......................", ".............cec.cec........................", ".............ceccec.........................", ".............cectc..........................", "............cteceec.........................", "...........ceeeccc..........................", "............ccc............................."], "akLegR": [",..........................................,", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", ".........ce..ct.............................", "........ce....cm............................", "........ctc....ce...........................", ".........cec....c...........................", ".........ctc................................", "..........cec...............................", ".........cec................................", "........cec.................................", ".......ctec.................................", "......ceeec.................................", ".......ccc.................................."], "akArm": [",..........................................,", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................cc..............", "...........................cetc.............", "..........................ceccmc............", ".........................cec..cec...........", "........................cec...cec...cte.....", "........................eec...cec..ceee.....", ".............................cec..ceec......", "............................cec....cc.......", ".............................ec.............", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................"], "akHeadS": [",..........................................,", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", ".....................cee....................", ".....................cAeecc.................", "....................cjyjeetc................", "....................cjvjebbte...............", "....................cjyjebCeeec.............", "....................cjqjeeebxhec............", "....................cjyjembCehec............", "....................cjzjemmbhhec............", "....................cAyjemmeeec.............", ".....................cjceeeecc..............", "......................c.cccc................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................"], "akHeadF": [",..........................................,", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", ".......................a.a.a................", "......................awawawa...............", ".....................awqwvwzwa..............", ".....................awwwwwwwa..............", ".....................allllllla..............", ".....................albblbbla..............", ".....................albClbCla..............", ".....................alllbllla..............", ".....................alxxxxxla..............", "......................alxbxla...............", "......................allllla...............", ".......................aaaaa................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................"], "akHead45": [",..........................................,", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", ".......................aaa..................", "......................awzwa.................", ".....................awwzwla................", "....................aavvwllla...............", "...................awqwwllbCla..............", "...................awqwlllbllla.............", "....................awllblblxla.............", ".....................albblbxxlla............", "......................alllxbbla.............", ".......................alxlxla..............", "........................aalla...............", "..........................aa................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................"]});
  PAL.ashking = {"a": "#0b0a0e", "b": "#0e0a0a", "c": "#120e0c", "d": "#200a08", "e": "#241c1a", "f": "#28241f", "g": "#34363c", "h": "#3a322c", "i": "#3e3430", "j": "#4a3414", "l": "#4a3e38", "m": "#62544c", "n": "#625c54", "o": "#7a2e24", "p": "#7a7e86", "q": "#7ad84a", "r": "#8a7e70", "s": "#8a847a", "t": "#8e8074", "u": "#9a9ea6", "v": "#4a8cff", "w": "#b8903e", "x": "#b8ac9c", "y": "#c8903e", "z": "#e04030", "A": "#e8c878", "B": "#ff7a30", "C": "#ffc070", "D": "#ffe0a0"};
  const AK_HAND = [29, -33], AK_W = 44, AK_H = 33;
  // v1.45 발도르: 원래 도트(26x28) 그대로 명암만 다시 칠함 / v1.46 머리·어깨·몸통·망토 자락·두 다리로 나눠(겹쳐 그려 틈 없음) 칸 단위로 움직임
  Object.assign(MAPS, {"bdHead": [",.k....................k.,", "..kk..................kk..", "..kpk....kkkkkkkk....kik..", "...kpk..kijjjjjjjk..kik...", "....kikkijjfffffffkkik....", ".....kkijjffddddddakk.....", "......kjaaaaaaaaaaak......", "......kjakkkkkkkkkkk......", "......kjdkkvvkkvvkkk......", "......kjffaaadjjjdak......", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", ".........................."], "bdUpper": [",........................,", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "......kjffaaadjjjdak......", "...kkkkadddunnfdaaakkkk...", "..ksssskkaaaaaaaakkohbbk..", "..khhhobssbxuxtsbhhhhbxk..", "...kbbbbubbjjjabbubbbbk...", "..kuxtuxtuxjddcuxtuxtuk...", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", ".........................."], "bdLower": [",........................,", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "...kbbbbubbjjjabbubbbbk...", "..kuxtuxtuxjddcuxtuxtuk...", "..ksssossbjaadcassssohbk..", "..kssohohbjaundasooohhbk..", "..ksoohhbbjavvjchohohebk..", ".kssooohbjjdunjdahooheek..", ".ksssohhbjfffjddahooheebk.", ".kssohhbbaaaaaaaahooheebk.", ".kssohhbjukkukkukkooheebk.", "kssooeheafjjadjdaasoeeeek.", "..........................", "..........................", "..........................", "..........................", ".........................."], "bdHem": [",........................,", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", ".kssohhbjukkukkukkooheebk.", "kssooeheafjjadjdaasoeeeek.", "ksooheheo....b....sheeeebk", "ksbhbbeeb....b....hbbbebbk", "kbbkbkkbb....b....kbkkbbk.", "kbkkbkkbk....b....kbkkbk..", ".k..k..k.....k.....k..k..."], "bdLegL": [",........................,", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", ".........bfda.............", ".........bjda.............", ".........kdda.............", ".........kaaa.............", ".........kkkk............."], "bdLegR": [",........................,", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..............fdao........", "..............jdab........", "..............ddab........", "..............aaak........", "..............kkkk........"], "bdHeadG": [",.k....................k.,", "..kk..................kk..", "..kpk....kkkkkkkk....kik..", "...kpk..kijjjjjjjk..kik...", "....kikkijjfffffffkkik....", ".....kkijjffddddddakk.....", "......kjaaaaaaaaaaak......", "......kjakkkkkkkkkkk......", "......kjdkkZZkkZZkkk......", "......kjffaaadjjjdak......", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", "..........................", ".........................."]});
  Object.assign(PAL, { bdr: {"k": "#050407", "a": "#1d1a24", "b": "#2a070b", "c": "#2a2534", "d": "#3a3448", "e": "#3e0d14", "f": "#4d465c", "h": "#561420", "i": "#57506a", "j": "#655d7a", "n": "#6d1c83", "o": "#6e1a24", "p": "#7a7090", "s": "#8e2632", "t": "#a87a30", "u": "#b450d8", "v": "#d17aff", "x": "#e0b860", "Z": "#fff0ff"} });
  // v1.47 크루가쉬 리디자인 (발도르·잿빛 왕과 같은 결): 뿔 투구 + 재의 왕관 파편 · 큰 엄니 · 늑대 털가죽(앞 어깨에 늑대 머리) · 털 치마 · 짧게 버틴 다리. 머리·털가죽·몸통·양옆 가죽·두 다리로 나눠 2px 단위로 움직이고, 발도르처럼 주먹 도트를 축으로 도끼만 칸 단위로 돈다
  Object.assign(MAPS, {"kgHead": [",.k..........................k.,", ".kVk........................kyk.", ".kVyk.......kkkkkkkk.......kVyk.", ".kVTk......kPPPPPPPPk......kVyk.", ".kVTTkk...kPPFFFFPPFFk...kkVyyk.", "..kTTVVkkkPPFFlltFFFFlkkkVVyyk..", "...kyTTVVyPFFFlXXFtFtlVVVyyyk...", "....kkyyyylllllXXlllllyyyykk....", "......kkkUUUUUUUUUUUUUUkkk......", "........kaaaaaaaaaaaaaa.........", "........kcLRRYRLLLRRYRi.........", "........kcLiRWLLAAiWRi..........", "........kcLiWWLAAAiWWi..........", ".........ciiWWiiiiiWWi..........", ".........cikWWkkkkkWWk..........", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................"], "kgPelt": [",..............................,", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", ".......................k..k.....", ".......................OkkOk....", "......................OOOOOGk...", "..kkkkk...............OmvGGGGkk.", ".kJJSJgkk.............OGoGGvGmmk", "kJSzJJzSg.............OGOmmmmm..", "kJgJzzzgg..............mmmW.W.Wk", "kJgozzrg................ggJJJJgk", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................"], "kgBody": [",..............................,", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "..............................kk", ".........bbbEEEEEEEEEEe....k.k..", "........buqbEwEwEEwEwwwe........", "........bqqbEEepwwwpwepe........", "........bqhbEwpRwwpwepRe........", "........bqqbEEwwRwwepREe........", "........bqhbEEwwwRepREEe........", "........bqqbEwwwwwRREEwe........", "........bqhbEwpwpwEEEwwe........", "........bbbbeeeeeeeeeeee........", ".......dDDDDDdUUUUDDDDDDddd.....", "......kdddddddUkkUddddddddd.....", ".....kIIIIIIjjQQQnjIIIIIIIj.....", ".....kIjjjBjjQQHHnjjjsBjBjjj....", "......kj...jkknnnnk...jjkjkk....", "..............kkkk.......k......", "................................", "................................", "................................", "................................"], "kgSide": [",..............................,", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "kJgoJgrg................Jgozzzgk", "kJzoJgog................JgoJgrgk", "kJzJJgog................JzoJgogk", "kJzgrzog................JzgJgogk", "kJzgoJJg................Jzgozogk", "kJzgoJzg................JzgoJJgk", "kJzroJgg................ggroJggk", "kJzzJgg....................JJgk.", "kJzrgg.....................Jggk.", ".kgrg......................ggk..", ".kgkg.......................Wk..", "kgk.k.......................k...", ".k..............................", "................................", "................................", "................................", "................................"], "kgLegL": [",..............................,", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "........kbb.....................", ".......kbbbbk...................", ".......kffffk...................", "......kDDDDdk...................", ".....kddddddk...................", "......kkkkkk...................."], "kgLegR": [",..............................,", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "...................kee..........", "..................keeeek........", "..................kllllkk.......", "..................kddddDDk......", "..................kdddddddk.....", "...................kkkkkkk......"], "kgFist": [".kkkkkk.", "kMMCCCpk", "kMCCCCpk", "kCkCkCkk", "kCCCCppk", "kNNNNNxk", "kNNNNxxk", ".kkkkkk."]});
  Object.assign(PAL, { kg: {"k": "#0b0a0e", "a": "#16200e", "b": "#182c0e", "c": "#1c3412", "d": "#22160c", "e": "#22401a", "f": "#26262e", "g": "#2c241c", "h": "#2c4a1c", "i": "#2c4c1c", "j": "#2e261c", "l": "#32323a", "m": "#342a20", "n": "#360c0c", "o": "#3a3024", "p": "#3e6424", "q": "#406428", "r": "#4a3e32", "s": "#4c3e2e", "t": "#54545e", "u": "#557e32", "v": "#5a4c3c", "w": "#5a8636", "x": "#5e5e6a", "y": "#64563c", "z": "#685a48", "A": "#689a40", "B": "#6a5842", "C": "#6a9a40", "D": "#7a5434", "E": "#7aa64a", "F": "#7c7c8a", "G": "#7e6e56", "H": "#8a2420", "I": "#8a7458", "J": "#8a7a64", "L": "#8cba58", "M": "#94c25e", "N": "#a4a4b0", "O": "#a89678", "P": "#b0b0bc", "Q": "#b8322c", "R": "#c42a26", "S": "#c4b49a", "T": "#cdbf9c", "U": "#d8a840", "V": "#f0e6cc", "W": "#f4ecd8", "X": "#ff5a3a", "Y": "#ffe060"} });
  const KG = { W: 32, H: 34, hand: [24, 18], wep: { cells: [".....................................................", "...................................ER.E..............", "................................ERERRERRRE...........", "...............................EErrrRRRRRR...........", ".............................EEArrrrRRRR..R..........", ".............................AAArrrrRRRRR............", "...........................ERAAAArrrrRRR.............", "...........................EAAAAArrrrRRR.............", "...........................AAAAAArrrrrRR.............", "..........................R.AAAAAArrrcR..............", "...........................A.AAAAAccccrR.............", "...........................A...AAAcrrrrR.............", "................................AAArrrrr.......m.....", ".................................AAArrrr.....nnn.....", "...................................Arrqr...nnm.......", "...................................Aqqwq.Oommm.......", "....................................ywqqoOO..........", "....................................yeeeq............", "..................................OoOyqWqr...........", ".............................q..ooOOOywqqqr..........", ".............................yOoOO....qrrrr..........", "...........................ooyOO....m.ArrrrrR........", ".........................ooOOOq.....M..ArrcrRR.......", "......................qOoOOO.........MAArrrcRRRR..R..", ".....................RyOO............MAAcrcrrRRRR.RR.", "...................Rrrq..............wkAAcrrrRRRRRRE.", "...................Rr................WAAArrrrrRRRRR..", "......................................AAAArrrrRRRRR..", "......................................AAAArrrrrRREE..", ".....................................AAAAAArrrrRR....", "....................................A.AAAAArrrREE....", "....................................AAAAAAAAEERR.....", "....................................R.EERAER.E.RR....", ".......................................E.ER.....r....", "...........................................r.........", "....................................................."].map(r => [...r]), w: 53, h: 36, px: 18, py: 26, pal: {"k": "#0b0a0e", "e": "#ff3a20", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#1a1214", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "c": "#ff8a3a", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "S": "#a89068", "g": "#7ad050", "f": "#8a7860", "F": "#5a4a3a", "p": "#e8e2d4", "q": "#d8b040", "h": "#74a04a", "l": "#527c32", "d": "#365a20", "D": "#203a12", "A": "#d83a2c", "Z": "#2a0604", "E": "#ffe8a0"}, reach: 34, rot: {} }, wepM: { cells: [".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", ".....................................................", "...........................................r.........", ".......................................E.ER.....r....", "....................................R.EERAER.E.RR....", "....................................AAAAAAAAEERR.....", "....................................A.AAAAArrrREE....", ".....................................AAAAAArrrrRR....", "......................................AAAArrrrrRREE..", "......................................AAAArrrrRRRRR..", "...................Rr................WAAArrrrrRRRRR..", "...................Rrrq..............wkAAcrrrRRRRRRE.", ".....................RyOO............MAAcrcrrRRRR.RR.", "......................qOoOOO.........MAArrrcRRRR..R..", ".........................ooOOOq.....M..ArrcrRR.......", "...........................ooyOO....m.ArrrrrR........", ".............................yOoOO....qrrrr..........", ".............................q..ooOOOywqqqr..........", "..................................OoOyqWqr...........", "....................................yeeeq............", "....................................ywqqoOO..........", "...................................Aqqwq.Oommm.......", "...................................Arrqr...nnm.......", ".................................AAArrrr.....nnn.....", "................................AAArrrrr.......m.....", "...........................A...AAAcrrrrR.............", "...........................A.AAAAAccccrR.............", "..........................R.AAAAAArrrcR..............", "...........................AAAAAArrrrrRR.............", "...........................EAAAAArrrrRRR.............", "...........................ERAAAArrrrRRR.............", ".............................AAArrrrRRRRR............", ".............................EEArrrrRRRR..R..........", "...............................EErrrRRRRRR...........", "................................ERERRERRRE...........", "...................................ER.E..............", "....................................................."].map(r => [...r]), w: 53, h: 53, px: 18, py: 26, pal: {"k": "#0b0a0e", "e": "#ff3a20", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#1a1214", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "c": "#ff8a3a", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "S": "#a89068", "g": "#7ad050", "f": "#8a7860", "F": "#5a4a3a", "p": "#e8e2d4", "q": "#d8b040", "h": "#74a04a", "l": "#527c32", "d": "#365a20", "D": "#203a12", "A": "#d83a2c", "Z": "#2a0604", "E": "#ffe8a0"}, reach: 34, rot: {} } };
  KG.fist = { cells: ["MMCCCp", "MCCCCp", "C.C.C.", "CCCCpp", "NNNNNx", "NNNNxx"].map(r => [...r]), w: 6, h: 6, px: 2.5, py: 2.5, pal: PAL.kg, rot: {} }; // v1.48 주먹도 도끼와 함께 칸 단위로 돈다 (대기 각도에서 원래 모양)
  // v1.52 기괴한 요소: 웃는 꽃 · 고기 장식 · 숨 쉬는 재 더미 · 잿빛 시민 · 크루가쉬 포효 · 잿빛 왕 빈 얼굴
  Object.assign(MAPS, {"flHead": [",....kkk....,", "...kkpPpkk...", "..kpPkkkpqk..", ".kpPkyYykpqk.", ".kPkyYyyokqk.", ".kpkyyyyokpk.", ".kqkyyyookqk.", "..kqkkookqk..", "...kkqqqkk...", ".....kkk.....", ".............", ".............", ".............", ".............", ".............", ".............", ".............", ".............", ".............", ".............", ",...........,"], "flHeadO": [",....kkk....,", "...kkpPpkk...", "..kpPkkkpqk..", ".kpPkekekpqk.", ".kPktmtmtkqk.", ".kpkmmmmmkpk.", ".kqktmtmtkqk.", "..kqkkookqk..", "...kkqqqkk...", ".....kkk.....", ".............", ".............", ".............", ".............", ".............", ".............", ".............", ".............", ".............", ".............", ",...........,"], "flStem": [",...........,", ".............", ".............", ".............", ".............", ".............", ".............", ".............", ".............", ".............", "......k......", "....kSksk....", "...kSSksk....", "....kk.ksk...", ".......kskk..", "......kksSSk.", "......ksk.kk.", "......ksk....", "......ksk....", "......ksk....", ",...kkkkkkk.,"], "mpPole": ["kkkkkkkkkkkkkkkkkk", "kbbbbbbbbbbbbbbbbk", "kBBBBBBBBBBBBBBBBk", "kbkkkkkkkkkkkkkkkk", "kbkffffffk........", "kbkfwwFffk........", "kbkfwwFffk........", "kbkffffFfk........", "kbkfffffFk........", "kbkFfFfFfk........", "kbkFk.Fk.k........", "kbkk..k...........", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kbk...............", "kkkk.............,"], "mpMeat": [",................,", "..................", "..................", ".............c....", ".............c....", ".............c....", "............kwk...", "...........kRRRk..", "..........kRrRRrk.", "..........kRRrRRk.", "..........kRRRrRk.", "...........kRRRk..", "............kRk...", "..................", "..................", "..................", "..................", "..................", "..................", "..................", "..................", "..................", "..................", "..................", "..................", "..................", "..................", ",................,"], "ghTop": [",..............,", "........k.......", "......kkWk.k....", ".....kWLLkkWk...", "....kWLlLllLk...", "...kWLlklllkdk..", "..kWLlkEkllEkdk.", "..kLlLllllllldk.", "................", "................", "................", "................", "................", ",..............,"], "ghBot": [",..............,", "................", "................", "................", "................", "................", "................", "..kLlLllllllldk.", ".kLlLllkekkldDk.", ".kLlllkeEelldDk.", "kLlLlllkekldbBDk", "kldlLdllkldbdDDk", ".kkdkkdkkdDkkDk.", ",.k..k..k..k.k.,"], "kgHeadR": [",.k..........................k.,", ".kVk........................kyk.", ".kVyk.......kkkkkkkk.......kVyk.", ".kVTk......kPPPPPPPPk......kVyk.", ".kVTTkk...kPPFFFFPPFFk...kkVyyk.", "..kTTVVkkkPPFFlltFFFFlkkkVVyyk..", "...kyTTVVyPFFFlXXFtFtlVVVyyyk...", "....kkyyyylllllXXlllllyyyykk....", "......kkkUUUUUUUUUUUUUUkkk......", "........kaaaaaaaaaaaaaa.........", "........kcLRRYRLLLRRYRi.........", "........kcLiRWLLAAiWRi..........", "........kcLiWWLAAAiWWi..........", ".........ciiW222222WWi..........", ".........cik11111111Wk..........", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................"], "kgPeltR": [",..............................,", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", ".......................k..k.....", ".......................OkkOk....", "......................OOOOOGk...", "..kkkkk...............OmvGGGGkk.", ".kJJSJgkk.............OGoGGvGmmk", "kJSzJJzSg.............OGOmmmmm..", "kJgJzzzgg..............1W1W1W1..", "kJgozzrg...............mmmW.W.Wk", "........................ggJJJJgk", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................", "................................"], "akHead45H": [",..........................................,", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................", ".......................aaa..................", "......................awzwa.................", ".....................a99999a................", "....................aa888888a...............", "...................a988788889a..............", "...................a988888889la.............", "....................a88887889la.............", ".....................a8888889lla............", "......................a999999la.............", ".......................alxlxla..............", "........................aalla...............", "..........................aa................", "............................................", "............................................", "............................................", "............................................", "............................................", "............................................"]});
  Object.assign(PAL, { gro: {"k": "#0b0a0e", "s": "#3e6a2c", "S": "#6a9a44", "p": "#e070a0", "P": "#f4a0c4", "q": "#a04070", "y": "#e8c040", "Y": "#fff08a", "o": "#b88a20", "m": "#4a0e14", "t": "#f4ecd8", "e": "#1a1a1a", "r": "#a82a2a", "R": "#d85a50", "w": "#e8e0cc", "b": "#6a4a30", "B": "#4a3220", "f": "#8a2020", "F": "#5a1414", "c": "#8a7458"}, statueH: {"k": "#0b0a09", "W": "#b9b9af", "L": "#94948c", "l": "#74746e", "d": "#51514c", "D": "#31312e", "e": "#2a2826", "E": "#3a3836", "r": "#43433f"}, statueB: {"k": "#0b0a09", "a": "#9a9a92", "A": "#6f6f69", "r": "#383835", "R": "#262624", "g": "#9b9b93", "e": "#2a2826", "D": "#292926", "d": "#43433f"} });
  Object.assign(PAL.kg, {"1": "#5a1010", "2": "#3a0a0a"}); Object.assign(PAL.ashking, {"8": "#000000", "9": "#2a1c18", "7": "#ff7a30"});
  function splitMap(m, row) { const k = m + '_h' + row; if (!MAPS[k]) { const R = MAPS[m], W = R[0].length, an = rr => rr.map((r, j) => (j === 0 || j === rr.length - 1) ? ((r[0] === '.' ? ',' : r[0]) + r.slice(1, -1) + (r[W - 1] === '.' ? ',' : r[W - 1])) : r);
    MAPS[k] = an(R.map((r, j) => j < row ? r : '.'.repeat(W))); MAPS[m + '_b' + row] = an(R.map((r, j) => j >= row ? r : '.'.repeat(W))); } return [k, m + '_b' + row]; }
  BLADES.akScepter = cellWeapon(40, 10, 27, 5, { k: '#0b0a0e', s: '#9a9ea6', S: '#6a6e76', d: '#3a3c42', g: '#c8a050', G: '#8a6a30', o: '#ff7a30', O: '#ffe0a0' }, put => {
    for (let x = 0; x < 34; x++) { put(x, 4, x % 6 === 0 ? 'S' : 's'); put(x, 5, 'd'); }
    for (const [x, y, c] of [[0, 3, 'S'], [0, 6, 'S'], [33, 2, 'g'], [33, 7, 'g'], [34, 1, 'g'], [34, 8, 'g'], [35, 2, 'G'], [35, 7, 'G'], [34, 3, 'o'], [35, 3, 'o'], [36, 3, 'o'], [34, 4, 'O'], [35, 4, 'O'], [36, 4, 'o'], [37, 4, 'o'], [34, 5, 'o'], [35, 5, 'O'], [36, 5, 'o'], [34, 6, 'o'], [35, 6, 'o'], [38, 4, 'g'], [38, 5, 'g'], [33, 3, 'g'], [33, 6, 'g']]) put(x, y, c);
  });
  function spawnAshKing() {
    const P0 = G.player, b = makeEnemy('ghoul', clamp(P0.x, A.x0 + 80, A.x1 - 80), clamp(P0.y - 170, A.y0 + 50, A.y1 - 40));
    Object.assign(b, { type: 'boss', kind: 'ashking', r: 16, hp: 4600 * STG().hpMul, maxHp: 4600 * STG().hpMul, atk: 25 * STG().atkMul, def: 80, spd: 50, kbRes: 0, grogiMax: 110,
      stage: 1, state: 'idle', cd: 1.6, blade: 'akScepter', bladeAng: -Math.PI / 2, bladeTarget: -Math.PI / 2, trail: [], rise: 0.8, tall: 70, head: 0, shard: 0, rainT: 2, fell: false, face: 1, walk: 0 });
    ascBoss(b);
    G.boss = b; G.enemies.push(b); G.akRings = [];
    dust(b.x, b.y, 30); burst(b.x, b.y - 30, '#3a2a20', 30);
    G.fx.push({ kind: 'skybeam', x: b.x, y: b.y, w: 60, c: '255,130,50', t: 0.7, max: 0.7 });
    bossRoar(b, '#ff7a30');
    b.introPending = true;
  }
  const akR = b => [0, 0.9, 0.84, 0.78][b.stage]; // v1.44 단계마다 준비가 빨라짐 (1단계부터 조금 빠르게)
  function akStage(b) {
    const pct = b.hp / b.maxHp;
    if (b.stage === 1 && pct <= 0.6) { b.stage = 2; banner('대관식', '왕이 스스로 왕관을 고쳐 쓴다'); bossRoar(b, '#ffd060'); cancelTele(b); b.state = 'idle'; b.cd = 0.8; b.sw = null; b.spd *= 1.15; b.rainT = 2.5; triggerAshKingCoronation(); }
    if (b.stage === 2 && pct <= 0.3) { b.stage = 3; banner('타오르는 왕', '잉걸이 타오른다 — 재가 비처럼 내린다'); bossRoar(b, '#ff3020'); cancelTele(b); b.state = 'idle'; b.cd = 0.7; b.spd *= 1.3; b.sw = null; }
    if (b.stage === 3 && !b.fell && pct <= 0.15) { b.fell = true; cancelTele(b); b.sw = null; akFall(b); }
  }
  function akEnd(b, t, cd) { b.state = 'recover'; b.t = t * [0, 0.85, 0.75, 0.75][b.stage]; b.cd = cd * [0, 0.8, 0.7, 0.62][b.stage]; } // v1.44 틈이 단계마다 짧아짐
  function updateAshKing(b, dt) {
    const P = G.player;
    b.flash = Math.max(0, b.flash - dt); b.rise = Math.max(0, b.rise - dt); b.lean = (b.lean || 0) * Math.pow(0.02, dt);
    updateBlade(b, dt);
    akRingsTick(dt, b);
    if (b.rise > 0) return;
    if (b.introPending && !G.trans) { b.introPending = false; b.cd = Math.max(b.cd, 0.8); triggerAshKingIntro(); return; }
    // 머리: 공격 중엔 정면(1), 아니면 옆(0) — 사이 장면 0.07초
    const wantF = b.state !== 'chase' && b.state !== 'idle' && b.state !== 'grogi';
    b.headT = wantF ? Math.min(1, (b.headT || 0) + dt / 0.14) : Math.max(0, (b.headT || 0) - dt / 0.14);
    if (b.grogiT > 0) { b.grogiT -= dt; b.state = 'grogi'; b.bladeTarget = Math.PI / 2; if (b.grogiT <= 0) { b.state = 'idle'; b.cd = 0.8; } return; }
    akStage(b);
    const d = dist(b, P), a = Math.atan2(P.y - b.y, P.x - b.x);
    if (b.state === 'dash') { const sp = 520; b.x += Math.cos(b.lockAng) * sp * dt; b.y += Math.sin(b.lockAng) * sp * dt; b.t -= dt;
      if (Math.random() < 0.8) G.parts.push({ x: b.x - Math.cos(b.lockAng) * 16 + rand(-6, 6), y: b.y - rand(0, 30), vx: -Math.cos(b.lockAng) * 40, vy: -rand(5, 20), t: rand(0.3, 0.6), c: pick(['#86807a', '#5e5a54', '#ff7a30']), g: 0, glow: Math.random() < 0.3 });
      if (!b.hitP && !P.dead && d < b.r + P.r + 6) { b.hitP = true; hurtPlayer(b.atk, b); }
      const bonk = dashBlocked(b) || b.x < A.x0 + b.r || b.x > A.x1 - b.r || b.y < A.y0 + b.r || b.y > A.y1 - b.r;
      if (bonk || b.t <= 0) { solveObs(b, b.r); b.x = clamp(b.x, A.x0 + b.r, A.x1 - b.r); b.y = clamp(b.y, A.y0 + b.r, A.y1 - b.r); akSlam(b, 66, 0.42); } return; }
    if (b.state === 'blink') { akBlinkTick(b, dt); return; }
    if (b.state === 'recover') { b.t -= dt; if (b.t <= 0) { b.state = 'chase'; b.bladeTarget = -Math.PI / 2; } return; }
    if (b.state === 'wind') return;
    // 추격: 절뚝이며 다가옴
    b.state = 'chase'; b.face = Math.cos(a) > 0 ? 1 : -1;
    if (d > 70) { const sp = b.spd * (d > 260 ? 1.4 : 1); b.x += Math.cos(a) * sp * dt; b.y += Math.sin(a) * sp * dt; b.walk += dt * 5; solveObs(b, b.r); b.x = clamp(b.x, A.x0 + b.r, A.x1 - b.r); b.y = clamp(b.y, A.y0 + b.r, A.y1 - b.r); }
    if (b.stage >= 2) { b.rainT -= dt; if (b.rainT <= 0) { b.rainT = b.stage === 3 ? 1.5 : 3.2; akRain(b, b.stage === 3 ? 3 : 2); } } // v1.44 대관식부터 재 비가 조금씩
    b.cd -= dt; if (b.cd > 0) return;
    const pats = d < 120 ? [['combo', 4], ['shard', 2]] : [['march', 4], ['shard', 3]];
    if (b.stage >= 2) pats.push(['rings', 2], ['echo', 2.5]);
    let pat = wpick2(pats); if (pat === b.lastPat && pat !== 'combo') pat = d < 120 ? 'combo' : 'march'; b.lastPat = pat;
    b.state = 'wind'; alertMark(b, 76, true); sfx('warn');
    if (pat === 'combo') akCombo(b, a); else if (pat === 'march') { b.chain = b.stage === 1 ? 1 : 2; akMarch(b, a, d); } else if (pat === 'shard') akShard(b); else if (pat === 'rings') akRingsCast(b); else akEcho(b);
  }
  function akSwingFx(b, ang, r) { eAtkFx(b.x + Math.cos(ang) * r, b.y + Math.sin(ang) * r * 0.75, 0.9, '#ff9a50'); sfx('whoosh'); sfx('heavy', 0.9); }
  function akCombo(b, a) { // 왕홀 3연격: 넓게 → 되돌아 넓게 → 머리 위에서 내려찍기
    const side = b.face, r = akR(b);
    b.bladeTarget = a - side * 150 * DEG; b.lean = -0.15 * side;
    G.tele.push({ shape: 'cone', x: b.x, y: b.y, ang: a, r: 104, arc: 140 * DEG, t: 0, dur: 0.78 * r, owner: b, onFire: t1 => { if (b.dead) return; startSwing(b, t1.ang + side * 70 * DEG, side, 0.1); b.lean = 0.2 * side; hitShape(t1, b.atk); akSwingFx(b, t1.ang, 60);
      const q = angTo(b, G.player);
      G.tele.push({ shape: 'cone', x: b.x, y: b.y, ang: q, r: 96, arc: 130 * DEG, t: 0, dur: 0.46 * r, owner: b, onFire: t2 => { if (b.dead) return; startSwing(b, t2.ang - side * 70 * DEG, -side, 0.1); b.lean = -0.15 * side; hitShape(t2, b.atk); akSwingFx(b, t2.ang, 56);
        b.bladeTarget = -100 * DEG; const p2 = G.player, sx = b.x + Math.cos(angTo(b, p2)) * 40, sy = b.y + Math.sin(angTo(b, p2)) * 30;
        G.tele.push({ shape: 'circle', x: sx, y: sy, r: 70, t: 0, dur: 0.62 * r, owner: b, heavy: true, onFire: t3 => { if (b.dead) return; slamBlade(b, Math.atan2(t3.y - b.y + 20, t3.x - b.x), side, 0.07); b.lean = 0.28 * side; hitShape(t3, b.atk * 1.3); eAtkFx(t3.x, t3.y, 1.4, '#ff7a30'); sfx('blast'); if (b.stage >= 2) akSpin(b); else akEnd(b, 0.8, rand(1.2, 1.7)); } }); } }); } });
  }
  function akSpin(b) { // v1.44 대관식부터: 내려찍은 자리에서 왕홀을 몸 둘레로 한 바퀴 — 붙어 있으면 맞는다
    b.bladeTarget = 180 * DEG; b.lean = -0.2 * b.face;
    G.tele.push({ shape: 'circle', x: b.x, y: b.y, r: 92, t: 0, dur: 0.6 * akR(b), owner: b, onFire: t => { if (b.dead) return; startSwing(b, b.bladeAng + b.face * TAU * 0.95, b.face, 0.18); b.lean = 0.2 * b.face; hitShape(t, b.atk); akSwingFx(b, 0, 60); akSwingFx(b, Math.PI, 60); akEnd(b, 0.9, rand(1.2, 1.7)); } });
  }
  function akMarch(b, a, d, k = 1) { // 왕의 행차: 일직선으로 덮쳐 와 내려찍기
    b.lockAng = a; b.bladeTarget = a + Math.PI * 0.85 * b.face; b.lean = 0.15 * b.face;
    G.tele.push({ shape: 'line', x: b.x, y: b.y, ang: a, len: clamp(d + 30, 120, 300), w: 48, t: 0, dur: 0.85 * k * akR(b), owner: b, onFire: () => { if (b.dead) return; b.state = 'dash'; b.t = clamp(d + 30, 120, 300) / 520; b.hitP = false; sfx('roar', 0.8); } });
  }
  function akSlam(b, r, dur) { b.state = 'wind'; b.bladeTarget = -110 * DEG; const chain = b.chain > 0; if (chain) b.chain--;
    G.tele.push({ shape: 'circle', x: b.x + b.face * 30, y: b.y + 6, r, t: 0, dur: dur * akR(b), owner: b, heavy: true, onFire: t => { if (b.dead) return; slamBlade(b, 60 * DEG * b.face + (b.face < 0 ? Math.PI - 120 * DEG : 0), b.face, 0.07); sigHit(() => hitShape(t, b.atk * 1.2)); eAtkFx(t.x, t.y, 1.3, '#ff7a30'); sfx('blast');
      const P = G.player, d2 = dist(b, P); // v1.44 멀리 피했으면 곧바로 다시 덮쳐 온다 (1단계 한 번, 2단계부터 두 번)
      if (chain && !P.dead && d2 > 110) { b.state = 'wind'; const a2 = angTo(b, P); b.face = Math.cos(a2) > 0 ? 1 : -1; alertMark(b, 76, true); sfx('warn'); akMarch(b, a2, d2, 0.7); }
      else { b.chain = 0; akEnd(b, 0.8, rand(1.0, 1.5)); } } }); }
  function akShard(b) { // 파편의 빛: 왕관의 파편이 차례로 빛나며 앞선 보스의 기술
    const k = b.shard++ % 3; b.shardGlow = k; b.bladeTarget = -90 * DEG; const P = G.player, r = akR(b);
    if (k === 0) { banner2(b, '점액왕의 파편'); for (let i = 0; i < 3; i++) { const tx = clamp(P.x + (i - 1) * 46 + rand(-10, 10), A.x0 + 20, A.x1 - 20), ty = clamp(P.y + rand(-30, 30), A.y0 + 20, A.y1 - 20), dur = (1.0 + i * 0.15) * r;
        G.fx.push({ kind: 'lob', x0: b.x, y0: b.y - 60, gy0: b.y, x1: tx, y1: ty, h: 90, d0: 0.5, t: dur, max: dur, owner: b });
        G.tele.push({ shape: 'circle', x: tx, y: ty, r: 32, t: 0, dur, owner: b, onFire: t => { hitShape(t, b.atk * 0.8); burst(t.x, t.y, '#7ad84a', 14); sfx('hit', 0.8); if (i === 2) akEnd(b, 0.5, rand(1.0, 1.4)); } }); } }
    else if (k === 1) { banner2(b, '발도르의 파편'); b.state = 'blink'; b.bk = { t: 0, a: Math.atan2(P.y - b.y, P.x - b.x) }; }
    else { banner2(b, '크루가쉬의 파편'); const a = angTo(b, P); for (let i = 0; i < 6; i++) { const x = b.x + Math.cos(a) * (40 + i * 34), y = b.y + Math.sin(a) * (40 + i * 34) * 0.85;
        G.tele.push({ shape: 'circle', x, y, r: 22, t: 0, dur: (0.7 + i * 0.09) * r, owner: b, onFire: t => { G.fx.push({ kind: 'rockspike', x: t.x, y: t.y, t: 1.05, max: 1.05, v: (Math.random() * 4) | 0, fl: Math.random() < 0.5, sd: Math.random() * 1000 }); hitShape(t, b.atk * 0.8); dust(t.x, t.y, 6); if (i === 5) akEnd(b, 0.5, rand(1.0, 1.4)); } }); } }
  }
  function akBlinkTick(b, dt) { // 그림자 걸음: 흩어짐 0.45 → 표식 0.35 → 나타남 0.3 → 베기 경고 0.6 (단계로 보여 줌)
    const k = b.bk, P = G.player; k.t += dt;
    if (k.t < 0.45) b.fadeA = 1 - k.t / 0.45;
    else if (!k.mark) { k.mark = true; b.fadeA = 0; const ang = angTo(P, b) + Math.PI; k.x = clamp(P.x + Math.cos(ang) * 60, A.x0 + 30, A.x1 - 30); k.y = clamp(P.y + Math.sin(ang) * 45, A.y0 + 30, A.y1 - 30); G.tele.push({ shape: 'spawn', x: k.x, y: k.y, r: 18, t: 0, dur: 0.65, owner: b }); }
    else if (k.t > 0.8 && !k.moved) { k.moved = true; b.x = k.x; b.y = k.y; }
    if (k.moved) b.fadeA = Math.min(1, (k.t - 0.8) / 0.3);
    if (k.t > 1.1 && !k.cut) { k.cut = true; b.fadeA = 1; b.state = 'wind'; const a = angTo(b, P); b.face = Math.cos(a) > 0 ? 1 : -1; b.bladeTarget = a - b.face * 140 * DEG;
      G.tele.push({ shape: 'cone', x: b.x, y: b.y, ang: a, r: 92, arc: 120 * DEG, t: 0, dur: 0.6 * akR(b), owner: b, onFire: t => { if (b.dead) return; startSwing(b, t.ang + b.face * 70 * DEG, b.face, 0.1); hitShape(t, b.atk * 1.1); akSwingFx(b, t.ang, 56); burst(b.x, b.y - 30, '#b070ff', 12); akEnd(b, 0.7, rand(1.1, 1.5)); } }); }
  }
  // 재 불길 고리: 반지름이 늘거나(대관식) 줄며(몰락) 지나감 — 틈(각도)으로 피함. 2px 칸으로 그림
  function akRingsCast(b) { banner2(b, '대관식'); b.bladeTarget = -90 * DEG;
    G.tele.push({ shape: 'circle', x: b.x, y: b.y, r: 44, t: 0, dur: 0.95 * akR(b), owner: b, onFire: () => { if (b.dead) return; sfx('roar', 1.3);
      for (let i = 0; i < 3; i++) G.akRings.push({ x: b.x, y: b.y, r: 30 - i * 70, v: 130, w: 14, gap: rand(0, TAU), gw: 0.75, hit: false });
      const P = G.player, d2 = dist(b, P); // v1.44 고리를 퍼뜨리며 곧장 덮쳐 온다 — 틈을 찾는 동시에 돌진도 피해야
      if (!P.dead && d2 > 90) { b.state = 'wind'; b.chain = 0; const a2 = angTo(b, P); b.face = Math.cos(a2) > 0 ? 1 : -1; akMarch(b, a2, d2, 0.9); } else akEnd(b, 0.6, rand(1.4, 1.9)); } });
  }
  function akFall(b) { banner('몰락', '재의 벽이 조여 온다 — 틈으로 빠져나가라'); bossRoar(b, '#ff3020'); b.state = 'wind'; b.bladeTarget = 90 * DEG;
    const cx = (A.x0 + A.x1) / 2, cy = (A.y0 + A.y1) / 2;
    for (let i = 0; i < 3; i++) G.akRings.push({ x: cx, y: cy, r: 460 + i * 150, v: -70, w: 16, gap: rand(0, TAU), gw: 0.6, spin: (i % 2 ? 1 : -1) * 0.5, hit: false, stop: 40, sig: true });
    akEnd(b, 1.4, 1.2);
  }
  function akRingsTick(dt, b) {
    if (!G.akRings || !G.akRings.length) return; const P = G.player;
    for (const R of G.akRings) { R.r += R.v * dt; if (R.spin) R.gap += R.spin * dt; if (R.r < 0) continue;
      const d = Math.hypot(P.x - R.x, (P.y - R.y) / 0.75), inGap = Math.abs(angDiff(Math.atan2((P.y - R.y) / 0.75, P.x - R.x), R.gap)) < R.gw / 2;
      if (!R.hit && !P.dead && Math.abs(d - R.r) < R.w / 2 + P.r && !inGap) { R.hit = true; if (R.sig) sigHit(() => hurtPlayer(b.atk * 0.8, b)); else hurtPlayer(b.atk * 0.8, b); }
      if (Math.abs(d - R.r) > R.w + 20) R.hit = false; }
    G.akRings = G.akRings.filter(R => R.v > 0 ? R.r < 520 : R.r > (R.stop || 0));
  }
  function drawAkRings() {
    if (!G.akRings) return;
    for (const R of G.akRings) { if (R.r < 4) continue; const n = Math.max(24, Math.round(R.r * TAU / 6));
      for (let i = 0; i < n; i++) { const a = i / n * TAU; if (Math.abs(angDiff(a, R.gap)) < R.gw / 2) continue;
        const x = snap2(R.x + Math.cos(a) * R.r), y = snap2(R.y + Math.sin(a) * R.r * 0.75), fl = (i + Math.floor(time * 12)) % 3;
        ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 2, y - 4, 6, 8); ctx.fillStyle = fl ? '#ff7a30' : '#ffc070'; ctx.fillRect(x, y - 2, 2, 4); ctx.fillStyle = '#8a3418'; ctx.fillRect(x, y + 2, 2, 2); } }
  }
  function akEcho(b) { // 근위대, 왕비여: 모르드레드의 재 그림자 돌진 + 왕비의 눈물 고리
    banner2(b, '근위대, 왕비여!'); b.bladeTarget = -80 * DEG; const P = G.player, r = akR(b);
    const sx = clamp(P.x - 160, A.x0 + 30, A.x1 - 30), sy = clamp(P.y + rand(-60, 60), A.y0 + 30, A.y1 - 30), ang = Math.atan2(P.y - sy, P.x - sx);
    G.fx.push({ kind: 'ghost', x: sx, y: sy, face: Math.cos(ang) > 0 ? 1 : -1, rot: 0, t: 0.9, max: 0.9, map: 'nMordred', pal: 'nMordredShade', sc: 2, glowy: true });
    G.tele.push({ shape: 'line', x: sx, y: sy, ang, len: 300, w: 36, t: 0, dur: 0.9 * r, owner: b, onFire: t => { hitShape(t, b.atk * 0.9); for (let i = 0; i < 300; i += 20) dust(sx + Math.cos(ang) * i, sy + Math.sin(ang) * i, 3); sfx('whoosh'); } });
    const qx = clamp(P.x + 140, A.x0 + 30, A.x1 - 30), qy = clamp(P.y - 40, A.y0 + 30, A.y1 - 30);
    G.fx.push({ kind: 'ghost', x: qx, y: qy, face: -1, rot: 0, t: 1.2, max: 1.2, map: 'nQueen', pal: 'nQueenShade', sc: 2, glowy: true });
    G.tele.push({ shape: 'circle', x: qx, y: qy, r: 30, t: 0, dur: 1.1 * r, owner: b, onFire: () => { const n = 16, gap = randi(0, n - 1); for (let k = 0; k < n; k++) { if (k === gap || k === (gap + 1) % n) continue; const aa = k / n * TAU; G.eproj.push({ x: qx, y: qy, ang: aa, sp: 110, r: 5, dmg: b.atk * 0.5, t: 3, hist: [], kind: 'tear' }); } akEnd(b, 0.4, rand(1.3, 1.8)); } });
  }
  function akRain(b, n = 3) { // 재 비: 플레이어 둘레 원 (대관식 둘, 타오르는 왕 셋)
    const P = G.player; for (let i = 0; i < n; i++) { const a = rand(0, TAU), r = i ? rand(30, 80) : 0, x = clamp(P.x + Math.cos(a) * r, A.x0 + 16, A.x1 - 16), y = clamp(P.y + Math.sin(a) * r * 0.75, A.y0 + 16, A.y1 - 16);
      G.tele.push({ shape: 'circle', x, y, r: 24, t: 0, dur: 1.0 + i * 0.15, owner: b, onFire: t => { hitShape(t, b.atk * 0.6); for (let j = 0; j < 8; j++) G.parts.push({ x: t.x + rand(-6, 6), y: t.y, vx: rand(-50, 50), vy: -rand(30, 80), t: rand(0.3, 0.5), c: pick(['#ff7a30', '#ffc070', '#5e5a54']), g: 260, glow: true, floor: t.y + 2 }); } }); }
  }
  function drawAshKing(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0, F = e.face, st = e.state;
    // 절뚝임: 경련하듯 불규칙한 칸 단위 꺾임
    const JERK = [0, 2, 2, 0, 4, 2, 0, 0, 2, 4, 2, 0], ph = Math.floor(e.walk * 2.4) % 12, walking = st === 'chase';
    let bob = walking ? JERK[ph] : 0, tw = walking && (ph === 4 || ph === 10) ? 2 : 0, lL = walking && ph >= 1 && ph <= 3 ? -2 : 0, lR = walking && ph >= 7 && ph <= 9 ? -2 : 0;
    if (st === 'wind' || st === 'dash') bob -= 4; // 허리를 펴며 일어섬
    if (st === 'recover') bob = e.t > 0.4 ? 2 : 0;
    const by = e.y + 2 + ya, o = (m, dx, dy) => drawSprite(m, 'ashking', 2, e.x + (tw + dx) * F, by + dy, flip, { white, alpha: al });
    drawShadow(e.x, e.y + 2, 20);
    drawAkRings();
    const hx = e.x + (AK_HAND[0] + tw) * F, hy = by + AK_HAND[1] + bob, bl = BLADES.akScepter, back = !e.sw && Math.cos(e.bladeAng) * F < -0.3;
    if (back) drawBlade(bl, hx, hy, e.bladeAng, al, white);
    for (let up = 0; up >= Math.min(0, bob); up -= 2) { o('akLegL', 0, lL + up); o('akLegR', 0, lR + up); } // 허리를 펴 몸이 올라가면 다리도 그만큼 이어 그려 끊기지 않게
    o('akBody', 0, bob); o('akArm', 0, bob + (walking && ph % 6 < 3 ? 2 : 0));
    const ht = e.headT || 0; if (ht !== e._htP) { e._htUp = ht > (e._htP || 0); e._htP = ht; } o((ht > 0.85 ? 'akHeadF' : ht > 0.15 ? (e._htUp ? 'akHead45H' : 'akHead45') : 'akHeadS') + (e.nc ? 'NC' : ''), /* v2.54 왕관이 떨어진 머리 */ /* v1.52 정면으로 돌아설 때 45° 얼굴은 빈 구멍 */ 0, bob + (walking && (ph === 5 || ph === 6) ? 2 : 0));
    enemyTrail(e, e.trail, hx, hy, 18, bl.reach, '255,150,70', true);
    if (!back) drawBlade(bl, hx, hy, e.bladeAng, al, white);
    if (al > 0.5) { // 잉걸 심장 · 3단계 불길
      if (Math.random() < (e.stage === 3 ? 0.7 : 0.15)) G.parts.push({ x: e.x + F * rand(-14, 10), y: by - rand(10, 50), vx: rand(-6, 6), vy: -rand(20, 50), t: rand(0.4, 0.8), c: pick(['#ff7a30', '#ffc070', '#8a3418']), g: 0, glow: true });
      if (e.shardGlow != null && st !== 'chase') { const c = ['#7ad84a', '#4a8cff', '#e04030'][e.shardGlow]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c; for (let i = 0; i < 3; i++) ctx.fillRect(snap2(e.x + (6 + i * 4) * F + rand(-4, 4)), snap2(by - 44 + bob + rand(-6, 6)), 2, 2); ctx.restore(); } }
  }
  function spawnBoss() {
    const P0 = G.player, b = makeEnemy('ghoul', clamp(P0.x, A.x0 + 60, A.x1 - 60), clamp(P0.y - 170, A.y0 + 40, A.y1 - 40));
    Object.assign(b, { type: 'boss', r: 16, hp: 3900 * STG().hpMul, maxHp: 3900 * STG().hpMul, atk: 25 * STG().atkMul, def: 80, spd: 58, kbRes: 0, grogiMax: 100,
      stage: 1, state: 'idle', cd: 1.5, shield: false, summonT: 0, vortexT: 0, nextPat: 0, blade: 'boss', rise: 0.8 });
    ascBoss(b);
    G.boss = b; G.enemies.push(b);
    dust(b.x, b.y, 30); burst(b.x, b.y - 20, '#3a1a48', 30);
    G.fx.push({ kind: 'skybeam', x: b.x, y: b.y, w: 60, c: '170,80,230', t: 0.7, max: 0.7 });
    bossRoar(b, '#b45cff');
  }
  function bossRoar(b, c) {
    b.grogiLock = time + 2.5; b.grogi = 0; b.roarUntil = time + 0.9; /* v1.52 포효하는 동안 입이 벌어짐 */ // v1.49 단계 전환 연출 동안 그로기 안 걸림
    sfx('roar'); addShake(9); slowmo = Math.max(slowmo, 0.5); flashT = 0.15; flashColor = c;
    G.fx.push({ kind: 'ring', x: b.x, y: b.y - 20, r: 10, t: 0.7, max: 0.7, c, grow: 520 });
    G.fx.push({ kind: 'ring', x: b.x, y: b.y - 20, r: 6, t: 0.5, max: 0.5, c: '#ffffff', grow: 360 });
    debris(b.x, b.y, 24);
  }
  function bossStageCheck(b) {
    const pct = b.hp / b.maxHp;
    if (b.stage === 1 && pct <= 0.7) { b.stage = 2; banner('2단계', '망령 기사 소환 · 죽음의 표식'); bossRoar(b, '#b45cff'); cancelTele(b); b.state = 'idle'; b.cd = 0.6; b.summonT = 0; }
    if (b.stage === 2 && pct <= 0.35) { b.stage = 3; banner('광폭화', '잿빛 회오리가 몰아친다'); bossRoar(b, '#ff3050'); cancelTele(b); b.state = 'idle'; b.cd = 0.6; b.vortexT = 0; b.spd *= 1.25; }
  }
  function updateBoss(b, dt) {
    const P = G.player;
    if (b.state === 'blink' && b.grogiT > 0) b.state = 'idle'; // 그림자 걸음 중 그로기면 취소
    if (b.state !== 'blink') b.fadeA = 1;
    b.flash = Math.max(0, b.flash - dt); b.rise = Math.max(0, b.rise - dt);
    b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= Math.pow(0.001, dt); b.vy *= Math.pow(0.001, dt);
    b.lean *= Math.pow(0.03, dt);
    updateBlade(b, dt);
    b.glow = 0;
    for (const t of G.tele) if (t.owner === b && t.shape !== 'spawn') b.glow = Math.max(b.glow, t.t / t.dur);
    if (b.glow > 0 && Math.random() < 0.9) { // 칼끝으로 어둠이 모인다
      const bl = BLADES.boss, hx = b.x + b.face * 4, hy = b.y - 30, tx = hx + Math.cos(b.bladeAng) * bl.reach, ty = hy + Math.sin(b.bladeAng) * bl.reach;
      const a = rand(0, TAU), r = rand(18, 34);
      G.parts.push({ x: tx + Math.cos(a) * r, y: ty + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, t: 0.22, c: pick(['#b45cff', '#e0b0ff', '#5a1f78']), g: 0, glow: true });
    }
    b.shield = G.enemies.some(e => e.type === 'ghost' && !e.dead);
    G.bossTime -= dt;
    if (G.bossTime <= 0 && !b.wipe) {
      b.wipe = true; cancelTele(b);
      banner('전멸기', '제한 시간 초과');
      sfx('roar'); G.tele.push({ shape: 'circle', x: CX, y: CY, r: 700, t: 0, dur: 2.0, owner: b, heavy: true, onFire: () => { hurtPlayer(9999, b, true); flashT = 0.3; flashColor = '#ffffff'; } });
    }
    if (b.grogiT > 0) { b.grogiT -= dt; b.bladeTarget = (b.face > 0 ? 70 : 110) * DEG; if (b.grogiT <= 0) { b.state = 'idle'; b.cd = 0.8; } return; }
    if (b.state === 'wind') return;
    if (P.dead) return;
    const recov = b.stage === 3 ? 0.7 : 1;
    const d = dist(b, P), a = angTo(b, P);
    if (Math.abs(Math.cos(a)) > 0.2 && b.state !== 'dash' && b.state !== 'triple') b.face = Math.cos(a) > 0 ? 1 : -1;

    if (b.stage >= 2) {
      b.summonT -= dt;
      if (b.summonT <= 0 && !b.shield && b.state === 'idle') {
        b.summonT = 22;
        for (const off of (b.stage === 3 ? [-1, 0, 1] : [-1, 1])) {
          const pt = { x: clamp(b.x + off * 70, A.x0 + 30, A.x1 - 30), y: clamp(b.y + (off === 0 ? 60 : 20), A.y0 + 30, A.y1 - 30) };
          G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: 14, t: 0, dur: 1.0, owner: b, portal: true, onFire: () => { G.enemies.push(makeEnemy('ghost', pt.x, pt.y)); burst(pt.x, pt.y - 10, '#9cc1ea', 14); G.fx.push({ kind: 'skybeam', x: pt.x, y: pt.y, w: 26, c: '150,200,255', t: 0.5, max: 0.5 }); } });
        }
        b.state = 'cast'; b.t = 1.1; b.bladeTarget = -90 * DEG; sfx('warn');
        G.fx.push({ kind: 'skybeam', x: b.x + b.face * 4, y: b.y - 60, w: 10, c: '170,80,230', t: 1.0, max: 1.0, up: true });
      }
    }
    if (b.stage === 3) {
      b.vortexT -= dt;
      if (b.vortexT <= 0 && !G.vortex) { b.vortexT = 22; G.vortex = { t: 0, r0: 430, r1: 115, shrink: 7, hold: 5, r: 430, tick: 0, cx: clamp(P.x, A.x0 + 120, A.x1 - 120), cy: clamp(P.y, A.y0 + 120, A.y1 - 120) }; }
    }

    if (b.state === 'blink') { updateBlink(b, dt); return; }
    if (b.state === 'cast') { b.t -= dt; if (b.t <= 0) { b.state = 'idle'; b.cd = 0.8; } return; }
    if (b.state === 'recover') { b.t -= dt; if (b.t <= 0) { b.state = 'idle'; b.cd = b.stage === 3 ? 0.25 : 0.45; } return; }
    if (b.state === 'dash') {
      const sp = 480;
      b.bladeTarget = b.lockAng; b.bladeAng = b.lockAng;
      b.x += Math.cos(b.lockAng) * sp * dt; b.y += Math.sin(b.lockAng) * sp * dt; b.dashLeft -= sp * dt;
      if (Math.random() < 0.8) dust(b.x, b.y, 1);
      G.fx.push({ kind: 'ghost', x: b.x, y: b.y, face: b.face, rot: 0.25 * b.face, t: 0.28, max: 0.28, map: 'baldor', pal: 'shade', sc: 2, glowy: true });
      for (let i = 0; i < 2; i++) { dg.fillStyle = `rgba(40,10,50,${rand(0.3, 0.6)})`; dg.fillRect(Math.round(b.x + rand(-6, 6)), Math.round(b.y + rand(-3, 3)), randi(2, 4), 2); }
      G.parts.push({ x: b.x + rand(-8, 8), y: b.y - rand(0, 6), vx: -Math.cos(b.lockAng) * 60, vy: -30, t: 0.4, c: pick(['#b45cff', '#5a1f78']), g: 0, glow: true });
      if (!b.hitPlayer && dist(b, P) < b.r + P.r + 6) { b.hitPlayer = true; sigHit(() => hurtPlayer(b.atk * 1.15, b)); }
      if (b.dashLeft <= 0 || b.x < A.x0 + b.r || b.x > A.x1 - b.r || b.y < A.y0 + b.r || b.y > A.y1 - b.r || dashBlocked(b)) {
        solveObs(b, b.r); b.state = 'recover'; b.t = 0.75 * recov; addShake(8, b.lockAng); dust(b.x, b.y, 20); debris(b.x, b.y, 18); crack(b.x, b.y); sfx('blast');
        if (b.chargesLeft > 0) { b.chargesLeft--; baldorCharge(b, angTo(b, P), 0.45); } // v0.92: 2단계 2연속·3단계 3연속 돌진 (다시 조준)
        else if (dist(b, P) < 150 && Math.random() < (b.stage === 3 ? 0.8 : 0.6)) { b.state = 'triple'; b.step = 0; b.t = 0.3 * recov; } // v0.88: 돌진 후 붙었으면 바로 3연베기
        G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 10, t: 0.4, max: 0.4, c: '#b45cff', grow: 260 });
        G.fx.push({ kind: 'arcwave', x: b.x, y: b.y - 6, ang: b.lockAng, arc: 140 * DEG, r0: 10, r1: 80, t: 0.3, max: 0.3, c: '190,90,255' });
      }
      return;
    }
    if (b.state === 'triple') {
      b.t -= dt;
      if (b.t <= 0) {
        if (b.step >= 3) { b.state = 'recover'; b.t = 0.6 * recov; return; }
        b.step++;
        const aa = angTo(b, P);
        b.face = Math.cos(aa) > 0 ? 1 : -1;
        const side = (b.step % 2 ? 1 : -1) * b.face, last = b.step === 3;
        b.bladeTarget = aa - side * 115 * DEG; b.lean = -0.18 * b.face;
        if (b.step === 1) alertMark(b, 78, true);
        sfx('warn');
        const dur = last ? 0.72 : 0.55; // v0.92: 0.8/0.95 → 0.55/0.72
        G.tele.push({ shape: 'cone', x: b.x, y: b.y, ang: aa, arc: (last ? 100 : 120) * DEG, r: last ? 96 : 76, t: 0, dur, owner: b, follow: true, heavy: last,
          onFire: tt => {
            startSwing(b, tt.ang + side * 85 * DEG, side, 0.1); b.lean = 0.25 * b.face;
            b.x += Math.cos(tt.ang) * 16; b.y += Math.sin(tt.ang) * 16;
            hitShape(tt, b.atk * (last ? 1.3 : 1)); sfx('heavy'); sfx('whoosh');
            G.fx.push({ kind: 'arcwave', x: b.x, y: b.y - 6, ang: tt.ang, arc: tt.arc, r0: 24, r1: tt.r + 26, t: 0.3, max: 0.3, c: '190,90,255' });
            const tx = b.x + Math.cos(tt.ang) * tt.r * 0.7, ty = b.y + Math.sin(tt.ang) * tt.r * 0.7;
            sparks(tx, ty, tt.ang, '#d9a8ff', last ? 14 : 7);
            if (last) { addShake(9, tt.ang); crack(tx, ty); debris(tx, ty, 20); sfx('blast'); G.fx.push({ kind: 'ring', x: tx, y: ty, r: 8, t: 0.4, max: 0.4, c: '#b45cff', grow: 240 }); }
            else addShake(4, tt.ang);
          } });
        b.t = dur + 0.16;
      }
      return;
    }
    // idle
    b.bladeTarget = restAng(b);
    const far = d > 200;
    if (d > 64) { const sp = b.spd * (far ? 1.6 : 1); b.x += Math.cos(a) * sp * dt; b.y += Math.sin(a) * sp * dt; b.walk += dt * (far ? 5 : 3.5); }
    b.cd -= dt * (far ? 1.6 : 1);
    if (b.cd > 0) return;
    // v0.88: 거리별 가중치 — 멀면 돌진 위주, 죽음의 표식(제자리 시전)은 가끔·연속 금지. 가까우면 3연베기 위주
    const mk = b.stage >= 2 && b.lastPat !== 'mark', bk = b.lastPat !== 'blink';
    let pat = d > 130 ? wpick2([['charge', 4], ['blink', bk ? 1.5 : 0], ['mark', mk ? 1 : 0]]) : wpick2([['triple', 4], ['charge', 1], ['blink', bk ? 0.8 : 0], ['mark', mk ? 0.7 : 0]]);
    b.lastPat = pat;
    if (pat === 'blink') { baldorBlink(b); return; }
    if (pat === 'triple') { b.state = 'triple'; b.step = 0; b.t = 0; }
    else if (pat === 'charge') { b.chargesLeft = b.stage - 1; alertMark(b, 78, true); baldorCharge(b, a, 0.75); } else if (pat === 'mark') {
      b.state = 'cast'; b.t = 0.6; b.bladeTarget = -90 * DEG;
      alertMark(b, 78, true); sfx('warn');
      G.fx.push({ kind: 'skybeam', x: b.x + b.face * 4, y: b.y - 60, w: 12, c: '170,80,230', t: 0.6, max: 0.6, up: true });
      const markHit = tt => {
          sigHit(() => hitShape(tt, b.atk * 1.35)); addShake(10); sfx('blast'); burst(tt.x, tt.y, '#8a3fb0', 30); crack(tt.x, tt.y); debris(tt.x, tt.y, 20);
          G.fx.push({ kind: 'skybeam', x: tt.x, y: tt.y, w: 70, c: '190,90,255', t: 0.45, max: 0.45 });
          G.fx.push({ kind: 'ring', x: tt.x, y: tt.y, r: 10, t: 0.5, max: 0.5, c: '#d9a8ff', grow: 220 });
          flashT = 0.1; flashColor = '#b45cff';
        };
      G.tele.push({ shape: 'circle', x: P.x, y: P.y, r: 46, t: 0, dur: 3.0, owner: b, track: true, mark: true, heavy: true, onFire: markHit });
      if (b.stage === 3) G.tele.push({ shape: 'circle', x: P.x, y: P.y, r: 46, t: 0, dur: 4.2, owner: b, track: true, mark: true, heavy: true, onFire: markHit }); // v0.92: 광폭화엔 표식 2개
    }
  }
  // v0.92 발도르: 돌진 (연속 돌진은 짧은 경고로 다시 조준)
  function baldorCharge(b, a, dur) {
    b.state = 'wind'; b.lockAng = a; b.face = Math.cos(a) > 0 ? 1 : -1; b.bladeTarget = a + Math.PI; b.lean = -0.2 * b.face; sfx('warn');
    G.tele.push({ shape: 'line', x: b.x, y: b.y, ang: a, len: 320, w: 32, t: 0, dur, owner: b, heavy: true,
      onFire: () => { b.state = 'dash'; b.dashLeft = 320; b.hitPlayer = false; sfx('whoosh'); sfx('blast'); addShake(5, a); dust(b.x, b.y, 14); } });
  }
  // 발도르 「그림자 걸음」 (v0.92, v0.93 느리게): 연기 속에 서서히 사라짐 → 나타날 자리에 보라 표식 → 서서히 나타남 → 0.8초 경고 후 큰 베기
  const BLINK_OUT = 0.45, BLINK_GAP = 0.3, BLINK_IN = 0.3;
  function baldorBlink(b) {
    const P = G.player, a0 = angTo(b, P);
    b.blinkTo = { x: clamp(P.x + Math.cos(a0) * 58, A.x0 + 30, A.x1 - 30), y: clamp(P.y + Math.sin(a0) * 42, A.y0 + 30, A.y1 - 30) };
    b.state = 'blink'; b.bt = 0; b.moved = false; b.bladeTarget = -60 * DEG; sfx('warn', 0.8);
    G.tele.push({ shape: 'spawn', x: b.blinkTo.x, y: b.blinkTo.y, r: 20, t: 0, dur: BLINK_OUT + BLINK_GAP + BLINK_IN, owner: b });
  }
  function updateBlink(b, dt) {
    const P = G.player, smoke = (x, y, n) => { for (let i = 0; i < n; i++) G.parts.push({ x: x + rand(-14, 14), y: y - rand(0, 50), vx: rand(-25, 25), vy: -rand(20, 55), t: rand(0.4, 0.8), c: pick(['#3e2b4a', '#5a1f78', '#b45cff']), g: 0, glow: Math.random() < 0.4 }); };
    b.bt += dt; const T = b.bt;
    if (T < BLINK_OUT) { b.fadeA = 1 - T / BLINK_OUT; if (Math.random() < 0.7) smoke(b.x, b.y, 2); return; }
    if (!b.moved) { b.moved = true; b.fadeA = 0; G.fx.push({ kind: 'ghost', x: b.x, y: b.y, face: b.face, rot: 0, t: 0.35, max: 0.35, map: 'baldor', pal: 'shade', sc: 2, glowy: true }); smoke(b.x, b.y, 14); b.x = b.blinkTo.x; b.y = b.blinkTo.y; solveObs(b, b.r); b.vx = b.vy = 0; sfx('whoosh', 0.8); }
    if (T < BLINK_OUT + BLINK_GAP) { b.fadeA = 0; return; }
    if (T < BLINK_OUT + BLINK_GAP + BLINK_IN) { b.fadeA = (T - BLINK_OUT - BLINK_GAP) / BLINK_IN; b.face = Math.cos(angTo(b, P)) > 0 ? 1 : -1; if (Math.random() < 0.6) smoke(b.x, b.y, 2); return; }
    b.fadeA = 1; sfx('warn'); alertMark(b, 78, true);
    const a = angTo(b, P); b.face = Math.cos(a) > 0 ? 1 : -1; b.state = 'wind'; b.bladeTarget = a - 115 * DEG * b.face; b.lean = -0.2 * b.face;
    G.tele.push({ shape: 'cone', x: b.x, y: b.y, ang: a, arc: 130 * DEG, r: 92, t: 0, dur: 0.8, owner: b, follow: true, heavy: true,
      onFire: tt => { startSwing(b, tt.ang + 85 * DEG * b.face, b.face, 0.1); b.lean = 0.25 * b.face; hitShape(tt, b.atk * 1.25); sfx('heavy'); sfx('whoosh'); addShake(7, tt.ang);
        G.fx.push({ kind: 'arcwave', x: b.x, y: b.y - 6, ang: tt.ang, arc: tt.arc, r0: 24, r1: tt.r + 26, t: 0.3, max: 0.3, c: '190,90,255' });
        b.state = 'recover'; b.t = b.stage === 3 ? 0.6 : 0.85; } });
  }
  function updateVortex(dt) {
    const v = G.vortex; if (!v) return;
    v.t += dt;
    if (v.t < v.shrink) v.r = v.r0 + (v.r1 - v.r0) * (v.t / v.shrink);
    else if (v.t < v.shrink + v.hold) v.r = v.r1;
    else { v.r += 160 * dt; if (v.r > 400) { G.vortex = null; return; } }
    const P = G.player;
    if (Math.hypot(P.x - v.cx, P.y - v.cy) > v.r) {
      v.tick -= dt;
      if (v.tick <= 0) { v.tick = 0.5; hurtPlayer(6, null, false, true); }
    }
  }

  // ---------------------------------------------------------------- 판정
  function inShape(t, x, y, pr) {
    const dx = x - t.x, dy = y - t.y, dd = Math.hypot(dx, dy);
    if (t.shape === 'circle') return dd <= t.r + pr;
    if (t.shape === 'cone') return dd <= t.r + pr && Math.abs(angDiff(Math.atan2(dy, dx), t.ang)) <= t.arc / 2 + (dd > 0 ? Math.atan(pr / Math.max(dd, 1)) : Math.PI);
    if (t.shape === 'line') {
      const ux = Math.cos(t.ang), uy = Math.sin(t.ang), along = dx * ux + dy * uy, perp = Math.abs(-dx * uy + dy * ux);
      return along >= -pr && along <= t.len + pr && perp <= t.w / 2 + pr;
    }
    return false;
  }
  // v1.49 대표 패턴: 방어력을 반만 적용 (장비로 맞고 버티기 방지) / v1.50 최대 HP 비율 부분 삭제 — 방어를 올리면 언제나 덜 아픔
  let SIG_ON = false;
  const sigHit = f => { SIG_ON = true; try { f(); } finally { SIG_ON = false; } };
  function hitShape(t, dmg) { const P = G.player; if (inShape(t, P.x, P.y, P.r)) hurtPlayer(dmg, t.owner); }

  const PD_WIN = () => (TOUCH.on ? 0.24 : 0.16); // v2.27 모바일 보정: 퍼펙트 회피 판정 0.24초 (PC 0.16)
  let GOD_MODE = false; // v2.40 테스트용 무적 (Shift+O로 켜고 끔, 새로고침하면 꺼짐)
  function hurtPlayer(raw, src, unblockable, dot) {
    if (G && G.player) G.player.idleT = 0;
    const P = G.player;
    if (P.dead || mode !== 'play') return;
    if (G.decoyUpd) return; // v2.41 미끼 잔상을 노린 공격
    if (GOD_MODE) { if (!dot && !(P.godNumT > time)) { P.godNumT = time + 0.3; G.nums.push({ x: P.x, y: P.y - 26, v: '무적', t: 0.5, c: '#9fd2ff', s: 1, txt: true }); } return; } // v2.40 테스트: 무적 (Shift+O)
    if (P.grab && !unblockable) return;
    if (P.miracleT > 0 || P.shieldT > 0) { if (!dot) G.nums.push({ x: P.x, y: P.y - 26, v: '0', t: 0.5, c: '#ffe39a', s: 1 }); return; }
    if (!unblockable && !dot && P.iframe > 0) {
      if (P.state === 'dodge' && P.dodgeT < PD_WIN() && !P.perfectUsed) perfectDodge();
      return;
    }
    const kill = raw >= 999; // 즉사 기술
    if (!kill && P.stealthT > 0) return; // v2.05 모습을 감춘 동안 빗나감
    if (!kill && !dot && P.inv > 0) return; // v2.00 붙잡기 연타 등 무시 불가 공격도 무적 시간에는 한 번만
    const s = G.stats;
    // v2.00 하트 방식: 한 번 맞으면 반 칸. 장판·독·화상은 2.5초에 반 칸. 방어력 없음
    if (dot) { if (time < (P.dotNext || 0)) return; P.dotNext = time + 2.5; }
    const keep = -(censerIn() ? 0.2 : 0) - pasV('parry') + meleeKeep() * (P.awakenT > 0 ? 0.7 : 1) * (P.state === 'storm' || P.state === 'cast' || P.state === 'aim' ? 0.5 : 1); // 옛 피해 감소 → 그만큼 확률로 흘려냄
    if (!kill && !dot && !unblockable && Math.random() > keep) { P.inv = 0.3; P.evOutT = 0.45; G.fx = G.fx.filter(f => !(f.t >= (f.max || 0) - 0.001 && ['ring', 'impact', 'hitspark', 'hitflash', 'boom'].includes(f.kind) && Math.hypot(f.x - P.x, f.y - (P.y - 10)) < 30)); /* v2.35 몸에 뜨던 원 대신 도트 외곽선 */ const lb = { knight: '흘려냄', ranger: '베어냄', priest: '신의 가호', gunner: '빗나감', mage: '마나 격류' }[G.cls] || '0'; rec('ev_' + G.cls); G.nums.push({ x: P.x, y: P.y - 30, v: lb, t: 0.8, c: G.cls === 'priest' ? '#ffe39a' : '#cfe6ff', s: 2 }); if (G.cls === 'ranger') G.fx.push({ kind: 'spark', x: P.x + P.face * 10, y: P.y - 14, ang: P.atkAng || 0, len: 18, sp: 60, t: 0.18, max: 0.18, c: '#ffffff' }); sfx('block'); return; } // v2.23 직업 패시브 표시
    if (!kill && !dot && hasRelic('feather') && Math.random() < 0.05) { P.inv = 0.4; G.nums.push({ x: P.x, y: P.y - 26, v: '0', t: 0.5, c: '#cfe6ff', s: 1 }); sfx('block'); for (let i = 0; i < 6; i++) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(8, 20), vx: rand(-30, 30), vy: rand(-40, -10), t: 0.5, c: '#eef6ff', g: 30 }); return; } // v2.19 수호 깃털
    let dmg = 1; G.hitStage = G.stage; // v2.36 순례자의 지팡이 기록 (이번 챕터에 맞음)
    if (s.curse.has('glass') && Math.random() < 0.25) dmg = 2;
    if (!dot && src && ascOn(3) && (src.type === 'boss' || isElite(src))) dmg = 2; // 잿불 3 날 선 칼
    if (!dot && ascOn(8) && Math.random() < 0.2) dmg = 2; // 잿불 8 피의 칼
    if (!kill && hasRelic('crown')) dmg *= 2; // v2.19 깨진 왕관 조각
    if (kill) dmg = P.hp;
    if (G.dun && G.dun.cur && G.dun.cur.type === 'boss') G.bossClean = false; // v2.02 무피격 훈장 실패
    if (!kill && (P.armor || 0) > 0) { // 방패가 대신 깨진다
      const holyHit = (P.holyArmor || 0) > 0; if (holyHit) P.holyArmor--; // 빛의 가호가 먼저 깨진다
      P.armor--; P.inv = Math.max(P.inv, 0.9); P.hurtT = 0.15; sfx('block'); hitstop = Math.max(hitstop, 0.06);
      for (let i = 0; i < 10; i++) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(6, 20), vx: rand(-60, 60), vy: rand(-70, -10), t: rand(0.3, 0.6), c: holyHit ? pick(['#ffe9a0', '#ffd34d', '#fffbe6']) : pick(['#c8d8e0', '#8a98a8', '#f0f4f8']), g: 120 });
      G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 8, grow: 160, t: 0.35, max: 0.35, c: '#c8d8e0' });
      if (!dot) { gearOnHurt(); engOnHurt(src); } // v2.47 희망
      return;
    }
    if (!kill && !dot && P.poisonT > 0) { dmg += 1; P.poisonT = 0; } // v2.50 중독 하트: 이번 피격은 한 칸, 중독은 풀림
    P.hp -= dmg;
    if (!dot) { gearOnHurt(); engOnHurt(src); } // v2.47 희망
    if (dot) { P.hurtT = 0.15; sfx('hurt'); flashT = Math.max(flashT, 0.05); flashColor = '#ff1a28'; }
    if (!dot) {
      P.inv = TOUCH.on ? 1.2 : 0.9; P.hurtT = 0.2; sfx('hurt'); buzz(35); // v2.27 모바일 보정: 피격 뒤 무적 1.2초 (PC 0.9)
      addShake(7, src && src.x != null ? Math.atan2(P.y - src.y, P.x - src.x) : null);
      if (src && src.x != null && !unblockable && !engSteady()) { const ka = Math.atan2(P.y - src.y, P.x - src.x); P.kx = Math.cos(ka) * 170; P.ky = Math.sin(ka) * 170; } // v2.47 버티는 발
      hitstop = Math.max(hitstop, 0.07); zoomK = Math.max(zoomK, 0.02);
      flashT = Math.max(flashT, 0.07); flashColor = '#ff1a28';
      if (G.combo) G.combo.n = 0;
      P.gauge = Math.min(100, P.gauge + 6 * s.gaugeRate);
      burst(P.x, P.y - 10, '#a3161c', 10); splat(P.x, P.y, 8);
    }
    if (P.hp <= 0) playerDie();
  }
  // v2.00 회복은 반 칸 단위. 작은 회복은 모아 두었다가 반 칸이 차면 채운다 (옛 HP 10% ≈ 반 칸)
  function healHalves(n) {
    const P = G.player, s = G.stats; if (!P || P.dead || !(n > 0)) return 0;
    if (P.hp >= s.hp) { P.hpF = 0; return 0; }
    if (hasRelic('pact')) n *= 0.5; // v2.19 피의 계약
    P.hpF = (P.hpF || 0) + n; const k = Math.floor(P.hpF + 1e-6); if (k <= 0) return 0;
    P.hpF -= k; const got = Math.min(k, s.hp - P.hp); P.hp += got; if (P.hp >= s.hp) P.hpF = 0;
    if (got > 0) G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 6, grow: 90, t: 0.35, max: 0.35, c: '#ff6a7a' });
    return got;
  }
  const healPct = p => healHalves(p * 10 * ASCF.heal());
  // v2.07 유물: 보스 처치 때 떨어짐 · 이번 런 동안 유지 · 효과는 나중에 더 늘림
  const RELICS = { // v2.19 보스가 아직 없는 것 중 무작위로 떨어뜨린다
    finger: { n: '거인의 손가락뼈', d: '공격력이 5% 증가합니다.', c: '#e8dcc0' },
    boots: { n: '날쌘 장화 굽', d: '이동 속도가 12% 증가합니다.', c: '#a8d070' },
    eye: { n: '사냥꾼의 눈', d: '치명타 확률이 10%p 증가합니다.', c: '#ffd34d' },
    hourglass: { n: '모래시계 조각', d: '스킬 재사용 대기 시간이 10% 감소합니다.', c: '#c8b080' },
    emberheart: { n: '잿불 심장', d: '정예나 보스를 처치하면 하트 반 칸을 회복하고, 그 자리에 잿불 폭발이 일어납니다.', c: '#ff8a3a' },
    seal: { n: '녹슨 기사단 인장', d: '역습 동안 적에게 쌓이는 그로기가 2배가 됩니다.', c: '#a8acb4' },
    drum: { n: '전쟁 북 가죽', d: '각성 중에는 이동 속도가 20% 증가합니다.', c: '#c8563a' },
    slimecore: { n: '분열하는 점액 핵', d: '처치한 적이 10% 확률로 터지며 주변 적에게 피해를 줍니다.', c: '#7ad050' },
    fang: { n: '붉은 엄니', d: '하트가 1칸 이하일 때 공격력이 40% 증가합니다.', c: '#e0303a' },
    feather: { n: '수호 깃털', d: '공격을 맞아도 5% 확률로 피해를 받지 않습니다.', c: '#cfe6ff' },
    greed: { n: '탐욕의 동전', d: '얻는 골드가 50% 증가합니다.', c: '#f0c040' },
    crown: { n: '깨진 왕관 조각', d: '공격력이 30% 오르지만, 받는 피해가 2배가 됩니다.', c: '#b898ff' },
    pact: { n: '피의 계약', d: '적을 처치할 때마다 투지가 10 오르지만, 회복량은 절반으로 감소합니다.', c: '#a3161c' },
    // v2.29 해금 유물 (기록 보관소에서 조건 확인)
    mirror: { n: '깨진 거울', d: '역습 시간이 0.6초 증가합니다.', c: '#b8d8f0' },
    glove: { n: '도둑의 장갑', d: '상자를 열 때마다 골드를 30 얻습니다.', c: '#8a7aa0' },
    oldmap: { n: '낡은 지도', d: '비밀 방의 위치가 지도에 표시됩니다.', c: '#e8d8a8' },
    gravedirt: { n: '무덤 흙 한 줌', d: '보스 방에 들어가면 방패를 1개 얻습니다.', c: '#8a6a50' },
    horn: { n: '사냥꾼의 나팔', d: '정예를 처치하면 3초 동안 공격력이 25% 증가합니다.', c: '#f0e0b0' },
    coal: { n: '모닥불 숯', d: '모닥불에서 고를 수 있는 축복이 1개 증가합니다.', c: '#ff9a3a' },
    twincoin: { n: '쌍둥이 동전', d: '챕터마다 상점 물건 하나를 50% 할인된 가격에 살 수 있습니다.', c: '#f0c040' },
    cloak: { n: '잿빛 깃털 망토', d: '점멸 거리가 20% 증가합니다.', c: '#b0b0b8' },
    deadring: { n: '망자의 반지', d: '쓰러질 때 50% 확률로 하트 1칸을 가지고 다시 일어납니다. 한 판에 한 번만 판정합니다.', c: '#b060e0' },
    scales: { n: '왕의 저울', d: '가지고 있는 무기 1자루마다 공격력이 2% 증가합니다.', c: '#e0b040' },
    // v2.36 해금 유물 2차 (12종)
    prism: { n: '프리즘 조각', d: '색 조각을 주우면 15% 확률로 1개를 더 얻습니다.', c: '#d8ecff' },
    brush: { n: '잿빛 붓', d: '방을 칠할 때 색 조각을 1개 더 얻습니다.', c: '#b8b8c0' },
    wick: { n: '성난 심지', d: '분노의 빛 단계가 오를 때마다 치명타 피해가 10%p 증가합니다.', c: '#ff5a4a' },
    droplet: { n: '고요한 물방울', d: '퍼펙트 회피 직후 다음 공격의 피해가 50% 증가합니다.', c: '#5aa8ff' },
    lantern: { n: '희망의 등불', d: '모닥불에서 쉬면 방패를 1개 얻습니다.', c: '#6ad84a' },
    duelband: { n: '결투자의 띠', d: '역습 중 적을 처치하면 역습 시간이 0.3초 증가합니다. 역습 한 번에 최대 1.2초까지 증가합니다.', c: '#e0303a' },
    glassheart: { n: '유리 심장', d: '최대 하트가 1칸 줄어들고, 공격력이 25% 증가합니다.', c: '#c8e8f8' },
    chain: { n: '쇠사슬 고리', d: '경직된 적에게 주는 피해가 20% 증가합니다.', c: '#d0d4dc' },
    staff: { n: '순례자의 지팡이', d: '방에 들어가면 3초 동안 이동 속도가 30% 증가합니다.', c: '#c89060' },
    invhorn: { n: '침입자의 뿔', d: '난입자를 물리치고 얻는 상자에서 유물이 반드시 나옵니다.', c: '#c8303a' },
    candle: { n: '마지막 촛불', d: '방에 적이 1마리만 남으면 그 적에게 주는 피해가 50% 증가합니다. 보스에게는 적용되지 않습니다.', c: '#ff9a3a' },
    banner5: { n: '다섯 갈래 깃발', d: '코코아의 기록 보관소에서 해금한 항목 1개마다 공격력이 1% 증가합니다. 최대 15%까지 증가합니다.', c: '#b070f0' },
  };
  // v2.21 유물마다 고유 도트 (9×9칸) — MAPS·PAL에 'relic_키'로 등록해 바닥 드랍·HUD·캐릭터 창에 같이 쓴다
  const RELIC_ART = {'finger': {'rows': ['......kkk', '.....kwWk', '....kwWDk', '...kkDkk.', '..kwWk...', '.kwWDk...', 'kkDkk....', 'kwWk.....', 'kkk......'], 'pal': {'w': '#f0e6cc', 'W': '#c8b890', 'D': '#8a7a5a', 'k': '#0b0a0e'}}, 'boots': {'rows': ['..kkkk...', '..kbBk...', '..kbBk.g.', '..kbBkgG.', '.kkbBkkg.', 'kbbbbBBk.', 'kbbbbbBBk', 'kSSSSSSSk', '.kkkkkkk.'], 'pal': {'b': '#8a5a32', 'B': '#5a3a1e', 'S': '#3a2a1a', 'g': '#c8f080', 'G': '#78b040', 'k': '#0b0a0e'}}, 'eye': {'rows': ['.........', '..kkkkk..', '.kwwwwwk.', 'kwwYYYwwk', 'kwYkKkYwk', 'kwwYYYwwk', '.kwwwwwk.', '..kkkkk..', '.........'], 'pal': {'w': '#e8e4dc', 'Y': '#e8b830', 'k': '#0b0a0e', 'K': '#ffffff'}}, 'hourglass': {'rows': ['kkkkkkkkk', '.kGGGGGk.', '..kssSk..', '...kSk...', '....k....', '...kSk...', '..ksSSk..', '.kGGGGGk.', 'kkkkkkkkk'], 'pal': {'G': '#a07840', 's': '#f0d898', 'S': '#c8a058', 'k': '#0b0a0e'}}, 'emberheart': {'rows': ['.kk...kk.', 'kRRk.kRRk', 'kRhRkRRRk', 'kRhYRRRRk', 'kRRYWYRRk', '.kRRYRRk.', '..kRRRk..', '...kRk...', '....k....'], 'pal': {'R': '#c03a1a', 'h': '#ff8a5a', 'Y': '#ffb040', 'W': '#fff0a0', 'k': '#0b0a0e'}}, 'seal': {'rows': ['..kkkkk..', '.kgGGGgk.', 'kgGkkkGgk', 'kGkrrrkGk', 'kGkrWrkGk', 'kGkrrrkGk', 'kgGkkkGgk', '.kgGGGgk.', '..kkkkk..'], 'pal': {'g': '#5a5864', 'G': '#a8acb4', 'r': '#8a5a2a', 'W': '#d8a860', 'k': '#0b0a0e'}}, 'drum': {'rows': ['.kkkkkkk.', 'kwwwwwwwk', 'kWwwwwwWk', 'kRkRkRkRk', 'kRRkRkRRk', 'kRkRkRkRk', 'kDRRRRRDk', '.kkkkkkk.', 'k.......k'], 'pal': {'w': '#e8d8b0', 'W': '#c8b088', 'R': '#c8563a', 'D': '#7a2a1a', 'k': '#0b0a0e'}}, 'slimecore': {'rows': ['...kkk...', '..kgggk..', '.kgGgggk.', 'kgGgYggGk', 'kgggYYggk', 'kggGYggGk', '.kgggggk.', '..kkkkk..', '.........'], 'pal': {'g': '#5ab838', 'G': '#a8f070', 'Y': '#f0f8c0', 'k': '#0b0a0e'}}, 'fang': {'rows': ['kk.......', 'kWWk.....', '.kwWWk...', '..kwwWk..', '...kwwWk.', '....kRwk.', '.....kRRk', '......kRk', '.......k.'], 'pal': {'W': '#fff4e0', 'w': '#d8c8a8', 'R': '#c0202a', 'k': '#0b0a0e'}}, 'feather': {'rows': ['......kk.', '.....kwwk', '....kwbwk', '...kwbwbk', '..kwbwbk.', '.kwbwbk..', '.kbwbk...', '.kkkk....', 'kq.......'], 'pal': {'w': '#ffffff', 'b': '#a8c8f0', 'q': '#8a8aa0', 'k': '#0b0a0e'}}, 'greed': {'rows': ['..kkkkk..', '.kYYYYYk.', 'kYyYWYyYk', 'kYyWYWyYk', 'kYyyWyyYk', 'kYyWYWyYk', 'kYyYWYyYk', '.kYYYYYk.', '..kkkkk..'], 'pal': {'Y': '#f0c040', 'y': '#c08a18', 'W': '#fff4a0', 'k': '#0b0a0e'}}, 'crown': {'rows': ['.k...k...', 'kGk.kGk.k', 'kGGkGGkGk', 'kGPGGPGGk', 'kGGGGGGk.', 'kgggggk..', '.kkkkk...', '.........', '.........'], 'pal': {'G': '#d8c0ff', 'g': '#8a6ac8', 'P': '#ff5a8a', 'k': '#0b0a0e'}}, 'pact': {'rows': ['....k....', '...kRk...', '...kRk...', '..kRhRk..', '.kRhRRRk.', '.kRRRRRk.', '.kRRRRDk.', '..kRDDk..', '...kkk...'], 'pal': {'R': '#a3161c', 'h': '#ff6a6a', 'D': '#5a0a0e', 'k': '#0b0a0e'}}};

  Object.assign(RELIC_ART, { // v2.29 해금 유물 도트 (9×9)
    mirror: { rows: ['..kkkkk..', '.kyYYYyk.', 'kyWwbwWyk', 'kYwbWwbYk', 'kYbWkWwYk', 'kYwwkbwYk', 'kyWbwkWyk', '.kyYYYyk.', '..kkkkk..'], pal: { k: '#0b0a0e', y: '#a87a2a', Y: '#e0b040', W: '#e8f4ff', w: '#b8d8f0', b: '#7aa8d0' } },
    glove: { rows: ['..k.k.k..', '.kgkgkgk.', '.kgkgkgkk', '.kgggggGk', 'kGkgggggk', 'kGGgggggk', '.kGGgggk.', '..kRRRk..', '..kkkkk..'], pal: { k: '#0b0a0e', g: '#7a6a8a', G: '#4a3a58', R: '#a0303a' } },
    oldmap: { rows: ['.kkkkkkk.', 'kpppPpppk', 'kpPpprprk', 'kppPpPrpk', 'kpppPrprk', 'kPpppPppk', 'kppPpppPk', '.kpppPpk.', '..kkkkk..'], pal: { k: '#0b0a0e', p: '#e8d8a8', P: '#c0a870', r: '#c0303a' } },
    gravedirt: { rows: ['.........', '...kkk...', '..kdDdk..', '.kdDwwdk.', '.kDdwdDk.', 'kdDdDdDdk', 'kDdDdDdDk', 'kkkkkkkkk', '.........'], pal: { k: '#0b0a0e', d: '#6a5038', D: '#3e2c20', w: '#e8e0c8' } },
    horn: { rows: ['.......kk', '......kHk', '.....kHhk', 'kk..khhk.', 'kHkkhhk..', 'khHhhk...', 'kHhhk....', '.kkkk....', '.........'], pal: { k: '#0b0a0e', H: '#f0e0b0', h: '#c8a060' } },
    coal: { rows: ['.........', '...kkk...', '..kcOck..', '.kcOoOck.', '.kOoYoOk.', '.kcOoOck.', '..kcOck..', '...kkk...', '.........'], pal: { k: '#0b0a0e', c: '#3a3038', O: '#d0502a', o: '#ff9a3a', Y: '#ffe08a' } },
    twincoin: { rows: ['.kkkk....', 'kyYYyk...', 'kYwYYk...', 'kyYkkkk..', '.kkyYYyk.', '...kYwYYk', '...kyYYyk', '....kkkk.', '.........'], pal: { k: '#0b0a0e', y: '#c08a20', Y: '#f0c040', w: '#fff2b0' } },
    cloak: { rows: ['...kkk...', '..kfFfk..', '.kfFfFfk.', '.kFfFfFk.', 'kfFfFfFfk', 'kFfFfFfFk', 'kfFkFkFfk', 'kk.k.k.kk', '.........'], pal: { k: '#0b0a0e', f: '#c0c0c8', F: '#7a7a88' } },
    deadring: { rows: ['...kkk...', '..kVvVk..', '...kvk...', '.kkSsSkk.', 'kSk...kSk', 'ks.....sk', 'kSk...kSk', '.kkSsSkk.', '...kkk...'], pal: { k: '#0b0a0e', V: '#c070f0', v: '#7030a0', S: '#b8bcc8', s: '#6a6e7a' } },
    scales: { rows: ['....k....', '.kkkYkkk.', '.k..Y..k.', 'kYk.Y.kYk', 'kyk.Y.kyk', '.k..Y..k.', '...kYk...', '..kYYYk..', '..kkkkk..'], pal: { k: '#0b0a0e', Y: '#e0b040', y: '#a87a2a' } },
  });
  Object.assign(RELIC_ART, { // v2.36 해금 유물 2차 도트
    prism: { rows: ["....k....", "...kWk...", "...kWk...", "..kWwRk..", "..kwWOk..", ".kWwwYGk.", ".kwWwwBk.", "kWwwwwwVk", "kkkkkkkkk"], pal: {"k": "#0b0a0e", "W": "#ffffff", "w": "#a8c0e0", "R": "#ff4a4a", "O": "#ff9a3a", "Y": "#ffd34d", "G": "#62d46e", "B": "#5aa8ff", "V": "#b070f0"} },
    brush: { rows: ["......kkk", ".....kHhk", "....kHhk.", "...kHhk..", "..kmMk...", ".kgGmk...", "kgGgk....", "kGgk.....", "kkk......"], pal: {"k": "#0b0a0e", "H": "#c89060", "h": "#8a5a30", "m": "#c0c0c8", "M": "#7a7a88", "g": "#b8b8c0", "G": "#6a6a74"} },
    wick: { rows: ["......kR.", ".....kRYk", "....kk.R.", "...kSk...", "..kkkkk..", ".kBbBBBk.", "kBbBBBBBk", "kBBBBBbBk", ".kkkkkkk."], pal: {"k": "#0b0a0e", "R": "#ff4a4a", "Y": "#ffd34d", "S": "#c8a070", "B": "#3a3040", "b": "#7a6a88"} },
    droplet: { rows: ["....k....", "...kBk...", "...kbk...", "..kbbBk..", ".kbwbbBk.", ".kbwbbBk.", ".kbbbBBk.", "..kBBBk..", "...kkk..."], pal: {"k": "#0b0a0e", "B": "#2a6ac8", "b": "#5aa8ff", "w": "#e8f4ff"} },
    lantern: { rows: ["...kkk...", "..k...k..", ".kkkkkkk.", ".kYyOyYk.", ".kyOoOyk.", ".kYyOyYk.", ".kkkkkkk.", "..kMMMk..", "...kkk..."], pal: {"k": "#0b0a0e", "Y": "#e0b040", "y": "#a87a2a", "O": "#ff9a3a", "o": "#fff2b0", "M": "#5a4a3a"} },
    duelband: { rows: [".........", ".kkkkkkk.", "kRRRRRRRk", "krrrrrrrk", ".kkkkkRkk", ".....kRrk", "....kRrRk", "....kRkrk", "....kk.kk"], pal: {"k": "#0b0a0e", "R": "#e0303a", "r": "#901820"} },
    glassheart: { rows: [".kk...kk.", "kWwk.kwwk", "kwWwkwwbk", "kwwWwwbbk", ".kwwwbbk.", "..kwbbk..", "...kbk...", "....k....", "........."], pal: {"k": "#0b0a0e", "W": "#ffffff", "w": "#c8e8f8", "b": "#7ab0d8"} },
    chain: { rows: [".kkkk....", "kSssSk...", "ks..kkkk.", "kSkkSssSk", ".kkSk..sk", "...kSssSk", "....kkkk.", ".........", "........."], pal: {"k": "#0b0a0e", "S": "#e0e4ec", "s": "#7a808c"} },
    staff: { rows: ["......kkk", ".....kGgk", "....kkGgk", "...kWkkk.", "..kWk....", ".kWk.....", "kWk......", "kk.......", "........."], pal: {"k": "#0b0a0e", "G": "#d0a050", "g": "#8a6020", "W": "#c89060"} },
    invhorn: { rows: [".......kk", "......kRk", ".....kRrk", "....kRrk.", "...kRrk..", "..kRrk...", ".kWRrk...", "kWWkk....", "kkk......"], pal: {"k": "#0b0a0e", "R": "#d8404a", "r": "#801820", "W": "#e8dcc0"} },
    candle: { rows: ["....k....", "...kOk...", "...kYk...", "....k....", "...kWk...", "...kWk...", "...kwk...", "..kwwwk..", "..kkkkk.."], pal: {"k": "#0b0a0e", "O": "#ff9a3a", "Y": "#fff2b0", "W": "#f0e8d8", "w": "#b8a890"} },
    banner5: { rows: ["kk.......", "kWkkkkkk.", "kWRBGYPk.", "kWRBGYPkk", "kWkkkkkk.", "kWk......", "kWk......", "kWk......", "kkk......"], pal: {"k": "#0b0a0e", "W": "#c89060", "R": "#ff4a4a", "B": "#5aa8ff", "G": "#62d46e", "Y": "#ffd34d", "P": "#b070f0"} },
  });
  for (const k in RELIC_ART) { MAPS['relic_' + k] = RELIC_ART[k].rows; PAL['relic_' + k] = RELIC_ART[k].pal; }
  const hasRelic = k => !!(G && G.relics && G.relics.includes(k));
  const RELIC_SLOTS = 4; // v2.19 유물은 글 없이 칸으로 (챕터 보스마다 하나씩)
  function relicSlotsHTML() {
    const R = (G && G.relics) || [];
    return `<div class="relicSlots">${Array.from({ length: Math.max(RELIC_SLOTS, R.length) }, (_, i) => { const k = R[i], r = k && RELICS[k];
      return r ? `<div class="relicRow" style="--c:${r.c}" data-name="${r.n}" data-tip="${r.d}"><img class="px" src="${relicIconURL(k)}"></div>` : `<div class="relicRow empty" data-name="빈 유물 칸" data-tip="보스를 쓰러뜨리면 유물을 얻는다"></div>`; }).join('')}</div>`;
  }
  let RELIC_URL = null;
  // v2.19 도트 말풍선: #ui 안에 두어 다른 도트 안내문과 같은 배율·글꼴로 보인다
  const pxTip = (() => { let el = null; const ui = () => document.getElementById('ui');
    const get = () => { if (!el) { el = document.createElement('div'); el.className = 'pxTip pf glass'; ui().appendChild(el); } return el; };
    const k = () => { const r = ui().getBoundingClientRect(); return { r, s: r.width / 768 || 1 }; };
    return {
      show(html, c) { const t = get(); t.innerHTML = html; t.style.setProperty('--c', c || 'var(--gold-l)'); t.classList.add('on'); },
      at(cx, cy) { const t = get(), { r, s } = k(); let x = (cx - r.left) / s + 10, y = (cy - r.top) / s + 10; x = Math.min(x, 768 - t.offsetWidth - 4); y = Math.min(y, 432 - t.offsetHeight - 4); t.style.left = Math.max(4, x) + 'px'; t.style.top = Math.max(4, y) + 'px'; },
      beside(node) { const t = get(), { r, s } = k(), b = node.getBoundingClientRect(); let x = (b.right - r.left) / s + 6, y = (b.top - r.top) / s; if (x + t.offsetWidth > 764) x = (b.left - r.left) / s - t.offsetWidth - 6; y = Math.min(y, 432 - t.offsetHeight - 4); t.style.left = Math.max(4, x) + 'px'; t.style.top = Math.max(4, y) + 'px'; },
      hide() { if (el) el.classList.remove('on', 'pin'); }, get el() { return get(); } };
  })();
  { // 유물 효과는 마우스를 올렸을 때만
    const at = e => e.target.closest && e.target.closest('.relicRow[data-tip],.palRow[data-tip],#bkPanel[data-tip]');
    addEventListener('mouseover', e => { const r = at(e); if (!r) return; pxTip.show(`<div class="tN">${r.dataset.name}</div><div class="tD">${r.dataset.tip}</div>`, getComputedStyle(r).getPropertyValue('--c').trim() || null); pxTip.at(e.clientX, e.clientY); });
    addEventListener('mousemove', e => { if (at(e)) pxTip.at(e.clientX, e.clientY); });
    addEventListener('mouseout', e => { const r = at(e); if (r && !r.contains(e.relatedTarget)) pxTip.hide(); });
  }
  { // 스킬 아이콘에 마우스를 올리면 현재 직업/무기에 맞는 스킬 설명 표시
    const SK_IDS = ['skA', 'skK', 'skL', 'skD'];
    const skBox = $('skills');
    if (skBox) skBox.style.pointerEvents = 'auto';
    SK_IDS.forEach(id => { const el = $(id); if (el) el.style.pointerEvents = 'auto'; });
    const skAt = e => e.target.closest && e.target.closest('#skA,#skK,#skL,#skD');
    function skTipData(id) {
      const cls = (G && G.cls) || CUR, C = CLASSES[cls] || CLASSES.knight;
      const ws = G && typeof wSkill === 'function' ? wSkill() : null;
      const m = (ws && SK_META[ws]) || {};
      if (id === 'skA') {
        const nm = cls === 'gunner' ? '사격' : cls === 'mage' ? '마력탄' : '기본 공격';
        return [nm + ' <span class="key">좌클릭</span>', C.atkD, '#f4ede0']; // v2.63 키캡
      }
      if (id === 'skK') {
        const nm = m.K || C.skill;
        const cd = (G && G.stats) ? Math.max(0.5, C.skillCd * (1 - G.stats.cdr)).toFixed(1) : C.skillCd;
        const eq = G && typeof eqWeapon === 'function' ? eqWeapon(cls) : null;
        const extra = (ws && m.K && eq && eq.desc) ? eq.desc : C.skillD;
        return [`${nm} <span class="key">우클릭</span> <span style="color:var(--quiet)">쿨타임 ${cd}초</span>`, extra, '#9fd2ff'];
      }
      if (id === 'skL') {
        const nm = m.L || C.awaken;
        const d = (ws === 'hourglass' && EQUIP_FX.hourglass) ? EQUIP_FX.hourglass.d : C.awakenD;
        return [`${nm} <span class="key">E</span> <span style="color:var(--quiet)">각성 게이지 100%</span>`, d, '#ffd34d'];
      }
      return ['점멸 <span class="key">SPACE</span>', '짧은 거리를 순간 이동해 회피 · 공격 직전 사용 시 퍼펙트 회피', '#9ee88a'];
    }
    addEventListener('mouseover', e => {
      const s = skAt(e); if (!s) return;
      const [n, d, c] = skTipData(s.id);
      pxTip.show(`<div class="tN">${n}</div><div class="tD">${d}</div>`, c);
      pxTip.at(e.clientX, e.clientY);
    });
    addEventListener('mousemove', e => { if (skAt(e)) pxTip.at(e.clientX, e.clientY); });
    addEventListener('mouseout', e => { const s = skAt(e); if (s && !s.contains(e.relatedTarget)) pxTip.hide(); });
  }
  const RELIC_URLS = {};
  const relicIconURL = key => { const k = RELIC_ART[key] ? key : 'emberheart'; return RELIC_URLS[k] || (RELIC_URLS[k] = (() => { const A = RELIC_ART[k], m = A.rows, [c, g] = mkCanvas(m[0].length * 2, m.length * 2); m.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.' || !A.pal[ch]) return; g.fillStyle = A.pal[ch]; g.fillRect(x * 2, y * 2, 2, 2); })); return c.toDataURL(); })()); };
  const ARMOR_MAX = 4, HEART_CAP = 12; // v2.02 최대 하트 6칸
  // v2.02 최대 하트 +n칸 (반 칸 단위 2n). 늘어난 칸은 채워서 준다
  function heartUp(n, why) {
    const P = G.player, before = G.stats.hp;
    G.heartBonus = (G.heartBonus || 0) + Math.max(0, Math.min(n * 2, HEART_CAP - before)); G.stats = calcStats(G.buffs); // 6칸을 넘는 몫은 쌓지 않음
    const d = G.stats.hp - before; P.hp = clamp(P.hp + Math.max(0, d), 1, G.stats.hp);
    if (d > 0) { sfx('legend'); G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 8, grow: 200, t: 0.6, max: 0.6, c: '#ffd34d' }); lootFeed(`${why} — 최대 하트 +${d / 2}칸`, '#ffd34d', 3000); }
    else if (n > 0) lootFeed(`${why} — 하트가 이미 가득하다 (최대 6칸)`, '#9a8f8a', 3000);
    hudPrev.heart = null;
  }
  function heartDown(n) { const P = G.player; G.heartBonus = (G.heartBonus || 0) - n * 2; G.stats = calcStats(G.buffs); P.hp = clamp(P.hp, 1, G.stats.hp); hudPrev.heart = null; }
  function addArmor(n, holy) { const P = G.player; if (!P) return; const a0 = P.armor || 0; P.armor = Math.min(ARMOR_MAX, a0 + n); if (holy) P.holyArmor = Math.min(P.armor, (P.holyArmor || 0) + (P.armor - a0)); G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 6, grow: 110, t: 0.4, max: 0.4, c: holy ? '#ffe9a0' : '#c8d8e0' }); } // v2.19 holy: 사제의 빛의 가호 (방패 대신 빛 구슬로 표시)
  function chapterArmor() { const n = (G.cls === 'knight' ? 1 : 0) + ((G.stats.sets.order || 0) >= 2 ? 1 : 0); if (n) addArmor(n); } // 기사: 챕터마다 방패 +1, 기사단 2세트 +1
