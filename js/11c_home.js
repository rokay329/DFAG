'use strict';
// 잿빛 왕관 원정대 — 11c_home.js : 캐릭터별 시작 장소 (v2.55)
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다.
// 원정은 캐릭터가 눈을 뜬 장소에서 깨어 있는 채로 시작한다: 장소 이름 → 대사 → 아래 문 앞에서 「F 원정 떠나기」 → 월드맵 → 1장.
// 엔딩(11b)도 왕관이 쪼개진 뒤 이 장소로 돌아온다: 잠든 채 → 깨어남 · 같은 대사 → 「장소 이름?」.
// 장면은 시안(_작업자료/시안/시작장소_시안.html)과 같은 코드로 그린다: 2px 칸 384×216, 방은 RX0~RX1 × RY0~RY1 칸.

  const HOME = (() => {
  // ---------------------------------------------------------------- 공통: 칸(2px) 그리기 도구
  const GW = 384, GH = 216; // 장면 칸 384×216 (바닥에는 2배로)
  const K = '#0b0a0e';
  let RX0 = 72, RY0 = 42, RX1 = 312, RY1 = 177; // 작은 방 480×270 (칸 240×135) — 장면마다 바꿀 수 있음
  const ROOM0 = [72, 42, 312, 177];
  function setRoom(r) { [RX0, RY0, RX1, RY1] = r || ROOM0; }
  function hash(i) { let x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  const h2 = (x, y, s = 0) => hash(x * 73.13 + y * 19.71 + s * 7.7);
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }

  // 칸 버퍼: 칸마다 색 하나
  function Grid() {
    const [c, g] = mk(GW, GH);
    const P = {
      c, g,
      put(x, y, col) { if (!col || x < 0 || y < 0 || x >= GW || y >= GH) return; g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); },
      rect(x, y, w, h, col) { if (!col) return; g.fillStyle = col; g.fillRect(x | 0, y | 0, w | 0, h | 0); },
      // 외곽선 상자: 윗줄·왼쪽 밝게, 오른쪽·아래 어둡게
      box(x, y, w, h, p, outline = true) {
        if (outline) P.rect(x - 1, y - 1, w + 2, h + 2, K);
        P.rect(x, y, w, h, p.m); P.rect(x, y, w, 1, p.t); P.rect(x, y, 1, h, p.t); P.rect(x + w - 1, y + 1, 1, h - 1, p.d); P.rect(x + 1, y + h - 1, w - 1, 1, p.d);
      },
      line(x0, y0, x1, y1, col) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) P.put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col); },
      // 문자 그림: rows 배열 + 팔레트, '.' 투명, 자동 외곽선(o=true)
      spr(rows, pal, x0, y0, o = true, flip = false) {
        const h = rows.length, w = rows[0].length, at = (x, y) => (y >= 0 && y < h && x >= 0 && x < w) ? rows[y][flip ? w - 1 - x : x] : '.';
        if (o) for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) if (at(x, y) === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) !== '.')) P.put(x0 + x, y0 + y, K);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = at(x, y); if (ch !== '.') P.put(x0 + x, y0 + y, pal[ch]); }
      },
    };
    return P;
  }
  // 빛: 칸마다 밝기 → 4단계 + 2×2 디더 (부드러운 반투명 금지)
  const BAYER = [[0, 2], [3, 1]];
  function shade(g, lights, amb, tintAll) {
    const lv = [0, 0.22, 0.42, 0.6]; // 어둠 4단계
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      let L = amb, tr = 0, tg = 0, tb = 0, tw = 0;
      for (const l of lights) {
        const dx = x - l.x, dy = (y - l.y) * (l.sy || 1), d = Math.sqrt(dx * dx + dy * dy); if (d >= l.r) continue;
        const k = (1 - d / l.r) * l.a; L += k; if (l.c) { tr += l.c[0] * k; tg += l.c[1] * k; tb += l.c[2] * k; tw += k; }
      }
      L = Math.min(1, L);
      const f = (1 - L) * 3 + (BAYER[y & 1][x & 1] - 1.5) / 4 * 0.9, i = Math.max(0, Math.min(3, Math.round(f)));
      if (lv[i] > 0) { g.fillStyle = `rgba(6,4,10,${lv[i]})`; g.fillRect(x * 2, y * 2, 2, 2); }
      if (tw > 0.18 && ((x + y) & 1 || tw > 0.45)) { const a = Math.min(0.2, tw * 0.14); g.fillStyle = `rgba(${tr / tw | 0},${tg / tw | 0},${tb / tw | 0},${a})`; g.fillRect(x * 2, y * 2, 2, 2); }
    }
  }
  // 바닥 돌판 (불규칙 판석)
  function flagstones(P, x0, y0, x1, y1, pal, seed, cw = 9, ch = 6) {
    for (let y = y0; y < y1; y++) {
      const row = Math.floor((y - y0) / ch), ly = (y - y0) % ch;
      // 줄마다 돌 폭을 들쭉날쭉하게
      let bx = x0 - Math.floor(h2(row, 0, seed) * cw), id = 0, edges = [];
      while (bx < x1) { edges.push(bx); bx += cw - 3 + Math.floor(h2(row, id++, seed + 1) * 8); }
      let k = 0;
      for (let x = x0; x < x1; x++) {
        while (k + 1 < edges.length && edges[k + 1] <= x) k++;
        const lx = x - edges[k], sid = row * 131 + k, v = h2(sid, seed), base = v < 0.33 ? pal.a : v < 0.66 ? pal.b : pal.c;
        let c = base;
        if (ly === ch - 1 || lx === 0) c = pal.gap;
        else if (ly === 0 || lx === 1) c = pal.hi;
        else if (h2(x, y, seed) < 0.05) c = pal.speck;
        P.put(x, y, c);
      }
    }
  }
  // 판자 바닥 (가로)
  function planks(P, x0, y0, x1, y1, pal, seed) {
    for (let y = y0; y < y1; y++) {
      const row = Math.floor((y - y0) / 4), ly = (y - y0) % 4;
      for (let x = x0; x < x1; x++) {
        const len = 22 + Math.floor(h2(row, 1, seed) * 18), off = Math.floor(h2(row, 2, seed) * len), b = Math.floor((x - x0 + off) / len), lx = (x - x0 + off) % len;
        const v = h2(row * 31 + b, 3, seed); let c = v < 0.33 ? pal.a : v < 0.7 ? pal.b : pal.c;
        if (ly === 3) c = pal.gap; else if (lx === 0) c = pal.gap; else if (ly === 0) c = pal.hi;
        else if ((lx === 2 || lx === len - 3) && ly === 1) c = pal.nail;
        else if (h2(x, y, seed) < 0.05) c = pal.grain;
        P.put(x, y, c);
      }
    }
  }
  // 벽돌 벽면
  function bricks(P, x0, y0, x1, y1, pal, seed, bw = 8, bh = 4) {
    for (let y = y0; y < y1; y++) {
      const row = Math.floor((y - y0) / bh), ly = (y - y0) % bh, off = row % 2 ? bw / 2 : 0;
      for (let x = x0; x < x1; x++) {
        const lx = (x - x0 + off) % bw, id = row * 97 + Math.floor((x - x0 + off) / bw), v = h2(id, 5, seed);
        let c = v < 0.3 ? pal.a : v < 0.75 ? pal.b : pal.c;
        if (ly === bh - 1 || lx === bw - 1) c = pal.gap; else if (ly === 0) c = pal.hi;
        P.put(x, y, c);
      }
    }
  }
  // 디더 얼룩 (재·그을음·이끼)
  function blot(P, cx, cy, rx, ry, col, seed, dens = 1) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1) continue;
      const p = (1 - d) * 1.6 * dens; if (h2(x, y, seed) < p * (((x + y) & 1) ? 1 : 0.7)) P.put(x, y, col);
    }
  }

  // ---------------------------------------------------------------- 다섯 시작 장소 (칸 단위, 캐릭터 ≈ 22×32칸)
  const CX = (RX0 + RX1) / 2, CY = (RY0 + RY1) / 2; // 192, 109.5
  const WOOD = { t: '#7a5a40', m: '#5e4430', d: '#3a2a1e' }, WOOD2 = { t: '#6e5038', m: '#55402c', d: '#33241a' };
  const STN = { t: '#7e7884', m: '#5e5866', d: '#3a3542' }, STN2 = { t: '#625d6a', m: '#4a4554', d: '#2e2a36' };

  // 방 테두리: 옆·아래 벽 윗면 (top-down 3/4). 윗벽 면은 장면이 직접 그린다
  function roomShell(P, wallH, cap, voidCol) {
    const top = RY0 - wallH;
    P.rect(0, 0, GW, GH, voidCol || K);
    const parts = [[RX0 - 7, top - 3, 7, RY1 - top + 10], [RX1, top - 3, 7, RY1 - top + 10], [RX0 - 7, RY1, RX1 - RX0 + 14, 6], [RX0 - 7, top - 3, RX1 - RX0 + 14, 3]];
    for (const [x, y, w, h] of parts) { P.rect(x, y, w, h, cap.m); P.rect(x, y, w, 1, cap.t); P.rect(x, y, 1, h, cap.t); P.rect(x + w - 1, y, 1, h, cap.d); P.rect(x, y + h - 1, w, 1, cap.d); }
    P.rect(RX0 - 8, top - 4, RX1 - RX0 + 16, 1, K); P.rect(RX0 - 8, top - 4, 1, RY1 - top + 11, K); P.rect(RX1 + 7, top - 4, 1, RY1 - top + 11, K); P.rect(RX0 - 8, RY1 + 6, RX1 - RX0 + 16, 1, K);
    P.rect(RX0, RY1, RX1 - RX0, 1, K); P.rect(RX0 - 1, top, 1, RY1 - top, K); P.rect(RX1, top, 1, RY1 - top, K);
  }
  function wallShadow(P, col, x0 = RX0, x1 = RX1) { for (let y = RY0; y < RY0 + 4; y++) for (let x = x0; x < x1; x++) if (y < RY0 + 2 || (x + y) & 1) P.put(x, y, col); }
  // 바닥에 떨어지는 빛 웅덩이 (칸 디더로 밝힘)
  function pool(P, cx, cy, rx, ry, col, seed) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1) continue; if ((d < 0.45) || ((x + y) & 1)) if (h2(x, y, seed) < 1.15 - d) P.put(x, y, col); } }
  const crate = (P, x, y, w, h, p = WOOD) => { P.box(x, y, w, h, p); P.rect(x, y, w, 2, p.t); P.rect(x + 1, y + 3, w - 2, 1, p.d); P.line(x + 1, y + 4, x + w - 2, y + h - 2, p.d); P.rect(x + 1, y + h - 2, w - 2, 1, p.d); };
  const barrel = (P, x, y) => P.spr([
    '..tttttt..', '.tTTTTTTt.', '.dTTTTTTd.', 'iiiiiiiiii', 'wWwwwwwwWd', 'wWwwwwwwWd', 'wWwwwwwwWd', 'iiiiiiiiii', 'wWwwwwwwWd', 'wWwwwwwwWd', '.wwwwwwwd.',
  ], { t: '#8a6a4a', T: '#6e5038', d: '#3a2a1e', i: '#4a4856', w: '#5e4430', W: '#7a5a40' }, x, y);

  const SCENES = {
    // ============================================================ 1. 알드릭 · 불탄 변경 성채
    knight: {
      name: '불탄 변경 성채', who: '알드릭', amb: 0.42,
      sleep: [176, 138], exit: [192, 166], exitDir: 's',
      draw(P) {
        roomShell(P, 20, { t: '#5e5866', m: '#4a4554', d: '#2e2a36' });
        const top = RY0 - 20;
        // 성문 밖: 어두운 풀밭과 흙길
        for (let y = RY1 + 7; y < GH; y++) for (let x = 0; x < GW; x++) { const v = h2(x, y, 9); P.put(x, y, v < 0.5 ? '#141a14' : v < 0.85 ? '#18201a' : '#1e281c'); }
        for (let y = RY1; y < GH; y++) { const w = 12 + (y - RY1) * 0.6; for (let x = Math.floor(CX - w); x < CX + w; x++) if (h2(x, y, 4) < 0.9 - Math.abs(x - CX) / w * 0.7) P.put(x, y, h2(x, y, 5) < 0.5 ? '#3a3026' : '#2e261e'); }
        // 바닥 판석 + 그을음 · 재
        flagstones(P, RX0, RY0, RX1, RY1, { a: '#56515c', b: '#4e4a56', c: '#48444f', gap: '#2a2630', hi: '#625d6a', speck: '#6a6572' }, 1, 12, 8);
        blot(P, 248, 82, 40, 18, '#221e26', 3, 0.9); blot(P, 110, 120, 26, 12, '#2a2630', 4, 0.8); blot(P, 220, 150, 22, 9, '#2e2a34', 5, 0.7);
        blot(P, 176, 134, 26, 9, '#7e7880', 6, 0.8); blot(P, 176, 134, 17, 6, '#9a948c', 7, 0.9); blot(P, 176, 135, 9, 3, '#b0aaa0', 70, 0.9); blot(P, 266, 92, 20, 8, '#6a6570', 8, 0.6);
        wallShadow(P, '#221e28');
        // 윗벽: 큰 돌 + 그을린 줄기 + 무너진 틈
        bricks(P, RX0, top, RX1, RY0, { a: '#46424e', b: '#3e3a46', c: '#4c4854', gap: '#1e1c24', hi: '#56525e' }, 2, 12, 6);
        for (let x = RX0; x < RX1; x++) { const s = h2(x >> 2, 0, 11); if (s < 0.4) for (let y = top; y < top + 4 + s * 30; y++) if (((x + y) & 1) || y < top + 5) P.put(x, y, '#1c181e'); }
        for (const [gx, gw, gd] of [[100, 18, 8], [196, 24, 12], [286, 14, 6]]) for (let x = gx; x < gx + gw; x++) {
          const d = Math.round(gd * Math.sin((x - gx + 0.5) / gw * Math.PI)) + (h2(x, 1, 3) < 0.4 ? 1 : 0);
          for (let y = top - 3; y <= top + d; y++) P.put(x, y, y === top + d ? K : y < top + d - 3 ? (h2(x, y, 33) < 0.05 ? '#c0b0d0' : '#1c1426') : '#2a2032');
        }
        // 기사단 깃발 2장 (아랫자락 탐)
        for (const bx of [132, 238]) {
          P.rect(bx - 3, top + 1, 26, 3, '#2a2228'); P.rect(bx - 4, top + 1, 1, 3, K); P.rect(bx + 23, top + 1, 1, 3, K); P.put(bx - 3, top + 1, '#4a4248');
          for (let x = 0; x < 20; x++) { const len = 22 + Math.floor(h2(x, bx, 2) * 4) - (x > 11 ? Math.floor(h2(x, bx, 3) * 9) : 0) - (x < 4 ? Math.floor(h2(x, bx, 5) * 4) : 0);
            for (let y = 0; y < len; y++) { const c = y >= len - 2 ? '#2a1014' : x === 0 ? '#9a3030' : x === 19 ? '#3e0e14' : x === 1 ? '#7a2024' : (y % 6 === 5 ? '#4e0e14' : '#621418'); P.put(bx + x, top + 4 + y, c); }
            P.put(bx + x, top + 4 + len, K); if (h2(x, bx, 4) < 0.35) P.put(bx + x, top + 3 + len, '#d03018'); if (h2(x, bx, 6) < 0.12) P.put(bx + x, top + 2 + len, '#ff7a28'); }
          P.rect(bx - 1, top + 4, 1, 24, K); P.rect(bx + 20, top + 4, 1, 24, K);
          // 반쯤 녹은 해 문양
          const ex = bx + 10, ey = top + 13;
          for (let a = 0; a < 8; a++) { const r = a / 8 * Math.PI * 2; P.put(ex + Math.round(Math.cos(r) * 5), ey + Math.round(Math.sin(r) * 5), '#9a7028'); P.put(ex + Math.round(Math.cos(r) * 6), ey + Math.round(Math.sin(r) * 6), a % 2 ? '#6a4c20' : '#9a7028'); }
          P.rect(ex - 2, ey - 2, 5, 5, '#c09038'); P.rect(ex - 1, ey - 2, 3, 1, '#e0b040'); P.rect(ex - 2, ey + 3, 1, 3, '#6a4c20'); P.rect(ex + 1, ey + 3, 1, 5, '#6a4c20'); P.rect(ex + 3, ey + 2, 1, 2, '#6a4c20');
        }
        // 서약비 (왼쪽): 금 간 비석 + 녹은 문장 + 받침
        const sx = 82, sy = 46;
        const rows = [];
        for (let y = 0; y < 30; y++) { let r = ''; for (let x = 0; x < 22; x++) { const arch = y < 6 ? Math.hypot(x + 0.5 - 11, (y - 6) * 1.7) <= 11 : true; r += arch ? (x === 0 || (y < 6 && !(Math.hypot(x - 0.5 - 11, (y - 6) * 1.7) <= 11)) ? 'h' : x === 21 ? 'd' : x >= 16 ? 'n' : 'm') : '.'; } rows.push(r); }
        P.spr(rows, { h: '#9a94a0', m: '#77717e', n: '#625d6a', d: '#45404c' }, sx, sy);
        for (let x = 0; x < 22; x++) { const y0 = sy + Math.max(0, Math.ceil(6 - Math.sqrt(Math.max(0, 121 - (x + 0.5 - 11) ** 2)) / 1.7)); P.put(sx + x, y0, '#aaa4b0'); }
        // 새겨진 문장 (반쯤 녹아 흘러내림)
        const ex = sx + 11, ey = sy + 13;
        for (let a = 0; a < 16; a++) { const r = a / 16 * Math.PI * 2; P.put(ex + Math.round(Math.cos(r) * 6), ey + Math.round(Math.sin(r) * 6), '#3e3a46'); }
        for (let a = 0; a < 8; a++) { const r = a / 8 * Math.PI * 2; P.put(ex + Math.round(Math.cos(r) * 8), ey + Math.round(Math.sin(r) * 8), '#4a4554'); }
        P.rect(ex - 2, ey - 2, 5, 5, '#3e3a46'); P.rect(ex - 1, ey - 1, 3, 3, '#57525e');
        for (const [dx, l] of [[-3, 7], [0, 10], [2, 6], [5, 5]]) P.rect(ex + dx, ey + 6, 1, l, '#3e3a46');
        P.line(sx + 15, sy + 2, sx + 13, sy + 8, '#2a2630'); P.line(sx + 13, sy + 8, sx + 17, sy + 15, '#2a2630'); P.line(sx + 17, sy + 15, sx + 15, sy + 22, '#2a2630'); P.line(sx + 15, sy + 22, sx + 18, sy + 29, '#2a2630');
        P.box(sx - 4, sy + 30, 30, 4, { t: '#8e8894', m: '#6a6572', d: '#45404c' }); P.box(sx - 6, sy + 35, 34, 4, { t: '#77717e', m: '#57525e', d: '#3a3542' });
        blot(P, sx + 11, sy + 41, 18, 3, '#221e28', 12, 0.9);
        // 무너진 돌무더기 (오른쪽 위) + 숯이 된 들보
        const rub = [[280, 44, 14, 9], [294, 43, 15, 10], [272, 54, 13, 9], [287, 55, 16, 10], [300, 55, 10, 9], [278, 66, 12, 8], [292, 67, 14, 8], [266, 66, 10, 7], [304, 66, 6, 7], [284, 76, 10, 6], [296, 77, 9, 6]];
        rub.forEach(([x, y, w, h], i) => { const p = i % 3 ? STN : STN2; P.box(x, y, w, h, p); P.rect(x, y, w, 2, p.t); if (i % 2) P.rect(x + 2, y + 3, w - 4, 1, p.d); });
        for (let i = 0; i < 64; i++) { const x = 206 + i, y = Math.round(54 + i * 0.5);
          P.rect(x, y - 1, 1, 8, K); P.put(x, y, '#4a362a'); P.put(x, y + 1, '#3a2a22'); P.put(x, y + 2, '#2e2018'); P.put(x, y + 3, '#22180f'); P.put(x, y + 4, '#22180f'); P.put(x, y + 5, '#160e0a');
          if (h2(i, 0, 21) < 0.22) P.put(x, y + 2 + (i % 2), '#d03018'); if (h2(i, 0, 22) < 0.08) P.put(x, y + 1, '#ff7a28'); if (i % 9 === 0) P.rect(x, y, 1, 6, '#1a120e'); }
        // 부서진 무기걸이 (오른쪽) + 기댄 방패
        const wx = 252, wy = 104;
        P.box(wx, wy + 14, 30, 3, WOOD2); P.rect(wx + 2, wy + 17, 2, 5, '#33241a'); P.rect(wx + 26, wy + 17, 2, 5, '#33241a');
        for (const [x, h, br] of [[4, 22, 0], [10, 22, 1], [16, 22, 0], [22, 13, 1]]) { P.rect(wx + x - 1, wy + 16 - h, 3, h + 1, K); P.rect(wx + x, wy + 16 - h, 1, h, '#6e5038'); if (!br) { P.rect(wx + x - 1, wy + 13 - h, 3, 4, K); P.put(wx + x, wy + 13 - h, '#c0c0cc'); P.put(wx + x, wy + 14 - h, '#9a9aa4'); P.put(wx + x, wy + 15 - h, '#6a6a76'); } else P.put(wx + x, wy + 16 - h, '#3a2a1e'); }
        P.spr(['.ssssss.', 'sSSSSSSs', 'sSRRRRSs', 'sSRYYRSs', 'sSRRRRSs', 'sSSSSSSs', '.sSSSSs.', '..sSSs..', '...ss...'], { s: '#4a4856', S: '#6a6876', R: '#5e1218', Y: '#9a7028' }, wx + 32, wy + 6);
        for (let i = 0; i < 12; i++) P.put(wx + 6 + i, wy + 24 + (i % 3 === 0 ? 1 : 0), '#6e5038');
        // 쓰러진 돌기둥 (왼쪽 아래)
        for (let s = 0; s < 4; s++) { const x0 = 86 + s * 12 + (s === 3 ? 4 : 0), y0 = 150 + (s === 3 ? 2 : 0); P.box(x0, y0, 11, 10, STN); P.rect(x0, y0, 11, 2, '#8e8894'); P.rect(x0 + 3, y0 + 3, 1, 6, '#4a4554'); P.rect(x0 + 7, y0 + 3, 1, 6, '#4a4554'); }
        P.box(142, 156, 7, 5, STN2); P.box(150, 160, 5, 4, STN2);
        // 굴러다니는 투구 · 깨진 방패
        P.spr(['.kkkk.', 'kHHHHk', 'kHnnHk', 'kHHHHk', '.kkkk.'], { k: '#4a4856', H: '#8a8a96', n: '#1a1820' }, 140, 96);
        P.spr(['.rrr', 'rRRr', 'rRY.', 'rR..'], { r: '#4a4856', R: '#5e1218', Y: '#9a7028' }, 222, 140);
        // 불씨
        for (const [x, y] of [[262, 92], [272, 88], [250, 84], [236, 74], [214, 62], [160, 140], [192, 132], [190, 140]]) { P.put(x, y, '#ff7a28'); P.put(x + 1, y, '#d03018'); }
        // 부서진 성문 (아래 가운데)
        P.rect(CX - 16, RY1 - 1, 32, 8, '#2e261e'); for (let x = CX - 16; x < CX + 16; x++) for (let y = RY1; y < RY1 + 7; y++) if (h2(x, y, 31) < 0.5) P.put(x, y, '#3a3026');
        for (const px of [CX - 24, CX + 17]) { P.box(px, RY1 - 14, 7, 20, STN); P.rect(px, RY1 - 14, 7, 2, '#9a94a0'); P.rect(px + 2, RY1 - 9, 1, 12, '#4a4554'); }
        P.spr(['wwwwwwwwwwwwwwwwwwwwww', 'WWWWWWWWWWWWWWWWWWWWWW', 'wiwwwwwwwwwwwwwwwwwwiw', 'WWWWWWWWWWWWWWWWWWWWWW', 'wwwwwwwwwwwwwwwwwwwwww', 'WWWWWWWWWWWWWWWWWWWWWW', 'wiwwwwwwwwwwwwwwwwwwiw', 'WWWWWWWWWWWWWWWWWWWWWW'], { w: '#3a2c22', W: '#2a2018', i: '#5e5e6a' }, CX + 8, RY1 + 10);
        P.rect(CX + 22, RY1 + 10, 8, 8, '#1a1210'); P.put(CX + 26, RY1 + 11, '#d03018'); P.put(CX + 24, RY1 + 13, '#ff7a28');
      },
      lights: [{ x: 262, y: 88, r: 40, a: 0.5, c: [255, 120, 50] }, { x: 108, y: 20, r: 36, a: 0.3, c: [160, 120, 210] }, { x: 208, y: 22, r: 44, a: 0.35, c: [160, 120, 210] }, { x: 192, y: 205, r: 60, a: 0.4, c: [230, 140, 90] }, { x: 176, y: 134, r: 34, a: 0.25, c: [230, 210, 180] }],
      labels: [['서약비', 93, 42], ['기사단 깃발', 142, 54], ['무너진 성벽', 290, 38], ['숯이 된 들보', 232, 74], ['부서진 무기걸이', 272, 128], ['쓰러진 돌기둥', 110, 146], ['부서진 성문', 192, 196]],
    },

    // ============================================================ 2. 네로 · 버려진 역참
    ranger: {
      name: '버려진 역참', who: '네로', amb: 0.44,
      sleep: [104, 76], exit: [300, 110], exitDir: 'e',
      draw(P) {
        roomShell(P, 22, { t: '#5a4434', m: '#45342a', d: '#2a1e18' });
        const top = RY0 - 22;
        // 뒷골목 (오른쪽 밖) 돌길
        for (let y = 0; y < GH; y++) for (let x = RX1 + 8; x < GW; x++) { const v = h2(x, y, 41), gx = (x - RX1) % 9, gy = y % 6; P.put(x, y, gx === 0 || gy === 0 ? '#121016' : v < 0.5 ? '#1e1c24' : '#24222a'); }
        // 판자 바닥 + 창 빛 웅덩이
        planks(P, RX0, RY0, RX1, RY1, { a: '#5a4230', b: '#523a28', c: '#4a3424', gap: '#26180e', hi: '#664c38', nail: '#8a7a6a', grain: '#3e2c1e' }, 2);
        blot(P, 236, 150, 30, 10, '#3a2a1c', 3, 0.5); blot(P, 150, 160, 18, 7, '#34241a', 4, 0.6);
        wallShadow(P, '#22160e');
        // 윗벽: 회벽 + 들보 + 기둥
        for (let y = top; y < RY0; y++) for (let x = RX0; x < RX1; x++) { const v = h2(x, y, 6); P.put(x, y, v < 0.12 ? '#54463a' : v < 0.9 ? '#605242' : '#6a5a4a'); }
        for (let x = RX0; x < RX1; x++) for (let y = top; y < RY0; y++) if (h2(x >> 1, y >> 1, 7) < 0.07) P.put(x, y, '#463a30');
        P.rect(RX0, top + 7, RX1 - RX0, 3, '#3a2a1e'); P.rect(RX0, top + 7, RX1 - RX0, 1, '#4e3a2a'); P.rect(RX0, top + 10, RX1 - RX0, 1, K);
        for (let x = RX0 + 2; x < RX1; x += 36) { P.rect(x, top, 5, 22, '#3a2a1e'); P.rect(x, top, 1, 22, '#4e3a2a'); P.rect(x + 4, top, 1, 22, '#24180f'); }
        P.rect(RX0, RY0 - 2, RX1 - RX0, 2, '#2a1e14');
        // 덧문이 부서진 창 (황혼빛)
        const wx = 200, wy = top + 3;
        P.rect(wx - 1, wy - 1, 26, 16, K); for (let y = 0; y < 14; y++) for (let x = 0; x < 24; x++) P.put(wx + x, wy + y, y < 5 ? '#e8a070' : y < 9 ? ((x + y) & 1 ? '#c06850' : '#e8a070') : '#8a4a52');
        P.rect(wx + 11, wy, 2, 14, '#2a1e14'); P.rect(wx, wy + 6, 24, 1, '#2a1e14'); P.put(wx + 5, wy + 2, '#ffe0b0');
        for (let y = 0; y < 14; y++) P.rect(wx - 5, wy + y, 4, 1, y % 2 ? '#46321f' : '#5a4230'); P.rect(wx - 6, wy - 1, 1, 16, K);
        P.spr(['ssss', 'Ssss', 'sss.', 'Ss..', 's...'], { s: '#5a4230', S: '#46321f' }, wx + 25, wy + 9);
        // 게시판 (찢긴 의뢰 쪽지)
        const nx = 142, ny = top + 2;
        P.box(nx, ny, 40, 18, { t: '#6a4c34', m: '#4e3626', d: '#2e2016' });
        for (const [px, py, pw, ph, torn] of [[nx + 3, ny + 3, 8, 9, 0], [nx + 13, ny + 2, 9, 12, 1], [nx + 24, ny + 4, 8, 8, 1], [nx + 33, ny + 3, 5, 7, 0], [nx + 4, ny + 13, 7, 4, 1]]) {
          for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) { if (torn && y > ph - 5 && h2(x, y, px) < 0.4 + (y - ph + 5) * 0.18) continue; P.put(px + x, py + y, y === 0 ? '#e8dcc0' : (x + y) % 7 === 0 ? '#bfb090' : '#cfc0a0'); }
          if (!torn) for (let r = 0; r < 3; r++) P.rect(px + 1, py + 2 + r * 2, pw - 2 - (r & 1), 1, '#6a5a4a');
          P.put(px + (pw >> 1), py, '#8a8a94');
        }
        P.rect(nx + 14, ny + 4, 6, 1, '#6a5a4a'); P.rect(nx + 14, ny + 6, 7, 1, '#6a5a4a'); P.rect(nx + 14, ny + 8, 6, 1, '#a02020'); P.put(nx + 21, ny + 7, '#a02020');
        // 술 선반 (벽) + 카운터 (오른쪽 위, ㄱ자)
        P.box(240, top + 3, 64, 3, WOOD); P.box(240, top + 12, 64, 3, WOOD);
        [[244, '#2e5a3a'], [250, '#5a3a22'], [258, '#2e5a3a'], [270, '#6a2a2a'], [280, '#2e4a5a'], [292, '#5a3a22'], [298, '#2e5a3a']].forEach(([bx, c], i) => { const y = i % 2 ? top + 6 : top - 3 + 3; P.rect(bx - 1, y - 1, 4, 7, K); P.rect(bx, y + 1, 2, 5, c); P.put(bx, y + 1, '#e8f0e0'); P.rect(bx, y - 1, 2, 2, '#4a3a2a'); });
        for (const bx of [252, 286]) { P.rect(bx - 1, top + 6 + 9 - 4, 6, 5, K); P.rect(bx, top + 6 + 9 - 3, 4, 3, '#8a7a5a'); }
        P.box(234, RY0 + 8, 72, 11, { t: '#7e5e44', m: '#5e4430', d: '#33241a' }); P.rect(234, RY0 + 8, 72, 3, '#8e6e50'); P.rect(234, RY0 + 19, 72, 4, '#2a1e14');
        for (let x = 238; x < 304; x += 10) P.rect(x, RY0 + 12, 1, 7, '#3e2c1e');
        P.box(294, RY0 + 19, 12, 28, { t: '#7e5e44', m: '#5e4430', d: '#33241a' }); P.rect(294, RY0 + 19, 12, 3, '#8e6e50');
        P.spr(['.kk.', 'kggk', 'kggk', '.kk.'], { k: '#2a1e14', g: '#cfc0a0' }, 250, RY0 + 6); // 잔
        // 다락 (왼쪽 위): 판자 바닥 + 난간 + 들보 + 사다리
        const lw = 66, lh = 36;
        planks(P, RX0, RY0 - 2, RX0 + lw, RY0 + lh, { a: '#6a4c38', b: '#62452f', c: '#5a3e2a', gap: '#2e1e12', hi: '#765840', nail: '#9a8a7a', grain: '#4a3424' }, 8);
        P.rect(RX0, RY0 + lh, lw, 6, '#46321f'); P.rect(RX0, RY0 + lh, lw, 1, '#7e5e44'); P.rect(RX0, RY0 + lh + 6, lw, 1, K); P.rect(RX0 + lw, RY0 - 2, 1, lh + 9, K);
        for (let x = RX0 + 3; x < RX0 + lw; x += 7) P.rect(x, RY0 + lh + 1, 1, 5, '#33241a');
        for (const px of [RX0 + 6, RX0 + lw - 7]) { P.rect(px - 1, RY0 + lh + 7, 6, 14, K); P.rect(px, RY0 + lh + 7, 4, 13, '#3a2a1e'); P.rect(px, RY0 + lh + 7, 1, 13, '#5a4230'); }
        for (let x = RX0 + lw - 1; x > RX0 + lw - 3; x--) P.rect(x, RY0 - 2, 1, lh + 2, '#33241a');
        for (let y = RY0 + lh - 4; y < RY0 + lh + 26; y++) { const lx = RX0 + 44; P.put(lx - 1, y, K); P.put(lx, y, '#7e5e44'); P.put(lx + 9, y, '#7e5e44'); P.put(lx + 10, y, K); if ((y - RY0) % 5 === 0) { P.rect(lx + 1, y, 8, 1, '#6e5038'); P.rect(lx + 1, y + 1, 8, 1, '#3a2a1e'); } }
        P.rect(RX0 + 8, RY0 + 6, 18, 9, '#4a3a5a'); P.rect(RX0 + 8, RY0 + 6, 18, 1, '#5e4e70'); P.rect(RX0 + 7, RY0 + 5, 20, 1, K); P.rect(RX0 + 7, RY0 + 15, 20, 1, K); // 낡은 담요
        crate(P, RX0 + 50, RY0 + 2, 12, 10);
        // 둥근 탁자 + 의자
        const table = (tx, ty) => { P.spr([
          '....tttttttttttt....', '..ttTTTTTTTTTTTTtt..', '.tTTTTTTTTTTTTTTTTt.', 'tTTTTTTTTTTTTTTTTTTt', 'tTTTTTTTTTTTTTTTTTTt', '.dTTTTTTTTTTTTTTTTd.', '..ddTTTTTTTTTTTTdd..', '....dddddddddddd....',
          '........llll........', '........llll........', '........llll........', '......llllllll......'], { t: '#8e6e50', T: '#6e5038', d: '#3a2a1e', l: '#2e2016' }, tx, ty); };
        table(136, 104); table(220, 126);
        const stool = (x, y) => P.spr(['.ssss.', 'sSSSSs', '.dddd.', '.l..l.', '.l..l.', '.l..l.'], { s: '#8e6e50', S: '#6e5038', d: '#3a2a1e', l: '#2e2016' }, x, y);
        stool(128, 114); stool(158, 117); stool(214, 140); stool(240, 122); stool(146, 98);
        P.spr(['.l..l.', '.l..l.', '.l..l.', '.dddd.', 'sSSSSs', '.ssss.'], { s: '#8e6e50', S: '#6e5038', d: '#3a2a1e', l: '#2e2016' }, 184, 146); // 엎어진 의자
        // 깨진 술병 · 탁자 위 잔
        for (const [x, y, c] of [[166, 132, '#2e5a3a'], [171, 135, '#3a6a48'], [162, 136, '#2e5a3a'], [168, 138, '#8ab09a'], [200, 120, '#6a2a2a'], [204, 123, '#8a3a3a']]) P.put(x, y, c);
        P.spr(['.g.', '.g.', 'ggg', 'gGg', 'GGG'], { g: '#2e5a3a', G: '#1e3a26' }, 142, 102);
        P.spr(['kk', 'gg'], { k: '#2a1e14', g: '#cfc0a0' }, 228, 127);
        // 통 · 상자 더미 (아래)
        barrel(P, 80, 148); barrel(P, 92, 152); barrel(P, 84, 136);
        crate(P, 268, 150, 16, 13); crate(P, 284, 154, 13, 10, WOOD2); crate(P, 272, 139, 12, 10, WOOD2);
        // 걸린 등불
        P.rect(132, top + 3, 1, 5, '#2a2228'); P.spr(['.kkk.', 'kOoOk', 'koYok', 'kOoOk', '.kkk.'], { k: '#2a2228', o: '#e0a040', O: '#a05820', Y: '#ffe9a0' }, 130, top + 8);
        // 쪽문 (오른쪽 벽, 반쯤 열림)
        P.rect(RX1 - 1, CY - 14, 9, 28, '#141218'); for (let y = 0; y < 26; y++) { P.put(RX1 + 8, CY - 13 + y, '#6a4c34'); P.put(RX1 + 9, CY - 13 + y, '#4e3626'); P.put(RX1 + 10, CY - 13 + y, '#3a2a1e'); P.put(RX1 + 11, CY - 13 + y, K); }
        P.rect(RX1, CY - 15, 7, 1, '#2a1e14'); P.rect(RX1, CY + 14, 7, 1, '#2a1e14'); P.put(RX1 + 9, CY, '#9a9aa4');
      },
      lights: [{ x: 212, y: 56, r: 54, a: 0.5, c: [240, 150, 100], sy: 0.8 }, { x: 132, y: 34, r: 34, a: 0.4, c: [240, 170, 90] }, { x: 330, y: 110, r: 30, a: 0.18, c: [120, 120, 160] }],
      labels: [['다락 · 사다리', 104, 34], ['찢긴 의뢰 게시판', 162, 14], ['술 선반 · 카운터', 270, 14], ['깨진 술병', 168, 146], ['통 · 상자 더미', 96, 170], ['뒷골목 쪽문', 300, 86]],
    },

    // ============================================================ 3. 세리안 · 외딴 관측탑 (둥근 방)
    mage: {
      name: '외딴 관측탑', who: '세리안', amb: 0.4,
      sleep: [236, 138], exit: [192, 166], exitDir: 's',
      draw(P) {
        const ecx = CX, ecy = 114, erx = 118, ery = 64;
        const inE = (x, y) => ((x + 0.5 - ecx) / erx) ** 2 + ((y + 0.5 - ecy) / ery) ** 2 <= 1;
        P.rect(0, 0, GW, GH, K);
        // 둥근 벽 윗면 (원 바깥 띠)
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const d = ((x + 0.5 - ecx) / (erx + 8)) ** 2 + ((y + 0.5 - ecy) / (ery + 8)) ** 2; if (d <= 1 && !inE(x, y)) P.put(x, y, h2(x >> 2, y >> 2, 81) < 0.5 ? '#4a4554' : '#45404e'); if (d <= 1 && d > 0.96) P.put(x, y, K); }
        // 바닥 판석 (원 안)
        const F = Grid(); flagstones(F, 0, 0, GW, GH, { a: '#46424f', b: '#423e4a', c: '#3e3a46', gap: '#24222c', hi: '#524e5c', speck: '#5a5668' }, 3, 12, 8);
        const fd = F.g.getImageData(0, 0, GW, GH).data;
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (inE(x, y)) { const i = (y * GW + x) * 4; P.put(x, y, `rgb(${fd[i]},${fd[i + 1]},${fd[i + 2]})`); }
        // 윗쪽 호를 따라 그을린 책장 (벽 면)
        const wallTop = x => { const t = (x + 0.5 - ecx) / erx; return Math.abs(t) > 1 ? null : Math.round(ecy - ery * Math.sqrt(1 - t * t)); };
        for (let x = ecx - erx; x < ecx + erx; x++) { const yb = wallTop(x); if (yb == null) continue; const hgt = Math.round(24 * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - ecx) / erx) ** 2)) ** 0.5);
          for (let y = yb - hgt; y < yb; y++) { const ly = (yb - y), shelf = ly % 8 === 0; let c = '#2a2018';
            if (shelf) c = '#5a4230'; else { const col = Math.floor((x - ecx + 200) / 2), sh = Math.floor(ly / 8), v = h2(col, sh, 9), burnt = h2(col >> 2, sh, 12) < 0.32, gap = h2(col, sh, 13) < 0.12, bh = 4 + Math.floor(h2(col, sh, 10) * 3);
              if (!gap && (ly % 8) <= bh) c = (ly % 8) === bh ? (burnt ? '#100c0e' : '#a89a80') : burnt ? (v < 0.5 ? '#1a1416' : '#2a2022') : ['#7a2a2a', '#2e4a6a', '#6a5a2a', '#3a6a3a', '#5a3a6a', '#8a7a4a'][Math.floor(v * 6)]; }
            P.put(x, y, c); }
          P.put(x, yb - hgt - 1, K); P.put(x, yb, '#1a1418'); }
        for (const px of [-90, -45, 45, 90]) { const x = ecx + px, yb = wallTop(x); P.rect(x, yb - 26, 3, 26, '#3a2a1e'); P.rect(x, yb - 26, 1, 26, '#5a4230'); }
        // 가는 창 (황혼 하늘)
        const wx = ecx - 6, wy = wallTop(ecx) - 25;
        P.rect(wx - 2, wy - 1, 16, 26, K);
        for (let y = 0; y < 24; y++) for (let x = 0; x < 12; x++) { const t = y / 24, c = t < 0.3 ? '#3a2650' : t < 0.55 ? ((x + y) & 1 ? '#3a2650' : '#7a3a5a') : t < 0.8 ? ((x + y) & 1 ? '#c0604a' : '#7a3a5a') : '#e08a50'; if (Math.hypot(x + 0.5 - 6, y - 6) > 6 && y < 6) continue; P.put(wx + x, wy + y, c); }
        P.put(wx + 3, wy + 5, '#ffe9a0'); P.put(wx + 8, wy + 9, '#e0d0b0'); P.put(wx + 6, wy + 3, '#e0d0b0');
        // 바닥 별자리 상감 (놋쇠 원)
        const sx = ecx, sy = 132, R = 42, Ry = 20;
        for (let a = 0; a < 720; a++) { const r = a / 720 * Math.PI * 2; P.put(Math.round(sx + Math.cos(r) * R), Math.round(sy + Math.sin(r) * Ry), '#a07a30'); P.put(Math.round(sx + Math.cos(r) * (R - 5)), Math.round(sy + Math.sin(r) * (Ry - 3)), '#6a4c20'); }
        for (let k = 0; k < 12; k++) { const r = k / 12 * Math.PI * 2; P.line(Math.round(sx + Math.cos(r) * (R - 5)), Math.round(sy + Math.sin(r) * (Ry - 3)), Math.round(sx + Math.cos(r) * R), Math.round(sy + Math.sin(r) * Ry), '#e0b040'); }
        const stars = [[-22, -9], [-10, -13], [2, -6], [14, -11], [24, -3], [8, 6], [-12, 8], [-24, 2]];
        for (let i = 0; i < stars.length - 1; i++) P.line(sx + stars[i][0], sy + stars[i][1], sx + stars[i + 1][0], sy + stars[i + 1][1], '#5a4422');
        stars.forEach(([x, y]) => { P.put(sx + x, sy + y, '#ffe9a0'); P.put(sx + x + 1, sy + y, '#e0b040'); P.put(sx + x, sy + y + 1, '#9a7028'); });
        // 망원경 (큰 놋쇠 통 + 삼각대) — 창을 향함
        const t0 = [142, 92], t1 = [186, 56];
        for (let i = 0; i <= 44; i++) { const k = i / 44, x = Math.round(t0[0] + (t1[0] - t0[0]) * k), y = Math.round(t0[1] + (t1[1] - t0[1]) * k), r = i < 6 ? 2 : i > 38 ? 4 : 3;
          for (let j = -r - 1; j <= r + 1; j++) P.put(x, y + j, K);
          for (let j = -r; j <= r; j++) P.put(x, y + j, j === -r ? '#ffe9a0' : j < 0 ? '#e0b040' : j < r ? '#9a7028' : '#5a3c14');
          if (i === 14 || i === 30) for (let j = -r; j <= r; j++) P.put(x, y + j, '#5a3c14'); }
        P.rect(t1[0] + 1, t1[1] - 3, 1, 7, '#c0d8e8'); P.put(t1[0] + 1, t1[1] - 1, '#ffffff'); P.put(t1[0], t1[1] + 1, '#1a1820');
        for (const [x1, y1] of [[148, 96], [172, 98], [164, 92]]) { P.line(162, 76, x1, y1, '#4a3a2a'); P.line(163, 76, x1 + 1, y1, '#2e2016'); }
        P.rect(160, 72, 5, 6, K); P.rect(161, 73, 3, 4, '#5a3c14');
        // 혼천의 (오른쪽 위)
        const ax = 262, ay = 74;
        for (let a = 0; a < 360; a += 2) { const r = a * Math.PI / 180; P.put(Math.round(ax + Math.cos(r) * 9), Math.round(ay + Math.sin(r) * 9), '#c09038'); P.put(Math.round(ax + Math.cos(r) * 9), Math.round(ay + Math.sin(r) * 3), '#9a7028'); P.put(Math.round(ax + Math.cos(r) * 3), Math.round(ay + Math.sin(r) * 9), '#9a7028'); }
        P.rect(ax - 1, ay - 1, 3, 3, '#ffe9a0'); P.rect(ax, ay + 10, 1, 8, '#5a3c14'); P.box(ax - 5, ay + 18, 11, 3, { t: '#9a7028', m: '#6a4c20', d: '#3a2810' });
        // 책상 + 도표 + 촛불 + 쌓인 책
        P.box(232, 104, 48, 14, WOOD); P.rect(232, 104, 48, 3, '#8e6e50'); P.rect(234, 118, 3, 8, '#2e2016'); P.rect(275, 118, 3, 8, '#2e2016'); P.rect(232, 118, 48, 2, '#2a1e14');
        P.rect(236, 105, 20, 11, '#cfc0a0'); P.rect(236, 105, 20, 1, '#e8dcc0'); P.line(238, 113, 253, 107, '#6a5a4a'); P.line(240, 108, 250, 114, '#6a5a4a'); P.put(244, 110, '#a02020'); P.put(249, 112, '#2e4a6a'); for (const [x, y] of [[239, 109], [252, 108], [246, 114]]) P.put(x, y, '#3a2a1e');
        P.rect(262, 106, 7, 6, '#cfc0a0'); P.rect(272, 102, 2, 8, '#e8e0c8'); P.rect(271, 109, 4, 1, '#9a7028'); P.put(272, 100, '#ffd34d'); P.put(272, 101, '#ff9a30');
        for (let i = 0; i < 4; i++) P.box(282, 112 - i * 3, 10, 2, { t: '#9a8a70', m: ['#7a2a2a', '#2e4a6a', '#6a5a2a', '#3a6a3a'][i], d: '#1a1416' });
        // 칠판 (왼쪽 책장 앞, 이젤)
        P.box(92, 66, 30, 20, { t: '#5a4230', m: '#2a3a30', d: '#1e2a22' });
        for (let r = 0; r < 5; r++) for (let x = 95; x < 119; x++) if (h2(x, r, 17) < 0.5) P.put(x, 69 + r * 3, h2(x, r, 18) < 0.3 ? '#a8b8a8' : '#d8e0d4');
        P.line(98, 83, 116, 71, '#e8e0c8'); P.rect(104, 75, 8, 4, '#2a3a30'); P.put(108, 76, '#e8e0c8');
        P.line(96, 86, 92, 98, '#4a3a2a'); P.line(118, 86, 122, 98, '#4a3a2a');
        // 흩어진 책 · 탄 종이
        for (const [x, y, c] of [[118, 112, '#7a2a2a'], [132, 150, '#2e4a6a'], [254, 146, '#6a5a2a'], [102, 128, '#3a6a3a'], [210, 92, '#5a3a6a']]) P.box(x, y, 9, 5, { t: '#9a8a70', m: c, d: '#1a1416' });
        for (const [x, y] of [[150, 112], [214, 150], [226, 132], [110, 142], [176, 104], [200, 112]]) { P.rect(x, y, 4, 3, '#cfc0a0'); P.put(x + 3, y + 2, '#3a2a22'); P.put(x, y, '#1a1416'); }
        blot(P, 124, 120, 14, 6, '#24222c', 4, 0.7);
        // 아래 계단 문
        const by = ecy + ery;
        P.rect(CX - 11, by - 3, 22, 12, K);
        for (let i = 0; i < 4; i++) P.rect(CX - 9 + i, by - 1 + i * 2, 18 - i * 2, 1, ['#4a4554', '#3a3542', '#2e2a36', '#24202a'][i]);
        P.box(CX - 16, by - 8, 4, 14, STN); P.box(CX + 12, by - 8, 4, 14, STN); P.rect(CX - 16, by - 9, 32, 2, '#7e7884'); P.rect(CX - 17, by - 10, 34, 1, K);
      },
      lights: [{ x: 192, y: 40, r: 50, a: 0.42, c: [230, 130, 110], sy: 0.7 }, { x: 272, y: 100, r: 40, a: 0.55, c: [255, 200, 110] }, { x: 192, y: 132, r: 40, a: 0.18, c: [255, 220, 140] }],
      labels: [['그을린 책장', 112, 50], ['가는 창', 192, 22], ['망원경', 150, 64], ['혼천의', 262, 56], ['별자리 도표 책상', 256, 92], ['수식 칠판', 107, 62], ['바닥 별자리 상감', 192, 158], ['계단 문', 192, 192]],
    },

    // ============================================================ 4. 미레아 · 종이 멈춘 수도원
    priest: {
      name: '종이 멈춘 수도원', who: '미레아', amb: 0.42,
      sleep: [192, 96], exit: [192, 166], exitDir: 's',
      draw(P) {
        roomShell(P, 28, { t: '#6a6572', m: '#55505e', d: '#34303c' });
        const top = RY0 - 28;
        for (let y = RY1 + 7; y < GH; y++) for (let x = 0; x < GW; x++) { const v = h2(x, y, 91); P.put(x, y, v < 0.5 ? '#141a14' : '#18201a'); }
        // 바닥: 두 색 큰 돌판
        for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) { const tx = Math.floor((x - RX0) / 14), ty = Math.floor((y - RY0) / 9), lx = (x - RX0) % 14, ly = (y - RY0) % 9;
          let c = (tx + ty) & 1 ? '#524e5c' : '#5c5866'; if (lx === 13 || ly === 8) c = '#2e2a36'; else if (ly === 0) c = (tx + ty) & 1 ? '#5e5a68' : '#68636f'; else if (h2(x, y, 51) < 0.04) c = '#423e4a'; P.put(x, y, c); }
        for (const [x0, y0, x1, y1] of [[100, 130, 122, 150], [122, 150, 128, 162], [256, 70, 266, 92], [236, 154, 252, 166]]) P.line(x0, y0, x1, y1, '#26222c');
        // 색유리 빛 웅덩이
        // 해진 붉은 융단 (가운데)
        for (let y = RY0 + 14; y < RY1; y++) for (let x = CX - 13; x < CX + 13; x++) { if (h2(x, y, 52) < 0.05 || (y > 146 && y < 156 && Math.abs(x - CX + 4) < 5 && h2(x, y, 53) < 0.7)) continue;
          const e = x === CX - 13 || x === CX + 12; P.put(x, y, e ? '#9a7028' : (x === CX - 11 || x === CX + 10) ? '#4a1418' : ((x * 3 + y) % 11 === 0 ? '#7a2428' : '#621a20')); }
        wallShadow(P, '#221e28');
        // 윗벽: 높은 돌벽 + 아치 창 셋 (빛바랜 색유리)
        bricks(P, RX0, top, RX1, RY0, { a: '#4e4a58', b: '#46424f', c: '#524e5c', gap: '#26222c', hi: '#5e5a68' }, 5, 10, 5);
        const glass = ['#6a3e52', '#3e526a', '#6a6a3e', '#3e6a52', '#523e6a', '#7a5a3e'];
        for (const wx of [118, CX, 266]) { const ww = 18, wy = top + 2, wh = 23;
          for (let y = -1; y <= wh; y++) for (let x = -1; x <= ww; x++) { const ax = wx - ww / 2 + x, ay = wy + y;
            const ins = x >= 0 && x < ww && y >= 0 && y < wh && (y >= 9 || Math.hypot(x + 0.5 - ww / 2, y + 0.5 - 9) <= ww / 2 - 0.2);
            const out = x >= -1 && x <= ww && y >= -1 && y <= wh && (y >= 9 || Math.hypot(x + 0.5 - ww / 2, y + 0.5 - 9) <= ww / 2 + 1);
            if (ins) { const lead = (x % 6 === 0) || (y % 6 === 2); P.put(ax, ay, lead ? '#1a1820' : glass[(Math.floor(x / 6) * 2 + Math.floor((y + 4) / 6)) % 6]); }
            else if (out) P.put(ax, ay, '#2a2630'); }
          P.rect(wx - ww / 2 - 1, wy + wh, ww + 2, 2, '#7e7884'); P.rect(wx - ww / 2 - 1, wy + wh + 2, ww + 2, 1, K); }
        // 제단 (단 2칸 + 제단석 + 덮개 + 촛대)
        P.box(CX - 36, RY0 + 4, 72, 7, { t: '#77717e', m: '#5e5866', d: '#3a3542' }); P.box(CX - 28, RY0 - 2, 56, 7, { t: '#8e8894', m: '#6a6572', d: '#45404c' });
        P.box(CX - 20, RY0 - 12, 40, 14, { t: '#9a94a0', m: '#77717e', d: '#45404c' });
        P.rect(CX - 20, RY0 - 12, 40, 4, '#d8d0c0'); for (let x = CX - 20; x < CX + 20; x++) { const l = 6 + (h2(x, 0, 54) < 0.4 ? 1 : 0); P.rect(x, RY0 - 8, 1, l, (x & 3) === 0 ? '#a49c8c' : '#c4bcac'); if (h2(x, 1, 55) < 0.3) P.put(x, RY0 - 12, '#9a9488'); }
        P.rect(CX - 3, RY0 - 6, 6, 1, '#c09038'); P.rect(CX - 1, RY0 - 9, 2, 8, '#c09038'); P.put(CX - 1, RY0 - 9, '#ffe9a0');
        for (const cx of [CX - 15, CX + 13]) { P.rect(cx - 1, RY0 - 19, 4, 8, K); P.rect(cx, RY0 - 18, 2, 6, '#e8e0c8'); P.rect(cx - 1, RY0 - 12, 4, 1, '#9a7028'); P.put(cx, RY0 - 19, '#2a2228'); }
        for (const cx of [CX - 46, CX + 44]) P.spr(['..k..', '.ccc.', '.ccc.', 'yyyyy', '..b..', '..b..', '..b..', '..b..', '..b..', '..b..', '..b..', '.bbb.', 'bbbbb'], { k: '#2a2228', c: '#e8e0c8', y: '#c09038', b: '#9a7028' }, cx, RY0 - 4);
        // 신도석 (등받이 + 앉는 판)
        const pew = (x, y, w, br) => {
          P.box(x, y, w, 3, { t: '#8e6e50', m: '#6e5038', d: '#3a2a1e' }); P.box(x, y + 5, w, 4, { t: '#7e5e44', m: '#5e4430', d: '#33241a' }); P.rect(x, y + 9, w, 2, '#2a1e14'); P.rect(x - 1, y + 11, w + 2, 1, K);
          P.rect(x - 1, y - 1, 2, 12, '#46321f'); P.rect(x + w - 1, y - 1, 2, 12, '#46321f');
          if (br) { const bx = x + Math.floor(w * 0.5); P.rect(bx - 1, y - 2, 6, 14, '#524e5c'); for (let j = 0; j < 12; j++) { P.put(bx - 1, y - 1 + j, (j & 1) ? '#8e6e50' : '#3a2a1e'); P.put(bx + 4, y - 1 + j, (j & 1) ? '#3a2a1e' : '#8e6e50'); } } };
        [RY0 + 30, RY0 + 50, RY0 + 70, RY0 + 90, RY0 + 110].forEach((y, i) => { pew(RX0 + 14, y, 78, i === 1 || i === 4); if (i !== 3) pew(CX + 22, y, 78, i === 2); });
        P.spr(['...ssssssss..', '.sSSSSSSSSSs.', 'sSSSSSSSSSSSs', 'l...........l'], { s: '#8e6e50', S: '#5e4430', l: '#2e2016' }, CX + 30, RY0 + 92);
        P.spr(['.ssssss', 'sSSSSSs', 'l.....l'], { s: '#8e6e50', S: '#5e4430', l: '#2e2016' }, CX + 60, RY0 + 96);
        // 쓰러진 종 (오른쪽 아래) + 끊긴 줄
        const bx = 262, by = 148;
        P.spr([
          '.....oooooo.....', '...ooOOOOOOoo...', '..oOOyyyyyyOOo..', '.oOyyYYyyyyyyOo.', '.oOyYYyyyyyyyOo.', 'oOyyYyyyyyyyyyOo', 'oOyyyyyyyyyyyyOo', 'oOyyyyyyyyyyyyOo', 'oOOyyyyyyyyyyOOo', '.oooOOOOOOOOooo.', '...oooooooooo...',
        ], { o: '#5a3c14', O: '#9a7028', y: '#c09038', Y: '#f0d080' }, bx, by - 6, true);
        P.line(bx + 10, by - 4, bx + 12, by + 2, '#3a2a14'); P.line(bx + 12, by + 2, bx + 10, by + 4, '#3a2a14');
        P.spr(['.kk.', 'kKKk', 'kKKk', '.kk.'], { k: '#1a1416', K: '#5a3c14' }, bx - 5, by + 1);
        for (let i = 0; i < 28; i++) { const x = bx - 8 - i, y = by + 3 + Math.round(Math.sin(i * 0.55) * 2); P.put(x, y, i & 1 ? '#9a8a6a' : '#6a5a3a'); P.put(x, y + 1, '#3a2a1e'); }
        P.line(bx - 2, by + 8, bx - 14, by + 15, '#26222c'); P.line(bx + 18, by + 4, bx + 26, by + 12, '#26222c');
        // 수도원 정문 (아래, 반쯤 열린 두 짝)
        P.rect(CX - 14, RY1 - 1, 28, 8, '#2e261e');
        for (let x = CX - 14; x < CX + 14; x++) for (let y = RY1; y < RY1 + 7; y++) if (h2(x, y, 96) < 0.4) P.put(x, y, '#3a3026');
        for (const s of [-1, 1]) { const x0 = s < 0 ? CX - 22 : CX + 14; P.box(x0, RY1 - 12, 8, 18, STN); P.rect(x0, RY1 - 12, 8, 2, '#9a94a0'); }
        for (const s of [-1, 1]) for (let i = 0; i < 8; i++) { const x = s < 0 ? CX - 14 + i : CX + 13 - i; P.rect(x, RY1 + 1 + Math.floor(i * 0.9), 1, 9, i === 0 ? '#8e6e50' : i & 1 ? '#5e4430' : '#6e5038'); P.put(x, RY1 + 10 + Math.floor(i * 0.9), K); }
      },
      lights: [{ x: 118, y: 40, r: 36, a: 0.32, c: [190, 120, 170] }, { x: 192, y: 40, r: 42, a: 0.38, c: [140, 160, 210] }, { x: 266, y: 40, r: 36, a: 0.32, c: [200, 190, 120] }, { x: 192, y: 205, r: 50, a: 0.35, c: [230, 140, 90] }, { x: 192, y: 92, r: 30, a: 0.22 }],
      labels: [['빛바랜 색유리 창', 118, 8], ['제단 · 꺼진 촛대', 192, 22], ['부서진 신도석', 116, 112], ['줄 끊긴 종', 270, 134], ['해진 융단', 192, 150], ['수도원 정문', 192, 194]],
    },

    // ============================================================ 5. 그레이브 · 이름 없는 묘지 (야외)
    gunner: {
      name: '이름 없는 묘지', who: '그레이브', amb: 0.44,
      sleep: [208, 140], exit: [192, 166], exitDir: 's',
      draw(P) {
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const v = h2(x, y, 61), d = h2(x >> 3, y >> 3, 62); let c = d < 0.22 ? (v < 0.5 ? '#2e2c20' : '#363222') : (v < 0.4 ? '#22301e' : v < 0.8 ? '#263422' : '#2c3e26'); if (v > 0.975) c = '#3e5030'; P.put(x, y, c); }
        for (let i = 0; i < 120; i++) { const x = Math.floor(hash(i * 3.1) * GW), y = Math.floor(hash(i * 5.7) * GH); P.put(x, y, '#3e5634'); P.put(x, y - 1, '#32482c'); if (i % 3 === 0) P.put(x + 1, y - 1, '#32482c'); }
        // 바깥 숲 (울타리 밖 어둡게)
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const o = Math.max(RX0 - 8 - x, x - RX1 - 8, RY0 - 24 - y, 0); if (o > 0 && h2(x, y, 63) < Math.min(1, o / 12 + 0.35)) P.put(x, y, o > 10 ? '#0e120e' : '#141a12'); }
        for (let i = 0; i < 14; i++) { const x = Math.floor(hash(i * 9.1) * GW), y = 6 + Math.floor(hash(i * 2.3) * 10); blot(P, x, y, 10, 8, '#0a0e0a', i + 200, 1.2); }
        // 낮은 돌담 + 쇠 울타리 (위)
        const fy = RY0 - 12;
        for (let x = RX0 - 8; x < RX1 + 8; x++) { const k = Math.floor((x - RX0) / 7); P.rect(x, fy + 4, 1, 8, h2(k, 0, 64) < 0.5 ? '#4e4a56' : '#46424e'); P.put(x, fy + 4, '#625d6a'); P.put(x, fy + 12, K); if ((x - RX0) % 7 === 0) P.rect(x, fy + 4, 1, 8, '#2a2630'); }
        for (let x = RX0 - 6; x < RX1 + 6; x += 4) { P.rect(x, fy - 8, 1, 12, '#2e2c36'); P.put(x, fy - 9, '#5a5866'); P.put(x - 1, fy - 7, K); P.put(x + 1, fy - 7, K); }
        P.rect(RX0 - 8, fy - 4, RX1 - RX0 + 16, 1, '#2e2c36'); P.rect(RX0 - 8, fy, RX1 - RX0 + 16, 1, '#2e2c36');
        for (let y = fy; y < RY1 + 2; y += 5) for (const x of [RX0 - 8, RX1 + 7]) { P.rect(x, y, 2, 3, '#2e2c36'); P.put(x, y, '#5a5866'); P.rect(x - 1, y + 3, 4, 1, K); }
        for (const x of [RX0 - 7, RX1 + 8]) P.rect(x, fy, 1, RY1 - fy + 2, '#24222a');
        // 아래 울타리 + 열린 쇠문 + 흙길
        for (let y = RY1 - 4; y < GH; y++) for (let x = CX - 12; x < CX + 12; x++) if (h2(x, y, 65) < 0.8 - Math.abs(x - CX) / 20) P.put(x, y, h2(x, y, 66) < 0.5 ? '#3e3428' : '#342a20');
        for (let x = RX0 - 8; x < RX1 + 8; x += 4) { if (Math.abs(x - CX) < 15) continue; P.rect(x, RY1 - 6, 1, 10, '#2e2c36'); P.put(x, RY1 - 7, '#5a5866'); }
        P.rect(RX0 - 8, RY1 - 2, CX - 15 - RX0 + 8, 1, '#2e2c36'); P.rect(CX + 15, RY1 - 2, RX1 + 8 - CX - 15, 1, '#2e2c36');
        for (const s of [-1, 1]) { const px = CX + s * 15; P.box(px - 3, RY1 - 12, 6, 16, STN2); P.rect(px - 4, RY1 - 14, 8, 2, '#77717e'); P.rect(px - 4, RY1 - 15, 8, 1, K); }
        for (let i = 0; i < 11; i++) for (const s of [-1, 1]) { const x = CX + s * (12 + i), y = RY1 + i; P.rect(x, y - 8, 1, 10, '#2e2c36'); P.put(x, y - 9, '#5a5866'); if (i % 3 === 0) P.put(x, y - 4, '#5a5866'); }
        // 무덤 줄 (왼쪽): 나무 십자 · 판자 묘비 · 흙 둔덕
        const grave = (x, y, kind, lean) => {
          blot(P, x + 5, y + 15, 9, 4, '#3e3226', x * 3 + y, 1.2); blot(P, x + 5, y + 15, 6, 3, '#4a3c2c', x + y * 7, 1);
          if (kind === 0) P.spr(lean ? ['......ww', '.....wW.', 'wwwwwwww', 'WWWWWWWW', '...wW...', '...wW...', '..wW....', '..wW....', '..wW....', '.wW.....', '.wW.....', '.wW.....'] : ['...ww...', '...wW...', 'wwwwwwww', 'WWWWWWWW', '...wW...', '...wW...', '...wW...', '...wW...', '...wW...', '...wW...', '...wW...', '...wW...'], { w: '#8a7056', W: '#5e4834' }, x + 1, y + 2);
          else if (kind === 1) P.spr(['..wwww..', '.wWWWWw.', 'wWWWWWWw', 'wWnnnnWw', 'wWWWWWWw', 'wWnnnWWw', 'wWWWWWWw', 'wWWWWWWw', 'wWWWWWWw', 'wwwwwwww'], { w: '#7a6450', W: '#56442f', n: '#2e2216' }, x + 1, y + 4);
          else P.spr(['..ssss..', '.sSSSSs.', 'sSSSSSSs', 'sSSmSSSs', 'sSSSSSSs', 'sSSSSSSs', 'sSSSSSSs', 'ssssssss'], { s: '#77717e', S: '#5e5866', m: '#3a3542' }, x + 1, y + 6);
        };
        [[84, 46, 0, 0], [104, 48, 1, 0], [124, 45, 0, 1], [144, 47, 2, 0],
         [86, 76, 1, 0], [106, 78, 0, 0], [126, 75, 0, 0], [146, 77, 0, 1],
         [84, 106, 0, 1], [104, 108, 2, 0], [124, 105, 1, 0],
         [86, 136, 0, 0], [106, 138, 0, 1]].forEach(g => grave(...g));
        // 파 놓은 빈 무덤 + 흙더미 + 꽂힌 삽
        const gx = 206, gy = 104;
        P.rect(gx - 1, gy - 1, 30, 16, K);
        for (let y = 0; y < 14; y++) for (let x = 0; x < 28; x++) P.put(gx + x, gy + y, y < 2 ? '#3a2c1e' : y < 5 ? '#24190f' : '#0e0a08');
        P.rect(gx, gy, 28, 1, '#5a4632'); for (let x = 0; x < 28; x++) if (h2(x, 0, 69) < 0.4) P.put(gx + x, gy + 2, '#3a2c1e');
        for (let y = 0; y < 12; y++) { const w = Math.round(11 * Math.sin((y + 0.5) / 12 * Math.PI)) + 5; for (let x = -w; x <= w; x++) P.put(gx + 46 + x, gy + 1 + y, h2(x, y, 67) < 0.3 ? '#6a5438' : y < 4 ? '#5a4632' : '#46382a'); P.put(gx + 46 - w - 1, gy + 1 + y, K); P.put(gx + 46 + w + 1, gy + 1 + y, K); }
        P.rect(gx + 44, gy - 18, 3, 18, K); P.rect(gx + 45, gy - 18, 1, 17, '#8a6a4a'); P.spr(['hhhhh', 'h...h'], { h: '#6e5038' }, gx + 43, gy - 21);
        P.spr(['sSSSSs', 'sSSSSs', 'sSSSSs', '.sSSs.'], { s: '#6a6a76', S: '#a4a4b0' }, gx + 43, gy - 1);
        // 짜다 만 관 + 널빤지 더미 + 망치
        P.spr([
          '..wwwwwwwwwwwwwwwwww..', '.wWWWWWWWWWWWWWWWWWWw.', 'wWW................WWw', 'wWW................WWw', 'wWW................WWw', 'wWW................WWw', '.wWWWWWWWWWWWWWWWWWWw.', '..dddddddddddddddddd..',
        ], { w: '#8a6a4a', W: '#5e4430', d: '#2a1e14' }, 240, 136);
        for (let y = 138; y < 142; y++) for (let x = 243; x < 259; x++) P.put(x, y, '#1a1210');
        for (let i = 0; i < 5; i++) P.box(270, 156 - i * 3, 30, 2, i % 2 ? WOOD : WOOD2);
        P.put(276, 152, '#9a9aa4'); P.put(290, 149, '#9a9aa4');
        P.spr(['hhh', 'h..', 'l..', 'l..', 'l..'], { h: '#7a7a86', l: '#6e5038' }, 264, 148);
        // 마른 나무 (오른쪽 위)
        const tx = 288, ty = 74;
        P.rect(tx - 2, ty - 26, 6, 30, K); P.rect(tx - 1, ty - 26, 4, 30, '#3a2a22'); P.rect(tx - 1, ty - 26, 1, 30, '#52402e');
        for (const [x0, y0, x1, y1] of [[tx, ty - 18, tx - 14, ty - 32], [tx + 2, ty - 14, tx + 16, ty - 26], [tx - 8, ty - 26, tx - 16, ty - 30], [tx + 10, ty - 21, tx + 12, ty - 34], [tx, ty - 26, tx + 3, ty - 40], [tx - 14, ty - 32, tx - 18, ty - 38]]) { P.line(x0, y0, x1, y1, '#3a2a22'); P.line(x0, y0 + 1, x1, y1 + 1, '#241a14'); P.line(x0, y0 - 1, x1, y1 - 1, K); }
        blot(P, tx + 2, ty + 4, 14, 4, '#141a12', 68, 1.1);
        // 등불 기둥 (빈 무덤 옆)
        P.rect(196, 84, 2, 30, '#2a2228'); P.rect(195, 84, 1, 30, K); P.rect(198, 84, 1, 30, K); P.rect(194, 114, 6, 2, '#2a2228');
        P.spr(['..k..', '.kkk.', 'kOoOk', 'koYok', 'koYok', 'kOoOk', '.kkk.'], { k: '#2a2228', o: '#e0a040', O: '#a05820', Y: '#ffe9a0' }, 194, 78);
      },
      lights: [{ x: 196, y: 82, r: 54, a: 0.55, c: [255, 180, 90] }, { x: 192, y: 0, r: 130, a: 0.16, c: [180, 110, 160], sy: 2.2 }, { x: 192, y: 205, r: 40, a: 0.22, c: [230, 140, 90] }],
      labels: [['낮은 돌담 · 쇠 울타리', 192, 12], ['나무 묘비 줄', 118, 40], ['파 놓은 빈 무덤 · 삽', 232, 92], ['짜다 만 관 · 널빤지', 270, 128], ['등불', 196, 72], ['마른 나무', 290, 32], ['묘지 쪽문', 192, 196]],
    },
  };

  // ---------------------------------------------------------------- 2차: 성채 · 역참 · 관측탑 · 묘지 다시 그림 + 깨어난 대사
  SCENES.priest.line = '…오늘도 대답이 없으시군요.';

  // ---------- 공통 소품 도구
  // 깨진 벽돌 한 장 (윗면 2줄 + 앞면, 모서리 깨짐, 그을음)
  function brickChunk(P, x, y, w, h, seed, soot = 0) {
    const r = n => h2(seed, n, 401);
    const chipL = r(1) < 0.35, chipR = r(2) < 0.45;
    const at = (i, j) => !((chipL && i === 0 && j === 0) || (chipR && i === w - 1 && j <= (r(3) < 0.5 ? 1 : 0)) || (chipR && i === w - 2 && j === 0 && r(4) < 0.4));
    for (let j = -1; j <= h + 2; j++) for (let i = -1; i <= w; i++) if (!at(i, j) || i < 0 || i >= w || j < 0 || j >= h + 2) { if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const a = i + dx, b = j + dy; return a >= 0 && a < w && b >= 0 && b < h + 2 && at(a, b); })) P.put(x + i, y + j, K); }
    for (let j = 0; j < h + 2; j++) for (let i = 0; i < w; i++) { if (!at(i, j)) continue;
      let c;
      if (j === 0) c = i === 0 ? '#aaa4b0' : '#9a94a0'; else if (j === 1) c = '#837d8a';
      else { const v = h2(x + i, y + j, seed); c = i === 0 ? '#77717e' : i === w - 1 ? '#45404c' : j === h + 1 ? '#3a3542' : v < 0.15 ? '#57525e' : v > 0.9 ? '#6e6976' : '#625d6a'; }
      if (soot && j > 1 && h2(i, j, seed + 5) < soot) c = (i + j) & 1 ? '#2e2a34' : '#3a3542';
      if (j === 0 && h2(i, seed, 6) < 0.25) c = '#b4aea6'; // 쌓인 재
      P.put(x + i, y + j, c); }
    if (r(7) < 0.5 && w > 5) { const cx = x + 2 + Math.floor(r(8) * (w - 4)); P.put(cx, y + 2, '#2e2a34'); P.put(cx + 1, y + 3, '#2e2a34'); P.put(cx, y + 4, '#2e2a34'); }
  }
  // 불탄 통나무 (가로): 숯 비늘(칸마다 윗면 밝게) + 갈라진 틈의 불씨 + 나이테 단면 + 쪼개진 끝
  function burntLog(P, x, y, len, th, seed) {
    const cap = Math.round(th * 0.5);
    for (let i = -2; i < len + 6; i++) for (let j = 0; j < 3; j++) if ((i + j) & 1 || j === 0) P.put(x + i, y + th + j, '#14101a');
    // 비늘 칸 나누기: 줄(높이 3~4) × 칸(폭 4~7), 줄마다 어긋남
    const bands = []; for (let j = 0, k = 0; j < th; k++) { const h = 3 + (h2(k, 0, seed) < 0.5 ? 1 : 0); bands.push([j, Math.min(th, j + h)]); j += h; }
    const splitEnd = len - 10;
    for (let bi = 0; bi < bands.length; bi++) {
      const [j0, j1] = bands[bi];
      let i = cap - 2 - Math.floor(h2(bi, 1, seed) * 5), k = 0;
      while (i < len) { const w = 4 + Math.floor(h2(bi, k, seed + 1) * 4), glow = h2(bi, k, seed + 2) < 0.18;
        for (let jj = j0; jj < j1; jj++) for (let ii = i; ii < i + w; ii++) {
          if (ii < cap - 1 || ii >= len) continue;
          const t = jj / (th - 1), edgeL = ii === i, edgeB = jj === j1 - 1, topRow = jj === j0;
          let c = t < 0.15 ? '#4a3c34' : t < 0.35 ? '#3a2e28' : t < 0.6 ? '#2c221c' : t < 0.82 ? '#20170f' : '#150e0a';
          if (topRow) c = t < 0.35 ? '#5e4e44' : t < 0.6 ? '#44362e' : '#2e241c';
          if (edgeL || edgeB) c = glow && t > 0.15 && t < 0.85 ? (h2(ii, jj, seed) < 0.5 ? '#ff7a28' : '#d03018') : '#0c0706';
          if (t < 0.15 && !edgeL && h2(ii, jj, seed + 3) < 0.4) c = '#8a8480';
          if (ii >= splitEnd) { const tipDepth = len - ii; if (h2(jj, 0, seed + 4) * 10 > tipDepth + 1) continue; }
          P.put(x + ii, y + jj, c);
        }
        i += w; k++; }
    }
    // 위·아래 외곽선
    for (let ii = cap - 1; ii < len; ii++) { P.put(x + ii, y - 1, K); P.put(x + ii, y + th, K); }
    // 쪼개진 끝: 덜 탄 속살 가시
    for (let jj = 0; jj < th; jj++) { const tip = splitEnd + Math.floor(h2(jj, 0, seed + 4) * 10) + 2; const reach = Math.min(len + 4, tip + (jj % 3 === 1 ? 3 : 0));
      for (let ii = splitEnd - 1; ii < reach; ii++) { if (ii < len - 9 + Math.floor(h2(jj, 0, seed + 4) * 10) - 1) continue; P.put(x + ii, y + jj, ii === reach - 1 ? '#c0a070' : (jj & 1) ? '#9a7a54' : '#7a5a3c'); }
      P.put(x + reach, y + jj, K); }
    // 나이테 단면
    const cw = cap + 2;
    for (let j = -1; j <= th; j++) for (let i = -1; i <= cw; i++) {
      const dx = (i + 0.5 - cw / 2) / (cw / 2), dy = (j + 0.5 - th / 2) / (th / 2), d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1.1) continue; if (d > 0.96) { P.put(x + i - 2, y + j, K); continue; }
      const ring = Math.floor(d * 5); P.put(x + i - 2, y + j, d > 0.8 ? (h2(i, j, seed) < 0.3 ? '#d03018' : '#1a1210') : ring === 0 ? '#3a2a1e' : ring % 2 ? '#a0805a' : '#7a5a40');
    }
    for (let j = 2; j < th - 2; j += 3) P.put(x + Math.floor(cw / 2) - 2 + (j % 2), y + j, '#2a1e18'); // 갈라진 금
    // 작은 불꽃
    for (const fx of [Math.floor(len * 0.32), Math.floor(len * 0.66)]) P.spr(['..y..', '.yYy.', '.oyo.', 'roYor', '.rrr.'], { y: '#ffd34d', Y: '#ffffff', o: '#ff7a28', r: '#d03018' }, x + fx, y - 4, false);
  }

  // ============================================================ 1. 알드릭 · 불탄 변경 성채 (비석 없음)
  SCENES.knight = {
    name: '불탄 변경 성채', who: '알드릭', amb: 0.42, line: '…맹세를 지켜야 해.',
    sleep: [170, 138], exit: [192, 166], exitDir: 's',
    draw(P) {
      roomShell(P, 20, { t: '#5e5866', m: '#4a4554', d: '#2e2a36' });
      const top = RY0 - 20;
      for (let y = RY1 + 7; y < GH; y++) for (let x = 0; x < GW; x++) { const v = h2(x, y, 9); P.put(x, y, v < 0.5 ? '#141a14' : v < 0.85 ? '#18201a' : '#1e281c'); }
      for (let y = RY1; y < GH; y++) { const w = 12 + (y - RY1) * 0.6; for (let x = Math.floor(CX - w); x < CX + w; x++) if (h2(x, y, 4) < 0.9 - Math.abs(x - CX) / w * 0.7) P.put(x, y, h2(x, y, 5) < 0.5 ? '#3a3026' : '#2e261e'); }
      flagstones(P, RX0, RY0, RX1, RY1, { a: '#56515c', b: '#4e4a56', c: '#48444f', gap: '#2a2630', hi: '#625d6a', speck: '#6a6572' }, 1, 12, 8);
      blot(P, 236, 108, 46, 16, '#221e26', 3, 0.85); blot(P, 104, 96, 24, 12, '#2a2630', 4, 0.8); blot(P, 228, 152, 22, 8, '#2e2a34', 5, 0.7);
      blot(P, 170, 134, 26, 9, '#7e7880', 6, 0.8); blot(P, 170, 134, 17, 6, '#9a948c', 7, 0.9); blot(P, 170, 135, 9, 3, '#b0aaa0', 70, 0.9);
      wallShadow(P, '#221e28');
      // 윗벽: 벽돌 + 그을음, 벽돌 단위로 무너진 큰 틈 2곳
      const BW = 12, BH = 6;
      const gaps = [[88, 132, 3], [226, 290, 2]]; // [x0, x1, 무너진 줄 수]
      const lost = (x, y) => { for (const [a, b, n] of gaps) { if (x < a || x >= b) continue; const row = Math.floor((y - top) / BH), off = row % 2 ? BW / 2 : 0, col = Math.floor((x - a + off) / BW), mid = (b - a) / BW / 2;
        const depth = Math.round(n - Math.abs(col - mid) * (n / mid) + h2(col, row, 7) * 1.2); if (row < depth) return true; } return false; };
      for (let y = top; y < RY0; y++) for (let x = RX0; x < RX1; x++) {
        if (lost(x, y)) { P.put(x, y, h2(x, y, 33) < 0.03 ? '#c0b0d0' : y < top + 4 ? '#1c1426' : '#241a30'); continue; }
        const row = Math.floor((y - top) / BH), ly = (y - top) % BH, off = row % 2 ? BW / 2 : 0, lx = (x - RX0 + off) % BW, id = row * 97 + Math.floor((x - RX0 + off) / BW), v = h2(id, 5, 2);
        let c = v < 0.3 ? '#46424e' : v < 0.75 ? '#3e3a46' : '#4c4854';
        if (ly === BH - 1 || lx === BW - 1) c = '#1e1c24'; else if (ly === 0) c = '#56525e'; else if (lx === 0) c = '#4e4a56';
        const s = h2(x >> 2, 0, 11); if (s < 0.4 && y < top + 4 + s * 30 && (((x + y) & 1) || y < top + 5)) c = '#1c181e';
        // 틈 가장자리: 드러난 벽돌 단면
        if (lost(x, y - 1) || lost(x - 1, y) || lost(x + 1, y)) c = ly === 0 || lost(x, y - 1) ? '#8a8490' : '#6a6572';
        if (lost(x, y - 2) && !lost(x, y - 1)) c = '#77717e';
        P.put(x, y, c);
      }
      for (let y = top; y < RY0; y++) for (let x = RX0; x < RX1; x++) if (lost(x, y) && (!lost(x, y + 1) || !lost(x - 1, y) || !lost(x + 1, y))) P.put(x, y, K);
      // 기사단 깃발 2장 (아랫자락 탐)
      for (const bx of [144, 200]) { // 벽이 뚫리지 않은 구간(132~226)에만
        P.rect(bx - 3, top + 1, 26, 3, '#2a2228'); P.rect(bx - 4, top + 1, 1, 3, K); P.rect(bx + 23, top + 1, 1, 3, K); P.put(bx - 3, top + 1, '#4a4248');
        for (let x = 0; x < 20; x++) { const len = 22 + Math.floor(h2(x, bx, 2) * 4) - (x > 11 ? Math.floor(h2(x, bx, 3) * 9) : 0) - (x < 4 ? Math.floor(h2(x, bx, 5) * 4) : 0);
          for (let y = 0; y < len; y++) { const c = y >= len - 2 ? '#2a1014' : x === 0 ? '#9a3030' : x === 19 ? '#3e0e14' : x === 1 ? '#7a2024' : (y % 6 === 5 ? '#4e0e14' : '#621418'); P.put(bx + x, top + 4 + y, c); }
          P.put(bx + x, top + 4 + len, K); if (h2(x, bx, 4) < 0.35) P.put(bx + x, top + 3 + len, '#d03018'); if (h2(x, bx, 6) < 0.12) P.put(bx + x, top + 2 + len, '#ff7a28'); }
        P.rect(bx - 1, top + 4, 1, 24, K); P.rect(bx + 20, top + 4, 1, 24, K);
        const ex = bx + 10, ey = top + 13;
        for (let a = 0; a < 8; a++) { const r = a / 8 * Math.PI * 2; P.put(ex + Math.round(Math.cos(r) * 5), ey + Math.round(Math.sin(r) * 5), '#9a7028'); P.put(ex + Math.round(Math.cos(r) * 6), ey + Math.round(Math.sin(r) * 6), a % 2 ? '#6a4c20' : '#9a7028'); }
        P.rect(ex - 2, ey - 2, 5, 5, '#c09038'); P.rect(ex - 1, ey - 2, 3, 1, '#e0b040'); P.rect(ex - 2, ey + 3, 1, 3, '#6a4c20'); P.rect(ex + 1, ey + 3, 1, 5, '#6a4c20');
      }
      // 무너진 벽돌 더미: 왼쪽 위 (큰 더미) · 오른쪽 위 (중간 더미) — 뒤에서 앞으로 쌓음
      const pile = (cx, cy, rows, seed) => {
        rows.forEach((n, ri) => { const w = n * 11; for (let k = 0; k < n; k++) { const bw = 9 + Math.floor(h2(k, ri, seed) * 4), bh = 3 + Math.floor(h2(k, ri, seed + 1) * 2);
          const bx = Math.round(cx - w / 2 + k * 11 + h2(k, ri, seed + 2) * 3), by = cy - (rows.length - 1 - ri) * 4 + ri * 2 + Math.floor(h2(k, ri, seed + 3) * 2);
          brickChunk(P, bx, by, bw, bh, seed * 31 + ri * 7 + k, h2(k, ri, seed + 4) < 0.4 ? 0.5 : 0); } });
      };
      blot(P, 108, 66, 30, 9, '#2a2630', 41, 0.9);
      pile(108, 58, [2, 3, 4, 3], 11);
      for (const [x, y, s] of [[80, 74, 1], [138, 70, 2], [126, 80, 3], [92, 84, 4]]) brickChunk(P, x, y, 7, 3, 500 + s, 0.3);
      blot(P, 262, 62, 26, 7, '#2a2630', 42, 0.9);
      pile(262, 54, [2, 3, 3], 23);
      for (const [x, y, s] of [[236, 66, 5], [290, 70, 6], [246, 74, 7]]) brickChunk(P, x, y, 6, 3, 600 + s, 0.4);
      // 흩어진 낱장 벽돌 몇 개
      for (const [x, y, s] of [[204, 82, 8], [130, 120, 9], [276, 140, 10], [96, 150, 11]]) brickChunk(P, x, y, 7, 3, 700 + s, 0.2);
      // 불탄 큰 통나무 (가운데 오른쪽, 가로로 쓰러짐) + 작은 동강
      burntLog(P, 204, 88, 84, 18, 51);
      burntLog(P, 100, 106, 34, 11, 52);
      // 부서진 무기걸이 (오른쪽 아래) + 기댄 방패
      const wx = 252, wy = 124;
      P.box(wx, wy + 14, 30, 3, WOOD2); P.rect(wx + 2, wy + 17, 2, 5, '#33241a'); P.rect(wx + 26, wy + 17, 2, 5, '#33241a');
      for (const [x, h, br] of [[4, 22, 0], [10, 22, 1], [16, 22, 0], [22, 13, 1]]) { P.rect(wx + x - 1, wy + 16 - h, 3, h + 1, K); P.rect(wx + x, wy + 16 - h, 1, h, '#6e5038'); if (!br) { P.rect(wx + x - 1, wy + 13 - h, 3, 4, K); P.put(wx + x, wy + 13 - h, '#c0c0cc'); P.put(wx + x, wy + 14 - h, '#9a9aa4'); P.put(wx + x, wy + 15 - h, '#6a6a76'); } else P.put(wx + x, wy + 16 - h, '#3a2a1e'); }
      P.spr(['.ssssss.', 'sSSSSSSs', 'sSRRRRSs', 'sSRYYRSs', 'sSRRRRSs', 'sSSSSSSs', '.sSSSSs.', '..sSSs..', '...ss...'], { s: '#4a4856', S: '#6a6876', R: '#5e1218', Y: '#9a7028' }, wx + 32, wy + 6);
      // 투구 · 깨진 방패
      P.spr(['.kkkk.', 'kHHHHk', 'kHnnHk', 'kHHHHk', '.kkkk.'], { k: '#4a4856', H: '#8a8a96', n: '#1a1820' }, 140, 150);
      P.spr(['.rrr', 'rRRr', 'rRY.', 'rR..'], { r: '#4a4856', R: '#5e1218', Y: '#9a7028' }, 222, 150);
      for (const [x, y] of [[196, 132], [160, 142], [184, 140], [120, 128]]) { P.put(x, y, '#ff7a28'); P.put(x + 1, y, '#d03018'); }
      // 부서진 성문 (아래 가운데)
      P.rect(CX - 16, RY1 - 1, 32, 8, '#2e261e'); for (let x = CX - 16; x < CX + 16; x++) for (let y = RY1; y < RY1 + 7; y++) if (h2(x, y, 31) < 0.5) P.put(x, y, '#3a3026');
      for (const px of [CX - 24, CX + 17]) { P.box(px, RY1 - 14, 7, 20, STN); P.rect(px, RY1 - 14, 7, 2, '#9a94a0'); P.rect(px + 2, RY1 - 9, 1, 12, '#4a4554'); }
      P.spr(['wwwwwwwwwwwwwwwwwwwwww', 'WWWWWWWWWWWWWWWWWWWWWW', 'wiwwwwwwwwwwwwwwwwwwiw', 'WWWWWWWWWWWWWWWWWWWWWW', 'wwwwwwwwwwwwwwwwwwwwww', 'WWWWWWWWWWWWWWWWWWWWWW', 'wiwwwwwwwwwwwwwwwwwwiw', 'WWWWWWWWWWWWWWWWWWWWWW'], { w: '#3a2c22', W: '#2a2018', i: '#5e5e6a' }, CX + 8, RY1 + 10);
      P.rect(CX + 22, RY1 + 10, 8, 8, '#1a1210'); P.put(CX + 26, RY1 + 11, '#d03018'); P.put(CX + 24, RY1 + 13, '#ff7a28');
    },
    lights: [{ x: 246, y: 98, r: 48, a: 0.55, c: [255, 120, 50] }, { x: 119, y: 110, r: 26, a: 0.35, c: [255, 120, 50] }, { x: 110, y: 22, r: 40, a: 0.3, c: [160, 120, 210] }, { x: 258, y: 22, r: 40, a: 0.3, c: [160, 120, 210] }, { x: 192, y: 205, r: 60, a: 0.4, c: [230, 140, 90] }, { x: 170, y: 134, r: 30, a: 0.22, c: [230, 210, 180] }],
    labels: [['무너진 성벽 · 벽돌 더미', 108, 40], ['기사단 깃발', 182, 54], ['불탄 통나무', 246, 86], ['부서진 무기걸이', 272, 148], ['부서진 성문', 192, 196]],
  };

  // ============================================================ 2. 네로 · 버려진 역참 (더 작은 방, 출구 6시)
  SCENES.ranger = {
    name: '버려진 역참', sub: '단군의 은신처', who: '네로', amb: 0.44, line: '…피 냄새가 나.',
    room: [96, 56, 288, 164],
    sleep: [116, 78], exit: [192, 156], exitDir: 's',
    draw(P) {
      roomShell(P, 22, { t: '#5a4434', m: '#45342a', d: '#2a1e18' });
      const top = RY0 - 22, cx = (RX0 + RX1) / 2;
      // 문 밖 골목 (아래)
      for (let y = RY1 + 7; y < GH; y++) for (let x = 0; x < GW; x++) { const gx = x % 9, gy = y % 6, v = h2(x, y, 41); P.put(x, y, gx === 0 || gy === 0 ? '#121016' : v < 0.5 ? '#1e1c24' : '#24222a'); }
      planks(P, RX0, RY0, RX1, RY1, { a: '#5a4230', b: '#523a28', c: '#4a3424', gap: '#26180e', hi: '#664c38', nail: '#8a7a6a', grain: '#3e2c1e' }, 2);
      blot(P, 236, 146, 22, 8, '#3a2a1c', 3, 0.5); blot(P, 160, 150, 16, 6, '#34241a', 4, 0.6);
      wallShadow(P, '#22160e');
      // 윗벽
      for (let y = top; y < RY0; y++) for (let x = RX0; x < RX1; x++) { const v = h2(x, y, 6); P.put(x, y, v < 0.12 ? '#54463a' : v < 0.9 ? '#605242' : '#6a5a4a'); }
      for (let x = RX0; x < RX1; x++) for (let y = top; y < RY0; y++) if (h2(x >> 1, y >> 1, 7) < 0.07) P.put(x, y, '#463a30');
      P.rect(RX0, top + 7, RX1 - RX0, 3, '#3a2a1e'); P.rect(RX0, top + 7, RX1 - RX0, 1, '#4e3a2a'); P.rect(RX0, top + 10, RX1 - RX0, 1, K);
      for (let x = RX0 + 2; x < RX1; x += 32) { P.rect(x, top, 5, 22, '#3a2a1e'); P.rect(x, top, 1, 22, '#4e3a2a'); P.rect(x + 4, top, 1, 22, '#24180f'); }
      P.rect(RX0, RY0 - 2, RX1 - RX0, 2, '#2a1e14');
      // 덧문 부서진 창
      const wx = 196, wy = top + 3;
      P.rect(wx - 1, wy - 1, 26, 16, K); for (let y = 0; y < 14; y++) for (let x = 0; x < 24; x++) P.put(wx + x, wy + y, y < 5 ? '#e8a070' : y < 9 ? ((x + y) & 1 ? '#c06850' : '#e8a070') : '#8a4a52');
      P.rect(wx + 11, wy, 2, 14, '#2a1e14'); P.rect(wx, wy + 6, 24, 1, '#2a1e14'); P.put(wx + 5, wy + 2, '#ffe0b0');
      for (let y = 0; y < 14; y++) P.rect(wx - 5, wy + y, 4, 1, y % 2 ? '#46321f' : '#5a4230'); P.rect(wx - 6, wy - 1, 1, 16, K);
      P.spr(['ssss', 'Ssss', 'sss.', 'Ss..', 's...'], { s: '#5a4230', S: '#46321f' }, wx + 25, wy + 9);
      // 게시판
      const nx = 150, ny = top + 2;
      P.box(nx, ny, 40, 18, { t: '#6a4c34', m: '#4e3626', d: '#2e2016' });
      for (const [px, py, pw, ph, torn] of [[nx + 3, ny + 3, 8, 9, 0], [nx + 13, ny + 2, 9, 12, 1], [nx + 24, ny + 4, 8, 8, 1], [nx + 33, ny + 3, 5, 7, 0], [nx + 4, ny + 13, 7, 4, 1]]) {
        for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) { if (torn && y > ph - 5 && h2(x, y, px) < 0.4 + (y - ph + 5) * 0.18) continue; P.put(px + x, py + y, y === 0 ? '#e8dcc0' : (x + y) % 7 === 0 ? '#bfb090' : '#cfc0a0'); }
        if (!torn) for (let r = 0; r < 3; r++) P.rect(px + 1, py + 2 + r * 2, pw - 2 - (r & 1), 1, '#6a5a4a');
        P.put(px + (pw >> 1), py, '#8a8a94');
      }
      P.rect(nx + 14, ny + 4, 6, 1, '#6a5a4a'); P.rect(nx + 14, ny + 6, 7, 1, '#6a5a4a'); P.rect(nx + 14, ny + 8, 6, 1, '#a02020'); P.put(nx + 21, ny + 7, '#a02020');
      // 술 선반 (벽) + 카운터 (오른쪽 위, ㄱ자)
      P.box(234, top + 3, 50, 3, WOOD); P.box(234, top + 12, 50, 3, WOOD);
      [[238, '#2e5a3a'], [244, '#5a3a22'], [252, '#2e5a3a'], [262, '#6a2a2a'], [272, '#2e4a5a'], [279, '#5a3a22']].forEach(([bx, c], i) => { const y = i % 2 ? top + 6 : top; P.rect(bx - 1, y - 1, 4, 7, K); P.rect(bx, y + 1, 2, 5, c); P.put(bx, y + 1, '#e8f0e0'); P.rect(bx, y - 1, 2, 2, '#4a3a2a'); });
      P.rect(255, top + 10, 6, 5, K); P.rect(256, top + 11, 4, 3, '#8a7a5a');
      P.box(230, RY0 + 6, 56, 11, { t: '#7e5e44', m: '#5e4430', d: '#33241a' }); P.rect(230, RY0 + 6, 56, 3, '#8e6e50'); P.rect(230, RY0 + 17, 56, 4, '#2a1e14');
      for (let x = 234; x < 284; x += 10) P.rect(x, RY0 + 10, 1, 7, '#3e2c1e');
      P.box(276, RY0 + 17, 10, 22, { t: '#7e5e44', m: '#5e4430', d: '#33241a' }); P.rect(276, RY0 + 17, 10, 3, '#8e6e50');
      P.spr(['.kk.', 'kggk', 'kggk', '.kk.'], { k: '#2a1e14', g: '#cfc0a0' }, 246, RY0 + 4);
      // 다락 (왼쪽 위)
      const lw = 56, lh = 30;
      planks(P, RX0, RY0 - 2, RX0 + lw, RY0 + lh, { a: '#6a4c38', b: '#62452f', c: '#5a3e2a', gap: '#2e1e12', hi: '#765840', nail: '#9a8a7a', grain: '#4a3424' }, 8);
      P.rect(RX0, RY0 + lh, lw, 6, '#46321f'); P.rect(RX0, RY0 + lh, lw, 1, '#7e5e44'); P.rect(RX0, RY0 + lh + 6, lw, 1, K); P.rect(RX0 + lw, RY0 - 2, 1, lh + 9, K);
      for (let x = RX0 + 3; x < RX0 + lw; x += 7) P.rect(x, RY0 + lh + 1, 1, 5, '#33241a');
      for (const px of [RX0 + 5, RX0 + lw - 7]) { P.rect(px - 1, RY0 + lh + 7, 6, 12, K); P.rect(px, RY0 + lh + 7, 4, 11, '#3a2a1e'); P.rect(px, RY0 + lh + 7, 1, 11, '#5a4230'); }
      for (let x = RX0 + lw - 1; x > RX0 + lw - 3; x--) P.rect(x, RY0 - 2, 1, lh + 2, '#33241a');
      for (let y = RY0 + lh - 4; y < RY0 + lh + 24; y++) { const lx = RX0 + 36; P.put(lx - 1, y, K); P.put(lx, y, '#7e5e44'); P.put(lx + 9, y, '#7e5e44'); P.put(lx + 10, y, K); if ((y - RY0) % 5 === 0) { P.rect(lx + 1, y, 8, 1, '#6e5038'); P.rect(lx + 1, y + 1, 8, 1, '#3a2a1e'); } }
      P.rect(RX0 + 6, RY0 + 6, 18, 9, '#4a3a5a'); P.rect(RX0 + 6, RY0 + 6, 18, 1, '#5e4e70'); P.rect(RX0 + 5, RY0 + 5, 20, 1, K); P.rect(RX0 + 5, RY0 + 15, 20, 1, K);
      crate(P, RX0 + 42, RY0 + 2, 11, 9);
      // 둥근 탁자 하나 + 의자
      P.spr([
        '....tttttttttttt....', '..ttTTTTTTTTTTTTtt..', '.tTTTTTTTTTTTTTTTTt.', 'tTTTTTTTTTTTTTTTTTTt', 'tTTTTTTTTTTTTTTTTTTt', '.dTTTTTTTTTTTTTTTTd.', '..ddTTTTTTTTTTTTdd..', '....dddddddddddd....',
        '........llll........', '........llll........', '........llll........', '......llllllll......'], { t: '#8e6e50', T: '#6e5038', d: '#3a2a1e', l: '#2e2016' }, 176, 100);
      const stool = (x, y) => P.spr(['.ssss.', 'sSSSSs', '.dddd.', '.l..l.', '.l..l.', '.l..l.'], { s: '#8e6e50', S: '#6e5038', d: '#3a2a1e', l: '#2e2016' }, x, y);
      stool(168, 110); stool(198, 112); stool(186, 94);
      P.spr(['.l..l.', '.l..l.', '.l..l.', '.dddd.', 'sSSSSs', '.ssss.'], { s: '#8e6e50', S: '#6e5038', d: '#3a2a1e', l: '#2e2016' }, 220, 124);
      P.spr(['.g.', '.g.', 'ggg', 'gGg', 'GGG'], { g: '#2e5a3a', G: '#1e3a26' }, 182, 98);
      for (const [x, y, c] of [[206, 130, '#2e5a3a'], [211, 133, '#3a6a48'], [202, 134, '#2e5a3a'], [208, 136, '#8ab09a']]) P.put(x, y, c);
      // 통 (아래 왼쪽) · 상자 (아래 오른쪽)
      barrel(P, 100, 140); barrel(P, 112, 144); barrel(P, 104, 128);
      crate(P, 258, 140, 15, 12); crate(P, 272, 144, 12, 9, WOOD2); crate(P, 262, 129, 11, 9, WOOD2);
      // 걸린 등불
      P.rect(140, top + 3, 1, 5, '#2a2228'); P.spr(['.kkk.', 'kOoOk', 'koYok', 'kOoOk', '.kkk.'], { k: '#2a2228', o: '#e0a040', O: '#a05820', Y: '#ffe9a0' }, 138, top + 8);
      // 출구: 아래 가운데 쪽문 (안쪽으로 반쯤 열림)
      P.rect(cx - 12, RY1 - 1, 24, 8, '#141218');
      for (const px of [cx - 16, cx + 12]) { P.box(px, RY1 - 6, 4, 12, WOOD); P.rect(px, RY1 - 6, 4, 1, '#8e6e50'); }
      for (let i = 0; i < 9; i++) { P.rect(cx - 12 + i, RY1 - 1 - Math.floor(i * 0.9), 1, 2, '#2a1e14'); }
      P.spr(['wWWWWWWWWw', 'wWWWWWWWWw', 'wWddWWWWWw', 'wWWWWWWWWw'], { w: '#4e3626', W: '#6e5038', d: '#9a9aa4' }, cx - 12, RY1 - 6);
    },
    lights: [{ x: 208, y: 52, r: 48, a: 0.48, c: [240, 150, 100], sy: 0.8 }, { x: 140, y: 40, r: 32, a: 0.4, c: [240, 170, 90] }, { x: 192, y: 190, r: 30, a: 0.18, c: [120, 120, 160] }],
    labels: [['다락 · 사다리', 120, 44], ['찢긴 의뢰 게시판', 170, 24], ['술 선반 · 카운터', 258, 24], ['깨진 술병', 206, 142], ['통', 110, 162], ['상자', 268, 162], ['쪽문', 192, 182]],
  };

  // ============================================================ 3. 세리안 · 외딴 관측탑 (배경 유지, 시설물 다시 그림)
  {
    const base = SCENES.mage.draw;
    SCENES.mage.line = '…하늘이 아직 저물지 않았네요.';
    SCENES.mage.labels = [['그을린 책장', 112, 50], ['가는 창', 192, 22], ['보면대 · 읽던 책', 160, 64], ['혼천의', 262, 50], ['별자리 도표 책상', 256, 94], ['수식 칠판', 107, 58], ['바닥 별자리 상감', 192, 158], ['계단 문', 192, 192]];
    SCENES.mage.draw = function (P) {
      // 배경(둥근 벽·책장·창·바닥·상감)만 기존 그대로: 기존 draw를 돌린 뒤 시설물 자리를 바닥으로 다시 덮는 대신, 시설물 없는 버전을 그린다
      MAGE_BG(P);
      const ecx = CX, ecy = 114;
      if (!window.__noLectern) {
      // ---- 보면대 + 펼친 책: 비스듬한 나무 판 · 기둥 · 세 갈래 발 · 놋쇠 장식 · 책갈피 끈
      const lx = 146, ly = 60;
      P.spr([
        '....kkkkkkkkkkkkkkkkkkkkkkkkkk....',
        '...kppppppppppppkppppppppppppppk..',
        '...kpPPPPPPPPPPPkPPPPPPPPPPPPPpk..',
        '..kpPllllllllPPPkPPlllllllllPPpk..',
        '..kpPPPPPPPPPPPPkPPPPPPPPPPPPPpk..',
        '..kpPlllllllPPPPkPPllllllllPPPpk..',
        '.kpPPPPPPPPPPPPPkPPPPPPPPPPPPPpk..',
        '.kpPllllllllllPPkPPlllllllPPPPpk..',
        '.kpPPPPPPPPPPPPPkPPPPPPPPPPPPPPpk.',
        'kpPlllllllllPPPPkPPllllllllllPPpk.',
        'kpPPPPPPPPPPPPPPkPPPPPPPPPPPPPPpk.',
        'kpppppppppppppppkpppppppppppppppk.',
        'kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk',
        'kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk',
        'kWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWk',
        '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
      ], { k: K, p: '#a89878', P: '#e8dcc0', l: '#8a7a6a', b: '#4e3626', w: '#8e6e50', W: '#5e4430' }, lx, ly, false);
      // 쪽 넘김 그늘 · 삽화 · 책갈피 끈
      for (let j = 1; j < 11; j++) { P.put(lx + 15, ly + j, '#c8bca0'); P.put(lx + 17, ly + j, '#c8bca0'); }
      for (const [a, b] of [[22, 3], [24, 4], [26, 3], [23, 6], [25, 7]]) P.put(lx + a, ly + b, '#6a5a8a');
      P.line(lx + 22, ly + 3, lx + 26, ly + 3, '#9a8ab0');
      P.rect(lx + 16, ly + 12, 1, 9, '#a02020'); P.put(lx + 16, ly + 21, '#6a1414'); P.put(lx + 15, ly + 21, '#a02020');
      // 놋쇠 받침 가장자리 장식
      for (const x of [2, 16, 31]) { P.put(lx + x, ly + 13, '#e0b040'); P.put(lx + x, ly + 14, '#9a7028'); }
      // 기둥 (나선 홈) + 세 갈래 발
      for (let j = 0; j < 20; j++) { const y = ly + 16 + j; P.put(lx + 14, y, K); P.put(lx + 19, y, K); P.put(lx + 15, y, '#8e6e50'); P.put(lx + 16, y, (j % 4 < 2) ? '#6e5038' : '#5e4430'); P.put(lx + 17, y, (j % 4 >= 2) ? '#6e5038' : '#4e3626'); P.put(lx + 18, y, '#3a2a1e'); }
      P.spr(['..kkkkkk..', '.kOYYYYOk.', 'kOOOOOOOOk', '.kkkkkkkk.'], { k: K, O: '#7a5420', Y: '#e0b040' }, lx + 12, ly + 33, false);
      P.spr([
        '......kkkkkkkkkk......', '....kkwWWWWWWWWwkk....', '..kkwWWkkkkkkkkWWwkk..', 'kkwWWkk........kkWWwkk', 'kwWkk............kkWwk', 'kkk................kkk',
      ], { k: K, w: '#8e6e50', W: '#5e4430' }, lx + 6, ly + 36, false);
      blot(P, lx + 17, ly + 42, 14, 3, '#1a1820', 77, 0.9);
      }
      // ---- 혼천의: 두꺼운 고리 + 지구본 + 받침
      const ax = 262, ay = 70;
      const ring = (rx, ry, c1, c2) => { for (let a = 0; a < 720; a++) { const r = a / 720 * Math.PI * 2, x = Math.round(ax + Math.cos(r) * rx), y = Math.round(ay + Math.sin(r) * ry); P.put(x, y, Math.sin(r) < 0 ? c1 : c2); } };
      for (let a = 0; a < 720; a++) { const r = a / 720 * Math.PI * 2; P.put(Math.round(ax + Math.cos(r) * 13), Math.round(ay + Math.sin(r) * 13), K); }
      ring(12, 12, '#f0d080', '#9a7028'); ring(11, 11, '#c09038', '#7a5420');
      ring(12, 4, '#e0b040', '#7a5420'); ring(4, 12, '#c09038', '#6a4c20');
      for (let i = -9; i <= 9; i++) { P.put(ax + i, ay - Math.round(i * 0.55), '#e0b040'); }
      P.spr(['..kkkk..', '.kbBBbk.', 'kbBgBBbk', 'kBggBBbk', 'kbBBgBbk', 'kbbBBbbk', '.kbbbbk.', '..kkkk..'], { k: K, b: '#2e4a6a', B: '#4a6a8a', g: '#5a7a4a' }, ax - 4, ay - 4, false);
      P.rect(ax - 1, ay + 13, 3, 8, K); P.rect(ax, ay + 13, 1, 8, '#9a7028');
      P.spr(['....kkkkk....', '..kkOYYYOkk..', '.kOOOOOOOOOk.', 'kwwwwwwwwwwwk', 'kWWWWWWWWWWWk', '.kkkkkkkkkkk.'], { k: K, O: '#7a5420', Y: '#e0b040', w: '#7a5a40', W: '#4e3626' }, ax - 6, ay + 19, false);
      // ---- 책상: 서랍 달린 책상 + 펼친 책 + 별자리 도표 + 깃펜·잉크병 + 촛불 + 쌓인 책
      const dx = 230, dy = 100;
      P.spr([
        'tttttttttttttttttttttttttttttttttttttttttttttttttt',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
        'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        'fffffffffffffffffffffffffffffffffffffffffffffffffd',
        'fFFFFFFFFFFFFFFFFFFFFFFdfFFFFFFFFFFFFFFFFFFFFFFFFd',
        'fFFFFFFFFFFhhFFFFFFFFFFdfFFFFFFFFFFFhhFFFFFFFFFFFd',
        'fFFFFFFFFFFFFFFFFFFFFFFdfFFFFFFFFFFFFFFFFFFFFFFFFd',
        'ddddddddddddddddddddddddddddddddddddddddddddddddd.',
        'll.............................................ll',
        'll.............................................ll',
        'll.............................................ll',
        'LL.............................................LL',
      ], { t: '#9a7a5a', T: '#7a5a40', e: '#3a2a1e', f: '#6e5038', F: '#5e4430', d: '#33241a', h: '#c09038', l: '#4e3626', L: '#2a1e14' }, dx, dy);
      for (let x = dx + 2; x < dx + 48; x += 5) P.put(x, dy + 3 + (x % 3), '#6a4c34');
      // 별자리 도표 (넓게 펼친 종이)
      P.rect(dx + 3, dy + 1, 20, 6, '#d8c8a4'); P.rect(dx + 3, dy + 1, 20, 1, '#f0e4c8'); P.rect(dx + 2, dy + 1, 1, 6, '#a89878'); P.rect(dx + 23, dy + 1, 1, 6, '#a89878');
      for (const [a, b, c, d] of [[5, 5, 9, 3], [9, 3, 14, 4], [14, 4, 19, 2], [14, 4, 16, 6]]) P.line(dx + a, dy + b, dx + c, dy + d, '#6a5a8a');
      for (const [a, b] of [[5, 5], [9, 3], [14, 4], [19, 2], [16, 6]]) P.put(dx + a, dy + b, '#2e3a6a');
      P.put(dx + 20, dy + 5, '#a02020');
      // 펼친 책
      P.spr(['.pppp.pppp.', 'pPPPPpPPPPp', 'pPllPpPllPp', 'pPPPPpPPPPp', 'ppppp.ppppp'], { p: '#a89878', P: '#e8dcc0', l: '#7a6a5a' }, dx + 25, dy + 1, true);
      // 잉크병 + 깃펜
      P.spr(['.kk.', 'kbbk', 'kbbk', 'kkkk'], { k: K, b: '#1a2a4a' }, dx + 38, dy + 2, false);
      P.line(dx + 40, dy + 2, dx + 44, dy - 4, '#e8e0c8'); P.line(dx + 41, dy + 2, dx + 45, dy - 4, '#b8b0a0');
      // 촛불 (받침 + 녹아 흐른 촛농)
      P.spr(['..y..', '.yYy.', '..o..', '.www.', '.wWw.', 'wwWww', 'wwwWw', 'hhhhh', '.hhh.'], { y: '#ffd34d', Y: '#ffffff', o: '#ff9a30', w: '#e8e0c8', W: '#c8c0a8', h: '#9a7028' }, dx + 45, dy - 7, true);
      // 쌓인 책 (책상 옆 바닥)
      const bookStack = (x, y, cols) => cols.forEach((c, i) => { const w = 12 - (i % 2) * 2, ox = (i % 2); P.rect(x + ox - 1, y - i * 3 - 1, w + 2, 4, K); P.rect(x + ox, y - i * 3, w, 2, c); P.rect(x + ox, y - i * 3, w, 1, '#d8c8a4'); P.put(x + ox, y - i * 3 + 1, '#e8dcc0'); P.put(x + ox + w - 1, y - i * 3 + 1, '#1a1416'); P.put(x + ox + 3, y - i * 3 + 1, '#c09038'); });
      bookStack(282, 118, ['#7a2a2a', '#2e4a6a', '#6a5a2a', '#3a6a3a', '#5a3a6a']);
      bookStack(214, 116, ['#2e4a6a', '#7a2a2a', '#5a3a6a']);
      // ---- 이젤 칠판: 나무 틀 + 분필 도형·수식 + 분필 받침
      const bx = 90, by = 62;
      P.spr([
        '.ffffffffffffffffffffffffffffffff.',
        'fFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd',
        'fFbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbFd',
        'fFbBBBBBBBBBBBBBBBBBBBBBBBBBBBBbFd',
        'fFbBBBBBBBBBBBBBBBBBBBBBBBBBBBBbFd',
        'fFbBBBBBBBBBBBBBBBBBBBBBBBBBBBBbFd',
        'fFbBBBBBBBBBBBBBBBBBBBBBBBBBBBBbFd',
        'fFbBBBBBBBBBBBBBBBBBBBBBBBBBBBBbFd',
        'fFbBBBBBBBBBBBBBBBBBBBBBBBBBBBBbFd',
        'fFbBBBBBBBBBBBBBBBBBBBBBBBBBBBBbFd',
        'fFbBBBBBBBBBBBBBBBBBBBBBBBBBBBBbFd',
        'fFbBBBBBBBBBBBBBBBBBBBBBBBBBBBBbFd',
        'fFbBBBBBBBBBBBBBBBBBBBBBBBBBBBBbFd',
        'fFbBBBBBBBBBBBBBBBBBBBBBBBBBBBBbFd',
        'fFbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbFd',
        'fFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFd',
        'ttttttttttttttttttttttttttttttttttt',
        '.dddddddddddddddddddddddddddddddd.',
      ], { f: '#8e6e50', F: '#6e5038', d: '#3a2a1e', b: '#1e2a22', B: '#2a3a30', t: '#9a7a5a' }, bx, by);
      // 분필: 원·궤도·수식 줄
      const cc = '#d8e0d4', c2 = '#a8b8a8';
      for (let a = 0; a < 360; a += 12) { const r = a * Math.PI / 180; P.put(bx + 9 + Math.round(Math.cos(r) * 5), by + 8 + Math.round(Math.sin(r) * 4), cc); }
      for (let a = 0; a < 360; a += 20) { const r = a * Math.PI / 180; P.put(bx + 9 + Math.round(Math.cos(r) * 2), by + 8 + Math.round(Math.sin(r) * 1.5), c2); }
      P.put(bx + 14, by + 5, '#ffffff'); P.line(bx + 9, by + 8, bx + 14, by + 5, c2);
      for (const [y, l] of [[4, 12], [7, 9], [10, 13]]) for (let i = 0; i < l; i++) if (h2(i, y, 19) < 0.75) P.put(bx + 17 + i, by + y, (i % 4 === 3) ? c2 : cc);
      P.rect(bx + 17, by + 12, 6, 1, cc); P.put(bx + 24, by + 12, '#e8a0a0'); P.put(bx + 25, by + 11, '#e8a0a0'); P.put(bx + 25, by + 13, '#e8a0a0'); // 마지막 항에 붉은 동그라미
      P.rect(bx + 4, by + 16, 3, 1, '#ffffff'); P.rect(bx + 26, by + 16, 4, 1, '#5a5a6a');
      const eleg = (x0, x1) => { P.line(x0, by + 18, x1, by + 34, K); P.line(x0 + 1, by + 18, x1 + 1, by + 34, '#6e5038'); P.line(x0 + 2, by + 18, x1 + 2, by + 34, K); };
      eleg(bx + 3, bx); eleg(bx + 29, bx + 32);
      // ---- 흩어진 책 (펼친 책 · 덮인 책) · 탄 종이
      const closed = (x, y, c) => P.spr(['kkkkkkkkk', 'kpppppppk', 'kCCCCCCck', 'kCCCyCCck', 'kkkkkkkkk'], { k: K, p: '#d8c8a4', C: c, c: '#1a1416', y: '#c09038' }, x, y, false);
      const open = (x, y) => P.spr(['kkkkk.kkkkk', 'kpPPPkPPPpk', 'kplllkPllpk', 'kpPPPkPPPpk', 'kkkkkkkkkkk'], { k: K, p: '#a89878', P: '#e8dcc0', l: '#8a7a6a' }, x, y, false);
      closed(118, 112, '#7a2a2a'); closed(132, 148, '#2e4a6a'); open(254, 146); closed(100, 128, '#3a6a3a'); open(204, 92);
      for (const [x, y] of [[150, 112], [214, 150], [226, 132], [110, 142], [176, 104]]) { P.spr(['pPPp', 'PPPk', 'pPk.'], { p: '#a89878', P: '#cfc0a0', k: '#2a1e18' }, x, y, false); }
      // ---- 계단 문: 돌 아치 + 내려가는 계단
      const by2 = ecy + 64;
      P.rect(CX - 13, by2 - 8, 26, 16, K);
      for (let i = 0; i < 5; i++) { P.rect(CX - 10 + i, by2 - 4 + i * 2, 20 - i * 2, 1, ['#57525e', '#4a4554', '#3a3542', '#2e2a36', '#24202a'][i]); P.rect(CX - 10 + i, by2 - 3 + i * 2, 20 - i * 2, 1, '#18161c'); }
      for (const s of [-1, 1]) for (let j = 0; j < 4; j++) { const x = s < 0 ? CX - 18 : CX + 12; brickChunk(P, x, by2 - 12 + j * 5, 6, 2, 900 + j + s * 9, 0); }
      for (let i = 0; i < 26; i++) { const x = CX - 13 + i, y = by2 - 10 - Math.round(Math.sin((i + 0.5) / 26 * Math.PI) * 4); P.put(x, y, '#8e8894'); P.put(x, y + 1, '#625d6a'); P.put(x, y - 1, K); }
    };
  }
  // 관측탑 배경만 (기존 draw에서 시설물을 뺀 부분)
  function MAGE_BG(P) {
    const ecx = CX, ecy = 114, erx = 118, ery = 64;
    const inE = (x, y) => ((x + 0.5 - ecx) / erx) ** 2 + ((y + 0.5 - ecy) / ery) ** 2 <= 1;
    P.rect(0, 0, GW, GH, K);
    // v2.86 둥근 벽 윗면: 짙은 나무색(줄눈 없이) — 바닥 쪽 테두리 턱(밝은 선 + 그 아래 어두운 선) · 바깥 외곽선
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const d = ((x + 0.5 - ecx) / (erx + 8)) ** 2 + ((y + 0.5 - ecy) / (ery + 8)) ** 2; if (d > 1 || inE(x, y)) continue;
      const lip = inE(x, y - 1) || inE(x - 1, y) || inE(x + 1, y), lip2 = !lip && (inE(x, y - 2) || inE(x - 2, y) || inE(x + 2, y)), row = y >> 2, seam = (y & 3) === 3 || ((x + (row & 1) * 4) % 8) === 0;
      let c = lip ? '#140e0a' : lip2 ? '#9a7048' : (h2(x >> 2, y >> 2, 81) < 0.5 ? '#644229' : '#5e3e27'); void seam;
      if (d > 0.96) c = K; P.put(x, y, c); }
    const F = Grid(); flagstones(F, 0, 0, GW, GH, { a: '#46424f', b: '#423e4a', c: '#3e3a46', gap: '#24222c', hi: '#524e5c', speck: '#5a5668' }, 3, 12, 8);
    const fd = F.g.getImageData(0, 0, GW, GH).data;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (inE(x, y)) { const i = (y * GW + x) * 4; P.put(x, y, `rgb(${fd[i]},${fd[i + 1]},${fd[i + 2]})`); }
    const wallTop = x => { const t = (x + 0.5 - ecx) / erx; return Math.abs(t) > 1 ? null : Math.round(ecy - ery * Math.sqrt(1 - t * t)); };
    for (let x = ecx - erx; x < ecx + erx; x++) { const yb = wallTop(x); if (yb == null) continue; const hgt = Math.round(24 * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - ecx) / erx) ** 2)) ** 0.5);
      for (let y = yb - hgt; y < yb; y++) { const ly = (yb - y), shelf = ly % 8 === 0; let c = '#2a2018';
        if (shelf) c = '#5a4230'; else { const col = Math.floor((x - ecx + 200) / 2), sh = Math.floor(ly / 8), v = h2(col, sh, 9), burnt = h2(col >> 2, sh, 12) < 0.32, gap = h2(col, sh, 13) < 0.12, bh = 4 + Math.floor(h2(col, sh, 10) * 3);
          if (!gap && (ly % 8) <= bh) c = (ly % 8) === bh ? (burnt ? '#100c0e' : '#a89a80') : burnt ? (v < 0.5 ? '#1a1416' : '#2a2022') : ['#7a2a2a', '#2e4a6a', '#6a5a2a', '#3a6a3a', '#5a3a6a', '#8a7a4a'][Math.floor(v * 6)]; }
        P.put(x, y, c); }
      P.put(x, yb - hgt - 1, K); P.put(x, yb, '#1a1418'); }
    for (const px of [-90, -45, 45, 90]) { const x = ecx + px, yb = wallTop(x); P.rect(x, yb - 26, 3, 26, '#3a2a1e'); P.rect(x, yb - 26, 1, 26, '#5a4230'); }
    const wx = ecx - 6, wy = wallTop(ecx) - 25;
    P.rect(wx - 2, wy - 1, 16, 26, K);
    for (let y = 0; y < 24; y++) for (let x = 0; x < 12; x++) { const t = y / 24, c = t < 0.3 ? '#3a2650' : t < 0.55 ? ((x + y) & 1 ? '#3a2650' : '#7a3a5a') : t < 0.8 ? ((x + y) & 1 ? '#c0604a' : '#7a3a5a') : '#e08a50'; if (Math.hypot(x + 0.5 - 6, y - 6) > 6 && y < 6) continue; P.put(wx + x, wy + y, c); }
    P.put(wx + 3, wy + 5, '#ffe9a0'); P.put(wx + 8, wy + 9, '#e0d0b0'); P.put(wx + 6, wy + 3, '#e0d0b0');
    const sx = ecx, sy = 132, R = 42, Ry = 20;
    for (let a = 0; a < 720; a++) { const r = a / 720 * Math.PI * 2; P.put(Math.round(sx + Math.cos(r) * R), Math.round(sy + Math.sin(r) * Ry), '#a07a30'); P.put(Math.round(sx + Math.cos(r) * (R - 5)), Math.round(sy + Math.sin(r) * (Ry - 3)), '#6a4c20'); }
    for (let k = 0; k < 12; k++) { const r = k / 12 * Math.PI * 2; P.line(Math.round(sx + Math.cos(r) * (R - 5)), Math.round(sy + Math.sin(r) * (Ry - 3)), Math.round(sx + Math.cos(r) * R), Math.round(sy + Math.sin(r) * Ry), '#e0b040'); }
    const stars = [[-22, -9], [-10, -13], [2, -6], [14, -11], [24, -3], [8, 6], [-12, 8], [-24, 2]];
    for (let i = 0; i < stars.length - 1; i++) P.line(sx + stars[i][0], sy + stars[i][1], sx + stars[i + 1][0], sy + stars[i + 1][1], '#5a4422');
    stars.forEach(([x, y]) => { P.put(sx + x, sy + y, '#ffe9a0'); P.put(sx + x + 1, sy + y, '#e0b040'); P.put(sx + x, sy + y + 1, '#9a7028'); });
    blot(P, 124, 120, 14, 6, '#24222c', 4, 0.7);
  }

  // ============================================================ 5. 그레이브 · 이름 없는 묘지 (돌벽, 무덤 수를 줄이고 디테일)
  SCENES.gunner = {
    name: '이름 없는 묘지', who: '그레이브', amb: 0.44, line: '…묻을 놈이 하나 남았지.',
    sleep: [204, 144], exit: [192, 166], exitDir: 's',
    draw(P) {
      const top = RY0 - 16;
      // 밖: 어두운 숲
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const v = h2(x, y, 161); P.put(x, y, v < 0.6 ? '#0e120e' : v < 0.9 ? '#121812' : '#162016'); }
      for (let i = 0; i < 26; i++) { const x = Math.floor(hash(i * 9.1) * GW), y = Math.floor(hash(i * 2.3) * GH); if (x > RX0 - 12 && x < RX1 + 12 && y > top - 8 && y < RY1 + 10) continue; blot(P, x, y, 12, 9, '#0a0d0a', i + 300, 1.2); blot(P, x - 2, y - 2, 6, 4, '#1a241a', i + 330, 0.8); }
      // 안: 풀밭
      for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) { const v = h2(x, y, 61), d = h2(x >> 3, y >> 3, 62); let c = d < 0.2 ? (v < 0.5 ? '#2e2c20' : '#363222') : (v < 0.4 ? '#22301e' : v < 0.8 ? '#263422' : '#2c3e26'); if (v > 0.975) c = '#3e5030'; P.put(x, y, c); }
      for (let i = 0; i < 110; i++) { const x = RX0 + Math.floor(hash(i * 3.1) * (RX1 - RX0)), y = RY0 + 2 + Math.floor(hash(i * 5.7) * (RY1 - RY0 - 2)); P.put(x, y, '#3e5634'); P.put(x, y - 1, '#32482c'); if (i % 3 === 0) P.put(x + 1, y - 1, '#32482c'); }
      // 돌벽: 윗벽 면(막돌 쌓기 + 이끼) + 옆·아래 벽 윗면
      const cap = { t: '#6a6572', m: '#55505e', d: '#34303c' };
      for (const [x, y, w, h] of [[RX0 - 7, top - 3, 7, RY1 - top + 10], [RX1, top - 3, 7, RY1 - top + 10], [RX0 - 7, RY1, RX1 - RX0 + 14, 6], [RX0 - 7, top - 3, RX1 - RX0 + 14, 3]]) {
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = h2(Math.floor((x + i) / 3), Math.floor((y + j) / 2), 171); P.put(x + i, y + j, v < 0.25 ? '#625d6a' : v < 0.7 ? '#57525e' : '#4a4554'); if (h2(x + i, y + j, 172) < 0.08) P.put(x + i, y + j, '#3e5634'); }
        P.rect(x, y, w, 1, cap.t); P.rect(x + w - 1, y, 1, h, cap.d); P.rect(x, y + h - 1, w, 1, cap.d); }
      P.rect(RX0 - 8, top - 4, RX1 - RX0 + 16, 1, K); P.rect(RX0 - 8, top - 4, 1, RY1 - top + 11, K); P.rect(RX1 + 7, top - 4, 1, RY1 - top + 11, K); P.rect(RX0 - 8, RY1 + 6, RX1 - RX0 + 16, 1, K);
      P.rect(RX0, RY1, RX1 - RX0, 1, K); P.rect(RX0 - 1, top, 1, RY1 - top, K); P.rect(RX1, top, 1, RY1 - top, K);
      // 윗벽 면: 크기 다른 막돌
      for (let y = top; y < RY0; y++) {
        const row = Math.floor((y - top) / 4), ly = (y - top) % 4;
        let bx = RX0 - Math.floor(h2(row, 0, 173) * 6), k = 0, edges = []; while (bx < RX1) { edges.push(bx); bx += 6 + Math.floor(h2(row, k++, 174) * 7); }
        let e = 0;
        for (let x = RX0; x < RX1; x++) { while (e + 1 < edges.length && edges[e + 1] <= x) e++; const lx = x - edges[e], v = h2(row * 50 + e, 1, 175);
          let c = v < 0.3 ? '#4e4a56' : v < 0.7 ? '#46424e' : '#524e5a'; if (ly === 3 || lx === 0) c = '#24202a'; else if (ly === 0) c = '#625d6a';
          if (h2(x, y, 176) < 0.05) c = '#3a3542';
          if (ly < 2 && h2(row * 50 + e, 2, 177) < 0.25 && h2(x, y, 178) < 0.6) c = (x + y) & 1 ? '#3e5634' : '#2e4228'; // 이끼
          P.put(x, y, c); }
      }
      for (let x = RX0; x < RX1; x++) if (h2(x, 0, 179) < 0.3) for (let y = RY0 - 1; y < RY0 + 2 + Math.floor(h2(x, 1, 180) * 3); y++) P.put(x, y, (x + y) & 1 ? '#2e4228' : '#22301e'); // 벽 아래 담쟁이
      wallShadow(P, '#18201a');
      // 아래 벽 쪽문 (열린 쇠문)
      P.rect(CX - 13, RY1 - 1, 26, 8, '#2e261e'); for (let y = RY1; y < GH; y++) for (let x = CX - 12; x < CX + 12; x++) if (h2(x, y, 65) < 0.8 - Math.abs(x - CX) / 20) P.put(x, y, h2(x, y, 66) < 0.5 ? '#3e3428' : '#342a20');
      for (const s of [-1, 1]) { const px = CX + s * 16 - 3; P.box(px, RY1 - 12, 7, 18, STN); P.rect(px, RY1 - 12, 7, 2, '#9a94a0'); P.rect(px - 1, RY1 - 14, 9, 2, '#8e8894'); P.rect(px - 2, RY1 - 15, 11, 1, K); }
      for (const s of [-1, 1]) { const x0 = s < 0 ? CX - 32 : CX + 20; // 활짝 열려 벽에 붙은 쇠문 두 짝
        P.rect(x0 - 1, RY1 - 13, 14, 13, K);
        for (let i = 0; i < 12; i++) { P.rect(x0 + i, RY1 - 12, 1, 11, i % 3 === 0 ? '#3e3c48' : '#0e0c12'); if (i % 3 === 0) { P.put(x0 + i, RY1 - 13, '#7a7886'); P.put(x0 + i, RY1 - 12, '#5a5866'); } }
        P.rect(x0, RY1 - 9, 12, 1, '#4a4856'); P.rect(x0, RY1 - 4, 12, 1, '#4a4856'); P.put(s < 0 ? x0 + 11 : x0, RY1 - 7, '#9a9aa4'); }
      GRAVE_PROPS(P);
    },
    lights: [{ x: 90, y: 138, r: 50, a: 0.55, c: [255, 180, 90] }, { x: 298, y: 138, r: 50, a: 0.55, c: [255, 180, 90] }, { x: 192, y: 0, r: 130, a: 0.16, c: [180, 110, 160], sy: 2.2 }, { x: 192, y: 205, r: 40, a: 0.22, c: [230, 140, 90] }],
    labels: [['돌벽', 150, 18], ['비석 · 십자가', 144, 92], ['천막 막사', 122, 36], ['파다 만 땅', 222, 88], ['흙더미 · 삽', 262, 80], ['짜다 만 관', 243, 158], ['널빤지 · 망치 · 톱', 276, 168], ['등불', 90, 124], ['등불', 298, 124], ['마른 나무', 288, 44], ['쪽문', 192, 196]],
  };

  // ---------------------------------------------------------------- 3차: 묘지 시설물 다시 그림 · 관측탑 보면대 축소
  // 두께(오른쪽 옆면)가 보이는 돌 · 칸마다 3~4단 음영 · 외곽선은 자동

  // ---------- 묘지 시설물
  function GRAVE_PROPS(P) {
    const MOSS = ['#4e6e3c', '#3a562e', '#2a4022'];
    const tuft = (x, y, n = 3) => { for (let i = 0; i < n; i++) { const tx = x + i * 2 - n; P.put(tx, y, MOSS[1]); P.put(tx, y - 1, MOSS[i % 2 ? 0 : 1]); if (i % 2 === 0) P.put(tx, y - 2, MOSS[0]); } };
    // 흙 둔덕: 위 밝고 앞 어두운 3단 + 잔돌 + 풀
    const mound = (cx, cy, rx = 12, ry = 6) => { // 낮고 길쭉한 흙 둔덕 (모서리 둥근 직사각형, 윗면은 평평하게)
      const sh = (x, y) => Math.abs(x / rx) ** 4 + Math.abs(y / ry) ** 4;
      for (let y = -ry - 1; y <= ry + 2; y++) for (let x = -rx - 1; x <= rx + 1; x++) {
        const d = sh(x, y);
        if (d > 1) { if (sh(x + 1, y) <= 1 || sh(x - 1, y) <= 1 || sh(x, y - 1) <= 1 || sh(x, y + 1) <= 1) P.put(cx + x, cy + y, K); continue; }
        let c = '#62503a';
        if (sh(x, y - 1) > 1) c = '#8a7254'; // 윗 가장자리
        else if (sh(x - 1, y) > 1) c = '#74604a'; // 왼쪽 밝게
        else if (sh(x + 1, y) > 1) c = '#46382a'; // 오른쪽 어둡게
        else if (sh(x, y + 2) > 1) c = '#3e3022'; // 앞쪽 옆면 2줄
        else if (h2(cx + x, cy + y, 501) < 0.08) c = '#74604a'; else if (h2(cx + x, cy + y, 502) < 0.05) c = '#4c3c2a';
        P.put(cx + x, cy + y, c);
      }
      for (const [dx, dy] of [[-3, -2], [2, 3], [4, -4]]) { P.put(cx + dx, cy + dy, '#8a8494'); P.put(cx + dx + 1, cy + dy, '#5e5a68'); }
      for (let x = -rx + 1; x < rx; x += 3) if (h2(x, cx, 503) < 0.7) tuft(cx + x, cy + ry + 2, 2);
    };
    // 시든 꽃다발 (끈으로 묶음)
    const bouquet = (x, y, s) => {
      const heads = [['#9a7a8a', '#6a4a5a'], ['#b0a060', '#7a6a3a'], ['#8a6a9a', '#5a3a6a']];
      for (let i = 0; i < 4; i++) { const hx = x + i * 2 - 3, hy = y - 4 - (i % 2); P.line(hx, hy + 1, x, y + 1, '#4a5a32'); const [a, b] = heads[(s + i) % 3]; P.put(hx, hy, a); P.put(hx + 1, hy, b); P.put(hx, hy - 1, b); }
      P.put(x, y, '#a02020'); P.put(x + 1, y, '#6a1414'); P.put(x - 1, y + 1, '#4a5a32'); P.put(x + 1, y + 2, '#4a5a32');
    };
    // 둥근 머리 비석 (앞면 10 + 옆면 2) — 새긴 십자 · 비문 · 금 · 이끼
    const archStone = (x, y, s, chip) => {
      const fw = 10, sw = 2, h = 16, r = fw / 2;
      const inFace = (i, j) => i >= 0 && i < fw && j >= 0 && j < h && (j >= r || Math.hypot(i + 0.5 - r, j + 0.5 - r) <= r);
      const inSide = (i, j) => i >= fw && i < fw + sw && j >= 1 && j < h && (j >= r || Math.hypot(i - fw + 0.5, j + 0.5 - r) <= 1.6 + (i - fw));
      const inAny = (i, j) => (inFace(i, j) || inSide(i, j)) && !(chip && i >= fw - 2 && i < fw && j < 3 && j + (fw - 1 - i) < 3);
      for (let j = -1; j <= h; j++) for (let i = -1; i <= fw + sw; i++) {
        if (!inAny(i, j)) { if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inAny(i + a, j + b))) P.put(x + i, y + j, K); continue; }
        let c;
        if (inFace(i, j)) { const rim = !inFace(i, j - 1) || !inFace(i - 1, j); c = rim ? '#b0aab8' : !inFace(i + 1, j) ? '#6a6574' : j > h - 3 ? '#6e6978' : (h2(x + i, y + j, s) < 0.08 ? '#6e6978' : '#8a8494'); }
        else c = !inSide(i, j - 1) ? '#6a6574' : i === fw + sw - 1 ? '#3a3542' : '#4e4a58';
        P.put(x + i, y + j, c);
      }
      const cx0 = x + 3, cy0 = y + 2;
      const cross = ['.##.', '####', '.##.', '.##.', '.##.'];
      cross.forEach((r0, j) => [...r0].forEach((ch, i) => { if (ch === '#') { P.put(cx0 + i, cy0 + j, '#45404c'); if (cross[j + 1]?.[i] !== '#') P.put(cx0 + i, cy0 + j + 1, '#b0aab8'); if (r0[i + 1] !== '#') P.put(cx0 + i + 1, cy0 + j, '#a49eac'); } }));
      for (const [j, l] of [[9, 7], [11, 5]]) for (let i = 0; i < l; i++) if (h2(i, j, s) < 0.7) P.put(x + 2 + i, y + j, '#5e5a68');
      P.line(x + 8, y + 4, x + 7, y + 7, '#45404c'); P.line(x + 7, y + 7, x + 8, y + 9, '#45404c');
      for (let j = h - 5; j < h; j++) for (let i = 0; i < fw + sw; i++) if (inAny(i, j) && h2(i, j, s + 1) < (j - h + 6) * 0.11) P.put(x + i, y + j, MOSS[(i + j) % 3]);
      for (let i = 2; i < 7; i++) if (h2(i, 0, s + 2) < 0.5) P.put(x + i, y + 1 + (i % 2), MOSS[i % 2]);
      P.rect(x - 1, y + h, fw + sw + 2, 1, '#18201a'); // 발치 그림자
    };
    // 고리 달린 돌 십자 (켈트식, 작게)
    const ringCross = (x, y, s) => {
      const rows = [
        '.....aaa.....', '....aHmhd....', '..ooaHmhdoo..', '.oOOaHmhdOOo.', 'aaaaaHmhaaaaa', 'aHHHHHmHHHHhd', 'adddddmdddddd', '.oOOaHmhdOOo.', '..ooaHmhdoo..', '....aHmhd....',
        '....aHmhd....', '....aHmhd....', '...aaHmhdd...', '..aHHHHHHhd..', '..ammmmmmmd..', '..adddddddd..'];
      P.spr(rows, { a: '#5e5a68', H: '#b0aab8', h: '#77717e', m: '#8a8494', d: '#45404c', o: '#5e5a68', O: '#8a8494' }, x, y);
      for (let j = 9; j < 16; j++) for (let i = 2; i < 11; i++) if (rows[j][i] !== '.' && h2(i, j, s) < (j - 8) * 0.07) P.put(x + i, y + j, MOSS[(i + j) % 3]);
      P.rect(x + 1, y + 16, 12, 1, '#18201a');
    };
    // 나무 십자 (나뭇결 · 못 · 끈 묶음 · 해진 천, 작게)
    const woodCross = (x, y, s, cloth) => {
      const H = 17, W = 10, px = 4, by = 4;
      for (let j = 0; j < H; j++) for (let i = 0; i < 2; i++) P.put(x + px + i, y + j, i === 0 ? '#a08466' : (h2(i, j, s) < 0.2 ? '#6a5240' : '#6e5440'));
      P.rect(x + px - 1, y - 1, 4, 1, K); P.rect(x + px - 1, y, 1, H, K); P.rect(x + px + 2, y, 1, H, K); P.put(x + px, y, '#b8a080');
      for (let j = 0; j < 2; j++) for (let i = 0; i < W; i++) P.put(x + i, y + by + j, j === 0 ? '#a08466' : '#6e5440');
      P.rect(x - 1, y + by - 1, W + 2, 1, K); P.rect(x - 1, y + by + 2, W + 2, 1, K); P.put(x - 1, y + by, K); P.put(x - 1, y + by + 1, K); P.put(x + W, y + by, K); P.put(x + W, y + by + 1, K);
      P.put(x, y + by, '#c0a888');
      for (const [i, j, c] of [[3, 3, '#d8c090'], [4, 4, '#b09060'], [5, 5, '#d8c090'], [6, 6, '#b09060'], [6, 3, '#b09060'], [3, 6, '#d8c090']]) P.put(x + i, y + j, c);
      P.put(x + 1, y + by + 1, '#c8c8d4'); P.put(x + W - 2, y + by + 1, '#c8c8d4');
      for (let j = 9; j < H - 1; j += 4) P.put(x + px + 1, y + j, '#4a3628');
      if (cloth) for (let j = 0; j < 5; j++) { P.put(x + 8, y + by + 2 + j, j % 3 === 2 ? '#5a1a1e' : '#7a2a2a'); P.put(x + 9, y + by + 3 + j, K); }
      P.rect(x + px - 2, y + H, 6, 1, '#18201a');
    };

    // ---- 무덤 6기: 묘비는 둔덕 뒤로 떨어뜨려 세움 [둔덕 중심 x, y, 종류]
    const graves = [[112, 110, 'arch', 1], [144, 110, 'wood', 0], [176, 110, 'ring', 0], [112, 146, 'wood', 1], [144, 146, 'arch', 0], [176, 146, 'arch', 2]]; // 파다 만 땅 높이에 맞춘 2줄 × 3칸
    for (const [gx, gy, t, v] of graves) { // 둔덕 없이 묘비·십자가만, 발치에 풀
      const base = gy + 2;
      if (t === 'arch') archStone(gx - 6, base - 16, gx * 7 + gy, v === 1);
      else if (t === 'ring') ringCross(gx - 6, base - 16, gx + gy);
      else woodCross(gx - 5, base - 17, gx + gy, v === 1);
      tuft(gx - 4, base + 1, 2); tuft(gx + 5, base + 1, 2);
    }



    // ---- 파다 만 땅: 들쭉날쭉한 구덩이 + 가장자리로 흘러내린 흙 · 뜯긴 풀 + 흙더미에 대각선으로 꽂힌 삽
    const ox = 216, oy = 104, orx = 17, ory = 10;
    const rim = a => 1 + Math.sin(a * 3 + 1.3) * 0.12 + Math.sin(a * 7 + 0.4) * 0.07 + (h2(Math.floor(a * 9), 0, 551) - 0.5) * 0.12;
    const inPit = (x, y) => { const a = Math.atan2(y / ory, x / orx), d = Math.hypot(x / orx, y / ory); return d <= rim(a); };
    // 흘러내린 흙 (구덩이 둘레)
    for (let y = -ory - 5; y <= ory + 6; y++) for (let x = -orx - 6; x <= orx + 6; x++) {
      if (inPit(x, y)) continue; const a = Math.atan2(y / ory, x / orx), d = Math.hypot(x / orx, y / ory) / rim(a);
      if (d < 1.38 && h2(x, y, 552) < (1.38 - d) * 2.6) P.put(ox + x, oy + y, h2(x, y, 553) < 0.5 ? '#6a5438' : '#56442f');
    }
    for (let y = -ory - 1; y <= ory + 1; y++) for (let x = -orx - 1; x <= orx + 1; x++) {
      if (!inPit(x, y)) { if (inPit(x + 1, y) || inPit(x - 1, y) || inPit(x, y + 1) || inPit(x, y - 1)) P.put(ox + x, oy + y, K); continue; }
      // 안쪽: 위쪽은 뒤 흙벽(지층), 아래쪽은 어두운 바닥, 앞 가장자리 아래는 그늘
      let c; const up = !inPit(x, y - 1), up2 = !inPit(x, y - 3), dn = !inPit(x, y + 1);
      if (up) c = '#8a7254'; else if (up2) c = h2(x, y, 554) < 0.5 ? '#5e4a32' : '#4e3c2a'; else if (!inPit(x, y - 5)) c = '#3a2c1e';
      else c = dn ? '#2a1e14' : (y > 2 ? '#0e0a08' : '#1a120c');
      if (!inPit(x - 1, y) && !up) c = '#46382a';
      P.put(ox + x, oy + y, c);
    }
    for (const [x, y, l] of [[-6, -6, 3], [4, -7, 4], [10, -4, 2]]) for (let i = 0; i < l; i++) if (inPit(x, y + i)) P.put(ox + x + (i % 2), oy + y + i, '#7a6048'); // 뿌리
    for (const [x, y] of [[-3, 3], [2, 4], [-1, 5]]) if (inPit(x, y)) P.put(ox + x, oy + y, '#1e2630'); // 고인 물
    for (const [x, y] of [[-12, -9], [6, -10], [-16, 4], [14, 7], [-8, 9]]) { P.put(ox + x, oy + y, MOSS[0]); P.put(ox + x + 1, oy + y, '#4a3a28'); } // 뜯긴 풀
    // 흙더미 (자연스럽게 무너진 언덕 + 덩이 · 잔돌)
    const px = 260, py = 108;
    const pileH = x => 13 * Math.exp(-((x / 9) ** 2)) + 3 * Math.exp(-(((x - 10) / 4) ** 2)) + (h2(Math.floor(x / 2), 0, 556) - 0.5) * 1.4;
    for (let x = -18; x <= 18; x++) { const t = Math.round(pileH(x)); if (t < 1) continue;
      for (let y = -t; y <= 3; y++) { const k = (y + t) / (t + 3); let c = k < 0.18 ? '#8a7254' : k < 0.45 ? '#6e5a40' : k < 0.75 ? '#56442f' : '#3e3022'; if (x > 6 && k < 0.5) c = '#5e4a34'; if (h2(x, y, 557) < 0.07) c = '#9a8264'; if (h2(x, y, 558) < 0.05) c = '#2e2216'; P.put(px + x, py + y, c); }
      P.put(px + x, py - t - 1, K); P.put(px + x, py + 4, K); }
    for (const [dx, dy] of [[-9, 0], [4, 1], [10, -2], [-3, 2], [-13, 2]]) { P.rect(px + dx, py + dy, 2, 2, '#77717e'); P.put(px + dx, py + dy, '#9a94a4'); P.put(px + dx + 1, py + dy + 1, '#4e4a58'); }
    for (const [dx, dy] of [[-21, 2], [20, 3], [-19, 0], [22, 1]]) P.rect(px + dx, py + dy, 2, 1, '#56442f'); // 굴러 나온 덩이
    // 삽: 날은 흙더미 꼭대기 근처에 반쯤 박히고, 자루는 왼쪽 위로 45° 기울어짐
    const bx = px + 3, by = py - 9;
    for (let i = 1; i < 14; i++) { const x = bx - i, y = by - i; P.put(x - 1, y - 1, K); P.put(x, y - 1, K); P.put(x, y, i < 3 ? '#9a9aa4' : '#9a7a5a'); P.put(x - 1, y, i < 3 ? '#6a6a76' : '#b09070'); P.put(x - 2, y, K); P.put(x + 1, y, K); P.put(x, y + 1, K); P.put(x - 1, y + 1, K); }
    P.spr(['kkkk.', 'kWWWk', 'kWkWk', 'kkWkk'], { k: K, W: '#b09070' }, bx - 18, by - 17, false); // D자 손잡이
    P.spr(['..kkk..', '.kSSsk.', 'kSSssDk', '.kDDDk.'], { k: K, S: '#d8d8e4', s: '#a4a4b0', D: '#6a5438' }, bx - 2, by - 1, false);
    P.put(bx - 2, by + 3, '#5a4632'); P.put(bx + 3, by + 3, '#5a4632');

    // ---- 천막 막사 (왼쪽 위, 크게): 사다리꼴 캔버스 지붕 · 솔기 박음질 · 지붕을 가로지르는 고정 줄 · 처마 띠 · 앞 기둥 · 열린 입구(안에 간이침대 · 등) · 장대 끝 깃발
    const tx0 = 82, ty0 = 46, TW = 80;
    const roofH = 20, wallH = 13, SL = 0.5;
    const insAt = j => Math.floor((roofH - 1 - j) * SL);
    // 그림자 · 밟혀 다져진 흙 (입구 앞)
    for (let i = -4; i < TW + 8; i++) for (let j = 0; j < 4; j++) if ((i + j) & 1 || j === 0) P.put(tx0 + i, ty0 + roofH + wallH + 1 + j, '#121810');
    blot(P, tx0 + 40, ty0 + roofH + wallH + 7, 14, 4, '#3e3428', 611, 1.0); blot(P, tx0 + 40, ty0 + roofH + wallH + 7, 9, 3, '#4a3e2e', 612, 0.8);
    // 지붕
    for (let j = 0; j < roofH; j++) for (let i = 0; i < TW; i++) {
      const ins = insAt(j);
      if (i < ins || i >= TW - ins) { const left = i < ins; P.put(tx0 + i, ty0 + j, left ? ((i + j) % 5 === 0 ? '#26262c' : '#2e2e36') : ((i + j) % 5 === 0 ? '#1c1c22' : '#222228')); continue; }
      const t = j / roofH, panel = (i - 2) % 13, sag = Math.sin((i - 2) / 13 * Math.PI) * 0.18;
      let c = t + sag < 0.15 ? '#6a6a74' : t + sag < 0.4 ? '#55555e' : t + sag < 0.7 ? '#46464f' : '#3a3a42';
      if (panel === 0) c = '#2a2a30'; else if (panel === 1) c = t < 0.5 ? '#74747e' : '#55555e';
      if (panel === 12 && j % 2 === 0) c = '#8d9097'; // 박음질
      if (j === 0) c = '#7a7a84';
      if (h2(i, j, 601) < 0.035) c = '#2a2a30';
      if (t > 0.55 && h2(i >> 2, j >> 1, 602) < 0.13) c = (i + j) & 1 ? '#2a2a30' : '#3a3a42'; // 얼룩
      P.put(tx0 + i, ty0 + j, c);
    }
    // 덧댄 천 조각 2장
    for (const [px, py, pw, ph, col] of [[44, 4, 8, 7, '#4a4848'], [16, 11, 6, 5, '#3e3e46']]) { P.rect(tx0 + px, ty0 + py, pw, ph, col); P.rect(tx0 + px, ty0 + py, pw, 1, '#6b6b70'); for (let k = 0; k < pw; k += 2) { P.put(tx0 + px + k, ty0 + py - 1, '#8d9097'); P.put(tx0 + px + k, ty0 + py + ph, '#8d9097'); } for (let k = 0; k < ph; k += 2) { P.put(tx0 + px - 1, ty0 + py + k, '#8d9097'); P.put(tx0 + px + pw, ty0 + py + k, '#8d9097'); } }
    // 지붕을 가로지르는 고정 줄 2가닥
    for (const rx of [24, 58]) for (let j = 0; j < roofH; j++) { P.put(tx0 + rx + Math.floor(j * 0.15), ty0 + j, '#d8c8a0'); P.put(tx0 + rx + 1 + Math.floor(j * 0.15), ty0 + j, '#8a7a5a'); }
    // 용마루 장대 + 외곽선
    { const i0 = insAt(0); P.rect(tx0 + i0 - 3, ty0 - 2, TW - i0 * 2 + 6, 2, '#6e5038'); P.rect(tx0 + i0 - 3, ty0 - 2, TW - i0 * 2 + 6, 1, '#9a7a5a'); P.rect(tx0 + i0 - 4, ty0 - 3, TW - i0 * 2 + 8, 1, K); P.rect(tx0 + i0 - 4, ty0, TW - i0 * 2 + 8, 1, K); }
    for (let j = 0; j < roofH; j++) { const ins = insAt(j); P.put(tx0 + ins - 1 >= tx0 ? tx0 + ins - 1 : tx0 - 1, ty0 + j, K); P.put(tx0 + TW - ins, ty0 + j, K); }
    // 처마: 물결 가장자리 + 바랜 붉은 띠
    for (let i = 0; i < TW; i++) { const d = (i % 6 < 3) ? 1 : 0; P.put(tx0 + i, ty0 + roofH, '#8d9097'); P.put(tx0 + i, ty0 + roofH + 1, '#6b6e75'); if (d) P.put(tx0 + i, ty0 + roofH + 2, '#44444e'); P.put(tx0 + i, ty0 + roofH + 2 + d, K); if (i % 13 === 6) P.put(tx0 + i, ty0 + roofH, '#c8c8d4'); }
    // 앞 벽 (세로 주름) + 앞 기둥
    const ex0 = tx0 + 32, ew = 16, wy = ty0 + roofH + 3;
    for (let j = 0; j < wallH - 3; j++) for (let i = 0; i < TW; i++) { if (i >= 32 && i < 32 + ew) continue; const f = i % 7; P.put(tx0 + i, wy + j, f === 0 ? '#2e2e36' : f === 1 ? '#4a4a54' : j === wallH - 4 ? '#2e2e36' : '#3a3a42'); }
    for (const px of [0, 31, 48, TW - 2]) { P.rect(tx0 + px, wy - 1, 2, wallH - 2, '#5e4430'); P.put(tx0 + px, wy - 1, '#8e6e50'); }
    // 입구: 안쪽 어둠 + 간이침대 모서리 + 매단 등불 + 양쪽 자락
    for (let j = 0; j < wallH - 3; j++) for (let i = 2; i < ew - 2; i++) P.put(ex0 + i, wy + j, j < 3 ? '#120c0a' : '#1a1210');
    P.rect(ex0 + 4, wy + 6, 9, 2, '#4a3a2a'); P.rect(ex0 + 4, wy + 6, 9, 1, '#3e3e46'); P.put(ex0 + 4, wy + 8, '#2a1e14'); P.put(ex0 + 12, wy + 8, '#2a1e14');
    P.put(ex0 + 10, wy + 1, '#e0a040'); P.put(ex0 + 10, wy + 2, '#a05820'); P.put(ex0 + 9, wy + 1, '#5a3a20');
    for (let j = 0; j < wallH - 3; j++) { const lx = ex0 + 2 + Math.floor(j / 2); P.put(lx, wy + j, '#6a6a74'); P.put(lx - 1, wy + j, '#55555e'); P.put(lx + 1, wy + j, '#3a3a42'); } // 왼쪽 자락 젖혀 묶음
    P.put(ex0 + 4, wy + 4, '#c8a060'); P.put(ex0 + 5, wy + 4, '#c8a060');
    for (let j = 0; j < wallH - 3; j++) { const rx2 = ex0 + ew - 3; P.put(rx2, wy + j, j % 2 ? '#4a4a54' : '#3a3a42'); P.put(rx2 + 1, wy + j, '#2e2e36'); } // 오른쪽 자락은 늘어짐
    P.rect(tx0 - 1, wy + wallH - 3, TW + 2, 1, K);
    // 판자 디딤판
    P.box(ex0 + 2, wy + wallH - 2, 12, 2, WOOD2);
    // 장대 끝 깃발 · 고정 줄 · 말뚝
    const pl = tx0 + insAt(0) - 4, pr = tx0 + TW - insAt(0) + 3;
    for (const [x, dx] of [[pl, -1], [pr, 1]]) {
      P.rect(x - 1, ty0 - 9, 3, 9, K); P.rect(x, ty0 - 8, 1, 8, '#8e6e50'); P.put(x, ty0 - 9, '#c09038');
      const sx = x + dx * 16, sy = wy + wallH - 2; P.line(x, ty0 - 3, sx, sy, '#c8b890'); P.line(x, ty0 - 2, sx, sy + 1, '#4a4848'); P.rect(sx - 1, sy - 1, 3, 5, K); P.rect(sx, sy, 1, 4, '#8e6e50'); P.put(sx, sy, '#b09070');
    }
    P.spr(['kkkkk..', 'kRRRrk.', 'kRRrrrk', 'kRrrk..', 'kkk....'], { k: K, R: '#6b6e75', r: '#44444e' }, pr + 1, ty0 - 10, false);
    for (const i of [6, 24, 58, TW - 7]) { const sx = tx0 + i + (i < 40 ? -5 : 5), sy = wy + wallH + 5; P.line(tx0 + i, ty0 + roofH + 2, sx, sy, '#c8b890'); P.rect(sx - 1, sy - 1, 3, 3, K); P.put(sx, sy, '#8e6e50'); }
    // 옆: 물통 · 짐 상자(뚜껑 열림) · 말아 둔 침낭
    barrel(P, tx0 + TW + 10, ty0 + 6);
    crate(P, tx0 + TW + 8, ty0 + 20, 14, 11, WOOD2); P.rect(tx0 + TW + 8, ty0 + 17, 14, 2, '#6e5038'); P.rect(tx0 + TW + 7, ty0 + 16, 16, 1, K); P.put(tx0 + TW + 12, ty0 + 21, '#cfc0a0'); P.put(tx0 + TW + 16, ty0 + 22, '#8a8a94');
    P.spr(['.kkkkkkkkkkkk.', 'kbBBbBBBBbBBBk', 'kbBBbBBBBbBBBk', 'kbbbbbbbbbbbbk', '.kkkkkkkkkkkk.'], { k: K, b: '#4a3a5a', B: '#6a5a7a' }, tx0 + 4, wy + wallH + 3, false);
    P.put(tx0 + 8, wy + wallH + 4, '#c8a060'); P.put(tx0 + 14, wy + wallH + 4, '#c8a060');


    // ---- 등불 기둥 2개 (왼쪽 아래 · 오른쪽 아래): 돌 받침 · 쇠 기둥 · 안쪽으로 뻗은 팔걸이 · 매달린 등
    const lamp = (lx, ly, dir) => {
      P.spr(['.kkkkkkkkk.', 'kHHHHHHHHdk', 'kmmmmmmmmdk', 'kddddddddkk'], { k: K, H: '#8a8494', m: '#6a6574', d: '#45404c' }, lx - 5, ly + 38, false);
      for (let j = 4; j < 39; j++) { P.put(lx - 1, ly + j, K); P.put(lx, ly + j, '#5a5866'); P.put(lx + 1, ly + j, '#34323c'); P.put(lx + 2, ly + j, K); if (j % 9 === 0) { P.put(lx, ly + j, '#7a7886'); P.put(lx + 1, ly + j, '#4a4856'); } }
      P.spr(['kkkkkkkkk', 'kMMMMMMMk', 'kkkkkkkMk', '.......kk'], { k: K, M: '#5a5866' }, dir > 0 ? lx - 1 : lx - 6, ly + 2, false, dir < 0);
      const L = [ // 고리 · 지붕 · 네 기둥 쇠틀 · 유리 · 불꽃 · 받침
        '....kk....', '...kRRk...', '...kkkk...', '..kTTTTk..', '.kTTtttTk.', 'kkkkkkkkkk', 'kFgYYYYgFk', 'kFgYwwYgFk', 'kFYyWWyYFk', 'kFYyWWyYFk', 'kFgyooygFk', 'kFggyyggFk', 'kkkkkkkkkk', '.kBBBBBBk.', '..kkkkkk..', '....kk....'];
      P.spr(L, { k: K, R: '#7a7886', T: '#6a6876', t: '#3a3842', F: '#4a4856', g: '#c88a40', Y: '#ffd070', y: '#ffb040', w: '#fff4c8', W: '#ffffff', o: '#ff8a20', B: '#5a5866' }, dir > 0 ? lx + 4 : lx - 11, ly + 3, false);
      const gx0 = dir > 0 ? lx + 4 : lx - 11; for (const [dx, dy] of [[-1, 9], [10, 9], [4, 17]]) P.put(gx0 + dx, ly + 3 + dy, '#a06a30'); // 새어 나온 빛
    };
    lamp(84, 128, 1); lamp(304, 128, -1);

    // ---- 짜다 만 관: 네모난 나무 관(판자 이음 · 못 · 모서리 쇠 · 안쪽 어둠) 
    const cx = 228, cy = 130, cw = 30, ch = 14, side = 4;
    P.rect(cx - 1, cy - 1, cw + 2, ch + side + 2, K);
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
      const rim = i < 2 || i >= cw - 2 || j < 2 || j >= ch - 2;
      let c;
      if (rim) c = j < 2 ? (j === 0 ? '#b09070' : '#9a7a5a') : i < 2 ? (i === 0 ? '#a08466' : '#8a6a4a') : i >= cw - 2 ? '#5e4430' : '#7a5a40';
      else c = j < 5 ? '#120c0a' : (h2(i, j, 531) < 0.05 ? '#8a6a48' : j < 8 ? '#1e140e' : '#2a1e14');
      P.put(cx + i, cy + j, c);
    }
    for (let j = 0; j < side; j++) for (let i = 0; i < cw; i++) { const seam = j === 1 && i % 10 !== 0; P.put(cx + i, cy + ch + j, j === 0 ? '#8a6a4a' : seam ? '#4e3626' : '#6e5038'); }
    for (let i = 0; i < cw; i += 10) P.rect(cx + i, cy + ch, 1, side, '#3a2a1e');
    P.rect(cx, cy + ch + side, cw, 1, K);
    for (const [i, j] of [[1, 1], [cw - 2, 1], [1, ch - 2], [cw - 2, ch - 2]]) { P.put(cx + i, cy + j, '#5a5866'); }
    for (const i of [3, 14, 26]) { P.put(cx + i, cy + ch + 2, '#c8c8d4'); }
    for (let i = 4; i < cw - 4; i += 7) P.put(cx + i, cy, '#6e5038');
    // 널빤지 더미 (끝 나뭇결 보임) + 망치 + 톱
    for (let k = 0; k < 4; k++) { const x0 = 264 + (k % 2) * 3, y0 = 152 - k * 3, w = 26 - (k % 2) * 4;
      P.rect(x0 - 1, y0 - 1, w + 2, 4, K); P.rect(x0, y0, w, 1, '#a08466'); P.rect(x0, y0 + 1, w, 1, k % 2 ? '#7e6448' : '#6e5440'); P.put(x0 + w - 1, y0, '#5e4834'); P.put(x0 + w - 1, y0 + 1, '#4e3a2a'); P.put(x0, y0 + 1, '#c0a888');
      for (let i = 4; i < w - 2; i += 7) P.put(x0 + i, y0 + 1, '#5e4834'); }
    P.spr(['kkkkkk.', 'kSSSsk.', 'kkkwkk.', '...wk..', '...Wk..', '...wk..', '...kk..'], { k: K, S: '#c8c8d4', s: '#8a8a96', w: '#9a7a5a', W: '#6e5038' }, 254, 150, false);
    P.spr(['kkkkkkkkkkkkk..', 'kSSSSSSSSSSSkk.', 'kszszszszszskwk', '.kkkkkkkkkkkkWk', '............kk.'], { k: K, S: '#c8c8d4', s: '#8a8a96', z: '#5e5e6a', w: '#9a7a5a', W: '#6e5038' }, 270, 160, false);

    // ---- 마른 나무: 굽은 줄기(나무껍질 결) · 뿌리 · 갈라진 가지 · 부러져 매달린 가지
    const tx = 288, ty = 92;
    const bark = (x, y, th, side) => { // 두께 th인 원판을 찍어 줄기를 그림 (왼쪽 밝게)
      for (let i = -th - 1; i <= th + 1; i++) for (let j = -th - 1; j <= th + 1; j++) { const d = Math.hypot(i, j); if (d <= th + 0.6) P.put(x + i, y + j, K); }
    };
    const fill = (x, y, th) => { for (let i = -th; i <= th; i++) for (let j = -th; j <= th; j++) { if (Math.hypot(i, j) > th - 0.2) continue; const t = (i + th) / (2 * th + 0.01); P.put(x + i, y + j, t < 0.25 ? '#6a5444' : t < 0.55 ? '#4a3a30' : t < 0.8 ? '#36281f' : '#241a14'); } };
    const segs = [];
    const branch = (x, y, ang, len, th, depth) => {
      let px2 = x, py2 = y;
      for (let k = 0; k < len; k++) { const a = ang + Math.sin((k + depth * 3) * 0.35) * 0.18; px2 += Math.cos(a); py2 += Math.sin(a); segs.push([Math.round(px2), Math.round(py2), Math.max(0, Math.round(th * (1 - k / len * 0.55)))]); }
      if (depth < 3) { branch(px2, py2, ang - 0.55 - h2(depth, len, 541) * 0.3, Math.round(len * 0.62), th * 0.6, depth + 1); branch(px2, py2, ang + 0.45 + h2(len, depth, 542) * 0.3, Math.round(len * 0.55), th * 0.55, depth + 1); }
    };
    // 줄기
    for (let k = 0; k < 30; k++) segs.push([tx + Math.round(Math.sin(k * 0.18) * 2), ty - k, Math.round(3.4 - k * 0.05)]);
    branch(tx + Math.round(Math.sin(30 * 0.18) * 2), ty - 30, -Math.PI / 2 - 0.5, 12, 2.2, 1);
    branch(tx + 1, ty - 20, -Math.PI / 2 + 0.8, 14, 1.8, 1);
    branch(tx, ty - 14, -Math.PI / 2 - 1.2, 10, 1.4, 2);
    // 뿌리
    for (const [ang, len] of [[Math.PI - 0.25, 9], [0.2, 10], [Math.PI * 0.62, 6], [0.55, 6]]) for (let k = 0; k < len; k++) segs.push([Math.round(tx + Math.cos(ang) * k), Math.round(ty + 1 + Math.sin(ang) * k * 0.4), Math.max(0, Math.round(2 - k / len * 2))]);
    for (const [x, y, t] of segs) bark(x, y, t);
    for (const [x, y, t] of segs) fill(x, y, t);
    // 껍질 결 · 옹이 구멍
    for (let k = 2; k < 28; k += 3) { const x = tx + Math.round(Math.sin(k * 0.18) * 2); P.put(x - 1 + (k % 2), ty - k, '#1a120e'); P.put(x + 1, ty - k - 1, '#5a4636'); }
    P.rect(tx - 1, ty - 13, 2, 3, '#0e0a08'); P.put(tx - 2, ty - 13, '#6a5444'); P.put(tx, ty - 10, '#6a5444');
    // 부러져 매달린 가지
    P.line(tx + 10, ty - 24, tx + 13, ty - 16, K); P.line(tx + 9, ty - 24, tx + 12, ty - 16, '#4a3a30'); P.put(tx + 12, ty - 15, '#7a6450');
    blot(P, tx + 2, ty + 4, 16, 4, '#121810', 68, 1.1);
  }

  // ---------- 관측탑: 보면대를 사람 크기로 (세리안이 서서 읽는 책)
  {
    const prev = SCENES.mage.draw;
    SCENES.mage.draw = function (P) {
      const real = P.spr;
      // 기존 draw에서 보면대만 빼고 그림: 보면대 구간을 건너뛰기 위해 플래그
      window.__noLectern = true; prev(P); window.__noLectern = false;
      const lx = 150, ly = 70;
      // 비스듬한 받침판 + 펼친 책 (폭 18칸)
      P.spr([
        '..kkkkkkkkkkkkkkkk..',
        '.kpPPPPPPkPPPPPPPpk.',
        '.kpPllllPkPlllllPpk.',
        'kpPPPPPPPkPPPPPPPPpk',
        'kpPlllPPPkPPllllPPpk',
        'kpppppppppppppppppppk',
        'kbbbbbbbbbbbbbbbbbbk',
        'kwwwwwwwwwwwwwwwwwwk',
        '.kkkkkkkkkkkkkkkkkk.',
      ], { k: K, p: '#a89878', P: '#e8dcc0', l: '#8a7a6a', b: '#4e3626', w: '#8e6e50' }, lx, ly, false);
      for (let j = 1; j < 5; j++) P.put(lx + 10, ly + j, '#c8bca0');
      P.put(lx + 13, ly + 2, '#6a5a8a'); P.put(lx + 15, ly + 3, '#6a5a8a'); P.put(lx + 14, ly + 2, '#9a8ab0');
      P.rect(lx + 9, ly + 8, 1, 4, '#a02020'); P.put(lx + 9, ly + 12, '#6a1414');
      P.put(lx + 2, ly + 6, '#e0b040'); P.put(lx + 17, ly + 6, '#e0b040');
      // 기둥 + 세 갈래 발
      for (let j = 0; j < 13; j++) { const y = ly + 9 + j; P.put(lx + 8, y, K); P.put(lx + 11, y, K); P.put(lx + 9, y, (j % 4 < 2) ? '#8e6e50' : '#6e5038'); P.put(lx + 10, y, '#3a2a1e'); }
      P.spr(['....kkkkkk....', '..kkwWWWWwkk..', 'kkwWkk..kkWwkk', 'kkk........kkk'], { k: K, w: '#8e6e50', W: '#5e4430' }, lx + 3, ly + 22, false);
      blot(P, lx + 10, ly + 26, 9, 2, '#1a1820', 77, 0.9);
    };
  }


  // ================================================================ v2.96 시작 장소 디테일 업 (기사 장면 수준으로): 공통 도구
  // 바닥 판별: 장면을 다 그린 뒤 칸 색을 읽어, 바닥 색 칸에만 덧칠 (소품 위로 번지지 않게)
  // 부드러운 값 잡음 (격자가 안 보이게 칸 크기 c로 이중선형 보간 + 두 겹)
  function vnoise(x, y, s, c = 9) {
    const one = (x, y, c, s) => { const gx = Math.floor(x / c), gy = Math.floor(y / c), fx = x / c - gx, fy = y / c - gy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = h2(gx, gy, s), b = h2(gx + 1, gy, s), e = h2(gx, gy + 1, s), f = h2(gx + 1, gy + 1, s); return a + (b - a) * u + (e - a) * v + (a - b - e + f) * u * v; };
    return one(x + 0.37 * y, y, c, s) * 0.65 + one(x, y + 0.5 * x, c * 0.45, s + 9) * 0.35;
  }
  function DK(P) {
    let d = P.g.getImageData(0, 0, GW, GH).data;
    const hx = n => n.toString(16).padStart(2, '0');
    const col = (x, y) => { if (x < 0 || y < 0 || x >= GW || y >= GH) return ''; const i = ((y | 0) * GW + (x | 0)) * 4; return '#' + hx(d[i]) + hx(d[i + 1]) + hx(d[i + 2]); };
    const T = {
      col, refresh() { d = P.g.getImageData(0, 0, GW, GH).data; },
      set: a => new Set(a.map(c => c.toLowerCase())),
      on(S, x, y, c) { if (S.has(col(x, y))) P.put(x, y, c); },
      // 접지 그림자: 소품 밑동 아래 두 줄 (윗줄 진하게, 아랫줄 디더)
      shadow(S, x0, x1, y, c1, c2) { for (let x = x0; x < x1; x++) { T.on(S, x, y, c1); if ((x + y) & 1 || (x > x0 + 1 && x < x1 - 2)) T.on(S, x, y + 1, c2 || c1); } },
      oval(S, cx, cy, rx, ry, c, seed, dens = 1) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (q > 1) continue; if (q < 0.4 * dens || (((x + y) & 1) && h2(x, y, seed) < (1.2 - q) * dens)) T.on(S, x, y, c); } },
      // 폴리라인 따라 닳은 길 (디더)
      path(S, pts, w, c, seed, dens = 0.5) {
        for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { let best = 1e9;
          for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy))), dx = x - ax - vx * t, dy = (y - ay - vy * t) * 1.6; best = Math.min(best, Math.hypot(dx, dy)); }
          if (best < w && h2(x, y, seed) < (1 - best / w) * dens * (((x + y) & 1) ? 1.4 : 0.6)) T.on(S, x, y, c); } },
      // 거미줄 (모서리, dir 1 = 왼쪽 위 모서리, -1 = 오른쪽 위)
      web(x, y, dir, n, c) { for (let i = 0; i < n; i++) { P.put(x + dir * i, y, c); P.put(x, y + i, c); } for (let i = 0; i <= n - 1; i++) P.put(x + dir * i, y + n - 1 - i, c); for (let i = 0; i <= (n >> 1); i++) P.put(x + dir * i, y + (n >> 1) - i, c); P.line(x, y, x + dir * (n - 1), y + n - 1, c); },
    };
    return T;
  }
  // 넓은 판자 바닥 (가로, 판 높이 6칸 · 길이 34~64): 나뭇결 줄 · 옹이 · 양끝 못
  function planksW(P, x0, y0, x1, y1, pal, seed) {
    for (let y = y0; y < y1; y++) {
      const row = Math.floor((y - y0) / 6), ly = (y - y0) % 6;
      for (let x = x0; x < x1; x++) {
        const len = 34 + Math.floor(h2(row, 1, seed) * 30), off = Math.floor(h2(row, 2, seed) * len), b = Math.floor((x - x0 + off) / len), lx = (x - x0 + off) % len, id = row * 31 + b;
        const v = h2(id, 3, seed); let c = v < 0.33 ? pal.a : v < 0.7 ? pal.b : pal.c;
        if (ly === 5 || lx === 0) c = pal.gap; else if (ly === 0) c = pal.hi;
        else if ((lx === 2 || lx === len - 3) && (ly === 1 || ly === 4)) c = pal.nail;
        else { const gl = Math.floor(h2(id, 4, seed) * 3) + 2, ph = Math.floor(h2(id, 5, seed) * 9); if (ly === gl && ((lx + ph) % 13) < 6) c = pal.grain; else if (ly === gl + 1 && ((lx + ph + 7) % 17) < 4 && ly < 5) c = '#4e3828';
          const kx = Math.floor(h2(id, 6, seed) * (len - 10)) + 5; if (h2(id, 7, seed) < 0.35 && Math.abs(lx - kx) <= 1 && (ly === 2 || ly === 3)) c = lx === kx ? pal.gap : pal.grain; }
        P.put(x, y, c);
      }
    }
  }
  // ---------------------------------------------------------------- 2. 버려진 역참 디테일: 닳은 길 · 접지 그림자 · 끌린 핏자국 · 칼자국 · 짚 · 거미줄 · 벽 얼룩 · 카운터 소품
  {
    const base = SCENES.ranger.draw;
    SCENES.ranger.draw = function (P) {
      base(P);
      const top = RY0 - 22, cx = (RX0 + RX1) / 2, T = DK(P);
      const PL = { a: '#5a4230', b: '#523a28', c: '#4a3424', gap: '#26180e', hi: '#664c38', nail: '#8a7a6a', grain: '#3e2c1e' };
      // 바닥: 촘촘한 판자(4칸) → 넓은 판자(6칸 · 길이 34~64) — 나뭇결 줄 · 옹이 · 양끝 못. 기존 얼룩 점도 함께 걷어 냄
      { const F = Grid(); planksW(F, RX0, RY0, RX1, RY1, PL, 12); const fd = F.g.getImageData(0, 0, GW, GH).data, OLD = T.set(Object.values(PL).concat(['#3a2a1c', '#34241a']));
        for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) if (OLD.has(T.col(x, y)) && !(x < RX0 + 57 && y < RY0 + 37)) { const i = (y * GW + x) * 4; P.put(x, y, `rgb(${fd[i]},${fd[i + 1]},${fd[i + 2]})`); } T.refresh(); }
      const FL = T.set(Object.values(PL).concat(['#4e3828']));
      // 닳은 길: 쪽문 → 탁자 → 카운터 (밟힌 판자가 한 톤 밝음 · 가장자리는 디더)
      { const WM = { '#5a4230': '#684c38', '#523a28': '#604632', '#4a3424': '#583e2c', '#664c38': '#725842' }, pts = [[cx, RY1 - 2], [cx - 2, 126], [212, 100], [250, 84]];
        for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) { const c = T.col(x, y); if (!WM[c]) continue; let best = 1e9;
          for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy))); best = Math.min(best, Math.hypot(x - ax - vx * t, (y - ay - vy * t) * 1.5)); }
          if (best < 6 || (best < 10 && ((x + y) & 1) && h2(x, y, 61) < (10 - best) / 4)) P.put(x, y, WM[c]); } }
      // 둥근 깔개 (탁자 밑): 바랜 붉은 천 · 테두리 무늬 · 닳은 구멍 · 술
      { const rx = 26, ry = 10, ox = 187, oy = 109;
        for (let y = oy - ry - 1; y <= oy + ry + 1; y++) for (let x = ox - rx - 2; x <= ox + rx + 2; x++) { const q = ((x - ox) / rx) ** 2 + ((y - oy) / ry) ** 2; if (q > 1.08) continue; if (!T.set(Object.values(PL).concat(['#684c38', '#604632', '#583e2c', '#725842'])).has(T.col(x, y))) continue;
          let c = q > 0.98 ? '#2a1414' : q > 0.82 ? '#5e2626' : q > 0.74 ? (((x >> 1) + y) & 1 ? '#a0703a' : '#5e2626') : q > 0.68 ? '#5e2626' : q < 0.12 ? '#7a3a30' : (h2(x >> 1, y, 72) < 0.5 ? '#6a2e2a' : '#723430');
          if (q < 0.68 && q > 0.3 && ((x + 2 * y) % 9 === 0)) c = '#8a5a3a';
          if (h2(x >> 1, y >> 1, 73) < 0.05 && q < 0.6) c = '#4e3a2a';
          P.put(x, y, c); }
        for (let x = ox - rx + 6; x <= ox + rx - 6; x += 2) { const y = oy + Math.round(ry * Math.sqrt(Math.max(0, 1 - ((x - ox) / rx) ** 2))) + 1; P.put(x, y, '#a0703a'); } }
      T.refresh(); const FL2 = T.set(Object.values(PL).concat(['#4e3828', '#684c38', '#604632', '#583e2c', '#725842', '#6a2e2a', '#723430', '#7a3a30', '#5e2626', '#8a5a3a']));
      // 다락 밑 그늘
      for (let y = RY0 + 37; y < RY0 + 50; y++) for (let x = RX0; x < RX0 + 57; x++) if (y < RY0 + 41 || (((x + y) & 1) && h2(x, y, 63) < 1 - (y - RY0 - 41) / 9)) T.on(FL2, x, y, '#2e2016');
      // 접지 그림자
      const SH = (x0, x1, y) => T.oval(FL2, (x0 + x1) / 2 + 2, y + 0.5, (x1 - x0) / 2 + 3, 2.6, '#1e140c', x0 + y, 1.3); // 빛이 왼쪽 위에서 → 그림자는 오른쪽 아래로 살짝
      SH(99, 111, 152); SH(111, 123, 156); SH(257, 274, 153); SH(271, 285, 154); SH(167, 175, 117); SH(197, 205, 119); SH(219, 227, 130);
      T.oval(FL2, 186, 112, 10, 2.2, '#2a1414', 64, 1.4); SH(101, 106, 106); SH(145, 150, 106); SH(131, 143, 111);
      // 끌린 핏자국: 쪽문에서 카운터 뒤로 (마른 검붉은 색 · 군데군데 번진 자국)
      const BL = ['#4a1216', '#5e1a1c', '#3a0e12'];
      const drag = [[cx + 6, RY1 - 4], [cx + 14, 140], [226, 128], [246, 112], [262, 102]];
      for (let i = 0; i < drag.length - 1; i++) { const [ax, ay] = drag[i], [bx, by] = drag[i + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
        for (let k = 0; k <= n; k++) { const x = Math.round(ax + (bx - ax) * k / n), y = Math.round(ay + (by - ay) * k / n), r = h2(x, y, 65);
          if (r < 0.7) T.on(FL2, x, y, BL[k % 3 ? 0 : 1]); if (r < 0.45) T.on(FL2, x + 1, y, BL[2]); if (r < 0.2) T.on(FL2, x, y + 1, BL[0]); if (r > 0.88) { T.on(FL2, x - 1, y + 1, BL[1]); T.on(FL2, x + 2, y - 1, BL[0]); } } }
      T.oval(FL2, 264, 101, 6, 2.2, '#3a0e12', 66, 1.2); T.oval(FL2, 263, 100, 3, 1.2, '#5e1a1c', 67, 1.4);
      for (const [x, y] of [[cx - 6, 150], [178, 132], [212, 142], [240, 122]]) { T.on(FL2, x, y, '#5e1a1c'); T.on(FL2, x + 1, y, '#3a0e12'); }
      // 칼자국 세 줄 (바닥, 탁자 오른쪽)
      for (let j = 0; j < 3; j++) for (let i = 0; i < 7; i++) T.on(FL2, 212 + j * 3 + i, 112 + i - (i >> 1), i === 0 ? '#9a7a5a' : '#2a1a10');
      // 쏟은 술 웅덩이 (깨진 병 옆)
      T.oval(FL2, 214, 136, 7, 2, '#3a1a22', 68, 1); T.on(FL2, 211, 135, '#8a5a6a');
      // 짚 부스러기 (사다리 밑에만 몇 가닥)
      for (let k = 0; k < 9; k++) { const x = 128 + Math.floor(h2(k, 1, 69) * 20), y = 111 + Math.floor(h2(k, 2, 69) * 6), c = h2(k, 3, 69) < 0.5 ? '#9a8450' : '#7a6a3e'; T.on(FL2, x, y, c); T.on(FL2, x + 1, y + (k & 1 ? 1 : 0), c); if (k % 3 === 0) T.on(FL2, x + 2, y + 1, c); }
      // 탁자에 꽂힌 단검
      P.spr(['.h.', 'hHh', '.g.', '.s.', '.s.', '.S.'], { h: '#2a1e14', H: '#4e3626', g: '#b09040', s: '#c8ccd4', S: '#8a8e98' }, 190, 95);
      // 오른쪽 위 가구 다시 그림: 벽 선반 2단(받침 까치발 · 두께) + 모양 다른 술병 · 단지 + 판자 카운터(앞판 액자 무늬 · 놋쇠 발걸이)
      { const WALL = (x, y) => { const v = h2(x, y, 6); let c = v < 0.12 ? '#54463a' : v < 0.9 ? '#605242' : '#6a5a4a'; if (h2(x >> 1, y >> 1, 7) < 0.07) c = '#463a30'; return c; };
        for (let y = top; y < RY0 - 2; y++) for (let x = 229; x < RX1; x++) P.put(x, y, WALL(x, y)); P.rect(229, top - 1, RX1 - 229, 1, '#2a1e18');
        P.rect(229, top + 7, RX1 - 229, 3, '#3a2a1e'); P.rect(229, top + 7, RX1 - 229, 1, '#4e3a2a'); P.rect(229, top + 10, RX1 - 229, 1, K);
        P.rect(258, top, 5, 22, '#3a2a1e'); P.rect(258, top, 1, 22, '#4e3a2a'); P.rect(262, top, 1, 22, '#24180f');
        const shelf = y => { P.rect(233, y - 1, 52, 1, K); P.rect(233, y, 52, 1, '#9a7a5a'); P.rect(233, y + 1, 52, 2, '#5e4430'); P.rect(233, y + 2, 52, 1, '#46321f'); P.rect(233, y + 3, 52, 1, K); P.rect(232, y - 1, 1, 5, K); P.rect(285, y - 1, 1, 5, K);
          for (let x = 234; x < 285; x++) if ((x + y) & 1) P.put(x, y + 4, '#3a2e24');
          for (const bx of [238, 278]) P.spr(['bbbb', 'Bbb.', 'Bb..', 'B...'], { b: '#5e4430', B: '#7e5e44' }, bx, y + 4); };
        shelf(top + 8); shelf(top + 17);
        const BOT = { tall: ['.c.', '.n.', 'gGg', 'gGg', 'gLg', 'gLg', 'ggd'], round: ['..c..', '..n..', '.gGg.', 'gGggd', 'gLLgd', '.ggd.'], jug: ['.cc..', 'gGgg.', 'gGggh', 'gLggh', 'gggd.'], vial: ['c.', 'n.', 'Gg', 'gd'], jar: ['tttt', 'jJjj', 'jLjj', 'jjjd'] };
        const bot = (k, x, y, g, G2, d2) => { const R = BOT[k]; P.spr(R, { c: '#b08a5a', n: g, g, G: G2, d: d2, L: '#d8ccb0', h: g, t: '#8a7a5a', j: '#a08a6a', J: '#c0aa88' }, x, y - R.length); };
        const GRN = ['#2e5a3a', '#4e8a5a', '#1e3a26'], AMB = ['#8a5a22', '#c08a3a', '#5a3a12'], RED = ['#6a2a2a', '#a04a40', '#401818'], BLU = ['#2e4a5a', '#5a7a8e', '#1e2e3a'], PLM = ['#4a2e4a', '#7a5a7a', '#2a1a2a'];
        bot('tall', 236, top + 8, ...GRN); bot('round', 242, top + 8, ...AMB); bot('vial', 250, top + 8, ...BLU); bot('tall', 254, top + 8, ...RED); bot('jug', 264, top + 8, ...AMB); bot('tall', 272, top + 8, ...PLM); bot('vial', 278, top + 8, ...GRN);
        bot('jar', 236, top + 17); bot('jar', 242, top + 17); bot('round', 250, top + 17, ...GRN); bot('tall', 258, top + 17, ...AMB);
        P.spr(['.ggggggc', 'gGGGGGGn', 'ggggLggd', '.ddddddd'], { g: '#6a2a2a', G: '#a04a40', d: '#401818', L: '#d8ccb0', c: '#b08a5a', n: '#6a2a2a' }, 266, top + 13);
        P.spr(['.oooo.', 'oOOOOo', 'oO..Oo', '.oooo.'], { o: '#8a7a5a', O: '#b0a07a' }, 277, top + 13);
        // 카운터
        const x0 = 230, y0 = RY0 + 6, w = 56;
        P.rect(x0 - 1, y0 - 1, w + 2, 17, K);
        for (let x = x0; x < x0 + w; x++) { const seam = (x - x0) % 14 === 13; P.put(x, y0, seam ? '#6e5038' : '#a8885e'); P.put(x, y0 + 1, seam ? '#4e3626' : '#8e6e50'); P.put(x, y0 + 2, seam ? '#4e3626' : (h2(x, 1, 81) < 0.15 ? '#7e5e44' : '#86684a')); P.put(x, y0 + 3, '#3a2a1e'); }
        for (const [cx, cy] of [[248, y0 + 1], [262, y0 + 2]]) { P.put(cx, cy, '#6e5038'); P.put(cx + 2, cy, '#6e5038'); P.put(cx + 1, cy - 1 + 0, '#6e5038'); }
        for (let y = y0 + 4; y < y0 + 13; y++) for (let x = x0; x < x0 + w; x++) { const px = (x - x0) % 11, py = y - y0 - 4; let c = '#5e4430';
          if (px >= 2 && px <= 8 && py >= 1 && py <= 6) c = px === 2 || py === 1 ? '#3a2a1e' : px === 8 || py === 6 ? '#7e5e44' : '#4e3626'; if (px === 0) c = '#6e5038'; P.put(x, y, c); }
        P.rect(x0, y0 + 13, w, 2, '#2e2016'); P.rect(x0, y0 + 11, w, 1, '#c09038'); P.rect(x0, y0 + 12, w, 1, '#7a5a20'); for (const bx of [234, 252, 270]) { P.rect(bx, y0 + 11, 1, 4, '#9a7028'); P.put(bx, y0 + 11, '#f0d080'); }
        // 꺾인 옆판은 뺌: 그 자리는 넓은 판자 바닥으로 되돌리고 카운터 밑에 그림자
        { const F = Grid(); planksW(F, RX0, RY0, RX1, RY1, PL, 12); const fd = F.g.getImageData(0, 0, GW, GH).data;
          for (let y = y0 + 16; y < y0 + 36; y++) for (let x = 273; x < RX1; x++) { const i = (y * GW + x) * 4; P.put(x, y, `rgb(${fd[i]},${fd[i + 1]},${fd[i + 2]})`); }
          T.refresh(); for (let x = x0 - 1; x < x0 + w + 3; x++) { T.on(FL2, x, y0 + 16, '#1e140c'); if ((x + 1) & 1) T.on(FL2, x, y0 + 17, '#1e140c'); } }
        P.spr(['.kk.', 'kggk', 'kggk', '.kk.'], { k: '#2a1e14', g: '#cfc0a0' }, 246, RY0 + 4); }
      // 카운터 위: 맥주잔 둘 · 동전 · 촛농 흘린 초 동강
      const mug = x => P.spr(['kkkk.', 'mMMmh', 'mMMmh', 'mmmm.'], { k: '#e8dcc0', m: '#6e5038', M: '#8e6e50', h: '#4e3626' }, x, RY0 + 3);
      mug(236); mug(268);
      for (const [x, y] of [[256, RY0 + 8], [259, RY0 + 9], [262, RY0 + 8]]) { P.put(x, y, '#e0b040'); P.put(x + 1, y, '#9a7028'); }
      P.spr(['.y.', '.Y.', 'www', 'wWw', 'wwW'], { y: '#ffd34d', Y: '#ff9a3a', w: '#e8dcc0', W: '#bfb090' }, 280, RY0 + 1);
      // 벽: 빗물 얼룩 · 금 · 드러난 돌 · 기둥에 꽂힌 투척 단검 · 쥐구멍
      for (const [x, n] of [[112, 12], [178, 9], [232, 14], [286, 8]]) for (let y = top + 1; y < top + n; y++) if ((x + y) & 1 || y < top + 4) { P.put(x, y, '#54463a'); if (y > top + 3 && h2(x, y, 71) < 0.5) P.put(x + 1, y, '#54463a'); }
      P.line(122, top + 12, 126, top + 16, '#3a2a1e'); P.line(126, top + 16, 125, top + 20, '#3a2a1e'); P.line(244, top + 15, 248, top + 18, '#3a2a1e');
      P.spr(['s..', '.s.', '..h', '..H'], { s: '#c8ccd4', h: '#2a1e14', H: '#5a4230' }, 227, top + 12, false); P.spr(['s..', '.s.', '..h', '..H'], { s: '#c8ccd4', h: '#2a1e14', H: '#5a4230' }, 228, top + 16, false);
      P.spr(['.kk.', 'kddk', 'kddk'], { k: '#2a1e14', d: '#0b0a0e' }, 214, RY0 - 3, false); P.put(215, RY0 - 2, '#e8dcc0');
      // 거미줄 (오른쪽 위 모서리 · 다락 기둥)
      T.web(RX1 - 1, top, -1, 7, '#8a8490'); T.web(RX0 + 56, RY0 + 37, 1, 5, '#7a7480');
    };
  }
  // ---------------------------------------------------------------- 3. 외딴 관측탑 디테일: 창 빛 웅덩이 · 접지 그림자 · 흩어진 양피지 · 잉크 자국 · 분필 가루 · 벽 밑 이끼 · 바닥 금
  {
    const base = SCENES.mage.draw;
    SCENES.mage.draw = function (P) {
      base(P);
      // 그을린 책장 다시 그림: 선반 앞면 · 칸 안쪽 그늘 · 책등 2칸(빛 받는 면/그늘 면) · 띠 장식 · 금박 · 윗면 종이 — 창 빛이 가운데라 왼쪽 책은 오른쪽 면이, 오른쪽 책은 왼쪽 면이 밝음
      { const ecx = CX, ecy = 114, erx = 118, ery = 64, wallTop = x => { const t = (x + 0.5 - ecx) / erx; return Math.abs(t) > 1 ? null : Math.round(ecy - ery * Math.sqrt(1 - t * t)); };
        const lit = (h, a) => { const n = parseInt(h.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v + (a > 0 ? (255 - v) * a : v * a)))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join(''); };
        const COLS = ['#7a2a2a', '#2e4a6a', '#6a5a2a', '#3a6a3a', '#5a3a6a', '#8a7a4a'];
        const skip = (x, y) => [-90, -45, 45, 90].some(px => x >= ecx + px && x < ecx + px + 3) || (x >= ecx - 8 && x <= ecx + 8) || (x >= 90 && x <= 128 && y >= 61) || (x >= 248 && x <= 278 && y >= 54);
        for (let x = ecx - erx; x < ecx + erx; x++) { const yb = wallTop(x); if (yb == null) continue; const hgt = Math.round(24 * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - ecx) / erx) ** 2)) ** 0.5);
          for (let y = yb - hgt; y < yb; y++) { if (skip(x, y)) continue; const ly = yb - y, r = ly % 8, sh = Math.floor(ly / 8);
            const col = Math.floor((x - ecx + 200) / 2), xi = (x - ecx + 200) % 2, litSide = x < ecx ? xi === 1 : xi === 0;
            const v = h2(col, sh, 9), burnt = h2(col >> 2, sh, 12) < 0.32, gap = h2(col, sh, 13) < 0.12, bh = 4 + Math.floor(h2(col, sh, 10) * 3);
            let c; const narrow = x < ecx - 90 || x >= ecx + 93; // v2.86 기둥 바깥은 빈 선반 (기둥 뒤로 잘린 책이 보이지 않게)
            if (r === 0) c = (x & 3) === 0 ? '#3e2c20' : '#5a4230';
            else if (narrow) c = r === 7 ? '#0e0a0a' : r === 1 ? '#3a2a1e' : (r >= 5 ? '#16100e' : '#1e1612');
            else if (gap || r > bh) c = r === 7 ? '#0e0a0a' : r === 1 && gap ? '#6e5038' : (r >= 5 ? '#16100e' : '#1e1612');
            else if (burnt) c = r === bh ? '#100c0e' : litSide ? (v < 0.5 ? '#2a2022' : '#342a2a') : (v < 0.5 ? '#1a1416' : '#221a1c');
            else { const base = COLS[Math.floor(v * 6)]; c = r === bh ? (litSide ? '#c8b898' : '#a89a80') : litSide ? lit(base, 0.22) : r === 1 ? lit(base, -0.3) : base;
              if (r < bh && h2(col, sh, 14) < 0.35 && (r === 2 || r === bh - 1)) c = lit(base, -0.4);
              if (r === bh - 2 && h2(col, sh, 15) < 0.25 && litSide) c = '#e0b040'; }
            P.put(x, y, c); } }
        // 벽이 좁아지는 양끝: 책 대신 말린 두루마리 · 약병 · 수정 · 모래시계 · 단지 · 초
        const OBJ = { scroll: [['ppppppq', 'plllpPq', 'ppppppq'], { p: '#d8ccb0', l: '#8a7a5a', P: '#a8987c', q: '#7a2a2a' }], flask: [['.c.', '.g.', 'gGg', 'ggd'], { c: '#b08a5a', g: '#5a3a6a', G: '#9a7ab0', d: '#3a2448' }],
          crystal: [['..c..', '.cC..', 'cCCcc', 'ccCcc'], { c: '#5a8ab0', C: '#c8e8ff' }], hourglass: [['wwww', '.sa.', '..a.', '.aa.', 'wwww'], { w: '#8e6e50', s: '#c8d8e0', a: '#e0c070' }],
          jar: [['tttt', 'jJjj', 'jjjd'], { t: '#8a7a5a', j: '#6a7a5a', J: '#9aaa8a', d: '#3a4a3a' }], candle: [['.y.', '.w.', 'www'], { y: '#ffd34d', w: '#e8e0c8' }] };
        // v2.86 집기는 각 층 안에: 가운데 칸 기준으로 층 바닥에 올리고, 층을 나누는 선반 널과 책장 밖으로 나간 부분은 가려지게 그린다
        const hgtAt = x => Math.round(24 * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - ecx) / erx) ** 2)) ** 0.5);
        const put = (k, x, ly0) => { const [R, pal] = OBJ[k], w = R[0].length, h = R.length, ybc = wallTop(x + (w >> 1)); if (ybc == null) return;
          const vis = (px, py) => { const yb = wallTop(px); if (yb == null) return false; const ly = yb - py; return ly >= 1 && ly <= hgtAt(px) && ly % 8 !== 0; };
          let y0 = ybc - ly0 - h + 1, best = -1; // 그 층 안에서 가장 많이 보이는 높이로 (같으면 아래 = 널 위에 얹힘)
          for (let d = 4; d >= -4; d--) { const yy = ybc - ly0 - h + 1 + d; let n = 0; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (R[j][i] !== '.' && vis(x + i, yy + j)) n++; if (n > best) { best = n; y0 = yy; } }
          const at = (i, j) => (j >= 0 && j < h && i >= 0 && i < w) ? R[j][i] : '.';
          for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) { const ch = at(i, j), px = x + i, py = y0 + j;
            const col = ch !== '.' ? pal[ch] : [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(i + dx, j + dy) !== '.') ? K : null; if (!col) continue;
            if (!vis(px, py)) continue; // 책장 밖 · 선반 널 뒤는 가림
            P.put(px, py, col); } };
        void put; } // v2.86 양끝 집기는 치움 (빈 선반)

      // 바닥 책 다시 그림: 납작한 사각형 → 두께가 보이는 책 (표지 윗면 · 금박 제목 · 앞쪽 종이 단면 줄무늬 · 책등) · 책 더미는 권마다 어긋나게
      { const F = Grid(); flagstones(F, 0, 0, GW, GH, { a: '#46424f', b: '#423e4a', c: '#3e3a46', gap: '#24222c', hi: '#524e5c', speck: '#5a5668' }, 3, 12, 8); const fd = F.g.getImageData(0, 0, GW, GH).data;
        const clear = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const i = (y * GW + x) * 4; P.put(x, y, `rgb(${fd[i]},${fd[i + 1]},${fd[i + 2]})`); } };
        const lit = (h, a) => { const n = parseInt(h.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v + (a > 0 ? (255 - v) * a : v * a)))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join(''); };
        const closedB = (x, y, c) => P.spr(['hhhhhhhh', 'CCyyyCCd', 'CCCCCCCd', 'SpPpPpPd', 'SPpPpPpd'], { h: lit(c, 0.3), C: c, d: lit(c, -0.35), y: '#e0b040', S: lit(c, -0.2), p: '#e8dcc0', P: '#bfb090' }, x, y);
        const openB = (x, y) => P.spr(['.hhhh.hhhh.', 'hPPPPgPPPPh', 'hPllPgPllPh', 'hPPPPgPllPh', 'pPPPPgPPPPp', 'ccccccccccc'], { h: '#c8b898', P: '#e8dcc0', l: '#8a7a6a', g: '#a89878', p: '#bfb090', c: '#5e4430' }, x, y);
        const stackB = (x, y, cols) => { cols.forEach((c, i) => { const ox = (i % 2) ? 1 : (i % 3 === 2 ? -1 : 0), yy = y - i * 3, w = 11 - (i % 2);
            for (let k = 0; k < w; k++) { P.put(x + ox + k, yy, k === 0 ? lit(c, -0.2) : c); P.put(x + ox + k, yy + 1, k === 0 || k === w - 1 ? lit(c, -0.35) : (k & 1 ? '#e8dcc0' : '#bfb090')); P.put(x + ox + k, yy + 2, lit(c, -0.4)); }
            P.rect(x + ox - 1, yy, 1, 3, K); P.rect(x + ox + w, yy, 1, 3, K); if (i === 0) P.rect(x + ox - 1, yy + 3, w + 2, 1, K); });
          const t = cols.length - 1, c = cols[t], ox = (t % 2) ? 1 : (t % 3 === 2 ? -1 : 0), w = 11 - (t % 2), yy = y - t * 3;
          P.rect(x + ox - 1, yy - 3, w + 2, 1, K); P.rect(x + ox - 1, yy - 2, 1, 2, K); P.rect(x + ox + w, yy - 2, 1, 2, K);
          for (let k = 0; k < w; k++) { P.put(x + ox + k, yy - 2, lit(c, 0.3)); P.put(x + ox + k, yy - 1, k > 2 && k < 6 ? '#e0b040' : lit(c, 0.12)); } };
        clear(281, 104, 16, 18); clear(212, 108, 16, 12); clear(117, 111, 11, 7); clear(131, 147, 11, 7); clear(99, 127, 11, 7); clear(253, 145, 13, 7); clear(203, 91, 13, 7);
        stackB(283, 117, ['#7a2a2a', '#2e4a6a', '#6a5a2a', '#3a6a3a']); stackB(215, 116, ['#2e4a6a', '#7a2a2a', '#5a3a6a']);
        closedB(119, 112, '#7a2a2a'); closedB(133, 148, '#2e4a6a'); closedB(101, 128, '#3a6a3a'); openB(254, 146); openB(204, 92); }
      const T = DK(P), FM = T.set(['#46424f', '#423e4a', '#3e3a46', '#24222c', '#524e5c', '#5a5668']);
      T.refresh(); const F2 = T.set(['#46424f', '#423e4a', '#3e3a46', '#24222c', '#524e5c', '#5a5668', '#64505e', '#544858']);
      // 접지 그림자
      const SH = (cx, cy, rx) => T.oval(F2, cx + 2, cy + 0.5, rx, 2.4, '#1c1a22', cx * 7 + cy, 1.3);
      SH(159, 95, 9); SH(91, 97, 4); SH(124, 97, 4); SH(262, 95, 8); SH(255, 117, 26); SH(221, 119, 8); SH(289, 120, 8); SH(124, 117, 6); SH(138, 153, 6); SH(106, 133, 6); SH(260, 152, 7); SH(210, 98, 7);
      // 바닥 금 · 벽 밑 이끼
      for (const pts of [[[96, 140], [104, 144], [106, 150], [114, 154]], [[276, 92], [282, 98], [281, 104]], [[150, 162], [158, 166], [166, 165]]]) for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)); for (let k = 0; k <= n; k++) T.on(F2, Math.round(ax + (bx - ax) * k / n), Math.round(ay + (by - ay) * k / n), '#1c1a22'); }
      const ecx = CX, ecy = 114, erx = 118, ery = 64;
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const q = ((x + 0.5 - ecx) / erx) ** 2 + ((y + 0.5 - ecy) / ery) ** 2; if (q > 1 || q < 0.86 || y < 100) continue; const n = vnoise(x, y, 811, 8); if (n > 0.55 && (((x + y) & 1) || n > 0.68)) T.on(F2, x, y, n > 0.66 ? '#3e5634' : '#2e4228'); }
      // 흩어진 양피지 (글줄 · 접힌 모서리) · 깃펜 하나
      const sheet = (x, y, f) => { P.spr(f ? ['pppppppq', 'plllllpq', 'ppppppp.', 'pllllpp.', 'ppppppp.'] : ['qpppppp', 'pllllpp', 'ppppppp', 'plllppp', 'pppppp.'], { p: '#d8ccb0', l: '#7a6a5a', q: '#a8987c' }, x, y); T.oval(F2, x + 5, y + 6, 5, 1.2, '#1c1a22', x + y, 1.2); };
      sheet(112, 146, 0); sheet(266, 138, 1); sheet(214, 92, 0); sheet(128, 104, 1);
      P.spr(['w....', '.wW..', '..wW.', '...Wb', '....b'], { w: '#e8e0d0', W: '#a8a0b0', b: '#2a2228' }, 124, 152, false);
      // 잉크 쏟은 자국 (책상 앞) + 뒤집힌 잉크병
      T.oval(F2, 240, 126, 6, 2, '#141a2a', 812, 1.4); T.oval(F2, 238, 126, 3, 1, '#20304a', 813, 1.5); P.spr(['.kk', 'kbbk', '.kk.'].map(r => r.padEnd(4, '.')), { k: '#3a4a5a', b: '#1a2a40' }, 232, 124);
      // 칠판 밑 분필 가루 · 분필 동강
      for (let i = 0; i < 18; i++) { const x = 92 + Math.floor(h2(i, 1, 814) * 34), y = 98 + Math.floor(h2(i, 2, 814) * 4); if ((x + y) & 1) T.on(F2, x, y, '#8a8694'); }
      P.spr(['ww'], { w: '#e8e4ec' }, 104, 100); P.spr(['ww'], { w: '#e8e4ec' }, 116, 101);
      // 마법진 둘레 반짝이는 별가루 몇 점
      for (const [x, y] of [[156, 120], [228, 116], [210, 152], [170, 150], [234, 140]]) { T.on(F2, x, y, '#e0b040'); T.on(F2, x, y - 1, '#9a7028'); }
    };
  }
  // ---------------------------------------------------------------- 4. 종이 멈춘 수도원 디테일: 판석 바닥 · 색유리 빛 · 융단 무늬 · 신도석 다시 그림 · 벽 기둥 · 제단 소품 · 무너진 돌 · 이끼
  {
    const base = SCENES.priest.draw;
    SCENES.priest.draw = function (P) {
      base(P);
      const top = RY0 - 28, T = DK(P);
      // 1) 바닥: 두 색 바둑판 → 크기 다른 판석 (같은 회보라 톤)
      { const F = Grid(); flagstones(F, RX0, RY0, RX1, RY1, { a: '#5a5664', b: '#54505e', c: '#4e4a58', gap: '#2e2a36', hi: '#66616e', speck: '#6e6a76' }, 9, 13, 8);
        const fd = F.g.getImageData(0, 0, GW, GH).data, OLD = T.set(['#524e5c', '#5c5866', '#2e2a36', '#5e5a68', '#68636f', '#423e4a']);
        for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) if (OLD.has(T.col(x, y))) { const i = (y * GW + x) * 4; P.put(x, y, `rgb(${fd[i]},${fd[i + 1]},${fd[i + 2]})`); } T.refresh(); }
      const FS = T.set(['#5a5664', '#54505e', '#4e4a58', '#2e2a36', '#66616e', '#6e6a76']);
      const GL = ['#6a5468', '#525c74', '#6a6852'];
      T.refresh(); const F2 = T.set(['#5a5664', '#54505e', '#4e4a58', '#2e2a36', '#66616e', '#6e6a76'].concat(GL));
      // 3) 벽: 창 사이 반기둥 · 금 · 물 얼룩 · 담쟁이
      for (const px of [155, 229]) { P.rect(px - 1, top, 8, 28, K); for (let y = top; y < RY0; y++) for (let x = 0; x < 6; x++) P.put(px + x, y, x === 0 ? '#77717e' : x === 5 ? '#3a3542' : (y - top) % 7 === 6 ? '#3e3a46' : '#5e5a68');
        P.rect(px - 2, top + 2, 10, 2, '#8e8894'); P.rect(px - 2, top + 4, 10, 1, '#45404c'); P.rect(px - 2, RY0 - 3, 10, 3, '#6a6572'); P.rect(px - 2, RY0 - 3, 10, 1, '#8e8894'); }
      for (const [x0, y0, pts] of [[96, top + 6, [[0, 0], [3, 4], [2, 8], [5, 12]]], [292, top + 4, [[0, 0], [-2, 5], [1, 9]]]]) for (let i = 0; i < pts.length - 1; i++) P.line(x0 + pts[i][0], y0 + pts[i][1], x0 + pts[i + 1][0], y0 + pts[i + 1][1], '#1e1c24');
      for (const x of [140, 210, 248]) for (let y = top + 1; y < top + 12 + (x % 5); y++) if ((x + y) & 1) P.put(x, y, '#3e3a46');
      for (let i = 0; i < 30; i++) { const x = RX1 - 2 - Math.floor(h2(i, 1, 903) * 16 * (1 - i / 40)), y = top + Math.floor(i * 0.9); if (y >= RY0) break; P.put(x, y, i & 1 ? '#3e5634' : '#2e4228'); if (i % 3 === 0) P.put(x - 1, y, '#4e6e3c'); }
      // 4) 융단: 금테 + 마름모 무늬 + 닳은 구멍 + 위쪽 술 + 구겨진 주름
      { const x0 = CX - 13, x1 = CX + 13, y0 = RY0 + 14;
        for (let y = y0; y < RY1; y++) for (let x = x0; x < x1; x++) { const lx = x - x0, ly = y - y0;
          let c = lx === 0 || lx === 25 ? '#3a1014' : lx === 1 || lx === 24 ? '#b08a38' : lx === 2 || lx === 23 ? '#4a1418' : '#661c22';
          if (lx > 3 && lx < 22) { const dx = Math.abs(lx - 12.5), dy = Math.abs((ly % 14) - 7); if (Math.abs(dx + dy - 5) < 0.6) c = '#8a2a2e'; else if (dx + dy < 2) c = '#a0703a'; else if ((x + y) % 2 === 0 && h2(x, y, 904) < 0.12) c = '#5a1820'; }
          if (h2(x >> 1, y >> 1, 905) < 0.04 && lx > 2 && lx < 23) c = '#54505e';
          P.put(x, y, c); }
        for (let x = x0 + 1; x < x1 - 1; x += 2) { P.put(x, y0 - 1, '#b08a38'); P.put(x, y0 - 2, '#7a5a20'); }
        for (let i = 0; i < 18; i++) { P.put(x0 + 4 + i, 122 - (i >> 2), '#8a2a2e'); P.put(x0 + 4 + i, 123 - (i >> 2), '#3a1014'); }
        for (let y = 146; y < 156; y++) for (let x = CX - 9; x < CX + 1; x++) if (h2(x, y, 53) < 0.55 && ((x - CX + 4) ** 2 / 25 + (y - 151) ** 2 / 25) < 1) P.put(x, y, (x + y) & 1 ? '#54505e' : '#4e4a58'); }
      // 5) 신도석 다시 그림: 조각한 끝판(둥근 머리) · 등받이 · 앉는 판 · 앞판 · 접지 그림자 · 찬송가 책
      const W1 = '#9a7a5a', W2 = '#7e5e44', W3 = '#6e5038', W4 = '#4e3626', W5 = '#33241a';
      const pew = (x, y, w, br, seed) => {
        P.rect(x - 2, y - 4, w + 4, 16, null);
        P.rect(x - 1, y - 1, w + 2, 13, K);
        for (let i = 0; i < w; i++) { P.put(x + i, y, W1); P.put(x + i, y + 1, W3); P.put(x + i, y + 2, W4); P.put(x + i, y + 3, '#1e140e'); P.put(x + i, y + 4, W2); P.put(x + i, y + 5, W1); P.put(x + i, y + 6, W3); P.put(x + i, y + 7, W3); P.put(x + i, y + 8, W4); P.put(x + i, y + 9, (i % 9 === 0) ? W5 : W4); P.put(x + i, y + 10, W5); if (h2(i, y, seed) < 0.06) P.put(x + i, y + 6, W4); }
        for (const ex of [x - 2, x + w - 1]) { P.spr(['.ee.', 'eEEe', 'eEEe', 'eEEe', 'eEEe', 'eEEe', 'eEEe', 'eEEe', 'eEEe', 'eEEe', 'eEEe', 'eEEe', 'eddE', 'dddd'], { e: W5, E: W2, d: '#2a1e14' }, ex, y - 3); P.put(ex + 1, y - 2, W1); }
        for (let i = 0; i < w + 4; i++) if ((i + y) & 1 || (i > 2 && i < w)) T.on(F2, x + i, y + 12, '#2a2632'); for (let i = 3; i < w + 3; i++) if ((i + y) & 1) T.on(F2, x + i, y + 13, '#2a2632');
        if (br) { const bx = x + Math.floor(w * 0.5); P.rect(bx - 1, y - 1, 6, 13, '#54505e'); P.rect(bx - 1, y + 11, 6, 1, '#2e2a36'); for (let j = 0; j < 11; j++) { P.put(bx - 1, y + j, (j & 1) ? W2 : W5); P.put(bx + 4, y + j, (j & 1) ? W5 : W2); } P.put(bx + 1, y + 6, W2); P.put(bx + 2, y + 9, W3); }
      };
      T.refresh();
      [RY0 + 30, RY0 + 50, RY0 + 70, RY0 + 90, RY0 + 110].forEach((y, i) => { pew(RX0 + 14, y, 78, i === 1 || i === 4, i); if (i !== 3) pew(CX + 22, y, 78, i === 2, i + 9); });
      { const bx = 262, by = 148; // 쓰러진 종은 신도석 위에 다시
        P.spr(['.....oooooo.....', '...ooOOOOOOoo...', '..oOOyyyyyyOOo..', '.oOyyYYyyyyyyOo.', '.oOyYYyyyyyyyOo.', 'oOyyYyyyyyyyyyOo', 'oOyyyyyyyyyyyyOo', 'oOyyyyyyyyyyyyOo', 'oOOyyyyyyyyyyOOo', '.oooOOOOOOOOooo.', '...oooooooooo...'], { o: '#5a3c14', O: '#9a7028', y: '#c09038', Y: '#f0d080' }, bx, by - 6, true);
        P.line(bx + 10, by - 4, bx + 12, by + 2, '#3a2a14'); P.line(bx + 12, by + 2, bx + 10, by + 4, '#3a2a14');
        P.spr(['.kk.', 'kKKk', 'kKKk', '.kk.'], { k: '#1a1416', K: '#5a3c14' }, bx - 5, by + 1);
        for (let i = 0; i < 28; i++) { const x = bx - 8 - i, y = by + 3 + Math.round(Math.sin(i * 0.55) * 2); P.put(x, y, i & 1 ? '#9a8a6a' : '#6a5a3a'); P.put(x, y + 1, '#3a2a1e'); } }
      const book = (x, y, c) => P.spr(['cccc', 'cwwc'], { c, w: '#e8e0c8' }, x, y);
      book(RX0 + 30, RY0 + 34, '#5e1a20'); book(RX0 + 60, RY0 + 74, '#2e4a3a'); book(CX + 70, RY0 + 54, '#5e1a20'); book(CX + 36, RY0 + 114, '#3a3a5e');
      // 6) 제단: 펼친 경전 · 마른 꽃병 · 초에 흘러내린 촛농
      P.spr(['.pppp.pppp.', 'plllpkplllp', 'ppppPkPpppp', '.kkkkkkkkk.'], { p: '#e8e0c8', P: '#c8c0a8', l: '#8a7a6a', k: '#5a1418' }, CX - 6, RY0 - 15, false);
      for (const vx of [CX - 34, CX + 30]) { P.spr(['.f.f.', 'f.f.f', '.bfb.', '..s..', '.vVv.', '.vVv.', '..v..'], { f: '#9a6a5a', b: '#7a5a3a', s: '#5a6a3a', v: '#6a7aa0', V: '#9aa8c8' }, vx, RY0 - 3); }
      for (const cx of [CX - 15, CX + 13]) { P.put(cx, RY0 - 13, '#f0e8d8'); P.put(cx + 1, RY0 - 15, '#f0e8d8'); P.put(cx + 1, RY0 - 14, '#d8d0c0'); }
      // 7) 종 옆: 천장에서 떨어진 돌 조각 · 먼지
      for (const [x, y, w, h] of [[246, 160, 5, 3], [284, 156, 4, 3], [252, 140, 3, 2], [290, 146, 6, 3]]) { P.rect(x - 1, y - 1, w + 2, h + 2, K); P.rect(x, y, w, h, '#625d6a'); P.rect(x, y, w, 1, '#8a8490'); P.rect(x + w - 1, y + 1, 1, h - 1, '#3a3542'); }
      T.refresh(); T.oval(F2, 268, 158, 22, 5, '#6e6a76', 906, 0.6);
      // 8) 벽 밑 이끼 · 구석 거미줄
      for (let x = RX0; x < RX1; x++) if (vnoise(x, 0, 907, 10) > 0.62) for (let y = RY0; y < RY0 + 2 + (x % 3); y++) if ((x + y) & 1) T.on(F2, x, y, '#2e4228');
      T.web(RX0, top, 1, 8, '#8a8490'); T.web(RX1 - 1, top, -1, 6, '#8a8490');
    };
  }
  // ---------------------------------------------------------------- 5. 이름 없는 묘지 디테일: 격자 없는 풀밭 · 흙 얼룩 · 디딤돌 길 · 풀포기 · 들꽃 · 낙엽 · 버섯 · 접지 그림자
  {
    const base = SCENES.gunner.draw;
    SCENES.gunner.draw = function (P) {
      base(P);
      const T = DK(P), G0 = T.set(['#2e2c20', '#363222', '#22301e', '#263422', '#2c3e26', '#3e5030', '#3e5634', '#32482c']);
      // 풀밭 다시 칠하기: 8칸 네모 흙 자국(격자) 대신 부드러운 잡음 얼룩
      for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) { if (!G0.has(T.col(x, y))) continue;
        const n = vnoise(x, y, 701, 11), m = vnoise(x, y, 702, 7), v = h2(x, y, 703), dith = ((x + y) & 1) ? 0.03 : -0.03;
        let c;
        if (n + dith < 0.3) c = v < 0.5 ? '#2e2a1e' : '#35301f';
        else if (n + dith < 0.34) c = (x + y) & 1 ? '#2e2a1e' : '#263220';
        else c = m < 0.35 ? (v < 0.5 ? '#202c1c' : '#24301e') : m < 0.7 ? (v < 0.55 ? '#263422' : '#2a3a24') : (v < 0.5 ? '#2c3e26' : '#30442a');
        if (v > 0.985) c = '#3e5030';
        P.put(x, y, c); }
      T.refresh();
      const GR = T.set(['#2e2a1e', '#35301f', '#263220', '#202c1c', '#24301e', '#263422', '#2a3a24', '#2c3e26', '#30442a', '#3e5030']);
      // 흙더미 다시: 바닥이 일자로 잘린 모양 → 아래 가장자리가 둥글게 퍼지고 흙 부스러기가 풀밭으로 흩어짐 (삽도 다시 꽂음)
      { const px = 260, py = 108, MS = T.set(['#8a7254', '#6e5a40', '#56442f', '#3e3022', '#5e4a34', '#9a8264', '#2e2216', '#0b0a0e', '#77717e', '#9a94a4', '#4e4a58', '#9a9aa4', '#9a7a5a', '#6a6a76', '#b09070', '#d8d8e4', '#a4a4b0', '#6a5438', '#5a4632']);
        const grass = (x, y) => { const n = vnoise(x, y, 701, 11), m = vnoise(x, y, 702, 7), v = h2(x, y, 703); return n < 0.3 ? (v < 0.5 ? '#2e2a1e' : '#35301f') : m < 0.35 ? '#24301e' : m < 0.7 ? '#263422' : '#2c3e26'; };
        for (let y = 78; y <= 114; y++) for (let x = 239; x <= 283; x++) if (MS.has(T.col(x, y))) P.put(x, y, grass(x, y));
        const pileH = x => 13 * Math.exp(-((x / 9) ** 2)) + 3 * Math.exp(-(((x - 10) / 4) ** 2)) + (h2(Math.floor(x / 2), 0, 556) - 0.5) * 1.4;
        const bot = x => Math.round(5.6 * Math.sqrt(Math.max(0, 1 - (x / 20) ** 2))); // 앞 가장자리: 가운데가 아래로 둥글게, 양끝은 윗선과 만나 뾰족하지 않게 잦아듦
        const top2 = x => Math.max(0, Math.round(pileH(x) * Math.min(1, Math.sqrt(Math.max(0, 1 - (x / 20) ** 2)) * 1.6)));
        const ins = (x, y) => x >= -20 && x <= 20 && y >= -top2(x) && y <= bot(x) && (top2(x) + bot(x) > 0);
        for (let y = 0; y <= 9; y++) for (let x = -25; x <= 25; x++) { const q = (x / 24) ** 2 + ((y - 3) / 5.5) ** 2; if (q > 1 || ins(x, y)) continue; if (((x + y) & 1) && h2(x, y, 559) < (1 - q) * 1.3) P.put(px + x, py + y, h2(x, y, 560) < 0.5 ? '#56442f' : '#46382a'); } // 흘러내린 부스러기
        for (let y = -16; y <= 7; y++) for (let x = -21; x <= 21; x++) { if (ins(x, y)) { const t = top2(x), b = bot(x), k = (y + t) / Math.max(1, t + b); let c = k < 0.18 ? '#8a7254' : k < 0.45 ? '#6e5a40' : k < 0.75 ? '#56442f' : '#3e3022'; if (x > 6 && k < 0.5) c = '#5e4a34'; if (h2(x, y, 557) < 0.07) c = '#9a8264'; if (h2(x, y, 558) < 0.05) c = '#2e2216'; P.put(px + x, py + y, c); }
          else if (ins(x + 1, y) || ins(x - 1, y) || ins(x, y + 1) || ins(x, y - 1)) P.put(px + x, py + y, K); }
        for (const [dx, dy] of [[-9, 2], [4, 3], [10, 0], [-3, 4], [-13, 2]]) { P.rect(px + dx, py + dy, 2, 2, '#77717e'); P.put(px + dx, py + dy, '#9a94a4'); P.put(px + dx + 1, py + dy + 1, '#4e4a58'); }
        for (const [dx, dy] of [[-22, 5], [21, 6], [-20, 3], [23, 4], [-6, 8], [8, 8]]) { P.rect(px + dx, py + dy, 2, 1, '#56442f'); P.put(px + dx, py + dy + 1, '#2e2216'); }
        const bx = px + 3, by = py - 9;
        for (let i = 1; i < 14; i++) { const x = bx - i, y = by - i; P.put(x - 1, y - 1, K); P.put(x, y - 1, K); P.put(x, y, i < 3 ? '#9a9aa4' : '#9a7a5a'); P.put(x - 1, y, i < 3 ? '#6a6a76' : '#b09070'); P.put(x - 2, y, K); P.put(x + 1, y, K); P.put(x, y + 1, K); P.put(x - 1, y + 1, K); }
        P.spr(['kkkk.', 'kWWWk', 'kWkWk', 'kkWkk'], { k: K, W: '#b09070' }, bx - 18, by - 17, false);
        P.spr(['..kkk..', '.kSSsk.', 'kSSssDk', '.kDDDk.'], { k: K, S: '#d8d8e4', s: '#a4a4b0', D: '#6a5438' }, bx - 2, by - 1, false);
        P.put(bx - 2, by + 3, '#5a4632'); P.put(bx + 3, by + 3, '#5a4632');
        T.refresh(); }
      // 천막 옆 물통·짐 상자: 텐트 고정 줄 뒤로 옮기고 다시 그림 (줄과 말뚝이 앞에 오게)
      { const grass = (x, y) => { const n = vnoise(x, y, 701, 11), m = vnoise(x, y, 702, 7), v = h2(x, y, 703); return n < 0.3 ? (v < 0.5 ? '#2e2a1e' : '#35301f') : m < 0.35 ? '#24301e' : m < 0.7 ? '#263422' : '#2c3e26'; };
        for (let y = 47; y <= 80; y++) for (let x = 164; x <= 188; x++) { const c = T.col(x, y); if (c === '#4e6e3c' || c === '#3a562e') continue; P.put(x, y, grass(x, y)); }
        // 물통 (위에서 보이는 물 · 쇠테 두 줄 · 리벳 · 국자)
        P.spr(['..rrrrrrr..', '.rWWWWWWWr.', 'rWwqwwwwwWr', 'rWwwwwqwwWr', '.rWWWWWWWr.', 'hHhhhhhhhhd', 'sSssssssDsd', 'sSsssSssDsd', 'sSssssssDsd', 'hHhhhhhhhhd', 'sSssssssDsd', '.sSssssDsd.', '..ddddddd..'],
          { r: '#8a6a4a', W: '#5e4430', w: '#2a3a4e', q: '#6a8aaa', h: '#4a4856', H: '#8a8a96', s: '#6e5038', S: '#8e6e50', D: '#3a2a1e', d: '#2a1e14' }, 170, 47);
        P.put(171, 52, '#b0aab8'); P.put(179, 52, '#b0aab8'); P.put(171, 56, '#b0aab8'); P.put(179, 56, '#b0aab8');
        P.spr(['.ll', 'l..', 'l..', 'l..'], { l: '#9a9aa4' }, 178, 46, false);
        // 짐 상자 (뒤로 젖힌 뚜껑 · 안의 천과 병 · 모서리 쇠붙이 · 못 · 찍힌 표식)
        const cx = 165, cy = 62;
        P.spr(['LLLLLLLLLLLLLL', 'lLlLLlLLLlLLlL', 'llllllllllllll'], { L: '#8e6e50', l: '#6e5038' }, cx + 1, cy - 4);
        P.spr(['iiiiiiiiiiiiiiii', 'iDDcCcDDDDgDDDDi', 'iDccccDDDDgGDDDi', 'TwwwwwwwwwwwwwwT', 'TWWWWWWWWWWWWWWT', 'TwwwwwwwwwwwwwwT', 'nPPPPPPPPPPPPPPn', 'TwwwwwxwwxwwwwwT', 'TWWWWWWxxWWWWWWT', 'TwwwwwxwwxwwwwwT', 'nPPPPPPPPPPPPPPn', '.dddddddddddddd.'],
          { i: '#4e3626', D: '#1e140e', c: '#7a2a2a', C: '#a04a40', g: '#2e5a3a', G: '#4e8a5a', w: '#7e5e44', W: '#6e5038', P: '#4e3626', T: '#8a8a96', n: '#b0aab8', x: '#2a1e14', d: '#2a1e14' }, cx, cy);
        for (const [x, y] of [[cx + 3, cy + 4], [cx + 12, cy + 4], [cx + 3, cy + 8], [cx + 12, cy + 8]]) P.put(x, y, '#b0aab8');
        // 고정 줄 · 말뚝을 다시 앞에
        const sx = 172, sy = 77; P.line(156, 43, sx, sy, '#c8b890'); P.line(156, 44, sx, sy + 1, '#4a4848'); P.rect(sx - 1, sy - 1, 3, 5, K); P.rect(sx, sy, 1, 4, '#8e6e50'); P.put(sx, sy, '#b09070');
        T.refresh(); }
      const free = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (!GR.has(T.col(x, y))) return false; return true; };
      // 접지 그림자 (빛은 왼쪽 위 → 오른쪽 아래로)
      for (const [gx, gy] of [[112, 110], [144, 110], [176, 110], [112, 146], [144, 146], [176, 146]]) T.oval(GR, gx + 3, gy + 1.5, 8, 2.4, '#141c12', gx + gy, 1.3);
      T.oval(GR, 176, 75, 10, 2.4, '#141c12', 711, 1.3); T.oval(GR, 245, 150, 18, 2.6, '#141c12', 712, 1.2); T.oval(GR, 280, 156, 15, 2.2, '#141c12', 713, 1.2);
      T.oval(GR, 92, 172, 6, 1.8, '#141c12', 714, 1.3); T.oval(GR, 304, 172, 6, 1.8, '#141c12', 715, 1.3); T.oval(GR, 128, 84, 44, 3, '#141c12', 716, 1);
      T.refresh();
      // 풀포기 (3가지 모양) · 들꽃 · 버섯 — 빈 풀밭에만, 격자 피해 흩뿌림
      const TUFT = [['.g..g', 'gGg.G', '.Gg.g'], ['g.g', 'GgG'], ['..g.', '.gG.', 'gGgG']];
      for (let i = 0; i < 70; i++) { const x = RX0 + 2 + Math.floor(h2(i, 1, 720) * (RX1 - RX0 - 8)), y = RY0 + 4 + Math.floor(h2(i, 2, 720) * (RY1 - RY0 - 8)), t = TUFT[i % 3];
        if (!free(x - 1, y - 1, t[0].length + 2, t.length + 2)) continue;
        P.spr(t, { g: '#4e6e3c', G: '#3a562e' }, x, y, false);
        if (i % 6 === 0) { P.put(x + 1, y - 1, '#e8e0d0'); P.put(x + 1, y, '#c8b878'); } else if (i % 9 === 4) P.put(x + 2, y - 1, '#c88aa8'); }
      for (const [x, y] of [[300, 98], [266, 104], [96, 116], [204, 76], [120, 166]]) if (free(x - 1, y - 1, 5, 5)) P.spr(['.rr.', 'rRrr', '.ww.'], { r: '#8a4a3a', R: '#c06a4a', w: '#d8d0c0' }, x, y);
      // 마른 나무 밑 낙엽
      for (let i = 0; i < 24; i++) { const a = h2(i, 3, 730) * Math.PI * 2, r = 4 + h2(i, 4, 730) * 20, x = Math.round(292 + Math.cos(a) * r * 1.3), y = Math.round(100 + Math.sin(a) * r * 0.5) + 2;
        const c = ['#8a5a2a', '#6e4420', '#a06a30', '#5a3a1e'][i % 4]; if (GR.has(T.col(x, y)) && GR.has(T.col(x + 1, y))) { P.put(x, y, c); P.put(x + 1, y, i & 1 ? c : '#3a2614'); } }
      // 흩어진 잔돌
      for (let i = 0; i < 14; i++) { const x = RX0 + 4 + Math.floor(h2(i, 5, 740) * (RX1 - RX0 - 10)), y = RY0 + 6 + Math.floor(h2(i, 6, 740) * (RY1 - RY0 - 12)); if (!free(x - 1, y - 1, 4, 3)) continue; P.put(x, y, '#77717e'); P.put(x + 1, y, '#57525e'); P.put(x, y + 1, '#3a3542'); P.put(x + 1, y + 1, '#141814'); }
    };
  }

  // ---------------------------------------------------------------- v2.97 단군의 은신처: 의뢰 중개인 고양이 「단군」(바 앞) + 바닥에 꽂아 세운 단도
  // 얼굴형은 네로 기준 · 털은 흰 바탕 + 주황 얼룩(보는 쪽 왼쪽 얼굴 · 귀 · 머리 위 · 오른쪽 눈 위) · 분홍 코 · 올리브빛 호박색 눈 · 붉은 스카프 · 주황 꼬리
  const DANGUN = [
    "....k...k.....", "...kok.kok....", "..kpok.kopk...", "..koooooook...", ".kdooowoooOk..", "kdooEwwwEwwWk.", ".kooewwwewWk..", "..kowwNwwWkkk.",
    ".kodRRrRRdokOk", "kooRRRrRRwwkok", "kowwkrrkwwwkok", ".kowwwwwwwokdk", "..kwwkkkkwwk..", "..kkkk..kkkk..",
  ];
  const DANGUN_PAL = { k: '#0b0a0e', w: '#f6f2ea', W: '#d8d0c4', o: '#d98a3e', O: '#eaa860', d: '#a8602a', p: '#e8a0a0', N: '#e8909a', E: '#1a1410', e: '#a8a04a', R: '#c03a30', r: '#8a2420' };
  const DAGGER = ['.y.', '.g.', '.G.', '.g.', 'xXx', '.sS', '.sS', '.sS', '.sS', '.s.'], DAGGER_PAL = { k: '#0b0a0e', y: '#e0b040', g: '#5a3a22', G: '#8a6a3a', x: '#77717e', X: '#c8ccd4', s: '#e0e4ec', S: '#8a8e98' };
  const NPC_ART = {};
  const npcArt = (k, fn) => NPC_ART[k] || (NPC_ART[k] = fn());
  function dangunRows(crouch, blink, tail) {
    let R = DANGUN.map(r => r.split(''));
    if (blink) { R[5][4] = 'o'; R[5][8] = 'w'; R[6][4] = 'E'; R[6][8] = 'E'; } // 감은 눈: 아래 칸만 진한 선
    if (tail) { R[6][12] = 'k'; R[7][12] = 'k'; R[7][13] = 'k'; } // 꼬리 끝 1칸 까딱
    R = R.map(r => r.join(''));
    return crouch ? ['.'.repeat(R[0].length)].concat(R.slice(0, 10), R.slice(11)) : R; // 발은 그대로, 몸만 1칸 내려앉음
  }
  // v3.16 단군 대사 정리 (인사 · 혼잣말 · F 대화)
  const DANGUN_LINES = ['좋은 의뢰가 들어왔다냥.', '수수료는 일 끝나고 받겠다냥.', '게시판 의뢰는 다 내 손을 거쳤다냥.', '누구한테 들었는지는 묻지 말라냥.'];
  const DANGUN_GREET = ['어이, 살아 돌아왔냥.', '일거리 찾으러 왔냥?', '눈 떴냥? 일감이 밀렸다냥.'];
  const DANGUN_TALKS = ['이번 의뢰인 이름? 그건 나도 모른다냥. 계약서가 올 때부터 찢겨 있었다냥. 보수만 확실하면 이름은 상관없다냥.',
    '바닥에 꽂힌 단도는 건드리지 말라냥. 떼인 수수료 대신 받아 둔 거다냥. 주인이 찾으러 올 때까진 내 거다냥.',
    '역마차가 끊긴 지 오래다냥. 그래도 소문은 마차보다 빠르다냥. 길은 끊겨도 내 장사는 안 끊긴다냥.',
    '넌 일은 깔끔한데 말이 없어서 좋다냥. 말 많은 놈은 꼭 수수료를 깎으려 든다냥.',
    '왕도 쪽 의뢰는 다들 피한다냥. 돌아온 놈이 없으니 보수를 받아 간 놈도 없다냥. …그러니 네가 첫 번째가 되라냥.'];
  SCENES.ranger.npc = { x: 238, y: 78, dag: [231, 80] };
  // v3.11 하비: 그레이브의 라이벌이자 마지막 남은 동료 (흰 고양이 · 허리 뒤에 일자로 맨 더블배럴 샷건). 대사는 나중에
  const HABI = {"f":{"base":["..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaanwwwnwwAkkHk...",".KKKKKkaaauwwwuwAAkkHk...","KBbbbbbkaawwNwwAAkKkHkKK.","KBBBBBBBkk11SSSkkBskHkssK","KBbbbbbk23CCBCCCckskHkssK",".KKKKKKkAk23xCckakkWWkssK","........kCCCkCCCkkWWkSSSK",".........kFFk.kFFkkkKKKK.",".........kkkk.kkkk......."],"baseB":["..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaaawwwawwAkkHk...",".KKKKKkaaanwwwnwAAkkHk...","KBbbbbbkaawwNwwAAkKkHkKK.","KBBBBBBBkk11SSSkkBskHkssK","KBbbbbbk23CCBCCCckskHkssK",".KKKKKKkAk23xCckakkWWkssK","........kCCCkCCCkkWWkSSSK",".........kFFk.kFFkkkKKKK.",".........kkkk.kkkk......."],"idle":[".........................","..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaanwwwnwwAkkHk...",".KKKKKkaaauwwwuwAAkkHk...","KBbbbbbkaawwNwwAAkKkHkKK.","KBBBBBBBkk11SSSkkBskHkssK","KBbbbbbk23CCBCCCckskHkssK",".KKKKKKkAk23xCckakkWWkssK",".........kFFk.kFFkkkSSSSK",".........kkkk.kkkkKKKKKK."],"idleB":[".........................","..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaaawwwawwAkkHk...",".KKKKKkaaanwwwnwAAkkHk...","KBbbbbbkaawwNwwAAkKkHkKK.","KBBBBBBBkk11SSSkkBskHkssK","KBbbbbbk23CCBCCCckskHkssK",".KKKKKKkAk23xCckakkWWkssK",".........kFFk.kFFkkkSSSSK",".........kkkk.kkkkKKKKKK."]},"p":{"1":"#b9b9c3","2":"#a9a9b4","3":"#8f8f9b","A":"#d8d4cc","B":"#5a5a62","C":"#c9c9d1","F":"#8a8a96","H":"#fbf9f5","K":"#0b0a0e","N":"#e8909a","S":"#4a3020","W":"#dcd8d0","a":"#fbf9f5","b":"#8d9097","c":"#dcdce2","k":"#0b0a0e","n":"#16120e","p":"#eaa4a8","s":"#6b4a2a","u":"#cfa628","w":"#fbf9f5","x":"#5e5e6a"}};
  // v3.16 하비 대사: 그레이브에게 빚이 있는 현상금 사냥꾼 (라이벌이라는 말은 대사에 넣지 않음)
  const HABI_GREET = ['일어났나, 그레이브.', '삽은 내려놔라. 오늘은 납과 화약이 필요한 날이다.', '…또 그 표정이군.'];
  const HABI_LINES = ['묘지는 고요해서 좋군.', '빚은 잊지 않는다.', '두 발이면 충분하다.'];
  const HABI_TALKS = ['빚진 건 기억한다. 언제 갚을지는 내가 정한다.',
    '우린 그 녀석들의 머릿수로 먹고살지. 요즘은 영 수지타산이 맞지 않아. 아니… 살기 좋아졌다고 보는 게 맞겠지.',
    '잿빛 왕에게 걸린 현상금은 없다. 돈이 안 되는 일엔 안 끼는 게 원칙이다. …원칙은 빚 앞에선 접어 두지.',
    '내 이름은 비석에 새기지 마라. 빚진 채로 묻히긴 싫으니까.'];
  const TK = { habi: 0, dangun: 0, on: null }; // v3.16 시작 장소 NPC F 대화 (말 걸 때마다 다음 대사)
  SCENES.gunner.npc2 = { x: 294, y: 122 }; // 칸 좌표 (발밑) — 파낸 무덤 흙더미 오른쪽, 마른 나무 아래 // 칸 좌표 (발밑) — 바 앞에 걸터앉은 자리

  // ================================================================ 게임 연결부
  // 칸(2px) 좌표로 그린 장면을 바닥 캔버스에 2배로 깔고, 방 테두리(A)를 장면의 방 사각형에 맞춘다.
  const INFO = {
    knight: { line: '…맹세를 지켜야 해.', obs: [[108, 60, 16], [262, 56, 14], [212, 98, 9], [228, 98, 9], [244, 98, 9], [260, 98, 9], [276, 98, 9], [106, 112, 6], [118, 112, 6], [130, 112, 6], [258, 136, 7], [270, 136, 7], [286, 134, 6]], wm: [6, 130] },
    ranger: { line: '…피 냄새가 나.', rects: [[96, 87, 131, 91], [143, 87, 156, 91], [152, 54, 156, 91]], obs: [[238, 66, 7], [252, 66, 7], [266, 66, 7], [281, 68, 7], [238, 77, 5], [232, 79, 2], [186, 106, 10], [110, 150, 10], [108, 134, 6], [268, 150, 10], [268, 136, 6]], wm: [26, 157] },
    mage: { line: '…하늘이 아직 저물지 않았네요.', obs: [[70, 48, 26], [314, 48, 26], [70, 182, 28], [314, 182, 28], [160, 90, 5], [262, 92, 6], [238, 110, 7], [252, 110, 7], [266, 110, 7], [276, 110, 6], [106, 95, 8], [288, 112, 5]], wm: [3, 146] },
    priest: { line: '…오늘도 대답이 없으시군요.', obs: [], wm: [16, 132] },
    gunner: { line: '…묻을 놈이 하나 남았지.', obs: [[294, 120, 6], [92, 64, 10], [108, 64, 10], [124, 64, 10], [140, 64, 10], [156, 64, 10], [175, 53, 6], [172, 70, 8], [112, 104, 5], [144, 104, 5], [176, 104, 5], [112, 140, 5], [144, 140, 5], [176, 140, 5], [208, 104, 9], [224, 104, 9], [260, 104, 12], [288, 88, 6], [236, 138, 8], [250, 138, 8], [278, 150, 10], [84, 166, 4], [304, 166, 4]], wm: [4, 157] },
  };
  { // v2.86 관측탑: 칠판 · 보면대 · 혼천의는 그림 전체를 막고(뒤로 돌아가 위를 밟지 않게), 둥근 벽의 책장은 벽처럼 바닥선까지 막는다
    const r = INFO.mage.rects = [[86, 58, 126, 98], [148, 48, 172, 96], [248, 56, 276, 96], [226, 56, 298, 121], [72, 40, 82, 200], [302, 40, 312, 200]]; // 책상 · 책 더미는 뒤로 못 들어가게 그림 전체
    for (let x = 72; x < 312; x += 4) { let m = -1e9; for (let i = x; i < x + 4; i++) { const t = (i + 0.5 - 192) / 118; m = Math.max(m, Math.abs(t) <= 1 ? Math.round(114 + 64 * Math.sqrt(1 - t * t)) : 0); } if (m < 177) r.push([x, m, x + 4, 200]); } // 둥근 벽 아래쪽 · 옆쪽: 바닥 원 밖은 막음
    for (let x = 72; x < 312; x += 4) { let m = 1e9; for (let i = x; i < x + 4; i++) { const t = (i + 0.5 - 192) / 118; if (Math.abs(t) <= 1) m = Math.min(m, Math.round(114 - 64 * Math.sqrt(1 - t * t))); } if (m < 1e9) r.push([x, 40, x + 4, m]); }
  }
  { // 수도원: 신도석 줄 · 제단 · 종
    const o = INFO.priest.obs;
    [72, 92, 112, 132, 152].forEach((y, i) => { for (let x = 92; x <= 160; x += 12) o.push([x, y + 5, 6]); if (i !== 3) for (let x = 220; x <= 288; x += 12) o.push([x, y + 5, 6]); });
    o.push([176, 48, 8], [192, 48, 8], [208, 48, 8], [146, 46, 4], [236, 46, 4], [270, 146, 9]);
  }
  const ART = {};
  function art(cls) { // 장면 그림 (칸 384×216) — 한 번만 만든다
    if (ART[cls]) return ART[cls];
    const S = SCENES[cls]; setRoom(S.room); const P = Grid(); S.draw(P);
    const d = P.g.getImageData(0, 0, 1, 1).data, d2 = P.g.getImageData(0, GH - 1, 1, 1).data;
    return (ART[cls] = { c: P.c, room: [RX0, RY0, RX1, RY1], top: `rgb(${d[0]},${d[1]},${d[2]})`, bot: `rgb(${d2[0]},${d2[1]},${d2[2]})` });
  }
  const shapeKey = cls => 'home_' + cls;
  function ensureShape(cls) {
    const a = art(cls), [x0, y0, x1, y1] = a.room;
    SHAPES[shapeKey(cls)] = { w: (x1 - x0) * 2, h: (y1 - y0) * 2, n: SCENES[cls].name };
    return a;
  }
  // 칸 좌표 → 바닥 좌표 (setArena 다음에 부른다)
  const off = cls => { const [x0, y0] = art(cls).room; return { x: A.x0 - x0 * 2, y: A.y0 - y0 * 2 }; };
  const toW = (cls, cx, cy) => { const o = off(cls); return { x: o.x + cx * 2, y: o.y + cy * 2 }; };

  function makeRoom(cls) {
    ensureShape(cls); setArena(SHAPES[shapeKey(cls)]);
    const S = SCENES[cls], I = INFO[cls];
    const R = { id: 0, gx: 0, gy: 0, type: 'home', shape: shapeKey(cls), cls, doors: { n: null, s: null, w: null, e: null }, visited: true, seen: true, cleared: true, loot: [], seed: 7171, obs: [], props: [], style: { path: 'none' }, deco: [], sprites: [] };
    for (const [x, y, r] of I.obs) { const p = toW(cls, x, y); R.obs.push({ t: 'prop', c: true, x: p.x, y: p.y, r: r * 2 }); }
    for (const [x0, y0, x1, y1] of I.rects || []) { const a = toW(cls, x0, y0), b = toW(cls, x1, y1); R.obs.push({ t: 'prop', c: false, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, w: b.x - a.x, h: b.y - a.y, x0: a.x, y0: a.y, x1: b.x, y1: b.y }); } // v2.96 직사각형 막기 (역참 다락 가장자리: 보이는 건 그대로, 사다리로만 오르내림)
    const e = toW(cls, S.exit[0], S.exit[1]); R.door = { x: e.x, y: A.y1 }; // v2.55 출구는 아래 문 (마법진 없음) — 문으로 걸어 나가면 출발
    R.nav = buildNav(R.obs);
    return R;
  }
  // 바닥 칠하기 (05 paintRoomFloor에서 부름)
  function paint(g, R) {
    const a = art(R.cls), o = off(R.cls);
    g.save(); g.imageSmoothingEnabled = false;
    g.fillStyle = a.top; g.fillRect(0, 0, W, o.y + 216); g.fillStyle = a.bot; g.fillRect(0, o.y + 216, W, H - o.y - 216);
    const ac = a.c.getContext('2d'), L = ac.getImageData(0, 0, 1, GH).data, Rr = ac.getImageData(GW - 1, 0, 1, GH).data; // 장면 바깥 빈자리는 맨 끝 칸 색으로 이어 칠함
    for (let y = 0; y < GH; y++) { const c1 = [L[y * 4], L[y * 4 + 1], L[y * 4 + 2]], c2 = [Rr[y * 4], Rr[y * 4 + 1], Rr[y * 4 + 2]];
      g.fillStyle = `rgb(${c1[0]},${c1[1]},${c1[2]})`; g.fillRect(0, o.y + y * 2, o.x, 2); g.fillStyle = `rgb(${c2[0]},${c2[1]},${c2[2]})`; g.fillRect(o.x + GW * 2, o.y + y * 2, W - o.x - GW * 2, 2); }
    g.drawImage(a.c, o.x, o.y, GW * 2, GH * 2);
    g.restore();
  }
  // 빛: 장면의 빛 목록을 게임 광원으로
  function lights(list) {
    const R = G && G.dun && G.dun.cur; if (!R || R.type !== 'home') return;
    for (const l of SCENES[R.cls].lights) { const p = toW(R.cls, l.x, l.y); list.push({ x: p.x, y: p.y, r: l.r * 2, a: Math.min(1, l.a * 1.5), c: l.c ? l.c.join(',') : undefined, ca: l.c ? 0.12 : 0 }); }
  }

  // v2.97 시작 장소 NPC (깊이 정렬)
  // v2.86 관측탑 둥근 벽(아래쪽 · 옆쪽)은 캐릭터 위에 덮어 그린다 — 벽 가장자리에 선 캐릭터의 꼬리·옷자락이 벽에 가려지게
  let RING_FG = null;
  function ringFg() {
    if (RING_FG) return RING_FG;
    const a = art('mage'), [c, g] = mk(GW, GH), src = a.c.getContext('2d').getImageData(0, 0, GW, GH), out = g.createImageData(GW, GH);
    const ecx = 192, ecy = 114, erx = 118, ery = 64, inE = (x, y) => ((x + 0.5 - ecx) / erx) ** 2 + ((y + 0.5 - ecy) / ery) ** 2 <= 1;
    for (let y = ecy - 30; y < GH; y++) for (let x = 0; x < GW; x++) { const d = ((x + 0.5 - ecx) / (erx + 8)) ** 2 + ((y + 0.5 - ecy) / (ery + 8)) ** 2;
      if (d > 1 || inE(x, y) || (x >= 172 && x <= 212 && y >= 150)) continue; // 아래 계단 문은 빼고
      const i = (y * GW + x) * 4; for (let k = 0; k < 4; k++) out.data[i + k] = src.data[i + k]; }
    g.putImageData(out, 0, 0); return (RING_FG = c);
  }
  function ents(list) {
    const R = G && G.dun && G.dun.cur; if (!R || R.type !== 'home') return;
    if (R.cls === 'mage') { const o = off('mage'); list.push({ y: 1e9, d: () => { const im = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.drawImage(ringFg(), o.x, o.y, GW * 2, GH * 2); ctx.imageSmoothingEnabled = im; } }); }
    { const S2 = SCENES[R.cls], N2 = S2 && S2.npc2; if (N2) { const p = toW(R.cls, N2.x, N2.y); list.push({ y: p.y, d: () => { // v3.11 하비 (숨 고르기 · 깜빡임은 플레이어블 캐릭터와 같게)
      const n = Math.floor((time + 0.3) / 0.6) % 2, bt = (time + 3.3) % 8.6, blink = bt < 0.12 || (bt >= 4.3 && bt < 4.42), fk = (n ? 'idle' : 'base') + (blink ? 'B' : '');
      const c = npcArt('habi' + fk, () => { const rows = HABI.f[fk], [cv, g] = mk(rows[0].length * 2, rows.length * 2); rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.' || !HABI.p[ch]) return; g.fillStyle = HABI.p[ch]; g.fillRect(x * 2, y * 2, 2, 2); })); return cv; });
      const fr = HABI.f.base[HABI.f.base.length - 1]; let a0 = -1, a1 = -1; for (let i = 0; i < fr.length; i++) if (fr[i] !== '.') { if (a0 < 0) a0 = i; a1 = i; }
      const x = Math.round(p.x - (a0 + a1 + 1)) & ~1, y = (p.y - c.height + 2) & ~1;
      ctx.fillStyle = 'rgba(10,6,4,.5)'; ctx.fillRect((p.x - 10) & ~1, p.y, 20, 2);
      ctx.drawImage(c, x, y);
    } }); } }
    { const hp = habiPos(); if (hp && TK.on !== 'habi') { const P = G.player, near = P && !P.dead && Math.hypot(P.x - hp.x, P.y - hp.y) < 80, say = npcTalk('habi', near, HABI_LINES, HABI_GREET); if (say) list.push({ y: hp.y, d: () => drawBubble(say.line, hp.x, hp.y - 26, 0) }); } } // v3.16 하비 인사 · 혼잣말
    const S = SCENES[R.cls], N = S && S.npc; if (!N) return;
    const p = toW(R.cls, N.x, N.y), dp = toW(R.cls, N.dag[0], N.dag[1]);
    list.push({ y: dp.y, d: () => { const c = npcArt('dagger', () => gCanvas(gOutline(fromRows(DAGGER)), DAGGER_PAL)); ctx.fillStyle = 'rgba(10,6,4,.55)'; ctx.fillRect((dp.x - 2) & ~1, (dp.y) & ~1, 6, 2); ctx.drawImage(c, (dp.x - c.width / 2) & ~1, (dp.y - c.height + 4) & ~1); } });
    list.push({ y: p.y, d: () => {
      const n = Math.floor(time / 1.2), t = time % 1.2, crouch = t >= 0.6, tail = n % 3 === 0 && t < 0.3, bt = (time + 2.1) % 8.6, blink = bt < 0.12 || (bt >= 4.3 && bt < 4.42) || (bt >= 4.6 && bt < 4.72);
      const c = npcArt('dangun' + (+crouch) + (+blink) + (+tail), () => gCanvas(fromRows(dangunRows(crouch, blink, tail)), DANGUN_PAL));
      const x = (p.x - c.width / 2) & ~1, y = (p.y - c.height + 2) & ~1;
      ctx.fillStyle = 'rgba(10,6,4,.5)'; for (let i = 4; i < c.width - 4; i += 2) if ((i >> 1) & 1 || (i > 8 && i < c.width - 10)) ctx.fillRect(x + i, y + c.height - 2, 2, 2);
      ctx.drawImage(c, x, y);
      const P = G.player, near = P && !P.dead && Math.hypot(P.x - p.x, P.y - p.y) < 80, say = TK.on === 'dangun' ? null : npcTalk('dangun', near, DANGUN_LINES, DANGUN_GREET);
      if (say) drawBubble(say.line, p.x, y + 2, 0);
    } });
  }
  // ---- 흐름: 원정 시작(선 채로 · 대사 → 장소 이름) · 아래 문으로 걸어 나가면 출발 · 엔딩 귀환(잠든 채, 11b가 진행)
  const SEQ = { title: [0.3, 2.5], line: 2.6 }; // 장소 이름이 먼저, 이름이 걷힌 뒤 대사
  let again = false;
  function place(cls, sleep) { // 방을 만들고 들어가 잠든 자리(또는 선 채로)에 둔다
    const R = makeRoom(cls);
    G.dun = { rooms: [R], start: R, cur: null, eliteDone: 2, keys: 0, sock: [true, true], bossOpen: true, gate: null, stage: 1, home: true, bx0: 0, bx1: 0, by0: 0, by1: 0 };
    G.loot = []; G.drops = []; G.enemies = []; G.boss = null; G.tut = null; G.mood = null;
    enterRoom(R, null);
    const S = SCENES[cls], p = toW(cls, S.sleep[0], S.sleep[1]);
    Object.assign(G.player, { x: p.x, y: p.y, state: 'idle', t: 0, face: 1, idleT: sleep ? 40 : 0, moving: false, inv: 0, iframe: 0, hurtT: 0 }); // 방에 들어올 때 붙는 무적 깜빡임 없이
    G.flies = null; G.prompt = null;
    try { updateCamera(0, true); } catch (e) { /* 카메라 */ }
    try { window.AudioSys.setMood('title', true); } catch (e) { /* 소리 없음 */ }
    return R;
  }
  function enter() { // newRun 끝에서 — 원정을 시작할 때는 깨어 있는 채로 (잠든 연출은 엔딩에서 이어질 때만)
    const re = again; again = false;
    place(G.cls, false);
    G.home = { t: 0, ev: {}, re };
    mode = 'play';
  }
  const busy = () => false;
  function update(dt) {
    if (G.home) { const h = G.home, t = h.t += dt;
      if (!h.re && !h.ev.line && t >= SEQ.line) { h.ev.line = true; sayPlayer(INFO[G.cls].line, 2.4); }
      if (t > (h.re ? 2.7 : SEQ.line + 0.1)) G.home = null; }
    return false;
  }
  function drawTitle(txt, k, out, sub) { // 장소 이름: 진입 문구 제목과 같은 모양 (칸 단위 등장)
    if (k < 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); if (out) ctx.globalAlpha = 0.5;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = 'bold 24px Galmuri11';
    const R = G && G.dun && G.dun.cur, x = R ? Math.round((A.x0 + A.x1) / 2 - CAMX) : VW / 2, y = R ? Math.round((A.y0 + A.y1) / 2 - CAMY) + 8 : VH / 2 + 8; // 맵(방) 가운데
    ctx.fillStyle = '#000'; for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2]]) ctx.fillText(txt, x + dx, y + dy);
    ctx.fillStyle = '#5e0f16'; ctx.fillText(txt, x, y + 3); ctx.fillStyle = '#f2d78c'; ctx.fillText(txt, x, y);
    if (sub) { ctx.font = '12px Galmuri11'; ctx.fillStyle = '#000'; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]]) ctx.fillText(sub, x + dx, y + 22 + dy); ctx.fillStyle = '#c8b898'; ctx.fillText(sub, x, y + 22); } // v2.96 장소 설명 한 줄
    ctx.restore();
  }
  function screen() {
    const h = G && G.home; if (!h) return;
    const a = SEQ.title[0], b = SEQ.title[1]; // 다시 떠날 때는 대사 없이 이름만
    if (h.t >= a && h.t < b) drawTitle(SCENES[G.cls].name, h.t - a, b - h.t < 0.2, SCENES[G.cls].sub);
  }
  function habiPos() { const R = G && G.dun && G.dun.cur, N = R && R.type === 'home' && SCENES[R.cls] && SCENES[R.cls].npc2; return N ? toW(R.cls, N.x, N.y) : null; }
  function dangunPos() { const R = G && G.dun && G.dun.cur, N = R && R.type === 'home' && SCENES[R.cls] && SCENES[R.cls].npc; return N ? toW(R.cls, N.x, N.y) : null; }
  const npcPos = who => who === 'habi' ? habiPos() : who === 'dangun' ? dangunPos() : null;
  function spk(who) { const p = npcPos(who); if (!p) return null; return { x: p.x, y: who === 'dangun' ? p.y - DANGUN.length * 2 + 4 : p.y - 26 }; } // 말풍선 꼬리 끝 = 머리 위
  function talkNpc(who) { // v3.16 F 대화: 멈춰 서서 한 문장씩
    const LS = who === 'habi' ? HABI_TALKS : DANGUN_TALKS, L = LS[TK[who]++ % LS.length]; TK.on = who; if (NPC_TALK[who]) NPC_TALK[who].until = 0;
    TRUTH.talk(L.split(/(?<=[.!?])\s+/).filter(Boolean).map(l => [who, l]), () => { TK.on = null; if (NPC_TALK[who]) { NPC_TALK[who].next = time + rand(6, 9); NPC_TALK[who].near = true; } });
  }
  function interact() { // 아래 문 앞에서 F 원정 떠나기
    const R = G.dun && G.dun.cur, P = G.player; if (!R || R.type !== 'home' || !R.door || !P) return null;
    if (R.cls === 'ranger' && typeof BOUNTY !== 'undefined') { const b = toW('ranger', 170, 0); if (Math.abs(P.x - b.x) < 34 && P.y < A.y0 + 46) return { k: 'bounty', x: b.x, y: A.y0 + 4, t: 'F 의뢰서 보기' }; } // v3.16 찢긴 의뢰 게시판 → 단군의 난입자 의뢰서
    if (!TK.on) for (const who of ['habi', 'dangun']) { const q = npcPos(who); if (q && Math.hypot(P.x - q.x, P.y - q.y) < 40) return { k: 'homeTalk', who, x: q.x, y: q.y + 16, t: 'F 대화하기' }; } // v3.16 하비 · 단군
    if (Math.abs(P.x - R.door.x) > 26 || P.y < R.door.y - 40) return null;
    return { k: 'homeExit', o: R.door, x: R.door.x, y: R.door.y - 46, t: 'F 원정 떠나기' };
  }
  function leave() { // 아래 문 → 월드맵(시작 장소에서 황혼 초원으로) → 1장
    sfx('select');
    G.home = null; G.wmHome = G.cls; G.stage = 1; G.dun = null;
    newDungeon();
  }
  // 월드맵: 시작 장소 → 원정 길 첫 칸까지 이어지는 짧은 길
  function wmPath(cls) {
    const I = INFO[cls]; if (!I) return null;
    const [x0, y0] = I.wm, [x1, y1] = WM_PATH[0], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), out = [];
    for (let i = 0; i < n; i++) out.push([Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n)]);
    return out;
  }
  const name = cls => SCENES[cls] ? SCENES[cls].name : '';
  const line = cls => INFO[cls] ? INFO[cls].line : '…';
  return {
    enter, place, update, busy, screen, drawTitle, interact, leave, talkNpc, spk, paint, lights, ents, wmPath, name, line,
    set again(v) { again = !!v; }, get again() { return again; },
  };
  })();
