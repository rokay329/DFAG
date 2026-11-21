'use strict';
// ================================================================ v3.19 4장 왕도: 불탄 자리(웅덩이 자리) — 무언가 타고 남은 검은 얼룩 · 재 · 남은 불씨 · 탄 들보 (바닥은 꺼지지 않음 · 걸어서 못 지나감 · 투사체와 구르기는 통과) — FP(11_altar_forge.js)의 도트 도우미를 씀
const TOWN4 = (() => {
  const { Spr, render, hh } = FP;
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sm = v => v * v * (3 - 2 * v), a = (i, j) => hh(xi + i, yi + j, s); return (a(0, 0) * (1 - sm(fx)) + a(1, 0) * sm(fx)) * (1 - sm(fy)) + (a(0, 1) * (1 - sm(fx)) + a(1, 1) * sm(fx)) * sm(fy); };
  function scorch(wPx, hPx, seed = 1) { const W = Math.round(wPx / 2), T = Math.round(hPx / 2), S = Spr(W, T, 8);
    const CH = ['#3e3632', '#2e2622', '#221a18', '#161010', '#0c0808'], AS = ['#a6a096', '#88827a', '#6a655e', '#4e4a46'], EM = ['#ffe08a', '#ffa040', '#e8601c', '#a83410', '#5e1c0c'];
    const small = W < 34 || T < 22, R = Math.min(10, T / 3), ed = (x, y) => { const ax = Math.min(x, W - 1 - x), ay = Math.min(y, T - 1 - y); return ax < R && ay < R ? R - Math.hypot(R - ax, R - ay) : Math.min(ax, ay); }, dd = (x, y) => ed(x, y) + (vn(x / 6, y / 4, seed + 1) - 0.5) * 7 + (vn(x / 2.5, y / 2, seed + 2) - 0.5) * 2.5, inn = (x, y) => dd(x, y) > 1.6;
    // 그을린 바닥: 가운데로 갈수록 검게 · 가장자리는 불규칙하게 번지고 바닥이 비침
    for (let y = -5; y < T + 5; y++) for (let x = -5; x < W + 5; x++) { const d = dd(x, y);
      if (d > 4) { const n = vn(x / 7, y / 4.5, seed + 3); S.set(x, y, CH[n > 0.75 ? 1 : n > 0.45 ? 2 : n > 0.2 ? 3 : 4]); }
      else if (d > 1.6) S.set(x, y, d > 2.8 || ((x + y) & 1) ? CH[2] : CH[1]);
      else if (d > 0.2) S.SH.set(x + ',' + y, 0.6); else if (d > -1.6 && ((x + y) & 1)) S.SH.set(x + ',' + y, 0.5); else if (d > -3.4 && (x & 1) && (y & 1)) S.SH.set(x + ',' + y, 0.4); }
    const on = (x, y) => S.has(x, y) && dd(x, y) > 4;
    // 재 무더기 (낮은 대비 · 왼쪽 위만 밝게)
    for (let y = 2; y < T - 2; y++) for (let x = 2; x < W - 2; x++) { if (!on(x, y)) continue; const f = (u, v) => vn(u / 8, v / 4, seed + 11), a = f(x, y); if (a > 0.76) S.set(x, y, a > 0.84 ? (f(x - 1, y - 1) < a ? AS[1] : AS[2]) : AS[3]); if (a > 0.9 && f(x - 2, y - 1) < a - 0.02) S.set(x, y, AS[0]); }
    // 남은 불씨: 드문 낱알 + 뜨거운 무더기 몇 곳 (둘레는 검붉게)
    for (let i = 0; i < Math.round(W * T / 300); i++) { const x = 4 + Math.floor(hh(i, 20, seed) * (W - 8)), y = 4 + Math.floor(hh(i, 21, seed) * (T - 8)); if (!on(x, y)) continue; S.set(x, y, hh(i, 22, seed) < 0.3 ? EM[1] : EM[2]); if (on(x, y + 1)) S.set(x, y + 1, EM[4]); if (hh(i, 23, seed) < 0.4 && on(x + 1, y)) S.set(x + 1, y, EM[3]); }
    const hot = []; for (let i = 0; i < (small ? 1 : 2 + (W > 70 ? 1 : 0) + (W > 120 ? 1 : 0)); i++) { const cx = Math.round(8 + ((i + hh(i, 24, seed)) / (small ? 1 : 2 + (W > 70) + (W > 120))) * (W - 16)), cy = Math.round(6 + hh(i, 25, seed) * Math.max(1, T - 12)); hot.push([cx, cy]); for (let dy = -3; dy <= 3; dy++) for (let dx = -5; dx <= 5; dx++) { const q = (dx / 5) ** 2 + (dy / 3) ** 2 + (hh(cx + dx, cy + dy, seed) - 0.5) * 0.6; if (q > 1 || !on(cx + dx, cy + dy)) continue; S.set(cx + dx, cy + dy, q < 0.1 ? EM[0] : q < 0.28 ? EM[1] : q < 0.5 ? EM[2] : q < 0.75 ? EM[3] : EM[4]); } }
    // 탄 들보 (굵게 · 각각 외곽선 · 윗면 재 · 아랫선이 벌겋게) + 타다 남은 기둥 밑동
    S.OV = []; const beam = (bx, by, len, sl) => { const m = new Map(), th = 4; for (let i = 0; i < len; i++) { const x = bx + i, y = by + Math.round(i * sl); if (x < 2 || x > W - 3 || y < 1 || y + th > T - 1) continue; for (let k = 0; k < th; k++) m.set(x + ',' + (y + k), k === 0 ? (hh(x >> 1, 30, seed + bx) < 0.45 ? AS[2] : CH[0]) : k === 1 ? CH[1] : k === 2 ? (i % 7 === 3 ? CH[4] : CH[3]) : (hh(x >> 1, 31, seed + bx) < 0.3 ? EM[3] : CH[4])); } if (m.size) S.OV.push(m); };
    const post = (px, py, h) => { if (!on(px + 1, py)) return; const m = new Map(); for (let y = py - h; y <= py; y++) for (let x = px; x < px + 4; x++) m.set(x + ',' + y, y === py - h ? (x === px + 1 || x === px + 2 ? EM[2] : CH[1]) : x === px ? CH[0] : x === px + 3 ? CH[4] : CH[2]); S.OV.push(m); };
    if (small) beam(4, Math.round(T * 0.45), W - 8, 0.15);
    else { const n = Math.max(1, Math.min(3, Math.round(W / 40)));
      for (let i = 0; i < n; i++) { const len = Math.round(14 + hh(i, 32, seed) * Math.min(16, W * 0.25)), sl = (hh(i, 33, seed) < 0.5 ? 1 : -1) * (0.2 + hh(i, 36, seed) * 0.35), rise = Math.round(Math.abs(sl) * len), bx = Math.round(5 + ((i + hh(i, 31, seed) * 0.6) / n) * (W - len - 10)), y0 = 3 + Math.floor(hh(i, 34, seed) * Math.max(1, T - 10 - rise)); beam(bx, sl > 0 ? y0 : y0 + rise, len, sl); }
      post(Math.round(6 + hh(1, 35, seed) * 6), Math.round(T * 0.6), 5); if (W > 50) post(W - 11 - Math.round(hh(2, 35, seed) * 6), Math.round(T * 0.45 + hh(3, 35, seed) * T * 0.25), 4); }
    const c = render(S, false); c.pad = 8; c.hot = hot.map(([x, y]) => [x + 8, y + 8]); return c; } // hot: 잔불 자리 (그림 칸 좌표 · 06의 pitFx가 깜빡임을 얹음)
  return { scorch };
})();
