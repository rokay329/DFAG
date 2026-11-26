'use strict';
// 잿빛 왕관 원정대 — 11d_truth.js : 진엔딩 루트 단서 (v2.58~)
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다.
// 1장 「구덩이 실험실의 마법사」: 폭발의 흔적 → 문 앞의 점액 → 점액 묻은 나무 뒤 틈 → 숨은 방 점액 웅덩이 → 구덩이 실험실 · 키륵의 의뢰
//   → 점액왕 그로기 때 몸속 일지 꺼내기 → 일지 돌려주기 → 진실 기록 「마법사의 일지」 (SAVE.truth.t1)
// 그림은 시안(_작업자료/시안/실험실의뢰_시안.html)과 같은 코드: 칸(2px) 좌표로 g에 그린다. 게임에서는 g = ctx를 옮겨서(at) 쓰거나 한 번 구워(bake) 쓴다.

  const TRUTH = (() => {
  let g = null;
  function __mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
function px(cx, cy, col) { g.fillStyle = col; g.fillRect(cx * 2, cy * 2, 2, 2); }
// 디더 광원 (칸 단위)
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function glow(cx, cy, r, rgb, a = 0.5, ry) {
  ry = ry || r * 0.75; g.save(); g.globalCompositeOperation = 'lighter';
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const d = Math.hypot((x - cx) / r, (y - cy) / ry); if (d >= 1) continue;
    const k = (1 - d) * a, b = BAY[((y & 3) << 2) | (x & 3)] / 16; if (k * 1.6 < b) continue;
    g.fillStyle = `rgba(${rgb},${Math.min(0.5, k * 0.55)})`; g.fillRect(x * 2, y * 2, 2, 2);
  }
  g.restore();
}

function prompt(text, x, y, t) {
  x *= 2; y *= 2; g.save(); g.font = '9px Galmuri9'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const w = g.measureText(text).width + 10, X = Math.round(x), Y = Math.round(y + Math.sin(t * 4) * 1.5);
  g.fillStyle = 'rgba(10,8,14,.85)'; g.fillRect(X - w / 2, Y - 10, w, 14);
  g.strokeStyle = '#c9a24a'; g.lineWidth = 1; g.strokeRect(X - w / 2 + 0.5, Y - 9.5, w - 1, 13);
  g.fillStyle = '#ffe9b0'; g.fillText(text, X, Y); g.restore();
}

// ================================================================ 1장 「무너진 실험실의 마법사」 시안 v2 (칸 = 2px)
function hh(x, y) { let n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
const dth2 = (x, y) => BAY[((y & 3) << 2) | (x & 3)] / 16;
const OUTK = '#0b0a0e';
const SL = ['#e0ffb0', '#b0f070', '#7ad050', '#4e9a30', '#2e6a1c', '#1c4212', '#0e220a']; // 점액 초록
const SD = ['#e4f6a0', '#c4e670', '#a2cc48', '#7eaa30', '#5a8420', '#3c5c14', '#22380a']; // 굳은 점액 (연두)
const WD = ['#8a6a48', '#6a4c32', '#4e3622', '#3a2818', '#2a1c10', '#1c120a']; // 나무
const IR = ['#8a8794', '#6a6774', '#504d5a', '#3a3844', '#2a2832', '#1c1a22']; // 쇠
// 칸 격자 → 자동 외곽선
function Cv(w, h) { const t = Array.from({ length: h }, () => Array(w).fill(null)); return { w, h, t, set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) t[y][x] = c; }, get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? t[y][x] : null; } }; }
function drawCv(C, ox, oy, outline = true) {
  for (let y = -1; y <= C.h; y++) for (let x = -1; x <= C.w; x++) { const v = C.get(x, y); if (v == null) { if (outline && (C.get(x + 1, y) || C.get(x - 1, y) || C.get(x, y + 1) || C.get(x, y - 1))) px(ox + x, oy + y, OUTK); continue; } if (v !== 'x') px(ox + x, oy + y, v); }
}
function rowsCv(rows, pal) { const C = Cv(rows[0].length, rows.length); rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) C.set(x, y, pal[ch]); })); return C; }
function shadowE(cx, cy, rx, ry, a = 0.55) { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const d = (x / rx) ** 2 + (y / ry) ** 2; if (d <= 1 && dth2(cx + x, cy + y) < (1 - d) * a * 1.7) px(cx + x, cy + y, 'rgba(4,3,6,.7)'); } }

// ---- ① 폭발의 흔적
function scorch(cx, cy, r, ang) {
  for (let y = -r; y <= r; y++) for (let x = -Math.round(r * 1.6); x <= Math.round(r * 1.6); x++) {
    const d = Math.hypot(x / 1.6, y) / r; if (d > 1) continue;
    const a = Math.atan2(y, x / 1.6), streak = 0.5 + 0.5 * Math.cos(a - ang), ray = hh(Math.round(a * 9), 7) < 0.5;
    const k = (1 - d) * (0.6 + 0.4 * streak) * (ray ? 1.2 : 0.7);
    if (dth2(cx + x, cy + y) < k * 1.3) px(cx + x, cy + y, d < 0.4 ? '#0a0806' : d < 0.7 ? '#1a1410' : 'rgba(20,14,8,.8)');
  }
}
function scorchRays(cx, cy, r, ang) { for (let i = 0; i < 7; i++) { const a = ang + (i - 3) * 0.28, L = r * (1.3 + hh(i, cx) * 0.8); for (let s = Math.round(r * 0.5); s < L; s++) { const x = Math.round(cx + Math.cos(a) * s * 1.6), y = Math.round(cy + Math.sin(a) * s); if (hh(s, i) < 0.7) px(x, y, s > L * 0.75 ? '#2a2620' : '#12100c'); } } }
function glass(cx, cy, n = 5) { for (let i = 0; i < n; i++) { const x = cx + Math.round((hh(i, cy) - 0.5) * 18), y = cy + Math.round((hh(cx, i) - 0.5) * 8); px(x, y, '#bfe8f0'); if (i % 2) px(x + 1, y, '#5a8a9a'); } }
// 굳은 점액 덩이 (자연스러운 모양 · 탁한 색 · 윤기 한 점)
function slimeBlob(cx, cy, s = 3, seed = 1) {
  const C = Cv(s * 4 + 4, s * 2 + 4), ox = s * 2 + 2, oy = s + 2;
  for (let y = -s - 1; y <= s + 1; y++) for (let x = -s * 2 - 1; x <= s * 2 + 1; x++) {
    const a = Math.atan2(y, x / 2), r = s * (0.75 + 0.35 * Math.sin(a * 3 + seed) + 0.15 * Math.sin(a * 5 + seed * 2));
    const d = Math.hypot(x / 2, y); if (d > r) continue;
    C.set(ox + x, oy + y, d > r - 1 ? SD[4] : x + y * 2 < -2 ? SD[2] : SD[3]);
  }
  C.set(ox - Math.round(s * 0.6), oy - Math.round(s * 0.4), SD[0]);
  drawCv(C, cx - ox, cy - oy, false);
  for (let y = -1; y <= s * 2 + 3; y++) for (let x = -1; x <= s * 4 + 4; x++) if (!C.get(x, y) && (C.get(x + 1, y) || C.get(x - 1, y) || C.get(x, y + 1) || C.get(x, y - 1))) px(cx - ox + x, cy - oy + y, 'rgba(8,14,6,.75)');
}
// ---- ② 점액 자국: 큰 방울이 드문드문, 은은한 윤기만
function drip(cx, cy, s, t, i) {
  slimeBlob(cx, cy, s, i * 1.7);
  const k = 0.5 + 0.5 * Math.sin(t * 1.4 + i * 1.3);
  if (k > 0.55) { px(cx - Math.round(s * 0.6), cy - Math.round(s * 0.4), '#c8e890'); px(cx - Math.round(s * 0.6) + 1, cy - Math.round(s * 0.4), SD[1]); }
  if (k > 0.8) glow(cx, cy, s * 3, '140,200,90', 0.18, s * 2);
}

// ---- ③ 굳은 점액 막 (자연스러운 모양 · 흘러내림 · 박힌 잎)
const GATE = { cx: 88, cy: 66 };
function membraneShape(seed = 3) { const S = []; for (let y = -12; y <= 12; y++) for (let x = -24; x <= 24; x++) { const a = Math.atan2(y, x / 1.6), r = 9 * (0.8 + 0.16 * Math.sin(a * 2 + seed) + 0.1 * Math.sin(a * 5 + seed * 3) + 0.06 * Math.sin(a * 9 + 1)); if (Math.hypot(x / 1.6, y) <= r) S.push([x, y, Math.hypot(x / 1.6, y) / r]); } return S; }
const MEM = membraneShape();
function dirtRim(cx, cy, scale = 1) { for (const [x, y, d] of MEM) { const X = Math.round(x * 1.12), Y = Math.round(y * 1.18) + 1; if (d > 0.7) px(cx + X, cy + Y, hh(cx + X, cy + Y) < 0.5 ? '#2e2216' : '#3c2c1c'); } }
function membrane(state, t) { // 'whole' | 'crack' | 'open'
  const { cx, cy } = GATE;
  // 무너진 흙 둔덕 + 구멍 그늘
  dirtRim(cx, cy); for (let i = 0; i < 12; i++) { const a = hh(i, 2) * Math.PI * 2, r = 12 + hh(i, 3) * 6; px(Math.round(cx + Math.cos(a) * r * 2), Math.round(cy + Math.sin(a) * r * 0.9), i % 2 ? '#4a3a28' : '#2a2016'); }
  if (state === 'open') { ladderHole(cx, cy, t); return; }
  const C = Cv(52, 32), ox = 26, oy = 14;
  for (const [x, y, d] of MEM) {
    let c = d > 0.86 ? SD[4] : (x + y * 2 < -8 ? SD[2] : SD[3]); if (d < 0.6 && dth2(x, y) < 0.18) c = SD[2];
    if (hh(x + 40, y + 40) < 0.04) c = SD[1];
    C.set(ox + x, oy + y, c);
  }
  // 3/4 앞쪽 두께: 아래 가장자리 밑으로 2칸 (어두운 앞면)
  const has = new Set(MEM.map(([x, y]) => x + ',' + y));
  for (const [x, y] of MEM) if (!has.has(x + ',' + (y + 1))) { C.set(ox + x, oy + y + 1, SD[4]); C.set(ox + x, oy + y + 2, hh(x, 2) < 0.5 ? SD[5] : SD[4]); if (hh(x, 9) < 0.12) C.set(ox + x, oy + y + 3, SD[4]); }
  // 박힌 잎 · 잔가지 · 작은 뼈
  for (const [x, y, c] of [[-10, -2, '#5a4a20'], [-9, -2, '#7a6a30'], [8, 3, '#3a2a18'], [9, 3, '#3a2a18'], [10, 2, '#3a2a18'], [2, -4, '#a8a088'], [3, -4, '#a8a088']]) C.set(ox + x, oy + y, c);
  // 윤기 (왼쪽 위 빛)
  for (const [x, y] of [[-10, -4], [-9, -5], [-8, -5], [-7, -6], [-6, -6], [-5, -6], [-4, -6], [3, -5], [4, -5]]) C.set(ox + x, oy + y, SD[1]);
  for (const [x, y] of [[-8, -5], [-7, -6], [3, -5]]) C.set(ox + x, oy + y, '#c8e890');
  drawCv(C, cx - ox, cy - oy);
  // 천천히 부푸는 거품
  for (let i = 0; i < 5; i++) { const k = (t * 0.35 + i / 5) % 1, x = cx + Math.round((hh(i, 1) - 0.5) * 30), y = cy + Math.round((hh(i, 2) - 0.5) * 9); if (k < 0.4) { px(x, y, SD[1]); if (k > 0.2) px(x + 1, y - 1, '#c8e890'); } }
  if (state === 'crack') {
    const cr = [[0, 0], [1, -1], [2, -1], [3, -2], [4, -2], [5, -3], [-1, 1], [-2, 1], [-3, 2], [-4, 3], [-5, 3], [1, 1], [2, 2], [3, 3], [0, -2], [-1, -3], [-2, -4]];
    for (const [x, y] of cr) { px(cx + x, cy + y, '#070a05'); if (hh(x, y) < 0.4) px(cx + x, cy + y + 1, '#1c2814'); }
    glow(cx, cy, 16, '170,240,90', 0.25, 8);
  }
}
// 녹아 열린 구멍 + 사다리
function ladderHole(cx, cy, t) {
  for (let y = -15; y <= 15; y++) for (let x = -32; x <= 32; x++) { const a = Math.atan2(y, x / 2), r = 10 * (0.84 + 0.1 * Math.sin(a * 2 + 1.3) + 0.07 * Math.sin(a * 3 + 4)), d = Math.hypot(x / 2, y) / r; if (d > 1 && d < 1.28 && dth2(cx + x, cy + y) < (1.28 - d) * 4) px(cx + x, cy + y, d < 1.12 ? '#3a2c1c' : '#2e2216'); } // 흙 둑 (풀 없이 깨끗하게)
  for (const [x, y, d] of POND) px(cx + x, cy + y, d > 0.82 ? '#1a120c' : y < -4 ? '#0e0a08' : '#050404');
  // 터지고 남은 점액: 둘레 풀밭엔 모양 · 크기 제각각인 방울 몇 개 (점 · 길쭉한 튄 자국 · 작은 덩이)
  const SPOT = [['x'], ['xx'], ['.x', 'xx'], ['xxx', '.x.'], ['x..', '.xx'], ['xx.', '.xxx'], ['x'], ['.xx.', 'xxxx', '.x..']];
  for (const [dx, dy, k] of [[-25, -6, 7], [21, -9, 0], [27, 3, 4], [-16, 12, 1], [9, 13, 2], [-29, 3, 0], [15, -13, 5], [-8, -14, 0], [32, -3, 1]]) { const sh = SPOT[k]; sh.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== 'x') return; const X = cx + dx + i, Y = cy + dy + j; px(X, Y, j === 0 && i === row.indexOf('x') ? SL[2] : (i + j) % 3 === 2 ? SL[5] : SL[4]); })); }
  // 구멍 가장자리: 테두리를 따라 길게 늘어진 자국 · 짧게 묻은 곳 · 안으로 흘러내린 줄기 (길이 제각각)
  const rimAt = a => { const r = 10 * (0.84 + 0.1 * Math.sin(a * 2 + 1.3) + 0.07 * Math.sin(a * 3 + 4)); return [Math.round(cx + Math.cos(a) * r * 2), Math.round(cy + Math.sin(a) * r)]; };
  for (const [a0, len, drips] of [[0.15, 0.55, [2, 4]], [1.75, 0.3, [1]], [2.55, 0.12, []], [3.3, 0.7, [3, 1, 5]], [4.5, 0.18, [2]], [5.5, 0.08, []]]) {
    const n = Math.max(2, Math.round(len * 30)), seen = new Set();
    for (let i = 0; i <= n; i++) { const [x, y] = rimAt(a0 + len * i / n), k2 = x + ',' + y; if (seen.has(k2)) continue; seen.add(k2); const thick = i > n * 0.25 && i < n * 0.75 && len > 0.25; px(x, y, i % 4 === 1 ? SL[3] : SL[4]); if (thick) px(x, y + 1, SL[5]); if (i === Math.floor(n / 2)) px(x, y - 1, SL[2]); }
    drips.forEach((L, j) => { const [x, y] = rimAt(a0 + len * (j + 1) / (drips.length + 1)); for (let q = 1; q <= L; q++) px(x, y + q, q === L ? SL[3] : SL[5]); });
  }
  // 사다리 (구멍 아래로, 위 끝이 땅 위로 조금 나옴)
  const lx = cx - 4;
  for (let y = cy - 9; y <= cy + 7; y++) { const deep = y > cy - 2; const c1 = deep ? WD[3] : WD[1], c2 = deep ? WD[4] : WD[2]; px(lx, y, c1); px(lx + 1, y, c2); px(lx + 8, y, c1); px(lx + 9, y, c2); px(lx - 1, y, OUTK); px(lx + 10, y, OUTK); }
  for (let y = cy - 7; y <= cy + 6; y += 3) for (let x = lx + 2; x <= lx + 7; x++) { px(x, y, y > cy - 2 ? WD[3] : WD[1]); px(x, y + 1, y > cy - 2 ? WD[5] : WD[3]); }
  px(lx, cy - 10, OUTK); px(lx + 1, cy - 10, OUTK); px(lx + 8, cy - 10, OUTK); px(lx + 9, cy - 10, OUTK);
  glow(cx, cy + 3, 14, '255,180,100', 0.18, 6); // 아래 실험실 촛불빛
}
function acidBurst(cx, cy, t) { const k = (t * 1.2) % 1; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + hh(i, 4), r = 3 + k * 18 * (0.6 + hh(i, 5) * 0.6); const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r * 0.6 - Math.sin(k * 3) * 4); px(x, y, k < 0.5 ? '#e8ff80' : '#9ad040'); } glow(cx, cy, 26 * (1 - k * 0.5), '200,255,90', 0.5 * (1 - k), 14); }

// ================================================================ ④ 무너진 실험실
function magicCircle(cx, cy) { // 폭발로 반쯤 지워진 마법진
  const burn = (x, y) => Math.hypot((x - cx) / 2.2, y - cy) < 8 + hh(x, y) * 4;
  for (let a = 0; a < 220; a++) { const q = a / 220 * Math.PI * 2; for (const [r, ry, c] of [[40, 17, '#4e4060'], [34, 14, '#3e3250']]) { const x = Math.round(cx + Math.cos(q) * r), y = Math.round(cy + Math.sin(q) * ry); if (hh(a, r) < 0.82 && !burn(x, y)) px(x, y, c); } }
  for (let i = 0; i < 8; i++) { const q = i / 8 * Math.PI * 2, x = Math.round(cx + Math.cos(q) * 37), y = Math.round(cy + Math.sin(q) * 15.5); for (const [a, b] of [[0, 0], [1, 0], [0, -1], [-1, 0]]) if (hh(i, a + b) < 0.8) px(x + a, y + b, '#5a4a70'); }
  for (let i = 0; i < 3; i++) { const q = i / 3 * Math.PI * 2 + 0.5; for (let s = 0; s < 34; s++) { const x = Math.round(cx + Math.cos(q) * s), y = Math.round(cy + Math.sin(q) * s * 0.42); if (s > 9 && hh(i, s) < 0.7) px(x, y, '#3e3250'); } }
  scorch(cx, cy, 13, 0); scorchRays(cx, cy, 13, Math.PI * 0.1);
}
// 큰 무쇠 가마솥 (금 가고 굳은 점액이 넘쳐흐름)
function cauldron(cx, by) {
  const R = 15, H = 11, cy = by - 11, C = Cv(R * 2 + 6, H * 2 + 8), ox = R + 3, oy = H + 3;
  for (let y = -H + 3; y <= H; y++) for (let x = -R; x <= R; x++) {
    const d = Math.hypot(x / R, y / H); if (d > 1) continue;
    const nx = x / R, ny = y / H, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), l = -nx * 0.55 - ny * 0.45 + nz * 0.7;
    const f = 4.2 - l * 3.4, fl = Math.floor(f); C.set(ox + x, oy + y, IR[Math.max(0, Math.min(5, fl + (f - fl > dth2(x, y) ? 1 : 0)))]);
  }
  // 입구 테 (두꺼운 타원) + 안쪽 굳은 점액
  for (let y = -3; y <= 3; y++) for (let x = -R - 1; x <= R + 1; x++) { const d = (x / (R + 1)) ** 2 + (y / 3.2) ** 2; if (d > 1) continue; const inner = (x / (R - 2)) ** 2 + (y / 2) ** 2 <= 1; C.set(ox + x, oy - H + 3 + y, inner ? (y < 0 ? '#0e0c0a' : (dth2(x, y) < 0.5 ? SD[3] : SD[4])) : (y < 0 ? IR[0] : IR[2])); }
  // 금 (오른쪽)
  for (const [x, y] of [[7, -4], [8, -3], [8, -2], [9, -1], [9, 0], [10, 1], [9, 2], [8, 3], [8, 4], [9, 5]]) C.set(ox + x, oy + y, '#06050a');
  // 금 사이로 흘러나와 굳은 점액
  for (const [x, y] of [[10, 2], [11, 3], [11, 4], [12, 5], [12, 6], [13, 7], [12, 8], [13, 9]]) C.set(ox + x, oy + y, SD[3]);
  // 손잡이 고리
  for (const s of [-1, 1]) { const x = ox + s * (R + 1), y = oy - H + 6; C.set(x, y, IR[1]); C.set(x + s, y + 1, IR[2]); C.set(x, y + 2, IR[3]); }
  shadowE(cx + 2, by + 1, R + 4, 4, 0.7);
  drawCv(C, cx - ox, cy - oy);
  // 다리 셋
  for (const x of [-10, 0, 10]) { px(cx + x, by, IR[3]); px(cx + x + 1, by, IR[4]); px(cx + x, by + 1, OUTK); px(cx + x + 1, by + 1, OUTK); }
  slimeBlob(cx + 20, by - 1, 3, 4); slimeBlob(cx + 26, by + 2, 2, 7);
}
// 3/4 책장 (벽에 기대 선 것)
const BOOKC = ['#6a3430', '#34486a', '#5e5a32', '#44305a', '#4e402a', '#2a4e40'];
function bookshelf(x0, by, w = 22, h = 26, seed = 1) {
  const C = Cv(w, h + 3), top = 3;
  for (let y = 0; y < top; y++) for (let x = 0; x < w; x++) C.set(x, y, y === 0 ? WD[0] : WD[1]);
  for (let y = top; y < h + 3; y++) for (let x = 0; x < w; x++) C.set(x, y, x < 2 ? WD[2] : x >= w - 2 ? WD[3] : WD[5]);
  const shelves = [top + 7, top + 14, top + 21];
  for (const sy of shelves) for (let x = 2; x < w - 2; x++) { C.set(x, sy, WD[1]); C.set(x, sy + 1, WD[3]); }
  for (let si = 0; si < 3; si++) { const base = shelves[si] - 1; let x = 2; while (x < w - 3) { const r = hh(x + seed * 7, si); if (r < 0.14) { x += 2; continue; } const bh = 4 + Math.floor(hh(x, si + seed) * 3), bw = r > 0.8 ? 2 : 1, c = BOOKC[Math.floor(hh(x, si * 3 + seed) * 6)]; const lean = r > 0.92; for (let j = 0; j < bw; j++) for (let k = 0; k < bh; k++) C.set(x + j + (lean ? Math.floor(k / 3) : 0), base - k, k === bh - 1 ? '#c8bea4' : c); x += bw + (hh(x, 9) < 0.3 ? 1 : 0); } }
  // 점액 튄 자국
  for (let i = 0; i < 6; i++) C.set(3 + Math.floor(hh(i, seed) * (w - 6)), top + 2 + Math.floor(hh(seed, i) * (h - 4)), SD[3]);
  shadowE(x0 + w / 2 + 2, by + 1, w / 2 + 2, 2, 0.6);
  drawCv(C, x0, by - h - 2);
}
// 쓰러진 책장 (옆으로 누워 앞면이 위로)
function shelfFallen(x0, by, w = 32) {
  const C = Cv(w, 10);
  for (let y = 0; y < 10; y++) for (let x = 0; x < w; x++) { const edge = y < 2; C.set(x, y, edge ? (y === 0 ? WD[0] : WD[1]) : x % 11 < 2 ? WD[2] : y > 7 ? WD[4] : WD[5]); }
  for (let i = 0; i < 8; i++) { const x = 3 + i * 3 + (i > 3 ? 4 : 0); for (let y = 3; y < 7; y++) C.set(x, y, BOOKC[i % 6]); C.set(x, 3, '#c8bea4'); }
  shadowE(x0 + w / 2, by + 1, w / 2 + 2, 3, 0.6);
  drawCv(C, x0, by - 10);
  for (let i = 0; i < 5; i++) { const x = x0 + 4 + i * 6 + Math.floor(hh(i, 2) * 3), y = by + 2 + (i % 2); px(x, y, BOOKC[i]); px(x + 1, y, BOOKC[i]); px(x + 2, y, '#c8bea4'); px(x, y + 1, OUTK); px(x + 1, y + 1, OUTK); px(x + 2, y + 1, OUTK); }
}
// 실험대: 3/4 탁자 + 플라스크 · 증류기 · 펼친 책 · 초
function alchemyTable(x0, by, t) {
  const w = 34, C = Cv(w, 14);
  for (let y = 0; y < 5; y++) for (let x = 0; x < w; x++) C.set(x, y, y === 0 ? WD[0] : hh(x, y) < 0.08 ? WD[2] : WD[1]);
  for (let y = 5; y < 8; y++) for (let x = 0; x < w; x++) C.set(x, y, y === 7 ? WD[4] : WD[2]);
  for (const lx of [1, w - 3]) for (let y = 8; y < 14; y++) { C.set(lx, y, WD[3]); C.set(lx + 1, y, WD[4]); }
  shadowE(x0 + w / 2, by + 1, w / 2 + 2, 3, 0.6);
  drawCv(C, x0, by - 14);
  const ty = by - 12;
  // 둥근 플라스크 (점액 조금)
  const flask = (x, y, liq) => { for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) px(x + i, y + j, j > 0 && liq ? liq : 'rgba(170,220,230,.55)'); px(x, y - 3, 'rgba(170,220,230,.7)'); px(x, y - 4, '#7a5a3a'); px(x - 1, y - 1, '#e8fbff'); for (const [i, j] of [[-3, 0], [3, 0], [0, 3], [-2, 2], [2, 2], [-2, -2], [2, -2], [-1, -4], [1, -4], [-1, -3], [1, -3]]) px(x + i, y + j, OUTK); };
  flask(x0 + 6, ty + 1, SL[3]); flask(x0 + 12, ty + 2, null);
  // 증류기 (목이 긴 레토르트)
  for (let j = -2; j <= 2; j++) for (let i = -3; i <= 3; i++) if (i * i / 9 + j * j / 4 <= 1) px(x0 + 21 + i, ty + 1 + j, j > 0 ? '#8a5a2a' : 'rgba(170,220,230,.5)'); for (let i = 0; i < 7; i++) px(x0 + 24 + i, ty - 1 - Math.floor(i / 2), 'rgba(170,220,230,.8)');
  // 펼친 책 + 초
  for (let i = 0; i < 6; i++) { px(x0 + 27 + i, ty + 2, i === 3 ? '#8a7a5a' : '#e0d4b4'); px(x0 + 27 + i, ty + 3, '#c8bea4'); }
  px(x0 + 3, ty - 1, '#e8e0c8'); px(x0 + 3, ty, '#c8c0a8'); px(x0 + 3, ty - 2 - (Math.floor(t * 6) % 2), '#ffb040');
  glow(x0 + 3, ty - 2, 14, '255,170,80', 0.35, 9);
  // 깨진 플라스크 조각
  glass(x0 + 16, by + 3, 4);
}
// 표본 병 (점액이 든 유리병) — 하나는 깨짐
function jar(cx, by, broken, fill = 0.6) {
  const w = 7, h = 10, C = Cv(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if ((y === 0 || y === h - 1) && (x === 0 || x === w - 1)) continue; const lv = y > h - 1 - h * fill; C.set(x, y, y < 2 ? (y === 0 ? '#8a6a48' : '#6a4a30') : lv ? (x < 2 ? SL[3] : SL[4]) : (x === 1 ? 'rgba(220,245,255,.6)' : 'rgba(150,200,215,.35)')); }
  if (broken) { for (let y = 0; y < 5; y++) for (let x = 0; x < w; x++) C.set(x, y, null); C.set(1, 5, 'rgba(150,200,215,.5)'); C.set(5, 6, 'rgba(150,200,215,.5)'); for (let y = 5; y < h; y++) for (let x = 0; x < w; x++) if (C.get(x, y) && y < h - 3) C.set(x, y, 'rgba(150,200,215,.3)'); }
  shadowE(cx + 1, by + 1, 5, 2, 0.6);
  drawCv(C, cx - 3, by - h + 1);
  px(cx - 2, by - h + 4, '#ffffff');
  if (broken) slimeBlob(cx + 7, by + 1, 2, 5);
}
// 내려온 사다리 (북쪽 벽, 위 구멍에서 빛)
function labLadder(cx, topY, by, t) {
  for (let y = topY; y <= by; y++) { const k = (y - topY) / (by - topY); for (let x = -9; x <= 9; x++) if (dth2(cx + x, y) < (1 - Math.abs(x) / 9) * 0.35 * (0.4 + k)) px(cx + x, y, 'rgba(255,220,150,.22)'); }
  for (let y = topY; y <= by; y++) { px(cx - 4, y, WD[1]); px(cx - 3, y, WD[2]); px(cx + 4, y, WD[1]); px(cx + 5, y, WD[2]); px(cx - 5, y, OUTK); px(cx + 6, y, OUTK); }
  for (let y = topY + 2; y < by; y += 4) for (let x = -2; x <= 3; x++) { px(cx + x, y, WD[0]); px(cx + x, y + 1, WD[3]); }
  for (let x = -6; x <= 7; x++) px(cx + x, topY - 1, '#050404'); // 천장 구멍
  shadowE(cx, by + 1, 7, 2, 0.6);
  for (let i = 0; i < 8; i++) { const x = cx - 8 + Math.floor(hh(i, 4) * 16), y = by + Math.floor(hh(4, i) * 3); px(x, y, i % 2 ? '#5a5046' : '#3a3430'); } // 무너진 흙
}
function papers(cx, cy, n = 8) { for (let i = 0; i < n; i++) { const x = cx + Math.round((hh(i, cx) - 0.5) * 40), y = cy + Math.round((hh(cy, i) - 0.5) * 20); px(x, y, '#a89e88'); px(x + 1, y, '#8a8270'); px(x + 2, y, '#a89e88'); px(x, y + 1, OUTK); px(x + 1, y + 1, OUTK); px(x + 2, y + 1, OUTK); } }
function wallSplat(cx, cy, s = 1) { for (let i = 0; i < 14; i++) { const x = cx + Math.round((hh(i, 3 + s) - 0.5) * 16), y = cy + Math.round(hh(i, 4 + s) * 9); px(x, y, i % 3 ? SD[3] : SD[2]); if (hh(i, 6) < 0.35) { px(x, y + 1, SD[4]); px(x, y + 2, SD[4]); } } }
function rubble(cx, cy, n = 7) { for (let i = 0; i < n; i++) { const x = cx + Math.round((hh(i, cx) - 0.5) * 18), y = cy + Math.round((hh(cx, i) - 0.5) * 6), s = hh(i, 9) < 0.4 ? 2 : 1; for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) px(x + a, y + b, a + b === 0 ? '#5a5462' : '#3c3846'); px(x + s, y + s, OUTK); } }

// ---- 키륵: 고블린 챔피언 머리 + 마법사 로브 + 부러진 지팡이 · 붕대
const GB_HEAD = [",..........kkkkkk..........,", "..........khhhhssk..........", ".........khhhhssssk.........", "..kk....khhhsssssrsk...kk...", ".khhkk.khhhsssssssrskkkhhk..", "..kShhkkhsSSSSSSSrsSkhhSk...", "...kSshkssseesseesSSksSk....", "....kSrksssskssskSSSkSk.....", ".....kSksssssSSSSSSSkk......", "......kkssswsSSSwSSSk.......", "........ksswkkkkwSSk........"];
const GB_PAL = { k: '#0b0f08', s: '#5e8a34', S: '#3e5e24', h: '#8ab858', e: '#ffdf3a', r: '#a3222a', w: '#ece0c4' };
const RB = ['#7a6a96', '#5a4c74', '#40365a', '#2c2442', '#1c1630']; // 로브
let KIRK_CV = null;
function kirkCv() {
  if (KIRK_CV) return KIRK_CV;
  const W = 30, H = 27, C = Cv(W, H), ox = 1;
  GB_HEAD.forEach((r, y) => [...r].forEach((ch, x) => { if (GB_PAL[ch]) C.set(ox + x, y, GB_PAL[ch]); }));
  // 붕대: 이마를 비스듬히 감고 오른쪽 눈을 가림
  for (const [x, y] of [[10, 2], [11, 2], [12, 2], [13, 2], [14, 3], [15, 3], [16, 4], [17, 4], [18, 5], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [15, 6], [16, 6], [17, 6], [14, 6], [15, 5], [16, 5]]) C.set(ox + x, y, (x + y) % 3 ? '#e8e0c8' : '#b0a890');
  C.set(ox + 19, 6, '#8a2a20'); // 붕대에 밴 핏자국
  // 로브 (목깃 → 아래로 넓어짐, 찢어진 밑단)
  for (let y = 11; y < H; y++) { const k = (y - 11) / (H - 11), hw = Math.round(6 + k * 4); for (let x = -hw; x <= hw; x++) { const cx = 14 + ox, X = cx + x; if (y === H - 1 && hh(X, 3) < 0.4) continue; let c = x < -hw + 2 ? RB[1] : x > hw - 3 ? RB[3] : RB[2]; if (x === 0 || x === 1) c = y < 14 ? '#b8954a' : RB[3]; if (y === 11) c = RB[1]; if (y > H - 3) c = x > hw - 3 ? RB[4] : RB[3]; if ((x === -3 || x === 4) && y > 15 && y < H - 2 && dth2(X, y) < 0.3) c = RB[3]; C.set(X, y, c); } }
  // 두건 (머리 뒤로 젖혀진 천)
  for (const [x, y] of [[9, 9], [9, 10], [20, 9], [20, 10], [8, 10], [21, 10]]) C.set(ox + x, y, RB[1]);
  // 소매 + 손 (양옆)
  for (let y = 13; y < 19; y++) { C.set(ox + 6, y, RB[1]); C.set(ox + 7, y, RB[2]); C.set(ox + 22, y, RB[2]); C.set(ox + 23, y, RB[3]); }
  for (const [x, y] of [[6, 19], [7, 19], [22, 19], [23, 19]]) C.set(ox + x, y, GB_PAL.s);
  // 허리끈 + 매달린 주머니
  for (let x = 8; x <= 20; x++) C.set(ox + x, 17, '#5a3a22'); C.set(ox + 16, 18, '#6a4a2a'); C.set(ox + 17, 18, '#6a4a2a'); C.set(ox + 16, 19, '#4a3220'); C.set(ox + 17, 19, '#4a3220');
  return (KIRK_CV = C);
}
function kirk(cx, by, t, opt = {}) {
  const C = kirkCv(), bob = !opt.still && Math.floor(t * 2) % 2 ? 1 : 0, W = C.w, H = C.h;
  shadowE(cx, by, 12, 3, 0.7);
  // 좌우 반전(플레이어 쪽 = 왼쪽을 봄)
  const F = Cv(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) F.set(opt.flip ? x : W - 1 - x, y, C.get(x, y));
  const x0 = cx - (W >> 1), y0 = by - H - bob;
  drawCv(F, x0, y0);
  // 지팡이 (오른손 = 화면 왼쪽): 구부러진 나무, 끝에 금 간 수정
  const hx = x0 + W - 1 - (1 + 6), hy = y0 + 19;
  if (!opt.book) {
    const aim = opt.aim;
    for (let i = 0; i < 24; i++) { const x = aim ? hx - Math.round(i * 0.85) : hx - (i > 20 ? 1 : 0), y = aim ? hy - Math.round(i * 0.45) : hy + 6 - i; px(x, y, i % 5 === 2 ? WD[2] : WD[1]); px(x + 1, y, WD[3]); }
    const tx = aim ? hx - 20 : hx - 1, ty = aim ? hy - 11 : hy - 18;
    for (const [a, b, c] of [[0, 0, '#9ae060'], [1, 0, '#5a9a30'], [0, -1, '#d8ffb0'], [-1, 0, '#3a6a20'], [0, 1, '#3a6a20'], [1, -1, '#2a4a18']]) px(tx + a, ty + b, c);
    for (const [a, b] of [[-1, -1], [1, 1], [-2, 0], [2, 0], [0, -2], [0, 2]]) px(tx + a, ty + b, OUTK);
    if (opt.puff) { const k = (t * 1.4) % 1; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; px(Math.round(tx - 2 + Math.cos(a) * (2 + k * 6)), Math.round(ty + Math.sin(a) * (1.5 + k * 3) - k * 6), k < 0.5 ? '#9a9a90' : '#5a5a54'); } }
  }
  if (opt.book) { // 펼친 일지를 가슴 앞에
    const bx = cx - 5, byy = y0 + 15;
    for (let y = 0; y < 6; y++) for (let x = 0; x < 11; x++) px(bx + x, byy + y, x === 5 ? '#5a3a22' : y === 0 ? '#3a2818' : (x + y) % 4 === 0 && y > 1 && x !== 5 ? '#8a7a5a' : '#e8dcc0');
    for (let x = -1; x <= 11; x++) { px(bx + x, byy - 1, OUTK); px(bx + x, byy + 6, OUTK); }
    glow(cx, byy + 2, 14, '255,230,170', 0.25, 8);
  }
}
function kirkHide(cx, by, t) { // 책장 뒤로 귀 끝만
  if (Math.sin(t * 1.3) < -0.2) return;
  for (const s of [-1, 1]) { const x = cx + s * 8; px(x, by, '#5e8a34'); px(x + s, by - 1, '#8ab858'); px(x + s * 2, by - 1, '#0b0f08'); px(x, by - 1, '#0b0f08'); px(x - s, by, '#0b0f08'); }
}

// ---- 게임 말풍선 (paintBubble과 같은 모양, px 좌표 · (x,y) = 꼬리 끝)
function bubble(text, x, y) {
  g.save(); g.font = '10px Galmuri9'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const tw = Math.ceil(g.measureText(text).width), w = (tw + 14) & ~1, h = 16, X = Math.round(x) & ~1, Y = Math.round(y) & ~1;
  const bx = (X - (w >> 1)) & ~1, by = Y - h - 6;
  g.fillStyle = '#0b0a0e'; g.fillRect(bx + 2, by - 2, w - 4, h + 4); g.fillRect(bx, by, w, h); g.fillRect(bx - 2, by + 2, w + 4, h - 4);
  g.fillStyle = '#f4ead2'; g.fillRect(bx + 2, by, w - 4, h); g.fillRect(bx, by + 2, w, h - 4);
  g.fillStyle = '#d8c8a4'; g.fillRect(bx + 2, by + h - 2, w - 4, 2);
  const tx = X - 2; g.fillStyle = '#0b0a0e'; g.fillRect(tx - 2, by + h, 8, 2); g.fillRect(tx, by + h + 2, 4, 2); g.fillRect(tx + 2, by + h + 4, 2, 2);
  g.fillStyle = '#d8c8a4'; g.fillRect(tx, by + h, 4, 2); g.fillStyle = '#f4ead2'; g.fillRect(tx, by + h - 2, 4, 2);
  g.fillStyle = '#2a1e18'; g.fillText(text, bx + w / 2, by + 12); g.restore();
}

// ---- ⑦ 점액왕 몸속 물건 — 일지도 형태만 책, 색은 점액에 물듦
const BOSS = { cx: 192, cy: 84 };
function bellyItems(t, glowK = 0.5, journalOff = [0, 0]) {
  const { cx, cy } = BOSS, wob = (i) => Math.round(Math.sin(t * 1.6 + i * 1.7) * 1);
  const A = (a) => `rgba(20,52,14,${a})`;
  // 냄비 · 유리병 · 뼈 (점액빛으로 흐림)
  for (let x = -3; x <= 3; x++) { px(cx - 12 + x, cy + 2 + wob(1), A(0.55)); px(cx - 12 + x, cy + 3 + wob(1), A(0.7)); } px(cx - 16, cy + 2 + wob(1), A(0.7));
  for (let y = 0; y < 4; y++) px(cx + 10, cy - 4 + y + wob(2), 'rgba(170,230,150,.55)'); px(cx + 10, cy - 5 + wob(2), A(0.7));
  for (let x = 0; x < 5; x++) px(cx + 3 + x, cy + 6 + wob(3), 'rgba(190,230,150,.5)'); px(cx + 2, cy + 5 + wob(3), 'rgba(190,230,150,.5)'); px(cx + 8, cy + 7 + wob(3), 'rgba(190,230,150,.5)');
  // 일지: 책 모양(표지 · 책등 · 쪽 단면), 색은 점액 초록에 묻힘
  const jx = cx - 4 + journalOff[0], jy = cy - 4 + wob(4) + journalOff[1], out = journalOff[0] + journalOff[1] > 12, brown = glowK >= 1;
  const cov = brown ? ['#a8683e', '#8a5232', '#5a321c'] : ['rgba(70,130,40,.85)', 'rgba(46,96,28,.85)', 'rgba(30,66,18,.85)'];
  for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) px(jx + x, jy + y, x === 0 ? cov[2] : y === 4 ? (brown ? '#e8dcc0' : 'rgba(170,210,140,.75)') : y === 0 ? cov[0] : cov[1]);
  px(jx + 3, jy + 2, brown ? '#e8c870' : 'rgba(150,220,100,.8)'); px(jx + 4, jy + 2, brown ? '#e8c870' : 'rgba(150,220,100,.8)');
  if (brown) for (let x = -1; x <= 7; x++) { px(jx + x, jy - 1, OUTK); px(jx + x, jy + 5, OUTK); }
  if (glowK > 0) glow(jx + 3, jy + 2, 6 + glowK * 10, '190,255,120', 0.2 + glowK * 0.35, 5 + glowK * 5);
}
function grogiRing(t) { const { cx, cy } = BOSS; if (Math.floor(t * 4) % 2) return; for (let a = 0; a < 90; a++) { const q = a / 90 * Math.PI * 2; px(Math.round(cx + Math.cos(q) * 26), Math.round(cy + 10 + Math.sin(q) * 10), a % 3 ? '#8fe060' : '#d0ff90'); } }
function farPrompt(text, x, y, t, near) { // v2.62 공통 키 캡 모양 (멀리서는 초록 테 + 깜빡이는 아래 화살표)
  x *= 2; y *= 2; const X = Math.round(x), Y = Math.round(y + Math.sin(t * 4) * 1.5);
  drawKeyTag(g, X, Y, 'F', text.replace(/^F\s+/, ''), near ? {} : { border: '#8fe060', color: '#d0ffa0' });
  if (!near) { g.save(); g.fillStyle = '#8fe060'; const k = Math.floor(t * 3) % 2; g.fillRect(X - 2, Y + 6 + k * 2, 4, 2); g.fillRect(X - 1, Y + 8 + k * 2, 2, 2); g.restore(); }
}

// 방 조명에 맞춰 새로 그린 오브젝트를 어둡게 (배경 밝기를 흐리게 본뜬 빛 지도)
// ---- ② 문 앞 점액 한 덩이 (반짝)
function doorGlint(cx, cy, t, i = 0) {
  slimeBlob(cx, cy, 3, 2 + i);
  const k = (t * 0.8 + i * 0.37) % 1;
  if (k < 0.35) { const s = k < 0.12 || k > 0.24 ? 1 : 2, x = cx - 2, y = cy - 2; px(x, y, '#f0ffd0'); for (let j = 1; j <= s; j++) { px(x - j, y, '#c8e890'); px(x + j, y, '#c8e890'); px(x, y - j, '#c8e890'); px(x, y + j, '#c8e890'); } }
}
// ---- ③ 점액 웅덩이 (연못처럼 · 부글부글)
const POND = (() => { const S = []; for (let y = -12; y <= 12; y++) for (let x = -26; x <= 26; x++) { const a = Math.atan2(y, x / 2), r = 10 * (0.84 + 0.1 * Math.sin(a * 2 + 1.3) + 0.07 * Math.sin(a * 3 + 4) + 0.04 * Math.sin(a * 7)); const d = Math.hypot(x / 2, y) / r; if (d <= 1) S.push([x, y, d]); } return S; })();
function slimePond(t) {
  const { cx, cy } = GATE, set = new Set(POND.map(([x, y]) => x + ',' + y));
  // 둑 (흙 · 풀) + 외곽선
  for (const [x, y, d] of POND) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 2], [2, 0], [-2, 0]]) { const k = (x + a) + ',' + (y + b); if (!set.has(k)) px(cx + x + a, cy + y + b, b === 2 ? 'rgba(0,0,0,.35)' : hh(x + a, y + b) < 0.5 ? '#2a2016' : '#3a2c1c'); }
  for (const [x, y] of POND) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!set.has((x + a) + ',' + (y + b))) px(cx + x + a, cy + y + b, OUTK);
  // 수면: 가장자리 어둡고 가운데로 밝게, 왼쪽 위 윤슬
  for (const [x, y, d] of POND) { let c = d > 0.8 ? SL[6] : d > 0.55 ? SL[5] : SL[4]; if (y < -3 && d > 0.45 && d < 0.75 && dth2(x, y) < 0.25) c = SL[4]; px(cx + x, cy + y, c); }
  for (const [x, y] of [[-12, -5], [-11, -5], [-10, -5], [-6, -6], [-5, -6], [8, -4], [9, -4]]) px(cx + x, cy + y, SL[3]);
  // 둑 위 풀 몇 포기
  for (const [x, y] of [[-22, -3], [20, -5], [-16, 6], [18, 7]]) { px(cx + x, cy + y - 1, '#3a6a2a'); px(cx + x + 1, cy + y - 2, '#5a8a3a'); px(cx + x + 2, cy + y - 1, '#3a6a2a'); }
  // 부글부글: 거품이 부풀었다 터짐
  for (let i = 0; i < 7; i++) { const per = 1.6 + hh(i, 3), k = ((t + hh(i, 4) * per) % per) / per, x = cx + Math.round((hh(i, 1) - 0.5) * 34), y = cy + Math.round((hh(i, 2) - 0.5) * 12);
    if (k < 0.55) { const r = k < 0.2 ? 0 : 1; px(x, y - r, SL[2]); if (r) { px(x - 1, y, SL[2]); px(x + 1, y, SL[3]); px(x, y - 2, SL[0]); px(x - 1, y - 1, SL[1]); } }
    else if (k < 0.7) { px(x - 2, y - 1, SL[1]); px(x + 2, y - 1, SL[1]); px(x, y - 3, SL[0]); px(x - 1, y + 1, SL[3]); px(x + 1, y + 1, SL[3]); } }
  glow(cx, cy, 26, '120,200,70', 0.08, 10);
}
// ---- ④ 한 번에 터짐
function pondBurst(t) {
  const { cx, cy } = GATE, k = (t * 0.9) % 1;
  ladderHole(cx, cy, t);
  for (let i = 0; i < 46; i++) { const a = hh(i, 1) * Math.PI * 2, sp = 0.5 + hh(i, 2), r = 6 + k * 46 * sp, up = Math.sin(Math.min(1, k * 1.4) * Math.PI) * (10 + hh(i, 3) * 14);
    const x = Math.round(cx + Math.cos(a) * r * 1.6), y = Math.round(cy + Math.sin(a) * r * 0.6 - up), s = hh(i, 4) < 0.3 ? 2 : 1;
    for (let u = 0; u < s; u++) for (let v = 0; v < s; v++) px(x + u, y + v, k < 0.5 ? SL[1] : SL[3]); if (s === 2) px(x, y, SL[0]); }
  for (let i = 0; i < 10; i++) { const a = hh(i, 9) * Math.PI * 2, r = 4 + k * 14; px(Math.round(cx + Math.cos(a) * r * 2), Math.round(cy + Math.sin(a) * r * 0.7 - k * 6), '#e8ff90'); }
  glow(cx, cy - 4, 40 * (1 - k * 0.5), '190,255,90', 0.55 * (1 - k), 18);
}
function splats(t) { const { cx, cy } = GATE; for (const [x, y, s, i] of [[-34, -6, 2, 1], [30, -8, 2, 2], [-24, 12, 3, 3], [36, 10, 2, 4], [6, -16, 2, 5], [-6, 18, 2, 6], [44, -2, 1, 7], [-44, 4, 1, 8]]) slimeBlob(cx + x, cy + y, s, i); }

// ---- 비밀 통로: 점액 묻은 나무 (숲 가장자리 · 뒤로 사람 하나 간신히 지나갈 틈)
const BUSH = { cx: 334, cy: 128 };
const LEAF = ['#3e6a34', '#2c5026', '#1e3a1a', '#142a12', '#0c1a0a'];
function slimeTree(t) {
  const { cx, cy } = BUSH;
  // 나무 뒤 틈 (오른쪽으로 어둡게 벌어진 좁은 자리)
  for (let y = cy - 12; y <= cy + 6; y++) for (let x = cx + 5; x <= cx + 9; x++) if (dth2(x, y) < 0.85 - (x - cx - 5) * 0.12) px(x, y, '#060805');
  // 줄기 (껍질 결 + 굳은 점액이 덮고 흘러내림)
  const C = Cv(44, 60), ox = 22, oy = 46;
  for (let y = -16; y <= 6; y++) { const w = y > 2 ? 5 : 4; for (let x = -w; x <= w; x++) { let c = x < -1 ? '#6a4a2e' : x > 2 ? '#3a2818' : '#4e3622'; if ((x + y * 3) % 7 === 0) c = '#2e2014'; C.set(ox + x, oy + y, c); } }
  for (const [x, y] of [[-7, 6], [-6, 5], [7, 6], [6, 5], [-8, 6], [8, 6]]) C.set(ox + x, oy + y, '#4e3622'); // 뿌리 밑동
  for (let y = -12; y <= 4; y++) for (let x = -4; x <= 2; x++) { const d = Math.hypot((x + 1) / 3.5, (y + 4) / 8); if (d > 1) continue; C.set(ox + x, oy + y, d > 0.8 ? SD[3] : x + y < -6 ? SD[1] : SD[2]); }
  for (const [x, y] of [[-3, -10], [-3, -9], [-2, -11], [-3, -5]]) C.set(ox + x, oy + y, '#d0e8a0');
  // 잎 덩이 (위)
  for (const [bx, by, r] of [[0, -24, 11], [-9, -20, 8], [9, -21, 8], [-4, -30, 7], [5, -30, 7]]) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.hypot(x, y * 1.1) / r; if (d > 1) continue; const l = -x * 0.6 - y * 0.8 + (1 - d) * 4; let c = LEAF[Math.max(0, Math.min(4, 3 - Math.round(l / 3)))]; if (hh(bx + x, by + y) < 0.12) c = LEAF[Math.min(4, LEAF.indexOf(c) + 1)]; C.set(ox + bx + x, oy + by + y, c); }
  for (const [x, y] of [[-2, -14], [3, -15], [-6, -13]]) { C.set(ox + x, oy + y, SD[2]); C.set(ox + x, oy + y + 1, SD[1]); } // 잎 끝에도 점액
  drawCv(C, cx - ox, cy - oy + 2);
  // (밑동에 고인 점액 없음)
}
// ---- 웅덩이에서 초록 슬라임이 올라왔다 녹아 사라짐 (캡처한 슬라임을 아래부터 잘라 그림)
// ================================================================ 무너진 실험실 장면 (시작 장소와 같은 방식: 칸 384×216 · 둥근 방 · 흙 바닥/벽)
const LGW = 384, LGH = 216;
function lhash(i) { let x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const lh2 = (x, y, s = 0) => lhash(x * 73.13 + y * 19.71 + s * 7.7);
function LGrid() {
  const [c, gg] = __mk(LGW, LGH);
  const P = {
    c, g: gg,
    put(x, y, col) { if (!col || x < 0 || y < 0 || x >= LGW || y >= LGH) return; gg.fillStyle = col; gg.fillRect(x | 0, y | 0, 1, 1); },
    rect(x, y, w, h, col) { if (!col) return; gg.fillStyle = col; gg.fillRect(x | 0, y | 0, w | 0, h | 0); },
    line(x0, y0, x1, y1, col) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) P.put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col); },
    spr(rows, pal, x0, y0, o = true, flip = false) {
      const h = rows.length, w = rows[0].length, at = (x, y) => (y >= 0 && y < h && x >= 0 && x < w) ? rows[y][flip ? w - 1 - x : x] : '.';
      if (o) for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) if (at(x, y) === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) !== '.')) P.put(x0 + x, y0 + y, OUTK);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = at(x, y); if (ch !== '.') P.put(x0 + x, y0 + y, pal[ch]); }
    },
  };
  return P;
}
function lblot(P, cx, cy, rx, ry, col, seed, dens = 1) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1) continue; const p = (1 - d) * 1.6 * dens; if (lh2(x, y, seed) < p * (((x + y) & 1) ? 1 : 0.7)) P.put(x, y, col); } }
const LBAYER = [[0, 2], [3, 1]];
function lshade(gg, lights, amb) {
  const lv = [0, 0.22, 0.42, 0.6];
  for (let y = 0; y < LGH; y++) for (let x = 0; x < LGW; x++) {
    let L = amb, tr = 0, tg = 0, tb = 0, tw = 0;
    for (const l of lights) { const dx = x - l.x, dy = (y - l.y) * (l.sy || 1), d = Math.sqrt(dx * dx + dy * dy); if (d >= l.r) continue; const k = (1 - d / l.r) * l.a; L += k; if (l.c) { tr += l.c[0] * k; tg += l.c[1] * k; tb += l.c[2] * k; tw += k; } }
    L = Math.min(1, L);
    const f = (1 - L) * 3 + (LBAYER[y & 1][x & 1] - 1.5) / 4 * 0.9, i = Math.max(0, Math.min(3, Math.round(f)));
    if (lv[i] > 0) { gg.fillStyle = `rgba(6,4,10,${lv[i]})`; gg.fillRect(x * 2, y * 2, 2, 2); }
    if (tw > 0.18 && ((x + y) & 1 || tw > 0.45)) { const a = Math.min(0.2, tw * 0.14); gg.fillStyle = `rgba(${tr / tw | 0},${tg / tw | 0},${tb / tw | 0},${a})`; gg.fillRect(x * 2, y * 2, 2, 2); }
  }
}
const STUMP = [236, 126]; // 그루터기 윗면 가운데
const CANDLES = window.LAB2 !== false ? [[240, 108, 5], [150, 126, 5], [204, 134, 4]] : [[240, 108, 3], [150, 126, 3], [204, 134, 2]]; // 바닥 양초 [x, 발 y, 높이] (v3.19 조금 더 길게)
const LAB_POTDY = window.LAB2 !== false ? 2 : 0; // v3.19 솥을 모닥불 속으로 2칸 내림
const LAB = { ecx: 192, ecy: 112, erx: 71, ery: 38, wallH: 26, ladder: [140, 86], table: [202, 93], cauldron: [188, 116] };
const DIRT = ['#5a4632', '#4e3c2a', '#463624', '#3e2f20', '#33261a', '#271c12'];
const BOOKS = ['#7a2a2a', '#2e4a6a', '#6a5a2a', '#3a6a3a', '#5a3a6a', '#8a7a4a', '#6a3a2a', '#2e5a5a'];
function labDraw(P) {
  const { ecx, ecy, erx, ery } = LAB;
  // 구덩이 모델: 바닥 타원(F)과 위로 올린 테두리 타원(R). F∩R = 보이는 바닥, R−F = 벽 면, F−R = 앞쪽 땅에 가려짐, 바깥 = 땅
  const rcy = ecy - 14, rry = ery + 6;
  const eF = (x, y) => ((x + 0.5 - ecx) / erx) ** 2 + ((y + 0.5 - ecy) / ery) ** 2;
  const eR = (x, y) => { const a = Math.atan2((y + 0.5 - rcy) / rry, (x + 0.5 - ecx) / erx), j = 1 + (lh2(Math.round(a * 30), 0, 61) - 0.5) * 0.05; return (((x + 0.5 - ecx) / erx) ** 2 + ((y + 0.5 - rcy) / rry) ** 2) / (j * j); };
  const inE = (x, y) => eF(x, y) <= 1 && eR(x, y) <= 1;
  LAB.inFloor = inE; LAB.eF = eF; LAB.eR = eR; LAB.rcy = rcy;
  const floorTop = x => { const t = (x + 0.5 - ecx) / erx; return Math.abs(t) > 1 ? ecy : ecy - ery * Math.sqrt(1 - t * t); };
  const rimTop = x => { const t = (x + 0.5 - ecx) / erx; return Math.abs(t) > 1 ? rcy : rcy - rry * Math.sqrt(1 - t * t); };
  const STRATA = ['#5a452e', '#4e3c28', '#463523', '#3e2e1f', '#35281a', '#2c2116'];
  for (let y = 0; y < LGH; y++) for (let x = 0; x < LGW; x++) {
    const f = eF(x, y), r = eR(x, y), chk = (x + y) & 1;
    if (f <= 1 && r <= 1) { // 바닥: 결은 은은하게, 벽·테두리 가까이 갈수록 디더로 어두워짐
      const m = Math.max(f, r), n = lh2(x >> 4, y >> 3, 5); let c = n < 0.5 ? DIRT[2] : DIRT[1];
      if (chk && lh2(x >> 2, y >> 1, 6) < 0.3) c = DIRT[2];
      if (m > 0.72) c = chk ? DIRT[3] : c; if (m > 0.82) c = DIRT[3]; if (m > 0.9) c = chk ? DIRT[4] : DIRT[3]; if (m > 0.96) c = DIRT[4];
      if (lh2(x, y, 7) < 0.012 && m < 0.8) c = DIRT[0];
      P.put(x, y, c);
    } else if (r <= 1) { // 벽 면: 지층 결 · 위는 밝고 바닥 쪽은 그늘
      const ft = floorTop(x), rt = rimTop(x), k = Math.max(0, Math.min(1, (y - rt) / Math.max(1, ft - rt))), band = Math.floor((y + Math.round(Math.sin(x * 0.11) * 2)) / 4) % 3;
      let c = STRATA[1 + band]; if (k < 0.15) c = STRATA[0]; if (k > 0.82) c = chk ? STRATA[4] : STRATA[3]; if (k > 0.93) c = STRATA[5];
      const side = Math.abs(x - ecx) / erx; if (side > 0.8 && chk) c = STRATA[Math.min(5, STRATA.indexOf(c) + 1)]; // 옆벽은 한 단 더 어둡게
      if (lh2(x, y, 22) < 0.03) c = '#6a5640';
      P.put(x, y, c);
    } else { // 땅 (테두리 바깥): 테두리 가까이는 흙, 멀어질수록 어둠으로 디더
      if (r < 1.06) P.put(x, y, OUTK);
      else if (r < 1.32) { const fade = (r - 1.06) / 0.26; if (lh2(x, y, 83) > fade * 1.1 || (chk && fade < 0.5)) P.put(x, y, fade < 0.3 ? '#33261a' : '#2a1e14'); }
      if (r >= 1.06 && r < 1.12 && y < rcy && lh2(x, 5, 73) < 0.35) P.put(x, y, '#2e4a20'); // 위쪽 땅의 풀
    }
  }
  // 벽 아래 끝(바닥과 만나는 선)에 얇은 그늘 한 줄
  for (let x = ecx - erx; x < ecx + erx; x++) { const y = Math.round(floorTop(x)); if (eR(x, y) <= 1 && eF(x, y) <= 1.05) P.put(x, y, DIRT[5]); }
  // 디딤돌 (사다리에서 방 안으로)
  for (const [x, y] of [[148, 92], [158, 99]]) { if (window.LAB2 !== false) { P.spr(['..ssss..', '.sSSSSs.', 'sSSssSSd', '.dddddd.'], { s: '#6a6458', S: '#7e786a', d: '#4a463e' }, x - 1, y, false); P.rect(x, y + 4, 6, 1, DIRT[5]); P.put(x - 1, y + 3, DIRT[4]); P.put(x + 6, y + 3, DIRT[4]); } // v3.19 디딤돌: 바닥에 박힌 납작한 돌 (외곽선 대신 흙 그늘)
    else P.spr(['.ssss.', 'sSSSSs', '.dddd.'], { s: '#5e584e', S: '#6e685c', d: '#3e3a34' }, x, y, true); }
  // 박힌 돌
  for (let i = 0; i < 9; i++) { const x = ecx - 60 + Math.round(lh2(i, 1, 75) * 120), ft = floorTop(x), rt = rimTop(x); const y = Math.round(rt + 3 + lh2(i, 2, 75) * (ft - rt - 8)); P.spr(['.ss.', 'sSSs', '.dd.'], { s: '#7a7064', S: '#8e8476', d: '#4e463c' }, x - 2, y, true); }
  // 늘어진 뿌리 (윗가장자리에서 벽 면으로)
  for (let i = 0; i < 12; i++) { const x = ecx - 66 + i * 11 + Math.round(lh2(i, 6) * 6), top = Math.round(rimTop(x)) + 1, L = 3 + Math.floor(lh2(i, 7) * 8); let xx = x; for (let k = 0; k < L; k++) { if (lh2(i, k, 77) < 0.3) xx += lh2(i, k, 78) < 0.5 ? -1 : 1; if (eR(xx, top + k) <= 1 && eF(xx, top + k) > 1) P.put(xx, top + k, k === L - 1 ? '#5a4632' : '#2a1e12'); } }
  // 책장 감실: 벽을 파낸 움푹한 자리 — 나무 틀(앞면·옆면) · 들보 윗면 · 안쪽 옆벽 그늘 · 선반 널(윗면·앞면) · 선반 밑 그림자 · 책은 왼쪽 빛 · 오른쪽 그늘 (사다리 쪽 감실은 비어 있음)
  const shadeC = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join(''); };
  for (const [x0, x1, empty] of [[160, 182, true], [188, 214, false], [220, 244, false]]) {
    const yb = Math.round(Math.max(floorTop(x0), floorTop(x1 - 1))) - 1, h = 16, y0 = yb - h;
    // 안쪽 (뒤 벽 · 옆벽)
    for (let y = y0; y < yb; y++) for (let x = x0 + 2; x < x1 - 2; x++) { let c = '#120c08'; if (x < x0 + 4) c = x === x0 + 2 ? '#3a2a1c' : '#2a1e14'; else if (x > x1 - 4) c = '#0c0806'; if (y < y0 + 3) c = '#0a0604'; P.put(x, y, c); }
    // 선반 (두 단): 윗면 · 앞면 · 밑 그림자 + 책
    for (const sy of [y0 + 8, yb - 1]) {
      for (let x = x0 + 2; x < x1 - 2; x++) { P.put(x, sy - 1, '#9a7a52'); P.put(x, sy, '#6a4a30'); if (sy < yb - 1) P.put(x, sy + 1, '#0a0604'); }
      if (empty) { for (let x = x0 + 3; x < x1 - 3; x++) if (lh2(x, sy, 15) < 0.25) P.put(x, sy - 2, '#3a2a1c');
        if (window.LAB2 !== false) { const jar = (x, c, l, d) => P.spr(['.ll.', 'lccd', 'cccd', '.dd.'], { l, c, d }, x, sy - 5, false), btl = (x, g, G, d) => P.spr(['.w.', '.n.', 'gGd', 'gGd', 'ggd'], { w: '#8e6e50', n: d, g, G, d }, x, sy - 6, false); // v3.19 빈 감실에 병 · 단지 몇 개
          if (sy < yb - 1) { jar(x0 + 4, '#a86a3a', '#c08a5a', '#6a4024'); btl(x0 + 10, '#5a7ab0', '#9ab8e0', '#34486a'); } else { btl(x0 + 5, '#a84a3a', '#e08a6a', '#6a2a22'); jar(x0 + 12, '#8a7a5a', '#b0a07a', '#5a4e38'); jar(x0 + 16, '#6a5a8a', '#9a8ab8', '#3e3458'); } }
        continue; } // 빈 선반: 먼지 · 부스러기 (+ v3.19 병 · 단지)
      let x = x0 + 3; while (x < x1 - 4) { const v = lh2(x, sy, 9), w = v > 0.75 ? 2 : 1, bh = 4 + Math.floor(lh2(x, sy, 10) * 3), col = BOOKS[Math.floor(lh2(x, sy, 11) * 8)];
        if (lh2(x, sy, 12) < 0.1) { x += 1; continue; } // 빈 틈 (안쪽 어둠이 보임)
        for (let j = 0; j < w; j++) for (let k = 2; k < 2 + bh; k++) { const y = sy - k; let c = col; if (j === 0 && w > 1) c = shadeC(col, 1.25); if (j === w - 1 && w > 1) c = shadeC(col, 0.8); if (k === 1 + bh) c = shadeC(col, 1.45); if (k === 2) c = shadeC(col, 0.7); P.put(x + j, y, c); }
        if (bh > 4 && lh2(x, sy, 13) < 0.4) P.put(x, sy - 2 - Math.floor(bh / 2), '#d8b860'); // 책등 금박 띠
        x += w; }
    }
    // 앞 틀: 기둥(앞면 밝게 · 안쪽 면 어둡게) + 위 들보(윗면 · 앞면)
    for (let y = y0 - 2; y < yb + 1; y++) { P.put(x0, y, '#8e6e50'); P.put(x0 + 1, y, '#5e4430'); P.put(x1 - 2, y, '#5e4430'); P.put(x1 - 1, y, '#7a5a3a'); P.put(x0 - 1, y, OUTK); P.put(x1, y, OUTK); }
    for (let x = x0 - 1; x <= x1; x++) { P.put(x, y0 - 3, OUTK); P.put(x, y0 - 2, '#b08c60'); P.put(x, y0 - 1, '#7a5a3a'); P.put(x, y0, '#3a2818'); }
    for (let x = x0 - 1; x <= x1; x++) if (eF(x, yb + 1) <= 1) P.put(x, yb + 1, (x & 1) ? DIRT[5] : DIRT[4]); // 감실 밑 그늘
  }
  // 반쯤 지워진 분필 마법진 (가마솥 아래)
  const [cx, cy] = LAB.cauldron, mcy = cy + 6;
  for (let a = 0; a < 600; a++) { const r = a / 600 * Math.PI * 2; for (const [R, Ry, c] of [[24, 10, '#8a8070'], [20, 8, '#6e665a']]) { const x = Math.round(cx + Math.cos(r) * R), y = Math.round(mcy + Math.sin(r) * Ry); if (lh2(a, R, 31) < 0.7) P.put(x, y, c); } }
  for (let k = 0; k < 6; k++) { const r = k / 6 * Math.PI * 2 + 0.3; P.line(Math.round(cx + Math.cos(r) * 10), Math.round(mcy + Math.sin(r) * 4), Math.round(cx + Math.cos(r) * 20), Math.round(mcy + Math.sin(r) * 8), lh2(k, 3) < 0.5 ? '#6e665a' : DIRT[1]); }
  lblot(P, cx, mcy, 13, 5, '#1e160e', 41, 0.9); // 그을음
  // 화덕 돌 고리 — 바닥 원과 같은 가운데 · 같은 비율
  for (let i = 0; i < 14; i++) { const q = i / 14 * Math.PI * 2, x = Math.round(cx + Math.cos(q) * 14.4) - 1, y = Math.round(mcy + Math.sin(q) * 6) - 1; if (Math.sin(q) < -0.55) continue; P.spr(['ss', 'Sd'], { s: '#8e887a', S: '#6e685e', d: '#4e4a42' }, x, y, true); }
}
// 작은 소품들 (미니멀 · 귀엽게)
function labProps(P, t) {
  const [lx, ly] = LAB.ladder;
  // 사다리: 바닥에서 화면 위 천장 구멍까지
  for (let y = 0; y <= ly; y++) { P.put(lx - 1, y, OUTK); P.put(lx, y, '#8e6e50'); P.put(lx + 1, y, '#5e4430'); P.put(lx + 2, y, OUTK); P.put(lx + 9, y, OUTK); P.put(lx + 10, y, '#8e6e50'); P.put(lx + 11, y, '#5e4430'); P.put(lx + 12, y, OUTK); }
  for (let y = 4; y < ly; y += 6) { P.rect(lx + 2, y - 1, 8, 1, OUTK); P.rect(lx + 2, y, 8, 1, '#8e6e50'); P.rect(lx + 2, y + 1, 8, 1, '#4e3626'); P.rect(lx + 2, y + 2, 8, 1, OUTK); P.put(lx + 3, y, '#b08a60'); }
  lblot(P, lx + 5, ly + 3, 8, 2.5, '#1e160e', 52, 0.7);
  // 약 선반 (왼쪽 벽 앞, 2단): 흙단지 · 빛나는 점액 병 · 버섯 병 · 말린 도마뱀
  const [sx, sy] = [132, 118];
  P.spr([
    'tttttttttttttttttttt',
    'w..................w',
    'w..................w',
    'w..................w',
    'w..................w',
    'tttttttttttttttttttt',
    'w..................w',
    'w..................w',
    'w..................w',
    'w..................w',
    'W..................W',
  ], { t: '#8e6e50', w: '#6a4a30', W: '#3a2a1e' }, sx, sy - 11, true);
  const jar = (x, y, c, C) => P.spr(['.kk.', 'kccC', 'cccC', '.cC.'], { k: '#4a3020', c, C }, x, y, true);
  jar(sx + 2, sy - 10, '#a86a3a', '#7a4a28'); jar(sx + 7, sy - 10, '#8a5a3a', '#5a3a22');
  P.spr(['.ww.', 'kggk', 'kGgk', '.kk.'], { k: OUTK, w: '#8e6e50', g: '#7aa848', G: '#b8e880' }, sx + 13, sy - 10, true);
  P.spr(['.rr.', 'rRrR', 'kppk', '.kk.'], { r: '#a83a2a', R: '#e8d0b8', k: OUTK, p: '#9ab8c0' }, sx + 2, sy - 4, true);
  jar(sx + 7, sy - 4, '#6a5a8a', '#4a3a6a'); P.spr(['gggg.', '.g.gg'], { g: '#6a8a40' }, sx + 13, sy - 3, true);
  // 실험대: 판자 상판(널빤지 결) + X자 다리
  const [tx, ty] = LAB.table;
  P.spr([
    'tttttttttttttttttttttttttt',
    'TTTTTTTkTTTTTTTTkTTTTTTTTT',
    'TTTTTTTkTTTTTTTTkTTTTTTTTT',
    'eeeeeeeeeeeeeeeeeeeeeeeeee',
    '.lL..................lL...',
    '..lL................lL....',
    '...LL..............LL.....',
    '..lL................lL....',
    '.lL..................lL...',
  ], { t: '#9a7a52', T: '#7a5a3a', k: '#5a4028', e: '#3a2a1e', l: '#6a4a30', L: '#3a2a1e' }, tx, ty);
  // 조롱박 증류기 + 갈대 대롱 + 받는 잔
  P.spr(['..kk..', '..kk..', '.kGGk.', 'kGgggk', 'kggggk', '.kkkk.'], { k: OUTK, G: '#d8b870', g: '#b0904e' }, tx + 2, ty - 6, false);
  P.line(tx + 5, ty - 6, tx + 11, ty - 9, '#9aaa60'); P.line(tx + 11, ty - 9, tx + 12, ty - 5, '#9aaa60');
  P.spr(['kkkk', 'kppk', '.kk.'], { k: OUTK, p: '#8a5a3a' }, tx + 11, ty - 3, false); P.put(tx + 12, ty - 4, '#9ad060');
  // 약병 꽂이 (색 다른 세 병)
  P.spr(['.k.k.k.', 'kgkakbk', 'kgkakbk', 'wwwwwww'], { k: OUTK, g: '#7ad050', a: '#e0a040', b: '#5a8ad0', w: '#6a4a30' }, tx + 14, ty - 4, false);
  // 돌절구 + 공이
  P.spr(['kkkkk', 'kSssk', '.kSk.'], { k: OUTK, S: '#8e887a', s: '#5a8a38' }, tx + 21, ty - 3, false); P.line(tx + 24, ty - 2, tx + 25, ty - 6, '#b8b2a4');
  // 해골 촛대 (실험대 왼쪽 끝 바닥 쪽에 따로)
  P.spr(['.y.', 'yYy', '.o.', '.w.', 'www', 'sss', 'sks', '.s.'], { y: '#ffd34d', Y: '#ffffff', o: '#ff9a30', w: '#e8e0c8', s: '#d8d0b8', k: OUTK }, tx + 27, ty - 4, true);
  // 펼친 두루마리 (실험대 위)
  // 약초 시렁
  const [rx, ry] = [168, 100];
  P.spr(['k..........k', 'wwwwwwwwwwww', 'w..........w', 'w..........w', 'w..........w', 'w..........w', 'W..........W', 'W..........W'], { k: OUTK, w: '#8e6e50', W: '#5e4430' }, rx, ry - 8, true);
  for (const [dx, kind] of [[2, 'h'], [5, 'b'], [8, 'h']]) { P.put(rx + dx, ry - 6, '#5a4a38'); if (kind === 'h') P.spr(['gG', 'Gg', 'g.'], { g: '#5a7a38', G: '#7a9a48' }, rx + dx - 1, ry - 5, true); else P.spr(['w.', 'ww', 'w.'], { w: '#d8d0b8' }, rx + dx, ry - 5, true); }
  // 빛나는 버섯 무리 (왼쪽 아래 벽 밑)
  for (const [x, y, s] of [[178, 132, 1], [182, 134, 0], [174, 135, 0]]) P.spr(s ? ['.cc.', 'cCCc', '.ww.', '.ww.'] : ['cc', 'ww'], { c: '#5ad0c0', C: '#b8fff0', w: '#c8d8c8' }, x, y, true);
  // 가마솥 (작고 둥글게) — 액체는 장면에서 부글부글 · 솥 밑 장작불
  const [cx, cy] = LAB.cauldron;
  P.spr([
    '....kkkkkkkkkk....',
    '..kkIIIIIIIIIIkk..',
    '.kIIGGggggggggIIk.',
    'kIIGgggggggggggdIk',
    '.kIIgggggggggddIk.',
    '..kkIIIIIIIIIIkk..',
    '.kMMMMMMMMMMMMMmk.',
    'kMhhMMMMMMMMMMMmmk',
    'kMhMMMMMMMMMcMMmmk',
    'kMMMMMMMMMMMMcMmmk',
    'kMMMMMMMMMMMMcgmmk',
    '.kMMMMMMMMMMMgmmk.',
    '..kkmmmmmmmmmmkk..',
    '...kk.......kk....',
  ], { I: '#8a8794', G: '#a8d870', g: '#7aa848', d: '#5a8a38', M: '#4a4756', m: '#33313c', h: '#7a7788', c: window.LAB2 !== false ? '#26242e' : OUTK, k: OUTK }, cx - 9, cy - 14, false);
  P.spr(['.ww...ww.', 'wWWwwwWWw', '.kk...kk.'], { w: '#6a4a30', W: '#8e6e50', k: '#2a1e14' }, cx - 4, cy - 1, true);
  P.put(cx - 1, cy + 1, '#ff9a30'); P.put(cx + 1, cy + 1, '#ffd34d');
  // 바닥 양초 (뜨문뜨문) — 녹아 흐른 촛농
  for (const [x, y, h] of CANDLES) { const rows = []; for (let i = 0; i < h; i++) rows.push(i === 0 ? '.w.' : 'wWw'); rows.push('wwW'); P.spr(rows, { w: '#e8e0c8', W: '#c8c0a8' }, x - 1, y - h, true); P.put(x - 2, y, '#d8d0b8'); P.put(x + 2, y, '#c8c0a8'); }
  // 나무 밑둥 (키륵이 올라서는 자리): 큰 그루터기 — 나이테 윗면 · 껍질 옆면 · 갈라져 뻗은 뿌리
  { const sx = STUMP[0], sy = STUMP[1], rx = 12, ry = 4, hgt = 7, M = new Map(), put = (x, y, c) => M.set(x + ',' + y, c);
    for (let y = 0; y <= hgt + ry; y++) for (let x = -rx; x <= rx; x++) { const yy = y - hgt; if (y > hgt && (x / rx) ** 2 + (yy / ry) ** 2 > 1) continue; put(x, y, x % 4 === 0 ? '#3a2818' : x < -rx * 0.4 ? '#7a5838' : x > rx * 0.5 ? '#4a3220' : '#5e4228'); }
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const d = (x / rx) ** 2 + (y / ry) ** 2; if (d > 1) continue; const ring = Math.floor(Math.sqrt(d) * 5); put(x, y, d > 0.82 ? '#8a6a44' : ring % 2 ? '#c8a26a' : '#ddb87e'); }
    put(0, 0, '#8a6a44'); put(4, -1, '#6a4a2a'); put(5, 0, '#6a4a2a');
    for (const [dx, L, d] of [[-11, 5, -1], [-6, 3, -1], [6, 4, 1], [11, 5, 1]]) for (let i = 0; i < L; i++) put(dx + d * i, hgt + ry - 1 + Math.floor(i / 2), i === L - 1 ? '#4a3220' : '#6a4a2e');
    for (const k of M.keys()) { const [x, y] = k.split(',').map(Number); for (const [a2, b2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!M.has((x + a2) + ',' + (y + b2))) P.put(sx + x + a2, sy + y + b2, OUTK); }
    for (const [k, c] of M) { const [x, y] = k.split(',').map(Number); P.put(sx + x, sy + y, c); }
  }
  // 바구니 (약초) · 쌓인 책 (표지 보이게)
  P.spr(['.gGg.', 'bbbbb', 'bBbBb', '.bbb.'], { g: '#6a8a40', G: '#8aaa58', b: '#a88a4a', B: '#7a6030' }, 214, 130, true);
  for (let i = 0; i < 3; i++) { const c = ['#7a2a2a', '#2e4a6a', '#3a6a3a'][i]; P.rect(158 + (i % 2) - 1, 132 - i * 3 - 1, 12, 4, OUTK); P.rect(158 + (i % 2), 132 - i * 3, 10, 2, c); P.rect(158 + (i % 2), 132 - i * 3, 10, 1, '#d8c8a4'); P.put(158 + (i % 2) + 3, 132 - i * 3 + 1, '#c09038'); }
  if (window.LAB2 !== false) labProps2(P);
}
// v3.19 집기 다시 그림: 외곽선 기준(구조물 안 물건은 검은 선 대신 제 색을 어둡게) · 실험대 두께 · 바닥 양초 · 약초 시렁 · 바구니 · 쌓인 책
function labProps2(P) {
  const F = LGrid(); labDraw(F); const FD = F.g.getImageData(0, 0, LGW, LGH).data;
  const restore = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * LGW + x) * 4; P.put(x, y, `rgb(${FD[i]},${FD[i + 1]},${FD[i + 2]})`); } };
  const outlineOf = (M) => { for (const k of M.keys()) { const [x, y] = k.split(',').map(Number); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!M.has((x + a) + ',' + (y + b))) P.put(x + a, y + b, OUTK); } for (const [k, c] of M) { const [x, y] = k.split(',').map(Number); P.put(x, y, c); } };
  const spr = (rows, pal, x0, y0) => rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.' && pal[ch]) P.put(x0 + i, y0 + j, pal[ch]); }));
  { const [cx, cy] = LAB.cauldron; restore(cx - 13, cy - 16, cx + 13, cy + 9); }
  restore(129, 101, 155, 121); restore(200, 82, 227, 104); restore(165, 89, 181, 104); restore(155, 123, 171, 136); restore(212, 128, 222, 137);
  for (const [x, y, h] of CANDLES) restore(x - 3, y - h - 1, x + 3, y + 1);
  // ---- 가마솥을 모닥불 위에 (v3.19): 솥을 2칸 내려 불 속에 앉힘 · 잉걸 바닥 · 안쪽으로 모인 장작 셋(나무껍질 결 · 옹이 · 잘린 나이테 면 · 안쪽 끝은 타서 숯) · 불빛 받은 솥 밑면
  { const [cx, cy0] = LAB.cauldron, cy = cy0 + LAB_POTDY;
    for (let y = -2; y <= 2; y++) for (let x = -9; x <= 9; x++) { if ((x / 9) ** 2 + (y / 2.4) ** 2 > 1) continue; P.put(cx + x, cy + 3 + y, lh2(x, y, 401) < 0.22 ? '#c8501a' : lh2(x, y, 402) < 0.2 ? '#ff8a30' : '#3a1c10'); }
    const M = new Map(), log = (pts, vert) => { // 굵기 3칸 통나무: 칸 줄 [x, y] (바깥 → 안쪽). 가로 통나무는 위 · 가운데 · 아래 줄, 세로(앞) 통나무는 왼 · 가운데 · 오른 줄
      const SH = ['#a8865a', '#7a5a3a', '#4e3626'], BU = ['#4a2e1c', '#3a2416', '#24160c'];
      pts.forEach(([x, y], i) => { const t = i / (pts.length - 1), burnt = t > 0.7, knot = i === Math.floor(pts.length * 0.45);
        for (let k = 0; k < 3; k++) { const X = vert ? x + k : x, Y = vert ? y : y + k; let c = burnt ? BU[k] : SH[k]; if (knot && k === 1) c = '#4e3626'; if (!burnt && !knot && k === 1 && (i & 3) === 2) c = '#8a6a44'; M.set(X + ',' + Y, c); }
        if (t > 0.9) M.set((vert ? x + 1 : x) + ',' + (vert ? y : y + 1), '#e06a20'); }); // 안쪽 끝 불씨
      const [x, y] = pts[0]; for (let k = 0; k < 3; k++) M.set((vert ? x + k : x) + ',' + (vert ? y : y + k), k === 1 ? '#c89a62' : '#e0bc86'); }; // 바깥 끝 잘린 나이테 면
    const line = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), o = []; for (let i = 0; i <= n; i++) o.push([Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)]); return o; };
    // 장작은 하나씩 따로 외곽선 (겹친 곳만 선) — 뒤 → 앞 순서. 가운데로 모이는 세 토막 (양옆은 살짝 기울고, 앞 하나는 화면 쪽으로)
    for (const [pts, v] of [[line(cx - 11, cy + 3, cx - 3, cy + 1), false], [line(cx + 11, cy + 3, cx + 3, cy + 1), false], [line(cx - 1, cy + 8, cx - 1, cy + 3), true]]) { M.clear(); log(pts.slice().reverse().reverse(), v); outlineOf(M); }
    spr(['.y..y.', 'yOyyOy', 'OFOOFO'], { y: '#ff9a30', O: '#ffb040', F: '#fff2a8' }, cx - 3, cy); // 솥 밑 불 (솥이 위를 덮음)
    spr(['....kkkkkkkkkk....', '..kkIIIIIIIIIIkk..', '.kIIGGggggggggIIk.', 'kIIGgggggggggggdIk', '.kIIgggggggggddIk.', '..kkIIIIIIIIIIkk..', '.kMMMMMMMMMMMMMmk.', 'kMhhMMMMMMMMMMMmmk', 'kMhMMMMMMMMMcMMmmk', 'kMMMMMMMMMMMMcMmmk', 'kMMMMMMMMMMMMcgmmk', '.kMMMMMMMMMMMgmmk.', '..kkrrrrrrrrrrkk..', '...kk.......kk....'],
      { I: '#8a8794', G: '#a8d870', g: '#7aa848', d: '#5a8a38', M: '#4a4756', m: '#33313c', h: '#7a7788', c: '#26242e', k: OUTK, r: '#7a3e30' }, cx - 9, cy - 14); // 밑면은 불빛에 붉게
    P.put(cx - 6, cy - 3, '#6a4446'); P.put(cx + 5, cy - 3, '#6a4446'); }
  // ---- 약 선반 (2단): 판자 뒷판 · 선반 널 윗면/앞면 · 널 밑 그림자 · 물건은 제 색 테
  { const x0 = 131, y0 = 103, W = 22, H = 16, x1 = x0 + W - 1, y1 = y0 + H - 1;
    P.rect(x0 - 1, y0 - 1, W + 2, H + 2, OUTK);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) P.put(x, y, (x - x0) % 5 === 4 ? '#22170f' : x === x0 + 2 ? '#3a2a1e' : '#2e2016');
    for (let y = y0; y <= y1; y++) { P.put(x0, y, '#8e6e50'); P.put(x0 + 1, y, '#5e4430'); P.put(x1 - 1, y, '#6a4a30'); P.put(x1, y, '#4e3626'); }
    for (let x = x0; x <= x1; x++) { P.put(x, y0, '#b08c60'); P.put(x, y0 + 1, '#7a5a3a'); }
    for (const by of [y0 + 7, y1 - 1]) for (let x = x0 + 2; x <= x1 - 2; x++) { P.put(x, by, '#9a7a52'); P.put(x, by + 1, '#6a4a30'); }
    for (let x = x0 + 2; x <= x1 - 2; x++) { P.put(x, y0 + 2, '#1a120c'); P.put(x, y0 + 9, '#1a120c'); }
    const jar = (x, fy, c, l, d) => spr(['.ll.', 'lccd', 'cccd', 'cccd', '.dd.'], { l, c, d }, x, fy - 4);
    jar(x0 + 3, y0 + 6, '#a86a3a', '#c88a5a', '#6a4024');
    spr(['.w.', '.n.', 'gGd', 'GGd', 'ggd'], { w: '#8e6e50', n: '#4a6a28', g: '#7aa848', G: '#c8f090', d: '#4a6a28' }, x0 + 9, y0 + 2); // 빛나는 점액 병
    spr(['wwww', 'pRrd', 'prrd', 'pppd'], { w: '#8e6e50', R: '#e8d0b8', r: '#a83a2a', p: '#9ab8c0', d: '#5a7a86' }, x0 + 14, y0 + 3); // 버섯 병
    jar(x0 + 3, y1 - 2, '#6a5a8a', '#9a8ab8', '#3e3458');
    spr(['g...g.', 'ggggggd', '.g..gd.'], { g: '#7a9a48', d: '#3e5a26' }, x0 + 9, y1 - 4); // 말린 도마뱀
    jar(x0 + 16, y1 - 2, '#8a5a3a', '#b07a50', '#5a3a22'); }
  // ---- 실험대: 상판 두께(윗면 2줄 · 앞판 3줄) · 굵은 다리 · 가로대, 덩어리 바깥에만 외곽선
  { const [tx, ty] = LAB.table, M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c);
    for (let x = tx; x < tx + 26; x++) { const seam = (x - tx) % 9 === 8; set(x, ty, seam ? '#8a6a44' : '#b08c60'); set(x, ty + 1, seam ? '#6a4a30' : '#9a7a52'); for (let y = ty + 2; y < ty + 5; y++) set(x, y, y === ty + 4 ? '#4a3422' : (x - tx) % 9 === 8 ? '#5a4028' : '#6a4a30'); }
    for (const lx of [tx + 1, tx + 23]) for (let y = ty + 5; y < ty + 11; y++) { set(lx, y, '#7a5a3a'); set(lx + 1, y, '#4a3422'); }
    for (let x = tx + 3; x < tx + 23; x++) set(x, ty + 8, x === tx + 3 ? '#5e4430' : '#5e4430');
    outlineOf(M);
    for (let x = tx; x < tx + 27; x++) if (x & 1) P.put(x, ty + 11, DIRT[5]); // 바닥 그림자
    // 위: 조롱박 증류기 · 대롱 · 받는 잔 · 약병 셋 꽂이 · 돌절구와 공이 — 검은 선 없이 제 색 테
    spr(['..nn..', '..nN..', '.aAAa.', 'aAAAad', 'aaaaad', '.dddd.'], { n: '#c8a870', N: '#8a7048', a: '#b0904e', A: '#e8d098', d: '#7a6030' }, tx + 2, ty - 6);
    P.line(tx + 5, ty - 6, tx + 10, ty - 9, '#9aaa60'); P.line(tx + 10, ty - 9, tx + 11, ty - 5, '#9aaa60'); P.put(tx + 10, ty - 8, '#6a7a40');
    spr(['dccd', 'cPpd', '.dd.'], { c: '#a86a3a', P: '#9ad060', p: '#5a8a38', d: '#6a4024' }, tx + 10, ty - 3);
    for (const [i, g, G, d] of [[0, '#7ad050', '#c8f090', '#3e6a28'], [1, '#e0a040', '#ffd890', '#8a5a1a'], [2, '#5a8ad0', '#a8c8f0', '#2e4a7a']]) spr(['.w', 'GD', 'gD', 'gD'], { w: '#8e6e50', G, g, D: d }, tx + 15 + i * 3, ty - 5);
    for (let x = tx + 14; x < tx + 23; x++) P.put(x, ty - 1, '#6a4a30');
    spr(['SSSSS', 'sGGGs', '.sss.'], { S: '#a8a294', s: '#6e685c', G: '#5a8a38' }, tx + 20, ty - 3); P.line(tx + 23, ty - 3, tx + 25, ty - 7, '#c8c2b4'); }
  // ---- 약초 시렁: 기둥 둘 · 가로대 · 매달린 다발 셋 (빨랫줄처럼)
  { const x0 = 166, x1 = 181, y0 = 91, y1 = 103, M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c);
    for (let y = y0; y <= y1; y++) { set(x0, y, '#8e6e50'); set(x0 + 1, y, '#5e4430'); set(x1 - 1, y, '#7a5a3a'); set(x1, y, '#4e3626'); }
    for (let x = x0; x <= x1; x++) { set(x, y0, '#b08c60'); set(x, y0 + 1, '#6a4a30'); }
    outlineOf(M);
    for (const [x, g, G, d] of [[169, '#5a7a38', '#8aaa58', '#3a5224'], [173, '#7a5a9a', '#a88ac8', '#4a3a62'], [177, '#a8904a', '#d0b86a', '#6a5a2a']]) { P.put(x + 1, y0 + 2, '#5a4a38'); spr(['gGg', 'GgG', 'gGd', '.gd', '.d.'], { g, G, d }, x, y0 + 3); }
    for (let x = x0 + 2; x <= x1 - 2; x++) if (x & 1) P.put(x, y1 + 1, DIRT[5]); }
  // ---- 바닥 양초: 굵은 몸 · 심지 · 흘러내린 촛농 · 바닥에 고인 촛농 (불꽃은 움직임에서)
  for (const [x, y, h] of CANDLES) { const M = new Map(); for (let k = 1; k <= h + 1; k++) { M.set(x + ',' + (y - k), '#ece4cc'); M.set((x + 1) + ',' + (y - k), '#c8c0a8'); } outlineOf(M);
    P.put(x, y - h - 2, '#2a2228'); P.put(x - 1, y - h + 1, '#e0d8c0'); P.put(x + 2, y - 1, '#d8d0b8'); for (let i = -2; i <= 3; i++) P.put(x + i, y, i === 3 ? '#a8a090' : i === -2 ? '#c8c0a8' : '#d8d0b8'); }
  // ---- 쌓인 책 셋: 더미 바깥에만 외곽선, 권마다 종이 면 · 표지 · 어두운 아래 면
  { const M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c);
    [['#7a2a2a', '#4e1a1a'], ['#2e4a6a', '#1e3048'], ['#3a6a3a', '#244424']].forEach(([c, d], i) => { const bx = 158 + (i % 2), by = 131 - i * 3; for (let x = bx; x < bx + 10; x++) { set(x, by, x === bx || x === bx + 9 ? c : '#d8c8a4'); set(x, by + 1, c); set(x, by + 2, d); } set(bx + 3, by + 1, '#c09038'); set(bx + 4, by + 1, '#c09038'); });
    outlineOf(M); }
  // ---- 약초 바구니: 엮은 결 · 테 · 위로 삐져나온 약초
  { const M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c), x0 = 213, y0 = 129;
    ['..gGgG..', '.gGgGgg.', 'rrrrrrrr', 'bBbBbBbd', 'BbBbBbBd', '.dddddd.'].forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') set(x0 + i, y0 + j, { g: '#6a8a40', G: '#9aba68', r: '#c8a868', b: '#a88a4a', B: '#8a6e38', d: '#5a4624' }[ch]); }));
    outlineOf(M); }
}
// v3.19 솥 밑 모닥불: 솥 밑에서 일렁이는 불 · 양옆을 핥아 오르는 불 · 튀는 불티
function cauldronFire(t) {
  const cx = LAB.cauldron[0], cy = LAB.cauldron[1] + LAB_POTDY, f = n => Math.floor(t * 9 + n * 2.3) % 3;
  for (const [x, n] of [[cx - 3, 0], [cx, 1], [cx + 2, 2]]) { const k = f(n); px(x, cy - 1, k ? '#ffd34d' : '#fff2a8'); px(x + (k === 2 ? 1 : 0), cy - 2, '#ffb040'); }
  for (const [x, d, n] of [[cx - 11, -1, 3], [cx + 10, 1, 4]]) { const k = f(n), hgt = 2 + k; for (let i = 0; i < hgt; i++) px(x + (i === hgt - 1 && k === 1 ? d : 0), cy - 3 - i, i === 0 ? '#ff9a30' : i === hgt - 1 ? '#fff2a8' : '#ffd34d'); }
  for (let i = 0; i < 3; i++) { const per = 1.1 + i * 0.37, k = ((t + i * 0.41) % per) / per; if (k < 0.7) px(cx - 8 + i * 7 + Math.round(Math.sin(t * 3 + i) * 1.5), cy - 4 - Math.floor(k * 9), k < 0.35 ? '#ffd34d' : '#ff8a30'); }
}
// 솥 안 초록 액체가 부글부글
function cauldronBubbles(t) { // 타원으로 고인 초록 액체 위에서 부글부글
  const cx = LAB.cauldron[0], cy = LAB.cauldron[1] + LAB_POTDY, ex = cx, ey = cy - 11; // 액체 타원 가운데 (가로 6 · 세로 1)
  const inL = (x, y) => ((x - ex) / 6.5) ** 2 + ((y - ey) / 1.4) ** 2 <= 1;
  for (let i = 0; i < 4; i++) { const x = ex - 5 + ((Math.floor(t * 3) * 3 + i * 4) % 11), y = ey + ((i + Math.floor(t * 2)) % 3) - 1; if (inL(x, y)) px(x, y, '#9ac860'); } // 일렁이는 윤슬
  for (let i = 0; i < 5; i++) { const per = 0.9 + hh(i, 2) * 0.6, k = ((t + hh(i, 3) * per) % per) / per, x = ex - 4 + Math.round(hh(i, 1) * 8), y = ey + (i % 3) - 1;
    if (!inL(x, y)) continue;
    if (k < 0.45) { px(x, y, k < 0.2 ? '#9ac860' : '#c8f090'); if (k > 0.25) { px(x, y - 1, '#e0ffb0'); px(x - 1, y, '#a8d870'); px(x + 1, y, '#5a8a38'); } }
    else if (k < 0.58) { px(x - 1, y - 2, '#c8f090'); px(x + 1, y - 2, '#c8f090'); px(x, y - 3, '#e0ffb0'); } }
  for (let i = 0; i < 3; i++) { const k = (t * 0.4 + i / 3) % 1; if (dth2(i, Math.floor(k * 16)) < 0.6 - k * 0.5) px(ex - 3 + i * 3 + Math.round(Math.sin(k * 6 + i) * 1.5), ey - 3 - Math.floor(k * 12), 'rgba(170,220,140,.45)'); } // 김
}
const LAB_LIGHTS = [
  { x: 146, y: 40, r: 30, a: 0.45, c: [255, 220, 150], sy: 0.4 }, // 천장 구멍 빛줄기 위쪽
  ...CANDLES.map(([x, y]) => ({ x, y: y - 3, r: 20, a: 0.55, c: [255, 170, 80] })),
  { x: 230, y: 89, r: 34, a: 0.75, c: [255, 170, 80] },  // 해골 촛대
  { x: 178, y: 132, r: 18, a: 0.4, c: [90, 220, 200] }, // 빛나는 버섯
  { x: 146, y: 64, r: 26, a: 0.55, c: [255, 220, 150], sy: 0.6 }, // 사다리 위에서 드는 빛
  window.LAB2 !== false ? { x: 188, y: 112, r: 28, a: 0.6, c: [255, 150, 70] } : { x: 188, y: 110, r: 20, a: 0.45, c: [255, 150, 70] }, // 솥 밑 불 (v3.19 모닥불이라 더 넓고 밝게)
  { x: 188, y: 104, r: 16, a: 0.25, c: [150, 220, 90] }, // 솥 점액
  { x: 192, y: 130, r: 46, a: 0.22 },
];
let LABIMG = null;
function labBuild() {
  if (LABIMG) return LABIMG;
  const P = LGrid(); labDraw(P); labProps(P, 0); frontGround(P);
  const [base, bg] = __mk(768, 432); bg.imageSmoothingEnabled = false; bg.drawImage(P.c, 0, 0, 768, 432);
  const [ov, og] = __mk(768, 432); lshade(og, LAB_LIGHTS, 0.3);
  return (LABIMG = { base, ov });
}
// ---- 키륵: 플레이어블 캐릭터와 같은 공식 (18×14칸, 큰 머리 · 짧은 몸, 2배)
const KIRK2 = [
  '......kkkkkk......',
  '.....kWWWWssk.....',
  'kk..ksWWWWWsSk..kk',
  'kSkksssssWWsSSkkSk',
  '.kSSsseessWWsSSSk.',
  '..kkssssssssSSkk..',
  '....kswkkkkwSk....',
  '....kkssssssSkk...',
  '...kRRRyyRRRk.....',
  '..kRrrrRyRrrRkk...',
  '.ksRrrrRyRrrRRsk..',
  '..kRrrrrRRrrRRk...',
  '..kRRrRrRRrRrRk...',
  '...kkdkkkkkkdkk...',
];
const KIRK2_P = { k: '#0e120a', s: '#6e9a3a', S: '#46682a', e: '#ffd23a', W: '#e8e0c8', w: '#ece0c4', R: '#3a3052', r: '#5a4c74', y: '#c8a050', d: '#3a2a1e' };
// 지팡이: 무기와 같은 칸 규칙 (1칸 자루 · 칸 단위 회전 · 바깥 1칸 외곽선) — 살아 있는 나뭇가지
const NSTAFF = (() => { const w = 27, h = 11, cy = 5, g = Array.from({ length: h }, () => Array(w).fill('.')), put = (x, y, c) => { if (x >= 0 && x < w && y >= 0 && y < h) g[y][x] = c; };
  for (let x = 0; x < 20; x++) put(x, cy, x % 4 === 1 ? 'v' : x % 2 ? 'H' : 'h'); // 자루 + 감긴 덩굴
  put(7, cy - 1, 'l'); put(8, cy - 1, 'L'); put(13, cy + 1, 'l'); put(14, cy + 1, 'L'); // 돋은 잎
  for (const [x, y] of [[20, -1], [21, -2], [22, -2], [20, 1], [21, 2], [22, 2], [20, 0]]) put(x, cy + y, 'h'); // 잔가지가 감싸 쥠
  for (const [x, y, c] of [[21, -1, 'O'], [22, -1, 'W'], [21, 0, 'o'], [22, 0, 'O'], [23, 0, 'O'], [21, 1, 'o'], [22, 1, 'o'], [23, -1, 'O'], [23, 1, 'o']]) put(x, cy + y, c); // 씨앗 같은 수정
  for (const [x, y, c] of [[23, -3, 'l'], [24, -3, 'L'], [23, 3, 'L'], [24, 3, 'l'], [24, 0, 'h'], [25, 0, 'l'], [25, -1, 'L']]) put(x, cy + y, c); // 새잎
  return { cells: g, w, h, px: 4, py: cy, pal: { h: '#8a6a42', H: '#6a4a2a', v: '#4e8a30', l: '#7ac050', L: '#4e8a30', o: '#3a7a20', O: '#7ad050', W: '#d8ffb0' } }; })();
function drawCellWeapon(b, hx, hy, ang) { // 칸 좌표 hx,hy = 손 · ang = 무기 방향
  const flip = Math.cos(ang) < 0, ca = Math.cos(ang), sa = Math.sin(ang), R = Math.ceil(Math.hypot(b.w, b.h)) + 2, out = new Map();
  for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const lx = x * ca + y * sa; let ly = -x * sa + y * ca; if (flip) ly = -ly; const sx = Math.round(lx + b.px), sy = Math.round(ly + b.py); if (sx >= 0 && sx < b.w && sy >= 0 && sy < b.h && b.cells[sy][sx] !== '.') out.set(x + ',' + y, b.cells[sy][sx]); }
  for (const k of out.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!out.has((x + dx) + ',' + (y + dy))) px(hx + x + dx, hy + y + dy, '#0b0a0e'); }
  for (const [k, v] of out) { const [x, y] = k.split(',').map(Number); px(hx + x, hy + y, b.pal[v]); }
}
function kirk2(cx, by, t, opt = {}) { // 칸 좌표 (발 가운데) · 기본은 왼쪽(플레이어 쪽)을 봄 · 몸은 플레이어와 같이 지도 그대로(외곽선 k 포함) 2배
  const flip = !opt.right, idle = !opt.still && !opt.book && !opt.aim, bob = 0, /* v3.78 통째로 들썩이던 것 대신 대기 모션(아래) · 일지를 읽을 땐 그대로 */ W = 18, H = 14, x0 = cx - 9, y0 = by - H - bob;
  for (let x = -7; x <= 7; x++) if (dth2(cx + x, by) < 0.75) px(cx + x, by, 'rgba(0,0,0,.45)');
  const at = (x, y) => (y >= 0 && y < H && x >= 0 && x < W) ? KIRK2[y][flip ? W - 1 - x : x] : '.';
  const f = flip ? -1 : 1, hx = flip ? x0 + 3 : x0 + 14, hy = y0 + 10;
  // v3.78 대기 모션: 숨 쉴 때 머리만 1칸 내려감(몸은 그대로) · 3.4초마다 눈 깜빡 · 5.3초마다 두 귀가 쫑긋 · 지팡이가 천천히 흔들림
  const hd = idle && (t * 0.8) % 1 > 0.5 ? 1 : 0, blink = idle && ((t % 3.4) < 0.13 || ((t + 1.7) % 6.8) < 0.1), ear = idle && (t % 5.3) < 0.28, sway = idle ? Math.round(Math.sin(t * 1.3) * 2) * 0.04 : 0;
  const angIdle = (flip ? -Math.PI / 2 - 0.22 : -Math.PI / 2 + 0.22) + sway, angAim = flip ? Math.PI + 0.42 : -0.42;
  if (!opt.book && !opt.aim) drawCellWeapon(NSTAFF, hx, hy, angIdle); // 세워 들면 몸 뒤
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let ch = at(x, y); if (ch === '.') continue;
    if (blink && y === 4 && ch === 'e') ch = 'S'; // 감은 눈
    const isEar = ear && y >= 2 && y <= 4 && (x <= 3 || x >= 14); // 귀 끝이 1칸 들림
    px(x0 + x, y0 + y + (y < 8 ? hd : 0) - (isEar ? 1 : 0), KIRK2_P[ch]); }
  if (opt.book) { // v3.75 읽는 눈: 눈동자가 왼→오로 천천히 훑고 줄 끝에서 처음으로 돌아감 (책을 보느라 한 칸 아래 · 눈꺼풀 반쯤)
    const k = (t * 0.9) % 1, off = k < 0.85 ? Math.floor(k / 0.85 * 3) - 1 : -1;
    for (let x = 0; x < W; x++) if (at(x, 4) === 'e') { px(x0 + x, y0 + 4, KIRK2_P.s); }
    const ex = []; for (let x = 0; x < W; x++) if (at(x, 4) === 'e') ex.push(x);
    for (const x of ex) { px(x0 + x + off, y0 + 4, KIRK2_P.e); px(x0 + x + off, y0 + 3, KIRK2_P.S); } }
  if (opt.aim) { drawCellWeapon(NSTAFF, hx, hy, angAim);
    if (opt.puff) { const L = 25, tx = hx + Math.round(Math.cos(angAim) * L), ty = hy + Math.round(Math.sin(angAim) * L), k = (t * 1.4) % 1; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; px(Math.round(tx + Math.cos(a) * (1.5 + k * 4)), Math.round(ty + Math.sin(a) * (1 + k * 2) - k * 5), k < 0.5 ? '#a8a89e' : '#6a6a64'); } } }
  if (opt.book) { // 펼쳐 든 일지: 보는 쪽에는 활짝 펴진 겉표지(앞·뒤 표지가 V자로 · 가운데 책등 · 금박 잎 문양) + 위로 살짝 보이는 책장
    const B = ['kk.......kk', 'kpkk...kkpk', 'kCCCkkkCyCk', 'kCCCCBCyyCk', 'kCCCCBCCyCk', 'kCCCCBCCCCk', '.kkkkBkkkk.', '.....k.....'], pal = { k: '#0e120a', p: '#f0e6cc', C: '#8a5232', B: '#4e2c18', y: '#e8c870' };
    const bx = cx - 5 + (flip ? -2 : 2), byy = y0 + 8; // v3.75 얼굴(입 · 턱) 아래 가슴 앞으로 내림
    for (let y = 0; y < B.length; y++) for (let x = 0; x < 11; x++) { const ch = B[y][flip ? 10 - x : x]; if (ch !== '.') px(bx + x, byy + y, pal[ch]); }
    for (const dx of [-1, 11]) { px(bx + dx, byy + 3, KIRK2_P.s); px(bx + dx, byy + 4, KIRK2_P.S); px(bx + dx + (dx < 0 ? -1 : 1), byy + 3, '#0e120a'); px(bx + dx + (dx < 0 ? -1 : 1), byy + 4, '#0e120a'); px(bx + dx, byy + 5, '#0e120a'); px(bx + dx, byy + 2, '#0e120a'); }
    { const T = t % 2.6; if (T < 0.36) { // v3.75 책장 넘김: 2.6초마다 한 장이 책등을 넘어감 (펴진 쪽 → 반대쪽)
      const k = T / 0.36, d = flip ? -1 : 1, sx = bx + 5 + Math.round((k * 2 - 1) * 4) * d, lift = Math.round(Math.sin(k * Math.PI) * 3);
      for (let i = 0; i < 2; i++) px(sx, byy + 1 - lift + i, '#f0e6cc'); px(sx, byy - lift, '#0e120a'); px(sx, byy + 3 - lift, '#0e120a'); } }
  }

}
function kirkPeek(t) { const tx = LAB.table[0] + 4, ty = LAB.table[1] + 1; if (Math.sin(t * 1.3) < -0.2) return; for (const [x, y, c] of [[tx + 6, ty + 2, '#0e120a'], [tx + 7, ty + 1, '#6e9a3a'], [tx + 8, ty + 1, '#46682a'], [tx + 9, ty + 2, '#0e120a'], [tx + 7, ty + 2, '#6e9a3a']]) px(x, y, c); }
// 장면 그리기: 바닥 → 캐릭터 → 그림자(빛) → 미니맵
// ---- 키륵 등장: 마력이 없어 허리 주머니의 연막 가루로 마법사 흉내 — 바닥 룬 고리 → 초록 불티 소용돌이 → 펑! 연기 → 연기 속에서 지팡이를 겨눈 채 나타남
function motes(t) { const [cx, cy] = KP; for (let i = 0; i < 4; i++) { const k = (t * 0.5 + i / 4) % 1; if (k > 0.6) continue; px(cx - 6 + i * 4 + Math.round(Math.sin(k * 6 + i) * 2), cy - 4 - Math.floor(k * 14), dth2(i, Math.floor(k * 9)) < 0.5 ? '#b8f080' : '#5a9a30'); } }
const APPEAR = 4.2;
function appearRing(t) { const T = t % APPEAR, cx = STUMP[0], cy = STUMP[1]; if (T > 2.2) return; const a = Math.min(1, T / 0.6) * (T > 1.6 ? 1 - (T - 1.6) / 0.6 : 1);
  for (let i = 0; i < 48; i++) { const q = i / 48 * Math.PI * 2 + T * 1.5; if (hh(i, 3) > a) continue; px(Math.round(cx + Math.cos(q) * 9), Math.round(cy + Math.sin(q) * 3), i % 5 === 0 ? '#d8ffb0' : '#6ab040'); }
  for (let i = 0; i < 6; i++) { const q = i / 6 * Math.PI * 2 - T * 2; if (hh(i, 5) > a) continue; const x = Math.round(cx + Math.cos(q) * 5), y = Math.round(cy + Math.sin(q) * 1.6); px(x, y, '#b8f080'); px(x + 1, y, '#5a9a30'); } }
function appearFx(t) { const T = t % APPEAR, [cx, cy] = KP;
  if (T < 1.05) { const n = 14; for (let i = 0; i < n; i++) { const k = (T / 1.05 + i / n) % 1, q = i / n * Math.PI * 2 + T * 5, r = 12 * (1 - k * 0.7); px(Math.round(cx + Math.cos(q) * r), Math.round(cy - 2 - k * 16 + Math.sin(q) * r * 0.35), k > 0.7 ? '#e8ffc0' : '#8ad050'); } glow(cx, cy - 6, 14 + T * 8, '150,240,90', 0.25 + T * 0.2, 10); }
  else if (T < 1.25) { const k = (T - 1.05) / 0.2; glow(cx, cy - 7, 30, '220,255,170', 0.7 * (1 - k), 20); for (let i = 0; i < 16; i++) { const q = i / 16 * Math.PI * 2; px(Math.round(cx + Math.cos(q) * (6 + k * 14)), Math.round(cy - 7 + Math.sin(q) * (4 + k * 8)), '#f0ffd8'); } }
  if (T > 1.05 && T < 2.6) { const k = (T - 1.05) / 1.55; // 연기 덩이: 퍼지며 옅어짐
    for (let i = 0; i < 9; i++) { const q = hh(i, 1) * Math.PI * 2, d = 4 + k * (8 + hh(i, 2) * 8), r = Math.round(3 + hh(i, 3) * 3 + k * 2), x0 = Math.round(cx + Math.cos(q) * d * 1.4), y0 = Math.round(cy - 7 + Math.sin(q) * d * 0.7 - k * 6);
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { if (x * x + y * y > r * r) continue; if (dth2(x0 + x, y0 + y) > 0.95 - k * 0.9) continue; px(x0 + x, y0 + y, y < -r * 0.3 ? '#b8bcb0' : y < r * 0.4 ? '#8a9086' : '#5e6660'); } } } }

// 앞쪽 흙벽 윗가장자리: 내려다보는 구덩이처럼 아래 호를 가림 + 늘어진 뿌리
function frontLip(P) {
  const { ecx, ecy, erx, ery } = LAB;
  for (let x = ecx - erx - 4; x <= ecx + erx + 4; x++) { const t = (x + 0.5 - ecx) / (erx + 4); if (Math.abs(t) > 1) continue; const yb = Math.round(ecy + (ery + 4) * Math.sqrt(1 - t * t)); const th = Math.max(3, Math.round(7 * Math.sqrt(1 - t * t)));
    for (let y = yb - th; y <= yb; y++) P.put(x, y, y === yb - th ? '#5a4632' : y === yb - th + 1 ? '#4a3826' : lh2(x >> 1, y, 91) < 0.5 ? '#2e2216' : '#261c12');
    P.put(x, yb - th - 1, OUTK); P.put(x, yb + 1, OUTK);
    if (lh2(x, 3, 92) < 0.12) for (let k = 1; k <= 2 + Math.floor(lh2(x, 4, 93) * 3); k++) P.put(x, yb - th - 1 - k, k % 2 ? '#3a2a1a' : '#2e2216'); }
}

// 앞쪽 땅이 그 위 소품(나무 밑둥 등)을 가림: 테두리 바깥 · 앞쪽 절반만 다시 칠함
function frontGround(P) {
  const { eF, eR, rcy } = LAB;
  for (let y = Math.round(rcy); y < LGH; y++) for (let x = 0; x < LGW; x++) { const r = eR(x, y), chk = (x + y) & 1; if (r <= 1) continue;
    if (r < 1.06) P.put(x, y, OUTK); else if (r < 1.32) { const fade = (r - 1.06) / 0.26; P.put(x, y, lh2(x, y, 83) > fade * 1.1 || (chk && fade < 0.5) ? (fade < 0.3 ? '#33261a' : '#2a1e14') : OUTK); } else P.put(x, y, OUTK); }
}

// 천장(위)에서 초록 점액 방울이 가끔 떨어짐 — 바닥에 닿으면 작게 튐
const DRIPS2 = [[176, 104], [214, 118], [160, 122], [228, 98], [196, 132]];
function ceilingDrips(t) {
  DRIPS2.forEach(([x, fy], i) => { const per = 3.4 + i * 0.7, k = ((t + i * 1.3) % per) / per; if (k > 0.32) return;
    const f = k / 0.26; if (f <= 1) { const y = Math.round(-4 + (fy + 4) * f * f); px(x, y, '#9ad060'); px(x, y - 1, '#c8f090'); if (f > 0.3) px(x, y - 2, 'rgba(154,208,96,.5)'); }
    else { const s = (f - 1) / 0.23; for (const [dx, dy] of [[-2, -1], [2, -1], [-1, -2], [1, -2]]) px(x + Math.round(dx * (1 + s)), fy + Math.round(dy * (0.5 + s)), '#9ad060'); px(x, fy, '#5a8a38'); } });
}


  // ================================================================ 게임 연결 (v2.58) — 시안 함수는 칸(2px) 좌표로 g에 그린다
  const even = v => Math.round(v / 2) * 2;
  // 월드 좌표 (wx, wy)에 시안의 칸 좌표 (ax, ay)가 오도록 옮겨서 그림
  function at(wx, wy, ax, ay, fn) { const o = g; g = ctx; ctx.save(); ctx.translate(even(wx - ax * 2), even(wy - ay * 2)); try { fn(); } finally { ctx.restore(); g = o; } }
  // 정지 그림은 한 번만 구워 둠: 캔버스 W×H(px), 시안 칸 (ax, ay)가 캔버스의 (ox, oy)px에
  const BK = {};
  function bake(key, W, H, ox, oy, ax, ay, fn) {
    if (BK[key]) return BK[key];
    const [c, x] = __mk(W, H), o = g; g = x; x.translate(ox - ax * 2, oy - ay * 2);
    try { fn(); } finally { g = o; }
    return (BK[key] = { c, ox, oy });
  }
  const put = (b, wx, wy) => ctx.drawImage(b.c, even(wx - b.ox), even(wy - b.oy));
  const TS = () => SAVE.truth || (SAVE.truth = {});
  // v2.74 2회차 = 지금 캐릭터의 전기(연대기)가 만들어짐 (그 캐릭터로 원정 완료 · 예전 저장의 leg1/leg2 기록도 인정)
  const loop2 = () => { const F = DEV && SAVE.devLoopF && G && SAVE.devLoopF[G.cls]; if (F != null) return !!F; /* v3.20 테스트 모드 Shift+Z: 실제 기록과 상관없이 1회차 / 2회차로 강제 */ const c = G && G.cls && SAVE.chronicle && SAVE.chronicle[G.cls]; return !!(c && (c.normal || c.leg1 || c.leg2)); };
  const GR = '#7ad050';
  const Q = () => G.tq1 || (G.tq1 = { q: 0, met: false });
  const curR = () => G && G.dun && G.dun.cur;

  // ---------------------------------------------------------------- 1장 던전 준비 (genDungeon 끝에서)
  function prep1(rooms) {
    const cells = new Set(rooms.map(r => r.gx + ',' + r.gy));
    const nbN = (x, y) => Object.keys(DIRS).filter(d => cells.has((x + DIRS[d][0]) + ',' + (y + DIRS[d][1]))).length;
    const cand = [];
    for (const r of rooms) {
      if (r.type !== 'combat') continue;
      for (const d of ['e', 'w', 'n']) {
        if (r.doors[d] != null || (r.crack && r.crack.dir === d)) continue;
        const x = r.gx + DIRS[d][0], y = r.gy + DIRS[d][1];
        if (cells.has(x + ',' + y) || nbN(x, y) !== 1) continue;
        cand.push({ r, d, x, y, w: (r.depth || 0) * 2 + (d === 'n' ? 0 : 1) + Math.random() });
      }
    }
    if (!cand.length) return false;
    cand.sort((a, b) => b.w - a.w);
    const { r: T, d, x, y } = cand[0];
    if (rooms.some(r => r.type === 'secret' && r.gx === x && r.gy === y)) return false;
    const H = { id: rooms.length, gx: x, gy: y, type: 'hidden', doors: { n: null, s: null, w: null, e: null }, visited: false, seen: false, cleared: true, loot: [], seed: randi(1, 2e9), shape: 'glade', depth: (T.depth || 0) + 1, tier: 1, hfrom: T.id, hdir: OPP[d] };
    rooms.push(H);
    // 나무 자리: 그 방의 해당 쪽 숲 가장자리
    const treeAt = dd => dd === 'e' ? { x: even(A.x1 - 10), y: even(CY + 18) } : dd === 'w' ? { x: even(A.x0 + 10), y: even(CY + 18) } : dd === 'n' ? { x: even(CX + 70), y: even(A.y0 + 10) } : { x: even(CX - 70), y: even(A.y1 - 6) }; // v2.58 울타리에 딱 붙게
    setArena(SHAPES[T.shape]);
    T.slimeTree = Object.assign(treeAt(d), { dir: d });
    T.obs = T.obs.filter(b => Math.hypot((b.x || 0) - T.slimeTree.x, (b.y || 0) - T.slimeTree.y) > 60);
    T.obs.push({ t: 'prop', c: true, x: T.slimeTree.x, y: T.slimeTree.y - 4, r: 11 });
    T.nav = buildNav(T.obs);
    setArena(SHAPES[H.shape]); layoutRoom(H, 1);
    H.slimeTree = Object.assign(treeAt(H.hdir), { dir: H.hdir, back: true });
    const pd = { x: even(CX + (H.hdir === 'w' ? 40 : H.hdir === 'e' ? -40 : 0)), y: even(CY + (H.hdir === 'n' ? 24 : -6)) };
    H.pond = { x: pd.x, y: pd.y, state: 'pond', t: 0, cyc: 0 };
    H.obs = H.obs.filter(b => Math.hypot((b.x || 0) - pd.x, (b.y || 0) - pd.y) > 80 && Math.hypot((b.x || 0) - H.slimeTree.x, (b.y || 0) - H.slimeTree.y) > 60);
    H.obs.push({ t: 'prop', c: true, x: H.slimeTree.x, y: H.slimeTree.y - 4, r: 11 });
    for (const dx of [-30, 0, 30]) H.obs.push({ t: 'prop', c: true, x: pd.x + dx, y: pd.y, r: dx ? 14 : 18, pond: true });
    H.nav = buildNav(H.obs);
    // 시작 방 → 나무 방 길: 길 위 방마다 다음 방 쪽 문 앞에 굳은 점액 한 덩이
    const prev = new Map([[rooms[0].id, null]]), q = [rooms[0]];
    while (q.length) { const r = q.shift(); if (r === T) break; for (const dd in r.doors) { const id = r.doors[dd]; if (id == null || prev.has(id)) continue; if (r.crack && r.crack.dir === dd && !r.crack.broken) continue; prev.set(id, [r, dd]); q.push(rooms[id]); } }
    if (prev.has(T.id)) for (let cur = T, p = prev.get(T.id); p; cur = p[0], p = prev.get(p[0].id)) {
      const [r, dd] = p; setArena(SHAPES[r.shape]); const q2 = doorIn(dd, 46), side = dd === 'n' || dd === 's' ? [24, 0] : [0, 18];
      r.slimeGate = { x: even(q2.x + side[0]), y: even(q2.y + side[1]), i: r.id % 5, dir: dd }; // v2.67 점액은 다음 방 쪽 문 기둥에 묻어 있음
    }
    // 폭발의 흔적: v2.81 그리지 않음 (사용자 결정 — 1장 점액 폭발 자국 제거)
    const sc = rooms.filter(r => (r.type === 'combat' || r.type === 'elite') && r !== T).sort(() => Math.random() - 0.5).slice(0, randi(2, 3));
    for (const r of sc) { setArena(SHAPES[r.shape]); const ang = Math.atan2(r.gy - y, r.gx - x); r.scorch = [];
      if (false) for (let i = 0; i < randi(1, 2); i++) r.scorch.push({ x: even(rand(A.x0 + 90, A.x1 - 90)), y: even(rand(A.y0 + 60, A.y1 - 50)), s: randi(11, 17), ang, k: randi(0, 99) }); }
    setArena(SHAPES.field);
    return true;
  }

  // ---------------------------------------------------------------- 바닥 위 그림 (drawSqueeze 옆에서)
  function scorchArt(s) { return bake('sc' + s.s + '_' + s.k + '_' + Math.round(s.ang * 4), 200, 120, 100, 60, 50, 30, () => { scorch(50, 30, s.s, s.ang); scorchRays(50, 30, s.s, s.ang); glass(50 + Math.round(Math.cos(s.ang) * 8), 30, 5); slimeBlob(46 + (s.k % 3) * 6, 33, 2 + (s.k % 2), s.k); }); }
  const blobArt = i => bake('gate' + i, 40, 28, 20, 14, 10, 7, () => slimeBlob(10, 7, 3, 2 + i));
  const treeArt = () => bake('tree', 104, 136, 52, 100, 26, 50, () => { const o = BUSH.cx, oy = BUSH.cy; BUSH.cx = 26; BUSH.cy = 50; try { slimeTree(0); } finally { BUSH.cx = o; BUSH.cy = oy; } });
  const PONDF = 12;
  const pondArt = f => bake('pond' + f, 128, 72, 64, 36, 32, 18, () => { const o = GATE.cx, oy = GATE.cy; GATE.cx = 32; GATE.cy = 18; try { slimePond(f * 0.14); } finally { GATE.cx = o; GATE.cy = oy; } });
  const holeArt = () => bake('hole', 144, 80, 72, 40, 36, 20, () => { const o = GATE.cx, oy = GATE.cy; GATE.cx = 36; GATE.cy = 20; try { ladderHole(36, 20, 0); } finally { GATE.cx = o; GATE.cy = oy; } });
  // v2.67 점액 반짝임: 2px 칸 십자 (k: 0~1 주기 안의 위치)
  function glint(wx, wy, ph) { const k = (time * 0.8 + ph) % 1; if (k >= 0.35) return; const n = k < 0.12 || k > 0.24 ? 1 : 2, x = even(wx), y = even(wy);
    ctx.fillStyle = '#c8e890'; for (let j = 1; j <= n; j++) { ctx.fillRect(x - j * 2, y, 2, 2); ctx.fillRect(x + j * 2, y, 2, 2); ctx.fillRect(x, y - j * 2, 2, 2); ctx.fillRect(x, y + j * 2, 2, 2); }
    ctx.fillStyle = '#f0ffd0'; ctx.fillRect(x, y, 2, 2); }
  // v2.70 문 기둥 점액: 모양 4가지 (머리를 덮고 흘러내림 · 앞면에 철퍽 · 아래에 뭉쳐 고임 · 비스듬히 튐)
  // 기둥마다 모양 · 좌우 반전 · 높이 · 크기가 달라 복사한 티가 나지 않게. 밝은 연두 · 윤기 · 반짝임 · 초록 빛
  const SMEARS = [
    { at: 'top', rows: ['..aaaaaa..', '.aabbbbaa.', 'aabobbbbba', 'abbbbbbbba', '.bbbbbobb.', '.bbbbbbbb.', '..bbbbbb..', '..bb.bbb..', '...b..bb..', '......b...'] },
    { at: 'mid', rows: ['....a.....', '.a.aaa.a..', '..abbba...', 'aabbobbaa.', '.abbbbbba.', '..abbbba..', '.a.abba.a.', '....bb....', '....b.....'] },
    { at: 'low', rows: ['...a......', '..ab......', '..bb..a...', '.abbaabb..', 'abbobbbbba', 'bbbbbbbbbb', '.bbbbbbbb.'] },
    { at: 'mid', rows: ['aa........', 'abba......', '.bbba.....', '..bobba...', '...bbbba..', '....bbbba.', '.....bbbb.', '......bb..', '.......b..'] },
  ];
  const SMALL = rows => rows.filter((r, y) => y % 3 !== 2 || y < 2).map(r => r.replace(/^(.)(.*)(.)$/, (m, a, b) => '.' + b + '.')); // 작은 판: 줄을 솎아 냄
  const GS = []; // 이번 프레임에 그린 문 기둥 점액 (잿빛 방에서 색을 되살려 다시 그림)
  function slimeColor() { for (const f of GS) f(); GS.length = 0; }
  function gatePost(R, d, k, q, again) {
    const s = R && R.slimeGate; if (!s || s.dir !== d) return;
    if (!again) { const m = ctx.getTransform(); GS.push(() => { ctx.save(); ctx.setTransform(m); gatePost(R, d, k, q, true); ctx.restore(); }); }
    const h = (a, b) => { const v = Math.sin((s.i * 7.3 + R.id * 3.1 + k * 11.7 + a) * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
    const pi = (Math.floor(h(1, 2) * 4) + k * (1 + Math.floor(h(3, 4) * 3))) % 4, P = SMEARS[pi], flip = (k === 1) !== (h(5, 6) < 0.5);
    const rows = h(7, 8) < 0.35 ? SMALL(P.rows) : P.rows, W = 10, H = rows.length, postH = q.c.height;
    const room = Math.max(0, postH - H * 2 - 10), off = P.at === 'top' ? Math.round(h(9, 1) * Math.min(4, room / 2)) * 2 : P.at === 'low' ? room - Math.round(h(9, 1) * 2) * 2 : 4 + Math.round(h(9, 1) * Math.max(0, room / 2 - 4)) * 2;
    const X = q.x + (flip ? 0 : 0), Y = q.y + 4 + Math.max(0, off) - (Math.max(0, off) & 1);
    const at = (x, y) => { const r = rows[y]; if (!r) return '.'; const c = r[flip ? W - 1 - x : x]; return c || '.'; }, cell = (x, y) => at(x, y) !== '.';
    ctx.fillStyle = '#0e1a06'; for (let y = -1; y <= H; y++) for (let x = -1; x <= W; x++) if (!cell(x, y) && (cell(x + 1, y) || cell(x - 1, y) || cell(x, y + 1) || cell(x, y - 1))) ctx.fillRect(X + x * 2, Y + y * 2, 2, 2);
    const pul = 0.5 + 0.5 * Math.sin(time * 2.2 + k * 1.7 + s.i), gl = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = at(x, y); if (c === '.') continue; if (c === 'o') gl.push([x, y]);
      ctx.fillStyle = c === 'o' ? '#f4ffd8' : c === 'a' ? SL[1] : (x * 3 + y * 5 + pi) % 7 === 0 ? SL[3] : y > H - 3 ? SL[3] : SL[2]; ctx.fillRect(X + x * 2, Y + y * 2, 2, 2); }
    for (const [x, y] of gl) { ctx.fillStyle = `rgba(200,255,120,${0.25 + 0.35 * pul})`; ctx.fillRect(X + (x + (flip ? 1 : -1)) * 2, Y + (y - 1) * 2, 4, 2); glint(X + x * 2, Y + y * 2, s.i * 0.37 + k * 0.5); }
    const tail = [...Array(H).keys()].reverse().find(y => [...Array(W).keys()].some(x => cell(x, y))); // 맨 아래 방울도 가끔 반짝
    if (tail != null) { const x = [...Array(W).keys()].find(x => cell(x, tail)); glint(X + x * 2, Y + tail * 2, s.i * 0.37 + k * 0.5 + 0.5); }
    (s.lp || (s.lp = []))[k] = { x: X + W, y: Y + H };
  }
  function ground() {
    GS.length = 0;
    TRUTH2.ground();
    const R = curR(); if (!R) return;
    if (R.scorch) for (const s of R.scorch) put(scorchArt(s), s.x, s.y);
    // v2.67 문 앞 바닥 점액 → 문 기둥 점액 (gatePost)
    if (R.pond) { const p = R.pond;
      if (p.state === 'pond') put(pondArt(Math.floor(time / 0.14) % PONDF), p.x, p.y);
      else put(holeArt(), p.x, p.y);
      if (p.state === 'burst' && p.t < 1.1) at(p.x, p.y, 36, 20, () => { const o = GATE.cx, oy = GATE.cy; GATE.cx = 36; GATE.cy = 20; try { pondBurstFx(p.t); } finally { GATE.cx = o; GATE.cy = oy; } });
      if (p.state === 'pond' && p.rise > 0) at(p.x, p.y, 32, 18, () => { for (let i = 0; i < 6; i++) { const q = i / 6 * Math.PI * 2; px(Math.round(32 + Math.cos(q) * (3 + p.rise * 8)), Math.round(18 + Math.sin(q) * 2), '#a8d870'); } });
    }
    if (R.type === 'lab') labGround();
  }
  function pondBurstFx(t) { // 시안 pondBurst에서 구멍은 빼고 튀는 점액만 (한 번)
    const { cx, cy } = GATE, k = Math.min(1, t / 1.1);
    for (let i = 0; i < 46; i++) { const a = hh(i, 1) * Math.PI * 2, sp = 0.5 + hh(i, 2), r = 6 + k * 46 * sp, up = Math.sin(Math.min(1, k * 1.4) * Math.PI) * (10 + hh(i, 3) * 14);
      const x = Math.round(cx + Math.cos(a) * r * 1.6), y = Math.round(cy + Math.sin(a) * r * 0.6 - up), s = hh(i, 4) < 0.3 ? 2 : 1;
      for (let u = 0; u < s; u++) for (let v = 0; v < s; v++) px(x + u, y + v, k < 0.5 ? SL[1] : SL[3]); if (s === 2) px(x, y, SL[0]); }
    glow(cx, cy - 4, 40 * (1 - k * 0.5), '190,255,90', 0.55 * (1 - k), 18);
  }
  // 깊이 정렬되는 것: 점액 묻은 나무 · 키륵
  function ents(list) {
    TRUTH2.ents(list); bardEnts(list);
    const R = curR(); if (!R) return;
    if (R.slimeTree) { const t = R.slimeTree; list.push({ y: t.y, d: () => { const b = treeArt(); ctx.save(); if (t.dir === 'w') { ctx.translate(even(t.x) * 2, 0); ctx.scale(-1, 1); } put(b, t.x, t.y - 16); ctx.restore();
      const e2 = even(t.x); [[-6, -32, 0], [-4, -26, 0.45], [-6, -20, 0.7], [6, -42, 0.25]].forEach(([dx, dy, ph]) => { const wx = t.x + dx; glint(t.dir === 'w' ? 2 * e2 - wx - 2 : wx, t.y + dy, ph + t.x * 0.01); }); } }); } // v2.67 나무 점액도 반짝임
    if (R.type === 'lab') labEnts(list);
  }

  // ---------------------------------------------------------------- 숨은 방 (점액 웅덩이)
  const POND_T = { calm: 2.4, rise: 0.6, stay: 3.4, melt: 0.8 };
  function tickPond(R, dt) {
    const p = R.pond; p.t += dt;
    if (p.state === 'burst') { if (p.t > 1.2) p.state = 'hole'; return; }
    if (p.state !== 'pond') return;
    const s = p.slime;
    if (s && s.dead && !s.melted) { // 녹기 전에 웅덩이 근처에서 쓰러뜨림 → 한 번에 터짐
      p.slime = null;
      if (Math.hypot(s.x - p.x, s.y - p.y) < 90) { p.state = 'burst'; p.t = 0; sfx('boss'); flashT = 0.12; flashColor = '#c8f090'; lootFeed('점액 웅덩이가 터져 흩어졌다', GR, 3000); for (const o of R.obs) if (o.pond) o.r = Math.max(10, o.r - 4); return; }
      p.cyc = 0; return;
    }
    p.cyc += dt; p.rise = 0;
    if (!p.slime) {
      if (p.cyc > POND_T.calm && p.cyc < POND_T.calm + POND_T.rise) p.rise = (p.cyc - POND_T.calm) / POND_T.rise;
      if (p.cyc >= POND_T.calm + POND_T.rise) { const e = makeEnemy('slime', p.x, p.y - 4); e.pondSlime = true; G.enemies.push(e); p.slime = e; p.born = p.cyc; burst(p.x, p.y - 6, '#7ad050', 10); sfx('drop'); }
    } else if (p.cyc - p.born > POND_T.stay) { // 머물다 녹아 웅덩이로 사라짐
      const e = p.slime; e.melted = true; e.dead = true; G.enemies = G.enemies.filter(x => x !== e); p.slime = null; p.cyc = 0;
      for (let i = 0; i < 10; i++) G.parts.push({ x: e.x + rand(-8, 8), y: e.y - rand(0, 8), vx: rand(-20, 20), vy: rand(-30, 0), t: rand(0.3, 0.6), c: pick(['#7ad050', '#4e9a30']), g: 120 });
    }
  }

  // ---------------------------------------------------------------- 구덩이 실험실 (시작 장소처럼 그린 장면을 바닥에)
  const LAB_ROOM = [121, 72, 263, 152];
  function ensureLabShape() { if (!SHAPES.lab) SHAPES.lab = { w: (LAB_ROOM[2] - LAB_ROOM[0]) * 2, h: (LAB_ROOM[3] - LAB_ROOM[1]) * 2, n: '구덩이 실험실' }; }
  const loff = () => ({ x: A.x0 - LAB_ROOM[0] * 2, y: A.y0 - LAB_ROOM[1] * 2 });
  const lw = (cx, cy) => { const o = loff(); return { x: o.x + cx * 2, y: o.y + cy * 2 }; };
  const KIRK_AT = [236, 125]; // 그루터기 위 (발)
  const KP = KIRK_AT; // 시안 motes · appearFx가 쓰는 이름
  const LAB_OBS = [[142, 113, 11], [154, 113, 9], [214, 89, 13], [226, 90, 10], [188, 112, 10], [236, 122, 8], [144, 82, 6], [168, 98, 5]];
  function makeLab() {
    ensureLabShape(); setArena(SHAPES.lab); labBuild();
    const R = { id: 0, gx: 0, gy: 0, type: 'lab', shape: 'lab', doors: { n: null, s: null, w: null, e: null }, visited: true, seen: true, cleared: true, loot: [], seed: 5151, obs: [], props: [], style: { path: 'none' }, deco: [], sprites: [] };
    for (const [x, y, r] of LAB_OBS) { const p = lw(x, y); R.obs.push({ t: 'prop', c: true, x: p.x, y: p.y, r: r * 2 }); }
    R.nav = buildNav(R.obs);
    return R;
  }
  function paintLab(gg) {
    const L = labBuild(), o = loff();
    gg.save(); gg.imageSmoothingEnabled = false; gg.fillStyle = OUTK; gg.fillRect(0, 0, W, H);
    gg.drawImage(L.base, o.x, o.y); gg.restore();
  }
  const inLab = (wx, wy) => { const o = loff(), cx = (wx - o.x) / 2, cy = (wy - o.y) / 2; return LAB.inFloor && LAB.inFloor(Math.floor(cx), Math.floor(cy)) && LAB.inFloor(Math.floor(cx), Math.floor(cy) - 3); };
  function labGround() {
    const o = loff(), t = time;
    at(o.x, o.y, 0, 0, () => {
      const [tx, ty] = LAB.table; px(tx + 28, ty - 4 - (Math.floor(t * 6) % 2), '#ffd34d'); cauldronBubbles(t); if (window.LAB2 !== false) cauldronFire(t); else px(LAB.cauldron[0] + (Math.floor(t * 8) % 3) - 1, LAB.cauldron[1] + 1, '#ffb040');
      for (const [x, y, h] of CANDLES) { const fl = (Math.floor(t * 7 + x) % 3); px(x, y - h - 2, '#ff9a30'); px(x + (fl === 2 ? 1 : 0), y - h - 3, '#ffd34d'); if (fl) px(x, y - h - 4, '#fff2a8'); }
      const q = Q();
      if (!q.met && !(SEQ && SEQ.k === 'appear')) motes(t);
      if (SEQ && SEQ.k === 'appear') appearRing(SEQ.t);
      ceilingDrips(t);
    });
  }
  function kirkPos() { return lw(KIRK_AT[0], KIRK_AT[1]); }
  function labEnts(list) {
    const q = Q(), p = kirkPos(), P = G.player;
    const show = q.met || (SEQ && SEQ.k === 'appear' && SEQ.t > 1.15);
    if (!show) return;
    list.push({ y: p.y, d: () => {
      const o = loff(), aim = SEQ && SEQ.k === 'appear', book = !!(q.book || (DLG && DLG.book));
      at(o.x, o.y, 0, 0, () => kirk2(KIRK_AT[0], KIRK_AT[1], time, { right: P.x > p.x, aim, puff: aim && SEQ.t > 2.2, book }));
      if (SEQ && SEQ.k === 'appear') at(o.x, o.y, 0, 0, () => { const T = SEQ.t, sv = KP_; KP_[0] = KIRK_AT[0]; KP_[1] = KIRK_AT[1]; appearFxT(T); });
    } });
  }
  const KP_ = [0, 0];
  function appearFxT(T) { // 시안 appearFx (KP 대신 키륵 자리)
    const [cx, cy] = KP_;
    if (T < 1.05) { const n = 14; for (let i = 0; i < n; i++) { const k = (T / 1.05 + i / n) % 1, q = i / n * Math.PI * 2 + T * 5, r = 12 * (1 - k * 0.7); px(Math.round(cx + Math.cos(q) * r), Math.round(cy - 2 - k * 16 + Math.sin(q) * r * 0.35), k > 0.7 ? '#e8ffc0' : '#8ad050'); } glow(cx, cy - 6, 14, '150,240,90', 0.3 * T, 10); }
    else if (T < 1.25) { const k = (T - 1.05) / 0.2; glow(cx, cy - 7, 30, '220,255,170', 0.7 * (1 - k), 20); for (let i = 0; i < 16; i++) { const q = i / 16 * Math.PI * 2; px(Math.round(cx + Math.cos(q) * (6 + k * 14)), Math.round(cy - 7 + Math.sin(q) * (4 + k * 8)), '#f0ffd8'); } }
    if (T > 1.05 && T < 2.6) { const k = (T - 1.05) / 1.55;
      for (let i = 0; i < 9; i++) { const q = hh(i, 1) * Math.PI * 2, d = 4 + k * (8 + hh(i, 2) * 8), r = Math.round(3 + hh(i, 3) * 3 + k * 2), x0 = Math.round(cx + Math.cos(q) * d * 1.4), y0 = Math.round(cy - 7 + Math.sin(q) * d * 0.7 - k * 6);
        for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { if (x * x + y * y > r * r) continue; if (dth2(x0 + x, y0 + y) > 0.95 - k * 0.9) continue; px(x0 + x, y0 + y, y < -r * 0.3 ? '#b8bcb0' : y < r * 0.4 ? '#8a9086' : '#5e6660'); } } }
  }
  function labLights(list) {
    TRUTH2.lights(list);
    const R = curR(); if (!R) return;
    if (R.type === 'lab') for (const l of LAB_LIGHTS.slice(1)) { const p = lw(l.x, l.y); list.push({ x: p.x, y: p.y, r: l.r * 2, a: Math.min(1, l.a * 1.5), c: l.c ? l.c.join(',') : undefined, ca: l.c ? 0.12 : 0 }); }
    if (R.slimeGate && R.slimeGate.lp) for (const l of R.slimeGate.lp) if (l) list.push({ x: l.x, y: l.y, r: 46, a: 0.45, c: '150,230,80', ca: 0.16 }); // v2.69 문 기둥 점액 빛
    if (R.pond && R.pond.state === 'pond') list.push({ x: R.pond.x, y: R.pond.y, r: 70, a: 0.4, c: '120,200,70', ca: 0.1 });
    if (R.pond && R.pond.state !== 'pond') list.push({ x: R.pond.x, y: R.pond.y, r: 40, a: 0.3, c: '255,180,100', ca: 0.08 });
  }
  // 실험실 드나들기: 숨은 방의 던전 상태를 그대로 두고 따로 들어감
  function enterLab() {
    const D0 = G.dun, Hr = D0.cur; Hr.loot = G.loot.filter(l => l.life > 0);
    G.labRet = { dun: D0, room: Hr, px: G.player.x, py: G.player.y }; // v3.80 들어올 때 자리 (웅덩이가 없는 방에서 테스트로 들어온 경우 돌아갈 자리)
    G.trans = { t: 0, dur: 0.35, phase: 'out', go: () => {
      const L = makeLab();
      G.dun = { rooms: [L], start: L, cur: null, eliteDone: 2, keys: 0, sock: [true, true], bossOpen: true, gate: null, stage: G.stage, home: true, lab: true, bx0: 0, bx1: 0, by0: 0, by1: 0 };
      enterRoom(L, null);
      const p = lw(152, 100); Object.assign(G.player, { x: p.x, y: p.y, face: 1 });
      if (!Q().seenLab) { Q().seenLab = true; banner('구덩이 실험실', '흙냄새와 시큼한 냄새가 뒤섞여 있다'); }
    } };
    sfx('dodge');
  }
  function leaveLab() {
    const r = G.labRet; if (!r) return;
    G.trans = { t: 0, dur: 0.35, phase: 'out', go: () => {
      G.dun = r.dun; G.labRet = null; enterRoom(r.room, null);
      const p = r.room.pond; /* v3.80 Shift+7 등 테스트로 웅덩이 없는 방에서 들어왔으면 들어온 자리로 — 웅덩이를 찾다 오류가 나 화면이 검게 멈추던 문제 */ Object.assign(G.player, p ? { x: p.x, y: p.y + 40, face: 1 } : { x: r.px != null ? r.px : CX, y: r.py != null ? r.py : CY, face: 1 }); solveObs(G.player, G.player.r);
    } };
    sfx('dodge');
  }
  function throughTree(R) { // 나무 뒤 틈: 나무 방 ↔ 숨은 방
    const D = G.dun, to = R.type === 'hidden' ? D.rooms[R.hfrom] : D.rooms.find(x => x.type === 'hidden' && x.hfrom === R.id);
    if (!to) return;
    if (R.type !== 'hidden' && !Q().crack) { Q().crack = true; banner('나무 뒤 좁은 통로', '사람 한 명이 간신히 지나갈 만한 틈이 있다.'); }
    G.trans = { t: 0, dur: 0.45, phase: 'out', go: () => {
      enterRoom(to, null);
      const t = to.slimeTree, ox = t.dir === 'e' ? -34 : t.dir === 'w' ? 34 : 0, oy = t.dir === 'n' ? 34 : 22;
      Object.assign(G.player, { x: t.x + ox, y: t.y + oy, face: ox < 0 ? -1 : 1 }); solveObs(G.player, G.player.r);
    } };
    sfx('dodge');
  }

  // ---------------------------------------------------------------- 대화 · 연출 (진행 중엔 조작 없음)
  let DLG = null, SEQ = null;
  function freeze() { const P = G && G.player; if (!P) return; P.moving = false; P.vx = 0; P.vy = 0; if (P.state === 'walk' || P.state === 'run') P.state = 'idle'; P.t = 0; for (const k of ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']) { keys[k] = false; pressed[k] = false; } }
  function talk(lines, done, opt = {}) { DLG = Object.assign({ lines, i: 0, t: 0, done }, opt); G.prompt = null; pressed['f'] = false; freeze(); sfx('blip', 0.9); }
  function box(lines, done, opt = {}) { talk(lines, done, Object.assign({ box: true }, opt)); } // v2.61 통상 텍스트 박스: [제목, 본문]
  const busy = () => { if (DLG || SEQ) { if (G) G.prompt = null; return true; } return false; };
  function update(rdt) {
    if (SEQ) { SEQ.t += rdt; if (SEQ.step) SEQ.step(SEQ.t); if (SEQ.t >= SEQ.dur) { const s = SEQ; SEQ = null; if (s.end) s.end(); } return; }
    if (DLG) { DLG.t += rdt; if ((take('f') || take(' ') || take('enter')) && DLG.t > 0.15) { DLG.i++; DLG.t = 0; if (DLG.i >= DLG.lines.length) { const d = DLG; DLG = null; if (d.done) d.done(); } else sfx('blip', 0.9); } }
  }
  function speakerPos(who) { if ((who === 'habi' || who === 'dangun') && typeof HOME !== 'undefined') { const q = HOME.spk(who); if (q) return q; } /* v3.16 하비 · 단군 */ if (who === 'cocoa' && typeof ARCH !== 'undefined') { const q = ARCH.spk(); if (q) return q; } /* v3.00 코코아 */ if ((who === 'kuo' || who === 'cookie') && typeof BISTRO !== 'undefined') { const q = BISTRO.spk(who); if (q) return q; } /* v3.10 쿠오 · 쿠키 */ if (typeof TRUTH3 !== 'undefined') { const q = TRUTH3.spk(who); if (q) return q; } /* v2.84 3장 진실 화자 */ if (who === 'owl') { const b = bard(curR()); if (b) return { x: b.x, y: b.y - 32 }; } if (who === 'kirk') { const p = kirkPos(); return { x: p.x, y: p.y - 32 }; } const P = G.player; return { x: P.x, y: P.y - 38 }; }

  // ---------------------------------------------------------------- v2.72 떠돌이 음유시인 「후고」 (출장 대장간)
  // 1~2 대장간: 이번 판에서 진실 1을 깬 뒤 · 2~3 대장간: 이번 판에서 진실 1 · 2를 모두 깬 뒤 (전기 있는 캐릭터만, v2.83). 소문은 진실 기록이 아니며 저장에 남지 않음
  const OWL = ["........k.......k........", ".......kbk.....kbk....kk.", ".......kBbkkkkkbBk...kGPk", "......kbBBBBBBBBBBk..kGPk", "..kkkkkbWWWBBBWWWBk..kNk.", ".kwwwwkwWYEWBWYEWWk.kNk..", "kLLLLLkwWYYWnWYYWWk.kNk..", ".kkkkkkbwWWnNWWWWBkkksk..", ".kTTTTkkRRRRRRRRkkHOsOkk.", ".kTTnTkrrcCCCCCkHOODsOok.", ".kTTTTkkcCCCCCCkOOODDOok.", ".kttttkBkcCCCCCkOOOPPOok.", ".kkkkkkkkcCCkCCkkoOOOook.", ".........kFFk.kFFkkkkkk..", ".........kkkk.kkkk......."]; // v2.76 류트: 둥근 통 · 울림구멍 · 줄받침 · 줄 · 목 · 뒤로 꺾인 줄감개
  const OWL_P = { k: '#0b0a0e', B: '#8a5a36', b: '#5e3a22', L: '#b8875a', W: '#ecdcc0', w: '#c9b18e', Y: '#f0c040', E: '#1a1010', n: '#e0a040', N: '#9a6020', C: '#3e5c5a', c: '#2a4040', R: '#a8382a', r: '#6e2018', O: '#c88a42', o: '#7a4a22', s: '#efe2c4', F: '#2a1a14', T: '#a87a4e', t: '#6e4628', H: '#e6b464', D: '#2a1608', G: '#5a3418', P: '#d8c8a0' };
  const RUMOR = {
    A: { lines: ['또 뵙네요.', '초원을 무사히 건너오셨군요.', '다음은 성채로 가시나요?', '그 성채에 도는 소문이 하나 있어요.', '어느 방 벽에 이상한 그림이 그려져 있다고 합니다.', '무엇을 뜻하는지 아는 사람은 없답니다.'], name: '성채 벽의 그림', again: '벽의 그림이 무엇을 뜻하는지… 궁금하지 않으세요?' },
    C: { lines: ['초원으로 가시는 길이군요.', '요즘 이 초원에 도는 소문이 하나 있어요.', '언제부턴가 숲 어딘가에서 시큼한 점액 냄새가 난다고 합니다.', '냄새가 어디서 오는지 아는 사람은 없답니다.'], name: '시큼한 점액 냄새', again: '시큼한 냄새가… 어디서 오는 걸까요?' }, // v2.73 1장 시작 방
    B: { lines: ['다시 만났네요.', '성채를 무사히 빠져나오셨군요.', '이번엔 핏빛 엄니 부락에 도는 소문입니다.', '오크들에겐 선조에게서 전해 오는 곳이 있다고 해요.', '결투로 원하는 것을 쟁취하는 곳이라나요.', '입구는 피로 그린 원이라는데… 본 사람은 없답니다.'], name: '결투의 장소', again: '원하는 바가 있다면 결투로 얻어 가라… 오크들 말이에요.' },
    D: { lines: ['여기서도 뵙네요.', '부락을 무사히 지나오셨군요.', '이번엔 왕도로 가는 길목의 제단 이야기예요.', '요즘 제단 쪽에서 휘파람 같은 바람 소리가 들린다고 합니다.', '바람이 어디서 들어오는지 아는 사람은 없답니다.'], name: '제단의 바람 소리', again: '제단에서 바람 소리라니… 이상하지 않나요?' }, // v3.20 3→4 대장간: 진실 1 · 2 · 3을 이번 판에 모두 봤을 때
  };
  function bard(R) { // 이 대장간에 음유시인이 있으면 자리 (처음 부를 때 충돌 칸을 둠)
    if (!R || !G.dun) return null;
    const fk = R.type === 'forge' ? (R.fk === 'C' ? 'D' : R.fk) : G.stage === 1 && R === G.dun.start && !G.dun.forge && !G.dun.home ? 'C' : null; // v2.75 1장 시작 방: 2회차(그 캐릭터의 전기)부터 매 판
    // v2.83 대장간: 전기 있는 캐릭터가 이번 판에서 그 장까지의 진엔딩 요소를 깼을 때만 (1→2 대장간: 1장 · 2→3 대장간: 1·2장). 3→4 대장간엔 없음
    const run = G.truthRun || {};
    if (R.type === 'forge' && !(loop2() && (fk === 'A' ? run.t1 : fk === 'B' ? run.t1 && run.t2 : fk === 'D' ? run.t1 && run.t2 && run.t3 : false))) return null;
    if (R.type !== 'forge' && !(fk === 'C' && loop2())) return null;
    if (!R.bard) { let p = { x: even(CX - 126), y: even(CY + 40) };
      if (fk === 'C') { const doors = Object.keys(R.doors).filter(d => R.doors[d] != null).map(d => doorIn(d, 30));
        for (const [dx, dy] of [[-130, 46], [130, 46], [-130, -46], [130, -46], [-90, 80], [90, 80], [-180, 0], [180, 0]]) { const x = even(CX + dx), y = even(CY + dy);
          if (obsHitL(R.obs, x, y, 28) || doors.some(q => Math.hypot(q.x - x, q.y - y) < 100)) continue; p = { x, y }; break; } }
      R.bard = { x: p.x, y: p.y, fk }; R.obs.push({ t: 'prop', c: true, x: R.bard.x, y: R.bard.y - 4, r: 9 }); R.nav = buildNav(R.obs); }
    return R.bard;
  }
  function owlDraw(t, talking) { // 칸 좌표: 발 가운데 (12, 14)
    for (let y = -2; y <= 2; y++) for (let x = -7; x <= 7; x++) { const d = (x / 7) ** 2 + (y / 2) ** 2; if (d <= 1 && dth2(12 + x, 14 + y) < (1 - d) * 1.0) px(12 + x, 14 + y, 'rgba(4,3,6,.7)'); }
    const bob = Math.floor(t * 2) % 2 ? 1 : 0, strum = !talking && Math.floor(t * 4) % 2 === 0;
    for (let j = 0; j < OWL.length; j++) for (let i = 0; i < 25; i++) { let c = OWL[j][i]; if (c === '.') continue; if (strum && j === 11 && c === 'B') c = 'L'; px(i, j + (j < 8 ? bob : 0), OWL_P[c]); }
    if (!talking) for (let i = 0; i < 3; i++) { const k = (t * 0.45 + i / 3) % 1, x = Math.round(25 + i * 3 + Math.sin(k * 6 + i) * 2), y = Math.round(4 - k * 16); // 음표 (줄감개 오른쪽 위로)
      for (let j = 0; j < 5; j++) for (let q = 0; q < 4; q++) if ('..##..#...#.###.##..'[j * 4 + q] === '#' && dth2(x + q, y + j) < 1.15 - k) px(x + q, y + j, k < 0.5 ? '#ffe7a8' : '#d8a860'); }
  }
  const bardTalking = () => !!(DLG && DLG.lines.some(l => l[0] === 'owl'));
  function bardEnts(list) { const R = curR(), b = bard(R); if (!b) return; list.push({ y: b.y, d: () => at(b.x, b.y, 12, 14, () => owlDraw(time, bardTalking())) }); }
  function bardTop() { // 가까이 오면 먼저 말을 검 (대장장이처럼)
    const R = curR(), b = bard(R), P = G.player; if (!b || !P || DLG || SEQ) return;
    if (!(G.bardHeard || {})[b.fk] && Math.hypot(P.x - b.x, P.y - b.y) < 70) drawBubble('소문 하나 들어 보시겠어요?', b.x, b.y - 32, 0);
  }
  function bardInteract() { const R = curR(), b = bard(R), P = G.player; if (!b || !P || Math.hypot(P.x - b.x, P.y - b.y) > 40) return null;
    return { k: 'truth', a: 'bard', x: b.x, y: b.y + 20, t: (G.bardHeard || {})[b.fk] ? 'F 말 걸기' : 'F 소문 듣기' }; }
  function bardAct() { const b = bard(curR()); if (!b) return; const r = RUMOR[b.fk], H = G.bardHeard || (G.bardHeard = {});
    if (H[b.fk]) { talk([['owl', r.again]]); return; }
    talk(r.lines.map(l => ['owl', l]), () => { H[b.fk] = true; lootFeed('소문 — ' + r.name, '#d8a860', 4200); }); }

  // ---------------------------------------------------------------- 키륵 의뢰
  const KIRK_ASK = ['키륵… 마법, 없어. 아무것도 없어.', '초록 왕… 배 속. 키륵 책.', '가져와. 키륵 전부야.', '가져오면… 좋은 거 알려 줘. 왕관 이야기.'];
  // v3.20 키륵에게서 처음 「해」를 들었을 때 주인공의 반응 (주인공은 해를 모름)
  const KIRK_SUN = { knight: '…{해}. 들어 본 적 없는 말이다.|{해}가 무엇인가?', ranger: '…{해}? 수상한 이야기군.|그게 뭐야?', mage: '{해}…? 무엇의 이름일까요?|어떤 책에서도 본 적 없는 단어인데….', priest: '{해}… 경전 어디에도 없는 말이에요.|알려주세요!', gunner: '{해}?|뭔데 그게' }; // v3.75 문구 수정 (모두 두 말주머니)
  const KIRK_READ = ['…키륵 글씨. 그런데… 키륵 생각, 아냐.', '왕관이… 시킨 거야. 지켜라, 지켜라.', '{해}, 안 떠. 왕관이 붙잡고 있어.', '제단… 가지 마, 사람.'];
  const JOURNAL = ['셋째 배양체 관찰. 동화 속도가 공급량을 상회하여 기아에 이르는 시간이 현저히 단축됨. 유기물과 무기물을 가리지 않는 무차별 포식성 확인.',
    '조각 주변의 채도가 점진적으로 감쇠함. 흡수라기보다 전송의 양상. 소실된 색의 수신처는 미상.',
    '본인은 조각의 보존을 최우선 과제로 상정하고 있음. 그 근거를 기술하고자 하였으나 전제가 성립하지 않음.',
    '제단으로의 이송이 필연이라는 확신이 존재함. 확신의 출처 불명. 재검토 필요.',
    '재검토 결과. 보존해야 함. 이송해야 함. 확신 출처 불명. 재검토 필요.'];
  const JOURNAL_MORE = [Array.from({ length: 5 }, () => '재검토 결과. 보존해야 함. 이송해야 함. 확신 출처 불명. 재검토 필요.')]; // v3.78 다음 장(2장) 한 장에 같은 문구가 되풀이되어 채워짐
  function kirkAppear() {
    freeze();
    SEQ = { k: 'appear', t: 0, dur: 2.7, end: () => { Q().met = true; talk([['kirk', '너… 사람. 무기 든 사람.']], null, { auto: 2.4 }); } };
    sfx('awaken');
  }
  function acceptQuest() { const q = Q(); q.q = 1; lootFeed('의뢰 — 점액왕이 삼킨 연구 일지', GR, 3200); sfx('select'); }
  function giveJournal() {
    const q = Q(); q.book = true;
    const L = KIRK_READ.map(t => ['kirk', t]), si = L.findIndex(l => l[1].includes('{해}')); if (si >= 0) L.splice(si + 1, 0, ...((s) => s.includes('|') ? s.split('|') : s.split(/(?<=[.!?])\s+/))(KIRK_SUN[G.cls] || KIRK_SUN.knight).map(t => ['me', t.trim()]), ['kirk', '{해}는 {해}다. 키륵.']); // 키륵의 대답 // v3.20 「해」에 주인공이 반응
    talk(L, () => {
      showTruthParchment({ no: '구덩이 실험실', title: '키륵의 연구 일지', paras: JOURNAL, pages: JOURNAL_MORE, ac: GR, onClose: () => {
        q.q = 3; q.book = false; const first = !TS().t1; TS().t1 = true; (G.truthRun || (G.truthRun = {})).t1 = true; persist(); // v2.83 이번 판에서 깸
        lootFeed('진실 기록 — 마법사의 일지', GR, 3600); if (first) sfx('legend');
      } });
    }, { book: true, auto: 3.6 });
  }

  // ---------------------------------------------------------------- 점액왕 몸속의 일지
  const journalOn = () => G.stage === 1 && Q().q === 1;
  function belly(e) { // 14_rig: 점액왕을 그린 다음
    if (!journalOn() || e.dead) return;
    const gro = e.grogiT > 0, bx = e.x, by = e.y - 20 - (e.z || 0);
    at(bx, by, BOSS.cx, BOSS.cy, () => { bellyItems(time, gro ? 1 : 0.3); if (gro) grogiRing(time); });
  }
  function bossTop() { // 그로기 때 멀리서도 보이는 「F 일지 꺼내기」
    const R = curR(); if (!R || R.type !== 'boss' || !journalOn() || SEQ) return;
    const e = G.enemies.find(x => x.kind === 'slimeking' && !x.dead); if (!e || !(e.grogiT > 0)) return;
    const P = G.player, near = Math.hypot(P.x - e.x, P.y - e.y) < 80; if (near) return; // 가까우면 평소 안내
    at(e.x, e.y - 20 - (e.z || 0), BOSS.cx, BOSS.cy, () => farPrompt('F 일지 꺼내기', BOSS.cx, BOSS.cy - 30, time, false));
  }
  function pullJournal(e) {
    freeze();
    const P = G.player, sx = P.x, sy = P.y, ex = e.x, ey = e.y - 6;
    SEQ = { k: 'pull', t: 0, dur: 1.0, step: t => {
      if (t < 0.18) { const f = t / 0.18; P.x = sx + (ex - sx) * f; P.y = sy + (ey - sy) * f; P.lift = Math.sin(f * Math.PI) * 26; G.pHide = false; }
      else if (t < 0.8) { G.pHide = true; P.lift = 0; P.x = ex; P.y = ey; }
    }, end: () => {
      G.pHide = false; P.x = ex + 6; P.y = Math.min(A.y1 - 20, e.y + 54); P.lift = 0; solveObs(P, P.r); P.inv = Math.max(P.inv || 0, 1.2);
      for (let i = 0; i < 34; i++) { const a = rand(0, TAU), sp = rand(60, 180); G.parts.push({ x: ex + rand(-6, 6), y: ey - rand(4, 20), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - rand(40, 110), t: rand(0.4, 0.9), c: pick(['#c8f090', '#7ad050', '#e0ffb0']), g: 360 }); }
      flashT = 0.1; flashColor = '#c8f090'; sfx('crunch'); sfx('select');
      Q().q = 2; Q().hold = time + 1.6; lootFeed('연구 일지를 꺼냈다', GR, 3200);
    } };
    sfx('dodge');
  }

  // ---------------------------------------------------------------- 상호작용
  function interact() {
    const R = curR(), P = G.player; if (!R || !P || busy()) return null;
    { const t2 = TRUTH2.interact(); if (t2) return t2; }
    { const bi = bardInteract(); if (bi) return bi; }
    const near = (o, d) => Math.hypot(P.x - o.x, P.y - o.y) < d;
    if (R.slimeTree && near({ x: R.slimeTree.x, y: R.slimeTree.y + 8 }, 46)) return { k: 'truth', a: 'tree', x: R.slimeTree.x, y: R.slimeTree.y - 74, t: 'F 조사하기' };
    if (R.pond) { const p = R.pond;
      if (p.state === 'pond' && near(p, 76)) return { k: 'truth', a: 'pond', x: p.x, y: p.y - 34, t: 'F 살펴보기' };
      if (p.state === 'hole' && near(p, 60)) return { k: 'truth', a: 'down', x: p.x, y: p.y - 32, t: 'F 내려가기' }; }
    if (R.type === 'lab') { const q = Q(), k = kirkPos(), lad = lw(146, 96);
      if (near(lad, 34)) return { k: 'truth', a: 'up', x: lad.x, y: lad.y - 44, t: 'F 올라가기' };
      if (q.met && near(k, 52)) { if (q.q === 0) return { k: 'truth', a: 'ask', x: k.x, y: k.y - 50, t: 'F 이야기 듣기' }; if (q.q === 2) return { k: 'truth', a: 'give', x: k.x, y: k.y - 50, t: 'F 일지 건네기' }; } }
    if (R.type === 'boss' && journalOn()) { const e = G.enemies.find(x => x.kind === 'slimeking' && !x.dead); if (e && e.grogiT > 0 && near(e, 80)) return { k: 'truth', a: 'pull', o: e, x: e.x, y: e.y - 80, t: 'F 일지 꺼내기' }; }
    return null;
  }
  function act(it) {
    if (it.a && it.a.startsWith('c2')) { TRUTH2.act(it); return; }
    const R = curR();
    if (it.a === 'bard') { bardAct(); return; }
    if (it.a === 'tree') throughTree(R);
    else if (it.a === 'pond') { lootFeed('바닥이 보이지 않는 점액 웅덩이다. 시큼한 냄새가 난다.', '#a8a094', 3000); sfx('blip'); }
    else if (it.a === 'down') enterLab();
    else if (it.a === 'up') leaveLab();
    else if (it.a === 'ask') talk(KIRK_ASK.map(t => ['kirk', t]), acceptQuest, { auto: 3 });
    else if (it.a === 'give') giveJournal();
    else if (it.a === 'pull') pullJournal(it.o);
  }

  // ---------------------------------------------------------------- 매 프레임
  function forceGrogi(e) {
    e.grogi = 0; e.grogiT = 5; cancelTele(e); e.state = 'grogi';
    banner('그로기!', '5초간 받는 피해 +50%'); sfx('grogi'); flashT = 0.08; flashColor = '#ffe39a';
    G.fx.push({ kind: 'ring', x: e.x, y: e.y - 14, r: 10, t: 0.5, max: 0.5, c: '#ffd34d' });
  }
  function tick(dt) {
    const R = curR(), P = G.player; if (!R || !P) return;
    TRUTH2.tick(dt);
    if (journalOn() && R.type === 'boss') { const e = G.enemies.find(x => x.kind === 'slimeking' && !x.dead); // v2.58 의뢰 중: 그로기 게이지 낮춤 + 체력 66% · 33%에서 반드시 그로기
      if (e) { if (!e.trJ) { e.trJ = { g: [0.66, 0.33] }; e.grogiMax = Math.min(e.grogiMax, 60); }
        if (!(e.grogiT > 0) && e.trJ.g.length && e.hp / e.maxHp <= e.trJ.g[0]) { e.trJ.g.shift(); forceGrogi(e); } } }
    if (R.pond) tickPond(R, dt);
    if (R.type === 'lab') {
      if (!inLab(P.x, P.y)) { if (G.labLast) { P.x = G.labLast.x; P.y = G.labLast.y; } } else G.labLast = { x: P.x, y: P.y };
      const q = Q(), k = kirkPos(); if (!q.met && !SEQ && Math.hypot(P.x - k.x, P.y - k.y) < 110) kirkAppear();
    }
    if (G.stage === 1 && Q().q === 1 && R.type === 'boss') { const e = G.enemies.find(x => x.kind === 'slimeking'); if (e && e.dead) { Q().q = -1; lootFeed('연구 일지가 점액왕과 함께 녹아 사라졌다', '#a8a094', 3600); } }
  }
  // 말풍선 · 머리 위 일지 · 키륵 혼잣말
  function top() {
    const R = curR(); if (!R) return;
    bossTop();
    bardTop();
    if (DLG && !DLG.box) { const [who, text] = DLG.lines[DLG.i], p = speakerPos(who); drawBubble(text, p.x, p.y, 0); }
    else if (R.type === 'lab' && Q().met && !SEQ) { const q = Q(), P = G.player, k = kirkPos(), near = Math.hypot(P.x - k.x, P.y - k.y) < 90;
      const lines = q.q === 1 ? ['초록 왕… 배 속. 키륵 책.', '가져와. 키륵 전부야.'] : q.q === 3 ? ['제단… 가지 마, 사람.', '{해}, 안 떠.'] : q.q === -1 ? ['초록 왕… 죽었어. 키륵 책… 없어.'] : null;
      const s = lines && npcTalk('kirk', near, lines); if (s) drawBubble(s.line, k.x, k.y - 32, 0); }
    const q = G.tq1; if (q && q.hold > time && G.player) { const P = G.player; at(P.x, P.y - 52, 3, 2, () => { for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 7; xx++) px(xx, yy, xx === 0 ? '#5a321c' : yy === 4 ? '#e8dcc0' : yy === 0 ? '#a8683e' : '#8a5232'); px(3, 2, '#e8c870'); px(4, 2, '#e8c870'); for (let xx = -1; xx <= 7; xx++) { px(xx, -1, OUTK); px(xx, 5, OUTK); } for (let yy = 0; yy < 5; yy++) { px(-1, yy, OUTK); px(7, yy, OUTK); } glow(3, 2, 12, '255,230,160', 0.3, 8); }); }
  }
  // 의뢰 패널 (미니맵 아래)
  let QEL = null, QTXT = '';
  // F 안내 · 텍스트 박스 (화면 층 — 빛 위)
  function keyHint(label, X, Y) { // v2.62 공통 키 캡 모양 (화면 좌표, X = 왼쪽 끝 · Y = 위)
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); drawKeyTag(ctx, X, Y + 10 + (Math.floor(time * 2.5) % 2), 'F', label, { left: true }); ctx.restore();
  }
  let BEL = null, BKEY = '';
  function boxHud() {
    const pk = !(DLG && DLG.box) && PEEK && mode === 'play' ? PEEK : null, on = !!((DLG && DLG.box || pk) && mode === 'play');
    document.body.classList.toggle('trDlg', on);
    if (!BEL) { if (!on) return; BEL = document.createElement('div'); BEL.className = 'hud pf glass'; BEL.id = 'trBox'; BEL.style.cssText = 'left:50%;transform:translateX(-50%);bottom:10px;width:300px;box-sizing:border-box;word-break:keep-all;padding:7px 10px 6px;display:none;'; /* v2.66 텍스트 박스 크기 고정 */ document.getElementById('ui').appendChild(BEL); }
    const key = !on ? '' : pk ? 'P|' + pk.title + pk.text + pk.foot : DLG.i + '|' + DLG.lines[DLG.i][1]; if (key === BKEY) return; BKEY = key; BEL.style.display = on ? 'block' : 'none'; if (!on) return;
    const D = pk ? { icon: pk.icon, icons: pk.icons } : DLG, [title, text] = pk ? [pk.title, pk.text] : DLG.lines[DLG.i], last = pk ? true : DLG.i >= DLG.lines.length - 1;
    const foot = pk ? pk.foot : `<span class="key">F</span> ${last ? '닫기' : '넘기기'}`;
    const ic = D.icons ? `<div style="width:26px;height:26px;display:grid;grid-template-columns:13px 13px;flex:none">${D.icons.map(u => `<img src="${u}" style="width:13px;height:13px;image-rendering:pixelated">`).join('')}</div>` : D.icon ? `<img src="${D.icon}" style="width:26px;height:26px;image-rendering:pixelated;flex:none">` : '<div style="width:26px;flex:none"></div>';
    BEL.innerHTML = `<div style="display:flex;align-items:center;gap:8px;height:44px">${ic}<div style="flex:1;min-width:0"><div style="font:8px Galmuri7;color:var(--quiet)">${title}</div><div style="font:9px/14px Galmuri9;color:var(--ink);margin-top:2px;height:28px;display:flex;align-items:center">${text}</div></div></div><div style="text-align:right;margin-top:4px;font:8px Galmuri7;color:var(--quiet);height:11px">${foot || ''}</div>`;
  }
  let PEEK = null; // v2.71 대화가 아닌 안내용 메시지 박스 (밀실 화로 앞 등) — 매 프레임 다시 정함
  const peek = o => { PEEK = o; };
  function hud() {
    PEEK = null; TRUTH2.hud(); boxHud();
    if (DLG && !DLG.box && mode === 'play') { const [who, text] = DLG.lines[DLG.i], p = speakerPos(who); ctx.save(); ctx.font = '10px Galmuri9'; const tw = Math.ceil(ctx.measureText(text).width), w = (tw + 14) & ~1; ctx.restore();
      const X = Math.round(p.x - CAMX), Y = Math.round(p.y - CAMY); bubbleKey(text, DLG.i < DLG.lines.length - 1 ? '넘기기' : '닫기', X + (w >> 1) - 6, Y - 14); }
    return; // v2.59 의뢰 패널은 띄우지 않음 (알림 한 줄만)
    const q = G && G.tq1, show = q && (q.q === 1 || q.q === 2) && mode === 'play' && G.stage === 1;
    if (!QEL) { if (!show) return; QEL = document.createElement('div'); QEL.className = 'hud pf glass'; QEL.id = 'trQuest'; QEL.style.cssText = 'right:8px;top:184px;width:150px;box-sizing:border-box;padding:5px 8px;'; document.getElementById('ui').appendChild(QEL); }
    const txt = !show ? '' : q.q === 1 ? '점액왕이 삼킨 연구 일지' : '키륵에게 돌아가기';
    if (txt !== QTXT) { QTXT = txt; QEL.style.display = show ? 'block' : 'none'; if (show) QEL.innerHTML = `<div style="font:8px Galmuri7;color:var(--quiet)">의뢰 · 키륵</div><div style="font:10px Galmuri9;color:${q.q === 2 ? 'var(--gold-l)' : 'var(--ink)'};margin-top:2px">${txt}</div>`; }
  }
  const hidePlayer = () => !!(G && G.pHide);

  return { abort: () => { DLG = null; SEQ = null; } /* v3.80 테스트 Shift+7: 대화 · 연출 강제 종료 */, dbgLab: enterLab, dbgJournal: giveJournal, dbgKirk: kirkAppear, talk, freeze, at, box, peek, loop2, prep1, prep2: r => TRUTH2.prep2(r), floor: (gg, R) => TRUTH2.floor(gg, R), sealHidden: (R, d) => TRUTH2.sealHidden(R, d), gatePost, slimeColor, ground, ents, lights: labLights, interact, act, tick, top, hud, busy, update, belly, paintLab, hidePlayer, makeLab, get Q() { return Q(); } };
  })();

// ================================================================ 2장 「기사단 서약의 밀실」 (v2.59) — 그림은 시안(_작업자료/시안/기사단밀실_시안.html)과 같은 코드
  const TRUTH2 = (() => {
  let g = null;
  function __mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }
  const even = v => Math.round(v / 2) * 2;
  const TS = () => SAVE.truth || (SAVE.truth = {});
// 기사단 서약의 예배당 — 진행별 시안 (게임 화면 캡처 위에 새 오브젝트를 2px 칸 도트로 그림)
const K = '#0b0a0e';
function __mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; }

// ---------------------------------------------------------------- 셀 그리기 도구
// 재질 격자 → 자동 외곽선 · 왼쪽 위 빛 음영 (돌 · 쇠 · 밀랍 등)
function Grid(w, h) { const a = Array.from({ length: h }, () => Array(w).fill(null)); return { w, h, a,
  set(x, y, m) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) a[y][x] = m; },
  rect(x0, y0, x1, y1, m) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, m); },
  disc(cx, cy, r, m, ry) { ry = ry || r; for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if (((x - cx) / r) ** 2 + ((y - cy) / ry) ** 2 <= 1.02) this.set(x, y, m); },
  line(x0, y0, x1, y1, m, t = 1) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let k = 0; k < t; k++) this.set(x + k, y, m); } },
  rows(x0, y0, rows, map) { rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (map[r[x]]) this.set(x0 + x, y0 + y, map[r[x]]); }); },
}; }
const MAT = {
  stone: ['#7e7888', '#5c5666', '#423d4c', '#2c2834'], // 밝음 · 중간 · 어둠 · 깊은 어둠
  pale: ['#958f9e', '#6e687a', '#504a5c', '#36313f'],
  dark: ['#5e5868', '#46404e', '#322d3a', '#221e28'],
  iron: ['#76707e', '#524c5c', '#38333f', '#221e28'],
  wax: ['#e8dcc0', '#c4b496', '#9a8a70', '#6e624e'],
  wood: ['#8a6440', '#6a4a2c', '#4a321e', '#2e1e12'],
  red: ['#ff9a80', '#e04030', '#a01828', '#600c14'],
  redLit: ['#ffd0c0', '#ff6a50', '#e03028', '#901018'],
  gold: ['#f0d890', '#c9a24a', '#8a6a28', '#5a4218'],
  hole: ['#0a080c', '#0a080c', '#0a080c', '#0a080c'],
  void: ['#16121a', '#100c14', '#0c090f', '#08060a'],
  book: ['#a03030', '#7a2024', '#5a161a', '#3a0c10'],
  page: ['#f0e4c4', '#d8c8a0', '#b8a47c', '#8a7654'],
};
// m: 재질 이름 또는 '재질:단계'(고정 단계), '#rrggbb'(평면색)
function paint(G, ox, oy, opt = {}) {
  const has = (x, y) => x >= 0 && y >= 0 && x < G.w && y < G.h && G.a[y][x] != null;
  const out = opt.out !== false;
  for (let y = -1; y <= G.h; y++) for (let x = -1; x <= G.w; x++) {
    const m = has(x, y) ? G.a[y][x] : null;
    if (!m) { if (out && (has(x + 1, y) || has(x - 1, y) || has(x, y + 1) || has(x, y - 1))) px(ox + x, oy + y, K); continue; }
    if (m[0] === '#') { px(ox + x, oy + y, m); continue; }
    const [nm, fixed] = m.split(':'), P = MAT[nm];
    let t = 1;
    if (fixed != null) t = +fixed;
    else { const same = (a, b) => has(a, b) && G.a[b][a].split(':')[0] === nm;
      if (!same(x, y - 1) || !same(x - 1, y)) t = 0; else if (!same(x, y + 1) || !same(x + 1, y)) t = 2; else if (!same(x + 1, y + 1)) t = 2; else t = 1;
      if (t === 1 && ((x + y * 3) % 7 === 0)) t = 2; }
    px(ox + x, oy + y, P[t]);
  }
}
function px(cx, cy, col) { g.fillStyle = col; g.fillRect(cx * 2, cy * 2, 2, 2); }
// 디더 광원 (칸 단위)
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function glow(cx, cy, r, rgb, a = 0.5, ry) {
  ry = ry || r * 0.75; g.save(); g.globalCompositeOperation = 'lighter';
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const d = Math.hypot((x - cx) / r, (y - cy) / ry); if (d >= 1) continue;
    const k = (1 - d) * a, b = BAY[((y & 3) << 2) | (x & 3)] / 16; if (k * 1.6 < b) continue;
    g.fillStyle = `rgba(${rgb},${Math.min(0.5, k * 0.55)})`; g.fillRect(x * 2, y * 2, 2, 2);
  }
  g.restore();
}

// ---------------------------------------------------------------- 문장 (9×9칸) — 사자 · 까마귀 · 장미 · 탑
const SIGIL = {
  lion: ['x.x.x.x.x', '.xxxxxxx.', 'xx.xxx.xx', 'xxxxxxxxx', 'xxx...xxx', '.xx.x.xx.', '.xxxxxxx.', 'x.xxxxx.x', '...x.x...'],
  crow: ['.........', '...xxx...', '..xx.xx..', '.xxxxxxxx', 'xxxxxx...', '.xxxxxx..', '..xxxxxx.', '...x..x..', '..xx.xx..'],
  rose: ['..xxxxx..', '.xx.x.xx.', 'xx.xxx.xx', 'xxx.x.xxx', '.xxx.xxx.', '..xxxxx..', '....x....', '..xxx.x..', '....xxx..'],
  tower: ['x.x.x.x.x', 'xxxxxxxxx', '.xxxxxxx.', '.xx.x.xx.', '.xxxxxxx.', '.xxx.xxx.', '.xxxxxxx.', '.xx...xx.', 'xxxxxxxxx'],
};
const SIG_NAME = { lion: '사자', crow: '까마귀', rose: '장미', tower: '탑' };
// 판마다 섞이는 문장 ↔ 구절 (이번 시안의 예)
const PHRASE = { rose: '왕관 앞에 무릎 꿇고', lion: '왕의 이름을 부르며', tower: '왕이 떠난 뒤에도', crow: '빈 왕좌를 지키리라' };
const ORDER = ['rose', 'lion', 'tower', 'crow'];
// 원판 메달 (13×13칸): lit = 붉게 타오름
function medal(cx, cy, sig, lit, size = 13) {
  const G = Grid(size, size), r = (size - 1) / 2;
  G.disc(r, r, r, 'dark:2'); G.disc(r, r, r - 1.5, lit ? 'dark:3' : 'stone');
  const S = SIGIL[sig], o = Math.floor((size - 9) / 2);
  S.forEach((row, y) => { for (let x = 0; x < 9; x++) if (row[x] === 'x') G.set(o + x, o + y, lit ? (y < 2 ? 'redLit:0' : y < 6 ? 'redLit:1' : 'redLit:2') : (x + y) % 5 ? 'dark:2' : 'dark:3'); });
  paint(G, cx - Math.floor(size / 2), cy - Math.floor(size / 2));
  if (lit) glow(cx, cy, 11, '255,70,50', 0.5);
}
// UI용 문장 아이콘 (데이터 URL)
var sigilURL = function (sig, lit) {
  const [c, x] = __mk(13, 13); const S = SIGIL[sig];
  x.fillStyle = lit ? '#e03028' : '#a8a094'; S.forEach((row, y) => { for (let i = 0; i < 9; i++) if (row[i] === 'x') x.fillRect(2 + i, 2 + y, 1, 1); });
  // 외곽선
  const d = x.getImageData(0, 0, 13, 13), A = (i, j) => i >= 0 && j >= 0 && i < 13 && j < 13 && d.data[(j * 13 + i) * 4 + 3] > 0;
  x.fillStyle = '#000'; for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) if (!A(i, j) && (A(i + 1, j) || A(i - 1, j) || A(i, j + 1) || A(i, j - 1))) x.fillRect(i, j, 1, 1);
  return c.toDataURL();
}

// ---------------------------------------------------------------- 봉인된 기사단 문 (북쪽 벽, 아래 가운데 기준) 44×50칸
function sealedDoor(cx, by, litN, open) {
  const W = 40, H = 44, G = Grid(W, H), ox = cx - W / 2, oy = by - H;
  // 아치 틀 (두꺼운 돌) + 쐐기돌
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - (W - 1) / 2, top = 14, inArch = y >= top ? Math.abs(dx) <= 19 : Math.hypot(dx / 19, (y - top) / 14) <= 1;
    const inIn = y >= top ? Math.abs(dx) <= 13 : Math.hypot(dx / 13, (y - top) / 10) <= 1;
    if (inArch && !inIn) G.set(x, y, 'stone');
    if (inIn) G.set(x, y, open ? 'void' : 'pale');
  }
  // 아치 돌 이음매
  for (const a of [-1.2, -0.6, 0, 0.6, 1.2]) { const c0 = Math.cos(a - Math.PI / 2), s0 = Math.sin(a - Math.PI / 2); for (let k = 13; k <= 19; k++) G.set((W - 1) / 2 + c0 * k, 14 + s0 * k * (14 / 19), 'stone:3'); }
  for (let y = 16; y < H; y += 6) { G.set(1, y, 'stone:3'); G.set(2, y, 'stone:3'); G.set(W - 2, y, 'stone:3'); G.set(W - 3, y, 'stone:3'); }
  G.rect(17, 0, 22, 5, 'pale'); G.rect(18, 1, 21, 4, 'stone:1'); // 쐐기돌
  if (!open) {
    G.rect((W - 1) / 2, 6, (W - 1) / 2 + 0.5, H - 1, 'stone:3'); // 두 짝 사이 이음
    for (const y of [22, 36]) G.rect(8, y, W - 9, y, 'pale:2'); // 가로 띠
  } else {
    // 안쪽: 아래로 내려가는 계단 (점점 어두움)
    for (let i = 0; i < 6; i++) { const y = H - 2 - i * 4; G.rect(9 + i, y, W - 10 - i, y, i < 2 ? 'stone:2' : i < 4 ? 'dark:1' : 'dark:2'); G.rect(9 + i, y + 1, W - 10 - i, y + 1, 'dark:3'); }
  }
  paint(G, ox, oy);
  // 쐐기돌의 칼 문양
  for (let y = 1; y <= 4; y++) px(ox + 19, oy + y, '#221e28'), px(ox + 20, oy + y, '#221e28'); px(ox + 18, oy + 2, '#221e28'); px(ox + 21, oy + 2, '#221e28');
  // 문장 네 개: 문 위에 2×2 (열리면 아치 둘레로 물러남)
  const pos = open ? [[ox + 6, oy + 18], [ox + W - 7, oy + 18], [ox + 6, oy + 33], [ox + W - 7, oy + 33]] : [[ox + 13, oy + 16], [ox + W - 14, oy + 16], [ox + 13, oy + 29], [ox + W - 14, oy + 29]];
  ['lion', 'crow', 'rose', 'tower'].forEach((s, i) => medal(pos[i][0], pos[i][1], s, i < litN, 11));
  if (open) { glow(cx, by - 18, 18, '255,60,40', 0.35, 14); for (let i = 0; i < 6; i++) px(cx - 6 + ((i * 5) % 13), by - 8 - ((i * 7) % 18), i % 2 ? '#ff6a50' : '#a01828'); }
}

// ---------------------------------------------------------------- 무릎 꿇은 기사 석상 + 받침 (아래 가운데 기준)
function kneelStatue(cx, by, sig, lit) {
  const W = 26, H = 34, G = Grid(W, H), ox = cx - 13, oy = by - H;
  G.rect(1, 26, 24, 33, 'pale'); G.rect(0, 31, 25, 33, 'stone'); G.rect(2, 25, 23, 25, 'pale:0'); // 받침 + 모서리 띠
  // 망토 (뒤)
  for (let y = 9; y <= 24; y++) { const w = 3 + Math.floor((y - 9) / 4); G.rect(5 - Math.floor((y - 9) / 6), y, 5 + w, y, 'stone:2'); }
  // 꿇은 뒷다리 (무릎이 받침에, 정강이는 뒤로)
  G.rect(6, 19, 11, 22, 'stone'); G.rect(3, 22, 11, 24, 'stone'); G.rect(2, 23, 4, 24, 'stone:2');
  // 세운 앞다리
  G.rect(11, 16, 17, 18, 'stone'); G.rect(15, 17, 17, 24, 'stone'); G.rect(15, 23, 19, 24, 'stone:0');
  // 몸통 (살짝 숙임)
  G.rect(7, 9, 13, 17, 'stone'); G.rect(8, 8, 13, 8, 'stone:0'); G.rect(7, 13, 13, 13, 'stone:2'); // 허리띠
  G.rect(6, 8, 8, 11, 'pale'); // 어깨받이
  // 숙인 투구
  G.disc(13, 5.5, 3.2, 'pale', 3); G.rect(14, 6, 16, 6, 'dark:3'); // 눈 틈
  G.rect(11, 1, 12, 2, 'stone:2'); // 투구 장식
  // 팔: 어깨 → 칼자루 위 두 손
  G.line(10, 10, 15, 13, 'stone', 2); G.rect(16, 11, 18, 13, 'pale'); // 손
  // 땅에 꽂은 칼
  G.rect(17, 7, 17, 10, 'iron'); G.rect(16, 6, 18, 6, 'iron:0'); // 손잡이 · 머리
  G.rect(14, 14, 21, 14, 'iron'); // 코등이
  G.rect(17, 15, 18, 25, 'iron'); G.rect(17, 15, 17, 25, 'iron:0');
  paint(G, ox, oy);
  medal(cx, by - 4, sig, lit, 11);
  // 이끼·금 간 자국
  px(ox + 3, oy + 28, '#46404e'); px(ox + 4, oy + 29, '#46404e'); px(ox + 21, oy + 27, '#46404e'); px(ox + 9, oy + 15, '#46404e');
}

// ---------------------------------------------------------------- 석관 (위에 발도르를 본뜬 기사 와상) 52×26칸
var sarcophagus = function (cx, cy, open, glowOn) {
  const W = 52, H = 28, ox = cx - W / 2, oy = cy - H / 2;
  const B = Grid(W, H); B.rect(1, 12, W - 2, H - 1, 'stone'); B.rect(1, 12, W - 2, 12, 'stone:0');
  for (let x = 6; x < W - 4; x += 9) B.rect(x, 15, x + 5, H - 4, 'stone:2'); // 앞면 판 장식
  if (open) { B.rect(3, 6, W - 4, 12, 'void'); B.rect(2, 5, W - 3, 5, 'stone:0'); B.rect(2, 6, 2, 12, 'stone:2'); B.rect(W - 3, 6, W - 3, 12, 'stone:2'); }
  paint(B, ox, oy);
  if (open) { // 안: 일지 (붉은 끈) — 빛남
    const J = Grid(12, 8); J.rect(0, 0, 11, 7, 'book'); J.rect(1, 1, 10, 6, 'book:1'); J.rect(5, 0, 6, 7, 'page:1'); J.rect(8, 6, 8, 9, 'red:1');
    paint(J, cx - 6, oy + 6); glow(cx, oy + 9, 16, '255,90,60', 0.6, 8);
  }
  // 뚜껑: 닫힘 = 제자리, 열림 = 오른쪽 위로 밀려남
  const L = Grid(W, 14), lx = open ? ox + 16 : ox, ly = open ? oy - 6 : oy;
  L.rect(0, 0, W - 1, 12, 'pale'); L.rect(0, 12, W - 1, 13, 'stone:2');
  // 와상: 투구 · 몸 · 가슴 위 칼 · 발
  L.disc(8, 6, 3.4, 'stone', 3.2); L.rect(9, 5, 11, 5, 'dark:3');
  L.rect(12, 3, 40, 9, 'stone'); L.rect(13, 3, 16, 9, 'stone:0'); // 어깨
  L.rect(41, 3, 44, 5, 'stone'); L.rect(41, 7, 44, 9, 'stone');
  L.rect(14, 6, 42, 6, 'iron:0'); L.rect(18, 4, 18, 8, 'iron'); L.rect(15, 6, 17, 6, 'gold:1'); // 칼
  L.rect(22, 4, 32, 8, 'stone:1'); L.rect(26, 5, 28, 7, 'stone:2'); // 가슴 문장 자리
  paint(L, lx, ly);
  px(lx + 27, ly + 6, '#a01828'); // 가슴 보석
  if (glowOn) glow(cx, cy, 34, '255,50,40', 0.3, 20);
}

// ---------------------------------------------------------------- 촛대 (아래 가운데 기준) 9×26칸 + 앞 바닥 문장판
function candle(cx, by, sig, state, t) { // state: 'off' | 'lit' | 'red' | 'smoke'
  const W = 11, H = 28, G = Grid(W, H), ox = cx - 5, oy = by - H;
  G.rect(1, H - 3, 9, H - 2, 'iron'); G.rect(0, H - 1, 2, H - 1, 'iron'); G.rect(8, H - 1, 10, H - 1, 'iron'); // 세 발
  G.rect(5, 8, 5, H - 4, 'iron'); G.rect(4, 15, 6, 16, 'iron'); // 대 · 마디
  G.rect(2, 6, 8, 7, 'iron'); G.rect(1, 5, 1, 5, 'iron'); G.rect(9, 5, 9, 5, 'iron'); // 받침 접시
  G.rect(4, 1, 6, 5, 'wax'); G.set(6, 4, 'wax:2'); G.set(4, 5, 'wax:1'); // 초 (녹아내린 자국)
  G.set(5, 0, '#2a2420'); // 심지
  paint(G, ox, oy);
  const fx = cx, fy = oy - 1;
  if (state === 'lit' || state === 'red') {
    const red = state === 'red', fl = Math.floor(t * 8) % 3, C = red ? ['#ffd0c0', '#ff5040', '#a01020'] : ['#fff2b0', '#ffa030', '#c04010'];
    px(fx, fy - 3 - (fl === 1 ? 1 : 0), C[1]); px(fx, fy - 2, C[0]); px(fx, fy - 1, C[0]); px(fx - 1, fy - 1, C[1]); px(fx + 1, fy - 1 - (fl === 2 ? 1 : 0), C[1]); px(fx, fy, C[2]);
    glow(fx, fy, red ? 26 : 22, red ? '255,60,40' : '255,170,80', red ? 0.6 : 0.5);
  }
  if (state === 'smoke') for (let i = 0; i < 5; i++) { const k = (t * 0.8 + i * 0.2) % 1; px(fx + Math.round(Math.sin(k * 6 + i) * 1.5), fy - 2 - Math.floor(k * 14), k < 0.5 ? '#8a8496' : '#5e5868'); }
}
function floorPlate(cx, cy, sig, lit) { medal(cx, cy, sig, lit, 13); }

// ---------------------------------------------------------------- 망령 종자 (틀린 순서) — 게임 캡처 위에 푸른 연기
function wisps(x, y, t) { for (let i = 0; i < 10; i++) { const k = (t * 0.6 + i / 10) % 1; px(x + Math.round(Math.sin(i * 2.3 + k * 4) * 7), y - Math.floor(k * 22), k < 0.5 ? '#8ab8e0' : '#46607a'); } glow(x, y - 8, 16, '120,170,230', 0.35); }

// ---------------------------------------------------------------- 게임 F 안내 (drawPrompt와 같은 모양)
function prompt(text, x, y, t) {
  x *= 2; y *= 2; g.save(); g.font = '9px Galmuri9'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const w = g.measureText(text).width + 10, X = Math.round(x), Y = Math.round(y + Math.sin(t * 4) * 1.5);
  g.fillStyle = 'rgba(10,8,14,.85)'; g.fillRect(X - w / 2, Y - 10, w, 14);
  g.strokeStyle = '#c9a24a'; g.lineWidth = 1; g.strokeRect(X - w / 2 + 0.5, Y - 9.5, w - 1, 13);
  g.fillStyle = '#ffe9b0'; g.fillText(text, X, Y); g.restore();
}

// ================================================================ v2 수정안: 큰 문장 · 동물/사물 석상 · 돌기둥 + 화로
// 13×13 문장 (a = 바탕 결, b = 밝은 면). 탑은 얼굴 없음
const SIG13 = {
  lion: ['...a.a.a.a...', '..aaaaaaaaa..', '.aaabbbbbaaa.', 'aaabbbbbbbaaa', '.abb.bbb.bba.', 'aabbbbbbbbbaa', '.abbbb.bbbba.', 'aabbb...bbbaa', '.aabbbbbbbaa.', '..aaabbbaaa..', '.a.aaaaaaa.a.', '...a.a.a.a...', '.............'],
  rose: ['....aaaaa....', '..aabbbbbaa..', '.abbaaaaabba.', '.abaabbbaaba.', '.ababaaabbba.', '.abbabbbabba.', '..abbaaaabb..', '...aabbbbaa..', '.....aaaa....', '......a......', '..bbb.a.bbb..', '...bbba.bbb..', '......a......'],
  crow: ['.............', '.......aaa...', '......aabba..', '.....aaaaaabb', '....aaaaaa...', '..aaaaaaaa...', '.aaabbbaaa...', 'aaabbbbaa....', '..aaabbaa....', '....aaaaa....', '.....a..a....', '....aa.aa....', '.............'],
  tower: ['.aa.aa.aa.aa.', '.aaaaaaaaaaa.', '..abbbbbbba..', '..abb.b.bba..', '..abb.b.bba..', '..abbbbbbba..', '..abbbbbbba..', '..abbb.bbba..', '..abb...bba..', '..abb...bba..', '.aabb...bbaa.', 'aaaaaaaaaaaaa', '.............'],
};
// 큰 메달 (15×15칸): 원판 위에 돋을새김 문장
var medal13 = function (cx, cy, sig, lit) {
  const S = 15, G = Grid(S, S); G.disc(7, 7, 7, 'dark:2'); G.disc(7, 7, 6.2, lit ? 'dark:3' : 'dark:1');
  SIG13[sig].forEach((row, y) => { for (let x = 0; x < 13; x++) { const ch = row[x]; if (ch === '.') continue; G.set(1 + x, 1 + y, lit ? (ch === 'b' ? 'redLit:0' : 'redLit:2') : (ch === 'b' ? '#c8c2cc' : '#8a8494')); } });
  paint(G, cx - 7, cy - 7); if (lit) glow(cx, cy, 14, '255,70,50', 0.5);
}
// 봉인된 기사단 문 (배경 소품처럼 또렷하게) 50×48칸 — open이면 문장 없이 열린 계단
MAT.door = ['#aaa4b2', '#7c7688', '#5a5466', '#3c3746'];
MAT.leaf = ['#8e889a', '#6a6476', '#4c4756', '#33303b'];
function sealedDoor2(cx, by, litN, open) {
  const W = 50, H = 48, G = Grid(W, H), ox = cx - W / 2, oy = by - H, mx = (W - 1) / 2, top = 16;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - mx, inArch = y >= top ? Math.abs(dx) <= 24 : Math.hypot(dx / 24, (y - top) / 16) <= 1, inIn = y >= top ? Math.abs(dx) <= 18 : Math.hypot(dx / 18, (y - top) / 12) <= 1;
    if (inArch && !inIn) G.set(x, y, 'door'); if (inIn) G.set(x, y, open ? 'void' : 'leaf');
  }
  for (const a of [-1.15, -0.55, 0.55, 1.15]) for (let k = 18; k <= 24; k++) G.set(mx + Math.sin(a) * k, top - Math.cos(a) * k * (16 / 24), 'door:3');
  for (let y = 20; y < H; y += 6) { G.rect(0, y, 5, y, 'door:3'); G.rect(W - 6, y, W - 1, y, 'door:3'); }
  G.rect(21, 0, 28, 6, 'door'); G.rect(22, 1, 27, 5, 'door:0'); // 쐐기돌
  if (!open) { G.rect(24, 5, 25, H - 1, 'leaf:3'); G.rect(7, 30, W - 8, 30, 'leaf:3'); for (const x of [10, 39]) G.rect(x, 33, x + 1, 36, 'iron'); }
  else for (let i = 0; i < 7; i++) { const y = H - 2 - i * 4; G.rect(8 + i, y, W - 9 - i, y, i < 2 ? 'door:2' : i < 4 ? 'dark:1' : 'dark:2'); G.rect(8 + i, y + 1, W - 9 - i, y + 1, 'dark:3'); }
  paint(G, ox, oy);
  for (let y = 1; y <= 5; y++) px(ox + 24, oy + y, '#3c3746'), px(ox + 25, oy + y, '#3c3746'); px(ox + 23, oy + 2, '#3c3746'); px(ox + 26, oy + 2, '#3c3746'); // 칼 문양
  if (!open) [['sword', 16, 18], ['crow', 33, 18], ['rose', 16, 39], ['tower', 33, 39]].forEach(([s, x, y], i) => medal13(ox + x, oy + y - 1, s, i < litN));
  if (open) { glow(cx, by - 16, 20, '255,170,90', 0.3, 14); }
}
// 받침 (아래 가운데, 24×9칸) — 앞면 구절 홈이 읽으면 붉게
function pedestal(cx, by, lit) {
  const G = Grid(26, 9); G.rect(1, 0, 24, 6, 'stone'); G.rect(0, 7, 25, 8, 'stone'); G.rect(1, 0, 24, 0, 'pale:0');
  G.rect(5, 3, 20, 3, lit ? 'redLit:1' : 'stone:3'); G.rect(7, 5, 18, 5, lit ? 'redLit:2' : 'stone:3');
  paint(G, cx - 13, by - 9); if (lit) glow(cx, by - 5, 14, '255,70,50', 0.45, 6);
}
// 예배당: 문장이 새겨진 돌기둥 + 위 화로 (아래 가운데) 19×40칸
var brazierPillar = function (cx, by, sig, state, t) { // state: off | lit | red | smoke
  const W = 19, H = 40, G = Grid(W, H), ox = cx - 9, oy = by - H;
  G.rect(0, H - 4, W - 1, H - 1, 'stone'); G.rect(1, H - 5, W - 2, H - 5, 'pale:0'); // 밑동
  G.rect(2, 12, W - 3, H - 5, 'stone'); G.rect(1, 10, W - 2, 11, 'pale'); // 기둥 · 머리
  for (let y = 31; y < H - 5; y += 4) G.rect(2, y, W - 3, y, 'stone:3');
  // 화로 (쇠 그릇 + 다리)
  G.rect(3, 7, 15, 9, 'iron'); G.rect(1, 4, 17, 6, 'iron'); G.rect(0, 4, 0, 5, 'iron:0'); G.rect(18, 4, 18, 5, 'iron:0');
  G.rect(2, 3, 16, 3, state === 'off' || state === 'smoke' ? '#2a2420' : '#5a2010'); // 숯
  paint(G, ox, oy);
  // 기둥에 새긴 문장
  const lit = state === 'lit' || state === 'red';
  SIG13[sig].forEach((row, y) => { for (let x = 0; x < 13; x++) { const ch = row[x]; if (ch === '.') continue; px(ox + 3 + x, oy + 15 + y, lit ? (state === 'red' ? (ch === 'b' ? '#ffb0a0' : '#e03028') : (ch === 'b' ? '#ffd890' : '#c87030')) : (ch === 'b' ? '#2c2834' : '#211e28')); } });
  if (lit) glow(cx, oy + 21, 12, state === 'red' ? '255,60,40' : '255,150,60', 0.4);
  const fx = cx, fy = oy + 2;
  if (lit) {
    const red = state === 'red', C = red ? ['#ffe0d0', '#ff5a40', '#c01820', '#600c10'] : ['#fff2b0', '#ffb040', '#e05018', '#8a2a08'];
    for (let i = -6; i <= 6; i++) { const h = 3 + Math.round((Math.sin(t * 9 + i * 1.7) + 1) * 1.5) + (Math.abs(i) < 3 ? 4 : Math.abs(i) < 5 ? 2 : 0); for (let k = 0; k < h; k++) px(fx + i, fy - k, k < 1 ? C[3] : k < h * 0.45 ? C[2] : k < h - 1 ? C[1] : C[0]); }
    for (let i = 0; i < 3; i++) { const k = (t * 1.3 + i / 3) % 1; px(fx + Math.round(Math.sin(i * 3 + t * 4) * 4), fy - 10 - Math.floor(k * 10), k < 0.5 ? C[1] : C[2]); }
    glow(fx, fy - 4, red ? 34 : 30, red ? '255,60,40' : '255,160,70', red ? 0.65 : 0.55);
  }
  if (state === 'smoke') for (let i = 0; i < 9; i++) { const k = (t * 0.7 + i / 9) % 1; px(fx - 4 + (i % 5) * 2 + Math.round(Math.sin(k * 6 + i) * 1.5), fy - 1 - Math.floor(k * 18), k < 0.5 ? '#8a8496' : '#5e5868'); }
}

// v3 문장 석상: 재의 제단 근위기사 석상과 같은 규칙 (16칸 폭 · 같은 돌 팔레트 · 검은 외곽선 · 왼쪽 위 빛 · 밝은 면 반점 · 13칸 받침, 받침의 구절 홈이 읽으면 달아오름)
const STAT_FIG = {"lion": ["....k.k..k.k....", "...kmkmkkmkmk...", "..kmhmhmmhmmdk..", ".kmhkkkkkkkkmdk.", "kmhkHhhhhhmdkmdk", ".khkHekhhekdkdk.", "kmhkhhhhhhmdkmdk", ".khkhhhkkhmdkdk.", "kmhkhhkddkmdkmdk", ".kmhkhhmmmdkmdk.", "..kmhkkkkkkmdk..", "...kmhmhmmdmk...", "..kkhHhmmmmdkk..", ".khHhhkmmmmddk..", ".khhhmkmmmmdddk.", ".khhkhmkmmkdmdk.", ".khhkhmkmmkdmdk.", "khhhkhmkmmkdddk.", "khHhkhmkmmkddddk", "khhhkhmkmmkdddDk", "kkhHhkkkkkhddDkk", ".kkkkkkkkkkkkkk."], "crow": ["................", "................", "................", "........kkkk....", ".......kHhhmk...", "......kHhhhmdk..", "......khheemdkkk", "......khhhhmkHHk", ".....kkhhmmdkkk.", "....kHhhhmmdk...", "...kHhhmmmmdk...", "..kHhhmmkmmddk..", "..khhmmkmmmddk..", ".khhmmkmmmmddk..", ".khmmkmmmmdddk..", "khmmkmmmmddddk..", "kmmkmmmmddddk...", "kdmmmmmdddkk....", "kddmkkkkkk......", "kdk..kHk.kHk....", "kk..kHhkkhHk....", "....kkkkkkkk...."], "rose": ["................", "...kk.kkkk.kk...", "..kHhkkhhmkkmk..", ".kHhkHhhhmmkmdk.", ".khkHhkkkkmdkdk.", "kHhkhkHhmdkmkdk.", "khkhkhkkhmkmkddk", ".khmkhmmmdkmmdk.", ".khmmkkkkkkmmdk.", "..khmmmhmmmmdk..", "..kkkhmmmmmdkk..", "....kkkkkkkk....", ".......khk......", "..kkk..khk.kkk..", ".kHhmkkkhdkmmdk.", ".khmmmmkhdmmmdk.", "..kkmmkkhdkmdk..", "....kkkkhdkkk...", ".......khdk.....", "......kkhdkk....", ".....khhhdddk...", "....kkkkkkkkkk.."], "tower": [".kkkk.kkkk.kkkk.", ".kHhk.khhk.kmdk.", ".kHhkkkhhkkkmdk.", ".kHhhhhhhmmmmdk.", ".kkkkkkkkkkkkkk.", "..khHhhhmmmmdk..", "..khhhhkkmmmdk..", "..khHhhkekmmdk..", "..khhhhkekmmdk..", "..khhhhkkmmmdk..", "..khhhhhmmmmdk..", "..khDDDDDDDDdk..", "..khHhhhmmmmdk..", "..khhhhhmmmmdk..", "..khDDDDDDDDdk..", "..khHhkkkkmmdk..", "..khhkeeeekmdk..", "..khhkeeeekmdk..", ".kkhhkeeeekmdkk.", ".khhhkeeeekmmdk.", ".kHhhkeeeekmddk.", "kkkkkkkkkkkkkkkk"]};
const STAT_PED = ['kkkkkkkkkkkkkkkk', 'kHHHHHHHHHHHHHHk', 'khmmmmmmmmmmmmdk', 'kkkkkkkkkkkkkkkk', '.khmmmmmmmmmmdk.', '.khmCCmCCCmCCdk.', '.khmmmmmmmmmmdk.', '.khmCCCmCCmCmdk.', '.khmmmmmmmmmmdk.', 'kkkkkkkkkkkkkkkk', 'kHHHHHHHHHHHHHHk', 'khDDDDDDDDDDDDdk', 'kkkkkkkkkkkkkkkk'];
const STAT_P = { k: K, H: '#a8a29a', h: '#7e7884', m: '#5e5866', d: '#433e4a', D: '#2a2630', e: '#141218' };
const STAT_PP = { k: K, H: '#7e7884', h: '#5e5866', m: '#4a4554', d: '#34303c', D: '#24202b' };
function shash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; }
var statue = function (kind, cx, by, lit) {
  const F = STAT_FIG[kind], py = F.length - 1, ox = cx - 8, oy = by - (py + STAT_PED.length);
  dshRect(g, (ox - 1) * 2, (by - 1) * 2, 36, 4, 0.5);
  STAT_PED.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; const c = ch === 'C' ? (lit ? (y === 0 || STAT_PED[y - 1][x] !== 'C' ? '#ff7a28' : '#d03018') : '#4e4638') : STAT_PP[ch]; px(ox + x, oy + py + y, c); }));
  F.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; let c = ch === 'e' ? (lit ? '#ff4a2a' : '#141218') : STAT_P[ch]; if (ch === 'H' && shash(x * 13 + y * 5 + kind.length * 7) < 0.35) c = '#c4beb4'; px(ox + x, oy + y, c); }));
  if (lit) { glow(cx, by - 7, 12, '255,90,40', 0.45, 6); }
}

// ================================================================ v4: 미니멀 인장(검 · 까마귀 · 장미 · 탑) · 어두운 석상 · 석관/돌기둥 디테일
const SIG11 = {
  sword: ['.....x.....', '....xxx....', '.....x.....', '..xxxxxxx..', '.....x.....', '.....x.....', '.....x.....', '.....x.....', '.....x.....', '.....x.....', '...........'],
  crow:  ['...........', '......xx...', '.....xxxxx.', '....xxx....', '..xxxxx....', 'xxxxxxx....', '..xxxx.....', '...x.x.....', '..xx.xx....', '...........', '...........'],
  rose:  ['....xxx....', '..xx...xx..', '.x..xxx..x.', '.x.x...x.x.', '..x..x..x..', '...xxxxx...', '.....x.....', '..xx.x.....', '....xx.xx..', '.....x.....', '.....x.....'],
  tower: ['.x.x.x.x.x.', '.xxxxxxxxx.', '..x.....x..', '..x..x..x..', '..x.....x..', '..x.....x..', '..x.....x..', '..x.xxx.x..', '..x.x.x.x..', '.xxxxxxxxx.', '...........'],
};
SIG_NAME.sword = '검'; delete SIG_NAME.lion;
PHRASE.sword = PHRASE.lion; delete PHRASE.lion;
// UI 아이콘
sigilURL = function (sig, lit) {
  const [c, x] = __mk(13, 13); x.fillStyle = lit ? '#e03028' : '#a8a094';
  SIG11[sig].forEach((row, y) => { for (let i = 0; i < 11; i++) if (row[i] === 'x') x.fillRect(1 + i, 1 + y, 1, 1); });
  const d = x.getImageData(0, 0, 13, 13), A = (i, j) => i >= 0 && j >= 0 && i < 13 && j < 13 && d.data[(j * 13 + i) * 4 + 3] > 0;
  x.fillStyle = '#000'; for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) if (!A(i, j) && (A(i + 1, j) || A(i - 1, j) || A(i, j + 1) || A(i, j - 1))) x.fillRect(i, j, 1, 1);
  return c.toDataURL();
};
// 문의 메달: 어두운 원판에 가는 선 돋을새김
medal13 = function (cx, cy, sig, lit) {
  const G = Grid(15, 15); G.disc(7, 7, 7, 'dark:2'); G.disc(7, 7, 6.2, lit ? 'dark:3' : 'dark:1'); paint(G, cx - 7, cy - 7);
  SIG11[sig].forEach((row, y) => { for (let x = 0; x < 11; x++) if (row[x] === 'x') { px(cx - 5 + x, cy - 5 + y, lit ? (y < 4 ? '#ffb0a0' : '#ff5a40') : '#a49eae'); } });
  if (lit) glow(cx, cy, 14, '255,70,50', 0.5);
};
// 어두운 석상 팔레트 (맵 돌기둥 · 벽돌 톤)
Object.assign(STAT_P, { H: '#6e687a', h: '#544e60', m: '#403b4a', d: '#2e2a36', D: '#1e1b24', e: '#0e0c12' });
Object.assign(STAT_PP, { H: '#544e60', h: '#403b4a', m: '#36313f', d: '#2a2632', D: '#1c1922' });
STAT_FIG.sword = ['.......kk.......', '......kHdk......', '......khdk......', '.......kk.......', '......kHdk......', '......khdk......', '......kHdk......', '......khdk......', '.kkkkkkkkkkkkkk.', 'kHhhhhhhhmmmmddk', '.kkkkkhmdkkkkkk.', '.....kHhmdk.....', '.....kHhmdk.....', '.....kHhmdk.....', '.....kHhmdk.....', '.....kHhmdk.....', '.....kHhmdk.....', '...kkkHhmdkkk...', '..khHhkhmkmmdk..', '.khHhhhkkmmmddk.', 'khhhhhmmmmmdddDk', 'kkkkkkkkkkkkkkkk'];
statue = function (kind, cx, by, lit) {
  const F = STAT_FIG[kind], py = F.length - 1, ox = cx - 8, oy = by - (py + STAT_PED.length);
  dshRect(g, (ox - 1) * 2, (by - 1) * 2, 36, 4, 0.5);
  STAT_PED.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; const c = ch === 'C' ? (lit ? (STAT_PED[y - 1][x] !== 'C' ? '#ff7a28' : '#d03018') : '#26221e') : STAT_PP[ch]; px(ox + x, oy + py + y, c); }));
  F.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; let c = ch === 'e' ? (lit ? '#ff4a2a' : STAT_P.e) : STAT_P[ch]; if (ch === 'H' && shash(x * 13 + y * 5 + kind.length * 7) < 0.3) c = '#86808e'; px(ox + x, oy + y, c); }));
  if (lit) glow(cx, by - 7, 12, '255,90,40', 0.45, 6);
};
// 석관 (60×32칸): 받침돌 · 모서리 기둥 · 판 장식 · 몰딩 뚜껑 위 와상(대투구 · 어깨갑 · 가슴 위 맞잡은 손과 칼 · 발)
MAT.sarc = ['#686274', '#4c4656', '#383342', '#26222c'];
MAT.lid = ['#78728a', '#5a5466', '#423d4c', '#2e2a36'];
sarcophagus = function (cx, cy, open, glowOn) {
  const W = 60, H = 32, ox = cx - W / 2, oy = cy - H / 2;
  const B = Grid(W, H);
  B.rect(0, 27, W - 1, 31, 'sarc'); B.rect(1, 26, W - 2, 26, 'sarc:0'); // 받침돌
  B.rect(2, 13, W - 3, 25, 'sarc'); // 몸통
  for (const x0 of [2, W - 7]) { B.rect(x0, 12, x0 + 4, 25, 'lid'); B.rect(x0, 12, x0 + 4, 12, 'lid:0'); B.rect(x0 + 1, 24, x0 + 3, 25, 'sarc:2'); } // 모서리 기둥
  for (const x0 of [9, 25, 41]) { B.rect(x0, 15, x0 + 9, 23, 'sarc:3'); B.rect(x0 + 1, 16, x0 + 8, 22, 'sarc:2'); B.rect(x0 + 1, 16, x0 + 8, 16, 'sarc:1'); } // 오목한 판 3
  B.rect(29, 17, 30, 21, 'sarc:0'); B.rect(27, 18, 32, 18, 'sarc:0'); // 가운데 판의 칼 문양
  B.rect(12, 19, 15, 19, 'sarc:0'); B.rect(13, 18, 14, 20, 'sarc:0'); B.rect(44, 18, 47, 21, 'sarc:0'); B.rect(45, 17, 46, 17, 'sarc:0'); // 십자 · 방패 문양
  if (open) { B.rect(4, 7, W - 5, 13, 'void'); B.rect(3, 6, W - 4, 6, 'sarc:0'); B.rect(3, 7, 3, 13, 'sarc:2'); B.rect(W - 4, 7, W - 4, 13, 'sarc:2'); }
  paint(B, ox, oy);
  px(ox + 20, oy + 24, '#1c1922'); px(ox + 21, oy + 25, '#1c1922'); px(ox + 52, oy + 20, '#1c1922'); px(ox + 51, oy + 21, '#1c1922'); // 금
  if (open) { const J = Grid(12, 8); J.rect(0, 0, 11, 7, 'book'); J.rect(1, 1, 10, 6, 'book:1'); J.rect(5, 0, 6, 7, 'page:1'); J.rect(8, 6, 8, 9, 'red:1'); paint(J, cx - 6, oy + 7); glow(cx, oy + 10, 18, '255,90,60', 0.6, 9); }
  const L = Grid(W, 15), lx = open ? ox + 18 : ox, ly = open ? oy - 7 : oy;
  L.rect(0, 0, W - 1, 13, 'lid'); L.rect(0, 13, W - 1, 14, 'sarc:2'); L.rect(1, 1, W - 2, 1, 'lid:0'); L.rect(2, 2, W - 3, 12, 'lid:2'); L.rect(3, 3, W - 4, 11, 'lid'); // 몰딩 테두리
  L.disc(9, 7, 3.6, 'sarc', 3.4); L.rect(8, 4, 10, 4, 'sarc:0'); L.rect(11, 6, 12, 6, '#1c1922'); L.rect(11, 8, 12, 8, '#1c1922'); // 대투구 · 눈 틈 · 숨구멍
  L.rect(13, 3, 17, 11, 'sarc'); L.rect(13, 3, 17, 3, 'sarc:0'); // 어깨갑
  L.rect(18, 4, 44, 10, 'sarc'); L.rect(18, 4, 44, 4, 'sarc:0'); for (const x of [23, 28, 38]) L.rect(x, 5, x, 9, 'sarc:2'); L.rect(33, 4, 34, 10, 'sarc:3'); // 몸 · 갑옷 판 · 허리띠
  L.rect(19, 7, 50, 7, 'iron:0'); L.rect(20, 6, 20, 8, 'iron'); L.rect(18, 7, 19, 7, 'gold:1'); L.rect(51, 7, 51, 7, 'iron:1'); // 칼 (머리 쪽 자루 → 발 쪽 끝)
  L.rect(21, 5, 23, 9, 'lid:0'); // 맞잡은 손
  L.rect(45, 4, 50, 5, 'sarc'); L.rect(45, 9, 50, 10, 'sarc'); L.rect(51, 4, 53, 5, 'sarc:0'); L.rect(51, 9, 53, 10, 'sarc:0'); // 다리 · 발
  paint(L, lx, ly);
  px(lx + 30, ly + 7, '#a01828'); px(lx + 30, ly + 6, '#e04030'); // 가슴 보석
  if (glowOn) glow(cx, cy, 36, '255,50,40', 0.3, 22);
};
// 돌기둥 + 화로 (21×48칸): 계단 받침 · 홈 파인 기둥 · 오목한 인장 판 · 몰딩 머리 · 세 발 쇠 화로
brazierPillar = function (cx, by, sig, state, t) {
  const W = 21, H = 48, G = Grid(W, H), ox = cx - 10, oy = by - H;
  G.rect(0, H - 3, W - 1, H - 1, 'sarc'); G.rect(0, H - 3, W - 1, H - 3, 'sarc:0'); G.rect(1, H - 5, W - 2, H - 4, 'sarc'); G.rect(1, H - 5, W - 2, H - 5, 'sarc:0'); // 계단 받침
  G.rect(3, 16, W - 4, H - 6, 'sarc'); for (const x of [5, 8, 12, 15]) G.rect(x, 16, x, H - 6, 'sarc:2'); G.rect(3, 16, 3, H - 6, 'sarc:0'); // 기둥 · 세로 홈
  G.rect(4, 21, 16, 35, 'sarc:3'); G.rect(5, 22, 15, 34, 'dark:1'); // 오목한 인장 판
  G.rect(1, 12, W - 2, 15, 'lid'); G.rect(1, 12, W - 2, 12, 'lid:0'); G.rect(2, 15, W - 3, 15, 'sarc:2'); G.rect(0, 13, W - 1, 13, 'lid'); // 머리 몰딩
  G.line(4, 11, 3, 8, 'iron', 1); G.line(16, 11, 17, 8, 'iron', 1); G.rect(10, 9, 10, 11, 'iron'); // 세 발
  G.rect(2, 4, 18, 7, 'iron'); G.rect(4, 8, 16, 8, 'iron:2'); G.rect(1, 3, 19, 3, 'iron:0'); // 그릇 · 테
  const cold = state === 'off' || state === 'smoke'; G.rect(3, 2, 17, 2, cold ? '#2a2420' : '#7a2810'); for (const x of [5, 9, 13]) G.set(x, 2, cold ? '#3a3430' : '#c04818');
  paint(G, ox, oy);
  for (const x of [3, 7, 13, 17]) px(ox + x, oy + 5, '#8a8496'); // 테의 징
  const lit = state === 'lit' || state === 'red';
  SIG11[sig].forEach((row, y) => { for (let x = 0; x < 11; x++) if (row[x] === 'x') px(ox + 5 + x, oy + 23 + y, lit ? (state === 'red' ? '#ff6a50' : '#ffb050') : '#1c1922'); });
  if (lit) glow(cx, oy + 28, 12, state === 'red' ? '255,60,40' : '255,150,60', 0.4);
  const fx = cx, fy = oy + 1;
  if (lit) {
    const red = state === 'red', C = red ? ['#ffe0d0', '#ff5a40', '#c01820', '#600c10'] : ['#fff2b0', '#ffb040', '#e05018', '#8a2a08'];
    for (let i = -7; i <= 7; i++) { const h = 3 + Math.round((Math.sin(t * 9 + i * 1.7) + 1) * 1.5) + (Math.abs(i) < 3 ? 5 : Math.abs(i) < 5 ? 3 : 0); for (let k = 0; k < h; k++) px(fx + i, fy - k, k < 1 ? C[3] : k < h * 0.45 ? C[2] : k < h - 1 ? C[1] : C[0]); }
    for (let i = 0; i < 4; i++) { const k = (t * 1.3 + i / 4) % 1; px(fx + Math.round(Math.sin(i * 3 + t * 4) * 5), fy - 11 - Math.floor(k * 12), k < 0.5 ? C[1] : C[2]); }
    glow(fx, fy - 4, red ? 38 : 34, red ? '255,60,40' : '255,160,70', red ? 0.65 : 0.55);
  }
  if (state === 'smoke') for (let i = 0; i < 10; i++) { const k = (t * 0.7 + i / 10) % 1; px(fx - 5 + (i % 6) * 2 + Math.round(Math.sin(k * 6 + i) * 1.5), fy - 1 - Math.floor(k * 20), k < 0.5 ? '#8a8496' : '#5e5868'); }
};


// ================================================================ v5: 입체 음영 · 도트 퀄리티 (문 · 석상 · 석관 · 돌기둥)
// 2장 돌 톤 7단 (0 밝음 → 6 어둠). 외곽선은 순검정 대신 가장 어두운 돌색으로 배경에 녹임
const STN = ['#8e889a', '#736d80', '#5c5668', '#48434f', '#38343f', '#29262f', '#1c1a22'];
const TV = ['#f0d8ff', '#d8a8ff', '#b070ff', '#8a48d8', '#5e30a0', '#3c1a6a', '#220c40']; // 발도르 보라 (석상 · 벽 인장이 읽혔을 때)
const TR = ['#ffd8c0', '#ff9a70', '#ff5a3a', '#d83020', '#a01818', '#6a0c10', '#3a060a']; // 달아오른 돌
const TI = ['#9a94a4', '#6e6878', '#4e4958', '#38343f', '#28252e', '#1c1a21', '#121016']; // 쇠
const OUT = '#121016';
const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dth = (x, y) => B4[((y & 3) << 2) | (x & 3)] / 16;
function hsh(x, y) { let n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
// 톤 격자: {w,h,t[y][x]} (null = 빈칸, 숫자 = 톤, 'r숫자' = 붉은 톤, 'i숫자' = 쇠 톤, '#..' = 그대로)
function TG(w, h) { return { w, h, t: Array.from({ length: h }, () => Array(w).fill(null)), set(x, y, v) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) this.t[y][x] = v; }, get(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? this.t[y][x] : null; } }; }
function tcol(v) { if (typeof v === 'number') return STN[Math.max(0, Math.min(6, v))]; if (v[0] === 'r') return TR[Math.max(0, Math.min(6, +v.slice(1)))]; if (v[0] === 'v') return TV[Math.max(0, Math.min(6, +v.slice(1)))]; if (v[0] === 'i') return TI[Math.max(0, Math.min(6, +v.slice(1)))]; return v; }
function drawTG(G, ox, oy, outline = true) {
  for (let y = -1; y <= G.h; y++) for (let x = -1; x <= G.w; x++) {
    const v = G.get(x, y);
    if (v == null) { if (outline && (G.get(x + 1, y) != null || G.get(x - 1, y) != null || G.get(x, y + 1) != null || G.get(x, y - 1) != null)) px(ox + x, oy + y, OUT); continue; }
    px(ox + x, oy + y, tcol(v));
  }
}
// 바닥 그림자 (디더 타원)
function floorShadow(cx, cy, rx, ry, a = 0.55) { g.fillStyle = 'rgba(8,6,10,.85)'; for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const d = (x / rx) ** 2 + (y / ry) ** 2; if (d <= 1 && dth(cx + x, cy + y) < (1 - d) * a * 1.6) g.fillRect((cx + x) * 2, (cy + y) * 2, 2, 2); } }
// 3/4 시점 돌덩이: 윗면(밝음) + 앞면(아래로 갈수록 어두움, 왼쪽 빛 · 오른쪽 그늘), 모서리 하이라이트
function block(G, x, y, w, top, front, base = 2, opt = {}) {
  for (let j = 0; j < top; j++) for (let i = 0; i < w; i++) {
    let t = base - 1; if (j === 0) t = base - 2; if (i === 0) t = base - 2; if (i === w - 1) t = base; if (j === top - 1 && i > 0) t = base - 1;
    if (opt.tex && hsh(x + i, y + j) < 0.12) t += 1; G.set(x + i, y + j, Math.max(0, t));
  }
  for (let j = 0; j < front; j++) for (let i = 0; i < w; i++) {
    const k = front > 1 ? j / (front - 1) : 0; let t = base + 1 + (k > 0.55 ? 1 : 0) + (k > 0.55 && k < 0.75 && dth(x + i, y + top + j) < 0.5 ? -1 : 0);
    if (i === 0) t -= 1; if (i >= w - 2) t += 1; if (j === 0) t = base; if (j === front - 1) t = base + 3;
    if (opt.tex && hsh(x + i + 7, y + j + top) < 0.1) t += 1; G.set(x + i, y + top + j, Math.min(6, t));
  }
}
// 높이 지도 음영 (석상 · 돋을새김): mask 안쪽에서 테두리까지 거리 → 기울기 → 왼쪽 위 빛
function reliefShade(mask, base, amp = 0.9, cap = 4) {
  const H = mask.length, W = mask[0].length, D = Array.from({ length: H }, () => Array(W).fill(0));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y][x]) { let d = 1; outer: for (; d < cap; d++) for (const [a, b] of [[d, 0], [-d, 0], [0, d], [0, -d], [d, d], [-d, -d], [d, -d], [-d, d]]) { const yy = y + b, xx = x + a; if (yy < 0 || xx < 0 || yy >= H || xx >= W || !mask[yy][xx]) break outer; } D[y][x] = Math.sqrt(d); }
  const out = Array.from({ length: H }, () => Array(W).fill(null)), hv = (x, y) => (y < 0 || x < 0 || y >= H || x >= W ? 0 : D[y][x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y][x]) {
    const gx = hv(x + 1, y) - hv(x - 1, y), gy = hv(x, y + 1) - hv(x, y - 1), b = (gx + gy) * amp, b0 = typeof base === 'function' ? base(x, y) : base;
    const f = b0 - b, fl = Math.floor(f); out[y][x] = fl + (f - fl > dth(x, y) ? 1 : 0);
  }
  return out;
}

// ---------------------------------------------------------------- 인장 돋을새김용 13×13 (두께 있는 실루엣)
const SIGR = {
  sword: ['......#......', '.....###.....', '......#......', '..#########..', '...##.#.##...', '.....###.....', '.....###.....', '.....###.....', '.....###.....', '.....###.....', '......#......', '......#......', '.............'],
  crow: ['.............', '........##...', '.......#####.', '......####...', '....######...', '..########...', '.#########...', '###.######...', '....#####....', '.....#..#....', '....##.##....', '.............', '.............'],
  rose: ['....#####....', '..##.###.##..', '.###.#.#.###.', '.##.#####.##.', '.###.###.###.', '..###...###..', '....#####....', '......#......', '..###.#......', '...####.###..', '......####...', '......#......', '......#......'],
  tower: ['.##.##.##.##.', '.###########.', '..#########..', '..####.####..', '..####.####..', '..#########..', '..#########..', '..#########..', '..####.####..', '..###...###..', '..###...###..', '.###########.', '.............'],
};
// 돋을새김: 바탕(leafTone) 위에 밝게 솟고 오른쪽 아래로 그림자. lit = 붉게
function reliefSigil(G, x0, y0, sig, lit, leafTone) {
  const M = SIGR[sig].map(r => [...r].map(c => c === '#'));
  for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) if (M[y][x] && !(M[y + 1] && M[y + 1][x]) ) G.set(x0 + x, y0 + y + 1, leafTone + 2); // 아래 그림자
  for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) if (M[y][x] && !M[y][x + 1]) G.set(x0 + x + 1, y0 + y, leafTone + 1);
  const S = reliefShade(M, lit ? 3 : leafTone - 1, 1.2, 3);
  for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) if (S[y][x] != null) G.set(x0 + x, y0 + y, lit ? 'r' + Math.max(0, Math.min(6, S[y][x])) : Math.max(0, Math.min(6, S[y][x])));
}

// ---------------------------------------------------------------- 봉인된 기사단 문 (배경 벽돌 톤에 녹아드는 어두운 아치 돌문)
sealedDoor2 = function (cx, by, litN, open) {
  const W = 52, H = 50, G = TG(W, H), ox = cx - W / 2, oy = by - H, mx = (W - 1) / 2, top = 17;
  const inA = (x, y, r, rv) => { const dx = Math.abs(x - mx); return y >= top ? dx <= r : Math.hypot(dx / r, (y - top) / rv) <= 1; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const outer = inA(x, y, 25, 17), inner = inA(x, y, 19, 13), rim = inA(x, y, 21, 14.5);
    if (!outer) continue;
    if (!rim) { // 아치 돌 (벽돌 줄눈 · 왼쪽 위 빛)
      let t = 4; const ang = Math.atan2(y - top, x - mx); if (y < top) { if (Math.round((ang + Math.PI) * 4.2) % 2 === 0 && hsh(Math.round(ang * 9), 0) < 2) t = (Math.round(ang * 4.7) % 2) ? 4 : 3; } else t = ((y - top) >> 2) % 2 ? 4 : 3;
      if (x - mx < -22 || (y < top && ang < -1.6)) t -= 1; if (x - mx > 22) t += 1;
      if (y >= top && (y - top) % 5 === 4) t = 5; if (y < top && hsh(Math.round(ang * 7.3), 3) < 0.5 && Math.abs(Math.hypot((x - mx) / 25, (y - top) / 17) - 0.93) < 0.04) t = 5;
      G.set(x, y, t); continue;
    }
    if (!inner) { G.set(x, y, x < mx ? 4 : 5); continue; } // 안쪽 턱 (깊이)
    if (open) { const d = H - 1 - y; G.set(x, y, 6); continue; }
    let t = 4; if (Math.abs(x - mx) < 1) t = 6; else if (x === Math.round(mx - 19) || x === Math.round(mx + 1)) t = 3; // 문짝 이음 · 문짝 왼쪽 모서리 빛
    if ((y - top) % 11 === 10 && y > top) t = 5; if (hsh(x, y) < 0.06) t = 5;
    G.set(x, y, t);
  }
  // 쐐기돌 (칼 문양 돋을새김)
  for (let y = 0; y < 7; y++) for (let x = mx - 3.5; x <= mx + 3.5; x++) G.set(x, y, y === 0 ? 2 : x < mx - 2 ? 3 : x > mx + 2 ? 5 : 4);
  for (let y = 1; y <= 5; y++) G.set(mx, y, y === 1 ? 2 : 3); G.set(mx - 1, 2, 3); G.set(mx + 1, 2, 3);
  if (!open) {
    // 쇠 띠 · 고리
    for (const yy of [top + 6, H - 8]) for (let x = mx - 18; x <= mx + 18; x++) if (Math.abs(x - mx) > 0.6) G.set(x, yy, 'i' + (x < mx - 16 ? 2 : 3)), G.set(x, yy + 1, 'i5');
    for (const xx of [mx - 3, mx + 3]) { G.set(xx, H - 14, 'i2'); G.set(xx - 1, H - 13, 'i3'); G.set(xx + 1, H - 13, 'i4'); G.set(xx, H - 12, 'i4'); }
    // 인장 돋을새김 (원판 없이 문짝에 직접)
    [['sword', mx - 17, top - 4], ['crow', mx + 4, top - 4], ['rose', mx - 17, top + 12], ['tower', mx + 4, top + 12]].forEach(([s, x, y], i) => reliefSigil(G, Math.round(x), y, s, i < litN, 4));
  } else {
    for (let i = 0; i < 7; i++) { const y = H - 2 - i * 4; for (let x = mx - 17 + i; x <= mx + 17 - i; x++) { G.set(x, y, i < 2 ? 4 : 5); G.set(x, y + 1, 6); } } // 내려가는 계단
  }
  drawTG(G, ox, oy);
  for (let i = 0; i < 3; i++) for (let x = 0; x < W; x++) if (G.get(x, H - 1) != null && dth(x, i) < 0.5 - i * 0.15) px(ox + x, by + i, 'rgba(8,6,10,.6)'.replace(/.*/, '#141218'));
  if (!open) for (let i = 0; i < litN; i++) { const [x, y] = [[mx - 11, top + 2], [mx + 10, top + 2], [mx - 11, top + 18], [mx + 10, top + 18]][i]; glow(ox + x, oy + y, 12, '255,70,50', 0.45); }
  if (open) glow(cx, by - 14, 18, '255,150,80', 0.25, 12);
};

// ---------------------------------------------------------------- 석상: 손으로 찍은 실루엣 + 높이 지도 음영
STAT_FIG.sword = ['.......kk.......', '......kHdk......', '......khdk......', '.......kk.......', '......kHdk......', '......khdk......', '......kHdk......', '......khdk......', '..kkkkkkkkkkkk..', '.kHhhhhhhmmmmdk.', '..kkkkhmdkkkkk..', '......khmk......', '......khmk......', '......khmk......', '......khmk......', '......khmk......', '......khmk......', '...kkkkhmkkkk...', '..khHhhhmmmmdk..', '.khHhhhhmmmmddk.', 'khhhhhmmmmmdddDk', 'kkkkkkkkkkkkkkkk'];
statue = function (kind, cx, by, lit) {
  const F = STAT_FIG[kind], fh = F.length - 1, W = 16;
  const ZT = { H: 2, h: 3, m: 3, d: 4, D: 5, e: 5 };
  const mask = F.slice(0, fh).map(r => [...r].map(c => c !== '.' && c !== 'k'));
  const S = reliefShade(mask, (x, y) => (ZT[F[y][x]] || 3) + (y > fh * 0.75 ? 0.6 : 0), 1.1, 4);
  const G = TG(W, fh + 13);
  for (let y = 0; y < fh; y++) for (let x = 0; x < W; x++) { const c = F[y][x]; if (c === '.') continue; if (c === 'k') { // 안쪽 선은 깊은 홈, 바깥은 외곽선
      const inside = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => mask[y + b] && mask[y + b][x + a]).length >= 2; if (inside) G.set(x, y, 6); continue; }
    if (c === 'e') { G.set(x, y, lit ? 'r2' : 6); continue; }
    let t = S[y][x]; if (t <= 1 && hsh(x * 3 + kind.length, y) < 0.25) t = 1; G.set(x, y, Math.max(1, Math.min(6, t))); }
  // 받침: 3/4 시점 돌덩이 두 단 + 앞면 구절 홈
  block(G, 0, fh, 16, 2, 3, 3, { tex: true }); block(G, 1, fh + 5, 14, 1, 4, 3, { tex: true }); block(G, 0, fh + 10, 16, 1, 2, 3);
  for (const [yy, xs] of [[fh + 7, [3, 4, 6, 7, 8, 10, 11, 12]], [fh + 9, [4, 5, 6, 8, 9, 11]]]) for (const x of xs) G.set(x, yy - 1, lit ? (yy === fh + 7 ? 'r1' : 'r2') : 6);
  floorShadow(cx, by, 10, 2);
  drawTG(G, cx - 8, by - (fh + 13));
  if (lit) glow(cx, by - 6, 12, '255,90,40', 0.45, 6);
};

// ---------------------------------------------------------------- 석관 (62×34): 받침 · 모서리 기둥 · 오목한 판 · 몰딩 뚜껑 · 와상 돋을새김
sarcophagus = function (cx, cy, open, glowOn) {
  const W = 62, H = 42, G = TG(W, H), ox = cx - W / 2, oy = cy - H / 2;
  block(G, 0, 35, W, 2, 5, 3, { tex: true }); // 받침돌
  block(G, 2, 18, W - 4, 0, 17, 2, { tex: true }); // 몸통 앞면
  for (const x0 of [2, W - 8]) block(G, x0, 17, 6, 2, 16, 2); // 모서리 기둥
  for (const x0 of [10, 26, 42]) for (let y = 22; y <= 31; y++) for (let x = x0; x <= x0 + 9; x++) { let t = 4; if (y === 22 || x === x0) t = 5; if (y === 31 || x === x0 + 9) t = 2; if (y > 22 && x > x0 && hsh(x, y) < 0.08) t = 5; G.set(x, y, t); } // 오목한 판
  const mini = { cross: ['.#.', '###', '.#.', '.#.'], sword: ['.#.', '###', '.#.', '.#.', '.#.'], shield: ['###', '###', '###', '.#.'] };
  for (const [x0, k] of [[13, 'cross'], [29, 'sword'], [45, 'shield']]) mini[k].forEach((r, y) => [...r].forEach((c, x) => { if (c === '#') { G.set(x0 + x + 1, 24 + y + 1, 5); G.set(x0 + x, 24 + y, y === 0 ? 2 : 3); } }));
  for (const [x, y] of [[22, 34], [23, 35], [23, 36], [55, 27], [56, 28]]) G.set(x, y, 6); // 금
  if (open) { for (let y = 8; y <= 18; y++) for (let x = 4; x <= W - 5; x++) G.set(x, y, y < 10 ? 5 : 6); for (let x = 3; x <= W - 4; x++) G.set(x, 7, 2); for (let y = 8; y <= 18; y++) { G.set(3, y, 3); G.set(W - 4, y, 4); } }
  drawTG(G, ox, oy);
  floorShadow(cx, oy + H, 34, 3, 0.6);
  if (open) { const J = Grid(12, 8); J.rect(0, 0, 11, 7, 'book'); J.rect(1, 1, 10, 6, 'book:1'); J.rect(5, 0, 6, 7, 'page:1'); J.rect(8, 6, 8, 9, 'red:1'); paint(J, cx - 6, oy + 9); glow(cx, oy + 12, 18, '255,90,60', 0.6, 9); }
  // 뚜껑 (윗면 18줄 + 옆 테 2줄): 몰딩 두 겹 + 와상
  const L = TG(W, 20), lx = open ? ox + 18 : ox, ly = open ? oy - 8 : oy;
  for (let y = 0; y < 20; y++) for (let x = 0; x < W; x++) {
    let t = 2; const e = Math.min(x, y, W - 1 - x, 17 - y);
    if (y >= 18) t = y === 18 ? 3 : 4; else if (e === 0) t = (x === W - 1 || y === 17) ? 3 : 1; else if (e === 1) t = (x >= W - 2 || y >= 16) ? 3 : 1; else if (e === 2) t = (x <= 2 || y <= 2) ? 4 : 2; else if (e === 3) t = 3; else { t = 2; if (hsh(x + 3, y) < 0.07) t = 3; }
    L.set(x, y, t);
  }
  // 와상 마스크: 대투구 · 어깨 · 몸통 · 다리 · 발
  const EW = 50, EH = 12, M = Array.from({ length: EH }, () => Array(EW).fill(false)), on = (x, y) => { if (x >= 0 && y >= 0 && x < EW && y < EH) M[y][x] = true; };
  for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
    const yc = y - 5.5;
    if (((x - 6) / 5.2) ** 2 + (yc / 5.2) ** 2 <= 1) on(x, y); // 투구
    if (x >= 11 && x <= 17 && Math.abs(yc) <= 5.6 - (x === 11 || x === 17 ? 1 : 0)) on(x, y); // 어깨
    if (x >= 17 && x <= 32 && Math.abs(yc) <= 4.6) on(x, y); // 몸통
    if (x >= 32 && x <= 44 && Math.abs(yc) <= 3.6 && Math.abs(yc) >= 0.6) on(x, y); // 두 다리
    if (x >= 44 && x <= 48 && Math.abs(yc) <= 4 && Math.abs(yc) >= 1.2) on(x, y); // 발
  }
  const S = reliefShade(M, 2.6, 1.4, 3);
  for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) if (S[y][x] != null) L.set(6 + x, 3 + y, Math.max(0, Math.min(5, S[y][x])));
  for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) if (M[y][x] && !(M[y + 1] && M[y + 1][x])) L.set(6 + x, 4 + y, 4); // 와상 아래 그늘
  for (const [x, y] of [[9, 7], [10, 7], [11, 7], [12, 7], [10, 9], [12, 9]]) L.set(x, y, 5); // 눈 틈 · 숨구멍
  L.set(6, 3, 1); L.set(7, 3, 1); L.set(8, 3, 1); // 투구 꼭대기 빛
  for (const x of [23, 28, 32]) for (let y = 5; y <= 12; y++) if (L.get(x, y) != null && M[y - 3] && M[y - 3][x - 6]) L.set(x, y, 4); // 갑옷 판
  for (let x = 20; x <= 50; x++) { L.set(x, 8, x < 22 ? 'i1' : 'i2'); L.set(x, 9, 'i4'); } L.set(51, 8, 'i3'); // 칼
  for (let y = 5; y <= 12; y++) L.set(21, y, y < 8 ? 'i2' : 'i3'); // 코등이
  for (const [x, y] of [[18, 8], [19, 8], [18, 9], [19, 9]]) L.set(x, y, '#b0883a'); L.set(17, 8, '#e0c070'); // 자루 · 머리
  for (let y = 6; y <= 11; y++) for (let x = 22; x <= 25; x++) L.set(x, y, y === 6 ? 1 : y > 10 ? 3 : 2); // 맞잡은 손
  L.set(36, 8, '#e04030'); L.set(36, 9, '#a01828'); // 가슴 보석
  drawTG(L, lx, ly);
  if (glowOn) glow(cx, cy, 36, '255,50,40', 0.3, 22);
};
// ---------------------------------------------------------------- 돌기둥 + 화로 (23×52)
brazierPillar = function (cx, by, sig, state, t) {
  const W = 23, H = 52, G = TG(W, H), ox = cx - 11, oy = by - H;
  block(G, 0, H - 7, W, 2, 5, 3, { tex: true }); block(G, 1, H - 12, W - 2, 1, 4, 3, { tex: true }); // 계단 받침 두 단
  for (let y = 18; y < H - 12; y++) for (let x = 3; x <= W - 4; x++) { // 기둥: 세로 홈 (빛 → 그늘)
    const i = x - 3, fl = i % 4; let tt = 3 + (i > 10 ? 1 : 0) + (i > 14 ? 1 : 0); if (fl === 0) tt = Math.max(1, tt - 1); if (fl === 3) tt += 1; if (i === 0) tt = 2;
    if ((y - 18) % 9 === 8) tt = 5; if (hsh(x, y) < 0.07) tt += 1; G.set(x, y, Math.min(6, tt)); }
  for (let y = 23; y <= 37; y++) for (let x = 4; x <= W - 5; x++) { let tt = 4; if (y === 23 || x === 4) tt = 5; if (y === 37 || x === W - 5) tt = 3; G.set(x, y, tt); } // 오목한 인장 판
  const lit = state === 'lit' || state === 'red';
  { const Ms = SIGR[sig].map(r => [...r].map(c => c === '#')); for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) if (Ms[y][x]) G.set(5 + x, 24 + y, lit ? (state === 'red' ? (Ms[y - 1] && Ms[y - 1][x] ? 'r3' : 'r1') : (Ms[y - 1] && Ms[y - 1][x] ? '#d07030' : '#ffc070')) : (Ms[y - 1] && Ms[y - 1][x] ? 6 : 5)); } // 음각 인장
  block(G, 1, 13, W - 2, 2, 3, 2); block(G, 0, 11, W, 1, 2, 2); // 머리 몰딩 두 단
  // 화로: 세 발 + 그릇 + 테 + 숯
  for (const [x0, x1] of [[5, 3], [17, 19]]) for (let y = 7; y <= 10; y++) G.set(x0 + (x1 - x0) * (10 - y) / 3, y, 'i3');
  for (let y = 8; y <= 10; y++) G.set(11, y, 'i3');
  for (let y = 3; y <= 7; y++) { const inset = Math.max(0, y - 5); for (let x = 1 + inset; x <= W - 2 - inset; x++) G.set(x, y, 'i' + (x < 3 + inset ? 2 : x > W - 5 - inset ? 4 : 3) ); }
  for (let x = 0; x < W; x++) G.set(x, 2, 'i' + (x < 2 ? 1 : x > W - 3 ? 3 : 2));
  for (const x of [3, 8, 14, 19]) G.set(x, 4, 'i1');
  const cold = state === 'off' || state === 'smoke'; for (let x = 2; x < W - 2; x++) G.set(x, 1, cold ? (hsh(x, 1) < 0.4 ? '#3a3430' : '#2a2420') : (hsh(x, 1) < 0.4 ? '#ff7a28' : '#a83010'));
  floorShadow(cx, by, 13, 2);
  drawTG(G, ox, oy);
  if (lit) glow(cx, oy + 30, 12, state === 'red' ? '255,60,40' : '255,150,60', 0.4);
  const fx = cx, fy = oy;
  if (lit) {
    const red = state === 'red', C = red ? ['#ffe0d0', '#ff5a40', '#c01820', '#600c10'] : ['#fff2b0', '#ffb040', '#e05018', '#8a2a08'];
    for (let i = -8; i <= 8; i++) { const h = 3 + Math.round((Math.sin(t * 9 + i * 1.7) + 1) * 1.5) + (Math.abs(i) < 3 ? 6 : Math.abs(i) < 6 ? 3 : 0); for (let k = 0; k < h; k++) px(fx + i, fy - k, k < 1 ? C[3] : k < h * 0.45 ? C[2] : k < h - 1 ? C[1] : C[0]); }
    for (let i = 0; i < 4; i++) { const k = (t * 1.3 + i / 4) % 1; px(fx + Math.round(Math.sin(i * 3 + t * 4) * 5), fy - 12 - Math.floor(k * 12), k < 0.5 ? C[1] : C[2]); }
    glow(fx, fy - 4, red ? 38 : 34, red ? '255,60,40' : '255,160,70', red ? 0.65 : 0.55);
  }
  if (state === 'smoke') for (let i = 0; i < 10; i++) { const k = (t * 0.7 + i / 10) % 1; px(fx - 6 + (i % 6) * 2 + Math.round(Math.sin(k * 6 + i) * 1.5), fy - 1 - Math.floor(k * 20), k < 0.5 ? '#8a8496' : '#5e5868'); }
};

// ================================================================ v6: 벽에 새긴 인장 (기존 벽 색 그대로) · 미니멀 석관/돌기둥
// 캡처한 벽 픽셀을 그대로 읽어 어둡게 판 홈 + 오른쪽 아래 턱 빛 → 벽 색 그대로 새긴 느낌
function cellRGB(cx, cy) { const d = g.getImageData(cx * 2, cy * 2, 1, 1).data; return [d[0], d[1], d[2]]; }
function mulRGB(c, k, add = 0) { return `rgb(${c.map(v => Math.max(0, Math.min(255, Math.round(v * k + add)))).join(',')})`; }
function wallCarve(x0, y0, sig, lit) {
  const M = SIGR[sig].map(r => [...r].map(c => c === '#')), at = (x, y) => y >= 0 && x >= 0 && y < 13 && x < 13 && M[y][x];
  const base = []; for (let y = -1; y < 14; y++) { base[y + 1] = []; for (let x = -1; x < 14; x++) base[y + 1][x + 1] = cellRGB(x0 + x, y0 + y); }
  const B = (x, y) => base[y + 1][x + 1];
  for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) {
    if (at(x, y)) { const shade = !at(x - 1, y) || !at(x, y - 1); // 홈: 위·왼쪽 안쪽은 더 깊은 그늘
      px(x0 + x, y0 + y, lit ? (shade ? '#a01818' : '#e04030') : mulRGB(B(x, y), shade ? 0.35 : 0.55)); }
    else if (at(x - 1, y) || at(x, y - 1)) px(x0 + x, y0 + y, lit ? '#ff8a60' : mulRGB(B(x, y), 1.25, 10)); // 오른쪽·아래 턱에 빛
  }
  if (lit) glow(x0 + 6, y0 + 6, 12, '255,70,50', 0.45);
}
// 벽 속 숨은 통로: 닫힘 = 인장 넷 + 희미한 이음매 / 열림 = 그 벽이 안쪽으로 빠져 계단 통로
sealedDoor2 = function (cx, by, litN, open) {
  const x0 = cx - 17, x1 = cx + 17, y0 = by - 30, y1 = by - 1;
  if (!open) {
    for (let x = x0; x <= x1; x++) px(x, y0, mulRGB(cellRGB(x, y0), 0.6)); for (let y = y0; y <= y1; y++) { px(x0, y, mulRGB(cellRGB(x0, y), 0.6)); px(x1, y, mulRGB(cellRGB(x1, y), 0.6)); } // 희미한 이음매
    ['sword', 'crow', 'rose', 'tower'].forEach((s, i) => wallCarve(cx - 33 + i * 17, by - 46, s, i < litN));
  } else {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const d = (y - y0) / (y1 - y0); px(x, y, d < 0.15 ? '#08070b' : '#0c0a10'); }
    for (let i = 0; i < 6; i++) { const y = y1 - 1 - i * 4, ins = i * 2; for (let x = x0 + 3 + ins; x <= x1 - 3 - ins; x++) { px(x, y, i < 2 ? '#2a2633' : i < 4 ? '#1e1b26' : '#15131b'); px(x, y + 1, '#0a090d'); } } // 계단
    for (let y = y0; y <= y1; y++) { px(x0, y, '#24212c'); px(x1, y, '#100e15'); } for (let x = x0; x <= x1; x++) px(x, y0, '#24212c'); // 벽 단면
    for (const [x, y, w] of [[x0 - 4, y1 - 1, 4], [x1 + 1, y1 - 2, 3], [x0 + 2, y1 + 1, 3]]) for (let i = 0; i < w; i++) { px(x + i, y, '#2c2834'); px(x + i, y - 1, i === 0 ? '#3a3542' : '#2c2834'); } // 무너진 돌 조각
    glow(cx, by - 8, 16, '255,150,80', 0.22, 10);
  }
};
// 미니멀 석관 (46×28): 둥근 모서리 뚜껑 + 작은 칼 문양 / 몸통 띠 하나 + 징 둘
sarcophagus = function (cx, cy, open, glowOn) {
  const W = 46, H = 28, ox = cx - W / 2, oy = cy - H / 2, G = TG(W, H);
  for (let y = 12; y < H; y++) for (let x = 1; x < W - 1; x++) { if ((y === H - 1) && (x === 1 || x === W - 2)) continue; let t = 3; if (x === 1) t = 2; if (x >= W - 3) t = 4; if (y === H - 1) t = 5; if (y === 18 || y === 19) t = y === 18 ? 4 : 2; G.set(x, y, t); }
  for (const x of [10, W - 11]) { G.set(x, 22, 2); G.set(x + 1, 22, 2); G.set(x, 23, 2); G.set(x + 1, 23, 4); } // 징
  if (open) for (let y = 6; y <= 12; y++) for (let x = 3; x <= W - 4; x++) G.set(x, y, y === 6 ? 2 : 6);
  floorShadow(cx, oy + H, 25, 2, 0.6); drawTG(G, ox, oy);
  if (open) { const J = Grid(10, 6); J.rect(0, 0, 9, 5, 'book'); J.rect(1, 1, 8, 4, 'book:1'); J.rect(4, 0, 5, 5, 'page:1'); paint(J, cx - 5, oy + 7); glow(cx, oy + 9, 16, '255,90,60', 0.6, 8); }
  const L = TG(W, 14), lx = open ? ox + 14 : ox, ly = open ? oy - 6 : oy;
  for (let y = 0; y < 14; y++) for (let x = 0; x < W; x++) { const cr = (x === 0 || x === W - 1) && (y === 0 || y === 13); if (cr) continue; let t = 2; if (y === 0 || x === 0) t = 1; if (x === W - 1) t = 3; if (y >= 12) t = y === 12 ? 3 : 4; if ((y === 2 || y === 10) && x >= 3 && x <= W - 4) t = 3; if ((x === 3 || x === W - 4) && y >= 2 && y <= 10) t = 3; L.set(x, y, t); }
  for (let x = 14; x <= 32; x++) { L.set(x, 6, 1); L.set(x, 7, 3); } for (let y = 4; y <= 9; y++) L.set(17, y, y < 6 ? 1 : 3); L.set(13, 6, 1); L.set(33, 6, 1); // 칼 문양
  L.set(23, 6, '#e04030'); // 보석 한 점
  drawTG(L, lx, ly);
  if (glowOn) glow(cx, cy, 30, '255,50,40', 0.3, 18);
};
// 미니멀 돌기둥 (15×36) + 둥근 화로
brazierPillar = function (cx, by, sig, state, t) {
  const W = 17, H = 38, G = TG(W, H), ox = cx - 8, oy = by - H;
  for (let y = H - 4; y < H; y++) for (let x = 0; x < W; x++) { if (y === H - 1 && (x === 0 || x === W - 1)) continue; G.set(x, y, y === H - 4 ? 2 : x === 0 ? 2 : x >= W - 2 ? 4 : 3); } // 받침
  for (let y = 12; y < H - 4; y++) for (let x = 2; x < W - 2; x++) G.set(x, y, x === 2 ? 2 : x === 3 ? 3 : x >= W - 4 ? 4 : 3); // 기둥
  for (let y = 9; y < 12; y++) for (let x = 0; x < W; x++) { if (y === 9 && (x === 0 || x === W - 1)) continue; G.set(x, y, y === 9 ? 2 : x >= W - 2 ? 4 : 3); } // 머리 판
  for (let y = 2; y <= 7; y++) { const ins = y < 4 ? 0 : y - 3; for (let x = 1 + ins; x <= W - 2 - ins; x++) G.set(x, y, 'i' + (y === 2 ? 1 : x < 3 + ins ? 2 : x > W - 4 - ins ? 4 : 3)); } G.set(5, 8, 'i4'); G.set(W - 6, 8, 'i4'); // 둥근 그릇 · 짧은 발
  const cold = state === 'off' || state === 'smoke'; for (let x = 2; x < W - 2; x++) G.set(x, 1, cold ? '#2c2622' : (x % 3 ? '#a83010' : '#ff7a28'));
  floorShadow(cx, by, 10, 2); drawTG(G, ox, oy);
  const lit = state === 'lit' || state === 'red';
  SIG11[sig].forEach((row, y) => { for (let x = 0; x < 11; x++) if (row[x] === 'x') px(ox + 3 + x, oy + 16 + y, lit ? (state === 'red' ? '#ff5a40' : '#ffb050') : '#1c1a22'); });
  if (lit) glow(cx, oy + 21, 10, state === 'red' ? '255,60,40' : '255,150,60', 0.4);
  const fx = cx, fy = oy;
  if (lit) {
    const red = state === 'red', C = red ? ['#ffe0d0', '#ff5a40', '#c01820', '#600c10'] : ['#fff2b0', '#ffb040', '#e05018', '#8a2a08'];
    for (let i = -5; i <= 5; i++) { const h = 2 + Math.round((Math.sin(t * 9 + i * 1.7) + 1) * 1.2) + (Math.abs(i) < 2 ? 5 : Math.abs(i) < 4 ? 2 : 0); for (let k = 0; k < h; k++) px(fx + i, fy - k, k < 1 ? C[3] : k < h * 0.45 ? C[2] : k < h - 1 ? C[1] : C[0]); }
    for (let i = 0; i < 3; i++) { const k = (t * 1.3 + i / 3) % 1; px(fx + Math.round(Math.sin(i * 3 + t * 4) * 4), fy - 9 - Math.floor(k * 10), k < 0.5 ? C[1] : C[2]); }
    glow(fx, fy - 3, red ? 32 : 28, red ? '255,60,40' : '255,160,70', red ? 0.6 : 0.5);
  }
  if (state === 'smoke') for (let i = 0; i < 8; i++) { const k = (t * 0.7 + i / 8) % 1; px(fx - 4 + (i % 5) * 2 + Math.round(Math.sin(k * 6 + i) * 1.5), fy - 1 - Math.floor(k * 16), k < 0.5 ? '#8a8496' : '#5e5868'); }
};

// ================================================================ v7: 석관 제거 → 바닥 가운데 글귀 · 돌기둥 낮게 + 세로 홈
// 캡처 바닥의 비밀 방 제단을 같은 줄눈의 바닥으로 덮음 (96px 왼쪽 바닥을 복사)

// 바닥 글귀 원: n = 밝혀진 사분면 수(0~4), done = 완성 (글귀가 떠오름)
function floorRite(cx, cy, litSet, done, t) {
  const R = 24, RY = 14, QK = ['crow', 'tower', 'rose', 'sword'], n = litSet.length; // 사분면: 오른쪽 위 · 오른쪽 아래 · 왼쪽 아래 · 왼쪽 위 (기둥 위치와 같은 쪽)
  for (let a = 0; a < 160; a++) { const th = a / 160 * Math.PI * 2, q = Math.floor(((th + Math.PI / 2) % (Math.PI * 2)) / (Math.PI / 2)); // 위에서 시계 방향 사분면
    for (const r of [R, R - 3]) { const x = Math.round(cx + Math.cos(th) * r), y = Math.round(cy + Math.sin(th) * r * RY / R); const on = done || litSet.includes(QK[q]);
      if (r === R - 3 && a % 8 > 4) continue;
      px(x, y, on ? (done ? (r === R ? '#c890ff' : '#7a40c8') : '#d07030') : mulRGB(cellRGB(x, y), 0.55)); } }
  for (let i = 0; i < 12; i++) { const th = i / 12 * Math.PI * 2, x = Math.round(cx + Math.cos(th) * (R - 6)), y = Math.round(cy + Math.sin(th) * (R - 6) * RY / R), on = done || litSet.includes(QK[Math.floor(((th + Math.PI / 2) % (Math.PI * 2)) / (Math.PI / 2))]); // 룬 눈금
    px(x, y, on ? (done ? '#f0d8ff' : '#ffa050') : mulRGB(cellRGB(x, y), 0.5)); px(x + 1, y, on ? (done ? '#b070ff' : '#c06020') : mulRGB(cellRGB(x + 1, y), 0.6)); }
  if (n > 0 && !done) glow(cx, cy, R + 6, '255,140,60', 0.12 * n, RY + 4);
  if (done) {
    glow(cx, cy, R + 10, '176,112,255', 0.5, RY + 6);
    const lines = ['빈 왕좌를', '지키리라'], lift = Math.floor((t * 2) % 2);
    g.save(); g.font = '9px Galmuri9'; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((s, i) => { const y = (cy - 3 + i * 6) * 2 - 6 - lift * 2; g.fillStyle = '#3a060a'; g.fillText(s, cx * 2 + 2, y + 2); g.fillStyle = i ? '#ff8a60' : '#ffd0c0'; g.fillText(s, cx * 2, y); });
    g.restore();
    for (let i = 0; i < 14; i++) { const k = (t * 0.5 + i / 14) % 1, x = cx - 20 + ((i * 11) % 41); px(x, Math.round(cy + 6 - k * 34), k < 0.4 ? '#d8a8ff' : k < 0.75 ? '#8a48d8' : '#3c1a6a'); } // 떠오르는 불티
  }
}
// 낮은 돌기둥 (17×31) — 세로 홈 + 은은한 음영
brazierPillar = function (cx, by, sig, state, t) {
  const W = 17, H = 31, G = TG(W, H), ox = cx - 8, oy = by - H;
  for (let y = H - 4; y < H; y++) for (let x = 0; x < W; x++) { if (y === H - 1 && (x === 0 || x === W - 1)) continue; G.set(x, y, y === H - 4 ? 2 : x === 0 ? 2 : x >= W - 2 ? 4 : 3); } // 받침
  for (let y = 11; y < H - 4; y++) for (let x = 2; x < W - 2; x++) { const i = x - 2; let tt = i < 3 ? 2 : i < 9 ? 3 : 4; if (i % 3 === 0 && i > 0) tt += 1; if (i % 3 === 1 && i < 9) tt -= 0; if (i === 0) tt = 2; if (y === 11) tt = Math.min(tt, 3); if (y === H - 5) tt += 1; G.set(x, y, Math.min(5, tt)); } // 기둥 · 세로 홈
  for (let y = 8; y < 11; y++) for (let x = 0; x < W; x++) { if (y === 8 && (x === 0 || x === W - 1)) continue; G.set(x, y, y === 8 ? 2 : x === 0 ? 2 : x >= W - 2 ? 4 : 3); } // 머리 판
  for (let y = 2; y <= 6; y++) { const ins = y < 4 ? 0 : y - 3; for (let x = 1 + ins; x <= W - 2 - ins; x++) G.set(x, y, 'i' + (y === 2 ? 1 : x < 3 + ins ? 2 : x > W - 4 - ins ? 4 : 3)); } G.set(5, 7, 'i4'); G.set(W - 6, 7, 'i4'); // 둥근 그릇 · 짧은 발
  const cold = state === 'off' || state === 'smoke'; for (let x = 2; x < W - 2; x++) G.set(x, 1, cold ? '#2c2622' : (x % 3 ? '#a83010' : '#ff7a28'));
  // 인장 판 자리: 세로 홈을 지우고 매끈한 판
  for (let y = 13; y <= 25; y++) for (let x = 3; x <= W - 4; x++) G.set(x, y, x === 3 || y === 13 ? 4 : x === W - 4 || y === 25 ? 2 : 3);
  floorShadow(cx, by, 10, 2); drawTG(G, ox, oy);
  const lit = state === 'lit' || state === 'red';
  SIG11[sig].forEach((row, y) => { for (let x = 0; x < 11; x++) if (row[x] === 'x') px(ox + 3 + x, oy + 14 + y, lit ? (state === 'red' ? '#c890ff' : '#ffb050') : '#1c1a22'); });
  if (lit) glow(cx, oy + 19, 10, state === 'red' ? '176,112,255' : '255,150,60', 0.4);
  const fx = cx, fy = oy;
  if (lit) {
    const red = state === 'red', C = red ? ['#f0d8ff', '#b070ff', '#6a30c0', '#30105a'] : ['#fff2b0', '#ffb040', '#e05018', '#8a2a08'];
    for (let i = -5; i <= 5; i++) { const h = 2 + Math.round((Math.sin(t * 9 + i * 1.7) + 1) * 1.2) + (Math.abs(i) < 2 ? 5 : Math.abs(i) < 4 ? 2 : 0); for (let k = 0; k < h; k++) px(fx + i, fy - k, k < 1 ? C[3] : k < h * 0.45 ? C[2] : k < h - 1 ? C[1] : C[0]); }
    for (let i = 0; i < 3; i++) { const k = (t * 1.3 + i / 3) % 1; px(fx + Math.round(Math.sin(i * 3 + t * 4) * 4), fy - 9 - Math.floor(k * 10), k < 0.5 ? C[1] : C[2]); }
    glow(fx, fy - 3, red ? 32 : 28, red ? '176,112,255' : '255,160,70', red ? 0.6 : 0.5);
  }
  if (state === 'smoke') for (let i = 0; i < 8; i++) { const k = (t * 0.7 + i / 8) % 1; px(fx - 4 + (i % 5) * 2 + Math.round(Math.sin(k * 6 + i) * 1.5), fy - 1 - Math.floor(k * 16), k < 0.5 ? '#8a8496' : '#5e5868'); }
};

// ================================================================ v8: 돌기둥 = 석상과 같은 어두운 돌 · 열린 벽 위 인장 유지 · 바닥 글귀는 두 줄 선
const STD2 = ['#86808e', '#6e687a', '#544e60', '#403b4a', '#2e2a36', '#1e1b24', '#141218'];
const STD = ['#a8a2b0', '#86808e', '#6e687a', '#544e60', '#403b4a', '#2e2a36', '#1e1b24'];
const _drawTG = drawTG;
drawTG = function (G, ox, oy, outline = true, pal) {
  if (!pal) return _drawTG(G, ox, oy, outline);
  for (let y = -1; y <= G.h; y++) for (let x = -1; x <= G.w; x++) { const v = G.get(x, y);
    if (v == null) { if (outline && (G.get(x + 1, y) != null || G.get(x - 1, y) != null || G.get(x, y + 1) != null || G.get(x, y - 1) != null)) px(ox + x, oy + y, OUT); continue; }
    px(ox + x, oy + y, typeof v === 'number' ? pal[Math.max(0, Math.min(6, v))] : tcol(v)); }
};
(function () { // 돌기둥: 석상 팔레트로 그리기
  const bp = brazierPillar;
  brazierPillar = function (cx, by, sig, state, t) { window.__pal = STD2; bp(cx, by, sig, state, t); window.__pal = null; };
  const d0 = drawTG; drawTG = function (G, ox, oy, outline = true, pal) { return d0(G, ox, oy, outline, pal || window.__pal); };
})();
// 열린 벽: 위의 인장은 그대로 (네 개 모두 붉게 달아오른 채), 아래 이음매 벽만 빠짐
(function () {
  const sd = sealedDoor2;
  sealedDoor2 = function (cx, by, litN, open) { sd(cx, by, litN, open); if (open) ['sword', 'crow', 'rose', 'tower'].forEach((s, i) => wallCarve(cx - 33 + i * 17, by - 46, s, false)); };
})();
// 바닥 글귀: 읽을 수 없는 두 줄의 선(—— - -)으로만 떠오름 → 가까이 가서 F로 읽음
(function () {
  floorRite = function (cx, cy, litSet, done, t) {
    const R = 24, RY = 14, QK = ['crow', 'tower', 'rose', 'sword'];
    const qOf = th => QK[Math.floor(((th + Math.PI / 2) % (Math.PI * 2)) / (Math.PI / 2))];
    for (let a = 0; a < 160; a++) { const th = a / 160 * Math.PI * 2; for (const r of [R, R - 3]) { if (r === R - 3 && a % 8 > 4) continue; const x = Math.round(cx + Math.cos(th) * r), y = Math.round(cy + Math.sin(th) * r * RY / R), on = done || litSet.includes(qOf(th));
      px(x, y, on ? (done ? (r === R ? '#c890ff' : '#7a40c8') : '#d07030') : mulRGB(cellRGB(x, y), 0.55)); } }
    for (let i = 0; i < 12; i++) { const th = i / 12 * Math.PI * 2, x = Math.round(cx + Math.cos(th) * (R - 6)), y = Math.round(cy + Math.sin(th) * (R - 6) * RY / R), on = done || litSet.includes(qOf(th));
      px(x, y, on ? (done ? '#f0d8ff' : '#ffa050') : mulRGB(cellRGB(x, y), 0.5)); px(x + 1, y, on ? (done ? '#b070ff' : '#c06020') : mulRGB(cellRGB(x + 1, y), 0.6)); }
    if (litSet.length && !done) glow(cx, cy, R + 6, '255,140,60', 0.12 * litSet.length, RY + 4);
    if (!done) return;
    glow(cx, cy, R + 10, '176,112,255', 0.5, RY + 6);
    const lift = Math.floor((t * 2) % 2), rows = [[[-12, 9], [-1, 4], [5, 2], [9, 3]], [[-9, 3], [-4, 7], [5, 2], [9, 1]]]; // —— - - 모양 선 조각 [시작 x, 길이]
    rows.forEach((segs, i) => { const y = cy - 4 + i * 6 - lift; for (const [sx, len] of segs) for (let k = 0; k < len; k++) { px(cx + sx + k, y + 1, '#220c40'); px(cx + sx + k, y, i ? '#c890ff' : '#f0d8ff'); } });
    for (let i = 0; i < 14; i++) { const k = (t * 0.5 + i / 14) % 1, x = cx - 20 + ((i * 11) % 41); px(x, Math.round(cy + 6 - k * 34), k < 0.4 ? '#d8a8ff' : k < 0.75 ? '#8a48d8' : '#3c1a6a'); }
  };
})();


  // ================================================================ 게임 연결 (v2.59) — 2장 「기사단 서약의 밀실」
  // 시안 함수는 칸(2px) 좌표로 g에 그린다. 게임에서는 g = ctx(또는 바닥 fg) 그대로, 칸 = 월드 좌표 / 2
  const half = v => Math.round(v / 2);
  function on(gg, fn) { const o = g; g = gg; try { fn(); } finally { g = o; } }
  const SIGS = ['sword', 'crow', 'rose', 'tower'], SNAME = { sword: '검', crow: '까마귀', rose: '장미', tower: '탑' };
  // v3.20 발도르 주문 속 「해」를 읽은 뒤 주인공의 반응 (키륵에게 들은 「해」와 이어짐 · '|'에서 말주머니를 나눔)
  const SPELL_SUN = { knight: '…{해}가 뜨지 않는 한.|그 고블린도 {해}라고 했지.', ranger: '…{해}…|{해}가 대체 뭐야.', mage: '{해}가 뜨지 않는 한…|키륵이 말한 「{해}, 안 떠」와 같은 이야기네요.', priest: '…{해}가 뜨지 않는 한.|키륵도 {해}를 이야기했었죠.', gunner: '{해}가 뜨지 않는 한이라…|또 그 소리군.' };
  const OATH = ['검 앞에 서약하노니,', '왕관을 쓴 왕 앞에 무릎 꿇은 자는', '그 왕이 떠난 뒤에도', '빈 왕좌를 지키리라.']; // v2.60 여는 말 · 주어 · 「그 왕」 · 끝맺음 — 문법만으로 순서가 하나
  const SPELL = ['기사단장 발도르여,', '{해}가 뜨지 않는 한, 너는 눕지 못하리라.', '빈 자리를 지키는 자여, 네 이름은 그 자리에 묶이리라.', '왕관이 돌아올 때마다 너는 다시 눈을 뜨리라.', '재가 되어도, 서약은 재가 되지 않으리라.'];
  const PIL_OFF = { sword: [-108, -10], crow: [108, -10], rose: [-116, 104], tower: [116, 104] }; // 바닥 원 가운데 기준 기둥 발 (px)
  const curR2 = () => G && G.dun && G.dun.cur;
  const chapel = () => G && G.dun && G.dun.rooms && G.dun.rooms.find(r => r.type === 'chapel');
  const phraseOf = (C, s) => OATH[C.oath.map.indexOf(s)];

  function prep2(rooms) {
    const cells = new Set(rooms.map(r => r.gx + ',' + r.gy)), at2 = (x, y) => rooms.find(r => r.gx === x && r.gy === y);
    const nbs = (x, y) => Object.keys(DIRS).map(d => at2(x + DIRS[d][0], y + DIRS[d][1])).filter(Boolean);
    const cand = rooms.filter(W => W.type === 'combat' && W.doors.n == null && !(W.crack && W.crack.dir === 'n') && !cells.has(W.gx + ',' + (W.gy - 1)) && nbs(W.gx, W.gy - 1).length === 1 && W.shape !== 'corridorV');
    if (!cand.length) return false;
    const W = cand.sort((a, b) => (b.depth || 0) - (a.depth || 0) + (Math.random() - 0.5) * 2)[0];
    const C = { id: rooms.length, gx: W.gx, gy: W.gy - 1, type: 'chapel', doors: { n: null, s: W.id, w: null, e: null }, visited: false, seen: false, cleared: true, loot: [], seed: randi(1, 2e9), shape: 'chamber', depth: (W.depth || 0) + 1, tier: 1 };
    rooms.push(C); W.doors.n = C.id; W.sealW = { dir: 'n', open: false };
    setArena(SHAPES[W.shape]); layoutRoom(W, 2); // 북쪽 통로 앞을 비우도록 다시 배치
    { const near = o2 => Math.abs(o2.x - DOOR.n.x) < 120 && o2.y < A.y0 + 46; const gone = (W.props || []).filter(near); W.props = (W.props || []).filter(p => !near(p)); W.obs = W.obs.filter(b => !(b.c && gone.some(p => Math.hypot(p.x - b.x, p.y - b.y) < 6))); W.nav = buildNav(W.obs); } // 인장 벽 앞 소품 치움
    setArena(SHAPES.chamber); layoutRoom(C, 2); C.obs = [];
    C.rite = { x: even(CX), y: even(CY - 30), lit: [], done: false, smokeT: 0 };
    C.pil = {}; for (const s of SIGS) { const [dx, dy] = PIL_OFF[s]; C.pil[s] = { x: even(C.rite.x + dx), y: even(C.rite.y + dy) }; C.obs.push({ t: 'prop', c: true, x: C.pil[s].x, y: C.pil[s].y - 6, r: 13 }); }
    C.nav = buildNav(C.obs);
    const map = SIGS.slice().sort(() => Math.random() - 0.5); C.oath = { map, read: [] }; // 구절 순서 → 문장 (판마다 섞임)
    // 문장 석상: 전투 · 엘리트 방 무작위 넷에 하나씩
    const sr = rooms.filter(r => (r.type === 'combat' || r.type === 'elite') && r !== W).sort(() => Math.random() - 0.5).slice(0, 4);
    sr.forEach((r, i) => {
      setArena(SHAPES[r.shape]);
      const pts = [[0.2, 0.25], [0.8, 0.25], [0.2, 0.8], [0.8, 0.8], [0.35, 0.2], [0.65, 0.2], [0.12, 0.5], [0.88, 0.5], [0.5, 0.82]].sort(() => Math.random() - 0.5);
      const doors = Object.keys(r.doors).filter(d => r.doors[d] != null).map(d => doorIn(d, 30));
      let p = null;
      for (const [u, v] of pts) { const x = even(A.x0 + u * (A.x1 - A.x0)), y = even(A.y0 + 40 + v * (A.y1 - A.y0 - 60)); if (obsHitL(r.obs, x, y, 30) || doors.some(q => Math.hypot(q.x - x, q.y - y) < 90) || Math.hypot(x - CX, y - CY) < 70) continue; p = { x, y }; break; }
      if (!p) p = { x: even(A.x0 + 60), y: even(A.y0 + 60) };
      r.statue = Object.assign(p, { sig: SIGS[i] });
      r.obs.push({ t: 'prop', c: true, x: p.x, y: p.y - 6, r: 15 }); r.nav = buildNav(r.obs);
    });
    setArena(SHAPES.hall);
    return true;
  }
  // 바닥(fg)에 굽는 그림: 벽의 인장 · 바닥 원 — 상태가 바뀌면 다시 칠함
  function floor(gg, R) {
    if (R.sealW) on(gg, () => {
      const C = G.dun.rooms[R.doors.n], read = C && C.oath ? C.oath.read : [], cx = half(DOOR.n.x), by = half(A.y0) + 1;
      if (!R.sealW.open) { const x0 = cx - 17, x1 = cx + 17, y0 = by - 30, y1 = by - 1;
        for (let x = x0; x <= x1; x++) px(x, y0, mulRGB(cellRGB(x, y0), 0.6)); for (let y = y0; y <= y1; y++) { px(x0, y, mulRGB(cellRGB(x0, y), 0.6)); px(x1, y, mulRGB(cellRGB(x1, y), 0.6)); }
        SIGS.forEach((s, i) => wallCarve(cx - 33 + i * 17, by - 46, s, read.includes(s)));
        { const [sc, sx] = __mk(66, 58); sx.drawImage(gg.canvas, (cx - 16) * 2, (by - 29) * 2, 66, 58, 0, 0, 66, 58); R.sealW.slab = sc; } } // v2.67 열릴 때 가라앉는 돌판 (닫힌 벽 그대로)
      else { sealedDoor2(cx, by, 0, true); SIGS.forEach((s, i) => wallCarve(cx - 33 + i * 17, by - 46, s, false)); }
    });
    if (R.rite) on(gg, () => floorRite(half(R.rite.x), half(R.rite.y), R.rite.done ? SIGS : R.rite.lit, R.rite.done, 0));
  }
  function repaint(R) {
    if (G.dun.cur === R) { paintRoomFloor(R); }
    const i = FL_CACHE.findIndex(c => c.key === G.stage + ':' + R.id && c.dun === G.dun); if (i >= 0) FL_CACHE.splice(i, 1);
  }
  const SBK = {};
  function statueArt(s, lit) { const k = s + (lit ? 1 : 0); if (SBK[k]) return SBK[k]; const [c, x] = __mk(56, 96); on(x, () => statue(s, 14, 44, lit)); return (SBK[k] = c); }
  function ents2(list) {
    const R = curR2(); if (!R) return;
    if (R.statue) { const s = R.statue, C = chapel(), lit = !!(C && C.oath.read.includes(s.sig)); list.push({ y: s.y, d: () => ctx.drawImage(statueArt(s.sig, lit), even(s.x - 28), even(s.y - 88)) }); }
    if (R.pil) for (const s of SIGS) { const p = R.pil[s], st = R.rite.done ? 'red' : R.rite.lit.includes(s) ? 'lit' : R.rite.smokeT > time ? 'smoke' : 'off';
      list.push({ y: p.y, d: () => on(ctx, () => brazierPillar(half(p.x), half(p.y), s, st, time)) }); }
  }
  function lights2(list) {
    const R = curR2(); if (!R) return;
    if (R.pil) for (const s of SIGS) { const p = R.pil[s], lit = R.rite.done || R.rite.lit.includes(s); if (lit) list.push({ x: p.x, y: p.y - 70, r: 80, a: 0.7, c: R.rite.done ? '176,112,255' : '255,150,60', ca: 0.14 }); }
    if (R.rite && R.rite.done) list.push({ x: R.rite.x, y: R.rite.y, r: 120, a: 0.5, c: '176,112,255', ca: 0.12 });
    if (R.statue) { const C = chapel(); if (C && C.oath.read.includes(R.statue.sig)) list.push({ x: R.statue.x, y: R.statue.y - 14, r: 50, a: 0.4, c: '255,90,40', ca: 0.1 }); }
  }
  function interact2() {
    const R = curR2(), P = G.player; if (!R || !P) return null;
    const near = (o, d) => Math.hypot(P.x - o.x, P.y - o.y) < d;
    if (R.sealW && R.sealW.anim != null) return null;
    if (R.sealW && R.sealW.open && near({ x: DOOR.n.x, y: A.y0 + 16 }, 52)) return { k: 'truth', a: 'c2enter', x: DOOR.n.x, y: A.y0 - 10, t: 'F 들어가기' };
    if (R.sealW && !R.sealW.open && near({ x: DOOR.n.x, y: A.y0 + 16 }, 52)) { const C = chapel(); return { k: 'truth', a: 'c2wall', x: DOOR.n.x, y: A.y0 - 10, t: C && C.oath.read.length >= 4 ? 'F 인장 문 열기' : 'F 살펴보기' }; }
    if (R.statue && near({ x: R.statue.x, y: R.statue.y + 10 }, 44)) return { k: 'truth', a: 'c2statue', x: R.statue.x, y: R.statue.y - 96, t: 'F 살펴보기' };
    if (R.pil && !R.rite.done && !G.enemies.some(e => !e.dead)) for (const s of SIGS) { const p = R.pil[s]; if (!R.rite.lit.includes(s) && near({ x: p.x, y: p.y + 10 }, 40)) return { k: 'truth', a: 'c2fire', s, x: p.x, y: p.y - 74, t: 'F 화로 켜기', hide: true /* 안내는 메시지 박스에 */ }; }
    if (R.rite && R.rite.done && near(R.rite, 60)) return { k: 'truth', a: 'c2read', x: R.rite.x, y: R.rite.y - 40, t: 'F 글귀 읽기' };
    return null;
  }
  function act2(it) {
    const R = curR2(), C = chapel();
    if (it.a === 'c2wall') { // v2.64 석상 넷을 모두 읽은 뒤 벽 앞에서 살펴보면 열림
      const n = C ? C.oath.read.length : 0, Wr = R, icons = SIGS.map(s => sigilURL(s, !!(C && C.oath.read.includes(s))));
      if (n >= 4) { TRUTH.box([['인장이 새겨진 벽', '네 인장이 모두 붉게 빛나고 있다.'], ['인장이 새겨진 벽', '벽에 손을 대자 이음매를 따라 돌문이 갈라진다.']], () => { Wr.sealW.anim = 0; sfx('heavy'); addShake(3); }, { icons }); return; } // v2.67 문이 가라앉는 연출 → 끝나면 F로 들어감
      TRUTH.box([['인장이 새겨진 벽', '검 · 까마귀 · 장미 · 탑, 네 개의 인장이 새겨져 있다. 아래에 희미한 이음매가 있다.'], ['인장이 새겨진 벽', n ? `인장 ${n}개가 붉게 빛나고 있다. 나머지 문장도 어딘가에 있을 것 같다.` : '어딘가에 같은 문장이 더 있을 것 같다.']], null, { icons }); return; }
    if (it.a === 'c2statue') {
      const s = R.statue.sig, ph = phraseOf(C, s), first = !C.oath.read.includes(s);
    TRUTH.box([[SNAME[s] + ' 석상 · ' + SNAME[s] + '의 구절', '「' + ph + '」']], null, { icon: sigilURL(s, true) }); // v2.61 통상 텍스트 박스
      if (!first) return;
      C.oath.read.push(s); const n = C.oath.read.length;
      lootFeed(`주운 구절 ${n} / 4 — ${SNAME[s]}`, '#e04030', 3200);
      const Wr = G.dun.rooms[C.doors.s]; if (Wr) repaint(Wr);
      if (n === 4) { banner('네 인장이 모두 깨어났다', ''); sfx('awaken'); } // v2.64 문은 벽 앞에서 직접 연다
      return;
    }
    if (it.a === 'c2fire') {
      const s = it.s, want = R.oath.map[R.rite.lit.length];
      if (s === want) { R.rite.lit.push(s); sfx('awaken'); lootFeed(`${SNAME[s]} · 「${OATH[R.rite.lit.length - 1]}」`, '#ffa030', 3600);
        if (R.rite.lit.length === 4) { R.rite.done = true; banner('서약이 이어졌다', '바닥에 보랏빛 글귀가 떠올랐다'); sfx('legend'); }
        repaint(R); return; }
      R.rite.lit = []; R.rite.smokeT = time + 2.5; repaint(R); sfx('heavy');
      lootFeed('서약이 어긋났다 — 화로가 모두 꺼졌다', '#a04040', 3600); lootFeed('망령 종자가 깨어났다', '#8ab8e0', 3600);
      queueSpawn('ghoul', { x: R.rite.x - 50, y: R.rite.y + 40 }); queueSpawn('ghoul', { x: R.rite.x + 50, y: R.rite.y + 40 });
      return;
    }
    if (it.a === 'c2enter') { const to = G.dun.rooms[R.doors.n]; if (to) goRoom(to, 's'); return; }
    if (it.a === 'c2read') {
      showTruthParchment({ no: '기사단 밀실', title: '바닥에 새겨진 주문', paras: SPELL, ac: '#b070ff', onClose: () => {
        const first = !TS().t2; TS().t2 = true; (G.truthRun || (G.truthRun = {})).t2 = true; persist(); lootFeed('진실 기록 — 저주의 주문', '#b070ff', 3600); if (first) sfx('legend'); TRUTH.talk((SPELL_SUN[G.cls] || SPELL_SUN.knight).split('|').map(t => ['me', t])); } }); // v3.20 주문 속 「해」에 주인공이 반응 — 대화처럼 멈춰 서서 F로 넘김
    }
  }
  function plaque(text, sub, x, y) { // 화면 좌표로 바꿔 정수 칸에 (글자가 번지지 않게)
    const sx = Math.round(x - CAMX), sy = Math.round(y - CAMY); // 화면 층(빛 위)에서 그림
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = '9px Galmuri9'; const w = (Math.ceil(Math.max(ctx.measureText(text).width, 40) / 2) * 2) + 16, X = sx - w / 2, Y = sy - 30, H = 26;
    ctx.fillStyle = '#0b0a0e'; ctx.fillRect(X - 2, Y, w + 4, H); ctx.fillRect(X, Y - 2, w, H + 4);
    ctx.fillStyle = '#d8c49a'; ctx.fillRect(X, Y, w, H); ctx.fillStyle = '#bba275'; ctx.fillRect(X, Y + H - 2, w, 2); ctx.fillRect(X + w - 2, Y, 2, H);
    ctx.font = '8px Galmuri7'; ctx.fillStyle = '#6a4a2a'; ctx.fillText(sub, sx, Y + 10);
    ctx.font = '9px Galmuri9'; ctx.fillStyle = '#2a1e18'; ctx.fillText(text, sx, Y + 21);
    ctx.restore();
  }
  function top2() {
    const R = curR2(), P = G.player; if (!R || !R.pil || !P) return;
    if (R.rite.done) return; // v2.71 화로 앞: 양피지 패찰 대신 통상 메시지 박스 (가장 가까운 화로 하나)
    let best = null, bd = 70; for (const s of SIGS) { const p = R.pil[s], d = Math.hypot(P.x - p.x, P.y - p.y - 10); if (d < bd) { bd = d; best = s; } }
    if (!best) return; const lit = R.rite.lit.includes(best), foe = G.enemies.some(e => !e.dead);
    TRUTH.peek({ title: SNAME[best] + '의 화로 · ' + SNAME[best] + '의 구절', text: '「' + phraseOf(R, best) + '」', icon: sigilURL(best, true),
      foot: lit ? '불이 붙어 있습니다' : foe ? '망령 종자를 먼저 쓰러뜨려야 합니다' : '<span class="key">F</span> 화로 켜기' });
  }
  const SEAL_T = 2.2;
  function ground2() { // v2.67 인장 벽 돌판이 바닥으로 가라앉음 (흔들림 · 먼지)
    const R = curR2(); if (!R || !R.sealW || R.sealW.anim == null || !R.sealW.slab) return;
    const k = Math.min(1, R.sealW.anim / SEAL_T), e = k * k * (3 - 2 * k), cx = half(DOOR.n.x), by = half(A.y0) + 1;
    const X = (cx - 16) * 2, Y = (by - 29) * 2, dy = Math.round(e * 29) * 2, jx = k < 0.95 ? (Math.floor(time * 30) % 2) * 2 - 1 : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(X, Y, 66, 58); ctx.clip();
    ctx.fillStyle = '#060508'; ctx.fillRect(X, Y, 66, 58); // 열린 틈 (어둠)
    ctx.drawImage(R.sealW.slab, X + jx, Y + dy);
    ctx.restore();
    on(ctx, () => { for (let i = 0; i < 16; i++) { const u = (i * 37 % 100) / 100, ph = (time * 1.6 + u * 3) % 1, x = cx - 17 + Math.round(u * 34) + Math.round(Math.sin(i + time * 2) * 2), y = by - 1 - Math.round(ph * 8);
      if (k < 0.98) px(x, y, ph < 0.4 ? '#8a8496' : ph < 0.7 ? '#5a5466' : '#3a3644'); } });
  }
  function tick2(dt) {
    const R = curR2(); if (!R) return;
    if (R.sealW && R.sealW.anim != null) { const a0 = R.sealW.anim; R.sealW.anim += dt; const a = R.sealW.anim;
      if (Math.floor(a0 / 0.35) !== Math.floor(a / 0.35) && a < SEAL_T - 0.3) { addShake(2); sfx('heavy', 0.5); }
      if (a >= SEAL_T) { R.sealW.anim = null; R.sealW.open = true; repaint(R); addShake(5); sfx('heavy'); banner('인장의 문이 열렸다', ''); } }
    if (R.type === 'chapel' && !R.greet) { R.greet = true; banner('기사단 밀실', '꺼진 화로 네 개가 바닥의 원을 둘러싸고 있다'); }
  }
  // 구절 패널 (아래 가운데) · TAB 지도의 「주운 구절」
  let PEL = null, PT = 0, OEL = null, OKEY = '';
  function showPhrase(s, ph) {
    if (!PEL) { PEL = document.createElement('div'); PEL.className = 'hud pf glass'; PEL.style.cssText = 'left:50%;transform:translateX(-50%);bottom:72px;display:none;align-items:center;gap:8px;padding:7px 12px 7px 9px;'; document.getElementById('ui').appendChild(PEL); }
    PEL.innerHTML = `<img src="${sigilURL(s, true)}" style="width:26px;height:26px;image-rendering:pixelated"><div><div style="font:8px Galmuri7;color:var(--quiet)">${SNAME[s]}의 구절</div><div style="font:13px Galmuri11;color:var(--gold-l);margin-top:2px">「${ph}」</div></div>`;
    PEL.style.display = 'flex'; PT = time + 3.6;
  }
  function hud2() {
    if (G && G.dun && mode === 'play') top2(); // v2.60 밀실 기둥 패찰은 빛 위에
    if (PEL && PT && time > PT) { PEL.style.display = 'none'; PT = 0; }
    const C = G && G.stage === 2 && chapel(), show = !!(C && mode === 'map' && C.oath.read.length);
    const key = show ? C.oath.read.join(',') : '';
    if (!OEL) { if (!show) return; OEL = document.createElement('div'); OEL.className = 'hud pf glass'; OEL.style.cssText = 'right:12px;top:66px;width:184px;padding:9px 10px;box-sizing:border-box;word-break:keep-all;'; /* v2.66 지도는 왼쪽으로 비켜 그림 (mapLayout) */ document.getElementById('ui').appendChild(OEL); }
    if (key === OKEY) return; OKEY = key; OEL.style.display = show ? 'block' : 'none'; if (!show) return;
    OEL.innerHTML = `<div style="font:bold 12px Galmuri11;color:var(--gold-l);margin-bottom:6px">주운 구절 <span style="font-weight:normal;font-size:9px;color:var(--quiet)">${C.oath.read.length} / 4</span></div>` +
      SIGS.map(s => { const on = C.oath.read.includes(s); return `<div style="display:flex;align-items:center;gap:6px;margin:3px 0;${on ? '' : 'opacity:.45'}"><img src="${sigilURL(s, on)}" style="width:26px;height:26px;image-rendering:pixelated"><div><div style="font:8px Galmuri7;color:var(--quiet)">${SNAME[s]}</div><div style="font:10px Galmuri9;color:${on ? 'var(--ink)' : 'var(--dim)'}">${on ? '「' + phraseOf(C, s) + '」' : '아직 찾지 못했습니다'}</div></div></div>`; }).join('');
  }
  const sealHidden = (R, d) => !!(R.sealW && R.sealW.dir === d && !R.sealW.open);

  return { prep2, floor, ground: ground2, top: top2, ents: ents2, lights: lights2, interact: interact2, act: act2, tick: tick2, hud: hud2, sealHidden };
  })();
