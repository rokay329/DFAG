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
