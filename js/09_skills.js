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
    { const u = uncK(), P = G.player; if (u === 'knight12') { G.gold += 1; G.nums.push({ x: e.x, y: e.y - 20, v: '+1G', t: 0.6, c: '#ffd34d', s: 1 }); } if (u === 'ranger11' && Math.random() < 0.1) P.gauge = Math.min(100, (P.gauge || 0) + 5); } // v2.30 언커먼
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
  function pasDeflect(dt) { // 정면 투사체 되받아침 (사제 프라이팬: 언제나 · 어세신 철부채: 공격 중)
    const P = G.player; if (!P || P.dead) return;
    const f = pasO('deflect') ? 'deflect' : pasO('deflectAtk') && (P.state === 'attack' || P.state === 'skill') ? 'deflectAtk' : null; if (!f) return;
    for (const pr of G.eproj) { if (pr.friend || pr.pasChk) continue; const d = Math.hypot(pr.x - P.x, pr.y - (P.y - 8)); if (d > 30) continue; pr.pasChk = true;
      if (Math.random() < pasO(f).p) { const a = Math.atan2(pr.y - P.y, pr.x - P.x); pr.friend = true; pr.ang = a; pr.sp = Math.max(pr.sp || 200, 240); pr.t = 2; pr.home = 0; pr.hist = []; sfx('block', 0.8); G.nums.push({ x: pr.x, y: pr.y - 18, v: '팅!', t: 0.5, c: '#ffd34d', s: 1 }); } }
  }
  function weaponOnHit(e, o, crit) {
    const sk = wSkill(); if (!sk || e.dead) return; const P = G.player, c2 = P.state === 'attack' && P.combo === 2;
    // ---- 어세신
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
    P.gauge = Math.min(100, P.gauge + 15 * G.stats.gaugeRate);
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
      G.nums.push({ x: e.x, y: e.y - 60, v: '0', t: 0.5, c: '#9cc1ea', s: 1 });
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
    P.gauge = Math.min(100, P.gauge + (o.gauge == null ? 4 : o.gauge) * s.gaugeRate);
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
  function engReset() { G.eng = { r: [], b: [], g: [] }; G.engC = new Set(); G.engQ = []; G.ais = []; G.engZ = []; G.engS = []; G.lant = []; G.emberUsed = false; if (G.player) { G.player.hope = 0; G.player.emberT = 0; } }
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
    if (!G.eng || !G.eng[c].length) return `<span style='color:#6a6474'>${HUE_TIER.map(n => n + '개').join(' · ')}에 닿을 때마다 각인을 하나 고릅니다.</span>`;
    return G.eng[c].map(k => `<span style='color:${HUES[c].c}'><img src='${engIcon(k, G.engC.has(k))}' style='width:18px;height:18px;image-rendering:pixelated;vertical-align:-4px'> ${ENG[k].n}${G.engC.has(k) ? ' (완성)' : ''}</span>`).join('<br>');
  }
  // ================================================================ v2.34 색 되찾기 (문서: 색되찾기_설계) — 1단계: 잿빛 방 · 색 조각 · 색 물결 · 단계 효과 1~3
  const HUES = { r: { n: '분노의 빛', c: '#ff5a4a', rgb: '255,90,74' }, b: { n: '평온의 빛', c: '#5aa8ff', rgb: '90,168,255' }, g: { n: '희망의 빛', c: '#6ad84a', rgb: '106,216,74' } };
  const HUE_TIER = [10, 25, 45], HUE_GRAY = 0.6; // 단계 기준 · 잿빛 방은 채도 40%만 남김
  const BOSS_HUE = { 1: 'b', 2: 'r', 3: 'g', 4: 'r' };
  const hueTier = c => { const n = (G && G.pal && G.pal[c]) || 0; return n >= HUE_TIER[2] ? 3 : n >= HUE_TIER[1] ? 2 : n >= HUE_TIER[0] ? 1 : 0; };
  const grayRoom = R => !!(R && R.hue && !R.painted && ['combat', 'elite', 'survive'].includes(R.type) /* v2.46 보스방은 처음부터 색이 켜져 있음 */ && (!R.cleared || (G.paintW && G.paintW.R === R)));
  for (const c in HUES) { const H = { r: ['#ff4a4a', '#a01828', '#ffd0c8'], b: ['#5aa8ff', '#1e4a9a', '#d8ecff'], g: ['#6ad84a', '#2e7a1a', '#e0ffc8'] }[c];
    MAPS['hue_' + c] = ['....k....', '...kWk...', '..kWHHk..', '.kWHHHMk.', 'kWHHHHMMk', '.kHHHMMk.', '..kHMMk..', '...kMk...', '....k....']; PAL['hue_' + c] = { k: '#0b0a0e', W: H[2], H: H[0], M: H[1] }; }
  const hueGold = () => 1, hueChest = () => 0; // v2.41 빛의 각인으로 대체
  function hueDrop(e) { // 몬스터 처치 시 확률로 색 조각
    const R = G.dun && G.dun.cur; if (!R || !R.hue || R.type === 'boss' || isDummy(e)) return; // v2.46 보스방에선 빛 조각이 떨어지지 않음
    const n = e.type === 'boss' ? 0 : isElite(e) ? 1 : isSemi(e) ? (Math.random() < 0.4 * engRichMul(e) ? 1 : 0) : Math.random() < 0.07 * engRichMul(e) ? 1 : 0; // v2.38 다시 절반 (일반 7% · 준엘리트 40% · 정예 1)
    for (let i = 0; i < n * (G.player.counterT > 0 ? 2 : 1); i++) { const c = Math.random() < 0.7 ? R.hue : pick(['r', 'b', 'g']), l0 = G.loot.length; spawnLoot('hue', e.x, e.y); if (G.loot[l0]) G.loot[l0].hue = c; }
  }
  function hueGain(c, n) {
    const t0 = hueTier(c); G.pal[c] = (G.pal[c] || 0) + n; const t1 = hueTier(c); { const w = eqWeapon(G.cls); if (w && w.grade === 'rby' && t1 === t0) G.stats = calcStats(G.buffs); } // v2.40 RGB?
    if (t1 > t0) { const P = G.player, hp0 = G.stats.hp; G.stats = calcStats(G.buffs); P.hp = clamp(P.hp + Math.max(0, G.stats.hp - hp0), 0, G.stats.hp);
      G.nums.push({ x: P.x, y: P.y - 40, v: `${HUES[c].n} ${t1}단계`, t: 1.2, c: HUES[c].c, s: 2 }); for (let k = t0 + 1; k <= t1; k++) engQueue(c, k); } // v2.41 고정 단계 효과 대신 각인 고르기
    if (hueTier('r') >= 2 && hueTier('b') >= 2 && hueTier('g') >= 2) recOnce('u_prism'); if (hueTier('r') >= 3) recOnce('u_wick'); if (hueTier('g') >= 3) recOnce('u_lant'); // v2.36
    renderPal();
  }
  const HUE_D = { r: ['공격력이 5% 증가합니다.', '치명타 확률이 5%p 증가합니다.', '적을 처치하면 그 자리에 작은 불꽃 폭발이 일어납니다.'], b: ['이동 속도가 5% 증가합니다.', '점멸 충전 속도가 15% 증가합니다.', '점멸한 직후 0.8초 동안 이동 속도가 40% 증가합니다.'], g: ['얻는 골드가 15% 증가합니다.', '상자에서 유물이 나올 확률이 5%p 증가합니다.', '적을 처치하면 2% 확률로 하트 반 칸을 회복합니다.'] };
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
      return `<div class="palRow${up.includes(c) ? ' up' : ''}" style="--hc:${H.c};--hl:${S[0]};--hd:${S[1]};--c:${H.c}" data-name="${H.n} · ${n}개" data-tip="${engTip(c)}"><img class="gem" src="${hueURL(c)}" alt=""><span class="pn">${H.n.replace('의 빛', '')}</span><span class="pv">${n}</span></div>`; }).join('');
  }

  function startPaint(R, x, y) { // 방을 비우면 색 물결
    if (!R || !R.hue || R.painted) return; G.paintW = { R, x, y, t: 0 };
    for (let i = 0, m = 1 + (hasRelic('brush') ? 1 : 0); i < m; i++) { const l0 = G.loot.length; spawnLoot('hue', x, y); if (G.loot[l0]) G.loot[l0].hue = R.hue; }
    sfx('heal', 0.8); sfx('grogi', 1.6); addShake(2, 0);
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
    G.kills++;
    gearOnKill(e);
    if (!isDummy(e) && isElite(e)) { rec('elite'); if (hasRelic('horn')) { G.hornT = time + 3; G.nums.push({ x: G.player.x, y: G.player.y - 34, v: '사냥꾼의 나팔', t: 0.7, c: '#f0e0b0', s: 1 }); } } // v2.29
    if (G.cls === 'knight' && G.player.counterT > 0 && !isDummy(e)) rec('k_counter');
    if (!isDummy(e)) rec('kill_' + G.cls); // v2.31 직업별 처치 (무기 해금)
    if (!silent || e.type === 'boss') hueDrop(e); // v2.34 색 조각
    if (!isDummy(e) && G.player.counterT > 0) { const P = G.player; P.cntKills = (P.cntKills || 0) + 1; if (P.cntKills >= 5) recOnce('u_duel'); if (hasRelic('duelband') && (P.cntExt || 0) < 1.2 - 1e-6) { const d = Math.min(0.3, 1.2 - (P.cntExt || 0)); P.cntExt = (P.cntExt || 0) + d; P.counterT += d; P.counterMax += d; } /* 역습 한 번에 최대 +1.2초 */ } // v2.36 결투자의 띠
    engOnKill(e); // v2.41 (색 3단계 고정 효과 제거)
    pasOnKill(e); // v2.22 보관 패시브
    if (hasRelic('pact') && G.player) G.player.gauge = Math.min(100, G.player.gauge + 10); // v2.19 피의 계약
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
