'use strict';
// 잿빛 왕관 토벌대 — 22_house4.js (v2.88) : 4장 고유 벽 장애물 「불탄 집」 (시안 _작업자료/시안/4장_성벽_집_적용예시2.html)
// 위에서 본 기와 지붕(용마루 · 내려앉은 구멍 · 재) + 정면(목조 벽 · 6×7 창 · 7×11 문 · 돌 밑단). 폭 24칸 미만이면 05에서 성벽 덩어리로
const HOUSE4 = (() => {
  const PAL = { k: '#0b0a09', a: '#d4cec2', A: '#a8a296', h: '#8e887e', l: '#6e6860', d: '#4e4a44', D: '#34312d', w: '#6a5240', W: '#4a3a2e', c: '#2e241c', C: '#1a1410',
    i: '#7c7a84', I: '#55535c', j: '#3a3940', J: '#26252b', g: '#d8b860', G: '#a08038', o: '#6e5626', O: '#f0dc98', r: '#a83a34', R: '#7a2428', q: '#4e181c',
    e: '#ff9a40', E: '#d0501c', y: '#ffe08a', b: '#56545c', B: '#3c3b42', s: '#5a6670', p: '#c8b898', P: '#9a8a6a', n: '#b07a50', N: '#7a5034' };
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
  return { gen, pal: PAL };
})();
