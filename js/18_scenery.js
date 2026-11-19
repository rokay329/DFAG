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
