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
