'use strict';
// 잿빛 왕관 원정대 · stage_maps.js — 합친 파일: 29_ruin1.js, 30_keep2.js, 31_camp3.js, 32_town4.js, 33_well2.js, 34_px1.js (v3.84 파일 정리 · typeof로 먼저 확인하는 이름 몇 개는 var로 선언)

// ==================================================================== 29_ruin1.js
// ================================================================ v3.19 1장 숲의 폐허: 이끼 낀 돌담 · 한 면이 무너져 열린 폐허 · 떨어져 나온 돌 · 둥근 나무 (2px 칸 · 왼쪽 위 빛 · 붙은 그림자 · 외곽선) — FP(11_altar_forge.js)의 도트 도우미를 씀
const RUIN1 = (() => {
  const { Spr, render, shadow, hh, bay } = FP, K = '#0b0a0e';
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sm = v => v * v * (3 - 2 * v), a = (i, j) => hh(xi + i, yi + j, s); return (a(0, 0) * (1 - sm(fx)) + a(1, 0) * sm(fx)) * (1 - sm(fy)) + (a(0, 1) * (1 - sm(fx)) + a(1, 1) * sm(fx)) * sm(fy); };
  // 둥근 덩이 하나 (잎 · 바위 공용): 왼쪽 위 빛, 가장자리는 들쭉날쭉
  function blob(S, cx, cy, rx, ry, pal, seed, opt = {}) { for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx), rr = 1 + (opt.bump || 0.12) * (vn(a * 2.2 + seed, 0, seed) - 0.5) * 2, dx = (x + 0.5 - cx) / (rx * rr), dy = (y + 0.5 - cy) / (ry * rr), d2 = dx * dx + dy * dy; if (d2 > 1) continue;
      const nz = Math.sqrt(1 - d2), b = -0.5 * dx - 0.62 * dy + 0.6 * nz; let k = Math.floor((0.95 - b) * (pal.length - 0.6) * 0.8 + (opt.shift ?? 1.3) + (opt.noDither ? 0 : bay(x, y) - 0.5) * 0.9); if (opt.clump && vn(x / 2.4, y / 2.4, seed + 7) > 0.66) k--; k = Math.max(0, Math.min(pal.length - 1, k)); S.set(x, y, pal[k]); } }
  const LEAF = ['#5e8e3a', '#46722e', '#345a24', '#26461c', '#1a3414', '#10240e'];
  // ---------------------------------------------------------------- 1장 둥근 나무: 잎 뭉치 다섯 (보라 · 위 밝음) · 줄기 결 · 뿌리 퍼짐
  function tree(seed = 5, pal, kind = 'dusk') { const S = Spr(31, 40); const PU = pal || ['#8270bc', '#62529c', '#4a3e80', '#362c66', '#26204c', '#181436'];
    const B = ['#8a6844', '#6a4c30', '#523822', '#3c2818', '#2a1a10'];
    // 줄기: 아래로 갈수록 굵어짐 · 왼쪽 밝은 선 · 오른쪽 그늘 · 끊어진 세로 결 · 옹이 · 잎 밑 그늘
    for (let y = 20; y < 38; y++) { const hw = y > 34 ? 3 : y > 26 ? 2.5 : 2, l = Math.round(15 - hw), r = Math.round(15 + hw); for (let x = l; x <= r; x++) { let c = x === l ? B[0] : x >= r - 1 ? (x === r ? B[4] : B[3]) : B[1]; if (x > l && x < r - 1 && hh(x, y >> 2, seed) < 0.38 && y % 4 !== 0) c = B[2]; if (y < 24) c = x === l ? B[2] : B[4]; S.set(x, y, c); } }
    for (const [x, y, c] of [[15, 29, B[4]], [14, 29, B[3]], [15, 30, B[3]], [15, 28, B[0]], [14, 33, B[4]], [16, 26, B[4]]]) S.set(x, y, c); // 옹이 · 갈라진 틈
    for (const [x, y, c] of [[11, 37, B[1]], [10, 38, B[1]], [11, 38, B[2]], [12, 38, B[2]], [9, 38, B[0]], [12, 37, B[0]], [19, 37, B[3]], [20, 38, B[3]], [19, 38, B[4]], [21, 38, B[4]], [18, 38, B[3]], [14, 38, B[2]], [15, 38, B[3]], [16, 38, B[4]]]) S.set(x, y, c); // 뿌리 셋
    const jt = (i, k) => (hh(i, k, seed) - 0.5) * 1.8;
    const BL = [[15, 8, 8.5, 6.5], [7.5, 12, 7, 6], [23, 12.5, 7.2, 6.2], [15, 14.5, 6.5, 4.5], [5.5, 19, 5.2, 4.2], [25.5, 19.5, 5.4, 4.4], [11, 3.5, 4.6, 3.2], [19.5, 3, 4.2, 3], [2.8, 14.5, 3, 2.6], [28.2, 15, 3, 2.6], [11, 20, 3.6, 2.8], [20, 20.5, 3.4, 2.6]].map((b, i) => [b[0] + jt(i, 1), b[1] + jt(i, 2) * 0.6, b[2], b[3]]).sort((a, b) => a[1] - b[1]);
    for (let y = 12; y < 23; y++) for (let x = 9; x < 22; x++) if (Math.abs(x - 15) < (24 - y) * 0.9) S.set(x, y, PU[5]); // 잎 안쪽 어둠 (가지가 비치는 자리)
    for (const [cx, cy, rx, ry] of BL) { for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) { const dx = (x + 0.5 - cx) / (rx + 1.3), dy = (y + 0.5 - cy) / (ry + 1.3); if (dx * dx + dy * dy <= 1 && S.has(x, y) && PU.includes(S.get(x, y))) S.set(x, y, PU[5]); } // 뭉치 사이 그늘 테
      blob(S, cx, cy, rx, ry, PU, seed + cx, { clump: true, shift: 1.0 }); }
    for (let k = 0; k < 5; k++) { for (const [x, y, c] of [[12 - k, 22 - k, B[1]], [13 - k, 22 - k, B[3]], [18 + k, 22 - k, B[2]], [19 + k, 22 - k, B[4]]]) if (k < 3 || !S.has(x, y) || S.get(x, y) === PU[5]) S.set(x, y, c); } // 어둠 위로 보이는 가지
    for (const [cx, cy, rx, ry] of BL) { // 잎 뭉치마다: 왼쪽 위 밝은 잎 점 · 아래 가장자리 삐죽 잎
      for (let i = 0; i < 4; i++) { const x = Math.round(cx - rx * 0.55 + hh(i, cx | 0, seed) * rx * 0.8), y = Math.round(cy - ry * 0.75 + hh(cx | 0, i, seed) * ry * 0.6); if (S.has(x, y) && S.has(x, y - 1)) { S.set(x, y, PU[0]); if (i & 1) S.set(x + 1, y, PU[0]); S.set(x + 1, y + 1, PU[2]); } }
      for (let i = 0; i < 3; i++) { const x = Math.round(cx - rx * 0.7 + hh(i + 5, cx | 0, seed) * rx * 1.4); let y = Math.round(cy + ry * 0.4); while (S.has(x, y) && PU.includes(S.get(x, y)) && y < 26) y++; if (y < 26 && y > 14 && !S.has(x, y + 1)) S.set(x, y, PU[4]); } }
    if (kind === 'dusk') for (let i = 0; i < 7; i++) { const x = 3 + Math.floor(hh(i, 11, seed) * 25), y = 2 + Math.floor(hh(i, 12, seed) * 18); if (S.has(x, y) && S.has(x + 1, y + 1)) { S.set(x, y, '#d8c8f8'); S.set(x + 1, y + 1, '#a890dc'); } } // 연보라 꽃
    if (kind === 'green') for (let i = 0; i < 4; i++) { const x = 4 + Math.floor(hh(i, 11, seed) * 23), y = 8 + Math.floor(hh(i, 12, seed) * 12); if (S.has(x, y) && S.has(x, y + 1)) { S.set(x, y, '#d84a3a'); S.set(x, y + 1, '#9a2a24'); } } // 붉은 열매
    if (kind === 'autumn') for (const [x, y] of [[7, 38], [23, 38], [25, 39], [5, 39]]) { S.set(x, y, PU[0]); S.set(x + 1, y, PU[2]); } // 떨어지는 잎 · 바닥 낙엽
    shadow(S, 3, 2, 2); return render(S); }
  // ---------------------------------------------------------------- 바위 (1장 이끼 / 3장 붉은 흙빛): 모난 면 셋 (윗면 밝음 · 왼쪽 중간 · 오른쪽 그늘) · 금 · 이끼
  function rock(wPx, hPx, kind = 'moss', seed = 1) { const w = Math.round(wPx / 2), h = Math.round(hPx / 2), S = Spr(w, h);
    const C = kind === 'ruin' ? ['#8e9088', '#74766f', '#5c5e5a', '#484a4a', '#34353a'] : kind === 'moss' ? ['#b4b0bc', '#94909e', '#76727e', '#5a5664', '#423e4a'] : ['#b4a08c', '#94806e', '#766454', '#5a4a3e', '#42362c'];
    const cx = w / 2, cy = h * 0.58, rx = w / 2 - 0.5, ry = h * 0.58 - 0.3;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx), rr = 1 + 0.1 * (Math.round(vn(a * 1.6, 1, seed) * 4) / 4 - 0.5), dx = (x + 0.5 - cx) / (rx * rr), dy = (y + 0.5 - cy) / (ry * rr); if (dx * dx + dy * dy > 1) continue;
      const topFace = dy < -0.15 + dx * 0.15, k = topFace ? (dx < 0.2 ? 0 : 1) : dx < -0.25 ? 2 : dx < 0.35 ? 3 : 4; let c = C[k];
      if (!topFace && y === Math.round(cy - ry * 0.15 + (x - cx) * 0.15 * ry / rx) + 1) c = C[Math.min(4, k + 1)]; // 윗면 모서리 아래 그늘선
      S.set(x, y, c); }
    for (let i = 0; i < 3; i++) { let x = Math.round(cx + (hh(i, 1, seed) - 0.3) * w * 0.5), y = Math.round(cy - ry * 0.3); for (let k = 0; k < 4; k++) { if (S.has(x, y)) S.set(x, y, C[4]); x += hh(i, k, seed) < 0.5 ? 1 : 0; y++; } } // 금
    if (kind === 'ruin') { for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { if (!S.has(x, y) || S.has(x, y - 1)) continue; if (x < w * 0.55 && hh(x >> 1, 3, seed) < 0.6) { S.set(x, y, '#456c2c'); if (S.has(x, y + 1) && hh(x, 4, seed) < 0.5) S.set(x, y + 1, '#28461c'); } } }
    else if (kind === 'moss') for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { if (!S.has(x, y) || S.has(x, y - 1)) continue; if (x < w * 0.6 && hh(x >> 1, 3, seed) < 0.7) { S.set(x, y, '#5e8a44'); if (S.has(x, y + 1) && hh(x, 4, seed) < 0.5) S.set(x, y + 1, '#3e6a30'); } } // 윗선 이끼
    else for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { if (!S.has(x, y) || S.has(x, y - 1)) continue; if (hh(x, 5, seed) < 0.25) S.set(x, y, '#8a3a2a'); } // 붉은 흙 · 마른 피
    shadow(S, 2, 2, 2); return render(S); }
  // ---------------------------------------------------------------- 1장 이끼 낀 폐허 (세로 · 가로 돌담 = 통짜 블록 / 큰 덩어리 = 벽만 남고 한쪽이 무너져 열린 폐허 · 바닥은 비워 숲 바닥이 보임)
  function ruinBlock(wPx, hPx, seed = 1) { const HH = 12, W = Math.round(wPx / 2), T = Math.round(hPx / 2), H = T + HH, S = Spr(W, H, 6);
    const C = ['#8e9088', '#74766f', '#5c5e5a', '#484a4a', '#34353a', '#222328'], MO = ['#456c2c', '#365824', '#28461c', '#1c3416', '#12240f'], WD = ['#9a7650', '#74543a', '#523a26', '#36261a'];
    const big = W >= 40, hollow = W >= 40 && T >= 30, wt = 5, IH = 7, sw = big ? 12 : Math.max(6, Math.round(W / 2)), sh = big ? 8 : 7;
    const cut = new Set(), corner = Math.floor(hh(seed, 1, 5) * 3), cs = big ? 6 : 3;
    for (let x = 0; x < W; x++) { const n = hh(x >> 1, 2, seed) < 0.22 ? 1 + (hh(x >> 1, 3, seed) < 0.4 ? 1 : 0) : 0; for (let y = 0; y < n; y++) cut.add(x + ',' + y); }
    if (corner < 2) for (let y = 0; y < cs; y++) for (let x = 0; x < cs - y + (hh(y, 4, seed) < 0.5 ? 1 : 0); x++) cut.add((corner ? W - 1 - x : x) + ',' + y);
    const topC = (x, y) => { const row = Math.floor(y / sh), ox = (row & 1) ? sw >> 1 : 0, lx = (x + ox) % sw, ly = y % sh, id = Math.floor((x + ox) / sw) + row * 13; let c = hh(id, 6, seed) < 0.3 ? C[2] : C[1]; if (lx === 0 || ly === 0) c = C[3]; else if (lx === 1 || ly === 1) c = C[0]; return c; };
    const faceC = (x, r) => { const row = Math.floor(r / 6), ox = (row & 1) ? 6 : 0, lx = (x + ox) % 12, ly = r % 6, id = Math.floor((x + ox) / 12) + row * 7; let c = hh(id, 7, seed) < 0.3 ? C[4] : C[3]; if (ly === 0) c = r === 0 ? C[2] : C[4]; else if (lx === 0) c = C[5]; else if (ly === 1 && r > 1) c = C[2]; return c; };
    for (let y = 0; y < T; y++) for (let x = 0; x < W; x++) { if (cut.has(x + ',' + y)) continue; let c = topC(x, y); if (x === W - 1) c = C[3]; if (cut.has(x + ',' + (y - 1)) || cut.has((x - 1) + ',' + y)) c = C[0]; S.set(x, y, c); }
    for (let y = T; y < H; y++) for (let x = 0; x < W; x++) { let c = faceC(x, y - T); if (x === 0 && (y - T) % 6) c = C[2]; if (x === W - 1 || y === H - 1) c = C[5]; S.set(x, y, c); }
    for (let i = 0; i < Math.max(1, W / 26); i++) { let x = 2 + Math.floor(hh(i, 8, seed) * (W - 4)), y = T + 1; for (let k = 0; k < 6; k++) { S.set(x, y, C[5]); y++; if (hh(i, k, seed + 2) < 0.4) x += hh(k, i, seed) < 0.5 ? 1 : -1; x = Math.max(1, Math.min(W - 2, x)); } }
    const mAmt = 0.64 + hh(seed, 9, 5) * 0.08; // 이끼: 숲 바닥에 가까운 어두운 풀빛
    for (let y = 0; y < T; y++) for (let x = 0; x < W; x++) { if (!S.has(x, y)) continue; const m = vn(x / 9, y / 7, seed + 3); if (m < mAmt) continue; const e = vn((x - 1.5) / 9, (y - 1.5) / 7, seed + 3) < mAmt, e2 = vn((x + 1.5) / 9, (y + 1.5) / 7, seed + 3) < mAmt; S.set(x, y, e ? MO[0] : e2 ? MO[3] : ((x * 3 + y * 5) % 7 === 0 ? MO[0] : (x + y * 2) % 5 === 0 ? MO[2] : MO[1])); }
    for (let x = 0; x < W; x++) { if (!MO.includes(S.get(x, T - 1))) { if (hh(x, 10, seed) < 0.1) S.set(x, T, MO[2]); continue; } const d = hh(x, 11, seed) < 0.1 ? 4 + Math.floor(hh(x, 12, seed) * 4) : 1 + Math.floor(hh(x, 13, seed) * 2.4); for (let k = 0; k < d; k++) S.set(x, T + k, k === d - 1 ? MO[3] : k === 0 ? MO[1] : (k & 1 ? MO[2] : MO[1])); }
    for (let i = 0; i < Math.round(W * T / 320); i++) { const x = 1 + Math.floor(hh(i, 14, seed) * (W - 3)), y = 1 + Math.floor(hh(i, 15, seed) * (T - 2)); if (MO.includes(S.get(x, y)) && MO.includes(S.get(x + 1, y))) { S.set(x, y, '#c8aa50'); S.set(x + 1, y, '#8a7030'); } }
    for (let x = -1; x <= W; x++) { const r = hh(x, 16, seed); if (r < 0.3) { S.set(x, H - 1, MO[2]); if (r < 0.14) S.set(x, H - 2, MO[1]); } else if (r > 0.93 && x > 0 && x < W - 2) { S.set(x, H, C[2]); S.set(x + 1, H, C[4]); S.set(x, H - 1, C[1]); } }
    const XS = []; // 안쪽 그림자 (숲 바닥 위에 얹힘)
    if (hollow) { S.OV = []; const mir = hh(seed, 21, 5) < 0.5, fx = x => mir ? W - 1 - x : x, x0 = wt, x1 = W - wt, y0 = wt, y1 = T - wt, fy = y0 + IH;
      const ov = () => { const m = new Map(); S.OV.push(m); const p = (x, y, c) => m.set(fx(x) + ',' + y, c); p.m = m; return p; };
      const drop = m => { const low = new Map(); for (const k of m.keys()) { const [x, y] = k.split(',').map(Number); if (!low.has(x) || y > low.get(x)) low.set(x, y); } for (const [x, y] of low) { XS.push([x + 1, y + 1, 0.5]); XS.push([x + 2, y + 1, 0.5]); if ((x + y) & 1) XS.push([x + 2, y + 2, 0.3]); } };
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) S.del(x, y); // 바닥 비움
      // 뒷벽 안쪽 면: 윗턱 그늘 · 마름돌 두 단 · 아치 벽감 · 금 · 늘어진 덩굴
      for (let r = 0; r < IH; r++) for (let x = x0; x < x1; x++) { if (cut.has(x + ',' + (y0 - 1)) && r < 2) continue; const lx = (x + (r >= 4 ? 5 : 0)) % 10; let c = r === 0 ? C[5] : (r === 3 || r === IH - 1) ? C[5] : lx === 0 ? C[5] : (r === 1 || r === 4) ? C[2] : C[3]; if (x === x0) c = C[5]; S.set(x, y0 + r, c); }
      const nx = fx(x0 + 8 + Math.floor(hh(seed, 40, 5) * (x1 - x0 - 30)));
      for (let i = 0; i < 4; i++) { const x = x0 + 3 + Math.floor(hh(i, 41, seed) * (x1 - x0 - 6)), d = 2 + Math.floor(hh(i, 42, seed) * 4); if (Math.abs(x - nx - 2) < 5) continue; for (let k = 0; k < d; k++) S.set(x + (k > 2 ? 1 : 0), y0 + k, k === d - 1 ? MO[0] : k & 1 ? MO[2] : MO[1]); if (d > 3) S.set(x - 1, y0 + 2, MO[1]); }
      for (let x = x0; x < x1; x++) { XS.push([x + 1, fy, 0.5]); XS.push([x + 1, fy + 1, 0.42]); if ((x + fy) & 1) XS.push([x + 1, fy + 2, 0.28]); } for (let y = fy; y < y1; y++) { XS.push([x0, y, 0.45, x0 - 1]); if ((y & 1)) XS.push([x0 + 1, y, 0.28, x0 - 1]); } // 왼쪽 벽이 드리우는 안쪽 그림자 (넷째 값: 그림자를 만드는 벽 칸 — 그 벽이 무너져 없으면 그림자도 없음)
      // 돌덩이: 윗면 밝고 앞면 어두운 모난 돌 (따로 외곽선)
      const stone = (p, x, y, w, h, t = 0) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if ((i === 0 || i === w - 1) && j === 0 && w > 2 && (t & 1)) continue; const top = j < Math.max(1, Math.round(h * 0.45)); p(x + i, y + j, top ? (i === 0 || j === 0 ? C[0] : C[1]) : i === w - 1 ? C[5] : j === h - 1 ? C[4] : C[3]); } if (t & 2 && w > 3) p(x + 1, y, MO[1]); };
      // 무너진 곳: 앞 / 옆 / 뒤 가운데 한 면만 트임 · 끝은 한 단 낮은 계단 · 낮은 밑단과 돌 몇 개만 남김 (시각적으로 비움, 들어갈 수는 없음)
      const bt = Math.floor(hh(seed, 60, 5) * 3), bw = Math.round((x1 - x0) * (0.4 + hh(seed, 43, 5) * 0.14)), bc = bt === 1 ? x0 : Math.round(x0 + (x1 - x0) * [0.36, 0.5, 0.62][Math.floor(hh(seed, 44, 5) * 3)]), bA = Math.max(x0 + 3, bc - (bw >> 1)), bB = Math.min(x1 - 4, bc + (bw >> 1)), st = 6, mid = (bA + bB) >> 1;
      const loose = L => { for (const [x, y, w, h, t] of L) { const p = ov(); p.m.keep = true; stone(p, x, y, w, h, t); drop(p.m); } };
      if (bt === 0) { // 앞벽
        for (let x = bA; x <= bB; x++) for (let y = y1; y <= H; y++) S.del(fx(x), y);
        for (let r = 0; r < HH; r++) { const j = (Math.floor(r / 6) & 1) ? 2 : 0; for (let k = 1; k <= j; k++) { S.del(fx(bA - k), T + r); S.del(fx(bB + k), T + r); } }
        const lowWall = (xa, xb, h, jag) => { for (let x = xa; x <= xb; x++) { if (jag && hh(x >> 2, 61, seed) < 0.3) continue; const hj = Math.max(1, h - (jag && hh(x >> 1, 45, seed) < 0.45 ? 1 : 0)), ty = H - hj - (h < 5 ? 3 : wt); for (let y = ty; y < H - hj; y++) { let c = y === ty ? C[0] : topC(x, y); if (c === C[3]) c = C[2]; S.set(fx(x), y, c); } for (let y = H - hj; y < H; y++) { let c = faceC(x, y - T); if (y === H - hj) c = C[2]; if (y === H - 1) c = C[5]; S.set(fx(x), y, c); } } };
        lowWall(bA, bA + st, 6, false); lowWall(bB - st, bB, 6, false); lowWall(bA + st + 1, bB - st - 1, 2, true);
        loose([[mid - 6, H - 7, 5, 4, 1], [mid + 1, H - 5, 4, 3, 2], [mid + 8, H + 1, 4, 3, 0], [mid - 11, H, 3, 2, 1]]);
      } else if (bt === 2) { // 뒷벽
        for (let x = bA; x <= bB; x++) for (let y = -1; y < fy; y++) S.del(fx(x), y);
        for (let r = 0; r < IH; r++) if (r >= 4) { S.del(fx(bA - 1), y0 + r); S.del(fx(bB + 1), y0 + r); }
        const lowB = (xa, xb, h, jag) => { for (let x = xa; x <= xb; x++) { if (jag && hh(x >> 2, 61, seed) < 0.3) continue; const hj = Math.max(1, h - (jag && hh(x >> 1, 45, seed) < 0.45 ? 1 : 0)), ty = fy - hj - (h < 4 ? 3 : wt); for (let y = ty; y < fy - hj; y++) { let c = y === ty ? C[0] : topC(x, y); if (c === C[3]) c = C[2]; S.set(fx(x), y, c); } for (let y = fy - hj; y < fy; y++) S.set(fx(x), y, y === fy - hj ? C[2] : y === fy - 1 ? C[5] : C[3]); } };
        lowB(bA, bA + st, 4, false); lowB(bB - st, bB, 4, false); lowB(bA + st + 1, bB - st - 1, 2, true);
        loose([[mid - 4, fy + 1, 5, 4, 1], [mid + 5, fy + 3, 4, 3, 2], [mid - 10, -2, 4, 3, 0], [mid + 9, 0, 3, 2, 1]]);
      } else { // 옆벽 (좌우는 뒤집기로 갈림)
        const ya = y0 + Math.floor(hh(seed, 62, 5) * 3), yb = Math.min(y1 - 2, ya + Math.max(26, Math.round((y1 - y0) * 0.45))); // v3.19 세로로 긴 폐허에서 옆벽이 통째로 사라지지 않게 — 트이는 길이를 제한하고 아래쪽 벽은 남김
        for (let y = ya; y <= yb; y++) for (let x = -1; x < wt; x++) S.del(fx(x), y);
        for (let r = 0; r < HH; r++) for (let x = 0; x < wt; x++) { if (r >= HH - 5 && x < 2) continue; let c = faceC(x + 3, r); if (x === 0) c = C[2]; if (x === wt - 1) c = C[5]; if (r === HH - 1 || (r === HH - 6 && x < 2)) c = C[5]; S.set(fx(x), ya + r, c); } // 위 토막의 드러난 끝면 (아래가 이 빠짐)
        for (let y = yb - 2; y <= yb; y++) for (let x = 0; x < wt; x++) { if (y === yb - 2 && hh(x, 63, seed) < 0.5) continue; S.set(fx(x), y, y <= yb - 1 ? C[0] : topC(x, y)); } // 아래 토막 앞의 낮은 밑단
        loose([[1, ya + HH + 2, 4, 3, 1], [wt + 3, ya + HH + 7, 5, 4, 2], [-4, ya + HH + 9, 3, 2, 0], [0, yb - 7, 3, 2, 1]]);
      }
      if (!(bt === 2 && nx + 6 >= Math.min(fx(bA), fx(bB)) - 3 && nx - 1 <= Math.max(fx(bA), fx(bB)) + 3)) { for (const [dx, dy, c] of [[1, 0, C[1]], [2, 0, C[1]], [3, 0, C[1]], [0, 1, C[1]], [4, 1, C[1]], [0, 2, C[2]], [4, 2, C[2]], [0, 3, C[2]], [4, 3, C[2]], [0, 4, C[2]], [4, 4, C[2]], [-1, 5, C[0]], [0, 5, C[0]], [1, 5, C[0]], [2, 5, C[0]], [3, 5, C[0]], [4, 5, C[0]], [5, 5, C[0]]]) S.set(nx + dx, y0 + 1 + dy, c);
      for (let dy = 1; dy < 5; dy++) for (let dx = 1; dx < 4; dx++) S.set(nx + dx, y0 + 1 + dy, dy === 4 && dx === 2 ? '#3a3020' : '#101116'); }
      // 들보: 굵은 각목 · 윗선 밝음 · 결 · 못 · 부러진 끝
      const beam = (xa, ya, xb, yb, th = 4) => { const p = ov(), n = Math.max(Math.abs(xb - xa), Math.abs(yb - ya)), steep = Math.abs(yb - ya) > Math.abs(xb - xa); for (let i = 0; i <= n; i++) { const x = Math.round(xa + (xb - xa) * i / n), y = Math.round(ya + (yb - ya) * i / n); for (let k = 0; k < th; k++) { let c = k === 0 ? WD[0] : k === th - 1 ? WD[3] : (i % 6 === 3 ? WD[2] : WD[1]); if (i === 0) c = '#b8946a'; if (i === n && k !== 1) continue; if (steep) p(x + k, y, c); else p(x, y + k, c); } if (i === 3 || i === n - 4) { if (steep) p(x + 1, y, '#2a2c34'); else p(x, y + 1, '#2a2c34'); } } drop(p.m); return p; };
      const cxm = (x0 + x1) >> 1, lay = Math.floor(hh(seed, 27, 5) * 3), far = bc < cxm ? x1 - 22 : x0 + 4; // 트인 쪽 반대편에 잔해를 몰아 둠
      // 쓰러진 기둥 토막 (누운 원통: 홈 줄 · 둥근 단면)
      const drum = (x, y) => { const p = ov(); for (let i = 0; i < 12; i++) for (let j = 0; j < 6; j++) { if ((i === 0 || i === 11) && (j === 0 || j === 5)) continue; let c = [C[0], C[1], C[1], C[2], C[3], C[4]][j]; if (i % 3 === 2 && j > 0 && j < 5) c = C[3 + (j > 3 ? 1 : 0)]; if (i < 3) c = j === 0 ? C[0] : j === 5 ? C[3] : (i === 1 && (j === 2 || j === 3)) ? C[4] : C[1]; if (i === 3) c = C[4]; p(x + i, y + j, c); } p(x + 8, y, MO[1]); p(x + 9, y, MO[0]); p(x + 9, y + 1, MO[2]); drop(p.m); };
      // 깨진 항아리 · 나무통 조각
      const pot = (x, y) => { const p = ov(), P = ['#b07a50', '#8a5a38', '#643e26', '#40261a']; for (const [dx, dy, c] of [[1, 0, P[0]], [2, 0, '#1a1210'], [3, 0, P[1]], [0, 1, P[0]], [1, 1, P[0]], [2, 1, P[1]], [3, 1, P[1]], [4, 1, P[2]], [0, 2, P[1]], [1, 2, '#d8c8a0'], [2, 2, P[1]], [3, 2, P[2]], [4, 2, P[3]], [1, 3, P[2]], [2, 3, P[2]], [3, 3, P[3]], [6, 3, P[1]], [7, 3, P[2]], [6, 2, P[0]]]) p(x + dx, y + dy, c); drop(p.m); };
      const fern = (x, y) => { const p = ov(); for (const [dx, dy, c] of [[0, 0, MO[1]], [-1, -1, MO[0]], [-2, -2, MO[0]], [-3, -2, MO[1]], [1, -1, MO[1]], [2, -2, MO[0]], [3, -3, MO[0]], [4, -3, MO[2]], [0, -1, MO[2]], [0, -2, MO[0]], [0, -3, MO[1]], [1, -4, MO[0]], [-1, 0, MO[3]], [1, 0, MO[3]]]) p(x + dx, y + dy, c); };
      const gy = y1 - 2; // 바닥 맨 아래 줄 근처
      const slab = (x, y, w, h) => { const p = ov(); for (let j = 0; j < h + 2; j++) for (let i = 0; i < w; i++) { const xi = i + Math.round(j * 0.35), eL = Math.round(hh(j, 50, seed) * 2), eR = Math.round(hh(j, 51, seed) * 3); if (i < eL || i >= w - eR) continue; if (j === 0 && hh(i >> 1, 52, seed) < 0.35) continue; let c; if (j >= h) c = j === h ? C[3] : C[5]; else { const lx = (i + ((j >> 2) & 1) * 3) % 7, ly = j % 4; c = ly === 0 || lx === 0 ? C[3] : ly === 1 ? C[0] : (hh((i / 7 | 0) + (j >> 2) * 5, 53, seed) < 0.35 ? C[2] : C[1]); if (j === 0) c = C[0]; } p(x + xi, y + j, c); } p(x + 3, y + 2, MO[1]); p(x + 4, y + 2, MO[0]); p(x + 4, y + 3, MO[2]); p(x + w - 5, y + h - 2, MO[1]); p(x + w - 6, y + h - 2, MO[2]); drop(p.m); };
      const tight = x1 - x0 < 64, onlyA = hh(seed, 57, 5) < 0.5; // v3.19 안이 좁으면(폭 148px 미만) 넘어진 벽 조각 묶음과 들보 · 기둥 묶음 가운데 하나만 둠 — 뭉쳐 보이지 않게
      const sx = tight ? x0 + Math.round((x1 - x0 - 22) / 2) : bc < cxm ? x0 + 7 : x1 - 32; if (!tight || onlyA) slab(sx + Math.round((hh(seed, 54, 5) - 0.5) * 6), fy + 4 + Math.floor(hh(seed, 55, 5) * 4), 18 + Math.floor(hh(seed, 56, 5) * 5), 9); // 넘어진 벽 조각
      if (!tight || onlyA) for (const [dx, dy, w, h, t] of [[-4, 13, 4, 3, 1], [22, 6, 3, 2, 0], [8, 15, 3, 2, 2]]) { const p = ov(); stone(p, sx + dx, fy + 4 + dy, w, h, t); drop(p.m); }
      if (tight && onlyA) { /* 좁은 폐허: 벽 조각 묶음만 */ }
      else if (lay === 0) { drum(far + 2, fy + 8); beam(far - 2, fy + 18, far + 17, fy + 13, 4); beam(far + 12, y0 - 2, far + 5, fy + 7, 4); pot(far + (bc < cxm ? -9 : 20), fy + 5); }
      else if (lay === 1) { beam(far, fy + 6, far + 18, fy + 10, 4); beam(far + 4, fy + 16, far + 16, fy + 3, 4); drum(far + 3, gy - 9); pot(far + (bc < cxm ? -8 : 20), fy + 14); }
      else { beam(far + 14, y0 - 2, far + 8, fy + 9, 4); beam(far + 1, y0 - 1, far + 4, fy + 12, 4); drum(far + 6, fy + 14); beam(far - 3 + (bc < cxm ? -6 : 14), fy + 6, far + 7 + (bc < cxm ? -6 : 14), fy + 8, 4); pot(far + 14, gy - 6); }
      for (const [dx, dy, w, h, t] of (tight ? [[16, 22, 4, 3, 1]] : [[0, 3, 3, 2, 0], [16, 22, 4, 3, 1], [-5 + (bc < cxm ? 0 : 28), 12, 3, 2, 2]])) { const p = ov(); stone(p, far + dx, fy + dy, w, h, t); drop(p.m); } // 흩어진 돌
      fern(bc < cxm ? x1 - 4 : x0 + 4, fy + 6); fern(far + 19, gy - 1); fern(x0 + 3 + Math.floor(hh(seed, 48, 5) * 20), gy);
      for (const m of S.OV) if (!m.keep) for (const k of [...m.keys()]) { if (+k.split(',')[1] >= fy && S.M.has(k)) m.delete(k); } // 안쪽 잔해는 옆벽 · 앞벽 위로 올라오지 않음 (벽이 가림) — 뒷벽에 기댄 들보만 예외
    }
    shadow(S, 2, 2, 2); for (const [x, y, a, wx] of XS) { if (wx != null && !S.M.has(wx + ',' + y)) continue; const k = x + ',' + y; if (!S.SH.has(k)) S.SH.set(k, a); }
    const c = render(S); c.HH = HH; c.pad = 6; return c; }

  // ---------------------------------------------------------------- 1장 폐허에서 떨어져 나온 돌 (돌담과 같은 돌빛 · 어두운 이끼): 큰 벽 조각 / 마름돌 둘 / 부러진 돌기둥
  const RC = ['#8e9088', '#74766f', '#5c5e5a', '#484a4a', '#34353a', '#222328'], RM = ['#456c2c', '#365824', '#28461c', '#1c3416'];
  const rOv = S => { const m = new Map(); (S.OV = S.OV || []).push(m); return (x, y, c) => m.set(x + ',' + y, c); };
  const ashlar = (p, x, y, w, h, t = 0) => { const th = Math.max(1, Math.round(h * 0.42)); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if (j === 0 && ((t & 1 && i === 0) || (t & 2 && i === w - 1))) continue; if (j === h - 1 && t & 4 && i === w - 1) continue; p(x + i, y + j, j < th ? (j === 0 ? RC[0] : i === w - 1 ? RC[2] : RC[1]) : i === w - 1 ? RC[5] : j === h - 1 ? RC[4] : (i === (w >> 1) && w > 5 && j > th) ? RC[4] : RC[3]); } };
  const fallShadow = S => { for (const m of (S.OV || [])) { const low = new Map(); for (const k of m.keys()) { const [x, y] = k.split(',').map(Number); if (!low.has(x) || y > low.get(x)) low.set(x, y); } for (const [x, y] of low) { S.SH.set((x + 1) + ',' + (y + 1), 0.55); S.SH.set((x + 2) + ',' + (y + 1), 0.55); S.SH.set((x + 2) + ',' + (y + 2), 0.41); if ((x + y) & 1) S.SH.set((x + 2) + ',' + (y + 3), 0.28); } } };
  function ruinChunkL(seed = 1) { const S = Spr(26, 14); // 큰 벽 조각: 윗면 판석 + 앞면 두 단이 붙은 채 떨어짐 · 깨진 양 끝 · 옆에 구른 마름돌
    for (let y = 1; y < 13; y++) for (let x = 5; x < 21; x++) { const top = y < 5, r = y - 5, course = r >> 2, jl = top ? (y < 2 ? 2 : 0) : course ? 1 : 0, jr = top ? (y < 3 ? 3 : 1) : course ? 0 : 2; if (x < 5 + jl || x >= 21 - jr) continue; if (y === 1 && hh(x >> 1, 1, seed) < 0.4) continue;
      let c; if (top) { c = y === 1 || !S.has(x, y - 1) ? RC[0] : (x === 12 || y === 3) ? RC[3] : RC[1]; } else { const lx = (x + course * 4) % 8, ly = r % 4; c = ly === 0 ? (r === 0 ? RC[2] : RC[5]) : lx === 0 ? RC[5] : ly === 1 ? RC[2] : RC[3]; if (x >= 20 - jr) c = RC[4]; if (y === 12) c = RC[5]; } S.set(x, y, c); }
    for (const [x, y, c] of [[7, 2, RM[0]], [8, 2, RM[1]], [9, 2, RM[0]], [7, 3, RM[1]], [8, 3, RM[2]], [6, 3, RM[0]], [9, 3, RM[1]], [7, 4, RM[2]], [8, 5, RM[2]], [8, 6, RM[3]], [16, 4, RM[1]], [17, 4, RM[2]]]) if (S.has(x, y)) S.set(x, y, c);
    for (const [x, y] of [[14, 6], [14, 7], [15, 8], [15, 9], [16, 10]]) S.set(x, y, RC[5]); // 금
    ashlar(rOv(S), 0, 8, 6, 5, 1); ashlar(rOv(S), 19, 9, 7, 5, 6); ashlar(rOv(S), 9, 12, 4, 3, 2); const p = rOv(S); p(24, 6, RC[0]); p(25, 6, RC[1]); p(24, 7, RC[3]); p(25, 7, RC[4]);
    for (const x of [3, 4, 17, 18]) S.set(x, 13, RM[1]); S.set(4, 12, RM[0]);
    shadow(S, 2, 2, 2); fallShadow(S); return render(S); }
  function ruinChunkS(seed = 3) { const S = Spr(16, 10); // 마름돌 둘: 큰 것 하나 + 기대 누운 작은 것 · 조각 돌
    ashlar(rOv(S), 1, 1, 10, 7, 2); const p = rOv(S); ashlar(p, 8, 5, 7, 5, 5);
    const q = rOv(S); q(0, 8, RC[0]); q(1, 8, RC[1]); q(0, 9, RC[3]); q(1, 9, RC[4]);
    const m = S.OV[0]; for (const [x, y, c] of [[2, 1, RM[0]], [3, 1, RM[1]], [4, 1, RM[0]], [2, 2, RM[1]], [3, 2, RM[2]], [1, 2, RM[0]], [1, 3, RM[2]], [1, 4, RM[3]], [6, 4, RC[5]], [5, 5, RC[5]], [5, 6, RC[5]]]) if (m.has(x + ',' + y)) m.set(x + ',' + y, c);
    S.set(5, 9, RM[1]); S.set(6, 9, RM[0]); S.set(6, 8, RM[1]); // OV만 있으면 본체가 비므로 풀 한 포기를 본체로
    shadow(S, 2, 1, 1); S.SH.clear(); fallShadow(S); return render(S); }
  function ruinStub(seed = 9) { const S = Spr(15, 23); // 부러진 돌기둥: 마름돌 단 · 비스듬히 부러진 윗면 · 받침 · 발치에 떨어진 머릿돌 · 어두운 이끼
    for (let y = 2; y < 19; y++) for (let x = 3; x < 12; x++) { const cutY = 2 + Math.round((x - 3) * 0.55) + (hh(x, 1, seed) < 0.35 ? 1 : 0); if (y < cutY) continue; const r = y - 4, course = Math.floor(r / 5), ly = ((r % 5) + 5) % 5, seam = (course & 1) ? 6 : 8;
      let c = x >= 10 ? (x === 11 ? RC[5] : RC[4]) : x === 3 ? RC[1] : RC[2]; if (y < cutY + 3) c = y === cutY ? RC[0] : x >= 10 ? RC[2] : RC[1]; else if (ly === 0) c = RC[5]; else if (x === seam && x < 10) c = RC[4]; else if (ly === 1 && x < 10) c = x === 3 ? RC[0] : RC[1]; S.set(x, y, c); }
    for (let y = 19; y < 22; y++) for (let x = 1; x < 14; x++) S.set(x, y, y === 19 ? (x < 12 ? RC[0] : RC[2]) : x >= 12 ? RC[5] : y === 21 ? RC[4] : RC[3]);
    for (const [x, y] of [[6, 9], [6, 10], [7, 11], [7, 12], [5, 15], [5, 16]]) S.set(x, y, RC[5]);
    for (const [x, y, c] of [[3, 14, RM[1]], [4, 14, RM[0]], [3, 15, RM[0]], [4, 15, RM[1]], [5, 15, RM[2]], [3, 16, RM[1]], [4, 16, RM[2]], [3, 17, RM[2]], [4, 17, RM[3]], [3, 18, RM[2]], [1, 19, RM[0]], [2, 19, RM[1]], [3, 19, RM[0]], [4, 19, RM[1]], [2, 20, RM[2]], [8, 4, RM[1]], [9, 5, RM[0]], [9, 6, RM[2]], [0, 21, RM[1]], [0, 22, RM[2]]]) S.set(x, y, c);
    ashlar(rOv(S), 10, 19, 6, 4, 6); const p = rOv(S); p(-2, 21, RC[0]); p(-1, 21, RC[1]); p(-2, 22, RC[3]); p(-1, 22, RC[4]);
    shadow(S, 2, 2, 2); fallShadow(S); return render(S); }
  const TREE_TB = { dusk: ['#8270bc', '#62529c', '#4a3e80', '#362c66', '#26204c', '#181436'], green: ['#5e8e3a', '#46722e', '#345a24', '#26461c', '#1a3414', '#10240e'], deep: ['#3e6a40', '#2c5634', '#1e4428', '#16341e', '#0e2616', '#081a10'], autumn: ['#e09a44', '#c0702a', '#9a5020', '#743818', '#522812', '#36180c'] };
  function treeTB(kind = 'dusk', seed = 5) { return tree(seed, TREE_TB[kind], kind); }
  // ---------------------------------------------------------------- 옛 그림(납작한 띠 그림자 포함)을 받아 반투명 띠를 걷어 내고 붙은 그림자를 덧붙임 — 8px 여백이 사방에 붙음
  function withShadow(img, opt = {}) { const pad = 8, c = document.createElement('canvas'); c.width = img.width + pad * 2; c.height = img.height + pad * 2; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const t = document.createElement('canvas'); t.width = img.width; t.height = img.height; const tg = t.getContext('2d'); tg.drawImage(img, 0, 0); const ID = tg.getImageData(0, 0, t.width, t.height), D = ID.data; for (let i = 3; i < D.length; i += 4) if (D[i] < 200) D[i] = 0; tg.putImageData(ID, 0, 0); const w = Math.ceil(img.width / 2), h = Math.ceil(img.height / 2);
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && D[((y * 2 + 1) * t.width + x * 2 + 1) * 4 + 3] > 200;
    // 옛 납작 그림자(아주 어두운 반투명 · 맨 아래 줄)는 그대로 두고, 칸마다 맨 아래 칸에서 그림자
    const low = new Map(); for (let x = 0; x < w; x++) for (let y = h - 1; y >= 0; y--) if (on(x, y)) { low.set(x, y); break; } if (!low.size) { g.drawImage(t, pad, pad); return c; } const ym = Math.max(...low.values()); for (const [x, y] of [...low]) if (y < ym - (opt.band || 3)) low.delete(x);
    const SH = new Map(); for (const [x, y] of low) for (let k = 1; k <= 3; k++) { const xx = x + 2 - (k === 1 ? 1 : 0), yy = y + k; if (k <= 2) SH.set(xx + ',' + yy, k === 2 ? 0.42 : 0.55); else if ((xx + yy) & 1) SH.set(xx + ',' + yy, 0.28); }
    const xr = Math.max(...low.keys()), yr = low.get(xr); SH.set((xr + 1) + ',' + yr, 0.33); SH.set((xr + 2) + ',' + yr, 0.33);
    for (const [k, a] of SH) { const [x, y] = k.split(',').map(Number); if (on(x, y) || !dshOn(x, y, a * 0.9)) continue; g.fillStyle = DSH_C; g.fillRect(pad + x * 2, pad + y * 2, 2, 2); } // v3.20 디더 그림자
    g.drawImage(t, pad, pad); return c; }
  // ---------------------------------------------------------------- 1장 폐허 저수지 (옛 물웅덩이 · 연못 자리): 돌 테두리(판석) · 안으로 파인 벽 · 탁한 물 · 개구리밥 · 수련 · 갈대 · 물에 잠긴 계단 · 빠진 테두리 돌 · 배수구 — 바닥에 깔리는 장애물
  function reservoir(wPx, hPx, seed = 1) { const W = Math.round(wPx / 2), T = Math.round(hPx / 2), S = Spr(W, T, 6);
    const C = ['#8e9088', '#74766f', '#5c5e5a', '#484a4a', '#34353a', '#222328'], MO = ['#456c2c', '#365824', '#28461c', '#1c3416', '#12240f'], WA = ['#3e6258', '#2e4e48', '#243f3c', '#1b3232', '#132628', '#0d1c20'];
    const small = W < 34 || T < 22, rw = small ? 2 : 4, dw = small ? 3 : 8, mir = hh(seed, 1, 9) < 0.5, fx = x => mir ? W - 1 - x : x, set = (x, y, c) => S.set(fx(x), y, c), has = (x, y) => S.has(fx(x), y), get = (x, y) => S.get(fx(x), y);
    const x0 = rw, x1 = W - rw, y0 = rw, y1 = T - rw, wy = y0 + dw; // 물은 wy부터
    // 테두리 판석: 바깥 모서리 밝고 안쪽 턱은 어둡게 · 이음매 · 군데군데 빠짐
    const gone = (x, y) => { const i = y < y0 ? x >> 3 : y >= y1 ? 40 + (x >> 3) : x < x0 ? 80 + (y >> 3) : 120 + (y >> 3); return !small && hh(i, 2, seed) < 0.13 && !((x < 9 || x > W - 10) && (y < 7 || y > T - 8)); };
    for (let y = 0; y < T; y++) for (let x = 0; x < W; x++) { if (x >= x0 && x < x1 && y >= y0 && y < y1) continue; if (gone(x, y)) continue; const hor = y < y0 || y >= y1, t = hor ? x : y, d = hor ? (y < y0 ? y : T - 1 - y) : (x < x0 ? x : W - 1 - x), seam = t % 8 === (hor ? 3 : 5);
      let c = seam ? C[3] : d === 0 ? C[0] : d === rw - 1 ? C[2] : (hh((t >> 3) + (hor ? 0 : 50) + (y < y0 || x < x0 ? 0 : 99), 3, seed) < 0.35 ? C[2] : C[1]); if (!seam && t % 8 === (hor ? 4 : 6)) c = C[0]; S.set(x, y, c); }
    // 안쪽: 뒷벽 안쪽 면 (젖은 얼룩 · 물때 줄) → 물
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const r = y - y0; let c;
      if (r < dw) { const half = dw >> 1, lx = (x + (r >= half ? 5 : 0)) % 10; c = r === 0 ? C[5] : (lx === 0 || r === half) ? C[5] : r === 1 ? C[4] : (r === half + 1) ? C[3] : r >= dw - 2 ? '#1e2e28' : C[4]; if (r === dw - 3 && hh(x >> 1, 4, seed) < 0.6) c = MO[3]; if (x === x0) c = C[5]; }
      else { const dy = (y - wy) / Math.max(1, y1 - wy), n = vn(x / 7, y / 4, seed + 5); let k = n > 0.74 ? 2 : n > 0.42 ? 3 : 4; if (r - dw < 3) k = 5; else if (r - dw < 5 && ((x + y) & 1)) k = 5; if (x - x0 < 2) k = 5; else if (x - x0 < 4 && ((x + y) & 1)) k = Math.min(5, k + 1); c = WA[k]; }
      S.set(x, y, c); }
    const water = (x, y) => x >= x0 + 1 && x < x1 - 1 && y >= wy + 1 && y < y1 - 1;
    // 물에 잠긴 계단: 없거나, 뒷벽(위쪽)에 붙어 물속으로 세 단 내려감 (아래 단일수록 물빛)
    const stairs = !small && hh(seed, 6, 9) < 0.55;
    if (stairs) { const sw = 12, sx = x0 + 5 + Math.floor(hh(seed, 7, 9) * 8), TN = [[C[0], C[1], C[4]], ['#5e766e', '#46625c', '#22393a'], ['#3e5a54', '#2e4a46', '#162a2c']];
      for (let k = 0; k < 3; k++) { const ty = wy - 3 + k * 3; for (let i = 0; i < sw; i++) { const x = sx + i, e = i === 0 || i === sw - 1; set(x, ty, e ? TN[k][1] : TN[k][0]); set(x, ty + 1, i === sw - 1 ? TN[k][2] : TN[k][1]); set(x, ty + 2, TN[k][2]); } }
      for (let y = y0 + 1; y < wy - 3; y++) for (let i = 0; i < sw; i++) set(sx + i, y, i === 0 ? C[2] : i === sw - 1 ? C[5] : (y - y0) % 3 === 0 ? C[5] : C[3]); // 계단 위쪽은 벽에 붙은 돌단
      for (let i = -1; i <= sw; i++) if (i % 3 !== 1) set(sx + i, wy + 6, WA[5]); }
    // 빠져서 물에 빠진 돌 · 물속에 비치는 돌
    if (!small) { for (const [u, v, w, h] of [[0.22, 0.7, 6, 4], [0.5, 0.35, 5, 3]]) { const bx = Math.round(x0 + (x1 - x0 - 16) * u), by = Math.round(wy + (y1 - wy - 5) * v); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (water(bx + i, by + j)) set(bx + i, by + j, j === 0 ? '#4c6862' : i === w - 1 ? '#1f3836' : '#34524c'); }
      const bx = Math.round(x0 + (x1 - x0) * 0.3), by = Math.round(wy + (y1 - wy) * 0.25); for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) { if ((i === 0 || i === 5) && j === 0) continue; set(bx + i, by + j, j < 2 ? (j === 0 || i === 0 ? C[0] : C[1]) : i === 5 ? C[5] : C[3]); } for (let i = -1; i < 7; i++) set(bx + i, by + 4, i % 3 === 1 ? WA[0] : WA[5]); set(bx + 1, by, MO[1]); set(bx + 2, by, MO[0]); }
    // 개구리밥 (물 위 초록 얼룩): 가장자리와 구석에 몰림
    for (let y = wy + 1; y < y1 - 1; y++) for (let x = x0 + 1; x < x1 - 1; x++) { if (!WA.includes(get(x, y))) continue; const e = Math.min(x - x0, x1 - 1 - x, (y - wy) * 1.5, (y1 - 1 - y) * 1.5), n = vn(x / 5, y / 3.2, seed + 8) + Math.max(0, 0.22 - e * 0.03); if (n > 0.8) set(x, y, n > 0.9 ? MO[0] : (x + y) % 3 ? MO[1] : MO[2]); }
    // 잔물결 · 수련 잎 · 꽃
    for (let i = 0; i < Math.round((x1 - x0) * (y1 - wy) / 90); i++) { const x = x0 + 3 + Math.floor(hh(i, 9, seed) * (x1 - x0 - 8)), y = wy + 2 + Math.floor(hh(i, 10, seed) * (y1 - wy - 4)); if (WA.includes(get(x, y)) && WA.includes(get(x + 2, y))) { set(x, y, WA[0]); set(x + 1, y, WA[0]); if (i & 1) set(x + 2, y, '#5a8070'); } }
    if (!small) for (let i = 0; i < 2 + Math.round(W / 40); i++) { const x = x0 + 4 + Math.floor(hh(i, 11, seed) * (x1 - x0 - 12)), y = wy + 3 + Math.floor(hh(i, 12, seed) * (y1 - wy - 7)); if (![0, 1, 2, 3].every(k => WA.includes(get(x + k, y)) || MO.includes(get(x + k, y)))) continue; for (const [dx, dy, c] of [[1, 0, '#5e8e3a'], [2, 0, '#5e8e3a'], [3, 0, '#46722e'], [0, 1, '#5e8e3a'], [1, 1, '#5e8e3a'], [3, 1, '#46722e'], [4, 1, '#345a24'], [0, 2, '#46722e'], [1, 2, '#46722e'], [2, 2, '#345a24'], [3, 2, '#345a24'], [4, 2, '#26461c'], [1, 3, '#345a24'], [2, 3, '#26461c'], [3, 3, '#26461c'], [0, 4, WA[5]], [1, 4, WA[5]], [2, 4, WA[5]], [3, 4, WA[5]], [4, 3, WA[5]]]) set(x + dx, y + dy, c); if (i % 2 === 0) { set(x + 5, y + 1, '#f0e0ec'); set(x + 6, y + 1, '#d0a8c8'); set(x + 5, y + 2, '#d0a8c8'); set(x + 6, y, '#f0e0ec'); } }
    // 배수구: 뒷벽에 아치 구멍 · 흘러내린 물때 · 아래 잔물결
    if (!small) { const gx = Math.round(x0 + (x1 - x0) * (stairs ? 0.55 : 0.2) + hh(seed, 13, 9) * (x1 - x0) * 0.3); for (const [dx, dy, c] of [[0, 1, C[1]], [1, 0, C[1]], [2, 0, C[1]], [3, 1, C[2]], [1, 1, '#0c0d12'], [2, 1, '#0c0d12'], [1, 2, '#0c0d12'], [2, 2, '#0c0d12'], [0, 2, C[1]], [3, 2, C[2]], [1, 3, MO[2]], [2, 3, '#3e6258'], [1, 4, MO[3]], [2, 4, '#3e6258']]) set(gx + dx, y0 + dy, c); for (const [dx, c] of [[-1, WA[0]], [0, '#6a9080'], [1, WA[0]], [2, '#6a9080'], [3, WA[0]], [4, WA[1]]]) set(gx + dx, wy + 1, c); set(gx, wy + 3, WA[0]); set(gx + 3, wy + 3, WA[0]); }
    // 테두리 이끼 (어둡게, 안쪽 턱과 구석에) · 금
    for (let y = 0; y < T; y++) for (let x = 0; x < W; x++) { if (x >= x0 && x < x1 && y >= y0 && y < y1) continue; if (!S.has(x, y)) continue; const n = vn(x / 6, y / 5, seed + 14); if (n > 0.8) S.set(x, y, n > 0.9 ? MO[0] : (x + y * 2) % 5 === 0 ? MO[2] : MO[1]); }
    for (let i = 0; i < Math.max(2, W / 18); i++) { let x = 2 + Math.floor(hh(i, 15, seed) * (W - 4)), y = hh(i, 16, seed) < 0.5 ? 0 : y1; for (let k = 0; k < rw; k++) { if (S.has(x, y + k) && C.includes(S.get(x, y + k))) S.set(x, y + k, C[4]); if (hh(i, k, seed + 17) < 0.5) x++; } }
    // 갈대: 구석에 무더기 (테두리 위로 솟음)
    const reeds = (bx, by, n) => { const m = new Map(); (S.OV = S.OV || []).push(m); for (let i = 0; i < n; i++) { const x = bx + i * 2 + (i & 1), h = 5 + Math.floor(hh(i, 18, seed + bx) * 4); for (let k = 0; k < h; k++) m.set(fx(x + (k > h - 3 && i % 2 ? 1 : 0)) + ',' + (by - k), k === h - 1 ? '#7aa850' : k > h / 2 ? '#5e8e3a' : '#345a24'); if (i % 2 === 0) { m.set(fx(x) + ',' + (by - h), '#6a4a2c'); m.set(fx(x) + ',' + (by - h - 1), '#8a6238'); } } };
    if (!small) { reeds(x0 + 1, y1 - 2, 4); reeds(x0 + Math.round((x1 - x0) * 0.62), y1 - 1, 2); } else reeds(x0, y1 - 1, 2);
    // 안쪽 그늘: 뒷 테두리 · 왼쪽 테두리가 물에 드리움 (이미 물빛을 한 단계 낮춤) · 바깥은 납작해서 그림자 없음
    const c = render(S); c.pad = 6; return c; }
  return { reservoir, withShadow, ruinBlock, tree: treeTB, chunkL: ruinChunkL, chunkS: ruinChunkS, stub: ruinStub, boulder: (r, seed) => rock(r > 17 ? 52 : 34, r > 17 ? 28 : 20, 'ruin', seed) };
})();
;

// ==================================================================== 30_keep2.js
// ================================================================ v3.19 2장 고블린 지하성: 돌기둥(멀쩡 · 부러진) · 무너진 돌무더기 · 철창 · 낭떠러지 쇠 울타리 · 쇠 창살 벽 (2px 칸 · 왼쪽 위 빛 · 붙은 그림자) — FP(11_altar_forge.js)의 도트 도우미를 씀
const KEEP2 = (() => {
  const { Spr, render, shadow, hh, bay } = FP, K = '#0b0a0e';
  // ---------------------------------------------------------------- 2장 돌기둥 (원래 돌빛 · 어두운 오른쪽 그늘 유지, 크기 키움): 머릿돌(판 + 접시꼴 + 목띠) · 세로 홈 몸통 · 드럼 이음매 · 금 · 받침(고리 + 두 단) · 이끼 / 부러진 것은 비스듬한 단면 + 쓰러진 토막
  function pillar2(broken = false, seed = 1) { const W = 23, HT = broken ? 32 : 41, S = Spr(W + (broken ? 12 : 0), HT), P = ['#8e889a', '#7a7488', '#5e5868', '#423d4c', '#2d2935', '#1c1922'], MS = ['#567234', '#3a5226'];
    const cx = 11, by = HT - 1, sh = 6, shaftTop = broken ? by - 23 : 8, shaftBot = by - 7;
    const cyl = u => u < 0.12 ? 2 : u < 0.3 ? 0 : u < 0.5 ? 1 : u < 0.68 ? 2 : u < 0.85 ? 3 : 4; // 원통 음영 (왼쪽 위 빛, 오른쪽 깊은 그늘)
    const band = (y, hw, top) => { for (let x = cx - hw; x <= cx + hw; x++) { const u = (x - cx + hw) / (hw * 2); S.set(x, y, P[Math.min(5, cyl(u) + (top ? 0 : 1))]); } };
    // 받침: 바닥 단 · 윗단 · 둥근 고리
    for (let x = 0; x < W; x++) { const u = x / (W - 1); S.set(x, by, P[5]); S.set(x, by - 1, u > 0.75 ? P[4] : P[3]); S.set(x, by - 2, u > 0.75 ? P[3] : u < 0.5 ? P[0] : P[1]); }
    for (let x = 2; x < W - 2; x++) { const u = (x - 2) / (W - 5); S.set(x, by - 3, u > 0.75 ? P[4] : P[3]); S.set(x, by - 4, u > 0.75 ? P[3] : P[2]); S.set(x, by - 5, u > 0.7 ? P[2] : u < 0.45 ? P[0] : P[1]); }
    band(by - 6, sh + 2, true); band(by - 7, sh + 1, false);
    // 몸통: 세로 홈 (홈은 한 단계 어둡게, 홈 왼쪽 턱은 밝게) · 드럼 이음매
    for (let y = shaftTop; y < shaftBot; y++) for (let x = cx - sh; x <= cx + sh; x++) { const u = (x - cx + sh) / (sh * 2); let k = cyl(u); const f = (x - cx + sh) % 3; if (f === 1) k = Math.min(5, k + 1); else if (f === 2 && k > 0) k--; const r = (y - shaftTop) % 9; if (!broken || y > shaftTop + 1) { if (r === 8) k = Math.min(5, k + 2); else if (r === 0 && y > shaftTop) k = Math.max(0, k - 1); } S.set(x, y, P[k]); }
    for (const [x, y] of [[cx - 2, shaftBot - 12], [cx - 2, shaftBot - 11], [cx - 1, shaftBot - 10], [cx - 1, shaftBot - 9], [cx, shaftBot - 8], [cx + 3, shaftBot - 5], [cx + 3, shaftBot - 4], [cx + 4, shaftBot - 3]]) if (S.has(x, y) && y > shaftTop + 1) S.set(x, y, P[5]); // 금
    if (!broken) { // 머릿돌: 목띠 · 접시꼴 · 판 (한쪽 귀가 깨짐)
      band(7, sh + 1, true); band(6, sh + 1, false); band(5, sh + 2, true); band(4, sh + 3, false);
      for (let x = 0; x < W; x++) { const u = x / (W - 1); if (x >= W - 2) { if (x === W - 2) S.set(x, 2, P[4]); continue; } S.set(x, 0, u < 0.6 ? P[0] : P[1]); S.set(x, 1, u > 0.75 ? P[3] : P[1]); S.set(x, 2, u > 0.75 ? P[4] : P[2]); S.set(x, 3, P[5]); }
      for (const x of [3, 7, 11, 15]) { S.set(x, 2, P[4]); S.set(x + 1, 2, P[0]); } // 판에 새긴 홈 무늬
      for (let x = cx - sh; x <= cx + sh; x++) { const k = S.get(x, 8); S.set(x, 8, P[Math.min(5, P.indexOf(k) + 2)]); S.set(x, 9, P[Math.min(5, P.indexOf(S.get(x, 9)) + 1)]); } // 머릿돌 밑 그늘
    } else { // 부러진 단면: 왼쪽이 높은 비스듬한 깨짐 · 밝은 단면 · 이 빠진 가장자리
      for (let x = cx - sh; x <= cx + sh; x++) { const t = (x - cx + sh) / (sh * 2), top = shaftTop + Math.round(t * t * 7) + (hh(x >> 1, 1, seed) < 0.4 ? 1 : 0) - (x === cx - sh + 3 ? 1 : 0); for (let y = shaftTop - 3; y < top; y++) S.del(x, y); S.set(x, top, P[0]); if (S.has(x, top + 1)) S.set(x, top + 1, t > 0.6 ? P[2] : P[1]); if (hh(x, 2, seed) < 0.3 && S.has(x, top + 2)) S.set(x, top + 2, P[5]); }
      // 쓰러진 토막 (누운 원통 · 홈 줄 · 둥근 단면) + 조각 돌
      const m = new Map(), p = (x, y, c) => m.set(x + ',' + y, c); S.OV = [m]; const dx = W + 1, dy = by - 8;
      for (let i = 0; i < 11; i++) for (let j = 0; j < 9; j++) { if ((i === 0 || i === 10) && (j === 0 || j === 8)) continue; let k = [0, 0, 1, 1, 2, 3, 3, 4, 5][j]; if (j % 3 === 1 && i > 3) k = Math.min(5, k + 1); if (i < 4) { const d = Math.hypot(i - 1.8, (j - 4) * 0.55); k = d < 0.9 ? 4 : d < 1.7 ? 2 : j < 2 ? 0 : j > 6 ? 3 : 1; } if (i === 4) k = 4; p(dx + i, dy + j, P[k]); }
      p(dx + 6, dy, MS[0]); p(dx + 7, dy, MS[1]); p(dx + 7, dy + 1, MS[1]);
      const q = new Map(); S.OV.push(q); for (const [x, y, c] of [[-3, by, P[1]], [-2, by, P[3]], [-3, by - 1, P[0]], [dx + 4, by + 1, P[1]], [dx + 5, by + 1, P[3]], [dx + 4, by, P[0]], [dx + 5, by, P[1]], [dx + 6, by + 1, P[4]]]) q.set(x + ',' + y, c);
      for (const [x, y] of m.keys ? [...m.keys()].map(k => k.split(',').map(Number)) : []) if (!m.has(x + ',' + (y + 1))) { S.SH.set((x + 1) + ',' + (y + 1), 0.5); S.SH.set((x + 2) + ',' + (y + 1), 0.5); if ((x + y) & 1) S.SH.set((x + 2) + ',' + (y + 2), 0.3); }
    }
    for (const [x, y, c] of [[3, by - 5, MS[0]], [4, by - 5, MS[1]], [3, by - 4, MS[1]], [1, by - 2, MS[0]], [2, by - 2, MS[1]], [W - 4, by - 2, MS[1]], [cx - 4, shaftBot - 3, MS[1]], [cx - 4, shaftBot - 2, MS[0]], [cx - 3, shaftBot - 2, MS[1]], [cx + 1, shaftBot - 14, MS[1]]]) if (S.has(x, y)) S.set(x, y, c);
    const sv = new Map(S.SH); shadow(S, 2, 2, 2); for (const [k, a] of sv) if (!S.SH.has(k)) S.SH.set(k, a); return render(S); }

  // ---------------------------------------------------------------- 2장 무너진 돌무더기 (새 돌기둥과 같은 돌빛): 쓰러진 기둥 토막 · 머릿돌 조각 · 선 밑동 토막 · 조각 돌 · 이끼
  function rubble2(r = 20, seed = 1) { const big = r > 17, S = Spr(big ? 28 : 18, big ? 16 : 12), P = ['#8e889a', '#7a7488', '#5e5868', '#423d4c', '#2d2935', '#1c1922'], MS = ['#567234', '#3a5226'];
    S.OV = []; const ov = () => { const m = new Map(); S.OV.push(m); return (x, y, c) => m.set(x + ',' + y, c); }, fl = hh(seed, 1, 3) < 0.5, W = S.w, X = x => fl ? W - 1 - x : x;
    const drum = (p, x, y, len, h) => { for (let i = 0; i < len; i++) for (let j = 0; j < h; j++) { if ((i === 0 || i === len - 1) && (j === 0 || j === h - 1)) continue; let k = Math.min(4, Math.floor(j / h * 4.6)); if (i > 4 && (j === 2 || j === h - 3)) k = Math.min(5, k + 2); else if (i > 4 && (j === 3 || j === h - 2) && k > 0) k--; if (i > 6 && (i - 5) % 6 === 5) k = Math.min(5, k + 2); if (j === h - 1) k = 5; if (i < 4) { const d = Math.hypot(i - 1.8, (j - (h - 1) / 2) * 0.6); k = d < 0.9 ? 4 : d < 1.7 ? 2 : j < 2 ? 0 : j > h - 3 ? 3 : 1; } if (i === 4) k = 4; if (i === len - 1 && hh(j, 2, seed) < 0.4) continue; p(X(x + i), y + j, P[k]); } };
    const slab = (p, x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if (j === 0 && (i === 0 || (i > w - 3 && hh(i, 3, seed) < 0.7))) continue; p(X(x + i), y + j, j === 0 ? P[0] : j === 1 ? P[1] : j === h - 1 ? P[5] : i > w * 0.7 ? P[4] : P[3]); } for (let i = 2; i < w - 2; i += 3) { p(X(x + i), y + 2, P[4]); p(X(x + i + 1), y + 2, P[1]); } };
    const stump = (p, x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if (j === 0 && (i === 0 || i === w - 1)) continue; const u = i / (w - 1); let k = j < 2 ? (j === 0 ? 0 : 1) : u < 0.25 ? 1 : u < 0.6 ? 2 : u < 0.85 ? 3 : 4; if (j >= 2 && i % 3 === 1) k = Math.min(5, k + 1); if (j === h - 1) k = 5; p(X(x + i), y + j, P[k]); } };
    const chip = (p, x, y, w) => { for (let i = 0; i < w; i++) { p(X(x + i), y, i === 0 ? P[0] : P[1]); p(X(x + i), y + 1, i === w - 1 ? P[5] : P[3]); } };
    const base = (x, y, c) => S.set(X(x), y, c);
    if (big) { slab(ov(), 3, 1, 13, 5); stump(base, 1, 6, 8, 8); drum(ov(), 9, 6, 15, 8); chip(ov(), 24, 13, 4); chip(ov(), 6, 14, 3); chip(ov(), 20, 2, 3);
      for (const [x, y, c] of [[5, 1, MS[0]], [6, 1, MS[1]], [6, 2, MS[1]], [16, 6, MS[0]], [17, 6, MS[1]], [17, 7, MS[1]], [2, 6, MS[1]]]) { for (const m of S.OV) if (m.has(X(x) + ',' + y)) m.set(X(x) + ',' + y, c); if (S.has(X(x), y)) S.set(X(x), y, c); } }
    else { stump(base, 1, 4, 6, 7); drum(ov(), 6, 4, 11, 7); chip(ov(), 14, 10, 3); chip(ov(), 3, 1, 3);
      for (const [x, y, c] of [[11, 4, MS[0]], [12, 4, MS[1]], [2, 4, MS[1]]]) { for (const m of S.OV) if (m.has(X(x) + ',' + y)) m.set(X(x) + ',' + y, c); if (S.has(X(x), y)) S.set(X(x), y, c); } }
    shadow(S, 2, 2, 2); for (const m of S.OV) { const low = new Map(); for (const k of m.keys()) { const [x, y] = k.split(',').map(Number); if (!low.has(x) || y > low.get(x)) low.set(x, y); } for (const [x, y] of low) { const a = (x + 2) + ',' + (y + 1), b2 = (x + 1) + ',' + (y + 1); if (!S.SH.has(a)) S.SH.set(a, 0.5); if (!S.SH.has(b2)) S.SH.set(b2, 0.5); if ((x + y) & 1) S.SH.set((x + 2) + ',' + (y + 2), 0.3); } }
    return render(S); }
  // ---------------------------------------------------------------- 2장 철창: 둥근 지붕 · 매다는 고리 · 쇠살 다섯 · 가운데 띠 · 바닥판 · 안에 해골과 뼈 · 녹
  function cage(seed = 4) { const S = Spr(16, 24); const I = ['#b4b2c0', '#8a8896', '#5e5c6a', '#3a3844'];
    S.set(7, 0, I[1]); S.set(8, 0, I[2]); S.set(6, 1, I[1]); S.set(9, 1, I[2]); // 고리
    for (let x = 2; x < 14; x++) { const t = Math.round(Math.abs(x - 7.5) ** 2 / 9); S.set(x, 2 + t, x < 7 ? I[0] : I[2]); } // 지붕
    for (const x of [1, 4, 7, 10, 14]) for (let y = 4 + (x === 1 || x === 14 ? 2 : 0); y < 21; y++) S.set(x, y, x < 7 ? I[1] : I[2]);
    for (let x = 1; x < 15; x++) { S.set(x, 12, x < 7 ? I[0] : I[2]); S.set(x, 21, I[1]); S.set(x, 22, I[3]); }
    for (const [x, y, c] of [[6, 16, '#e0d8c8'], [8, 16, '#d0c8b8'], [5, 17, '#e0d8c8'], [6, 17, '#2a2228'], [8, 17, '#2a2228'], [9, 17, '#c8c0b0'], [6, 18, '#d0c8b8'], [7, 18, '#d0c8b8'], [8, 18, '#c8c0b0'], [3, 19, '#d8d0c0'], [3, 20, '#c8c0b0'], [12, 20, '#d8d0c0'], [11, 20, '#c8c0b0']]) S.set(x, y, c); // 해골 · 뼈
    for (const [x, y] of [[4, 8], [10, 15], [14, 18], [1, 10]]) S.set(x, y, '#7a4a30'); // 녹
    shadow(S, 2, 2, 2); return render(S); }
  // ---------------------------------------------------------------- 2장 쇠 울타리 (낭떠러지 둘레): 모서리 · 중간 기둥(돌 받침 · 창끝) + 가로대 둘 + 쇠살 · 녹 · 한 칸은 휘어 빠짐. 뒤 → 옆 → 앞 순서로 겹침
  function fence(wPx, hPx, seed = 1) { const FH = 9, W = Math.round(wPx / 2), T = Math.round(hPx / 2), S = Spr(W, T + FH, 4);
    const I = ['#9ea2ae', '#767c88', '#545a66', '#383c46', '#22242c'], ST = ['#746e80', '#5a5466', '#403c4c', '#2c2936'], RU = '#643c28';
    const runH = (yb, front) => { const gap = 6 + Math.floor(hh(seed, front ? 1 : 2, 3) * Math.max(1, W - 16)); // 휘어 빠진 자리
      for (let x = 1; x < W - 1; x++) { const broken = front && x >= gap && x < gap + 5; S.set(x, yb - FH + 3 + (broken ? Math.round(Math.sin((x - gap) / 4 * Math.PI) * 2) : 0), I[1]); if (!broken) S.set(x, yb - 2, I[2]);
        if (x % 4 === 2) { if (broken && x !== gap + 4) continue; for (let y = yb - FH + 2; y <= yb - 1; y++) { S.set(x, y, y < yb - 4 ? I[1] : I[2]); if (!S.has(x + 1, y)) S.set(x + 1, y, I[4]); } S.set(x, yb - FH + 1, I[0]); if (hh(x, front ? 3 : 4, seed) < 0.3) S.set(x, yb - 2 - Math.floor(hh(x, 5, seed) * 4), RU); } } };
    const post = (x, yb) => { for (let y = yb - FH; y <= yb - 2; y++) { S.set(x, y, I[1]); S.set(x + 1, y, I[3]); } S.set(x, yb - FH - 1, I[0]); S.set(x + 1, yb - FH - 1, I[2]); S.set(x, yb - FH - 2, I[0]); S.set(x - 1, yb - FH, I[1]); S.set(x + 2, yb - FH, I[3]);
      for (let i = -1; i <= 2; i++) { S.set(x + i, yb - 1, i < 1 ? ST[0] : ST[1]); S.set(x + i, yb, i === 2 ? ST[3] : ST[2]); } if (hh(x, yb, seed) < 0.5) S.set(x, yb - 3, RU); };
    const yB = FH - 1, yF = T + FH - 1, nx = Math.max(1, Math.round(W / 16)), ny = Math.max(1, Math.round(T / 12));
    runH(yB, false); for (let i = 0; i <= nx; i++) post(Math.round((W - 2) * i / nx), yB);
    for (const x of [0, W - 2]) { for (let y = yB - FH + 3; y <= yF - FH + 3; y++) { S.set(x, y, I[1]); S.set(x + 1, y, I[3]); } for (let y = yB; y <= yF - 2; y++) if (y % 3 === 0) { S.set(x, y, I[2]); S.set(x + 1, y, I[4]); } for (let i = 1; i < ny; i++) post(x, Math.round(yB + (yF - yB) * i / ny)); } // 옆 줄
    runH(yF, true); for (let i = 0; i <= nx; i++) post(Math.round((W - 2) * i / nx), yF);
    const c = render(S, false); c.FH = FH; c.pad = 4; return c; }

  // ---------------------------------------------------------------- 2장 쇠 창살 벽 (가늘고 긴 석벽 자리): 돌 턱 위에 선 쇠 울타리 한 줄
  function fenceWall(wPx, hPx, seed = 1) { const FH = 9, W = Math.round(wPx / 2), T = Math.round(hPx / 2), S = Spr(W, T + FH, 4);
    const I = ['#9ea2ae', '#767c88', '#545a66', '#383c46', '#22242c'], ST = ['#746e80', '#5a5466', '#403c4c', '#2c2936', '#1c1922'], RU = '#643c28';
    const post = (x, yb) => { for (let y = yb - FH; y <= yb - 1; y++) { S.set(x, y, I[1]); S.set(x + 1, y, I[3]); } S.set(x, yb - FH - 1, I[0]); S.set(x + 1, yb - FH - 1, I[2]); S.set(x, yb - FH - 2, I[0]); S.set(x - 1, yb - FH, I[1]); S.set(x + 2, yb - FH, I[3]); if (hh(x, yb, seed) < 0.5) S.set(x, yb - 3, RU); };
    if (W >= T) { const cy = FH + (T >> 1); // 가로: 돌 턱(윗면 + 앞면) + 울타리
      for (let y = FH; y < FH + T; y++) for (let x = 0; x < W; x++) { const r = y - FH, top = r < T - 3; let c = top ? (r === 0 ? ST[0] : (x % 12 === 5 || r === (T - 3) >> 1) ? ST[2] : ST[1]) : r === T - 1 ? ST[4] : x % 12 === 0 ? ST[4] : ST[3]; if (x === W - 1) c = ST[4]; S.set(x, y, c); }
      const yb = cy; for (let x = 1; x < W - 1; x++) { S.set(x, yb - FH + 3, I[1]); S.set(x, yb - 2, I[2]); if (x % 4 === 2) { for (let y = yb - FH + 2; y <= yb - 1; y++) { S.set(x, y, y < yb - 4 ? I[1] : I[2]); S.set(x + 1, y, I[4]); } S.set(x, yb - FH + 1, I[0]); if (hh(x, 3, seed) < 0.25) S.set(x, yb - 3 - Math.floor(hh(x, 5, seed) * 3), RU); } }
      const n = Math.max(1, Math.round(W / 18)); for (let i = 0; i <= n; i++) post(Math.round((W - 2) * i / n), yb);
    } else { const cx = (W >> 1) - 1; // 세로: 돌 턱 + 기둥 줄
      for (let y = FH; y < FH + T; y++) for (let x = 0; x < W; x++) { const r = y - FH; let c = r >= T - 3 ? (r === T - 1 ? ST[4] : ST[3]) : x === 0 ? ST[0] : x >= W - 2 ? ST[3] : (r % 10 === 9 ? ST[2] : ST[1]); S.set(x, y, c); }
      const PH = 7, n = Math.max(2, Math.round((T - 4) / 9)); // 짧은 창 기둥이 줄지어 서고 사이는 쇠사슬
      for (let i = 0; i < n; i++) { const yb = Math.round(FH + 3 + (T - 8) * i / (n - 1)); for (let y = yb - PH; y <= yb - 1; y++) { S.set(cx, y, I[1]); S.set(cx + 1, y, I[3]); } S.set(cx, yb - PH - 1, I[0]); S.set(cx + 1, yb - PH - 1, I[2]); S.set(cx, yb - PH - 2, I[0]); S.set(cx - 1, yb - PH + 1, I[1]); S.set(cx + 2, yb - PH + 1, I[3]); S.set(cx - 1, yb - 1, ST[0]); S.set(cx + 2, yb - 1, ST[2]); if (hh(i, 7, seed) < 0.5) S.set(cx, yb - 3, RU);
        if (i < n - 1) { const y2 = Math.round(FH + 3 + (T - 8) * (i + 1) / (n - 1)); for (let y = yb + 1; y < y2 - PH - 2; y += 2) S.set(cx + ((y >> 1) & 1), y - 2, I[2]); } }
    }
    shadow(S, 2, 2, 2); const c = render(S); c.FH = FH; c.pad = 4; return c; }
  return { pillar: pillar2, rubble: rubble2, cage, fence, fenceWall };
})();
;

// ==================================================================== 31_camp3.js
// ================================================================ v3.19 3장 오크 부락: 피웅덩이(웅덩이 자리) · 오크 모닥불 · 붉은 흙빛 바위 (2px 칸 · 왼쪽 위 빛 · 붙은 그림자) — FP(11_altar_forge.js)의 도트 도우미를 씀
const CAMP3 = (() => {
  const { Spr, render, shadow, hh, bay } = FP, K = '#0b0a0e';
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sm = v => v * v * (3 - 2 * v), a = (i, j) => hh(xi + i, yi + j, s); return (a(0, 0) * (1 - sm(fx)) + a(1, 0) * sm(fx)) * (1 - sm(fy)) + (a(0, 1) * (1 - sm(fx)) + a(1, 1) * sm(fx)) * sm(fy); };
  // ---------------------------------------------------------------- 바위 (1장 이끼 / 3장 붉은 흙빛): 모난 면 셋 (윗면 밝음 · 왼쪽 중간 · 오른쪽 그늘) · 금 · 이끼
  function rock(wPx, hPx, kind = 'moss', seed = 1) { const w = Math.round(wPx / 2), h = Math.round(hPx / 2), S = Spr(w, h);
    const C = kind === 'moss' ? ['#b4b0bc', '#94909e', '#76727e', '#5a5664', '#423e4a'] : ['#b4a08c', '#94806e', '#766454', '#5a4a3e', '#42362c'];
    const cx = w / 2, cy = h * 0.58, rx = w / 2 - 0.5, ry = h * 0.58 - 0.3;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = Math.atan2(y + 0.5 - cy, x + 0.5 - cx), rr = 1 + 0.1 * (Math.round(vn(a * 1.6, 1, seed) * 4) / 4 - 0.5), dx = (x + 0.5 - cx) / (rx * rr), dy = (y + 0.5 - cy) / (ry * rr); if (dx * dx + dy * dy > 1) continue;
      const topFace = dy < -0.15 + dx * 0.15, k = topFace ? (dx < 0.2 ? 0 : 1) : dx < -0.25 ? 2 : dx < 0.35 ? 3 : 4; let c = C[k];
      if (!topFace && y === Math.round(cy - ry * 0.15 + (x - cx) * 0.15 * ry / rx) + 1) c = C[Math.min(4, k + 1)]; // 윗면 모서리 아래 그늘선
      S.set(x, y, c); }
    for (let i = 0; i < 3; i++) { let x = Math.round(cx + (hh(i, 1, seed) - 0.3) * w * 0.5), y = Math.round(cy - ry * 0.3); for (let k = 0; k < 4; k++) { if (S.has(x, y)) S.set(x, y, C[4]); x += hh(i, k, seed) < 0.5 ? 1 : 0; y++; } } // 금
    if (kind === 'moss') for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { if (!S.has(x, y) || S.has(x, y - 1)) continue; if (x < w * 0.6 && hh(x >> 1, 3, seed) < 0.7) { S.set(x, y, '#5e8a44'); if (S.has(x, y + 1) && hh(x, 4, seed) < 0.5) S.set(x, y + 1, '#3e6a30'); } } // 윗선 이끼
    else for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) { if (!S.has(x, y) || S.has(x, y - 1)) continue; if (hh(x, 5, seed) < 0.25) S.set(x, y, '#8a3a2a'); } // 붉은 흙 · 마른 피
    shadow(S, 2, 2, 2); return render(S); }
  // ---------------------------------------------------------------- 3장 오크 모닥불: 돌 고리 · 엇갈린 장작 · 불꽃 세 갈래 · 꼬챙이 받침 Y 둘 + 꼬치 고기
  function orcFire(seed = 10) { const S = Spr(24, 18); const ST = ['#a8a0a0', '#847c7c', '#625a5c', '#46404a'];
    for (let i = 0; i < 9; i++) { const a = Math.PI * 2 * i / 9, cx = 12 + Math.cos(a) * 8, cy = 13 + Math.sin(a) * 3.2; for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 1; dx++) S.set(Math.round(cx + dx), Math.round(cy + dy), dy < 0 ? (dx < 0 ? ST[0] : ST[1]) : dx > 0 ? ST[3] : ST[2]); }
    for (let x = 6; x < 19; x++) { S.set(x, 12 + Math.round((x - 6) * 0.15), x % 3 ? '#6a4628' : '#4a301a'); S.set(x, 13 - Math.round((x - 6) * 0.15), x % 4 ? '#8a5e36' : '#5a3a20'); }
    const F = ['#fff2b0', '#ffd060', '#f08a28', '#c04a18']; for (const [cx, h] of [[10, 5], [12, 8], [14, 6]]) for (let k = 0; k < h; k++) { const y = 11 - k, half = Math.max(0, Math.round((h - k) / 3)); for (let x = cx - half; x <= cx + half; x++) S.set(x, y, F[Math.min(3, Math.abs(x - cx) + (k > h - 3 ? 1 : 0))]); }
    for (const [x, y] of [[9, 9], [15, 8], [11, 4]]) S.set(x, y, '#f08a28');
    for (const px of [2, 22]) { for (let y = 3; y < 14; y++) S.set(px, y, y < 13 ? '#5a3e28' : '#3e2a1a'); S.set(px - 1, 3, '#5a3e28'); S.set(px + 1, 3, '#5a3e28'); S.set(px - 1, 2, '#7a5a3a'); S.set(px + 1, 2, '#7a5a3a'); }
    for (let x = 1; x < 24; x++) S.set(x, 3, '#9a9aa4'); for (const [x, c] of [[10, '#c04040'], [11, '#a83030'], [12, '#c04040'], [13, '#8a2424'], [14, '#a83030']]) { S.set(x, 4, c); S.set(x, 5, c === '#8a2424' ? '#6a1a1a' : '#8a2424'); } S.set(11, 3, '#e06060');
    shadow(S, 2, 2, 2); return render(S); }

  // ---------------------------------------------------------------- 3장 피웅덩이 (웅덩이 자리 · 바닥에 깔리는 장애물): 통나무 테두리 · 파인 흙벽 · 검붉은 피 · 떠 있는 뼈와 고깃덩이 · 거품 · 귀퉁이 말뚝과 해골 · 넘쳐 흐른 핏자국
  function bloodPool(wPx, hPx, seed = 1) { const W = Math.round(wPx / 2), T = Math.round(hPx / 2), S = Spr(W, T, 16);
    const WD = ['#a8804e', '#86623a', '#644628', '#46301c', '#2c1e12'], BL = ['#a82220', '#7c1416', '#5c0d12', '#42080e', '#2c050a', '#1c0308'], BN = ['#f0e8d4', '#c4baa4', '#8a8070'], ER = ['#3a2016', '#2a160e', '#1c0e0a'];
    const small = W < 34 || T < 22, rw = small ? 2 : 3, dw = small ? 2 : 4, x0 = rw, x1 = W - rw, y0 = rw, y1 = T - rw, by = y0 + dw, mir = hh(seed, 1, 7) < 0.5, fx = x => mir ? W - 1 - x : x, set = (x, y, c) => S.set(fx(x), y, c), get = (x, y) => S.get(fx(x), y);
    // 통나무 테두리: 눕힌 통나무 (윗선 밝고 아랫선 어둡게) · 이음매 · 군데군데 빠짐 · 밧줄 감기
    const gone = (x, y) => { const i = y < y0 ? x >> 3 : y >= y1 ? 30 + (x >> 3) : x < x0 ? 60 + (y >> 3) : 90 + (y >> 3); return !small && hh(i, 2, seed) < 0.1 && !((x < 8 || x > W - 9) && (y < 6 || y > T - 7)); };
    for (let y = 0; y < T; y++) for (let x = 0; x < W; x++) { if (x >= x0 && x < x1 && y >= y0 && y < y1) continue; if (gone(x, y)) continue; const hor = y < y0 || y >= y1, t = hor ? x : y, d = hor ? (y < y0 ? y : y - y1) : (x < x0 ? x : x - x1), seam = t % 11 === (hor ? 4 : 7), rope = t % 22 === (hor ? 12 : 15);
      let c = seam ? WD[4] : rope ? '#c8b088' : d === 0 ? WD[0] : d === rw - 1 ? WD[3] : (hh(t >> 2, 3 + d, seed) < 0.3 ? WD[2] : WD[1]); S.set(x, y, c); }
    // 안쪽: 파인 흙벽 (핏물 자국) → 피
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const r = y - y0; let c;
      if (r < dw) { c = r === 0 ? ER[2] : hh(x >> 1, 4, seed) < 0.35 ? BL[4] : r === dw - 1 ? BL[5] : ER[r > 1 ? 1 : 0]; if (x === x0) c = ER[2]; }
      else { const n = vn(x / 8, y / 4.5, seed + 5); let k = n > 0.8 ? 2 : n > 0.45 ? 3 : 4; if (r - dw < 2) k = 5; else if (r - dw < 4 && ((x + y) & 1)) k = Math.min(5, k + 1); if (x - x0 < 2) k = 5; c = BL[k]; }
      S.set(x, y, c); }
    const blood = (x, y) => BL.includes(get(x, y)) && y > by + 1;
    // 윤기 (가로 밝은 줄) · 거품
    for (let i = 0; i < Math.round((x1 - x0) * (y1 - by) / 150); i++) { const x = x0 + 3 + Math.floor(hh(i, 6, seed) * (x1 - x0 - 9)), y = by + 3 + Math.floor(hh(i, 7, seed) * (y1 - by - 5)); if (blood(x, y) && blood(x + 3, y)) { set(x, y, BL[1]); set(x + 1, y, BL[0]); if (i % 3 === 0) set(x + 2, y, BL[1]); } }
    for (let i = 0; i < Math.max(2, W / 14); i++) { const x = x0 + 4 + Math.floor(hh(i, 8, seed) * (x1 - x0 - 10)), y = by + 4 + Math.floor(hh(i, 9, seed) * (y1 - by - 8)); if (blood(x, y) && blood(x + 2, y + 2)) { set(x + 1, y, BL[0]); set(x, y + 1, BL[0]); set(x + 2, y + 1, BL[1]); set(x + 1, y + 2, BL[4]); set(x + 1, y + 1, BL[3]); } }
    // 떠 있는 것: 갈비뼈 · 해골 · 뼈 · 고깃덩이 (아래쪽은 피에 잠겨 어둡게)
    const put = (rows, x, y, P) => rows.forEach((rw2, j) => [...rw2].forEach((ch, i) => { if (ch !== '.' && blood(x + i, y + j)) set(x + i, y + j, P[ch]); }));
    const PB = { p: BN[0], w: BN[1], W: BN[2], K: '#1a0a0c', s: BL[4] }, PM = { q: '#d8685a', r: '#b03a30', R: '#7a1e1c', p: BN[0], s: BL[5] };
    if (!small) { const A = (u, v) => [Math.round(x0 + 3 + (x1 - x0 - 14) * u), Math.round(by + 3 + (y1 - by - 9) * v)];
      put(['.p.p.p.p.', 'pwpwpwpwp', 'w.w.w.w.w', 's.s.s.s.s'], ...A(0.62, 0.5), PB); put(['.ppw.', 'pKwKW', 'pwwwW', '.sWs.'], ...A(0.2, 0.25), PB); put(['pp...wp', 'wwwwwwW', 'sss.sss'], ...A(0.3, 0.8), PB);
      put(['.qqr.', 'qrrrR', 'rrRRR', '.sss.'], ...A(0.85, 0.2), PM); put(['.rqqr..', 'rqrrRpw', '.RRRs.p'], ...A(0.05, 0.6), PM); if (W > 60) put(['pw', '.W'], ...A(0.48, 0.15), PB); }
    else put(['.pw.', 'KwKW', '.ss.'], x0 + 3, by + 2, PB);
    // 귀퉁이 말뚝 + 꽂힌 해골 · 고리 사슬
    const m = new Map(), p = (x, y, c) => m.set(fx(x) + ',' + y, c); S.OV = [m];
    if (!small) { for (let y = -9; y < 3; y++) { p(1, y, WD[1]); p(2, y, WD[3]); } p(1, -10, WD[0]); p(2, -10, WD[2]); ['.ppw.', 'pKwKW', 'pwwwW', '.wWW.'].forEach((rw2, j) => [...rw2].forEach((ch, i) => { if (ch !== '.') p(-1 + i, -14 + j, PB[ch]); })); p(1, -4, '#c8b088'); p(2, -4, '#8a7450'); p(3, -8, BL[1]); p(3, -7, BL[2]); p(3, -6, BL[3]); }
    // 넘쳐 흐른 핏자국 (테두리 밖 · 아래쪽과 오른쪽)
    for (let i = 0; i < Math.max(2, W / 16); i++) { const x = 2 + Math.floor(hh(i, 10, seed) * (W - 4)), d = 1 + Math.floor(hh(i, 11, seed) * 3); for (let k = 0; k < d; k++) if (!S.has(fx(x), T + k)) set(x, T + k, k === d - 1 ? BL[4] : BL[3]); if (hh(i, 12, seed) < 0.5) set(x + 1, T, BL[4]); }
    for (let x = 3; x < W - 3; x++) if (hh(x, 13, seed) < 0.3) S.set(x, y1 - 1 - (y1 > T - rw ? 0 : 0) + rw - 1, BL[3]); // 아래 통나무에 묻은 피
    const c = render(S); c.pad = 16; return c; }
  return { rock, orcFire, bloodPool };
})();
;

// ==================================================================== 32_town4.js
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
;

// ==================================================================== 33_well2.js
'use strict';
// ================================================================ v3.19 2장 버려진 우물 — 「영수 · 명수의 안전 놀이터」 입구
//  · 2장 원정마다 큰 전투방 한 곳의 구석에 한 번 나옴. 방을 클리어한 뒤 「F 내려가기」 → 도박장 (사다리로 올라오면 우물 옆으로)
//  · 깨진 돌 테 · 기운 두레박 틀 · 뒤쪽 테에 갈고리로 걸린 사다리 · 초 등불 · 앞면에 칼로 긁은 고양이 얼굴 · 속은 꺼멓게
//  · 틀 위에 까마귀 두 마리: 번갈아 「까악」(멀리서도 보이는 표시), 가까이 가면 날아갔다가 멀어지면 돌아옴
//  · FP(11_altar_forge.js)의 도트 도우미를 씀. 다른 파일은 고치지 않고 함수를 감싸서 끼워 넣음 (지도 표시 한 줄만 06에)
const WELL2 = (() => {
  const { Spr, render, shadow, hh } = FP;
  function well2(seed = 1) { const W = 38, H = 44, S = Spr(W, H, 6), P = ['#9a94a6', '#7a7488', '#5e5868', '#423d4c', '#2d2935', '#1c1922'], WD = ['#a07848', '#7a5634', '#563a22', '#382414'], MS = ['#567234', '#3a5226', '#263a1a'];
    const cx = 19, cy = 26, RX = 17, RY = 6, IX = 12.6, IY = 3.6, FH = 9, cyl = u => u < 0.1 ? 2 : u < 0.28 ? 0 : u < 0.5 ? 1 : u < 0.7 ? 2 : u < 0.86 ? 3 : 4;
    const inE = (x, y, rx, ry, oy = 0) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy - oy) / ry) ** 2 <= 1;
    // 앞면 (둥근 벽): 테 아래로 9칸 · 마름돌 줄눈 · 왼쪽 빛 · 오른쪽 깊은 그늘
    for (let x = 0; x < W; x++) for (let y = cy; y <= cy + FH + RY; y++) { if (Math.abs(x + 0.5 - cx) > RX || !(y <= cy + FH || inE(x, y, RX, RY, FH))) continue;
      const u = (x - (cx - RX)) / (RX * 2), r = y - cy, row = Math.floor(r / 4), seam = r % 4 === 3 || (x + (row & 1) * 4) % 8 === 0; const k = cyl(u) + (seam ? 2 : hh(Math.floor((x + (row & 1) * 4) / 8), row, seed) < 0.3 ? 1 : 0); S.set(x, y, P[Math.min(5, k + 1)]); }
    // 테 윗면 + 구멍 (위는 어둠 · 아래쪽 벽에는 밑에서 올라온 불빛)
    for (let y = cy - RY - 1; y <= cy + RY; y++) for (let x = 0; x < W; x++) { if (!inE(x, y, RX, RY)) continue; const u = (x - (cx - RX)) / (RX * 2);
      if (inE(x, y, IX, IY)) { const d = (y + 0.5 - (cy - IY)) / (IY * 2); S.set(x, y, d < 0.55 ? '#050408' : d < 0.8 ? '#0c0a12' : (x + y) & 1 ? '#17141e' : '#0f0d15'); continue; } // 속은 꺼멓게 (깊이를 알 수 없음)
      const a = Math.atan2((y + 0.5 - cy) * 2.6, x + 0.5 - cx), seam = Math.abs(Math.sin(a * 6 + 0.4)) < 0.14; let k = seam ? 3 : y < cy ? (u < 0.55 ? 0 : 1) : (u < 0.6 ? 1 : 2); if (!inE(x, y + 1, RX, RY)) k = Math.min(5, k + 2); else if (inE(x, y + 1, IX, IY) && y < cy) k = 3; S.set(x, y, P[k]); }
    for (const [x, y] of [[29, cy - 5], [30, cy - 5], [30, cy - 4], [31, cy - 4], [32, cy - 4], [32, cy - 3], [33, cy - 3]]) S.del(x, y); // 오른쪽 위 테가 깨져 나감
    for (const [x, y, c] of [[3, cy + 2, MS[0]], [4, cy + 2, MS[1]], [4, cy + 3, MS[1]], [5, cy + 3, MS[2]], [2, cy + 1, MS[1]], [3, cy + 1, MS[0]], [9, cy + 7, MS[1]], [10, cy + 7, MS[0]], [10, cy + 8, MS[2]], [27, cy + FH + 3, MS[1]], [28, cy + FH + 2, MS[2]], [8, cy - 4, MS[1]], [9, cy - 5, MS[0]]]) if (S.has(x, y)) S.set(x, y, c);
    // 칼로 긁은 고양이 얼굴 (앞면 가운데 · 밝은 긁힌 자국)
    for (const [dx, dy] of [[-4, 0], [4, 0], [-4, 1], [-3, 1], [3, 1], [4, 1], [-4, 2], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [4, 2], [-4, 3], [4, 3], [-2, 3], [2, 3], [-4, 4], [4, 4], [0, 4], [-3, 5], [-2, 5], [-1, 5], [0, 5], [1, 5], [2, 5], [3, 5]]) S.set(cx + dx, cy + 4 + dy, (dx + dy) & 1 ? '#d4cede' : '#b4aec0');
    // 떨어져 나간 테 돌 (오른쪽 아래 바닥)
    for (const [x, y, c] of [[34, cy + 12, P[0]], [35, cy + 12, P[1]], [34, cy + 13, P[2]], [35, cy + 13, P[3]], [36, cy + 13, P[4]], [33, cy + 13, P[2]]]) S.set(x, y, c);
    S.OV = []; const ov = () => { const m = new Map(); S.OV.push(m); return (x, y, c) => m.set(x + ',' + y, c); };
    // 두레박 틀: 뒤쪽 기둥 둘 (오른쪽은 위가 부러지고 기움) + 처진 가로대 + 감긴 밧줄
    { const p = ov(); for (let y = 2; y <= cy - 3; y++) { p(2, y, WD[0]); p(3, y, WD[1]); p(4, y, WD[3]); } for (let y = 7; y <= cy - 3; y++) { const x = 32 + (y < 14 ? 1 : 0); p(x, y, WD[1]); p(x + 1, y, WD[2]); p(x + 2, y, WD[3]); } p(33, 6, WD[0]); p(34, 6, WD[2]);
      for (let x = 1; x <= 36; x++) { const y = 2 + Math.round(x * 0.11); p(x, y, WD[0]); p(x, y + 1, x % 7 === 3 ? WD[3] : WD[1]); p(x, y + 2, WD[3]); }
      for (let x = 24; x <= 29; x++) { const y = 2 + Math.round(x * 0.11); p(x, y - 1, '#c8b088'); p(x, y, x & 1 ? '#c8b088' : '#8a7450'); p(x, y + 1, '#8a7450'); p(x, y + 2, x & 1 ? '#8a7450' : '#5e4c30'); p(x, y + 3, '#5e4c30'); } }
    { const p = ov(); for (let y = 9; y <= cy - 1; y++) p(27, y, y & 1 ? '#c8b088' : '#8a7450'); } // 구멍으로 드리운 밧줄
    // 사다리: 위 끝의 쇠갈고리가 뒤쪽 테에 걸려 있고 구멍 속으로 내려감
    { const p = ov(), IR = ['#8a8894', '#55535c', '#2e2d34']; for (const rx of [14, 21]) { for (let y = cy - 4; y <= cy + 1; y++) { p(rx, y, y > cy - 1 ? WD[2] : WD[1]); p(rx + 1, y, y > cy - 1 ? WD[3] : WD[2]); }
        p(rx, cy - 5, IR[0]); p(rx + 1, cy - 5, IR[1]); p(rx, cy - 6, IR[0]); p(rx + 1, cy - 6, IR[1]); p(rx, cy - 7, IR[1]); p(rx + 1, cy - 7, IR[2]); p(rx + 1, cy - 8, IR[1]); p(rx + 2, cy - 8, IR[2]); p(rx + 2, cy - 7, IR[2]); } // 테를 넘어 뒤로 꺾인 갈고리
      for (const y of [cy - 3, cy]) for (let x = 16; x <= 20; x++) { p(x, y, y === cy ? WD[2] : WD[0]); p(x, y + 1, WD[3]); } }
    // 등불 (가로대 왼쪽에 건 초 등불 — 도박장 등불과 같은 결)
    { const p = ov(), lx = 7, ly = 8; p(lx + 2, ly - 2, '#3a3940'); p(lx + 2, ly - 1, '#3a3940'); for (let x = lx + 1; x <= lx + 3; x++) p(x, ly, '#55535c'); for (let y = ly + 1; y <= ly + 6; y++) for (let x = lx; x <= lx + 4; x++) p(x, y, x === lx || x === lx + 4 ? '#3a3940' : y === ly + 6 ? '#f0dc98' : (x === lx + 2 && y <= ly + 4) ? (y <= ly + 2 ? '#fff0b0' : '#ffb040') : '#b06a1c'); for (let x = lx; x <= lx + 4; x++) p(x, ly + 7, '#26252b'); }
    shadow(S, 2, 2, 3); const c = render(S); c.pad = 6; c.lamp = [(7 + 2 + 6) * 2, (8 + 3 + 6) * 2]; c.hole = [(cx + 6) * 2, (cy + 6) * 2]; c.foot = (cy + FH + RY + 6) * 2; return c; }
  let ART = null, CROW = null;
  const art = () => ART || (ART = well2(3));
  function crowArt() { if (CROW) return CROW; const B = '#1a161e', Hh = '#3e3848', E = '#d84a32', Y = '#c8a040', S = Spr(12, 8, 2);
    for (const [x, y, c] of [[4, -6, B], [5, -6, B], [3, -5, B], [4, -5, Hh], [5, -5, E], [6, -5, B], [7, -5, Y], [2, -4, B], [3, -4, Hh], [4, -4, B], [5, -4, B], [6, -4, B], [1, -3, B], [2, -3, Hh], [3, -3, B], [4, -3, B], [5, -3, B], [0, -2, B], [1, -2, B], [2, -2, B], [3, -2, B], [4, -2, B], [5, -2, B], [-2, -1, B], [-1, -1, B], [0, -1, B], [1, -1, B], [3, -1, B], [4, -1, B], [3, 0, '#6a5a30'], [5, 0, '#6a5a30']]) S.set(x + 3, y + 6, c);
    const r = render(S), l = document.createElement('canvas'); l.width = r.width; l.height = r.height; const g = l.getContext('2d'); g.translate(r.width, 0); g.scale(-1, 1); g.drawImage(r, 0, 0);
    return (CROW = { r, l }); } // r: 오른쪽을 봄 (발 칸 = 그림의 (3+2, 6+2)칸) · l: 뒤집은 것
  const PERCH = [[10, 2, -1], [29, 5, 1]]; // 우물 그림 칸 좌표 (발 자리) · 보는 쪽
  const cur = () => { const R = G && G.dun && G.dun.cur; return R && R.well ? R : null; };
  const org = R => { const c = art(); return { x: (R.well.x - c.width / 2) & ~1, y: (R.well.y - c.foot + 8) & ~1 }; };

  // ---------------------------------------------------------------- 놓을 방 · 자리 (던전을 만들 때 정함 — 같은 던전이면 늘 같은 자리)
  function place(D) {
    const fight = r => ['combat', 'elite', 'survive'].includes(r.type), big = r => SHAPES[r.shape] && SHAPES[r.shape].w >= 900 && SHAPES[r.shape].h >= 450;
    let C = D.rooms.filter(r => r.type === 'combat' && big(r) && !r.sealW); const rest = D.rooms.filter(r => fight(r) && !C.includes(r) && !r.sealW);
    if (C.length > 1) { const k = C.reduce((a, r) => a + (r.seed || r.id || 0), 0) % C.length; C = C.slice(k).concat(C.slice(0, k)); }
    for (const R of C.concat(rest)) { setArena(SHAPES[R.shape]);
      const pts = [[A.x0 + 110, A.y0 + 150], [A.x1 - 110, A.y0 + 150], [A.x0 + 110, A.y1 - 70], [A.x1 - 110, A.y1 - 70], [A.x0 + 230, A.y0 + 150], [A.x1 - 230, A.y0 + 150], [A.x0 + 230, A.y1 - 70], [A.x1 - 230, A.y1 - 70]];
      const keys = []; for (const d in R.doors) if (R.doors[d] != null) keys.push(doorIn(d, 34)); if (R.crack) keys.push(doorIn(R.crack.dir, 34));
      for (const [x, y] of pts) {
        if (x < A.x0 + 60 || x > A.x1 - 60 || y < A.y0 + 110 || y > A.y1 - 40) continue;
        if (Math.hypot(x - CX, y - CY) < 170 || keys.some(p => Math.hypot(p.x - x, p.y - y) < 130) || obsHitL(R.obs, x, y - 8, 54)) continue;
        R.well = { x: x & ~1, y: y & ~1 }; R.obs.push({ t: 'prop', c: true, x: R.well.x, y: R.well.y - 8, r: 20, well: true }); R.nav = buildNav(R.obs);
        if (R.props) R.props = R.props.filter(p => Math.hypot(p.x - x, p.y + 10 - y) > 58);
        return R; } }
    return null;
  }
  { const o = genDungeon; genDungeon = function (stage) { const D = o(stage); try { if (stage === 2 && D && D.rooms) place(D); } catch (e) { console.warn('WELL2', e); } return D; }; }

  // ---------------------------------------------------------------- 까마귀
  const st = R => R.well.cr || (R.well.cr = PERCH.map(() => ({ s: 'perch', t: 0 })));
  function crows(R, o) { const P = G.player, S = st(R), C = crowArt(), d = P ? Math.hypot(P.x - R.well.x, P.y - (R.well.y - 20)) : 999;
    S.forEach((c, i) => { const [px, py, f] = PERCH[i], fx = o.x + (px + 6) * 2, fy = o.y + (py + 6) * 2;
      if (c.s === 'perch' && d < 78 && P && !P.dead) { c.s = 'fly'; c.t = time + i * 0.16; c.d = (P.x < R.well.x ? 1 : -1) * (i ? 1 : 1); if (i === 0) sfx('dodge', 1.5); }
      if (c.s === 'gone' && time > c.t && d > 170) c.s = 'perch';
      if (c.s === 'perch') { const img = f > 0 ? C.r : C.l, bob = Math.floor(time / 0.7 + i * 1.3) % 5 === 0 ? 2 : 0; ctx.drawImage(img, f > 0 ? fx - 10 : fx - (img.width - 10) + 2, fy - 16 + bob); }
      else if (c.s === 'fly') { const k = Math.floor((time - c.t) / 0.07); if (k < 0) { const img = f > 0 ? C.r : C.l; ctx.drawImage(img, f > 0 ? fx - 10 : fx - (img.width - 10) + 2, fy - 18); return; }
        const X = (fx + k * 8 * c.d) & ~1, Y = (fy - 8 - k * 5) & ~1, w = k % 2 ? -1 : 1; ctx.fillStyle = '#0b0a0e';
        for (const [x, y] of [[0, 0], [1, 0], [2, 0], [-1, -w], [3, -w], [-2, -2 * w], [4, -2 * w]]) ctx.fillRect(X + x * 2 * c.d - 2, Y + y * 2 - 2, 6, 6);
        ctx.fillStyle = '#2a2430'; for (const [x, y] of [[0, 0], [1, 0], [2, 0], [-1, -w], [3, -w], [-2, -2 * w], [4, -2 * w]]) ctx.fillRect(X + x * 2 * c.d, Y + y * 2, 2, 2);
        ctx.fillStyle = '#c8a040'; ctx.fillRect(X + 3 * 2 * c.d, Y, 2, 2);
        if (k === 1) for (let n = 0; n < 2; n++) G.parts.push({ x: fx, y: fy - 6, vx: rand(-16, 16), vy: rand(4, 18), t: rand(0.5, 0.9), c: '#1a161e', g: 30 }); // 빠진 깃털
        if (k > 30) { c.s = 'gone'; c.t = time + rand(8, 14); } } });
    // 번갈아 「까악」 (앉아 있을 때만 · 3.6초마다 1.3초)
    const n = Math.floor(time / 3.6), ph = time - n * 3.6, i = n % 2, c = S[i];
    if (ph < 1.3 && c.s === 'perch') { const [px, py, f] = PERCH[i]; drawBubble('까악', o.x + (px + 6) * 2 + f * 6, o.y + (py + 6) * 2 - 16, 0); }
  }

  // ---------------------------------------------------------------- 그리기 · 빛 · 상호작용 (기존 함수를 감쌈)
  { const o = roomEnts; roomEnts = function (list) { o(list); const R = cur(); if (!R) return; const c = art(), p = org(R);
      list.push({ y: R.well.y + 6, d: () => { ctx.drawImage(c, p.x, p.y); const f = Math.floor(time * 9) % 3; // 등불 불꽃이 일렁임
          ctx.fillStyle = f === 1 ? '#fff0b0' : '#ffb040'; ctx.fillRect(p.x + c.lamp[0], p.y + c.lamp[1] - 4 - (f === 2 ? 2 : 0), 2, 2); } });
      list.push({ y: R.well.y + 7, d: () => crows(R, p) }); }; }
  { const o = roomLights; roomLights = function (lights) { o(lights); const R = cur(); if (!R) return; const c = art(), p = org(R), fl = 0.9 + 0.06 * Math.sin(time * 7);
      lights.push({ x: p.x + c.lamp[0], y: p.y + c.lamp[1], r: 66, a: 0.92 * fl, c: '255,170,80', ca: 0.18 }); }; }
  const ready = R => R.cleared || !['combat', 'elite', 'survive'].includes(R.type);
  { const o = nearInteract; nearInteract = function () { const R = cur(), P = G.player;
      if (R && P && !G.trans && ready(R) && Math.hypot(P.x - R.well.x, P.y - (R.well.y + 4)) < 46) return { k: 'well2', x: R.well.x, y: R.well.y - art().foot - 2, t: 'F 내려가기' };
      return o(); }; }
  { const o = doInteract; doInteract = function (it) { if (it && it.k === 'well2') { const R = cur(); if (R) R.wellSeen = true; DEN.debugEnter(); return; } return o(it); }; }
  return { place, art };
})();
;

// ==================================================================== 34_px1.js
'use strict';
// 잿빛 왕관 원정대 — 34_px1.js : v3.19 1px 도트 보기 (F7 · 주소 끝 ?px1)
// 게임은 도트 한 칸을 2px로 그린다(768×432). 이 보기를 켜면 다 그린 화면을 384×216(한 칸 = 1px)으로 줄이고, 창도 모니터 픽셀 384×216 크기로 줄여 키우지 않고 그대로 보여 준다.
// 그림 · 게임 규칙은 그대로이고 보여 주는 단계만 바뀐다. HUD(체력 · 스킬 칸 · 글자 상자)도 같은 비율로 작아진다.
  const PX1 = (() => {
    const c = document.createElement('canvas'); c.id = 'px1'; c.width = VW / 2; c.height = VH / 2;
    Object.assign(c.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', imageRendering: 'pixelated', pointerEvents: 'none', display: 'none' });
    cv.insertAdjacentElement('afterend', c);
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const tag = document.createElement('div'); tag.textContent = '1px 도트 보기 (F7)';
    Object.assign(tag.style, { position: 'absolute', right: '0', top: '-22px', whiteSpace: 'nowrap', padding: '2px 6px', background: 'rgba(11,10,14,.8)', color: '#f0d080', border: '1px solid #8a6a2a', font: '10px Galmuri9, monospace', pointerEvents: 'none', display: 'none', zIndex: 50 });
    cv.parentElement.appendChild(tag);
    let on = false;
    const set = v => { on = !!v; window.PX1_ON = on; c.style.display = on ? 'block' : 'none'; tag.style.display = on ? 'block' : 'none'; if (typeof fit === 'function') fit(); try { localStorage.setItem('acr_px1', on ? '1' : '0'); } catch (e) {} };
    // 칸은 짝수 좌표에 2×2로 찍혀 있으므로 가장 가까운 점을 고르는 축소로 한 칸이 한 점이 된다
    const draw = () => { if (!on) return; g.clearRect(0, 0, c.width, c.height); g.drawImage(cv, 0, 0, VW, VH, 0, 0, c.width, c.height); };
    let init = /[?&]px1\b/.test(location.search); try { if (!init && localStorage.getItem('acr_px1') === '1') init = true; } catch (e) {}
    set(init);
    window.addEventListener('keydown', e => { if (e.key === 'F7') { e.preventDefault(); set(!on); } });
    return { draw, set, get on() { return on; } };
  })();
  { const r0 = render; render = function () { r0.apply(this, arguments); PX1.draw(); }; }
;
