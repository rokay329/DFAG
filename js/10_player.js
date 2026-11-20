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
  const swingTable = () => (G && G.cls === 'ranger') ? (wSkill() === 'claw' ? SWING_RC : SWING_R) : (G && G.cls === 'priest') ? (wSkill() === 'whip' ? SWING_PW : SWING_P) : (G && G.cls === 'knight' ? ({ chain: SWING_CH, windmill: SWING_WM, cleaver: SWING_CL })[wSkill()] || SWING : SWING);
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
    let wantAtk = take('j'), wantSkill = take('k'), wantAwk = take('l') || take('e'); const wantDodge = take(' ');
    if (G.meteorAim) { // v1.68 운석 조준: 클릭한 곳에 떨어뜨림, 우클릭·E로 취소
      if (G.cls !== 'mage' || P.gauge < 100 || P.dead) G.meteorAim = false;
      else if (wantAtk && P.state !== 'dodge') { G.meteorAim = false; startMeteor(); wantAtk = false; }
      else if (wantSkill || wantAwk) { G.meteorAim = false; sfx('blip', 0.7); wantSkill = false; wantAwk = false; }
    }
    const holdAny = !!(keys['j'] || mouse.down), holdAtk = RANGED() && holdAny && !G.meteorAim, holdMelee = !RANGED() && holdAny; // 근접도 누르고 있으면 콤보가 이어진다 (v0.64)
    const free = P.state === 'idle' || P.state === 'attack' || P.state === 'rattack';

    if (wantDodge && engTryReturn()) { /* v2.41 되돌아가기 */ }
    else if (wantDodge && P.stam > 0 && (free || P.state === 'butt' || P.state === 'pray' || (P.state === 'skill' && P.t > SKILL.wind + SKILL.swing))) {
      P.stam--; rec('blink'); P.stiletT = time + 1; if (G.cls === 'mage') P.surgeT = SURGE_T; P.state = 'dodge'; P.t = 0; P.dodgeT = 0; P.iframe = 0.22; P.perfectUsed = false; P.combo = 0; P.queued = false; P.blinkEnd = false;
      if (G.tut && G.tut.step === 4) { G.tut.dashN++; if (G.tut.dashN < 3) P.stam = Math.max(P.stam, 1); }
      const da = ml ? Math.atan2(my, mx) : P.ang;
      P.dvx = Math.cos(da); P.dvy = Math.sin(da);
      if (Math.abs(P.dvx) > 0.2) P.face = P.dvx > 0 ? 1 : -1;
      P.blinkFrom = { x: P.x, y: P.y }; engOnBlinkStart(P.x, P.y, da); // v2.41
      if (s.efx.has('blinkFire')) { (G.pfire = G.pfire || []).push({ x: P.x, y: P.y, t: 4, tick: 0 }); gxIgnite(P.x, P.y); }
      G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0, t: 0.35, max: 0.35, tint: true });
      blinkBurst(P.x, P.y - 10);
      sfx('dodge');
    }
    if (wantAwk && P.gauge >= 100 && free) {
      if (G.tut && G.tut.step === 3) G.tut.awkN++;
      if (G.cls === 'ranger') startStorm(); else if (G.cls === 'mage') { if (wSkill() === 'hourglass') timeStop(); else if (!document.body.classList.contains('touch')) { G.meteorAim = true; sfx('aim'); } else startMeteor(); } else if (G.cls === 'priest') startMiracle(); else if (G.cls === 'gunner') HABIULT.start(); /* v3.15 등 맡기기 (마력응축탄 대체) */ else startAwaken();
    }
    if (wantSkill && free) {
      const slot = P.chargeCd.findIndex((c, i) => i < charges && c <= 0);
      if (slot >= 0) {
        if (G.tut && G.tut.step === 2) G.tut.skN++;
        P.chargeCd[slot] = Math.max(1, CL().skillCd * (1 - s.cdr) * (1 - pasV('kcd')) - (uncK() === 'priest13' ? 1 : 0)); if (s.efx.has('echo')) { P.echoT = 3; gxFocus(); }
        if (G.cls === 'ranger') { if (wSkill() === 'kusari') kusariHook(); else startShadow(); }
        else if (G.cls === 'mage') castFireball();
        else if (G.cls === 'priest') { if (wSkill() === 'whip') P.chargeCd[slot] = 0; else castHeal(); } // v2.18 채찍은 떼는 순간 치유
        else if (G.cls === 'gunner') fireShotgun();
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
      { const dr = (hasRelic('drum') && P.awakenT > 0 ? 1.2 : 1) * (time < (P.hueRushUntil || 0) ? 1.4 : 1) * (hasRelic('staff') && time < (P.staffUntil || 0) ? 1.3 : 1); P.x += mx * s.spd * sp * dr * dt; P.y += my * s.spd * sp * dr * dt; } // v2.19 전쟁 북 가죽
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
      if (P.t < BLINK) {
        { const bm = 80 * (1 + pasV('blink') + (hasRelic('cloak') ? 0.2 : 0) + (uncK() === 'knight13' ? 0.1 : 0)) / BLINK; P.x += P.dvx * bm * dt; P.y += P.dvy * bm * dt; } // v2.29 잿빛 깃털 망토
        if (Math.random() < 0.7) G.parts.push({ x: P.x + rand(-4, 4), y: P.y - rand(2, 20), vx: -P.dvx * 40, vy: -P.dvy * 40, t: 0.3, c: pick(['#9fd2ff', '#e4f2ff']), g: 0, glow: true });
      } else if (!P.blinkEnd) {
        P.blinkEnd = true;
        P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r);
        blinkBurst(P.x, P.y - 10);
        if (pasO('wallWave') && (P.x - A.x0 < 30 || A.x1 - P.x < 30 || P.y - A.y0 < 30 || A.y1 - P.y < 30)) { G.fx.push({ kind: 'ring', x: P.x, y: P.y - 6, r: 6, grow: 140, t: 0.2, max: 0.2, c: '#d8c9a8' }); addShake(2, 0); for (const e of nearFoes(P.x, P.y, 52)) damageEnemy(e, 0.2, { proc: true, ang: angTo(P, e), kb: 120, gauge: 1 }); } // v2.22 보관 패시브: 성문 방패
        G.fx.push({ kind: 'streak', x0: P.blinkFrom.x, y0: P.blinkFrom.y - 10, x1: P.x, y1: P.y - 10, t: 0.18, max: 0.18 });
        engOnBlinkEnd(P.blinkFrom.x, P.blinkFrom.y); // v2.41
        if (wSkill() === 'broom') { G.dustC = G.dustC || []; for (let i = 0; i <= 4; i++) G.dustC.push({ x: P.blinkFrom.x + (P.x - P.blinkFrom.x) * i / 4, y: P.blinkFrom.y + (P.y - P.blinkFrom.y) * i / 4, t: 2.5 }); } // v2.08 마녀 빗자루
      }
      P.blade = lerpAng(P.blade, (P.face > 0 ? 150 : 30) * DEG, dt * 20);
      if (P.t >= BLINK + 0.09) P.state = 'idle';
    } else if (P.state === 'charge') {
      P.t -= dt;
      P.x += Math.cos(P.atkAng) * 340 * dt; P.y += Math.sin(P.atkAng) * 340 * dt;
      P.blade = lerpAng(P.blade, P.atkAng + Math.PI * 0.85 * P.face, dt * 16);
      if (Math.random() < 0.7) dust(P.x, P.y, 1);
      G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0.25 * P.face, t: 0.16, max: 0.16, tint: true });
      for (const e of G.enemies) if (!e.dead && !P.chargeHit.has(e) && dist(e, P) < e.r + P.r + 12) {
        P.chargeHit.add(e);
        damageEnemy(e, 1.2, { grogi: 10, kb: wSkill() === 'gate' ? 520 : 120, ang: P.atkAng, heavy: true, stagger: 0.6, gauge: 5 });
      }
      if (wSkill() === 'sun') P.sunPath.push({ x: P.x, y: P.y }); // v2.03 빛의 길
      if (P.t <= 0) { weaponChargeEnd(); startSkillSlash(); }
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
    solveObs(P, P.r, P.state === 'dodge' && P.t < BLINK);
    P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r);
    if (['charge', 'skill', 'awaken', 'storm', 'shadow', 'butt'].includes(P.state)) hitCrack(P.x, P.y, 2, 60);
    if (G.bonfire && dist(P, G.bonfire) < 30) healPct(0.2 * dt * (ascOn(9) ? 0.5 : 1));
  }
  const BLINK = 0.11;
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
      sweepHits(P.atkAng, P.sign, P.prevRel, P.swingRel, S.reach, P.hitSet, { coef: 1.6, grogi: 15, kb: 220, heavy: true, stagger: 0.6, gauge: 6 });
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
      if (d < 210 && Math.abs(angDiff(angTo(P, e), P.ang)) < 0.95 && d < bd) { bd = d; best = e; }
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
  // v0.72 직업 밸런스: 원거리는 안전한 대신 화력을 낮추고, 근접은 직업 패시브로 버티게 (v2.23 기사 흘려내기 · 어세신 베어내기 · 사제 신의 가호)
  const GUN_RELOAD = 1.2, GUN_MAG = 5, GUN_RANGE = 400;        // 거너: 5발 발사 후 총을 두 바퀴 돌려 장전
  const MAGE_MANA_MAX = 100, MAGE_BOLT_COST = 20, MAGE_MANA_REGEN = 32;
  const MELEE_DR = 0.9;                                        // v2.23~24 직업 패시브: 피격 10% 흘려냄 · 처치 회복 없음
  const RANGED_HB = 5; // v2.25 원거리(거너 탄·마법사 탄)만 적 판정 +5px
  const SURGE_T = 3; // v2.24 마법사 마나 격류: 점멸 뒤 3초
  const meleeKeep = () => { const P = G.player, c = G.cls; if (P.counterT > 0) return 0.7; // v2.33 반격 시간: 직업 회피 판정 30%
    if (c === 'mage') return P.surgeT > 0 ? MELEE_DR : 1; if (c === 'ranger') return P.state === 'attack' ? MELEE_DR : 1; return MELEE_DR; }; // 기사 흘려내기 · 사제 신의 가호 · 거너 교활(상시) · 어세신 베어내기(평타 중) · 마법사 마나 격류(점멸 뒤)
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
    if (P.state === 'rattack' && cls === 'mage') return strikePose(P.t, 0.05, 0.06, 0.16, P.atkAng == null ? P.ang : P.atkAng, P.face, 0.8);
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
  function rangedWave() { const P = G.player; if (G.stats.efx.has('wave3') && ((P.shotN = (P.shotN || 0) + 1) % 3 === 0)) fireWave(P.ang); }
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
  const SWING_PW = SWING_P.map((o, i) => Object.assign({}, o, { reach: 62, kb: 40, swing: o.swing + 0.03 }, [{ a0: -125, a1: 15 }, { a0: 115, a1: -15 }, { a0: -180, a1: 200, swing: 0.34, slam: false, kb: 120 }][i])); // v2.18 고해의 채찍: 길게 감아 때림 · v2.19 3타는 한 바퀴 돌며 주변을 감싼다
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
    { let cap = wSkill() === 'reliq' ? 2 : 1; if (cap === 1 && pasO('reliq') && (P.holyArmor || 0) >= 1 && (P.armor || 0) < ARMOR_MAX && pasOnce('reliq')) cap = 2; if ((P.holyArmor || 0) < cap && (P.armor || 0) < ARMOR_MAX) addArmor(1, true); } // v2.15 치유의 빛: 하트 회복 대신 빛의 방패 (이 기술로는 1칸, 성유물함 2칸까지)
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
      drawShadow(P.x, P.y + 1, 8);
      drawBlade(tex, P.x + 10, P.y - 2, 0.2, 0.9);
      drawSprite(C.map, C.pal, 2, P.x, P.y + 4, P.face < 0, { rot: Math.PI / 2 * P.face, alpha: 0.85 });
      return;
    }
    if (P.state === 'dodge' && P.t < BLINK) return;
    const blink = P.inv > 0 && Math.floor(time * 16) % 2 === 0;
    drawShadow(P.x, P.y + 1, 8);
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
    let rot = 0, alpha = blink ? 0.45 : 1, sx = 1, sy = 1;
    if (P.state === 'dodge') { alpha = 0.5 + 0.5 * clamp((P.t - BLINK) / 0.09, 0, 1); sx = 0.9; sy = 1.1; }
    if (PPOSE) ({ rot, sx, sy } = PPOSE); // v2.43 공격 모션
    if (P.state === 'pray') sy = 1.05;
    const h = heroHand(), hy = h.y + bob;
    const behind = cls === 'priest' ? (P.state === 'idle' || P.state === 'dodge') : cls === 'gunner' ? (Math.sin(P.blade) < 0.55 && P.state !== 'butt') /* v2.42 정면 도트: 총은 몸 뒤 옆으로 (아래로 겨눌 때만 앞) */ : (Math.sin(P.blade) < -0.45 && P.state !== 'cast' && P.state !== 'butt');
    if (cls === 'priest' && P.state === 'attack' && !['water', 'whip'].includes(wSkill())) {
      drawSlashPx(P.trail, h.x, hy, tex.reach, SLASH_COL.priest, P.combo === 2); // v2.50 도트 궤적
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
    drawSprite(ifr ? ifr.key : heroMap(walkMap(C.map, wFr), P), C.pal, 2, P.x, P.y + 2, P.face < 0, { rot, alpha, white: P.hurtT > 0.12, sx, sy });
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
      for (const e of G.enemies) {
        if (e.dead || P.hitSet.has(e)) continue;
        const ey = e.y - (e.tall ? e.tall * 0.3 : e.type === 'boss' ? 18 : isElite(e) ? 12 : 6);
        const d = Math.hypot(e.x - px, ey - py);
        if (d > st.reach * (P.combo === 2 ? 1 + pasV('reach3') : 1) + e.r) continue;
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
    if (l.type === 'relic' || l.type === 'hue') return true;
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
  function whipExt(st) { const P = G.player; if (P.state !== 'attack') return 0; const t = P.t; // 0: 감김 → 1: 끝까지 뻗음
    if (t < st.wind) return 0.2 * t / st.wind;
    if (t < st.wind + st.swing * 0.6) return 0.2 + 0.8 * (t - st.wind) / (st.swing * 0.6);
    if (t < st.wind + st.swing + 0.05) return 1;
    return Math.max(0, 1 - (t - st.wind - st.swing - 0.05) / (st.rec * 0.7)); }
  function whipStiff(st) { const P = G.player; if (P.state !== 'attack') return 0.32; const t = P.t, pr = (t - st.wind) / st.swing; // 휘두르는 동안 늘어지듯 따라오다 끝에서 쫙
    if (t < st.wind) return 0.06; if (pr < 1) return 0.04 + 0.5 * pr * pr * pr; return Math.max(0.2, 0.54 - (t - st.wind - st.swing) * 3); } // v2.19 덜 뻣뻣하게 — 끝까지 적당히 휜 채로
  function drawWhip(hx, hy) { // v2.19 고해의 채찍: 손잡이는 고정, 가죽 줄만 늘어나며 휘어 때린다
    const P = G.player, a = P.blade, st = SWING_PW[P.combo] || SWING_PW[0], ux = Math.cos(a), uy = Math.sin(a), ex = hx + ux * 12, ey = hy + uy * 12;
    const n = 12, len = 14 + (st.reach - 26) * whipExt(st), L = whipSim(ex, ey, a, n, len / n, whipStiff(st), P.state === 'attack' ? 0 : 90);
    whipWrap(L, ex, ey, a, n, len);
    const thick = L.slice(0, 5).map((p, i) => { const q = L[Math.min(n, i + 1)], b = L[Math.max(0, i - 1)], nx = -(q.y - b.y), ny = q.x - b.x, d = Math.hypot(nx, ny) || 1; return { x: p.x + nx / d * 2, y: p.y + ny / d * 2 }; }); // 손잡이 쪽은 두껍게
    const lc = (i, t) => i >= n - 1 ? (i === n - 1 && t > 0.5 ? '#d8d0c0' : '#7a3a24') : (i % 2 ? '#7a3a24' : '#a0503a'); // 끝은 가는 끈 + 흰 매듭
    drawCellPaths([[[{ x: hx - ux * 2, y: hy - uy * 2 }, { x: ex, y: ey }], (i, t) => t < 0.2 ? '#8a8a94' : t > 0.8 ? '#c0c0c8' : '#3a1a14'], [thick, () => '#5a2a20'], [L, lc]]);
    P.lashTip = L[n];
  }
  // v2.19 채찍 3타: 손잡이를 중심으로 한 바퀴 돌 때 가죽 줄이 몸 둘레를 따라 둥글게 감긴다 (줄이 손잡이 뒤로 휘어 따라옴)
  function whipWrap(L, hx, hy, a, n, len) {
    const P = G.player, st = SWING_PW[2]; if (P.state !== 'attack' || P.combo !== 2) return;
    const t = P.t - st.wind; if (t < -0.02 || t > st.swing + 0.06) return;
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
      if (w.k === 'puffx') continue;
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
