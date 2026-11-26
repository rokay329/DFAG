'use strict';
// 잿빛 왕관 토벌대 — 11e_truth3.js (v2.84) : 3장 진엔딩 「크루가쉬의 마지막 말」
// 피의 결투 원(3장 전투 방 하나) → 선조의 결투장(숨은 맵) → 세 선조와 결투 → 저주가 풀린 크루가쉬와 약속의 결투 → 금빛 빛기둥 → 진실 기록 t3
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

// ================================================================ 피의 결투 원 (3장 전투 방 바닥)
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
const circleOn = () => { const run = G.truthRun || {}; return !!(run.t1 && run.t2 && TRUTH.loop2() && !T3().freed); }; // v3.20 진실 1 · 2를 이번 판에서 봤을 때만 (예전 판 기록은 보지 않음)

// ---------------------------------------------------------------- ① 피의 결투 원 (3장 전투 방 하나)
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
  const L = [['zak', '끝내 우리를 꺾었군.'], ['gor', '이것이 얼마 만의 패배인가.'], ['utu', '음…!'], ['pl', ANC_RUMOR[G.cls] || ANC_RUMOR.knight], ['zak', '그렇다네.'], ['gor', '그래… 그럼 원하는 것이 무엇인가, 작은 자여.'], ...(ANC_ASK[G.cls] || ANC_ASK.knight).map(t => ['pl', t]), ['utu', '…그러고 보니, 그 아이의 냄새가 희미하구나.'], ['zak', '좋다. 그 바람, 들어주도록 하지.'], ['gor', '크루가쉬. 전사의 아들이여.'], /* v3.76 대사 수정 */ ['zak', '우리 피로 네 영혼을 씻는다.'], ['utu', '깨어나라. 결투는 네 것이다.']];
  SEQ = { k: 'appear3', t: 0, dur: 1.4, end: () => TRUTH.talk(L, () => { SEQ = { k: 'rise', t: 0, dur: 2.6, end: () => { t3.show = false; t3.freed = true; banner('선조의 피가 흩어졌다', '세 선조가 크루가쉬의 이름을 부르며 사라졌다'); sfx('legend'); } }; sfx('awaken'); }) };
  sfx('awaken');
}
const finalPos = k => { const [sx, sb] = STL(k); return [sx, sb + 30]; };

// ---------------------------------------------------------------- ⑦ ~ ⑩ 크루가쉬 (저주가 풀린 판)
function kgIntro(b) {
  const c = G.cls, L = [['krug', '…'], ['krug', '…머리가 맑다. 피 냄새가 가셨어.'], ['pl', KG_FREED[c] || KG_FREED.knight], ['krug', '선조의 결투장을 밟고 왔군, 작은 전사.'], ['krug', '그런 건가… 이제 방해는 없는 건가.'], ['krug', '좋다. 전사여. 이제 목숨을 건 결투를 하자.'], ['pl', REFUSE[c] || REFUSE.knight], ['pl', CROWN[c] || CROWN.knight], ['krug', '…그렇군. 왕관이 궁금한 거로군.'], ['krug', '내 도끼를 꺾어라. 그럼 왕관의 비밀을 말해 주지.']];
  // v3.76 대화가 끝나면 돌진 없이 바로 포효 + 「약속의 결투」
  TRUTH.talk(L, () => { const P = P_(), a = angTo(b, P); faceTo(b, a); bossRoar(b, '#ff4030');
    b.kg = { ph: 'fight', t: 0 }; b.dash = null; squeezeStart(b); b.stage = 3; b.hold = false; b.state = 'recover'; b.t = 1.0; b.cd = 0.8; b.huntT = 14; b.summonT = 999; b.armorMul = 1;
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
  if (D.t >= 0.6 && !D.talk) { D.talk = true;
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
      if (SEQ && SEQ.k === 'appear3') vis = Math.min(0.85, SEQ.t / 1.2); if (SEQ && SEQ.k === 'rise') fade = Math.min(1, SEQ.t / 2.2);
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
    if (b && b.kg && b.kg.ph === 'charge') drawBubble('!!', G.player.x, G.player.y - 38, 0); }
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
drawEnemyBody = function (e) { if (e.type === 'anc') { drawAncE(e); return; } if (e.hidden) return; return ORIG.drawEnemyBody(e); };
spawnKrugash = function () {
  const r = ORIG.spawnKrugash.apply(this, arguments);
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
