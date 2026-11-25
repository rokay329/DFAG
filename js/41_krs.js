'use strict';
// ==================================================================================================
// 잿빛 왕관 원정대 — 41_krs.js : v3.21 기사 무기별 우클릭 기술 (시안 _시안/기사_우클릭기술_시안01.html)
//  · 레어 · 유니크 · 레전더리 기사 무기는 무기마다 고유한 우클릭 기술을 씀 (커먼 · 초록 무기는 기본 「돌진 참격」)
//  · 우클릭 쿨타임은 무기마다 따로 돎 (장착하지 않은 무기의 쿨타임도 계속 줄어듦)
//  · 성문 빗장 · 별의 서약 대검: 돌진 참격을 바꾸던 고유 효과를 우클릭 기술로 옮기고 새 고유 효과(무거운 빗장 · 별빛 검기)를 붙임
//  · 무기는 게임 rotW(칸 단위 회전)로만 움직이고, 바닥 효과는 2px 칸 + 디더
// ==================================================================================================
// ---------------------------------------------------------------- v3.22 기술 공용 몸 동작 (기본 공격의 strikePose처럼 몸이 움찔 · 내딛음 · 출렁)
//  · 기술이 시작되면 「예비 동작」(움츠리며 뒤로 당김), 기술 안에서 FXK.punch가 불리면 「타격」(앞으로 내딛으며 늘어남 → 탄성 있게 제자리)
//  · 빠르게 움직이는 동안은 「돌진」(앞으로 기울며 늘어남), 타격 없이 오래 이어지면 「버팀」(몸을 낮추고 떨림)
//  · 그레이브는 총 반동(P.recoil) 동작을 함께 더함
const SKP = (() => {
  const S = { k: null, t: 0, ang: 0, amp: 1, vx: 0, vy: 0, px: null, py: null };
  const easeO = k => 1 - (1 - k) * (1 - k);
  function beat(k, ang, amp) { const P = G && G.player; if (!P) return; S.k = k; S.t = 0; S.ang = ang == null ? (P.atkAng == null ? P.ang : P.atkAng) : ang; S.amp = amp == null ? 1 : amp; }
  function step(dt) { const P = G && G.player; if (!P) return; S.t += dt;
    if (S.px != null && dt > 0) { const vx = (P.x - S.px) / dt, vy = (P.y - S.py) / dt; S.vx += (vx - S.vx) * Math.min(1, dt * 18); S.vy += (vy - S.vy) * Math.min(1, dt * 18); }
    S.px = P.x; S.py = P.y; }
  function pose(P) {
    const f = P.face || 1, a = S.ang, cx = Math.cos(a), cy = Math.sin(a) * 0.6, amp = S.amp, t = S.t;
    let o = { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0 };
    if (S.k === 'wind') { const k = easeO(Math.min(1, t / 0.12)), tr = t > 0.18 && Math.floor(t / 0.05) % 2 ? 1 : 0;
      o = { dx: -cx * 3 * k + tr * f, dy: -cy * 3 * k + k, sx: 1 + 0.09 * k, sy: 1 - 0.11 * k, rot: -0.2 * f * k }; }
    else if (S.k === 'shot') { // 총: 발을 버티며 뒤로 밀렸다가 출렁
      if (t < 0.04) { const k = easeO(t / 0.04); o = { dx: -cx * 4 * k * amp, dy: -cy * 4 * k * amp + k * amp, sx: 1 + 0.1 * k * amp, sy: 1 - 0.14 * k * amp, rot: -0.2 * f * k }; }
      else { const u = Math.min(1, (t - 0.04) / 0.4), d = Math.exp(-5 * u) * Math.cos(u * 9); o = { dx: -cx * 4 * amp * d, dy: -cy * 4 * amp * d + amp * Math.max(0, d), sx: 1 + 0.1 * amp * d, sy: 1 - 0.14 * amp * d, rot: -0.2 * f * d }; } }
    else if (S.k === 'hit') { if (t < 0.05) { const k = easeO(t / 0.05); o = { dx: cx * (-2 + 8 * k) * amp, dy: cy * (-2 + 8 * k) * amp, sx: 1 + 0.15 * k * amp, sy: 1 - 0.12 * k * amp, rot: (-0.15 + 0.45 * k) * f }; }
      else { const u = Math.min(1, (t - 0.05) / 0.4), d = Math.exp(-5 * u) * Math.cos(u * 9); o = { dx: cx * 6 * amp * d, dy: cy * 6 * amp * d + (amp > 1.2 ? 2 * Math.max(0, d) : 0), sx: 1 + 0.15 * amp * d, sy: 1 - (amp > 1.2 ? 0.18 : 0.12) * amp * d, rot: 0.3 * f * d }; } }
    else if (S.k === 'hold') { const tr = Math.floor(t / 0.04) % 2; o = { dx: tr ? f : 0, dy: 1, sx: 1.05, sy: 0.93, rot: 0.06 * f }; }
    // 돌진: 빠르게 움직이면 그쪽으로 기울며 늘어남
    const sp = Math.hypot(S.vx, S.vy); if (sp > 140) { const s = Math.min(1, (sp - 140) / 260), sg = S.vx === 0 ? f : Math.sign(S.vx); o.rot += 0.28 * sg * s; o.sx *= 1 + 0.14 * s; o.sy *= 1 - 0.1 * s; o.dy += Math.floor(time / 0.05) % 2 ? s : 0; }
    // 총 반동
    if (G.cls === 'gunner' && P.recoil > 0) { const rc = Math.min(2.5, P.recoil), b = P.blade; o.dx += -Math.cos(b) * rc * 2; o.dy += -Math.sin(b) * rc; o.sx *= 1 - 0.05 * rc; o.sy *= 1 + 0.05 * rc; o.rot += -0.12 * f * rc; }
    o.dx = Math.round(o.dx / 2) * 2; o.dy = Math.round(o.dy / 2) * 2; // 2px 칸
    return o; }
  // 타격 없이 0.35초 넘게 이어지면 버팀 자세로
  function idle(P) { if (S.k !== 'hold' && S.t > 0.45 && !(Math.hypot(S.vx, S.vy) > 140)) { S.k = 'hold'; S.t = 0; } }
  // 무기 동작 (어세신 쌍검 · 세리안 지팡이): 기술 코드가 무기를 가만히 두는 동안 공용으로 움직임
  //  · 예비 동작: 무기를 뒤로 크게 당김 · 타격: 쌍검은 X자로 크게 휘두르고, 지팡이는 조준 쪽으로 찌르듯 내밀었다가 돌아옴
  //  · 버팀(오래 이어짐): 쌍검은 몸 앞에서 번갈아 짧게 베고, 지팡이는 끝으로 작은 원을 그림
  function weapon(P, b0, b20) { const cls = G.cls, t = S.t, f = P.face || 1, a = S.ang;
    if (cls === 'mage' && P.state === 'mrs') {
      if (S.k === 'hit' && t < 0.36) { const k = t < 0.06 ? easeO(t / 0.06) : 1 - easeO(Math.min(1, (t - 0.06) / 0.3)); P.blade = lerpAng(P.blade, a, k * 0.85); }
      else if (S.k === 'wind') P.blade += Math.sin(t * 40) * 0.05 * Math.min(1, t / 0.1);
      else P.blade += Math.sin(time * 9) * 0.2 + Math.cos(time * 13) * 0.06;
      return; }
    if (cls === 'priest' && P.state === 'prs') { // 메이스: 가만히 들고 있을 때만 — 타격 때 머리 위에서 내리찍고, 버틸 땐 가볍게 흔듦
      if (Math.abs(angDiff(P.blade, b0)) > 0.002) return; const up = (f > 0 ? -75 : -105) * DEG;
      if (S.k === 'hit' && t < 0.3) { const k = t < 0.07 ? easeO(t / 0.07) : 1 - easeO(Math.min(1, (t - 0.07) / 0.23)); P.blade = lerpAng(up, a + f * 0.5, k); P.prsFront = t < 0.12; if (t < 0.12) P.trail.push({ a: P.blade, t: 0.12 }); }
      else if (S.k === 'wind') P.blade += Math.sin(t * 40) * 0.05 * Math.min(1, t / 0.1);
      else P.blade += Math.sin(time * 8) * 0.12;
      return; }
    if (cls === 'ranger' && P.state === 'ars') { const still = Math.abs(angDiff(P.blade, b0)) < 0.002 && Math.abs(angDiff(P.blade2 == null ? 0 : P.blade2, b20 == null ? 0 : b20)) < 0.002; if (!still) return;
      if (S.k === 'hit' && t < 0.2) { const q = easeO(Math.min(1, t / 0.09)), rel = (-150 + 300 * q) * DEG; P.blade = a + f * rel; P.blade2 = a - f * rel; P.arsFront = true; if (t < 0.12) { P.trail.push({ a: P.blade, t: 0.12 }); P.trail2.push({ a: P.blade2, t: 0.12 }); } }
      else if (S.k === 'wind') { const k = easeO(Math.min(1, t / 0.1)); P.blade = a + f * (-150 * k) * DEG; P.blade2 = a - f * (-120 * k) * DEG; }
      else { const ph = Math.floor(time / 0.14) % 2, u = (time % 0.14) / 0.14, rel = (-70 + 140 * easeO(u)) * DEG; if (ph) { P.blade = a + f * rel; P.trail.push({ a: P.blade, t: 0.08 }); } else { P.blade2 = a - f * rel; P.trail2.push({ a: P.blade2, t: 0.08 }); } P.arsFront = true; } } }
  return { beat, step, pose, idle, weapon, S };
})();
// ---------------------------------------------------------------- v3.22 기술 효과 깊이 정렬 (장애물 · 캐릭터 뒤로 가려지게)
//  · 우클릭 기술이 만든 G.fx · G.parts에 바닥 깊이(zY)를 붙여, 화면 맨 위가 아니라 장애물 · 캐릭터와 함께 y 순서로 그림
//  · 각 기술 파일(41 · 42 · 43)의 던진 무기 · 폭발 · 칼자국도 하나씩 깊이 정렬 목록(ents)에 넣음
// v3.25 우클릭 기술 판정을 기본 공격보다 후하게 (보이는 그림은 그대로)
//  · 기술이 도는 동안(시작 · 진행 · 던진 무기) 모든 적의 판정 반지름을 RS_PAD만큼 넓혀서 계산
//  · 부채꼴 판정(coneIn): 각도 여유(적 몸 크기만큼 더) + 몸에 붙은 적은 각도와 상관없이 맞음 (무기와 몸 사이 빈틈 없음)
//  · 휘두르는 판정(arcIn): 지난 장면과 이번 장면의 칼 각도 사이 전체(궤적 안쪽)를 판정
//  · 끝점 판정(segHit): 몸에서 무기 끝까지 선분 전체를 판정
const RS_PAD = 10;
function coneIn(P, e, a, half) { const d = dist(P, e); if (d < e.r + 22) return true; return Math.abs(angDiff(angTo(P, e), a)) < half + Math.atan2(e.r + 8, Math.max(1, d)); }
function arcIn(P, e, a0, a1, reach) { const d = dist(P, e); if (d >= reach + e.r) return false; if (d < e.r + 22) return true; const tol = Math.atan2(e.r + 8, Math.max(1, d)), ea = angTo(P, e), sw = angDiff(a1, a0); if (Math.abs(sw) > Math.PI) return true; const k = angDiff(ea, a0); return sw >= 0 ? k > -tol && k < sw + tol : k < tol && k > sw - tol; }
function segHit(ax, ay, bx, by, e, pad) { const px = e.x, py = e.y - 10, vx = bx - ax, vy = by - ay, L2 = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / L2)); return Math.hypot(px - ax - vx * t, py - ay - vy * t) < pad + e.r; }
const SKD = (() => {
  const prov = [];
  function tag(f0, p0) {
    for (let i = f0; i < G.fx.length; i++) { const f = G.fx[i]; if (f.zY != null || f.kind === 'rockspike') continue; const y = f.y0 != null ? Math.max(f.y0, f.y1 == null ? f.y0 : f.y1) : f.y; if (y == null) continue; f.zY = f.kind === 'ghost' ? y + 1 : y + 12; }
    for (let i = p0; i < G.parts.length; i++) { const p = G.parts[i]; if (p.zY == null) p.zY = p.y + 14; }
  }
  let padD = 0; const padL = [];
  function wrap(fn) { return function (...a) { if (!G || !G.fx || !G.parts) return fn.apply(this, a); const FX = G.fx, PA = G.parts, f0 = FX.length, p0 = PA.length;
    if (!padD++) { padL.length = 0; for (const e of G.enemies || []) if (e && typeof e.r === 'number') { padL.push(e); e.r += RS_PAD; } } // v3.25 기술 판정 여유
    try { return fn.apply(this, a); } finally { if (!--padD) for (const e of padL) e.r -= RS_PAD; if (G && G.fx === FX && G.parts === PA && FX.length >= f0 && PA.length >= p0) tag(f0, p0); } }; }
  let inUpd = false;
  function wrapAll(o) { for (const k of ['start', 'second', 'update', 'tick']) if (typeof o[k] === 'function') o[k] = wrap(o[k]);
    // 몸 동작: 기술 시작 = 예비 동작 · 기술 진행 중 punch = 타격 (원격 폭발의 punch는 몸을 움직이지 않음)
    const st = o.start, sc = o.second, up = o.update;
    o.start = function (...a) { const r = st.apply(this, a); if (r && G && G.player && /^(krs|ars|grs|mrs|prs)$/.test(G.player.state)) SKP.beat('wind'); return r; };
    if (sc) o.second = function (...a) { inUpd = true; try { return sc.apply(this, a); } finally { inUpd = false; } };
    o.update = function (dt) { const P0 = G && G.player, b0 = P0 && P0.blade, b20 = P0 && P0.blade2; inUpd = true; try { return up.call(this, dt); } finally { inUpd = false; SKP.step(dt); if (G && G.player) { SKP.idle(G.player); if (/^(ars|mrs|prs)$/.test(G.player.state)) SKP.weapon(G.player, b0, b20); } } };
    return o; }
  const drawPart = p => () => { ctx.globalAlpha = Math.min(1, p.t * 3); ctx.fillStyle = p.c; ctx.fillRect(snap2(p.x), snap2(p.y), 2, 2); ctx.globalAlpha = 1; };
  const _ge = gearEnts; gearEnts = function (ents) { _ge(ents); if (!G) return;
    for (const f of G.fx) if (f.zY != null) ents.push({ y: f.zY, d: () => drawFx(f) });
    for (const p of G.parts) if (p.zY != null) ents.push({ y: p.zY, d: drawPart(p) });
    for (const fn of prov) fn(ents); };
  // 한 물체만 그리기: 각 파일의 그리기 함수가 SEL로 받은 물체만 그리게 해서 깊이 순서에 끼워 넣음
  const one = (draw, set, item) => () => { ctx.save(); set(item); try { draw(); } finally { set(null); ctx.restore(); } };
  // 바닥 효과(웅덩이 · 그을음 · 진)가 배경에 그려진 가구 자리와 그 위쪽에 오면 반투명(35%)으로 그려 가구가 비쳐 보이게
  let mask = false;
  // 던전 방의 장애물은 따로 그린 그림이라 원래 깊이 순서로 위에 덮임 → 가구가 배경 그림에 들어간 방(집 · 연구실 · 기록 보관소 등)에서만 반투명 처리
  const BAKED = new Set(['home', 'lab', 'archive', 'ancArena', 'altar', 'forge', 'bistro']);
  const baked = () => { const R = G && G.dun && G.dun.cur; return !!(R && (BAKED.has(R.type) || G.dun.home || G.dun.forge || G.dun.lab)); };
  // 가구 자리를 둥근 타원으로 보고, 가운데일수록 더 투명하게 (가장자리는 부드럽게 · 네모로 잘려 보이지 않게) — 0(그대로) ~ 1(가장 투명)
  // v3.22 확인 결과 집 · 연구실 가구도 따로 그린 그림이라 깊이 순서로 이미 위에 덮임 → 반투명 처리는 끔 (USE_OCC를 켜면 다시 동작)
  const USE_OCC = false;
  function occ(x, y) { const L = G && G.obs; if (!USE_OCC || !L || !baked()) return 0; let f = 0;
    for (const b of L) { if (b.ghost || b.t === 'pit') continue; let cx, cy, rx, ry;
      if (b.c) { cx = b.x; rx = b.r + 4; const top = b.y - b.r - 22, bot = b.y + b.r * 0.6; cy = (top + bot) / 2; ry = (bot - top) / 2 + 4; }
      else { cx = (b.x0 + b.x1) / 2; rx = (b.x1 - b.x0) / 2 + 6; const top = b.y0 - 22, bot = b.y1; cy = (top + bot) / 2; ry = (bot - top) / 2 + 6; }
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry); if (d < 1.2) f = Math.max(f, Math.min(1, (1.2 - d) / 0.45)); }
    return f; }
  // 효과끼리 겹치는 칸 디더: 이번 프레임에 다른 효과(id가 다름)가 이미 칠한 칸이면 바둑판으로 한 칸 건너 하나만 칠함
  const PO = { t: -1, m: new Map() }; let oidN = 1;
  function pd(x, y, id, c, s) { const X = snap2(x), Y = snap2(y), k = X * 8192 + Y; if (PO.t !== time) { PO.t = time; PO.m.clear(); }
    const o = PO.m.get(k); if (o !== undefined && o !== id && ((X + Y) >> 1) % 2) return false; if (o === undefined) PO.m.set(k, id); ctx.fillStyle = c; ctx.fillRect(X, Y, s || 2, s || 2); return true; }
  const oid = o => o.__oid || (o.__oid = oidN++);
  const ground = fn => function (...a) { mask = true; try { return fn.apply(this, a); } finally { mask = false; } };
  return { wrap, wrapAll, add: fn => prov.push(fn), one, occ, ground, pd, oid, get mask() { return mask; }, get inUpd() { return inUpd; } };
})();
const KRS = (() => {
  const DEF = {
    cleaver: { n: '정육 내려치기', cd: 9, d: '식칼을 크게 들어 올렸다가 앞쪽 바닥으로 내리찍습니다. 바닥이 갈라지는 범위의 적에게 큰 피해를 주고, 1초 동안 기절시킵니다.' },
    tuna: { n: '참치 썰매', cd: 8, d: '참치를 깔고 미끄러지듯 돌진합니다. 지나간 길에 3초 동안 얼음 장판이 남아 적의 이동 속도가 감소하고, 돌진이 끝나면 얼음 조각이 튀어 주변 적에게 피해를 줍니다.' },
    chain: { n: '분절 휘감기', cd: 9, d: '마디 사이를 크게 벌린 검을 채찍처럼 한 바퀴 휘두릅니다. 닿은 적에게 피해를 주고, 기사 쪽으로 끌어당깁니다.' },
    bell: { n: '종 울리기', cd: 10, d: '추를 바닥에 내려쳐 울림 고리를 세 번 퍼뜨립니다. 고리에 닿은 적에게 피해를 주고, 그로기를 크게 쌓습니다.' },
    windmill: { n: '돌개바람', cd: 10, d: '2초 동안 날개를 돌리며 조준한 방향으로 천천히 나아갑니다. 닿은 적에게 피해를 주고 바깥으로 밀어내며, 날아오는 투사체를 쳐냅니다.' },
    fang: { n: '뼈 톱질', cd: 8, d: '톱니 대검을 앞으로 내밀고 돌진하며 지나간 적을 긁습니다. 긁힌 적에게 출혈을 3중첩 부여합니다.' },
    gate: { n: '성문 돌파', cd: 9, d: '빗장을 앞세워 돌진하며 처음 부딪힌 적을 벽까지 밀고 갑니다. 벽에 부딪히면 충격파가 일어나 주변 적에게 피해를 주고, 밀린 적을 기절시킵니다.' },
    bread: { n: '바게트 부메랑', cd: 7, d: '바게트를 빙글빙글 던집니다. 바게트는 앞으로 날아갔다가 되돌아오며, 오가는 길에 닿은 적을 0.8초 동안 기절시킵니다.' },
    sun: { n: '별의 서약', cd: 10, d: '조준한 지점에 대검을 던져 꽂습니다. 3초 안에 다시 누르면 꽂힌 대검으로 순간 돌진해 대검을 뽑으며 별빛을 폭발시킵니다. 다시 누르지 않으면 대검이 손으로 돌아옵니다.' },
    exec: { n: '처형', cd: 12, d: '조준한 적(없으면 조준한 방향에서 조준점에 가장 가까운 적)의 뒤로 순간 이동해 처형검을 내리칩니다. 체력이 30% 이하인 적은 즉시 처치하고, 그 밖의 적에게는 큰 피해를 줍니다. 조준한 방향에 체력이 30% 이하인 적이 있으면 그 적을 먼저 노립니다. 대상이 될 적의 머리 위에는 표식이 나타납니다.' },
  };
  for (const k in DEF) SK_META[k] = Object.assign(SK_META[k] || {}, { K: DEF[k].n, KD: DEF[k].d }); // HUD 스킬 칸 이름 · 설명
  const K = { g: null, store: {}, cur: undefined, ice: [], cracks: [], rings: [], lights: [], erupt: [] };
  const def = () => (G && G.cls === 'knight' ? DEF[wSkill()] || null : null);
  const big = e => e.type === 'boss' || isElite(e) || isSemi(e) || isDummy(e);
  const handPt = P => ({ x: P.x + P.face * 7, y: P.y - 5 });
  const aimPt = (P, maxD) => { let tx, ty; if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; } else { tx = P.x + Math.cos(P.ang) * maxD; ty = P.y + Math.sin(P.ang) * maxD; }
    const d = Math.hypot(tx - P.x, ty - P.y); if (d > maxD) { tx = P.x + (tx - P.x) / d * maxD; ty = P.y + (ty - P.y) / d * maxD; }
    return { x: clamp(tx, A.x0 + 16, A.x1 - 16), y: clamp(ty, A.y0 + 16, A.y1 - 16) }; };
  const wallAt = (x0, y0, x1, y1) => segSolid(x0, y0, x1, y1, 4) || x1 < A.x0 + 6 || x1 > A.x1 - 6 || y1 < A.y0 + 6 || y1 > A.y1 - 6;
  const starOut = () => (G.wproj || []).find(w => w.k === 'krsStar');
  const breadOut = () => (G.wproj || []).some(w => w.k === 'krsBread');

  // ---------------------------------------------------------------- v3.21 화려한 연출 도우미 (모두 2px 칸 · 도트 고리 · 디더)
  const FXK = {
    light(x, y, r, a, c, t) { K.lights.push({ x, y, r, a, c, t, max: t }); },
    ring(x, y, c, grow, t, r) { G.fx.push({ kind: 'ring', px: true, ry: 0.6, x, y, r: r || 6, grow, t, max: t, c }); G.fx.push({ kind: 'ring', px: true, ry: 0.6, x, y, r: (r || 6) + 2, grow, t: t * 0.85, max: t * 0.85, c }); }, // 두 겹 · v3.22 바닥 타원 // 두 겹으로 굵게
    burst(x, y, cols, n, sp, g, glow, life) { n = Math.round(n * 1.6); for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(sp * 0.4, sp); G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.75 - (g ? sp * 0.3 : 0), t: rand((life || 0.4) * 0.6, life || 0.4), c: pick(cols), g: g || 0, glow: !!glow }); } },
    rays(x, y, n, len, c, t, rot) { for (let i = 0; i < n; i++) { const a = (rot || 0) + i / n * TAU, L = len * (i % 2 ? 0.6 : 1); G.fx.push({ kind: 'streak', px: true, x0: x, y0: y, x1: x + Math.cos(a) * L, y1: y + Math.sin(a) * L * 0.75, t, max: t, c }); } },
    pop(x, y, v, c, s) { G.nums.push({ x, y, v, t: 1.0, c, s: Math.min(4, (s || 2) + 1), pop: 0.3, vx: 0, vy: -50 }); },
    debris(x, y, n, cols) { n = Math.round(n * 1.5); for (let i = 0; i < n; i++) G.parts.push({ x: x + rand(-10, 10), y: y - rand(0, 6), vx: rand(-120, 120), vy: rand(-220, -90), t: rand(0.5, 0.8), c: pick(cols || ['#6e6058', '#4e443e', '#8a7c70']), g: 520, floor: y + rand(2, 10) }); },
    punch(sh, zm, hs, ang) { addShake(sh, ang); if (G && G.cls === 'knight' && (wSkill() === 'sun' || wSkill() === 'exec') && typeof skShake === 'function') skShake(sh, ang); /* v3.25 레전더리 기술만 실제 화면 흔들림 */ zoomK = Math.max(zoomK, zm); hitstop = Math.max(hitstop, hs || 0); if (SKD.inUpd) SKP.beat(G.cls === 'gunner' ? 'shot' : 'hit', null, clamp(sh / 5, 0.6, 1.7)); },
    flash(c, t) { flashT = Math.max(flashT, t); flashColor = c; },
  };
  // ---------------------------------------------------------------- 쿨타임 (무기마다 따로)
  function cdBase() { const D = def(); return D ? D.cd : CL().skillCd; }
  function tick(dt) {
    if (K.g !== G) { K.g = G; K.store = {}; K.cur = undefined; K.ice = []; K.cracks = []; K.rings = []; K.lights = []; K.erupt = []; }
    const P = G.player; if (!P) return;
    if (G.cls === 'knight' || G.cls === 'ranger' || G.cls === 'gunner' || G.cls === 'mage' || G.cls === 'priest') { // v3.22 어세신도 무기마다 따로
      const it = eqWeapon(G.cls), id = it ? it.id : 'none';
      if (K.cur === undefined) K.cur = id;
      if (id !== K.cur) { K.store[K.cur] = P.chargeCd.slice(); P.chargeCd = (K.store[id] || P.chargeCd.map(() => 0)).slice(); delete K.store[id]; K.cur = id; }
      for (const k in K.store) K.store[k] = K.store[k].map(c => Math.max(0, c - dt));
    }
    // 얼음 장판: 밟은 적은 느려짐 (applySt 저항 누적을 피해 직접 짧게 건다)
    for (const f of K.ice) f.t -= dt; K.ice = K.ice.filter(f => f.t > 0);
    if (K.ice.length) for (const e of G.enemies) { if (e.dead || e.type === 'flag') continue; if (K.ice.some(f => Math.hypot(e.x - f.x, (e.y - f.y) / 0.55) < 24 + e.r * 0.5)) { e.st = e.st || {}; e.st.slowT = Math.max(e.st.slowT || 0, 0.25); e.st.slowK = Math.min(e.st.slowK || 1, 0.5); } }
    for (const c of K.cracks) c.t -= dt; K.cracks = K.cracks.filter(c => c.t > 0);
    for (const l of K.lights) l.t -= dt; K.lights = K.lights.filter(l => l.t > 0);
    for (const q of K.erupt) { q.d -= dt; if (q.d > 0 || q.done) continue; q.done = true; // 갈라진 땅을 따라 바위가 차례로 솟구침
      FXK.debris(q.x, q.y, 5 + q.n); dust(q.x, q.y, 6); FXK.ring(q.x, q.y, '#8a7c70', 120, 0.25, 3); FXK.light(q.x, q.y, 60, 0.5, '255,200,150', 0.15); addShake(2, 0); if (q.n % 2 === 0) sfx('crunch', 0.6 + q.n * 0.05);
      G.fx.push({ kind: 'streak', px: true, x0: q.x, y0: q.y, x1: q.x + rand(-3, 3), y1: q.y - 18 - q.n * 2, t: 0.16, max: 0.16, c: '#8a7c70' }); }
    K.erupt = K.erupt.filter(q => !q.done);
    // 종 울리기: 퍼지는 울림 고리 판정
    for (const r of K.rings) { r.age += dt; if (r.age < 0) continue; const R = 10 + r.age * 330;
      if (r.age > 0 && !r.fx) { r.fx = true; FXK.ring(r.x, r.y, r.n ? '#b8983c' : '#f0d890', 330, 0.5, 10); FXK.ring(r.x, r.y, '#fff2c0', 300, 0.35, 4); sfx('grogi', 0.7 + r.n * 0.12); FXK.burst(r.x, r.y - 6, ['#ffe08a', '#f0d890', '#fff6d0'], 14, 200, 0, true, 0.35); FXK.light(r.x, r.y, 120, 0.7, '255,220,120', 0.35); FXK.punch(3 + r.n * 1.5, 0.012); }
      for (const e of G.enemies) { if (e.dead || e.type === 'flag' || r.hit.has(e)) continue; const d = Math.hypot(e.x - r.x, (e.y - r.y) / 0.75); if (d < R + e.r) { r.hit.add(e); damageEnemy(e, 0.6, { ang: Math.atan2(e.y - r.y, e.x - r.x), grogi: 24, kb: 60, gauge: 2, proc: true }); } } }
    K.rings = K.rings.filter(r => r.age < 0.5);
    // 바게트가 날아가 있거나 대검을 던졌으면 손이 비어 있음
    if (G.wproj && G.wproj.length && G.cls === 'knight') { const sk = wSkill(); G.wproj = G.wproj.filter(w => !(w.k === 'krsStar' && sk !== 'sun') && !(w.k === 'krsBread' && sk !== 'bread')); } // 무기를 바꾸면 던진 무기는 사라짐
    tickProj(dt);
    if (G.cls === 'knight') P.krsHideW = breadOut() || !!starOut() || (P.state === 'krs' && P.krs && P.krs.hideW);
  }

  // ---------------------------------------------------------------- 시작
  function start() {
    const D = def(); if (!D) return false;
    const P = G.player, k = wSkill();
    P.atkAng = P.ang; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.sign = P.face; P.combo = 0; P.queued = false; P.trail = [];
    P.krs = { k, t: 0, hit: new Set(), did: {} };
    if (k === 'bread') { // 던지기만 하고 바로 움직일 수 있음
      const h = handPt(P); (G.wproj = G.wproj || []).push({ k: 'krsBread', x: h.x, y: h.y - 4, ang: P.ang, out: true, d: 0, hit: new Set(), spin: 0 });
      sfx('whoosh', 0.9); P.state = 'krs'; P.krs.dur = 0.16; return true;
    }
    if (k === 'sun') {
      const T = aimPt(P, 230), h = handPt(P);
      (G.wproj = G.wproj || []).push({ k: 'krsStar', x: h.x, y: h.y - 6, x0: h.x, y0: h.y - 6, tx: T.x, ty: T.y, t: 0, fly: 0.62, life: 3, hit: new Set(), spin: 0, ph: 'up' }); // 손에서 하늘로 → 하늘에서 내리꽂힘
      FXK.burst(h.x, h.y - 10, ['#fff6c0', '#e8b840', '#ffffff'], 12, 160, 0, true, 0.35); FXK.ring(h.x, h.y - 8, '#fff0b0', 160, 0.3, 4); FXK.light(h.x, h.y, 90, 0.8, '255,225,130', 0.25);
      sfx('whoosh', 0.8); P.state = 'krs'; P.krs.dur = 0.18; return true;
    }
    if (k === 'exec') return startExec(P);
    P.state = 'krs';
    P.krs.dur = { cleaver: 0.78, tuna: 0.62, chain: 1.5, bell: 0.95, windmill: 2.0, fang: 0.48, gate: 0.6 }[k] || 0.6;
    if (k === 'tuna' || k === 'fang' || k === 'gate') { sfx('whoosh'); P.iframe = Math.max(P.iframe, 0.12); }
    if (k === 'windmill') sfx('whoosh', 0.7);
    return true;
  }
  // 별의 서약: 꽂힌 대검이 있으면 쿨타임과 상관없이 다시 눌러 순간 돌진
  function second() {
    if (!G || G.cls !== 'knight' || wSkill() !== 'sun') return false;
    const S = starOut(); if (!S || S.t < S.fly) return false;
    const P = G.player; P.state = 'krs'; P.krs = { k: 'sunDash', t: 0, dur: 0.34, x0: P.x, y0: P.y, tx: S.x, ty: S.y + 6, hit: new Set(), did: {} };
    P.face = S.x >= P.x ? 1 : -1; P.iframe = Math.max(P.iframe, 0.35); sfx('bolt', 0.7);
    G.fx.push({ kind: 'streak', px: true, x0: P.x, y0: P.y - 10, x1: S.x, y1: S.y - 4, t: 0.3, max: 0.3, c: '#fff0b0' });
    return true;
  }
  // v3.25 처형 대상: 조준한 방향의 부채꼴(±60°, 270px) 안에서 조준점에 가장 가까운 적 — 처치할 수 있는 적(체력 30% 이하) 먼저, 없으면 보스 · 정예 · 준정예 (예전: 방향과 상관없이 가장 가까운 적)
  function execPick(P) { const T0 = aimPt(P, 330), aa = Math.atan2(T0.y - P.y, T0.x - P.x), kill = e => !big(e) && e.hp <= e.maxHp * 0.3; let clk = null, cd = 1e9, best = null, bd = 1e9, bigT = null, bb = 1e9, any = null, ad = 1e9;
    for (const e of G.enemies) { if (e.dead || e.type === 'flag' || e.hidden) continue; const d = dist(P, e); if (d > 330) continue;
      const c = Math.hypot(e.x - T0.x, e.y - 14 - T0.y); if (c < e.r + 30 && c < cd) { cd = c; clk = e; } // v3.25 누른 자리(적 몸 + 30px 안)에 있는 적을 먼저
      if (d > e.r + 22 && Math.abs(angDiff(angTo(P, e), aa)) > 75 * DEG) continue;
      const s = Math.hypot(e.x - T0.x, e.y - T0.y) + d * 0.25;
      if (kill(e)) { if (s < bd) { bd = s; best = e; } } else if (big(e)) { if (s < bb) { bb = s; bigT = e; } } else if (s < ad) { ad = s; any = e; } }
    const T = clk || best || bigT || any; return { T, kill: !!T && kill(T) }; }
  function startExec(P) {
    const pk = execPick(P), T = pk.T, best = pk.kill ? T : null;
    P.state = 'krs'; P.krs.dur = T ? 1.2 : 0.62; P.krs.tgt = T; P.krs.kill = !!best;
    if (T) { smoke(P.x, P.y, 16); sfx('bolt', 0.5); P.krs.hideW = true; FXK.flash('#000000', 0.22); FXK.burst(P.x, P.y - 12, ['#3a3036', '#5a5056', '#8a8078', '#d84020'], 26, 160, -40, false, 0.6);
      G.fx.push({ kind: 'streak', px: true, x0: P.x, y0: P.y - 10, x1: T.x, y1: T.y - 10, t: 0.25, max: 0.25, c: '#8a1e14' }); FXK.light(T.x, T.y, 90, 0.7, '255,60,30', 0.5); }
    return true;
  }

  // ---------------------------------------------------------------- 진행
  const lerp = (a, b, k) => a + (b - a) * clamp(k, 0, 1), seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const setRel = (P, deg) => { P.blade = P.atkAng + P.sign * deg * DEG; };
  function hitCone(P, rng, half, fn) { for (const e of G.enemies) { if (e.dead || e.type === 'flag' || P.krs.hit.has(e)) continue; const d = dist(P, e); if (d < rng + e.r && coneIn(P, e, P.atkAng, half)) { P.krs.hit.add(e); fn(e); } } }
  function hitNear(P, r, fn) { for (const e of G.enemies) { if (e.dead || e.type === 'flag' || P.krs.hit.has(e)) continue; if (Math.hypot(e.x - P.x, e.y - P.y) < r + e.r) { P.krs.hit.add(e); fn(e); } } }
  function dashStep(P, sp, dt) { const n = Math.max(1, Math.ceil(sp * dt / 4)), px = P.x, py = P.y; for (let i = 0; i < n; i++) { P.x += Math.cos(P.atkAng) * sp * dt / n; P.y += Math.sin(P.atkAng) * sp * dt / n; if (G.obs && G.obs.length) solveObs(P, P.r, false); } P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r); return Math.hypot(P.x - px, P.y - py); }
  function update(dt) {
    const P = G.player, R = P.krs; if (!R) { P.state = 'idle'; return; }
    R.t += dt; const t = R.t, k = R.k;
    P.krsFront = false; P.krsChain = false; P.lift = 0;
    if (k === 'cleaver') {
      if (t < 0.32) { setRel(P, lerp(-80, -160, t / 0.32)); const h = handPt(P), tx = h.x + Math.cos(P.blade) * 34, ty = h.y + Math.sin(P.blade) * 34; if (Math.random() < 0.7) G.parts.push({ x: tx + rand(-10, 10), y: ty + rand(-10, 10), vx: (h.x - tx) * 2, vy: (h.y - ty) * 2, t: 0.2, c: pick(['#fff6dc', '#d8c8b0']), g: 0, glow: true }); FXK.light(tx, ty, 50 + t * 100, 0.5, '255,230,200', 0.05); }
      else if (t < 0.4) { setRel(P, lerp(-160, 50, (t - 0.32) / 0.08)); P.krsFront = true; P.trail.push({ a: P.blade, t: 0.2 }); }
      else { setRel(P, 50); P.krsFront = true; }
      if (t >= 0.4 && !R.did.hit) { R.did.hit = true;
        const fx = P.x + Math.cos(P.atkAng) * 46, fy = P.y + Math.sin(P.atkAng) * 34 + 4;
        hitCone(P, 104, 0.7, e => { damageEnemy(e, 2.4, { heavy: true, grogi: 18, kb: 60, ang: P.atkAng, gauge: 6 }); applySt(e, 'stun', 1.0); });
        for (const da of [-0.38, 0, 0.38]) K.cracks.push({ x: P.x + Math.cos(P.atkAng) * 20, y: P.y + 2 + Math.sin(P.atkAng) * 14, ang: P.atkAng + da, len: da ? 64 : 104, t: 1.6, max: 1.6, seed: Math.random() * 99 });
        for (let i = 0; i < 6; i++) K.erupt.push({ x: P.x + Math.cos(P.atkAng) * (34 + i * 14), y: P.y + 4 + Math.sin(P.atkAng) * (24 + i * 10), d: i * 0.05, n: i }); FXK.flash('#fff6e0', 0.05); FXK.rays(fx, fy - 4, 8, 70, '#f0e6d0', 0.22);
        hitCrack(fx, fy, 2, 70); dust(fx, fy, 24); sfx('blast', 0.6); FXK.punch(8, 0.03, 0.06, P.atkAng);
        FXK.ring(fx, fy, '#d8c8b0', 260, 0.35, 8); FXK.ring(fx, fy, '#8a7c70', 180, 0.45, 4); FXK.debris(fx, fy, 16); FXK.burst(fx, fy - 6, ['#fff6dc', '#ffd8a0'], 10, 240, 0, true, 0.25); FXK.light(fx, fy, 110, 0.8, '255,210,160', 0.3); }
    } else if (k === 'tuna') {
      if (t < 0.5) { P.lift = -3; P.blade = P.atkAng; P.krsFront = true; const d = dashStep(P, 330, dt); R.acc = (R.acc || 0) + d;
        if (R.acc >= 8) { R.acc = 0; K.ice.push({ x: P.x, y: P.y + 2, t: 3 }); }
        for (let j = 0; j < 2; j++) G.parts.push({ x: P.x - Math.cos(P.atkAng) * 10 + rand(-6, 6), y: P.y + rand(-2, 3), vx: -Math.cos(P.atkAng) * rand(40, 120), vy: rand(-60, -10), t: rand(0.25, 0.45), c: pick(['#ffffff', '#e4f4fc', '#9ccbe6']), g: 200, glow: j === 0 }); FXK.light(P.x, P.y, 60, 0.5, '170,220,255', 0.08);
        hitNear(P, P.r + 10, e => { damageEnemy(e, 1.0, { ang: P.atkAng, kb: 90, grogi: 8, gauge: 4 }); e.st = e.st || {}; applySt(e, 'slow', 2, 0.5); }); }
      else { P.blade = P.atkAng; if (!R.did.end) { R.did.end = true; sfx('crunch', 1.5); FXK.ring(P.x, P.y - 4, '#e4f4fc', 260, 0.4, 8); FXK.ring(P.x, P.y - 4, '#9ccbe6', 180, 0.5, 4); FXK.burst(P.x, P.y - 10, ['#ffffff', '#e4f4fc', '#9ccbe6'], 22, 260, 120, true, 0.5); FXK.light(P.x, P.y, 120, 0.8, '170,220,255', 0.4); FXK.punch(5, 0.02, 0.04); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; G.parts.push({ x: P.x + Math.cos(a) * 8, y: P.y - 6 + Math.sin(a) * 5, vx: Math.cos(a) * rand(130, 210), vy: Math.sin(a) * rand(80, 140), t: rand(0.25, 0.4), c: pick(['#e4f4fc', '#9ccbe6', '#ffffff']), g: 200 }); }
        for (const e of nearFoes(P.x, P.y, 70)) { damageEnemy(e, 0.5, { proc: true, ang: angTo(P, e), gauge: 1 }); applySt(e, 'slow', 2, 0.5); } } }
    } else if (k === 'chain') { // 세 바퀴를 돌며 마디가 점점 길게 벌어짐
      const ST = SWING_CH[2], tex = weaponTex('knight'), T0 = 0.14, T1 = 1.34;
      if (t < T0) setRel(P, lerp(-80, -200, t / T0));
      else if (t < T1) { const u = (t - T0) / (T1 - T0), ext = 0.3 + 0.7 * u, rev = Math.floor(u * 3);
        setRel(P, -200 + u * 1080); P.krsChain = true;
        P.t = ext <= 0.25 ? ST.wind * ext / 0.25 : ST.wind + ST.swing * 0.35 * (ext - 0.25) / 0.75; // 그리기(chainExt)가 이 길이로 벌어지게
        if (R.rev !== rev) { R.rev = rev; R.hit = new Set(); sfx('whoosh', 1.0 + rev * 0.15); FXK.punch(2 + rev, 0.01); }
        const reach = (tex.reach || 60) + ((ST.reach || 112) - (tex.reach || 60)) * ext + 12;
        for (const e of G.enemies) { if (e.dead || e.type === 'flag' || R.hit.has(e)) continue; if (arcIn(P, e, (R.pb == null ? P.blade : R.pb) - 0.45 * Math.sign(angDiff(P.blade, R.pb == null ? P.blade : R.pb) || 1), P.blade + 0.45 * Math.sign(angDiff(P.blade, R.pb == null ? P.blade : R.pb) || 1), reach)) { R.hit.add(e);
          damageEnemy(e, 0.7 + rev * 0.2, { ang: angTo(e, P), kb: big(e) ? 0 : 220, grogi: 6, heavy: rev === 2, gauge: 3 }); sparks(e.x, e.y - 12, angTo(e, P), '#cdd1d8', 8); FXK.ring(e.x, e.y - 10, '#e4e8f0', 160, 0.25, 4); } }
        R.pb = P.blade;
        if ((R.sw = (R.sw || 0) - dt) <= 0) { R.sw = 0.1; FXK.ring(P.x, P.y - 6, rev === 2 ? '#e4e8f0' : '#a2a6ae', 0, 0.1, reach - 8); }
        { const tx = P.x + Math.cos(P.blade) * reach, ty = P.y - 6 + Math.sin(P.blade) * reach * 0.8; for (let j = 0; j <= rev; j++) G.parts.push({ x: tx + rand(-4, 4), y: ty + rand(-4, 4), vx: -Math.sin(P.blade) * 160, vy: Math.cos(P.blade) * 110, t: 0.3, c: pick(['#ffffff', '#cdd1d8', '#ffe8b0']), g: 0, glow: true }); FXK.light(tx, ty, 60 + rev * 20, 0.6, '220,225,235', 0.06); }
        if (Math.random() < dt * 30) dust(P.x + rand(-reach, reach) * 0.6, P.y + rand(-6, 6), 1); }
      else { setRel(P, lerp(880, 1000, (t - T1) / 0.16)); if (!R.did.fin) { R.did.fin = true; FXK.ring(P.x, P.y - 4, '#e4e8f0', 300, 0.35, 10); FXK.burst(P.x, P.y - 8, ['#ffffff', '#cdd1d8'], 14, 240, 0, true, 0.3); sfx('heavy', 1.2); FXK.punch(5, 0.02, 0.04); } }
    } else if (k === 'bell') {
      if (t < 0.28) setRel(P, lerp(-80, -130, t / 0.28));
      else if (t < 0.36) { setRel(P, lerp(-130, 55, (t - 0.28) / 0.08)); P.krsFront = true; P.trail.push({ a: P.blade, t: 0.15 }); }
      else { setRel(P, 55); P.krsFront = true; }
      if (t >= 0.36 && !R.did.hit) { R.did.hit = true; const x = P.x + Math.cos(P.atkAng) * 40, y = P.y + Math.sin(P.atkAng) * 30 + 2;
        for (let n = 0; n < 3; n++) K.rings.push({ x, y, age: -n * 0.24, n, hit: new Set() });
        dust(x, y, 16); FXK.debris(x, y, 8); FXK.punch(6, 0.025, 0.05, P.atkAng); sfx('heavy', 0.7); }
    } else if (k === 'windmill') {
      P.atkAng = P.ang; P.krsFront = true; { const sp = Math.min(1, t / 0.35), E = 1 - Math.min(1, Math.max(0, (t - 1.75) / 0.25)); R.rot = (R.rot || -200) + (220 + 900 * sp * (0.4 + 0.6 * E)) * dt * (E > 0 ? 1 : 0.3); // 천천히 걸려 점점 빨라지고 끝에서 풀림
        P.sign = P.sign || P.face; setRel(P, R.rot); P.face = Math.cos(P.blade) >= 0 ? 1 : -1; P.trail.push({ a: P.blade, t: 0.2 });
        const rev = Math.floor((R.rot + 200) / 360); if (R.rev !== rev) { R.rev = rev; FXK.punch(2 + Math.min(4, rev), 0.008, 0); sfx('whoosh', 1.0 + Math.min(rev, 5) * 0.08); } }
      { const sp = 70, n = Math.max(1, Math.ceil(sp * dt / 3)); for (let i = 0; i < n; i++) { P.x += Math.cos(P.ang) * sp * dt / n; P.y += Math.sin(P.ang) * sp * dt / n; if (G.obs && G.obs.length) solveObs(P, P.r, false); } }
      if ((R.tk = (R.tk || 0) - dt) <= 0) { R.tk = 0.18; sfx('whoosh', 1.3); FXK.ring(P.x, P.y - 6, '#e4e8f0', 220, 0.22, 20); FXK.light(P.x, P.y, 90, 0.4, '220,230,255', 0.2); const tex = weaponTex('knight'), reach = (tex.reach || 60) + 6;
        for (const e of G.enemies) { if (e.dead || e.type === 'flag') continue; if (dist(P, e) < reach + e.r) damageEnemy(e, 0.45, { ang: angTo(P, e), kb: 260, grogi: 4, gauge: 2 }); } }
      if (G.eproj) for (const pr of G.eproj) { if (pr.t <= 0) continue; if (Math.hypot(pr.x - P.x, pr.y - P.y + 8) < 56) { pr.t = 0; sparks(pr.x, pr.y, Math.atan2(pr.y - P.y, pr.x - P.x), '#f0f2f6', 5); sfx('block', 1.3); } }
      for (let j = 0; j < 3; j++) { const a = rand(0, TAU), rr = rand(22, 44); G.parts.push({ x: P.x + Math.cos(a) * rr, y: P.y - 8 + Math.sin(a) * rr * 0.5, vx: -Math.sin(a) * 200 * P.face, vy: Math.cos(a) * 100 * P.face, t: 0.2, c: pick(['#ffffff', '#e4e8f0', '#b8c0d0']), g: 0 }); }
      if (Math.random() < dt * 20) dust(P.x + rand(-20, 20), P.y + 2, 2);
    } else if (k === 'fang') {
      P.blade = P.atkAng; P.krsFront = true;
      if (t < 0.32) { dashStep(P, 400, dt); G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0, t: 0.14, max: 0.14, tint: true });
        hitNear(P, P.r + 18, e => { damageEnemy(e, 1.1, { ang: P.atkAng, kb: 60, grogi: 8, gauge: 4 }); if (!(e.bleedT > 0)) gxSpurt(e, 10, P.atkAng); e.bleedT = 4; e.bleedN = 3; if (!(e.bleedTick > 0)) e.bleedTick = 0.5;
          for (let i = 0; i < 10; i++) G.parts.push({ x: e.x + rand(-4, 4), y: e.y - rand(6, 18), vx: Math.cos(P.atkAng) * rand(80, 220), vy: rand(-120, -20), t: 0.4, c: pick(['#efe6d2', '#b8ad96', '#d0302a', '#7a1010']), g: 360 });
          FXK.burst(e.x, e.y - 12, ['#ff5a40', '#d0302a', '#7a1010'], 10, 180, 300, false, 0.4); FXK.ring(e.x, e.y - 10, '#d0302a', 200, 0.3, 4); FXK.pop(e.x, e.y - 40, '출혈 ×3', '#ff7060', 1); FXK.punch(3, 0.015, 0.03, P.atkAng); }); }
      if (t < 0.32) G.fx.push({ kind: 'streak', px: true, x0: P.x - Math.cos(P.atkAng) * 30, y0: P.y - 8, x1: P.x, y1: P.y - 8, t: 0.12, max: 0.12, c: '#d0302a' });
    } else if (k === 'gate') {
      P.blade = P.atkAng; P.krsFront = true;
      if (!R.did.end) {
        const px = P.x, py = P.y; dashStep(P, 360, dt); const moved = Math.hypot(P.x - px, P.y - py);
        dust(P.x - Math.cos(P.atkAng) * 8, P.y + 2, 2); FXK.light(P.x, P.y, 60, 0.4, '255,230,190', 0.06);
        for (const dy of [-12, -4, 4]) G.fx.push({ kind: 'streak', px: true, x0: P.x - Math.cos(P.atkAng) * 50, y0: P.y - 8 + dy, x1: P.x - Math.cos(P.atkAng) * 14, y1: P.y - 8 + dy, t: 0.1, max: 0.1, c: dy === -4 ? '#f0e6d0' : '#a89c90' });
        if (R.c) { G.parts.push({ x: P.x + Math.cos(P.atkAng) * 16, y: P.y - rand(4, 16), vx: -Math.cos(P.atkAng) * rand(60, 140), vy: rand(-80, -20), t: 0.3, c: pick(['#8a5a30', '#c8a070', '#5a3a20']), g: 300 });
          for (const e of G.enemies) { if (e.dead || e.type === 'flag' || e === R.c || R.hit.has(e)) continue; if (dist(R.c, e) < R.c.r + e.r + 6) { R.hit.add(e); const side = angDiff(angTo(R.c, e), P.atkAng) > 0 ? 1 : -1; damageEnemy(e, 0.6, { ang: P.atkAng + side * 1.2, kb: 280, grogi: 6, gauge: 2, proc: true }); } } }
        if (!R.c) hitNear(P, P.r + 12, e => { damageEnemy(e, 1.0, { ang: P.atkAng, grogi: 10, heavy: true, gauge: 5 }); if (big(e)) R.wall = e; else R.c = e; });
        let wall = !!R.wall || (t > 0.05 && moved < 360 * dt * 0.35);
        if (R.c && !R.c.dead) { const c = R.c, d = P.r + c.r + 8, nx = P.x + Math.cos(P.atkAng) * d, ny = P.y + Math.sin(P.atkAng) * d * 0.8;
          if (wallAt(c.x, c.y, nx, ny)) wall = true; else { c.x = nx; c.y = ny; } c.vx = c.vy = 0; c.hitStun = Math.max(c.hitStun || 0, 0.2); }
        if (wall || t > 0.45) { R.did.end = true; gateImpact(P, R, wall); }
      }
    } else if (k === 'exec') {
      const T = R.tgt;
      if (!T) { // 대상이 없으면 제자리에서 내리친다
        if (t < 0.2) setRel(P, lerp(-80, -150, t / 0.2)); else if (t < 0.3) { setRel(P, lerp(-150, 50, (t - 0.2) / 0.1)); P.krsFront = true; P.trail.push({ a: P.blade, t: 0.15 }); if (!R.did.hit) { R.did.hit = true; hitCone(P, 90, 0.8, e => damageEnemy(e, 1.6, { heavy: true, grogi: 14, ang: P.atkAng, gauge: 5 })); sfx('heavy', 0.6); } } else { setRel(P, 50); P.krsFront = true; }
      } else {
        if (t >= 0.08 && !R.did.tp) { R.did.tp = true; const a = angTo(P, T), d = T.r + 18; P.x = T.x + Math.cos(a) * d; P.y = T.y + Math.sin(a) * d * 0.8; if (G.obs && G.obs.length) solveObs(P, P.r); P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r);
          P.atkAng = angTo(P, T); P.face = Math.cos(P.atkAng) > 0 ? 1 : -1; P.sign = P.face; R.hideW = false; smoke(P.x, P.y, 16); P.iframe = Math.max(P.iframe, 0.4); FXK.ring(P.x, P.y - 6, '#5a5056', 200, 0.3, 6); FXK.burst(P.x, P.y - 10, ['#3a3036', '#5a5056', '#d84020'], 18, 140, -60, false, 0.5); }
        // 무자비한 연타: 세 번 짧게 내리찍고(0.14 · 0.30 · 0.46) 마지막에 크게 들어 올려 처형 (0.76)
        const CH = [[0.14, 0.2, 0.25, 0.3], [0.30, 0.36, 0.41, 0.46], [0.46, 0.52, 0.57, 0.62], [0.62, 0.76, 0.82, 1.15]];
        if (t < 0.14) setRel(P, lerp(-80, -165, seg(t, 0.08, 0.14)));
        for (let i = 0; i < 4; i++) { const [a0, a1, a2, a3] = CH[i]; if (t < a0 || t >= a3) continue;
          const top = i === 3 ? -175 : -150;
          if (t < a1) setRel(P, lerp(i ? 55 : -165, top, (t - a0) / (a1 - a0)));
          else if (t < a2) { setRel(P, lerp(top, 60, (t - a1) / (a2 - a1))); P.krsFront = true; P.trail.push({ a: P.blade, t: i === 3 ? 0.22 : 0.14 }); }
          else { setRel(P, 60); P.krsFront = true; }
          if (i === 3 && t < a1) { const h = handPt(P), tx = h.x + Math.cos(P.blade) * 40, ty = h.y + Math.sin(P.blade) * 40; for (let j = 0; j < 3; j++) G.parts.push({ x: tx + rand(-8, 8), y: ty + rand(-8, 8), vx: rand(-30, 30), vy: rand(-80, -20), t: 0.35, c: pick(['#ff6a30', '#d84020', '#ffd0a0']), g: 0, glow: true }); FXK.light(tx, ty, 90, 0.8, '255,90,40', 0.06); }
          const hk = 'c' + i; if (t >= a2 - 0.02 && !R.did[hk]) { R.did[hk] = true;
            if (i < 3) { // 연타: 대상만 무겁게 · 재와 피가 튐 (처치 대상은 마지막 한 방까지 버팀)
              sfx('heavy', 0.7 + i * 0.08); FXK.punch(6 + i * 1.5, 0.02 + i * 0.006, 0.05, P.atkAng); FXK.flash('#3a0806', 0.06);
              if (!T.dead) { if (R.kill) T.hp = Math.max(T.hp, G.stats.atk * 2.2); damageEnemy(T, big(T) ? 1.1 : 0.7, { heavy: true, grogi: 8, ang: P.atkAng, gauge: 3 }); }
              FXK.ring(T.x, T.y - 8, i % 2 ? '#3a3036' : '#8a1e14', 200, 0.3, 4); FXK.burst(T.x, T.y - 12, ['#d84020', '#8a1e14', '#5a5056', '#d8d0c8'], 14, 220, 280, false, 0.4);
              for (let j = 0; j < 8; j++) G.parts.push({ x: T.x + rand(-8, 8), y: T.y - rand(0, 8), vx: rand(-40, 40), vy: rand(-180, -60), t: rand(0.5, 0.8), c: pick(['#8a8078', '#5a5056', '#3a3036']), g: -20 });
              FXK.light(T.x, T.y, 120, 0.8, '255,70,30', 0.2);
              K.cracks.push({ x: T.x - 14, y: T.y + 4, ang: rand(-0.4, 0.4), len: 30, t: 1.2, max: 1.2, seed: Math.random() * 99 }); }
            else {
              sfx('heavy', 0.5); sfx('blast', 0.5); FXK.punch(12, 0.05, 0.12, P.atkAng); FXK.flash('#ff2a10', 0.14);
          FXK.ring(T.x, T.y - 10, '#d84020', 320, 0.45, 8); FXK.ring(T.x, T.y - 10, '#3a3036', 220, 0.55, 4); FXK.ring(T.x, T.y - 10, '#ffd0a0', 160, 0.25, 2); FXK.rays(T.x, T.y - 10, 12, 120, '#d84020', 0.3, rand(0, 1));
          FXK.burst(T.x, T.y - 14, ['#ff6a30', '#d84020', '#ffd0a0'], 30, 300, 0, true, 0.45); FXK.light(T.x, T.y, 200, 1, '255,70,30', 0.6); (G.pfire = G.pfire || []).push({ x: T.x, y: T.y, t: 2.5, tick: 0 });
          for (let i = 0; i < 30; i++) G.parts.push({ x: T.x + rand(-12, 12), y: T.y - rand(0, 10), vx: rand(-50, 50), vy: rand(-260, -80), t: rand(0.6, 1.1), c: pick(['#8a8078', '#5a5056', '#d8d0c8', '#3a3036', '#ff6a30']), g: -30 });
          
          if (!T.dead) { if (R.kill) { T.hp = Math.min(T.hp, 1); damageEnemy(T, 2.0, { heavy: true, ang: P.atkAng, gauge: 8 }); } /* 피해 숫자가 터무니없이 크게 뜨지 않게 남은 체력을 1로 깎고 벰 */ else damageEnemy(T, 4.5, { heavy: true, grogi: 20, ang: P.atkAng, gauge: 8 }); }
          for (let i = 0; i < 18; i++) G.parts.push({ x: T.x + rand(-8, 8), y: T.y - rand(2, 24), vx: rand(-40, 40), vy: rand(-90, -30), t: rand(0.4, 0.8), c: pick(['#8a8078', '#5a5056', '#d8d0c8', '#3a3036']), g: -20 }); }
          } }
      }
    } else if (k === 'sunDash') {
      const q = seg(t, 0, 0.12); P.x = lerp(R.x0, R.tx, q); P.y = lerp(R.y0, R.ty, q); P.krsFront = true;
      if (q < 1) { G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0, t: 0.3, max: 0.3, tint: true }); P.krs.hideW = true; FXK.burst(P.x, P.y - 10, ['#fff6c0', '#e8b840'], 6, 80, 0, true, 0.35); FXK.light(P.x, P.y, 80, 0.8, '255,225,130', 0.08); }
      else { P.krs.hideW = false; P.atkAng = -Math.PI / 2; P.sign = P.face; setRel(P, lerp(110, -80, seg(t, 0.12, 0.3)));
        if (!R.did.boom) { R.did.boom = true; const S = starOut(); if (S) G.wproj.splice(G.wproj.indexOf(S), 1);
          sfx('blast', 1.1); sfx('awaken', 1.2); FXK.punch(12, 0.05, 0.12); FXK.flash('#fff0b0', 0.16);
          FXK.ring(R.tx, R.ty - 6, '#ffffff', 380, 0.35, 10); FXK.ring(R.tx, R.ty - 6, '#fff0b0', 300, 0.45, 8); FXK.ring(R.tx, R.ty - 6, '#e8b840', 200, 0.6, 4); FXK.ring(R.tx, R.ty - 6, '#ff9a40', 120, 0.7, 2);
          FXK.rays(R.tx, R.ty - 8, 16, 130, '#fff6c0', 0.35, 0); FXK.rays(R.tx, R.ty - 8, 8, 80, '#e8b840', 0.45, Math.PI / 8);
          G.fx.push({ kind: 'streak', px: true, x0: R.tx, y0: R.ty - 220, x1: R.tx, y1: R.ty, t: 0.45, max: 0.45, c: '#ffffff' });
          FXK.burst(R.tx, R.ty - 10, ['#fff6c0', '#e8b840', '#ffffff', '#ff9a40'], 44, 360, 0, true, 0.55); FXK.light(R.tx, R.ty, 260, 1, '255,225,130', 0.8); 
          for (let i = 0; i < 20; i++) G.parts.push({ x: R.tx + rand(-60, 60), y: R.ty - rand(40, 120), vx: rand(-10, 10), vy: rand(20, 50), t: rand(0.8, 1.4), c: pick(['#fff6c0', '#e8b840']), g: 0, glow: true });
          for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, s = i % 2 ? 140 : 260; G.parts.push({ x: R.tx, y: R.ty - 8, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7, t: 0.32, c: i % 2 ? '#e8b840' : '#fff6c0', g: 0, glow: true }); }
          for (const e of nearFoes(R.tx, R.ty, 90)) damageEnemy(e, 2.2, { heavy: true, grogi: 16, kb: 200, ang: Math.atan2(e.y - R.ty, e.x - R.tx), gauge: 6 }); } }
    } else if (k === 'bread' || k === 'sun') {
      setRel(P, lerp(-80, 30, t / R.dur)); P.krsFront = true;
    }
    if (t >= R.dur) end(P);
  }
  function gateImpact(P, R, wall) {
    const c = R.c, x = c && !c.dead ? c.x : P.x + Math.cos(P.atkAng) * 24, y = c && !c.dead ? c.y : P.y + Math.sin(P.atkAng) * 18;
    sfx(wall ? 'blast' : 'heavy', 0.8); dust(x, y, wall ? 22 : 10); addShake(wall ? 7 : 3, P.atkAng);
    if (wall) { FXK.ring(x, y - 4, '#e8dcc0', 300, 0.4, 8); FXK.ring(x, y - 4, '#8a7c70', 200, 0.5, 4); hitCrack(x + Math.cos(P.atkAng) * 12, y, 2, 60); FXK.debris(x, y, 18); FXK.debris(x, y, 14, ['#8a5a30', '#c8a070', '#5a3a20']); FXK.burst(x, y - 10, ['#ffffff', '#fff2d0'], 12, 260, 0, true, 0.25); FXK.light(x, y, 160, 1, '255,230,190', 0.35); FXK.punch(11, 0.04, 0.1, P.atkAng); 
      FXK.flash('#fff6e0', 0.07); FXK.rays(x, y - 6, 10, 90, '#f0e6d0', 0.25); FXK.ring(x, y - 4, '#ffffff', 420, 0.3, 12);
      for (const da of [Math.PI - 0.5, Math.PI, Math.PI + 0.5]) K.cracks.push({ x, y: y + 4, ang: P.atkAng + da, len: 56, t: 1.4, max: 1.4, seed: Math.random() * 99 }); }
    if (c && !c.dead) { damageEnemy(c, wall ? 1.8 : 1.0, { heavy: true, grogi: 14, kb: wall ? 0 : 220, ang: P.atkAng, gauge: 6, proc: true }); if (wall) applySt(c, 'stun', 1.2); }
    if (R.wall && !R.wall.dead && wall) applySt(R.wall, 'stun', 0.6);
    if (wall) for (const e of nearFoes(x, y, 72, c)) damageEnemy(e, 0.8, { kb: 200, ang: Math.atan2(e.y - y, e.x - x), grogi: 8, gauge: 2, proc: true });
  }
  function end(P) { P.state = 'idle'; P.krsFront = false; P.krsChain = false; P.lift = 0; P.krs = null; P.t = 0; }

  // ---------------------------------------------------------------- 던진 무기 (바게트 · 별의 서약 대검)
  function tickProj(dt) {
    if (!G.wproj || !G.wproj.length) return; const P = G.player;
    for (let i = G.wproj.length - 1; i >= 0; i--) { const w = G.wproj[i];
      if (w.k === 'krsBread') { const sp = 360 * dt, ox = w.x, oy = w.y; let ang = w.ang;
        if (!w.out) ang = Math.atan2(P.y - 8 - w.y, P.x - w.x); w.x += Math.cos(ang) * sp; w.y += Math.sin(ang) * sp * 0.8; w.d += sp; w.spin += dt * 16.3; w.va = ang; if (Math.random() < 0.6) G.parts.push({ x: w.x + rand(-6, 6), y: w.y + rand(-4, 4), vx: rand(-20, 20), vy: rand(-10, 20), t: 0.35, c: pick(['#c8843a', '#f0c878', '#fff0c8']), g: 120 }); FXK.light(w.x, w.y, 36, 0.3, '255,210,140', 0.017); /* v3.25 빛이 겹쳐 쌓여 빵이 하얗게 바래던 것 → 한 장면만 */
        if (w.out && (w.d > 220 || segSolid(ox, oy, w.x, w.y))) { w.out = false; w.hit = new Set(); if (segSolid(ox, oy, w.x, w.y)) { w.x = ox; w.y = oy; sparks(w.x, w.y, 0, '#e8c070', 4); } }
        for (const e of G.enemies) if (!e.dead && e.type !== 'flag' && !w.hit.has(e) && Math.hypot(e.x - w.x, e.y - 8 - w.y) < e.r + 12) { w.hit.add(e); damageEnemy(e, 0.9, { proc: true, ang, gauge: 3, grogi: 6 }); applySt(e, 'stun', 0.8); sfx('crunch', 1.2); FXK.ring(e.x, e.y - 12, '#f0c878', 180, 0.25, 4);
          for (let j = 0; j < 5; j++) G.parts.push({ x: w.x, y: w.y, vx: rand(-60, 60), vy: rand(-80, -20), t: 0.35, c: pick(['#c8843a', '#f0c878', '#8a5420']), g: 260 }); }
        if (!w.out && Math.hypot(P.x - w.x, P.y - 8 - w.y) < 14) G.wproj.splice(i, 1); else if (w.d > 900) G.wproj.splice(i, 1);
        continue; }
      if (w.k === 'krsStar') { w.t += dt;
        if (w.t < w.fly) { // 0~0.22 손에서 곧장 하늘로 · 0.22~0.5 하늘 (떨어질 자리에 예고) · 0.5~0.62 내리꽂힘
          if (w.t < 0.22) { const q = w.t / 0.22; w.ph = 'up'; w.x = w.x0; w.y = w.y0 - q * q * 260;
            for (let j = 0; j < 3; j++) G.parts.push({ x: w.x + rand(-5, 5), y: w.y + rand(0, 30), vx: rand(-15, 15), vy: rand(20, 80), t: rand(0.25, 0.5), c: pick(['#fff6c0', '#e8b840', '#ffffff']), g: 0, glow: true });
            G.fx.push({ kind: 'streak', px: true, x0: w.x, y0: w.y + 40, x1: w.x, y1: w.y, t: 0.12, max: 0.12, c: '#fff0b0' }); FXK.light(w.x, w.y, 80, 0.7, '255,220,120', 0.06); }
          else if (w.t < 0.5) { w.ph = 'sky'; w.x = w.tx; w.y = w.ty - 300;
            if (Math.random() < 0.6) G.parts.push({ x: w.tx + rand(-26, 26), y: w.ty - rand(60, 160), vx: 0, vy: rand(160, 260), t: 0.3, c: pick(['#fff6c0', '#e8b840']), g: 0, glow: true });
            FXK.light(w.tx, w.ty, 60 + (w.t - 0.22) * 200, 0.6, '255,225,130', 0.05); }
          else { const q = (w.t - 0.5) / 0.12, gy = w.ty + 14 - (weaponTex('knight').reach || 40); w.ph = 'down'; w.x = w.tx; w.y = gy - (1 - q) * 260;
            G.fx.push({ kind: 'streak', px: true, x0: w.x, y0: w.y - 90, x1: w.x, y1: w.y, t: 0.12, max: 0.12, c: '#ffffff' }); FXK.light(w.x, w.y, 110, 0.9, '255,230,150', 0.06); } }
        else { if (!w.land) { w.land = true; w.x = w.tx; w.y = w.ty + 14 - (weaponTex('knight').reach || 40); sfx('heavy', 1.2); sfx('bolt', 1.3); dust(w.tx, w.ty, 14); FXK.ring(w.tx, w.ty, '#fff0b0', 220, 0.35, 6); FXK.ring(w.tx, w.ty, '#e8b840', 150, 0.45, 3);
            G.fx.push({ kind: 'streak', px: true, x0: w.tx, y0: w.ty - 170, x1: w.tx, y1: w.ty, t: 0.35, max: 0.35, c: '#fff6c0' }); G.fx.push({ kind: 'streak', px: true, x0: w.tx - 4, y0: w.ty - 120, x1: w.tx - 4, y1: w.ty, t: 0.28, max: 0.28, c: '#e8b840' }); G.fx.push({ kind: 'streak', px: true, x0: w.tx + 4, y0: w.ty - 120, x1: w.tx + 4, y1: w.ty, t: 0.28, max: 0.28, c: '#e8b840' });
            FXK.rays(w.tx, w.ty - 4, 8, 60, '#fff0b0', 0.25); FXK.burst(w.tx, w.ty - 8, ['#fff6c0', '#e8b840', '#ffffff'], 24, 220, 0, true, 0.4); FXK.light(w.tx, w.ty, 150, 1, '255,225,130', 0.5); FXK.punch(6, 0.025, 0.05); FXK.flash('#fff0c0', 0.06);
            for (const e of nearFoes(w.tx, w.ty, 52)) damageEnemy(e, 1.2, { heavy: true, proc: true, ang: Math.atan2(e.y - w.ty, e.x - w.tx), kb: 160, grogi: 10, gauge: 3 }); FXK.debris(w.tx, w.ty, 10, ['#6e6058', '#e8b840', '#8a7c70']); }
          for (let j = 0; j < 2; j++) G.parts.push({ x: w.tx + rand(-14, 14), y: w.ty - rand(0, 6), vx: rand(-6, 6), vy: rand(-70, -30), t: rand(0.4, 0.8), c: pick(['#fff6c0', '#e8b840', '#ffffff']), g: 0, glow: true });
          FXK.light(w.tx, w.ty - 10, 90 + Math.sin(time * 10) * 15, 0.7, '255,220,120', 0.05);
          if (w.t > w.fly + w.life) { G.wproj.splice(i, 1); sparks(P.x, P.y - 10, -Math.PI / 2, '#fff0b0', 6); sfx('blip', 1.4); } }
        continue; }
    }
  }

  // ---------------------------------------------------------------- 그리기
  function drawGround() {
    if (!G) return;
    // 얼음 장판: 넓은 빙판 — 반사광 줄 · 금 · 반짝임, 녹을수록 디더로 성겨짐 (2px 칸)
    if (K.ice.length) { const seen = new Set();
      for (const f of K.ice) { const a = Math.min(1, f.t / 1.2), rx = 24, ry = 13;
        for (let yy = Math.round(f.y - ry) & ~1; yy <= f.y + ry; yy += 2) for (let xx = Math.round(f.x - rx) & ~1; xx <= f.x + rx; xx += 2) {
          const key = xx * 8192 + yy; if (seen.has(key)) continue;
          const h = GX.hr(xx * 0.71 + yy * 1.37), q = Math.hypot((xx - f.x) / rx, (yy - f.y) / ry); if (q >= 1 - h * 0.22) continue;
          if (a < 1 && h > a) continue; seen.add(key);
          const edge = q > 0.8 - h * 0.2, streak = ((xx - yy * 2) >> 1) % 11 === 0, crack = ((xx + yy * 3 + 7) >> 1) % 17 === 0 && h > 0.4;
          ctx.fillStyle = crack ? '#5a88a8' : edge ? '#7aaccc' : streak ? '#f4fbff' : h > 0.7 ? '#cfe8f6' : '#a8d4ec'; ctx.fillRect(xx, yy, 2, 2);
          if (h > 0.985 && Math.floor(time * 6 + xx) % 4 === 0) { ctx.fillStyle = '#ffffff'; ctx.fillRect(xx - 2, yy, 6, 2); ctx.fillRect(xx, yy - 2, 2, 6); } } } }
    // 정육 내려치기 균열: 칸 단위 지그재그 선
    for (const c of K.cracks) { const L = Math.min(c.len, (1 - (c.t - (c.max - 0.12)) / 0.12) * c.len), ux = Math.cos(c.ang), uy = Math.sin(c.ang) * 0.7;
      ctx.fillStyle = '#0e0a0c'; const fade = c.t < 0.5;
      for (let d = 0; d < L; d += 2) { const w = Math.sin(d * 0.35 + c.seed) * 3, x = snap2(c.x + ux * d - uy * w), y = snap2(c.y + uy * d + ux * w * 0.5); if (fade && ((x + y) >> 1) % 2) continue; const th = d < L * 0.7 ? 4 : 2; ctx.fillStyle = '#0e0a0c'; ctx.fillRect(x, y, 2, th); ctx.fillStyle = '#5a4e48'; ctx.fillRect(x, y - 2, 2, 2); ctx.fillStyle = '#0e0a0c';
        if ((d >> 1) % 9 === 4) for (let b = 2; b < 12; b += 2) ctx.fillRect(snap2(x + uy * b * ((d >> 1) % 2 ? 1 : -1) + ux * b * 0.5), snap2(y - ux * b * 0.5 * ((d >> 1) % 2 ? 1 : -1)), 2, 2); } }
  }
  function plantDraw(tex, x, y, groundY) { // 칼끝이 땅에 박힌 모습: 땅선 아래는 그리지 않음
    const r = rotW(tex, Math.PI / 2, 1); ctx.save(); ctx.beginPath(); ctx.rect(snap2(x) - 200, snap2(y) - 300, 400, snap2(groundY) + 2 - (snap2(y) - 300)); ctx.clip(); ctx.drawImage(r.c, snap2(x) - r.o + 1, snap2(y) - r.o + 1); ctx.restore(); }
  let SEL = null;
  // v3.25 바게트 부메랑 회전: 바닥과 나란히 납작하게 도는 12장 (가로 = 길게 · 화면 안쪽 = 원근으로 짧게 · 그림자는 늘 아래 · 빛은 늘 왼쪽 위) — 시안 _시안/바게트_부메랑_회전_시안01.html B안
  const BREAD_F = [[".....................................",".....................................",".....................................",".....................................",".....................................",".....................................",".....................................","...bybbWbbybbWbbybbWbbybbWbbybbbbb...","..bbbybbbbbybbbbbybbbbbybbbbbybbbbb..",".bbbbbybbbbbybbbbbybbbbbybbbbbybbbbb.",".bbbbbddbbbbddbbbbddbbbbddbbbbddbbbb.",".bbbbbbddbbbbddbbbbddbbbbddbbbbddbbb.","..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB...",".....................................",".....................................",".....................................",".....................................",".....................................",".....................................","....................................."],[".....................................",".....................................",".....................................",".....bby.............................","....bbbybbb..........................","....bbbybbWbybb......................","....bbbbybbbybbWby...................","...BBbbbdbbbbybbbybbW................","....BBBBbdbbbybbbbybWbyb.............","....BBBBBBBbbbbbbbybbbbybWb..........",".......BBBBBBBdbbbdbbbbybbbbbb.......","..........BBBBBBBbbdbbbybbbbybbbb....",".............BBBBBBBbbbbdbbbybbbb....","................BBBBBBBbdbbbbybbbb...","...................BBBBBBBBbbdbbb....","......................BBBBBBBBbbb....","..........................BBBBBBB....",".............................BBB.....",".....................................",".....................................","....................................."],[".....................................","...........bby.......................","..........bbbyb......................",".........bbbbbbb.....................",".........Bbbbbbby....................","........BBBbdbbbyb...................",".........BBBdbbbbbby.................","..........BBBbbbbbbyb................","...........BBBbdbbbybW...............","............BBBdbbbbbby..............",".............BBBBbdbbbyb.............","..............BBBBdbbbybW............","...............BBBBbbbbbby...........","................BBBBbdbbbyb..........",".................BBBBdbbbybb.........","...................BBBbbbbbbb........","....................BBBbdbbb.........",".....................BBBdbbb.........","......................BBBbb..........",".......................BBB...........","....................................."],[".....................................","................bbbbB................","...............bbbbbBB...............","...............byybbBB...............","...............WbbddBB...............","...............bbbbbBB...............","...............bybbbBB...............","...............bbbdbBB...............","...............bbbbbBB...............","...............ybbbbBB...............","...............bbydbBB...............","...............bbbbdBB...............","...............ybbbbBB...............","...............bbybbBB...............","...............WbbbdBB...............","...............bbbbbBB...............","...............bybbbBB...............","...............WbbdbBB...............","...............bbbbbBB...............","................bbbbB................","....................................."],[".....................................",".......................ybb...........","......................bybbb..........",".....................bbbbbbb.........","....................ybbbbbbB.........","...................bybbbdbBBB........",".................ybbbbbbdBBB.........","................bybbbbbbBBB..........","...............WbybbbdbBBB...........","..............ybbbbbbdBBB............",".............bybbbdbBBBB.............","............WbybbbdBBBB..............","...........ybbbbbbBBBB...............","..........bybbbdbBBBB................",".........bbybbbdBBBB.................","........bbbbbbbBBB...................",".........bbbdbBBB....................",".........bbbdBBB.....................","..........bbBBB......................","...........BBB.......................","....................................."],[".....................................",".....................................",".....................................",".............................ybb.....","..........................bbbybbb....","......................bbybWbbybbb....","...................ybWbbybbbybbbb....","................WbbybbbybbbbdbbbBB...",".............bybWbybbbbybbbdbBBBB....","..........bWbybbbbybbbbbbbBBBBBBB....",".......bbbbbbybbbbdbbbdBBBBBBB.......","....bbbbybbbbybbbdbbBBBBBBB..........","....bbbbybbbdbbbbBBBBBBB.............","...bbbbybbbbdbBBBBBBB................","....bbbdbbBBBBBBBB...................","....bbbBBBBBBBB......................","....BBBBBBB..........................",".....BBB.............................",".....................................",".....................................","....................................."],[".....................................",".....................................",".....................................",".....................................",".....................................",".....................................",".....................................","...bbbbbybbWbbybbWbbybbWbbybbWbbyb...","..bbbbbybbbbbybbbbbybbbbbybbbbbybbb..",".bbbbbybbbbbybbbbbybbbbbybbbbbybbbbb.",".bbbbddbbbbddbbbbddbbbbddbbbbddbbbbb.",".bbbddbbbbddbbbbddbbbbddbbbbddbbbbbb.","..BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB..","...BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB...",".....................................",".....................................",".....................................",".....................................",".....................................",".....................................","....................................."],[".....................................",".....................................",".....................................",".....bbb.............................","....bbbbbbb..........................","....bbbbbyybbWb......................","....bbbbybbbbbbyyb...................","...BBbddbbbbbbybbWWbb................","....BBBBbbbbdybbbbbbyybb.............","....BBBBBBBdbbbbbbyybbbbbby..........",".......BBBBBBBbbbddbbbbbbybbWW.......","..........BBBBBBBbbbbbbyybbbbbbyb....",".............BBBBBBBbbdbbbbbbyybb....","................BBBBBBBbbbbbdbbbbb...","...................BBBBBBBddbbbbb....","......................BBBBBBBBbbb....","..........................BBBBBBB....",".............................BBB.....",".....................................",".....................................","....................................."],[".....................................","...........bbb.......................","..........bbbbb......................",".........bbbbbby.....................",".........Bbdyybbb....................","........BBBbbbbbbb...................",".........BBBbbbbbyyy.................","..........BBBdddbbbbW................","...........BBBbbbbbbbb...............","............BBBbbbbbyyb..............",".............BBBdddbbbWW.............","..............BBBBbbbbbbb............","...............BBBBbbbyyyb...........","................BBBBdbbbbWW..........",".................BBBBbbbbbbb.........","...................BBBbbyyybb........","....................BBBbbbbb.........",".....................BBBbbbb.........","......................BBBbb..........",".......................BBB...........","....................................."],[".....................................","................bbbbB................","...............bbbbbBB...............","...............WbbdbBB...............","...............bybbbBB...............","...............bbbbbBB...............","...............WbbbdBB...............","...............bbybbBB...............","...............ybbbbBB...............","...............bbbbdBB...............","...............bbydbBB...............","...............ybbbbBB...............","...............bbbbbBB...............","...............bbbdbBB...............","...............bybbbBB...............","...............bbbbbBB...............","...............WbbddBB...............","...............byybbBB...............","...............bbbbbBB...............","................bbbbB................","....................................."],[".....................................",".......................bbb...........","......................bbbbb..........",".....................ybbbbbb.........","....................bbbyydbB.........","...................bbbbbbbBBB........",".................yyybbbbbBBB.........","................WbbbbdddBBB..........","...............bbbbbbbbBBB...........","..............byybbbbbBBB............",".............WWbbbdddBBB.............","............bbbbbbbBBBB..............","...........byyybbbBBBB...............","..........WWbbbbdBBBB................",".........bbbbbbbBBBB.................","........bbyyybbBBB...................",".........bbbbbBBB....................",".........bbbbBBB.....................","..........bbBBB......................","...........BBB.......................","....................................."],[".....................................",".....................................",".....................................",".............................bbb.....","..........................bbbbbbb....","......................bWbbyybbbbb....","...................byybbbbbbybbbb....","................bbWWbbybbbbbbddbBB...",".............bbyybbbbbbydbbbbBBBB....","..........ybbbbbbyybbbbbbdBBBBBBB....",".......WWbbybbbbbbddbbbBBBBBBB.......","....bybbbbbbyybbbbbbBBBBBBB..........","....bbyybbbbbbdbbBBBBBBB.............","...bbbbbdbbbbbBBBBBBB................","....bbbbbddBBBBBBB...................","....bbbBBBBBBBB......................","....BBBBBBB..........................",".....BBB.............................",".....................................",".....................................","....................................."]], BREAD_PAL = {"b": "#c8843a", "B": "#8a5420", "y": "#f0c878", "W": "#fff6e0", "d": "#6a3a14"}, BREAD_C = [18, 10];
  let BREAD = null;
  function breadSpin() { if (BREAD) return BREAD; const mk = (rows, ghost) => { const h = rows.length, w = rows[0].length, [c, g] = mkCanvas(w * 2, h * 2), on = (x, y) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] !== '.';
      for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) { if (ghost && ((x + y) & 1)) continue; const ch = on(x, y) ? rows[y][x] : [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => on(x + dx, y + dy)) ? 'k' : null; if (!ch) continue; g.fillStyle = ch === 'k' ? '#0b0a0e' : BREAD_PAL[ch]; g.fillRect(x * 2, y * 2, 2, 2); }
      return c; };
    BREAD = { f: BREAD_F.map(r => mk(r, false)), g: BREAD_F.map(r => mk(r, true)), cx: BREAD_C[0], cy: BREAD_C[1] }; return BREAD; }
  function drawProjs() {
    if (!G || !G.wproj) return;
    for (const w of G.wproj) { if (w !== SEL) continue;
      if (w.k === 'krsBread') { const B = breadSpin(), n = B.f.length, fi = ((Math.floor(w.spin / TAU * n) % n) + n) % n, X = snap2(w.x) - B.cx * 2, Y = snap2(w.y) - B.cy * 2, va = w.va == null ? w.ang : w.va; // v3.25 따로 그린 12장 · 가운데 축 + 바로 앞 장면 디더 잔상
        ctx.drawImage(B.g[(fi + n - 1) % n], X - snap2(Math.cos(va) * 6), Y - snap2(Math.sin(va) * 5)); ctx.drawImage(B.f[fi], X, Y); }
      if (w.k === 'krsStar') { const tex = weaponTex('knight');
        if (!w.land) {
          if (w.ph === 'sky' || w.ph === 'down') { // 떨어질 자리 예고: 좁아지는 금빛 원 + 십자
            const k = clamp((w.t - 0.22) / 0.4, 0, 1), rr = Math.round(40 - k * 26), n = Math.max(16, rr * 3); ctx.fillStyle = Math.floor(time / 0.08) % 2 ? '#fff0b0' : '#e8b840';
            for (let i = 0; i < n; i++) { if (i % 4 === 3) continue; const a = i / n * TAU; ctx.fillRect(snap2(w.tx + Math.cos(a) * rr), snap2(w.ty + Math.sin(a) * rr * 0.5), 2, 2); }
            for (let d = -8; d <= 8; d += 2) { ctx.fillRect(snap2(w.tx + d), snap2(w.ty), 2, 2); ctx.fillRect(snap2(w.tx), snap2(w.ty + d / 2), 2, 2); } }
          if (w.ph === 'up') { const r = rotW(tex, -Math.PI / 2, 1); ctx.drawImage(r.c, snap2(w.x) - r.o + 1, snap2(w.y) - r.o + 1); }
          if (w.ph === 'down') plantDraw(tex, w.x, w.y, w.ty);
          continue; }
        // 꽂힌 대검 + 바닥의 여덟 갈래 별 (깜빡임)
        const p = Math.floor(time / 0.15) % 2; ctx.fillStyle = p ? '#fff6c0' : '#e8b840';
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + time * 0.8, L = (i % 2 ? 14 : 24) + p * 2; for (let d = 6; d < L; d += 2) { ctx.fillStyle = d > L - 4 ? '#ffffff' : (i % 2 ? '#e8b840' : '#fff6c0'); ctx.fillRect(snap2(w.tx + Math.cos(a) * d), snap2(w.ty + Math.sin(a) * d * 0.5), 2, 2); } }
        { const n = 40; ctx.fillStyle = p ? '#e8b840' : '#fff0b0'; for (let i = 0; i < n; i++) { if (i % 3 === 0) continue; const a = i / n * TAU; ctx.fillRect(snap2(w.tx + Math.cos(a) * 30), snap2(w.ty + Math.sin(a) * 15), 2, 2); } }
        // 박힌 자리: 갈라진 흙 테 + 튀어 오른 흙덩이
        ctx.fillStyle = '#0e0a0c'; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, rr = 8 + (i % 3) * 2; ctx.fillRect(snap2(w.tx + Math.cos(a) * rr), snap2(w.ty + Math.sin(a) * rr * 0.5), 2, 2); }
        for (const [dx, dy, c] of [[-10, 0, '#5a4e48'], [10, -2, '#5a4e48'], [-6, 4, '#3a3036'], [8, 4, '#3a3036'], [0, -4, '#6e6058']]) { ctx.fillStyle = c; ctx.fillRect(snap2(w.tx + dx), snap2(w.ty + dy), 4, 2); }
        plantDraw(tex, w.x, w.y, w.ty); }
    }
  }

  // ---------------------------------------------------------------- 새 고유 효과 (성문 빗장 · 별의 서약 대검)
  const _woh = weaponOnHit;
  weaponOnHit = function (e, o, crit) { _woh(e, o, crit);
    const P = G.player; if (G.cls !== 'knight' || !o || !o.basic || P.state !== 'attack' || P.combo !== 2 || e.dead) return;
    if (wSkill() === 'gate') { const a = o.ang == null ? P.atkAng : o.ang; e.vx += Math.cos(a) * 380 * (e.kbRes == null ? 1 : e.kbRes); e.vy += Math.sin(a) * 380 * (e.kbRes == null ? 1 : e.kbRes);
      const tx = e.x + Math.cos(a) * 48, ty = e.y + Math.sin(a) * 36; if (wallAt(e.x, e.y, tx, ty)) { applySt(e, 'stun', 0.6); dust(e.x, e.y, 8); sfx('crunch', 0.7); } }
  };
  const _wse = weaponSwingEnd;
  weaponSwingEnd = function () { _wse();
    const P = G.player; if (G.cls !== 'knight' || wSkill() !== 'sun') return;
    G.proj.push({ x: P.x + Math.cos(P.atkAng) * 16, y: P.y - 9 + Math.sin(P.atkAng) * 16, ang: P.atkAng, sp: 420, t: 0.38, hit: new Set(), r: 18, hist: [] }); sfx('whoosh', 1.4);
  };
  // 손이 비어 있으면 기본 공격도 하지 않는다 (바게트 · 대검을 던진 동안)
  const _sa = startAttack;
  startAttack = function (i) { const P = G.player; if (G.cls === 'knight' && P.krsHideW) return; return _sa(i); };
  const _gl = gearLights; gearLights = function (lights) { _gl(lights); for (const l of K.lights) lights.push({ x: l.x, y: l.y, r: l.r, a: l.a * Math.min(1, l.t / (l.max * 0.6)), c: l.c, ca: 0.25 }); if (K.mk && K.mk.t === time) lights.push({ x: K.mk.x, y: K.mk.y, r: 26, a: 0.95, c: K.mk.c, ca: 0.12 }); }; // 처형 표식이 어둠에 묻히지 않게
  // 바닥 효과 · 던진 무기 그리기
  const _dgg = drawGearGround; drawGearGround = function () { _dgg(); ctx.save(); drawGround(); ctx.restore(); };
  // v3.25 처형 표식: 우클릭이 준비된 동안 지금 누르면 처형할 대상의 머리 위에 붉은 표식 (처치 대상 = 붉은색 · 큰 피해 대상 = 주황색)
  SKD.add(ents => { if (!G || G.cls !== 'knight' || wSkill() !== 'exec') return; const P = G.player; if (!P || P.dead || P.state === 'krs' || !P.chargeCd || !P.chargeCd.some(c => c <= 0)) return;
    const pk = execPick(P), T = pk.T; if (!T) return; const col = pk.kill ? ['#ff3a20', '#a8160e', '#ffb090'] : ['#ffa040', '#a85a18', '#ffe0a0'];
    ents.push({ y: T.y + 0.5, d: () => { const X = snap2(T.x), Y = snap2(T.y - enemyH(T) - 18 + (Math.floor(time * 4) % 2) * 2), R = [[-8, 16], [-6, 12], [-4, 8], [-2, 4]]; K.mk = { x: X, y: Y + 4, c: pk.kill ? '255,70,40' : '255,150,60', t: time };
      ctx.fillStyle = '#0b0a0e'; ctx.fillRect(X - 10, Y - 2, 20, 2); R.forEach(([x0, w], j) => ctx.fillRect(X + x0 - 2, Y + j * 2, w + 4, 2)); ctx.fillRect(X - 2, Y + 8, 4, 2); // 검은 외곽선 1칸
      R.forEach(([x0, w], j) => { ctx.fillStyle = j === 0 ? col[2] : j < 3 ? col[0] : col[1]; ctx.fillRect(X + x0, Y + j * 2, w, 2); }); } }); });
  SKD.add(ents => { if (!G || !G.wproj) return; for (const w of G.wproj) { if (w.k === 'krsBread') ents.push({ y: w.y + 12, d: SKD.one(drawProjs, v => SEL = v, w) }); else if (w.k === 'krsStar') ents.push({ y: w.ph === 'up' ? w.y0 + 12 : w.ty, d: SKD.one(drawProjs, v => SEL = v, w) }); } });
  // 무기 툴팁에 우클릭 기술 줄
  const _ie = itemExtra;
  itemExtra = function (it, cls) { const base = _ie(it, cls); if (!it || it.wk == null || (it.cls || 'knight') !== 'knight') return base;
    const sk = (wcat('knight')[it.wk] || {}).sk, D = DEF[sk]; if (!D) return base;
    return base + `<div class="fx">우클릭 「${D.n}」 · 쿨타임 ${D.cd}초 — ${D.d}</div>`; };

  return SKD.wrapAll({ start, second, update, tick, tickProj, cdBase, def, DEF, FXK });
})();
function skCdBase() { const D = (typeof ARS !== 'undefined' && ARS.def()) || (typeof GRS !== 'undefined' && GRS.def()) || (typeof MRS !== 'undefined' && MRS.def()) || (typeof PRS !== 'undefined' && PRS.def()); return D ? D.cd : KRS.cdBase(); }
