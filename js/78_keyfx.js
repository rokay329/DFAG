'use strict';
// 잿빛 왕관 원정대 — 78_keyfx.js : v3.82 중요 아이템 강조 — 장마다의 봉인 해제 아이템(정령의 불씨 · 기사단 인장 조각 · 전사의 엄니 · 붉은 보석)과 왕관 조각이 바닥에서 더 눈에 띄게
//  · 바닥: 아이템 색의 디더 원판 + 바깥으로 퍼지는 고리 두 겹 (번갈아)
//  · 위: 아이템 색 빛기둥 (왕관 조각에도 같은 기둥) · 머리 위에서 통통 튀는 아래 화살표 · 둘레를 도는 반짝임 네 개
//  · 빛: 주변을 더 넓게 밝힘 · TAB 지도의 작은 아이콘에는 쓰지 않음 (바닥에 놓인 것만)
//  · v3.82c 본체 크기는 원래대로 되돌림 (아래 두 배 그리기 함수는 남겨 둠) · 예전: 칸 단위 Scale2x(대각선을 계단 대신 매끈하게 잇는 도트 확대)로 키워 2px 칸 규칙을 지킴 · v3.82b 외곽선은 두꺼워지지 않게 한 칸 그대로
const KEYFX = (() => {
  const sn = v => Math.round(v / 2) * 2;
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const on = (x, y, lv) => lv * 16 > BAY[((y >> 1) & 3) * 4 + ((x >> 1) & 3)];
  // 바닥 원판 + 퍼지는 고리
  function under(x, y, rgb) { const bx = sn(x), by = sn(y);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.75 + 0.25 * Math.sin(time * 4);
    for (let yy = -6; yy <= 6; yy += 2) for (let xx = -16; xx <= 16; xx += 2) { const d = (xx / 16) ** 2 + (yy / 6) ** 2; if (d > 1 || !on(bx + xx, by + yy, (1 - d) * 0.9 * pulse)) continue; ctx.fillStyle = `rgba(${rgb},0.45)`; ctx.fillRect(bx + xx, by + yy, 2, 2); }
    for (const off of [0, 0.5]) { const ph = (time * 0.9 + off) % 1, rx = 8 + ph * 26, ry = rx * 0.42, n = Math.max(12, Math.round(rx * 1.6)), a = 0.85 * (1 - ph);
      ctx.fillStyle = `rgba(${rgb},${a})`; const seen = new Set();
      for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, px = sn(bx + Math.cos(t) * rx), py = sn(by + Math.sin(t) * ry), k = px * 4096 + py; if (seen.has(k)) continue; seen.add(k); ctx.fillRect(px, py, 2, 2); } }
    ctx.restore(); }
  // 빛기둥 (아래에서 위로 옅어짐)
  function pillar(x, y, rgb, h = 92) { const bx = sn(x), by = sn(y), pulse = 0.75 + Math.sin(time * 5) * 0.25;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let yy = 14; yy < h; yy += 2) { const k = yy / h; for (let c = -3; c < 3; c++) { const edge = c === -3 || c === 2; if (!on(bx + c * 2, by - yy, (1 - k) * (edge ? 0.35 : 0.85) * pulse)) continue; ctx.fillStyle = `rgba(${rgb},${(edge ? 0.4 : 0.75) * (1 - k * 0.6)})`; ctx.fillRect(bx + c * 2, by - yy, 2, 2); }
      if ((yy >> 1) % 4 === 0) { ctx.fillStyle = `rgba(255,255,255,${0.45 * (1 - k)})`; ctx.fillRect(bx - 1, by - yy, 2, 2); } }
    ctx.restore(); }
  // 머리 위 화살표 (아래를 가리킴 · 통통 튐) + 둘레 반짝임
  const ARROW = ['kkkkkkk', 'kWCCCCk', '.kCCCk.', '..kCk..', '...k...'];
  function over(x, top, col, hi) { const bx = sn(x), b = [0, -2, -4, -2][Math.floor(time * 6) % 4], Y = sn(top) - 14 + b, X = bx - 6;
    for (let j = 0; j < ARROW.length; j++) for (let i = 0; i < 7; i++) { const c = ARROW[j][i]; if (c === '.') continue; ctx.fillStyle = c === 'k' ? '#0b0a0e' : c === 'W' ? '#ffffff' : col; ctx.fillRect(X + i * 2, Y + j * 2, 2, 2); }
    for (let i = 0; i < 4; i++) { const a = time * 1.8 + i * Math.PI / 2, r = 14, sx = sn(x + Math.cos(a) * r), sy = sn(top + 8 + Math.sin(a) * r * 0.55), ph = (time * 2 + i * 0.25) % 1;
      ctx.fillStyle = ph < 0.2 ? '#ffffff' : hi; ctx.fillRect(sx, sy, 2, 2); if (ph < 0.3) { ctx.fillStyle = col; ctx.fillRect(sx - 2, sy, 2, 2); ctx.fillRect(sx + 2, sy, 2, 2); ctx.fillRect(sx, sy - 2, 2, 2); ctx.fillRect(sx, sy + 2, 2, 2); } } }
  // 칸 그림 두 배 (Scale2x): g = 칸 2차원 배열(문자 또는 색), '.' = 빈 칸
  function scale2x(g) { const H = g.length, W = g[0].length, at = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? '.' : g[y][x], o = [];
    for (let y = 0; y < H; y++) { const r0 = [], r1 = [];
      for (let x = 0; x < W; x++) { const B = at(x, y - 1), D = at(x - 1, y), E = at(x, y), F = at(x + 1, y), Hh = at(x, y + 1);
        r0.push(D === B && B !== F && D !== Hh ? D : E, B === F && B !== D && F !== Hh ? F : E); r1.push(D === Hh && D !== B && Hh !== F ? D : E, Hh === F && D !== Hh && B !== F ? F : E); }
      o.push(r0, r1); }
    return o; }
  // 외곽선은 한 칸 그대로: 바깥 외곽선(빈 칸과 맞닿은 K)을 떼고 → 안쪽만 Scale2x → 한 칸 외곽선을 다시 두름 (게임의 gOutline과 같은 4방향)
  function big2(g, K) { const H = g.length, W = g[0].length, at = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? '.' : g[y][x];
    const core = g.map((r, y) => r.map((c, x) => c === K && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) === '.') ? '.' : c));
    const s2 = scale2x(core), H2 = s2.length + 2, W2 = s2[0].length + 2, o = Array.from({ length: H2 }, (_, y) => Array.from({ length: W2 }, (_, x) => (s2[y - 1] && s2[y - 1][x - 1]) || '.'));
    const filled = (x, y) => x >= 0 && y >= 0 && x < W2 && y < H2 && o[y][x] !== '.' && o[y][x] !== '@';
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) if (o[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => filled(x + dx, y + dy))) o[y][x] = '@';
    return o.map(r => r.map(c => c === '@' ? K : c)); }
  function gridCanvas(g, col) { const [c, cx] = mkCanvas(g[0].length * 2, g.length * 2); for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) { const v = g[y][x]; if (v === '.') continue; cx.fillStyle = col ? col[v] : v; cx.fillRect(x * 2, y * 2, 2, 2); } return c; }
  const BIG = {};
  function bigKey(st, f) { const k = st + ':' + f; return BIG[k] || (BIG[k] = gridCanvas(big2(fromRows(SKEY_ART[st][f]), 'k'), SKEY_PAL[st])); }
  function smallKey(st, f) { const k = 'n' + st + ':' + f; return BIG[k] || (BIG[k] = gCanvas(fromRows(SKEY_ART[st][f]), SKEY_PAL[st])); }
  // 봉인 해제 아이템 (바닥) — 본체 두 배 · 빛기둥 · 바닥 고리 · 화살표
  function sealKey(l, x, y) { const K = SEAL[G.stage] || SEAL[1], st = G.stage in SKEY_ART ? G.stage : 1, fr = SKEY_ART[st], f = Math.floor(time * 6) % fr.length, spr = smallKey(st, f); // v3.82c 크기는 원래대로 (사용자 결정) — 효과만 유지
    under(l.x, l.y, K.rgb); pillar(l.x, l.y, K.rgb, 110 * Math.min(1, (l.t || 1) * 2));
    const top = (Math.round(y) & ~1) - spr.height + 2; ctx.drawImage(spr, (Math.round(l.x) - spr.width / 2) & ~1, top);
    over(l.x, top - 2, K.c, '#ffffff'); }
  // 왕관 조각 두 배 (+ 2장 맹세 띠) — 조각 그림(1px = 1칸)을 칸 배열로 읽어 띠를 얹고 Scale2x
  function bigShard(gi, band) { const k = 's' + gi + (band ? 'b' : ''); if (BIG[k]) return BIG[k];
    const C = CA.crownArt(), src = C.pieces[gi], w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data, pc = C.pc[gi];
    const g = []; for (let y = 0; y < h + 6; y++) { const r = []; for (let x = 0; x < w; x++) { if (y >= h) { r.push('.'); continue; } const i = (y * w + x) * 4; r.push(d[i + 3] > 0 ? '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('') : '.'); } g.push(r); }
    if (band) { const cx = Math.round(pc[0]), cy = Math.round(pc[1]) + 2, put = (x, y, c) => { if (y >= 0 && y < g.length && x >= 0 && x < w) g[y][x] = c; };
      put(cx - 3, cy, '#0b0a0e'); for (let i = -2; i <= 0; i++) put(cx + i, cy, '#dcc89e'); put(cx + 1, cy, '#f2e8cc'); put(cx + 2, cy, '#0b0a0e');
      put(cx + 2, cy + 1, '#dcc89e'); put(cx + 3, cy + 1, '#0b0a0e'); put(cx + 2, cy + 2, '#b02c24'); put(cx + 3, cy + 2, '#0b0a0e'); put(cx + 2, cy + 3, '#0b0a0e'); }
    const cv = gridCanvas(big2(g, '#0b0a0e')); return (BIG[k] = { cv, pcx: pc[0] * 4 + 2, pcy: pc[1] * 4 + 2 }); } // 외곽선 한 칸을 다시 두르며 1칸(2px)씩 커짐
  function drawBigShard(gi, band, cx, cy) { const b = bigShard(gi, band); ctx.drawImage(b.cv, (Math.round(cx - b.pcx)) & ~1, (Math.round(cy - b.pcy)) & ~1); }
  { const o = gearLights; gearLights = function (lights) { o.apply(this, arguments);
      try { if (G && G.loot) { const K = SEAL[G.stage] || SEAL[1]; for (const l of G.loot) if (l.type === 'sealkey' && l.life > 0) lights.push({ x: l.x, y: l.y - 10, r: 72, a: 0.8, c: K.rgb, ca: 0.3 }); } } catch (e) { console.error(e); } }; }
  return { under, pillar, over, sealKey, drawBigShard, scale2x };
})();
