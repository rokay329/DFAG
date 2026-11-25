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
