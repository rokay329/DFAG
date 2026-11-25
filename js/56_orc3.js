'use strict';
// 잿빛 왕관 원정대 — 56_orc3.js : v3.26 3장 오크 부락 장애물 · 소품 정리
//  · 소품: 고기 건조대 · 가죽 건조대 · 고기 교수대 삭제
//  · 윗벽 장식: 가죽 · 가시 · 해골 삭제, 깃발만 — 크고 거친 짐승 가죽 깃발로 새로 그림 (55_out3.js 위쪽 말뚝 벽에서 그림)
//  · 바닥 자국(뼈 · 턱뼈 · 자갈 · 짚): 무슨 모양인지 읽히게 크게 다시 그림
//  · 바위: 이 부락만의 붉은 사암 바위 — 평평한 윗면 · 지층 · 세로 결 · 오크가 칠한 붉은 엄니 표식
const ORC3 = (() => {
  const hh = (x, y, s) => FP.hh(x, y, s);
  const on = () => G && G.stage === 3;
  // ---------------------------------------------------------------- 소품 삭제
  const DEL = new Set(['meatRack', 'hideRack', 'meatGallows']);
  // 한 방에 같은 소품은 하나만 (북문 양옆 해골 말뚝 한 쌍만 예외) · 보스 투기장은 그대로
  { const o = decorOrc; decorOrc = function (r, add, ...rest) { const used = {}, boss = r && r.type === 'boss';
      return o.call(this, r, (name, ...a) => { if (DEL.has(name)) return; if (!boss) { const n = used[name] || 0; if (n >= (name === 'skullPike' ? 2 : 1)) return; used[name] = n + 1; } return add(name, ...a); }, ...rest); }; }
  // 보물 방 석상 자리: 장애물 토템과 같은 그림
  let TOT = null;
  if (typeof drawSR === 'function') { const o = drawSR; drawSR = function (s) { if (!(on() && s.k === 'statue')) return o.apply(this, arguments);
      const c = TOT || (TOT = gCanvas(genTotem(), WOODPAL)), x = (s.x - c.width / 2) & ~1, y = (s.y + (s.foot || 0) - c.height + 8) & ~1;
      { const xa = x + 4, xb = x + c.width - 4; if (xb > xa) dshRect(ctx, xa, s.y + (s.foot || 0), Math.ceil((xb - xa) / 2) * 2, 2, 0.5); }
      if (s.flip) { ctx.save(); ctx.translate(x + c.width, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0); ctx.restore(); } else ctx.drawImage(c, x, y); }; }
  // ---------------------------------------------------------------- 쇠창살 우리 (조금 크게 · 바깥 외곽선이 또렷하게): 나무 지붕 · 굵은 모서리 기둥 · 쇠창살 · 자물쇠 · 안에 웅크린 해골
  if (typeof spProp === 'function' && typeof PEN_PAL !== 'undefined') delete PROP_MAPS.orcCage; // 예전 지도 그림을 지우고 새로
  if (typeof spProp === 'function' && typeof PEN_PAL !== 'undefined') spProp('orcCage', 22, 31, (x0, y) => { const W = 20, H = 30, x = x0 - 1; if (x0 === 0 || x0 === 21 || y === 30) return null; // 둘레 한 칸 비워 외곽선이 생기게
    if (y === 0) return x >= 8 && x <= 11 ? (x === 8 ? 'n' : 'g') : null; // 매다는 고리
    if (y <= 3) return x >= 0 && x <= W - 1 ? (y === 1 ? (x === 0 ? 'l' : 'h') : y === 2 ? 'l' : 'D') : null; // 나무 지붕
    if (y >= H - 3) return y === H - 3 ? (x === 0 ? 'l' : 'h') : y === H - 2 ? 'd' : 'D'; // 나무 받침
    if (x <= 1) return x === 0 ? 'h' : 'l'; if (x >= W - 2) return x === W - 1 ? 'D' : 'd'; // 모서리 기둥
    if (x >= 9 && x <= 10 && y >= 12 && y <= 15) return y === 15 ? 'O' : x === 9 ? 'y' : 'o'; // 쇠띠에 건 자물쇠
    if (y === 13 || y === 14) return y === 13 ? 'n' : 'G'; // 가운데 쇠띠
    if ((x - 2) % 3 === 1) return (x === 3 ? 'n' : 'g'); // 쇠창살
    // 안: 웅크린 해골 · 뼈
    if (y >= 18 && y <= 21 && x >= 5 && x <= 9) return y === 18 ? (x === 5 || x === 9 ? 'U' : 'p') : y === 19 ? (x === 6 || x === 8 ? 'K' : 'w') : y === 20 ? (x === 9 ? 'W' : 'w') : (x === 6 || x === 8 ? 'W' : 'U'); // 해골
    if (y >= 21 && y <= 25 && x >= 5 && x <= 12) return (y % 2 === 0 && x >= 6 && x <= 11) ? 'W' : (x === 8 ? 'w' : 'U');
    return y >= 22 ? 'U' : y <= 5 ? 'u' : 'X';
  }, { r: 14, foot: 1 }, PEN_PAL);
  // ---------------------------------------------------------------- 바닥 자국 (2px 칸) — 외곽선 k · 뼈 w/W/b · 돌 n/g/G · 짚 y/s/o
  if (window.SCN34) {
    Object.assign(SCN34.decPal, { b: '#7a705e', h: '#e8e0cc', m: '#3a2c20' });
    Object.assign(SCN34.dec, {
      bone1: [ // 긴 뼈 (양 끝 둥근 마디)
        '.kk........kk.',
        'khwk......kwWk',
        'kwwkkkkkkkkwWk',
        '.kwhhwwwwwwWk.',
        'kwwWWWWWWWWwWk',
        'kwWk......kWbk',
        '.kk........kk.'],
      bone2: [ // 갈비뼈 세 대
        '.kk..kk..kk.',
        'khk.khk.khk.',
        'kwk.kwk.kwk.',
        'kwWkkwWkkwWk',
        '.kwWk.kwWk.kWk',
        '..kwk..kwk..k.',
        '...kk...kk....'].map(r => r.padEnd(14, '.').slice(0, 14)),
      jaw: [ // 엄니 달린 아래턱 (위에서 본 U자)
        'kk........kk',
        'khk......khk',
        'kwk......kwk',
        'kwWk....kwWk',
        'kwwWkkkkkwWk',
        '.kwwhwhwwWk.',
        '..kWkWkWkk..',
        '...kkkkkk...'],
      peb1: [ // 자갈 셋 (윗면 빛 · 밑 그늘)
        '..kkk.......',
        '.knngk..kk..',
        'kngggGk.kngk',
        'kgggGGk.kgGk',
        '.kGGGk.kkkk.',
        '..kkk.kngk..',
        '......kGGk..',
        '.......kk...'],
      peb2: [ // 납작한 돌 하나 + 조각
        '...kkkk....',
        '.kknnggk...',
        'kngggggGk..',
        'kgggggGGk.k',
        '.kGGGGGk.kgk',
        '..kkkkk...k.'].map(r => r.padEnd(12, '.').slice(0, 12)),
      straw1: [ // 마른 짚 한 줌 (엇갈린 줄기)
        'y.....s...',
        '.y...s..y.',
        '..s.o..y..',
        '..yso.s...',
        '.syyoss...',
        's.oyys.o..',
        '..o..y..s.',
        '.o....y...'],
      straw2: [ // 흩어진 짚 줄기
        'yy........',
        '..ss....y.',
        '....oo.s..',
        '.y....s...',
        '..ss.o..yy',
        '....o.....'] });
  }
  // ---------------------------------------------------------------- 대각선으로 반 부러진 뼈 — 'bone1' 자리에 긴 뼈와 반반 섞임
  if (window.SCN34) { const N = 20, g = Array.from({ length: N }, () => Array(N).fill('.')), set = (x, y, c) => { x += 2; y += 2; if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; };
    const seg = (a, b, ox) => { for (let i = a; i <= b; i++) { set(i + ox, i, 'w'); set(i + 1 + ox, i, 'w'); set(i + ox, i + 1, 'W'); } };
    seg(2, 5, 0); seg(9, 11, 3); // 두 토막 — 아래 토막은 한 칸 비껴 떨어짐 (가운데 6~8 칸은 부러져 빔)
    set(1, 1, 'h'); set(2, 1, 'w'); set(1, 2, 'w'); set(0, 1, 'w'); set(1, 0, 'h'); // 위 마디
    set(15, 12, 'W'); set(16, 12, 'w'); set(15, 13, 'W'); set(14, 13, 'W'); set(16, 11, 'w'); // 아래 마디
    set(6, 6, 'h'); set(7, 6, 'w'); set(6, 7, 'W'); // 위 토막 부러진 끝 (뾰족한 조각)
    set(12, 8, 'h'); set(11, 9, 'b'); // 아래 토막 부러진 끝
    const out = g.map(r => r.slice()); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const c = (g[y + dy] || [])[x + dx]; return c && c !== '.'; })) out[y][x] = 'k';
    const BROKEN = out.map(r => r.join('')), LONG = SCN34.dec.bone1;
    Object.defineProperty(SCN34.dec, 'bone1', { configurable: true, get: () => (Math.random() < 0.5 ? BROKEN : LONG) }); }
  // ---------------------------------------------------------------- 바위: 붉은 사암 — 평평한 윗면(지층 고리) · 세로 결 옆면 · 가로 지층 · 왼쪽 위 빛 · 붉은 엄니 표식
  const TOP = ['#c8946a', '#b07c52', '#946240'], SIDE = ['#a8704a', '#8a5636', '#6c3e26', '#56301e', '#422417', '#2e1810'];
  // 바위 자리 구조물 (v3.26): 큰 것 = 부서진 토템(밑동만 남은 얼굴 기둥 + 옆에 떨어진 윗토막) · 작은 것 = 나무 밑동(나이테 · 뿌리)
  const WDC = { hi: '#e0b888', cut: '#c89a68', cut2: '#a87848', h: '#9a6a40', l: '#7a5030', d: '#553620', D: '#33200f', r: '#9a2a24', R: '#5e1612', w: '#e0d6c4', W: '#a89a84', K: '#0b0806' };
  function sandRock(wPx, hPx, seed) { const big = wPx > 40;
    if (big && window.SCN34 && SCN34.totem) { // 장애물 토템과 같은 그림을 반으로 부러뜨림: 아래 토막은 서 있고, 뿔 해골 달린 윗토막은 옆에 쓰러져 누움
      const T = SCN34.totem[0].map(r => [...r]), TW = T[0].length, TH = T.length, cut = 12, keepH = TH - cut, topH = cut + 1;
      const w = TW + 2 + topH, h = Math.max(keepH, TW) + 1, S = FP.Spr(w, h), put = (x, y, ch) => { const c = ch === '.' ? null : WOODPAL[ch]; if (c) S.set(x, y, c); };
      const by0 = h - keepH; // 서 있는 아래 토막 (윗면은 들쭉날쭉 쪼개짐)
      for (let x = 0; x < TW; x++) { const jag = (hh(x, 1, seed) * 3) | 0; for (let r = cut + jag; r < TH; r++) { let ch = T[r][x]; if (ch === '.') continue; if (r === cut + jag && ch !== 'k') { ch = x < TW / 2 ? 's' : 'o'; S.set(x, by0 + (r - cut) - 1, '#0b0806'); } put(x, by0 + (r - cut), ch); } }
      const fx0 = TW + 2, fy0 = h - TW; // 쓰러진 윗토막: 뿔이 오른쪽으로 가게 90도 눕힘
      for (let r = 0; r <= cut; r++) for (let c = 0; c < TW; c++) { let ch = T[r][c]; if (ch === '.') continue; if (r === cut && ch !== 'k') { ch = 's'; S.set(fx0 - 1, fy0 + c, '#0b0806'); } put(fx0 + (cut - r), fy0 + c, ch); }
      for (const [x, y] of [[TW, h - 2], [TW + 1, h - 1]]) if (!S.has(x, y)) S.set(x, y, '#0b0806'); // 튄 조각 자리
      FP.shadow(S, 2, 2, 2); return FP.render(S, false); } // 토템 그림에 이미 1칸 외곽선이 있어 두 번 두르지 않음
    // 나무 밑동: 둥근 윗면 나이테 · 껍질 옆면 · 퍼진 뿌리
    const w = 17, h = 15, S = FP.Spr(w, h), cx = 8.5, tcy = 4, trx = 5.5, tRy = 2.6, bot = h - 3;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = x + 0.5 - cx, inTop = (X / trx) ** 2 + ((y + 0.5 - tcy) / tRy) ** 2 <= 1, inBody = y + 0.5 >= tcy && y <= bot && Math.abs(X) <= trx + (y > bot - 2 ? (y - bot + 2) * 0.8 : 0);
      if (!inTop && !inBody) continue; let c;
      if (inTop) { const rr = Math.sqrt((X / trx) ** 2 + ((y + 0.5 - tcy) / tRy) ** 2); c = rr > 0.82 ? WDC.l : (Math.round(rr * 3.5) % 2 ? WDC.cut2 : WDC.cut); if (rr < 0.2) c = WDC.cut2; if (rr > 0.82 && X < 0 && y + 0.5 < tcy) c = WDC.h; }
      else { const u = (X + trx) / (2 * trx); c = u < 0.2 ? WDC.h : u < 0.55 ? WDC.l : u < 0.85 ? WDC.d : WDC.D; if (hh(x, (y / 3) | 0, seed) < 0.18) c = WDC.D; } // 세로 껍질 결
      S.set(x, y, c); }
    // 뿌리: 좌우로 뻗은 굵은 뿌리 둘 + 가는 뿌리
    for (const [sx, dir, L] of [[2, -1, 3], [14, 1, 3], [6, -1, 2]]) for (let k = 0; k < L; k++) { const x = sx + dir * k, y = bot + 1 + (k > 1 ? 1 : 0); if (x >= 0 && x < w) { S.set(x, y, k === 0 ? WDC.l : WDC.d); } }
    // 쪼개진 금 하나
    S.set(Math.round(cx + 1), tcy, WDC.D); S.set(Math.round(cx + 2), tcy + 1, WDC.D);
    FP.shadow(S, 2, 2, 2); return FP.render(S); }
  if (typeof CAMP3 !== 'undefined') { const o = CAMP3.rock; CAMP3.rock = function (wPx, hPx, kind, seed) { if (kind === 'red' && on()) return sandRock(wPx, hPx, seed || 1); return o.apply(this, arguments); }; }
  // ---------------------------------------------------------------- 윗벽 깃발: 가로 막대에 매단 거친 짐승 가죽 — 털 테두리 · 찢어진 밑단 세 갈래 · 붉게 칠한 엄니 해골 · 매달린 뼈 구슬
  const BAN = {};
  function banner(seed, red) { const key = seed + (red ? 'r' : ''); if (BAN[key]) return BAN[key]; const Wc = 20, Hc = 36, S = FP.Spr(Wc, Hc, 2);
    const HI = red ? ['#c0402c', '#a02a1c', '#821c12', '#62120c', '#420a06'] : ['#c49a68', '#a8804e', '#8a6438', '#6a4a2a', '#4a3220'], FUR = ['#6a523a', '#4a3826'], RD = ['#a82014', '#7a120c', '#520a06'], BN = ['#e0d6c4', '#a89a84'], WD = ['#9a6a40', '#6a4626', '#3a2414'], RP = ['#8a7448', '#5a4a2c'];
    const L0 = 3, R0 = 16, top = 2, bot = 27;
    // 가로 막대 (양 끝 깎은 통나무 · 밧줄 매듭)
    for (let x = 0; x < Wc; x++) { S.set(x, 0, x === 0 || x === Wc - 1 ? WD[1] : WD[0]); S.set(x, 1, WD[2]); }
    for (const x of [L0, R0]) { S.set(x, 0, RP[0]); S.set(x, 1, RP[1]); S.set(x + 1, 1, RP[0]); }
    // 가죽: 가장자리가 들쭉날쭉 · 밑으로 갈수록 넓어짐 · 밑단 세 갈래로 찢김
    const lx = y => L0 - Math.round((y - top) * 0.08) + (hh(y, 1, seed) < 0.25 ? 1 : 0), rx = y => R0 + Math.round((y - top) * 0.08) - (hh(y, 2, seed) < 0.25 ? 1 : 0);
    // 밑단: 찢어진 천 — 길이가 제각각인 가닥 · 구멍 · 들쭉날쭉한 끝
    const tailLen = u => { const k = Math.floor(u * 7); return Math.round(hh(k, 3, seed) ** 0.7 * 8) - (hh(k, 4, seed) < 0.3 ? 3 : 0); };
    const tails = [[0.2, 4 + (hh(1, 3, seed) * 3 | 0)], [0.55, 6 + (hh(2, 3, seed) * 3 | 0)], [0.88, 3 + (hh(3, 3, seed) * 3 | 0)]];
    for (let y = top; y < Hc; y++) { const a = lx(Math.min(y, bot)), b = rx(Math.min(y, bot));
      for (let x = a; x <= b; x++) { const u = (x - a) / Math.max(1, b - a), sl = (y - bot) * 0.03 * (hh(y > bot ? 1 : 0, 9, seed) < 0.5 ? 1 : -1), u2 = Math.min(0.999, Math.max(0, u + sl)), L = tailLen(u2), kk = Math.floor(u2 * 7), gap = kk !== Math.floor((u2 + 1 / Math.max(1, b - a)) * 7) && y > bot - 4 + (hh(kk, 8, seed) * 4 | 0) && hh(kk, 7, seed) < 0.65; // 비스듬히 찢긴 틈 · 길이 제각각
        if (y > bot - 4 + Math.min(0, L)) { if (y > bot + L || gap) continue; if (y > bot + L - 2 && hh(x, y, seed + 5) < 0.45) continue; } // 가닥 끝은 해져서 듬성듬성
        if (y > top + 6 && y < bot - 5 && hh(x >> 1, y >> 1, seed + 21) < 0.025) continue; // 구멍
        let i = u < 0.12 ? 0 : u < 0.4 ? 1 : u < 0.75 ? 2 : 3; if (y === top) i = 3; if (((x + (y >> 2)) % 6 === 0) && y > top + 1) i = Math.min(4, i + 1); // 처진 주름
        if (hh(x, y, seed + 9) < 0.06) i = Math.min(4, i + 1); if (y > bot - 2) i = Math.min(4, i + 1);
        S.set(x, y, HI[i]); }
      // 테두리: 가죽은 털, 붉은 천은 해진 실밥
      if (y < bot && y > top) { S.set(a, y, red ? HI[3] : FUR[y % 3 === 0 ? 1 : 0]); S.set(b, y, red ? HI[4] : FUR[1]); if (hh(y, 5, seed) < (red ? 0.2 : 0.4)) S.set(a - 1, y, red ? HI[2] : FUR[1]); if (hh(y, 6, seed) < (red ? 0.2 : 0.4)) S.set(b + 1, y, red ? HI[3] : FUR[1]); } }
    // 붉게 칠한 엄니 해골 (거친 붓질)
    const SK = ['..rrrrrrr..', '.rrrrrrrrr.', 'rrr..r..rrr', 'rrr..r..rrr', 'rrrrr.rrrrr', '.rrr...rrr.', '..r.r.r.r..', 'R.........R', 'RR.......RR', '.RR.....RR.', '..RR...RR..'];
    const ox = 5, oy = 8; SK.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return; if (ch === 'r' && hh(i, j, seed + 3) < 0.12) return; S.set(ox + i, oy + j, red ? (ch === 'r' ? ((i + j) % 5 === 0 ? '#a89a84' : '#d8cfbc') : '#2a1410') : ch === 'r' ? RD[(i + j) % 5 === 0 ? 1 : 0] : RD[1]); }));
    for (let k = 0; k < 3; k++) { const x = ox + 2 + k * 3, L = 1 + (hh(k, 7, seed) * 3 | 0); for (let j = 0; j < L; j++) S.set(x, oy + 11 + j, red ? (j === L - 1 ? '#8a8070' : '#c8c0b0') : RD[j === L - 1 ? 2 : 1]); } // 흘러내린 물감
    // 밑단 끝에 매단 뼈 구슬 · 송곳니
    for (const [c] of tails) { const x = Math.round(lx(bot) + c * (rx(bot) - lx(bot))), L = Math.max(0, tailLen(c)), y = bot + L; if (y + 3 >= Hc) continue; S.set(x, y + 1, RP[1]); S.set(x, y + 2, BN[0]); S.set(x, y + 3, BN[1]); }
    // 옆에 늘어진 끈 + 깃털
    S.set(R0 + 2, 2, RP[0]); S.set(R0 + 2, 3, RP[1]); S.set(R0 + 2, 4, RP[0]); S.set(R0 + 2, 5, '#c8c0b0'); S.set(R0 + 2, 6, '#8a2a20'); S.set(R0 + 3, 6, '#c8c0b0');
    return (BAN[key] = FP.render(S)); }
  // ---------------------------------------------------------------- 나무 벽 횃불 제거 (3장 부락 방 — 바깥 디자인을 쓰는 방만)
  { const o = enterRoom; enterRoom = function () { const r = o.apply(this, arguments); if (on() && typeof OUT3 !== 'undefined' && OUT3.wide && OUT3.wide()) TORCHES = []; return r; }; }
  return { banner, sandRock, DEL };
})();
