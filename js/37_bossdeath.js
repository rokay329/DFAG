'use strict';
// 잿빛 왕관 원정대 — 37_bossdeath.js : v3.20 보스 사망 장면 (점액왕 · 발도르 · 크루가쉬) — 시안 「보스사망_시안2」
// 보스를 처치하면 몸이 바로 사라지던 것 → 장면을 칸(2px) 단위로 재생한 뒤 마지막 모습이 그 방에 남음. 잿빛 왕은 기존 연출 그대로.
// 게임 그림(보스 도트 · 무기 · 뼈 · 안구 · 왕관)을 그대로 쓰고, 기울이기 · 늘이기 대신 칸을 옮겨 장면을 만든다.
const BOSSDEATH = (() => {
  const D = Math.PI / 180;
  const px = (x, y, c, w = 2, h = 2) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x) & ~1, Math.round(y) & ~1, w, h); };
  const rows = m => m.map(r => r.split(''));
  const join = g => g.map(r => r.join(''));
  const reg = (k, g) => { if (!MAPS[k]) MAPS[k] = join(g); return k; };
  const over = (layers) => { let x0 = 0, y0 = 0, x1 = 0, y1 = 0; for (const [g, ox, oy] of layers) { x0 = Math.min(x0, ox); y0 = Math.min(y0, oy); x1 = Math.max(x1, ox + g[0].length); y1 = Math.max(y1, oy + g.length); }
    const o = Array.from({ length: y1 - y0 }, () => Array(x1 - x0).fill('.')); for (const [g, ox, oy] of layers) g.forEach((r, y) => r.forEach((c, x) => { if (c !== '.') o[y + oy - y0][x + ox - x0] = c; })); return o; };
  const recolor = (g, map) => g.map(r => r.map(c => map[c] || c));
  // 바닥 먼지 (자리마다 같은 모양)
  const dust = (cx, by, n, sp, seed) => { let s = seed; const R = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI + Math.PI, r = sp * (0.6 + R() * 0.5); px(cx + Math.cos(a) * r * 1.6, by - 2 + Math.sin(a) * r * 0.35, R() < 0.5 ? '#7a7066' : '#5a524a', R() < 0.4 ? 4 : 2, 2); } };

  // ============================================================ 점액왕: 부풀어 폭발 → 점액 방울이 퍼짐 → 뼈 · 안구가 웅덩이 위로 흘러나옴
  let SL = null;
  function slimeArt() { if (SL) return SL;
    const CH = { 8: gOutline(fromRows(['.mmmm.', 'mmlmmm', 'mlmmmm', 'mmmmmd', '.mmdd.'])), 6: gOutline(fromRows(['.mm.', 'mlmm', 'mmmd', '.dd.'])), 4: gOutline(fromRows(['.m.', 'mlm', '.d.'])), t: gOutline(fromRows(['..m.', '.mm.', 'mlmm', 'mmmd', '.dd.'])) };
    const SP = { 6: gOutline(fromRows(['.mmmmmm.', 'mmlmmmmd', '.mmmmdd.'])), 4: gOutline(fromRows(['.mmmm.', 'mlmmmd', '.mddd.'])), 3: gOutline(fromRows(['.mmm.', 'mmmmd'])) };
    const CR = gOutline(fromRows(['y...yy...y', 'yy.yyyy.yy', 'YyyyyrryyY', 'YYYYYYYYYY']));
    return (SL = { CH, SP, CR }); }
  const EP = { w: '#f0ece0', W: '#c8c0b0', r: '#c03030', s: '#24301c', i: '#c83a30', I: '#6a1414', p: '#0c0606' }, CRP = { y: '#e8c060', Y: '#a8822e', r: '#b01c22', k: '#0b0a0e' };
  const SPL = [[-70, 6, 6], [-52, 12, 4], [62, 8, 6], [80, 2, 4], [-88, 0, 3], [48, 14, 3], [-30, 16, 3], [24, 18, 4]];
  function slimeSeq(R) {
    const C = SLIME_COL[R.st === 3 ? 'kingR' : 'king'], A = skArt(), BP = SK_BONE, S = slimeArt(), CHP = { k: C.k, d: C.d, m: C.m, l: C.l };
    const eye = (x, y, lx = 0, ly = 0) => { gPaint(ctx, SK_EYEBALL, EP, x, y); const ix = (x + 6 + lx * 2) & ~1, iy = (y + 4 + ly * 2) & ~1; px(ix, iy, EP.I, 6, 6); px(ix, iy, EP.i, 6, 4); px(ix + 2, iy + 2, EP.p); px(ix, iy, '#ffffff'); };
    const bones = (P) => { for (const [k, x, y, fl] of P) gPaint(ctx, fl ? A[k].map(r => r.slice().reverse()) : A[k], BP, x, y); };
    const blob = (x, y, w, h, a = 0.86) => drawBlob(Math.round(x) & ~1, Math.round(y) & ~1, w, h, C, { noShine: true, alpha: a });
    const chunk = (x, y, s, i = 0) => { const g = s >= 8 ? S.CH[8] : s >= 6 ? (i % 2 ? S.CH.t : S.CH[6]) : S.CH[4]; gPaint(ctx, g, CHP, x - g[0].length, y - g.length); };
    const splat = (x, y, w) => { const g = w >= 6 ? S.SP[6] : w >= 4 ? S.SP[4] : S.SP[3]; gPaint(ctx, g, CHP, x - g[0].length, y - g.length + 2); };
    const fly = (CX, BY, k) => { const out = []; for (let i = 0; i < 14; i++) { const a = -Math.PI + (i / 13) * Math.PI + (i % 2 ? 0.12 : -0.1), r = [26, 48, 70, 86][k] * (0.75 + (i % 3) * 0.15); out.push([CX + Math.cos(a) * r * 1.25, BY - 30 + Math.sin(a) * r * 0.9 + [0, 6, 22, 46][k] * (0.5 + (i % 4) * 0.2), i % 3 === 0 ? 8 : i % 3 === 1 ? 6 : 4]); } return out; };
    const king = (CX, BY, jy) => drawSlimeKing(Object.assign({}, R.e, { x: CX, y: BY - 2, jy, jl: 0, jyv: 0, z: 0, flash: 0, glow: 0, grogiT: 0, face: 1 }), 0, 1);
    const puddle = (CX, BY, w, h, a) => stain(CX, BY + 2, w, h, a); // v3.23 볼록한 덩어리 대신 바닥에 납작하게 번진 점액 흔적
    const stain = (CX, BY, w, h, a) => { const rx = w / 2, ry = h / 2; ctx.save(); ctx.globalAlpha = 0.62 * Math.min(1, a / 0.86);
      for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) { const d = (x / rx) ** 2 + (y / ry) ** 2, wob = Math.sin(x * 0.21 + y * 0.7) * 0.12; if (d > 1 + wob) continue; const edge = d > 0.72 + wob; if (edge && ((x + y) >> 1) % 2) continue; px(CX + x, BY + y, edge ? C.d : d < 0.18 ? C.m : C.d); }
      for (const [dx, dy] of [[-0.3, -0.2], [0.25, 0.1], [-0.05, 0.3], [0.4, -0.25]]) px(CX + dx * w, BY + dy * h, C.l); ctx.restore(); };
    const after = (k) => (CX, BY) => { puddle(CX, BY, 108 + k * 8, 14 + k * 2, 0.8); for (const [dx, dy, wd] of SPL) splat(CX + dx * (1 + k * 0.08), BY + dy, wd);
      ctx.save(); ctx.globalAlpha = 0.9; bones([['skull', CX - 4 + k * 2, BY - 12], ['rib', CX + 18 + k * 2, BY - 4], ['pelvis', CX - 28 - k * 2, BY - 2], ['armL', CX - 52 - k * 4, BY - 4], ['armL', CX + 40 + k * 4, BY - 4, 1]]); ctx.restore();
      eye(CX - 62 - k * 6, BY - 4 + k * 2, -1, 0); eye(CX + 44 + k * 6, BY - 8 + k * 2, 0, -1);
      gPaint(ctx, S.CR, CRP, CX + 16 + k * 6, BY - 12 - (k ? 0 : 6));
      for (const [x, ph] of [[-20, 0], [10, 1], [30, 0]]) if ((k + ph) % 2) px(CX + x, BY - 4, C.l); else { px(CX + x - 2, BY - 2, C.l); px(CX + x + 2, BY - 2, C.l); } };
    return [
      [(CX, BY) => king(CX, BY, -0.28), 110], // 움찔 (납작)
      [(CX, BY) => king(CX, BY, 0.3), 110], // 부풀어 늘어남
      [(CX, BY) => { drawShadow(CX, BY, 40); blob(CX, BY, 84, 60); ctx.save(); ctx.globalAlpha = 0.75; bones([['pelvis', CX - 6, BY - 22], ['armL', CX - 26, BY - 36], ['armL', CX + 18, BY - 36, 1], ['rib', CX - 6, BY - 38], ['skull', CX - 10, BY - 54]]); ctx.restore(); eye(CX - 28, BY - 42, -1); eye(CX + 10, BY - 32, 1); gPaint(ctx, S.CR, CRP, CX - 10, BY - 72); // 한껏 부풂 · 부글
        for (const [x, y] of [[-30, -20], [24, -44], [-12, -56], [34, -16], [-38, -38]]) { px(CX + x, BY + y, C.l); px(CX + x - 2, BY + y + 2, C.l); px(CX + x + 2, BY + y + 2, C.l); px(CX + x, BY + y + 4, C.l); } }, 160],
      [(CX, BY) => { drawShadow(CX, BY, 46); fly(CX, BY, 0).forEach(([x, y, s], i) => chunk(x, y, s + 2, i)); // 폭발
        for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; px(CX + Math.cos(a) * 44, BY - 30 + Math.sin(a) * 32, '#e0fcc0'); }
        bones([['skull', CX - 10, BY - 74], ['rib', CX - 4, BY - 46], ['pelvis', CX - 4, BY - 30], ['armL', CX - 30, BY - 50], ['armL', CX + 24, BY - 54, 1]]); eye(CX - 34, BY - 58, -1, -1); eye(CX + 18, BY - 64, 1, -1); gPaint(ctx, S.CR, CRP, CX - 8, BY - 96); }, 90],
      [(CX, BY) => { puddle(CX, BY, 60, 10, 0.86); fly(CX, BY, 1).forEach(([x, y, s], i) => chunk(x, y, s + 2, i)); // 점액 덩어리가 퍼짐
        bones([['skull', CX - 6, BY - 60], ['rib', CX + 6, BY - 30], ['pelvis', CX - 16, BY - 22], ['armL', CX - 40, BY - 36], ['armL', CX + 30, BY - 40, 1]]); eye(CX - 44, BY - 40, -1, 1); eye(CX + 26, BY - 50, 1, 1); gPaint(ctx, S.CR, CRP, CX - 2, BY - 104); }, 100],
      [(CX, BY) => { puddle(CX, BY, 80, 12, 0.86); fly(CX, BY, 2).forEach(([x, y, s], i) => { if (y < BY - 6) chunk(x, y, s + 1, i); else splat(x, Math.min(y, BY + 8), s); }); // 철퍽 · 뼈와 눈이 떨어짐
        bones([['skull', CX - 4, BY - 34], ['rib', CX + 10, BY - 14], ['pelvis', CX - 20, BY - 8], ['armL', CX - 44, BY - 18], ['armL', CX + 34, BY - 20, 1]]); eye(CX - 50, BY - 20, 0, 1); eye(CX + 30, BY - 30, 1, 1); gPaint(ctx, S.CR, CRP, CX + 6, BY - 86); }, 110],
      [(CX, BY) => { puddle(CX, BY, 96, 14, 0.86); for (const [dx, dy, w] of SPL) splat(CX + dx, BY + dy, w); // 웅덩이에 떨어짐
        bones([['skull', CX - 2, BY - 16], ['rib', CX + 14, BY - 6], ['pelvis', CX - 24, BY - 4], ['armL', CX - 46, BY - 8], ['armL', CX + 36, BY - 8, 1]]); eye(CX - 54, BY - 8); eye(CX + 34, BY - 14, 1);
        px(CX - 2, BY - 22, C.l); px(CX + 8, BY - 24, C.l); px(CX - 56, BY - 14, C.l); px(CX + 40, BY - 20, C.l); gPaint(ctx, S.CR, CRP, CX + 12, BY - 46); }, 130],
      [after(0), 160], [after(1), 180], [after(2), 0]]; // 흘러나옴 → 남은 모습
  }

  // ============================================================ 발도르: 칼을 놓치고 무릎부터 천천히 무너져 내림 · 망토가 펼쳐지고 눈빛이 꺼짐
  let BD = null;
  function baldorArt() { if (BD) return BD;
    const g0 = rows(MAPS.nBaldor), HD = g0.slice(0, 9), B = g0.slice(9, 16), LG = g0.slice(15), TS = B.slice(0, 4);
    const CAPE = (w) => { const r = s => s.split(''), m = Math.floor(w / 2);
      return [r('.' + 'k'.repeat(w - 2) + '.'), r('k' + 'c' + 'r'.repeat(m - 2) + 'R' + 'r'.repeat(w - m - 3) + 'D' + 'k'), r('k' + 'R'.repeat(w - 3) + 'D' + 'k'), r('.' + 'k'.repeat(w - 2) + '.')]; };
    const lie = over([[CAPE(29), 0, 8], [TS.slice(0, 2), 0, 7], [HD, 0, 3]]);
    const eyes = (g, m) => g.map((r, y) => y === 9 ? r.map(c => m[c] || c) : r.slice()); // 투구 눈 줄만
    return (BD = { g0: reg('_bdA', g0), k1: reg('_bdB', over([[HD, 0, 0], [B, 0, 9], [LG.slice(1), 0, 16]])), b1: reg('_bdC', over([[B, 0, 10], [HD, 0, 3]])),
      b2: reg('_bdD', over([[CAPE(25), 2, 12], [TS, 0, 9], [HD, 0, 4]])), b3: reg('_bdE', over([[CAPE(29), 0, 11], [TS.slice(0, 3), 0, 9], [HD, 0, 5]])),
      lie: reg('_bdF', lie), dim: reg('_bdG', eyes(lie, { v: 'u' })), off: reg('_bdH', eyes(lie, { v: 'E', u: 'E' })) }); }
  function baldorSeq() {
    const M = baldorArt(), SW = BOSS_SWORD, body = (CX, BY, k, dy = 0) => drawSprite(M[k], 'nBaldor', 2, CX, BY + dy, false, {});
    const sw = (CX, BY, a, dy = 0) => drawBlade(SW, CX + 26, BY - 6 + dy, a * D);
    const wisp = (CX, BY, k) => { for (const [x, ph] of [[-14, 0], [-2, 2], [10, 1], [20, 3]]) { const yy = BY - 12 - ((k * 6 + ph * 7) % 22); px(CX + x, yy, ph % 2 ? '#b450d8' : '#6a3a8a'); } };
    const rest = (k, key, dust0) => (CX, BY) => { drawShadow(CX, BY, 30); sw(CX, BY, 8); body(CX, BY, key, 2); if (dust0) dust(CX, BY + 2, 8, 34, 9); wisp(CX, BY, k); };
    return [
      [(CX, BY) => { drawShadow(CX, BY, 24); drawBlade(SW, CX + 16, BY - 14, 70 * D); body(CX, BY, 'g0', 2); }, 420], // 휘청 · 칼끝이 내려감
      [(CX, BY) => { drawShadow(CX, BY, 24); sw(CX, BY, 40, -4); body(CX, BY, 'k1'); }, 300], // 칼을 놓침
      [(CX, BY) => { drawShadow(CX, BY, 24); sw(CX, BY, 8); body(CX, BY, 'k1'); }, 420], // 무릎이 꺾임
      [(CX, BY) => { drawShadow(CX, BY, 24); sw(CX, BY, 8); body(CX, BY, 'b1'); }, 520], // 투구가 가슴 쪽으로
      [(CX, BY) => { drawShadow(CX, BY, 26); sw(CX, BY, 8); body(CX, BY, 'b2'); }, 480], // 망토가 바닥에 퍼짐
      [(CX, BY) => { drawShadow(CX, BY, 28); sw(CX, BY, 8); body(CX, BY, 'b3', 2); }, 220], // 무너져 내림
      [(CX, BY) => { drawShadow(CX, BY, 30); sw(CX, BY, 8); body(CX, BY, 'lie', 2); dust(CX, BY + 2, 14, 26, 7); }, 180], // 털썩 · 먼지
      [rest(0, 'lie', true), 240], [rest(1, 'lie'), 280], [rest(2, 'dim'), 120], [rest(3, 'lie'), 90], [rest(4, 'dim'), 160], // 눈빛이 깜빡이다
      [(CX, BY) => { drawShadow(CX, BY, 30); sw(CX, BY, 8); body(CX, BY, 'off', 2); }, 0]]; // 꺼짐 · 남은 모습
  }

  // ============================================================ 크루가쉬: 도끼를 거꾸로 박아 짚고 무릎을 꿇은 채 고개를 떨굼 · 눈빛이 꺼짐
  let KG = null;
  function krugArt() { if (KG) return KG;
    const g0 = rows(MAPS.nKrugash), H = g0.length, W = g0[0].length, mk = (cells) => { const r = Array(W).fill('.'); for (const [x, c] of cells) r[x] = c; return r; };
    const KN1 = mk([[8, 'k'], [9, 'M'], [10, 'M'], [11, 'M'], [12, 'M'], [13, 'k'], [19, 'k'], [20, 'M'], [21, 'M'], [22, 'M'], [23, 'M'], [24, 'k']]);
    const KN2 = mk([[7, 'k'], [8, 'k'], [9, 'k'], [10, 'k'], [11, 'k'], [12, 'k'], [13, 'k'], [19, 'k'], [20, 'k'], [21, 'k'], [22, 'k'], [23, 'k'], [24, 'k'], [25, 'k']]);
    const kneel = g0.slice(0, H - 5).concat([g0[H - 4], KN1, KN2]);
    const bow = (g) => { const o = g.map(r => r.slice()); for (let y = 21; y >= 0; y--) o[y + 1] = g[y].slice(); o[0] = g[0].map(() => '.'); return o; };
    const kb = bow(kneel);
    return (KG = { g0: reg('_kgA', g0), kneel: reg('_kgB', kneel), kb: reg('_kgC', kb), dim: reg('_kgD', recolor(kb, { e: 'A' })), off: reg('_kgE', recolor(kb, { e: 'E', A: 'R' })) }); }
  function krugSeq() {
    const M = krugArt(), AX = KRUG_AXE, body = (CX, BY, k, dy = 0) => drawSprite(M[k], 'nKrugash', 2, CX, BY + dy, false, {});
    const axeDown = (CX, BY) => drawBlade(AX, CX + 30, BY - (AX.reach || 60) + 4, 90 * D);
    const kneel = (k, d) => (CX, BY) => { drawShadow(CX, BY, 18); axeDown(CX, BY); body(CX, BY, k); if (d) dust(CX, BY, d[0], d[1], d[2]); };
    return [
      [(CX, BY) => { drawShadow(CX, BY, 14); body(CX, BY, 'g0', 2); drawBlade(AX, CX + NM_HAND + 2, BY - 14, -40 * D); }, 320], // 휘청 · 도끼가 기욺
      [kneel('kneel', [12, 18, 3]), 200], [kneel('kneel', [6, 24, 5]), 460], // 털썩 무릎 · 도끼를 박음
      [kneel('kb'), 700], [kneel('dim'), 160], [kneel('off'), 0]]; // 고개를 떨굼 → 눈빛이 꺼짐 · 남은 모습
  }

  // ============================================================ 게임 연결
  const SEQ = {}, seqOf = (R) => R.k === 'slime' ? slimeSeq(R) : SEQ[R.k] || (SEQ[R.k] = R.k === 'baldor' ? baldorSeq() : krugSeq());
  const kindOf = e => e && e.type === 'boss' ? (e.kind === 'slimeking' ? 'slime' : e.kind === 'krugash' ? 'krug' : !e.kind ? 'baldor' : null) : null;
  const BYOFF = { slime: 2, baldor: 3, krug: 2 }; // 게임 좌표 e.y → 발 밑 줄
  function start(e) { const k = kindOf(e), R = G && G.dun && G.dun.cur; if (!k || !R || e._bdead) return; e._bdead = true;
    (R.bossDead = R.bossDead || []).push({ k, x: Math.round(e.x) & ~1, y: Math.round(e.y), st: e.stage, e: { stage: e.stage }, t0: time - (k === 'krug' && e.kgD && e.kgD.kneel ? 0.98 : 0) }); } // v3.80 이미 무릎 꿇은 크루가쉬는 고개를 떨구는 데부터
  function frameAt(R) { const S = R.seq || (R.seq = seqOf(R)); let t = (time - R.t0) * 1000; for (let i = 0; i < S.length; i++) { if (i === S.length - 1 || t < S[i][1]) return S[i]; t -= S[i][1]; } return S[S.length - 1]; }
  function draw(R) { const f = frameAt(R); ctx.save(); try { f[0](R.x, R.y + BYOFF[R.k]); } finally { ctx.restore(); } }
  function ents(list) { const R = G && G.dun && G.dun.cur; if (!R || !R.bossDead) return; for (const d of R.bossDead) list.push({ y: d.y - 1, d: () => draw(d) }); }
  const dur = k => (k === 'slime' ? slimeSeq({ st: 1, e: {} }) : seqOf({ k })).reduce((a, f) => a + f[1], 0) / 1000; // 장면 길이 (초)
  // 처치: 원래 처리(보상 · 기록)는 그대로, 몸 대신 사망 장면을 남김 — 11e_truth3의 ORIG(약속의 결투 뒤 크루가쉬)도 같이 감쌈
  const wrap = f => function (e, silent) { const was = e && !e.dead; const r = f.apply(this, arguments); if (was && e.dead && !silent) start(e); return r; };
  killEnemy = wrap(killEnemy);
  if (typeof ORIG !== 'undefined' && ORIG.killEnemy) ORIG.killEnemy = wrap(ORIG.killEnemy);
  { const o = roomEnts; roomEnts = function (list) { o(list); ents(list); }; }
  // v3.80 약속의 결투에서 진 뒤 무릎 꿇고 숨을 몰아쉬는 모습 (도끼를 박아 짚음 · up이면 고개가 내려감)
  function kneel(e, up) { const M = krugArt(), CX = Math.round(e.x) & ~1, BY = Math.round(e.y) + BYOFF.krug; ctx.save(); try { drawShadow(CX, BY, 18); drawBlade(KRUG_AXE, CX + 30, BY - (KRUG_AXE.reach || 60) + 4, 90 * D); drawSprite(M[up ? 'kb' : 'kneel'], 'nKrugash', 2, CX, BY, false, { white: e.flash > 0 }); } finally { ctx.restore(); } }
  return { start, ents, dur, kindOf, kneel };
})();
