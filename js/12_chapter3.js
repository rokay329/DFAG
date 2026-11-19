'use strict';
// 잿빛 왕관 토벌대 — 12_chapter3.js : 3장 핏빛 엄니 부락: 오크·잡기·전쟁 북·엘리트·크루가쉬, 3단계 방책, 부락 방 그래픽
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ 챕터 3 — 핏빛 엄니 부락 (v0.53)
  // 오크는 "몬스터는 무기를 들지 않음"의 예외 (고블린 아처의 활과 함께). 늑대·트롤·고블린 노예는 맨몸.
  // 모든 그래픽은 2px 칸 · 검은 외곽선 · 4단계 명암(왼쪽 위 빛). 거대 엘리트·보스도 칸 크기는 그대로 두고 칸 수를 늘려 키운다.
  const ORC_BASE = { k: '#0b0a0e', e: '#ffd23a', w: '#ece0c4', W: '#b8ac90', b: '#7a5034', B: '#4e3020', m: '#a4a4b0', M: '#5e5e6a', n: '#e4e4ec', H: '#1a1214', r: '#a32a2a', R: '#5e1416', y: '#d8a840', c: '#ff8a3a', o: '#8a6034', O: '#5a3a1e', s: '#d8c49a', S: '#a89068', g: '#7ad050', f: '#8a7860', F: '#5a4a3a', p: '#e8e2d4', q: '#d8b040' };
  const ORC_SKINS = {
    green: { h: '#8fb35e', l: '#6e9444', d: '#4c6c30', D: '#30481f' },
    moss: { h: '#9aa85a', l: '#7a883e', d: '#56622a', D: '#38401a' },
    ash: { h: '#9aaa86', l: '#7a8a68', d: '#56644a', D: '#3a4432' },
    dark: { h: '#76984c', l: '#587a36', d: '#3e5826', D: '#283a18' },
    brown: { h: '#a0905a', l: '#7e7040', d: '#5a4e2a', D: '#3a321a' },
    scar: { h: '#8aa070', l: '#6a8052', d: '#4a5a38', D: '#2e3a22' },
    olive: { h: '#a8a860', l: '#868642', d: '#5e5e2c', D: '#3c3c1a' },
    red: { h: '#a8806a', l: '#88604c', d: '#604232', D: '#3c281e' },
    troll: { h: '#9aa8a8', l: '#76848a', d: '#56626a', D: '#3a444c' },
    cave: { h: '#9a9a72', l: '#787a54', d: '#56583a', D: '#383a24' },
    boss: { h: '#74a04a', l: '#527c32', d: '#365a20', D: '#203a12' }, // v0.91 짙은 녹색
    // v0.91 오크 피부 4색 — 개체마다 무작위 (녹색 · 황토 · 핏빛 · 잿빛)
    v0: { h: '#8fb35e', l: '#6e9444', d: '#4c6c30', D: '#30481f' },
    v1: { h: '#bc9c5c', l: '#967a3e', d: '#6a5428', D: '#44361a' },
    v2: { h: '#c07a5e', l: '#9a5a42', d: '#6c3c2c', D: '#46241a' },
    v3: { h: '#9aa2a2', l: '#788282', d: '#545c5e', D: '#363c3e' },
  };
  const ORC_VAR_T = { orc: 1, othrow: 1, shaman: 1, odrum: 1, ogrip: 1 }; // v1.38 돌격대장은 몸이 갑옷이라 팔만 색이 바뀌어 보여서 고유 색으로
  const orcPal = (skin, extra) => Object.assign({}, ORC_BASE, ORC_SKINS[skin], extra || {});
  // 측면(오른쪽을 봄) 오크 몸통 — 꼿꼿이 선 체형 (v0.54). 넓은 어깨에서 허리로 좁아지는 상체, 어깨 위에 얹힌 머리와 내민 아래턱.
  // 부위마다 따로 칠하고, 앞 부위가 뒤 부위를 덮는 경계에는 안쪽 외곽선. 앞팔+무기는 어깨(삼각근)를 축으로 따로 회전한다
  function genOrcBody(o) {
    const W = o.W, H = o.H, GH = H + (o.padTop || 0), g = mkGrid(W, GH), K = (x, y) => y * W + x;
    const ell = (cx, cy, rx, ry) => { const m = new Map(); rx = Math.max(1, rx); ry = Math.max(1, ry); for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) m.set(K(x, y), [x, y, dx, dy]); } return m; };
    const rect = (x0, y0, x1, y1) => { const m = new Map(); x0 = Math.round(x0); x1 = Math.round(x1); y0 = Math.round(y0); y1 = Math.round(y1); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m.set(K(x, y), [x, y, (x - cx) / Math.max(1, (x1 - x0) / 2), (y - cy) / Math.max(1, (y1 - y0) / 2)]); return m; };
    const uni = (...ms) => { const m = new Map(); for (const q of ms) for (const [k, v] of q) if (!m.has(k)) m.set(k, v); return m; };
    const sh4 = (dx, dy, b = 0) => { const v = dx * 0.7 + dy * 0.9 + b; return v < -0.6 ? 'h' : v < 0.05 ? 'l' : v < 0.65 ? 'd' : 'D'; };
    const inb = (x, y) => x >= 1 && x < W - 1 && y >= 1 && y < GH - 1;
    const paint = (m, fn, contour = 'k') => {
      const out = [];
      for (const [, [x, y, dx, dy]] of m) {
        if (!inb(x, y)) continue;
        let edge = false;
        if (contour) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ax, ny = y + ay; if (!m.has(K(nx, ny)) && inb(nx, ny) && g[ny][nx] !== '.') { edge = true; break; } }
        out.push([x, y, edge ? contour : fn(dx, dy, x, y)]);
      }
      for (const [x, y, c] of out) g[y][x] = c;
    };
    const recolor = (m, fn) => { for (const [, [x, y, dx, dy]] of m) if (inb(x, y) && g[y][x] !== '.' && g[y][x] !== 'k') g[y][x] = fn(dx, dy, x, y); };
    const setc = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (inb(x, y)) g[y][x] = c; };
    const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) setc(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); };
    const gy = GH - 2, legH = Math.round(H * (o.leg || 0.3)), torH = Math.round(H * (o.tor || 0.32));
    const waistY = gy - legH, shY = waistY - torH, cx = W * (o.cu || 0.42), shw = W * (o.sh || 0.25), wa = W * (o.wa || 0.16), lean = o.lean || 0.06;
    const off = y => (waistY - y) * lean, hs = o.head || 1, hunch = o.hunch || 0;
    const cS = cx + off(shY);
    // 망토 뒷자락 (몸 뒤)
    if (o.cape) { const yb = gy - 1; for (let y = shY; y <= yb; y++) { const t = (y - shY) / (yb - shY), x0 = cx + off(y) - shw * (1.0 + t * 0.55), x1 = cx + off(y) - shw * 0.0; for (let x = Math.round(x0); x <= Math.round(x1); x++) { if (y >= yb - 2 && ((x * 7 + y * 3) % 5 < (y - (yb - 2)) * 2)) continue; const fold = (x - Math.round(x0) + 1) % 4 === 0; setc(x, y, x <= x0 + 1 ? 'k' : fold ? 'Z' : x < x0 + 3 ? 'A' : (x + y) % 7 === 0 ? 'Z' : 'R'); } } }
    if (o.cloak && !o.cape) { const yb = waistY + Math.round(legH * 0.75); for (let y = shY + 1; y <= yb; y++) { const t = (y - shY) / (yb - shY), x0 = cx + off(y) - shw * (0.85 + t * 0.25), x1 = cx + off(y) - shw * 0.05; for (let x = Math.round(x0); x <= Math.round(x1); x++) if (!(y === yb && (x % 3 === 0))) setc(x, y, (x + y) % 4 === 0 ? 'F' : x < x0 + 2 ? 'f' : 'F'); } }
    // 뒷팔
    if (o.backArm) {
      // 뒷팔도 팔꿈치에서 꺾인다: 어깨 → 팔꿈치(뒤·아래) → 주먹(앞쪽으로)
      const long = o.backArm === 'long', aw = Math.max(2, Math.round(W * (o.armW || 0.1))), r = aw / 2 + 0.2;
      const S0 = { x: cS - shw * 0.5, y: shY + 2 }, E0 = { x: S0.x - aw * 0.6, y: long ? waistY - 1 : waistY - torH * 0.25 }, H0 = long ? { x: E0.x + aw * 0.4, y: gy - 2 } : { x: E0.x + aw * 1.4, y: waistY + 2 };
      const m = new Map(), seg = (A2, B2, rr) => { for (let y = Math.floor(Math.min(A2.y, B2.y) - rr - 1); y <= Math.ceil(Math.max(A2.y, B2.y) + rr + 1); y++) for (let x = Math.floor(Math.min(A2.x, B2.x) - rr - 1); x <= Math.ceil(Math.max(A2.x, B2.x) + rr + 1); x++) { const vx = B2.x - A2.x, vy = B2.y - A2.y, L0 = vx * vx + vy * vy || 1, t = clamp(((x - A2.x) * vx + (y - A2.y) * vy) / L0, 0, 1); if (Math.hypot(x - A2.x - vx * t, y - A2.y - vy * t) <= rr * (1 + 0.25 * Math.sin(Math.PI * t))) m.set(K(x, y), [x, y, (x - A2.x) / (rr * 2), 0]); } };
      seg(S0, E0, r + 0.3); seg(E0, H0, r); for (const [k, v] of ell(H0.x, H0.y + 0.5, r + 0.4, r + 0.3)) m.set(k, v);
      paint(m, (dx) => dx < -0.15 ? 'd' : 'D', null);
      if (long) { setc(H0.x - 1, H0.y + 2, 'w'); setc(H0.x + 1, H0.y + 2, 'w'); }
    }
    // 뒷다리
    const thW = Math.max(2, Math.round(W * (o.thigh || 0.12))), knee = waistY + Math.round(legH * 0.5);
    const blx = cx - W * 0.1, flx = cx + W * 0.06;
    paint(uni(rect(blx, waistY - 1, blx + thW - 1, knee), rect(blx - 1, knee, blx + thW - 2, gy - 2)), (dx) => dx < -0.4 ? 'd' : 'D', null);
    paint(rect(blx - 2, gy - 1, blx + thW - 1, gy), (dx) => dx < 0 ? 'B' : 'k', null);
    // 상체: 어깨에서 허리로 좁아진다 (+가슴 근육, 배)
    const torso = new Map();
    for (let y = shY; y <= waistY; y++) {
      const t = (y - shY) / Math.max(1, waistY - shY);
      let hw = shw + (wa - shw) * Math.pow(t, o.taper || 0.85);
      if (t < 0.18) hw *= Math.sqrt(1 - Math.pow((0.18 - t) / 0.18, 2) * 0.45);
      const c = cx + off(y), pec = t > 0.1 && t < 0.45 ? W * 0.035 * (o.pec || 1) : 0, bel = o.belly ? o.belly * W * 0.09 * Math.sin(Math.PI * clamp((t - 0.35) / 0.65, 0, 1)) : 0;
      for (let x = Math.round(c - hw * 0.9); x <= Math.round(c + hw + pec + bel); x++) torso.set(K(x, y), [x, y, (x - c) / (hw + 0.01), t * 2 - 1]);
    }
    paint(torso, (dx, dy) => sh4(dx, dy), null);
    const pecY = shY + Math.round(torH * 0.42);
    for (let x = Math.round(cx + off(pecY) - shw * 0.05); x <= Math.round(cx + off(pecY) + shw * 0.85); x++) if (g[pecY] && g[pecY][x] && g[pecY][x] !== '.') setc(x, pecY, 'D');
    if (o.abs) for (let y = pecY + 2; y < waistY - 2; y += 2) { setc(cx + off(y) + shw * 0.45, y, 'd'); setc(cx + off(y) + shw * 0.15, y, 'd'); }
    if (o.scars) { const sy = shY + Math.round(torH * 0.3); line(cx - shw * 0.3, sy, cx + shw * 0.2, sy + 3, 'D'); line(cx + shw * 0.1, sy + 4, cx + shw * 0.5, sy + 1, 'D'); }
    if (o.plate) recolor(rect(cx + off(shY) - shw * 0.25, shY + torH * 0.12, cx + off(shY) + shw * 0.95, shY + torH * 0.62), (dx, dy, x, y) => (x + y) % 5 === 0 ? 'n' : dy < -0.4 ? 'm' : 'M');
    if (o.drum) { const du = cx + off(waistY) + shw * 0.9, dv = waistY - torH * 0.25, dr = Math.max(3, torH * 0.38); paint(ell(du, dv, dr * 0.55, dr), (dx) => Math.abs(dx) > 0.72 ? 'b' : dx < -0.25 ? 's' : 'S', 'k'); for (let y = Math.round(dv - dr + 1); y < dv + dr; y += 2) setc(du + dr * 0.42, y, 'B'); }
    if (o.chestPaint) for (let i = 0; i < 3; i++) line(cx + off(shY) + shw * (0.15 + i * 0.22), shY + torH * 0.2, cx + off(shY) + shw * (0.02 + i * 0.22), shY + torH * 0.55, 'r');
    if (o.strap) { // 앞 어깨 → 뒤 허리로 비스듬한 가죽끈, 쇠 징과 작은 해골 전리품 (v0.91)
      const ax = cS + shw * 0.55, ay = shY + 1, bx = cx + off(waistY) - wa * 0.95, by = waistY - 2, n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
      for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, y = ay + (by - ay) * i / n; setc(x, y, i % 4 === 2 ? 'm' : 'b'); setc(x + 1, y, 'B'); }
      const mx = (ax + bx) / 2 + 1, my = (ay + by) / 2; setc(mx, my, 'w'); setc(mx + 1, my, 'w'); setc(mx, my + 1, 'k'); setc(mx + 1, my + 1, 'W'); setc(mx - 1, my - 1, 'w');
    }
    if (o.quiver) { const qn = Math.round(H * 0.42); for (let i = 0; i < 3; i++) for (let t = 0; t < qn; t++) setc(cx - shw * 0.7 + i - t * 0.3, waistY - 2 - t, t >= qn - 2 ? 'm' : 'o'); }
    // 앞다리
    paint(uni(rect(flx, waistY - 1, flx + thW - 1, knee), rect(flx + 1, knee, flx + thW, gy - 2)), (dx) => dx < -0.45 ? 'h' : dx < 0.25 ? 'l' : 'd', 'k');
    paint(rect(flx, gy - 1, flx + thW + 2, gy), (dx) => dx < -0.3 ? 'b' : 'B', 'k');
    if (o.greaves) { recolor(rect(flx + 1, knee, flx + thW, gy - 2), (dx, dy, x, y) => y === knee ? 'n' : dx < -0.3 ? 'n' : dx < 0.4 ? 'm' : 'M'); recolor(rect(flx, gy - 1, flx + thW + 2, gy), (dx) => dx < -0.3 ? 'm' : 'M'); setc(flx + thW + 1, knee, 'w'); }
    // 허리띠 + 아랫도리
    const belt = rect(cx + off(waistY) - wa * 1.1, waistY - 2, cx + off(waistY) + wa * 1.3 + (o.belly ? W * 0.04 : 0), waistY - 1);
    recolor(belt, (dx, dy) => dy < 0 ? 'b' : 'B');
    if (o.buckle === 'skull3') { const bx = Math.round(cx + off(waistY) + wa * 0.7), by = waistY - 3; for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) setc(bx + x, by + y, y === 0 ? 'q' : x === 1 && y === 1 ? 'y' : y === 1 ? 'k' : x === 1 ? 'k' : 'y'); }
    else if (o.buckle) { const bx = cx + off(waistY) + wa * 0.9; setc(bx, waistY - 2, o.buckle === 'gold' ? 'y' : 'w'); setc(bx + 1, waistY - 2, o.buckle === 'gold' ? 'y' : 'W'); setc(bx, waistY - 1, o.buckle === 'gold' ? 'y' : 'k'); }
    const kl = o.kilt || 'loin', kc = kl === 'fur' ? ['f', 'F'] : kl === 'red' ? ['r', 'R'] : kl === 'skirt' ? ['b', 'M'] : ['b', 'B'];
    const kx0 = kl === 'loin' ? cx + off(waistY) - wa * 0.2 : cx + off(waistY) - wa * 1.1, kx1 = cx + off(waistY) + wa * 1.15, ky1 = waistY + Math.round(legH * (kl === 'loin' ? 0.45 : 0.38));
    paint(rect(kx0, waistY, kx1, ky1), (dx, dy, x, y) => y === ky1 && x % 2 ? '.' : (kl === 'skirt' && x % 3 === 0) ? kc[1] : dy < -0.3 ? kc[0] : (x + y) % 3 ? kc[1] : kc[0], 'k');
    for (let x = Math.round(kx0); x <= Math.round(kx1); x++) if (g[ky1] && g[ky1][x] === '.' && g[ky1 - 1][x] !== '.') { /* 너덜너덜한 끝 */ }
    if (o.tassets) { // 털 아랫도리 위에 쇠 판금 두 장 + 가운데 늘어진 붉은 천 (v0.91)
      for (const [x0, x1] of [[kx0 + 1, kx0 + (kx1 - kx0) * 0.38], [kx0 + (kx1 - kx0) * 0.62, kx1]]) paint(rect(x0, waistY, x1, ky1 - 1), (dx, dy, x, y) => y === waistY + 1 && x % 2 ? 'y' : dx < -0.4 ? 'n' : dy > 0.4 ? 'M' : 'm', 'k');
      const fx = Math.round(kx0 + (kx1 - kx0) * 0.5); for (let y = waistY; y <= ky1 + 3; y++) for (let x = fx - 1; x <= fx + 1; x++) { if (y === ky1 + 3 && x !== fx) continue; setc(x, y, x === fx - 1 ? 'A' : x === fx + 1 ? 'R' : 'r'); }
    }
    // 앞 어깨 (삼각근) + 어깨 보호대 — 앞팔이 여기서 나온다
    const dX = cS + shw * 0.22, dY = shY + torH * 0.22, dl = o.delt || 1;
    paint(ell(dX, dY, W * 0.095 * dl, H * 0.06 * dl), (dx, dy) => sh4(dx, dy, -0.25), 'k');
    if (o.pauld === 'spiked') { // v0.91: 금 테두리 쇠 어깨갑옷 + 뒤로 휜 뼈 가시 셋 + 해골 장식
      const prx = W * 0.15 * dl, pry = H * 0.07 * dl, px = dX - 0.5, py = dY - H * 0.035 * dl;
      for (const i of [-1, 0, 1]) { const bx = px + i * prx * 0.55, by = py - pry * 0.55, L = i === 0 ? 6 : 5; for (let t = 0; t <= L; t++) { const x = bx - t * 0.45 - t * t * 0.05, y = by - t; setc(x, y, t === L ? 'W' : 'w'); if (t < L - 1) setc(x + 1, y, 'W'); } }
      paint(ell(px, py, prx, pry), (dx, dy) => dy > 0.55 ? 'y' : dy > 0.3 ? 'M' : dx < -0.25 && dy < 0 ? 'n' : dy < -0.05 ? 'm' : 'M', 'k');
      const kx = Math.round(px + prx * 0.25), ky = Math.round(py - pry * 0.05); setc(kx, ky, 'w'); setc(kx + 1, ky, 'w'); setc(kx, ky + 1, 'k'); setc(kx + 1, ky + 1, 'W');
    } else if (o.pauld) {
      const pc = o.pauld === 'metal' ? ['n', 'm', 'M'] : o.pauld === 'bone' ? ['w', 'W', 'B'] : ['b', 'B', 'k'];
      paint(ell(dX - 0.5, dY - H * 0.03 * dl, W * 0.115 * dl, H * 0.05 * dl), (dx, dy) => dy > 0.35 ? pc[2] : dx < -0.2 && dy < 0 ? pc[0] : pc[1], 'k');
      for (let i = -1; i <= 1; i++) { setc(dX + i * W * 0.05 * dl, dY - H * 0.08 * dl - 1, 'w'); if (o.pauld !== 'hide') setc(dX + i * W * 0.05 * dl, dY - H * 0.08 * dl - 2, 'W'); }
    }
    // 머리 (어깨 위) + 내민 아래턱
    const hx = cS + shw * (o.hfwd || 0.4) + hunch * W * 0.12, hy = shY - H * 0.085 * hs + hunch * H * 0.12, hrx = W * 0.115 * hs, hry = H * 0.085 * hs;
    const head = ell(hx, hy, hrx, hry), jaw = ell(hx + hrx * 0.35, hy + hry * 0.55, hrx * 0.88, hry * 0.6);
    // 굵은 목
    paint(rect(hx - hrx * 0.6, hy, hx + hrx * 0.3, shY + 2), (dx) => dx < 0 ? 'd' : 'D', null);
    paint(uni(head, jaw), (dx, dy) => sh4(dx, dy, -0.15), 'k');
    recolor(jaw, (dx, dy) => dy > 0.25 ? 'D' : 'd');
    line(hx - hrx * 0.2, hy + hry * 0.38, hx + hrx * 1.05, hy + hry * 0.38, 'D'); // 입
    for (let x = Math.round(hx); x <= Math.round(hx + hrx * 0.95); x++) setc(x, hy - hry * 0.42, 'D'); // 눈썹 뼈
    setc(hx + hrx * 1.12, hy - hry * 0.05, 'l'); setc(hx + hrx * 1.12, hy + hry * 0.12, 'd'); // 코
    setc(hx + hrx * 0.55, hy - hry * 0.15, 'e'); if (W >= 36) setc(hx + hrx * 0.55 + 1, hy - hry * 0.15, 'e');
    if (o.scarEye) line(hx + hrx * 0.35, hy - hry * 0.6, hx + hrx * 0.8, hy + hry * 0.25, 'R');
    // 뾰족한 귀 (뒤로)
    line(hx - hrx * 0.75, hy - hry * 0.1, hx - hrx * 1.45, hy - hry * 0.8, 'l'); setc(hx - hrx * 1.55, hy - hry * 0.95, 'd');
    if (o.earring) setc(hx - hrx * 0.85, hy + hry * 0.2, 'y');
    if (o.warpaint) { line(hx - hrx * 0.1, hy - hry * 0.15, hx + hrx * 0.95, hy - hry * 0.15, 'r'); line(hx + hrx * 0.2, hy + hry * 0.05, hx + hrx * 0.2, hy + hry * 0.6, 'r'); }
    else if (o.paint) for (let i = 0; i < 3; i++) setc(hx + hrx * (0.1 + i * 0.3), hy + hry * 0.05, o.paint === 'white' ? 'p' : 'r');
    // 엄니
    const tk = o.tusk == null ? 1 : o.tusk, tx = Math.round(hx + hrx * 1.0), ty = Math.round(hy + hry * 0.3);
    for (let i = 0; i <= tk; i++) { setc(tx, ty - i, i === tk ? 'W' : 'w'); if (tk >= 3) setc(tx - 1, ty - i + 1, 'W'); }
    if (tk >= 2) { setc(tx - 3, ty, 'w'); setc(tx - 3, ty - 1, 'W'); }
    // 머리 장식
    const top = x => { for (let y = 0; y < GH; y++) if (g[y][x] !== '.') return y; return GH; };
    const hh = o.hair;
    if (hh === 'mohawk') for (let x = Math.round(hx - hrx * 0.7); x <= Math.round(hx + hrx * 0.35); x++) { const y = top(x); setc(x, y - 1, 'H'); setc(x, y - 2, 'H'); if (x % 2 === 0) setc(x, y - 3, 'H'); }
    if (hh === 'topknot') { const kx = hx - hrx * 0.2, ky = hy - hry * 1.05; paint(ell(kx, ky - 1, 1.8, 1.6), () => 'H', 'k'); line(kx - 1, ky, kx - hrx * 1.1, ky + hry * 1.2, 'H'); setc(kx, ky + 1, 'y'); }
    if (hh === 'braid') { const bx = hx - hrx * 0.9, by = hy - hry * 0.5; for (let i = 0; i < Math.round(H * 0.25); i++) setc(bx - i * 0.25, by + i, i % 2 ? 'H' : 'F'); setc(bx - Math.round(H * 0.25) * 0.25, by + Math.round(H * 0.25), 'y'); }
    if (hh === 'band') { for (let x = Math.round(hx - hrx * 0.9); x <= Math.round(hx + hrx * 0.85); x++) { const y = top(x); setc(x, y + 1, 'r'); } setc(hx - hrx * 0.9, hy - hry * 1.0, 'q'); setc(hx - hrx * 1.1, hy - hry * 1.5, 'q'); setc(hx - hrx * 1.2, hy - hry * 1.9, 'q'); setc(hx - hrx * 1.0, hy - hry * 1.4, 'w'); }
    if (hh === 'hornhelm') {
      paint(ell(hx - hrx * 0.05, hy - hry * 0.45, hrx * 1.08, hry * 0.68), (dx, dy) => dy > 0.3 ? 'k' : dx < -0.2 ? 'n' : dy < -0.2 ? 'm' : 'M', 'k');
      for (let x = Math.round(hx + hrx * 0.1); x <= Math.round(hx + hrx * 0.4); x++) setc(x, hy - hry * 0.05, 'M');
      line(hx + hrx * 0.7, hy - hry * 0.75, hx + hrx * 1.5, hy - hry * 1.9, 'w'); line(hx - hrx * 0.6, hy - hry * 0.85, hx - hrx * 1.4, hy - hry * 1.9, 'W');
    }
    if (hh === 'skull') {
      paint(ell(hx + hrx * 0.1, hy - hry * 0.55, hrx * 1.15, hry * 0.62), (dx) => dx < 0.1 ? 'w' : 'W', 'k');
      setc(hx + hrx * 0.55, hy - hry * 0.55, 'k'); setc(hx + hrx * 0.95, hy - hry * 0.45, 'k');
      line(hx - hrx * 0.5, hy - hry * 1.0, hx - hrx * 1.1, hy - hry * 1.9, 'W'); line(hx + hrx * 0.2, hy - hry * 1.05, hx + hrx * 0.5, hy - hry * 1.9, 'w');
      setc(hx - hrx * 1.2, hy - hry * 0.8, 'q'); setc(hx - hrx * 1.4, hy - hry * 1.2, 'q');
    }
    if (hh === 'crown') {
      const cy0 = Math.round(hy - hry * 0.85);
      for (let x = Math.round(hx - hrx * 0.95); x <= Math.round(hx + hrx * 0.75); x++) { setc(x, cy0, 'W'); setc(x, cy0 - 1, 'w'); if (x % 3 === 0) { setc(x, cy0 - 2, 'w'); setc(x, cy0 - 3, 'W'); } }
      const sx = Math.round(hx - hrx * 0.1); setc(sx, cy0 - 1, 'c'); setc(sx, cy0 - 2, 'c'); setc(sx, cy0 - 3, 'y'); setc(sx + 1, cy0 - 1, 'y'); setc(sx - 1, cy0 - 1, 'y');
    }
    if (hh === 'bald') setc(hx - hrx * 0.2, hy - hry * 0.75, 'h');
    if (hh === 'warhelm') { // v0.91 크루가쉬: 금 테를 두른 철 투구 + 크게 휜 뿔 두 개 + 이마 해골 + 투구 아래로 빛나는 눈
      const horn = (x0, y0, x1, y1, x2, y2, r0) => { const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, u = 1 - t; pts.push([u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2, t]); }
        for (const [x, y, t] of pts) { const rr = r0 * (1 - t * 0.75); for (let yy = Math.floor(y - rr); yy <= Math.ceil(y + rr); yy++) for (let xx = Math.floor(x - rr); xx <= Math.ceil(x + rr); xx++) if (Math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= rr + 0.2) setc(xx, yy, t > 0.85 ? 'B' : t > 0.6 ? 'W' : (yy < y ? 'w' : 'W')); } };
      horn(hx - hrx * 0.6, hy - hry * 0.85, hx - hrx * 1.85, hy - hry * 0.75, hx - hrx * 1.55, hy - hry * 2.7, 2.1);
      horn(hx + hrx * 0.45, hy - hry * 0.95, hx + hrx * 2.0, hy - hry * 0.95, hx + hrx * 1.6, hy - hry * 2.65, 2.0);
      paint(ell(hx - hrx * 0.05, hy - hry * 0.8, hrx * 1.02, hry * 0.5), (dx, dy) => dy > 0.4 ? 'y' : dx < -0.3 && dy < -0.1 ? 'n' : dy < 0.05 ? 'm' : 'M', 'k');
      setc(hx - hrx * 0.6, hy - hry * 0.85, 'y'); setc(hx + hrx * 0.45, hy - hry * 0.95, 'y'); // 뿔 밑 금 고리
      setc(hx + hrx * 0.95, hy - hry * 0.35, 'M'); // 코 가리개
      const sx = Math.round(hx + hrx * 0.15), sy = Math.round(hy - hry * 1.0); setc(sx, sy, 'w'); setc(sx + 1, sy, 'w'); setc(sx, sy + 1, 'k'); setc(sx + 1, sy + 1, 'W'); // 이마 해골
      const ex = Math.round(hx + hrx * 0.5), ey = Math.round(hy - hry * 0.12); setc(ex - 1, ey - 1, 'k'); setc(ex, ey - 1, 'k'); setc(ex + 1, ey - 1, 'k'); setc(ex, ey, 'e'); setc(ex + 1, ey, 'E');
    }
    // 망토 어깨 털 (머리 뒤 · 어깨 위)
    if (o.cloak || o.cape) paint(ell(cS - shw * 0.15, shY + 1, shw * 0.95, Math.max(2, H * 0.05)), (dx, dy, x, y) => (x + y) % 3 === 0 ? 'F' : dy < 0 ? 'f' : 'F', 'k');
    if (o.collar) for (let x = Math.round(hx - hrx * 0.9); x <= Math.round(hx + hrx * 0.3); x++) setc(x, shY + 1, x % 2 ? 'm' : 'M');
    if (o.necklace) for (let i = 0; i < 5; i++) setc(hx - hrx * 0.4 + i * hrx * 0.32, shY + 2 + Math.abs(i - 2) * -0.5 + 1, i % 2 ? 'w' : o.necklace === 'skull' ? 'W' : 'w');
    return { g: gOutline(g), W, H, shX: dX, shY: dY };
  }
  // 앞팔 + 무기 (cellWeapon: 어깨가 축, 0°일 때 앞으로 뻗음)
  // 앞팔 + 무기 (cellWeapon: 어깨가 축, 0°일 때 앞으로 뻗음)
  // 위팔(이두근이 불룩) → 팔꿈치에서 꺾인 아래팔 → 둥근 주먹, 무기는 아래팔 방향으로 쥔다 (v0.55)
  function genArm(o) {
    const L = o.len, th = o.th, wl = o.wlen || 0, pal = Object.assign({}, orcPal(o.skin), o.pal || {});
    // 1) 무기를 손 기준 로컬 좌표(앞 = +x)에 그린다
    const WM = new Map(), put = (x, y, c) => WM.set(x + ',' + y, c), k = o.kind, hd = o.head || 4;
    // 무기는 몸보다 크게 (v0.56) — 손(0,0)에서 앞(+x)으로
    if (k === 'axe' || k === 'greataxe') {
      const big = k === 'greataxe', ht = big ? 2 : 1;
      for (let x = -3; x < wl; x++) for (let t = 0; t < ht; t++) put(x, t, (x + t) % 4 === 0 ? 'O' : t ? 'O' : 'o');
      for (let x = 2; x < wl - 4; x += 5) { put(x, -1, 'b'); put(x, ht, 'B'); } // 손잡이 감은 가죽
      const bw = Math.max(4, Math.round(hd * (big ? 0.75 : 0.7))), bx0 = wl - bw - (big ? 1 : 0);
      const blade = (sgn, h) => { for (let x = bx0; x < bx0 + bw; x++) { const t = (x - bx0) / (bw - 1), hh = Math.round(h * (0.35 + 0.65 * Math.sin(t * Math.PI * 0.5 + 0.2))); for (let y = 1; y <= hh; y++) { const yy = sgn < 0 ? -y : ht - 1 + y; const de = bx0 + bw - 1 - x; put(x, yy, de === 0 ? 'n' : de === 1 ? 'm' : y === hh ? 'm' : y === 1 ? 'k' : 'M'); } } };
      blade(-1, hd); blade(1, big ? hd : Math.round(hd * 0.45)); // 위 날 + 아래 수염 (대도끼는 양날)
      if (!big) { put(bx0 - 1, -1, 'M'); put(bx0 - 2, -2, 'm'); } // 뒤 가시
      put(wl, 0, 'm'); put(wl + 1, 0, 'n'); if (big) { put(wl, 1, 'm'); put(wl + 2, 0, 'n'); put(wl + 1, 1, 'n'); for (let y = 0; y < 5; y++) put(1 + (y % 2), ht + 1 + y, y < 2 ? 'r' : 'R'); }
    } else if (k === 'warAxe') { // 크루가쉬의 핏빛 대도끼 (v0.84): 초승달 양날, 톱니 날끝, 금 해골 장식, 타오르는 룬, 위 찌르기 가시, 뼈 물미, 사슬 해골, 흘러내리는 피
      const ht = 2, H = hd, hx = wl - 5, wmax = 7;
      for (let x = -3; x < wl; x++) for (let t = 0; t < ht; t++) put(x, t, x < 7 ? ((x + t) % 2 ? 'r' : 'R') : (x + t) % 4 === 0 ? 'O' : t ? 'O' : 'o');
      for (const gx of [7, 15, 23]) if (gx < hx - 3) { put(gx, -1, 'q'); put(gx, 0, 'y'); put(gx, 1, 'q'); put(gx, 2, 'q'); }
      for (let i = 0; i < 4; i++) { put(-4 - i, 0, i < 3 ? 'w' : 'W'); if (i < 2) put(-4 - i, 1, 'W'); } // 뼈 물미
      for (const sgn of [-1, 1]) {
        const maxd = x => H - 2.4 * Math.pow((x - hx) / wmax, 2), Y = d => sgn < 0 ? -d : ht - 1 + d;
        for (let x = hx - wmax - 1; x <= hx + wmax + 1; x++) for (let d = 1; d <= H; d++) {
          const wn = 1.5 + (wmax - 1.5) * Math.pow(Math.min(1, d / (H * 0.72)), 1.3), md = maxd(x);
          const horn = Math.abs(x - hx) === wmax + 1 && d >= md - 3 && d <= md - 0.5; // 날 양끝이 뒤로 말린 뿔
          if (!horn && (Math.abs(x - hx) > wn || d > md)) continue;
          const edge = d > md - 1.2 || horn && d > md - 1.5;
          let c = edge ? 'E' : d <= 1 ? 'Z' : x < hx - 1 ? 'A' : x > hx + 2 ? 'R' : 'r';
          if (edge && d > 4 && (x + 40) % 3 === 0) c = 'R'; // 톱니: 날끝이 이빨처럼 끊김
          put(x, Y(d), c);
        }
        const rd = Math.round(H * 0.42); for (const [dx, dd] of [[-2, 0], [0, 0], [2, 0], [-1, 1], [1, -1]]) put(hx + dx, Y(rd + dd), 'c'); // 타오르는 룬
      }
      for (let x = hx - 2; x <= hx + 1; x++) for (let y = -2; y <= ht + 1; y++) put(x, y, (y === -2 || y === ht + 1) ? 'q' : x === hx - 2 ? 'y' : 'q'); // 금 해골 받침
      put(hx - 1, -1, 'w'); put(hx, -1, 'w'); put(hx - 1, 0, 'e'); put(hx, 1, 'e'); put(hx - 1, 2, 'w'); put(hx, 2, 'W');
      for (let i = 0; i < 6; i++) { put(wl + i, 0, i < 5 ? 'n' : 'm'); if (i < 3) put(wl + i, 1, 'm'); } // 위 찌르기 가시
      for (let i = 0; i < 4; i++) put(hx - 4, ht + 1 + i, i % 2 ? 'M' : 'm'); put(hx - 5, ht + 5, 'w'); put(hx - 4, ht + 5, 'w'); put(hx - 5, ht + 6, 'W'); put(hx - 4, ht + 6, 'k'); // 사슬 해골
      for (const [x, L] of [[hx - 3, 2], [hx + 2, 3]]) for (let i = 0; i < L; i++) put(x, ht - 1 + Math.floor(H - 2.4 * Math.pow((x - hx) / wmax, 2)) + 1 + i, i < L - 1 ? 'R' : 'r'); // 날끝에 맺혀 흘러내리는 피
    } else if (k === 'spear') {
      for (let x = -5; x < wl; x++) put(x, 0, x % 6 === 0 ? 'O' : 'o');
      for (let i = 0; i < 6; i++) { const w2 = i < 2 ? i + 1 : i < 4 ? 2 : 1; for (let y = -w2 + 1; y <= w2 - 1; y++) put(wl + i, y, y === 0 ? 'n' : y < 0 ? 'm' : 'M'); }
      put(wl - 1, -1, 'r'); put(wl - 1, 1, 'r'); put(wl - 2, 2, 'R'); put(wl - 3, 3, 'q');
    } else if (k === 'staff') {
      for (let x = -4; x < wl; x++) put(x, (x % 7 === 3 ? 1 : 0), x % 5 === 0 ? 'O' : 'o');
      const sx = wl; // 짐승 두개골(길쭉한 주둥이) + 휜 뿔 두 개 + 붉은 보석 + 깃털
      for (let x = 0; x <= 2; x++) for (let y = -2; y <= 2; y++) put(sx + x, y, y === -2 ? 'w' : y === 2 ? 'W' : 'w');
      for (let x = 3; x <= 5; x++) for (let y = -1; y <= 1; y++) put(sx + x, y, y === 1 ? 'W' : 'w');
      put(sx + 1, -1, 'k'); put(sx + 1, 1, 'k'); put(sx + 4, 0, 'k'); put(sx + 6, 0, 'W'); put(sx + 6, -1, 'w');
      for (const sg of [-1, 1]) { put(sx, sg * 3, 'W'); put(sx - 1, sg * 4, 'W'); put(sx - 1, sg * 5, 'w'); put(sx, sg * 6, 'w'); }
      put(sx - 1, 0, 'r'); put(sx - 2, 1, 'q'); put(sx - 3, 2, 'q'); put(sx - 3, 3, 'r');
    } else if (k === 'club') {
      for (let x = -2; x < wl; x++) { const t = (x + 2) / (wl + 2), r = Math.max(0, Math.round(t * t * hd)); for (let y = -r; y <= Math.max(0, r - 1); y++) put(x, y, y === -r ? 'o' : y >= r - 1 && r > 1 ? 'O' : (x + y) % 4 ? 'o' : 'O'); if (r >= 2 && x % 3 === 0) { put(x, -r - 1, 'n'); put(x, r, 'n'); } }
      put(wl, 0, 'n'); put(wl, -1, 'm');
    } else if (k === 'stick') {
      for (let x = -1; x < wl; x++) put(x, 0, x % 3 === 0 ? 'W' : 'w');
      for (let y = -2; y <= 2; y++) for (let x = 0; x < 3; x++) if (Math.abs(y) + Math.abs(x - 1) <= 2) put(wl + x, y, y < 0 ? 'w' : 'W');
      for (let y = -1; y <= 1; y++) put(-2, y, 'W');
    } else if (k === 'gauntlet') {
      const g2 = Math.max(th + 1, hd);
      const cx2 = -g2 / 2 + 1.5, rx2 = g2 / 2 + 1.2, ry2 = g2 / 2 + 0.3;
      for (let x = -g2; x <= 3; x++) for (let y = -Math.ceil(ry2); y <= Math.ceil(ry2); y++) { const dx = (x - cx2) / rx2, dy = y / ry2; if (dx * dx + dy * dy <= 1) put(x, y, dy < -0.55 ? 'n' : dy < 0 ? 'm' : dy < 0.6 ? 'M' : 'k'); }
      for (let x = Math.round(cx2 - rx2 * 0.6); x <= Math.round(cx2 + rx2 * 0.6); x += 2) put(x, Math.round(ry2 * 0.15), 'k'); // 손가락 마디
      const sp2 = [-Math.round(ry2 * 0.5), 0, Math.round(ry2 * 0.5)]; for (const y of sp2) { put(Math.round(cx2 + rx2) + 1, y, 'n'); put(Math.round(cx2 + rx2) + 2, y, 'n'); } // 주먹 가시
    } else if (k === 'boneaxe') { // v2.45 뼈도끼: 가죽 감은 나무 자루 + 끈으로 묶은 짐승 뼈 날
      for (let x = -3; x < wl; x++) put(x, 0, x % 4 === 1 ? 'b' : 'o');
      const h = hd; for (let x = wl - 5; x <= wl; x++) { const t = (x - (wl - 5)) / 5, hh = Math.round(h * (0.45 + 0.55 * Math.sin(t * Math.PI * 0.6 + 0.3))); for (let y = 1; y <= hh; y++) put(x, -y, y === hh || x === wl ? 'w' : 'W'); }
      put(wl - 5, 1, 'W'); put(wl - 4, 1, 'w'); put(wl - 6, 0, 'b'); put(wl - 6, -1, 'b'); put(wl + 1, 0, 'W'); // 아래 뼈 갈고리 · 묶은 끈
    } else if (k === 'slasher') { // v2.45 슬래셔: 녹슨 쇠판을 두들겨 만든 넓적한 식칼 도끼 (이 빠진 날 · 녹)
      for (let x = -2; x < 4; x++) { put(x, 0, x % 3 === 0 ? 'b' : 'O'); put(x, 1, 'O'); }
      for (let x = 3; x < wl; x++) { const top = -hd + (x > wl - 3 ? (x - (wl - 3)) : 0); for (let y = top; y <= 1; y++) { const edge = y === top, nick = edge && (x % 4 === 2); put(x, y, nick ? 'M' : edge ? 'n' : y === 1 ? 'M' : 'm'); } }
      // v2.45 피: 날끝 한 곳에 뭉쳐 묻고, 그 아래로 흘러내린 자국 두 줄 (점처럼 흩뿌리지 않음)
      { const bx = wl - 6, top0 = -hd; for (let x = bx; x <= bx + 3; x++) { put(x, top0 + 1, x === bx || x === bx + 3 ? 'R' : 'r'); if (x > bx && x < bx + 3) put(x, top0 + 2, 'R'); } for (let d = 2; d <= 4; d++) put(bx + 1, top0 + d, d === 4 ? 'R' : 'r'); for (let d = 2; d <= 3; d++) put(bx + 3, top0 + d, d === 3 ? 'R' : 'r'); }
      put(4, -1, 'k'); put(5, -1, 'M'); // 손잡이 쪽 구멍
    } else if (k === 'hatchet') { // v2.45 손도끼: 짧은 자루 + 작은 돌·쇠 날 (던지거나 북을 치는 데도 씀)
      for (let x = -2; x < wl; x++) put(x, 0, x % 3 === 0 ? 'b' : 'o');
      for (let x = wl - 3; x <= wl; x++) for (let y = 1; y <= hd - (wl - x === 3 ? 1 : 0); y++) put(x, -y, y === hd - (wl - x === 3 ? 1 : 0) ? 'n' : 'm');
      put(wl - 3, 1, 'M'); put(wl - 2, 1, 'M');
    } else if (k === 'greatbone') { // v2.45 우르그의 뼈 대도끼: 긴 자루 · 위아래 양날의 큰 뼈 날 · 금 고리 · 붉은 천
      for (let x = -4; x < wl; x++) for (let t = 0; t < 2; t++) put(x, t, (x + t) % 5 === 0 ? 'O' : 'o');
      for (const sg of [-1, 1]) for (let x = wl - 6; x <= wl; x++) { const tt = (x - (wl - 6)) / 6, hh = Math.round(hd * (0.4 + 0.6 * Math.sin(tt * Math.PI * 0.75 + 0.2))); for (let d = 1; d <= hh; d++) put(x, sg < 0 ? -d : 1 + d, d === hh || x === wl ? 'w' : 'W'); }
      put(wl - 7, 0, 'y'); put(wl - 7, 1, 'y'); for (let i = 0; i < 4; i++) put(wl - 8 - (i % 2), 2 + i, i < 2 ? 'r' : 'R');
    } else if (k === 'totem') { // v2.45 주술사의 토템 도끼: 긴 자루 끝에 짐승 두개골, 그 아래 뼈 날
      for (let x = -4; x < wl; x++) put(x, (x % 7 === 3 ? 1 : 0), x % 5 === 0 ? 'O' : 'o');
      for (let x = 0; x <= 2; x++) for (let y = -2; y <= 2; y++) put(wl + x, y, y === 2 ? 'W' : 'w');
      put(wl + 3, -1, 'w'); put(wl + 3, 0, 'w'); put(wl + 4, 0, 'W'); put(wl + 1, -1, 'k'); put(wl + 1, 1, 'k'); put(wl - 1, 0, 'r');
      for (let x = wl - 5; x <= wl - 2; x++) for (let y = 1; y <= 3 - (x === wl - 5 ? 1 : 0); y++) put(x, y, y >= 3 - (x === wl - 5 ? 1 : 0) ? 'w' : 'W');
    } else if (k === 'stoneaxe') { // v2.45 돌도끼: 쐐기 모양 돌덩이를 가죽끈으로 동여맴
      for (let x = -3; x < wl; x++) put(x, 0, x % 4 === 2 ? 'b' : 'o');
      for (let x = wl - 4; x <= wl; x++) { const t = x - (wl - 4), up = Math.round(hd * (0.5 + t * 0.12)), dn = Math.max(1, Math.round(hd * 0.35)); for (let y = -up; y <= dn; y++) put(x, y, x === wl ? 'm' : y === -up ? 'm' : (x + y) % 3 === 0 ? 'M' : 'W'); }
      for (const y of [-1, 0, 1]) put(wl - 5, y, 'b'); put(wl - 3, 1, 'b'); put(wl - 2, -1, 'b');
    } else if (k === 'jawaxe') { // v2.45 턱뼈 도끼: 커다란 짐승 턱뼈를 날로 쓰고 이빨이 그대로 박혀 있음
      for (let x = -3; x < wl; x++) put(x, 0, x % 5 === 0 ? 'O' : 'o');
      for (let x = wl - 6; x <= wl; x++) { const t = (x - (wl - 6)) / 6, hh = Math.round(hd * (0.35 + 0.65 * Math.sin(t * Math.PI * 0.55))); for (let y = 1; y <= hh; y++) put(x, -y, y === hh ? ((x % 2) ? 'n' : 'w') : y === 1 ? 'W' : 'w'); if (x % 2 === 0) put(x, -hh - 1, 'n'); }
      put(wl - 7, 0, 'b'); put(wl - 7, -1, 'b'); put(wl + 1, 0, 'W');
    } else if (k === 'sawaxe') { // v2.45 톱날 도끼: 이를 낸 쇠날 (날 위가 톱니) + 녹
      for (let x = -3; x < wl; x++) put(x, 0, x % 3 === 0 ? 'b' : 'o');
      for (let x = wl - 6; x <= wl; x++) { const hh = hd - (x === wl - 6 ? 2 : x === wl - 5 ? 1 : 0); for (let y = 1; y <= hh; y++) put(x, -y, y === hh ? ((x % 2) ? 'n' : 'M') : 'm'); if (x % 2) put(x, -hh - 1, 'n'); }
      { const bx = wl - 4; for (let x = bx; x <= bx + 2; x++) put(x, -hd + 1, x === bx + 1 ? 'r' : 'R'); put(bx + 1, -hd + 2, 'r'); put(bx + 1, -hd + 3, 'R'); } // 톱니 사이에 낀 피와 한 줄기 흘러내림
      put(wl - 6, 1, 'M'); put(wl - 5, 1, 'M');
    } else if (k === 'doubleaxe') { // v2.45 양날 쇠도끼: 위아래 대칭 날 + 가운데 묶음
      for (let x = -3; x < wl; x++) put(x, 0, x % 4 === 1 ? 'b' : 'o');
      for (const sg of [-1, 1]) for (let x = wl - 5; x <= wl; x++) { const t = (x - (wl - 5)) / 5, hh = Math.round(hd * (0.3 + 0.7 * Math.sin(t * Math.PI * 0.5 + 0.15))); for (let d = 1; d <= hh; d++) put(x, sg * d, d === hh || x === wl ? 'n' : d === 1 ? 'M' : 'm'); }
      put(wl - 6, 0, 'b'); put(wl + 1, 0, 'm');
    } else if (k === 'talon') { // v2.45 트롤 발톱: 손끝에서 뻗은 굵고 휘어진 갈고리 발톱 셋 (뿌리는 어둡고 끝은 밝게)
      for (const [oy, bend] of [[-2, -1], [0, 0], [2, 1]]) for (let t = 0; t <= hd; t++) { const y = oy + (t >= hd - 1 ? bend : 0); put(t, y, t < 2 ? 'W' : t === hd ? 'n' : 'w'); if (t < hd - 1 && oy !== 0) put(t, y + (oy < 0 ? 1 : -1) * 0, t < 2 ? 'W' : 'w'); }
      for (let y = -2; y <= 2; y++) put(-1, y, 'd'); // 발톱 뿌리 (손등)
    } else if (k === 'shackle') { // v2.50 쇠수갑: 손목을 감은 두꺼운 쇠고리(리벳) + 고리·옆고리가 번갈아 이어진 사슬, 끝 고리는 끊어져 벌어짐
      for (let x = -2; x <= 1; x++) for (let y = -hd; y <= hd; y++) put(x, y, y === -hd ? 'M' : y === hd ? 'n' : x === -2 ? 'n' : x === 1 ? 'M' : 'm');
      put(-1, 0, 'M'); put(-1, -hd + 1, 'n'); put(-1, hd - 1, 'n'); // 리벳 · 이음매
      const oval = (s0, open) => { for (let x = s0 + 1; x <= s0 + 3; x++) { put(x, -1, 'M'); if (!(open && x === s0 + 3)) put(x, 1, 'n'); } put(s0, 0, 'm'); if (!open) put(s0 + 4, 0, 'm'); };
      const bar = s0 => { for (let x = s0; x <= s0 + 2; x++) put(x, 0, x === s0 + 1 ? 'M' : 'm'); };
      bar(2); oval(4, true); // 고리 한 마디만 남고 끝은 벌어진 채 끊어짐
    } else if (k === 'claw') {
      for (let i = -1; i <= 1; i++) for (let t = 0; t < 4; t++) put(1 + t, i * 2 + (t > 1 ? (i > 0 ? 1 : 0) : 0), t === 3 ? 'W' : 'w');
    }
    // 2) 팔 뼈대: 어깨 → 팔꿈치 → 손
    const bend = -(o.bend == null ? 30 : o.bend) * DEG, L1 = Math.max(2, Math.round(L * 0.55)), L2 = Math.max(2, L - L1 + 1);
    const E = { x: L1, y: 0 }, ux = Math.cos(bend), uy = Math.sin(bend), Hh = o.noArm ? { x: 0, y: 0 } : { x: E.x + ux * L2, y: E.y + uy * L2 }; // v2.45 noArm: 팔·주먹 없이 무기만 (손이 회전축)
    const r1 = Math.max(1, (th + 1) / 2), r2 = Math.max(0.8, th / 2), fist = o.kind !== 'gauntlet' && o.kind !== 'claw';
    const cells = new Map(), shade = v => v < -0.45 ? 'h' : v < 0.1 ? 'l' : v < 0.6 ? 'd' : 'D';
    const segD = (px, py2, ax, ay, bx, by) => { const vx = bx - ax, vy = by - ay, L0 = vx * vx + vy * vy || 1, t = clamp(((px - ax) * vx + (py2 - ay) * vy) / L0, 0, 1), cx = ax + vx * t, cy = ay + vy * t; return { d: Math.hypot(px - cx, py2 - cy), t, s: (-(px - ax) * vy + (py2 - ay) * vx) / Math.sqrt(L0) }; };
    const R = L + wl + 14;
    for (let y = -R; y <= R; y++) for (let x = o.wdir == null && !o.noArm ? -3 : -R; x <= R; x++) {
      // 무기 (손에서 아래팔 방향으로)
      const wx = o.wdir == null ? (o.noArm ? 1 : ux) : Math.cos(o.wdir * DEG), wy = o.wdir == null ? (o.noArm ? 0 : uy) : Math.sin(o.wdir * DEG), dx = x - Hh.x, dy = y - Hh.y, lx = Math.round(dx * wx + dy * wy), ly = Math.round(-dx * wy + dy * wx), wc = WM.get(lx + ',' + ly);
      const a1 = segD(x, y, 0, 0, E.x, E.y), rr1 = r1 * (1 + 0.3 * Math.sin(Math.PI * a1.t));
      const a2 = segD(x, y, E.x, E.y, Hh.x, Hh.y);
      let c = null;
      if (!o.noArm && a1.d <= rr1) c = shade(a1.s / rr1);
      if (!o.noArm && a2.d <= r2 + 0.15) c = o.bracer && a2.t > 0.25 && a2.t < 0.8 ? (a2.t < 0.33 || a2.t > 0.72 ? 'y' : a2.s < -0.2 ? 'n' : a2.s < 0.4 ? 'm' : 'M') : shade(a2.s / (r2 + 0.15));
      if (wc) c = wc;
      if (fist && !o.noArm && Math.hypot(x - Hh.x, y - Hh.y) <= Math.max(1.1, th * 0.62)) c = (y - Hh.y) < -0.3 ? 'h' : (y - Hh.y) < 0.5 ? 'l' : 'd';
      if (c) cells.set(x + ',' + y, c);
    }
    let mx = 1e9, my = 1e9, Mx = -1e9, My = -1e9;
    for (const k of cells.keys()) { const [x, y] = k.split(',').map(Number); mx = Math.min(mx, x); my = Math.min(my, y); Mx = Math.max(Mx, x); My = Math.max(My, y); }
    const px0 = 1 - mx, py0 = 1 - my;
    return cellWeapon(Mx - mx + 3, My - my + 3, px0, py0, pal, put2 => { for (const [k, c] of cells) { const [x, y] = k.split(',').map(Number); put2(x + px0, y + py0, c); } });
  }
  // 늑대 (네 발, 2프레임)
  function genWolf(frame) {
    const W = 26, H = 15, g = mkGrid(W, H), set = (x, y, c) => { if (y >= 1 && y < H - 1 && x >= 1 && x < W - 1) g[y][x] = c; };
    const ell = (cx, cy, rx, ry, b) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) { const v = dx * 0.6 + dy + b; set(x, y, v < -0.55 ? 'h' : v < 0 ? 'l' : v < 0.55 ? 'd' : 'D'); } } };
    const legs = frame ? [[7, 1], [9, -1], [15, -1], [17, 1]] : [[7, -1], [9, 1], [15, 1], [17, -1]];
    for (const [lx, off] of legs.slice(0, 2)) for (let y = 8; y <= 13; y++) set(lx + (y > 10 ? off : 0), y, 'D');
    for (let t = 0; t < 5; t++) set(5 - t, 6 - Math.round(t * 0.6) + (frame ? 0 : 1), t > 3 ? 'h' : 'd'); // 꼬리
    ell(11, 7, 7.5, 3.4, 0); ell(16, 6.6, 4.4, 4, -0.1);
    for (const [lx, off] of legs.slice(2)) for (let y = 9; y <= 13; y++) set(lx + (y > 10 ? off : 0), y, y === 13 ? 'D' : 'd');
    ell(20.5, 5, 3, 2.6, -0.2);
    for (let x = 22; x <= 24; x++) { set(x, 5, 'l'); set(x, 6, x === 24 ? 'k' : 'd'); }
    set(23, 7, 'w'); set(21, 7, 'w'); set(21, 4, 'e'); set(19, 2, 'l'); set(19, 1, 'd'); set(18, 2, 'd');
    for (let x = 9; x <= 15; x += 2) set(x, 3, 'H');
    return gOutline(g);
  }
  const WOLF_PAL = { k: '#0b0a0e', h: '#6a6470', l: '#4a4652', d: '#2e2a34', D: '#1c1a22', e: '#ff3a20', w: '#ece0c4', H: '#14121a' };
  PAL.wolfd = { k: '#0a080c', d: '#4a4652', D: '#26232c', l: '#6e6a78', L: '#8e8a98', t: '#e0d8c0', c: '#5a3a22', m: '#b4b8c0', e: '#ff3a20' };
  PAL.slave = { k: '#0e100c', s: '#7e8a6c', S: '#525c46', c: '#5a5048', C: '#3a342e', e: '#ff7a3a' };

  // 종류별 설정: 몸통·팔·무기·크기 (W·H 칸, 칸 하나 = 2px)
  const ORC_SPEC = {
    // 캐릭터 도트와 같은 비율 (v0.57): 머리가 키의 40% 안팎, 짧은 몸통과 다리, 적은 칸 수. 기사 12×14칸 · 고블린 14×14칸이 기준
    // 오크 전사: 표준 체격, 모히칸, 가죽 어깨받이, 해골 버클, 큰 도끼
    orc: { body: { W: 18, H: 19, sh: 0.27, wa: 0.2, tor: 0.24, leg: 0.2, head: 2.2, hfwd: 0.15, hair: 'mohawk', pauld: 'hide', buckle: 'skull', backArm: true, thigh: 0.14 }, skin: 'green', arm: { len: 5, th: 2, kind: 'boneaxe', wlen: 12, head: 6, bend: 28 }, tall: 38, rest: 70 },
    // 투척꾼: 홀쭉하고 다리가 조금 긴 사냥꾼, 머리띠와 깃털, 흰 칠, 등에 투창
    othrow: { body: { W: 16, H: 20, sh: 0.23, wa: 0.17, tor: 0.23, leg: 0.24, head: 2.1, hfwd: 0.15, hair: 'band', quiver: true, earring: true, paint: 'white', backArm: true, thigh: 0.13 }, skin: 'moss', arm: { len: 5, th: 2, kind: 'spear', wlen: 14, bend: 18 }, carry: { bend: 135, wdir: 132, ang: 48, front: true }, tall: 40, rest: -150 },
    // 주술사: 늙고 구부정, 짐승 두개골 머리장식, 털 망토, 흰 칠
    shaman: { body: { W: 17, H: 19, sh: 0.22, wa: 0.2, tor: 0.25, leg: 0.19, lean: 0.15, head: 2.1, hfwd: 0.2, hair: 'skull', cloak: true, paint: 'white', kilt: 'fur', backArm: true, tusk: 0, thigh: 0.13 }, skin: 'ash', arm: { len: 5, th: 2, kind: 'totem', wlen: 14, head: 4, bend: 40 }, tall: 38, rest: -60 },
    // 돌격대장: 땅딸막하고 넓적, 뿔 달린 쇠투구, 가슴 쇠판
    ocharge: { body: { W: 22, H: 22, sh: 0.31, wa: 0.25, tor: 0.25, leg: 0.18, head: 2.1, hfwd: 0.15, hair: 'hornhelm', plate: true, pauld: 'metal', kilt: 'skirt', backArm: true, tusk: 2, thigh: 0.15 }, skin: 'dark', arm: { len: 6, th: 3, kind: 'slasher', wlen: 14, head: 5, bend: 28 }, carry: { bend: 135, wdir: 135, ang: 45, front: true }, tall: 44, rest: -178, semi: '돌격대장' },
    // 북잡이: 배불뚝이, 땋은 머리, 배에 북
    odrum: { body: { W: 22, H: 21, sh: 0.28, wa: 0.24, belly: 1, tor: 0.27, leg: 0.17, head: 2.0, hfwd: 0.15, hair: 'braid', earring: true, kilt: 'fur', backArm: true, tusk: 2, thigh: 0.15 }, skin: 'olive', arm: { len: 5, th: 2, kind: 'hatchet', wlen: 7, head: 3, bend: 42 }, tall: 42, rest: 45, semi: '북잡이' },
    // 거구 오크: 가장 큰 근육질, 대머리, 사슬 목줄, 찢어진 눈 흉터, 굵은 팔
    ogrip: { body: { W: 24, H: 24, sh: 0.32, wa: 0.21, tor: 0.27, leg: 0.19, delt: 1.3, head: 1.9, hfwd: 0.15, hair: 'bald', collar: true, scarEye: true, backArm: true, armW: 0.13, tusk: 2, thigh: 0.15 }, skin: 'red', arm: { len: 7, th: 4, kind: 'slasher', wlen: 13, head: 5, bend: 22 }, tall: 48, rest: 80, semi: '거구 오크' },
    // 우르그: 투기장 챔피언, 상투, 뼈 어깨받이, 금 버클, 붉은 허리천
    urg: { body: { W: 28, H: 30, sh: 0.32, wa: 0.2, tor: 0.27, leg: 0.2, delt: 1.3, head: 1.9, hfwd: 0.15, hair: 'topknot', pauld: 'bone', necklace: true, buckle: 'gold', kilt: 'red', scars: true, paint: 'red', backArm: true, armW: 0.12, tusk: 2, thigh: 0.15 }, skin: 'scar', arm: { len: 9, th: 5, kind: 'greatbone', wlen: 18, head: 7, bend: 30 }, tall: 60, rest: 80, elite: true },
    // 트롤: 짐승이라 구부정 (긴 팔을 땅에 끌고 다님)
    troll: { body: { W: 32, H: 27, sh: 0.32, wa: 0.25, tor: 0.32, leg: 0.18, lean: 0.5, hunch: 0.8, head: 1.6, hfwd: 0.5, hair: 'mohawk', kilt: 'fur', backArm: 'long', armW: 0.12, tusk: 0, thigh: 0.15 }, skin: 'troll', pal: { e: '#ffe060' }, arm: { len: 14, th: 5, kind: 'claw', bend: 26, talon: 3 }, tall: 54, rest: 85, elite: true },
    otroll: { body: { W: 24, H: 22, sh: 0.32, wa: 0.25, tor: 0.32, leg: 0.18, lean: 0.4, hunch: 0.7, head: 1.7, hfwd: 0.45, hair: 'mohawk', kilt: 'fur', backArm: 'long', armW: 0.12, tusk: 0, thigh: 0.15 }, skin: 'cave', pal: { e: '#ff9a30' }, arm: { len: 11, th: 4, kind: 'claw', bend: 26, talon: 2 }, tall: 46, rest: 85, semi: '동굴 트롤' },
    // 크루가쉬: 거인 왕, 털 망토, 엄니 왕관, 쇠 어깨받이, 붉은 전투 칠
    // v0.91 재디자인: 흑녹색 블랙 오크 · 뿔 달린 철 투구 · 가시 어깨갑옷 · 붉은 전투 망토 · 해골 가슴끈 · 금 해골 버클 · 쇠 판금 · 정강이·팔 보호대 · 눈을 가로지른 붉은 칠
    krugash: { body: { W: 36, H: 38, padTop: 7, sh: 0.33, wa: 0.23, tor: 0.27, leg: 0.19, belly: 0.25, delt: 1.25, head: 1.9, hfwd: 0.15, hair: 'warhelm', cape: true, pauld: 'spiked', strap: true, chestPaint: true, warpaint: true, scars: true, buckle: 'skull3', kilt: 'fur', tassets: true, greaves: true, backArm: true, tusk: 3, thigh: 0.16 }, skin: 'boss', pal: { e: '#ff3a20', A: '#d83a2c', Z: '#2a0604', E: '#ffe8a0' }, arm: { len: 11, th: 5, kind: 'warAxe', wlen: 30, head: 16, bend: 24, bracer: true }, carry: { bend: 110, wdir: 170, ang: 70 }, tall: 70, rest: -39, boss: true },
  };


  const ORC_T = { orc: 1, othrow: 1, wolf: 1, shaman: 1, slave: 1, ocharge: 1, odrum: 1, otroll: 1, ogrip: 1, urg: 1, troll: 1 };
  const orcArt = {};
  function orcSprite(kind, v) {
    const key = v == null ? kind : kind + '#' + v;
    if (orcArt[key]) return orcArt[key];
    const S = ORC_SPEC[kind], skin = v == null ? S.skin : 'v' + v, pal = orcPal(skin, S.pal);
    const b = withSeed(kind.length * 977, () => genOrcBody(S.body));
    const cv = gCanvas(b.g, pal), wh = art('orcW_' + kind, () => gCanvas(b.g.map(r => r.map(c => c === '.' ? '.' : 'x')), { x: '#ffffff' }));
    // v1.39 다리 분리: 아래에서부터 칸이 두 덩어리로 갈라지는 줄 = 다리. 걷기(왼발·오른발 들기)·웅크림 장면을 칸 단위로 미리 만든다
    const G0 = b.g, H0 = G0.length, W0 = G0[0].length, runs = r => { const out = []; let st = -1; for (let x = 0; x <= W0; x++) { const f = x < W0 && G0[r][x] !== '.'; if (f && st < 0) st = x; if (!f && st >= 0) { out.push([st, x - 1]); st = -1; } } return out; };
    let top = H0; for (let r = H0 - 1; r > H0 * 0.55; r--) { if (runs(r).length >= 2) top = r; else if (top < H0) break; }
    if (H0 - top < 3 && runs(H0 - 1).length >= 2) top = H0 - 3; // v1.54 발끝만 갈라진 오크도 아래 3줄을 다리로
    const legRows = H0 - top, mid = (() => { const rr = runs(H0 - 1); return rr.length >= 2 ? (rr[0][1] + rr[rr.length - 1][0]) / 2 : W0 / 2; })();
    const frame = (lL, lR, down) => { const g = Array.from({ length: H0 }, () => Array(W0).fill('.'));
      for (let y = 0; y < top; y++) for (let x = 0; x < W0; x++) { const ty = y + down; if (G0[y][x] !== '.' && ty < H0) g[ty][x] = G0[y][x]; }
      for (let y = top; y < H0; y++) for (let x = 0; x < W0; x++) { if (G0[y][x] === '.') continue; const ty = y - (x < mid ? lL : lR); if (ty >= 0 && g[ty][x] === '.') g[ty][x] = G0[y][x]; }
      return g; };
    const mk = g => [gCanvas(g, pal), gCanvas(g.map(r => r.map(c => c === '.' ? '.' : 'x')), { x: '#ffffff' })];
    const hRow = Math.round(H0 * 0.42), mkS = (g, d) => ({ h: mk(g.map((r, y) => y < hRow + d ? r : r.map(() => '.'))), b: mk(g.map((r, y) => y >= hRow + d ? r : r.map(() => '.'))), n: mk(g.map((r, y) => y >= hRow + d && y < hRow + d + 2 ? r.map(c => c === 'k' ? '.' : c) : r.map(() => '.'))) }); // v1.54 머리 / 몸 나눔
    const fr2 = (lL, lR, d) => { const g = frame(lL, lR, d), m = mk(g); m.push(mkS(g, d)); return m; };
    const F = legRows >= 2 ? { lL: fr2(1, 0, 0), lR: fr2(0, 1, 0), crouch: fr2(0, 0, 1), low: fr2(0, 0, 2) } : null;
    return (orcArt[key] = { cv, wh, F, sp: legRows >= 2 ? mkS(G0, 0) : null, w: cv.width, h: cv.height, sx: (b.shX + 0.5) * 2 - cv.width / 2, sy: (b.shY + 0.5) * 2 - cv.height + 2, arm: genArm(Object.assign({ skin, pal: S.pal }, S.arm)), carry: S.carry ? genArm(Object.assign({ skin, pal: S.pal }, S.arm, S.carry)) : null });
  }
  function orcSetup(e, kind) {
    const S = ORC_SPEC[kind]; if (!S) return;
    e.orc = kind; e.tall = S.tall; e.aa = S.rest * DEG; e.aaT = e.aa; e.asw = null; e.steps = null;
    e.ov = ORC_VAR_T[kind] ? randi(0, 3) : undefined; // 보스·엘리트는 고유 색
    if (S.semi) e.semiName = S.semi;
    if (ORC_NEW[kind]) e.tall = Math.min(e.tall, 38); // v2.44 새 도트 키
  }
  function orcInit(e) {
    if (e.type === 'wolf') { e.orc = 'wolf'; e.tall = 30; e.flank = rand(0, TAU); }
    else if (e.type === 'slave') { e.orc = 'slave'; e.tall = 30; }
    else if (ORC_SPEC[e.type]) orcSetup(e, e.type);
  }
  // ---------- 오크 공통: 순서 공격(seq) · 팔 애니메이션 · 돌진
  // steps = [[기다림(초), 할 일], ...] — 할 일이 'stop'을 돌려주면 바로 끝낸다
  function oSeq(e, steps, rec, cd) { e.state = 'seq'; e.steps = steps.slice(); e.stepT = steps[0][0]; e.seqRec = rec; e.seqCd = cd; }
  function runSeq(e, dt) {
    if (!e.steps) { if (e.state === 'seq') endSeq(e); return; }
    e.stepT -= dt;
    while (e.steps && e.stepT <= 0) {
      const st = e.steps.shift(), r = st[1] ? st[1]() : null;
      if (r === 'stop' || !e.steps) { e.steps = null; if (e.state === 'seq') endSeq(e); return; }
      if (!e.steps.length) { e.steps = null; endSeq(e); return; }
      e.stepT += e.steps[0][0];
    }
  }
  function endSeq(e) { if (e.state !== 'seq') return; e.state = 'recover'; e.t = e.seqRec == null ? 0.5 : e.seqRec; e.cd = e.seqCd != null ? e.seqCd : rand(1, 1.6); }
  const armTo = (e, deg) => { e.aaT = deg * DEG; e.asw = null; };
  const oSwing = (e, deg, dur) => { e.asw = { from: e.aa, to: deg * DEG, t: 0, dur }; };
  // 타격 프레임용 휘두르기 (v0.89): 판정·충격 이펙트가 나는 바로 그 프레임에 무기가 이미 70% 내려와 있게 — 히트스톱 동안 무기가 머리 위에 멈춰 엇박으로 보이던 문제
  const oSlam = (e, deg, dur) => { const to = deg * DEG, f = e.aa + (to - e.aa) * 0.7; e.aa = f; e.asw = { from: f, to, t: 0, dur: dur * 0.5 }; };
  // 오크 공격 전조 (v0.89): 바닥 경고. 공격이 끊기면(기절·잡기 성공·사망) 같이 사라지고(oa), 실제 판정은 이 경고의 각도를 그대로 쓴다
  function oTele(e, o) { const t = Object.assign({ x: e.x, y: e.y, t: 0, owner: e, oa: true, ff: false }, o); G.tele.push(t); return t; }
  const oCt = (e, ang, r, arcDeg, dur, o) => oTele(e, Object.assign({ shape: 'cone', ang, r, arc: arcDeg * DEG, dur }, o));
  const oLt = (e, ang, len, w, dur, o) => oTele(e, Object.assign({ shape: 'line', ang, len, w, dur }, o));
  const oRt = (e, x, y, r, dur, o) => oTele(e, Object.assign({ shape: 'circle', x, y, r, dur }, o));
  const tAng = (t, fb) => (t && t.ang != null ? t.ang : fb);
  const faceTo = (e, a) => { e.face = Math.cos(a) > 0 ? 1 : -1; };
  const orcSm = e => (e.drumT > 0 ? 1.15 : 1) * (e.buffT > 0 ? 1.15 : 1) * (e.frenzyT > 0 ? 1.3 : 1);
  function glowFor(e, t) { e.glowT = t; e.glowMax = t; }
  function oCone(e, ang, reach, arcDeg, dmg, o = {}) {
    const S = ORC_SPEC[e.orc], hy = e.y - (e.tall || 30) * 0.3;
    hitShape({ shape: 'cone', x: e.x, y: e.y, ang, arc: arcDeg * DEG, r: reach, owner: e }, dmg * (e.buffT > 0 || e.drumT > 0 ? 1.15 : 1));
    if (isKrug(e)) { krugHitShape({ shape: 'cone', x: e.x, y: e.y, ang, arc: arcDeg * DEG, r: reach }, dmg, e); G.fx.push({ kind: 'claw', brute: true, seed: Math.random() * 999, x: e.x + Math.cos(ang) * 6, y: e.y - (e.tall || 30) * 0.3, ang, arc: Math.min(2.6, arcDeg * DEG), r: reach * 0.95, w: 8, c: '255,170,90', t: 0.4, max: 0.4 }); }
    G.fx.push({ kind: 'claw', brute: true, seed: Math.random() * 999, x: e.x + Math.cos(ang) * 6, y: hy, ang, arc: Math.min(2.4, arcDeg * DEG * 0.9), r: reach * 0.8, w: o.w || (reach > 60 ? 4 : 2), c: o.c || '255,215,170', t: 0.32, max: 0.32 });
    dust(e.x + Math.cos(ang) * reach * 0.6, e.y + Math.sin(ang) * reach * 0.4, o.dust || 4);
    e.lean = 0.3 * e.face; e.x += Math.cos(ang) * (o.step || 6); e.y += Math.sin(ang) * (o.step || 6);
    sfx(reach > 70 ? 'heavy' : 'swing', reach > 70 ? 0.75 : 1.1);
  }
  // 크루가쉬의 공격은 자기편 오크도 휩쓴다 (v0.73) — 같은 오크는 0.3초에 한 번만
  const isKrug = o => o && o.type === 'boss' && o.kind === 'krugash';
  function krugHitAlly(e, raw, b) {
    if (!e || e.dead || e === b || e.type === 'boss' || (e.ffT || 0) > time) return;
    e.ffT = time + 0.3; const dmg = Math.round(raw * 2.2); e.hp -= dmg; e.flash = 0.12; e.hitT = time;
    const a = Math.atan2(e.y - b.y, e.x - b.x); e.vx = (e.vx || 0) + Math.cos(a) * 280; e.vy = (e.vy || 0) + Math.sin(a) * 280; e.lean = 0.5 * (Math.cos(a) > 0 ? 1 : -1);
    G.nums.push({ x: e.x + rand(-4, 4), y: e.y - (e.tall || 24), v: String(dmg), t: 0.7, c: '#ff8a5a', s: 2, pop: 0.12, vx: Math.cos(a) * 30, vy: -40 });
    burst(e.x, e.y - 10, bloodOf(e), 10, a);
    if (e.hp <= 0) { e.ffKill = true; killEnemy(e); }
  }
  function krugHitShape(t, raw, b) { for (const e of G.enemies) if (!e.dead && e !== b && inShape(t, e.x, e.y, e.r || 8)) krugHitAlly(e, raw, b); }
  // 크루가쉬 전용 강타 이펙트: 섬광 · 이중 충격 고리 · 화염 폭발 · 흙기둥 · 날아가는 돌 조각 · 짧은 경직
  function krugImpact(x, y, power = 1, c = '255,120,50') {
    hitstop = Math.max(hitstop, 0.05 * power); addShake(6 + 4 * power); flashT = Math.max(flashT, 0.05 * power); flashColor = '#ff8a40';
    G.fx.push({ kind: 'boom', x, y: y - 4, r: 34 * power, t: 0.32, max: 0.32 });
    G.fx.push({ kind: 'ring', x, y, r: 8, t: 0.4, max: 0.4, c: '#ffd0a0', grow: 260 * power });
    G.fx.push({ kind: 'ring', x, y, r: 4, t: 0.55, max: 0.55, c: '#ff5030', grow: 380 * power });
    for (let i = 0; i < 14 * power; i++) { const a = rand(0, TAU), sp = rand(80, 240) * power; G.parts.push({ x: x + rand(-6, 6), y: y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - rand(80, 180), t: rand(0.5, 0.9), c: pick(['#5a4030', '#7a5a40', '#3a2a20', '#a08060']), g: 520, floor: y + rand(-6, 12) }); }
    for (let i = 0; i < 10 * power; i++) { const a = rand(0, TAU), sp = rand(40, 160); G.parts.push({ x, y: y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 40, t: rand(0.25, 0.5), c: pick(['#ffd070', '#ff8040', '#ffffff']), g: 0, glow: true }); }
    dust(x, y, 16 * power); debris(x, y, 18 * power);
  }
  function oCircle(e, r, dmg, c) {
    hitShape({ shape: 'circle', x: e.x, y: e.y, r, owner: e }, dmg);
    if (isKrug(e)) krugHitShape({ shape: 'circle', x: e.x, y: e.y, r }, dmg, e);
    G.fx.push({ kind: 'ring', x: e.x, y: e.y - 6, r: 6, t: 0.25, max: 0.25, c: c || '#ffd8a0', grow: r * 3.5 });
  }
  // 바닥을 따라 퍼지는 충격파 고리 (점멸로 넘는다)
  function addShock(owner, x, y, max, sp, dmg, c) { if (!G.shocks) G.shocks = []; G.shocks.push({ owner, x, y, r: 6, max, sp, dmg, hit: false, c: c || '255,210,150' }); addShake(Math.min(9, 3 + max / 30)); dust(x, y, 10); }
  function orcTick(e, dt) {
    if (!e.intro) { e.intro = true; if (e.semiName) { alertMark(e, e.tall + 8, true); sfx('roar', 1.25); } }
    if (e.asw) { e.asw.t += dt; const k = Math.min(1, e.asw.t / e.asw.dur); e.aa = e.asw.from + (e.asw.to - e.asw.from) * easeOut(k); if (k >= 1) { e.aaT = e.asw.to; e.asw = null; } }
    if (hiTier(e)) { e.otrail = (e.otrail || []).filter(q => (q.t -= dt) > 0); if (e.asw) e.otrail.push({ a: e.aa, t: 0.11 }); } // v2.50 준엘리트 이상 오크: 휘두르는 궤적 기록
    else { const S = ORC_SPEC[e.orc]; if ((e.state === 'chase' || e.state === 'idle') && S) e.aaT = (S.rest + (S.carry ? 0 : Math.sin(e.walk * 0.5) * 6)) * DEG; e.aa += (e.aaT - e.aa) * Math.min(1, dt * 12); }
    if (e.air && e.type !== 'boss') airTick(e, dt);
    { const S = ORC_SPEC[e.orc]; if (S && S.elite && e.state === 'chase') { const st = Math.floor(e.walk / 3); if (st !== e.lastStep) { e.lastStep = st; if (dist(e, G.player) < 420) { addShake(0.8); sfx('step', 0.5); } } } if (S && S.elite && !e.introBig) { e.introBig = true; eliteIntro(e); } }
    for (const k of ['buffT', 'drumT', 'frenzyT', 'glowT', 'wardT', 'up', 'crouch']) if (e[k] > 0) e[k] -= dt;
    if (e.wardT <= 0) e.ward = 0;
    if (e.state !== 'seq' && e.steps) e.steps = null;
    if (e.state !== 'seq') e.carryHold = false;
    if (e.chantHp != null && e.state === 'seq' && e.hp < e.chantHp - 0.5) { e.steps = null; e.state = 'recover'; e.t = 0.6; e.chantHp = null; burst(e.x, e.y - 30, '#8a8a8a', 8); sfx('block'); }
    if (e.cd2 != null) e.cd2 -= dt;
    // 트롤 재생: 3초 동안 맞지 않으면 초당 HP 2% (화상·중독 중에는 멈춤)
    if ((e.type === 'troll' || e.type === 'otroll') && !e.dead && e.hp < e.maxHp && time - (e.hitT || 0) > 3 && !(e.burnT > 0)) {
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * (e.type === 'otroll' ? 0.012 : 0.02) * (e.enraged ? 2 : 1) * dt);
      if (Math.random() < dt * 10) G.parts.push({ x: e.x + rand(-14, 14), y: e.y - rand(20, 50), vx: 0, vy: -26, t: 0.6, c: pick(['#7ad050', '#b8f080']), g: 0, glow: true });
    }
    // 돌진 (부딪히면 멈춘다)
    if (e.dash) {
      const D = e.dash, P = G.player; D.t -= dt;
      const ox = e.x, oy = e.y; e.x += Math.cos(D.ang) * D.sp * dt; e.y += Math.sin(D.ang) * D.sp * dt;
      const out = e.x < A.x0 + e.r || e.x > A.x1 - e.r || e.y < A.y0 + e.r || e.y > A.y1 - e.r;
      e.x = clamp(e.x, A.x0 + e.r, A.x1 - e.r); e.y = clamp(e.y, A.y0 + e.r, A.y1 - e.r);
      const wall = solveObs(e, e.r) || out;
      if (Math.random() < 0.6) dust(e.x, e.y, 1);
      if (D.ghost) G.fx.push({ kind: 'ghost', x: ox, y: oy, face: e.face, rot: 0.15 * e.face, t: 0.18, max: 0.18, orc: e.orc });
      if (D.plow) for (const o of G.enemies) if (o !== e && !o.dead && o.type !== 'boss' && !isElite(o) && Math.hypot(o.x - e.x, o.y - e.y) < e.r + o.r + 2) { o.vx += Math.cos(D.ang) * 260; o.vy += Math.sin(D.ang) * 260; o.lean = 0.5 * e.face; if (isKrug(e)) krugHitAlly(o, e.atk, e); }
      if (!D.done && !P.dead && Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r + 4) {
        D.done = true;
        if (D.grab) {
          if (P.iframe > 0) { if (P.state === 'dodge' && P.dodgeT < PD_WIN() && !P.perfectUsed) perfectDodge(); }
          else if (!P.grab && P.inv <= 0) { e.dash = null; startGrab(e, D.grab); return; }
        } else if (D.dmg) { const hp0 = P.hp; hurtPlayer(D.dmg, e); if (P.hp < hp0 && D.kb) { P.kx = Math.cos(D.ang) * D.kb; P.ky = Math.sin(D.ang) * D.kb; } if (D.onHit) D.onHit(); }
      }
      if (wall && D.onWall) { e.dash = null; D.onWall(); return; }
      if (D.t <= 0 || (wall && D.stopWall !== false)) e.dash = null;
    }
  }
  // 일반 오크 · 늑대 · 주술사 · 고블린 노예 · 준엘리트
  function updateOrc(e, dt, d, a, moveTo) {
    const P = G.player, sm = orcSm(e);
    if (e.state === 'seq') { runSeq(e, dt); return; }
    if (e.state === 'dazed') { if (e.t <= 0) { e.state = 'chase'; e.vuln = 1; } return; }
    if (e.state === 'grabbing') return;
    if (e.type === 'urg') { updateUrg(e, dt, d, a, moveTo); return; }
    if (e.type === 'troll') { updateTroll(e, dt, d, a, moveTo); return; }
    if (e.state !== 'chase') return;
    const t = e.type;
    if (t === 'orc') {
      if (d > 42) moveTo(a, e.spd * sm);
      else if (e.cd <= 0) {
        faceTo(e, a);
        if (Math.random() < 0.25) oSeq(e, [[0, () => { armTo(e, 30); e.lean = -0.25 * e.face; e.crouch = 0.25; glowFor(e, 0.35); e.tl = oLt(e, a, 70, 22, 0.35, { follow: true }); }], [0.35, () => { e.dash = { ang: tAng(e.tl, angTo(e, P)), sp: 270, t: 0.16, dmg: e.atk * 0.5, kb: 360 }; sfx('whoosh', 1.2); }], [0.25, null]], 0.45);
        else oSeq(e, [[0, () => { e.tl = oCt(e, a, 56, 105, 0.45, { follow: true }); oSwing(e, -115, 0.22); glowFor(e, 0.45); e.lean = -0.2 * e.face; }], [0.45, () => { const q = tAng(e.tl, a); faceTo(e, q); oSlam(e, 70, 0.1); oCone(e, q, 56, 105, e.atk); }], [0.2, null]], 0.5, rand(1.0, 1.6));
      }
    } else if (t === 'othrow') {
      if (d < 120) moveTo(a + Math.PI, e.spd * sm); else if (d > 210) moveTo(a, e.spd * sm); else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.5);
      if (Math.random() < dt * 0.5) e.strafe = -(e.strafe || 1);
      if (e.cd <= 0 && d < 300) {
        e.state = 'wind'; e.lockAng = a; faceTo(e, a); oSwing(e, -165, 0.3);
        G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 300, w: 12, t: 0, dur: 0.7, owner: e, thin: true,
          onFire: () => {
            for (const off of (Math.random() < 0.3 ? [-0.18, 0, 0.18] : [0])) G.eproj.push({ x: e.x + Math.cos(e.lockAng + off) * 12, y: e.y + Math.sin(e.lockAng + off) * 10, ang: e.lockAng + off, sp: 330, r: 3, dmg: e.atk * (e.buffT > 0 || e.drumT > 0 ? 1.15 : 1), t: 1.3, hist: [], kind: 'spear' });
            oSwing(e, 25, 0.1); sfx('whoosh', 0.9); e.state = 'recover'; e.t = 0.6; e.cd = rand(2.4, 3.2);
          } });
      }
    } else if (t === 'wolf') {
      e.flank += dt * 0.7 * (e.side || (e.side = Math.random() < 0.5 ? 1 : -1));
      const tx = P.x + Math.cos(e.flank) * 64, ty = P.y + Math.sin(e.flank) * 46, td = Math.hypot(tx - e.x, ty - e.y);
      if (td > 12) moveTo(Math.atan2(ty - e.y, tx - e.x), e.spd * sm * (td > 120 ? 1.15 : 0.8)); else faceTo(e, a);
      if (e.cd <= 0 && d < 120) {
        faceTo(e, a);
        oSeq(e, [[0, () => { e.lockA = angTo(e, P); e.crouch = 0.35; sfx('growl', 1.4); glowFor(e, 0.4); e.tl = oLt(e, e.lockA, 120, 18, 0.4, { follow: true }); }],
          [0.4, () => { e.lockA = tAng(e.tl, angTo(e, P)); faceTo(e, e.lockA); e.dash = { ang: e.lockA, sp: 340, t: 0.32, dmg: e.atk, kb: 160, onHit: () => { for (const o of G.enemies) if (o !== e && o.type === 'wolf' && !o.dead && o.state === 'chase' && Math.hypot(o.x - e.x, o.y - e.y) < 220) o.cd = Math.min(o.cd, 0.3); } }; }],
          [0.35, () => { e.crouch = 0.4; }], [0.35, null]], 0.25, rand(1.6, 2.4));
      }
    } else if (t === 'shaman') {
      if (d < 120) moveTo(a + Math.PI, e.spd * 1.1 * sm); else if (d > 230) moveTo(a, e.spd * sm); else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.4);
      if (Math.random() < dt * 0.4) e.strafe = -(e.strafe || 1);
      if (e.cd2 == null) e.cd2 = rand(1.5, 3);
      const allies = G.enemies.filter(o => o !== e && !o.dead && o.orc && o.type !== 'wolf' && o.type !== 'slave' && o.type !== 'shaman' && !(o.ward > 0) && Math.hypot(o.x - e.x, o.y - e.y) < 150).sort((p, q) => q.maxHp - p.maxHp);
      if (e.cd2 <= 0 && allies.length) {
        faceTo(e, a);
        oSeq(e, [[0, () => { armTo(e, -95); glowFor(e, 0.8); e.chantHp = e.hp; sfx('warn', 0.8); }],
          [0.8, () => { e.chantHp = null; for (const o of allies.slice(0, 2)) if (!o.dead) { o.ward = o.wardMax = o.maxHp * 0.3; o.wardT = 4; G.fx.push({ kind: 'ring', x: o.x, y: o.y - (o.tall || 30) * 0.5, r: 8, t: 0.4, max: 0.4, c: '#ff4040', grow: 120 }); burst(o.x, o.y - 20, '#ff4040', 8); } sfx('heal', 0.7); }]], 0.4);
        e.cd2 = rand(5, 7);
      } else if (e.cd <= 0 && d < 300) {
        faceTo(e, a);
        oSeq(e, [[0, () => { armTo(e, -70); glowFor(e, 0.6); e.tl = oLt(e, a, 160, 10, 0.6, { follow: true, thin: true }); }], [0.6, () => { const S = orcSprite('shaman'), sx = e.x + e.face * S.sx, sy = e.y + S.sy; G.eproj.push({ x: sx + e.face * 16, y: sy + 6, ang: tAng(e.tl, angTo(e, P)), sp: 200, r: 5, dmg: e.atk, t: 2.4, hist: [] }); /* v0.90: 유도 없음 — 전조선 방향으로 곧게 */ sfx('warn'); burst(sx + e.face * 16, sy - 4, '#ff3040', 6); }]], 0.5, rand(2.6, 3.6));
      }
    } else if (t === 'slave') {
      if (d > 20) moveTo(a, e.spd * sm);
      else if (e.cd <= 0) { faceTo(e, a); oSeq(e, [[0, () => { e.up = 0.3; e.holdA = a; e.tl = oCt(e, a, 28, 110, 0.34); }], [0.34, () => { e.up = 0; oCone(e, e.holdA, 26, 110, e.atk, { step: 4, dust: 2 }); }]], 0.35, rand(0.6, 1.0) * (e.frenzyT > 0 ? 0.5 : 1)); }
    } else if (t === 'ocharge') {
      if (d > 44) moveTo(a, e.spd * sm);
      if (e.cd <= 0 && d > 90 && d < 380) {
        faceTo(e, a);
        // v0.90: 준비 동안은 몽둥이를 어깨에 멘 그대로(carryHold), 돌진을 시작하면 좌우로 크게 휘두르며 달림
        const club = k => () => { if (!e.dash) return; const up = k % 2 === 1; oSwing(e, up ? -150 : 75, 0.14); e.lean = (up ? -0.1 : 0.25) * e.face; sfx('swing', 0.9); if (Math.random() < 0.5) dust(e.x + Math.cos(e.lockA) * 20, e.y + Math.sin(e.lockA) * 12, 3); };
        oSeq(e, [[0, () => { alertMark(e, e.tall + 6, true); sfx('roar', 1.1); armTo(e, ORC_SPEC.ocharge.rest); e.carryHold = true; e.lean = -0.15 * e.face; }],
          [0.35, () => { dust(e.x, e.y, 8); addShake(2); sfx('step', 0.6); e.crouch = 0.2; e.tl = oLt(e, angTo(e, P), 620, 30, 0.35, { follow: true }); }],
          [0.35, () => { dust(e.x, e.y, 8); addShake(2); sfx('step', 0.6); e.lockA = tAng(e.tl, angTo(e, P)); faceTo(e, e.lockA); e.dash = { ang: e.lockA, sp: 390, t: 1.6, dmg: e.atk * 1.2, kb: 380, plow: true,
            onWall: () => { e.steps = null; e.state = 'dazed'; e.t = 1.5; e.vuln = 1.5; addShake(7, e.lockA); debris(e.x, e.y, 16); sfx('blast'); banner2(e, '기절!'); } }; e.carryHold = false; sfx('whoosh', 0.8); club(0)(); }],
          [0.2, club(1)], [0.2, club(2)], [0.2, club(3)], [0.2, club(4)], [0.2, club(5)], [0.2, club(6)], [0.2, club(7)], [0.25, null]], 0.8, rand(2.5, 3.5));
      } else if (e.cd <= 0 && d <= 60) { faceTo(e, a); oSeq(e, [[0, () => { e.holdA = a; e.tl = oCt(e, a, 64, 115, 0.45, { follow: true }); oSwing(e, -155, 0.25); glowFor(e, 0.45); e.lean = -0.15 * e.face; }], [0.45, () => { const q = tAng(e.tl, e.holdA); faceTo(e, q); oSlam(e, 65, 0.1); e.lean = 0.2 * e.face; oCone(e, q, 64, 115, e.atk); }], [0.3, () => { armTo(e, -178); }]], 0.6, rand(1.2, 1.8)); }
    } else if (t === 'odrum') {
      if (d < 140) moveTo(a + Math.PI, e.spd * sm); else if (d > 230) moveTo(a, e.spd * sm); else faceTo(e, a);
      e.beatT = (e.beatT == null ? 0.8 : e.beatT) - dt;
      if (e.beatT <= 0) {
        e.beatT = 1.2; e.beatN = (e.beatN || 0) + 1;
        if (e.beatN % 3 === 0) {
          oSeq(e, [[0, () => { oSwing(e, -125, 0.25); glowFor(e, 0.6); e.lean = -0.2 * e.face; oRt(e, e.x, e.y, 96, 0.6); }], [0.6, () => { oSlam(e, 50, 0.08); addShock(e, e.x, e.y, 96, 520, e.atk); sfx('blast', 0.8); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 20, r: 6, t: 0.3, max: 0.3, c: '#ff5040', grow: 200 }); }]], 0.5);
        } else {
          oSwing(e, -40, 0.08); setTimeout(() => { if (e && !e.dead) oSwing(e, 45, 0.1); }, 90);
          sfx('beat', 0.7); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 10, r: 10, t: 0.45, max: 0.45, c: '#d03a30', grow: 340 });
          for (const o of G.enemies) if (!o.dead && o.orc && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 160) o.buffT = 1.4;
        }
      }
    } else if (t === 'otroll') { // 동굴 트롤: 크게 휘두르는 할퀴기(2연) · 몸을 던지는 도약 덮치기 · 3초 안 맞으면 재생 (v0.60)
      if (d > 60) moveTo(a, e.spd * sm);
      if (e.cd <= 0 && d < 86) {
        faceTo(e, a);
        const sw = () => { const q = tAng(e.tl, angTo(e, P)); faceTo(e, q); oSlam(e, 80, 0.13); oCone(e, q, 70, 170, e.atk, { w: 5, step: 8, dust: 8, c: '230,230,200' }); addShake(3); sfx('swing', 0.8); };
        oSeq(e, [[0, () => { e.tl = oCt(e, a, 70, 170, 0.5, { follow: true }); oSwing(e, -160, 0.3); glowFor(e, 0.5); e.lean = -0.2 * e.face; sfx('growl', 0.7); }], [0.5, sw], [0.25, () => { e.tl = oCt(e, angTo(e, P), 70, 170, 0.3, { follow: true }); oSwing(e, -150, 0.18); glowFor(e, 0.3); }], [0.3, sw], [0.25, null]], 0.8, rand(1.6, 2.4));
      } else if (e.cd <= 0 && d < 220 && Math.random() < 0.5) {
        faceTo(e, a);
        oSeq(e, [[0, () => { e.crouch = 0.5; e.lean = -0.3 * e.face; glowFor(e, 0.7); alertMark(e, e.tall + 6, true); sfx('growl', 0.6); }],
          [0.7, () => { e.crouch = 0; oRt(e, P.x, P.y, 44, 0.55, { pin: true }); leapTo(e, 0.55, 60, 0.3, () => { addShock(e, e.x, e.y, 80, 220, e.atk * 1.1, '200,210,160'); oCircle(e, 40, e.atk * 1.2); debris(e.x, e.y, 14); sfx('blast', 0.8); e.vuln = 1.4; banner2(e, '엎어졌다!'); }); }],
          [0.7, null], [0.9, () => { e.vuln = 1; e.lean = 0; }]], 0.5, rand(2.4, 3.2));
      } else if (e.cd <= 0) e.cd = 0.4;
    } else if (t === 'ogrip') {
      if (d > 52) moveTo(a, e.spd * sm);
      if (e.cd <= 0 && d < 74) {
        faceTo(e, a);
        oSeq(e, [[0, () => { e.lockA = a; armTo(e, -35); e.spread = 0.6; glowFor(e, 0.6); alertMark(e, e.tall + 6); sfx('growl', 0.8); e.tl = oLt(e, a, 84, 26, 0.6, { follow: true }); }],
          [0.6, () => { e.spread = 0; e.lockA = tAng(e.tl, angTo(e, P)); faceTo(e, e.lockA); oRt(e, e.x + Math.cos(e.lockA) * 58, e.y + Math.sin(e.lockA) * 58 * 0.85, 44, 0.32); e.dash = { ang: e.lockA, sp: 240, t: 0.24, grab: { dur: 1.15, need: 6, dmg: e.atk * 1.4, kind: 'throw' } }; armTo(e, 0); }],
          [0.32, () => { if (e.state !== 'seq') return 'stop'; oSwing(e, 250, 0.3); e.face = -e.face; setTimeout(() => { if (!e.dead) e.face = -e.face; }, 150); oCircle(e, 44, e.atk * 0.6); sfx('swing', 0.8); }],
          [0.4, null]], 0.9, rand(2.2, 3.2));
      }
    }
  }
  function banner2(e, txt) { G.nums.push({ x: e.x, y: e.y - (e.tall || 30) - 10, v: txt, t: 0.9, c: '#ffd34d', s: 1, txt: true }); }
  // 죽은 오크 근처의 고블린 노예는 1초간 격분
  function orcOnKill(e) {
    if (!e.orc || e.type === 'slave') return;
    for (const o of G.enemies) if (!o.dead && o.type === 'slave' && Math.hypot(o.x - e.x, o.y - e.y) < 170) { o.frenzyT = 1.2; burst(o.x, o.y - 14, '#ff6040', 4); }
  }

  // ---------- 잡기: 플레이어를 붙잡아 던지거나(throw) 내리꽂는다(slam). 공격 연타 또는 점멸로 빠져나온다
  function startGrab(e, g) {
    const P = G.player; if (P.dead || P.grab) return;
    P.grab = { by: e, t: 0, dur: g.dur, need: g.need, mash: 0, dmg: g.dmg, kind: g.kind, slams: 0 };
    P.state = 'grabbed'; P.kx = P.ky = 0; P.queued = false;
    e.state = 'grabbing'; e.steps = null; armTo(e, -95); G.tele = G.tele.filter(t => !(t.oa && t.owner === e));
    sfx('growl', 0.7); addShake(5); hitstop = Math.max(hitstop, 0.06);
    G.nums.push({ x: P.x, y: P.y - 40, v: '잡혔다!', t: 0.8, c: '#ff8a5a', s: 1, txt: true });
  }
  function releaseGrab(broke) {
    const P = G.player, gr = P.grab; if (!gr) return;
    const e = gr.by; P.grab = null; P.lift = 0; P.state = 'idle'; P.t = 0;
    if (broke) {
      P.iframe = 0.45; P.inv = 0.5; P.kx = -e.face * 260; P.ky = 0;
      if (e && !e.dead) { e.state = 'recover'; e.t = 1.0; e.grogi = Math.min(e.grogiMax || 0, (e.grogi || 0) + 12); e.lean = -0.4 * e.face; e.flash = 0.12; }
      G.nums.push({ x: P.x, y: P.y - 40, v: '탈출!', t: 0.8, c: '#9fd2ff', s: 1, txt: true }); sfx('perfect'); blinkBurst(P.x, P.y - 10);
    }
  }
  function updateGrabbed(P, dt) {
    const gr = P.grab, e = gr.by;
    if (!e || e.dead || e.grogiT > 0 || e.state !== 'grabbing') { releaseGrab(false); return; }
    gr.t += dt;
    const S = ORC_SPEC[e.orc], k = Math.min(1, gr.t / 0.25);
    const slamPhase = gr.kind === 'slam' ? (gr.t % 0.5) / 0.5 : 0;
    P.x = e.x + e.face * (e.r * 0.7 + 6); P.y = e.y + 2; P.face = -e.face;
    P.lift = (e.tall || 50) * 0.55 * k * (gr.kind === 'slam' ? 1 - Math.pow(slamPhase, 3) * 0.95 : 1);
    if (take('j') || take('k') || take('e')) { gr.mash++; addShake(1.5); sfx('hit', 1.6); P.hurtT = 0.06; }
    if (take(' ') && P.stam > 0) { P.stam--; gr.mash = gr.need; }
    if (gr.mash >= gr.need) { releaseGrab(true); return; }
    if (gr.kind === 'slam' && gr.t > 0.5 * (gr.slams + 1) && gr.slams < 2) {
      gr.slams++; hurtPlayer(gr.dmg * 0.5, null, true); addShake(9); dust(P.x, P.y, 14); debris(P.x, P.y, 10); sfx('blast', 0.9);
      if (G.player.dead) { releaseGrab(false); return; }
    }
    if (gr.t >= gr.dur) {
      releaseGrab(false);
      if (gr.kind === 'throw') {
        const dl = P.x - A.x0, dr = A.x1 - P.x, dtp = P.y - A.y0, db = A.y1 - P.y, m = Math.min(dl, dr, dtp, db);
        const ang = m === dl ? Math.PI : m === dr ? 0 : m === dtp ? -Math.PI / 2 : Math.PI / 2;
        hurtPlayer(gr.dmg, null, true); P.kx = Math.cos(ang) * 760; P.ky = Math.sin(ang) * 760; P.thrown = { t: 0.55, dmg: gr.dmg * 0.4 };
        sfx('whoosh', 0.7);
      } else { hurtPlayer(gr.dmg * 0.8, null, true); P.kx = e.face * 520; addShake(10); }
      e.state = 'recover'; e.t = 0.8; oSwing(e, 60, 0.15);
    }
  }

  // ---------- 전쟁 북: 문이 잠기면 울리기 시작, 울리는 동안 오크 이동 +15%. 3번(보스 북은 5번) 때리면 찢어진다
  function genWarDrum(broken) {
    const W = 20, H = 19, g = mkGrid(W, H), set = (x, y, c) => { if (y >= 1 && y < H - 1 && x >= 1 && x < W - 1) g[y][x] = c; };
    for (const lx of [3, 16]) for (let y = 11; y <= 17; y++) set(lx + (y > 14 ? (lx < 10 ? -1 : 1) : 0), y, 'O');
    for (let y = 5; y <= 14; y++) for (let x = 3; x <= 16; x++) { const edge = x === 3 || x === 16; set(x, y, edge ? 'B' : x < 7 ? 'b' : x < 13 ? 'B' : 'k'); if ((y === 7 || y === 12) && !edge) set(x, y, 'o'); }
    for (let x = 3; x <= 16; x++) for (let y = 2; y <= 5; y++) { const dx = (x - 9.5) / 7, dy = (y - 3.5) / 2; if (dx * dx + dy * dy <= 1.05) set(x, y, broken ? (Math.random() < 0.5 ? 'k' : 'S') : dx < -0.2 && dy < 0 ? 's' : 'S'); }
    for (let x = 5; x <= 14; x += 3) for (let y = 6; y <= 13; y++) if ((y + x) % 2 === 0) set(x, y, 'w');
    set(9, 9, 'w'); set(10, 9, 'w'); set(9, 10, 'k'); set(10, 10, 'W');
    if (broken) for (let i = 0; i < 6; i++) set(randi(4, 15), randi(1, 5), '.');
    return gOutline(g);
  }
  function hitDrums(x, y, power, rad) {
    if (!G || !G.drums) return false;
    let any = false;
    for (const d of G.drums) {
      if (d.broken || Math.hypot(x - d.x, y - (d.y - 10)) > rad + 18) continue;
      any = true; if (d.cd > 0) continue;
      d.cd = 0.22; d.hp -= power; d.anim = 0.18;
      debris(d.x, d.y - 14, 8); sfx('block', 0.7); addShake(3); /* v1.08 역경직 제거 */
      G.fx.push({ kind: 'hitspark', x: d.x, y: d.y - 16, ang: rand(0, TAU), rot: 0, t: 0.12, max: 0.12, r: 18, c: '255,220,180' });
      if (d.hp <= 0) {
        d.broken = true; sfx('blast'); addShake(8); flashT = 0.06; flashColor = '#ffd0a0'; debris(d.x, d.y - 14, 24); dust(d.x, d.y, 16);
        lootFeed(d.boss ? '전쟁 북이 찢어졌다 — 대족장의 가호가 약해진다' : '전쟁 북이 찢어졌다 — 오크들이 흔들린다', '#ff8a5a');
        if (!d.boss) for (const e of G.enemies) if (!e.dead && e.type === 'odrum') { e.steps = null; e.state = 'dazed'; e.t = 3; e.vuln = 1.3; banner2(e, '멍...'); }
        if (d.boss && G.drums.every(q => !q.boss || q.broken) && G.boss) { G.boss.armorMul = 1; banner('북이 멈췄다', '대족장의 보호가 풀렸다'); }
      }
    }
    return any;
  }
  function updateOrcWorld(dt) {
    const P = G.player;
    if (G.shocks) {
      for (const s of G.shocks) {
        const prev = s.r; s.r += s.sp * dt;
        const dd = Math.hypot(P.x - s.x, (P.y - s.y) / 0.62);
        if (!s.hit && !P.dead && prev - P.r <= dd && s.r + P.r >= dd) { s.hit = true; if (!P.grab && (P.lift || 0) < 6) hurtPlayer(s.dmg, s.owner && !s.owner.dead ? s.owner : null); }
        if (isKrug(s.owner)) for (const e of G.enemies) { if (e.dead || e === s.owner) continue; const de = Math.hypot(e.x - s.x, (e.y - s.y) / 0.62); if (prev - 6 <= de && s.r + 6 >= de) krugHitAlly(e, s.dmg, s.owner); }
      }
      G.shocks = G.shocks.filter(s => s.r < s.max);
    }
    G.drumBeat = Math.max(0, (G.drumBeat || 0) - dt); G.riteBeat = Math.max(0, (G.riteBeat || 0) - dt); if (G.boss && G.boss.riteT > 0) G.boss.riteT -= dt;
    if (G.drums) for (const d of G.drums) {
      d.cd = Math.max(0, (d.cd || 0) - dt); d.anim = Math.max(0, (d.anim || 0) - dt); d.pulse = Math.max(0, (d.pulse || 0) - dt);
      if (d.drop > 0) { d.drop -= dt; if (d.drop <= 0) { d.drop = 0; addShake(8); dust(d.x, d.y, 22); debris(d.x, d.y - 6, 10); sfx('blast', 0.8); G.fx.push({ kind: 'drumwave', x: d.x, y: d.y, t: 0.7, max: 0.7, R: 120, c: '255,90,40' }); } continue; }
      const active = !d.broken && (d.boss || (G.sealed && G.enemies.some(e => !e.dead && e.orc)));
      if (!active) continue;
      d.beatT = (d.beatT || 0) - dt;
      if (d.beatT <= 0) {
        d.beatT = 1.1; d.anim = 0.16; G.drumBeat = 0.18; sfx('beat', 0.55);
        if (d.boss) riteBeat(d); else
        G.fx.push({ kind: 'ring', x: d.x, y: d.y - 8, r: 8, t: 0.5, max: 0.5, c: '#c0302a', grow: 260 });
        for (const e of G.enemies) if (!e.dead && e.orc && e.type !== 'boss') e.drumT = 1.25;
      }
    }
    if (P.thrown) {
      P.thrown.t -= dt;
      const edge = P.x <= A.x0 + P.r + 3 || P.x >= A.x1 - P.r - 3 || P.y <= A.y0 + P.r + 3 || P.y >= A.y1 - P.r - 3 || solidAt(P.x, P.y);
      if (edge) { hurtPlayer(P.thrown.dmg, null, true); addShake(9); dust(P.x, P.y, 14); debris(P.x, P.y, 8); sfx('blast', 1.1); P.kx = P.ky = 0; P.thrown = null; }
      else if (P.thrown.t <= 0) P.thrown = null;
    }
  }
  function drawWarDrum(d) {
    const spr = art('wardrum' + (d.broken ? 'b' : ''), () => withSeed(4242, () => gCanvas(genWarDrum(d.broken), ORC_BASE)));
    if (d.drop > 0) { const k = d.drop / 0.55, oy = Math.round(k * k * 260 / 2) * 2; ctx.fillStyle = `rgba(0,0,0,${0.5 * (1 - k)})`; ctx.fillRect(Math.round(d.x - 14 * (1 - k * 0.6)) & ~1, d.y, Math.round(28 * (1 - k * 0.6)) & ~1, 4); ctx.drawImage(spr, Math.round(d.x - spr.width / 2) & ~1, Math.round(d.y + 2 - spr.height - oy)); return; }
    const sq = d.anim > 0 ? 1 - d.anim * 0.6 : 1, x = Math.round(d.x - spr.width / 2) & ~1;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; { const xa = x + 4, xb = x + spr.width - 4; if (xb > xa) ctx.fillRect(xa, d.y, Math.ceil((xb - xa) / 2) * 2, 2); }
    { const t = pxXform(spr, 2, 0, 1, sq, false, { pvx: 0 }), X = x - t.ax, Yd = snap2(d.y + 2) - t.ay; ctx.save(); ctx.drawImage(t.c, X, Yd); // v1.05 눌림도 칸 단위
      if (d.boss && !d.broken && d.anim > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = d.anim / 0.16 * 0.7; ctx.drawImage(t.c, X, Yd); }
      ctx.restore(); }
    if (!d.broken && d.hp < d.max) { const w = 22; ctx.fillStyle = '#000'; ctx.fillRect(Math.round(d.x - w / 2) - 1, Math.round(d.y - spr.height - 6) - 1, w + 2, 4); ctx.fillStyle = '#d8a840'; ctx.fillRect(Math.round(d.x - w / 2), Math.round(d.y - spr.height - 6), Math.round(w * d.hp / d.max), 2); }
  }
  function pxRing(x, y, r, col, a) {
    const n = Math.max(20, Math.round(r * 0.9));
    ctx.fillStyle = `rgba(0,0,0,${0.55 * a})`;
    for (let i = 0; i < n; i++) { const t = i / n * TAU; ctx.fillRect((Math.round(x + Math.cos(t) * r) & ~1) - 1, (Math.round(y + Math.sin(t) * r * 0.62) & ~1) - 1, 4, 4); }
    ctx.fillStyle = `rgba(${col},${a})`;
    for (let i = 0; i < n; i++) { const t = i / n * TAU; ctx.fillRect(Math.round(x + Math.cos(t) * r) & ~1, Math.round(y + Math.sin(t) * r * 0.62) & ~1, 2, 2); }
  }
  // ---- 전쟁 북 의식 (v0.82): 북이 울릴 때마다 붉은 파동·'둥!'·불씨, 북→대족장 핏빛 사슬로 힘이 흘러가고, 대족장은 룬 방벽에 감싸인다
  function riteBeat(d) {
    d.pulse = 0.55; d.beatN = (d.beatN || 0) + 1; G.riteBeat = 0.4; addShake(3);
    G.fx.push({ kind: 'drumwave', x: d.x, y: d.y, t: 0.75, max: 0.75, R: 150, c: '255,60,40' });
    G.fx.push({ kind: 'drumwave', x: d.x, y: d.y, t: 0.55, max: 0.55, R: 80, c: '255,200,120', delay: 0.08 });
    G.nums.push({ x: d.x + rand(-6, 6), y: d.y - 44, v: d.beatN % 2 ? '둥!' : '두웅!', t: 0.7, c: '#ff7a50', s: 1, txt: true, vy: -60 });
    for (let i = 0; i < 10; i++) { const a = rand(-Math.PI, 0); G.parts.push({ x: d.x + rand(-12, 12), y: d.y - 14, vx: Math.cos(a) * rand(30, 90), vy: Math.sin(a) * rand(60, 140), t: rand(0.4, 0.8), c: pick(['#ff4030', '#ff9040', '#ffd070']), g: 120, glow: true }); }
    const b = G.boss; if (b && !b.dead) { b.riteT = 0.35; G.fx.push({ kind: 'drumwave', x: b.x, y: b.y, t: 0.5, max: 0.5, R: 60, c: '255,70,40', delay: 0.42 }); }
  }
  function drawDrumWave(f, p0) {
    const el = (f.max - f.t) - (f.delay || 0); if (el < 0) return; const p = Math.min(1, el / (f.max - (f.delay || 0)));
    const r = f.R * easeOut(p), a = 1 - p, n = Math.max(24, Math.round(r * 0.7));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // 두께 3칸 링: 바깥은 디더로 성기게, 안쪽은 꽉
    for (let ring = 0; ring < 3; ring++) { const rr = r - ring * 4; if (rr < 2) continue; const lv = a * (1 - ring * 0.3);
      ctx.fillStyle = `rgba(${f.c},${0.85 * lv})`;
      for (let i = 0; i < n; i++) { const t = i / n * TAU, x = Math.round(f.x + Math.cos(t) * rr) & ~1, y = Math.round(f.y + Math.sin(t) * rr * 0.6) & ~1; if (dith(x >> 1, y >> 1, Math.min(1, lv * 1.3))) ctx.fillRect(x, y, 2, 2); } }
    // 바닥 붉은 번짐 (디더)
    if (p < 0.5) { const k = 1 - p * 2, R2 = r * 0.8; ctx.fillStyle = `rgba(${f.c},${0.25 * k})`;
      for (let y = Math.round(f.y - R2 * 0.6) & ~1; y <= f.y + R2 * 0.6; y += 2) for (let x = Math.round(f.x - R2) & ~1; x <= f.x + R2; x += 2) { const q = Math.hypot(x - f.x, (y - f.y) / 0.6) / R2; if (q < 1 && dith(x >> 1, y >> 1, (1 - q) * k)) ctx.fillRect(x, y, 2, 2); } }
    ctx.restore();
  }
  // 북 → 대족장 링크 (v0.83): 위로 휘는 활 궤적을 따라 핏빛 에너지 세 가닥이 서로 꼬이며 흐르고, 테두리는 디더 광채.
  // 평소엔 불씨 덩이가 계속 대족장 쪽으로 흘러가고, 북이 울리면 하얗게 달아오른 굵은 파동이 사슬을 타고 달려가 대족장에게 꽂힌다
  function drawRiteLink(d, x0, y0, x1, y1, b) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), lift = Math.min(90, L * 0.28), cxp = (x0 + x1) / 2, cyp = (y0 + y1) / 2 - lift;
    const at = k => { const u = 1 - k; return [u * u * x0 + 2 * u * k * cxp + k * k * x1, u * u * y0 + 2 * u * k * cyp + k * k * y1]; };
    const n = Math.max(20, Math.round(L / 2.2)), head = d.pulse > 0 ? easeOut(1 - d.pulse / 0.55) : -1, seen = new Set();
    // v2.40 성능: 칸마다 fillStyle을 바꾸지 않고 색별로 모았다가 한 번에 칠함 (북 의식 중 프레임 드랍)
    let bk = new Map(); const q2 = v => Math.round(v * 20) / 20;
    const put = (x, y, col) => { x = Math.round(x) & ~1; y = Math.round(y) & ~1; const key = x * 4096 + y + col.length; if (seen.has(key)) return; seen.add(key); let a = bk.get(col); if (!a) bk.set(col, a = []); a.push(x, y); };
    const flush = () => { for (const [col, a] of bk) { ctx.fillStyle = col; for (let i = 0; i < a.length; i += 2) ctx.fillRect(a[i], a[i + 1], 2, 2); } bk = new Map(); };
    // 1) 바깥 디더 광채 + 검은 심지 (가닥이 땅 위에서도 또렷하게)
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i <= n; i += 2) { const k = i / n, [x, y] = at(k), [x2, y2] = at(Math.min(1, k + 0.01)), tx = x2 - x, ty = y2 - y, tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, amp = 5 * Math.sin(k * Math.PI) + 2;
      for (const o of [-amp - 2, amp + 2]) put(x + nx * o, y + ny * o, 'rgba(18,3,3,.55)'); }
    flush(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i <= n; i++) { const k = i / n, [x, y] = at(k), [x2, y2] = at(Math.min(1, k + 0.01)), tx = x2 - x, ty = y2 - y, tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
      const surge = head >= 0 ? Math.max(0, 1 - Math.abs(k - head) / 0.12) : 0, trail = head >= 0 && k < head ? Math.max(0, 1 - (head - k) / 0.35) * 0.6 : 0, taper = Math.sin(k * Math.PI);
      const amp = (4 + surge * 5) * taper + 1.5;
      // 광채 (디더)
      for (let o = -amp - 6; o <= amp + 6; o += 2) { const q = Math.abs(o) / (amp + 6); const lv = (1 - q) * (0.35 + surge * 0.6 + trail * 0.4); if (lv > 0 && dith((x + nx * o) >> 1, (y + ny * o) >> 1, lv)) put(x + nx * o, y + ny * o, `rgba(200,20,10,${q2(0.35 + surge * 0.3)})`); }
      // 꼬인 세 가닥: 앞쪽(cos>0)은 밝게, 뒤쪽은 어둡게
      for (let j = 0; j < 3; j++) { const ph = k * 22 - time * 9 + j * TAU / 3, off = Math.sin(ph) * amp, front = Math.cos(ph) > 0;
        put(x + nx * off, y + ny * off, surge > 0.3 ? 'rgba(255,240,200,1)' : front ? `rgba(255,${110 + Math.round(trail * 10) * 12},${50 + Math.round(trail * 10) * 8},.95)` : 'rgba(170,25,15,.8)'); }
      // 하얗게 달아오른 심 (파동이 지나는 자리)
      if (surge > 0) { put(x, y, 'rgba(255,255,230,1)'); put(x + nx * 2, y + ny * 2, 'rgba(255,200,120,.9)'); put(x - nx * 2, y - ny * 2, 'rgba(255,200,120,.9)'); }
    }
    flush();
    // 2) 흐르는 불씨 덩이 (십자 4px)
    for (let m = 0; m < 5; m++) { const k = (time * 0.45 + m / 5 + d.x * 0.001) % 1, [x, y] = at(k), w = Math.sin(k * Math.PI);
      ctx.fillStyle = `rgba(255,190,90,${0.9 * w})`; const X = Math.round(x) & ~1, Y = Math.round(y) & ~1; ctx.fillRect(X - 2, Y, 6, 2); ctx.fillRect(X, Y - 2, 2, 6); ctx.fillStyle = `rgba(255,255,220,${w})`; ctx.fillRect(X, Y, 2, 2); }
    // 3) 북 쪽 닻: 도는 2px 고리 / 대족장 쪽 닻: 빨려 드는 나선 점
    const pu = (d.pulse || 0) / 0.55;
    for (let i = 0; i < 14; i++) { const t = i / 14 * TAU + time * 3; if (i % 3 === 2) continue; put(x0 + Math.cos(t) * (10 + pu * 4), y0 + Math.sin(t) * (5 + pu * 2), `rgba(255,90,40,${0.7 + pu * 0.3})`); }
    for (let i = 0; i < 10; i++) { const ph = (time * 1.4 + i / 10) % 1, r = 26 * (1 - ph), t = i * 2.4 + ph * 5; put(x1 + Math.cos(t) * r, y1 + Math.sin(t) * r * 0.7, `rgba(255,${80 + Math.round(ph * 10) * 15},40,${q2(ph)})`); }
    if (head > 0.85) { const k = (head - 0.85) / 0.15; for (let i = 0; i < 12; i++) { const t = i / 12 * TAU; put(x1 + Math.cos(t) * (6 + k * 20), y1 + Math.sin(t) * (4 + k * 12), `rgba(255,230,180,${q2(1 - k)})`); } }
    flush();
  }
  function drawRite() {
    const b = G.boss; if (!b || b.dead || !G.drums || !(b.armorMul < 1)) return;
    const bx = b.x, by = b.y - (b.tall || 60) * 0.45;
    ctx.save();
    for (const d of G.drums) { if (!d.boss || d.broken || d.drop > 0) continue;
      const x0 = d.x, y0 = d.y - 26; drawRiteLink(d, x0, y0, bx, by, b);
      // 북 위 핏빛 불꽃 기둥
      const fl = 0.5 + 0.5 * Math.sin(time * 10 + d.x); ctx.globalCompositeOperation = 'lighter';
      const pu = (d.pulse || 0) / 0.55, FH = 40 + pu * 26;
      for (let y = 0; y < FH; y += 2) { const k = y / FH, w = Math.round((12 * (1 - k) + Math.sin(y * 0.4 - time * 14) * 2 + fl * 2) / 2) * 2; if (w <= 0) continue; ctx.fillStyle = k < 0.3 ? `rgba(255,${200 - y * 3},${120 - y * 2},${0.8})` : `rgba(255,${50 + y * 2},30,${0.75})`; for (let x = -w; x < w; x += 2) if (dith((d.x + x) >> 1, (y0 - y) >> 1, (1 - k) * (0.75 + pu * 0.25) - Math.abs(x) / w * 0.3)) ctx.fillRect((Math.round(d.x) & ~1) + x, (Math.round(y0) & ~1) - y, 2, 2); }
    }
    ctx.restore();
  }
  // 대족장 발밑의 핏빛 의식진 (캐릭터 아래): 바깥 고리·룬 8개·안쪽 고리가 반대로 돌고, 북이 울리면 밝아진다
  const RUNES = ['010111010', '101010101', '111101111', '110011110', '011110011', '101111101', '111010111', '100111001'];
  function drawRiteGround() {
    const b = G && G.boss; if (!b || b.dead || !G.drums || !(b.armorMul < 1)) return;
    const rt = b.riteT > 0 ? b.riteT / 0.35 : 0, R = 58 + rt * 6, a = 0.5 + 0.15 * Math.sin(time * 4) + rt * 0.45;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const ring = (r, n, col, al, rot, gap) => { ctx.fillStyle = `rgba(${col},${al})`; for (let i = 0; i < n; i++) { if (gap && i % gap === 0) continue; const t = i / n * TAU + rot; ctx.fillRect(Math.round(b.x + Math.cos(t) * r) & ~1, Math.round(b.y + Math.sin(t) * r * 0.5) & ~1, 2, 2); } };
    ring(R, 120, '255,50,30', a, time * 0.4, 0); ring(R - 4, 110, '255,120,60', a * 0.6, time * 0.4, 9); ring(R * 0.62, 70, '255,60,30', a * 0.9, -time * 0.7, 6);
    for (let i = 0; i < 8; i++) { const t = i / 8 * TAU + time * 0.4, cx = (Math.round(b.x + Math.cos(t) * R * 0.82) & ~1) - 3, cy = (Math.round(b.y + Math.sin(t) * R * 0.41) & ~1) - 3, g = RUNES[i];
      ctx.fillStyle = `rgba(255,${120 + rt * 120},${60 + rt * 100},${Math.min(1, a + 0.1)})`; for (let k = 0; k < 9; k++) if (g[k] === '1') ctx.fillRect(cx + (k % 3) * 2, cy + ((k / 3) | 0) * 2, 2, 2); }
    // 중심 디더 번짐
    ctx.fillStyle = `rgba(200,30,20,${0.25 + rt * 0.3})`;
    for (let y = Math.round(b.y - R * 0.5) & ~1; y <= b.y + R * 0.5; y += 2) for (let x = Math.round(b.x - R) & ~1; x <= b.x + R; x += 2) { const q = Math.hypot(x - b.x, (y - b.y) * 2) / R; if (q < 1 && dith(x >> 1, y >> 1, (1 - q) * 0.55)) ctx.fillRect(x, y, 2, 2); }
    ctx.restore();
  }
  function drawRiteVignette() {
    if (!G || !(G.riteBeat > 0)) return; const a = G.riteBeat / 0.4;
    const lv = Math.max(1, Math.min(8, Math.round(a * 8))), al = lv / 8; // v2.40 성능: 8단계 그림을 한 번씩만 만들어 재사용
    const img = art('riteVig' + lv, () => { const [c, g] = mkCanvas(VW, VH); g.fillStyle = `rgba(200,20,10,${0.22 * al})`; for (let y = 0; y < VH; y += 4) for (let x = 0; x < VW; x += 4) { const e = Math.max(Math.abs(x - VW / 2) / (VW / 2), Math.abs(y - VH / 2) / (VH / 2)); if (e > 0.72 && dith(x >> 2, y >> 2, (e - 0.72) / 0.28 * al)) g.fillRect(x, y, 4, 4); } return c; });
    ctx.drawImage(img, 0, 0);
  }
  function drawOrcWorld() {
    if (!G) return;
    drawRite();
    if (G.shocks) for (const s of G.shocks) { const k = s.r / s.max; pxRing(s.x, s.y, s.r, s.c, 1 - k * 0.6); pxRing(s.x, s.y, Math.max(2, s.r - 6), '255,250,230', 0.5 * (1 - k)); }
    const P = G.player;
    if (P && P.grab) {
      const gr = P.grab, x = Math.round(P.x), y = Math.round(P.y - 46 - (P.lift || 0)), w = 34, k = gr.mash / gr.need, blink = Math.floor(time * 10) % 2;
      ctx.font = '8px Galmuri7'; ctx.textAlign = 'center';
      if (TOUCH.on) { const t = '공격 연타 · 점멸로 탈출'; ctx.fillStyle = '#000'; fillTextW(t, x + 1, y + 1); ctx.fillStyle = blink ? '#ffe9b0' : '#ff9a6a'; fillTextW(t, x, y); }
      else { const col = blink ? '#ffe9b0' : '#ff9a6a'; drawW(() => drawKeyRow(ctx, x, y + 1, [['J', '연타'], ['SPACE', '탈출']], { color: col })); } // v2.63 키캡 (조명 위)
      ctx.fillStyle = '#000'; ctx.fillRect(x - w / 2 - 1, y + 3, w + 2, 5); ctx.fillStyle = '#3a2a20'; ctx.fillRect(x - w / 2, y + 4, w, 3); ctx.fillStyle = '#9fd2ff'; ctx.fillRect(x - w / 2, y + 4, Math.round(w * k), 3);
    }
  }
  // 그리기: 몸통(좌우 반전) + 어깨축으로 도는 앞팔·무기
  function kgPose(e, lean) { // 크루가쉬 자세 (2px): dy 내려앉음 · ux 어깨·머리 앞뒤 · hx/hdy 머리 더 · mx 양옆 가죽 · lL/lR 든 발
    if (e._kpT === time && e._kp) return e._kp;
    const f = e.face, ln = lean * f, st = e.state, P = { dy: 0, ux: 0, hx: 0, hdy: 0, mx: 0, lL: 0, lR: 0 }, z = e.z || 0;
    const mv = e.walk !== e._kw; e._kw = e.walk;
    if (e.grogiT > 0 || st === 'grogi' || st === 'dazed') Object.assign(P, { dy: 2, ux: 2 * f, hdy: 2 });
    else if (z > 2) Object.assign(P, { lL: 2, lR: 2, mx: 2 * f }); // 공중: 다리를 접고 가죽이 뒤로
    else if (e.dash) { const k = Math.floor(time * 12) % 2; Object.assign(P, { ux: 2 * f, mx: -2 * f * (1 + k), lL: k ? 2 : 0, lR: k ? 0 : 2 }); }
    else if (e.crouch > 0) Object.assign(P, { dy: 2, ux: -2 * f, mx: 2 * f, lR: e.crouch > 0.5 ? 0 : 0 });
    else if (ln < -0.08) Object.assign(P, { dy: 2, ux: -2 * f, mx: 2 * f }); // 준비: 낮추며 뒤로
    else if (ln > 0.08) Object.assign(P, { ux: 2 * f, hx: 2 * f, hdy: 2, mx: -2 * f, dy: ln > 0.2 ? 2 : 0 }); // 내려찍음: 앞으로 쏠림
    else if (mv && (st === 'chase' || st === 'idle') && !e.steps) { const k = Math.floor(e.walk * 0.9) % 4;
      if (k === 0 || k === 2) P.dy = 2; else { P.hdy = 2; if (k === 1) { P.lL = 2; P.mx = 2; } else { P.lR = 2; P.mx = -2; } } }
    e._kpT = time; return (e._kp = P);
  }
  function drawKrugash(e, ya, al, lean) { // v2.46 새 정면 도트 (거대한 꼬인 뿔 투구) + 특대형 핏빛 대도끼
    const white = e.flash > 0, f = e.face, z = e.z || 0, q0 = kgPose(e, lean), o = nmPose(e);
    o.dx += q0.ux || 0; const by = e.y + 2 - z + ya + (q0.dy || 0);
    drawShadow(e.x, e.y + 1, 14 * (z > 0 ? Math.max(0.4, 1 - z / 300) : 1));
    const X = e.x + o.dx, hx = X + f * NM_HAND, hy = by - 7 + o.bob, phi = e.aa, pw = f > 0 ? phi : Math.PI - phi;
    const rest = (e.state === 'chase' || e.state === 'idle') && !e.steps && !e.asw && !(e.glowT > 0), wa = rest ? (f > 0 ? -72 : -108) * DEG : pw; // v2.50 평소에도 손에 쥐고 세워 든다
    const back = !rest && Math.cos(phi) < -0.15 && Math.sin(phi) < 0.2;
    if (back) drawBlade(KRUG_AXE, hx, hy, wa, al, white);
    drawNM(e, 'nKrugash', null, e.x, by, o, white, al);
    if (!back) drawBlade(KRUG_AXE, hx + (rest ? f * 2 : 0), hy - (rest ? 4 : 0), wa, al, white);
    if (!white && e.otrail && e.otrail.length > 1) drawSlashPx(e.otrail.map(q => ({ a: f > 0 ? q.a : Math.PI - q.a, t: q.t })), hx, hy, KRUG_AXE.reach, slashCol(e), true); // v2.50 크루가쉬 궤적
    if (e.rockHold) drawSprite('boulder', 'deco', 4, X + f * 4, by - 36, false);
    if (e.glowT > 0) { const k = 1 - e.glowT / e.glowMax, r = 50; holdGlow(hx + Math.cos(pw) * r, hy + Math.sin(pw) * r, k, '255,120,60'); }
    if (e.state === 'dazed' || e.grogiT > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(X + Math.cos(time * 6 + i * 2.1) * 12) & ~1, Math.round(by - 36 + Math.sin(time * 6 + i * 2.1) * 3) & ~1, 2, 2); }
  }

  function drawOrc(e, ya, al, bob, lean) {
    if (e.type === 'boss' && e.orc === 'krugash') { drawKrugash(e, ya, al, lean); return; }
    const white = e.flash > 0, flip = e.face < 0, z = e.z || 0;
    if (e.type === 'slave') {
      drawShadow(e.x, e.y + 1, 9);
      { const M = nrMotion(e); nrBiped(e, M.m === 'wind' ? 'goblinUp' : 'goblin', 'slave', e.x, e.y + 2 - z + ya, flip, { white, alpha: al }, M); } // v1.54
      if (e.frenzyT > 0 && Math.random() < 0.4) G.parts.push({ x: e.x + rand(-5, 5), y: e.y - rand(14, 24), vx: 0, vy: -20, t: 0.3, c: '#ff6040', g: 0, glow: true });
      return;
    }
    if (e.type === 'wolf') {
      drawShadow(e.x, e.y + 1, 12);
      nrQuad(e, e.dash ? 'wolfB' : 'wolfA', 'wolfd', e.x, e.y + 2 - z + ya, flip, { white, alpha: al }); // v1.54
      if ((e.drumT > 0 || e.buffT > 0) && Math.random() < 0.3) G.parts.push({ x: e.x + rand(-8, 8), y: e.y - rand(10, 20), vx: 0, vy: -20, t: 0.3, c: '#ff4030', g: 0, glow: true });
      return;
    }
    if (ORC_NEW[e.orc]) return drawOrcNew(e, ya, al, ORC_NEW[e.orc]); // v2.44 새 정면 도트
    const S = orcSprite(e.orc, e.ov), y = e.y + 2 - z + ya, OM = nrMotion(e); // v1.54 출렁임 대신 칸 단위
    drawShadow(e.x, e.y + 1, Math.max(10, S.w * 0.3) * (z > 0 ? Math.max(0.4, 1 - z / 300) : 1));
    const fr = S.F ? (e.crouch > 0 ? S.F.low : e.state === 'dazed' ? S.F.crouch : OM.m === 'walk' && !e.steps ? [S.F.crouch, S.F.lL, S.F.crouch, S.F.lR][OM.f] : null) : null; // v1.39 걷기·웅크림은 장면으로
    const sx = 1 + (e.spread > 0 ? 0.06 : 0), sy = S.F ? 1 : (e.crouch > 0 ? 0.9 : 1) * (e.state === 'dazed' ? 0.94 : 1);
    const shx = e.x + e.face * S.sx, shy = y + S.sy * sy + (fr && S.F ? (fr === S.F.low ? 4 : fr === S.F.crouch ? 2 : 0) : 0), ang = e.face > 0 ? e.aa : Math.PI - e.aa; // 웅크린 만큼 어깨도 내려감
    // 평소엔 무기를 어깨에 메고 등 뒤로 넘긴다: 몸보다 먼저 그려 머리·몸에 가려지게 (v0.70)
    const carrying = S.carry && (e.carryHold || ((e.state === 'chase' || e.state === 'idle') && !e.steps && !e.asw && Math.abs(angDiff(e.aa, ORC_SPEC[e.orc].rest * DEG)) < 0.5));
    const CY0 = carrying && ORC_SPEC[e.orc].carry, cang = CY0 ? (e.face > 0 ? CY0.ang * DEG : Math.PI - CY0.ang * DEG) : 0;
    if (CY0 && !CY0.front) drawBlade(S.carry, shx, shy, cang, al, white);
    { const wi = white ? 1 : 0, src = fr ? fr[wi] : white ? S.wh : S.cv, sp = fr ? fr[2] : S.sp, rot = lean + (e.grogiT > 0 ? 0.2 * e.face : 0);
      const put = (c, dx, dy, oc) => { const t = pxXform(c, 2, rot, sx, sy, flip, { pvx: (S.w / 2) & ~1, pvy: S.h - 2, oc }); ctx.drawImage(t.c, snap2(e.x + dx) - t.ax, snap2(y + dy) - t.ay); }; // v1.05 칸 단위
      ctx.save(); ctx.globalAlpha = al;
      if (sp) { // v1.54 머리는 한 박자 늦게: 디딜 때 몸이 내려앉아도 머리는 남고, 발을 들 때 따라 내려옴 · 맞으면 뒤로 젖힘
        const q = OM.f, hd = OM.m === 'walk' && !e.steps ? [[0, -1], [0, 1], [0, -1], [0, 1]][q] : OM.m === 'hurt' ? [[0, 0], [-2, 0], [-1, 0], [0, 0]][q] : OM.m === 'idle' && !fr ? [0, [0, 0, 1, 1][q]] : [0, 0];
        put(sp.b[wi], 0, 0); for (let s2 = 0; s2 > hd[1]; s2--) put(sp.h[wi], hd[0] * 2 * e.face, s2 * 2); put(sp.h[wi], hd[0] * 2 * e.face, hd[1] * 2); put(sp.n[wi], 0, 0, 'rgba(0,0,0,0)');
      } else put(src, 0, 0);
      ctx.restore(); }
    if (e.type === 'odrum') { // 북잡이: 허리에 멘 북을 들고 다닌다 (v0.59)
      const hit = e.beatT > 1.08 || (e.steps && e.glowT > 0), dx = e.face * Math.round(S.w * 0.34), dy = Math.round(S.h * 0.12);
      ctx.fillStyle = white ? '#fff' : '#2a1a10'; for (let k = 0; k < 6; k++) ctx.fillRect((Math.round(e.x - e.face * (4 - k * 2)) & ~1), Math.round(y - S.h * 0.62 + k * 3 * 1.1) & ~1, 2, 2); // 어깨끈
      drawSprite('heldDrum', 'heldDrum', 2, e.x + dx, y - dy + (hit ? 2 : 0), flip, { white, alpha: al });
    }
    if (!carrying) drawBlade(S.arm, shx, shy, ang, al, white); else if (CY0.front) drawBlade(S.carry, shx, shy, cang, al, white); // 창·몽둥이는 어깨 위에 수평으로
    if (e.rockHold) drawSprite('boulder', 'deco', e.type === 'boss' ? 4 : 3, e.x + e.face * 4, y - S.h - 2, false);
    if (e.glowT > 0) { const k = 1 - e.glowT / e.glowMax, r = S.arm.reach * 0.92; holdGlow(shx + Math.cos(ang) * r, shy + Math.sin(ang) * r, k, '255,120,60'); }
    if ((e.drumT > 0 || e.buffT > 0) && Math.random() < 0.3) G.parts.push({ x: e.x + rand(-S.w * 0.2, S.w * 0.2), y: y - S.h * rand(0.5, 0.9), vx: 0, vy: -24, t: 0.35, c: '#ff4030', g: 0, glow: true });
    if (e.state === 'dazed') for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 12) & ~1, Math.round(y - S.h - 4 + Math.sin(time * 6 + i * 2.1) * 3) & ~1, 2, 2); }
  }
  const NM_SMALL = { ocharge: 10, odrum: 10, ogrip: 10, otroll: 10, urg: 11, troll: 11, gbrute: 11, boar: 11, exec: 10, mother: 10, coffin: 10, mordred: 10, queen: 10 };
  MAPS.nDrum = ['.kkkkkk.', 'kWWWWWWk', 'kwWWWWwk', 'kbRbbRbk', 'kbbRRbbk', 'kBRBBRBk', '.kkkkkk.']; // v2.44 새 도트 크기에 맞춘 작은 북
  const ORC_WPN = { orc: ['boneaxe'], othrow: ['spear'], shaman: ['totem'], ocharge: ['slasher'], odrum: ['hatchet'], ogrip: ['doubleaxe'], urg: ['greatbone'] }; // v2.50 오크 무기: 종류마다 한 가지로 고정 (주술사는 지팡이)
  const ORC_WCACHE = {};
  const ORC_NEW = { orc: 'nOrc', othrow: 'nOthrow', shaman: 'nShaman', ocharge: 'nOcharge', odrum: 'nOdrum', ogrip: 'nOgrip', otroll: 'nOtroll', urg: 'nUrg', troll: 'nTroll' };
  function drawOrcNew(e, ya, al, key) { // v2.44 오크: 정면 도트(양팔 포함) + 손에 쥔 무기만 따로 (팔이 셋이 되지 않게 짧은 주먹+무기)
    const S = orcSprite(e.orc, e.ov), SP = ORC_SPEC[e.orc], white = e.flash > 0, f = e.face, z = e.z || 0, o = nmPose(e);
    if (e.wk == null) { const L = ORC_WPN[e.orc]; e.wk = L ? L[Math.floor(Math.random() * L.length)] : SP.arm.kind === 'claw' ? 'shackle' : SP.arm.kind; } // v2.45 트롤: 손목의 쇠수갑
    const wkey = e.orc + '|' + e.wk + '|' + e.ov; S.armH = ORC_WCACHE[wkey];
    if (!S.armH) { const sk = e.ov == null ? SP.skin : 'v' + e.ov; const sm = { kind: e.wk, noArm: true, len: 2, th: Math.min(2, SP.arm.th), head: SP.arm.kind === 'claw' ? SP.arm.talon : Math.round((SP.arm.head || 4) * 1.35) + 1, wlen: Math.round((SP.arm.wlen || 10) * 1.3) }; /* v2.45 오크 무기는 몸보다 크게 (대형) */ S.armH = ORC_WCACHE[wkey] = genArm(Object.assign({ skin: sk, pal: SP.pal }, SP.arm, sm)); }
    const pal = e.ov != null && PAL[key + '_v' + e.ov] ? key + '_v' + e.ov : key, y = e.y + 2 - z + ya, X = e.x + o.dx;
    drawShadow(e.x, e.y + 1, 10 * (z > 0 ? Math.max(0.4, 1 - z / 300) : 1));
    const claw = SP.arm.kind === 'claw', hx = X + f * NM_HAND, hy = y - (claw ? 3 : 7) + o.bob, ang = f > 0 ? e.aa : Math.PI - e.aa; // 트롤 손은 바닥 가까이
    // v2.45 큰 무기는 평소엔 어깨에 메고(몸 뒤로 세움), 공격할 때만 휘두른다 — 땅에 박히거나 몸을 가리지 않게
    const carrying = !e.carryHold && (e.state === 'chase' || e.state === 'idle') && !e.steps && !e.asw && !(e.glowT > 0), CY0 = false, cang = (f > 0 ? -72 : -108) * DEG; // v2.50 평소에도 손에 쥐고 세워 든다 (등에 메지 않음)
    drawNM(e, key, pal, e.x, y, o, white, al);
    if (carrying && !claw) drawBlade(S.armH, hx + f * 2, hy - 4, cang, al, white);
    if (e.type === 'odrum') { const hit = e.beatT > 1.08 || (e.steps && e.glowT > 0); drawSprite('nDrum', 'heldDrum', 2, X - f * 9, y - 3 + o.bob + (hit ? 2 : 0), e.face < 0, { white, alpha: al }); } // 옆구리에 멘 작은 북 (북채는 앞손)
    // v2.45 트롤: 긴 팔 끝의 발톱이 무기 (평소엔 땅을 향해 늘어뜨리고, 휘두르면 그 방향으로 + 발톱 자국)
    if (claw) { drawBlade(S.armH, hx, hy - (carrying ? 1 : 3), carrying ? (f > 0 ? 0 : 180) * DEG : ang, al, white); drawBlade(S.armH, X - f * NM_HAND, hy - 1, (f > 0 ? 180 : 0) * DEG, al * 0.95, white); /* v2.50 사슬은 바닥을 따라 바깥으로 늘어짐 */ // 손목의 쇠수갑, 끊어진 사슬이 늘어짐 // 양손 주먹에 낀 가시 건틀릿
      if (e.asw && !white && al > 0.5) { // v2.45 주먹 타격 효과: 휘두른 방향 끝에서 별 모양 충격 + 바깥으로 퍼지는 파편
        const ix = hx + Math.cos(ang) * 10, iy = hy + Math.sin(ang) * 8, ph = Math.floor(time * 20) % 3, rr = 4 + ph * 3;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255,240,200,.95)'; ctx.fillRect(snap2(ix) - 2, snap2(iy) - 2, 4, 4);
        ctx.fillStyle = `rgba(255,200,120,${0.85 - ph * 0.2})`; for (let i = 0; i < 8; i++) { const a2 = i * Math.PI / 4; ctx.fillRect(snap2(ix + Math.cos(a2) * rr), snap2(iy + Math.sin(a2) * rr * 0.8), 2, 2); }
        ctx.fillStyle = `rgba(255,255,255,${0.6 - ph * 0.15})`; for (const a2 of [ang - 0.6, ang, ang + 0.6]) ctx.fillRect(snap2(ix + Math.cos(a2) * (rr + 4)), snap2(iy + Math.sin(a2) * (rr + 4) * 0.8), 2, 2);
        ctx.restore(); } }
    else if (!carrying) drawBlade(S.armH, hx, hy, ang, al, white);
    if (!white && e.otrail && e.otrail.length > 1) drawSlashPx(e.otrail.map(q => ({ a: f > 0 ? q.a : Math.PI - q.a, t: q.t })), hx, hy, (S.armH && S.armH.reach) || 40, slashCol(e), e.orc === 'urg'); // v2.50 준엘리트 이상 궤적
    if (e.rockHold) drawSprite('boulder', 'deco', 3, X + f * 2, y - 32, false);
    if (e.glowT > 0) { const k = 1 - e.glowT / e.glowMax, r = claw ? 12 : S.armH.reach * 0.92; holdGlow(hx + Math.cos(ang) * r, hy + Math.sin(ang) * r, k, '255,120,60'); }
    if ((e.drumT > 0 || e.buffT > 0) && Math.random() < 0.3) G.parts.push({ x: X + rand(-8, 8), y: y - rand(14, 28), vx: 0, vy: -24, t: 0.35, c: '#ff4030', g: 0, glow: true });
    if (e.state === 'dazed') for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(X + Math.cos(time * 6 + i * 2.1) * 12) & ~1, Math.round(y - 34 + Math.sin(time * 6 + i * 2.1) * 3) & ~1, 2, 2); }
  }
  // ---------- 공중 도약 (그림자는 땅을 따라가고 몸만 떠오른다)
  function airTick(e, dt) {
    const Q = e.air, P = G.player; Q.t += dt;
    if (Q.track && Q.t < Q.track) { Q.x1 = clamp(P.x, A.x0 + e.r, A.x1 - e.r); Q.y1 = clamp(P.y, A.y0 + e.r, A.y1 - e.r); }
    const k = Math.min(1, Q.t / Q.dur), m = Q.ease ? easeOut(k) : k;
    e.x = Q.x0 + (Q.x1 - Q.x0) * m; e.y = Q.y0 + (Q.y1 - Q.y0) * m; e.z = Math.sin(k * Math.PI) * Q.h;
    if (k >= 1) { e.z = 0; e.air = null; solveObs(e, e.r, true); if (Q.onLand) Q.onLand(); }
  }
  function leapTo(e, dur, h, track, onLand) { const P = G.player; e.air = { t: 0, dur, h, track, x0: e.x, y0: e.y, x1: P.x, y1: P.y, onLand }; sfx('whoosh', 0.6); dust(e.x, e.y, 12); }
  const wpick2 = arr => { let t = Math.random() * arr.reduce((s, x) => s + x[1], 0); for (const [k, w] of arr) { if (t < w) return k; t -= w; } return arr[0][0]; };
  function eliteIntro(e) { sfx('roar', 0.85); addShake(6); dust(e.x, e.y, 20); G.fx.push({ kind: 'ring', x: e.x, y: e.y - e.tall * 0.4, r: 10, t: 0.6, max: 0.6, c: '#ffb070', grow: 380 }); }

  // ---------- 엘리트: 투기장 챔피언 우르그 — 3연타 · 대지 강타(충격파 2중) · 도약 내려찍기 / 50% 이하 오크 전사 난입 + 4타 잡기
  function updateUrg(e, dt, d, a, moveTo) {
    const P = G.player;
    if (!e.enraged && e.hp < e.maxHp * 0.5) {
      e.enraged = true; e.spd *= 1.15; e.steps = null; e.state = 'recover'; e.t = 0.9;
      eliteIntro(e); banner('부락의 함성', '오크 전사들이 투기장으로 난입한다'); oSwing(e, -100, 0.2);
      for (let i = 0; i < 4; i++) queueSpawn('orc');
      return;
    }
    if (e.state !== 'chase') return;
    if (d > 62) moveTo(a, e.spd * orcSm(e));
    if (e.cd > 0) return;
    faceTo(e, a);
    const pat = d < 84 ? wpick2([['combo', 6], ['pound', 3]]) : d < 330 ? wpick2([['leap', 5], ['pound', d < 150 ? 2 : 0], ['walk', 2]]) : 'walk';
    if (pat === 'walk') { e.cd = 0.5; return; }
    if (pat === 'combo') {
      // v0.89: 매 타격마다 바닥 전조, 판정은 그 전조의 각도로
      const punch = (ang, mul, reach, back, next) => () => { const q = tAng(e.tl, angTo(e, P)); faceTo(e, q); oSlam(e, back ? -60 : 15, 0.08); oCone(e, q, reach, 95, e.atk * mul, { w: 4, step: 9, dust: 6 }); addShake(3, q); if (next) e.tl = oCt(e, angTo(e, P), next[0], next[1], next[2], { follow: true }); };
      const steps = [[0, () => { e.tl = oCt(e, a, 60, 95, 0.5, { follow: true }); oSwing(e, -125, 0.3); glowFor(e, 0.5); e.lean = -0.18 * e.face; }],
        [0.5, punch(0, 1, 60, false, [60, 95, 0.26])], [0.12, () => oSwing(e, -70, 0.08)], [0.14, punch(0, 0.9, 60, true, [66, 100, 0.28])],
        [0.14, () => oSwing(e, 110, 0.12)], [0.14, () => { const q = tAng(e.tl, angTo(e, P)); faceTo(e, q); oSlam(e, -80, 0.1); oCone(e, q, 66, 100, e.atk * 1.2, { w: 5, step: 12, dust: 8 }); addShake(5); }]];
      if (e.enraged) steps.push([0.3, () => { armTo(e, -30); e.spread = 0.4; glowFor(e, 0.4); e.tl = oLt(e, angTo(e, P), 100, 28, 0.4, { follow: true }); }], [0.4, () => { e.spread = 0; e.dash = { ang: tAng(e.tl, angTo(e, P)), sp: 300, t: 0.26, grab: { dur: 1.2, need: 7, dmg: e.atk * 1.3, kind: 'slam' } }; }], [0.3, null]);
      oSeq(e, steps, 1.0, rand(0.9, 1.4));
    } else if (pat === 'pound') {
      oSeq(e, [[0, () => { oSwing(e, -150, 0.35); glowFor(e, 0.7); e.lean = -0.25 * e.face; sfx('growl', 0.6); oRt(e, e.x, e.y, 74, 0.7); }],
        [0.7, () => { oSlam(e, 85, 0.1); e.lean = 0.3 * e.face; addShock(e, e.x, e.y, 74, 520, e.atk); sfx('blast', 0.8); debris(e.x, e.y, 14); oRt(e, e.x, e.y, 136, 0.28); }],
        [0.28, () => { addShock(e, e.x, e.y, 136, 480, e.atk * 0.8); }], [0.3, null]], 0.9, rand(1.2, 1.8));
    } else {
      oSeq(e, [[0, () => { e.crouch = 0.35; alertMark(e, e.tall + 6, true); armTo(e, -40); }],
        [0.35, () => { oRt(e, P.x, P.y, 58, 0.75, { pin: true }); leapTo(e, 0.75, 130, 0.35, () => { oCircle(e, 58, e.atk * 1.3, '#ffd0a0'); addShock(e, e.x, e.y, 104, 260, e.atk * 0.6); debris(e.x, e.y, 18); sfx('blast'); oSlam(e, 80, 0.1); }); }],
        [0.85, null]], 1.0, rand(1.4, 2.0));
    }
  }
  // ---------- 엘리트: 사슬 풀린 트롤 그러크 — 재생 · 넓게 할퀴기 · 바위 뜯어 던지기 / 40% 이하 배 덮치기 / 25% 이하 분노
  function updateTroll(e, dt, d, a, moveTo) {
    const P = G.player;
    if (!e.enraged && e.hp < e.maxHp * 0.25) { e.enraged = true; eliteIntro(e); banner('분노한 트롤', '재생이 두 배로 빨라진다'); e.steps = null; e.state = 'recover'; e.t = 0.7; return; }
    if (e.state === 'toRock') {
      const rk = e.rock;
      if (!rk || !G.obs.includes(rk)) { e.state = 'chase'; return; }
      const ra = Math.atan2(rk.y - e.y, rk.x - e.x), rd = Math.hypot(rk.x - e.x, rk.y - e.y);
      moveTo(ra, e.spd * 1.25);
      if (rd < rk.r + e.r + 10 || e.t < -4) {
        // 바위를 뜯어낸다: 그 엄폐물이 방에서 사라진다
        const R = G.dun.cur; G.obs.splice(G.obs.indexOf(rk), 1); if (R) { R.sprites = (R.sprites || []).filter(s => s.ob !== rk); G.nav = R.nav = buildNav(G.obs); }
        debris(rk.x, rk.y, 20); dust(rk.x, rk.y, 14); addShake(5); sfx('blast', 0.7);
        faceTo(e, angTo(e, P));
        oSeq(e, [[0, () => { e.rockHold = true; armTo(e, -100); glowFor(e, 0.8); }],
          [0.8, () => {
            e.rockHold = false; oSwing(e, 45, 0.12);
            const tx = clamp(P.x, A.x0 + 10, A.x1 - 10), ty = clamp(P.y, A.y0 + 10, A.y1 - 10), dur = 1.0;
            G.fx.push({ kind: 'lob', x0: e.x, y0: e.y - e.tall, gy0: e.y, x1: tx, y1: ty, h: 90, d0: 0.5, t: dur, max: dur, rock: true, owner: e });
            G.tele.push({ shape: 'circle', x: tx, y: ty, r: 38, t: 0, dur, owner: e, onFire: tt => { const P2 = G.player; if (!P2.dead && inShape(tt, P2.x, P2.y, P2.r)) hurtPlayer(e.atk * 1.2, e); debris(tt.x, tt.y, 22); addShake(7); sfx('blast'); } });
          }]], 0.8, rand(1.2, 1.8));
      }
      return;
    }
    if (e.state !== 'chase') return;
    if (d > 66) moveTo(a, e.spd * orcSm(e));
    if (e.cd > 0) return;
    faceTo(e, a);
    const rocks = G.obs.filter(b => b.t === 'rock' && b.c && Math.hypot(b.x - e.x, b.y - e.y) < 320);
    const low = e.hp < e.maxHp * 0.4;
    const pat = d < 96 ? wpick2([['sweep', 5], ['flop', low ? 3 : 0]]) : wpick2([['rock', rocks.length ? 4 : 0], ['walk', 3], ['flop', low && d < 150 ? 2 : 0]]);
    if (pat === 'walk') { e.cd = 0.4; return; }
    if (pat === 'rock') { e.rock = rocks.sort((p, q) => Math.hypot(p.x - e.x, p.y - e.y) - Math.hypot(q.x - e.x, q.y - e.y))[0]; e.state = 'toRock'; e.t = 0; return; }
    if (pat === 'sweep') {
      const sw = () => { const q = tAng(e.tl, angTo(e, P)); faceTo(e, q); oSlam(e, 75, 0.14); oCone(e, q, 78, 180, e.atk, { w: 5, step: 8, dust: 10, c: '230,230,210' }); addShake(4); };
      const steps = [[0, () => { e.tl = oCt(e, a, 78, 180, 0.55, { follow: true }); oSwing(e, -170, 0.32); glowFor(e, 0.55); e.lean = -0.2 * e.face; }], [0.55, sw]];
      if (e.enraged) steps.push([0.3, () => { e.tl = oCt(e, angTo(e, P), 78, 180, 0.3, { follow: true }); oSwing(e, -170, 0.2); glowFor(e, 0.3); }], [0.3, sw]);
      steps.push([0.2, null]);
      oSeq(e, steps, 0.9, rand(1.0, 1.6));
    } else {
      oSeq(e, [[0, () => { e.lean = -0.4 * e.face; e.crouch = 0.6; glowFor(e, 0.6); sfx('growl', 0.5); e.tl = oLt(e, a, 150, 70, 0.85, { follow: true }); }],
        [0.6, () => { e.lean = 0.7 * e.face; e.dash = { ang: tAng(e.tl, angTo(e, P)), sp: 280, t: 0.25 }; }],
        [0.25, () => { oCone(e, e.dash ? e.dash.ang : a, 80, 80, e.atk * 1.4, { step: 0, dust: 20, w: 6 }); addShake(9); sfx('blast', 0.7); e.vuln = 1.5; banner2(e, '엎어졌다!'); }],
        [1.5, () => { e.vuln = 1; e.lean = 0; }]], 0.5, rand(1.6, 2.2));
    }
  }

  // ---------- 보스: 붉은 엄니 대족장 크루가쉬
  function spawnKrugash() {
    const P0 = G.player, b = makeEnemy('orc', clamp(P0.x, A.x0 + 90, A.x1 - 90), clamp(P0.y - 220, A.y0 + 60, A.y1 - 60));
    const S = STG();
    Object.assign(b, { type: 'boss', kind: 'krugash', r: 30, hp: 4200 * S.hpMul, maxHp: 4200 * S.hpMul, atk: 27 * S.atkMul, def: 90, spd: 46, kbRes: 0, grogiMax: 120,
      stage: 1, state: 'idle', cd: 1.6, summonT: 22, rise: 0.8, armorMul: 1, huntT: 11 });
    orcSetup(b, 'krugash'); b.semiName = null;
    ascBoss(b);
    G.boss = b; G.enemies.push(b);
    dust(b.x, b.y, 36); debris(b.x, b.y, 24);
    G.fx.push({ kind: 'skybeam', x: b.x, y: b.y, w: 70, c: '255,90,40', t: 0.7, max: 0.7 });
    bossRoar(b, '#ff5030');
  }
  function krugashStage(b) {
    const pct = b.hp / b.maxHp;
    if (b.stage === 1 && pct <= 0.7) {
      b.stage = 2; banner('2단계 — 전쟁 북 의식', '북을 부숴라 — 울리는 동안 피해 -40%'); bossRoar(b, '#ff4030'); cancelTele(b); b.steps = null; b.dash = null; b.air = null; b.z = 0; b.state = 'recover'; b.t = 1.0;
      const cs = [[A.x0 + 90, A.y0 + 80], [A.x1 - 90, A.y0 + 80], [A.x0 + 90, A.y1 - 70], [A.x1 - 90, A.y1 - 70]].sort((p, q) => Math.hypot(q[0] - b.x, q[1] - b.y) - Math.hypot(p[0] - b.x, p[1] - b.y)).slice(0, 2);
      for (const [x, y] of cs) {
        const dm = { x, y, hp: 5, max: 5, boss: true, beatT: rand(0.6, 1.2), drop: 0.55 }; G.drums.push(dm);
        G.fx.push({ kind: 'skybeam', x, y, w: 26, t: 0.7, max: 0.7, c: '255,60,30' });
        G.obs.push({ c: true, x, y: y - 4, r: 14, t: 'drum' });
        const m = makeEnemy('otroll', x + (x < CX ? 40 : -40), y + 12); G.enemies.push(m);
      }
      const R = G.dun.cur; G.nav = buildNav(G.obs); if (R) R.nav = G.nav;
      b.armorMul = 0.6;
    }
    if (b.stage === 2 && pct <= 0.35) {
      b.stage = 3; banner('피의 광란', '진정한 결투가 시작된다'); squeezeStart(b); // v2.40 중앙으로 끌려가고 하늘에서 방책이 떨어짐 · 소환된 적은 모두 쓰러짐 bossRoar(b, '#ff2020'); cancelTele(b); b.steps = null; b.dash = null; b.air = null; b.z = 0; b.state = 'recover'; b.t = 0.8;
      for (const dm of G.drums) if (dm.boss && !dm.broken) { dm.broken = true; debris(dm.x, dm.y - 14, 24); dust(dm.x, dm.y, 14); }
      b.armorMul = 1; b.spd *= 1.25; b.frenzy = true; sfx('blast');
    }
  }
  // ================================================================ v2.40 크루가쉬 3단계: 불붙은 말뚝 방책이 하늘에서 떨어져 투기장이 좁아진다 (전투가 끝날 때까지) · v2.56 원형(타원)으로
  const SQZ = { kx: 0.56, ky: 0.62, drop: 1.1, fall: 0.28, up: 0.9 }; // 떨어지는 데 걸리는 시간 · 말뚝 하나가 떨어지는 시간 · 끝나고 사라지는 시간
  function squeezeStart(b) {
    const R = G.dun.cur, P = G.player, cx = Math.round((A.x0 + A.x1) / 4) * 2, cy = Math.round((A.y0 + A.y1) / 4) * 2, hw = Math.round((A.x1 - A.x0) * SQZ.kx / 4) * 2, hh = Math.round((A.y1 - A.y0) * SQZ.ky / 4) * 2;
    // 소환된 적은 모두 쓰러진다
    for (const e of G.enemies) if (!e.dead && e !== b && e.type !== 'boss' && !isDummy(e)) killEnemy(e, true);
    G.tele = G.tele.filter(t => t.shape !== 'spawn'); G.spawning = 0;
    // 플레이어와 크루가쉬를 투기장 한가운데로 (서로 마주 보게)
    const tp = (o, x, y) => { G.fx.push({ kind: 'ring', x: o.x, y: o.y, r: 6, t: 0.45, max: 0.45, c: '#ff4030', grow: 120 }); dust(o.x, o.y, 10); o.x = x; o.y = y; G.fx.push({ kind: 'ring', x, y, r: 6, t: 0.45, max: 0.45, c: '#ff4030', grow: 120 }); dust(x, y, 14); };
    if (!P.dead) { tp(P, cx, cy + 56); P.kx = P.ky = 0; P.thrown = null; P.grab = null; P.lift = 0; P.vx = P.vy = 0; }
    if (b) { tp(b, cx, cy - 46); b.air = null; b.dash = null; b.steps = null; b.z = 0; }
    G.sqz = { R, t: 0, out: false, outT: 0, c: { x0: cx - hw, y0: cy - hh, x1: cx + hw, y1: cy + hh }, e: { cx, cy, rx: Math.round(hw * 1.12 / 2) * 2, ry: Math.round(hh * 1.12 / 2) * 2 }, land: 0 }; // v2.56 원형(타원) 투기장
    flashT = 0.12; flashColor = '#ff3020'; sfx('roar', 0.7);
  }
  function squeezeTick(dt) {
    const Z = G.sqz; if (!Z) return; if (G.dun.cur !== Z.R) { G.sqz = null; return; }
    Z.t += dt; if (Z.out) { Z.outT += dt; if (Z.outT > SQZ.up + 0.3) { G.sqz = null; return; } return; }
    // 말뚝이 떨어지는 소리·흙먼지 (떨어지는 동안 일정 간격)
    const landed = Math.floor(clamp((Z.t - SQZ.fall) / SQZ.drop, 0, 1) * 16);
    const E = Z.e, onE = q => ({ x: E.cx + Math.cos(q) * E.rx, y: E.cy + Math.sin(q) * E.ry });
    while (Z.land < landed) { Z.land++; sfx('blast', 1.4 + Math.random() * 0.3); addShake(2); const p = onE(Math.random() * Math.PI * 2); dust(p.x, p.y, 10); debris(p.x, p.y, 4); }
    const P = G.player, pad = 8;
    const inE = (o, r, m) => { const ax = E.rx - r - m, ay = E.ry - r - m, dx = (o.x - E.cx) / ax, dy = (o.y - E.cy) / ay, d = Math.hypot(dx, dy); if (d > 1) { o.x = E.cx + dx / d * ax; o.y = E.cy + dy / d * ay; } }; // v2.56 타원 안으로
    if (!P.dead) inE(P, P.r, pad);
    for (const e2 of G.enemies) if (!e2.dead && e2.type !== 'flag') { const r = e2.r || 8; inE(e2, r, pad);
      if (e2.air) { const q = { x: e2.air.x1, y: e2.air.y1 }; inE(q, r, pad); e2.air.x1 = q.x; e2.air.y1 = q.y; } }
    const inside = q => ((q.x - E.cx) / (E.rx - 2)) ** 2 + ((q.y - E.cy + 4) / (E.ry + 2)) ** 2 < 1; // 방책은 탄을 막는다
    for (const q of G.eproj) if (!inside(q)) debris(q.x, q.y, 3);
    G.eproj = G.eproj.filter(inside); G.proj = G.proj.filter(inside); G.mproj = G.mproj.filter(inside);
    for (const l of G.loot) inE(l, 6, 8);
  }
  // 방책 말뚝 (2px 칸): 뾰족한 끝, 나뭇결, 끝에서 깜빡이는 잉걸
  function sqzStake(v, lit) { return art('sqzStake' + v + lit, () => { const [c, g] = mkCanvas(10, 26), P2 = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const tip = 2 + (v % 3) * 2; P2(0, tip + 2, 10, 24 - tip, '#0b0806'); P2(2, tip, 6, 4, '#0b0806'); P2(4, tip - 2, 2, 2, '#0b0806');
    P2(2, tip + 2, 6, 22 - tip, v % 2 ? '#6a4426' : '#5a3a20'); P2(2, tip + 2, 2, 22 - tip, '#8a5c34'); P2(6, tip + 2, 2, 22 - tip, '#3e2614'); P2(4, tip, 2, 2, '#8a5c34');
    P2(2, 16 + (v % 2) * 2, 6, 2, '#2a1a0e'); P2(2, 22, 6, 2, '#2a1a0e');
    if (lit) { P2(4, tip - 2, 2, 2, lit === 1 ? '#ffd34d' : '#ff7a2a'); P2(2, tip, 2, 2, '#ff5a1a'); P2(6, tip + 2, 2, 2, '#a3222a'); }
    return c; }); }
  let SQZ_PAT = null, SQZ_PAT2 = null;
  function drawSqueeze() { // v2.56 방책이 투기장 둘레를 따라 원형(타원)으로 떨어진다
    const Z = G.sqz; if (!Z || G.dun.cur !== Z.R) return; const E = Z.e;
    const jit = ord => { const v = Math.sin(ord * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
    // 말뚝: 안쪽 줄 + 바깥 줄(엇갈려 두껍게). 위에서부터 시계 방향으로 한 바퀴 돌며 차례로 떨어짐
    const per = Math.PI * (3 * (E.rx + E.ry) - Math.sqrt((3 * E.rx + E.ry) * (E.rx + 3 * E.ry))), N = Math.max(24, Math.round(per / 10));
    const delay = ord => ((ord % N) / N) * SQZ.drop * 0.8 + jit(ord) * SQZ.drop * 0.2;
    const fallY = ord => { // 말뚝이 하늘에서 떨어진 정도 (2px 칸 단위). null이면 아직 안 보임
      if (Z.out) { const k = clamp((Z.outT - jit(ord + 7) * 0.3) / SQZ.up, 0, 1); return k >= 1 ? null : -Math.round(k * k * 260 / 2) * 2; }
      const k = clamp((Z.t - delay(ord)) / SQZ.fall, 0, 1); return k <= 0 ? null : -Math.round((1 - k) * (1 - k) * 260 / 2) * 2; };
    const shown = Z.out ? 1 - clamp(Z.outT / SQZ.up, 0, 1) : clamp(Z.t / (SQZ.drop + SQZ.fall), 0, 1); // 바깥 어둠
    if (!SQZ_PAT) { const [pc, pg] = mkCanvas(4, 4); pg.fillStyle = '#0b0604'; pg.fillRect(0, 0, 2, 2); SQZ_PAT = ctx.createPattern(pc, 'repeat'); } // 바깥은 약한 망점으로만 어둡게
    if (!SQZ_PAT2) { const [pc, pg] = mkCanvas(4, 4); pg.fillStyle = '#0b0604'; pg.fillRect(0, 0, 2, 2); pg.fillRect(2, 2, 2, 2); SQZ_PAT2 = ctx.createPattern(pc, 'repeat'); }
    if (shown > 0.5) { // 타원 바깥을 2px 줄 단위로 어둡게 (곡선도 칸 단위 계단)
      const X0 = A.x0 - 80, Y0 = A.y0 - 40, X1 = A.x1 + 80, Y1 = A.y1 + 40, top = E.cy - E.ry, bot = E.cy + E.ry;
      ctx.fillStyle = SQZ_PAT; ctx.fillRect(X0, Y0, X1 - X0, top - Y0); ctx.fillRect(X0, bot, X1 - X0, Y1 - bot);
      for (let y = top; y < bot; y += 2) { const k = (y + 1 - E.cy) / E.ry, hw = Math.round(E.rx * Math.sqrt(Math.max(0, 1 - k * k)) / 2) * 2;
        ctx.fillStyle = SQZ_PAT; ctx.fillRect(X0, y, E.cx - hw - X0, 2); ctx.fillRect(E.cx + hw, y, X1 - E.cx - hw, 2);
        ctx.fillStyle = SQZ_PAT2; const bw = Math.min(hw, 12); ctx.fillRect(E.cx - hw, y, bw, 2); ctx.fillRect(E.cx + hw - bw, y, bw, 2); }
    }
  }
  // v2.57 말뚝은 캐릭터와 함께 깊이 정렬 — 아래쪽 줄은 캐릭터 앞, 위쪽 줄은 뒤 (맵 하단 울타리 규칙)
  function sqzEnts(ents) {
    const Z = G.sqz; if (!Z || G.dun.cur !== Z.R) return; const E = Z.e;
    const jit = ord => { const v = Math.sin(ord * 12.9898 + 4.1) * 43758.5453; return v - Math.floor(v); };
    const per = Math.PI * (3 * (E.rx + E.ry) - Math.sqrt((3 * E.rx + E.ry) * (E.rx + 3 * E.ry))), N = Math.max(24, Math.round(per / 10));
    const delay = ord => ((ord % N) / N) * SQZ.drop * 0.8 + jit(ord) * SQZ.drop * 0.2;
    const fallY = ord => {
      if (Z.out) { const k = clamp((Z.outT - jit(ord + 7) * 0.3) / SQZ.up, 0, 1); return k >= 1 ? null : -Math.round(k * k * 260 / 2) * 2; }
      const k = clamp((Z.t - delay(ord)) / SQZ.fall, 0, 1); return k <= 0 ? null : -Math.round((1 - k) * (1 - k) * 260 / 2) * 2; };
    const fl = i => (Math.floor(time * 6 + i * 1.7) % 5 === 0 ? 1 : 2);
    for (let i = 0; i < N; i++) for (let ring = 0; ring < 2; ring++) {
      const ord = i + ring * N, oy = fallY(ord); if (oy == null) continue;
      const q = -Math.PI / 2 + (i + ring * 0.5) / N * Math.PI * 2, rr = ring ? 8 : 0;
      const x = Math.round((E.cx + Math.cos(q) * (E.rx + rr) - 5) / 2) * 2, by = Math.round((E.cy + Math.sin(q) * (E.ry + rr * 0.6)) / 2) * 2;
      const img = sqzStake((i * 2 + ring) % 6, !ring && i % 3 === 0 ? fl(i) : 0);
      ents.push({ y: by - 1, d: () => { if (oy < -6) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 2, by, 6, 2); } ctx.drawImage(img, x, by - 24 + oy); } }); }
  }
  function updateKrugash(b, dt) {
    const P = G.player;
    b.flash = Math.max(0, b.flash - dt); b.rise = Math.max(0, b.rise - dt); b.lean *= Math.pow(0.02, dt);
    orcTick(b, dt);
    if (b.air) airTick(b, dt);
    if (b.grogiT > 0) { b.grogiT -= dt; b.steps = null; b.dash = null; b.state = 'grogi'; armTo(b, 95); if (b.grogiT <= 0) { b.state = 'idle'; b.cd = 0.8; } return; }
    krugashStage(b);
    if (b.spikeQ && b.spikeQ.length) { // 솟아오르는 가시: 플레이어와 자기편 오크 모두 찌른다
      for (const q of b.spikeQ) { q.t -= dt; if (q.t <= 0 && !q.done) { q.done = true;
        G.fx.push({ kind: 'rockspike', x: q.x, y: q.y, t: 1.05, max: 1.05, v: (Math.random() * 4) | 0, fl: Math.random() < 0.5, sd: Math.random() * 1000 }); dust(q.x, q.y, 7); for (let i = 0; i < 3; i++) G.parts.push({ x: q.x + rand(-8, 8), y: q.y - 4, vx: rand(-60, 60), vy: -rand(90, 170), t: 0.5, c: pick(['#7a5e48', '#a88a6a', '#4a3628']), g: 420 });
        if (!P.dead && Math.hypot(P.x - q.x, (P.y - q.y) / 0.85) < 20 + P.r) hurtPlayer(b.atk * 0.75, b);
        for (const e of G.enemies) if (!e.dead && e !== b && Math.hypot(e.x - q.x, e.y - q.y) < 20 + (e.r || 8)) krugHitAlly(e, b.atk * 0.75, b);
        if (Math.random() < 0.35) { addShake(2); sfx('hit', 0.7); } } }
      b.spikeQ = b.spikeQ.filter(q => !q.done);
    }
    b.t -= dt; b.cd -= dt; b.summonT -= dt; if (b.stage === 3) b.huntT -= dt;
    if (P.dead) return;
    if (b.state === 'seq') { runSeq(b, dt); return; }
    if (b.state === 'recover') { if (b.t <= 0) { b.state = 'idle'; b.vuln = 1; } return; }
    if (b.state === 'grabbing') return;
    b.state = 'idle'; b.vuln = 1;
    const d = dist(b, P), a = angTo(b, P), fr = b.frenzy ? 0.8 : 1;
    if (d > 115) {
      const ang = steer(b, a), sp = b.spd * (d > 220 ? 1.5 : 1); // v0.88: 멀면 성큼성큼 좁혀 온다
      b.x += Math.cos(ang) * sp * dt; b.y += Math.sin(ang) * sp * dt; b.walk += dt * sp / 9; faceTo(b, a);
      b.x = clamp(b.x, A.x0 + b.r, A.x1 - b.r); b.y = clamp(b.y, A.y0 + b.r, A.y1 - b.r); solveObs(b, b.r, true);
      const st = Math.floor(b.walk / 3); if (st !== b.lastStep) { b.lastStep = st; addShake(1.2); sfx('step', 0.45); }
    }
    if (b.summonT <= 0 && b.stage !== 3) { // v2.40 3단계부터는 소환 없음 (1:1 결투)
      b.summonT = 25; faceTo(b, a);
      b.summonN = (b.summonN || 0) + 1;
      const beasts = b.summonN % 2 === 0; // 짝수 번째는 맹수 우리를 연다
      oSeq(b, [[0, () => { oSwing(b, -120, 0.3); glowFor(b, 0.6); }], [0.6, () => { bossRoar(b, '#ff6040');
        if (beasts) { banner('맹수 우리가 열렸다', '굶주린 전투 늑대가 투기장으로 풀려난다'); const gate = { x: DOOR.n.x, y: A.y0 + 30 }; for (let i = 0; i < (b.stage === 3 ? 4 : 3); i++) queueSpawn('wolf', { x: gate.x + (i - 1.5) * 26, y: gate.y + rand(0, 16) }); }
        else { for (let i = 0; i < 3; i++) queueSpawn('orc'); if (b.stage === 3) { queueSpawn('slave'); queueSpawn('slave'); } } }]], 0.8, 0.8);
      return;
    }
    if (d > 220) b.cd -= dt * 0.6; // v0.88: 멀면 다음 패턴(접근기)을 빨리 꺼낸다
    if (b.cd > 0) return;
    faceTo(b, a);
    const near = d < 145, S2 = b.stage >= 2, S3 = b.stage === 3;
    // 3페이즈 고유 패턴: 추적하는 3연속 처형 타격. 매 타격 직전에 위치를 고정해
    // 플레이어가 계속 움직이면 피할 수 있지만, 한곳에 머무르면 연속으로 몰린다.
    if (S3 && b.huntT <= 0) {
      b.huntT = 19; b.cd = 0;
      oSeq(b, [[0, () => { banner('피의 사냥', '붉은 표식 3번 — 계속 움직여라'); bossRoar(b, '#ff2020'); armTo(b, -145); glowFor(b, 1.1); sfx('warn', 1.2); }],
        [0.55, () => { const x = clamp(P.x, A.x0 + 58, A.x1 - 58), y = clamp(P.y, A.y0 + 58, A.y1 - 58); G.tele.push({ shape: 'circle', x, y, r: 54, t: 0, dur: 0.78, owner: b, heavy: true, onFire: tt => { if (!P.dead && inShape(tt, P.x, P.y, P.r)) hurtPlayer(b.atk * 0.9, b); debris(tt.x, tt.y, 18); addShake(7); sfx('blast', 0.8); } }); }],
        [0.82, () => { const x = clamp(P.x, A.x0 + 58, A.x1 - 58), y = clamp(P.y, A.y0 + 58, A.y1 - 58); G.tele.push({ shape: 'circle', x, y, r: 54, t: 0, dur: 0.78, owner: b, heavy: true, onFire: tt => { if (!P.dead && inShape(tt, P.x, P.y, P.r)) hurtPlayer(b.atk * 0.9, b); debris(tt.x, tt.y, 18); addShake(7); sfx('blast', 0.8); } }); }],
        [0.82, () => { const x = clamp(P.x, A.x0 + 58, A.x1 - 58), y = clamp(P.y, A.y0 + 58, A.y1 - 58); G.tele.push({ shape: 'circle', x, y, r: 54, t: 0, dur: 0.78, owner: b, heavy: true, onFire: tt => { if (!P.dead && inShape(tt, P.x, P.y, P.r)) hurtPlayer(b.atk * 0.9, b); debris(tt.x, tt.y, 18); addShake(7); sfx('blast', 0.8); } }); }],
        [0.9, null]], 0.8, 0.7);
      return;
    }
    // v0.70: 돌진 비중을 줄이고 투기장 가시 함정 추가, 같은 패턴 연속 금지
    // v0.88: 멀리서는 돌진·도약으로 붙는 패턴 위주, 제자리 패턴(가시·바위)은 가끔만. 가까우면 근접 연타 위주
    const inPlace = b.lastPat === 'spikes' || b.lastPat === 'boulder' ? 0.3 : 1; // 제자리 패턴 직후엔 또 제자리 패턴이 잘 안 나온다
    let pat = S3 ? (near ? wpick2([['grab', 3], ['frenzy', 2], ['chop', 3], ['stomp', 1], ['spikes', 0.5]]) : wpick2([['leap', 3], ['charge', 3], ['boulder', 0.7 * inPlace], ['spikes', 0.7 * inPlace]]))
      : S2 ? (near ? wpick2([['chop', 4], ['stomp', 2], ['grab', 1], ['spikes', 0.5]]) : wpick2([['charge', 3], ['leap', 2], ['boulder', 0.8 * inPlace], ['spikes', 0.7 * inPlace]]))
      : (near ? wpick2([['chop', 5], ['stomp', 2], ['spikes', 0.5]]) : wpick2([['charge', 3], ['leap', 1.5], ['spikes', 0.8 * inPlace]]));
    if (pat === b.lastPat && pat !== 'chop') pat = near ? 'chop' : (pat === 'charge' ? 'leap' : 'charge');
    b.lastPat = pat;
    const chop = (mul, reach, arc, up) => () => { const q = b.lockA == null ? angTo(b, P) : b.lockA; faceTo(b, q); oSlam(b, up ? -40 : 70, 0.12); oCone(b, q, reach, arc, b.atk * mul, { w: 6, step: 10, dust: 12 }); addShake(6, q); if (!up) krugImpact(b.x + Math.cos(q) * reach * 0.7, b.y + Math.sin(q) * reach * 0.55, 0.9); else { hitstop = Math.max(hitstop, 0.03); for (let i = 0; i < 12; i++) { const a = q + rand(-0.8, 0.8); G.parts.push({ x: b.x + Math.cos(a) * reach * 0.6, y: b.y - 20 + Math.sin(a) * reach * 0.4, vx: Math.cos(a) * 200, vy: Math.sin(a) * 120 - 60, t: 0.35, c: pick(['#ffd070', '#ff8040']), g: 200, glow: true }); } } };
    if (pat === 'walk') { b.cd = 0.6; return; }
    if (pat === 'spikes') { // 투기장 가시 함정 (v0.73): 방향마다 경고선 하나 → 대도끼를 내려찍으면 안쪽부터 가시가 차례로 솟는다
      const n = S3 ? 8 : S2 ? 6 : 4, a0 = S2 ? angTo(b, P) : (Math.random() < 0.5 ? 0 : Math.PI / 4), wd = 0.85 * fr;
      oSeq(b, [[0, () => { oSwing(b, -150, 0.3); glowFor(b, 0.7); b.lean = -0.2 * b.face; sfx('growl', 0.6); alertMark(b, b.tall + 8, true);
          for (let i = 0; i < n; i++) { const q = a0 + i / n * TAU, pts = []; for (let k = 0; k < 8; k++) { const x = b.x + Math.cos(q) * (44 + k * 32), y = b.y + Math.sin(q) * (44 + k * 32) * 0.85; if (x < A.x0 + 10 || x > A.x1 - 10 || y < A.y0 + 10 || y > A.y1 - 10) break; pts.push({ x, y }); }
            if (!pts.length) continue; const last = pts[pts.length - 1], L = Math.hypot(last.x - b.x, last.y - b.y) + 14;
            G.tele.push({ shape: 'line', x: b.x, y: b.y, ang: Math.atan2(last.y - b.y, last.x - b.x), len: L, w: 30, t: 0, dur: wd, owner: b, quiet: true, ff: false });
            pts.forEach((pt, k) => (b.spikeQ = b.spikeQ || []).push({ x: pt.x, y: pt.y, t: wd + k * 0.07 })); } }],
        [wd, () => { oSlam(b, 75, 0.1); b.lean = 0.25 * b.face; krugImpact(b.x + b.face * 34, b.y, 1.1); sfx('blast', 0.6); }], [0.8, null]], 0.7, rand(1.2, 1.7) * fr);
      return;
    }
    if (pat === 'chop') {
      // v0.89: 2·3타에도 바닥 전조. 3타는 다시 조준
      const c1 = chop(1, 126, 110);
      const steps = [[0, () => { b.lockA = angTo(b, P); G.tele.push({ shape: 'cone', x: b.x, y: b.y, ang: b.lockA, r: 126, arc: 110 * DEG, t: 0, dur: 0.6 * fr, owner: b, heavy: true }); oSwing(b, -150, 0.3); glowFor(b, 0.6); b.lean = -0.15 * b.face; }],
        [0.6 * fr, () => { c1(); oCt(b, b.lockA, 130, 150, 0.3, { heavy: true }); }], [0.3, chop(0.8, 130, 150, true)]];
      if (S2) steps.push([0.35, () => { b.lockA = angTo(b, P); faceTo(b, b.lockA); oCt(b, b.lockA, 128, 110, 0.38 * fr, { heavy: true }); oSwing(b, -150, 0.22); glowFor(b, 0.35); }], [0.38 * fr, chop(1.1, 128, 110)]);
      steps.push([0.25, null]);
      oSeq(b, steps, 0.9 * fr, rand(0.8, 1.3) * fr);
    } else if (pat === 'stomp') {
      const steps = [[0, () => { G.tele.push({ shape: 'circle', x: b.x, y: b.y, r: 164, t: 0, dur: 0.7 * fr, owner: b, heavy: true }); b.lean = -0.25 * b.face; b.crouch = 0.6; sfx('growl', 0.6); glowFor(b, 0.7); }], [0.7 * fr, () => { b.lean = 0.2 * b.face; b.crouch = 0; addShock(b, b.x, b.y, 164, 600, b.atk * 0.8); sfx('blast', 0.7); krugImpact(b.x, b.y, 1.4); if (S3) oRt(b, b.x, b.y, 200, 0.35, { heavy: true }); }]];
      if (S3) steps.push([0.35, () => { b.lean = 0.2 * b.face; addShock(b, b.x, b.y, 200, 620, b.atk * 0.6); sfx('blast', 0.8); krugImpact(b.x, b.y, 1.0); }]);
      steps.push([0.3, null]);
      oSeq(b, steps, 0.7, rand(1.0, 1.5) * fr);
    } else if (pat === 'charge') { // 휘두르며 돌진 (v0.73): 도끼를 뒤로 젖혔다가 달리면서 좌우로 크게 휘두르고, 끝에 내려찍는다
      const sweep = (k) => () => { if (!b.dash) return; const q = b.lockA, up = k % 2 === 1; oSlam(b, up ? -140 : 80, 0.12); oCone(b, q, 96, 150, b.atk * 0.7, { w: 6, step: 0, dust: 10 }); addShake(4, q); b.lean = (up ? -0.1 : 0.25) * b.face; };
      const steps = [[0, () => { b.lockA = a; G.tele.push({ shape: 'line', x: b.x, y: b.y, ang: a, len: 700, w: 60, t: 0, dur: 0.8, owner: b }); alertMark(b, b.tall + 8, true); sfx('roar', 0.8); oSwing(b, -165, 0.4); b.lean = -0.2 * b.face; }],
        [0.8, () => { b.dash = { ang: b.lockA, sp: 400, t: 1.6, dmg: b.atk * 0.8, kb: 360, plow: true, onWall: () => { b.dash = null; addShake(10, b.lockA); krugImpact(b.x + Math.cos(b.lockA) * 30, b.y + Math.sin(b.lockA) * 20, 1.2); banner2(b, '쿵!'); } }; sfx('whoosh', 0.6); }]];
      for (let k = 0; k < 5; k++) steps.push([k === 0 ? 0.12 : 0.3, sweep(k)]);
      steps.push([0.25, () => { b.dash = null; const q = angTo(b, P); faceTo(b, q); oSwing(b, -160, 0.2); glowFor(b, 0.4); b.tl = oCt(b, q, 130, 120, 0.4, { heavy: true, follow: true }); }],
        [0.4, () => { const q = tAng(b.tl, angTo(b, P)); faceTo(b, q); oSlam(b, 80, 0.1); oCone(b, q, 130, 120, b.atk * 1.2, { w: 6, step: 14, dust: 14 }); krugImpact(b.x + Math.cos(q) * 90, b.y + Math.sin(q) * 70, 1.3); b.vuln = 1.3; }],
        [0.7, () => { b.vuln = 1; }]);
      oSeq(b, steps, 0.6, rand(1.6, 2.2) * fr);
    } else if (pat === 'boulder') {
      oSeq(b, [[0, () => { b.rockHold = true; armTo(b, -100); glowFor(b, 0.9); sfx('growl', 0.5); dust(b.x, b.y, 10); }],
        [0.9 * fr, () => {
          b.rockHold = false; oSwing(b, 40, 0.12);
          const tx = clamp(P.x, A.x0 + 12, A.x1 - 12), ty = clamp(P.y, A.y0 + 12, A.y1 - 12), dur = 1.1;
          G.fx.push({ kind: 'lob', x0: b.x, y0: b.y - b.tall, gy0: b.y, x1: tx, y1: ty, h: 110, d0: 0.5, t: dur, max: dur, rock: true, owner: b });
          G.tele.push({ shape: 'circle', x: tx, y: ty, r: 46, t: 0, dur, owner: b, onFire: tt => {
            const P2 = G.player; if (!P2.dead && inShape(tt, P2.x, P2.y, P2.r)) hurtPlayer(b.atk * 1.1, b);
            debris(tt.x, tt.y, 26); addShake(8); sfx('blast');
            for (let i = 0; i < 6; i++) { const q = i / 6 * TAU + rand(-0.15, 0.15); G.eproj.push({ x: tt.x, y: tt.y, ang: q, sp: 170, r: 4, dmg: b.atk * 0.45, t: 0.9, hist: [], kind: 'rock' }); }
          } });
        }]], 0.7, rand(1.2, 1.8) * fr);
    } else if (pat === 'leap') {
      const land = () => { krugImpact(b.x, b.y, 1.5); sigHit(() => oCircle(b, 76, b.atk * 1.2, '#ffc090')); addShock(b, b.x, b.y, 136, 290, b.atk * 0.6); debris(b.x, b.y, 26); addShake(10); sfx('blast'); oSlam(b, 80, 0.1); };
      const jump = (dur, h, tr) => () => { oRt(b, P.x, P.y, 76, dur, { heavy: true, pin: true }); leapTo(b, dur, h, tr, land); };
      oSeq(b, [[0, () => { b.crouch = 0.4; alertMark(b, b.tall + 8, true); armTo(b, -135); }], [0.4, jump(0.95, 260, 0.6)],
        [1.15, () => { b.crouch = 0.3; armTo(b, -135); }], [0.32, jump(0.85, 220, 0.5)], [1.05, null]], 0.9, rand(1.3, 1.8));
    } else if (pat === 'grab') {
      oSeq(b, [[0, () => { armTo(b, -40); b.spread = 0.5; glowFor(b, 0.5); alertMark(b, b.tall + 8, true); sfx('growl', 0.6); b.tl = oLt(b, a, 140, 40, 0.5, { heavy: true, follow: true }); }],
        [0.5, () => { b.spread = 0; b.dash = { ang: tAng(b.tl, angTo(b, P)), sp: 330, t: 0.3, grab: { dur: 1.45, need: 8, dmg: b.atk * 1.1, kind: 'slam' } }; armTo(b, 0); }],
        [0.4, () => { if (b.state !== 'seq') return 'stop'; }]], 1.0, rand(1.2, 1.6));
    } else if (pat === 'frenzy') {
      const steps = [[0, () => { oSwing(b, -140, 0.2); glowFor(b, 0.3); }]];
      for (let i = 0; i < 5; i++) steps.push([i === 0 ? 0.3 : 0.28, () => { const q = angTo(b, P); faceTo(b, q); b.tl = oCt(b, q, 120, 120, 0.24, { heavy: true }); }], [0.24, () => { const q = tAng(b.tl, angTo(b, P)); faceTo(b, q); const up = i % 2 === 1; oSlam(b, up ? -120 : 70, 0.1); sigHit(() => oCone(b, q, 120, 120, b.atk * 0.7, { w: 5, step: 8, dust: 8 })); addShake(4, q); }]);
      steps.push([0.3, () => { b.steps = null; b.state = 'recover'; b.t = 2.0; b.vuln = 1.3; armTo(b, 90); banner2(b, '헉헉...'); return 'stop'; }]);
      oSeq(b, steps, 2.0, 0.8);
    }
  }
  // ---------- 오크 부락 방 그래픽 (2px 칸 · 디더링)
  const WOODPAL = { k: '#0b0806', K: '#060403', h: '#9a6a40', l: '#7a5030', d: '#553620', D: '#33200f', m: '#4a3a24', M: '#6a5634', w: '#e0d6c4', W: '#a89a84', r: '#9a2a24', R: '#5e1612', o: '#8a6034', O: '#5a3a1e', s: '#c8a070', y: '#d8a840', b: '#7a5a3a', B: '#4e3a26' };
  const EARTH = ['#24150d', '#2e1b11', '#3a2316', '#462b1a', '#53331e'];
  const SAND = ['#5a3e24', '#6a4a2c', '#7a5634', '#8a6440'];
  function paintOrcFloor(g, R) {
    g.fillStyle = '#0a0605'; g.fillRect(0, 0, W, H);
    // 값 노이즈 (거친 격자 → 보간)
    const CS = 28, gw = Math.ceil(W / CS) + 2, gh = Math.ceil(H / CS) + 2, NZ = Array.from({ length: gw * gh }, () => Math.random());
    const nz = (x, y) => { const fx = x / CS, fy = y / CS, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, at = (i, j) => NZ[(((j % gh) + gh) % gh) * gw + (((i % gw) + gw) % gw)]; const s = t => t * t * (3 - 2 * t); return (at(ix, iy) * (1 - s(tx)) + at(ix + 1, iy) * s(tx)) * (1 - s(ty)) + (at(ix, iy + 1) * (1 - s(tx)) + at(ix + 1, iy + 1) * s(tx)) * s(ty); };
    const ring = ROOMSTYLE.ground === 'ring' || R.shape === 'arena' || R.type === 'boss';
    const rx = (A.x1 - A.x0) * 0.4, ry = (A.y1 - A.y0) * 0.38;
    // 밟혀 다져진 길: 문에서 가운데로
    const paths = ROOMSTYLE.ground === 'tread' ? Object.keys(R.doors).filter(dd => R.doors[dd] != null).map(dd => DOOR[dd]) : [];
    const segD = (px, py, ax, ay) => { const bx = CX, by = CY, vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy || 1, t = clamp(((px - ax) * vx + (py - ay) * vy) / L, 0, 1); return Math.hypot(px - ax - vx * t, py - ay - vy * t); };
    const CL = cellLayer(A.x0 - 4, A.y0 - 4, A.x1 + 4, A.y1 + 4);
    for (let y = (A.y0 - 4) & ~1; y < A.y1 + 4; y += 2) for (let x = (A.x0 - 4) & ~1; x < A.x1 + 4; x += 2) {
      let v = nz(x, y) * 0.75 + rand(-0.12, 0.12) + 0.2, pal = EARTH;
      if (ring) { const e = Math.hypot((x - CX) / rx, (y - CY) / ry); if (e < 1 && !(e > 0.9 && dith(x >> 1, y >> 1, (e - 0.9) * 10))) { pal = SAND; v = nz(x * 1.7, y * 1.7) * 0.6 + rand(-0.1, 0.1) + 0.25; } }
      if (pal === EARTH && paths.length) { let md = 1e9; for (const p of paths) md = Math.min(md, segD(x, y, p.x, p.y)); if (md < 16 && !(md > 10 && dith(x >> 1, y >> 1, (md - 10) / 6))) v -= 0.32; }
      const f = clamp(v, 0, 0.999) * (pal.length - 1), i = Math.floor(f), j = Math.min(pal.length - 1, i + (dith(x >> 1, y >> 1, f - i) ? 1 : 0));
      CL.set(x, y, pal[j]);
    }
    CL.flush(g);
    // 바닥 자국: 뼈 · 돌 · 짚 · 불탄 자리 · 발자국
    const inA = (x, y, m = 8) => x > A.x0 + m && x < A.x1 - m && y > A.y0 + m && y < A.y1 - m;
    const area = (A.x1 - A.x0) * (A.y1 - A.y0) / 540000;
    const SD = window.SCN34 && SCN34.dec, SP = window.SCN34 && SCN34.decPal, dstamp = (k, x, y) => { const gr = fromRows(SD[k]); if (typeof OCC !== 'undefined' && !OCC.stamp(x, y, gr[0].length * 2, gr.length * 2)) return; gPaint(g, gr, SP, x, y); }; // v2.85 점유 지도 // v2.82 뼈 조각 · 자갈 · 짚을 작은 도트 그림으로
    for (let i = 0; i < 14 * area; i++) { const x = randi(A.x0, A.x1) & ~1, y = randi(A.y0, A.y1) & ~1; if (!inA(x, y) || !decFree(x, y, 8)) continue; dstamp(pick(['bone1', 'bone1', 'bone2', 'jaw']), x - 6, y - 4); }
    for (let i = 0; i < 18 * area; i++) { const x = randi(A.x0, A.x1) & ~1, y = randi(A.y0, A.y1) & ~1; if (!inA(x, y) || !decFree(x, y, 8)) continue; dstamp(pick(['peb1', 'peb2']), x - 4, y - 4); }
    for (let i = 0; i < 22 * area; i++) { const x = randi(A.x0, A.x1) & ~1, y = randi(A.y0, A.y1) & ~1; if (!inA(x, y) || !decFree(x, y, 8)) continue; dstamp(pick(['straw1', 'straw2']), x - 4, y - 4); }
    for (let i = 0; i < 4 * area + 1; i++) {
      const cx = randi(A.x0 + 40, A.x1 - 40), cy = randi(A.y0 + 30, A.y1 - 30), r = randi(10, 18); if (!decFree(cx, cy, r * 1.4, true)) continue;
      for (let y = -r; y <= r; y += 2) for (let x = -r * 1.4; x <= r * 1.4; x += 2) { const e = Math.hypot(x / 1.4, y) / r; if (e < 1 && dith((cx + x) >> 1, (cy + y) >> 1, 1 - e * 0.9)) { g.fillStyle = e < 0.4 ? '#0e0806' : '#1a0f09'; g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2); } }
      for (let k = 0; k < 5; k++) { g.fillStyle = pick(['#ff7030', '#c04020', '#ffb050']); g.fillRect((cx + randi(-r, r)) & ~1, (cy + randi(-r / 2, r / 2)) & ~1, 2, 2); }
    }
    for (let i = 0; i < 5 * area; i++) { let x = randi(A.x0 + 30, A.x1 - 30), y = randi(A.y0 + 20, A.y1 - 20); const a = rand(0, TAU); for (let k = 0; k < 6; k++) { if (!decFree(x, y, 6)) { x += Math.cos(a) * 14; y += Math.sin(a) * 10; continue; } g.fillStyle = 'rgba(14,8,5,.55)'; g.fillRect((x + (k % 2) * 6) & ~1, y & ~1, 4, 2); x += Math.cos(a) * 14; y += Math.sin(a) * 10; } }
    if (R.type === 'boss') paintArenaFloor(g);
    // 핏자국 (v0.84): 마른 핏물 웅덩이와 흩뿌린 방울, 무언가를 끌고 간 핏줄기
    const BL = ['#2e0806', '#4a0c08', '#6a1410'];
    for (let i = 0; i < (ring ? 7 : 5) * area + 2; i++) {
      const cx = randi(A.x0 + 30, A.x1 - 30), cy = randi(A.y0 + 24, A.y1 - 24), r = randi(5, 12); if (!decFree(cx, cy, r * 1.8, true)) continue;
      for (let y = -r; y <= r; y += 2) for (let x = -r * 1.6; x <= r * 1.6; x += 2) { const e = Math.hypot(x / 1.6, y) / r + Math.sin(x * 0.7 + y) * 0.12; if (e < 1 && dith((cx + x) >> 1, (cy + y) >> 1, 1.15 - e)) { g.fillStyle = BL[e < 0.45 ? 0 : e < 0.75 ? 1 : 2]; g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2); } }
      for (let k = 0; k < 7; k++) { const a = rand(0, TAU), d = rand(r * 1.1, r * 2.4); g.fillStyle = BL[randi(1, 2)]; g.fillRect((cx + Math.cos(a) * d * 1.5) & ~1, (cy + Math.sin(a) * d * 0.7) & ~1, 2, 2); }
      if (Math.random() < 0.45) { let x = cx, y = cy; const a = rand(0, TAU), L = randi(30, 80); for (let k = 0; k < L; k += 2) { x += Math.cos(a + Math.sin(k * 0.08) * 0.4) * 2; y += Math.sin(a + Math.sin(k * 0.08) * 0.4) * 1.2; if (!inA(x, y) || !decFree(x, y, 4)) break; if (dith(k >> 1, 0, 1 - k / L)) { g.fillStyle = BL[1]; g.fillRect(x & ~1, y & ~1, 2, 2); g.fillRect((x + 4) & ~1, (y + 2) & ~1, 2, 2); } } }
    }
    // 바깥: 어두운 둔덕과 돌
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      if (x >= A.x0 && x < A.x1 && y >= A.y0 - 2 && y < A.y1) continue;
      const dd = Math.max(A.x0 - x, x - A.x1, y - A.y1, 0);
      if (y < A.y0) continue;
      g.fillStyle = dd < 10 && dith(x >> 1, y >> 1, 1 - dd / 10) ? '#24150d' : (x + y) % 14 === 0 ? '#1a100a' : '#120b07'; g.fillRect(x, y, 2, 2);
    }
  }
  // ---- v0.84 투기장 (보스방): 위쪽은 3단 관람석 + 낮은 말뚝 방책 + 맹수 우리 철문, 바닥은 피로 그린 부족 문장과 뼈 테두리
  const ARENA_TIERS = () => [A.y0 - 104, A.y0 - 86, A.y0 - 68];
  function paintArenaWall(g, R) {
    const T = ARENA_TIERS(), bar = A.y0 - 40;
    for (let y = 0; y < A.y0; y += 2) for (let x = 0; x < W; x += 2) { const k = clamp((y - (T[0] - 60)) / 90, 0, 1); g.fillStyle = dith(x >> 1, y >> 1, k * 0.6) ? '#2a0c08' : '#120604'; g.fillRect(x, y, 2, 2); }
    // v2.40 관람석 제거 → 협곡 암벽: 층층이 깎인 바위 띠와 균열 (관중 없음)
    for (let y = (T[0] - 20) & ~1; y < bar; y += 2) for (let x = (A.x0 - 60) & ~1; x < A.x1 + 60; x += 2) {
      const band = ((y - T[0] + 20) / 22) | 0, ly = (y - T[0] + 20) % 22, n = (x * 7 + band * 13 + ((x >> 3) * 5 % 11)) % 29;
      g.fillStyle = ly < 2 ? '#3a2416' : ly < 4 ? '#2a190f' : n === 0 ? '#0a0604' : dith(x >> 1, y >> 1, 0.25 + ly / 60) ? '#1e120a' : '#160d07'; g.fillRect(x, y, 2, 2); }
    for (let i = 0; i < 26; i++) { let x = randi(A.x0 - 50, A.x1 + 50) & ~1, y = randi(T[0] - 16, bar - 10) & ~1; g.fillStyle = '#080503'; for (let k = 0; k < randi(4, 9); k++) { g.fillRect(x, y, 2, 2); x += randi(-1, 1) * 2; y += 2; } }
    // 방책: 낮은 말뚝, 핏자국, 밧줄, 꽂힌 해골
    const LW = 10;
    for (let x = (A.x0 - 60) & ~1; x < A.x1 + 60; x += LW) {
      const tip = bar + randi(-2, 2) * 2, base = A.y0 + 2;
      for (let y = tip; y < base; y += 2) for (let c = 0; c < LW - 2; c += 2) { const tY = tip + Math.abs(c - (LW - 4) / 2) * 2; if (y < tY) continue; g.fillStyle = c === 0 ? '#9a6a40' : c <= 2 ? '#7a5030' : c <= 4 ? '#553620' : '#33200f'; g.fillRect(x + c, y, 2, 2); }
      g.fillStyle = '#060403'; g.fillRect(x + LW - 2, tip + 4, 2, base - tip - 4);
      if (Math.random() < 0.3) { g.fillStyle = '#5e1612'; const sy = tip + randi(8, 20); for (let k = 0; k < randi(6, 16); k += 2) g.fillRect(x + 2, sy + k, 2, 2); g.fillStyle = '#9a2a24'; g.fillRect(x + 2, sy, 2, 4); }
      if (Math.random() < 0.12) gPaint(g, fromRows(ORC_WALL_MAPS.skull), WOODPAL, x - 2, tip - 12);
    }
    for (const by of [bar + 14, bar + 32]) { g.fillStyle = '#1e140c'; g.fillRect(A.x0 - 60, by, A.x1 - A.x0 + 120, 4); for (let x = A.x0 - 60; x < A.x1 + 60; x += 6) { g.fillStyle = (x / 6 | 0) % 2 ? '#8a7038' : '#5a4428'; g.fillRect(x & ~1, by, 4, 2); } }
    // 걸린 부족 깃발
    for (let i = 0; i < 6; i++) { const mx = Math.round((A.x0 + (i + 0.5) * (A.x1 - A.x0) / 6) / 2) * 2; if (Math.abs(mx - DOOR.n.x) < 90) continue; gPaint(g, fromRows(ORC_WALL_MAPS.banner), WOODPAL, mx - 9, bar + 8); }
    // 맹수 우리 철문 (북쪽 가운데): 어두운 굴 + 쇠창살 + 위에 큰 뿔 해골
    const gx = DOOR.n.x;
    for (let y = bar - 30; y < A.y0 + 2; y += 2) for (let x = gx - 34; x < gx + 34; x += 2) { const k = (y - (bar - 30)) / (A.y0 - bar + 32); g.fillStyle = dith(x >> 1, y >> 1, k * 0.35) ? '#1a0a06' : '#050202'; g.fillRect(x, y, 2, 2); }
    for (let x = gx - 32; x <= gx + 30; x += 8) { g.fillStyle = '#0b0806'; g.fillRect(x - 2, bar - 30, 6, A.y0 - bar + 32); g.fillStyle = '#6a6a74'; g.fillRect(x, bar - 30, 2, A.y0 - bar + 30); g.fillStyle = '#9a9aa4'; g.fillRect(x, bar - 30, 2, 4); }
    for (const yy of [bar - 18, bar + 10]) { g.fillStyle = '#0b0806'; g.fillRect(gx - 36, yy - 2, 72, 6); g.fillStyle = '#4a4a54'; g.fillRect(gx - 34, yy, 68, 2); }
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) { const px = gx + s * (40 + k * 2); g.fillStyle = '#0b0806'; g.fillRect(px - 4, bar - 40 - k * 2, 8, A.y0 - bar + 42 + k * 2); }
    for (const s of [-1, 1]) { g.fillStyle = '#7a5030'; g.fillRect(gx + s * 40 - 2, bar - 40, 4, A.y0 - bar + 40); }
    const SK = ['....kkkkkkk....', '..kkwwwwwwwkk..', '.kwwwwwwwwwwWk.', 'kwwkkkwwwkkkwWk', 'kwkrrkwwwkrrkWk', 'kwwkkkwkwkkkwWk', '.kwwwwkkkwwwWk.', 'w.kwkwkwkwkWk.w', 'Wk.kkkkkkkkk.kW', '.Wk.........kW.'];
    gPaint(g, fromRows(SK), WOODPAL, gx - 15, bar - 60);
    const horn = fromRows(['w......', 'Wk.....', '.Wk....', '..WWk..', '...kWWk']);
    gPaint(g, horn, WOODPAL, gx - 30, bar - 66); gPaint(g, horn.map(r => r.slice().reverse()), WOODPAL, gx + 16, bar - 66);
    g.fillStyle = '#0e0905'; g.fillRect(A.x0 - 60, A.y0 - 2, A.x1 - A.x0 + 120, 4);
  }
  // 투기장 바닥 장식: 모래판 가장자리를 두른 뼈·해골, 가운데 피로 그린 엄니 해골 문장
  function paintArenaFloor(g) {
    const rx = (A.x1 - A.x0) * 0.4, ry = (A.y1 - A.y0) * 0.38;
    // 모래판 가장자리로 밀려난 뼈 (v0.85): 고른 간격 대신 군데군데 뭉친 무더기와 빈 구간, 바깥쪽으로 흩어짐, 방향·모양 제각각
    const bone = (x, y, kind) => { x &= ~1; y &= ~1; const B = (xx, yy, w, h, c) => { g.fillStyle = c; g.fillRect(x + xx, y + yy, w, h); };
      if (kind === 0) { B(-2, -2, 12, 6, '#0b0806'); B(0, 0, 8, 2, '#d8cfbc'); B(-2, -2, 2, 2, '#d8cfbc'); B(8, 2, 2, 2, '#a8a090'); } // 가로 뼈
      else if (kind === 1) { B(-2, -2, 6, 12, '#0b0806'); B(0, 0, 2, 8, '#d8cfbc'); B(-2, -2, 2, 2, '#d8cfbc'); B(2, 8, 2, 2, '#a8a090'); } // 세로 뼈
      else if (kind === 2) { for (let k = 0; k < 4; k++) B(k * 2 - 2, k * 2 - 2, 6, 6, '#0b0806'); for (let k = 0; k < 4; k++) B(k * 2, k * 2, 2, 2, k === 3 ? '#a8a090' : '#d8cfbc'); } // 비스듬한 뼈
      else if (kind === 3) { B(-4, -4, 12, 10, '#0b0806'); B(-2, -2, 8, 4, '#d8cfbc'); B(0, 0, 2, 2, '#0b0806'); B(4, 0, 2, 2, '#0b0806'); B(-2, 2, 8, 2, '#a8a090'); } // 해골
      else if (kind === 4) { B(-2, -2, 14, 8, '#0b0806'); for (let k = 0; k < 5; k++) B(k * 2, 0, 2, k % 2 ? 4 : 2, '#b8ac90'); } // 갈비 조각
      else { B(-1, -1, 4, 4, '#0b0806'); B(0, 0, 2, 2, '#b8ac90'); } }; // 부스러기
    const nC = randi(9, 13);
    for (let c = 0; c < nC; c++) {
      const t0 = rand(0, TAU), n = randi(3, 11), spread = rand(0.08, 0.22);
      for (let i = 0; i < n; i++) { const t = t0 + rand(-spread, spread), out = 1 + Math.abs(rand(-0.06, 0.1)) * (Math.random() < 0.7 ? 1 : -0.4), x = CX + Math.cos(t) * rx * out + rand(-6, 6), y = CY + Math.sin(t) * ry * out + rand(-4, 4);
        bone(x, y, Math.random() < 0.12 ? 3 : Math.random() < 0.1 ? 4 : Math.random() < 0.3 ? 5 : randi(0, 2)); }
    }
    for (let i = 0; i < 26; i++) { const t = rand(0, TAU), out = rand(0.92, 1.25); bone(CX + Math.cos(t) * rx * out, CY + Math.sin(t) * ry * out, Math.random() < 0.4 ? 5 : randi(0, 2)); } // 외따로 흩어진 뼈
    // 문장: 피로 그린 엄니 해골 + 엇갈린 도끼 (6px 붓질, 가장자리 디더, 흘러내린 핏방울)
    const S6 = 6, GW = 36, GH = 26, em = (i, j) => { // 1=칠 0=비움
      const x = i - GW / 2 + 0.5, y = j - 11;
      const skull = Math.hypot(x / 8.5, (y + 1) / 7.5) < 1 || (y >= 4 && y <= 9 && Math.abs(x) <= 6 - (y - 4) * 0.4);
      const eye = Math.hypot((Math.abs(x) - 3.6) / 2.4, (y + 0.5) / 2.1) < 1, nose = y >= 2.5 && y <= 4.5 && Math.abs(x) <= (y - 2) * 0.7, teeth = y >= 7 && y <= 8 && Math.abs(x) <= 4.5 && (Math.round(x + 10) % 2 === 0);
      const tusk = (s) => { const tx = x * s; for (let k = 0; k <= 1; k += 0.05) { const cx = 6 + k * 5 + Math.sin(k * 2.2) * 2, cy = 8 - k * 15, w = 1.6 * (1 - k) + 0.4; if (Math.hypot(tx - cx, y - cy) < w) return true; } return false; };
      const axe = (s) => { const ax = x * s; const t = (ax + y) / 2, d = Math.abs(ax - y) / 1.41; if (d < 0.8 && t > -14 && t < 12) return true; const hx = ax + 12, hy = y + 12; return hx > -6 && hx < 1 && hy > -1 && hy < 7 && Math.hypot(hx + 1, hy - 3) < 5.5; };
      if (skull && !eye && !nose && !teeth) return 1; if (tusk(1) || tusk(-1)) return 1; if (!skull && (axe(1) || axe(-1))) return 1; return 0; };
    const ox = CX - GW * S6 / 2, oy = CY - 86;
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { if (!em(i, j)) continue; const edge = !em(i - 1, j) || !em(i + 1, j) || !em(i, j - 1) || !em(i, j + 1);
      for (let a = 0; a < S6; a += 2) for (let bb = 0; bb < S6; bb += 2) { const x = (ox + i * S6 + a) & ~1, y = (oy + j * S6 + bb) & ~1; if (dith(x >> 1, y >> 1, edge ? 0.6 : 0.95)) { g.fillStyle = edge ? '#4a0a06' : ((x * 3 + y * 5) >> 1) % 9 === 0 ? '#5a100c' : '#7a1810'; g.fillRect(x, y, 2, 2); } }
      if (!em(i, j + 1) && Math.random() < 0.25) { const L = randi(2, 7) * 2; for (let k = 0; k < L; k += 2) { g.fillStyle = k > L - 4 ? '#4a0a06' : '#6a140e'; g.fillRect((ox + i * S6 + 2) & ~1, (oy + (j + 1) * S6 + k) & ~1, 2, 2); } } }
    for (let i = 0; i < 90; i++) { g.fillStyle = pick(['#4a0c08', '#7a1810']); g.fillRect((CX + rand(-120, 120)) & ~1, (CY + rand(-80, 70)) & ~1, 2, 2); }
  }
  // 위쪽 벽: 끝을 깎은 통나무 말뚝 울타리 + 가죽·해골·깃발 장식
  function paintOrcWall(g, R) {
    if (R.type === 'boss') return paintArenaWall(g, R);
    const top = A.y0 - 84;
    for (let y = 0; y < A.y0; y += 2) for (let x = 0; x < W; x += 2) { const k = clamp((y - (top - 40)) / 60, 0, 1); g.fillStyle = dith(x >> 1, y >> 1, k * 0.7) ? '#2a0e08' : '#140806'; g.fillRect(x, y, 2, 2); }
    // 하늘 연기 띠
    for (let i = 0; i < 40; i++) { const x = randi(0, W) & ~1, y = randi(top - 30, top + 20) & ~1; g.fillStyle = 'rgba(80,30,20,.35)'; g.fillRect(x, y, randi(6, 20) & ~1, 2); }
    const LW = 12;
    for (let x = (A.x0 - 40) & ~1; x < A.x1 + 40; x += LW) {
      const tip = top + randi(-3, 3) * 2, base = A.y0 + 2;
      for (let y = tip; y < base; y += 2) for (let c = 0; c < LW - 2; c += 2) {
        const tY = tip + Math.abs(c - (LW - 4) / 2) * 2; if (y < tY) continue;
        let col = c === 0 ? '#9a6a40' : c <= 4 ? '#7a5030' : c <= 6 ? '#553620' : '#33200f';
        if (y < tY + 6 && c <= 4) col = c === 0 ? '#d8b080' : '#c8a070'; // v2.82 깎은 끝은 밝은 나무 속
        else if (c === 2 && ((y - tip) >> 1) % 7 === 3) col = '#553620'; else if (c === 4 && ((y - tip + 6) >> 1) % 9 === 2) col = '#3a2414'; // 껍질 결
        g.fillStyle = (y - tip) % 22 === 20 && c > 0 ? '#2a180c' : col; g.fillRect(x + c, y, 2, 2);
      }
      g.fillStyle = '#060403'; g.fillRect(x + LW - 2, tip + 6, 2, base - tip - 6);
    }
    for (const by of [top + 24, A.y0 - 26]) { g.fillStyle = '#1e140c'; g.fillRect(A.x0 - 40, by, A.x1 - A.x0 + 80, 6); g.fillStyle = '#5a4428'; g.fillRect(A.x0 - 40, by, A.x1 - A.x0 + 80, 2); for (let x = A.x0 - 40; x < A.x1 + 40; x += 12) { g.fillStyle = '#3a2a18'; g.fillRect(x + 4, by + 2, 2, 4); } }
    g.fillStyle = '#0e0905'; g.fillRect(A.x0 - 40, A.y0 - 2, A.x1 - A.x0 + 80, 4);
    // 장식
    const deco = ROOMSTYLE.wall || [];
    const n = Math.max(2, Math.floor((A.x1 - A.x0) / 120));
    for (let i = 0; i < n; i++) {
      const k = deco[i % deco.length], mx = Math.round((A.x0 + (i + 0.5) * (A.x1 - A.x0) / n) / 2) * 2;
      if (!k || k === 'none' || Math.abs(mx - DOOR.n.x) < 44) continue;
      const m = ORC_WALL_MAPS[k], grid = fromRows(m), w = grid[0].length * 2, h = grid.length * 2;
      if (typeof OCC !== 'undefined' && !OCC.wall(mx - w / 2, (k === 'skull' ? top - 6 : k === 'spikes' ? A.y0 - 22 : top + 30) + (k === 'banner' ? -4 : 0), w, h)) continue; // v2.85
      gPaint(g, grid, WOODPAL, mx - w / 2, (k === 'skull' ? top - 6 : k === 'spikes' ? A.y0 - 22 : top + 30) + (k === 'banner' ? -4 : 0));
    }
  }
  const ORC_WALL_MAPS = {
    hide: ['k.........k', 'kbkkkkkkkbk', '.kbbbbbbbk.', '.kbBbbbBbk.', '.kbbbwbbbk.', '.kbbwkwbbk.', '.kbbbwbbbk.', '.kbBbbbBbk.', '.kbbbbbbbk.', 'kbkkkkkkkbk', 'k.........k'],
    skull: ['.kkkkk.', 'kwwwwWk', 'kwkwkWk', 'kwwwwWk', '.kwkwk.', '..kok..', '..kok..'],
    banner: ['kkkkkkkkk', 'koooooook', '.krrrrrk.', '.krrwrrk.', '.krwwwrk.', '.krrwrrk.', '.krwrwrk.', '.krrrrrk.', '.kRrRrRk.', '.k.k.k.k.'],
    spikes: ['w...w...w', 'Wk.kWk.kW', '.kWk.kWk.', '..kWkWk..', '...kkk...'],
  };
  // 북쪽 문: 굵은 통나무 기둥 두 개와 뿔 달린 가로대 / 다른 문: 흙바닥 출구 + 말뚝
  function paintDoorOrc(g, d) {
    const p = DOOR[d];
    if (d === 'n') {
      for (let y = A.y0 - 70; y < A.y0 + 2; y += 2) for (let x = p.x - 22; x < p.x + 22; x += 2) { const k = (y - (A.y0 - 70)) / 72; g.fillStyle = dith(x >> 1, y >> 1, k * 0.5) ? '#160c08' : '#060302'; g.fillRect(x, y, 2, 2); }
      const post = mkGrid(9, 46); for (let y = 1; y < 45; y++) for (let x = 1; x < 8; x++) post[y][x] = (y % 9 === 8) ? 'D' : x <= 2 ? 'h' : x <= 4 ? 'l' : x <= 6 ? 'd' : 'D';
      const po = gOutline(post); gPaint(g, po, WOODPAL, p.x - 34, A.y0 - 88); gPaint(g, po, WOODPAL, p.x + 18, A.y0 - 88);
      const beam = mkGrid(40, 6); for (let x = 1; x < 39; x++) for (let y = 1; y < 5; y++) beam[y][x] = y === 1 ? 'h' : y === 4 ? 'D' : x % 7 ? 'l' : 'd';
      beam[1][2] = beam[2][1] = 'w'; beam[1][37] = beam[2][38] = 'w';
      gPaint(g, gOutline(beam), WOODPAL, p.x - 40, A.y0 - 82);
      const sk = fromRows(ORC_WALL_MAPS.skull); gPaint(g, sk, WOODPAL, p.x - 7, A.y0 - 96);
      const horn = fromRows(['w......', 'Wk.....', '.Wk....', '..WWk..', '...kWWk']);
      gPaint(g, horn, WOODPAL, p.x - 48, A.y0 - 94); gPaint(g, horn.map(r => r.slice().reverse()), WOODPAL, p.x + 34, A.y0 - 94);
      return;
    }
    if (d === 's') { gPaint(g, genFloorExit(20, 36, 's'), WOODPAL, p.x - 20, p.y); gPaint(g, genDoorPost(16), WOODPAL, p.x - 30, p.y - 6); gPaint(g, genDoorPost(16), WOODPAL, p.x + 20, p.y - 6); return; }
    gPaint(g, genSideGate(d, true), WOODPAL, d === 'w' ? p.x - 80 : p.x, p.y - 28); // v2.21
  }
  // 토템: 얼굴을 깎아 쌓은 통나무, 꼭대기에 뿔
  function genTotem() {
    const Hc = randi(24, 30), W0 = 15, g = mkGrid(W0, Hc + 2), col = x => x <= 4 ? 'h' : x <= 7 ? 'l' : x <= 10 ? 'd' : 'D';
    for (let y = 4; y <= Hc; y++) for (let x = 3; x <= W0 - 4; x++) g[y][x] = col(x);
    const seg = randi(6, 8);
    for (let s = 0; (s + 1) * seg + 4 <= Hc; s++) {
      const y0 = 4 + s * seg;
      for (let x = 3; x <= W0 - 4; x++) g[y0][x] = 'D';
      g[y0 + 2][5] = 'K'; g[y0 + 2][9] = 'K'; g[y0 + 3][5] = 'r'; g[y0 + 3][9] = 'r';
      for (let x = 5; x <= 9; x++) g[y0 + seg - 2][x] = s % 2 ? 'w' : 'K';
      if (s % 2 === 0) { g[y0 + 1][2] = 'o'; g[y0 + 1][W0 - 3] = 'o'; g[y0 + 2][1] = 'o'; g[y0 + 2][W0 - 2] = 'O'; }
    }
    for (let x = 4; x <= W0 - 5; x++) g[3][x] = 'l';
    g[2][3] = 'w'; g[1][2] = 'w'; g[2][W0 - 4] = 'W'; g[1][W0 - 3] = 'w'; g[2][7] = 'r'; g[1][7] = 'y';
    for (let x = 2; x <= W0 - 3; x++) { g[Hc][x] = x % 2 ? 'm' : 'M'; g[Hc - 1][x] = g[Hc - 1][x] === '.' ? 'M' : g[Hc - 1][x]; }
    return gOutline(g);
  }
  // 말뚝 우리 (v0.84): 둘레는 끝을 깎은 말뚝 울타리, 안쪽은 종류별로 채운다 — 뼈 무더기 / 부서진 무기 더미 / 도살장 / 맹수 우리
  const PEN_PAL = Object.assign({}, WOODPAL, { S: '#7a6e5c', u: '#22140c', U: '#2e1c10', v: '#3a0c08', x: '#6a3418', X: '#4a2410', g: '#808088', G: '#4a4a54', n: '#d8d8e0', p: '#f4ecdc', q: '#c03a2a' });
  function genPalisade(wc, hc, kind) {
    kind = kind || pick(['bones', 'scrap', 'meat']); // v1.20 맹수 우리(짚더미 둥지)는 무작위 배치에서 뺌
    const HH = 14, W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0), set = (x, y, c) => { if (x >= 1 && x <= wc && y >= 1 && y < H0 - 1) g[y][x] = c; }, get = (x, y) => (g[y] && g[y][x]) || '.';
    const ix0 = 3, ix1 = wc - 2, iy0 = 5, iy1 = hc;
    // 1) 안쪽 바닥: 낮은 주파수 얼룩만 (잔노이즈 없이)
    const base = kind === 'meat' ? ['u', 'v'] : kind === 'scrap' ? ['u', 'X'] : kind === 'beast' ? ['U', 'u'] : ['u', 'U'], ph = rand(0, 6);
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) { const v = 0.5 + 0.25 * Math.sin(x * 0.35 + ph) + 0.25 * Math.cos(y * 0.5 + x * 0.12); g[y][x] = dith(x, y, v * 0.6) ? base[1] : base[0]; if (y <= iy0 + 1 && dith(x, y, (iy0 + 2 - y) / 3)) g[y][x] = 'K'; }
    // 2) 내용물: 가운데 둔덕(타원) 안에 엇갈린 격자로 물건을 촘촘히 쌓고, 둔덕 오른쪽 아래는 한 단계 어둡게 → 쌓인 더미로 읽히게
    const r = (a, b) => randi(a, b), cx = (ix0 + ix1) / 2, cy = (iy0 + iy1) / 2 + 0.5, hx = Math.max(3, (ix1 - ix0) / 2 - 1), hy = Math.max(2, (iy1 - iy0) / 2);
    const inHeap = (x, y, s = 1) => Math.hypot((x - cx) / (hx * s), (y - cy) / (hy * s)) < 1;
    const stamp = (rows, x0, y0, shadow = true) => rows.forEach((rw, j) => [...rw].forEach((c, i) => { const x = x0 + i, y = y0 + j; if (c === '.' || x < ix0 || x > ix1 || y < iy0 || y > iy1) return; set(x, y, c); }));
    const heap = (cells, stepX, stepY, fill) => {
      for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) if (inHeap(x, y, 1.05) && !(Math.hypot((x - cx) / hx, (y - cy) / hy) > 0.9 && dith(x, y, 0.5))) set(x, y, fill);
      for (let y = iy0 - 1; y <= iy1; y += stepY) for (let x = ix0 - 2 + ((y / stepY | 0) % 2) * (stepX >> 1); x <= ix1; x += stepX) if (inHeap(x + 1, y + 1, 0.95)) stamp(pick(cells), x + r(0, 1), y);
    };
    const DARK = { p: 'w', w: 'W', W: 'S', n: 'g', g: 'G', G: 'K', r: 'R', q: 'r', y: 's', s: 'o', o: 'O', h: 'l', l: 'd' };
    const shade = () => { for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) if (inHeap(x, y, 1.05)) { const t = (x - cx) / hx * 0.6 + (y - cy) / hy * 0.8; if (t > 0.35 && DARK[get(x, y)] && !(t < 0.6 && dith(x, y, 0.5))) set(x, y, DARK[get(x, y)]); } };
    const SKULL = ['.ppw.', 'pKwKW', '.wWW.', '..W..'], SKULL2 = ['.pw.', 'KwKW', '.WW.'];
    const BONES = [['pwwwW', 'w...W'], ['pwwW'], ['p..', '.w.', '..W'], ['..p', '.w.', 'W..'], ['pW', '.w', '.W'], ['pp.', '.ww', '..W']];
    const scatter = (n, cells) => { for (let i = 0; i < n; i++) { const x = r(ix0, ix1 - 3), y = r(iy0, iy1 - 2); if (!inHeap(x + 1, y + 1, 1.1)) stamp(pick(cells), x, y); } };
    const area = Math.max(1, (ix1 - ix0) * (iy1 - iy0));
    if (kind === 'bones') { // v1.03: 뼈 하나하나가 읽히게 — 뼈마다 어두운 테두리, 큰 해골은 눈구멍·코·이빨, 갈비뼈, 둔덕 오른쪽 아래 그늘
      for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) { const q = Math.hypot((x - cx) / (hx * 1.08), (y - cy) / (hy * 1.08)); if (q < 1 && !(q > 0.85 && dith(x, y, 0.5))) set(x, y, q > 0.7 ? 'U' : 'K'); }
      const BN = { long: ['pp...wp', 'wwwwwwW', 'WW...WW'], short: ['pp.wp', 'wwwwW', 'WW.WW'], d1: ['pp...', 'pww..', '.wwW.', '..wWW', '...WW'], d2: ['...wp', '..wwp', '.wwW.', 'WwW..', 'WW...'],
        rib: ['..pwW..', '.w.w.W.', 'w..w..W', '.w.w.W.', '..wWW..'], skull: ['.ppwww.', 'ppwwwwW', 'pKKwKKW', 'wKKwKKW', '.wwKwW.', '.WwWwW.'], skull2: ['.pww.', 'pwwwW', 'wKwKW', '.wKW.', '.WWW.'] };
      const stampO = (rows, x0, y0) => { // 테두리(K) 먼저, 그 위에 뼈
        rows.forEach((rw, j) => [...rw].forEach((c, i) => { if (c === '.') return; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = x0 + i + dx, y = y0 + j + dy; if (x >= ix0 && x <= ix1 && y >= iy0 && y <= iy1 && inHeap(x, y, 1.08)) { const r2 = rows[j + dy], c2 = r2 && r2[i + dx]; if (!c2 || c2 === '.') set(x, y, 'K'); } } }));
        rows.forEach((rw, j) => [...rw].forEach((c, i) => { const x = x0 + i, y = y0 + j; if (c !== '.' && x >= ix0 && x <= ix1 && y >= iy0 && y <= iy1) set(x, y, c); })); };
      const pool = [BN.long, BN.long, BN.short, BN.d1, BN.d2, BN.rib, BN.skull2];
      for (let y = Math.round(iy0 + 1); y <= iy1 - 2; y += 3) for (let x = ix0 - 1 + ((y >> 1) % 2) * 4; x <= ix1 - 3; x += 7 + randi(-1, 1)) { const pc = pick(pool); if (inHeap(x + pc[0].length / 2, y + pc.length / 2, 0.92)) stampO(pc, x, y); }
      shade();
      const nS = Math.max(1, Math.round(area / 140)); for (let i = 0; i < nS; i++) stampO(Math.random() < 0.7 ? BN.skull : BN.skull2, Math.round(cx + rand(-hx * 0.55, hx * 0.35)) - 3, Math.round(cy + rand(-hy * 0.55, hy * 0.05)) - 3);
      for (let i = 0; i < area / 120; i++) { const x = r(ix0, ix1 - 6), y = r(iy0, iy1 - 2); if (!inHeap(x + 2, y + 1, 1.1)) stampO(pick([BN.short, BN.d1, BN.d2]), x, y); }
    } else if (kind === 'scrap' || kind === 'meat') { // v1.64: 뼈 무더기와 같은 방식 — 물건마다 어두운 테두리, 엇갈린 격자로 쌓고 둔덕 오른쪽 아래 그늘, 큰 물건은 맨 위에
      const stampK = (rows, x0, y0) => { // 테두리(K) 먼저, 그 위에 물건
        rows.forEach((rw, j) => [...rw].forEach((c, i) => { if (c === '.') return; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = x0 + i + dx, y = y0 + j + dy; if (x >= ix0 && x <= ix1 && y >= iy0 && y <= iy1 && inHeap(x, y, 1.12)) { const cc = rows[j + dy] && rows[j + dy][i + dx]; if (!cc || cc === '.') set(x, y, 'K'); } } }));
        rows.forEach((rw, j) => [...rw].forEach((c, i) => { const x = x0 + i, y = y0 + j; if (c !== '.' && x >= ix0 && x <= ix1 && y >= iy0 && y <= iy1) set(x, y, c); })); };
      const disc = (sx, sy, R0, fn) => { for (let y = -R0 - 1; y <= R0 + 1; y++) for (let x = -R0 - 1; x <= R0 + 1; x++) { const d = Math.hypot(x, y * 1.15); if (d <= R0 + 1.2 && d > R0 + 0.3) set(sx + x, sy + y, 'K'); else if (d <= R0 + 0.3) set(sx + x, sy + y, fn(x, y, d)); } };
      if (kind === 'scrap') { // 부서진 무기 더미: 부러진 칼, 도끼머리, 뿔 투구, 창날, 둥근 방패
        for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) { const q = Math.hypot((x - cx) / (hx * 1.0), (y - cy) / (hy * 1.0)); if (q < 1 && dith(x, y, 0.75 - q * 0.6)) set(x, y, q > 0.6 ? 'X' : 'U'); }
        const SC = { sword: ['.o.nnnnnn', 'ddoggggggn', '.o.GGGGGG.'], sword2: ['nnnnnn.o.', 'ggggggodd', 'GGGGG..o.'], axe: ['.nng.', 'nngGG', 'ngGGd', 'nngGG', '.nGG.'],
          helm: ['w.....W', 'wnnnggW', '.ngggG.', '.gKgKG.', '.GGGGG.'], spear: ['...n', '..ng', 'dngG', '.dG.'], rust: ['xxxX', 'xXXX'], arrow: ['pW.....n', '.ddddddg'] };
        const pool = [SC.sword, SC.sword2, SC.axe, SC.spear, SC.rust, SC.sword, SC.arrow];
        for (let y = Math.round(iy0 + 1); y <= iy1 - 2; y += 5) for (let x = ix0 + ((y >> 1) % 2) * 6; x <= ix1 - 3; x += 13 + randi(-2, 2)) { const pc = pick(pool); if (Math.random() < 0.8 && inHeap(x + pc[0].length / 2, y + pc.length / 2, 0.85)) stampK(pc, x, y); } // v1.64 듬성듬성
        shade();
        const nB = Math.max(1, Math.round(area / 320)); // 방패·투구는 맨 위
        for (let i = 0; i < nB; i++) { const sx = Math.round(cx + rand(-hx * 0.5, hx * 0.4)), sy = Math.round(cy + rand(-hy * 0.4, hy * 0.1)), R0 = area > 600 ? 4 : 3, stripe = Math.random() < 0.5;
          disc(sx, sy, R0, (x, y, d) => d > R0 - 0.8 ? (x + y < 0 ? 'g' : 'G') : d < 1.2 ? (x + y < 0 ? 'n' : 'g') : stripe && Math.abs(x) < 1 ? 'r' : (x + y < -1 ? 'h' : x + y < 2 ? 'l' : 'd')); }
        for (let i = 0; i < Math.max(1, Math.round(area / 420)); i++) stampK(SC.helm, Math.round(cx + rand(-hx * 0.6, hx * 0.3)) - 3, Math.round(cy + rand(-hy * 0.6, 0)) - 2);
        for (let i = 0; i < area / 300; i++) { const x = r(ix0, ix1 - 6), y = r(iy0, iy1 - 2); if (!inHeap(x + 2, y + 1, 1.1)) stampK(pick([SC.spear, SC.arrow, SC.rust]), x, y); }
      } else { // 도살장: 핏물 웅덩이, 고깃덩이·뼈 붙은 넓적다리·갈비짝 더미, 맨 위 도마와 박힌 식칼
        for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) { const d = Math.hypot((x - cx) / (hx * 1.3), (y - cy) / (hy * 1.3)); if (d < 1 && dith(x, y, 1.4 - d)) set(x, y, d < 0.6 ? 'R' : 'v'); }
        const MT = { ham: ['.rqqr...', 'rqqrrRpw', 'rrrrRR.p', '.RRRR...'], ham2: ['...rqqr.', 'wprrqrrR', 'p.RRrrrR', '...RRRR.'], chunk: ['.qqr.', 'qprrR', 'rrrRR', '.RRR.'],
          ribs: ['p.p.p.p', 'w.w.w.w', 'rqrrrrR', 'RRRRRRR'], fat: ['.pqr', 'pqrR', 'rRR.'], bone: ['pp.wp', 'wwwwW', 'WW.WW'] };
        const pool = [MT.ham, MT.ham2, MT.chunk, MT.chunk, MT.fat, MT.ribs, MT.bone];
        for (let y = Math.round(iy0 + 1); y <= iy1 - 2; y += 5) for (let x = ix0 + ((y >> 1) % 2) * 6; x <= ix1 - 3; x += 12 + randi(-2, 2)) { const pc = pick(pool); if (Math.random() < 0.8 && inHeap(x + pc[0].length / 2, y + pc.length / 2, 0.85)) stampK(pc, x, y); } // v1.64 듬성듬성
        shade();
        // 맨 위: 나무 도마(둥근 그루터기)와 박힌 식칼
        const bx = Math.round(cx + rand(-hx * 0.3, hx * 0.2)), by = Math.round(cy + rand(-hy * 0.3, 0)), R0 = area > 600 ? 4 : 3;
        disc(bx, by, R0, (x, y, d) => d > R0 - 0.8 ? (x + y < 0 ? 'l' : 'd') : (Math.round(d) % 2 ? 'h' : 's'));
        stampK(['nnnng', 'nggGG', 'ngGGG', '..ld.', '..dD.'], bx - 1, by - R0 - 3);
        for (let i = 0; i < Math.max(0, Math.round(area / 450)); i++) stampK(MT.ribs, Math.round(cx + rand(-hx * 0.7, hx * 0.2)) - 3, Math.round(cy + rand(-hy * 0.2, hy * 0.4)) - 2);
        for (let i = 0; i < area / 260; i++) { const x = r(ix0, ix1 - 4), y = r(iy0, iy1 - 2); if (!inHeap(x + 2, y + 1, 1.1)) { if (Math.random() < 0.5) stampK(pick([MT.bone, MT.chunk]), x, y); else { set(x, y, 'q'); set(x + 1, y, 'R'); } } }
      }
    } else { // 맹수 우리: 짚더미 둥지, 그 위 갉아먹힌 뼈, 바닥을 기는 사슬, 발톱 자국
      heap([['yys'], ['ysy'], ['syo'], ['yyo'], ['ys']], 3, 1, 'o'); shade();
      for (let i = 0; i < 2; i++) { let x = ix0, y = r(iy0, iy1); for (let k = 0; x <= ix1; k++) { if (!inHeap(x, y, 0.9)) set(x, y, k % 2 ? 'G' : 'g'); x++; if (Math.random() < 0.25) y = clamp(y + pick([-1, 1]), iy0, iy1); } }
      for (let i = 0; i < area / 70 + 1; i++) stamp(pick(BONES), Math.round(cx + rand(-hx * 0.6, hx * 0.4)), Math.round(cy + rand(-hy * 0.5, hy * 0.3)));
      stamp(SKULL, Math.round(cx + rand(-hx * 0.3, hx * 0.2)) - 2, Math.round(cy - hy * 0.4));
      for (let i = 0; i < area / 120 + 1; i++) { const x = r(ix0, ix1 - 5), y = r(iy0, iy1 - 3); if (!inHeap(x, y, 1.1)) for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) set(x + k * 2 + j, y + j, 'K'); }
    }
    // 3) 뒤·옆 울타리: 뒤쪽은 작은 말뚝 앞면이 보이고, 옆은 말뚝 머리
    for (let x = 1; x <= wc; x++) { const c = (x - 1) % 3, tall = ((x - 1) / 3 | 0) % 2;
      if (c === 1) set(x, 1 - 0 + (tall ? 0 : 1), 'h');
      for (let y = 2 + (tall ? 0 : 1); y <= 4; y++) set(x, y, c === 0 ? 'l' : c === 1 ? 'd' : 'K');
      if (c === 0 && !tall) set(x, 2, 'K'); }
    for (let y = 2; y <= hc; y++) for (const [x, c] of [[1, 'h'], [2, 'd'], [wc - 1, 'l'], [wc, 'D']]) set(x, y, (y % 3 === 0) ? 'K' : c);
    // 4) 앞 울타리: 끝을 깎은 굵은 말뚝 (위로 솟은 뾰족 끝), 밧줄 감기, 꽂힌 해골, 흘러내린 피
    const SW = 4;
    for (let x0 = 1; x0 <= wc; x0 += SW) { const tall = Math.random() < 0.5 ? 2 : 0, top = hc + 1 - 2 - tall;
      for (let y = top; y <= hc + HH; y++) for (let c = 0; c < SW; c++) { const x = x0 + c; if (x > wc) continue; const d = y - top;
        if (d === 0 && c !== 1) continue; if (d === 1 && c === 3) continue;
        set(x, y, c === 3 ? 'K' : d <= 2 && c <= 1 ? 's' : d === 0 ? 'h' : c === 0 ? 'h' : c === 1 ? ((y + x0) % 7 === 0 ? 'd' : 'l') : ((y + x0) % 5 === 0 ? 'D' : 'd')); } // v2.82 깎은 끝 밝은 속 · 껍질 결
      if (Math.random() < 0.22 && x0 + 3 <= wc) { const sy = top - 1; [['.pw.', 'pKwK', 'wwWW', '.WW.']].forEach(m => m.forEach((rr, j) => [...rr].forEach((ch, i) => { if (ch !== '.' && sy - 3 + j >= 0) { if (g[sy - 3 + j]) g[sy - 3 + j][x0 + i] = ch; } }))); for (let k = 0; k < r(2, 5); k++) set(x0 + 1, top + 1 + k, k % 2 ? 'R' : 'r'); }
      else if (Math.random() < 0.18) for (let k = 0; k < r(2, 6); k++) set(x0 + r(0, 2), hc + 2 + k, k > 2 ? 'R' : 'r');
    }
    for (let x = 1; x <= wc; x++) { const y = hc + 5 + ((x >> 1) & 1); if (get(x, y) !== 'K') set(x, y, (x % 2) ? 'y' : 'o'); const y2 = hc + 10 + (((x + 1) >> 1) & 1); if (get(x, y2) !== 'K') set(x, y2, (x % 2) ? 'o' : 'O'); }
    for (let x = 1; x <= wc; x++) { set(x, hc + HH, 'D'); if (Math.random() < 0.4) set(x, hc + HH - 1, 'U'); }
    return { g: gOutline(g), HH };
  }
  // 망루: 네 기둥 위 발판과 난간, 가죽 지붕, 앞에 사다리와 깃발
  function genWatchtower(wc, hc) {
    const HH = 36, W0 = Math.max(wc, 16) + 2, H0 = HH + hc + 2, g = mkGrid(W0, H0), set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && x < W0 - 1 && y >= 1 && y < H0 - 1) g[y][x] = c; };
    const x0 = 1, x1 = W0 - 2, gb = H0 - 2, gt = Math.min(gb - 2, HH + 1), pl = Math.round(HH * 0.48), cx = W0 / 2;
    for (let y = pl; y <= gt; y++) for (const x of [x0 + 3, x1 - 3]) set(x, y, 'D');
    for (let y = pl; y <= gb; y++) for (let k = 0; k < 3; k++) { set(x0 + k, y, k === 0 ? 'h' : k === 1 ? 'l' : 'd'); set(x1 - 2 + k, y, k === 0 ? 'l' : k === 1 ? 'd' : 'D'); }
    const n = Math.max(6, gb - pl - 6);
    for (let i = 0; i <= n; i++) { const t = i / n; set(x0 + 3 + (x1 - x0 - 6) * t, pl + 4 + (gb - pl - 8) * t, 'd'); set(x1 - 3 - (x1 - x0 - 6) * t, pl + 4 + (gb - pl - 8) * t, 'O'); }
    for (let x = x0; x <= x1; x++) { set(x, pl, 'h'); set(x, pl + 1, x % 4 ? 'l' : 'd'); set(x, pl + 2, 'D'); }
    for (let x = x0; x <= x1; x++) { set(x, pl - 6, 'o'); set(x, pl - 3, 'O'); }
    for (let x = x0; x <= x1; x += Math.max(3, Math.round((x1 - x0) / 4))) for (let y = pl - 7; y < pl; y++) set(x, y, 'l');
    for (let y = pl + 3; y <= pl + 9; y++) for (let x = Math.round(cx - 3); x <= Math.round(cx + 2); x++) set(x, y, y === pl + 9 && x % 2 ? '.' : (x === Math.round(cx) || x === Math.round(cx) - 1) && y > pl + 4 && y < pl + 8 ? 'w' : 'r');
    for (let y = pl + 3; y <= gb; y++) { set(x0 + 5, y, 'o'); set(x0 + 8, y, 'o'); if ((y - pl) % 3 === 0) for (let x = x0 + 6; x <= x0 + 7; x++) set(x, y, 'O'); }
    const ry = pl - 9;
    for (let y = 1; y <= ry; y++) { const hw = (y / ry) * (W0 / 2 + 1); for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) set(x, y, y === ry ? 'D' : (y % 3 === 0 ? 'B' : x < cx - hw * 0.3 ? 'b' : x < cx + hw * 0.3 ? 'B' : 'D')); }
    for (let x = Math.round(cx - 2); x <= Math.round(cx + 2); x++) set(x, ry + 1, 'O');
    set(cx, 1, 'w'); set(cx - 1, 2, 'W');
    return { g: gOutline(g), HH };
  }
  // 가죽 천막: 앞면 삼각형, 가운데 어두운 입구, 꼭대기에 엇갈린 장대
  function genTent(wc, hc) {
    const HH = Math.round(Math.min(26, wc * 0.55)), W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0), cx = W0 / 2;
    for (let y = 1; y <= H0 - 2; y++) {
      const t = y / (H0 - 2), hw = Math.max(1, t * (wc / 2));
      for (let x = 1; x < W0 - 1; x++) {
        const dx = x + 0.5 - cx; if (Math.abs(dx) > hw) continue;
        let c = dx < -hw * 0.3 ? 'b' : dx < hw * 0.3 ? 'B' : 'D';
        if (y % 5 === 0) c = 'D';
        if (t > 0.55 && Math.abs(dx) < (t - 0.55) * wc * 0.45) c = 'K';
        if (Math.abs(dx) > hw - 1) c = 'O';
        g[y][x] = c;
      }
    }
    for (let i = 0; i < 3; i++) { const yy = Math.round((H0 - 2) * (0.3 + i * 0.2)); if (g[yy]) for (let x = 1; x < W0 - 1; x++) if (g[yy][x] === 'b') { g[yy][x] = 'w'; break; } }
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const x = Math.round(cx + s * k), y = 1 + 2 - k; if (g[y] && x > 0 && x < W0 - 1) g[y][x] = 'o'; }
    return { g: gOutline(g), HH };
  }
  function makeOrcObsSprites(R, out) {
    for (const b of R.obs) {
      if (b.t === 'pit' || b.t === 'prop' || b.t === 'drum' || b.t === 'post') continue;
      if (b.t === 'pillar') {
        const g0 = genTotem(), c = gCanvas(g0, WOODPAL);
        out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 6) & ~1, sy: b.y, ob: b });
      } else if (b.t === 'rock') {
        const c = rockCanvas(b.r);
        out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 6) & ~1, sy: b.y, ob: b });
      } else {
        const wc = Math.round(b.w / 2), hc = Math.round(b.h / 2), tent = !b.tower && b.w <= 100 && b.h <= 80 && Math.random() < 0.55;
        const { g, HH } = b.tower ? genWatchtower(wc, hc) : tent ? genTent(wc, hc) : genPalisade(wc, hc);
        out.push({ cv: gCanvas(g, PEN_PAL), x: Math.round(b.x0 - 2) & ~1, y: Math.round(b.y0 - HH * 2 - 2) & ~1, sy: b.y1, ob: b });
      }
    }
  }
  // 서 있는 소품 (부락)
  // v2.80 부락 소품 다시 그림 (외곽선 1칸 · 왼쪽 위 빛) — 우리 · 도마 · 바리케이드 · 해골 제단 · 교수대도 여기서 정의 (spProp은 건너뜀)
  Object.assign(PROP_MAPS, {
    orcFire: [["......k.....", "....kkrk....", "...krkOrk...", "...kOrOOrk..", "..krOOoOOrk.", "kkkryOyyOrkk", "wbbryyyyyrBb", "kkbbCCCCBBck", "k12212c12112", "k33422422433"], {"k": "#0b0a0e", "1": "#9a94a4", "2": "#76708a", "3": "#55506a", "4": "#38344a", "y": "#fff4c8", "o": "#ffd060", "O": "#ff8a2a", "r": "#e2501c", "c": "#2a1a10", "C": "#5a2a14", "w": "#8c6238", "b": "#6a4626", "B": "#4a301a"}],
    skullPike: [["..kkkk..", ".kXXxxk.", "kXXXxxxk", "kZZXxZZk", "kZZxxZZk", "kxxZZzzk", ".kXXxxk.", ".kzxzxk.", "..kwVk..", "..kwnk..", ".khhHHk.", "..kVbkHk", "..kwVkk.", "..kwbk..", "..kwbk..", "..kwbk..", ".kBBPPk."], {"k": "#0b0a0e", "w": "#8c6238", "b": "#6a4626", "B": "#4a301a", "P": "#2e1c10", "X": "#ece4d0", "x": "#bcb2a0", "z": "#7a7262", "Z": "#4a443a", "h": "#c4a466", "H": "#806838", "n": "#5a1414", "V": "#6a1410"}],
    meatRack: [["wwbbk......kwwbb", "kwbkkkkkkkkkkwbk", "WhHWWWWWWWWWWhHW", "bhHbbbbbbbbbbhHb", "kwbkGkkkGkkGkwbk", "kwbkmk.kgkkmkwbk", "kwbffMkkkkffMwbk", "kwbfmMkffMfmMwbk", "kwbmmMkfmMmmMwbk", "kwbmmnkmmMmmnwbk", "kwbkkkkmmnkkkwbk", "kwbkVk.kkkkVkwbk", "kwbkk...kk.kkwbk", "kwbkvk.kvvkvkwbk"], {"k": "#0b0a0e", "W": "#b08454", "w": "#8c6238", "b": "#6a4626", "m": "#c4544a", "M": "#8a2a24", "n": "#5a1414", "f": "#ecd2b4", "v": "#3e0a08", "V": "#6a1410", "G": "#8e889c", "g": "#615c72", "h": "#c4a466", "H": "#806838"}],
    woodPile: [[".......kkkkkwwbk.", "......kaaawwbbk..", "....kkaaGGwbbk...", "...kWWwaGgbWWk...", "..kbwwwwwwwwwbk..", "..kPPPPPPPPPPPk..", ".kWWBBBBBBBBBWWk.", "kbwBwwBwwBwwwwwbk", "kPPPPPPPPPPPPPPPk", "kWBBBBBBBBBBBBBWk", "bwBwwwwwBwwBwwwwb", "BbbbbbBbbbbbbbbBB", "kBBBBBBBBBBBBBBBk"], {"k": "#0b0a0e", "W": "#b08454", "w": "#8c6238", "b": "#6a4626", "B": "#4a301a", "P": "#2e1c10", "a": "#c4c0d0", "G": "#8e889c", "g": "#615c72"}],
    hideRack: [["wbkkkkkkkkkkwb", "WWWWWWWWWWWWWW", "bbbbbbbbbbbbbb", "whhkeeEEEkkkhb", "wbhheeXEEjhhwb", "wbkeejEEEjjkwb", "wbeeXjEEEjjkwb", "wbEEEjXxEjjhhb", "whhEEjxEEjjkwb", "wbkEEEEEEjkkwb", "wbhhhEEEEkhhwb", "whhkkkkkkkkkhb", "wwwwwwwwwwwwww", "BBBBBBBBBBBBBB", "wbkkkkkkkkkkwb", "wbk........kwb"], {"k": "#0b0a0e", "W": "#b08454", "w": "#8c6238", "b": "#6a4626", "B": "#4a301a", "e": "#b88c62", "E": "#946a46", "j": "#6a4a30", "h": "#c4a466", "X": "#ece4d0", "x": "#bcb2a0"}],
    boneHeap: [[".................", "..k......k.......", ".kXk....kXk..kk..", "kXXkkkkkxxxkkXxk.", ".kxXXXxxxxkkXXxxk", ".kkkxxXkkkkXZXZZk", "kXxxxkkXXXXxxzxxk", "Xxxkk.kkkkXxxzxxk", "kxkkzkzkzkxkkkkk."], {"k": "#0b0a0e", "X": "#ece4d0", "x": "#bcb2a0", "z": "#7a7262", "Z": "#4a443a"}],
    orcCage: [["wbWWWWWWWWWWWWwb", "hHbbbbbbbbbbbbhH", "wbBGBGBBBBgBgBwb", "wbBGBGBBBBgBgBwb", "wbBGBGBBBBgBgBwb", "wbPGPGPPPPgPgPwb", "wbPGPGPPPPgPgPwb", "wbGGGGGGGGGGGGwb", "hHgggggggggggghH", "wbPGPGPPPPgPgPwb", "wbPGPGPXXxgPGdwb", "wbPGPGXXXxgPGdwb", "wbPGPGXZXZgPdPwb", "wbPGPGPXzXgPgPwb", "wbPGPGPxzxgPgPwb", "wbPGXGPPzPgxgPwb", "wbPGXGXXzxgxgPwb", "wbPGXGPPzPgxgPwb", "wbPGXGXXzxgxgPwb", "wbhGXGhHzHgxghwb", "wbHGhGHHHhgHgHwb", "hHwwwwwwwwwwwwhH", "wbBBBBBBBBBBBBwb", "kPPPPPPPPPPPPPPk"], {"k": "#0b0a0e", "W": "#b08454", "w": "#8c6238", "b": "#6a4626", "B": "#4a301a", "P": "#2e1c10", "G": "#8e889c", "g": "#615c72", "d": "#3e3a4a", "X": "#ece4d0", "x": "#bcb2a0", "z": "#7a7262", "Z": "#4a443a", "h": "#c4a466", "H": "#806838"}],
    chopBlock: [["....................", ".........kkk....kkk.", "......kkkGddk.kkbbBk", "....kkddddgdkkbwBBk.", "...kdddaGDgdbwBBBk..", "...kGGaGGGggBBkkk...", "...kGaGGGGggdk......", "....kGGGGGggdk......", "....kGGGGGWWWkkk....", "...kWMmbWWWWbbWWk...", "..kwWbbWWbWWmbbWwk..", "..kwwWbbWWWWmMWwBk..", "..kwwbbwwwwwmMBBBk..", "..kwwbbbbbPbBMBPBk..", "..kwPbbbbbbbBMBBBk..", "..kwwbbbbbbbBBBBBk..", ".kPPPBBBBBBBBVVBPPk.", "..kkkkkkkkVVvVVvVk.."], {"k": "#0b0a0e", "W": "#b08454", "w": "#8c6238", "b": "#6a4626", "B": "#4a301a", "P": "#2e1c10", "a": "#c4c0d0", "G": "#8e889c", "g": "#615c72", "d": "#3e3a4a", "D": "#26222e", "m": "#c4544a", "M": "#8a2a24", "v": "#3e0a08", "V": "#6a1410"}],
    spikeBar: [[".kk......kkk......kkk......k", "kmbk....kffbk....kmmbk....kf", "kWMbk..kwWWWbk..kwMWMbk..kwW", ".kWbk..kwBkWbk..kwBkWbk..kwB", ".kWWbkkwBBkWWbkkwBBkWWbkkwBB", "..kWbkkwBk.kWbkkwBk.kWbkkwBk", ".kkkWbwBkkkkkWbwBkkkkkWbwBk.", "kWWWWhHWWWWWWWhHWWWWWWWhHWWk", "kwwwBhHwwwBwwwhHwBwwBwwhHBwk", "kbbbbhHbbbbbbbhHbbbbbbbhHbbk", ".kkkwBWbkkkkkwBWbkkkkkwBWbk.", "..kwBkkWbk.kwBkkWbk.kwBkkWbk", ".kwBBkkWWbkwBBkkWWbkwBBkkWWb", ".kwBk..kWbkwBk..kWbkwBk..kWb", "kwBBk..kWWwBBk..kWWwBBk..kWW", "kwPk....kPwPk....kPwPk....kP"], {"k": "#0b0a0e", "W": "#b08454", "w": "#8c6238", "b": "#6a4626", "B": "#4a301a", "P": "#2e1c10", "m": "#c4544a", "M": "#8a2a24", "f": "#ecd2b4", "h": "#c4a466", "H": "#806838"}],
    skullPile: [[".......kok........", "......kfxk........", "......kfxk........", "......kfxfk.......", ".....kXXXxxk......", ".....kXZXZxk......", "......kXzXk.......", "....kkkxzxkkk.....", "...kXXxkkkXXxk....", "..kXXXxxkXXXxxk...", "..kXZXZxkXZXZxk...", "...kXzXk.kXzXk....", ".kkkxzxkkkxzxkkk..", "kXXxkkkXXxkkkXXxk.", "XXXxxkXXXxxkXXXxxk", "XZXZxkXZXZxkXZXZxk", "kXzXk.kXzXk.kXzXk.", "kxzxk.kxzxk.kxzxk.", "kPPBBBBBBBBBBBBPPk"], {"X": "#ece4d0", "x": "#bcb2a0", "z": "#7a7262", "Z": "#4a443a", "k": "#0b0a0e", "B": "#4a301a", "P": "#2e1c10", "o": "#ffd060", "f": "#f4ecd4"}],
    meatGallows: [["kkkkkkkkkkkkkkkkkkkkkkkk", "WWWWWWWWWWWWWWWWWWWWWWWW", "wwwwwwwwwwwwwwwwwwwwwwww", "BBBBBBBBBBBBBBBBBBBBBBBB", "kkhhkkkkgkkkgkkBHkkkhhkk", ".kHHk.kbGk.kGk.khkkkHHk.", ".kwbkkbkgk.kgk.kHBBkwbk.", ".kwbkbkkGk.kGk.khkBkwbk.", ".kwbbk.kgk.kgk.kHkBBwbk.", ".kwbk..kGk.kagkkhkkkwbk.", ".kwbk..kgk..kgkkHk.kwbk.", ".kwbk..kGk...k.khk.kwbk.", ".kwbk...kak...kkHkkkwbk.", ".kwbk..kmmk..kXXXxxkwbk.", ".kwbk.kfmmMk.kzkXkzkwbk.", ".kwbk.kfmmMk.kXXXxxkwbk.", ".kwbkkfffmMMk.kkXkkkwbk.", ".kwbkkffmmMMkkXXXxxkwbk.", ".kwbk.kmmmMk..kkXkkkwbk.", ".kwbk.kmmnMk.kXXXxxkwbk.", ".kwbk..kmmk...kkXkkkwbk.", ".kwbk..kVk......kVkkwbk.", ".kwbk...kk.......k.kwbk.", ".kwbk...kVk........kwbk.", ".kwbk.kkkkkkkkkkk..kwbk.", ".kwbkkvvvVVVVVvvvk.kwbk.", ".kwbkkvvVVVVVVVvvk.kwbk.", "kBBBBkkkkkkkkkkkk.kPPPPk"], {"k": "#0b0a0e", "W": "#b08454", "w": "#8c6238", "b": "#6a4626", "B": "#4a301a", "P": "#2e1c10", "a": "#c4c0d0", "G": "#8e889c", "g": "#615c72", "m": "#c4544a", "M": "#8a2a24", "n": "#5a1414", "f": "#ecd2b4", "v": "#3e0a08", "V": "#6a1410", "X": "#ece4d0", "x": "#bcb2a0", "z": "#7a7262", "h": "#c4a466", "H": "#806838"}],
  });
  Object.assign(PROPS, {
    orcFire: { r: 9, foot: 2, light: { r: 96, c: '255,140,60', ca: 0.22, dy: -14 }, flame: [[4, 0], [6, 0], [8, 0]] },
    orcCage: { r: 12, foot: 1 }, chopBlock: { r: 10, foot: 2 }, spikeBar: { r: 13, foot: 1 }, skullPile: { r: 9, foot: 1, light: { r: 60, c: '255,170,80', ca: 0.12, dy: -30 }, flame: [[8, 0]] }, meatGallows: { r: 12, foot: 1 },
    skullPike: { r: 4, foot: 1 }, meatRack: { r: 12, foot: 2 }, woodPile: { r: 12, foot: 2 }, hideRack: { r: 10, foot: 2 }, boneHeap: { foot: 1 },
  });
  // ---- v0.84: 부락의 잔혹한 소품 — 해골 든 철창, 식칼 박힌 도마 그루터기, 말뚝 바리케이드, 촛불 해골 무더기, 고기 매단 교수대
  let ORC_PROPS = false;
  function ensureOrcProps() {
    if (ORC_PROPS) return; ORC_PROPS = true;
    const P = PEN_PAL;
    spProp('orcCage', 16, 24, (x, y) => { // 나무 받침 위 쇠창살 우리, 안에 웅크린 해골
      if (y <= 2) return y === 0 ? (x >= 6 && x <= 9 ? 'g' : null) : x >= 1 && x <= 14 ? (y === 1 ? 'h' : 'd') : null;
      if (y >= 21) return x >= 0 && x <= 15 ? (y === 21 ? 'l' : 'D') : null;
      if (x < 1 || x > 14) return null;
      if (x % 3 === 1) return x === 1 ? 'n' : 'g';
      if (y === 10) return 'G';
      const sk = [['..', '.pw', 'pKwK', 'wwW', '.W'], 12];
      if (y >= 13 && y <= 15 && x >= 5 && x <= 8) return y === 13 ? (x === 5 ? '.' : 'p') : y === 14 ? (x === 6 || x === 8 ? 'K' : 'w') : (x === 8 ? 'W' : 'w');
      if (y >= 16 && y <= 20 && x >= 4 && x <= 10) return (y % 2 === 0 && x >= 5 && x <= 9) ? 'W' : (x === 7 ? 'w' : (y === 20 ? 'U' : 'u'));
      return y >= 18 ? 'U' : 'u';
    }, { r: 12, foot: 1 }, P);
    spProp('chopBlock', 20, 18, (x, y) => { // 식칼 박힌 도마 그루터기, 피가 흘러내린다
      const blade = y <= 8 && x >= 6 && x <= 13 && y >= 1 && x - 6 >= (8 - y) * 0.5 && x - 6 <= (8 - y) * 0.5 + 6;
      if (blade) return y === 1 || x - 6 > (8 - y) * 0.5 + 5 ? 'n' : y >= 7 ? 'G' : 'g';
      if (y <= 9 && x >= 13 && x <= 18 && y >= 3 && Math.abs(y - (3 + (x - 13) * 0.8)) < 1) return x > 16 ? 'O' : 'o';
      const ex = Math.hypot((x - 9.5) / 8, (y - 10) / 2.6);
      if (ex < 1 && y <= 12) return (x === 9 && y === 10) || ex > 0.85 ? 'd' : (Math.abs(ex - 0.45) < 0.12 ? 'l' : (x > 11 && y > 10 && x < 15 ? 'r' : 'h'));
      if (y > 10 && y <= 16 && x >= 2 && x <= 17) { if ((x === 12 || x === 13) && y <= 13 + (x % 2) * 2) return x === 12 ? 'r' : 'R'; return y === 16 ? 'D' : x <= 4 ? 'l' : x <= 13 ? 'd' : 'D'; }
      if (y === 17 && x >= 10 && x <= 16) return x % 2 ? 'v' : 'r';
      return null;
    }, { r: 10, foot: 2 }, P);
    spProp('spikeBar', 28, 16, (x, y) => { // 엇갈린 말뚝 바리케이드 (끝에 피)
      if (y >= 9 && y <= 11 && x >= 2 && x <= 25) return y === 9 ? 'h' : y === 10 ? 'l' : 'd';
      for (const cx of [5, 13, 21]) for (const s of [-1, 1]) { const t = (y - 10) * s, xx = cx + t * 0.7; if (Math.abs(x - xx) < 1.1 && y >= 1 && y <= 15) { const tip = y <= 2 || y >= 15; return tip ? (y <= 2 ? 'r' : 'D') : s > 0 ? 'l' : 'd'; } }
      if (y === 13 && x % 6 === 2) return 'o';
      return null;
    }, { r: 13, foot: 1 }, P);
    spProp('skullPile', 18, 16, (x, y) => { // 해골을 쌓아 올린 제단, 꼭대기엔 녹은 초
      const rows = [[3, 12], [6, 9], [9, 6]]; // [y top, 몇 개]
      if (y <= 2 && (x === 8 || x === 9)) return y === 0 ? (x === 8 ? 'y' : null) : y === 1 ? 's' : 'w';
      for (const [ty, n] of [[12, 4], [8, 3], [4, 2]]) { const w = n * 4, x0 = Math.round((18 - w) / 2); if (y >= ty - 1 && y <= ty + 2 && x >= x0 && x < x0 + w) { const lx = (x - x0) % 4, ly = y - ty + 1; if (ly === 0) return lx === 0 || lx === 3 ? null : 'p'; if (ly === 1) return lx === 0 ? 'w' : lx === 3 ? 'W' : 'w'; if (ly === 2) return lx === 1 || lx === 2 ? 'K' : 'W'; return lx === 3 ? null : 'W'; } }
      if (y >= 15) return x >= 2 && x <= 15 ? 'U' : null;
      return null;
    }, { r: 9, foot: 1, light: { r: 60, c: '255,170,80', ca: 0.12, dy: -30 }, flame: [[8, 0]] }, P);
    spProp('meatGallows', 24, 28, (x, y) => { // 고기와 사슬을 매단 교수대
      if (x >= 2 && x <= 3 && y >= 1) return x === 2 ? 'h' : 'd';
      if (x >= 20 && x <= 21 && y >= 1) return x === 20 ? 'l' : 'D';
      if (y >= 1 && y <= 2 && x >= 0 && x <= 23) return y === 1 ? 'h' : 'd';
      if (y === 3 && (x === 4 || x === 19)) return 'd';
      for (const [hx, len, kind] of [[8, 9, 'm'], [14, 5, 'c'], [17, 11, 'r']]) {
        if (x === hx && y >= 3 && y < 3 + len) return y % 2 ? 'g' : 'G';
        if (kind === 'm' && y >= 3 + len && y <= 3 + len + 7 && Math.abs(x - hx) <= (y - 3 - len < 2 ? 1 : 2)) return x === hx - 2 || (x === hx - 1 && y < 6 + len) ? 'q' : y > 7 + len ? 'R' : 'r';
        if (kind === 'c' && y === 3 + len && Math.abs(x - hx) <= 1) return 'n';
        if (kind === 'r' && y >= 3 + len && y <= 3 + len + 5 && x >= hx - 2 && x <= hx + 1) return (y - 3 - len) % 2 === 0 ? (x === hx - 2 ? 'p' : 'w') : (x === hx + 1 ? 'R' : 'r');
      }
      if (y >= 24 && y <= 26 && x >= 6 && x <= 18 && dith(x, y, 0.6)) return y === 26 ? 'v' : 'r';
      return null;
    }, { r: 12, foot: 1 }, P);
  }
  function decorOrc(r, add, W0, H0, keyPts) {
    ensureOrcProps();
    if (r.type === 'boss') { // 투기장: 철문 양옆 해골 말뚝, 네 귀퉁이 화톳불, 모래판 밖 둘레에 맹수 우리·교수대·바리케이드
      const nx = DOOR.n.x, topY = A.y0 + 18;
      for (const s of [-1, 1]) { add('skullPike', nx + s * 56, topY); add('skullPile', nx + s * 92, topY + 2); }
      for (const [x, y] of [[A.x0 + 30, A.y0 + 34], [A.x1 - 30, A.y0 + 34], [A.x0 + 30, A.y1 - 26], [A.x1 - 30, A.y1 - 26]]) add('orcFire', x, y);
      const rx = W0 * 0.4, ry = H0 * 0.38, ring = [['orcCage', 0.62], ['meatGallows', 0.8], ['spikeBar', 1.1], ['orcCage', 1.35], ['chopBlock', 1.9], ['spikeBar', 2.3], ['orcCage', 2.6], ['meatGallows', 3.3], ['spikeBar', 3.6], ['skullPile', 4.4], ['spikeBar', 5.0], ['orcCage', 5.5]];
      for (const [nm, t] of ring) add(nm, CX + Math.cos(t) * (rx + 46), CY + Math.sin(t) * (ry + 34));
      for (let i = 0; i < 6; i++) add(pick(['boneHeap', 'skullPike']), rand(A.x0 + 40, A.x1 - 40), pick([rand(A.y0 + 40, A.y0 + 90), rand(A.y1 - 70, A.y1 - 30)]));
      return;
    }
    const topY = A.y0 + 16, nx = DOOR.n.x;
    if (r.doors.n != null) { add('skullPike', nx - 40, topY); add('skullPike', nx + 40, topY); }
    const n = Math.max(1, Math.floor(W0 / 240));
    for (let i = 0; i < n; i++) if (Math.random() < 0.75) { const x = A.x0 + 50 + (i + rand(0.2, 0.8)) * (W0 - 100) / n; if (Math.abs(x - nx) > 70) add(pick(['meatRack', 'meatGallows', 'orcCage', 'hideRack', 'orcFire', 'skullPike', 'skullPile']), x, topY + 4); }
    const cs = [[A.x0 + 26, A.y0 + 30], [A.x1 - 26, A.y0 + 30], [A.x0 + 26, A.y1 - 24], [A.x1 - 26, A.y1 - 24]].sort(() => Math.random() - 0.5);
    add('orcFire', ...cs[0]); if (Math.random() < 0.6) add('orcFire', ...cs[1]);
    for (let i = 0; i < 3 + W0 * H0 / 160000; i++) add(pick(['boneHeap', 'boneHeap', 'skullPike', 'chopBlock', 'spikeBar', 'skullPile', 'orcCage', 'woodPile']), rand(A.x0 + 40, A.x1 - 40), rand(A.y0 + 40, A.y1 - 30));
  }

  // 3px 칸으로 그리던 맵을 1.5배 칸 수로 늘려 2px 칸으로 (크기는 그대로, 외곽선은 1칸으로 다시)
  function upMap(rows, f) {
    const h = rows.length, w = Math.max(...rows.map(r => r.length)), W2 = Math.round(w * f), H2 = Math.round(h * f);
    let g = Array.from({ length: H2 + 2 }, (_, y) => Array.from({ length: W2 + 2 }, (_, x) => { const sy = Math.floor((y - 1) / f), sx = Math.floor((x - 1) / f); return y >= 1 && x >= 1 && rows[sy] ? (rows[sy][sx] || '.') : '.'; }));
    for (let it = 0; it < 2; it++) { const kill = []; for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (g[y][x] === 'k' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => ((g[y + b] || [])[x + a] || '.') === '.')) kill.push([x, y]); for (const [x, y] of kill) g[y][x] = '.'; }
    g = gOutline(g);
    return g.map(r => r.join(''));
  }
  function bossMap2() { if (!MAPS.boss2) MAPS.boss2 = upMap(MAPS.boss, 1.5); return 'boss2'; }
