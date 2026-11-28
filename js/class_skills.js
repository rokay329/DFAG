'use strict';
// 잿빛 왕관 원정대 · class_skills.js — 합친 파일: 41_krs.js, 42_ars.js, 43_grs.js, 44_mrs.js, 45_prs.js, 46_icons.js, 47_awk.js (v3.84 파일 정리 · typeof로 먼저 확인하는 이름 몇 개는 var로 선언)

// ==================================================================== 41_krs.js
'use strict';
// ==================================================================================================
// 잿빛 왕관 원정대 — 41_krs.js : v3.21 기사 무기별 우클릭 기술 (시안 _시안/기사_우클릭기술_시안01.html)
//  · 레어 · 유니크 · 레전더리 기사 무기는 무기마다 고유한 우클릭 기술을 씀 (커먼 · 초록 무기는 기본 「돌진 참격」)
//  · 우클릭 쿨타임은 무기마다 따로 돎 (장착하지 않은 무기의 쿨타임도 계속 줄어듦)
//  · 철퇴(옛 성문 빗장) · 별의 서약 대검: 돌진 참격을 바꾸던 고유 효과를 우클릭 기술로 옮기고 새 고유 효과(무거운 빗장 · 별빛 검기)를 붙임
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
  // 무기 동작 (암살자 쌍검 · 세리안 지팡이): 기술 코드가 무기를 가만히 두는 동안 공용으로 움직임
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
    gate: { n: '단죄', cd: 9, d: '무기를 앞세워 순식간에 돌진하며 처음 부딪힌 적을 벽까지 밀고 갑니다. 벽에 부딪히면 충격파가 일어나 주변 적에게 피해를 주고, 밀린 적을 기절시킵니다.' },
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
    if (G.cls === 'knight' || G.cls === 'ranger' || G.cls === 'gunner' || G.cls === 'mage' || G.cls === 'priest') { // v3.22 암살자도 무기마다 따로
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
    P.krs.dur = { cleaver: 0.78, tuna: 0.62, chain: 1.5, bell: 0.95, windmill: 2.0, fang: 0.48, gate: 0.57 }[k] || 0.6;
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
        const px = P.x, py = P.y; dashStep(P, 540, dt); /* v3.40 단죄: 360 → 540, 0.45초 → 0.3초 (거리 그대로) */ const moved = Math.hypot(P.x - px, P.y - py);
        dust(P.x - Math.cos(P.atkAng) * 8, P.y + 2, 2);
        G.fx.push({ kind: 'jtrail', x0: px, y0: py, x1: P.x, y1: P.y, t: 0.35, max: 0.35, zY: Math.min(py, P.y) - 40 }); // v3.40 빛줄기 대신 검은 궤적 (67_judge.js)
        if (R.c) { G.parts.push({ x: P.x + Math.cos(P.atkAng) * 16, y: P.y - rand(4, 16), vx: -Math.cos(P.atkAng) * rand(60, 140), vy: rand(-80, -20), t: 0.3, c: pick(['#8a5a30', '#c8a070', '#5a3a20']), g: 300 });
          for (const e of G.enemies) { if (e.dead || e.type === 'flag' || e === R.c || R.hit.has(e)) continue; if (dist(R.c, e) < R.c.r + e.r + 6) { R.hit.add(e); const side = angDiff(angTo(R.c, e), P.atkAng) > 0 ? 1 : -1; damageEnemy(e, 0.6, { ang: P.atkAng + side * 1.2, kb: 280, grogi: 6, gauge: 2, proc: true }); } } }
        if (!R.c) hitNear(P, P.r + 12, e => { damageEnemy(e, 1.0, { ang: P.atkAng, grogi: 10, heavy: true, gauge: 5 }); if (big(e)) R.wall = e; else R.c = e; });
        let wall = !!R.wall || (t > 0.05 && moved < 540 * dt * 0.35);
        if (R.c && !R.c.dead) { const c = R.c, d = P.r + c.r + 8, nx = P.x + Math.cos(P.atkAng) * d, ny = P.y + Math.sin(P.atkAng) * d * 0.8;
          if (wallAt(c.x, c.y, nx, ny)) wall = true; else { c.x = nx; c.y = ny; } c.vx = c.vy = 0; c.hitStun = Math.max(c.hitStun || 0, 0.2); }
        if (wall || t > 0.42) { R.did.end = true; /* v3.43 돌진 거리 약 160 → 약 230 */ gateImpact(P, R, wall); }
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
    if (wall) { FXK.ring(x, y - 4, '#e8dcc0', 300, 0.4, 8); FXK.ring(x, y - 4, '#8a7c70', 200, 0.5, 4); hitCrack(x + Math.cos(P.atkAng) * 12, y, 2, 60); FXK.debris(x, y, 18); FXK.debris(x, y, 14, ['#8a5a30', '#c8a070', '#5a3a20']); FXK.burst(x, y - 10, ['#ffffff', '#fff2d0'], 12, 260, 0, true, 0.25); FXK.light(x, y, 160, 1, '255,230,190', 0.35); FXK.punch(11, 0.04, 0.1, P.atkAng); if (typeof skShake === 'function') skShake(11, P.atkAng); /* v3.40 벽 · 장애물에 부딪히면 실제 화면 흔들림 */ 
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

  // ---------------------------------------------------------------- 새 고유 효과 (철퇴 · 별의 서약 대검)
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
;

// ==================================================================== 42_ars.js
'use strict';
// ==================================================================================================
// 잿빛 왕관 원정대 — 42_ars.js : v3.22 암살자 무기별 우클릭 기술 (41_krs.js 기사와 같은 방식)
//  · 레어 · 유니크 · 레전더리 암살자 무기는 무기마다 고유한 우클릭 기술을 씀 (커먼 · 초록 무기는 기본 「그림자 도약」)
//  · 쿨타임은 무기마다 따로 돎 (41_krs.js KRS.tick이 함께 관리)
//  · 그림자 사슬낫: 우클릭 「그림자 사슬」로 옮기고 새 고유 효과(3타 사슬 휘두르기)를 붙임
//  · 쌍둥이 송곳니: 「그림자 도약」을 쓰던 고유 효과를 우클릭 기술 기준으로 바꿈
//  · 연출은 모두 2px 칸 · 도트 선 · 도트 고리 (KRS.FXK 도우미 공유)
// ==================================================================================================
var ARS = (() => {
  const DEF = {
    claw: { n: '냥냥 난타', cd: 7, d: '앞으로 뛰어들며 발톱으로 쉴 새 없이 할퀸 뒤, 마지막에 크게 세 줄로 찢습니다. 마지막 공격은 출혈을 2중첩 부여합니다.' },
    mackerel: { n: '찰싹 연타', cd: 7, d: '고등어로 네 번 연달아 후려칩니다. 칠수록 점점 세게 밀쳐내고, 마지막 한 방은 적을 멀리 날려 보내며 생선 뼈를 흩뿌립니다.' },
    sickle: { n: '사신의 원무', cd: 8, d: '쌍낫을 던져 2초 동안 몸 주위를 빙글빙글 돌게 합니다. 낫은 점점 넓게 돌며 닿는 적을 계속 베고, 끝나면 손으로 돌아옵니다.' },
    fan: { n: '회오리 부채', cd: 8, d: '부채를 크게 휘둘러 앞으로 나아가는 회오리를 일으킵니다. 회오리는 적을 빨아들이며 계속 피해를 주고 투사체를 지우며, 끝날 때 터져 적을 밀쳐냅니다.' },
    needle: { n: '바느질', cd: 9, d: '앞쪽의 적을 최대 5명까지 차례로 꿰뚫으며 순간 이동합니다. 마지막에 실을 당겨 꿰인 적을 한곳으로 모으고 1.2초 동안 묶습니다.' },
    kusari: { n: '그림자 사슬', cd: 8, d: '사슬낫을 길게 던져 일직선 위의 적을 최대 4명까지 한 번에 꿰어 겁니다. 작은 적은 모두 끌어오고, 큰 적이 걸리면 내가 그쪽으로 끌려갑니다. 도착하면 사슬낫을 크게 휘둘러 주변을 벱니다.' },
    yarn: { n: '털실 그물', cd: 9, d: '털실 공을 던져 떨어진 자리에 3초 동안 털실 그물을 펼칩니다. 그물 안의 적은 묶였다가 크게 느려지고, 그물이 끊어질 때 피해를 받습니다.' },
    moons: { n: '월식', cd: 9, d: '은달과 흑달을 양쪽으로 던집니다. 두 달이 조준한 지점에서 겹치면 1초 동안 검은 달이 떠 주변 적을 빨아들이며 피해를 주고, 마지막에 폭발합니다.' },
    fangs2: { n: '박쥐 떼', cd: 10, d: '박쥐 떼로 흩어져 조준한 방향으로 날아가며 지나가는 적을 물어 출혈을 일으킵니다. 다시 모이며 핏빛 X자로 베고, 이 공격은 반드시 치명타가 됩니다.' },
    nine: { n: '아홉 생', cd: 12, d: '주변의 적 사이를 아홉 번 순간 이동하며 벱니다. 벤 자리에 남은 혼불 아홉 개가 모여들어 크게 폭발합니다.' },
  };
  for (const k in DEF) SK_META[k] = Object.assign(SK_META[k] || {}, { K: DEF[k].n, KD: DEF[k].d });
  const K = { g: null, slashes: [], threads: [], webs: [], bats: [], souls: [], dark: 0, darkMax: 0 };
  const def = () => (G && G.cls === 'ranger' ? DEF[wSkill()] || null : null);
  const FXK = KRS.FXK, lerp = (a, b, t) => a + (b - a) * t;
  const big = e => e.type === 'boss' || isElite(e) || isSemi(e) || isDummy(e);
  const live = e => e && !e.dead && e.type !== 'flag';
  const foes = () => G.enemies.filter(live);
  const aimPt = (P, maxD) => { let tx, ty; if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; } else { tx = P.x + Math.cos(P.ang) * maxD; ty = P.y + Math.sin(P.ang) * maxD; }
    const d = Math.hypot(tx - P.x, ty - P.y); if (d > maxD) { tx = P.x + (tx - P.x) / d * maxD; ty = P.y + (ty - P.y) / d * maxD; }
    return { x: clamp(tx, A.x0 + 16, A.x1 - 16), y: clamp(ty, A.y0 + 16, A.y1 - 16) }; };
  const hands = P => ({ fx: P.x + P.face * 7, fy: P.y - 5, bx: P.x - P.face * 7, by: P.y - 6 });
  const setRel = (P, d1, d2) => { P.blade = P.atkAng + P.sign * d1 * DEG; P.blade2 = P.atkAng - P.sign * (d2 == null ? d1 : d2) * DEG; };
  const out = k => (G.wproj || []).some(w => w.k === k);
  const bleed = (e, n, a) => { if (!(e.bleedT > 0)) gxSpurt(e, 8, a || 0); e.bleedT = 3; e.bleedN = Math.max(e.bleedN || 1, n); if (!(e.bleedTick > 0)) e.bleedTick = 0.5; };
  const moveP = (P, dx, dy) => { const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 3)); for (let i = 0; i < n; i++) { P.x += dx / n; P.y += dy / n; if (G.obs && G.obs.length) solveObs(P, P.r, false); } P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r); };
  const cone = (P, ang, reach, half, set) => foes().filter(e => !(set && set.has(e)) && dist(P, e) < reach + e.r && coneIn(P, e, ang, half));
  // 도트 칼자국: 초승달 모양 2px 칸 (뒤로 갈수록 가늘어짐)
  const slash = (x, y, ang, r, arc, c, c2, w, t, ry) => K.slashes.push({ x, y, ang, r, arc, c, c2: c2 || '#ffffff', w: w || 3, t, max: t, ry: ry || 0.75 });
  const pop = (x, y, v, c, s) => FXK.pop(x, y, v, c, s);
  const ghost = (P, pal, t) => G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0, t: t || 0.35, max: t || 0.35, map: 'hRanger', pal: pal || 'hRangerShadow', sc: 2 });

  // ---------------------------------------------------------------- 시작
  function start() {
    const D = def(); if (!D) return false;
    const P = G.player, k = wSkill();
    if ((k === 'sickle' && out('arsSickle'))) return false;
    P.atkAng = P.ang; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.sign = P.face; P.combo = 0; P.queued = false; P.trail = []; P.trail2 = [];
    P.ars = { k, t: 0, hit: new Set(), did: {}, dur: 0.6 };
    const R = P.ars, h = hands(P);
    P.state = 'ars';
    if (k === 'claw') { R.dur = 0.98; P.iframe = Math.max(P.iframe, 0.2); sfx('whoosh', 1.4); }
    else if (k === 'mackerel') { R.dur = 0.95; sfx('whoosh', 1.2); }
    else if (k === 'sickle') { R.dur = 0.22;
      for (const s of [0, 1]) (G.wproj = G.wproj || []).push({ k: 'arsSickle', s, t: 0, life: 2.0, a0: P.atkAng + s * Math.PI, x: P.x, y: P.y - 8, spin: 0, hitT: new Map(), hist: [] });
      FXK.burst(P.x, P.y - 8, ['#a070ff', '#d8c8ff', '#ffffff'], 10, 160, 0, true, 0.3); FXK.ring(P.x, P.y - 6, '#a070ff', 200, 0.3, 6); sfx('whoosh', 0.9); }
    else if (k === 'fan') { R.dur = 0.5; sfx('whoosh', 0.7); }
    else if (k === 'needle') { const T = cone(P, P.ang, 240, 0.75).sort((a, b) => dist(P, a) - dist(P, b)).slice(0, 5);
      R.tg = T; R.from = { x: P.x, y: P.y }; R.pts = [{ x: P.x, y: P.y - 8 }]; R.dur = T.length ? 0.08 + T.length * 0.1 + 0.55 : 0.5; P.iframe = Math.max(P.iframe, R.dur);
      K.threads.push(R.th = { pts: R.pts, t: R.dur + 1.2, max: R.dur + 1.2, tight: 0 }); sfx('dodge'); }
    else if (k === 'kusari') { // 일직선으로 길게 던져 최대 4명을 꿴다
      const L = foes().filter(e => { const d = dist(P, e), da = angDiff(angTo(P, e), P.ang); return d < 250 && Math.abs(da) < 1.2 && Math.abs(Math.sin(da) * d) < 22 + e.r; }).sort((a, b) => dist(P, a) - dist(P, b)).slice(0, 4);
      R.tg = L; R.bigT = L.find(big) || null; const far = L.length ? L[L.length - 1] : null, reach = far ? dist(P, far) + 10 : 200;
      R.hx = h.fx; R.hy = h.fy; R.tx = P.x + Math.cos(P.ang) * reach; R.ty = P.y - 8 + Math.sin(P.ang) * reach * 0.8; R.dur = L.length ? 0.78 : 0.4; P.iframe = Math.max(P.iframe, 0.45); sfx('bolt', 0.6); }
    else if (k === 'yarn') { R.dur = 0.28; const T = aimPt(P, 170);
      (G.wproj = G.wproj || []).push({ k: 'arsYarn', x0: h.fx, y0: h.fy - 4, tx: T.x, ty: T.y, x: h.fx, y: h.fy, t: 0, fly: 0.42, spin: 0 }); sfx('whoosh', 1.1); }
    else if (k === 'moons') { R.dur = 0.3; const T = aimPt(P, 190), id = Math.random();
      for (const s of [-1, 1]) (G.wproj = G.wproj || []).push({ k: 'arsMoon', s, id, x0: P.x, y0: P.y - 10, tx: T.x, ty: T.y - 6, x: P.x, y: P.y - 10, t: 0, fly: 0.5, hit: new Set(), hist: [] });
      FXK.burst(P.x, P.y - 10, ['#e8eef8', '#5a4a8a', '#ffffff'], 10, 150, 0, true, 0.3); sfx('whoosh', 1.0); }
    else if (k === 'fangs2') { R.dur = 0.82; const T = aimPt(P, 210); R.tx = T.x; R.ty = T.y; R.sx = P.x; R.sy = P.y; P.iframe = Math.max(P.iframe, 0.9);
      K.bats = []; for (let i = 0; i < 16; i++) K.bats.push({ ox: rand(-14, 14), oy: rand(-16, 4), ph: rand(0, TAU), sp: rand(10, 16), x: P.x, y: P.y - 8 });
      smoke(P.x, P.y, 14); FXK.burst(P.x, P.y - 8, ['#c02030', '#3a0e14', '#ff3040'], 10, 170, 0, false, 0.4); sfx('dodge'); sfx('whoosh', 0.6); }
    else if (k === 'nine') { const L = foes().filter(e => dist(P, e) < 260).sort((a, b) => dist(P, a) - dist(P, b)).slice(0, 5);
      R.tg = L; R.sx = P.x; R.sy = P.y; R.dur = 1.42; R.pts = []; P.iframe = Math.max(P.iframe, 1.5); K.dark = K.darkMax = 1.5;
      FXK.flash('#0a0620', 0.1); sfx('awaken'); }
    return true;
  }

  // ---------------------------------------------------------------- 진행
  function update(dt) {
    const P = G.player, R = P.ars; if (!R) { P.state = 'idle'; return; }
    R.t += dt; const t = R.t, k = R.k, h = hands(P);
    P.arsFront = false; P.arsHide = false;
    if (k === 'claw') {
      if (t < 0.08) setRel(P, -120, -100);
      else { if (!R.did.lunge) { R.did.lunge = true; ghost(P, 'hRangerShadow', 0.25); dust(P.x, P.y, 6); }
        if (t < 0.2) moveP(P, Math.cos(P.atkAng) * 260 * dt, Math.sin(P.atkAng) * 200 * dt);
        if (t < 0.76) { P.arsFront = true; const n = Math.floor((t - 0.08) / 0.055);
          if (n !== R.n) { R.n = n; const fr = n % 2 === 0, a = P.atkAng + rand(-0.5, 0.5), rr = rand(12, 18), cx = P.x + Math.cos(P.atkAng) * 22 + rand(-6, 6), cy = P.y - 10 + Math.sin(P.atkAng) * 16 + rand(-6, 6);
            if (fr) P.blade = P.atkAng + P.sign * rand(-150, 150) * DEG; else P.blade2 = P.atkAng - P.sign * rand(-150, 150) * DEG;
            for (let j = -1; j <= 1; j++) slash(cx + Math.cos(a + Math.PI / 2) * j * 4, cy + Math.sin(a + Math.PI / 2) * j * 3, a + (fr ? 0 : Math.PI), rr, 1.2, j ? '#f0a0b0' : '#ffd6e0', '#ffffff', 2, 0.16);
            (fr ? P.trail : P.trail2).push({ a: fr ? P.blade : P.blade2, t: 0.1 });
            for (const e of cone(P, P.atkAng, 46, 0.95)) { damageEnemy(e, 0.22, { ang: P.atkAng, kb: big(e) ? 0 : 30, grogi: 2, gauge: 1 }); sparks(e.x, e.y - 12, P.atkAng, '#ffd6e0', 3); }
            if (n % 2 === 0) sfx('hit', 1.6 + rand(0, 0.4)); 
            FXK.light(cx, cy, 50, 0.4, '255,170,200', 0.06); addShake(1.2, P.atkAng); } }
        else { setRel(P, lerp(-150, 140, Math.min(1, (t - 0.76) / 0.06)), lerp(150, -140, Math.min(1, (t - 0.76) / 0.06))); P.arsFront = t < 0.86;
          if (!R.did.fin) { R.did.fin = true; const cx = P.x + Math.cos(P.atkAng) * 26, cy = P.y - 10 + Math.sin(P.atkAng) * 18;
            for (let j = -1; j <= 1; j++) slash(cx + Math.cos(P.atkAng + Math.PI / 2) * j * 7, cy + Math.sin(P.atkAng + Math.PI / 2) * j * 5, P.atkAng - Math.PI / 2 * P.sign, 30, 1.7, '#ff7aa0', '#ffffff', 4, 0.35);
            for (const e of cone(P, P.atkAng, 60, 1.1)) { damageEnemy(e, 1.3, { ang: P.atkAng, kb: big(e) ? 0 : 200, grogi: 12, heavy: true, gauge: 5, stagger: 0.4 }); bleed(e, 2, P.atkAng); FXK.ring(e.x, e.y - 10, '#ffb0c4', 160, 0.25, 4); }
            FXK.burst(cx, cy, ['#ffffff', '#ffb0c4', '#ff7aa0'], 14, 240, 0, true, 0.3); FXK.ring(cx, cy, '#ff9ab8', 260, 0.3, 8); FXK.rays(cx, cy, 8, 46, '#ffd6e0', 0.18, P.atkAng);
            FXK.light(cx, cy, 120, 0.9, '255,160,200', 0.25); FXK.punch(6, 0.03, 0.06, P.atkAng); sfx('heavy', 1.4); } } }
    } else if (k === 'mackerel') {
      const HIT = [0.12, 0.3, 0.48, 0.72], i = HIT.findIndex(x => t < x + 0.1), ci = i < 0 ? 3 : i, fr = ci % 2 === 0, base = ci === 0 ? 0 : HIT[ci - 1] + 0.1;
      const q = clamp((t - base) / (HIT[ci] - base), 0, 1), sw = q < 1 ? lerp(-140, -170, q) : lerp(-170, 120, Math.min(1, (t - HIT[ci]) / 0.06));
      if (fr) setRel(P, sw, 90); else setRel(P, 90, sw); P.arsFront = q >= 1;
      if (q >= 1 && !R.did['h' + ci]) { R.did['h' + ci] = true; const last = ci === 3, pw = [140, 190, 240, 440][ci], cx = P.x + Math.cos(P.atkAng) * 26, cy = P.y - 10 + Math.sin(P.atkAng) * 18;
        slash(cx, cy, P.atkAng + (fr ? -1 : 1) * Math.PI / 2 * P.sign, last ? 30 : 20, 1.6, '#6aa0a0', '#e8f4f0', last ? 5 : 3, 0.25);
        let any = false; for (const e of cone(P, P.atkAng, last ? 62 : 52, 1.05)) { any = true; damageEnemy(e, last ? 1.3 : 0.45, { ang: P.atkAng + (fr ? -0.4 : 0.4), kb: big(e) ? 0 : pw, grogi: last ? 14 : 5, heavy: last, gauge: last ? 5 : 2 });
          for (let j = 0; j < (last ? 12 : 5); j++) G.parts.push({ x: e.x, y: e.y - 12, vx: Math.cos(P.atkAng) * rand(60, 200) + rand(-60, 60), vy: rand(-180, -60), t: rand(0.3, 0.55), c: pick(['#9ad8e8', '#e8f8ff', '#5aa8c8']), g: 420 }); }
        sfx('hit', 1.9 - ci * 0.15); FXK.punch(2 + ci * 2, ci === 3 ? 0.03 : 0.01, last ? 0.07 : 0.02, P.atkAng);
        FXK.ring(cx, cy, '#bfe8f0', 140 + ci * 60, 0.22, 4); FXK.light(cx, cy, 60 + ci * 20, 0.6, '180,230,240', 0.1);
        if (last) { FXK.burst(cx, cy, ['#ffffff', '#e8e0c8', '#c8c0a0'], 16, 280, 300, false, 0.5); FXK.rays(cx, cy, 10, 56, '#e8f8ff', 0.2); FXK.flash('#e8fbff', 0.04); sfx('crunch', 1.4);
          for (let j = 0; j < 6; j++) { const a = P.atkAng + rand(-0.8, 0.8); G.fx.push({ kind: 'streak', px: true, x0: cx, y0: cy, x1: cx + Math.cos(a) * rand(30, 60), y1: cy + Math.sin(a) * rand(20, 40), t: 0.2, max: 0.2, c: '#e8e0c8' }); } } }
    } else if (k === 'sickle') { setRel(P, lerp(-60, 160, Math.min(1, t / 0.12))); P.arsFront = true;
    } else if (k === 'fan') {
      if (t < 0.2) setRel(P, lerp(-60, -170, t / 0.2), 80);
      else { setRel(P, lerp(-170, 150, Math.min(1, (t - 0.2) / 0.1)), 80); P.arsFront = t < 0.34; if (t < 0.32) P.trail.push({ a: P.blade, t: 0.2 });
        if (!R.did.go) { R.did.go = true; const x = P.x + Math.cos(P.atkAng) * 30, y = P.y + Math.sin(P.atkAng) * 22;
          (G.wproj = G.wproj || []).push({ k: 'arsTornado', x, y, ang: P.atkAng, t: 0, life: 1.6, sp: 115, tick: 0, spin: 0 });
          slash(P.x + Math.cos(P.atkAng) * 16, P.y - 10 + Math.sin(P.atkAng) * 12, P.atkAng, 34, 2.2, '#d8dce4', '#ffffff', 4, 0.3);
          for (let j = 0; j < 7; j++) { const a = P.atkAng + (j - 3) * 0.22; G.fx.push({ kind: 'streak', px: true, x0: P.x + Math.cos(a) * 20, y0: P.y - 10 + Math.sin(a) * 14, x1: P.x + Math.cos(a) * 64, y1: P.y - 10 + Math.sin(a) * 44, t: 0.18, max: 0.18, c: j % 2 ? '#a8b0bc' : '#e8ecf2' }); }
          FXK.punch(4, 0.015, 0.03, P.atkAng); sfx('whoosh', 0.6); sfx('bolt', 0.5); } }
    } else if (k === 'needle') {
      const n = R.tg.length;
      if (!n) { if (t < 0.25) { moveP(P, Math.cos(P.atkAng) * 440 * dt, Math.sin(P.atkAng) * 330 * dt); setRel(P, 0, 120); P.arsFront = true; R.pts[1] = { x: P.x, y: P.y - 8 };
          for (const e of cone(P, P.atkAng, 30, 1.4, R.hit)) { R.hit.add(e); damageEnemy(e, 0.9, { ang: P.atkAng, kb: 80, grogi: 6, gauge: 3 }); } } }
      else { const i = Math.floor((t - 0.08) / 0.1);
        if (t >= 0.08 && i < n && i !== R.i) { R.i = i; const e = R.tg[i];
          if (live(e)) { const from = { x: P.x, y: P.y }, a = angTo(from, e); P.x = clamp(e.x + Math.cos(a) * (e.r + 12), A.x0 + P.r, A.x1 - P.r); P.y = clamp(e.y + Math.sin(a) * (e.r + 12) * 0.8, A.y0 + P.r, A.y1 - P.r);
            P.atkAng = a; P.face = Math.cos(a) > 0 ? 1 : -1; P.sign = P.face; setRel(P, 180, 120);
            R.pts.push({ e, x: e.x, y: e.y - 10 }); ghost({ x: from.x, y: from.y, face: P.face }, 'hRangerShadow', 0.3);
            G.fx.push({ kind: 'streak', px: true, x0: from.x, y0: from.y - 10, x1: P.x, y1: P.y - 10, t: 0.12, max: 0.12, c: '#ffffff' });
            P.critNext = true; damageEnemy(e, 0.75, { ang: a, kb: 0, grogi: 8, gauge: 3 }); applySt(e, 'bind', 0.5);
            slash(e.x, e.y - 10, a, 14, 0.6, '#c0303a', '#ffffff', 2, 0.2); sparks(e.x, e.y - 12, a, '#ffffff', 6); FXK.ring(e.x, e.y - 10, '#ff6070', 140, 0.2, 3);
            FXK.light(e.x, e.y, 60, 0.6, '255,90,100', 0.1); sfx('hit', 1.3 + i * 0.1); addShake(2, a); } }
        const tp = 0.08 + n * 0.1 + 0.18;
        if (t >= tp && !R.did.pull) { R.did.pull = true; R.th.tight = 1; sfx('bolt', 1.4); sfx('heavy', 1.3); FXK.punch(6, 0.03, 0.05);
          const L = R.pts[R.pts.length - 1];
          for (const p of R.pts) { const e = p.e; if (!live(e)) continue; if (!big(e)) { e.pullTo = { x: L.x + rand(-14, 14), y: L.y + 10 + rand(-8, 8), t: 0.18 }; } }
          R.pullL = L; }
        if (R.did.pull) { for (const p of R.pts) { const e = p.e; if (!e || !e.pullTo) continue; const q = Math.min(1, dt / Math.max(0.01, e.pullTo.t)); e.x += (e.pullTo.x - e.x) * q; e.y += (e.pullTo.y - e.y) * q; e.pullTo.t -= dt; p.x = e.x; p.y = e.y - 10; if (e.pullTo.t <= 0) e.pullTo = null; } }
        if (t >= tp + 0.2 && !R.did.bind) { R.did.bind = true; const L = R.pullL;
          for (const p of R.pts) { const e = p.e; if (!live(e)) continue; damageEnemy(e, 0.6, { ang: 0, kb: 0, grogi: 10, heavy: true, gauge: 3 }); applySt(e, 'bind', 1.2);
            for (let j = -1; j <= 1; j += 2) slash(e.x, e.y - 10, j * 0.78 + Math.PI / 2, 10, 0.3, '#c0303a', '#ff9aa0', 2, 0.6); }
          FXK.ring(L.x, L.y, '#c0303a', 220, 0.35, 8); FXK.burst(L.x, L.y, ['#c0303a', '#ff6070', '#ffffff'], 14, 220, 0, true, 0.35); FXK.rays(L.x, L.y, 8, 50, '#ff8a90', 0.2);
          FXK.light(L.x, L.y, 130, 0.9, '255,80,90', 0.25); } }
    } else if (k === 'kusari') {
      const TT = 0.14, L = R.tg.filter(live), B = R.bigT && live(R.bigT) ? R.bigT : null;
      if (t < TT) { const q = t / TT; R.cx = lerp(R.hx, R.tx, q); R.cy = lerp(R.hy, R.ty, q); setRel(P, 0, 120); P.arsFront = true;
        for (const e of L) if (!R.hit.has(e) && Math.hypot(e.x - R.cx, e.y - 8 - R.cy) < 16 + e.r) { R.hit.add(e); damageEnemy(e, 0.5, { ang: angTo(e, P), kb: 0, grogi: 6, gauge: 2 }); sparks(e.x, e.y - 10, angTo(e, P), '#d8c8ff', 6); FXK.ring(e.x, e.y - 10, '#a070ff', 150, 0.22, 4); sfx('crunch', 1.1 + R.hit.size * 0.1); addShake(2, 0); applySt(e, 'stun', 0.5); } }
      else if (!R.tg.length) { const q = Math.min(1, (t - TT) / 0.16); R.cx = lerp(R.tx, h.fx, q); R.cy = lerp(R.ty, h.fy, q); if (q >= 1) R.cx = null; }
      else {
        if (!R.did.grab) { R.did.grab = true; R.px = P.x; R.py = P.y; for (const e of L) { e.kx0 = e.x; e.ky0 = e.y; } if (B) ghost(P, 'hRangerShadow', 0.3); FXK.punch(4, 0.015, 0.03); sfx('bolt', 1.2);
          if (B) { const a = angTo(B, { x: R.px, y: R.py }); R.dx = clamp(B.x + Math.cos(a) * (B.r + 14), A.x0 + P.r, A.x1 - P.r); R.dy = clamp(B.y + Math.sin(a) * (B.r + 14) * 0.8, A.y0 + P.r, A.y1 - P.r); } else { R.dx = P.x; R.dy = P.y; } }
        const PULL = 0.18;
        if (t < TT + PULL) { const q = easeOut((t - TT) / PULL);
          if (B) { P.x = lerp(R.px, R.dx, q); P.y = lerp(R.py, R.dy, q); P.arsHide = q > 0.15 && q < 0.85; G.fx.push({ kind: 'streak', px: true, x0: P.x, y0: P.y - 10, x1: lerp(R.px, R.dx, Math.max(0, q - 0.2)), y1: lerp(R.py, R.dy, Math.max(0, q - 0.2)) - 10, t: 0.08, max: 0.08, c: '#6a5a8a' }); }
          R.links = [];
          for (const e of L) { if (e === B) { R.links.push({ x: e.x, y: e.y - 8 }); continue; } const a = angTo({ x: R.dx, y: R.dy }, { x: e.kx0, y: e.ky0 }), gx = R.dx + Math.cos(a) * (P.r + e.r + 10), gy = R.dy + Math.sin(a) * (P.r + e.r + 10) * 0.8;
            e.x = lerp(e.kx0, gx, q); e.y = lerp(e.ky0, gy, q); e.vx = e.vy = 0; R.links.push({ x: e.x, y: e.y - 8 });
            if (Math.random() < 0.5) G.parts.push({ x: e.x, y: e.y - rand(4, 16), vx: rand(-20, 20), vy: rand(-20, 0), t: 0.3, c: pick(['#3a2a48', '#6a5a8a', '#120818']), g: 0 }); }
          R.cx = null; }
        else { R.links = null; R.cx = null; const q = Math.min(1, (t - TT - PULL) / 0.3); setRel(P, -180 + 540 * q, 360 * q); P.arsFront = true; P.trail.push({ a: P.blade, t: 0.15 }); P.trail2.push({ a: P.blade2, t: 0.15 });
          if (!R.did.spin) { R.did.spin = true;
            if (B) { const a = angTo(P, B), cx = B.x, cy = B.y - 12; for (const d of [-0.78, 0.78]) slash(cx, cy, a + Math.PI / 2 + d, 26, 0.01, '#a070ff', '#ffffff', 4, 0.32); xLine(cx, cy, a, 30, '#a070ff'); P.critNext = true; damageEnemy(B, 1.4, { ang: a, kb: 0, grogi: 14, heavy: true, gauge: 5, stagger: 0.5 }); applySt(B, 'stun', 0.4); }
            slash(P.x, P.y - 8, 0, 50, TAU * 0.95, '#a070ff', '#efe6ff', 4, 0.4, 0.55); slash(P.x, P.y - 8, 1, 38, TAU * 0.9, '#6a5a8a', '#d8c8ff', 3, 0.35, 0.55);
            FXK.ring(P.x, P.y - 6, '#a070ff', 300, 0.38, 12); FXK.burst(P.x, P.y - 8, ['#a070ff', '#d8c8ff', '#ffffff', '#3a2a48'], 18, 260, 0, true, 0.4); FXK.rays(P.x, P.y - 8, 10, 64, '#d8c8ff', 0.2);
            for (const o of foes()) if (dist(P, o) < 66 + o.r && o !== B) damageEnemy(o, 1.2, { ang: angTo(P, o), kb: big(o) ? 0 : 260, grogi: 12, heavy: true, gauge: 5 });
            FXK.punch(7, 0.03, 0.06); FXK.light(P.x, P.y, 140, 0.9, '170,120,255', 0.3); (L.length > 1 && pop(P.x, P.y - 40, L.length + '연쇄!', '#d8c8ff', 3)); sfx('whoosh', 0.7); sfx('heavy', 1.1); } } }
    } else if (k === 'yarn') { setRel(P, lerp(-150, 120, Math.min(1, t / 0.12)), 60); P.arsFront = t < 0.16;
    } else if (k === 'moons') { setRel(P, lerp(-150, 120, Math.min(1, t / 0.1)), lerp(150, -120, Math.min(1, t / 0.1))); P.arsFront = t < 0.16;
    } else if (k === 'fangs2') {
      const FLY = 0.62;
      if (t < FLY) { P.arsHide = true; const q = easeOut(t / FLY), nx = lerp(R.sx, R.tx, q), ny = lerp(R.sy, R.ty, q); moveP(P, nx - P.x, ny - P.y);
        if ((R.bt = (R.bt || 0) - dt) <= 0) { R.bt = 0.12; for (const e of foes()) if (Math.hypot(e.x - P.x, (e.y - P.y) / 0.8) < 30 + e.r) { damageEnemy(e, 0.35, { ang: angTo(P, e), kb: 0, grogi: 3, gauge: 2 }); bleed(e, 2, angTo(P, e)); G.parts.push({ x: e.x, y: e.y - 12, vx: rand(-60, 60), vy: rand(-90, -30), t: 0.4, c: pick(['#c02030', '#ff3040']), g: 300 }); } sfx('hit', 2.0); }
        if (Math.random() < 0.6) G.parts.push({ x: P.x + rand(-10, 10), y: P.y - rand(2, 18), vx: 0, vy: 20, t: 0.4, c: pick(['#3a0e14', '#6a1a22', '#c02030']), g: 0 });
        FXK.light(P.x, P.y, 50, 0.15, '255,60,80', 0.04); }
      else { if (!R.did.x) { R.did.x = true; const a = P.atkAng, cx = P.x + Math.cos(a) * 10, cy = P.y - 10;
          smoke(P.x, P.y, 10); for (const d of [-0.78, 0.78]) slash(cx, cy, a + Math.PI / 2 + d, 36, 0.01, '#ff3040', '#ffffff', 5, 0.4); xLine(cx, cy, a, 44, '#ff3040');
          for (const e of foes()) if (dist(P, e) < 56 + e.r) { P.critNext = true; damageEnemy(e, 1.6, { ang: angTo(P, e), kb: big(e) ? 0 : 180, grogi: 14, heavy: true, gauge: 6 }); bleed(e, 3, angTo(P, e)); }
          FXK.burst(cx, cy, ['#ff3040', '#c02030', '#ffffff', '#3a0e14'], 18, 260, 0, true, 0.4); FXK.ring(cx, cy, '#ff3040', 300, 0.35, 10); FXK.rays(cx, cy, 12, 64, '#ff8090', 0.22);
          FXK.flash('#3a0008', 0.08); FXK.light(cx, cy, 150, 1, '255,50,70', 0.3); FXK.punch(8, 0.035, 0.08); sfx('heavy', 1.0); sfx('perfect'); }
        const q = Math.min(1, (t - FLY) / 0.12); setRel(P, -160 + 320 * q); P.arsFront = q < 1; }
    } else if (k === 'nine') {
      const T0 = 0.14, ST = 0.085, N = 9, i = Math.floor((t - T0) / ST);
      if (t >= T0 && i < N && i !== R.i) { R.i = i; const L = R.tg.filter(live), e = L.length ? L[i % L.length] : null, from = { x: P.x, y: P.y, face: P.face };
        let a; if (e) { a = rand(0, TAU); P.x = clamp(e.x + Math.cos(a) * (e.r + 16), A.x0 + P.r, A.x1 - P.r); P.y = clamp(e.y + Math.sin(a) * (e.r + 16) * 0.8, A.y0 + P.r, A.y1 - P.r); a = angTo(P, e); }
        else { a = i / N * TAU; P.x = clamp(R.sx + Math.cos(a) * 40, A.x0 + P.r, A.x1 - P.r); P.y = clamp(R.sy + Math.sin(a) * 30, A.y0 + P.r, A.y1 - P.r); a += Math.PI; }
        P.atkAng = a; P.face = Math.cos(a) > 0 ? 1 : -1; P.sign = P.face; setRel(P, 150, -150);
        ghost(from, 'hRangerGhost', 0.5); const cx = e ? e.x : P.x + Math.cos(a) * 24, cy = (e ? e.y : P.y) - 12;
        xLine(cx, cy, a + rand(-0.6, 0.6), 34, '#7af0ff'); slash(cx, cy, a + Math.PI / 2, 22, 1.2, '#7af0ff', '#ffffff', 3, 0.25);
        if (e) { damageEnemy(e, 0.6, { ang: a, kb: 0, grogi: 6, gauge: 2 }); sparks(e.x, e.y - 12, a, '#e8ffff', 5); }
        R.pts.push({ x: cx, y: cy }); K.souls.push({ x: cx, y: cy, t: 0, i, gx: 0, gy: 0 });
        pop(cx, cy - 24, String(i + 1), '#bff8ff', 1 + (i === N - 1 ? 2 : 0)); sfx('whoosh', 1.2 + i * 0.06); addShake(2, a); FXK.light(cx, cy, 60, 0.6, '120,240,255', 0.12); }
      const TB = T0 + N * ST + 0.12;
      if (t >= T0 + N * ST && !R.did.back) { R.did.back = true; ghost(P, 'hRangerGhost', 0.4); P.x = R.sx; P.y = R.sy; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.sign = P.face; P.atkAng = P.ang; smoke(P.x, P.y, 10); for (const s of K.souls) { s.gx = P.x; s.gy = P.y - 12; s.go = true; } }
      if (R.did.back) setRel(P, -120 + Math.min(1, (t - TB) / 0.1) * 0, 120);
      if (t >= TB + 0.2 && !R.did.boom) { R.did.boom = true; K.souls = []; const cx = P.x, cy = P.y - 10;
        for (const e of foes()) if (dist(P, e) < 84 + e.r) damageEnemy(e, 1.5, { ang: angTo(P, e), kb: big(e) ? 0 : 260, grogi: 16, heavy: true, gauge: 8 });
        FXK.ring(cx, cy, '#7af0ff', 380, 0.4, 10); FXK.ring(cx, cy, '#ffffff', 240, 0.3, 6); FXK.burst(cx, cy, ['#7af0ff', '#bff8ff', '#ffffff', '#6a5ab8'], 22, 300, 0, true, 0.45); FXK.rays(cx, cy, 14, 80, '#bff8ff', 0.25);
        FXK.flash('#bff8ff', 0.08); FXK.light(cx, cy, 180, 1, '120,240,255', 0.4); FXK.punch(10, 0.04, 0.1); sfx('heavy', 0.8); sfx('perfect'); }
    }
    if (t >= R.dur) end(P);
  }
  function end(P) { const k = P.ars && P.ars.k; P.state = 'idle'; P.arsFront = false; P.arsHide = false; P.ars = null; P.t = 0;
    if (k === 'fangs2' || (k && wSkill() === 'fangs2')) { P.stealthT = 2; smoke(P.x, P.y, 10); } }
  const xLine = (x, y, a, L, c) => { for (const d of [-0.78, 0.78]) { const b = a + Math.PI / 2 + d; G.fx.push({ kind: 'streak', px: true, x0: x - Math.cos(b) * L * 0.5, y0: y - Math.sin(b) * L * 0.4, x1: x + Math.cos(b) * L * 0.5, y1: y + Math.sin(b) * L * 0.4, t: 0.2, max: 0.2, c }); } };

  // ---------------------------------------------------------------- 던진 무기 · 회오리 · 그물
  function tick(dt) {
    if (K.g !== G) { K.g = G; K.slashes = []; K.threads = []; K.webs = []; K.bats = []; K.souls = []; K.dark = 0; }
    const P = G.player; if (!P) return;
    for (const s of K.slashes) s.t -= dt; K.slashes = K.slashes.filter(s => s.t > 0);
    for (const s of K.threads) s.t -= dt; K.threads = K.threads.filter(s => s.t > 0);
    K.dark = Math.max(0, K.dark - dt);
    for (const s of K.souls) { s.t += dt; if (s.go) { s.x += (s.gx - s.x) * Math.min(1, dt * 12); s.y += (s.gy - s.y) * Math.min(1, dt * 12); } if (Math.random() < 0.4) G.parts.push({ x: s.x + rand(-2, 2), y: s.y, vx: 0, vy: -30, t: 0.3, c: pick(['#7af0ff', '#bff8ff']), g: 0, glow: true }); }
    // 그물
    for (const W of K.webs) { W.t -= dt; W.age += dt;
      for (const e of foes()) if (Math.hypot(e.x - W.x, (e.y - W.y) / 0.55) < W.r) { e.st = e.st || {}; e.st.slowT = Math.max(e.st.slowT || 0, 0.25); e.st.slowK = Math.min(e.st.slowK || 1, 0.35); }
      if (W.t <= 0) { for (const e of foes()) if (Math.hypot(e.x - W.x, (e.y - W.y) / 0.55) < W.r + 6) { damageEnemy(e, 1.1, { ang: angTo(W, e), kb: big(e) ? 0 : 120, grogi: 10, heavy: true, gauge: 4 }); }
        FXK.burst(W.x, W.y - 4, ['#ff9ab0', '#e85a7a', '#ffd0dc'], 16, 240, 200, false, 0.5); FXK.ring(W.x, W.y - 2, '#ff9ab0', 260, 0.3, W.r * 0.6); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; G.fx.push({ kind: 'streak', px: true, x0: W.x + Math.cos(a) * 10, y0: W.y + Math.sin(a) * 6, x1: W.x + Math.cos(a) * (W.r + 10), y1: W.y + Math.sin(a) * (W.r + 10) * 0.55, t: 0.16, max: 0.16, c: '#ffd0dc' }); }
        sfx('crunch', 1.6); FXK.punch(4, 0.015, 0.03); } }
    K.webs = K.webs.filter(W => W.t > 0);
    tickEclipse(dt);
    // 박쥐: 플레이어 주위로 맴돎
    if (P.state === 'ars' && P.ars && P.ars.k === 'fangs2' && P.arsHide) for (const b of K.bats) { b.ph += dt * b.sp; const tx = P.x + b.ox + Math.cos(b.ph) * 8, ty = P.y - 8 + b.oy + Math.sin(b.ph * 1.3) * 6; b.x += (tx - b.x) * Math.min(1, dt * 14); b.y += (ty - b.y) * Math.min(1, dt * 14); }
    else K.bats = [];
    if (G.cls === 'ranger') { const sk = wSkill(); if (G.wproj && G.wproj.length) G.wproj = G.wproj.filter(w => !(w.k === 'arsSickle' && sk !== 'sickle')); P.arsHideW = out('arsSickle'); }
    else P.arsHideW = false;
    tickProj(dt);
  }
  function tickProj(dt) {
    if (!G.wproj || !G.wproj.length) return; const P = G.player;
    for (const w of G.wproj) {
      if (w.k === 'arsSickle') { w.t += dt; const L = w.life, rr = w.t < 0.45 ? lerp(10, 56, easeOut(w.t / 0.45)) : w.t > L - 0.3 ? lerp(56, 6, (w.t - (L - 0.3)) / 0.3) : 56 + Math.sin(w.t * 6) * 4, a = w.a0 + w.t * 8.5;
        w.x = P.x + Math.cos(a) * rr; w.y = P.y - 8 + Math.sin(a) * rr * 0.6; w.spin += dt * 30; w.hist.push({ x: w.x, y: w.y, t: 0.14 }); for (const q of w.hist) q.t -= dt; w.hist = w.hist.filter(q => q.t > 0);
        for (const [e, c] of w.hitT) { if (c - dt <= 0) w.hitT.delete(e); else w.hitT.set(e, c - dt); }
        for (const e of foes()) { if (w.hitT.has(e)) continue; if (Math.hypot(e.x - w.x, (e.y - 8 - w.y) / 0.8) < 12 + e.r) { w.hitT.set(e, 0.28); const oa = angTo(P, e); damageEnemy(e, 0.45, { ang: oa, kb: big(e) ? 0 : 90, grogi: 3, gauge: 1 }); sparks(e.x, e.y - 12, oa, '#d8c8ff', 4); FXK.ring(e.x, e.y - 10, '#a070ff', 120, 0.18, 3); sfx('hit', 1.5); } }
        if (Math.random() < 0.5) G.parts.push({ x: w.x, y: w.y, vx: rand(-20, 20), vy: rand(-20, 10), t: 0.3, c: pick(['#a070ff', '#d8c8ff', '#3a2a48']), g: 0, glow: true });
        FXK.light(w.x, w.y, 34, 0.12, '170,120,255', 0.04);
        if (w.t >= L) { w.dead = true; if (w.s === 0) { FXK.burst(P.x, P.y - 8, ['#d8c8ff', '#ffffff'], 8, 120, 0, true, 0.25); FXK.ring(P.x, P.y - 6, '#d8c8ff', 120, 0.2, 4); sfx('block', 1.5); } } }
      else if (w.k === 'arsTornado') { w.t += dt; w.spin += dt * 14; const sp = w.sp * (w.t < 0.2 ? 1.6 : 1); w.x += Math.cos(w.ang) * sp * dt; w.y += Math.sin(w.ang) * sp * dt * 0.8;
        if (segSolid(w.x - Math.cos(w.ang) * 4, w.y, w.x, w.y, 4) || w.x < A.x0 + 10 || w.x > A.x1 - 10 || w.y < A.y0 + 10 || w.y > A.y1 - 10) w.t = Math.max(w.t, w.life);
        const RR = 50 + Math.min(1, w.t / 0.3) * 10;
        for (const e of foes()) { const d = Math.hypot(e.x - w.x, (e.y - w.y) / 0.6); if (d < RR + e.r && !big(e)) { const q = Math.min(1, dt * 5); e.x += (w.x - e.x) * q * 0.9 + Math.cos(w.ang) * sp * dt; e.y += (w.y - e.y) * q * 0.9 + Math.sin(w.ang) * sp * dt * 0.8; } }
        if ((w.tick -= dt) <= 0) { w.tick = 0.18; for (const e of foes()) if (Math.hypot(e.x - w.x, (e.y - w.y) / 0.6) < 34 + e.r) { damageEnemy(e, 0.28, { ang: w.ang, kb: 0, grogi: 3, gauge: 1 }); sparks(e.x, e.y - 14, rand(0, TAU), '#e8ecf2', 1); } sfx('whoosh', 1.6 + rand(0, 0.3)); }
        for (const pr of (G.eproj || [])) if (pr.t > 0 && Math.hypot(pr.x - w.x, pr.y - (w.y - 16)) < 36) { pr.t = 0; sparks(pr.x, pr.y, rand(0, TAU), '#ffffff', 4); }
        for (let i = 0; i < 2; i++) { const a = rand(0, TAU), r = rand(20, 44); G.parts.push({ x: w.x + Math.cos(a) * r, y: w.y - rand(0, 40), vx: -Math.sin(a) * 160, vy: rand(-80, -30), t: 0.3, c: pick(['#a8b0bc', '#d8dce4', '#8a7c70', '#b0242c']), g: 0 }); }
        dust(w.x, w.y, 1); FXK.light(w.x, w.y - 26, 100, 0.22, '220,225,235', 0.03);
        if (w.t >= w.life) { w.dead = true; for (const e of foes()) if (Math.hypot(e.x - w.x, (e.y - w.y) / 0.6) < 60 + e.r) damageEnemy(e, 0.9, { ang: angTo(w, e), kb: big(e) ? 0 : 300, grogi: 10, heavy: true, gauge: 4 });
          FXK.ring(w.x, w.y - 10, '#e8ecf2', 320, 0.35, 10); FXK.burst(w.x, w.y - 16, ['#ffffff', '#d8dce4', '#b0242c'], 18, 280, 0, false, 0.45); FXK.rays(w.x, w.y - 12, 10, 60, '#e8ecf2', 0.2); dust(w.x, w.y, 12); FXK.punch(5, 0.02, 0.04); sfx('heavy', 1.3); } }
      else if (w.k === 'arsYarn') { w.t += dt; const q = Math.min(1, w.t / w.fly); w.x = lerp(w.x0, w.tx, q); w.y = lerp(w.y0, w.ty, q) - Math.sin(q * Math.PI) * 50; w.spin += dt * 16;
        if (Math.random() < 0.6) G.parts.push({ x: w.x, y: w.y, vx: 0, vy: 0, t: 0.35, c: pick(['#e85a7a', '#ff9ab0']), g: 0 });
        if (q >= 1) { w.dead = true; const W = { x: w.tx, y: w.ty, r: 58, t: 3, max: 3, age: 0, seed: Math.random() * 99 }; K.webs.push(W);
          for (const e of foes()) if (Math.hypot(e.x - W.x, (e.y - W.y) / 0.55) < W.r) { applySt(e, 'bind', 1.0); damageEnemy(e, 0.5, { ang: angTo(W, e), kb: 0, grogi: 6, gauge: 2 }); }
          FXK.ring(W.x, W.y - 2, '#ff9ab0', 240, 0.3, 8); FXK.burst(W.x, W.y - 6, ['#ff9ab0', '#e85a7a', '#ffd0dc'], 14, 200, 0, false, 0.35); FXK.light(W.x, W.y, 120, 0.8, '255,150,180', 0.3); sfx('crunch', 1.3); FXK.punch(3, 0.01, 0.02); } }
      else if (w.k === 'arsMoon') { w.t += dt; const q = Math.min(1, w.t / w.fly), dx = w.tx - w.x0, dy = w.ty - w.y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w.s, ny = dx / L * w.s, bend = Math.sin(q * Math.PI) * Math.min(90, L * 0.5);
        w.x = w.x0 + dx * q + nx * bend; w.y = w.y0 + dy * q + ny * bend * 0.7; w.hist.push({ x: w.x, y: w.y, t: 0.22 }); for (const o of w.hist) o.t -= dt; w.hist = w.hist.filter(o => o.t > 0);
        for (const e of foes()) if (!w.hit.has(e) && Math.hypot(e.x - w.x, e.y - 10 - w.y) < 14 + e.r) { w.hit.add(e); const S = e.st = e.st || {}; if (w.s < 0) S.moonS = true; else S.moonD = true; S.moonT = 4; damageEnemy(e, 0.5, { ang: angTo({ x: w.x, y: w.y }, e), kb: 0, grogi: 4, gauge: 2 }); sparks(e.x, e.y - 12, 0, w.s < 0 ? '#e8eef8' : '#a090e0', 5); }
        FXK.light(w.x, w.y, 40, 0.15, w.s < 0 ? '220,230,255' : '140,110,220', 0.04);
        if (q >= 1) { w.dead = true; if (w.s > 0) eclipse(w.tx, w.ty); } }
    }
    G.wproj = G.wproj.filter(w => !w.dead);
  }
  function eclipse(x, y) {
    K.eclipse = { x, y, t: 0, dur: 1.0, tick: 0 };
    FXK.flash('#0a0618', 0.06); FXK.ring(x, y, '#e8eef8', 200, 0.3, 6); FXK.burst(x, y, ['#e8eef8', '#5a4a8a', '#ffffff'], 10, 160, 0, true, 0.3); sfx('bolt', 0.4); FXK.punch(4, 0.015, 0.03);
  }
  function tickEclipse(dt) { const E = K.eclipse; if (!E) return; E.t += dt;
    if (E.boom) { if (E.t > E.boom + 0.35) K.eclipse = null; return; }
    const RR = 120;
    for (const e of foes()) { const d = Math.hypot(e.x - E.x, e.y - 10 - E.y); if (d > RR + e.r || d < 6) continue; const k = big(e) ? 0.25 : 1, sp = (160 + (RR - d) * 2.2) * k * dt, a = Math.atan2(E.y + 10 - e.y, E.x - e.x); e.x += Math.cos(a) * Math.min(sp, d - 4); e.y += Math.sin(a) * Math.min(sp, d - 4); e.vx = e.vy = 0; }
    if ((E.tick -= dt) <= 0) { E.tick = 0.15; for (const e of foes()) if (Math.hypot(e.x - E.x, e.y - 10 - E.y) < 40 + e.r) { damageEnemy(e, 0.22, { ang: 0, kb: 0, grogi: 3, gauge: 1 }); const S = e.st = e.st || {}; S.moonS = S.moonD = true; S.moonT = 4; } sfx('hit', 0.6); }
    for (let i = 0; i < 3; i++) { const a = rand(0, TAU), r = rand(50, 110); G.parts.push({ x: E.x + Math.cos(a) * r, y: E.y + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * r * 3 - Math.sin(a) * 80, vy: -Math.sin(a) * r * 2.1 + Math.cos(a) * 56, t: 0.3, c: pick(['#e8eef8', '#a090e0', '#5a4a8a', '#2a2440']), g: 0, glow: true }); }
    FXK.light(E.x, E.y, 90, 0.18, '200,190,255', 0.03); addShake(0.8, 0);
    if (E.t >= E.dur) { E.boom = E.t; const x = E.x, y = E.y;
      for (const e of foes()) if (Math.hypot(e.x - x, (e.y - 10 - y) / 0.8) < 72 + e.r) { const S = e.st = e.st || {}; S.moonS = S.moonD = true; S.moonT = 4; damageEnemy(e, 1.8, { ang: angTo({ x, y }, e), kb: big(e) ? 0 : 300, grogi: 16, heavy: true, gauge: 6 }); }
      FXK.flash('#e8eef8', 0.08); FXK.ring(x, y, '#0e0a1c', 300, 0.4, 10); FXK.ring(x, y, '#e8eef8', 400, 0.45, 14); FXK.rays(x, y, 16, 84, '#e8eef8', 0.25);
      FXK.burst(x, y, ['#e8eef8', '#5a4a8a', '#ffffff', '#a090e0'], 22, 300, 0, true, 0.45); FXK.light(x, y, 180, 1, '220,230,255', 0.4); FXK.punch(10, 0.04, 0.09); sfx('heavy', 0.9); sfx('perfect'); } }

  // ---------------------------------------------------------------- 그리기 (모두 2px 칸)
  const dot = (x, y, c, s) => { let f; if (SKD.mask && (f = SKD.occ(x, y)) > 0) { const a = ctx.globalAlpha; ctx.globalAlpha = a * (1 - 0.7 * f); ctx.fillStyle = c; ctx.fillRect(snap2(x), snap2(y), s || 2, s || 2); ctx.globalAlpha = a; return; } ctx.fillStyle = c; ctx.fillRect(snap2(x), snap2(y), s || 2, s || 2); };
  function pxLine(x0, y0, x1, y1, c, gap) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2)); ctx.fillStyle = c; for (let i = 0; i <= n; i++) { if (gap && i % gap === gap - 1) continue; ctx.fillRect(snap2(x0 + (x1 - x0) * i / n), snap2(y0 + (y1 - y0) * i / n), 2, 2); } }
  function drawSlash(s) { const p = 1 - s.t / s.max, grow = Math.min(1, p * 3), arc = s.arc * grow, n = Math.max(6, Math.ceil(s.r * Math.max(arc, 0.4) / 2)), a0 = s.ang - s.arc / 2;
    if (s.arc < 0.05) return;
    for (let i = 0; i <= n; i++) { const u = i / n, a = a0 + arc * u, w = Math.max(1, Math.round(s.w * Math.sin(u * Math.PI) * (1 - p * 0.6))), fade = p > 0.6 && ((i + Math.floor(p * 20)) % 3 === 0); if (fade) continue;
      for (let j = 0; j < w; j++) { const rr = s.r - j * 2, x = s.x + Math.cos(a) * rr, y = s.y + Math.sin(a) * rr * s.ry; SKD.pd(x, y, SKD.oid(s), j === 0 ? s.c2 : s.c); } } }
  function drawGround() {
    for (const W of K.webs) { const al = Math.min(1, W.t / 0.4), sp = Math.min(1, W.age / 0.18), r = W.r * sp; ctx.globalAlpha = al;
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + W.seed; pxLine(W.x, W.y, W.x + Math.cos(a) * r, W.y + Math.sin(a) * r * 0.55, i % 2 ? '#e85a7a' : '#ff9ab0', 0); }
      for (const f of [0.35, 0.65, 0.95]) { const n = Math.ceil(r * f * 0.8); for (let i = 0; i < n; i++) { const a = i / n * TAU, wob = Math.sin(a * 12 + W.seed) * 2; dot(W.x + Math.cos(a) * (r * f + wob), W.y + Math.sin(a) * (r * f + wob) * 0.55, i % 4 ? '#ff9ab0' : '#ffd0dc'); } }
      const bob = Math.round(Math.sin(W.age * 6)) * 2; ctx.fillStyle = '#b03050'; ctx.fillRect(snap2(W.x) - 4, snap2(W.y) - 8 + bob, 8, 8); ctx.fillStyle = '#e85a7a'; ctx.fillRect(snap2(W.x) - 4, snap2(W.y) - 8 + bob, 6, 6); ctx.fillStyle = '#ffd0dc'; ctx.fillRect(snap2(W.x) - 2, snap2(W.y) - 6 + bob, 2, 2);
      ctx.globalAlpha = 1; }
  }
  let SEL = null;
  function drawOver() {
    const P = G.player;
    if (SEL === 'top') { if (K.dark > 0) { const a = Math.min(1, K.dark / 0.25, (K.darkMax - K.dark) / 0.1) * 0.5; ctx.fillStyle = `rgba(8,4,24,${a})`; ctx.fillRect(cam.x - 50, cam.y - 50, 1000, 600); } return; }
    if (SEL === K.eclipse && K.eclipse && !K.eclipse.boom) { const E = K.eclipse, p = E.t / E.dur, r = Math.min(1, E.t / 0.15) * (14 + p * 10) + Math.round(Math.sin(E.t * 30)) * 2;
      // 빨려드는 소용돌이 점
      for (let arm = 0; arm < 4; arm++) for (let j = 0; j < 14; j++) { const u = ((j / 14 + E.t * 1.6) % 1), rr = r + 4 + (1 - u) * 70, a = arm / 4 * TAU + (1 - u) * 3.2 - E.t * 5; dot(E.x + Math.cos(a) * rr, E.y + Math.sin(a) * rr * 0.7, u > 0.7 ? '#ffffff' : u > 0.35 ? '#a090e0' : '#5a4a8a'); }
      ctx.fillStyle = '#05030c'; for (let yy = -r; yy <= r; yy += 2) { const w = Math.sqrt(Math.max(0, r * r - yy * yy)); ctx.fillRect(snap2(E.x - w), snap2(E.y + yy), snap2(w * 2), 2); }
      const n = Math.ceil(r * 3); for (let i = 0; i < n; i++) { const a = i / n * TAU + E.t * 4; dot(E.x + Math.cos(a) * (r + 2), E.y + Math.sin(a) * (r + 2), i % 3 ? '#e8eef8' : '#ffffff'); if (i % 2) dot(E.x + Math.cos(a) * (r + 5 + (i % 4) * 2), E.y + Math.sin(a) * (r + 5 + (i % 4) * 2), '#a090e0'); } }
    // 실 (바느질)
    for (const T of K.threads) { if (T !== SEL) continue; const al = Math.min(1, T.t / 0.4); ctx.globalAlpha = al; const pts = T.pts;
      for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], sag = T.tight ? 0 : 8; let px = a.x, py = a.y; for (let s = 1; s <= 8; s++) { const u = s / 8, x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u) + Math.sin(u * Math.PI) * sag; pxLine(px, py, x, y, '#c0303a'); px = x; py = y; } }
      ctx.globalAlpha = 1; }
    // 사슬 (그림자 사슬)
    if (SEL === 'chain' && P.state === 'ars' && P.ars && P.ars.k === 'kusari' && P.ars.links) { const h = hands(P); for (const l of P.ars.links) { const L = Math.hypot(l.x - h.fx, l.y - h.fy), n = Math.max(1, Math.floor(L / 4)); for (let i = 0; i <= n; i++) { const u = i / n; dot(lerp(h.fx, l.x, u), lerp(h.fy, l.y, u), i % 2 ? '#5a5a6a' : '#a8a0c8'); } dot(l.x - 2, l.y - 2, '#d8c8ff', 4); } }
    if (SEL === 'chain' && P.state === 'ars' && P.ars && P.ars.k === 'kusari' && P.ars.cx != null) { const R = P.ars, h = hands(P), L = Math.hypot(R.cx - h.fx, R.cy - h.fy), n = Math.max(1, Math.floor(L / 4));
      for (let i = 0; i <= n; i++) { const u = i / n; dot(lerp(h.fx, R.cx, u), lerp(h.fy, R.cy, u), i % 2 ? '#5a5a6a' : '#a8a0c8'); }
      const r = rotW(weaponTex('ranger'), Math.atan2(R.cy - h.fy, R.cx - h.fx), 1); ctx.drawImage(r.c, snap2(R.cx) - r.o + 1, snap2(R.cy) - r.o + 1); }
    for (const w of (G.wproj || [])) { if (w !== SEL) continue;
      if (w.k === 'arsSickle') { for (const q of w.hist) { ctx.globalAlpha = q.t / 0.14 * 0.6; dot(q.x, q.y, '#a070ff', 4); } ctx.globalAlpha = 1; const r = rotW(weaponTex('ranger'), w.spin, 1); ctx.drawImage(r.c, snap2(w.x) - r.o + 1, snap2(w.y) - r.o + 1); }
      else if (w.k === 'arsTornado') { const al = Math.min(1, (w.life - w.t) / 0.2, w.t / 0.1); ctx.globalAlpha = al;
        for (const back of [true, false]) { ctx.globalCompositeOperation = back ? 'source-over' : 'lighter'; for (let lv = 0; lv < 11; lv++) { const yy = w.y - lv * 5, sw = Math.sin(lv * 0.7 + w.t * 7) * (2 + lv * 0.4), rx = 6 + lv * 3.6, ry = 2 + lv * 0.9, n = Math.ceil(rx * 1.6);
          for (let i = 0; i < n; i++) { const a = i / n * TAU + w.spin * (1 + lv * 0.06), front = Math.sin(a) > 0; if (front === back) continue; if ((i + lv + Math.floor(w.spin)) % 5 === 0) continue;
            dot(w.x + sw + Math.cos(a) * rx, yy + Math.sin(a) * ry, back ? (lv % 2 ? '#5a6270' : '#6a7280') : ((i + lv) % 6 === 0 ? '#b0242c' : (i % 3 ? '#e8ecf2' : '#ffffff'))); } } }
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
      else if (w.k === 'arsYarn') { const s = Math.floor(w.spin) % 4; ctx.fillStyle = '#b03050'; ctx.fillRect(snap2(w.x) - 4, snap2(w.y) - 4, 8, 8); ctx.fillStyle = '#e85a7a'; ctx.fillRect(snap2(w.x) - 4 + (s & 1) * 2, snap2(w.y) - 4, 6, 6); ctx.fillStyle = '#ffd0dc'; ctx.fillRect(snap2(w.x) - 2 + (s >> 1) * 2, snap2(w.y) - 2, 2, 2); }
      else if (w.k === 'arsMoon') { const c = w.s < 0 ? ['#ffffff', '#e8eef8', '#a8b8d0'] : ['#d8c8ff', '#5a4a8a', '#2a2440'];
        for (const q of w.hist) { ctx.globalAlpha = q.t / 0.22 * 0.7; dot(q.x, q.y, c[1], 4); } ctx.globalAlpha = 1;
        const sp = w.t * 22 * w.s; for (let i = 0; i < 14; i++) { const u = i / 13, a = sp + (u - 0.5) * 3.2, th = Math.round(Math.sin(u * Math.PI) * 2) + 1; for (let j = 0; j < th; j++) dot(w.x + Math.cos(a) * (9 - j * 2), w.y + Math.sin(a) * (9 - j * 2), j === 0 ? c[0] : c[1 + (j > 1 ? 1 : 0)]); } }
    }
    // 박쥐 떼
    if (SEL === K.bats) for (const b of K.bats) { const f = Math.floor(b.ph * 2) % 2; ctx.fillStyle = '#1a0a0e'; ctx.fillRect(snap2(b.x) - 2, snap2(b.y), 6, 2); ctx.fillStyle = '#3a0e14'; if (f) { ctx.fillRect(snap2(b.x) - 4, snap2(b.y) - 2, 2, 2); ctx.fillRect(snap2(b.x) + 4, snap2(b.y) - 2, 2, 2); } else { ctx.fillRect(snap2(b.x) - 4, snap2(b.y) + 2, 2, 2); ctx.fillRect(snap2(b.x) + 4, snap2(b.y) + 2, 2, 2); } ctx.fillStyle = '#ff3040'; ctx.fillRect(snap2(b.x), snap2(b.y), 2, 2); }
    // 혼불
    for (const s of K.souls) { if (s !== SEL) continue; const fl = Math.floor(s.t * 12) % 2; dot(s.x - 2, s.y - 2, '#6a5ab8', 6); dot(s.x - 2, s.y - 4 - fl * 2, '#7af0ff', 4); dot(s.x, s.y - 2, '#ffffff', 2); }
    ctx.globalCompositeOperation = 'lighter'; for (const s of K.slashes) if (s === SEL) drawSlash(s); ctx.globalCompositeOperation = 'source-over';
  }

  // ---------------------------------------------------------------- 그림자 사슬낫 새 고유 효과: 3타에 사슬낫을 한 바퀴 휘두름
  const _wse = weaponSwingEnd;
  weaponSwingEnd = function () { _wse(); const P = G.player; if (G.cls !== 'ranger' || wSkill() !== 'kusari') return;
    slash(P.x, P.y - 8, 0, 40, TAU * 0.9, '#6a5a8a', '#d8c8ff', 3, 0.3, 0.55); FXK.ring(P.x, P.y - 6, '#a070ff', 200, 0.25, 6); sfx('whoosh', 0.9);
    for (const e of foes()) if (dist(P, e) < 54 + e.r) { damageEnemy(e, 0.6, { proc: true, ang: angTo(e, P), kb: big(e) ? 0 : 60, grogi: 4, gauge: 1 }); } };
  // 낫을 던진 동안은 기본 공격을 하지 않음
  const _sa = startAttack;
  startAttack = function (i) { const P = G.player; if (G.cls === 'ranger' && P.arsHideW) return; return _sa(i); };
  const _dgg = drawGearGround, gd = SKD.ground(drawGround); drawGearGround = function () { _dgg(); ctx.save(); gd(); ctx.restore(); };
  const _dwp = drawWproj; drawWproj = function () { _dwp(); ctx.save(); SEL = 'top'; try { drawOver(); } finally { SEL = null; ctx.restore(); } };
  SKD.add(ents => { if (!G) return; const P = G.player, one = it => SKD.one(drawOver, v => SEL = v, it);
    if (K.eclipse && !K.eclipse.boom) ents.push({ y: K.eclipse.y + 12, d: one(K.eclipse) });
    for (const T of K.threads) ents.push({ y: Math.max(...T.pts.map(p => p.y)) + 10, d: one(T) });
    if (P && P.state === 'ars' && P.ars && P.ars.k === 'kusari') ents.push({ y: P.y + 1, d: one('chain') });
    for (const w of (G.wproj || [])) if (/^ars/.test(w.k)) ents.push({ y: w.k === 'arsTornado' ? w.y + 2 : w.k === 'arsYarn' ? w.ty : w.y + 12, d: one(w) });
    if (K.bats.length && P) ents.push({ y: P.y + 1, d: one(K.bats) });
    for (const s of K.souls) ents.push({ y: s.y + 12, d: one(s) });
    for (const s of K.slashes) ents.push({ y: s.y + 12, d: () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawSlash(s); ctx.restore(); } }); });
  const _ie = itemExtra;
  itemExtra = function (it, cls) { const base = _ie(it, cls); if (!it || it.wk == null || it.cls !== 'ranger') return base;
    const sk = (wcat('ranger')[it.wk] || {}).sk, D = DEF[sk]; if (!D) return base;
    return base + `<div class="fx">우클릭 「${D.n}」 · 쿨타임 ${D.cd}초 — ${D.d}</div>`; };

  return SKD.wrapAll({ start, update, tick, def, DEF, slash, dot, pxLine, xLine });
})();
;

// ==================================================================== 43_grs.js
'use strict';
// ==================================================================================================
// 잿빛 왕관 원정대 — 43_grs.js : v3.22 그레이브(거너) 무기별 우클릭 기술 (41_krs.js · 42_ars.js와 같은 방식)
//  · 레어 · 유니크 · 레전더리 총은 무기마다 고유한 우클릭 기술을 씀 (커먼 · 초록 총은 기본 「파열탄」)
//  · 쿨타임은 무기마다 따로 돎 (KRS.tick이 함께 관리) · 고유 우클릭은 장탄을 쓰지 않음
//  · 연출은 모두 2px 칸 · 도트 선 · 도트 고리 (KRS.FXK · ARS 도트 도우미 공유)
// ==================================================================================================
var GRS = (() => {
  const DEF = {
    blunder: { n: '나팔 포효', cd: 8, d: '나팔총으로 잡동사니를 넓게 터뜨립니다. 앞쪽 넓은 부채꼴의 적에게 큰 피해를 주고 멀리 날려 보내며, 0.8초 동안 기절시킵니다.' },
    harpoon: { n: '고래잡이', cd: 9, d: '작살을 세게 쏩니다. 작살은 닿는 적을 모두 꿰어 달고 처음 만나는 벽이나 장애물까지 밀고 가 박히며, 박힌 적은 큰 피해를 받고 오래 기절합니다. 보스는 꿰뚫고 지나갑니다.' },
    duck: { n: '오리 행진', cd: 9, d: '고무 오리 다섯 마리를 풀어 놓습니다. 오리는 통통 뛰어 가까운 적을 쫓아가 「꽥」 하고 터집니다.' },
    longrifle: { n: '관통 저격', cd: 10, d: '잠시 조준한 뒤 화면 끝까지 꿰뚫는 한 발을 쏩니다. 줄 위의 모든 적에게 아주 큰 피해를 줍니다. 조준하는 동안 방향을 바꿀 수 있습니다.' },
    revolver: { n: '팬 해머', cd: 7, d: '두 리볼버의 공이를 손바닥으로 연달아 쳐 0.6초 동안 12발을 쏟아붓습니다. 앞쪽의 적을 번갈아 노립니다.' },
    cannon: { n: '일제 포격', cd: 10, d: '하늘로 무거운 포탄 세 발을 쏘아 올립니다. 조준한 지점 주변에 차례로 떨어져 크게 폭발하고, 폭발한 자리에 불길이 남습니다.' },
    puffer: { n: '거대 복어', cd: 9, d: '큰 복어를 굴려 보냅니다. 복어는 벽에 튕기며 점점 부풀고, 닿는 적을 밀쳐낸 뒤 터져 가시를 사방으로 쏩니다.' },
    match: { n: '화염 방사', cd: 9, d: '1초 동안 앞으로 불을 뿜습니다. 불길에 닿은 적은 계속 피해를 받고 불이 붙으며, 지나간 바닥에 불길이 남습니다. 뿜는 동안 방향을 바꿀 수 있습니다.' },
    undertaker: { n: '장례 행렬', cd: 11, d: '혼불 해골탄 여섯 발을 줄지어 쏩니다. 해골탄은 크게 한 바퀴 돌아 적의 등 뒤로 파고들어 반드시 치명타를 주고 폭발합니다.' },
    kingrev: { n: '왕의 처결', cd: 11, d: '주변의 적 최대 여섯에게 왕관 표식을 띄우고, 몸 주위로 금탄 여섯 발을 돌립니다. 금탄이 하나씩 날아가 표식에 꽂히며 터지고, 마지막 탄은 크게 폭발합니다.' },
  };
  for (const k in DEF) SK_META[k] = Object.assign(SK_META[k] || {}, { K: DEF[k].n, KD: DEF[k].d });
  const K = { g: null, tr: [], marks: [], beams: [], crowns: [], coffins: [], blasts: [], scorch: [] };
  const def = () => (G && G.cls === 'gunner' ? DEF[wSkill()] || null : null);
  const FXK = KRS.FXK, lerp = (a, b, t) => a + (b - a) * t, dot = ARS.dot, pxLine = ARS.pxLine, slash = ARS.slash;
  const big = e => e.type === 'boss' || isElite(e) || isSemi(e) || isDummy(e);
  const live = e => e && !e.dead && e.type !== 'flag';
  const foes = () => G.enemies.filter(live);
  const pop = (x, y, v, c, s) => FXK.pop(x, y, v, c, s);
  const aimPt = (P, maxD) => { let tx, ty; if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; } else { tx = P.x + Math.cos(P.ang) * maxD; ty = P.y + Math.sin(P.ang) * maxD; }
    const d = Math.hypot(tx - P.x, ty - P.y); if (d > maxD) { tx = P.x + (tx - P.x) / d * maxD; ty = P.y + (ty - P.y) / d * maxD; }
    return { x: clamp(tx, A.x0 + 16, A.x1 - 16), y: clamp(ty, A.y0 + 16, A.y1 - 16) }; };
  const wallAt = (x0, y0, x1, y1) => segSolid(x0, y0, x1, y1, 4) || x1 < A.x0 + 6 || x1 > A.x1 - 6 || y1 < A.y0 + 6 || y1 > A.y1 - 6;
  const tracer = (x0, y0, x1, y1, c, w, t) => K.tr.push({ x0, y0, x1, y1, c, w: w || 1, t: t || 0.12, max: t || 0.12 });
  const flashM = (s, a) => { const m = muzzle(); G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang: a == null ? G.player.blade : a, s: s || 1.6, t: 0.16, max: 0.16 }); return m; };
  const rayHit = (x, y, a, len, w, skip) => foes().filter(e => !(skip && skip.has(e))).map(e => { const dx = e.x - x, dy = e.y - 10 - y, along = dx * Math.cos(a) + dy * Math.sin(a), perp = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a)); return { e, along, perp }; }).filter(o => o.along > 0 && o.along < len && o.perp < w + o.e.r).sort((p, q) => p.along - q.along);
  const boom = (x, y, r, coef, cols, light, word) => { for (const e of foes()) if (Math.hypot(e.x - x, (e.y - y) / 0.8) < r + e.r) damageEnemy(e, coef, { ang: angTo({ x, y }, e), kb: big(e) ? 0 : 220, grogi: 8, heavy: true, gauge: 3 });
    FXK.ring(x, y - 4, cols[0], r * 6, 0.3, 6); FXK.burst(x, y - 6, cols, 14, 230, 0, true, 0.35); FXK.rays(x, y - 6, 8, r * 1.3, cols[1] || cols[0], 0.18); FXK.light(x, y, r * 2.6, 0.9, light, 0.25); dust(x, y, 6); if (word) pop(x, y - 30, word, cols[0], 2); };

  // 도트 폭발: 하얀 섬광 → 노란 불덩이 → 주황 → 검은 연기 (2px 칸 · 디더로 흩어짐) + 연기 기둥
  const PAL_F = ['#ffffff', '#fff2a0', '#ffb040', '#e05a20', '#5a4a48', '#2a2228'], PAL_G = ['#ffffff', '#d8ffe0', '#7aff9a', '#30c060', '#2a4a38', '#141c18'], PAL_Y = ['#ffffff', '#fff6c0', '#ffd34d', '#c9952a', '#5a4a38', '#2a2218'];
  const blast = (x, y, s, pal, scorch, ry) => { K.blasts.push({ x, y, s, pal: pal || PAL_F, t: 0, max: 0.32 + s * 0.007, seed: Math.random() * 99, ry: ry || (s >= 40 ? 0.62 : 0.85) }); // v3.22 큰 폭발은 바닥 타원
    for (let i = 0; i < Math.round(s / 6); i++) G.parts.push({ x: x + rand(-s, s) * 0.4, y: y - rand(0, s * 0.4), vx: rand(-30, 30), vy: rand(-70, -30), t: rand(0.5, 0.9), c: pick(['#3a3540', '#5b5560', '#2a2228']), g: -30 });
    if (scorch) K.scorch.push({ x, y: y + s * 0.2, r: s * 0.7, t: 5, seed: Math.random() * 99 }); };

  // ---------------------------------------------------------------- 시작
  function start() {
    const D = def(); if (!D) return false;
    const P = G.player, k = wSkill();
    P.atkAng = P.ang; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.blade = P.ang; P.combo = 0; P.queued = false;
    P.grs = { k, t: 0, hit: new Set(), did: {}, dur: 0.5, a: P.ang };
    const R = P.grs; P.state = 'grs';
    if (k === 'blunder') { R.dur = 0.55; sfx('reload', 0.8); }
    else if (k === 'harpoon') { R.dur = 0.35; }
    else if (k === 'duck') { R.dur = 0.42; }
    else if (k === 'longrifle') { R.dur = 1.0; sfx('aim'); }
    else if (k === 'revolver') { R.dur = 0.9; const L = foes().filter(e => dist(P, e) < 230 && coneIn(P, e, P.ang, 1.0)).sort((a, b) => dist(P, a) - dist(P, b)); R.tg = L; }
    else if (k === 'cannon') { R.dur = 0.5; const T = aimPt(P, 200); R.T = T;
      const OFF = [[0, 0], [-44, 22], [44, -18]]; OFF.forEach(([dx, dy], i) => K.marks.push({ x: clamp(T.x + dx, A.x0 + 10, A.x1 - 10), y: clamp(T.y + dy, A.y0 + 10, A.y1 - 10), t: 0, land: 0.78 + i * 0.26, r: 52 })); R.dur = 0.72; }
    else if (k === 'puffer') { R.dur = 0.35; }
    else if (k === 'match') { R.dur = 1.25; }
    else if (k === 'undertaker') { R.dur = 0.48; const L = foes().filter(e => dist(P, e) < 280).sort((a, b) => dist(P, a) - dist(P, b)).slice(0, 6); R.tg = L; sfx('warn', 0.7); }
    else if (k === 'kingrev') { R.dur = 1.2; let L = foes().filter(e => dist(P, e) < 270).sort((a, b) => dist(P, a) - dist(P, b)); R.tg = []; if (L.length) for (let i = 0; i < 6; i++) R.tg.push(L[i % L.length]);
      K.cyl = { t: 0, gone: [] }; sfx('reload', 1.2); FXK.ring(P.x, P.y - 8, '#ffd34d', 160, 0.3, 6); }
    return true;
  }

  // ---------------------------------------------------------------- 진행
  function update(dt) {
    const P = G.player, R = P.grs; if (!R) { P.state = 'idle'; return; }
    R.t += dt; const t = R.t, k = R.k;
    P.blade = R.a; P.face = Math.cos(R.a) > 0 ? 1 : -1;
    if (k === 'blunder') {
      if (t < 0.12) { P.blade = R.a - P.face * 0.25 * (t / 0.12); if (Math.random() < 0.5) { const m = muzzle(); G.parts.push({ x: m.x, y: m.y, vx: rand(-20, 20), vy: rand(-40, -10), t: 0.3, c: pick(['#e0b860', '#ffffff']), g: 0, glow: true }); } }
      else if (!R.did.f) { R.did.f = true; const m = flashM(3.2), a = R.a;
        for (const e of foes()) { const d = dist(P, e); if (d < 140 + e.r && coneIn(P, e, a, 1.05)) { damageEnemy(e, 1.7 * (1 - Math.min(d, 140) / 140 * 0.4), { ang: angTo(P, e), kb: big(e) ? 0 : 420, grogi: 12, heavy: true, stagger: 0.8, gauge: 5 }); applySt(e, 'stun', 0.8); sparks(e.x, e.y - 12, angTo(P, e), '#ffe0a0', 6); blast(e.x, e.y - 10, 12); } }
        for (let i = 0; i < 4; i++) slash(m.x + Math.cos(a) * (8 + i * 22), m.y + Math.sin(a) * (6 + i * 16), a, 14 + i * 12, 2.0, i % 2 ? '#e0b860' : '#ffe8a0', '#ffffff', 3 - (i > 1 ? 1 : 0), 0.22 + i * 0.05);
        for (let i = 0; i < 34; i++) { const b = a + rand(-1.0, 1.0), sp = rand(160, 380); G.parts.push({ x: m.x, y: m.y, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.8 - rand(0, 60), t: rand(0.25, 0.55), c: pick(['#b08038', '#e0b860', '#8d9097', '#c8c8c8', '#6a4818']), g: 260 }); }
        for (let i = 0; i < 9; i++) { const b = a + (i - 4) * 0.24; tracer(m.x, m.y, m.x + Math.cos(b) * rand(90, 140), m.y + Math.sin(b) * rand(70, 110), i % 2 ? '#ffe0a0' : '#ffffff', 1, 0.14); }
        blast(m.x + Math.cos(a) * 14, m.y + Math.sin(a) * 10, 22); FXK.ring(m.x, m.y, '#ffe0a0', 360, 0.3, 8); FXK.light(m.x, m.y, 160, 1, '255,210,140', 0.25); FXK.flash('#fff0c0', 0.06); FXK.punch(9, 0.035, 0.07, a + Math.PI);
        P.recoil = 3; P.x -= Math.cos(a) * 30; P.y -= Math.sin(a) * 22; solveObs(P, P.r); sfx('shotgun'); sfx('blast', 0.8); goldCasing(); }
    } else if (k === 'harpoon') {
      if (!R.did.f) { R.did.f = true; const m = flashM(2.2); (G.wproj = G.wproj || []).push({ k: 'grsHarp', x: m.x, y: m.y, a: R.a, d: 0, sp: 640, max: 1400, car: [], stuck: false, life: 3, ox: m.x, oy: m.y, pierced: new Set() });
        P.recoil = 2.2; FXK.punch(5, 0.015, 0.03, R.a + Math.PI); sfx('shot', 0.7); sfx('bolt', 0.8); tracer(m.x, m.y, m.x + Math.cos(R.a) * 40, m.y + Math.sin(R.a) * 30, '#ffffff', 2, 0.1); }
    } else if (k === 'duck') {
      if (!R.did.f && t > 0.06) { R.did.f = true; const m = flashM(1.8); for (let i = 0; i < 5; i++) { const a = R.a + (i - 2) * 0.32; (G.wproj = G.wproj || []).push({ k: 'grsDuck', x: m.x, y: m.y + 6, vx: Math.cos(a) * 150, vy: Math.sin(a) * 110, t: 0, life: 2.6 + i * 0.12, hop: rand(0, 1), face: Math.cos(a) > 0 ? 1 : -1 }); }
        P.recoil = 1.6; sfx('shot', 1.6); sfx('blip', 1.4); FXK.burst(m.x, m.y, ['#f0c838', '#ffffff', '#f08a2a'], 10, 160, 0, false, 0.3); }
    } else if (k === 'longrifle') {
      if (t < 0.55) { R.a = lerpAng(R.a, P.ang, dt * 6); P.blade = R.a; const q = t / 0.55; if (Math.random() < q) { const m = muzzle(); G.parts.push({ x: m.x + rand(-2, 2), y: m.y + rand(-2, 2), vx: 0, vy: -10, t: 0.2, c: '#ffd080', g: 0, glow: true }); } }
      else if (!R.did.f) { R.did.f = true; const m = flashM(3), a = R.a, L = 640; let ex = m.x + Math.cos(a) * L, ey = m.y + Math.sin(a) * L;
        K.beams.push({ x0: m.x, y0: m.y, x1: ex, y1: ey, t: 0.4, max: 0.4 });
        const hits = rayHit(m.x, m.y, a, L, 10); blast(m.x + Math.cos(a) * 12, m.y + Math.sin(a) * 8, 20); hits.forEach((o, i) => { if (i === 0) P.critNext = true; blast(o.e.x, o.e.y - 12, 22); damageEnemy(o.e, 3.2, { ang: a, kb: big(o.e) ? 0 : 160, grogi: 20, heavy: true, stagger: 0.6, gauge: 8 }); sparks(o.e.x, o.e.y - 12, a, '#ffffff', 10); FXK.ring(o.e.x, o.e.y - 10, '#ffe0a0', 200, 0.25, 4); G.parts.push(...Array.from({ length: 8 }, () => ({ x: o.e.x, y: o.e.y - 12, vx: Math.cos(a) * rand(80, 260) + rand(-40, 40), vy: Math.sin(a) * rand(80, 200) + rand(-80, 20), t: 0.4, c: pick(['#ffffff', '#ffe0a0', '#c03030']), g: 200 }))); });
        FXK.flash('#fff6e0', 0.08); FXK.punch(11, 0.04, 0.1, a + Math.PI); FXK.light(m.x, m.y, 180, 1, '255,230,180', 0.3); P.recoil = 3.5; P.x -= Math.cos(a) * 18; P.y -= Math.sin(a) * 14; solveObs(P, P.r); sfx('snipe'); sfx('blast', 1.2); goldCasing(); }
    } else if (k === 'revolver') {
      const n = Math.floor((t - 0.05) / 0.05);
      if (t >= 0.05 && n < 12 && n !== R.n) { R.n = n; const L = R.tg.filter(live), e = L.length ? L[n % L.length] : null, a = e ? angTo(P, e) + rand(-0.05, 0.05) : R.a + rand(-0.3, 0.3);
        P.blade = a; R.ba = a; const m = muzzle(), off = n % 2 ? 4 : -4, mx = m.x - Math.sin(a) * off, my = m.y + Math.cos(a) * off * 0.6;
        G.fx.push({ kind: 'muzzle', x: mx, y: my, ang: a, s: 1.3, t: 0.1, max: 0.1 });
        const h = rayHit(mx, my, a, 260, 6)[0], tx = h ? h.e.x : mx + Math.cos(a) * 240, ty = h ? h.e.y - 10 : my + Math.sin(a) * 180;
        tracer(mx, my, tx, ty, n % 2 ? '#ffe0a0' : '#ffffff', 1, 0.08);
        if (h) { blast(h.e.x + rand(-4, 4), h.e.y - 12 + rand(-4, 4), 9); damageEnemy(h.e, 0.38, { ang: a, kb: big(h.e) ? 0 : 50, grogi: 3, gauge: 1 }); sparks(h.e.x, h.e.y - 12, a, '#ffe0a0', 3); }
        P.recoil = 1.2; addShake(1.5, a + Math.PI); sfx('shot', 1.3 + (n % 3) * 0.1); if (n % 2) goldCasing(); FXK.light(mx, my, 50, 0.5, '255,210,140', 0.05);
        }
      if (t >= 0.66) { R.a = R.ba == null ? R.a : R.ba; P.blade = R.a + (t - 0.66) / 0.24 * TAU * 2 * P.face; if (!R.did.tw) { R.did.tw = true; sfx('reload', 1.4); FXK.ring(P.x, P.y - 8, '#ffe0a0', 120, 0.25, 6); } }
    } else if (k === 'cannon') {
      const up = Math.cos(R.a) >= 0 ? -1.1 : -Math.PI + 1.1, n = Math.floor(t / 0.24), ph = t - n * 0.24;
      P.blade = up + (Math.cos(R.a) >= 0 ? -1 : 1) * Math.max(0, 0.25 - ph) * 0.8; // 쏠 때마다 반동으로 들림
      if (n < 3 && n !== R.n) { R.n = n; const m = flashM(3.4, up); P.recoil = 3.2; FXK.punch(9, 0.03, 0.06, Math.PI / 2); FXK.flash('#fff0c0', 0.04); sfx('blast', 0.55); sfx('shotgun', 0.6);
        blast(m.x, m.y - 4, 20); FXK.ring(m.x, m.y, '#ffe0a0', 260, 0.25, 6); FXK.light(m.x, m.y, 150, 1, '255,200,120', 0.2); 
        for (let i = 0; i < 14; i++) G.parts.push({ x: m.x + rand(-4, 4), y: m.y, vx: rand(-50, 50), vy: rand(-160, -50), t: rand(0.6, 1.2), c: pick(['#5b5560', '#8d8496', '#3a3540', '#2a2228']), g: -20 });
        dust(P.x, P.y, 10); G.fx.push({ kind: 'streak', px: true, x0: m.x, y0: m.y, x1: m.x + Math.cos(up) * 90, y1: m.y - 120, t: 0.18, max: 0.18, c: '#ffe0a0' }); }
    } else if (k === 'puffer') {
      if (!R.did.f) { R.did.f = true; const m = flashM(2); (G.wproj = G.wproj || []).push({ k: 'grsPuff', x: m.x, y: P.y + 2, vx: Math.cos(R.a) * 170, vy: Math.sin(R.a) * 130, t: 0, life: 1.7, sz: 1, hitT: new Map(), roll: 0 });
        P.recoil = 2; sfx('shot', 0.8); FXK.burst(m.x, m.y, ['#f0d050', '#4a7a8a', '#ffffff'], 10, 160, 0, false, 0.3); }
    } else if (k === 'match') {
      R.a = lerpAng(R.a, P.ang, dt * 5); P.blade = R.a;
      if (t >= 0.1 && t < 1.15) { const m = muzzle(), a = R.a; if (!R.did.s) { R.did.s = true; sfx('fireball', 0.8); }
        for (let i = 0; i < 5; i++) { const b = a + rand(-0.26, 0.26), sp = rand(180, 300); G.parts.push({ x: m.x, y: m.y, vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.8 - rand(0, 30), t: rand(0.3, 0.45), c: pick(['#ffe060', '#ffb030', '#ff6a20', '#ff3020', '#ffffff']), g: -60, glow: true }); }
        if (Math.random() < 0.5) G.parts.push({ x: m.x + Math.cos(a) * rand(40, 110), y: m.y + Math.sin(a) * rand(30, 80), vx: rand(-20, 20), vy: rand(-60, -30), t: rand(0.5, 0.9), c: pick(['#3a3540', '#5b5560']), g: -20 });
        FXK.light(m.x + Math.cos(a) * 50, m.y + Math.sin(a) * 36, 110, 0.35, '255,140,50', 0.03); P.recoil = 0.6 + Math.random() * 0.4; addShake(0.8, a + Math.PI);
        if ((R.tk = (R.tk || 0) - dt) <= 0) { R.tk = 0.1; for (const e of foes()) { const d = dist(m, e); if (d < 120 + e.r && coneIn(m, e, a, 0.4)) { damageEnemy(e, 0.26, { ang: a, kb: big(e) ? 0 : 40, grogi: 2, gauge: 1, dot: false }); addBurn(e, 3, 0.35); } } sfx('whoosh', 0.5 + rand(0, 0.2)); }
        if ((R.fb = (R.fb || 0) - dt) <= 0) { R.fb = 0.09; const d = rand(40, 115); blast(m.x + Math.cos(a) * d + rand(-8, 8), m.y + Math.sin(a) * d * 0.8 + rand(-6, 6), rand(10, 18)); }
        if ((R.fz = (R.fz || 0) - dt) <= 0) { R.fz = 0.16; const d = rand(50, 110); (G.pfire = G.pfire || []).push({ x: m.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d * 0.8 + 4, t: 2.2, tick: 0 }); } }
    } else if (k === 'undertaker') { const n = Math.floor((t - 0.04) / 0.07);
      if (t >= 0.04 && n < 6 && n !== R.n) { R.n = n; const L = R.tg.filter(live), tg = L.length ? L[n % L.length] : null, side = n % 2 ? 1 : -1, m = flashM(2.2), a0 = R.a + side * 0.5;
        (G.wproj = G.wproj || []).push({ k: 'grsSkull', ph: 'loop', x: m.x, y: m.y, x0: m.x, y0: m.y, a0, side, tg, t: 0, loop: 0.62 + n * 0.03, life: 2.6, hist: [], vx: 0, vy: 0 });
        P.recoil = 1.8; FXK.punch(3, 0.01, 0.02, R.a + Math.PI); blast(m.x, m.y, 10, PAL_G); sfx('shot', 0.8 + n * 0.06); FXK.light(m.x, m.y, 70, 0.6, '110,255,150', 0.1); }
    } else if (k === 'kingrev') {
      // 0~0.42 표식 · 0.45~ 여섯 발
      const L = R.tg; for (let i = 0; i < L.length; i++) { const e = L[i]; if (t > i * 0.06 && !R.did['m' + i]) { R.did['m' + i] = true; if (live(e)) { K.crowns.push({ e, t: 0, i, n: L.filter(x => x === e).length }); FXK.ring(e.x, e.y - 30, '#ffd34d', 100, 0.2, 3); sfx('blip', 1.4 + i * 0.1); } } }
      const n = Math.floor((t - 0.45) / 0.1);
      if (t >= 0.45 && n < L.length && n !== R.n) { R.n = n; const e = L[n], last = n === L.length - 1;
        if (live(e)) { const a = angTo(P, e); R.a = a; P.blade = a; const m = flashM(last ? 2.8 : 1.8, a), c = K.cyl, oa = n / 6 * TAU + (c ? c.t * 7 : 0), ox = P.x + Math.cos(oa) * 22, oy = P.y - 10 + Math.sin(oa) * 12;
          if (c) c.gone.push(n); (G.wproj = G.wproj || []).push({ k: 'grsKing', x: ox, y: oy, tg: e, last, n, t: 0, hist: [], a: Math.atan2(e.y - 12 - oy, e.x - ox) }); blast(m.x, m.y, 10, PAL_Y);
          const ci = K.crowns.findIndex(c => c.e === e); if (ci >= 0) K.crowns.splice(ci, 1);
          P.recoil = last ? 3 : 1.6; FXK.punch(last ? 6 : 3, last ? 0.02 : 0.01, 0.02, a + Math.PI); sfx('shot', 0.9 + n * 0.05); goldCasing(); } }
    }
    if (t >= R.dur) end(P);
  }
  function end(P) { P.state = 'idle'; P.grs = null; P.t = 0; }

  // ---------------------------------------------------------------- 날아가는 것들
  function tick(dt) {
    if (K.g !== G) { K.g = G; K.tr = []; K.marks = []; K.beams = []; K.crowns = []; K.coffins = []; K.cyl = null; K.blasts = []; K.scorch = []; }
    const P = G.player; if (!P) return;
    for (const s of K.tr) s.t -= dt; K.tr = K.tr.filter(s => s.t > 0);
    for (const b of K.blasts) b.t += dt; K.blasts = K.blasts.filter(b => b.t < b.max);
    for (const c of K.scorch) c.t -= dt; K.scorch = K.scorch.filter(c => c.t > 0);
    for (const s of K.beams) s.t -= dt; K.beams = K.beams.filter(s => s.t > 0);
    for (const c of K.crowns) c.t += dt; K.crowns = K.crowns.filter(c => live(c.e) && c.t < 2);
    if (K.cyl) { K.cyl.t += dt; if (K.cyl.t > 1.3 || K.cyl.gone.length >= 6) K.cyl = null; }
    // 포탄 낙하
    for (const M of K.marks) { M.t += dt; if (M.t >= M.land && !M.done) { M.done = true; blast(M.x, M.y - 10, 50, PAL_F, true); boom(M.x, M.y, M.r, 1.6, ['#ffb050', '#fff0c0', '#8a5a30', '#ffffff'], '255,170,80', null);
        FXK.ring(M.x, M.y, '#ffffff', 520, 0.35, 12); FXK.debris(M.x, M.y, 16); FXK.debris(M.x, M.y, 10, ['#ff8a30', '#ffd060', '#5a4a48']); FXK.flash('#fff0c0', 0.07); FXK.punch(12, 0.045, 0.09); 
        (G.pfire = G.pfire || []).push({ x: M.x, y: M.y, t: 2.5, tick: 0 }); for (let i = 0; i < 3; i++) (G.pfire = G.pfire || []).push({ x: M.x + rand(-26, 26), y: M.y + rand(-12, 12), t: 1.8, tick: 0 });
        sfx('blast', 0.6); sfx('heavy', 0.7); sfx('crunch', 0.5); } }
    K.marks = K.marks.filter(M => !M.done || M.t < M.land + 0.05);
    // 관
    for (const C of K.coffins) { C.t += dt;
      if (C.t >= C.land && !C.hit) { C.hit = true; for (const e of foes()) if (Math.hypot(e.x - C.x, (e.y - C.y) / 0.7) < 46 + e.r) { damageEnemy(e, 2.0, { ang: angTo(C, e), kb: big(e) ? 0 : 240, grogi: 16, heavy: true, gauge: 6 }); applySt(e, 'stun', 0.8); }
        FXK.ring(C.x, C.y, '#7aff9a', 280, 0.35, 10); FXK.debris(C.x, C.y, 12); FXK.burst(C.x, C.y - 10, ['#7aff9a', '#30c060', '#d8d0b8'], 12, 220, 0, true, 0.35); FXK.light(C.x, C.y, 150, 0.9, '110,255,150', 0.3); FXK.punch(9, 0.035, 0.08); dust(C.x, C.y, 14); sfx('heavy', 0.7); sfx('crunch', 0.5); }
      if (C.t >= C.land + 0.45 && !C.open) { C.open = true; sfx('awaken', 1.4); FXK.ring(C.x, C.y - 14, '#7aff9a', 160, 0.3, 4); 
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.5; (G.wproj = G.wproj || []).push({ k: 'grsSkull', x: C.x, y: C.y - 18, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, t: 0, life: 2.4, tg: null, hist: [] }); } } }
    K.coffins = K.coffins.filter(C => C.t < C.life);
    tickProj(dt);
  }
  function tickProj(dt) {
    if (!G.wproj || !G.wproj.length) return; const P = G.player;
    for (const w of G.wproj) {
      if (w.k === 'grsHarp') { w.life -= dt; if (w.life <= 0) { w.dead = true; continue; }
        if (!w.stuck) { const st = w.sp * dt, nx = w.x + Math.cos(w.a) * st, ny = w.y + Math.sin(w.a) * st * 0.8; w.d += st;
          if (wallAt(w.x, w.y + 10, nx, ny + 10) || w.d >= w.max) { w.stuck = true; w.life = 1.2; impactHarp(w, true); continue; }
          w.x = nx; w.y = ny; if (Math.random() < 0.7) G.parts.push({ x: w.x, y: w.y, vx: 0, vy: 0, t: 0.25, c: '#d8d0b8', g: 0 });
          for (const e of foes()) { if (w.car.includes(e) || Math.hypot(e.x - w.x, e.y - 10 - w.y) > 10 + e.r) continue;
            if (e.type === 'boss') { if (w.pierced.has(e)) continue; w.pierced.add(e); damageEnemy(e, 2.0, { ang: w.a, kb: 0, grogi: 18, heavy: true, gauge: 6 }); blast(e.x, e.y - 12, 16, PAL_Y); sparks(e.x, e.y - 12, w.a, '#ffffff', 10); continue; }
            w.car.push(e); damageEnemy(e, 0.6, { ang: w.a, kb: 0, grogi: 6, gauge: 2 }); sparks(e.x, e.y - 10, w.a, '#ffffff', 6); sfx('crunch', 1.3); addShake(2, w.a); }
          w.car.forEach((e, i) => { if (!live(e)) return; e.x = w.x - Math.cos(w.a) * (8 + i * 10); e.y = w.y + 10 - Math.sin(w.a) * (8 + i * 10) * 0.8; e.vx = e.vy = 0; if (e.st) e.st.stunT = Math.max(e.st.stunT || 0, 0.2); else e.st = { stunT: 0.2 }; }); } }
      else if (w.k === 'grsDuck') { w.t += dt; w.hop += dt * 3.2; let tg = null, bd = 1e9; for (const e of foes()) { const d = Math.hypot(e.x - w.x, e.y - w.y); if (d < bd && d < 220) { bd = d; tg = e; } }
        if (tg && w.t > 0.15) { const a = Math.atan2(tg.y - w.y, tg.x - w.x); w.vx += (Math.cos(a) * 130 - w.vx) * Math.min(1, dt * 4); w.vy += (Math.sin(a) * 100 - w.vy) * Math.min(1, dt * 4); }
        const ox = w.x, oy = w.y; w.x += w.vx * dt; w.y += w.vy * dt; if (wallAt(ox, oy, w.x, w.y)) { w.x = ox; w.y = oy; w.vx *= -1; w.vy *= -1; } if (Math.abs(w.vx) > 5) w.face = w.vx > 0 ? 1 : -1;
        if (w.hop % 1 < dt * 3.2) { dust(w.x, w.y, 1); if (Math.random() < 0.3) sfx('blip', 1.8 + rand(0, 0.4)); }
        if ((tg && bd < 12 + tg.r) || w.t >= w.life) { w.dead = true; blast(w.x, w.y - 6, 24); boom(w.x, w.y, 38, 0.9, ['#f0c838', '#ffffff', '#f08a2a'], '255,220,90', null); FXK.punch(3, 0.01, 0.02); sfx('blast', 1.3); for (let i = 0; i < 6; i++) G.parts.push({ x: w.x, y: w.y - 6, vx: rand(-140, 140), vy: rand(-200, -80), t: 0.6, c: pick(['#f0c838', '#c09018']), g: 500 }); } }
      else if (w.k === 'grsPuff') { w.t += dt; w.sz = 1 + Math.min(1, w.t / 1.4) * 1.3; w.roll += dt * 10; const R0 = 8 * w.sz;
        const ox = w.x, oy = w.y; w.x += w.vx * dt; w.y += w.vy * dt;
        if (w.x < A.x0 + R0 || w.x > A.x1 - R0 || segSolid(ox, oy, w.x, oy, R0 * 0.6)) { w.x = ox; w.vx *= -1; sfx('blip', 0.8); dust(w.x, w.y, 4); addShake(2, 0); }
        if (w.y < A.y0 + R0 || w.y > A.y1 - 4 || segSolid(w.x, oy, w.x, w.y, R0 * 0.6)) { w.y = oy; w.vy *= -1; sfx('blip', 0.8); dust(w.x, w.y, 4); addShake(2, 0); }
        for (const [e, c] of w.hitT) { if (c - dt <= 0) w.hitT.delete(e); else w.hitT.set(e, c - dt); }
        for (const e of foes()) if (!w.hitT.has(e) && Math.hypot(e.x - w.x, (e.y - w.y) / 0.8) < R0 + e.r) { w.hitT.set(e, 0.3); damageEnemy(e, 0.45, { ang: angTo(w, e), kb: big(e) ? 0 : 200, grogi: 5, gauge: 2 }); sparks(e.x, e.y - 10, angTo(w, e), '#f0d050', 4); sfx('hit', 1.0); }
        if (w.t >= w.life) { w.dead = true; blast(w.x, w.y - 8, 36, PAL_Y, true); FXK.flash('#fff6d0', 0.05); boom(w.x, w.y, 48, 1.0, ['#f0d050', '#ffffff', '#4a7a8a'], '255,230,120', null); FXK.punch(7, 0.03, 0.05); sfx('blast', 1.0);
          for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; G.wproj.push({ k: 'grsSpike', x: w.x, y: w.y - 8, a, t: 0, life: 0.45, hit: new Set() }); } } }
      else if (w.k === 'grsSpike') { w.t += dt; w.x += Math.cos(w.a) * 340 * dt; w.y += Math.sin(w.a) * 260 * dt; if (w.t >= w.life || wallAt(w.x, w.y + 8, w.x, w.y + 8)) { w.dead = true; continue; }
        for (const e of foes()) if (!w.hit.has(e) && Math.hypot(e.x - w.x, e.y - 10 - w.y) < 6 + e.r) { w.hit.add(e); damageEnemy(e, 0.45, { ang: w.a, kb: 60, grogi: 3, gauge: 1 }); } }
      else if (w.k === 'grsKing') { w.t += dt; if (live(w.tg)) { const a = Math.atan2(w.tg.y - 12 - w.y, w.tg.x - w.x); w.a = a; } const sp = 300 + w.t * 1600; w.x += Math.cos(w.a) * sp * dt; w.y += Math.sin(w.a) * sp * dt; w.hist.push({ x: w.x, y: w.y, t: 0.16 }); for (const q of w.hist) q.t -= dt; w.hist = w.hist.filter(q => q.t > 0);
        if (Math.random() < 0.7) G.parts.push({ x: w.x, y: w.y, vx: rand(-20, 20), vy: rand(-20, 20), t: 0.25, c: pick(['#fff2b0', '#ffd34d']), g: 0, glow: true }); FXK.light(w.x, w.y, 40, 0.2, '255,210,90', 0.03);
        const e = w.tg, hitE = live(e) && Math.hypot(e.x - w.x, e.y - 12 - w.y) < 8 + e.r;
        if (hitE || w.t > 0.8 || !live(e)) { w.dead = true; if (hitE) { P.critNext = true; damageEnemy(e, w.last ? 1.4 : 0.9, { ang: w.a, kb: big(e) ? 0 : 100, grogi: 8, heavy: w.last, gauge: 3 }); pop(e.x, e.y - 34, ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ'][w.n], '#ffe080', w.last ? 3 : 2); }
          blast(w.x, w.y, w.last ? 54 : 16, PAL_Y, w.last); FXK.ring(w.x, w.y, '#ffd34d', w.last ? 420 : 180, 0.25, 4); sparks(w.x, w.y, w.a, '#ffd34d', 6); sfx('blast', w.last ? 0.7 : 1.5);
          if (w.last) { boom(w.x, w.y + 12, 58, 1.6, ['#ffd34d', '#fff2b0', '#c9952a', '#ffffff'], '255,210,90', null); FXK.flash('#fff2b0', 0.09); FXK.punch(12, 0.045, 0.1); FXK.rays(w.x, w.y, 16, 90, '#fff2b0', 0.25); sfx('heavy', 0.8); sfx('perfect'); } else FXK.punch(4, 0.012, 0.02); } }
      else if (w.k === 'grsSkull') { w.t += dt; if (!live(w.tg)) { let bd = 1e9; w.tg = null; for (const e of foes()) { const d = Math.hypot(e.x - w.x, e.y - w.y); if (d < bd) { bd = d; w.tg = e; } } }
        const ox = w.x, oy = w.y;
        if (w.ph === 'loop') { const q = Math.min(1, w.t / w.loop), T = w.tg, fa = T ? Math.atan2(T.y - P.y, T.x - P.x) : w.a0, tx = T ? T.x : w.x0 + Math.cos(w.a0) * 160, ty = (T ? T.y : w.y0 + Math.sin(w.a0) * 120) - 12;
          const bx = tx + Math.cos(fa) * ((T ? T.r : 8) + 34), by = ty + Math.sin(fa) * ((T ? T.r : 8) + 34) * 0.8, px = -Math.sin(fa) * w.side, py = Math.cos(fa) * w.side;
          const c1x = w.x0 + Math.cos(w.a0 + w.side * 1.1) * 120, c1y = w.y0 + Math.sin(w.a0 + w.side * 1.1) * 90, c2x = bx + px * 110 + Math.cos(fa) * 60, c2y = by + py * 80 + Math.sin(fa) * 40, u = 1 - q;
          w.x = u * u * u * w.x0 + 3 * u * u * q * c1x + 3 * u * q * q * c2x + q * q * q * bx; w.y = u * u * u * w.y0 + 3 * u * u * q * c1y + 3 * u * q * q * c2y + q * q * q * by;
          if (q >= 1) { w.ph = 'strike'; const a = T ? Math.atan2(ty - w.y, tx - w.x) : fa + Math.PI; w.vx = Math.cos(a) * 520; w.vy = Math.sin(a) * 520; w.t2 = 0; FXK.ring(w.x, w.y, '#7aff9a', 100, 0.15, 3); sfx('whoosh', 1.5); } }
        else { w.t2 += dt; if (live(w.tg)) { const a = Math.atan2(w.tg.y - 12 - w.y, w.tg.x - w.x); w.vx += (Math.cos(a) * 520 - w.vx) * Math.min(1, dt * 10); w.vy += (Math.sin(a) * 520 - w.vy) * Math.min(1, dt * 10); } w.x += w.vx * dt; w.y += w.vy * dt; }
        w.ang = Math.atan2(w.y - oy, w.x - ox); w.hist.push({ x: w.x, y: w.y, t: 0.3 }); for (const q of w.hist) q.t -= dt; w.hist = w.hist.filter(q => q.t > 0);
        if (Math.random() < 0.6) G.parts.push({ x: w.x, y: w.y, vx: rand(-15, 15), vy: rand(-30, -10), t: 0.35, c: pick(['#7aff9a', '#30c060', '#d8ffe0']), g: 0, glow: true });
        FXK.light(w.x, w.y, 44, 0.18, '110,255,150', 0.03);
        const hitE = w.ph === 'strike' && w.tg && Math.hypot(w.tg.x - w.x, w.tg.y - 12 - w.y) < 8 + w.tg.r;
        if (hitE || w.t >= w.life || (w.ph === 'strike' && w.t2 > 0.6)) { w.dead = true;
          if (hitE) { P.critNext = true; damageEnemy(w.tg, 1.15, { ang: Math.atan2(w.vy, w.vx), kb: big(w.tg) ? 0 : 160, grogi: 10, heavy: true, gauge: 4, stagger: 0.4 }); 
            for (const o of foes()) if (o !== w.tg && Math.hypot(o.x - w.x, o.y - 12 - w.y) < 30 + o.r) damageEnemy(o, 0.5, { ang: angTo(w, o), kb: 80, grogi: 4, gauge: 1 }); }
          blast(w.x, w.y, 20, PAL_G); FXK.ring(w.x, w.y, '#7aff9a', 220, 0.25, 5); FXK.burst(w.x, w.y, ['#7aff9a', '#ffffff', '#30c060'], 10, 200, 0, true, 0.3); FXK.punch(4, 0.012, 0.03); sfx('blast', 1.3); sfx('hit', 0.7); } }
    }
    G.wproj = G.wproj.filter(w => !w.dead);
  }
  function impactHarp(w, wall, bigE) {
    const n = w.car.filter(live).length;
    for (const e of w.car) if (live(e)) { damageEnemy(e, wall ? 1.6 : 0.9, { ang: w.a, kb: 0, grogi: 14, heavy: true, gauge: 5 }); applySt(e, 'stun', wall ? 1.5 : 0.7); }
    blast(w.x, w.y + 6, 20 + n * 6, PAL_Y, true); FXK.flash('#fff6e0', 0.05); FXK.ring(w.x, w.y + 6, '#ffffff', 300, 0.3, 8); FXK.burst(w.x, w.y, ['#ffffff', '#d8d0b8', '#8a8e98'], 14, 240, 0, false, 0.35); FXK.debris(w.x, w.y + 10, wall ? 10 : 5); FXK.rays(w.x, w.y, 8, 50, '#e8e0d0', 0.18);
    FXK.punch(wall ? 9 : 5, wall ? 0.035 : 0.015, wall ? 0.08 : 0.03, w.a); FXK.light(w.x, w.y, 120, 0.8, '230,230,240', 0.25); sfx('crunch', 0.7); sfx('heavy', 1.2);
    (n > 1 && pop(w.x, w.y - 30, n + '마리 꽂기!', '#ffffff', 4)); dust(w.x, w.y + 10, 8);
  }

  // ---------------------------------------------------------------- 그리기 (2px 칸)
  function drawGround() {
    for (const c of K.scorch) { const al = Math.min(1, c.t / 1); ctx.globalAlpha = al * 0.8; for (let yy = -c.r; yy <= c.r; yy += 2) for (let xx = -c.r; xx <= c.r; xx += 2) { const e = Math.hypot(xx, yy * 2) / c.r; if (e > 1) continue; const h = Math.sin((xx * 12.9898 + yy * 78.233 + c.seed) * 43758.5) * 0.5 + 0.5; if (h < e * 0.9) continue; dot(c.x + xx, c.y + yy, e < 0.4 ? '#0e0a0c' : '#1e1618'); } ctx.globalAlpha = 1; }
    for (const M of K.marks) { if (M.done) continue; const q = Math.min(1, M.t / M.land), r = M.r * (1.25 - 0.25 * q), n = Math.ceil(r * 1.4), bl = q > 0.7 && Math.floor(M.t * 20) % 2;
      for (let i = 0; i < n; i++) { if (i % 2) continue; const a = i / n * TAU + M.t; dot(M.x + Math.cos(a) * r, M.y + Math.sin(a) * r * 0.55, bl ? '#ffffff' : '#ff8a40'); }
      const ir = r * q; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; dot(M.x + Math.cos(a) * ir, M.y + Math.sin(a) * ir * 0.55, '#c04020'); }
      pxLine(M.x - 4, M.y, M.x + 4, M.y, '#ff8a40'); pxLine(M.x, M.y - 3, M.x, M.y + 3, '#ff8a40'); }
    for (const C of K.coffins) { if (C.t >= C.land) continue; const q = C.t / C.land, w = 6 + q * 12; dshEll(ctx, C.x, C.y, w, 3, 0.5); } /* v3.23 디더 그림자 */
  }
  function drawCoffin(C) { const q = Math.min(1, C.t / C.land), y = C.y - (1 - q * q) * 260, x = snap2(C.x), Y = snap2(y), al = Math.min(1, (C.life - C.t) / 0.4);
    ctx.globalAlpha = al; const sink = C.t > C.life - 0.6 ? Math.round((C.t - (C.life - 0.6)) / 0.6 * 10) * 2 : 0;
    // 관: 위가 넓고 아래가 좁은 육각 (세로 28px)
    const rows = [6, 8, 10, 10, 10, 9, 9, 8, 8, 7, 7, 6, 6, 5]; rows.forEach((hw, i) => { if (i * 2 >= 28 - sink) return; ctx.fillStyle = i === 0 || i === 13 ? '#d8d0b8' : '#0b0a0e'; ctx.fillRect(x - hw - 2, Y - 28 + i * 2 + sink, hw * 2 + 4, 2); ctx.fillStyle = i === 0 ? '#d8d0b8' : i % 4 === 1 ? '#6a4a30' : '#8a6440'; if (i) { ctx.fillRect(x - hw, Y - 28 + i * 2 + sink, hw * 2, 2); ctx.fillStyle = '#a87a4c'; ctx.fillRect(x - hw, Y - 28 + i * 2 + sink, 2, 2); } ctx.fillRect(x - hw, Y - 28 + i * 2 + sink, hw * 2, 2); });
    FXK.light(C.x, y - 14, 60, 0.2, '110,255,150', 0.02); if (!C.open) { ctx.fillStyle = '#e8e8f0'; ctx.fillRect(x - 1, Y - 24 + sink, 2, 12); ctx.fillRect(x - 4, Y - 20 + sink, 8, 2); }
    else { ctx.fillStyle = '#0a0a0c'; ctx.fillRect(x - 6, Y - 24 + sink, 12, 18); ctx.fillStyle = '#7aff9a'; if (Math.floor(C.t * 10) % 2) ctx.fillRect(x - 2, Y - 18 + sink, 4, 2); }
    ctx.globalAlpha = 1; }
  // 금탄 한 발 (2px 칸): 뒤 테 · 놋쇠 몸통(위 밝음 · 아래 어둠) · 은빛 탄두
  function drawRound(x, y, a, sc, dim) { const ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux, L = sc > 0.8 ? 5 : 4;
    for (let i = -L; i <= L; i++) { const cx = x + ux * i * 2, cy = y + uy * i * 2, tip = i >= L - 1, rim = i === -L;
      if (!tip) { dot(cx + px * 2, cy + py * 2, rim ? '#5a4218' : dim ? '#8a6420' : '#fff2b0'); dot(cx - px * 2, cy - py * 2, rim ? '#5a4218' : dim ? '#5a4218' : '#a87a20'); }
      dot(cx, cy, tip ? (i === L ? '#ffffff' : '#e8e8f0') : rim ? '#8a6420' : dim ? '#a87a20' : '#ffd34d'); } }
  // v3.22 폭발끼리 겹치는 칸은 바둑판 디더: 이번 프레임에 이미 다른 폭발이 칠한 칸이면 한 칸 건너 하나만 칠해 뒤 폭발이 비쳐 보이게
  const bdot = (x, y, id, c) => SKD.pd(x, y, id, c); // v3.22 겹침 디더 (41_krs.js SKD.pd 공용)
  function drawBlast(b) { const p = b.t / b.max, s = b.s, R = s * (0.35 + 0.65 * (1 - (1 - p) * (1 - p))), cy = b.y - p * s * 0.3, pal = b.pal, ci = p < 0.1 ? 0 : p < 0.25 ? 1 : p < 0.45 ? 2 : p < 0.65 ? 3 : p < 0.85 ? 4 : 5;
    for (let yy = -R; yy <= R; yy += 2) { const w = Math.sqrt(Math.max(0, R * R - yy * yy)); for (let xx = -w; xx <= w; xx += 2) { const h = Math.sin((xx * 12.9898 + yy * 78.233 + b.seed) * 43758.5) * 0.5 + 0.5, edge = Math.hypot(xx, yy) / R;
      if (p > 0.45 && h < (p - 0.45) * 2.2) continue; bdot(b.x + xx, cy + yy * b.ry, b.seed, pal[edge < 0.55 - p * 0.4 && ci > 0 && ci < 4 ? ci - 1 : ci]); } }
    if (p < 0.5) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + b.seed, r = R + 2 + (i % 3) * 2; bdot(b.x + Math.cos(a) * r, cy + Math.sin(a) * r * b.ry, b.seed, pal[1]); } }
  let SEL = null;
  function drawOver() {
    const P = G.player;
    for (const b of K.blasts) if (b === SEL) drawBlast(b);
    ctx.globalCompositeOperation = 'lighter';
    for (const s of K.tr) { if (s !== SEL) continue; const p = 1 - s.t / s.max; for (let j = 0; j < s.w; j++) pxLine(s.x0 + (s.x1 - s.x0) * p * 0.5, s.y0 + (s.y1 - s.y0) * p * 0.5 + j * 2, s.x1, s.y1 + j * 2, j ? '#c08a40' : s.c); }
    for (const b of K.beams) { if (b !== SEL) continue; const p = 1 - b.t / b.max, w = Math.max(1, Math.round(4 * (1 - p))); for (let j = -w; j <= w; j++) pxLine(b.x0, b.y0 + j * 2, b.x1, b.y1 + j * 2, Math.abs(j) < w - 1 || w === 1 ? '#ffffff' : '#ffd080'); }
    ctx.globalCompositeOperation = 'source-over';
    // 저격 조준선
    if (SEL === 'aim' && P.state === 'grs' && P.grs && P.grs.k === 'longrifle' && P.grs.t < 0.55) { const m = muzzle(), a = P.grs.a, q = P.grs.t / 0.55, n = 90; for (let i = 0; i < n; i++) { if ((i + Math.floor(P.grs.t * 30)) % 3 === 0 && q < 0.8) continue; dot(m.x + Math.cos(a) * i * 6, m.y + Math.sin(a) * i * 6, q > 0.75 && Math.floor(P.grs.t * 24) % 2 ? '#ffffff' : '#ff3020'); } }
    // 작살 줄 · 작살
    for (const w of (G.wproj || [])) { if (w !== SEL) continue;
      if (w.k === 'grsHarp') { const h = w.stuck ? { x: w.ox, y: w.oy } : muzzle(), L = Math.hypot(w.x - h.x, w.y - h.y), n = Math.max(1, Math.floor(L / 3)); ctx.globalAlpha = Math.min(1, w.life / 0.3);
        for (let i = 0; i <= n; i++) { const u = i / n, sag = w.stuck ? Math.sin(u * Math.PI) * 6 : 0; dot(lerp(h.x, w.x, u), lerp(h.y, w.y, u) + sag, i % 3 ? '#d8d0b8' : '#8a7a5a'); }
        const ux = Math.cos(w.a), uy = Math.sin(w.a); pxLine(w.x - ux * 14, w.y - uy * 10, w.x, w.y, '#6b4a2a'); for (const s of [-1, 1]) pxLine(w.x + ux * 6, w.y + uy * 5, w.x - ux * 2 - uy * 5 * s, w.y - uy * 2 + ux * 4 * s, '#d8dce4'); dot(w.x + ux * 6, w.y + uy * 5, '#ffffff');
        ctx.globalAlpha = 1; }
      else if (w.k === 'grsDuck') { const hy = Math.abs(Math.sin(w.hop * Math.PI)) * 10, x = snap2(w.x), y = snap2(w.y - hy), f = w.face;
        dshEll(ctx, x, w.y + 1, 5, 2, 0.5); /* v3.23 디더 그림자 */
        ctx.fillStyle = '#1a120a'; ctx.fillRect(x - 6, y - 8, 12, 8); ctx.fillStyle = '#f0c838'; ctx.fillRect(x - 5, y - 6, 9, 5); ctx.fillStyle = '#c09018'; ctx.fillRect(x - 5, y - 2, 9, 1);
        ctx.fillStyle = '#f0c838'; ctx.fillRect(x + f * 2 - 2, y - 11, 5, 5); ctx.fillStyle = '#1a120a'; ctx.fillRect(x + f * 3, y - 10, 1, 1); ctx.fillStyle = '#f08a2a'; ctx.fillRect(x + (f > 0 ? 5 : -7), y - 9, 2, 2); }
      else if (w.k === 'grsPuff') { const r = Math.round(8 * w.sz / 2) * 2, x = snap2(w.x), y = snap2(w.y - r), fl = w.t > w.life - 0.3 && Math.floor(w.t * 20) % 2;
        dshEll(ctx, x, w.y + 1, r, 3, 0.5); /* v3.23 디더 그림자 */
        for (let yy = -r; yy < r; yy += 2) { const hw = Math.round(Math.sqrt(r * r - (yy + 1) * (yy + 1)) / 2) * 2; ctx.fillStyle = '#2a2010'; ctx.fillRect(x - hw - 2, y + yy, hw * 2 + 4, 2); ctx.fillStyle = fl ? '#ffffff' : yy > r * 0.3 ? '#fff0b0' : '#f0d050'; ctx.fillRect(x - hw, y + yy, hw * 2, 2); }
        const n = 12; for (let i = 0; i < n; i++) { const a = i / n * TAU + w.roll * 0.3; dot(x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3), '#c0a020'); }
        ctx.fillStyle = '#1a120a'; ctx.fillRect(x + (w.vx > 0 ? 2 : -4), y - 4, 2, 2); ctx.fillRect(x + (w.vx > 0 ? 6 : -8), y - 4, 2, 2); ctx.fillStyle = '#c03030'; ctx.fillRect(x + (w.vx > 0 ? 4 : -6), y + 2, 2, 2); }
      else if (w.k === 'grsSpike') { const ux = Math.cos(w.a), uy = Math.sin(w.a); pxLine(w.x - ux * 6, w.y - uy * 5, w.x, w.y, '#f0d050'); dot(w.x, w.y, '#ffffff'); }
      else if (w.k === 'grsKing') { for (const q of w.hist) { ctx.globalAlpha = q.t / 0.16; dot(q.x, q.y, '#ffd34d', 4); } ctx.globalAlpha = 1; drawRound(w.x, w.y, w.a, 1, false); }
      else if (w.k === 'grsSkull') { for (const q of w.hist) { const k = q.t / 0.3; ctx.globalAlpha = k * 0.9; dot(q.x - 1, q.y - 1, k > 0.6 ? '#d8ffe0' : k > 0.3 ? '#7aff9a' : '#30c060', k > 0.5 ? 4 : 2); } ctx.globalAlpha = 1; const x = snap2(w.x), y = snap2(w.y), f = Math.cos(w.ang || 0) >= 0 ? 1 : -1;
        ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 5, y - 5, 10, 10); ctx.fillStyle = '#e8e8ec'; ctx.fillRect(x - 4, y - 4, 8, 6); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4, y - 4, 4, 2);
        ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 3 + (f > 0 ? 1 : 0), y - 2, 2, 2); ctx.fillRect(x + 1 + (f > 0 ? 1 : 0), y - 2, 2, 2); ctx.fillStyle = '#7aff9a'; ctx.fillRect(x - 3 + (f > 0 ? 1 : 0), y - 2, 1, 1); ctx.fillRect(x + 1 + (f > 0 ? 1 : 0), y - 2, 1, 1);
        ctx.fillStyle = '#a8a8b0'; ctx.fillRect(x - 3, y + 2, 6, 2); ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 1, y + 2, 1, 2); ctx.fillRect(x + 1, y + 2, 1, 2); }
    }
    // 포탄 떨어짐
    for (const M of K.marks) { if (M !== SEL || M.done || M.t < M.land - 0.22) continue; const q = (M.t - (M.land - 0.22)) / 0.22, y = M.y - 10 - (1 - q) * 260, X = snap2(M.x), Y = snap2(y);
      for (let j = 0; j < 8; j++) dot(M.x + rand(-3, 3), y - 10 - j * 5, j < 3 ? '#ffe0a0' : j < 6 ? '#ff8a30' : '#5a4a48');
      ctx.fillStyle = '#0b0a0e'; ctx.fillRect(X - 7, Y - 5, 14, 10); ctx.fillRect(X - 5, Y - 7, 10, 14); ctx.fillStyle = '#3a3e48'; ctx.fillRect(X - 5, Y - 5, 10, 10); ctx.fillStyle = '#6a7080'; ctx.fillRect(X - 5, Y - 5, 4, 4); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(X - 3, Y - 3, 2, 2);
      ctx.fillStyle = '#ff7a30'; ctx.fillRect(X - 1, Y - 9, 2, 2); }
    for (const C of K.coffins) if (C === SEL) drawCoffin(C);
    // 왕관 표식
    for (const c of K.crowns) { if (c !== SEL) continue; const e = c.e, x = snap2(e.x), y = snap2(e.y - (e.tall || 30) - 12 - Math.round(Math.sin(c.t * 8))) , s = Math.min(1, c.t / 0.12);
      if (s < 1) { FXK.light(e.x, e.y - 30, 30, 0.3, '255,210,90', 0.02); }
      ctx.fillStyle = '#5a4218'; ctx.fillRect(x - 6, y - 2, 12, 6); ctx.fillStyle = '#ffd34d'; ctx.fillRect(x - 5, y, 10, 3); for (const dx of [-5, -1, 3]) ctx.fillRect(x + dx, y - 4, 2, 4); ctx.fillStyle = '#c03030'; ctx.fillRect(x - 1, y + 1, 2, 1);
      const n = 14; for (let i = 0; i < n; i++) { if ((i + Math.floor(c.t * 16)) % 3 === 0) continue; const a = i / n * TAU; dot(e.x + Math.cos(a) * (e.r + 8), e.y - 10 + Math.sin(a) * (e.r + 8) * 0.6, '#ffd34d'); } }
    // 실린더
    if (SEL === K.cyl && K.cyl && P.state === 'grs') { const c = K.cyl, sp = c.t * 7, ap = Math.min(1, c.t / 0.2), cx = P.x, cy = P.y - 10;
      const RS = []; for (let i = 0; i < 6; i++) { if (c.gone.includes(i)) continue; const a = i / 6 * TAU + sp, r = 22 * ap, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.55; RS.push({ x, y, a, z: Math.sin(a) }); }
      RS.sort((p, q) => p.z - q.z);
      const n = 28; for (let i = 0; i < n; i++) { if ((i + Math.floor(c.t * 30)) % 4 === 0) continue; const a = i / n * TAU - sp * 0.5; dot(cx + Math.cos(a) * 22 * ap, cy + Math.sin(a) * 12 * ap, i % 7 === 0 ? '#ffffff' : '#c9952a'); }
      for (const r of RS) { drawRound(r.x, r.y, Math.atan2(Math.sin(r.a) * 0.55, Math.cos(r.a)), 1, r.z < 0); if (r.z > 0.7 && Math.random() < 0.15) G.parts.push({ x: r.x, y: r.y, vx: 0, vy: -20, t: 0.25, c: '#ffffff', g: 0, glow: true }); }
      FXK.light(cx, cy, 70, 0.15, '255,210,90', 0.03); }
  }

  const _dgg = drawGearGround, gd = SKD.ground(drawGround); drawGearGround = function () { _dgg(); ctx.save(); gd(); ctx.restore(); };
  SKD.add(ents => { if (!G) return; const P = G.player, one = it => SKD.one(drawOver, v => SEL = v, it);
    for (const b of K.blasts) ents.push({ y: b.y + 12, d: one(b) });
    for (const s of K.tr) ents.push({ y: Math.max(s.y0, s.y1) + 12, d: one(s) });
    for (const b of K.beams) ents.push({ y: b.y0 + 12, d: one(b) });
    if (P && P.state === 'grs' && P.grs && P.grs.k === 'longrifle') ents.push({ y: P.y + 1, d: one('aim') });
    for (const w of (G.wproj || [])) if (/^grs/.test(w.k)) ents.push({ y: w.k === 'grsDuck' || w.k === 'grsPuff' ? w.y + 1 : w.y + 12, d: one(w) });
    for (const M of K.marks) ents.push({ y: M.y + 1, d: one(M) });
    for (const C of K.coffins) ents.push({ y: C.y + 1, d: one(C) });
    for (const c of K.crowns) ents.push({ y: c.e.y + 1, d: one(c) });
    if (K.cyl && P) ents.push({ y: P.y + 1, d: one(K.cyl) }); });
  const _ie = itemExtra;
  itemExtra = function (it, cls) { const base = _ie(it, cls); if (!it || it.wk == null || it.cls !== 'gunner') return base;
    const sk = (wcat('gunner')[it.wk] || {}).sk, D = DEF[sk]; if (!D) return base;
    return base + `<div class="fx">우클릭 「${D.n}」 · 쿨타임 ${D.cd}초 — ${D.d}</div>`; };

  return SKD.wrapAll({ start, update, tick, def, DEF, blast, PAL_F, PAL_G, PAL_Y });
})();
;

// ==================================================================== 44_mrs.js
'use strict';
// ==================================================================================================
// 잿빛 왕관 원정대 — 44_mrs.js : v3.22 세리안(마법사) 무기별 우클릭 기술 (41 · 42 · 43과 같은 방식)
//  · 레어 · 유니크 · 레전더리 지팡이는 무기마다 고유한 우클릭 기술을 씀 (커먼 · 초록 지팡이는 기본 「화염구」)
//  · 쿨타임은 무기마다 따로 (KRS.tick) · 효과는 깊이 정렬(SKD)로 장애물 뒤에 가려짐 · 몸 동작은 SKP 공용
//  · 국자 · 거울 지팡이 · 잿빛 별의 홀: 화염구를 바꾸던 고유 효과를 기본 공격 쪽으로 옮김
//  · v3.22b 촛대 · 수정 · 해골 · 피뢰침 · 국자 · 거울 · 잿빛 별 · 모래시계 연출을 크게 다시 만듦
// ==================================================================================================
var MRS = (() => {
  const DEF = {
    candle: { n: '거대 화염구', cd: 10, d: '촛불을 모아 커다란 화염구를 만들어 날립니다. 적이나 벽에 닿으면 크게 폭발하고, 지나간 길과 터진 자리에 불길이 남습니다.' },
    rod: { n: '대어 낚기', cd: 9, d: '찌를 멀리 던져 떨어진 자리의 적을 한꺼번에 낚습니다. 낚인 적은 머리 위로 크게 넘어가 등 뒤 바닥에 내리꽂히고 1초 동안 기절합니다.' },
    crystal: { n: '보석 분출', cd: 10, d: '조준한 자리에서 거대한 보석 기둥이 무더기로 솟구쳐 적을 띄웁니다. 잠시 뒤 보석이 한꺼번에 깨지며 큰 피해를 주고, 조각이 사방으로 튑니다.' },
    broom: { n: '먼지 회오리', cd: 9, d: '빗자루를 타고 앞쪽으로 크게 한 바퀴 돌며 닿는 적을 쳐냅니다. 지나간 길에 먼지 구름이 남고, 돌아오며 바닥을 쓸어 고리 안의 적에게 피해를 줍니다.' },
    skull: { n: '뼈 무덤', cd: 10, d: '조준한 자리의 땅이 갈라지며 둘레로 뼈 가시가 솟구치고, 가운데서 거대한 뼈 가시 무리가 터져 나오며 초록 혼불을 터뜨립니다.' },
    lrod: { n: '연쇄 번개', cd: 11, d: '지팡이에서 굵은 번개를 세 번 내뿜습니다. 번개는 가까운 적에게서 적으로 최대 여섯 번 튀며 피해를 줍니다.' },
    ladle: { n: '수프 대폭발', cd: 10, d: '커다란 수프 덩어리를 던집니다. 떨어진 자리에 넓은 수프 웅덩이가 생겨 적을 태우고 느리게 하며, 내가 밟으면 조금 회복합니다.' },
    mirror: { n: '반사광 난사', cd: 10, d: '거울에서 빛줄기 열두 개를 사방으로 흩뿌립니다. 빛줄기는 크게 휘어 가까운 적을 쫓아가 꽂히며 터지고, 마지막 빛줄기는 더 굵고 크게 터집니다.' },
    ashstar2: { n: '유성우', cd: 11, d: '조준한 곳 주변에 2초 동안 불타는 유성이 쏟아집니다. 마지막에 커다란 잿빛 별이 떨어져 크게 폭발하고 불바다를 남깁니다.' },
    hourglass: { n: '멈춘 초침', cd: 12, d: '조준한 자리에 커다란 황금 시계판을 펼칩니다. 초침이 한 바퀴 돌며 지나가는 적을 멈춰 세우고, 열두 시에 시계판이 깨지며 멈춘 적 모두에게 큰 피해를 줍니다.' },
  };
  for (const k in DEF) SK_META[k] = Object.assign(SK_META[k] || {}, { K: DEF[k].n, KD: DEF[k].d });
  const K = { g: null, zones: [], bolts: [] };
  const def = () => (G && G.cls === 'mage' ? DEF[wSkill()] || null : null);
  const FXK = KRS.FXK, lerp = (a, b, t) => a + (b - a) * t, dot = ARS.dot, pxLine = ARS.pxLine, blast = GRS.blast, PAL_F = GRS.PAL_F, PAL_G = GRS.PAL_G, PAL_Y = GRS.PAL_Y;
  const PAL_B = ['#ffffff', '#e8f4ff', '#9ad8ff', '#4f8dff', '#2a3a6a', '#141a2a'], PAL_SOUP = ['#ffffff', '#ffe0a0', '#e8903a', '#c05a1a', '#5a3a1a', '#2a1a10'];
  const big = e => e.type === 'boss' || isElite(e) || isSemi(e) || isDummy(e);
  const live = e => e && !e.dead && e.type !== 'flag';
  const foes = () => G.enemies.filter(live);
  const inE = (e, x, y, r) => Math.hypot(e.x - x, (e.y - y) / 0.6) < r + e.r;
  const hsh = (a, b, s) => { const v = Math.sin(a * 12.9898 + b * 78.233 + s * 37.719) * 43758.5453; return v - Math.floor(v); };
  const aimPt = (P, maxD) => { let tx, ty; if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; } else { tx = P.x + Math.cos(P.ang) * maxD; ty = P.y + Math.sin(P.ang) * maxD; }
    const d = Math.hypot(tx - P.x, ty - P.y); if (d > maxD) { tx = P.x + (tx - P.x) / d * maxD; ty = P.y + (ty - P.y) / d * maxD; }
    return { x: clamp(tx, A.x0 + 20, A.x1 - 20), y: clamp(ty, A.y0 + 20, A.y1 - 20) }; };
  const zone = o => { o.t = 0; o.hit = o.hit || new Set(); o.did = {}; K.zones.push(o); return o; };
  const castFx = (c, r) => { const tp = staffTip(); G.fx.push({ kind: 'castfx', x: tp.x, y: tp.y, r: r || 26, t: 0.22, max: 0.22, col: c || '#e8c8ff' }); FXK.light(tp.x, tp.y, 90, 0.7, '230,200,255', 0.15); return tp; };
  // 번개 줄기: 들쭉날쭉한 마디 + 곁가지 (굵기 w: 1~3)
  const bolt = (x0, y0, x1, y1, w, t) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(4, Math.round(L / 14)), nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1), pts = [{ x: x0, y: y0 }];
    for (let i = 1; i < n; i++) { const u = i / n, j = rand(-1, 1) * Math.min(14, L * 0.12); pts.push({ x: lerp(x0, x1, u) + nx * j, y: lerp(y0, y1, u) + ny * j }); } pts.push({ x: x1, y: y1 });
    const br = []; for (let i = 1; i < n - 1; i++) if (Math.random() < 0.45) { const p = pts[i], a = Math.atan2(y1 - y0, x1 - x0) + rand(-1.2, 1.2), l = rand(10, 26); br.push([p, { x: p.x + Math.cos(a) * l, y: p.y + Math.sin(a) * l }]); }
    K.bolts.push({ pts, br, w: w || 2, t: t || 0.2, max: t || 0.2 }); };
  const disk = (x, y, r, c, ry) => { const id = SEL ? SKD.oid(SEL) : 0; for (let yy = -r; yy <= r; yy += 2) { const w = Math.sqrt(Math.max(0, r * r - yy * yy)), Y = y + yy * (ry || 1); for (let xx = -w; xx <= w; xx += 2) SKD.pd(x + xx, Y, id, c); } }; // v3.22 겹침 디더
  const ring = (x, y, r, c, gap, ry, off) => { const n = Math.max(8, Math.ceil(r * 1.3)); for (let i = 0; i < n; i++) { if (gap && (i + (off || 0)) % gap === 0) continue; const a = i / n * TAU; dot(x + Math.cos(a) * r, y + Math.sin(a) * r * (ry || 0.6), c); } };
  const star4 = (x, y, s, c) => { for (let i = -s; i <= s; i += 2) { dot(x + i, y, Math.abs(i) < 2 ? '#ffffff' : c); dot(x, y + i, Math.abs(i) < 2 ? '#ffffff' : c); } };

  // ---------------------------------------------------------------- 시작
  function start() {
    const D = def(); if (!D) return false;
    const P = G.player, k = wSkill();
    P.atkAng = P.ang; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.blade = P.ang; P.combo = 0; P.queued = false;
    P.mrs = { k, t: 0, did: {}, dur: 0.5, a: P.ang, hit: new Set() }; const R = P.mrs; P.state = 'mrs';
    if (k === 'candle') { R.dur = 0.62; }
    else if (k === 'rod') { R.dur = 1.15; R.T = aimPt(P, 200); }
    else if (k === 'crystal') { R.dur = 0.45; R.T = aimPt(P, 180); }
    else if (k === 'broom') { R.dur = 1.0; R.c = { x: clamp(P.x + Math.cos(P.ang) * 52, A.x0 + 20, A.x1 - 20), y: clamp(P.y + Math.sin(P.ang) * 40, A.y0 + 20, A.y1 - 20) }; R.a0 = Math.atan2(P.y - R.c.y, P.x - R.c.x); R.sx = P.x; R.sy = P.y; P.iframe = Math.max(P.iframe, 1.0); sfx('whoosh', 0.7); }
    else if (k === 'skull') { R.dur = 0.5; R.T = aimPt(P, 190); }
    else if (k === 'lrod') { R.dur = 1.15; }
    else if (k === 'ladle') { R.dur = 0.45; R.T = aimPt(P, 170); }
    else if (k === 'mirror') { R.dur = 0.95; R.tg = foes().filter(e => dist(P, e) < 280).sort((a, b) => dist(P, a) - dist(P, b)).slice(0, 6); }
    else if (k === 'ashstar2') { R.dur = 0.6; R.T = aimPt(P, 190); }
    else if (k === 'hourglass') { R.dur = 0.5; R.T = aimPt(P, 170); }
    sfx('aim'); return true;
  }

  // ---------------------------------------------------------------- 진행 (몸 · 지팡이)
  function update(dt) {
    const P = G.player, R = P.mrs; if (!R) { P.state = 'idle'; return; }
    R.t += dt; const t = R.t, k = R.k, up = (P.face > 0 ? -80 : -100) * DEG;
    const raise = q => { P.blade = lerpAng(R.a, up, q); }, swing = q => { P.blade = lerpAng(up, R.a, q); };
    if (k === 'candle') { // 지팡이 끝에 불덩이를 모았다가 던짐
      if (t < 0.4) { raise(Math.min(1, t / 0.15)); const tp = staffTip(), q = t / 0.4; R.cr = 4 + q * 14;
        for (let i = 0; i < 3; i++) { const a = rand(0, TAU), r = 30 + rand(0, 20); G.parts.push({ x: tp.x + Math.cos(a) * r, y: tp.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 3, vy: -Math.sin(a) * r * 3, t: 0.3, c: pick(['#ffe060', '#ff8a2a', '#ff3020']), g: 0, glow: true }); }
        FXK.light(tp.x, tp.y, 60 + q * 80, 0.5, '255,150,60', 0.04); if (Math.random() < 0.3) sfx('fireball', 0.6 + q); }
      else { swing(Math.min(1, (t - 0.4) / 0.07)); R.cr = 0;
        if (!R.did.f) { R.did.f = true; const tp = staffTip(), a = R.a; zone({ k: 'fireball', x: tp.x, y: tp.y + 10, a, sp: 250, life: 1.3, r: 18, trail: [] }); FXK.punch(8, 0.03, 0.05, a + Math.PI); blast(tp.x, tp.y, 20); sfx('fireball', 0.5); sfx('blast', 1.4); } }
    } else if (k === 'rod') {
      if (t < 0.12) raise(t / 0.12);
      else if (t < 0.2) { swing((t - 0.12) / 0.08); if (!R.did.f) { R.did.f = true; FXK.punch(3, 0.01, 0.01); sfx('whoosh', 0.9);
        R.Z = zone({ k: 'rod', x: R.T.x, y: R.T.y, sx: P.x, sy: P.y, tp: staffTip(), ph: 'fly', fish: [] }); } }
      else if (R.Z) { const Z = R.Z; // 줄을 당기는 동안 지팡이를 뒤로 젖힘
        if (Z.ph === 'tense') P.blade = R.a + (P.face > 0 ? -1 : 1) * (0.4 + Math.sin(t * 60) * 0.06);
        else if (Z.ph === 'yank' || Z.ph === 'slam') P.blade = lerpAng(R.a + (P.face > 0 ? -1 : 1) * 0.4, R.a + Math.PI * (P.face > 0 ? -1 : 1) * 0.9, Math.min(1, Z.pt / 0.35));
        if (Z.ph === 'yank' && !R.did.y) { R.did.y = true; FXK.punch(6, 0.02, 0.04, R.a + Math.PI); } }
    } else if (k === 'crystal') {
      if (t < 0.14) raise(t / 0.14); else { P.blade = up + Math.sin(t * 40) * 0.05;
        if (!R.did.f) { R.did.f = true; castFx('#c8e8ff'); FXK.punch(7, 0.025, 0.04); zone({ k: 'gems', x: R.T.x, y: R.T.y, gs: [] }); sfx('crunch', 1.5); } }
    } else if (k === 'broom') {
      const L = 0.8, Rr = Math.hypot(R.sx - R.c.x, R.sy - R.c.y) || 50;
      if (t < L) { const q = t / L, a = R.a0 + q * TAU * (P.face > 0 ? 1 : -1), nx = R.c.x + Math.cos(a) * Rr, ny = R.c.y + Math.sin(a) * Rr * 0.8; P.x = nx; P.y = ny;
        const ta = a + Math.PI / 2 * (P.face > 0 ? 1 : -1); P.blade = ta + Math.PI; P.lift = 6;
        if ((R.dc = (R.dc || 0) - dt) <= 0) { R.dc = 0.06; (G.dustC = G.dustC || []).push({ x: P.x, y: P.y, t: 2.2 }); for (let i = 0; i < 4; i++) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(0, 6), vx: rand(-30, 30), vy: rand(-30, -5), t: rand(0.5, 0.9), c: pick(['#a89c90', '#8a8078', '#c8b8a0']), g: -10 }); }
        for (const e of foes()) if (!R.hit.has(e) && Math.hypot(e.x - P.x, (e.y - P.y) / 0.8) < 16 + e.r) { R.hit.add(e); const oa = Math.atan2(e.y - R.c.y, e.x - R.c.x); damageEnemy(e, 0.7, { ang: oa, kb: big(e) ? 0 : 260, grogi: 6, gauge: 3 }); blast(e.x, e.y - 10, 12, ['#ffffff', '#f0e8d8', '#c8b8a0', '#8a8078', '#5a524c', '#2a2624']); FXK.punch(3, 0.01, 0.02, oa); }
        if (Math.random() < 0.4) sfx('whoosh', 1.4 + rand(0, 0.3)); }
      else { P.lift = 0; P.x = R.sx; P.y = R.sy; P.blade = lerpAng(up, R.a, Math.min(1, (t - L) / 0.08));
        if (!R.did.f) { R.did.f = true; const c = R.c; for (const e of foes()) if (inE(e, c.x, c.y, Rr + 4)) { damageEnemy(e, 1.0, { ang: angTo(c, e), kb: big(e) ? 0 : 120, grogi: 8, heavy: true, gauge: 4 }); zoneSlow(e, 0.4); }
          blast(c.x, c.y - 6, 44, ['#ffffff', '#f0e8d8', '#c8b8a0', '#8a8078', '#5a524c', '#2a2624']); FXK.ring(c.x, c.y, '#d8ccb8', 300, 0.35, Rr * 0.5); dust(c.x, c.y, 16); FXK.punch(7, 0.025, 0.05); sfx('heavy', 1.2); } }
    } else if (k === 'skull') {
      if (t < 0.12) raise(t / 0.12); else { P.blade = up + Math.sin(t * 30) * 0.04; if (!R.did.f) { R.did.f = true; castFx('#bfffcf'); zone({ k: 'grave', x: R.T.x, y: R.T.y, sp: [] }); FXK.punch(4, 0.012, 0.02); sfx('warn', 0.6); } }
    } else if (k === 'lrod') { // 번개를 세 번 내뿜음
      R.a = lerpAng(R.a, P.ang, dt * 6); const n = Math.floor((t - 0.08) / 0.34);
      if (t < 0.08) raise(t / 0.08); else { P.blade = R.a + Math.sin(t * 50) * 0.06; if (n < 3 && n !== R.n) { R.n = n; chain(P, R.a, n); } }
    } else if (k === 'ladle') {
      if (t < 0.15) raise(t / 0.15); else { swing(Math.min(1, (t - 0.15) / 0.08)); if (!R.did.f) { R.did.f = true; const tp = castFx('#ffc070'); zone({ k: 'soup', x: R.T.x, y: R.T.y, sx: tp.x, sy: tp.y, r: 82, dur: 5.2 }); FXK.punch(5, 0.015, 0.03); sfx('whoosh', 0.6); } }
    } else if (k === 'mirror') { // 지팡이를 세우고 0.06초마다 유도 빛줄기
      if (t < 0.12) raise(t / 0.12); else { P.blade = up + Math.sin(t * 50) * 0.05; const n = Math.floor((t - 0.12) / 0.055);
        if (n < 12 && n !== R.n) { R.n = n; const tp = staffTip(), L = R.tg.filter(live), tg = L.length ? L[n % L.length] : null, side = n % 2 ? 1 : -1, last = n === 11;
          const a0 = R.a + side * (0.9 + (n % 3) * 0.45) + Math.PI * (n % 4 === 3 ? 0.6 * side : 0);
          zone({ k: 'laser', x0: tp.x, y0: tp.y, x: tp.x, y: tp.y, a0, tg, fx: tp.x + Math.cos(R.a) * 180, fy: tp.y + Math.sin(R.a) * 130, dur: 0.32 + (n % 3) * 0.05, hist: [], last });
          G.fx.push({ kind: 'castfx', x: tp.x, y: tp.y, r: last ? 30 : 18, t: 0.15, max: 0.15, col: '#fff6d0' }); FXK.light(tp.x, tp.y, 90, 0.7, '255,240,190', 0.06); sfx('bolt', 1.5 + (n % 4) * 0.1); if (last) FXK.punch(5, 0.015, 0.03, R.a + Math.PI); else addShake(1.5, R.a + Math.PI); } }
    } else if (k === 'ashstar2') {
      if (t < 0.2) raise(t / 0.2); else { P.blade = up; if (!R.did.f) { R.did.f = true; castFx('#ffd080', 34); FXK.punch(6, 0.02, 0.03); const Z = zone({ k: 'star', x: R.T.x, y: R.T.y, ms: [] });
          for (let i = 0; i < 16; i++) { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * 100; Z.ms.push({ x: clamp(R.T.x + Math.cos(a) * r, A.x0 + 10, A.x1 - 10), y: clamp(R.T.y + Math.sin(a) * r * 0.6, A.y0 + 10, A.y1 - 10), land: 0.4 + i * 0.1, s: rand(4, 7) }); }
          Z.ms.push({ x: R.T.x, y: R.T.y, land: 2.25, big: true, s: 16 }); sfx('awaken', 0.8); } }
    } else if (k === 'hourglass') {
      if (t < 0.15) raise(t / 0.15); else { P.blade = up; if (!R.did.f) { R.did.f = true; castFx('#bfe8ff'); FXK.punch(5, 0.015, 0.03); zone({ k: 'clock', x: R.T.x, y: R.T.y, r: 84, frozen: new Set() }); sfx('reload', 0.6); } }
    }
    if (t >= R.dur) end(P);
  }
  function end(P) { P.state = 'idle'; P.mrs = null; P.t = 0; P.lift = 0; }
  // 연쇄 번개: 지팡이 → 가까운 적 → 그 옆 적 … (최대 6번)
  function chain(P, a, n) { const tp = staffTip(), hit = new Set(); let from = { x: tp.x, y: tp.y }, cur = null;
    let first = foes().filter(e => dist(P, e) < 220 && coneIn(P, e, a, 0.9)).sort((p, q) => dist(P, p) - dist(P, q))[0];
    FXK.flash('#e8f4ff', 0.05); FXK.punch(6 + n * 2, 0.02, 0.04, a + Math.PI); sfx('bolt', 0.8 + n * 0.15); sfx('blast', 1.6);
    if (!first) { const x = P.x + Math.cos(a) * 150, y = P.y + Math.sin(a) * 110; bolt(from.x, from.y, x, y - 6, 3, 0.25); blast(x, y - 6, 20, PAL_B); return; }
    cur = first;
    for (let i = 0; i < 6 && cur; i++) { hit.add(cur); const tx = cur.x, ty = cur.y - 12; bolt(from.x, from.y, tx, ty, i === 0 ? 3 : 2, 0.24); if (i === 0) bolt(from.x, from.y, tx, ty, 1, 0.18);
      damageEnemy(cur, i === 0 ? 0.9 : 0.6, { ang: Math.atan2(ty - from.y, tx - from.x), kb: big(cur) ? 0 : 60, grogi: 5, gauge: 2, stagger: 0.2 }); blast(tx, ty, 16 + (i === 0 ? 8 : 0), PAL_B);
      FXK.light(tx, ty, 110, 0.9, '170,210,255', 0.12); for (let j = 0; j < 6; j++) { const b = rand(0, TAU); G.parts.push({ x: tx, y: ty, vx: Math.cos(b) * rand(80, 200), vy: Math.sin(b) * rand(80, 200), t: 0.2, c: pick(['#ffffff', '#9ad8ff', '#4f8dff']), g: 0, glow: true }); }
      cur.zap = 0.5; from = { x: tx, y: ty }; cur = foes().filter(o => !hit.has(o) && Math.hypot(o.x - tx, o.y - ty) < 150).sort((p, q) => Math.hypot(p.x - tx, p.y - ty) - Math.hypot(q.x - tx, q.y - ty))[0]; } }

  // ---------------------------------------------------------------- 진(陣) · 소환물 진행
  function tick(dt) {
    if (K.g !== G) { K.g = G; K.zones = []; K.bolts = []; }
    if (!G.player) return; const P = G.player;
    for (const b of K.bolts) b.t -= dt; K.bolts = K.bolts.filter(b => b.t > 0);
    for (const e of G.enemies) if (e.zap > 0) { e.zap -= dt; if (Math.random() < 0.35) { const a = rand(0, TAU); K.bolts.push({ pts: [{ x: e.x + Math.cos(a) * 6, y: e.y - 12 + Math.sin(a) * 8 }, { x: e.x + Math.cos(a + 0.8) * 10 + rand(-3, 3), y: e.y - 12 + rand(-8, 8) }, { x: e.x + Math.cos(a + 1.6) * 7, y: e.y - 10 + rand(-6, 6) }], br: [], w: 1, t: 0.06, max: 0.06 }); } }
    for (const Z of K.zones) { Z.t += dt; const t = Z.t;
      if (Z.k === 'fireball') { const sp = Z.sp * (Z.t < 0.15 ? 0.6 : 1), ox = Z.x, oy = Z.y; Z.x += Math.cos(Z.a) * sp * dt; Z.y += Math.sin(Z.a) * sp * dt * 0.8; Z.r = Math.min(22, 18 + t * 4);
        Z.trail.push({ x: Z.x, y: Z.y, t: 0.35 }); for (const q of Z.trail) q.t -= dt; Z.trail = Z.trail.filter(q => q.t > 0);
        for (let i = 0; i < 4; i++) { const a = Z.a + Math.PI + rand(-0.7, 0.7); G.parts.push({ x: Z.x + rand(-8, 8), y: Z.y - 12 + rand(-8, 8), vx: Math.cos(a) * rand(40, 120), vy: Math.sin(a) * rand(40, 120) - 40, t: rand(0.3, 0.55), c: pick(['#ffe060', '#ffb030', '#ff6a20', '#ff3020', '#5a4a48']), g: -40, glow: true }); }
        if ((Z.ft = (Z.ft || 0) - dt) <= 0) { Z.ft = 0.08; (G.pfire = G.pfire || []).push({ x: Z.x, y: Z.y + 2, t: 1.6, tick: 0 }); }
        FXK.light(Z.x, Z.y - 12, 140, 0.35, '255,150,60', 0.03); if (Math.random() < 0.2) addShake(1, 0);
        const hitE = foes().find(e => Math.hypot(e.x - Z.x, (e.y - Z.y) / 0.8) < Z.r + e.r);
        if (hitE || t >= Z.life || segSolid(ox, oy, Z.x, Z.y, 6) || Z.x < A.x0 + 10 || Z.x > A.x1 - 10 || Z.y < A.y0 + 10 || Z.y > A.y1 - 10) { Z.dead = true; const x = Z.x, y = Z.y;
          for (const e of foes()) if (Math.hypot(e.x - x, (e.y - y) / 0.75) < 72 + e.r) damageEnemy(e, 3.0, { ang: angTo({ x, y }, e), kb: big(e) ? 0 : 320, grogi: 20, heavy: true, gauge: 8, stagger: 0.6 });
          for (const e of foes()) addBurn(e, Math.hypot(e.x - x, e.y - y) < 80 ? 3 : 0, 0.4);
          blast(x, y - 12, 74, PAL_F, true); blast(x - 26, y - 4, 34); blast(x + 28, y - 6, 34); blast(x, y - 34, 30);
          FXK.ring(x, y, '#ffffff', 600, 0.4, 14); FXK.ring(x, y, '#ffb040', 420, 0.5, 10); FXK.rays(x, y - 12, 18, 120, '#ffe0a0', 0.3); FXK.debris(x, y, 18, ['#ff8a30', '#ffd060', '#5a4a48', '#2a2228']);
          FXK.flash('#fff0c0', 0.12); FXK.punch(16, 0.06, 0.12); FXK.light(x, y, 260, 1, '255,170,80', 0.5); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; (G.pfire = G.pfire || []).push({ x: x + Math.cos(a) * rand(20, 50), y: y + Math.sin(a) * rand(12, 30), t: 3, tick: 0 }); }
          sfx('blast', 0.5); sfx('heavy', 0.6); sfx('fireball', 0.4); } }
      else if (Z.k === 'rod') { Z.pt = (Z.pt || 0) + dt;
        const tp = staffTip(); Z.lx = tp.x; Z.ly = tp.y;
        if (Z.ph === 'fly') { const q = Math.min(1, t / 0.3); Z.bx = lerp(Z.tp.x, Z.x, q); Z.by = lerp(Z.tp.y, Z.y - 4, q) - Math.sin(q * Math.PI) * 60;
          if (q >= 1) { Z.ph = 'tense'; Z.pt = 0; blast(Z.x, Z.y - 4, 18, PAL_B); FXK.ring(Z.x, Z.y, '#9ad8ff', 220, 0.3, 8); sfx('crunch', 1.6);
            for (const e of foes()) if (inE(e, Z.x, Z.y, 56)) { if (e.type === 'boss') { damageEnemy(e, 1.2, { ang: 0, kb: 0, grogi: 10, heavy: true, gauge: 4 }); continue; } Z.fish.push({ e, x0: e.x, y0: e.y }); damageEnemy(e, 0.4, { ang: angTo(Z, e), kb: 0, grogi: 6, gauge: 2 }); applySt(e, 'stun', 1.2); }
            for (let i = 0; i < 16; i++) { const a = rand(0, TAU); G.parts.push({ x: Z.x, y: Z.y - 4, vx: Math.cos(a) * rand(40, 140), vy: rand(-180, -60), t: rand(0.4, 0.7), c: pick(['#9ad8ff', '#e8f8ff', '#4f8dff']), g: 500 }); } } }
        else if (Z.ph === 'tense') { Z.bx = Z.x + rand(-2, 2); Z.by = Z.y - 4 + rand(-2, 2); for (const f of Z.fish) if (live(f.e)) { f.e.x = f.x0 + rand(-2, 2); } if (Z.pt > 0.28) { Z.ph = Z.fish.length ? 'yank' : 'back'; Z.pt = 0; sfx('whoosh', 0.6); } }
        else if (Z.ph === 'yank') { const q = Math.min(1, Z.pt / 0.42), back = Math.atan2(Z.y - Z.sy, Z.x - Z.sx) + Math.PI;
          Z.fish.forEach((f, i) => { if (!live(f.e)) return; const lx = clamp(Z.sx + Math.cos(back + (i - (Z.fish.length - 1) / 2) * 0.45) * 46, A.x0 + 16, A.x1 - 16), ly = clamp(Z.sy + Math.sin(back + (i - (Z.fish.length - 1) / 2) * 0.45) * 32, A.y0 + 16, A.y1 - 16);
            f.lx = lx; f.ly = ly; f.e.x = lerp(f.x0, lx, q); f.e.y = lerp(f.y0, ly, q) - Math.sin(q * Math.PI) * 70; f.e.vx = f.e.vy = 0; if (Math.random() < 0.5) G.parts.push({ x: f.e.x, y: f.e.y - 10, vx: 0, vy: 30, t: 0.3, c: pick(['#9ad8ff', '#e8f8ff']), g: 200 }); });
          const c = Z.fish.find(f => live(f.e)); if (c) { Z.bx = c.e.x; Z.by = c.e.y - 10; }
          if (q >= 1) { Z.ph = 'slam'; Z.pt = 0; for (const f of Z.fish) { if (!live(f.e)) continue; damageEnemy(f.e, 1.6, { ang: 0, kb: 0, grogi: 16, heavy: true, gauge: 5 }); applySt(f.e, 'stun', 1.0); blast(f.e.x, f.e.y - 6, 22, PAL_B); dust(f.e.x, f.e.y, 8); FXK.debris(f.e.x, f.e.y, 6); }
            FXK.punch(10, 0.04, 0.08); FXK.flash('#e8f8ff', 0.05); sfx('heavy', 0.8); sfx('crunch', 0.6); } }
        else if (Z.ph === 'back') { const q = Math.min(1, Z.pt / 0.25); Z.bx = lerp(Z.x, Z.lx, q); Z.by = lerp(Z.y, Z.ly, q); if (q >= 1) Z.dead = true; }
        else if (Z.ph === 'slam' && Z.pt > 0.3) Z.dead = true;
        if (t > 2.5) Z.dead = true; }
      else if (Z.k === 'gems') { // 거대 보석 무더기: 가운데 큰 기둥 3 + 둘레 9
        if (!Z.gs.length) { const C = ['sap', 'ame', 'eme', 'rub']; Z.gs.push({ x: Z.x, y: Z.y + 4, h: 86, w: 10, c: 'sap', d: 0.1 }, { x: Z.x - 22, y: Z.y + 8, h: 62, w: 8, c: 'ame', d: 0.14, lean: -1 }, { x: Z.x + 22, y: Z.y + 6, h: 66, w: 8, c: 'eme', d: 0.12, lean: 1 }, { x: Z.x - 6, y: Z.y + 14, h: 40, w: 6, c: 'rub', d: 0.16, lean: -0.5 });
          for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, r = 46 + (i % 2) * 10; Z.gs.push({ x: Z.x + Math.cos(a) * r, y: Z.y + Math.sin(a) * r * 0.6, h: 30 + (i % 3) * 10, w: 5 + (i % 2) * 2, c: C[i % 4], d: 0.02 * i, lean: Math.cos(a) > 0 ? 1 : -1 }); } }
        for (const g of Z.gs) if (t >= g.d && !g.up) { g.up = true; blast(g.x, g.y - g.h * 0.3, g.w * 3, PAL_B); FXK.debris(g.x, g.y, 3, ['#5a524c', '#8a7c70']); if (g.h > 40) { FXK.punch(6, 0.02, 0.03); sfx('crunch', 1.2); } }
        if (!Z.did.up) { Z.did.up = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 64)) { damageEnemy(e, 0.9, { ang: -Math.PI / 2, kb: big(e) ? 0 : 60, grogi: 10, heavy: true, gauge: 4 }); applySt(e, 'stun', 0.9); } FXK.ring(Z.x, Z.y, '#c8e8ff', 300, 0.35, 20); FXK.flash('#e8f4ff', 0.05); }
        if (Math.random() < 0.6) { const g = pick(Z.gs); if (g.up) Z.sp = (Z.sp || []).concat([{ x: g.x + rand(-g.w, g.w), y: g.y - rand(4, g.h), t: 0.3 }]); } if (Z.sp) { for (const s of Z.sp) s.t -= dt; Z.sp = Z.sp.filter(s => s.t > 0); }
        FXK.light(Z.x, Z.y - 30, 150, 0.3, '170,210,255', 0.03);
        if (t >= 1.1 && !Z.did.br) { Z.did.br = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 70)) damageEnemy(e, 1.8, { ang: angTo(Z, e), kb: big(e) ? 0 : 240, grogi: 16, heavy: true, gauge: 6 });
          for (const g of Z.gs) blast(g.x, g.y - g.h * 0.5, g.h > 40 ? 30 : 16, PAL_B); blast(Z.x, Z.y - 24, 60, PAL_B, true);
          FXK.flash('#ffffff', 0.1); FXK.punch(14, 0.05, 0.1); FXK.rays(Z.x, Z.y - 24, 18, 120, '#c8e8ff', 0.3); FXK.ring(Z.x, Z.y - 10, '#ffffff', 560, 0.4, 14); sfx('heavy', 1.4); sfx('crunch', 2.0); sfx('perfect');
          for (let i = 0; i < 46; i++) { const a = rand(0, TAU), sp = rand(160, 380); G.parts.push({ x: Z.x + rand(-20, 20), y: Z.y - rand(4, 50), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 140, t: rand(0.5, 0.9), c: pick(['#e8f8ff', '#9ad8ff', '#4f8dff', '#c8a0ff', '#8a5ae0', '#7affc0', '#ff7a9a', '#ffffff']), g: 520, glow: Math.random() < 0.5 }); }
          for (const e of foes()) { const d = Math.hypot(e.x - Z.x, (e.y - Z.y) / 0.6); if (d > 70 && d < 150) damageEnemy(e, 0.6, { ang: angTo(Z, e), kb: 100, grogi: 4, gauge: 1 }); } }
        if (t > 1.15) Z.dead = true; }
      else if (Z.k === 'grave') { // 땅이 갈라지고 거대 해골이 솟아 포효 · 둘레로 뼈 가시
        if (!Z.did.crack) { Z.did.crack = true; for (let i = 0; i < 6; i++) KRS.crack && KRS.crack({ x: Z.x, y: Z.y + 2, ang: i / 6 * TAU, len: 50, t: 1.8, max: 1.8, seed: Math.random() * 99 }); FXK.punch(5, 0.015, 0.02); dust(Z.x, Z.y, 10); }
        const N = 12; for (let i = 0; i < N; i++) if (t >= 0.12 + i * 0.035 && !Z.did['s' + i]) { Z.did['s' + i] = true; const a = i / N * TAU, r = 50 + (i % 2) * 8, x = Z.x + Math.cos(a) * r, y = Z.y + Math.sin(a) * r * 0.6; Z.sp.push({ x, y, t0: t, i, lean: Math.cos(a) });
          for (const e of foes()) if (Math.hypot(e.x - x, (e.y - y) / 0.7) < 18 + e.r && !Z.hit.has(e)) { Z.hit.add(e); damageEnemy(e, 0.7, { ang: angTo(Z, e), kb: big(e) ? 0 : 80, grogi: 8, gauge: 3 }); applySt(e, 'stun', 0.5); }
          FXK.debris(x, y, 3, ['#e8e8ec', '#a8a8b0', '#5a5a64']); dust(x, y, 3); if (i % 3 === 0) { sfx('crunch', 1.1 + i * 0.04); addShake(3, 0); } }
        if (t >= 0.6 && !Z.did.roar) { Z.did.roar = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 62)) damageEnemy(e, 1.7, { ang: angTo(Z, e), kb: big(e) ? 0 : 260, grogi: 16, heavy: true, gauge: 6 });
          blast(Z.x, Z.y - 34, 58, PAL_G, true); blast(Z.x - 30, Z.y - 10, 26, PAL_G); blast(Z.x + 30, Z.y - 10, 26, PAL_G); FXK.ring(Z.x, Z.y - 20, '#7aff9a', 480, 0.4, 12); FXK.rays(Z.x, Z.y - 34, 16, 100, '#bfffcf', 0.3);
          FXK.flash('#d8ffe0', 0.08); FXK.punch(13, 0.05, 0.1); FXK.light(Z.x, Z.y, 220, 1, '110,255,150', 0.4); sfx('roar', 0.7); sfx('heavy', 0.8);
          for (let i = 0; i < 30; i++) { const a = rand(0, TAU); G.parts.push({ x: Z.x, y: Z.y - 34, vx: Math.cos(a) * rand(100, 260), vy: Math.sin(a) * rand(60, 160) - 80, t: rand(0.5, 0.9), c: pick(['#7aff9a', '#30c060', '#d8ffe0', '#ffffff']), g: -40, glow: true }); } }
        if (t < 1.6 && Math.random() < 0.5) G.parts.push({ x: Z.x + rand(-50, 50), y: Z.y + rand(-20, 20), vx: 0, vy: rand(-50, -20), t: 0.6, c: pick(['#30c060', '#2a4a38', '#7aff9a']), g: 0, glow: true });
        FXK.light(Z.x, Z.y - 20, 130, 0.25, '110,255,150', 0.03);
        if (t > 1.7) Z.dead = true; }
      else if (Z.k === 'soup') { // 하나의 커다란 수프 덩어리 → 넓은 웅덩이
        if (t < 0.45) { const q = t / 0.45; Z.bx = lerp(Z.sx, Z.x, q); Z.by = lerp(Z.sy, Z.y, q) - Math.sin(q * Math.PI) * 90;
          if (Math.random() < 0.8) G.parts.push({ x: Z.bx + rand(-6, 6), y: Z.by + rand(-6, 6), vx: 0, vy: 40, t: 0.4, c: pick(['#e8903a', '#c05a1a', '#ffe0a0']), g: 300 }); }
        else { if (!Z.did.land) { Z.did.land = true; for (const e of foes()) if (inE(e, Z.x, Z.y, Z.r)) { damageEnemy(e, 1.4, { ang: angTo(Z, e), kb: big(e) ? 0 : 120, grogi: 12, heavy: true, gauge: 5 }); addBurn(e, 3, 0.4); }
            blast(Z.x, Z.y - 12, 56, PAL_SOUP); blast(Z.x - 40, Z.y, 26, PAL_SOUP); blast(Z.x + 40, Z.y, 26, PAL_SOUP); FXK.ring(Z.x, Z.y, '#ffe0a0', 420, 0.35, 12); FXK.flash('#fff0d0', 0.06); FXK.punch(11, 0.04, 0.08); sfx('heavy', 0.7); sfx('crunch', 0.6);
            for (let i = 0; i < 40; i++) { const a = rand(0, TAU), sp = rand(100, 280); G.parts.push({ x: Z.x, y: Z.y - 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - rand(80, 200), t: rand(0.5, 0.9), c: pick(['#e8903a', '#c05a1a', '#ffe0a0', '#7ab040', '#e87a30']), g: 520 }); } }
          const sp = Math.min(1, (t - 0.45) / 0.25); Z.cr = Z.r * (0.4 + 0.6 * sp);
          if ((Z.tk = (Z.tk || 0) - dt) <= 0) { Z.tk = 0.45; for (const e of foes()) if (inE(e, Z.x, Z.y, Z.cr - 6)) { addBurn(e, 1.2, 0.35); damageEnemy(e, 0.12, { ang: 0, kb: 0, grogi: 1, gauge: 0.5 }); } }
          for (const e of foes()) if (inE(e, Z.x, Z.y, Z.cr - 6)) { e.st = e.st || {}; e.st.hsT = 0.3; e.st.hsK = e.type === 'boss' ? 0.8 : 0.5; }
          if (!P.dead && Math.hypot(P.x - Z.x, (P.y - Z.y) / 0.6) < Z.cr) healPct(0.014 * dt);
          if (Math.random() < 0.4) G.parts.push({ x: Z.x + rand(-Z.cr, Z.cr) * 0.8, y: Z.y + rand(-Z.cr, Z.cr) * 0.4, vx: 0, vy: -20, t: 0.8, c: pick(['#5b5560', '#8d8496']), g: -10 });
          FXK.light(Z.x, Z.y, Z.cr * 1.6, 0.15, '255,170,80', 0.03); }
        if (t > Z.dur) Z.dead = true; }
      else if (Z.k === 'laser') { const q = Math.min(1, t / Z.dur), T = live(Z.tg) ? Z.tg : null, ex = T ? T.x : Z.fx, ey = T ? T.y - 12 : Z.fy;
        const cx = Z.x0 + Math.cos(Z.a0) * 95, cy = Z.y0 + Math.sin(Z.a0) * 70, u = 1 - q, e = q * q * (3 - 2 * q); // 크게 휘어 들어가는 2차 곡선
        Z.y = u * u * Z.y0 + 2 * u * q * cy + q * q * ey; Z.x = u * u * Z.x0 + 2 * u * q * cx + q * q * ex;
        Z.hist.push({ x: Z.x, y: Z.y }); if (Z.hist.length > 9) Z.hist.shift();
        if (Math.random() < 0.6) G.parts.push({ x: Z.x, y: Z.y, vx: rand(-20, 20), vy: rand(-20, 20), t: 0.25, c: pick(['#fff6d0', '#ffd34d', '#bfe8ff']), g: 0, glow: true });
        FXK.light(Z.x, Z.y, 40, 0.25, '255,240,190', 0.03);
        if (q >= 1 && !Z.did.hit) { Z.did.hit = true; Z.end = t;
          if (T) { if (Z.last) P.critNext = true; damageEnemy(T, Z.last ? 1.4 : 0.55, { ang: Math.atan2(ey - cy, ex - cx), kb: big(T) ? 0 : (Z.last ? 160 : 50), grogi: Z.last ? 12 : 4, heavy: Z.last, gauge: 2 }); }
          if (Z.last) for (const o of foes()) if (o !== T && Math.hypot(o.x - ex, o.y - 12 - ey) < 46 + o.r) damageEnemy(o, 0.6, { ang: angTo({ x: ex, y: ey }, o), kb: 100, grogi: 5, gauge: 2 });
          blast(ex, ey, Z.last ? 40 : 14, PAL_Y); for (let i = 0; i < (Z.last ? 14 : 6); i++) { const a = rand(0, TAU), sp = rand(80, 220); G.parts.push({ x: ex, y: ey, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0.25, c: pick(['#ffffff', '#fff6d0', '#bfe8ff']), g: 0, glow: true }); }
          if (Z.last) { FXK.ring(ex, ey + 10, '#fff6d0', 360, 0.35, 10); FXK.rays(ex, ey, 12, 70, '#fff6d0', 0.22); FXK.flash('#fff6d0', 0.06); FXK.punch(8, 0.03, 0.05); sfx('heavy', 1.3); } else { FXK.punch(2, 0.006, 0.01); sfx('hit', 1.6 + rand(0, 0.3)); } }
        if (Z.did.hit && t > Z.end + 0.14) Z.dead = true; }
      else if (Z.k === 'star') {
        for (const m of Z.ms) if (!m.done && t >= m.land) { m.done = true; const r = m.big ? 90 : 34;
          for (const e of foes()) if (inE(e, m.x, m.y, r)) damageEnemy(e, m.big ? 2.6 : 0.75, { ang: angTo(m, e), kb: big(e) ? 0 : (m.big ? 340 : 140), grogi: m.big ? 20 : 6, heavy: true, gauge: m.big ? 8 : 2 });
          blast(m.x, m.y - 10, m.big ? 92 : 36, PAL_F, true); FXK.debris(m.x, m.y, m.big ? 24 : 6, ['#5a4a48', '#8a7a70', '#ff8a30', '#ffd060']); FXK.ring(m.x, m.y, '#ffd080', m.big ? 700 : 260, m.big ? 0.5 : 0.25, m.big ? 18 : 6);
          if (m.big) { blast(m.x - 44, m.y, 40); blast(m.x + 44, m.y, 40); blast(m.x, m.y - 50, 40); FXK.flash('#fff0d0', 0.14); FXK.punch(18, 0.07, 0.14); FXK.rays(m.x, m.y - 10, 20, 150, '#ffe0a0', 0.35); FXK.light(m.x, m.y, 300, 1, '255,180,90', 0.6);
            for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; (G.pfire = G.pfire || []).push({ x: m.x + Math.cos(a) * rand(20, 70), y: m.y + Math.sin(a) * rand(12, 40), t: 3.5, tick: 0 }); } sfx('heavy', 0.5); sfx('blast', 0.5); sfx('perfect'); }
          else { FXK.punch(6, 0.02, 0.03); FXK.light(m.x, m.y, 120, 0.8, '255,170,80', 0.12); (G.pfire = G.pfire || []).push({ x: m.x, y: m.y, t: 1.4, tick: 0 }); sfx('blast', 0.9 + rand(0, 0.5)); } }
        if (t > 2.4) Z.dead = true; }
      else if (Z.k === 'clock') { const SW = 1.3, T0 = 0.25, ha = -Math.PI / 2 + Math.min(1, Math.max(0, t - T0) / SW) * TAU; Z.ha = ha;
        if (t > T0 && t < T0 + SW) for (const e of foes()) { if (Z.frozen.has(e) || !inE(e, Z.x, Z.y, Z.r)) continue; const ea = Math.atan2((e.y - Z.y) / 0.6, e.x - Z.x); if (Math.abs(angDiff(ea, ha)) < 0.2) { Z.frozen.add(e); applySt(e, 'stun', 1.8); damageEnemy(e, 0.5, { ang: 0, kb: 0, grogi: 6, gauge: 2 }); blast(e.x, e.y - 12, 16, PAL_Y); FXK.ring(e.x, e.y - 10, '#ffd34d', 160, 0.25, 4); sfx('reload', 1.6); } }
        if (t > T0 && Math.floor((t - T0) / (SW / 12)) !== Z.lt) { Z.lt = Math.floor((t - T0) / (SW / 12)); if (Z.lt <= 12) { sfx('blip', 1.4 + Z.lt * 0.03); const a = -Math.PI / 2 + Z.lt / 12 * TAU; for (let i = 0; i < 3; i++) G.parts.push({ x: Z.x + Math.cos(a) * Z.r, y: Z.y + Math.sin(a) * Z.r * 0.6, vx: Math.cos(a) * 40, vy: -40, t: 0.4, c: pick(['#ffd34d', '#fff2b0']), g: 0, glow: true }); } }
        if (t < T0 + SW) FXK.light(Z.x, Z.y, 180, 0.25, '255,220,140', 0.03);
        if (t >= T0 + SW && !Z.did.chime) { Z.did.chime = true; for (const e of Z.frozen) if (live(e)) { damageEnemy(e, 2.0, { ang: 0, kb: 0, grogi: 18, heavy: true, gauge: 7 }); blast(e.x, e.y - 12, 32, PAL_Y); }
          for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i / 12 * TAU; blast(Z.x + Math.cos(a) * Z.r, Z.y + Math.sin(a) * Z.r * 0.6, 14, i % 2 ? PAL_B : PAL_Y); }
          for (let i = 0; i < 4; i++) FXK.ring(Z.x, Z.y, i % 2 ? '#bfe8ff' : '#ffd34d', 260 + i * 120, 0.35 + i * 0.08, Z.r * 0.5); FXK.flash('#fff6d8', 0.12); FXK.punch(14, 0.05, 0.1); FXK.rays(Z.x, Z.y, 24, 140, '#ffe8a0', 0.3); sfx('perfect'); sfx('heavy', 1.4);
          for (let i = 0; i < 40; i++) { const a = rand(0, TAU), sp = rand(120, 300); G.parts.push({ x: Z.x + Math.cos(a) * Z.r * 0.8, y: Z.y + Math.sin(a) * Z.r * 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 100, t: rand(0.5, 0.9), c: pick(['#ffd34d', '#c9952a', '#fff2b0', '#9ad8ff', '#ffffff']), g: 420 }); } }
        if (t > T0 + SW + 0.3) Z.dead = true; }
    }
    K.zones = K.zones.filter(Z => !Z.dead);
  }
  const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, u = clamp(((px - ax) * dx + (py - ay) * dy) / L, 0, 1); return Math.hypot(px - ax - dx * u, py - ay - dy * u); };

  // ---------------------------------------------------------------- 그리기 (2px 칸)
  let SEL = null;
  const GEM = { sap: ['#e8f4ff', '#9ad8ff', '#4f8dff', '#24408a'], ame: ['#f6e8ff', '#c8a0ff', '#8a5ae0', '#3a2470'], eme: ['#e8fff0', '#7affc0', '#2ab070', '#105a38'], rub: ['#ffe8ee', '#ff7a9a', '#d02848', '#6a1024'] };
  // 보석 기둥: 육각 기둥 (왼쪽 밝은 면 · 가운데 · 오른쪽 어두운 면) + 뾰족한 머리 + 반짝임
  // 보석 기둥: 육각 기둥 세 면(밝음 · 중간 · 어둠) + 세 갈래 깎인 머리 + 안쪽 굴절 빛줄기 + 제 빛깔 테두리 · 위로 갈수록 밝아짐
  function drawGem(x, y, h, w, c, lean, q, flash) { const P = GEM[c], H = Math.round(h * q / 2) * 2, Y = snap2(y), W = w * 2, tipH = Math.round(W * 0.9 / 2) * 2 + 2; if (H < 4) return;
    const sx0 = i => snap2(x + lean * i * 0.18), rowW = i => i > H - tipH ? Math.max(2, Math.round((H - i) / tipH * w) * 2) : W;
    // 테두리 (가장 어두운 제 빛깔) 한 칸 바깥
    for (let i = -2; i < H + 2; i += 2) { const ii = clamp(i, 0, H - 2), ww = rowW(ii), sx = sx0(ii) - ww / 2; ctx.fillStyle = i < 0 ? '#0b0a14' : P[3]; ctx.fillRect(sx - 2, Y - i, ww + 4, 2); }
    for (let i = 0; i < H; i += 2) { const k = i / H, ww = rowW(i), sx = sx0(i) - ww / 2, tip = i > H - tipH, t3 = Math.max(2, Math.round(ww / 3 / 2) * 2), mid = Math.max(0, ww - t3 * 2);
      const L = flash ? '#ffffff' : k > 0.45 ? P[0] : P[1], M = flash ? P[0] : k > 0.7 ? P[0] : k > 0.25 ? P[1] : (i % 4 ? P[1] : P[2]), Rr = flash ? P[1] : k > 0.5 ? P[2] : P[3];
      if (tip) { const half = ww / 2; ctx.fillStyle = L; ctx.fillRect(sx, Y - i, half, 2); ctx.fillStyle = Rr; ctx.fillRect(sx + half, Y - i, half, 2); if (ww > 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(sx + half - 2, Y - i, 2, 2); } continue; }
      ctx.fillStyle = L; ctx.fillRect(sx, Y - i, t3, 2); ctx.fillStyle = M; ctx.fillRect(sx + t3, Y - i, mid, 2); ctx.fillStyle = Rr; ctx.fillRect(sx + ww - t3, Y - i, t3, 2);
      if (i === H - tipH - 2 || i === H - tipH) { ctx.fillStyle = '#ffffff'; ctx.fillRect(sx, Y - i, ww - 2, 2); } } // 머리와 몸 사이 깎인 선
    // 굴절 빛줄기 두 개 (비스듬)
    for (const [o, len] of [[0.25, 0.3], [0.55, 0.2]]) { const i0 = Math.round(H * o / 2) * 2; for (let j = 0; j < len * H; j += 2) { const i = i0 + j, ww = rowW(i); if (i > H - tipH) break; const sx = sx0(i) - ww / 2 + 2 + Math.round((j / (len * H)) * (ww - 6) / 2) * 2; ctx.fillStyle = j % 4 ? P[0] : '#ffffff'; ctx.fillRect(sx, Y - i, 2, 2); } }
    ctx.fillStyle = '#ffffff'; ctx.fillRect(sx0(H - tipH - 4) - W / 2, Y - (H - tipH - 4), 2, Math.min(10, H - tipH)); }
  // 보석 아래 작은 결정 조각 무리
  function drawShards(x, y, c, q, seed) { const P = GEM[c]; for (let i = 0; i < 3; i++) { const dx = (hsh(seed, i, 1) - 0.5) * 22, h = (6 + hsh(seed, i, 2) * 10) * q, ln = dx > 0 ? 1.4 : -1.4; drawGem(x + dx, y + 2 + i, h, 2, c, ln, 1); } }
  function drawBoneSpike(x, y, h, lean) { const X = snap2(x), Y = snap2(y); if (h < 2) return;
    for (let i = 0; i < h; i += 2) { const k = i / h, w = k > 0.8 ? 2 : k > 0.5 ? 4 : 6, sx = X + Math.round(lean * k * k * 10 / 2) * 2 - w / 2; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(sx - 2, Y - i - 2, w + 4, 4); }
    for (let i = 0; i < h; i += 2) { const k = i / h, w = k > 0.8 ? 2 : k > 0.5 ? 4 : 6, sx = X + Math.round(lean * k * k * 10 / 2) * 2 - w / 2; ctx.fillStyle = '#e8e4d8'; ctx.fillRect(sx, Y - i, w, 2); ctx.fillStyle = '#a8a49a'; ctx.fillRect(sx + w - 2, Y - i, 2, 2); if (i % 8 === 6 && k < 0.7) { ctx.fillStyle = '#c8c4b8'; ctx.fillRect(sx - 2, Y - i, w + 4, 2); } } }
  // 거대 해골 (가로 28 · 세로 26칸 정도): 땅에서 솟음 · 턱이 열리며 초록 혼불
  function drawBigSkull(x, y, rise, jaw, t) { const X = snap2(x), Y = snap2(y - rise), C = '#e8e4d8', D = '#a8a49a', K2 = '#0b0a0e';
    ctx.save(); ctx.beginPath(); ctx.rect(X - 60, Y - 80, 120, Math.max(0, snap2(y) - (Y - 80) + 2)); ctx.clip();
    const rows = [[-8, 8], [-12, 12], [-14, 14], [-14, 14], [-14, 14], [-14, 14], [-13, 13], [-12, 12], [-10, 10], [-9, 9], [-8, 8]];
    rows.forEach(([a, b], i) => { const yy = Y - 40 + i * 2 * 2; ctx.fillStyle = K2; ctx.fillRect(X + a * 2 - 2, yy - 2, (b - a) * 2 + 4, 6); });
    rows.forEach(([a, b], i) => { const yy = Y - 40 + i * 2 * 2; ctx.fillStyle = i < 2 ? '#ffffff' : C; ctx.fillRect(X + a * 2, yy, (b - a) * 2, 4); ctx.fillStyle = D; ctx.fillRect(X + b * 2 - 6, yy, 6, 4); });
    // 눈구멍 + 혼불
    for (const s of [-1, 1]) { ctx.fillStyle = K2; ctx.fillRect(X + s * 10 - 6, Y - 26, 12, 10); const fl = Math.floor(t * 12 + (s > 0 ? 1 : 0)) % 2; ctx.fillStyle = '#30c060'; ctx.fillRect(X + s * 10 - 4, Y - 24, 8, 6); ctx.fillStyle = '#d8ffe0'; ctx.fillRect(X + s * 10 - 2, Y - 22 - fl * 2, 4, 4); }
    ctx.fillStyle = K2; ctx.fillRect(X - 2, Y - 14, 4, 6); // 코
    // 윗니 · 턱
    ctx.fillStyle = K2; ctx.fillRect(X - 14, Y - 6, 28, 4); for (let i = -12; i <= 10; i += 4) { ctx.fillStyle = C; ctx.fillRect(X + i, Y - 6, 2, 4); }
    const jy = Y - 2 + jaw; ctx.fillStyle = K2; ctx.fillRect(X - 14, jy - 2, 28, 10); ctx.fillStyle = C; ctx.fillRect(X - 12, jy, 24, 6); ctx.fillStyle = D; ctx.fillRect(X + 6, jy, 6, 6); for (let i = -10; i <= 10; i += 4) { ctx.fillStyle = K2; ctx.fillRect(X + i, jy, 2, 2); }
    if (jaw > 2) { ctx.fillStyle = '#30c060'; ctx.fillRect(X - 10, Y - 2, 20, jaw); ctx.fillStyle = '#d8ffe0'; ctx.fillRect(X - 6, Y, 12, Math.max(0, jaw - 4)); }
    ctx.restore(); }
  function drawGround() {
    for (const Z of K.zones) { const t = Z.t;
      if (Z.k === 'gems') { const al = Math.min(1, t / 0.1); ctx.globalAlpha = al; // 바닥: 결정이 번진 서리 무늬 + 갈라진 틈 + 두 겹 고리
        for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + 0.2; let px = Z.x, py = Z.y; for (let j = 1; j <= 6; j++) { const r = j * 11, nx = Z.x + Math.cos(a + (hsh(i, j, 4) - 0.5) * 0.4) * r, ny = Z.y + Math.sin(a + (hsh(i, j, 4) - 0.5) * 0.4) * r * 0.6; pxLine(px, py, nx, ny, j < 3 ? '#e8f4ff' : j < 5 ? '#9ad8ff' : '#4f8dff'); if (j % 2 === 0) { const ba = a + (hsh(i, j, 5) > 0.5 ? 0.7 : -0.7); pxLine(nx, ny, nx + Math.cos(ba) * 8, ny + Math.sin(ba) * 5, '#9ad8ff'); } px = nx; py = ny; } }
        ring(Z.x, Z.y, 70, '#c8e8ff', 3, 0.6, Math.floor(t * 12)); ring(Z.x, Z.y, 76, '#4f8dff', 2, 0.6, -Math.floor(t * 12)); ctx.globalAlpha = 1; }
      else if (Z.k === 'grave') { const al = Math.min(1, t / 0.15, (1.7 - t) / 0.4); ctx.globalAlpha = al; for (let yy = -40; yy <= 40; yy += 2) for (let xx = -70; xx <= 70; xx += 2) { const e = Math.hypot(xx / 70, yy / 40); if (e > 1) continue; if (hsh(xx, yy, 7) < e * 1.1 - 0.2) continue; dot(Z.x + xx, Z.y + yy * 0.6 / 0.6 * 0.6, e < 0.5 ? '#0e1a12' : '#1a2a1e'); } ring(Z.x, Z.y, 66, '#30c060', 3, 0.6, Math.floor(t * 10)); ctx.globalAlpha = 1; }
      else if (Z.k === 'soup' && Z.cr) { const r = Z.cr, al = Math.min(1, (Z.dur - t) / 0.6); ctx.globalAlpha = al;
        for (let yy = -r; yy <= r; yy += 2) for (let xx = -r; xx <= r; xx += 2) { const e = Math.hypot(xx, yy) / r + (hsh(Math.round(Math.atan2(yy, xx) * 6), 0, 1) - 0.5) * 0.12; if (e > 1) continue; const edge = e > 0.86, h = hsh(xx, yy, 2);
          dot(Z.x + xx, Z.y + yy * 0.6, edge ? (h > 0.5 ? '#5a3a1a' : '#8a4a1a') : e > 0.7 ? '#c05a1a' : h > 0.94 ? '#7ab040' : h > 0.9 ? '#e8a060' : (Math.floor(t * 3 + h * 4) % 4 === 0 && h > 0.7) ? '#f0a050' : '#e8903a'); }
        for (let i = 0; i < 10; i++) { const ph = (t * 1.3 + i * 0.37) % 1, a = hsh(i, 3, 3) * TAU, rr = hsh(i, 4, 4) * r * 0.75, bx = Z.x + Math.cos(a) * rr, by = Z.y + Math.sin(a) * rr * 0.6; if (ph < 0.7) ring(bx, by, 2 + ph * 6, ph > 0.5 ? '#ffe0a0' : '#f0b070', 0, 0.6); else dot(bx, by - 2, '#fff0d0'); }
        ctx.globalAlpha = 1; }
      else if (Z.k === 'star') for (const m of Z.ms) { if (m.done) continue; const q = Math.min(1, t / m.land), r = (m.big ? 80 : 26) * (1.2 - 0.2 * q); ring(m.x, m.y, r, q > 0.85 && Math.floor(t * 24) % 2 ? '#ffffff' : '#ff6a30', 2, 0.55); if (m.big) ring(m.x, m.y, r * 0.6, '#ffb040', 3, 0.55, Math.floor(t * 12)); }
      else if (Z.k === 'clock') { const al = Math.min(1, t / 0.25, (0.25 + 1.3 + 0.3 - t) / 0.3), r = Z.r * Math.min(1, t / 0.25); ctx.globalAlpha = al * 0.55;
        for (let yy = -r; yy <= r; yy += 2) { const w = Math.sqrt(Math.max(0, r * r - yy * yy)); for (let xx = -w; xx <= w; xx += 2) if (((xx + yy) / 2) % 2 === 0) dot(Z.x + xx, Z.y + yy * 0.6, Math.hypot(xx, yy) < r * 0.6 ? '#141a3a' : '#1e2a5a'); }
        ctx.globalAlpha = al;
        // 두 겹 금테 + 바깥 톱니
        ring(Z.x, Z.y, r, '#ffd34d', 0, 0.6); ring(Z.x, Z.y, r - 2, '#c9952a', 0, 0.6); ring(Z.x, Z.y, r - 10, '#ffd34d', 2, 0.6); const nT = 36; for (let i = 0; i < nT; i++) { const a = i / nT * TAU + t * 0.6; if (i % 2) continue; dot(Z.x + Math.cos(a) * (r + 4), Z.y + Math.sin(a) * (r + 4) * 0.6, '#c9952a', 4); }
        for (let i = 0; i < 60; i++) { const a = -Math.PI / 2 + i / 60 * TAU, big5 = i % 5 === 0, r0 = big5 ? r - 20 : r - 14; pxLine(Z.x + Math.cos(a) * r0, Z.y + Math.sin(a) * r0 * 0.6, Z.x + Math.cos(a) * (r - 12), Z.y + Math.sin(a) * (r - 12) * 0.6, big5 ? (i % 15 === 0 ? '#ffffff' : '#ffd34d') : '#5a6aa8'); }
        // 작은 톱니바퀴 두 개
        for (const [ox, oy, gr, sp] of [[-0.45, -0.2, 12, 2], [0.4, 0.25, 9, -3]]) { const gx = Z.x + ox * r, gy = Z.y + oy * r * 0.6; ring(gx, gy, gr, '#8a6a26', 0, 0.6); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * sp; dot(gx + Math.cos(a) * (gr + 3), gy + Math.sin(a) * (gr + 3) * 0.6, '#c9952a'); } }
        if (Z.ha != null) { // 초침 + 지나간 부채꼴 잔광
          const T0 = 0.25, sweep = Math.min(TAU, Math.max(0, t - T0) / 1.3 * TAU);
          for (let a = -Math.PI / 2; a < -Math.PI / 2 + sweep; a += 0.05) { const k = (a - (-Math.PI / 2 + sweep)) / 1.2; if (k < -1) continue; ctx.globalAlpha = al * Math.max(0, 1 + k) * 0.5; pxLine(Z.x, Z.y, Z.x + Math.cos(a) * (r - 16), Z.y + Math.sin(a) * (r - 16) * 0.6, '#ffd34d'); }
          ctx.globalAlpha = al; for (const w of [2, 0]) pxLine(Z.x + w, Z.y, Z.x + Math.cos(Z.ha) * (r - 8) + w, Z.y + Math.sin(Z.ha) * (r - 8) * 0.6, w ? '#c9952a' : '#ffffff');
          const ha2 = -Math.PI / 2 + sweep / 12; pxLine(Z.x, Z.y, Z.x + Math.cos(ha2) * r * 0.45, Z.y + Math.sin(ha2) * r * 0.45 * 0.6, '#ffd34d'); }
        dot(Z.x - 4, Z.y - 4, '#ffd34d', 8); dot(Z.x - 2, Z.y - 2, '#ffffff', 4); ctx.globalAlpha = 1; }
    }
  }
  function drawOver() { const P = G.player;
    for (const b of K.bolts) if (b === SEL) { const p = 1 - b.t / b.max, fl = Math.floor(b.t * 60) % 2;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 1; i < b.pts.length; i++) { const a = b.pts[i - 1], c = b.pts[i]; if (b.w >= 2) for (const o of [-4, -2, 2, 4]) pxLine(a.x + o * (b.w > 2 ? 1 : 0.5), a.y + o * 0.5, c.x + o * (b.w > 2 ? 1 : 0.5), c.y + o * 0.5, '#2a4a9a'); if (b.w >= 2) for (const o of [-2, 2]) pxLine(a.x + o * 0.5, a.y, c.x + o * 0.5, c.y, '#4f8dff'); pxLine(a.x, a.y, c.x, c.y, fl ? '#ffffff' : '#c8e8ff'); }
      for (const [a, c] of b.br) { pxLine(a.x, a.y, c.x, c.y, '#9ad8ff'); }
      ctx.restore(); }
    for (const Z of K.zones) { if (Z !== SEL) continue; const t = Z.t;
      if (Z.k === 'fireball') { for (const q of Z.trail) { const k = q.t / 0.35; disk(q.x, q.y - 12, Z.r * k * 0.8, k > 0.6 ? '#ffb030' : k > 0.3 ? '#ff6a20' : '#a3161c', 0.85); }
        const r = Z.r + Math.round(Math.sin(t * 30)) * 2; disk(Z.x, Z.y - 12, r + 2, '#2a0a08', 0.9); disk(Z.x, Z.y - 12, r, '#c02010', 0.9); disk(Z.x, Z.y - 12, r - 4, '#ff6a20', 0.9); disk(Z.x, Z.y - 12, r - 8, '#ffb030', 0.9); disk(Z.x, Z.y - 12, r - 12, '#ffe060', 0.9); disk(Z.x + 2, Z.y - 14, Math.max(2, r - 15), '#ffffff', 0.9);
        for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 8, rr = r + 2 + hsh(i, Math.floor(t * 20), 1) * 6; dot(Z.x + Math.cos(a) * rr, Z.y - 12 + Math.sin(a) * rr * 0.9, i % 2 ? '#ffb030' : '#ff3020', 4); } }
      else if (Z.k === 'gems') { const gs = Z.gs.slice().sort((a, b) => a.y - b.y); const br = Z.did.br, fl = t > 0.85 && Math.floor(t * 24) % 2 === 0;
        if (!br) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const g of gs) if (g.up) { const P = GEM[g.c]; ctx.globalAlpha = 0.1 + Math.sin(t * 9 + g.x) * 0.04; disk(g.x, g.y - g.h * 0.45, g.w * 2 + 8, P[2], 1.6); } ctx.restore(); ctx.globalAlpha = 1; }
        for (const g of gs) { if (!g.up || br) continue; const q = Math.min(1, (t - g.d) / 0.1), ov = q < 1 ? q * 1.25 : 1 + Math.max(0, 0.15 - (t - g.d - 0.1)); drawShards(g.x, g.y, g.c, Math.min(1, q * 1.5), g.x * 3.1); drawGem(g.x, g.y, g.h * Math.min(ov, 1.2), g.w, g.c, g.lean || 0, 1, fl); }
        if (!br && t > 0.85) for (const g of gs) if (g.up) { let x = g.x, y = g.y - g.h * 0.2; for (let j = 0; j < 5; j++) { const nx = x + (hsh(g.x, j, 9) - 0.5) * g.w * 2, ny = y - g.h * 0.14; pxLine(x, y, nx, ny, '#ffffff'); x = nx; y = ny; } }
        if (Z.sp) for (const s of Z.sp) star4(s.x, s.y, s.t > 0.15 ? 4 : 2, '#c8e8ff');
        if (t > 0.9 && !Z.did.br && Math.floor(t * 24) % 2) for (const g of Z.gs) if (g.up) pxLine(g.x - 3, g.y - g.h * 0.3, g.x + 3, g.y - g.h * 0.6, '#ffffff'); }
      else if (Z.k === 'rod' && Z.bx != null) { const n = Math.max(1, Math.floor(Math.hypot(Z.bx - Z.lx, Z.by - Z.ly) / 3)); for (let i = 0; i <= n; i++) { const u = i / n, sag = Z.ph === 'fly' || Z.ph === 'back' ? Math.sin(u * Math.PI) * 8 : 0; dot(lerp(Z.lx, Z.bx, u), lerp(Z.ly, Z.by, u) + sag, '#e8e8ec'); }
        if (Z.ph !== 'yank') { const X = snap2(Z.bx), Y = snap2(Z.by); ctx.fillStyle = '#0b0a0e'; ctx.fillRect(X - 3, Y - 5, 6, 10); ctx.fillStyle = '#e83030'; ctx.fillRect(X - 2, Y - 4, 4, 4); ctx.fillStyle = '#ffffff'; ctx.fillRect(X - 2, Y, 4, 4); } }
      else if (Z.k === 'grave') { const sk = Z.sp.slice().sort((a, b) => a.y - b.y), fade = t > 1.2 ? Math.max(0, 1 - (t - 1.2) / 0.5) : 1;
        const rise = Math.min(1, Math.max(0, t - 0.15) / 0.4), jaw = t > 0.5 ? Math.min(10, (t - 0.5) * 60) * (t < 1.1 ? 1 : Math.max(0, 1 - (t - 1.1) / 0.3)) : 0;
        const back = sk.filter(s => s.y <= Z.y), front = sk.filter(s => s.y > Z.y);
        ctx.globalAlpha = fade; for (const s of back) drawBoneSpike(s.x, s.y, Math.round(Math.min(1, (t - s.t0) / 0.07) * (26 + (s.i % 3) * 8) / 2) * 2, s.lean);
        if (t > 0.5) { const q = Math.min(1, (t - 0.5) / 0.08), over = q < 1 ? q * 1.2 : 1 + Math.max(0, 0.1 - (t - 0.58)) ; // 가운데 거대 뼈 가시 무리
          for (const [dx, dy, h, ln] of [[-14, -6, 44, -1], [14, -4, 48, 1], [0, -10, 64, 0], [-24, 4, 32, -1.5], [24, 6, 34, 1.5], [-6, 8, 40, -0.5], [8, 10, 38, 0.6]]) drawBoneSpike(Z.x + dx, Z.y + dy, Math.round(h * over * fade / 2) * 2, ln * 1.2); }
        for (const s of front) drawBoneSpike(s.x, s.y, Math.round(Math.min(1, (t - s.t0) / 0.07) * (26 + (s.i % 3) * 8) / 2) * 2, s.lean); ctx.globalAlpha = 1; }
      else if (Z.k === 'soup' && t < 0.45) { const r = 12 + Math.round(Math.sin(t * 30)); disk(Z.bx, Z.by, r + 2, '#2a1a10', 0.85); disk(Z.bx, Z.by, r, '#c05a1a', 0.85); disk(Z.bx, Z.by, r - 3, '#e8903a', 0.85); disk(Z.bx - 3, Z.by - 3, 4, '#ffe0a0', 0.85); dot(Z.bx + 4, Z.by + 2, '#7ab040', 4); dot(Z.bx - 6, Z.by + 4, '#e87a30', 4); }
      else if (Z.k === 'laser') { const H = Z.hist, n = H.length, fade = Z.did.hit ? Math.max(0, 1 - (t - Z.end) / 0.14) : 1; if (n < 2) continue; ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 1; i < n; i++) { const k = i / (n - 1), a = H[i - 1], b = H[i]; ctx.globalAlpha = fade * (0.3 + 0.7 * k);
          if (k > 0.25) { pxLine(a.x, a.y - 2, b.x, b.y - 2, '#c9952a'); pxLine(a.x, a.y + 2, b.x, b.y + 2, '#c9952a'); }
          if (Z.last && k > 0.4) { pxLine(a.x, a.y - 4, b.x, b.y - 4, '#8a6420'); pxLine(a.x, a.y + 4, b.x, b.y + 4, '#8a6420'); pxLine(a.x + 2, a.y, b.x + 2, b.y, '#fff6d0'); }
          pxLine(a.x, a.y, b.x, b.y, k > 0.6 ? '#ffffff' : '#fff6d0'); }
        ctx.globalAlpha = fade; if (!Z.did.hit) { const h = H[n - 1]; star4(h.x, h.y, Z.last ? 8 : 5, '#ffd34d'); dot(h.x - 2, h.y - 2, '#ffffff', 4); }
        ctx.restore(); }
      else if (Z.k === 'star') for (const m of Z.ms) { if (m.done || t < m.land - 0.32) continue; const q = (t - (m.land - 0.32)) / 0.32, x = m.x - (1 - q) * 130, y = m.y - 10 - (1 - q) * 260, s = m.s;
          for (let j = 0; j < 16; j++) { const tx = x - j * 4.2, ty = y - j * 8.4, k = j / 16; disk(tx + rand(-1, 1), ty, Math.max(2, s * (1 - k) * 0.9), k < 0.15 ? '#fff0d0' : k < 0.4 ? '#ffb040' : k < 0.7 ? '#ff5a20' : '#5a4a48'); }
          disk(x, y, s + 2, '#1a0a08'); disk(x, y, s, '#8a3a20'); disk(x - 2, y - 2, s - 3, '#ffb040'); disk(x - 3, y - 3, Math.max(2, s - 7), '#fff0d0'); }
      else if (Z.k === 'clock') for (const e of Z.frozen) if (live(e) && !Z.did.chime) { const n = 16; for (let i = 0; i < n; i++) { if ((i + Math.floor(t * 16)) % 3 === 0) continue; const a = i / n * TAU + t; dot(e.x + Math.cos(a) * (e.r + 8), e.y - 12 + Math.sin(a) * (e.r + 8) * 0.7, i % 2 ? '#ffd34d' : '#9ad8ff'); }
          const X = snap2(e.x), Y = snap2(e.y - (e.tall || 30) - 10); ctx.fillStyle = '#0b0a0e'; ctx.fillRect(X - 5, Y - 5, 10, 10); ctx.fillStyle = '#ffd34d'; ctx.fillRect(X - 4, Y - 4, 8, 8); ctx.fillStyle = '#ffffff'; ctx.fillRect(X - 2, Y - 2, 4, 4); ctx.fillStyle = '#0b0a0e'; ctx.fillRect(X, Y - 3, 1, 3); ctx.fillRect(X, Y, 2, 1); }
    }
  }
  SKD.add(ents => { if (!G) return; const one = it => SKD.one(drawOver, v => SEL = v, it);
    for (const b of K.bolts) ents.push({ y: Math.max(...b.pts.map(p => p.y)) + 12, d: one(b) });
    for (const Z of K.zones) ents.push({ y: Z.k === 'rod' && Z.ph === 'yank' ? G.player.y + 2 : Z.k === 'fireball' ? Z.y + 2 : Z.k === 'laser' ? Math.max(Z.y, Z.y0) + 14 : Z.k === 'soup' ? (Z.t < 0.45 ? Z.by + 20 : Z.y - 200) : Z.y + 1, d: one(Z) }); });
  const _dgg = drawGearGround, gd = SKD.ground(drawGround); drawGearGround = function () { _dgg(); ctx.save(); gd(); ctx.restore(); };
  const _ie = itemExtra;
  itemExtra = function (it, cls) { const base = _ie(it, cls); if (!it || it.wk == null || it.cls !== 'mage') return base;
    const sk = (wcat('mage')[it.wk] || {}).sk, D = DEF[sk]; if (!D) return base;
    return base + `<div class="fx">우클릭 「${D.n}」 · 쿨타임 ${D.cd}초 — ${D.d}</div>`; };

  // ---------------------------------------------------------------- 옮긴 고유 효과 (화염구 → 기본 공격)
  const _cb = castBolt;
  castBolt = function () { const P = G.player, n0 = G.mproj.length; _cb(); if (G.cls !== 'mage') return; const sk = wSkill(), nb = G.mproj.slice(n0).filter(p => p.kind === 'bolt'); if (!nb.length) return; const b = nb[0];
    if (sk === 'mirror') { const mx = P.x - Math.cos(P.ang) * 34, my = P.y - Math.sin(P.ang) * 24; G.mproj.push(Object.assign({}, b, { x: mx, y: my - 12, hist: [], hitS: new Set() })); G.fx.push({ kind: 'ghost', x: mx, y: my, face: P.face, rot: 0, t: 0.3, max: 0.3, tint: true }); }
    if (sk === 'ashstar2' && b.big) for (const s of [-1, 1]) G.mproj.push(Object.assign({}, b, { ang: b.ang + s * 0.26, hist: [], hitS: new Set() })); };
  const _woh = weaponOnHit;
  weaponOnHit = function (e, o, crit) { _woh(e, o, crit); if (G.cls === 'mage' && o && o.basic && wSkill() === 'ladle' && !e.dead) addBurn(e, 1.5, 0.25); };

  return SKD.wrapAll({ start, update, tick, def, DEF });
})();
;

// ==================================================================== 45_prs.js
'use strict';
// ==================================================================================================
// 잿빛 왕관 원정대 — 45_prs.js : v3.22 미레아(사제) 무기별 우클릭 기술 (41 · 42 · 43 · 44와 같은 방식)
//  · 레어 · 유니크 · 레전더리 메이스는 무기마다 고유한 우클릭 기술을 씀 (커먼 · 초록은 기본 「권능」)
//  · 고해의 채찍은 우클릭 자체가 고유 효과(짧게 / 길게 누르기)라 그대로 둠
//  · 사제는 방패 · 버프 역할이라 고유 우클릭도 쓸 때 빛의 방패 1칸을 얻음 (성유물함은 2칸까지 · 별빛 성가는 2초 보호막)
//  · 쿨타임 무기마다 따로 (KRS.tick) · 깊이 정렬(SKD) · 겹침 디더(SKD.pd) · 몸 · 무기 동작(SKP) 공용
// ==================================================================================================
var PRS = (() => {
  const DEF = {
    censer: { n: '향연 회오리', cd: 9, d: '향로를 크게 세 바퀴 휘둘러 주변 적을 치고 밀쳐냅니다. 끝나면 둘레에 짙은 향 연기가 깔려, 그 안에서는 공격을 흘려낼 확률이 오릅니다.' },
    pan: { n: '무쇠 받아치기', cd: 8, d: '0.7초 동안 프라이팬을 앞으로 들어 정면의 투사체를 모두 되받아치고 피해를 막습니다. 이어서 팬을 크게 휘둘러 앞의 적을 멀리 날려 보내고 기절시킵니다.' },
    water: { n: '성수 소나기', cd: 10, d: '조준한 자리에 성수 구름을 띄워 2.4초 동안 성수 비를 내립니다. 빗속의 적은 계속 피해를 받고 느려지며, 빗속에 선 미레아는 조금씩 회복합니다.' },
    carrot: { n: '토끼 돌격대', cd: 9, d: '당근 밭에서 작은 토끼 다섯 마리가 뛰쳐나옵니다. 토끼는 깡충깡충 가까운 적에게 다가가 몸을 낮췄다가 돌진해 들이받고, 세 번 부딪히면 털뭉치로 사라집니다.' },
    bellh: { n: '대종 낙하', cd: 10, d: '조준한 자리에 커다란 황금 종을 떨어뜨려 안의 적을 가두고 기절시킵니다. 종이 세 번 크게 울리며 울림이 퍼질 때마다 주변 적에게 피해를 줍니다.' },
    reliq: { n: '성유물 수호', cd: 10, d: '빛의 방패를 2칸 얻고, 금 성유물 십자가 셋이 3.5초 동안 몸 둘레를 돌며 닿는 적을 칩니다.' },
    mochi: { n: '달떡 낙하', cd: 10, d: '하늘에서 커다란 떡이 쭉 늘어나며 떨어집니다. 철퍽 퍼졌다가 출렁이며 두 번 더 튀어 오를 때마다 적에게 피해를 주고, 마지막에 크게 내려앉아 끈적하게 붙어 적을 느리게 합니다.' },
    dawn: { n: '새벽 찬가', cd: 11, d: '발밑에 커다란 별빛 성좌를 펼칩니다. 2.4초 동안 성좌가 빛을 뿜으며 안의 적에게 빛기둥이 연달아 내리꽂히고, 끝나면 미레아를 조금 회복합니다.' },
    whip: { n: '참회의 난타', cd: 9, d: '1.3초 동안 채찍으로 양옆을 번갈아 마구 내리칩니다. 갈수록 빨라지고, 마지막에 앞으로 크게 휘둘러 터뜨리며 적을 기절시킵니다.' },
    spear: { n: '천상의 창', cd: 12, d: '미레아 뒤쪽 하늘에서 거대한 성창이 대각선으로 날아와 조준한 자리에 내리꽂힙니다. 꽂힌 자리에서 빛이 폭발하고, 잠시 뒤 성스러운 파동이 한 번 더 퍼집니다.' },
  };
  const SHD = ' 쓸 때 빛의 방패 1칸을 얻습니다.';
  for (const k in DEF) SK_META[k] = Object.assign(SK_META[k] || {}, { K: DEF[k].n, KD: DEF[k].d + SHD });
  const K = { g: null, zones: [] };
  const def = () => (G && G.cls === 'priest' ? DEF[wSkill()] || null : null);
  const FXK = KRS.FXK, lerp = (a, b, t) => a + (b - a) * t, dot = ARS.dot, pxLine = ARS.pxLine, slash = ARS.slash, blast = GRS.blast, PAL_F = GRS.PAL_F, PAL_Y = GRS.PAL_Y;
  const PAL_SMK = ['#ffffff', '#f0e8f8', '#c8b8d8', '#8a7a98', '#4a4458', '#2a2632'], PAL_W = ['#ffffff', '#e8f8ff', '#9ad8ff', '#4f8dff', '#2a3a6a', '#141a2a'], PAL_C = ['#ffffff', '#ffe0a0', '#ff9a3a', '#d8601a', '#5a3a1a', '#2a1a10'], PAL_M = ['#ffffff', '#fffaf0', '#f0e8d8', '#c8bca8', '#5a524c', '#2a2624'], PAL_H = ['#ffffff', '#fffbe6', '#ffe39a', '#c9952a', '#5a4a20', '#2a2410'];
  const big = e => e.type === 'boss' || isElite(e) || isSemi(e) || isDummy(e);
  const live = e => e && !e.dead && e.type !== 'flag';
  const foes = () => G.enemies.filter(live);
  const inE = (e, x, y, r) => Math.hypot(e.x - x, (e.y - y) / 0.6) < r + e.r;
  const hsh = (a, b, s) => { const v = Math.sin(a * 12.9898 + b * 78.233 + s * 37.719) * 43758.5453; return v - Math.floor(v); };
  const aimPt = (P, maxD) => { let tx, ty; if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; } else { tx = P.x + Math.cos(P.ang) * maxD; ty = P.y + Math.sin(P.ang) * maxD; }
    const d = Math.hypot(tx - P.x, ty - P.y); if (d > maxD) { tx = P.x + (tx - P.x) / d * maxD; ty = P.y + (ty - P.y) / d * maxD; }
    return { x: clamp(tx, A.x0 + 20, A.x1 - 20), y: clamp(ty, A.y0 + 20, A.y1 - 20) }; };
  const zone = o => { o.t = 0; o.hit = o.hit || new Set(); o.did = {}; K.zones.push(o); return o; };
  let SEL = null;
  const disk = (x, y, r, c, ry) => { const id = SEL ? SKD.oid(SEL) : 0; for (let yy = -r; yy <= r; yy += 2) { const w = Math.sqrt(Math.max(0, r * r - yy * yy)), Y = y + yy * (ry || 1); for (let xx = -w; xx <= w; xx += 2) SKD.pd(x + xx, Y, id, c); } };
  const run = (x, y, id, c, w) => { for (let i = 0; i < w; i += 2) SKD.pd(x + i, y, id, c); }; // 가로 한 줄 (높이 2px)
  const ring = (x, y, r, c, gap, ry, off) => { const n = Math.max(8, Math.ceil(r * 1.3)); for (let i = 0; i < n; i++) { if (gap && (i + (off || 0)) % gap === 0) continue; const a = i / n * TAU; dot(x + Math.cos(a) * r, y + Math.sin(a) * r * (ry || 0.6), c); } };
  const star4 = (x, y, s, c) => { for (let i = -s; i <= s; i += 2) { dot(x + i, y, Math.abs(i) < 2 ? '#ffffff' : c); dot(x, y + i, Math.abs(i) < 2 ? '#ffffff' : c); } };
  const tipPt = (P, d) => { const h = heroHand(); return { x: h.x + Math.cos(P.blade) * (d || 22), y: h.y - 4 + Math.sin(P.blade) * (d || 22) }; };
  // 빛의 방패 (권능과 같은 규칙: 성유물함은 2칸까지 · 별빛 성가는 2초 보호막)
  function giveShield(n) { const P = G.player, s = G.stats; const cap = wSkill() === 'reliq' ? 2 : 1; for (let i = 0; i < (n || 1); i++) if ((P.holyArmor || 0) < cap && (P.armor || 0) < ARMOR_MAX) addArmor(1, true);
    if (s.fx.has('dawn')) P.shieldT = 2; if (pasO('healShield')) P.shieldT = Math.max(P.shieldT || 0, pasV('healShield')); }
  // 하늘에서 떨어지는 빛기둥 (2px 칸 · 가운데 흰 심)
  const pillar = (x, y, w, t) => K.zones.push({ k: 'pillar', x, y, w, t: 0, dur: t || 0.35, hit: new Set(), did: {} });

  // ---------------------------------------------------------------- 시작
  function start() {
    const D = def(); if (!D) return false;
    const P = G.player, k = wSkill();
    P.atkAng = P.ang; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.blade = P.ang; P.combo = 0; P.queued = false; P.trail = [];
    P.prs = { k, t: 0, did: {}, dur: 0.5, a: P.ang, hit: new Set() }; const R = P.prs; P.state = 'prs';
    giveShield(k === 'reliq' ? 2 : 1); sfx('heal', 1.3);
    if (k === 'censer') { R.dur = 1.3; P.iframe = Math.max(P.iframe, 0.4); }
    else if (k === 'pan') { R.dur = 1.05; P.iframe = Math.max(P.iframe, 0.72); R.refl = 0; }
    else if (k === 'water') { R.dur = 0.45; R.T = aimPt(P, 170); }
    else if (k === 'carrot') { R.dur = 0.45; R.T = aimPt(P, 170); }
    else if (k === 'bellh') { R.dur = 0.45; R.T = aimPt(P, 170); }
    else if (k === 'reliq') { R.dur = 0.4; }
    else if (k === 'mochi') { R.dur = 0.45; R.T = aimPt(P, 160); }
    else if (k === 'dawn') { R.dur = 0.6; }
    else if (k === 'whip') { R.dur = 2; P.iframe = Math.max(P.iframe, 0.3); P.prsWhip = { tt: 0 }; }
    else if (k === 'spear') { R.dur = 0.55; R.T = aimPt(P, 190); P.iframe = Math.max(P.iframe, 0.55); }
    return true;
  }

  // ---------------------------------------------------------------- 진행 (몸 · 메이스)
  function update(dt) {
    const P = G.player, R = P.prs; if (!R) { P.state = 'idle'; return; }
    R.t += dt; const t = R.t, k = R.k, up = (P.face > 0 ? -75 : -105) * DEG;
    const raise = q => { P.blade = lerpAng(R.a, up, q); }, smash = q => { P.blade = lerpAng(up, R.a + P.face * 0.6, q); };
    P.prsFront = false;
    if (k === 'censer') { // 사슬 향로를 몸 둘레로 세 바퀴 (점점 빨라짐)
      const q = Math.min(1, t / 1.1), ang = R.a - P.face * Math.PI * 0.7 + P.face * (q * q * 0.35 + q * 0.65) * TAU * 3; P.blade = ang; P.prsFront = true; P.trail.push({ a: P.blade, t: 0.22 });
      P.face = Math.cos(ang) >= 0 ? 1 : -1; const rev = Math.floor(q * 3); if (R.rev !== rev && q < 1) { R.rev = rev; R.hit = new Set(); FXK.punch(2 + rev, 0.008, 0); sfx('whoosh', 0.8 + rev * 0.15); }
      const tp = tipPt(P, 34); for (let i = 0; i < 3; i++) G.parts.push({ x: tp.x + rand(-4, 4), y: tp.y + rand(-4, 4), vx: rand(-20, 20), vy: rand(-30, -10), t: rand(0.5, 1.0), c: pick(['#c8b8d8', '#8a7a98', '#f0e8f8', '#e8a060']), g: -20 });
      if (Math.random() < 0.5) G.parts.push({ x: tp.x, y: tp.y, vx: rand(-40, 40), vy: rand(-60, -20), t: 0.35, c: pick(['#ffb040', '#ffe060']), g: 60, glow: true });
      for (const e of foes()) if (!R.hit.has(e) && segHit(P.x, P.y - 10, tp.x, tp.y, e, 18)) { R.hit.add(e); damageEnemy(e, 0.55, { ang: angTo(P, e), kb: big(e) ? 0 : 200, grogi: 5, gauge: 2 }); blast(e.x, e.y - 12, 14, PAL_SMK); FXK.punch(2, 0.006, 0.01, angTo(P, e)); }
      if (t >= 1.1 && !R.did.f) { R.did.f = true; const S = G.smoke = G.smoke || []; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; S.push({ x: P.x + Math.cos(a) * 44, y: P.y + Math.sin(a) * 26, t: 4.5 }); } S.push({ x: P.x, y: P.y, t: 4.5 });
        blast(P.x, P.y - 8, 56, PAL_SMK); FXK.ring(P.x, P.y, '#e8e0f0', 360, 0.4, 12); for (const e of foes()) if (inE(e, P.x, P.y, 64)) damageEnemy(e, 0.9, { ang: angTo(P, e), kb: big(e) ? 0 : 260, grogi: 10, heavy: true, gauge: 4 }); FXK.punch(7, 0.025, 0.05); sfx('heavy', 1.3); } }
    else if (k === 'pan') {
      if (t < 0.72) { P.blade = R.a + Math.sin(t * 45) * 0.03; R.guard = true; // 팬 받치기: 정면 투사체를 모두 되받아침
        for (const pr of (G.eproj || [])) { if (pr.friend || pr.t <= 0) continue; const d = Math.hypot(pr.x - P.x, pr.y - P.y + 8), a = Math.atan2(pr.y - P.y + 8, pr.x - P.x); if (d < 80 && Math.abs(angDiff(a, R.a)) < 1.3) { pr.friend = true; pr.ang = a; pr.sp = Math.max(pr.sp || 200, 280) * 1.3; pr.t = 2; pr.home = 0; pr.hist = []; R.refl++; blast(pr.x, pr.y, 12, PAL_Y); sfx('block', 0.6 + Math.min(R.refl, 6) * 0.06); FXK.punch(3, 0.01, 0.02, a); } } }
      else { R.guard = false; const q = Math.min(1, (t - 0.72) / 0.08); P.blade = R.a + P.face * lerp(-2.3, 1.1, q); P.prsFront = true; P.trail.push({ a: P.blade, t: 0.2 });
        if (!R.did.f) { R.did.f = true; const tp = tipPt(P, 28), a = R.a; for (const e of foes()) { const d = dist(P, e); if (d < 82 + e.r && coneIn(P, e, a, 1.05)) { damageEnemy(e, 1.7, { ang: angTo(P, e), kb: big(e) ? 0 : 420, grogi: 16, heavy: true, stagger: 0.6, gauge: 6 }); applySt(e, 'stun', 0.7); blast(e.x, e.y - 12, 18, PAL_F); } }
          for (let i = 0; i < 3; i++) slash(P.x + Math.cos(a) * (18 + i * 14), P.y - 10 + Math.sin(a) * (14 + i * 10), a - P.face * Math.PI / 2, 26 + i * 10, 1.8, i ? '#d0d0d8' : '#ffffff', '#ffffff', 4 - i, 0.25 + i * 0.05);
          blast(P.x + Math.cos(a) * 34, P.y - 10 + Math.sin(a) * 24, 30, PAL_Y); FXK.ring(P.x + Math.cos(a) * 30, P.y + Math.sin(a) * 20, '#ffd34d', 360, 0.3, 10); FXK.rays(P.x + Math.cos(a) * 34, P.y - 10 + Math.sin(a) * 24, 12, 70, '#fff2b0', 0.2, a); FXK.flash('#fff6d0', 0.05); FXK.punch(11, 0.04, 0.08, a); sfx('block', 0.4); sfx('heavy', 1.1); } } }
    else if (k === 'water') { if (t < 0.15) raise(t / 0.15); else { P.blade = up + Math.sin(t * 30) * 0.06; if (!R.did.f) { R.did.f = true; zone({ k: 'rain', x: R.T.x, y: R.T.y, r: 72, dur: 3.0, drops: [] }); FXK.punch(3, 0.01, 0.01); sfx('aim'); } } }
    else if (k === 'carrot') { if (t < 0.18) raise(t / 0.18); else { smash(Math.min(1, (t - 0.18) / 0.07)); P.prsFront = t < 0.3; if (t < 0.3) P.trail.push({ a: P.blade, t: 0.15 }); if (!R.did.f) { R.did.f = true; FXK.punch(6, 0.02, 0.03); const tp = tipPt(P, 26); zone({ k: 'bunny', x: tp.x, y: P.y + Math.sin(R.a) * 14, a: R.a }); sfx('crunch', 0.7); } } }
    else if (k === 'bellh') { if (t < 0.18) raise(t / 0.18); else { P.blade = up; if (!R.did.f) { R.did.f = true; zone({ k: 'bell', x: R.T.x, y: R.T.y, land: 0.42 }); FXK.punch(3, 0.01, 0.01); sfx('warn', 0.6); } } }
    else if (k === 'reliq') { if (t < 0.15) raise(t / 0.15); else { P.blade = up; if (!R.did.f) { R.did.f = true; zone({ k: 'reliq', x: P.x, y: P.y, dur: 3.5, rs: [0, 1, 2].map(i => ({ a: i / 3 * TAU })), hitT: new Map() }); blast(P.x, P.y - 14, 26, PAL_Y); FXK.ring(P.x, P.y, '#ffe39a', 260, 0.3, 8); FXK.punch(5, 0.015, 0.02); sfx('perfect'); } } }
    else if (k === 'mochi') { if (t < 0.15) raise(t / 0.15); else { P.blade = up; if (!R.did.f) { R.did.f = true; zone({ k: 'mochi', x: R.T.x, y: R.T.y, goo: [] }); FXK.punch(3, 0.01, 0.01); sfx('warn', 0.8); } } }
    else if (k === 'dawn') { if (t < 0.25) raise(t / 0.25); else { P.blade = up + Math.sin(t * 20) * 0.05; if (!R.did.f) { R.did.f = true; zone({ k: 'dawn', x: P.x, y: P.y, r: 96, dur: 2.9, tick: 0 }); FXK.flash('#fffbe6', 0.06); FXK.punch(6, 0.02, 0.03); sfx('awaken', 1.1); } } }
    else if (k === 'whip') { // 기본 공격의 채찍질(1타 · 2타)을 양옆으로 번갈아 점점 빠르게 → 마지막은 3타(몸 둘레를 감아 도는 한 바퀴)를 조준 방향으로
      const W = P.prsWhip; if (!R.q) { R.q = []; let at = 0.04; for (let i = 0; i < 10; i++) { const sp = 1 + i * 0.09, c = i % 2, st = SWING_PW[c], d = (st.wind + st.swing + 0.07) / sp; R.q.push({ t0: at, d, sp, c, base: (i >> 1) % 2 ? Math.PI : 0 }); at += d; } const st = SWING_PW[2]; R.q.push({ t0: at, d: st.wind + st.swing + 0.2, sp: 1, c: 2, base: R.a, fin: true }); R.dur = at + st.wind + st.swing + 0.24; }
      const L = R.q.find(l => t >= l.t0 && t < l.t0 + l.d) || R.q[R.q.length - 1], tt = Math.min(L.d, t - L.t0) * L.sp, st = SWING_PW[L.c], te = st.wind + st.swing;
      P.combo = L.c; P.atkAng = L.base; P.face = Math.cos(L.base) >= 0 ? 1 : -1; P.sign = P.face; W.tt = tt; W.st = st;
      const rel = tt < st.wind ? st.a0 - 12 * (tt / st.wind) : tt < te ? st.a0 - 12 + (st.a1 - st.a0 + 12) * easeOut((tt - st.wind) / st.swing) : st.a1; P.blade = L.base + P.sign * rel * DEG;
      const idx = R.q.indexOf(L);
      if (tt >= st.wind + st.swing * 0.55 && R.ln !== idx) { R.ln = idx; const fin = !!L.fin, reach = fin ? 80 : 74, half = fin ? Math.PI : 1.3;
        for (const e of foes()) { const d = dist(P, e); if (d < reach + e.r && coneIn(P, e, L.base, half)) { damageEnemy(e, fin ? 1.4 : 0.42, { ang: angTo(P, e), kb: big(e) ? 0 : (fin ? 260 : 70), grogi: fin ? 16 : 4, heavy: fin, gauge: fin ? 6 : 1.5 }); if (fin) applySt(e, 'stun', 0.8); if (fin || Math.random() < 0.5) { e.bleedT = 3; if (!(e.bleedTick > 0)) e.bleedTick = 0.5; } blast(e.x, e.y - 12, fin ? 20 : 12, ['#ffffff', '#fff0d0', '#e8a060', '#a3161c', '#4a1418', '#1a0a0c']); } }
        const tip = P.lashTip || { x: P.x + Math.cos(P.blade) * 60, y: P.y - 8 + Math.sin(P.blade) * 44 };
        blast(tip.x, tip.y, fin ? 30 : 10, ['#ffffff', '#fff6e0', '#ffe0a0', '#c87a5a', '#5a2a20', '#2a1410']); star4(tip.x, tip.y, fin ? 6 : 4, '#fff0d0'); FXK.ring(tip.x, tip.y + 6, '#fff0d0', fin ? 300 : 140, 0.18, 3);
        if (fin) { FXK.ring(P.x, P.y - 4, '#d02030', 360, 0.3, 30); FXK.flash('#fff0d0', 0.05); FXK.punch(10, 0.035, 0.07, L.base); sfx('heavy', 1.4); sfx('block', 0.5); } else { FXK.punch(2 + idx * 0.3, 0.006, 0.008, L.base); sfx('hit', 1.9 + (idx % 3) * 0.1); } sfx('whoosh', 1.4 + idx * 0.05); } }
    else if (k === 'spear') { // 날개를 펴듯 메이스를 높이 들었다가 아래로 내리그음
      if (t < 0.3) { raise(t / 0.3); P.lift = Math.round(Math.sin(t / 0.3 * Math.PI / 2) * 6); for (let i = 0; i < 2; i++) G.parts.push({ x: P.x + rand(-16, 16), y: P.y - rand(6, 22), vx: rand(-30, 30), vy: rand(10, 40), t: 0.6, c: pick(['#ffffff', '#fffbe6', '#ffe39a']), g: 40 }); }
      else { P.lift = Math.max(0, 6 - (t - 0.3) * 60); smash(Math.min(1, (t - 0.3) / 0.08)); P.prsFront = t < 0.42; if (t < 0.42) P.trail.push({ a: P.blade, t: 0.15 });
        if (!R.did.f) { R.did.f = true; const dx = R.T.x - P.x; zone({ k: 'spear', x: R.T.x, y: R.T.y, sx: P.x - Math.sign(dx || P.face) * 60 - dx * 0.2, sy: P.y - 260, land: 0.42 }); FXK.flash('#fffbe6', 0.05); FXK.punch(5, 0.015, 0.03); sfx('awaken', 1.4); } } }
    if (t >= R.dur) end(P);
  }
  function end(P) { P.prsWhip = null; P.state = 'idle'; P.prs = null; P.t = 0; P.lift = 0; P.prsFront = false; }

  // ---------------------------------------------------------------- 진 · 소환물
  function tick(dt) {
    if (K.g !== G) { K.g = G; K.zones = []; }
    if (!G.player) return; const P = G.player;
    for (const Z of K.zones) { Z.t += dt; const t = Z.t;
      if (Z.k === 'pillar') { if (!Z.did.h) { Z.did.h = true; for (const e of foes()) if (Math.hypot(e.x - Z.x, (e.y - Z.y) / 0.6) < Z.w + e.r) damageEnemy(e, 0.6, { ang: 0, kb: 0, grogi: 6, gauge: 2 }); blast(Z.x, Z.y - 8, Z.w * 1.6, PAL_H); FXK.light(Z.x, Z.y, 90, 0.8, '255,230,150', 0.15); addShake(2, 0); sfx('bolt', 1.6 + rand(0, 0.3)); } if (t > Z.dur) Z.dead = true; }
      else if (Z.k === 'rain') { const on = t > 0.35 && t < 2.75;
        if (on) { for (let i = 0; i < 4; i++) { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * Z.r; const dx = Math.max(-50, Math.min(50, Math.cos(a) * r)), dy = Math.sin(a) * r * 0.6; Z.drops.push({ x: Z.x + dx, y: Z.y + dy, h: dy + 84 - rand(0, 6), t: 0 }); } } // v3.22 빗줄기는 구름 아랫면에서부터
        for (const d of Z.drops) { d.t += dt; d.h -= dt * 420; if (d.h <= 0 && !d.sp) { d.sp = true; if (Math.random() < 0.35) G.parts.push({ x: d.x, y: d.y - 2, vx: rand(-30, 30), vy: rand(-50, -20), t: 0.25, c: pick(['#e8f8ff', '#9ad8ff']), g: 300 }); } } Z.drops = Z.drops.filter(d => d.t < 0.5);
        if (on && (Z.tk = (Z.tk || 0) - dt) <= 0) { Z.tk = 0.25; for (const e of foes()) if (inE(e, Z.x, Z.y, Z.r)) { damageEnemy(e, 0.24, { ang: 0, kb: 0, grogi: 2, gauge: 1 }); zoneSlow(e, 0.7); } }
        if (on && !P.dead && Math.hypot(P.x - Z.x, (P.y - Z.y) / 0.6) < Z.r) healPct(0.02 * dt);
        if (on) FXK.light(Z.x, Z.y - 30, 160, 0.2, '200,230,255', 0.03);
        if (t > Z.dur) Z.dead = true; }
      else if (Z.k === 'bunny') { // 토끼 다섯: 깡충 뛰어 가까운 적에게 다가가다 몸을 낮추고 돌진
        if (!Z.bs) { Z.bs = []; for (let i = 0; i < 5; i++) { const a = Z.a + (i - 2) * 0.45; Z.bs.push({ x: Z.x + Math.cos(a) * 6, y: Z.y + Math.sin(a) * 4, vx: Math.cos(a) * 120, vy: Math.sin(a) * 90, hop: i * 0.2, ph: 'hop', pt: 0, face: Math.cos(a) >= 0 ? 1 : -1, hits: 0, life: 3.2 + i * 0.1, tg: null }); }
          blast(Z.x, Z.y - 6, 22, ['#ffffff', '#fff0f4', '#ffc0d0', '#c08090', '#5a4050', '#2a2028']); FXK.ring(Z.x, Z.y, '#ffd0dc', 220, 0.3, 6); sfx('blip', 1.6); }
        for (const b of Z.bs) { if (b.dead) continue; b.pt += dt; b.life -= dt;
          if (!live(b.tg)) { let bd = 1e9; b.tg = null; for (const e of foes()) { const d = Math.hypot(e.x - b.x, e.y - b.y); if (d < bd && d < 240) { bd = d; b.tg = e; } } }
          const T = b.tg, ox = b.x, oy = b.y;
          if (b.ph === 'hop') { b.hop += dt * 3.4; if (T) { const a = Math.atan2(T.y - b.y, T.x - b.x); b.vx += (Math.cos(a) * 140 - b.vx) * Math.min(1, dt * 5); b.vy += (Math.sin(a) * 110 - b.vy) * Math.min(1, dt * 5); if (Math.hypot(T.x - b.x, T.y - b.y) < 60 + T.r && b.pt > 0.3) { b.ph = 'crouch'; b.pt = 0; } }
            b.x += b.vx * dt; b.y += b.vy * dt; if (b.hop % 1 < dt * 3.4) { dust(b.x, b.y, 1); if (Math.random() < 0.3) sfx('blip', 2.0 + rand(0, 0.3)); } }
          else if (b.ph === 'crouch') { if (b.pt > 0.14) { b.ph = 'dash'; b.pt = 0; const a = T ? Math.atan2(T.y - b.y, T.x - b.x) : Math.atan2(b.vy, b.vx); b.vx = Math.cos(a) * 420; b.vy = Math.sin(a) * 320; b.hitS = new Set(); sfx('whoosh', 1.8); } }
          else if (b.ph === 'dash') { b.x += b.vx * dt; b.y += b.vy * dt; if (Math.random() < 0.8) G.parts.push({ x: b.x - b.vx * 0.02, y: b.y - 4, vx: -b.vx * 0.1, vy: rand(-20, 0), t: 0.25, c: pick(['#ffffff', '#ffd0dc', '#e8e8f0']), g: 0 });
            for (const e of foes()) if (!b.hitS.has(e) && Math.hypot(e.x - b.x, (e.y - b.y) / 0.8) < 10 + e.r) { b.hitS.add(e); b.hits++; const a = Math.atan2(b.vy, b.vx); damageEnemy(e, 0.8, { ang: a, kb: big(e) ? 0 : 240, grogi: 8, heavy: true, gauge: 3 }); applySt(e, 'stun', 0.4);
              blast(e.x, e.y - 10, 18, ['#ffffff', '#fff0f4', '#ffc0d0', '#c08090', '#5a4050', '#2a2028']); FXK.ring(e.x, e.y, '#ffd0dc', 200, 0.25, 6); FXK.punch(4, 0.012, 0.02, a); sfx('hit', 1.3); b.vx *= -0.35; b.vy = -60; b.ph = 'bounce'; b.pt = 0; }
            if (b.pt > 0.3) { b.ph = 'hop'; b.pt = 0; } }
          else if (b.ph === 'bounce') { b.x += b.vx * dt; b.y += b.vy * dt * 0.3; if (b.pt > 0.3) { b.ph = 'hop'; b.pt = 0; } }
          if (segSolid(ox, oy, b.x, b.y, 4) || b.x < A.x0 + 8 || b.x > A.x1 - 8 || b.y < A.y0 + 8 || b.y > A.y1 - 8) { b.x = ox; b.y = oy; b.vx *= -1; b.vy *= -1; }
          if (Math.abs(b.vx) > 5) b.face = b.vx > 0 ? 1 : -1;
          if (b.life <= 0 || b.hits >= 3) { b.dead = true; blast(b.x, b.y - 6, 14, ['#ffffff', '#fff0f4', '#ffc0d0', '#c08090', '#5a4050', '#2a2028']); for (let j = 0; j < 8; j++) G.parts.push({ x: b.x, y: b.y - 6, vx: rand(-80, 80), vy: rand(-120, -40), t: 0.5, c: pick(['#ffffff', '#ffd0dc']), g: 300 }); sfx('blip', 1.2); } }
        if (Z.bs.every(b => b.dead)) Z.dead = true; }
      else if (Z.k === 'bell') { // 대종: 떨어져 가두고 → 세 번 울림 (울림 파동 · 소리 물결은 바닥에 그려 종에 가려짐)
        Z.waves = Z.waves || [];
        if (t >= Z.land && !Z.did.land) { Z.did.land = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 38)) { damageEnemy(e, 1.6, { ang: 0, kb: 0, grogi: 16, heavy: true, gauge: 6 }); applySt(e, 'stun', 1.4); Z.hit.add(e); }
          for (const e of foes()) if (!Z.hit.has(e) && inE(e, Z.x, Z.y, 70)) damageEnemy(e, 0.6, { ang: angTo(Z, e), kb: big(e) ? 0 : 200, grogi: 6, gauge: 2 });
          Z.waves.push({ t: 0, max: 0.5, r0: 30, r1: 120, c: '#fff6d0', w: 3 }); Z.cr = []; for (let i = 0; i < 10; i++) Z.cr.push({ a: i / 10 * TAU + rand(-0.2, 0.2), l: rand(30, 60), s: Math.random() * 99 });
          FXK.debris(Z.x, Z.y, 18); dust(Z.x - 40, Z.y, 10); dust(Z.x + 40, Z.y, 10); FXK.flash('#fff6d0', 0.07); FXK.punch(15, 0.055, 0.1); FXK.light(Z.x, Z.y, 220, 1, '255,230,150', 0.3); sfx('heavy', 0.5); sfx('crunch', 0.5); sfx('block', 0.3); }
        for (let i = 0; i < 3; i++) { const rt = Z.land + 0.4 + i * 0.42; if (t >= rt && !Z.did['r' + i]) { Z.did['r' + i] = true; Z.ringT = t; Z.ringN = i; const R2 = 80 + i * 30;
          for (const e of foes()) if (inE(e, Z.x, Z.y, R2)) damageEnemy(e, i === 2 ? 1.0 : 0.6, { ang: angTo(Z, e), kb: big(e) ? 0 : (i === 2 ? 260 : 90), grogi: 8, heavy: i === 2, gauge: 2 });
          for (let j = 0; j < 3; j++) Z.waves.push({ t: -j * 0.07, max: 0.55, r0: 40, r1: R2 + 20 + j * 10, c: j ? '#ffe39a' : '#ffffff', w: 3 - j });
          for (let j = 0; j < 14; j++) { const a = rand(0, TAU), sp = rand(120, 260); G.parts.push({ x: Z.x + Math.cos(a) * 30, y: Z.y - 40 + Math.sin(a) * 20, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 40, t: 0.4, c: pick(['#fff6d0', '#ffd34d', '#ffffff']), g: 200, glow: true }); }
          FXK.punch(7 + i * 2, 0.02 + i * 0.01, 0.03); FXK.light(Z.x, Z.y - 30, 180, 0.9, '255,230,150', 0.25); if (i === 2) FXK.flash('#fff6d0', 0.06); sfx('block', 0.3 + i * 0.04); sfx('heavy', 1.6 - i * 0.2); sfx('perfect'); } }
        for (const w of Z.waves) w.t += dt; Z.waves = Z.waves.filter(w => w.t < w.max);
        if (t > Z.land + 2.0) Z.dead = true; }
      else if (Z.k === 'reliq') { Z.x = P.x; Z.y = P.y;
        for (const [e, c] of Z.hitT) { if (c - dt <= 0) Z.hitT.delete(e); else Z.hitT.set(e, c - dt); }
        const spin = t * 6.5, R2 = Math.min(1, t / 0.2) * 38;
        Z.rs.forEach((r, i) => { const a = r.a + spin; r.x = P.x + Math.cos(a) * R2; r.y = P.y - 10 + Math.sin(a) * R2 * 0.6; r.z = Math.sin(a);
          if (t < Z.dur) for (const e of foes()) if (!Z.hitT.has(e) && Math.hypot(e.x - r.x, e.y - 10 - r.y) < 12 + e.r) { Z.hitT.set(e, 0.35); damageEnemy(e, 0.45, { ang: angTo(P, e), kb: big(e) ? 0 : 150, grogi: 4, gauge: 2 }); blast(r.x, r.y, 12, PAL_Y); FXK.punch(2, 0.006, 0.01); sfx('hit', 1.5); }
          if (Math.random() < 0.4) G.parts.push({ x: r.x, y: r.y, vx: rand(-15, 15), vy: rand(-25, -5), t: 0.35, c: pick(['#ffe39a', '#fffbe6']), g: 0, glow: true }); });
        FXK.light(P.x, P.y - 10, 90, 0.2, '255,230,150', 0.03);
        if (t > Z.dur + 0.3) Z.dead = true; }
      else if (Z.k === 'mochi') { // 쫀득한 큰 떡: 길게 늘어나며 떨어져 → 철퍽 퍼졌다가 출렁이며 두 번 튀고 → 크게 내려앉아 끈적하게 붙음
        const L = [0.42, 0.95, 1.45]; Z.goo = Z.goo || [];
        L.forEach((lt, i) => { if (t >= lt && !Z.did['l' + i]) { Z.did['l' + i] = true; Z.lt = t; Z.li = i; const last = i === 2, R2 = last ? 78 : 56;
          for (const e of foes()) if (inE(e, Z.x, Z.y, R2)) { damageEnemy(e, last ? 1.5 : i === 0 ? 1.1 : 0.6, { ang: angTo(Z, e), kb: big(e) ? 0 : (i === 0 ? 120 : 40), grogi: last ? 16 : 8, heavy: i !== 1, gauge: 3 }); applySt(e, 'slow', 3, 0.35); if (i !== 1) applySt(e, 'stun', last ? 0.9 : 0.5); }
          blast(Z.x, Z.y - 8, last ? 52 : 34, PAL_M); FXK.ring(Z.x, Z.y, '#fffaf0', last ? 480 : 300, 0.35, 12); FXK.punch(i === 1 ? 6 : 12, i === 1 ? 0.02 : 0.045, 0.06); dust(Z.x, Z.y, 14);
          for (let j = 0; j < (last ? 14 : 8); j++) { const a = rand(0, TAU), r = rand(30, R2 + 10); Z.goo.push({ x: Z.x, y: Z.y - 10, tx: Z.x + Math.cos(a) * r, ty: Z.y + Math.sin(a) * r * 0.6, t: 0, s: rand(3, 7) }); }
          if (last) { FXK.flash('#fffaf0', 0.08); FXK.rays(Z.x, Z.y - 14, 14, 100, '#fffaf0', 0.25); } sfx('heavy', 0.9); sfx('crunch', 0.4); } });
        for (const g of Z.goo) g.t += dt;
        if (t > 1.45 && t < 3.6) for (const e of foes()) if (inE(e, Z.x, Z.y, 70)) zoneSlow(e, 0.4);
        if (t > 3.6) Z.dead = true; }
      else if (Z.k === 'dawn') { Z.x = P.x; Z.y = P.y; const on = t > 0.3 && t < 2.5; Z.motes = Z.motes || [];
        if (on && (Z.tick -= dt) <= 0) { Z.tick = 0.11; const L = foes().filter(e => inE(e, Z.x, Z.y, Z.r)), e = L.length ? pick(L) : null, a = rand(0, TAU), r = rand(20, Z.r); pillar(e ? e.x : Z.x + Math.cos(a) * r, e ? e.y : Z.y + Math.sin(a) * r * 0.6, 14, 0.36); }
        if (on && Math.random() < 0.8) Z.motes.push({ x: Z.x + rand(-Z.r, Z.r), y: Z.y + rand(-Z.r, Z.r) * 0.5, t: 0, max: rand(0.6, 1.1) }); for (const m of Z.motes) { m.t += dt; m.y -= dt * 40; } Z.motes = Z.motes.filter(m => m.t < m.max);
        if (on && Math.random() < 0.3) G.parts.push({ x: Z.x + rand(-80, 80), y: Z.y - rand(80, 140), vx: rand(-20, 20), vy: rand(20, 50), t: 1.0, c: pick(['#ffffff', '#fffbe6']), g: 10 }); // 깃털처럼 내려오는 빛
        if (t >= 2.5 && !Z.did.b) { Z.did.b = true; healPct(0.05); sfx('heal', 0.7); } // v3.22 마지막 폭발 없음 — 조용히 회복만
        if (on) FXK.light(Z.x, Z.y, 190, 0.3, '255,230,150', 0.03);
        if (t > Z.dur) Z.dead = true; }
      else if (Z.k === 'spear') { // 성창 하나: 플레이어 쪽 하늘에서 대각선으로 내리꽂힘
        const q = Math.min(1, t / Z.land), e2 = q * q * q; Z.tx = lerp(Z.sx, Z.x, e2); Z.ty = lerp(Z.sy, Z.y, e2); (Z.hist = Z.hist || []).push({ x: Z.tx, y: Z.ty, t: 0.22 }); for (const h of Z.hist) h.t -= dt; Z.hist = Z.hist.filter(h => h.t > 0);
        if (t < Z.land && Math.random() < 0.8) G.parts.push({ x: Z.tx + rand(-6, 6), y: Z.ty + rand(-6, 6), vx: rand(-30, 30), vy: rand(-20, 30), t: 0.5, c: pick(['#ffffff', '#fffbe6', '#ffe39a']), g: 30, glow: true });
        if (t < Z.land) FXK.light(Z.tx, Z.ty, 90, 0.4, '255,240,190', 0.04);
        if (t >= Z.land && !Z.did.land) { Z.did.land = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 80)) { damageEnemy(e, 3.0, { ang: angTo(Z, e), kb: big(e) ? 0 : 340, grogi: 22, heavy: true, gauge: 8 }); applySt(e, 'stun', 0.9); }
          blast(Z.x, Z.y - 16, 90, PAL_H, true); blast(Z.x - 46, Z.y + 2, 34, PAL_H); blast(Z.x + 46, Z.y - 2, 34, PAL_H); blast(Z.x, Z.y - 60, 40, PAL_H);
          Z.cr = []; for (let i = 0; i < 12; i++) Z.cr.push({ a: i / 12 * TAU + rand(-0.15, 0.15), l: rand(40, 80), s: Math.random() * 99 });
          FXK.ring(Z.x, Z.y, '#ffffff', 760, 0.5, 18); FXK.ring(Z.x, Z.y, '#ffe39a', 520, 0.55, 12); FXK.rays(Z.x, Z.y - 24, 24, 160, '#fffbe6', 0.4); FXK.debris(Z.x, Z.y, 24); FXK.flash('#ffffff', 0.16); FXK.punch(20, 0.07, 0.15); FXK.light(Z.x, Z.y, 320, 1, '255,240,190', 0.6); sfx('heavy', 0.45); sfx('blast', 0.5); sfx('perfect'); }
        if (t >= Z.land + 0.5 && !Z.did.n) { Z.did.n = true; for (const e of foes()) if (inE(e, Z.x, Z.y, 120)) damageEnemy(e, 1.1, { ang: angTo(Z, e), kb: big(e) ? 0 : 200, grogi: 10, heavy: true, gauge: 4 }); FXK.ring(Z.x, Z.y, '#fffbe6', 560, 0.4, 20); blast(Z.x, Z.y - 40, 50, PAL_H); FXK.punch(9, 0.03, 0.05); sfx('heal', 0.6); sfx('blast', 0.8); }
        if (t > Z.land + 0.2 && t < Z.land + 1.4 && Math.random() < 0.5) G.parts.push({ x: Z.x + rand(-20, 20), y: Z.y - rand(10, 60), vx: rand(-30, 30), vy: rand(-60, -20), t: 0.8, c: pick(['#ffffff', '#fffbe6', '#ffe39a']), g: -10, glow: true });
        if (t > Z.land + 1.8) Z.dead = true; }
    }
    K.zones = K.zones.filter(Z => !Z.dead);
  }

  // ---------------------------------------------------------------- 그리기 (2px 칸)
  // 성창: 금 자루 · 잎사귀 창날(흰 심) · 십자 코등이 · 작은 날개 · 붉은 리본 — 세로로 아래를 향함 (tipY = 창끝)
  // ---------------- 성창 (칸 격자 → 각도대로 돌려 그림: 빈틈 없게 화면 칸에서 거꾸로 되짚음) · 창끝이 (0, 8)
  const SPEAR = (() => { const W = 60, H = 19, cy = 9, g = Array.from({ length: H }, () => Array(W).fill(null)), put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    for (let x = 1; x <= 18; x++) { const hw = Math.round(4.4 * Math.pow(Math.sin(Math.PI * Math.min(1, x / 20)), 0.75)); for (let d = -hw; d <= hw; d++) put(x, cy + d, d === 0 ? (x > 3 && x < 16 ? (x % 2 ? '#ffffff' : '#d8e4f8') : '#ffffff') : d < 0 ? (d === -hw ? '#ffffff' : d === -1 ? '#f4f8ff' : '#e0eaff') : (d === hw ? '#7a8aa8' : d === 1 ? '#c8d4ec' : '#a8b8d4')); }
    put(0, cy, '#ffffff');
    for (let d = -7; d <= 7; d++) { put(19, cy + d, Math.abs(d) > 5 ? '#ffe08a' : '#fff2b0'); put(20, cy + d, Math.abs(d) > 5 ? '#c9952a' : '#ffd34d'); put(21, cy + d, '#8a6420'); } put(20, cy, '#c03030'); put(20, cy - 1, '#ff7a6a'); put(19, cy - 8, '#ffe08a'); put(19, cy + 8, '#c9952a');
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const x0 = 22 + k * 2, y0 = cy + s * 3, x1 = 27 + k * 3, y1 = cy + s * (8 - k * 0.5); const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); put(x, y, k % 2 ? '#e8ecf8' : '#ffffff'); put(x, y - s, i > n / 2 ? '#c8d0e4' : '#ffffff'); } }
    for (let x = 22; x <= 53; x++) { put(x, cy - 1, '#ffe08a'); put(x, cy, '#c9952a'); put(x, cy + 1, '#8a6420'); }
    for (const bx of [31, 42]) for (let d = -2; d <= 2; d++) { put(bx, cy + d, '#fff2b0'); put(bx + 1, cy + d, '#c9952a'); }
    for (const [x, y, c] of [[23, cy + 2, '#c03030'], [24, cy + 3, '#c03030'], [24, cy + 4, '#8a1820'], [25, cy + 5, '#c03030'], [26, cy + 5, '#c03030'], [27, cy + 6, '#8a1820'], [25, cy + 4, '#e84848']]) put(x, y, c);
    [1, 2, 3, 2, 1].forEach((hw, i) => { for (let d = -hw; d <= hw; d++) put(54 + i, cy + d, d < 0 ? '#ffe08a' : d > 0 ? '#8a6420' : '#c9952a'); }); put(56, cy, '#4f8dff'); put(56, cy - 1, '#9ad8ff');
    const src = g.map(r => r.slice()); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!src[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => src[y + dy] && src[y + dy][x + dx])) g[y][x] = '#1a1418';
    return { g, W, H, cy }; })();
  function drawSpearRot(tx, ty, ang, sc, groundY, glow) { const { g, W, H, cy } = SPEAR, c = Math.cos(ang), s = Math.sin(ang), L = W * 2 * sc + 4, id = SEL ? SKD.oid(SEL) : 0;
    const x0 = snap2(tx - L), x1 = snap2(tx + L), y0 = snap2(ty - L), y1 = snap2(ty + L);
    for (let Y = y0; Y <= y1; Y += 2) { if (groundY != null && Y > groundY) continue; for (let X = x0; X <= x1; X += 2) { const dx = X + 1 - tx, dy = Y + 1 - ty, u = (dx * c + dy * s) / (2 * sc), v = (-dx * s + dy * c) / (2 * sc), gx = Math.round(u), gy = Math.round(v) + cy;
      if (gx < 0 || gx >= W || gy < 0 || gy >= H) continue; const col = g[gy][gx]; if (!col) continue; SKD.pd(X, Y, id, glow && col !== '#1a1418' && Math.floor(time * 20) % 2 && gx < 19 ? '#ffffff' : col); } } }
  // ---------------- 쫀득한 떡 (흰 몸 · 아래로 갈수록 크림 · 볼터치 · 콩가루 점)
  function drawMochi(x, y, w, h, a) { const id = SEL ? SKD.oid(SEL) : 0, X = snap2(x), Y = snap2(y), R = Math.max(2, Math.round(h / 2) * 2);
    ctx.globalAlpha = a == null ? 1 : a;
    for (let yy = 0; yy < R; yy += 2) { const k = yy / R, hw = Math.max(2, Math.round(w * Math.sqrt(Math.max(0, 1 - ((k - 0.62) / 0.62) ** 2)) / 2) * 2); run(X - hw - 2, Y - R + yy, id, '#8a8070', hw * 2 + 4); }
    for (let yy = 0; yy < R; yy += 2) { const k = yy / R, hw = Math.max(2, Math.round(w * Math.sqrt(Math.max(0, 1 - ((k - 0.62) / 0.62) ** 2)) / 2) * 2), c = k > 0.86 ? '#d8ccb8' : k > 0.66 ? '#f0e8d8' : '#fffaf0'; run(X - hw, Y - R + yy, id, c, hw * 2);
      if (k < 0.4 && k > 0.12) run(X - hw + Math.round(hw * 0.4 / 2) * 2, Y - R + yy, id, '#ffffff', Math.max(2, Math.round(hw * 0.5 / 2) * 2)); }
    SKD.pd(X - Math.round(w * 0.55 / 2) * 2, Y - Math.round(R * 0.42 / 2) * 2, id, '#ffc0d0', 4); SKD.pd(X + Math.round(w * 0.45 / 2) * 2, Y - Math.round(R * 0.42 / 2) * 2, id, '#ffc0d0', 4);
    for (let i = 0; i < 6; i++) SKD.pd(X + Math.round((hsh(i, 1, 9) - 0.5) * w * 1.2 / 2) * 2, Y - R + 4 + Math.round(hsh(i, 2, 9) * R * 0.5 / 2) * 2, id, '#e8dcc0');
    ctx.globalAlpha = 1; }
  // ---------------- 칸 그림 도우미: rows(문자열 배열) + 팔레트를 2px 칸으로 (좌우 뒤집기 · 겹침 디더)
  const cellDraw = (rows, pal, x, y, flip, id) => { const W = rows[0].length; for (let r = 0; r < rows.length; r++) for (let c = 0; c < W; c++) { const ch = rows[r][flip ? W - 1 - c : c]; if (ch === '.' || !pal[ch]) continue; SKD.pd(x + c * 2, y + r * 2, id, pal[ch]); } };
  const withOutline = rows => { const H = rows.length, W = rows[0].length, g = rows.map(r => r.split('')); const o = g.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx] && g[y + dy][x + dx] !== '.' && g[y + dy][x + dx] !== 'k')) o[y][x] = 'k'; return o.map(r => r.join('')); };
  const pad = rows => { const W = rows[0].length + 2; return ['.'.repeat(W)].concat(rows.map(r => '.' + r + '.'), ['.'.repeat(W)]); };
  // ---------------- 토끼 (오른쪽을 봄): 긴 귀(분홍 속귀) · 큰 눈(반짝임) · 볼터치 · 분홍 코 · 몽실 꼬리 · 흰 몸 명암
  const BUN_PAL = { k: '#3a2a3a', w: '#ffffff', s: '#e6dcec', S: '#c8bcd4', p: '#ffb4c8', P: '#ff8aa8', e: '#2a1a2a', o: '#ffffff', n: '#ff6a8a', t: '#fff6fa' };
  const BUN = {
    hop: withOutline(pad([
      '......ww.ww..',
      '.....wpw.wpw.',
      '.....wps.wps.',
      '.....wps.wpw.',
      '.....wws.wws.',
      '....wwwwwwww.',
      '...wwwwwwwwww',
      '..twwwwwweoww',
      '.ttswwwwweewP',
      '..tswwwwwpwnw',
      '...swwwwwwwww',
      '...sswwwwwss.',
      '....sSs.sSs..'])),
    crouch: withOutline(pad([
      '.............',
      '.......ww.ww.',
      '......wpwwpw.',
      '......wpswps.',
      '.....wwwwwwww',
      '..twwwwwwweow',
      '.ttswwwwweewP',
      '..tswwwwwpwnw',
      '..sswwwwwwwww',
      '..sSSs..sSSs.'])),
    dash: withOutline(pad([
      'ww.ww..........',
      'wppwpw.........',
      '.wppswwww......',
      '..wwswwwwwwww..',
      '.twwwwwwwwweoww',
      'ttswwwwwwwweewP',
      '.tsswwwwwwwpwnw',
      '..ssswwwwwwwww.',
      '...sSSs...sSSs.'])) };
  function drawBunny(b) { const hop = b.ph === 'hop' ? Math.abs(Math.sin(b.hop * Math.PI)) * 10 : b.ph === 'bounce' ? 6 : 0, pose = b.ph === 'dash' ? BUN.dash : b.ph === 'crouch' ? BUN.crouch : BUN.hop, W = pose[0].length * 2, H = pose.length * 2;
    dshEll(ctx, b.x, b.y + 1, 8, 2, 0.5); /* v3.23 디더 그림자 */
    const blink = Math.floor((time + b.life) * 2.3) % 9 === 0, P2 = blink ? Object.assign({}, BUN_PAL, { e: '#ffffff', o: '#2a1a2a' }) : BUN_PAL;
    cellDraw(pose, P2, snap2(b.x) - W / 2, snap2(b.y - hop) - H + 2, b.face < 0, SEL ? SKD.oid(SEL) : 0); }
  // ---------------- 대종: 시작방(종이 멈춘 수도원)의 청동 종과 같은 그리기 — 둥근 어깨 · 허리 · 넓은 소리 테 · 띠 둘 · 새긴 글자 띠 · 녹청 · 입술 타원 · 머리 고리 (크기 1.6배)
  const BELL = (() => { const base = [3, 4.5, 5.5, 6, 6.5, 6.8, 7, 7, 7, 7, 7.2, 7.4, 7.7, 8, 8.5, 9, 9.8, 10.6, 11.4, 12, 12.3], S = 1.6, H0 = Math.round(base.length * S), prof = Array.from({ length: H0 }, (_, r) => base[Math.min(base.length - 1, Math.floor(r / S))] * S);
    const BR = t => t < 0.06 ? '#6a4614' : t < 0.14 ? '#b08030' : t < 0.24 ? '#f6dc8c' : t < 0.34 ? '#e0b84a' : t < 0.58 ? '#c0902e' : t < 0.78 ? '#9a6e20' : t < 0.92 ? '#7a5418' : '#5a3a10';
    const MW = Math.round(prof[H0 - 1]) + 3, rows = [], K2 = '#1a1410', B1 = Math.round(4 * S), B2 = Math.round(15 * S), IN = Math.round(8 * S);
    for (let r = 0; r < H0; r++) { const hw = Math.round(prof[r]), row = []; for (let x = -MW; x <= MW; x++) { let c = null;
        if (Math.abs(x) === hw + 1 || (r === 0 && Math.abs(x) <= hw)) c = K2; else if (Math.abs(x) <= hw) { const u = (x + hw) / (hw * 2); c = BR(u);
          if (r === B1 || r === B2) c = u < 0.5 ? '#f0d080' : '#b08030'; if (r === B1 + 1 || r === B2 + 1) c = '#6a4614';
          if ((r === IN || r === IN + 1) && Math.abs(x) <= hw - 2 && ((x + r) & 1)) c = '#8a6220';
          if (r > 11 * S && r < 15 * S && hsh(x, r, 77) < 0.12 && ((x + r) & 1)) c = '#4a7a6a'; }
        row.push(c); } rows.push(row); }
    // 입술 타원 (앞 테두리 + 안쪽 어둠)
    for (let j = 1; j <= 5; j++) { const row = []; for (let x = -MW; x <= MW; x++) { const R2 = MW - 1.5, d = Math.round(Math.sqrt(Math.max(0, 1 - (x / R2) ** 2)) * 5); let c = null; if (Math.abs(x) <= R2 + 0.5) { if (j === 1) c = Math.abs(x) > R2 - 1 ? K2 : x < -R2 * 0.3 ? '#f0d080' : x < R2 * 0.3 ? '#c0902e' : '#7a5418'; else if (j <= d) c = j === d ? K2 : x < 0 ? '#9a6e20' : '#6a4614'; } row.push(c); } rows.push(row); }
    // 머리 고리
    const head = ['..kkkkkkk..', '.kYYOOOOOk.', 'kYk.....kOk', 'kOk.....kOk', 'kYk.....kOk', 'kkOOOOOOOkk', '.kOOOOOOOk.'], HP = { k: K2, O: '#9a6e20', Y: '#f0d080' };
    return { rows, MW, head, HP, H0 }; })();
  function drawBell(x, y, sway, flash) { const { rows, MW, head, HP, H0 } = BELL, id = SEL ? SKD.oid(SEL) : 0, N = rows.length, X = snap2(x), Y = snap2(y) - N * 2;
    for (let r = 0; r < N; r++) { const o = Math.round(sway * (r / N) / 2) * 2; for (let i = 0; i < rows[r].length; i++) { const c = rows[r][i]; if (!c) continue; SKD.pd(X + o + (i - MW) * 2, Y + r * 2, id, flash && c !== '#1a1410' && ((i + r) & 1) ? '#fff6d0' : c); } }
    cellDraw(head, HP, X - 10, Y - 12, false, id); }
  // ---------------- 성유물 십자가 (칸 그림): 꽃봉오리 네 끝 · 금 테두리 명암 · 새긴 점선 · 가운데 둥근 메달 + 붉은 보석 · 끝마다 작은 진주
  const CROSS = (() => { const W = 17, H = 23, cx = 8, cy = 9, g = Array.from({ length: H }, () => Array(W).fill('.')), put = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
    const arm = (x, y) => { const L = x - cx; return L < 0 ? 'Y' : L === 0 ? 'G' : 'O'; };
    for (let y = 2; y <= 20; y++) for (let x = cx - 1; x <= cx + 1; x++) put(x, y, x === cx - 1 ? 'Y' : x === cx ? 'G' : 'O');
    for (let x = 2; x <= 14; x++) for (let y = cy - 1; y <= cy + 1; y++) put(x, y, y === cy - 1 ? 'Y' : y === cy ? 'G' : 'O');
    for (const [bx, by] of [[cx, 1], [cx, 21], [1, cy], [15, cy]]) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (Math.abs(dx) + Math.abs(dy) <= 1 || (bx === cx ? dy === 0 : dx === 0)) put(bx + dx, by + dy, dx + dy < 0 ? 'Y' : dx + dy > 0 ? 'O' : 'G'); }
    for (const [bx, by] of [[cx, 0], [cx, 22], [0, cy], [16, cy]]) put(bx, by, 'w');
    for (let y = 4; y <= 18; y += 2) if (Math.abs(y - cy) > 2) put(cx, y, 'd'); for (let x = 4; x <= 12; x += 2) if (Math.abs(x - cx) > 2) put(x, cy, 'd');
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) put(cx + dx, cy + dy, dx * dx + dy * dy >= 4 ? (dx + dy < 0 ? 'Y' : 'O') : 'G');
    put(cx, cy, 'r'); put(cx - 1, cy, 'r'); put(cx, cy - 1, 'R'); put(cx + 1, cy, 'q'); put(cx, cy + 1, 'q'); put(cx - 1, cy - 1, 'w');
    return withOutline(pad(g.map(r => r.join('')))); })();
  const CROSS_PAL = { k: '#1a1410', Y: '#fff2b0', G: '#ffd34d', O: '#c9952a', d: '#8a6420', r: '#e03838', R: '#ff9a8a', q: '#8a1820', w: '#ffffff' }, CROSS_DIM = { k: '#1a1410', Y: '#a87a24', G: '#8a6420', O: '#5a4218', d: '#3a2a10', r: '#6a1a20', R: '#8a3a3a', q: '#3a0a10', w: '#c8c0b0' };
  function drawCross(x, y, dim, t) { const W = CROSS[0].length * 2, H = CROSS.length * 2, X = snap2(x) - W / 2, Y = snap2(y) - H / 2;
    if (!dim) { const n = 18; for (let i = 0; i < n; i++) { if ((i + Math.floor(t * 16)) % 3 === 0) continue; const a = i / n * TAU; dot(x + Math.cos(a) * 16, y - 2 + Math.sin(a) * 16, i % 4 ? '#ffe39a' : '#ffffff'); } }
    cellDraw(CROSS, dim ? CROSS_DIM : CROSS_PAL, X, Y, false, SEL ? SKD.oid(SEL) : 0);
    if (!dim && Math.floor(t * 10) % 3 === 0) star4(X + 8, Y + 10, 3, '#ffffff'); }
  function drawGround() {
    for (const Z of K.zones) { const t = Z.t;
      if (Z.k === 'rain') { const al = Math.min(1, t / 0.3, (Z.dur - t) / 0.3); ctx.globalAlpha = al; ring(Z.x, Z.y, Z.r, '#9ad8ff', 3, 0.6, Math.floor(t * 10)); ring(Z.x, Z.y, Z.r - 6, '#e8f8ff', 5, 0.6, -Math.floor(t * 10));
        for (let i = 0; i < 18; i++) { const ph = (t * 1.5 + i * 0.37) % 1, a = hsh(i, 1, 2) * TAU, r = Math.sqrt(hsh(i, 3, 4)) * Z.r * 0.9; if (t > 0.35 && t < 2.75) ring(Z.x + Math.cos(a) * r, Z.y + Math.sin(a) * r * 0.6, 2 + ph * 8, ph > 0.5 ? '#4f8dff' : '#9ad8ff', 0, 0.5); } ctx.globalAlpha = 1; }
      else if (Z.k === 'bell') { if (t < Z.land) { const q = t / Z.land, r = 40 * (1.3 - 0.3 * q); disk(Z.x, Z.y, Math.max(2, r * q), '#100c0a', 0.4); ring(Z.x, Z.y, r, Math.floor(t * 20) % 2 ? '#ffffff' : '#ffd34d', 2, 0.55); ring(Z.x, Z.y, r + 8, '#c9952a', 3, 0.55, Math.floor(t * 12)); }
        else { const al = Math.min(1, (Z.land + 2.0 - t) / 0.4); ctx.globalAlpha = al; for (const c of Z.cr || []) { let px = Z.x, py = Z.y; for (let j = 1; j <= 5; j++) { const r = c.l * j / 5, a = c.a + (hsh(c.s, j, 1) - 0.5) * 0.5, nx = Z.x + Math.cos(a) * r, ny = Z.y + Math.sin(a) * r * 0.6; pxLine(px, py, nx, ny, j < 3 ? '#100c0a' : '#2a2228'); px = nx; py = ny; } }
          if (Z.ringT && t - Z.ringT < 0.3) { const g = 1 - (t - Z.ringT) / 0.3; ctx.globalAlpha = al * g * 0.6; disk(Z.x, Z.y, 56, '#ffe39a', 0.5); }
          for (const w of Z.waves || []) { if (w.t < 0) continue; const p = w.t / w.max, r = lerp(w.r0, w.r1, 1 - (1 - p) * (1 - p)), n = Math.ceil(r * 1.4); ctx.globalAlpha = al * (1 - p * 0.7); for (let i = 0; i < n; i++) { if (p > 0.5 && (i >> 1) % 3 === 0) continue; const a = i / n * TAU; for (let d = 0; d < w.w; d++) SKD.pd(Z.x + Math.cos(a) * (r - d * 2), Z.y + Math.sin(a) * (r - d * 2) * 0.6, SKD.oid(w), d ? '#c9952a' : w.c); } }
          ctx.globalAlpha = 1; } }
      else if (Z.k === 'mochi') { if (t < 0.42) { const q = t / 0.42; disk(Z.x, Z.y, Math.max(2, 34 * q), '#100c0a', 0.35); ring(Z.x, Z.y, 40 * (1.3 - 0.3 * q), Math.floor(t * 20) % 2 ? '#ffffff' : '#fffaf0', 2, 0.55); }
        else { const al = Math.min(1, (3.6 - t) / 0.5); ctx.globalAlpha = al; const pr = t > 1.45 ? 56 : 40; disk(Z.x, Z.y, pr, '#d8ccb8', 0.5); disk(Z.x, Z.y - 2, pr - 4, '#f0e8d8', 0.5); disk(Z.x - 6, Z.y - 4, pr * 0.5, '#fffaf0', 0.5);
          for (const g of Z.goo || []) if (g.t > 0.3) { disk(g.tx, g.ty, g.s, '#d8ccb8', 0.6); disk(g.tx - 1, g.ty - 1, Math.max(2, g.s - 2), '#fffaf0', 0.6); } ctx.globalAlpha = 1; } }
      else if (Z.k === 'dawn') { const al = Math.min(1, t / 0.3, (Z.dur - t) / 0.4), r = Z.r * Math.min(1, t / 0.3), rot = t * 0.7; ctx.globalAlpha = al;
        if (t > 0.3 && t < 2.5) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const a = -t * 1.6 + i / 6 * TAU; for (let s = 0; s < 3; s++) { ctx.globalAlpha = al * (0.5 - s * 0.14); pxLine(Z.x, Z.y, Z.x + Math.cos(a - s * 0.05) * r, Z.y + Math.sin(a - s * 0.05) * r * 0.6, s ? '#8a6420' : '#ffe39a'); } } ctx.restore(); ctx.globalAlpha = al; }
        ring(Z.x, Z.y, r + 10, '#c9952a', 0, 0.6); for (let i = 0; i < 24; i++) { const a = -rot * 0.7 + i / 24 * TAU, px = Z.x + Math.cos(a) * (r + 10), py = Z.y + Math.sin(a) * (r + 10) * 0.6; dot(px - 2, py - 2, i % 3 ? '#ffe39a' : '#ffffff', i % 3 ? 2 : 4); }
        ring(Z.x, Z.y, r, '#ffe39a', 0, 0.6); ring(Z.x, Z.y, r - 6, '#fffbe6', 3, 0.6, Math.floor(t * 10)); ring(Z.x, Z.y, r * 0.55, '#ffe39a', 2, 0.6); ring(Z.x, Z.y, r * 0.3, '#fffbe6', 0, 0.6);
        for (let i = 0; i < 8; i++) { const a = rot + i / 8 * TAU, b = rot + (i + 3) / 8 * TAU; pxLine(Z.x + Math.cos(a) * r, Z.y + Math.sin(a) * r * 0.6, Z.x + Math.cos(b) * r, Z.y + Math.sin(b) * r * 0.6, i % 2 ? '#c9952a' : '#ffd34d'); }
        for (let i = 0; i < 6; i++) { const a = -rot * 1.4 + i / 6 * TAU, b = -rot * 1.4 + (i + 2) / 6 * TAU, q = r * 0.55; pxLine(Z.x + Math.cos(a) * q, Z.y + Math.sin(a) * q * 0.6, Z.x + Math.cos(b) * q, Z.y + Math.sin(b) * q * 0.6, '#fffbe6'); }
        for (let i = 0; i < 8; i++) { const a = rot + i / 8 * TAU; star4(Z.x + Math.cos(a) * r, Z.y + Math.sin(a) * r * 0.6, Math.floor(t * 12 + i) % 2 ? 6 : 4, '#ffe39a'); }
        disk(Z.x, Z.y, 8 + Math.sin(t * 10) * 2, '#fffbe6', 0.6); ctx.globalAlpha = 1; }
      else if (Z.k === 'spear' && t < Z.land) { const q = t / Z.land, r = 80 * (1.25 - 0.25 * q); ring(Z.x, Z.y, r, q > 0.7 && Math.floor(t * 24) % 2 ? '#ffffff' : '#ffe39a', 2, 0.55); ring(Z.x, Z.y, r * 0.6, '#fffbe6', 3, 0.55, Math.floor(t * 12)); ring(Z.x, Z.y, r * 0.25, '#ffe39a', 0, 0.55); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + t * 3; pxLine(Z.x + Math.cos(a) * r * 0.3, Z.y + Math.sin(a) * r * 0.18, Z.x + Math.cos(a) * r * 0.9, Z.y + Math.sin(a) * r * 0.54, '#ffe39a'); } }
      else if (Z.k === 'spear' && t >= Z.land) { const al = Math.min(1, (Z.land + 1.8 - t) / 0.4); ctx.globalAlpha = al;
        for (const c of Z.cr || []) { let px = Z.x, py = Z.y; for (let j = 1; j <= 5; j++) { const r = c.l * j / 5, a = c.a + (hsh(c.s, j, 1) - 0.5) * 0.5, nx = Z.x + Math.cos(a) * r, ny = Z.y + Math.sin(a) * r * 0.6; pxLine(px, py, nx, ny, '#100c0a'); if (j > 1) pxLine(px, py - 2, nx, ny - 2, t < Z.land + 1.0 && Math.floor(t * 14) % 2 ? '#ffe39a' : '#5a4a20'); px = nx; py = ny; } }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const pu = 0.5 + 0.5 * Math.sin(t * 12); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, L = 130 * Math.min(1, (t - Z.land) * 5); ctx.globalAlpha = al * (0.4 + 0.4 * pu); pxLine(Z.x, Z.y, Z.x + Math.cos(a) * L, Z.y + Math.sin(a) * L * 0.6, '#ffe39a'); pxLine(Z.x, Z.y - 2, Z.x + Math.cos(a) * L * 0.7, Z.y - 2 + Math.sin(a) * L * 0.42, '#fffbe6'); } ctx.restore(); ctx.globalAlpha = 1; }
    }
  }
  function drawOver() { const P = G.player; if (SEL && SEL.bunny) { drawBunny(SEL); return; }
    if (SEL === 'guard') { const R = P.prs; if (!R || R.k !== 'pan' || !R.guard) return; const a = R.a, cx = P.x + Math.cos(a) * 18, cy = P.y - 10 + Math.sin(a) * 12, pu = Math.floor(R.t * 20) % 2; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = -8; i <= 8; i++) { const b = a + i * 0.12, r = 30 + (i % 2) * 2; dot(cx + Math.cos(b) * r - Math.cos(a) * 14, cy + Math.sin(b) * r * 0.8 - Math.sin(a) * 10, Math.abs(i) > 6 ? '#c9952a' : pu ? '#fff2b0' : '#ffd34d'); } ctx.restore(); return; }
    for (const Z of K.zones) { if (Z !== SEL) continue; const t = Z.t;
      if (Z.k === 'pillar') { const p = t / Z.dur, w = Math.max(2, Math.round(Z.w * (p < 0.15 ? p / 0.15 : 1 - (p - 0.15) * 0.9) / 2) * 2), top = Z.y - 150, id = SKD.oid(Z); // 빛기둥: 끊김 없이 이어지고 위로 갈수록 투명
        for (let yy = top; yy < Z.y; yy += 2) { const k = (yy - top) / (Z.y - top); ctx.globalAlpha = Math.min(1, 0.15 + k * 1.3); run(Z.x - w - 2, yy, id, '#c9952a', 2); run(Z.x + w, yy, id, '#c9952a', 2); run(Z.x - w, yy, id, '#ffe39a', w * 2); run(Z.x - 2, yy, id, '#ffffff', 4); } ctx.globalAlpha = 1;
        ring(Z.x, Z.y, Z.w + 6, '#fffbe6', 2, 0.55); ring(Z.x, Z.y, Z.w + 12, '#c9952a', 3, 0.55); }
      else if (Z.k === 'rain') { const al = Math.min(1, t / 0.3, Math.max(0, (3.0 - t) / 0.3)); if (al <= 0) continue; const gr = Math.min(1, t / 0.3), cy = Z.y - 100 + Math.sin(t * 2) * 2; ctx.globalAlpha = al; // 통통한 성수 구름 + 빗줄기
        for (const d of Z.drops) if (d.h > 0) { pxLine(d.x, Math.max(d.y - d.h - 12, cy + 14), d.x, d.y - d.h, d.h > 50 ? '#9ad8ff' : '#e8f8ff'); dot(d.x, d.y - d.h, '#ffffff'); }
        const PF = [[-48, 6, 11], [-30, 9, 15], [-9, 10, 17], [13, 9, 16], [33, 8, 14], [50, 5, 10], [-36, -6, 14], [-16, -12, 19], [8, -15, 21], [29, -7, 16], [45, -2, 11], [-2, -26, 13], [18, -24, 10]].map(([dx, dy, r], i) => [Z.x + dx * gr, cy + dy * gr + Math.sin(t * 2.4 + i) * 1.2, Math.max(2, r * gr + Math.sin(t * 3 + i * 1.7))]);
        for (const [x, y, r] of PF) disk(x, y, r + 2, '#3a4660', 0.7);
        for (const [x, y, r] of PF) disk(x, y, r, '#8a9ab8', 0.7);
        for (const [x, y, r] of PF) disk(x - 1, y - 3, Math.max(2, r - 2), '#c8d8f0', 0.7);
        for (const [x, y, r] of PF) disk(x - 3, y - 5, Math.max(2, r - 6), '#eaf4ff', 0.7);
        for (const [x, y, r] of PF) if (r > 12) disk(x - 5, y - 7, Math.max(2, r - 11), '#ffffff', 0.7);
        for (let xx = -50; xx <= 50; xx += 2) { const by = cy + 16 * gr + Math.round(Math.sin(xx * 0.3 + t * 3)); dot(Z.x + xx * gr, by, '#5a6a8c'); if (xx % 6 === 0) dot(Z.x + xx * gr, by + 2, '#9ad8ff'); } // 아랫면 그늘 + 맺힌 물방울
        for (let i = 0; i < 7; i++) { if (Math.floor(t * 8 + i) % 3) continue; star4(Z.x + (i - 3) * 18 * gr, cy - 18 + (i % 2) * 8, 3, i % 2 ? '#ffe39a' : '#ffffff'); }
        ctx.globalAlpha = 1; }
      else if (Z.k === 'bell') { if (t > Z.land + 2.0) continue; const fall = t < Z.land ? (1 - (t / Z.land) ** 2) * 260 : 0, rise = t > Z.land + 1.6 ? (t - Z.land - 1.6) / 0.4 : 0, rr = Z.ringT ? t - Z.ringT : 9, sway = rr < 0.4 ? Math.sin(rr * 36) * (1 - rr / 0.4) * (8 + (Z.ringN || 0) * 3) : 0;
        if (t < Z.land) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let j = 0; j < 6; j++) dot(Z.x + rand(-30, 30), Z.y - fall - 90 - j * 12, '#ffe39a', 2); ctx.restore(); }
        ctx.globalAlpha = 1 - rise; drawBell(Z.x, Z.y - fall - rise * 30, sway, rr < 0.08); ctx.globalAlpha = 1;
        if (rr < 0.4 && !rise) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const p = rr / 0.4; for (let i = 0; i < 3; i++) { const r = 50 + p * 50 + i * 14; for (let a = -2.6; a < -0.5; a += 0.08) { if ((Math.round(a * 20) + i) % 3 === 0) continue; dot(Z.x + Math.cos(a) * r, Z.y - 50 + Math.sin(a) * r * 0.7, i ? '#ffe39a' : '#ffffff'); dot(Z.x - Math.cos(a) * r, Z.y - 50 + Math.sin(a) * r * 0.7, i ? '#ffe39a' : '#ffffff'); } } ctx.restore(); } }
      else if (Z.k === 'reliq') { ctx.globalAlpha = t < Z.dur ? 1 : Math.max(0, 1 - (t - Z.dur) / 0.3); for (const r of Z.rs.slice().sort((a, b) => a.z - b.z)) { if (r.x == null) continue; drawCross(r.x, r.y, r.z < -0.3, t); if (r.z > 0.3) star4(r.x + 8, r.y - 14, Math.floor(t * 16) % 2 ? 4 : 2, '#ffe39a'); }
        ctx.globalAlpha = 1;
        if (t < Z.dur) { const n = 30; for (let i = 0; i < n; i++) { if ((i + Math.floor(t * 30)) % 3 === 0) continue; const a = i / n * TAU - t * 3; dot(P.x + Math.cos(a) * 38, P.y - 10 + Math.sin(a) * 23, '#c9952a'); } } }
      else if (Z.k === 'mochi') { if (t > 3.6) continue; // v3.22 하늘의 달떡은 그리지 않음
        let w, h, yo = 0; const sq = (u, A) => Math.exp(-u * 7) * Math.cos(u * 26) * A;
        if (t < 0.42) { const q = t / 0.42; yo = -(1 - q * q) * 240; w = 24; h = 40; }
        else if (t < 0.95) { const u = t - 0.42, air = Math.sin(Math.min(1, u / 0.53) * Math.PI); yo = -air * 34; const s = sq(u, 0.5); w = air > 0.25 ? 26 : 34 * (1 + s); h = air > 0.25 ? 36 : 1000 / w; }
        else if (t < 1.45) { const u = t - 0.95, air = Math.sin(Math.min(1, u / 0.5) * Math.PI); yo = -air * 18; const s = sq(u, 0.45); w = air > 0.25 ? 30 : 38 * (1 + s); h = air > 0.25 ? 32 : 1000 / w; }
        else { const u = t - 1.45, s = sq(u, 0.35); w = 44 * (1 + s) + Math.min(10, u * 4); h = Math.max(8, 760 / w - u * 3); }
        if (yo < -4 && t > 0.42) { const top = Z.y + yo - 2; for (const dx of [-10, 0, 10]) { for (let yy = top; yy < Z.y; yy += 2) dot(Z.x + dx + Math.sin((yy - top) * 0.15 + dx) * 2, yy, '#f0e8d8'); } } // 쭉 늘어나는 떡 실
        drawMochi(Z.x, Z.y + yo, w, h, t > 3.0 ? Math.max(0, 1 - (t - 3.0) / 0.6) : 1);
        for (const g of Z.goo) if (g.t < 0.3) { const q = g.t / 0.3; disk(lerp(g.x, g.tx, q), lerp(g.y, g.ty, q) - Math.sin(q * Math.PI) * 30, g.s, '#fffaf0', 1); } }
      else if (Z.k === 'dawn') { for (const m of Z.motes || []) { const k = 1 - m.t / m.max; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k; dot(m.x, m.y, k > 0.6 ? '#ffffff' : '#ffe39a', k > 0.7 ? 4 : 2); ctx.restore(); }
        if (Z.bt && t - Z.bt < 0.45) { const p = (t - Z.bt) / 0.45, r = 20 + p * 90; ctx.save(); ctx.globalAlpha = 1 - p; disk(Z.x, Z.y - 40, r, '#fffbe6', 0.8); disk(Z.x, Z.y - 40, r * 0.6, '#ffffff', 0.8); ctx.restore(); } }
      else if (Z.k === 'spear') { const a = Math.atan2(Z.y - Z.sy, Z.x - Z.sx), fade = t > Z.land + 1.4 ? Math.max(0, 1 - (t - Z.land - 1.4) / 0.4) : 1;
        if (t < Z.land) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const H = Z.hist || []; for (let i = 1; i < H.length; i++) { const k = i / H.length; ctx.globalAlpha = k; for (let j = -2; j <= 2; j++) pxLine(H[i - 1].x - Math.sin(a) * j * 2, H[i - 1].y + Math.cos(a) * j * 2, H[i].x - Math.sin(a) * j * 2, H[i].y + Math.cos(a) * j * 2, Math.abs(j) < 1 ? '#ffffff' : Math.abs(j) < 2 ? '#fffbe6' : '#c9952a'); } ctx.restore(); ctx.globalAlpha = 1;
          if (Z.tx != null) drawSpearRot(Z.tx, Z.ty, a + Math.PI, 1.3, null, true); }
        else { const sink = 14, tx = Z.x + Math.cos(a) * sink, ty = Z.y + Math.sin(a) * sink; ctx.globalAlpha = fade; drawSpearRot(tx, ty, a + Math.PI, 1.3, Z.y + 1, t < Z.land + 0.3); ctx.globalAlpha = 1;
          if (t < Z.land + 0.8) { const p = (t - Z.land) / 0.8; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const w = Math.max(2, Math.round(22 * (1 - p) / 2) * 2); for (let yy = Z.y - 240; yy < Z.y; yy += 2) { ctx.globalAlpha = Math.min(1, 0.15 + (1 - (Z.y - yy) / 240) * 1.3); run(Z.x - w, yy, SKD.oid(Z), '#c9952a', w * 2); run(Z.x - w / 2, yy, SKD.oid(Z), '#fffbe6', w); } ctx.globalAlpha = 1; ctx.restore(); } } }
    }
  }
  SKD.add(ents => { if (!G) return; const P = G.player, one = it => SKD.one(drawOver, v => SEL = v, it);
    if (P && P.prs && P.prs.k === 'pan') ents.push({ y: P.y + 2, d: one('guard') });
    for (const Z of K.zones) { if (Z.k === 'bunny') { for (const b of Z.bs || []) if (!b.dead) { b.bunny = true; ents.push({ y: b.y, d: one(b) }); } continue; } ents.push({ y: Z.k === 'reliq' ? P.y + 1 : Z.k === 'rain' ? Z.y - 200 : Z.k === 'dawn' ? P.y + 1 : Z.y + 1, d: one(Z) }); } });
  const _dgg = drawGearGround, gd = SKD.ground(drawGround); drawGearGround = function () { _dgg(); ctx.save(); gd(); ctx.restore(); };
  const _woh = weaponOnHit; weaponOnHit = function (e, o, crit) { _woh(e, o, crit); const P = G.player; if (G.cls === 'priest' && o && o.basic && wSkill() === 'whip' && P.state === 'attack' && P.combo === 2 && !e.dead) { if (!(e.bleedT > 0)) gxSpurt(e, 8, o.ang || 0); e.bleedT = 3; if (!(e.bleedTick > 0)) e.bleedTick = 0.5; } };
  const _ie = itemExtra;
  itemExtra = function (it, cls) { const base = _ie(it, cls); if (!it || it.wk == null || it.cls !== 'priest') return base;
    const sk = (wcat('priest')[it.wk] || {}).sk, D = DEF[sk]; if (!D) return base;
    return base + `<div class="fx">우클릭 「${D.n}」 · 쿨타임 ${D.cd}초 — ${D.d}${SHD}</div>`; };

  return SKD.wrapAll({ start, update, tick, def, DEF });
})();
;

// ==================================================================== 46_icons.js
'use strict';
// 잿빛 왕관 원정대 — 46_icons.js : v3.23 무기별 우클릭 스킬 아이콘 (16칸 도트 · 1칸 = 2px)
// 지도 한 줄 = 16칸. '.'은 빈칸. 레이어: back(윤곽선 없음 · 효과) → main(검은 윤곽선 자동) → top(반짝임)
// HUD 스킬 칸은 무기를 바꾸면 SK_META[스킬].Ki 아이콘으로 바뀐다.
(function () {
  const MAP = (a, layer, rows, pal) => { a.layer(layer); rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = pal[r[x]]; if (c) a.rect(x * 2, y * 2, x * 2 + 1, y * 2 + 1, c); } }); };
  const IC = (key, theme, back, main, top, pal, glow) => {
    ICON32[key] = icon32(theme, a => { if (glow) { a.layer('back'); a.glow(glow[0], glow[1], glow[2], glow[3]); } if (back) MAP(a, 'back', back, pal); MAP(a, 'main', main, pal); if (top) MAP(a, 'top', top, pal); });
  };
  const ST = { W: '#ffffff', L: '#e4e8f0', S: '#b4b9c8', s: '#868c9e', d: '#585e70' }; // 강철
  const WD = { h: '#5a3420', H: '#8a5a32', j: '#3a2014' }; // 나무 손잡이
  const GD = { Y: '#ffe08a', G: '#d8a038', g: '#9a6420' }; // 금
  const P = (...o) => Object.assign({}, ...o);

  // ---------------------------------------------------------------- 기사
  // 정육 내려치기 — 문짝만 한 식칼이 바닥을 내려찍고, 갈라진 틈에서 불티가 튄다
  IC('k_cleaver', ['#1a0c0a', '#3a1810', '#6a2a14'],
    ['................',
     '..m...m...m.....',
     '..m...m...m.....',
     '................', '................', '................', '................', '................', '................', '................', '................',
     '...o....o...o...',
     '.cc.occ.cco.cc..',
     '....c.....c.....',
     '................',
     '................'],
    ['................', '................', '................',
     '.LLLLLLLLLd.....',
     '.LoSSSSSSSdYhhh.',
     '.SSSSSSSSSdGHHhj',
     '.SSSSSSSSsd.....',
     '.SSSSSSSssd.....',
     '.ssssssssdd.....',
     '.WWWWWWWWWW.....',
     '................', '................', '................', '................', '................', '................'],
    ['................', '................', '................', '................', '................', '................', '................', '................', '................', '................',
     '.y...y.....y....',
     'y..........y....',
     '................', '................', '................', '................'],
    P(ST, WD, GD, { o: '#ff9a3a', c: '#c04018', m: '#7a3a20', y: '#ffe8a0' }), [16, 22, 10, ['#3a1810', '#6a2a14', '#a04018']]);

  // 참치 썰매 — 꽁꽁 언 참치에 올라 미끄러지고, 뒤로 얼음 줄이 남는다
  IC('k_tuna', ['#06121e', '#0c2236', '#18405e'],
    ['................', '................', '................', '................', '................',
     'ii..............',
     '.iiii...........',
     'iii.............',
     '.iiiii..........',
     'ii..............',
     '................', '................',
     'IIIIIIIIIIIIIII.',
     'iiiiiiiiiiiiii..',
     '................', '................'],
    ['................', '................', '................',
     '...........f....',
     '..t.......ffb...',
     '.tt...bbbbbbbbb.',
     '.ttbbbbbbbbbbbew',
     '..tBBBBBBBBBBBBk',
     '.ttnnnnnnnnnnnnb',
     '.t..yy.y.y..nn..',
     '................', '................', '................', '................', '................', '................'],
    ['................', '................', '................', '................', '................', '................',
     '....q...q...q...',
     '................', '................', '................', '................',
     '.....Q....Q.....',
     '................', '................', '................', '................'],
    { b: '#2a4a8a', B: '#4a78b8', n: '#d8e6f0', t: '#2a4a8a', f: '#3a5a9a', e: '#ffffff', w: '#1a1a2a', k: '#e8f0f8', y: '#ffd040', i: '#4a90c0', I: '#bfe8ff', q: '#e8f8ff', Q: '#ffffff' }, [14, 14, 11, ['#0c2236', '#18405e', '#2a6a90']]);

  // 분절 휘감기 — 마디가 벌어진 분절검이 소용돌이처럼 한 바퀴 휘감긴다
  ICON32.k_chain = icon32(['#0e0c18', '#1e1a34', '#363060'], a => {
    a.layer('back'); a.glow(14, 12, 9, ['#1e1a34', '#363060']);
    a.arc(17, 19, 14, 185, 350, 0.3, 3.4, ['#363060', '#6a5ab0', '#b8a8ff', '#ffffff']);
    MAP(a, 'main', ['................',
      '..........WWS...',
      '.........WSSdkWS',
      '.........Sdd..Sd',
      '........k.....dt',
      '......WWS.......',
      '.....WSSd.......',
      '.....Sdd........',
      '....k...........',
      '..WWS...........',
      '.WSSd...........',
      '.Sdd............',
      'G.G.............',
      '.G..............',
      'h...............',
      'p...............'], { W: '#ffffff', S: '#c8ccd8', d: '#6a7084', t: '#e4e8f0', k: '#9a90b8', G: '#d8a038', h: '#5a3420', p: '#a3222a' });
    a.layer('top'); a.rect(26, 2, 27, 3, '#e8e0ff'); a.rect(6, 4, 7, 5, '#ffffff');
  });

  // 종 울리기 — 종지기의 추가 바닥을 때리고 울림 고리가 세 겹 퍼진다
  ICON32.k_bell = icon32(['#141006', '#2e240c', '#5a4618'], a => {
    a.layer('back'); a.glow(16, 18, 10, ['#2e240c', '#5a4618']);
    for (const [r, c] of [[15, '#a07a28'], [10.5, '#e0b040'], [6, '#fff0b0']]) for (let i = 0; i < 160; i++) { const an = i / 160 * Math.PI * 2; a.px(16 + Math.cos(an) * r, 26 + Math.sin(an) * r * 0.34, c); }
    MAP(a, 'main', ['.......Ss.......', '.......Ss.......', '.......Ss.......', '.......Ss.......', '.......Ss.......', '......gYGg......', '.......Ss.......',
      '......gGGg......', '.....gYYGGg.....', '....gYYGGGGg....', '....gYGGGGgg....', '....gGGGGggg....', '.....gGGggg.....', '......gggg......', '................', '................'],
      { S: '#b4b9c8', s: '#585e70', Y: '#ffe08a', G: '#d8a038', g: '#8a5a1a' });
    a.layer('top'); a.rect(12, 18, 13, 19, '#fffaf0'); a.star(27, 9, 2, '#fff4c0'); a.star(5, 13, 1, '#fff4c0');
  });

  // 돌개바람 — 풍차 날개 넉 장이 바람을 감으며 돈다
  ICON32.k_windmill = icon32(['#08140e', '#10281c', '#1e4a34'], a => {
    a.layer('back'); a.glow(15, 16, 10, ['#10281c', '#1e4a34']);
    for (let k = 0; k < 4; k++) a.arc(15, 17, 14, k * 90 + 15, k * 90 + 70, 0.3, 2.4, ['#1e4a34', '#4aa070', '#b0f0c8']);
    MAP(a, 'main', ['.......affff....', '.......afccf....', '.......afllf....', '.......afccf....', 'fffffffafllf....', 'fclclcfafccf....', 'fclclcfaffff....', 'fffffffa........',
      'aaaaaaahaaaaaaaa', '...ffffa.fffffff', '...fccfa.fclclcf', '...fllfa.fclclcf', '...fccfa.fffffff', '...fllfa........', '...fccfa........', '...ffffa........'],
      { a: '#6a4024', f: '#b09870', c: '#f0e4c8', l: '#c8b48c', h: '#d8a038' });
    a.layer('top'); a.rect(28, 28, 29, 29, '#b0f0c8'); a.rect(2, 26, 3, 27, '#ffffff');
  });

  // 뼈 톱질 — 톱니 뼈 대검이 앞으로 찔러 들어가고 핏방울이 튄다
  IC('k_fang', ['#180808', '#341010', '#601818'],
    ['................', '................', '................', '................',
     '.rr.r.r.........',
     '................', '................', '................', '................',
     '.r.r..r.r.......',
     '................', '................', '................', '................', '................', '................'],
    ['................', '................', '................', '................', '................',
     '....v.v.v.v.v...',
     'jHG.wWWWWWWWWWv.',
     'hhGbwwwwwwwwwwww',
     'jHG.uuuuuuuuuu..',
     '....v.v.v.v.v...',
     '................', '................', '................', '................', '................', '................'],
    ['................', '................', '................',
     '.............R..',
     '...........R....',
     '................', '................', '................', '................', '................',
     '..........R.....',
     '............R.R.',
     '.............R..',
     '................', '................', '................'],
    P(WD, GD, { W: '#fffaf0', w: '#e8dcc0', u: '#b0a080', v: '#c8b890', b: '#8a2020', r: '#a02020', R: '#ff4040' }), [16, 16, 11, ['#341010', '#601818', '#902828']]);

  // 단죄(옛 성문 돌파) — v3.44 철퇴를 든 기사의 어두운 무채색 얼굴 · 붉은 눈 · 뒤로 남는 검은 궤적
  IC('k_gate', ['#0c0a10', '#1c1a22', '#3a1418'],
    ["................", "................", "................", "................", "t.t.ttt.........", "...tttt.........", "t.t.ttt.........", "...tttt.........", "t.t.ttt.........", "t.t.ttt.........", "t.t.ttt.........", "...tttt.........", "t.t.ttt.........", "...tttt.........", "................", "................"],
    ["................", "................", "................", ".......k1Rk.....", ".....kk1rRRk....", "....k1rkkMMMk...", "....k6kMMMMMMk..", "....k23MMMMMMMk.", "....k277hhhhhmk.", "....k25vSSSvSmk.", "...k22SvSSSvSmmk", "...kk2D5SsSSDmk.", ".kkRRkk11RRRkk..", "kRRRk23MRRRMMmk.", "RRRrk5k24RDmkSk.", "................"],
    null,
    {"k": "#0b0a0e", "R": "#222228", "r": "#19191f", "M": "#44444a", "m": "#3a3a40", "D": "#323238", "h": "#24242a", "S": "#46464c", "s": "#2e2e34", "v": "#ff2a2a", "F": "#17171d", "1": "#19191f", "2": "#28282e", "3": "#2e2e34", "4": "#232329", "5": "#2f2f35", "6": "#131319", "7": "#1a1a20", "t": "#0c0a10"}, [10, 9, 8, ['#1c0c0e', '#3a1418', '#5a1a1c']]);

  // 바게트 부메랑 — 돌덩이 바게트가 빙글빙글 돌며 되돌아온다
  ICON32.k_bread = icon32(['#160e06', '#30200c', '#5a3c18'], a => {
    a.layer('back'); a.glow(16, 15, 12, ['#30200c', '#5a3c18', '#8a5a24']);
    a.arc(16, 16, 12, 150, 400, 0.3, 2.6, ['#5a3c18', '#c08040', '#ffd8a0', '#ffffff']);
    a.tri([[25, 26], [30, 20], [22, 20]], '#ffd8a0');
    a.layer('main');
    a.blade(7, 24, 25, 7, 7, ['#f0c070', '#c88a3a', '#8a5420'], 0.0); a.disc(7.5, 23.5, 3.2, '#c88a3a'); a.disc(24.5, 7.5, 3.2, '#c88a3a'); a.disc(24, 7, 2, '#e0a050');
    for (let i = 0; i < 4; i++) { const t = 0.22 + i * 0.18, x = 7 + 18 * t, y = 24 - 17 * t; a.line(x - 1.5, y - 1.5, x + 1.5, y + 1.5, 1, '#fff0c8'); }
    a.layer('top'); a.px(11, 6, '#fff4c0'); a.px(27, 27, '#ffffff');
  });

  // 별의 서약 — 땅에 꽂힌 금빛 대검 위로 여덟 갈래 별빛이 터진다
  ICON32.k_sun = icon32(['#141006', '#2e240c', '#5a4618'], a => {
    a.layer('back'); a.glow(16, 9, 9, ['#5a4618', '#a07a28', '#e0b040']);
    for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2, L = i % 2 ? 7 : 12; a.comet(16 + Math.cos(an) * L, 9 + Math.sin(an) * L, 16, 9, 0.3, 1.2, ['#a07a28', '#ffe08a', '#ffffff']); }
    for (let x = 3; x < 30; x += 2) a.px(x, 28 + ((x >> 1) % 2), '#8a6a24');
    a.layer('main');
    a.blade(16, 29, 16, 12, 6.5, ['#fff4c0', '#e8b84a', '#8a5a1a'], 0); a.line(16, 14, 16, 28, 0.8, '#fffaf0');
    a.line(10, 12, 22, 12, 2.4, '#d8a038'); a.line(10, 12, 22, 12, 0.8, '#ffe08a'); a.disc(16, 12, 1.8, '#c02838');
    a.line(16, 4, 16, 11, 2.4, '#7a5232'); a.disc(16, 3.5, 1.6, '#ffe08a');
    a.line(14, 13, 11, 18, 1.2, '#c02838'); a.line(18, 13, 21, 18, 1.2, '#c02838');
    a.layer('top'); a.star(16, 9, 3, '#ffffff', '#ffffff'); a.px(6, 20, '#fff4c0'); a.px(26, 21, '#fff4c0');
  });

  // 처형 — 잿불이 흐르는 검은 처형검이 붉은 초승달을 그리며 내리친다
  ICON32.k_exec = icon32(['#120606', '#2a0a0a', '#501010'], a => {
    a.layer('back'); a.glow(15, 15, 12, ['#2a0a0a', '#501010', '#801818']);
    a.arc(15, 14, 12, 200, 340, 0.4, 4.6, ['#501010', '#a01818', '#ff4030', '#ffc0a0']);
    a.layer('main');
    a.blade(10, 25, 26, 7, 7, ['#6a6478', '#3a3444', '#1a161e'], 0.18); a.line(12, 22, 24, 9, 0.8, '#ff6020'); a.px(19, 15, '#ffd060'); a.px(15, 19, '#ffa030');
    a.line(6, 20, 13, 27, 2.6, '#8a6a7a'); a.disc(9.5, 23.5, 1.6, '#ffe08a'); a.px(6, 20, '#ffe08a'); a.px(13, 27, '#ffe08a');
    a.line(3, 29, 8, 24, 2.6, '#2a1a1a'); a.px(5, 27, '#6a3a2a'); a.disc(3, 29.5, 1.5, '#a3222a');
    a.layer('top'); a.star(25, 6, 2, '#ffc0a0'); a.px(22, 25, '#ff6040'); a.px(26, 21, '#ff8060');
  });

  for (const k of ['cleaver', 'tuna', 'chain', 'bell', 'windmill', 'fang', 'gate', 'bread', 'sun', 'exec']) if (SK_META[k]) SK_META[k].Ki = 'k_' + k;

  // ---------------------------------------------------------------- 어쌔신
  // 냥냥 난타 — 세 줄 발톱 자국 + 핏방울
  ICON32.a_claw = icon32(['#180808', '#341010', '#601818'], a => {
    a.layer('back'); a.glow(16, 15, 9, ['#341010', '#601818']);
    MAP(a, 'main', ['................', '................', '...........r....', '.......r..R....r', '......R..W....R.', '.....W..WP...W..', '....WP.WP...WP..', '...WP.WP...WP...', '..WP.WP...WP....', '.WP.WP...WP.....', 'WP.W....WP......', '..R....W........', '.r....R.........', '.....r..........', '................', '................'], { W: '#ffffff', P: '#ffb0b0', R: '#e04040', r: '#901818' });
    a.layer('top'); a.rect(26, 24, 27, 25, '#ff4040'); a.rect(22, 28, 23, 29, '#ff4040'); a.rect(4, 4, 5, 5, '#ffffff');
  });
  // 찰싹 연타 — 말린 고등어가 휘둘러지며 찰싹
  IC('a_mackerel', ['#06141a', '#0c2830', '#164650'],
    ['................', '..mm............', '....mm..........', '.....m..........', '................', '................', '................', '................', '................', '................', '................',
     '.....m..........', '....mm..........', '..mm............', '................', '................'],
    ['................', '................', '................', '................', '................',
     't........fff....',
     'tt.bbbbbbbbbbb..',
     '.tbkbbkbbkbbbbe.',
     '.tbbkbbkbbkbbbbw',
     'tt.nnnnnnnnnnnn.',
     't...nnnnnnnnn...',
     '................', '................', '................', '................', '................'],
    ['................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '................',
     '.............y..', '...........y.y..', '.............y..', '................'],
    { b: '#3a9ab0', k: '#0e2a34', n: '#d8e4ec', t: '#2a6a78', f: '#2a6a78', e: '#ffffff', w: '#0a1418', j: '#a8b8c4', m: '#6ac8d8', y: '#ffffff' }, [16, 15, 10, ['#0c2830', '#164650']]);
  // 사신의 원무 — 쌍낫이 몸 둘레를 빙글빙글
  ICON32.a_sickle = icon32(['#0e0a16', '#1e1430', '#3a2858'], a => {
    a.layer('back'); for (let i = 0; i < 48; i++) { if (i % 3 === 2) continue; const an = i / 48 * Math.PI * 2; a.px(16 + Math.cos(an) * 12, 16 + Math.sin(an) * 12, i % 2 ? '#8a6ad0' : '#c8b0ff'); }
    MAP(a, 'main', ['................', '..........WWWWh.', '.........WSs..h.', '........WS....h.', '........S.....h.', '..............h.', '..............h.', '..............H.', '.H..............', '.h..............', '.h..............', '.h.....S........', '.h....SW........', '.h..sSW.........', '.hWWWW..........', '................'], { W: '#ffffff', S: '#c8ccd8', s: '#868c9e', h: '#6a4024', H: '#a3222a' });
    a.layer('top'); a.rect(16, 15, 17, 16, '#c8b0ff');
  });
  // 회오리 부채 — 활짝 편 부채 + 앞으로 나아가는 회오리
  ICON32.a_fan = icon32(['#06140e', '#0c281c', '#164a32'], a => {
    a.layer('back'); a.glow(20, 12, 10, ['#0c281c', '#164a32']);
    for (let i = 0; i < 5; i++) { const y = 4 + i * 4, rx = 9 - i * 1.4; for (let k = 0; k < 40; k++) { const an = k / 40 * Math.PI * 2; if (Math.sin(an) > 0.2) continue; a.px(22 + i * 0.8 + Math.cos(an) * rx, y + Math.sin(an) * 1.6, i % 2 ? '#b0f0c8' : '#6ad0a0'); } }
    MAP(a, 'main', ['................', '................', '................', '................', '.EEEE...........', '.ccrrEE.........', '.ccrcccE........', '.crrccrrE.......', '.crrcrrccE......', '.crccrcccrE.....', '.crcrcccrrE.....', '.crrccrrrrcE....', '...ccrrccccE....', '.Y..cccccrrE....', '.Y..rrrrrrrE....', '................'], { r: '#d04848', c: '#f0e4c8', E: '#7a2020', Y: '#e8b84a' });
    a.layer('top'); a.rect(28, 2, 29, 3, '#ffffff');
  });
  // 바느질 — 긴 바늘이 붉은 실을 끌며 적을 차례로 꿰뚫는다
  ICON32.a_needle = icon32(['#160a10', '#2e1422', '#542440'], a => {
    a.layer('back'); a.glow(16, 16, 9, ['#2e1422', '#542440']);
    const pts = [[3, 28], [8, 18], [13, 24], [18, 13], [22, 18]]; for (let i = 1; i < pts.length; i++) a.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 1, '#e03050');
    a.layer('main'); a.blade(18, 15, 30, 3, 3, ['#ffffff', '#c8ccd8', '#6a7084'], 0.5); a.ring(18.5, 14.5, 0.6, 1.8, '#c8ccd8');
    for (const [x, y] of [[8, 18], [13, 24]]) a.disc(x, y, 1.6, '#ff6080');
    a.layer('top'); a.rect(28, 4, 29, 5, '#ffffff');
  });
  // 그림자 사슬 — 사슬낫이 일직선으로 길게 날아간다
  ICON32.a_kusari = icon32(['#0e0a16', '#1e1430', '#3a2858'], a => {
    a.layer('back'); a.comet(2, 30, 20, 12, 0.3, 3, ['#1e1430', '#3a2858', '#6a4a98']);
    a.layer('main'); for (let i = 0; i < 6; i++) { const t = i / 6, x = 4 + 16 * t, y = 28 - 16 * t; a.disc(x, y, 1.3, i % 2 ? '#8a8fa0' : '#c8ccd8'); }
    a.ring(23, 10, 4, 6.4, '#c8ccd8', -200, -20); a.ring(23, 10, 4, 5, '#ffffff', -200, -110); a.line(20, 13, 23, 10, 2, '#5a3420');
    a.layer('top'); a.rect(16, 6, 17, 7, '#e0d0ff'); a.rect(28, 18, 29, 19, '#e0d0ff');
  });
  // 털실 그물 — 털실 공과 펼쳐진 그물
  ICON32.a_yarn = icon32(['#160a14', '#2e1428', '#542448'], a => {
    MAP(a, 'back', ['................', '................', '................', '................', '................', '................', '................', '................', '................', '.n.n.n.n.n.n.n.n', '..n...n...n...n.', '.n.n.n.n.n.n.n.n', 'n...n...n...n...', '.n.n.n.n.n.n.n.n', '..n...n...n...n.', '.n.n.n.n.n.n.n.n'], { n: '#a85088' });
    MAP(a, 'main', ['................', '.....LLpLp......', '....LppLppL.....', '...LppLpLLpp....', '..LpLLppLLpLd...', '..ppLLpLppLpd...', '..pLppLppLpLp...', '..LppLpLLppLp...', '..pLLppLLpLdd...', '...LLpLppLdd....', '....pLppLdp.p...', '.....dppdd...pp.', '...............p', '................', '................', '................'], { p: '#e07ab0', L: '#ffc0e0', d: '#a84880' });
    a.layer('top'); a.rect(10, 6, 11, 7, '#ffffff');
  });
  // 월식 — 은달과 흑달이 겹치며 검은 달이 뜬다
  ICON32.a_moons = icon32(['#0a0812', '#181228', '#30224e'], a => {
    a.layer('back'); a.glow(16, 15, 13, ['#181228', '#30224e', '#5a3a90']); a.ring(16, 15, 9.5, 11, '#8a6ad0');
    a.layer('main'); a.disc(16, 15, 9, '#e8ecf4'); a.disc(14, 13, 6, '#ffffff'); a.layer('top'); a.disc(20, 14, 8, '#0a0812'); a.ring(20, 14, 7.2, 8.2, '#6a4ab0', 110, 250);
    a.rect(6, 4, 7, 5, '#ffffff'); a.rect(26, 26, 27, 27, '#c8b0ff');
  });
  // 박쥐 떼 — 흩어진 박쥐들 + 핏빛 X자
  ICON32.a_fangs2 = icon32(['#140608', '#2a0c10', '#501820'], a => {
    a.layer('back'); a.glow(16, 16, 11, ['#2a0c10', '#501820', '#7a2028']);
    MAP(a, 'main', ['................', '......b.........', '.b.b.bb.........', 'bebebb..........', 'b.b.b...........', '.........b......', '.........bb.b.b.', '..........bbebeb', '...........b.b.b', '................', '................', '.b.......b......', '.bb.b.b.bb......', '..bbebebb.......', '...b.b.b........', '................'], { b: '#7a5a80', e: '#ff3030' });
  });
  // 아홉 생 — 아홉 개의 혼불이 둥글게 모여든다
  ICON32.a_nine = icon32(['#060e18', '#0c1c30', '#16345a'], a => {
    a.layer('back'); a.glow(16, 18, 12, ['#0c1c30', '#16345a', '#2a5a90']);
    MAP(a, 'main', ['................', '................', '.......b........', '.......bb.......', '......bbb..b....', '......bLbbbb....', '.....bbLLbbb....', '.....bLWWLbb....', '....bbLWWWLbb...', '....bLWWWWWLb...', '....bLWWWWWLb...', '....bbLWWWLbb...', '.....bbLLLbb....', '.......bbb......', '................', '................'], { b: '#2a7ae0', L: '#7ac8ff', W: '#e8f8ff' });
    a.layer('top'); a.rect(14, 16, 15, 17, '#ffffff'); a.rect(26, 6, 27, 7, '#7ac8ff'); a.rect(5, 22, 6, 23, '#7ac8ff');
  });
  for (const k of ['claw', 'mackerel', 'sickle', 'fan', 'needle', 'kusari', 'yarn', 'moons', 'fangs2', 'nine']) if (SK_META[k]) SK_META[k].Ki = 'a_' + k;

  // ---------------------------------------------------------------- 그레이브
  // 나팔 포효 — 나팔 총구에서 잡동사니가 부채꼴로 터진다
  ICON32.g_blunder = icon32(['#140a06', '#2e1408', '#5a2a10'], a => {
    a.layer('back'); a.glow(12, 15, 10, ['#2e1408', '#5a2a10', '#a04a18']);
    MAP(a, 'main', ['................', '................', '...........y....', '.....B.....o....', '....BW..y.....o.', '...BbW..........', 'ggBbbW.W..o..y..', 'ggBbbW.WW.......', '...BbW....y...o.', '....BW..o.......', '.....B.....y....', '............o...', '................', '................', '................', '................'], { g: '#5a3420', B: '#c8963a', b: '#7a5420', W: '#fff4c0', o: '#ff8a30', y: '#ffe08a', n: '#b4b9c8' });
    a.layer('top'); a.rect(30, 14, 31, 15, '#ffffff');
  });
  // 고래잡이 — 미늘 달린 작살이 밧줄을 끌며 날아간다
  ICON32.g_harpoon = icon32(['#06121a', '#0c2430', '#16404e'], a => {
    a.layer('back'); for (let i = 0; i < 14; i++) a.px(3 + i * 0.9, 29 - i * 0.6 + Math.sin(i * 1.2) * 2, '#c8a878');
    a.layer('main'); a.line(5, 27, 22, 10, 2, '#8a5a32'); a.line(4.5, 26.5, 21.5, 9.5, 0.7, '#c08850');
    a.tri([[29, 3], [19, 9], [23, 13]], '#c8ccd8'); a.tri([[29, 3], [22, 8], [24, 10]], '#ffffff');
    a.line(20, 12, 17, 9, 1.4, '#868c9e'); a.line(22, 14, 25, 17, 1.4, '#868c9e');
    a.layer('top'); a.rect(28, 2, 29, 3, '#ffffff');
  });
  // 오리 행진 — 통통한 고무 오리
  ICON32.g_duck = icon32(['#0a1018', '#142434', '#24405a'], a => {
    a.layer('back'); a.glow(15, 17, 10, ['#142434', '#24405a']); MAP(a, 'back', ['................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '................', '..www....www....', 'www..wwww..www..', '................'], { w: '#7ac8ff' });
    MAP(a, 'main', ['................', '................', '.......YYY......', '......YyyyY.....', '......yykyy.....', '......yyyyyoo...', '.......yyyooo...', '..y....yyy......', '..yy.yyyyyyy....', '..yyyyyyyyyyy...', '..yyyyddyyyyy...', '...yyyyddyyyd...', '....yyyyyyydd...', '.....ddddddd....', '................', '................'], { Y: '#fff4a0', y: '#ffd640', d: '#d8a020', k: '#1a1418', o: '#ff8a30' });
    a.layer('top'); a.rect(14, 6, 15, 7, '#ffffff');
  });
  // 관통 저격 — 조준경 십자선을 꿰뚫는 한 줄기 빛
  ICON32.g_longrifle = icon32(['#0a0a12', '#161626', '#2a2a48'], a => {
    a.layer('back'); a.glow(15, 16, 10, ['#161626', '#2a2a48', '#4a3a28']);
    MAP(a, 'main', ['................', '................', '................', '.......L........', '.....LLLLL......', '...LLwwwwwLL....', '..LwwwIIIwwwL...', '.LwwwIRRRIwwwL..', 'LwwwwIRkRIwwwwL.', '.LwwwIRRRIwwwL..', '..LwwwIIIwwwL...', '...LLwwwwwLL....', '.....LLLLL......', '................', '................', '................'], { L: '#2a2630', w: '#f0ece0', I: '#c87a20', R: '#ffc040', k: '#ff3020' });
    a.layer('top'); a.rect(12, 14, 12, 14, '#ffffff'); a.rect(26, 6, 27, 7, '#ffe08a');
  });
  // 팬 해머 — 실린더가 돌며 불꽃이 연달아 튄다
  ICON32.g_revolver = icon32(['#100c0a', '#241a14', '#4a3020'], a => {
    a.layer('back'); a.glow(16, 16, 12, ['#241a14', '#4a3020', '#8a5020']); a.arc(16, 16, 13, 200, 330, 0.3, 2.4, ['#8a5020', '#ff9a40', '#ffe8a0']);
    MAP(a, 'main', ['................', '......dddd......', '....dSSSSSSd....', '...dSSSYYSSsd...', '..dSSSSYYSsssd..', '..SSkkSSSskkss..', '.dSSkkSSsskkssd.', '.dSSSSSddsssssd.', '.dSSSSsddsssssd.', '.dSSkksssskkssd.', '..SSkksssskkss..', '..dsssskkssssd..', '...dssskksssd...', '....dssssssd....', '......dddd......', '................'], { S: '#c8ccd8', s: '#9aa0b0', d: '#585e70', k: '#1a1620', Y: '#d8a038' });
    a.layer('top'); a.rect(11, 9, 12, 10, '#ffffff'); a.star(27, 5, 2, '#ffe08a');
  });
  // 일제 포격 — 포탄 세 발이 불꼬리를 끌며 떨어진다
  ICON32.g_cannon = icon32(['#140806', '#2e1008', '#5a2010'], a => {
    a.layer('back'); a.glow(16, 16, 10, ['#2e1008', '#5a2010']); for (const [x, y] of [[9, 9], [23, 13], [13, 25]]) { a.line(x - 7, y - 7, x - 2, y - 2, 1, '#ff9a40'); a.line(x - 5, y - 8, x - 2, y - 5, 0.8, '#ffe08a'); }
    a.layer('main'); for (const [x, y] of [[9, 9], [23, 13], [13, 25]]) { a.disc(x, y, 3.6, '#2a2630'); a.disc(x - 1, y - 1, 1.4, '#6a6478'); }
    a.layer('top'); a.rect(8, 8, 8, 8, '#ffffff'); a.rect(22, 12, 22, 12, '#ffffff'); a.rect(12, 24, 12, 24, '#ffffff');
  });
  // 거대 복어 — 가시를 세운 동그란 복어
  ICON32.g_puffer = icon32(['#0a1214', '#142428', '#24444a'], a => {
    a.layer('back'); a.glow(16, 16, 11, ['#142428', '#24444a']);
    MAP(a, 'main', ['................', '................', '.....p..p.......', '.....YYYyy.p....', '..p.YYsyysy.....', '...YYYyyyyWypp..', '...YYyyyyyey....', '.pYsyysyysyyy...', '..Yyyyyyyyyyyp..', '...yyyyyyyyym...', '.ppnnnnnnnnn....', '....nnnnnnn.p...', '...p.nnnnn......', '......p..p......', '................', '................'], { y: '#e8c050', Y: '#fff0a0', s: '#a07a28', n: '#fff6e0', p: '#d8b070', e: '#1a1418', W: '#ffffff', m: '#c06040' });
  });
  // 화염 방사 — 총구에서 앞으로 길게 뿜는 불길
  ICON32.g_match = icon32(['#140806', '#2e1008', '#5a2010'], a => {
    a.layer('back'); a.glow(20, 16, 12, ['#2e1008', '#5a2010', '#a03a10']);
    MAP(a, 'main', ['................', '................', '................', '............RRR.', '.........R.ROOOO', '........OOOOYYYY', '..g.ROROYYYYYYYY', 'ggg.YWWWWWWWYYYY', 'ggg.YWWWWWWWYYYY', '..g.ROROYYYYYYYY', '........OOOOYYYY', '.........R.ROOOO', '............RR..', '...............R', '................', '................'], { g: '#5a3420', W: '#fffaf0', Y: '#ffe060', O: '#ff8a20', R: '#c82818' });
  });
  // 장례 행렬 — 혼불을 두른 해골탄이 크게 돌아 파고든다
  ICON32.g_undertaker = icon32(['#060e14', '#0c1c28', '#163448'], a => {
    a.layer('back'); a.arc(15, 18, 11, 120, 345, 0.3, 4, ['#163448', '#2a8ab0', '#7ae0ff', '#e0fbff']);
    MAP(a, 'main', ['................', '................', '................', '................', '.........WWWWW..', '........WWWWWWW.', '........WkkWkkW.', '........WkkWkkW.', '........WWWkWWW.', '.........WWWWW..', '.........WkWkW..', '................', '................', '................', '................', '................'], { W: '#f0ece0', k: '#1a1418' });
    a.layer('top'); a.rect(4, 24, 5, 25, '#7ae0ff'); a.rect(8, 28, 9, 29, '#e0fbff');
  });
  // 왕의 처결 — 왕관 둘레로 금탄이 돈다
  ICON32.g_kingrev = icon32(['#141006', '#2e240c', '#5a4618'], a => {
    a.layer('back'); a.glow(15, 14, 9, ['#2e240c', '#5a4618']);
    MAP(a, 'main', ['................', '................', '................', '................', '...Y...Y...Y....', '...YY.YYY.YY....', '...YYYYrYYYY....', '...GYYYYYYYG....', '...GYgYYYgYG....', '...GGGGGGGGG....', '...ggggggggg....', '................', '................', '................', '................', '................'], { Y: '#ffe08a', G: '#d8a038', g: '#8a5a1a', r: '#e03040' });
    a.layer('main'); for (const an of [0.5, 2.6, 4.4]) a.disc(15 + Math.cos(an) * 12.5, 15 + Math.sin(an) * 11, 1.7, '#ffd040');
    a.layer('top'); a.star(26, 26, 2, '#fff4c0');
  });
  for (const k of ['blunder', 'harpoon', 'duck', 'longrifle', 'revolver', 'cannon', 'puffer', 'match', 'undertaker', 'kingrev']) if (SK_META[k]) SK_META[k].Ki = 'g_' + k;

  // ---------------------------------------------------------------- 마법사
  ICON32.m_candle = icon32(['#140806', '#2e1008', '#5a2010'], a => { // 거대 화염구
    a.layer('back'); a.glow(20, 11, 11, ['#2e1008', '#5a2010', '#a03a10']);
    MAP(a, 'main', ['................', '.........OOO....', '.......OOOOOOO..', '.......OYYYYYO..', '......OOYWWWYOO.', '......OOYWWWYOO.', '.....ROOYWWWYOO.', '.....RROYYYYYO..', '.....RROOOOOOO..', '....RRRRROOO....', '...rrRRRRR......', '...rrrR.........', '...rrr..........', '................', '................', '................'], { W: '#fffaf0', Y: '#ffe060', O: '#ff8a20', R: '#d03818', r: '#7a2010' });
    a.layer('top'); a.rect(4, 4, 5, 5, '#ffe060'); a.rect(26, 26, 27, 27, '#ff8a20');
  });
  ICON32.m_rod = icon32(['#06121e', '#0c2236', '#18405e'], a => { // 대어 낚기
    a.layer('back'); a.glow(26, 22, 8, ['#0c2236', '#18405e']);
    MAP(a, 'main', ['................', '.......hhh......', '.....hh...l.....', '....h......l....', '...h........l...', '...h.........l..', '..h..........l..', '..h..........l..', '.h...........l..', '.h..........rr..', 'h...........ww..', 'h........~~.~~~.', '.......~~...~~..', '................', '................', '................'], { h: '#8a5a32', l: '#e8e4d8', r: '#e03030', w: '#ffffff', '~': '#7ac8ff' });
    a.layer('top'); a.rect(28, 16, 29, 17, '#ffffff');
  });
  ICON32.m_crystal = icon32(['#0a0a18', '#16163a', '#2a2a6a'], a => { // 보석 분출
    a.layer('back'); a.glow(15, 12, 12, ['#16163a', '#2a2a6a', '#4a4aa8']);
    MAP(a, 'main', ['................', '..........C.....', '.........CcC....', '....C....CcC....', '...CcC...CcCd...', '...CcCd.CCccd...', '...CcCdCCcccd.C.', '..CCccdCccccdCcC', '..CcccdCccccdCcd', '..CcccdCccccdccd', '..cccddcccccddcd', 'gggggggggggggggg', '.g..g...g..g..g.', '................', '................', '................'], { C: '#e0f8ff', c: '#7ad8ff', d: '#3a78c0', g: '#4a3a4a' });
    a.layer('top'); a.rect(20, 2, 21, 3, '#ffffff'); a.rect(4, 6, 5, 7, '#c8b0ff'); a.rect(28, 10, 29, 11, '#c8b0ff');
  });
  ICON32.m_broom = icon32(['#0e0c08', '#221c12', '#40341e'], a => { // 먼지 회오리
    a.layer('back'); a.glow(14, 18, 11, ['#221c12', '#40341e']);
    MAP(a, 'main', ['................', '................', '............Lmm.', '............mmd.', '............md..', '........LLLm....', '.......LLLmmd...', '.......LLmmdd...', '...LLLL.mmdd....', '..LLLLmm.dd.....', '..LLLmmmL.......', '..LLmmmLLmm.....', '..LmmmLLmmd.....', '..mmmdLmmdd.....', '...mdddmdd......', '................'], { L: '#ffffff', m: '#c8c4bc', d: '#86807a' });
    a.layer('top'); a.rect(26, 22, 27, 23, '#f0e8d0'); a.rect(22, 28, 23, 29, '#d8ccb0');
  });
  ICON32.m_skull = icon32(['#08120a', '#102614', '#1e4a24'], a => { // 뼈 무덤
    a.layer('back'); a.glow(15, 14, 11, ['#102614', '#1e4a24', '#2e7a34']);
    MAP(a, 'main', ['................', '................', '.......W........', '.......B........', '...W...B...W....', '...B..WBW..B....', '...B..WBB..B..W.', '..WBW.BBB.WBW.B.', '..BBB.BBB.BBB.B.', '..BBB.BBB.BBBBB.', 'gggggggggggggggg', '..c..cc...c..c..', '................', '................', '................', '................'], { W: '#ffffff', B: '#e0dac8', g: '#3a3028', c: '#7aff8a' });
    a.layer('top'); a.rect(24, 4, 25, 5, '#7aff8a'); a.rect(6, 2, 7, 3, '#b0ffb8');
  });
  ICON32.m_lrod = icon32(['#0a0a18', '#161634', '#2a2a5a'], a => { // 연쇄 번개
    a.layer('back'); a.glow(12, 14, 12, ['#161634', '#2a2a5a', '#4a4a90']);
    MAP(a, 'main', ['.....YY.........', '....YWY.........', '...YWY..........', '..YWWYYYY.......', '..YWWWWWY.......', '.....YWY........', '....YWY.........', '...YWWYYYYY.....', '...YWWWWWWY.....', '.......YWY......', '......YWY.......', '.....YWY........', '....YWY.........', '...YY...........', '................', '................'], { Y: '#ffe060', W: '#ffffff' });
    a.layer('top'); a.rect(26, 6, 27, 7, '#c8e0ff'); a.rect(24, 24, 25, 25, '#ffe060');
  });
  ICON32.m_ladle = icon32(['#180e08', '#2e1a10', '#5a3418'], a => { // 수프 대폭발
    a.layer('back'); a.glow(14, 10, 10, ['#2e1a10', '#5a3418', '#8a5020']);
    MAP(a, 'main', ['................', '....o.....o.....', '......o.........', '..o..OOOOO...o..', '....OOYYOOO.....', '...OOYYOOOOO..o.', '...OOOOOOOOO....', '..o.OOOOOOO.....', '.....OOOOO..o...', '......d.........', '....dddddd......', '...dbbbbbbd.....', '...dbbbbbbd..hhh', '....dbbbbdhhh...', '.....dddd.......', '................'], { O: '#e8802a', Y: '#ffc060', o: '#ffa040', d: '#585e70', b: '#a8aebc', h: '#8a5a32' });
    a.layer('top'); a.rect(12, 8, 13, 9, '#fff0c0');
  });
  ICON32.m_mirror = icon32(['#140e18', '#2a1e34', '#4a3860'], a => { // 반사광 난사
    a.layer('back'); a.glow(15, 10, 12, ['#2a1e34', '#4a3860', '#7a5a90']);
    MAP(a, 'main', ['........Y.......', '........Y.......', '..Y.....Y.....Y.', '...Y...GG....Y..', '.....GGwwGG.....', '....GwwwwwwG....', '...GwwwwwwwwG...', '...GwwWWwwwwG...', 'YYGwwwWwwwwwwGYY', '..GwwwwwwwwwwG..', '...GwwwwwWwwG...', '...GwwwwwwwwG...', '....GwwwwwwG....', '.....GGwwGG.....', '.......GG.......', '.......GG.......'], { Y: '#fff0a0', G: '#d8a038', w: '#c8e0f0', W: '#ffffff' });
    a.layer('top'); a.rect(20, 2, 21, 3, '#ffffff'); a.rect(4, 4, 5, 5, '#ffffff');
  });
  ICON32.m_ashstar2 = icon32(['#140806', '#2e1008', '#5a2010'], a => { // 유성우
    a.layer('back'); a.glow(14, 22, 10, ['#2e1008', '#5a2010', '#8a3010']);
    MAP(a, 'main', ['.........r......', '..........R.....', 'rr.........R....', 'rrr.........O...', '.rrr.........W..', '..rRR...........', '...RRR..........', '....RRR.........', '.....ROO........', '......OYYY......', '.......YWWY.....', '.......YWWY.....', '........YY......', '................', '................', '................'], { r: '#7a2010', R: '#d03818', O: '#ff8a20', Y: '#ffe060', W: '#fffaf0' });
    a.layer('top'); a.star(26, 26, 2, '#ffe8a0');
  });
  ICON32.m_hourglass = icon32(['#141006', '#2e240c', '#5a4618'], a => { // 멈춘 초침
    a.layer('back'); a.glow(16, 16, 12, ['#2e240c', '#5a4618', '#8a6a24']);
    MAP(a, 'main', ['................', '................', '................', '.....GGGGGG.....', '....GFFttFFG....', '...GFFFhFFFFG...', '...GFFFhFFFFG...', '...GtFFkmmFtG...', '...GtFFFFFFtG...', '...GFFFFFFFFG...', '...GFFFFFFFFG...', '....GFFttFFG....', '.....GGGGGG.....', '................', '................', '................'], { G: '#d8a038', F: '#fff4d8', t: '#8a5a1a', h: '#2a2030', m: '#2a2030', k: '#e03030' });
    a.layer('top'); a.rect(6, 6, 7, 7, '#ffffff');
  });
  for (const k of ['candle', 'rod', 'crystal', 'broom', 'skull', 'lrod', 'ladle', 'mirror', 'ashstar2', 'hourglass']) if (SK_META[k]) SK_META[k].Ki = 'm_' + k;

  // ---------------------------------------------------------------- 성직자
  const PH = { Y: '#fff0a0', G: '#d8a038', g: '#8a5a1a' };
  ICON32.p_censer = icon32(['#0e0c14', '#1e1a2a', '#3a304e'], a => { // 향연 회오리
    a.layer('back'); a.glow(12, 15, 9, ['#1e1a2a', '#3a304e']);
    MAP(a, 'main', ['......c.........', '......c.........', '......c..s.s....', '......c.s...s...', '.....YGY....s...', '....YGGGG..s....', '...YGkGkGG.s....', '...GGGGGGG..s...', '...gGkGkGg...s..', '....gGGGg...s...', '.....ggg...s....', '......G.........', '.....GGG........', '................', '................', '................'], Object.assign({ c: '#868c9e', k: '#3a2410', s: '#c8c0e0' }, PH));
    a.layer('top'); a.rect(10, 13, 11, 14, '#ffffff');
  });
  ICON32.p_pan = icon32(['#100c08', '#221a12', '#40301e'], a => { // 무쇠 받아치기
    a.layer('back'); a.glow(14, 12, 10, ['#221a12', '#40301e']); a.arc(14, 12, 13, 200, 320, 0.3, 2.4, ['#40301e', '#ff9a40', '#ffe8a0']);
    MAP(a, 'main', ['................', '................', '.....kkkkk......', '....kKKKKKk.....', '...kKkkkkkKk....', '...kKkkkkkKk....', '...kKkkkkkKk....', '...kKkkkkkKk....', '....kKKKKKk.....', '.....kkkkkh.....', '..........hh....', '...........hh...', '............hh..', '.............h..', '................', '................'], { k: '#2a2630', K: '#585e70', h: '#8a5a32' });
    a.layer('top'); a.rect(10, 8, 11, 9, '#b4b9c8'); a.star(26, 4, 2, '#ffe8a0');
  });
  ICON32.p_water = icon32(['#06121e', '#0c2236', '#18405e'], a => { // 성수 소나기
    a.layer('back'); a.glow(14, 8, 10, ['#0c2236', '#18405e']);
    MAP(a, 'main', ['................', '....LLL.........', '...LWWWL.LLL....', '..LWWWWWLWWWL...', '.LWWWWWWWWWWWL..', '.LWWWWWWWWWWWL..', '..ddddddddddd...', '................', '...b...b...b....', '..b...b...b.....', '................', '....b...b...b...', '...b...b...b....', '................', '..o.o.o.o.o.o...', '................'], { L: '#8a9ab8', W: '#eaf4ff', d: '#5a6a8c', b: '#7ad0ff', o: '#bfe8ff' });
  });
  ICON32.p_carrot = icon32(['#160a10', '#2e1422', '#542440'], a => { // 토끼 돌격대
    a.layer('back'); a.glow(16, 14, 10, ['#2e1422', '#542440']);
    MAP(a, 'main', ['....WW...WW.....', '....WpW.WpW.....', '....WpW.WpW.....', '....WpW.WpW.....', '....WWW.WWW.....', '...WWWWWWWWW....', '..WWWWWWWWWWW...', '..WWkWWWWWkWW...', '..WWWWWpWWWWW...', '..WpWWWwWWWpW...', '...WWWWWWWWW....', '....WWWWWWW.....', '................', '.......o........', '......ooO.......', '.....ooo........'], { W: '#ffffff', p: '#ffb0c8', k: '#1a1418', w: '#e8d8e0', o: '#ff8a20', O: '#6ac040' });
  });
  ICON32.p_bellh = icon32(['#141006', '#2e240c', '#5a4618'], a => { // 대종 낙하
    a.layer('back'); a.glow(16, 12, 11, ['#2e240c', '#5a4618', '#8a6a24']);
    MAP(a, 'main', ['.......gg.......', '......gYYg......', '......gYGg......', '.....GYYGGG.....', '....GYYGGGGG....', '....GYGGGGGG....', '....GYGGGGGG....', '....GYGGGGGG....', '...GYYGGGGGGG...', '...GYGGGGGGgG...', '..GYYGGGGGGGgG..', '..GGGGGGGGGGGG..', '..gggggggggggg..', '................', '.y...y....y...y.', '..y..y....y..y..'], Object.assign({ y: '#fff0a0' }, PH));
  });
  ICON32.p_reliq = icon32(['#141006', '#2e240c', '#5a4618'], a => { // 성유물 수호
    a.layer('back'); a.glow(16, 14, 12, ['#2e240c', '#5a4618', '#8a6a24']); for (let i = 0; i < 40; i++) { if (i % 3 === 2) continue; const an = i / 40 * Math.PI * 2; a.px(16 + Math.cos(an) * 13, 16 + Math.sin(an) * 8, '#c9952a'); }
    MAP(a, 'main', ['.......YY.......', '......YrrY......', '.......GG.......', '.......GG.......', '.......GG.......', '.Y.....GG.....Y.', 'YrGGGGGrrGGGGGrY', 'YrGGGGGrrGGGGGrY', '.Y.....GG.....Y.', '.......GG.......', '.......GG.......', '.......GG.......', '.......GG.......', '.......GG.......', '......YrrY......', '.......YY.......'], Object.assign({ r: '#d02838' }, PH));
    a.layer('top'); a.rect(14, 12, 14, 12, '#ffffff');
  });
  ICON32.p_whip = icon32(['#180808', '#341010', '#601818'], a => { // 참회의 난타
    a.layer('back'); a.glow(18, 12, 10, ['#341010', '#601818']); for (const [x, y] of [[26, 2], [30, 6], [24, 8], [30, 12]]) a.rect(x, y, x + 1, y + 1, '#fff0d0');
    MAP(a, 'main', ['................', '................', '.........BBBb...', '........B....b..', '.......Bb.....b.', '......Bb........', '.....Bb.........', '.....Bb.........', '....Bb..........', '....Bb..........', '....Bb..........', '...hh...........', '...hH...........', '..hH............', '..GG............', '..G.............'], { B: '#c88a5a', b: '#8a5030', h: '#5a3420', H: '#8a5a32', G: '#d8a038' });
    a.layer('top'); a.star(29, 9, 2, '#ffffff');
  });
  ICON32.p_mochi = icon32(['#0e0c18', '#1e1a34', '#363060'], a => { // 달떡 낙하
    a.layer('back'); a.glow(16, 18, 10, ['#1e1a34', '#363060']); for (const x of [8, 16, 24]) a.rect(x, 2, x, 7, '#c8c0e0');
    MAP(a, 'main', ['................', '................', '................', '................', '................', '................', '.....WWWWWW.....', '...WWWWWWWWWW...', '..WWLLWWWWWWWW..', '.WWLLWWWWWWWWWW.', '.WWWWWWWWWWWWmW.', '.WWWWWWWWWWWmmW.', '..WmmWWWWWWmmW..', '...mmmmmmmmmm...', '................', '................'], { W: '#fffaf0', L: '#ffffff', m: '#e0d4c0' });
    a.layer('top'); a.rect(8, 16, 9, 17, '#ffffff');
  });
  ICON32.p_dawn = icon32(['#141006', '#2e240c', '#5a4618'], a => { // 새벽 찬가
    a.layer('back'); a.glow(16, 20, 12, ['#2e240c', '#5a4618', '#8a6a24']);
    MAP(a, 'main', ['......YWWY......', '......YWWY......', '......YWWY......', '......YWWY......', '......YWWY......', '......YWWY......', '......YWWY......', '......YWWY......', '...GGGYWWYGGG...', '..G..S.WW....G..', '.G.....WW.....G.', '.GS....WW....SG.', '..G..........G..', '...GGGS..GGGG...', '................', '................'], { Y: '#ffe08a', W: '#ffffff', G: '#d8a038', S: '#fff0a0' });
    a.layer('top'); a.star(4, 4, 2, '#fff0a0'); a.star(27, 6, 1, '#fff0a0');
  });
  ICON32.p_spear = icon32(['#141006', '#2e240c', '#5a4618'], a => { // 천상의 창
    a.layer('back'); a.glow(22, 22, 11, ['#2e240c', '#5a4618', '#a07a28']); a.comet(0, 0, 14, 14, 0.3, 2.6, ['#5a4618', '#a07a28', '#ffe08a']);
    a.layer('main'); a.line(2, 2, 14, 14, 2, '#d8a038'); a.line(2, 2, 14, 14, 0.7, '#fff0a0');
    a.line(9, 17, 17, 9, 2.6, '#d8a038'); a.disc(13, 13, 1.8, '#d02838');
    a.blade(14, 14, 30, 30, 9, ['#ffffff', '#fff0c0', '#c8a040'], 0.6);
    a.layer('top'); a.star(27, 27, 2, '#ffffff', '#ffffff'); a.rect(24, 22, 25, 23, '#ffffff');
  });
  for (const k of ['censer', 'pan', 'water', 'carrot', 'bellh', 'reliq', 'whip', 'mochi', 'dawn', 'spear']) if (SK_META[k]) SK_META[k].Ki = 'p_' + k;


  // ---------------------------------------------------------------- v3.23 각성 칸 아이콘 (어쌔신 개다래나무 가지 · 마법사 영혼박리)
  ICON32.storm = icon32(['#180808', '#341010', '#601818'], a => {
    a.layer('back'); a.glow(16, 15, 12, ['#341010', '#601818', '#a02028']);
    MAP(a, 'main', ['................', '...........LL...', '..........LLlL..', '.........L.Ll...', '........bB......', '.......bB.LL....', '......bB.LlLL...', '.....bB...Ll....', '....bBoo........', '...bB.oO........', '..bB............', '.bB.LL..........', 'bB.LlLL.........', 'B...Ll..........', '................', '................'], { b: '#5a3420', B: '#8a5a32', L: '#9ad870', l: '#4a8a3a', o: '#ffa040', O: '#ffd080' });
    a.layer('top'); a.rect(4, 4, 5, 5, '#ff6060'); a.rect(26, 24, 27, 25, '#ff6060'); a.rect(15, 16, 15, 16, '#fff0c0');
  });
  ICON32.meteor = icon32(['#060e18', '#0c1c30', '#16345a'], a => { // 영혼박리: 마나로 된 여우 얼굴 + 옆으로 비껴 남은 잔상
    a.layer('back'); a.glow(17, 15, 11, ['#0c1c30', '#16345a', '#2a5a90']);
    MAP(a, 'back', ['................', '................', '.b.......b......', '.bb.....bb......', '.bWb...bWb......', '.bBBbbbBBb......', 'bBBBBBBBBBb.....', 'bBkBBBBBkBb.....', 'BBBBBBBBBBBb....', 'WWBBBBBBBWWb....', 'bWWWBBBWWWb.....', '.bWWWkWWWb......', '..bbWWWbb.......', '....bbb.........', '................', '................'], { b: '#1e4a8a', B: '#2e6ab0', W: '#4a8ad0', k: '#7ac0ff' });
    MAP(a, 'main', ['................', '................', '...b.......b....', '...bb.....bb....', '...bWb...bWb....', '...bBBbbbBBb....', '..bBBBBBBBBBb...', '..bBkBBBBBkBb...', '.bBBBBBBBBBBBb..', '.bWWBBBBBBBWWb..', '..bWWWBBBWWWb...', '...bWWWkWWWb....', '....bbWWWbb.....', '......bbb.......', '................', '................'], { b: '#3a7ae0', B: '#8ac8ff', W: '#e0f4ff', k: '#ffffff' });
    a.layer('top'); a.rect(26, 4, 27, 5, '#e0f4ff'); a.rect(28, 22, 29, 23, '#9ad8ff');
  });
})();
;

// ==================================================================== 47_awk.js
'use strict';
// 잿빛 왕관 원정대 — 47_awk.js : v3.23 각성기 개편 (그레이브 「등 맡기기」는 그대로)
//  · 기사 「성채의 맹세」: 8초 — 갑옷이 빛나며 넉백·경직 무시, 평타 3타마다 빛의 검 충격파
//  · 어쌔신 「개다래나무 가지」: 7초 — 몸에 붉은 오라, 눈이 붉어짐. 공격 속도 · 이동 속도(대폭) · 치명타 확률 증가
//  · 마법사 「영혼박리」: 10초 — 마나로 된 분신이 따라다니며 평타(마력탄)를 따라 쏨. 우클릭 기술은 따라 하지 않음
//  · 성직자 「기적」: 패시브 — 직접 쓸 수 없음. 한 판에 한 번, 쓰러지면 하트 1.5칸으로 되살아남
// v3.64 궁극기(각성) 사용 중엔 궁극기 게이지가 차지 않음 — 각성 지속 시간 · 하비 「등 맡기기」 동안
function ultBusy(P) { return !!(P && (P.awakenT > 0 || P.state === 'awaken' || (typeof HABIULT !== 'undefined' && HABIULT.on))); }
const AWK = (() => {
  const DUR = { knight: 8, ranger: 7, mage: 10 };
  const S = { g: null, waves: [], clone: null, q: [], bolts: [] };
  const reset = () => { if (S.g !== G) { S.g = G; S.waves = []; S.clone = null; S.q = []; S.bolts = []; } };
  const on = cls => { const P = G && G.player; return !!(P && G.cls === cls && P.awakenT > 0 && P.awkCls === cls && !P.dead); };
  const FXK = KRS.FXK, blast = GRS.blast;
  const live = e => e && !e.dead && e.type !== 'flag', foes = () => G.enemies.filter(live);
  const px2 = (x, y, c, s = 2) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, s, s); };

  function start() {
    reset(); const P = G.player, c = G.cls; let d = DUR[c]; if (!d) return false;
    if (c === 'mage' && wSkill() === 'hourglass') d += 4; // 모래시계 지팡이: 분신이 더 오래 남음
    P.gauge = 0; P.awakenT = d; P.awkMax = d; P.awkCls = c; P.queued = false;
    sfx('awaken'); FXK.punch(8, 0.03, 0.06);
    if (c === 'knight') { FXK.flash('#fff0b0', 0.12); FXK.ring(P.x, P.y, '#ffe08a', 380, 0.4, 10); FXK.rays(P.x, P.y - 14, 16, 90, '#fff0b0', 0.3); for (let i = 0; i < 18; i++) { const a = rand(0, TAU); G.parts.push({ x: P.x + Math.cos(a) * 10, y: P.y - 10 + Math.sin(a) * 8, vx: Math.cos(a) * 90, vy: Math.sin(a) * 60 - 40, t: 0.5, c: pick(['#ffe08a', '#fffbe6', '#d8a038']), g: 0, glow: true }); } sfx('block', 0.6); }
    if (c === 'ranger') { FXK.flash('#ff2030', 0.1); FXK.ring(P.x, P.y, '#ff3040', 340, 0.35, 8); for (let i = 0; i < 20; i++) { const a = rand(0, TAU); G.parts.push({ x: P.x, y: P.y - 10, vx: Math.cos(a) * rand(60, 140), vy: Math.sin(a) * rand(40, 90) - 30, t: 0.45, c: pick(['#ff3040', '#ff8080', '#a01018']), g: 0, glow: true }); } sfx('growl', 1.4); }
    if (c === 'mage') { S.clone = { x: P.x - P.face * 4, y: P.y, face: P.face, t: 0, a: 0 }; FXK.flash('#a8d8ff', 0.1); FXK.ring(P.x, P.y, '#9ad8ff', 300, 0.4, 8); for (let i = 0; i < 16; i++) { const a = rand(0, TAU); G.parts.push({ x: P.x, y: P.y - 12, vx: Math.cos(a) * 80, vy: Math.sin(a) * 50, t: 0.5, c: pick(['#9ad8ff', '#e0f4ff', '#4a8cff']), g: 0, glow: true }); } sfx('blip', 0.6); }
    return true;
  }

  // ---------------------------------------------------------------- 기사: 빛의 검 충격파
  function wave() { const P = G.player; S.waves.push({ x: P.x + Math.cos(P.atkAng) * 16, y: P.y - 6 + Math.sin(P.atkAng) * 12, a: P.atkAng, t: 0, life: 0.5, hit: new Set(), lastF: 0, ex: wSkill() === 'exec' }); sfx('whoosh', 0.8); sfx('bolt', 1.3); FXK.punch(3, 0.01, 0.01, P.atkAng); }
  function updWaves(dt) {
    for (const W of S.waves) { W.t += dt; const sp = 430 * (1 - W.t / W.life * 0.4); W.x += Math.cos(W.a) * sp * dt; W.y += Math.sin(W.a) * sp * dt * 0.8;
      if (blocked(W.x - Math.cos(W.a) * sp * dt, W.y + 6 - Math.sin(W.a) * sp * dt * 0.8, W.x, W.y + 6)) { W.t = W.life; FXK.ring(W.x, W.y + 6, '#ffe08a', 160, 0.25, 4); }
      const nx = -Math.sin(W.a), ny = Math.cos(W.a);
      for (const e of foes()) { if (W.hit.has(e)) continue; const dx = e.x - W.x, dy = e.y - 8 - W.y, along = dx * Math.cos(W.a) + dy * Math.sin(W.a), side = dx * nx + dy * ny;
        if (Math.abs(along) < 16 + e.r && Math.abs(side) < 28 + e.r) { W.hit.add(e); damageEnemy(e, 1.6, { ang: W.a, kb: 140, grogi: 10, gauge: 0 }); blast(e.x, e.y - 12, 16, ['#ffffff', '#fffbe6', '#ffe08a', '#d8a038', '#7a5a18', '#2a1e08']); sfx('hit', 1.2); } }
      if (W.ex && W.t - W.lastF > 0.07) { W.lastF = W.t; (G.pfire = G.pfire || []).push({ x: W.x, y: W.y + 8, t: 4, tick: 0 }); }
      if (Math.random() < 0.8) G.parts.push({ x: W.x + nx * rand(-24, 24), y: W.y + ny * rand(-24, 24) * 0.8, vx: -Math.cos(W.a) * 40, vy: -20, t: 0.3, c: pick(['#ffe08a', '#fffbe6']), g: 0, glow: true }); }
    S.waves = S.waves.filter(W => W.t < W.life);
  }
  const blocked = (x0, y0, x1, y1) => segSolid(x0, y0, x1, y1, 4) || x1 < A.x0 + 6 || x1 > A.x1 - 6 || y1 < A.y0 + 6 || y1 > A.y1 - 6;
  function drawWave(W) { const k = W.t / W.life, al = k < 0.8 ? 1 : (1 - k) / 0.2, nx = -Math.sin(W.a), ny = Math.cos(W.a), ux = Math.cos(W.a), uy = Math.sin(W.a) * 0.8;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let tr = 3; tr >= 0; tr--) { ctx.globalAlpha = al * (tr ? 0.25 * (4 - tr) / 3 : 1); const bx = W.x - ux * tr * 9, by = W.y - uy * tr * 9;
      for (let s = -28; s <= 28; s += 2) { const bow = (1 - (s / 28) ** 2) * 10, x = bx + nx * s + ux * bow, y = by + ny * s * 0.8 + uy * bow; const edge = Math.abs(s) > 22;
        px2(x, y, tr ? '#d8a038' : edge ? '#ffe08a' : '#ffffff'); if (!tr && !edge) { px2(x - ux * 2, y - uy * 2, '#fff0b0'); px2(x - ux * 4, y - uy * 4, '#d8a038'); } } }
    ctx.restore(); }

  // ---------------------------------------------------------------- 공용: 몸 둘레 빛 테두리 (회피 테두리와 같은 방식)
  let OA = null, OB = null;
  function bodyGlow(col, alpha, thick, at) { // at: 몸을 그릴 위치 {x,y} (없으면 플레이어 자리), tint: 몸 자체를 물들일 색
    const P = G.player, WT = ctx.getTransform(); if (!OA) { OA = document.createElement('canvas'); OB = document.createElement('canvas'); }
    if (OA.width !== cv.width || OA.height !== cv.height) for (const c of [OA, OB]) { c.width = cv.width; c.height = cv.height; }
    const a = OA.getContext('2d'), b = OB.getContext('2d'), PB = 80, s = Math.round(WT.a * 2) || 2, X = at ? at.x : P.x, Y = at ? at.y : P.y;
    const bx = Math.max(0, Math.floor(WT.a * X + WT.e - PB)), by = Math.max(0, Math.floor(WT.d * (Y - 16) + WT.f - PB)), bw = Math.min(cv.width - bx, PB * 2), bh = Math.min(cv.height - by, PB * 2); if (bw <= 0 || bh <= 0) return;
    a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = 'source-over'; a.globalAlpha = 1; a.clearRect(bx, by, bw, bh); a.setTransform(WT);
    const main = ctx, wt0 = WTEXT.length, np = G.parts.length, nf = G.fx.length, ox = P.x, oy = P.y;
    const t1 = P.trail, t2 = P.trail2; // 공격 궤적은 테두리를 두르지 않음
    try { if (at) { P.x = X; P.y = Y; } P.trail = []; if (t2) P.trail2 = []; ctx = a; drawPlayer(); } finally { ctx = main; P.x = ox; P.y = oy; P.trail = t1; if (t2) P.trail2 = t2; WTEXT.length = wt0; G.parts.length = Math.min(G.parts.length, np); G.fx.length = Math.min(G.fx.length, nf); }
    a.setTransform(1, 0, 0, 1, 0, 0);
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-over'; b.globalAlpha = 1; b.clearRect(bx, by, bw, bh);
    if (at && at.tint) { b.drawImage(OA, bx, by, bw, bh, bx, by, bw, bh); b.globalCompositeOperation = 'source-atop'; b.globalAlpha = 0.72; b.fillStyle = at.tint; b.fillRect(bx, by, bw, bh); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = at.alpha; ctx.drawImage(OB, bx, by, bw, bh, bx, by, bw, bh); ctx.restore(); b.clearRect(bx, by, bw, bh); }
    const off = []; for (let r = 1; r <= thick; r++) off.push([s * r, 0], [-s * r, 0], [0, s * r], [0, -s * r]); if (thick > 1) off.push([s, s], [-s, s], [s, -s], [-s, -s]);
    for (const [dx, dy] of off) b.drawImage(OA, bx, by, bw, bh, bx + dx, by + dy, bw, bh);
    b.globalCompositeOperation = 'destination-out'; b.drawImage(OA, bx, by, bw, bh, bx, by, bw, bh);
    b.globalCompositeOperation = 'source-in'; b.fillStyle = col; b.fillRect(bx, by, bw, bh); b.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.drawImage(OB, bx, by, bw, bh, bx, by, bw, bh); ctx.restore();
  }

  // ---------------------------------------------------------------- 어쌔신: 붉은 오라 · 붉은 눈
  function drawAura() { const P = G.player, t = time;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const ph = (t * 1.6 + i * 0.37) % 1, a = i / 14 * TAU + Math.sin(t * 2 + i) * 0.3, r = 9 + Math.sin(i * 2.3) * 3, x = P.x + Math.cos(a) * r, y = P.y - 2 + Math.sin(a) * r * 0.45 - ph * 26;
      ctx.globalAlpha = (1 - ph) * 0.8; px2(x, y, ph < 0.4 ? '#ff6060' : '#c01828', ph < 0.3 ? 4 : 2); }
    ctx.restore(); }
  const REDEYE = {}; // 붉은 눈 도트: 고양이 눈(검은 눈동자 'k' 위 · 초록 'G' 아래)을 붉게
  function redEyeKey(k) { if (REDEYE[k] !== undefined) return REDEYE[k]; REDEYE[k] = null; const M = MAPS[k]; if (!M || k.endsWith('B')) return null;
    const R = M.map(r => [...r]); let n = 0;
    for (const o of [0, 1]) for (const cols of [[9, 13], [10, 14]]) for (const c of cols) if (R[5 + o] && R[6 + o] && R[5 + o][c] === 'k' && R[6 + o][c] === 'G') { R[5 + o][c] = '!'; R[6 + o][c] = '¡'; n++; }
    if (!n) return null; const g = k + 'X'; MAPS[g] = R.map(r => r.join('')); if (typeof PLAYER_MAPS !== 'undefined') PLAYER_MAPS.add(g); return REDEYE[k] = g; }
  if (PAL.hRanger) Object.assign(PAL.hRanger, { '!': '#ff3a3a', '¡': '#a01818' });
  const _ds = drawSprite;
  drawSprite = function (key, pal, ...a) { if (pal === 'hRanger' && typeof key === 'string' && G && G.player && on('ranger')) { const r = redEyeKey(key); if (r) key = r; } return _ds.call(this, key, pal, ...a); };

  // ---------------------------------------------------------------- 마법사: 마나 분신
  function updClone(dt) { const P = G.player, C = S.clone; if (!C) return;
    if (!on('mage')) { C.a -= dt * 3; if (C.a <= 0) { S.clone = null; return; } } else C.a = Math.min(1, C.a + dt * 4);
    C.t += dt; const tx = P.x - P.face * 22, ty = P.y - 6 + Math.sin(C.t * 2.2) * 2;
    C.x += (tx - C.x) * Math.min(1, dt * 6); C.y += (ty - C.y) * Math.min(1, dt * 6); C.face = P.face;
    for (const q of S.q) q.t -= dt;
    for (const q of S.q.filter(q => q.t <= 0)) cloneShot(q);
    S.q = S.q.filter(q => q.t > 0);
    if (on('mage') && Math.random() < 0.35) G.parts.push({ x: C.x + rand(-8, 8), y: C.y - rand(4, 24), vx: rand(-8, 8), vy: rand(-30, -12), t: 0.5, c: pick(['#9ad8ff', '#e0f4ff', '#4a8cff']), g: 0, glow: true });
  }
  function cloneShot(q) { const P = G.player, C = S.clone; if (!C) return;
    const sx = C.x + C.face * 12, sy = C.y - 16, tx = P.x + Math.cos(q.ang) * 260, ty = P.y - 8 + Math.sin(q.ang) * 260, ang = Math.atan2(ty - sy, tx - sx);
    S.bolts.push({ x: sx, y: sy, ang, sp: q.big ? 360 : 420, t: 0.72, r: q.big ? 6 : 4, coef: (q.big ? 0.6 : 0.33) * (1 + pasV('meteor')), big: q.big, hist: [] }); // 기본 마력탄(0.66 · 큰 탄 1.2)의 50% · 평타에 붙는 효과는 받지 않음
    G.fx.push({ kind: 'castfx', x: sx, y: sy, r: 14, t: 0.18, max: 0.18, col: '#9ad8ff' }); S.n = (S.n || 0) + 1; }
  function updBolts(dt) {
    for (const b of S.bolts) { b.hist.push({ x: b.x, y: b.y }); if (b.hist.length > 6) b.hist.shift();
      let best = null, bd = 170; for (const e of foes()) { const d = Math.hypot(e.x - b.x, e.y - 8 - b.y); if (d < bd && Math.abs(angDiff(Math.atan2(e.y - 8 - b.y, e.x - b.x), b.ang)) < 0.9) { bd = d; best = e; } }
      if (best) b.ang = lerpAng(b.ang, Math.atan2(best.y - 8 - b.y, best.x - b.x), dt * 3.2);
      const ox = b.x, oy = b.y; b.x += Math.cos(b.ang) * b.sp * dt; b.y += Math.sin(b.ang) * b.sp * dt; b.t -= dt;
      let hit = null; for (const e of foes()) if (Math.hypot(e.x - b.x, e.y - 8 - b.y) < b.r + e.r + 6) { hit = e; break; }
      const wall = blocked(ox, oy + 8, b.x, b.y + 8);
      if (hit || wall || b.t <= 0) { b.dead = true;
        if (hit) damageEnemy(hit, b.coef, { ang: b.ang, grogi: b.big ? 1 : 0.4, kb: b.big ? 50 : 16, gauge: 0, stagger: 0.08 });
        G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 3, grow: b.big ? 110 : 60, t: 0.16, max: 0.16, c: '#9ad8ff' });
        for (let i = 0; i < (b.big ? 8 : 4); i++) { const a = rand(0, TAU), sp = rand(30, 100); G.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: rand(0.15, 0.3), c: pick(['#9ad8ff', '#e0f4ff']), g: 0, glow: true }); } }
      else if (Math.random() < 0.6) G.parts.push({ x: b.x + rand(-2, 2), y: b.y + rand(-2, 2), vx: -Math.cos(b.ang) * 30, vy: -Math.sin(b.ang) * 30 - 10, t: 0.25, c: pick(['#9ad8ff', '#e0f4ff', '#4a8cff']), g: 0, glow: true }); }
    S.bolts = S.bolts.filter(b => !b.dead);
  }
  function drawBolt(b) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
    b.hist.forEach((q, i) => { const k = (i + 1) / b.hist.length; ctx.globalAlpha = 0.5 * k; px2(q.x - 1, q.y - 1, '#4a8cff', b.big ? 4 : 2); });
    ctx.globalAlpha = 1; const R = b.r; for (let y = -R; y <= R; y += 2) for (let x = -R; x <= R; x += 2) { const d = Math.hypot(x, y); if (d <= R) px2(b.x + x, b.y + y, d < R * 0.5 ? '#ffffff' : '#7ac0ff'); }
    ctx.restore(); }
  const _cb = castBolt;
  castBolt = function (...a) { const P = G.player, n0 = G.mproj.length; const r = _cb.apply(this, a); if (on('mage') && S.clone) { const big = G.mproj.slice(n0).some(m => m.big); S.q.push({ t: 0.09, ang: P.ang, big }); } return r; };
  function drawClone() { const C = S.clone, P = G.player; if (!C || C.a <= 0) return;
    const pulse = 0.72 + Math.sin(time * 5) * 0.08;
    bodyGlow('#9ad8ff', 0.9 * C.a, 1, { x: Math.round(C.x / 2) * 2, y: Math.round(C.y / 2) * 2, tint: '#4a8cff', alpha: pulse * C.a });
  }

  // ---------------------------------------------------------------- 성직자: 기적 (패시브 부활)
  const _pd = playerDie;
  playerDie = function () { const P = G.player;
    if (G.cls === 'priest' && !G.miracleUsed && wSkill() !== 'nine') { G.miracleUsed = true; P.hp = Math.min(3, G.stats.hp); P.inv = 2; startMiracle(true); banner('기적', '빛이 미레아를 다시 일으켜 세운다'); return; }
    return _pd.apply(this, arguments); };

  // ---------------------------------------------------------------- 연결
  function tick(dt) { reset(); if (!G.player) return; const P = G.player;
    if (G.cls === 'priest') P.gauge = G.miracleUsed ? 0 : 100;
    if (P.awakenT <= 0 && P.awkCls) P.awkCls = null;
    updWaves(dt); updClone(dt); updBolts(dt);
    if (on('knight') && Math.random() < 0.5) G.parts.push({ x: P.x + rand(-9, 9), y: P.y - rand(2, 26), vx: 0, vy: rand(-30, -12), t: 0.45, c: pick(['#ffe08a', '#fffbe6']), g: 0, glow: true });
    if (on('ranger') && Math.random() < 0.6) G.parts.push({ x: P.x + rand(-8, 8), y: P.y - rand(0, 20), vx: rand(-6, 6), vy: rand(-50, -24), t: 0.4, c: pick(['#ff3040', '#ff8080', '#a01018']), g: 0, glow: true });
  }
  const _wse = weaponSwingEnd; weaponSwingEnd = function (...a) { const r = _wse.apply(this, a); if (G.cls === 'knight' && on('knight')) wave(); return r; };
  const _es = engSteady; engSteady = function () { return _es() || on('knight'); };
  const _ea = engAspd; engAspd = function () { return _ea() * (on('ranger') ? 1.35 : 1); };
  const _hud = hud; hud = function (...a) { const r = _hud.apply(this, a); if (G && G.cls === 'priest' && G.player) { const el = $('skL'); if (el) { const n = el.querySelector('.num'); if (n) n.textContent = ''; el.classList.toggle('used', !!G.miracleUsed); } } if (G) { const k = $('skL') && $('skL').querySelector('.key'); if (k) { const t = G.cls === 'priest' ? '패시브' : (typeof TOUCH !== 'undefined' && TOUCH.on ? k.textContent : 'E'); if (k.textContent !== t) k.textContent = t; } } return r; };
  SKD.add(ents => { if (!G || !G.player) return; const P = G.player;
    for (const W of S.waves) ents.push({ y: W.y + 14, d: () => drawWave(W) });
    if (S.clone) ents.push({ y: S.clone.y - 0.5, d: drawClone });
    for (const b of S.bolts) ents.push({ y: b.y + 14, d: () => drawBolt(b) });
    if (on('ranger')) { ents.push({ y: P.y - 0.5, d: drawAura }); ents.push({ y: P.y + 0.5, d: () => bodyGlow(Math.floor(time * 12) % 2 ? '#ff3040' : '#c01828', 0.75, 1) }); }
    if (on('knight')) ents.push({ y: P.y + 0.5, d: () => bodyGlow(Math.floor(time * 8) % 2 ? '#ffe08a' : '#fff6c8', 0.55 + Math.sin(time * 6) * 0.15, 1) });
  });
  return {
    start, tick, on, get shots() { return S.n || 0; },
    spd: () => (on('ranger') ? 1.5 : 1), crit: () => (on('ranger') ? 0.2 : 0),
    press() { const P = G.player; if (G.cls === 'priest') { G.nums.push({ x: P.x, y: P.y - 30, v: '쓰러지면 저절로 발동', t: 0.9, c: '#ffe39a', s: 1, txt: true }); sfx('blip', 0.7); return; } start(); },
  };
})();
;
