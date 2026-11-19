// 잿빛 왕관 토벌대 — 19_scenery34.js : v2.82 3·4장 배경 · 장애물 다시 그림 (토템 · 부락 바위 · 방책 말뚝 · 가죽 천막 · 망루 · 울타리 벽 장식 · 바닥 자국 / 깨진 종 · 부서진 마차 · 재 둔덕)
window.SCN34 = {"totem": [[".kwk.......kWk.", "..kwkkkkkkkWk..", "...kwwwwWWWk...", "....kwKwKWk....", "...kkwwKWWkk...", "..kddDDDDDDDk..", "..khhllldddDk..", ".klhhKKlKDDDDk.", "kllohrlhdrDDDDk", ".kohhlldddDOkk.", ".kohhwKwKDDOOk.", ".kohhlllddDDOk.", "kokdhDDDDDDDOOk", "kykhlllldDdDkOk", "skkhhKKlKKDDkrk", "k.khhylhdyDDkkR", "..khhllddDDDk.k", "..khhrRrRrDDk..", "..khhlllddDDk..", "..kddDDDDDDDk..", "..khlllldddDk..", ".klhhKKlKKDDDk.", "kllhhrlhdDDDDDk", ".kkhhlldddDDkk.", "..khhwKwKwDDk..", ".kWhhllldDDBk..", ".kmMmMmMmMmMWk.", ".kmmmmMMmMmmmk."], [".kwk.......kWk.", "..kwkkkkkkkWk..", "...kwwwwWWWk...", "....kwKwKWk....", "...kkwwKWWkk...", "..kddDDDDDDDk..", "..khhllldddDk..", ".klhhKKlKDDDDk.", "kllohrlhdrDDDDk", ".kohhlldddDOkk.", ".kohhwKwKDDOOk.", ".kohhlllddDDOk.", "kokdhDDDDDDDOOk", "kykhlllldDdDkOk", "skkhhKKlKKDDkrk", "k.khhylhdyDDkkR", "..khhllddDDDk.k", "..khhrRrRrDDk..", "..khhlllddDDk..", "..kddDDDDDDDk..", "..khlllldddDk..", ".klhhKKlKKDDDk.", "kllhhrlhdDDDDDk", ".kkhhlldddDDkk.", "..khhwKwKwDDk..", ".kWhhllldDDBk..", ".kmMmMmMmMmMWk.", ".kmMmMMmMMMmMk."]], "wall": {"hide": ["oooooooooooooo", "OOWOOOOOOOOWOO", "kksssbbbbBBkkk", ".ksssbbbbBBk..", "kssssrbrrBBBk.", "kssssbrrbBBBk.", "kWsssrrrrBBBWk", "kbbbbbrrbBBBk.", "kbbbbbrrbBsBk.", ".kbBbbbbbBBk..", ".kbbRbbbbRBk..", ".kbbbbRbbBBk..", "..kbbbbbbBk...", "...kkkkkkk....", ".............."], "skull": ["sk....k....ko", "ksk.kkwkk.kok", "kskkwwwWWkkok", ".kswwwwWWWok.", "..kwKKwKKWk..", "..kWWWWWWWk..", "...kWWKWWk...", "...kWWWWWk...", "....kwkwk....", ".....kOk.....", ".....kOk....."], "banner": ["oooooooooooo", "OOOOOOOOOOOO", "krwrrrRRRWRk", "krrwrrRRWRRk", "krrrwwWWRRRk", "krrrwKKWRRRk", "krrrwwWWRRRk", "krrrrWWRRRRk", "krrrrrRRRRRk", "krrrrrRRRRRk", "kyoyoyoyoyok", "krrrrrRRRRRk", "krkkrrRkkRRk", "krkkrkRkkRk.", "krk.k.k.krk.", ".k.krk...k.."], "spikes": [".kk.kwrk.kk..k.", "kwrkkwWkkwrkkrk", "kwWkkhdkkwWkwWk", "khdkkhdkkhdkwWk", "khdkkhdkkhdkhdk", "ooooooooooooooo", "OOOOOOOOOOOOOOO", "khdkkhdkkhdkhdk", ".kk..kk..kk.kk."]}, "dec": {"bone1": ["wkkkkkkw", "kwwwwwwk", "WWWWWWWW", "kkkkkkkk"], "bone2": ["...kwk", "..kkwW", ".kwwWk", "kkwWk.", "wwWk..", "kWk..."], "jaw": ["wwwwww", "WwkwkW", "Wk.kkW", "k....k"], "peb1": ["...kkk", ".kkggg", "kGGGGG", ".kkkkk"], "peb2": [".kkk.", "knggk", "ggggg", "kGGGk"], "straw1": ["ksykyk", "ksykyk", "kssoyk", "kysoyk", "kysoyk"], "straw2": ["yyyykkk", "kkkkooo", "ooookkk"]}, "decPal": {"k": "#0b0806", "w": "#d8cfbc", "W": "#a89f8c", "g": "#6a5a4a", "G": "#4a3c30", "n": "#8a7a68", "y": "#a08040", "s": "#c8a060", "o": "#6a5428"}, "ash": {"m1": [".kkkkkk.", "kaabbcck", "kaabbbck", "cbdbbdbc"], "m2": ["..kkkkkkkk..", ".kaaabbccck.", "kaaaabbbbcck", "kaaaabbbbbck", "cddbbbdbbbcc"], "m3": ["...kkkkkkkkkk...", "..kaaaacccccck..", ".kaaaaabbbbbcck.", "kaaaaaabbbbbbcck", "kaaaaaabbbbbbbck", "ccbddbdbbddbbbcc"], "ember": ["kekdk", "deEdd", "kkkkk"]}, "ashPal": {"k": "#1e1c1a", "a": "#9a948a", "b": "#7e786e", "c": "#625c54", "d": "#3a3632", "e": "#ff7a30", "E": "#ffc070"}};
(() => {
  const R2 = (x, y, s = 0) => { const v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.7) * 43758.5453; return v - Math.floor(v); };
  const T = window.SCN34 || {};

  // ---------------- 3장 ----------------
  genTotem = function () { return fromRows(pick(T.totem)); };
  for (const k in T.wall) ORC_WALL_MAPS[k] = T.wall[k];

  // 부락 바위: 이끼 대신 흙먼지 · 붉은 흙 (1장 바위와 같은 모양, 색만)
  const _rock = rockCanvas, ROCK3 = Object.assign({}, DECO, { G: '#a89e8e', g: '#7c7266', d: '#544a40', D: '#3a322a', m: '#6a5238', M: '#8a6a44' });
  rockCanvas = function (r) {
    if (!(G && G.stage === 3)) return _rock(r);
    const m = DECO_MAPS[r > 17 ? 'rockObsL' : 'rockObsS'], w = m[0].length * 2, h = m.length * 2, [c, cx] = mkCanvas(w + 4, h + 2);
    cx.fillStyle = 'rgba(0,0,0,.35)'; for (let x = 4; x < w; x += 2) cx.fillRect(x, h - 2, 2, 2);
    stamp(cx, m, ROCK3, 2, 0, 2, Math.random() < 0.5); return c;
  };

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
  // 부서진 마차: 비스듬히 주저앉은 짐칸(판자 · 틈 · 쇠테) · 앞면 옆판 · 남은 바퀴 하나 + 빠져 누운 바퀴 · 부러진 끌채 · 쏟아진 상자와 자루 · 위에 쌓인 재
  genCart = function (wc, hc) {
    const HH = 9, W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0), sd = rand(0, 99);
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && x <= wc && y >= 1 && y < H0 - 1) g[y][x] = c; };
    const tilt = x => Math.round((x / wc) * 2); // 오른쪽이 주저앉음
    for (let x = 1; x <= wc; x++) for (let y = 1 + tilt(x); y <= hc + tilt(x); y++) { const plank = Math.floor((x - 1) / 4), seam = (x - 1) % 4 === 3, brk = R2(plank, 2, sd) < 0.15 && y > hc / 2 + tilt(x);
      set(x, y, brk ? 'c' : seam ? 'D' : y === 1 + tilt(x) ? 'h' : ((x - 1) % 4 === 1 && (y + plank * 3) % 7 < 3) ? 'd' : R2(plank, 5, sd) < 0.5 ? 'l' : 'h'); } // 판자 · 결 · 부서진 틈
    for (let x = 1; x <= wc; x++) { set(x, hc + tilt(x) + 1, 'D'); for (let y = hc + tilt(x) + 2; y <= hc + HH - 3 + tilt(x); y++) set(x, y, (y - hc - tilt(x)) % 3 === 1 ? 'D' : x === 1 ? 'l' : 'd'); }
    for (const fx of [3, wc - 2]) for (let y = 1 + tilt(fx); y <= hc + HH - 3 + tilt(fx); y++) set(fx, y, (y % 5) ? 'D' : 'w'); // 쇠테 (못 머리)
    // 남은 바퀴 (왼쪽)
    { const wx = Math.round(wc * 0.22), wy = hc + HH - 3, R = 4; for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y); if (d > R + 0.3) continue; set(wx + x, wy + y, d > R - 0.8 ? (x + y < 0 ? 'w' : 'W') : d < 1.2 ? 'w' : (x === 0 || y === 0 || x === y) ? 'W' : 'c'); } }
    // 빠져 누운 바퀴 (오른쪽 아래, 납작한 타원)
    { const wx = Math.round(wc * 0.8), wy = H0 - 4; for (let y = -2; y <= 2; y++) for (let x = -5; x <= 5; x++) { const d = Math.hypot(x / 5, y / 2); if (d > 1.05) continue; set(wx + x, wy + y, d > 0.75 ? (y < 0 ? 'w' : 'W') : d < 0.25 ? 'w' : (x === 0) ? 'W' : 'c'); } }
    // 부러진 끌채
    for (let i = 0; i < 5 && wc > 10; i++) { set(2 + i, hc + 3 + (i >> 1), 'W'); set(2 + i, hc + 4 + (i >> 1), 'D'); }
    // 쏟아진 상자 · 자루
    { const bx = Math.round(wc * 0.55), by = Math.round(hc * 0.4); for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) set(bx + x, by + y, y === 0 ? 'h' : x === 4 ? 'D' : (x + y) % 3 ? 'l' : 'd'); set(bx + 2, by + 1, 'D'); }
    { const sx = Math.round(wc * 0.3), sy = Math.round(hc * 0.5); for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) if (Math.hypot(x / 3, y / 2) < 1) set(sx + x, sy + y, x + y < 0 ? 'w' : 'W'); set(sx, sy - 2, 'D'); }
    // 재 더미
    const mx = rand(wc * 0.35, wc * 0.65), mr = rand(wc * 0.3, wc * 0.45);
    for (let y = 1; y <= hc + 2; y++) for (let x = 1; x <= wc; x++) { if (g[y][x] === '.') continue; const q = Math.hypot((x - mx) / mr, (y - hc * 0.45) / (hc * 0.4)) + Math.sin(x * 0.9 + y * 0.5) * 0.08; if (q < 1) g[y][x] = q < 0.55 ? ((x - mx) + (y - hc * 0.45) < -2 ? 'a' : 'A') : (q < 0.8 ? 'A' : (R2(x, y, sd) < 0.5 ? 'A' : g[y][x])); } // 재 둔덕 (덩어리)
    if (Math.random() < 0.6) { const x = randi(3, wc - 2); set(x, 3, 'e'); set(x + 1, 3, 'c'); }
    ashCap(g); return { g: gOutline(g), HH };
  };
})();
