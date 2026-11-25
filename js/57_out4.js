'use strict';
// 잿빛 왕관 원정대 — 57_out4.js : v3.27 시안01 — 4장 벽 바깥 (좌 · 우 · 아래)
// 컨셉: 「불탄 왕도의 높은 광장」 — 방은 왕도 한가운데 높이 쌓은 돌 광장. 둘레는 그을린 돌 난간(난간동자 · 받침 기둥)
//  · 난간 밖: 판석 턱 → 큰 마름돌 옹벽(남쪽은 높게, 좌우는 좁게) → 아래로 연기 속에 사라짐
//  · 그 아래: 한 단 낮게 깔린 같은 돌 바닥 — 어둡게, 광장에서 멀어질수록 디더로 어둠 속에 (시안02)
//  · 문: 난간을 가르고 돌다리(아치 고가)가 이웃 광장으로 이어짐. 닫히면 쇠창살 문
const OUT4 = (() => {
  const hh = (x, y, s) => FP.hh(x, y, s);
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sm = v => v * v * (3 - 2 * v), a = (i, j) => hh(xi + i, yi + j, s); return (a(0, 0) * (1 - sm(fx)) + a(1, 0) * sm(fx)) * (1 - sm(fy)) + (a(0, 1) * (1 - sm(fx)) + a(1, 1) * sm(fx)) * sm(fy); };
  const ST = ['#b0aa9e', '#928c82', '#76716a', '#5c5853', '#45423e', '#302e2b', '#201f1d']; // 그을린 돌 (밝 → 어둠)
  const SOOT = ['#1a1816', '#121110', '#0b0a09'];
  const EMB = ['#ffcf6a', '#ff8a30', '#c8481a', '#7a2810']; // 잉걸
  const ROOF = [['#463c36', '#362e29', '#28221e'], ['#3e3c40', '#302e32', '#232125'], ['#48392e', '#382c24', '#29201a']]; // 지붕 (그을린 붉은 기와 · 슬레이트 · 갈색 기와)
  const WALLC = ['#3a3530', '#2c2824', '#1f1c19'];
  const PT = 20, LG = 10, CF = 48, CS = 14, PW = 20, BH = 66; // 난간 굵기 · 턱 · 남쪽 옹벽 · 좌우 옹벽 · 길 반폭 · 아래 난간 높이
  let ON = true;
  const on4 = R => ON && G && G.stage === 4 && R && !['forge', 'home', 'archive', 'lab', 'den', 'ruin', 'boss', 'altar'].includes(R.type) && !(G.dun && G.dun.forge);
  const geo = () => ({ L: A.x0, RR: A.x1, T: A.y0, B: A.y1, PY: CY + 2, SX: DOOR.s.x });

  function paint(g, R) {
    const LY = cellLayer(0, 0, W, H), px = (x, y, c) => LY.set(x & ~1, y & ~1, c);
    const sd = ((R.seed || 1) * 23 + 5) | 0, { L, RR, T, B, PY, SX } = geo();
    const D = R.doors || {}, dW = D.w != null && !hiddenDoor(R, 'w'), dE = D.e != null && !hiddenDoor(R, 'e'), dS = D.s != null && !hiddenDoor(R, 's');
    const FL = L - 4 - PT, FR = RR + 4 + PT, FB = B + BH, lipL = FL - LG, lipR = FR + LG, lipB = FB + LG, TT = T - 10, HZ = T - 70;
    const gapW = y => dW && Math.abs(y - PY) < PW + 4, gapE = y => dE && Math.abs(y - PY) < PW + 4, gapS = x => dS && Math.abs(x - SX) < PW + 4;
    const inTer = (x, y) => x >= lipL && x < lipR && y >= TT && y < lipB; // 광장(턱 포함)
    const LAND = 120, BW = 22; // 돌다리 길이 · 반폭
    // ------------------------------------------------ 1) 바깥 전부: 어두운 바탕 · 지평선 붉은 연기 띠 · 불탄 지붕들 · 연기 · 고원에서 멀수록 어둠
    const fadeOf = (x, y) => { const dx = x < lipL ? lipL - x : x > lipR ? x - lipR : 0, dy = y > lipB ? y - lipB : 0; return clamp((Math.sqrt(dx * dx + dy * dy) - 30) / 160, 0, 1); };
    const CW = W >> 1, CH = H >> 1, buf = new Array(CW * CH).fill(null);
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) { const y = j * 2, hz = clamp(1 - Math.abs(y - HZ) / 40, 0, 1); buf[j * CW + i] = y < HZ ? (dith(i, j, clamp((y - (HZ - 90)) / 90, 0, 1) * 0.6) ? '#1e1512' : '#100c0b') : hz > 0 && dith(i, j, hz * 0.7) ? '#2a1a14' : SOOT[1]; }
    const bset = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; buf[(y >> 1) * CW + (x >> 1)] = c; };
    // 집: 박공지붕(위 비탈 · 아래 비탈 · 용마루) + 처마 밑 벽(잉걸 창) — 멀수록 작게
    const house = (cx, by, w, s) => { const p = clamp((by - HZ) / 320, 0.15, 1), sc = 0.45 + 0.55 * p, ww = Math.max(10, Math.round(w * sc / 2) * 2), rh = Math.round(ww * 0.42 / 2) * 2 + 2, wh = Math.round(ww * 0.28 / 2) * 2 + 2;
      const x0 = (cx - ww / 2) & ~1, y0 = (by - rh - wh) & ~1, P = ROOF[s % 3], burnt = hh(s, 1, sd) < 0.35, hole = hh(s, 2, sd) < 0.1, lit = hh(s, 8, sd) < 0.18, dim = (1 - p);
      const far = dim > 0.5, DK = { [P[0]]: P[1], [P[1]]: P[2], [P[2]]: SOOT[0], [WALLC[0]]: WALLC[1], [WALLC[1]]: WALLC[2], [WALLC[2]]: SOOT[0] }, dk = c => far ? (DK[c] || c) : c; // 먼 집은 한 단계 어둡게
      for (let y = 0; y < rh; y += 2) for (let x = 0; x < ww; x += 2) { const ridge = y === rh / 2 - (rh / 2) % 2, up = y < rh / 2, tile = ((y >> 1) % 2 === 0), e = Math.min(x, ww - 2 - x); if (e < (up ? (rh / 2 - y) * 0.5 : 0)) continue; // 위 비탈은 박공 끝이 살짝 들어감
        let c = ridge ? P[0] : up ? (tile ? P[1] : P[2]) : (tile ? P[0] : P[1]); if (x === 0 || x === ww - 2) c = SOOT[0];
        if (burnt && hh((x0 + x) >> 2, (y0 + y) >> 2, sd + 3) < 0.35) c = SOOT[0]; // 그을음
        if (hole && Math.abs(x - ww * 0.6) < ww * 0.16 && Math.abs(y - rh * 0.55) < rh * 0.25) c = hh(x, y, sd + 4) < 0.5 ? EMB[2] : EMB[3]; // 무너진 지붕 틈의 잉걸
        bset(x0 + x, y0 + y, dk(c)); }
      for (let y = rh; y < rh + wh; y += 2) for (let x = 0; x < ww; x += 2) { let c = y === rh ? SOOT[0] : x < 2 ? WALLC[0] : x > ww - 4 ? WALLC[2] : WALLC[1];
        const win = (x % 8 === 4 || x % 8 === 6) && y > rh + 1 && y < rh + wh - 2; if (win) c = lit && hh(x0 + x, y0, sd + 6) < 0.5 ? (y === rh + 2 ? EMB[2] : EMB[3]) : SOOT[0];
        bset(x0 + x, y0 + y, dk(c)); }
      if (hh(s, 7, sd) < 0.5) for (let y = -6; y < 2; y += 2) for (let x = 0; x < 4; x += 2) bset(x0 + ww * 0.25 + x & ~1, y0 + y, dk(x ? ST[5] : ST[4])); // 굴뚝
      return { x0, y0, ww, rh, wh, hole, burnt }; };
    // 한 단 아래 바닥: 광장과 같은 돌 바닥이 한 층 낮게 깔림 — 어둡게, 멀어질수록 디더로 어둠 속에
    const LOWF = ['#3a3632', '#302d29', '#272421', '#1c1a18'];
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { if (inTer(x, y) || (x >= FL && x < FR && y < T)) continue;
      const row = Math.floor(y / 12), off = (row % 2) * 12, bx = Math.floor((x + off) / 24), mx = (x + off) % 24, my = y % 12;
      let i = hh(bx, row, sd + 60) < 0.35 ? 0 : hh(bx, row, sd + 61) < 0.5 ? 1 : 2; if (mx === 0 || my === 0) i = 3; if (i < 3 && mx < 2 && my > 1) i = Math.max(0, i - 1);
      let c = LOWF[i]; if (i < 3 && hh(x >> 1, y >> 1, sd + 62) < 0.03) c = '#55504a'; // 재 부스러기
      bset(x, y, c); }
    // 광장 옹벽 밑 그늘 (아래 바닥에 드리움)
    for (let y = lipB & ~1; y < lipB + 70; y += 2) for (let x = (lipL - 24) & ~1; x < lipR + 24; x += 2) { const k = (y - lipB) / 70; if (dith(x >> 1, y >> 1, (1 - k) * 0.6)) bset(x, y, SOOT[1]); }
    for (const sg of [-1, 1]) for (let y = TT & ~1; y < lipB + 40; y += 2) for (let d = 0; d < 40; d += 2) { const x = sg < 0 ? lipL - CS - d : lipR + CS + d; if (dith(x >> 1, y >> 1, (1 - d / 40) * 0.5)) bset(x, y, SOOT[1]); }
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) { const x = i * 2, y = j * 2; if (inTer(x, y) || (x >= FL && x < FR && y < T)) continue; let c = buf[j * CW + i]; const f = fadeOf(x, y); if (f > 0 && dith(i, j, f)) c = dith(i + 1, j, f - 0.5) ? SOOT[2] : SOOT[1]; if (y >= HZ - 4 || x < FL || x >= FR) LY.set(x, y, c); }
    // ------------------------------------------------ 2) 옹벽: 큰 마름돌 (넓은 간격) · 위 갓돌 · 아래로 어두워지며 연기 속에 사라짐
    const block = (x, y, v, sideLen) => { const row = Math.floor(v / 14), off = (row % 2) * 13 + (hh(row, 1, sd) * 6 | 0) * 2, bx = Math.floor((x + off) / 26), mx = (x + off) % 26, my = v % 14, k = v / sideLen;
      let i = mx < 2 ? 1 : my < 2 ? 2 : mx > 22 || my > 11 ? 4 : hh(bx, row, sd + 30) < 0.3 ? 2 : 3; if (my === 0 || mx === 0 || (mx === 24)) i = 5; // 줄눈
      if (hh(bx, row, sd + 31) < 0.12 && my > 3 && my < 10 && mx > 6 && mx < 18 && (mx + my) % 5 === 0) i = 6; // 금
      i = Math.min(6, i + (dith(x >> 1, y >> 1, k * 1.6) ? 1 : 0)); return k > 0.35 && dith((x >> 1) + 1, y >> 1, (k - 0.35) * 1.8) ? null : ST[i]; };
    for (let y = lipB & ~1; y < lipB + CF; y += 2) for (let x = (lipL - CS) & ~1; x < lipR + CS; x += 2) { const v = y - lipB; if (dS && Math.abs(x - SX) < BW + 8) continue; const c = block(x, y, v, CF * 0.8); if (c) px(x, y, c); }
    for (const sg of [-1, 1]) for (let y = TT & ~1; y < lipB + 30; y += 2) for (let d = 0; d < CS; d += 2) { const x = sg < 0 ? lipL - 2 - d : lipR + d; if ((sg < 0 ? dW : dE) && Math.abs(y - PY) < BW + 8) continue; const k = d / CS; let c = d < 2 ? ST[2] : ST[hh(x >> 3, y >> 3, sd) < 0.4 ? 4 : 3]; if (k > 0.3 && dith(x >> 1, y >> 1, (k - 0.3) * 1.5)) continue; px(x, y, c); }
    // ------------------------------------------------ 3) 광장 턱: 판석 (난간 밖) · 바깥 끝 갓돌 (밝은 모서리)
    for (let y = TT & ~1; y < lipB; y += 2) for (let x = lipL & ~1; x < lipR; x += 2) { if (x >= FL && x < FR && y < FB) continue; const e = Math.min(x - lipL, lipR - 2 - x, lipB - 2 - y); let c = e < 2 ? ST[1] : e < 4 ? ST[3] : (((x >> 4) + (y >> 4)) & 1) ? ST[3] : ST[4]; if (e >= 4 && (x % 16 === 0 || y % 16 === 0)) c = ST[5]; if (e >= 4 && hh(x >> 1, y >> 1, sd + 40) < 0.05) c = '#c8c2b6'; px(x, y, c); }
    // 재 더미 (난간 밑에 쌓인 흰 재 · 디더)
    for (let k = 0; k < 10; k++) { const side = k % 3, t = hh(k, 41, sd); const [cx, cy] = side === 0 ? [FL + 2, T + t * (B - T)] : side === 1 ? [FR - 2, T + t * (B - T)] : [L + t * (RR - L), FB + 2]; const r = 6 + hh(k, 42, sd) * 8;
      for (let dy = -r; dy <= r; dy += 2) for (let dx = -r * 1.4; dx <= r * 1.4; dx += 2) { const q = Math.hypot(dx / 1.4, dy) / r, x = (cx + dx) & ~1, y = (cy + dy) & ~1; if (q < 1 && inTer(x, y) && !(x >= L && x < RR && y < B) && dith(x >> 1, y >> 1, (1 - q) * 1.2)) px(x, y, q < 0.5 ? '#c8c2b6' : '#a8a296'); } }
    // ------------------------------------------------ 4) 돌다리 (아치 고가): 판석 길 · 양옆 낮은 난간 · 아래 아치 구멍
    // 계단: 광장 끝에서 한 단 아래 바닥으로 내려감 — 디딤판 앞 모서리 밝게 · 아래로 갈수록 어둡게 · 양옆 돌 난간벽
    const SL = 56;
    const stairsV = () => { const y0 = lipB - 2; for (let t = 0; t < SL; t += 2) { const y = y0 + t, step = Math.floor(t / 8), sv = t % 8, k = t / SL;
        for (let w = -BW; w < BW; w += 2) { const x = SX + w; let i = sv < 2 ? 0 : sv < 4 ? 2 : 3; i = Math.min(6, i + Math.floor(k * 3)); if (w <= -BW + 2) i = Math.min(6, i + 1); if (dith(x >> 1, y >> 1, Math.max(0, k - 0.6) * 2)) continue; px(x, y, ST[i]); }
        for (const [xx, cl] of [[SX - BW - 6, 1], [SX + BW, 3]]) for (let c = 0; c < 6; c += 2) if (!dith(xx >> 1, y >> 1, Math.max(0, k - 0.5) * 2)) px(xx + c, y, ST[Math.min(6, cl + (c === 4 ? 1 : 0) + Math.floor(k * 2))]); } };
    const stairsH = sgn => { const x0 = sgn < 0 ? lipL - 2 : lipR; for (let t = 0; t < SL; t += 2) { const x = x0 + sgn * t, sv = t % 8, k = t / SL;
        for (let w = -BW; w < BW; w += 2) { const y = PY + w; let i = sv < 2 ? 1 : sv < 4 ? 2 : 3; i = Math.min(6, i + Math.floor(k * 3)); if (dith(x >> 1, y >> 1, Math.max(0, k - 0.6) * 2)) continue; px(x, y, ST[i]); }
        for (const [yy, cl] of [[PY - BW - 6, 1], [PY + BW, 3]]) for (let c = 0; c < 6; c += 2) if (!dith(x >> 1, (yy + c) >> 1, Math.max(0, k - 0.5) * 2)) px(x, yy + c, ST[Math.min(6, cl + (c === 4 ? 1 : 0) + Math.floor(k * 2))]); } };
    if (dW) stairsH(-1); if (dE) stairsH(1); if (dS) stairsV();
    // ------------------------------------------------ 5) 돌벽 (윗벽과 같은 결): 갓돌 · 큰 벽돌 몸 · 밑돌 · 금테 두른 붙임기둥 — 그을음 · 금 간 돌
    const P4 = { h: '#8e887e', l: '#6e6860', d: '#4e4a44', D: '#34312d', j: '#1c1a1e', k: '#0b0a09', g: '#d8b860', G: '#a08038', o: '#6e5626' };
    // 아래 벽 (앞면)
    { const TS = PT, top = B - 2 + TS, base = FB - 6; // 위에서 보이는 벽 윗면(두께 = 좌우 벽과 같음) → 그 아래 앞면
      const hole = (x, y) => gapS(x) && holeS(x, y), pxW = (x, y, c) => { if (!hole(x, y)) px(x, y, c); }; // v3.29 남쪽 문 자리도 벽으로 메우고 아치 안쪽 구멍만 비움 (아치 뒤 · 벽 사이 빈틈 없앰)
      for (let x = FL & ~1; x < FR; x += 2) {
        pxW(x, top, P4.l); pxW(x, top + 2, P4.d); pxW(x, top + 4, P4.j); // 갓돌 앞면 · 처마 그늘
        for (let y = top + 6; y < base; y += 2) { const v = y - top - 6, row = Math.floor(v / 10), off = (row % 2) * 12, mx = (x - FL + off) % 24, my = v % 10, bx = Math.floor((x - FL + off) / 24);
          let c = mx === 0 || my === 8 ? P4.j : my === 0 ? P4.l : hh(bx, row, sd + 70) < 0.3 ? P4.D : P4.d; if (mx === 2 && my > 0 && my < 8) c = my < 4 ? P4.l : c;
          if (hh(bx, row, sd + 71) < 0.12 && my > 1 && my < 7 && (mx + my) % 6 === 0) c = P4.j; // 금
          if (my > 0 && my < 8 && mx > 2 && dith(x >> 1, y >> 1, Math.max(0, vn(x / 60, y / 40, sd + 72) - 0.68) * 1.2)) c = P4.D; // 옅은 그을음
          pxW(x, y, c); }
        for (let y = base; y < FB; y += 2) pxW(x, y, y === base ? P4.l : y === FB - 2 ? P4.k : P4.D); } // 밑돌
      for (const ex of [FL & ~1, (FR - 2) & ~1]) for (let y = top; y < FB; y += 2) pxW(ex, y, P4.k); // 양 끝 외곽선 (좌우 벽 외곽선과 이어짐)
      const pil = (x0, tall) => { const y0 = top - (tall ? 14 : 8); for (let y = y0; y < FB; y += 2) for (let c = 0; c < 12; c += 2) { let col = c === 0 ? P4.k : c === 2 ? P4.h : c < 8 ? P4.l : c === 8 ? P4.d : c === 10 ? P4.k : P4.d;
          const ring = (y - y0 < 6) || (y >= FB - 6 && y < FB - 2); if (ring && c > 0 && c < 10) col = c < 6 ? P4.g : c < 8 ? P4.G : P4.o; if (y === y0) col = c === 0 || c === 10 ? P4.k : P4.g; px(x0 + c, y, col); } };
      }
    // 벽 윗면 (위에서 본 갓돌) — 좌 · 우 · 아래를 한 덩어리로: 바깥 둘레만 외곽선, 모서리에서 끊기지 않음 · 큰 돌 이음 · 아래 벽 앞 모서리는 밝은 턱
    { const yT = (T - 104) & ~1, yB = (B - 2 + PT) & ~1, inL = (x, y) => x >= FL && x < FL + PT && y >= yT && y < yB && !gapW(y), inR = (x, y) => x >= RR + 4 && x < RR + 4 + PT && y >= yT && y < yB && !gapE(y), inB = (x, y) => x >= FL && x < FR && y >= B - 2 && y < yB && !(gapS(x) && holeS(x, y));
      const inW = (x, y) => inL(x, y) || inR(x, y) || inB(x, y);
      for (let y = yT; y < yB; y += 2) for (let x = FL & ~1; x < FR; x += 2) { if (!inW(x, y)) continue; let c;
        const out = !inW(x - 2, y) || !inW(x + 2, y) || !inW(x, y - 2), front = !inW(x, y + 2);
        if (!inW(x - 2, y) || !inW(x + 2, y)) c = P4.k; else if (front && y === yB - 2) c = P4.h; else if (out) c = P4.k; // 아래 앞 모서리는 밝은 턱, 나머지 둘레는 외곽선
        else { const bandB = y >= B - 2 && !(inL(x, y) || inR(x, y)) , jy = ((y - T) % 24 + 24) % 24, jx = (x - FL) % 24, corner = y >= B - 2 && (inL(x, y) || inR(x, y)), joint = corner ? false : bandB ? jx === 0 : jy === 0; // 모서리 돌은 이음 없이 한 덩어리
          const lit = !inW(x - 4, y) || !inW(x, y - 4); c = joint ? P4.j : lit ? P4.h : hh(Math.floor(bandB ? (x - FL) / 24 : (y - T) / 24), bandB ? 1 : 2, sd + 73) < 0.25 ? P4.D : P4.l; }
        px(x, y, c); } }
    LY.flush(g);
    // v3.28 좌 · 우 문 통로: 벽 틈을 막던 옛 옆문 그림 대신, 방 바닥(재 쌓인 바닥)이 턱 끝 계단까지 그대로 이어짐 · 통로 양옆은 벽 끝 외곽선 · 가장자리에 흰 재가 쌓임
    for (const [on, sg] of [[dW, -1], [dE, 1]]) { if (!on) continue;
      const x0 = sg < 0 ? lipL & ~1 : RR & ~1, x1 = sg < 0 ? L & ~1 : lipR & ~1, w = x1 - x0, y0 = (PY - PW - 2) & ~1, h = ((PY + PW + 4) & ~1) - y0, sx = sg < 0 ? L & ~1 : (RR - w) & ~1; // 문 앞(비워 둔 자리) 방 바닥
      g.drawImage(g.canvas, sx, y0, w, h, x0, y0, w, h); // 방 안 재 바닥을 떠서 통로에 깖
      const P = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 2, 2); };
      { const wx0 = sg < 0 ? FL & ~1 : (RR + 4) & ~1; for (let x = wx0; x < wx0 + PT; x += 2) { P(x, y0 - 2, '#0b0a09'); P(x, y0 + h, '#0b0a09'); } } // 외곽선은 측면 벽이 끊긴 끝에만 (재 바닥 · 턱에는 없음)
      const AL = ['#5e5952', '#77726a', '#948e84', '#aaa49a']; // 방 바닥 재 더께와 같은 색
      for (let y = y0; y < y0 + h; y += 2) for (let x = x0; x < x1; x += 2) { const e = Math.min(y - y0, y0 + h - 2 - y), out = sg < 0 ? (x1 - x) / w : (x - x0) / w; // 벽 쪽 가장자리 · 바깥쪽일수록 재가 두껍게 (디더)
        const lv = clamp(Math.max(0, 1 - e / 14) * 0.9 + out * 0.35 + (vn(x / 14, y / 10, sd + 91) - 0.5) * 0.5, 0, 1); if (!dith(x >> 1, y >> 1, lv)) continue;
        P(x, y, AL[lv > 0.8 ? 3 : lv > 0.55 ? 2 : lv > 0.3 ? 1 : 0]); } }
    // v3.29 낡은 벽: 불탄 왕도답게 — 위에서 흘러내린 그을음 · 금 · 깨진 벽돌 모서리 · 떨어져 나간 갓돌 · 턱과 밑동에 쌓인 재 (좌 · 우 · 아래 벽 + 윗벽)
    { const Q = (x, y, c) => { g.fillStyle = c; g.fillRect(x & ~1, y & ~1, 2, 2); }, SO = ['#1a1714', '#100e0c'], AS = ['#c8c2b6', '#a8a296', '#8a857c'], CK = '#0e0d0c', CKL = '#5a554e';
      const yT = (T - 104) & ~1, yB = (B - 2 + PT) & ~1, faceT = (B - 2 + PT + 6) & ~1, faceB = (FB - 6) & ~1;
      const inBand = (x, y) => ((x >= FL + 2 && x < FL + PT - 2) || (x >= RR + 6 && x < RR + 2 + PT)) && y >= yT + 4 && y < yB - 2 && !(gapW(y) && x < L) && !(gapE(y) && x > RR) || (x >= FL + 2 && x < FR - 2 && y >= B && y < yB - 2 && !gapS(x));
      const inFace = (x, y) => x >= FL + 2 && x < FR - 2 && y >= faceT && y < faceB && !gapS(x) && !(dS && Math.abs(x - SX) < PW + 10);
      const nDoor = R.doors && R.doors.n != null && !hiddenDoor(R, 'n'), slots = PILLARS.slice(0, -1).map((x, i) => (x + PILLARS[i + 1]) / 2);
      const inTop = (x, y) => x >= L + 2 && x < RR - 2 && y >= T - 96 && y < T - 8 && !PILLARS.some(p => Math.abs(x - p) < 14) && !(nDoor && Math.abs(x - DOOR.n.x) < 64) && !slots.some(m => Math.abs(x - m) < 24); // v3.29 창 자리 장식은 위아래 전체를 그을음 · 금에서 뺌
      const any = (x, y) => inBand(x, y) || inFace(x, y) || inTop(x, y);
      // 1) 그을음: 벽 위에서 아래로 흘러내린 얼룩 (디더 · 위가 진함)
      for (let y = yT; y < FB; y += 2) for (let x = (FL & ~1); x < FR; x += 2) { if (!(inFace(x, y) || inTop(x, y))) continue;
        const col = vn(x / 12, 0.5, sd + 200) * 0.7 + vn(x / 40, 1.5, sd + 201) * 0.3, y0 = inFace(x, y) ? faceT : T - 96, k = clamp((y - y0) / (inFace(x, y) ? 40 : 70), 0, 1), lv = Math.max(0, col - 0.58) * 3 * (1 - k * 0.85); // 좁은 줄기 · 위에서 아래로 옅어짐
        if (lv > 0 && dith(x >> 1, y >> 1, Math.min(0.85, lv))) Q(x, y, lv > 0.55 ? SO[1] : SO[0]); }
      // 2) 금: 벽돌 몇 장을 가로지르는 갈라짐 (어두운 줄 + 아래 밝은 턱)
      const crack = (x, y, n, sg) => { for (let i = 0; i < n; i++) { if (!any(x, y)) return; Q(x, y, CK); if (any(x + 2, y)) Q(x + 2, y, CKL); y += 2; x += hh(i, x, sd + 210) < 0.45 ? sg * 2 : hh(i, y, sd + 211) < 0.2 ? -sg * 2 : 0; } };
      for (let i = 0; i < 40; i++) { const x = (FL + hh(i, 1, sd + 212) * (FR - FL)) & ~1, y = (yT + hh(i, 2, sd + 212) * (FB - yT)) & ~1; if (any(x, y) && !inBand(x, y)) crack(x, y, 7 + Math.floor(hh(i, 3, sd + 212) * 8), hh(i, 4, sd + 212) < 0.5 ? -1 : 1); }
      // 3) 깨진 벽돌 모서리: 앞면 벽돌 귀퉁이가 떨어져 나가 속이 드러남 (어둠 + 위 밝은 테)
      for (let i = 0; i < 46; i++) { const x = (FL + hh(i, 5, sd + 220) * (FR - FL)) & ~1, y = (faceT + hh(i, 6, sd + 220) * (faceB - faceT)) & ~1, w = 6 + Math.floor(hh(i, 7, sd + 220) * 3) * 2, sg = hh(i, 8, sd + 220) < 0.5 ? -1 : 1;
        for (let j = 0; j < w; j += 2) for (let k = 0; k < w - j; k += 2) { const xx = x + sg * k, yy = y + j; if (!inFace(xx, yy)) continue; Q(xx, yy, k === w - j - 2 ? CKL : j === 0 ? '#2a2724' : '#1c1a18'); } }
      for (let i = 0; i < 26; i++) { const x = (L + hh(i, 9, sd + 221) * (RR - L)) & ~1, y = (T - 90 + hh(i, 10, sd + 221) * 76) & ~1, w = 4 + Math.floor(hh(i, 11, sd + 221) * 2) * 2;
        for (let j = 0; j < w; j += 2) for (let k = 0; k < w - j; k += 2) { if (!inTop(x + k, y + j)) continue; Q(x + k, y + j, k === w - j - 2 ? CKL : '#1c1a18'); } }
      // 4) 떨어져 나간 갓돌: 벽 윗면 앞 모서리 · 바깥 모서리가 군데군데 이 빠짐
      for (let i = 0; i < 18; i++) { const x = (FL + 6 + hh(i, 12, sd + 230) * (FR - FL - 12)) & ~1, w = 4 + Math.floor(hh(i, 13, sd + 230) * 4) * 2, d = 2 + Math.floor(hh(i, 14, sd + 230) * 2) * 2; if (dS && Math.abs(x - SX) < PW + 20) continue;
        for (let k = 0; k < w; k += 2) for (let j = 0; j < d - (k === 0 || k === w - 2 ? 2 : 0); j += 2) Q(x + k, yB - 2 - j, j === 0 ? P4.k : '#2a2724'); }
      // 5) 재: 벽 윗면 · 밑동 · 앞면 줄눈 턱에 쌓인 흰 재 (디더)
      for (let y = yT; y < FB + 4; y += 2) for (let x = (FL & ~1); x < FR; x += 2) { let lv = 0;
        if (inBand(x, y)) lv = Math.max(0, vn(x / 16, y / 16, sd + 240) - 0.5) * 1.6;
        else if (y >= FB - 8 && y < FB + 4 && x >= FL && x < FR && !(dS && Math.abs(x - SX) < PW + 8)) lv = Math.max(0, vn(x / 12, 1, sd + 241) - 0.3) * (1 - (FB + 4 - y) / 12) * 1.6;
        else if (inFace(x, y) && hh(x >> 1, y >> 1, sd + 242) < 0.05 && ((y - faceT) % 10) === 6) lv = 1; // 벽돌 줄눈 턱에 얹힌 재 알갱이
        if (lv > 0 && dith(x >> 1, y >> 1, Math.min(0.9, lv))) Q(x, y, lv > 0.7 ? AS[0] : lv > 0.4 ? AS[1] : AS[2]); } }
    R._out4 = { bars: [dW && 'w', dE && 'e', dS && 's'].filter(Boolean) };
  }
  { const o = paintRoomFloor; paintRoomFloor = function (R) { const r = o.apply(this, arguments); if (on4(R)) withSeed((R.seed || 1) + 991, () => paint(fg, R)); return r; }; }
  // 좌 · 우 · 아래 문틀은 그리지 않음 (난간 기둥과 돌다리가 대신) · v3.29 북문도 성채 아치를 그리지 않음 — 4장 아치(23_sr4.js)가 보이게 해 남쪽 문과 같은 디자인
  { const o = paintDoorCastle; paintDoorCastle = function (g, d) { if (on4(G && G.dun && G.dun.cur)) return; return o.apply(this, arguments); }; }
  // 남쪽 문: 윗문과 같은 아치(왕관 쐐기돌) — 아래 벽 앞면에 서서 벽 위로 솟음 · 앞 레이어(아치 안쪽은 비워 지나가는 모습이 보이게)
  let ARCH = null, AGATE = null, ARCHM = null;
  function holeS(x, y) { if (!ARCHM) archInit(); const p = archPos(), ry = (y - p.y) & ~1; if (ry >= SR4.cv('arch').height) return true; if (ry < 0) return false; const m = ARCHM[ry >> 1]; return !!m && m[1] >= 0 && ry > 10 && x - p.x >= m[1] && x - p.x <= m[2]; } // 아치 안쪽 구멍 (지나가는 길)
  function archInit() { const src = SR4.cv('arch'), Wd = src.width, Ht = src.height, [c, g] = mkCanvas(Wd, Ht); g.drawImage(src, 0, 0); const id = g.getImageData(0, 0, Wd, Ht), dd = id.data;
    const dark = (r, gg, b) => r < 64 && gg < 56 && b < 48 && Math.abs(r - b) < 30; // v3.29 아치 안 바닥(어두운 갈색)까지 구멍으로 — 닫힌 창살이 바닥까지 내려와 떠 보이지 않게 // 아치 안쪽 어둠(C · c)
    const mask = []; for (let y = 0; y < Ht; y += 2) { let a = -1, b = -1; for (let x = 0; x < Wd; x += 2) { const o = (y * Wd + x) * 4; if (dd[o + 3] && dark(dd[o], dd[o + 1], dd[o + 2]) && x > 8 && x < Wd - 8) { if (a < 0) a = x; b = x; } } mask.push([y, a, b]); }
    for (const [y, a, b] of mask) if (a >= 0 && y > 10) for (let x = a; x <= b; x += 2) for (let k = 0; k < 2; k++) { const o = ((y + k) * Wd + x) * 4; dd[o + 3] = 0; dd[o + 4 + 3] = 0; }
    g.putImageData(id, 0, 0); ARCH = c; ARCHM = mask;
    // 내리닫이 쇠창살 (북문 것과 같은 결): 세로 창살 · 가로띠 셋 · 아래 창끝 · 가운데 왕관 판
    const r0 = mask.find(m => m[1] >= 0)[0], gH = Ht - r0, [gc, gg] = mkCanvas(Wd, gH), P = (x, y, col) => { gg.fillStyle = col; gg.fillRect(x, y, 2, 2); }, path = new Path2D();
    for (const [y, a, b] of mask) if (a >= 0) path.rect(a, y - r0, b - a + 2, 2);
    for (let y = 0; y < gH; y += 2) for (let x = 0; x < Wd; x += 2) { const m = (x >> 1) % 3, band = y === 10 || y === gH - 18 || y === Math.round(gH * 0.48 / 2) * 2; if (y >= gH - 4) { if (m === 0) P(x, y, y === gH - 2 ? '#2e2d34' : '#55535c'); continue; } if (band) P(x, y, m === 0 ? '#8a8894' : '#55535c'); else if (m === 0) P(x, y, '#8a8894'); else if (m === 1) P(x, y, '#2e2d34'); }
    { const cx = Wd / 2 & ~1, cy = Math.round(gH * 0.48 / 2) * 2 - 10; for (const [dx, dy, col] of [[-4, 0, '#c8a850'], [0, 0, '#c8a850'], [4, 0, '#c8a850'], [-4, 2, '#c8a850'], [-2, 2, '#8a6a30'], [0, 2, '#c8a850'], [2, 2, '#8a6a30'], [4, 2, '#c8a850'], [-4, 4, '#8a6a30'], [-2, 4, '#c8a850'], [0, 4, '#ff9a40'], [2, 4, '#c8a850'], [4, 4, '#5a4620']]) P(cx + dx, cy + dy, col); }
    AGATE = { c: gc, path, r0, H: gH }; }
  const archPos = () => { const { SX } = geo(), s = SR4.cv('arch'); return { x: (SX - s.width / 2) & ~1, y: (A.y1 + BH - s.height) & ~1 }; };
  function gateS(k) { if (!AGATE) archInit(); if (k <= 0) return; const p = archPos(), off = Math.round(AGATE.H * (1 - k) / 2) * 2; ctx.save(); ctx.translate(p.x, p.y + AGATE.r0); ctx.clip(AGATE.path); ctx.drawImage(AGATE.c, 0, -off); ctx.restore(); }
  { const o = roomEnts; roomEnts = function (list) { o(list); const R = G && G.dun && G.dun.cur; if (!on4(R) || !R._out4 || !R._out4.bars.includes('s')) return; if (!ARCH) archInit(); const p = archPos();
      list.push({ y: A.y1 + 12, d: () => { const st = doorState(R, 's'); gateS(st === 'boss' ? gateK() : G.sealAnim || 0); ctx.drawImage(ARCH, p.x, p.y); } }); }; }
  // 좌우 문: 북문 쇠창살을 90도 눕힌 모양 — 위로 올라가는 대신 바깥쪽 벽 속으로 밀려 들어감 (닫힐 땐 벽에서 미끄러져 나와 틈을 막음 · 창끝은 방 쪽)
  let SGATE = null;
  function sideGateInit() { const w = PT + 6, h = PW * 2 + 8, [c, g] = mkCanvas(w, h), P = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 2, 2); };
    for (let x = 0; x < w; x += 2) for (let y = 0; y < h; y += 2) { const m = (y >> 1) % 3, band = x === 2 || x === w - 8; if (x >= w - 4) { if (m === 0) P(x, y, x === w - 2 ? '#2e2d34' : '#55535c'); continue; } // 창끝 (방 쪽)
      if (band) P(x, y, m === 0 ? '#8a8894' : '#55535c'); else if (m === 0) P(x, y, '#8a8894'); else if (m === 1) P(x, y, '#2e2d34'); }
    { const cx = (w / 2 - 2) & ~1, cy = (h / 2) & ~1; for (const [dx, dy, col] of [[0, -4, '#c8a850'], [0, 0, '#c8a850'], [0, 4, '#c8a850'], [2, -4, '#c8a850'], [2, -2, '#8a6a30'], [2, 0, '#c8a850'], [2, 2, '#8a6a30'], [2, 4, '#c8a850'], [4, -4, '#8a6a30'], [4, -2, '#c8a850'], [4, 0, '#ff9a40'], [4, 2, '#c8a850'], [4, 4, '#5a4620']]) P(cx + dx, cy + dy, col); }
    const [cf, gf] = mkCanvas(w, h); gf.translate(w, 0); gf.scale(-1, 1); gf.drawImage(c, 0, 0); SGATE = { w: c, e: cf, W: w, H: h }; } // e: 창끝이 왼쪽(방 쪽)
  function sideGate(d, k) { if (!SGATE) sideGateInit(); if (k <= 0) return; const { L, RR, PY } = geo(), vis = Math.round(SGATE.W * Math.min(1, k) / 2) * 2, y = (PY - SGATE.H / 2) & ~1;
    if (d === 'w') { const x0 = (L - 2 - SGATE.W) & ~1; ctx.drawImage(SGATE.w, SGATE.W - vis, 0, vis, SGATE.H, x0 + SGATE.W - vis - (SGATE.W - vis), y, vis, SGATE.H); }
    else { const x0 = (RR + 2) & ~1; ctx.drawImage(SGATE.e, 0, 0, vis, SGATE.H, x0 + (SGATE.W - vis), y, vis, SGATE.H); } }
  { const o = drawSideLeaves; drawSideLeaves = function (d, k) { if (on4(G && G.dun && G.dun.cur)) return sideGate(d, k); return o.apply(this, arguments); }; }
  { const o = drawSeal; drawSeal = function (d, k) { if (d === 's' && on4(G && G.dun && G.dun.cur)) return; return o.apply(this, arguments); }; } // 남쪽 쇠창살은 앞 레이어(아치)에서 그림
  // 좌 · 우 문 횃불은 난간 안쪽으로
  { const o = gateParts; gateParts = function (d) { const r = o.apply(this, arguments); const R = G && G.dun && G.dun.cur; if (!on4(R) || (d !== 'w' && d !== 'e')) return r;
      const dx = d === 'w' ? 14 : -14; r.parts.forEach((q, i) => { q.x = (q.x + dx) & ~1; if (r.flames[i]) r.flames[i].x += dx; }); return r; }; }
  // v3.28 아래 벽은 캐릭터 · 적 · 시체와 남쪽 문 횃대를 가림: 벽 윗면 외곽선(A.y1 - 2)부터 아래로는 그리지 않음 (남쪽 문 틈은 열어 둠)
  const BLINE = () => A.y1 - 2;
  { const o = sideClip; sideClip = function (fn) { const R = G && G.dun && G.dun.cur; if (!on4(R)) return o(fn);
      return o(() => { ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - 200, A.y0 - 600, A.x1 - A.x0 + 400, BLINE() - (A.y0 - 600));
        if (R._out4 && R._out4.bars.includes('s')) { const { SX } = geo(); ctx.rect(SX - PW - 4, BLINE(), (PW + 4) * 2, 200); }
        ctx.clip(); try { return fn(); } finally { ctx.restore(); } }); }; }
  const CUT = new Map(); // 남쪽 문 횃대: 벽 윗면 아래는 잘라 낸 그림 (벽 뒤에 선 모습 · 잘린 자리는 벽 윗면 외곽선이 마감)
  { const o = gateParts; gateParts = function (d) { const r = o.apply(this, arguments); const R = G && G.dun && G.dun.cur; if (d !== 's' || !on4(R)) return r;
      const DN = 6; r.parts.forEach(q => { q.y += DN; q.sy += DN; }); r.flames.forEach(f => { f.y += DN; }); // v3.28 남쪽 문 횃대를 3칸 아래로
      r.parts = r.parts.map(q => { const h = Math.max(0, BLINE() - q.y) & ~1; if (h >= q.c.height) return q; const k = q.c.width + 'x' + q.c.height + ':' + h + ':' + G.stage; let c = CUT.get(k);
        if (!c || c.src !== q.c) { const [cc, g] = mkCanvas(q.c.width, Math.max(2, h)); g.drawImage(q.c, 0, 0); cc.src = q.c; CUT.set(k, cc); c = cc; } return Object.assign({}, q, { c }); });
      return r; }; }
  return { paint, wide: () => on4(G && G.dun && G.dun.cur), set on(v) { ON = v; }, get on() { return ON; } };
})();
