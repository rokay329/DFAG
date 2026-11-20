'use strict';
// ==================================================================================================
// 잿빛 왕관 원정대 — 28_den_relics.js : 영수 명수의 안전 놀이터 전용 물건 (v3.18)
//  · 뼈주사위 (유물): 적에게 피해를 주면 3% 확률로 머리 위에서 굴림 — 1 꽝 · 2 공격력 · 3 이동 속도 · 4 점멸 충전 · 5 스킬·각성 충전 · 6 모두 (8초)
//    굴러가는 동안 주사위 모양은 그대로, 가운데 눈만 바뀜. 머리 위 문구 없음 (상태 줄에만 표시). 굴러가거나 효과가 남아 있는 동안엔 다시 굴리지 않음
//  · 칼날카드 (보관 전용 무기): 무기 칸 하나를 차지하지만 장착되지 않음. 가지고 있으면 공격할 때 5% 확률(대기 1.5초)로 조준 방향에 발사
//    경로의 모든 적을 관통해 공격력의 200% 피해, 장애물이나 벽에 박혀 5초 뒤 사라짐(4초부터 깜빡임). 다른 방으로 가면 바로 사라짐
//  · 시안: _시안/뼈주사위_칼날카드_시안02.html
// ==================================================================================================
const BDC = (() => {
  // ---------------------------------------------------------------- 정의
  RELICS.bonedice = { n: '뼈주사위', d: '적에게 피해를 주면 3% 확률로 뼈주사위를 굴립니다. 2가 나오면 공격력, 3이 나오면 이동 속도, 4가 나오면 점멸 충전 속도, 5가 나오면 스킬과 각성 충전 속도가 8초 동안 증가합니다. 6이 나오면 네 가지 효과를 모두 얻고, 1이 나오면 아무 효과도 없습니다.', c: '#e2d4ac', den: true };
  const DIE9 = ['.kkkkkkk.', 'kkHHHHckk', 'kHpvWWpsk', 'kHWWWWwsk', 'kHWWpvwsk', 'kHvWWWwsk', 'kwpwwwpSk', 'kkssssSkk', '.kkkkkkk.'];
  const DIE_P = { k: '#0b0a0e', H: '#fbf4e0', W: '#efe2c0', w: '#dccaa0', v: '#cdb98e', s: '#b39c70', S: '#8e7852', p: '#24180e', q: '#7a6040', c: '#a68e66', R: '#b0302a', r: '#5e140e' };
  RELIC_ART.bonedice = { rows: DIE9, pal: DIE_P };
  MAPS.relic_bonedice = RELIC_ART.bonedice.rows; PAL.relic_bonedice = RELIC_ART.bonedice.pal;
  const CARD_D = '장착할 수 없는 무기입니다. 가지고 있는 동안 공격하면 5% 확률로 칼날카드를 발사합니다. 칼날카드는 경로에 있는 모든 적을 관통하여 공격력의 200% 피해를 주고, 장애물이나 벽에 박힙니다.';
  const DICE_P = 0.03, DICE_T = 8, CARD_P = 0.05, CARD_CD = 1.5, CARD_COEF = 2.0, CARD_SPD = 900, STUCK_T = 5;

  // ---------------------------------------------------------------- 칼날카드 도트 (작게, 무늬 없이 은빛 날 테두리 + 붉은 모서리 표시)
  const CARD = ['.kkkk.', 'kTSSsk', 'kSRrsk', 'kSGRsk', 'kSRGsk', 'kSrRsk', 'kssDsk', '.kkkk.']; // 날아가는 · 박힌 카드 (6×8)
  const CARD_BIG = ['.kkkkkkk.', 'kTTSSSSsk', 'kTgggggsk', 'kSgRrRgsk', 'kSgrRrgsk', 'kSgRGRgsk', 'kSgGYGgsk', 'kSgRGRgsk', 'kSgrRrgsk', 'kSgRrRgsk', 'kSgggggsk', 'kssssssDk', '.kkkkkkk.']; // 아이콘 (9×13)
  const CP = { k: '#0b0a0e', T: '#ffffff', S: '#d8e0ec', s: '#7a8294', D: '#4a5060', R: '#a8222c', r: '#6a1018', g: '#c8902a', G: '#ffd34d', Y: '#fff6c8' };
  const CARD_E = CARD[0].split('').map((_, i) => CARD.map(r => r[i]).reverse().join('')); // 긴 쪽을 가로로 (동쪽을 향함)
  const DIRS = []; // 8방향을 미리 돌려 둔 칸 목록 (실행 중엔 돌리지 않음)
  for (let k = 0; k < 8; k++) { const a = -k * Math.PI / 4, ca = Math.cos(a), sa = Math.sin(a), h = CARD_E.length, w = CARD_E[0].length, R = Math.ceil(Math.hypot(w, h) / 2) + 1, cells = [];
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const sx = Math.round(x * ca + y * sa + (w - 1) / 2), sy = Math.round(-x * sa + y * ca + (h - 1) / 2); if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue; const c = CP[CARD_E[sy][sx]]; if (c) cells.push([x, y, c]); }
    DIRS.push(cells); }
  const dirOf = ang => ((Math.round(-ang / (Math.PI / 4)) % 8) + 8) % 8;
  let ICON = null;
  function cardIconURL() { if (ICON) return ICON; const [c, g] = mkCanvas(32, 32); CARD_BIG.forEach((r, y) => [...r].forEach((ch, x) => { if (CP[ch]) { g.fillStyle = CP[ch]; g.fillRect(8 + x * 2, 2 + y * 2, 2, 2); } })); return (ICON = c.toDataURL()); }
  const hasCard = () => !!(G && SAVE.inv.some(i => i.hold === 'card' && i.cls === G.cls));
  function makeCard() { return { id: SAVE.nextId++, grade: 'unique', slot: 'weapon', cls: G.cls, name: '칼날카드', stat: 'atk', val: 0, opts: [], lv: 0, fail: 0, hold: 'card' }; }

  // ---------------------------------------------------------------- 뼈주사위
  const BONE = ['#f4ead0', '#e2d4ac', '#c6b488', '#a28e64', '#7e6a48'], GOLD = ['#fff6c8', '#ffd34d', '#e0a82e', '#b07818', '#7a4a10'];
  const PIPC_OLD = { 2: [[2, 2], [6, 6]], 3: [[2, 2], [4, 4], [6, 6]], 4: [[2, 2], [6, 2], [2, 6], [6, 6]], 5: [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]], 6: [[2, 1], [6, 1], [2, 4], [6, 4], [2, 7], [6, 7]] };
  const FX = { 2: 'atk', 3: 'spd', 4: 'stam', 5: 'cd' }, TAG = { atk: '공격력↑', spd: '이동 속도↑', stam: '점멸 충전↑', cd: '쿨타임↓' };
  const fxOn = () => { const D = G && G.diceFx; return !!D && Object.values(D).some(t => t > time); };
  function onHit(e, o) { // damageEnemy (연계 · 지속 피해 제외)에서 부름
    if (!hasRelic('bonedice') || G.dice || fxOn() || !G.player || G.player.dead) return;
    if (Math.random() >= DICE_P) return;
    G.dice = { n: 1 + Math.floor(Math.random() * 6), t: 0, seq: Array.from({ length: 12 }, (_, i) => 1 + ((i * 2 + 1 + Math.floor(Math.random() * 4)) % 6)), parts: [] };
    sfx('denDice');
  }
  function land() { const D = G.dice, P = G.player, n = D.n;
    if (n === 1) { for (let i = 0; i < 9; i++) D.parts.push({ x: (i % 3) * 4 + 2, y: Math.floor(i / 3) * 4 + 2, vx: (i % 3 - 1) * 30 + rand(-12, 12), vy: rand(-90, -60), c: BONE[1 + (i % 4)], t: 1.1 }); sfx('denLose'); return; }
    const until = time + DICE_T; G.diceFx = G.diceFx || {}; for (const k of n === 6 ? [2, 3, 4, 5] : [n]) G.diceFx[FX[k]] = until;
    G.stats = calcStats(G.buffs); hudPrev.status = null;
    if (n === 6) for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; D.parts.push({ x: 6, y: 6, vx: Math.cos(a) * 95, vy: Math.sin(a) * 95, c: i % 2 ? '#ffd34d' : '#fff6c8', t: 0.5, ray: true }); }
    sfx(n === 6 ? 'denWin' : 'select');
  }
  const PIP12 = { 2: [[2, 2], [8, 8]], 3: [[2, 2], [5, 5], [8, 8]], 4: [[2, 2], [8, 2], [2, 8], [8, 8]], 5: [[2, 2], [8, 2], [5, 5], [2, 8], [8, 8]], 6: [[2, 2], [8, 2], [2, 5], [8, 5], [2, 8], [8, 8]] };
  const GOLD_P = Object.assign({}, DIE_P, { H: '#fff6c8', W: '#ffd34d', w: '#e8b030', v: '#d8a028', s: '#b07818', S: '#7a4a10', c: '#c08a20' });
  const FACE = {};
  function face(n, gold, cracked) { // 12×12칸 그림을 한 번 만들어 둠
    const key = n + (gold ? 'g' : '') + (cracked ? 'c' : ''); if (FACE[key]) return FACE[key];
    const N = 12, g = Array.from({ length: N }, () => Array(N).fill('.'));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const ex = x === 0 || x === N - 1, ey = y === 0 || y === N - 1;
      if (ex && ey) continue; if (ex || ey || ((x === 1 || x === N - 2) && (y === 1 || y === N - 2))) { g[y][x] = 'k'; continue; } // 둥글게 닳은 모서리
      let t = 'W'; if (x === 1 || y === 1 || (x === 2 && y === 2)) t = 'H'; if (x >= N - 3 || y >= N - 3) t = 'w'; if (x === N - 2 || y === N - 2) t = 's'; if ((x === N - 2 && y >= N - 4) || (y === N - 2 && x >= N - 4)) t = 'S'; g[y][x] = t; }
    for (const [x, y] of [[4, 3], [9, 6], [3, 9], [7, 9]]) if ('Ww'.includes(g[y][x])) g[y][x] = 'v'; // 뼈의 잔구멍
    for (const [x, y] of [[9, 1], [9, 2], [8, 3], [8, 4]]) if ('WwHv'.includes(g[y][x])) g[y][x] = 'c'; // 실금
    if (n === 1) { for (let y = 4; y <= 7; y++) for (let x = 4; x <= 7; x++) if (!((x === 4 || x === 7) && (y === 4 || y === 7))) g[y][x] = (x === 4 || y === 4) ? 'r' : 'R'; g[7][6] = 'q'; g[6][7] = 'q'; }
    else for (const [x, y] of PIP12[n]) { g[y][x] = 'p'; g[y][x + 1] = 'p'; g[y + 1][x] = 'p'; g[y + 1][x + 1] = 'q'; } // 파인 눈: 안쪽 아래오른쪽이 빛을 받음
    if (cracked) for (const [x, y] of [[7, 1], [7, 2], [6, 3], [6, 4], [7, 5], [8, 6], [8, 7], [3, 8], [4, 9], [2, 9], [5, 8]]) g[y][x] = 'k';
    const P = gold ? GOLD_P : DIE_P, cells = []; g.forEach((r, y) => r.forEach((ch, x) => { if (P[ch]) cells.push([x, y, P[ch]]); }));
    return (FACE[key] = cells);
  }
  function drawDie(x, y, n, gold, cracked) { for (const [i, j, c] of face(n, gold, cracked)) { ctx.fillStyle = c; ctx.fillRect(x + i * 2, y + j * 2, 2, 2); } }

  // ---------------------------------------------------------------- 칼날카드
  function onAttack() { // 평타를 시작할 때 (근접 휘두르기 · 마법사 마력탄 · 거너 사격)
    const P = G && G.player; if (!P || P.dead || !hasCard()) return;
    if ((G.cardCd || 0) > time || Math.random() >= CARD_P) return;
    G.cardCd = time + CARD_CD;
    const ang = P.ang, x = P.x + Math.cos(ang) * 10, y = P.y - 12 + Math.sin(ang) * 6, L = rayEnd(x, y, ang, 2400);
    (G.cards = G.cards || []).push({ x0: x, y0: y, ang, L, d: 0, hit: new Set(), dir: dirOf(ang), room: G.dun && G.dun.cur });
    sfx('denCard'); sfx('whoosh', 1.6);
  }
  function tick(dt) {
    if (!G) return;
    const R = G.dun && G.dun.cur;
    if (G.cardRoom !== R) { G.cardRoom = R; G.cards = []; G.cardStuck = []; } // 다른 방으로 가면 사라짐
    // 뼈주사위
    const D = G.dice; if (D) { D.t += dt; if (!D.landed && D.t >= 0.8) { D.landed = true; land(); } for (const p of D.parts) { p.x += p.vx * dt / 2; p.y += p.vy * dt / 2; if (!p.ray) p.vy += 420 * dt; p.t -= dt; } D.parts = D.parts.filter(p => p.t > 0); if (D.t > 2.2) G.dice = null; }
    if (G.diceFx) { let ch = false; for (const k in G.diceFx) if (G.diceFx[k] <= time) { delete G.diceFx[k]; ch = true; } if (ch) { G.stats = calcStats(G.buffs); hudPrev.status = null; } }
    // 칼날카드
    const C = G.cards || [];
    for (const c of C) { const d0 = c.d; c.d = Math.min(c.L, c.d + CARD_SPD * dt); const ux = Math.cos(c.ang), uy = Math.sin(c.ang);
      for (const e of G.enemies) { if (e.dead || c.hit.has(e) || e.type === 'flag') continue; const bx = e.x - c.x0, by = e.y - 12 - c.y0, al = bx * ux + by * uy, pp = Math.abs(-bx * uy + by * ux);
        if (al >= d0 - 6 && al <= c.d + 6 && pp < (e.r || 10) + 6) { c.hit.add(e); damageEnemy(e, CARD_COEF, { proc: true, ang: c.ang, gauge: 0 }); sfx('hit', 1.5); } }
      if (c.d >= c.L) { c.done = true; const x = c.x0 + ux * c.L, y = c.y0 + uy * c.L; (G.cardStuck = G.cardStuck || []).push({ x, y, ang: c.ang, dir: c.dir, t: time });
        for (let i = 0; i < 6; i++) G.parts.push({ x, y, vx: -ux * rand(30, 80) + rand(-30, 30), vy: -uy * rand(30, 80) + rand(-50, 10), t: 0.35, c: i % 2 ? '#625d6a' : '#8a8494' });
        sfx('block', 1.4); } }
    G.cards = C.filter(c => !c.done);
    if (G.cardStuck && G.cardStuck.length) G.cardStuck = G.cardStuck.filter(s => time - s.t < STUCK_T);
  }
  function cells(c, x, y, clip) { const ca = Math.cos(c.ang), sa = Math.sin(c.ang), X = snap2(x), Y = snap2(y);
    for (const [i, j, col] of DIRS[c.dir]) { if (clip != null && i * ca + j * sa > clip) continue; ctx.fillStyle = col; ctx.fillRect(X + i * 2, Y + j * 2, 2, 2); } }
  function ents(list) { // 박힌 카드 (앞쪽 1/3은 벽 · 장애물 속) — 박힌 장애물 그림보다 앞에 보이게 깊이 정렬
    if (!G || !G.cardStuck) return;
    for (const s of G.cardStuck) list.push({ y: s.y + 34, d: () => { const age = time - s.t; if (age > STUCK_T - 1 && Math.floor(age * 10) % 2) return; // 4초부터 깜빡임
      const ca = Math.cos(s.ang), sa = Math.sin(s.ang); ctx.fillStyle = '#14111a'; for (let i = 0; i < 3; i++) ctx.fillRect(snap2(s.x + ca * (4 + i * 2)), snap2(s.y + sa * (4 + i * 2)), 2, 2);
      cells(s, s.x, s.y, 1.2); } });
  }
  function air() { // 날아가는 카드 + 은빛 점선 잔상
    if (!G || !G.cards) return;
    for (const c of G.cards) { const ux = Math.cos(c.ang), uy = Math.sin(c.ang);
      for (let k = 6; k < 60 && k < c.d; k += 6) { ctx.fillStyle = k < 30 ? '#e8eef8' : '#8a92a8'; ctx.fillRect(snap2(c.x0 + ux * (c.d - k)), snap2(c.y0 + uy * (c.d - k)), 2, 2); }
      cells(c, c.x0 + ux * c.d, c.y0 + uy * c.d, null); }
  }
  function top() { // 머리 위 뼈주사위 (캐릭터 위 · 말주머니 아래)
    const D = G && G.dice, P = G && G.player; if (!D || !P) return;
    const t = D.t, hx = snap2(P.x - 12), base = snap2(P.y - 56 - (P.lift || 0)); // 머리 바로 위 (12×12칸)
    if (t < 0.8) { const f = Math.floor(t / 0.07), dy = [0, -3, -6, -8, -8, -6, -3, 0, -3, -4, -3, 0][Math.min(11, f)], dx = [0, 1, 1, 2, 1, 0, -1, -1, 0, 0, 0, 0][Math.min(11, f)];
      drawDie(hx + dx * 2, base + dy * 2, D.seq[f % 12], false); }
    else { const n = D.n, out = t > 1.9 && Math.floor(t * 20) % 2 === 0;
      if (n === 1) { if (t < 1.0) drawDie(hx, base, 1, false, true); }
      else if (!out) drawDie(hx, base, n, n === 6 && Math.floor(t * 8) % 2 === 0); }
    for (const p of D.parts) { ctx.fillStyle = p.c; ctx.fillRect(snap2(hx + p.x * 2), snap2(base + p.y * 2), 2, 2); }
  }
  function tags() { // HUD 상태 줄 글자 칩
    const D = G && G.diceFx; if (!D) return ''; let h = '';
    for (const k of ['atk', 'spd', 'stam', 'cd']) if (D[k] > time) h += `<span class="tag" style="background:#4a3c22;color:#f4ead0">${TAG[k]}</span>`;
    return h;
  }
  function statMods(s, add) { // calcStats에서 부름 (atkP · spdP 더하기는 add로)
    const D = G && G.diceFx; if (!D) return;
    if (D.atk > time) add('atk', 20); if (D.spd > time) add('spd', 15);
    if (D.stam > time) s.stamRate *= 1.4; if (D.cd > time) { s.cdr += 0.2; s.gaugeRate *= 1.25; }
  }
  function cardTip(it, cls, dropHTML) {
    return `<div class="dl"><div class="gr">${gradeOf(it).n} · 보관 전용 무기</div><div class="nm">${it.name}</div><div class="fx">✦ ${CARD_D}</div></div><div class="tK"><span class="kI">장착할 수 없는 무기입니다.</span></div>${dropHTML}`;
  }
  return { ART: { die: DIE9, dieP: DIE_P, card: CARD_BIG, cardP: CP }, onHit, onAttack, tick, ents, air, top, tags, statMods, hasCard, makeCard, cardIconURL, cardTip, CARD_D };
})();
