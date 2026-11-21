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
