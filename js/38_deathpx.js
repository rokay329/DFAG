'use strict';
// 잿빛 왕관 원정대 — 38_deathpx.js : v3.20 플레이어블 캐릭터 · 난입자 공통 사망 장면 (시안 「캐릭터사망_시안1」)
// 모두 같은 처리, 그림만 다름: 무기는 사라짐 → 움찔(번쩍) → 뒤로 밀림 → 휘청 → 털썩 무릎(먼지) → 고개를 떨굼 → 눈을 감음 (크루가쉬처럼 무릎 꿇은 채 남음)
// 도트 규칙: 장면은 기존 도트의 줄(머리 · 몸통 · 발)을 칸 단위로 옮겨 만든다. 회전 · 기울이기 · 늘이기 없음.
const DEATHPX = (() => {
  // 머리가 끝나는 줄 (이 줄부터 몸통) — 도트 키별
  const HEAD = { hKnight: 9, hRanger: 8, hMage: 14, hPriest: 11, hGunner: 9, invPanda: 8, invReaper: 10, invShrew: 7, invShrewB: 7, invWeasel: 8 };
  const rows = m => m.map(r => r.split('')), join = g => g.map(r => r.join(''));
  const over = (L) => { let x0 = 0, y0 = 0, x1 = 0, y1 = 0; for (const [g, ox, oy] of L) { x0 = Math.min(x0, ox); y0 = Math.min(y0, oy); x1 = Math.max(x1, ox + g[0].length); y1 = Math.max(y1, oy + g.length); }
    const o = Array.from({ length: y1 - y0 }, () => Array(x1 - x0).fill('.')); for (const [g, ox, oy] of L) g.forEach((r, y) => r.forEach((c, x) => { if (c !== '.') o[y + oy - y0][x + ox - x0] = c; })); return o; };
  const CACHE = {};
  // key: 도트 키(팔레트도 같은 키) · closed: 눈 감은 도트 키 · eyeMap: 눈 감은 도트가 없을 때 눈 색 바꾸기
  // 도트를 세 덩어리로: 꼬리 · 망토(머리 폭보다 뒤쪽 칸) · 머리(머리 줄의 머리 폭) · 몸통(나머지) — 꼬리는 늘 몸통과 같이 움직여 끊기지 않음
  function art(key, closed, eyeMap) {
    if (CACHE[key]) return CACHE[key];
    const base = rows(MAPS[key]), H = base.length, W = base[0].length, h = HEAD[key] || Math.round(H * 0.6);
    const shut = closed && MAPS[closed] ? rows(MAPS[closed]) : base.map(r => r.map(c => (eyeMap && eyeMap[c]) || c));
    let L = W, R = -1; for (let y = 0; y < h; y++) base[y].forEach((c, x) => { if (c !== '.') { L = Math.min(L, x); R = Math.max(R, x); } });
    const part = (g, f) => g.map((r, y) => r.map((c, x) => (f(x, y) ? c : '.')));
    const tail = part(base, x => x < L), head = part(base, (x, y) => x >= L && y < h), headC = part(shut, (x, y) => x >= L && y < h), body = part(base, (x, y) => x >= L && y >= h);
    // 무릎: 다리 두 줄을 빼서 몸통 · 꼬리 · 머리가 두 칸 내려옴 (발 줄은 남김)
    // 무릎: 다리 두 줄(H-3, H-2)을 빼고 그 위 줄을 모두 두 칸 내림 · 발 줄은 그대로
    const drop = g => g.map((r, y) => (y === H - 1 ? r.slice() : y >= 2 ? g[y - 2].slice() : r.map(() => '.')));
    const kTail = drop(tail), kBody = drop(body);
    // 머리 뒤 자리: 머리가 앞으로 fx칸, 아래로 dy칸 (바닥 = 마지막 줄)
        const reg = (n, g) => { const k = '_dp_' + key + '_' + n; MAPS[k] = join(g); return k; };
    const pose = (hd, ox, oy) => over([[kTail, 0, 0], [kBody, 0, 0], [hd, ox, oy]]).slice(0, H); // 발 밑 줄을 살아 있을 때와 같게
    return (CACHE[key] = { pal: key, base: key,
      kn: reg('k', pose(head, 0, 2)), // 무릎: 머리 · 몸통 · 꼬리가 같이 두 칸 내려옴
      bow: reg('b', pose(head, 0, 3)), bowC: reg('c', pose(headC, 0, 3)) }); } // 고개를 떨굼 (머리 한 칸 더) → 눈을 감음
  // 장면표: [이름, 길이(초)] — 마지막(0)은 남은 모습 (크루가쉬처럼 무릎 꿇은 채 고개를 떨구고 눈을 감음)
  const SEQ = [['flash', 0.06], ['hurt', 0.1], ['buckle', 0.14], ['knee', 0.18], ['kneel', 0.24], ['bow', 0.36], ['shut', 0]];
  const TOTAL = SEQ.reduce((a, s) => a + s[1], 0);
  const stepAt = t => { for (const [n, d] of SEQ) { if (t < d || !d) return n; t -= d; } return 'shut'; };
  const dustAt = (x, y, n, sp) => { for (let i = 0; i < n; i++) { const a = Math.PI + (i / (n - 1)) * Math.PI, r = sp * (0.7 + (i % 3) * 0.2); ctx.fillStyle = i % 2 ? '#7a7066' : '#5a524a'; ctx.fillRect(Math.round(x + Math.cos(a) * r * 1.5) & ~1, Math.round(y - 2 + Math.sin(a) * r * 0.3) & ~1, i % 3 ? 2 : 4, 2); } };
  // A: art() · (x, y): 살아 있을 때 그리던 발 밑 좌표 · face: 1 오른쪽 · t: 죽은 뒤 지난 시간(초) · o.alpha
  function draw(A, x, y, face, t, o = {}) {
    const s = stepAt(t), flip = face < 0, back = -face * 2, al = o.alpha == null ? 1 : o.alpha;
    const sp = (k, dx = 0, dy = 0, op = {}) => drawSprite(A[k], A.pal, 2, x + dx, y + dy, flip, Object.assign({ alpha: al }, op));
    drawShadow(x, y - 1, s === 'flash' || s === 'hurt' || s === 'buckle' ? 8 : 9);
    if (s === 'flash') sp('base', 0, 0, { white: true });
    else if (s === 'hurt') sp('base', back);
    else if (s === 'buckle') sp('base', back, 2);
    else if (s === 'knee') { sp('kn', back); dustAt(x + back, y, 8, 10); } // 털썩 무릎 · 먼지
    else if (s === 'kneel') sp('kn', back);
    else sp(s === 'bow' ? 'bow' : 'bowC', back);
  }
  // ============================================================ 게임 연결
  const HERO = { knight: 'hKnight', ranger: 'hRanger', mage: 'hMage', priest: 'hPriest', gunner: 'hGunner' };
  const heroArt = cls => HERO[cls] && MAPS[HERO[cls]] ? art(HERO[cls], blinkMap(HERO[cls])) : null;
  const invArt = type => INV_MAP[type] && MAPS[INV_MAP[type]] ? art(INV_MAP[type], null, { x: 'E' }) : null;
  // 플레이어: 죽으면 무기 없이 사망 장면 (P.deadT는 10_player.js에서 흐름)
  { const o = drawPlayerInner; drawPlayerInner = function () { const P = G.player, A = P && P.dead && heroArt(G.cls); if (!A) return o.apply(this, arguments); draw(A, P.x, P.y + 2, P.face || 1, P.deadT || 0); }; }
  // 난입자: 날아가며 도는 시체 대신 사망 장면 → 엎어진 모습이 방에 남음
  { const o = killEnemy; killEnemy = function (e, silent) { const was = e && !e.dead, r = o.apply(this, arguments);
      if (was && e.dead && INV_MAP[e.type] && invArt(e.type)) { const R = G.dun && G.dun.cur;
        if (G.corpses) G.corpses = G.corpses.filter(c => c.e !== e); if (R && R.keepC) R.keepC = R.keepC.filter(c => c.e !== e);
        if (R) (R.invDead = R.invDead || []).push({ type: e.type, x: Math.round(e.x) & ~1, y: Math.round(e.y), face: e.face || 1, t0: time }); }
      return r; }; }
  { const o = roomEnts; roomEnts = function (list) { o(list); const R = G && G.dun && G.dun.cur; if (!R || !R.invDead) return;
    for (const d of R.invDead) { const A = invArt(d.type); if (A) list.push({ y: d.y - 1, d: () => draw(A, d.x, d.y + 2, d.face, time - d.t0) }); } }; }
  return { art, draw, TOTAL, stepAt, HEAD };
})();
