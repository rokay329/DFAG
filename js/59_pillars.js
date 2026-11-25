'use strict';
// 잿빛 왕관 원정대 — 59_pillars.js : v3.29 2장 · 4장 뒷벽(윗벽) 기둥 퀄리티 업
//  · 2장 성채 석주: 맨 위 주두(판 · 쇠시리 · 목띠) · 마름돌을 쌓은 네모 기둥(돌마다 줄눈 · 왼쪽 빛 · 오른쪽 그늘 · 이 빠진 모서리 · 잔금 · 밑동 이끼) · 받침(둥근 띠 + 주춧돌)
//  · 4장 왕실 석주: 맨 위 주두(판 위 재 · 금 소용돌이 · 금 목띠) · 세로 홈 원기둥(홈마다 빛 받는 날 · 남은 금박) · 아래로 갈수록 그을음 · 잔금 · 받침(금 띠 · 주춧돌 위 재)
//  · 칸 = 2px · 가로 15칸(외곽선 포함) · 둘레 외곽선은 gOutline
const PILLARGEN = (() => {
  const hs = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  const BAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], dith = (x, y, t) => t * 16 > BAY[y & 3][x & 3];
  const W = 15, C = 7; // 가운데 칸
  const PAL2 = { k: '#08070b', a: '#5a566a', b: '#4a4658', c: '#3c3848', d: '#302d3a', e: '#24212c', f: '#18161e', m: '#3a4632', n: '#2a3424' };
  // 2장: rows = 그림 높이(칸) — 맨 아래 한 줄은 외곽선 자리(바닥 첫 칸)
  function gen2(rows, sd) {
    const g = Array.from({ length: rows }, () => Array(W).fill('.')), put = (x, y, c) => { if (y >= 0 && y < rows && x >= 0 && x < W) g[y][x] = c; };
    const bot = rows - 2; // 실제로 칠하는 마지막 줄
    // 주두
    for (let x = 1; x <= 13; x++) { put(x, 0, x < 12 ? 'a' : 'c'); put(x, 1, x < 3 ? 'b' : x > 11 ? 'e' : 'd'); }
    for (let x = 2; x <= 12; x++) { put(x, 2, x < 4 ? 'a' : x > 10 ? 'd' : 'b'); put(x, 3, x < 4 ? 'c' : x > 10 ? 'f' : 'e'); }
    for (let x = 3; x <= 11; x++) { put(x, 4, x < 6 ? 'a' : x > 9 ? 'd' : 'c'); put(x, 5, 'f'); }
    // 받침 (아래 7줄): 둥근 띠 2줄 + 주춧돌 4줄
    const b0 = bot - 6;
    for (let x = 2; x <= 12; x++) { put(x, b0, x < 4 ? 'a' : x > 10 ? 'd' : 'b'); put(x, b0 + 1, x < 4 ? 'c' : x > 10 ? 'f' : 'd'); }
    for (let y = b0 + 2; y <= bot; y++) for (let x = 1; x <= 13; x++) put(x, y, y === b0 + 2 ? (x < 12 ? 'a' : 'c') : y === bot ? 'e' : x < 3 ? 'b' : x > 11 ? 'e' : 'c');
    // 기둥 몸: 마름돌 (돌마다 높이가 조금씩 다름)
    const shade = x => x === 3 ? 'b' : x === 4 ? 'a' : x <= 6 ? 'b' : x <= 8 ? 'c' : x === 9 ? 'd' : 'e';
    let jy = 6 + Math.floor(hs(sd, 1) * 4), blk = 0;
    for (let y = 6; y < b0; y++) {
      const joint = y === jy; if (joint) { blk++; jy += 7 + Math.floor(hs(sd, blk + 3) * 4); }
      for (let x = 3; x <= 11; x++) { let c = joint ? 'f' : shade(x); if (!joint && y === jy - (jy - y) && false) c = 'a'; put(x, y, c); }
      if (!joint && g[y - 1] && g[y - 1][5] === 'f') for (let x = 4; x <= 7; x++) put(x, y, 'a'); // 줄눈 아래 돌 윗면 빛
      if (joint) { if (hs(sd, blk * 5) < 0.5) { put(3, y + 1, 'e'); put(3, y - 1, 'e'); } if (hs(sd, blk * 7) < 0.4) { put(11, y + 1, 'f'); put(10, y + 1, 'e'); } } // 이 빠진 모서리
    }
    // 잔금 (돌 두세 장에)
    for (let k = 0; k < 3; k++) { const y0 = 10 + Math.floor(hs(sd, 20 + k) * Math.max(1, b0 - 22)); let x = 5 + Math.floor(hs(sd, 30 + k) * 4); for (let i = 0; i < 5; i++) { if (g[y0 + i] && g[y0 + i][x] !== 'f') put(x, y0 + i, 'e'); if (hs(sd + i, k) < 0.5) x += hs(sd, i + k) < 0.5 ? -1 : 1; x = Math.max(4, Math.min(10, x)); } }
    // 밑동 이끼
    for (let y = b0 - 10; y < b0 + 2; y++) for (let x = 2; x <= 6; x++) if (g[y] && g[y][x] !== '.' && g[y][x] !== 'f' && hs(x * 3 + sd, y) < (y - (b0 - 10)) / 22) put(x, y, hs(x, y + sd) < 0.5 ? 'm' : 'n');
    return gOutline(g);
  }
  // 4장 (24_wall4 PAL 글자 그대로): k a h l d D j g G o
  function gen4(rows, sd) {
    const g = Array.from({ length: rows }, () => Array(W).fill('.')), put = (x, y, c) => { if (y >= 0 && y < rows && x >= 0 && x < W) g[y][x] = c; };
    const bot = rows - 2;
    // 주두: 판(위에 재) · 금 소용돌이 · 둥근 받침 · 금 목띠
    for (let x = 1; x <= 13; x++) { put(x, 0, hs(x, sd) < 0.6 ? 'a' : 'h'); put(x, 1, x < 12 ? 'l' : 'd'); put(x, 2, x < 3 ? 'd' : x > 11 ? 'D' : 'd'); }
    for (const [x, f] of [[1, 1], [13, -1]]) { put(x, 3, 'G'); put(x + f, 3, 'g'); put(x, 4, 'g'); put(x + f, 4, 'o'); }
    for (let x = 3; x <= 11; x++) { put(x, 3, x < 6 ? 'h' : x > 9 ? 'D' : 'l'); put(x, 4, x < 6 ? 'l' : x > 9 ? 'D' : 'd'); }
    for (let x = 3; x <= 11; x++) { put(x, 5, x < 7 ? 'g' : x > 9 ? 'o' : 'G'); put(x, 6, 'o'); }
    // 받침: 금 띠 · 둥근 띠 · 주춧돌(위에 재)
    const b0 = bot - 7;
    for (let x = 3; x <= 11; x++) { put(x, b0, x < 7 ? 'g' : x > 9 ? 'o' : 'G'); put(x, b0 + 1, 'o'); }
    for (let x = 2; x <= 12; x++) { put(x, b0 + 2, x < 4 ? 'h' : x > 10 ? 'D' : 'l'); put(x, b0 + 3, x < 4 ? 'l' : x > 10 ? 'j' : 'd'); }
    for (let y = b0 + 4; y <= bot; y++) for (let x = 1; x <= 13; x++) put(x, y, y === b0 + 4 ? (hs(x, sd + 9) < 0.55 ? 'a' : 'h') : y === bot ? 'D' : x < 3 ? 'h' : x > 11 ? 'D' : 'l');
    // 기둥 몸: 세로 홈 — 홈(어둠) 양옆에 빛 받는 날
    const FL = ['l', 'h', 'l', 'd', 'h', 'l', 'd', 'D', 'd']; // 3..11
    for (let y = 7; y < b0; y++) for (let x = 3; x <= 11; x++) put(x, y, x === 3 ? 'h' : x === 11 ? 'D' : FL[x - 3]);
    for (let y = 7; y < b0; y++) for (const x of [5, 8]) if ((y + sd) % 9 === 0) put(x, y, 'l'); // 홈 마디
    // 남은 금박 (홈 위쪽에 띄엄띄엄)
    for (let y = 8; y < Math.min(b0, 30); y++) for (const x of [4, 7]) if (hs(x + sd, y) < 0.16) put(x, y, hs(y, x) < 0.5 ? 'g' : 'G');
    // 아래로 갈수록 그을음 (디더)
    const H = b0 - 7; for (let y = 7; y < b0; y++) { const t = Math.max(0, (y - 7) / H - 0.45) * 1.6; for (let x = 3; x <= 11; x++) if (dith(x, y, t * (x > 7 ? 1 : 0.7))) put(x, y, x > 7 ? 'j' : 'D'); }
    // 잔금
    for (let k = 0; k < 2; k++) { let x = 5 + Math.floor(hs(sd, 40 + k) * 4); const y0 = 12 + Math.floor(hs(sd, 50 + k) * Math.max(1, b0 - 24)); for (let i = 0; i < 6; i++) { put(x, y0 + i, 'j'); if (hs(sd + i, k + 7) < 0.45) x += hs(i, k + sd) < 0.5 ? -1 : 1; x = Math.max(4, Math.min(10, x)); } }
    return gOutline(g);
  }
  return { gen2, gen4, PAL2, W };
})();
