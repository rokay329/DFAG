'use strict';
// ================================================================ v3.19 2장 버려진 우물 — 「영수 · 명수의 안전 놀이터」 입구
//  · 2장 원정마다 큰 전투방 한 곳의 구석에 한 번 나옴. 방을 클리어한 뒤 「F 내려가기」 → 도박장 (사다리로 올라오면 우물 옆으로)
//  · 깨진 돌 테 · 기운 두레박 틀 · 뒤쪽 테에 갈고리로 걸린 사다리 · 초 등불 · 앞면에 칼로 긁은 고양이 얼굴 · 속은 꺼멓게
//  · 틀 위에 까마귀 두 마리: 번갈아 「까악」(멀리서도 보이는 표시), 가까이 가면 날아갔다가 멀어지면 돌아옴
//  · FP(11_altar_forge.js)의 도트 도우미를 씀. 다른 파일은 고치지 않고 함수를 감싸서 끼워 넣음 (지도 표시 한 줄만 06에)
const WELL2 = (() => {
  const { Spr, render, shadow, hh } = FP;
  function well2(seed = 1) { const W = 38, H = 44, S = Spr(W, H, 6), P = ['#9a94a6', '#7a7488', '#5e5868', '#423d4c', '#2d2935', '#1c1922'], WD = ['#a07848', '#7a5634', '#563a22', '#382414'], MS = ['#567234', '#3a5226', '#263a1a'];
    const cx = 19, cy = 26, RX = 17, RY = 6, IX = 12.6, IY = 3.6, FH = 9, cyl = u => u < 0.1 ? 2 : u < 0.28 ? 0 : u < 0.5 ? 1 : u < 0.7 ? 2 : u < 0.86 ? 3 : 4;
    const inE = (x, y, rx, ry, oy = 0) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy - oy) / ry) ** 2 <= 1;
    // 앞면 (둥근 벽): 테 아래로 9칸 · 마름돌 줄눈 · 왼쪽 빛 · 오른쪽 깊은 그늘
    for (let x = 0; x < W; x++) for (let y = cy; y <= cy + FH + RY; y++) { if (Math.abs(x + 0.5 - cx) > RX || !(y <= cy + FH || inE(x, y, RX, RY, FH))) continue;
      const u = (x - (cx - RX)) / (RX * 2), r = y - cy, row = Math.floor(r / 4), seam = r % 4 === 3 || (x + (row & 1) * 4) % 8 === 0; const k = cyl(u) + (seam ? 2 : hh(Math.floor((x + (row & 1) * 4) / 8), row, seed) < 0.3 ? 1 : 0); S.set(x, y, P[Math.min(5, k + 1)]); }
    // 테 윗면 + 구멍 (위는 어둠 · 아래쪽 벽에는 밑에서 올라온 불빛)
    for (let y = cy - RY - 1; y <= cy + RY; y++) for (let x = 0; x < W; x++) { if (!inE(x, y, RX, RY)) continue; const u = (x - (cx - RX)) / (RX * 2);
      if (inE(x, y, IX, IY)) { const d = (y + 0.5 - (cy - IY)) / (IY * 2); S.set(x, y, d < 0.55 ? '#050408' : d < 0.8 ? '#0c0a12' : (x + y) & 1 ? '#17141e' : '#0f0d15'); continue; } // 속은 꺼멓게 (깊이를 알 수 없음)
      const a = Math.atan2((y + 0.5 - cy) * 2.6, x + 0.5 - cx), seam = Math.abs(Math.sin(a * 6 + 0.4)) < 0.14; let k = seam ? 3 : y < cy ? (u < 0.55 ? 0 : 1) : (u < 0.6 ? 1 : 2); if (!inE(x, y + 1, RX, RY)) k = Math.min(5, k + 2); else if (inE(x, y + 1, IX, IY) && y < cy) k = 3; S.set(x, y, P[k]); }
    for (const [x, y] of [[29, cy - 5], [30, cy - 5], [30, cy - 4], [31, cy - 4], [32, cy - 4], [32, cy - 3], [33, cy - 3]]) S.del(x, y); // 오른쪽 위 테가 깨져 나감
    for (const [x, y, c] of [[3, cy + 2, MS[0]], [4, cy + 2, MS[1]], [4, cy + 3, MS[1]], [5, cy + 3, MS[2]], [2, cy + 1, MS[1]], [3, cy + 1, MS[0]], [9, cy + 7, MS[1]], [10, cy + 7, MS[0]], [10, cy + 8, MS[2]], [27, cy + FH + 3, MS[1]], [28, cy + FH + 2, MS[2]], [8, cy - 4, MS[1]], [9, cy - 5, MS[0]]]) if (S.has(x, y)) S.set(x, y, c);
    // 칼로 긁은 고양이 얼굴 (앞면 가운데 · 밝은 긁힌 자국)
    for (const [dx, dy] of [[-4, 0], [4, 0], [-4, 1], [-3, 1], [3, 1], [4, 1], [-4, 2], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [4, 2], [-4, 3], [4, 3], [-2, 3], [2, 3], [-4, 4], [4, 4], [0, 4], [-3, 5], [-2, 5], [-1, 5], [0, 5], [1, 5], [2, 5], [3, 5]]) S.set(cx + dx, cy + 4 + dy, (dx + dy) & 1 ? '#d4cede' : '#b4aec0');
    // 떨어져 나간 테 돌 (오른쪽 아래 바닥)
    for (const [x, y, c] of [[34, cy + 12, P[0]], [35, cy + 12, P[1]], [34, cy + 13, P[2]], [35, cy + 13, P[3]], [36, cy + 13, P[4]], [33, cy + 13, P[2]]]) S.set(x, y, c);
    S.OV = []; const ov = () => { const m = new Map(); S.OV.push(m); return (x, y, c) => m.set(x + ',' + y, c); };
    // 두레박 틀: 뒤쪽 기둥 둘 (오른쪽은 위가 부러지고 기움) + 처진 가로대 + 감긴 밧줄
    { const p = ov(); for (let y = 2; y <= cy - 3; y++) { p(2, y, WD[0]); p(3, y, WD[1]); p(4, y, WD[3]); } for (let y = 7; y <= cy - 3; y++) { const x = 32 + (y < 14 ? 1 : 0); p(x, y, WD[1]); p(x + 1, y, WD[2]); p(x + 2, y, WD[3]); } p(33, 6, WD[0]); p(34, 6, WD[2]);
      for (let x = 1; x <= 36; x++) { const y = 2 + Math.round(x * 0.11); p(x, y, WD[0]); p(x, y + 1, x % 7 === 3 ? WD[3] : WD[1]); p(x, y + 2, WD[3]); }
      for (let x = 24; x <= 29; x++) { const y = 2 + Math.round(x * 0.11); p(x, y - 1, '#c8b088'); p(x, y, x & 1 ? '#c8b088' : '#8a7450'); p(x, y + 1, '#8a7450'); p(x, y + 2, x & 1 ? '#8a7450' : '#5e4c30'); p(x, y + 3, '#5e4c30'); } }
    { const p = ov(); for (let y = 9; y <= cy - 1; y++) p(27, y, y & 1 ? '#c8b088' : '#8a7450'); } // 구멍으로 드리운 밧줄
    // 사다리: 위 끝의 쇠갈고리가 뒤쪽 테에 걸려 있고 구멍 속으로 내려감
    { const p = ov(), IR = ['#8a8894', '#55535c', '#2e2d34']; for (const rx of [14, 21]) { for (let y = cy - 4; y <= cy + 1; y++) { p(rx, y, y > cy - 1 ? WD[2] : WD[1]); p(rx + 1, y, y > cy - 1 ? WD[3] : WD[2]); }
        p(rx, cy - 5, IR[0]); p(rx + 1, cy - 5, IR[1]); p(rx, cy - 6, IR[0]); p(rx + 1, cy - 6, IR[1]); p(rx, cy - 7, IR[1]); p(rx + 1, cy - 7, IR[2]); p(rx + 1, cy - 8, IR[1]); p(rx + 2, cy - 8, IR[2]); p(rx + 2, cy - 7, IR[2]); } // 테를 넘어 뒤로 꺾인 갈고리
      for (const y of [cy - 3, cy]) for (let x = 16; x <= 20; x++) { p(x, y, y === cy ? WD[2] : WD[0]); p(x, y + 1, WD[3]); } }
    // 등불 (가로대 왼쪽에 건 초 등불 — 도박장 등불과 같은 결)
    { const p = ov(), lx = 7, ly = 8; p(lx + 2, ly - 2, '#3a3940'); p(lx + 2, ly - 1, '#3a3940'); for (let x = lx + 1; x <= lx + 3; x++) p(x, ly, '#55535c'); for (let y = ly + 1; y <= ly + 6; y++) for (let x = lx; x <= lx + 4; x++) p(x, y, x === lx || x === lx + 4 ? '#3a3940' : y === ly + 6 ? '#f0dc98' : (x === lx + 2 && y <= ly + 4) ? (y <= ly + 2 ? '#fff0b0' : '#ffb040') : '#b06a1c'); for (let x = lx; x <= lx + 4; x++) p(x, ly + 7, '#26252b'); }
    shadow(S, 2, 2, 3); const c = render(S); c.pad = 6; c.lamp = [(7 + 2 + 6) * 2, (8 + 3 + 6) * 2]; c.hole = [(cx + 6) * 2, (cy + 6) * 2]; c.foot = (cy + FH + RY + 6) * 2; return c; }
  let ART = null, CROW = null;
  const art = () => ART || (ART = well2(3));
  function crowArt() { if (CROW) return CROW; const B = '#1a161e', Hh = '#3e3848', E = '#d84a32', Y = '#c8a040', S = Spr(12, 8, 2);
    for (const [x, y, c] of [[4, -6, B], [5, -6, B], [3, -5, B], [4, -5, Hh], [5, -5, E], [6, -5, B], [7, -5, Y], [2, -4, B], [3, -4, Hh], [4, -4, B], [5, -4, B], [6, -4, B], [1, -3, B], [2, -3, Hh], [3, -3, B], [4, -3, B], [5, -3, B], [0, -2, B], [1, -2, B], [2, -2, B], [3, -2, B], [4, -2, B], [5, -2, B], [-2, -1, B], [-1, -1, B], [0, -1, B], [1, -1, B], [3, -1, B], [4, -1, B], [3, 0, '#6a5a30'], [5, 0, '#6a5a30']]) S.set(x + 3, y + 6, c);
    const r = render(S), l = document.createElement('canvas'); l.width = r.width; l.height = r.height; const g = l.getContext('2d'); g.translate(r.width, 0); g.scale(-1, 1); g.drawImage(r, 0, 0);
    return (CROW = { r, l }); } // r: 오른쪽을 봄 (발 칸 = 그림의 (3+2, 6+2)칸) · l: 뒤집은 것
  const PERCH = [[10, 2, -1], [29, 5, 1]]; // 우물 그림 칸 좌표 (발 자리) · 보는 쪽
  const cur = () => { const R = G && G.dun && G.dun.cur; return R && R.well ? R : null; };
  const org = R => { const c = art(); return { x: (R.well.x - c.width / 2) & ~1, y: (R.well.y - c.foot + 8) & ~1 }; };

  // ---------------------------------------------------------------- 놓을 방 · 자리 (던전을 만들 때 정함 — 같은 던전이면 늘 같은 자리)
  function place(D) {
    const fight = r => ['combat', 'elite', 'survive'].includes(r.type), big = r => SHAPES[r.shape] && SHAPES[r.shape].w >= 900 && SHAPES[r.shape].h >= 450;
    let C = D.rooms.filter(r => r.type === 'combat' && big(r) && !r.sealW); const rest = D.rooms.filter(r => fight(r) && !C.includes(r) && !r.sealW);
    if (C.length > 1) { const k = C.reduce((a, r) => a + (r.seed || r.id || 0), 0) % C.length; C = C.slice(k).concat(C.slice(0, k)); }
    for (const R of C.concat(rest)) { setArena(SHAPES[R.shape]);
      const pts = [[A.x0 + 110, A.y0 + 150], [A.x1 - 110, A.y0 + 150], [A.x0 + 110, A.y1 - 70], [A.x1 - 110, A.y1 - 70], [A.x0 + 230, A.y0 + 150], [A.x1 - 230, A.y0 + 150], [A.x0 + 230, A.y1 - 70], [A.x1 - 230, A.y1 - 70]];
      const keys = []; for (const d in R.doors) if (R.doors[d] != null) keys.push(doorIn(d, 34)); if (R.crack) keys.push(doorIn(R.crack.dir, 34));
      for (const [x, y] of pts) {
        if (x < A.x0 + 60 || x > A.x1 - 60 || y < A.y0 + 110 || y > A.y1 - 40) continue;
        if (Math.hypot(x - CX, y - CY) < 170 || keys.some(p => Math.hypot(p.x - x, p.y - y) < 130) || obsHitL(R.obs, x, y - 8, 54)) continue;
        R.well = { x: x & ~1, y: y & ~1 }; R.obs.push({ t: 'prop', c: true, x: R.well.x, y: R.well.y - 8, r: 20, well: true }); R.nav = buildNav(R.obs);
        if (R.props) R.props = R.props.filter(p => Math.hypot(p.x - x, p.y + 10 - y) > 58);
        return R; } }
    return null;
  }
  { const o = genDungeon; genDungeon = function (stage) { const D = o(stage); try { if (stage === 2 && D && D.rooms) place(D); } catch (e) { console.warn('WELL2', e); } return D; }; }

  // ---------------------------------------------------------------- 까마귀
  const st = R => R.well.cr || (R.well.cr = PERCH.map(() => ({ s: 'perch', t: 0 })));
  function crows(R, o) { const P = G.player, S = st(R), C = crowArt(), d = P ? Math.hypot(P.x - R.well.x, P.y - (R.well.y - 20)) : 999;
    S.forEach((c, i) => { const [px, py, f] = PERCH[i], fx = o.x + (px + 6) * 2, fy = o.y + (py + 6) * 2;
      if (c.s === 'perch' && d < 78 && P && !P.dead) { c.s = 'fly'; c.t = time + i * 0.16; c.d = (P.x < R.well.x ? 1 : -1) * (i ? 1 : 1); if (i === 0) sfx('dodge', 1.5); }
      if (c.s === 'gone' && time > c.t && d > 170) c.s = 'perch';
      if (c.s === 'perch') { const img = f > 0 ? C.r : C.l, bob = Math.floor(time / 0.7 + i * 1.3) % 5 === 0 ? 2 : 0; ctx.drawImage(img, f > 0 ? fx - 10 : fx - (img.width - 10) + 2, fy - 16 + bob); }
      else if (c.s === 'fly') { const k = Math.floor((time - c.t) / 0.07); if (k < 0) { const img = f > 0 ? C.r : C.l; ctx.drawImage(img, f > 0 ? fx - 10 : fx - (img.width - 10) + 2, fy - 18); return; }
        const X = (fx + k * 8 * c.d) & ~1, Y = (fy - 8 - k * 5) & ~1, w = k % 2 ? -1 : 1; ctx.fillStyle = '#0b0a0e';
        for (const [x, y] of [[0, 0], [1, 0], [2, 0], [-1, -w], [3, -w], [-2, -2 * w], [4, -2 * w]]) ctx.fillRect(X + x * 2 * c.d - 2, Y + y * 2 - 2, 6, 6);
        ctx.fillStyle = '#2a2430'; for (const [x, y] of [[0, 0], [1, 0], [2, 0], [-1, -w], [3, -w], [-2, -2 * w], [4, -2 * w]]) ctx.fillRect(X + x * 2 * c.d, Y + y * 2, 2, 2);
        ctx.fillStyle = '#c8a040'; ctx.fillRect(X + 3 * 2 * c.d, Y, 2, 2);
        if (k === 1) for (let n = 0; n < 2; n++) G.parts.push({ x: fx, y: fy - 6, vx: rand(-16, 16), vy: rand(4, 18), t: rand(0.5, 0.9), c: '#1a161e', g: 30 }); // 빠진 깃털
        if (k > 30) { c.s = 'gone'; c.t = time + rand(8, 14); } } });
    // 번갈아 「까악」 (앉아 있을 때만 · 3.6초마다 1.3초)
    const n = Math.floor(time / 3.6), ph = time - n * 3.6, i = n % 2, c = S[i];
    if (ph < 1.3 && c.s === 'perch') { const [px, py, f] = PERCH[i]; drawBubble('까악', o.x + (px + 6) * 2 + f * 6, o.y + (py + 6) * 2 - 16, 0); }
  }

  // ---------------------------------------------------------------- 그리기 · 빛 · 상호작용 (기존 함수를 감쌈)
  { const o = roomEnts; roomEnts = function (list) { o(list); const R = cur(); if (!R) return; const c = art(), p = org(R);
      list.push({ y: R.well.y + 6, d: () => { ctx.drawImage(c, p.x, p.y); const f = Math.floor(time * 9) % 3; // 등불 불꽃이 일렁임
          ctx.fillStyle = f === 1 ? '#fff0b0' : '#ffb040'; ctx.fillRect(p.x + c.lamp[0], p.y + c.lamp[1] - 4 - (f === 2 ? 2 : 0), 2, 2); } });
      list.push({ y: R.well.y + 7, d: () => crows(R, p) }); }; }
  { const o = roomLights; roomLights = function (lights) { o(lights); const R = cur(); if (!R) return; const c = art(), p = org(R), fl = 0.9 + 0.06 * Math.sin(time * 7);
      lights.push({ x: p.x + c.lamp[0], y: p.y + c.lamp[1], r: 66, a: 0.92 * fl, c: '255,170,80', ca: 0.18 }); }; }
  const ready = R => R.cleared || !['combat', 'elite', 'survive'].includes(R.type);
  { const o = nearInteract; nearInteract = function () { const R = cur(), P = G.player;
      if (R && P && !G.trans && ready(R) && Math.hypot(P.x - R.well.x, P.y - (R.well.y + 4)) < 46) return { k: 'well2', x: R.well.x, y: R.well.y - art().foot - 2, t: 'F 내려가기' };
      return o(); }; }
  { const o = doInteract; doInteract = function (it) { if (it && it.k === 'well2') { const R = cur(); if (R) R.wellSeen = true; DEN.debugEnter(); return; } return o(it); }; }
  return { place, art };
})();
