'use strict';
// 잿빛 왕관 원정대 · combat.js — 합친 파일: 08_enemies.js, 09_skills.js, 10_player.js (v3.84 파일 정리 · typeof로 먼저 확인하는 이름 몇 개는 var로 선언)

// ==================================================================== 08_enemies.js
'use strict';
// 잿빛 왕관 토벌대 — 08_enemies.js : 무기 휘두르기, 적 공통, 난입자 1~4장, 적 상태 효과, 발도르, 잿빛 왕, 판정
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ---------------------------------------------------------------- 적
  function makeEnemy(type, x, y) {
    const sc = Object.assign({}, phaseScale());
    const base = {
      ghoul: { hp: 60, atk: 10, def: 20, spd: 46, r: 7, kb: 1, blade: 'squire' },
      exec: { hp: 420, atk: 19, def: 60, spd: 38, r: 12, kb: 0.25, grogiMax: 60, blade: 'headsman' }, mordred: { hp: 500, atk: 20, def: 70, spd: 40, r: 13, kb: 0.2, grogiMax: 70, blade: 'royal' }, queen: { hp: 400, atk: 17, def: 40, spd: 36, r: 11, kb: 0.3, grogiMax: 55 }, 
      dog: { hp: 42, atk: 12, def: 10, spd: 70, r: 7, kb: 1 },
      ghost: { hp: 230, atk: 15, def: 40, spd: 56, r: 8, kb: 0.6 },
      cultist: { hp: 45, atk: 12, def: 10, spd: 40, r: 7, kb: 1 },
      bloat: { hp: 70, atk: 20, def: 5, spd: 30, r: 9, kb: 0.5 },
      slime: { hp: 34, atk: 7, def: 5, spd: 95, r: 7, kb: 1.2 },
      bigslime: { hp: 100, atk: 11, def: 10, spd: 80, r: 11, kb: 0.6 },
      goblin: { hp: 44, atk: 8, def: 10, spd: 58, r: 7, kb: 1 },
      grider: { hp: 200, atk: 13, def: 20, spd: 66, r: 9, kb: 0.5 }, gbomber: { hp: 130, atk: 16, def: 10, spd: 48, r: 7, kb: 0.7 }, // v3.30 1장 준엘리트
      gcatapult: { hp: 150, atk: 14, def: 30, spd: 0, r: 16, kb: 0 }, // v3.31 1장 거치 무기: 고블린 투석기
      gballista: { hp: 200, atk: 18, def: 30, spd: 0, r: 18, kb: 0 }, // v3.32 2장 거치 무기: 해골 발리스타
      ghellaltar: { hp: 180, atk: 16, def: 20, spd: 0, r: 24, kb: 0 }, // v3.34 3장 거치 무기: 지옥불 의식대
      gthrower: { hp: 36, atk: 9, def: 5, spd: 46, r: 7, kb: 1 },
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
    const kind = null;
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
    if (type === 'goblin' || type === 'garcher') ne.gv = randi(0, 3); // v3.25 고블린 피부 4색 (오크와 같은 방식)
    if (type === 'ghoul') { ne.sq = Math.random() < 0.5; if (ne.sq) ne.sv = randi(0, 2); else ne.blade = null; } // v0.96: 감염된 주민과 타락한 종자 반반, 종자는 외형 3종
    orcInit(ne);
    if (ascOn(10) && isEliteT(type)) { ne.ascAff = pick(Object.keys(ASC_AFF)); if (ne.ascAff === 'fast') ne.spd *= 1.3; else if (ne.ascAff === 'tough') { ne.hp *= 1.35; ne.maxHp *= 1.35; } else ne.atk *= 1.2; } // v1.96 잿빛 왕관 특성
    return ne;
  }
  function cancelTele(owner) { G.tele = G.tele.filter(t => t.owner !== owner); G.fx = G.fx.filter(f => !(f.kind === 'lob' && f.owner === owner)); }
  function alertMark(e, h, big) { G.fx.push({ kind: 'alert', o: e, h, s: big ? 3 : 2, t: 0.5, max: 0.5 }); }
  const restAng = e => e.blade === 'boss' ? (e.face > 0 ? -70 : -110) * DEG /* v2.50 발도르: 기사처럼 칼을 세워 듦 */ : e.type === 'mordred' ? (e.face > 0 ? -128 : -52) * DEG : e.type === 'exec' ? (e.face > 0 ? -152 : -28) * DEG : (e.face > 0 ? 125 : 55) * DEG; // 처형인은 도끼를 어깨에, 기수는 깃대를 세워 듦

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
    if (typeof HABIULT !== 'undefined') { const a = HABIULT.threat(e); if (a != null) return a; } // 등 맡기기: 하비 산탄도 읽고 점멸
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
      const fl = gold ? I.chakBf : I.chakAf; dshRect(ctx, (Math.round(c.x) & ~1) - 8, Math.round(c.y) & ~1, 16, 2, 0.5);
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
  // ================================================================ v1.57 난입: 챕터마다 가장 큰 격전지 하나를 무작위로 골라 두고, 그 방을 클리어하면 난입자가 나타난다
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
    if (G.deadSays) { G.deadSays = G.deadSays.filter(d => time < d.until); for (const d of G.deadSays) if (!(d.from > time)) drawBubble(d.text, d.x, d.y, 0); } // v3.61 from: 늦게 뜨는 말주머니 (문장 나눠 차례로)
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
    if (e.type === 'slime' || e.type === 'bigslime' || e.type === 'toxslime') e.squash = Math.max(0, e.squash - dt);
    if (e.type === 'gbrute') bruteTick(e, dt);
    if (e.type === 'boar') boarTick(e, dt);
    if (e.type === 'crow') crowTick(e, dt);
    if (e.type === 'mother') motherTick(e, dt);
    if (e.orc) orcTick(e, dt);
    if (e.rallyT > 0) { e.rallyT -= dt; if (e.rallyT <= 0 && e.rallied) { e.atk = e.atkBase; e.rallied = false; } }
    if (e.type === 'mordred') mordredTick(e, dt); else if (e.type === 'queen') queenTick(e, dt); else if (e.type === 'exec') execTick(e, dt);
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
    else if (e.type === 'shaman' && e.crewOf && e.crewOf.type === 'ghellaltar' && GHELL.updCrew(e, dt, d, a, moveTo)) { /* v3.34 지옥불 의식대 주술사 */ }
    else if (e.orc) updateOrc(e, dt, d, a, moveTo);
    else if (e.type === 'slime' || e.type === 'bigslime') updateSlime(e, dt, d, a);
    else if (e.type === 'toxslime') updateToxSlime(e, dt, d, a);
    else if (e.type === 'gbrute') updateBrute(e, dt, d, a, moveTo);
    else if (e.type === 'boar') updateBoar(e, dt, d, a, moveTo);
    else if (e.type === 'crow') updateCrow(e, dt, d, a);
    else if (e.type === 'cantor') updateCantor(e, dt, d, a, moveTo);
    else if (e.type === 'aguard') updateAGuard(e, dt, d, a, moveTo);
    else if (e.type === 'grider') GSEMI.updRider(e, dt, d, a, moveTo); // v3.30 점액 라이더
    else if (e.type === 'gcatapult') GCAT.update(e, dt); // v3.31 고블린 투석기
    else if (e.type === 'goblin' && e.crewOf && GCAT.updCrew(e, dt, d, a, moveTo)) { /* 투석기 사수 */ }
    else if (e.type === 'gballista') GBAL.update(e, dt); // v3.32 해골 발리스타
    else if (e.type === 'ghellaltar') GHELL.update(e, dt); // v3.34 지옥불 의식대
    else if (e.type === 'ghoul' && e.crewOf && e.crewOf.type === 'gballista' && GBAL.updCrew(e, dt, d, a, moveTo)) { /* 발리스타 조종병 · 사수 */ }
    else if (e.type === 'goblin' && e.helm) GSEMI.updFallen(e, dt, d, a, moveTo); // v3.30 낙마한 고블린: 창 공격
    else if (e.type === 'gbomber') GSEMI.updBomber(e, dt, d, a, moveTo); // v3.30 고블린 폭탄병
    else if (e.type === 'coffin') updateCoffin(e, dt, d, a, moveTo);
    else if (e.type === 'herald') updateHerald(e, dt, d, a, moveTo);
    else if (e.type === 'mother') updateMother(e, dt, d, a, moveTo);
    else if (e.type === 'mordred') updateMordred(e, dt, d, a, moveTo);
    else if (e.type === 'queen') updateQueen(e, dt, d, a, moveTo);
    else if (e.type === 'exec') { if (e.state === 'chase') updateExec(e, dt, d, a, moveTo); }
    else if (e.type === 'ghoul' || e.type === 'ghost' || e.type === 'goblin') {
      if (e.state === 'chase') {
        if (d > 22) moveTo(a, e.spd);
        else if (e.cd <= 0) {
          // 멈춰서 팔을 치켜들고 잠시 버틴 뒤 내려친다 (v3.65 호박색 약한 예고)
          e.state = 'hold'; e.t = e.type === 'ghost' ? 0.7 : e.type === 'goblin' ? 0.55 : 0.6; e.holdMax = e.t; e.holdAng = a; if (e.blade) e.bladeTarget = a - (Math.cos(a) > 0 ? 1 : -1) * 120 * DEG;
          e.face = Math.cos(a) > 0 ? 1 : -1; e.lean = -0.2 * e.face;
          weakTele(e, { shape: 'cone', x: e.x, y: e.y, ang: a, arc: 110 * DEG, r: e.type === 'ghost' ? 38 : 30 }, e.t, ['hold']); /* v3.65 잡몹 약한 예고 */
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
      if (!pr.friend && !pr.passed && !P.dead) { // v3.63 투사체 회피 신호 · 판정: 주인공에게 닿기까지 남은 시간(tti)을 재서 퍼펙트 판정 구간이면 번쩍 · 회피를 누른 순간 0.43초 안에 닿을 투사체는 어느 쪽으로 피하든 피한 것으로
        const dx = P.x - pr.x, dy = P.y - pr.y, ux = Math.cos(pr.ang), uy = Math.sin(pr.ang), al = dx * ux + dy * uy, lat = Math.abs(-dx * uy + dy * ux), R = pr.r + P.r;
        const tti = al > 0 && lat < R + 2 ? Math.max(0, (al - Math.sqrt(Math.max(0, R * R - lat * lat))) / Math.max(1, pr.sp)) : 9;
        if (P.dodgeN && pr.dn !== P.dodgeN && P.state === 'dodge') { pr.dn = P.dodgeN; if (pr.tti != null && pr.tti <= 0.43) { pr.dodged = true; if (pr.tti <= PD_WIN() && !P.perfectUsed) perfectDodge(); } }
        pr.tti = tti; pr.warn = !pr.dodged && tti <= PD_WIN(); }
      if (pr.friend) { for (const e of G.enemies) if (!e.dead && Math.hypot(pr.x - e.x, pr.y - (e.y - 8)) < pr.r + e.r + 4) { damageEnemy(e, 1.0, { proc: true, ang: pr.ang, kb: 160, grogi: 6, gauge: 1 }); pr.t = 0; burst(pr.x, pr.y - 10, '#ffd34d', 8); break; } }
      else if (!P.dead && !pr.passed && Math.hypot(pr.x - P.x, pr.y - P.y) < pr.r + P.r) {
        if (pr.dodged) { pr.passed = true; } // 피한 투사체: 반투명하게 몸을 지나감
        else if (P.iframe > 0) { hurtPlayer(pr.dmg, null); pr.passed = true; }
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
    const GG = typeof GRG !== 'undefined' && GRG.ph(e); let hd = 0, ad = 0; // v3.84 그로기: 허리가 꺾여 상체 · 머리 · 팔이 축 처지고 재가 흘러내림 → 재가 빨려 들며 몸이 다시 맞춰짐
    if (GG) { const h = GG.hold; bob = GRG.R2(6 * h) + (GG.br ? 2 : 0); hd = GRG.R2(2 * h); ad = GRG.R2(4 * h); /* v3.84 머리는 몸과 함께 내려가고 한 칸만 더 숙임 (따로 떨어져 보이지 않게) */ tw = GG.shake > 0 ? 2 : 0; lL = lR = 0; }
    const by = e.y + 2 + ya, o = (m, dx, dy) => drawSprite(m, 'ashking', 2, e.x + (tw + dx) * F, by + dy, flip, { white, alpha: al });
    drawShadow(e.x, e.y + 2, 20);
    drawAkRings();
    const hx = e.x + (AK_HAND[0] + tw) * F, hy = by + AK_HAND[1] + bob, bl = BLADES.akScepter, back = !e.sw && Math.cos(e.bladeAng) * F < -0.3;
    if (back) drawBlade(bl, hx, hy, e.bladeAng, al, white);
    for (let up = 0; up >= Math.min(0, bob); up -= 2) { o('akLegL', 0, lL + up); o('akLegR', 0, lR + up); } // 허리를 펴 몸이 올라가면 다리도 그만큼 이어 그려 끊기지 않게
    o('akBody', 0, bob); o('akArm', 0, bob + ad + (walking && ph % 6 < 3 ? 2 : 0));
    const ht = e.headT || 0; if (ht !== e._htP) { e._htUp = ht > (e._htP || 0); e._htP = ht; } o((ht > 0.85 ? 'akHeadF' : ht > 0.15 ? (e._htUp ? 'akHead45H' : 'akHead45') : 'akHeadS') + (e.nc ? 'NC' : ''), /* v2.54 왕관이 떨어진 머리 */ /* v1.52 정면으로 돌아설 때 45° 얼굴은 빈 구멍 */ 0, bob + hd + (walking && (ph === 5 || ph === 6) ? 2 : 0));
    if (GG && al > 0.5) { const PP = G.parts;
      if (GG.hold > 0.6 && Math.random() < 0.9) PP.push({ x: snap2(e.x + F * rand(-14, 18)), y: by - rand(12, 46) + bob, vx: rand(-4, 4), vy: rand(4, 16), t: rand(0.5, 0.9), c: pick(['#86807a', '#5e5a54', '#3e3834']), g: 120, floor: e.y + 3 }); // 몸에서 재가 흘러내림
      if (GG.rec > 0 && GG.rec < 0.85) for (let i = 0; i < 2; i++) { const a = rand(0, TAU), r = rand(34, 56), tx = e.x + F * 4, ty = by - 28, sx0 = tx + Math.cos(a) * r, sy0 = ty + Math.sin(a) * r * 0.6, T = 0.3; PP.push({ x: sx0, y: sy0, vx: (tx - sx0) / T, vy: (ty - sy0) / T, t: T, c: pick(['#86807a', '#ff7a30', '#5e5a54']), g: 0 }); } } // 회복: 흩어진 재가 몸으로 빨려 듦
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
    if (b.stage === 2 && pct <= 0.35) { b.stage = 3; banner('광폭화', '칠흑의 장막이 드리운다'); bossRoar(b, '#ff3050'); cancelTele(b); b.state = 'idle'; b.cd = 0.6; b.vortexT = 0; b.spd *= 1.25; }
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
    if (t.shape === 'circle') return dd <= t.r + pr && !(t.inner && dd < t.inner - pr); // v3.58 도넛: 안쪽 빈 곳은 안전
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

  const PD_WIN = () => (TOUCH.on ? 0.26 : 0.2); // v3.62 퍼펙트 회피 판정 PC 0.16 → 0.2초 · 모바일 0.24 → 0.26초 (구르기 · 점멸 같음)
  let GOD_MODE = false; // v2.40 테스트용 무적 (Shift+O로 켜고 끔, 새로고침하면 꺼짐)
  function hurtPlayer(raw, src, unblockable, dot) {
    if (G && G.player) G.player.idleT = 0;
    const P = G.player;
    if (P.dead || mode !== 'play') return;
    if (G.decoyUpd) return; // v2.41 미끼 잔상을 노린 공격
    if (GOD_MODE) { if (!dot && !(P.godNumT > time)) { P.godNumT = time + 0.3; G.nums.push({ x: P.x, y: P.y - 26, v: '무적', t: 0.5, c: '#9fd2ff', s: 1, txt: true }); } return; } // v2.40 테스트: 무적 (Shift+O)
    if (P.grab && !unblockable) return;
    if (P.miracleT > 0 || P.shieldT > 0) { return; }
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
    const keep = -(censerIn() ? 0.2 : 0) - pasV('parry') + meleeKeep() * (P.state === 'storm' || P.state === 'cast' || P.state === 'aim' ? 0.5 : 1); // 옛 피해 감소 → 그만큼 확률로 흘려냄
    if (!kill && !dot && !unblockable && Math.random() > keep) { P.inv = 0.3; P.evOutT = 0.45; G.fx = G.fx.filter(f => !(f.t >= (f.max || 0) - 0.001 && ['ring', 'impact', 'hitspark', 'hitflash', 'boom'].includes(f.kind) && Math.hypot(f.x - P.x, f.y - (P.y - 10)) < 30)); /* v2.35 몸에 뜨던 원 대신 도트 외곽선 */ const lb = { knight: '흘려냄', ranger: '베어냄', priest: '신의 가호', gunner: '빗나감', mage: '마나 격류' }[G.cls] || '0'; rec('ev_' + G.cls); G.nums.push({ x: P.x, y: P.y - 30, v: lb, t: 0.8, c: G.cls === 'priest' ? '#ffe39a' : '#cfe6ff', s: 2 }); if (G.cls === 'ranger') G.fx.push({ kind: 'spark', x: P.x + P.face * 10, y: P.y - 14, ang: P.atkAng || 0, len: 18, sp: 60, t: 0.18, max: 0.18, c: '#ffffff' }); sfx('block'); return; } // v2.23 직업 패시브 표시
    if (!kill && !dot && hasRelic('feather') && Math.random() < 0.05) { P.inv = 0.4; sfx('block'); for (let i = 0; i < 6; i++) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(8, 20), vx: rand(-30, 30), vy: rand(-40, -10), t: 0.5, c: '#eef6ff', g: 30 }); return; } // v2.19 수호 깃털
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
      if (!ultBusy(P)) P.gauge = Math.min(100, P.gauge + 6 * s.gaugeRate);
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
    eye: { n: '사냥꾼의 눈', d: '치명타 확률이 10% 증가합니다.', c: '#ffd34d' },
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
    oldmap: { n: '낡은 지도', d: '잊힌 틈새의 위치가 지도에 표시됩니다.', c: '#e8d8a8' },
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
    wick: { n: '성난 심지', d: '이번 토벌에서 모은 분노의 빛이 10개 · 25개 · 45개에 이를 때마다 치명타 피해가 10% 증가합니다.', c: '#ff5a4a' },
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
  const RELIC_SLOTS = 5; // v2.19 유물은 글 없이 칸으로 · v3.83 4칸 → 5칸, 가득 차면 더 줍지 못함 (버리기로 자리를 비움)
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
        const cd = (G && G.stats) ? Math.max(0.5, skCdBase() * (1 - G.stats.cdr)).toFixed(1) : C.skillCd;
        const eq = G && typeof eqWeapon === 'function' ? eqWeapon(cls) : null;
        const extra = (ws && m.KD) ? m.KD : (ws && m.K && eq && eq.desc) ? eq.desc : C.skillD;
        return [`${nm} <span class="key">우클릭</span> <span style="color:var(--quiet)">쿨타임 ${cd}초</span>`, extra, '#9fd2ff'];
      }
      if (id === 'skL') {
        const nm = m.L || C.awaken;
        const d = (ws === 'hourglass' && EQUIP_FX.hourglass) ? EQUIP_FX.hourglass.d : C.awakenD;
        if (G && G.cls === 'priest') return [`${nm} <span style="color:var(--quiet)">패시브</span>`, d, '#ffd34d']; // v3.23 기적: 쓰는 기술이 아님
        return [`${nm} <span class="key">E</span> <span style="color:var(--quiet)">각성 게이지 100%</span>`, d, '#ffd34d'];
      }
      if (typeof isRoll === 'function' && isRoll()) return ['구르기 <span class="key">SPACE</span>', '짧은 거리를 굴러서 회피 · 공격 직전 사용 시 퍼펙트 회피', '#9ee88a']; // v3.20 기사 · 거너 · 사제
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
;

// ==================================================================== 09_skills.js
'use strict';
// 잿빛 왕관 원정대 — 09_skills.js : 무기 기술(기사·마법사), 무기 보관 패시브, 빛의 각인, 색 되찾기
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ v2.03 기사 무기 기술
  // ================================================================ v2.22 무기 보관 패시브 — 장착하지 않고 무기 칸에 들고 있으면 붙는 약한 효과 (문서: 무기_보관패시브_초안)
  // f: 계열(같은 계열은 가장 높은 하나만) · v: 수치 · p: 발동 확률 · d: 지속(초)
  const PAS_T = {
    knight: { 0: { f: 'atkP', v: 2 }, 11: { f: 'atkP', v: 3 }, 12: { f: 'critDmg', v: 4 }, 13: { f: 'spd', v: 2 }, 1: { f: 'stun', p: 0.05, d: 0.3 }, 2: { f: 'slow', p: 0.06, d: 0.8 }, 3: { f: 'reach3', v: 0.1 }, 4: { f: 'grogi', v: 0.08 }, 5: { f: 'spinKb', v: 0.15 }, 6: { f: 'bleed', p: 0.05 }, 7: { f: 'wallWave', v: 1 }, 8: { f: 'crumb', p: 0.01 }, 9: { f: 'kcd', v: 0.08 }, 10: { f: 'exec', v: 0.08 } },
    ranger: { 0: { f: 'crit', v: 1 }, 11: { f: 'atkP', v: 3 }, 12: { f: 'crit', v: 1 }, 13: { f: 'spd', v: 2 }, 1: { f: 'bleed3', p: 0.06 }, 2: { f: 'bone', p: 0.08 }, 3: { f: 'reach3', v: 0.1 }, 4: { f: 'deflectAtk', p: 0.05 }, 5: { f: 'bind', p: 0.05, d: 0.5 }, 6: { f: 'kcd', v: 0.06 }, 7: { f: 'slow', p: 0.05, d: 0.6 }, 8: { f: 'focus4', v: 0.1 }, 9: { f: 'pdInvis', v: 0.5 }, 10: { f: 'cat', p: 0.03 } },
    mage: { 0: { f: 'cdr', v: 2 }, 11: { f: 'atkP', v: 3 }, 12: { f: 'cdr', v: 2 }, 13: { f: 'critDmg', v: 4 }, 1: { f: 'burnPool', p: 0.05 }, 2: { f: 'fish', p: 0.01 }, 3: { f: 'bounce', p: 0.08 }, 4: { f: 'blink', v: 0.08 }, 5: { f: 'wisp', p: 0.03 }, 6: { f: 'zap', p: 0.04 }, 7: { f: 'soup', v: 1 }, 8: { f: 'mirror', p: 0.08 }, 9: { f: 'meteor', v: 0.1 }, 10: { f: 'gauge', v: 8 } },
    priest: { 0: { f: 'gauge', v: 3 }, 11: { f: 'atkP', v: 3 }, 12: { f: 'crit', v: 1 }, 13: { f: 'cdr', v: 2 }, 1: { f: 'parry', v: 0.04 }, 2: { f: 'deflect', p: 0.05 }, 3: { f: 'undead', v: 0.08 }, 4: { f: 'carrot', p: 0.01 }, 5: { f: 'wave3', v: 0.15 }, 6: { f: 'reliq', v: 1 }, 7: { f: 'lowAtk', v: 0.1 }, 8: { f: 'mochi', p: 0.04, d: 0.6 }, 9: { f: 'healShield', v: 0.5 }, 10: { f: 'miracle', v: 0.5 } },
    gunner: { 0: { f: 'reload', v: 0.03 }, 11: { f: 'atkP', v: 3 }, 12: { f: 'critDmg', v: 4 }, 13: { f: 'spd', v: 2 }, 1: { f: 'close', v: 0.06 }, 2: { f: 'stagger', p: 0.04, d: 0.3 }, 3: { f: 'gbounce', p: 0.06 }, 4: { f: 'still', v: 0.05 }, 5: { f: 'ammo', v: 1 }, 6: { f: 'boom', p: 0.04 }, 7: { f: 'spikes', p: 0.04 }, 8: { f: 'burn', p: 0.05 }, 9: { f: 'grogiDmg', v: 0.1 }, 10: { f: 'lastShot', v: 0.15 } },
  };
  // 보관 중인 무기의 패시브 (계열마다 가장 높은 하나)
  function pasCalc(cls) {
    const out = {}; if (!G || cls !== G.cls) return out; const T = PAS_T[cls] || {};
    for (const it of wOwned(cls)) { if (it.wk == null || it.grade === 'rby' || isEq(cls, it)) continue; const p = T[it.wk]; if (!p) continue;
      const o = out[p.f]; if (!o || (p.v || 0) > (o.v || 0) || (p.p || 0) > (o.p || 0)) out[p.f] = p; }
    return out;
  }
  const pasO = f => (G && G.stats && G.stats.pas && G.stats.pas[f]) || null;
  const pasV = f => { const o = pasO(f); return o ? o.v || 0 : 0; };
  const pasRoll = f => { const o = pasO(f); return !!o && Math.random() < (o.p || 0); };
  const pasOnce = k => { const D = G.pasOnce = G.pasOnce || {}, key = k + G.stage; if (D[key]) return false; D[key] = 1; return true; }; // 챕터당 1회
  const pasCap = (k, n) => { const D = G.pasCnt = G.pasCnt || {}, key = k + G.stage; if ((D[key] || 0) >= n) return false; D[key] = (D[key] || 0) + 1; return true; };
  function pasDmgMul(e, o) { // 피해 배율 (조건부)
    const P = G.player; let m = 1;
    if (pasO('exec') && e.hp < e.maxHp * 0.3) m *= 1 + pasV('exec');
    if (pasO('lowAtk') && P.hp <= 2) m *= 1 + pasV('lowAtk');
    if (pasO('undead') && (G.stage === 2 || G.stage === 4)) m *= 1 + pasV('undead');
    if (pasO('close') && dist(P, e) < 60) m *= 1 + pasV('close');
    if (pasO('still') && (P.stillT || 0) > 0.3) m *= 1 + pasV('still');
    if (pasO('grogiDmg') && e.grogiT > 0) m *= 1 + pasV('grogiDmg');
    { const u = uncK(); if (u && !o.dot) { // v2.30 언커먼
      if (u === 'ranger13' && o.basic && P.stiletT > time) { m *= 1.2; P.stiletT = 0; }
      else if (u === 'mage13' && dist(P, e) > 150) m *= 1.1;
      else if (u === 'priest11' && o.basic && P.combo === 2) m *= 1.1;
      else if (u === 'gunner11' && (isElite(e) || e.type === 'boss')) m *= 1.08; } }
    if (pasO('focus4') && !o.dot) { if (e.pasFoc) { m *= 1 + pasV('focus4'); e.pasFoc = false; e.pasN = 0; } else if ((e.pasN = (e.pasN || 0) + 1) >= 4) e.pasFoc = true; }
    return m;
  }
  function pasOnHit(e, o, crit) { // 일반 타격 (연계 피해 제외)
    if (e.dead) return; const P = G.player, c2 = P.state === 'attack' && P.combo === 2;
    if (pasRoll('stun')) applySt(e, 'stun', pasO('stun').d);
    if (pasRoll('stagger')) applySt(e, 'stun', pasO('stagger').d);
    if (pasRoll('slow')) applySt(e, 'slow', pasO('slow').d, 0.6);
    if (pasRoll('mochi')) applySt(e, 'slow', pasO('mochi').d, 0.6);
    if (pasRoll('bleed') || (c2 && pasRoll('bleed3'))) { if (!(e.bleedT > 0)) gxSpurt(e, 6, o.ang == null ? 0 : o.ang); e.bleedT = Math.max(e.bleedT || 0, 1.5); if (!(e.bleedTick > 0)) e.bleedTick = 0.5; }
    if (crit && pasRoll('bind')) applySt(e, 'bind', pasO('bind').d);
    if (pasRoll('zap')) { const T = nearFoes(e.x, e.y, 110, e).sort((a, b) => dist(a, e) - dist(b, e))[0]; if (T) { damageEnemy(T, 0.4, { proc: true, ang: angTo(e, T), gauge: 1 }); G.fx.push({ kind: 'ring', x: T.x, y: T.y - 10, r: 4, grow: 90, t: 0.18, max: 0.18, c: '#bfe2ff' }); sfx('bolt', 1.3); } }
    if (pasRoll('burn')) addBurn(e, 2, 0.2);
    { const u = uncK(); // v2.30 언커먼
      if (u === 'ranger12' && crit && Math.random() < 0.15) { if (!(e.bleedT > 0)) gxSpurt(e, 5, o.ang == null ? 0 : o.ang); e.bleedT = Math.max(e.bleedT || 0, 1.2); if (!(e.bleedTick > 0)) e.bleedTick = 0.5; }
      if (u === 'priest12' && Math.random() < 0.08) applySt(e, 'stun', 0.4); }
  }
  function pasOnKill(e) {
    if (isDummy(e)) return;
    { const u = uncK(), P = G.player; if (u === 'knight12') { G.gold += 1; G.nums.push({ x: e.x, y: e.y - 20, v: '+1G', t: 0.6, c: '#ffd34d', s: 1 }); } if (u === 'ranger11' && Math.random() < 0.1 && !ultBusy(P)) P.gauge = Math.min(100, (P.gauge || 0) + 5); } // v2.30 언커먼
    if (pasRoll('crumb')) dropFood('crumb', e.x, e.y, false);
    if (pasRoll('carrot')) dropFood('carrot', e.x, e.y, false);
    { const cat = pasRoll('bone') ? false : pasRoll('cat') ? true : null; if (cat != null) { const T = nearFoes(e.x, e.y, 180, e).sort((a, b) => dist(a, e) - dist(b, e))[0]; if (T) (G.wproj = G.wproj || []).push({ k: cat ? 'cat' : 'bone', x: e.x, y: e.y - 10, tgt: T, t: 1.2 }); } }
    if (pasRoll('wisp')) { (G.wproj = G.wproj || []).push({ k: 'wisp', x: e.x, y: e.y - 10, t: 3, cd: 0 }); sfx('grogi', 1.4); }
    if (pasRoll('boom')) gunBlast(e.x, e.y, 40, 0.8, '#ffb060');
    if (pasRoll('spikes')) (G.wproj = G.wproj || []).push({ k: 'puffx', x: e.x, y: e.y - 10, t: 0.35 });
  }
  function pasOnClear() { // 방을 비웠을 때
    if (!G || !G.player) return; const P = G.player;
    if (pasRoll('fish')) dropFood('fish', P.x + rand(-20, 20), P.y + 16, false);
    if (pasO('soup') && P.hp <= 1 && pasOnce('soup')) { healHalves(1); lootFeed('국자에 남은 수프 한 모금', '#ffd08a'); }
  }
  function pasDeflect(dt) { // 정면 투사체 되받아침 (사제 프라이팬: 언제나 · 암살자 철부채: 공격 중)
    const P = G.player; if (!P || P.dead) return;
    const f = pasO('deflect') ? 'deflect' : pasO('deflectAtk') && (P.state === 'attack' || P.state === 'skill') ? 'deflectAtk' : null; if (!f) return;
    for (const pr of G.eproj) { if (pr.friend || pr.pasChk) continue; const d = Math.hypot(pr.x - P.x, pr.y - (P.y - 8)); if (d > 30) continue; pr.pasChk = true;
      if (Math.random() < pasO(f).p) { const a = Math.atan2(pr.y - P.y, pr.x - P.x); pr.friend = true; pr.ang = a; pr.sp = Math.max(pr.sp || 200, 240); pr.t = 2; pr.home = 0; pr.hist = []; sfx('block', 0.8); G.nums.push({ x: pr.x, y: pr.y - 18, v: '팅!', t: 0.5, c: '#ffd34d', s: 1 }); } }
  }
  function weaponOnHit(e, o, crit) {
    const sk = wSkill(); if (!sk || e.dead) return; const P = G.player, c2 = P.state === 'attack' && P.combo === 2;
    // ---- 암살자
    if (sk === 'claw' && c2) { if (!(e.bleedT > 0)) gxSpurt(e, 8, o.ang == null ? 0 : o.ang); e.bleedT = 3; if (!(e.bleedTick > 0)) e.bleedTick = 0.5; for (let k = -1; k <= 1; k++) G.fx.push({ kind: 'spark', x: e.x + k * 4, y: e.y - 14 + k * 3, ang: (o.ang || 0) + 0.6, len: 14, sp: 60, t: 0.18, max: 0.18, c: '#ff8090' }); }
    if (sk === 'mackerel' && o.basic) sfx('hit', 1.8);
    if (sk === 'needle' && crit) applySt(e, 'bind', 1);
    if (sk === 'yarn' && o.basic) { applySt(e, 'slow', 1.2, 0.65); e.yarn = (e.yarn || 0) + 1; if (e.yarn >= 3) { e.yarn = 0; for (const q of nearFoes(e.x, e.y, 76)) applySt(q, 'slow', 1.6, 0.5); for (let i = 0; i < 10; i++) { const a = rand(0, TAU); G.parts.push({ x: e.x, y: e.y - 10, vx: Math.cos(a) * 90, vy: Math.sin(a) * 60, t: 0.35, c: pick(['#e85a7a', '#ff9ab0', '#ffd0dc']), g: 0 }); } } }
    if (sk === 'moons' && o.basic && P.state === 'attack') { const S = e.st = e.st || {}; if (P.combo === 0 || P.combo === 2) S.moonS = true; if (P.combo === 1 || P.combo === 2) S.moonD = true; S.moonT = 4;
      if (S.moonS && S.moonD) { S.moonS = S.moonD = false; sfx('bolt', 0.8); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 12, r: 6, grow: 200, t: 0.4, max: 0.4, c: '#e8eef8' }); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 12, r: 4, grow: 150, t: 0.35, max: 0.35, c: '#9a7ae8' }); for (const q of nearFoes(e.x, e.y, 56)) damageEnemy(q, 1.4, { proc: true, grogi: 6, ang: angTo(e, q), gauge: 1 }); } }
    if (sk === 'mochi' && c2) { applySt(e, 'slow', 2.2, 0.45); e.st = e.st || {}; e.st.mochiU = time + (e.st.slowT || 0); for (let i = 0; i < 6; i++) G.parts.push({ x: e.x + rand(-6, 6), y: e.y - rand(4, 14), vx: rand(-30, 30), vy: rand(-50, -10), t: rand(0.2, 0.4), c: pick(['#f8f0f4', '#f0a0b8']), g: 160 }); }
    if (sk === 'cleaver' && c2) { applySt(e, 'stun', 0.6); dust(e.x, e.y, 8); }
    if (sk === 'tuna' && o.basic) applySt(e, 'slow', 1.5, 0.55);
    if (sk === 'bell' && o.basic) { if (e.grogiMax) e.grogi += (o.grogi || 0) * 0.3; if (!P.bellDone) { P.bellDone = true; sfx('grogi', 0.7); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 14, r: 6, grow: 220, t: 0.4, max: 0.4, c: '#e8c070' }); for (const q of nearFoes(e.x, e.y, 60, e)) if (q.grogiMax) q.grogi += 3; } }
    if (sk === 'fang' && o.basic) { if (!(e.bleedT > 0)) gxSpurt(e, 8, (o.ang == null ? -Math.PI / 2 : o.ang) - 0.4); e.bleedT = 3; if (!(e.bleedTick > 0)) e.bleedTick = 0.5; }
    if (sk === 'bread' && o.basic) { G.breadN = (G.breadN || 0) + 1; if (G.breadN % 60 === 0) { G.breadBrk = 3; sfx('crunch', 0.8); banner('뚝!', '3초간 반 토막 쌍검'); for (let i = 0; i < 12; i++) G.parts.push({ x: P.x + rand(-8, 8), y: P.y - 14, vx: rand(-90, 90), vy: rand(-120, -40), t: 0.5, c: pick(['#e8b060', '#c8803a', '#fff0c0']), g: 300 }); } if (!isDummy(e) && Math.random() < 0.04) dropFood('crumb', e.x, e.y, true); }
  }
  const BREADH = [];
  function breadHalf(k) { // v2.18 바게트 반 토막 두 개 (손잡이 쪽 / 끝 쪽)
    if (BREADH[k]) return BREADH[k]; const T = weaponTex('knight'), m = Math.floor(T.w / 2);
    const cells = T.cells.map(r => k ? r.slice(m) : r.slice(0, m)), w = cells[0].length;
    const out = { cells, w, h: T.h, px: k ? 1 : T.px, py: T.py, pal: T.pal, rot: {} }; let reach = 0; cells.forEach((r, y) => r.forEach((c, x) => { if (c !== '.') reach = Math.max(reach, Math.hypot(x - out.px, y - out.py)); })); out.reach = Math.round(reach * 2);
    return BREADH[k] = out;
  }
  function weaponSwingEnd() { // 3타가 끝나는 순간
    const sk = wSkill(); if (!sk) return; const P = G.player, fx = P.x + Math.cos(P.atkAng) * 40, fy = P.y + Math.sin(P.atkAng) * 30;
    if (sk === 'fan') fireWave(P.atkAng);
    if (sk === 'sickle' && !(G.wproj || []).some(w => w.k === 'sickle')) { (G.wproj = G.wproj || []).push({ k: 'sickle', x: P.x, y: P.y - 8, ang: P.atkAng, out: true, d: 0, hit: new Set() }); sfx('whoosh', 1.3); }
    if (sk === 'tuna') { sfx('crunch', 1.5); for (const e of nearFoes(P.x, P.y, 84)) { damageEnemy(e, 0.5, { proc: true, ang: angTo(P, e), gauge: 1 }); applySt(e, 'slow', 2, 0.5); }
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; G.parts.push({ x: P.x + Math.cos(a) * 10, y: P.y - 8 + Math.sin(a) * 6, vx: Math.cos(a) * rand(140, 220), vy: Math.sin(a) * rand(90, 150), t: rand(0.25, 0.4), c: pick(['#cfefff', '#7ac0e8', '#ffffff']), g: 0 }); } }
    if (sk === 'exec') { (G.pfire = G.pfire || []).push({ x: fx, y: fy, t: 3.5, tick: 0 }); gxIgnite(fx, fy); }
    if (sk === 'cleaver') { hitCrack(fx, fy + 8, 1, 30); dust(fx, fy, 14); sfx('blast', 0.6); G.fx.push({ kind: 'ring', x: fx, y: fy, r: 4, grow: 160, t: 0.25, max: 0.25, c: '#d8d0c0' }); } // v2.18 내려찍은 자리 금
  }
  function weaponChargeEnd() { // 돌진이 끝나는 순간
    const sk = wSkill(), P = G.player;
    if (sk === 'gate') { sfx('blast', 0.8); dust(P.x, P.y, 20); G.fx.push({ kind: 'ring', x: P.x, y: P.y - 4, r: 8, grow: 260, t: 0.4, max: 0.4, c: '#c8a070' }); for (const e of nearFoes(P.x, P.y, 76)) damageEnemy(e, 1.0, { proc: true, grogi: 10, kb: 260, ang: angTo(P, e), heavy: true, gauge: 2 }); }
    if (sk === 'sun' && P.sunPath && P.sunPath.length) { G.sunB = G.sunB || []; P.sunPath.forEach((q, i) => { if (i % 3 === 0) G.sunB.push({ x: q.x, y: q.y, d: 0.3 + i * 0.03 }); }); P.sunPath = []; }
  }
  function weaponOnKill(e) {
    if (hasRelic('emberheart') && !isDummy(e) && (e.type === 'boss' || isElite(e) || isSemi(e))) { healHalves(1); gxIgnite(e.x, e.y); for (const q of nearFoes(e.x, e.y, 60, e)) damageEnemy(q, 0.6, { proc: true, ang: angTo(e, q), gauge: 1 }); } // v2.07 유물 잿불 심장
    const sk0 = wSkill();
    if (sk0 === 'match' && e.burnT > 0) for (const q of nearFoes(e.x, e.y, 64, e)) { addBurn(q, 3, 0.35); sparks(q.x, q.y - 10, angTo(e, q), '#ff8a2a', 3); } // v2.14 화승총 불 번짐
    if (sk0 === 'undertaker' && !isDummy(e) && (e.type === 'boss' || isElite(e) || isSemi(e))) { (G.wproj = G.wproj || []).push({ k: 'coffin', x: e.x, y: e.y, ang: P0().ang, t: 1.6, hit: new Set([e]) }); sfx('crunch', 0.5); } // 큰 적은 관이 되어 굴러감
    if (sk0 === 'spear' && P0().miracleT > 0 && !isDummy(e)) { P0().miracleT = Math.min(P0().miracleT + 0.5, 5); G.nums.push({ x: P0().x, y: P0().y - 30, v: '+0.5초', t: 0.5, c: '#fff0b0', s: 1 }); } // v2.15 기적 연장
    if (sk0 === 'carrot' && !isDummy(e) && Math.random() < 0.04) dropFood('carrot', e.x, e.y, true);
    if (sk0 === 'mochi' && e.st && time < (e.st.mochiU || 0)) { sfx('crunch', 1.6); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 8, r: 6, grow: 180, t: 0.3, max: 0.3, c: '#f8f0f4' }); for (let i = 0; i < 10; i++) { const a = rand(0, TAU); G.parts.push({ x: e.x, y: e.y - 10, vx: Math.cos(a) * 120, vy: Math.sin(a) * 80 - 30, t: 0.35, c: pick(['#f8f0f4', '#f0a0b8']), g: 200 }); } for (const q of nearFoes(e.x, e.y, 64, e)) { applySt(q, 'slow', 2, 0.45); q.st = q.st || {}; q.st.mochiU = time + (q.st.slowT || 0); } } // v2.15 떡 터짐
    if (sk0 === 'skull' && !isDummy(e) && Math.random() < 0.2) { (G.wproj = G.wproj || []).push({ k: 'wisp', x: e.x, y: e.y - 10, t: 5, cd: 0 }); sfx('grogi', 1.4); } // v2.08 해골 망령 (5초 아군)
    if ((sk0 === 'mackerel' || sk0 === 'nine') && !isDummy(e)) { const T = nearFoes(e.x, e.y, sk0 === 'nine' ? 200 : 170, e).sort((a, b) => dist(a, e) - dist(b, e))[0]; if (T) (G.wproj = G.wproj || []).push({ k: sk0 === 'nine' ? 'cat' : 'bone', x: e.x, y: e.y - 10, tgt: T, t: 1.2 }); }
    if (wSkill() === 'fang' && e.bleedT > 0) { sfx('crunch', 0.8); for (let i = 0; i < 12; i++) { const a = rand(0, TAU); G.parts.push({ x: e.x, y: e.y - 10, vx: Math.cos(a) * rand(80, 170), vy: Math.sin(a) * rand(60, 120) - 40, t: rand(0.3, 0.5), c: pick(['#ece2c8', '#bfb294', '#ffffff']), g: 260 }); }
      for (const q of nearFoes(e.x, e.y, 64, e)) damageEnemy(q, 0.6, { proc: true, ang: angTo(e, q), gauge: 1 }); }
  }
  // ================================================================ v2.08 마법사 무기 기술
  const zoneSlow = (e, k) => { if (e.dead || e.type === 'boss' && k < 0.7) k = 0.7; e.st = e.st || {}; e.st.slowT = Math.max(e.st.slowT || 0, 0.3); e.st.slowK = Math.min(e.st.slowK || 1, k); }; // 장판 둔화 (저항 누적 없이 머무는 동안만)
  function mageBoltEnd(pr, e) {
    const sk = wSkill(); if (sk !== 'candle' && pasRoll('burnPool')) (G.pfire = G.pfire || []).push({ x: pr.x, y: pr.y + 8, t: 1.2, tick: 0 }); // v2.22 보관 패시브
    if (!sk) return; const P = G.player;
    if (sk === 'candle') (G.pfire = G.pfire || []).push({ x: pr.x, y: pr.y + 8, t: 1.6, tick: 0 }); // 촛농: 작은 화상 장판
    if (!e || e.dead) return;
    if (sk === 'rod') { const big = e.type === 'boss' || isElite(e) || isSemi(e) || isDummy(e);
      if (!big) { const a = angTo(e, P), d = Math.min(70, dist(e, P) * 0.45); e.x += Math.cos(a) * d; e.y += Math.sin(a) * d * 0.8; solveObs(e, e.r); applySt(e, 'stun', 0.3); }
      if (!isDummy(e) && Math.random() < 0.04) dropFood('fish', e.x, e.y, true); }
    if (sk === 'lrod') { P.lrodN = (P.lrodN || 0) + 1; if (P.lrodN % 3 === 0) { chainBolt(e); damageEnemy(e, 0.6, { proc: true, grogi: 4, ang: -Math.PI / 2, gauge: 1 }); G.fx.push({ kind: 'skybeam', x: e.x, y: e.y, w: 10, c: '160,210,255', t: 0.25, max: 0.25 }); sfx('boltBig', 1.3); } }
  }
  function skMax(k) { // v2.09: 장비로 늘어나는 기술 사용 횟수 (K: 특수기술, D: 점멸)
    const st = G.stats || { fx: new Set() };
    if (k === 'K') return 1; // v3.21 별의 서약 대검의 돌진 2회 충전은 우클릭 「별의 서약」으로 바뀜
    return 2;
  }
  function castSoup() { // 국자: 화염구 대신 끓는 수프 웅덩이 (적 화상·둔화, 내가 밟으면 조금 회복)
    const P = G.player; let tx = P.x + Math.cos(P.ang) * 120, ty = P.y + Math.sin(P.ang) * 90;
    if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; const d = Math.hypot(tx - P.x, ty - P.y); if (d > 160) { tx = P.x + (tx - P.x) / d * 160; ty = P.y + (ty - P.y) / d * 160; } }
    tx = clamp(tx, A.x0 + 20, A.x1 - 20); ty = clamp(ty, A.y0 + 20, A.y1 - 20);
    (G.soup = G.soup || []).push({ x: tx, y: ty, t: 4.5, tick: 0 });
    for (let i = 0; i < 16; i++) { const a = rand(0, TAU), sp = rand(40, 120); G.parts.push({ x: tx, y: ty - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 40, t: rand(0.3, 0.5), c: pick(['#e8903a', '#c05a1a', '#7ab040']), g: 200 }); }
    P.state = 'rattack'; P.t = 0.08; P.fired = true; P.blade = P.ang; sfx('crunch', 0.7);
  }
  function timeStop() { // 모래시계 지팡이: 3초 시간 정지 (보스는 둔화), 풀릴 때 모은 피해가 터짐
    const P = G.player; P.gauge = 0; G.tstopT = 3; sfx('awaken'); flashT = 0.15; flashColor = '#d8f0ff';
    banner('시간 정지', '모래가 거꾸로 흐른다');
    for (const e of G.enemies) { if (e.dead || isDummy(e) && false) continue; e.st = e.st || {}; if (e.type === 'boss') { e.st.slowT = Math.max(e.st.slowT || 0, 3); e.st.slowK = Math.min(e.st.slowK || 1, 0.35); } else { e.st.stunT = Math.max(e.st.stunT || 0, 3); e.st.tsT = 3; e.st.bank = 0; } }
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 10, grow: 600, t: 0.6, max: 0.6, c: '#d8f0ff' });
  }
  function kusariHook() { // v2.05 그림자 사슬낫: 작은 적은 끌어오고, 큰 적에게는 내가 끌려간다
    const P = G.player; let best = null, bd = 1e9;
    for (const e of G.enemies) { if (e.dead || e.type === 'flag') continue; const d = dist(P, e); if (d < 230 && Math.abs(angDiff(angTo(P, e), P.ang)) < 0.8 && d < bd) { bd = d; best = e; } }
    P.iframe = Math.max(P.iframe, 0.3); sfx('bolt', 0.6);
    const tx = best ? best.x : P.x + Math.cos(P.ang) * 160, ty = best ? best.y : P.y + Math.sin(P.ang) * 160;
    G.fx.push({ kind: 'streak', x0: P.x, y0: P.y - 10, x1: tx, y1: ty - 10, t: 0.25, max: 0.25, c: '110,90,170' });
    if (!best) return;
    const big = best.type === 'boss' || isElite(best) || isSemi(best) || isDummy(best);
    if (big) { const a = angTo(best, P); P.x = best.x + Math.cos(a) * (best.r + 16); P.y = best.y + Math.sin(a) * (best.r + 16) * 0.8; solveObs(P, P.r); smoke(P.x, P.y, 12); P.face = Math.cos(angTo(P, best)) > 0 ? 1 : -1; damageEnemy(best, 1.4, { grogi: 10, ang: angTo(P, best), heavy: true, gauge: 5 }); applySt(best, 'stun', 0.4); }
    else { const a = angTo(P, best); best.x = P.x + Math.cos(a) * (P.r + best.r + 10); best.y = P.y + Math.sin(a) * (P.r + best.r + 10) * 0.8; solveObs(best, best.r); best.vx = best.vy = 0; smoke(best.x, best.y, 8); damageEnemy(best, 1.2, { grogi: 8, ang: a, heavy: true, gauge: 5 }); applySt(best, 'stun', 0.8); }
  }
  const P0 = () => G.player;
  const FOOD_MSG = { crumb: '빵조각이 떨어졌습니다', fish: '물고기가 낚였습니다', carrot: '당근이 굴러 나왔습니다' };
  function dropFood(k, x, y, eq) { // v2.51 음식 드랍 한도 통일: 장착 효과 챕터당 3개 + 소지 효과 챕터당 1개 (따로 셈)
    const D = G.foodDrop = G.foodDrop || {}, key = k + (eq ? 'E' : 'P') + G.stage; if ((D[key] || 0) >= (eq ? 3 : 1)) return false;
    D[key] = (D[key] || 0) + 1; spawnLoot(k, x, y); lootFeed(FOOD_MSG[k], LOOT[k].c); sfx('coin', 1.3); return true; }
  function dropCapped(k, e, msg) { const D = G.pDrop = G.pDrop || {}, key = k + G.stage; if ((D[key] || 0) >= 3) return; D[key] = (D[key] || 0) + 1; spawnLoot(k, e.x, e.y); lootFeed(msg, LOOT[k].c); }
  function censerIn() { if (wSkill() !== 'censer' || !G.smoke) return false; const P = G.player; return G.smoke.some(c => ((P.x - c.x) / 40) ** 2 + ((P.y - c.y) / 18) ** 2 < 1); }
  function priestSwing(i) { // 평타를 시작할 때 (사제 무기)
    const sk = wSkill(), P = G.player; if (G.cls !== 'priest') return;
    if (sk === 'censer') { G.smoke = (G.smoke || []).filter(c => c.t > 0.5); if (G.smoke.length >= 3) G.smoke.shift(); G.smoke.push({ x: P.x + Math.cos(P.ang) * 10, y: P.y + Math.sin(P.ang) * 6, t: i === 2 ? 4 : 2.5 }); }
    if (sk === 'water') { // 부채꼴 성수
      const f0 = Math.cos(P.ang) >= 0 ? 1 : -1; for (let k = 0; k < 10; k++) { const a = P.ang + rand(-0.5, 0.5), sp = rand(150, 230); G.parts.push({ x: P.x + f0 * 40, y: P.y - 22, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7, t: rand(0.25, 0.4), c: pick(['#9fe8ff', '#ffffff', '#5ab8e8']), g: 260 }); }
      for (const e of nearFoes(P.x, P.y, 84)) { if (Math.abs(angDiff(angTo(P, e), P.ang)) < 0.55) damageEnemy(e, 0.25, { proc: true, ang: angTo(P, e), gauge: 0.5 }); }
    }
  }
  function priestTick(dt) {
    const P = G.player, sk = wSkill();
    if (G.breadBrk > 0) { G.breadBrk -= dt; if (G.breadBrk <= 0) lootFeed('바게트 복구 (?)', '#e8b060'); }
    if (sk === 'chain' && P.state === 'attack' && P.combo === 2 && !P.crackDone && P.t > SWING_CH[2].wind + SWING_CH[2].swing * 0.9 && P.chainL) { P.crackDone = true; const T = P.chainL[P.chainL.length - 1]; sparks(T.x, T.y, P.atkAng, '#eef2f6', 6); sfx('block', 1.4); }
    if (G.harp) updateHarp(dt); // v2.19 작살: 뻗었다가 감겨 돌아옴
    if (G.cls === 'gunner') { const mv = P.moving || P.state === 'dodge'; P.stillT = mv ? 0 : (P.stillT || 0) + dt; if (sk === 'longrifle' && P.stillT > 0.5 && Math.random() < dt * (P.stillT > 1.5 ? 10 : 4)) { const m = muzzle(); G.parts.push({ x: m.x + rand(-3, 3), y: m.y + rand(-3, 3), vx: 0, vy: -20, t: 0.25, c: P.stillT > 1.5 ? '#ff6a2a' : '#ffd080', g: 0, glow: true }); } }
    if (G.smoke && G.smoke.length) { for (const c of G.smoke) { c.t -= dt; c.y -= dt * 2; } G.smoke = G.smoke.filter(c => c.t > 0); }
    pasDeflect(dt); // v2.22 보관 패시브
    if (G.cls !== 'priest' || P.dead) return;
    if (sk === 'pan' && P.state === 'attack' && P.combo === 2 && P.t < 0.45) for (const pr of G.eproj) { // 3타 「팡!」 되받아치기
      if (pr.friend) continue; const d = Math.hypot(pr.x - P.x, pr.y - P.y), a = Math.atan2(pr.y - P.y, pr.x - P.x);
      if (d < 54 && Math.abs(angDiff(a, P.atkAng)) < 1.1) { pr.friend = true; pr.ang = a; pr.sp = Math.max(pr.sp, 260) * 1.2; pr.t = 2; pr.home = 0; pr.hist = []; sfx('block', 0.7); G.nums.push({ x: pr.x, y: pr.y - 22, v: '팡!', t: 0.5, c: '#ffd34d', s: 1 }); G.fx.push({ kind: 'ring', x: pr.x, y: pr.y - 10, r: 4, grow: 140, t: 0.25, max: 0.25, c: '#ffd34d' }); }
    }
    if (sk === 'whip') { // v3.22 고해의 채찍: 우클릭은 「참회의 난타」(45_prs.js) — 예전 짧게/길게 누르기 효과는 없앰
      if (P.state === 'attack' && !P.crackDone && P.lashTip) { const st = SWING_PW[P.combo]; if (P.t > st.wind + st.swing * 0.9) { P.crackDone = true; sparks(P.lashTip.x, P.lashTip.y, P.atkAng, '#fff0d0', 5); G.fx.push({ kind: 'ring', x: P.lashTip.x, y: P.lashTip.y, r: 2, grow: 80, t: 0.15, max: 0.15, c: '#fff0d0' }); sfx('block', 1.6); } }
    }
    if (P.penT > 0) P.penT -= dt;
    if (sk === 'spear' && P.miracleT > 0) { P.spearCd = (P.spearCd || 0) - dt; if (P.spearCd <= 0) { P.spearCd = 0.22; // 성창 비
      const T = nearFoes(P.x, P.y, 230); const e = T.length ? T[Math.floor(Math.random() * T.length)] : null; const x = e ? e.x : P.x + rand(-140, 140), y = e ? e.y : P.y + rand(-80, 80);
      G.fx.push({ kind: 'skybeam', x, y, w: 8, c: '255,240,190', t: 0.3, max: 0.3 }); G.fx.push({ kind: 'ring', x, y, r: 4, grow: 120, t: 0.25, max: 0.25, c: '#fffbe6' }); sfx('bolt', 1.5);
      if (e) damageEnemy(e, 0.7, { proc: true, ang: -Math.PI / 2, grogi: 4, gauge: 0 }); } }
  }
  function weaponTick(dt) {
    const P = G.player;
    priestTick(dt);
    { const wt = weaponTex(G.cls); warmRot(wt && SAVE.skin === 'ash' && skinOpen() ? ashBlade(wt) : wt); } // v2.19 처음 휘두를 때 끊기지 않게 회전 그림 미리 만들기
    if (P && P.stealthT > 0) P.stealthT -= dt;
    if (P && P.counterT > 0) P.counterT -= dt;
    if (P && P.surgeT > 0) { P.surgeT -= dt; if (Math.random() < dt * 14) { const a = rand(0, TAU); G.parts.push({ x: P.x + Math.cos(a) * 10, y: P.y - 4 - rand(0, 18), vx: -Math.sin(a) * 30, vy: -rand(10, 30), t: 0.35, c: pick(['#9fd2ff', '#c890ff', '#e4f2ff']), g: 0, glow: true }); } } // v2.24 마나 격류 표시
    // 시간 정지 해제 → 모은 피해
    if (G.tstopT > 0) { G.tstopT -= dt; if (G.tstopT <= 0) { sfx('blast', 1.2); flashT = 0.12; flashColor = '#fff0d0'; for (const e of G.enemies) if (!e.dead && e.st && e.st.bank > 0) { const b = e.st.bank; e.st.bank = 0; e.st.tsT = 0; damageEnemy(e, b / Math.max(1, G.stats.atk), { proc: true, bank: true, heavy: true, grogi: 10, ang: angTo(P, e), gauge: 0 }); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 12, r: 6, grow: 180, t: 0.35, max: 0.35, c: '#ffd080' }); } } }
    // 먼지 구름(빗자루) · 수프 웅덩이(국자) · 작은 운석(잿빛 별)
    if (G.dustC && G.dustC.length) { for (const c of G.dustC) { c.t -= dt; for (const e of nearFoes(c.x, c.y, 24)) zoneSlow(e, 0.5); } G.dustC = G.dustC.filter(c => c.t > 0); }
    if (G.soup && G.soup.length) { for (const q of G.soup) { q.t -= dt; q.tick -= dt; const tick = q.tick <= 0; if (tick) q.tick = 0.5;
        for (const e of nearFoes(q.x, q.y, 36)) { if (tick) addBurn(e, 1.1, 0.3); e.st = e.st || {}; e.st.hsT = 0.3; e.st.hsK = e.type === 'boss' ? 0.8 : 0.6; } // v2.10 화상 · v2.11 아이콘 없이 살짝 느려짐
        if (P && !P.dead && Math.hypot(P.x - q.x, (P.y - q.y) * 1.3) < 34) healPct(0.012 * dt); }
      G.soup = G.soup.filter(q => q.t > 0); }
    if (G.mmet && G.mmet.length) for (let i = G.mmet.length - 1; i >= 0; i--) { const m = G.mmet[i]; m.d -= dt; if (m.d > 0) continue; G.mmet.splice(i, 1); fireBlast(m.x, m.y, 40, 1.2, 2); }
    // 철부채: 공격하는 동안 정면 투사체를 쳐낸다
    if (P && P.state === 'attack' && wSkill() === 'fan') for (const pr of G.eproj) { if (pr.t <= 0) continue; const d = Math.hypot(pr.x - P.x, pr.y - P.y); if (d < 46 && Math.abs(angDiff(Math.atan2(pr.y - P.y, pr.x - P.x), P.atkAng)) < 1.1) { pr.t = 0; sparks(pr.x, pr.y - 10, angTo(P, pr), '#ffd0a0', 6); sfx('block', 1.4); } }
    // 무기 투사체: 부메랑 낫 · 생선 뼈 · 고양이 유령 (장애물에 막힘)
    if (G.wproj && G.wproj.length) for (let i = G.wproj.length - 1; i >= 0; i--) { const w = G.wproj[i];
      if (/^(krs|ars|grs)/.test(w.k)) continue; // v3.21 41_krs.js에서 움직임
      if (w.k === 'sickle') { const sp = 380 * dt, ox = w.x, oy = w.y; let ang = w.ang;
        if (!w.out) ang = Math.atan2(P.y - 8 - w.y, P.x - w.x); w.x += Math.cos(ang) * sp; w.y += Math.sin(ang) * sp * 0.8; w.d += sp; w.spin = (w.spin || 0) + dt * 22;
        if (w.out && (w.d > 150 || segSolid(ox, oy, w.x, w.y))) { w.out = false; w.hit = new Set(); if (segSolid(ox, oy, w.x, w.y)) { w.x = ox; w.y = oy; sparks(w.x, w.y, 0, '#e8e8f0', 4); } }
        for (const e of G.enemies) if (!e.dead && !w.hit.has(e) && Math.hypot(e.x - w.x, e.y - 8 - w.y) < e.r + 10) { w.hit.add(e); damageEnemy(e, 0.9, { proc: true, ang: ang, gauge: 2 }); }
        if (!w.out && Math.hypot(P.x - w.x, P.y - 8 - w.y) < 14) G.wproj.splice(i, 1); else if (w.d > 600) G.wproj.splice(i, 1);
        continue; }
      if (w.k === 'ball' || w.k === 'duckb') { const sp = (w.k === 'ball' ? 340 : 260) * dt, nx = w.x + Math.cos(w.ang) * sp, ny = w.y + Math.sin(w.ang) * sp; w.t -= dt; w.spin = (w.spin || 0) + dt * 10;
        const hitE = G.enemies.find(e => !e.dead && Math.hypot(e.x - nx, e.y - 10 - ny) < e.r + 6), wallHit = segSolid(w.x, w.y + 10, nx, ny + 10) || nx < A.x0 || nx > A.x1 || ny < A.y0 - 30 || ny > A.y1;
        if (hitE || wallHit || w.t <= 0) { if (w.k === 'duckb') G.nums.push({ x: w.x, y: w.y - 16, v: '꽥!', t: 0.6, c: '#ffe070', s: 1.2 }); gunBlast(w.x, w.y + 10, w.k === 'ball' ? 46 : 56, w.k === 'ball' ? 2.4 : 2.0, w.k === 'ball' ? '#e08a3a' : '#ffe070'); G.wproj.splice(i, 1); continue; }
        w.x = nx; w.y = ny; continue; }
      if (w.k === 'coffin') { const sp = 210 * dt, nx = w.x + Math.cos(w.ang) * sp, ny = w.y + Math.sin(w.ang) * sp; w.t -= dt;
        if (w.t <= 0 || segSolid(w.x, w.y, nx, ny, 6) || nx < A.x0 || nx > A.x1 || ny < A.y0 || ny > A.y1) { dust(w.x, w.y, 10); sfx('crunch', 0.6); G.wproj.splice(i, 1); continue; }
        w.x = nx; w.y = ny; w.roll = (w.roll || 0) + dt * 6; for (const e of G.enemies) if (!e.dead && !w.hit.has(e) && Math.hypot(e.x - w.x, e.y - w.y) < e.r + 10) { w.hit.add(e); damageEnemy(e, 1.5, { proc: true, ang: w.ang, kb: 240, grogi: 8, gauge: 1, heavy: true }); } continue; }
      if (w.k === 'carrotm') { const sp = 260 * dt, nx = w.x + Math.cos(w.ang) * sp, ny = w.y + Math.sin(w.ang) * sp * 0.75; w.t -= dt; w.spin = (w.spin || 0) + dt * 14;
        const hitE = G.enemies.find(e => !e.dead && !w.hit.has(e) && Math.hypot(e.x - nx, e.y - 10 - ny) < e.r + 6);
        if (hitE) { w.hit.add(hitE); damageEnemy(hitE, 0.6, { proc: true, ang: w.ang, kb: 100, gauge: 1 }); applySt(hitE, 'stun', 0.4); sparks(nx, ny, w.ang, '#f08a2a', 5); sfx('crunch', 1.8); G.wproj.splice(i, 1); continue; }
        if (w.t <= 0 || segSolid(w.x, w.y + 10, nx, ny + 10)) { sparks(w.x, w.y, w.ang + Math.PI, '#f08a2a', 3); G.wproj.splice(i, 1); continue; } w.x = nx; w.y = ny; continue; }
      if (w.k === 'puffx') { w.t -= dt; if (w.t > 0) continue; G.wproj.splice(i, 1); sfx('crunch', 1.4); // 부풀어 가시 폭발
        for (let a = 0; a < 12; a++) { const an = a / 12 * TAU; G.parts.push({ x: w.x, y: w.y, vx: Math.cos(an) * 200, vy: Math.sin(an) * 140, t: 0.22, c: pick(['#ffe070', '#e8c040']), g: 0 }); }
        G.fx.push({ kind: 'ring', x: w.x, y: w.y, r: 6, grow: 200, t: 0.25, max: 0.25, c: '#ffe070' }); for (const e of nearFoes(w.x, w.y + 10, 56)) damageEnemy(e, 1.0, { proc: true, ang: Math.atan2(e.y - w.y, e.x - w.x), kb: 120, gauge: 1 }); continue; }
      if (w.k === 'wisp') { w.t -= dt; w.cd -= dt; if (w.t <= 0) { smoke(w.x, w.y, 6); G.wproj.splice(i, 1); continue; }
        const T2 = nearFoes(w.x, w.y, 220).filter(e => !isDummy(e) || true).sort((a, b) => dist(a, w) - dist(b, w))[0]; if (!T2) continue;
        const a = Math.atan2(T2.y - 10 - w.y, T2.x - w.x), d = Math.hypot(T2.x - w.x, T2.y - 10 - w.y);
        if (d > T2.r + 8) { const nx = w.x + Math.cos(a) * 150 * dt, ny = w.y + Math.sin(a) * 150 * dt; if (!segSolid(w.x, w.y, nx, ny)) { w.x = nx; w.y = ny; } }
        else if (w.cd <= 0) { w.cd = 0.6; damageEnemy(T2, 0.5, { proc: true, ang: a, gauge: 1 }); sparks(T2.x, T2.y - 10, a, '#7aff7a', 4); }
        continue; }
      const T = w.tgt; w.t -= dt; if (!T || T.dead || w.t <= 0) { G.wproj.splice(i, 1); continue; }
      const a = Math.atan2(T.y - 10 - w.y, T.x - w.x), sp = (w.k === 'cat' ? 330 : 420) * dt, nx = w.x + Math.cos(a) * sp, ny = w.y + Math.sin(a) * sp;
      if (segSolid(w.x, w.y, nx, ny)) { G.wproj.splice(i, 1); continue; } w.x = nx; w.y = ny; w.ang = a;
      if (Math.hypot(T.x - w.x, T.y - 10 - w.y) < T.r + 6) { damageEnemy(T, w.k === 'cat' ? 0.7 : 0.8, { proc: true, ang: a, gauge: 1 }); if (w.k === 'cat') sfx('swing', 1.6); G.wproj.splice(i, 1); }
    }
    if (G.sunB && G.sunB.length) for (let i = G.sunB.length - 1; i >= 0; i--) { const b = G.sunB[i]; b.d -= dt; if (b.d > 0) continue; G.sunB.splice(i, 1);
      G.fx.push({ kind: 'ring', x: b.x, y: b.y - 6, r: 6, grow: 150, t: 0.3, max: 0.3, c: '#ffd34d' }); sparks(b.x, b.y - 10, -Math.PI / 2, '#fff2b0', 6); sfx('bolt', 1.4);
      for (const e of nearFoes(b.x, b.y, 36)) damageEnemy(e, 0.8, { proc: true, grogi: 4, ang: angTo(b, e), gauge: 1 }); }
  }
  const COUNTER_T = 2.5, COUNTER_MUL = 1.15; /* v2.33 피해 +40% → +15% */ let CNT_COL = null, CNT_MK = null, CNT_OC = null;
  function perfectDodge() {
    { const P0 = G.player; if (G.stats.efx.has('nova')) { gxNova(P0.x, P0.y); for (const o of nearFoes(P0.x, P0.y, 92)) damageEnemy(o, 1.2, { proc: true, ang: angTo(P0, o), gauge: 2 }); } }
    const P = G.player;
    P.perfectUsed = true;
    P.counterT = P.counterMax = COUNTER_T + (hasRelic('mirror') ? 0.6 : 0); rec('perfect'); // v2.27 반격 시간: 2.5초 동안 모든 공격 치명타 · v2.33 피해 +15% · 직업 회피 30%
    for (const o of nearFoes(P.x, P.y, 1e5)) { applySt(o, 'stun', 0.6, 0, true); /* v2.35 방 안 모든 적 */ G.fx.push({ kind: 'ring', x: o.x, y: o.y - 10, r: 4, grow: 60, t: 0.2, max: 0.2, c: '#ffd34d' }); } // 주변 적 0.6초 경직 (보스·정예는 줄어듦)
    slowmo = 1.0; flashT = 0.12; flashColor = '#cfe6ff';
    if (!ultBusy(P)) P.gauge = Math.min(100, P.gauge + 15 * G.stats.gaugeRate);
    P.dropletNext = hasRelic('droplet'); P.cntKills = 0; P.cntExt = 0; G.runPerf = (G.runPerf || 0) + 1; if (G.runPerf >= 15) recOnce('u_drop'); rec('cstun', nearFoes(P.x, P.y, 1e5).filter(o => !isDummy(o)).length); // v2.36
    G.nums.push({ x: P.x, y: P.y - 32, v: '역습!', t: 0.9, c: '#ffd34d', s: 2 }); addShake(2, 0);
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 6, t: 0.35, max: 0.35, c: '#9fd2ff' });
    if (G.stats.fx.has('vigil')) healPct(0.02);
    if (G.stats.fx.has('fangs')) P.chargeCd = [0, 0];
    if (pasO('pdInvis')) P.stealthT = Math.max(P.stealthT || 0, pasV('pdInvis')); // v2.22
    sfx('perfect'); buzz([12, 40, 12]);
  }
  function playerDie() {
    const P = G.player;
    if (wSkill() === 'nine' && !G.nineUsed) { G.nineUsed = true; P.hp = 2; P.inv = 2; P.stealthT = 1; banner('아홉 목숨', '꼬리 하나를 내주고 다시 일어선다'); sfx('awaken'); flashT = 0.2; flashColor = '#7af0ff'; G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 8, grow: 260, t: 0.6, max: 0.6, c: '#7af0ff' }); return; } // v2.05
    if (hasRelic('deadring') && !G.ringUsed && (G.ringUsed = true) && Math.random() < 0.5) { P.hp = 2; P.inv = 2; banner('망자의 반지', '반지가 부서지며 다시 일어선다'); sfx('awaken'); flashT = 0.2; flashColor = '#c070f0'; G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 8, grow: 220, t: 0.5, max: 0.5, c: '#c070f0' }); G.relics = G.relics.filter(k => k !== 'deadring'); return; } // v2.29
    P.hp = 0; P.dead = true; P.deadT = 0; P.state = 'dead'; rec('death');
    burst(P.x, P.y - 8, '#a3161c', 24); splat(P.x, P.y, 30);
    banner('원정 실패', `${SAVE.runs}번째 밤 · 가져온 모든 것을 잃었다`); // v3.23 회차 = 밤
  }
  function afterDeath() {
    const P = G.player;
    if (G.retries > 0) {
      G.retries--;
      Object.assign(P, { hp: G.stats.hp, dead: false, state: 'idle', inv: 1, iframe: 0 });
      restartRoom();
    } else showResult(false);
  }

  const GROGI_DECAY = { wait: 1.5, rate: 0.12 }; // v2.19 마지막으로 그로기가 쌓인 뒤 1.5초 지나면 초당 최대치의 12%씩 빠진다 (가득 찬 게이지가 약 8초에 비워짐)
  function damageEnemy(e, coef, o = {}) {
    if (e.dead) return;
    if (e.harpT) return; // v2.19 작살에 끌려오는 동안 회피 판정
    if (INV_MAP[e.type] && e.ps === 'dodge' && e.t < BLINK + 0.05) return; // v1.58 난입자 점멸 중 무적 (플레이어와 같음)
    const P = G.player, s = G.stats;
    if (e.type === 'boss' && e.shield) {
      e.barHit = time;
      e.flash = 0.06; sfx('block');
      sparks(e.x, e.y - 20, o.ang || 0, '#9cc1ea', 4);
      return;
    }
    if (e.type === 'queen' && e.blink && (e.fadeA == null ? 1 : e.fadeA) < 0.35) return; // v1.30 베일 걸음 중 흩어진 동안은 맞지 않음
    const shieldHit = e.type === 'aguard' && !o.dot && guardFront(e, P.x); // v1.24 근위병 방패
    const crit = !o.dot && (P.critNext || P.counterT > 0 || (P.navyShot && uncK() === 'gunner12') || Math.random() < s.crit + (P.echoT > 0 ? 0.25 : 0) + AWK.crit());
    if (P.critNext && !o.dot) { P.critNext = false; gxCrit(e, P.firstCrit); P.firstCrit = false; if (P.firstN > 0) { P.firstN--; P.critNext = true; P.firstCrit = true; } }
    let dmg = (hasRelic('fang') && P.hp <= 2 ? 1.4 : 1) * s.atk * coef * (1 - e.def / (e.def + 500)) * (crit ? s.critDmg : 1) * (e.grogiT > 0 ? 1.5 : 1) * (G.frenzyT > 0 ? 1.3 : 1) * (CL().dmgMul || 1) * (s.fx.has('tusk') && (e.type === 'boss' || isElite(e) || isSemi(e)) ? 1.15 : 1) * (s.efx.has('exec') && e.hp < e.maxHp * 0.3 ? 1.25 : 1) * (s.set4.has('orc') && P.hp < s.hp * 0.5 ? 1.3 : 1);
    dmg *= (P.penT > 0 ? 2 : 1) * (wSkill() === 'water' && (G.stage === 2 || G.stage === 4) ? 1.3 : 1); // v2.13 고해의 채찍 · 성수 물뿌리개
    if (!o.dot && mordredFrontHit(e, P.x)) { dmg *= 0.15; sfx('block', 1.1); sparks(e.x + e.face * 20, e.y - 20, Math.atan2(0, -e.face), '#ffd060', 6); mordredCounter(e); } // v1.30 근위의 맹세
    if (shieldHit) { dmg *= 0.4; if (Math.random() < 0.5) sfx('block', 1.2); sparks(e.x + e.face * 9, e.y - 12, Math.atan2(0, -e.face), '#e8e2d6', 4); }
    dmg *= (e.vuln || 1) * (e.armorMul || 1) * pasDmgMul(e, o) * engDmgMul(e) * (P.counterT > 0 && !o.dot ? COUNTER_MUL : 1) * (G.hornT > time ? 1.25 : 1); // v2.22 보관 패시브
    if (!o.dot) { if (P.dropletNext && !o.proc) { P.dropletNext = false; dmg *= 1.5; } if (hasRelic('chain') && e.st && e.st.stunT > 0) dmg *= 1.2; if (hasRelic('candle') && e.type !== 'boss' && !isDummy(e) && G.enemies.filter(x => !x.dead && !isDummy(x)).length === 1) dmg *= 1.5; } // v2.36 물방울·사슬·촛불
    dmg = Math.max(1, Math.round(dmg));
    e.hitT = time;
    if (isDummy(e)) { const a = o.ang != null ? o.ang : Math.atan2(e.y - P.y, e.x - P.x), dir = Math.cos(a) >= 0 ? 1 : -1, pw = o.dot ? 12 : o.heavy ? 95 : 62; e.bendV = (e.bendV || 0) + dir * pw; e.dSq = o.dot ? 0 : 0.06; // v3.64 허수아비 타격감: 맞은 방향으로 휘청 + 짚 부스러기
      if (!o.dot) for (let i = 0; i < (o.heavy ? 10 : 6); i++) G.parts.push({ x: e.x + rand(-6, 6), y: e.y - rand(16, 40), vx: dir * rand(40, 140), vy: -rand(30, 110), t: rand(0.35, 0.7), c: pick(['#d8c098', '#b89c72', '#e8cc70']), g: 380, floor: e.y + rand(0, 8) }); }
    let wardAb = 0; if (e.ward > 0) { e.barHit = time; const ab = Math.min(e.ward, dmg); wardAb = ab; e.ward -= ab; dmg -= ab; if (e.ward <= 0) { e.ward = 0; burst(e.x, e.y - 20, '#ff6060', 10); sfx('block', 1.3); } }
    e.hp -= dmg; e.flash = o.dot ? 0.06 : 0.12;
    if (G.tstopT > 0 && e.st && e.st.tsT > 0 && !o.bank) e.st.bank = (e.st.bank || 0) + dmg * 0.5; // v2.08 시간 정지 중 피해 절반을 모아 둠
    if (isDummy(e) && e.hp <= 0) e.hp = e.maxHp; // v2.04 허수아비는 쓰러지지 않음
    if (!o.proc && !o.dot) { // v0.98 장비 효과 연계 (연계로 생긴 피해는 다시 연계하지 않음)
      if (crit && s.efx.has('bleed')) { if (!(e.bleedT > 0)) gxSpurt(e, 10, (o.ang == null ? -Math.PI / 2 : o.ang) - 0.4); e.bleedT = 3; if (!(e.bleedTick > 0)) e.bleedTick = 0.5; }
      if (s.efx.has('exec') && e.hp + dmg < e.maxHp * 0.3) gxExec(e);
      if (crit && s.efx.has('chain')) chainBolt(e);
      if (s.set4.has('order') && Math.random() < 0.12) ghostSword(e);
      weaponOnHit(e, o, crit); // v2.03 무기 기술
      pasOnHit(e, o, crit); // v2.22 보관 패시브
      engOnHit(e, o, crit, coef); // v2.41 빛의 각인
      BDC.onHit(e, o); // v3.18 뼈주사위
    }
    const killing = e.hp <= 0, small = e.type !== 'boss' && !isElite(e) && !isSemi(e);
    const top = e.tall || (e.type === 'boss' ? 62 : isElite(e) ? 52 : 36);
    if (dmg > 0 || wardAb > 0) G.nums.push({ x: e.x + rand(-5, 5), y: e.y - top, v: String(dmg > 0 ? dmg : wardAb), t: crit ? 0.95 : 0.7, c: dmg <= 0 ? '#8aa8c8' : o.dot ? '#ffa050' : crit ? '#ffd34d' : '#ffffff', s: o.dot ? 1 : crit ? 3 : 2, // v2.38 보호막이 다 막은 공격은 0 대신 막은 양을 회청색으로 · v2.40 크기(s)가 주석에 묻혀 숫자를 그리다 렌더가 멈추던 문제 수정
      pop: o.dot ? 0 : crit ? 0.2 : 0.12, vx: o.dot ? 0 : Math.cos(o.ang || 0) * rand(25, 45) + rand(-12, 12), vy: o.dot ? 0 : crit ? -70 : -40 });
    const hy = e.y - (e.tall ? e.tall * 0.42 : e.type === 'boss' ? 26 : isElite(e) ? 20 : 12);
    if (!o.dot) {
      burst(e.x, hy, bloodOf(e), crit ? 16 : killing ? 12 : 8, o.ang);
      sparks(e.x, hy, o.ang || 0, crit ? '#ffd34d' : '#fff6dc', crit ? 9 : o.heavy ? 7 : 5);
      G.fx.push({ kind: 'hitflash', x: e.x, y: hy, t: 0.08, max: 0.08, r: crit ? 16 : 11 });
      const big = crit || o.heavy;
      G.fx.push({ kind: 'hitspark', x: e.x, y: hy, ang: o.ang || 0, rot: rand(-0.35, 0.35), t: big ? 0.16 : 0.12, max: big ? 0.16 : 0.12, r: (crit ? 26 : o.heavy ? 21 : 15) * (killing ? 1.3 : 1), c: crit ? '255,205,70' : o.heavy ? '255,225,180' : '255,246,225', crit });
      if (crit) G.fx.push({ kind: 'ring', x: e.x, y: hy, r: 6, t: 0.22, max: 0.22, c: '#ffd34d', grow: 260 });
      if (e.type !== 'ghost') splat(e.x, e.y, 4, splatOf(e));
      // 맞은 적: 짧게 떨리고, 맞은 방향으로 젖혀지고, 잡몹은 이동이 잠깐 끊긴다
      e.shk = big ? 0.2 : 0.14; e.shkAng = o.ang || 0; e.lastAng = o.ang;
      if (small) { e.lean = 0.22 * (Math.cos(o.ang || 0) > 0 ? 1 : -1); if (e.state !== 'dash') e.hitStun = Math.max(e.hitStun || 0, o.heavy ? 0.22 : 0.14); }
      if (!G.combo) G.combo = { n: 0, t: 0, pop: 0, best: 0 };
      G.combo.n++; G.combo.t = 2.6; G.combo.pop = 0.12; G.combo.best = Math.max(G.combo.best, G.combo.n);
    }
    if (!o.noStop) {
      let st = (o.heavy ? 0.085 : 0.05) + (crit ? 0.035 : 0) + (killing ? (small ? 0.035 : 0.1) : 0);
      st /= 1 + stopHeat * 3; stopHeat = Math.min(1.2, stopHeat + st);
      /* v1.08 역경직 제거 */
      // 평타(basic)는 화면 흔들림·줌 없음 — 치명타·특수기술·각성기만 화면을 흔든다 (히트스톱은 유지)
      if (!o.basic || crit) {
        addShake((o.heavy ? 4.5 : 2.5) + (crit ? 2 : 0) + (killing ? 1.5 : 0), o.ang);
        zoomK = Math.max(zoomK, o.heavy ? 0.022 : crit ? 0.018 : 0.007);
      }
    }
    if (!ultBusy(P)) P.gauge = Math.min(100, P.gauge + (o.gauge == null ? 4 : o.gauge) * s.gaugeRate);
    if (!o.dot) { sfx(o.heavy ? 'heavy' : 'hit', rand(0.88, 1.14)); if (crit) sfx('crit', rand(0.95, 1.08)); }
    const kb = (o.kb || 0) * e.kbRes * (o.kb && o.kb < 100 ? 1.35 : 1);
    if (kb > 0) { e.vx += Math.cos(o.ang) * kb; e.vy += Math.sin(o.ang) * kb; }
    if (o.stagger && ['ghoul', 'dog', 'ghost', 'cultist', 'goblin', 'garcher', 'slime', 'bigslime', 'toxslime', 'crow', 'orc', 'othrow', 'wolf', 'shaman', 'slave'].includes(e.type) && e.state !== 'dash' && !e.dash) {
      e.holdAng = null; e.hop = null; e.z = 0;
      cancelTele(e); e.state = 'stun'; e.t = o.stagger; e.lean = 0.35 * (Math.cos(o.ang || 0) > 0 ? 1 : -1);
    }
    const sealHit = !o.dot && P.counterT > 0 && hasRelic('seal'); // v2.29 녹슨 기사단 인장: 반격 시간 동안 그로기 2배
    if (e.grogiMax && e.grogiT <= 0 && o.grogi && !(e.grogiLock > time)) {
      e.grogi += o.grogi * (sealHit ? 2 : 1) * (1 + pasV('grogi')) * (o.basic && P.combo === 2 && uncK() === 'knight11' ? 1.2 : 1); e.grogiHitT = time;
      if (e.grogi >= e.grogiMax) {
        e.grogi = 0; e.grogiT = e.type === 'boss' ? 5 : 3; cancelTele(e); e.state = 'grogi';
        if (e.type === 'boss') { banner('그로기!', '5초간 받는 피해 +50%'); e.grogiMax = Math.round(e.grogiMax * 1.5); } // v1.49 보스는 그로기마다 다음 그로기가 1.5배 어려워짐
        sfx('grogi'); flashT = 0.08; flashColor = '#ffe39a';
        G.fx.push({ kind: 'ring', x: e.x, y: e.y - 14, r: 10, t: 0.5, max: 0.5, c: '#ffd34d' });
      }
    }
    if (e.hp <= 0) killEnemy(e);
  }

  // ================================================================ v2.41 빛의 각인 (문서: 빛의각인_설계) — 색 단계마다 각인 3개 중 1개 선택, 근딜·원딜 별도
  // 분노 = 낙인 · 평온 = 잔상 · 희망 = 빛 조각. 1·2단계는 새 각인, 3단계는 고른 각인 완성 또는 새 각인
  const ENG = {
    // ---- 분노의 빛: 낙인 (근딜)
    r_m1: { c: 'r', t: 'm', n: '불도장', d: '낙인이 3중첩되면 폭발하여 중간 피해를 줍니다.', x: '공격 적중 시 낙인 부여 확률이 50%로 증가합니다.' },
    r_m2: { c: 'r', t: 'm', n: '꿰뚫는 낙인', d: '점멸로 낙인이 부여된 적을 통과하면, 해당 적의 낙인이 모두 폭발합니다.', x: '점멸로 통과한 모든 적에게 낙인을 1중첩 부여합니다.' },
    r_m3: { c: 'r', t: 'm', n: '붉은 사슬', d: '낙인이 부여된 적끼리 사슬로 연결됩니다. 연결된 적 하나를 공격하면 연결된 다른 적에게도 피해의 25%가 전달됩니다.', x: '사슬로 전달되는 피해가 50%로 증가합니다.' },
    r_m4: { c: 'r', t: 'm', n: '역린', d: '낙인이 부여된 적은 공격 예고 시간이 0.25초 늘어납니다.', x: '낙인 3중첩인 적이 공격을 예고하는 동안 공격을 적중시키면 해당 공격을 취소시킵니다. 보스와 정예 몬스터에게는 적용되지 않습니다.' },
    r_m5: { c: 'r', t: 'm', n: '피의 고리', d: '낙인이 폭발한 위치에 붉은 고리가 3초 동안 생성됩니다. 고리 안에 있는 동안 공격 속도가 30% 증가합니다.', x: '붉은 고리 안에서 공격이 적중하면 낙인이 반드시 부여됩니다.' },
    // ---- 분노의 빛: 낙인 (원딜)
    r_r1: { c: 'r', t: 'r', n: '조준 낙인', d: '발사한 탄이 낙인이 부여된 적을 향해 유도됩니다.', x: '낙인이 부여된 적을 향한 탄의 유도 성능이 2배로 증가합니다.' },
    r_r2: { c: 'r', t: 'r', n: '과녁', d: '낙인이 부여된 적에게 적중한 탄은 적을 관통합니다. 관통할 때마다 탄의 피해가 30% 감소합니다.', x: '낙인이 부여된 적을 관통해도 탄의 피해가 감소하지 않습니다.' },
    r_r3: { c: 'r', t: 'r', n: '낙인 전이', d: '낙인이 부여된 적을 처치하면 가장 가까운 적 2명에게 낙인이 1중첩 전이됩니다.', x: '처치한 적의 낙인 중첩 수가 그대로 전이됩니다.' },
    r_r4: { c: 'r', t: 'r', n: '붉은 표적판', d: '낙인 3중첩인 적은 다른 적의 공격과 투사체에도 피해를 입습니다.', x: '낙인 2중첩인 적도 다른 적의 공격과 투사체에 피해를 입습니다.' },
    r_r5: { c: 'r', t: 'r', n: '집중 사선', d: '낙인 3중첩인 적을 조준하면 표적 표시가 나타납니다. 해당 적에게 처음 적중하는 탄은 크기가 커지고 피해가 40% 증가합니다.', x: '표적에게 처음 적중한 탄이 낙인을 폭발시켜 중간 피해를 추가로 줍니다.' },
    // ---- 평온의 빛: 잔상 (근딜)
    b_m1: { c: 'b', t: 'm', n: '메아리 베기', d: '공격하면 잔상도 제자리에서 같은 방향으로 공격합니다. 잔상의 공격은 피해의 50%를 줍니다.', x: '잔상의 공격 피해가 100%로 증가합니다.' },
    b_m2: { c: 'b', t: 'm', n: '미끼 잔상', d: '잔상 주변의 일반 몬스터는 플레이어 대신 잔상을 공격합니다.', x: '잔상을 공격하고 있는 적이 받는 피해가 20% 증가합니다.' },
    b_m3: { c: 'b', t: 'm', n: '되돌아가기', d: '점멸 직후 점멸 키를 다시 누르면 잔상 위치로 순간 이동합니다. 이때 점멸 충전은 소모되지 않습니다.', x: '잔상 위치로 순간 이동할 때 이동 경로에 있는 모든 적에게 피해를 줍니다.' },
    b_m4: { c: 'b', t: 'm', n: '밀물', d: '잔상이 사라질 때 물결이 퍼져 주변 적에게 작은 피해를 주고 밀어냅니다.', x: '잔상이 사라질 때 퍼지는 물결이 범위 안의 적 투사체를 제거합니다.' },
    b_m5: { c: 'b', t: 'm', n: '잇는 선', d: '잔상이 2개일 때 두 잔상 사이가 푸른 선으로 연결됩니다. 선에 닿은 적은 지속적으로 피해를 입습니다.', x: '플레이어와 가장 최근 잔상 사이에도 같은 선이 연결됩니다.' },
    // ---- 평온의 빛: 잔상 (원딜)
    b_r1: { c: 'b', t: 'r', n: '잔상 사수', d: '탄을 발사하면 잔상도 같은 방향으로 탄을 발사합니다. 잔상의 탄은 피해의 50%를 줍니다.', x: '잔상이 발사하는 탄의 피해가 100%로 증가합니다.' },
    b_r2: { c: 'b', t: 'r', n: '물러남 사격', d: '점멸할 때 점멸 방향의 반대쪽으로 탄 3발을 부채꼴로 발사합니다.', x: '점멸할 때 발사하는 탄이 5발로 증가합니다.' },
    b_r3: { c: 'b', t: 'r', n: '얼음 벽', d: '잔상이 벽이 되어 적의 이동을 막습니다. 보스에게는 적용되지 않습니다.', x: '잔상에 부딪힌 적은 0.5초 동안 기절합니다.' },
    b_r4: { c: 'b', t: 'r', n: '되감기 탄', d: '적에게 적중하지 않은 탄이 잔상 쪽으로 되돌아오며, 되돌아오는 경로의 적에게 피해를 줍니다. 잔상이 없으면 플레이어 쪽으로 되돌아옵니다.', x: '적에게 적중한 탄도 같은 방식으로 되돌아옵니다.' },
    b_r5: { c: 'b', t: 'r', n: '물결 장막', d: '플레이어와 가장 최근 잔상 사이에 장막이 생성되어, 장막에 닿는 적의 투사체를 막습니다.', x: '장막이 투사체를 3개 막을 때마다 가장 가까운 적에게 탄 1발을 발사합니다.' },
    // ---- v2.47 희망의 빛: 역전 (근딜) — 맞을수록 · 하트가 적을수록 강해짐
    h_m1: { c: 'g', t: 'm', n: '불굴', d: '희망 중첩 수에 비례하여 공격에 맞은 적이 더 멀리 밀려납니다. 보스에게는 적용되지 않습니다.', x: '희망 3중첩일 때 연속 공격의 3번째 공격이 충격파를 일으켜 주변 적에게 중간 피해를 줍니다.' },
    h_m2: { c: 'g', t: 'm', n: '반격의 빛', d: '피격당한 후 1초 안에 공격하면 희망을 모두 소진하여, 소진한 희망 1중첩당 중간 피해를 추가로 줍니다.', x: '반격 공격이 플레이어 주변의 모든 적에게 같은 추가 피해를 줍니다.' },
    h_m3: { c: 'g', t: 'm', n: '마지막 불씨', d: '하트가 1칸 이하로 떨어지면 5초 동안 공격할 때마다 전방으로 빛의 검기를 발사합니다. 이 효과는 원정 1회당 한 번만 발동합니다.', x: '마지막 불씨가 원정 1회당 한 번이 아니라 방마다 한 번씩 발동합니다.' },
    h_m4: { c: 'g', t: 'm', n: '버티는 발', d: '희망 3중첩일 때는 피격당해도 밀려나지 않습니다.', x: '희망 2중첩부터 피격당해도 밀려나지 않습니다.' },
    h_m5: { c: 'g', t: 'm', n: '등 뒤의 달', d: '하트가 절반 이하일 때 0.5초마다 플레이어 주변으로 빛의 파동이 퍼져, 닿은 적에게 작은 피해를 줍니다.', x: '하트 수와 관계없이 항상 빛의 파동이 퍼집니다.' },
    // ---- v2.47 희망의 빛: 역전 (원딜)
    h_r1: { c: 'g', t: 'r', n: '역광 사격', d: '희망 중첩 수에 비례하여 탄의 크기와 피해가 증가합니다. 희망이 1중첩 이상이면 탄이 적을 관통합니다.', x: '희망 3중첩일 때 탄이 세 갈래로 나뉘어 발사됩니다.' },
    h_r2: { c: 'g', t: 'r', n: '마지막 불씨', d: '하트가 1칸 이하로 떨어지면 5초 동안 탄을 발사할 때마다 초록빛 탄 2발을 추가로 발사합니다. 이 효과는 원정 1회당 한 번만 발동합니다.', x: '마지막 불씨가 원정 1회당 한 번이 아니라 방마다 한 번씩 발동합니다.' },
    h_r3: { c: 'g', t: 'r', n: '위기의 조준', d: '하트가 절반 이하일 때 발사한 탄이 가장 가까운 적을 향해 유도됩니다.', x: '하트 수와 관계없이 항상 탄이 가장 가까운 적을 향해 유도됩니다.' },
    h_r4: { c: 'g', t: 'r', n: '빛의 응답', d: '피격당하면 공격한 적을 향해 초록빛 탄 3발을 자동으로 발사합니다.', x: '초록빛 탄이 5발로 증가하고, 피격당할 때 희망이 1중첩 추가로 쌓입니다.' },
    h_r5: { c: 'g', t: 'r', n: '별빛 장막', d: '희망이 3중첩되면 희망을 모두 소진하여 화면에 있는 적의 투사체를 모두 제거합니다. 이 효과는 방마다 한 번만 발동합니다.', x: '별빛 장막이 방마다 두 번까지 발동합니다.' },
  };
  const ENG_BASE = { r: '근거리 직업은 공격 적중 시 30%, 원거리 직업은 탄 적중 시 20% 확률로 적에게 낙인을 1중첩 부여합니다. 낙인은 최대 3중첩까지 쌓이며 5초 동안 유지됩니다.', b: '점멸한 위치에 잔상이 2초 동안 남습니다. 잔상은 최대 2개까지 유지됩니다.', g: '피격당할 때마다 희망이 1중첩 쌓입니다. 희망은 최대 3중첩까지 쌓이며 6초 동안 유지됩니다. 하트가 절반 이하이면 일부 각인의 효과가 강화됩니다.' }; // v2.49 설명 정리
  const ENG_ICON = { r: '◆', b: '◇', g: '✦' };
  // v2.48 각인 아이콘: 16×16 도트, 각인마다 고유 문양 (빛 색 3단계 + 쇠 · 검은 외곽선 자동)
  // v2.49 각인 아이콘: 16칸 도트 — 모든 선은 2칸 붓, 음영은 재질별 3단(밝음·중간·어둠)을 "왼쪽 위 빛" 규칙으로 자동으로 칠한다
  //   재질: M 본색 · D 짙은 본색 · L 옅은 본색 · S 쇠 · W 흰빛(평면) · K 홈(평면)
  const ENG_ICOL = {
    r: { M: ['#ffa08a', '#e8443a', '#9a1626'], D: ['#e0484a', '#a01828', '#560a18'], L: ['#fff0e8', '#ffb0a0', '#e87a68'] },
    b: { M: ['#b4dcff', '#4a98f0', '#1e4a9a'], D: ['#5a9ae8', '#22509e', '#0e2450'], L: ['#ffffff', '#d0e8ff', '#88b8f0'] },
    g: { M: ['#d0ffb0', '#62d044', '#2a7418'], D: ['#6ac048', '#2e7a1a', '#123c08'], L: ['#f6fff0', '#d8ffc4', '#86d468'] } };
  const ENG_STEEL = ['#ffffff', '#c4c8d2', '#6a6e7a'];
  const PI = Math.PI;
  const ENG_ART = {
    // 분노 · 근접
    r_m1: [['l', 1, 13, 6, 8, 'S'], ['r', 6, 1, 13, 8, 'M'], ['r', 8, 3, 11, 6, 'K'], ['r', 9, 4, 10, 5, 'L'], ['d', 14, 0, 'W'], ['d', 4, 2, 'W'], ['d', 3, 4, 'L']],
    r_m2: [['p', [[8, 2], [14, 8], [8, 14], [2, 8]], 'M'], ['p', [[8, 6], [10, 8], [8, 10], [6, 8]], 'K'], ['l', 1, 13, 10, 4, 'S'], ['p', [[15, 0], [15, 6], [9, 0]], 'S']],
    r_m3: [['o', 4, 11.5, 3.6, 'M'], ['o', 11.5, 4, 3.6, 'M'], ['o', 7.8, 7.8, 3.6, 'L']],
    r_m4: [['p', [[8, 0], [15, 6], [12, 13], [8, 16], [4, 13], [1, 6]], 'M'], ['p', [[8, 4], [11, 7], [10, 11], [8, 12], [6, 11], [5, 7]], 'D'], ['r', 7, 5, 8, 11, 'L']],
    r_m5: [['o', 7.5, 6.5, 6.5, 'M'], ['r', 6, 5, 9, 8, 'D'], ['r', 3, 11, 4, 13, 'M'], ['r', 10, 12, 11, 15, 'M'], ['d', 3, 14, 'D']],
    // 분노 · 원거리
    r_r1: [['o', 7.5, 7.5, 6, 'S'], ['r', 7, 0, 8, 3, 'S'], ['r', 7, 12, 8, 15, 'S'], ['r', 0, 7, 3, 8, 'S'], ['r', 12, 7, 15, 8, 'S'], ['r', 6, 6, 9, 9, 'M']],
    r_r2: [['c', 8.5, 8.5, 7, 'M'], ['c', 8.5, 8.5, 5, 'L'], ['c', 8.5, 8.5, 3, 'M'], ['r', 8, 8, 9, 9, 'W'], ['l', 0, 0, 6, 6, 'S'], ['r', 0, 3, 1, 4, 'D'], ['r', 3, 0, 4, 1, 'D']],
    r_r3: [['p', [[4, 4], [8, 8], [4, 12], [0, 8]], 'M'], ['l', 6, 6, 10, 2, 'L'], ['l', 6, 8, 10, 12, 'L'], ['p', [[13, 0], [16, 3], [13, 6], [10, 3]], 'M'], ['p', [[13, 10], [16, 13], [13, 16], [10, 13]], 'M']],
    r_r4: [['r', 0, 0, 15, 15, 'D'], ['c', 7.5, 7.5, 5.6, 'M'], ['c', 7.5, 7.5, 3.6, 'L'], ['r', 7, 7, 8, 8, 'K']],
    r_r5: [['l', 1, 13, 7, 7, 'S'], ['o', 10.5, 4.5, 4.6, 'M'], ['r', 10, 4, 11, 5, 'L']],
    // 평온 · 근접
    b_m1: [['a', 1.5, 14.5, 12.5, -PI / 2, -0.05, 'L'], ['a', 1.5, 14.5, 8, -PI / 2, -0.05, 'M'], ['d', 14, 1, 'W'], ['d', 9, 6, 'W']],
    b_m2: [['c', 7.5, 6.5, 5.5, 'L'], ['r', 2, 6, 13, 12, 'L'], ['r', 2, 13, 3, 14, 'L'], ['r', 7, 13, 8, 14, 'L'], ['r', 12, 13, 13, 14, 'L'], ['r', 5, 5, 5, 7, 'K'], ['r', 10, 5, 10, 7, 'K']],
    b_m3: [['a', 7.5, 7, 5, PI, 2 * PI, 'M'], ['l', 12, 7, 12, 11, 'M'], ['l', 2, 7, 2, 10, 'M'], ['p', [[0, 11], [6, 11], [3, 15]], 'L']],
    b_m4: [['w', 1, 2, 'L'], ['w', 1, 7, 'M'], ['w', 1, 12, 'D']],
    b_m5: [['l', 3, 11, 11, 3, 'L'], ['c', 3, 12, 3, 'M'], ['c', 12, 3, 3, 'M'], ['r', 7, 7, 8, 8, 'W']],
    // 평온 · 원거리
    b_r1: [['r', 1, 2, 7, 6, 'L'], ['p', [[8, 2], [11, 4], [8, 7]], 'L'], ['r', 1, 2, 1, 6, 'D'], ['r', 4, 9, 10, 13, 'M'], ['p', [[11, 9], [14, 11], [11, 14]], 'M'], ['r', 4, 9, 4, 13, 'D']],
    b_r2: [['l', 9, 7, 1, 7, 'L'], ['l', 9, 7, 2, 1, 'L'], ['l', 9, 7, 2, 13, 'L'], ['p', [[16, 8], [10, 3], [10, 13]], 'M']],
    b_r3: [['r', 0, 2, 15, 14, 'L'], ['r', 0, 6, 15, 6, 'D'], ['r', 0, 10, 15, 10, 'D'], ['r', 7, 2, 7, 5, 'D'], ['r', 3, 7, 3, 9, 'D'], ['r', 11, 7, 11, 9, 'D'], ['r', 7, 11, 7, 14, 'D'], ['d', 2, 3, 'W'], ['d', 9, 3, 'W'], ['d', 5, 8, 'W'], ['d', 13, 8, 'W']],
    b_r4: [['a', 7.5, 8, 5.5, -0.5, PI * 1.45, 'M'], ['p', [[10, 0], [16, 4], [10, 7]], 'M'], ['r', 7, 7, 8, 8, 'L']],
    b_r5: [['r', 1, 0, 3, 15, 'M'], ['r', 5, 0, 6, 15, 'L'], ['r', 1, 0, 6, 1, 'D'], ['c', 12, 8, 2.6, 'S'], ['d', 9, 5, 'W'], ['d', 8, 8, 'W'], ['d', 9, 11, 'W']],
    // 희망 · 근접
    h_m1: [['r', 4, 6, 11, 12, 'M'], ['r', 4, 3, 11, 5, 'L'], ['r', 6, 3, 6, 5, 'D'], ['r', 9, 3, 9, 5, 'D'], ['r', 2, 7, 4, 10, 'L'], ['r', 5, 12, 10, 15, 'D'], ['d', 1, 1, 'W'], ['d', 14, 1, 'W'], ['d', 8, 0, 'W']],
    h_m2: [['l', 1, 1, 10, 10, 'S'], ['l', 13, 1, 4, 10, 'S'], ['r', 1, 12, 3, 14, 'D'], ['r', 12, 12, 14, 14, 'D'], ['l', 2, 10, 4, 12, 'D'], ['l', 12, 10, 10, 12, 'D'], ['p', [[8, 2], [10, 6], [14, 7.5], [10, 9], [8, 13], [6, 9], [2, 7.5], [6, 6]], 'M'], ['r', 7, 7, 8, 8, 'W']],
    h_m3: [['p', [[8, 0], [14, 7], [14, 11], [11, 15], [5, 15], [2, 11], [2, 7]], 'M'], ['p', [[8, 5], [11, 10], [10, 14], [6, 14], [5, 10]], 'L'], ['p', [[8, 9], [10, 14], [6, 14]], 'W']],
    h_m4: [['r', 4, 1, 9, 11, 'M'], ['r', 4, 1, 9, 2, 'L'], ['r', 4, 9, 13, 12, 'M'], ['r', 0, 13, 15, 15, 'D']],
    h_m5: [['c', 7.5, 7.5, 4, 'M'], ['r', 7, 0, 8, 1, 'L'], ['r', 7, 14, 8, 15, 'L'], ['r', 0, 7, 1, 8, 'L'], ['r', 14, 7, 15, 8, 'L'], ['r', 2, 2, 3, 3, 'L'], ['r', 12, 2, 13, 3, 'L'], ['r', 2, 12, 3, 13, 'L'], ['r', 12, 12, 13, 13, 'L']],
    // 희망 · 원거리
    h_r1: [['c', 6, 8, 6, 'M'], ['c', 6, 8, 3.6, 'L'], ['r', 5, 6, 11, 9, 'S'], ['p', [[12, 6], [15, 7.5], [15, 8.5], [12, 10]], 'S'], ['r', 5, 6, 5, 9, 'D']],
    h_r2: [['p', [[5, 0], [10, 6], [10, 11], [7, 15], [3, 15], [0, 11], [0, 6]], 'M'], ['p', [[5, 6], [8, 10], [7, 14], [3, 14], [2, 10]], 'L'], ['r', 11, 2, 15, 4, 'L'], ['r', 11, 10, 15, 12, 'L']],
    h_r3: [['p', [[8, 15], [0, 7], [0, 4], [3, 1], [6, 1], [8, 3], [10, 1], [13, 1], [16, 4], [16, 7]], 'M'], ['r', 7, 5, 8, 11, 'L'], ['r', 4, 7, 11, 8, 'L'], ['r', 7, 7, 8, 8, 'W']],
    h_r4: [['p', [[0, 1], [11, 1], [11, 9], [5.5, 15], [0, 9]], 'M'], ['p', [[3, 4], [8, 4], [8, 8], [5.5, 11], [3, 8]], 'L'], ['l', 8, 10, 12, 6, 'S'], ['p', [[16, 0], [16, 6], [10, 0]], 'S']],
    h_r5: [['c', 7.5, 12, 5.5, 'M'], ['c', 7.5, 12, 3, 'L'], ['r', 0, 12, 15, 15, 'D'], ['r', 7, 0, 8, 3, 'L'], ['l', 1, 3, 2, 5, 'L'], ['l', 13, 3, 12, 5, 'L']],
  };
  const ENG_ICN = {};
  function engIcon(id, done) { // 각인 아이콘 이미지 (완성은 금테 모서리)
    const key = id + (done ? '+' : ''); if (ENG_ICN[key]) return ENG_ICN[key];
    const E = ENG[id], F = ENG_ICOL[E ? E.c : 'r'], N = 16, g = Array.from({ length: N }, () => Array(N).fill(null));
    const P = (x, y, m) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = m; };
    const B = (x, y, m) => { x = Math.round(x); y = Math.round(y); P(x, y, m); P(x + 1, y, m); P(x, y + 1, m); P(x + 1, y + 1, m); }; // 2칸 붓
    for (const op of ENG_ART[id] || [['c', 8, 8, 4, 'M']]) { const t = op[0];
      if (t === 'd') P(op[1], op[2], op[3]);
      else if (t === 'r') { for (let y = op[2]; y <= op[4]; y++) for (let x = op[1]; x <= op[3]; x++) P(x, y, op[5]); }
      else if (t === 'l') { const n = Math.max(Math.abs(op[3] - op[1]), Math.abs(op[4] - op[2])) || 1; for (let i = 0; i <= n; i++) B(op[1] + (op[3] - op[1]) * i / n, op[2] + (op[4] - op[2]) * i / n, op[5]); }
      else if (t === 'c') { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (Math.hypot(x + 0.5 - op[1], y + 0.5 - op[2]) <= op[3]) P(x, y, op[4]); }
      else if (t === 'o') { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const d = Math.hypot(x + 0.5 - op[1], y + 0.5 - op[2]); if (d <= op[3] && d > op[3] - 2) P(x, y, op[4]); } }
      else if (t === 'a') { for (let i = 0; i <= 60; i++) { const a = op[4] + (op[5] - op[4]) * i / 60; B(op[1] + Math.cos(a) * op[3] - 0.5, op[2] + Math.sin(a) * op[3] - 0.5, op[6]); } }
      else if (t === 'w') { for (let x = op[1]; x <= 13; x++) B(x, op[2] + Math.round(Math.sin(x * 0.8) * 1.2), op[3]); }
      else if (t === 'p') { const pts = op[1]; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < (xj - xi) * (y + 0.5 - yi) / (yj - yi) + xi) ins = !ins; } if (ins) P(x, y, op[2]); } }
    }
    const at = (x, y) => (x >= 0 && y >= 0 && x < N && y < N) ? g[y][x] : null;
    const S2 = N + 2, [cv2, g2] = mkCanvas(S2, S2), px = (x, y, c) => { g2.fillStyle = c; g2.fillRect(x + 1, y + 1, 1, 1); };
    for (let y = -1; y <= N; y++) for (let x = -1; x <= N; x++) if (!at(x, y) && (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1))) px(x, y, '#0b0a0e'); // 1칸 검은 외곽선
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const m = g[y][x]; if (!m) continue;
      if (m === 'W') { px(x, y, '#ffffff'); continue; } if (m === 'K') { px(x, y, '#140f18'); continue; }
      const T = m === 'S' ? ENG_STEEL : F[m], same = (dx, dy) => !!at(x + dx, y + dy); // 빈칸과 맞닿은 가장자리만 음영 → 안쪽 무늬는 평면
      // 왼쪽 위 빛: 위·왼쪽이 비면 밝음, 아래·오른쪽이 비고 안쪽으로 두께가 있으면 어둠, 나머지는 중간
      const hi = (!same(0, -1) && same(0, 1)) || (!same(-1, 0) && same(1, 0) && !(!same(0, 1) && same(0, -1)));
      const lo = (!same(0, 1) && same(0, -1) && same(0, -2)) || (!same(1, 0) && same(-1, 0) && same(-2, 0) && !hi);
      px(x, y, hi ? T[0] : lo ? T[2] : T[1]);
    }
    if (done) { const G2 = ['#fff3b0', '#e8c060']; for (const [x, y, c] of [[0, 0, 0], [1, 0, 1], [0, 1, 1], [17, 0, 0], [16, 0, 1], [17, 1, 1], [0, 17, 0], [1, 17, 1], [0, 16, 1], [17, 17, 0], [16, 17, 1], [17, 16, 1]]) { g2.fillStyle = G2[c]; g2.fillRect(x, y, 1, 1); } } // 금테 모서리 (도트)
    return (ENG_ICN[key] = cv2.toDataURL());
  }
  // v2.49 각인 홈(32칸 도트): 계단식 팔각 홈 + 빛 색 테두리 + 아이콘 둘레 한 칸 광채(단색) — 완성은 금테 이중 + 반짝임 점
  const ENG_SEAL = {};
  function engSeal(id, done) {
    const key = id + (done ? '+' : ''); if (ENG_SEAL[key]) return ENG_SEAL[key];
    const E = ENG[id], F = ENG_ICOL[E ? E.c : 'r'], N = 32, [cv, g] = mkCanvas(N, N), px = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
    const cut = 7, inOct = (x, y, m) => x >= m && y >= m && x < N - m && y < N - m && x + y >= cut + m && (N - 1 - x) + y >= cut + m && x + (N - 1 - y) >= cut + m && (N - 1 - x) + (N - 1 - y) >= cut + m;
    const rimO = done ? '#e8c060' : F.M[1], rimI = done ? F.M[1] : F.M[2];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!inOct(x, y, 0)) continue;
      if (!inOct(x, y, 1)) px(x, y, '#050407'); // 검은 외곽
      else if (!inOct(x, y, 2)) px(x, y, rimO); // 바깥 테두리
      else if (!inOct(x, y, 3)) px(x, y, done ? rimI : '#050407');
      else if (!inOct(x, y, 4)) px(x, y, y < N / 2 ? '#000000' : '#3a3442'); // 깎인 홈: 위는 그늘, 아래는 반사
      else px(x, y, '#0e0c12');
    }
    if (done) for (const [x, y] of [[9, 6], [22, 6], [6, 22], [25, 22], [15, 5]]) px(x, y, '#fff3b0');
    // 아이콘 둘레 광채: 아이콘 외곽선 바깥으로 한 칸, 빛 색 짙은 단계(단색)
    const ic = new Image(); ic.src = engIcon(id, false); const tmp = mkCanvas(18, 18);
    const draw = () => { tmp[1].clearRect(0, 0, 18, 18); tmp[1].drawImage(ic, 0, 0); const d = tmp[1].getImageData(0, 0, 18, 18).data, on = (x, y) => x >= 0 && y >= 0 && x < 18 && y < 18 && d[(y * 18 + x) * 4 + 3] > 0;
      for (let y = -1; y <= 18; y++) for (let x = -1; x <= 18; x++) if (!on(x, y) && (on(x + 1, y) || on(x - 1, y) || on(x, y + 1) || on(x, y - 1))) px(x + 7, y + 7, done ? '#a07820' : F.D[1]);
      g.drawImage(tmp[0], 7, 7); };
    if (ic.complete && ic.naturalWidth) draw(); else ic.onload = () => { draw(); const u = cv.toDataURL(); ENG_SEAL[key] = u; document.querySelectorAll(`img[data-seal="${key}"]`).forEach(im => im.src = u); };
    return (ENG_SEAL[key] = cv.toDataURL());
  }
  const engImg = (id, done, px) => `<img class="engPx" src="${engIcon(id, done)}" style="width:${px || 18}px;height:${px || 18}px" alt="">`;
  const engT = () => (G.cls === 'mage' || G.cls === 'gunner') ? 'r' : 'm';
  const engHas = id => !!(ENG[id] && G && G.eng && G.eng[ENG[id].c].includes(id)); // 옛 각인 id는 항상 false
  const engDone = id => !!(G && G.engC && G.engC.has(id));
  const engAny = c => !!(G && G.eng && G.eng[c].length);
  function engReset() { G.engBuy = { r: 0, b: 0, g: 0 }; G.palTot = { r: 0, b: 0, g: 0 }; /* v3.25 빛의 샘: 색마다 산 횟수 · 이번 토벌에 모은 빛(쓴 것 포함) */ G.eng = { r: [], b: [], g: [] }; G.engC = new Set(); G.engQ = []; G.ais = []; G.engZ = []; G.engS = []; G.lant = []; G.emberUsed = false; if (G.player) { G.player.hope = 0; G.player.emberT = 0; } }
  function engQueue(c, tier) { if (!G.eng) engReset(); G.engQ.push({ c, tier }); }
  function engTryOpen() { if (!G.engQ || !G.engQ.length || mode !== 'play' || G.trans || G.cine || G.player.dead) return; openEng(G.engQ.shift()); }
  function engOptions(c, tier) {
    const mine = G.eng[c], pool = Object.keys(ENG).filter(k => ENG[k].c === c && ENG[k].t === engT() && !mine.includes(k));
    const pickN = (arr, n) => { const a = arr.slice(), o = []; while (o.length < n && a.length) o.push(a.splice(randi(0, a.length - 1), 1)[0]); return o; };
    if (tier < 3) return pickN(pool, 3).map(k => ({ k, done: false }));
    const o = mine.filter(k => !G.engC.has(k)).slice(0, 2).map(k => ({ k, done: true }));
    for (const k of pickN(pool, 3 - o.length)) o.push({ k, done: false });
    return o;
  }
  function openEng(q) {
    const opts = engOptions(q.c, q.tier); if (!opts.length) return;
    const H = HUES[q.c]; mode = 'eng'; sfx('grogi', 1.4);
    $('engTitle').innerHTML = `<span style="color:${H.c}">${H.n}</span> ${q.tier}단계 — 빛의 각인`;
    $('engSub').textContent = q.tier < 3 ? ENG_BASE[q.c] : '보유한 각인 하나를 완성하거나, 새로운 각인을 하나 획득합니다.';
    $('engChoices').innerHTML = opts.map((o, i) => { const E = ENG[o.k];
      return `<button class="choice engC${o.done ? ' done' : ''}" data-e="${o.k}" data-d="${o.done ? 1 : 0}" style="--ec:${H.c};--ecd:${ENG_ICOL[q.c].M[2]}"><span class="engRune"></span><span class="engSeal"><img src="${engSeal(o.k, o.done)}" data-seal="${o.k}${o.done ? '+' : ''}" alt=""></span>${o.done ? '<span class="engDone">완성</span>' : ''}<b>${E.n}</b><span class="engD">${o.done ? E.x : E.d}</span><span class="key">${i + 1}</span></button>`; }).join(''); // v2.49 각인 석판 (도트 규칙: 번짐·기울임 없음)
    $('engChoices').querySelectorAll('[data-e]').forEach(bt => bt.addEventListener('click', () => chooseEng(bt.dataset.e, bt.dataset.d === '1')));
    $('ovEng').classList.add('on');
  }
  function chooseEng(k, done) {
    const E = ENG[k]; if (done) G.engC.add(k); else G.eng[E.c].push(k);
    $('ovEng').classList.remove('on'); sfx('select'); mode = 'play'; for (const k in pressed) pressed[k] = false; // 고른 숫자키가 무기 교체로 이어지지 않게
    lootFeed(`${engImg(k, done, 18)} <b style="color:${HUES[E.c].c}">${E.n}${done ? ' 완성' : ''}</b>`, HUES[E.c].c, 3000);
    const P = G.player; G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 6, grow: 160, t: 0.4, max: 0.4, c: HUES[E.c].c });
    renderPal();
  }
  // ---------------------------------------------------------------- 낙인
  function addBrand(e, n) {
    if (!e || e.dead || !engAny('r') || isDummy(e) && false) return;
    e.brand = Math.min(3, (e.brand || 0) + n); e.brandT = time;
    if (engHas('r_m1') && e.brand >= 3) brandBurst(e);
  }
  function brandBurst(e, extra) {
    const n = e.brand || 0; if (!n || e.dead) return; e.brand = 0; e.focusUsed = false;
    G.fx.push({ kind: 'ring', x: e.x, y: e.y - 12, r: 4, grow: 120, t: 0.25, max: 0.25, c: '#ff3a2a' }); burst(e.x, e.y - 14, '#ff5a3a', 10); sfx('hit', 0.7);
    if (engHas('r_m5')) G.engZ.push({ k: 'ring', x: e.x, y: e.y, r: 44, t: 3, max: 3 });
    damageEnemy(e, 0.3 * n + (extra || 0), { proc: true, /* v2.47 중간 피해 */ ang: -Math.PI / 2, kb: 60, grogi: 2, gauge: 1 });
  }
  function brandAt(x, y) { return G.engZ.some(z => z.k === 'ring' && Math.hypot(x - z.x, (y - z.y) / 0.6) < z.r); }
  function engAspd() { return G && G.engZ && engHas('r_m5') && brandAt(G.player.x, G.player.y) ? 1.3 : 1; }
  function engTeleRate(t) { return t.owner && t.owner.brand > 0 && engHas('r_m4') ? t.dur / (t.dur + 0.25) : 1; }
  // ---------------------------------------------------------------- 공용: 각인 탄 (원딜 따라 쏘기·파편·되감기 등)
  function engShot(x, y, ang, coef, c, o = {}) { if (!G.engS) G.engS = []; G.engS.push(Object.assign({ x, y, ang, sp: 380, t: 0.75, coef, c, hit: new Set(), pierce: 0 }, o)); }
  function engMainShot(x, y, ang, coef0) { // 원딜 기본 공격 한 발마다: 잔상 사수
    if (G.eng && engHas('b_r1')) for (const ai of G.ais) engShot(ai.x, ai.y - 9, ang, coef0 * (engDone('b_r1') ? 1 : 0.5), '#9fd2ff');
    if (!G.eng) return; const P = G.player;
    if (engDone('h_r1') && P.hope >= 3) for (const s2 of [-0.22, 0.22]) engShot(x, y, ang + s2, coef0 * 0.5, '#6ad84a', { pierce: 1 }); // 역광 사격 완성: 세 갈래
    if (engHas('h_r2') && P.emberT > time) for (const s2 of [-0.12, 0.12]) engShot(x, y, ang + s2, coef0 * 0.5, '#a8f080', { sp: 460 }); // 마지막 불씨: 초록빛 연사
  }
  function engRewind(endX, endY, coef0, hit) { // 되감기 탄: 탄이 끝난 자리에서 잔상(없으면 나) 쪽으로
    if (!G.eng || !engHas('b_r4') || (hit && !engDone('b_r4'))) return; const P = G.player, ai = G.ais[G.ais.length - 1], tx = ai ? ai.x : P.x, ty = ai ? ai.y - 9 : P.y - 9;
    engShot(endX, endY, Math.atan2(ty - endY, tx - endX), coef0 * (hit ? 0.4 : 0.6), '#cfe6ff', { t: 0.9, back: true });
  }
  function engShotMods() { // 다음 기본 공격 한 발의 변화
    const P = G.player, o = { mul: 1, big: false, pierce: false, dmgKeep: false };
    if (P.gAmmo > 0 && engHas('g_r2')) { P.gAmmo--; o.mul *= 1.6; o.big = true; if (engDone('g_r2')) o.pierce = true; }
    if (P.pierceT > time) o.pierce = true;
    if (engHas('h_r1') && P.hope > 0) { o.mul *= 1 + 0.12 * P.hope; o.big = o.big || P.hope >= 2; o.pierce = true; } // v2.47 역광 사격
    return o;
  }
  function engAim(x, y, ang) { // 조준 낙인 (거너): 낙인 찍힌 적 쪽으로 살짝 휨 · 위기의 조준: 가까운 적 쪽으로
    if (engHas('h_r3') && (engDone('h_r3') || hopeLow())) { let best = null, bd = 0.35; for (const e of G.enemies) { if (e.dead || isDummy(e)) continue; const a = Math.atan2(e.y - 8 - y, e.x - x), dd = Math.abs(angDiff(a, ang)); if (dd < bd && Math.hypot(e.x - x, e.y - y) < 420) { bd = dd; best = a; } } if (best != null) ang = best; }
    if (!engHas('r_r1')) return ang; const lim = engDone('r_r1') ? 0.3 : 0.15; let best = null, bd = lim;
    for (const e of G.enemies) { if (e.dead || !(e.brand > 0)) continue; const a = Math.atan2(e.y - 8 - y, e.x - x), dd = Math.abs(angDiff(a, ang)); if (dd < bd && Math.hypot(e.x - x, e.y - y) < 420) { bd = dd; best = a; } }
    return best == null ? ang : best;
  }
  // 낙인 도트 (11×11칸 → 22px): '1' 십자, '2' 고리, '3' 가시 — 중첩 수만큼 드러남
  const BRAND_ROWS = [
    '.....3.....',
    '.3...3...3.',
    '..3.222.3..',
    '...2...2...',
    '..2..1..2..',
    '33.2.1.2.33',
    '..2.111.2..',
    '...2.1.2...',
    '..3.222.3..',
    '.3...3...3.',
    '.....3.....',
  ];
  function brandMark(n, flash, ph) {
    const S = 11, on = (x, y) => { const ch = BRAND_ROWS[y] && BRAND_ROWS[y][x]; return ch && ch !== '.' && +ch <= n; };
    const [c, g] = mkCanvas(S * 2 + 4, S * 2 + 4);
    for (let y = -1; y <= S; y++) for (let x = -1; x <= S; x++) { if (on(x, y)) continue; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => on(x + a, y + b))) { g.fillStyle = '#0b0a0e'; g.fillRect((x + 1) * 2, (y + 1) * 2, 2, 2); } }
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { if (!on(x, y)) continue; const ch = BRAND_ROWS[y][x];
      g.fillStyle = flash ? (ch === '1' ? '#ffffff' : '#ffe0d0') : ch === '1' ? (x === 5 && y === 5 ? '#fff0c0' : '#ffb060') : ch === '2' ? ((x + y) % 2 ? '#ff3a2a' : '#ff6a3a') : ((x + y + ph) % 2 ? '#c02020' : '#ff3a2a');
      g.fillRect((x + 1) * 2, (y + 1) * 2, 2, 2); }
    return c;
  }
  function engFocus(e) { return engHas('r_r5') && e && e.brand >= 3 && !e.focusUsed; }
  // ---------------------------------------------------------------- 타격·처치·점멸·줍기 연결
  // ---------------------------------------------------------------- v2.47 희망: 역전
  const hopeLow = () => { const P = G.player; return P.hp <= G.stats.hp / 2; };
  function hopeAdd(n) { const P = G.player; P.hope = Math.min(3, (P.hope || 0) + n); P.hopeT = time + 6; }
  function engSteady() { const P = G.player; return engHas('h_m4') && (P.hope || 0) >= (engDone('h_m4') ? 2 : 3); } // 버티는 발: 밀려나지 않음
  function engOnHurt(src) { // 맞을 때 (방패가 깨진 경우 포함, 장판·독 제외)
    if (!G.eng || !engAny('g')) return; const P = G.player, R = G.dun && G.dun.cur;
    hopeAdd(1 + (engDone('h_r4') ? 1 : 0)); P.hurtAt = time;
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 4, grow: 70, t: 0.25, max: 0.25, c: '#6ad84a' });
    if (engHas('h_r4')) { let T = src && !src.dead && src.x != null && G.enemies.includes(src) ? src : null; if (!T) T = G.enemies.filter(e => !e.dead && !isDummy(e)).sort((a, b) => dist(a, P) - dist(b, P))[0];
      if (T) { const n = engDone('h_r4') ? 5 : 3, a0 = Math.atan2(T.y - 8 - (P.y - 9), T.x - P.x); for (let i = 0; i < n; i++) engShot(P.x, P.y - 9, a0 + (i - (n - 1) / 2) * 0.14, G.cls === 'gunner' ? 0.9 : 0.45, '#6ad84a'); } }
    if ((engHas('h_m3') || engHas('h_r2')) && P.hp > 0 && P.hp <= 2) { const per = engDone('h_m3') || engDone('h_r2'), ok = per ? !(R && R.emberUsed) : !G.emberUsed;
      if (ok) { if (per && R) R.emberUsed = true; else G.emberUsed = true; P.emberT = time + 5; banner2(P, '마지막 불씨!'); sfx('grogi', 1.6); flashT = 0.08; flashColor = '#e0ffc8'; } }
    if (engHas('h_r5') && P.hope >= 3 && R && (R.dawnN || 0) < (engDone('h_r5') ? 2 : 1)) { R.dawnN = (R.dawnN || 0) + 1; P.hope = 0;
      for (const pr of G.eproj) burst(pr.x, pr.y - 10, '#6ad84a', 3); G.eproj.length = 0; G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 8, grow: 520, t: 0.5, max: 0.5, c: '#e0ffc8' }); flashT = 0.12; flashColor = '#eaffd8'; sfx('heal', 1.2); banner2(P, '별빛 장막'); }
  }
  function engOnHit(e, o, crit, coef) {
    if (!G.eng) return; const P = G.player, ranged = engT() === 'r';
    if (!ranged && P.state === 'attack') { // v2.47 낙인은 확률 (공격이 맞을 때 30% · 불도장 완성 50% · 피의 고리 완성 안에서는 반드시)
      if (engAny('r') && Math.random() < (engDone('r_m5') && brandAt(P.x, P.y) ? 1 : engDone('r_m1') ? 0.5 : 0.3)) addBrand(e, 1);
      if (P.combo === 2) {
        if (engHas('g_m4')) { e.richT = time + 3; if (engDone('g_m4') && isElite(e) && (e.richN || 0) < 5 && !(e.richCd > time)) { e.richN = (e.richN || 0) + 1; e.richCd = time + 0.6; engDropShard(e); } } }
    }
    if (ranged && o.basic) {
      if (engAny('r') && Math.random() < (engDone('r_m1') ? 0.35 : 0.2)) addBrand(e, 1); // v2.47 원딜은 탄이 맞을 때 20%
      if (engHas('g_r4')) { if (P.lastT !== e) { P.lastT = e; P.lastN = 0; } P.lastN++;
        if (P.lastN === 5 && !e.richDone) { e.richDone = true; engDropShard(e); } else if (engDone('g_r4') && (isElite(e) || e.type === 'boss') && P.lastN % 10 === 0) engDropShard(e); }
    }
    if (!ranged && P.state === 'attack' && !e.dead) {
      if (engHas('h_m1') && P.hope > 0 && e.type !== 'boss') { const a = angTo(P, e), k = 50 * P.hope; e.vx += Math.cos(a) * k; e.vy += Math.sin(a) * k; }
      if (engDone('h_m1') && P.hope >= 3 && P.combo === 2 && P.hopeWave !== P.t0Swing) { P.hopeWave = P.t0Swing; G.fx.push({ kind: 'ring', x: e.x, y: e.y - 8, r: 6, grow: 180, t: 0.3, max: 0.3, c: '#6ad84a' }); addShake(3);
        for (const q of nearFoes(e.x, e.y, 70)) damageEnemy(q, 0.6, { proc: true, ang: angTo(e, q), kb: 140, gauge: 1 }); }
      if (P.hsUntil > time && P.hsN > 0 && !(e.hsAt === P.hsUntil)) { e.hsAt = P.hsUntil; damageEnemy(e, 0.3 * P.hsN, { proc: true, ang: angTo(P, e), kb: 90, gauge: 1 }); burst(e.x, e.y - 14, '#6ad84a', 8); }
    }
    if (engHas('r_m3') && e.brand > 0 && !e.dead) for (const q of G.enemies) if (q !== e && !q.dead && q.brand > 0 && dist(q, e) < 220) { damageEnemy(q, coef * (engDone('r_m3') ? 0.5 : 0.25), { proc: true, ang: angTo(e, q), gauge: 0.3 }); G.fx.push({ kind: 'streak', x0: e.x, y0: e.y - 14, x1: q.x, y1: q.y - 14, t: 0.12, max: 0.12 }); }
    if (engDone('r_m4') && e.brand >= 3 && e.type !== 'boss' && !isElite(e) && G.tele.some(t => t.owner === e && t.t < t.dur)) { cancelTele(e); e.state = 'chase'; e.cd = Math.max(e.cd || 0, 0.9); G.nums.push({ x: e.x, y: e.y - 40, v: '끊김!', t: 0.8, c: '#ff6a4a', s: 1, txt: true }); }
  }
  function engDmgMul(e) {
    let m = 1;
    if (engDone('b_m2') && e.lureT > time) m *= 1.2;
    if (engHas('g_r5') && G.engZ.some(z => z.k === 'gold' && Math.hypot(e.x - z.x, (e.y - z.y) / 0.6) < z.r)) m *= 1.3;
    return m;
  }
  function engDropShard(e) { const R = G.dun && G.dun.cur, l0 = G.loot.length; spawnLoot('hue', e.x, e.y); if (G.loot[l0]) G.loot[l0].hue = R && R.hue ? (Math.random() < 0.7 ? R.hue : pick(['r', 'b', 'g'])) : pick(['r', 'b', 'g']); }
  function engOnKill(e) {
    if (!G.eng || !(e.brand > 0) || !engHas('r_r3')) return;
    const n = engDone('r_r3') ? e.brand : 1, T = G.enemies.filter(q => !q.dead && q !== e && dist(q, e) < 220).sort((a, b) => dist(a, e) - dist(b, e)).slice(0, 2);
    for (const q of T) { q.brand = Math.min(3, (q.brand || 0) + n); q.brandT = time; G.fx.push({ kind: 'streak', x0: e.x, y0: e.y - 14, x1: q.x, y1: q.y - 14, t: 0.18, max: 0.18 }); }
  }
  function engOnBlinkStart(fx, fy, ang) {
    if (!G.eng) return; const P = G.player;
    if (engAny('b')) { G.ais.push({ x: fx, y: fy, t: 2, max: 2, face: P.face, hitE: new Set() }); if (G.ais.length > 2) engAiEnd(G.ais.shift()); P.retUntil = time + 0.6; }
    if (engHas('b_r2')) { const n = engDone('b_r2') ? 5 : 3, base = ang + Math.PI; for (let i = 0; i < n; i++) engShot(fx, fy - 9, base + (i - (n - 1) / 2) * 0.22, G.cls === 'gunner' ? 1.0 : 0.5, '#9fd2ff'); }
  }
  function engOnBlinkEnd(fx, fy) {
    if (!engHas('r_m2')) return; const P = G.player, L = Math.hypot(P.x - fx, P.y - fy) || 1, ux = (P.x - fx) / L, uy = (P.y - fy) / L;
    for (const e of G.enemies) { if (e.dead || isDummy(e) && false) continue; const dx = e.x - fx, dy = e.y - fy, al = dx * ux + dy * uy, pp = Math.abs(dx * uy - dy * ux); if (al < -6 || al > L + 6 || pp > e.r + 12) continue;
      if (e.brand > 0) brandBurst(e); if (engDone('r_m2')) { e.brand = Math.min(3, (e.brand || 0) + 1); e.brandT = time; } }
  }
  function engTryReturn() { // 되돌아가기: 점멸 직후 한 번 더
    const P = G.player; if (!engHas('b_m3') || !(P.retUntil > time) || !G.ais.length) return false;
    const ai = G.ais.pop(), fx = P.x, fy = P.y; P.retUntil = 0;
    G.fx.push({ kind: 'streak', x0: fx, y0: fy - 10, x1: ai.x, y1: ai.y - 10, t: 0.2, max: 0.2 }); blinkBurst(fx, fy - 10); P.x = ai.x; P.y = ai.y; blinkBurst(P.x, P.y - 10); sfx('dodge', 1.3); P.iframe = Math.max(P.iframe || 0, 0.15);
    if (engDone('b_m3')) { const L = Math.hypot(P.x - fx, P.y - fy) || 1, ux = (P.x - fx) / L, uy = (P.y - fy) / L; for (const e of G.enemies) { if (e.dead) continue; const dx = e.x - fx, dy = e.y - fy, al = dx * ux + dy * uy, pp = Math.abs(dx * uy - dy * ux); if (al > -6 && al < L + 6 && pp < e.r + 12) damageEnemy(e, 0.8, { proc: true, ang: Math.atan2(uy, ux), kb: 80, gauge: 1 }); } }
    return true;
  }
  function engOnSwing(ang) { // 근딜이 공격을 시작할 때
    if (!G.eng) return; const P = G.player; P.t0Swing = time;
    if (engHas('h_m2') && P.hope > 0 && time - (P.hurtAt || -9) < 1) { P.hsN = P.hope; P.hope = 0; P.hsUntil = time + 0.45; G.nums.push({ x: P.x, y: P.y - 40, v: '반격!', t: 0.7, c: '#6ad84a', s: 1, txt: true }); sfx('grogi', 1.9); // v2.47 반격의 빛
      if (engDone('h_m2')) { G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 8, grow: 160, t: 0.3, max: 0.3, c: '#6ad84a' }); for (const e of nearFoes(P.x, P.y, 64)) { e.hsAt = P.hsUntil; damageEnemy(e, 0.3 * P.hsN, { proc: true, ang: angTo(P, e), kb: 120, gauge: 1 }); } } }
    if (engHas('h_m3') && P.emberT > time) { const ux = Math.cos(ang), uy = Math.sin(ang); // 마지막 불씨: 빛 칼날
      G.fx.push({ kind: 'tracer', x0: P.x + ux * 20, y0: P.y - 9 + uy * 20, x1: P.x + ux * 110, y1: P.y - 9 + uy * 110, w: 5, t: 0.16, max: 0.16, c: '140,230,110' });
      for (const e of G.enemies) { if (e.dead) continue; const dx = e.x - P.x, dy = e.y - 8 - (P.y - 9), al = dx * ux + dy * uy, pp = Math.abs(dx * uy - dy * ux); if (al > 16 && al < 114 && pp < e.r + 14) damageEnemy(e, 0.6, { proc: true, ang, kb: 70, gauge: 0.5 }); } }
    if (engHas('b_m1')) for (const ai of G.ais) { const c = engDone('b_m1') ? 1 : 0.5; G.fx.push({ kind: 'ring', x: ai.x + Math.cos(ang) * 22, y: ai.y - 8 + Math.sin(ang) * 14, r: 6, grow: 70, t: 0.18, max: 0.18, c: '#9fd2ff' });
      for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - ai.x, e.y - ai.y) < 52 + e.r && Math.abs(angDiff(Math.atan2(e.y - ai.y, e.x - ai.x), ang)) < 1.3) damageEnemy(e, 0.9 * c, { proc: true, ang, kb: 60, gauge: 0.5 }); }
    if (engHas('g_m2') && P.lArm > 0) { P.lArm--; const ux = Math.cos(ang), uy = Math.sin(ang);
      G.fx.push({ kind: 'tracer', x0: P.x + ux * 20, y0: P.y - 9 + uy * 20, x1: P.x + ux * 104, y1: P.y - 9 + uy * 104, w: 4, t: 0.16, max: 0.16, c: '140,230,110' });
      for (const e of G.enemies) { if (e.dead) continue; const dx = e.x - P.x, dy = e.y - 8 - (P.y - 9), al = dx * ux + dy * uy, pp = Math.abs(dx * uy - dy * ux); if (al > 16 && al < 108 && pp < e.r + 14) damageEnemy(e, 0.7, { proc: true, ang, kb: 70, gauge: 0.5 }); } }
    if (engHas('g_m1')) { const R = G.dun && G.dun.cur; // 바닥 조각을 쳐서 날림
      for (const l of G.loot) { if (l.type !== 'hue' || l.life <= 0 || l.z > 2) continue; const d = Math.hypot(l.x - P.x, l.y - P.y); if (d > 64 || Math.abs(angDiff(Math.atan2(l.y - P.y, l.x - P.x), ang)) > 1.4) continue;
        l.life = -1; let T = null, bd = 280; for (const e of G.enemies) if (!e.dead && !isDummy(e)) { const dd = dist(e, l); if (dd < bd) { bd = dd; T = e; } }
        const a = T ? Math.atan2(T.y - 8 - l.y, T.x - l.x) : ang; engShot(l.x, l.y - 6, a, 0.8, HUES[l.hue || 'r'].c, { sp: 460, t: 0.7, pierce: engDone('g_m1') ? 2 : 0, shard: l.hue || 'r' }); sfx('blip', 1.6); } }
  }
  function engOnPickup(l) {
    if (!G.eng) return; const P = G.player;
    if (engHas('g_m2')) P.lArm = Math.min(engDone('g_m2') ? 5 : 3, (P.lArm || 0) + 1);
    if (engHas('g_r2')) P.gAmmo = Math.min(3, (P.gAmmo || 0) + 1);
    if (engHas('g_m3') || engHas('g_r3')) { P.pkT = (P.pkT || []).filter(t => time - t < 3); P.pkT.push(time);
      if (P.pkT.length >= 3) { P.pkT = []; G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 6, grow: 200, t: 0.35, max: 0.35, c: '#6ad84a' }); flashT = 0.06; flashColor = '#e0ffc8'; sfx('grogi', 1.8);
        if (engHas('g_m3')) { P.inv = Math.max(P.inv || 0, 0.5); for (const e of nearFoes(P.x, P.y, 90)) { const a = angTo(P, e); e.vx += Math.cos(a) * 260; e.vy += Math.sin(a) * 260; if (engDone('g_m3')) damageEnemy(e, 1.0, { proc: true, ang: a, kb: 0, gauge: 1 }); } }
        if (engHas('g_r3')) { P.pierceT = time + (engDone('g_r3') ? 4 : 2); G.nums.push({ x: P.x, y: P.y - 40, v: '관통!', t: 0.8, c: '#6ad84a', s: 1, txt: true }); } } }
  }
  const engNoMagnet = () => !!(G.eng && (engHas('g_m1') || engHas('g_r1')) && !(G.rs && G.rs.state === 'done'));
  function engRichMul(e) { return engHas('g_m4') && e.richT > time ? 2 : 1; }
  function engRefract(x0, y0, x1, y1, ang, coef0) { // 굴절: 탄이 지나간 길 위의 바닥 조각
    if (!engHas('g_r1')) return; const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    for (const l of G.loot) { if (l.type !== 'hue' || l.refr || l.life <= 0) continue; const dx = l.x - x0, dy = l.y - 6 - y0, al = dx * ux + dy * uy, pp = Math.abs(dx * uy - dy * ux); if (al < 0 || al > L || pp > 12) continue;
      l.refr = true; const n = engDone('g_r1') ? 5 : 3; for (let i = 0; i < n; i++) engShot(l.x, l.y - 6, ang + (i - (n - 1) / 2) * 0.35, coef0 * 0.5, HUES[l.hue || 'r'].c, { t: 0.55 });
      G.fx.push({ kind: 'ring', x: l.x, y: l.y - 6, r: 3, grow: 60, t: 0.18, max: 0.18, c: HUES[l.hue || 'r'].c }); sfx('blip', 1.8); }
  }
  // 미끼 잔상: 일반 몬스터가 잔상을 노리게 (그 적이 움직이는 동안만 잔상 자리를 플레이어로 봄 · 그동안 플레이어는 맞지 않음)
  function engDecoyUpd(e, dt) {
    const ai = engHas('b_m2') && G.ais.length ? G.ais[G.ais.length - 1] : null;
    if (!ai || e.type === 'boss' || isElite(e) || isSemi(e) || INV_MAP[e.type] || Math.hypot(e.x - ai.x, e.y - ai.y) > 150) { updateEnemy(e, dt); return; }
    const P = G.player, px = P.x, py = P.y; e.lureT = time + 0.5; P.x = ai.x; P.y = ai.y; G.decoyUpd = true;
    try { updateEnemy(e, dt); } finally { G.decoyUpd = false; P.x = px; P.y = py; }
  }
  function engAiEnd(ai) {
    if (!engHas('b_m4')) return;
    G.fx.push({ kind: 'ring', x: ai.x, y: ai.y - 6, r: 6, grow: 150, t: 0.3, max: 0.3, c: '#7ac0ff' }); sfx('dodge', 0.7);
    for (const e of nearFoes(ai.x, ai.y, 72)) { const a = Math.atan2(e.y - ai.y, e.x - ai.x); if (e.type !== 'boss') { e.vx += Math.cos(a) * 240; e.vy += Math.sin(a) * 240; } damageEnemy(e, 0.25, { proc: true, ang: a, kb: 0, gauge: 0.3 }); }
    if (engDone('b_m4')) G.eproj = G.eproj.filter(pr => Math.hypot(pr.x - ai.x, pr.y - ai.y) > 72);
  }
  const segD = (px, py, x0, y0, x1, y1) => { const vx = x1 - x0, vy = y1 - y0, L2 = vx * vx + vy * vy || 1, k = clamp(((px - x0) * vx + (py - y0) * vy) / L2, 0, 1); return Math.hypot(px - x0 - vx * k, py - y0 - vy * k); };
  function engEproj(pr) { // 적 투사체 한 발마다: 물결 장막 · 붉은 표적판. true면 지움
    const P = G.player;
    if (engHas('b_r5') && G.ais.length) { const ai = G.ais[G.ais.length - 1]; if (segD(pr.x, pr.y, P.x, P.y - 6, ai.x, ai.y - 6) < 8) { burst(pr.x, pr.y - 10, '#9fd2ff', 5);
      if (engDone('b_r5') && (G.engBlk = (G.engBlk || 0) + 1) % 3 === 0) { const T = G.enemies.filter(e => !e.dead && !isDummy(e)).sort((a, b) => dist(a, P) - dist(b, P))[0]; if (T) engShot(P.x, P.y - 9, Math.atan2(T.y - 8 - P.y + 9, T.x - P.x), G.cls === 'gunner' ? 1.2 : 0.6, '#9fd2ff'); }
      return true; } }
    if (engHas('r_r4')) { const need = engDone('r_r4') ? 2 : 3; pr.age = (pr.age || 0) + 1; if (pr.age > 6) for (const e of G.enemies) if (!e.dead && e.brand >= need && Math.hypot(pr.x - e.x, pr.y - (e.y - 8)) < (pr.r || 3) + e.r) { damageEnemy(e, 0.9, { proc: true, ang: pr.ang, kb: 60, gauge: 0.5 }); burst(pr.x, pr.y - 10, '#ff5a3a', 6); return true; } }
    return false;
  }
  function engTeleFired(t) { // 적의 공격 예고가 터질 때: 붉은 표적판
    if (!engHas('r_r4') || !t.owner || t.owner === G.player || t.shape === 'spawn') return; const need = engDone('r_r4') ? 2 : 3;
    for (const e of G.enemies) if (!e.dead && e !== t.owner && e.brand >= need && inShape(t, e.x, e.y, e.r)) damageEnemy(e, 1.0, { proc: true, ang: -Math.PI / 2, kb: 60, gauge: 0.5 });
  }
  // ---------------------------------------------------------------- 매 프레임
  function engTick(dt) {
    if (!G.eng) return; const P = G.player;
    for (const e of G.enemies) if (e.brand > 0 && (e.dead || time - e.brandT > 5)) e.brand = 0;
    if (P.hope > 0 && P.hopeT < time) P.hope = 0; // v2.47 희망은 6초 유지
    if (engHas('h_m5') && (engDone('h_m5') || hopeLow()) && !P.dead) { G.sunT = (G.sunT || 0) - dt; if (G.sunT <= 0) { G.sunT = 0.5; G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 6, grow: 110, t: 0.3, max: 0.3, c: '#6ad84a' }); for (const e of nearFoes(P.x, P.y, 60)) damageEnemy(e, 0.2, { proc: true, ang: angTo(P, e), kb: 30, gauge: 0.3 }); } }
    if (engHas('r_r5')) { let best = null, bd = 0.14; for (const e of G.enemies) { if (e.dead || !(e.brand >= 3)) continue; const dd = Math.abs(angDiff(Math.atan2(e.y - 8 - (P.y - 9), e.x - P.x), P.ang)); if (dd < bd && dist(e, P) < 420) { bd = dd; best = e; } } G.engFoc = best; }
    for (const ai of G.ais) ai.t -= dt; for (const ai of G.ais) if (ai.t <= 0) engAiEnd(ai); G.ais = G.ais.filter(ai => ai.t > 0);
    for (const z of G.engZ) z.t -= dt; G.engZ = G.engZ.filter(z => z.t > 0);
    if (engHas('g_r5')) for (const l of G.loot) if (l.type === 'hue' && !l.zone && l.life > 0) { l.zone = true; G.engZ.push({ k: 'gold', x: l.x, y: l.y, r: 36, t: engDone('g_r5') ? 3 : 1.5, max: engDone('g_r5') ? 3 : 1.5 }); }
    if (engHas('b_r3')) for (const ai of G.ais) for (const e of G.enemies) { if (e.dead || e.type === 'boss') continue; const dx = e.x - ai.x, dy = e.y - ai.y, d = Math.hypot(dx, dy), m = e.r + 12; if (d < m && d > 0.01) { e.x = ai.x + dx / d * m; e.y = ai.y + dy / d * m; if (engDone('b_r3') && !ai.hitE.has(e)) { ai.hitE.add(e); applySt(e, 'stun', 0.5); } } }
    if (engHas('b_m5')) { G.lineT = (G.lineT || 0) - dt; if (G.lineT <= 0) { G.lineT = 0.4; const segs = []; if (G.ais.length >= 2) segs.push([G.ais[0], G.ais[1]]); if (engDone('b_m5') && G.ais.length) segs.push([P, G.ais[G.ais.length - 1]]);
      for (const [a, b] of segs) for (const e of G.enemies) if (!e.dead && segD(e.x, e.y, a.x, a.y, b.x, b.y) < e.r + 8) damageEnemy(e, 0.3, { proc: true, ang: angTo(a, e), kb: 20, gauge: 0.3 }); } }
    // 등불
    const nL = engHas('g_m5') ? (engDone('g_m5') ? 2 : 1) : 0; while (G.lant.length < nL) G.lant.push({ x: P.x, y: P.y - 20, tgt: null, hitC: new Map() }); if (G.lant.length > nL) G.lant.length = nL;
    G.lant.forEach((L, i) => { if (L.tgt && (L.tgt.life <= 0 || !G.loot.includes(L.tgt))) L.tgt = null;
      if (!L.tgt) { let bd = 240; for (const l of G.loot) if (l.type === 'hue' && l.life > 0 && !G.lant.some(o => o !== L && o.tgt === l)) { const d = Math.hypot(l.x - P.x, l.y - P.y); if (d < bd) { bd = d; L.tgt = l; } } }
      const tx = L.tgt ? L.tgt.x : P.x + (i ? 18 : -18), ty = L.tgt ? L.tgt.y - 6 : P.y - 26, d = Math.hypot(tx - L.x, ty - L.y), sp = L.tgt ? 230 : 140;
      if (d > 1) { const k = Math.min(1, sp * dt / d); L.x += (tx - L.x) * k; L.y += (ty - L.y) * k; }
      if (L.tgt && d < 8) { collectLoot(L.tgt); L.tgt.life = -1; L.tgt = null; }
      for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - L.x, e.y - 8 - L.y) < e.r + 6 && !((L.hitC.get(e) || 0) > time)) { L.hitC.set(e, time + 0.5); damageEnemy(e, 0.18, { proc: true, ang: 0, kb: 10, gauge: 0.2 }); } });
    // 각인 탄
    for (const s of G.engS) { const ox = s.x, oy = s.y; s.x += Math.cos(s.ang) * s.sp * dt; s.y += Math.sin(s.ang) * s.sp * dt; s.t -= dt;
      for (const e of G.enemies) { if (e.dead || s.hit.has(e) || Math.hypot(e.x - s.x, e.y - 8 - s.y) > e.r + 5 + RANGED_HB) continue; s.hit.add(e); damageEnemy(e, s.coef, { proc: true, ang: s.ang, kb: 40, gauge: 0.5 }); burst(s.x, s.y, s.c, 5); if (s.pierce > 0) s.pierce--; else { s.t = 0; break; } }
      if (s.t > 0 && (s.x < A.x0 || s.x > A.x1 || s.y < A.y0 - 20 || s.y > A.y1 || segSolid(ox, oy + 8, s.x, s.y + 8))) s.t = 0;
      if (s.back && Math.hypot(P.x - s.x, P.y - 9 - s.y) < 10) s.t = 0;
      if (s.t <= 0 && s.shard) { hueGain(s.shard, 1); G.fx.push({ kind: 'streak', x0: s.x, y0: s.y, x1: P.x, y1: P.y - 10, t: 0.15, max: 0.15 }); sfx('coin', 1.8); } }
    G.engS = G.engS.filter(s => s.t > 0);
  }
  // ---------------------------------------------------------------- 그리기 (월드 좌표, 맨 위)
  function engDraw() {
    if (!G || !G.eng) return; const P = G.player;
    if (P.hope > 0 && !P.dead) { for (let i = 0; i < P.hope; i++) { const x = Math.round(P.x - 6 + i * 6) & ~1, y = Math.round(P.y - 40 + Math.sin(time * 6 + i) * 1.5) & ~1; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 1, y - 1, 4, 4); ctx.fillStyle = Math.floor(time * 6) % 2 ? '#6ad84a' : '#e0ffc8'; ctx.fillRect(x, y, 2, 2); } } // v2.47 희망 겹
    if (P.emberT > time && !P.dead) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(110,220,90,${0.18 + 0.08 * Math.sin(time * 14)})`; ctx.beginPath(); ctx.ellipse(P.x, P.y - 8, 16, 20, 0, 0, TAU); ctx.fill(); ctx.restore(); if (Math.random() < 0.5) G.parts.push({ x: P.x + rand(-8, 8), y: P.y - rand(4, 24), vx: 0, vy: -rand(20, 40), t: 0.4, c: '#6ad84a', g: 0, glow: true }); }
    // 바닥: 피의 고리 · 초록빛 과녁
    for (const z of G.engZ) { const a = Math.min(1, z.t / 0.4), n = Math.round(z.r * 1.2), col = z.k === 'ring' ? `rgba(255,60,40,${0.75 * a})` : `rgba(106,216,74,${0.8 * a})`; ctx.fillStyle = col;
      const rot = time * (z.k === 'ring' ? 0.6 : -0.9); for (let i = 0; i < n; i++) { if (i % 4 === 3) continue; const t = i / n * TAU + rot; ctx.fillRect(Math.round(z.x + Math.cos(t) * z.r) & ~1, Math.round(z.y + Math.sin(t) * z.r * 0.6) & ~1, 2, 2); }
      if (z.k === 'gold') { ctx.fillRect((z.x - 1) & ~1, (z.y - 7) & ~1, 2, 4); ctx.fillRect((z.x - 1) & ~1, (z.y + 3) & ~1, 2, 4); ctx.fillRect((z.x - 9) & ~1, (z.y - 1) & ~1, 4, 2); ctx.fillRect((z.x + 5) & ~1, (z.y - 1) & ~1, 4, 2); } }
    // 잔상
    for (const ai of G.ais) { const a = Math.min(1, ai.t / 0.4) * (0.5 + 0.15 * Math.sin(time * 12)); drawSprite(CL().map, CL().ghostPal, 2, ai.x, ai.y + 2, ai.face < 0, { alpha: a }); }
    const segLine = (x0, y0, x1, y1, col) => { const L = Math.hypot(x1 - x0, y1 - y0); ctx.fillStyle = col; for (let k = 0; k < L; k += 2) { if (((k >> 1) + Math.floor(time * 20)) % 3 === 0) continue; ctx.fillRect(Math.round(x0 + (x1 - x0) * k / L) & ~1, Math.round(y0 + (y1 - y0) * k / L) & ~1, 2, 2); } };
    if (engHas('b_m5') && G.ais.length >= 2) segLine(G.ais[0].x, G.ais[0].y - 8, G.ais[1].x, G.ais[1].y - 8, 'rgba(120,190,255,.85)');
    if (engDone('b_m5') && G.ais.length) { const ai = G.ais[G.ais.length - 1]; segLine(P.x, P.y - 8, ai.x, ai.y - 8, 'rgba(120,190,255,.6)'); }
    if (engHas('b_r5') && G.ais.length) { const ai = G.ais[G.ais.length - 1]; segLine(P.x, P.y - 8, ai.x, ai.y - 8, 'rgba(180,225,255,.75)'); segLine(P.x, P.y - 12, ai.x, ai.y - 12, 'rgba(120,190,255,.45)'); }
    // 낙인 · 붉은 사슬 · 집중 표적
    const br = G.enemies.filter(e => !e.dead && e.brand > 0);
    if (engHas('r_m3')) for (let i = 0; i < br.length; i++) for (let j = i + 1; j < br.length; j++) if (dist(br[i], br[j]) < 220) segLine(br[i].x, br[i].y - 14, br[j].x, br[j].y - 14, 'rgba(200,30,30,.55)');
    for (const e of br) { // v2.55 몸에 찍히는 낙인: 1중첩 십자 · 2중첩 둘레 고리 · 3중첩 가시 (칸 단위, 막 찍히면 하얗게)
      const top = (e.tall || (e.type === 'boss' ? 62 : isElite(e) ? 52 : 36)) + 10, fl = time - e.brandT < 0.15, ph = e.brand >= 3 ? Math.floor(time * 6 + e.x) % 2 : 0;
      const c = art(`brandMk${e.brand}${fl ? 'f' : ph}`, () => brandMark(e.brand, fl, ph));
      ctx.drawImage(c, (Math.round(e.x - c.width / 2)) & ~1, (Math.round(e.y - top * 0.5 - c.height / 2)) & ~1);
      if (e.brand >= 3 && Math.random() < 0.12) G.parts.push({ x: e.x + rand(-6, 6), y: e.y - top * 0.5, vx: rand(-6, 6), vy: -rand(18, 36), t: rand(0.3, 0.6), c: pick(['#ff3a2a', '#ff8a40', '#ffd0a0']), g: 0, glow: true }); }
    if (engHas('r_r5')) { const t = G.engFoc; if (t && !t.dead && engFocus(t)) { const r = 14 + (Math.floor(time * 8) % 2) * 2; ctx.fillStyle = '#ff3a2a'; for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x = Math.round(t.x + dx * r) & ~1, y = Math.round(t.y - 10 + dy * r * 0.7) & ~1; ctx.fillRect(x - (dx > 0 ? 4 : 0), y, 6, 2); ctx.fillRect(x, y - (dy > 0 ? 4 : 0), 2, 6); } } }
    // 등불
    for (const L of G.lant) { const x = Math.round(L.x) & ~1, y = Math.round(L.y + Math.sin(time * 4) * 2) & ~1; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 4, y - 6, 8, 12); ctx.fillStyle = '#a07820'; ctx.fillRect(x - 2, y - 6, 4, 2); ctx.fillStyle = Math.floor(time * 10) % 4 ? '#6ad84a' : '#e0ffc8'; ctx.fillRect(x - 2, y - 4, 4, 6); ctx.fillStyle = '#a07820'; ctx.fillRect(x - 2, y + 2, 4, 2); }
    // 각인 탄
    for (const s of G.engS) { const x = Math.round(s.x) & ~1, y = Math.round(s.y) & ~1; ctx.fillStyle = s.c; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillRect((Math.round(s.x - Math.cos(s.ang) * 5)) & ~1, (Math.round(s.y - Math.sin(s.ang) * 5)) & ~1, 2, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y - 2, 2, 2); }
    // 빛 갑옷 · 초록빛 탄 표시 (발밑 점)
    const pips = (P.lArm || 0) + (engHas('g_r2') ? (P.gAmmo || 0) : 0); if (pips && !P.dead) { ctx.fillStyle = '#6ad84a'; for (let i = 0; i < pips; i++) { const t = i / pips * TAU + time * 2; ctx.fillRect(Math.round(P.x + Math.cos(t) * 13) & ~1, Math.round(P.y - 10 + Math.sin(t) * 7) & ~1, 2, 2); } }
  }
  function engTip(c) { // 팔레트 툴팁: 고른 각인
    if (!G.eng || !G.eng[c].length) return `<span style='color:#6a6474'>빛의 샘에서 이 빛을 바쳐 각인을 얻습니다.</span>`; // v3.25
    return G.eng[c].map(k => `<span style='color:${HUES[c].c}'><img src='${engIcon(k, G.engC.has(k))}' style='width:18px;height:18px;image-rendering:pixelated;vertical-align:-4px'> ${ENG[k].n}${G.engC.has(k) ? ' (완성)' : ''}</span>`).join('<br>');
  }
  // ================================================================ v2.34 색 되찾기 (문서: 색되찾기_설계) — 1단계: 잿빛 방 · 색 조각 · 색 물결 · 단계 효과 1~3
  const HUES = { r: { n: '분노의 빛', c: '#ff5a4a', rgb: '255,90,74' }, b: { n: '평온의 빛', c: '#5aa8ff', rgb: '90,168,255' }, g: { n: '희망의 빛', c: '#6ad84a', rgb: '106,216,74' } };
  const HUE_TIER = [10, 25, 45], HUE_GRAY = 0.6; // 단계 기준(이번 토벌에 모은 빛 · 성난 심지 · 해금 조건) · 잿빛 방은 v3.25부터 쓰지 않음
  const BOSS_HUE = { 1: 'b', 2: 'r', 3: 'g', 4: 'r' };
  const hueTier = c => { const n = (G && G.palTot && G.palTot[c]) || 0; /* v3.25 빛을 재화로 쓰므로 단계는 모은 개수(쓴 것 포함)로 */ return n >= HUE_TIER[2] ? 3 : n >= HUE_TIER[1] ? 2 : n >= HUE_TIER[0] ? 1 : 0; };
  const grayRoom = R => false && !!(R && R.hue /* v3.25 잿빛 방 없앰 — 방은 늘 제 색 (사용자 결정) */ && !R.painted && ['combat', 'elite', 'survive'].includes(R.type) /* v2.46 보스방은 처음부터 색이 켜져 있음 */ && (!R.cleared || (G.paintW && G.paintW.R === R)));
  for (const c in HUES) { const H = { r: ['#ff4a4a', '#a01828', '#ffd0c8'], b: ['#5aa8ff', '#1e4a9a', '#d8ecff'], g: ['#6ad84a', '#2e7a1a', '#e0ffc8'] }[c];
    MAPS['hue_' + c] = ['....k....', '...kWk...', '..kWHHk..', '.kWHHHMk.', 'kWHHHHMMk', '.kHHHMMk.', '..kHMMk..', '...kMk...', '....k....']; PAL['hue_' + c] = { k: '#0b0a0e', W: H[2], H: H[0], M: H[1] }; }
  const hueGold = () => 1, hueChest = () => 0; // v2.41 빛의 각인으로 대체
  function hueDrop(e) { // 몬스터 처치 시 확률로 색 조각
    const R = G.dun && G.dun.cur; if (!R || !R.hue || R.type === 'boss' || isDummy(e)) return; // v2.46 보스방에선 빛 조각이 떨어지지 않음
    const n = e.type === 'boss' ? 0 : isElite(e) ? randi(2, 3) : isSemi(e) ? engRichMul(e) : Math.random() < 0.2 * engRichMul(e) ? 1 : 0; // v3.25 빛을 재화로 — 약 3배 (일반 20% · 준엘리트 1 · 정예 2~3)
    for (let i = 0; i < n * (G.player.counterT > 0 ? 2 : 1); i++) { const c = Math.random() < 0.7 ? R.hue : pick(['r', 'b', 'g']), l0 = G.loot.length; spawnLoot('hue', e.x, e.y); if (G.loot[l0]) G.loot[l0].hue = c; }
  }
  function hueGain(c, n) {
    if (!G.palTot) G.palTot = { r: 0, b: 0, g: 0 }; const t0 = hueTier(c); G.pal[c] = (G.pal[c] || 0) + n; G.palTot[c] = (G.palTot[c] || 0) + n; const t1 = hueTier(c); { const w = eqWeapon(G.cls); if (w && w.grade === 'rby' && t1 === t0) G.stats = calcStats(G.buffs); } // v2.40 RGB?
    if (t1 > t0) { const P = G.player, hp0 = G.stats.hp; G.stats = calcStats(G.buffs); P.hp = clamp(P.hp + Math.max(0, G.stats.hp - hp0), 0, G.stats.hp); } // v3.25 단계마다 각인 고르기 없앰 — 빛의 샘에서 빛을 바쳐 얻음
    if (hueTier('r') >= 2 && hueTier('b') >= 2 && hueTier('g') >= 2) recOnce('u_prism'); if (hueTier('r') >= 3) recOnce('u_wick'); if (hueTier('g') >= 3) recOnce('u_lant'); // v2.36
    renderPal();
  }
  const HUE_D = { r: ['공격력이 5% 증가합니다.', '치명타 확률이 5% 증가합니다.', '적을 처치하면 그 자리에 작은 불꽃 폭발이 일어납니다.'], b: ['이동 속도가 5% 증가합니다.', '점멸 충전 속도가 15% 증가합니다.', '점멸한 직후 0.8초 동안 이동 속도가 40% 증가합니다.'], g: ['얻는 골드가 15% 증가합니다.', '상자에서 유물이 나올 확률이 5% 증가합니다.', '적을 처치하면 2% 확률로 하트 반 칸을 회복합니다.'] };
  const HUE_SH = { r: ['#ffb0a0', '#c02a2a'], b: ['#cfe6ff', '#2a5aa8'], g: ['#fff2b0', '#a8781a'] }, HUE_URL = {};
  const hueURL = c => HUE_URL[c] || (HUE_URL[c] = sprite('hue_' + c, 'hue_' + c, 1).toDataURL());
  let palPrev = null;
  let EVO_A = null, EVO_B = null;
  function drawEvOutline() { // v2.35 직업 회피 발동: 캐릭터 도트 모양 그대로 밝은 외곽선이 깜빡임
    const P = G.player; if (!P || P.dead || !(P.evOutT > 0)) return;
    P.evOutT -= 1 / 60; if (Math.floor(P.evOutT * 20) % 2 === 1) return;
    const WT = ctx.getTransform();
    if (!EVO_A) { EVO_A = document.createElement('canvas'); EVO_B = document.createElement('canvas'); }
    if (EVO_A.width !== cv.width || EVO_A.height !== cv.height) for (const c of [EVO_A, EVO_B]) { c.width = cv.width; c.height = cv.height; }
    const a = EVO_A.getContext('2d'), b = EVO_B.getContext('2d'), PB = 72, s = Math.round(WT.a * 2) || 2;
    const bx = Math.max(0, Math.floor(WT.a * P.x + WT.e - PB)), by = Math.max(0, Math.floor(WT.d * (P.y - 16) + WT.f - PB)), bw = Math.min(cv.width - bx, PB * 2), bh = Math.min(cv.height - by, PB * 2); if (bw <= 0 || bh <= 0) return;
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1; a.clearRect(bx, by, bw, bh); a.setTransform(WT);
    const main = ctx, wt0 = WTEXT.length, np = G.parts.length;
    try { ctx = a; drawPlayer(); } finally { ctx = main; WTEXT.length = wt0; G.parts.length = Math.min(G.parts.length, np); }
    a.setTransform(1, 0, 0, 1, 0, 0);
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; b.clearRect(bx, by, bw, bh);
    for (const [dx, dy] of [[s, 0], [-s, 0], [0, s], [0, -s]]) b.drawImage(EVO_A, bx, by, bw, bh, bx + dx, by + dy, bw, bh);
    b.globalCompositeOperation = 'destination-out'; b.drawImage(EVO_A, bx, by, bw, bh, bx, by, bw, bh);
    b.globalCompositeOperation = 'source-in'; b.fillStyle = G.cls === 'priest' ? '#fff0b0' : G.cls === 'mage' ? '#d8c8ff' : '#e8f6ff'; b.fillRect(bx, by, bw, bh); b.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.95; ctx.drawImage(EVO_B, bx, by, bw, bh, bx, by, bw, bh); ctx.restore();
  }
  function renderPal() { // v2.35 캐릭터 패널 아래 · v2.51 그래프 없이 이름과 개수만 한 줄
    const el = $('p1pal'); if (!el || !G || !G.pal) return;
    const up = palPrev ? Object.keys(HUES).filter(c => hueTier(c) > palPrev[c]) : []; palPrev = {}; for (const c in HUES) palPrev[c] = hueTier(c);
    el.innerHTML = Object.keys(HUES).map(c => { const n = G.pal[c] || 0, t = hueTier(c), H = HUES[c], S = HUE_SH[c];
      return `<div class="palRow${up.includes(c) ? ' up' : ''}" style="--hc:${H.c};--hl:${S[0]};--hd:${S[1]};--c:${H.c}" data-name="${H.n} · ${n}개" data-tip="${engTip(c)}"><img class="gem" src="${hueURL(c)}" alt=""><span class="pv">${n}</span></div>`; }).join('');
  }

  function startPaint(R, x, y) { // 방을 비우면 빛 조각 — v3.25 색 물결 · 채도 연출 · 효과음 없앰 (사용자 결정), 조각 2개
    if (!R || !R.hue || R.painted) return; R.painted = true;
    for (let i = 0, m = 2 + (hasRelic('brush') ? 1 : 0); i < m; i++) { const l0 = G.loot.length; spawnLoot('hue', x, y); if (G.loot[l0]) G.loot[l0].hue = R.hue; }
    const D = G.dun; if (D && !D.allPainted && D.rooms.filter(r => r.hue && r.type !== 'boss').every(r => r.painted)) { D.allPainted = true; rec('paintall'); lootFeed('<b style="color:#ffd34d">이 챕터의 격전지를 모두 정리했습니다</b>', '#ffd34d', 3500); }
  }
  function killEnemy(e, silent) {
    e.dead = true; cancelTele(e);
    if (INV_LINES[e.type] && !isDummy(e)) { e.say = null; (G.deadSays = G.deadSays || []).push({ text: INV_LINES[e.type].last && !(e.bro && !e.bro.dead) ? INV_LINES[e.type].last : INV_LINES[e.type].out, x: e.x, y: e.y - 34, until: time + 3.6 }); } // 난입자 처치 대사
    if (e.ash === 'husk') { (G.ashClouds = G.ashClouds || []).push({ x: e.x, y: e.y, r: 30, t: 1.6, max: 1.6 }); } // v1.24 재 망자는 부서지며 재 구름
    // v2.23 근접 처치 회복 삭제 (사용자 결정)
    const big = e.type === 'boss' ? 3 : isElite(e) ? 2 : 1;
    for (let i = 0; i < 16 * big; i++) G.parts.push({ x: e.x + rand(-6, 6) * big, y: e.y - rand(0, 26) * big, vx: rand(-14, 14), vy: rand(-40, -10), t: rand(0.5, 1.1), c: pick(['#3a3540', '#5b5560', '#1e1b22', '#7a2a1c']), g: -10 });
    burst(e.x, e.y - 8, bloodOf(e), 8 * big);
    if (e.type !== 'ghost') splat(e.x, e.y, 18 * big, splatOf(e));
    if (e.type === 'bigslime' && !silent) for (const s of [-1, 1]) { const m = makeEnemy('slime', clamp(e.x + s * 12, A.x0 + 10, A.x1 - 10), e.y); m.vx = s * 120; m.cd = 0.8; m.rise = 0; G.enemies.push(m); }
    if (silent) return;
    G.kills++; G.lastKillAng = e.lastAng != null ? e.lastAng : angTo(G.player, e); // v3.25 마지막 적 화면 흔들림 방향
    gearOnKill(e);
    if (!isDummy(e) && isElite(e)) { rec('elite'); if (hasRelic('horn')) { G.hornT = time + 3; G.nums.push({ x: G.player.x, y: G.player.y - 34, v: '사냥꾼의 나팔', t: 0.7, c: '#f0e0b0', s: 1 }); } } // v2.29
    if (G.cls === 'knight' && G.player.counterT > 0 && !isDummy(e)) rec('k_counter');
    if (!isDummy(e)) rec('kill_' + G.cls); // v2.31 직업별 처치 (무기 해금)
    if (!silent || e.type === 'boss') hueDrop(e); // v2.34 색 조각
    if (!isDummy(e) && G.player.counterT > 0) { const P = G.player; P.cntKills = (P.cntKills || 0) + 1; if (P.cntKills >= 5) recOnce('u_duel'); if (hasRelic('duelband') && (P.cntExt || 0) < 1.2 - 1e-6) { const d = Math.min(0.3, 1.2 - (P.cntExt || 0)); P.cntExt = (P.cntExt || 0) + d; P.counterT += d; P.counterMax += d; } /* 역습 한 번에 최대 +1.2초 */ } // v2.36 결투자의 띠
    engOnKill(e); // v2.41 (색 3단계 고정 효과 제거)
    pasOnKill(e); // v2.22 보관 패시브
    if (hasRelic('pact') && G.player && !ultBusy(G.player)) G.player.gauge = Math.min(100, G.player.gauge + 10); // v2.19 피의 계약
    if (hasRelic('slimecore') && Math.random() < 0.1) { G.fx.push({ kind: 'ring', x: e.x, y: e.y - 8, r: 6, grow: 200, t: 0.35, max: 0.35, c: '#7ad050' }); for (let i = 0; i < 12; i++) { const a = rand(0, TAU), sp = rand(60, 140); G.parts.push({ x: e.x, y: e.y - 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 20, t: rand(0.3, 0.5), c: pick(['#7ad050', '#b8f070', '#3a7a2a']), g: 120 }); } sfx('blast', 1.3); for (const q of nearFoes(e.x, e.y, 56, e)) damageEnemy(q, 1.0, { proc: true, ang: angTo(e, q), kb: 140, grogi: 3, gauge: 1 }); } // v2.19 분열하는 점액 핵
    orcOnKill(e);
    sfx('kill'); sfx('crunch', rand(0.85, 1.15));
    // 쓰러진 적은 맞은 방향으로 튕겨 날아가며 사라진다
    if (e.type === 'ghoul' && e.sq) { G.fx.push({ kind: 'hollow', mp: ['squire', 'squireB', 'squireC'][e.sv || 0], x: e.x, y: e.y, face: e.face || 1, t: 2, max: 2 }); } // v1.52 투구가 떨어지고 속은 비어 있음
    else if (e.type !== 'boss' && e.type !== 'bigslime' && e.type !== 'bloat') {
      const ka = e.lastAng != null ? e.lastAng : angTo(G.player, e), el = isElite(e), sp = el ? rand(70, 100) : rand(170, 230);
      if (!G.corpses) G.corpses = [];
      const keep = !!INV_LINES[e.type]; // v2.38 난입자 시체는 남는다
      G.corpses.push({ e, keep, t: el ? 0.75 : 0.55, max: el ? 0.75 : 0.55, vx: Math.cos(ka) * sp, vy: Math.sin(ka) * sp * 0.6, z: 0, vz: el ? 120 : 170, rot: 0, vr: (Math.cos(ka) >= 0 ? 1 : -1) * (el ? 3 : rand(9, 13)), bounced: false });
      if (keep && G.dun && G.dun.cur) { const R = G.dun.cur; (R.keepC = R.keepC || []).push(G.corpses[G.corpses.length - 1]); }
    }
    // 웨이브의 마지막 한 마리: 짧은 슬로모션 마무리
    if (e.type !== 'boss' && !G.enemies.some(x => !x.dead && !isDummy(x)) && G.spawning <= 0 && !G.tele.some(t => t.shape === 'spawn')) {
      slowmo = Math.max(slowmo, 0.5); zoomK = Math.max(zoomK, 0.05); /* v1.08 역경직 제거 */
      flashT = Math.max(flashT, 0.06); flashColor = '#fff4e0'; sfx('finisher');
      G.fx.push({ kind: 'ring', x: e.x, y: e.y - 10, r: 8, t: 0.4, max: 0.4, c: '#fff0d0', grow: 420 });
    }
    const gold = e.type === 'boss' ? STG().bossGold : isElite(e) ? 40 : isSemi(e) ? randi(15, 20) : randi(3, 7);
    G.gold += Math.round(gold * ASCF.gold() * (hasRelic('greed') ? 1.5 : 1) * hueGold());
    if (e.type === 'bloat' && !e.exploded) {
      e.exploded = true; const ex = e.x, ey = e.y, dmg = e.atk * 0.8;
      G.tele.push({ shape: 'circle', x: ex, y: ey, r: 44, t: 0, dur: 0.45, owner: {}, heavy: true, onFire: tt => bloatBlast(ex, ey, tt.r, dmg) });
    }
    if (e.type !== 'boss' && e.type !== 'ghost') rollLoot(e);
    if (e.type !== 'boss' && Math.random() < (isElite(e) ? 1 : ascOn(4) ? 0.22 : 0.15)) { // v1.97 무리 보상
      G.iron += isElite(e) ? 3 : 1;
      G.nums.push({ x: e.x, y: e.y - 30, v: '1', t: 0.6, c: '#c9b07a', s: 1 });
    }
    if (e.type === 'boss') bossDefeated(e);
  }
;

// ==================================================================== 10_player.js
'use strict';
// 잿빛 왕관 토벌대 — 10_player.js : 플레이어 & 대검 콤보, 마법사·사제·거너, 대기 동작, 효과, 필드 드랍
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ---------------------------------------------------------------- 플레이어 & 대검 콤보
  // a0/a1: 조준 방향 기준 상대 각도(도). 바라보는 쪽에 따라 좌우 반전.
  const SWING = [
    { wind: 0.07, swing: 0.09, rec: 0.18, a0: -125, a1: 95, reach: 54, coef: 1.0, grogi: 4, kb: 60, gauge: 4, lunge: 80 },
    { wind: 0.06, swing: 0.09, rec: 0.18, a0: 105, a1: -115, reach: 54, coef: 1.1, grogi: 4, kb: 60, gauge: 4, lunge: 80 },
    { wind: 0.13, swing: 0.26, rec: 0.24, a0: -150, a1: 250, reach: 60, coef: 1.8, grogi: 12, kb: 190, gauge: 7, lunge: 40, heavy: true, stagger: 0.5 },
  ];
  // 레인저 쌍검: 짧고 빠르다. 1타 앞손, 2타 뒷손, 3타 양손 교차베기로 파고든다
  const SWING_R = [
    { wind: 0.03, swing: 0.07, rec: 0.11, a0: -115, a1: 80, reach: 42, coef: 0.72, grogi: 2, kb: 25, gauge: 3, lunge: 110 },
    { wind: 0.03, swing: 0.07, rec: 0.11, a0: 105, a1: -90, reach: 42, coef: 0.76, grogi: 2, kb: 25, gauge: 3, lunge: 110 },
    { wind: 0.06, swing: 0.1, rec: 0.2, a0: -150, a1: 150, reach: 46, coef: 1.3, grogi: 7, kb: 130, gauge: 5, lunge: 260, heavy: true, stagger: 0.35 },
  ];
  const SWING_CH = SWING.map((o, i) => i === 2 ? Object.assign({}, o, { reach: 112 }) : o); // v2.03 사슬 분절검
  const SWING_CL = SWING.map((o, i) => i === 2 ? Object.assign({}, o, { wind: 0.2, swing: 0.07, rec: 0.3, a0: -175, a1: 15, reach: 60, coef: 2.0, grogi: 14, kb: 100, lunge: 30, stagger: 0.6 }) : o); // v2.18 도살자의 식칼: 3타는 머리 위에서 내려찍기
  const SWING_WM = SWING.map((o, i) => i === 2 ? Object.assign({}, o, { a1: o.a1 + 360, swing: 0.44, kb: 340 }) : o); // v2.03 풍차 날개
  const SWING_RC = SWING_R.map(o => Object.assign({}, o, { wind: o.wind * 0.75, swing: o.swing * 0.8, rec: o.rec * 0.7 })); // v2.05 고양이 발톱
  const SWING_GT = SWING.map(o => Object.assign({}, o, { wind: o.wind * 1.4, swing: o.swing * 1.2, rec: o.rec * 1.3, reach: o.reach + 10, coef: o.coef * 1.25 })); // v3.42 철퇴: 30% 느리게 · 피해 25%↑ · 거리 +10
  const swingTable = () => (G && G.cls === 'ranger') ? (wSkill() === 'claw' ? SWING_RC : SWING_R) : (G && G.cls === 'priest') ? (wSkill() === 'whip' ? SWING_PW : SWING_P) : (G && G.cls === 'knight' ? ({ chain: SWING_CH, windmill: SWING_WM, cleaver: SWING_CL, gate: SWING_GT })[wSkill()] || SWING : SWING);
  const PIVOT_Y = 10;
  function updatePlayer(dt) {
    const P = G.player, s = G.stats;
    if (typeof HABIULT !== 'undefined') HABIULT.update(dt); if (typeof CASING !== 'undefined') CASING.update(dt); // v3.16 탄피
    for (const t of P.trail) t.t -= dt;
    P.trail = P.trail.filter(t => t.t > 0);
    for (const t of P.trail2) t.t -= dt;
    P.trail2 = P.trail2.filter(t => t.t > 0);
    if (P.dead) {
      P.deadT += dt;
      if (P.deadT > 2.0 && !P.deathHandled) { P.deathHandled = true; setTimeout(() => { P.deathHandled = false; afterDeath(); }, 10); }
      return;
    }
    if (P.grab) { P.hurtT = Math.max(0, P.hurtT - dt); updateGrabbed(P, dt); return; }
    P.inv = Math.max(0, P.inv - dt); P.hurtT = Math.max(0, P.hurtT - dt);
    P.iframe = Math.max(0, P.iframe - dt);
    P.awakenT = Math.max(0, P.awakenT - dt);
    if (P.stam < skMax('D')) { P.stamT += dt * s.stamRate; if (P.stamT >= 1.5) { P.stamT = 0; P.stam++; } }
    const charges = skMax('K');
    for (let i = 0; i < charges; i++) P.chargeCd[i] = Math.max(0, P.chargeCd[i] - dt);
    KRS.tick(dt); ARS.tick(dt); GRS.tick(dt); MRS.tick(dt); PRS.tick(dt); AWK.tick(dt); // v3.21 기사 무기별 우클릭 · 무기마다 따로 도는 쿨타임
    let mx = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0), my = (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0);
    if (TOUCH.on && TOUCH.mv && TOUCH.stick) { mx = TOUCH.mv.x; my = TOUCH.mv.y; } // v2.26 모바일 아날로그 스틱
    const ml = Math.hypot(mx, my); if (ml) { mx /= ml; my /= ml; }
    P.moving = ml > 0;
    { const held = mouse.down || mouse.rdown || Object.keys(keys).some(k => keys[k]); if (IDLE_PING || held || P.moving || P.state !== 'idle' || P.hurtT > 0) P.idleT = 0; else P.idleT = (P.idleT || 0) + dt; IDLE_PING = false; } // v2.51 대기 동작 시간
    mouse.active = Math.max(0, mouse.active - dt);
    if (mouse.active > 0) P.ang = Math.atan2(mouse.y + cam.y - (P.y - 10), mouse.x + cam.x - P.x);
    else if (ml) P.ang = Math.atan2(my, mx);
    if (P.reload > 0) { P.reload -= dt; if (P.reload <= 0) { P.reload = 0; if (G.cls === 'gunner') { P.ammo = gunMag(); P.navyNext = true; } sfx('reload'); } }
    if (G.cls === 'mage') P.mana = Math.min(MAGE_MANA_MAX, P.mana + MAGE_MANA_REGEN * dt);
    P.recoil = Math.max(0, (P.recoil || 0) - dt * 7);
    P.shieldT = Math.max(0, P.shieldT - dt); P.miracleT = Math.max(0, P.miracleT - dt);
    updatePoison(dt); updateBurn(dt); updateAshClouds(dt); updateAshShots(dt);
    if (Math.abs(Math.cos(P.ang)) > 0.15 && P.state !== 'charge' && P.state !== 'attack' && P.state !== 'shadow' && P.state !== 'storm' && P.state !== 'butt') P.face = Math.cos(P.ang) > 0 ? 1 : -1;

    if (pressed['j'] || pressed['k'] || pressed['e'] || pressed['l'] || RANGED()) { const te = touchAim(); /* v2.25 모바일 원딜: 누르기 전에도 조준선이 고정한 적을 가리킴 */ if (te) P.ang = Math.atan2(te.y - (isElite(te) || te.type === 'boss' ? 20 : 8) - (P.y - 10), te.x - P.x); }
    let wantAtk = take('j'), wantSkill = take('k'), wantAwk = take('l') || take('e'); let wantDodge = take(' ');
    if (P.blinkRec > time) { wantAtk = wantSkill = wantAwk = wantDodge = false; } // v3.62 점멸 뒤 나타나는 동안: 걷기만 됨 (공격 · 스킬 · 회피 불가) — 구르기와 같은 0.4초
    // v3.22 무기를 바꾼 뒤 0.4초 공용 쿨타임: 그동안 누른 우클릭은 기억해 두었다가 끝나면 씀
    if (P.gcd > 0) { P.gcd = Math.max(0, P.gcd - dt); if (wantSkill) { P.skBuf = 0.4; wantSkill = false; } } else if (P.skBuf > 0) { wantSkill = true; P.skBuf = 0; }
    if (P.skBuf > 0) P.skBuf = Math.max(0, P.skBuf - dt);
    if (G.meteorAim) { // v1.68 운석 조준: 클릭한 곳에 떨어뜨림, 우클릭·E로 취소
      if (G.cls !== 'mage' || P.gauge < 100 || P.dead) G.meteorAim = false;
      else if (wantAtk && P.state !== 'dodge') { G.meteorAim = false; startMeteor(); wantAtk = false; }
      else if (wantSkill || wantAwk) { G.meteorAim = false; sfx('blip', 0.7); wantSkill = false; wantAwk = false; }
    }
    const holdAny = !!(keys['j'] || mouse.down), holdAtk = RANGED() && holdAny && !G.meteorAim, holdMelee = !RANGED() && holdAny; // 근접도 누르고 있으면 콤보가 이어진다 (v0.64)
    const free = P.state === 'idle' || P.state === 'attack' || P.state === 'rattack';

    if (wantDodge && engTryReturn()) { /* v2.41 되돌아가기 */ }
    else if (wantDodge && P.stam > 0 && (free || P.state === 'butt' || P.state === 'pray' || (P.state === 'skill' && P.t > SKILL.wind + SKILL.swing))) {
      P.stam--; rec('blink'); P.stiletT = time + 1; if (G.cls === 'mage') P.surgeT = SURGE_T; P.state = 'dodge'; P.t = 0; P.dodgeT = 0; P.iframe = DODGE_IF; P.blinkRec = 0; P.dodgeN = (P.dodgeN || 0) + 1; /* v3.63 투사체: 회피를 누른 순간 곧 맞을 투사체는 피한 것으로 · v3.62 구르기 · 점멸 무적 같음 */ P.perfectUsed = false; P.combo = 0; P.queued = false; P.blinkEnd = false; // v3.81 고침: 주석 뒤로 밀려 실행되지 않던 초기화 — 점멸(네로 · 세리안) 두 번째 회피가 바로 끝나던 문제
      if (G.tut && G.tut.step === 4) { G.tut.dashN++; if (G.tut.dashN < 3) P.stam = Math.max(P.stam, 1); }
      const da = ml ? Math.atan2(my, mx) : P.ang;
      P.dvx = Math.cos(da); P.dvy = Math.sin(da);
      if (Math.abs(P.dvx) > 0.2) P.face = P.dvx > 0 ? 1 : -1;
      P.blinkFrom = { x: P.x, y: P.y }; engOnBlinkStart(P.x, P.y, da); // v2.41
      if (s.efx.has('blinkFire')) { (G.pfire = G.pfire || []).push({ x: P.x, y: P.y, t: 4, tick: 0 }); gxIgnite(P.x, P.y); }
      P.rolling = isRoll(); P.rollDust = 0; P.rollLand = false; /* v3.62 구르기 무적도 DODGE_IF (공중 → 착지 직전까지) */
      if (P.rolling) { for (let i = 0; i < 5; i++) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(0, 3), vx: -P.dvx * rand(20, 50) + rand(-15, 15), vy: rand(-18, -4), t: rand(0.25, 0.4), c: pick(['#8a8078', '#a89c90', '#6e6660']), g: 0 }); } // 구르기: 발밑 흙먼지
      else if (G.cls === 'ranger') dashDust(P.x, P.y, -P.dvx, -P.dvy, 6); // v3.20 암살자: 몸이 늘어나는 물리 대시 (점멸 빛 없음)
      else { G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0, t: 0.35, max: 0.35, tint: true });
      blinkBurst(P.x, P.y - 10); }
      sfx('dodge');
    }
    if (wantAwk && P.gauge >= 100 && free) {
      if (G.tut && G.tut.step === 3) G.tut.awkN++;
      if (G.cls === 'gunner') HABIULT.start(); /* v3.15 등 맡기기 */ else AWK.press(); // v3.23 각성기 개편: 기사·어쌔신·마법사는 버프, 성직자는 패시브(쓰러지면 부활)
    }
    if (wantSkill && free && KRS.second()) { /* v3.21 별의 서약: 꽂힌 대검으로 순간 돌진 */ }
    else if (wantSkill && free) {
      const slot = P.chargeCd.findIndex((c, i) => i < charges && c <= 0);
      if (slot >= 0) {
        if (G.tut && G.tut.step === 2) G.tut.skN++;
        P.chargeCd[slot] = Math.max(1, skCdBase() * (1 - s.cdr) * (1 - pasV('kcd')) - (uncK() === 'priest13' ? 1 : 0)); if (s.efx.has('echo')) { P.echoT = 3; gxFocus(); }
        if (G.cls === 'ranger') { if (ARS.start()) { /* v3.22 암살자 무기별 우클릭 */ } else startShadow(); }
        else if (G.cls === 'mage') { if (!MRS.start()) castFireball(); } // v3.22 세리안 무기별 우클릭
        else if (G.cls === 'priest') { if (!PRS.start()) castHeal(); } // v3.22 미레아 무기별 우클릭 // v2.18 채찍은 떼는 순간 치유
        else if (G.cls === 'gunner') { if (!GRS.start()) fireShotgun(); } // v3.22 그레이브 무기별 우클릭
        else if (KRS.start()) { /* v3.21 기사 무기별 우클릭 */ }
        else {
        P.state = 'charge'; P.t = 0.22; P.chargeHit = new Set(); P.atkAng = P.ang; P.combo = 0; P.queued = false; P.sunPath = []; // v2.03
        P.face = Math.cos(P.ang) > 0 ? 1 : -1;
        P.iframe = Math.max(P.iframe, 0.12);
        sfx('whoosh');
        }
      }
    }

    if (P.state === 'idle') {
      if (RANGED() && (wantAtk || holdAtk)) startRanged();
      else if (wantAtk || holdMelee) startAttack(P.comboWin > 0 ? P.combo : 0);
      else if (P.comboWin > 0) P.comboWin -= dt;
      const fast = isCalm(), sp = (fast ? 2 : 1) * (P.ashSlow ? 0.6 : 1);
      { const dr = (hasRelic('drum') && P.awakenT > 0 ? 1.2 : 1) * AWK.spd() * (time < (P.hueRushUntil || 0) ? 1.4 : 1) * (hasRelic('staff') && time < (P.staffUntil || 0) ? 1.3 : 1); P.x += mx * s.spd * sp * dr * dt; P.y += my * s.spd * sp * dr * dt; } // v2.19 전쟁 북 가죽
      if (ml) { P.walk += dt * 10 * sp; if (fast) runFx(dt, mx, my); else if (Math.random() < dt * 6) dust(P.x - mx * 4, P.y, 1); }
      if (G.cls === 'mage') P.blade = lerpAng(P.blade, (P.face > 0 ? -70 : -110) * DEG, dt * 10); // 지팡이를 세워 든다
      else if (G.cls === 'gunner') P.blade = P.reload > 0 ? P.ang + (1 - P.reload / (P.reloadMax || GUN_RELOAD)) * TAU * 2 : lerpAng(P.blade, P.ang, dt * 18); // 재장전 중 총을 두 바퀴 회전
      else if (G.cls === 'priest') P.blade = lerpAng(P.blade, (P.face > 0 ? -70 : -110) * DEG, dt * 10); // v2.43 마법사처럼 무기를 세워 든다
      else if (G.cls === 'ranger') { // 쌍검: 앞손은 아래로, 뒷손은 뒤로
        P.blade = lerpAng(P.blade, (P.face > 0 ? 20 : 160) * DEG, dt * 12); // v1.09 앞날: 몸 앞에서 아래·뒤로
        P.blade2 = lerpAng(P.blade2, (P.face > 0 ? 125 : 55) * DEG, dt * 12); // 뒷날: 몸 뒤에서 등 위로 솟게
      } else // v2.43 대검을 옆구리에서 세워 어깨에 기대 든다 (걸을 땐 살짝 뒤로 눕힘)
        P.blade = lerpAng(P.blade, (P.face > 0 ? (ml ? -100 : -82) : (ml ? -80 : -98)) * DEG, dt * 10);
    } else if (P.state === 'attack') {
      updateSwing(dt, wantAtk || holdMelee, mx, my);
    } else if (P.state === 'dodge') {
      // 점멸: 0.11초 동안 몸을 감추고 약 80px 순간 이동, 출발점과 도착점에 잔상과 빛
      P.t += dt; P.dodgeT += dt;
      if (P.rolling) { // v3.19 구르기: 처음 빠르고 끝에 느려지는 속도로 약 72px · 3px씩 나눠 움직이며 벽 · 구덩이에 막힘
        const k = P.t / ROLL_T;
        if (k >= ROLL_K2 && !P.rollLand) { P.rollLand = true; for (let i = 0; i < 7; i++) { const a = rand(-0.4, 0.4) + (i & 1 ? 0 : Math.PI); G.parts.push({ x: P.x + Math.cos(a) * rand(2, 8), y: P.y - rand(0, 2), vx: Math.cos(a) * rand(30, 60), vy: rand(-22, -6), t: rand(0.25, 0.4), c: pick(['#8a8078', '#a89c90', '#6e6660']), g: 0 }); } } // 착지 흙먼지
        if (k < 1) { const D = ROLL_D * (1 + pasV('blink') + (hasRelic('cloak') ? 0.2 : 0) + (uncK() === 'knight13' ? 0.1 : 0)), v = D / (ROLL_T * ROLL_FN) * rollSpeedF(k), n = Math.max(1, Math.ceil(v * dt / 3));
          for (let i = 0; i < n; i++) { P.x += P.dvx * v * dt / n; P.y += P.dvy * v * dt / n; if (G.obs && G.obs.length) solveObs(P, P.r, false); }
          if (k > ROLL_K0 && k < ROLL_K1 && (P.rollDust -= dt) <= 0) { P.rollDust = 0.06; G.parts.push({ x: P.x + rand(-4, 4), y: P.y - rand(0, 2), vx: -P.dvx * 20 + rand(-10, 10), vy: rand(-14, -4), t: 0.3, c: pick(['#8a8078', '#a89c90']), g: 0 }); } }
        else if (!P.blinkEnd) { P.blinkEnd = true; P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r); engOnBlinkEnd(P.blinkFrom.x, P.blinkFrom.y); }
        P.blade = lerpAng(P.blade, (P.face > 0 ? 150 : 30) * DEG, dt * 20);
        if (P.t >= ROLL_T) { P.state = 'idle'; P.rolling = false; P.rollEndAt = time; }
      } else if (P.t - dt < BLINK) { const de = Math.min(dt, BLINK - (P.t - dt)); // v3.62 마지막 프레임도 남은 만큼 움직여 늘 80px
        { const bm = 80 * (1 + pasV('blink') + (hasRelic('cloak') ? 0.2 : 0) + (uncK() === 'knight13' ? 0.1 : 0)) / BLINK; const n = Math.max(1, Math.ceil(bm * de / 3)); for (let i = 0; i < n; i++) { const px = P.x, py = P.y; P.x += P.dvx * bm * de / n; P.y += P.dvy * bm * de / n; if (!(G.obs && G.obs.length)) continue; const hb = obsHitL(G.obs, P.x, P.y, P.r, true); if (hb && !hb.c) { P.x = px; P.y = py; P.dvx = P.dvy = 0; break; } solveObs(P, P.r, true); } } // v2.29 잿빛 깃털 망토 · v3.19 3px씩 나눠 움직이고 네모 벽 · 소품에 닿으면 그 앞에서 멈춤 (얇은 벽을 건너뛰어 방 밖으로 나가던 문제) · 둥근 기둥은 예전처럼 비껴감
        if (G.cls === 'ranger') { if (Math.random() < 0.5) G.parts.push({ x: P.x - P.dvx * rand(8, 20), y: P.y - rand(0, 3), vx: -P.dvx * 30, vy: rand(-12, -3), t: 0.25, c: pick(['#8a8078', '#a89c90', '#6e6660']), g: 0 }); }
        else if (Math.random() < 0.7) G.parts.push({ x: P.x + rand(-4, 4), y: P.y - rand(2, 20), vx: -P.dvx * 40, vy: -P.dvy * 40, t: 0.3, c: pick(['#9fd2ff', '#e4f2ff']), g: 0, glow: true });
      } else if (!P.blinkEnd) {
        P.blinkEnd = true;
        P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r);
        if (G.cls === 'ranger') dashDust(P.x, P.y, P.dvx, P.dvy, 8); else blinkBurst(P.x, P.y - 10);
        if (pasO('wallWave') && (P.x - A.x0 < 30 || A.x1 - P.x < 30 || P.y - A.y0 < 30 || A.y1 - P.y < 30)) { G.fx.push({ kind: 'ring', x: P.x, y: P.y - 6, r: 6, grow: 140, t: 0.2, max: 0.2, c: '#d8c9a8' }); addShake(2, 0); for (const e of nearFoes(P.x, P.y, 52)) damageEnemy(e, 0.2, { proc: true, ang: angTo(P, e), kb: 120, gauge: 1 }); } // v2.22 보관 패시브: 성문 방패
        if (G.cls === 'ranger') { for (const o of [-8]) G.fx.push({ kind: 'streak', px: '#cfc8bc', x0: P.blinkFrom.x - P.dvy * o * 0.3, y0: P.blinkFrom.y + o, x1: P.x - P.dvx * 12 - P.dvy * o * 0.3, y1: P.y + o - P.dvy * 12, t: 0.16, max: 0.16 }); } // 바람 가르는 선 (도트 한 색)
        else G.fx.push({ kind: 'streak', x0: P.blinkFrom.x, y0: P.blinkFrom.y - 10, x1: P.x, y1: P.y - 10, t: 0.18, max: 0.18 });
        engOnBlinkEnd(P.blinkFrom.x, P.blinkFrom.y); // v2.41
        if (wSkill() === 'broom') { G.dustC = G.dustC || []; for (let i = 0; i <= 4; i++) G.dustC.push({ x: P.blinkFrom.x + (P.x - P.blinkFrom.x) * i / 4, y: P.blinkFrom.y + (P.y - P.blinkFrom.y) * i / 4, t: 2.5 }); } // v2.08 마녀 빗자루
      }
      if (!P.rolling && P.state === 'dodge') { P.blade = lerpAng(P.blade, (P.face > 0 ? 150 : 30) * DEG, dt * 20);
      if (P.blinkEnd && P.state === 'dodge') { P.state = 'idle'; P.blinkRec = time + BLINK_REC; if (G.cls === 'mage') for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; G.parts.push({ x: P.x + Math.cos(a) * 18, y: P.y - 10 + Math.sin(a) * 12, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 40, t: 0.28, c: pick(['#9fd2ff', '#e4f2ff']), g: 0, glow: true }); } } } // 흩어진 빛이 몸으로 모임 // v3.62 점멸: 순간 이동이 끝나면 바로 걸을 수 있고, 0.29초 동안 몸이 또렷해지며(나타남) 공격 · 회피는 못 함
    } else if (P.state === 'charge') {
      P.t -= dt;
      P.x += Math.cos(P.atkAng) * 340 * dt; P.y += Math.sin(P.atkAng) * 340 * dt;
      P.blade = lerpAng(P.blade, P.atkAng + Math.PI * 0.85 * P.face, dt * 16);
      if (Math.random() < 0.7) dust(P.x, P.y, 1);
      G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0.25 * P.face, t: 0.16, max: 0.16, tint: true });
      for (const e of G.enemies) if (!e.dead && !P.chargeHit.has(e) && dist(e, P) < e.r + P.r + 12 + RS_PAD) { // v3.25 우클릭 판정 여유
        P.chargeHit.add(e);
        damageEnemy(e, 1.2, { grogi: 10, kb: wSkill() === 'gate' ? 520 : 120, ang: P.atkAng, heavy: true, stagger: 0.6, gauge: 5 });
      }
      if (wSkill() === 'sun') P.sunPath.push({ x: P.x, y: P.y }); // v2.03 빛의 길
      if (P.t <= 0) { weaponChargeEnd(); startSkillSlash(); }
    } else if (P.state === 'ars') { ARS.update(dt);
    } else if (P.state === 'grs') { GRS.update(dt);
    } else if (P.state === 'mrs') { MRS.update(dt);
    } else if (P.state === 'prs') { PRS.update(dt);
    } else if (P.state === 'krs') {
      KRS.update(dt);
    } else if (P.state === 'skill') {
      updateSkillSlash(dt);
    } else if (P.state === 'awaken') {
      updateAwaken(dt);
    } else if (P.state === 'shadow') {
      updateShadow(dt);
    } else if (P.state === 'storm') {
      updateStorm(dt, mx, my);
    } else if (P.state === 'rattack') {
      updateRanged(dt, mx, my, wantAtk || holdAtk);
    } else if (P.state === 'butt') {
      updateButt(dt);
    } else if (P.state === 'cast') {
      updateCast(dt);
    } else if (P.state === 'aim') {
      updateAim(dt, mx, my);
    } else if (P.state === 'pray') {
      updatePray(dt);
    }
    if (P.state === 'idle' && P.comboWin <= 0) P.combo = 0;
    solveObs(P, P.r, P.state === 'dodge' && P.t < BLINK && !P.rolling);
    P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r);
    if (['charge', 'skill', 'awaken', 'storm', 'shadow', 'butt'].includes(P.state)) hitCrack(P.x, P.y, 2, 60);
    if (G.bonfire && dist(P, G.bonfire) < 30) healPct(0.2 * dt * (ascOn(9) ? 0.5 : 1));
  }
  const BLINK = 0.11;
  // v3.20 기사 · 거너 · 사제는 점멸 대신 구르기 확정 (보이는 채로 굴러 이동 · 벽과 구덩이에 막힘 · 90°씩 도는 도트). 마법사 · 레인저만 점멸
  // v3.19 구르기 도트 (기사 · 거너 · 사제): 꾹 눌림 → 다이브 → 말림(정원, 시안04) → 착지 → 튕김 → 살짝 눌림. 시안 _시안/구르기모션_TOBE_시안03.html
  Object.assign(MAPS, {"hKnight_rpre": ["...........................", "...........................", "...........k1Rk............", ".........kk1rRRk...........", "........k1rkkMMMk..........", "........k6kMMMMMMk.........", "........k23MMMMMMMk........", "........k277hhhhhmk........", "........k25vSSSvSmk........", ".......k22SvSSSvSmmk.......", ".......kk2D5SsSSDmk........", "....kkRRkk11RRRRRkk........", "k11RrrRkk22RRRRRmmk........", ".k16RkRRrkkFFk.kFFk........", "..k6kk6kk.kkkk.kkkk......,."], "hKnight_rdive": ["...............kk..........", "..............k1Rk.........", "............kk1rRRk........", "...........k1rkkMMMk.......", "...........k6kMMMMMMk..kkk.", "...........k23MMMMMMMkkSSSk", "...........k277hhhhhmkkSSsk", "..........kk25vSSSvSm553kk.", "......kkkkR22SvSSSvSmm3k...", "..kkkkRR1RRR2D5SsSSDmkk....", "kkRRR1RRRR5RR3kk533kk......", "rkrRRR2225R322kk3kk........", "kFFF22444322kk..k..........", "kFFF44kk22kk...............", ".kkkkk..kk................."], "hKnight_rcurl": ["...........................", "...........kkkkkk..........", "..........krRRRRRk.........", "..........kkMMMRRRk........", "........kkMMMMMMRRRk.......", ".......k23MMMMMMMRRrk......", ".......k277hhhhhmRRrk......", "......kR25vSSSvSmRRrrk.....", "......k22SvSSSvSmmRrrk.....", "......kR2D5SsSSDmRRrrk.....", ".......kRRRRRRRRRRRSk......", ".......kRRRRRRR2222Sk......", "........kRRRRRR22FFk.......", ".........kRrrrFFFFk........", "..........krrrrrrk........."], "hKnight_rland": ["...........................", "...........................", "............kk.............", "...........k1Rk............", ".........kk1rRRk...........", "........k1rkkMMMk..........", "........k6kMMMMMMk.........", "...kkkkkk23MMMMMMMk........", "..kRRRRRR277hhhhhmk........", "..kRS333325vSSSvSmkkk......", ".krRRRR122SvSSSvSmm33k.....", ".krRRRRRR555RRRR55533k.....", "..krrrk22233RRRR33222Sk....", "...kkkFFFFkkkkkkkkFFFSk....", "......kkkk........kkkk....."], "hKnight_rup": ["...........k1Rk............", ".........kk1rRRk...........", "........k1rkkMMMk..........", "........k6kMMMMMMk.........", "........k23MMMMMMMk........", "........k277hhhhhmk........", "........k25vSSSvSmk........", ".......k22SvSSSvSmmk.......", ".......kk2D5SsSSDmk........", ".....kkRRkk11RRRkk.........", "...kkRRRk23MRRRMMmk........", "...kkRRRk23MRRRMMmk........", "...kkRRRk23MRRRMMmk........", "..kRRRRrk5k24RDmkSk........", ".k11RrrRkk22RRRmmk.........", ".k16RkRRrkkFFk.kFFk........", "..k6kk6kk.kkkk.kkkk......,."], "hKnight_rsettle": ["...........................", "...........k1Rk............", ".........kk1rRRk...........", "........k1rkkMMMk..........", "........k6kMMMMMMk.........", "........k23MMMMMMMk........", "........k277hhhhhmk........", "........k25vSSSvSmk........", ".......k22SvSSSvSmmk.......", ".......kk2D5SsSSDmk........", ".....kkRRkk11RRRkk.........", "..kRRRRrk5k24RDmkSk........", ".k11RrrRkk22RRRmmk.........", "k16RkRRrkkFFkkk.kFFk.......", ".k6kk6kk.kkkkkk.kkkk......,"], "hPriest_rpre": ["...........................", "...........................", ".........kk.....kk.........", "........k1Hk...kHHk........", "........k1qk...kqHk........", "........k1qk...kqHk........", ".........k1qk.kqHk.........", ".........k1qkkkqHk.........", "........k11HHHHHHHk........", "........k12hhhhhhHk........", "........k14vSSSvSHk........", ".......k214ESSSEShHk.......", ".....kkkk244SnSSShk........", "....kHHHkkk11XHHkk.........", "...kHHHHk21HXXXHHhk........", ".k5Hk4k3k21XXXXXHhksk......", "...kkk..kkkkkkkk.kkkk.....,"], "hPriest_rdive": ["...........................", "...........................", ".............kk.....kk.....", "............k1Hk...kHHk....", "............k1qk...kqHk....", "............k1qk...kqHk....", ".............k1qk.kqHk.kkk.", ".............k1qkkkqHkkSSSk", "............k11HHHHHHHkSSsk", "...kkkk.....k12hhhhhhHHhkk.", ".kkHHHHkk...k14vSSSvSHhk...", "kH2HHHHHHkkk214ESSSEShHk...", "H2HHHHHHHHHXX244SnSSShk....", "k1HHHHhhhHXHhhkkhkkkkk.....", "kFFFhh222Hhhkk..k..........", "kFFF22kkhhkk...............", ".kkkkk..kk................."], "hPriest_rcurl": ["...........................", "...........................", "...........................", "...........kkkkkk..........", "..........kHHHHqHk.........", ".........kqHHHqHHHk........", "........k1qkHkqHHHHk.......", ".......k11HHHHHHHHH1k......", ".......k12hhhhhhHHH1k......", "......kH14vSSSvSHHH11k.....", "......k214ESSSEShHH11k.....", "......kH244SnSSShHH11k.....", ".......kHHHHHHHHHHHSk......", ".......kHHHHHHHhhhhSk......", "........kHHHHHHhhFFk.......", ".........kH111FFFFk........", "..........k111111k........."], "hPriest_rland": ["...........................", "...........................", "...........................", ".........kk.....kk.........", "........k1Hk...kHHk........", "........k1qk...kqHk........", "........k1qk...kqHk........", ".........k1qk.kqHk.........", ".........k1qkkkqHk.........", "...kkkkkk11HHHHHHHk........", "..kHHHHHk12hhhhhhHk........", ".kHHShhhh14vSSSvSHkkk......", ".kHHHHHH214ESSSEShHhhk.....", ".k1HHHHH1HHHXXXXHHHhhk.....", "..k11H1hhhHHXXXXHHhhhSk....", "...kkkFFFFkkkkkkkkFFFSk....", "......kkkk........kkkk....."], "hPriest_rup": [".........kk.....kk.........", "........k1Hk...kHHk........", "........k1qk...kqHk........", "........k1qk...kqHk........", ".........k1qk.kqHk.........", ".........k1qkkkqHk.........", "........k11HHHHHHHk........", "........k12hhhhhhHk........", "........k14vSSSvSHk........", ".......k214ESSSEShHk.......", ".....kkkk244SnSSShk........", "....kHHHkkk11XHHkk.........", "...kHHHHk21HXXXHHhk........", "...k5Hk4k3k21XHhksk........", "...k5Hk4kk21HHHHhk.........", "...k5Hk4kk21HHHHhk.........", "...k5Hk4kk21HHHHhk.........", "....k55kk.kFFk.kFFk........", ".....kkk..kkkk.kkkk.....,.."], "hPriest_rsettle": ["...........................", ".........kk.....kk.........", "........k1Hk...kHHk........", "........k1qk...kqHk........", "........k1qk...kqHk........", ".........k1qk.kqHk.........", ".........k1qkkkqHk.........", "........k11HHHHHHHk........", "........k12hhhhhhHk........", "........k14vSSSvSHk........", ".......k214ESSSEShHk.......", ".....kkkk244SnSSShk........", "....kHHHkkk11XHHkk.........", "...kHHHHk21HXXXHHhk........", "...k5Hk4k3k21XHhksk........", "...k55kk.kFFkkk.kFFk.......", "....kkk..kkkkkk.kkkk.....,."], "hGunner_rpre": ["...........................", "...........................", "..........k.....k..........", ".........kdk...kgk.........", ".........kkkkkkkkk.........", ".........kHHHHHHHk.........", "........kkQVQHQVQkk........", ".......kkkkkkkkkkkkk.......", "........kdZkgggkZgk........", ".....kkkdgUXZZZXZggk.......", "...kkgggkkVUUNUUUkk........", "..kGGggggkk11SSSkk.........", ".kGGDgggk23CCBCCCck........", "kkDdddk4k23xxxxxCckGk......", "..........kkkk.kkkk......,."], "hGunner_rdive": ["...........................", "...............k.....k.....", "..............kdk...kgk....", "...............kkkkkkk.....", "..............kHHHHHHHkkkk.", "..............kQVQHQVQkGGGk", "..............kkkkkkkkkGGgk", "...kkkk......kdZkgggkZgCkk.", ".kkGGGGkk...kdgUXZZZXZggk..", "kGgGGGGGGkkkcckVUUNUUUkk...", "GgGGGGGGGGcBBCkkcCCkkk.....", "kDGGGGxxxcBCxxkkCkk........", "kFFFxx333Cxxkk..k..........", "kFFF33kkxxkk...............", ".kkkkk..kk................."], "hGunner_rcurl": ["...........................", "...........kkkkkk..........", "..........kCCCCCgk.........", ".........kkkCCCkkCk........", "........kCHHHHHHHCCk.......", ".......kCkQVQHQVQkCxk......", ".......kGkkkkkkkkkCxk......", "......kGGdZkgggkZgCxxk.....", "......kGdgUXZZZXZggxxk.....", "......kGGgVUUNUUUCCxxk.....", ".......kGgCCCCCCCCCGk......", ".......kGGgCCCCxxxxGk......", "........kGgggCCxxFFk.......", ".........kGGgxFFFFk........", "..........kGGxxxxk........."], "hGunner_rland": ["...........................", "...........................", "...........................", "...........k.....k.........", "..........kdk...kgk........", "...........kkkkkkk.........", "..........kHHHHHHHk........", "...kkkkk..kQVQHQVQk........", "..kGGGGGk.kkkkkkkkk........", ".kGGGCCCCkdZkgggkZgkk......", ".kGGGGGGGdgUXZZZXZgCCk.....", ".kDGGGGGDcccBBBBcccCCk.....", "..kDDGDxxxCCBBBBCCxxxGk....", "...kkkFFFFkkkkkkkkFFFGk....", "......kkkk........kkkk....."], "hGunner_rup": ["..........k.....k..........", ".........kdk...kgk.........", ".........kkkkkkkkk.........", ".........kHHHHHHHk.........", "........kkQVQHQVQkk........", ".......kkkkkkkkkkkkk.......", "........kdZkgggkZgk........", ".....kkkdgUXZZZXZggk.......", "...kkgggkkVUUNUUUkk........", "..kGGggggkk11SSSkk.........", ".kGGDgggk23CCBCCCck........", "..kkDdddk4k23xCckGk........", "....kkEEEkCCCkCCCk.........", "....kkEEEkCCCkCCCk.........", "....kkEEEkCCCkCCCk.........", "......kkk.kFFk.kFFk........", "..........kkkk.kkkk......,."], "hGunner_rsettle": ["...........................", "..........k.....k..........", ".........kdk...kgk.........", ".........kkkkkkkkk.........", ".........kHHHHHHHk.........", "........kkQVQHQVQkk........", ".......kkkkkkkkkkkkk.......", "........kdZkgggkZgk........", ".....kkkdgUXZZZXZggk.......", "...kkgggkkVUUNUUUkk........", "..kGGggggkk11SSSkk.........", ".kGGDgggk23CCBCCCck........", "..kkDdddk4k23xCckGk........", ".....kkk.kFFkkk.kFFk.......", ".........kkkkkk.kkkk......,"]});
  const ROLL_CLS = new Set(['knight', 'gunner', 'priest']), ROLL_T = 0.4, ROLL_D = 80, ROLL_POST = 0.14; // v3.62 구르기 0.5초 · 76px → 0.4초 · 80px (점멸과 같은 거리 · 동작 시간)
  const DODGE_IF = 0.38, BLINK_REC = 0.29; // v3.62 회피 무적 (구르기 · 점멸 같음) · 점멸 순간 이동(0.11초) 뒤 나타나는 시간 → 합 0.4초
  var isRoll = () => !!G && ROLL_CLS.has(G.cls);
  // 구르기 단계 (시간 비율): 0~0.12 꾹 눌림 · 0.12~0.26 다이브 · 0.26~0.82 말림(공중 · 90°씩 한 바퀴) · 0.82~1 착지 → 끝난 뒤 0.07초 튕김 · 0.07초 살짝 눌림 (도트 장면만 바꿈, 늘이기 없음)
  const ROLL_K0 = 0.12, ROLL_K1 = 0.26, ROLL_K2 = 0.82, rollSpeedF = k => k < ROLL_K0 ? 0.25 : k < ROLL_K1 ? 0.9 : k < ROLL_K2 ? 1 : 0.2, ROLL_FN = ROLL_K0 * 0.25 + (ROLL_K1 - ROLL_K0) * 0.9 + (ROLL_K2 - ROLL_K1) + (1 - ROLL_K2) * 0.2;
  const rollPose = P => { const k = clamp(P.t / ROLL_T, 0, 1), f = P.face || 1;
    if (k < ROLL_K0) return { key: 'pre', rot: 0, lift: 0, air: false };
    if (k < ROLL_K1) return { key: 'dive', rot: 0, lift: 2, air: true };
    if (k < ROLL_K2) { const u = (k - ROLL_K1) / (ROLL_K2 - ROLL_K1); return { key: 'curl', rot: (Math.min(3, Math.floor(u * 4)) + 1) % 4 * Math.PI / 2 * f, lift: Math.round(Math.sin(Math.PI * u) * 7) * 2, air: true }; }
    return { key: 'land', rot: 0, lift: 0, air: true }; };
  // 말림 회전은 그림 한가운데를 축으로 (drawSprite는 발밑 가운데를 축으로 돌리므로 그만큼 옮겨 그림)
  const rollOff = (key, rot) => { if (!rot || !MAPS[key]) return [0, 0]; const h = MAPS[key].length * 2; return [Math.round(-h / 2 * Math.sin(rot) / 2) * 2, Math.round(-h / 2 * (1 - Math.cos(rot)) / 2) * 2]; };
  // 몸 그림 키: 구르는 중이면 그 장면, 끝난 직후 서 있거나 걷는 중이면 튕김 · 살짝 눌림
  const rollMap = (P, base) => { if (P.state === 'dodge' && P.rolling) return base + '_r' + rollPose(P).key;
    if (P.rollEndAt != null && (P.state === 'idle') && time - P.rollEndAt < ROLL_POST) return base + (time - P.rollEndAt < ROLL_POST / 2 ? '_rup' : '_rsettle'); return null; };
  // 전투가 끝난 방에서는 두 배로 달린다 (흙먼지·잔상·속도선·발소리)
  function isCalm() { return !!(G.dun && G.dun.cur && G.dun.cur.cleared && !G.sealed && !G.trans && !G.enemies.some(e => !e.dead && !isDummy(e))); }
  function runFx(dt, mx, my) {
    const P = G.player;
    P.runT = (P.runT || 0) - dt; P.stepT = (P.stepT || 0) - dt;
    if (P.runT <= 0) {
      P.runT = 0.045;
      for (let i = 0; i < 3; i++) G.parts.push({ x: P.x - mx * 6 + rand(-3, 3), y: P.y + rand(-1, 2), vx: -mx * rand(30, 70) + rand(-15, 15), vy: -my * rand(20, 50) - rand(10, 35), t: rand(0.25, 0.45), c: pick(G.stage === 1 ? ['#6a5a3a', '#4a3e28', '#7a6a4a'] : ['#5a5466', '#3e3a46', '#6a6474']), g: 60 });
      G.parts.push({ x: P.x - mx * 10 + rand(-4, 4), y: P.y - rand(6, 18), vx: -mx * 260, vy: -my * 260, t: 0.08, c: '#d8d0c0', g: 0 });
    }
    P.puffT = (P.puffT || 0) - dt; if (P.puffT <= 0) { P.puffT = 0.085; P.foot = -(P.foot || 1); G.fx.push({ kind: 'puff', x: P.x - mx * 8 + my * P.foot * 4, y: P.y + 1 - my * 4 - mx * P.foot * 2, t: 0.32, max: 0.32, c: G.stage === 1 ? '#b8ac8a' : '#8a8494' }); }
    if (P.stepT <= 0) { P.stepT = 0.085; P.stepN = (P.stepN || 0) + 1; sfx('step', P.stepN % 2 ? 1 : 1.25); }
  }
  function dashDust(x, y, dx, dy, n) { // v3.20 암살자 대시: 발밑 흙먼지 (dx,dy 방향으로 튐)
    for (let i = 0; i < n; i++) G.parts.push({ x: x + rand(-5, 5), y: y - rand(0, 3), vx: dx * rand(30, 70) + rand(-18, 18), vy: rand(-26, -6) + dy * 20, t: rand(0.25, 0.42), c: pick(['#8a8078', '#a89c90', '#6e6660', '#b8ae9e']), g: 0 });
  }
  const DASH_POSE = t => t < 0.03 ? [1.2, 0.8] : t < BLINK ? [1, 1] : t < BLINK + 0.04 ? [0.75, 1.25] : [1.1, 0.92]; // v3.20 암살자 대시: 웅크림 → (몸 뒷부분만 늘어남: 14_rig dashSmear) → 되튐 → 자리잡기
  function blinkBurst(x, y) {
    for (let i = 0; i < 12; i++) { const a = rand(0, TAU), sp = rand(30, 90); G.parts.push({ x, y: y + rand(-8, 8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: rand(0.2, 0.4), c: pick(['#9fd2ff', '#e4f2ff', '#5f86b8']), g: 0, glow: true }); }
    G.fx.push({ kind: 'ring', x, y, r: 4, t: 0.22, max: 0.22, c: '#9fd2ff' });
  }
  // 칼날이 base 기준 상대각 rel0→rel1을 쓸고 지나간 범위 안의 적을 벤다
  function sweepHits(base, sign, rel0, rel1, reach, hitSet, o) {
    const P = G.player, lo = Math.min(rel0, rel1), hi = Math.max(rel0, rel1), px = P.x, py = P.y - PIVOT_Y + 4 - (P.lift || 0);
    for (const e of G.enemies) {
      if (e.dead || hitSet.has(e)) continue;
      const ey = e.y - (e.tall ? e.tall * 0.3 : e.type === 'boss' ? 18 : isElite(e) ? 12 : 6);
      const d = Math.hypot(e.x - px, ey - py);
      if (d > reach + e.r) continue;
      const tol = Math.atan(e.r / Math.max(d, 1)) + 0.05;
      const ra = sign * angDiff(Math.atan2(ey - py, e.x - px), base);
      let hit = d < 14;
      for (let k = -3; k <= 3 && !hit; k++) { const r = ra + k * TAU; if (r >= lo - tol && r <= hi + tol) hit = true; }
      if (hit) { hitSet.add(e); damageEnemy(e, o.coef, Object.assign({ ang: angTo(P, e) }, o)); }
    }
  }

  // 특수기술: 돌진 참격 — 돌진 후 크게 올려베며 검기를 날린다
  const SKILL = { wind: 0.05, swing: 0.13, rec: 0.22, a0: -165, a1: 150, reach: 74 };
  function startSkillSlash() {
    const P = G.player;
    P.state = 'skill'; P.t = 0; P.sign = P.face; P.hitSet = new Set(); P.swingRel = SKILL.a0 * DEG; P.prevRel = P.swingRel; P.swooshed = false;
  }
  function updateSkillSlash(dt) {
    const P = G.player, S = SKILL;
    P.t += dt;
    const end = S.wind + S.swing;
    let rel;
    if (P.t < S.wind) rel = S.a0 * DEG;
    else if (P.t < end) rel = (S.a0 + (S.a1 - S.a0) * easeOut((P.t - S.wind) / S.swing)) * DEG;
    else rel = S.a1 * DEG;
    P.prevRel = P.swingRel; P.swingRel = rel; P.blade = P.atkAng + P.sign * rel;
    if (P.t >= S.wind && P.t - dt < end + 0.02) {
      if (!P.swooshed) {
        P.swooshed = true; sfx('whoosh'); addShake(4, P.atkAng);
        G.proj.push({ x: P.x + Math.cos(P.atkAng) * 16, y: P.y - 9 + Math.sin(P.atkAng) * 16, ang: P.atkAng, sp: 440, t: 0.45, hit: new Set(), r: 24, hist: [] });
      }
      sweepHits(P.atkAng, P.sign, P.prevRel, P.swingRel, S.reach + RS_PAD, P.hitSet, { coef: 1.6, grogi: 15, kb: 220, heavy: true, stagger: 0.6, gauge: 6 });
      P.trail.push({ a: P.blade, t: 0.15 });
    }
    if (P.t >= end + S.rec) P.state = 'idle';
  }
  function updateProj(dt) {
    for (const pr of G.proj) {
      pr.hist.push({ x: pr.x, y: pr.y }); if (pr.hist.length > 5) pr.hist.shift();
      pr.ox = pr.x; pr.oy = pr.y; pr.x += Math.cos(pr.ang) * pr.sp * dt; pr.y += Math.sin(pr.ang) * pr.sp * dt; pr.t -= dt;
      if (Math.random() < 0.8) G.parts.push({ x: pr.x + rand(-6, 6), y: pr.y + rand(-14, 14), vx: Math.cos(pr.ang) * 40, vy: Math.sin(pr.ang) * 40, t: 0.25, c: pick(['#9fd2ff', '#ffffff']), g: 0, glow: true });
      for (const e of G.enemies) {
        if (e.dead || pr.hit.has(e)) continue;
        if (Math.hypot(e.x - pr.x, e.y - 8 - pr.y) < pr.r + e.r) { pr.hit.add(e); damageEnemy(e, 1.3, { ang: pr.ang, grogi: 8, kb: 150, gauge: 3, stagger: 0.4 }); }
      }
      if (pr.x < A.x0 - 20 || pr.x > A.x1 + 20 || pr.y < A.y0 - 20 || pr.y > A.y1 + 20 || segSolid(pr.ox, pr.oy + 8, pr.x, pr.y + 8)) { pr.t = 0; hitCrack(pr.x, pr.y + 8, 1, 34); }
    }
    G.proj = G.proj.filter(pr => pr.t > 0);
  }

  // 각성기: 성채의 맹세 — 떠오르며 회전베기 2회 → 거대한 빛의 검을 내려찍는다 → 5초간 받는 피해 30% 감소
  function startAwaken() {
    const P = G.player;
    P.gauge = 0; P.state = 'awaken'; P.t = 0; P.atkAng = P.ang; P.sign = P.face; P.combo = 0; P.queued = false;
    P.awkSet = [new Set(), new Set()]; P.awkSlam = false; P.iframe = 1.45; P.lift = 0; P.giant = 0; P.spinRel = -90 * DEG; P.awkSfx = 0;
    flashT = 0.12; flashColor = '#ffe39a'; sfx('awaken'); addShake(3);
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 50, t: 0.25, max: 0.25, c: '#ffd34d', grow: -180 });
  }
  function updateAwaken(dt) {
    const P = G.player;
    P.t += dt;
    const t = P.t;
    if (t < 0.9 && Math.random() < 0.9) {
      const a = rand(0, TAU), r = rand(34, 64);
      G.parts.push({ x: P.x + Math.cos(a) * r, y: P.y - 10 + Math.sin(a) * r * 0.6, vx: -Math.cos(a) * r * 2.6, vy: -Math.sin(a) * r * 1.6, t: 0.35, c: pick(['#ffd34d', '#fff0b0', '#ffaa40']), g: 0, glow: true });
    }
    if (t < 0.15) {
      P.lift = 7 * (t / 0.15); P.spinRel = -90 * DEG; P.blade = P.atkAng + P.sign * P.spinRel;
    } else if (t < 0.75) {
      const k = (t - 0.15) / 0.6, prev = P.spinRel;
      P.spinRel = -90 * DEG + k * 2 * TAU;
      P.blade = P.atkAng + P.sign * P.spinRel;
      P.face = Math.cos(P.blade) > 0 ? 1 : -1;
      if (P.awkSfx < 2 && k >= P.awkSfx * 0.5) { P.awkSfx++; sfx('whoosh'); G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 20, t: 0.25, max: 0.25, c: '#ffe39a', grow: 220 }); }
      sweepHits(P.atkAng, P.sign, prev, P.spinRel, 72, P.awkSet[k < 0.5 ? 0 : 1], { coef: 1.0, grogi: 7, kb: 90, gauge: 0, stagger: 0.3 });
      P.trail.push({ a: P.blade, t: 0.16 });
    } else if (t < 0.9) {
      const k = (t - 0.75) / 0.15;
      P.lift = 7 + 5 * k; P.giant = easeOut(k); P.face = P.sign;
      P.giantAng = P.atkAng - P.sign * 150 * DEG;
      P.blade = lerpAng(P.blade, P.giantAng, dt * 25);
    } else if (t < 1.03) {
      const k = easeOut((t - 0.9) / 0.11);
      P.giantAng = P.atkAng - P.sign * 150 * DEG + P.sign * 172 * DEG * k;
      P.blade = P.giantAng;
      P.trail.push({ a: P.blade, t: 0.22 });
      if (k >= 0.93 && !P.awkSlam) awakenSlam();
    } else if (t < 1.38) {
      P.lift = Math.max(0, P.lift - dt * 70); P.giant = Math.max(0, 1 - (t - 1.03) / 0.35);
    } else {
      P.state = 'idle'; P.awakenT = 5; P.lift = 0; P.giant = 0;
    }
  }
  function awakenSlam() {
    const P = G.player;
    P.awkSlam = true; P.lift = 0;
    const cx = P.x + Math.cos(P.atkAng) * 72, cy = P.y + Math.sin(P.atkAng) * 58;
    if (wSkill() === 'exec') { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; (G.pfire = G.pfire || []).push({ x: cx + Math.cos(a) * 54, y: cy + Math.sin(a) * 34, t: 5, tick: 0 }); } gxIgnite(cx, cy); } // v2.03 잿빛 왕의 처형검
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - cx, e.y - cy) < 88 + e.r || dist(e, P) < 56 + e.r) damageEnemy(e, 3.2, { grogi: 30, kb: 280, ang: angTo(P, e), heavy: true, stagger: 0.9, gauge: 0 });
    }
    G.fx.push({ kind: 'ring', x: cx, y: cy, r: 10, t: 0.55, max: 0.55, c: '#ffd34d', grow: 300 });
    G.fx.push({ kind: 'ring', x: cx, y: cy, r: 6, t: 0.3, max: 0.3, c: '#ffffff', grow: 200 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + rand(-0.2, 0.2), r = rand(30, 80); G.fx.push({ kind: 'pillar', x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.6, h: rand(70, 130), t: rand(0.35, 0.6), max: 0.6 }); }
    crack(cx, cy); crack(cx + rand(-20, 20), cy + rand(-10, 10));
    sparks(cx, cy, -Math.PI / 2, '#ffd34d', 18); sparks(cx, cy, Math.PI / 2, '#fff0b0', 10);
    dust(cx, cy, 30);
    flashT = 0.22; flashColor = '#ffe39a'; addShake(11, P.atkAng); hitstop = 0.12;
    sfx('heavy'); sfx('boss');
  }

  // 레인저 특수기술: 그림자 도약
  function smoke(x, y, n) {
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), sp = rand(20, 80); G.parts.push({ x: x + rand(-4, 4), y: y - rand(0, 18), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - 20, t: rand(0.3, 0.6), c: pick(['#2a1238', '#3d1d52', '#120818', '#6b3d8a']), g: -20 }); }
    G.fx.push({ kind: 'ring', x, y: y - 8, r: 6, t: 0.3, max: 0.3, c: '#8a5aa8', grow: 120 });
  }
  function startShadow() {
    const P = G.player;
    let best = null, bd = 1e9;
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = dist(P, e);
      if (d < 210 + RS_PAD && coneIn(P, e, P.ang, 0.95) && d < bd) { bd = d; best = e; } // v3.25 우클릭 판정 여유
    }
    P.state = 'shadow'; P.t = 0; P.shTarget = best; P.shArrived = false; P.shFrom = { x: P.x, y: P.y };
    P.iframe = Math.max(P.iframe, 0.4); P.combo = 0; P.queued = false; P.hitSet = new Set(); P.swooshed = false;
    G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0, t: 0.4, max: 0.4, map: 'hRanger', pal: 'hRangerShadow', sc: 2 });
    smoke(P.x, P.y, 16); sfx('dodge');
  }
  function updateShadow(dt) {
    const P = G.player, T0 = 0.08, W0 = 0.02, SW = 0.12, RC = 0.18;
    P.t += dt;
    if (P.t < T0) return;
    if (!P.shArrived) {
      P.shArrived = true;
      const e = P.shTarget && !P.shTarget.dead ? P.shTarget : null;
      let tx, ty;
      if (e) { const a = angTo(P.shFrom, e); tx = e.x + Math.cos(a) * (e.r + 16); ty = e.y + Math.sin(a) * (e.r + 16) * 0.8; }
      else { tx = P.x + Math.cos(P.ang) * 110; ty = P.y + Math.sin(P.ang) * 110; }
      P.x = clamp(tx, A.x0 + P.r, A.x1 - P.r); P.y = clamp(ty, A.y0 + P.r, A.y1 - P.r);
      G.fx.push({ kind: 'streak', x0: P.shFrom.x, y0: P.shFrom.y - 10, x1: P.x, y1: P.y - 10, t: 0.22, max: 0.22, c: '160,90,220' });
      smoke(P.x, P.y, 14);
      P.atkAng = e ? angTo(P, e) : P.ang; P.face = Math.cos(P.atkAng) > 0 ? 1 : -1; P.sign = P.face;
      P.swingRel = -160 * DEG; P.prevRel = P.swingRel;
      if (e) P.critNext = true; // 등 뒤 기습은 치명타
    }
    const tt = P.t - T0;
    const rel = tt < W0 ? -160 * DEG : (-160 + 320 * easeOut((tt - W0) / SW)) * DEG;
    P.prevRel = P.swingRel; P.swingRel = Math.min(rel, 160 * DEG);
    P.blade = P.atkAng + P.sign * P.swingRel; P.blade2 = P.atkAng - P.sign * P.swingRel;
    if (tt >= W0 && tt - dt < W0 + SW + 0.02) {
      if (!P.swooshed) {
        P.swooshed = true; sfx('whoosh'); addShake(3, P.atkAng);
        G.fx.push({ kind: 'xslash', x: P.x + Math.cos(P.atkAng) * 22, y: P.y - 9 + Math.sin(P.atkAng) * 16, ang: P.atkAng, t: 0.28, max: 0.28 });
      }
      sweepHits(P.atkAng, P.sign, P.prevRel, P.swingRel, 48, P.hitSet, { coef: 2.0, grogi: 14, kb: 150, heavy: true, stagger: 0.6, gauge: 6 });
      P.trail.push({ a: P.blade, t: 0.14 }); P.trail2.push({ a: P.blade2, t: 0.14 });
    }
    if (P.t >= T0 + W0 + SW + RC) { P.state = 'idle'; if (wSkill() === 'fangs2') { P.stealthT = 2; smoke(P.x, P.y, 10); } } // v2.05 쌍둥이 송곳니
  }
  // 레인저 각성기: 칼날 폭풍
  function startStorm() {
    const P = G.player;
    P.gauge = 0; P.state = 'storm'; P.t = 0; P.stormTick = 0; P.spin = P.ang; P.combo = 0; P.queued = false;
    flashT = 0.12; flashColor = '#9ff0c8'; sfx('awaken'); addShake(4);
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 10, t: 0.4, max: 0.4, c: '#9ff0c8', grow: 220 });
  }
  function updateStorm(dt, mx, my) {
    const P = G.player, s = G.stats, DUR = 3.0;
    P.t += dt;
    P.x += mx * s.spd * 1.2 * dt; P.y += my * s.spd * 1.2 * dt;
    if (mx || my) P.walk += dt * 12;
    P.spin += dt * 26 * (P.face > 0 ? 1 : -1);
    P.blade = P.spin; P.blade2 = P.spin + Math.PI;
    P.trail.push({ a: P.blade, t: 0.12 }); P.trail2.push({ a: P.blade2, t: 0.12 });
    if (Math.random() < 0.9) { const a = rand(0, TAU), r = rand(20, 46); G.parts.push({ x: P.x + Math.cos(a) * r, y: P.y - 8 + Math.sin(a) * r * 0.6, vx: -Math.sin(a) * 120, vy: Math.cos(a) * 70, t: 0.3, c: pick(['#9ff0c8', '#e8fff4', '#3aa070']), g: 0, glow: Math.random() < 0.3 }); }
    P.stormTick -= dt;
    if (P.stormTick <= 0) {
      P.stormTick = 0.1; sfx('swing');
      for (const e of G.enemies) if (!e.dead && dist(e, P) < 58 + e.r) damageEnemy(e, 0.42, { grogi: 3, kb: 40, ang: angTo(P, e), stagger: 0.15, gauge: 0, noStop: true });
    }
    if (P.t >= DUR) {
      P.state = 'idle';
      G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 12, t: 0.45, max: 0.45, c: '#9ff0c8', grow: 260 });
      G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 8, t: 0.3, max: 0.3, c: '#ffffff', grow: 180 });
      for (let i = 0; i < 6; i++) G.fx.push({ kind: 'arcwave', x: P.x, y: P.y - 6, ang: i / 6 * TAU, arc: 50 * DEG, r0: 12, r1: 80, t: 0.3, max: 0.3, c: '120,255,180' });
      for (const e of G.enemies) if (!e.dead && dist(e, P) < 82 + e.r) damageEnemy(e, 1.6, { grogi: 20, kb: 240, ang: angTo(P, e), heavy: true, stagger: 0.7, gauge: 0 });
      crack(P.x, P.y); addShake(7); flashT = 0.1; flashColor = '#9ff0c8'; sfx('heavy');
    }
  }


  // ================================================================ 마법사 · 사제 · 거너
  const RANGED = () => G.cls === 'mage' || G.cls === 'gunner';
  // v0.72 직업 밸런스: 원거리는 안전한 대신 화력을 낮추고, 근접은 직업 패시브로 버티게 (v2.23 기사 흘려내기 · 암살자 베어내기 · 사제 신의 가호)
  const GUN_RELOAD = 1.2, GUN_MAG = 5, GUN_RANGE = 400;        // 거너: 5발 발사 후 총을 두 바퀴 돌려 장전
  const MAGE_MANA_MAX = 100, MAGE_BOLT_COST = 20, MAGE_MANA_REGEN = 32;
  const MELEE_DR = 0.9;                                        // v2.23~24 직업 패시브: 피격 10% 흘려냄 · 처치 회복 없음
  const RANGED_HB = 5; // v2.25 원거리(거너 탄·마법사 탄)만 적 판정 +5px
  const SURGE_T = 3; // v2.24 마법사 마나 격류: 점멸 뒤 3초
  const meleeKeep = () => { const P = G.player, c = G.cls; if (P.counterT > 0) return 0.7; // v2.33 반격 시간: 직업 회피 판정 30%
    if (c === 'mage') return P.surgeT > 0 ? MELEE_DR : 1; if (c === 'ranger') return P.state === 'attack' ? MELEE_DR : 1; return MELEE_DR; }; // 기사 흘려내기 · 사제 신의 가호 · 거너 교활(상시) · 암살자 베어내기(평타 중) · 마법사 마나 격류(점멸 뒤)
  const heroHand = () => { const P = G.player; return { x: P.x + P.face * 7 - Math.cos(P.blade) * (P.recoil || 0) * 4, y: P.y - 5 - Math.sin(P.blade) * (P.recoil || 0) * 4 }; }; // v2.43 새 정면 도트: 앞발(옆구리) 위치
  // v2.43 공격 모션: 예비동작(움츠리며 뒤로 당김) → 타격(앞으로 늘어나며 내딛음) → 여운(탄성 있게 흔들리며 제자리로)
  function strikePose(t, w, s, r, ang, face, amp) {
    const cx = Math.cos(ang), cy = Math.sin(ang) * 0.6;
    if (t < w) { const k = easeOut(t / w); return { dx: -cx * 2 * k * amp, dy: -cy * 2 * k * amp, sx: 1 + 0.08 * k * amp, sy: 1 - 0.1 * k * amp, rot: -0.16 * face * k }; }
    if (t < w + s) { const k = easeOut((t - w) / s); return { dx: cx * (6 * k - 2) * amp, dy: cy * (6 * k - 2) * amp, sx: 1 + (0.08 + 0.06 * Math.sin(Math.PI * k)) * amp, sy: 1 - (0.1 - 0.04 * k) * amp, rot: (-0.16 + 0.38 * k) * face }; }
    const k = clamp((t - w - s) / Math.max(r, 0.01), 0, 1), d = Math.exp(-4.5 * k) * Math.cos(k * 8);
    return { dx: cx * 4 * amp * d, dy: cy * 4 * amp * d, sx: 1 + 0.08 * amp * d, sy: 1 - 0.06 * amp * d, rot: 0.22 * face * d };
  }
  let PPOSE = null;
  function playerPose() {
    const P = G.player, cls = G.cls; if (P.dead) return null;
    if (P.state === 'attack') { const st = swingTable()[P.combo] || SWING[0]; return strikePose(P.t, st.wind, st.swing, st.rec, P.atkAng, P.face, st.heavy ? 1.4 : 1); }
    if (P.state === 'butt') return strikePose(P.t, 0.05, 0.08, 0.15, P.ang, P.face, 1.2);
    if (P.state === 'krs' || P.state === 'ars' || P.state === 'grs' || P.state === 'mrs' || P.state === 'prs') return SKP.pose(P); // v3.22 기술 공용 몸 동작 (41_krs.js)
    if (P.state === 'rattack' && cls === 'mage') return strikePose(P.t, 0.05, 0.06, 0.16, P.atkAng == null ? P.ang : P.atkAng, P.face, 0.8);
    if (SWAPFX.on()) return SWAPFX.pose(P); // v3.25 무기 바꾸기: 몸 동작
    if (cls === 'gunner' && P.recoil > 0) { const rc = Math.min(2.5, P.recoil), a = P.blade; return { dx: -Math.cos(a) * rc * 2, dy: -Math.sin(a) * rc, sx: 1 - 0.05 * rc, sy: 1 + 0.05 * rc, rot: -0.12 * P.face * rc }; }
    return null;
  }
  const walkFr = P => P.state === 'idle' && P.moving ? Math.floor(time / 0.08) % 4 : P.state === 'idle' && !P.dead && Math.floor(time / 0.6) % 2 ? -2 : -1; // v2.43 월드 플리퍼식 걷기 4프레임 (80ms) · v2.50 멈춰 있으면 0.6초마다 숨 쉬듯 1칸 (-2)
  // v2.50 숨 고르기 장면: 발 두 줄은 그대로 두고 그 바로 위 한 줄을 접어 머리·몸통이 1칸 내려앉음
  const IDLE_ROW = { hKnight: 10, hRanger: 11, hMage: 17, hPriest: 14, hGunner: 12 }; // 접을 몸통 줄 (손·버클·눈 줄은 피함)
  const idleMap = m => { const k = m + 'I'; if (!MAPS[k]) { const R = MAPS[m], H = R.length, r = IDLE_ROW[m] != null ? IDLE_ROW[m] : H - 3; MAPS[k] = ['.'.repeat(R[0].length)].concat(R.slice(0, r), R.slice(r + 1)); PLAYER_MAPS.add(k); } return k; };
  // v2.50 시선: 바라보는 방향(조준·공격 방향)에 좌우 성분이 있으면 눈을 앞쪽으로 1칸 쏠리게 한 도트를 쓴다. 바로 위·아래를 볼 때는 정면 그대로
  const GAZE_EYE = { hKnight: [6, [10, 14], 'S', 'S'], hRanger: [5, [9, 13], 'L', 'm'], hMage: [10, [10, 14], 'o', 'W'], hPriest: [8, [9, 13], 'S', 'S'] }; // [윗줄, 눈 열, 윗칸·아랫칸 메울 얼굴색]
  const gazeMap = k => {
    const g = k + 'G'; if (MAPS[g]) return g;
    const base = Object.keys(GAZE_EYE).concat(['hGunner']).find(b => k.startsWith(b)); if (!base) return k;
    const R = MAPS[k].map(r => [...r]), off = /^[.]+$/.test(MAPS[k][0]) ? 1 : 0; // 숨 고르기·걷기 출렁 장면은 한 줄 아래
    if (base === 'hGunner') { const y = 6 + off; R[y][14] = 'Z'; R[y][15] = 'k'; R[y + 1][14] = 'Z'; R[y + 1][15] = 'X'; } // 늑대: 두 눈 모두 흰자는 뒤·동공은 앞
    else { const [y0, cols, f1, f2] = GAZE_EYE[base], y = y0 + off, top = cols.map(c => R[y][c]), bot = cols.map(c => R[y + 1][c]);
      cols.forEach(c => { R[y][c] = f1; R[y + 1][c] = f2; }); cols.forEach((c, i) => { R[y][c + 1] = top[i]; R[y + 1][c + 1] = bot[i]; }); }
    MAPS[g] = R.map(r => r.join('')); PLAYER_MAPS.add(g); return g;
  };
  const gazeSide = P => { const a = P.state === 'attack' || P.state === 'butt' ? P.atkAng : P.ang; return a != null && Math.abs(Math.cos(a)) > 0.38; };
  // v2.95 눈 깜빡임: 가끔 한 번, 두 번에 한 번은 연달아 두 번. 감은 눈은 정면 도트에서 눈 칸만 고침 (숨 고르기·걷기 장면은 한 줄 아래)
  const BLINK_EYE = {
    hKnight: (R, o, d) => [10, 14].forEach(c => { R[6 + o][c + d] = 'S'; }),
    hRanger: (R, o, d) => [9, 13].forEach(c => { R[5 + o][c + d] = 'L'; R[6 + o][c + d] = 'k'; }),
    hMage: (R, o, d) => [10, 14].forEach(c => { R[10 + o][c + d] = 'o'; R[11 + o][c + d] = 'k'; }),
    hPriest: (R, o, d) => [9, 13].forEach(c => { R[8 + o][c + d] = 'S'; R[9 + o][c + d] = 'v'; }),
    hGunner: (R, o) => [9, 10, 14, 15].forEach(c => { R[6 + o][c] = 'g'; R[7 + o][c] = 'k'; }),
  };
  const blinkMap = k => {
    const g = k + 'B'; if (MAPS[g]) return g;
    const base = Object.keys(BLINK_EYE).find(b => k.startsWith(b)); if (!base || !MAPS[k]) return k;
    const R = MAPS[k].map(r => [...r]), off = /^[.]+$/.test(MAPS[k][0]) ? 1 : 0;
    BLINK_EYE[base](R, off, base !== 'hGunner' && k.endsWith('G') ? 1 : 0); MAPS[g] = R.map(r => r.join('')); PLAYER_MAPS.add(g); return g; // 옆을 볼 때(시선 도트)는 눈이 앞으로 1칸
  };
  const heroBlink = P => { if (P.dead || P.hurtT > 0) return false; const t = time % 8.6; return t < 0.12 || (t >= 4.3 && t < 4.42) || (t >= 4.6 && t < 4.72); };
  const heroMap = (k, P) => { const g = gazeSide(P) ? gazeMap(k) : k; return heroBlink(P) ? blinkMap(g) : g; };
  const walkMap = (m, f) => f === -2 ? idleMap(m) : f < 0 ? m : MAPS[m + 'W' + f] ? m + 'W' + f : m; // v2.44 W0·W2가 있으면 그 장면 (기사 망토·고양이 머플러가 휘날림)
  // ================================================================ v2.51 대기 동작: 아무 입력이 없으면 12초부터 고유 동작을 계속 반복, 30초부터 휴식(졸기). 입력하면 바로 끝남
  let IDLE_PING = false; // 키·마우스·터치 입력이 있었음
  const IDLE_T2 = 12, IDLE_T3 = 30;
  const IDLE_SEQ = { // 2단계 [장면, 초]
    knight: [[0, 0.5], [1, 0.5], [0, 0.5], [1, 0.5], [0, 0.5]],
    ranger: [[0, 0.28], [1, 0.28], [0, 0.28], [1, 0.28], [0, 0.28], [1, 0.28]],
    mage: [[0, 0.5], [1, 0.7], [2, 0.6]],
    priest: [[0, 0.7], [1, 0.45], [2, 0.45], [1, 0.45], [2, 0.45]],
    gunner: [[0, 0.1], [1, 0.1], [2, 0.1], [0, 0.1], [1, 0.1], [2, 0.1], [3, 0.9]],
  };
  function idleAct(P) {
    const t = P.idleT || 0; if (t < IDLE_T2 || P.dead || P.state !== 'idle' || P.moving) return null;
    if (t >= IDLE_T3) return { st: 3, f: Math.floor((t - IDLE_T3) / 0.55) % 3 };
    const seq = IDLE_SEQ[G.cls] || []; let u = (t - IDLE_T2) % seq.reduce((n, q) => n + q[1], 0); // v2.51 고유 동작을 쉬지 않고 이어 가다가 30초에 졸기로
    for (const [f, d] of seq) { if (u < d) return { st: 2, f }; u -= d; }
    return null;
  }
  // 장면 도트: 원래 도트를 고쳐 만든다 (눈 감기·귀 접기·모자 내리기·머리 1칸 내려앉기). 무기·손·Zz는 위에 덧그림
  const IDLE_ED = {
    set: (R, y, x, c) => { if (R[y] && x >= 0 && x < R[y].length) R[y][x] = c; },
    stamp: (R, y, x, rows) => rows.forEach((r, i) => [...r].forEach((c, j) => { if (c !== ' ') IDLE_ED.set(R, y + i, x + j, c); })),
    drop: (R, row) => { R.splice(row, 1); R.unshift(Array(R[0].length).fill('.')); },
    shift: (R, y0, y1, dy) => { const B = R.slice(y0, y1 + 1).map(r => r.slice()); for (let i = y0; i < y0 + dy; i++) R[i] = Array(R[0].length).fill('.'); B.forEach((r, i) => r.forEach((c, j) => { if (c !== '.') R[y0 + i + dy][j] = c; })); },
  };
  const IDLE_EYES = {
    hKnight: R => { const s = IDLE_ED.set; [10, 14].forEach(c => s(R, 6, c, 'S')); [9, 10, 14, 15].forEach(c => s(R, 7, c, 'v')); },
    hRanger: R => { const s = IDLE_ED.set; [9, 13].forEach(c => { s(R, 5, c, 'L'); s(R, 6, c, 'm'); }); [8, 9, 13, 14].forEach(c => s(R, 6, c, 'k')); },
    hPriest: R => { const s = IDLE_ED.set; [9, 13].forEach(c => { s(R, 8, c, 'S'); s(R, 9, c, 'S'); }); [9, 10, 13, 14].forEach(c => s(R, 9, c, 'v')); },
  };
  const earR = R => { for (let y = 0; y < 4; y++) for (let x = 13; x < 17; x++) IDLE_ED.set(R, y, x, '.'); IDLE_ED.stamp(R, 2, 13, ['kkkkk ', 'kqHHHk', 'kqHkkk']); };
  const earL = R => { for (let y = 0; y < 4; y++) for (let x = 6; x < 10; x++) IDLE_ED.set(R, y, x, '.'); IDLE_ED.stamp(R, 2, 4, [' kkkk', 'kHH1k', 'kkk1k']); };
  const IDLE_BOOK = [' kk   kk ', 'keekkkeek', 'kbbekebbk', 'keeekeeek', 'kbbekebbk', 'kpkkkkkpk'];
  const IDLE_BOOK2 = ['     kk  ', ' kk keekk', 'keekkeeek', 'kbbekeebk', 'keeekbeek', 'kbbekeebk', 'kpkkkkkpk'];
  // 장면 정의: ed(R) 도트 고치기, drop 머리 내려앉음, zz Zz 기준칸 [줄, 칸], hand 기사 손 높이
  const IDLE_FR = {
    knight: {
      2: [{ hand: 3 }, { drop: 1, hand: 4 }],
      3: [{ eyes: 1, drop: 1, hand: 4, zz: [0, 18] }, { eyes: 1, hand: 3, zz: [0, 18] }, { eyes: 1, drop: 1, hand: 4, zz: [0, 18] }],
    },
    ranger: {
      2: [{ eyes: 1, ed: R => { IDLE_ED.set(R, 10, 15, 'k'); IDLE_ED.set(R, 10, 16, '.'); IDLE_ED.stamp(R, 7, 12, [' kk', 'kqqk', ' kOk']); IDLE_ED.set(R, 7, 11, 'N'); } },
          { eyes: 1, ed: R => { IDLE_ED.set(R, 10, 15, 'k'); IDLE_ED.set(R, 10, 16, '.'); IDLE_ED.stamp(R, 6, 12, [' kk', 'kqqk', ' kOk', ' kOk']); } }],
      3: [{ eyes: 1, drop: 1, zz: [1, 16] }, { eyes: 1, zz: [1, 16] }, { eyes: 1, drop: 1, zz: [1, 16] }],
    },
    mage: {
      2: [{ ed: R => { IDLE_ED.shift(R, 0, 9, 1); IDLE_ED.set(R, 11, 10, 'W'); IDLE_ED.set(R, 11, 14, 'W'); } },
          { ed: R => { IDLE_ED.shift(R, 0, 9, 1); IDLE_ED.set(R, 11, 10, 'k'); IDLE_ED.set(R, 11, 14, 'k'); } },
          { ed: R => IDLE_ED.stamp(R, 0, 15, [' ky', 'kyyy', ' ky']) }],
      3: [0, 1, 2].map(t => ({ drop: t !== 1, ed: R => { [10, 14].forEach(c => { IDLE_ED.set(R, 10, c, 'o'); IDLE_ED.set(R, 11, c, 'k'); }); }, post: R => { IDLE_ED.stamp(R, (t !== 1 ? 13 : 12) - (t === 2 ? 1 : 0), 15, t === 2 ? IDLE_BOOK2 : IDLE_BOOK); IDLE_ED.set(R, 20, t === 1 ? 22 : 23, 'y'); } })),
    },
    priest: {
      2: [0, 1, 2].map(t => ({ eyes: t >= 1, ed: R => { if (t === 0) earR(R); else { IDLE_ED.stamp(R, 11, 14, ['kk', 'Sk']); const D = [[9, 19], [6, 20], [3, 19]]; for (let i = 0; i < t; i++) { const [y, x] = D[(i + t) % 3]; IDLE_ED.set(R, y, x, 'y'); } } } })),
      3: [0, 1, 2].map(t => ({ eyes: 1, drop: t !== 1, ed: R => { earR(R); earL(R); }, zz: [3, 17] })),
    },
    gunner: {
      2: [{ gun: 'r' }, { gun: 'd' }, { gun: 'u' }, { gun: 'u', smoke: 1 }],
      3: [0, 1, 2].map(t => ({ drop: t !== 1, ed: R => { IDLE_ED.shift(R, 0, 5, 1); IDLE_ED.stamp(R, 7, 9, ['XXXXXXX']); }, post: R => { const a = t === 1 ? 10 : 11; IDLE_ED.stamp(R, a - 1, 9, [' kkkkk ']); IDLE_ED.stamp(R, a, 9, ['kCCCCGk', 'kGCCCCk', 'kkkkkkk']); }, zz: [2, 17] })),
    },
  };
  Object.assign(PAL.hMage, { b: '#e0dce6', y: '#e8c060' }); Object.assign(PAL.hPriest, { y: '#e8c060' });
  const IDLE_BASE = { knight: 'hKnight', ranger: 'hRanger', mage: 'hMage', priest: 'hPriest', gunner: 'hGunner' };
  function idleFrame(P) {
    const a = idleAct(P); if (!a) return null;
    const cls = G.cls, F = ((IDLE_FR[cls] || {})[a.st] || [])[a.f]; if (!F) return null;
    const base = IDLE_BASE[cls], key = base + 'A' + a.st + a.f;
    if (!MAPS[key]) {
      const R = MAPS[base].map(r => [...r]);
      if (F.eyes && IDLE_EYES[base]) IDLE_EYES[base](R);
      if (F.ed) F.ed(R);
      if (F.drop) IDLE_ED.drop(R, IDLE_ROW[base]);
      if (F.post) F.post(R);
      MAPS[key] = R.map(r => r.join('')); PLAYER_MAPS.add(key);
    }
    return { key, F, a };
  }
  // 도트 칸 → 화면 좌표 (drawSprite와 같은 기준: 발밑 가운데, 좌우 반전)
  function idleCell(key, X, Y, flip, cy, cx) {
    const W = MAPS[key][0].length * 2, H = MAPS[key].length * 2, hw = Math.floor(W / 2);
    return { x: flip ? X + hw - (cx + 1) * 2 : X - hw + cx * 2, y: Y - H + cy * 2 };
  }
  const IDLE_ZS = ['ZZZZ', '..Z.', '.Z..', 'ZZZZ'], IDLE_ZB = ['ZZZZZ', '...Z.', '..Z..', '.Z...', 'ZZZZZ'];
  function idleGlyph(x, y, sh) { // 한 톤 + 검정 외곽(상하좌우)
    ctx.fillStyle = '#0b0a0e';
    sh.forEach((r, i) => [...r].forEach((c, j) => { if (c === 'Z') for (const [dy, dx] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const q = (sh[i + dy] || '')[j + dx]; if (q !== 'Z') ctx.fillRect(x + (j + dx) * 2, y + (i + dy) * 2, 2, 2); } }));
    ctx.fillStyle = '#e8e4f0';
    sh.forEach((r, i) => [...r].forEach((c, j) => { if (c === 'Z') ctx.fillRect(x + j * 2, y + i * 2, 2, 2); }));
  }
  function idleZz(fr, X, Y, flip) {
    if (!fr.F.zz) return; const [hy, hx] = fr.F.zz, t = fr.a.f;
    const put = (cy, cx, sh) => { const w = sh[0].length + 2, c = idleCell(fr.key, X, Y, flip, cy, flip ? cx + w - 1 : cx); idleGlyph(c.x + 2, c.y + 2, sh); };
    if (t === 0) put(hy - 5, hx, IDLE_ZS);
    if (t === 1) { put(hy - 6, hx + 1, IDLE_ZS); put(hy - 10, hx + 5, IDLE_ZB); }
    if (t === 2) { put(hy - 7, hx + 2, IDLE_ZS); put(hy - 12, hx + 6, IDLE_ZB); }
  }
  // 기사: 들고 있는 무기를 몸 앞에 꽂아 둠(땅 아래는 잘라서 박힌 것처럼). 손은 얹지 않음
  function idleKnightBlade(fr, tex, X, Y, flip, alpha) {
    const h = 3, a = idleCell(fr.key, X, Y, flip, h + 1, 21), b = idleCell(fr.key, X, Y, flip, h + 1, 22); // 꽂힌 무기는 숨쉬기와 상관없이 제자리
    const gx = (a.x + b.x) / 2 + 1, gy = a.y + 1;
    ctx.save(); ctx.beginPath(); ctx.rect(gx - 200, gy - 200, 400, Y - (gy - 200)); ctx.clip();
    drawBlade(tex, gx, gy, Math.PI / 2, alpha); ctx.restore();
  }
  // 거너: 짧은 총은 손가락으로 돌리고, 긴 총은 어깨에 걸침. 마지막 장면은 총구 연기
  function idleGun(fr, tex, h, P, alpha, back) {
    const short = (tex.reach || 40) <= 28, g = fr.F.gun, f = P.face;
    if (back !== !short) { if (back || !fr.F.smoke) return; } // 긴 총은 몸 뒤(어깨), 짧은 총은 손 앞 · 연기는 늘 앞
    const ang = short ? (g === 'r' ? (f > 0 ? 0 : Math.PI) : g === 'd' ? Math.PI / 2 : -Math.PI / 2) : (f > 0 ? -2.0 : -(Math.PI - 2.0));
    if (!short) h = { x: h.x - f * 2, y: h.y - 6 };
    if (back === !short) drawBlade(tex, h.x, h.y, ang, alpha);
    if (fr.F.smoke && !back) { const L = Math.min(tex.reach || 30, short ? 24 : 40), mx = snap2(h.x + Math.cos(ang) * L), my = snap2(h.y + Math.sin(ang) * L), k = Math.floor(time / 0.15) % 3;
      ctx.fillStyle = '#b8b8c4'; [[0, -2], [2, -4], [2, -6], [0, -8]].slice(0, 2 + k).forEach(([dx, dy]) => ctx.fillRect(mx + dx * f, my + dy * 2 - 2, 2, 2)); }
  }
  function staffTip() { const P = G.player, h = heroHand(); return { x: h.x + Math.cos(P.blade) * 30, y: h.y + Math.sin(P.blade) * 30 }; }
  function goldCasing() { const P = G.player, h = heroHand(); if (typeof CASING !== 'undefined') CASING.spawn('gold', h.x, h.y, P.y, P.ang); } // v3.16 그레이브 금색 탄피 (작살총 제외)
  function muzzle() { const P = G.player, h = heroHand(); return { x: h.x + Math.cos(P.blade) * 37, y: h.y - 2 + Math.sin(P.blade) * 37 }; }
  // 직선 위의 적 (along 순 정렬)
  function rayHits(x, y, ang, len, w) {
    const ux = Math.cos(ang), uy = Math.sin(ang), out = [];
    for (const e of G.enemies) {
      if (e.dead) continue;
      const ey = e.y - (e.tall ? e.tall * 0.3 : e.type === 'boss' ? 18 : isElite(e) ? 12 : 8);
      const dx = e.x - x, dy = ey - y, along = dx * ux + dy * uy, perp = Math.abs(dx * uy - dy * ux);
      if (along > -4 && along < len && perp < w + e.r + RANGED_HB) out.push({ e, along }); // v2.25 원거리 판정 여유
    }
    return out.sort((a, b) => a.along - b.along);
  }
  function rayEnd(x, y, ang, len) {
    // 전장 벽에서 멈춘다
    const ux = Math.cos(ang), uy = Math.sin(ang); let L = len;
    if (ux > 0) L = Math.min(L, (A.x1 + 10 - x) / ux); if (ux < 0) L = Math.min(L, (A.x0 - 10 - x) / ux);
    if (uy > 0) L = Math.min(L, (A.y1 + 10 - y) / uy); if (uy < 0) L = Math.min(L, (A.y0 - 40 - y) / uy);
    if (G && G.obs && G.obs.length) for (let k = 6; k < L; k += 5) if (solidAt(x + ux * k, y + uy * k + 10)) { L = k; break; }
    return Math.max(0, L);
  }

  // ---------- 공용: 원거리 기본 공격
  function startRanged() {
    const P = G.player;
    if (G.cls === 'gunner') {
      const near = G.enemies.find(e => !e.dead && dist(e, P) < 30 + e.r && Math.abs(angDiff(angTo(P, e), P.ang)) < 1.3);
      if (near) return startButt();
      if (P.reload > 0 || G.harp) return; // 작살이 나가 있으면 못 쏜다
      if (P.ammo <= 0) { startReload(); return; }
      if (G.tut && G.tut.step === 1) G.tut.atkN++;
      return fireMusket();
    }
    P.state = 'rattack'; P.t = 0; P.fired = false; P.atkAng = P.ang;
  }
  function updateRanged(dt, mx, my, hold) {
    const P = G.player, s = G.stats;
    P.t += dt;
    P.x += mx * s.spd * 0.55 * dt; P.y += my * s.spd * 0.55 * dt;
    if (mx || my) P.walk += dt * 8;
    if (G.tut && G.tut.step === 1) G.tut.atkN++;
    if (G.cls === 'mage') {
      P.blade = lerpAng(P.blade, P.ang, dt * 28);
      if (!P.fired && P.t >= 0.05) { P.fired = true; castBolt(); }
      if (P.t >= 0.27) { P.state = 'idle'; if (hold) startRanged(); }
    } else {
      P.blade = P.reload > 0 ? P.ang + (1 - P.reload / (P.reloadMax || GUN_RELOAD)) * TAU * 2 : lerpAng(P.blade, P.ang, dt * 20);
      if (P.t >= gunRate()) P.state = 'idle'; // 현재 연사속도의 절반으로 조정 · v2.16 무기별 연사 간격
    }
  }

  // ---------- 마법사
  function rangedWave() { BDC.onAttack(); /* v3.18 칼날카드 */ const P = G.player; if (G.stats.efx.has('wave3') && ((P.shotN = (P.shotN || 0) + 1) % 3 === 0)) fireWave(P.ang); }
  function castBolt() { rangedWave();
    const P = G.player; P.boltN = (P.boltN || 0) + 1; // v1.76 마력 소모 없음 (다른 PC v1.69 이식)
    const big = P.boltN % 3 === 0, tp = staffTip();
    const em = engShotMods(), foc = engFocus(G.engFoc) ? G.engFoc : null; if (foc) { foc.focusUsed = true; em.mul *= 1.4; em.big = true; } // v2.41 빛의 각인
    G.mproj.push({ kind: 'bolt', x: tp.x, y: tp.y, ang: engAim(tp.x, tp.y, P.ang), sp: big ? 360 : 420, t: 0.72, r: (big ? 7 : 4) * (em.big ? 1.6 : 1), coef: (big ? 1.2 * (uncK() === 'mage11' ? 1.15 : 1) : 0.66) * em.mul, big: big || em.big, hist: [], pierce: em.pierce, foc, hitS: new Set() }); engMainShot(tp.x, tp.y, P.ang, big ? 1.2 : 0.66); // v0.72 밸런스: 0.78/1.4 → 0.66/1.2 (v1.77 90% 하향 되돌림), 사거리 약 300px
    sfx(big ? 'boltBig' : 'bolt');
    G.fx.push({ kind: 'castfx', x: tp.x, y: tp.y, r: big ? 24 : 16, t: 0.2, max: 0.2, col: '#e8c8ff' }); // v2.50 도트 시전 섬광
  }
  function castFireball() {
    if (wSkill() === 'ladle') return castSoup(); // v2.08 국자
    const P = G.player, tp = staffTip(), n = G.stats.fx.has('ashstar') ? 3 : 1;
    P.blade = P.ang;
    for (let i = 0; i < n; i++) {
      const a = P.ang + (i - (n - 1) / 2) * 0.3;
      G.mproj.push({ kind: 'fireball', x: tp.x, y: tp.y, ang: a, sp: 300, t: 0.95, r: 9, coef: 2.2, br: (n > 1 ? 54 : 66) * (uncK() === 'mage12' ? 1.15 : 1), hist: [] });
    }
    if (wSkill() === 'mirror' || pasRoll('mirror')) { const mx = P.x - Math.cos(P.ang) * 42, my = P.y - Math.sin(P.ang) * 30; G.mproj.push({ kind: 'fireball', x: mx, y: my - 10, ang: P.ang, sp: 300, t: 1.1, r: 9, coef: 2.2, br: 66, hist: [] }); G.fx.push({ kind: 'ghost', x: mx, y: my, face: P.face, rot: 0, t: 0.5, max: 0.5, tint: true }); } // v2.08 거울 분신
    P.state = 'rattack'; P.t = 0.08; P.fired = true;
    sfx('fireball'); addShake(2, P.ang + Math.PI);
    G.fx.push({ kind: 'castfx', x: tp.x, y: tp.y, r: 26, t: 0.22, max: 0.22, col: '#ffc070' }); // v2.50 도트 시전 섬광
  }
  function fireBlast(x, y, r, coef, burn) {
    sfx('blast'); addShake(5); flashT = Math.max(flashT, 0.04); flashColor = '#ffb060';
    G.fx.push({ kind: 'boom', x, y, r, t: 0.45, max: 0.45 });
    G.fx.push({ kind: 'ring', x, y, r: 6, grow: r * 3.6, t: 0.25, max: 0.25, c: '#ffd080' });
    for (let i = 0; i < 22; i++) { const a = rand(0, TAU), sp = rand(40, 170); G.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 30, t: rand(0.3, 0.7), c: pick(['#ffb060', '#ff6a2a', '#ffe0a0', '#a3161c']), g: 120, glow: true }); }
    splat(x, y, 8, '24,14,10');
    for (const e of G.enemies) {
      if (e.dead || Math.hypot(e.x - x, (e.y - 8 - y) * 1.15) > r + e.r) continue;
      damageEnemy(e, coef, { ang: Math.atan2(e.y - y, e.x - x), grogi: 10, kb: 150, heavy: true, stagger: 0.5, gauge: 4 });
      addBurn(e, burn || 3, 0.22);
    }
  }
  function addBurn(e, dur, coef) { if (e.dead) return; e.burnT = Math.max(e.burnT || 0, dur); e.burnCoef = Math.max(e.burnCoef || 0, coef); if (!(e.burnTick > 0)) e.burnTick = 0.5; }
  function startMeteor() {
    const P = G.player;
    P.gauge = 0; P.state = 'cast'; P.t = 0; P.combo = 0;
    let tx, ty;
    const te = touchAim();
    if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; } else if (te) { tx = te.x; ty = te.y; } else { tx = P.x + Math.cos(P.ang) * 150; ty = P.y + Math.sin(P.ang) * 150; }
    const d = Math.hypot(tx - P.x, ty - P.y); if (d > 280) { tx = P.x + (tx - P.x) / d * 280; ty = P.y + (ty - P.y) / d * 280; }
    tx = clamp(tx, A.x0 + 20, A.x1 - 20); ty = clamp(ty, A.y0 + 20, A.y1 - 20);
    G.meteor = { x: tx, y: ty, t: 0, dur: 1.0, r: 120, fell: false, post: 0 };
    flashT = 0.1; flashColor = '#ffb060'; sfx('awaken'); addShake(3);
  }
  function updateCast(dt) {
    const P = G.player; P.t += dt;
    P.blade = lerpAng(P.blade, -Math.PI / 2 + P.face * 0.15, dt * 14);
    const tp = staffTip();
    if (Math.random() < 0.9) { const a = rand(0, TAU), r = rand(14, 30); G.parts.push({ x: tp.x + Math.cos(a) * r, y: tp.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, t: 0.22, c: pick(['#ffb060', '#c890ff', '#fff0d0']), g: 0, glow: true }); }
    if (P.t >= 1.05) P.state = 'idle';
  }
  function updateMeteor(dt) {
    const m = G.meteor; if (!m) return;
    m.t += dt;
    if (!m.fell) {
      const k = m.t / m.dur, mx = m.x - (1 - k) * 160, my = m.y - (1 - k) * 420;
      for (let i = 0; i < 3; i++) G.parts.push({ x: mx + rand(-8, 8), y: my + rand(-8, 8), vx: rand(-20, 20) - 60, vy: rand(-60, -20), t: rand(0.3, 0.6), c: pick(['#ffb060', '#ff6a2a', '#5b5560', '#ffe0a0']), g: 0, glow: Math.random() < 0.6 });
      if (m.t >= m.dur) {
        m.fell = true;
        if (wSkill() === 'ashstar2') { G.mmet = G.mmet || []; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + rand(-0.3, 0.3), r = rand(70, 110); G.mmet.push({ x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r * 0.7, d: 0.25 + i * 0.09 }); } } // v2.08
        sfx('blast'); sfx('heavy'); addShake(14); flashT = 0.2; flashColor = '#fff0d0'; /* v1.08 역경직 제거 */
        G.fx.push({ kind: 'boom', x: m.x, y: m.y, r: m.r, t: 0.7, max: 0.7 });
        G.fx.push({ kind: 'ring', x: m.x, y: m.y, r: 10, grow: 520, t: 0.35, max: 0.35, c: '#ffd080' });
        G.fx.push({ kind: 'ring', x: m.x, y: m.y, r: 10, grow: 300, t: 0.5, max: 0.5, c: '#ff6a2a' });
        G.fx.push({ kind: 'skybeam', x: m.x, y: m.y, w: 60, c: '255,150,70', t: 0.5, max: 0.5 });
        for (let i = 0; i < 3; i++) crack(m.x + rand(-30, 30), m.y + rand(-16, 16));
        splat(m.x, m.y, 30, '20,12,10');
        for (let i = 0; i < 60; i++) { const a = rand(0, TAU), sp = rand(60, 300); G.parts.push({ x: m.x, y: m.y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 60, t: rand(0.4, 1.0), c: pick(['#ffb060', '#ff6a2a', '#ffe0a0', '#5b5560', '#3a3540']), g: 260, floor: m.y + rand(-20, 20), glow: Math.random() < 0.5 }); }
        for (const e of G.enemies) {
          if (e.dead || Math.hypot(e.x - m.x, (e.y - m.y) * 1.15) > m.r + e.r) continue;
          damageEnemy(e, 5.0 * (1 + pasV('meteor')), { ang: Math.atan2(e.y - m.y, e.x - m.x), grogi: 45, kb: 320, heavy: true, stagger: 1.0, gauge: 0 });
          addBurn(e, 4, 0.35);
        }
      }
    } else { m.post += dt; if (m.post > 0.7) G.meteor = null; }
  }
  function updateMProj(dt) {
    for (const pr of G.mproj) {
      pr.hist.push({ x: pr.x, y: pr.y }); if (pr.hist.length > 7) pr.hist.shift();
      if (pr.kind === 'bolt') { // 약한 유도
        let best = null, bd = 170;
        for (const e of G.enemies) {
          if (e.dead) continue;
          const d = Math.hypot(e.x - pr.x, e.y - 8 - pr.y);
          if (d < bd && Math.abs(angDiff(Math.atan2(e.y - 8 - pr.y, e.x - pr.x), pr.ang)) < 0.9) { bd = d; best = e; }
        }
        if (best) pr.ang = lerpAng(pr.ang, Math.atan2(best.y - 8 - pr.y, best.x - pr.x), dt * 3.2);
        if (G.eng && engHas('r_r1')) { let bb = null, bd2 = 280; for (const e of G.enemies) { if (e.dead || !(e.brand > 0)) continue; const d = Math.hypot(e.x - pr.x, e.y - 8 - pr.y); if (d < bd2 && Math.abs(angDiff(Math.atan2(e.y - 8 - pr.y, e.x - pr.x), pr.ang)) < 1.3) { bd2 = d; bb = e; } } if (bb) pr.ang = lerpAng(pr.ang, Math.atan2(bb.y - 8 - pr.y, bb.x - pr.x), dt * (engDone('r_r1') ? 12 : 6)); } // v2.41 조준 낙인
      }
      const ox = pr.x, oy = pr.y; pr.x += Math.cos(pr.ang) * pr.sp * dt; pr.y += Math.sin(pr.ang) * pr.sp * dt; pr.t -= dt;
      const fire = pr.kind === 'fireball';
      if (Math.random() < (fire ? 1 : 0.6)) G.parts.push({ x: pr.x + rand(-2, 2), y: pr.y + rand(-2, 2), vx: -Math.cos(pr.ang) * 30 + rand(-15, 15), vy: -Math.sin(pr.ang) * 30 + rand(-25, 0), t: rand(0.2, 0.4), c: fire ? pick(['#ffb060', '#ff6a2a', '#ffe0a0']) : pick(['#c890ff', '#f0d8ff', '#8a5aa8']), g: 0, glow: true });
      let hitE = null;
      for (const e of G.enemies) if (!e.dead && !(pr.hitS && pr.hitS.has(e)) && Math.hypot(e.x - pr.x, e.y - 8 - pr.y) < pr.r + e.r + RANGED_HB) { hitE = e; break; } // v2.25 원거리 판정 여유
      if (!fire && G.eng) engRefract(ox, oy, pr.x, pr.y, pr.ang, pr.coef); // v2.41 굴절
      const wall = pr.x < A.x0 || pr.x > A.x1 || pr.y < A.y0 - 20 || pr.y > A.y1 || segSolid(ox, oy + 8, pr.x, pr.y + 8);
      if (wall) hitCrack(pr.x, pr.y + 8, fire ? 3 : 1, fire ? 60 : 34);
      if (wall && !hitE && !fire && !pr.refl && (wSkill() === 'crystal' || pasRoll('bounce'))) { // v2.08 수정 원석 홀: 한 번 반사
        pr.refl = true; let vx = Math.cos(pr.ang), vy = Math.sin(pr.ang); if (pr.x < A.x0 || pr.x > A.x1) vx = -vx; else if (pr.y < A.y0 - 20 || pr.y > A.y1) vy = -vy; else { vx = -vx; vy = -vy; }
        pr.x = ox; pr.y = oy; pr.ang = Math.atan2(vy, vx); pr.t = Math.max(pr.t, 0.4); pr.hist = []; sparks(pr.x, pr.y, pr.ang, '#9fe8ff', 5); sfx('block', 1.6); continue;
      }
      if (hitE && !fire && !wall && pr.hitS && (pr.pierce || (engHas('r_r2') && hitE.brand > 0))) { pr.hitS.add(hitE); damageEnemy(hitE, pr.coef, { ang: pr.ang, grogi: 0.8, kb: 30, gauge: 1.3, stagger: 0.12, basic: true }); if (pr.foc === hitE && engDone('r_r5') && !hitE.dead) brandBurst(hitE, 0.8); if (!pr.pierce && !engDone('r_r2')) pr.coef *= 0.7; continue; } // v2.41 관통
      if (hitE || wall || pr.t <= 0) {
        if (!fire) mageBoltEnd(pr, hitE);
        if (!fire && G.eng) { if (hitE && pr.foc === hitE && engDone('r_r5')) setTimeout(() => { if (G && !hitE.dead) brandBurst(hitE, 0.4); }, 0); engRewind(pr.x, pr.y, pr.big ? 1.2 : 0.66, !!hitE); } // v2.41
        if (!fire) {
          if (hitE) damageEnemy(hitE, pr.coef, { ang: pr.ang, grogi: pr.big ? 2 : 0.8, kb: pr.big ? 90 : 30, gauge: pr.big ? 2.6 : 1.3, /* v1.76 그로기 5/2→2/0.8, 각성 충전 4/2→2.6/1.3 */ stagger: pr.big ? 0.3 : 0.12, basic: true });
          G.fx.push({ kind: 'ring', x: pr.x, y: pr.y, r: 3, grow: pr.big ? 140 : 70, t: 0.18, max: 0.18, c: '#c890ff' });
          for (let i = 0; i < (pr.big ? 10 : 5); i++) { const a = rand(0, TAU), sp = rand(30, 110); G.parts.push({ x: pr.x, y: pr.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: rand(0.15, 0.35), c: pick(['#c890ff', '#f0d8ff']), g: 0, glow: true }); }
        } else fireBlast(pr.x, pr.y + 8, pr.br, pr.coef);
        pr.dead = true;
      }
    }
    G.mproj = G.mproj.filter(p => !p.dead);
    // 화상
    for (const e of G.enemies) if (!e.dead && e.burnT > 0) {
      e.burnT -= dt; e.burnTick -= dt;
      if (Math.random() < dt * 12) G.parts.push({ x: e.x + rand(-6, 6), y: e.y - rand(4, 20), vx: rand(-5, 5), vy: rand(-40, -20), t: rand(0.2, 0.45), c: pick(['#ffb060', '#ff6a2a', '#ffe0a0']), g: 0, glow: true });
      if (e.burnTick <= 0) { e.burnTick = 0.5; damageEnemy(e, e.burnCoef, { noStop: true, dot: true, gauge: 0.6, ang: 0 }); }
    }
  }
  function drawMProj(pr) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const fire = pr.kind === 'fireball', c1 = fire ? '255,140,60' : '190,120,255';
    pr.hist.forEach((q, i) => { const k = (i + 1) / pr.hist.length; ctx.fillStyle = `rgba(${c1},${0.45 * k})`; ctx.beginPath(); ctx.arc(q.x, q.y, pr.r * (0.4 + 0.6 * k), 0, TAU); ctx.fill(); });
    ctx.fillStyle = `rgba(${c1},0.9)`; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, TAU); ctx.fill();
    ctx.fillStyle = fire ? 'rgba(255,240,200,1)' : 'rgba(250,235,255,1)'; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r * 0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // v1.68 운석 마법진: 2px 칸으로 찍는 이중 고리 + 돌아가는 룬 띠 + 서로 반대로 도는 두 삼각형(육망성) + 안쪽 고리·문장. 회전은 1/96바퀴씩 칸 단위
  const MRUNE = [[[1, 0, 1], [0, 1, 0], [1, 0, 1]], [[1, 1, 1], [0, 1, 0], [0, 1, 0]], [[1, 0, 0], [1, 1, 0], [1, 0, 1]], [[0, 1, 0], [1, 1, 1], [0, 1, 0]], [[1, 1, 0], [0, 1, 1], [0, 0, 1]], [[1, 0, 1], [1, 1, 1], [1, 0, 1]]];
  // v2.19 마법진의 움직이지 않는 부분(디더 채움·고리·가운데 표식)은 캔버스에 한 번 그려 두고 찍는다
  const MC_CACHE = new Map();
  function mcStatic(r, o) {
    const fq = Math.round((o.fill || 0) * 10) / 10, lq = Math.round((o.fillLv || 0) * 20) / 20, /* 단계를 굵게 — 떨어지는 동안 다시 그리는 횟수를 줄인다 */ key = [r, fq, lq, o.c1, o.c2, o.c3, o.c4].join('|');
    let st = MC_CACHE.get(key); if (st) return st; if (MC_CACHE.size > 48) MC_CACHE.clear();
    const h = (Math.ceil(r / 2) + 8) * 2, [c, g] = mkCanvas(h * 2, h * 2), sq = 0.87;
    const C = (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x) & ~1, Math.round(y) & ~1, 2, 2); };
    const ring = (R, col, dash) => { const n = Math.max(24, Math.round(TAU * R / 2)); for (let i = 0; i < n; i++) { if (dash && (i % dash) >= dash / 2) continue; const a = i / n * TAU; C(h + Math.cos(a) * R, h + Math.sin(a) * R * sq, col); } };
    if (fq > 0) for (let y = -r * sq; y <= r * sq; y += 2) for (let x = -r; x <= r; x += 2) { const d = Math.hypot(x / r, y / (r * sq)); if (d <= fq && dith((h + x) >> 1, (h + y) >> 1, lq * (1 - d * 0.5))) C(h + x, h + y, o.c3); }
    ring(r, o.c1); ring(r - 9, o.c1); ring(r + 4, o.c2, 6); ring(r * 0.36, o.c1); ring(r * 0.28, o.c2, 4);
    C(h, h, o.c4); C(h - 2, h, o.c1); C(h + 2, h, o.c1); C(h, h - 2, o.c1); C(h, h + 2, o.c1);
    st = { c, h }; MC_CACHE.set(key, st); return st;
  }
  function magicCircle(cx, cy, r, o) {
    const C = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x) & ~1, Math.round(y) & ~1, 2, 2); }, sq = 0.87, q = a => Math.round(a / TAU * 96) / 96 * TAU;
    const ring = (R, col, dash) => { const n = Math.max(24, Math.round(TAU * R / 2)); for (let i = 0; i < n; i++) { if (dash && (i % dash) >= dash / 2) continue; const a = i / n * TAU; C(cx + Math.cos(a) * R, cy + Math.sin(a) * R * sq, col); } };
    const line = (x0, y0, x1, y1, col) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2); for (let i = 0; i <= n; i++) C(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, col); };
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = o.alpha;
    { const st = mcStatic(r, o); ctx.drawImage(st.c, snap2(cx) - st.h, snap2(cy) - st.h); } // v2.19 바닥 채움·고리는 미리 그린 그림으로 (매 프레임 칸 수천 개 찍던 것)
    const rot = q(o.rot), rot2 = q(-o.rot * 1.6);
    for (let i = 0; i < 12; i++) { const a = rot + i / 12 * TAU, gx = cx + Math.cos(a) * (r - 4.5), gy = cy + Math.sin(a) * (r - 4.5) * sq, g = MRUNE[i % MRUNE.length];
      for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) if (g[j][k]) C(gx + (k - 1) * 2, gy + (j - 1) * 2, (i + Math.floor(o.t * 6)) % 12 === 0 ? o.c4 : o.c2); }
    for (const [base, rr] of [[rot2, r * 0.74], [rot2 + Math.PI / 3, r * 0.74]]) { const p = [0, 1, 2].map(i => [cx + Math.cos(base + i / 3 * TAU) * rr, cy + Math.sin(base + i / 3 * TAU) * rr * sq]); for (let i = 0; i < 3; i++) line(...p[i], ...p[(i + 1) % 3], o.c2); }
    for (let i = 0; i < 4; i++) { const a = rot + i / 4 * TAU; line(cx + Math.cos(a) * r * 0.06, cy + Math.sin(a) * r * 0.06 * sq, cx + Math.cos(a) * r * 0.26, cy + Math.sin(a) * r * 0.26 * sq, o.c4); }
    ctx.restore();
  }
  function meteorTarget() { const P = G.player; let tx = mouse.x + cam.x, ty = mouse.y + cam.y; const d = Math.hypot(tx - P.x, ty - P.y); if (d > 280) { tx = P.x + (tx - P.x) / d * 280; ty = P.y + (ty - P.y) / d * 280; } return { x: clamp(tx, A.x0 + 20, A.x1 - 20), y: clamp(ty, A.y0 + 20, A.y1 - 20), out: d > 280 }; }
  function drawMeteorAim() { // 조준 중: 보라·하늘빛으로 흐릿하게 커서를 따라옴, 플레이어 둘레에 사거리 점선
    if (!G.meteorAim || !G.player) return;
    const P = G.player, m = meteorTarget(), pulse = 0.55 + 0.15 * Math.sin(time * 6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(160,140,255,.35)';
    for (let i = 0; i < 112; i++) { if (i % 2) continue; const a = i / 112 * TAU; ctx.fillRect(Math.round(P.x + Math.cos(a) * 280) & ~1, Math.round(P.y + Math.sin(a) * 280) & ~1, 2, 2); }
    ctx.restore();
    magicCircle(m.x, m.y, 120, { alpha: pulse + 0.3, rot: time * 0.5, t: time, fill: 1, fillLv: 0.14, c1: '#b898ff', c2: '#7ab8ff', c3: '#4a3a9a', c4: '#f0e8ff' });
    ctx.save(); ctx.font = '8px Galmuri7'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; fillTextW((TOUCH.on ? '탭한 곳에 운석 낙하 · 각성 버튼: 취소' : '클릭: 운석 낙하 · 우클릭/E: 취소'), m.x + 1, m.y + 120 * 0.87 + 15); ctx.fillStyle = '#d8c8ff'; fillTextW((TOUCH.on ? '탭한 곳에 운석 낙하 · 각성 버튼: 취소' : '클릭: 운석 낙하 · 우클릭/E: 취소'), m.x, m.y + 120 * 0.87 + 14); ctx.restore();
  }
  function drawMeteorMark() { // 떨어지는 중: 주황·금빛으로 바뀌고 빨리 돌며 안쪽부터 불이 차오름, 마지막엔 하얗게
    const m = G.meteor; if (!m || m.fell) return;
    const k = Math.min(1, m.t / m.dur), late = k > 0.8;
    magicCircle(m.x, m.y, m.r, { alpha: 0.75 + 0.25 * k, rot: m.t * (2 + k * 6), t: m.t * 2, fill: k, fillLv: 0.18 + 0.3 * k, c1: late && Math.floor(time * 30) % 2 ? '#fff0d0' : '#ffd080', c2: '#ff8a3a', c3: '#a0300e', c4: '#fff4d0' });
  }
  function drawMeteorRock() {
    const m = G.meteor; if (!m || m.fell) return;
    const k = m.t / m.dur, mx = m.x - (1 - k) * 160, my = m.y - (1 - k) * 420, R = 12 + k * 8;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = dLinear(ctx, mx - 120, my - 300, mx, my);
    gr.addColorStop(0, 'rgba(255,120,40,0)'); gr.addColorStop(1, 'rgba(255,170,80,.75)');
    ctx.strokeStyle = gr.p(ctx, mx - 64 - R * 1.6, my - 168 - R * 1.6, 64 + R * 3.2, 168 + R * 3.2); ctx.lineWidth = R * 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(mx - 64, my - 168); ctx.lineTo(mx, my); ctx.stroke();
    ctx.fillStyle = 'rgba(255,170,80,.6)'; ctx.beginPath(); ctx.arc(mx, my, R * 1.6, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#2a2026'; ctx.beginPath(); ctx.arc(mx, my, R, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5b4a50'; ctx.beginPath(); ctx.arc(mx - R * 0.25, my - R * 0.25, R * 0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb060'; ctx.fillRect(Math.round(mx + R * 0.2), Math.round(my), 3, 2); ctx.fillRect(Math.round(mx - R * 0.5), Math.round(my + R * 0.3), 2, 2);
  }

  // ---------- 사제
  const SWING_P = [
    { wind: 0.06, swing: 0.1, rec: 0.16, a0: -120, a1: 95, reach: 40, coef: 0.95, grogi: 5, kb: 70, gauge: 4, lunge: 70 },
    { wind: 0.05, swing: 0.1, rec: 0.16, a0: 105, a1: -110, reach: 40, coef: 1.0, grogi: 5, kb: 70, gauge: 4, lunge: 70 },
    { wind: 0.14, swing: 0.12, rec: 0.26, a0: -175, a1: 35, reach: 44, coef: 1.5, grogi: 12, kb: 160, gauge: 6, lunge: 50, heavy: true, stagger: 0.5, slam: true },
  ];
  var SWING_PW = SWING_P.map((o, i) => Object.assign({}, o, { reach: 62, kb: 40, swing: o.swing + 0.03 }, [{ a0: -125, a1: 15 }, { a0: 115, a1: -15 }, { a0: -180, a1: 200, swing: 0.34, slam: false, kb: 120 }][i])); // v2.18 고해의 채찍: 길게 감아 때림 · v2.19 3타는 한 바퀴 돌며 주변을 감싼다
  function holySlam(x, y) {
    const big = wSkill() === 'bellh', R = big ? 112 : 56 * (1 + pasV('wave3')); if (big) { G.fx.push({ kind: 'ring', x, y, r: 10, grow: 420, t: 0.4, max: 0.4, c: '#e8c070' }); sfx('grogi', 0.6); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; dust(x + Math.cos(a) * 80, y + Math.sin(a) * 40, 3); } }
    G.fx.push({ kind: 'ring', x, y, r: 6, grow: 200, t: 0.28, max: 0.28, c: '#ffe39a' });
    G.fx.push({ kind: 'skybeam', x, y, w: 16, c: '255,225,140', t: 0.35, max: 0.35 });
    for (let i = 0; i < 12; i++) { const a = rand(0, TAU), sp = rand(40, 120); G.parts.push({ x, y: y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - 20, t: rand(0.25, 0.5), c: pick(['#ffe39a', '#fffbe6', '#c9a24a']), g: 0, glow: true }); }
    crack(x, y); sfx('heavy');
    for (const e of G.enemies) if (!e.dead && !G.player.hitSet.has(e) && Math.hypot(e.x - x, e.y - y) < R + e.r) damageEnemy(e, 0.8, { ang: Math.atan2(e.y - y, e.x - x), grogi: 6, kb: 120, stagger: 0.4, gauge: 2, basic: true });
  }
  function castHeal() { rec('p_heal');
    const P = G.player, s = G.stats;
    { let cap = wSkill() === 'reliq' ? 2 : 1; if (cap === 1 && pasO('reliq') && (P.holyArmor || 0) >= 1 && (P.armor || 0) < ARMOR_MAX && pasOnce('reliq')) cap = 2; if ((P.holyArmor || 0) < cap && (P.armor || 0) < ARMOR_MAX) addArmor(1, true); } // v2.15 권능: 하트 회복 대신 빛의 방패 (이 기술로는 1칸, 성유물함 2칸까지)
    if (wSkill() === 'carrot') for (let i = 0; i < 3; i++) (G.wproj = G.wproj || []).push({ k: 'carrotm', x: P.x, y: P.y - 10, ang: P.ang + i * TAU / 3, t: 0.7, hit: new Set() }); // 당근 셋
    if (s.fx.has('dawn')) P.shieldT = 2;
    if (pasO('healShield')) P.shieldT = Math.max(P.shieldT || 0, pasV('healShield')); // v2.22
    P.state = 'pray'; P.t = 0; P.prayDur = 0.38; P.iframe = Math.max(P.iframe, 0.2); P.combo = 0;
    G.fx.push({ kind: 'skybeam', x: P.x, y: P.y, w: 30, c: '255,225,140', t: 0.6, max: 0.6 });
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 6, r: 8, grow: 260, t: 0.32, max: 0.32, c: '#ffe39a' });
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 6, r: 8, grow: 180, t: 0.45, max: 0.45, c: '#7dff8a' });
    for (let i = 0; i < 18; i++) G.parts.push({ x: P.x + rand(-14, 14), y: P.y - rand(0, 10), vx: rand(-10, 10), vy: rand(-70, -30), t: rand(0.5, 0.9), c: pick(['#ffe39a', '#fffbe6', '#7dff8a']), g: 0, glow: true });
    for (const e of G.enemies) if (!e.dead && dist(e, P) < 90 + e.r) damageEnemy(e, 1.1, { ang: angTo(P, e), kb: 200, grogi: 8, stagger: 0.5, gauge: 3, heavy: true });
    sfx('heal'); flashT = 0.06; flashColor = '#ffe39a';
  }
  function startMiracle(revive) {
    const P = G.player, s = G.stats;
    P.gauge = 0; P.miracleT = 3 + pasV('miracle'); /* v2.15 하트 회복 없음 */ P.state = 'pray'; P.t = 0; P.prayDur = 0.7; P.combo = 0;
    slowmo = 0.8; flashT = 0.25; flashColor = '#fffbe6'; sfx('awaken'); sfx('heal'); addShake(6);
    G.eproj = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; G.fx.push({ kind: 'skybeam', x: P.x + Math.cos(a) * 74, y: P.y + Math.sin(a) * 44, w: 16, c: '255,230,150', t: 0.9, max: 0.9 }); }
    G.fx.push({ kind: 'skybeam', x: P.x, y: P.y, w: 70, c: '255,240,190', t: 0.8, max: 0.8 });
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 6, r: 10, grow: 420, t: 0.45, max: 0.45, c: '#fffbe6' });
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 6, r: 10, grow: 260, t: 0.6, max: 0.6, c: '#ffd34d' });
    for (let i = 0; i < 8; i++) G.fx.push({ kind: 'arcwave', x: P.x, y: P.y - 6, ang: i / 8 * TAU, arc: 40 * DEG, r0: 16, r1: 150, t: 0.4, max: 0.4, c: '255,225,140' });
    for (const e of G.enemies) if (!e.dead && dist(e, P) < 150 + e.r) damageEnemy(e, 3.0, { ang: angTo(P, e), grogi: 35, kb: 280, heavy: true, stagger: 1.0, gauge: 0 });
    if (revive) banner('기적', '부활 — 챕터당 1번');
  }
  function updatePray(dt) {
    const P = G.player; P.t += dt;
    P.blade = lerpAng(P.blade, -Math.PI / 2 - P.face * 0.25, dt * 18);
    if (P.t >= (P.prayDur || 0.38)) P.state = 'idle';
  }

  // ---------- 거너
  // v2.14 거너 무기: 장탄 · 재장전 · 사격 방식
  // v2.16 연사 간격(초): 한 발 피해·범위가 큰 무기일수록 느리게 (기본 0.534)
  const GUN_RATE = { revolver: 0.27, blunder: 0.8, cannon: 0.95, puffer: 0.7, longrifle: 0.64, kingrev: 0.534 };
  function gunRate() { return GUN_RATE[wSkill()] || 0.534; }
  function gunMag() { const k = wSkill(); return k === 'harpoon' ? 1 : (k === 'blunder' ? 3 : k === 'revolver' ? 12 : k === 'kingrev' ? 6 : GUN_MAG) + pasV('ammo') + (uncK() === 'gunner13' ? 1 : 0); }
  function startReload() { const P = G.player, k = wSkill(); P.reloadMax = (k === 'revolver' ? 0.7 : k === 'harpoon' ? 0.3 : GUN_RELOAD) * (1 - pasV('reload')); P.reload = P.reloadMax;
    if (k === 'kingrev') { sfx('grogi', 1.3); G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 8, grow: 240, t: 0.35, max: 0.35, c: '#ffd34d' }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; G.parts.push({ x: P.x + Math.cos(a) * 12, y: P.y - 10 + Math.sin(a) * 8, vx: Math.cos(a) * 160, vy: Math.sin(a) * 100, t: 0.3, c: '#ffd34d', g: 0, glow: true }); }
      for (const e of nearFoes(P.x, P.y, 72)) damageEnemy(e, 0.4, { proc: true, kb: 320, ang: angTo(P, e), grogi: 4, gauge: 1 }); } }
  // v2.19 고래 작살총 재설계: 줄 달린 작살이 곧게 뻗어 첫 적을 꿰고, 줄을 감아 돌아온다
  // 작은 적은 내 앞까지 끌려오며 그동안 회피 판정(맞지 않음·행동 불가) · 큰 적은 경직+그로기 · 작살이 돌아와야 다음 발
  const HARP = { range: 230, out: 1150, back: 820, coef: 2.4 };
  function launchHarp(m) { const P = G.player;
    G.harp = { ph: 'out', ang: P.ang, len: 8, max: Math.min(HARP.range, rayEnd(m.x, m.y, P.ang, HARP.range)), e: null, jam: Math.random() < 0.1 }; // v2.32 10% 줄 걸림
    G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang: P.ang, s: 1.2, t: 0.18, max: 0.18 }); sfx('shot', 0.7);
    P.x -= Math.cos(P.ang) * 6; P.y -= Math.sin(P.ang) * 6; }
  function harpRelease(H, stun) { const e = H.e; if (!e) return; e.harpT = 0; if (!e.dead && stun) applySt(e, 'stun', stun); H.e = null; }
  function updateHarp(dt) {
    const H = G.harp, P = G.player;
    if (G.cls !== 'gunner' || wSkill() !== 'harpoon' || P.dead) { harpRelease(H, 0.3); G.harp = null; if (G.cls === 'gunner' && P.ammo <= 0) startReload(); return; }
    const m = muzzle(), ux = Math.cos(H.ang), uy = Math.sin(H.ang);
    if (H.ph === 'out') {
      const nl = Math.min(H.max, H.len + HARP.out * dt), hit = rayHits(m.x, m.y, H.ang, nl, 5).find(h => h.along >= H.len - 10 && !h.e.harpT);
      if (hit) { const e = hit.e, big = e.type === 'boss' || isElite(e) || isSemi(e) || e.tall; H.len = Math.max(8, hit.along); H.ph = 'back';
        damageEnemy(e, HARP.coef, { ang: H.ang, grogi: big ? 12 : 4.5, kb: 0, gauge: 5, stagger: big ? 0.6 : 0.3, heavy: true, basic: true });
        sparks(m.x + ux * H.len, m.y + uy * H.len, H.ang + Math.PI, '#e8ecf0', 7); sfx('block', 0.7);
        if (!e.dead) { if (big) { applySt(e, 'stun', 0.4); G.nums.push({ x: e.x, y: e.y - 30, v: '꿰뚫!', t: 0.6, c: '#cfe6ff', s: 1 }); }
          else { H.e = e; H.oy = e.y - (m.y + uy * H.len); e.harpT = 1; applySt(e, 'stun', 0.5); } } }
      else if (nl >= H.max) { H.len = H.max; H.ph = 'back'; if (H.max < HARP.range - 2) { sparks(m.x + ux * H.len, m.y + uy * H.len, H.ang + Math.PI, '#a8acb4', 4); sfx('block', 1.3); } }
      else H.len = nl;
      return;
    }
    H.len -= HARP.back * dt;
    if (H.e) { const e = H.e, stop = 18 + (e.r || 8);
      if (e.dead) harpRelease(H, 0);
      else { const L = Math.max(H.len, stop), tx = m.x + ux * L, ty = m.y + uy * L + H.oy;
        if (solidAt(tx, ty) || tx < A.x0 + 6 || tx > A.x1 - 6 || ty < A.y0 + 6 || ty > A.y1 - 6) harpRelease(H, 0.4); // 벽에 걸리면 놓친다
        else { e.x = tx; e.y = ty; applySt(e, 'stun', 0.3); if (H.len <= stop) { harpRelease(H, 0.6); sfx('grogi', 1.4); } } } }
    if (H.len <= 0) { G.harp = null; if (H.jam) { P.ammo = 0; P.reload = P.reloadMax = 1.6 * (1 - pasV('reload')); G.nums.push({ x: P.x, y: P.y - 30, v: '줄 걸림!', t: 1, c: '#ff9a7a', s: 1 }); sfx('block', 0.7); } else { P.ammo = gunMag(); sfx('reload'); } } // 돌아오면 바로 다음 발 (총 돌리는 장전 연출 없음)
  }
  function gunHit(e, ang, coef) { // 한 발이 적에게 맞았을 때
    const k = wSkill(), P = G.player;
    damageEnemy(e, coef, { ang, grogi: 4.5, kb: 120, gauge: 5, stagger: 0.4, heavy: true, basic: true });
    if (e.dead) return;
    if (k === 'match') addBurn(e, 3, 0.35);
    if (k === 'puffer') (G.wproj = G.wproj || []).push({ k: 'puffx', x: e.x, y: e.y - 10, t: 0.35 });
  }
  function gunBlast(x, y, R, coef, col) { G.fx.push({ kind: 'ring', x, y: y - 6, r: 6, grow: R * 4.5, t: 0.3, max: 0.3, c: col }); G.fx.push({ kind: 'ring', x, y: y - 6, r: 4, grow: R * 3, t: 0.35, max: 0.35, c: '#fff0d0' }); sfx('blast', 0.9); dust(x, y, 10);
    for (let i = 0; i < 14; i++) { const a = rand(0, TAU), sp = rand(60, 160); G.parts.push({ x, y: y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 30, t: rand(0.25, 0.5), c: pick([col, '#ffd080', '#5b5560']), g: 120 }); }
    for (const e of nearFoes(x, y, R)) damageEnemy(e, coef, { proc: true, ang: Math.atan2(e.y - y, e.x - x), kb: 220, grogi: 6, gauge: 2, heavy: true }); }
  function fireMusket() { rangedWave(); // v1.76 거너 그로기 절반 (사격 9→4.5, 산탄 10→5, 저격 60→30, 개머리판 6→4)
    const P = G.player, k = wSkill();
    P.navyShot = !!P.navyNext; P.navyNext = false; setTimeout(() => { P.navyShot = false; }, 0); // v2.30 해군 머스킷: 재장전 뒤 첫 발
    P.state = 'rattack'; P.t = 0; P.blade = P.ang; P.atkAng = P.ang; P.ammo = Math.max(0, P.ammo - 1); const last = P.ammo === 0; if (last && k !== 'harpoon') startReload(); P.recoil = 1;
    P.gunN = (P.gunN || 0) + 1;
    const m = muzzle();
    if (k !== 'harpoon') goldCasing();
    if (k === 'puffer' && Math.random() < 0.1) { sfx('blip', 0.6); G.nums.push({ x: m.x, y: m.y - 14, v: '퉤!', t: 0.6, c: '#ffd34d', s: 1 }); for (let i = 0; i < 6; i++) G.parts.push({ x: m.x, y: m.y, vx: rand(-40, 40), vy: rand(-80, -30), t: 0.4, c: pick(['#ffe070', '#5a8a9a']), g: 260 }); P.x -= Math.cos(P.ang) * 8; P.y -= Math.sin(P.ang) * 8; return; } // 복어가 싫다고 튕겨 나옴
    if (k === 'cannon') { (G.wproj = G.wproj || []).push({ k: 'ball', x: m.x, y: m.y, ang: P.ang, t: 1.1 }); G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang: P.ang, s: 2, t: 0.18, max: 0.18 }); sfx('shotgun', 0.7); if (!segSolid(P.x, P.y, P.x - Math.cos(P.ang) * 18, P.y - Math.sin(P.ang) * 18)) { P.x -= Math.cos(P.ang) * 18; P.y -= Math.sin(P.ang) * 18; } return; }
    if (k === 'duck') { G.nums.push({ x: m.x, y: m.y - 12, v: '꽥', t: 0.4, c: '#ffe070', s: 1 }); if (P.gunN % 5 === 0) { (G.wproj = G.wproj || []).push({ k: 'duckb', x: m.x, y: m.y, ang: P.ang, t: 0.9 }); sfx('blip', 1.6); return; } }
    if (k === 'harpoon') { launchHarp(m); return; }
    if (k === 'blunder') { for (const da of [-0.2, 0, 0.2]) { const a = P.ang + da, L0 = rayEnd(m.x, m.y, a, 150), h = rayHits(m.x, m.y, a, L0, 6); let L = L0; if (h.length) { L = h[0].along; gunHit(h[0].e, a, 1.1); } gunFx(m, a, L, 0.7); }
      P.x -= Math.cos(P.ang) * 9; P.y -= Math.sin(P.ang) * 9; sfx('shotgun', 1.2); return; }
    const pierce = k === 'longrifle', mul = (k === 'longrifle' ? 1 + Math.min(P.stillT || 0, 1.5) * 0.6 : k === 'revolver' && P.gunN % 2 ? 0.5 : 1) * (last ? 1 + pasV('lastShot') : 1);
    const eAng = engAim(m.x, m.y, P.ang), em = engShotMods(), foc = engFocus(G.engFoc) ? G.engFoc : null; if (foc) { foc.focusUsed = true; em.mul *= 1.4; em.big = true; } // v2.41 빛의 각인
    const hits = rayHits(m.x, m.y, eAng, GUN_RANGE, 5);
    let L = rayEnd(m.x, m.y, eAng, GUN_RANGE); const L0 = L;
    const inR = hits.filter(h => h.along <= L0);
    if (!inR.length) hitCrack(m.x + Math.cos(eAng) * L, m.y + Math.sin(eAng) * L + 10, 1, 34);
    if (inR.length) { if (pierce || em.pierce) { for (const h of inR) gunHit(h.e, eAng, 2.2 * mul * em.mul); } else { let cm = 1; for (const h of inR) { const brd = engHas('r_r2') && h.e.brand > 0; L = h.along; gunHit(h.e, eAng, 2.2 * mul * em.mul * cm); if (!brd) break; cm *= engDone('r_r2') ? 1 : 0.7; } }
      if (foc && engDone('r_r5') && inR.some(h => h.e === foc) && !foc.dead) brandBurst(foc, 0.4); }
    gunFx(m, eAng, L, em.big ? 1.8 : mul > 1.3 ? 1.6 : 1);
    { const ex = m.x + Math.cos(eAng) * L, ey = m.y + Math.sin(eAng) * L; engMainShot(m.x, m.y, eAng, 2.2); engRefract(m.x, m.y, ex, ey, eAng, 2.2); engRewind(ex, ey, 2.2, inR.length > 0); }
    if ((k === 'duck' || pasRoll('gbounce')) && !inR.length && L < GUN_RANGE - 10) { // 한 번 튕김 (v2.22 보관 패시브: 오리 사냥총 6%)
      const ex = m.x + Math.cos(P.ang) * L, ey = m.y + Math.sin(P.ang) * L; let vx = Math.cos(P.ang), vy = Math.sin(P.ang);
      if (ex <= A.x0 || ex >= A.x1) vx = -vx; else if (ey <= A.y0 - 30 || ey >= A.y1) vy = -vy; else if (solidAt(ex + vx * 6, ey + 10)) { if (solidAt(ex + vx * 6, ey + 10 - vy * 6)) vx = -vx; else vy = -vy; } else vx = -vx;
      const a2 = Math.atan2(vy, vx), sx = ex + vx * 4, sy = ey + vy * 4, L2 = rayEnd(sx, sy, a2, GUN_RANGE - L), h2 = rayHits(sx, sy, a2, L2, 5); let LL = L2; if (h2.length) { LL = h2[0].along; gunHit(h2[0].e, a2, 1.8); } gunFx({ x: sx, y: sy }, a2, LL, 0.7); sparks(ex, ey, a2, '#ffe070', 4); }
    if (k === 'kingrev' && last) gunBlast(m.x + Math.cos(P.ang) * L, m.y + Math.sin(P.ang) * L + 8, 52, 2.0, '#ffd34d'); // 마지막 탄 폭발
    P.x -= Math.cos(P.ang) * 5; P.y -= Math.sin(P.ang) * 5;
    sfx('shot', k === 'revolver' ? 1.3 : 1);
  }
  function gunFx(m, ang, L, size) {
    G.fx.push({ kind: 'tracer', x0: m.x, y0: m.y, x1: m.x + Math.cos(ang) * L, y1: m.y + Math.sin(ang) * L, w: 2 * size, t: 0.12 + 0.08 * size, max: 0.12 + 0.08 * size, c: '255,220,150' });
    G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang, s: size, t: 0.18, max: 0.18 });
    for (let i = 0; i < 6 * size; i++) G.parts.push({ x: m.x, y: m.y, vx: Math.cos(ang) * rand(20, 60) + rand(-15, 15), vy: Math.sin(ang) * rand(20, 60) + rand(-25, -5), t: rand(0.4, 0.9), c: pick(['#5b5560', '#8d8496', '#3a3540']), g: -10 });
  }
  function startButt() {
    const P = G.player;
    P.state = 'butt'; P.t = 0; P.atkAng = P.ang; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.sign = P.face;
    P.hitSet = new Set(); P.swingRel = -100 * DEG; P.prevRel = P.swingRel; P.swooshed = false; P.buttReload = false;
  }
  function updateButt(dt) {
    const P = G.player, W = 0.05, S = 0.1, R = 0.18;
    P.t += dt;
    const rel = P.t < W ? -100 : P.t < W + S ? -100 + 170 * easeOut((P.t - W) / S) : 70;
    P.prevRel = P.swingRel; P.swingRel = rel * DEG; P.blade = P.atkAng + P.sign * P.swingRel + Math.PI;
    if (P.t >= W && P.t - dt < W + S + 0.02) {
      if (!P.swooshed) { P.swooshed = true; sfx('swing'); }
      P.x += Math.cos(P.atkAng) * 90 * dt; P.y += Math.sin(P.atkAng) * 90 * dt;
      sweepHits(P.atkAng, P.sign, P.prevRel, P.swingRel, 36, P.hitSet, { coef: 0.9, grogi: 4, kb: 230, stagger: 0.55, gauge: 4, heavy: true, basic: true });
      P.trail.push({ a: P.atkAng + P.sign * P.swingRel, t: 0.11 });
    }
    // 개머리판 공격은 탄창 재장전을 생략하지 않는다
    if (P.t >= W + S + R) P.state = 'idle';
  }
  function fireShotgun() {
    const P = G.player;
    P.state = 'rattack'; P.t = 0; P.blade = P.ang; P.recoil = 1.8; P.reload = 0; P.ammo = gunMag();
    const m = muzzle();
    for (let i = 0; i < 9; i++) { const a = P.ang + rand(-0.55, 0.55); G.fx.push({ kind: 'tracer', x0: m.x, y0: m.y, x1: m.x + Math.cos(a) * rand(100, 150), y1: m.y + Math.sin(a) * rand(100, 150), w: 1, t: 0.14, max: 0.14, c: '255,210,140' }); }
    G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang: P.ang, s: 2.2, t: 0.18, max: 0.18 });
    G.fx.push({ kind: 'arcwave', x: P.x, y: P.y - 8, ang: P.ang, arc: 70 * DEG, r0: 20, r1: 150, t: 0.22, max: 0.22, c: '255,190,110' });
    for (let i = 0; i < 16; i++) G.parts.push({ x: m.x, y: m.y, vx: Math.cos(P.ang) * rand(30, 90) + rand(-30, 30), vy: Math.sin(P.ang) * rand(30, 90) + rand(-40, 0), t: rand(0.5, 1.0), c: pick(['#5b5560', '#8d8496', '#3a3540']), g: -10 });
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = dist(e, P);
      if (d < 150 + e.r && Math.abs(angDiff(angTo(P, e), P.ang)) < 0.62) damageEnemy(e, 2.4 * (1 - Math.min(d, 150) / 150 * 0.5), { ang: angTo(P, e), kb: 300, grogi: 5, stagger: 0.7, heavy: true, gauge: 4 });
    }
    P.x -= Math.cos(P.ang) * 26; P.y -= Math.sin(P.ang) * 26;
    goldCasing(); sfx('shotgun'); addShake(7, P.ang + Math.PI); flashT = 0.05; flashColor = '#ffd080';
  }
  function startSnipe() {
    const P = G.player;
    P.gauge = 0; P.state = 'aim'; P.t = 0; P.combo = 0; P.blade = P.ang;
    sfx('aim'); flashT = 0.08; flashColor = '#ffd080';
  }
  function updateAim(dt, mx, my) {
    const P = G.player, s = G.stats;
    P.t += dt;
    P.blade = lerpAng(P.blade, P.ang, dt * 7);
    P.x += mx * s.spd * 0.2 * dt; P.y += my * s.spd * 0.2 * dt;
    const m = muzzle();
    if (Math.random() < 0.8) { const a = rand(0, TAU), r = rand(16, 34) * (1 - P.t / 2.4); G.parts.push({ x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 5, vy: -Math.sin(a) * r * 5, t: 0.2, c: pick(['#ffd080', '#fff0d0', '#ff6a2a']), g: 0, glow: true }); }
    if (P.t >= 2.0) fireSnipe();
  }
  function fireSnipe() {
    const P = G.player, m = muzzle(), ang = P.blade, s = G.stats;
    const L = rayEnd(m.x, m.y, ang, 900);
    for (const h of rayHits(m.x, m.y, ang, L, 12)) {
      let coef = 7.0; if (s.fx.has('undertaker') && h.e.grogiT > 0) coef *= 2;
      damageEnemy(h.e, coef, { ang, grogi: 30, kb: 340, heavy: true, stagger: 1.2, gauge: 0 });
    }
    G.fx.push({ kind: 'tracer', x0: m.x, y0: m.y, x1: m.x + Math.cos(ang) * L, y1: m.y + Math.sin(ang) * L, w: 12, t: 0.4, max: 0.4, c: '255,200,110' });
    G.fx.push({ kind: 'tracer', x0: m.x, y0: m.y, x1: m.x + Math.cos(ang) * L, y1: m.y + Math.sin(ang) * L, w: 4, t: 0.5, max: 0.5, c: '255,255,240' });
    G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang, s: 3, t: 0.18, max: 0.18 });
    G.fx.push({ kind: 'ring', x: m.x, y: m.y, r: 6, grow: 260, t: 0.3, max: 0.3, c: '#ffd080' });
    for (let i = 0; i < 30; i++) { const k = Math.random() * L; G.parts.push({ x: m.x + Math.cos(ang) * k, y: m.y + Math.sin(ang) * k, vx: rand(-30, 30), vy: rand(-40, 0), t: rand(0.3, 0.7), c: pick(['#ffd080', '#fff0d0', '#5b5560']), g: 0, glow: Math.random() < 0.5 }); }
    P.x -= Math.cos(ang) * 40; P.y -= Math.sin(ang) * 40;
    P.state = 'rattack'; P.t = 0; P.recoil = 2.5; P.reload = 0; P.ammo = gunMag();
    goldCasing(); sfx('snipe'); addShake(12, ang + Math.PI); flashT = 0.12; flashColor = '#fff0d0'; slowmo = Math.max(slowmo, 0.35); /* v1.08 역경직 제거 */
  }
  // 거너 조준점: 총구에서 탄이 닿는 곳까지 점선, 끝에 조준경 (적을 겨누면 붉게)
  function drawGunAim() {
    const P = G.player; if (G.cls !== 'gunner' || P.dead || P.state === 'aim' || P.state === 'butt') return;
    if (G.cine || TRUTH.busy() || DEN.busy() || RUIN.busy() || CA.busy() || END.busy()) return; // v3.18 대화 · 연출 중엔 조준점을 숨김 (말 건 자리에 멈춰 남지 않게)
    const m = muzzle(), ang = P.blade, hits = rayHits(m.x, m.y, ang, GUN_RANGE, 5), L = hits.length ? hits[0].along : rayEnd(m.x, m.y, ang, GUN_RANGE);
    const ready = P.reload <= 0, on = hits.length > 0, col = on ? '255,80,60' : '240,230,210';
    ctx.save();
    for (let d = 10; d < L - 8; d += 8) { ctx.fillStyle = `rgba(${col},${(ready ? 0.7 : 0.3) * (1 - d / 600)})`; ctx.fillRect(Math.round(m.x + Math.cos(ang) * d), Math.round(m.y + Math.sin(ang) * d), 2, 2); }
    const tx = Math.round(m.x + Math.cos(ang) * L), ty = Math.round(m.y + Math.sin(ang) * L), r = ready ? 6 : 5 + 4 * (P.reload / (P.reloadMax || GUN_RELOAD));
    ctx.fillStyle = '#000'; for (const [dx, dy, w, h] of [[-r - 4, 0, 5, 2], [r, 0, 5, 2], [0, -r - 4, 2, 5], [0, r, 2, 5]]) ctx.fillRect(tx + dx - 1, ty + dy - 1, w + 2, h + 2);
    ctx.fillStyle = `rgba(${col},${ready ? 1 : 0.5})`;
    ctx.fillRect(tx - r - 4, ty, 5, 2); ctx.fillRect(tx + r, ty, 5, 2); ctx.fillRect(tx, ty - r - 4, 2, 5); ctx.fillRect(tx, ty + r, 2, 5);
    ctx.fillRect(tx, ty, 2, 2);
    if (on && ready) { ctx.strokeStyle = `rgba(${col},.8)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(tx + 1, ty + 1, r + 2, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
  function drawAimLine() {
    const P = G.player; drawGunAim(); if (P.state !== 'aim') return;
    const m = muzzle(), L = rayEnd(m.x, m.y, P.blade, 900), k = Math.min(1, P.t / 2);
    const blinkW = k > 0.8 && Math.floor(time * 20) % 2 === 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = blinkW ? 'rgba(255,255,255,.9)' : `rgba(255,60,40,${0.25 + 0.6 * k})`; ctx.lineWidth = Math.max(1, 10 * (1 - k));
    ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + Math.cos(P.blade) * L, m.y + Math.sin(P.blade) * L); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,200,.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + Math.cos(P.blade) * L, m.y + Math.sin(P.blade) * L); ctx.stroke();
    ctx.restore();
  }

  // ---------- 그리기 (마법사·사제·거너 공용)
  function drawHero() {
    const P = G.player, C = CL(), cls = G.cls;
    let tex = cls === 'priest' && (P.miracleT > 0 || P.state === 'pray') && weaponTier('priest') < 3 ? TOOLS.maceH : weaponTex(cls);
    if (cls === 'gunner' && G.harp) { const it = eqWeapon(cls), W0 = it && it.wk != null && it.cls === cls ? wcat(cls)[it.wk] : null; if (W0 && W0.wEmpty) tex = W0.wEmpty; } // 작살이 나가 있는 동안 총에 끼운 작살은 안 보이게
    if (P.dead) {
      drawShadow(P.x, (P.rollGY != null ? P.rollGY : P.y) + 1, 8);
      drawBlade(tex, P.x + 10, P.y - 2, 0.2, 0.9);
      drawSprite(C.map, C.pal, 2, P.x, P.y + 4, P.face < 0, { rot: Math.PI / 2 * P.face, alpha: 0.85 });
      return;
    }
    if (P.state === 'dodge' && P.t < BLINK && !P.rolling) return;
    const blink = P.inv > 0 && Math.floor(time * 16) % 2 === 0;
    drawShadow(P.x, (P.rollGY != null ? P.rollGY : P.y) + 1, 8);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (P.state === 'cast') {
      ctx.strokeStyle = `rgba(255,150,70,${0.6 + Math.sin(time * 18) * 0.2})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(P.x, P.y, 22, 8, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = time * 4 + i / 6 * TAU; ctx.fillStyle = 'rgba(255,200,120,.9)'; ctx.fillRect(Math.round(P.x + Math.cos(a) * 22), Math.round(P.y + Math.sin(a) * 8), 2, 2); }
    }
    if (P.state === 'aim') { ctx.strokeStyle = `rgba(255,80,40,${0.4 + Math.sin(time * 16) * 0.2})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(P.x, P.y, 16 - P.t * 4, 6 - P.t * 1.5, 0, 0, TAU); ctx.stroke(); }
    if (P.miracleT > 0) { ctx.fillStyle = `rgba(255,220,120,${0.18 + Math.sin(time * 10) * 0.06})`; ctx.beginPath(); ctx.ellipse(P.x, P.y, 22, 9, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    const wFr = walkFr(P), ifr = idleFrame(P); // v2.43 모든 직업 월드 플리퍼식 걷기 4프레임 (2·4프레임은 1칸 내려감)
    const bob = ifr ? (ifr.F.drop ? 2 : 0) : (wFr % 2 || wFr === -2) ? 2 : 0;
    let rot = 0, alpha = blink ? 0.45 : 1, sx = 1, sy = 1; if (P.blinkRec > time && G.cls === 'mage') alpha = Math.min(alpha, 1 - 0.55 * (P.blinkRec - time) / 0.29); // v3.62 점멸 뒤 나타나는 동안 몸이 또렷해짐
    if (P.state === 'dodge') { if (P.rolling) rot = rollPose(P).rot; else { alpha = 0.5 + 0.5 * clamp((P.t - BLINK) / 0.09, 0, 1); sx = 0.9; sy = 1.1; } }
    if (PPOSE) ({ rot, sx, sy } = PPOSE); // v2.43 공격 모션
    if (P.state === 'pray') sy = 1.05;
    const h = heroHand(), hy = h.y + bob;
    const behind = cls === 'priest' ? (P.state === 'idle' || P.state === 'dodge') : cls === 'gunner' ? (Math.sin(P.blade) < 0.55 && P.state !== 'butt') /* v2.42 정면 도트: 총은 몸 뒤 옆으로 (아래로 겨눌 때만 앞) */ : (Math.sin(P.blade) < -0.45 && P.state !== 'cast' && P.state !== 'butt');
    if (cls === 'priest' && ((P.state === 'attack' && !['water', 'whip'].includes(wSkill())) || (P.state === 'prs' && P.trail && P.trail.length && wSkill() !== 'whip'))) { // v3.22 기술 중 메이스 궤적
      drawSlashPx(P.trail, h.x, hy, tex.reach, rbySlash('priest', SLASH_COL.priest), P.combo === 2); // v2.50 도트 궤적 · v3.19 RGB? 무지개
    }
    if (cls === 'gunner' && P.state === 'butt') drawTrail(P.trail, h.x, hy, 4, 30, '230,220,200', true);
    const wsk = cls === 'priest' ? wSkill() : null;
    let bAng = P.blade;
    if (wsk === 'water') { // v2.18 물뿌리개는 손잡이를 쥐고 똑바로 든다 · 평타 때 앞으로 기울여 붓는다
      const st = SWING_P[P.combo] || SWING_P[0], f = P.state === 'attack' ? Math.cos(P.atkAng) >= 0 ? 1 : -1 : P.face;
      const tilt = P.state === 'attack' ? (P.t < st.wind ? -0.25 * (P.t / st.wind) : P.t < st.wind + st.swing ? -0.25 + 0.95 * easeOut((P.t - st.wind) / st.swing) : 0.7 * (1 - Math.min(1, (P.t - st.wind - st.swing) / st.rec))) : Math.sin(P.walk || 0) * 0.06;
      bAng = f > 0 ? tilt : Math.PI - tilt; }
    if (wsk === 'whip') { if (behind) drawWhip(h.x, hy); }
    else if (ifr && ifr.F.gun) idleGun(ifr, tex, { x: h.x, y: hy }, P, alpha, true); // v2.51 대기 동작: 긴 총은 몸 뒤
    else if (behind && wsk !== 'water') drawBlade(tex, h.x, hy, bAng, alpha);
    const rmk = rollMap(P, C.map), [rox, roy] = rmk ? rollOff(rmk, rot) : [0, 0];
    drawSprite(rmk || (ifr ? ifr.key : heroMap(walkMap(C.map, wFr), P)), C.pal, 2, P.x + rox, P.y + 2 + roy, P.face < 0, { rot, alpha, white: P.hurtT > 0.12, sx, sy });
    if (ifr && ifr.F.gun) idleGun(ifr, tex, { x: h.x, y: hy }, P, alpha, false);
    if (ifr) idleZz(ifr, snap2(P.x), snap2(P.y + 2), P.face < 0);
    if (wsk === 'whip') { if (!behind) drawWhip(h.x, hy); }
    else if ((!behind || wsk === 'water') && !(ifr && ifr.F.gun)) drawBlade(tex, h.x, hy, bAng, alpha);
    if (wsk !== 'whip' && !(ifr && ifr.F.gun)) weaponAura(tex, h.x, hy, bAng, cls);
    if (cls === 'mage') {
      const tp = staffTip(), big = P.state === 'cast';
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = big ? 'rgba(255,170,80,.55)' : 'rgba(190,120,255,.4)'; ctx.beginPath(); ctx.arc(tp.x, tp.y + bob, (big ? 9 : 4) + Math.sin(time * 9), 0, TAU); ctx.fill();
      ctx.restore();
      // v1.76 머리 위 마력 막대 제거 (마력 소모 없음)
    }
    if (P.shieldT > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,236,160,${0.5 + Math.sin(time * 14) * 0.2})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(P.x, P.y - 10, 15, 17, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (cls === 'gunner') return;
    ctx.fillStyle = 'rgba(232,228,216,.45)';
    ctx.fillRect(Math.round(P.x + Math.cos(P.ang) * 26) - 1, Math.round(P.y - 8 + Math.sin(P.ang) * 26) - 1, 2, 2);
  }

  function startAttack(i) {
    if (G.tut && G.tut.step === 1) G.tut.atkN++;
    const P = G.player, st = swingTable()[i];
    BDC.onAttack(); // v3.18 칼날카드
    P.state = 'attack'; P.combo = i; P.t = 0; P.queued = false; P.atkAng = P.ang; P.hitSet = new Set();
    P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.sign = P.face;
    P.swingRel = st.a0 * DEG; P.prevRel = P.swingRel;
    P.swooshed = false; P.slamDone = false; P.wEndDone = false; P.bellDone = false;
    priestSwing(i); // v2.13
    P.crackDone = false; if (G.cls === 'knight' && i === 2) P.chainL = null;
    engOnSwing(P.atkAng); // v2.41
  }
  function updateSwing(dt, wantAtk, mx, my) {
    const P = G.player, s = G.stats, st = swingTable()[P.combo];
    P.t += dt * (G.breadBrk > 0 && G.cls === 'knight' && wSkill() === 'bread' ? 1.8 : 1) * engAspd(); // v2.18 반 토막 연타
    if (wantAtk) P.queued = true;
    const tSwingEnd = st.wind + st.swing, total = tSwingEnd + st.rec;
    let rel;
    if (P.t < st.wind) rel = (st.a0 - 12 * (P.t / st.wind)) * DEG;                // 예비동작: 살짝 더 젖힌다
    else if (P.t < tSwingEnd) rel = (st.a0 - 12 + (st.a1 - st.a0 + 12) * easeOut((P.t - st.wind) / st.swing)) * DEG;
    else rel = (st.a1 + 6 * Math.sin(Math.min(1, (P.t - tSwingEnd) / st.rec) * Math.PI)) * DEG;
    P.prevRel = P.swingRel; P.swingRel = rel;
    const ranger = G.cls === 'ranger';
    if (!ranger || P.combo === 0) P.blade = P.atkAng + P.sign * rel;
    if (ranger && P.combo === 1) { P.blade2 = P.atkAng + P.sign * rel; P.blade = lerpAng(P.blade, P.atkAng + P.sign * 70 * DEG, dt * 20); }
    if (ranger && P.combo === 2) { P.blade = P.atkAng + P.sign * rel; P.blade2 = P.atkAng - P.sign * rel; }
    if (ranger && P.combo === 0) P.blade2 = lerpAng(P.blade2, P.atkAng - P.sign * 120 * DEG, dt * 20);
    const swinging = P.t >= st.wind && P.t - dt < tSwingEnd + 0.02;
    if (swinging) {
      if (!P.swooshed) { P.swooshed = true; sfx(st.heavy ? 'whoosh' : 'swing'); }
      // 휘두르는 동안 앞으로 내딛는다
      P.x += Math.cos(P.atkAng) * st.lunge * dt; P.y += Math.sin(P.atkAng) * st.lunge * dt;
      // 지난 프레임~이번 프레임 사이 칼날이 쓸고 간 각도 안의 적을 벤다
      const lo = Math.min(P.prevRel, P.swingRel), hi = Math.max(P.prevRel, P.swingRel);
      const px = P.x, py = P.y - PIVOT_Y + 4;
      const RCH = G.cls === 'knight' ? Math.max(st.reach, weaponTex('knight').reach + 4 + (P.combo === 2 ? 6 : 0)) : st.reach; // v3.45 기사: 판정 거리를 들고 있는 무기 그림 길이(손 앞 + 칼끝)에 맞춤 · 3타 +6
      for (const e of G.enemies) {
        if (e.dead || P.hitSet.has(e)) continue;
        const ey = e.y - (e.tall ? e.tall * 0.3 : e.type === 'boss' ? 18 : isElite(e) ? 12 : 6);
        const d = Math.hypot(e.x - px, ey - py);
        if (d > RCH * (P.combo === 2 ? 1 + pasV('reach3') : 1) + e.r) continue;
        const tol = Math.atan(e.r / Math.max(d, 1)) + 0.05;
        const ra = P.sign * angDiff(Math.atan2(ey - py, e.x - px), P.atkAng);
        let hit = false;
        for (const k of [-1, 0, 1]) { const r = ra + k * TAU; if (r >= lo - tol && r <= hi + tol) hit = true; }
        if (d < 14) hit = true;
        if (hit) {
          P.hitSet.add(e);
          damageEnemy(e, st.coef, { grogi: st.grogi, kb: st.kb * (P.combo === 2 ? 1 + pasV('spinKb') : 1), ang: angTo(P, e), heavy: st.heavy, stagger: st.stagger, gauge: st.gauge, basic: true });
        }
      }
      hitCrack(P.x + Math.cos(P.atkAng) * 30, P.y + Math.sin(P.atkAng) * 22, st.heavy ? 3 : 1, st.reach + 14);
      if (!ranger || P.combo !== 1) P.trail.push({ a: P.blade, t: 0.11 });
      if (ranger && P.combo >= 1) P.trail2.push({ a: P.blade2, t: 0.11 });
      if (st.slam && P.t >= tSwingEnd - dt && !P.slamDone) { P.slamDone = true; holySlam(P.x + Math.cos(P.atkAng) * 26, P.y + Math.sin(P.atkAng) * 18); }
      if (P.combo === 2 && s.efx.has('wave3') && P.t >= tSwingEnd - dt && !P.waveDone) { P.waveDone = true; fireWave(P.atkAng); }
      if (P.combo === 2 && P.t >= tSwingEnd - dt && !P.wEndDone) { P.wEndDone = true; weaponSwingEnd(); } // v2.03
      if (P.combo === 2 && s.fx.has('ember') && P.t >= tSwingEnd - dt && !P.emberDone) {
        P.emberDone = true;
        G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 20, t: 0.3, max: 0.3, c: '#ffaa50', grow: 240 });
        for (const e of G.enemies) if (!e.dead && dist(e, P) < 110 && !P.hitSet.has(e)) damageEnemy(e, 1.0, { grogi: 6, gauge: 2, ang: angTo(P, e), basic: true });
      }
    } else {
      P.x += mx * s.spd * 0.25 * dt; P.y += my * s.spd * 0.25 * dt;
    }
    // 후딜 중간부터 다음 타로 연결
    if (P.queued && P.combo < 2 && P.t >= tSwingEnd + st.rec * 0.35) { P.emberDone = false; P.waveDone = false; startAttack(P.combo + 1); return; }
    if (P.t >= total) { P.emberDone = false; P.waveDone = false; P.state = 'idle'; P.comboWin = P.combo < 2 ? 0.4 : 0; P.combo = P.combo < 2 ? P.combo + 1 : 0; }
  }

  // ---------------------------------------------------------------- 효과
  function burst(x, y, c, n, dir) {
    for (let i = 0; i < n; i++) {
      const a = dir == null ? rand(0, TAU) : dir + rand(-0.8, 0.8), s = rand(40, 140);
      G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, t: rand(0.3, 0.7), c, g: 280, floor: y + rand(8, 16) });
    }
  }
  function dust(x, y, n) { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(10, 50); G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.4 - 6, t: rand(0.3, 0.6), c: '#5b5560', g: 0 }); } }
  function sparks(x, y, ang, c, n) { for (let i = 0; i < n; i++) G.fx.push({ kind: 'spark', x, y, ang: ang + rand(-0.9, 0.9), len: rand(6, 14), sp: rand(120, 220), t: 0.14, max: 0.14, c }); }
  function crack(x, y) {
    return; // 땅 갈라짐 효과는 끔
    dg.strokeStyle = 'rgba(8,6,10,.7)'; dg.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      let cx = x, cy = y, a = rand(0, TAU);
      dg.beginPath(); dg.moveTo(cx, cy);
      for (let k = 0; k < 5; k++) { a += rand(-0.5, 0.5); cx += Math.cos(a) * rand(4, 9); cy += Math.sin(a) * rand(3, 6); dg.lineTo(Math.round(cx), Math.round(cy)); }
      dg.stroke();
    }
  }
  function debris(x, y, n) {
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), sp = rand(40, 160); G.parts.push({ x, y: y - 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - rand(60, 140), t: rand(0.4, 0.8), c: pick(['#3a3642', '#2a2731', '#4d4858', '#1d1a23']), g: 420, floor: y + rand(-4, 8) }); }
  }
  function hitStunTick(e, dt) {
    e.hitStun -= dt; e.flash = Math.max(0, e.flash - dt);
    e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= Math.pow(0.0015, dt); e.vy *= Math.pow(0.0015, dt);
    e.lean *= Math.pow(0.05, dt);
  }
  function updateCorpse(c, dt) {
    const e = c.e;
    c.t -= dt; if (c.keep && c.t < c.max * 0.6) { c.t = c.max * 0.6; if (c.bounced && c.z <= 0) { c.vx = c.vy = 0; c.vr = 0; } } // 난입자: 쓰러진 모습으로 멈춤
    e.x = clamp(e.x + c.vx * dt, A.x0 + 4, A.x1 - 4); e.y = clamp(e.y + c.vy * dt, A.y0 + 4, A.y1 - 4);
    c.vx *= Math.pow(c.bounced ? 0.004 : 0.3, dt); c.vy *= Math.pow(c.bounced ? 0.004 : 0.3, dt);
    c.z += c.vz * dt; c.vz -= 900 * dt; c.rot += c.vr * dt;
    if (c.z < 0) {
      c.z = 0;
      if (!c.bounced) { c.bounced = true; c.vz = 90; c.vr *= 0.3; dust(e.x, e.y, 6); }
      else { c.vz = 0; c.vr = 0; }
    }
    if (c.t <= 0) dust(e.x, e.y - 6, 8);
  }
  function drawCorpse(c) {
    const e = c.e, k = c.t / c.max, of = e.flash, ox = e.x, oy = e.y;
    e.flash = c.max - c.t < 0.08 ? 1 : 0;
    // v1.05: 몸을 따로 그린 뒤 칸 단위로 눕히고 찌그러뜨림 (매끈한 회전 금지)
    const bx = snap2(e.x), by = snap2(oy - 10), wf = e.flash ? 'snapW' : 'snap';
    if (!c[wf]) { const [cv2, g2] = mkCanvas(240, 240), main = ctx; g2.imageSmoothingEnabled = false; g2.setTransform(1, 0, 0, 1, 120 - bx, 170 - by); ctx = g2; try { drawEnemy(e); } finally { ctx = main; } c[wf] = cv2; } // 죽는 순간 한 번만 찍어 둠
    const kq = Math.round((1 - k) * 6) / 6; // 찌그러짐 6단계 — 매 프레임 새 그림을 만들지 않고 단계별 그림을 다시 쓴다
    const rq = Math.round(c.rot / (Math.PI / 6)) * (Math.PI / 6); // 구르는 각도는 12방향으로 끊음
    const t = pxXform(c[wf], 2, rq, 1 + kq * 0.15, 1 - kq * 0.35, false, { pvx: 120, pvy: 170 });
    ctx.save(); ctx.globalAlpha = Math.ceil(Math.min(1, k * 2.5) * DLV) / DLV; /* 사라짐도 단계로 (단계 사이 망점 사본을 만들지 않음) */ ctx.drawImage(t.c, bx - t.ax, snap2(oy - 10 - c.z) - t.ay); ctx.restore();
    e.flash = of; e.x = ox; e.y = oy;
  }
  function addShake(n, ang) {
    shake = Math.max(shake, n);
    if (ang != null) { shakeX += Math.cos(ang) * n * 0.6; shakeY += Math.sin(ang) * n * 0.6; }
  }

  // ---------------------------------------------------------------- 필드 드랍 (잡몹·엘리트)
  // 체력 물약: HP 회복 / 투지 구슬: 각성 게이지 / 금화 주머니: 골드 / 핏빛 영약: 8초 공격력 +30% / 장비: 낮은 확률, 줍는 즉시 더 좋으면 바로 장착

  // v2.32 드랍·상점 아이템 도트 다시 (2px 칸, 더 크게) — 하트·하트 그릇·방패 조각·투지 구슬·핏빛 영약
  MAPS.heartFullX = ["..kkk...kkk..", ".kRRRk.kRRRk.", "kRWPRRkRRRRrk", "kRWRRRRRRRRrk", "kRPRRRRRRRRrk", "kRRRRRRRRRrrk", ".kRRRRRRRRrk.", "..kRRRRRRrk..", "...kRRRRrk...", "....kRRrk....", ".....krk.....", "......k......"];
  MAPS.heartHalfX = ["..kkk...kkk..", ".kRRRk.keeEk.", "kRWPRRkeeeeEk", "kRWRRRkeeeeEk", "kRPRRRkeeeeEk", "kRRRRRkeeeeEk", ".kRRRRkeeeEk.", "..kRRRkeeEk..", "...kRRkeEk...", "....kRkEk....", ".....kkk.....", "......k......"];
  MAPS.heartUpX = ["..kkk...kkk..", ".kYYYk.kYYYk.", "kYoeEYkYEeeYk", "kYeeeeYeeeeyk", "kYeeeeoeeeeyk", "kYeeeoooeeeyk", ".kYeeeoeeeyk.", "..kYeeeeeyk..", "...kYeeeyk...", "....kYeyk....", ".....kyk.....", "......k......"];
  MAPS.shieldPkX = [".kkkkkkkkkk.", "kyYYYYYYYYyk", "kYTTSSSSSsYk", "kYTSSSSSSsYk", "kYSSSXXSSsYk", "kYSSXXXXSsYk", "kYSSSXXSSsYk", ".kYSSSSSsYk.", ".kYSSSSSsYk.", "..kYSSSsYk..", "...kYSsYk...", "....kYYk....", ".....kk....."];
  MAPS.orbX = [".......k......", "......kEk.....", ".....kDEBk....", "....kDDEBBk...", "...kDDEEBBBk..", "..kDDDEEBBBBk.", ".kCCCECCAAAAAk", "..kCCCCCAAAAk.", "..kCCCCCAAAAk.", "...kCCCCAAAk..", "...kCCCCAAAk..", "....kCCCAAk...", "....kCCCAAk...", "..k..kCCAk.k..", ".kBk.kCCAkkCk.", "kCAk..kCk.kABk", ".kk....k...kk."]; // v3.13 투지 결정 (투지 구슬 대체)
  PAL.lootOrb = {"A": "#b0441a", "B": "#e8702a", "C": "#ffaa3c", "D": "#ffd34d", "E": "#fff6c8", "k": "#0b0a0e"};
  MAPS.pouchX = ["...kk.kk.kk.k....", "..kIIkFFkDDkDk...", "..kIDIFDFFBDBk...", "...kIIFFFDDBk....", "....kIIFFDDk.....", ".....kFFDDk......", "....kGGGCCC......", "..kkIGIFFFCkk....", ".kIIJIFAAFDCDk...", "kIIJIFFMLDDDDDk..", "kIIJFAFLLHADDDk..", "kIIFFALHHEADDBk..", "kIFFFFAHEADDBBk..", ".kFFFFDAADDBBkkk.", ".kFFFFDDDDBBBkMLk", "..kkFDDDDBBkkkHEk", "....kkkkkkk...kk."]; // v3.13 금화 주머니 (상점 아이템 수준 2px 칸)
  PAL.lootPouch = {"A": "#48240e", "B": "#6e3c1a", "C": "#8a2a20", "D": "#9a5c2c", "E": "#a06a12", "F": "#c88446", "G": "#d24a3a", "H": "#e0a02a", "I": "#e8b478", "J": "#f8d8a8", "L": "#ffd34d", "M": "#fff6c0", "k": "#0b0a0e"};
  MAPS.crumbX = [".......kkkkkk..", ".....kkQWAQQQk.", ".kkkkQWAQQAQAjk", "kAaaQQQQqqqjjjk", ".kAaQQqqqqjjjk.", ".kAaQqjjjjjjk..", ".kaaajjjjjkk...", "..kaakkkkk.....", "...kk.........."]; // v2.51 상점 아이템 수준 음식 도트 (2px 칸)
  MAPS.carrotX = ["........k....", ".....k.kGk.k.", "....kGkkGkkgk", ".....kLGGkgk.", "....kOOGgddk.", "....kOooddk..", "...kOWoook...", "...kWoUUUUk..", "..kOOoUUUk...", "..kOUUUUk....", ".kOoUUkk.....", ".kUUUk.......", "koUkk........", "kok..........", ".k..........."];
  MAPS.fishX = ["......kkk.......", ".....kssDk....k.", "..kkkTTSkDk.kksk", ".kTTTTTTSSSkSDDk", "kTTkSSssSDDSskk.", "kDSssssssDDDskk.", ".ksTSSSSSDSkssDk", "..kDDSSSSDk.kDDk", "...kkkkkkk...kDk", "..............k."];
  PAL.lootFood = {"k": "#0b0a0e", "W": "#fff2c8", "Q": "#f0b450", "q": "#c8782a", "j": "#8a4818", "A": "#fff0c8", "a": "#e2c288", "O": "#ffc070", "o": "#f8862a", "U": "#d0581a", "u": "#8e3410", "L": "#a8e868", "G": "#5ab840", "g": "#2e8a2a", "d": "#1a5420", "T": "#eef6ff", "S": "#a8c8e8", "s": "#6a90c0", "D": "#3a5888", "E": "#ffd34d"};
  MAPS.vialX = ["....kkk....", "...kcck....", "...kcck....", "....kGk....", "...kGgk....", "..kGVVgk...", ".kGVHVVvk..", "kGVHVVVVvk.", "kGVVVVVvvk.", "kgVVVVvvvk.", ".kvvvvvvk..", "..kkkkkk..."];
  PAL.lootHi = {"k": "#0b0a0e", "R": "#e8364a", "r": "#a01828", "W": "#fff0f0", "P": "#ff8a98", "e": "#2a141a", "E": "#4a2430", "Y": "#ffd34d", "y": "#b08020", "o": "#fff2b0", "S": "#a8b8c8", "s": "#6a7a8c", "T": "#e8f0f8", "D": "#3e4a5a", "B": "#7aa8e8", "b": "#3e5c98", "C": "#c8e0ff", "G": "#c8d0e0", "g": "#8a92a8", "c": "#8a6236", "V": "#d040b0", "v": "#801870", "H": "#ffb0f0", "n": "#6a6470", "N": "#45404c", "u": "#b06a3a", "X": "#c83040", "O": "#ff9a2a"};
  const LOOT = {
    hue: { n: '색 조각', map: 'hue_r', sc: 2, c: '#ff5a4a' }, // v2.34 (색은 l.hue)
    meat:  { n: '하트 반 칸', map: 'heartHalfX', pal: 'lootHi', sc: 2, c: '#ff6a6a', light: '255,60,70' }, // v2.01 물약 → 하트
    bigmeat: { n: '하트', map: 'heartFullX', pal: 'lootHi', sc: 2, c: '#ff6a6a', light: '255,60,70' },
    orb:   { n: '투지 결정', map: 'orbX', pal: 'lootOrb', sc: 2, c: '#ffaa3c', light: '255,170,60' }, // v3.13 투지 구슬 → 투지 결정
    pouch: { n: '금화 주머니', map: 'pouchX', pal: 'lootPouch', sc: 2, c: '#ffd34d', light: '255,210,120' }, // v3.13 새 도트
    vial:  { n: '핏빛 영약', map: 'vialX', pal: 'lootHi', sc: 2, c: '#e070d0', light: '220,60,200' },
    armor: { n: '방패 조각', map: 'shieldPkX', pal: 'lootHi', sc: 2, c: '#c8d8e0', light: '200,220,240' }, // v2.00
    relic: { n: '유물', map: 'relic', sc: 3, c: '#ff8a3a', light: '255,140,60' }, // v2.07
    heartUp: { n: '빈 하트 그릇', map: 'heartUpX', pal: 'lootHi', sc: 2, c: '#ffd34d', light: '255,210,90' }, // v2.02
    medal: { n: '잿빛 훈장', map: 'medal', sc: 3, c: '#ffd34d', light: '255,210,90' }, // v2.02 무피격 보스 처치
    crumb: { n: '빵조각', map: 'crumbX', pal: 'lootFood', sc: 2, c: '#e8b060', light: '255,190,110' }, // v2.03 굳은 바게트 · v2.51 새 도트
    carrot: { n: '당근', map: 'carrotX', pal: 'lootFood', sc: 2, c: '#f08a2a', light: '255,150,60' }, // v2.13 당근 메이스 · v2.51 하트 반 칸
    fish: { n: '물고기', map: 'fishX', pal: 'lootFood', sc: 2, c: '#9fe8ff', light: '150,210,255' }, // v2.51 낚싯대
    mochi: { n: '떡', map: 'mochi', sc: 3, c: '#f8f0f4', light: '255,230,240' }, // v2.13 달토끼 떡메
    gear:  { n: '장비', map: 'gear', sc: 2 },
    sealkey: { n: '봉인 열쇠', map: null, sc: 2, get c() { return SK().c; }, get light() { return SK().rgb; } }, // v1.18 엘리트가 떨어뜨리는 보스 문 열쇠 (챕터마다 다름)
  };
  // 잡몹 한 마리당 소모품은 최대 1개, 장비는 따로 굴린다
  const LOOT_TABLE = [['meat', 0.03], ['orb', 0.05], ['pouch', 0.03], ['vial', 0.01]];
  function spawnLoot(type, x, y, it) {
    if (type === 'orb' && G && G.cls === 'priest') return; // v3.83 성직자는 각성 게이지를 안 씀 → 투지 결정이 나오지 않음
    const a = rand(0, TAU), sp = rand(30, 70);
    if (type === 'gear' && it && it.grade === 'rby') { sfx('legend'); sfx('boss'); flashT = Math.max(flashT, 0.1); flashColor = '#ff2a2a'; G.fx.push({ kind: 'skybeam', x, y, w: 30, c: '255,42,42', t: 1.0, max: 1.0 }); }
    if (type === 'gear' && it && it.grade === 'legend') { sfx('legend'); flashT = Math.max(flashT, 0.06); flashColor = '#ff9a2e'; G.fx.push({ kind: 'skybeam', x, y, w: 24, c: '255,160,60', t: 0.7, max: 0.7 }); }
    G.loot.push({ type, it, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, z: 6, vz: rand(110, 150), t: 0, life: 1e9, /* v1.19 바닥에 떨어진 아이템은 사라지지 않는다 */ bob: rand(0, TAU) });
  }
  function rollLoot(e) {
    if (isSemi(e)) {
      if (Math.random() < 0.10) spawnLoot('bigmeat', e.x, e.y);
      if (Math.random() < 0.3) spawnLoot(pick(['orb', 'pouch', 'vial']), e.x, e.y);
    } else if (isElite(e)) {
      if (Math.random() < 0.30) spawnLoot('bigmeat', e.x, e.y);
      if (Math.random() < 0.15) spawnLoot('armor', e.x, e.y); // v2.00
      if (Math.random() < 0.7) spawnLoot(pick(['orb', 'pouch', 'vial']), e.x, e.y);
    } else {
      let r = Math.random();
      for (const [k, p] of LOOT_TABLE) { if (r < p) { spawnLoot(k, e.x, e.y); break; } r -= p; }
    }
    if (Math.random() < (isElite(e) ? (G.stage >= 3 ? 0.05 : 0.03) : isSemi(e) ? 0.02 : 0)) spawnLoot('gear', e.x, e.y, makeItem(G.cls)); // v2.17 무기 드랍 줄임 (일반 몹 없음)
  }
  // 물약은 HP가, 구슬은 게이지가 가득 차 있으면 줍지 않고 바닥에 남겨 둔다 (필요할 때 주우러 가기)
  function lootWanted(l) {
    const P = G.player, s = G.stats;
    if (l.type === 'meat' || l.type === 'bigmeat') return P.hp < s.hp || P.poisonT > 0;
    if (l.type === 'armor') return (P.armor || 0) < ARMOR_MAX;
    if (l.type === 'heartUp' || l.type === 'medal') return s.hp < HEART_CAP;
    if (l.type === 'relic') return ((G.relics || []).length) < RELIC_SLOTS; // v3.83 유물 칸(5)이 가득 차면 줍지 않음
    if (l.type === 'hue') return true;
    if (l.type === 'crumb' || l.type === 'mochi' || l.type === 'carrot' || l.type === 'fish') return P.hp < s.hp;
    if (l.type === 'orb') return P.gauge < 100;
    return true;
  }
  // ---- v0.99 장비 효과 이펙트: 컨셉별 도트 연출 (2px 칸 · 검은/어두운 외곽선 · 디더). 바닥에 깔리는 것은 drawGearGround, 서 있는 것은 gearEnts(깊이 정렬), 나머지는 drawFx
  const GX = {
    // 결정적 난수 (프레임마다 같은 모양을 유지하거나 일정 간격으로 바꿀 때)
    hr(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); },
    c(x, y, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x) & ~1, Math.round(y) & ~1, 2, 2); },
    // 칸 목록을 외곽선과 함께: cells = [[x, y, col], ...]
    shape(cells, ol = '#0b0a0e', a = 1) {
      ctx.globalAlpha = a; ctx.fillStyle = ol;
      for (const q of cells) ctx.fillRect((Math.round(q[0]) & ~1) - 2, (Math.round(q[1]) & ~1) - 2, 6, 6);
      for (const q of cells) { ctx.fillStyle = q[2]; ctx.fillRect(Math.round(q[0]) & ~1, Math.round(q[1]) & ~1, 2, 2); }
      ctx.globalAlpha = 1;
    },
    // 바닥 타원 고리 (디더로 두께·옅어짐)
    ring(x, y, r, col, a, thick = 1, ry = 0.55, gap = 0, rot = 0) {
      const n = Math.max(24, Math.round(r * 1.5)); ctx.fillStyle = `rgba(${col},${a})`;
      for (let i = 0; i < n; i++) { if (gap && i % gap === 0) continue; const t = i / n * TAU + rot; for (let k = 0; k < thick; k++) { const rr = r - k * 2; ctx.fillRect(Math.round(x + Math.cos(t) * rr) & ~1, Math.round(y + Math.sin(t) * rr * ry) & ~1, 2, 2); } }
    },
    // 디더 원판 (가운데 진하고 바깥 옅게)
    disc(x, y, r, col, a, ry = 1, lv = 0.9) {
      ctx.fillStyle = `rgba(${col},${a})`; const R = Math.max(2, r), Ry = Math.max(2, r * ry);
      for (let yy = Math.round(y - Ry) & ~1; yy <= y + Ry; yy += 2) for (let xx = Math.round(x - R) & ~1; xx <= x + R; xx += 2) { const q = Math.hypot((xx - x) / R, (yy - y) / Ry); if (q < 1 && dith(xx >> 1, yy >> 1, lv * (1 - q * q))) ctx.fillRect(xx, yy, 2, 2); }
    },
    // 2px 선 (외곽선 있음/없음)
    line(x0, y0, x1, y1, col, ol) {
      const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / 2)), pts = [];
      for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, col]);
      if (ol) GX.shape(pts, ol); else for (const p of pts) GX.c(p[0], p[1], col);
    },
    // 바닥에 떨어지는 조각: 출발·속도·높이를 시간으로 계산 (튕김 1회)
    bit(b, el) {
      const T = Math.min(el, b.land), x = b.x + b.vx * T, y = b.y + b.vy * T * 0.6, z = Math.max(0, b.vz * T - 260 * T * T);
      return { x, y, z, landed: el >= b.land };
    },
  };
  const fxPush = f => { f.max = f.max || f.t; G.fx.push(f); return f; };
  const gxEl = f => f.max - f.t; // 지난 시간

  // 시체 폭발: 살점·뼛조각이 튀고, 핏빛 충격파 + 짧은 섬광, 바닥에 피
  function gxCorpse(e) {
    const bits = []; for (let i = 0; i < 16; i++) { const a = rand(0, TAU), sp = rand(50, 150); bits.push({ x: e.x, y: e.y - 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(90, 180), land: 0, bone: i % 3 === 0, c: pick(['#8a1a20', '#a3242a', '#5a0e12']) }); }
    for (const b of bits) b.land = b.vz / 130;
    fxPush({ kind: 'gx_corpse', x: e.x, y: e.y, t: 0.75, bits, r: 64 });
    splat(e.x, e.y, 34); splat(e.x + rand(-10, 10), e.y + rand(-4, 4), 18);
    for (let i = 0; i < 8; i++) { const a = rand(-Math.PI, 0); G.parts.push({ x: e.x, y: e.y - 10, vx: Math.cos(a) * rand(40, 110), vy: Math.sin(a) * rand(60, 150), t: rand(0.3, 0.6), c: pick(['#c0303a', '#7a1018', '#ff6a40']), g: 300, floor: e.y + rand(-4, 6) }); }
    addShake(2.5); sfx('crunch', 0.8); sfx('blast', 1.3);
  }
  // 불길 점멸: 점화 순간
  function gxIgnite(x, y) { fxPush({ kind: 'gx_ignite', x, y, t: 0.4 }); sfx('fireball', 1.4); }
  // 검기: 앞으로 날아가는 초승달 칼날
  function gxWave(ang) {
    const P = G.player, col = { knight: ['220,235,255', '#8fb8ff'], ranger: ['230,210,255', '#b08aff'], priest: ['255,240,200', '#ffd060'], mage: ['200,230,255', '#6ab8ff'], gunner: ['255,225,190', '#ff9a50'] }[G.cls] || ['220,235,255', '#8fb8ff'];
    fxPush({ kind: 'gx_wave', x: P.x, y: P.y - 10, ang, t: 0.3, c: col[0], c2: col[1] });
  }
  // 출혈: 상처에서 뿜는 피
  function gxSpurt(e, n = 9, ang) {
    const a0 = ang == null ? rand(-Math.PI, 0) : ang, h = enemyH(e) * 0.5;
    for (let i = 0; i < n; i++) { const a = a0 + rand(-0.5, 0.5), sp = rand(60, 150); G.parts.push({ x: e.x + rand(-3, 3), y: e.y - h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, t: rand(0.35, 0.6), c: pick(['#c0202a', '#8a1018', '#e04048']), g: 380, floor: e.y + rand(-2, 6) }); }
    splat(e.x, e.y + 2, n + 4);
  }
  // 연쇄 번개: 꺾이는 번개 줄기 (조금 늦게 다음 대상으로)
  function gxBolt(a, b, delay = 0) { fxPush({ kind: 'gx_bolt', x0: a.x, y0: a.y - enemyH(a) * 0.5, x1: b.x, y1: b.y - enemyH(b) * 0.5, t: 0.32 + delay, max: 0.32 + delay, d0: delay, seed: rand(0, 999) }); }
  // 흡혈·핏빛 엄니: 생명 구슬이 플레이어에게 빨려 들어감
  function gxOrbs(e, kind) { for (let i = 0; i < 4; i++) fxPush({ kind: 'gx_orb', x: e.x + rand(-6, 6), y: e.y - enemyH(e) * 0.5, t: 0.55 + i * 0.07, d0: i * 0.07, sw: rand(-40, 40), o: kind }); }
  // 반격 파동
  function gxNova(x, y) { fxPush({ kind: 'gx_nova', x, y, t: 0.6, R: 92 }); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; G.parts.push({ x: x + Math.cos(a) * 10, y: y - 6 + Math.sin(a) * 6, vx: Math.cos(a) * 160, vy: Math.sin(a) * 90 - 30, t: 0.4, c: pick(['#ffe39a', '#fff6d8', '#ffb040']), g: 0, glow: true }); } sfx('perfect', 0.8); }
  // 처형: 붉은 X 베기
  function gxExec(e) { if ((e.gxExT || 0) > time) return; e.gxExT = time + 0.3; fxPush({ kind: 'gx_exec', x: e.x, y: e.y - enemyH(e) * 0.5, t: 0.28, s: Math.max(14, enemyW(e) * 0.8) }); }
  // 가시: 플레이어 둘레 땅에서 가시가 솟음
  function gxThorns(x, y) {
    const sp = []; for (let ring = 0; ring < 2; ring++) { const n = ring ? 11 : 7; for (let i = 0; i < n; i++) { const a = i / n * TAU + ring * 0.3 + rand(-0.12, 0.12), r = ring ? rand(48, 64) : rand(24, 34); sp.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.6, h: ring ? randi(9, 12) : randi(12, 16), d: ring * 0.06 + rand(0, 0.03), lean: Math.cos(a) * 0.35 }); } }
    fxPush({ kind: 'gx_thorns', x, y, t: 0.6, sp });
    sfx('crunch', 1.4);
  }
  // 전투 집중: 모여드는 빛
  function gxFocus() { const P = G.player; fxPush({ kind: 'gx_focus', x: P.x, y: P.y, t: 0.35 }); sfx('ready', 1.2); }
  // 탐욕: 금화가 쏟아짐
  function gxCoins(x, y) {
    const bits = []; for (let i = 0; i < 13; i++) { const a = rand(0, TAU), sp = rand(30, 100); bits.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(140, 220), land: 0, f: rand(0, 6) }); }
    for (const b of bits) b.land = b.vz / 130;
    fxPush({ kind: 'gx_coins', x, y, t: 1.1, bits }); sfx('coin', 1.1);
  }
  // 선제·회피 후 치명: 별빛 폭발
  function gxCrit(e, first) {
    fxPush({ kind: 'gx_crit', x: e.x, y: e.y - enemyH(e) * 0.5, t: 0.32 });
    if (first) G.nums.push({ x: e.x, y: e.y - enemyH(e) - 10, v: '선제!', t: 0.8, c: '#ffd060', s: 1, txt: true, vy: -50 });
  }
  // 점액왕 4세트: 산성 점액이 터져 사방으로
  function gxAcid(x, y) {
    const bits = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + rand(-0.2, 0.2), sp = rand(70, 130); bits.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(80, 150), land: 0, s: randi(2, 3) }); }
    for (const b of bits) b.land = b.vz / 130;
    fxPush({ kind: 'gx_acid', x, y, t: 0.85, bits, R: 84 });
    sfx('blast', 1.6); sfx('eat', 0.7);
  }
  // 기사단 4세트: 하늘에서 망령 대검이 내리꽂힘
  function gxGhostSword(e) { fxPush({ kind: 'gx_gsword', x: e.x, y: e.y + 2, t: 0.75, flip: Math.random() < 0.5 }); }
  const GSWORD = (() => { // 칼끝이 아래로 — 폭 7칸, 길이 26칸
    const rows = ['...www...', '...wWw...', '...www...', '....s....', '.wwwWwww.', 'wwWWWWWww', '.ww.S.ww.', '...sSs...', '...sSs...', '...sSs...', '...sSs...', '..bBWBb..', ...Array(16).fill('..bBWBb..'), '...BWB...', '...BWB...', '...BWB...', '...bWb...', '....W....', '....W....', '....w....'];
    return gCanvas(gOutline(fromRows(rows)), { k: '#101a3a', w: '#a8c0ff', W: '#ffffff', s: '#5a6ab0', S: '#8090d8', b: '#6a88d8', B: '#c8dcff' });
  })();
  // 핏빛 엄니 4세트(분노 상태) 발밑 표식은 drawGearGround

  // 바닥 레이어 (캐릭터·몬스터 아래)
  // v2.18 줄 시뮬레이션: 손잡이를 따라가며 늘어지고, 휘두를 때 끝으로 갈수록 늦게 따라와 마지막에 쫙 펴짐
  function lashSim(key, hx, hy, ang, n, seg, stiff, gy) {
    const P = G.player, dt = Math.min(0.05, Math.max(0, time - (P[key + 'T'] || time))); P[key + 'T'] = time;
    let L = P[key]; if (!L || L.length !== n + 1 || Math.hypot(L[0].x - hx, L[0].y - hy) > 40) { L = P[key] = []; for (let i = 0; i <= n; i++) L.push({ x: hx + Math.cos(ang) * seg * i, y: hy + Math.sin(ang) * seg * i }); }
    L[0].x = hx; L[0].y = hy;
    for (let i = 1; i <= n; i++) { const p = L[i], q = L[i - 1]; p.y += 300 * dt * (1 - stiff); let dx = p.x - q.x, dy = p.y - q.y; const d = Math.hypot(dx, dy) || 1; let nx = q.x + dx / d * seg, ny = q.y + dy / d * seg;
      if (stiff > 0) { const k = stiff * (0.4 + 0.6 * i / n); nx += (hx + Math.cos(ang) * seg * i - nx) * k; ny += (hy + Math.sin(ang) * seg * i - ny) * k; } if (gy != null && ny > gy) { ny = gy; nx += (p.x - nx) * 0.5; } p.x = nx; p.y = ny; }
    return L;
  }
  function drawCellPath(pts, colAt) { // 점들을 2px 칸으로 잇고 1칸 외곽선 (회전 없이 칸만)
    const cells = new Map();
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2)); for (let s = 0; s <= n; s++) { const x = snap2(a.x + (b.x - a.x) * s / n), y = snap2(a.y + (b.y - a.y) * s / n), k = x + ',' + y; if (!cells.has(k)) cells.set(k, colAt(i, s / n)); } }
    ctx.fillStyle = '#0b0a0e'; for (const k of cells.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) if (!cells.has((x + dx) + ',' + (y + dy))) ctx.fillRect(x + dx, y + dy, 2, 2); }
    for (const [k, c] of cells) { const [x, y] = k.split(',').map(Number); ctx.fillStyle = c; ctx.fillRect(x, y, 2, 2); }
  }
  function lashStiff(st) { const P = G.player; if (P.state !== 'attack') return 0; const pr = (P.t - st.wind) / st.swing; if (P.t < st.wind) return 0.05; if (pr < 1) return 0.1 + 0.75 * pr * pr; return Math.max(0, 0.85 - (P.t - st.wind - st.swing) * 5); }
  function drawCellPaths(list) { // 여러 줄을 한 덩어리로 칸 그리기 (외곽선은 덩어리 바깥에만)
    const cells = new Map();
    for (const [pts, colAt] of list) for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2)); for (let s = 0; s <= n; s++) { const x = snap2(a.x + (b.x - a.x) * s / n), y = snap2(a.y + (b.y - a.y) * s / n), k = x + ',' + y; if (!cells.has(k)) cells.set(k, colAt(i, s / n)); } }
    ctx.fillStyle = '#0b0a0e'; for (const k of cells.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) if (!cells.has((x + dx) + ',' + (y + dy))) ctx.fillRect(x + dx, y + dy, 2, 2); }
    for (const [k, c] of cells) { const [x, y] = k.split(',').map(Number); ctx.fillStyle = c; ctx.fillRect(x, y, 2, 2); }
  }
  // v2.19 채찍 줄: 손잡이 끝에 고정, 마디가 앞 마디를 늦게 따라와 휘어지고(중력 거의 없음), 뻣뻣함이 오르면 쫙 펴진다
  function whipSim(hx, hy, ang, n, seg, stiff, grav) {
    const P = G.player, dt = Math.min(0.05, Math.max(0, time - (P.whipT || time))); P.whipT = time;
    let L = P.whipL; if (!L || L.length !== n + 1 || Math.hypot(L[0].x - hx, L[0].y - hy) > 40) { L = P.whipL = []; for (let i = 0; i <= n; i++) L.push({ x: hx + Math.cos(ang) * seg * i, y: hy + Math.sin(ang) * seg * i }); }
    L[0].x = hx; L[0].y = hy;
    for (let i = 1; i <= n; i++) { const p = L[i], q = L[i - 1]; p.y += grav * dt; let dx = p.x - q.x, dy = p.y - q.y; const d = Math.hypot(dx, dy) || 1; let nx = q.x + dx / d * seg, ny = q.y + dy / d * seg;
      const k = stiff * (0.35 + 0.65 * (1 - i / n)); /* 끝으로 갈수록 덜 펴져 휘어짐이 남는다 */ nx += (hx + Math.cos(ang) * seg * i - nx) * k; ny += (hy + Math.sin(ang) * seg * i - ny) * k; p.x = nx; p.y = ny; }
    return L;
  }
  const wvt = () => { const P = G.player; return P.state === 'prs' && P.prsWhip ? P.prsWhip : null; }; // v3.22 참회의 난타: 기본 공격 채찍 동작을 그대로 씀 (가상 시간 tt)
  function whipExt(st) { const P = G.player, V = wvt(); if (P.state !== 'attack' && !V) return 0; const t = V ? V.tt : P.t; // 0: 감김 → 1: 끝까지 뻗음
    if (t < st.wind) return 0.2 * t / st.wind;
    if (t < st.wind + st.swing * 0.6) return 0.2 + 0.8 * (t - st.wind) / (st.swing * 0.6);
    if (t < st.wind + st.swing + 0.05) return 1;
    return Math.max(0, 1 - (t - st.wind - st.swing - 0.05) / (st.rec * 0.7)); }
  function whipStiff(st) { const P = G.player, V = wvt(); if (P.state !== 'attack' && !V) return 0.32; const t = V ? V.tt : P.t, pr = (t - st.wind) / st.swing; // 휘두르는 동안 늘어지듯 따라오다 끝에서 쫙
    if (t < st.wind) return 0.06; if (pr < 1) return 0.04 + 0.5 * pr * pr * pr; return Math.max(0.2, 0.54 - (t - st.wind - st.swing) * 3); } // v2.19 덜 뻣뻣하게 — 끝까지 적당히 휜 채로
  function drawWhip(hx, hy) { // v2.19 고해의 채찍: 손잡이는 고정, 가죽 줄만 늘어나며 휘어 때린다
    const P = G.player, a = P.blade, st = SWING_PW[P.combo] || SWING_PW[0], ux = Math.cos(a), uy = Math.sin(a), ex = hx + ux * 12, ey = hy + uy * 12;
    const n = 12, len = 14 + (st.reach - 26) * whipExt(st), L = whipSim(ex, ey, a, n, len / n, whipStiff(st), P.state === 'attack' || wvt() ? 0 : 90);
    whipWrap(L, ex, ey, a, n, len);
    const thick = L.slice(0, 5).map((p, i) => { const q = L[Math.min(n, i + 1)], b = L[Math.max(0, i - 1)], nx = -(q.y - b.y), ny = q.x - b.x, d = Math.hypot(nx, ny) || 1; return { x: p.x + nx / d * 2, y: p.y + ny / d * 2 }; }); // 손잡이 쪽은 두껍게
    const lc = (i, t) => i >= n - 1 ? (i === n - 1 && t > 0.5 ? '#d8d0c0' : '#7a3a24') : (i % 2 ? '#7a3a24' : '#a0503a'); // 끝은 가는 끈 + 흰 매듭
    drawCellPaths([[[{ x: hx - ux * 2, y: hy - uy * 2 }, { x: ex, y: ey }], (i, t) => t < 0.2 ? '#8a8a94' : t > 0.8 ? '#c0c0c8' : '#3a1a14'], [thick, () => '#5a2a20'], [L, lc]]);
    P.lashTip = L[n];
  }
  // v2.19 채찍 3타: 손잡이를 중심으로 한 바퀴 돌 때 가죽 줄이 몸 둘레를 따라 둥글게 감긴다 (줄이 손잡이 뒤로 휘어 따라옴)
  function whipWrap(L, hx, hy, a, n, len) {
    const P = G.player, st = SWING_PW[2], V = wvt(); if ((P.state !== 'attack' && !V) || P.combo !== 2) return;
    const t = (V ? V.tt : P.t) - st.wind; if (t < -0.02 || t > st.swing + 0.06) return;
    const dir = Math.sign(st.a1 - st.a0) * (P.sign || 1), cx = P.x, cy = P.y - 8, R = Math.max(18, Math.hypot(hx - cx, hy - cy) + 6), k = Math.min(1, (t + 0.02) / 0.08);
    const a0 = Math.atan2(hy - cy, hx - cx);
    for (let i = 1; i <= n; i++) { const s0 = i / n, r = R + (st.reach - R) * 0.55 * s0, th = a0 - dir * (len * s0) / ((R + r) / 2); // 몸 둘레를 따라 뒤로 감긴 호
      const tx = cx + Math.cos(th) * r, ty = cy + Math.sin(th) * r * 0.8; L[i].x += (tx - L[i].x) * k; L[i].y += (ty - L[i].y) * k; }
  }
  // v2.19 사슬 분절검 3타: 검 모양 그대로 마디 사이가 벌어지며 곧게 늘어난다 (사슬은 틈에만 보임)
  function chainPieces(tex) {
    if (tex._chainP) return tex._chainP;
    const cy = tex.py, cuts = [];
    for (let x = 0; x < tex.w; x++) if (tex.cells[cy][x] === 'c') cuts.push(x);
    const bounds = [], out = []; let s0 = 0; for (const c of cuts) { bounds.push([s0, c]); s0 = c + 1; } bounds.push([s0, tex.w - 1]);
    for (const [a, b] of bounds) { const cells = tex.cells.map(r => r.slice(a, b + 1)), w = b - a + 1, px = a ? 0 : tex.px; // 첫 마디는 손잡이 기준, 나머지는 마디 시작점 기준
      let reach = 0; cells.forEach((r, y) => r.forEach((c, x) => { if (c !== '.') reach = Math.max(reach, Math.hypot(x - px, y - tex.py)); }));
      out.push({ cells, w, h: tex.h, px, py: tex.py, pal: tex.pal, reach: Math.round(reach * 2), rot: {}, x0: a, x1: b }); }
    return (tex._chainP = out);
  }
  function chainExt() { const P = G.player, st = SWING_CH[2], t = P.t; // 0: 접힘 → 1: 최대로 늘어남
    if (t < st.wind) return 0.25 * t / st.wind;
    if (t < st.wind + st.swing * 0.35) return 0.25 + 0.75 * (t - st.wind) / (st.swing * 0.35);
    if (t < st.wind + st.swing) return 1;
    return Math.max(0, 1 - (t - st.wind - st.swing) / (st.rec * 0.7)); }
  function drawChainBlade(hx, hy) {
    const P = G.player, a = P.blade, tex = weaponTex('knight'), pcs = chainPieces(tex), n = pcs.length - 1;
    const gap = n > 0 ? Math.max(0, (SWING_CH[2].reach - tex.reach) / n) : 0, e = chainExt(), ux = Math.cos(a), uy = Math.sin(a);
    const off = k => (pcs[k].x0 - tex.px) * 2 + k * gap * e; // 각 마디의 시작점까지 거리
    for (let k = 1; k <= n; k++) { const d0 = (pcs[k - 1].x1 - tex.px) * 2 + (k - 1) * gap * e, d1 = off(k) + 1; // 마디 사이 사슬 (틈에만)
      if (d1 - d0 > 2) drawCellPath([{ x: hx + ux * d0, y: hy + uy * d0 }, { x: hx + ux * d1, y: hy + uy * d1 }], (i, t) => Math.floor(t * (d1 - d0) / 2) % 2 ? '#6a6e78' : '#3a3c44'); }
    for (let k = 0; k <= n; k++) { const d = k ? off(k) : 0; drawBlade(pcs[k], hx + ux * d, hy + uy * d, a); }
    const tip = off(n) + (pcs[n].w - 1) * 2; P.chainL = [{ x: hx, y: hy }, { x: hx + ux * tip, y: hy + uy * tip }];
  }
  function drawSmokeFloor() { // v2.13 향 연기: 발밑에 낮게 깔리는 성긴 뭉치 (디더 칸 · 캐릭터를 가리지 않음)
    if (!G.smoke || !G.smoke.length) return;
    for (const c of G.smoke) { const a = Math.min(1, c.t / 0.8);
      for (let k = 0; k < 5; k++) { const px = c.x + Math.cos(k * 1.7 + time * 0.6) * 24, py = c.y + Math.sin(k * 2.3 + time * 0.5) * 8, r = 7 + (k % 2) * 3;
        for (let dy = -r; dy <= r; dy += 2) for (let dx = -r * 1.6; dx <= r * 1.6; dx += 2) { const q = (dx * dx) / (r * r * 2.56) + (dy * dy) / (r * r); if (q > 1 || !dith((px + dx) >> 1, (py + dy) >> 1, a * (0.75 - q * 0.6))) continue; ctx.fillStyle = q < 0.3 ? '#d8d0e4' : '#9a90ac'; ctx.fillRect(snap2(px + dx), snap2(py + dy), 2, 2); } } }
  }
  function drawHarp() { const H = G.harp; if (!H || G.cls !== 'gunner') return; const m = muzzle(), ux = Math.cos(H.ang), uy = Math.sin(H.ang), L = H.len, hl = Math.min(14, L);
    if (L - hl > 2) drawCellPath([{ x: m.x, y: m.y }, { x: m.x + ux * (L - hl), y: m.y + uy * (L - hl) }], (i, t) => Math.floor(t * (L - hl) / 4) % 2 ? '#c8b080' : '#8a7450'); // 감기는 밧줄
    drawCellPath([{ x: m.x + ux * (L - hl), y: m.y + uy * (L - hl) }, { x: m.x + ux * L, y: m.y + uy * L }], (i, t) => t > 0.7 ? '#e8ecf0' : '#a8acb4'); // 작살대·촉
    const bx = m.x + ux * (L - 5), by = m.y + uy * (L - 5); // 미늘
    for (const sgn of [-1, 1]) drawCellPath([{ x: bx, y: by }, { x: bx - ux * 4 - uy * 4 * sgn, y: by - uy * 4 + ux * 4 * sgn }], () => '#e8ecf0'); }
  function drawPenance() { // v2.13 고해: 플레이어 발밑 붉은 원 (버프는 바닥 원)
    const P = G.player; if (!(P && P.penT > 0)) return; const r = 18, ry = 7, n = 28;
    for (let i = 0; i < n; i++) { if ((i + Math.floor(time * 8)) % 4 === 0) continue; const a = i / n * TAU; ctx.fillStyle = P.penT < 2 && Math.floor(time * 8) % 2 ? '#5a0a10' : '#d02030'; ctx.fillRect(snap2(P.x + Math.cos(a) * r), snap2(P.y + Math.sin(a) * ry), 2, 2); }
  }
  function drawSoupFloor() { // v2.10 끓는 수프: 바닥에 깔리는 국물 웅덩이 (2px 칸 · 가장자리는 디더로 사라짐)
    if (!G.soup || !G.soup.length) return;
    for (const q of G.soup) {
      const k = Math.min(1, q.t / 0.8, (4.5 - q.t) / 0.25 + 0.2), rx = 30, ry = 12;
      for (let yy = Math.round(q.y - ry) & ~1; yy <= q.y + ry; yy += 2) for (let xx = Math.round(q.x - rx) & ~1; xx <= q.x + rx; xx += 2) {
        const dx = xx - q.x, dy = yy - q.y, e = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry); if (e > 1) continue;
        if (k < 1 && !dith(xx >> 1, yy >> 1, k * 1.1 - e * 0.3)) continue;
        const h = GX.hr(Math.round(dx / 2) * 0.37 + Math.round(dy / 2) * 1.91 + Math.floor(q.x) * 0.01);
        let c = e > 0.8 ? '#5a2410' : e > 0.62 ? '#9a3a14' : '#c8561a';
        if (e <= 0.8) { if (dy === -4 && dx > -18 && dx < -6) c = '#f0a050'; else if (dy === -2 && dx > -14 && dx < -10) c = '#ffd8a0'; else if (h > 0.96) c = '#6aa040'; else if (h > 0.935) c = '#3a7a2a'; else if (h > 0.9) c = '#f0b040'; else if (Math.sin(dx * 0.16 + dy * 0.45 + time * 2.4) > 0.72) c = '#e8843a'; }
        ctx.fillStyle = c; ctx.fillRect(xx, yy, 2, 2);
      }
      for (let i = 0; i < 5; i++) { // 보글보글: 부풀다 터지는 거품
        const bx = snap2(q.x + (GX.hr(q.x * 0.1 + i * 7.3) - 0.5) * 40), by = snap2(q.y + (GX.hr(q.y * 0.1 + i * 3.1) - 0.5) * 12), ph = (time * 1.3 + i * 0.37) % 1;
        if (ph < 0.55) { ctx.fillStyle = '#5a2410'; ctx.fillRect(bx - 1, by - 1, 4, 4); ctx.fillStyle = ph < 0.3 ? '#f0a050' : '#ffd8a0'; ctx.fillRect(bx, by, 2, 2); }
        else if (ph < 0.7) { ctx.fillStyle = '#ffe0b0'; for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) ctx.fillRect(bx + ox, by + oy, 2, 2); }
      }
      if (k > 0.5) for (let i = 0; i < 3; i++) { const ph = (time * 0.7 + i * 0.33) % 1, sx = snap2(q.x - 14 + i * 14 + Math.sin(time * 3 + i) * 3), sy = snap2(q.y - 4 - ph * 18); if ((Math.floor(ph * 8) + i) % 3 === 2) continue; ctx.fillStyle = '#d8d0c8'; ctx.fillRect(sx, sy, 2, 2); }
    }
  }
  function drawGearGround() {
    const P = G.player, s = G.stats; if (!s) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // 불길 점멸: 타오르는 바닥
    if (G.pfire) for (const f of G.pfire) {
      const k = Math.min(1, f.t / 0.6), rx = 26, ry = 18, fl = Math.floor(time * 10), S0 = `rgba(255,220,120,${0.8 * k})`, S1 = `rgba(255,120,40,${0.65 * k})`, S2 = `rgba(170,40,16,${0.55 * k})`; // v2.19 색 문자열은 칸마다 만들지 않는다
      for (let yy = Math.round(f.y - ry) & ~1; yy <= f.y + ry; yy += 2) for (let xx = Math.round(f.x - rx) & ~1; xx <= f.x + rx; xx += 2) {
        const q = Math.hypot((xx - f.x) / rx, (yy - f.y) / ry); if (q >= 1) continue;
        const h = GX.hr(xx * 0.37 + yy * 1.91 + fl * 0.13), lv = (1 - q) * k;
        if (!dith(xx >> 1, yy >> 1, lv * 0.95)) continue;
        ctx.fillStyle = h > 0.85 ? S0 : h > 0.55 ? S1 : S2;
        ctx.fillRect(xx, yy, 2, 2);
      }
    }
    // 전투 집중: 발밑 예리한 고리 + 마름모 4개
    if (P.echoT > 0) {
      const k = Math.min(1, P.echoT / 0.4), R = 26, pul = 0.5 + 0.5 * Math.sin(time * 10);
      GX.ring(P.x, P.y + 1, R, '140,230,255', 0.85 * k, 2, 0.45, 5, time * 2.6);
      GX.ring(P.x, P.y + 1, R - 6, '220,250,255', (0.25 + 0.3 * pul) * k, 1, 0.45, 3, -time * 3.4);
      for (let i = 0; i < 4; i++) { const t = i / 4 * TAU + time * 1.3, x = P.x + Math.cos(t) * (R + 4), y = P.y + 1 + Math.sin(t) * (R + 4) * 0.45; ctx.fillStyle = `rgba(200,245,255,${0.9 * k})`; for (const [dx, dy] of [[0, -2], [-2, 0], [2, 0], [0, 2], [0, 0]]) ctx.fillRect((Math.round(x) & ~1) + dx, (Math.round(y) & ~1) + dy, 2, 2); }
    }
    // 선제·치명 준비: 금빛 조준 꺾쇠 4개
    if ((P.critNext || P.counterT > 0) && !P.dead) {
      const R = 28 + Math.sin(time * 6) * 2, a = 0.7 + 0.3 * Math.sin(time * 9);
      for (let i = 0; i < 4; i++) { const t = i / 4 * TAU + Math.PI / 4 + time * 0.8, x = P.x + Math.cos(t) * R, y = P.y + 1 + Math.sin(t) * R * 0.45, ux = -Math.sign(Math.cos(t)) * 2, uy = -Math.sign(Math.sin(t)) * 2;
        ctx.fillStyle = `rgba(255,214,96,${a})`; for (let m = 0; m < 5; m++) { ctx.fillRect((Math.round(x) & ~1) + ux * m, Math.round(y) & ~1, 2, 2); ctx.fillRect(Math.round(x) & ~1, (Math.round(y) & ~1) + uy * m, 2, 2); } }
    }
    if (P.counterT > 0 && !P.dead) { // v2.27 반격 시간 남은 막대 (발밑, 금빛)
      const w = Math.max(2, Math.round(28 * Math.min(1, P.counterT / (P.counterMax || COUNTER_T)) / 2) * 2), x = snap2(P.x - 14), y = snap2(P.y + 8);
      ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 2, y - 2, 32, 6); ctx.fillStyle = '#5a4214'; ctx.fillRect(x, y, 28, 2); ctx.fillStyle = Math.floor(time * 10) % 2 && P.counterT < 0.6 ? '#fff2c0' : '#ffd34d'; ctx.fillRect(x, y, w, 2);
      if (Math.random() < 0.5) G.parts.push({ x: P.x + rand(-10, 10), y: P.y - rand(0, 24), vx: rand(-8, 8), vy: -rand(20, 45), t: 0.35, c: pick(['#ffd34d', '#fff2c0', '#ffb040']), g: 0, glow: true });
    }
    // 핏빛 엄니 4세트 분노 (HP 50% 이하): 붉은 톱니 고리 + 엄니 두 개
    if (s.set4.has('orc') && P.hp < s.hp * 0.5 && !P.dead) {
      const pul = 0.5 + 0.5 * Math.sin(time * 5), R = 24;
      GX.disc(P.x, P.y + 1, R * 0.9, '160,20,10', 0.25 + 0.12 * pul, 0.45, 0.5);
      const n = 28; for (let i = 0; i < n; i++) { const t = i / n * TAU - time * 1.2, rr = R + (i % 2 ? 0 : 3); GX.c(P.x + Math.cos(t) * rr, P.y + 1 + Math.sin(t) * rr * 0.45, `rgba(255,${i % 2 ? 70 : 120},50,${0.8})`); }
      for (const sd of [-1, 1]) { const bx = P.x + sd * (R + 6), by = P.y; ctx.fillStyle = 'rgba(255,230,200,0.85)'; for (let m = 0; m < 4; m++) ctx.fillRect((Math.round(bx + sd * (m < 2 ? 0 : -2 * (m - 1))) & ~1), (Math.round(by - m * 2) & ~1), 2, 2); }
      if (Math.random() < 0.3) { const t = rand(0, TAU); G.parts.push({ x: P.x + Math.cos(t) * R, y: P.y + Math.sin(t) * R * 0.45, vx: 0, vy: -rand(25, 50), t: 0.4, c: pick(['#ff5030', '#ffa060']), g: 0, glow: true }); }
    }
    // 바닥에 깔리는 일회성 효과
    for (const f of G.fx) {
      if (!f.kind || f.kind.slice(0, 3) !== 'gx_') continue;
      const el = gxEl(f), p = 1 - f.t / f.max;
      if (f.kind === 'gx_corpse') { const q = Math.min(1, el / 0.35); if (q < 1) { GX.disc(f.x, f.y, 14 + f.r * 0.6 * easeOut(q), '150,10,10', 0.5 * (1 - q), 0.55, 0.7); GX.ring(f.x, f.y, 10 + f.r * easeOut(q), '220,40,30', 0.85 * (1 - q), 3, 0.55, 0); GX.ring(f.x, f.y, 6 + f.r * 0.7 * easeOut(q), '255,140,60', 0.6 * (1 - q), 1, 0.55, 3); } }
      else if (f.kind === 'gx_ignite') { const q = easeOut(p); GX.ring(f.x, f.y, 8 + 22 * q, '255,140,40', 0.9 * (1 - p), 2, 0.7); GX.disc(f.x, f.y, 10 + 18 * q, '255,200,90', 0.5 * (1 - p), 0.7); }
      else if (f.kind === 'gx_nova') {
        const q = easeOut(Math.min(1, p * 1.3));
        GX.ring(f.x, f.y, 10 + f.R * q, '255,220,120', 0.9 * (1 - p), 3, 0.55);
        if (p > 0.15) GX.ring(f.x, f.y, 6 + f.R * 0.6 * easeOut((p - 0.15) / 0.85), '255,250,220', 0.6 * (1 - p), 1, 0.55, 4);
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.13, r0 = 8 + f.R * q * 0.5, r1 = 8 + f.R * q; ctx.fillStyle = `rgba(255,200,90,${0.7 * (1 - p)})`; for (let r = r0; r < r1; r += 4) ctx.fillRect(Math.round(f.x + Math.cos(a) * r) & ~1, Math.round(f.y + Math.sin(a) * r * 0.55) & ~1, 2, 2); }
        if (p < 0.25) GX.disc(f.x, f.y, 16, '255,250,220', 0.8 * (1 - p * 4), 0.6);
      }
      else if (f.kind === 'gx_focus') { const r = 44 * (1 - easeOut(p)) + 6, P0 = G.player; GX.ring(P0.x, P0.y + 1, r, '160,240,255', 0.9 * (1 - p * 0.6), 1, 0.45, 2, p * 3); }
      else if (f.kind === 'gx_acid') {
        const q = Math.min(1, el / 0.3); if (q < 1) { GX.ring(f.x, f.y, 10 + f.R * easeOut(q), '150,230,70', 0.85 * (1 - q), 2, 0.55, 0); GX.disc(f.x, f.y, 10 + 30 * q, '120,210,50', 0.45 * (1 - q), 0.55); }
        // 떨어진 점액 웅덩이 (작게, 금방 마름)
        for (const b of f.bits) { const B = GX.bit(b, el); if (!B.landed) continue; const fade = Math.max(0, f.t / 0.4); ctx.fillStyle = `rgba(120,210,50,${0.6 * Math.min(1, fade)})`; for (let i = -b.s; i <= b.s; i++) ctx.fillRect((Math.round(B.x) & ~1) + i * 2, Math.round(B.y) & ~1, 2, 2); }
      }
      else if (f.kind === 'gx_gsword') {
        const hitT = 0.16; if (el >= hitT) { const q = Math.min(1, (el - hitT) / 0.4), a = 1 - q;
          GX.ring(f.x, f.y, 8 + 46 * easeOut(q), '150,180,255', 0.85 * a, 2, 0.5);
          GX.disc(f.x, f.y, 26, '110,140,230', 0.35 * a, 0.5, 0.7);
          // 바닥 왕관 문장 (기사단)
          const cr = ['y...yy...y', 'yy.yyyy.yy', 'yyyyyyyyyy', 'yyyyyyyyyy']; ctx.fillStyle = `rgba(190,210,255,${0.8 * a})`;
          for (let j = 0; j < cr.length; j++) for (let i = 0; i < 10; i++) if (cr[j][i] === 'y') ctx.fillRect((Math.round(f.x) & ~1) - 10 + i * 2, (Math.round(f.y) & ~1) - 2 + j * 2 - 4, 2, 2); }
      }
    }
    ctx.restore();
  }
  // 서 있는 효과: 깊이 정렬에 넣는다
  function gearEnts(ents) {
    if (G.pfire) for (const f of G.pfire) for (let i = 0; i < 9; i++) { const ox = (GX.hr(f.x * 0.1 + i * 7.3) - 0.5) * 40, oy = (GX.hr(f.y * 0.1 + i * 3.1) - 0.5) * 26; if (Math.hypot(ox / 26, oy / 18) > 0.9) continue; ents.push({ y: f.y + oy, d: () => gxFlame(f.x + ox, f.y + oy, Math.min(1, f.t / 0.6), i) }); }
    for (const f of G.fx) if (f.kind === 'gx_thorns') for (const s of f.sp) ents.push({ y: s.y, d: () => gxSpike(f, s) });
    for (const f of G.fx) if (f.kind === 'gx_gsword') ents.push({ y: f.y + 1, d: () => gxSword(f) });
  }
  function gxFlame(x, y, k, i) {
    const fr = Math.floor(time * 12 + i * 3) % 4, h = Math.round((4 + (i % 3) + [0, 1, 2, 1][fr]) * k);
    if (h < 1) return;
    const cells = [], gx = Math.round(x) & ~1, gy = Math.round(y) & ~1;
    for (let j = 0; j < h; j++) { const t = j / h, w = t < 0.35 ? 1 : 0, sway = Math.round(Math.sin(time * 9 + i + j * 0.8) * (t > 0.5 ? 1 : 0)) * 2;
      for (let m = -w; m <= w; m++) cells.push([gx + m * 2 + sway, gy - j * 2, t > 0.7 ? '#fff0b0' : t > 0.4 ? '#ffd060' : m === 0 ? '#ff8a2a' : '#e04a1a']); }
    ctx.save(); GX.shape(cells, '#5a1008', 0.95); ctx.restore();
  }
  function gxSpike(f, s) {
    const el = gxEl(f) - s.d; if (el < 0) return;
    const up = el < 0.07 ? el / 0.07 : el < 0.32 ? 1 : Math.max(0, 1 - (el - 0.32) / 0.2), h = Math.round(s.h * up); if (h < 1) return;
    const cells = [], bx = Math.round(s.x) & ~1, by = (Math.round(s.y) & ~1) + (s.h - h) * 2; // 끝부터 솟고 끝을 남기며 가라앉는다
    for (let j = s.h - h; j < s.h; j++) { const t = j / s.h, w = t < 0.25 ? 2 : t < 0.6 ? 1 : 0, lx = Math.round(s.lean * j * 0.5) * 2;
      for (let m = -w; m <= w; m++) cells.push([bx + m * 2 + lx, by - j * 2, j === s.h - 1 ? '#f0ead0' : m < 0 ? '#a89a78' : m > 0 ? '#5a4e3a' : '#cfc4a0']); if (j === Math.round(s.h * 0.45)) cells.push([bx + lx + (s.lean > 0 ? 4 : -4), by - j * 2 - 2, '#cfc4a0']); }
    ctx.save(); GX.shape(cells); ctx.restore();
    if (el < 0.1) { ctx.fillStyle = 'rgba(90,70,50,0.7)'; ctx.fillRect(bx - 4, by + 2, 2, 2); ctx.fillRect(bx + 4, by + 2, 2, 2); }
  }
  function gxSword(f) {
    const el = gxEl(f), hitT = 0.16, W = GSWORD.width, H = GSWORD.height;
    let y, a; if (el < hitT) { y = f.y - 14 - (1 - el / hitT) * 130; a = 0.5 + 0.5 * el / hitT; } else { const q = (el - hitT) / (f.max - hitT); y = f.y - 14 + Math.min(1, (el - hitT) / 0.05) * 6 - Math.max(0, q - 0.5) * 30; a = q < 0.5 ? 1 : 1 - (q - 0.5) * 2; }
    const x = (Math.round(f.x - W / 2) & ~1), yy = Math.round(y - H + 10) & ~1;
    ctx.save(); ctx.globalAlpha = Math.max(0, a) * 0.92; if (f.flip) { ctx.translate(x + W, 0); ctx.scale(-1, 1); ctx.drawImage(GSWORD, 0, yy); } else ctx.drawImage(GSWORD, x, yy);
    ctx.restore();
    if (el < hitT) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(150,180,255,0.35)'; for (let k = 1; k < 5; k++) ctx.fillRect(Math.round(f.x) & ~1, yy - k * 8, 2, 4); ctx.restore(); }
    if (el > hitT && Math.random() < 0.5) G.parts.push({ x: f.x + rand(-10, 10), y: f.y - rand(0, 30), vx: rand(-8, 8), vy: -rand(30, 60), t: 0.5, c: pick(['#a8c0ff', '#e0ecff']), g: 0, glow: true });
  }
  // 위 레이어 (drawFx 에서 호출)
  function drawGearFx(f) {
    const el = gxEl(f), p = 1 - f.t / f.max;
    if (f.kind === 'gx_corpse') {
      if (el < 0.1) { ctx.globalCompositeOperation = 'lighter'; GX.disc(f.x, f.y - 8, 10 + el * 120, '255,220,170', 0.9 * (1 - el / 0.1)); ctx.globalCompositeOperation = 'source-over'; }
      const fade = Math.min(1, f.t / 0.25), cells = [];
      for (const b of f.bits) { const B = GX.bit(b, el), y = B.y - B.z;
        if (b.bone) { cells.push([B.x - 2, y, '#c8bea8'], [B.x, y, '#e8e0cc'], [B.x + 2, y, '#e8e0cc'], [B.x + 4, y + (B.landed ? 0 : -2), '#c8bea8']); } else { cells.push([B.x, y, b.c], [B.x + 2, y, b.c], [B.x, y - 2, '#c0303a'], [B.x + 2, y - 2, b.c]); } }
      GX.shape(cells, '#0b0a0e', fade);
    } else if (f.kind === 'gx_wave') {
      const q = easeOut(p), d = 18 + 175 * q, R = 44, span = 1.7, ux = Math.cos(f.ang), uy = Math.sin(f.ang) * 0.8;
      for (let g2 = 2; g2 >= 0; g2--) { // 잔상 2개 + 본체
        const dd = d - g2 * 14, cx = f.x + ux * (dd - R), cy = f.y + uy * (dd - R), a = g2 ? 0.35 / g2 : 1, cells = [];
        if (dd < 10) continue;
        for (let i = -20; i <= 20; i++) { const s = i / 20, ang = f.ang + s * span * 0.5, th = Math.round(5 * (1 - s * s)); for (let k = 0; k <= th; k++) { const rr = R - k * 2; cells.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.8, k <= 1 ? '#ffffff' : k <= 3 ? `rgb(${f.c})` : f.c2]); } }
        ctx.save(); if (g2) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * (1 - p); for (const c of cells) { ctx.fillStyle = c[2]; ctx.fillRect(Math.round(c[0]) & ~1, Math.round(c[1]) & ~1, 2, 2); } } else GX.shape(cells, '#141c34', p > 0.75 ? (1 - p) * 4 : 1); ctx.restore();
      }
      if (Math.random() < 0.6) G.parts.push({ x: f.x + ux * d + rand(-10, 10), y: f.y + uy * d + rand(-10, 10), vx: ux * 40, vy: uy * 40, t: 0.25, c: f.c2, g: 0, glow: true });
    } else if (f.kind === 'gx_bolt') {
      if (el < f.d0) return; const q = (el - f.d0) / (f.max - f.d0), flick = Math.floor(time * 24);
      if (q > 0.55 && flick % 2) return; // 끝날 때 깜빡임
      let rs = f.seed + flick * 13.1; const rnd = () => GX.hr(rs += 1.7);
      const L = Math.hypot(f.x1 - f.x0, f.y1 - f.y0), n = Math.max(3, Math.round(L / 12)), nx = -(f.y1 - f.y0) / (L || 1), ny = (f.x1 - f.x0) / (L || 1), pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n, off = i === 0 || i === n ? 0 : (rnd() - 0.5) * 18; pts.push([f.x0 + (f.x1 - f.x0) * t + nx * off, f.y0 + (f.y1 - f.y0) * t + ny * off]); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(70,120,255,0.45)';
      for (let i = 0; i < n; i++) { const [a0, b0] = pts[i], [a1, b1] = pts[i + 1], m = Math.ceil(Math.hypot(a1 - a0, b1 - b0) / 2); for (let k = 0; k <= m; k++) ctx.fillRect((Math.round(a0 + (a1 - a0) * k / m) & ~1) - 2, (Math.round(b0 + (b1 - b0) * k / m) & ~1) - 2, 6, 6); }
      ctx.restore();
      const cells = []; for (let i = 0; i < n; i++) { const [a0, b0] = pts[i], [a1, b1] = pts[i + 1], m = Math.ceil(Math.hypot(a1 - a0, b1 - b0) / 2); for (let k = 0; k <= m; k++) cells.push([a0 + (a1 - a0) * k / m, b0 + (b1 - b0) * k / m, q < 0.4 ? '#ffffff' : '#bfe0ff']); }
      // 곁가지 2개
      for (let j = 0; j < 2; j++) { const i = 1 + Math.floor(rnd() * (n - 1)), [a0, b0] = pts[i], ang = Math.atan2(f.y1 - f.y0, f.x1 - f.x0) + (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.6); let x = a0, y = b0; for (let k = 0; k < 5; k++) { x += Math.cos(ang) * 2 + (rnd() - 0.5) * 2; y += Math.sin(ang) * 2 + (rnd() - 0.5) * 2; cells.push([x, y, '#8fc8ff']); } }
      GX.shape(cells, '#1a2a6a');
      for (const [x, y, r] of [[f.x0, f.y0, 4], [f.x1, f.y1, 6]]) { const s = q < 0.3 ? r + 2 : r; const st = []; for (let k = -s; k <= s; k += 2) { st.push([x + k, y, '#e0f0ff']); st.push([x, y + k, '#e0f0ff']); } st.push([x, y, '#ffffff']); GX.shape(st, '#1a2a6a', 1 - q * 0.5); }
    } else if (f.kind === 'gx_orb') {
      if (el < f.d0) return; const P = G.player, q = Math.min(1, (el - f.d0) / (f.max - f.d0 - 0.05)), e2 = q * q;
      const tx = P.x, ty = P.y - 14, mx = (f.x + tx) / 2 + f.sw, my = Math.min(f.y, ty) - 40, x = (1 - e2) * (1 - e2) * f.x + 2 * (1 - e2) * e2 * mx + e2 * e2 * tx, y = (1 - e2) * (1 - e2) * f.y + 2 * (1 - e2) * e2 * my + e2 * e2 * ty;
      const [c1, c2, c3] = f.o === 'orc' ? ['#ffb080', '#ff6a30', '#7a2010'] : ['#ff8a90', '#d01828', '#4a0810'];
      if (q < 1) { const cells = [[x, y - 2, c2], [x - 2, y, c2], [x, y, c1], [x + 2, y, c2], [x - 2, y + 2, c2], [x, y + 2, c2], [x + 2, y + 2, c3 === '#7a2010' ? '#c04020' : '#901018'], [x, y + 4, c2], [x - 2, y - 2, c1]]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c2; ctx.globalAlpha = 0.5; for (let k = 1; k < 4; k++) { const e3 = Math.max(0, e2 - k * 0.05); ctx.fillRect(Math.round((1 - e3) * (1 - e3) * f.x + 2 * (1 - e3) * e3 * mx + e3 * e3 * tx) & ~1, Math.round((1 - e3) * (1 - e3) * f.y + 2 * (1 - e3) * e3 * my + e3 * e3 * ty) & ~1, 2, 2); } ctx.restore(); GX.shape(cells, c3); }
      else if (!f.popped) { f.popped = true; for (let i = 0; i < 6; i++) { const a = rand(0, TAU); G.parts.push({ x: P.x + Math.cos(a) * 8, y: P.y - 14 + Math.sin(a) * 6, vx: Math.cos(a) * 30, vy: -rand(30, 60), t: 0.4, c: c1, g: 0, glow: true }); } }
    } else if (f.kind === 'gx_exec') {
      const s = f.s * (0.6 + 0.4 * easeOut(Math.min(1, p * 3))), cells = [], a = p > 0.6 ? (1 - p) / 0.4 : 1;
      for (let k = -s; k <= s; k += 2) { const w = Math.abs(k) < s * 0.6 ? '#ffffff' : '#ff4040'; cells.push([f.x + k, f.y + k * 0.8, w]); if (p > 0.1) cells.push([f.x + k, f.y - k * 0.8, w]); }
      GX.shape(cells, '#3a0006', a);
    } else if (f.kind === 'gx_coins') {
      const fade = Math.min(1, f.t / 0.3), cells = [];
      for (const b of f.bits) { const B = GX.bit(b, el), y = B.y - B.z, fr = Math.floor(el * 14 + b.f) % 4, w = B.landed ? 1 : [1, 1, 0, 1][fr];
        if (w) cells.push([B.x - 2, y - 2, '#ffd860'], [B.x, y - 2, '#fff0a0'], [B.x + 2, y - 2, '#e8b830'], [B.x - 2, y, '#e8b830'], [B.x, y, '#c8901c'], [B.x + 2, y, '#e8b830'], [B.x - 2, y + 2, '#c8901c'], [B.x, y + 2, '#a87a18'], [B.x + 2, y + 2, '#a87a18'], [B.x, y - 4, '#ffd860'], [B.x, y + 4, '#8a6010'], [B.x - 4, y, '#e8b830'], [B.x + 4, y, '#a87a18']); else cells.push([B.x, y - 4, '#ffe080'], [B.x, y - 2, '#ffd860'], [B.x, y, '#c89a28'], [B.x, y + 2, '#a87a18'], [B.x, y + 4, '#8a6010']); }
      GX.shape(cells, '#2a1a04', fade);
      if (el < 0.12) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; GX.disc(f.x, f.y - 6, 14, '255,220,120', 0.7 * (1 - el / 0.12)); ctx.restore(); }
    } else if (f.kind === 'gx_crit') {
      const q = easeOut(p), r = 8 + 22 * q, cells = [];
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, L = i % 2 ? r * 0.55 : r; for (let k = 4; k < L; k += 2) cells.push([f.x + Math.cos(a) * k, f.y + Math.sin(a) * k, k < L * 0.5 ? '#ffffff' : '#ffd060']); }
      cells.push([f.x, f.y, '#ffffff']); GX.shape(cells, '#3a2400', 1 - p);
    } else if (f.kind === 'gx_acid') {
      if (el < 0.1) { ctx.globalCompositeOperation = 'lighter'; GX.disc(f.x, f.y - 10, 8 + el * 160, '200,255,140', 0.8 * (1 - el / 0.1)); ctx.globalCompositeOperation = 'source-over'; }
      const cells = []; for (const b of f.bits) { const B = GX.bit(b, el); if (B.landed) continue; const y = B.y - B.z - 8; for (let i = -1; i <= 1; i++) cells.push([B.x + i * 2, y - 2, i < 0 ? '#e8ffc0' : '#b8f080']); for (let i = -b.s + 1; i <= b.s - 1; i++) cells.push([B.x + i * 2, y, i < 0 ? '#b8f080' : '#7ac843']); for (let i = -1; i <= 1; i++) cells.push([B.x + i * 2, y + 2, '#4a9028']); }
      GX.shape(cells, '#1a3a0a');
      if (el < 0.5 && Math.random() < 0.5) { const a = rand(0, TAU); G.parts.push({ x: f.x + Math.cos(a) * rand(4, 30), y: f.y + Math.sin(a) * rand(2, 14), vx: 0, vy: -rand(20, 40), t: 0.4, c: pick(['#b8f080', '#e8ffc0']), g: 0, glow: true }); }
    }
  }
  // 머리 위 표식: 출혈 중 핏방울, 처형 가능(HP 30% 이하) 해골
  const BLOOD_ICON = gCanvas(gOutline(fromRows(['..r..', '.rrr.', 'rrRrr', 'rRwRr', 'rrRrr', '.rrr.'])), { r: '#c0202a', R: '#7a1018', w: '#ff9aa0', k: '#0b0a0e' });
  const ICE_ICON = gCanvas(gOutline(fromRows(['..w..', 'w.w.w', '.wbw.', 'w.w.w', '..w..'])), { w: '#cfefff', b: '#7ac0e8', k: '#0b0a0e' }); // v2.03 둔화
  const BIND_ICON = gCanvas(gOutline(fromRows(['.ttt.', 'tTtTt', 'ttTtt', 'tTtTt', '.ttt.'])), { t: '#e85a7a', T: '#ffd0dc', k: '#0b0a0e' }); // v2.05 속박(실)
  const MOON_S_ICON = gCanvas(gOutline(fromRows(['.ss..', 's....', 's....', 's....', '.ss..'])), { s: '#e8eef8', k: '#0b0a0e' }); // v2.05 은빛 달 표식
  const MOON_D_ICON = gCanvas(gOutline(fromRows(['..dd.', '....d', '....d', '....d', '..dd.'])), { d: '#9a7ae8', k: '#0b0a0e' }); // v2.05 흑빛 달 표식
  const TS_ICON = gCanvas(gOutline(fromRows(['yyyyy', '.w.w.', '..s..', '.wsw.', 'yyyyy'])), { y: '#ffd34d', w: '#d8f0ff', s: '#ffd080', k: '#0b0a0e' }); // v2.08 시간 정지(모래시계)
  const BURN_ICON = gCanvas(gOutline(fromRows(['..r..', '.rYr.', 'rYyYr', 'rYyYr', '.rrr.'])), { r: '#ff6a2a', Y: '#ffb040', y: '#fff0b0', k: '#0b0a0e' }); // v2.10 화상
  const MOCHI_ICON = gCanvas(gOutline(fromRows(['.mmm.', 'mmmmM', 'mimmM', 'mmmMM', '.MMM.'])), { m: '#f8f0f4', M: '#d8c8d0', i: '#f0a0b8', k: '#0b0a0e' }); // v2.13 떡에 붙음
  const STUN_ICON = gCanvas(gOutline(fromRows(['..y..', '.yyy.', 'yyYyy', '.yyy.', '.y.y.'])), { y: '#ffd34d', Y: '#fff2b0', k: '#0b0a0e' }); // v2.03 기절
  const SKULL_ICON = gCanvas(gOutline(fromRows(['.www.', 'wwwww', 'wrwrw', 'wwwww', '.wkw.'])), { w: '#e8e0cc', r: '#ff3030', k: '#0b0a0e' });
  function iceFeet(e) { // v2.03 둔화: 발목에 얼음 칸 (2px 칸 · 어두운 외곽)
    const x = Math.round(e.x) & ~1, y = Math.round(e.y) & ~1, w = Math.max(6, Math.round(e.r * 0.8)) & ~1;
    for (const [dx, h] of [[-w, 4], [-w + 4, 2], [w - 4, 4], [w, 2]]) { ctx.fillStyle = '#1a3a5a'; ctx.fillRect(x + dx - 1, y - h - 1, 4, h + 2); ctx.fillStyle = h > 2 ? '#cfefff' : '#7ac0e8'; ctx.fillRect(x + dx, y - h, 2, h); }
  }
  const CARROT_GH = ['g.oo.', '.gooO'], CARROT_GV = ['g.', '.o', 'oo', 'oO', '.O']; // v2.15 회전은 칸 단위 두 장
  const BALL_GLYPH = ['.kk.', 'kbbk', 'kbBk', '.kk.'], DUCK_GLYPH = ['.yy..', 'yyky.', 'yyyyo', '.yyy.'], COFFIN_GLYPH = ['.cccc.', 'ccwwcc', 'cwwwwc', 'ccwwcc', '.cccc.'];
  const CAT_GLYPH = ['k...k', 'kckck', 'kcwck', 'kcccc', '.kkk.'], BONE_GLYPH = ['w...w', 'wwwww', 'w...w'], WISP_GLYPH = ['.www.', 'wkwkw', 'wwgww', '.w.w.'];
  function drawWproj() {
    // v2.08 먼지 구름 · 수프 웅덩이: 디더 칸 (2px)
    if (G.dustC) for (const c of G.dustC) { const a = Math.min(1, c.t / 0.6); for (let dy = -6; dy <= 6; dy += 2) for (let dx = -14; dx <= 14; dx += 2) { if ((dx * dx) / 196 + (dy * dy) / 36 > 1 || ((dx + dy) / 2 + Math.floor(time * 4)) % 2 || a < 0.5 && (dx + dy) % 4) continue; ctx.fillStyle = (dx + dy) % 6 ? '#8a8478' : '#b8b0a0'; ctx.fillRect(snap2(c.x + dx), snap2(c.y + dy - 4), 2, 2); } }
    if (!G.wproj) return;
    for (const w of G.wproj) {
      if (w.k === 'sickle') { const r = rotW(weaponTex('ranger'), w.spin || 0, 1); ctx.drawImage(r.c, snap2(w.x) - r.o + 1, snap2(w.y) - r.o + 1); continue; }
      if (w.k === 'puffx' || /^(krs|ars|grs|mrs|prs)/.test(w.k)) continue; // v3.21 기사 투척 무기는 41_krs.js에서 그림
      if (w.k === 'ball' || w.k === 'duckb' || w.k === 'coffin' || w.k === 'carrotm') { const g = w.k === 'ball' ? BALL_GLYPH : w.k === 'duckb' ? DUCK_GLYPH : w.k === 'carrotm' ? (Math.floor(w.spin || 0) % 2 ? CARROT_GH : CARROT_GV) : COFFIN_GLYPH, pal = w.k === 'carrotm' ? { g: '#5ab040', o: '#f08a2a', O: '#b8561a' } : w.k === 'ball' ? { k: '#2a1a10', b: '#6a5a4a', B: '#a89878' } : w.k === 'duckb' ? { y: '#ffe070', k: '#0b0a0e', o: '#f08a2a' } : { c: '#5a3a22', w: '#c8c0a8' }, x0 = snap2(w.x) - g[0].length, y0 = snap2(w.y) - g.length - (w.k === 'coffin' ? 4 : 0);
        g.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x0 + x * 2 - 1, y0 + y * 2 - 1, 4, 4); })); g.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; ctx.fillStyle = pal[ch] || '#fff'; ctx.fillRect(x0 + x * 2, y0 + y * 2, 2, 2); })); continue; }
      const g = w.k === 'cat' ? CAT_GLYPH : w.k === 'wisp' ? WISP_GLYPH : BONE_GLYPH, pal = w.k === 'cat' ? { k: '#16233a', c: '#7af0ff', w: '#ffffff' } : w.k === 'wisp' ? { w: '#e8e0cc', k: '#0b0a0e', g: '#7aff7a' } : { w: '#ece2c8' }, x0 = snap2(w.x) - g[0].length, y0 = snap2(w.y) - g.length;
      g.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; ctx.fillStyle = w.k === 'bone' ? '#3a3020' : '#0b0a0e'; ctx.fillRect(x0 + x * 2 - 1, y0 + y * 2 - 1, 4, 4); }));
      g.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '.') return; ctx.fillStyle = pal[ch] || '#ffffff'; ctx.fillRect(x0 + x * 2, y0 + y * 2, 2, 2); }));
    }
  }
  function threadBind(e) { // v2.05 속박: 몸을 가로지르는 붉은 실 두 줄 (2px 칸)
    const x = Math.round(e.x) & ~1, h = Math.round(Math.min(40, enemyH(e) * 0.6)) & ~1, w = Math.max(8, Math.round(e.r)) & ~1;
    for (const yy of [h * 0.35, h * 0.65]) { const y = (Math.round(e.y - yy) & ~1); ctx.fillStyle = '#5a1020'; ctx.fillRect(x - w - 1, y - 1, w * 2 + 2, 4); ctx.fillStyle = '#e85a7a'; ctx.fillRect(x - w, y, w * 2, 2); }
  }
  function drawGearTop() {
    const s = G.stats; if (!s) return; const ex = s.efx.has('exec');
    for (const e of G.enemies) { if (e.dead || e.type === 'flag' || e.rise > 0) continue;
      const top = Math.round(e.y - enemyH(e) - 14) & ~1; let x = Math.round(e.x) & ~1;
      const icons = []; if (e.bleedT > 0) icons.push(BLOOD_ICON); if (e.burnT > 0) icons.push(BURN_ICON); if (e.st && e.st.tsT > 0) icons.push(TS_ICON); else if (e.st && e.st.stunT > 0) icons.push(STUN_ICON); if (e.st && e.st.bindT > 0) { icons.push(BIND_ICON); threadBind(e); } if (e.st && e.st.moonS) icons.push(MOON_S_ICON); if (e.st && e.st.moonD) icons.push(MOON_D_ICON); if (e.st && e.st.slowT > 0) { if (time < (e.st.mochiU || 0)) icons.push(MOCHI_ICON); else { icons.push(ICE_ICON); iceFeet(e); } } if (ex && e.hp < e.maxHp * 0.3 && e.type !== 'boss') icons.push(SKULL_ICON);
      if (!icons.length) continue; x -= (icons.length * 16 - 2) / 2;
      icons.forEach((ic, i) => { const bob = Math.round(Math.sin(time * 6 + i) * 1) * 2; ctx.globalAlpha = ic === SKULL_ICON ? 0.75 + 0.25 * Math.sin(time * 10) : 1; ctx.drawImage(ic, (x + i * 16) & ~1, top + bob); });
      ctx.globalAlpha = 1;
    }
  }
  function gearLights(lights) {
    const P = G.player, s = G.stats;
    if (G.pfire) for (const f of G.pfire) lights.push({ x: f.x, y: f.y - 8, r: 70, a: 0.7 * Math.min(1, f.t / 0.6), c: '255,130,40', ca: 0.2 * Math.min(1, f.t / 0.6) });
    if (P && P.echoT > 0) lights.push({ x: P.x, y: P.y, r: 46, a: 0.4, c: '140,230,255', ca: 0.1 });
    if (P && s && s.set4.has('orc') && P.hp < s.hp * 0.5) lights.push({ x: P.x, y: P.y, r: 50, a: 0.4, c: '255,60,30', ca: 0.12 });
    for (const f of G.fx) {
      if (!f.kind || f.kind.slice(0, 3) !== 'gx_') continue; const p = 1 - f.t / f.max, a = 1 - p;
      const L = { gx_corpse: [90, '255,90,50'], gx_ignite: [70, '255,140,40'], gx_wave: [60, f.c], gx_nova: [120, '255,220,120'], gx_acid: [100, '150,240,70'], gx_gsword: [110, '150,180,255'], gx_coins: [50, '255,210,90'], gx_crit: [50, '255,220,120'], gx_exec: [40, '255,60,60'], gx_thorns: [60, '220,210,170'] }[f.kind];
      if (L) { let x = f.x, y = f.y; if (f.kind === 'gx_wave') { const d = 18 + 175 * easeOut(p); x += Math.cos(f.ang) * d; y += Math.sin(f.ang) * 0.8 * d; } lights.push({ x, y, r: L[0], a: 0.7 * a, c: L[1], ca: 0.22 * a }); }
      if (f.kind === 'gx_bolt' && gxEl(f) >= f.d0) { lights.push({ x: f.x1, y: f.y1, r: 70, a: 0.8 * a, c: '140,190,255', ca: 0.3 * a }); lights.push({ x: (f.x0 + f.x1) / 2, y: (f.y0 + f.y1) / 2, r: 60, a: 0.5 * a, c: '140,190,255', ca: 0.15 * a }); }
    }
  }
;
