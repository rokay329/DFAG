'use strict';
// 잿빛 왕관 원정대 · death_fx.js — 합친 파일: 37_bossdeath.js, 38_deathpx.js, 39_altarwind.js, 40_road4.js (v3.84 파일 정리 · typeof로 먼저 확인하는 이름 몇 개는 var로 선언)

// ==================================================================== 37_bossdeath.js
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
;

// ==================================================================== 38_deathpx.js
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
;

// ==================================================================== 39_altarwind.js
'use strict';
// 잿빛 왕관 원정대 — 39_altarwind.js : v3.20 왕도 성문 앞 제단 방 오른쪽 아래의 「바람이 새는 잔해 더미」 → 용의 유적 입구
// 조건: 그 캐릭터의 2회차 + 이번 판에 진실 1 · 2 · 3을 모두 봄 (3→4 대장간 음유시인 「제단의 바람 소리」와 같음)
// 잔해 더미 두 곳(오른쪽 아래 큰 것 · 왼쪽 아래 작은 것)은 늘 있는 장애물. 조건을 채웠을 때만 오른쪽 더미에서 바람이 새고 상호작용 · 부수기가 됨
// 말을 걸면 주인공 혼잣말뿐 · 여러 번(9번) 공격하면 잔해가 걷히며 룬이 새겨진 돌 테 + 석재 사다리 구멍이 드러남 → 「F 내려가기」로 용의 유적
// 잔해 · 구멍은 장애물 (밟고 지나갈 수 없음). 그림은 FP(11_altar_forge.js)의 도트 도우미 (칸 = 2px · 외곽선 · 디더 그림자)
const ALTARWIND = (() => {
  const room = () => { const R = G && G.dun && G.dun.altar && G.dun.cur; return R && R.type === 'altar' ? R : null; }; // 잔해는 늘 있음 (1회차 · 다른 조건에서도) — 바람 · 상호작용 · 부수기는 아래 조건일 때만
  const on = () => { const R = G && G.dun && G.dun.altar && G.dun.cur; if (!R || R.type !== 'altar' || R.seqT != null) return null;
    const run = G.truthRun || {}; return TRUTH.loop2() && run.t1 && run.t2 && run.t3 ? R : null; };
  const pos = () => ({ x: (A.x1 - 58) & ~1, y: (A.y1 - 26) & ~1 }); // 바닥 오른쪽 아래 모서리 (구멍 한가운데)
  const HITS = 9; // 이만큼 때려야 걷힘 (3번마다 위쪽 돌이 한 겹씩 굴러 떨어짐)

  // ================================================================ 그림 (칸 좌표 · 그림 안의 구멍 중심 = CX, CY)
  const W = 46, H = 32, CX = 23, CY = 19;
  const P = ['#aea89c', '#948e84', '#77726a', '#5e5952', '#4a4640', '#373531']; // 제단 방 바닥 돌과 같은 따뜻한 잿빛 (바닥 그림에서 뽑은 색) // 돌 (밝 → 어둠) — 빛은 왼쪽 위
  const VOID = ['#0b0a08', '#110f0c', '#171511'], VOIDS = new Set(VOID);
  const hh = (x, y, s) => FP.hh(x, y, s);
  const EDGE = '#23211d';
  // 돌 하나를 그린 뒤: 뒤에 깔린 돌과 맞닿는 칸에 어두운 틈을 둘러 돌끼리 또렷이 나뉘게
  function sep(S, cells) { const own = new Set(cells.map(([x, y]) => x + ',' + y)); for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (!own.has(k) && S.has(x + dx, y + dy) && !VOIDS.has(S.get(x + dx, y + dy))) S.set(x + dx, y + dy, EDGE); } }
  // 시드가 같은 난수 (같은 판이면 늘 같은 모양)
  const rng = sd => () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // 거친 돌: 가장자리가 울퉁불퉁한 덩이 (각마다 반지름이 다름) · 윗면이 밝고 오른쪽 아래로 어두움 · 결 얼룩
  function rock(S, cx, cy, rx, ry, sd, dark = 0) { const C = [], R = rng(sd), J = Array.from({ length: 8 }, () => 0.72 + R() * 0.4), flat = R() < 0.45;
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, a = (Math.atan2(dy, dx) / (Math.PI * 2) + 1) * 8, i = Math.floor(a) % 8, f = a - Math.floor(a), lim = J[i] * (1 - f) + J[(i + 1) % 8] * f;
      if (Math.hypot(dx, dy) > lim) continue;
      let l = -0.5 * dx - 0.9 * dy + (hh(x, y, sd) - 0.5) * 0.4; if (flat && dy < -0.35) l += 0.35; // 넓적한 돌은 윗면이 평평하게 밝음
      const k = l > 0.6 ? 0 : l > 0.15 ? 1 : l > -0.3 ? 2 : l > -0.75 ? 3 : 4;
      S.set(x, y, P[Math.min(5, k + dark)]); C.push([x, y]);
    }
    sep(S, C);
  }
  // 나무 조각 (부러진 판자 · 들보): (x0,y0)→(x1,y1) 굵기 th칸 · 윗면 밝고 아래 어두움 · 나뭇결 · 쪼개진 끝 · 박힌 못
  const WD = ['#9a8064', '#7d664e', '#62503e', '#4a3c2f', '#332a21']; // 바랜 나무 (제단 방의 따뜻한 잿빛에 맞춤)
  function plank(S, x0, y0, x1, y1, th, sd, dark = 0) { const C = [], R = rng(sd), n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), sp0 = R() < 0.7, sp1 = R() < 0.7, nail = R() < 0.5 ? Math.floor(n * (0.2 + R() * 0.6)) : -1;
    for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n), end = i === 0 || i === n;
      for (let j = 0; j < th; j++) { if (end && ((i === 0 && sp0) || (i === n && sp1)) && j % 2 === (i === 0 ? 0 : 1)) continue; // 쪼개진 끝: 한 줄씩 들쭉날쭉
        let k = j === 0 ? 0 : j === th - 1 ? 3 : 1; if (j > 0 && j < th - 1 && hh(i, j, sd) < 0.22) k = 2; if (end && !(sp0 || sp1)) k = Math.min(4, k + 1); // 나뭇결 · 잘린 마구리
        S.set(x, y + j, WD[Math.min(4, k + dark)]); C.push([x, y + j]); }
      if (i === nail) S.set(x, y + (th > 2 ? 1 : 0), '#2a2622'); }
    sep(S, C);
  }
  // ---- 무너진 잔해: 돌 · 부서진 판자와 들보가 아무렇게나 쏟아져 쌓임 — 큰 돌 몇 · 중간 돌 · 자갈 · 부스러기 (한쪽으로 조금 더 흘러내림)
  // cx · cy: 더미 중심(칸) · ex · ey: 퍼진 정도 · hgt: 높이 · nw: 나무 조각 수
  function pileOf(seed, n, cx, cy, ex, ey, hgt, nw) { const R = rng(seed), L = [];
    for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, r = Math.pow(R(), 0.7), bx = cx + Math.cos(a) * r * ex + (R() - 0.3) * 3, by = cy + Math.sin(a) * r * ey;
      const el = Math.pow(1 - r, 1.3) * hgt + R() * 2.5, big = R(), k = ex / 19, rx = (big < 0.15 ? 3.8 + R() * 1.4 : big < 0.55 ? 2.4 + R() * 1.2 : 1.3 + R() * 0.8) * (0.7 + 0.3 * k);
      L.push({ k: 'r', x: bx, y: by - el, rx, ry: rx * (0.62 + R() * 0.2), base: by, el, sd: seed + i, dark: R() < 0.3 ? 1 : 0 }); }
    for (let i = 0; i < nw; i++) { const a = R() * Math.PI * 2, r = Math.pow(R(), 0.8) * 0.85, bx = cx + Math.cos(a) * r * ex, by = cy + Math.sin(a) * r * ey, el = Math.pow(1 - r, 1.3) * hgt * 0.8 + R() * 2;
      const len = 6 + Math.floor(R() * (ex > 12 ? 9 : 5)), sl = (R() - 0.5) * 0.9, dir = R() < 0.5 ? -1 : 1, beam = R() < 0.3, dx = Math.round(len / Math.sqrt(1 + sl * sl)) * dir, dy = Math.round(dx * sl);
      L.push({ k: 'w', x0: Math.round(bx - dx / 2), y0: Math.round(by - el - dy / 2), x1: Math.round(bx + dx / 2), y1: Math.round(by - el + dy / 2), th: beam ? 3 : 2, base: by + 0.5, el, sd: seed + 500 + i, dark: R() < 0.35 ? 1 : 0 }); }
    return L.sort((p, q) => (p.base + p.el * 0.15) - (q.base + q.el * 0.15)); }
  const draw1 = (T, q) => q.k === 'w' ? plank(T, q.x0, q.y0, q.x1, q.y1, q.th, q.sd, q.dark) : rock(T, q.x, q.y, q.rx, q.ry, q.sd, q.dark);
  const gravelOf = (seed, n, cx, cy, ex, ey) => { const R = rng(seed), L = []; for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()), x = Math.round(cx + Math.cos(a) * r * ex + (R() - 0.35) * 2), y = Math.round(cy + Math.sin(a) * r * ey); L.push([x, y, R() < 0.5 ? 3 : R() < 0.5 ? 2 : 4, R(), R() < 0.2]); } return L; }; // 마지막: 나무 부스러기인지
  const STONES = pileOf(4417, 40, CX + 1, CY + 2, 19, 7.5, 13, 8);
  const ELS = STONES.map(q => q.el).sort((a, b) => b - a), CUT = [99, ELS[Math.floor(ELS.length * 0.4)], ELS[Math.floor(ELS.length * 0.78)]]; // 단계마다 이보다 높이 얹힌 것은 굴러 떨어짐
  const GRAVEL = gravelOf(91, 90, CX + 1, CY + 3, 23, 8.5);
  function gravel(S, keep, G_ = GRAVEL) { for (const [x, y, k, r, w] of G_) if (r < keep && !S.has(x, y)) { const c = w ? WD : P; S.set(x, y, c[Math.min(4, k)]); if ((w || r < keep * 0.25) && !S.has(x + 1, y)) S.set(x + 1, y, c[Math.min(4, k + 1)]); } } // 자갈 · 나무 부스러기 (한두 칸)
  function rubbleArt(st) {
    const B = FP.Spr(W, H, 4); pit(B, st >= 2); // 밑에 깔린 구멍 (잔해가 걷힐수록 드러남 · 사다리 머리는 마지막 겹에서)
    const T = FP.Spr(W, H, 4); for (const q of STONES) if (q.el <= CUT[st]) draw1(T, q);
    const R = rng(700 + st); for (let i = 0; i < st * 4; i++) { const a = R() * Math.PI * 2, x = CX + Math.cos(a) * (19 + R() * 3), y = CY + 3 + Math.sin(a) * (7 + R() * 2);
      if (i % 3 === 2) plank(T, Math.round(x - 3), Math.round(y), Math.round(x + 3), Math.round(y + (R() < 0.5 ? 1 : -1)), 2, 820 + st * 10 + i, 1); else rock(T, x, y, 1.4 + R() * 1.2, 1 + R() * 0.7, 800 + st * 10 + i, 1); } // 굴러 떨어진 돌 · 나뭇조각
    gravel(B, 0.55 + st * 0.15); FP.shadow(T, 2, 1, 6, 0.45); // 자갈은 외곽선 없이 바닥에
    return stack(FP.render(B, false), FP.render(T));
  }
  // ---- 화면 왼쪽 아래의 작은 잔해 (같은 무너짐의 흔적 · 장식 + 장애물)
  const LW = 30, LH = 20, LCX = 15, LCY = 13, SMALL = pileOf(5521, 16, LCX, LCY, 10, 4, 7, 4), SGRAV = gravelOf(77, 40, LCX, LCY + 1, 13, 5);
  function smallArt() { const B = FP.Spr(LW, LH, 4), T = FP.Spr(LW, LH, 4); for (const q of SMALL) draw1(T, q); gravel(B, 0.7, SGRAV); FP.shadow(T, 2, 1, 6, 0.45); return stack(FP.render(B, false), FP.render(T)); }
  const posL = () => ({ x: (A.x0 + 96) & ~1, y: (A.y1 - 30) & ~1 });
  const stack = (a, b) => { const g = a.getContext('2d'); g.drawImage(b, 0, 0); return a; };

  // ---- 걷힌 뒤: 바닥이 안쪽으로 꺼져 파인 구멍 (테를 쌓지 않음) — 깨진 가장자리 · 바닥 금 · 먼 쪽 안벽(거친 돌 · 룬 띠) · 석재 사다리 · 아래는 끝없는 어둠
  const PX0 = 6, PX1 = 41, PY0 = 11, PY1 = 27; // 구멍 대략의 범위 (칸)
  let RUNES = [];
  const inPit = (x, y) => { const dx = (x + 0.5 - CX - 0.5) / 17, dy = (y + 0.5 - CY) / 8, a = Math.atan2(dy, dx), n = 1 + 0.08 * Math.sin(a * 3 + 1.3) + 0.05 * Math.sin(a * 5 + 0.4); return Math.pow(Math.abs(dx), 2.6) + Math.pow(Math.abs(dy), 2.6) <= n * n; };
  function pit(S, ladder) { RUNES = [];
    const top = {}, bot = {}; for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (inPit(x, y)) { if (top[x] == null) top[x] = y; bot[x] = y; }
    const xs = Object.keys(top).map(Number), xl = Math.min(...xs), xr = Math.max(...xs);
    for (const x of xs) for (let y = top[x]; y <= bot[x]; y++) { if (!inPit(x, y)) continue;
      const d = y - top[x], sl = x - xl, sr = xr - x; let c;
      if (d === 0) c = P[3]; // 먼 쪽 깨진 가장자리 (바닥 높이 · 가는 빛줄)
      else if (d <= 2) c = hh(x, y, 5) < 0.3 ? P[5] : P[4]; // 안벽 윗부분 (거친 돌 · 바로 그늘로)
      else if (d === 3) c = (x + y) & 1 ? VOID[2] : P[5];
      else if (d === 4) c = (x + y) & 1 ? VOID[0] : VOID[2];
      else c = VOID[0]; // 끝을 알 수 없는 어둠
      if (d > 0 && sl <= 1 && d < 4) c = P[4]; // 왼쪽 안벽
      if (d > 0 && sr <= 1 && d < 4) c = P[5]; // 오른쪽 안벽 (그늘)
      if (y === bot[x] && d > 3) c = VOID[1]; // 가까운 쪽 가장자리 (바로 아래로 꺼짐)
      S.set(x, y, c);
    }
    // 가장자리 바깥: 깨져 나간 바닥 조각 · 가장자리를 따라 꺼진 그늘 · 바닥으로 뻗은 금
    for (const x of xs) { if (hh(x, 1, 21) < 0.45 && !S.has(x, top[x] - 1)) S.set(x, top[x] - 1, P[4]); if (hh(x, 2, 22) < 0.3 && !S.has(x, bot[x] + 1)) S.set(x, bot[x] + 1, P[3]); }
    for (const x of xs) for (const y of [top[x] - 1, top[x] - 2, bot[x] + 1]) if (!S.has(x, y) && hh(x, y, 41) < (y === top[x] - 2 ? 0.12 : 0.28)) S.set(x, y, y > top[x] ? P[5] : P[4]); // 깨져 나간 바닥 부스러기 (가장자리에 붙어서)
    // 먼 쪽 안벽에 새긴 룬 띠 (옛 유적의 흔적 · 따로 빛남)
    for (const [gx, g] of [[11, 2], [16, 0], [31, 1], [35, 3]]) { const gy = top[gx + 1] + 1; for (const [dx, dy] of GLY[g]) if (inPit(gx + dx, gy + dy)) { S.set(gx + dx, gy + dy, P[5]); RUNES.push([gx + dx, gy + dy]); } }
    if (!ladder) return;
    // 석재 사다리: 먼 쪽 안벽에 붙은 두 돌기둥 + 디딤돌 — 위 끝이 가장자리 위로 두 칸 나오고, 아래로 갈수록 어둠에 잠김
    const RL = [18, 27], t0 = Math.min(top[18], top[29]), fade = y => y <= t0 + 1 ? 0 : y <= t0 + 3 ? 1 : y <= t0 + 6 ? 2 : 3, SC = [P[1], P[2], P[3], P[4]], SD = [P[3], P[4], P[5], VOID[2]];
    for (const rx of RL) for (let y = t0 - 2; y <= t0 + 10; y++) { const f = fade(y); if (f >= 3 && (y + rx) & 1) continue; S.set(rx, y, y === t0 - 2 ? P[0] : SC[f]); S.set(rx + 1, y, SD[f]); }
    for (const ry of [t0 + 1, t0 + 4, t0 + 7]) { const f = fade(ry); for (let x = RL[0] + 2; x < RL[1]; x++) { S.set(x, ry, SC[f]); S.set(x, ry + 1, SD[f]); } }
  }
  function gateArt() {
    const B = FP.Spr(W, H, 4); pit(B, true);
    const T = FP.Spr(W, H, 4), R = rng(55); // 걷어낸 잔해: 구멍 둘레에 흩어진 돌 몇 덩이 · 자갈
    for (let i = 0; i < 7; i++) { const a = R() * Math.PI * 2; rock(T, CX + Math.cos(a) * (19.5 + R() * 3), CY + 2 + Math.sin(a) * (9 + R() * 2), 1.3 + R() * 1.4, 1 + R() * 0.8, 900 + i, 1); }
    plank(T, 1, 15, 7, 17, 2, 951, 1); plank(T, 37, 27, 44, 26, 2, 952, 1); plank(T, 13, 29, 18, 30, 2, 953, 1); // 걷어낸 판자 조각
    for (const [x, y, k, r] of GRAVEL) if (r < 0.35 && !inPit(x, y) && !inPit(x, y - 1) && !inPit(x, y + 1) && !B.has(x, y)) B.set(x, y, P[k]);
    FP.shadow(T, 1, 1, 6, 0.4);
    return stack(FP.render(B, false), FP.render(T));
  }
  const GLY = [[[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]], [[0, 0], [0, 1], [0, 2], [1, 1], [2, 0], [2, 2]]];
  let CV = {};
  const art = k => CV[k] || (CV[k] = k === 'gate' ? gateArt() : k === 'small' ? smallArt() : rubbleArt(+k.slice(1)));
  const org = (c, p) => ({ x: (p.x - (CX + 4) * 2) & ~1, y: (p.y - (CY + 4) * 2) & ~1 }); // 그림 왼쪽 위 (pad 4칸 포함)

  const LINES = { knight: '…정말 휘파람 같은 바람 소리가 들리는군.', ranger: '…진짜 바람 소리네.', mage: '정말 휘파람 소리가 들리네요.|틈 너머에 빈 공간이 있는 걸까요.', priest: '정말… 휘파람 소리가 들려요.', gunner: '휘파람 소리라…|진짜였군.' };

  // ================================================================ 장애물 (잔해 · 구멍 모두 같은 자리)
  function ensureObs(R) {
    if (R.awObs) return; const p = pos(); R.awObs = true;
    const b = { t: 'prop', c: false, aw: true, x0: p.x - (CX - PX0) * 2, x1: p.x + (PX1 - CX) * 2, y0: p.y - (CY - PY0 - 1) * 2, y1: p.y + (PY1 + 1 - CY) * 2 };
    const q = posL(), b2 = { t: 'prop', c: false, aw: true, x0: q.x - 18, x1: q.x + 18, y0: q.y - 6, y1: q.y + 6 }; // 왼쪽 작은 잔해
    for (const o of [b, b2]) { R.obs.push(o); if (G.obs && G.obs !== R.obs) G.obs.push(o); } R.nav = buildNav(R.obs);
    const P_ = G.player; if (P_) solveObs(P_, P_.r);
  }

  // ================================================================ 바람: 돌 틈 · 구멍에서 왼쪽 위로 흩어지는 짧은 바람결 몇 가닥 — 3초마다 한 번 세게 + 「휘잉-」
  const WIND = []; let gustT = 1.2, lastT = 0, sayT = -9;
  const GAPS = [[[-6, -8], [6, -6], [-12, -2], [10, -12]], [[-4, -4], [8, -2], [-10, 0], [2, -8]], [[-2, -2], [6, 0], [-8, 0], [0, -4]]]; // 단계별 바람이 새는 틈 (구멍 중심 기준 px)
  function windTick(R, dt) {
    const p = pos(), open = R.crevOpen != null, st = Math.min(2, Math.floor((R.crevHits || 0) / 3));
    gustT -= dt; const gust = gustT <= 0; if (gust) { gustT = 3 + Math.random() * 1.2; sayT = time; const Pl = G.player; if (Pl && Math.hypot(Pl.x - p.x, Pl.y - p.y) < 220) sfx('whoosh', open ? 0.3 : 0.2); }
    const n = (Math.random() < dt * (open ? 4 : 2.5) ? 1 : 0) + (gust ? (open ? 3 : 2) : 0);
    for (let i = 0; i < n; i++) { const g = open ? [rand(-10, 10), rand(-10, -2)] : pick(GAPS[st]); WIND.push({ x: p.x + g[0] + rand(-2, 2), y: p.y + g[1] + rand(-2, 2), vx: -rand(30, 50), vy: -rand(26, 40), ph: rand(0, 6), len: randi(2, 4) * 2, t: 0, max: rand(0.6, 0.9) }); }
    for (let i = WIND.length - 1; i >= 0; i--) { const w = WIND[i]; w.t += dt; if (w.t >= w.max) { WIND.splice(i, 1); continue; } w.x += (w.vx + Math.sin(w.t * 5 + w.ph) * 14) * dt; w.y += w.vy * dt; }
  }
  function drawWind() {
    for (const w of WIND) { const k = w.t / w.max; ctx.globalAlpha = k < 0.2 ? 0.35 : k > 0.7 ? 0.35 : 0.6; ctx.fillStyle = '#e6e2ee'; ctx.fillRect(Math.round(w.x) & ~1, Math.round(w.y) & ~1, w.len, 2); }
    ctx.globalAlpha = 1;
  }
  function draw(R) {
    const p = pos(), open = R.crevOpen != null, t = open ? time - R.crevOpen : 0;
    if (open && t > 0.18) { const c = art('gate'), o = org(c, p); ctx.drawImage(c, o.x, o.y);
      const pulse = [0.4, 0.65, 0.9, 0.65][Math.floor(time * 2.5) % 4]; ctx.save(); ctx.globalAlpha = pulse; ctx.fillStyle = '#5aa4ee'; // 룬: 마나빛으로 천천히 맥동
      for (const [rx, ry] of RUNES) ctx.fillRect(o.x + (rx + 4) * 2, o.y + (ry + 4) * 2, 2, 2); ctx.globalAlpha = pulse * 0.35; ctx.fillStyle = '#9ad6ff'; for (const [rx, ry] of RUNES) ctx.fillRect(o.x + (rx + 4) * 2, o.y + (ry + 4) * 2 - 2, 2, 2); ctx.restore(); }
    else { const st = open ? 2 : Math.min(2, Math.floor((R.crevHits || 0) / 3)), c = art('r' + st), o = org(c, p);
      ctx.drawImage(c, o.x, o.y);
      if ((open && t < 0.18) || time - (R.crevHitT || -9) < 0.08) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6; ctx.drawImage(c, o.x, o.y); ctx.restore(); } }
    drawWind();
    if (time - sayT < 1.3) drawBubble('휘잉-', p.x, p.y - (open ? 20 : 34), 0); // 바람이 셀 때 잔해 틈 · 구멍에서
  }

  // ================================================================ 공격 받는 자리 (허수아비처럼 고정 · 보이지 않음)
  function ensureTarget(R) {
    if (R.crevOpen != null || G.enemies.some(e => e.crev && !e.dead)) return;
    const p = pos();
    G.enemies.push({ type: 'dummy', crev: true, x: p.x, y: p.y + 4, hx: p.x, hy: p.y + 4, z: 0, r: 26, hp: 500, maxHp: 500, atk: 0, def: 0, spd: 0, kbRes: 0, vx: 0, vy: 0, face: -1, walk: 0, lean: 0, flash: 0, rise: 0, state: 'idle', t: 0, squash: 0, glow: 0, hitT: 0 });
  }
  function hitCrack(e) {
    const R = on(); if (!R || R.crevOpen != null || time - (R.crevHitT || -9) < 0.15) return; // 한 번 휘두를 때 여러 번 세지 않게
    R.crevHitT = time; R.crevHits = (R.crevHits || 0) + 1; const p = pos(), last = R.crevHits >= HITS, drop = R.crevHits % 3 === 0;
    sfx(last ? 'block' : 'hit', last ? 0.6 : 0.7); addShake(last ? 3 : 1); if (drop && !last) sfx('drop', 0.5); // 한 겹 걷힐 때 돌 구르는 소리
    for (let i = 0; i < (last ? 30 : drop ? 12 : 5); i++) G.parts.push({ x: p.x + rand(-24, 24), y: p.y + rand(-20, 2), vx: rand(-80, 80), vy: rand(-90, -30), t: rand(0.4, 0.8), c: pick(P.slice(1, 5)), g: 260, floor: p.y + rand(-2, 12) });
    if (!last) return;
    e.dead = true; G.enemies = G.enemies.filter(q => q !== e);
    R.crevOpen = time; sfx('drop', 0.8); flashT = Math.max(flashT, 0.06); flashColor = '#d8d4e0'; gustT = 0.5;
  }

  // ================================================================ 기존 함수 감싸기
  { const o = roomEnts; roomEnts = function (list) { o(list); const R = room(); if (!R) return; ensureObs(R);
      const q = posL(); list.push({ y: q.y - 2, d: () => { const c = art('small'); ctx.drawImage(c, (q.x - (LCX + 4) * 2) & ~1, (q.y - (LCY + 4) * 2) & ~1); } });
      if (!on()) { const p = pos(); list.push({ y: p.y - 2, d: () => { const c = art('r0'), g = org(c, p); ctx.drawImage(c, g.x, g.y); } }); return; } // 그냥 잔해 (바람 · 상호작용 없음 · 부서지지 않음)
      const dt = Math.min(0.05, Math.max(0, time - lastT)); lastT = time; windTick(R, dt); ensureTarget(R); list.push({ y: pos().y - 2, d: () => draw(R) }); }; }
  { const o = roomLights; roomLights = function (lights) { o(lights); const R = room(); if (!R) return; const p = pos();
      if (on() && R.crevOpen != null) lights.push({ x: p.x, y: p.y - 12, r: 70, a: 0.6 + 0.08 * Math.sin(time * 2.5), c: '110,170,240', ca: 0.05 }); // 구멍 속 룬의 마나빛
      else lights.push({ x: p.x - 10, y: p.y - 20, r: 70, a: 0.45, c: '215,208,195', ca: 0.03 }); }; } // 잔해 더미가 어둠에 묻히지 않게 아주 옅게
  { const o = drawDummy; drawDummy = function (e) { if (e && e.crev) return; return o.apply(this, arguments); }; }
  { const o = damageEnemy; damageEnemy = function (e) { if (e && e.crev) { if (!e.dead) hitCrack(e); return; } return o.apply(this, arguments); }; }
  { const o = nearInteract; nearInteract = function () { const R = on(), Pl = G.player;
      if (R && Pl && !Pl.dead && !G.trans) { const p = pos(); if (Pl.x > p.x - 64 && Pl.x < p.x + 64 && Pl.y > p.y - 40 && Pl.y < p.y + 36) return { k: 'altarWind', x: p.x, y: Pl.y < p.y - 14 ? p.y + 30 : p.y - 46, t: R.crevOpen != null ? 'F 내려가기' : 'F 살펴보기' }; }
      return o(); }; }
  { const o = doInteract; doInteract = function (it) { if (it && it.k === 'altarWind') { const R = on(); if (!R) return;
      if (R.crevOpen != null) { if (time - R.crevOpen > 0.4) { const p = pos(); RUIN.debugEnter(); if (G.ruinRet) { G.ruinRet.x = p.x - 4; G.ruinRet.y = p.y - (CY - PY0) * 2 - 14; } } } // 올라오면 사다리 앞(구멍 위쪽)에 섬
      else sayPlayer(LINES[G.cls] || LINES.knight, 4); return; }
      return o(it); }; }
  return { on, pos, art };
})();
;

// ==================================================================== 40_road4.js
'use strict';
// ================================================================ v3.20 4장 잿빛 왕도: 재에 덮인 희미한 옛 가도 — 판석 (시안 4장_가도_시안1 B안)
//  · 방에 북 · 남 문이 있으면 세로 가도, 서 · 동 문이 있으면 가로 가도 → 둘 다면 「+」, 하나면 「일자」
//  · 바닥(성채 → 잿빛)을 깐 바로 다음 · 재 더께보다 먼저 그려서, 위에 내려앉는 재가 가도를 군데군데 덮음
//  · 낮은 대비 · 2px 칸 · 디더는 재 경계에만. 보스 방 · 제단 방 · 대장간은 없음
const ROAD4 = (() => {
  const hh = (x, y, s) => FP.hh(x, y, s);
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sm = v => v * v * (3 - 2 * v), a = (i, j) => hh(xi + i, yi + j, s); return (a(0, 0) * (1 - sm(fx)) + a(1, 0) * sm(fx)) * (1 - sm(fy)) + (a(0, 1) * (1 - sm(fx)) + a(1, 1) * sm(fx)) * sm(fy); };
  // 바닥 잿빛보다 한 톤 따뜻하고 살짝 밝은 돌 (튀지 않게 대비를 낮춤)
  const ST = ['#56524a', '#4a463f', '#413e38', '#3a3732', '#322f2b', '#252320'];
  const ASH = ['#5e5952', '#77726a', '#948e84', '#4a4640'];
  const HW = 30; // 가도 반폭(px) — 연석 포함
  function paint(g, R) {
    if (!R || R.type === 'boss' || R.type === 'altar' || (G.dun && G.dun.forge)) return;
    const d = R.doors || {}, vert = d.n != null || d.s != null, hor = d.w != null || d.e != null; if (!vert && !hor) return;
    const sd = (R.seed || 1) * 7 + 3;
    const cx = Math.round(CX / 2) * 2, cy = Math.round(CY / 2) * 2;
    // 칸 하나가 가도 위인지 · 가도 축 기준 좌표 (u: 길 방향, w: 가로 방향, -HW..HW)
    const at = (x, y) => { const r = []; if (vert && Math.abs(x + 1 - cx) <= HW) r.push({ u: y, w: x + 1 - cx, ax: 'v' }); if (hor && Math.abs(y + 1 - cy) <= HW) r.push({ u: x, w: y + 1 - cy, ax: 'h' }); return r; };
    const put = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 2, 2); };
    for (let y = A.y0; y < A.y1; y += 2) for (let x = A.x0; x < A.x1; x += 2) {
      const L = at(x, y); if (!L.length) continue;
      const cross = L.length > 1, q = cross ? (Math.abs(L[0].w) < Math.abs(L[1].w) ? L[1] : L[0]) : L[0]; // 교차로는 안쪽 판정
      const aw = Math.abs(q.w), U = q.u, Wc = q.w;
      // 재에 덮이는 정도: 낮은 주파수 얼룩 + 가장자리일수록 두껍게 + 방 가장자리(벽 밑)일수록 두껍게
      const e = Math.min(x - A.x0, A.x1 - x, (y - A.y0) * 1.3, A.y1 - y), edge = Math.max(0, 1 - e / 60);
      const n = vn(x / 46, y / 30, sd), cover = n * 0.9 + (aw / HW) * 0.25 + edge * 0.6 - 0.18;
      if (cover > 0.62) continue; // 재가 완전히 덮음 → 바닥(재)이 그대로
      let c = null;
      const curb = !cross && aw >= HW - 4; // 연석 (가도 양옆 2칸)
      if (curb) { const blk = Math.floor((U + (q.ax === 'v' ? 0 : 3)) / 14); c = (U % 14) < 2 ? ST[5] : aw >= HW - 2 ? ST[hh(blk, 1, sd) < 0.5 ? 2 : 3] : ST[hh(blk, 2, sd) < 0.5 ? 1 : 2]; }
      else { // 판석: 큰 네모 돌 (가로 세 장) · 금 · 이 빠진 모서리 
        const row = Math.floor((Wc + HW) / 18), lenU = 22, off = row % 2 ? 11 : 0, col = Math.floor((U + off) / lenU), sx = (U + off) % lenU, sy = (Wc + HW) % 18;
        c = sx < 2 || sy < 2 ? ST[5] : ST[1 + Math.floor(hh(col, row, sd + 5) * 3)];
        if (sy === 2 && sx >= 2) c = ST[0]; else if (sx === 2 && sy > 2) c = ST[Math.max(0, ST.indexOf(c) - 1)];
        if (c !== ST[5] && hh(col, row, sd + 9) < 0.3 && Math.abs((sx - 2) - (sy - 2) * 1.2 - 4) < 1.2) c = ST[5]; // 금
      }
      if (cover > 0.46) { if (!dith(x >> 1, y >> 1, (cover - 0.46) / 0.16)) put(x, y, c); continue; } // 재 경계: 디더로 바닥에 스며듦 (위에 재 더께가 다시 내려앉음)
      put(x, y, c);
    }
  }
  return { paint };
})();
;
