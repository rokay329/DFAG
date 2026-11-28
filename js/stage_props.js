'use strict';
// 잿빛 왕관 원정대 · stage_props.js — 합친 파일: 18_scenery.js, 19_scenery34.js, 11e_truth3.js, 20_occupancy.js, 21_ash4.js, 22_house4.js, 23_sr4.js, 24_wall4.js, 25_habi_ult.js, 26_casings.js (v3.84 파일 정리 · typeof로 먼저 확인하는 이름 몇 개는 var로 선언)

// ==================================================================== 18_scenery.js
// 잿빛 왕관 토벌대 — 18_scenery.js : v2.81 1·2장 배경 · 장애물 다시 그림 (나무 4종 · 덤불 울타리 · 연못 · 구덩이 · 벽 덩어리 · 바닥 판석 · 깔개 · 융단)
(() => {
  const R2 = (x, y, s = 0) => { const v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.7) * 43758.5453; return v - Math.floor(v); };
  Object.assign(TRUNK, { u: '#5e4630', U: '#140d07', W: '#f2ece0', X: '#5a5448', m: '#3e6a2c', M: '#6a9a44' });

  // ---------------- 나무 4종 ----------------
  const crown = (g, set, Wd, Ht, cx, cy, rx, ry, rr, n, sd) => {
    // 잎 뭉치를 여러 개 겹쳐 둥근 수관을 만든다: 뭉치마다 왼쪽 위 빛 · 겹친 곳은 그늘 · 잎 점
    const cl = [];
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), d = Math.sqrt(Math.random()); cl.push({ x: cx + Math.cos(a) * rx * d * 0.78, y: cy + Math.sin(a) * ry * d * 0.78, r: rand(rr[0], rr[1]) }); }
    cl.push({ x: cx, y: cy - ry * 0.55, r: rr[1] }); cl.push({ x: cx - rx * 0.6, y: cy, r: rr[1] * 0.9 }); cl.push({ x: cx + rx * 0.6, y: cy + 1, r: rr[1] * 0.9 }); cl.push({ x: cx, y: cy + ry * 0.55, r: rr[1] });
    cl.sort((a, b) => a.y - b.y);
    const own = Array.from({ length: Ht }, () => Array(Wd).fill(-1));
    cl.forEach((c, ci) => { for (let y = Math.floor(c.y - c.r - 1); y <= c.y + c.r + 1; y++) for (let x = Math.floor(c.x - c.r - 1); x <= c.x + c.r + 1; x++) {
      const dx = x - c.x, dy = y - c.y, d = Math.hypot(dx, dy), an = Math.atan2(dy, dx), edge = c.r * (1 + 0.12 * Math.sin(an * 5 + ci));
      if (d > edge || y < 1 || y >= Ht || x < 1 || x >= Wd - 1) continue;
      const loc = (dx * 0.7 + dy * 0.8) / c.r, glob = ((x - cx) / rx * 0.5 + (y - cy) / ry * 0.7);
      let t = loc * 0.65 + glob * 0.55; let ch = t < -0.45 ? 'h' : t < 0.05 ? 'l' : t < 0.5 ? 'd' : 'D';
      if (d > edge - 1.1 && own[y][x] >= 0 && own[y][x] !== ci) ch = 'D';
      set(x, y, ch); own[y][x] = ci; } });
    for (let y = 1; y < Ht; y++) for (let x = 1; x < Wd - 1; x++) { const c = g[y][x]; if (c === 'l' && R2(x, y, sd) < 0.16) g[y][x] = 'h'; else if (c === 'd' && R2(x, y, sd + 1) < 0.18) g[y][x] = 'D'; else if (c === 'h' && R2(x, y, sd + 2) < 0.12) g[y][x] = 'l'; }
  };
  genTree = function (kind) {
    const Wd = kind === 'pine' ? 17 : kind === 'dead' ? 21 : kind === 'birch' ? 17 : 25, Ht = kind === 'pine' ? 34 : kind === 'dead' ? 30 : kind === 'birch' ? 34 : 32;
    const g = Array.from({ length: Ht }, () => Array(Wd).fill('.')), cx = Math.floor(Wd / 2), sd = rand(0, 99);
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && x < Wd - 1 && y >= 1 && y < Ht) g[y][x] = c; };
    const bark = (x0, y0, x1, y1, w) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) || 1; for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, ww = w * (1 - t * 0.5); for (let k = -Math.floor(ww / 2); k <= Math.ceil(ww / 2) - (ww < 1.5 ? 1 : 0); k++) set(x + k, y, k < 0 ? 'u' : k === 0 ? 't' : 'T'); } };
    if (kind === 'dead') { // 고사목: 굵게 비틀린 줄기 · 갈라지는 가지 · 옹이 구멍 · 가끔 까마귀
      const br = (x, y, a, len, w, dep) => { const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len; bark(x, y, x1, y1, w); if (dep <= 0) return; br(x1, y1, a - rand(0.35, 0.75), len * rand(0.55, 0.75), Math.max(1, w * 0.6), dep - 1); br(x1, y1, a + rand(0.35, 0.75), len * rand(0.55, 0.75), Math.max(1, w * 0.6), dep - 1); if (Math.random() < 0.4) br(x1, y1, a + rand(-0.2, 0.2), len * 0.5, 1, 0); };
      br(cx, Ht - 1, -Math.PI / 2 + rand(-0.12, 0.12), 12, 3.5, 3);
      for (const [dx, c] of [[-3, 'u'], [-2, 't'], [2, 'T'], [3, 'T']]) set(cx + dx, Ht - 1, c); set(cx - 2, Ht - 2, 'u'); set(cx + 2, Ht - 2, 'T');
      set(cx, Ht - 7, 'U'); set(cx, Ht - 6, 'U'); // 옹이 구멍
      for (let y = Ht - 10; y < Ht - 1; y += 3) set(cx + 1, y, 'U');
      if (Math.random() < 0.6) { const by = randi(6, 12); for (let x = 0; x < Wd; x++) if ('tTu'.includes(g[by][x])) { set(x, by - 1, 'c'); set(x + 1, by - 1, 'c'); set(x, by - 2, 'c'); set(x + 1, by - 2, 'e'); break; } }
    } else if (kind === 'pine') { // 전나무: 아래로 처진 톱니 끝 6단 · 단마다 아래 그늘 · 왼쪽 빛 · 밑동
      for (let y = Ht - 7; y < Ht; y++) { set(cx - 1, y, 'u'); set(cx, y, 't'); set(cx + 1, y, 'T'); }
      set(cx - 2, Ht - 1, 'u'); set(cx + 2, Ht - 1, 'T');
      const tiers = 5; // 아래 단부터 그려서 위 단의 톱니 끝이 아래 단을 덮게
      for (let tr = tiers - 1; tr >= 0; tr--) { const top = 1 + tr * 5, h = 9, w0 = 3.2 + tr * 1.0;
        for (let y = 0; y < h; y++) { const hw = Math.min(cx - 1, Math.round((y + 1) / h * w0)), saw = y === h - 1;
          for (let x = -hw; x <= hw; x++) { if (saw && (x + tr) % 2) continue; const t = x / Math.max(1, hw);
            set(cx + x, top + y, y === 0 && x === 0 ? 'h' : t < -0.45 ? (y < h - 2 ? 'h' : 'l') : t < 0.05 ? 'l' : t < 0.6 ? 'd' : 'D'); } }
        const hw = Math.min(cx - 1, Math.round(w0)); for (let x = -hw + 1; x <= hw - 1; x++) if (g[top + h] && g[top + h][cx + x] !== '.' && (x + tr) % 2 === 0) set(cx + x, top + h, 'D'); } // 단 아래 그늘
      for (let y = 4; y < Ht - 8; y++) for (let x = 1; x < Wd - 1; x++) if (g[y][x] === 'l' && R2(x, y, sd) < 0.12) g[y][x] = 'h';
    } else if (kind === 'birch') { // 자작나무: 흰 줄기의 검은 무늬 · 가는 가지 · 밝은 잎 뭉치
      const lean = rand(-0.06, 0.06);
      for (let y = Ht - 16; y < Ht; y++) { const x = cx + (Ht - y) * lean; set(x, y, 'W'); set(x + 1, y, (y % 5 === 0) ? 'X' : 'w'); if (y % 6 === 2) { set(x, y, 'x'); set(x + 1, y, 'x'); } }
      set(cx - 1, Ht - 1, 'W'); set(cx + 2, Ht - 1, 'w');
      bark(cx + 1, Ht - 13, cx + 5, Ht - 18, 1); bark(cx, Ht - 15, cx - 4, Ht - 19, 1);
      crown(g, set, Wd, Ht, cx + 0.5, 11, 6.2, 9, [2.4, 3.4], 12, sd);
      for (let y = 1; y < Ht; y++) for (let x = 1; x < Wd - 1; x++) if (g[y][x] === 'D' && R2(x, y, sd + 3) < 0.22) g[y][x] = '.'; // 빛이 새는 틈
    } else { // 둥근 활엽수: 뿌리 뻗은 줄기 · 갈라지는 가지 · 잎 뭉치 수관
      const tH = 10;
      for (let y = Ht - tH; y < Ht; y++) { set(cx - 1, y, 'u'); set(cx, y, 't'); set(cx + 1, y, 'T'); if (y % 4 === 1) set(cx, y, 'U'); }
      for (const [dx, dy, c] of [[-3, 0, 'u'], [-2, 0, 't'], [-2, -1, 'u'], [2, 0, 'T'], [3, 0, 'T'], [2, -1, 'T'], [4, 0, 'T']]) set(cx + dx, Ht - 1 + dy, c);
      bark(cx, Ht - tH, cx - 4, Ht - tH - 5, 2); bark(cx, Ht - tH, cx + 4, Ht - tH - 6, 2);
      crown(g, set, Wd, Ht, cx + 0.5, Ht - tH - 9, 11, 9.5, [3, 4.4], 14, sd);
      for (const [dx, dy] of [[-3, 3], [4, 2], [0, 5]]) { const x = cx + dx, y = Ht - tH - 9 + dy; if (g[y] && g[y][x] !== '.') { set(x, y, 'T'); set(x + 1, y, 'U'); } } // 잎 사이로 보이는 가지
      for (let x = cx - 3; x <= cx + 3; x++) set(x, Ht - tH, g[Ht - tH][x] === '.' ? 'D' : g[Ht - tH][x]);
    }
    const out = g.map(r => r.slice());
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g[y + b] && g[y + b][x + a] && g[y + b][x + a] !== '.')) out[y][x] = 'k';
    return out.map(r => r.join(''));
  };

  // ---------------- 덤불 울타리 ----------------
  Object.assign(LEAF, { u: '#5e4630', U: '#140d07' });
  genHedge = function (wc, hc) {
    // 윗면은 잎 뭉치(왼쪽 위 빛), 앞면은 세로로 늘어진 잎결과 짙은 그늘, 밑동엔 드러난 가지 · 뿌리 · 풀
    const HH = 9, W0 = wc + 4, H0 = hc + HH + 4, g = mkGrid(W0, H0), set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && x < W0 - 1 && y >= 1 && y < H0 - 1) g[y][x] = c; };
    const topH = hc + 3, sd = rand(0, 99);
    // 앞면
    for (let x = 2; x < W0 - 2; x++) { const bot = H0 - 3 - (R2(x, 1, sd) < 0.3 ? 1 : 0); for (let y = topH - 1; y <= bot; y++) { const v = (y - topH) / (bot - topH); let c = v < 0.25 ? 'l' : v < 0.6 ? 'd' : 'D'; if ((x * 3 + (y >> 1)) % 5 === 0 && v < 0.8) c = c === 'l' ? 'h' : c === 'd' ? 'l' : 'd'; if ((x + y * 2) % 7 === 0) c = 'D'; set(x, y, c); } }
    // 윗면: 잎 뭉치
    crown(g, set, W0, H0, W0 / 2, topH / 2 + 2.2, W0 / 2 - 3.5, topH / 2 - 0.8, [3.6, 5.2], Math.round(W0 * topH / 16), sd);
    // 위아래 경계 그늘 · 처진 잎끝
    for (let x = 2; x < W0 - 2; x++) { let y = topH + 2; while (y < H0 - 2 && g[y][x] === '.') y++; if (g[topH + 1] && g[topH + 1][x] !== '.' && R2(x, 7, sd) < 0.6) set(x, topH + 2, 'D'); if (x % 3 === 0) set(x, topH + 3, 'l'); }
    // 꽃 송이
    const fl = pick(['r', 'y', 'p']);
    for (let k = 0, tr = 0; k < Math.max(1, Math.round(W0 * H0 / 240)) && tr < 80; tr++) { const x = randi(3, W0 - 4), y = randi(2, topH); if (!'hl'.includes(g[y][x])) continue; for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) if ('hl'.includes(g[y + dy][x + dx])) g[y + dy][x + dx] = dx || dy ? fl : 'y'; k++; }
    // 밑동: 드러난 가지 · 뿌리 · 풀
    for (let x = 3; x < W0 - 3; x += randi(4, 7)) { for (let y = H0 - 5; y <= H0 - 3; y++) set(x, y, y === H0 - 3 ? 'T' : 'u'); set(x + 1, H0 - 3, 'T'); }
    for (let x = 2; x < W0 - 2; x++) if (R2(x, 3, sd) < 0.35) { set(x, H0 - 2, 'l'); if (R2(x, 4, sd) < 0.5) set(x, H0 - 3, 'h'); }
    return { g: gOutline(g), HH };
  };

  // ---------------- 연못: 물가 진흙 테 · 얕은 물 띠 · 물결 고리 · 반짝임 · 꽃 핀 수련 ----------------
  const _pond = genPond;
  Object.assign(POND_PAL, { s: '#8ab0c8', S: '#2a5a80', F: '#e080b0' });
  genPond = function (wc, hc, style = 'clear', shape = 'blob') {
    const g = _pond(wc, hc, style, shape), H0 = g.length, W0 = g[0].length;
    const water = c => 'Ww'.includes(c);
    const sh = [];
    for (let y = 1; y < H0 - 1; y++) for (let x = 1; x < W0 - 1; x++) {
      if (!water(g[y][x]) || y <= H0 / 2) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, 2]].some(([a, b]) => gAt(g, x + a, y + b) === 'k' || gAt(g, x + a, y + b) === '.')) sh.push([x, y]); // 아래쪽 물가 얕은 물 (2칸 띠)
    }
    if (style !== 'swamp') for (const [x, y] of sh) g[y][x] = 'S';
    if (style !== 'swamp') {
      for (let i = 0; i < wc * hc / 140 + 1; i++) { const cx = randi(5, W0 - 6), cy = randi(5, H0 - 5), r = randi(2, 3); for (let a = 0; a < 12; a++) { const x = Math.round(cx + Math.cos(a / 12 * TAU) * r * 1.6), y = Math.round(cy + Math.sin(a / 12 * TAU) * r * 0.7); if (water(gAt(g, x, y)) && a % 2 === 0) g[y][x] = 'h'; } }
      for (let i = 0; i < wc * hc / 220 + 2; i++) { const x = randi(4, W0 - 6), y = randi(4, Math.round(H0 * 0.45)); if (water(g[y][x]) && water(g[y][x + 1])) { g[y][x] = 's'; g[y][x + 1] = 'h'; } }
      for (let i = 0; i < wc * hc / 160 + 1; i++) { const x = randi(4, W0 - 5), y = randi(5, H0 - 5); if (water(g[y][x]) && water(g[y][x + 1]) && water(g[y + 1][x])) { g[y][x] = 'i'; g[y][x + 1] = 'I'; g[y + 1][x] = 'I'; if (Math.random() < 0.6) g[y][x] = 'F'; } }
    }
    return g;
  };

  // ---------------- 구덩이 ----------------
  Object.assign(CHASM_PAL, { H: '#7a7488', P: '#5a2e88', q: '#22122e', m: '#3a5226', M: '#567234' });
  genChasm = function (wc, hc) {
    // 위 테: 깨진 돌 테두리(윗면 빛 · 앞면) / 안쪽 먼 벽: 벽돌 줄이 아래로 갈수록 어둠에 잠김 / 늘어진 이끼 · 뿌리 / 바닥 없는 어둠 속 보랏빛 / 가까운 테는 얇은 턱
    const W0 = wc + 2, H0 = hc + 2, g = mkGrid(W0, H0), sd = rand(0, 99);
    const inside = (x, y) => { const ex = Math.min(x - 1, wc - x), ey = Math.min(y - 1, hc - y); return ex >= 0 && ey >= 0 && !(ex + ey < 2 && ex < 2 && ey < 2 && ex + ey < 1.5); };
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) {
      if (!inside(x, y)) continue;
      const dy = y - 3;
      let c;
      if (y <= 2) c = y === 1 ? (R2(x, 0, sd) < 0.15 ? 'l' : 'H') : 'h';              // 위 테 윗면
      else if (y === hc) c = R2(x, 9, sd) < 0.2 ? 'd' : 'l';                         // 아래 턱
      else if (x === 1 || x === wc) c = dy < 6 ? 'l' : 'd';                           // 옆 테
      else if (dy < 10) { const off = (Math.floor(dy / 2) % 2) * 3, mort = dy % 2 === 1 || (x + off) % 6 === 0; c = dy < 2 ? (mort ? 'd' : 'h') : dy < 4 ? (mort ? 'D' : 'l') : dy < 6 ? (mort ? 'K' : (dith(x, y, 0.6) ? 'l' : 'd')) : dy < 8 ? (mort ? 'K' : (dith(x, y, 0.5) ? 'd' : 'D')) : (dith(x, y, 0.4) ? 'D' : 'K'); }
      else c = 'K';
      g[y][x] = c;
    }
    // 위 테 앞면 그늘 한 줄 · 깨진 테
    for (let x = 2; x < wc; x++) { if (g[3][x] && g[3][x] !== '.') g[3][x] = 'D'; if (R2(x, 2, sd) < 0.12) { g[1][x] = '.'; g[2][x] = 'l'; } }
    // 늘어진 이끼 · 뿌리
    for (let k = 0; k < Math.max(1, wc / 9); k++) { const x = randi(3, wc - 2), L = randi(3, 7); for (let j = 0; j < L; j++) { const y = 3 + j; if (g[y] && g[y][x] !== '.') g[y][x] = j < L - 1 ? (j % 2 ? 'm' : 'M') : 'm'; } }
    // 어둠 속 보랏빛 (아래로 갈수록 짙게)
    for (let i = 0; i < wc * hc / 40; i++) { const x = randi(3, wc - 2), y = randi(Math.min(hc - 2, 12), hc - 1); if (g[y][x] === 'K') g[y][x] = R2(x, y, sd) < 0.3 ? 'P' : 'q'; }
    for (let y = Math.max(12, hc - 6); y < hc; y++) for (let x = 2; x < wc; x++) if (g[y][x] === 'K' && dith(x, y, (y - (hc - 6)) / 10)) g[y][x] = 'q';
    // 돌 부스러기 (위 테 위)
    for (let i = 0; i < wc / 10; i++) { const x = randi(2, wc - 2); if (g[1][x] !== '.') { g[1][x] = 'H'; if (g[1][x + 1] !== '.') g[1][x + 1] = 'd'; } }
    return gOutline(g);
  };

  // ---------------- 벽 덩어리 ----------------
  Object.assign(STONE, { H: '#7a7488' });
  genWallBlock = function (wc, hc) {
    // 위: 모서리 깎인 덮개돌(빛 테 · 그늘 테 · 금 · 이끼 · 풀) / 처마 / 앞: 벽돌마다 위 빛 · 아래 그늘 · 줄눈, 깨진 벽돌 · 빠진 자리 · 담쟁이 잎 · 밑동 돌 조각
    const HH = 12, W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0), sd = rand(0, 99);
    for (let y = 1; y <= hc;) { const rh = randi(3, 5); let x = 1;
      while (x <= wc) { const w = randi(5, 9), ye = Math.min(y + rh - 1, hc), xe = Math.min(x + w - 1, wc), v = Math.random();
        for (let yy = y; yy <= ye; yy++) for (let xx = x; xx <= xe; xx++) { const top = yy === y, left = xx === x, right = xx === xe, bot = yy === ye;
          g[yy][xx] = right || bot ? 'D' : top || left ? (v < 0.5 ? 'H' : 'h') : (v < 0.3 ? 'h' : v < 0.85 ? 'l' : 'd'); }
        if (w > 5 && Math.random() < 0.3) { let cx = x + randi(1, w - 2), cy = y + 1; for (let k = 0; k < rh - 1; k++) { if (g[cy] && cy <= ye && g[cy][cx] !== 'D') g[cy][cx] = 'K'; cx += pick([-1, 0, 1]); cy++; } }
        x += w; }
      y += rh; }
    for (let k = 0; k < Math.max(1, wc * hc / 120); k++) { const mx = randi(2, wc - 1), my = randi(2, hc - 1); for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) if (g[my + dy] && g[my + dy][mx + dx] && 'hlH'.includes(g[my + dy][mx + dx]) && R2(mx + dx, my + dy, sd) < 0.6) g[my + dy][mx + dx] = R2(dx, dy, sd) < 0.5 ? 'M' : 'm'; }
    for (let x = 1; x <= wc; x++) { g[hc][x] = x % 7 === 0 ? 'l' : 'H'; g[hc + 1][x] = 'K'; }
    for (let row = 0, y = hc + 2; y <= hc + HH; row++, y += 3) { let x = 1 - (row % 2) * randi(1, 3);
      while (x <= wc) { const w = randi(3, 6), v = Math.random(), miss = Math.random() < 0.05, chip = Math.random() < 0.15;
        for (let xx = Math.max(1, x); xx < Math.min(x + w, wc + 1); xx++) for (let yy = y; yy < Math.min(y + 2, hc + HH + 1); yy++) {
          const last = xx === x + w - 1; let c = last ? 'K' : yy === y ? (v < 0.25 ? 'h' : v < 0.75 ? 'l' : 'd') : (v < 0.6 ? 'd' : 'D');
          if (!last && yy === y && xx === Math.max(1, x) && v < 0.75) c = 'H';
          if (chip && xx === x + w - 2 && yy === y) c = 'K';
          if (miss && !last) c = yy === y ? 'K' : 'k';
          g[yy][xx] = c; }
        x += w; }
      if (y + 2 <= hc + HH) for (let x2 = 1; x2 <= wc; x2++) g[y + 2][x2] = y + 2 >= hc + HH - 1 ? 'K' : 'D'; }
    for (let k = 0; k < (wc > 30 ? 2 : 1); k++) { if (Math.random() < 0.3) continue; let x = randi(3, wc - 3); const L = randi(5, HH - 1);
      for (let j = 0; j < L; j++) { const y = hc + 1 + j; g[y][x] = 'm'; if (j % 2 === 0 && x + 1 <= wc) g[y][x + 1] = 'M'; else if (x - 1 >= 1) g[y][x - 1] = 'M'; if (Math.random() < 0.3) x = clamp(x + pick([-1, 1]), 2, wc - 1); } }
    if (wc >= 34 && Math.random() < 0.3) { const bx = randi(6, wc - 10), L = HH - 3;
      for (let j = 0; j < L; j++) for (let i = 0; i < 6; i++) { const torn = j === L - 1 && (i === 1 || i === 4); if (torn) continue; g[hc + 2 + j][bx + i] = i === 0 || i === 5 ? 'w' : j === 0 ? 'w' : (j + i) % 5 === 0 ? 'D' : 'r'; } }
    for (let x = 1; x <= wc; x++) { if (Math.random() < 0.35) g[hc + HH][x] = pick(['m', 'M']); }
    for (let x = 1; x <= wc; x++) if (Math.random() < 0.15) { g[1][x] = '.'; if (g[2]) g[2][x] = 'l'; }
    return { g: gOutline(g), HH };
  };

  // ---------------- 바닥 판석 (2px 칸) ----------------
  window.castleTiles = function (g) {
    const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x & ~1, y & ~1, 2, 2); };
    const rgb = (b, d = 0) => `rgb(${b + 1 + d},${b - 1 + d},${b + 5 + d})`;
    let row = 0;
    for (let y = (A.y0 - 6) & ~1; y < A.y1 + 10; row++) {
      const rh = (pick([6, 7, 7, 8])) * 2; let x = ((A.x0 - 40) & ~1) - (row % 2) * 12;
      while (x < A.x1 + 30) {
        const w = pick([10, 12, 12, 14, 16]) * 2, v = randi(-5, 5), b = 31 + v, crack = Math.random() < 0.22, worn = Math.random() < 0.1;
        for (let yy = 0; yy < rh; yy += 2) for (let xx = 0; xx < w; xx += 2) {
          const top = yy === 0, left = xx === 0, bot = yy === rh - 2, right = xx === w - 2;
          let c = right || bot ? '#0e0c12' : top || left ? rgb(b, 9) : yy === 2 || xx === 2 ? rgb(b, 4) : yy >= rh - 4 || xx >= w - 4 ? rgb(b, -5) : rgb(b);
          if (worn && !(top || left || right || bot) && dith((x + xx) >> 1, (y + yy) >> 1, 0.2)) c = rgb(b, -4);
          px(x + xx, y + yy, c);
        }
        if (crack) { let cx = x + randi(3, w / 2 - 3) * 2, cy = y + 2; for (let i = 0; i < rh / 2 - 2; i++) { px(cx, cy, rgb(b, -14)); cx += pick([-2, 0, 2]); cy += 2; } }
        if (Math.random() < 0.06) { g.fillStyle = 'rgba(70,95,50,.55)'; for (let k = 0; k < 4; k++) px(x + w - 2 - k * 2, y + rh - 2, '#2a3a22'); }
        if (Math.random() < 0.05) { const bx = x + randi(2, w / 2 - 4) * 2, by = y + randi(2, rh / 2 - 3) * 2; for (let k = 0; k < 6; k++) if (dith(k, k * 3, 0.7)) px(bx + (k % 3) * 2, by + (k >> 1) % 2 * 2, 'rgba(95,12,18,.55)'); }
        x += w;
      }
      y += rh;
    }
  };

  // ---------------- 깔개 · 융단 ----------------
  for (const p of [...RUG_PALS, CARPET_PAL, PELT_PAL]) Object.assign(p, { Y: mixHex(p.y || '#a8822e', '#000000', 0.4), q: mixHex(p.p || p.R || '#7a1420', '#ffffff', 0.18), s: mixHex(p.R || '#6a1420', '#000000', 0.3), o: mixHex(p.y || '#a8822e', '#ffffff', 0.3) });
  const fold = (g, sd) => { // 접힌 자국: 비스듬한 그늘 띠 · 해진 점
    const H0 = g.length, W0 = g[0].length, a = rand(0.2, 0.6), o = rand(W0 * 0.3, W0 * 0.7);
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) { const c = g[y][x]; if ('.k'.includes(c)) continue; const d = Math.abs((x - o) - (y - H0 / 2) * a);
      if (d < 1.2 && dith(x, y, 0.55)) g[y][x] = c === 'y' ? 'Y' : c === 'R' ? 's' : c === 'p' ? 'P' : c; }
  };
  genRugRound = function (rx, ry, pat) {
    const g = mkGrid(rx * 2 + 1, ry * 2 + 5);
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const e = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry)); if (e > 1) continue;
      const an = Math.atan2(y / ry, x / rx), lit = (x / rx + y / ry) < -0.6;
      let c = e > 0.93 ? 'k' : e > 0.87 ? (lit ? 'o' : 'y') : e > 0.8 ? ((Math.round(an * 12 / Math.PI) % 2) ? 'P' : 'y') : e > 0.76 ? 'Y' : 'R';
      if (c === 'R') {
        if (pat === 0) c = e > 0.62 ? 'P' : e > 0.57 ? 'y' : e > 0.25 ? (((Math.abs(x) + Math.abs(y)) % 4 === 0) ? 'p' : 'R') : e > 0.18 ? 'y' : 'p';
        else if (pat === 1) c = e < 0.16 ? 'y' : e < 0.22 ? 'Y' : Math.floor((an + Math.PI) / (TAU / 16)) % 2 ? (e > 0.6 ? 'P' : 'R') : (e > 0.6 ? 'p' : 's');
        else c = e > 0.68 ? 'P' : (Math.round(x / 3 + y / 2) % 3 === 0 && (x + y) % 2 === 0 ? 'y' : e < 0.3 ? 'p' : 'R');
        if (c === 'R' && (x + y * 2) % 9 === 0) c = 's';
      }
      g[y + ry][x + rx] = c;
    }
    for (let x = -rx + 3; x <= rx - 3; x += 2) { const y = Math.round(ry * Math.sqrt(1 - (x * x) / (rx * rx))); if (g[y + ry + 1] && g[y + ry + 1][x + rx] === '.') { g[y + ry + 1][x + rx] = 'y'; if (g[y + ry + 2]) g[y + ry + 2][x + rx] = 'Y'; } } // 아래 술
    fold(g); return g;
  };
  genRugRect = function (wc, hc, torn) {
    const g = mkGrid(wc + 6, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const e = Math.min(x, y, wc - 1 - x, hc - 1 - y);
      let c = e === 0 ? 'k' : e === 1 ? 'y' : e <= 4 ? (((x + y) % 4 === 0 || (x - y + 400) % 4 === 0) ? 'y' : 'P') : e === 5 ? 'Y' : 'R';
      if (c === 'R') {
        const dx = Math.abs(x - (wc - 1) / 2) / (wc / 2), dy = Math.abs(y - (hc - 1) / 2) / (hc / 2), d = dx + dy;
        if (d < 0.45) c = d > 0.39 ? 'y' : d > 0.33 ? 'Y' : d > 0.2 ? 'P' : d > 0.12 ? 'p' : 'o';
        else if (Math.min(x, wc - 1 - x) + Math.min(y, hc - 1 - y) < 12 && Math.min(x, wc - 1 - x) > 5 && Math.min(y, hc - 1 - y) > 5) c = (x + y) % 2 ? 'p' : 'P';
        else if ((x * 3 + y * 5) % 13 === 0) c = 's';
      }
      if (torn && (Math.sin(x * 0.7) + Math.sin(y * 0.9 + 1) > 1.45 || (x > wc * 0.72 && y > hc * 0.6 && dith(x, y, (x / wc - 0.72) * 3)))) c = '.';
      g[y][x + 3] = c;
    }
    for (let y = 1; y < hc - 1; y += 2) for (const [x0, s] of [[0, 1], [wc + 3, -1]]) { g[y][x0 + (s > 0 ? 2 : 0)] = 'y'; g[y][x0 + 1] = 'y'; g[y][x0 + (s > 0 ? 0 : 2)] = 'Y'; } // 술
    fold(g); return g;
  };
  genRugOct = function (r) {
    const n = r * 2 + 1, g = mkGrid(n, Math.round(n * 0.62)), ry = (g.length - 1) / 2;
    for (let y = 0; y < g.length; y++) for (let x = 0; x < n; x++) {
      const dx = Math.abs(x - r) / r, dy = Math.abs(y - ry) / ry, o = Math.max(dx, dy, (dx + dy) * 0.72);
      if (o > 1) continue;
      const an = Math.atan2((y - ry) / ry, (x - r) / r), sv = 0.7 + 0.3 * Math.cos(an * 8), star = o < 0.56 * sv, star2 = o < 0.4 * (0.7 + 0.3 * Math.cos(an * 8 + Math.PI / 8));
      g[y][x] = o > 0.93 ? 'k' : o > 0.87 ? 'y' : o > 0.82 ? 'Y' : star2 ? (o < 0.12 ? 'o' : 'q') : star ? (o > 0.52 * sv ? 'y' : 'p') : o > 0.66 && o < 0.72 ? 'y' : ((x + y) % 6 === 0 ? 's' : 'R');
    }
    fold(g); return g;
  };
  genCarpet = function (len, wid, vert) {
    // 붉은 융단: 금실 이중 테 · 테 안 사슬 무늬 · 가운데 마름모 메달 반복 · 끝 술 · 해진 끝 · 접힌 자국
    const L = len, Wd = wid, g = mkGrid(vert ? Wd : L, vert ? L : Wd);
    const set = (i, j, c) => { const x = vert ? j : i, y = vert ? i : j; if (g[y] && g[y][x] !== undefined) g[y][x] = c; };
    for (let i = 0; i < L; i++) for (let j = 0; j < Wd; j++) {
      const e = Math.min(j, Wd - 1 - j), endD = Math.min(i, L - 1 - i);
      let c = e === 0 ? 'k' : e === 1 ? 'y' : e === 2 ? 'D' : e === 3 ? ((i % 4 < 2) === (j < Wd / 2) ? 'y' : 'D') : e === 4 ? 'Y' : 'R';
      if (c === 'R') { const m = ((i % 16) + 16) % 16, dj = Math.abs(j - (Wd - 1) / 2), dd = Math.abs(m - 8) + dj, k2 = Math.round(Wd / 4);
        if (dd === k2) c = 'y'; else if (dd === k2 - 1) c = 'Y'; else if (dd < k2 - 1) c = dd < 2 ? 'o' : 'r'; else if ((i + j) % 7 === 0) c = 's'; }
      if (endD === 0) c = j % 2 ? 'y' : '.'; else if (endD === 1) c = j % 2 ? 'Y' : 'y'; else if (endD === 2) c = 'k';
      if (endD > 2 && endD < 10 && Math.random() < (10 - endD) / 50) c = '.';
      set(i, j, c);
    }
    for (let k = 0; k < L / 40; k++) { const i = randi(8, L - 9), j = randi(5, Wd - 6); for (let d = 0; d < 5; d++) set(i + randi(-2, 2), j + randi(-1, 1), 'D'); }
    for (let i = 6; i < L - 6; i += randi(30, 50)) for (let j = 2; j < Wd - 2; j++) if (dith(i, j, 0.6)) set(i + (j >> 2), j, 'D'); // 접힌 자국
    return g;
  };
  // 곰 가죽: 머리(눈 · 코 · 귀) · 발톱 달린 네 다리 · 꼬리 · 털결 · 등줄기
  PELT.length = 0; for (const r of ["kWWWk....kFk..k..kFk....kWWW", "kFFFk...kFDFkkfkkFDFk...kFFF", "kFFFk....kFkGffFFkFk....kFFF", "kFFFFk....kGGffFFFk....kFFFF", ".kkFFFkkkkkfkffFkFkkk.kFFFkk", "...kFkFffffffffFFFfffkFkFk..", "....kGGGGFGGGGkGFffffffFk...", "...kGGGFGGGGffDffffffDFFk...", "...kGFGGGGGfFfDffffDFFFFk...", "..kfGGGGGfFfffDffDfFFFFFDk..", "..kfGGGGFfffffDDfFFFFFDFFk..", "...kGGFffffffDDfFFFFDFFFk...", "...kFffffffDffDFFFDFFFFFk...", "....kffffFfffFDFDFFFFFFk....", ".....kfFfffFFFDFFFFFFDFk....", "....kkFkkfFFDFFFFFFkkkFkk...", "...kFFFk.kkkkkkkkkk..kFFFk..", ".kkkFkk......kFk......kkFkkk", "kFFFFk.......kFk.......kFFFF", "kFFFk........kFk........kFFF", "kFFFk........kFk........kFFF"]) PELT.push(r.split(''));
  Object.assign(PELT_PAL, { G: '#8a6440' });
  Object.assign(CARPET_PAL, { o: '#e0b850', r: '#9a1c28', s: '#5a0e18', Y: '#6a521c' });
})();
;

// ==================================================================== 19_scenery34.js
// 잿빛 왕관 토벌대 — 19_scenery34.js : v2.82 3·4장 배경 · 장애물 다시 그림 (토템 · 부락 바위 · 방책 말뚝 · 가죽 천막 · 망루 · 울타리 벽 장식 · 바닥 자국 / 깨진 종 · 부서진 마차 · 재 둔덕)
window.SCN34 = {"totem": [[".kwk.......kWk.", "..kwkkkkkkkWk..", "...kwwwwWWWk...", "....kwKwKWk....", "...kkwwKWWkk...", "..kddDDDDDDDk..", "..khhllldddDk..", ".klhhKKlKDDDDk.", "kllohrlhdrDDDDk", ".kohhlldddDOkk.", ".kohhwKwKDDOOk.", ".kohhlllddDDOk.", "kokdhDDDDDDDOOk", "kykhlllldDdDkOk", "skkhhKKlKKDDkrk", "k.khhylhdyDDkkR", "..khhllddDDDk.k", "..khhrRrRrDDk..", "..khhlllddDDk..", "..kddDDDDDDDk..", "..khlllldddDk..", ".klhhKKlKKDDDk.", "kllhhrlhdDDDDDk", ".kkhhlldddDDkk.", "..khhwKwKwDDk..", ".kWhhllldDDBk..", ".kmMmMmMmMmMWk.", ".kmmmmMMmMmmmk."]], "wall": {"hide": ["oooooooooooooo", "OOWOOOOOOOOWOO", "kksssbbbbBBkkk", ".ksssbbbbBBk..", "kssssrbrrBBBk.", "kssssbrrbBBBk.", "kWsssrrrrBBBWk", "kbbbbbrrbBBBk.", "kbbbbbrrbBsBk.", ".kbBbbbbbBBk..", ".kbbRbbbbRBk..", ".kbbbbRbbBBk..", "..kbbbbbbBk...", "...kkkkkkk....", ".............."], "skull": ["sk....k....ko", "ksk.kkwkk.kok", "kskkwwwWWkkok", ".kswwwwWWWok.", "..kwKKwKKWk..", "..kWWWWWWWk..", "...kWWKWWk...", "...kWWWWWk...", "....kwkwk....", ".....kOk.....", ".....kOk....."], "banner": ["oooooooooooo", "OOOOOOOOOOOO", "krwrrrRRRWRk", "krrwrrRRWRRk", "krrrwwWWRRRk", "krrrwKKWRRRk", "krrrwwWWRRRk", "krrrrWWRRRRk", "krrrrrRRRRRk", "krrrrrRRRRRk", "kyoyoyoyoyok", "krrrrrRRRRRk", "krkkrrRkkRRk", "krkkrkRkkRk.", "krk.k.k.krk.", ".k.krk...k.."], "spikes": [".kk.kwrk.kk..k.", "kwrkkwWkkwrkkrk", "kwWkkhdkkwWkwWk", "khdkkhdkkhdkwWk", "khdkkhdkkhdkhdk", "ooooooooooooooo", "OOOOOOOOOOOOOOO", "khdkkhdkkhdkhdk", ".kk..kk..kk.kk."]}, "dec": {"bone1": ["wkkkkkkw", "kwwwwwwk", "WWWWWWWW", "kkkkkkkk"], "bone2": ["...kwk", "..kkwW", ".kwwWk", "kkwWk.", "wwWk..", "kWk..."], "jaw": ["wwwwww", "WwkwkW", "Wk.kkW", "k....k"], "peb1": ["...kkk", ".kkggg", "kGGGGG", ".kkkkk"], "peb2": [".kkk.", "knggk", "ggggg", "kGGGk"], "straw1": ["ksykyk", "ksykyk", "kssoyk", "kysoyk", "kysoyk"], "straw2": ["yyyykkk", "kkkkooo", "ooookkk"]}, "decPal": {"k": "#0b0806", "w": "#d8cfbc", "W": "#a89f8c", "g": "#6a5a4a", "G": "#4a3c30", "n": "#8a7a68", "y": "#a08040", "s": "#c8a060", "o": "#6a5428"}, "ash": {"m1": [".kkkkkk.", "kaabbcck", "kaabbbck", "cbdbbdbc"], "m2": ["..kkkkkkkk..", ".kaaabbccck.", "kaaaabbbbcck", "kaaaabbbbbck", "cddbbbdbbbcc"], "m3": ["...kkkkkkkkkk...", "..kaaaacccccck..", ".kaaaaabbbbbcck.", "kaaaaaabbbbbbcck", "kaaaaaabbbbbbbck", "ccbddbdbbddbbbcc"], "ember": ["kekdk", "deEdd", "kkkkk"]}, "ashPal": {"k": "#1e1c1a", "a": "#9a948a", "b": "#7e786e", "c": "#625c54", "d": "#3a3632", "e": "#ff7a30", "E": "#ffc070"}};
(() => {
  const R2 = (x, y, s = 0) => { const v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.7) * 43758.5453; return v - Math.floor(v); };
  const T = window.SCN34 || {};

  // ---------------- 3장 ----------------
  genTotem = function () { return fromRows(T.totem[0]); }; // v3.20 토템 B 삭제 · A 하나로 (사용자 결정)
  for (const k in T.wall) ORC_WALL_MAPS[k] = T.wall[k];


  // 가죽 천막: 덧댄 가죽 조각(색 셋) · 꿰맨 자국 · 꼭대기에 엇갈려 솟은 장대 · 열린 입구와 젖힌 자락 · 칠한 문양 · 입구 위 해골 · 버팀줄과 말뚝
  genTent = function (wc, hc) {
    const HH = Math.round(Math.min(26, wc * 0.55)), W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0), cx = W0 / 2, sd = rand(0, 99);
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && x < W0 - 1 && y >= 1 && y < H0 - 1) g[y][x] = c; };
    const top = 4, bot = H0 - 2;
    for (let y = top; y <= bot; y++) { const t = (y - top) / (bot - top), hw = Math.max(1, t * (wc / 2 - 1));
      for (let x = 1; x < W0 - 1; x++) { const dx = x + 0.5 - cx; if (Math.abs(dx) > hw) continue;
        const patch = Math.floor((dx + 40) / 5) + Math.floor(y / 6) * 3, tone = R2(patch, 1, sd);
        let c = tone < 0.45 ? 'b' : tone < 0.85 ? 'B' : 'o';
        if (dx > hw * 0.35) c = c === 'b' ? 'B' : c === 'o' ? 'O' : 'B'; if (dx > hw * 0.7) c = 'D';
        if ((Math.floor((dx + 40) / 5) !== Math.floor((dx + 39) / 5)) && y % 3 === 0 && R2(patch, 7, sd) < 0.5) c = 'W'; // 세로 꿰맨 자국 (군데군데)
        if (y % 6 === 0 && x % 3 === 0 && R2(patch, 9, sd) < 0.4) c = 'W';                         // 가로 꿰맨 자국 (군데군데)
        if (Math.abs(dx) > hw - 1) c = dx < 0 ? 'O' : 'K';
        set(x, y, c); } }
    // 입구: 아래 가운데 어둠 + 왼쪽으로 젖힌 자락
    for (let y = Math.round(bot - (bot - top) * 0.45); y <= bot; y++) { const t = (y - (bot - (bot - top) * 0.45)) / ((bot - top) * 0.45), hw = t * wc * 0.16 + 1;
      for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) set(x, y, y > bot - 2 ? 'u' : 'K');
      set(Math.round(cx - hw) - 1, y, 's'); set(Math.round(cx - hw) - 2, y, 'b'); }
    // 칠한 문양 (오른쪽 가죽): 붉은 뿔 표식
    { const mx = Math.round(cx + wc * 0.16), my = Math.round(top + (bot - top) * 0.55); for (const [dx, dy] of [[0, 0], [0, 1], [0, 2], [-1, -1], [1, -1], [-2, -2], [2, -2], [-1, 3], [1, 3]]) set(mx + dx, my + dy, 'r'); }
    // 입구 위 해골
    { const sy = Math.round(bot - (bot - top) * 0.45) - 4; for (const [dx, dy, c] of [[-1, 0, 'w'], [0, 0, 'w'], [1, 0, 'W'], [-1, 1, 'K'], [0, 1, 'w'], [1, 1, 'K'], [0, 2, 'W']]) set(cx - 0.5 + dx, sy + dy, c); }
    // 꼭대기 장대 (엇갈려 솟음)
    for (let k = 0; k < 5; k++) { set(cx - 1 - k, top - k + 1, 'o'); set(cx + k, top - k + 1, 'O'); }
    set(cx - 0.5, top, 'O'); for (const [x, y] of [[cx - 6, 0], [cx + 5, 0]]) set(x, y + 1, 'y');
    // 버팀줄 · 말뚝
    for (const s of [-1, 1]) { const x0 = cx + s * (wc / 2 - 2), y0 = bot - 2; set(x0 + s, y0, 'o'); set(x0 + s, y0 + 1, 'O'); }
    return { g: gOutline(g), HH };
  };

  // 망루: 굵은 네 기둥(4칸 · 껍질 결 · 감은 밧줄) · 엇갈린 버팀대 · 발판과 난간 · 가죽 지붕(덧댐 · 꿰맨 자국 · 술) · 굵은 사다리 · 깃발 · 꼭대기 뿔 해골
  genWatchtower = function (wc, hc) {
    const HH = 36, W0 = Math.max(wc, 18) + 2, H0 = HH + hc + 2, g = mkGrid(W0, H0), sd = rand(0, 99);
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && x < W0 - 1 && y >= 1 && y < H0 - 1) g[y][x] = c; };
    const x0 = 1, x1 = W0 - 2, gb = H0 - 2, gt = Math.min(gb - 2, HH + 1), pl = Math.round(HH * 0.48), cx = W0 / 2;
    // 뒤 기둥 (어둡게)
    for (let y = pl; y <= gt; y++) for (const x of [x0 + 5, x0 + 6, x1 - 6, x1 - 5]) set(x, y, x < cx ? 'd' : 'D');
    // 버팀대 (2칸 굵기, 엇갈림)
    const n = Math.max(8, (gb - pl - 6) * 2);
    for (let i = 0; i <= n; i++) { const t = i / n, ya = pl + 4 + (gb - pl - 8) * t; set(x0 + 4 + (x1 - x0 - 8) * t, ya, 'd'); set(x0 + 4 + (x1 - x0 - 8) * t, ya + 1, 'D'); set(x1 - 4 - (x1 - x0 - 8) * t, ya, 'l'); set(x1 - 4 - (x1 - x0 - 8) * t, ya + 1, 'd'); }
    // 앞 기둥 (4칸 · 껍질 결)
    for (let y = pl; y <= gb; y++) for (let k = 0; k < 4; k++) { const c = ['h', 'l', 'd', 'D'][k]; set(x0 + k, y, (k === 1 && (y + 2) % 6 === 0) ? 'd' : c); set(x1 - 3 + k, y, (k === 2 && y % 7 === 0) ? 'D' : ['l', 'd', 'D', 'D'][k]); }
    for (const yb of [pl + 3, pl + 4, Math.round((pl + gb) / 2), Math.round((pl + gb) / 2) + 1, gb - 3, gb - 2]) for (let k = 0; k < 4; k++) { set(x0 + k, yb, (k + yb) % 2 ? 'y' : 'o'); set(x1 - 3 + k, yb, (k + yb) % 2 ? 'o' : 'O'); }
    // 발판
    for (let x = x0; x <= x1; x++) { set(x, pl, 'h'); set(x, pl + 1, x % 4 ? 'l' : 'd'); set(x, pl + 2, 'D'); }
    // 난간: 위 가로대 둘 + 세로 살
    for (let x = x0; x <= x1; x++) { set(x, pl - 6, 'h'); set(x, pl - 5, 'd'); set(x, pl - 3, 'l'); }
    for (let x = x0; x <= x1; x += Math.max(3, Math.round((x1 - x0) / 5))) for (let y = pl - 7; y < pl; y++) { set(x, y, 'l'); set(x + 1, y, 'd'); }
    // 깃발 (발판 앞 가운데)
    for (let y = pl + 3; y <= pl + 9; y++) for (let x = Math.round(cx - 3); x <= Math.round(cx + 2); x++) set(x, y, y === pl + 9 && x % 2 ? '.' : (x === Math.round(cx) || x === Math.round(cx) - 1) && y > pl + 4 && y < pl + 8 ? 'w' : 'r');
    // 사다리 (굵게): 2칸 기둥 둘 · 2칸 가로대
    const lx = x0 + 5;
    for (let y = pl + 3; y <= gb; y++) { set(lx, y, 'h'); set(lx + 1, y, 'd'); set(lx + 5, y, 'l'); set(lx + 6, y, 'D'); if ((y - pl) % 4 === 0) for (let x = lx + 2; x <= lx + 4; x++) { set(x, y, 'h'); set(x, y + 1, 'D'); } }
    // 지붕: 가죽 (덧댐 · 꿰맨 자국) + 처마 술
    const ry = pl - 9;
    for (let y = 1; y <= ry; y++) { const hw = (y / ry) * (W0 / 2 + 1); for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) { const p = Math.floor(x / 5) + Math.floor(y / 3) * 2, t = (x - cx) / Math.max(1, hw);
      let c = R2(p, 3, sd) < 0.3 ? (t < 0 ? 'b' : 'B') : t < -0.4 ? 'h' : t < 0.2 ? 'l' : t < 0.7 ? 'd' : 'D'; if (y === ry) c = 'D'; if (x % 5 === 0 && y % 2 && y < ry) c = 'W'; set(x, y, c); } }
    for (let x = 1; x < W0 - 1; x += 2) set(x, ry + 1, 'O');
    for (const [dx, dy, c] of [[-1, 1, 'w'], [0, 1, 'w'], [1, 1, 'W'], [-1, 2, 'K'], [1, 2, 'K'], [-2, 0, 'w'], [2, 0, 'W']]) set(cx + dx, dy + 1, c);
    return { g: gOutline(g), HH };
  };

  // ---------------- 4장 ----------------
  // 떨어져 깨진 종: 옆으로 누운 청동 종(띠 둘 · 입구 테 빛 · 안쪽 어둠) · 떨어져 나간 조각 · 흘러내린 녹청 · 부러진 나무 멍에 · 굴러 나온 추 · 윗면 재
  genBell = function (r) {
    const L = Math.max(14, Math.round(r * 1.25)), R0 = Math.max(7, Math.round(r * 0.62)), W0 = L + 9, H0 = Math.round(R0 * 1.5) + 7, g = mkGrid(W0, H0), cy = Math.round(H0 / 2) - 1, ox = 4;
    for (let x = 0; x < L; x++) { const t = x / (L - 1), rad = R0 * (0.48 + 0.52 * Math.pow(t, 1.7)) + (t > 0.88 ? 1.2 : 0), ry = rad * 0.72;
      for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) { const v = (y - (cy - ry)) / (2 * ry); g[y][x + ox] = v < 0.18 ? 'h' : v < 0.5 ? 'l' : v < 0.8 ? 'd' : 'D'; }
      if ((Math.abs(t - 0.32) < 0.03 || Math.abs(t - 0.7) < 0.03)) for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) g[y][x + ox] = (y - cy) < 0 ? 'h' : 'd'; // 띠
    }
    { const rad = R0 + 1.2, ry = rad * 0.72, mx = L + ox; // 입구: 밝은 테(위) · 어두운 테(아래) · 안쪽 어둠 · 안에 보이는 추 끝
      for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) { const e = Math.abs(y - cy) / ry; g[y][mx - 1] = (y - cy) < 0 ? 'h' : 'd'; g[y][mx] = e > 0.75 ? ((y - cy) < 0 ? 'h' : 'D') : 'K'; if (e < 0.8) g[y][mx - 1] = e < 0.55 ? 'K' : g[y][mx - 1]; if (e < 0.55) g[y][mx - 2] = 'K'; }
      g[cy][mx - 3] = 'K'; g[cy + 1][mx - 2] = 'D'; }
    // 꼭지 고리 + 부러진 멍에
    for (let y = cy - 2; y <= cy + 2; y++) { g[y][ox - 1] = y === cy - 2 ? 'h' : 'd'; } g[cy - 1][ox - 2] = 'l'; g[cy + 1][ox - 2] = 'D';
    for (let x = 0; x <= ox - 2; x++) { g[cy - 4][x] = 'W'; g[cy - 3][x] = 'w'; } g[cy - 5][0] = 'W';
    // 굴러 나온 추
    { const kx = L + ox + 3, ky = cy + R0 * 0.5; for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) if (g[Math.round(ky + y)]) g[Math.round(ky + y)][kx + x] = x + y < 0 ? 'l' : 'D'; }
    // 녹청 줄기 (위에서 아래로 흘러내림) · 금
    for (let i = 0; i < L / 3; i++) { const x = randi(ox + 2, L + ox - 3); let y = cy - Math.round(R0 * 0.4); for (let k = 0; k < randi(2, 5); k++) { if (g[y] && 'hldD'.includes(g[y][x])) g[y][x] = k ? 'V' : 'v'; y++; } }
    let x0 = L + ox - 2, y0 = cy - 2; for (let i = 0; i < L * 0.6; i++) { if (g[y0] && 'hldDvV'.includes(g[y0][x0])) g[y0][x0] = 'c'; x0--; y0 += randi(-1, 1); y0 = clamp(y0, 1, H0 - 2); }
    ashCap(g, 0); return gOutline(g);
  };
  Object.assign(BELL4, { w: '#6a5a46', W: '#3e3224' });

})();
;

// ==================================================================== 11e_truth3.js
'use strict';
// 잿빛 왕관 토벌대 — 11e_truth3.js (v2.84) : 3장 진엔딩 「크루가쉬의 마지막 말」
// 피의 결투 원(3장 격전지 하나) → 선조의 결투장(숨은 맵) → 세 선조와 결투 → 저주가 풀린 크루가쉬와 약속의 결투 → 금빛 빛기둥 → 진실 기록 t3
// 그림은 시안(_작업자료/시안/선조결투장_시안_v11.html)과 같은 코드 (2px 칸 좌표로 g에 그림). 게임 함수는 덮어씌워 연결한다 (다른 파일은 거의 건드리지 않음)
const TRUTH3 = (() => {
let g = null;
// ================================================================ 시안 코드 (칸 좌표)
function __mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
const K = '#0b0a0e', OUTK = '#0b0a0e';
function px(cx, cy, col) { if (!col) return; g.fillStyle = col; g.fillRect(cx * 2, cy * 2, 2, 2); }
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dth = (x, y) => BAY[((y & 3) << 2) | (x & 3)] / 16;
function hh(x, y) { let n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
// 디더 광원 (칸 단위, 더하기 합성)
function glow(cx, cy, r, rgb, a = 0.5, ry) {
  ry = ry || r * 0.75; g.save(); g.globalCompositeOperation = 'lighter';
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const d = Math.hypot((x - cx) / r, (y - cy) / ry); if (d >= 1) continue;
    const k = (1 - d) * a; if (k * 1.6 < dth(x, y)) continue;
    g.fillStyle = `rgba(${rgb},${Math.min(0.5, k * 0.55)})`; g.fillRect(x * 2, y * 2, 2, 2);
  }
  g.restore();
}
function shadowE(cx, cy, rx, ry, a = 0.55) { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const d = (x / rx) ** 2 + (y / ry) ** 2; if (d <= 1 && dth(cx + x, cy + y) < (1 - d) * a * 1.7) px(cx + x, cy + y, 'rgba(4,3,6,.7)'); } }
// 상호작용 안내 (칸 좌표)
function cellWeapon(w, h, px0, py0, pal, fn) { const cells = Array.from({ length: h }, () => Array(w).fill('.')); fn((x, y, c) => { if (x >= 0 && x < w && y >= 0 && y < h) cells[y][x] = c; }); return { cells, w, h, px: px0, py: py0, pal }; }
function drawCellWeapon(b, hx, hy, ang, flipY) {
  const flip = flipY != null ? flipY : Math.cos(ang) < 0, ca = Math.cos(ang), sa = Math.sin(ang), R = Math.ceil(Math.hypot(b.w, b.h)) + 2, out = new Map();
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const lx = x * ca + y * sa; let ly = -x * sa + y * ca; if (flip) ly = -ly; const sx = Math.round(lx + b.px), sy = Math.round(ly + b.py); if (sx >= 0 && sx < b.w && sy >= 0 && sy < b.h && b.cells[sy][sx] !== '.') out.set(x + ',' + y, b.cells[sy][sx]); }
  for (const k of out.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!out.has((x + dx) + ',' + (y + dy))) px(hx + x + dx, hy + y + dy, '#1a0610'); }
  for (const [k, v] of out) { const [x, y] = k.split(',').map(Number); px(hx + x, hy + y, b.pal[v]); }
}

// ================================================================ 선조 영혼 3인 — 오크 새 도트와 같은 공식(큰 머리 · 짧은 몸, 2px 칸, 지도 안 k 외곽선)
// 크루가쉬처럼 부족의 장이었던 영혼: 몸통은 크루가쉬와 같은 폭, 상징 투구로 실루엣을 만듦 (크루가쉬 33×31보다 조금 작게). 다리 대신 핏빛 넋 꼬리
const APAL = { k: '#1a0610', h: '#ffc4b0', l: '#ec7a6c', '2': '#b84250', '3': '#7c1e3a', d: '#962c44', e: '#fffbe8', E: '#2a0410', w: '#fff0dc', W: '#d8b8a8', B: '#4a1020', b: '#6c1a30', R: '#3a0816', r: '#ffe0a0', y: '#ffd070', Y: '#a06a30', F: '#962c44', g: '#ffe4d4', G: '#d89a90', T: '#fff0dc', m: '#c8bcc4', M: '#8a7a88', n: '#ffffff', s: '#d8ccd4', S: '#a0909c', q: '#6a5868', Q: '#443644' };
const ANC = {
  gor: { name: '고르마크', title: '힘의 선조', sym: 'tusk', rows: ["....kkkkkk.............kkkkkk....", "..kkwWwwwWkk.........kkWWwwwWkk..", ".kwWwWwwWwwwk.......kwwWWwwwwWwk.", "kwwWwwWwWwwWwk.....kwwwwWwwwWWwwk", "kWwwkkkkkwWWwk.....kwwwwkkkkkwwwk", "wWWk.....kWwwwk...kwwwwk.....kwwW", "wwwk......kwwwk...kWWWk......kWWW", "WWk.......kWWWwkkkWWWWk.......kww", "wwk.......kmYnmmnmmnYMk.k.....kww", "Wwk.......kMMmymmmymMMkkwk....kww", "wwk.......k2WWlllllWWhkkwk...kWww", "kk.......klkk2llllllkklkwk...kwWk", "..........k22EelllEellkkwWkkkwwwk", "..........k2llllllllwlk.kWwwWwkk.", "..........k2lWkkkkkwllk..kkkkk...", "..........kkk3lllldkkkk..........", ".........kwwk22lrlldkwwk.........", "........kwWWk2lrlrlldkWWk........", "........k2lk22llrlllkkl2k........", "........k3dkkBBBYBBBkkd3k........", ".........kk..kbbbbbbk.kk.........", ".............kFFkkkFFk...........", ".............kkkk.kkkk..........."] },
  zak: { name: '자카', title: '속도의 선조', sym: 'axe', rows: [".......k.................k.......", "......knk...............knk......", ".....knsk...............kSnk.....", ".....knsk...............kSnk.....", ".....knsk...............kSnk.....", "....knnssk.............kSSnnk....", ".....knssk.............kSSnk.....", ".....knsssk...........kSSSnk.....", ".....knsssskk.......kkSSSSnk.....", "......knssssskkkkkkkSSSSSnk......", ".......knsssssssssSSSSSSnk.......", "........knssssssbBSSSSSnk........", ".........knnnsssrBSSnnnk.........", "..........kkkqqqqqQQkkk..........", "...........kqqyqqqyQQk...........", "..........kqqqqqqqqqQQk..........", "..........kQqQqQqQqQqQk..........", ".........kMQrQQrQQrQQrmk.........", "........kmgkk2BlllBllkgMk........", "........kMk.k2EelllEekkmk........", ".......kmkk.k2BlllllBk.kMk.......", ".......kMk..k22TkkkTlk.kmk.......", "........k...kkk3dddkk...k........", "...........kbbk2llkbbkk..........", "..........kllkGk3dkGkllk.........", "..........kllkkBwBBkkllk.........", "..........kdk.kbbbbkkkdk.........", "...........k.kFFkkkFFkk..........", ".............kkkk.kkkk..........."] },
  utu: { name: '우투르', title: '인내의 선조', sym: 'shield', rows: ["..............kkkk...............", "............kkwwwwkk.............", "...........kwwggggEWk............", "..........kwgggggggEWk...........", ".........kwgggggggEgGWk..........", ".........kwgEEEggEEEGWk..........", ".........kwgEEEggEEEGWk..........", ".........kwggEgggGEgGWk..........", "..........kwggggEgggWk...........", "...........kwgGEEGgWk............", "..........kkgEgEgEgEkkk..........", "........kkwwkgEgEgEgkwwkk........", ".......kwwWWmmmmnmmMMWWwwk.......", ".......kwWkMMmmmmmmmMMkWwk.......", "......kwWk.k22llllllhhkkWwk......", "......kwk.k2lEellllEelk.kwk......", "......kwk.k2lTkkkkkTllk.kwk......", ".......kwkkkk3llllldkkkkwk.......", "........kkwwklllllllkwwkk........", "........kwWWk2llllllkWWwk........", "........k2lkk2l2lll2kkl2k........", "........k3dkkBBBYBBBkkd3k........", ".........kk..kbbbbbbbkkk.........", ".............kFFkkkFFk...........", ".............kkkk.kkkk..........."] },
};
const WP = { h: '#6c1a30', H: '#4a1020', s: '#ffd8cc', S: '#d8968e', D: '#9a4a5a', w: '#fff0dc', r: '#ff6a50', c: '#c07a80' };
// 부족장의 무기 — 크루가쉬 핏빛 대도끼와 같은 크기 등급 (자루 20칸 이상 · 머리 12칸 이상)
// 고르마크: 거대한 돌 대망치 (뼈 끈으로 묶은 돌덩이 12×13 + 엄니 가시)
const MAUL = cellWeapon(33, 15, 4, 7, WP, put => { put(0, 7, 'w'); put(1, 6, 'w'); put(1, 8, 'w'); for (let x = 1; x < 22; x++) put(x, 7, x % 4 === 0 ? 'H' : 'h'); for (let x = 3; x < 8; x++) put(x, 7, x % 2 ? 'r' : 'H');
  for (let y = 1; y < 14; y++) for (let x = 20; x < 32; x++) { if ((y < 3 || y > 11) && (x < 22 || x > 29)) continue; if ((y === 1 || y === 13) && (x < 23 || x > 28)) continue; put(x, y, y < 4 ? 's' : x > 28 ? 'D' : y > 10 ? 'D' : 'S'); }
  for (let y = 1; y < 14; y++) put(24, y, 'w'); for (let y = 2; y < 13; y++) put(27, y, y % 2 ? 'w' : 'c'); put(29, 5, 'D'); put(30, 6, 'D'); put(28, 9, 'D');
  for (const [x, y] of [[31, 0], [32, 0], [31, 14], [32, 14]]) put(x, y, 'w'); });
// 자카: 사슬 대도끼 (긴 자루 + 위아래로 크게 휜 초승달 날 하나)
const CAXE = cellWeapon(30, 21, 3, 10, WP, put => { for (let x = 0; x < 26; x++) put(x, 10, x % 5 === 0 ? 'H' : 'h'); put(0, 10, 'r');
  for (let y = 0; y < 21; y++) for (let x = 17; x < 30; x++) { const dy = (y - 10) / 10.5, d1 = ((x - 17) / 12) ** 2 + dy * dy, d2 = ((x - 15) / 8.5) ** 2 + dy * dy * 1.15; if (d1 <= 1 && d2 > 1) put(x, y, d1 > 0.8 ? 'w' : y < 8 ? 's' : 'S'); }
  for (let y = 8; y < 13; y++) { put(20, y, 'H'); put(21, y, 'h'); } put(22, 10, 'r'); });
// 우투르: 긴 뼈 창
const SPEAR = cellWeapon(36, 7, 3, 3, WP, put => { for (let x = 0; x < 28; x++) put(x, 3, x % 6 === 5 ? 'H' : 'h'); for (let x = 24; x < 28; x++) { put(x, 2, 'w'); put(x, 4, 'w'); }
  for (const [x, y] of [[28, 2], [28, 3], [28, 4], [29, 1], [29, 2], [29, 3], [29, 4], [29, 5], [30, 1], [30, 2], [30, 3], [30, 4], [30, 5], [31, 2], [31, 3], [31, 4], [32, 2], [32, 3], [32, 4], [33, 3], [34, 3]]) put(x, y, y === 3 ? 'w' : 's'); });
// 우투르의 뼈 대방패: 굵은 뼈 다섯 대를 세로로 세워 힘줄 끈 두 줄로 엮음 (17×23)
const SHIELD = ["........kk.......", "....kkkkwgk......", "...kwggkwGkkk....", ".kkkwgGkwEkwgkkk.", "kwgkwgGkwGkwGkwgk", "kwGkwgGkwGkwGkwGk", "krbrbrbrbrbrbrbrk", "kbGkbgGkwGkwGkwGk", "kwGkwgGkwGkwGkwGk", "kwGkwgGkwGkwEkwGk", "kwGkrgGkwGkwGkwGk", "kwEkrgGkwGkwGkwGk", "kwGkwrGkwGkwGkwGk", "kwGkwgGkwGkwGkwGk", "kwGkwgGkwEkwGkwGk", "krbrbrbrbrbrbrbrk", "kbGkbgGkwGkwGkwGk", "kwGkwgEkwGkwGkwGk", "kwGkwgGkwGkwGkwGk", "kwGkwgGkwgkwGkwgk", "kwgkwgGkkkkwEkkk.", ".kkkwggk..kwgk...", "....kkk....kk...."];
const SHIELD_P = { k: '#1a0610', g: '#ffe4d4', G: '#d89a90', w: '#fff8ec', E: '#3a0816', r: '#a01828', b: '#5a1020' }; // 세로로 엮은 뼈 · 힘줄 끈 두 줄

function rowsAt(rows, flip) { const W = rows[0].length; return (x, y) => (y >= 0 && y < rows.length && x >= 0 && x < W) ? rows[y][flip ? W - 1 - x : x] : '.'; }
// v3.56 선조 몸 변형: sq(+ 찌그러짐 · - 늘어남, 발 기준) · lean(위쪽이 앞뒤로 기울어짐, 칸) — 도트를 칸 단위로 다시 뽑아 선명함 유지
const DEF = {};
function deform(key, sq, lean, face) {
  const q = Math.round(sq * 10) / 10, l = Math.round(lean * 4) / 4 * (face < 0 ? -1 : 1), ck = key + '|' + q + '|' + l; if (DEF[ck]) return DEF[ck];
  const R = ANC[key].rows, H = R.length, W = R[0].length, sy = 1 - 0.2 * q, sx = 1 + 0.13 * q, H2 = Math.max(6, Math.round(H * sy)), PAD = 4, W2 = W + PAD * 2, xc = (W2 - 1) / 2, out = [];
  for (let j = 0; j < H2; j++) { const ys = H - 1 - Math.floor((H2 - 1 - j) / sy), sh = Math.round(l * 4 * (H2 - 1 - j) / H2); let r = '';
    for (let i = 0; i < W2; i++) { const xs = Math.round((i - sh - xc) / sx + (W - 1) / 2); r += ys >= 0 && ys < H && xs >= 0 && xs < W ? R[ys][xs] : '.'; } out.push(r); }
  return (DEF[ck] = out);
}
// 잔영: 몸 실루엣만 한 색 · 디더로 옅게
function ghostAnc(key, cx, by, o) {
  const R = o.rows || ANC[key].rows, W = R[0].length, H = R.length, flip = (o.face || 1) < 0, at = rowsAt(R, flip), x0 = cx - Math.floor(W / 2), y0 = by - H - 1;
  for (let y = 0; y < H - 2; y++) for (let x = 0; x < W; x++) { const c = at(x, y); if (c === '.' || c === ',') continue; if (dth(x0 + x, y0 + y) > o.ga) continue; px(x0 + x, y0 + y, c === 'k' ? '#5a0a18' : o.ghost); }
}
// 무기 궤적: 최근 각도 기록(오래된 것 → 새 것) 사이를 대망치 머리 거리로 채움 — 새 쪽일수록 밝고 촘촘함
function smearArc(tr, hx, hy, f) {
  for (let i = 1; i < tr.length; i++) { const a0 = tr[i - 1].a, a1 = tr[i].a, dA = a1 - a0; if (Math.abs(dA) < 0.03) continue; const k = tr[i].t / tr[i].max;
    const r0 = Math.round(28 - 5 * k); // 새 쪽은 두껍게(5칸) · 오래된 쪽은 가늘게
    for (let r = r0; r <= 28; r++) { const n = Math.ceil(Math.abs(dA) * r); for (let j = 0; j <= n; j++) { const la = a0 + dA * j / n, sa = f > 0 ? la : Math.PI - la, X = Math.round(hx + Math.cos(sa) * r), Y = Math.round(hy + Math.sin(sa) * r);
      const edge = r >= 27 ? 0 : r >= 25 ? 1 : 2; if (edge === 2 && dth(X, Y) > 0.5) continue; if (k < 0.35 && dth(X, Y) > k * 2.4) continue; px(X, Y, edge === 0 ? '#fff0dc' : edge === 1 ? '#ffd8cc' : '#ff6a50'); } } }
}
// 선조 그리기. cx,by = 발 가운데 칸 · o: face(1/-1), vis(0~1 나타남), pose('idle'|'wind'|'swing'|'guard'), lean, fade(사라짐)
function drawAnc(key, cx, by, t, o = {}) {
  if (o.ghost) return ghostAnc(key, cx, by, o);
  const A = ANC[key], R = o.rows || A.rows, W = R[0].length, H = R.length, flip = (o.face || 1) < 0, at = rowsAt(R, flip);
  const hover = Math.floor(t * 1.6 + cx) % 2, x0 = cx - Math.floor(W / 2) + (o.lean || 0), y0 = by - H - 1 - hover, vis = o.vis == null ? 1 : o.vis;
  const solid = (x, y) => { const c = at(x, y); return c !== '.' && c !== ','; };
  // 바닥: 그림자 대신 핏빛 웅덩이 빛
  for (let x = -6; x <= 6; x++) for (let y = -1; y <= 1; y++) if (Math.abs(x) / 6 + Math.abs(y) < 1.1 && dth(cx + x, by + y) < 0.35 * vis) px(cx + x, by + y, '#7a1424');
  // 무기 (몸 뒤)
  const f = flip ? -1 : 1, hx = cx + f * 7 + (o.lean || 0) + f * ((o.hand && o.hand[0]) || 0), hy = by - 7 - hover + ((o.hand && o.hand[1]) || 0);
  const W0 = { gor: MAUL, zak: CAXE, utu: SPEAR }[key];
  const pose = o.pose || 'idle';
  const ang = o.wAng != null ? (f > 0 ? o.wAng : Math.PI - o.wAng) : pose === 'wind' ? (f > 0 ? -Math.PI * 0.8 : -Math.PI * 0.2) : pose === 'swing' ? (f > 0 ? 0.3 : Math.PI - 0.3) : pose === 'guard' ? (f > 0 ? -0.25 : Math.PI + 0.25) : (f > 0 ? -1.25 : -Math.PI + 1.25);
  const wv = vis > 0.6 && !(o.fade > 0.25) && !o.noWeapon;
  const wFront = o.wFront != null ? o.wFront : pose === 'swing';
  if (wv && !wFront && key !== 'utu') drawCellWeapon(W0, hx, hy, ang);
  // 오오라 (2칸 · 디더, 게임 정예 오오라와 같은 결)
  if (vis > 0.6 && !o.noAura) for (let y = -2; y < H + 1; y++) for (let x = -2; x < W + 2; x++) {
    if (solid(x, y)) continue; let d = 9; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (solid(x + i, y + j)) d = Math.min(d, Math.max(Math.abs(i), Math.abs(j)));
    if (d > 2 || y > H - 3) continue; const q = dth(x0 + x, y0 + y + Math.floor(t * 5));
    if (d === 1 && q < 0.3) px(x0 + x, y0 + y, '#e83a30'); else if (d === 2 && q < 0.08) px(x0 + x, y0 + y, '#8a1424');
  }
  // 몸 (아래 3줄은 넋 꼬리로 흩어짐)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c = at(x, y); if (c === '.' || c === ',') continue;
    const X = x0 + x, Y = y0 + y, q = dth(X, Y + Math.floor(t * 6));
    if (vis < 1 && dth(X, Y) > vis * (1 - y / H * 0.3)) continue;
    if (o.fade && dth(X, Y) < o.fade) continue;
    if (y >= H - 3) { const keep = [0.9, 0.6, 0.3][y - (H - 3)]; if (q > keep) continue; if (c !== 'k') c = y === H - 1 ? 'b' : 'F'; }
    px(X, Y, APAL[c] || c);
  }
  // 넋 꼬리: 발밑에서 흩어지는 핏빛 알갱이
  for (let i = 0; i < 6; i++) { const k = (t * 0.9 + i / 6 + cx * 0.01) % 1; if (vis < 0.7) break; px(cx - 4 + ((i * 3) % 9) + Math.round(Math.sin(k * 6 + i) * 1), by - 1 - Math.floor(k * 8), k < 0.5 ? '#ff6a50' : '#a01828'); }
  // 우투르: 대방패 (몸 앞쪽 옆) + 긴 창 (몸 뒤로 세워 듦)
  if (key === 'utu' && wv) {
    const sA = o.wAng != null ? (f > 0 ? o.wAng : Math.PI - o.wAng) : null, spH = o.spearH || [-10, -8], spX = cx + f * spH[0] + (o.lean || 0), spY = by + spH[1] - hover; // v3.58 창: 쥔 손 위치 · 각도를 따로
    if (sA == null) { if (pose !== 'swing') drawCellWeapon(SPEAR, cx - f * 10, by - 8 - hover, f > 0 ? -1.4 : -Math.PI + 1.4); }
    else if (!o.noSpear && !wFront) drawCellWeapon(SPEAR, spX, spY, sA);
    const so = o.shOff || [0, 0], sx = cx + f * 11 - 8 + (o.lean || 0) + f * so[0], sy = by - 21 - hover + so[1], SA = rowsAt(SHIELD, flip), gl = o.shGlow || 0;
    for (let y = -1; y <= SHIELD.length; y++) for (let x = -1; x <= SHIELD[0].length; x++) { const c = SA(x, y); if (c !== '.' && c !== undefined && x >= 0 && y >= 0 && x < SHIELD[0].length && y < SHIELD.length) px(sx + x, sy + y, c === 'k' && gl > 0 && dth(sx + x, sy + y + Math.floor(time * 8)) < gl ? '#ff3a30' : SHIELD_P[c]);
      else if (gl > 0.3 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const q = SA(x + dx, y + dy); return q && q !== '.'; }) && dth(sx + x, sy + y + Math.floor(time * 10)) < gl * 0.8) px(sx + x, sy + y, '#e83a30'); } // 응징 자세: 방패 테두리 붉게
    if (sA == null) { if (pose === 'swing') drawCellWeapon(SPEAR, cx + f * 8, by - 9 - hover, f > 0 ? -0.05 : Math.PI + 0.05); }
    else if (!o.noSpear && wFront) drawCellWeapon(SPEAR, spX, spY, sA); }
  if (wv && o.smear && key !== 'utu') smearArc(o.smear, hx, hy, f);
  if (wv && wFront && key !== 'utu') drawCellWeapon(W0, hx, hy, ang);
  return { top: y0, x0, W, H };
}

// ================================================================ 피의 결투 원 (3장 격전지 바닥)
// state: 'stain'(진실을 모를 때 · 얼룩) | 'pulse'(진실 1·2를 안 판 · 붉게 맥동) | 'enter'(원 안에 섬 · 붉은 기둥) | 'back'(추방되어 돌아옴)
function bloodCircle(cx, cy, state, t) {
  const rx = 19, ry = 9, pulse = state === 'pulse' || state === 'back' ? (Math.floor(t * 2.4) % 3) : 0;
  const dry = ['#2c0a08', '#3a0e0a', '#4a1410'];
  for (let a = 0; a < 160; a++) { const q = a / 160 * Math.PI * 2, wob = (hh(a, 7) - 0.5) * 1.2; for (const [r, s] of [[1, 0], [0.82, 1]]) { const x = Math.round(cx + Math.cos(q) * (rx * r + wob)), y = Math.round(cy + Math.sin(q) * (ry * r + wob * 0.5));
    if (state === 'stain') { if (hh(a, s + 3) < 0.55) px(x, y, dry[(a + s) % 3]); continue; }
    const lit = (a + Math.floor(t * 30)) % 40 < 8 + pulse * 4; px(x, y, s ? (lit ? '#ff5a3a' : '#a0181c') : (lit ? '#ffb070' : '#d02824')); } }
  // 결투 표식: 마주 보는 두 칼자국 + 눈금 6개
  const tick = state === 'stain' ? '#3a0e0a' : '#c02020';
  for (let i = 0; i < 6; i++) { const q = i / 6 * Math.PI * 2 + 0.26; for (let k = 0; k < 2; k++) px(Math.round(cx + Math.cos(q) * (rx * 0.82 - 1 - k)), Math.round(cy + Math.sin(q) * (ry * 0.82 - 1 - k * 0.5)), tick); }
  for (let k = -3; k <= 3; k++) { if (state === 'stain' && hh(k, 9) < 0.4) continue; px(cx - 5 + k, cy - Math.round(k * 0.6), state === 'stain' ? '#3a0e0a' : '#e03024'); px(cx + 5 + k, cy + Math.round(k * 0.6), state === 'stain' ? '#3a0e0a' : '#e03024'); }
  if (state === 'stain') { for (let i = 0; i < 14; i++) px(cx + Math.round((hh(i, 1) - 0.5) * 50), cy + Math.round((hh(i, 2) - 0.5) * 22), '#2c0a08'); return; }
  glow(cx, cy, 26, '255,50,40', 0.22 + pulse * 0.08, 12);
  for (let i = 0; i < 5; i++) { const k = (t * 0.7 + i / 5) % 1; px(cx - 14 + i * 7, cy + 2 - Math.floor(k * 16), k < 0.5 ? '#ff6a50' : '#801418'); }
  if (state === 'enter') { const k = (t % 1.4) / 1.4; glow(cx, cy - 20, 24, '255,60,40', 0.6 * (1 - k), 40); for (let y = -60; y < 0; y++) for (let x = -10; x <= 10; x++) if (dth(cx + x, cy + y + Math.floor(t * 20)) < (1 - Math.abs(x) / 11) * (1 - k) * 0.7 * (1 + y / 60)) px(cx + x, cy + y, Math.abs(x) < 3 ? '#ffd0a0' : '#ff5a3a'); }
}

const AR = { cx: 192, cy: 130, rx: 120, ry: 58, ring: [192, 132], exit: [192, 178], steles: [[136, 84, 'tusk', 'gor'], [192, 80, 'axe', 'zak'], [248, 84, 'shield', 'utu']] };
const DIRT = ['#634429', '#553922', '#4f3522', '#472e1c', '#3f2818', '#2e1c10'];
const CURB = ['#b09484', '#8e7464', '#6a5446', '#4a3a30', '#2a1e18'];
const STONE = ['#a08a7a', '#806c60', '#64544a', '#4a3e36', '#342a24', '#221a16']; // 바닥 흙 · 연석과 같은 따뜻한 돌
const WOOD = ['#8a6440', '#6a4a2c', '#4e3420', '#33220f'];
// 상징 (작은 것: 받침 위 물건 · 큰 것: 비석에 새긴 홈)
const SYM = {
  tusk: ['....kk', '...kwk', '..kwWk', '.kwWk.', 'kwWk..', 'kwWk..', 'kWWk..', 'kWWk..', '.kWWk.', '..kkk.'],
  axe: ['..kkk...', '.kwwsk..', 'kwwssk..', 'kwsshkk.', '.kkshhk.', '...khhk.', '...kchk.', '..kck.k.', '.kck....', '.kk.....'],
  shield: ['..kkkk..', '.kgggGk.', 'kgGkgggk', 'kgkEkgGk', 'kggkkggk', 'kgGggkgk', '.kgggGk.', '..kkkk..'],
};
const SYMP = { k: '#1a0610', w: '#fff0dc', W: '#d8b8a8', s: '#ffd8cc', h: '#6c1a30', c: '#a0606a', g: '#ffe4d4', G: '#d89a90', E: '#3a0816' };
const SIGB = { // 비석에 새긴 큰 상징 (9×11)
  tusk: ['......xx.', '.....xx..', '....xx...', '...xx....', '..xx.....', '..xx.....', '..xx.....', '..xxx....', '...xxx...', '....xx...', '.........'],
  axe: ['..xxx....', '.xxxxx...', 'xxxxxx...', 'xxx.xx...', '.x..xx...', '....xx...', '....xx...', '....xx...', '...x.x...', '..x......', '.x.......'],
  shield: ['..xxxxx..', '.xxxxxxx.', 'xxxx.xxxx', 'xxx...xxx', 'xxxx.xxxx', 'xxx.x.xxx', 'xxxxx.xxx', '.xxxxx.x.', '..xxxxx..', '.........', '.........'],
};
function LG() { const [c, x] = __mk(384, 216); return { c, put(px0, py0, col) { if (!col) return; x.fillStyle = col; x.fillRect(px0 | 0, py0 | 0, 1, 1); } }; }
const eR = (x, y) => ((x + 0.5 - AR.cx) / AR.rx) ** 2 + ((y + 0.5 - AR.cy) / AR.ry) ** 2;
function arenaBase() {
  const P = LG();
  for (let y = 0; y < 216; y++) for (let x = 0; x < 384; x++) {
    const r = eR(x, y);
    if (r > 1.17) { // 바깥: 붉은 어둠 (디더로 흐려짐)
      const k = Math.min(1, (r - 1.17) / 0.6); P.put(x, y, dth(x, y) > k ? '#24130e' : dth(x + 2, y + 1) > k * 1.6 ? '#1a0c0a' : '#120808'); continue; }
    if (r > 1.0) { // 테두리 돌 연석: 칸마다 이음매 · 바깥쪽 윗면 밝게 · 안쪽 그늘
      const q = Math.atan2((y + 0.5 - AR.cy) / AR.ry, (x + 0.5 - AR.cx) / AR.rx), seg = Math.floor((q + Math.PI) / (Math.PI * 2) * 64), segF = ((q + Math.PI) / (Math.PI * 2) * 64) % 1;
      const k = (Math.sqrt(r) - 1) / 0.082; let c = k < 0.18 ? CURB[4] : k < 0.36 ? CURB[3] : k < 0.72 ? (y < AR.cy ? CURB[2] : CURB[1]) : k < 0.86 ? CURB[2] : CURB[4]; if (segF < 0.06) c = CURB[4]; if (k > 0.36 && k < 0.5 && y > AR.cy) c = CURB[0]; if (hh(seg, 3) < 0.2 && k > 0.36 && k < 0.72) c = CURB[2]; if (hh(x, y) < 0.06) c = CURB[2];
      P.put(x, y, c); continue; }
    const n = hh(x >> 1, y >> 1);
    let c = n < 0.08 ? DIRT[1] : n < 0.4 ? DIRT[3] : n < 0.47 ? DIRT[2] : DIRT[3];
    if (dth(x, y) < 0.25 && n > 0.7) c = DIRT[4];
    if (hh(x, y) < 0.004) c = '#e0d4c0'; // 뼛조각
    P.put(x, y, c);
  }
  // 말라붙은 핏자국 (3장 방과 같은 결)
  for (let i = 0; i < 7; i++) { const q = hh(i, 41) * Math.PI * 2, d = 0.35 + hh(i, 42) * 0.5, cx0 = Math.round(AR.cx + Math.cos(q) * AR.rx * d), cy0 = Math.round(AR.cy + Math.sin(q) * AR.ry * d);
    for (let j = 0; j < 22; j++) { const x = cx0 + Math.round((hh(i, j) - 0.5) * 12), y = cy0 + Math.round((hh(j, i + 50) - 0.5) * 5); P.put(x, y, j % 3 ? '#2f0906' : '#3e0e0a'); } }
  // 출구 원 (작은 피의 원, 들어온 자리)
  const [ex, ey] = AR.exit; for (let a = 0; a < 90; a++) { const q = a / 90 * Math.PI * 2; P.put(Math.round(ex + Math.cos(q) * 13), Math.round(ey + Math.sin(q) * 6), '#3a0e0a'); }
  // 흩어진 뼈
  for (let i = 0; i < 9; i++) { const q = hh(i, 21) * Math.PI * 2, d = 0.55 + hh(i, 22) * 0.35, x = Math.round(AR.cx + Math.cos(q) * AR.rx * d), y = Math.round(AR.cy + Math.sin(q) * AR.ry * d); if (Math.abs(x - 192) < 50 && Math.abs(y - 122) < 30) continue; P.put(x, y, '#e8dccb'); P.put(x + 1, y, '#e8dccb'); P.put(x + 2, y, '#b8ac98'); P.put(x - 1, y + 1, '#1a0e0a'); P.put(x + 3, y + 1, '#1a0e0a'); }
  return P.c;
}
// 비석: 거친 선돌 20×34칸 (왼쪽 위 빛) — state: 'wait'(홈이 붉게) | 'fight'(밝게 타오름) | 'done'(꺼지고 금 감) | 'dark'
// 흙 둔덕: 돌 밑동을 바닥 흙으로 덮어 땅에 박힌 것처럼 (윗선 들쭉날쭉 · 위는 밝게 · 자갈 몇 개)
function mound(cx, by, rx, h, seed) { const DL = ['#7a5636', '#6a4a2e', '#5a3e26', '#4a321e'];
  for (let x = -rx; x <= rx; x++) { const k = 1 - (x / rx) ** 2; const top = by - Math.max(0, Math.round(h * k + (hh(x, seed) - 0.5) * 1.6)); if (top >= by + 1) continue;
    for (let y = top; y <= by + 1; y++) px(cx + x, y, y === top ? DL[0] : y === top + 1 ? DL[1] : (dth(cx + x, y) < 0.5 ? DL[2] : DL[3])); }
  for (let i = 0; i < 5; i++) { const x = cx + Math.round((hh(i, seed + 3) - 0.5) * rx * 2.2), y = by + Math.round(hh(i, seed + 4) * 2); px(x, y, STONE[2]); px(x + 1, y, STONE[3]); px(x, y - 1, '#120a0a'); px(x + 1, y - 1, '#120a0a'); px(x + 2, y, '#120a0a'); }
}
function stele(cx, by, sym, state, t) {
  const W = 20, H = 34, x0 = cx - 10, y0 = by - H;
  const seedS = cx * 3 + 1, hw = y => { const k = y / (H - 1); return 3.2 + k * 6.6 + (hh(Math.floor(y / 3), seedS) - 0.5) * 1.6; }, lean = y => Math.round((1 - y / H) * (hh(1, seedS) - 0.5) * 3), ctr = 9.5;
  const inS = (x, y) => { if (y < 0 || y >= H || x < 0 || x >= W) return false; const w = hw(y), c = ctr + lean(y); if (y < 3 && Math.abs(x - c + (hh(2, seedS) - 0.5) * 4) > 1.5 + y * 1.4) return false; return x >= c - w && x <= c + w - (hh(y >> 2, seedS + 9) < 0.25 ? 1 : 0); };
  shadowE(cx + 3, by + 1, 14, 3, 0.7);
  for (let y = -1; y <= H; y++) for (let x = -1; x <= W; x++) {
    if (!inS(x, y)) { if (inS(x + 1, y) || inS(x - 1, y) || inS(x, y + 1) || inS(x, y - 1)) px(x0 + x, y0 + y, '#120a0a'); continue; }
    let s = 2; if (!inS(x - 1, y) || !inS(x, y - 1)) s = 1; if (!inS(x + 1, y) || x > 15) s = 3; if (y > 29) s = 3 + (y > 31 ? 1 : 0);
    if (hh(x0 + x, y0 + y) < 0.1) s++; if (x === 1 && y > 8 && y < 26 && y % 5 === 0) s = 1;
    px(x0 + x, y0 + y, (y === 24 || y === 25) && x > 1 && x < 18 && hh(x, 9) < 0.8 ? (s < 3 ? '#7a2020' : '#5a1414') : STONE[Math.min(5, s)]);
  }
  // 새긴 상징 (음각: 오른쪽 아래 그늘 · 홈 바닥 색)
  const S = SIGB[sym], sx = cx - 5, sy = y0 + 9, lit = state === 'wait' || state === 'fight';
  const fl = state === 'fight' ? 1 : (Math.floor(t * 2) % 2) * 0.3;
  for (let y = 0; y < 11; y++) for (let x = 0; x < 9; x++) if (S[y][x] === 'x') { px(sx + x, sy + y, lit ? (y < 3 ? '#ffb080' : state === 'fight' ? '#ff5a3a' : '#e03028') : '#2a2020'); if (!(S[y + 1] && S[y + 1][x] === 'x')) px(sx + x, sy + y + 1, lit ? '#801018' : STONE[1]); }
  if (lit) glow(cx, sy + 5, 14 + fl * 6, '255,60,40', 0.32 + fl * 0.2, 12);
  if (state === 'done') { let x = cx + 2; for (let y = y0 + 2; y < by - 4; y++) { if (hh(y, 5) < 0.4) x += hh(y, 6) < 0.5 ? -1 : 1; px(x, y, '#120a0a'); if (hh(y, 7) < 0.3) px(x + 1, y, STONE[0]); } }
  mound(cx, by + 1, 15, 5, cx);
}
// 받침: 불규칙한 바윗덩이 (윗면 들쭉날쭉 · 깨진 모서리 · 금) + 상징물. state: 'wait' | 'taken'(상징물이 떠오름) | 'done'(흐려짐)
function pedestal(cx, by, sym, state, t) {
  const W = 17, x0 = cx - 8, hts = [], seed = cx * 7;
  for (let i = 0; i < W; i++) { const e = Math.min(i, W - 1 - i); hts.push(Math.max(2, Math.min(8, Math.round(3 + Math.min(e, 3) * 1.1 + (hh(i, seed) - 0.5) * 2.2 - (e === 0 ? 1 : 0))))); }
  for (let i = 6; i <= 10; i++) hts[i] = Math.max(hts[i], 7); hts[7] = hts[8] = hts[9] = Math.max(hts[8], 7); // 상징물이 앉을 윗면은 고르게
  shadowE(cx + 1, by + 1, 11, 2, 0.6);
  const top = i => by - hts[i];
  for (let i = 0; i < W; i++) for (let y = top(i); y < by; y++) {
    const fromTop = y - top(i), j = by - y; let c;
    if (fromTop === 0) c = i < 5 ? STONE[0] : STONE[1]; else if (fromTop === 1 && hts[i] > 3) c = STONE[1];
    else c = i < 3 ? STONE[2] : i > W - 4 ? STONE[4] : j < 2 ? STONE[4] : STONE[3];
    if (hh(x0 + i, y) < 0.08 && fromTop > 1) c = STONE[2];
    px(x0 + i, y, c);
  }
  // 금 · 깨진 자국
  for (const [i, y] of [[4, 3], [5, 2], [5, 1], [12, 4], [13, 3]]) if (hts[i] > y + 1) px(x0 + i, by - y, '#1e1616');
  // 외곽선
  for (let i = -1; i <= W; i++) { const h = i >= 0 && i < W ? hts[i] : 0, hl = i - 1 >= 0 && i - 1 < W ? hts[i - 1] : 0, hr = i + 1 >= 0 && i + 1 < W ? hts[i + 1] : 0;
    if (i >= 0 && i < W) { px(x0 + i, by - h - 1, '#120a0a'); px(x0 + i, by, '#120a0a'); }
    for (let y = by - Math.max(hl, hr); y < by - h; y++) px(x0 + i, y, '#120a0a'); }
  mound(cx, by + 1, 11, 3, cx + 5);
  // 이끼처럼 낀 말라붙은 피
  px(x0 + 3, by - 2, '#4a1010'); px(x0 + 4, by - 2, '#3a0c0c'); px(x0 + 13, by - 3, '#4a1010');
  const S = SYM[sym], w = S[0].length, h = S.length, rise = state === 'taken' ? 3 + (Math.floor(t * 2) % 2) : 0;
  const sx = cx - Math.floor(w / 2), sy = by - 7 - h - rise;
  if (state === 'done') { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = S[y][x]; if (c !== '.' && dth(sx + x, sy + y) < 0.5) px(sx + x, sy + y, c === 'k' ? '#120a0a' : '#4a3a3a'); } return; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = S[y][x]; if (c !== '.') px(sx + x, sy + y, SYMP[c]); }
  if (state === 'wait' && Math.floor(t * 3 + cx) % 6 === 0) px(sx + w - 2, sy + 1, '#ffffff');
  glow(cx, sy + h / 2, 9, '255,70,50', state === 'taken' ? 0.5 : 0.25, 8);
}
// 투기장 테두리: 돌 연석(바닥) + 하늘로 휜 거대한 엄니 기둥 + 뼈 화로 + 사이사이 날 세운 말뚝
// 위 반원은 바닥과 함께, 아래 반원은 캐릭터 앞에 그린다
const RIM = q => [Math.round(AR.cx + Math.cos(q) * (AR.rx + 6)), Math.round(AR.cy + Math.sin(q) * (AR.ry + 4))];
const TUSKS = [200, 228, 312, 340, 20, 160, 58, 122].map(d => d * Math.PI / 180); // 비석 쪽(위 가운데)은 비움
const BRAZ = [0, 180, 90 - 38, 90 + 38].map(d => d * Math.PI / 180);
function tuskPillar(x, by, side, h) { // side: 휘는 쪽 (+1 오른쪽)
  const cells = new Map(), put = (a, b, c) => cells.set(a + ',' + b, c);
  for (let i = 0; i < h; i++) { const t = i / (h - 1), off = Math.round(side * t * t * 11), w = t < 0.3 ? 5 : t < 0.55 ? 4 : t < 0.75 ? 3 : t < 0.92 ? 2 : 1, y = by - i;
    for (let k = 0; k < w; k++) { const X = x + off + k - Math.floor(w / 2); put(X, y, k === 0 ? '#fff4e0' : k === w - 1 ? '#a8968a' : '#e0d0bc'); }
    if (i === 5 || i === 6) for (let k = -3; k <= 2; k++) put(x + off + k, y, i === 5 ? '#c02028' : '#6a1018'); if (i === 9) for (let k = -2; k <= 2; k++) put(x + off + k, y, '#c8b098'); }
  put(x + Math.round(side * 11), by - h, '#fff4e0');
  for (const k of cells.keys()) { const [a, b] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!cells.has((a + dx) + ',' + (b + dy))) px(a + dx, b + dy, '#120a0a'); }
  for (const [k, c] of cells) { const [a, b] = k.split(',').map(Number); px(a, b, c); }
  // 묶은 끈 끝자락 + 매단 작은 해골
  px(x - side * 4, by - 4, '#c02028'); px(x - side * 4, by - 3, '#6a1018'); px(x - side * 4, by - 2, '#a01828');
}
function brazier(x, by, t) {
  shadowE(x, by + 1, 6, 2, 0.6);
  for (const lx of [-3, 0, 3]) { px(x + lx, by, '#120a0a'); px(x + lx, by - 1, '#4a3a34'); px(x + lx, by - 2, '#4a3a34'); }
  for (let j = 0; j < 4; j++) for (let i = -5 + (j > 2 ? 1 : 0); i <= 5 - (j > 2 ? 1 : 0); i++) px(x + i, by - 6 + j, j === 0 ? (i < 0 ? '#e8dccb' : '#b8a898') : i < -2 ? '#8a7a70' : i > 2 ? '#3e322c' : '#5e4e46');
  for (let i = -6; i <= 6; i++) { px(x + i, by - 7, '#120a0a'); px(x + i, by - 2, i % 3 === 0 ? '#120a0a' : '#2a201c'); }
  px(x - 6, by - 6, '#120a0a'); px(x + 6, by - 6, '#120a0a'); px(x - 6, by - 5, '#120a0a'); px(x + 6, by - 5, '#120a0a');
  const f = Math.floor(t * 8 + x) % 3, FL = [['..1..', '.121.', '12321', '23332', '33333'], ['.1...', '.12..', '1232.', '23321', '33333'], ['...1.', '..21.', '.2321', '12332', '33333']][f];
  const FC = { 1: '#ffd080', 2: '#ff7a3a', 3: '#d02020' };
  FL.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') px(x - 2 + i, by - 12 + j, FC[c]); }));
  if (Math.floor(t * 5 + x) % 4 === 0) px(x + (f - 1), by - 14, '#ffb060');
  glow(x, by - 9, 20, '255,70,40', 0.4, 14);
}
function stakeAt(x, by, h, sk) {
  for (let y = 0; y < h; y++) for (let k = 0; k < 3; k++) { if (y === 0 && k !== 1) continue; px(x + k, by - h + y, y === 0 ? '#c8b8a8' : k === 0 ? WOOD[1] : k === 2 ? WOOD[3] : WOOD[2]); }
  for (let y = -1; y <= h; y++) { px(x - 1, by - h + y, '#120a0a'); px(x + 3, by - h + y, '#120a0a'); } for (let k = -1; k <= 3; k++) px(x + k, by, '#120a0a'); px(x, by - h - 1, '#120a0a'); px(x + 2, by - h - 1, '#120a0a'); px(x + 1, by - h - 1, '#120a0a');
  if (sk) { px(x, by - h - 3, '#e8dccb'); px(x + 1, by - h - 3, '#e8dccb'); px(x + 2, by - h - 3, '#b8ac98'); px(x, by - h - 2, '#3a0816'); px(x + 1, by - h - 2, '#e8dccb'); px(x + 2, by - h - 2, '#3a0816'); for (const [a, b] of [[-1, -3], [3, -3], [-1, -2], [3, -2], [0, -4], [1, -4], [2, -4]]) px(x + a, by - h + b, '#120a0a'); }
}
function stakes(front, t = 0) {
  const items = [];
  const n = 0; /* v3.56 둘레 말뚝 울타리 뺌 (엄니 기둥 · 화로만 남김) */ for (let i = 0; i < n; i++) { const q = i / n * Math.PI * 2 + 0.04; if ((Math.sin(q) > 0) !== front) continue; if (TUSKS.concat(BRAZ).some(a => Math.abs(Math.atan2(Math.sin(q - a), Math.cos(q - a))) < 0.09)) continue; if (Math.sin(q) < -0.55 && Math.abs(Math.cos(q)) < 0.6) continue; if (Math.sin(q) > 0.9) continue;
    const [x, by] = RIM(q); items.push([by, () => stakeAt(x - 1, by, 5 + Math.floor(hh(i, 78) * 3), i % 5 === 2)]); }
  for (const q of TUSKS) { if ((Math.sin(q) > 0) !== front) continue; const [x, by] = RIM(q); items.push([by, () => tuskPillar(x, by, Math.cos(q) > 0 ? -1 : 1, Math.sin(q) > 0 ? 24 : 30)]); }
  for (const q of BRAZ) { if ((Math.sin(q) > -0.01) !== front) continue; const [x, by] = RIM(q); items.push([by, () => brazier(x, by, t)]); }
  items.sort((a, b) => a[0] - b[0]).forEach(e => e[1]());
}
// 빛 (디더 · 어둡게만): 결투장 전체 어둠 + 비석 · 원의 붉은 빛
function embers(t, n = 26) { for (let i = 0; i < n; i++) { const k = (t * (0.05 + hh(i, 2) * 0.05) + hh(i, 1)) % 1, x = Math.round(30 + hh(i, 3) * 324 + Math.sin(k * 9 + i) * 3), y = Math.round(212 - k * 220); px(x, y, k < 0.3 ? '#ff8a60' : k < 0.7 ? '#c02028' : '#601018'); } }
function redMist(t, cx, cy, k = 1) { for (let i = 0; i < 22; i++) { const p = (t * 0.45 + i / 22) % 1; if (p > k) continue; const x = cx - 12 + Math.round(hh(i, 4) * 24 + Math.sin(p * 7 + i) * 3), y = cy - Math.round(hh(i, 5) * 26) - Math.floor(p * 40); if (dth(x, y) < 1 - p) px(x, y, p < 0.3 ? '#ff5a3a' : p < 0.6 ? '#c01828' : '#5a0c14'); } }
// 하늘에서 내리꽂히는 금빛 빛기둥 (진짜 왕의 빛) — 난폭하고 빠르게: 0.07초 만에 땅에 박힘 → 크루가쉬가 고깃덩이로 산산조각
const BEAM_HIT = 0.07;
const MEAT = { k: '#0b0a0e', m: '#c0392b', M: '#7a1a1a', h: '#f08a72', s: '#6e9a3e', S: '#3e6424', b: '#ece0c4', B: '#b8ac90' };
const CHUNK = [ // 칸 단위 고깃덩이 — 회전 대신 두 모양을 번갈아 (도트 규칙)
  [['.kkkk.', 'khhmmk', 'kmmmMk', 'kmMMMk', '.kkkk.'], ['.kkkk.', 'kMmmhk', 'kMMmmk', 'kmmmhk', '.kkkk.']],
  [['kkkkk.', 'ksssSk', 'kSsSSk', 'kmMMmk', '.kkkkk'], ['.kkkkk', 'kmMMmk', 'kSSsSk', 'kSsssk', 'kkkkk.']],
  [['.kk..kk', 'kbbkkbk', 'kBbbbbk', '.kk..kk'], ['kk..kk.', 'kbkkbbk', 'kbbbbBk', 'kk..kk.']],
  [['.kkk.', 'khmmk', 'kmMMk', '.kkk.'], ['.kkk.', 'kMmhk', 'kmmMk', '.kkk.']],
  [['kkkkkk', 'kssSSk', 'khmmMk', 'kmMMMk', 'kkkkkk'], ['kkkkkk', 'kMMmmk', 'kMmmhk', 'kSSssk', 'kkkkkk']],
  [['.kkk.', 'ksSsk', 'kmMmk', '.kkk.'], ['.kkk.', 'kmMmk', 'kSsSk', '.kkk.']]];
function chunkAt(x, y, id, fr) { const sh = CHUNK[id % CHUNK.length][fr & 1]; for (let j = 0; j < sh.length; j++) for (let i = 0; i < sh[j].length; i++) { const c = sh[j][i]; if (c !== '.') px(Math.round(x) - 2 + i, Math.round(y) - sh.length + 1 + j, MEAT[c]); } }
function beamKill(cx, by, t, L) { // v2.84 L: 'g' 바닥에 남는 것(구덩이 · 떨어진 고깃덩이 · 핏자국) | 'f' 날아가는 것 · 빛기둥
  const hit = t - BEAM_HIT, cy = by - 12;
  // 바닥: 그을린 구덩이 + 피 웅덩이 (남음)
  if (hit >= 0 && L === 'g') { const k = Math.min(1, hit / 0.18);
    for (let y = -9; y <= 9; y++) for (let x = -22; x <= 22; x++) { const d = Math.hypot(x / 22, y / 9) + (hh(x, y + 70) - 0.5) * 0.35; if (d > k) continue;
      px(cx + x, by + y, d < 0.35 ? '#140808' : d < 0.6 ? (hh(x, y) < 0.5 ? '#3a0a0c' : '#5e1416') : (dth(cx + x, by + y) < 0.5 ? '#5e1416' : '#7a1a1a')); }
    for (let i = 0; i < 46; i++) { const a = hh(i, 3) * 6.283, r = 18 + hh(i, 4) * 46 * k, x = Math.round(cx + Math.cos(a) * r), y = Math.round(by + Math.sin(a) * r * 0.42); px(x, y, hh(i, 5) < 0.5 ? '#7a1a1a' : '#5e1416'); if (hh(i, 6) < 0.4) px(x + 1, y, '#5e1416'); } }
  // 고깃덩이: 몸 가운데에서 사방으로 터져 포물선으로 떨어져 바닥에 남음
  if (hit >= 0) for (let i = 0; i < 26; i++) {
    const a = hh(i, 11) * 6.283, dist = 22 + hh(i, 12) * 70, lx = cx + Math.cos(a) * dist, ly = by + Math.sin(a) * dist * 0.42 + 2, Tf = 0.45 + hh(i, 13) * 0.5, h = 10 + hh(i, 14) * 34;
    const q = Math.min(1, hit / Tf), x = cx + (lx - cx) * q, y = cy + (ly - cy) * q - h * 4 * q * (1 - q);
    if ((q < 1) !== (L === 'f')) continue; chunkAt(x, y, i, q < 1 ? Math.floor(hit * 12 + i) : i); if (q >= 1) { px(Math.round(lx) - 3, Math.round(ly) + 1, '#5e1416'); px(Math.round(lx) + 2, Math.round(ly) + 1, '#7a1a1a'); } }
  // 핏방울: 더 빠르고 멀리, 떨어진 자리에 점으로 남음
  if (hit >= 0) for (let i = 0; i < 70; i++) {
    const a = hh(i, 21) * 6.283, dist = 10 + hh(i, 22) * 90, lx = cx + Math.cos(a) * dist, ly = by + Math.sin(a) * dist * 0.42, Tf = 0.3 + hh(i, 23) * 0.4, h = 6 + hh(i, 24) * 40;
    const q = Math.min(1, hit / Tf), x = Math.round(cx + (lx - cx) * q), y = Math.round(cy + (ly - cy) * q - h * 4 * q * (1 - q));
    if ((q < 1) !== (L === 'f')) continue; px(x, y, q < 1 ? (i % 3 ? '#c0392b' : '#e0705a') : '#5e1416'); }
  if (L !== 'f') return;
  // 빛기둥
  if (t < BEAM_HIT) { const yh = Math.round(by * t / BEAM_HIT); for (let y = 0; y <= yh; y++) for (let x = -2; x <= 2; x++) px(cx + x, y, Math.abs(x) < 2 ? '#ffffff' : '#fff0b0'); for (let x = -4; x <= 4; x++) for (let y = 0; y <= 3 - Math.abs(x); y++) if (hh(x, y) < 0.85) px(cx + x, yh + y - 1, '#ffffff'); return; }
  const W = hit < 0.32 ? 16 : hit < 0.6 ? Math.round(16 * (1 - (hit - 0.32) / 0.28)) : 0, fr = Math.floor(t * 30);
  if (W > 0) { // 기둥: 아래 끝은 직선으로 자르지 않고 칸마다 들쭉날쭉 + 땅에 부딪혀 퍼지는 빛
    const bot = x => by - 2 - Math.floor(hh(x, fr + 3) * 5) + Math.round(Math.abs(x) / (W + 3) * 3);
    for (let y = 0; y <= by + 4; y++) { const j = Math.round((hh(y, fr) - 0.5) * 3); for (let x = -W - 3 + j; x <= W + 3 + j; x++) { const a = Math.abs(x - j) / (W + 3); if (a > 1 || y > bot(x)) continue;
      const c = a < 0.35 ? '#ffffff' : a < 0.6 ? '#fff0b0' : a < 0.82 ? '#ffd060' : '#e0a030'; if (a > 0.6 && dth(cx + x, y + fr * 7) > (1 - a) * 3) continue; px(cx + x, y, c); } }
    const RX = W + 14, RY = 7; // 바닥 튐: 가운데는 희고 가장자리로 갈수록 금빛 디더, 둘레는 칸마다 울퉁불퉁
    for (let y = -RY - 2; y <= RY + 1; y++) for (let x = -RX - 3; x <= RX + 3; x++) { const d = Math.hypot(x / RX, y / RY) + (hh(x + fr, y) - 0.5) * 0.45; if (d > 1) continue;
      if (dth(cx + x, by + y + fr) > (1 - d) * 2.4) continue; px(cx + x, by + y, d < 0.3 ? '#ffffff' : d < 0.55 ? '#fff0b0' : d < 0.8 ? '#ffd060' : '#e0a030'); }
    for (let i = 0; i < 14; i++) { const a = hh(i, fr) * 3.14, r = RX * (0.6 + hh(i, fr + 1) * 0.6); const x = Math.round(cx + Math.cos(a) * r * (hh(i, 9) < 0.5 ? 1 : -1)), y = Math.round(by - Math.sin(a) * 4 - hh(i, fr + 2) * 6); px(x, y, '#fff0b0'); } }
  if (hit < 0.6) { // 충격파 두 겹 + 섬광
    for (const [d, sp] of [[0, 260], [0.08, 200]]) { const r = (hit - d) * sp; if (r < 0 || r > 120) continue; for (let a = 0; a < 140; a++) { const q = a / 140 * 6.283; if (dth(a, 1) < 1 - r / 120) px(Math.round(cx + Math.cos(q) * r), Math.round(by + Math.sin(q) * r * 0.42), '#fff3c0'); } }
    glow(cx, by - 30, 70, '255,236,170', 0.9 * (1 - hit / 0.6), 70); }
  // 남은 연기 · 금빛 불티
  if (hit > 0.4) for (let i = 0; i < 10; i++) { const k = ((t * 0.35 + i / 10) % 1); px(Math.round(cx + (hh(i, 31) - 0.5) * 30 + Math.sin(k * 5 + i) * 2), Math.round(by - k * 40), dth(i, Math.floor(k * 16)) < 1 - k ? (i % 3 ? '#4a3a36' : '#ffd060') : null); }
}

// ================================================================ 선조 등장 — 폭발적으로: 모임 → 핏빛 기둥 분출 → 섬광 → 충격파 · 파편 · 핏방울 (화면 흔들림 없이)
// v3.60 등장 연출 강화: ① 비석에서 핏줄기가 흘러와 바닥에 상징이 새겨짐 → ② 하늘까지 닿는 핏빛 기둥 + 휘감는 핏빛 띠 + 섬광 → ③ 충격 고리 세 겹 + 선조별 마무리
//   (고르마크: 땅이 쩍 갈라짐 · 자카: X자 초승달 베기 · 우투르: 둘레에 뼈 가시가 솟음) → 돌 파편 · 불티
const BG0 = 0.9; // 모으는 시간
function ancBurst(cx, by, T, key) {
  const ST = (key && STL(key)) || [cx, by - 50], sx = ST[0], sb = ST[1];
  if (T < BG0) { const k = T / BG0;
    const n = 48; for (let i = 0; i <= n; i++) { const u = i / n; if (u > k * 1.4) break; const x = Math.round(sx + (cx - sx) * u), y = Math.round(sb - 22 + (by - 4 - (sb - 22)) * u - Math.sin(u * Math.PI) * 8); // 비석 → 가운데 핏줄기
      px(x, y, (i + Math.floor(T * 40)) % 6 < 2 ? '#ffd0a0' : '#ff3a2a'); if (i % 3 === 0) px(x, y + 1, '#801418'); }
    const S = key && SIGB[ANC[key].sym]; if (S) for (let j = 0; j < S.length; j++) for (let i = 0; i < S[j].length; i++) { if (S[j][i] !== 'x') continue; const X = cx - 9 + i * 2, Y = by - 5 + j; if (dth(X, Y + Math.floor(T * 12)) > k * 1.2) continue; px(X, Y, k > 0.7 && (i + j + Math.floor(T * 20)) % 5 === 0 ? '#ffe0b0' : '#ff3a2a'); px(X + 1, Y, '#c01820'); } // 바닥에 새겨지는 상징
    for (let i = 0; i < 8; i++) { const q = i / 8 * Math.PI * 2 + 0.2; let x = cx, y = by; for (let s0 = 0; s0 < 4 + k * 14; s0++) { x += Math.cos(q + Math.sin(s0 * 1.7 + i) * 0.5) * 1.4; y += Math.sin(q + Math.sin(s0 * 1.7 + i) * 0.5) * 0.7; px(Math.round(x), Math.round(y), s0 < 3 ? '#ffd0a0' : '#c01820'); } }
    for (let i = 0; i < 40; i++) { const q = hh(i, 3) * Math.PI * 2, r = (1 - ((k * 1.8 + hh(i, 4)) % 1)) * 44; px(Math.round(cx + Math.cos(q) * r), Math.round(by - 8 + Math.sin(q) * r * 0.55), r < 12 ? '#ffe0b0' : '#ff4a3a'); }
    glow(cx, by - 4, 12 + k * 18, '255,60,40', 0.3 + k * 0.4, 8 + k * 8);
    return;
  }
  const t = T - BG0;
  if (t < 0.75) { // 하늘까지 닿는 핏빛 기둥 + 휘감는 띠
    const k = t / 0.75, W = Math.round(6 + 14 * Math.sin(Math.min(1, k * 2.2) * Math.PI / 2) * (1 - k * 0.55)), top = Math.round(by - 230 * Math.min(1, k * 4));
    for (let y = top; y <= by; y++) for (let x = -W - 3; x <= W + 3; x++) { const a = Math.abs(x) / (W + 3); if (dth(cx + x, y + Math.floor(T * 30)) > (1 - a) * 1.7) continue; px(cx + x, y, a < 0.25 ? '#ffffff' : a < 0.5 ? '#ffd8b0' : a < 0.75 ? '#ff5a3a' : '#a01020'); }
    for (let i = 0; i < 70; i++) { const ang = t * 16 + i * 0.45, y = by - ((i * 4 + t * 260) % 230); if (y < top) continue; const x = cx + Math.cos(ang) * (W + 7); if (Math.sin(ang) < -0.2 && i % 2) continue; px(Math.round(x), Math.round(y), Math.sin(ang) > 0 ? '#ffe0b0' : '#c01820'); }
    glow(cx, by - 40, 50, '255,80,50', 0.8 * (1 - k), 70);
  }
  if (t < 0.22) { const k = t / 0.22; glow(cx, by - 20, 110, '255,235,210', 1.0 * (1 - k), 80); } // 섬광
  if (t < 1.5) for (const [d, col] of [[0, '#ffffff'], [0.12, '#ffd0a0'], [0.26, '#ff3a2a']]) { const k = Math.max(0, (t - d) / 1.1); if (k <= 0 || k > 1) continue; const R = 8 + k * 90; // 충격 고리 세 겹
    for (let a = 0; a < 240; a++) { const q = a / 240 * Math.PI * 2; if (dth(a, Math.floor(k * 8)) > 1 - k * 0.85) continue; px(Math.round(cx + Math.cos(q) * R), Math.round(by + Math.sin(q) * R * 0.45), col); } }
  if (t < 1.7) { const fade = Math.max(0, (t - 0.9) / 0.8);
    if (key === 'gor') for (let c = 0; c < 9; c++) { const q = c / 9 * Math.PI * 2 + 0.3, L = Math.min(1, t / 0.22) * (52 + hh(c, 11) * 30); let x = cx, y = by; // 땅이 쩍 갈라짐
      for (let s0 = 0; s0 < L; s0 += 1) { x += Math.cos(q + Math.sin(s0 * 0.3 + c) * 0.35); y += Math.sin(q + Math.sin(s0 * 0.3 + c) * 0.35) * 0.45; if (dth(Math.round(x), Math.round(y)) < fade) continue; const u = s0 / L; px(Math.round(x), Math.round(y), u < 0.3 ? '#ffe0a0' : u < 0.7 ? '#ff5a2a' : '#801418'); if (u < 0.5) px(Math.round(x), Math.round(y) + 1, '#2a0408'); } }
    if (key === 'zak') for (const sg of [-1, 1]) { const R = 18 + Math.min(1, t / 0.35) * 46, rot = sg * 0.75; // X자 초승달 베기
      for (let a = -60; a <= 60; a++) { const q = a / 60 * 1.0, wv = 1 - Math.abs(a) / 60; const ox = Math.cos(q) * R, oy = Math.sin(q) * R * 0.8, X = cx + Math.round(ox * Math.cos(rot) - oy * Math.sin(rot)) * sg, Y = by - 30 + Math.round(ox * Math.sin(rot) + oy * Math.cos(rot));
        if (dth(X, Y) < fade * 1.2) continue; px(X, Y, wv > 0.5 ? '#ffffff' : '#ffd8cc'); if (wv > 0.3) px(X, Y + 1, '#ff3a2a'); } }
    if (key === 'utu') for (let i = 0; i < 12; i++) { const q = i / 12 * Math.PI * 2, X = Math.round(cx + Math.cos(q) * 46), Y = Math.round(by + Math.sin(q) * 20); // 둘레에 솟는 뼈 가시
      const h = Math.round(Math.min(1, Math.max(0, t - i * 0.025) / 0.18) * (8 + (i % 3) * 3) * (1 - fade)); for (let j = 0; j < h; j++) { px(X, Y - j, j === h - 1 ? '#fff8ec' : '#e8d8c8'); px(X - 1, Y - j, '#1a0610'); px(X + 1, Y - j, j < h - 2 ? '#a89888' : '#1a0610'); } }
  }
  if (t < 1.6) for (let i = 0; i < 34; i++) { const q = hh(i, 7) * Math.PI * 2, sp = 34 + hh(i, 8) * 55, up = 50 + hh(i, 9) * 60, tt = Math.max(0, t - 0.02); // 돌 파편 · 핏방울
    const x = Math.round(cx + Math.cos(q) * sp * tt), y = Math.round(by - 4 + Math.sin(q) * sp * tt * 0.5 - up * tt + 70 * tt * tt); if (y > by + 18) continue;
    const rock = i % 3 === 0; px(x, y, rock ? '#806c60' : (i % 2 ? '#ff4a3a' : '#c01820')); if (rock) { px(x + 1, y, '#4a3e36'); px(x, y + 1, '#1a0610'); } }
  if (t > 0.2 && t < 2.2) for (let i = 0; i < 10; i++) { const k = ((t - 0.2) * 0.8 + i / 10) % 1; px(cx - 18 + i * 4, by - 4 - Math.floor(k * 40), k < 0.5 ? '#ff8a60' : '#801418'); } // 남는 불티
}

//=====
// ---------------------------------------------------------------- 진행 단계 (3장 진실 · 선조의 결투장)

// ================================================================ 게임 연결
const even = v => Math.round(v / 2) * 2;
function at(wx, wy, ax, ay, fn) { const o = g; g = ctx; ctx.save(); ctx.translate(even(wx - ax * 2), even(wy - ay * 2)); try { fn(); } finally { ctx.restore(); g = o; } }
const BK = {};
function bake(key, W, H, ax, ay, fn) { // 캔버스 W×H(px)의 왼쪽 위 = 시안 칸 (ax, ay)
  if (BK[key]) return BK[key];
  const [c, x] = __mk(W, H), o = g; g = x; x.translate(-ax * 2, -ay * 2);
  try { fn(); } finally { g = o; }
  return (BK[key] = { c, ax, ay });
}
const TS = () => SAVE.truth || (SAVE.truth = {});
const T3 = () => G.t3 || (G.t3 = { won: {}, freed: false });
const curR = () => G && G.dun && G.dun.cur;
const RED = '#ff6a50';
const ORDER = AR.steles.map(s => s[3]);
const STL = k => AR.steles.find(s => s[3] === k);
const LINES = { // v3.61 선조 말투로 다듬음 (수정안 A) · 배열은 말주머니를 문장마다 나눠 차례로 띄움
  gor: { in: ['피를 이은 자도 아닌 것이 엄니를 세우는가.', '힘으로 증명하라.'], out: ['…꺾인 것은 내 엄니였구나.', '그 힘, 인정하노라.'], rage: '피가 끓는구나…!' },
  zak: { in: ['바람보다 늦은 자는 피를 흘리리라.'], out: ['…네 발이 바람을 앞질렀구나.'], cross: '내 그림자를 좇아 보아라!' },
  utu: { in: ['이 방패를 넘어선 자는 아무도 없었노라.'], out: ['…이토록 오래 버틴 자는 처음이로다.'], stance: '받아 낸 만큼 돌려주리라.', half: '아직 쓰러질 때가 아니다.' },
};
function sayLines(e, L, d0 = 0.1, each = 2.4) { const a = [].concat(L); sayEnemy(e, a[0], d0, each); e.sayQ = a.slice(1).map((t, i) => ({ t, at: time + d0 + each * (i + 1), each })); }
const REFUSE = { knight: '싸우러 온 게 아니다.', ranger: '…사양할게.', mage: '싸울 이유가 없어요.', priest: '도끼를 거두세요.', gunner: '총알 아깝다.' };
const CROWN = { knight: '다만, 왕관에 대해 아는 것이 있다면 듣고 싶다.', ranger: '대신 왕관 얘기나 좀 해 줘.', mage: '그보다… 왕관에 대해 알고 계신 걸 들려주세요.', priest: '저는 왕관의 비밀을 알고 싶어요.', gunner: '왕관에 대해 아는 걸 말해.' };
// v3.20 선조에게 하는 부탁 — 캐릭터마다 성격대로
const ANC_ASK = { knight: ['크루가쉬의 저주를 풀어, 그의 영혼을 자유롭게 해 주십시오.'], ranger: ['크루가쉬.', '그 녀석 저주, 풀어 줘.'], mage: ['크루가쉬에게 걸린 저주를 풀어 주세요.', '그 광기는 그의 뜻이 아니었을 거예요.'], priest: ['크루가쉬의 저주를 거두어 주세요.', '그의 영혼이 쉴 수 있도록.'], gunner: ['주절주절거리지 말고', '크루가쉬 저주나 풀어 줘.'] };
// v3.76 선조 셋을 모두 이긴 뒤: 「이기면 원하는 것을 들어준다」는 소문을 꺼냄 · 크루가쉬 앞에서: 선조가 영혼을 바쳐 저주를 풀었다고 알림
const ANC_RUMOR = { knight: '선조의 결투에서 이기면 소원을 들어준다고 들었다.', ranger: '싸워서 이기면 원하는 걸 들어준다던데.', mage: '당신들을 이기면 소원을 들어주신다는 이야기를 들었어요.', priest: '승리한 자의 소원을 들어주신다고 들었어요.', gunner: '너네 이기면 소원 하나 들어준다며.' };
const KG_FREED = { knight: '선조들이 자신의 영혼을 바쳐 네 저주를 풀었다.', ranger: '네 선조들이 영혼을 내주고 저주를 풀어 줬어.', mage: '선조분들이 영혼을 바쳐 당신의 저주를 풀어 주셨어요.', priest: '선조분들께서 영혼을 희생해 당신의 저주를 거두셨어요.', gunner: '네 조상들이 영혼까지 갈아 넣어서 저주를 풀었다.' };
const LAST = '왕관의 주인은 {해}가 비치는 곳에…';
const PURGE = '왕관은 {해}에 의해 정화되어야 한다…';
const KG_LAST = [['krug', '…크흐.'], ['krug', '약속대로… 말해 주지.'], ['krug', PURGE], ['krug', '그리고…'], ['krug', LAST]]; // v3.77 결투 뒤 컷신 대사
// v3.20 크루가쉬의 마지막 말에 대한 주인공의 반응 (이번 판에 키륵에게서 먼저 「해」를 들었음)
const KG_SUN = { knight: '…또 {해}. 끝내 그 뜻을 듣지 못했군.', ranger: '…{해}. 그 고블린도, 너도.', mage: '{해}가 비치는 곳…|하늘에 별 말고 무언가가 더 있었다는 걸까요.', priest: '{해}…|이분도 그 말을 남기셨네요.', gunner: '{해}라… 말은 다 하고 뒤지라고.' };
// 이 판에서 원이 열리는가: 진실 1 · 2를 안 기록(저장) + 그 캐릭터의 2회차 + 이번 판에서 아직 저주를 풀지 않음
const circleOn = () => { const run = G.truthRun || {}; return !!(run.t1 && run.t2 && TRUTH.loop2() && !T3().freed && !T3().lost); }; /* v3.80 lost: 크루가쉬가 쓰러진 판에 선조가 사라짐 → 원이 닫힘 */ // v3.20 진실 1 · 2를 이번 판에서 봤을 때만 (예전 판 기록은 보지 않음)

// ---------------------------------------------------------------- ① 피의 결투 원 (3장 격전지 하나)
function pickRoom() {
  const D = G.dun; if (!D || D.t3pick || D.forge || D.home || G.stage !== 3) return; D.t3pick = true;
  let c = D.rooms.filter(r => r.type === 'combat' && r !== D.start && !r.invade && r.bloodSpot); // v2.85 배치 때 점유 지도로 미리 잡아 둔 자리
  if (!c.length) c = D.rooms.filter(r => r.type === 'combat' && r !== D.start && !r.invade && SHAPES[r.shape] && SHAPES[r.shape].w >= 480 && SHAPES[r.shape].h >= 300);
  const r = c.length ? pick(c) : null; if (r) r.blood = r.bloodSpot ? { x: r.bloodSpot.x, y: r.bloodSpot.y } : { x: null, y: null };
}
function placeBlood(R) {
  const B = R.blood; if (B.x != null) return;
  const doors = Object.keys(R.doors).filter(d => R.doors[d] != null).map(d => doorIn(d, 30));
  const cand = [[0, 30], [0, -30], [-120, 20], [120, 20], [-120, -40], [120, -40], [0, 90], [-200, 0], [200, 0], [0, -90]];
  for (const [dx, dy] of cand) { const x = even(CX + dx), y = even(CY + dy);
    if (x < A.x0 + 60 || x > A.x1 - 60 || y < A.y0 + 40 || y > A.y1 - 40) continue;
    if (obsHitL(R.obs, x, y, 56) || (typeof decFree === 'function' && !decFree(x, y, 50)) || doors.some(q => Math.hypot(q.x - x, q.y - y) < 90)) continue; B.x = x; B.y = y; return; }
  B.x = even(CX); B.y = even(CY + 30);
}
const inBlood = (B, o) => ((o.x - B.x) / 34) ** 2 + ((o.y - B.y) / 16) ** 2 < 1;
function bloodState(R) { const B = R.blood; if (B.enterT != null) return 'enter'; if (B.backT > time) return 'back'; return circleOn() ? 'pulse' : 'stain'; }

// ---------------------------------------------------------------- ② 선조의 결투장 (숨은 맵)
const AROOM = [40, 30, 344, 204];
function ensureShape() { if (!SHAPES.ancArena) SHAPES.ancArena = { w: (AROOM[2] - AROOM[0]) * 2, h: (AROOM[3] - AROOM[1]) * 2, n: '선조의 결투장' }; }
const loff = () => ({ x: A.x0 - AROOM[0] * 2, y: A.y0 - AROOM[1] * 2 });
const lw = (cx, cy) => { const o = loff(); return { x: o.x + cx * 2, y: o.y + cy * 2 }; };
const inArena = () => !!(G && G.dun && G.dun.anc);
let FLOOR = null, FRONT = null;
function arenaFloor() {
  if (FLOOR) return FLOOR;
  const [c, x] = __mk(768, 432); x.imageSmoothingEnabled = false; x.drawImage(arenaBase(), 0, 0, 768, 432);
  const o = g; g = x; try { stakes(false, 0); } finally { g = o; }
  return (FLOOR = c);
}
function arenaFront(f) {
  if (!FRONT) FRONT = [];
  if (FRONT[f]) return FRONT[f];
  const [c, x] = __mk(768, 432), o = g; g = x; try { stakes(true, f / 8 + 0.001); } finally { g = o; }
  return (FRONT[f] = c);
}
// v3.59 비석(흙더미 포함)과 받침을 따로 구움 — 깊이 정렬을 각자 발치로 해서, 사이에 선 캐릭터가 뒤 비석에 가려지지 않게
const steleArt = (key, st, f) => { const [sx, sb, sym] = STL(key); return bake('st' + key + st + f, 96, 140, sx - 24, sb - 42, () => { stele(sx, sb, sym, st, f / 2 + 0.01); }); };
const pedArt = (key, st, f) => { const [sx, sb, sym] = STL(key); return bake('pd' + key + st + f, 96, 140, sx - 24, sb - 42, () => { pedestal(sx, sb + 14, sym, st === 'fight' ? 'taken' : st === 'done' ? 'done' : 'wait', f / 2 + 0.01); }); };
function makeArena() {
  ensureShape(); setArena(SHAPES.ancArena);
  const R = { id: 0, gx: 0, gy: 0, type: 'ancArena', shape: 'ancArena', doors: { n: null, s: null, w: null, e: null }, visited: true, seen: true, cleared: true, loot: [], seed: 3303, obs: [], props: [], style: { path: 'none' }, deco: [], sprites: [] };
  for (const [sx, sb] of AR.steles) { const p = lw(sx, sb + 11), q = lw(sx, sb - 2); R.obs.push({ t: 'prop', c: true, x: p.x, y: p.y, r: 17 }, { t: 'prop', c: true, x: q.x, y: q.y, r: 16 }); }
  R.nav = buildNav(R.obs);
  return R;
}
function paintArena(gg) {
  const o = loff(); gg.save(); gg.imageSmoothingEnabled = false; gg.fillStyle = '#120808'; gg.fillRect(0, 0, W, H); gg.drawImage(arenaFloor(), o.x, o.y); gg.restore();
}
const ELL = () => { const c = lw(AR.cx, AR.cy); return { cx: c.x, cy: c.y, rx: AR.rx * 2, ry: AR.ry * 2 }; };
function keepIn(o, r) { const E = ELL(), ax = E.rx - r - 10, ay = E.ry - r * 0.5 - 8, dx = (o.x - E.cx) / ax, dy = (o.y - E.cy) / ay, d = Math.hypot(dx, dy); if (d > 1) { o.x = E.cx + dx / d * ax; o.y = E.cy + dy / d * ay; } }
function enterArena(from) {
  const D0 = G.dun, Hr = D0.cur; Hr.loot = G.loot.filter(l => l.life > 0);
  const t3 = T3(); t3.ret = { dun: D0, room: Hr }; t3.hp0 = G.player.hp;
  G.trans = { t: 0, dur: 0.45, phase: 'out', go: () => {
    const L = makeArena();
    G.dun = { rooms: [L], start: L, cur: null, eliteDone: 2, keys: 0, sock: [true, true], bossOpen: true, gate: null, stage: G.stage, home: true, lab: true, anc: true, bx0: 0, bx1: 0, by0: 0, by1: 0 };
    enterRoom(L, null); PILLARS = []; TORCHES = [];
    const p = lw(AR.exit[0], AR.exit[1] - 4); Object.assign(G.player, { x: p.x, y: p.y, face: 1 });
    banner('선조의 결투장', '원하는 바가 있다면, 결투로 얻어 가라.'); sfx('boss');
  } };
  sfx('dodge');
}
function leaveArena(expelled) {
  const t3 = T3(), r = t3.ret; if (!r) return;
  G.trans = { t: 0, dur: expelled ? 0.6 : 0.45, phase: 'out', go: () => {
    G.dun = r.dun; t3.ret = null; G.boss = null; enterRoom(r.room, null);
    const B = r.room.blood, P = G.player; Object.assign(P, { x: B.x, y: B.y + 4, face: 1 }); solveObs(P, P.r);
    if (expelled) { B.backT = time + 3.2; banner('선조가 등을 돌렸다', '결투장에서 추방되었습니다. 결투는 처음부터 다시 시작합니다.'); sfx('warn'); flashT = 0.15; flashColor = '#ff3020'; }
  } };
  sfx('dodge');
}

// ---------------------------------------------------------------- ③ ~ ⑥ 결투
const stState = k => { const t3 = T3(); return t3.won[k] ? 'done' : t3.duel && t3.duel.key === k ? 'fight' : 'wait'; };
let SEQ = null; // 조작이 멈추는 연출 (등장 · 붉은 기둥 · 흩어짐)
const C0 = [AR.cx, AR.cy - 8]; // 선조가 나타나는 자리 (칸)
function challenge(key) {
  const t3 = T3(); t3.duel = { key, no: Object.keys(t3.won).length + 1 };
  TRUTH.freeze();
  SEQ = { k: 'burst', key, t: 0, dur: 2.7, end: () => spawnAnc(key) }; // v3.60 2.3 → 2.7초
  sfx('awaken'); sfx('growl', 0.8);
}
function spawnAnc(key) {
  const p = lw(C0[0], C0[1]), e = makeEnemy('urg', p.x, p.y), A0 = ANC[key], t3 = T3();
  Object.assign(e, { type: 'anc', anc: key, orc: 'anc', kind: null, r: 18, tall: 64, hp: e.hp * 2.4, maxHp: e.hp * 2.4, def: 50, kbRes: 0, grogiMax: 0, grogi: 0, state: 'idle', cd: 2.8, face: -1, dir: Math.PI / 2, pose: key === 'utu' ? 'guard' : 'idle', semiName: null, rise: 0, spd: key === 'zak' ? 74 : key === 'gor' ? 52 : 30, aa: 0, aaT: 0, intro: true });
  e.title = A0.title; e.duelTxt = `결투 ${t3.duel.no} / 3`;
  mo(e, { sq: -0.6, lean: -0.4, wA: key === 'utu' ? -1.6 : GA.up, snap: true }); banner(A0.name, A0.title); // v3.60 나타나며 몸을 펴고 무기를 치켜듦 → 서서히 자세를 잡음
  G.enemies.push(e); G.boss = e; $('bossName').textContent = A0.name; G.bossTime = 300;
  sayLines(e, LINES[key].in, 0.1, 2.4);
  dust(e.x, e.y, 20); addShake(6); sfx('blast', 0.8);
}
// 공격 공용
const P_ = () => G.player;
function poseFor(e, pose, t) { e.pose = pose; e.poseT = t; }
function annoy(e, dmg) { const P = P_(); if (!P.dead) hurtPlayer(dmg, e); }
function hitIn(t, e, mul) { const P = P_(); if (inShape(t, P.x, P.y, P.r)) { hurtPlayer(e.atk * mul, e); return true; } return false; }
// ================================================================ v3.56 고르마크 (힘) 다시 만듦
// 동작: 몸 찌그러짐 · 늘어남 · 기울기 + 대망치 각도 보간 · 휘두름 궤적 · 돌진 잔영 · 도약 그림자 · 벽 충돌 기절(별)
// 패턴: 엄니 돌격(조준이 잠깐 따라옴 · 벽에 박으면 기절 = 반격 기회) · 하늘 가르기(높이 뛰어 그림자가 따라옴 → 내려찍기) ·
//       세 번의 노도(가로 · 올려 · 내려찍기 3연타, 매 타마다 다시 조준) · 체력 절반 아래: 선조의 분노(발 구르기 3번 + 바위 낙하), 돌격 두 번 연속
const GA = { rest: -1.25, back: 2.55, up: -1.7, high: -2.3, fwd: 0.85, low: 1.2 }; // 대망치 각도 (앞 = 0, 위 = 음수, 뒤 = ±π)
function gm(e) { return e.m || (e.m = { sq: 0, sqT: 0, lean: 0, leanT: 0, wA: GA.rest, wAT: GA.rest, wK: 9, trail: [], ghosts: [], gT: 0, z: 0 }); }
function mo(e, o) { const m = gm(e); if (o.sq != null) m.sqT = o.sq; if (o.lean != null) m.leanT = o.lean; if (o.wA != null) { m.wAT = o.wA; m.wK = o.k || 9; } if (o.snap) { m.sq = m.sqT; m.lean = m.leanT; } }
function strike(e, wA, sq, lean) { const m = gm(e); m.wAT = wA; m.wK = 55; m.sqT = sq; m.leanT = lean; m.sq = sq * 0.7; m.lean = lean; }
// v3.56b 전조 = 판정 = 그림: 휘두르기는 좌우를 향한 몸에 맞게 수평에서 ±50°까지만 겨눔 · 사거리는 대망치가 실제로 닿는 거리 · 돌격 예고선은 결투장 벽까지
const G_REACH = 84, G_ARC = 150;
const clampH = q => { const h = Math.cos(q) >= 0 ? 0 : Math.PI, d = Math.atan2(Math.sin(q - h), Math.cos(q - h)); return h + clamp(d, -0.87, 0.87); };
function ellLen(e, ang, max) { const o = { x: e.x, y: e.y }; let L = 0; while (L < max) { o.x = e.x + Math.cos(ang) * (L + 6); o.y = e.y + Math.sin(ang) * (L + 6); if (!inEll(o, e.r)) break; L += 6; } return Math.max(40, L + e.r); }
function wAt(e, tx, ty) { const hx = e.x + e.face * 14, hy = e.y - 14; return Math.atan2(ty - hy, (tx - hx) * e.face); } // 대망치 머리가 (tx, ty)에 떨어지는 각도 (앞 = 0)
const inEll = (o, r) => { const E = ELL(), dx = (o.x - E.cx) / (E.rx - r - 10), dy = (o.y - E.cy) / (E.ry - r * 0.5 - 8); return dx * dx + dy * dy <= 1.0001; };
function gorTick(e, dt) {
  const m = gm(e), P = P_();
  const idle = e.state !== 'seq'; if (idle && !e.dizzy) { const mv = e.moving; m.sqT = mv ? Math.sin(time * 9) * 0.12 : Math.sin(time * 2.6) * 0.1; m.leanT = mv ? 0.25 : 0; m.wAT = (e.anc === 'utu' ? -1.4 : GA.rest) + Math.sin(time * 2.6) * 0.08; m.wK = 6; }
  m.sq += (m.sqT - m.sq) * Math.min(1, dt * 16); m.lean += (m.leanT - m.lean) * Math.min(1, dt * 12);
  const pa = m.wA; m.wA += (m.wAT - m.wA) * Math.min(1, dt * m.wK); if (Math.abs(m.wA - pa) > 0.03) { if (!m.trail.length) m.trail.push({ a: pa, t: 0.14, max: 0.14 }); m.trail.push({ a: m.wA, t: 0.14, max: 0.14 }); }
  for (const q of m.trail) q.t -= dt; m.trail = m.trail.filter(q => q.t > 0); if (m.trail.length > 14) m.trail.splice(0, m.trail.length - 14);
  for (const q of m.ghosts) q.t -= dt; m.ghosts = m.ghosts.filter(q => q.t > 0);
  if (e.dashing || e.leap) { m.gT -= dt; if (m.gT <= 0) { m.gT = 0.035; m.ghosts.push({ x: e.x, y: e.y, z: m.z, face: e.face, sq: m.sq, lean: m.lean, t: 0.24 }); } }
  if (e.dizzy) { e.dizzy -= dt; if (e.dizzy <= 0) e.dizzy = 0; }
  // 돌격 조준: 처음 잠깐은 플레이어를 따라 돌아감
  if (e.aimT > 0 && e.tl) { e.aimT -= dt; const q = angTo(e, P), df = Math.atan2(Math.sin(q - e.tl.ang), Math.cos(q - e.tl.ang)), mx = (e.ph2 ? 3.2 : 2.4) * dt; e.tl.ang += clamp(df, -mx, mx); e.tl.x = e.x; e.tl.y = e.y; e.tl.len = ellLen(e, e.tl.ang, e.dashLen || 440); e.lockA = e.tl.ang; faceTo(e, e.lockA); }
  // 돌격 중: 대망치로 땅을 긁어 불티 · 결투장 벽(타원)에 박으면 기절
  if (e.dashing) { if (Math.random() < 0.7) G.parts.push({ x: e.x + e.face * 26, y: e.y + rand(-2, 2), vx: -Math.cos(e.lockA) * rand(40, 120), vy: -rand(30, 90), t: 0.3, c: pick(['#ffd070', '#ff8040', '#fff0dc']), g: 300, glow: true });
    if (!inEll(e, e.r)) { if (e.anc === 'gor') gorWall(e); else { e.dash = null; keepIn(e, e.r); } } }
  // 도약: 솟음 → 그림자가 따라오는 동안 떠 있음 → 표식 자리로 내리꽂힘
  if (e.leap) { const L = e.leap; L.t += dt; const T = L.tl;
    if (L.t < 0.28) m.z = 120 * ease3(L.t / 0.28);
    else if (L.t < L.fall) { m.z = 120 + Math.sin(L.t * 9) * 3; if (T) { e.x += (T.x - e.x) * Math.min(1, dt * 3); e.y += (T.y - e.y) * Math.min(1, dt * 3); } }
    else { const k = Math.min(1, (L.t - L.fall) / 0.12); m.z = 120 * (1 - k * k); if (T) { e.x += (T.x - e.x) * k; e.y += (T.y - e.y) * k; } }
    e.z = m.z; }
}
const ease3 = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
function gorWall(e) {
  e.dash = null; e.dashing = false; e.aimT = 0; const ang = e.lockA;
  krugImpact(e.x + Math.cos(ang) * 26, e.y + Math.sin(ang) * 14, 1.1, '255,80,60'); addShake(9, ang); sfx('crunch', 0.6);
  e.x -= Math.cos(ang) * 14; e.y -= Math.sin(ang) * 10; keepIn(e, e.r);
  e.dizzy = e.ph2 ? 0.75 : 1.05; strike(e, GA.low, 0.55, -0.7); mo(e, { wA: GA.low, k: 6 });
  G.nums.push({ x: e.x, y: e.y - e.tall - 8, v: '기절!', t: 0.9, c: '#ffd070', s: 1, txt: true });
  cancelTele(e); e.steps = [[e.dizzy, () => { e.dizzy = 0; mo(e, { sq: 0, lean: 0, wA: GA.rest }); }], [0.2, null]]; e.stepT = e.dizzy;
}
function gCharge(e, a, n) {
  const st = [[0, () => { e.lockA = a; faceTo(e, a); mo(e, { sq: 0.45, lean: -0.7, wA: GA.back, k: 7 }); e.dashLen = (e.ph2 ? 520 : 470) * 0.95; e.tl = oLt(e, a, ellLen(e, a, e.dashLen), (e.r + 4) * 2, 0.62, { heavy: true }); e.aimT = 0.38; alertMark(e, e.tall + 6, true); sfx('roar', 0.9); dust(e.x - e.face * 10, e.y, 6); }],
    [0.62, () => { e.aimT = 0; const ang = e.tl ? e.tl.ang : e.lockA; e.lockA = ang; faceTo(e, ang); strike(e, GA.low, -0.35, 1.0);
      e.dash = { ang, sp: e.ph2 ? 520 : 470, t: 0.95, dmg: e.atk * 1.1, kb: 380, stopWall: false }; e.dashing = true; sfx('whoosh', 0.6); addShake(3, ang); }],
    [0.95, () => { e.dash = null; e.dashing = false; mo(e, { sq: 0.45, lean: 0.3, wA: GA.fwd }); dust(e.x, e.y, 10); sfx('step', 0.4); addShake(3);
      if (n > 1) e.steps.unshift(...gCharge(e, angTo(e, P_()), n - 1).map((s0, i) => i === 0 ? [0.2, s0[1]] : s0));
      else if (dist(e, P_()) < 140) e.steps.unshift(...gTurnSweep(e)); }],
    [0.25, () => mo(e, { sq: 0, lean: 0, wA: GA.rest })]];
  return st;
}
function gTurnSweep(e) { // 돌격 끝에 몸을 틀며 한 번 휘두름
  return [[0.05, () => { const q = clampH(angTo(e, P_())); faceTo(e, q); mo(e, { sq: 0.25, lean: -0.5, wA: GA.high, k: 14 }); e.tl = oCt(e, q, G_REACH, G_ARC, 0.32, { heavy: true }); }],
    [0.32, () => { const q = tAng(e.tl, 0); strike(e, GA.low, -0.2, 0.8); oCone(e, q, G_REACH, G_ARC, e.atk, { w: 6, step: 0.01, dust: 10, c: '255,170,160' }); addShake(5, q); }]];
}
function gLeap(e) {
  const P = P_();
  return [[0, () => { faceTo(e, angTo(e, P)); mo(e, { sq: 0.6, lean: -0.2, wA: GA.high, k: 8 }); sfx('growl', 0.7); dust(e.x, e.y, 8); }],
    [0.34, () => { mo(e, { sq: -0.5, lean: 0, wA: GA.up, snap: true }); const T = oRt(e, P.x, P.y, 66, 1.05, { heavy: true, track: true }); e.leap = { t: 0, fall: 0.9, tl: T }; e.tl = T; sfx('whoosh', 0.5); dust(e.x, e.y, 12); addShake(3); }],
    [0.9, () => mo(e, { sq: -0.6, lean: 0.4, wA: GA.high, k: 20 })],
    [0.15, () => { const T = e.leap && e.leap.tl, x = T ? T.x : e.x, y = T ? T.y : e.y; e.leap = null; e.z = 0; gm(e).z = 0; e.x = x; e.y = y; keepIn(e, e.r);
      strike(e, GA.fwd, 0.7, 0.4); hitShape({ shape: 'circle', x, y, r: 66, owner: e }, e.atk * 1.3); krugImpact(x, y, 1.3, '255,80,60');
    }], // v3.56c 땅 갈라짐(세 갈래 · 다섯 갈래) 뺌
    [0.65, () => mo(e, { sq: 0, lean: 0, wA: GA.rest })], [0.15, null]];
}
function gCombo(e) {
  const P = P_(), w1 = e.ph2 ? 0.36 : 0.44, w2 = e.ph2 ? 0.26 : 0.32;
  let tx = 0, ty = 0;
  const aim = () => { const q = clampH(angTo(e, P)); faceTo(e, q); return q; };
  return [[0, () => { const q = aim(); mo(e, { sq: 0.3, lean: -0.6, wA: GA.high, k: 10 }); e.tl = oCt(e, q, G_REACH, G_ARC, w1, { heavy: true }); sfx('growl', 0.9); }],
    [w1, () => { const q = tAng(e.tl, 0); strike(e, GA.low, -0.2, 0.8); oCone(e, q, G_REACH, G_ARC, e.atk, { w: 6, step: 0.01, dust: 10, c: '255,170,160' }); addShake(5, q); }],
    [0.16, () => { const q = aim(), st = 12; e.x += Math.cos(q) * st; e.y += Math.sin(q) * st * 0.7; keepIn(e, e.r); mo(e, { sq: 0.2, lean: 0.4, wA: 2.2, k: 16 }); e.tl = oCt(e, q, G_REACH, G_ARC, w2, { heavy: true }); }],
    [w2, () => { const q = tAng(e.tl, 0); strike(e, GA.high, -0.3, 0.5); oCone(e, q, G_REACH, G_ARC, e.atk, { w: 6, step: 0.01, dust: 8, c: '255,170,160' }); addShake(5, q); }],
    [0.18, () => { const q = aim(), st = 12; e.x += Math.cos(q) * st; e.y += Math.sin(q) * st * 0.7; keepIn(e, e.r); tx = e.x + Math.cos(q) * 46; ty = e.y + Math.sin(q) * 32; mo(e, { sq: -0.45, lean: -0.8, wA: GA.up - 0.35, k: 10 }); e.tl = oRt(e, tx, ty, 44, 0.5, { heavy: true }); sfx('growl', 0.7); }],
    [0.5, () => { strike(e, wAt(e, tx, ty), 0.6, 1.0); hitShape({ shape: 'circle', x: tx, y: ty, r: 44, owner: e }, e.atk * 1.25); krugImpact(tx, ty, 1.0, '255,80,60'); }],
    [0.5, () => mo(e, { sq: 0, lean: 0, wA: GA.rest })], [0.1, null]];
}
function gQuake(e) {
  const P = P_(), st = [[0, () => { mo(e, { sq: -0.55, lean: -0.4, wA: GA.up, k: 8 }); sayEnemy(e, LINES.gor.rage, 0, 1.6); sfx('roar', 0.7); addShake(10); flashT = Math.max(flashT, 0.1); flashColor = '#ff3020'; }]];
  for (let i = 0; i < 3; i++) {
    st.push([i ? 0.42 : 0.7, () => { strike(e, GA.fwd, 0.65, 0.2); krugImpact(e.x, e.y, 0.7, '255,80,60');
      for (let k = 0; k < 2; k++) { const x = P.x + rand(-50, 50) * (k ? 1 : 0.2), y = P.y + rand(-30, 30) * (k ? 1 : 0.2); oRt(e, x, y, 30, 0.85, { onFire: tt => { hitShape({ shape: 'circle', x: tt.x, y: tt.y, r: 30, owner: e }, e.atk * 0.7); krugImpact(tt.x, tt.y, 0.55, '255,90,60'); } }); } }]);
    st.push([0.16, () => mo(e, { sq: -0.4, lean: -0.3, wA: GA.up, k: 14 })]);
  }
  st.push([0.9, () => mo(e, { sq: 0, lean: 0, wA: GA.rest })], [0.1, null]);
  return st;
}
function aiGor(e, d, a) {
  if (e.hp < e.maxHp * 0.5 && !e.ph2) { e.ph2 = true; e.spd *= 1.2; e.lastPat = 'quake'; oSeq(e, gQuake(e), 0.2, rand(0.2, 0.4)); return; }
  const opt = d > 150 ? [['charge', 3], ['leap', 2]] : d > 95 ? [['leap', 2], ['charge', 1], ['combo', 1.5]] : [['combo', 3], ['leap', 1]];
  if (e.ph2) opt.push(['quake', 0.7]);
  const pool = opt.filter(o => o[0] !== e.lastPat), L = pool.length ? pool : opt; let r = Math.random() * L.reduce((s0, o) => s0 + o[1], 0), pat = L[0][0];
  for (const o of L) { r -= o[1]; if (r <= 0) { pat = o[0]; break; } }
  e.lastPat = pat;
  const cd = e.ph2 ? rand(0.2, 0.45) : rand(0.4, 0.75);
  oSeq(e, pat === 'charge' ? gCharge(e, a, e.ph2 ? 2 : 1) : pat === 'leap' ? gLeap(e) : pat === 'quake' ? gQuake(e) : gCombo(e), 0.15, cd);
}
// ================================================================ v3.57 자카 (속도) 다시 만듦 — 고르마크와 같은 동작 틀 (몸 변형 · 도끼 각도 보간 · 궤적 · 잔영)
// 평소: 플레이어 둘레를 빠르게 맴돌며 틈을 봄
// 패턴: 질풍 연참(짧은 예고 → 몸째 그어 지나가는 돌진 베기 3번, 매번 다시 조준) · 사슬 도끼(던진 도끼가 날아갔다 돌아옴 · 맞으면 끌려와 한 번 더 베임) ·
//       그림자 점멸(핏빛 안개로 흩어져 플레이어 옆에서 나타나 벰) · 회오리(가까우면 도끼를 두 바퀴 돌림)
//       체력 절반 아래: 핏빛 질주(사방에서 나타나 플레이어를 꿰뚫고 지나가는 돌진 3번 · X자) · 질풍 연참 4번 · 점멸 두 번
const Z_REACH = 72, Z_ARC = 140;
function zDash(e, q, wait, mul) { // 짧은 예고 → 몸째 그어 지나감 (예고선 = 몸통 판정)
  return [[wait, () => { faceTo(e, q); e.lockA = q; mo(e, { sq: 0.4, lean: -0.6, wA: GA.high, k: 16 }); e.dashLen = Math.min(190, ellLen(e, q, 190)); e.tl = oLt(e, q, e.dashLen, (e.r + 4) * 2, e.ph2 ? 0.38 : 0.46, { heavy: true }); sfx('swing', 1.5); }],
    [e.ph2 ? 0.38 : 0.46, () => { const ang = e.tl ? e.tl.ang : q; strike(e, GA.low, -0.35, 1.0); e.dash = { ang, sp: 620, t: e.dashLen / 620, dmg: e.atk * (mul || 0.8), kb: 240, stopWall: true }; e.dashing = true; e.zSlash = true; sfx('whoosh', 1.3);
      G.fx.push({ kind: 'claw', brute: true, seed: Math.random() * 999, x: e.x, y: e.y - 20, ang, arc: 1.2, r: 50, w: 4, c: '255,140,120', t: 0.25, max: 0.25 }); }],
    [0.2, () => { e.dash = null; e.dashing = false; e.zSlash = false; mo(e, { sq: 0.3, lean: 0.3, wA: GA.fwd }); dust(e.x, e.y, 5); }]];
}
function zCombo(e, n) { const st = []; for (let i = 0; i < n; i++) st.push(...zDash(e, angTo(e, P_()), i ? 0.32 : 0, 0.8).map((s0, j) => j === 0 ? [s0[0], () => { s0[1].call(null); const q = angTo(e, P_()); if (e.tl) { e.tl.ang = q; e.lockA = q; e.dashLen = Math.min(190, ellLen(e, q, 190)); e.tl.len = e.dashLen; faceTo(e, q); } }] : s0));
  st.push([0.25, () => mo(e, { sq: 0, lean: 0, wA: GA.rest })]); return st; }
function zThrow(e) {
  const P = P_();
  return [[0, () => { const q = angTo(e, P); faceTo(e, q); e.lockA = q; mo(e, { sq: 0.3, lean: -0.7, wA: GA.back, k: 10 }); e.thLen = ellLen(e, q, 320); e.tl = oLt(e, q, e.thLen, 26, 0.55, { heavy: true }); sfx('growl', 0.8); }],
    [0.55, () => { const q = e.tl ? e.tl.ang : e.lockA; strike(e, GA.fwd, -0.2, 0.8); e.axeP = { ang: q, len: e.thLen, t: 0, out: 0.24, back: 0.3, hit: false }; sfx('whoosh', 1.2); }],
    [0.6, () => { if (!e.pulled) return; e.pulled = false; const q = clampH(angTo(e, P_())); faceTo(e, q); mo(e, { sq: 0.3, lean: -0.5, wA: GA.high, k: 18 }); e.tl = oCt(e, q, Z_REACH, Z_ARC, 0.4, { heavy: true }); }],
    [0.4, () => { if (!e.tl || e.tl.shape !== 'cone') return; strike(e, GA.low, -0.2, 0.8); oCone(e, e.tl.ang, Z_REACH, Z_ARC, e.atk, { w: 5, step: 0.01, dust: 8, c: '255,140,120' }); }],
    [0.25, () => mo(e, { sq: 0, lean: 0, wA: GA.rest })]];
}
function zBlink(e, n) {
  const st = [];
  for (let i = 0; i < n; i++) {
    st.push([i ? 0.4 : 0, () => { mo(e, { sq: -0.5, lean: 0, snap: true }); zVanish(e); e.blinkT = 0.3; }],
      [0.3, () => { const P = P_(), sd = Math.random() < 0.5 ? 1 : -1, p = { x: P.x + sd * 58, y: P.y + rand(-10, 10) }; keepIn(p, e.r); e.x = p.x; e.y = p.y; e.blinkT = -0.2; burst(e.x, e.y - 30, '#ff5a3a', 12);
        const q = clampH(angTo(e, P)); faceTo(e, q); mo(e, { sq: 0.35, lean: -0.6, wA: GA.high, snap: true }); e.tl = oCt(e, q, Z_REACH, Z_ARC, e.ph2 ? 0.4 : 0.46, { heavy: true }); }],
      [e.ph2 ? 0.4 : 0.46, () => { const q = tAng(e.tl, 0); strike(e, GA.low, -0.2, 0.9); oCone(e, q, Z_REACH, Z_ARC, e.atk, { w: 5, step: 0.01, dust: 8, c: '255,140,120' }); }]);
  }
  st.push([0.3, () => mo(e, { sq: 0, lean: 0, wA: GA.rest })]); return st;
}
function zWhirl(e) {
  return [[0, () => { mo(e, { sq: 0.45, lean: -0.3, wA: GA.back, k: 10 }); e.tl = oRt(e, e.x, e.y, 70, 0.55, { heavy: true }); sfx('growl', 1.0); }],
    [0.55, () => { e.spin = 0.55; hitShape({ shape: 'circle', x: e.x, y: e.y, r: 70, owner: e }, e.atk * 0.8); sfx('whoosh', 1.1); dust(e.x, e.y, 8); }],
    [0.27, () => { hitShape({ shape: 'circle', x: e.x, y: e.y, r: 70, owner: e }, e.atk * 0.8); sfx('whoosh', 1.3); }],
    [0.4, () => { e.spin = 0; mo(e, { sq: 0, lean: 0, wA: GA.rest }); }]];
}
function zCross(e) { // 핏빛 질주: 사방에서 나타나 플레이어를 꿰뚫고 지나감
  const st = [[0, () => { sayEnemy(e, LINES.zak.cross, 0, 1.6); sfx('roar', 1.1); }]];
  for (let i = 0; i < 3; i++) {
    st.push([i ? 0.35 : 0.5, () => { zVanish(e); e.blinkT = 0.22; }],
      [0.22, () => { const P = P_(), th = rand(0, TAU), p = { x: P.x + Math.cos(th) * 130, y: P.y + Math.sin(th) * 70 }; keepIn(p, e.r); e.x = p.x; e.y = p.y; e.blinkT = -0.2; burst(e.x, e.y - 30, '#ff5a3a', 10);
        const q = angTo(e, P); faceTo(e, q); e.lockA = q; mo(e, { sq: 0.4, lean: -0.6, wA: GA.high, snap: true }); e.dashLen = ellLen(e, q, 300); e.tl = oLt(e, q, e.dashLen, (e.r + 4) * 2, 0.46, { heavy: true }); }],
      [0.46, () => { const ang = e.tl ? e.tl.ang : e.lockA; strike(e, GA.low, -0.35, 1.0); e.dash = { ang, sp: 700, t: e.dashLen / 700, dmg: e.atk * 0.9, kb: 260, stopWall: true }; e.dashing = true; sfx('whoosh', 1.4); }],
      [0.25, () => { e.dash = null; e.dashing = false; mo(e, { sq: 0.3, lean: 0.2 }); }]);
  }
  st.push([0.35, () => mo(e, { sq: 0, lean: 0, wA: GA.rest })]); return st;
}
function zVanish(e) { // v3.57c 사라질 때 핏빛 흔적: 그 자리에 남는 붉은 잔상 · 바닥 핏자국 · 피어오르는 핏빛 안개
  const m = gm(e); m.ghosts.push({ x: e.x, y: e.y, z: m.z || 0, face: e.face, sq: m.sq, lean: m.lean, t: 0.7, max: 0.7, red: true });
  splat(e.x, e.y + 2, 20, '120,12,24'); burst(e.x, e.y - 30, '#c01828', 18);
  for (let k = 0; k < 22; k++) G.parts.push({ x: e.x + rand(-16, 16), y: e.y - rand(4, 56), vx: rand(-24, 24), vy: -rand(10, 50), t: rand(0.5, 1.0), c: pick(['#c01828', '#ff5a3a', '#8a1424', '#6c1a30']), g: 0 });
  sfx('dodge', 0.7);
}
function zakTick(e, dt) {
  const m = gm(e), P = P_();
  if (e.spin > 0) { e.spin -= dt; m.wAT += dt * 24; m.wA = m.wAT; m.wK = 60; m.trail.push({ a: m.wA, t: 0.12, max: 0.12 }); if (e.spin <= 0) { m.wA = m.wAT = GA.rest; m.trail = []; } }
  const A0 = e.axeP; if (A0) { A0.t += dt; const L = A0.t < A0.out ? A0.len * ease3(A0.t / A0.out) : A0.len * (1 - Math.min(1, (A0.t - A0.out) / A0.back));
    A0.x = e.x + Math.cos(A0.ang) * L; A0.y = e.y + Math.sin(A0.ang) * L;
    if (!A0.hit && !P.dead && Math.hypot(P.x - A0.x, P.y - A0.y) < 16 + P.r) { A0.hit = true; const hp0 = P.hp; hitShape({ shape: 'circle', x: A0.x, y: A0.y, r: 16, owner: e }, e.atk * 0.7);
      if (P.hp < hp0) { const q = Math.atan2(e.y - P.y, e.x - P.x); P.kx = Math.cos(q) * 460; P.ky = Math.sin(q) * 460; e.pulled = true; sfx('crunch', 1.2); } }
    if (Math.random() < 0.6) G.parts.push({ x: A0.x, y: A0.y - 16, vx: rand(-20, 20), vy: rand(-20, 20), t: 0.2, c: pick(['#ffd8cc', '#ff6a50']), g: 0 });
    if (A0.t >= A0.out + A0.back) e.axeP = null; }
}
function aiZak(e, d, a) {
  if (e.hp < e.maxHp * 0.5 && !e.ph2) { e.ph2 = true; e.spd *= 1.15; e.lastPat = 'cross'; oSeq(e, zCross(e), 0.5, rand(0.8, 1.1)); return; }
  const opt = d > 170 ? [['combo', 3], ['throw', 2.5], ['blink', 1.5]] : d > 90 ? [['combo', 2.5], ['blink', 2], ['throw', 1]] : [['whirl', 2.5], ['blink', 1.5], ['combo', 1.5]];
  if (e.ph2) opt.push(['cross', 0.8]);
  const pool = opt.filter(o => o[0] !== e.lastPat), L = pool.length ? pool : opt; let r = Math.random() * L.reduce((s0, o) => s0 + o[1], 0), pat = L[0][0];
  for (const o of L) { r -= o[1]; if (r <= 0) { pat = o[0]; break; } }
  e.lastPat = pat;
  const cd = e.ph2 ? rand(0.7, 1.0) : rand(1.0, 1.5); // v3.57b 패턴 사이 여유 (맴도는 시간)
  oSeq(e, pat === 'combo' ? zCombo(e, e.ph2 ? 3 : 2) : pat === 'throw' ? zThrow(e) : pat === 'blink' ? zBlink(e, e.ph2 ? 2 : 1) : pat === 'cross' ? zCross(e) : zWhirl(e), 0.45, cd);
}
// ================================================================ v3.58 우투르 (인내) 다시 만듦 — 같은 동작 틀 + 창 · 방패를 따로 움직임
// 정체성: 정면 공격은 방패에 막힘 · 천천히 돌아섬 (뒤로 돌아가면 틈 → 대신 등 뒤 창 휘두르기로 응수)
// 근접: 창 연속 찌르기(바라보는 방향으로) · 방패 밀치기 · 등 뒤 휘두르기
// 원거리 대응: 뼈 가시 길(바닥을 타고 다가오는 가시) · 뼈 창 투척(날아가 벽에 박혔다 손으로 돌아옴) · 방패 도약(멀면 뛰어와 방패로 내려찍음) ·
//             응징의 벽(방패를 세우고 버팀 · 그동안 막은 공격 수만큼 뼈 조각을 부채꼴로 되쏨, 원거리 직업이면 더 자주)
// 체력 절반 아래: 더 빨리 돌아섬 · 찌르기 +1 · 가시 길 세 갈래
const UL = q => (Math.cos(q) >= 0 ? q : Math.PI - q); // 화면 각도 → 우투르 기준 각도(앞 = 0)
const RANGED_CLS = ['ranger', 'mage', 'gunner'];
function um(e) { const m = gm(e); if (!m.spH) { m.spH = [-10, -8]; m.spHT = [-10, -8]; m.sh = [0, 0]; m.shT = [0, 0]; m.glow = 0; m.spikes = []; } return m; }
function uSet(e, o) { const m = um(e); if (o.spH) m.spHT = o.spH; if (o.sh) m.shT = o.sh; if (o.snap) { if (o.spH) m.spH = o.spH.slice(); if (o.sh) m.sh = o.sh.slice(); } mo(e, o); }
function uThrust(e, n) {
  const st = [];
  for (let i = 0; i < n; i++) {
    const w = e.ph2 ? 0.4 : 0.5;
    st.push([i ? 0.25 : 0, () => { uSet(e, { spH: [2, -10], sq: 0.25, lean: -0.4, wA: UL(e.dir), k: 12 }); e.tl = oLt(e, e.dir, 116, 24, w, { heavy: true }); }],
      [w, () => { const t = e.tl; uSet(e, { spH: [16, -10], snap: true, sq: -0.2, lean: 0.7 }); uSet(e, { spH: [6, -10] }); hitIn(t, e, 0.9); e.x += Math.cos(e.dir) * 8; e.y += Math.sin(e.dir) * 6; keepIn(e, e.r);
        G.fx.push({ kind: 'streak', x0: e.x + Math.cos(t.ang) * 20, y0: e.y - 16, x1: e.x + Math.cos(t.ang) * 116, y1: e.y + Math.sin(t.ang) * 116 - 16, t: 0.16, max: 0.16 }); sfx('swing', 0.8); }]);
  }
  st.push([0.35, () => uSet(e, { spH: [-10, -8], sq: 0, lean: 0, wA: -1.4 })]); return st;
}
function uBash(e) {
  return [[0, () => { uSet(e, { sh: [-3, 0], sq: 0.35, lean: -0.5 }); e.tl = oCt(e, e.dir, 84, 110, 0.5, { heavy: true }); sfx('growl', 0.6); }],
    [0.5, () => { const t = e.tl, P = P_(); uSet(e, { sh: [9, -1], snap: true, sq: -0.2, lean: 0.8 }); uSet(e, { sh: [3, 0] }); e.x += Math.cos(e.dir) * 16; e.y += Math.sin(e.dir) * 10; keepIn(e, e.r);
      if (hitIn(t, e, 0.8)) { P.kx = Math.cos(e.dir) * 400; P.ky = Math.sin(e.dir) * 400; } dust(e.x + Math.cos(e.dir) * 36, e.y + Math.sin(e.dir) * 20, 10); sfx('block', 0.7); addShake(5, e.dir); }],
    [0.4, () => uSet(e, { sh: [0, 0], sq: 0, lean: 0 })]];
}
function uBackJab(e) { // 등 뒤로 돌아간 플레이어에게: 창을 뒤로 크게 휘두름
  const back = e.dir + Math.PI;
  return [[0, () => { uSet(e, { spH: [-8, -10], sq: 0.3, lean: 0.4, wA: -2.4, k: 12 }); e.tl = oCt(e, back, 94, 120, e.ph2 ? 0.34 : 0.42, { heavy: true }); alertMark(e, e.tall + 6, false); }],
    [e.ph2 ? 0.34 : 0.42, () => { strike(e, 2.75, -0.2, -0.6); oCone(e, back, 94, 120, e.atk, { w: 5, step: 0.01, dust: 8, c: '255,220,210' }); }],
    [0.45, () => uSet(e, { spH: [-10, -8], sq: 0, lean: 0, wA: -1.4 })]];
}
function uSpikes(e) { // 뼈 가시 길: 창 끝을 땅에 꽂으면 가시가 바닥을 타고 다가옴
  const P = P_(), a0 = angTo(e, P), lines = e.ph2 ? [-0.38, 0, 0.38] : [0];
  return [[0, () => { uSet(e, { spH: [8, -14], sq: -0.3, lean: -0.3, wA: -1.5, k: 10 }); sfx('growl', 0.7); }],
    [0.4, () => { uSet(e, { spH: [8, -4], snap: true, sq: 0.45, lean: 0.4, wA: 1.45 }); dust(e.x + e.face * 16, e.y, 8); addShake(4); sfx('crunch', 0.7);
      for (const da of lines) { const q = a0 + da; for (let i = 1; i <= 11; i++) { const p = { x: e.x + Math.cos(q) * (14 + i * 30), y: e.y + Math.sin(q) * (14 + i * 30) }; if (!inEll(p, 8)) break;
        oRt(e, p.x, p.y, 20, 0.42 + i * 0.07, { onFire: tt => { hitShape({ shape: 'circle', x: tt.x, y: tt.y, r: 20, owner: e }, e.atk * 0.7); um(e).spikes.push({ x: tt.x, y: tt.y, t: 0.85, s: (Math.random() * 99) | 0 }); splat(tt.x, tt.y + 2, 6, '120,12,24'); debris(tt.x, tt.y, 3); dust(tt.x, tt.y, 2); sfx('crunch', 1.4); } }); } } }],
    [1.3, () => uSet(e, { spH: [-10, -8], sq: 0, lean: 0, wA: -1.4 })]];
}
function uJavelin(e) { // 뼈 창 투척: 몸을 틀어 던짐 → 벽에 박혔다가 핏빛으로 흩어져 손에 돌아옴
  const P = P_();
  return [[0, () => { const q = angTo(e, P); e.dir = q; e.face = Math.cos(q) >= 0 ? 1 : -1; uSet(e, { spH: [-6, -14], sq: 0.3, lean: -0.7, wA: UL(q) + Math.PI * 0.08, k: 10 }); e.jl = ellLen(e, q, 420); e.tl = oLt(e, q, e.jl, 18, 0.6, { heavy: true }); sfx('growl', 0.8); }],
    [0.6, () => { const q = e.tl ? e.tl.ang : e.dir; uSet(e, { spH: [8, -10], snap: true, sq: -0.3, lean: 0.9 }); um(e).jav = { ang: q, len: e.jl, d: 0, hit: false, stuck: 0 }; sfx('whoosh', 0.9); addShake(3, q); }],
    [1.1, () => uSet(e, { spH: [-10, -8], sq: 0, lean: 0, wA: -1.4 })]];
}
function uLeap(e) { // 방패 도약: 멀리 있으면 뛰어와 방패로 내려찍음
  const P = P_(); e.leapCd = 6;
  return [[0, () => { uSet(e, { sh: [0, 3], sq: 0.55, lean: -0.2 }); sfx('growl', 0.7); dust(e.x, e.y, 8); }],
    [0.36, () => { uSet(e, { sh: [0, -2], sq: -0.5, snap: true }); const T = oRt(e, P.x, P.y, 60, 1.0, { heavy: true, track: true }); e.leap = { t: 0, fall: 0.86, tl: T }; e.tl = T; sfx('whoosh', 0.5); dust(e.x, e.y, 12); }],
    [0.86, () => uSet(e, { sh: [4, 4], sq: -0.6, lean: 0.4 })],
    [0.14, () => { const T = e.leap && e.leap.tl, x = T ? T.x : e.x, y = T ? T.y : e.y; e.leap = null; e.z = 0; um(e).z = 0; e.x = x; e.y = y; keepIn(e, e.r);
      uSet(e, { sh: [6, 6], snap: true, sq: 0.7, lean: 0.3 }); hitShape({ shape: 'circle', x, y, r: 60, owner: e }, e.atk * 1.1); krugImpact(x, y, 1.0, '255,200,190'); e.dir = angTo(e, P_()); }],
    [0.6, () => uSet(e, { sh: [0, 0], sq: 0, lean: 0 })]];
}
function uStance(e) { // 응징의 벽: 방패를 세우고 버팀 → 막은 만큼 뼈 조각을 되쏨
  return [[0, () => { e.stanceT = 1.5; e.absorb = 0; uSet(e, { sh: [4, -2], sq: 0.3, lean: -0.2, spH: [-12, -6] }); sayEnemy(e, LINES.utu.stance, 0, 1.4); sfx('block', 0.6); }],
    [1.15, () => { const q = angTo(e, P_()); e.tl = oCt(e, q, 260, 52, 0.35, { heavy: true }); }],
    [0.35, () => { e.stanceT = 0; const P = P_(), q = e.tl ? e.tl.ang : angTo(e, P), n = Math.min(8, 3 + (e.absorb || 0));
      uSet(e, { sh: [10, -2], snap: true, sq: -0.3, lean: 0.8 }); uSet(e, { sh: [0, 0] });
      for (let i = 0; i < n; i++) { const aa = q + (n > 1 ? (i / (n - 1) - 0.5) * 0.9 : 0); G.eproj.push({ x: e.x + Math.cos(aa) * 22, y: e.y + Math.sin(aa) * 14, ang: aa, sp: 280, r: 4, dmg: e.atk * 0.5, t: 1.1, hist: [], kind: 'quill' }); }
      if (e.absorb) G.nums.push({ x: e.x, y: e.y - e.tall - 6, v: '응징 ×' + n, t: 0.9, c: '#ff6a50', s: 1, txt: true }); burst(e.x + Math.cos(q) * 20, e.y - 24, '#ffe4d4', 12); sfx('blast', 1.2); addShake(4, q); }],
    [0.5, () => uSet(e, { sq: 0, lean: 0, spH: [-10, -8] })]];
}
// v3.62 뼈 가시: 크게(가운데 14칸 · 양옆 10칸) · 굵게(밑동 3칸) · 밝은 윤곽 · 밑동 균열 — 캐릭터와 깊이 정렬 · 조명을 받아 어둠에 묻히지 않게
function boneSpike(q) {
  const life = 0.85, age = life - q.t, rise = Math.min(1, age / 0.08), sink = Math.min(1, q.t / 0.22), k = rise * sink;
  for (let i = -8; i <= 8; i++) { const y = Math.round(Math.abs(i) * 0.25); if (dth(60 + i, 60 + y) < 0.6) px(60 + i, 60 + y - 1, i % 3 ? '#3a1810' : '#5a2418'); } // 밑동 균열
  const sp = [[-5, 10 + (q.s % 3)], [0, 14 + (q.s % 2) * 2], [5, 9 + (q.s % 4)]];
  for (const [ox, H0] of sp) { const H = Math.round(H0 * k); if (H < 1) continue;
    for (let j = 0; j < H; j++) { const w = j < H * 0.45 ? 1 : 0, X = 60 + ox, Y = 59 - j;
      for (let x = -w - 1; x <= w + 1; x++) px(X + x, Y, '#1a0610');
      if (w) { px(X - 1, Y, '#fff8ec'); px(X, Y, '#e8d8c8'); px(X + 1, Y, '#a89888'); } else { px(X, Y, j >= H - 2 ? '#ffffff' : '#f0e4d8'); } }
    px(60 + ox, 59 - H, '#1a0610'); }
}
function utuTick(e, dt) {
  const m = um(e), P = P_(), k = Math.min(1, dt * 14);
  for (let i = 0; i < 2; i++) { m.spH[i] += (m.spHT[i] - m.spH[i]) * k; m.sh[i] += (m.shT[i] - m.sh[i]) * k; }
  m.glow += ((e.stanceT > 0 ? 1 : 0) - m.glow) * Math.min(1, dt * 6); if (e.stanceT > 0) e.stanceT -= dt;
  if (e.leapCd > 0) e.leapCd -= dt;
  for (const q of m.spikes) q.t -= dt; m.spikes = m.spikes.filter(q => q.t > 0);
  const J = m.jav; if (J) { // 날아가는 뼈 창
    if (J.d < J.len) { J.d = Math.min(J.len, J.d + 760 * dt); const x = e.x0j != null ? 0 : 0; }
    J.x = (J.x0 != null ? J.x0 : (J.x0 = e.x)) + Math.cos(J.ang) * J.d; J.y = (J.y0 != null ? J.y0 : (J.y0 = e.y)) + Math.sin(J.ang) * J.d;
    if (!J.hit && J.d < J.len && !P.dead && Math.hypot(P.x - J.x, P.y - J.y) < 12 + P.r) { J.hit = true; hitShape({ shape: 'circle', x: J.x, y: J.y, r: 12, owner: e }, e.atk * 0.9); }
    if (J.d >= J.len) { if (!J.stuck) { J.stuck = 0.001; debris(J.x, J.y, 6); dust(J.x, J.y, 6); sfx('crunch', 1.0); addShake(2); } J.stuck += dt; if (J.stuck > 0.55) { burst(J.x, J.y - 16, '#c01828', 12); burst(e.x + e.face * 12, e.y - 24, '#ff5a3a', 10); m.jav = null; } }
  }
}
function aiUtu(e, d, a) {
  const P = P_(), behind = Math.cos(a - e.dir) < -0.3;
  if (e.hp < e.maxHp * 0.5 && !e.ph2) { e.ph2 = true; sayEnemy(e, LINES.utu.half, 0, 1.6); }
  let opt;
  if (behind && d < 115) opt = [['back', 4], ['bash', 0.5]];
  else if (d < 95) opt = [['bash', 2], ['thrust', 1.5], ['spikes', 0.5]];
  else if (d < 200) opt = [['thrust', 2.5], ['spikes', 1.2], ['bash', 0.4]];
  else { opt = [['spikes', 2], ['jav', 1.5], ['stance', RANGED_CLS.includes(G.cls) ? 2.2 : 0.8]]; if (!(e.leapCd > 0)) opt.push(['leap', 1.5]); }
  const pool = opt.filter(o => o[0] !== e.lastPat), L = pool.length ? pool : opt; let r = Math.random() * L.reduce((s0, o) => s0 + o[1], 0), pat = L[0][0];
  for (const o of L) { r -= o[1]; if (r <= 0) { pat = o[0]; break; } }
  e.lastPat = pat;
  const cd = e.ph2 ? rand(0.6, 0.9) : rand(0.9, 1.4);
  oSeq(e, pat === 'back' ? uBackJab(e) : pat === 'bash' ? uBash(e) : pat === 'thrust' ? uThrust(e, e.ph2 ? 3 : 2) : pat === 'spikes' ? uSpikes(e) : pat === 'jav' ? uJavelin(e) : pat === 'leap' ? uLeap(e) : uStance(e), 0.4, cd);
}
function updAnc(e, dt) {
  const P = P_();
  e.flash = Math.max(0, (e.flash || 0) - dt); e.lean *= Math.pow(0.02, dt); e.walk += dt * 3;
  if (e.poseT > 0) { e.poseT -= dt; if (e.poseT <= 0) e.pose = e.anc === 'utu' ? 'guard' : 'idle'; }
  if (e.blinkT) e.blinkT = e.blinkT > 0 ? Math.max(0, e.blinkT - dt) : Math.min(0, e.blinkT + dt);
  if (e.hop) { const h = e.hop; h.t += dt; const k = Math.min(1, h.t / h.dur); e.x = h.x0 + (h.x1 - h.x0) * k; e.y = h.y0 + (h.y1 - h.y0) * k; e.z = Math.sin(k * Math.PI) * 40; if (k >= 1) { e.hop = null; e.z = 0; } }
  orcTick(e, dt);
  if (e.sayQ && e.sayQ.length && time >= e.sayQ[0].at) { const q = e.sayQ.shift(); sayEnemy(e, q.t, 0, q.each); } // v3.61 다음 문장
  if (e.anc === 'gor' || e.anc === 'zak') gorTick(e, dt); // v3.56 · v3.57 자카도 같은 동작 틀
  if (e.anc === 'zak') zakTick(e, dt);
  if (e.anc === 'utu') { gorTick(e, dt); utuTick(e, dt); } // v3.58
  if (e.anc === 'utu') { // 천천히 돌아섬 (초당 1.1)
    const want = angTo(e, P), df = Math.atan2(Math.sin(want - e.dir), Math.cos(want - e.dir)), sp = (e.stanceT > 0 ? 3.5 : e.ph2 ? 1.8 : 1.1) * dt; // v3.58 응징 자세에선 빨리 돌아섬
    if (e.state !== 'seq' || !e.tl || e.stanceT > 0) e.dir += clamp(df, -sp, sp); e.face = Math.cos(e.dir) >= 0 ? 1 : -1;
  }
  keepIn(e, e.r);
  e.t -= dt; e.cd -= dt;
  if (P.dead || SEQ) return;
  if (e.state === 'seq') { runSeq(e, dt); return; }
  if (e.state === 'recover') { if (e.t <= 0) e.state = 'idle'; return; }
  const d = dist(e, P), a = angTo(e, P);
  if (e.anc !== 'utu') faceTo(e, a);
  e.moving = false;
  if (e.anc === 'zak' && e.cd > 0) { // v3.57 자카: 플레이어 둘레를 빠르게 맴돎
    const th = Math.atan2(e.y - P.y, e.x - P.x) + (e.orb || (e.orb = Math.random() < 0.5 ? 0.5 : -0.5)), tx = P.x + Math.cos(th) * 120, ty = P.y + Math.sin(th) * 70, q = Math.atan2(ty - e.y, tx - e.x);
    if (Math.hypot(tx - e.x, ty - e.y) > 6) { const ang = steer(e, q); e.x += Math.cos(ang) * e.spd * 1.6 * dt; e.y += Math.sin(ang) * e.spd * 1.6 * dt; e.moving = true; }
    if (Math.random() < dt * 0.4) e.orb = -e.orb; return; }
  if (e.cd > 0) { // 다가옴
    if (d > (e.anc === 'gor' ? 100 : 80)) { e.moving = true; const ang = steer(e, e.anc === 'utu' ? e.dir : a); e.x += Math.cos(ang) * e.spd * dt; e.y += Math.sin(ang) * e.spd * dt; }
    return;
  }
  if (e.anc === 'gor') aiGor(e, d, a); else if (e.anc === 'zak') aiZak(e, d, a); else aiUtu(e, d, a);
}
function drawAncE(e) {
  const t3 = T3();
  if (e.blinkT > 0) { if (e.m) for (const q of e.m.ghosts) at(q.x, q.y - q.z, 60, 60, () => drawAnc(e.anc, 60, 60, time, { face: q.face, rows: deform(e.anc, q.sq, q.lean, q.face), ghost: q.red ? (q.t > 0.35 ? '#ff3a30' : '#c01828') : '#a01828', ga: q.t / (q.max || 0.24) * (q.red ? 0.9 : 0.75) })); return; } // v3.57c 사라진 동안에도 핏빛 잔상은 보임
  const vis = e.blinkT < 0 ? 1 + e.blinkT * 2 : 1;
  if ((e.anc === 'gor' || e.anc === 'zak' || e.anc === 'utu') && e.m) { const m = e.m, z = m.z || 0, K = e.anc; // v3.56 몸 변형 · 무기 보간 · 잔영 · 그림자 (v3.57 자카도)
    if (z > 1) at(e.x, e.y, 60, 60, () => shadowE(60, 59, Math.round(12 - z / 30), 3, 0.7));
    for (const q of m.ghosts) at(q.x, q.y - q.z, 60, 60, () => drawAnc(K, 60, 60, time, { face: q.face, rows: deform(K, q.sq, q.lean, q.face), ghost: q.red ? (q.t > 0.35 ? '#ff3a30' : '#c01828') : q.t > 0.14 ? '#e83a30' : '#a01828', ga: q.t / (q.max || 0.24) * (q.red ? 0.9 : 0.75) }));
    const AX = e.axeP; if (AX && AX.x != null) at(e.x, e.y, 60, 60, () => { const hx = 60 + e.face * 7, hy = 53, ex = 60 + (AX.x - e.x) / 2, ey = 60 + (AX.y - e.y) / 2 - 8, n = Math.ceil(Math.hypot(ex - hx, ey - hy) / 2); // 사슬 · 날아가는 도끼
      for (let i = 0; i <= n; i++) { const k = i / n, X = Math.round(hx + (ex - hx) * k), Y = Math.round(hy + (ey - hy) * k + Math.sin(k * Math.PI) * 3); px(X, Y, i % 2 ? '#8a7a88' : '#c8bcc4'); }
      drawCellWeapon(CAXE, Math.round(ex), Math.round(ey), time * 22); });
    if (K === 'utu') {
      const J = m.jav; if (J && J.x != null) at(J.x, J.y, 60, 60, () => drawCellWeapon(SPEAR, 60 - Math.round(Math.cos(J.ang) * 30), 52 - Math.round(Math.sin(J.ang) * 30), J.ang)); }
    at(e.x, e.y - z, 60, 60, () => { const r = drawAnc(K, 60, 60, time, { face: e.face, rows: deform(K, m.sq, m.lean, e.face), wAng: m.wA, wFront: m.wA > -0.6 && m.wA < 1.7, smear: m.trail.length > 1 ? m.trail : null, vis, noWeapon: !!AX, hand: [Math.round(m.lean * 2), Math.round(m.sq * 3)], spearH: m.spH ? [Math.round(m.spH[0]), Math.round(m.spH[1])] : null, shOff: m.sh ? [Math.round(m.sh[0]), Math.round(m.sh[1])] : null, shGlow: m.glow || 0, noSpear: !!m.jav });
      if (e.dizzy > 0) for (let i = 0; i < 3; i++) { const q = time * 7 + i * 2.09, X = 60 + Math.round(Math.cos(q) * 9), Y = r.top - 3 + Math.round(Math.sin(q) * 2); px(X, Y, '#ffd070'); px(X + 1, Y, '#fff0dc'); px(X, Y - 1, '#fff0dc'); } });
    return; }
  at(e.x, e.y - (e.z || 0), 60, 60, () => {
    drawAnc(e.anc, 60, 60, time, { face: e.anc === 'utu' ? e.face : e.face, pose: e.pose || 'idle', vis, lean: Math.round((e.lean || 0) * 3) });
  });
}
// 정면 막기 (우투르)
function uturBlocks(e, o) {
  const P = P_(); let fromFront;
  if (o.ang != null && !o.dot) fromFront = Math.cos(o.ang - e.dir) < -0.15; // 맞은 방향이 우투르 정면을 향해 들어옴
  else fromFront = Math.cos(Math.atan2(P.y - e.y, P.x - e.x) - e.dir) > 0.15;
  if (!fromFront) return false;
  if (e.stanceT > 0) e.absorb = (e.absorb || 0) + 1; // v3.58 응징의 벽: 막은 수
  if (!(e.blkT > time)) { e.blkT = time + 0.12; G.nums.push({ x: e.x + rand(-4, 4), y: e.y - e.tall, v: '막힘', t: 0.6, c: '#c8c0c8', s: 1, txt: true }); sfx('block', 1.1); sparks(e.x + Math.cos(e.dir) * 22, e.y - 24, e.dir + Math.PI, '#ffe4d4', 5); }
  return true;
}
function ancDown(e) {
  const t3 = T3(), k = e.anc; e.dead = true; cancelTele(e); G.boss = null;
  t3.won[k] = true; t3.duel = null;
  (t3.fades = t3.fades || []).push({ key: k, x: e.x, y: e.y, face: e.face, t: 0 });
  [].concat(LINES[k].out).forEach((t, i) => (G.deadSays = G.deadSays || []).push({ text: t, x: e.x, y: e.y - 80, from: time + i * 2.4, until: time + (i + 1) * 2.4 + (i ? 0.6 : 0) }));
  slowmo = Math.max(slowmo, 0.6); flashT = Math.max(flashT, 0.08); flashColor = '#ff6a50'; sfx('finisher'); burst(e.x, e.y - 30, '#c01828', 24);
  lootFeed(`${ANC[k].name}에게 이겼다 — 결투 ${Object.keys(t3.won).length} / 3`, RED, 3200);
  if (ORDER.every(q => t3.won[q])) t3.finalAt = time + 3.4;
}
function finale() {
  const t3 = T3(); t3.finalAt = null; t3.show = true;
  { const rd = t3.ret && t3.ret.dun; if (rd && rd.boss && rd.boss.cleared) { lostFinale(t3); return; } } // v3.80 크루가쉬를 이미 일반 전투로 쓰러뜨린 판
  const L = [['zak', '끝내 우리를 꺾었군.'], ['gor', '이것이 얼마 만의 패배인가.'], ['utu', '음…!'], ['pl', ANC_RUMOR[G.cls] || ANC_RUMOR.knight], ['zak', '그렇다네.'], ['gor', '그래… 그럼 원하는 것이 무엇인가, 작은 자여.'], ...(ANC_ASK[G.cls] || ANC_ASK.knight).map(t => ['pl', t]), ['utu', '…그러고 보니, 그 아이의 냄새가 희미하구나.'], ['zak', '좋다. 그 바람, 들어주도록 하지.'], ['gor', '크루가쉬. 전사의 아들이여.'], /* v3.76 대사 수정 */ ['zak', '우리 피로 네 영혼을 씻는다.'], ['utu', '깨어나라. 결투는 네 것이다.']];
  SEQ = { k: 'appear3', t: 0, dur: 1.4, end: () => TRUTH.talk(L, () => { SEQ = { k: 'rise', t: 0, dur: 2.6, end: () => { t3.show = false; t3.freed = true; banner('선조의 피가 흩어졌다', '세 선조가 크루가쉬의 이름을 부르며 사라졌다'); sfx('legend'); } }; sfx('awaken'); }) };
  sfx('awaken');
}
// v3.80 크루가쉬가 이미 쓰러진 판: 결투는 똑같이 · 마지막에 「해」를 물으면 선조들은 답하지 못하고 흐려지며 사라짐 (저주를 풀지 않음 · 진실 기록 없음)
const ANC_SUN_ASK = { knight: ['{해}가 무엇인지 알려 다오.'], ranger: ['{해}.', '그게 뭔지 알려 줘.'], mage: ['{해}에 대해 알려 주세요.', '키륵도, 발도르의 주문도 그 말을 했어요.'], priest: ['{해}가 무엇인지 알려 주실 수 있을까요?'], gunner: ['주절주절거리지 말고', '{해}가 뭔지나 말해.'] };
function lostFinale(t3) {
  const L = [['zak', '끝내 우리를 꺾었군.'], ['gor', '이것이 얼마 만의 패배인가.'], ['utu', '음…!'], ['pl', ANC_RUMOR[G.cls] || ANC_RUMOR.knight], ['zak', '그렇다네.'], ['gor', '그래… 그럼 원하는 것이 무엇인가, 작은 자여.'], ...(ANC_SUN_ASK[G.cls] || ANC_SUN_ASK.knight).map(t => ['pl', t]),
    ['utu', '…그 아이의 냄새가 느껴지지 않는구나.'], ['zak', '크루가쉬는 이미 쓰러졌군.'], ['gor', '우리 영혼은 피에 묶여, 그 빛을 기억하지 못한다.'], ['zak', '그것을 아는 건 저주에서 풀려난 자뿐이지.'], ['gor', '그 아이가 살아 있었다면… 답을 들었을 텐데.']];
  SEQ = { k: 'appear3', t: 0, dur: 1.4, end: () => TRUTH.talk(L, () => { SEQ = { k: 'vanish', t: 0, dur: 2.4, end: () => { t3.show = false; t3.lost = true; banner('선조들이 흩어졌다', '세 선조가 아무 답도 남기지 못한 채 사라졌다'); sfx('blip', 0.6); } }; sfx('awaken', 0.6); }) };
  sfx('awaken');
}
const finalPos = k => { const [sx, sb] = STL(k); return [sx, sb + 30]; };

// ---------------------------------------------------------------- ⑦ ~ ⑩ 크루가쉬 (저주가 풀린 판)
function kgIntro(b) {
  const c = G.cls, L = [['krug', '…'], ['krug', '…머리가 맑다. 피 냄새가 가셨어.'], ['pl', KG_FREED[c] || KG_FREED.knight], ['krug', '선조의 결투장을 밟고 왔군, 작은 전사.'], ['krug', '그런 건가… 이제 방해는 없는 건가.'], ['krug', '좋다. 전사여. 이제 목숨을 건 결투를 하자.'], ['pl', REFUSE[c] || REFUSE.knight], ['pl', CROWN[c] || CROWN.knight], ['krug', '…그렇군. 왕관이 궁금한 거로군.'], ['krug', '내 도끼를 꺾어라. 그럼 왕관의 비밀을 말해 주지.']];
  { const P = P_(); try { CINE.focus(Math.round((b.x + P.x) / 2), Math.round((b.y - 30 + P.y - 12) / 2)); } catch (e) { /* 시네마 없음 */ } } // v3.80 크루가쉬와 주인공 사이를 화면 한가운데로
  // v3.76 대화가 끝나면 돌진 없이 바로 포효 + 「약속의 결투」
  TRUTH.talk(L, () => { const P = P_(), a = angTo(b, P); faceTo(b, a); bossRoar(b, '#ff4030');
    b.kg = { ph: 'fight', t: 0 }; G.bossTime = 300; /* v3.80 남은 시간은 결투부터 */ b.dash = null; squeezeStart(b); b.stage = 3; b.hold = false; b.state = 'recover'; b.t = 1.0; b.cd = 0.8; b.huntT = 14; b.summonT = 999; b.armorMul = 1;
    banner('약속의 결투', '크루가쉬가 도끼를 들었다'); sfx('roar', 0.8); });
}
function kgTick(b, dt) {
  const K = b.kg; if (!K) return; K.t += dt;
  if (K.ph === 'wait') { /* v3.76 말을 걸어야(F) 대화 시작 — interact() 'c3kg' */ }
  else if (K.ph === 'charge' && K.t > 0.45) {
    K.ph = 'fight'; b.dash = null; squeezeStart(b); b.stage = 3; b.hold = false; b.state = 'recover'; b.t = 1.0; b.cd = 0.8; b.huntT = 14; b.summonT = 999; b.armorMul = 1;
    banner('약속의 결투', '크루가쉬가 도끼를 들었다'); sfx('roar', 0.8);
  }
}
function kgDying(b, dt) { // v3.77 약속의 결투에서 짐 → 컷신(대화)으로: 잠깐 비틀거린 뒤 마지막 말(F로 넘김) → 숨이 끊어지며 무릎 꿇음(사망 장면) → 주인공 반응 → 양피지
  const D = b.kgD; D.t += dt;
  if (D.t >= 0.6 && !D.kneel) { D.kneel = true; dust(b.x, b.y, 10); sfx('crunch', 0.6); } // v3.80 털썩 무릎 꿇고 숨을 몰아쉼 — 말을 걸어야(F) 마지막 말
  if (D.go && !D.talk) { D.talk = true;
    TRUTH.talk(KG_LAST, () => { b.passKill = true; sfx('growl', 0.4); const R = curR(); if (R) R.kgFell = { t0: time, x: b.x, y: b.y, said: true }; ORIG.killEnemy(b); if (b.dead && typeof BOSSDEATH !== 'undefined') BOSSDEATH.start(b); /* v3.77 무릎 꿇는 사망 장면 (ORIG는 37_bossdeath가 감싸지 못함) */
      SEQ = { k: 'kgfall', t: 0, dur: 2.2, end: () => TRUTH.talk(((q) => q.includes('|') ? q.split('|') : q.split(/(?<=[.!?])\s+/))(KG_SUN[G.cls] || KG_SUN.knight).map(t => ['pl', t.trim()]), () => { const R2 = curR(); if (R2 && R2.kgFell) R2.kgFell.read = true; parchment(); }) }; }); }
}
function parchment() {
  showTruthParchment({ no: '핏빛 엄니 부락', title: '크루가쉬의 마지막 말', ac: RED, paras: ['"' + PURGE + '"', '"' + LAST + '"', '말을 끝맺지 못한 채 크루가쉬는 무릎을 꿇었고, 다시는 일어나지 않았다.'], onClose: () => {
    const first = !TS().t3; TS().t3 = true; (G.truthRun || (G.truthRun = {})).t3 = true; persist();
    lootFeed('진실 기록 — 크루가쉬의 마지막 말', RED, 3600); if (first) sfx('legend');
    kgReward();
  } });
}
// v3.78 약속의 결투 보상: 이벤트(대화 · 양피지)가 다 끝난 뒤에 「보스 처치」 배너 · 하얀 승리 효과 · 상자를 냄
//  · 상자는 쓰러진 몸에서 플레이어 쪽으로 70px 앞에 떨어짐 (방 밖 · 몸과 너무 가까우면 안쪽 · 옆으로 비킴)
let KG_DEFER = null;
function kgReward() {
  const b = KG_DEFER; if (!b) return; KG_DEFER = null;
  ORIG_BD(b);
  const R = curR(), C = R && R.chest, F = R && R.kgFell, P = P_(); if (!C || !F) return;
  let dx = P.x - F.x, dy = P.y - F.y, d = Math.hypot(dx, dy); if (d < 1) { dx = 0; dy = 1; d = 1; }
  let x = F.x + dx / d * 70, y = F.y + dy / d * 70;
  if (d < 110) { const sd = Math.abs(dx) > 6 ? Math.sign(dx) : 1; x = F.x + sd * 72; y = F.y + 22; } // 플레이어가 가까이 서 있으면 그 자리 대신 몸 앞 옆쪽(플레이어 쪽)으로
  x = clamp(x, A.x0 + 44, A.x1 - 44); y = clamp(y, A.y0 + 50, A.y1 - 30);
  if (Math.hypot(x - F.x, y - F.y) < 56) x = F.x + (x >= F.x ? 1 : -1) * 64; // 몸에 붙으면 옆으로
  x = clamp(x, A.x0 + 44, A.x1 - 44);
  C.x = Math.round(x) & ~1; C.y = Math.round(y);
}
const ORIG_BD = bossDefeated;
bossDefeated = function (b) { if (b && b.kind === 'krugash' && b.freed) { KG_DEFER = b; return; } return ORIG_BD.apply(this, arguments); };

// ---------------------------------------------------------------- 매 프레임 · 그리기
// v3.54 테스트 Shift+6: 선조의 결투장 바로 드나들기 (3장이 아니면 3장으로 건너뛴 뒤 들어감 · 지금 방을 피의 결투 원 방으로 삼아 나올 때 그 자리로)
function debugAnc() {
  if (G.trans || G.cine || !G.player || G.player.dead) return;
  if (inArena()) { if (T3().duel) { lootFeed('테스트 — 결투 중엔 나갈 수 없습니다', '#9a8f8a', 2000); return; } leaveArena(false); lootFeed('테스트 — 결투장에서 나옴 (Shift+6)', '#9fd2ff', 2000); return; }
  if (G.stage !== 3) { G.stage = 2; G.noLoad = true; nextStage(); if (mode === 'wmap') wmEnd(); if (mode === 'parchment') closeStageParchment(); G.ancDbg = true; lootFeed('테스트 — 3장으로 건너뛴 뒤 선조의 결투장으로 (Shift+6)', '#9fd2ff', 2600); return; }
  debugAncGo();
}
function debugAncGo() {
  const R = curR(); if (!R) return;
  if (!R.blood) R.blood = { x: null, y: null }; placeBlood(R);
  lootFeed('테스트 — 선조의 결투장으로 (Shift+6 · 안에서 다시 누르면 나옴)', '#9fd2ff', 2600); enterArena(R);
}
function tick(dt) {
  if (!G || !G.player) return;
  if (G.ancDbg && G.stage === 3 && curR() && !G.trans && !G.cine && !inArena()) { G.ancDbg = false; debugAncGo(); }
  pickRoom();
  const R = curR(), P = G.player, t3 = T3(); if (!R) return;
  if (R.blood) placeBlood(R);
  if (R.type === 'ancArena') {
    keepIn(P, P.r);
    if (t3.fades) t3.fades = t3.fades.filter(f => (f.t += dt) < 1.4);
    if (t3.finalAt && time > t3.finalAt && !TRUTH.busy()) finale();
  }
  if (R.type === 'boss' && G.stage === 3) {
    const b = G.enemies.find(e => e.kind === 'krugash');
    if (b && b.kg) kgTick(b, dt);
    if (b && b.kgD) kgDying(b, dt);
    if (R.kgFell && !R.kgFell.said && time - R.kgFell.t0 > 2.0 && mode === 'play') { R.kgFell.said = true; // v3.20 무릎 꿇는 장면이 끝나면 주인공이 「해」에 반응 (멈춰 서서 F로 넘김) → 끝나면 양피지
      TRUTH.talk(((q) => q.includes('|') ? q.split('|') : q.split(/(?<=[.!?])\s+/))(KG_SUN[G.cls] || KG_SUN.knight).map(t => ['pl', t.trim()]), () => { R.kgFell.read = true; parchment(); }); }
  }
}
function busy() { return !!SEQ; }
function update(rdt) {
  if (!SEQ) return; SEQ.t += rdt;
  if (SEQ.t >= SEQ.dur) { const s = SEQ; SEQ = null; if (s.end) s.end(); }
}
function ground() {
  const R = curR(); if (!R) return;
  if (R.blood && R.blood.x != null) { const B = R.blood, st = SEQ && SEQ.k === 'enter' ? 'pulse' : bloodState(R); at(B.x, B.y, 0, 0, () => bloodCircle(0, 0, st === 'enter' ? 'pulse' : st, time)); }
  if (R.type === 'ancArena') { const o = loff(), t3 = T3();
    at(o.x, o.y, 0, 0, () => { // 출구 원: 결투 중엔 꺼짐
      if (!t3.duel && !SEQ) { const [ex, ey] = AR.exit, on = Math.floor(time * 2.4) % 3; for (let a = 0; a < 90; a++) { const q = a / 90 * Math.PI * 2, lit = (a + Math.floor(time * 20)) % 30 < 5 + on * 2; px(Math.round(ex + Math.cos(q) * 13), Math.round(ey + Math.sin(q) * 6), lit ? '#ff6a40' : '#8a141a'); } glow(ex, ey, 16, '255,50,40', 0.16, 7); }
    }); }
  if (R.kgBeam) { const K = R.kgBeam; at(K.x, K.y, 200, 260, () => beamKill(200, 260, Math.min(time - K.t0, 6), 'g')); }
}
function ents(list) {
  const R = curR(); if (!R) return;
  if (R.type === 'ancArena') { const t3 = T3(), f = Math.floor(time * 2) % 2, o = loff();
    for (const k of ORDER) { const [sx, sb] = STL(k), st = stState(k), b = steleArt(k, st, f), pb = pedArt(k, st, f), w = lw(sx, sb + 1), wp = lw(sx, sb + 15);
      list.push({ y: w.y, d: () => ctx.drawImage(b.c, o.x + b.ax * 2, o.y + b.ay * 2) }, { y: wp.y, d: () => ctx.drawImage(pb.c, o.x + pb.ax * 2, o.y + pb.ay * 2) }); }
    if (SEQ && SEQ.k === 'burst') { const p = lw(C0[0], C0[1]), T = SEQ.t; if (T > BG0 + 0.3) list.push({ y: p.y, d: () => at(p.x, p.y, 60, 60, () => drawAnc(SEQ.key, 60, 60, time, { face: -1, vis: Math.min(1, (T - BG0 - 0.3) / 0.8), pose: SEQ.key === 'utu' ? 'guard' : 'idle' })) }); }
    for (const e of G.enemies) if (e.anc === 'utu' && e.m && e.m.spikes) for (const q of e.m.spikes) list.push({ y: q.y, d: () => at(q.x, q.y, 60, 60, () => boneSpike(q)) }); // v3.62
    for (const fd of t3.fades || []) list.push({ y: fd.y, d: () => at(fd.x, fd.y, 60, 60, () => drawAnc(fd.key, 60, 60, time, { face: fd.face, fade: Math.min(1, fd.t / 1.2), noAura: fd.t > 0.3 })) });
    if (t3.show) for (const k of ORDER) { const [cx, cy] = finalPos(k), p = lw(cx, cy); let vis = 0.85, fade = 0;
      if (SEQ && SEQ.k === 'appear3') vis = Math.min(0.85, SEQ.t / 1.2); if (SEQ && (SEQ.k === 'rise' || SEQ.k === 'vanish')) fade = Math.min(1, SEQ.t / 2.2); /* v3.80 vanish: 피를 흘리지 않고 흐려짐 */
      list.push({ y: p.y, d: () => at(p.x, p.y, 60, 60, () => drawAnc(k, 60, 60, time, { face: cx < AR.cx ? 1 : cx > AR.cx ? -1 : 1, vis, fade, noAura: fade > 0.3 })) }); }
  }
}
function top() {
  const R = curR(); if (!R) return;
  if (R.type === 'ancArena') { const o = loff(); ctx.drawImage(arenaFront(Math.floor(time * 8) % 3), o.x, o.y);
    at(o.x, o.y, 0, 0, () => { embers(time, 22);
      if (SEQ && SEQ.k === 'rise') for (const k of ORDER) { const [cx, cy] = finalPos(k); redMist(SEQ.t * 1.4, cx, cy - 10, 1); const kk = Math.min(1, SEQ.t / 2.2); for (let i = 0; i < 5; i++) { const y0 = cy - 30 - Math.floor(kk * 160) + i * 9; for (let y = y0; y < y0 + 6; y++) px(cx - 4 + i * 2, y, i % 2 ? '#ff5a3a' : '#a01020'); } } }); }
  if (R.blood && SEQ && SEQ.k === 'enter') { const B = R.blood; at(B.x, B.y, 0, 0, () => bloodCircle(0, 0, 'enter', SEQ.t)); }
  if (R.kgBeam) { const K = R.kgBeam, t = time - K.t0; if (t < 3) at(K.x, K.y, 200, 260, () => beamKill(200, 260, t, 'f')); }
  if (R.type === 'boss' && G.stage === 3) { const b = G.enemies.find(e => e.kind === 'krugash' && !e.dead);
    if (b && b.kg && b.kg.ph === 'charge') drawBubble('!!', G.player.x, G.player.y - 38, 0);
    if (b && b.kgD && b.kgD.kneel && !b.kgD.go && !TRUTH.busy()) drawBubble('허억... 헉...', b.x, b.y - 62, 0); } // v3.80 무릎 꿇고 숨을 몰아쉬는 동안
}
function lights(list) {
  const R = curR(); if (!R) return;
  if (R.blood && R.blood.x != null) { const st = bloodState(R); if (st !== 'stain' || (SEQ && SEQ.k === 'enter')) list.push({ x: R.blood.x, y: R.blood.y, r: 80, a: 0.5, c: '255,50,40', ca: 0.16 }); }
  if (R.type === 'ancArena') { const t3 = T3();
    for (const k of ORDER) { const [sx, sb] = STL(k), p = lw(sx, sb - 20), st = stState(k); list.push({ x: p.x, y: p.y, r: st === 'done' ? 50 : 90, a: st === 'done' ? 0.3 : 0.6, c: '255,60,40', ca: st === 'fight' ? 0.22 : st === 'done' ? 0.02 : 0.12 }); }
    for (const q of BRAZ) { const [x, by] = RIM(q), p = lw(x, by - 9); list.push({ x: p.x, y: p.y, r: 120, a: 0.8, c: '255,110,50', ca: 0.18 }); }
    const c = lw(AR.cx, AR.cy); list.push({ x: c.x, y: c.y, r: 260, a: 0.45 });
    for (const e of G.enemies) if (e.anc === 'utu' && e.m && e.m.spikes) for (const q of e.m.spikes) list.push({ x: q.x, y: q.y - 14, r: 44, a: 0.7, c: '255,230,210', ca: 0.18 }); // v3.62 뼈 가시가 어둠에 묻히지 않게
    if (!t3.duel) { const e = lw(AR.exit[0], AR.exit[1]); list.push({ x: e.x, y: e.y, r: 50, a: 0.4, c: '255,50,40', ca: 0.12 }); }
    if (SEQ && SEQ.k === 'burst') { const p = lw(C0[0], C0[1]); list.push({ x: p.x, y: p.y - 40, r: 200, a: 0.9, c: '255,60,40', ca: 0.3 }); }
    for (const e of G.enemies) if (e.type === 'anc' && !e.dead) list.push({ x: e.x, y: e.y - 30, r: 110, a: 0.55, c: '255,70,50', ca: 0.14 });
  }
  if (R.kgBeam) { const t = time - R.kgBeam.t0; if (t < 1.2) list.push({ x: R.kgBeam.x, y: R.kgBeam.y - 40, r: 300, a: 1 - t / 1.2, c: '255,236,170', ca: 0.4 * (1 - t / 1.2) }); }
}
function interact() {
  const R = curR(), P = G.player; if (!R || !P || SEQ) return null;
  if (R.blood && R.blood.x != null && R.cleared && !G.sealed && circleOn() && inBlood(R.blood, P)) return { k: 'truth', a: 'c3in', x: R.blood.x, y: R.blood.y - 40, t: 'F 원 안에 서기' };
  if (R.type === 'boss' && G.stage === 3) { const d = G.enemies.find(e => e.kind === 'krugash' && !e.dead && e.kgD && e.kgD.kneel && !e.kgD.go); // v3.80 무릎 꿇은 크루가쉬에게 말 걸기
    if (d && Math.hypot(P.x - d.x, (P.y - d.y) * 1.3) < 86) return { k: 'truth', a: 'c3kgL', x: d.x, y: d.y - 90, t: 'F 말 걸기' }; }
  if (R.type === 'boss' && G.stage === 3) { const b = G.enemies.find(e => e.kind === 'krugash' && !e.dead && e.kg && e.kg.ph === 'wait'); // v3.76 저주가 풀린 크루가쉬에게 말 걸기
    if (b && b.kg.t > 0.6 && Math.hypot(P.x - b.x, (P.y - b.y) * 1.3) < 86) return { k: 'truth', a: 'c3kg', x: b.x, y: b.y - 100, t: 'F 말 걸기' }; }
  if (R.type === 'ancArena') { const t3 = T3(); if (t3.duel || t3.show || t3.finalAt) return null;
    if (!t3.freed) for (const k of ORDER) { if (t3.won[k]) continue; const [sx, sb] = STL(k), p = lw(sx, sb + 14); if (Math.hypot(P.x - p.x, P.y - (p.y + 14)) < 46) return { k: 'truth', a: 'c3duel', key: k, x: p.x, y: p.y - 40, t: 'F 결투 신청' }; }
    const e = lw(AR.exit[0], AR.exit[1]); if (Math.hypot((P.x - e.x) / 1.6, P.y - e.y) < 24) return { k: 'truth', a: 'c3out', x: e.x, y: e.y - 40, t: 'F 결투장 떠나기' }; }
  return null;
}
function act(it) {
  const R = curR();
  if (it.a === 'c3in') { TRUTH.freeze(); R.blood.enterT = 0; SEQ = { k: 'enter', t: 0, dur: 1.3, end: () => { R.blood.enterT = null; enterArena(R); } }; sfx('awaken'); flashT = 0.1; flashColor = '#ff3020'; }
  else if (it.a === 'c3duel') challenge(it.key);
  else if (it.a === 'c3out') leaveArena(false);
  else if (it.a === 'c3kgL') { const d = G.enemies.find(e => e.kind === 'krugash' && !e.dead && e.kgD && e.kgD.kneel); if (d) d.kgD.go = true; }
  else if (it.a === 'c3kg') { const b = G.enemies.find(e => e.kind === 'krugash' && !e.dead && e.kg && e.kg.ph === 'wait'); if (b) { b.kg.ph = 'talk'; kgIntro(b); } }
}
function spk(who) {
  if (who === 'krug') { const b = G.enemies.find(e => e.kind === 'krugash' && !e.dead); if (b) return { x: b.x, y: b.y - 92 }; }
  if (ANC[who]) { const [cx, cy] = finalPos(who), p = lw(cx, cy); return { x: p.x, y: p.y - 72 }; }
  return null;
}

// ---------------------------------------------------------------- 게임 함수 덮어씌우기
const ORIG = { killEnemy, damageEnemy, playerDie, updateEnemy, drawEnemyBody, spawnKrugash, updateKrugash, paintRoomFloor };
killEnemy = function (e, silent) {
  if (e && e.type === 'anc') { ancDown(e); return; }
  if (e && e.kind === 'krugash' && e.freed && !e.passKill) { // 약속의 결투에서 짐: 마지막 말 → 스스로 쓰러짐 (v3.20 빛기둥 삭제)
    if (e.kgD) return; e.kgD = { t: 0 }; e.hp = 1; cancelTele(e); e.steps = null; e.dash = null; e.air = null; e.z = 0; e.state = 'recover'; e.t = 99; e.hold = true; G.tele = G.tele.filter(t => t.owner !== e); e.spikeQ = [];
    sfx('growl', 0.6); return; }
  return ORIG.killEnemy(e, silent);
};
damageEnemy = function (e, coef, o = {}) {
  if (e && e.kgD) return;
  if (e && e.type === 'anc' && e.anc === 'utu' && !e.dead && uturBlocks(e, o)) return;
  return ORIG.damageEnemy(e, coef, o);
};
playerDie = function () {
  if (inArena()) { // 결투에서 짐 = 추방 (목숨은 잃지 않음 · 들어왔을 때 체력으로)
    const P = G.player, t3 = T3(); P.hp = Math.max(1, t3.hp0 || 2); P.inv = 2; P.dead = false;
    for (const e of G.enemies) if (e.type === 'anc') { e.dead = true; cancelTele(e); }
    G.enemies = G.enemies.filter(e => e.type !== 'anc'); G.boss = null; G.tele = []; G.shocks = [];
    t3.won = {}; t3.duel = null; t3.fades = []; t3.finalAt = null;
    leaveArena(true); return;
  }
  return ORIG.playerDie();
};
updateEnemy = function (e, dt) { if (e.type === 'anc') { updAnc(e, dt); return; } return ORIG.updateEnemy(e, dt); };
drawEnemyBody = function (e) { if (e.type === 'anc') { drawAncE(e); return; } if (e.kgD && e.kgD.kneel && typeof BOSSDEATH !== 'undefined' && BOSSDEATH.kneel) { BOSSDEATH.kneel(e, Math.floor(time * 2.6) % 2); return; } /* v3.80 무릎 꿇고 숨을 몰아쉼 (고개가 오르내림) */ if (e.hidden) return; return ORIG.drawEnemyBody(e); };
spawnKrugash = function () {
  // v3.80 저주가 풀린 크루가쉬: 등장 연출(낙하 · 먼지 · 빛기둥 · 포효 · 흔들림 · 소리) 없이 방 한가운데에서 대기 모션으로 서 있음
  const quiet = T3().freed; let undo = null;
  if (quiet) { const s0 = sfx, a0 = addShake, f0 = G.fx.length, p0 = G.parts.length, sm = slowmo, ft = flashT, sh = shake; sfx = () => {}; addShake = () => {};
    undo = () => { sfx = s0; addShake = a0; G.fx.length = f0; G.parts.length = p0; slowmo = sm; flashT = ft; shake = sh; }; }
  let r; try { r = ORIG.spawnKrugash.apply(this, arguments); } finally { if (undo) undo(); }
  if (quiet && G.boss && G.boss.kind === 'krugash') { const q = G.boss; q.rise = 0; q.roarUntil = 0; q.grogiLock = 0; q.state = 'idle'; q.t = 0; }
  if (T3().freed && G.boss && G.boss.kind === 'krugash') { const b = G.boss; b.x = Math.round((A.x0 + A.x1) / 2); b.y = Math.round((A.y0 + A.y1) / 2); b.dir = Math.PI / 2; /* v3.76 방 한가운데에서 기다림 */ b.freed = true; b.hold = true; b.kg = { ph: 'wait', t: 0 }; b.summonT = 999; }
  return r;
};
updateKrugash = function (b, dt) {
  if (b.hold) { b.flash = Math.max(0, b.flash - dt); b.rise = Math.max(0, b.rise - dt); b.lean *= Math.pow(0.02, dt); orcTick(b, dt); return; }
  return ORIG.updateKrugash(b, dt);
};
paintRoomFloor = function (R) { if (R.type === 'ancArena') { withSeed(R.seed, () => { ROOMSTYLE = R.style; CUR_ROOM = R; paintArena(fg); }); return; } return ORIG.paintRoomFloor(R); };
// v3.59 결투 신청 때 붉은 기둥은 맨 위(조명 · 앞 장식 위)에 그려 가려지지 않게 — 조명 뒤에 불리는 END.top에 이어 붙임
{ const o = END.top; END.top = function () { const r = o.apply(this, arguments); const R = curR(); if (R && R.type === 'ancArena' && SEQ && SEQ.k === 'burst') { const p = loff(); if (!SEQ.fl && SEQ.t >= BG0) { SEQ.fl = true; flashT = Math.max(flashT, 0.12); flashColor = '#ffd8b0'; addShake(10); sfx('blast', 0.6); sfx('roar', 0.7); } at(p.x, p.y, 0, 0, () => ancBurst(C0[0], C0[1], SEQ.t, SEQ.key)); } return r; }; }
// TRUTH 훅 (11d)
{ const T = TRUTH, o = { interact: T.interact, act: T.act, tick: T.tick, ground: T.ground, ents: T.ents, lights: T.lights, top: T.top, busy: T.busy, update: T.update };
  T.interact = () => { if (SEQ) return null; return interact() || o.interact(); };
  T.act = it => { if (it.a && it.a.startsWith('c3')) { act(it); return; } o.act(it); };
  T.tick = dt => { o.tick(dt); tick(dt); };
  T.ground = () => { o.ground(); ground(); };
  T.ents = list => { o.ents(list); ents(list); };
  T.lights = list => { o.lights(list); lights(list); };
  T.top = () => { top(); o.top(); };
  T.busy = () => o.busy() || busy();
  T.update = rdt => { if (SEQ) update(rdt); else o.update(rdt); };
}
return { dbgFinale: () => { const t3 = T3(); t3.won = t3.won || {}; ORDER.forEach(q => { t3.won[q] = true; }); t3.duel = null; finale(); }, spk, busy, inArena, debugAnc, get T3() { return T3(); }, _enter: enterArena };
})();
;

// ==================================================================== 20_occupancy.js
'use strict';
// 잿빛 왕관 토벌대 — 20_occupancy.js (v2.85) : 방마다 하나의 점유 지도
// 장애물 · 소품 · 특별방 시설 · 벽 장식 · 바닥 장식 · 진엔딩 단서가 모두 같은 지도를 보고 자리를 잡는다.
// 4px 칸 격자에 칸마다 두 가지를 기록: 발 자리(foot · 땅에 닿는 판정) / 그림 자리(vis · 실제로 그려지는 픽셀)
// 먼저 놓인 것이 이기고 나중 것이 비켜 간다: 예약(문 앞 · 상자 · 텔레포터 · 진엔딩 단서) → 장애물 → 소품 · 시설 → 벽 장식 → 큰 바닥 장식 → 작은 자국
const OCC = (() => {
  const C = 4;
  const KEY = 1, WALL = 2, OBS = 3, PROP = 4, BIG = 5, SMALL = 6, CEN = 7;
  const NAME = { 1: '예약', 2: '벽 장식', 3: '장애물', 4: '소품 · 시설', 5: '큰 바닥 장식', 6: '작은 자국', 7: '방 가운데' };
  const B = (...ls) => ls.reduce((m, l) => m | (1 << l), 0);
  // ---------------------------------------------------------------- 여유 거리 표 (칸 = 4px) · 여기 한 곳에서 조절
  // 놓으려는 것 → [발 자리와 겹치면 안 되는 층, 칸 여유] · [그림 자리와 겹치면 안 되는 층, 칸 여유]
  const RULE = {
    prop: { foot: [B(KEY, OBS, PROP, CEN), 2], vis: [B(OBS, PROP), 1] },        // 서 있는 소품: 발은 8px, 그림은 4px 띄움
    wall: { foot: [0, 0], vis: [B(OBS, PROP), 0] },                              // 벽 장식: 앞에 선 그림과 겹치지 않게
    big: { foot: [B(KEY, OBS, PROP, CEN), 1], vis: [B(OBS, PROP, BIG, SMALL), 0] }, // 깔개 · 큰 바닥 장식
    small: { foot: [B(KEY, OBS, PROP), 0], vis: [B(OBS, PROP, BIG, SMALL), 0] },   // 뼈 · 자갈 · 돌 · 풀 등 (서로도 겹치지 않음)
    tiny: { foot: [B(KEY, OBS, PROP), 0], vis: [B(OBS, PROP, BIG, SMALL), 0] },    // 아주 작은 점(풀잎 · 꽃): 검사만 하고 자리는 남기지 않음
    blood: { foot: [B(KEY, OBS, PROP), 2], vis: [B(OBS, PROP), 1] },            // 3장 피의 결투 원
  };
  const TINY_AREA = 160, BIG_AREA = 1600;
  let CUR = null, BUILD = false, STAT = null;

  // ---------------------------------------------------------------- 격자
  function grid() {
    const x0 = Math.floor((A.x0 - 96) / C) * C, y0 = Math.floor((A.y0 - 200) / C) * C, w = Math.ceil((A.x1 + 96 - x0) / C), h = Math.ceil((A.y1 + 96 - y0) / C);
    return { x0, y0, w, h, foot: new Uint8Array(w * h), vis: new Uint8Array(w * h), skip: {} };
  }
  const cellOf = (O, x, y) => { const cx = Math.floor((x - O.x0) / C), cy = Math.floor((y - O.y0) / C); return cx < 0 || cy < 0 || cx >= O.w || cy >= O.h ? -1 : cy * O.w + cx; };
  function rectCells(O, x0, y0, x1, y1) {
    const out = [], a = Math.max(0, Math.floor((x0 - O.x0) / C)), b = Math.min(O.w - 1, Math.floor((x1 - 1 - O.x0) / C)), c = Math.max(0, Math.floor((y0 - O.y0) / C)), d = Math.min(O.h - 1, Math.floor((y1 - 1 - O.y0) / C));
    for (let y = c; y <= d; y++) for (let x = a; x <= b; x++) out.push(y * O.w + x);
    return out;
  }
  function ellCells(O, cx, cy, rx, ry) {
    ry = ry || rx; const out = [];
    for (const i of rectCells(O, cx - rx, cy - ry, cx + rx + 1, cy + ry + 1)) { const x = O.x0 + (i % O.w) * C + C / 2, y = O.y0 + Math.floor(i / O.w) * C + C / 2; if (((x - cx) / (rx + C / 2)) ** 2 + ((y - cy) / (ry + C / 2)) ** 2 <= 1) out.push(i); }
    return out;
  }
  // 그림의 실제 픽셀 (2px 칸마다 투명하지 않은 곳) — 그림마다 한 번만 읽음
  const ALPHA = new WeakMap();
  function alphaOff(cv) {
    let a = ALPHA.get(cv); if (a) return a;
    a = []; try { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      for (let y = 0; y < cv.height; y += 2) for (let x = 0; x < cv.width; x += 2) { const k = (y * cv.width + x) * 4 + 3; if (d[k] > 60 || (x + 1 < cv.width && d[k + 4] > 60) || (y + 1 < cv.height && d[k + cv.width * 4] > 60)) a.push(x, y); } } catch (e) { a = null; }
    ALPHA.set(cv, a); return a;
  }
  function maskCells(O, cv, x, y, flip) {
    const a = alphaOff(cv); if (!a) return rectCells(O, x, y, x + cv.width, y + cv.height);
    const s = new Set();
    for (let k = 0; k < a.length; k += 2) { const i = cellOf(O, x + (flip ? cv.width - 2 - a[k] : a[k]), y + a[k + 1]); if (i >= 0) s.add(i); }
    return [...s];
  }
  function hit(O, arr, cells, mask, dil) {
    if (!mask) return false;
    for (const c of cells) { const cx = c % O.w, cy = (c / O.w) | 0;
      for (let dy = -dil; dy <= dil; dy++) { const y = cy + dy; if (y < 0 || y >= O.h) continue;
        for (let dx = -dil; dx <= dil; dx++) { const x = cx + dx; if (x < 0 || x >= O.w) continue; const v = arr[y * O.w + x]; if (v && (mask >> v) & 1) return true; } } }
    return false;
  }
  function mark(arr, cells, v) { for (const c of cells) if (!arr[c] || arr[c] > v) arr[c] = v; }
  function fits(O, rule, foot, vis) { const R = RULE[rule]; return !hit(O, O.foot, foot, R.foot[0], R.foot[1]) && !hit(O, O.vis, vis, R.vis[0], R.vis[1]); }
  function put(O, v, foot, vis) { mark(O.foot, foot, v); mark(O.vis, foot, v); if (vis) mark(O.vis, vis, v); }
  const skip = (O, k) => { O.skip[k] = (O.skip[k] || 0) + 1; };

  // ---------------------------------------------------------------- 방에 이미 있는 것들을 지도에 올림
  function obsFoot(O, b) { return b.c ? ellCells(O, b.x, b.y, b.r, b.r) : rectCells(O, b.x0, b.y0, b.x1, b.y1); }
  function propCells(O, q) {
    const sp = PROPS[q.name]; let foot, vis;
    if (sp.pit) foot = rectCells(O, q.x - sp.w / 2, q.y - sp.h / 2, q.x + sp.w / 2, q.y + sp.h / 2);
    else foot = ellCells(O, q.x, q.y - 2, q.rad || sp.r || 8, Math.max(4, (q.rad || sp.r || 8) * 0.6));
    if (PROP_MAPS[q.name]) { const c = propCanvas(q.name), x = (q.x - c.width / 2) & ~1, y = (q.y - c.height + (sp.foot || 0) * 2) & ~1; vis = maskCells(O, c, x, y); }
    else { const r = propRect(q); vis = rectCells(O, r.x0, r.y0, r.x1, r.y1); }
    return { foot, vis };
  }
  function keysOf(R) { // 비워 둘 자리
    const out = [];
    for (const d in R.doors) if (R.doors[d] != null) out.push([doorIn(d, 34), 40]);
    if (R.crack) out.push([doorIn(R.crack.dir, 34), 40]);
    if (R.tele) out.push([R.tele, 42]); if (R.chest) out.push([R.chest, 30]); if (R.exitP) out.push([R.exitP, 34]);
    if (R.shop) for (const q of R.shop) out.push([q, 24]);
    if (R.bridges) for (const q of R.bridges) out.push([q, 26]);
    if (R.type === 'rest') out.push([{ x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy }, 30]);
    if (R.keeper) out.push([R.keeper, 20]);
    return out;
  }
  function truthKeys(O, R) { // 진엔딩 단서 자리
    if (R.pond && R.pond.x != null) put(O, KEY, ellCells(O, R.pond.x, R.pond.y, 74, 32));
    if (R.slimeTree) put(O, KEY, ellCells(O, R.slimeTree.x, R.slimeTree.y - 10, 40, 30));
    if (R.bloodSpot) put(O, KEY, ellCells(O, R.bloodSpot.x, R.bloodSpot.y, 44, 22));
    if (R.blood && R.blood.x != null) put(O, KEY, ellCells(O, R.blood.x, R.blood.y, 44, 22));
    if (R.sealW) put(O, KEY, rectCells(O, DOOR.n.x - 110, A.y0 - 110, DOOR.n.x + 110, A.y0 + 30));
  }
  function build(R, keyPts) {
    const O = grid();
    if (keyPts) for (const p of keyPts) { if (p.big) put(O, CEN, ellCells(O, CX, CY - 10, CLEAR_R, CLEAR_R)); else put(O, KEY, ellCells(O, p.x, p.y, 40, 40)); }
    else { for (const [p, r] of keysOf(R)) put(O, KEY, ellCells(O, p.x, p.y, r, r)); if (['combat', 'elite', 'survive', 'boss', 'start', 'reward', 'secret'].includes(R.type)) put(O, CEN, ellCells(O, CX, CY - 10, CLEAR_R - 8, CLEAR_R - 8)); }
    truthKeys(O, R);
    if (['shrine', 'shop', 'rest', 'reward', 'secret'].includes(R.type)) put(O, OBS, rectCells(O, A.x0 - 16, A.y0 - 16, A.x1 + 16, A.y1 + 16)); // v3.25 특수방(빛의 샘 · 상점 · 비스트로 · 숨은 보고 · 잊힌 틈새): 환경 장식 · 집기를 놓지 않음 (방마다 정해진 시설만)
    for (const b of R.obs || []) if (b.t !== 'chest') put(O, b.t === 'prop' ? PROP : OBS, obsFoot(O, b));
    for (const s of R.sprites || []) mark(O.vis, maskCells(O, s.cv, s.x, s.y), OBS);
    for (const q of R.props || []) { const c = propCells(O, q); put(O, PROP, c.foot, c.vis); }
    if (R.srp && typeof srRect === 'function') for (const s of R.srp) { const q = srRect(s); if (q) mark(O.vis, rectCells(O, q.x0, q.y0, q.x1, q.y1), PROP); }
    if (R.altars) for (const a of R.altars) put(O, PROP, rectCells(O, a.x - 24, a.y - 42, a.x + 24, a.y + 6));
    O.R = R; return O;
  }

  // ---------------------------------------------------------------- 장애물끼리: 실제 그림이 크게 겹치는 둥근 장애물(바위 · 나무 · 기둥)은 뺀다
  function pruneObs(r) {
    const S = r.sprites || []; if (!S.length) return;
    const O = grid(), of = new Map();
    for (const s of S) { const cx = s.x + s.cv.width / 2; const b = r.obs.find(o => o.c && !of.has(o) && (o.t === 'rock' || o.t === 'pillar') && !o.of && Math.abs(o.y - s.sy) <= 2 && Math.abs(o.x - cx) <= 8); if (b) of.set(b, s); }
    for (const s of S) if (![...of.values()].includes(s)) mark(O.vis, maskCells(O, s.cv, s.x, s.y), OBS); // 벽 · 망루 등은 먼저
    const gone = new Set();
    for (const b of r.obs) { const s = of.get(b); if (!s) continue; const cells = maskCells(O, s.cv, s.x, s.y);
      let n = 0; for (const c of cells) if (O.vis[c]) n++;
      if (n > 6) { gone.add(b); continue; } mark(O.vis, cells, OBS); }
    if (!gone.size) return;
    r.obs = r.obs.filter(b => !gone.has(b)); r.sprites = S.filter(s => ![...gone].some(b => of.get(b) === s)); r.nav = buildNav(r.obs);
    if (STAT) STAT.pruned = (STAT.pruned || 0) + gone.size;
  }
  // 3장 피의 결투 원 자리 (격전지마다 미리 잡아 둠 — 고른 방 하나만 보임)
  function bloodSpot(r) {
    if (r.type !== 'combat' || !SHAPES[r.shape] || SHAPES[r.shape].w < 480 || SHAPES[r.shape].h < 300) return;
    const O = CUR, doors = Object.keys(r.doors).filter(d => r.doors[d] != null).map(d => doorIn(d, 30));
    for (const [dx, dy] of [[0, 30], [0, -30], [-120, 20], [120, 20], [-120, -40], [120, -40], [0, 90], [-200, 0], [200, 0], [0, -90], [-200, 70], [200, 70]]) {
      const x = Math.round((CX + dx) / 2) * 2, y = Math.round((CY + dy) / 2) * 2;
      if (x < A.x0 + 60 || x > A.x1 - 60 || y < A.y0 + 40 || y > A.y1 - 40 || doors.some(q => Math.hypot(q.x - x, q.y - y) < 90)) continue;
      const cells = ellCells(O, x, y, 44, 22); if (!fits(O, 'blood', cells, cells)) continue;
      r.bloodSpot = { x, y }; put(O, KEY, cells); return;
    }
  }

  // ---------------------------------------------------------------- 게임 함수 연결
  const ORIG = { decorRoom, paintRoomFloor, decBlock, withDecor, decFree };
  decorRoom = function (r, stage, keyPts) {
    r.sprites = makeObsSprites(r); r.nav = buildNav(r.obs); pruneObs(r); // v2.87 그림에 맞춰 판정 반경이 바뀔 수 있음
    const O0 = CUR, B0 = BUILD; CUR = build(r, keyPts); BUILD = true;
    try { ORIG.decorRoom(r, stage, keyPts); if (G.stage === 3) bloodSpot(r); }
    finally { CUR = O0; BUILD = B0; }
  };
  paintRoomFloor = function (R) {
    const O0 = CUR; CUR = build(R, null);
    try { return ORIG.paintRoomFloor(R); } finally { R.occ = CUR; CUR = O0; }
  };
  decBlock = function (cv, x, y, w, h) {
    if (!DEC || cv !== DEC.g) return false;
    const O = CUR; if (!O) return ORIG.decBlock(cv, x, y, w, h);
    const cells = rectCells(O, x, y, x + w, y + h), a = w * h, k = a < TINY_AREA ? 'tiny' : a >= BIG_AREA ? 'big' : 'small';
    if (!fits(O, k, cells, cells)) { skip(O, k); return true; }
    if (k !== 'tiny') put(O, k === 'big' ? BIG : SMALL, cells);
    return false;
  };
  withDecor = function (g, R, fn) {
    if (!R) return fn();
    const O0 = CUR; if (!CUR || CUR.R !== R) CUR = build(R, null);
    const D0 = DEC; DEC = { g, solid: [], rects: [] };
    try { fn(); } finally { DEC = D0; CUR = O0 || CUR; }
  };
  decFree = function (x, y, r = 6, claim) {
    const R = typeof CUR_ROOM !== 'undefined' ? CUR_ROOM : null; if (!R || !G) return true;
    if (!CUR || CUR.R !== R) CUR = build(R, null);
    const cells = rectCells(CUR, x - r, y - r, x + r, y + r);
    if (!fits(CUR, 'small', cells, cells)) { skip(CUR, 'small'); return false; }
    if (claim) put(CUR, SMALL, cells);
    return true;
  };
  // 6 · 12에서 부름
  const on = () => BUILD && !!CUR;
  function prop(q) { const O = CUR, c = propCells(O, q); if (!fits(O, 'prop', c.foot, c.vis)) { skip(O, 'prop'); return false; } put(O, PROP, c.foot, c.vis); return true; }
  function wall(x, y, w, h) { const O = CUR; if (!O) return true; const cells = rectCells(O, x, y, x + w, y + h); if (!fits(O, 'wall', [], cells)) { skip(O, 'wall'); return false; } mark(O.vis, cells, WALL); return true; }
  function stamp(x, y, w, h) { const O = CUR; if (!O) return true; const cells = rectCells(O, x, y, x + w, y + h), k = w * h < TINY_AREA ? 'tiny' : 'small'; if (!fits(O, k, cells, cells)) { skip(O, k); return false; } if (k !== 'tiny') put(O, SMALL, cells); return true; }

  return { on, prop, wall, stamp, RULE, get cur() { return CUR; }, set stat(v) { STAT = v; }, get stat() { return STAT; } };
})();
;

// ==================================================================== 21_ash4.js
'use strict';
// 잿빛 왕관 토벌대 — 21_ash4.js (v2.87 · v2.89) : 4장 잿빛 왕도 고유 요소
// v2.87 작은 장애물 (시안 4장_37번_다른방향_시안.html A~D 섞음) · v2.89 가로등 · 왕실 깃대 · 왕관 테 화로 · 연회 식탁과 의자 · 바닥 자국 (시안 4장_고유요소_시안.html 36 · 39 · 40 · 41 · 43)
const ASH4 = (() => {
  const ROWS = {"B": ["......kkaaak............", "....kkaaAkk.............", "...kaaBBk...............", "..kaBwwkkkk.............", "...kwWWwwwwkkk..........", "...kwWkWWWwaaakk........", "...kwWkkkkWWWWaak.......", "...kwWk...kkjkAWk.......", "...kwWk....kjkkk........", "...kwWk....kjk.....kk...", "...kwWk....kjk....kaCk..", "...kwWk....kjk....kAWk..", "...kwWk....kjk....kwWk..", "...kwWk....kjk....kwWk..", "...kwWk...kijjk...kwWk..", "...kwWk.kkkijjkkk.kwWk..", "...kwWkklllijjllakkwWk..", "...kwWhDCCCCCCCCCaawWk..", "...kwWCCCCCCCCCCCCCwWk..", "..khhDCCCCCCCCCCCCCDdak.", ".kahhhhDCCCCCCCCCDddddak", "..khDhhlDlllDlllDdddDdk.", "...khDDllDDllDDldDDddk..", "....khDlllDlllDlddDdk...", ".....kkkDDllDDllDkkk....", "........kkkkkkkkk......."], "C": ["..........................", "............kk............", "...........kaak...........", "..........kalAak..........", "..........khllAk..........", ".........kkhlldkkk........", ".....kkkkaahlldaaakkkk....", "...kkaaaaDDhlldDDDaaaak...", "..kaaADDDDAhlldAADDDDk....", ".kaADDDAAAAhlldAAAAADk....", ".kAhDDDAAAAAAAAAAAAkk.....", "kahhDDDAAAAAAAAAAAAk......", ".khhhhDDDDAAAAAAADDk..k...", ".khhhhhllDDDDDDDDDk..kakk.", "..khhhhllDllllllllk.klkkak", "...kkhhllllllllllk...kkak.", ".....kkkkDDDDDDDk......k..", ".........kkkkkkk.........."], "D": ["..........kaak............", "..........kiAk............", "..........kwWk............", "..........kwWk............", "..........kwWk............", "..........kwWk............", "..........kwWk............", "..........kwWk............", "..........kwWk....kkkkkkk.", "....kk....kwWk..kkGGGGGGGk", "...kRrk...kwWk.krRGrrRRRGk", "....kkrk..kwWkkrkkGrgRGRGk", "....kaiak.kwWkaiakGrggGRGk", "...kaAIAakkwWaAIAaGrrRRRGk", "...kAiIIAkkwWAiIIAGrrRRRGk", "...kJJJJJkawWJJJJJGrrRRRGk", "...kiiIJIaAwWiiIJIjGrRRGk.", "..kaiiIIIIIIIiiIIIjjGRGjk.", ".kaiiiiiiIIIIIIIIIjjjGjjak", "..kiiiiiiIIIIIIIIIjjjjjjk.", "...kkIiiiIIIIIIIIIjjIjkk..", "....kJkkkkIIIIIIIkkkJk...."]};
  const PAL = {"A": "#a8a296", "B": "#28282c", "C": "#1a1410", "D": "#34312d", "G": "#a08038", "I": "#55535c", "J": "#26252b", "N": "#7a5034", "P": "#9a8a6a", "R": "#7a2428", "W": "#4a3a2e", "a": "#d4cec2", "c": "#2e241c", "d": "#4e4a44", "g": "#d8b860", "h": "#8e887e", "i": "#7c7a84", "j": "#3a3940", "k": "#0b0a09", "l": "#6e6860", "n": "#b07a50", "p": "#c8b898", "r": "#a83a34", "w": "#6a5240"};
  const R = { A: 12, B: 17, C: 18, D: 16 }; // A는 대장간 상자 (가로 17칸) // 그림에 맞춘 판정 반경 (지금보다 작으면 키움)
  const KEYS = ['A', 'B', 'D']; // v3.19 깨진 분수 조각(C) 삭제 (사용자 결정)
  // 피난 짐 더미 · 무너진 우물 · 깨진 분수 조각 · 근위병 무구 더미 — 방마다 무작위로 섞임, 좌우 뒤집기도 무작위
  // v3.20 피난 짐 더미(A) → 대장간 상자로 교체 (사용자 결정): 대장간 그림의 여백을 잘라 한 번만 만듦
  let CRATE_CV = null;
  function crate() { if (CRATE_CV) return CRATE_CV; const s = forgeNewProp(19, 16), g0 = s.getContext('2d'), d = g0.getImageData(0, 0, s.width, s.height).data; let x0 = s.width, y0 = s.height, x1 = 0, y1 = 0;
    for (let y = 0; y < s.height; y++) for (let x = 0; x < s.width; x++) if (d[(y * s.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    x0 &= ~1; y0 &= ~1; const [c, g] = mkCanvas(((x1 - x0) | 1) + 1, ((y1 - y0) | 1) + 1); g.drawImage(s, -x0, -y0); return (CRATE_CV = c); }
  function junk(b) {
    const k = pick(KEYS), flip = Math.random() < 0.5; b.r = Math.max(b.r, R[k]); b.junk = k;
    const c = k === 'A' ? crate() : gCanvas(fromRows(ROWS[k]), PAL); if (!flip) return c;
    const [f, g] = mkCanvas(c.width, c.height); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return f;
  }
  // ---------------- v2.89 36 녹아내린 가로등 (돌기둥 대신) — 쇠 기둥이 그림 가운데 오게 캔버스를 넓혀 둠
  const ART = {"lamp0": ["..................", "..................", "..................", "..................", "........kkkk......", ".......kaaaak.....", "......kaIIIIak....", ".....kaAkIkIIak...", "....kaIkkIkkkIak..", "....kAk.kjk..kAk..", "....kiIk.k...kik..", "....kiIk....kkIkk.", "....kiIk...kjjjaak", "....kiIk..kiiijjAa", "....kiIk...kJsJsJk", "....kiIk...kJEeEJk", "....kiIk...kJeyeJk", "....kiIk...kJEeEJk", "....kiIk...kJsJsJk", "....kiIk....kjjjk.", "...kaijjk....kJk..", "...kiijjk.....k...", "....kiIk..........", "....kiIk..........", "....kiIk..........", "....kiIk..........", "....kiIk..........", "....kiIk..........", "....kiIk..........", "...kiijjk.........", "...kiijjk.........", "....kiIk..........", "....kiIk..........", "...kiijjk.........", "..kkiijjkk........", ".kaallllddk.......", ".kAhllllddk.......", ".khhllllddk.......", "kahllllldddk......", "kAhllllldddk......", "khhllllldddk......", ".kkkkkkkkkk......."], "lamp1": ["........................", "........................", "........................", "........................", "........................", "........................", "........................", "........................", "........................", "........................", "........................", ".....kk.................", "....kaak................", "....kIk.................", "....kiIk................", "....kiIk................", "....kiIk................", "....kiIk................", "....kiIk................", "....kiIk................", "...kaijak...............", "...kAijjk...............", "....kiIk................", "....kiIk................", "....kiIk................", "....kiIk................", "....kiIk................", "....kiIk................", "....kiIk................", "...kiijjk.......kkkkk...", "...kiijjk......kaaaaak..", "....kiIk......kaiiAAjak.", "....kiIk.......kJsJsJk..", "...kiijjk......kJsssJk..", "..kkiijjkk.....kJsssJk..", ".kaallllaak....kJsssJk..", ".khhllllAdk....kJsJsJk..", ".khhllllddk.....kjjjk...", "kahlllllddakkkkkkkJkkkk.", "kAhlllllddiaaaaiiiiiiiak", "khhlllllddIAAIAIIIIIkkk.", ".kkkkkkkkkkkkkkkkkkk...."], "royalBanner": ["...kk........", "..kOgk.......", ".kggGGk......", ".kggGGk......", "..kwWkkkkkkkk", "..kjjaaaaaaaa", "..kwWrrrRRRRR", "..kwWrrrRRRRR", "..kwWrrrRRRRR", "..kwWrrGRGRGR", "..kwWrrGGGGGR", "..kwWrrrRRRRR", "..kwWrrrRRRRR", "..kwWrrrRRkqR", "..kwWrrrRRRqR", "..kwWrrrRRRkq", "..kwWrrkqRRkk", "..kwWrrrRREk.", "..kwWqrrqRk..", "..kwWqqEqEk..", "..kwWkkkkk...", "..kwWk.......", "..kwWk.......", "..kwWk.......", "..kwWk.......", "..kwWk.......", "..kwWk.......", "..kwWk.......", "..kwWk.......", "..kwWk.......", "..kwWk.......", "..kwWk.......", "..kwWk.......", "..kwWk.......", "..kwWk.......", ".kkwWkk......", "kaallddk.....", "khhllddk.....", "khhllddk.....", ".kkkkkk......"], "crownBrazier": ["...............", ".......e.......", ".......k.......", "......kek......", "......kyEk.....", ".k..kkyOk.k..k.", "kgkkgkegekGkkGk", "kgggeEeEeEeGGGk", ".kiaiIIIIIjajk.", ".kgggGGrGGGgok.", ".kiiiIIIIIjjjk.", ".kiaiIIIIIjajk.", "..kJJJJJJJJJk..", "..kjkkkjkkkjk..", ".kjk..kjk..kjk.", ".kjk..kjk..kjk.", ".kGk..kGk..kGk.", "..k....k....k.."], "feastTable": ["............kpkpkkpk..............", ".............kkgGkk...............", "............kgkgGkGk..............", "......k..kkk.kggGGk........k......", ".....kjkknNNk.kgGk......kkkgk.....", ".kkkkiiiinNNkkGGGGkkkkkkgGGkRkkkk.", "kaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaak", "kAArAArAArAARAARAARAARAARAARAARAAk", "krrrrrrrrrRRRRRRRRRRRRRRRRRRRRRRRk", "krrrrrrrrrRRRRRRRRRRRRRRRRRRRRRRRk", "kRRRRRRRRRRRRRRRqqERRRRRRRRRRRRRRk", "kRRRRRRRRRRRRRRqkkkRRRRRRRRRRRRRRk", "kqqqqRqqqqRqqqqk..kqRqqqqRqqqqRqqk", ".kkwWqkkkkqkkkk....kqkkkkqkkkkwWk.", "..kwWk....k.........k....k...kwWk.", "..kwWk.......................kwWk.", "..kwWk.......................kwWk.", "...kk.........................kk.."], "feastChair": [".kgk....k...", ".kwakkkkGk..", ".kwrrRRRWk..", ".kwrGGGRWk..", ".kwrrRRRWk..", ".kwrrRRRWk..", ".kwrrRRRWk..", ".kwrrRRRWk..", ".kwrrRRRWk..", ".kwWkkkkWk..", ".kwWk..kWk..", ".kwWkkkkWk..", ".krrrrrrrrk.", ".kRRRRRRRRk.", ".kWWWWWWWWk.", ".kwkkkkkkWk.", ".kwk....kck.", ".kwk.....kkk", ".kwk.....kaa", "..k.......kk"], "dGold": ["..............", "....kkkkk.....", "..kkGGGGGkk...", ".kOygggggGGk..", "kGGgggggggGGkk", "kGGGgggggGGkGG", "GkkkGGGGGkk.kk"], "dCoins": ["....kk......", "...kgGk..kk.", ".kkkGok.kgGk", "kgGkkkkkkGok", "kGok.kgGkkgG", ".kk..kGokkGo"], "dSteps": ["....................", "....................", "....................", ".....d.......d......", ".....dd......dd.....", ".....dd......dd.....", ".d...dd..d...dd..d..", ".dd...D..dd...D..dd.", ".dd......dd......dd.", ".dd......dd......dd."], "dEdict": [".kkkkk......", "kpppppkkkk..", "kpppppPPPPk.", "kppNNNNNNPk.", "kpppppPPNPk.", ".kpNNNNNNk..", ".kppppPPCEk.", ".kppRpPPPCk.", ".kppppkCCk..", "..kkkk.kk..."], "dShards": [".......k......", "......kpk.....", ".....knnk.....", ".kkk.kNNk.....", "knnnk.kk.kkk..", "kNNNkk..knnnk.", ".kkknnk.kNNNk.", "...kNNk..kkk.."], "dCarpet": ["kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.kk.k....", "RRRRRRRRRRRRRRRRRRRRRRRRaRRRRRakqqkqk...", "GGGGGGGGGGGGGGGGGGGGGGGGGGaaGaaqqGaAak..", "rrrrrrrrrrrrrrrrrrrarAarrrrrrraarqGrGkkk", "rrrrrrrrrrrrrrrrrrrrrrrrrrrrrraArqArAkAA", "rrrrrrrrrrrrrrrrrrrrrrrararrAarArraArqAA", "rrrrGrrrrrGrrrrrGrrrrrGrraaAArArraqaaEEE", "rrrrGrrrrrGrrrrrGrrrraGrrrrrGarqrAraAaqA", "rrrrrrrrrrrrrrrrrrrrrrrrrrrrAarAraaaaaAa", "rrrrrrrrrrrrrrrrrrrrraArrrrrrArrarAAakAq", "rrrrrrrrrrrrrrrrrrrrrrrrrraraArGrrrGGkkk", "GGGGGGGGGGGGGGGGGGGGGGaGGGGGGGGqGGaAAk..", "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRkqqakk...", "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.kkk....."]};
  const APAL = {"A": "#a8a296", "C": "#1a1410", "D": "#34312d", "E": "#d0501c", "G": "#a08038", "I": "#55535c", "J": "#26252b", "N": "#7a5034", "O": "#f0dc98", "P": "#9a8a6a", "R": "#7a2428", "W": "#4a3a2e", "a": "#d4cec2", "c": "#2e241c", "d": "#4e4a44", "e": "#ff9a40", "g": "#d8b860", "h": "#8e887e", "i": "#7c7a84", "j": "#3a3940", "k": "#0b0a09", "l": "#6e6860", "n": "#b07a50", "o": "#6e5626", "p": "#c8b898", "q": "#4e181c", "r": "#a83a34", "s": "#5a6670", "w": "#6a5240", "y": "#ffe08a"};
  function lamp() {
    const v = Math.random() < 0.72 ? 'lamp0' : 'lamp1', c = gCanvas(fromRows(ART[v]), APAL), pole = 12, half = Math.max(pole, c.width - pole), flip = Math.random() < 0.5;
    const [o, g] = mkCanvas(half * 2, c.height); if (flip) { g.translate(half * 2, 0); g.scale(-1, 1); } g.drawImage(c, half - pole, 0); return o;
  }
  // ---------------- 39 · 40 · 41 서 있는 소품 (재빛으로 바꾸지 않고 제 색 그대로 — raw)
  const BPAL = Object.assign({}, APAL, { r: '#2e4e8e', R: '#203a6e', q: '#121a30' }); // v3.29 4장 왕실 천은 파란색 (문장 깃발과 같은 색)
  for (const k of ['royalBanner', 'crownBrazier', 'feastTable', 'feastChair']) PROP_MAPS[k] = [ART[k], k === 'crownBrazier' ? APAL : BPAL];
  Object.assign(PROPS, {
    royalBanner: { r: 6, foot: 1, raw: true },
    crownBrazier: { r: 9, foot: 1, raw: true, light: { r: 90, c: '255,150,60', ca: 0.2, dy: -16 } },
    feastTable: { w: 60, h: 10, foot: 1, raw: true }, feastChair: { r: 7, foot: 1, raw: true },
  });
  // ---------------- 43 바닥 자국 (성채 뼈 · 해골 · 촛불 · 깔개 · 융단 대신): 녹은 금 · 금화 · 재 발자국 · 포고문 · 항아리 조각 · 탄 행렬 융단
  function decor(g, R) {
    const W0 = A.x1 - A.x0, H0 = A.y1 - A.y0, area = W0 * H0 / 540000, D = k => fromRows(ART[k]);
    const spot = (pad, r) => { for (let i = 0; i < 30; i++) { const x = rand(A.x0 + pad, A.x1 - pad), y = rand(A.y0 + pad, A.y1 - pad); if (decFree(x, y, Math.max(r, 6))) return { x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2 }; } return null; };
    const put = (k, p) => { const m = D(k); gPaint(g, Math.random() < 0.5 ? m : m.map(r => r.slice().reverse()), APAL, p.x - m[0].length, p.y - m.length); };
    const big = ['hall', 'greathall', 'court', 'plaza'].includes(R.shape);
    // v3.29 탄 행렬 융단 · 떨어진 포고문 제거 · 바닥 자국 빈도 줄임 (다른 장에 비해 지저분해 보이던 문제)
    for (let i = 0; i < randi(0, 2) * area; i++) { const p = spot(30, 12); if (p) put('dGold', p); }
    for (let i = 0; i < randi(0, 2) * area; i++) { const p = spot(24, 10); if (p) put('dCoins', p); }
    for (let i = 0; i < randi(0, 2) * area; i++) { const p = spot(24, 10); if (p) put('dShards', p); }
    for (let i = 0; i < randi(0, 1) * area + 1; i++) { const p = spot(40, 18); if (p) put('dSteps', p); }
    for (let i = 0; i < 3 * area; i++) { const p = spot(10, 0); if (p) { g.fillStyle = pick(['#2a2731', '#3a3642', '#4d4858']); g.fillRect(p.x, p.y, 2 * randi(1, 3), 2 * randi(1, 2)); } } // 잔해 조각
  }
  { const o = ashCityFloor; ashCityFloor = function (g, R) { o(g, R); if (G.stage === 4 && R && R.type !== 'altar' && !(G.dun && G.dun.forge)) withDecor(g, R, () => decor(g, R)); }; } // 재를 덮은 뒤에 (제 색 그대로)
  return { junk, lamp, decor, ROWS, PAL, ART, APAL };
})();
;

// ==================================================================== 22_house4.js
'use strict';
// 잿빛 왕관 토벌대 — 22_house4.js (v2.88) : 4장 고유 벽 장애물 「불탄 집」 (시안 _작업자료/시안/4장_성벽_집_적용예시2.html)
// 위에서 본 기와 지붕(용마루 · 내려앉은 구멍 · 재) + 정면(목조 벽 · 6×7 창 · 7×11 문 · 돌 밑단). 폭 24칸 미만이면 05에서 성벽 덩어리로
const HOUSE4 = (() => {
  const PAL = { k: '#0b0a09', a: '#d4cec2', A: '#a8a296', h: '#8e887e', l: '#6e6860', d: '#4e4a44', D: '#34312d', w: '#6a5240', W: '#4a3a2e', c: '#2e241c', C: '#1a1410',
    i: '#7c7a84', I: '#55535c', j: '#3a3940', J: '#26252b', g: '#d8b860', G: '#a08038', o: '#6e5626', O: '#f0dc98', r: '#a83a34', R: '#7a2428', q: '#4e181c',
    e: '#ff9a40', E: '#d0501c', y: '#ffe08a', b: '#56545c', B: '#3c3b42', s: '#5a6670', p: '#c8b898', P: '#9a8a6a', n: '#b07a50', N: '#7a5034', t: '#8a745c', T: '#6a5846', u: '#4c4034', U: '#2c2620' };
  const hn = (x, y, s = 0) => { const v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.7) * 43758.5453; return v - Math.floor(v); };
  // 집 정면 (x0..x1, y0..y1 칸) — 위 목조 · 아래 돌 · 빈 창 · 문
  function facade(g, x0, x1, y0, y1, sd, door) {
    const stone = Math.max(3, Math.min(7, Math.round((y1 - y0) * 0.35)));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      let c; const t = x - x0;
      if (y > y1 - stone) { const r = y1 - y; c = r % 3 === 0 || (x + Math.floor(r / 3) * 3) % 6 === 0 ? 'D' : (t < 2 ? 'h' : 'l'); }
      else c = (t % 8 === 0 || y === y0 || y === y0 + Math.floor((y1 - stone - y0) / 2)) ? 'c' : (t % 8 < 2 ? 'w' : 'W');
      if (c === 'W' && hn(x, y, sd) < 0.08) c = 'c';
      g[y][x] = c;
    }
    // X 버팀
    for (let bx = x0; bx + 8 <= x1; bx += 16) for (let i = 1; i < 8; i++) { const y = y0 + 1 + Math.floor(i * (y1 - stone - y0 - 1) / 8); if (g[y] && g[y][bx + i] === 'W') g[y][bx + i] = 'c'; }
    // 창 (6×7: 나무 틀 · 검은 안 · 십자 창살 · 잉걸)
    const tim = y1 - stone - y0;
    const dcx = x0 + Math.floor((x1 - x0) / 2), hasDoor = door && x1 - x0 >= 22 && y1 - y0 >= 14, wxs = [];
    if (x1 - x0 >= 8) { wxs.push(x0 + 2); if (x1 - 8 > x0 + 10) wxs.push(x1 - 8); for (let wx = x0 + 15; wx + 7 < x1 - 10; wx += 13) wxs.push(wx); }
    if (tim >= 10) for (const wx of wxs) {
      if (hasDoor && wx + 6 >= dcx - 3 && wx <= dcx + 3) continue;
      const wy = y0 + 2;
      for (let y = wy; y < wy + 8; y++) for (let x = wx; x < wx + 7; x++) g[y][x] = (y === wy || y === wy + 7 || x === wx || x === wx + 6) ? 'c' : 'C';
      for (let y = wy + 1; y < wy + 7; y++) g[y][wx + 3] = 'J'; for (let x = wx + 1; x < wx + 6; x++) g[wy + 3][x] = 'J';
      g[wy + 8] && (g[wy + 8][wx] = 'w', g[wy + 8][wx + 6] = 'w'); for (let x = wx; x < wx + 7; x++) if (g[wy + 8]) g[wy + 8][x] = 'w'; // 창턱
      if (hn(wx, 1, sd) < 0.5) { g[wy + 5][wx + 1] = 'E'; g[wy + 6][wx + 2] = 'e'; g[wy + 5][wx + 5] = 'E'; }
      for (let y = wy - 1; y > y0 && y > wy - 3; y--) if (hn(wx, y, sd) < 0.6) g[y][wx + 2] = 'c'; // 창 위 그을음
    }
    // 문 (7×11: 아치 윗선 · 검은 안 · 한쪽 문짝이 비스듬히 열림)
    if (door && x1 - x0 >= 22 && y1 - y0 >= 14) { const dx = x0 + Math.floor((x1 - x0) / 2) - 3, dy = y1 - 10;
      for (let y = dy; y <= y1; y++) for (let x = dx; x < dx + 7; x++) { const arch = y === dy && (x === dx || x === dx + 6); if (arch) continue; g[y][x] = (x === dx || x === dx + 6 || y === dy) ? 'c' : 'C'; }
      for (let y = dy + 1; y <= y1; y++) g[y][dx + 1] = 'w'; g[dy + 5][dx + 1] = 'j'; // 열린 문짝
      g[dy + 6][dx + 5] = 'E'; }
  }
  // v3.19 나열 집 정면: 캐릭터 키(약 14칸)에 맞춘 문 10×16 · 창 8×9
  function facade2(g, x0, x1, y0, y1, sd) {
    const stone = Math.max(3, Math.min(6, Math.round((y1 - y0) * 0.3))), w = x1 - x0 + 1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { let c; const t = x - x0;
      if (y > y1 - stone) { const r = y1 - y; c = r % 3 === 0 || (x + Math.floor(r / 3) * 3) % 6 === 0 ? 'D' : (t < 2 ? 'h' : 'l'); }
      else c = (t === 0 || t === w - 1 || y === y0) ? 'c' : (t % 8 < 2 ? 'w' : 'W');
      if (c === 'W' && hn(x, y, sd) < 0.08) c = 'c'; g[y][x] = c; }
    const rows = y1 - y0 + 1, two = rows >= 28, DW = 10, DH = two ? Math.min(16, rows - 13) : Math.min(16, rows - 4), WW = 8, WH = 9, pos = pick(w >= 30 ? [0, 1, 2] : [0, 2]);
    const dx = pos === 0 ? x0 + 4 : pos === 2 ? x1 - 3 - DW : x0 + ((w - DW) >> 1), dy = y1 - DH + 1;
    if (two) for (let x = x0 + 1; x < x1; x++) { g[y0 + 12][x] = 'c'; if (g[y0 + 11][x] !== 'c' && x % 2) g[y0 + 11][x] = 'w'; } // 층 사이 들보
    // 문: 나무 문틀 · 위 인방 · 검은 안 · 비스듬히 열린 문짝 · 문턱 돌
    for (let y = dy; y <= y1; y++) for (let x = dx; x < dx + DW; x++) g[y][x] = (x === dx || x === dx + DW - 1 || y === dy) ? 'c' : 'C';
    for (let x = dx - 1; x <= dx + DW; x++) if (x > x0 && x < x1) g[dy - 1][x] = 'w';
    for (let y = dy + 1; y <= y1; y++) { g[y][dx + 1] = 'w'; g[y][dx + 2] = y % 4 === 0 ? 'c' : 'W'; if (y > dy + 2) g[y][dx + 3] = 'c'; }
    g[dy + (DH >> 1)][dx + 2] = 'j'; g[y1][dx + 4] = 'D'; g[y1][dx + 5] = 'l'; g[y1][dx + 6] = 'D'; g[y1][dx + 7] = 'D';
    if (hn(dx, 5, sd) < 0.6) { g[y1 - 3][dx + 7] = 'E'; g[y1 - 2][dx + 6] = 'e'; }
    // 창 (창틀 · 십자 창살 · 창턱 · 그을음): 2층은 폭 전체에 고르게, 1층은 문을 피해
    const spread = (a, b, out) => { const n = Math.min(3, Math.floor((b - a + 5) / (WW + 5))); if (n < 1) return; const gap = (b - a + 1 - n * WW) / (n + 1); for (let i = 0; i < n; i++) out.push(Math.round(a + gap * (i + 1) + WW * i)); };
    const win = (wx, wy, H) => { for (let y = wy; y < wy + H; y++) for (let x = wx; x < wx + WW; x++) g[y][x] = (y === wy || y === wy + H - 1 || x === wx || x === wx + WW - 1) ? 'c' : 'C';
      for (let y = wy + 1; y < wy + H - 1; y++) { g[y][wx + 3] = 'J'; g[y][wx + 4] = 'J'; } for (let x = wx + 1; x < wx + WW - 1; x++) g[wy + 4][x] = 'J';
      for (let x = wx - 1; x <= wx + WW; x++) if (x > x0 && x < x1) g[wy + H][x] = 'w';
      if (hn(wx, wy, sd) < 0.45) { g[wy + H - 3][wx + 1] = 'E'; g[wy + H - 2][wx + 2] = 'e'; g[wy + H - 3][wx + 6] = 'E'; }
      if (hn(wx, wy + 4, sd) < 0.6) { g[wy - 1][wx + 2] = 'c'; g[wy - 1][wx + 5] = 'c'; } };
    const up = [], lo = [];
    if (two) { spread(x0 + 2, x1 - 2, up); for (const wx of up) win(wx, y0 + 2, WH); spread(x0 + 2, dx - 3, lo); spread(dx + DW + 2, x1 - 2, lo); for (const wx of lo) win(wx, y0 + 14, 8); }
    else if (rows - stone >= WH + 3) { spread(x0 + 2, dx - 3, lo); spread(dx + DW + 2, x1 - 2, lo); for (const wx of lo) win(wx, y0 + 3, WH); }
  }
  // 장애물: 무너진 집 (위에서 본 지붕/벽 윗면 hc칸 + 정면 HH칸) — genWallBlock과 같은 배치 규칙
  function gen(wc, hc) {
    const HH = 24, W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0), sd = rand(0, 99);
    const roof = Math.min(wc, hc) >= 10, horiz = wc >= hc;
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) {
      let c;
      if (roof) { // 기와 지붕 (용마루 · 경사 · 위 경사는 밝게) + 불타 내려앉은 구멍
        const u = horiz ? y - 1 : x - 1, L = horiz ? hc : wc, v = horiz ? x : y, mid = Math.floor(L / 2);
        if (u === mid) c = 'j';
        else { const up = u < mid, row = Math.abs(u - mid) % 2; c = row === 0 ? (up ? 'i' : 'b') : (up ? 'b' : 'B'); if ((v + (Math.floor(Math.abs(u - mid) / 2) % 2) * 2) % 4 === 3) c = up ? 'J' : 'J'; }
      } else { // 얇은 벽 윗면: 무너진 벽돌 · 재
        c = (x + (y % 2) * 2) % 4 === 0 ? 'D' : (hn(x, y, sd) < 0.3 ? 'h' : 'l');
      }
      g[y][x] = c;
    }
    if (roof) { const nH = Math.max(1, Math.round(wc * hc / 700)); // 내려앉은 구멍: 검은 속 · 탄 서까래 · 잉걸
      for (let k = 0; k < nH; k++) { const cx = randi(4, wc - 4), cy = randi(3, hc - 3), rx = randi(3, 6), ry = randi(2, 4);
        for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) { if (y < 1 || y > hc || x < 1 || x > wc) continue; const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (hn(x, y, sd) - 0.5) * 0.5; if (q > 1) continue; g[y][x] = (x - cx + 20) % 4 === 0 ? 'c' : 'C'; }
        g[cy][cx] = 'E'; if (cx + 1 <= wc) g[cy][cx + 1] = 'e'; } }
    for (let x = 1; x <= wc; x++) { if (hn(x, 2, sd) < 0.55) g[1][x] = 'a'; else if (hn(x, 3, sd) < 0.5) g[1][x] = 'A'; } // 위에 쌓인 재
    for (let x = 1; x <= wc; x++) g[hc + 1][x] = 'C'; // 처마 그늘
    facade(g, 1, wc, hc + 2, hc + HH, sd, true);
    for (let x = 1; x <= wc; x++) if (hn(x, 9, sd) < 0.3) { g[1][x] = '.'; }
    return { g: gOutline(g), HH };
  }
  // v3.19 긴 벽: 한 채를 길게 늘이지 않고 모양이 다른 집 여러 채를 나란히 (지붕 모양 3가지 · 지붕 빛 3가지 · 벽 2가지 · 높이 3가지 · 굴뚝)
  function genRow(wc, hc) {
    const EXT = Math.max(0, 20 - hc), HHM = 32 + EXT, W0 = wc + 2, H0 = hc + HHM + 4, g = mkGrid(W0, H0), segs = []; // v3.29 지붕 기본 두께: 바닥 자리(hc)가 얕아도 지붕은 최소 20칸 — 모자란 만큼 뒤쪽(위)으로 더 그림 (판정은 그대로)
    // 구역을 묶는 보도블록 단 (집 사이 틈과 앞 턱에 보임): 윗면 포석 · 앞면 턱
    for (let y = HHM + 1; y <= hc + HHM + 2; y++) for (let x = 1; x <= wc; x++) { const r = y - HHM - 1; g[y][x] = y > hc + HHM ? (y === hc + HHM + 1 ? (x % 7 === 0 ? 'u' : 't') : (x % 7 === 0 ? 'U' : 'u')) : (r % 4 === 0 || (x + (Math.floor(r / 4) % 2) * 3) % 6 === 0) ? 'U' : (hn(x >> 1, Math.floor(r / 4), 7) < 0.22 ? 't' : hn(x, y, 3) < 0.1 ? 'A' : hn(Math.floor((x + (Math.floor(r / 4) % 2) * 3) / 6), Math.floor(r / 4), 5) < 0.3 ? 'u' : 'T'); }
    const props = []; // [틈 x0, x1, 종류]
    { let n = Math.max(1, Math.round((wc + 6) / (42 + 6))), gaps; for (;;) { gaps = []; for (let i = 0; i < n - 1; i++) gaps.push(n === 2 ? (Math.random() < 0.6 ? 11 : 4) : (i % 2 === 1 || (n === 3 && i === 0 && Math.random() < 0.5) ? 11 : 4)); if (n <= 1 || (wc - gaps.reduce((a, b) => a + b, 0)) / n >= 32) break; n--; }
      const tot = wc - gaps.reduce((a, b) => a + b, 0), ws = []; let left = tot; for (let i = 0; i < n; i++) { const w = i === n - 1 ? left : Math.max(32, Math.min(left - 32 * (n - 1 - i), Math.round(tot / n) + randi(-6, 6))); ws.push(w); left -= w; }
      let x = 1; ws.forEach((w, i) => { segs.push([x, x + w - 1]); x += w; if (i < n - 1) { if (gaps[i] > 4) props.push([x, x + gaps[i] - 1, pick(['lamp', 'lamp', 'barrel'])]); x += gaps[i]; } }); } // 집 사이 4칸(8px) · 가끔 11칸 틈에 가로등 / 통 / 죽은 나무
    const TILE = [['i', 'b', 'B', 'J', 'j'], ['h', 'l', 'd', 'D', 'D'], ['n', 'N', 'q', 'c', 'q']];
    let pH = -1, pS = -1, pT = -1;
    segs.forEach(([x0, x1], si) => { const sd = rand(0, 99), w = x1 - x0 + 1;
      let HH, style, tile; do { HH = pick([26, 29, 32]); } while (HH === pH && segs.length > 1); style = 1; do { tile = randi(0, 2); } while (tile === pT && segs.length > 1); pH = HH; pS = style; pT = tile;
      const d = HHM - HH, T = TILE[tile], ry0 = 1 + d - EXT, ry1 = hc + d, deep = hc + EXT >= 10, cx = (x0 + x1) >> 1, drop = deep ? Math.min(8, Math.round(w / 6)) : 0, top = x => ry0 + Math.floor(Math.abs(x - cx) * drop / Math.max(1, (w >> 1))); // 뒤쪽 끝은 ㅅ자
      for (let y = ry0; y <= ry1; y++) for (let x = x0; x <= x1; x++) { let c; if (y < top(x)) continue;
        if (!deep) c = (x + (y % 2) * 2) % 4 === 0 ? T[3] : (hn(x, y, sd) < 0.3 ? T[0] : T[1]);
        else if (style === 1) { const u = x - cx; c = u === 0 ? T[4] : (Math.abs(u) % 2 === 0 ? (u < 0 ? T[0] : T[1]) : (u < 0 ? T[1] : T[2])); if ((y + (Math.floor(Math.abs(u) / 2) % 2) * 2) % 4 === 3) c = T[3]; } // 앞뒤로 뻗은 용마루 (왼쪽 경사 밝음)
        else { const mid = ry0 + ((ry1 - ry0) >> 1), u = y - mid; c = u === 0 ? T[4] : (Math.abs(u) % 2 === 0 ? (u < 0 ? T[0] : T[1]) : (u < 0 ? T[1] : T[2])); if ((x + (Math.floor(Math.abs(u) / 2) % 2) * 2) % 4 === 3) c = T[3]; } // 가로 용마루
        g[y][x] = c; }
      if (deep) { const burnt = Math.random() < 0.35, nH = burnt ? 2 : (Math.random() < 0.5 ? 1 : 0); // 내려앉은 구멍 (불탄 집은 크게)
        for (let k = 0; k < nH; k++) { const hx = randi(x0 + 4, x1 - 4), hy = randi(ry0 + drop + 2, Math.max(ry0 + drop + 2, ry1 - drop - 3)), rx = burnt ? randi(5, 8) : randi(3, 5), ry = burnt ? randi(3, 5) : randi(2, 3);
          for (let y = hy - ry; y <= hy + ry; y++) for (let x = hx - rx; x <= hx + rx; x++) { if (y < top(x) + 1 || y > ry1 - drop + (top(x) - ry0) - 1 || x < x0 + 1 || x > x1 - 1) continue; const q = ((x - hx) / rx) ** 2 + ((y - hy) / ry) ** 2 + (hn(x, y, sd) - 0.5) * 0.5; if (q > 1) continue; g[y][x] = (x - hx + 20) % 4 === 0 ? 'c' : 'C'; }
          if (g[hy] && hx <= x1 - 2) { g[hy][hx] = 'E'; g[hy][hx + 1] = 'e'; } }
        if (Math.random() < 0.6 && w >= 20) { const kx = pick([x0 + 4, x1 - 7]), ky = top(kx + 1) + 2; for (let y = ky; y < ky + 6 && y <= ry1; y++) for (let x = kx; x < kx + 4; x++) g[y][x] = y === ky ? 'C' : y === ky + 1 ? 'a' : x === kx ? 'h' : x === kx + 3 ? 'D' : 'l'; } } // 굴뚝
      for (let x = x0; x <= x1; x++) { const ty = top(x); if (hn(x, 2, sd) < 0.55) g[ty][x] = 'a'; else if (hn(x, 3, sd) < 0.5) g[ty][x] = 'A'; if (!drop && hn(x, 9, sd) < 0.25) g[ty][x] = '.'; }
      if (!drop) for (let x = x0; x <= x1; x++) g[ry1 + 1][x] = 'C'; // 처마 그늘
      facade2(g, x0, x1, ry1 + 2, hc + HHM, sd);
      const plaster = Math.random() < 0.5, wl = plaster ? 'p' : 'w', wd = plaster ? 'P' : 'W';
      if (plaster) for (let y = ry1 + 2; y <= hc + HHM; y++) for (let x = x0; x <= x1; x++) { if (g[y][x] === 'W') g[y][x] = 'P'; else if (g[y][x] === 'w') g[y][x] = 'p'; } // 회벽 집
      if (drop) { // 앞 박공: 지붕 앞끝도 뒤끝과 같은 기울기의 ㅅ자 — 그 아래 삼각 벽이 정면 벽과 폭 · 재질이 이어짐
        const bot = x => ry1 - drop + (top(x) - ry0);
        for (let x = x0; x <= x1; x++) { const bt = bot(x); for (let y = bt + 1; y <= ry1 + 1; y++) g[y][x] = y === bt + 1 ? 'C' : (x === x0 || x === x1) ? 'c' : y === bt + 2 ? 'c' : x === cx ? 'c' : ((x - x0) % 8 < 2 ? wl : wd); }
        if (drop >= 5) { g[ry1 - drop + 4][cx - 1] = 'C'; g[ry1 - drop + 4][cx + 1] = 'C'; g[ry1 - drop + 5][cx - 1] = 'C'; g[ry1 - drop + 5][cx + 1] = 'C'; } }
    });
    const by = hc + HHM - 1, P = (x, y, c) => { if (g[y] && x >= 1 && x <= wc) g[y][x] = c; };
    for (const [a, b, kind] of props) { const mx = (a + b) >> 1;
      if (kind === 'lamp') { // 가로등: 돌 받침 · 쇠 기둥 · 가로대 · 등갓 안에 남은 불빛
        for (let x = mx - 2; x <= mx + 2; x++) { P(x, by, x === mx + 2 ? 'D' : 'l'); P(x, by - 1, x === mx - 2 ? 'a' : 'h'); } for (let y = by - 19; y <= by - 2; y++) { P(mx - 1, y, 'I'); P(mx, y, y % 6 === 0 ? 'J' : 'j'); } P(mx - 2, by - 12, 'j'); P(mx + 1, by - 12, 'j');
        for (let x = mx - 3; x <= mx + 2; x++) P(x, by - 20, 'J'); P(mx - 2, by - 21, 'j'); P(mx - 1, by - 21, 'I'); P(mx, by - 21, 'j'); P(mx - 1, by - 22, 'J');
        for (let y = by - 19; y <= by - 15; y++) for (let x = mx - 3; x <= mx + 2; x++) P(x, y, x === mx - 3 || x === mx + 2 || y === by - 15 ? 'J' : y === by - 19 ? 'O' : (x + y) % 2 ? 'y' : 'e'); P(mx - 1, by - 16, 'E'); P(mx, by - 16, 'E'); }
      else if (kind === 'barrel') { // 통 + 상자
        for (let y = by - 7; y <= by; y++) for (let x = a + 1; x <= a + 5; x++) P(x, y, y === by - 7 ? 'c' : y === by - 5 || y === by - 1 ? 'j' : x === a + 1 ? 'n' : x === a + 5 ? 'c' : 'N'); P(a + 2, by - 7, 'a'); P(a + 3, by - 7, 'A');
        for (let y = by - 4; y <= by; y++) for (let x = b - 5; x <= b - 1; x++) P(x, y, y === by - 4 ? 'w' : x === b - 5 || x === b - 1 || x - (b - 5) === y - (by - 4) ? 'c' : 'W'); }
      else { // 타 죽은 나무
        for (let y = by - 16; y <= by; y++) { P(mx - 1, y, 'c'); P(mx, y, y % 5 === 0 ? 'C' : 'W'); } P(mx + 1, by, 'c'); P(mx - 2, by, 'c');
        for (let i = 1; i <= 4; i++) { P(mx + i, by - 9 - i, 'c'); P(mx - 1 - i, by - 12 - i, 'c'); } P(mx + 5, by - 14, 'C'); P(mx + 4, by - 15, 'c'); P(mx - 6, by - 17, 'c'); P(mx - 3, by - 16, 'C'); P(mx, by - 17, 'c'); P(mx + 1, by - 18, 'c'); P(mx - 1, by - 11, 'E'); P(mx + 2, by - 10, 'a'); }
    }
    return { g: gOutline(g), HH: HHM };
  }
  return { gen, genRow, pal: PAL };
})();
;

// ==================================================================== 23_sr4.js
'use strict';
// 잿빛 왕관 토벌대 — 23_sr4.js (v2.90) : 4장 특별방 시설 · 문 (시안 _작업자료/시안/4장_특별방_문_시안.html 46~50)
// 상점 노점 · 판매대 · 휘장 걸이 · 짐 더미 · 가로등 · 벽 휘장 / 피난민 천막 · 보따리 · 가구 장작 · 기둥 토막 / 근위기사 석상 · 왕관 테 화로 · 왕실 보물 · 금화와 잔 / 왕실 제단 / 북문 아치 · 옆문 · 녹아 늘어진 창살
const SR4 = (() => {
  const ROWS = {"stall": ["......................................................................", "......................................................................", "......................................................................", "......................................................................", "......................................................................", "kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaak", "pppprrrrApppAArAApAAArrrAppprAAAppAArArAAAPPRARAAPPPRRARAPAAAARRPPPPAk", "pppprrrrpppprrrrpppprrrrpppprrrrpppprrrRPPPPRRRRPPPPRRRRPPPPRRRRPPPPRk", "pppprrrrpppprrrrpppprrrrpppprrrrpppprrrRPPPPRRRRPPPPRRRRPPPPRRRRPPPPRk", "ppppErrrpppprrrrpppErrrqpppprrrrpppprrrRPPPPRRRRPPPERRRREPPPRRRRPPPPRk", "qqppcrrrpppqrrrrppEkrrrkpppqrrrqpppprrrRPPPPRRRRPPqkRRRRkPPPRqRRPPqPRk", "kkpqcrrEEppkqqrqEpkkqrrkEpEkqrrkqppqqrrqqPPqERRqEEkkqRREkPPEEkRqEqcqqk", ".kEWcqEkkEEkjkEkkEkkkEEkkqkkkEEkkEqkkEEkkEEkkEEkjjjjjjjjjEqkkkqkwWckk.", ".kwWcwwwWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWkwWck..", ".kwWcwwwWQcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWkwWck..", ".kwWcwwwWScWWWWWcWWWWWcWWWWWcWWWWWcWWWWWyWWWWWcWWWWWcWWSWWcWWWWkwWck..", ".kwWcwwwW4cWWWWWcWWWWWcWWWWWcWWWWWcWWWWWeWWWWWcWWWWWcWWLWWcWWWWkwWck..", ".kwWcwww234WWWWWcWWWWMMMWWWWcWWWWWcWWWyWKWWWWWcWWWWWcW666WcWWWWkwWck..", ".kwWcwww134WWWWWcWWWLLLLLWWWcWWWWWcWWWeWKWyWWWcWWWWWcW666WcWWWWkwWck..", ".kwWcwww234WWWWWcWWWQ1SSTWWWcWWWWWcWWWKWKWeWWWcWWWWWc51667cWWWWkwWck..", ".kwWcwww234WWWWWcWWWQSSSTWWWcWWWWWcWWWKWKWKWWWcWWWWWc56667cWWWWkwWck..", ".kwWcwww234WWWWWcWWWQSSSTWWWcWWWWWcWWWKWKWKWWWcWWWWWc56667cWWWWkwWck..", ".kwWcwww244UUUUUUUUUQTTTTUUUUUUUUUUUUGGGGGGGUUUUUUUUUU777UUUUUUkwWck..", ".kwWcwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwWkwWck..", ".kwWccccccccccccccccccccccccccccccccccccccccccccccccccccccccccWkwWck..", ".kwWcwwwWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWkwWck..", ".kwWcwwwWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWkwWck..", ".kwWcwwwWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWkwWck..", ".kwWcwwwWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWKLLMWWWWWcWWWWkwWck..", ".kwWcwwwWWOOOOOOOOWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWKKLLMMWWWWcWWWWkwWck..", ".kwWcwwwWWggggggggWWWWcWWWWWcWgWggcgWWWWcWWWWWcWKK1LMMWWWWcWWWWkwWck..", ".kwWcwwwWWoQQOgQQoWWWWcWWWWWcWOOOOOOWWWWcWWWWWcWKKLLMMWWWWcWWWWkwWck..", ".kwWcwwwWWoSSGSSSoWWWWcWWWWWcWgg35ggWWWWcWWWWWcWKKLLMMWWWWcWWWWkwWck..", ".kwWcwwwWWooooooooUUUUUUUUUUUUGGGGGGUUUUUUUUUUUUUKLLMUUUUUUUUUUkwWck..", ".kwWcwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwWkwWck..", ".kwWccccccccccccccccccccccccccccccccccccccccccccccccccccccccccWkwWck..", ".kwWcwwwWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWkwWck..", ".kwWcwwwWWcWWWWWcWWWWWcWWWWWc67WWWcWWWWWcWWWWWcWWWWWcWWWWWcWWWWkwWck..", ".kwWcwwwWWcWWWWWcWWWWWcWWWW34g790WcWWWWWcWWWWWcWWWWMMMWWWWcWWWWkwWck..", ".kwWcww8180B1BHWcWWWWWcWWWWg467g0WcWWWWWcWWWWWcWWWLLLLLWWWcWWWWkwWck..", ".kwWcww8990BFFHWcWWWWWcWWWW346790WcWWWWWcWWWWWcWWWK1LLMWWWcWWWWkwWck..", ".kwWcww8880BBBHWcWWWWWcWWWW346790WcWWWWWcWWWWWcWWWKLLLMWWWcWWWWkwWck..", ".kwWcww8990BFFHWcWWWWWcWWWW346790WcWWWWWcWWWWWcWWWKLLLMWWWcWWWWkwWck..", ".kwWcww8880BBBHUUUUUUUUUUUU346790UUUUUUUUUUUUUUUUUKMMMMUUUUUUUUkwWck..", ".kwWAkAkAAkAkkkAAAAkAAkkAkAkAkAAkAkkkAAkAkkAkkkkAkAAkkAAAkkAkkAkwWck..", ".kwWckk.kk.k...kkkk.kk..k.k.k.kk.k...kk.k..k....k.kk..kkk..k..kkwWck..", "..kkk...........................................................kkk...", "......................................................................", "......................................................................"], "counter": ["..............................kkk.....................", "......kk....kk...............kggGk......kk....kk......", ".kkkkkgGkkkkgGkkkkkkkkkkkkkkkkggGkkkkkkkgGkkkkgGkkkkk.", "kwaaawwaaaaawawaaawwwwawwawawaaaaaaawwaawwwaawwaawwaak", "kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk", "kcWWrrrrrrrrrrrrrrrrRRREREEERERRRRRRRRRRRRRRRRRRRRWWWk", "kcWWrrrrrrrrrrrrrrrrRRRWEWWWEWRRRRRRRRRRRRRRRRRRRRWWWk", "kcWWrrrrrrrrrrrrrrrrRRRWWWWWcWRRRRRRRRRRRRRRRRRRRRWWWk", "kcWWrrrrrrrrrrrrrrrrRqEWWWWWcWEqRqqqRqqqRqqqRqqqRqWWWk", "kcWWrWWWrWcWrWWWrWWcqWWWWWWWcWWWqWWWqcWWqWWWqWcWqWWWWk", "kcWWWWWWWWcWWWWWWWWcWWWWWWWWcWWWWWWWWcWWWWWWWWcWWWWWWk", ".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk."], "banner": ["gkkkkkkkkkkkkkkG", "jjjjjjjjjjjjjjjj", "JJJJJJJJJJJJJJJJ", "kkGrrrrrRRRRRGkk", ".kGrrrrrRRRRRGk.", ".kGrrrrrRRRRRGk.", ".kGrrrrrRRRRRGk.", ".kGrrrrrRRRRRGk.", ".kGrrrrrgRRRRGk.", ".kGrrgrrRRRgRGk.", ".kGrrgggggggRGk.", ".kGrrgrrRRRgRGk.", ".kGrrrrrRRRRRGk.", ".kGrrrrrRRRRRGk.", ".kGrrrrrRRRRRGk.", ".kGrrrrrkRRRRGk.", ".kGrrrrrRkRRRGk.", ".kGrrrrrRRRRRGk.", ".kGrrrrrRRRRRGk.", ".kGrrrrrRRRRRGk.", ".kGrrrrrRRRRRGk.", ".kGrrrrrRRRqRGk.", ".kGrrrkrRRRkqGk.", ".kGrrrrrRRRkkGk.", ".kGrrrrrRRRkkGk.", ".kGrrrrrRREkkGk.", ".kGrqrrrRRk.kqk.", ".kGrqrrrRRk.kEk.", ".kGrkrrrRRk..k..", ".kGrkqrrqRk.....", ".kGrkqqEqEk.....", ".kGqkkkkkk......", ".kEqk...........", "..kk............", "................", "................", "................", "................", "................", "................"], "log": ["..................................", "...kkkkkkkkkkkkkkkkkkkkkkkkkkkkk..", "..kdaaaaaaaaaaaaaaaaaaaaaaaaahddk.", ".kdddhlhhhhlhhhhlhhhhlhhhhlhhhlldk", ".kdddhlhhhhlhhhhlhhhhlhhhhlhhhlllk", ".kdddlDllllDllllDllllDllllDlhhDllk", ".kdddlDllllDllllDllllDllllDllllDlk", ".kdddlDllllDllllDllllDllllDllllllk", ".kddddDddddDddddDddddDddddDddllldk", "..kdddddddddddddddddddddddddddddk.", "...kkkkkkkkkkkkkkkkkkkkkkkkkkkkk..", ".................................."], "statue": ["......................", "......................", "......................", "......................", "...........k..........", "..........kRk.........", ".........krkk.........", "........krrRRk........", "........krrRRk........", "........kkkkkk........", ".......kaaaaaak.......", "......kalAAlldak......", ".....kahlllllddak.....", "....kaAhllllldddak....", "....kAhhllllldddAk....", "....khDDDDDDDDDDdk....", "....khhhllDDlddddk....", "....khhhlllllddddk....", ".....khhllllldddk.....", ".kkkkkkhlllllddk......", "kGGGGGGkllllldk..k....", "krrrRRRkkkkkkkkkkgkk..", "krrrRRRhAllllAdGGGGGk.", "krGrRGRhAllllAddkikk..", "krGGGGRhAlllldddkik...", "krrrRRRhllllldddkik...", "krrrRRRDDDDDDDDDkik...", "krrrRRRhllllldddkik...", "krrrRRRhllllldddkik...", ".kkkkkhhllllldddkik...", ".....khhllllldddkik...", "...kkkhhllllldddkikk..", "..kaahhhhhhhhhhhhiaak.", ".kahhhlllllllllddIddk.", ".kAhhhlllllllllddIddk.", ".khhhhlllllllllddIddk.", ".khhhhllllllllldddddk.", ".khhhhllllllllldddddk.", ".khhhhllllllllldddddk.", "..kkkkkkkkkkkkkkkkkk.."], "brazier": ["................", "................", ".......k........", ".k..k.kOk.k..k..", "kgkkgkkgkkGkkGk.", "kggggggGGGGGGGGk", ".kiiiIIIIIjjjjk.", ".kiiiIIIIIjjjjk.", ".kiiiIIIIIjjjjk.", ".kiiiIIIIIjjjjk.", "..kkkkiijjkkkk..", ".....kiijjk.....", ".....kiijjk.....", ".....kiijjk.....", ".....kiijjk.....", ".....kiijjk.....", ".....kiijjk.....", ".....kiijjk.....", "....kkiijjkk....", "...khhhdddddk...", "...khhhdddddk...", "....kkkkkkkk...."], "gold": ["......................................", "......................................", "......................................", "......................................", "......................................", "......................................", "......................................", "......................................", "................k........kkkk.........", "............k..kOk..k...kOgGAk........", "...........kOk.kgk.kgk..kggGGk........", "...........kgk.kgk.kGk..kggGGk........", "...........kgkkkgkkkGk...kGok.........", "...........kgArggGsAGk...kGkk.........", "...........kGGGGGooookkkkGGGGk........", ".........kkkOGOGOGOGgGgGgGgkkk........", ".......kkGoAoGoGoGoGoGoGoGoGoGkk......", ".....kkrAGOGOGOGOGOGgGgGgGgGGGAAkk....", "....kGAGoGoGoGoGoGoGoGoGoGoGoGosoGk...", "...kAGOGOGOGOGOGOGOGgGgGgGgGGGGGGGGk..", "..kAoGoGoGoGoGoGoGoGoGrGoGoGoGoGoGoGk.", "..kGOGOGOGOGOGOGOGOGgGgGgGgGGGGGGGGGk.", "..kGoGoGoGoGoGoGoGoGoGoGoGoGoGoGoGoGk.", ".kOGGGOGOGOGOGOGOGOGgGgGgGgGGGGGGGGGGk", "..kkokkkkkkkkkkkkkkkkkkkkkkkkkkkkGkkk.", "....k...........................kok..."], "coins": ["........................", "........................", "........................", "........................", "........................", "........................", "........................", ".........k..............", ".....kkkkGkkkk..........", "...kkGOGOGgGgGkkkkkkk...", "..kGoGoGoGoGoGogggggGk..", "..kGOGOGOGgGgGGGGGGGok..", ".koGoGoGoGoGoGoGokkkk.kk", ".kOGOGOGOGgGgGGGGk.kkkgG", "kgGkkkkkkkkkkkkkk.kgGkkk", ".kk................kk..."], "altar": [".....kpPk.................................kpPk....", ".....kpPk.................................kpPk....", ".....kpPk.................................kpPk....", "....kkpPkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkpPk....", ".kkkGrGGrrrrrrrrrrrrrrrrrRRRRRRRRRRRRRRRRRRGGRkkk.", "khhhrrrrrrrrrrrrrrrrrrrrrRRRRRRRRRRRRRRRRRRRRRhhhk", "klllrrrrrrrrrrrrrrrrrrrrrRRRRRRRRRRRRRRRRRRRRRlllk", "klllrrrrrrrrrrrrrrrrrrrrrRRRRRRRRRRRRRRRRRRRRRlllk", ".kllEEqrqEqrrrrrqrqqqErqqqERqqqqRERRRRqqEqRqqEDDk.", ".kGGGGGqGGGrrrrrGqGGGGqGGGGqGGGGqGRRRRGGGGEGGGGGk.", ".klDllGldddErEEqdddddddddDdGddddddqEqRddDDDDGDDDk.", ".klDllGlddddqdoddddddddddDdGddddddddGEddDDDDoDDDk.", ".klDllGlddddddDddddddddddDdGddddddddodddDDDDDDDDk.", ".klDllolddddddDddddddddddGdGddddddddDdddDDDDDDDDk.", ".klDllllddddddDddddddGdddDdodGddddddDdddDDDDDDDDk.", ".klDllllddddddDddddddGGGGGGGGGddddddDdddDDDDDDDDk.", ".klDllllddddddDddddddddddDddddddddddDdddDDDDDDDDk.", ".klDllllddddddDddddddddddDddddddddddDdddDDDDDDDDk.", ".klDllllddddddDddddddddddDddddddddddDdddDDDDDDDDk.", ".klDllllddddddDddddddddddDddddddddddDdddDDDDDDDDk.", ".kGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGk.", ".klAAllAddAdAAdAddAddAAAdAdddAdAAdddAAdAAAADDDADk.", "..kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk..", ".................................................."], "arch": ["........kkaaggGaakk........", "......kkaalgggGGlaakk......", ".....kaalllGlOlGlAlaak.....", "....kallllllrlRllDlllak....", "...kallllcDlGllGlcllllak...", "..kaAlllcllCGCCGDlcllldak..", "..khhllllCCCoCCGCCllllddk..", ".kahhllcCCCCCCCoCCCcllddak.", ".khhhllCCCCCCCCCCCCClldddk.", "kahhhllCCCCCCCCCCCCClldddak", "kAhhhlCCCCCCCCCCCCCCClddddk", "khhhhlCCCCCCCCCCCCCCClddddk", "kDDDDDCCCCCCCCCCCCCCCDDDDDk", "khhhhlCCCCCCCCCCCCCCClddddk", "khhhhlCCCCCCCCCCCCCCClddddk", "khhhhlCCCCCCCCCCCCCCClddddk", "kDDDDDCCCCCCCCCCCCCCCDDDDDk", "khhhhlCCCCCCCCCCCCCCClddddk", "khhhhlCCCCCCCCCCCCCCClddddk", "khhhhlCCCCCCCCCCCCCCClddddk", "kDDDDDCCCCCCCCCCCCCCCDDDDDk", "khhhhlCCCCCCCCCCCCCCClddddk", "khhhhlCCCCCCCCCCCCCCClddddk", "khhhhlCCCCCCCCCCCCCCClddddk", "kDDDDDCCCCCCCCCCCCCCCDDDDDk", "khhhhlCCCCCCCCCCCCCCClddddk", "khhhhlCCCCCCCCCCCCCCClddddk", "khhhhlCCCCCCCCCCCCCCClddddk", "kDDDDDCCCCCCCCCCCCCCCDDDDDk", "khhhhlCCCCCCCCCCCCCCClddddk", "khhhhlccccccccccccccclddddk", "khhhhlccccccccccccccclddddk", "kDDDDDcccccccccccccccDDDDDk", "khhahlcccccccccccccccldaddk", "khaAalccccccccccccccclaAadk", "kaAAAacccccccccccccccaAAAak", ".kkkkkkkkkkkkkkkkkkkkkkkkk."], "side": ["hhhhhhhhhhhhhhhhhhgGGhhhhhhhhhhhhhhhhhhh", "DlllllllDlllllllDglOlGllDlllllddDddddddd", "lllllllllllllllllllllllllllllldddddddddd", "lllllllllllllllllllllllllllllldddddddddd", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWWWWWWWWWC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCjjjjjjjjjC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCcccccccccC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCcccccccccC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWWWWWWWWWC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCjjjjjjjjjC", "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCcccccccccC", "cccccccccccccccccccccccccccccccccccccccc", "AcAccccAcAAccAAAccAAAccAAAcAcccccAcccAcc", "llllllllllllllllllllllllllllllllllllllll", "DdddddddDdddddddDdddddddDdddddddDddddddd", "dddddddddddddddddddddddddddddddddddddddd", "dddddddddddddddddddddddddddddddddddddddd"], "bars": ["iiiiiiiiiiiiiiiiiii", "jjjjjjjjjjjjjjjjjjj", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkEIkiIk", "jjjjjjjjjjjjjjjjjjj", "kiIkkiIiIiIkkiIkkiI", "kiIkEiIiIiIkkiIkkiI", "kiIkkiIiIiIkkiIkkiI", "kiIk.kiiiIk.kiIk.ki", "kiIk.kiiiIk.kiIk.ki", "kiIk.kiiiIk.kiIk.ki", "kiIkkiIiIiIkkiIkkiI", "kiIkkiIiIiEkkiIkkiI", "jjjjjjjjjjjjjjjjjjj", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkiIkiIk", "kiIkiIkiIkiIkiIkiIk", "kJkkJkkJkkJkkJkkJk.", ".k..k..k..k..k..k.."]};
  const PAL = {"A": "#a8a296", "C": "#1a1410", "D": "#34312d", "E": "#d0501c", "G": "#a08038", "I": "#55535c", "J": "#26252b", "N": "#7a5034", "O": "#f0dc98", "P": "#9a8a6a", "R": "#7a2428", "W": "#4a3a2e", "a": "#d4cec2", "c": "#2e241c", "d": "#4e4a44", "e": "#ff9a40", "g": "#d8b860", "h": "#8e887e", "i": "#7c7a84", "j": "#3a3940", "k": "#0b0a09", "l": "#6e6860", "n": "#b07a50", "o": "#6e5626", "p": "#c8b898", "q": "#4e181c", "r": "#a83a34", "s": "#5a6670", "w": "#6a5240", "y": "#ffe08a", "1": "#fffaf0", "2": "#a8645a", "3": "#7e443c", "4": "#4e2826", "5": "#8ea0ac", "6": "#62747e", "7": "#3c4850", "8": "#8e9a72", "9": "#64704e", "0": "#3e4632", "B": "#9a8aa4", "F": "#6e6078", "H": "#463c4e", "K": "#e8e0cc", "L": "#c8bca0", "M": "#8e8470", "Q": "#c8a070", "S": "#9a7048", "T": "#6a4a2c", "U": "#3a2a20", "V": "#2a2018"};

  const BPAL = Object.assign({}, PAL, { r: '#2e4e8e', R: '#203a6e', q: '#121a30' }); // v3.29 특수방 깃발도 파란색
  const C = {}; const cv = k => C[k] || (C[k] = (k === 'gold' || k === 'coins') ? srArt(k, 2, SR[k]) : gCanvas(fromRows(ROWS[k]), k === 'banner' ? BPAL : PAL)); // v3.29 금 더미 · 금화는 4장 전용 그림을 버리고 다른 장 보물방 그림을 제 색 그대로 씀
  const flip = c => { const [f, g] = mkCanvas(c.width, c.height); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return f; };
  const NEW = ['stall', 'counter', 'banner', 'log', 'gold', 'coins', 'altar']; // v3.29 화로 · 갑옷 석상은 4장 전용 그림을 버리고 2장 그림을 제 색 그대로 (아래 drawSR)
  const on = k => G && G.stage === 4 && !(G.dun && G.dun.forge) && NEW.includes(k);
  const oDraw = drawSR, oRect = srRect;
  drawSR = function (s) {
    if (G && G.stage === 4 && (s.k === 'brazier' || s.k === 'statue')) { G.stage = 2; try { return oDraw(s); } finally { G.stage = 4; } } // 2장 그림 · 재빛으로 바꾸지 않음
    if (!on(s.k)) return oDraw(s);
    let c = cv(s.k);
    const x = (s.x - c.width / 2) & ~1, y = (s.y + (s.foot || 0) - c.height + 2) & ~1;
    if (s.k !== 'banner') dshRect(ctx, x + 4, s.y + (s.foot || 0), Math.max(0, Math.ceil((c.width - 8) / 2) * 2), 2, 0.5);
    ctx.drawImage(s.flip ? flip(c) : c, x, y);
    if (s.k === 'brazier') { const fl = Math.floor(time * 10 + s.x * 0.37), ph = ((fl % 4) + 4) % 4; let fc = SR_FLAME[ph]; if (!fc) fc = SR_FLAME[ph] = gCanvas(fromRows(FLAME2[ph]), { r: '#c83018', F: '#ff6a2a', f: '#ffb040', y: '#fff3c0' }); ctx.drawImage(fc, x + 4, y - 18); }
  };
  srRect = function (s) { if (!on(s.k)) return oRect(s); const c = cv(s.k), x = s.x - c.width / 2, yb = s.y + (s.foot || 0) + 2; return { x0: x, y0: yb - c.height, x1: x + c.width, y1: yb }; };
  // 문: 재를 덮은 뒤 그 위에 (제 색 그대로)
  function doors(g, R) {
    for (const d in R.doors) { if (R.doors[d] == null || hiddenDoor(R, d) || (R.sealW && R.sealW.dir === d)) continue; const p = DOOR[d];
      if (d === 'n') { g.drawImage(cv('arch'), p.x - 27, p.y - 72); archStairs(g, p.x - 27, p.y - 72); }
      else if (d === 'w' || d === 'e') g.drawImage(d === 'w' ? flip(cv('side')) : cv('side'), d === 'w' ? p.x - 80 : p.x, p.y - 28); }
  }
  // v3.29 북문 아치 안쪽: 위로 올라가는 계단이 어둠 속으로 이어짐 (성채 아치에 있던 연출) — 아래 단일수록 밝고 크게, 위로 갈수록 어둡게
  function archStairs(g, ax, ay) { const rows = ROWS.arch, open = []; rows.forEach((r, y) => { let a = -1, b = -1; for (let x = 0; x < r.length; x++) if (r[x] === 'C' || r[x] === 'c') { if (a < 0) a = x; b = x; } if (a >= 0 && y > 4) open.push([y, a, b]); });
    if (!open.length) return; const y1 = open[open.length - 1][0], y0 = Math.max(open[0][0], y1 - 17), P = (x, y, c) => { g.fillStyle = c; g.fillRect(ax + x * 2, ay + y * 2, 2, 2); };
    const ST = [['#7e786e', '#4e4a44'], ['#625d56', '#3a3734'], ['#4c4842', '#2c2a28'], ['#383532', '#211f1d'], ['#2a2826', '#181715']]; // 단마다 [디딤판 윗날, 챌판]
    // 단 높이는 위로 갈수록 낮게(원근: 5 · 4 · 3 · 3 · 2칸) — 디딤판 줄이 아치 테 돌 줄눈(4칸마다)과 겹치지 않게
    const TR = []; { let y = y1 - 1; for (const h of [5, 4, 3, 3, 2]) { TR.push(y); y -= h; } } const top = TR[TR.length - 1] - 1;
    for (const [y, a, b] of open) { if (y < top) continue; const k = TR.filter(t => t > y).length, [tr, rs] = ST[Math.min(ST.length - 1, k)]; // k: 아래에서 몇 번째 단인지
      for (let x = a; x <= b; x++) P(x, y, TR.includes(y) ? tr : x === a || x === b ? '#141312' : rs); } }
  { const o = ashCityFloor; ashCityFloor = function (g, R) { o(g, R); if (G.stage === 4 && R && R.type !== 'altar' && R.type !== 'boss') doors(g, R); }; }
  // v3.19 북문 쇠창살: 아치 문틀 뒤 홈을 타고 위에서 내려옴 — 아치 안쪽(어두운 칸)에만 보이고 돌 문틀은 가리지 않음. 아래 창끝부터 내려오고, 열릴 땐 위로 올라가 아치 속으로 사라짐
  let GATE = null;
  function gateInit() { const rows = ROWS.arch, open = []; let c0 = 99, c1 = -1, r0 = 99, r1 = -1;
    rows.forEach((r, y) => { let a = -1, b = -1; for (let x = 0; x < r.length; x++) if (r[x] === 'C' || r[x] === 'c' || ((r[x] === 'o' || r[x] === 'G') && y > 4 && x > 6 && x < 20)) { if (a < 0) a = x; b = x; } if (a >= 0) { open.push([y, a, b]); c0 = Math.min(c0, a); c1 = Math.max(c1, b); r0 = Math.min(r0, y); r1 = Math.max(r1, y); } });
    const W = c1 - c0 + 1, H = r1 - r0 + 1, [pc, g] = mkCanvas(W * 2, H * 2), path = new Path2D(); for (const [y, a, b] of open) path.rect(a * 2, y * 2, (b - a + 1) * 2, 2);
    const P = { i: '#8a8894', I: '#55535c', J: '#2e2d34', g: '#c8a850', G: '#8a6a30', o: '#5a4620', E: '#d0501c', e: '#ff9a40' }, px = (x, y, c) => { g.fillStyle = P[c]; g.fillRect(x * 2, y * 2, 2, 2); }, mid = W >> 1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const m = (x - mid + 30) % 3, band = y === 5 || y === H - 9 || y === Math.round(H * 0.48);
      if (y >= H - 2) { if (m === 0) px(x, y, y === H - 1 ? 'J' : 'I'); continue; } // 아래 창끝
      if (band) px(x, y, m === 0 ? 'i' : 'I'); else if (band === false && (y === 6 || y === H - 8 || y === Math.round(H * 0.48) + 1)) px(x, y, 'J'); else if (m === 0) px(x, y, 'i'); else if (m === 1) px(x, y, 'J'); }
    { const cy = Math.round(H * 0.48) - 7; for (const [dx, dy, c] of [[-2, 0, 'g'], [0, 0, 'g'], [2, 0, 'g'], [-2, 1, 'g'], [-1, 1, 'G'], [0, 1, 'g'], [1, 1, 'G'], [2, 1, 'g'], [-2, 2, 'G'], [-1, 2, 'g'], [0, 2, 'e'], [1, 2, 'g'], [2, 2, 'o'], [-2, 3, 'o'], [-1, 3, 'G'], [0, 3, 'G'], [1, 3, 'o'], [2, 3, 'o'], [-3, 4, 'J'], [-2, 4, 'I'], [-1, 4, 'I'], [0, 4, 'I'], [1, 4, 'I'], [2, 4, 'I'], [3, 4, 'J'], [1, 5, 'o'], [1, 6, 'G']]) px(mid + dx, cy + dy, c); } // 가운데 녹아내린 왕관 장식
    for (const [x, y] of [[2, 9], [W - 4, H - 14], [mid + 4, 14]]) px(x, y, 'E');
    GATE = { pc, path, c0, r0, H }; }
  function gateN(k) { if (!GATE) gateInit(); const p = DOOR.n, ax = p.x - 27, ay = p.y - 72, off = Math.round(GATE.H * (1 - k)) * 2; if (k <= 0) return;
    ctx.save(); ctx.translate(ax, ay); ctx.clip(GATE.path); ctx.drawImage(GATE.pc, GATE.c0 * 2, GATE.r0 * 2 - off); ctx.restore(); }
  const oSeal = drawSeal;
  drawSeal = function (d, k) {
    if (!(G.stage === 4 && (d === 'n' || d === 's'))) return oSeal(d, k);
    if (d === 'n') return gateN(k); // v3.19 북문: 아치 안쪽 모양에 맞춘 내리닫이 쇠창살
    const p = DOOR[d], spr = cv('bars'), W0 = spr.width, H0 = d === 'n' ? spr.height : 42;
    const x = (p.x - W0 / 2) & ~1, y = (d === 'n' ? p.y - H0 + 2 : p.y - 6) & ~1, sh = Math.round(H0 * k) & ~1;
    if (sh > 0) ctx.drawImage(spr, 0, H0 - sh, W0, sh, x, y, W0, sh);
  };
  // 북문 아치 왕관 쐐기돌 · 녹은 금이 어둠에 묻히지 않게 작은 빛
  { const o = roomLights; roomLights = function (lights) { o(lights); const R = G && G.dun && G.dun.cur; if (G.stage === 4 && R && R.doors && R.doors.n != null && R.type !== 'boss' && R.type !== 'altar' && !(G.dun.forge) && !hiddenDoor(R, 'n') && !(R.sealW && R.sealW.dir === 'n')) lights.push({ x: DOOR.n.x, y: DOOR.n.y - 66, r: 46, a: 0.55, c: '255,200,110', ca: 0.12 }); }; }
  return { cv, ROWS, PAL };
})();
;

// ==================================================================== 24_wall4.js
'use strict';
// 잿빛 왕관 원정대 — 24_wall4.js (v2.92) : 4장 잿빛 왕도 윗벽 고유 요소 (시안 4장_윗벽_고유요소_시안.html B안)
// 벽돌 · 기둥 자리 · 창 자리 배치는 성채 그대로 두고, 기둥 · 기둥 깃발 · 창 · 벽 장식만 4장 것으로 바꾼다.
// 재로 바꾸는 단계(ashImg) 바로 뒤에 제 색으로 덧칠한다 (재 바닥 · 문보다 먼저).
const WALL4 = (() => {
  const PAL = {
    k: '#0b0a09', a: '#d4cec2', h: '#8e887e', l: '#6e6860', d: '#4e4a44', D: '#34312d', j: '#1c1a1e',
    p: '#c8b898', P: '#9a8a6a', q: '#6e604a',
    g: '#d8b860', G: '#a08038', o: '#6e5626',
    r: '#a83a34', R: '#7a2428', x: '#4a1a1c',
    e: '#ff9a40', E: '#d0501c', y: '#f0dc98',
    i: '#7c7a84', I: '#55535c', J: '#3a3940',
    w: '#5e4c3a', W: '#45372a', c: '#30261e', C: '#17120f',
  };
  const ART = {
    // 포고문: 못 하나에 걸린 왕실 포고문, 뒤에 한 장 더 · 붉은 밀랍 봉인
    edict: [
      '...kk......',
      '..kiJk.....',
      'kkkkIkkkk..',
      'kappapppakk',
      'kpqqqqqppPk',
      'kppppppppPk',
      'kplllllppPk',
      'kppppppppPk',
      'kpllllllpPk',
      'kppppppppPk',
      'kplllprrpPk',
      'kpppprRRpPk',
      'kPpPpkxRkPk',
      '.kPk.k.kkqk',
      '..k.....kk.',
    ],
    // 그을린 초상: 왕관을 쓴 인물, 얼굴만 타서 지워짐
    portrait: [
      'kkkkkkkkkkkk',
      'kgggggggggok',
      'kgjjjjjjjjok',
      'kgjjjgjgjjok',
      'kgjjjgggjjok',
      'kgjjCCCCjjok',
      'kgjECDCCEjok',
      'kgjjjCCjjjok',
      'kgjRRxhRRjok',
      'kgjRRRhRRjok',
      'kgRRRRRRRRok',
      'kgoooooooook',
      'kkkkkkkkkkkk',
    ],
    // 벽걸이 종: 쇠 팔걸이에 매단 작은 종, 금이 감 (외곽선은 gOutline)
    bell: [
      'iI.........',
      'II.........',
      'IIiiiiiI...',
      '......J....',
      '.....gGo...',
      '....gGGGo..',
      '....gGoGo..',
      '...gGGoGGo.',
      '...gGGGoGo.',
      '..gGGGGGGGo',
      '......o....',
    ],
    // 녹아내린 금 문장: 왕관과 보석이 새겨진 방패, 아래로 금이 흘러내림 (외곽선은 gOutline)
    crest: [
      '.............',
      '.gggggggggGo.',
      '.gGGGGGGGGGo.',
      '.gGGoGoGoGGo.',
      '.gGGoooooGGo.',
      '.gGGooRooGGo.',
      '.gGGGGGGGGGo.',
      '.gGGGGGGGGGo.',
      '..gGGGGGGGo..',
      '..gGGGGGGGo..',
      '..g.gGGGGo.o.',
      '..G..gGGo..o.',
      '..G...gG.....',
      '..o...gG.....',
      '......Go.....',
      '......o......',
      '.............',
    ],
    // 유골 단지 (벽감 안에 넣음, 외곽선은 gOutline)
    urnNiche: [ // v3.20 유골함을 앉힌 벽감 (항아리 · 넘친 재까지 한 장으로 구움)
      '...kkkkkkkk...',
      '..kllllllllk..',
      '.klJJJkkJJJlk.',
      'klJJJkahkJJJlk',
      'klJJkhaahkJJlk',
      'klJJJkddkJJJlk',
      'klJJkhlldkJJlk',
      'klJkhllldDkJlk',
      'klJkhlllDDkJlk',
      'klJklllldDkJlk',
      'klJhaldDDhahlk',
      'kllllkkkklllk.',
      'kkkkkkkkkkkkk.',
    ],
  };
  const SLOT = { tapestry: 'edict', shieldSwords: 'crest', portrait: 'portrait', chains: 'bell', skullNiche: 'urn' };
  const G4 = {}; for (const k in ART) G4[k] = fromRows(ART[k]);
  G4.bell = gOutline(G4.bell); G4.crest = gOutline(G4.crest);
  G4.urn = G4.urnNiche;
  const hex = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
  const toHex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const ashHex = s => toHex(ashPx(...hex(s)));
  // 창: 바깥 도시가 불타는 잉걸빛 + 지붕 실루엣 (9칸 × 18칸, 위는 아치)
  function genWindow() { // 돌 테 아치 창 · 창살 · 아래로 갈수록 붉게 타오르는 도시 · 지붕과 첨탑 실루엣
    return fromRows([
      '...kkkkk...',
      '..klllldk..',
      '.klxxxxxdk.',
      'kdxxxJxxxdk',
      'kdxxxJxxxdk',
      'kdxRxJxRxdk',
      'kdRxRJRxRdk',
      'kdRRRJRRRdk',
      'kdJJJJJJJdk',
      'kdRERJRERdk',
      'kdEREJEREdk',
      'kdEEEJEEEdk',
      'kdEeEJEkEdk',
      'kdeeeJekedk',
      'kdkeeJkkkdk',
      'kdkkyJkkkdk',
      'kdkkkJkkkdk',
      'klllllllldk',
      'kkkkkkkkkkk',
    ]);
  }
  const WIN = genWindow();
  // 기둥 깃발: 그을린 왕실 깃발, 아래가 타서 해짐
  const BANNER = fromRows([
    'kIiIiIiIk',
    '.kRrRRRk.',
    '.krRRRRk.',
    '.krgRgRk.',
    '.krgggRk.',
    '.krGGGRk.',
    '.krRRRRk.',
    '.krRRRRk.',
    '.krRRxRk.',
    '.kxRRRxk.',
    '.kCxRkCk.',
    '..kCkEk..',
    '...k.k...',
  ]);
  // ---------------- 기둥 (가로 11칸: 몸통 9칸 + 띠·받침이 양옆으로 1칸씩)
  function genColumn(rows, x0seed) { // 금박이 벗겨진 왕실 석주 · 세로 홈 · 머리띠와 받침 위에 쌓인 재
    const g = mkGrid(11, rows), bot = rows - 1;
    for (let y = 0; y < rows; y++) for (let x = 1; x <= 9; x++) g[y][x] = x === 1 || x === 9 ? 'k' : x === 2 ? 'h' : x === 4 || x === 6 ? 'D' : x >= 8 ? 'D' : x === 3 ? 'l' : 'd';
    const ring = (y, h2) => { for (let x = 0; x <= 10; x++) { g[y - 1][x] = 'k'; for (let k = 0; k < h2; k++) g[y + k][x] = x === 0 || x === 10 ? 'k' : k === 0 ? (x < 4 && hsh2(x0seed + x, y) > 0.3 ? 'g' : 'G') : (x > 6 || hsh2(x0seed + x, y + k) < 0.35 ? 'o' : 'G'); g[y + h2][x] = 'k'; } };
    const cap = Math.max(4, bot - 76); ring(cap, 3); for (let x = 1; x <= 9; x++) if (hsh2(x0seed + x, 3) < 0.7) { g[cap - 1][x] = x < 5 ? 'a' : 'h'; g[cap - 2][x] = hsh2(x, 4) < 0.5 ? 'k' : '.'; }
    for (let y = cap - 2; y >= 0; y--) for (let x = 1; x <= 9; x++) if (g[y][x] === '.') g[y][x] = x === 1 || x === 9 ? 'k' : x === 2 ? 'h' : x === 4 || x === 6 || x >= 8 ? 'D' : x === 3 ? 'l' : 'd';
    ring(bot - 8, 2); // v3.28 금테 아래 받침돌은 4칸 (6칸 → 반으로 줄임)
    for (let y = bot - 5; y <= bot; y++) for (let x = 0; x <= 10; x++) g[y][x] = x === 0 || x === 10 || y === bot - 5 || y === bot ? 'k' : x <= 2 ? 'l' : x >= 8 ? 'D' : 'd';
    for (let k = 0; k < 2; k++) { const cx = 3 + Math.floor(hsh2(x0seed, k) * 4), cy = cap + 10 + Math.floor(hsh2(k, x0seed) * 30); for (let s = 0; s < 3; s++) if (g[cy + s] && g[cy + s][cx + (s % 2)] !== 'k') g[cy + s][cx + (s % 2)] = 'j'; }
    return g;
  }
  const hsh2 = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  
  const FEET = []; // v3.28 기둥 받침: 바닥을 다 칠한 뒤 한 번 더 얹어 바닥에 묻히지 않게
  function paint(g, R) {
    FEET.length = 0; const T0 = A.y0 - 100, slots = PILLARS.slice(0, -1).map((x, i) => [i, Math.round((x + PILLARS[i + 1]) / 4) * 2]);
    // 창 자리: 성채 장식은 4장 장식으로, 빈 창은 잉걸빛 창으로
    for (const [i, mx] of slots) {
      if (R.sealW && Math.abs(mx - DOOR.n.x) < 110) continue;
      if (Math.abs(mx - DOOR.n.x) < (R.doors && R.doors.n != null ? 40 : 8)) { if (!(R.doors && R.doors.n != null)) g.drawImage(g.canvas, mx + 22, Math.max(0, T0 - 2), 28, 52, mx - 14, Math.max(0, T0 - 2), 28, 52); continue; } // v3.19 북문 위엔 창 · 장식 없음 · v3.29 북문 없는 방의 가운데 자리는 성채 옛 창을 벽돌로 메움 (어두운 아치 흔적이 남던 문제)
      const k0 = ROOMSTYLE.wall ? ROOMSTYLE.wall[i % ROOMSTYLE.wall.length] : 'window', k = SLOT[k0];
      if (typeof WDECO !== 'undefined') { const k4 = WDECO.pick(R, i, T0); // v3.29 4장 새 벽장식 · 대칭 배치 · 빈 벽 · 창 방
        g.drawImage(g.canvas, mx + 22, Math.max(0, T0 - 2), 28, 52, mx - 14, Math.max(0, T0 - 2), 28, 52);
        if (k4) WDECO.draw(g, k4, mx, T0); continue; }
      let put = !!k; const art = k && G4[k];
      if (put) { const w0 = art[0].length * 2, h0 = art.length * 2, y0 = T0 + 30 - h0 / 2 + (k === 'edict' ? 4 : 0); if (typeof OCC !== 'undefined' && !OCC.wall(mx - w0 / 2, y0, w0, h0)) put = false; }
      g.drawImage(g.canvas, mx + 22, Math.max(0, T0 - 2), 28, 52, mx - 14, Math.max(0, T0 - 2), 28, 52); // 옆 벽돌을 그대로 옮겨 창을 메움 (벽돌 무늬 주기 18px의 배수만큼 옆)
      if (!put) { gPaint(g, WIN, PAL, mx - 11, T0 + 8); continue; } // 창은 성채 창보다 10px 낮게
      const w = art[0].length * 2, h = art.length * 2;
      gPaint(g, art, PAL, mx - w / 2, T0 + 30 - h / 2 + (k === 'edict' ? 4 : 0));
    }
    // 기둥과 깃발
    const rows = Math.ceil((A.y0 + 4) / 2) + 1 - 2; // v3.28 받침 맨 아래 외곽선이 바닥 첫 칸(2px)만 침범
    PILLARS.forEach((x, i) => {
      const pg = typeof PILLARGEN !== 'undefined' ? PILLARGEN.gen4(rows, i * 7 + 3) : genColumn(rows, i * 7 + 3), hx = typeof PILLARGEN !== 'undefined' ? 14 : 11; // v3.29 새 왕실 석주 (59_pillars.js)
      gPaint(g, pg, PAL, x - hx, A.y0 + 2 - rows * 2); FEET.push({ pg, x: x - hx + 11, y: A.y0 + 2 - rows * 2 });
      // v3.29 기둥 깃발은 뺌
    });
  }
  const on = () => G && G.stage === 4 && !(G.dun && G.dun.forge) && typeof CUR_ROOM !== 'undefined' && CUR_ROOM && CUR_ROOM.type !== 'altar';
  { const o = paintRoomFloor; paintRoomFloor = function (R) { const r = o.apply(this, arguments); if (on() && FEET.length) { const y0 = A.y0 - 14;
      for (const f of FEET) { const c = gCanvas(f.pg, PAL), sy = y0 - f.y; if (sy < 0 || sy >= c.height) continue; fg.drawImage(c, 0, sy, c.width, c.height - sy, f.x - 11, y0, c.width, c.height - sy); } } return r; }; }
  { const o = paintCastleWall; paintCastleWall = function (g) { if (on()) return; return o(g); }; }
  { const o = ashImg; ashImg = function (cx, w, h) { o(cx, w, h); if (cx === fg && on()) paint(cx, CUR_ROOM); }; }
  return { arts: G4, paint, ART, PAL, WIN, BANNER, genColumn };
})();
;

// ==================================================================== 25_habi_ult.js
'use strict';
// 잿빛 왕관 원정대 — 25_habi_ult.js : 그레이브 각성 「등 맡기기」 (v3.15) — 하비가 내려와 6초 동안 그레이브 등 뒤를 맡는다
// 각성을 쓰면 하비가 왼쪽 위에서 비스듬히 내리꽂혀 그레이브 등 뒤에 착지 → 등을 맞댄 채 따라다니며 뒤쪽 적을 쌍열 샷건으로 쏨(2발 · 재장전). 뒤쪽에 적이 없으면 그레이브 옆으로 나와 앞쪽 적을 쏨 → 한마디 → 왼쪽 위로 튀어 오름
// 그레이브는 그동안 평소처럼 움직이고 쏜다 (조준하며 멈춰 서는 시간 없음) · v3.20 그레이브가 구르면 하비도 같이 구름 (꾹 눌림 → 다이브 → 말림 → 착지) · 난입자는 하비 산탄도 읽고 피함 · 장의사의 머스킷: 하비 산탄 150%
const HABIULT = (() => {
  const HD = {"f":{"base":["..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaanwwwnwwAkkHk...","......kaaauwwwuwAAkkHk...",".......kaawwNwwAAk.kHk...","........kk11SSSkkk.kHk...",".......k23CCBCCCck.kHk...",".......kAk23xCckakkWWk...","........kCCCkCCCkkWWk....",".........kFFk.kFFkkk.....",".........kkkk.kkkk......."],"baseB":["..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaaawwwawwAkkHk...","......kaaanwwwnwAAkkHk...",".......kaawwNwwAAk.kHk...","........kk11SSSkkk.kHk...",".......k23CCBCCCck.kHk...",".......kAk23xCckakkWWk...","........kCCCkCCCkkWWk....",".........kFFk.kFFkkk.....",".........kkkk.kkkk......."],"idle":[".........................","..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaanwwwnwwAkkHk...","......kaaauwwwuwAAkkHk...",".......kaawwNwwAAk.kHk...","........kk11SSSkkk.kHk...",".......k23CCBCCCck.kHk...",".......kAk23xCckakkWWk...",".........kFFk.kFFkkk.....",".........kkkk.kkkk......."],"idleB":[".........................","..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaaawwwawwAkkHk...","......kaaanwwwnwAAkkHk...",".......kaawwNwwAAk.kHk...","........kk11SSSkkk.kHk...",".......k23CCBCCCck.kHk...",".......kAk23xCckakkWWk...",".........kFFk.kFFkkk.....",".........kkkk.kkkk......."]},"p":{"1":"#b9b9c3","2":"#a9a9b4","3":"#8f8f9b","A":"#d8d4cc","B":"#5a5a62","C":"#c9c9d1","F":"#8a8a96","H":"#fbf9f5","K":"#0b0a0e","N":"#e8909a","S":"#4a3020","W":"#dcd8d0","a":"#fbf9f5","b":"#8d9097","c":"#dcdce2","k":"#0b0a0e","n":"#16120e","p":"#eaa4a8","s":"#6b4a2a","u":"#cfa628","w":"#fbf9f5","x":"#5e5e6a"}};
  const HR = {"pre": [".........................", ".........................", "..........k...k..........", ".........kak.kak...k.....", "........kpak.kapk.kHk....", ".......kaaaaaaaaak.kHk...", "......kaaaaawaaaaakkHk...", "......kaaanwwwnwwAkkHk...", "......kaaauwwwuwAAkkHk...", ".......kaawwNwwAAk.kHk...", "........kk11SSSkkk.kHk...", ".......kAk23xCckakkWWk...", ".........kFFk.kFFkkk.....", ".........kkkk.kkkk......."], "dive": [".........................", ".........................", ".........................", "..............k...k......", ".............kak.kak.....", "............kpak.kapk.k..", ".kkkkkkk...kaaaaaaaaak...", "kWWHHkk11Skaaaaawaaaaak..", ".kkkk23CCBkaaanwwwnwwAk..", "....kAk23xkaaauwwwuwAAk..", ".....kCCCkCkaawwNwwAAk...", "......kFFk.kFF...........", "......kkkk.kkkk..........", "........................."], "curl": ["........kakkkkkkak.......", "........kapaaaapak.......", ".......kaaaaaaaaak.......", ".......kaaaaaaaaaak......", "......kWkaaaaaaaaak......", ".....kHHaannaannaaak.....", ".....kHHaaaaaaaaaaAk.....", ".....kHkaaaaNNaaaAAk.....", ".....kHHaaaaaaaaAAAk.....", ".....kHHSSSSSSSSS33k.....", "......kHkCCCCCC333k......", "......kHkCCCCCC333k......", ".......kCCCCCCC33k.......", "........kk33333kk........", "..........kkkkk..........", "........................."], "land": [".........................", ".........................", "..........k...k..........", ".........kak.kak...k.....", "........kpak.kapk.kHk....", ".......kaaaaaaaaak.kHk...", "......kaaaaawaaaaakkHk...", "......kaaanwwwnwwAkkHk...", "......kaaauwwwuwAAkkHk...", ".......kaawwNwwAAk.kHk...", "........kk11SSSkkk.kHk...", ".......kAk23xCckakkWWk...", ".........kFFk.kFFkkk.....", ".........kkkk.kkkk......."], "up": ["..........k...k..........", ".........kak.kak...k.....", "........kpak.kapk.kHk....", ".......kaaaaaaaaak.kHk...", "......kaaaaawaaaaakkHk...", "......kaaanwwwnwwAkkHk...", "......kaaauwwwuwAAkkHk...", ".......kaawwNwwAAk.kHk...", "........kk11SSSkkk.kHk...", ".......k23CCBCCCck.kHk...", ".......kAk23xCckakkWWk...", "........kCCCkCCCkkWWk....", ".........kFFk.kFFkkk.....", ".........kkkk.kkkk......."], "settle": [".........................", "..........k...k..........", ".........kak.kak...k.....", "........kpak.kapk.kHk....", ".......kaaaaaaaaak.kHk...", "......kaaaaawaaaaakkHk...", "......kaaanwwwnwwAkkHk...", "......kaaauwwwuwAAkkHk...", ".......kaawwNwwAAk.kHk...", "........kk11SSSkkk.kHk...", ".......k23CCBCCCck.kHk...", ".......kAk23xCckakkWWk...", ".........kFFk.kFFkkk.....", ".........kkkk.kkkk......."]}; // v3.20 하비 구르기 도트: pre 꾹 눌림 · dive 다이브 · curl 말림(90°씩 돎) · land 착지 · up 튕김 · settle 살짝 눌림
  const SR = ["......ymmmmmmmmmmh", "tt...ndddddddddddd", "tsssssyMMMMMMMMMMh", "tSSSs.n.ssssssss..", "SS....g..........."]; // 외곽선은 rotW가 바깥에 1칸 붙임 (칸 안에는 넣지 않음)
  const SG = { cells: SR.map(r => [...r]), w: SR[0].length, h: SR.length, px: 5, py: 3, pal: {'k': '#0b0a0e', 's': '#8a5a32', 'S': '#5a3820', 't': '#b07848', 'm': '#d8dce4', 'M': '#9da2ac', 'd': '#3e3e48', 'n': '#6a6a74', 'g': '#2a2a32', 'y': '#c9a24a', 'h': '#1a1a20'}, reach: 0, rot: {} };
  { let m = 0; SR.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') m = Math.max(m, Math.hypot(x - SG.px, y - SG.py)); })); SG.reach = Math.round(m * 2); }
  const DUR = 6, IN = ['등 뒤는 내가 맡지.', '앞만 봐라, 그레이브.', '빚을 갚도록 하지.'], OUT = ['빚은 갚았다.']; // 등장 · 퇴장 대사 확정
  const REACH = 190; // 하비 산탄이 닿는 거리 (이보다 멀면 겨누기만 하고 쏘지 않음)
  let H = null;
  const CV = {};
  // 플레이어블 캐릭터와 같은 움직임: 숨 고르기(0.6초 · 1칸) · 걷기 4프레임(80ms · 2·4프레임은 1칸 내려가고 한 발 듦) · 눈 깜빡임 · 시선(겨누는 쪽으로 눈 1칸)
  const EYE_ROW = 5, EYE_COLS = [10, 14];
  function rowsFor(walk, idle, blink, gaze) {
    let R = (blink ? (idle ? HD.f.idleB : HD.f.baseB) : (idle ? HD.f.idle : HD.f.base)).map(r => [...r]);
    if (walk === 1 || walk === 3) { const B = (blink ? HD.f.baseB : HD.f.base).map(r => [...r]); R = [Array(B[0].length).fill('.')].concat(B.slice(0, B.length - 1)); // 몸 1칸 내려감
      const L = R[R.length - 1], feet = []; for (let x = 0; x < L.length; x++) if (L[x] === 'F') feet.push(x); const half = feet.filter(x => walk === 1 ? x > 13 : x < 13); half.forEach(x => { L[x] = 'k'; }); } // 한 발 듦
    if (gaze) { const off = R[0].every(c => c === '.') ? 1 : 0; for (const y of [EYE_ROW + off, EYE_ROW + 1 + off]) { const row = R[y], keep = EYE_COLS.map(c => row[c]); EYE_COLS.forEach(c => { row[c] = 'w'; }); EYE_COLS.forEach((c, i) => { row[c + gaze] = keep[i]; }); } }
    return R;
  }
  function artW(key, rows) { const k = key + 'W'; if (CV[k]) return CV[k]; const c = document.createElement('canvas'); c.width = rows[0].length * 2; c.height = rows.length * 2; const g = c.getContext('2d'); g.fillStyle = '#ffffff';
    rows.forEach((r, y) => r.forEach((ch, x) => { if (ch !== '.') g.fillRect(x * 2, y * 2, 2, 2); })); return (CV[k] = c); }
  function art(key, rows) { if (CV[key]) return CV[key]; const c = document.createElement('canvas'); c.width = rows[0].length * 2; c.height = rows.length * 2; const g = c.getContext('2d');
    rows.forEach((r, y) => r.forEach((ch, x) => { if (ch === '.' || !HD.p[ch]) return; g.fillStyle = HD.p[ch]; g.fillRect(x * 2, y * 2, 2, 2); })); return (CV[key] = c); }
  const blinkAt = () => { const t = (time + 2.7) % 8.6; return t < 0.12 || (t >= 4.3 && t < 4.42) || (t >= 4.6 && t < 4.72); };
  const footX = (() => { const r = HD.f.base[HD.f.base.length - 1]; let a = -1, b = -1; for (let i = 0; i < r.length; i++) if (r[i] !== '.') { if (a < 0) a = i; b = i; } return (a + b + 1); })();
  const backPos = () => { const P = G.player, a = P.ang + Math.PI; return { x: P.x + Math.cos(a) * 24, y: P.y + Math.sin(a) * 10 + 6 }; }; // 등 뒤 · 살짝 아래 (그레이브에 가려지지 않게)
  const sidePos = e => { const P = G.player, a = P.ang, s = Math.sign(Math.cos(a) * (e.y - P.y) - Math.sin(a) * (e.x - P.x)) || 1, pa = a + s * Math.PI / 2; // 앞쪽 적을 쏠 땐 그레이브 옆(적이 있는 쪽 어깨)으로
    return { x: P.x + Math.cos(pa) * 22 - Math.cos(a) * 6, y: P.y + Math.sin(pa) * 12 + 6 }; };
  const slot = () => (H && H.front && H.tgt && !H.tgt.dead) ? sidePos(H.tgt) : backPos();
  function start() {
    const P = G.player; P.gauge = 0; const b = backPos();
    H = { ph: 'in', t: 0, x: b.x, y: b.y, z: 140, ang: P.ang + Math.PI, cd: 0.4, shot: 0, say: pick(IN), sayT: 1.6 };
    sfx('aim');
  }
  // 겨눌 적: ① 그레이브 등 뒤(보는 방향의 반대쪽 반원)의 가장 가까운 적 → ② 없으면 그레이브 사거리 안의 가장 가까운 적
  // 0.4초마다 다시 고르고, 지금 겨누는 적이 살아 있고 여전히 맞는 쪽이면 그대로 (이리저리 휙휙 돌지 않게)
  function pickTarget() {
    const P = G.player, back = P.ang + Math.PI; let bb = null, bd = REACH, fb = null, fd = REACH; // v3.16 산탄이 닿는 적만 고름 (닿지 않는 먼 적을 겨누느라 가까운 적을 놓치지 않게)
    for (const e of G.enemies) { if (e.dead || isDummy(e)) continue; const d = Math.hypot(e.x - P.x, e.y - P.y), isBack = Math.abs(angDiff(Math.atan2(e.y - P.y, e.x - P.x), back)) < 1.75;
      if (isBack && d < bd) { bd = d; bb = e; } if (!isBack && d < fd) { fd = d; fb = e; } }
    return bb ? { e: bb, front: false } : fb ? { e: fb, front: true } : null;
  }
  function target(dt) {
    H.pickT = (H.pickT || 0) - dt;
    const keep = H.tgt && !H.tgt.dead && Math.hypot(H.tgt.x - G.player.x, H.tgt.y - G.player.y) < REACH + 20 && (H.front || Math.abs(angDiff(Math.atan2(H.tgt.y - G.player.y, H.tgt.x - G.player.x), G.player.ang + Math.PI)) < 1.9);
    if (!keep || H.pickT <= 0) { const p = pickTarget(); if (!keep || (p && (p.e !== H.tgt) && (!p.front || H.front))) { H.tgt = p ? p.e : null; H.front = p ? p.front : false; } H.pickT = 0.4; }
    return H.tgt;
  }
  function threat(e) { // 난입자가 하비의 산탄을 읽음: 하비가 자기를 겨누고 곧 쏠 때
    if (!H || H.ph !== 'on' || H.hide || H.tgt !== e || H.cd > 0.12) { if (e) e.habiRead = false; return null; }
    if (e.habiRead) return null; e.habiRead = true; return Math.random() < 0.75 ? H.ang + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) : null;
  }
  function shoot() {
    const h = hand(), m = { x: h.x + Math.cos(H.ang) * 26, y: h.y - 2 + Math.sin(H.ang) * 26 };
    const o = { x: h.x, y: h.y - 2 }; // v3.16 판정은 손(총 뿌리)에서 적의 몸통까지 — 총구 끝에서 재면 바로 앞 적이나 조금 비스듬한 적이 빠짐
    for (const e of G.enemies) { if (e.dead) continue; const ex = e.x, ey = e.y - 8, d = Math.hypot(ex - o.x, ey - o.y); if (d < 196 + e.r && (d < 26 + e.r || Math.abs(angDiff(Math.atan2(ey - o.y, ex - o.x), H.ang)) < 0.36 + Math.atan2(e.r, d))) damageEnemy(e, 1.9 * (G.stats.fx.has('undertaker') ? 1.5 : 1) * (1 - Math.min(Math.max(0, d - 26), 170) / 170 * 0.45), /* 장의사의 머스킷: 하비 산탄 150% */ { ang: H.ang, kb: 240, grogi: 6, stagger: 0.4, heavy: true, gauge: 0 }); }
    for (let i = 0; i < 6; i++) { const a = H.ang + rand(-0.32, 0.32), L = rand(110, 170); G.fx.push({ kind: 'tracer', x0: m.x, y0: m.y, x1: m.x + Math.cos(a) * L, y1: m.y + Math.sin(a) * L, w: 3, t: 0.2, max: 0.2, c: '255,220,150' }); }
    G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang: H.ang, s: 2.2, t: 0.14, max: 0.14 }); if (!(H.shot % 2)) sfx('shotgun', 0.85); /* v3.16 두 발에 총성은 한 번 */ if (typeof CASING !== 'undefined') CASING.spawn('red', h.x, h.y, H.y, H.ang); // v3.16 쏠 때마다 빨간 탄피
    H.recoil = 2.5;
  }
  const IN_T = 0.2, OUT_T = 0.22, CROUCH_T = 0.07;
  function landFx(x, y, big) { // 착지 · 도약: 흰 고리 두 겹 + 흙먼지 + 불티
    G.fx.push({ kind: 'ring', x, y, r: 6, grow: big ? 150 : 110, t: 0.24, max: 0.24, c: '#f4f0ff' }); G.fx.push({ kind: 'ring', x, y, r: 3, grow: 70, t: 0.3, max: 0.3, c: '#9fd2ff' });
    for (let i = 0; i < 16; i++) { const a = rand(0, TAU), sp = rand(50, 120); G.parts.push({ x: x + Math.cos(a) * 6, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.4 - 10, t: rand(0.2, 0.4), c: pick(['#8a7a6a', '#a89880', '#6a5a4a']), g: 0 }); }
    for (let i = 0; i < 8; i++) G.parts.push({ x: x + rand(-8, 8), y: y - rand(0, 10), vx: rand(-30, 30), vy: -rand(40, 110), t: rand(0.2, 0.35), c: pick(['#ffffff', '#cfe6ff']), g: 0, glow: true });
  }
  function update(dt) {
    if (!H) return; const P = G.player; H.t += dt; const px0 = H.x, py0 = H.y; H.sayT -= dt; H.recoil = Math.max(0, (H.recoil || 0) - dt * 12); H.flashT = Math.max(0, (H.flashT || 0) - dt);
    if (H.trail) { for (const q of H.trail) q.t -= dt; H.trail = H.trail.filter(q => q.t > 0); }
    if (P.dead && H.ph !== 'out' && H.ph !== 'crouch') { H.ph = 'crouch'; H.t = 0; }
    const b = slot();
    // v3.20 같이 구르기: 그레이브가 구르는 동안 하비도 등에 붙은 자리 그대로 같은 방향 · 같은 박자로 구름 (그동안 쏘지 않음)
    const rolling = P.state === 'dodge' && P.rolling;
    if (rolling && !H.rolling) { H.rollF = (P.dvx || 0) < 0 ? -1 : 1; for (let i = 0; i < 5; i++) G.parts.push({ x: H.x + rand(-4, 4), y: H.y - rand(0, 2), vx: -(P.dvx || 0) * 30 + rand(-10, 10), vy: rand(-16, -4), t: 0.3, c: pick(['#8a8078', '#a89c90']), g: 0 }); }
    H.rolling = rolling;
    if (H.ph === 'in') { const k = Math.min(1, H.t / IN_T); H.z = 240 * (1 - k) ** 2; H.x = b.x; H.y = b.y; (H.trail = H.trail || []).push({ x: H.x, y: H.y, z: H.z, t: 0.12 }); // 하늘에서 내리꽂힘
      if (k >= 1) { H.ph = 'on'; H.t = 0; H.z = 0; H.flashT = 0.08; landFx(H.x, H.y, true); sfx('step'); sfx('dodge'); } }
    if (H.ph === 'on' && !H.hide) {
      { const k = Math.min(1, dt * 10); if (H.ox == null) { H.ox = H.x - P.x; H.oy = H.y - P.y; } const tx = b.x - P.x, ty = b.y - P.y, ox0 = H.ox, oy0 = H.oy; H.ox += (tx - H.ox) * k; H.oy += (ty - H.oy) * k; H.oSpd = Math.hypot(H.ox - ox0, H.oy - oy0) / Math.max(dt, 1e-3); H.x = P.x + H.ox; H.y = P.y + H.oy; } // v3.16 등에 붙어 따라다님: 그레이브와의 간격만 부드럽게 바꾸고 몸은 그레이브와 같이 움직임 (따로 끌려오며 후들거리지 않게)
      const e = target(dt), want = e ? Math.atan2(e.y - 8 - (H.y - 5), e.x - H.x) : P.ang + Math.PI;
      H.ang = lerpAng(H.ang, want, Math.min(1, dt * 12)); H.cd -= dt;
      if (e && H.cd <= 0 && !rolling && Math.abs(angDiff(H.ang, want)) < 0.25 && Math.hypot(e.x - H.x, e.y - H.y) < REACH + e.r) { shoot(); H.shot++; H.cd = H.shot % 2 ? 0.16 : 0.85; } // 두 발 → 재장전
    }
    if (H.ph === 'on' && H.t >= DUR) { H.ph = 'bye'; H.t = 0; H.say = pick(OUT); H.sayT = 1.0; }
    if (H.ph === 'bye' && !H.hide) { { const k = Math.min(1, dt * 10); if (H.ox == null) { H.ox = H.x - P.x; H.oy = H.y - P.y; } const tx = b.x - P.x, ty = b.y - P.y, ox0 = H.ox, oy0 = H.oy; H.ox += (tx - H.ox) * k; H.oy += (ty - H.oy) * k; H.oSpd = Math.hypot(H.ox - ox0, H.oy - oy0) / Math.max(dt, 1e-3); H.x = P.x + H.ox; H.y = P.y + H.oy; } if (H.t > 1.0) { H.ph = 'crouch'; H.t = 0; } }
    if (H.ph === 'crouch' && H.t >= CROUCH_T) { H.ph = 'out'; H.t = 0; H.hide = false; landFx(H.x, H.y, false); sfx('dodge'); } // 움츠렸다가
    if (H.ph === 'out') { const k = Math.min(1, H.t / OUT_T); H.z = 280 * k ** 1.4; (H.trail = H.trail || []).push({ x: H.x, y: H.y, z: H.z, t: 0.12 }); if (k >= 1) H = null; } // 하늘로 튀어 오름
    if (H) H.spd = Math.hypot(H.x - px0, H.y - py0) / Math.max(dt, 1e-3);
    if (H) { if (!H.bub || H.ph === 'in') H.bub = { x: H.x, y: H.y }; else { const k = Math.min(1, dt * 8); H.bub.x += (H.x - H.bub.x) * k; H.bub.y += (H.y - H.bub.y) * k; } } // v3.16 말풍선 자리: 몸을 천천히 따라감
  }
  const hand = () => { const f = Math.cos(H.ang) < 0 ? -1 : 1; return { x: H.x + f * 11 - Math.cos(H.ang) * (H.recoil || 0) * 4, y: H.y - 6 - Math.sin(H.ang) * (H.recoil || 0) * 4 }; }; // 그레이브 heroHand와 같음
  function draw() {
    if (!H || H.hide) return;
    const P = G.player, air = H.ph === 'in' || H.ph === 'out', crouch = H.ph === 'crouch', glued = (H.ph === 'on' || H.ph === 'bye') && H.ox != null, moving = !air && !crouch && (glued ? (P.moving && !P.dead) || (H.oSpd || 0) > 30 : (H.spd || 0) > 12); // v3.16 걷기 그림은 그레이브가 걸을 때 (속도가 문턱을 오가며 걷기·서기가 번갈아 깜빡이지 않게)
    { const rp = (H.ph === 'on' || H.ph === 'bye') && P.state === 'dodge' && P.rolling ? rollPose(P) : null, post = !rp && (H.ph === 'on' || H.ph === 'bye') && P.rollEndAt != null && P.state === 'idle' && time - P.rollEndAt < ROLL_POST ? (time - P.rollEndAt < ROLL_POST / 2 ? 'up' : 'settle') : null;
      if (rp || post) { drawRoll(P, rp, post); return; } } // v3.20 같이 구르기
    const walk = moving ? Math.floor(time / 0.08) % 4 : -1, idle = crouch || (!air && !moving && Math.floor(time / 0.6) % 2 === 1), blink = !air && blinkAt();
    const flip = P.x < H.x;                                   // 꼬리는 늘 그레이브 쪽 (원래 도트는 꼬리가 오른쪽)
    const look = Math.abs(Math.cos(H.ang)) > 0.38 ? (Math.cos(H.ang) > 0 ? 1 : -1) : 0, gaze = look * (flip ? -1 : 1); // 겨누는 쪽으로 눈
    const key = [walk, +idle, +blink, gaze].join(','), rows = rowsFor(walk, idle, blink, gaze), c = art(key, rows);
    const SLANT = 0.35, ox = -Math.round(H.z * SLANT) & ~1; // 등장 · 퇴장은 똑바로 위가 아니라 살짝 왼쪽 위에서 비스듬히
    const gx0 = glued ? snap2(P.x) + snap2(H.ox) : Math.round(H.x) & ~1, gx = gx0 + ox, gy = glued ? snap2(P.y) + snap2(H.oy) : Math.round(H.y) & ~1, zy = Math.round(H.z) & ~1, bob = (walk === 1 || walk === 3 || idle) ? 2 : 0;
    const blit = (cv, y, a) => { ctx.save(); ctx.globalAlpha = a; if (flip) { ctx.translate(gx, 0); ctx.scale(-1, 1); ctx.drawImage(cv, -footX, y); } else ctx.drawImage(cv, gx - footX, y); ctx.restore(); };
    if (H.trail) { const w = artW(key, rows); for (const q of H.trail) { const qx = gx0 - (Math.round(q.z * SLANT) & ~1); ctx.save(); ctx.globalAlpha = q.t / 0.12 * 0.45; if (flip) { ctx.translate(qx, 0); ctx.scale(-1, 1); ctx.drawImage(w, -footX, gy - c.height + 2 - (Math.round(q.z) & ~1)); } else ctx.drawImage(w, qx - footX, gy - c.height + 2 - (Math.round(q.z) & ~1)); ctx.restore(); } } // 잔상 (흰 실루엣)
    drawShadow(gx0, gy + 1, H.z > 80 ? 4 : 8);
    const h0 = hand(), h = { x: h0.x - H.x + gx0 + ox, y: h0.y - H.y + gy }, /* v3.16 총도 몸과 같은 칸 기준 */ hy = h.y - zy + bob, behind = Math.sin(H.ang) < 0.55; // 그레이브처럼: 총은 몸 뒤 옆 (아래로 겨눌 때만 앞) · 몸이 내려가면 손도 1칸
    if (behind) drawBlade(SG, h.x, hy, H.ang);
    const top = gy - c.height + 2 - zy;
    blit(H.flashT > 0 ? artW(key, rows) : c, top, 1);
    if (!behind) drawBlade(SG, h.x, hy, H.ang);
    { const px = (Math.round(h.x) & ~1) - 2, py = (Math.round(hy) & ~1) - 2; // 그립을 감싼 앞발 (2×2칸 · 1칸 외곽선) — 방아쇠를 쥔 손
      ctx.fillStyle = '#0b0a0e'; ctx.fillRect(px - 2, py, 8, 4); ctx.fillRect(px, py - 2, 4, 8);
      ctx.fillStyle = '#fbf9f5'; ctx.fillRect(px, py, 4, 4); ctx.fillStyle = '#d8d4cc'; ctx.fillRect(px, py + 2, 4, 2); }
    if (H.sayT > 0 && !air && !crouch && H.bub) drawBubble(H.say, H.bub.x, H.bub.y - 34); // v3.16 말풍선은 칸에 맞춘 몸 위치가 아니라 부드럽게 따라가는 위치에 (2칸씩 툭툭 튀며 떨리지 않게)
  }
  function drawRoll(P, rp, post) { // 하비 구르기: 그레이브와 같은 단계 · 같은 높이 · 말림은 몸 한가운데를 축으로 90°씩
    const key = rp ? rp.key : post, rows = HR[key].map(r => [...r]), c = art('roll_' + key, rows), f = H.rollF || 1;
    const gx = snap2(P.x) + snap2(H.ox || 0), gy = snap2(P.y) + snap2(H.oy || 0), lift = rp ? rp.lift : post === 'up' ? 2 : 0, top = gy - c.height + 2 - lift;
    drawShadow(gx, gy + 1, lift > 6 ? 6 : 8);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (rp && rp.rot) { const rot = Math.round(Math.abs(rp.rot) / (Math.PI / 2)) * Math.PI / 2 * f, cy = top + c.height / 2; ctx.translate(gx, cy); ctx.rotate(rot); if (f < 0) ctx.scale(-1, 1); ctx.drawImage(c, -footX, -c.height / 2); }
    else { ctx.translate(gx, 0); if (f < 0) ctx.scale(-1, 1); ctx.drawImage(c, -footX, top); }
    ctx.restore();
    if (!rp || !rp.air) { const h0 = hand(), hx = h0.x - H.x + gx, hy = h0.y - H.y + gy - lift; drawBlade(SG, hx, hy, H.ang); } // 공중에선 총을 그리지 않음 (그레이브와 같음)
    if (H.sayT > 0 && H.bub) drawBubble(H.say, H.bub.x, H.bub.y - 34);
  }
  function ents(list) { if (H) list.push({ y: H.y, d: draw }); }
  return { start, update, ents, threat, get on() { return !!H; }, _H: () => H };
})();
;

// ==================================================================== 26_casings.js
// v3.16 탄피: 총을 쏠 때마다 총 뿌리에서 탄피가 튀어 나와 바닥에 떨어져 잠깐 굴렀다가 사라짐
// 그레이브 = 금색 탄피 (고래 작살총 제외) · 하비 = 빨간 산탄 탄피 (끝은 놋쇠)
// 칸(2px) 단위 도트 · 공중에서는 가로 → 세로 → 뒤집은 가로 → 뒤집은 세로로 칸 단위 회전 · 바닥에 닿으면 한 번 튀고 눕는다
var CASING = (() => {
  const C = 2;
  const PAL = {
    k: '#0b0a0e',
    H: '#fff0a8', Y: '#e8b84a', d: '#9a6a1a',                // 금색 탄피: 밝은 면 · 몸통 · 그늘(테두리 쪽)
    h: '#ff9a80', R: '#d8402e', r: '#8a1c1c', B: '#e8b84a', b: '#9a6a1a', // 빨간 산탄 탄피: 밝은 면 · 몸통 · 그늘 · 놋쇠 머리
  };
  const SPR = { // 누운 모양 (오른쪽이 뒤끝) — 바깥 외곽선은 그릴 때 1칸 둘러 붙임
    gold: ['HYd', 'Ydd'],
    red: ['hRRB', 'rrrb'],
  };
  const OUTLINE = true;
  const tr = rows => rows[0].split('').map((_, x) => rows.map(r => r[x]).join(''));        // 가로 ↔ 세로
  const mir = rows => rows.map(r => r.split('').reverse().join(''));                        // 좌우 뒤집기
  const FR = {}; for (const k in SPR) { const a = SPR[k]; FR[k] = [a, tr(a), mir(a), mir(tr(a))]; }
  const CV = {};
  function art(kind, f) {
    const key = kind + f; if (CV[key]) return CV[key];
    const rows = FR[kind][f], w = rows[0].length, h = rows.length, o = OUTLINE ? 1 : 0;
    const c = document.createElement('canvas'); c.width = (w + o * 2) * C; c.height = (h + o * 2) * C; const g = c.getContext('2d');
    if (o) { g.fillStyle = PAL.k; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillRect((x + o + dx) * C, (y + o + dy) * C, C, C); }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { g.fillStyle = PAL[rows[y][x]]; g.fillRect((x + o) * C, (y + o) * C, C, C); }
    return (CV[key] = c);
  }
  let room = null;
  const list = () => { const R = G.dun && G.dun.cur; if (room !== R) { room = R; G.casings = []; } return (G.casings = G.casings || []); };
  // x, y: 총 뿌리 위치(화면상) · ground: 그 사람이 서 있는 바닥 y · ang: 겨눈 방향
  function spawn(kind, x, y, ground, ang) {
    const L = list(); if (L.length > 48) L.shift();
    const back = Math.cos(ang) >= 0 ? -1 : 1;                                // 겨눈 쪽 반대로 튀어 나감
    L.push({ kind, x, gy: ground + rand(-3, 3), z: Math.max(4, ground - y), vx: back * rand(40, 80), vy: rand(-12, 12), vz: rand(110, 150), spin: rand(0, 4), lie: Math.random() < 0.5 ? 0 : 2, bounce: 0, rest: 0, life: 1.8 });
  }
  function update(dt) {
    if (!G || !G.dun) return; const L = list();
    for (const s of L) {
      if (s.rest) { s.life -= dt; continue; }
      { // v3.16 장애물·벽에 막힘: 바닥 자리(x, gy)로 검사해 부딪히면 튕겨 나옴 (장애물 위로 올라가지 않게)
        const nx = s.x + s.vx * dt, ny = s.gy + s.vy * dt, hit = (x, y) => x < A.x0 + 2 || x > A.x1 - 2 || y < A.y0 + 2 || y > A.y1 - 2 || solidAt(x, y, 2);
        if (!hit(nx, ny)) { s.x = nx; s.gy = ny; }
        else if (!hit(nx, s.gy)) { s.x = nx; s.vy = -s.vy * 0.4; }
        else if (!hit(s.x, ny)) { s.gy = ny; s.vx = -s.vx * 0.4; }
        else { s.vx = -s.vx * 0.4; s.vy = -s.vy * 0.4; }
      }
      s.z += s.vz * dt; s.vz -= 520 * dt; s.spin += dt * 18;
      if (s.z <= 0 && G.obs && G.obs.length && obsHitL(G.obs, s.x, s.gy, 1, false)) { s.life = 0; continue; } // 구덩이에 떨어지면 사라짐
      if (s.z <= 0) { s.z = 0; if (!s.bounce) { s.bounce = 1; s.vz = -s.vz * 0.35; s.vx *= 0.5; s.vy *= 0.5; } else { s.rest = 1; s.vx = s.vy = s.vz = 0; } }
    }
    G.casings = L.filter(s => s.life > 0);
  }
  function drawOne(s) {
    if (s.rest && s.life < 0.45 && Math.floor(s.life * 14) % 2) return;     // 사라지기 직전엔 깜빡임
    const f = s.rest ? s.lie : Math.floor(s.spin) % 4, c = art(s.kind, f);
    const x = snap2(s.x) - (c.width >> 1) & ~1, y = snap2(s.gy - s.z) - c.height;
    ctx.drawImage(c, x, y);
  }
  function ents(ents) { if (!G || !G.casings) return; for (const s of G.casings) ents.push({ y: s.gy - 1, d: () => drawOne(s) }); }
  return { spawn, update, ents, art };
})();
;
