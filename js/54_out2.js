'use strict';
// 잿빛 왕관 원정대 — 54_out2.js : v3.26 시안02 — 2장 벽 바깥 (좌 · 우 · 아래)
// 컨셉: 「무너진 성채」 — 방을 두른 판석 턱 너머로 성채 바닥이 무너져 내린 낭떠러지.
//  · 판석 턱(좌 · 우 · 아래): 간격이 넓은 큰 판석 (벽돌 아님) · 왼쪽 위 빛 · 군데군데 떨어져 나간 모서리
//  · 아래 턱은 앞면이 보이고 밑동이 부서져 낭떠러지로 · 쇠사슬이 매달림
//  · 낭떠러지: 깊어질수록 어둡게(디더) · 찬 안개 띠 (아래층 실루엣 없음)
//  · 떨어져 나간 바닥 조각이 일정 간격으로 반복 — 조각마다 기둥 하나(#090) / 부러진 기둥 하나(#110) / 바닥만 · 어둡고 희미하게
//  · 좌 · 우 · 아래 문: 문틀(게이트) 없음 — 문 자리 턱은 판석 문턱, 밖은 돌다리. 문이 닫히면 다리가 어둠에 잠기고 열리면 디더로 떠오름
//  · 좌 · 우 문 횃불은 4장처럼 맵 안쪽, 문턱 양 끝에 섬 (v3.28)
const OUT2 = (() => {
  const hh = (x, y, s) => FP.hh(x, y, s);
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sm = v => v * v * (3 - 2 * v), a = (i, j) => hh(xi + i, yi + j, s); return (a(0, 0) * (1 - sm(fx)) + a(1, 0) * sm(fx)) * (1 - sm(fy)) + (a(0, 1) * (1 - sm(fx)) + a(1, 1) * sm(fx)) * sm(fy); };
  const ST = ['#8e889a', '#7a7488', '#5e5868', '#423d4c', '#2d2935', '#1c1922', '#131117']; // 2장 돌기둥과 같은 돌빛 (밝 → 어둠)
  const CH = ['#0f0d14', '#0b0a0f', '#08070b', '#050407']; // 낭떠러지 (얕음 → 깊음)
  const FT = ['#3a3842', '#2c2a32', '#24222a', '#1a181f']; // 방 바닥 판석 결 (문턱 · 다리)
  const FD = ['#25232b', '#1d1b22', '#18161c', '#110f15']; // 떨어져 나간 조각 (어둡게 · 희미하게)
  const MIST = '#2e3040', MIST2 = '#1f202b'; // 찬 안개
  const RW = 28, FC = 18, BR = 22; // 판석 턱 두께 · 아래 턱 앞면 · 다리 반폭
  let ON = true;
  const on2 = R => ON && G && G.stage === 2 && R && !['forge', 'home', 'archive', 'lab', 'den', 'ruin', 'boss', 'altar'].includes(R.type) && !(G.dun && G.dun.forge);
  const geo = () => ({ L: A.x0, RR: A.x1, T: A.y0, B: A.y1, BY: CY + 2, SX: DOOR.s.x, top0: A.y0 - 100 });

  function paint(g, R) {
    const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x & ~1, y & ~1, 2, 2); };
    const sd = ((R.seed || 1) * 13 + 7) | 0, { L, RR, T, B, BY, SX, top0 } = geo();
    const D = R.doors || {}, dW = D.w != null && !hiddenDoor(R, 'w'), dE = D.e != null && !hiddenDoor(R, 'e'), dS = D.s != null && !hiddenDoor(R, 's');
    const inRoom = (x, y) => x >= L && x < RR && y < B;
    const gapW = (x, y) => dW && x < L && x >= L - RW && Math.abs(y - BY) < BR, gapE = (x, y) => dE && x >= RR && x < RR + RW && Math.abs(y - BY) < BR, gapS = (x, y) => dS && y >= B && y < B + RW + FC && Math.abs(x - SX) < BR;
    const gap = (x, y) => gapW(x, y) || gapE(x, y) || gapS(x, y);
    const rimZ = (x, y) => y >= top0 && x >= L - RW && x < RR + RW && y < B + RW && !inRoom(x, y) && !gap(x, y);
    const faceZ = (x, y) => x >= L - RW && x < RR + RW && y >= B + RW && y < B + RW + FC && !gap(x, y);
    // 1) 낭떠러지: 턱에서 멀수록 깊게(디더) · 찬 안개 띠
    const depth = (x, y) => Math.max(x < L - RW ? (L - RW) - x : x >= RR + RW ? x - (RR + RW) : 0, y >= B + RW + FC ? y - (B + RW + FC) : 0);
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      if (inRoom(x, y) || rimZ(x, y) || faceZ(x, y) || gap(x, y) || (y < top0 + 100 && x >= L && x < RR)) continue;
      const d = depth(x, y), bx = x >> 1, by = y >> 1, lv = Math.min(1, d / 170);
      let c = dith(bx, by, lv) ? (dith(bx + 1, by, lv - 0.4) ? CH[3] : CH[2]) : (dith(bx, by + 1, 0.55 - lv) ? CH[0] : CH[1]);
      if (d < 70 && dith(bx + 1, by + 2, (1 - d / 70) * 0.55)) c = d < 30 ? '#1c1a24' : '#15131b'; // 벼랑에 붙은 찬 안개 (가장자리가 잘린 그림처럼 보이지 않게)
      const m = vn(x / 60, y / 12, sd + 5) + vn(x / 18, y / 8, sd + 6) * 0.35; if (m > 0.95 && dith(bx + 2, by + 1, (m - 0.95) * 2)) c = m > 1.12 ? MIST : MIST2;
      px(x, y, c);
    }
    const slab = (x, y, ox, oy, sw, sh, pal) => { const u = x - ox, v = y - oy, row = Math.floor(v / sh), off = (row % 2) * (sw >> 1), col = Math.floor((u + off) / sw), sx = (u + off) - col * sw, sy = v - row * sh, k = hh(col, row, sd + 4);
      if (sx === 0 || sy === sh - 2) return pal[3]; if (sy === 0 || sx === 2) return pal[0]; if (hh(x >> 1, y >> 1, sd + 17) < 0.02) return pal[2]; return k < 0.3 ? pal[2] : pal[1]; };
    // 3) 판석 턱 (좌 · 우 · 아래): 큰 판석 한 장이 턱 폭 전체를 덮음 — 판석마다 빛 받는 모서리(위 · 왼쪽) · 그늘 모서리(아래 · 오른쪽) · 낡은 얼룩 · 잔금 · 모서리 이 빠짐
    //    바깥 끝은 한 단 높은 갓돌(밝은 윗선 + 어두운 아랫면)로 마감 · 갓돌 아래로 벼랑 바위 밑면이 들쭉날쭉 이어지다 어둠에 묻힘 · 위쪽 끝은 디더로 사라짐
    const SL = 44; // 판석 길이
    const rimC = (x, y) => { const side = x < L || x >= RR, corner = side && y >= B, u = side ? y - top0 : x - (L - RW), v = corner ? Math.max(x < L ? L - x : x - RR + 2, y - B + 2) : side ? (x < L ? L - x : x - RR + 2) : y - B + 2; // u: 턱을 따라 · v: 방에서 바깥으로 · v3.28 아래 모서리는 좌우 · 아래 턱이 ㄴ자로 이어짐 (갓돌이 모서리를 돌아감)
      const k = corner ? (x < L ? -1 : -2) : Math.floor(u / SL), su = corner ? SL >> 1 : u - k * SL, id = hh(k, side ? (x < L ? 1 : 2) : 3, sd), tone = id < 0.25 ? 1 : id < 0.75 ? 0 : -1;
      const B0 = [ST[3], ST[2], ST[4]], base = tone > 0 ? ST[2] : tone < 0 ? ST[4] : ST[3];
      if (v <= 2) return ST[5]; // 방 쪽 턱 그늘
      if (v >= RW - 6) return v >= RW - 2 ? ST[6] : v >= RW - 4 ? ST[4] : ST[1]; // 갓돌: 밝은 윗선 → 앞면 → 아랫면
      if (su < 2) return ST[6]; // 판석 사이 줄눈
      if (su < 4 || v <= 4) return tone < 0 ? ST[3] : ST[2]; // 빛 받는 모서리
      if (su >= SL - 2) return ST[5]; // 그늘 모서리
      const n = vn(x / 18, y / 18, sd + 13 + k), m = vn(x / 5, y / 5, sd + 19);
      if ((su === 4 || su === SL - 4) && (v === 6 || v === RW - 8) && hh(k, v, sd) < 0.5) return ST[5]; // 모서리 이 빠짐
      const crack = Math.abs((su - 10 - id * 20) - (v - 6) * 0.8) < 1 && id > 0.55 && v > 6 && v < RW - 8; if (crack) return ST[5]; // 잔금
      if (n > 0.66 && dith(x >> 1, y >> 1, (n - 0.66) * 2.4)) return tone < 0 ? ST[5] : ST[4]; // 낡은 얼룩
      if (m > 0.86) return tone > 0 ? ST[1] : ST[2]; // 닳아 반들거리는 자리
      if (hh(x >> 1, y >> 1, sd + 23) < 0.012) return '#4a5a3a'; // 얼룩 이끼
      return base; };
    for (let y = top0 & ~1; y < B + RW + FC + 2; y += 2) for (let x = (L - RW) & ~1; x < RR + RW; x += 2) {
      if (rimZ(x, y)) { if (y < top0 + 30 && dith(x >> 1, y >> 1, (top0 + 30 - y) / 30)) { px(x, y, CH[1]); continue; } px(x, y, rimC(x, y)); }
      else if (faceZ(x, y)) { const v = y - (B + RW), k = Math.floor((x - (L - RW)) / SL), su = (x - (L - RW)) - k * SL; let c = v < 2 ? ST[2] : su < 2 ? ST[6] : su < 4 ? ST[3] : v < 6 ? ST[4] : ST[5]; if (v > FC - 8 && dith(x >> 1, y >> 1, (v - (FC - 8)) / 8)) c = ST[6]; px(x, y, c); }
      else if (gap(x, y)) { const c = bridgePix(gapS(x, y), x, y); px(x, y, c || ST[5]); } } // 문턱: 다리(판석 바닥 · 난간)가 벽 안까지 이어짐
    // 갓돌 아래 벼랑 바위 밑면 (좌 · 우): 들쭉날쭉한 바위가 몇 칸 이어지다 디더로 어둠에 묻힘
    for (let y = (top0 + 30) & ~1; y < B + RW; y += 2) for (const sideX of [-1, 1]) { const ln = 6 + Math.round(vn(y / 9, sideX, sd + 31) * 8) * 2;
      for (let i = 0; i < ln; i += 2) { const x = sideX < 0 ? L - RW - 2 - i : RR + RW + i; if (gap(x + (sideX < 0 ? 2 : -2) * 0, y) || (sideX < 0 ? dW : dE) && Math.abs(y - BY) < BR + 10) continue;
        if (dith(x >> 1, y >> 1, i / ln * 0.9)) continue; px(x, y, i < 4 ? ST[5] : ST[6]); } }
    // 다리 마감: 방 쪽 문턱돌(밝은 턱) · 난간 끝마다 머릿돌 · 다리 옆 판석과 맞닿는 줄눈
    const cap = (x, y) => { for (let j = 0; j < 8; j += 2) for (let i = 0; i < 6; i += 2) px(x + i, y + j, j === 0 ? ST[1] : i === 4 ? ST[4] : j === 6 ? ST[5] : ST[2]); };
    if (dW || dE) for (const [on, xi, xo] of [[dW, L - 4, L - RW], [dE, RR, RR + RW - 6]]) { if (!on) continue;
      for (let y = BY - BR + 4; y < BY + BR - 6; y += 2) { px(xi, y, FT[0]); px(xi + 2, y, ST[2]); } // 문턱돌
      for (const yy of [BY - BR, BY + BR - 8]) { cap(xi === L - 4 ? L - 6 : RR, yy); cap(xo, yy); }
    }
    if (dW) for (let x = L - RW; x < L; x += 2) { px(x, BY - BR - 2, ST[6]); px(x, BY + BR, ST[6]); }
    if (dE) for (let x = RR; x < RR + RW; x += 2) { px(x, BY - BR - 2, ST[6]); px(x, BY + BR, ST[6]); }
    if (dS) { for (let x = SX - BR + 4; x < SX + BR - 4; x += 2) { px(x, B, FT[0]); px(x, B + 2, ST[2]); }
      for (const xx of [SX - BR, SX + BR - 6]) { cap(xx, B); cap(xx, B + RW + FC - 8); }
      for (let y = B; y < B + RW + FC; y += 2) { px(SX - BR - 2, y, ST[6]); px(SX + BR, y, ST[6]); } }
    // 4) 아래 턱에 매달린 쇠사슬
    const chain = (x, y0, len) => { for (let y = y0; y < y0 + len; y += 2) { const ring = ((y - y0) >> 1) % 3; px(x, y, ring === 0 ? ST[2] : ring === 1 ? ST[3] : ST[5]); if (ring === 1) { px(x - 2, y, ST[4]); px(x + 2, y, ST[5]); } } px(x - 2, y0 + len, ST[3]); px(x, y0 + len + 2, ST[3]); px(x + 2, y0 + len, ST[4]); };
    for (let i = 0; i < 7; i++) { const x = (L + (i + 0.3 + hh(i, 4, sd) * 0.4) * (RR - L) / 7) & ~1; if (dS && Math.abs(x - SX) < BR + 24) continue; if (hh(i, 5, sd) < 0.6) chain(x, B + RW + 4, 14 + Math.floor(hh(i, 6, sd) * 22) * 2); }
    // 5) 북문만 다시 (좌 · 우 · 아래 문틀은 없앰)
    if (D.n != null && !hiddenDoor(R, 'n') && !(R.sealW && R.sealW.dir === 'n')) paintDoorCastle(g, 'n');
    R._out2 = { bridges: [dW && bridge('w', R), dE && bridge('e', R), dS && bridge('s', R)].filter(Boolean), k: {} };
  }
  // 다리 한 칸의 색 (문턱 안 · 밖 공통): vert = 남쪽 다리
  function bridgePix(vert, X, Y) { const { BY, SX } = geo(), wv = vert ? X - SX : Y - BY, aw = Math.abs(wv), u = vert ? Y : X;
    if (!vert && wv >= BR) return null; if (vert && aw >= BR + 1) return null;
    let c;
    if (vert) c = aw >= BR - 4 ? (aw >= BR - 2 ? ST[5] : (wv < 0 ? ST[2] : ST[4])) : ((u >> 1) % 7 === 0 ? FT[3] : (u >> 1) % 7 === 1 ? FT[0] : FT[1]);
    else c = wv <= -(BR - 4) ? (wv <= -(BR - 2) ? ST[2] : ST[3]) : wv >= BR - 6 ? (wv >= BR - 2 ? ST[6] : ST[4]) : ((u >> 1) % 7 === 0 ? FT[3] : (u >> 1) % 7 === 1 ? FT[0] : FT[1]);
    if (((u - 6) >> 1) % 14 === 0 && aw >= BR - 4 && aw < BR) c = ST[1]; // 난간 기둥
    return c; }
  // 다리: 문 밖 낭떠러지를 건너는 돌다리 — 판석 바닥 · 양옆 난간 · 난간 기둥 · 밑 그늘 · 멀어지며 디더로 사라짐. 열림 정도(4단계 디더)별로 미리 그림
  function bridge(d, R) {
    const { L, RR, B, BY, SX } = geo(), LEN = 190, vert = d === 's';
    const x0 = d === 'w' ? L - RW - LEN : d === 'e' ? RR + RW : SX - BR - 2, y0 = vert ? B + RW + FC : BY - BR, w = vert ? BR * 2 + 4 : LEN, h = vert ? LEN : BR * 2 + 12;
    const base = document.createElement('canvas'); base.width = w; base.height = h; const g = base.getContext('2d'), px = (x, y, c) => { g.fillStyle = c; g.fillRect(x & ~1, y & ~1, 2, 2); };
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const X = x0 + x, Y = y0 + y, far = vert ? y : d === 'w' ? w - x : x; if (far > 30 && dith(X >> 1, Y >> 1, Math.min(1, (far - 30) / 150))) continue; // 멀어지며 어둠에 묻힘
      const wv = vert ? X - SX : Y - BY;
      if (!vert && wv >= BR) { if (wv < BR + 10 && dith(X >> 1, Y >> 1, 0.55)) px(x, y, CH[3]); continue; } // 다리 밑 그늘 (디더)
      const c = bridgePix(vert, X, Y); if (!c) continue;
      px(x, y, c);
    }
    const lv = [0.25, 0.5, 0.75].map(t => { const c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d'); for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (dith((x0 + x) >> 1, (y0 + y) >> 1, t)) q.drawImage(base, x, y, 2, 2, x, y, 2, 2); return c; });
    return { d, x: x0, y: y0, lv: [...lv, base] };
  }
  { const o = paintRoomFloor; paintRoomFloor = function (R) { const r = o.apply(this, arguments); if (on2(R)) withSeed((R.seed || 1) + 991, () => paint(fg, R)); return r; }; }
  // 다리: 문이 열려 있으면 떠오르고(디더 4단계) 닫히면 어둠에 잠김
  let lastT = 0;
  { const o = roomEnts; roomEnts = function (list) { o(list); const R = G && G.dun && G.dun.cur, dt = Math.min(0.05, Math.max(0, time - lastT)); lastT = time; if (!on2(R) || !R._out2) return;
      for (const b of R._out2.bridges) { const open = doorState(R, b.d) === 'open', k0 = R._out2.k[b.d] != null ? R._out2.k[b.d] : open ? 1 : 0, k = Math.max(0, Math.min(1, k0 + (open ? 1 : -1) * dt * 1.6)); R._out2.k[b.d] = k;
        const i = Math.ceil(k * 4) - 1; if (i < 0) continue; list.push({ y: -1e9, d: () => ctx.drawImage(b.lv[i], b.x, b.y) }); } }; }
  // 좌 · 우 문의 나무 문짝(여닫힘)은 없앰 — 닫힘은 다리가 어둠에 잠기는 것으로 보여 줌
  { const o = drawSideLeaves; drawSideLeaves = function (d, k) { if (on2(G && G.dun && G.dun.cur)) return; return o.apply(this, arguments); }; }
  // 북문: 아치 안쪽 모양에 맞춘 내리닫이 쇠창살 (4장 북문과 같은 방식 · 장식 없이 철문만)
  let GN = null;
  function gateN2Init() { const W0 = 27, H0 = 36, cx = 13, top = 12, path = new Path2D(); let c0 = 99, c1 = -1, r0 = 99, r1 = -1;
    for (let y = 0; y < H0 - 1; y++) { let a = -1, b = -1; for (let x = 0; x < W0; x++) { const inner = y >= top ? x >= 4 && x <= 22 : Math.hypot(x - cx, y - top) <= 9.4; if (inner) { if (a < 0) a = x; b = x; } } if (a >= 0) { path.rect(a * 2, y * 2, (b - a + 1) * 2, 2); c0 = Math.min(c0, a); c1 = Math.max(c1, b); r0 = Math.min(r0, y); r1 = Math.max(r1, y); } }
    const Wc = c1 - c0 + 1, Hc = r1 - r0 + 1, c = document.createElement('canvas'); c.width = Wc * 2; c.height = Hc * 2; const g = c.getContext('2d'), P = { i: '#8e8a98', I: '#5c5866', J: '#2c2934', K: '#0b0a0e' }, px = (x, y, k) => { g.fillStyle = P[k]; g.fillRect(x * 2, y * 2, 2, 2); };
    for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) { const m = x % 3, band = y === 3 || y === Math.round(Hc * 0.5) || y === Hc - 6;
      if (y >= Hc - 2) { if (m === 1) px(x, y, y === Hc - 1 ? 'J' : 'I'); continue; } // 아래 창끝
      if (band) px(x, y, m === 1 ? 'i' : 'I'); else if (y === 4 || y === Math.round(Hc * 0.5) + 1 || y === Hc - 5) px(x, y, 'J'); else if (m === 1) px(x, y, 'i'); else if (m === 2) px(x, y, 'J'); }
    GN = { c, path, c0, r0, Hc }; }
  function gateN2(k) { if (!GN) gateN2Init(); if (k <= 0) return; const p = DOOR.n, ax = p.x - 27, ay = p.y - 70, off = Math.round(GN.Hc * (1 - k)) * 2;
    ctx.save(); ctx.translate(ax, ay); ctx.clip(GN.path); ctx.drawImage(GN.c, GN.c0 * 2, GN.r0 * 2 - off); ctx.restore(); }
  // 남쪽 문 쇠창살도 없앰 — 닫힘은 다리가 어둠에 잠기는 것으로만
  { const o = drawSeal; drawSeal = function (d, k) { if (on2(G && G.dun && G.dun.cur)) { if (d === 's') return; if (d === 'n') return gateN2(k); } return o.apply(this, arguments); }; }
  // 좌 · 우 문 횃불: v3.28 4장처럼 맵 안쪽으로 (판석 턱 가운데 → 턱 안쪽 바닥) · 문턱 양 끝에 섬
  { const o = gateParts; gateParts = function (d) { const r = o.apply(this, arguments); const R = G && G.dun && G.dun.cur; if (!on2(R) || (d !== 'w' && d !== 'e')) return r;
      const dx = d === 'w' ? 14 : -14, { BY } = geo(), ys = [BY - BR + 2, BY + BR + 20];
      r.parts.forEach((q, i) => { const ny = ys[i] != null ? ys[i] : q.sy, dy = ny - q.sy; q.x = (q.x + dx) & ~1; q.y = (q.y + dy) & ~1; q.sy = ny; if (r.flames[i]) { r.flames[i].x += dx; r.flames[i].y += dy; } });
      return r; }; }
  // 낭떠러지 아래에서 올라오는 옅은 찬 빛 (아주 약하게)
  { const o = roomLights; roomLights = function (lights) { o(lights); const R = G && G.dun && G.dun.cur; if (!on2(R)) return;
      const sd = ((R.seed || 1) * 13 + 7) | 0, { L, RR, B, T } = geo(), P = [];
      for (let y = T + 30; y < B + 60; y += 120) { P.push([L - 90, y]); P.push([RR + 90, y]); }
      for (let x = L + 40; x < RR; x += 140) P.push([x, B + 100]);
      for (const [i, [x, y]] of P.entries()) lights.push({ x: x + (hh(i, 1, sd) - 0.5) * 30, y: y + (hh(i, 2, sd) - 0.5) * 20, r: 80, a: 0.3 + 0.05 * Math.sin(time * 0.7 + i), c: '120,140,190', ca: 0.05 }); }; }
  // v3.28 아래 판석 턱은 캐릭터 · 적 · 시체와 남쪽 문 횃대를 가림: 턱 윗선(A.y1)부터 아래로는 그리지 않음 (남쪽 문 틈은 열어 둠) — 4장과 같은 처리
  const BLINE = () => A.y1;
  { const o = sideClip; sideClip = function (fn) { const R = G && G.dun && G.dun.cur; if (!on2(R)) return o(fn);
      return o(() => { ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - 200, A.y0 - 600, A.x1 - A.x0 + 400, BLINE() - (A.y0 - 600));
        if (R.doors && R.doors.s != null && !hiddenDoor(R, 's')) { const { SX } = geo(); ctx.rect(SX - BR, BLINE(), BR * 2, 200); }
        ctx.clip(); try { return fn(); } finally { ctx.restore(); } }); }; }
  const CUT = new Map(); // 남쪽 문 횃대: 턱 윗선 아래는 잘라 낸 그림 (턱 뒤에 선 모습)
  { const o = gateParts; gateParts = function (d) { const r = o.apply(this, arguments); const R = G && G.dun && G.dun.cur; if (d !== 's' || !on2(R)) return r;
      const DN = 6; r.parts.forEach(q => { q.y += DN; q.sy += DN; }); r.flames.forEach(f => { f.y += DN; }); // v3.28 남쪽 문 횃대를 3칸 아래로
      r.parts = r.parts.map(q => { const h = Math.max(0, BLINE() - q.y) & ~1; if (h >= q.c.height) return q; const k = q.c.width + 'x' + q.c.height + ':' + h; let c = CUT.get(k);
        if (!c || c.src !== q.c) { const [cc, g] = mkCanvas(q.c.width, Math.max(2, h)); g.drawImage(q.c, 0, 0); cc.src = q.c; CUT.set(k, cc); c = cc; } return Object.assign({}, q, { c }); });
      return r; }; }
  // v3.28 윗벽 기둥 받침: 바닥을 다 칠한 뒤 기둥 밑동에 받침돌을 얹어 바닥을 침범하게 · 둘레와 맨 아래는 외곽선 (4장 기둥과 같은 처리)
  { const o = paintRoomFloor; paintRoomFloor = function (R) { const r = o.apply(this, arguments);
      if (G && G.stage === 2 && G.dun && !G.dun.forge && R && !['forge', 'home', 'archive', 'lab', 'den', 'ruin'].includes(R.type) && PILLARS.length) {
        const K = '#08070b', TOP = '#4a4656', HI = '#3a3644', MD = '#2b2733', DK = '#1d1a23', SH = '#0c0b10', P = (x, y, c) => { fg.fillStyle = c; fg.fillRect(x, y, 2, 2); };
        const floorY = cx => { const d = fg.getImageData(cx + 18, A.y0, 1, 16).data; for (let k = 0; k < 16; k += 2) if (d[k * 4] <= 11 && d[k * 4 + 1] <= 11) return A.y0 + k + 2; return A.y0 + 8; }; // 벽 밑동 맨 아래 검은 줄 바로 다음 칸 = 바닥 첫 칸 (방마다 2px 차이)
        const FLY = (() => { const n = {}; for (let x = A.x0 + 24; x < A.x1 - 24; x += 26) { if (PILLARS.some(p => Math.abs(x + 18 - p) < 16)) continue; const v = floorY(x); n[v] = (n[v] || 0) + 1; } let b = A.y0 + 8, m = 0; for (const k in n) if (n[k] > m) { m = n[k]; b = +k; } return b; })(); // v3.28 방 전체에서 가장 많이 나온 바닥 첫 줄 하나로 모든 기둥을 맞춤 (기둥마다 재면 바닥 자국에 따라 길이가 달라졌음)
        for (const px0 of PILLARS) { const cx = px0 & ~1, x0 = cx - 14, rows = (FLY >> 1) + 1; // v3.29 기둥 전체를 새 성채 석주로 (주두 · 마름돌 · 받침) — 맨 아래 외곽선은 바닥 첫 칸(FLY)
          gPaint(fg, PILLARGEN.gen2(rows, (px0 * 7) % 97), PILLARGEN.PAL2, x0, 0);
          for (let x = x0 + 4; x < x0 + 28; x += 4) P(x, FLY + 2, K); } } // 받침 밑 디더 그림자 한 줄
      return r; }; }
  return { paint, wide: () => on2(G && G.dun && G.dun.cur), set on(v) { ON = v; }, get on() { return ON; } };
})();
