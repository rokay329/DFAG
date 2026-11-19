'use strict';
// 잿빛 왕관 토벌대 — 02_weapons.js : 도트 변형, 잿불 외형, 무기 텍스처·등급 외형, 칸 단위 무기, 무기 도감(직업별 무기), 커먼 무기, RGB? 등급
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ v1.05 도트 규칙을 지키는 변형
  // 매끈한 회전·비정수 배율 대신, 스프라이트를 칸(2px) 단위로 다시 뽑아 칸이 옮겨 가게 한다. 외곽선은 다시 두른다. 위치는 2px 격자에 맞춘다.
  const snap2 = v => Math.round(v / 2) * 2;
  const PXCELL = new WeakMap();
  function pxCells(cv, cs, fresh) { // 캔버스 → 칸 색 배열 (투명 칸과 맞닿은 어두운 칸은 외곽선 표시)
    let o = !fresh && PXCELL.get(cv); if (o && o.cs === cs) return o;
    const W = Math.max(1, Math.round(cv.width / cs)), H = Math.max(1, Math.round(cv.height / cs)), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, col = new Array(W * H), dark = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = ((Math.min(cv.height - 1, y * cs + (cs >> 1))) * cv.width + Math.min(cv.width - 1, x * cs + (cs >> 1))) * 4, a = d[i + 3];
      if (a > 20) { col[y * W + x] = `rgba(${d[i]},${d[i + 1]},${d[i + 2]},${(a / 255).toFixed(3)})`; dark[y * W + x] = d[i] + d[i + 1] + d[i + 2] < 70 ? 1 : 0; } else col[y * W + x] = null; }
    const out = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!col[i] || !dark[i]) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H || !col[Y * W + X]) { out[i] = 1; break; } } }
    o = { W, H, cs, col, out, cache: new Map() }; if (!fresh) PXCELL.set(cv, o); return o;
  }
  // ang 라디안(1/80바퀴 단위로 끊음), sx·sy 배율(칸 수로 반올림), flip 좌우 반전, 기준점 pvx·pvy(px, 기본 아래 가운데)
  // 반환 {c, ax, ay}: (x-ax, y-ay)에 그리면 기준점이 (x,y)
  function pxXform(cv, cs, ang, sx, sy, flip, o = {}) {
    const fresh = o.fresh, oc = o.oc || '#0b0a0e', P = pxCells(cv, cs, fresh), q = Math.round(ang / (Math.PI / 40)), A = q * Math.PI / 40;
    const Wd = Math.max(1, Math.round(P.W * sx)), Hd = Math.max(1, Math.round(P.H * sy)), pvx = o.pvx == null ? P.W * cs / 2 : o.pvx, pvy = o.pvy == null ? P.H * cs : o.pvy;
    const key = q + '|' + Wd + '|' + Hd + '|' + (flip ? 1 : 0) + '|' + oc + '|' + pvx + ',' + pvy;
    if (!fresh && P.cache.has(key)) return P.cache.get(key);
    const kx = Wd / P.W, ky = Hd / P.H, ca = Math.cos(A), sa = Math.sin(A), px = pvx / cs, py = pvy / cs;
    // 원본 네 귀퉁이를 옮겨 결과 범위를 구함
    let u0 = 1e9, v0 = 1e9, u1 = -1e9, v1 = -1e9;
    for (const [X, Y] of [[-px, -py], [P.W - px, -py], [-px, P.H - py], [P.W - px, P.H - py]]) { const x = (flip ? -X : X) * kx, y = Y * ky, u = x * ca - y * sa, v = x * sa + y * ca; u0 = Math.min(u0, u); v0 = Math.min(v0, v); u1 = Math.max(u1, u); v1 = Math.max(v1, v); }
    u0 = Math.floor(u0) - 2; v0 = Math.floor(v0) - 2; u1 = Math.ceil(u1) + 2; v1 = Math.ceil(v1) + 2;
    const GW = u1 - u0 + 1, GH = v1 - v0 + 1, grid = new Int32Array(GW * GH).fill(-1);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1;
    for (let gy = 1; gy < GH - 1; gy++) for (let gx = 1; gx < GW - 1; gx++) {
      const cx = u0 + gx + 0.5, cy = v0 + gy + 0.5; let x = (cx * ca + cy * sa) / kx, y = (-cx * sa + cy * ca) / ky; if (flip) x = -x;
      const i = Math.floor(x + px), j = Math.floor(y + py); if (i < 0 || j < 0 || i >= P.W || j >= P.H) continue;
      const k = j * P.W + i; if (!P.col[k] || P.out[k]) continue; grid[gy * GW + gx] = k;
      if (gx < bx0) bx0 = gx; if (gy < by0) by0 = gy; if (gx > bx1) bx1 = gx; if (gy > by1) by1 = gy;
    }
    if (bx1 < 0) return { c: mkCanvas(2, 2)[0], ax: 0, ay: 0 };
    bx0--; by0--; bx1++; by1++;
    const [c, g] = mkCanvas((bx1 - bx0 + 1) * cs, (by1 - by0 + 1) * cs);
    g.fillStyle = oc;
    for (let gy = by0; gy <= by1; gy++) for (let gx = bx0; gx <= bx1; gx++) { if (grid[gy * GW + gx] >= 0) continue;
      if (grid[gy * GW + gx + 1] >= 0 || grid[gy * GW + gx - 1] >= 0 || grid[(gy + 1) * GW + gx] >= 0 || grid[(gy - 1) * GW + gx] >= 0) g.fillRect((gx - bx0) * cs, (gy - by0) * cs, cs, cs); }
    for (let gy = by0; gy <= by1; gy++) for (let gx = bx0; gx <= bx1; gx++) { const k = grid[gy * GW + gx]; if (k < 0) continue; g.fillStyle = P.col[k]; g.fillRect((gx - bx0) * cs, (gy - by0) * cs, cs, cs); }
    const r = { c, ax: -(u0 + bx0) * cs, ay: -(v0 + by0) * cs };
    if (!fresh) { if (P.cache.size > 96) P.cache.delete(P.cache.keys().next().value); P.cache.set(key, r); }
    return r;
  }
  // v2.50 도트 오오라 캐시: 스프라이트 그림(회전·늘이기 결과 포함)마다 색·단계·순환 스텝별로 한 번만 만든다 — 매 프레임 픽셀 읽기 없음
  const PXA = new WeakMap(), PXA_T = {};
  function pxAuraCv(cv, pa) {
    const [col, lv] = pa, st = Math.floor(time * 6) % 4, ph = Math.floor(time * 4) % 2, key = col + lv + '|' + st + '|' + (lv > 1 ? ph : 0);
    let m = PXA.get(cv); if (!m) { m = new Map(); PXA.set(cv, m); } const hit = m.get(key); if (hit) return hit;
    const P = lv > 2 ? 6 : lv > 1 ? 4 : 2, W = cv.width + P * 2, H = cv.height + P * 2;
    const tmp = n => { const t = PXA_T[n]; if (t && t[0].width >= W && t[0].height >= H) return t; return (PXA_T[n] = mkCanvas(Math.max(W, t ? t[0].width : 0), Math.max(H, t ? t[0].height : 0))); };
    const [mc, mg] = tmp('m'), [rc, rg] = tmp('r'), [c, g] = mkCanvas(W, H);
    const clr = q => { q.setTransform(1, 0, 0, 1, 0, 0); q.globalAlpha = 1; q.globalCompositeOperation = 'source-over'; q.clearRect(0, 0, q.canvas.width, q.canvas.height); };
    clr(mg); mg.drawImage(cv, P, P); mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#fff'; mg.fillRect(0, 0, W, H); mg.globalCompositeOperation = 'source-over';
    const ring = (dd, inner, color, dith) => { clr(rg); const sh = (r, op) => { rg.globalCompositeOperation = op; for (let dy = -r; dy <= r; dy += 2) for (let dx = -r; dx <= r; dx += 2) if (Math.abs(dx) + Math.abs(dy) <= r + (r > 2 ? 2 : 0)) rg.drawImage(mc, dx, dy); };
      sh(dd, 'source-over'); if (inner >= 0) sh(inner, 'destination-out');
      if (dith) { rg.globalCompositeOperation = 'destination-in'; rg.fillStyle = rg.createPattern(dith, 'repeat'); rg.fillRect(0, 0, W, H); }
      rg.globalCompositeOperation = 'source-in'; rg.fillStyle = color; rg.fillRect(0, 0, W, H); g.drawImage(rc, 0, 0); };
    if (lv > 2) ring(6, 4, auraShade(col, -0.45), auraDith(ph, true));
    if (lv > 1) ring(4, 2, auraShade(col, -0.25), auraDith(ph));
    ring(2, 0, auraShade(col, [0, 0.25, 0.5, 0.25][st]), null);
    g.globalCompositeOperation = 'destination-out'; g.drawImage(cv, P, P); g.globalCompositeOperation = 'source-over'; // 몸 자리는 비움 (반투명하게 그릴 때 비침 방지)
    const r = { c, p: P }; m.set(key, r); return r;
  }
  function drawSprite(map, pal, scale, x, y, flip, o = {}) { // v1.05: 기울이기·늘이기는 칸 단위 (pxXform), 위치는 2px 격자
    if (STEALTH_DRAW && PAL[pal + 'Ghost']) pal = pal + 'Ghost'; // v2.05 모습을 감춤 (팔레트 교체)
    const ash = !STEALTH_DRAW && ASH_DRAW && PAL[pal]; if (ash) pal = ashPalKey(pal); // v1.99 잿불 외형
    const s = sprite(map, pal, scale, o.white), X = snap2(x), Y = snap2(y), rot = o.rot || 0, sx = o.sx || 1, sy = o.sy || 1;
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    const W = s.width / scale, H = s.height / scale, au = ash && !o.white, pa = !o.white && o.pa; // v2.50 pa: 도트 오오라 [색, 단계]
    if (Math.round(rot / (Math.PI / 40)) === 0 && Math.round(W * sx) === W && Math.round(H * sy) === H) {
      if (flip) { ctx.translate(X, Y); ctx.scale(-1, 1); if (pa) { const A = pxAuraCv(s, pa); ctx.drawImage(A.c, -Math.floor(s.width / 2) - A.p, -s.height - A.p); } if (au) { const A = auraOf(s, scale); ctx.drawImage(A.c, -Math.floor(s.width / 2) - A.p, -s.height - A.p); } ctx.drawImage(s, -Math.floor(s.width / 2), -s.height); }
      else { if (pa) { const A = pxAuraCv(s, pa); ctx.drawImage(A.c, X - Math.floor(s.width / 2) - A.p, Y - s.height - A.p); } if (au) { const A = auraOf(s, scale); ctx.drawImage(A.c, X - Math.floor(s.width / 2) - A.p, Y - s.height - A.p); } ctx.drawImage(s, X - Math.floor(s.width / 2), Y - s.height); }
    } else { const t = pxXform(s, scale, rot, sx, sy, flip, { pvx: Math.floor(s.width / 2) }); if (pa) { const A = pxAuraCv(t.c, pa); ctx.drawImage(A.c, X - t.ax - A.p, Y - t.ay - A.p); } if (au) { const A = auraOf(t.c, scale); ctx.drawImage(A.c, X - t.ax - A.p, Y - t.ay - A.p); } ctx.drawImage(t.c, X - t.ax, Y - t.ay); }
    ctx.restore();
  }
  // ================================================================ v1.99 잿불 외형 (잿불 3 돌파 보상 · 지금은 테스트로 늘 선택 가능)
  // 몸·무기는 팔레트를 잿빛 단계로 바꾸고(팔레트마다 밝기 정규화), 눈(e)은 붉은 안광. 몸·무기 둘레엔 붉은 기운(칸 단위, 4프레임)
  const ASH_SKIN_TEST = true; // 테스트: 승천 안 깨도 고를 수 있음. 정식은 SAVE.asc.unl에 3이 있을 때
  const skinOpen = () => ASH_SKIN_TEST || (SAVE.asc && SAVE.asc.unl.some(v => v >= 3));
  let ASH_DRAW = false, STEALTH_DRAW = false;
  const ASH_RAMP = ['#141210', '#26231f', '#3a3632', '#504c46', '#6a655e', '#88827a', '#a8a298', '#ccc6ba'];
  const ASH_EYE = '#ff2a1a';
  const ashRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lumOf = h => { const [r, g, b] = ashRgb(h); return 0.299 * r + 0.587 * g + 0.114 * b; };
  function ashPalOf(p) {
    const ks = Object.keys(p).filter(k => k !== 'k' && k !== 'e' && /^#[0-9a-f]{6}$/i.test(p[k])), Ls = ks.map(k => lumOf(p[k]));
    const lo = Math.min(...Ls, 255), hi = Math.max(...Ls, 0), o = {};
    for (const k in p) {
      if (k === 'e') { o[k] = ASH_EYE; continue; }
      if (!/^#[0-9a-f]{6}$/i.test(p[k])) { o[k] = p[k]; continue; }
      if (k === 'k') { o[k] = '#0c0b0a'; continue; }
      const t = hi > lo ? (lumOf(p[k]) - lo) / (hi - lo) : 0.5; o[k] = ASH_RAMP[Math.min(7, Math.floor((0.22 + 0.78 * Math.pow(Math.max(0, t), 0.6)) * 7.999))];
    }
    return o;
  }
  function ashPalKey(pal) { const k = pal + '__ash'; if (!PAL[k]) PAL[k] = ashPalOf(PAL[pal]); return k; }
  const ASH_BLADE = new WeakMap();
  function ashBlade(b) {
    let a = ASH_BLADE.get(b); if (a) return a;
    if (b.cells) a = Object.assign({}, b, { pal: ashPalOf(b.pal), rot: {} });
    else if (b.c) { const [c, g] = mkCanvas(b.c.width, b.c.height); g.drawImage(b.c, 0, 0); const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
      let lo = 255, hi = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; if (L > 20) { lo = Math.min(lo, L); hi = Math.max(hi, L); } }
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { const L = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; const [r, g2, b2] = L <= 20 ? [12, 11, 10] : ashRgb(ASH_RAMP[Math.min(7, Math.floor((0.22 + 0.78 * Math.max(0, (L - lo) / Math.max(1, hi - lo))) * 7.999))]); d[i] = r; d[i + 1] = g2; d[i + 2] = b2; }
      g.putImageData(im, 0, 0); a = Object.assign({}, b, { c }); }
    else a = b;
    ASH_BLADE.set(b, a); return a;
  }
  // 붉은 기운: 그림의 칸 둘레(듬성듬성) + 머리 위 불길 혀 + 불티 + 눈 뒤 안광 꼬리. 그림·프레임마다 한 번만 만든다
  const AURA = new WeakMap(), AURA_PAD = 6;
  function auraOf(cv, cs) {
    const f = Math.floor(time * 7) % 4; let arr = AURA.get(cv); if (!arr) { arr = []; AURA.set(cv, arr); }
    if (arr[f]) return arr[f];
    const w = cv.width, h = cv.height, gw = Math.ceil(w / cs), gh = Math.ceil(h / cs), d = cv.getContext('2d').getImageData(0, 0, w, h).data;
    const occ = new Uint8Array(gw * gh), eyes = [];
    for (let b = 0; b < gh; b++) for (let a = 0; a < gw; a++) { const x = Math.min(w - 1, a * cs + (cs >> 1)), y = Math.min(h - 1, b * cs + (cs >> 1)), i = (y * w + x) * 4; if (d[i + 3] > 40) { occ[b * gw + a] = 1; if (d[i] === 255 && d[i + 1] === 42 && d[i + 2] === 26) eyes.push([a, b]); } }
    const P = AURA_PAD, [c, g] = mkCanvas((gw + P * 2) * cs, (gh + P * 2) * cs);
    const has = (a, b) => a >= 0 && b >= 0 && a < gw && b < gh && occ[b * gw + a];
    const put = (a, b, col) => { if (has(a, b)) return; g.fillStyle = col; g.fillRect((a + P) * cs, (b + P) * cs, cs, cs); };
    let top = gh, bot = 0, x0 = gw, x1 = 0;
    for (let b = 0; b < gh; b++) for (let a = 0; a < gw; a++) if (occ[b * gw + a]) { top = Math.min(top, b); bot = Math.max(bot, b); x0 = Math.min(x0, a); x1 = Math.max(x1, a); }
    if (top > bot) return (arr[f] = { c, p: P * cs });
    const ph = f * 1.9, colTop = {};
    for (let b = 0; b < gh; b++) for (let a = 0; a < gw; a++) {
      if (occ[b * gw + a]) { if (colTop[a] == null) colTop[a] = b; continue; }
      let near = false; for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) if (has(a + dx, b + dy)) { near = true; break; }
      if (!near) continue;
      const hh = (b - top) / Math.max(1, bot - top); if (hh > 0.8) continue;
      const n = Math.sin(a * 1.3 + ph * 1.4) + Math.cos(b * 1.9 + ph);
      if (n > 0.9) put(a, b, '#a01218'); else if (n > 0.1 && (a + b + f) % 2 === 0) put(a, b, '#5a0a10');
    }
    // 바깥 가장자리 칸(왼·오른쪽 끝)도 둘레에 들어가게: 패딩 영역 처리
    for (let b = top - 1; b <= bot; b++) for (const a of [x0 - 1, x1 + 1]) { const hh = (b - top) / Math.max(1, bot - top); if (hh > 0.8 || !(has(a + 1, b) || has(a - 1, b))) continue; const n = Math.sin(a * 1.3 + ph * 1.4) + Math.cos(b * 1.9 + ph); if (n > 0.9) put(a, b, '#a01218'); }
    for (const k in colTop) { const a = +k, b = colTop[k], v = Math.sin(a * 1.1 + ph * 2.1); if (v < 0.1) continue; put(a, b - 1, '#c0201a'); if (v >= 0.7) put(a, b - 2, '#6a0c10'); }
    for (let i = 0; i < 3; i++) { const hsh = Math.abs(Math.sin((i + 1) * 12.9898 + f * 78.233 + gw * 3.1) * 43758.5453) % 1, hs2 = Math.abs(Math.sin((i + 1) * 4.1 + f * 9.7) * 9999.1) % 1;
      put(x0 + 1 + Math.floor(hsh * Math.max(1, x1 - x0 - 1)), top - 2 - Math.floor(hs2 * 4) - (f % 2), ['#ff5a2a', '#ff8a3a', '#c0201a'][i]); }
    for (const [a, b] of eyes) { put(a - 1, b, '#c01a14'); put(a - 2, b, '#5a0a0c'); }
    return (arr[f] = { c, p: P * cs });
  }

  // ---------------------------------------------------------------- 무기 텍스처 (오른쪽을 향하도록 그림, 손잡이 중심이 회전축)
  function makeBlade(o) {
    const [c, g] = mkCanvas(o.len + 2, o.wide + 6);
    const cy = Math.floor((o.wide + 6) / 2);
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // 손잡이
    px(0, cy - 2, 3, 4, o.gold); px(3, cy - 1, o.grip, 3, o.handle); px(3, cy - 1, o.grip, 1, '#7a5034');
    const gx = 3 + o.grip;
    px(gx - 1, cy - Math.floor(o.wide / 2) - 3, 3, o.wide + 6, '#0b0a0e');
    px(gx, cy - Math.floor(o.wide / 2) - 2, 1, o.wide + 4, o.gold);
    // 칼날
    const bx = gx + 2, blen = o.len - bx;
    for (let x = 0; x < blen; x++) {
      const tip = x > blen - o.tip ? (blen - x) / o.tip : 1;
      const hw = Math.max(1, Math.round((o.wide / 2) * (o.cleaver ? 1 : tip)));
      const top = cy - hw, bot = cy + hw;
      px(bx + x, top - 1, 1, bot - top + 2, '#0b0a0e');
      px(bx + x, top, 1, bot - top, o.mid);
      px(bx + x, top, 1, 1, o.edge);
      px(bx + x, bot - 1, 1, 1, o.dark);
      if (!o.cleaver && x < blen - o.tip) px(bx + x, cy, 1, 1, o.dark);
      if (o.rune && x > 6 && x < blen - o.tip - 4 && x % 7 === 0) px(bx + x, cy - 1, 2, 2, o.rune);
      if (o.rust && Math.random() < 0.12) px(bx + x, randi(top, bot - 1), 1, 1, o.rust);
    }
    if (o.post) o.post(px, cy, gx, bx, blen);
    return { c, pivotX: 3 + Math.floor(o.grip / 2), pivotY: cy, reach: o.len - 3 - Math.floor(o.grip / 2) };
  }
  const BLADES = {
    great: makeBlade({ len: 58, wide: 8, grip: 9, tip: 7, handle: '#4a2f1d', gold: '#c9a24a', mid: '#b9bfca', edge: '#f4f6fa', dark: '#6b7280' }),
    boss: cellBlade({ len: 92, wide: 13, grip: 14, tip: 10, handle: '#241a22', gold: '#5c1a70', mid: '#3c3846', edge: '#8a8199', dark: '#17151c', rune: '#b45cff' }),
    cleaver: cellBlade({ len: 36, wide: 14, grip: 10, tip: 3, cleaver: true, handle: '#3b2416', gold: '#2a2a2a', mid: '#8d9097', edge: '#c8cbd0', dark: '#4d4f55', rust: '#6e2a24' }),
    ghost: cellBlade({ len: 34, wide: 5, grip: 6, tip: 5, handle: '#3f5f8a', gold: '#9cc1ea', mid: '#9cc1ea', edge: '#e4f2ff', dark: '#5f86b8' }),
    // v0.95 기사단 무기
    squire: cellBlade({ len: 30, wide: 5, grip: 6, tip: 5, handle: '#3b2416', gold: '#8a7040', mid: '#8a909c', edge: '#c8ccd4', dark: '#4a4e58' }),
    bsword: cellBlade({ len: 40, wide: 7, grip: 8, tip: 6, handle: '#3b2416', gold: '#c9a24a', mid: '#9aa0ac', edge: '#e4e8f0', dark: '#5a5e68' }),
    // 참수 도끼: 긴 자루 끝에 초승달 날(위쪽), 뒤로 뻗은 가시, 녹·핏자국
    // v1.38 참수 도끼 다시 그림: 가죽 감은 긴 자루(금빛 끝마개) · 쇠 소켓과 리벳 · 넓은 반달 날(위) + 손잡이 쪽으로 처진 수염 날 · 반대편 등날 · 아래 쇠 가시 · 녹과 핏자국
    headsman: (() => { const A = ["......................wwwwwwd.....", "...................wwwmmmmmMd.....", ".................wwmmmmmmmmMd.....", "................wmmmmmmxmmmMd.....", "...............wmmmmmmmmmmmMd.....", "...............wmmmmmmmmrmMMd.....", "................wmmmmmmmrrMMd.....", ".................wwmmmmmmmMMd.....", "...................wwMmmmMMMd.....", ".....................wMMMMMd......", "......................dMMMdd......", "......................dWddWd......", "......................dddddd......", "gGhhhhbhhhhbhhhhbhhhhhddddddhh....", "gGHHHHbHHHHbHHHHbHHHHHddddddHH....", "......................dWddWd......", "......................dddddd......", ".......................dddd.......", "........................dd........"]; return cellWeapon(34, 19, 4, 13, { k: '#0b0a0e', h: '#6a4428', H: '#3a2414', b: '#24160c', m: '#8a8e96', M: '#6a6e76', w: '#e0e4ea', d: '#3d3f45', x: '#6a2a1a', r: '#8a1418', W: '#c8ccd4', G: '#8a6a30', g: '#c8a050' }, put => A.forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') put(x, y, c); }))); })(),
    dagger: makeBlade({ len: 26, wide: 5, grip: 6, tip: 6, handle: '#3b2416', gold: '#8a8a8a', mid: '#c8ccd4', edge: '#ffffff', dark: '#6b7280' }),
    daggerG: makeBlade({ len: 26, wide: 5, grip: 6, tip: 6, handle: '#1f4a34', gold: '#9ff0c8', mid: '#8ff0c0', edge: '#ffffff', dark: '#3aa070' }),
    holy: makeBlade({ len: 58, wide: 8, grip: 9, tip: 7, handle: '#8a6a20', gold: '#fff0b0', mid: '#ffd34d', edge: '#fffbe6', dark: '#c9952a' }),
  };
  // 몬스터 칼도 캐릭터 무기와 같은 2px 칸 회전(rotW)으로 (v0.57)
  function cellBlade(o) {
    const L = Math.round(o.len / 2), wd = Math.max(2, Math.round(o.wide / 2)), gp = Math.max(2, Math.round(o.grip / 2)), tp = Math.max(1, Math.round(o.tip / 2));
    const h = wd + 6, py = Math.floor(h / 2), pal = { k: '#0b0a0e', h: o.handle, G: o.gold, m: o.mid, w: o.edge, d: o.dark, u: o.rune || o.dark, x: o.rust || o.dark };
    return cellWeapon(L + 2, h, 2, py, pal, put => {
      for (let x = 0; x < gp; x++) put(x, py, 'h');
      for (let y = -Math.ceil(wd / 2) - 1; y <= Math.ceil(wd / 2) + 1; y++) put(gp, py + y, 'G');
      const top = py - Math.floor(wd / 2), x0 = gp + 1;
      for (let x = x0; x < L + 1; x++) {
        const t = (x - x0) / Math.max(1, L - x0), cut = o.cleaver ? 0 : Math.max(0, Math.round((x - (L + 1 - tp)) * wd / tp / 1.6));
        for (let r = 0; r < wd; r++) {
          if (r < cut) continue;
          const c = r === 0 + cut ? 'w' : r === wd - 1 ? 'd' : (o.rune && r === Math.floor(wd / 2) && x % 3 === 0) ? 'u' : 'm';
          put(x, top + r, o.cleaver && (x * 7 + r * 3) % 11 === 0 && r > 0 ? 'x' : c);
        }
      }
      if (o.cleaver) for (let r = 0; r < wd; r++) put(L + 1, top + r, r === 0 ? 'w' : 'd');
    });
  }
  function mkTool(w, h, draw, pivotX, pivotY, reach) { const [c, g] = mkCanvas(w, h); draw((x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); }); return { c, pivotX, pivotY, reach }; }
  const maceTool = (head, hi, lo, grip) => mkTool(32, 14, px => {
    px(0, 5, 20, 4, '#0b0a0e'); px(1, 6, 19, 2, '#6b4a2a'); px(1, 6, 4, 2, grip); px(16, 5, 3, 4, grip);
    px(19, 1, 12, 12, '#0b0a0e'); px(20, 2, 10, 10, head); px(20, 2, 10, 2, hi); px(20, 10, 10, 2, lo);
    px(22, 0, 2, 14, '#0b0a0e'); px(27, 0, 2, 14, '#0b0a0e'); px(22, 1, 2, 12, hi); px(27, 1, 2, 12, hi); px(30, 5, 2, 4, hi);
  }, 4, 7, 30);
  const TOOLS = {
    staff: mkTool(44, 12, px => {
      px(0, 5, 34, 3, '#0b0a0e'); px(1, 6, 33, 1, '#6b4a2a');
      for (let x = 5; x < 32; x += 8) px(x, 5, 2, 3, '#c9a24a');
      px(33, 2, 3, 9, '#0b0a0e'); px(34, 3, 1, 7, '#8a6236');
      px(36, 1, 8, 10, '#0b0a0e'); px(37, 2, 6, 8, '#5a2a8a'); px(38, 3, 4, 6, '#b070ff'); px(39, 4, 2, 2, '#f0d8ff');
    }, 10, 6, 40),
    mace: maceTool('#8d9097', '#e6e8ec', '#4d4f55', '#c9a24a'),
    maceH: maceTool('#ffd34d', '#fffbe6', '#c9952a', '#fff0b0'),
    musket: mkTool(50, 10, px => {
      px(0, 3, 12, 7, '#0b0a0e'); px(1, 4, 11, 5, '#6b4a2a'); px(1, 7, 11, 1, '#4a3020');
      px(11, 3, 20, 4, '#0b0a0e'); px(12, 4, 19, 2, '#7a5232');
      px(14, 2, 36, 3, '#0b0a0e'); px(15, 3, 35, 1, '#8d9097');
      px(20, 2, 2, 4, '#c9a24a'); px(32, 2, 2, 3, '#c9a24a'); px(47, 1, 1, 2, '#c9a24a');
      px(14, 1, 3, 2, '#3a3a40'); px(16, 6, 3, 3, '#0b0a0e');
    }, 12, 5, 48),
  };
  // ---------------------------------------------------------------- 무기 등급별 외형 (커먼 · 레어 · 유니크 · 레전더리)
  const TIER_OF = { common: 0, rare: 1, unique: 2, legend: 3, rby: 1 };
  const staffTool = o => mkTool(o.len + 4, 14, px => {
    const L = o.len, cy = 7;
    px(0, cy - 1, L - 10, 3, '#0b0a0e'); px(1, cy, L - 11, 1, o.wood); if (o.wood2) for (let x = 2; x < L - 12; x += 3) px(x, cy, 1, 1, o.wood2);
    if (o.band) for (let x = 5; x < L - 12; x += 8) px(x, cy - 1, 2, 3, o.band);
    const hx = L - 11;
    px(hx, cy - 4, 3, 9, '#0b0a0e'); px(hx + 1, cy - 3, 1, 7, o.band || o.wood);
    if (o.crescent) { px(hx + 2, cy - 6, 2, 3, '#0b0a0e'); px(hx + 2, cy + 4, 2, 3, '#0b0a0e'); px(hx + 3, cy - 5, 1, 2, o.crescent); px(hx + 3, cy + 4, 1, 2, o.crescent); }
    const r = o.orbR;
    px(hx + 3, cy - r - 1, r * 2 + 2, r * 2 + 3, '#0b0a0e'); px(hx + 4, cy - r, r * 2, r * 2 + 1, o.orb1); px(hx + 5, cy - r + 1, r * 2 - 2, r * 2 - 1, o.orb2); px(hx + 5, cy - r + 1, 2, 2, o.orb3);
    if (o.star) { const sx = hx + 4 + r; px(sx, cy - r - 4, 1, 3, o.star); px(sx, cy + r + 2, 1, 3, o.star); px(sx + r + 2, cy, 3, 1, o.star); }
  }, 10, 7, o.len - 2);
  const maceTier = (head, hi, lo, grip, post) => mkTool(36, 18, px => {
    const cy = 9;
    px(0, cy - 2, 20, 4, '#0b0a0e'); px(1, cy - 1, 19, 2, '#6b4a2a'); px(1, cy - 1, 4, 2, grip); px(16, cy - 2, 3, 4, grip);
    px(19, cy - 6, 12, 12, '#0b0a0e'); px(20, cy - 5, 10, 10, head); px(20, cy - 5, 10, 2, hi); px(20, cy + 3, 10, 2, lo);
    px(22, cy - 7, 2, 14, '#0b0a0e'); px(27, cy - 7, 2, 14, '#0b0a0e'); px(22, cy - 6, 2, 12, hi); px(27, cy - 6, 2, 12, hi); px(30, cy - 2, 2, 4, hi);
    if (post) post(px, cy);
  }, 4, 9, 30);
  const musketTier = o => mkTool(o.len, 12, px => {
    const L = o.len;
    px(0, 4, 12, 7, '#0b0a0e'); px(1, 5, 11, 5, o.stock); px(1, 8, 11, 1, o.stock2);
    px(11, 4, 20, 4, '#0b0a0e'); px(12, 5, 19, 2, o.stock);
    px(14, 3, L - 14, 3, '#0b0a0e'); px(15, 4, L - 15, 1, o.barrel);
    for (const x of o.bands) px(x, 3, 2, 4, o.band); px(L - 3, 2, 1, 2, o.band);
    px(14, 2, 3, 2, '#3a3a40'); px(16, 7, 3, 3, '#0b0a0e');
    if (o.post) o.post(px, L);
  }, 12, 6, o.len - 2);
  const WEAP = {
    knight: [
      makeBlade({ len: 54, wide: 8, grip: 9, tip: 7, handle: '#4a2f1d', gold: '#6a6a70', mid: '#9aa0a8', edge: '#d0d4da', dark: '#5a6068', rust: '#6e4a2a' }),
      makeBlade({ len: 58, wide: 8, grip: 9, tip: 7, handle: '#2a3448', gold: '#c0c8d8', mid: '#a8b8d0', edge: '#f0f8ff', dark: '#5a6a88', rune: '#4f8dff' }),
      makeBlade({ len: 62, wide: 9, grip: 10, tip: 8, handle: '#2a1a2a', gold: '#c9a24a', mid: '#4a3e5a', edge: '#d8b8ff', dark: '#241a30', rune: '#b05cff' }),
      makeBlade({ len: 66, wide: 10, grip: 10, tip: 9, handle: '#5a1a10', gold: '#ffe08a', mid: '#e8d090', edge: '#fffbe6', dark: '#a07820', rune: '#ff6a2a',
        post: (px, cy, gx) => { px(gx - 2, cy - 9, 2, 4, '#0b0a0e'); px(gx - 2, cy + 6, 2, 4, '#0b0a0e'); px(gx - 1, cy - 8, 1, 3, '#ffe08a'); px(gx - 1, cy + 6, 1, 3, '#ffe08a'); px(1, cy - 1, 2, 2, '#ff3020'); } }),
    ],
    ranger: [
      makeBlade({ len: 25, wide: 5, grip: 6, tip: 6, handle: '#3b2416', gold: '#6a6a70', mid: '#9aa0a8', edge: '#d8dce4', dark: '#5a6068', rust: '#6e4a2a' }),
      makeBlade({ len: 27, wide: 5, grip: 6, tip: 7, handle: '#2a3448', gold: '#c0c8d8', mid: '#b8c8e0', edge: '#ffffff', dark: '#5a6a88' }),
      makeBlade({ len: 29, wide: 6, grip: 6, tip: 8, handle: '#2a1a2a', gold: '#c9a24a', mid: '#5a3e6a', edge: '#e8c8ff', dark: '#2a1a3a', rune: '#b05cff' }),
      makeBlade({ len: 31, wide: 6, grip: 7, tip: 11, handle: '#3a0e10', gold: '#a3222a', mid: '#e8e0d0', edge: '#ffffff', dark: '#a89880', rune: '#ff3040' }),
    ],
    mage: [
      staffTool({ len: 40, wood: '#6b4a2a', orbR: 2, orb1: '#2a4a7a', orb2: '#5a8ac0', orb3: '#c0e0ff' }),
      staffTool({ len: 42, wood: '#6b4a2a', band: '#c0c8d8', orbR: 3, orb1: '#1a3a8a', orb2: '#4a80ff', orb3: '#e0f0ff' }),
      staffTool({ len: 44, wood: '#3a2430', wood2: '#5a3a4a', band: '#c9a24a', crescent: '#c9a24a', orbR: 3, orb1: '#5a2a8a', orb2: '#b070ff', orb3: '#f0d8ff' }),
      staffTool({ len: 48, wood: '#c9a24a', wood2: '#ffe08a', band: '#fff0b0', crescent: '#ffe08a', star: '#ffd080', orbR: 4, orb1: '#a0300e', orb2: '#ff9a3a', orb3: '#fff0b0' }),
    ],
    priest: [
      maceTier('#6a6e78', '#a8acb4', '#3a3e44', '#6a6a70'),
      maceTier('#8d9097', '#e6e8ec', '#4d4f55', '#c0c8d8', (px, cy) => { px(24, cy - 1, 2, 2, '#4f8dff'); }),
      maceTier('#4a3e5a', '#c8a8f0', '#241a30', '#c9a24a', (px, cy) => { px(31, cy - 4, 3, 2, '#0b0a0e'); px(31, cy + 2, 3, 2, '#0b0a0e'); px(32, cy - 4, 2, 1, '#c8a8f0'); px(32, cy + 3, 2, 1, '#c8a8f0'); px(24, cy - 1, 2, 2, '#b05cff'); }),
      maceTier('#ffd34d', '#fffbe6', '#c9952a', '#fff0b0', (px, cy) => { for (const [x, y] of [[33, cy - 1], [18, cy - 8], [18, cy + 7], [34, cy - 6], [34, cy + 5]]) px(x, y, 2, 2, '#fff4c0'); px(24, cy - 1, 2, 2, '#ff6a2a'); }),
    ],
    gunner: [
      musketTier({ len: 48, stock: '#6b4a2a', stock2: '#4a3020', barrel: '#8d9097', band: '#6a6a70', bands: [20, 32] }),
      musketTier({ len: 50, stock: '#7a5232', stock2: '#4a3020', barrel: '#a8acb4', band: '#c9a24a', bands: [20, 32, 42] }),
      musketTier({ len: 52, stock: '#2a1a2a', stock2: '#1a1018', barrel: '#5a5a68', band: '#c0c8d8', bands: [20, 32, 44], post: (px) => { px(2, 6, 9, 1, '#b05cff'); px(13, 5, 17, 1, '#b05cff'); } }),
      musketTier({ len: 56, stock: '#1a1418', stock2: '#0e0a0c', barrel: '#3a3e3a', band: '#d8d0b8', bands: [20, 34, 46], post: (px, L) => { px(15, 4, L - 16, 1, '#7aff9a'); px(4, 5, 3, 3, '#d8d0b8'); px(5, 6, 1, 1, '#0b0a0e'); px(L - 4, 1, 4, 1, '#d8d0b8'); } }),
    ],
  };

  // ================================================================ 칸 단위 무기 (v0.45)
  // 캐릭터와 같은 크기의 도트: 1칸 = 게임 2px. 회전도 칸 단위로 하고 외곽선을 다시 붙여, 어떤 각도에서도 계단형 도트가 유지된다
  const wMix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  function cellWeapon(w, h, px, py, pal, draw) {
    const g = Array.from({ length: h }, () => Array(w).fill('.'));
    const put = (x, y, c) => { if (x >= 0 && x < w && y >= 0 && y < h) g[y][x] = c; };
    draw(put, g);
    let reach = 0; g.forEach((r, y) => r.forEach((c, x) => { if (c !== '.') reach = Math.max(reach, Math.hypot(x - px, y - py)); }));
    return { cells: g, w, h, px, py, pal, reach: Math.round(reach * 2), rot: {} };
  }
  const ROT_N = 96;
  const ROT_WARM = { b: null, i: 0 };
  function warmRot(b, per = 6) { // v2.19 무기를 바꾸면 96방향 회전 그림을 프레임당 몇 장씩 미리 만든다
    if (!b || !b.cells) return; if (ROT_WARM.b !== b) { ROT_WARM.b = b; ROT_WARM.i = 0; }
    for (let k = 0; k < per && ROT_WARM.i < ROT_N; k++, ROT_WARM.i++) rotW(b, (ROT_WARM.i + 0.01) / ROT_N * TAU);
  }
  function rotW(b, ang, sc = 1) { // v1.05: sc 배율도 칸 단위 (1/8 단위로 끊음)
    sc = Math.max(0.25, Math.round(sc * 8) / 8);
    const flip = Math.cos(ang) < 0, step = ((Math.round(ang / TAU * ROT_N) % ROT_N) + ROT_N) % ROT_N, key = step + (flip ? 'f' : '') + (sc !== 1 ? 's' + sc : '');
    if (b.rot[key]) return b.rot[key];
    const a = step / ROT_N * TAU, ca = Math.cos(a), sa = Math.sin(a), R = Math.ceil(Math.hypot(b.w, b.h) * sc) + 2, N = R * 2 + 3, out = new Map();
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const lx = (x * ca + y * sa) / sc; let ly = (-x * sa + y * ca) / sc; if (flip) ly = -ly;
      const sx = Math.round(lx + b.px), sy = Math.round(ly + b.py);
      if (sx >= 0 && sx < b.w && sy >= 0 && sy < b.h && b.cells[sy][sx] !== '.') out.set(x + ',' + y, b.cells[sy][sx]);
    }
    const [c, g] = mkCanvas(N * 2, N * 2), o = R + 1;
    g.fillStyle = '#0b0a0e';
    for (const k of out.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!out.has((x + dx) + ',' + (y + dy))) g.fillRect((x + dx + o) * 2, (y + dy + o) * 2, 2, 2); }
    for (const [k, v] of out) { const [x, y] = k.split(',').map(Number); g.fillStyle = b.pal[v] || '#0b0a0e'; g.fillRect((x + o) * 2, (y + o) * 2, 2, 2); }
    return (b.rot[key] = { c, o: o * 2 + 1 });
  }
  // 기사 대검: 날 5칸 두께, 큰 가드와 보석
  const swordC = o => cellWeapon(31, 11, 3, 5, {
    G: o.gold, g: wMix(o.gold, '#ffffff', 0.45), r: o.gem || '#a3222a', h: o.handle, H: wMix(o.handle, '#c0a080', 0.35),
    m: o.mid, l: wMix(o.mid, o.edge, 0.55), w: o.edge, d: o.dark, D: wMix(o.mid, o.dark, 0.5), u: o.rune || o.dark, x: o.rust || o.dark,
  }, put => {
    const cy = 5, L = 22;
    put(0, cy, 'G'); put(1, cy, 'G'); put(0, cy - 1, 'G'); put(0, cy + 1, 'G');
    for (let x = 2; x < 6; x++) put(x, cy, x % 2 ? 'h' : 'H');
    for (let y = 1; y < 10; y++) put(6, y, 'G'); for (let y = 2; y < 9; y++) put(7, y, 'G');
    put(6, 1, 'g'); put(6, 9, 'g'); put(7, cy, 'r');
    if (o.spikes) { put(5, 0, 'G'); put(5, 10, 'G'); put(6, 0, 'g'); put(6, 10, 'g'); }
    for (let t = 0; t < L; t++) {
      const x = 8 + t, hw = t < L - 4 ? 2 : t < L - 1 ? 1 : 0;
      for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw ? 'l' : (y === cy + hw && hw) ? 'd' : (y === cy && hw === 2 && t < L - 6) ? 'D' : 'm');
      if (t === L - 1) put(x, cy, 'w');
      if (t >= 10 && t < L - 1) put(x, t < L - 4 ? cy - 2 : cy - 1, 'w');
      if (o.rune && t > 2 && t < L - 7 && t % 4 === 1) put(x, cy, 'u');
      if (o.rust && [3, 9, 14].includes(t)) put(x, cy + 1, 'x');
    }
  });
  // 레인저 단검: 끝이 위로 휘는 날 (역수로 쥔다)
  const daggerC = o => cellWeapon(14, 7, 2, 4, {
    G: o.gold, h: o.handle, H: wMix(o.handle, '#c0a080', 0.35), m: o.mid, l: wMix(o.mid, o.edge, 0.55), w: o.edge, u: o.rune || o.edge,
  }, put => {
    const cy = 4, cv = [0, 0, 0, 1, 1, 2, 2, 3, 4];
    put(0, cy, 'G'); put(1, cy, 'h'); put(2, cy, 'H'); put(3, cy, 'h');
    for (let y = cy - 1; y <= cy + 1; y++) put(4, y, 'G');
    cv.forEach((c, t) => { const x = 5 + t, y = cy - c; if (t < cv.length - 2) { put(x, y, 'l'); put(x, y + 1, t < cv.length - 3 ? 'm' : 'w'); } else put(x, y, 'w'); });
    put(7, cy + 1, 'w'); put(8, cy, 'w');
    if (o.rune) put(6, cy, 'u');
  });
  // 마법사 지팡이: 띠를 두른 자루 + 보주 (등급이 오르면 초승달 뿔, 별빛)
  const staffC = o => cellWeapon(25, 11, 5, 5, {
    h: o.wood, H: o.wood2 || wMix(o.wood, '#000000', 0.25), G: o.band || wMix(o.wood, '#000000', 0.4), C: o.band || '#8a6236',
    o: o.orb1, O: o.orb2, W: o.orb3, c: o.crescent || o.band || '#c9a24a', s: o.star || '#ffffff',
  }, put => {
    const cy = 5;
    for (let x = 0; x < 17; x++) put(x, cy, x % 4 === 0 ? 'G' : (o.wood2 && x % 2) ? 'H' : 'h');
    for (let y = cy - 2; y <= cy + 2; y++) put(17, y, 'C');
    const r = o.orbR, ox = 19 + (r > 2 ? 1 : 0);
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 0.6) put(ox + x, cy + y, x + y < -r * 0.6 ? 'W' : x + y < 0.5 ? 'O' : 'o');
    if (o.crescent) { put(18, cy - r - 1, 'c'); put(19, cy - r - 2, 'c'); put(18, cy + r + 1, 'c'); put(19, cy + r + 2, 'c'); }
    if (o.star) { put(ox + r + 2, cy, 's'); put(ox, cy - r - 2, 's'); put(ox, cy + r + 2, 's'); }
  });
  // 사제 메이스: 자루 + 날개(플랜지) 달린 머리
  const maceC = o => cellWeapon(18, 9, 2, 4, {
    G: o.grip, h: '#6b4a2a', m: o.head, l: o.hi, d: o.lo, u: o.gem || o.hi, s: o.spike || o.hi,
  }, put => {
    const cy = 4;
    put(0, cy, 'G'); for (let x = 1; x < 10; x++) put(x, cy, x === 1 || x === 8 ? 'G' : 'h');
    for (let x = 10; x < 15; x++) for (let y = cy - 2; y <= cy + 2; y++) put(x, y, y === cy - 2 ? 'l' : y === cy + 2 ? 'd' : 'm');
    for (let y = cy - 3; y <= cy + 3; y++) { put(11, y, 'l'); put(13, y, 'l'); }
    put(15, cy, 'l');
    if (o.gem) put(12, cy, 'u');
    if (o.spike) { put(12, cy - 4, 's'); put(12, cy + 4, 's'); put(16, cy, 's'); }
  });
  // 거너 머스킷: 넓은 개머리판 + 긴 총신 + 띠
  const musketC = o => cellWeapon(27, 6, 6, 3, {
    s: o.stock, S: o.stock2, b: o.barrel, B: o.band, k: '#3a3a40', u: o.rune || o.band,
  }, put => {
    const cy = 3, L = o.len;
    for (let x = 0; x < 6; x++) { put(x, cy - 1, 's'); put(x, cy, 's'); put(x, cy + 1, 'S'); }
    for (let x = 6; x < 11; x++) put(x, cy, 's');
    for (let x = 7; x < L; x++) put(x, cy - 1, 'b');
    for (const x of o.bands) put(x, cy - 1, 'B'); put(L - 1, cy - 2, 'B');
    put(8, cy + 1, 'k'); put(7, cy - 2, 'k');
    if (o.rune) for (let x = 1; x < 5; x++) put(x, cy, 'u');
  });
  WEAP.knight = [
    swordC({ handle: '#4a2f1d', gold: '#6a6a70', mid: '#9aa0a8', edge: '#d0d4da', dark: '#5a6068', rust: '#6e4a2a', gem: '#5a6068' }),
    swordC({ handle: '#2a3448', gold: '#c0c8d8', mid: '#a8b8d0', edge: '#f0f8ff', dark: '#5a6a88', rune: '#4f8dff', gem: '#4f8dff' }),
    swordC({ handle: '#2a1a2a', gold: '#c9a24a', mid: '#4a3e5a', edge: '#d8b8ff', dark: '#241a30', rune: '#b05cff', gem: '#b05cff' }),
    swordC({ handle: '#5a1a10', gold: '#ffe08a', mid: '#e8d090', edge: '#fffbe6', dark: '#a07820', rune: '#ff6a2a', gem: '#ff3020', spikes: true }),
  ];
  WEAP.ranger = [
    daggerC({ handle: '#3b2416', gold: '#6a6a70', mid: '#9aa0a8', edge: '#d8dce4' }),
    daggerC({ handle: '#2a3448', gold: '#c0c8d8', mid: '#b8c8e0', edge: '#ffffff', rune: '#4f8dff' }),
    daggerC({ handle: '#2a1a2a', gold: '#c9a24a', mid: '#5a3e6a', edge: '#e8c8ff', rune: '#b05cff' }),
    daggerC({ handle: '#3a0e10', gold: '#a3222a', mid: '#e8e0d0', edge: '#ffffff', rune: '#ff3040' }),
  ];
  WEAP.mage = [
    staffC({ wood: '#6b4a2a', orbR: 2, orb1: '#2a4a7a', orb2: '#5a8ac0', orb3: '#c0e0ff' }),
    staffC({ wood: '#6b4a2a', band: '#c0c8d8', orbR: 2, orb1: '#1a3a8a', orb2: '#4a80ff', orb3: '#e0f0ff' }),
    staffC({ wood: '#3a2430', wood2: '#5a3a4a', band: '#c9a24a', crescent: '#c9a24a', orbR: 2, orb1: '#5a2a8a', orb2: '#b070ff', orb3: '#f0d8ff' }),
    staffC({ wood: '#c9a24a', wood2: '#ffe08a', band: '#fff0b0', crescent: '#ffe08a', star: '#ffd080', orbR: 3, orb1: '#a0300e', orb2: '#ff9a3a', orb3: '#fff0b0' }),
  ];
  WEAP.priest = [
    maceC({ head: '#6a6e78', hi: '#a8acb4', lo: '#3a3e44', grip: '#6a6a70' }),
    maceC({ head: '#8d9097', hi: '#e6e8ec', lo: '#4d4f55', grip: '#c0c8d8', gem: '#4f8dff' }),
    maceC({ head: '#4a3e5a', hi: '#c8a8f0', lo: '#241a30', grip: '#c9a24a', gem: '#b05cff', spike: '#c8a8f0' }),
    maceC({ head: '#ffd34d', hi: '#fffbe6', lo: '#c9952a', grip: '#fff0b0', gem: '#ff6a2a', spike: '#fff4c0' }),
  ];
  WEAP.gunner = [
    musketC({ len: 24, stock: '#6b4a2a', stock2: '#4a3020', barrel: '#8d9097', band: '#6a6a70', bands: [10, 16] }),
    musketC({ len: 25, stock: '#7a5232', stock2: '#4a3020', barrel: '#a8acb4', band: '#c9a24a', bands: [10, 16, 21] }),
    musketC({ len: 26, stock: '#2a1a2a', stock2: '#1a1018', barrel: '#5a5a68', band: '#c0c8d8', bands: [10, 16, 22], rune: '#b05cff' }),
    musketC({ len: 27, stock: '#1a1418', stock2: '#0e0a0c', barrel: '#3a3e3a', band: '#d8d0b8', bands: [10, 17, 23], rune: '#7aff9a' }),
  ];
  BLADES.great = swordC({ handle: '#4a2f1d', gold: '#c9a24a', mid: '#b9bfca', edge: '#f4f6fa', dark: '#6b7280' });
  BLADES.holy = swordC({ handle: '#8a6a20', gold: '#fff0b0', mid: '#ffd34d', edge: '#fffbe6', dark: '#c9952a', gem: '#ffffff', spikes: true });
  BLADES.dagger = daggerC({ handle: '#3b2416', gold: '#8a8a8a', mid: '#c8ccd4', edge: '#ffffff' });
  BLADES.daggerG = daggerC({ handle: '#1f4a34', gold: '#9ff0c8', mid: '#8ff0c0', edge: '#ffffff' });
  TOOLS.staff = WEAP.mage[2];
  TOOLS.mace = WEAP.priest[1];
  TOOLS.maceH = maceC({ head: '#ffd34d', hi: '#fffbe6', lo: '#c9952a', grip: '#fff0b0', gem: '#ffffff' });
  TOOLS.musket = WEAP.gunner[1];

  // ================================================================ v2.03 무기 도감: 직업마다 커먼 1 · 레어 5 · 유니크 3 · 레전더리 2 (도트는 _시안/ 시트와 같음)
  const WF = {};
// 기사 무기 시안 11종 — cellWeapon(w, h, px, py, pal, draw). 1칸 = 게임 2px, 오른쪽이 날 끝, (px,py)가 손잡이 축. 외곽선은 rotW가 자동으로 두름
WF.knight = (H) => {
  const { cellWeapon, WEAP } = H;
  const W = [];
  const add = (grade, name, look, skill, w) => W.push({ grade, name, look, skill, w });
  const rect = (put, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c); };

  // 1 커먼 — 기사단 대검 (지금 그대로)
  add('common', '기사단 대검', '기사단의 기본 대검입니다.', '—', WEAP.knight[0]);

  // 2 레어 — 도살자의 식칼
  add('rare', '도살자의 식칼', '문짝만 한 정육 식칼입니다.', '3타가 내려찍기로 바뀌고, 맞은 적은 0.6초 동안 넘어집니다.', cellWeapon(33, 13, 3, 8, {
    h: '#5a3a22', H: '#7a5232', G: '#c0c0c8', m: '#a2a6ae', l: '#cdd1d8', w: '#f0f2f6', d: '#5a6068', D: '#7c828c', x: '#7a1a1a', X: '#a8282a',
  }, put => {
    const cy = 8;
    for (let x = 0; x < 8; x++) { put(x, cy, x % 2 ? 'h' : 'H'); put(x, cy + 1, 'h'); } put(2, cy, 'G'); put(5, cy, 'G'); put(2, cy + 1, 'G'); put(5, cy + 1, 'G');
    put(8, cy - 1, 'd'); put(8, cy, 'd'); put(8, cy + 1, 'd'); put(8, cy + 2, 'd');
    for (let x = 9; x <= 31; x++) {
      const top = x > 28 ? 1 + (x - 28) : 1;
      for (let y = top; y <= 11; y++) put(x, y, y === top ? 'd' : y === 11 ? 'w' : y === 10 ? 'l' : y < 4 ? 'D' : 'm');
    }
    put(26, 3, '.'); put(27, 3, '.'); put(26, 4, '.'); put(27, 4, '.'); // 매다는 구멍
    for (const [x, y] of [[14, 9], [15, 10], [20, 8], [21, 9], [22, 10], [17, 6]]) put(x, y, y > 8 ? 'X' : 'x'); // 핏자국
  }));

  // 3 레어 — 냉동 참치 (개그)
  add('rare', '냉동 참치 🐟', '꽁꽁 언 참치의 꼬리를 쥐고 휘두릅니다.', '맞은 적은 감소합니다. 3타에 얼음 비늘이 튀고 「철퍽」 소리가 납니다.', cellWeapon(35, 13, 2, 6, {
    B: '#22345a', b: '#34507e', m: '#5a7cae', s: '#b8c6d6', S: '#e0e8f0', y: '#e8c838', f: '#e8faff', F: '#9fe0ff', k: '#0b0a0e', W: '#ffffff', r: '#c03a40',
  }, put => {
    const cy = 6;
    // 꼬리 지느러미 (손잡이)
    for (let i = 0; i < 5; i++) { put(i, cy - 4 + i, 'b'); put(i, cy + 4 - i, 'b'); put(i, cy - 3 + i, 'B'); put(i, cy + 3 - i, 'B'); }
    put(4, cy, 'B'); put(5, cy, 'b'); put(6, cy, 'b'); put(5, cy - 1, 'B'); put(5, cy + 1, 'b');
    // 몸통 (방추형)
    for (let x = 7; x <= 34; x++) {
      const t = (x - 7) / 27, hw = Math.round(1 + 4 * Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62) - (t > 0.85 ? (t - 0.85) * 18 : 0));
      for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y <= cy - hw + 1 ? 'B' : y < cy ? 'm' : y === cy ? 's' : y >= cy + hw ? 's' : 'S');
      if (x % 3 === 0 && x > 9 && x < 27) put(x, cy + hw + 1, 'y'); // 배 쪽 작은 지느러미
      if (x % 3 === 1 && x > 11 && x < 27) put(x, cy - hw - 1, 'y'); // 등 쪽 작은 지느러미
    }
    put(15, cy - 6, 'B'); put(16, cy - 6, 'B'); put(16, cy - 7, 'B'); put(17, cy - 6, 'b'); // 등지느러미
    put(30, cy - 2, 'k'); put(31, cy - 2, 'W'); // 눈
    put(34, cy, 'r'); put(33, cy + 1, 'k'); // 입
    put(27, cy, 'B'); put(27, cy + 1, 'B'); put(26, cy + 2, 'B'); // 아가미
    for (const [x, y] of [[10, cy - 2], [13, cy + 2], [18, cy - 3], [21, cy + 1], [24, cy - 2], [28, cy + 2], [12, cy - 3], [32, cy - 1]]) put(x, y, 'f'); // 서리
    for (const [x, y] of [[19, cy - 1], [25, cy + 3], [9, cy + 1]]) put(x, y, 'F');
  }));

  // 4 레어 — 사슬 분절검
  add('rare', '사슬 분절검', '마디마디 사슬로 이어진 검입니다.', '3타에 마디 사이가 벌어지며, 검의 길이가 모양 그대로 두 배로 증가합니다.', cellWeapon(35, 11, 3, 5, {
    h: '#3a2a3a', H: '#5a4256', G: '#8a8a94', g: '#c0c0c8', m: '#9aa2ae', l: '#c8d0da', w: '#eef2f6', d: '#545a66', c: '#6a6e78', C: '#3a3c44',
  }, put => {
    const cy = 5;
    for (let x = 0; x < 6; x++) put(x, cy, x % 2 ? 'h' : 'H'); put(0, cy - 1, 'G'); put(0, cy + 1, 'G');
    for (let y = 2; y <= 8; y++) put(6, y, 'G'); put(6, 2, 'g'); put(6, 8, 'g'); put(7, cy, 'G');
    let x = 8;
    for (let seg = 0; seg < 5; seg++) {
      const len = seg < 4 ? 4 : 6;
      for (let i = 0; i < len; i++, x++) {
        const tip = seg === 4 ? Math.max(0, 2 - Math.floor((len - 1 - i) / 2)) : 0, hw = 2 - tip;
        for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw ? 'l' : y === cy + hw ? 'd' : 'm');
        if (seg === 4 && i === len - 1) put(x, cy, 'w');
        if (i === 0) put(x, cy - hw, 'w');
      }
      if (seg < 4) { put(x, cy, 'c'); put(x, cy - 1, 'C'); put(x, cy + 1, 'C'); x++; } // 사슬 고리
    }
  }));

  // 5 레어 — 종지기의 추
  add('rare', '종지기의 추', '거대한 종의 추를 쇠막대에 단 무기입니다.', '적을 맞히면 「댕」 하고 울림 고리가 퍼져, 주변 적에게 쌓이는 그로기가 30% 증가합니다.', cellWeapon(32, 13, 3, 6, {
    i: '#4a4c54', I: '#7a7e88', h: '#5a3a22', H: '#7a5232', b: '#a07030', B: '#5a3a14', Y: '#e8c070', y: '#c89848', r: '#3a2810',
  }, put => {
    const cy = 6;
    for (let x = 0; x < 6; x++) put(x, cy, x % 2 ? 'h' : 'H');
    for (let x = 6; x < 22; x++) { put(x, cy, 'i'); put(x, cy - 1, x % 4 === 0 ? 'I' : 'i'); }
    put(21, cy - 2, 'I'); put(21, cy + 1, 'I'); put(22, cy - 1, 'i'); put(22, cy, 'i'); // 고리
    for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) {
      const d = Math.hypot(x, y * 1.05); if (d > 5.2) continue;
      const c = d > 4.4 ? 'B' : (x < -1 && y < -1) ? 'Y' : (x + y < 0) ? 'y' : 'b';
      put(27 + x, cy + y, c);
    }
    put(25, cy - 3, 'Y'); put(24, cy - 2, 'Y'); put(29, cy + 3, 'r'); put(30, cy + 2, 'r'); // 반짝 · 녹
  }));

  // 6 레어 — 풍차 날개
  add('rare', '풍차 날개', '낡은 풍차 날개 한 장입니다.', '회전베기를 두 바퀴 돌며 적을 바깥으로 밀어냅니다.', cellWeapon(35, 13, 3, 6, {
    o: '#8a6034', O: '#5a3a1e', c: '#d8cbb0', C: '#b0a080', t: '#8a7a60', h: '#4a2f1d', i: '#5a5c64',
  }, put => {
    const cy = 6;
    for (let x = 0; x <= 34; x++) put(x, cy, x < 6 ? (x % 2 ? 'h' : 'O') : 'o');
    put(6, cy - 1, 'i'); put(6, cy + 1, 'i'); put(7, cy - 1, 'i'); put(7, cy + 1, 'i');
    for (let x = 10; x <= 34; x++) for (let y = 1; y <= 11; y++) {
      if (y === cy) continue;
      const frame = x === 10 || x === 34 || y === 1 || y === 11 || (x - 10) % 6 === 0 || y === 3 || y === 9;
      const torn = (x > 28 && y > 8 && (x + y) % 3 === 0) || (x === 33 && y === 2) || (x > 30 && y === 10);
      if (torn) continue;
      put(x, y, frame ? ((x - 10) % 6 === 0 || x === 34 ? 'O' : 'o') : ((x + y) % 5 === 0 ? 'C' : (x * 7 + y) % 11 === 0 ? 't' : 'c'));
    }
  }));

  // 7 유니크 — 용 이빨 대검
  add('unique', '용 이빨 대검', '뼈로 된 톱니 대검입니다.', '모든 공격이 출혈을 일으킵니다. 출혈 중인 적을 처치하면 뼈 파편이 폭발합니다.', cellWeapon(35, 13, 3, 6, {
    h: '#5a1a1a', H: '#8a2a24', i: '#ece2c8', I: '#bfb294', j: '#8e8268', r: '#ff4030', R: '#a01818', k: '#0b0a0e',
  }, put => {
    const cy = 6;
    for (let x = 0; x < 6; x++) put(x, cy, x % 2 ? 'h' : 'H'); put(0, cy - 1, 'I'); put(0, cy + 1, 'I');
    for (let y = 1; y <= 11; y++) put(6, y, y === 1 || y === 11 ? 'I' : 'j'); for (let y = 3; y <= 9; y++) put(7, y, 'I'); put(7, cy, 'r'); put(8, cy, 'R');
    for (let t = 0; t < 26; t++) {
      const x = 8 + t, hw = t < 20 ? 3 : t < 24 ? 2 : 1;
      for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw ? 'i' : y === cy + hw ? 'j' : y === cy ? 'I' : 'i');
      if (t % 3 === 0 && t < 22) { put(x, cy - hw - 1, 'i'); put(x + 1, cy + hw + 1, 'I'); } // 톱니
      if (t % 3 === 1 && t < 22) put(x, cy - hw - 2, 'I');
    }
    put(34, cy, 'i');
    for (const [x, y] of [[12, cy + 1], [17, cy - 1], [22, cy + 1], [27, cy]]) put(x, y, 'j'); // 뼈 결
  }));

  // 8 유니크 — 성문 빗장
  add('unique', '성문 빗장', '철 띠를 두른 성문 걸쇠 통나무입니다.', '돌진 참격이 성문을 부수듯 적을 벽까지 밀고 가서 충격파를 일으킵니다.', cellWeapon(35, 11, 3, 5, {
    o: '#7a5230', O: '#4e3420', p: '#9a6e44', n: '#4a4c54', N: '#7a7e88', R: '#c8b88a', r: '#9a8a60',
  }, put => {
    const cy = 5;
    for (let x = 0; x < 8; x++) { put(x, cy, (x % 2) ? 'R' : 'r'); put(x, cy - 1, 'r'); put(x, cy + 1, 'R'); } // 밧줄 감은 손잡이
    for (let x = 8; x <= 34; x++) for (let y = cy - 4; y <= cy + 4; y++) {
      const band = [8, 9, 17, 18, 26, 27, 33, 34].includes(x);
      put(x, y, band ? (y === cy - 4 ? 'N' : 'n') : (y === cy - 4 ? 'p' : y === cy + 4 ? 'O' : ((x * 3 + y) % 7 === 0 ? 'O' : 'o')));
    }
    for (const x of [9, 18, 27]) { put(x, cy - 2, 'N'); put(x, cy + 2, 'N'); } // 리벳
    for (const [x, y] of [[13, cy - 1], [22, cy + 2], [30, cy - 2]]) put(x, y, 'O'); // 옹이
  }));

  // 9 유니크 — 굳은 바게트 (개그)
  add('unique', '굳은 바게트 🥖', '사람 키만 한 돌덩이 빵입니다.', '기본 공격이 적중하면 4% 확률로 빵조각이 떨어집니다. 빵조각을 주우면 하트 반 칸을 회복하며, 챕터당 3개까지 떨어집니다. 기본 공격이 60회 적중할 때마다 빵이 부서져 3초 동안 반 토막 두 개로 연타합니다.', cellWeapon(35, 9, 2, 4, {
    b: '#c8843a', B: '#8a5420', y: '#f0c878', W: '#fff6e0', d: '#6a3a14',
  }, put => {
    const cy = 4;
    for (let x = 0; x <= 34; x++) {
      const end = Math.min(x, 34 - x), hw = end < 1 ? 1 : end < 3 ? 2 : 3;
      for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw ? 'b' : y >= cy + hw - 1 ? 'B' : 'b');
    }
    for (let k = 0; k < 6; k++) { const x0 = 6 + k * 5; put(x0, cy - 1, 'y'); put(x0 + 1, cy - 2, 'y'); put(x0 + 2, cy - 2, 'y'); put(x0 - 1, cy, 'd'); } // 칼집 무늬
    for (const [x, y] of [[4, cy - 2], [12, cy - 3], [20, cy - 3], [28, cy - 2], [31, cy - 1], [16, cy]]) put(x, y, 'W'); // 밀가루
  }));

  // 10 레전더리 — 태양 서약 대검 (방패 없이: 해 원반 가드 · 리본 · 룬이 타오르는 넓은 날)
  add('legend', '태양 서약 대검', '해 원반 가드와 붉은 리본, 타오르는 룬이 새겨진 넓은 금빛 대검입니다.', '돌진 참격을 2번까지 충전할 수 있습니다. 돌진한 길에 빛의 검기가 남았다가 터집니다.', cellWeapon(46, 21, 6, 10, {
    G: '#ffd34d', g: '#fff2b0', Y: '#c9952a', O: '#8a5a14', w: '#ffffff', l: '#fff4d8', m: '#f0d898', n: '#e0c070', d: '#b08a3a', D: '#7a5a20',
    u: '#ff8a2a', U: '#ffe080', r: '#ff3020', R: '#9a1010', c: '#f4ece0', C: '#c8b898', q: '#d8303a', Q: '#7a1420', s: '#fffbe6',
  }, put => {
    const cy = 10;
    // 손잡이 끝 금 장식 + 보석
    for (const [x, y, c] of [[0, cy, 'Y'], [1, cy - 1, 'G'], [1, cy, 'r'], [1, cy + 1, 'G'], [2, cy - 1, 'G'], [2, cy, 'G'], [2, cy + 1, 'Y'], [1, cy - 2, 'Y'], [1, cy + 2, 'Y']]) put(x, y, c);
    // 감은 손잡이
    for (let x = 3; x <= 8; x++) { put(x, cy, x % 2 ? 'c' : 'C'); put(x, cy - 1, x % 2 ? 'C' : 'Y'); put(x, cy + 1, x % 2 ? 'Y' : 'C'); }
    // 붉은 리본
    for (const [x, y, c] of [[7, cy + 2, 'q'], [7, cy + 3, 'q'], [6, cy + 4, 'q'], [6, cy + 5, 'Q'], [5, cy + 6, 'q'], [5, cy + 7, 'Q'], [8, cy + 2, 'Q'], [8, cy + 3, 'q'], [9, cy + 4, 'q'], [9, cy + 5, 'Q'], [10, cy + 6, 'q']]) put(x, y, c);
    // 해 원반 가드 (반지름 4) + 빛살 8개
    const gx = 12;
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) { const d = Math.hypot(x, y); if (d > 4.3) continue; put(gx + x, cy + y, d > 3.4 ? 'Y' : d > 2.2 ? 'G' : (x + y < 0 ? 'g' : 'G')); }
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, -1], [1, 1], [-1, -1], [-1, 1]]) for (let k = 5; k <= 7; k++) { const x = gx + Math.round(dx * k * (dy && dx ? 0.75 : 1)), y = cy + Math.round(dy * k * (dy && dx ? 0.75 : 1)); put(x, y, k === 7 ? 'g' : 'G'); }
    for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) if (Math.abs(x) + Math.abs(y) <= 1) put(gx + x, cy + y, 'r');
    put(gx, cy, 'U'); put(gx - 1, cy - 1, 'w');
    // 넓은 날
    const L = 30;
    for (let t = 0; t < L; t++) {
      const x = 16 + t, hw = t < 17 ? 4 : t < 22 ? 3 : t < 26 ? 2 : t < 29 ? 1 : 0;
      for (let y = cy - hw; y <= cy + hw; y++) {
        let c = 'm';
        if (y === cy - hw) c = 'w'; else if (y === cy - hw + 1) c = 'l'; else if (y === cy + hw) c = 'D'; else if (y === cy + hw - 1) c = 'd'; else if (Math.abs(y - cy) <= 1 && hw >= 3) c = 'n';
        put(x, y, c);
      }
      if (t > 1 && t < 22) { put(x, cy, t % 4 === 0 ? 'U' : 'u'); if (t % 4 === 2) { put(x, cy - 1, 'u'); put(x, cy + 1, 'u'); } } // 타오르는 룬 홈
      if (t === L - 1) put(x, cy, 's');
    }
  }));

  // 11 레전더리 — 잿빛 왕의 처형검 (크고 묵직하게: 해골 머리 · 왕관 가드 · 감긴 사슬 · 녹아내리는 균열)
  add('legend', '잿빛 왕의 처형검', '왕관 가드와 감긴 사슬, 검은 날에 잿불 균열이 녹아 흐르는 검입니다.', '3타가 잿불 장판을 남깁니다. 각성하면 거대한 처형검이 떨어집니다.', cellWeapon(44, 19, 6, 9, {
    i: '#e8dcc0', j: '#a89a7a', h: '#1a1214', H: '#3a2a26', G: '#c9a24a', g: '#ffe08a', Y: '#8a6420', K: '#221e20', N: '#2e292b', m: '#433c3e', l: '#7a7276', L: '#a8a0a2',
    r: '#ff4030', R: '#8a1410', y: '#ffd060', e: '#ffb040', c: '#6a6e78', C: '#3a3c44', E: '#ff6a2a',
  }, put => {
    const cy = 9;
    // 해골 손잡이 끝
    for (const [x, y, c] of [[0, cy - 1, 'i'], [1, cy - 1, 'i'], [2, cy - 1, 'i'], [0, cy, 'i'], [1, cy, 'R'], [2, cy, 'i'], [0, cy + 1, 'j'], [1, cy + 1, 'i'], [2, cy + 1, 'j'], [1, cy - 2, 'i'], [3, cy, 'j']]) put(x, y, c);
    put(1, cy, 'r');
    // 검은 가죽 손잡이 + 금실
    for (let x = 4; x <= 9; x++) { put(x, cy, x % 2 ? 'H' : 'h'); put(x, cy - 1, x % 2 ? 'G' : 'h'); put(x, cy + 1, x % 2 ? 'h' : 'G'); }
    // 왕관 가드: 가운데 기둥 + 위아래 세 갈래 왕관 끝
    for (let y = 1; y <= 17; y++) { put(10, y, 'G'); put(11, y, 'Y'); put(12, y, 'G'); }
    for (const sg of [-1, 1]) {
      for (const dx of [0, 1, 2]) { put(10 + dx, cy + sg * 9, dx === 1 ? 'g' : 'G'); }
      put(9, cy + sg * 7, 'G'); put(8, cy + sg * 8, 'g'); put(13, cy + sg * 7, 'G'); put(14, cy + sg * 8, 'g');
      put(11, cy + sg * 9, 'r'); put(11, cy + sg * 5, 'r'); put(11, cy + sg * 4, 'R');
    }
    put(11, cy, 'y'); put(10, cy, 'r'); put(12, cy, 'r'); put(11, cy - 1, 'r'); put(11, cy + 1, 'r');
    // 날: 넓고 끝이 네모난 처형검
    const x0 = 13, x1 = 43, hw = 6;
    for (let x = x0; x <= x1; x++) for (let y = cy - hw; y <= cy + hw; y++) {
      if (x === x1 && Math.abs(y - cy) === hw) continue; // 모서리 깎기
      let c = y === cy - hw ? 'L' : y === cy - hw + 1 ? 'l' : y === cy + hw ? 'K' : (y - cy + hw) % 4 === 0 ? 'N' : 'm';
      if (x > 38) c = y === cy - hw ? 'L' : (y === cy + hw ? 'K' : 'N');
      put(x, y, c);
    }
    // 녹아내리는 균열: 가운데를 지그재그로 흐르는 줄기 + 가지
    let yy = cy;
    for (let x = x0 + 4; x <= x1 - 3; x++) {
      yy += [0, 1, 0, -1, -1, 0, 1, 1][x % 8]; yy = Math.max(cy - 3, Math.min(cy + 3, yy));
      put(x, yy, 'y'); put(x, yy + 1, 'r'); if (x % 2) put(x, yy - 1, 'R');
      if (x % 7 === 0) { put(x, yy - 2, 'r'); put(x + 1, yy - 3, 'R'); }
      if (x % 9 === 4) { put(x, yy + 2, 'r'); put(x - 1, yy + 3, 'R'); }
    }
    // 처형검 구멍 (붉은 테)
    for (const [x, y] of [[39, cy - 2], [40, cy - 2], [39, cy - 1], [40, cy - 1]]) put(x, y, '.');
    for (const [x, y] of [[38, cy - 2], [38, cy - 1], [41, cy - 2], [41, cy - 1], [39, cy - 3], [40, cy - 3], [39, cy], [40, cy]]) put(x, y, 'R');
    // 날 뿌리에 감긴 사슬
    for (let k = 0; k < 4; k++) { const x = 14 + k * 2; put(x, cy - hw + k * 3, 'c'); put(x + 1, cy - hw + k * 3 + 1, 'C'); put(x, cy - hw + k * 3 + 2, 'c'); }
  }));
  return W;
};

// 어세신 · 마법사 · 사제 · 거너 무기 시안 — cellWeapon(w, h, px, py, pal, draw). 1칸 = 2px, 오른쪽이 끝, (px,py) 손잡이 축
(() => {
  const disc = (put, cx, cy, rx, ry, f) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const d = (x * x) / (rx * rx + 0.4) + (y * y) / (ry * ry + 0.4); if (d <= 1) f(cx + x, cy + y, x, y, d); } };
  const line = (put, x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); };

  // ================= 어세신 (쌍검 — 양손에 같은 무기)
  WF.ranger = H => {
    const { cellWeapon: cw, WEAP } = H, W = [], add = (g, n, l, s, w) => W.push({ grade: g, name: n, look: l, skill: s, w });
    add('common', '쌍단검', '어세신의 기본 쌍검입니다.', '—', WEAP.ranger[0]);
    add('rare', '고양이 발톱 🐾', '고양이 발 모양의 쇠발톱 장갑입니다.', '공격 속도가 증가합니다. 3타에 세 줄로 할퀴어 출혈을 일으킵니다.', cw(17, 11, 3, 5, { f: '#6a4a32', F: '#8a6a4a', p: '#f0a0b0', P: '#c87080', m: '#a8acb4', w: '#eef2f6', d: '#5a6068' }, put => {
      const cy = 5; disc(put, 4, cy, 3, 3, (x, y, dx, dy, d) => put(x, y, d > 0.7 ? 'f' : 'F'));
      put(5, cy, 'p'); put(4, cy + 1, 'p'); put(5, cy + 1, 'P'); for (const y of [cy - 2, cy, cy + 2]) put(7, y, 'p');
      for (const [k, y0] of [[0, cy - 3], [1, cy], [2, cy + 3]]) { for (let t = 0; t < 9; t++) { const x = 8 + t, y = y0 - Math.round(t * t / 22); put(x, y, t > 6 ? 'w' : t % 2 ? 'm' : 'd'); if (t < 6) put(x, y + 1, 'd'); } }
    }));
    add('rare', '말린 고등어 쌍칼 🐟', '바짝 말린 고등어 두 마리입니다.', '적을 처치하면 생선 뼈가 다음 적에게 튕겨 갑니다. 때릴 때 「찰싹」 소리가 납니다.', cw(18, 7, 2, 3, { g: '#3e6a6a', G: '#2a4448', s: '#c8c0a0', S: '#a89878', b: '#1a2a2c', k: '#0b0a0e', W: '#ffffff', t: '#8a7a50' }, put => {
      const cy = 3; put(0, cy - 2, 'G'); put(0, cy + 2, 'G'); put(1, cy - 1, 'G'); put(1, cy + 1, 'G'); put(1, cy, 'g'); put(2, cy, 'g');
      for (let x = 3; x <= 17; x++) { const hw = x < 5 ? 1 : x > 15 ? 1 : 2; for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y < cy ? ((x + y) % 3 === 0 ? 'b' : 'g') : y === cy ? 't' : 'S'); }
      put(15, cy - 1, 'k'); put(16, cy - 1, 'W'); put(17, cy, 'k'); put(13, cy, 'G'); put(13, cy + 1, 'G');
    }));
    add('rare', '쌍낫', '작은 사신 낫 두 자루입니다.', '3타에 낫 하나를 부메랑처럼 던졌다가 다시 받습니다.', cw(15, 12, 2, 8, { h: '#3a2a20', H: '#5a4232', G: '#8a8a94', m: '#a8acb4', w: '#eef2f6', d: '#4a4e58' }, put => {
      const cy = 8; for (let x = 0; x < 9; x++) put(x, cy, x % 2 ? 'h' : 'H'); put(9, cy, 'G'); put(9, cy - 1, 'G');
      for (let t = 0; t <= 10; t++) { const a = Math.PI * (0.55 + t * 0.075), x = 9 + Math.round(Math.cos(a - Math.PI) * -5) , y = cy - 2 - Math.round(Math.sin(a) * 6); put(x + 1, y, t > 8 ? 'w' : 'm'); put(x + 1, y + 1, 'd'); if (t < 9) put(x, y, 'w'); }
    }));
    add('rare', '철부채', '접이식 쇠부채입니다.', '3타에 바람 칼날을 날립니다. 공격 중에는 정면에서 날아오는 투사체를 튕겨냅니다.', cw(15, 11, 2, 5, { k: '#2a2228', m: '#8a8e98', w: '#d8dce4', r: '#b0242c', R: '#701418', G: '#c9a24a' }, put => {
      const cy = 5; put(0, cy, 'G'); put(1, cy, 'k'); put(2, cy, 'G');
      for (let x = 3; x <= 14; x++) { const hw = Math.min(5, Math.round((x - 2) * 0.48)); for (let y = cy - hw; y <= cy + hw; y++) { const rib = (y - cy + 6) % 3 === 0; put(x, y, x === 14 || Math.abs(y - cy) === hw ? 'w' : rib ? 'm' : ((x + y) % 2 ? 'r' : 'R')); } }
    }));
    add('rare', '재봉 바늘', '붉은 실이 늘어진 거대한 바늘입니다.', '찌르기 위주로 공격합니다. 치명타를 맞은 적은 실에 1초 동안 묶입니다.', cw(20, 9, 2, 3, { m: '#b8bcc4', w: '#f4f6fa', d: '#6a6e78', t: '#c0303a', T: '#7a1420' }, put => {
      const cy = 3; for (let x = 0; x <= 19; x++) { put(x, cy, x > 16 ? 'w' : 'm'); if (x < 15) put(x, cy + 1, 'd'); } put(2, cy, '.'); put(3, cy, '.');
      for (const [x, y] of [[2, cy + 2], [1, cy + 3], [1, cy + 4], [2, cy + 5], [4, cy + 5], [5, cy + 4], [3, cy + 6]]) put(x, y, (x + y) % 2 ? 't' : 'T');
    }));
    add('unique', '그림자 사슬낫', '검은 사슬이 달린 쿠사리가마입니다.', '그림자 도약 대신 사슬을 겁니다. 큰 적에게는 내가 끌려가고, 작은 적은 끌어옵니다.', cw(18, 13, 4, 6, { h: '#1a1420', H: '#3a2a48', c: '#5a5a6a', C: '#2a2a34', m: '#6a5a8a', w: '#d8c8ff', p: '#a070ff' }, put => {
      const cy = 6; for (let x = 0; x < 9; x++) put(x, cy, x % 2 ? 'h' : 'H');
      for (let t = 0; t <= 9; t++) { const x = 9 + Math.round(Math.sin(t * 0.33) * 6), y = cy - 1 - t * 0.55; put(x, Math.round(y), t > 7 ? 'w' : 'm'); put(x - 1, Math.round(y) + 1, 'p'); }
      for (let i = 0; i < 6; i++) { put(3 - (i % 2), cy + 2 + i, i % 2 ? 'c' : 'C'); } put(2, cy + 8, 'm'); put(3, cy + 9, 'm');
    }));
    add('unique', '털실 뭉치 🧶', '뜨개바늘에 꽂힌 털실 공입니다.', '털실이 엉켜 적이 감소합니다. 털실이 3겹 쌓이면 근처 적끼리 묶입니다.', cw(16, 11, 2, 5, { n: '#c8b080', N: '#8a7450', y: '#e85a7a', Y: '#b03050', l: '#ff9ab0', s: '#ffd0dc' }, put => {
      const cy = 5; for (let x = 0; x <= 15; x++) put(x, cy - 1 + (x > 13 ? 0 : 0), x % 3 ? 'n' : 'N');
      disc(put, 9, cy, 4, 4, (x, y, dx, dy, d) => put(x, y, (dx * 2 + dy) % 3 === 0 ? 'Y' : d < 0.3 ? 'l' : (dx - dy) % 4 === 0 ? 'l' : 'y'));
      put(8, cy - 2, 's'); put(7, cy - 3, 's'); put(13, cy + 3, 'y'); put(14, cy + 4, 'Y'); put(15, cy + 4, 'y');
    }));
    add('unique', '쌍둥이 달', '은빛과 흑빛의 초승달 쌍검입니다.', '번갈아 치면 은색과 흑색 표식이 남습니다. 두 표식이 모두 묻은 적에게는 달 폭발이 일어납니다.', cw(16, 13, 2, 6, { h: '#2a2a3a', H: '#4a4a6a', s: '#e8eef8', S: '#a8b8d0', k: '#2a2440', K: '#5a4a8a', g: '#9fd2ff' }, put => {
      const cy = 6; for (let x = 0; x < 5; x++) put(x, cy, x % 2 ? 'h' : 'H');
      disc(put, 10, cy, 5, 6, (x, y, dx, dy, d) => { const inner = ((dx + 2.6) ** 2) / 20 + (dy ** 2) / 26; if (inner < 1) return; put(x, y, dy < 0 ? (d > 0.75 ? 'S' : 's') : (d > 0.75 ? 'k' : 'K')); });
      put(5, cy, 'g'); put(4, cy - 1, 'g'); put(4, cy + 1, 'g');
    }));
    add('legend', '쌍둥이 송곳니', '작은 박쥐 날개 가드에 핏줄 홈이 빛나는 송곳니입니다.', '퍼펙트 회피에 성공하면 그림자 도약이 바로 충전됩니다. 도약한 뒤 2초 동안 투명해집니다.', cw(22, 9, 4, 4, { h: '#1a0a0e', H: '#4a1418', G: '#c9a24a', g: '#ffe08a', i: '#f8f0e0', I: '#d8c8a8', j: '#9a8a6a', J: '#6a5a42', r: '#ff3040', R: '#8a1018', w: '#3a1a2a', W: '#6a2a3a' }, put => {
      const cy = 4; put(0, cy, 'g'); put(1, cy, 'r'); for (let x = 2; x < 6; x++) put(x, cy, x % 2 ? 'h' : 'H');
      for (const sg of [-1, 1]) { put(6, cy + sg, 'w'); put(6, cy + sg * 2, 'W'); put(5, cy + sg * 3, 'w'); put(7, cy + sg, 'G'); }
      put(6, cy, 'G'); put(7, cy, 'r');
      for (let t = 0; t < 14; t++) { const x = 8 + t, hw = t < 8 ? 1 : t < 12 ? 1 : 0, bend = Math.round(t * t / 50);
        for (let y = cy - hw; y <= cy + hw; y++) put(x, y - bend, y === cy - hw ? 'i' : y === cy + hw ? 'J' : (t % 3 === 1 && t < 11 ? 'r' : 'I'));
        if (t % 3 === 0 && t < 11) put(x, cy + hw + 1 - bend, 'j'); }
    }));
    add('legend', '아홉 목숨', '작은 고양이 귀 가드와 고양이 눈 보석, 혼불 꼬리가 달린 혼의 칼입니다.', '쓰러지면 한 번 되살아납니다. 적을 처치할 때마다 고양이 유령이 나타나 공격을 따라 합니다.', cw(24, 11, 6, 5, { h: '#1a1430', H: '#3a2a60', G: '#b8a8ff', g: '#e8e0ff', e: '#ffe060', E: '#1a1020', w: '#ffffff', c: '#c8b8ff', C: '#8a7ae8', D: '#5a4ab8', t: '#7af0ff', T: '#3aa0e0' }, put => {
      const cy = 5; for (let x = 3; x < 8; x++) put(x, cy, x % 2 ? 'h' : 'H');
      for (const [x, y, c] of [[2, cy, 'T'], [1, cy, 't'], [0, cy - 1, 'w'], [2, cy - 1, 'T'], [1, cy - 2, 't'], [2, cy + 1, 'T'], [1, cy + 2, 't'], [0, cy + 3, 'w']]) put(x, y, c); // 혼불 꼬리 셋
      for (let y = cy - 2; y <= cy + 2; y++) put(8, y, 'G'); put(8, cy - 3, 'g'); put(8, cy + 3, 'g'); put(9, cy - 3, 'g'); put(9, cy + 3, 'g'); // 작은 고양이 귀
      put(9, cy, 'e'); put(9, cy - 1, 'E'); put(9, cy + 1, 'E');
      for (let t = 0; t < 14; t++) { const x = 10 + t, hw = t < 9 ? 1 : t < 13 ? 1 : 0, bend = Math.round(t * t / 60);
        for (let y = cy - hw; y <= cy + hw; y++) put(x, y - bend, y === cy - hw ? 'w' : y === cy + hw ? 'D' : 'c'); }
    }));
    return W;
  };

  // ================= 마법사 (지팡이)
  WF.mage = H => {
    const { cellWeapon: cw, WEAP } = H, W = [], add = (g, n, l, s, w) => W.push({ grade: g, name: n, look: l, skill: s, w });
    add('common', '견습 지팡이', '마법사의 기본 지팡이입니다.', '—', WEAP.mage[0]);
    add('rare', '큰 양초', '녹아내리는 거대한 양초 지팡이입니다.', '기본 공격이 촛농이 되어, 떨어진 자리에 작은 화상 장판을 남깁니다.', cw(28, 11, 5, 5, { b: '#8a6a30', B: '#c9a24a', w: '#f4ecdc', W: '#c8bca8', k: '#2a2020', y: '#ffd060', o: '#ff8a2a', r: '#ff4030', s: '#fff8d8' }, put => {
      const cy = 5; for (let x = 0; x < 7; x++) put(x, cy, x % 2 ? 'b' : 'B'); for (let y = cy - 2; y <= cy + 2; y++) put(7, y, 'B');
      for (let x = 8; x <= 21; x++) for (let y = cy - 2; y <= cy + 2; y++) put(x, y, y === cy - 2 ? 'w' : y === cy + 2 ? 'W' : 'w');
      for (const [x, d] of [[10, 2], [14, 3], [18, 1], [20, 2]]) for (let i = 1; i <= d; i++) put(x, cy + 2 + i, 'w');
      put(22, cy, 'k'); for (const [x, y, c] of [[23, cy, 'y'], [24, cy, 'y'], [25, cy, 'o'], [26, cy, 'r'], [23, cy - 1, 'o'], [24, cy - 1, 'y'], [23, cy + 1, 'o'], [24, cy + 1, 's'], [25, cy - 1, 'r']]) put(x, y, c);
    }));
    add('rare', '낚싯대 🎣', '찌가 달랑거리는 대나무 낚싯대입니다.', '기본 공격 대신 찌를 던져 적을 끌어옵니다. 찌가 적중하면 4% 확률로 물고기가 떨어집니다. 물고기를 주우면 하트 반 칸을 회복하며, 챕터당 3마리까지 떨어집니다.', cw(32, 13, 5, 4, { b: '#8a9a4a', B: '#5a6a2a', r: '#4a4c54', R: '#8a8e98', l: '#d8d8d0', c: '#e83a30', W: '#ffffff' }, put => {
      const cy = 4; for (let x = 0; x <= 30; x++) put(x, cy - (x > 20 ? 1 : 0), x % 6 === 0 ? 'B' : 'b'); put(4, cy + 1, 'r'); put(5, cy + 1, 'R'); put(4, cy + 2, 'r'); put(5, cy + 2, 'r');
      for (let y = cy; y <= cy + 6; y++) put(31, y, 'l'); put(31, cy + 7, 'c'); put(30, cy + 7, 'c'); put(31, cy + 8, 'W'); put(30, cy + 8, 'W'); put(31, cy + 9, 'l');
    }));
    add('rare', '수정 원석 홀', '거친 수정 무더기를 단 홀입니다.', '기본 공격이 벽이나 장애물에 한 번 반사됩니다.', cw(28, 13, 5, 6, { h: '#5a3a22', H: '#7a5232', c: '#6ae0ff', C: '#2a8ad0', w: '#e0faff', p: '#b070ff', P: '#6a30b0' }, put => {
      const cy = 6; for (let x = 0; x < 17; x++) put(x, cy, x % 3 ? 'h' : 'H');
      const shard = (x0, y0, len, dy, c1, c2) => { for (let i = 0; i < len; i++) { put(x0 + i, y0 + Math.round(i * dy), i === len - 1 ? 'w' : c1); put(x0 + i, y0 + Math.round(i * dy) + 1, c2); } };
      shard(17, cy, 9, 0, 'c', 'C'); shard(17, cy - 2, 7, -0.45, 'p', 'P'); shard(17, cy + 1, 7, 0.5, 'c', 'C'); shard(18, cy - 1, 5, -0.9, 'c', 'C'); shard(18, cy + 2, 4, 0.9, 'p', 'P');
    }));
    add('rare', '마녀 빗자루 🧹', '지팡이 대신 쓰는 빗자루입니다.', '점멸이 짧은 비행으로 바뀝니다. 구멍과 장판을 넘어가며 먼지 구름을 남깁니다.', cw(30, 13, 5, 6, { h: '#6a4a2a', H: '#8a6a3a', s: '#d8b860', S: '#a8883a', r: '#a03a2a' }, put => {
      const cy = 6; for (let x = 0; x < 19; x++) put(x, cy, x % 4 ? 'h' : 'H'); put(19, cy - 1, 'r'); put(19, cy, 'r'); put(19, cy + 1, 'r');
      for (let x = 20; x <= 29; x++) { const hw = Math.min(5, 1 + Math.round((x - 20) * 0.55)); for (let y = cy - hw; y <= cy + hw; y++) if (x < 29 || (y + x) % 2) put(x, y, (y + x) % 3 ? 's' : 'S'); }
    }));
    add('rare', '해골 홀', '척추뼈 자루 끝에 해골이 달린 지팡이입니다.', '처치한 적의 20%가 해골 망령으로 일어나 5초 동안 함께 싸웁니다.', cw(26, 11, 5, 5, { i: '#e8dcc0', I: '#b8a888', j: '#7a6e58', k: '#0b0a0e', e: '#7aff7a' }, put => {
      const cy = 5; for (let x = 0; x < 17; x++) { put(x, cy, x % 3 === 0 ? 'I' : 'i'); if (x % 3 === 0) { put(x, cy - 1, 'I'); put(x, cy + 1, 'j'); } }
      disc(put, 21, cy - 1, 4, 3, (x, y, dx, dy, d) => put(x, y, d > 0.75 ? 'I' : 'i')); for (let x = 19; x <= 23; x++) put(x, cy + 2, x % 2 ? 'i' : 'j'); put(21, cy + 3, 'j');
      put(20, cy - 1, 'k'); put(22, cy - 1, 'k'); put(20, cy, 'e'); put(22, cy, 'e'); put(21, cy + 1, 'k');
    }));
    add('unique', '피뢰침', '구리 고리를 감은 쇠막대로, 끝이 세 갈래로 갈라져 있습니다.', '3발째마다 낙뢰가 떨어지고, 맞은 적 사이로 번개가 이어집니다.', cw(28, 11, 5, 5, { i: '#4a4c54', I: '#7a7e88', c: '#c87a3a', C: '#8a4a20', e: '#9fe8ff', E: '#ffffff' }, put => {
      const cy = 5; for (let x = 0; x < 22; x++) put(x, cy, 'i'); for (const x of [8, 11, 14, 17]) for (let y = cy - 2; y <= cy + 2; y++) put(x, y, y === cy - 2 ? 'c' : 'C');
      for (let x = 22; x <= 26; x++) { put(x, cy, x === 26 ? 'E' : 'I'); } put(23, cy - 1, 'I'); put(24, cy - 2, 'I'); put(25, cy - 3, 'E'); put(23, cy + 1, 'I'); put(24, cy + 2, 'I'); put(25, cy + 3, 'E');
      put(26, cy - 2, 'e'); put(27, cy - 1, 'e'); put(26, cy + 2, 'e'); put(27, cy + 1, 'e');
    }));
    add('unique', '국자 🥄', '자루 끝에 고리가 달린 커다란 국자로, 수프가 찰랑거립니다.', '화염구 대신 끓는 수프를 던집니다. 적은 화상을 입고, 내가 밟으면 조금 회복합니다.', cw(31, 14, 4, 4, { m: '#9aa0a8', l: '#e0e4ea', d: '#5a6068', s: '#e8903a', S: '#c05a1a', g: '#7ab040', w: '#f0f2f4' }, put => {
      const cy = 4; put(0, cy - 1, 'm'); put(0, cy, 'd'); put(0, cy + 1, 'm'); put(1, cy - 2, 'm'); put(1, cy + 2, 'm'); put(2, cy - 2, 'd'); put(2, cy + 2, 'd'); // 자루 끝 걸이 고리
      for (let x = 2; x <= 17; x++) { put(x, cy, x === 3 ? 'd' : 'm'); put(x, cy - 1, x > 3 && x < 17 ? 'l' : '.'); }
      put(17, cy + 1, 'm'); put(18, cy + 1, 'm'); put(18, cy + 2, 'm'); put(19, cy + 2, 'd'); // 아래로 꺾인 목
      const bx = 24, ry = cy + 3; // 그릇: 테두리 + 반구
      for (let x = bx - 6; x <= bx + 6; x++) put(x, ry, Math.abs(x - bx) === 6 ? 'm' : 'l');
      for (let dy = 1; dy <= 6; dy++) { const hw = Math.round(Math.sqrt(36 - dy * dy * 0.9)); for (let dx = -hw; dx <= hw; dx++) put(bx + dx, ry + dy, Math.abs(dx) === hw || dy === 6 ? 'd' : dx < -2 && dy < 4 ? 'l' : 'm'); }
      for (let x = bx - 5; x <= bx + 5; x++) put(x, ry - 1, (x % 4 === 0) ? 'g' : (x % 3 === 0 ? 'S' : 's')); put(bx - 2, ry - 2, 's'); put(bx + 1, ry - 2, 'S'); put(bx + 3, ry - 2, 's'); // 넘칠 듯한 수프
      put(bx - 3, ry - 4, 'w'); put(bx - 2, ry - 5, 'w'); put(bx + 1, ry - 4, 'w'); put(bx + 2, ry - 6, 'w'); put(bx + 4, ry - 5, 'w'); // 김
    }));
    add('unique', '거울 지팡이', '금테 손거울이 달린 지팡이입니다.', '화염구가 거울 분신에서도 함께 나갑니다.', cw(28, 13, 5, 6, { h: '#3a2430', H: '#5a3a4a', G: '#c9a24a', g: '#ffe08a', m: '#a8c8e8', M: '#6a8ab0', w: '#f0faff' }, put => {
      const cy = 6; for (let x = 0; x < 17; x++) put(x, cy, x % 4 ? 'h' : 'G');
      disc(put, 22, cy, 5, 5, (x, y, dx, dy, d) => put(x, y, d > 0.68 ? (d > 0.86 ? 'G' : 'g') : (dx + dy < -2 ? 'w' : dx - dy > 2 ? 'M' : 'm')));
      put(20, cy - 2, 'w'); put(21, cy - 3, 'w'); put(19, cy - 1, 'w');
    }));
    add('legend', '잿빛 별의 홀', '재가 도는 별 보주와 초승달 뿔, 금 자루로 된 홀입니다.', '화염구가 3갈래로 나가고, 운석이 작은 운석 5개로 쪼개집니다.', cw(34, 17, 5, 8, { h: '#c9a24a', H: '#ffe08a', G: '#8a6420', K: '#2a2628', m: '#4a4246', r: '#ff4030', y: '#ffd060', o: '#ff8a2a', c: '#ffe08a', C: '#c9952a', s: '#fff4c0' }, put => {
      const cy = 8; for (let x = 0; x < 20; x++) put(x, cy, x % 5 === 0 ? 'G' : x % 2 ? 'h' : 'H');
      for (let y = cy - 3; y <= cy + 3; y++) put(20, y, 'C'); put(21, cy - 3, 'c'); put(21, cy + 3, 'c');
      disc(put, 26, cy, 5, 5, (x, y, dx, dy, d) => put(x, y, d < 0.15 ? 'y' : d < 0.35 ? 'o' : d < 0.55 ? ((dx + dy) % 2 ? 'r' : 'm') : (dx * 3 + dy) % 5 === 0 ? 'r' : d > 0.85 ? 'K' : 'm'));
      for (const sg of [-1, 1]) { for (let i = 0; i < 6; i++) put(21 + Math.round(i * 0.6), cy + sg * (6 + Math.round(Math.sin(i * 0.5) * 2)), i > 3 ? 's' : 'c'); put(24, cy + sg * 7, 'c'); }
      for (const [x, y] of [[32, cy], [26, cy - 6], [26, cy + 6], [31, cy - 4], [31, cy + 4]]) put(x, y, 's');
    }));
    add('legend', '모래시계 지팡이', '금 톱니 고리에 둘러싸인, 거꾸로 흐르는 모래시계입니다.', '각성하면 3초 동안 시간이 멈춥니다. 시간이 다시 흐르는 순간 그동안 넣은 피해가 한꺼번에 들어갑니다.', cw(34, 17, 5, 8, { h: '#2a1a3a', H: '#4a2a5a', G: '#ffd34d', g: '#fff2b0', Y: '#c9952a', w: '#d8f0ff', W: '#ffffff', s: '#ffd080', S: '#e0a040', b: '#5a8ac0' }, put => {
      const cy = 8; for (let x = 0; x < 20; x++) put(x, cy, x % 4 ? 'h' : 'G');
      disc(put, 26, cy, 7, 7, (x, y, dx, dy, d) => { if (d > 0.78 && d <= 1) put(x, y, (Math.round(Math.atan2(dy, dx) * 4) % 2) ? 'G' : 'Y'); });
      for (let dy = -5; dy <= 5; dy++) { const hw = Math.max(0, Math.abs(dy) - 1); for (let dx = -hw; dx <= hw; dx++) put(26 + dx, cy + dy, Math.abs(dy) === 5 ? 'G' : (dy < 0 && Math.abs(dy) < 4) ? (dx === 0 || Math.abs(dy) > 2 ? 's' : 'w') : dy > 1 && dy < 4 ? 'w' : dy >= 4 ? 'S' : 'w'); put(26 - hw - 1, cy + dy, 'Y'); put(26 + hw + 1, cy + dy, 'Y'); }
      for (let dx = -5; dx <= 5; dx++) { put(26 + dx, cy - 6, 'G'); put(26 + dx, cy + 6, 'G'); } put(26, cy, 's'); put(25, cy - 3, 'W');
    }));
    return W;
  };

  // ================= 사제 (메이스)
  WF.priest = H => {
    const { cellWeapon: cw, WEAP } = H, W = [], add = (g, n, l, s, w) => W.push({ grade: g, name: n, look: l, skill: s, w });
    add('common', '순례자의 메이스', '사제의 기본 메이스입니다.', '—', WEAP.priest[0]);
    add('rare', '향로 철퇴', '사슬에 매단 흔들 향로입니다.', '휘두르면 향 연기가 퍼집니다. 연기 안에서는 공격을 흘려낼 확률이 20%p 증가합니다.', cw(21, 11, 2, 5, { h: '#6b4a2a', G: '#c9a24a', g: '#ffe08a', c: '#8a8a94', b: '#a07030', B: '#5a3a14', e: '#ff8a2a', s: '#c8c0b8' }, put => {
      const cy = 5; for (let x = 0; x < 8; x++) put(x, cy, x === 0 || x === 7 ? 'G' : 'h'); for (let x = 8; x < 12; x++) put(x, cy, x % 2 ? 'c' : '.');
      disc(put, 16, cy, 4, 4, (x, y, dx, dy, d) => put(x, y, dy === -3 ? 'g' : (d < 0.5 && (dx + dy) % 2 === 0) ? 'e' : d > 0.7 ? 'B' : 'b')); put(16, cy - 5, 'G'); put(20, cy, 's'); put(20, cy - 2, 's');
    }));
    add('rare', '프라이팬 🍳', '검게 그을린 무쇠 팬입니다.', '3타에 「팡!」 하고 정면에서 날아오는 투사체를 되받아칩니다.', cw(20, 11, 2, 5, { k: '#2a2628', K: '#1a1618', m: '#4a4448', l: '#8a8288', h: '#5a3a22' }, put => {
      const cy = 5; for (let x = 0; x < 9; x++) put(x, cy, x < 7 ? 'h' : 'k');
      disc(put, 14, cy, 5, 5, (x, y, dx, dy, d) => put(x, y, d > 0.78 ? (dx + dy < 0 ? 'l' : 'k') : d > 0.6 ? 'K' : 'm')); put(12, cy - 2, 'l'); put(13, cy - 3, 'l');
    }));
    add('rare', '성수 물뿌리개', '금 성호가 새겨진 은 물뿌리개로, 꼭지가 해바라기 모양입니다.', '기본 공격 중 부채꼴로 성수를 뿌립니다. 언데드가 나오는 2장과 4장에서는 피해가 30% 증가합니다.', cw(27, 15, 1, 8, { m: '#b8bcc4', l: '#eef2f6', d: '#6a6e78', D: '#4a4e58', w: '#9fe8ff', W: '#ffffff', G: '#e8c060' }, put => {
      const cy = 8; for (let y = cy - 2; y <= cy + 2; y++) put(1, y, 'm'); put(2, cy - 3, 'm'); put(3, cy - 3, 'm'); put(4, cy - 3, 'd'); put(2, cy + 3, 'm'); put(3, cy + 3, 'm'); put(4, cy + 3, 'd'); // 뒤 손잡이 고리
      for (let x = 5; x <= 14; x++) for (let y = cy - 4; y <= cy + 4; y++) { if ((x === 5 || x === 14) && Math.abs(y - cy) === 4) continue; put(x, y, y === cy - 4 ? 'l' : y === cy + 4 || x === 14 ? 'd' : x === 5 ? 'l' : 'm'); }
      for (let x = 7; x <= 12; x++) put(x, cy - 5, x === 7 || x === 12 ? 'd' : 'l'); // 뚜껑
      for (let y = cy - 2; y <= cy + 2; y++) put(9, y, 'G'); put(8, cy - 1, 'G'); put(10, cy - 1, 'G'); // 금 성호
      for (let i = 0; i < 8; i++) { put(15 + i, cy + 2 - i, 'm'); put(15 + i, cy + 3 - i, 'D'); } // 길게 뻗은 꼭지
      for (let k = -2; k <= 2; k++) { put(23 + (k > 0 ? 1 : 0), cy - 6 + k, k === 0 ? 'l' : 'm'); put(24 + (k > 0 ? 1 : 0), cy - 6 + k, 'd'); } put(22, cy - 7, 'm'); put(23, cy - 5, 'm'); // 해바라기 꼭지
      put(26, cy - 8, 'w'); put(26, cy - 5, 'W'); put(26, cy - 2, 'w'); // 물방울
    }));
    add('rare', '당근 메이스 🥕', '잎이 흔들리는 거대한 당근입니다.', '치유의 빛을 사용하면 당근 3개가 사방으로 튀어 박힙니다. 적을 처치하면 4% 확률로 당근이 떨어집니다. 당근을 주우면 하트 반 칸을 회복하며, 챕터당 3개까지 떨어집니다.', cw(21, 9, 4, 4, { g: '#5ab040', G: '#2a7a20', o: '#f08a2a', O: '#c05a10', y: '#ffb060' }, put => {
      const cy = 4; for (const [x, y] of [[0, cy - 3], [1, cy - 2], [2, cy - 1], [0, cy + 3], [1, cy + 2], [2, cy + 1], [1, cy], [2, cy], [3, cy], [0, cy]]) put(x, y, (x + y) % 2 ? 'g' : 'G');
      for (let x = 4; x <= 20; x++) { const hw = x < 15 ? 2 : x < 19 ? 1 : 0; for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw ? 'y' : y === cy + hw ? 'O' : 'o'); if (x % 4 === 2 && hw) put(x, cy, 'O'); }
    }));
    add('rare', '종탑 망치', '종 모양 머리가 달린 망치입니다.', '3타 충격파의 범위가 두 배가 됩니다.', cw(20, 13, 2, 6, { h: '#6b4a2a', G: '#8a8a94', b: '#b08038', B: '#6a4818', Y: '#e8c070', k: '#3a2810' }, put => {
      const cy = 6; for (let x = 0; x < 12; x++) put(x, cy, x === 0 ? 'G' : 'h');
      for (let x = 12; x <= 18; x++) { const hw = 2 + Math.round((x - 12) * 0.55); for (let y = cy - hw; y <= cy + hw; y++) put(x, y, x === 18 ? 'B' : y === cy - hw ? 'Y' : y === cy + hw ? 'B' : 'b'); } put(19, cy, 'k');
    }));
    add('unique', '성유물함 플레일', '작은 금빛 성물함을 사슬에 단 플레일입니다.', '치유의 빛 방패가 2칸까지 쌓입니다.', cw(23, 13, 2, 6, { h: '#6b4a2a', G: '#c9a24a', g: '#ffe08a', Y: '#8a6420', c: '#8a8a94', r: '#c0303a', w: '#fff8e0' }, put => {
      const cy = 6; for (let x = 0; x < 9; x++) put(x, cy, x === 0 || x === 8 ? 'G' : 'h'); for (let x = 9; x < 13; x++) put(x, cy, x % 2 ? 'c' : '.');
      for (let x = 13; x <= 20; x++) for (let y = cy - 2; y <= cy + 3; y++) put(x, y, y === cy + 3 ? 'Y' : x === 13 || x === 20 ? 'G' : 'g'); for (let i = 0; i < 4; i++) { put(13 + i, cy - 3 - i, 'G'); put(20 - i, cy - 3 - i, 'G'); }
      put(16, cy - 6, 'g'); put(17, cy - 6, 'g'); put(16, cy, 'r'); put(17, cy, 'r'); put(16, cy - 1, 'r'); put(17, cy + 1, 'r'); put(15, cy, 'r'); put(18, cy, 'r'); put(16, cy + 2, 'w');
    }));
    add('unique', '고해의 채찍', '가시가 박힌 가죽 채찍입니다.', '우클릭을 짧게 누르면 치유의 빛을 씁니다. 길게 누르면 하트 반 칸을 바쳐 8초 동안 공격력이 2배가 됩니다.', cw(26, 9, 2, 4, { h: '#3a1a14', H: '#5a2a20', G: '#8a8a94', l: '#7a3a24', L: '#a0503a', t: '#d8d0c0' }, put => {
      const cy = 4; for (let x = 0; x < 7; x++) put(x, cy, x === 0 ? 'G' : x % 2 ? 'h' : 'H');
      for (let x = 7; x <= 25; x++) { const y = cy + Math.round(Math.sin((x - 7) * 0.5) * 2.5); put(x, y, x % 2 ? 'l' : 'L'); if (x % 3 === 0) put(x, y - 1, 't'); }
    }));
    add('unique', '달토끼 떡메 🍡', '떡이 붙은 커다란 나무 떡메입니다.', '3타에 떡을 찧어 적을 떡에 붙여 느리게 합니다. 떡이 붙은 적이 쓰러지면 떡이 터져 주변 적도 붙습니다.', cw(21, 13, 2, 6, { h: '#8a6034', H: '#5a3a1e', w: '#a0743e', W: '#7a5228', r: '#fff8f0', R: '#e0d8d0', p: '#f0a0b0' }, put => {
      const cy = 6; for (let x = 0; x < 12; x++) put(x, cy, x % 3 ? 'h' : 'H');
      for (let x = 12; x <= 19; x++) for (let y = cy - 5; y <= cy + 5; y++) put(x, y, x === 12 || x === 19 ? 'W' : (y === cy - 5 ? 'w' : (x + y) % 5 === 0 ? 'W' : 'w'));
      disc(put, 20, cy + 1, 1, 3, (x, y) => put(x, y, 'r')); put(19, cy + 3, 'r'); put(19, cy + 4, 'R'); put(20, cy - 2, 'p');
    }));
    add('legend', '새벽 성가', '빛 고리가 머리를 감싼 금빛 날개 메이스로, 태양 보석이 박혀 있습니다.', '치유의 빛이 2초 동안 보호막도 함께 줍니다.', cw(31, 19, 3, 9, { h: '#8a6a20', G: '#ffe08a', Y: '#c9952a', m: '#ffd34d', l: '#fffbe6', d: '#a8781a', u: '#ff6a2a', U: '#ffb040', a: '#fff8c0', f: '#ffffff', F: '#ffe8b0', E: '#d8b060' }, put => {
      const cy = 9, hx = 24;
      for (let a = 0; a < 24; a++) { const an = a / 24 * Math.PI * 2; if (a % 2) continue; put(Math.round(hx + Math.cos(an) * 6), Math.round(cy + Math.sin(an) * 6), 'a'); } // 빛 고리
      put(0, cy, 'G'); for (let x = 1; x < 18; x++) put(x, cy, x % 4 === 0 ? 'G' : x < 6 ? (x % 2 ? 'Y' : 'h') : 'h'); // 자루 (손잡이 감김)
      for (const sg of [-1, 1]) for (let i = 0; i < 6; i++) for (let j = 0; j <= Math.min(i, 5 - Math.floor(i / 2)); j++) put(21 - i + j, cy + sg * (2 + i), j === 0 ? 'E' : (i + j) % 2 ? 'F' : 'f'); // 날개
      for (let y = cy - 2; y <= cy + 2; y++) put(19, y, 'Y'); put(20, cy, 'G');
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const d = Math.hypot(dx, dy); if (d > 3.4) continue; put(hx + dx, cy + dy, d > 2.6 ? (dx + dy > 0 ? 'd' : 'G') : dx + dy < -2 ? 'l' : 'm'); }
      put(hx, cy, 'u'); put(hx - 1, cy, 'U'); put(hx, cy - 1, 'U'); put(hx - 1, cy - 1, 'f'); // 태양 보석
      put(hx + 4, cy, 'G'); put(hx + 5, cy, 'l'); put(hx, cy - 4, 'G'); put(hx, cy + 4, 'd'); // 가시
    }));
    add('legend', '날개 달린 성창', '겹깃 천사 날개와 금 십자 코등이, 붉은 리본, 빛나는 잎사귀 창날이 달린 창입니다.', '기적(각성) 중에 성창이 비처럼 떨어집니다. 기적 중 적을 처치하면 기적이 0.5초 증가합니다.', cw(38, 19, 3, 9, { h: '#e8e0cc', H: '#c8bca0', G: '#ffd34d', Y: '#c9952a', f: '#ffffff', F: '#d8e4f0', E: '#a8bcd0', s: '#fffbe6', S: '#ffe08a', r: '#e02a2a', R: '#8a1020' }, put => {
      const cy = 9; put(0, cy, 'G'); for (let x = 1; x < 24; x++) put(x, cy, x % 5 === 0 ? 'G' : x % 2 ? 'h' : 'H');
      for (const sg of [-1, 1]) { for (let i = 0; i < 8; i++) for (let j = 0; j <= Math.min(i, 7 - Math.floor(i / 2)); j++) put(22 - i + j, cy + sg * (2 + i), j === 0 ? 'E' : (i + j) % 2 ? 'F' : 'f'); for (let i = 0; i < 4; i++) put(15 - i, cy + sg * (6 + i), 'E'); } // 겹깃 날개
      for (let y = cy - 3; y <= cy + 3; y++) put(24, y, Math.abs(y - cy) === 3 ? 'Y' : 'G'); put(25, cy, 'r'); put(25, cy - 1, 'G'); put(25, cy + 1, 'G'); // 십자 코등이
      put(23, cy + 1, 'r'); put(22, cy + 2, 'r'); put(23, cy + 3, 'R'); put(22, cy + 4, 'r'); put(21, cy + 5, 'R'); // 리본
      const prof = [1, 2, 2, 3, 3, 3, 2, 2, 2, 1, 1, 0]; prof.forEach((hw, t) => { const x = 26 + t; for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy ? (t < 9 ? 'f' : 's') : y < cy ? (y === cy - hw ? 's' : 'S') : (y === cy + hw ? 'Y' : 'S')); }); // 잎사귀 창날 + 빛 홈
    }));
    return W;
  };

  // ================= 거너 (총)
  WF.gunner = H => {
    const { cellWeapon: cw, WEAP } = H, W = [], add = (g, n, l, s, w) => W.push({ grade: g, name: n, look: l, skill: s, w });
    const stock = (put, cy, c1, c2) => { for (let x = 0; x < 6; x++) { put(x, cy - 1, c1); put(x, cy, c1); put(x, cy + 1, c2); } for (let x = 6; x < 11; x++) put(x, cy, c1); };
    add('common', '낡은 머스킷', '거너의 기본 머스킷입니다.', '—', WEAP.gunner[0]);
    add('rare', '나팔총', '총구가 나팔처럼 벌어진 블런더버스입니다.', '기본 공격이 가까운 거리에 산탄 3발을 쏩니다. 장탄은 3발입니다.', cw(26, 9, 6, 4, { s: '#6b4a2a', S: '#4a3020', b: '#b08038', B: '#e0b860', k: '#3a2810' }, put => {
      const cy = 4; stock(put, cy, 's', 'S'); for (let x = 7; x < 20; x++) put(x, cy - 1, x % 5 === 0 ? 'B' : 'b');
      for (let x = 20; x <= 25; x++) { const hw = Math.round((x - 19) * 0.6); for (let y = cy - 1 - hw; y <= cy - 1 + hw; y++) put(x, y, x === 25 ? 'k' : y === cy - 1 - hw ? 'B' : 'b'); }
    }));
    add('rare', '고래 작살총', '작살을 끼운 굵은 총입니다.', '줄 달린 작살로 처음 맞은 적을 꿰어 끌어옵니다. 끌려오는 동안 그 적은 무적이지만 아무것도 하지 못하고, 큰 적은 경직됩니다. 작살이 감겨 돌아오면 바로 다음 발을 쏠 수 있습니다. 10% 확률로 줄이 걸려 1.6초 동안 다시 장전합니다.', cw(33, 9, 6, 4, { s: '#5a4a3a', S: '#3a2e24', b: '#5a5e68', m: '#a8acb4', w: '#e8ecf0', r: '#c8b080', R: '#8a7450' }, put => {
      const cy = 4; stock(put, cy, 's', 'S'); for (let x = 7; x < 22; x++) { put(x, cy - 1, 'b'); put(x, cy - 2, x % 4 ? 'b' : 'm'); }
      for (let x = 22; x <= 28; x++) put(x, cy - 1, 'm'); for (const [x, y] of [[29, cy - 1], [30, cy - 1], [31, cy - 1], [32, cy - 1], [29, cy - 3], [29, cy + 1], [30, cy - 2], [30, cy], [31, cy - 1]]) put(x, y, 'w');
      for (const [x, y] of [[12, cy + 1], [13, cy + 2], [14, cy + 2], [15, cy + 1], [11, cy + 2], [16, cy + 2]]) put(x, y, (x + y) % 2 ? 'r' : 'R');
    }));
    W[W.length - 1].wEmpty = cw(33, 9, 6, 4, { s: '#5a4a3a', S: '#3a2e24', b: '#5a5e68', m: '#a8acb4', w: '#e8ecf0', r: '#c8b080', R: '#8a7450' }, put => { // 작살을 쏜 뒤: 총구 밖으로 나온 작살대·촉이 없는 모습
      const cy = 4; stock(put, cy, 's', 'S'); for (let x = 7; x < 22; x++) { put(x, cy - 1, 'b'); put(x, cy - 2, x % 4 ? 'b' : 'm'); }
      for (const [x, y] of [[12, cy + 1], [13, cy + 2], [14, cy + 2], [15, cy + 1], [11, cy + 2], [16, cy + 2]]) put(x, y, (x + y) % 2 ? 'r' : 'R');
    });
    add('rare', '오리 사냥총 🦆', '개머리판에 나무 오리가 달린 총으로, 쏘면 「꽥」 소리가 납니다.', '탄이 한 번 튕깁니다. 5발째에는 고무 오리 폭탄이 나갑니다.', cw(28, 9, 6, 5, { s: '#7a5232', S: '#4a3020', b: '#8d9097', B: '#6a6a70', y: '#f0c838', Y: '#c09018', o: '#f08a2a', k: '#0b0a0e' }, put => {
      const cy = 5; stock(put, cy, 's', 'S'); for (let x = 7; x < 27; x++) put(x, cy - 1, x % 6 === 0 ? 'B' : 'b');
      disc(put, 3, cy - 3, 2, 1, (x, y) => put(x, y, 'y')); put(5, cy - 4, 'y'); put(5, cy - 5, 'y'); put(6, cy - 5, 'o'); put(5, cy - 5, 'k'); put(1, cy - 3, 'Y');
    }));
    add('rare', '장총', '총열이 몸의 두 배인 긴 총입니다.', '멈춰서 조준할수록 피해가 커지고, 탄이 적을 꿰뚫습니다.', cw(38, 7, 6, 3, { s: '#5a3a22', S: '#3a2414', b: '#6a6e78', B: '#c9a24a', l: '#a8acb4' }, put => {
      const cy = 3; stock(put, cy, 's', 'S'); for (let x = 7; x < 38; x++) put(x, cy - 1, x % 9 === 0 ? 'B' : 'b'); for (let x = 9; x < 30; x++) if (x % 2) put(x, cy - 2, 'l');
    }));
    add('rare', '쌍리볼버', '리볼버 두 자루입니다.', '장탄 12발로 빠르게 연사하고 재장전도 빠릅니다. 대신 한 발의 위력은 약합니다.', cw(16, 8, 3, 4, { s: '#6b4a2a', S: '#4a3020', b: '#8d9097', B: '#4a4e58', c: '#b8bcc4', G: '#c9a24a' }, put => {
      const cy = 4; for (const [x, y] of [[0, cy + 2], [1, cy + 2], [1, cy + 1], [2, cy + 1], [2, cy], [3, cy], [0, cy + 3], [1, cy + 3]]) put(x, y, (x + y) % 2 ? 's' : 'S');
      for (let x = 4; x <= 7; x++) for (let y = cy - 2; y <= cy; y++) put(x, y, y === cy - 2 ? 'c' : 'B'); put(5, cy - 1, 'G'); for (let x = 8; x <= 15; x++) put(x, cy - 1, 'b'); put(15, cy - 2, 'B'); put(4, cy + 1, 'B');
    }));
    add('unique', '어깨 대포', '어깨에 메는 작은 청동 대포입니다.', '기본 공격이 범위 폭발하는 포탄입니다. 쏠 때마다 반동으로 뒤로 밀려납니다.', cw(29, 11, 6, 5, { b: '#b08038', B: '#6a4818', Y: '#e8c070', k: '#2a1a0a', r: '#c8b080' }, put => {
      const cy = 5; for (let x = 0; x <= 27; x++) { const hw = x < 3 ? 2 : x < 24 ? 3 : 4; for (let y = cy - hw; y <= cy + hw - 1; y++) put(x, y, y === cy - hw ? 'Y' : y === cy + hw - 1 ? 'B' : x % 7 === 3 ? 'Y' : 'b'); }
      for (let y = cy - 3; y <= cy + 2; y++) put(28, y, 'k'); put(0, cy, 'B'); put(-0 + 1, cy + 2, 'r'); for (let x = 4; x < 9; x++) put(x, cy + 3, 'r');
    }));
    add('unique', '복어 발사기 🐡', '살아 있는 복어를 넣어 쏘는 통형 총입니다.', '복어가 적에게 맞으면 부풀어 가시가 터집니다. 가끔 복어가 나가기 싫어 튕겨 나옵니다.', cw(30, 13, 6, 6, { s: '#6b4a2a', S: '#4a3020', b: '#4a7a8a', B: '#2a4a58', y: '#f0d050', Y: '#c0a020', w: '#fff8e0', k: '#0b0a0e', p: '#e8b030' }, put => {
      const cy = 6; stock(put, cy, 's', 'S'); for (let x = 7; x < 22; x++) for (let y = cy - 3; y <= cy - 1; y++) put(x, y, y === cy - 3 ? 'b' : x % 5 === 0 ? 'B' : 'b');
      disc(put, 25, cy - 2, 4, 4, (x, y, dx, dy, d) => put(x, y, dy > 1 ? 'w' : d > 0.75 ? 'Y' : 'y')); for (const [x, y] of [[25, cy - 7], [29, cy - 2], [28, cy - 5], [28, cy + 1], [22, cy - 5], [25, cy + 3]]) put(x, y, 'p');
      put(26, cy - 3, 'k'); put(27, cy - 3, 'w'); put(28, cy - 1, 'k');
    }));
    add('unique', '화승총', '불붙은 심지가 늘 타고 있는 총입니다.', '탄이 적에게 불을 붙입니다. 불붙은 적이 죽으면 옆 적에게 불이 번집니다.', cw(29, 9, 6, 5, { s: '#3a2a1a', S: '#22180e', b: '#5a5a5a', B: '#8a6420', c: '#8a7a5a', e: '#ff4030', y: '#ffd060' }, put => {
      const cy = 5; stock(put, cy, 's', 'S'); for (let x = 7; x < 28; x++) put(x, cy - 1, x % 7 === 0 ? 'B' : 'b');
      for (const [x, y] of [[8, cy - 2], [9, cy - 3], [10, cy - 3], [11, cy - 4], [12, cy - 4], [13, cy - 3]]) put(x, y, 'c'); put(14, cy - 3, 'e'); put(14, cy - 4, 'y');
    }));
    add('legend', '장의사의 머스킷', '관 모양 개머리판에 은 십자 못과 은 해골, 초록 혼불 룬, 낫 모양 총검이 달린 총입니다.', '그로기 상태인 적에게 마력응축탄의 피해가 2배로 들어갑니다. 처치한 큰 적은 관이 되어 굴러가며 피해를 줍니다.', cw(42, 13, 9, 6, { s: '#2a1e22', S: '#140e10', n: '#c8ccd4', b: '#2e322e', B: '#c8c0a8', i: '#ece8e0', I: '#9a948a', g: '#7aff9a', G: '#2a9a4a', k: '#0b0a0e', m: '#a8acb4', w: '#eef2f6' }, put => {
      const cy = 6;
      for (let x = 0; x < 9; x++) { const hw = x < 1 ? 1 : x < 3 ? 2 : x < 6 ? 3 : 2; for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw || y === cy + hw || x === 0 ? 'S' : 's'); }
      put(4, cy - 1, 'n'); put(4, cy, 'n'); put(4, cy + 1, 'n'); put(3, cy, 'n'); put(5, cy, 'n'); put(1, cy - 2, 'n'); put(1, cy + 2, 'n'); put(7, cy - 2, 'n'); put(7, cy + 2, 'n');
      for (let x = 9; x < 15; x++) { put(x, cy, 's'); put(x, cy + 1, x < 12 ? 's' : '.'); }
      for (let x = 10; x < 38; x++) { put(x, cy - 1, x % 7 === 3 ? 'B' : 'b'); put(x, cy - 2, x % 7 === 3 ? 'B' : (x > 15 && x < 34 && x % 3 === 0) ? 'g' : 'b'); if (x > 16 && x < 33 && x % 3 === 1) put(x, cy - 3, 'G'); }
      put(38, cy - 1, 'B'); put(38, cy - 2, 'B'); put(37, cy - 3, 'B');
      for (const [x, y, c] of [[12, cy - 4, 'i'], [13, cy - 4, 'i'], [14, cy - 4, 'i'], [12, cy - 3, 'k'], [13, cy - 3, 'i'], [14, cy - 3, 'k'], [13, cy - 5, 'I'], [12, cy - 5, 'I'], [14, cy - 5, 'I'], [13, cy - 2, 'I']]) put(x, y, c);
      for (let i = 0; i < 6; i++) { put(33 + i, cy + Math.round(i * 0.8), i > 3 ? 'w' : 'm'); put(33 + i, cy + 1 + Math.round(i * 0.8), i > 4 ? '.' : 'I'); } put(39, cy + 4, 'w'); put(32, cy, 'k');
    }));
    add('legend', '왕의 연발총', '작은 왕관과 붉은 벨벳으로 꾸민 금 장식 6연발 회전 총입니다.', '6발을 연달아 쏘고, 마지막 탄은 폭발합니다. 재장전할 때 실린더가 왕관처럼 돌며 주변 적을 밀쳐냅니다.', cw(36, 13, 8, 6, { v: '#8a1420', V: '#5a0a10', G: '#ffd34d', g: '#fff2b0', Y: '#c9952a', b: '#4a3e2a', m: '#d8c890', r: '#ff3020' }, put => {
      const cy = 6; for (let x = 0; x < 8; x++) { const hw = x < 3 ? 2 : 1; for (let y = cy - hw + 1; y <= cy + hw; y++) put(x, y, x === 0 || y === cy + hw ? 'G' : 'v'); }
      for (let x = 8; x < 12; x++) put(x, cy, 'G');
      disc(put, 15, cy - 1, 3, 3, (x, y, dx, dy, d) => put(x, y, d > 0.7 ? 'Y' : ((dx + 3 + (dy + 3) * 7) % 3 === 0 ? 'b' : 'G')));
      for (let x = 19; x < 35; x++) { put(x, cy - 1, x % 5 === 0 ? 'G' : 'm'); put(x, cy - 2, x % 5 === 0 ? 'G' : 'Y'); } put(35, cy - 2, 'G'); put(35, cy - 1, 'G');
      for (const [x, y, c] of [[14, cy - 5, 'G'], [15, cy - 6, 'g'], [16, cy - 5, 'G'], [13, cy - 6, 'g'], [17, cy - 6, 'g'], [15, cy - 5, 'r']]) put(x, y, c);
    }));
    return W;
  };
})();

  // ================================================================ v2.20 직업별 커먼 무기 3종 추가 (기술 없음 · 도트와 능력치만 다름) — 도감 번호 11~13
  // st.val = 공격력 범위, st.opts = 고정 옵션 (랜덤 옵션 대신)
  const COMMON_EXTRA = (() => {
    const cw = cellWeapon, E = {};
    const grip = (put, x0, x1, cy, a = 'h', b = 'H') => { for (let x = x0; x <= x1; x++) put(x, cy, x % 2 ? a : b); };
    E.knight = [
      { name: '무쇠 클레이모어', look: '폭이 넓고 두꺼운 양손검입니다.', st: { val: [10, 11], opts: [] }, w: cw(34, 11, 3, 5, {
        G: '#5a5e66', g: '#8a8e96', h: '#3a2a1c', H: '#6a4e34', m: '#868c94', l: '#b4bac2', w: '#e2e6ea', d: '#4a5058', D: '#686e76',
      }, put => {
        const cy = 5; put(0, cy, 'g'); put(0, cy - 1, 'G'); put(0, cy + 1, 'G'); put(1, cy, 'G'); grip(put, 2, 5, cy);
        for (let y = 1; y <= 9; y++) put(6, y, 'G'); put(5, 0, 'g'); put(5, 10, 'g'); put(6, 0, 'G'); put(6, 10, 'G'); for (let y = 3; y <= 7; y++) put(7, y, 'G');
        for (let t = 0; t < 26; t++) { const x = 8 + t, hw = t < 20 ? 3 : t < 23 ? 2 : t < 25 ? 1 : 0;
          for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw ? 'l' : y === cy + hw && hw ? 'd' : y === cy && hw === 3 && t > 1 && t < 17 ? 'D' : 'm');
          if (t > 3 && t < 22 && hw >= 2) put(x, cy - hw + 1, t % 5 === 2 ? 'w' : 'm'); if (t === 25) put(x, cy, 'w'); }
      }) },
      { name: '용병의 팔치온', look: '끝으로 갈수록 넓어지는 외날 칼입니다.', st: { val: [7, 8], opts: [{ k: 'critDmg', v: 12 }] }, w: cw(31, 12, 3, 5, {
        G: '#7a5a2a', g: '#b08a48', h: '#2a2018', H: '#4a3a2a', m: '#9aa0a8', l: '#c4c9d0', w: '#eef0f3', d: '#50565e',
      }, put => {
        const cy = 5; put(0, cy, 'g'); put(1, cy, 'G'); grip(put, 2, 5, cy);
        for (let y = cy - 2; y <= cy + 2; y++) put(6, y, 'G'); put(7, cy - 1, 'g'); put(7, cy, 'G'); put(7, cy + 1, 'G');
        for (let t = 0; t < 21; t++) { const x = 8 + t, top = cy - 1 + (t > 16 ? t - 16 : 0), bot = cy + 1 + Math.min(4, Math.floor(t / 4)) - (t > 17 ? (t - 17) * 2 : 0);
          for (let y = top; y <= bot; y++) put(x, y, y === top ? 'd' : y === bot ? 'w' : y === bot - 1 ? 'l' : 'm'); }
      }) },
      { name: '순찰대 장검', look: '가늘고 긴 한손 장검입니다.', st: { val: [6, 7], opts: [{ k: 'spd', v: 6 }] }, w: cw(34, 9, 3, 4, {
        G: '#6a6e78', g: '#a8acb4', h: '#2a3448', H: '#4a5a78', m: '#a0a6ae', l: '#cdd2d8', w: '#f4f6f8', d: '#5a6068',
      }, put => {
        const cy = 4; put(0, cy, 'g'); put(1, cy, 'G'); grip(put, 2, 6, cy);
        for (let y = cy - 3; y <= cy + 3; y++) put(7, y, Math.abs(y - cy) === 3 ? 'g' : 'G'); put(8, cy, 'G');
        for (let t = 0; t < 25; t++) { const x = 9 + t, hw = t < 22 ? 1 : 0;
          for (let y = cy - hw; y <= cy + hw; y++) put(x, y, hw === 0 ? 'w' : y === cy - 1 ? 'l' : y === cy + 1 ? 'd' : t % 6 === 3 ? 'w' : 'm'); }
      }) },
    ];
    E.ranger = [
      { name: '뼈 손잡이 단검', look: '짐승 뼈를 깎은 손잡이에 곧은 날이 달린 단검입니다.', st: { val: [9, 10], opts: [] }, w: cw(15, 7, 2, 4, {
        b: '#e8dcc0', B: '#b8a888', G: '#6a6a70', m: '#9aa0a8', l: '#c8ccd4', w: '#f0f2f6',
      }, put => {
        const cy = 4; put(0, cy, 'B'); put(0, cy - 1, 'b'); put(0, cy + 1, 'B'); for (let x = 1; x < 5; x++) put(x, cy, x % 2 ? 'b' : 'B');
        for (let y = cy - 1; y <= cy + 1; y++) put(5, y, 'G');
        for (let x = 6; x < 14; x++) { put(x, cy - 1, x > 11 ? 'w' : 'l'); if (x < 13) put(x, cy, x === 12 ? 'w' : 'm'); } put(14, cy - 1, 'w');
      }) },
      { name: '톱니 단검', look: '날 등에 톱니가 난 넓은 단검입니다.', st: { val: [7, 8], opts: [{ k: 'crit', v: 4 }] }, w: cw(15, 8, 2, 4, {
        h: '#3a2418', H: '#5a3a24', G: '#7a5a2a', m: '#8d939b', l: '#bcc1c8', w: '#eceef2', d: '#4e545c',
      }, put => {
        const cy = 4; put(0, cy, 'G'); grip(put, 1, 3, cy); for (let y = cy - 1; y <= cy + 1; y++) put(4, y, 'G');
        for (let x = 5; x < 14; x++) { put(x, cy - 1, 'l'); put(x, cy, x > 11 ? 'w' : 'm'); if (x < 12) put(x, cy + 1, x === 11 ? 'w' : 'm'); if (x % 2 === 0 && x < 12) put(x, cy - 2, 'd'); }
        put(14, cy - 1, 'w');
      }) },
      { name: '스틸레토', look: '송곳처럼 가는 찌르기 단검입니다.', st: { val: [6, 7], opts: [{ k: 'spd', v: 7 }] }, w: cw(17, 7, 2, 3, {
        h: '#1a1a22', H: '#34343e', G: '#a8acb4', g: '#d8dce2', m: '#b0b6be', w: '#ffffff',
      }, put => {
        const cy = 3; put(0, cy, 'g'); grip(put, 1, 4, cy); put(5, cy - 2, 'g'); put(5, cy - 1, 'G'); put(5, cy, 'G'); put(5, cy + 1, 'G'); put(5, cy + 2, 'g');
        for (let x = 6; x < 17; x++) put(x, cy, x > 14 ? 'w' : x % 3 === 0 ? 'w' : 'm');
      }) },
    ];
    E.mage = [
      { name: '참나무 지팡이', look: '옹이가 많은 굵은 참나무 지팡이로, 끝에 매듭이 있습니다.', st: { val: [10, 11], opts: [] }, w: cw(26, 11, 5, 5, {
        h: '#6b4a2a', H: '#4a3018', k: '#8a6a3e', l: '#5a8a3a', L: '#3a6a2a',
      }, put => {
        const cy = 5; for (let x = 0; x < 19; x++) { put(x, cy, x % 5 === 2 ? 'k' : 'h'); put(x, cy + 1, x % 4 === 1 ? 'k' : 'H'); }
        for (const [x, y] of [[7, cy - 1], [13, cy + 2], [16, cy - 1]]) put(x, y, 'H');
        for (const [x, y] of [[19, cy - 1], [20, cy - 2], [21, cy - 2], [22, cy - 1], [23, cy], [23, cy + 1], [22, cy + 2], [21, cy + 2], [20, cy + 1], [19, cy], [19, cy + 1], [21, cy], [24, cy]]) put(x, y, (x + y) % 2 ? 'h' : 'k');
        put(21, cy - 3, 'l'); put(22, cy - 4, 'l'); put(20, cy - 4, 'L'); put(22, cy - 3, 'L');
      }) },
      { name: '수정 막대', look: '쇠 자루 끝에 맑은 수정이 박힌 막대입니다.', st: { val: [7, 8], opts: [{ k: 'cdr', v: 6 }] }, w: cw(26, 9, 5, 4, {
        m: '#5a5e68', M: '#8a8e98', c: '#3aa8c8', C: '#8ae0f0', W: '#e8fbff', G: '#a8acb4',
      }, put => {
        const cy = 4; for (let x = 0; x < 17; x++) put(x, cy, x % 4 === 0 ? 'M' : 'm'); for (let y = cy - 1; y <= cy + 1; y++) put(17, y, 'G'); put(18, cy - 2, 'G'); put(18, cy + 2, 'G');
        for (let x = 18; x <= 25; x++) { const hw = x < 21 ? x - 18 : Math.max(0, 25 - x); for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y < cy ? 'C' : y === cy ? (x > 22 ? 'W' : 'C') : 'c'); }
        put(21, cy - 2, 'W'); put(20, cy - 1, 'W');
      }) },
      { name: '부엉이 깃 지팡이', look: '갈고리 끝에 깃털을 매단 목동 지팡이입니다.', st: { val: [6, 7], opts: [{ k: 'critDmg', v: 12 }] }, w: cw(25, 11, 5, 5, {
        h: '#7a5a3a', H: '#5a3e24', f: '#c8a878', F: '#8a6a48', w: '#f0e8d8', k: '#2a1a10', r: '#a8282a',
      }, put => {
        const cy = 5; for (let x = 0; x < 20; x++) put(x, cy, x % 3 === 0 ? 'H' : 'h');
        for (const [x, y] of [[20, cy], [21, cy - 1], [21, cy - 2], [22, cy - 3], [23, cy - 3], [24, cy - 2], [24, cy - 1], [23, cy]]) put(x, y, 'h');
        put(19, cy + 1, 'r'); put(20, cy + 1, 'r');
        for (const [x, y, c] of [[19, cy + 2, 'f'], [19, cy + 3, 'f'], [19, cy + 4, 'k'], [20, cy + 2, 'w'], [20, cy + 3, 'F'], [21, cy + 2, 'F'], [21, cy + 3, 'f'], [21, cy + 4, 'w']]) put(x, y, c);
      }) },
    ];
    E.priest = [
      { name: '쇠 전쟁망치', look: '네모난 쇠 머리를 단 망치입니다.', st: { val: [10, 11], opts: [] }, w: cw(18, 9, 2, 4, {
        G: '#6a6a70', h: '#5a3e24', m: '#7a7e88', l: '#b8bcc4', d: '#44484e', w: '#e0e4ea',
      }, put => {
        const cy = 4; put(0, cy, 'G'); for (let x = 1; x < 11; x++) put(x, cy, x === 1 || x === 9 ? 'G' : 'h');
        for (let x = 11; x <= 16; x++) for (let y = cy - 3; y <= cy + 3; y++) put(x, y, y === cy - 3 ? 'l' : y === cy + 3 ? 'd' : x === 16 ? 'w' : x === 11 ? 'd' : 'm');
        put(17, cy - 1, 'w'); put(17, cy, 'w'); put(17, cy + 1, 'w');
      }) },
      { name: '가시 곤봉', look: '못을 박은 굵은 나무 곤봉입니다.', st: { val: [7, 8], opts: [{ k: 'crit', v: 4 }] }, w: cw(19, 10, 2, 5, {
        h: '#7a5432', H: '#5a3a20', k: '#9a7448', n: '#b8bcc4', N: '#6a6e76', b: '#4a3a2a',
      }, put => {
        const cy = 5; put(0, cy, 'b'); put(1, cy, 'b');
        for (let x = 2; x < 17; x++) { const hw = x < 7 ? 0 : x < 11 ? 1 : 2; for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw && hw ? 'k' : y === cy + hw && hw ? 'H' : 'h'); }
        put(17, cy - 1, 'h'); put(17, cy, 'h'); put(17, cy + 1, 'H');
        for (const [x, y] of [[10, cy - 2], [12, cy - 3], [15, cy - 3], [11, cy + 2], [14, cy + 3], [16, cy + 3], [18, cy]]) put(x, y, y < cy ? 'n' : 'N');
      }) },
      { name: '순례자의 철퇴', look: '긴 자루 끝에 둥근 쇠공이 달린 철퇴입니다.', st: { val: [6, 7], opts: [{ k: 'cdr', v: 6 }] }, w: cw(20, 9, 2, 4, {
        G: '#c9a24a', h: '#6b4a2a', m: '#8a8e96', l: '#d0d4da', d: '#4a4e56', w: '#ffffff',
      }, put => {
        const cy = 4; put(0, cy, 'G'); for (let x = 1; x < 14; x++) put(x, cy, x === 1 || x === 12 || x === 6 ? 'G' : 'h');
        for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 10) put(16 + x, cy + y, x + y < -2 ? 'l' : x + y > 2 ? 'd' : 'm');
        put(15, cy - 2, 'w'); put(19, cy, 'G');
      }) },
    ];
    E.gunner = [
      { name: '사냥꾼 카빈', look: '총열이 짧고 굵은 기병총입니다.', st: { val: [10, 11], opts: [] }, w: cw(23, 7, 6, 4, {
        s: '#6b4a2a', S: '#4a3020', b: '#6e727c', B: '#3e424a', k: '#3a3a40', g: '#9a9ea8',
      }, put => {
        const cy = 4; for (let x = 0; x < 6; x++) { put(x, cy - 1, 's'); put(x, cy, 's'); put(x, cy + 1, 'S'); } put(0, cy + 2, 'S'); for (let x = 6; x < 11; x++) put(x, cy, 's');
        for (let x = 7; x < 22; x++) { put(x, cy - 1, x % 7 === 0 ? 'g' : 'b'); put(x, cy - 2, x > 9 ? 'B' : 'b'); } put(22, cy - 1, 'k'); put(22, cy - 2, 'k'); put(8, cy + 1, 'k');
      }) },
      { name: '해군 머스킷', look: '놋쇠 띠를 감은 긴 총열의 머스킷입니다.', st: { val: [7, 8], opts: [{ k: 'critDmg', v: 12 }] }, w: cw(31, 6, 6, 3, {
        s: '#8a5a32', S: '#5a3820', b: '#9aa0a8', B: '#d0a040', k: '#3a3a40',
      }, put => {
        const cy = 3; for (let x = 0; x < 6; x++) { put(x, cy - 1, 's'); put(x, cy, 's'); put(x, cy + 1, 'S'); } for (let y = cy - 1; y <= cy + 1; y++) put(0, y, 'B'); for (let x = 6; x < 12; x++) put(x, cy, 's');
        for (let x = 7; x < 30; x++) put(x, cy - 1, [11, 17, 23, 28].includes(x) ? 'B' : 'b'); put(29, cy - 2, 'B'); put(8, cy + 1, 'k'); put(7, cy - 2, 'k');
      }) },
      { name: '리피터 카빈', look: '레버 고리를 당겨 장전하는 연발 기병총으로, 개머리판 속을 파냈습니다.', st: { val: [6, 7], opts: [{ k: 'spd', v: 7 }] }, w: cw(28, 6, 6, 3, {
        s: '#a07a4a', S: '#6a4a2a', b: '#b8bcc4', k: '#3a3a40', r: '#c03030', L: '#c9a24a',
      }, put => {
        const cy = 3; for (let x = 0; x < 6; x++) { put(x, cy - 1, 's'); put(x, cy + 1, 'S'); } put(0, cy, 's'); put(5, cy, 's'); for (let x = 6; x < 10; x++) put(x, cy, 's');
        for (let x = 7; x < 27; x++) put(x, cy - 1, 'b'); for (let x = 10; x < 22; x++) put(x, cy, x % 4 === 1 ? 'S' : 's'); /* 총열 아래 탄창관 */ put(26, cy - 2, 'r'); put(12, cy - 2, 'k');
        for (const [x, y] of [[7, cy + 1], [7, cy + 2], [8, cy + 2], [9, cy + 2], [10, cy + 2], [10, cy + 1]]) put(x, y, 'L'); /* 레버 고리 */
      }) },
    ];
    return E;
  })();
  const WSK = { knight: [null, 'cleaver', 'tuna', 'chain', 'bell', 'windmill', 'fang', 'gate', 'bread', 'sun', 'exec'], ranger: [null, 'claw', 'mackerel', 'sickle', 'fan', 'needle', 'kusari', 'yarn', 'moons', 'fangs2', 'nine'], mage: [null, 'candle', 'rod', 'crystal', 'broom', 'skull', 'lrod', 'ladle', 'mirror', 'ashstar2', 'hourglass'], priest: [null, 'censer', 'pan', 'water', 'carrot', 'bellh', 'reliq', 'whip', 'mochi', 'dawn', 'spear'], gunner: [null, 'blunder', 'harpoon', 'duck', 'longrifle', 'revolver', 'cannon', 'puffer', 'match', 'undertaker', 'kingrev'] }; // 구현된 기술 (다른 직업은 준비 중)
  const WCAT_C = {};
  const stripEmoji = t => t.replace(/\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]+/gu, '').trim();
  const UNC_D = { // v2.30 언커먼(도감 11~13) 작은 효과
    knight: ['3타로 쌓는 그로기가 20% 증가합니다.', '적을 처치할 때마다 골드를 1 더 얻습니다.', '점멸 거리가 10% 증가합니다.'],
    ranger: ['적을 처치하면 10% 확률로 각성 게이지가 5 찹니다.', '치명타가 터지면 15% 확률로 약한 출혈을 일으킵니다.', '점멸한 뒤 1초 안에 하는 첫 공격의 피해가 20% 증가합니다.'],
    mage: ['세 발째 큰 탄의 피해가 15% 증가합니다.', '화염구의 폭발 범위가 15% 넓어집니다.', '150px보다 멀리 있는 적에게 주는 피해가 10% 증가합니다.'],
    priest: ['3타의 피해가 10% 증가합니다.', '공격이 맞으면 8% 확률로 적을 0.4초 동안 기절시킵니다.', '치유의 빛 재사용 대기 시간이 1초 감소합니다.'],
    gunner: ['정예와 보스에게 주는 피해가 8% 증가합니다.', '재장전한 뒤 첫 발은 반드시 치명타가 됩니다.', '장탄이 1발 증가합니다.'],
  };
  const uncK = () => { if (!G) return null; const it = eqWeapon(G.cls); return it && it.cls === G.cls && it.wk >= 11 && it.wk <= 13 ? G.cls + it.wk : null; }; // 예: 'knight12'
  function wcat(cls) {
    if (WCAT_C[cls]) return WCAT_C[cls];
    const H = { cellWeapon, WEAP };
    return (WCAT_C[cls] = WF[cls](H).concat((COMMON_EXTRA[cls] || []).map((o, j) => ({ grade: 'common', name: o.name, look: o.look, skill: (UNC_D[cls] || [])[j] || '—', w: o.w, st: Object.assign({}, o.st, { val: UNC_VAL }), uncSk: true }))).map((o, i) => ({ ...o, name: stripEmoji(o.name), i, sk: (WSK[cls] || [])[i] || (o.uncSk ? 'unc' + i : null), fx: i === 9 ? WEAPON_FX[cls] : i === 10 ? ({ knight: 'execsword', ranger: 'nine', mage: 'hourglass', priest: 'spearrain', gunner: 'kingrev' })[cls] || null : null })));
  }
  const eqWeapon = cls => { const id = (SAVE.equipBy[cls] || {}).weapon; return id != null ? SAVE.inv.find(i => i.id === id) : null; };
  const wSkill = () => { if (!G) return null; const it = eqWeapon(G.cls); return it && it.wk != null && canEquip(it, G.cls) ? (wcat(G.cls)[it.wk] || {}).sk || null : null; };
  // ---- v0.99 레어 이상 무기는 모양 자체가 다르다 (색·등급 연출은 그대로). 판정 범위는 SWING 수치라 그림과 무관
  {
    // 칼날 기둥 목록으로 그리기: cols[i] = [위 y, 아래 y], 위 칸은 밝게, 아래 칸은 어둡게, 마지막 칸은 날 끝
    const bladeCols = (put, x0, cols, o = {}) => cols.forEach(([t, b], i) => {
      const x = x0 + i, last = i === cols.length - 1;
      for (let y = t; y <= b; y++) put(x, y, last ? 'w' : y === t ? (o.topW && i % 2 ? 'w' : 'l') : y === b && b > t ? (o.botW ? 'w' : 'd') : (o.core && y === Math.round((t + b) / 2) && b - t >= 3 ? 'D' : 'm'));
    });
    const swordPal = (o, extra) => Object.assign({
      G: o.gold, g: wMix(o.gold, '#ffffff', 0.45), r: o.gem || '#a3222a', h: o.handle, H: wMix(o.handle, '#c0a080', 0.35),
      m: o.mid, l: wMix(o.mid, o.edge, 0.55), w: o.edge, d: o.dark, D: wMix(o.mid, o.dark, 0.5), u: o.rune || o.dark,
    }, extra || {});
    // 기사 레어 — 츠바이한더: 긴 손잡이, 곧은 큰 가드, 리카소와 걸쇠, 가운데 홈에 푸른 룬
    const zwei = o => cellWeapon(37, 13, 3, 6, swordPal(o), put => {
      const cy = 6; put(0, cy, 'G'); put(1, cy, 'G'); put(0, cy - 1, 'g'); put(0, cy + 1, 'G');
      for (let x = 2; x < 7; x++) put(x, cy, x % 2 ? 'h' : 'H');
      for (let y = 1; y <= 11; y++) put(7, y, y === 1 || y === 11 ? 'g' : 'G'); put(8, 1, 'G'); put(8, 11, 'G'); put(7, cy, 'r');
      for (let x = 8; x < 12; x++) { put(x, cy - 1, 'l'); put(x, cy, 'm'); put(x, cy + 1, 'd'); }
      put(11, cy - 2, 'G'); put(11, cy + 2, 'G'); put(12, cy - 3, 'g'); put(12, cy + 3, 'G');
      const L = 24; for (let t = 0; t < L; t++) { const x = 12 + t, hw = t < L - 5 ? 2 : t < L - 2 ? 1 : 0;
        for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw ? 'l' : y === cy + hw && hw ? 'd' : 'm');
        if (hw === 2 && t > 1 && t < L - 6) put(x, cy, t % 3 === 0 ? 'u' : 'D'); if (t >= 6 && t < L - 1 && hw) put(x, cy - hw, 'w'); }
      put(12 + L - 1, cy, 'w');
    });
    // 기사 유니크 — 플랑베르주: 물결치는 날, 날 쪽으로 휜 가드
    const flamb = o => cellWeapon(37, 13, 3, 6, swordPal(o), put => {
      const cy = 6; put(0, cy, 'G'); put(1, cy, 'g'); put(0, cy - 1, 'G'); put(0, cy + 1, 'G');
      for (let x = 2; x < 6; x++) put(x, cy, x % 2 ? 'h' : 'H');
      for (let y = 3; y <= 9; y++) put(6, y, 'G'); put(7, 2, 'G'); put(8, 1, 'g'); put(9, 0, 'g'); put(7, 10, 'G'); put(8, 11, 'g'); put(9, 12, 'g'); put(6, cy, 'r'); put(7, cy, 'G');
      const L = 26; for (let t = 0; t < L; t++) { const x = 8 + t, wv = [0, 0, 1, 1, 1, 0][t % 6] * (t > 1 ? 1 : 0), hw = t < L - 4 ? 2 : t < L - 2 ? 1 : 0, top = cy - hw - (hw ? wv : 0), bot = cy + hw - (hw ? wv : 0);
        for (let y = top; y <= bot; y++) put(x, y, y === top ? 'w' : y === top + 1 ? 'l' : y === bot && hw ? 'd' : 'm');
        if (hw === 2) put(x, cy - wv, t % 6 === 3 && t < L - 6 ? 'u' : 'D'); }
      put(8 + L - 1, cy, 'w');
    });
    // 기사 레전더리 — 용살의 대검: 두꺼운 쇳덩이 날, 사선으로 잘린 끝, 등의 홈, 가시 달린 금빛 가드와 불꽃 룬
    const slayer = o => cellWeapon(37, 15, 3, 7, swordPal(o, { x: '#3a2a10' }), put => {
      const cy = 7; put(0, cy, 'G'); put(1, cy, 'G'); put(0, cy - 1, 'g'); put(0, cy + 1, 'G'); put(1, cy - 1, 'G'); put(1, cy + 1, 'G');
      for (let x = 2; x < 6; x++) put(x, cy, x % 2 ? 'h' : 'H');
      for (let y = 1; y <= 13; y++) put(6, y, 'G'); for (let y = 2; y <= 12; y++) put(7, y, y % 3 ? 'G' : 'g'); put(5, 0, 'g'); put(5, 14, 'g'); put(6, 0, 'G'); put(6, 14, 'G'); put(7, cy, 'r'); put(6, cy, 'r');
      const L = 26; for (let t = 0; t < L; t++) { const x = 8 + t, cut = t >= L - 4 ? t - (L - 4) : -1, top = cy - 3 + (cut >= 0 ? cut * 2 : 0), bot = cy + 3;
        if (top > bot) continue;
        for (let y = top; y <= bot; y++) put(x, y, y === top ? 'l' : y === bot ? 'w' : y === bot - 1 ? 'm' : y === cy - 2 && cut < 0 ? 'l' : 'm');
        if ((t === 5 || t === 12) && cut < 0) { put(x, top, 'x'); put(x + 1, top, 'x'); }
        if (cut < 0 && t > 1 && t < L - 5) put(x, cy, t % 3 === 1 ? 'u' : 'D'); if (cut >= 0) put(x, top, 'w'); }
    });
    // 단검 공통 팔레트
    const dagPal = (o, extra) => Object.assign({ G: o.gold, g: wMix(o.gold, '#ffffff', 0.4), h: o.handle, H: wMix(o.handle, '#c0a080', 0.35), m: o.mid, l: wMix(o.mid, o.edge, 0.55), w: o.edge, d: wMix(o.mid, '#000000', 0.35), D: wMix(o.mid, '#000000', 0.2), u: o.rune || o.edge }, extra || {});
    // 어세신 레어 — 쿠크리: 아래로 꺾였다 휘어 오르는 넓은 배
    const kukri = o => cellWeapon(17, 9, 2, 5, dagPal(o), put => {
      const cy = 5; put(0, cy, 'G'); put(1, cy, 'h'); put(2, cy, 'H'); put(3, cy, 'h'); for (let y = cy - 1; y <= cy + 1; y++) put(4, y, 'G');
      bladeCols(put, 5, [[4, 5], [4, 6], [4, 7], [3, 7], [3, 7], [2, 6], [2, 6], [1, 5], [1, 4], [0, 3], [0, 1]], { botW: true });
      put(6, 5, 'u');
    });
    // 어세신 유니크 — 톱날 단검: 등에 톱니, 손등을 감싸는 손잡이 고리
    const serr = o => cellWeapon(18, 10, 3, 5, dagPal(o), put => {
      const cy = 5; put(0, cy + 1, 'G'); put(0, cy + 2, 'G'); put(1, cy + 3, 'G'); put(2, cy + 3, 'G'); put(3, cy + 3, 'g'); put(4, cy + 2, 'G');
      put(1, cy, 'G'); put(2, cy, 'h'); put(3, cy, 'H'); put(4, cy, 'h'); for (let y = cy - 2; y <= cy + 1; y++) put(5, y, 'G'); put(5, cy, 'g');
      bladeCols(put, 6, [[4, 6], [4, 6], [3, 6], [3, 6], [3, 5], [2, 5], [2, 5], [1, 4], [1, 3], [1, 2], [0, 1], [0, 0]], { botW: true });
      for (const x of [7, 9, 11, 13]) put(x, [3, 2, 1, 0][(x - 7) / 2], 'd'); put(8, 5, 'u'); put(10, 4, 'u');
    });
    // 어세신 레전더리 — 핏빛 엄니: 짐승 송곳니처럼 길게 휜 뼈 날, 뒤쪽 갈고리, 핏물 홈
    const fang = o => cellWeapon(21, 12, 3, 7, dagPal(o, { b: '#c8bea8' }), put => {
      const cy = 7; put(0, cy, 'G'); put(1, cy, 'b'); put(2, cy, 'H'); put(3, cy, 'b'); put(4, cy, 'H');
      for (let y = cy - 2; y <= cy + 2; y++) put(5, y, 'G'); put(4, cy - 2, 'g'); put(4, cy + 2, 'G'); put(3, cy + 3, 'G'); put(2, cy + 4, 'g');
      bladeCols(put, 6, [[6, 8], [5, 8], [5, 8], [4, 8], [4, 7], [3, 7], [3, 6], [2, 6], [2, 5], [1, 4], [1, 3], [0, 2], [0, 1], [0, 0]], { botW: true });
      for (let x = 7; x < 15; x++) put(x, [7, 7, 6, 6, 5, 5, 4, 4][x - 7], 'u');
      put(6, 9, 'm'); put(7, 10, 'l'); put(8, 11, 'w');
    });
    // 지팡이 팔레트
    const stfPal = o => ({ h: o.wood, H: o.wood2 || wMix(o.wood, '#000000', 0.25), G: o.band || wMix(o.wood, '#000000', 0.4), C: o.band || '#8a6236', c: o.crescent || o.band || '#c9a24a', o: o.orb1, O: o.orb2, W: o.orb3, s: o.star || '#ffffff' });
    const orb = (put, ox, cy, r) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 0.6) put(ox + x, cy + y, x + y < -r * 0.6 ? 'W' : x + y < 0.5 ? 'O' : 'o'); };
    // 마법사 레어 — 집게발 지팡이: 쇠 집게 세 가닥이 보주를 붙잡음
    const claw = o => cellWeapon(28, 13, 5, 6, stfPal(o), put => {
      const cy = 6; for (let x = 0; x < 18; x++) put(x, cy, x % 5 === 0 ? 'G' : x % 2 ? 'H' : 'h'); put(0, cy - 1, 'G'); put(0, cy + 1, 'G');
      for (let y = cy - 1; y <= cy + 1; y++) put(18, y, 'C'); orb(put, 22, cy, 2);
      for (const s of [-1, 1]) { put(19, cy + s * 2, 'C'); put(20, cy + s * 3, 'C'); put(21, cy + s * 4, 'C'); put(22, cy + s * 4, 'C'); put(23, cy + s * 3, 'c'); put(24, cy + s * 2, 'c'); }
      put(25, cy, 'C'); put(26, cy, 'c');
    });
    // 마법사 유니크 — 초승달 지팡이: 비틀린 나무 자루, 커다란 초승달이 보주를 감쌈
    const moon = o => cellWeapon(30, 15, 5, 7, stfPal(o), put => {
      const cy = 7; for (let x = 0; x < 18; x++) put(x, cy, x % 4 === 0 ? 'G' : x % 2 ? 'h' : 'H'); for (const x of [4, 10]) { put(x, cy - 1, 'H'); put(x + 1, cy + 1, 'H'); }
      for (let y = cy - 1; y <= cy + 1; y++) put(18, y, 'C'); orb(put, 23, cy, 2);
      for (let a = 95; a <= 265; a += 7) { const t = a * DEG; for (const r of [5, 6]) put(Math.round(23 + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), r === 5 ? 'c' : 'G'); }
      put(24, cy - 6, 'c'); put(25, cy - 6, 's'); put(24, cy + 6, 'c'); put(25, cy + 6, 's'); put(26, cy - 3, 's'); put(26, cy + 3, 's');
    });
    // 마법사 레전더리 — 태양의 지팡이: 금 나선 자루, 후광 고리와 별빛 네 갈래, 날개 장식
    const sunst = o => cellWeapon(34, 17, 5, 8, stfPal(o), put => {
      const cy = 8; for (let x = 0; x < 20; x++) put(x, cy, x % 4 === 0 ? 'C' : x % 4 === 1 ? 'G' : x % 2 ? 'H' : 'h');
      put(16, cy - 2, 'c'); put(17, cy - 3, 'c'); put(16, cy + 2, 'c'); put(17, cy + 3, 'c'); put(15, cy - 1, 'G'); put(15, cy + 1, 'G');
      for (let y = cy - 2; y <= cy + 2; y++) put(20, y, 'C'); orb(put, 26, cy, 3);
      for (let a = 0; a < 360; a += 10) { const t = a * DEG; put(Math.round(26 + Math.cos(t) * 5.5), Math.round(cy + Math.sin(t) * 5.5), a % 40 === 0 ? 's' : 'c'); }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 7; k <= 8; k++) put(26 + dx * k, cy + dy * k, k === 8 ? 's' : 'c');
    });
    // 메이스 팔레트
    const macePal = (o, extra) => Object.assign({ G: o.grip, h: '#6b4a2a', H: '#4a3020', m: o.head, l: o.hi, d: o.lo, u: o.gem || o.hi, s: o.spike || o.hi }, extra || {});
    // 사제 레어 — 전쟁 망치: 긴 자루, 납작한 망치 머리와 반대편 곡괭이 날
    const hammer = o => cellWeapon(20, 15, 2, 6, macePal(o), put => {
      const cy = 6; put(0, cy, 'G'); for (let x = 1; x < 13; x++) put(x, cy, x === 1 || x === 10 ? 'G' : x % 2 ? 'h' : 'H');
      for (let x = 11; x < 17; x++) for (let y = cy - 2; y <= cy + 5; y++) put(x, y, x === 11 || y === cy - 2 ? 'l' : x === 16 || y === cy + 5 ? 'd' : 'm');
      for (let x = 11; x < 17; x++) put(x, cy + 6, x % 2 ? 'd' : 'm'); put(13, cy + 1, 'u'); put(14, cy + 1, 'u'); put(13, cy + 2, 'u'); put(14, cy + 2, 'u');
      for (let k = 0; k < 4; k++) { put(13, cy - 3 - k, k < 2 ? 'm' : 'l'); if (k < 2) put(14, cy - 3 - k, 'd'); } put(13, cy - 7, 's'); put(17, cy + 1, 'l'); put(18, cy + 1, 's');
    });
    // 사제 유니크 — 모닝스타: 둥근 쇠공에 사방으로 가시
    const mstar = o => cellWeapon(21, 13, 2, 6, macePal(o), put => {
      const cy = 6; put(0, cy, 'G'); for (let x = 1; x < 11; x++) put(x, cy, x === 1 || x === 9 ? 'G' : x % 2 ? 'h' : 'H');
      const ox = 14; for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 10) put(ox + x, cy + y, x + y < -2 ? 'l' : x + y > 2 ? 'd' : 'm');
      put(ox, cy, 'u'); put(ox - 1, cy - 1, 'l');
      for (let a = 0; a < 360; a += 45) { const t = a * DEG; for (const r of [4, 5]) put(Math.round(ox + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), r === 5 ? 's' : 'm'); }
    });
    // 사제 레전더리 — 태양 망치: 금빛 큰 망치 머리, 뒤로 퍼지는 해 원반, 보석
    const sunham = o => cellWeapon(24, 17, 2, 8, macePal(o, { r: '#ffffff' }), put => {
      const cy = 8; put(0, cy, 'G'); put(0, cy - 1, 'G'); put(0, cy + 1, 'G'); for (let x = 1; x < 13; x++) put(x, cy, x % 3 === 0 ? 'G' : x % 2 ? 'h' : 'H');
      const ox = 16; for (let a = 0; a < 360; a += 15) { const t = a * DEG, r = a % 30 ? 6 : 7; for (let k = 5; k <= r; k++) put(Math.round(ox + Math.cos(t) * k), Math.round(cy + Math.sin(t) * k), k === r ? 's' : 'l'); }
      for (let x = 13; x < 20; x++) for (let y = cy - 3; y <= cy + 3; y++) put(x, y, x === 13 || y === cy - 3 ? 'l' : x === 19 || y === cy + 3 ? 'd' : 'm');
      for (let y = cy - 4; y <= cy + 4; y++) { put(14, y, 'l'); put(18, y, 'd'); }
      put(16, cy, 'u'); put(15, cy, 'u'); put(16, cy - 1, 'r');
    });
    // 머스킷 팔레트
    const gunPal = (o, extra) => Object.assign({ s: o.stock, S: o.stock2, b: o.barrel, d: wMix(o.barrel, '#000000', 0.35), l: wMix(o.barrel, '#ffffff', 0.35), B: o.band, k: '#3a3a40', u: o.rune || o.band, w: '#e8ecf0', W: '#a8b0b8' }, extra || {});
    // 거너 레어 — 총검 머스킷
    const bayo = o => cellWeapon(34, 7, 6, 3, gunPal(o), put => {
      const cy = 3, L = 26;
      for (let x = 0; x < 6; x++) { put(x, cy - 1, 's'); put(x, cy, 's'); put(x, cy + 1, 'S'); } put(0, cy + 2, 'S'); put(1, cy + 2, 'S');
      for (let x = 6; x < 13; x++) put(x, cy, 's'); for (let x = 7; x < L; x++) put(x, cy - 1, x % 9 === 0 ? 'l' : 'b');
      for (const x of o.bands) put(x, cy - 1, 'B'); put(8, cy + 1, 'k'); put(7, cy - 2, 'k');
      put(L - 1, cy, 'B'); put(L, cy, 'W'); for (let x = L + 1; x < L + 7; x++) put(x, cy, x === L + 6 ? 'w' : 'W'); for (let x = L + 1; x < L + 5; x++) put(x, cy + 1, 'w');
    });
    // 거너 유니크 — 나팔총: 짧고 굵은 총신이 나팔처럼 벌어짐, 장식 개머리판
    const blund = o => cellWeapon(29, 9, 6, 4, gunPal(o), put => {
      const cy = 4;
      for (let x = 0; x < 6; x++) { put(x, cy - 1, 's'); put(x, cy, x % 2 ? 'u' : 's'); put(x, cy + 1, 'S'); } put(0, cy + 2, 'S'); put(0, cy - 2, 'S');
      for (let x = 6; x < 12; x++) put(x, cy, 's'); put(8, cy + 1, 'k'); put(7, cy - 3, 'k');
      for (let x = 7; x < 22; x++) { put(x, cy - 2, 'l'); put(x, cy - 1, x % 5 === 0 ? 'B' : 'b'); }
      for (let x = 22; x < 27; x++) { const f = x - 21; for (let y = cy - 2 - Math.floor(f / 2); y <= cy - 1 + Math.floor(f / 2); y++) put(x, y, y === cy - 2 - Math.floor(f / 2) ? 'l' : x === 26 ? 'd' : 'b'); }
      put(26, cy - 2, 'k'); put(26, cy - 1, 'k'); for (const x of [10, 16]) put(x, cy - 2, 'B');
    });
    // 거너 레전더리 — 쌍열 장총: 위아래 두 총신, 놋쇠 망원 조준경, 룬 새긴 개머리판
    const rifle = o => cellWeapon(36, 9, 6, 5, gunPal(o), put => {
      const cy = 5, L = 32;
      for (let x = 0; x < 6; x++) { put(x, cy - 1, 's'); put(x, cy, 's'); put(x, cy + 1, 'S'); } put(0, cy + 2, 'S'); put(1, cy + 2, 'S'); put(0, cy - 2, 'S');
      for (let x = 1; x < 5; x++) put(x, cy, 'u');
      for (let x = 6; x < 14; x++) put(x, cy, 's'); put(8, cy + 1, 'k');
      for (let x = 7; x < L; x++) { put(x, cy - 1, 'b'); put(x, cy - 2, x < L - 1 ? 'l' : 'b'); } for (const x of o.bands) { put(x, cy - 1, 'B'); put(x, cy - 2, 'B'); }
      for (let x = 11; x < 21; x++) put(x, cy - 4, x === 11 || x === 20 ? 'k' : 'B'); put(12, cy - 3, 'k'); put(19, cy - 3, 'k'); put(20, cy - 4, 'u');
      put(L, cy - 1, 'k'); put(L, cy - 2, 'k'); put(L - 2, cy - 3, 'B');
    });
    const K = WEAP.knight, R = WEAP.ranger, M = WEAP.mage, Pr = WEAP.priest, Gn = WEAP.gunner;
    K[1] = zwei({ handle: '#2a3448', gold: '#c0c8d8', mid: '#a8b8d0', edge: '#f0f8ff', dark: '#5a6a88', rune: '#4f8dff', gem: '#4f8dff' });
    K[2] = flamb({ handle: '#2a1a2a', gold: '#c9a24a', mid: '#4a3e5a', edge: '#d8b8ff', dark: '#241a30', rune: '#b05cff', gem: '#b05cff' });
    K[3] = slayer({ handle: '#5a1a10', gold: '#e8a830', mid: '#d09a38', edge: '#ffe49a', dark: '#6a3e10', rune: '#ff6a2a', gem: '#ff3020' });
    R[1] = kukri({ handle: '#2a3448', gold: '#c0c8d8', mid: '#b8c8e0', edge: '#ffffff', rune: '#4f8dff' });
    R[2] = serr({ handle: '#2a1a2a', gold: '#c9a24a', mid: '#5a3e6a', edge: '#e8c8ff', rune: '#b05cff' });
    R[3] = fang({ handle: '#3a0e10', gold: '#5a1018', mid: '#a82434', edge: '#ff7080', rune: '#ffc890' }); // v1.09 흰 날 → 핏빛 날
    M[1] = claw({ wood: '#6b4a2a', band: '#c0c8d8', orb1: '#1a3a8a', orb2: '#4a80ff', orb3: '#e0f0ff' });
    M[2] = moon({ wood: '#3a2430', wood2: '#5a3a4a', band: '#c9a24a', crescent: '#e0c070', orb1: '#5a2a8a', orb2: '#b070ff', orb3: '#f0d8ff', star: '#f0d8ff' });
    M[3] = sunst({ wood: '#a8782a', wood2: '#e0b050', band: '#e8b040', crescent: '#f0c050', star: '#fff0b0', orb1: '#a0300e', orb2: '#ff9a3a', orb3: '#fff0b0' });
    Pr[1] = hammer({ head: '#8d9097', hi: '#e6e8ec', lo: '#4d4f55', grip: '#c0c8d8', gem: '#4f8dff' });
    Pr[2] = mstar({ head: '#4a3e5a', hi: '#c8a8f0', lo: '#241a30', grip: '#c9a24a', gem: '#b05cff', spike: '#e0c8ff' });
    Pr[3] = sunham({ head: '#e8a828', hi: '#ffe08a', lo: '#8a5418', grip: '#c9952a', gem: '#ff5a1a', spike: '#ffc040' });
    Gn[1] = bayo({ stock: '#7a5232', stock2: '#4a3020', barrel: '#a8acb4', band: '#c9a24a', bands: [10, 16, 22] });
    Gn[2] = blund({ stock: '#2a1a2a', stock2: '#1a1018', barrel: '#5a5a68', band: '#c9a24a', rune: '#b05cff' });
    Gn[3] = rifle({ stock: '#1a1418', stock2: '#0e0a0c', barrel: '#3a3e3a', band: '#a89868', bands: [10, 17, 24, 29], rune: '#7aff9a' });
  }
  const TIER_FX = [null, { c: '120,170,255', p: ['#9fc8ff', '#ffffff'] }, { c: '190,110,255', p: ['#c890ff', '#f0d8ff'] }];
  const LEGEND_FX_COL = { knight: { c: '255,180,60', p: ['#ffc040', '#ff9a2e'] }, ranger: { c: '255,60,70', p: ['#ff4050', '#c02030'] }, mage: { c: '255,140,50', p: ['#ffb060', '#ff7a2a'] }, priest: { c: '255,190,80', p: ['#ffc040', '#ff9a2e'] }, gunner: { c: '110,255,150', p: ['#7aff9a', '#30c060'] } }; // v1.09 흰 불티 빼고 직업색으로
  // ================================================================ v2.40 RGB? (v2.56 RBY?에서 이름 변경) — 레전더리 위 등급. 모든 직업 공통 이름, 기본 무기 도트, 피의 제단에서만 0.5%
  // 기본 공격력은 레어 수준(12), 이번 런에 모은 색 조각(분노·평온·희망의 빛 합계) 4개마다 +1. 무기는 가끔 흰·빨·파·초로 깜빡인다
  const RBY_HEX = ['#ffffff', '#ff3a3a', '#4a8cff', '#5ad84a'], RBY_RGB = ['255,255,255', '255,58,58', '74,140,255', '90,216,74'];
  const rbyShards = () => (G && G.pal ? (G.pal.r || 0) + (G.pal.b || 0) + (G.pal.g || 0) : 0);
  const rbyPal = c => (G && G.pal ? G.pal[c] || 0 : 0);
  function rbyVal() { return 15 + Math.floor(rbyPal('r') / 2); } // v2.55 기본 15 · 분노의 빛 2개마다 공격력 +1
  function rbyOpts() { const o = [], cd = Math.min(30, Math.floor(rbyPal('b') / 2)), cr = Math.min(30, Math.floor(rbyPal('g') / 2)); if (cd) o.push({ k: 'cdr', v: cd }); if (cr) o.push({ k: 'crit', v: cr }); return o; } // 평온 → 쿨타임 · 희망 → 치명타 (v2.55 각 2개마다 1%, 최대 30%)
  // RGB? 고유 도트: 직업별 무기 꼴은 유지하되 잿빛 몸체 + 빨·파·초 세 면의 프리즘 보석 + 날·총신의 삼색 상감. 크기는 기본 무기와 비슷하게
  const RBY_PAL = { g: '#2a2630', a: '#3e3a46', A: '#625e6c', s: '#9a96a4', W: '#ece8f4', R: '#e0303a', B: '#3a7cff', Y: '#4ac83a', r: '#8a1820', b: '#1a3a8a', y: '#1e6a14' };
  const RBY3 = ['R', 'B', 'Y'];
  let RBY_W = null;
  function rbyWeapons() {
    if (RBY_W) return RBY_W;
    const gem = (put, x, y) => { put(x, y - 1, 'R'); put(x + 1, y - 1, 'r'); put(x, y, 'B'); put(x + 1, y, 'W'); put(x + 2, y, 'Y'); put(x, y + 1, 'Y'); put(x + 1, y + 1, 'b'); }; // 세 빛이 갈라지는 작은 프리즘
    RBY_W = {
      knight: cellWeapon(30, 9, 3, 4, RBY_PAL, put => { const cy = 4;
        for (let x = 0; x < 6; x++) put(x, cy, x % 2 ? 'a' : 'g'); put(0, cy - 1, 's'); put(0, cy + 1, 's');
        for (let y = cy - 3; y <= cy + 3; y++) put(6, y, Math.abs(y - cy) === 3 ? 's' : 'A');
        gem(put, 7, cy);
        for (let x = 10; x <= 29; x++) { const hw = x < 25 ? 2 : x < 28 ? 1 : 0;
          for (let y = cy - hw; y <= cy + hw; y++) put(x, y, x >= 28 ? 'W' : y === cy - hw ? 's' : y === cy + hw ? 'a' : y === cy && x < 25 ? RBY3[Math.floor((x - 10) / 3) % 3] : 'A'); }
      }),
      ranger: cellWeapon(15, 7, 2, 3, RBY_PAL, put => { const cy = 3;
        for (let x = 0; x < 4; x++) put(x, cy, x % 2 ? 'a' : 'g');
        for (let y = cy - 2; y <= cy + 2; y++) put(4, y, Math.abs(y - cy) === 2 ? 's' : 'A');
        put(5, cy - 1, 'R'); put(5, cy, 'B'); put(5, cy + 1, 'Y');
        for (let x = 6; x <= 14; x++) { const hw = x < 12 ? 1 : 0; for (let y = cy - hw; y <= cy + hw; y++) put(x, y, x >= 13 ? 'W' : y === cy - hw && hw ? 's' : y === cy + hw && hw ? 'a' : hw ? RBY3[Math.floor((x - 6) / 2) % 3] : 'A'); }
      }),
      mage: cellWeapon(25, 11, 5, 5, RBY_PAL, put => { const cy = 5;
        for (let x = 0; x < 17; x++) put(x, cy, x % 5 === 0 ? 's' : x % 2 ? 'a' : 'A');
        put(17, cy - 2, 's'); put(17, cy + 2, 's'); put(18, cy - 3, 's'); put(18, cy + 3, 's'); for (let y = cy - 1; y <= cy + 1; y++) put(17, y, 'A');
        for (let dx = 0; dx <= 5; dx++) { const h = 3 - Math.floor(dx / 2); for (let y = cy - h; y <= cy + h; y++) put(18 + dx, y, dx === 5 ? 'W' : y < cy ? (y === cy - h ? 'R' : 'r') : y > cy ? (y === cy + h ? 'Y' : 'y') : (dx < 2 ? 'B' : 'W')); }
      }),
      priest: cellWeapon(18, 9, 2, 4, RBY_PAL, put => { const cy = 4;
        for (let x = 0; x < 10; x++) put(x, cy, x % 3 === 0 ? 's' : 'g');
        for (let x = 10; x <= 15; x++) for (let y = cy - 3; y <= cy + 3; y++) put(x, y, y === cy - 3 || x === 10 ? 's' : y === cy + 3 || x === 15 ? 'a' : 'A');
        put(12, cy - 1, 'R'); put(13, cy - 1, 'r'); put(12, cy, 'B'); put(13, cy, 'W'); put(14, cy, 'Y'); put(12, cy + 1, 'Y'); put(13, cy + 1, 'b');
        put(12, cy - 4, 's'); put(13, cy - 4, 's'); put(12, cy + 4, 'a'); put(13, cy + 4, 'a'); put(16, cy, 's'); put(17, cy, 'W');
      }),
      gunner: cellWeapon(27, 6, 6, 3, RBY_PAL, put => { const cy = 3;
        for (let x = 0; x < 6; x++) { put(x, cy - 1, 'A'); put(x, cy, 'a'); put(x, cy + 1, 'g'); }
        put(2, cy, 'R'); put(3, cy, 'B'); put(4, cy, 'Y');
        for (let x = 6; x < 11; x++) put(x, cy, 'a');
        for (let x = 7; x < 24; x++) put(x, cy - 1, x === 11 ? 'R' : x === 16 ? 'B' : x === 21 ? 'Y' : x % 2 ? 'A' : 's');
        put(23, cy - 2, 'W'); put(8, cy + 1, 'g'); put(7, cy - 2, 's');
      }),
    };
    return RBY_W;
  }
  const rbyBase = (cls, fb) => rbyWeapons()[cls] || fb;
  function makeRBY(cls) { return { id: SAVE.nextId++, grade: 'rby', slot: 'weapon', cls, name: 'RGB?', stat: SLOTS[0].stat, val: 15, opts: [], fx: null, lv: 0, fail: 0, efx: null, set: null, curse: null, wk: 0 }; }
  function rbyFrame(off) { const p = (time + off) % 1.7; return p < 0.32 ? Math.floor(p / 0.08) : -1; } // 1.7초마다 0.32초 동안 흰 → 빨 → 파 → 초
  const RBY_TINT = new WeakMap();
  function rbyTex(b) {
    const f = rbyFrame(0); if (f < 0) return b;
    let m = RBY_TINT.get(b); if (!m) RBY_TINT.set(b, m = []);
    if (m[f]) return m[f];
    const T = RBY_HEX[f], tr = parseInt(T.slice(1, 3), 16), tg = parseInt(T.slice(3, 5), 16), tb = parseInt(T.slice(5, 7), 16);
    const tint = h => { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), bb = parseInt(h.slice(5, 7), 16), L = (r * 0.3 + g * 0.59 + bb * 0.11) / 255, k = f === 0 ? 0.55 + L * 0.7 : 0.25 + L * 0.95;
      return '#' + [tr, tg, tb].map(v => Math.min(255, Math.round(v * k)).toString(16).padStart(2, '0')).join(''); };
    let w;
    if (b.cells) { const pal = {}; for (const k in b.pal) pal[k] = typeof b.pal[k] === 'string' && b.pal[k][0] === '#' && b.pal[k].length >= 7 ? tint(b.pal[k]) : b.pal[k]; w = Object.assign({}, b, { pal, rot: {} }); }
    else if (b.c) { const [c, g] = mkCanvas(b.c.width, b.c.height); g.drawImage(b.c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = T; g.globalAlpha = 0.75; g.fillRect(0, 0, b.c.width, b.c.height); w = Object.assign({}, b, { c }); }
    else w = b;
    return (m[f] = w);
  }
  let tierCache = { key: null, t: 0 };
  function weaponTier(cls) {
    cls = cls || (G ? G.cls : CUR);
    const id = (SAVE.equipBy[cls] || {}).weapon, key = cls + ':' + id + ':' + SAVE.inv.length;
    if (tierCache.key === key) return tierCache.t;
    const it = id != null ? SAVE.inv.find(i => i.id === id) : null;
    tierCache = { key, t: it ? TIER_OF[it.grade] : 0 };
    return tierCache.t;
  }
  const weaponTex = cls => { const it = eqWeapon(cls); if (it && it.wk != null && it.cls === cls) { const W0 = wcat(cls)[it.wk]; if (W0) return it.grade === 'rby' ? rbyTex(rbyBase(cls, W0.w)) : W0.w; } return WEAP[cls][weaponTier(cls)]; }; // v2.03 도감 무기는 그 무기 도트
  function tierFx(cls) { const t = weaponTier(cls); { const it = eqWeapon(cls); if (it && it.grade === 'rby') { const f = rbyFrame(0); return { c: RBY_RGB[f < 0 ? 1 : f], p: RBY_HEX }; } } return t === 3 ? LEGEND_FX_COL[cls] : TIER_FX[t]; }
  // 무기 위에 등급 연출: 레어 — 칼날을 훑는 반짝임 / 유니크 — 보랏빛 맥동과 불티 / 레전더리 — 직업색 광채와 불꽃
  function weaponAura(tex, x, y, ang, cls, scale = 1) {
    const t = weaponTier(cls); if (!t || !G) return;
    if (cls === 'knight' && wSkill() === 'bread') return; // v2.19 바게트는 반짝임·덧칠 없이 부러졌을 때와 같은 빵 색
    const fx = tierFx(cls), ux = Math.cos(ang), uy = Math.sin(ang), reach = tex.reach * scale;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (t >= 2) { ctx.globalAlpha = (t === 3 ? 0.12 : 0.16) + Math.sin(time * (t === 3 ? 7 : 4)) * (t === 3 ? 0.05 : 0.08); drawBlade(tex, x, y, ang, 1, false, scale, 'lighter'); ctx.globalAlpha = 1; } // v1.09: 레전더리 덧칠 0.3 → 0.12 (하얗게 날아가던 문제)
    const ph = (time % 1.6) / 0.35;
    if (ph < 1) { const k = 0.2 + ph * 0.8, gx = x + ux * reach * k, gy = y + uy * reach * k; ctx.fillStyle = `rgba(255,255,255,${1 - ph * 0.5})`; ctx.fillRect(Math.round(gx) - 1, Math.round(gy) - 1, 2, 2); ctx.fillStyle = `rgba(${fx.c},.7)`; ctx.fillRect(Math.round(gx) - 2, Math.round(gy), 4, 1); ctx.fillRect(Math.round(gx), Math.round(gy) - 2, 1, 4); }
    ctx.restore();
    if (t >= 2 && Math.random() < (t === 3 ? 0.3 : 0.18)) { const k = rand(0.3, 1); G.parts.push({ x: x + ux * reach * k + rand(-2, 2), y: y + uy * reach * k + rand(-2, 2), vx: rand(-8, 8), vy: rand(-30, -10), t: rand(0.3, 0.6), c: pick(fx.p), g: 0, glow: true }); }
  }
  // v2.19 피격 흰 번쩍임: ctx.filter('brightness') 대신 한 번 밝혀 둔 사본을 쓴다 (필터는 그릴 때마다 느림)
  const WHITE_BLADE = new WeakMap(), brightHex = h => '#' + [1, 3, 5].map(i => Math.min(255, parseInt(h.slice(i, i + 2), 16) * 3).toString(16).padStart(2, '0')).join('');
  function whiteBlade(b) {
    let w = WHITE_BLADE.get(b); if (w) return w;
    if (b.cells) { const pal = {}; for (const k in b.pal) pal[k] = typeof b.pal[k] === 'string' && b.pal[k][0] === '#' && b.pal[k].length >= 7 ? brightHex(b.pal[k]) : b.pal[k]; w = Object.assign({}, b, { pal, rot: {} }); }
    else if (b.c) { const [c, g] = mkCanvas(b.c.width, b.c.height); g.filter = 'brightness(3)'; g.drawImage(b.c, 0, 0); w = Object.assign({}, b, { c }); }
    else w = b; WHITE_BLADE.set(b, w); return w;
  }
  function drawBlade(b, x, y, ang, alpha = 1, white, scale = 1, comp) {
    const ash = ASH_DRAW && !comp; if (ash) b = ashBlade(b); // v1.99 잿불 외형
    if (white) b = whiteBlade(b);
    if (b.cells) { // v1.05: 배율도 칸 단위, 칸 경계를 2px 격자에 맞춤
      const r = rotW(b, ang, scale);
      ctx.save(); ctx.globalAlpha = alpha; if (comp) ctx.globalCompositeOperation = comp;
      if (ash && !white) { const A = auraOf(r.c, 2); ctx.drawImage(A.c, snap2(x) - r.o + 1 - A.p, snap2(y) - r.o + 1 - A.p); }
      ctx.drawImage(r.c, snap2(x) - r.o + 1, snap2(y) - r.o + 1); ctx.restore(); return; // r.o는 홀수 → 캔버스 원점이 짝수 좌표
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    if (comp) ctx.globalCompositeOperation = comp;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(ang);
    ctx.scale(scale, Math.cos(ang) < 0 ? -scale : scale);
    ctx.drawImage(b.c, -b.pivotX, -b.pivotY);
    ctx.restore();
  }

  // 3x5 도트 숫자
  const DIGITS = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111', '!': '010010010000010', '+': '000010111010000',
    'H': '101101111101101', 'I': '111010010010111', 'T': '111010010010010',
  };
  const NUMC = new Map(); // v1.17 숫자 그림을 문자열·색·크기마다 한 장으로
  function drawNumber(str, x, y, color, s) {
    if (!(s > 0)) s = 2; // v2.40 크기가 없거나 잘못되면 기본 크기로 (0 크기 그림은 drawImage 오류 → 렌더 중단)
    if (OPT) { str = String(str); const key = str + '|' + color + '|' + s; let c = NUMC.get(key);
      if (!c) { const w0 = str.length * 4 * s - s, [cv2, g] = mkCanvas(w0 + 2, 5 * s + 2); let cx0 = 0; for (const ch of str) { const d = DIGITS[ch]; if (d) for (let i = 0; i < 15; i++) if (d[i] === '1') { const px = cx0 + (i % 3) * s, py = Math.floor(i / 3) * s; g.fillStyle = '#000'; g.fillRect(px + 1, py + 1, s, s); g.fillStyle = color; g.fillRect(px, py, s, s); } cx0 += 4 * s; } c = cv2; if (NUMC.size > 300) NUMC.clear(); NUMC.set(key, c); }
      ctx.drawImage(c, Math.round(x - (str.length * 4 * s - s) / 2), Math.round(y)); return; }
    const w = str.length * 4 * s - s;
    let cx = Math.round(x - w / 2);
    for (const ch of str) {
      const d = DIGITS[ch]; if (!d) { cx += 4 * s; continue; }
      for (let i = 0; i < 15; i++) if (d[i] === '1') {
        const px = cx + (i % 3) * s, py = Math.round(y) + Math.floor(i / 3) * s;
        ctx.fillStyle = '#000'; ctx.fillRect(px + 1, py + 1, s, s);
        ctx.fillStyle = color; ctx.fillRect(px, py, s, s);
      }
      cx += 4 * s;
    }
  }
