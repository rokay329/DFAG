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
  function brickChunk(P, x, y, w, h, seed, soot = 0, ol = K) { // ol: 외곽선 색
    const r = n => h2(seed, n, 401);
    const chipL = r(1) < 0.35, chipR = r(2) < 0.45;
    const at = (i, j) => !((chipL && i === 0 && j === 0) || (chipR && i === w - 1 && j <= (r(3) < 0.5 ? 1 : 0)) || (chipR && i === w - 2 && j === 0 && r(4) < 0.4));
    for (let j = -1; j <= h + 2; j++) for (let i = -1; i <= w; i++) if (!at(i, j) || i < 0 || i >= w || j < 0 || j >= h + 2) { if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const a = i + dx, b = j + dy; return a >= 0 && a < w && b >= 0 && b < h + 2 && at(a, b); })) P.put(x + i, y + j, ol); }
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
  // ================================================================ v3.18 불탄 변경 성채 도트 개선 (시안 _시안/시작장소_도트개선_1단계_불탄변경성채_시안01.html)
  // 바닥 판석: 크고 작은 돌이 섞이고(두 칸짜리 큰 돌 · 반쪽 돌), 돌마다 위·왼쪽 밝게 / 아래·오른쪽 어둡게, 금 간 돌 · 빠진 돌(흙 · 재)
  function flagstones2(P, x0, y0, x1, y1, seed, holes) {
    const pal = { a: '#57525e', b: '#4f4a57', c: '#48434f', hi: '#67626e', hi2: '#5e5966', lo: '#3c3844', gap: '#26222c' };
    const RH = 8, stones = [];
    for (let row = 0, y = y0; y < y1; row++, y += RH) {
      let x = x0 - Math.floor(h2(row, 0, seed) * 10), k = 0;
      while (x < x1) { const r = h2(row, k, seed + 1), w = r < 0.18 ? 6 + Math.floor(h2(row, k, seed + 2) * 3) : r < 0.82 ? 11 + Math.floor(h2(row, k, seed + 3) * 6) : 19 + Math.floor(h2(row, k, seed + 4) * 6);
        stones.push({ x, y, w, h: RH, id: row * 131 + k }); x += w; k++; }
    }
    // 두 줄을 차지하는 큰 판석 몇 장 (아랫줄 돌을 덮어씀)
    for (const s of stones) {
      const v = h2(s.id, 1, seed), base = v < 0.33 ? pal.a : v < 0.7 ? pal.b : pal.c, miss = holes.some(([hx, hy, hr]) => Math.hypot(s.x + s.w / 2 - hx, (s.y + s.h / 2 - hy) * 1.6) < hr && h2(s.id, 2, seed) < 0.45);
      const crack = h2(s.id, 3, seed) < 0.16 && s.w > 9;
      for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) { const X = s.x + i, Y = s.y + j; if (X < x0 || X >= x1 || Y >= y1) continue;
        let c;
        if (miss) { c = (i === 0 || j === 0) ? pal.gap : h2(X, Y, seed + 7) < 0.18 ? '#4a3e34' : h2(X, Y, seed + 8) < 0.3 ? '#2a221e' : '#332a24'; if (h2(X, Y, seed + 9) < 0.06) c = '#8a8480'; P.put(X, Y, c); continue; } // 빠진 돌 자리: 흙 · 재 · 자갈
        if (i === 0 || j === s.h - 1) c = pal.gap;
        else if (j === 0) c = i === 1 ? pal.hi : (i < s.w * 0.6 ? pal.hi : pal.hi2);
        else if (i === 1) c = pal.hi2;
        else if (i === s.w - 1 || j === s.h - 2) c = pal.lo;
        else { c = base; if (h2(X, Y, seed + 5) < 0.04) c = pal.hi2; else if (h2(X, Y, seed + 6) < 0.05) c = pal.lo; }
        if ((i === 1 || i === s.w - 1) && (j === 0 || j === s.h - 2) && h2(s.id, 4, seed) < 0.6) c = pal.gap; // 닳아 둥근 모서리
        P.put(X, Y, c); }
      if (crack && !miss) { let cx = s.x + 3 + Math.floor(h2(s.id, 5, seed) * (s.w - 6)); for (let j = 1; j < s.h - 2; j++) { P.put(cx, s.y + j, pal.gap); if (h2(s.id, j, seed + 6) < 0.5) cx += h2(s.id, j, seed + 7) < 0.5 ? 1 : -1; } }
    }
  }
  // 그을음: 가운데 짙고 가장자리는 디더로 옅어짐 + 숯 알갱이 · 불씨
  function scorch(P, cx, cy, rx, ry, seed) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1) continue;
      const n = h2(x, y, seed); if (d < 0.35 ? n < 0.75 : d < 0.7 ? ((x + y) & 1) && n < 0.8 : ((x + y) & 1) && n < 0.35) P.put(x, y, d < 0.35 ? '#1e1a22' : '#26222a');
      if (d < 0.6 && n > 0.985) P.put(x, y, '#ff7a28'); else if (d < 0.8 && n > 0.965) P.put(x, y, '#141018'); }
  }
  // 재가 쌓인 자리 (밝은 회색 디더)
  function ashBed(P, cx, cy, rx, ry, seed) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d > 1) continue;
      const n = h2(x, y, seed); if (d < 0.5 ? n < 0.7 : ((x + y) & 1) && n < 0.45) P.put(x, y, n < 0.25 ? '#a8a29c' : n < 0.5 ? '#8a8480' : '#6e6a6e'); }
  }
  // 아직 붙어 있는 벽 조각: 벽돌 2~3단, 위쪽은 들쭉날쭉 부러짐
  function wallChunk(P, x, y, w, h, seed) {
    const top = i => Math.floor(h2(i >> 1, 0, seed) * 4) + (i === 0 || i === w - 1 ? 2 : 0);
    for (let i = -1; i <= w; i++) for (let j = -1; j <= h; j++) { const ii = Math.max(0, Math.min(w - 1, i)); if (j < top(ii) - 1) continue; if (i < 0 || i >= w || j >= h || j === top(ii) - 1) P.put(x + i, y + j, '#26222c'); } // v3.18 외곽선은 바닥 줄눈 색
    for (let i = 0; i < w; i++) for (let j = top(i); j < h; j++) {
      const row = Math.floor(j / 4), ly = j % 4, off = row % 2 ? 3 : 0, lx = (i + off) % 7, v = h2(Math.floor((i + off) / 7), row, seed);
      let c = v < 0.4 ? '#625d6a' : v < 0.8 ? '#5a5562' : '#6a6572';
      if (ly === 3 || lx === 6) c = '#2e2a34'; else if (ly === 0) c = '#77717e';
      if (j === top(i)) c = '#9a94a0'; // 부러진 윗면 (밝은 단면)
      if (i === w - 1 || j === h - 1) c = '#3a3542';
      if (j > h - 4 && ((i + j) & 1) && h2(i, j, seed + 1) < 0.6) c = '#2e2a34'; // 아래쪽 그을음
      P.put(x + i, y + j, c); }
  }
  // 그을린 들보 (비스듬히 박힘): 3칸 굵기, 끝은 숯 + 불씨
  function beam(P, x0, y0, x1, y1, seed) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let s = 0; s <= n; s++) { const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n); for (let t = -2; t <= 2; t++) P.put(x, y + t, K); }
    for (let s = 1; s < n; s++) { const x = Math.round(x0 + (x1 - x0) * s / n), y = Math.round(y0 + (y1 - y0) * s / n), burnt = s > n * 0.62;
      P.put(x, y - 1, burnt ? '#3a2e28' : '#8a6a4a'); P.put(x, y, burnt ? (h2(s, 0, seed) < 0.2 ? '#d03018' : '#241a14') : '#6e5038'); P.put(x, y + 1, burnt ? '#150e0a' : '#4a3424'); }
    P.put(x1, y1, '#ff7a28'); P.put(x1 - Math.sign(x1 - x0), y1, '#d03018');
  }
  // 무너진 벽돌 더미: 먼지 바닥 → 뒤쪽 벽 조각 → 들보 → 크고 작은 벽돌 (뒤에서 앞으로) → 바깥으로 갈수록 성기게 흩어진 잔돌
  function rubble(P, cx, cy, rw, seed, o = {}) {
    blot(P, cx, cy + 6, rw + 8, 9, '#221e26', seed, 1); blot(P, cx, cy + 6, rw + 2, 6, '#2a2630', seed + 1, 1);
    if (o.wall) wallChunk(P, cx + o.wall[0], cy + o.wall[1], o.wall[2], o.wall[3], seed + 2);
    if (o.beam) beam(P, cx + o.beam[0], cy + o.beam[1], cx + o.beam[2], cy + o.beam[3], seed + 3);
    const bits = [], rows = o.rows || [5, 4, 3, 2];
    rows.forEach((n, ri) => { const span = rw * (1 - ri * 0.2); for (let k = 0; k < n; k++) { const t = n === 1 ? 0.5 : k / (n - 1);
      bits.push({ x: Math.round(cx - span + t * span * 2 - 4 + (h2(k, ri, seed + 4) - 0.5) * 6), y: Math.round(cy + 3 - ri * 4 + (h2(k, ri, seed + 5) - 0.5) * 3), w: 6 + Math.floor(h2(k, ri, seed + 6) * 7), h: 3 + Math.floor(h2(k, ri, seed + 7) * 2), d: ri }); } });
    bits.sort((a, b) => b.d - a.d || a.y - b.y).forEach((b, i) => brickChunk(P, b.x, b.y, b.w, b.h, seed * 17 + i, h2(i, 4, seed) < 0.4 ? 0.5 : 0.1, '#26222c')); // v3.18 외곽선은 바닥 줄눈 색
    for (let i = 0; i < 26; i++) { const a = h2(i, 5, seed) * Math.PI * 2, r = rw * (0.7 + Math.pow(h2(i, 6, seed), 2) * 1.4), x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + 4 + Math.sin(a) * r * 0.42);
      if (y < RY0 + 2 || y > RY1 - 3 || x < RX0 + 2 || x > RX1 - 3) continue;
      const big = h2(i, 7, seed) < 0.3; P.put(x, y, big ? '#77717e' : '#625d6a'); if (big) { P.put(x + 1, y, '#5a5562'); P.put(x, y + 1, '#3a3542'); P.put(x + 1, y + 1, '#2e2a34'); } else P.put(x, y + 1, '#2e2a34'); }
  }

  SCENES.knight = {
    name: '불탄 변경 성채', who: '알드릭', amb: 0.42, line: '…맹세를 지켜야 해.',
    sleep: [170, 138], exit: [192, 166], exitDir: 's',
    draw(P) {
      roomShell(P, 20, { t: '#5e5866', m: '#4a4554', d: '#2e2a36' });
      const top = RY0 - 20;
      for (let y = RY1 + 7; y < GH; y++) for (let x = 0; x < GW; x++) { const v = h2(x, y, 9); P.put(x, y, v < 0.5 ? '#141a14' : v < 0.85 ? '#18201a' : '#1e281c'); }
      for (let y = RY1; y < GH; y++) { const w = 12 + (y - RY1) * 0.6; for (let x = Math.floor(CX - w); x < CX + w; x++) if (h2(x, y, 4) < 0.9 - Math.abs(x - CX) / w * 0.7) P.put(x, y, h2(x, y, 5) < 0.5 ? '#3a3026' : '#2e261e'); }
      // 바닥: 크고 작은 판석 + 무너진 더미 · 통나무 둘레엔 빠진 돌
      flagstones2(P, RX0, RY0, RX1, RY1, 3, [[108, 66, 30], [262, 60, 24], [246, 108, 18]]);
      scorch(P, 246, 110, 52, 18, 3); scorch(P, 118, 118, 26, 10, 4); scorch(P, 226, 156, 20, 7, 5);
      ashBed(P, 170, 135, 18, 6, 6);
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
      // 무너진 더미 2곳 (자리는 그대로: 충돌 원 [108,60,16] · [262,56,14])
      rubble(P, 108, 60, 24, 11, { wall: [-22, -18, 22, 14], beam: [6, -16, 24, 0], rows: [6, 5, 4, 2] });
      rubble(P, 262, 54, 20, 23, { wall: [0, -14, 18, 12], rows: [5, 4, 2] });
      // 불탄 통나무 + 아래 재 · 숯 조각
      ashBed(P, 250, 108, 40, 5, 7); ashBed(P, 118, 119, 16, 4, 8);
      burntLog(P, 204, 88, 84, 18, 51);
      burntLog(P, 100, 106, 34, 11, 52);
      for (const [x, y] of [[292, 104], [296, 101], [200, 108], [138, 116]]) { P.put(x, y, K); P.put(x + 1, y, '#241a14'); P.put(x, y - 1, '#3a2e28'); P.put(x + 2, y, K); }
      // 무기 거치대 (오른쪽 아래) v3.18: 둥근 머리 기둥 2 + 칼집 홈 가로대 + 받침, 쇠 꺾쇠. 검 2자루는 칼끝을 아래로 꽂고 손잡이가 위로, 셋째 칸은 위가 타서 부러진 창
      const wx = 252, wy = 124, RW = { k: K, H: '#a8845e', W: '#8a6a4a', w: '#6e5038', m: '#55402c', d: '#3a2a1e' }, CH = { H: '#4a3c34', W: '#3a2e28', w: '#2c221c', m: '#20170f', d: '#150e0a' };
      blot(P, wx + 15, wy + 25, 22, 4, '#1e1a22', 61, 1);
      const shadeH = (x, y, w, h, pal) => { P.rect(x - 1, y - 1, w + 2, h + 2, K); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P.put(x + i, y + j, j === 0 ? pal.H : i === 0 ? pal.W : i === w - 1 || j === h - 1 ? pal.d : (j + i * 3) % 7 === 0 ? pal.m : pal.w); };
      const bracket = (x, y) => { P.rect(x, y, 3, 3, '#4a4856'); P.put(x, y, '#9a98a6'); P.put(x + 1, y + 1, '#2a2830'); };
      // 칼날 (가로대 · 받침 사이로 보임) — 검: 손잡이 위 · 칼끝 아래
      const sword = (x, gy, len, gold) => { // gy = 코등이 줄
        for (let j = 1; j <= len; j++) { const y = gy + j, tip = j === len; P.put(x - 2, y, K); P.put(x + 2, y, K); P.put(x - 1, y, tip ? K : '#ffffff'); P.put(x, y, tip ? '#c8ccd4' : (j % 4 === 2 ? '#e8eef8' : '#c8ccd4')); P.put(x + 1, y, tip ? K : '#6a6e7a'); }
        P.put(x, gy + len + 1, K);
        P.rect(x - 4, gy - 1, 9, 3, K); for (let i = -3; i <= 3; i++) P.put(x + i, gy, gold ? (i === -3 ? '#fff0a0' : i === 3 ? '#9a7028' : '#e0b040') : (i === -3 ? '#e8eef8' : i === 3 ? '#4a4856' : '#9a98a6'));
        for (let j = 1; j <= 5; j++) { P.put(x - 2, gy - j, K); P.put(x + 2, gy - j, K); P.put(x - 1, gy - j, '#7a4a2a'); P.put(x, gy - j, (j & 1) ? '#5a3a22' : '#3a2416'); P.put(x + 1, gy - j, '#2a1810'); }
        P.rect(x - 2, gy - 9, 5, 4, K); P.rect(x - 1, gy - 8, 3, 2, gold ? '#e0b040' : '#9a98a6'); P.put(x - 1, gy - 8, gold ? '#fff0a0' : '#e8eef8'); P.put(x + 1, gy - 7, gold ? '#9a7028' : '#4a4856'); };
      sword(wx + 8, wy - 2, 21, true); sword(wx + 15, wy + 1, 18, false);
      // 셋째 칸: 위가 타서 부러진 창대 (불씨)
      for (let j = 0; j < 27; j++) { const y = wy - 4 + j, burnt = j < 7; P.put(wx + 21, y, K); P.put(wx + 24, y, K); P.put(wx + 22, y, burnt ? (j < 2 ? '#d03018' : '#3a2e28') : '#8a6a4a'); P.put(wx + 23, y, burnt ? '#150e0a' : '#55402c'); }
      P.put(wx + 22, wy - 5, K); P.put(wx + 23, wy - 5, K); P.put(wx + 22, wy - 4, '#ff7a28'); P.put(wx + 23, wy - 6, '#d03018');
      // 기둥 2 (오른쪽은 위쪽이 숯) · 둥근 머리
      for (const [x, ch] of [[wx, false], [wx + 27, true]]) { shadeH(x, wy - 4, 4, 30, RW); if (ch) shadeH(x, wy - 4, 4, 12, CH);
        P.rect(x, wy - 7, 4, 3, K); P.rect(x + 1, wy - 6, 2, 2, ch ? CH.W : RW.H); P.put(x - 1, wy - 5, K); P.put(x + 4, wy - 5, K); }
      // 위 가로대: 칼집 홈 3개
      shadeH(wx + 4, wy + 3, 23, 4, RW); for (let i = 15; i < 23; i++) for (let j = 0; j < 4; j++) if (((i + j) & 1) || i > 18) P.put(wx + 4 + i, wy + 3 + j, j === 0 ? CH.H : CH.w); // 오른쪽 끝은 그을림
      for (const x of [wx + 8, wx + 15, wx + 22]) { P.rect(x - 1, wy + 3, 3, 2, K); }
      // 아래 가로대 (칼끝이 걸리는 구멍)
      shadeH(wx + 4, wy + 15, 23, 3, RW); for (const x of [wx + 8, wx + 15, wx + 22]) P.put(x, wy + 15, K);
      // 받침 + 다리
      shadeH(wx - 3, wy + 22, 37, 4, RW); P.rect(wx - 3, wy + 26, 4, 2, K); P.rect(wx + 30, wy + 26, 4, 2, K); P.rect(wx - 2, wy + 26, 2, 1, RW.d); P.rect(wx + 31, wy + 26, 2, 1, RW.d);
      // 쇠 꺾쇠
      for (const [x, y] of [[wx + 1, wy + 3], [wx + 27, wy + 3], [wx + 1, wy + 15], [wx + 27, wy + 15]]) bracket(x, y);
      // 바닥에 떨어진 창날 + 숯 조각 · 불씨
      P.spr(['..k...', '.kSk..', 'kSsSk.', 'kSsSk.', '.kSkk.', '..kddk', '...kk.'], { k: K, S: '#c8ccd4', s: '#8a8e9a', d: '#55402c' }, wx + 35, wy + 18, false);
      for (const [x, y] of [[wx + 30, wy - 1], [wx + 34, wy + 6]]) { P.put(x, y, '#ff7a28'); P.put(x + 1, y + 1, '#d03018'); }
      // 바닥 불씨 몇 점 (모여 있게)
      for (const [x, y] of [[196, 132], [199, 134], [160, 142], [184, 140], [120, 128], [123, 129]]) { P.put(x, y, '#ff7a28'); P.put(x + 1, y, '#d03018'); }
      // 부서진 성문: 돌기둥만 남음
      P.rect(CX - 16, RY1 - 1, 32, 8, '#2e261e'); for (let x = CX - 16; x < CX + 16; x++) for (let y = RY1; y < RY1 + 7; y++) if (h2(x, y, 31) < 0.5) P.put(x, y, '#3a3026');
      for (const px of [CX - 24, CX + 17]) { P.rect(px - 1, RY1 - 15, 9, 22, K);
        for (let j = 0; j < 20; j++) for (let i = 0; i < 7; i++) { const row = Math.floor(j / 4), ly = j % 4, lx = (i + (row % 2 ? 3 : 0)) % 7; let c = '#5e5866'; if (ly === 3 || lx === 6) c = '#2e2a36'; else if (ly === 0) c = '#77717e'; if (i === 6) c = '#3a3542'; if (j < 2) c = j === 0 ? '#9a94a0' : '#7e7884'; P.put(px + i, RY1 - 14 + j, c); } }
      // v3.18 문짝 · 문 앞에 누운 문짝 없음
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
    SCENES.mage.line = '…별자리 하나가 끝내 이어지지 않네요.';
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
    name: '이름 없는 묘지', who: '그레이브', amb: 0.44, line: '…한 발 남았군.', tileOut: true,
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
    const archStone = (x, y, s, chip, crest) => { // v3.83 crest: 십자 대신 왕가 문양(세 봉우리 왕관)을 새긴 비석 하나
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
      const cross = crest ? ['#..#..#', '##.#.##', '#######', '#.#.#.#', '#######'] : ['.##.', '####', '.##.', '.##.', '.##.'], ex = crest ? x + 1 : cx0, ey = crest ? y + 3 : cy0;
      cross.forEach((r0, j) => [...r0].forEach((ch, i) => { if (ch === '#') { P.put(ex + i, ey + j, '#45404c'); if (cross[j + 1]?.[i] !== '#') P.put(ex + i, ey + j + 1, '#b0aab8'); if (r0[i + 1] !== '#') P.put(ex + i + 1, ey + j, '#a49eac'); } }));
      for (const [j, l] of [[9, 7], [11, 5]]) for (let i = 0; i < l; i++) if (h2(i, j, s) < 0.7) P.put(x + 2 + i, y + j, '#5e5a68');
      if (!crest) { P.line(x + 8, y + 4, x + 7, y + 7, '#45404c'); P.line(x + 7, y + 7, x + 8, y + 9, '#45404c'); }
      for (let j = h - 5; j < h; j++) for (let i = 0; i < fw + sw; i++) if (inAny(i, j) && h2(i, j, s + 1) < (j - h + 6) * 0.11) P.put(x + i, y + j, MOSS[(i + j) % 3]);
      for (let i = 2; i < 7; i++) if (h2(i, 0, s + 2) < 0.5) P.put(x + i, y + 1 + (i % 2), MOSS[i % 2]);
      for (let i = -1; i < fw + sw + 1; i++) if ((x + i + y + h) & 1) P.put(x + i, y + h, '#18201a'); // 발치 그림자 (v3.20 디더)
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
      if (t === 'arch') archStone(gx - 6, base - 16, gx * 7 + gy, v === 1, gx === 112 && gy === 110); // 왼쪽 위 비석에 왕가 문양
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
    for (let i = -4; i < TW + 8; i++) for (let j = 0; j < 4; j++) if ((i + j) & 1 && (j < 2 || (i + j * 3) % 4 === 1)) P.put(tx0 + i, ty0 + roofH + wallH + 1 + j, '#121810'); // v3.20 디더
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
      shadow(S, x0, x1, y, c1, c2) { for (let x = x0; x < x1; x++) { if ((x + y) & 1) T.on(S, x, y, c1); if (((x + y + 1) & 1) && x > x0 + 1 && x < x1 - 2 && ((x >> 1) & 1)) T.on(S, x, y + 1, c2 || c1); } }, // v3.20 디더
      shOval(S, cx, cy, rx, ry, c, seed, dens = 1) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (q > 1 || !((x + y) & 1)) continue; if (q < 0.4 * dens || h2(x, y, seed) < (1.2 - q) * dens) T.on(S, x, y, c); } }, // v3.20 디더 그림자 타원
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
  // ---------------------------------------------------------------- v3.18 불탄 변경 성채 재점검 (시안 _시안/시작장소_도트개선_1단계재점검_불탄변경성채_시안04.html)
  let KNIGHT_BG = null, KNIGHT_FG = null; // 움직임에서 쓰는 깃발 뒤 색 · 캐릭터를 가리는 성문 기둥 칸 (그릴 때 기록)
  {
    const base = SCENES.knight.draw;
    SCENES.knight.draw = function (P) {
    base(P);
    const top = RY0 - 20;
    const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], bay = (x, y) => (B4[y & 3][x & 3] + 0.5) / 16;
    const hx = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'), toHex = (r, g, b) => '#' + hx(r) + hx(g) + hx(b);
    const rgbOf = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const put = (x, y, c) => P.put(x, y, c);
    const OL = '#26222c'; // 돌 소품 외곽선 (바닥 줄눈 색)
    function blit(M, ol = K) { const key = (x, y) => x + ',' + y; for (const k of M.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!M.has(key(x + dx, y + dy))) put(x + dx, y + dy, ol); } for (const [k, c] of M) { const [x, y] = k.split(',').map(Number); put(x, y, c); } }
    const segDist = (x, y, pts, sy = 1.5) => { let best = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy))); best = Math.min(best, Math.hypot(x - ax - vx * t, (y - ay - vy * t) * sy)); } return best; };
  
    // ================================================================ 1. 바닥: 크고 고르지 않은 판석 (벽돌과 다른 따뜻한 회갈색) · 금 · 이 빠진 모서리 · 빠진 돌 자리 · 그을음 · 닳은 길
    const FS = { a: '#4e4642', b: '#48403c', c: '#544c46', hi: '#625a54', hi2: '#5a524c', sh: '#3e3632', gap: '#221c1a', sp: '#665e58', dk: '#3a322e' };
    const LOGS = [[204, 88, 84, 18], [100, 106, 34, 11]]; // 불탄 들보 (x, y, 길이, 두께)
    const FL = new Array(GW * GH), fget = (x, y) => FL[y * GW + x], fset = (x, y, c) => { if (x >= RX0 && x < RX1 && y >= RY0 && y < RY1) FL[y * GW + x] = c; };
    // 판석: 어긋난 격자 위 흔들린 점마다 가장 가까운 점의 돌 (모난 다각형) — 윗변 · 왼변 밝고 아랫변 · 오른변 어둠
    { const CWd = 19, CHt = 11, pts = [];
      for (let gy = -1; gy <= Math.ceil((RY1 - RY0) / CHt) + 1; gy++) for (let gx = -1; gx <= Math.ceil((RX1 - RX0) / CWd) + 1; gx++) { const ox = (gy & 1) ? CWd / 2 : 0; pts.push([RX0 + gx * CWd + ox + (h2(gx, gy, 805) - 0.5) * CWd * 0.7, RY0 + gy * CHt + (h2(gx, gy, 806) - 0.5) * CHt * 0.6, gx * 131 + gy]); }
      const ID = new Int32Array(GW * GH).fill(-1);
      for (let y = RY0 - 1; y <= RY1; y++) for (let x = RX0 - 1; x <= RX1; x++) { let best = 1e9, bi = -1; for (let i = 0; i < pts.length; i++) { const dx = x - pts[i][0], dy = (y - pts[i][1]) * 1.7; if (Math.abs(dx) > 30 || Math.abs(dy) > 34) continue; const d = dx * dx + dy * dy; if (d < best) { best = d; bi = i; } } if (x >= 0 && y >= 0) ID[y * GW + x] = bi; }
      const id = (x, y) => ID[y * GW + x];
      for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) { const me = id(x, y), sid = pts[me][2], v = h2(sid, 3, 803); let c = v < 0.34 ? FS.a : v < 0.7 ? FS.b : FS.c;
        const R = id(x + 1, y) !== me, Dn = id(x, y + 1) !== me, U = id(x, y - 1) !== me, Lf = id(x - 1, y) !== me;
        if (R || Dn) c = FS.gap; else if (U) c = FS.hi; else if (Lf) c = FS.hi2; else if (id(x + 2, y) !== me || id(x, y + 2) !== me) c = FS.sh;
        else { const n = h2(x, y, 804); if (n < 0.05) c = FS.sp; else if (n > 0.95) c = FS.dk; }
        // 금 (몇몇 돌에 가는 선)
        if (h2(sid, 4, 803) < 0.25 && c !== FS.gap) { const [px, py] = pts[me], ang = h2(sid, 5, 803) * 3, dd = Math.abs((x - px) * Math.sin(ang) - (y - py) * 1.7 * Math.cos(ang)); if (dd < 0.6 && Math.hypot(x - px, (y - py) * 1.7) < 9) c = FS.gap; }
        FL[y * GW + x] = c; } }
    // 닳은 길: 잠자리 → 성문 (돌이 한 톤 밝고 매끈)
    { const WM = { [FS.a]: '#58504a', [FS.b]: '#524a44', [FS.c]: '#5e564e', [FS.sp]: '#6a625a', [FS.dk]: '#4a423c', [FS.sh]: '#4a423c' }, pts = [[170, 140], [184, 158], [CX, RY1]];
      for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) { const c = fget(x, y); if (!WM[c]) continue; const d = segDist(x, y, pts); if (d < 6 || (d < 10 && bay(x, y) < (10 - d) / 5)) fset(x, y, WM[c]); } }
    // 빠진 돌 자리 (들보가 떨어지며 깨짐 · 무너진 더미 둘레): 흙 + 깨진 조각
    const pit = (cx, cy, rx, ry, seed) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (h2(x, y, seed) - 0.5) * 0.35; if (q > 1) continue;
        fset(x, y, q > 0.8 ? FS.gap : h2(x, y, seed + 1) < 0.15 ? '#3a322c' : h2(x, y, seed + 2) < 0.5 ? '#2a2420' : '#241e1a'); }
      for (let k = 0; k < 5; k++) { const x = Math.round(cx + (h2(k, 1, seed) - 0.5) * rx * 1.4), y = Math.round(cy + (h2(k, 2, seed) - 0.5) * ry * 1.2); fset(x, y, FS.hi); fset(x + 1, y, FS.sh); fset(x, y + 1, FS.gap); } };
    pit(214, 108, 9, 3.5, 811); pit(276, 109, 7, 3, 812); pit(130, 118, 5, 2.4, 813); pit(150, 66, 6, 2.6, 814); pit(240, 66, 5, 2.4, 815);
    // 들보가 떨어진 충격: 판석에 사방으로 갈라진 금
    for (const [ox, oy, n, len, seed] of [[246, 107, 7, 16, 821], [118, 118, 5, 9, 822]]) for (let i = 0; i < n; i++) { const a = Math.PI * (0.05 + 0.9 * i / (n - 1)) + (h2(i, 1, seed) - 0.5) * 0.3, L = len * (0.6 + h2(i, 2, seed) * 0.5);
      let x = ox, y = oy; for (let s = 0; s < L; s++) { x += Math.cos(a) + (h2(i, s, seed) - 0.5) * 0.8; y += Math.sin(a) * 0.45; const X = Math.round(x), Y = Math.round(y); if (fget(X, Y) && fget(X, Y) !== FS.gap) { fset(X, Y, FS.gap); fset(X + 1, Y + 1, FS.hi2); } } }
    // 그을음: 들보 둘레 판석이 검게 (가장자리 디더)
    const soot = (cx, cy, rx, ry, seed) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (h2(x >> 1, y >> 1, seed) - 0.5) * 0.3; if (q > 1) continue; const c = fget(x, y); if (!c) continue;
        if (q < 0.35 || bay(x, y) < (1 - q) * 1.4) { const [r, g, b] = rgbOf(c), k = q < 0.35 ? 0.55 : 0.72; fset(x, y, toHex(r * k, g * k * 0.95, b * k * 0.92)); } } };
    soot(246, 104, 56, 15, 831); soot(118, 116, 26, 8, 832); soot(110, 66, 30, 9, 833); soot(262, 62, 30, 8, 834);
    // 벽 밑 그늘 + 양옆 벽 그늘
    for (let y = RY0; y < RY0 + 4; y++) for (let x = RX0; x < RX1; x++) if (y < RY0 + 2 || (y === RY0 + 2 && (x & 1)) || (y === RY0 + 3 && x % 4 === 1)) fset(x, y, '#18141a');
    for (let y = RY0; y < RY1; y++) for (const [x0, dir] of [[RX0, 1], [RX1 - 1, -1]]) for (let k = 0; k < 3; k++) if (k === 0 || bay(x0 + dir * k, y) < 0.5 - k * 0.15) fset(x0 + dir * k, y, '#18141a');
    // 접지 그림자
    const shadowOval = (ox, oy, rx, ry, seed, c) => { const sh = !c; c = c || '#141016'; for (let y = Math.floor(oy - ry); y <= oy + ry; y++) for (let x = Math.floor(ox - rx); x <= ox + rx; x++) { const q = ((x - ox) / rx) ** 2 + ((y - oy) / ry) ** 2; if (q > 1 || (sh && !((x + y) & 1))) continue; if (q < 0.45 || bay(x, y) < (1 - q) * 1.6) fset(x, y, c); } }; // v3.20 그림자는 디더 (색을 준 핏자국은 그대로)
    for (const [x, y, len, th] of LOGS) { for (let i = -1; i < len + 3; i++) { if ((i + y) & 1) fset(x + i + 1, y + th + 1, '#100c10'); if ((i + y) & 1) fset(x + i + 2, y + th + 2, '#100c10'); if (((i + y) & 3) === 1) fset(x + i + 3, y + th + 3, '#141016'); } } // v3.20 디더
    shadowOval(110, 72, 26, 5, 841); shadowOval(264, 70, 22, 5, 842); shadowOval(270, 149, 13, 1.6, 843);
    // 빛 (디더 글로우) — 바닥: 무너진 틈으로 떨어진 달빛 자리 · 들보 잉걸불 후광 (소품은 건드리지 않음)
    const glowF = (x, y, lv, tint) => { const c = fget(x, y); if (!c || lv < bay(x, y) * 0.9) return; const k = lv > 0.72 ? 0.5 : lv > 0.45 ? 0.34 : 0.2, [r, g, b] = rgbOf(c); fset(x, y, toHex(r + (tint[0] - r) * k + 14 * k, g + (tint[1] - g) * k + 14 * k, b + (tint[2] - b) * k + 14 * k)); };
    const MOON = rgbOf('#a8b8e8'), EMB = rgbOf('#ff8a40');
    const MOONS = [[94, 128, RY0 + 30, RY0 + 58, 30], [236, 284, RY0 + 30, RY0 + 45, 16]];
    for (const [hx0, hx1, py0, py1, sk] of MOONS) for (let y = RY0; y < py1; y++) { const t = (y - top) / (py1 - top), xl = hx0 + t * sk, xr = hx1 + t * sk * 0.8;
      for (let x = Math.floor(xl - 2); x <= xr + 2; x++) { const e = Math.min(x - xl, xr - x); if (e < -1.5) continue; let lv = y < py0 ? 0.2 : (0.78 - (y - py0) / (py1 - py0) * 0.3) * Math.min(1, (y - py0 + 1) / 3, (py1 - y) / 6); if (e < 2.5) lv *= Math.max(0.15, (e + 1.5) / 4); glowF(x, y, lv, MOON); } }
    for (const [ox, oy, rx, ry, a] of [[246, 104, 66, 24, 0.85], [117, 116, 32, 13, 0.7]]) for (let y = Math.floor(oy - ry); y <= oy + ry; y++) for (let x = Math.floor(ox - rx); x <= ox + rx; x++) { const d = Math.hypot((x - ox) / rx, (y - oy) / ry); if (d < 1) glowF(x, y, (1 - d) * a, EMB); }
    // 바닥 칠하기
    for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) put(x, y, fget(x, y));
  
    // ================================================================ 2. 뒷벽: 굽도리 (큰 받침돌 한 줄) · 벽 아래 그을음 · 깃발
    // 벽 색 다시 계산 (깃발 뒤 · 움직임용)
    const BW = 12, BH = 6, gaps = [[88, 132, 3], [226, 290, 2]];
    const lost = (x, y) => { for (const [a, b, n] of gaps) { if (x < a || x >= b) continue; const row = Math.floor((y - top) / BH), off = row % 2 ? BW / 2 : 0, col = Math.floor((x - a + off) / BW), mid = (b - a) / BW / 2; const depth = Math.round(n - Math.abs(col - mid) * (n / mid) + h2(col, row, 7) * 1.2); if (row < depth) return true; } return false; };
    const wallAt = (x, y) => { const row = Math.floor((y - top) / BH), ly = (y - top) % BH, off = row % 2 ? BW / 2 : 0, lx = (x - RX0 + off) % BW, id = row * 97 + Math.floor((x - RX0 + off) / BW), v = h2(id, 5, 2);
      let c = v < 0.3 ? '#46424e' : v < 0.75 ? '#3e3a46' : '#4c4854'; if (ly === BH - 1 || lx === BW - 1) c = '#1e1c24'; else if (ly === 0) c = '#56525e'; else if (lx === 0) c = '#4e4a56';
      const s = h2(x >> 2, 0, 11); if (s < 0.4 && y < top + 4 + s * 30 && (((x + y) & 1) || y < top + 5)) c = '#1c181e'; return c; };
    // 굽도리: 벽 맨 아래 4줄을 큰 받침돌로 (윗면 밝은 턱)
    for (let y = RY0 - 4; y < RY0; y++) for (let x = RX0; x < RX1; x++) { const ly = y - (RY0 - 4), id = Math.floor((x - RX0 + 5) / 19), lx = (x - RX0 + 5) % 19, v = h2(id, 9, 851);
      let c = v < 0.5 ? '#3a3640' : '#34303a'; if (ly === 0) c = '#5a5662'; else if (ly === 1) c = '#46424c'; else if (lx === 18) c = '#18161c'; else if (ly === 3) c = '#26222a'; else if (lx === 0) c = '#423e48'; put(x, y, c); }
    P.rect(RX0, RY0 - 5, RX1 - RX0, 1, '#1c1a22');
    // 벽 아래쪽 그을음 (들보 뒤 · 불이 핥고 올라간 자국)
    for (let y = top; y < RY0 - 5; y++) for (let x = RX0; x < RX1; x++) { if (lost(x, y)) continue; for (const [fx, w] of [[250, 34], [116, 18]]) { const d = Math.abs(x - fx) / w, hgt = (1 - d) * 16 + h2(x >> 1, 0, 852) * 4; if (d < 1 && RY0 - 5 - y < hgt && bay(x, y) < 0.6) put(x, y, '#1c181e'); } }
    // 깃발 두 장: 찢어진 자락은 움직임에서 그림 → 옛 깃발을 지우고 (벽 · 굽도리 · 바닥) 그 자리 색을 기록
    for (const bx of [144, 200]) for (let x = -1; x < 22; x++) for (let y = top + 1; y < RY0 - 5; y++) { const X = bx + x; if (!lost(X, y)) put(X, y, wallAt(X, y)); }
    { const D0 = P.g.getImageData(0, 0, GW, GH).data; KNIGHT_BG = {};
      for (const bx of [144, 200]) for (let x = -1; x < 24; x++) for (let y = top + 20; y < top + 34; y++) { const X = bx + x, i = (y * GW + X) * 4; KNIGHT_BG[X + ',' + y] = toHex(D0[i], D0[i + 1], D0[i + 2]); } }
    // 깃대 (가로 막대)
    for (const bx of [144, 200]) { P.rect(bx - 3, top + 1, 26, 3, '#2a2228'); P.rect(bx - 4, top + 1, 1, 3, K); P.rect(bx + 23, top + 1, 1, 3, K); put(bx - 3, top + 1, '#4a4248'); }
    // 깃발 몸통 (위 18줄만, 자락은 움직임)
    for (const bx of [144, 200]) for (let x = 0; x < 20; x++) for (let y = 0; y < 16; y++) { const c = x === 0 ? '#9a3030' : x === 19 ? '#3e0e14' : x === 1 ? '#7a2024' : (y % 6 === 5 ? '#4e0e14' : '#621418'); put(bx + x, top + 4 + y, c); }
    for (const bx of [144, 200]) { P.rect(bx - 1, top + 4, 1, 16, K); P.rect(bx + 20, top + 4, 1, 16, K); const ex = bx + 10, ey = top + 13;
      for (let a = 0; a < 8; a++) { const r = a / 8 * Math.PI * 2; put(ex + Math.round(Math.cos(r) * 5), ey + Math.round(Math.sin(r) * 5), '#9a7028'); put(ex + Math.round(Math.cos(r) * 6), ey + Math.round(Math.sin(r) * 6), a % 2 ? '#6a4c20' : '#9a7028'); }
      P.rect(ex - 2, ey - 2, 5, 5, '#c09038'); P.rect(ex - 1, ey - 2, 3, 1, '#e0b040'); }
  
    // ================================================================ 3. 무너진 더미 2곳: 크기가 다른 돌덩이 · 벽돌 덩어리 (윗면 줄눈) · 숯 들보 · 흩어진 부스러기
    const rock = (cx, cy, rx, ry, seed) => { // 모난 돌덩이: 윗면(밝음 · 위 모서리 가장 밝음) + 앞면(어둠) + 오른쪽 그늘 · 줄마다 양끝이 들쭉날쭉
      const M = new Map(), w = Math.round(rx * 2), th = Math.max(2, Math.round(ry * 0.9)), fh = Math.max(2, Math.round(ry * 1.1)), x0 = Math.round(cx - rx), y0 = Math.round(cy - ry);
      const inL = j => Math.round(Math.abs(j - th * 0.6) * 0.35 + h2(j, 1, seed) * 1.6), inR = j => Math.round(Math.abs(j - th) * 0.3 + h2(j, 2, seed) * 1.6);
      for (let j = 0; j < th + fh; j++) { const l = inL(j), r = inR(j);
        for (let i = l; i < w - r; i++) { const X = x0 + i, Y = y0 + j, top2 = j < th; let c;
          if (top2) c = j === 0 || i === l ? '#9a94a0' : (i > w - r - 3 ? '#6e6878' : '#837d8a'); else c = j === th ? '#625d6a' : i > w - r - 3 ? '#3a3642' : i === l ? '#5a5562' : '#4e4a56';
          if (h2(X, Y, seed + 3) < 0.07) c = top2 ? '#6e6878' : '#3e3a46';
          M.set(X + ',' + Y, c); } }
      // 갈라진 금 하나
      if (h2(seed, 4, 1) < 0.6) { const ci = Math.round(w * (0.3 + h2(seed, 5, 1) * 0.4)); for (let j = 0; j < th + fh - 1; j++) { const k = (x0 + ci + (j >> 1)) + ',' + (y0 + j); if (M.has(k)) M.set(k, j < th ? '#55505e' : '#2e2a36'); } }
      blit(M, OL); };
    const brickBlock = (x0, y0, w, th, fh, seed) => { // 벽돌 덩어리: 윗면에 줄눈 · 앞면 벽돌 두 줄
      const M = new Map();
      for (let y = 0; y < th + fh; y++) for (let x = 0; x < w; x++) { const X = x0 + x + (y < th ? Math.floor((th - y) * 0.5) : 0); let c;
        if (y < th) c = y === 0 ? '#9a94a0' : (x % 6 === 5 ? '#55505e' : '#8a8490');
        else { const ly = (y - th) % 3, off = Math.floor((y - th) / 3) % 2 ? 3 : 0, lx = (x + off) % 6; c = ly === 2 || lx === 5 ? '#2e2a36' : ly === 0 ? '#6a6572' : (x > w - 3 ? '#46424e' : '#5a5562'); }
        M.set(X + ',' + (y0 + y), c); }
      blit(M, OL); };
    const chips = (cx, cy, r, n, seed) => { for (let i = 0; i < n; i++) { const a = h2(i, 5, seed) * Math.PI * 2, d = r * (0.6 + Math.pow(h2(i, 6, seed), 2) * 1.2), x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d * 0.42);
        if (y < RY0 + 1 || y > RY1 - 3) continue; const big = h2(i, 7, seed) < 0.35; put(x, y, big ? '#8a8490' : '#6a6572'); if (big) { put(x + 1, y, '#55505e'); put(x, y + 1, OL); put(x + 1, y + 1, OL); } else put(x, y + 1, OL); } };
    // 더미: 자갈 둔덕 (가장자리는 디더로 바닥에 스밈) 위에 모난 돌덩이를 뒤에서 앞으로 쌓음 — 아래는 크고 위는 작음
    const stoneP = (pts, hgt, seed) => { // 모난 돌덩이: 볼록 다각형 윗면 (위 왼쪽 모서리 밝음) + 아래로 hgt칸 두께의 앞면 (오른쪽으로 갈수록 어둠)
      const inside = (x, y) => { let s2 = 0; for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length], c = (bx - ax) * (y + 0.5 - ay) - (by - ay) * (x + 0.5 - ax); if (c === 0) continue; if (s2 === 0) s2 = Math.sign(c); else if (Math.sign(c) !== s2) return false; } return true; };
      const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.floor(Math.min(...xs)) - 1, x1 = Math.ceil(Math.max(...xs)) + 1, y0 = Math.floor(Math.min(...ys)) - 1, y1 = Math.ceil(Math.max(...ys)) + hgt + 1, cxs = (x0 + x1) / 2, w = x1 - x0;
      const M = new Map(), tone = h2(seed, 1, 891);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { let c = null;
        if (inside(x, y)) { c = !inside(x, y - 1) ? '#9a94a0' : !inside(x - 1, y) ? '#8a8490' : !inside(x + 1, y) ? '#5e5866' : (tone < 0.5 ? '#77717e' : '#6e6878'); if (h2(x, y, seed) < 0.07) c = '#625d6a'; }
        else { let k = 0; for (let d = 1; d <= hgt; d++) if (inside(x, y - d)) { k = d; break; } if (k) { const t2 = (x - x0) / w; c = k === 1 && t2 < 0.5 ? '#5e5866' : t2 < 0.35 ? '#55505e' : t2 < 0.7 ? '#46424e' : '#36323e'; if (h2(x, y, seed + 1) < 0.08) c = '#3a3642'; } }
        if (c) M.set(x + ',' + y, c); }
      blit(M, OL); };
    const heap = (cx, cy, rx, ry, n, seed) => {
      // 자갈 둔덕
      for (let y = Math.floor(cy - ry); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (h2(x >> 1, y, seed) - 0.5) * 0.25; if (q > 1) continue; if (q > 0.75 && bay(x, y) > (1 - q) * 3.5) continue;
        const v = h2(x, y, seed + 1), pebble = h2(x >> 1, y, seed + 2) < 0.35; put(x, y, pebble ? (v < 0.5 ? '#5a5562' : '#4a4652') : v < 0.15 ? '#625d6a' : v < 0.55 ? '#3a3642' : '#2e2a34'); if (pebble && h2(x >> 1, y + 1, seed + 2) >= 0.35) put(x, y + 1, '#26222c'); }
      // 돌덩이: 둔덕 안 무작위 자리 · 뒤(위)일수록 작게
      const LAY = seed === 861 ? [[112, 50, 4, 3], [100, 52, 3.2, 2], [126, 51, 3, 2], [88, 61, 4.2, 3], [104, 59, 5, 3], [121, 58, 5.6, 3], [131, 64, 4.6, 3], [96, 68, 6, 4], [116, 70, 7, 4], [84, 71, 2.4, 2], [137, 71, 2.4, 2]]
        : [[266, 47, 3.4, 2], [246, 53, 3.4, 2], [258, 55, 5, 3], [276, 53, 4.2, 3], [285, 60, 4, 3], [250, 63, 6, 4], [270, 65, 7, 4], [240, 64, 2.4, 2], [291, 68, 2.4, 2]];
      LAY.forEach(([x, y, sz, hg], i) => { const k = 5 + Math.floor(h2(i, 4, seed + 3) * 2), pts = []; for (let j = 0; j < k; j++) { const t2 = (j / k) * Math.PI * 2 + h2(i, 10 + j, seed + 3) * 0.7, r = sz * (0.7 + h2(i, 20 + j, seed + 3) * 0.45); pts.push([x + Math.cos(t2) * r * 1.2, y + Math.sin(t2) * r * 0.6]); }
        for (let yy = Math.floor(y - sz); yy <= y + sz + hg + 2; yy++) for (let xx = Math.floor(x - sz * 1.3); xx <= x + sz * 1.3 + 2; xx++) { const q = ((xx - x - 1.5) / (sz * 1.25)) ** 2 + ((yy - y - hg - 0.5) / (sz * 0.6)) ** 2; if (q < 1 && (xx + yy) & 1) put(xx, yy, '#1c181e'); } // 그림자 (v3.20 디더)
        stoneP(pts, hg, seed * 7 + i); });
      // 벽에서 떨어진 다듬은 돌 (네모 반듯)
      for (const [x, y] of seed === 861 ? [[94, 57], [128, 72]] : [[282, 69]]) stoneP([[x - 5, y - 2], [x + 4, y - 3], [x + 6, y + 1], [x - 3, y + 2]], 3, x);
      // 둘레 흩어진 돌 부스러기
      for (let i = 0; i < 22; i++) { const a = h2(i, 5, seed + 4) * Math.PI * 2, d = 1 + h2(i, 6, seed + 4) * 0.5, x = Math.round(cx + Math.cos(a) * rx * d), y = Math.round(cy + Math.sin(a) * ry * d); if (y < RY0 + 1 || y > RY1 - 3) continue;
        const big = h2(i, 7, seed + 4) < 0.35; put(x, y, big ? '#77717e' : '#5a5562'); if (big) { put(x + 1, y, '#4a4652'); put(x, y + 1, OL); put(x + 1, y + 1, OL); } else put(x, y + 1, OL); } };
    for (let y = RY0 - 5; y < RY0; y++) for (let x = 84; x < 138; x++) if (h2(x, y, 860) < 0.55) put(x, y, h2(x, y, 861) < 0.5 ? '#2e2a34' : '#3a3642');
    for (let y = RY0 - 5; y < RY0; y++) for (let x = 236; x < 290; x++) if (h2(x, y, 870) < 0.5) put(x, y, h2(x, y, 871) < 0.5 ? '#2e2a34' : '#3a3642');
    heap(110, 60, 26, 10, 13, 861);
    beam(P, 126, 46, 141, 64, 862);
    heap(262, 56, 24, 9, 11, 871);
    // ================================================================ 4. 불탄 들보 둘 (기존 그림 그대로 다시) · 숯 조각 · 불씨는 들보 둘레에만
    { const D0 = P.g.getImageData(0, 0, GW, GH).data;
      burntLog(P, 204, 88, 84, 18, 51); burntLog(P, 100, 106, 34, 11, 52);
      // 들보 위 작은 불꽃은 움직임에서 그림: 그려진 불꽃 자리를 바닥 · 들보 윗면으로 되돌림
      for (const [lx, ly, len] of [[204, 88, 84], [100, 106, 34]]) for (const fx of [Math.floor(len * 0.32), Math.floor(len * 0.66)]) for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const X = lx + fx + i, Y = ly - 4 + j;
        if (Y < ly - 1) { const k = (Y * GW + X) * 4; put(X, Y, toHex(D0[k], D0[k + 1], D0[k + 2])); } else if (Y === ly - 1) put(X, Y, K); else { const d = P.g.getImageData(X - 6, Y, 1, 1).data; put(X, Y, toHex(d[0], d[1], d[2])); } } }
    for (const [x, y] of [[292, 104], [296, 101], [200, 108], [138, 116], [226, 112], [262, 111]]) { put(x, y, K); put(x + 1, y, '#241a14'); put(x, y - 1, '#3a2e28'); put(x + 2, y, K); }
    for (const [x, y] of [[214, 110], [218, 112], [244, 113], [270, 112], [284, 109], [122, 120], [128, 121]]) { put(x, y, '#ff7a28'); put(x + 1, y, '#d03018'); }
  
    // ================================================================ 5. 떨어진 깃발 (반쯤 탐) · 돌 틈에 꽂힌 화살 · 기사의 잠자리 (펼친 붉은 망토)
    { // 셋째 깃발: 고리가 끊겨 벽 밑에 떨어져 누움 — 바닥에 펼쳐진 천 (살짝 비스듬 · 접힌 주름 두 줄 · 끝이 타서 너덜) + 금 문장이 반쯤 보임
      const M = new Map(), bx = 170, by = RY0 + 5, W0 = 22, H0 = 9;
      for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) { const X = bx + x + Math.floor(y * 0.4), Y = by + y - Math.floor(x / 11);
        const burnt = x > W0 - 6 && y + (h2(y, 1, 881) * 4) > (W0 - x) * 1.6; if (burnt && x > W0 - 2 - Math.floor(h2(y, 2, 881) * 4)) continue;
        let c = y === 0 ? '#9a3030' : y === H0 - 1 ? '#3e0e14' : (x === 7 || x === 15) ? '#4e0e14' : (x === 8 || x === 16) ? '#7a2024' : '#621418'; if (burnt) c = h2(x, y, 882) < 0.3 ? '#d03018' : '#2a1014';
        M.set(X + ',' + Y, c); }
      blit(M);
      for (const [x, y, c] of [[bx + 4, by + 3, '#c09038'], [bx + 5, by + 3, '#e0b040'], [bx + 5, by + 4, '#9a7028'], [bx + 4, by + 5, '#6a4c20'], [bx + 6, by + 2, '#9a7028']]) put(x, y, c);
      for (let x = bx; x < bx + 26; x++) if ((x & 1) && fget(x, by + H0 + 1)) put(x, by + H0 + 1, '#141016'); }
    const arrow = (x, y, dir, seed) => { for (let i = 0; i < 7; i++) { put(x + dir * i, y - i, '#7a5a3a'); put(x + dir * i + dir, y - i, K); } put(x + dir * 6, y - 7, '#c8c0b0'); put(x + dir * 7, y - 7, '#e8e0d0'); put(x + dir * 6, y - 8, '#e8e0d0'); put(x + dir * 5, y - 7, '#a83030'); put(x, y + 1, '#100c10'); put(x + dir, y + 1, '#100c10'); };
    arrow(156, 96, 1, 1); arrow(162, 99, 1, 2); arrow(150, 101, -1, 3); arrow(228, 146, -1, 4);
    // ================================================================ 6. 무기 거치대 (작게 · 다시 그림): 둥근 머리 기둥 둘 · 홈 파인 위 가로대 · 아래 가로대 · 앞으로 뻗은 받침 발. 검 둘 (하나는 금 코등이) + 위가 타서 부러진 창
    { const wx = 258, wy = 128, W = { H: '#a8845e', L: '#8e6e50', m: '#6e5038', d: '#4e3626', D: '#33241a' };
      const M = new Map(), set = (x, y, c) => M.set((wx + x) + ',' + (wy + y), c);
      // 받침 발 (앞으로 뻗은 두꺼운 각목)
      for (const fx of [-2, 17]) for (let y = 17; y < 21; y++) for (let x = 0; x < 6; x++) set(fx + x, y, y === 17 ? W.H : y === 20 ? W.D : x === 0 ? W.L : x === 5 ? W.d : W.m);
      // 기둥
      for (const px of [0, 18]) { for (let y = 1; y < 18; y++) for (let x = 0; x < 3; x++) set(px + x, y, x === 0 ? W.L : x === 2 ? W.D : (y % 5 === 2 ? W.d : W.m)); set(px, 0, W.H); set(px + 1, 0, W.H); set(px + 2, 0, W.L); set(px + 1, -1, W.L); }
      // 받침 앞판 (두 발을 잇는 판자)
      for (let x = 3; x < 18; x++) { set(x, 17, W.L); set(x, 18, W.m); set(x, 19, W.D); }
      // 가로대 (위 · 아래)
      for (let x = 3; x < 18; x++) { set(x, 4, W.H); set(x, 5, W.m); set(x, 6, W.D); set(x, 13, W.L); set(x, 14, W.D); }
      blit(M);
      // 위 가로대 홈 (검이 걸리는 자리)
      for (const sx of [6, 11, 15]) { put(wx + sx, wy + 4, K); put(wx + sx, wy + 5, '#1e140c'); }
      // 검: 칼끝이 아래 가로대 홈에 · 코등이가 위 가로대 위에 걸침
      const sword = (sx, gold) => { const X = wx + sx; for (let y = 6; y <= 15; y++) { put(X - 1, wy + y, K); put(X, wy + y, y === 15 ? '#8a8e98' : (y % 3 === 1 ? '#f0f4fa' : '#c8ccd4')); put(X + 1, wy + y, K); } put(X, wy + 16, K);
        P.rect(X - 3, wy + 2, 7, 3, K); for (let i = -2; i <= 2; i++) put(X + i, wy + 3, gold ? (i === -2 ? '#fff0a0' : i === 2 ? '#9a7028' : '#e0b040') : (i === -2 ? '#e8eef8' : i === 2 ? '#4a4856' : '#9a98a6'));
        for (let y = -2; y <= 2; y++) { put(X - 1, wy + y, K); put(X, wy + y, y & 1 ? '#5a3a22' : '#7a4a2a'); put(X + 1, wy + y, K); }
        P.rect(X - 1, wy - 5, 3, 3, K); put(X, wy - 4, gold ? '#e0b040' : '#9a98a6'); };
      sword(6, true); sword(11, false);
      // 부러진 창대: 위가 숯 · 불씨
      for (let y = -1; y < 16; y++) { put(wx + 14, wy + y, K); put(wx + 16, wy + y, K); put(wx + 15, wy + y, y < 3 ? (y < 0 ? '#d03018' : '#2c221c') : y % 4 === 0 ? '#6e5038' : '#8a6a4a'); } put(wx + 15, wy - 2, K); put(wx + 15, wy - 1, '#ff7a28');
      // 쇠 꺾쇠
      for (const [x, y] of [[1, 4], [19, 4], [1, 13], [19, 13]]) { put(wx + x, wy + y, '#9a98a6'); put(wx + x, wy + y + 1, '#4a4856'); }
      // 바닥에 떨어진 창날
      P.spr(['..k..', '.kSk.', 'kSsSk', '.kSk.', '..kdk', '...kk'], { k: K, S: '#c8ccd4', s: '#8a8e9a', d: '#55402c' }, wx + 25, wy + 14, false); }
  
    // ================================================================ 7. 성문: 굵은 돌기둥 (머릿돌 · 무너진 윗단) + 닳은 문턱 돌 + 문 밖 풀밭 · 흙길 · 굴러 나온 돌
    { const DT = ['#141a14', '#18201a', '#1c241c', '#202a1e'];
      for (let y = RY1 + 7; y < GH; y++) for (let x = 0; x < GW; x++) { const v = h2(x >> 1, y, 901) * 0.6 + h2(x, y, 902) * 0.4; put(x, y, DT[v < 0.35 ? 0 : v < 0.65 ? 1 : v < 0.88 ? 2 : 3]); }
      for (let x = 0; x < GW; x++) { const n = h2(x, 1, 903); if (n < 0.4) continue; for (let j = 0; j < 1 + Math.floor((n - 0.4) * 5); j++) put(x, RY1 + 9 - j, n > 0.8 ? '#3a4a30' : '#2a3824'); }
      for (let k = 0; k < 50; k++) { const x = Math.floor(h2(k, 1, 904) * GW), y = RY1 + 12 + Math.floor(h2(k, 2, 904) * (GH - RY1 - 12)); put(x, y, '#2e3a28'); put(x + 1, y - 1, '#26321f'); }
      for (let y = RY1; y < GH; y++) { const w = 13 + (y - RY1) * 0.45; for (let x = Math.floor(CX - w); x < CX + w; x++) { const d = Math.abs(x - CX) / w; if (bay(x, y) < (1 - d) * 1.6 - 0.2) put(x, y, h2(x, y, 905) < 0.5 ? '#3a3026' : '#33291f'); } }
      for (const [x, y] of [[CX - 26, RY1 + 13], [CX + 22, RY1 + 17], [CX + 9, RY1 + 24]]) { put(x, y, '#77717e'); put(x + 1, y, '#5a5562'); put(x, y + 1, '#2e2a34'); put(x + 1, y + 1, '#2e2a34'); }
      // 문턱 돌: 가운데가 닳아 낮아진 큰 돌 두 장
      for (let y = RY1 - 2; y < RY1 + 7; y++) for (let x = CX - 16; x < CX + 16; x++) { const ly = y - RY1 + 2, seam = x === CX - 1; let c = ly === 0 ? '#6a6572' : ly < 3 ? (Math.abs(x - CX) < 8 ? '#4e4a56' : '#5a5562') : ly === 3 ? '#2e2a36' : null;
        if (ly > 3) c = h2(x, y, 906) < 0.5 ? '#3a3026' : '#2e261e'; if (seam && ly < 3) c = '#26222c'; put(x, y, c); }
      // 돌기둥: 넓은 머릿돌 (윗면 · 앞면 · 밑 그늘) + 큰 마름돌 몸통 (줄마다 이음매가 엇갈림 · 모서리 이 빠짐 · 위쪽 그을음) + 넓은 받침돌. 오른쪽은 머릿돌이 떨어져 윗단이 비스듬히 깨짐
      const pillar = (px, broken) => { const W2 = 14, y0 = RY1 - 19, y1 = RY1 + 7, M = new Map(), set = (x, y, c) => M.set((px + x) + ',' + y, c);
        const breakTop = x => y0 + 6 + Math.round(Math.max(0, x - 2) * 0.55) + (h2(x, 1, 911) < 0.4 ? 1 : 0);
        for (let y = y0; y < y1; y++) { const j = y - y0;
          if (j < 4) { if (broken) continue; for (let x = 0; x < W2; x++) set(x, y, j === 0 ? (x === 0 ? '#9a94a0' : '#a8a2ae') : x === 0 ? '#8a8490' : x === W2 - 1 ? '#6a6572' : (h2(x, y, 912) < 0.1 ? '#77717e' : '#8a8490')); continue; }
          if (j < 6) { if (broken) continue; for (let x = 0; x < W2; x++) set(x, y, j === 4 ? (x === W2 - 1 ? '#46424e' : '#625d6a') : '#4e4a56'); continue; }
          if (y >= y1 - 4) { for (let x = 0; x < W2; x++) { const k = y - (y1 - 4); set(x, y, k === 0 ? (x === W2 - 1 ? '#625d6a' : '#8a8490') : x === 0 ? '#5e5866' : x === W2 - 1 ? '#3a3542' : '#4e4a56'); } continue; }
          for (let x = 1; x < W2 - 1; x++) { if (broken && y < breakTop(x)) continue;
            const bj = j - 7, row = Math.floor(bj / 6), ly = ((bj % 6) + 6) % 6, seam = row & 1 ? -9 : 6, lx = x - 1;
            let c = lx === 0 ? '#77717e' : lx >= W2 - 4 ? (lx === W2 - 3 ? '#3a3542' : '#46424e') : (h2(x, y, 913) < 0.08 ? '#4e4a56' : '#5a5562');
            if (ly === 5) c = '#2e2a36'; else if (ly === 0 && lx > 0 && lx < W2 - 3) c = '#66606e'; if (lx === seam && ly < 5) c = '#2e2a36';
            if (j === 6) c = '#2a2630'; // 머릿돌 밑 그늘
            if (h2(row, lx, 914) < 0.05 && ly === 0 && lx > 1) c = '#46424e'; // 이 빠진 모서리
            if (broken && y === breakTop(x)) c = '#8a8490'; else if (broken && y === breakTop(x) + 1) c = '#6e6878'; // 깨진 단면
            set(x, y, c); } }
        // 기둥 위 돌 장식 (왼쪽 기둥만): 받침 두 단 · 목 · 둥근 돌 구슬 (위 왼쪽 밝음 · 반짝이는 점)
        if (!broken) { const cx2 = 7;
          for (let x = 3; x < 11; x++) { set(x, y0 - 1, x === 3 ? '#77717e' : x === 10 ? '#46424e' : '#5e5866'); set(x, y0 - 2, x === 10 ? '#77717e' : '#a8a2ae'); }
          for (let x = 4; x < 10; x++) set(x, y0 - 3, x === 9 ? '#46424e' : '#6e6878');
          for (let x = 5; x < 9; x++) set(x, y0 - 4, x === 8 ? '#3a3642' : '#55505e');
          const BW2 = [4, 6, 8, 8, 8, 6, 4];
          BW2.forEach((w, j) => { for (let i = 0; i < w; i++) { const x = cx2 - w / 2 + i, y = y0 - 11 + j, u = (x - cx2 + 0.5) / 4, v = (j - 3) / 3.5, l = -u * 0.6 - v * 0.8;
            set(x, y, l > 0.55 ? '#c0bac6' : l > 0.15 ? '#9a94a0' : l > -0.25 ? '#77717e' : l > -0.6 ? '#5e5866' : '#46424e'); } });
          set(cx2 - 2, y0 - 10, '#e0dce6'); }
        blit(M);
        FGK.push([...M.keys()].concat([...M.keys()].flatMap(k => { const [x, y] = k.split(',').map(Number); return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (x + dx) + ',' + (y + dy)); })));
        // 위쪽 그을음: 머릿돌 밑 두 줄만 어둡게
        for (let y = y0 + 7; y < y0 + 9; y++) for (let x = 1; x < W2 - 1; x++) if (M.has((px + x) + ',' + y) && !(broken && y <= breakTop(x) + 1) && (y === y0 + 7 || (x & 1))) put(px + x, y, '#3a3642'); };
      const FGK = []; pillar(CX - 30, false); pillar(CX + 16, true);
      { const D0 = P.g.getImageData(0, 0, GW, GH).data; KNIGHT_FG = FGK.map(keys => { const pix = [...new Set(keys)].map(k => { const [x, y] = k.split(',').map(Number), i = (y * GW + x) * 4; return [x, y, toHex(D0[i], D0[i + 1], D0[i + 2])]; }); return { base: RY1 + 7, pix }; }); }
      // 떨어진 머릿돌 (오른쪽 기둥 밖 풀밭) + 부스러기
      { const fx = CX + 34, fy = RY1 + 9, M = new Map(); for (let y = 0; y < 7; y++) for (let x = 0; x < 12; x++) { if ((x === 0 || x === 11) && (y === 0 || y === 6)) continue; if (x > 8 && y < 2) continue; M.set((fx + x) + ',' + (fy + y), y === 0 ? '#a8a2ae' : y < 3 ? (x === 0 ? '#9a94a0' : '#8a8490') : y === 3 ? '#625d6a' : x > 9 ? '#3a3542' : '#4e4a56'); } blit(M);
        for (const [x, y] of [[fx - 3, fy + 6], [fx + 14, fy + 4], [CX + 26, RY1 + 7], [CX + 29, RY1 + 9]]) { put(x, y, '#77717e'); put(x + 1, y, '#55505e'); put(x, y + 1, OL); put(x + 1, y + 1, OL); } } }
  
    // ================================================================ 8. 빛 (디더 글로우): 무너진 틈으로 떨어지는 달빛 (공기 중 빛줄기 · 바닥 빛 자리) + 불탄 들보 잉걸불 후광
    { const D = P.g.getImageData(0, 0, GW, GH).data;
      const lighten = (x, y, tint, k) => { const i = (y * GW + x) * 4, r = D[i], g = D[i + 1], b = D[i + 2]; put(x, y, toHex(r + (tint[0] - r) * k + 14 * k, g + (tint[1] - g) * k + 14 * k, b + (tint[2] - b) * k + 14 * k)); };
      const glowAt = (x, y, lv, tint) => { if (x < 0 || y < 0 || x >= GW || y >= GH) return; if (lv < bay(x, y) * 0.9) return; lighten(x, y, tint, lv > 0.72 ? 0.5 : lv > 0.45 ? 0.34 : 0.2); };
      const MOON = rgbOf('#a8b8e8'), MOON2 = rgbOf('#c8d0f0'), EMB = rgbOf('#ff8a40');
      // 달빛줄기: 틈 아래 벽 · 공기 중 (아주 옅게, 바닥 위 소품은 피함)
      for (const [hx0, hx1, py0, py1, sk] of [[94, 128, RY0 + 30, RY0 + 58, 30], [236, 284, RY0 + 30, RY0 + 45, 16]]) for (let y = top + 2; y < RY0; y++) { const t = (y - top) / (py1 - top), xl = hx0 + t * sk, xr = hx1 + t * sk * 0.8;
        for (let x = Math.floor(xl); x <= xr; x++) glowAt(x, y, 0.18 + t * 0.08, MOON2); }
      // 잉걸불: 들보 뒤 벽 아래쪽만 따뜻하게
      for (let y = RY0 - 14; y < RY0; y++) for (let x = 190; x < 300; x++) { const d = Math.hypot((x - 246) / 56, (y - RY0) / 14); if (d < 1) glowAt(x, y, (1 - d) * 0.5, EMB); } }
  };
  }
  SCENES.knight.fg = () => KNIGHT_FG;
  // ================================================================ 움직임: 불티 · 들보 불꽃 깜빡임 · 달빛 속 재 · 깃발 자락 (바람 한 박자)
  SCENES.knight.fx = (t, cell) => {
    const [RX0, RY0, RX1, RY1] = SCENES.knight.room || ROOM0, top = RY0 - 20;
    const gt = t % 8.7, gust = gt < 1.4 ? Math.sin(Math.PI * gt / 1.4) : 0;
    // 불티: 들보 윗면에서 떠올라 흔들리며 사라짐
    for (let i = 0; i < 12; i++) { const big = i < 9, L = big ? [208, 284, 88] : [104, 132, 106], life = 2.2 + h2(i, 1, 951) * 1.6, ph = ((t + h2(i, 2, 951) * 9) % life) / life, x0 = L[0] + h2(i, Math.floor((t + h2(i, 2, 951) * 9) / life), 952) * (L[1] - L[0]);
      const x = Math.round(x0 + Math.sin(ph * 6 + i) * 1.5 + gust * ph * 4), y = Math.round(L[2] - ph * 22), a = ph < 0.15 ? ph / 0.15 : 1 - (ph - 0.15) / 0.85; cell(x, y, ph < 0.4 ? '#ffd060' : ph < 0.7 ? '#ff8a30' : '#c03018', a); }
    // 들보 위 불씨 깜빡임: 갈라진 틈 몇 칸이 밝아졌다 어두워짐
    for (let i = 0; i < 14; i++) { const big = i < 10, x = big ? 210 + Math.floor(h2(i, 3, 953) * 72) : 104 + Math.floor(h2(i, 3, 953) * 26), y = big ? 89 + Math.floor(h2(i, 4, 953) * 15) : 107 + Math.floor(h2(i, 4, 953) * 8), n = Math.floor(t * 4 + h2(i, 5, 953) * 10);
      const lv = h2(n, i, 954); if (lv > 0.55) cell(x, y, lv > 0.85 ? '#ffd060' : '#ff7a28', 0.9); }
    // 들보 위 불꽃 넷: 모양이 불규칙하게 바뀌고 바람 불 때 옆으로 눕음
    { const FR = [['..y..', '.yYy.', '.oyo.', 'roYor', '.rrr.'], ['.y...', '..y..', '.yYy.', 'oyYyo', 'roYor', '.rrr.'], ['...y.', '..yy.', '.oYy.', 'royor', '.rrr.'], ['.....', '..y..', '.oyo.', 'roYor', '.rrr.'], ['..y..', '..Y..', '.yYy.', 'oyYyo', 'roYor', '.rrr.']], FRW = [['.....', '..yy.', '.oyYy', 'roYor', '.rrr.'], ['.....', '...yy', '.oyYy', 'roYyr', '.rrr.']], C = { y: '#ffd34d', Y: '#ffffff', o: '#ff7a28', r: '#d03018' };
      let n2 = 0; for (const [lx, ly, len] of [[204, 88, 84], [100, 106, 34]]) for (const fx of [Math.floor(len * 0.32), Math.floor(len * 0.66)]) { n2++;
        const f = gust > 0.45 ? FRW[Math.floor(t * 6 + n2) % 2] : FR[Math.floor(h2(Math.floor(t * 7 + n2 * 1.7), n2, 957) * FR.length)];
        f.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') cell(lx + fx + i, ly - f.length + 1 + j - 0 + (5 - 5), C[ch], 1); })); } }
    // 달빛 속 재: 아주 천천히 내려앉음
    for (let i = 0; i < 10; i++) { const left = i < 5, x0 = left ? 98 : 240, w = left ? 34 : 46, sp = 0.03 + h2(i, 1, 955) * 0.02, ph = (t * sp + h2(i, 2, 955)) % 1, y = top + 6 + ph * ((left ? RY0 + 40 : RY0 + 30) - top - 6), x = x0 + h2(i, 3, 955) * w + ph * (left ? 14 : 10) + Math.sin(t * 0.6 + i * 1.7) * 2 + gust * 2;
      const a = Math.min(1, Math.min(ph, 1 - ph) * 5) * 0.75; cell(Math.round(x), Math.round(y), i & 1 ? '#d8dcf0' : '#a8b0c8', a); }
    // 깃발 자락: 바람 불 때 끝이 한두 칸 오른쪽으로
    for (const bx of [144, 200]) { const sw = gust > 0.6 ? 2 : gust > 0.25 ? 1 : 0;
      if (KNIGHT_BG) for (let x = -1; x < 24; x++) for (let y = top + 20; y < top + 34; y++) { const c = KNIGHT_BG[(bx + x) + ',' + y]; if (c) cell(bx + x, y, c, 1); }
      for (let x = 0; x < 20; x++) { const len = 22 + Math.floor(h2(x, bx, 2) * 4) - (x > 11 ? Math.floor(h2(x, bx, 3) * 9) : 0) - (x < 4 ? Math.floor(h2(x, bx, 5) * 4) : 0);
        for (let y = 16; y < len; y++) { const off = Math.floor((y - 16) / 4 * sw * 0.6), c = y >= len - 2 ? '#2a1014' : x === 0 ? '#9a3030' : x === 19 ? '#3e0e14' : x === 1 ? '#7a2024' : (y % 6 === 5 ? '#4e0e14' : '#621418'); cell(bx + x + off, top + 4 + y, c, 1); if (x === 0) cell(bx - 1 + off, top + 4 + y, K, 1); if (x === 19) cell(bx + 20 + off, top + 4 + y, K, 1); }
        const offE = Math.floor((len - 16) / 4 * sw * 0.6); cell(bx + x + offE, top + 4 + len, K, 1); if (h2(x, bx, 4) < 0.35) cell(bx + x + offE, top + 3 + len, '#d03018', 1); if (h2(x, bx, 6) < 0.12) cell(bx + x + offE, top + 2 + len, h2(Math.floor(t * 5), x, 956) < 0.5 ? '#ff7a28' : '#ffb050', 1); } }
  };
  SCENES.knight.lights = [{ x: 246, y: 98, r: 48, a: 0.55, c: [255, 120, 50], fl: 1 }, { x: 119, y: 110, r: 26, a: 0.35, c: [255, 120, 50], fl: 2 }, { x: 112, y: 40, r: 40, a: 0.32, c: [150, 170, 230], sy: 0.7 }, { x: 262, y: 34, r: 40, a: 0.32, c: [150, 170, 230], sy: 0.7 }, { x: 192, y: 205, r: 60, a: 0.35, c: [140, 160, 200] }, { x: 170, y: 134, r: 30, a: 0.2, c: [230, 210, 180] }];
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
      for (let y = RY0 + 37; y < RY0 + 50; y++) for (let x = RX0; x < RX0 + 57; x++) if (((x + y) & 1) && (y < RY0 + 41 || h2(x, y, 63) < 1 - (y - RY0 - 41) / 9)) T.on(FL2, x, y, '#2e2016'); // v3.20 디더
      // 접지 그림자
      const SH = (x0, x1, y) => T.shOval(FL2, (x0 + x1) / 2 + 2, y + 0.5, (x1 - x0) / 2 + 3, 2.6, '#1e140c', x0 + y, 1.3); // 빛이 왼쪽 위에서 → 그림자는 오른쪽 아래로 살짝
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
  // ---------------------------------------------------------------- v3.18 버려진 역참 도트 개선 (시안 _시안/시작장소_도트개선_3단계_버려진역참_시안05.html)
  {
    const base = SCENES.ranger.draw;
    SCENES.ranger.draw = function (P) {
    base(P);
    const top = RY0 - 22, cx = (RX0 + RX1) / 2;
    const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], bay = (x, y) => (B4[y & 3][x & 3] + 0.5) / 16;
    const hx = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'), toHex = (r, g, b) => '#' + hx(r) + hx(g) + hx(b);
    const rgbOf = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const put = (x, y, c) => P.put(x, y, c);
    // 나무 색 (밝음 → 어둠)
    const W = { H: '#b89870', L: '#a8845e', l: '#8e6e50', m: '#6e5038', w: '#5e4430', d: '#4e3626', D: '#33241a', s: '#241812' };
    const IR = { h: '#9a9aa8', l: '#76768a', m: '#55556a', d: '#36364a' };
  
    // ================================================================ 1. 바닥 (한 장의 배열에 바닥을 다 그리고 한 번에 칠함)
    const PL = { a: '#5a4230', b: '#523a28', c: '#4a3424', gap: '#26180e', hi: '#664c38', nail: '#8a7a6a', grain: '#3e2c1e' };
    const FG = Grid(); planksW(FG, RX0, RY0, RX1, RY1, PL, 12);
    const fdat = FG.g.getImageData(0, 0, GW, GH).data, FL = new Array(GW * GH);
    for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) { const i = (y * GW + x) * 4; FL[y * GW + x] = toHex(fdat[i], fdat[i + 1], fdat[i + 2]); }
    const fget = (x, y) => FL[y * GW + x], fset = (x, y, c) => { if (x >= RX0 && x < RX1 && y >= RY0 && y < RY1) FL[y * GW + x] = c; };
    const FLOORSET = new Set(Object.values(PL).concat(['#4e3828']));
    // 닳은 길: 문 → 탁자 → 카운터 (밟힌 판자가 한 톤 밝음 · 가장자리 디더)
    const WM = { '#5a4230': '#684c38', '#523a28': '#604632', '#4a3424': '#583e2c', '#664c38': '#725842', '#3e2c1e': '#4a3626', '#4e3828': '#5a4232' };
    const segDist = (x, y, pts, sy = 1.5) => { let best = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy))); best = Math.min(best, Math.hypot(x - ax - vx * t, (y - ay - vy * t) * sy)); } return best; };
    { const pts = [[cx, RY1 - 1], [cx - 2, 128], [212, 100], [250, 84]];
      for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) { const c = fget(x, y); if (!WM[c]) continue; const d = segDist(x, y, pts); if (d < 5 || (d < 9 && bay(x, y) < (9 - d) / 4.5)) fset(x, y, WM[c]); } }
    // 문으로 들어온 흙: 문턱 안쪽에 부채꼴로 흩어짐
    { const DIRT = ['#4a3c30', '#3e3228', '#56463a'];
      for (let y = RY1 - 14; y < RY1; y++) for (let x = cx - 18; x < cx + 18; x++) { const d = Math.hypot((x - cx) / 16, (y - RY1) / 12); if (d > 1) continue; const lv = (1 - d) * 1.25 * (0.6 + h2(x >> 1, y >> 1, 301) * 0.6); if (lv > bay(x, y) * 1.1) fset(x, y, DIRT[Math.floor(h2(x, y, 302) * 3)]); } }
    // 둥근 깔개 (탁자 밑): 바랜 붉은 천 · 테두리 띠 · 가운데 마름모 · 닳은 자리 · 양 끝 술
    const RUG = { ox: 187, oy: 109, rx: 27, ry: 10 };
    { const { ox, oy, rx, ry } = RUG;
      for (let y = oy - ry - 1; y <= oy + ry + 1; y++) for (let x = ox - rx - 1; x <= ox + rx + 1; x++) {
        const q = ((x - ox) / rx) ** 2 + ((y - oy) / ry) ** 2; if (q > 1) continue;
        const ang = Math.atan2((y - oy) / ry, (x - ox) / rx), dm = Math.abs(x - ox) / 13 + Math.abs(y - oy) / 5;
        let c = q > 0.92 ? '#3a1818' : q > 0.8 ? (Math.floor((ang + 4) * 7) % 3 === 0 ? '#9a6a38' : '#5e2626') : q > 0.74 ? '#8a5a30' : h2(x >> 1, y, 72) < 0.5 ? '#6a2e2a' : '#723430';
        if (q <= 0.74) { if (dm < 1 && dm > 0.82) c = '#9a6a38'; else if (dm <= 0.82 && dm > 0.62) c = '#5e2626'; else if (dm <= 0.62 && dm > 0.48) c = '#8a5a30'; else if (dm <= 0.48) c = dm < 0.16 ? '#b08048' : '#7a3a30'; }
        // 닳은 자리 (길이 지나는 곳 · 의자 다리 자리)
        const wd = segDist(x, y, [[cx - 2, 128], [212, 100]]); if (wd < 6 && bay(x, y) < (6 - wd) / 7) c = c === '#5e2626' || c === '#3a1818' ? '#6e3632' : '#8a4a40';
        if (h2(x >> 1, y >> 1, 73) < 0.04 && q < 0.6 && q > 0.2) c = '#4e3a2a';
        fset(x, y, c); }
      // 술: 양 끝 (가로 실 · 한 줄 건너)
      for (let y = oy - 5; y <= oy + 5; y++) { if ((y - oy) & 1) continue; const e = Math.round(rx * Math.sqrt(Math.max(0, 1 - ((y - oy) / ry) ** 2)));
        for (const s of [-1, 1]) { const len = 2 + (h2(y, s, 74) < 0.5 ? 1 : 0); for (let k = 1; k <= len; k++) fset(ox + s * (e + k), y, k === len ? '#8a7450' : '#c0a070'); } }
      // 앞쪽 가장자리 말려 올라간 모서리 (오른쪽 아래)
      for (let k = 0; k < 4; k++) for (let j = 0; j <= k; j++) fset(ox + 14 + k, oy + 8 - 3 + j + (3 - k), j === 0 ? '#b07a50' : '#4a1e1e'); }
    // 다락 밑 그늘
    for (let y = RY0 + 37; y < RY0 + 52; y++) for (let x = RX0; x < RX0 + 57; x++) if (y < RY0 + 40 || bay(x, y) < 1 - (y - RY0 - 40) / 12) fset(x, y, y < RY0 + 39 ? '#24180f' : '#2e2016');
    // 다락 오른쪽 옆 그늘 (가는 띠)
    for (let y = RY0; y < RY0 + 37; y++) for (let x = RX0 + 57; x < RX0 + 61; x++) if (x === RX0 + 57 || bay(x, y) < 0.5 - (x - RX0 - 58) * 0.18) fset(x, y, '#2e2016');
    // 벽 밑 · 양옆 벽 그늘
    for (let y = RY0; y < RY0 + 4; y++) for (let x = RX0 + 57; x < RX1; x++) if (y < RY0 + 2 || (y === RY0 + 2 && (x & 1)) || (y === RY0 + 3 && x % 4 === 1)) fset(x, y, '#22160e');
    for (let y = RY0 + 37; y < RY1; y++) for (const [x0, dir] of [[RX0, 1], [RX1 - 1, -1]]) for (let k = 0; k < 3; k++) if (k === 0 || bay(x0 + dir * k, y) < 0.5 - k * 0.15) fset(x0 + dir * k, y, '#22160e');
    // 카운터 밑 그림자
    for (let x = 229; x < RX1; x++) { fset(x, RY0 + 22, '#1e140c'); if (x & 1) fset(x, RY0 + 23, '#1e140c'); }
    // 접지 그림자 (빛이 왼쪽 위 → 오른쪽 아래로 살짝)
    const SHADOWC = '#1e140c';
    const shadowOval = (ox, oy, rx, ry, seed, c = SHADOWC) => { for (let y = Math.floor(oy - ry); y <= oy + ry; y++) for (let x = Math.floor(ox - rx); x <= ox + rx; x++) { const q = ((x - ox) / rx) ** 2 + ((y - oy) / ry) ** 2; if (q > 1) continue; if (q < 0.45 || bay(x, y) < (1 - q) * 1.6) fset(x, y, c); } };
    // 끌린 핏자국: 문에서 카운터 옆으로 — 굵은 자국 안에 결 · 가장자리 방울 · 끝으로 갈수록 가늘어짐
    { const BL = { a: '#4a1216', b: '#5e1a1c', c: '#3a0e12', d: '#2e0a0e' };
      const drag = [[cx + 6, RY1 - 3], [cx + 13, 142], [226, 128], [246, 112], [262, 102]];
      let acc = 0; const total = drag.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - drag[i][0], p[1] - drag[i][1]), 0);
      for (let i = 0; i < drag.length - 1; i++) { const [ax, ay] = drag[i], [bx, by] = drag[i + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)), len = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / len, ny = (bx - ax) / len;
        for (let k = 0; k <= n; k++) { const t = (acc + len * k / n) / total, x = ax + (bx - ax) * k / n, y = ay + (by - ay) * k / n, wdt = 1.6 - t * 0.9;
          for (let o = -2; o <= 2; o++) { if (Math.abs(o) > wdt + 0.4) continue; const X = Math.round(x + nx * o), Y = Math.round(y + ny * o * 0.6), r = h2(X, Y, 65);
            if (r < 0.12 + t * 0.3) continue; fset(X, Y, Math.abs(o) >= 1.5 ? BL.c : (k + o * 3) % 7 === 0 ? BL.b : r < 0.3 ? BL.d : BL.a); }
          if (h2(Math.round(x), Math.round(y), 66) > 0.93) { fset(Math.round(x + nx * 3), Math.round(y + ny * 2), BL.b); fset(Math.round(x - nx * 3) + 1, Math.round(y - ny * 2), BL.c); } }
        acc += len; }
      // 끝: 마른 웅덩이 + 카운터 옆판에 닿은 손자국
      shadowOval(264, 101, 6, 2.4, 67, BL.c); shadowOval(263, 100, 3.2, 1.3, 68, BL.a); fset(262, 100, BL.b); fset(266, 101, BL.b);
      for (const [x, y] of [[cx - 7, 152], [176, 134], [212, 144], [238, 124]]) { fset(x, y, BL.b); fset(x + 1, y, BL.c); } }
    // 칼자국 세 줄 (바닥, 탁자 오른쪽)
    for (let j = 0; j < 3; j++) for (let i = 0; i < 7; i++) fset(214 + j * 3 + i, 111 + i - (i >> 1), i === 0 ? '#9a7a5a' : '#2a1a10');
    // 짚 부스러기 (사다리 밑)
    for (let k = 0; k < 11; k++) { const x = 130 + Math.floor(h2(k, 1, 69) * 18), y = 111 + Math.floor(h2(k, 2, 69) * 6), c = h2(k, 3, 69) < 0.5 ? '#9a8450' : '#7a6a3e'; fset(x, y, c); fset(x + 1, y + (k & 1 ? 1 : 0), c); if (k % 3 === 0) fset(x + 2, y + 1, c); }
    // 소품 그림자
    shadowOval(108, 157, 9, 2.4, 81); shadowOval(127, 147, 11, 2.2, 82); shadowOval(111, 140, 7, 2, 83);
    shadowOval(268, 158, 12, 2.6, 84); shadowOval(282, 160, 7, 2.2, 85);
    shadowOval(190, 118, 9, 2.2, 87); shadowOval(171, 118, 5, 1.6, 88); shadowOval(195, 101, 5, 1.6, 89); shadowOval(222, 129, 7, 2, 90);
    shadowOval(103, 107, 4, 1.4, 91); shadowOval(148, 107, 4, 1.4, 92); shadowOval(140, 112, 6, 1.6, 93);
    // 쏟은 술 웅덩이 (탁자 끝에서 떨어진 방울 밑)
    shadowOval(210, 135, 6, 1.6, 94, '#3a1a22'); fset(207, 134, '#7a4a5a'); fset(213, 136, '#5a2a3a');
    // 바닥 칠하기 (다락 · 카운터 자리는 빼기)
    for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) { if (x < RX0 + 57 && y < RY0 + 37) continue; if (x >= 229 && y < RY0 + 22) continue; put(x, y, fget(x, y)); }
  
    // ================================================================ 2. 문 밖: 흙길 (바퀴 자국 · 말발굽 · 자갈 · 마른 풀)
    { const DT = ['#2a231d', '#2f2720', '#352c24', '#3c3229'];
      for (let y = RY1 + 7; y < GH; y++) for (let x = 0; x < GW; x++) { const v = h2(x >> 2, y >> 1, 311) * 0.55 + h2(x, y, 312) * 0.45; put(x, y, DT[v < 0.3 ? 0 : v < 0.62 ? 1 : v < 0.86 ? 2 : 3]); }
      // 바퀴 자국 두 줄 (살짝 물결)
      for (const ry of [RY1 + 20, RY1 + 30]) for (let x = 0; x < GW; x++) { const y = ry + Math.round(Math.sin(x / 29 + ry) * 1.2);
        put(x, y - 1, (x & 1) ? '#40352c' : '#3c3229'); put(x, y, '#1e1915'); put(x, y + 1, '#231d18'); if (h2(x, ry, 313) < 0.5) put(x, y + 2, '#2a231d'); if (h2(x, ry, 314) < 0.12) put(x, y, '#2f2720'); }
      // 문에서 나오는 밟힌 길
      for (let y = RY1 + 7; y < RY1 + 22; y++) for (let x = cx - 16; x < cx + 16; x++) { const d = Math.abs(x - cx + 1) / (10 + (y - RY1 - 7) * 0.5); if (d < 1 && bay(x, y) < (1 - d) * 1.3) put(x, y, (x + y) % 5 ? '#3e3329' : '#46392e'); }
      // 말발굽 자국 (∩ 모양 · 쌍으로)
      const hoof = (x, y) => { put(x, y, '#1e1915'); put(x + 1, y - 1, '#1e1915'); put(x + 2, y - 1, '#1e1915'); put(x + 3, y, '#1e1915'); put(x, y + 1, '#231d18'); put(x + 3, y + 1, '#231d18'); put(x + 1, y, '#40352c'); put(x + 2, y, '#40352c'); };
      for (const [x, y] of [[40, 199], [52, 202], [70, 198], [83, 201], [256, 198], [270, 201], [300, 199], [314, 202], [214, 207], [226, 210]]) hoof(x, y);
      for (const [x, y] of [[cx + 4, RY1 + 13], [cx - 7, RY1 + 17]]) hoof(x, y);
      // 자갈
      for (let k = 0; k < 40; k++) { const x = Math.floor(h2(k, 1, 315) * GW), y = RY1 + 9 + Math.floor(h2(k, 2, 315) * (GH - RY1 - 10)); put(x, y, '#5a4e44'); put(x + 1, y, '#46392e'); put(x, y + 1, '#1e1915'); put(x + 1, y + 1, '#1e1915'); }
      // 벽 밑 마른 풀 (문 앞은 빼기)
      for (let x = RX0 - 8; x < RX1 + 8; x++) { if (Math.abs(x - cx) < 18) continue; const n = h2(x, 1, 316); if (n < 0.45) continue; const hgt = 1 + Math.floor((n - 0.45) * 6), c = n > 0.8 ? '#6a6440' : '#545032';
        for (let j = 0; j < hgt - (hgt >= 2 ? 1 : 0); j++) put(x, RY1 + 8 + 2 - j, c); } // 2칸 넘는 풀은 끝 칸을 움직임(fx)에서 그림
      // 문간: 벽 두께 자리에 흙 + 닳은 나무 문턱
      for (let y = RY1; y < RY1 + 7; y++) for (let x = cx - 12; x < cx + 12; x++) { const v = h2(x, y, 317); put(x, y, v < 0.3 ? '#2f2720' : v < 0.7 ? '#3e3329' : '#46392e'); }
      for (let x = cx - 12; x < cx + 12; x++) { put(x, RY1 - 1, h2(x, 2, 318) < 0.2 ? '#7e5e44' : '#9a7a5a'); put(x, RY1, '#6e5038'); put(x, RY1 + 1, (x & 1) ? '#231d18' : '#2a231d'); if ((x - cx) % 7 === 3) put(x, RY1 - 1, '#5e4430'); }
      put(cx - 6, RY1 - 1, '#c8a878'); put(cx + 5, RY1 - 1, '#c8a878');
      // 문설주: 굵은 각목 (모서리 깎음) · 문짝 떨어진 자리에 남은 경첩 두 개
      // 문설주: 벽 끝을 막은 굵은 각목 (윗면 나이테) · 문짝 떨어진 자리에 남은 경첩
      const jamb = (x) => { P.rect(x - 1, RY1 - 3, 6, 11, K); for (let y = RY1 - 2; y < RY1 + 7; y++) { put(x, y, W.L); put(x + 1, y, W.l); put(x + 2, y, (y + x) % 5 === 0 ? W.d : W.m); put(x + 3, y, W.D); }
        P.rect(x, RY1 - 2, 4, 2, W.H); put(x + 1, RY1 - 2, '#d0b088'); put(x + 2, RY1 - 1, W.l); put(x + 3, RY1 - 1, W.m); };
      jamb(cx - 16); jamb(cx + 12);
      for (const hy of [RY1, RY1 + 4]) { P.rect(cx - 12, hy, 2, 2, IR.m); put(cx - 12, hy, IR.h); put(cx - 11, hy + 1, IR.d); }
      put(cx - 10, RY1 + 4, '#8a4a2a'); put(cx - 10, RY1 + 5, '#5a3a2a'); } // 부러진 경첩 날개 · 녹
  
    // ================================================================ 3. 윗벽: 회벽 얼룩 · 천장 그늘 · 떨어진 회칠 사이 벽돌 · 기둥 나뭇결
    const WALLC = (x, y) => { const v = h2(x, y, 6); let c = v < 0.12 ? '#54463a' : v < 0.9 ? '#605242' : '#6a5a4a'; if (h2(x >> 1, y >> 1, 7) < 0.07) c = '#463a30'; return c; };
    const T = DK(P);
    const PLASTER = T.set(['#54463a', '#605242', '#6a5a4a', '#463a30']);
    // 창 · 게시판 자리를 회벽으로 다시 칠함 (기둥 포함)
    for (let y = top; y < RY0 - 2; y++) for (let x = 146; x < 229; x++) { if (y >= top + 7 && y < top + 11) continue; put(x, y, WALLC(x, y)); }
    for (const px of [162, 194, 226]) { P.rect(px, top, 5, 22, '#3a2a1e'); P.rect(px, top, 1, 22, '#4e3a2a'); P.rect(px + 4, top, 1, 22, '#24180f'); }
    T.refresh();
    // 천장 그늘 (위 3줄) · 바닥 가까이 그늘
    for (let x = RX0; x < RX1; x++) { for (let y = top; y < top + 4; y++) if (y < top + 1 || bay(x, y) < 0.7 - (y - top) * 0.22) T.on(PLASTER, x, y, '#3e3228'); for (let y = RY0 - 4; y < RY0 - 2; y++) if (y === RY0 - 3 || (x & 1)) T.on(PLASTER, x, y, '#4a3c30'); }
    // 떨어진 회칠 사이로 보이는 벽돌 (가장자리 회칠이 두꺼움)
    const brickPatch = (bx, by, w, h, seed) => { for (let y = by; y < by + h; y++) for (let x = bx; x < bx + w; x++) { const d = Math.hypot((x - bx - w / 2) / (w / 2), (y - by - h / 2) / (h / 2)) + (h2(x, y, seed) - 0.5) * 0.35; if (d > 1) continue;
        if (d > 0.82) { T.on(PLASTER, x, y, '#75664f'); continue; } const row = Math.floor((y - by) / 3), lx = (x + (row & 1 ? 3 : 0)) % 7, ly = (y - by) % 3;
        T.on(PLASTER, x, y, ly === 2 || lx === 0 ? '#3a2e26' : ly === 0 ? '#7a4e3a' : h2(Math.floor((x + (row & 1 ? 3 : 0)) / 7), row, seed) < 0.5 ? '#6a4232' : '#5e3a2c'); }
      for (let x = bx + 1; x < bx + w - 1; x++) { const y = by + h; if (h2(x, 9, seed) < 0.5) T.on(PLASTER, x, y, '#3e3228'); } };
    T.refresh(); brickPatch(116, top + 2, 12, 6, 401); brickPatch(232, top + 14, 9, 5, 402); brickPatch(276, top + 3, 8, 4, 403);
    T.refresh();
    // 금 (가지 치는 가는 선)
    for (const pts of [[[118, top + 2], [121, top + 6], [120, top + 9], [123, top + 12]], [[184, top + 13], [186, top + 16], [185, top + 19]], [[290 - 4, top + 12], [288 - 4, top + 15]]]) for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = Math.max(Math.abs(bx - ax), Math.abs(by - ay)); for (let k = 0; k <= n; k++) { const x = Math.round(ax + (bx - ax) * k / n), y = Math.round(ay + (by - ay) * k / n); T.on(PLASTER, x, y, '#3a2e26'); T.on(PLASTER, x + 1, y, '#6e604e'); } }
    // 빗물 얼룩 (위에서 흘러내린 세로 줄)
    for (const [x, n] of [[112, 12], [180, 8], [287 - 3, 9]]) for (let y = top + 1; y < top + n; y++) if ((x + y) & 1 || y < top + 4) { T.on(PLASTER, x, y, '#54463a'); if (y > top + 3 && h2(x, y, 71) < 0.5) T.on(PLASTER, x + 1, y, '#54463a'); }
    // 기둥 · 가로 들보: 나뭇결 · 옹이 · 나무못
    T.refresh();
    const POSTC = T.set(['#3a2a1e', '#4e3a2a']);
    for (let y = top; y < RY0 - 2; y++) for (let x = RX0; x < RX1; x++) { if (!POSTC.has(T.col(x, y))) continue; const vert = !(y >= top + 7 && y < top + 11);
      if (vert && T.col(x, y) === '#3a2a1e' && ((y * 3 + x * 7) % 11 === 0 || (h2(x, y >> 2, 404) < 0.12))) put(x, y, '#30221a');
      if (!vert && T.col(x, y) === '#3a2a1e' && (x * 5 + y * 3) % 13 < 3) put(x, y, '#30221a'); }
    for (const px of [98, 130, 162, 194, 226, 258]) { put(px + 2, top + 8, '#6e5a46'); put(px + 2, top + 9, '#24180f'); }
  
    // ================================================================ 4. 현상수배 게시판: 작은 지붕 · 판자 뒤판 · 종이 다섯 장 (가운데 큰 수배서 · 붉은 X)
    { const nx = 150, ny = top + 3, w = 40, h = 17;
      // 지붕 (위 처마) + 그 밑 그늘
      P.rect(nx - 4, ny - 3, w + 8, 1, K); P.rect(nx - 4, ny - 2, w + 8, 1, W.L); P.rect(nx - 4, ny - 1, w + 8, 1, W.m); P.rect(nx - 4, ny, w + 8, 1, K); put(nx - 4, ny - 2, W.l); put(nx + w + 3, ny - 1, W.D);
      for (let x = nx - 3; x < nx + w + 3; x += 6) put(x, ny - 2, W.l);
      // 틀
      P.rect(nx - 1, ny + 1, w + 2, h + 1, K); P.rect(nx, ny + 1, w, h, W.d); P.rect(nx, ny + 1, w, 1, W.l); P.rect(nx, ny + 1, 1, h, W.l); P.rect(nx + w - 1, ny + 1, 1, h, W.D); P.rect(nx, ny + h, w, 1, W.D);
      // 뒤판: 세로 판자
      for (let y = ny + 2; y < ny + h; y++) for (let x = nx + 1; x < nx + w - 1; x++) { const lx = (x - nx - 1) % 7; put(x, y, lx === 6 ? '#2e2016' : y === ny + 2 ? '#24180f' : h2(Math.floor((x - nx) / 7), y >> 2, 405) < 0.5 ? '#4a3424' : '#44301f'); }
      // 종이: 테두리 그늘 · 줄 · 핀
      const paper = (px, py, pw, ph, o = {}) => {
        for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) { if (o.torn && y >= ph - 3 && h2(x, y, px) < 0.3 + (y - ph + 3) * 0.25) continue; if (o.curl && x >= pw - 3 && y >= ph - 3 && (x - (pw - 3)) + (y - (ph - 3)) >= 2) continue;
          put(px + x, py + y, y === 0 ? '#ece0c4' : x === pw - 1 || y === ph - 1 ? '#b8a880' : (h2(px + x, py + y, 406) < 0.1 ? '#c4b490' : '#d4c4a0')); }
        if (!o.torn) { put(px + pw, py + 1, '#24180f'); for (let y = 1; y < ph; y++) put(px + pw, py + y, '#24180f'); for (let x = 1; x <= pw; x++) put(px + x, py + ph, '#24180f'); }
        if (o.curl) { put(px + pw - 3, py + ph - 1, '#f4ead4'); put(px + pw - 2, py + ph - 2, '#f4ead4'); put(px + pw - 3, py + ph - 2, '#a89870'); put(px + pw - 1, py + ph - 3, '#24180f'); }
        if (o.lines) for (let r = 0; r < o.lines; r++) P.rect(px + 1, py + 2 + r * 2, pw - 2 - ((r * 3 + px) % 3), 1, '#7a6a58');
        const pin = o.pin || '#a83030'; put(px + (pw >> 1), py, pin); put(px + (pw >> 1), py - 1, K); };
      paper(nx + 3, ny + 4, 8, 8, { lines: 3, pin: '#c8a040' });
      paper(nx + 4, ny + 13, 6, 3, { torn: 1, pin: '#8a8a94' });
      // 가운데 큰 수배서: 머리글 · 두건 쓴 얼굴 · 붉은 X · 현상금 줄
      { const px = nx + 13, py = ny + 3; paper(px, py, 13, 14, { curl: 1 });
        P.rect(px + 2, py + 2, 9, 1, '#5a4a3a'); put(px + 6, py + 2, '#d4c4a0');
        P.spr(['..ddd..', '.ddddd.', 'ddhhhdd', 'dhhhhhd', 'dhehehd', 'ddhhhdd', '.ddhdd.', 'ddddddd'], { d: '#4a3a32', h: '#8a7a68', e: '#2a1e1a' }, px + 3, py + 4, false);
        for (let i = 0; i < 7; i++) { put(px + 3 + i, py + 4 + i, '#a02020'); put(px + 9 - i, py + 4 + i, '#a02020'); if (i < 6) put(px + 4 + i, py + 4 + i, '#701414'); }
        P.rect(px + 2, py + 12, 4, 1, '#7a6a58'); put(px + 8, py + 12, '#c09038'); put(px + 9, py + 12, '#c09038'); put(px + 10, py + 12, '#8a6a28'); }
      // 오른쪽: 지도 조각 (점선 길 · 붉은 표시)
      { const px = nx + 28, py = ny + 4; paper(px, py, 9, 7, { pin: '#8a8a94' });
        for (let i = 0; i < 7; i += 2) put(px + 1 + i, py + 3 + (i % 4 ? 1 : 0), '#a03030'); put(px + 7, py + 2, '#a03030'); put(px + 6, py + 1, '#a03030'); put(px + 7, py + 1, '#5a4a3a');
        P.line(px + 1, py + 5, px + 4, py + 5, '#7a8a6a'); P.line(px + 2, py + 1, px + 3, py + 2, '#7a6a58'); }
      // 한 핀만 남아 비스듬히 매달린 쪽지: 바람에 흔들리므로 움직임(fx)에서 그림
      // 찢겨 나간 자리: 핀 + 종이 귀퉁이
      put(nx + 22, ny + 1, '#8a8a94'); put(nx + 22, ny + 2, '#d4c4a0'); put(nx + 23, ny + 2, '#b8a880'); put(nx + 21, ny + 2, '#d4c4a0');
      // 게시판 밑 그늘
      for (let x = nx - 1; x < nx + w + 2; x++) { T.on(PLASTER, x, ny + h + 2, '#3e3228'); if (x & 1) T.on(PLASTER, x + 1, ny + h + 3, '#3e3228'); } }
    // 기둥에 박은 말굽 (거꾸로 · 행운)
    { const sx = 130, sy = top + 13; P.spr(['iiiii', 'iI.Ii', 'ii.ii', 'i...i', 'H...H'], { i: IR.m, I: IR.h, H: IR.l }, sx, sy); put(sx + 1, sy + 1, IR.h); put(sx + 4, sy + 2, IR.d); put(sx + 2, sy - 1, '#6a6a78'); }
  
    // ================================================================ 5. 창: 노을 하늘 (디더 띠) · 해 · 언덕 · 깨진 유리 한 칸 · 열린 덧문 · 창턱의 마른 화분
    const WX = 196, WY = top + 3, WW = 24, WH = 14;
    { // 덧문 (왼쪽, 활짝 열림)
      for (let y = WY - 1; y < WY + WH + 1; y++) { put(WX - 9, y, K); for (let x = WX - 8; x < WX - 3; x++) put(x, y, x === WX - 8 ? W.m : x === WX - 4 ? W.D : (y - WY) % 3 === 0 ? W.D : (y - WY) % 3 === 1 ? W.l : W.w); put(WX - 3, y, K); }
      P.rect(WX - 9, WY - 2, 7, 1, K); P.rect(WX - 9, WY + WH + 1, 7, 1, K); P.rect(WX - 7, WY + 2, 3, 1, IR.m); P.rect(WX - 7, WY + WH - 3, 3, 1, IR.m);
      // 창틀
      P.rect(WX - 3, WY - 3, WW + 6, WH + 5, K); P.rect(WX - 2, WY - 2, WW + 4, WH + 3, W.m); P.rect(WX - 2, WY - 2, WW + 4, 1, W.L); P.rect(WX - 2, WY - 2, 1, WH + 3, W.l); P.rect(WX + WW + 1, WY - 1, 1, WH + 2, W.D);
      // 하늘
      const NT = window.NIGHT !== false; // v3.19 해가 뜨지 않는 세계: 밤하늘 · 달 · 별 (false면 예전 노을)
      const SKY = NT ? [[0, '#141430'], [3, '#1a1c3c'], [6, '#222448'], [9, '#2c2e56'], [12, '#3a3a64']] : [[0, '#f6d49a'], [3, '#f0b070'], [6, '#e88858'], [9, '#c86058'], [12, '#8a4058']];
      for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) { let i = 0; while (i < SKY.length - 1 && y >= SKY[i + 1][0]) i++; let c = SKY[i][1]; if (i < SKY.length - 1 && y === SKY[i + 1][0] - 1 && ((x + y) & 1)) c = SKY[i + 1][1]; if (i > 0 && y === SKY[i][0] && ((x + y) & 1) === 0 && (x & 2)) c = SKY[i - 1][1]; put(WX + x, WY + y, c); }
      // 구름 줄 · 해 · 먼 언덕 · 가까운 언덕 + 마른 나무
      if (NT) { for (let x = 1; x < 9; x++) if (x !== 5) put(WX + x, WY + 8, '#30325a'); for (let x = 15; x < 22; x++) put(WX + x, WY + 9, '#30325a'); // 옅은 구름 띠
        for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) { const d = x * x + y * y, cut = (x - 1) * (x - 1) + (y + 1) * (y + 1); if (d <= 5 && cut > 3) put(WX + 6 + x, WY + 3 + y, d <= 1 ? '#f4f0dc' : '#d8d4c0'); } // 초승달
        for (const [x, y, c] of [[2, 1, '#c8ccf0'], [10, 3, '#9aa0d0'], [15, 2, '#e8ecff'], [20, 4, '#9aa0d0'], [3, 6, '#8a90c0'], [21, 7, '#c8ccf0'], [9, 9, '#8a90c0']]) put(WX + x, WY + y, c); } // 별
      else { for (let x = 2; x < 10; x++) put(WX + x, WY + 2, '#fbe4b8'); for (let x = 14; x < 21; x++) if (x !== 17) put(WX + x, WY + 6, '#f4a878');
      for (let y = -3; y <= 0; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 9) put(WX + 7 + x, WY + 10 + y, x * x + y * y <= 3 ? '#fff4d0' : '#ffd890'); }
      for (let x = 0; x < WW; x++) { const fh = 10 + Math.round(1.5 + Math.sin(x / 3.5) * 1.2), nh = 11 + Math.round(1.6 + Math.sin(x / 2.6 + 2) * 1.4 - (x > 14 ? 1 : 0));
        for (let y = fh; y < WH; y++) put(WX + x, WY + y, NT ? '#24203c' : '#7a3a50'); for (let y = nh; y < WH; y++) put(WX + x, WY + y, NT ? '#141220' : '#3e2234'); }
      P.spr(['x.x', '.x.', 'xx.', '.x.', '.x.'], { x: NT ? '#141220' : '#3e2234' }, WX + 18, WY + 6, false);
      // 유리 때: 모서리마다 뿌연 얼룩
      for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) { const ex = Math.min(x, WW - 1 - x, Math.abs(x - 11.5) - 1), ey = Math.min(y, WH - 1 - y, Math.abs(y - 6) - 0.5), e = Math.min(ex, ey); if (x >= 13 && y < 6) continue; if (e < 1.5 && bay(x, y) < 0.35) { const [r, g, b] = rgbOf(SKY[0][1]); put(WX + x, WY + y, NT ? ((y > 9) ? '#1c1a2c' : '#2c2e52') : (y > 9) ? '#5a3040' : toHex(r * 0.82, g * 0.7, b * 0.6)); } }
      // 깨진 칸 (오른쪽 위): 맑게 뚫리고 가장자리에 날카로운 유리 조각만 남음
      P.spr(['bbbbb.....', 'bbb.......', 'bb........', 'b.........', 'bb........', 'b.........'], { b: NT ? '#4c5284' : '#fff0d0' }, WX + 13, WY, false);
      P.spr(['....bb', '.....b', '......', '......', '.....b', '....bb'], { b: NT ? '#4c5284' : '#fff0d0' }, WX + 18, WY, false);
      put(WX + 14, WY + 1, NT ? '#5a6088' : '#c08060'); put(WX + 22, WY + 5, NT ? '#5a6088' : '#c08060');
      // 창살 (십자)
      P.rect(WX + 11, WY, 2, WH, W.D); put(WX + 11, WY, W.l); for (let y = 1; y < WH; y++) put(WX + 11, WY + y, W.m); P.rect(WX, WY + 6, WW, 1, W.D); P.rect(WX, WY + 6, 11, 1, W.m); P.rect(WX + 13, WY + 6, 11, 1, W.m); P.rect(WX, WY + 7, WW, 1, NT ? '#24223a' : '#5a2a30');
      // 오른쪽: 떨어져 나간 덧문 — 경첩에 걸린 판자 조각만
      P.rect(WX + WW + 2, WY + 1, 2, 2, IR.m); put(WX + WW + 2, WY + 1, IR.h); // 판자 조각은 바람에 흔들리므로 움직임(fx)에서 그림
      // 창턱 (앞으로 튀어나옴) + 마른 화분
      P.rect(WX - 4, WY + WH + 1, WW + 8, 1, K); P.rect(WX - 4, WY + WH + 2, WW + 8, 1, W.H); P.rect(WX - 4, WY + WH + 3, WW + 8, 1, W.w); P.rect(WX - 4, WY + WH + 4, WW + 8, 1, K);
      for (let x = WX - 3; x < WX + WW + 4; x++) if (x & 1) T.on(PLASTER, x, WY + WH + 5, '#3e3228');
      P.spr(['.y..y', '..yy.', '.y.y.', 'kkkkk', 'pPPpq', '.pPq.'], { y: '#6a5a3a', k: K, p: '#9a5a3a', P: '#b8704a', q: '#6a3a26' }, WX + 17, WY + WH - 4); }
  
    // 기둥에 꽂힌 투척 단검 두 자루
    P.spr(['s..', '.s.', '..h', '..H'], { s: '#c8ccd4', h: '#2a1e14', H: '#5a4230' }, 227, top + 12, false); P.spr(['s..', '.s.', '..h', '..H'], { s: '#c8ccd4', h: '#2a1e14', H: '#5a4230' }, 228, top + 16, false);
    // ================================================================ 6. 걸린 등불: 벽 까치발 · 사슬 · 쇠 갓 · 유리 안 불꽃
    const LX = 140, LY = top + 7;
    { P.rect(134, top + 3, 8, 1, K); P.rect(134, top + 2, 1, 3, K); P.rect(135, top + 2, 6, 1, IR.m); put(135, top + 4, IR.d); P.line(135, top + 4, 137, top + 2, IR.d);
      put(LX, top + 3, IR.d); put(LX, top + 4, IR.l); put(LX, top + 5, IR.d); put(LX, top + 6, IR.l);
      P.spr(['..kkk..', '.kmmmk.', 'kmhhhmk', 'kgYyYgk', 'kgyFygk', 'kgYyYgk', 'kmhhhmk', '.kmmmk.', '..k.k..'], { k: K, m: IR.m, h: IR.l, g: '#e0a040', y: '#ffd060', Y: '#ffb040', F: '#fff4c0' }, LX - 3, LY, false); }
  
    // ================================================================ 7. 다락: 넓은 판자 · 앞 들보(장선 끝 마구리) · 기둥 + 까치발 · 사다리 · 짚단 잠자리 · 활 · 화살통 · 상자
    const LW = 56, LH = 30;
    { const PL2 = { a: '#6a4c38', b: '#62452f', c: '#5a3e2a', gap: '#2e1e12', hi: '#765840', nail: '#9a8a7a', grain: '#4a3424' };
      const G2 = Grid(); planksW(G2, RX0, RY0 - 2, RX0 + LW, RY0 + LH, PL2, 23); const gd = G2.g.getImageData(0, 0, GW, GH).data;
      for (let y = RY0 - 2; y < RY0 + LH; y++) for (let x = RX0; x < RX0 + LW; x++) { const i = (y * GW + x) * 4; put(x, y, toHex(gd[i], gd[i + 1], gd[i + 2])); }
      for (let y = RY0 - 2; y < RY0 + 3; y++) for (let x = RX0; x < RX0 + LW; x++) if (y < RY0 || bay(x, y) < 0.6 - (y - RY0) * 0.2) put(x, y, '#3a2a1e');
      // 앞 가장자리 밝은 모서리
      P.rect(RX0, RY0 + LH - 1, LW, 1, '#8e6e50');
      // 앞 들보: 나뭇결 + 장선 마구리 (네모 단면 · 나이테 점)
      P.rect(RX0, RY0 + LH, LW, 6, W.w); P.rect(RX0, RY0 + LH, LW, 1, W.l); P.rect(RX0, RY0 + LH + 5, LW, 1, W.D); P.rect(RX0, RY0 + LH + 6, LW + 1, 1, K);
      for (let x = RX0; x < RX0 + LW; x++) { if ((x * 7) % 11 < 3) put(x, RY0 + LH + 2, W.d); if ((x * 5 + 3) % 13 < 3) put(x, RY0 + LH + 4, W.d); }
      for (let x = RX0 + 4; x < RX0 + LW - 3; x += 9) { P.rect(x, RY0 + LH + 1, 4, 4, '#7e5e44'); P.rect(x, RY0 + LH + 1, 4, 1, '#9a7a5a'); put(x + 3, RY0 + LH + 4, W.d); put(x + 1, RY0 + LH + 2, W.d); put(x + 2, RY0 + LH + 3, '#9a7a5a'); put(x - 1, RY0 + LH + 1, K); put(x + 4, RY0 + LH + 4, K); }
      P.rect(RX0 + LW, RY0 - 2, 1, LH + 9, K); P.rect(RX0 + LW - 1, RY0 - 2, 1, LH + 1, '#4a3424');
      // 기둥 + 까치발
      const lpost = (px) => { P.rect(px - 1, RY0 + LH + 7, 6, 13, K); P.rect(px, RY0 + LH + 7, 1, 12, W.l); P.rect(px + 1, RY0 + LH + 7, 2, 12, W.w); P.rect(px + 3, RY0 + LH + 7, 1, 12, W.D); for (let y = RY0 + LH + 8; y < RY0 + LH + 19; y += 4) put(px + 2, y, W.d); P.rect(px - 1, RY0 + LH + 19, 6, 1, K); };
      lpost(RX0 + 5); lpost(RX0 + LW - 8);
      const brace = (x0, dir) => { for (let i = 0; i < 6; i++) { const x = x0 + dir * i, y = RY0 + LH + 12 - i; put(x, y, W.l); put(x, y + 1, W.D); put(x, y - 1, K); put(x, y + 2, K); } };
      brace(RX0 + 10, 1); brace(RX0 + LW - 10, -1);
      // 왼쪽 기둥에 감아 건 밧줄 고리
      // 사다리: 기울어진 두 기둥 · 가로대 윗면 밝음 · 위쪽 끝이 들보 위로 걸침
      { const lx = RX0 + 36, y0 = RY0 + LH - 5, y1 = RY0 + LH + 24;
        for (let y = y0; y < y1; y++) { const s = Math.floor((y - y0) / 14); for (const rx of [lx - s, lx + 9 + s]) { put(rx - 1, y, K); put(rx, y, '#9a7a5a'); put(rx + 1, y, W.w); put(rx + 2, y, K); } }
        for (let y = y0 + 3; y < y1 - 1; y += 5) { const s = Math.floor((y - y0) / 14), a = lx + 2 - s + 1, b = lx + 9 + s - 1; P.rect(a - 1, y - 1, b - a + 2, 1, K); P.rect(a - 1, y, b - a + 2, 1, '#a8885e'); P.rect(a - 1, y + 1, b - a + 2, 1, W.d); P.rect(a - 1, y + 2, b - a + 2, 1, K); }
        for (const rx of [lx - 2, lx + 11]) { P.rect(rx - 1, y1, 4, 1, K); } }
      // 이부자리: 짚 요 (줄무늬 거친 천 · 누빈 매듭 · 두께) + 베개 + 걷어찬 털 담요 (귀퉁이가 뒤집혀 안감 · 주름 · 요 밖으로 흘러내린 자락)
      { const bx = RX0 + 5, by = RY0 + 7, bw = 28, bh = 12;
        // 요 둘레로 삐져나온 짚
        for (let k = 0; k < 16; k++) { const side = k % 4, t2 = h2(k, 1, 503); let x, y;
          if (side === 0) { x = bx + Math.floor(t2 * bw); y = by - 1; } else if (side === 1) { x = bx + Math.floor(t2 * bw); y = by + bh + 2; } else if (side === 2) { x = bx - 1; y = by + Math.floor(t2 * bh); } else { x = bx + bw; y = by + Math.floor(t2 * bh); }
          const dx = side === 2 ? -1 : side === 3 ? 1 : (k & 1 ? 1 : -1), dy = side === 0 ? -1 : side === 1 ? 1 : 0; put(x + dx, y + dy, '#b09a5e'); put(x + dx * 2, y + dy * 2 + (side > 1 ? (k & 1) : 0), '#8a7646'); }
        // 요
        { const M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c);
          for (let y = by; y < by + bh + 2; y++) for (let x = bx; x < bx + bw; x++) { const corner = (x === bx || x === bx + bw - 1) && (y === by || y === by + bh + 1); if (corner) continue; let c;
            if (y >= by + bh) c = y === by + bh ? '#5e5040' : '#4a3e30'; // 앞 두께
            else { c = (x - bx) % 4 === 3 ? '#7a6a54' : '#8a7a62'; if (y === by || x === bx) c = '#a8987a'; else if (x === bx + bw - 1 || y === by + bh - 1) c = '#6e5e4a'; if ((x - bx) % 6 === 3 && (y - by) % 5 === 3) c = '#5a4a3a'; }
            set(x, y, c); }
          blit(M); }
        // 베개: 머리 자국으로 가운데가 꺼짐 · 살짝 비뚤어짐
        { const M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c), px = bx + 1, py = by + 1;
          for (let j = 0; j < 9; j++) for (let i = 0; i < 8; i++) { if ((i === 0 || i === 7) && (j === 0 || j === 8)) continue; const X = px + i + (j < 3 ? 1 : 0), Y = py + j;
            let c = j === 0 || i === 0 ? '#d4c8aa' : i === 7 || j === 8 ? '#8a7e66' : '#b4a688'; if (i >= 2 && i <= 5 && j >= 3 && j <= 5) c = j === 3 ? '#8e8268' : '#a09276'; set(X, Y, c); }
          blit(M); }
        // 담요
        { const M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c), x0 = bx + 10, x1 = bx + bw - 5, y0 = by + 2, y1 = by + bh;
          const k = (x, y) => (x - x0) + (y - y0) * 1.25; // 뒤집힌 귀퉁이 대각선
          for (let y = y0; y <= y1 + 3; y++) for (let x = x0; x <= x1 + 1; x++) {
            const drape = y > y1 ? x >= x1 - 5 && x <= x1 + 1 - (y - y1 - 1) * 0 && x >= x1 - 5 + (y - y1) : true; if (!drape) continue; // 오른쪽 아래로 흘러내린 자락
            if (y > y1 && (x > x1 || x < x1 - 5 + (y - y1))) continue;
            if (x > x1 && y < y0 + 3) continue;
            const kk = k(x, y); if (kk < 6) continue;
            let c;
            if (kk < 10) c = kk < 7 ? '#dcac8a' : kk >= 9 ? '#4a2018' : '#c09070'; // 뒤집힌 안감 (바깥 모서리 밝음 · 접힌 금 어둠)
            else if (y >= by + bh - 0) c = (x + y) % 3 ? '#5e2a22' : '#4a2018'; // 요 앞으로 늘어진 부분 (그늘)
            else { const e = Math.min(x - x0, x1 - x, y - y0, by + bh - 1 - y) + (x > x1 - 6 && y > by + bh - 4 ? 3 : 0); c = e <= 1 ? '#5e2a22' : '#7a3e30';
              if (e === 2 && (x + y) % 2 === 0) c = '#a87a5a'; // 테두리 바느질
              const w1 = Math.abs(kk - 14), w2 = Math.abs(kk - 20 + Math.sin(y) * 0.8); if (e > 1) { if (w1 < 0.7 || w2 < 0.7) c = '#4e2219'; else if ((kk > 12.6 && kk < 13.3) || (kk > 18.6 && kk < 19.3)) c = '#9a5844'; else if (h2(x, y, 504) < 0.12) c = '#84463a'; } }
            set(x, y, c); }
          blit(M); }
        // 담요 위 짚 두 가닥
        for (const [x, y] of [[bx + 20, by + 3], [bx + 26, by + 8]]) { put(x, y, '#b09a5e'); put(x + 1, y - 1, '#8a7646'); } }
      // 활 (벽 나무못에 걸림) + 화살통 (벽에 기댐)
      { const bxx = RX0 + 10; for (let i = 0; i <= 18; i++) { const y = top + 3 + i, x = bxx + Math.round(Math.sin(i / 18 * Math.PI) * 4); put(x, y, i % 6 === 0 ? '#c8a878' : '#8a6438'); put(x + 1, y, '#5a3e22'); put(x - 1, y, K); }
        for (let i = 1; i < 18; i++) put(bxx - 1, top + 3 + i, '#a8a090'); P.rect(bxx + 3, top + 11, 2, 3, '#4a2e1a'); put(bxx + 3, top + 11, '#7a5030'); put(bxx + 1, top + 1, W.D); put(bxx + 1, top + 2, K); }
      { const qx = RX0 + 34, qy = RY0 - 8; // 화살통: 다락 바닥 뒤쪽, 벽에 기댐
        P.spr(['f.f.f', 'fsfsf', '.sss.', 'kkkkk', 'qQqqd', 'qQqqd', 'qbbbd', 'qQqqd', 'qQqqd', '.qqd.'], { f: '#c8c0b0', s: '#6a5a4a', k: K, q: '#6a4430', Q: '#8a5a3e', d: '#3e2618', b: '#c09038' }, qx, qy);
        for (let x = qx; x < qx + 6; x++) if (x & 1) put(x, qy + 11, '#3a2a1e'); }
      // 상자 (다락 오른쪽 끝)
      crateBox(RX0 + 41, RY0 + 2, 11, 3, 7, 0);
      P.spr(['.y.', '.Y.', 'www', 'wWw'], { y: '#ffd34d', Y: '#ff9a3a', w: '#e8dcc0', W: '#bfb090' }, RX0 + 45, RY0 - 2); }
  
    // ================================================================ 8. 소품 그리기 함수
    function crateBox(x, y, w, th, fh, o = {}) { // 위면 th줄 + 앞면 fh줄 (외곽선 포함 바깥 1칸)
      const H0 = th + fh; P.rect(x - 1, y - 1, w + 2, H0 + 2, K);
      for (let yy = 0; yy < th; yy++) for (let xx = 0; xx < w; xx++) put(x + xx, y + yy, yy === 0 ? W.H : xx === 0 || xx === w - 1 ? W.L : (yy === th - 1 ? W.l : (xx % 5 === 4 ? W.l : W.L)));
      P.rect(x, y + th, w, 1, W.D);
      for (let yy = th + 1; yy < H0; yy++) for (let xx = 0; xx < w; xx++) { const fy = yy - th - 1, frame = xx < 2 || xx >= w - 2 || fy === 0 || yy === H0 - 1; let c;
        if (frame) c = xx === 0 || fy === 0 ? W.l : xx === w - 1 || yy === H0 - 1 ? W.d : W.m; else c = (fy % 3 === 2) ? W.d : h2(x + xx, y + yy, 601) < 0.15 ? W.d : W.w; put(x + xx, y + yy, c); }
      // 대각 버팀목
      if (o.brace !== false) { const n = w - 4, fh2 = fh - 3; for (let i = 0; i < n; i++) { const yy = y + th + 1 + 1 + Math.round(fh2 - 1 - i * (fh2 - 1) / Math.max(1, n - 1)); put(x + 2 + i, yy, W.l); put(x + 2 + i, yy + 1, W.D); } }
      // 못
      for (const [xx, yy] of [[0, th + 1], [w - 1, th + 1], [0, H0 - 1], [w - 1, H0 - 1]]) put(x + xx + (xx ? -0 : 0), y + yy, '#a8a8b0');
      // 찍힌 낙인: 말굽 표시
      if (o.mark) { const mx = x + (w >> 1) - 2, my = y + th + 2; P.spr(['.bbbb.', 'b.bb.b', 'b....b', 'b....b'], { b: '#a8885a' }, mx - 1, my + 2, false); }
    }
    // 모양 칠하기: 칸 → 색 지도를 만들고, 바깥 둘레에 외곽선 한 줄
    function blit(M, outline = true) { const key = (x, y) => x + ',' + y; if (outline) for (const k of M.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!M.has(key(x + dx, y + dy))) put(x + dx, y + dy, K); }
      for (const [k, c] of M) { const [x, y] = k.split(',').map(Number); put(x, y, c); } }
    function barrelUp(cxB, by, w, h, seed) { // 선 통: 위아래 둥근 테 · 배 불룩 · 통널 두 줄 · 쇠테 두 줄 · 판자 뚜껑
      const M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c), x0 = Math.round(cxB - w / 2), yT = by - h, ry = 2.4;
      const e = i => Math.round(ry * Math.sqrt(Math.max(0, 1 - (((i + 0.5) / w) * 2 - 1) ** 2)));
      const SH = ['d', 'l', 'L', 'H', 'H', 'L', 'L', 'l', 'l', 'm', 'w', 'd', 'D'], sh = i => SH[Math.min(SH.length - 1, Math.max(0, Math.round(i / (w - 1) * (SH.length - 1))))];
      const darker = { H: 'L', L: 'l', l: 'm', m: 'w', w: 'd', d: 'D', D: 's' };
      for (let i = 0; i < w; i++) { const y0 = yT + e(i) + 1, y1 = by + e(i);
        for (let y = y0; y <= y1; y++) { const r = y - y0, n = y1 - y0; let c = W[sh(i)];
          if ((i === Math.round(w / 3) || i === Math.round(w * 2 / 3)) && r > 2 && r < n - 2) c = W[darker[sh(i)]];
          if (r === 1 || r === 2 || r === n - 2 || r === n - 1) { const s2 = sh(i); c = s2 === 'H' || s2 === 'L' ? (r === 1 || r === n - 2 ? IR.h : IR.l) : s2 === 'l' ? IR.l : s2 === 'm' || s2 === 'w' ? IR.m : IR.d; if (r === 2 || r === n - 1) c = s2 === 'H' ? IR.l : s2 === 'D' || s2 === 'd' ? '#2a2a3a' : IR.m; }
          set(x0 + i, y, c); } }
      // 배 불룩: 가운데 줄에서 양옆 한 칸씩
      for (let y = yT + 5; y <= by - 2; y++) { set(x0 - 1, y, W.d); set(x0 + w, y, W.s); }
      // 뚜껑
      for (let i = 0; i < w; i++) { const k = e(i); for (let y = yT - k; y <= yT + k; y++) { const edge = y === yT - k || y === yT + k || i === 0 || i === w - 1, inner = y === yT - k + 1 || i === 1 || i === w - 2 || y === yT + k - 1;
        let c = edge ? (y === yT + k ? W.d : W.m) : inner ? (y < yT ? W.D : W.d) : (i === Math.round(w / 2) ? W.l : (y < yT && i < w / 2 ? W.H : W.L)); set(x0 + i, y, c); } }
      set(x0 + Math.round(w * 0.7), yT, W.D); // 마개 구멍
      blit(M);
      if (h2(seed, 1, 602) < 0.6) put(x0 + 3, yT - 1, '#c8c0b4'); }
    function barrelSide(x, y, len, h) { // 누운 통: 몸통은 왼쪽으로 · 오른쪽 둥근 머리판 (판자 · 테)
      const M = new Map(), set = (X, Y, c) => M.set(X + ',' + Y, c), rx = 2.6, xe = x + len;
      const e = j => Math.round(rx * Math.sqrt(Math.max(0, 1 - (((j + 0.5) / h) * 2 - 1) ** 2)));
      const SHV = ['l', 'L', 'H', 'L', 'l', 'm', 'w', 'd', 'D'], sv = j => SHV[Math.min(SHV.length - 1, Math.round(j / (h - 1) * (SHV.length - 1)))];
      for (let j = 0; j < h; j++) { const s2 = sv(j); for (let X = x - e(j); X <= xe; X++) { let c = W[s2]; if (j === Math.round(h / 3) || j === Math.round(h * 2 / 3)) c = W[{ H: 'L', L: 'l', l: 'm', m: 'w', w: 'd', d: 'D', D: 's' }[s2]];
          for (const hx2 of [x + 2, xe - 4]) if (X === hx2 + e(j) || X === hx2 + e(j) + 1) c = s2 === 'H' || s2 === 'L' ? IR.h : s2 === 'l' ? IR.l : s2 === 'D' || s2 === 'd' ? '#2a2a3a' : IR.m;
          set(X, y + j, c); } }
      for (let X = x + 2; X <= xe - 3; X++) { set(X, y - 1, W.l); set(X, y + h, W.D); }
      // 머리판
      for (let j = 0; j < h; j++) { const k = e(j); for (let X = xe - k; X <= xe + k; X++) { const edge = X === xe - k || X === xe + k || j === 0 || j === h - 1; set(X, y + j, edge ? (X === xe + k || j === h - 1 ? IR.d : IR.m) : (X - xe) % 2 === 0 ? W.l : (j < h / 2 ? W.H : W.L)); } }
      set(xe, y + (h >> 1), W.D); blit(M); }
    function sack(x, y) { P.spr(['...tt...', '..tTTt..', '...rr...', '.ssssss.', 'sSsssssd', 'sSssSssd', 'sSsssssd', 'sSssssdd', 'ssssssdd', '.sssddd.'], { t: '#a8905e', T: '#c8b07a', r: '#6a5030', s: '#8a7448', S: '#a8905e', d: '#5e4c2e' }, x, y); for (const [a, b] of [[3, 5], [5, 7], [2, 8]]) put(x + a, y + b, '#6e5a36'); }
    function stool(sx, fy) { P.spr(STOOL, STOOL_PAL, sx - 4, fy - 10, false); } // 선 의자: 둥근 앉는 판 + 벌어진 세 다리 + 가로대
    function table(tx, ty) { // 둥근 탁자: 판자 윗판 (테두리 밝음) + 두께 두 줄 + 굵은 기둥 · 네 발
      const SP = [13, 19, 23, 25, 27, 27, 27, 25, 23, 19, 13], y0 = ty - 5;
      const inT = (x, y, d) => { const r = y - d - y0; return r >= 0 && r < SP.length && Math.abs(x - tx) <= (SP[r] - 1) / 2; };
      const PM = new Map(); for (let y = ty + 5; y < ty + 11; y++) { PM.set((tx - 2) + ',' + y, W.l); PM.set((tx - 1) + ',' + y, W.m); PM.set(tx + ',' + y, W.m); PM.set((tx + 1) + ',' + y, W.D); }
      for (let x = tx - 5; x <= tx + 5; x++) { PM.set(x + ',' + (ty + 10), Math.abs(x - tx) > 3 ? (x < tx ? W.l : W.d) : W.m); PM.set(x + ',' + (ty + 11), x < tx - 2 ? W.m : W.D); } blit(PM);
      const M = new Map();
      for (let y = y0 - 1; y <= y0 + 13; y++) for (let x = tx - 14; x <= tx + 14; x++) {
        if (inT(x, y, 0)) { const r = y - y0, seam = r % 4 === 3, edgeTL = !inT(x, y - 1, 0) || !inT(x - 1, y, 0), edgeBR = !inT(x, y + 1, 0) || !inT(x + 1, y, 0);
          let c = seam ? W.l : (Math.floor(r / 4) & 1 ? W.L : '#a07c58'); if (!seam && h2(x >> 1, y, 603) < 0.08) c = W.l;
          if (edgeTL && x <= tx + 4 && y <= ty) c = W.H; else if (edgeBR && (x >= tx - 4 || y > ty)) c = W.l; M.set(x + ',' + y, c); }
        else if (inT(x, y, 1)) M.set(x + ',' + y, x < tx - 8 ? W.l : x < tx + 5 ? W.m : x < tx + 10 ? W.w : W.d);
        else if (inT(x, y, 2)) M.set(x + ',' + y, x < tx - 8 ? W.w : W.D); }
      blit(M);
      P.line(tx + 3, ty - 3, tx + 6, ty - 2, W.m); put(tx - 9, ty + 2, W.m); put(tx - 8, ty + 2, W.m);
      for (let a = 0; a < 10; a++) put(tx - 6 + Math.round(Math.cos(a / 10 * Math.PI * 2) * 2.4), ty - 1 + Math.round(Math.sin(a / 10 * Math.PI * 2) * 1.2), W.l); }
    const STOOL = ['..kkkkk..', '.kHHLLlk.', 'kHLLLllmk', 'kLlllmmdk', 'kmmmmmddk', '.kdDDDdk.', '.klk.kdk.', '.klkmkdk.', 'kllmmmmdk', 'klk...kdk', 'kk.....kk'];
    const STOOL_PAL = { k: K, H: W.H, L: W.L, l: W.l, m: W.m, d: W.d, D: W.D };
    function stoolTipped(x, y) { // 쓰러진 의자: 선 의자와 같은 그림을 옆으로 눕힘 (앉는 판이 왼쪽 · 다리가 오른쪽)
      const T = STOOL[0].split('').map((_, i) => STOOL.map(r => r[i]).join('')); P.spr(T, STOOL_PAL, x, y, false); }
    function coil(x, y) { // 밧줄 뭉치 (위에서 본 고리)
      for (let yy = -3; yy <= 3; yy++) for (let xx = -5; xx <= 5; xx++) { const q = (xx / 5) ** 2 + (yy / 2.6) ** 2, qi = (xx / 2) ** 2 + (yy / 1) ** 2; if (q > 1.15) continue;
        put(x + xx, y + yy, q > 0.95 ? K : qi <= 1 ? '#2a2216' : (Math.round(Math.hypot(xx / 2.5, yy / 1.3) * 2) % 2 ? '#7a6a40' : (yy < 0 ? '#b8a06a' : '#9a8456'))); } }
    // ================================================================ 9. 소품 배치
    // 뒤 의자 (탁자보다 먼저)
    stool(196, 100);
    table(188, 104);
    // 탁자 위: 수배서를 꿰뚫은 단검 · 넘어진 술병 (탁자 끝으로 방울) · 맥주잔 · 동전 · 카드
    { const tx = 188, ty = 104;
      // 수배서 한 장 (그림자 · 접힌 자국) + 그 한가운데를 꿰뚫은 단검
      P.spr(['ppppppp', 'pPPPPPp', 'pPrPPrp', 'pPPrrPp', 'pPrPPrp', 'qqqqqqq'], { p: '#d4c4a0', P: '#c4b490', r: '#a02020', q: '#a89870' }, tx - 4, ty - 2, false);
      for (let i = 0; i < 7; i++) put(tx - 3 + i, ty + 4, '#5e4430'); put(tx + 3, ty - 1, '#5e4430');
      P.spr(['.h.', 'hHh', '.g.', '.s.', '.S.'], { h: '#2a1e14', H: '#5a4230', g: '#c8a040', s: '#d8dce4', S: '#8a8e98' }, tx - 1, ty - 6);
      // 맥주잔 (거품 마름) · 동전 셋
      P.spr(['.kkkk..', 'keEEekh', 'kmMMmkh', 'kmMMmk.', '.kkkk..'], { k: window.DEOUT !== false ? '#3e2a1c' : K, e: '#bfb090', E: '#d8ccb0', m: '#6e5038', M: '#8e6e50', h: '#4e3626' }, tx + 5, ty - 4, false); // v3.19 외곽선 기준: 탁자 위 잔은 검은 선 대신 어두운 나무색 테
      for (const [x, y] of [[tx - 9, ty], [tx - 7, ty + 1], [tx - 8, ty - 2]]) { put(x, y, '#e0b040'); put(x + 1, y, '#9a7028'); } }
    // 왼쪽 의자 · 쓰러진 의자
    stool(171, 118);
    stoolTipped(214, 123);
    P.spr(['..ggggc', 'gGGGggn', '.ggddd.'], { g: '#2e5a3a', G: '#5a9a6a', d: '#1e3a26', c: '#b08a5a', n: '#2e5a3a' }, 205, 129); // 넘어진 술병
    for (const [x, y, c] of [[214, 133, '#8ab09a'], [216, 132, '#5a9a6a'], [212, 134, '#2e5a3a']]) put(x, y, c);
    // 출장 비스트로 소품 그대로 (술통 · 볏짚 포대)
    const BIS_BARREL = {"rows": ["....kkkkkkkk....", "..kkTTTTTTTTkk..", ".kUTAATTTTTTUDk.", ".kUTTTTUTTTUUDk.", ".kDUUUUUUUUUUEk.", "kJIIIIIIIIJJJLLk", "kLJJJJJJJJJJLLLk", "kCBABCBBBCCCEDEk", "kCBAACBBBCCDEDEk", "kCBABCBBBCCCEDEk", "kCBAACBBBCCDEDEk", "kJIIIIIIIIJJJLLk", "kLJJJJJJJJJJLLLk", ".kBABCBBBCCCEDk.", ".kDDDDDDDDDDEEk.", "..kkkkkkkkkkkk.."], "pal": {"k": "#0b0a0e", "A": "#fde2b4", "T": "#e8b47a", "U": "#c48a52", "B": "#d99c62", "C": "#b47640", "D": "#8e5a2c", "E": "#663c1a", "I": "#f4f6fa", "J": "#b4bac6", "L": "#747a88"}}, BIS_SACK = {"rows": ["...kkkkkkkkkk...........", "..kCECCECCEDDk..........", "..kADBBDBBDCDk..........", "..kAABCCBCCCEk..........", "..kAABBBBBCCDk..........", ".kAABBBBBCBCCDk.........", ".kABCBBBBCDCCDk.........", ".kAABBBBBCkkkkkkkkkkk...", ".kAABBBBBkAAABBBBBCCCk..", ".kAABBCCBkBBBBBBBBCCCk..", ".kAABBBBBkDEEEEEEEEEDk..", "..kAABBBBkAABBBBBBCCCDk.", "..kAABBBBkAABBBBBCBCCDk.", "..kCCCCCCkAABBBBBBCCCDk.", "...kkkkkkkCCCCCCCCDDDDk.", "..........kkkkkkkkkkkk..", "........................"], "pal": {"k": "#0b0a0e", "A": "#f2dc9c", "B": "#dfc27a", "C": "#c6a45c", "D": "#a08040", "E": "#7c6030"}};
    // 역참 조명에 맞춰 보정: 밝기 낮추고 채도 살짝 빼고 그늘 쪽으로 따뜻하게
    const dim = c => { if (c === K) return c; const [r, g, b] = rgbOf(c), l = (r + g + b) / 3, k = 0.62; return toHex((r * 0.8 + l * 0.2) * k + 12, (g * 0.8 + l * 0.2) * k + 2, (b * 0.8 + l * 0.2) * k - 6); };
    const bis = (S, x, y) => P.spr(S.rows, Object.fromEntries(Object.entries(S.pal).map(([a, c]) => [a, dim(c)])), x, y, false);
    // 통 무더기 (아래 왼쪽): 뒤 술통 · 포대 두 자루 · 앞 술통
    bis(BIS_BARREL, 101, 124);
    bis(BIS_SACK, 113, 131);
    bis(BIS_BARREL, 98, 141);
    // 바닥에 꽂힌 화살 (카운터 쪽을 향해 쏜 한 발)
    { const ax = 242, ay = 99; P.line(ax - 1, ay + 1, ax + 3, ay + 1, '#2a1a10'); for (let i = 0; i < 6; i++) { put(ax - i, ay - i, '#8a6438'); put(ax - i + 1, ay - i, K); }
      put(ax - 6, ay - 6, '#c8c0b0'); put(ax - 7, ay - 6, '#e8e0d0'); put(ax - 6, ay - 7, '#e8e0d0'); put(ax - 5, ay - 6, '#a83030'); put(ax - 6, ay - 5, '#a83030'); put(ax, ay, '#2a1a10'); put(ax + 1, ay, '#c8a878'); }
    // 상자 무더기 (아래 오른쪽): 큰 상자 위 작은 상자 · 옆 상자 · 밧줄 뭉치 · 자루
    crateBox(258, 139, 16, 4, 14, { mark: 1, brace: false });
    crateBox(261, 128, 11, 3, 9, {});
    crateBox(275, 148, 11, 3, 9, {});
    coil(280, 147);
  
    // ================================================================ 10. 빛: 창 노을 (벽 후광 · 바닥에 맺힌 창 모양 빛 · 창살 그림자) · 등불 후광 — 디더 글로우
    { const D = P.g.getImageData(0, 0, GW, GH).data;
      const lighten = (x, y, tint, k) => { const i = (y * GW + x) * 4, r = D[i], g = D[i + 1], b = D[i + 2]; put(x, y, toHex(r + (tint[0] - r) * k + 16 * k, g + (tint[1] - g) * k + 16 * k, b + (tint[2] - b) * k + 16 * k)); };
      const glowAt = (x, y, lv, tint) => { if (x < 0 || y < 0 || x >= GW || y >= GH) return; if (lv < bay(x, y) * 0.9) return; lighten(x, y, tint, lv > 0.72 ? 0.5 : lv > 0.45 ? 0.34 : 0.2); };
      const NT = window.NIGHT !== false, SUN = rgbOf(NT ? '#7080b0' : '#f0a070'), SUN2 = rgbOf(NT ? '#8a98c8' : '#f8c088'), LAMP = rgbOf('#f0b050'); // v3.19 밤: 창빛은 푸른 달빛
      const skip = (x, y) => x >= WX - 3 && x < WX + WW + 3 && y >= WY - 3 && y < WY + WH + 2; // 창 안쪽은 빼기
      // 창 둘레 벽 후광
      for (let y = top; y < RY0 - 2; y++) for (let x = WX - 20; x <= WX + WW + 20; x++) { if (skip(x, y)) continue; const d = Math.hypot((x - WX - WW / 2) / 26, (y - WY - WH / 2) / 15); if (d < 1) glowAt(x, y, (1 - d) * 0.6, SUN); }
      // 바닥에 맺힌 창 모양 빛: 창에서 비스듬히 앞 · 왼쪽으로 늘어남, 십자 창살 그림자
      const y0 = RY0 + 4, y1 = RY0 + 34;
      for (let y = y0; y <= y1; y++) { const t = (y - y0) / (y1 - y0), xl = WX + 1 - t * 20, xr = WX + WW - 1 - t * 15, xm = (xl + xr) / 2, ym = y0 + (y1 - y0) * 0.47;
        for (let x = Math.floor(xl - 2); x <= xr + 2; x++) { if (x >= 229 && y < RY0 + 23) continue; const e = Math.min(x - xl, xr - x); if (e < -1.5) continue; if (Math.abs(x - xm) < 1.2 || Math.abs(y - ym) < 1.3) continue;
          const fall = 0.6 - t * 0.32, lv = e < 2.5 ? fall * Math.max(0.15, (e + 1.5) / 4) : fall; glowAt(x, y, lv, t < 0.5 ? SUN2 : SUN); } }
      // 공기 중 빛줄기 (아주 옅게): 창 밑 → 빛 자리
      for (let y = WY + WH + 5; y < y0; y++) { const t = (y - WY - WH - 5) / Math.max(1, y0 - WY - WH - 5); for (let x = WX; x < WX + WW; x++) if (!skip(x, y)) glowAt(x, y, 0.2 - t * 0.06, SUN2); }
      // 등불 후광 (벽 · 다락 앞 들보)
      for (let y = top; y < RY0 + 6; y++) for (let x = LX - 16; x <= LX + 16; x++) { if (x >= LX - 3 && x <= LX + 3 && y >= LY && y < LY + 9) continue; if (x >= 146 && y < top + 22 && y > top) continue; const d = Math.hypot((x - LX) / 15, (y - LY - 4) / 12); if (d < 1) glowAt(x, y, (1 - d) * 0.75, LAMP); }
      // 카운터 위 초 (작은 후광)
      for (let y = RY0 - 6; y < RY0 + 8; y++) for (let x = 272; x < 288; x++) { const d = Math.hypot((x - 281) / 8, (y - RY0 - 1) / 6); if (d < 1) glowAt(x, y, (1 - d) * 0.6, LAMP); } }
  
    // 거미줄 (오른쪽 위 모서리 · 다락 기둥 · 창 위)
    { const T2 = DK(P); T2.web(RX1 - 1, top, -1, 7, '#8a8490'); T2.web(RX0 + LW + 1, RY0 + 37, 1, 5, '#7a7480'); T2.web(RX0, top, 1, 6, '#7a7480'); }
  };
  }
  // ================================================================ 움직임: 바람 한 박자 (덧문 조각 · 쪽지 · 마른 풀) + 창빛 속 먼지 + 불꽃 — cell(x, y, 색, 투명도)로 칸 단위
  SCENES.ranger.fx = (t, cell) => {
    const [RX0, RY0, RX1, RY1] = SCENES.ranger.room, top = RY0 - 22, cx = (RX0 + RX1) / 2;
    // 바람: 약 8.7초마다 1.4초 동안 (가운데가 가장 셈)
    const gt = t % 8.7, gust = gt < 1.4 ? Math.sin(Math.PI * gt / 1.4) : 0;
    // 창빛 속 먼지: 빛 자리 안에서만 아주 천천히 떠다님 (빛 가장자리로 가며 사라짐)
    if (false) { const WX = 196, WW = 24, y0 = RY0 + 2, y1 = RY0 + 34; // v3.19 뺌: 창빛 속 먼지 (사용자 요청)
      for (let i = 0; i < 8; i++) { const sp = 0.012 + h2(i, 1, 701) * 0.01, ph = (t * sp * (1 + gust * 0.8) + h2(i, 2, 701)) % 1, yy = y0 + ph * (y1 - y0), tt = (yy - y0) / (y1 - y0);
        const xl = WX + 1 - tt * 20, xr = WX + WW - 1 - tt * 15, u = h2(i, 3, 701), xx = xl + (xr - xl) * (0.1 + u * 0.8) + Math.sin(t * 0.7 + i * 2.1) * 1.6 + gust * tt * 2;
        const a = Math.min(1, Math.min(ph, 1 - ph) * 6) * (0.55 + 0.35 * Math.sin(t * 1.3 + i)); if (a > 0.05) cell(Math.round(xx), Math.round(yy), i % 3 ? '#ffe2b4' : '#fff4d8', a); } }
    // 불꽃: 걸린 등불 · 카운터 초 · 다락 상자 초 (서로 다른 박자로 모양이 바뀜)
    const fr = (seed, rate) => { const n = Math.floor(t * rate + seed * 3.7); return Math.floor(h2(n, seed, 702) * 3); };
    { const LX = 140, LY = top + 7, f = fr(1, 7); // 유리 안 (3×3)
      const F = [['Y', 'y', 'Y', 'y', 'F', 'y', 'Y', 'y', 'Y'], ['y', 'F', 'y', 'Y', 'y', 'Y', 'Y', 'y', 'Y'], ['Y', 'y', 'Y', 'y', 'F', 'y', 'y', 'Y', 'y']][f], C = { y: '#ffd060', Y: '#ffb040', F: '#fff4c0' };
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) cell(LX - 1 + i, LY + 3 + j, C[F[j * 3 + i]], 1); }
    for (const [fx2, fy, sd] of [[281, RY0 + 1, 2], [RX0 + 46, RY0 - 2, 3]]) { const f = fr(sd, 9); // 초: 심지 위 두 칸
      if (f === 0) { cell(fx2, fy, '#ffd34d', 1); cell(fx2, fy + 1, '#ff9a3a', 1); }
      else if (f === 1) { cell(fx2, fy, '#ffe9a0', 1); cell(fx2, fy + 1, '#ffd34d', 1); cell(fx2, fy - 1, '#ff9a3a', 0.7); }
      else { cell(fx2 + 1, fy, '#ffd34d', 0.9); cell(fx2, fy + 1, '#ff9a3a', 1); } }
    // 덧문 조각: 경첩에 걸려 바람 불 때 한 칸 들림
    { const x = 196 + 24 + 3, y = top + 3 + 3, tilt = gust > 0.35 ? 1 : 0, S = [['ss', 'Ss', 'ss', 'S.'], ['ss', 'Ss', '.ss', '.S']][tilt], C = { s: '#5e4430', S: '#4e3626' };
      const on = new Set(); S.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') on.add((x + i) + ',' + (y + j)); }));
      for (const k of on) { const [X, Y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!on.has((X + dx) + ',' + (Y + dy))) cell(X + dx, Y + dy, K, 1); }
      S.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') cell(x + i, y + j, C[ch], 1); })); }
    // 핀 하나에 매달린 쪽지: 덧문보다 살짝 먼저 · 더 크게 흔들림
    { const px = 150 + 31, py = top + 3 + 12, sw = gust > 0.25 ? (gust > 0.7 ? 2 : 1) : 0, OFF = [[0, 0, 1, 1, 2], [0, 1, 1, 2, 3], [0, 1, 2, 3, 3]][sw];
      for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) cell(px + x + OFF[y], py + y, x === 0 && y === 0 ? '#ece0c4' : y === 4 || x === 5 ? '#b8a880' : '#d4c4a0', 1);
      for (const [x, y] of [[1, 1], [2, 1], [2, 3], [3, 3]]) cell(px + x + OFF[y], py + y, '#7a6a58', 1); cell(px, py, '#c8a040', 1); cell(px, py - 1, K, 1); }
    // 문 밖 마른 풀: 끝 칸이 바람 따라 오른쪽으로 (자리마다 조금씩 늦게)
    for (let x = RX0 - 8; x < RX1 + 8; x++) { if (Math.abs(x - cx) < 18) continue; const n = h2(x, 1, 316); if (n < 0.45) continue; const hgt = 1 + Math.floor((n - 0.45) * 6); if (hgt < 2) continue;
      const g2 = (t - (x - RX0) * 0.006) % 8.7, gg = g2 < 1.4 && g2 > 0 ? Math.sin(Math.PI * g2 / 1.4) : 0, lean = (n > 0.7 ? 1 : 0) + (gg > 0.4 ? 1 : 0);
      cell(x + lean, RY1 + 8 + 2 - (hgt - 1), n > 0.8 ? '#6a6440' : '#545032', 1); }
  };
  // 불빛 깜빡임: 등불 · 초 (빛 목록의 fl 값마다 다른 박자)
  const homeFlick = (seed, t) => seed >= 10 ? 0.9 + Math.sin(t * 0.55 + seed) * 0.05 + Math.sin(t * 0.23 + seed * 2) * 0.05 : 0.9 + Math.sin(t * 11 + seed * 5) * 0.04 + Math.sin(t * 6.3 + seed * 2) * 0.04 + (h2(Math.floor(t * 9 + seed * 3), seed, 703) - 0.5) * 0.08; // v3.18 fl 10 이상: 색유리 빛이 천천히 흐려졌다 돌아옴
  // 빛 목록 (지금 것 + 등불 · 초 깜빡임 fl + 초 두 개 작은 빛)
  SCENES.ranger.lights = [{ x: 208, y: 52, r: 48, a: 0.48, c: [240, 150, 100], sy: 0.8, win: 1 }, { x: 140, y: 44, r: 32, a: 0.4, c: [240, 170, 90], fl: 1 }, { x: 192, y: 190, r: 30, a: 0.18, c: [120, 120, 160] }, { x: 281, y: 57, r: 12, a: 0.3, c: [250, 180, 90], fl: 2 }, { x: 142, y: 54, r: 10, a: 0.26, c: [250, 180, 90], fl: 3 }];
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
      const SH = (cx, cy, rx) => T.shOval(F2, cx + 2, cy + 0.5, rx, 2.4, '#1c1a22', cx * 7 + cy, 1.3);
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
  // ---------------------------------------------------------------- v3.18 외딴 관측탑 도트 개선 (시안 _시안/시작장소_도트개선_4단계_외딴관측탑_시안09.html): 동심원 판석 · 두께 있는 둥근 벽 + 책장 위턱 · 창 · 마법진 상감 · 칠판 · 보면대 · 책 더미 옮김 · 창을 향한 안락의자 · 벽을 뚫고 내려가는 계단 · 움직임
  let MAGE_FG = null, MAGE_FG_CHAIR = null, MAGE_FG_CHAIR_PIX = null;
  {
    const base = SCENES.mage.draw;
    SCENES.mage.draw = function (P) {
    // 바닥 자리: 판석을 표시 색으로 칠한 그림을 한 번 더 그려서 알아냄
    const oFS = flagstones; flagstones = ((Q, x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) Q.put(x, y, '#ff00ff'); });
    const PM = Grid(); try { base(PM); } finally { flagstones = oFS; }
    base(P);
    const TEL = 'OFF', ecx = 192, ecy = 114, erx = 118, ery = 64;
    const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], bay = (x, y) => (B4[y & 3][x & 3] + 0.5) / 16;
    const hx = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'), toHex = (r, g, b) => '#' + hx(r) + hx(g) + hx(b);
    const rgbOf = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const put = (x, y, c) => P.put(x, y, c);
    function blit(M, ol = K) { const key = (x, y) => x + ',' + y; for (const k of M.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!M.has(key(x + dx, y + dy))) put(x + dx, y + dy, ol); } for (const [k, c] of M) { const [x, y] = k.split(',').map(Number); put(x, y, c); } }
    const md = PM.g.getImageData(0, 0, GW, GH).data, isFloor = (x, y) => { const i = (y * GW + x) * 4; return md[i] - md[i + 1] > 40 && md[i + 2] - md[i + 1] > 40; };
    const inE = (x, y) => ((x + 0.5 - ecx) / erx) ** 2 + ((y + 0.5 - ecy) / ery) ** 2 <= 1;
    const wallTop = x => { const t = (x + 0.5 - ecx) / erx; return Math.abs(t) > 1 ? null : Math.round(ecy - ery * Math.sqrt(1 - t * t)); };
    // 남길 소품 (칠판 · 보면대 · 혼천의 · 책상 · 책 더미 둘). 나머지 바닥 위 소품(흩어진 책 · 종이 · 옛 상감 · 계단 문)은 새 바닥으로 덮음
    // 옮기는 소품: 보면대 (한 줄로 서 있던 자리 → 왼쪽 앞으로) · 마법진 가장자리를 덮던 책 더미 (→ 칠판 옆)
    const MOVE = [{ box: [148, 66, 174, 101], dx: -30, dy: 30, fg: true }];
    const D0 = P.g.getImageData(0, 0, GW, GH).data, CUT = MOVE.map(m => { const px = []; const [a, b, c, d] = m.box; const OLDC = new Set(['#a07a30', '#6a4c20', '#e0b040', '#5a4422', '#ffe9a0', '#9a7028']); for (let y = b; y < d; y++) for (let x = a; x < c; x++) { if (isFloor(x, y)) continue; const i = (y * GW + x) * 4; if (OLDC.has(toHex(D0[i], D0[i + 1], D0[i + 2])) && y > 108) continue; px.push([x + m.dx, y + m.dy, toHex(D0[i], D0[i + 1], D0[i + 2])]); } return px; });
    const KEEP0 = [[89, 61, 126, 99], [248, 56, 278, 97], [282, 104, 297, 123]], KEEP = KEEP0.concat(MOVE.map(m => [m.box[0] + m.dx, m.box[1] + m.dy, m.box[2] + m.dx, m.box[3] + m.dy]), [[129, 82, 145, 97], [175, 64, 217, 96], [235, 90, 283, 127]]);
    const kept0 = (x, y) => KEEP0.some(([a, b, c, d]) => x >= a && x < c && y >= b && y < d), kept = (x, y) => KEEP.some(([a, b, c, d]) => x >= a && x < c && y >= b && y < d);
  
    // ================================================================ 1. 바닥: 마법진을 가운데 둔 동심원 부채꼴 판석 (고리마다 돌 수가 늘어남 · 윗변 밝고 아랫변 어둠 · 금 · 얼룩)
    const FS = { a: '#4a4654', b: '#45414f', c: '#4f4b59', hi: '#5e5a68', hi2: '#56525f', sh: '#3a3644', gap: '#22202a', sp: '#625e6c', dk: '#3e3a48' };
    const MC = [192, 132], RW = 10, SY = 2.1;
    const sid = (x, y) => { const dx = x + 0.5 - MC[0], dy = (y + 0.5 - MC[1]) * SY, r = Math.hypot(dx, dy), ring = Math.floor(r / RW); if (ring < 5) return -1; const n = Math.max(8, Math.round(2 * Math.PI * (ring + 0.5) * RW / 17)), a = (Math.atan2(dy, dx) + Math.PI * 2 + ring * 0.37) % (Math.PI * 2); return ring * 1000 + Math.floor(a / (Math.PI * 2) * n); };
    const floorAt = (x, y) => { const me = sid(x, y); if (me < 0) return null; const v = h2(me, 3, 701); let c = v < 0.34 ? FS.a : v < 0.7 ? FS.b : FS.c;
      if (sid(x + 1, y) !== me || sid(x, y + 1) !== me) c = FS.gap; else if (sid(x, y - 1) !== me) c = FS.hi; else if (sid(x - 1, y) !== me) c = FS.hi2; else if (sid(x + 2, y) !== me || sid(x, y + 2) !== me) c = FS.sh;
      else { const n = h2(x, y, 702); if (n < 0.05) c = FS.sp; else if (n > 0.95) c = FS.dk; } return c; };
    // 마법진 판 (가운데 고리 4개 안쪽): 짙은 돌 원판 위에 놋쇠 상감
    const MRX = 44, MRY = 21;
    const discAt = (x, y) => { const q = ((x + 0.5 - MC[0]) / (MRX + 6)) ** 2 + ((y + 0.5 - MC[1]) / (MRY + 3)) ** 2; return q <= 1; };
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { if (!inE(x, y)) continue; if (kept0(x, y) && !isFloor(x, y)) continue;
      let c = floorAt(x, y); if (c == null || discAt(x, y)) { const q = ((x + 0.5 - MC[0]) / (MRX + 6)) ** 2 + ((y + 0.5 - MC[1]) / (MRY + 3)) ** 2; c = q > 0.93 ? FS.gap : q > 0.86 ? FS.hi : (h2(x >> 1, y, 703) < 0.08 ? '#3a3644' : '#33303c'); } put(x, y, c); }
    // 둘레 벽 밑 그늘 (바닥 가장자리 3칸 디더)
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { if (!inE(x, y) || kept0(x, y)) continue; const q = ((x + 0.5 - ecx) / erx) ** 2 + ((y + 0.5 - ecy) / ery) ** 2; if (q > 0.93 && (q > 0.965 || bay(x, y) < (q - 0.93) * 18)) put(x, y, '#1c1a22'); }
    // 책장 밑 받침돌 (뒤쪽 호: 책장과 바닥 사이 두 줄)
    for (let x = ecx - erx + 6; x < ecx + erx - 6; x++) { const yb = wallTop(x); if (yb == null || yb > ecy - 30) continue; if (kept(x, yb + 1)) continue; put(x, yb, '#1a1418'); put(x, yb + 1, (x % 13 === 0) ? '#2a2632' : '#4a4554'); put(x, yb + 2, (x % 13 === 0) ? '#2a2632' : '#34303c'); }
  
    // 책 더미 (마법진 가장자리 → 칠판 옆으로 옮겨 새로 쌓음): 권마다 어긋남 · 표지 윗면 금박 · 종이 단면
    { const lit = (h, a) => { const n = parseInt(h.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v + (a > 0 ? (255 - v) * a : v * a)))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join(''); };
      const x = 131, y = 92, cols = ['#2e4a6a', '#7a2a2a', '#5a3a6a'];
      for (let i = -2; i < 14; i++) if ((i & 1) && inE(x + i, y + 4)) put(x + i, y + 4, '#1c1a22');
      cols.forEach((c, i) => { const ox = (i % 2) ? 1 : (i % 3 === 2 ? -1 : 0), yy = y - i * 3, w = 11 - (i % 2);
        for (let k = 0; k < w; k++) { put(x + ox + k, yy, k === 0 ? lit(c, -0.2) : c); put(x + ox + k, yy + 1, k === 0 || k === w - 1 ? lit(c, -0.35) : (k & 1 ? '#e8dcc0' : '#bfb090')); put(x + ox + k, yy + 2, lit(c, -0.4)); }
        P.rect(x + ox - 1, yy, 1, 3, K); P.rect(x + ox + w, yy, 1, 3, K); if (i === 0) P.rect(x + ox - 1, yy + 3, w + 2, 1, K); });
      const t = cols.length - 1, c = cols[t], ox = (t % 2) ? 1 : (t % 3 === 2 ? -1 : 0), w = 11 - (t % 2), yy = y - t * 3;
      P.rect(x + ox - 1, yy - 3, w + 2, 1, K); P.rect(x + ox - 1, yy - 2, 1, 2, K); P.rect(x + ox + w, yy - 2, 1, 2, K);
      for (let k = 0; k < w; k++) { put(x + ox + k, yy - 2, lit(c, 0.3)); put(x + ox + k, yy - 1, k > 2 && k < 6 ? '#e0b040' : lit(c, 0.12)); } }
    // 옮긴 소품 붙이기
    MAGE_FG = [];
    CUT.forEach((px, k) => { for (const [x, y, c] of px) put(x, y, c); if (MOVE[k].fg) MAGE_FG.push({ base: MOVE[k].box[3] + MOVE[k].dy - 2, pix: px.slice() }); });
    // ================================================================ 2. 둥근 벽: 두께가 보이는 돌 벽 윗면 (호를 따라 돌 블록 · 안쪽 턱 밝음 · 바깥 어둠)
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { if (inE(x, y)) continue; const q = ((x + 0.5 - ecx) / (erx + 8)) ** 2 + ((y + 0.5 - ecy) / (ery + 8)) ** 2; if (q > 1) continue; if (y < ecy - 26 && Math.abs(x + 0.5 - ecx) < erx - 2) continue; // 뒤쪽은 책장 (양끝 바깥 띠만)
      const qi = ((x + 0.5 - ecx) / (erx + 3)) ** 2 + ((y + 0.5 - ecy) / (ery + 3)) ** 2, a = Math.atan2((y + 0.5 - ecy) / ery, (x + 0.5 - ecx) / erx), seg = Math.floor((a + Math.PI) / (Math.PI * 2) * 64), segEdge = Math.floor((Math.atan2((y + 0.5 - ecy) / ery, (x + 1.5 - ecx) / erx) + Math.PI) / (Math.PI * 2) * 64) !== seg;
      if (kept(x, y)) continue; const lip = inE(x, y - 1) || inE(x - 1, y) || inE(x + 1, y);
      let c = q > 0.975 ? K : lip ? '#8a8490' : qi <= 1 ? (h2(seg, 1, 711) < 0.5 ? '#6a6572' : '#625d6a') : (h2(seg, 2, 711) < 0.5 ? '#55505e' : '#4e4a56');
      if (segEdge && !lip && q <= 0.975) c = '#2e2a36'; if (!lip && qi > 1 && qi < 1.03 && q <= 0.975) c = '#3e3a46';
      put(x, y, c); }
  
    // 둥근 벽 위턱: 책장 꼭대기를 따라 돌 위턱이 이어지고, 양끝(기둥 바깥)은 빈 선반 대신 석벽 면 → 앞쪽 벽 윗면과 끊김 없이 한 바퀴
    { const hgtAt = x => Math.round(24 * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - ecx) / erx) ** 2)) ** 0.5);
      for (let x = ecx - erx - 8; x < ecx + erx + 8; x++) { const yb = wallTop(x);
        if (yb != null) { const yt = yb - hgtAt(x), side = x < ecx - 90 || x >= ecx + 93;
          if (side) for (let y = yt; y < yb; y++) { if (kept(x, y)) continue; const ly = y - yt, row = Math.floor(ly / 3), lx = (x + (row & 1 ? 4 : 0)) & 7; let c = ly % 3 === 2 || lx === 7 ? '#24202a' : ly % 3 === 0 ? '#4a4652' : '#3a3644'; if (yb - y <= 2) c = '#2a2630'; if (h2(x >> 1, row, 751) < 0.08 && ly % 3 === 1) c = '#46424e'; put(x, y, c); }
          // 위턱 (책장 · 석벽 꼭대기): 윗면 밝음 두 줄 + 앞 모서리 어둠 + 외곽선
          const cap = [K, '#8a8490', '#6a6572', '#3e3a46']; for (let k = 0; k < 4; k++) if (!kept(x, yt - 4 + k)) put(x, yt - 4 + k, cap[k]); if ((x - ecx + 400) % 11 === 0) put(x, yt - 2, '#2e2a36');
          for (let y = 0; y < yt - 4; y++) if (!kept(x, y)) put(x, y, K); // 위턱 위로 튀어나온 책장 기둥 자르기
          if (Math.abs(x + 0.5 - ecx) < 10) for (let y = yt; y < yb; y++) { const ly = y - yt, row = Math.floor(ly / 3), lx = (x + (row & 1 ? 4 : 0)) & 7; put(x, y, ly % 3 === 2 || lx === 7 ? '#24202a' : ly % 3 === 0 ? '#4a4652' : '#3a3644'); } } } } // 창 둘레 석벽
    // ================================================================ 3. 창: 노을 하늘 (디더 띠) · 별 셋 · 먼 언덕 · 돌 창틀 (두께 · 왼쪽 밝음) · 창턱
    const WX = ecx - 6, WY = wallTop(ecx) - 21;
    { const NT = window.NIGHT !== false, SKY = NT ? [[0, '#0e0e24'], [4, '#141430'], [8, '#1a1c3e'], [11, '#22244a'], [14, '#2a2c54'], [17, '#34365e']] : [[0, '#2a1e44'], [4, '#3a2650'], [8, '#5e3058'], [11, '#9a4a58'], [14, '#d07050'], [17, '#f0a060']]; // v3.19 밤하늘
      P.rect(WX - 3, WY - 2, 18, 24, K);
      for (let y = -1; y < 21; y++) for (let x = -2; x < 14; x++) { const inner = x >= 0 && x < 12 && y >= 0 && y < 20 && !(y < 6 && Math.hypot(x + 0.5 - 6, y - 6) > 6), frame = !(y < 6 && Math.hypot(x + 0.5 - 6, y - 6) > 8);
        if (!inner) { if (frame) put(WX + x, WY + y, x < 0 ? (x === -2 ? '#8a8490' : '#6a6572') : x >= 12 ? (x === 13 ? '#34303c' : '#46424e') : '#77717e'); continue; }
        let i = 0; while (i < SKY.length - 1 && y >= SKY[i + 1][0]) i++; let c = SKY[i][1]; if (i < SKY.length - 1 && y === SKY[i + 1][0] - 1 && ((x + y) & 1)) c = SKY[i + 1][1]; put(WX + x, WY + y, c); }
      for (let x = 0; x < 12; x++) { const hh = 17 + Math.round(1 + Math.sin(x / 2.2) * 1.2); for (let y = hh; y < 20; y++) put(WX + x, WY + y, NT ? '#120e1c' : '#2a1a2e'); }
      if (NT) for (const [x, y, c] of [[2, 5, '#8a90c0'], [5, 3, '#c8ccf0'], [9, 6, '#9aa0d0'], [7, 10, '#8a90c0'], [3, 12, '#6a70a0'], [10, 13, '#6a70a0']]) put(WX + x, WY + y, c); // 별 (반짝이는 별은 움직임에서)
      P.rect(WX - 3, WY + 20, 18, 1, '#a8a2ae'); P.rect(WX - 3, WY + 21, 18, 1, '#55505e'); }
  
    // ================================================================ 4. 마법진 (새로 새김): 바깥 두 겹 놋쇠 고리 (홈) · 고리 사이 룬 열둘 · 안쪽 고리 · 육각별 · 가운데 초승달
    const RUNES = [];
    { const BR = '#a07a30', BRH = '#e0b040', GR = '#4a3418';
      const ellip = (rx, ry, c, c2) => { for (let a = 0; a < 1440; a++) { const r = a / 1440 * Math.PI * 2, x = Math.round(MC[0] + Math.cos(r) * rx), y = Math.round(MC[1] + Math.sin(r) * ry); put(x, y, Math.sin(r) < 0 ? c : c2 || c); } };
      ellip(MRX + 1, MRY + 1, GR); ellip(MRX, MRY, BRH, BR); ellip(MRX - 1, MRY - 1, GR); ellip(MRX - 6, MRY - 4, GR); ellip(MRX - 7, MRY - 5, BRH, BR); ellip(MRX - 8, MRY - 6, GR);
      // 룬 열둘 (고리 사이 띠): 모양이 다른 작은 표식 — 움직임에서 차례로 밝아짐
      const RG = [['x.x', '.x.', 'x.x'], ['xxx', 'x..', 'xxx'], ['.x.', 'xxx', '.x.'], ['x..', 'xxx', '..x'], ['xx.', 'x.x', '.xx'], ['x.x', 'xxx', 'x.x']];
      for (let k = 0; k < 12; k++) { const r = (k / 12) * Math.PI * 2 + Math.PI / 12, x = Math.round(MC[0] + Math.cos(r) * (MRX - 3.5)) - 1, y = Math.round(MC[1] + Math.sin(r) * (MRY - 2.5)) - 1, g = RG[k % 6];
        const px = []; g.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'x') { put(x + i, y + j, BR); px.push([x + i, y + j]); } })); RUNES.push(px); }
      // 육각별 (두 삼각형) + 안쪽 원 + 초승달
      const star = (rot) => { const p = [0, 1, 2].map(i => { const r = rot + i * Math.PI * 2 / 3; return [MC[0] + Math.cos(r) * (MRX - 10), MC[1] + Math.sin(r) * (MRY - 8)]; }); for (let i = 0; i < 3; i++) { const [ax, ay] = p[i], [bx, by] = p[(i + 1) % 3]; P.line(Math.round(ax), Math.round(ay), Math.round(bx), Math.round(by), BR); } };
      star(-Math.PI / 2); star(Math.PI / 2);
      ellip(9, 4.5, BR); ellip(8, 3.8, GR);
      P.spr(['.yyy.', 'yy...', 'y....', 'yy...', '.yyy.'], { y: BRH }, MC[0] - 3, MC[1] - 2, false); }
  
    // ================================================================ 5. 망원경 (변형 TEL: 'A' 2:1 기울기 긴 통 · 'B' 1:1 기울기 짧은 통 · 'N' 없음) — 칸마다 세로로 채워 계단이 고르게, 명암은 통을 따라 (위 밝음 · 아래 그늘), 띠는 통에 직각
    if (typeof TEL !== 'undefined' && TEL !== 'N' && TEL !== 'OFF') {
      const V = TEL === 'A' ? { px: 214, py: 74, sl: 0.5, back: 9, front: 22, feet: [[204, 94], [225, 95], [215, 97]] } : { px: 212, py: 76, sl: 1, back: 7, front: 13, feet: [[204, 94], [222, 95], [213, 97]] };
      // 삼각대: 축 아래에서 세 다리가 벌어짐 (뒤 다리는 어둡게)
      const leg = (x0, y0, x1, y1, front) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); put(x - 1, y, K); put(x + 1, y, K); put(x, y, i >= n - 1 ? '#c09038' : front ? (i % 5 === 2 ? '#7e5e44' : '#8e6e50') : '#5e4430'); } put(x1, y1 + 1, K); };
      const hub = [V.px, V.py + 5];
      leg(hub[0], hub[1], V.feet[2][0], V.feet[2][1], false); leg(hub[0], hub[1], V.feet[0][0], V.feet[0][1], true); leg(hub[0], hub[1], V.feet[1][0], V.feet[1][1], true);
      for (const [x, y] of V.feet) for (let i = -3; i <= 3; i++) if (((x + i + y) & 1) && inE(x + i, y + 2)) put(x + i, y + 2, '#1c1a22');
      // 받침대: 다리 머리 (놋쇠 원통) + 통을 잡는 갈래
      { const M = new Map(); for (let y = hub[1] - 2; y <= hub[1] + 1; y++) for (let x = hub[0] - 2; x <= hub[0] + 2; x++) M.set(x + ',' + y, y === hub[1] - 2 ? '#f0d080' : x === hub[0] + 2 ? '#5a3c14' : x === hub[0] - 2 ? '#c09038' : '#9a7028'); for (let y = V.py + 1; y < hub[1] - 2; y++) { M.set((V.px - 1) + ',' + y, '#c09038'); M.set((V.px + 1) + ',' + y, '#5a3c14'); } blit(M); }
      // 통: 축(px,py)을 지나 오른쪽 아래(접안경)에서 왼쪽 위(대물렌즈)로
      { const M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c), x0 = V.px + V.back, x1 = V.px - V.front;
        for (let x = x0; x >= x1; x--) { const k = (x0 - x) / (x0 - x1), yc = V.py - (x - V.px) * -V.sl; const r = k < 0.18 ? 1 : k < 0.82 ? 2 : 3, yy = Math.round(V.py + (x - V.px) * V.sl);
          const band = Math.abs(k - 0.18) < 0.02 || Math.abs(k - 0.5) < 0.02 || Math.abs(k - 0.82) < 0.025, eye = k < 0.18;
          for (let j = -r; j <= r; j++) { let c; const t2 = (j + r) / (2 * r);
            if (eye) c = j === -r ? '#9a7028' : j === r ? '#2a1a0a' : '#5a3c14';
            else c = t2 < 0.15 ? '#fff0a0' : t2 < 0.4 ? '#e0b040' : t2 < 0.75 ? '#b08a38' : t2 < 0.95 ? '#7a5420' : '#4a3010';
            if (band && !eye) c = t2 < 0.2 ? '#f0d080' : t2 < 0.7 ? '#6a4818' : '#3a2408';
            set(x, yy + j, c); } }
        // 대물렌즈 단면 (끝 칸): 짙은 유리 + 반짝임
        { const yy = Math.round(V.py + (x1 - V.px) * V.sl); for (let j = -3; j <= 3; j++) set(x1 - 1, yy + j, j === -3 || j === 3 ? '#5a3c14' : j === -2 ? '#d8f0ff' : j === -1 ? '#6a8ab0' : '#2a3a5a'); }
        // 접안경 끝 마개
        { const yy = Math.round(V.py + (x0 - V.px) * V.sl); set(x0 + 1, yy, '#3a2408'); set(x0 + 1, yy - 1, '#5a3c14'); set(x0 + 1, yy + 1, '#2a1a0a'); }
        // 초점 손잡이
        { const xk = x0 - 2, yy = Math.round(V.py + (xk - V.px) * V.sl) + 2; set(xk, yy, '#c09038'); set(xk, yy + 1, '#5a3c14'); }
        blit(M); } }
    // ================================================================ 6. 칠판: 뭉개진 기호 → 별자리 도형 (별 다섯 · 잇는 선) + 궤도 그림 + 계산식 세 줄 · 분필 받침 · 분필 가루
    { const D2 = P.g.getImageData(0, 0, GW, GH).data, SL = '#26362c'; let gx0 = 999, gy0 = 999, gx1 = 0, gy1 = 0;
      for (let y = 60; y < 84; y++) for (let x = 88; x < 128; x++) { const i = (y * GW + x) * 4, r = D2[i], g = D2[i + 1], b = D2[i + 2]; if (g > r + 6 && g >= b && g < 120) { gx0 = Math.min(gx0, x); gy0 = Math.min(gy0, y); gx1 = Math.max(gx1, x); gy1 = Math.max(gy1, y); } }
      for (let y = gy0; y <= gy1; y++) for (let x = gx0; x <= gx1; x++) { const i = (y * GW + x) * 4, r = D2[i], g = D2[i + 1], b = D2[i + 2]; if (g > r + 6 && g >= b || (r > 150 && g > 150)) put(x, y, h2(x >> 1, y, 721) < 0.1 ? '#2e4034' : SL); }
      const bx = gx0 + 2, by = gy0;
      const st = [[2, 10], [5, 4], [9, 7], [12, 2], [8, 12]]; for (let i = 0; i < st.length - 1; i++) P.line(bx + st[i][0], by + st[i][1], bx + st[i + 1][0], by + st[i + 1][1], '#6a8a72'); st.forEach(([x, y]) => { put(bx + x, by + y, '#f0f0e0'); put(bx + x + 1, by + y, '#b8c8b8'); });
      for (let a = 0; a < 40; a++) { const r = a / 40 * Math.PI * 2; put(Math.round(bx + 19 + Math.cos(r) * 4), Math.round(by + 4 + Math.sin(r) * 2), '#a8b8a8'); } put(bx + 19, by + 4, '#f0e0a0'); put(bx + 23, by + 4, '#d8e0d4');
      for (let r = 0; r < 3; r++) { const y = by + 9 + r * 2; for (let x = bx + 15; x < bx + 15 + [8, 6, 7][r]; x++) if ((x + r) % 4 !== 3) put(x, y, '#c8d4c8'); } put(bx + 18, by + 11, '#f0f0e0'); put(bx + 19, by + 11, '#f0f0e0');
      }
  
    // ================================================================ 8. 바닥 소품 (몇 개만 · 모양이 다름): 칠판 밑 분필 가루 · 보면대 옆에 반쯤 펼쳐진 별자리 두루마리 · 책상 옆 구겨진 종이 둘 · 엎어 놓은 책 하나
    { for (let i = 0; i < 9; i++) { const x = 100 + Math.floor(h2(i, 1, 731) * 18), y = 100 + Math.floor(h2(i, 2, 731) * 3); put(x, y, h2(i, 3, 731) < 0.5 ? '#9a9890' : '#787670'); }
      // 두루마리: 왼쪽 끝은 말려 있고 오른쪽으로 펼쳐짐 (별 · 선)
      { const sx = 150, sy = 104, M = new Map(); for (let y = 0; y < 5; y++) for (let x = 0; x < 16; x++) M.set((sx + x) + ',' + (sy + y + (x > 10 ? 1 : 0)), x < 3 ? (x === 1 ? '#e8dcc0' : '#a89878') : y === 0 ? '#ece0c4' : y === 4 ? '#b8a880' : '#d4c4a0'); blit(M);
        for (const [x, y] of [[6, 2], [9, 1], [12, 3]]) put(sx + x, sy + y + (x > 10 ? 1 : 0), '#4a5a8a'); put(sx + 7, sy + 2, '#8a8aa8'); put(sx + 10, sy + 2, '#8a8aa8'); }
      const crumple = (x, y) => P.spr(['.pp.', 'pPlp', 'plPp', '.pp.'], { p: '#d4c4a0', P: '#ece0c4', l: '#a89878' }, x, y);
      crumple(287, 128);
      P.spr(['hhhhhhhh', 'CCyyyCCd', 'CCCCCCCd', 'SpPpPpPd'], { h: '#3a5a8a', C: '#2e4a6a', d: '#1a2a3a', y: '#e0b040', S: '#24384e', p: '#e8dcc0', P: '#bfb090' }, 100, 140);
      for (const [x, y, w] of [[154, 110, 16], [287, 132, 5], [100, 145, 9]]) for (let i = 0; i < w; i++) if ((i & 1) && inE(x + i, y)) put(x + i, y, '#1c1a22'); }
  
    // ================================================================ 8-1. 창을 향한 낡은 안락의자 (등이 화면 쪽): 높은 등받이 · 귀날개 · 둥글게 만 팔걸이 · 누빈 단추 · 노을빛 테두리 · 걸쳐 둔 털 담요 · 나무 다리 + 옆 바닥의 식은 찻잔
    { const ox = 180, oy = 70, M = new Map(), set = (x, y, c) => M.set((ox + x) + ',' + (oy + y), c);
      const V = { H: '#5a8a8a', L: '#3e6466', M: '#2e4e52', D: '#223a3e', S: '#162a2e', R: '#c8906a', r: '#e8b080' };
      // 그림자는 빛 다음에 길게 (아래 10-1)
      // 팔걸이: 등받이 양옆으로 넓게 튀어나온 둥근 팔 (윗면 말린 테 밝음 · 화면 쪽 앞면 · 바깥 끝 소용돌이) — 등받이와는 짙은 골로 나뉨
      for (let y = 9; y < 17; y++) for (const [xa, xb, L] of [[-3, 3, 1], [21, 27, 0]]) for (let x = xa; x < xb; x++) { const outer = L ? x === xa : x === xb - 1, inner = L ? x === xb - 1 : x === xa;
        let c = y === 9 ? (outer ? V.L : V.H) : y === 10 ? (outer ? V.M : V.L) : (outer ? (L ? V.L : V.S) : inner ? V.S : (L ? V.M : V.D)); if (y === 11 && outer) c = V.S; if (y === 10 && x === (L ? xa + 1 : xb - 2)) c = V.H; set(x, y, c); }
      // 귀날개: 등받이 위쪽 양옆으로 벌어짐 (위가 둥글게)
      for (let y = 2; y < 11; y++) { const out = y < 4 ? 1 : 2; for (let k = 1; k <= out; k++) { set(4 - k, y, y === 2 || (y === 3 && k === 2) ? V.R : k === out ? V.D : V.M); set(19 + k, y, y === 2 || (y === 3 && k === 2) ? V.R : k === out ? V.S : V.D); } }
      // 등받이 + 둥근 머리 (세로 골 누빔)
      for (let y = -4; y < 17; y++) { const l = y === -4 ? 8 : y === -3 ? 6 : y === -2 ? 5 : 4, r2 = y === -4 ? 15 : y === -3 ? 17 : y === -2 ? 18 : 19;
        for (let x = l; x <= r2; x++) { const t2 = (y + 4) / 20; let c = y <= -3 ? V.R : t2 < 0.3 ? V.M : t2 < 0.7 ? V.D : V.S; if (y === -4 && x > 9 && x < 14) c = V.r;
          if (y > -2 && (x - 4) % 4 === 3 && x < 19) c = t2 < 0.5 ? V.D : V.S; if (y > -2 && (x - 4) % 4 === 0 && x > 4) c = t2 < 0.5 ? V.L : V.M;
          if (y >= -2 && x === l) c = V.L; if (y >= -2 && x === r2) c = V.S; set(x, y, c); } }
      // 등받이와 팔걸이 사이 골 (짙은 선) + 팔걸이 윗면 말림 (밝은 둥근 테 · 끝 소용돌이)
      for (let y = 9; y < 17; y++) { set(3, y, '#0e1a1c'); set(20, y, '#0e1a1c'); }
      // 앉는 방석 끝 (팔걸이 너머로 살짝 보임)
      for (let x = 4; x < 20; x++) set(x, 16, '#1e3236');
      // 아래 받침 (치맛단) + 나무 다리
      for (let x = -2; x < 26; x++) { set(x, 17, x < 3 || x > 20 ? V.S : '#1e2a2e'); set(x, 18, x % 4 === 0 ? '#2a1e14' : '#3a2a1e'); }
      for (const lx of [-1, 23]) { set(lx, 19, '#8e6e50'); set(lx + 1, 19, '#5e4430'); set(lx, 20, '#5e4430'); }
      // 털 담요: 등받이 머리에 걸쳐 넘어가 등 뒤로 흘러내림 — 머리 위로 접힌 두께가 솟고 (노을빛 테두리), 주름 두 골 · 짠 무늬 띠 · 물결진 아랫단 · 술, 담요 옆 · 아래로 의자에 그림자
      { const B = { b: '#9a4a34', l: '#b8644a', d: '#6e2e22', D: '#4a1e16', c: '#d8c098', C: '#a8906a', r: '#e0885e' };
        const L = y => 10 - (y > 7 ? 1 : 0) + (y < -4 ? 1 : 0), R = y => 17 + (y > 5 ? 1 : 0) - (y < -4 ? 1 : 0), END = x => 12 + (((x * 3) % 5) < 2 ? 1 : 0);
        // 의자에 드리운 그림자 (오른쪽 · 아래)
        for (let y = -1; y < 15; y++) set(R(y) + 1, y, V.S); for (let x = L(12); x <= R(12) + 1; x++) set(x, END(x) + 1, V.S);
        for (let y = -5; y <= 13; y++) for (let x = L(y); x <= R(y); x++) { if (y > END(x)) continue; const fl = x - L(y), stripe = y === 1 || y === 2 || y === 8 || y === 9, top = y === -5 || (y === -4 && (x === L(y) || x === R(y)));
          let c = stripe ? B.c : B.b;
          if (fl === 2 || fl === 5) c = stripe ? B.C : B.d; else if (fl === 1 || fl === 4) c = stripe ? B.c : B.l; // 주름 두 골 (왼쪽 밝음 · 골 어둠)
          if (x === R(y)) c = stripe ? B.C : B.D; if (x === L(y) && !stripe) c = B.l;
          if (!stripe && (x + y) % 3 === 0 && fl !== 2 && fl !== 5) c = c === B.l ? B.b : B.d === c ? c : '#8a4030'; // 짠 결
          if (top) c = B.r; if (y === -3 && !stripe) c = B.d; // 머리 위 접힌 두께 밑 그늘
          if (y === END(x)) c = stripe ? B.C : B.D; set(x, y, c); }
        for (let x = L(13); x <= R(13); x += 2) { set(x, END(x) + 1, B.c); set(x, END(x) + 2, B.C); } }
      blit(M);
      MAGE_FG_CHAIR = [...M.keys()].map(k => k.split(',').map(Number));
      // 찻잔 (오른쪽 바닥): 받침 접시 + 잔 + 김 없는 식은 차
      P.spr(['.kkk.', 'kwTwk', 'kwwwk', 'ssssss'], { k: K, w: '#d8d0c0', T: '#6a4a2a', s: '#a8a090' }, ox + 29, oy + 17, false); put(ox + 34, oy + 18, '#d8d0c0'); }
    // ================================================================ 8-2. 책상 다시 그림: 판자 윗면 (나뭇결 · 앞 모서리 밝음) · 서랍 셋 달린 앞판 (판 테두리 · 놋쇠 손잡이 · 열쇠 구멍) · 깎은 다리
    //   위: 펼쳐 둔 별자리 도표 (왼쪽 끝 말림 · 문진 돌) · 놋쇠 디바이더 · 펼친 책 · 잉크병과 깃펜 · 촛농 흘러내린 초와 놋쇠 받침
    { const W = { H: '#c8a880', L: '#a8845e', l: '#8e6e50', m: '#6e5038', w: '#5e4430', d: '#4e3626', D: '#33241a' }, x0 = 238, y0 = 101, w = 44;
      // 그림자 (다리 사이 · 앞쪽 바닥)
      for (let y = 119; y < 127; y++) for (let x = x0 - 1; x < x0 + w + 3; x++) if (inE(x, y) && (y < 121 || ((x + y) & 1 && y < 125))) put(x, y, '#1a1820');
      const M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c);
      // 윗면: 판자 세 장 (가로) · 나뭇결 · 판자 이음 · 앞 모서리
      for (let y = y0; y < y0 + 12; y++) for (let x = x0; x < x0 + w; x++) { const ly = y - y0, pl = Math.floor(ly / 4), seam = ly % 4 === 3 && ly < 11;
        let c = seam ? W.l : (pl === 1 ? W.L : '#9c7a56'); if (!seam && h2(Math.floor((x + pl * 7) / 5), y, 771) < 0.12) c = W.l; if (!seam && (x * 3 + ly * 7 + pl * 11) % 23 === 0) c = W.H;
        if (ly === 0) c = '#b89470'; if (ly === 11) c = W.H; if (x === x0) c = ly === 11 ? W.H : W.L; if (x === x0 + w - 1) c = W.m; set(x, y, c); }
      // 앞판: 서랍 셋
      for (let y = y0 + 12; y < y0 + 18; y++) for (let x = x0; x < x0 + w; x++) { const ly = y - y0 - 12; let c = ly === 0 ? W.d : ly === 5 ? W.D : W.w; if (x === x0) c = W.m; if (x === x0 + w - 1) c = W.D; set(x, y, c); }
      for (const dx2 of [2, 16, 30]) { for (let y = y0 + 13; y < y0 + 17; y++) for (let x = x0 + dx2; x < x0 + dx2 + 12; x++) { const e = y === y0 + 13 || x === x0 + dx2, e2 = y === y0 + 16 || x === x0 + dx2 + 11; set(x, y, e ? W.D : e2 ? W.l : W.m); }
        set(x0 + dx2 + 5, y0 + 14, '#f0d080'); set(x0 + dx2 + 6, y0 + 14, '#c09038'); set(x0 + dx2 + 5, y0 + 15, '#9a7028'); set(x0 + dx2 + 6, y0 + 15, '#6a4c20'); }
      // 다리 (앞 둘 · 깎은 모양)
      for (const lx of [x0 + 1, x0 + w - 4]) for (let y = y0 + 18; y < y0 + 24; y++) for (let i = 0; i < 3; i++) { const ly = y - y0 - 18, narrow = ly === 2 || ly === 3; if (narrow && i === 2) continue; set(lx + i, y, i === 0 ? W.l : ly === 5 ? W.D : W.d); }
      blit(M);
      // 별자리 도표: 왼쪽 끝 말림 · 별 · 잇는 선 · 문진 돌
      { const px = x0 + 2, py = y0 + 1, M2 = new Map(); for (let y = 0; y < 9; y++) for (let x = 0; x < 18; x++) M2.set((px + x) + ',' + (py + y), x < 2 ? (x === 0 ? '#a89878' : '#e8dcc0') : y === 0 ? '#f0e6cc' : y === 8 ? '#b8a880' : (h2(x, y, 772) < 0.08 ? '#c8b890' : '#dccca8')); blit(M2);
        const st = [[4, 6], [7, 3], [10, 5], [12, 2], [14, 5]]; for (let i = 0; i < st.length - 1; i++) P.line(px + st[i][0], py + st[i][1], px + st[i + 1][0], py + st[i + 1][1], '#8a8ab0'); st.forEach(([x, y]) => { put(px + x, py + y, '#2e3a6a'); });
        put(px + 10, py + 5, '#a02020'); P.spr(['.kk.', 'kSsk', 'ksSk', '.kk.'], { k: K, S: '#8a8490', s: '#5e5866' }, px + 15, py + 5, false); // 문진 돌
        for (let i = 0; i < 4; i++) { put(px + 5 + i, py + 7 - (i >> 1), '#c09038'); } put(px + 5, py + 7, '#f0d080'); } // 놋쇠 디바이더
      // 펼친 책
      P.spr(['.hhhh.hhhh.', 'hPPPPgPPPPh', 'hPllPgPllPh', 'hPPPPgPllPh', 'pPPPPgPPPPp', 'ccccccccccc'], { h: '#c8b898', P: '#ece0c4', l: '#8a7a6a', g: '#a89878', p: '#bfb090', c: '#5e1a20' }, x0 + 21, y0 + 2);
      // 잉크병 + 깃펜
      P.spr(['.kk.', 'kbBk', 'kbbk', '.kk.'], { k: K, b: '#1e2a4a', B: '#5a7ab0' }, x0 + 32, y0 + 7, false);
      for (let i = 0; i < 5; i++) { put(x0 + 33 + i, y0 + 7 - i, i < 2 ? '#3a3642' : '#f0ece4'); if (i > 1) put(x0 + 34 + i, y0 + 7 - i, '#c8c0b4'); }
      // 초 + 놋쇠 받침 (불꽃은 움직임: 277, 93)
      P.spr(['..kkk..', '.kwWwk.', '.kwWWk.', '.kwwWk.', 'kkGgGkk', 'kGggggk', '.kkkkk.'], { k: K, w: '#f0e8d8', W: '#d8d0c0', G: '#e0b040', g: '#9a7028' }, 274, 95, false);
      put(277, 95, '#2a2228'); put(275, 97, '#f0e8d8'); put(275, 98, '#f0e8d8'); } // 심지 · 흘러내린 촛농
    // ================================================================ 9. 바닥에 파인 계단 → 앞쪽 벽을 뚫고 아래로 내려감
    //   단마다 밝은 디딤면 + 화면 쪽을 향한 어두운 챌면 (내려가는 계단은 챌면이 보임) · 아래로 갈수록 어둡고 가장자리부터 어둠이 좁혀 옴
    //   첫 단은 위 턱 그림자에 잠김 · 둘레 연석 · 양옆 안벽 마름돌 · 앞쪽 벽은 계단 자리만 뚫리고 계단은 벽 바깥으로 몇 단 더 내려가다 어둠 속으로 사라짐
    { const x0 = CX - 10, x1 = CX + 10, y0 = 157, SS = 5, NS = 9;
      const qO = (x, y) => ((x + 0.5 - ecx) / (erx + 8)) ** 2 + ((y + 0.5 - ecy) / (ery + 8)) ** 2;
      const shade = (c, k) => { const [r, g, b] = rgbOf(c); return toHex(r * k, g * k, b * k * 1.04); };
      // 벽 바깥 빈칸 정리 (계단 통로는 그림)
      for (let y = 168; y < GH; y++) for (let x = CX - 22; x < CX + 22; x++) if (qO(x, y) > 1) put(x, y, K);
      for (let st = 0; st < NS; st++) for (let j = 0; j < SS; j++) { const y = y0 + 3 + st * SS + j; if (y >= GH) continue;
        const k = Math.max(0.05, 1 - st * 0.13 - j * 0.02);
        for (let x = x0; x < x1; x++) { const e = Math.min(x - x0, x1 - 1 - x), vig = Math.min(1, 0.55 + e * 0.12 + (1 - st / NS) * 0.3);
          let c = j === 0 ? '#9a94a0' : j === 1 ? '#7e7884' : j === 2 ? '#4e4a56' : j === 3 ? '#3e3a46' : '#2e2a36'; // 디딤면 2줄 + 챌면 3줄
          if (j === 1 && h2(x, y, 761) < 0.1) c = '#6e6878'; if (j === 0 && h2(x, st, 762) < 0.12) c = '#7e7884'; if (j >= 2 && (x - x0 + st * 3) % 7 === 0) c = '#24202a'; // 닳은 모서리 · 챌면 돌 이음매
          if (st === 0 && j < 2) c = shade(c, 0.62); // 위 턱 그림자
          put(x, y, shade(c, k * vig)); } }
      // 첫 단까지 내려가는 앞면 (턱 바로 아래)
      for (let x = x0; x < x1; x++) { put(x, y0, '#3a3642'); put(x, y0 + 1, '#2a2630'); put(x, y0 + 2, (x - x0) % 7 === 3 ? '#1e1c24' : '#26222c'); }
      // 양옆 안벽 (마름돌 · 아래로 갈수록 어두움) — 벽 바깥에선 통로 벽
      for (let y = y0; y < GH; y++) { const j = y - y0, row = Math.floor(j / 3), ly = j % 3, k = Math.max(0.08, 1 - j / 44);
        for (const [x, L] of [[x0 - 2, 1], [x0 - 1, 1], [x1, 0], [x1 + 1, 0]]) { let c = ly === 2 ? (L ? '#2e2a36' : '#1a1820') : L ? (ly === 0 ? '#625d6a' : '#55505e') : (ly === 0 ? '#3a3642' : '#302c38'); if ((row & 1) && (L ? x === x0 - 1 : x === x1) && ly < 2) c = L ? '#46424e' : '#26222c'; put(x, y, shade(c, k)); } }
      // 둘레 연석 (위 · 양옆) — 둥근 벽 안쪽까지
      for (let x = x0 - 4; x < x1 + 4; x++) { const jt = (x - (x0 - 4)) % 6 === 5; put(x, y0 - 3, '#22202a'); put(x, y0 - 2, jt ? '#3a3642' : '#9a94a0'); put(x, y0 - 1, jt ? '#2e2a36' : '#6e6878'); }
      for (let y = y0 - 1; y < 186; y++) { if (!inE(x0 - 4, y)) continue; const jt = (y - y0) % 5 === 4;
        put(x0 - 5, y, '#22202a'); put(x0 - 4, y, jt ? '#3a3642' : '#8a8490'); put(x0 - 3, y, jt ? '#2e2a36' : '#6e6878');
        put(x1 + 2, y, jt ? '#2e2a36' : '#77717e'); put(x1 + 3, y, jt ? '#26222c' : '#55505e'); put(x1 + 4, y, '#22202a'); }
      // 앞쪽 둥근 벽: 계단 자리만 뚫림 — 양옆 잘린 벽 단면 (윗면 밝은 모서리 + 단면)
      for (let y = 160; y < 200; y++) for (let x = x0 - 5; x < x1 + 5; x++) { if (inE(x, y) || qO(x, y) > 1) continue; if (x >= x0 - 2 && x < x1 + 2) continue;
        const L = x < x0; put(x, y, L ? (x === x0 - 3 ? '#b4aeb8' : x === x0 - 4 ? '#8a8490' : '#6a6572') : (x === x1 + 2 ? '#3a3642' : x === x1 + 3 ? '#4e4a56' : '#55505e')); }
      // 연석 이끼 몇 점
      for (const [x, y] of [[x0 - 4, 166], [x1 + 3, 171], [x0 + 3, y0 - 2]]) { put(x, y, '#3e5634'); put(x, y + 1, '#2e4228'); } }
    { const D3 = P.g.getImageData(0, 0, GW, GH).data, keys = new Set(); for (const [x, y] of MAGE_FG_CHAIR) { keys.add(x + ',' + y); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) keys.add((x + dx) + ',' + (y + dy)); }
      MAGE_FG_CHAIR_PIX = [...keys].map(k => { const [x, y] = k.split(',').map(Number), i = (y * GW + x) * 4; return [x, y, toHex(D3[i], D3[i + 1], D3[i + 2])]; }); }
    // v3.22 배경에 그려진 소품(칠판 · 혼천의 · 책상 · 책 더미 · 망원경 등)도 앞 겹으로 오려 깊이 순서에 넣음 → 바닥에 까는 기술 효과가 소품 밑으로 깔림
    { const D4 = P.g.getImageData(0, 0, GW, GH).data, FLOOR = new Set(Object.values(FS));
      for (const [a, b, c, d] of [[89, 61, 126, 99], [248, 56, 278, 97], [282, 104, 297, 123], [129, 82, 145, 97], [175, 64, 217, 96], [235, 90, 283, 127]]) { const pix = [];
        for (let y = b; y < d; y++) for (let x = a; x < c; x++) { const i = (y * GW + x) * 4, col = toHex(D4[i], D4[i + 1], D4[i + 2]); if (inE(x, y) && (FLOOR.has(col) || col === floorAt(x, y))) continue; pix.push([x, y, col]); }
        if (pix.length) MAGE_FG.push({ base: d - 2, pix }); } }
    // ================================================================ 10. 빛 (디더 글로우): 창 노을빛이 바닥으로 길게 · 마법진 은은한 금빛 · 책상 촛불 후광
    { const D = P.g.getImageData(0, 0, GW, GH).data;
      const glowAt = (x, y, lv, tint) => { if (x < 0 || y < 0 || x >= GW || y >= GH) return; if (lv < bay(x, y) * 0.9) return; const k = lv > 0.72 ? 0.5 : lv > 0.45 ? 0.34 : 0.2, i = (y * GW + x) * 4; put(x, y, toHex(D[i] + (tint[0] - D[i]) * k + 14 * k, D[i + 1] + (tint[1] - D[i + 1]) * k + 14 * k, D[i + 2] + (tint[2] - D[i + 2]) * k + 14 * k)); };
      const SUN = rgbOf(window.NIGHT !== false ? '#7484b8' : '#f0a070'), GOLD = rgbOf('#e8c070'), CAN = rgbOf('#f0b050'); // v3.19 밤: 창빛은 푸른 달빛
      const floorOnly = (x, y) => inE(x, y) && !kept(x, y);
      // 노을빛: 창 아래에서 바닥 가운데로 길쭉하게
      for (let y = wallTop(ecx) + 1; y < 112; y++) { const t = (y - wallTop(ecx)) / (112 - wallTop(ecx)), w = 7 + t * 12; for (let x = Math.floor(ecx - w - 2); x <= ecx + w + 2; x++) { if (!floorOnly(x, y)) continue; const e = Math.abs(x + 0.5 - ecx) / w; if (e > 1.15) continue; glowAt(x, y, (1 - Math.min(1, e) ** 2) * (0.5 - t * 0.28) * Math.min(1, (112 - y) / 8), SUN); } }
      // 마법진 금빛 (판 안)
      for (let y = MC[1] - MRY - 3; y <= MC[1] + MRY + 3; y++) for (let x = MC[0] - MRX - 6; x <= MC[0] + MRX + 6; x++) { const d = Math.hypot((x - MC[0]) / (MRX + 4), (y - MC[1]) / (MRY + 2)); if (d < 1 && floorOnly(x, y)) glowAt(x, y, (1 - d) * 0.42, GOLD); }
      // 촛불 후광 (책상 뒤 · 옆 바닥)
      for (let y = 80; y < 112; y++) for (let x = 258; x < 300; x++) { const d = Math.hypot((x - 277) / 20, (y - 94) / 14); if (d < 1 && (floorOnly(x, y))) glowAt(x, y, (1 - d) * 0.6, CAN); } }
  
    MAGE_FG.push({ base: 90, pix: MAGE_FG_CHAIR_PIX });
    // ================================================================ 10-1. 안락의자의 긴 그림자: 창빛을 등지고 화면 쪽으로 길게 늘어져 마법진까지 오며 디더로 옅어짐
    { const D = P.g.getImageData(0, 0, GW, GH).data, y0 = 89, y1 = 126, cx = 192, chairBox = (x, y) => x >= 175 && x < 217 && y >= 64 && y < 96;
      const solid = new Set(MAGE_FG_CHAIR.map(([x, y]) => x + ',' + y));
      for (let y = y0; y < y1; y++) { const t = (y - y0) / (y1 - y0), half = 12 + t * 4 - (t < 0.08 ? 1 : 0); for (let x = Math.floor(cx - half - 2); x <= cx + half + 2; x++) { if (!inE(x, y) || (kept(x, y) && !chairBox(x, y)) || solid.has(x + ',' + y)) continue;
        const e = Math.abs(x + 0.5 - cx) / half; if (e > 1.1) continue; const lv = Math.pow(1 - t, 0.85) * (e > 0.75 ? Math.max(0, (1.1 - e) / 0.35) : 1); if (lv < bay(x, y) * 0.95) continue;
        const i = (y * GW + x) * 4, k = t < 0.3 ? 0.45 : 0.58; put(x, y, toHex(D[i] * k, D[i + 1] * k, D[i + 2] * k * 1.06)); } } }
    // ================================================================ 11. 책상 촛불 · 창 별: 움직임에서 그림 (지금 그린 불꽃 칸 지우기)
    { const d = P.g.getImageData(274, 93, 1, 1).data, c0 = toHex(d[0], d[1], d[2]); for (const [x, y] of [[277, 93], [276, 94], [278, 94], [277, 94], [277, 95], [277, 92]]) put(x, y, c0); }
  };
  }
  SCENES.mage.fg = () => MAGE_FG;
  // ================================================================ 움직임: 마법진 룬이 차례로 밝아짐 · 빛 알갱이가 떠오름 · 혼천의 고리를 도는 구슬 · 창 별 반짝임 · 책상 촛불 · 바람에 두루마리 끝이 들썩
  SCENES.mage.fx = (t, cell) => {
    const MC = [192, 132], MRX = 44, MRY = 21;
    const gt = t % 8.7, gust = gt < 1.4 ? Math.sin(Math.PI * gt / 1.4) : 0;
    // 룬: 약 0.35초마다 다음 룬이 밝아지고 뒤로 두 칸 잦아듦 (한 바퀴 4.2초)
    { const n = 12, head = Math.floor(t / 0.35) % n;
      for (let k = 0; k < n; k++) { const lag = (head - k + n) % n; if (lag > 2) continue; const r = (k / n) * Math.PI * 2 + Math.PI / 12, x = Math.round(MC[0] + Math.cos(r) * (MRX - 3.5)) - 1, y = Math.round(MC[1] + Math.sin(r) * (MRY - 2.5)) - 1;
        const RG = [['x.x', '.x.', 'x.x'], ['xxx', 'x..', 'xxx'], ['.x.', 'xxx', '.x.'], ['x..', 'xxx', '..x'], ['xx.', 'x.x', '.xx'], ['x.x', 'xxx', 'x.x']][k % 6], c = lag === 0 ? '#fff4c0' : lag === 1 ? '#ffd870' : '#e0b040';
        RG.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'x') cell(x + i, y + j, c, lag === 2 ? 0.7 : 1); })); if (lag === 0) for (const [dx, dy] of [[-1, 1], [3, 1], [1, -1], [1, 3]]) cell(x + dx, y + dy, '#e0b040', 0.45); } }
    // 빛 알갱이: 진 안에서 천천히 떠올라 흔들리며 사라짐
    for (let i = 0; i < 9; i++) { const life = 3 + h2(i, 1, 741) * 2, ph = ((t + h2(i, 2, 741) * 7) % life) / life, cyc = Math.floor((t + h2(i, 2, 741) * 7) / life), a0 = h2(i, cyc, 742) * Math.PI * 2, d0 = Math.sqrt(h2(i, cyc, 743)) * 0.8;
      const x = MC[0] + Math.cos(a0) * MRX * d0 + Math.sin(ph * 5 + i) * 1.2, y = MC[1] + Math.sin(a0) * MRY * d0 - ph * 16, a = ph < 0.2 ? ph / 0.2 : 1 - (ph - 0.2) / 0.8; cell(Math.round(x), Math.round(y), ph < 0.5 ? '#fff0b0' : '#e0b040', a * 0.9); }
    // 혼천의: 바깥 고리를 따라 도는 작은 구슬 (12초 한 바퀴)
    { const r = t / 12 * Math.PI * 2; cell(Math.round(262 + Math.cos(r) * 12), Math.round(70 + Math.sin(r) * 12), '#fff4c0', 1); cell(Math.round(262 + Math.cos(r - 0.12) * 12), Math.round(70 + Math.sin(r - 0.12) * 12), '#e0b040', 0.6); }
    // 창 별 반짝임
    { const WX = 186, WY = 25; for (const [x, y, s] of [[3, 3, 1], [8, 6, 2], [5, 9, 3], [10, 2, 4]]) { const v = h2(Math.floor(t * 1.5 + s * 1.3), s, 744); if (v > 0.35) cell(WX + x, WY + y, v > 0.8 ? '#ffffff' : '#c8c0e0', v > 0.8 ? 1 : 0.7); } }
    // 책상 촛불
    { const f = Math.floor(h2(Math.floor(t * 8), 5, 745) * 4), F = [[[0, 0, '#ffd34d'], [-1, 1, '#ffd34d'], [1, 1, '#ffd34d'], [0, 1, '#fff6c8'], [0, 2, '#ff9a30']], [[0, -1, '#ffd34d'], [0, 0, '#fff6c8'], [0, 1, '#ffd34d'], [-1, 1, '#ff9a30'], [0, 2, '#ff9a30']], [[1, 0, '#ffd34d'], [0, 1, '#fff6c8'], [1, 1, '#ffd34d'], [0, 2, '#ff9a30']], [[0, 0, '#ffe9a0'], [0, 1, '#ffd34d'], [-1, 1, '#ff9a30'], [1, 1, '#ff9a30'], [0, 2, '#ff9a30']]][f];
      for (const [dx, dy, c] of F) cell(277 + dx + (gust > 0.6 && dy < 1 ? 1 : 0), 93 + dy, c, 1); }
    // 두루마리 끝: 바람 불 때 오른쪽 끝이 들림
    if (gust > 0.3) { cell(188, 103, '#ece0c4', 1); cell(188, 104, '#d4c4a0', 1); cell(189, 103, '#0b0a0e', 1); cell(189, 104, '#0b0a0e', 1); cell(188, 102, '#0b0a0e', 1); }
  };
  SCENES.mage.lights = [{ x: 192, y: 40, r: 50, a: 0.42, c: [230, 130, 110], sy: 0.7, win: 1 }, { x: 277, y: 94, r: 40, a: 0.55, c: [255, 200, 110], fl: 1 }, { x: 192, y: 132, r: 46, a: 0.24, c: [255, 220, 140], fl: 12 }, { x: 192, y: 82, r: 30, a: 0.16, c: [240, 150, 100], win: 1 }];
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
  // ---------------------------------------------------------------- v3.18 종이 멈춘 수도원 도트 개선 (시안 _시안/시작장소_도트개선_2단계_종이멈춘수도원_시안08.html): 교회 의자(부서진 의자도 같은 그림) · 떨어진 종 · 낮은 제단(좌우 대칭) + 돌계단 · 색유리 디더 글로우 · 찢어진 양탄자 끝 · 대칭 돌기둥 입구 · 문턱에서 흙길로 이어짐
  {
    const base = SCENES.priest.draw;
    SCENES.priest.draw = function (P) {
      base(P);

  const top = RY0 - 28;
  // 바닥 판석 (지금 그림과 같은 판석) — 신도석 · 종 자리를 다시 깔고 새로 그림
  const F = Grid(); flagstones(F, RX0, RY0, RX1, RY1, { a: '#5a5664', b: '#54505e', c: '#4e4a58', gap: '#2e2a36', hi: '#66616e', speck: '#6e6a76' }, 9, 13, 8);
  const fd = F.g.getImageData(0, 0, GW, GH).data, floorAt = (x, y) => { const i = (y * GW + x) * 4; return `rgb(${fd[i]},${fd[i + 1]},${fd[i + 2]})`; };
  const refloor = (x0, y0, x1, y1) => { for (let y = Math.max(RY0, y0); y < Math.min(RY1, y1); y++) for (let x = Math.max(RX0, x0); x < Math.min(RX1, x1); x++) if (x < CX - 14 || x >= CX + 14) P.put(x, y, floorAt(x, y)); };
  const ROWS = [RY0 + 30, RY0 + 50, RY0 + 70, RY0 + 90, RY0 + 110];
  for (const y of ROWS) { refloor(RX0 + 8, y - 6, CX - 13, y + 16); refloor(CX + 14, y - 6, RX1 - 6, y + 16); }
  // 색유리 빛: 창에서 바닥으로 비스듬히 떨어지는 빛줄기 + 바닥에 맺힌 창 모양 색 빛 (바닥 색을 창 색 쪽으로 밝힘 · 가장자리는 디더)
  const hexRGB = c => { if (c[0] === '#') return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; const m = c.match(/\d+/g); return m.map(Number); };
  const pix = (x, y) => { const d = P.g.getImageData(x, y, 1, 1).data; return [d[0], d[1], d[2]]; };
  const lighten = (x, y, tint, k) => { const [r, g, b] = pix(x, y), [tr, tg, tb] = tint; P.put(x, y, `rgb(${Math.min(255, Math.round(r + (tr - r) * k + 18 * k))},${Math.min(255, Math.round(g + (tg - g) * k + 18 * k))},${Math.min(255, Math.round(b + (tb - b) * k + 18 * k))})`); };
  const GLASS = ['#c88aa8', '#8aa0d8', '#d8c878', '#88c8a0', '#a888d0', '#e0a070'].map(hexRGB);
  const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]; // 4×4 베이어
  const glowAt = (x, y, lv, tint) => { // lv 0~1: 칸마다 베이어 문턱으로 켜고, 켜진 칸은 3단계 밝기
    if (x >= CX - 14 && x < CX + 14 && y >= RY0 + 14) return; // 융단 위는 빼기
    const th = (B4[y & 3][x & 3] + 0.5) / 16; if (lv < th * 0.9) return;
    lighten(x, y, tint, lv > 0.72 ? 0.55 : lv > 0.45 ? 0.38 : 0.24); };
  const glassGlow = (wx, dir, tint, tint2) => {
    // 창 둘레 벽: 은은한 후광
    for (let y = top - 2; y < RY0; y++) for (let x = wx - 18; x <= wx + 18; x++) { const d = Math.hypot((x - wx) / 18, (y - (top + 13)) / 16); if (d < 1) glowAt(x, y, (1 - d) * 0.55, tint); }
    // 빛줄기: 창 아래에서 바닥으로 비스듬히 (축에 가까울수록 진하게)
    const y0 = RY0, y1 = RY0 + 24;
    for (let y = y0; y <= y1; y++) { const t = (y - y0) / (y1 - y0), cx = wx + dir * t * 12, w = 8 + t * 5;
      for (let x = Math.floor(cx - w - 2); x <= cx + w + 2; x++) { const e = Math.abs(x - cx) / w; if (e > 1.15) continue; glowAt(x, y, (1 - Math.min(1, e)) * (0.5 + t * 0.25), t > 0.5 ? tint2 : tint); } }
    // 바닥에 맺힌 빛 웅덩이 (가운데가 가장 진함)
    const px = wx + dir * 12, py = RY0 + 24;
    for (let y = py - 8; y <= py + 8; y++) for (let x = px - 20; x <= px + 20; x++) { const d = Math.hypot((x - px) / 19, (y - py) / 7.5); if (d < 1) glowAt(x, y, Math.min(1, (1 - d) * 1.35), GLASS[(Math.floor((x - px + 40) / 6) + Math.floor((y - py + 40) / 4)) % 6]); }
  };
  glassGlow(118, 1, hexRGB('#d8a8c8'), hexRGB('#b8b0e0'));
  glassGlow(266, -1, hexRGB('#e0d098'), hexRGB('#a8c8b8'));
  // ---------------------------------------------------------------- 신도석: 조각한 끝판 · 세로 살 등받이 · 나뭇결 앉는 판 · 접지 그림자, 줄마다 조금씩 어긋나고 손상 · 소품이 다름
  const W = { L: '#a8845e', l: '#9a7a5a', m: '#7e5e44', w: '#6e5038', d: '#4e3626', D: '#33241a', s: '#241812' };
  const PEW_END = ['..k..', '.kLk.', 'kLlmk', 'kLlmk', 'klmdk', 'klDdk', 'kDDDk', 'klDdk', 'klmdk', 'klmdk', 'klmdk', 'klmdk', 'klmdk', 'klmdk', 'klmdk', 'kdddk', 'kkkkk'];
  // o.yo(i): 칸마다 세로로 밀린 정도 (기울어진 · 내려앉은 조각) · o.from/o.to: 그릴 칸 범위 (부서진 조각) · o.endL/o.endR: 끝판 그릴지
  const pew = (x, y, w, o = {}) => {
    const yo = i => (o.yo ? o.yo(Math.max(0, Math.min(w - 1, i))) : 0), Y = i => y + yo(i), from = o.from || 0, to = o.to == null ? w : o.to;
    const gap = o.broken ? [Math.floor(w * o.broken), Math.floor(w * o.broken) + 5] : null, hole = i => (gap && i >= gap[0] && i < gap[1]) || i < from || i >= to;
    // 바닥 그림자
    for (let i = from - 2; i < to + 4; i++) { if (i >= from && i < to && hole(i)) continue; if ((i + y) & 1 || (i > from + 1 && i < to)) P.put(x + i, Y(i) + 13, '#2a2632'); if ((i + y) & 1 && i > from && i < to + 1) P.put(x + i + 1, Y(i) + 14, '#2a2632'); }
    for (let i = from - 1; i <= to; i++) { if (i >= from && i < to && hole(i)) continue; if (gap && i >= gap[0] - 0 && i < gap[1]) continue; P.put(x + i, Y(i) - 1, K); P.put(x + i, Y(i) + 12, K); if (yo(i) !== yo(i - 1)) { P.put(x + i, Y(i) - 2, K); P.put(x + i - 1, Y(i - 1) + 13, K); } }
    for (let i = from; i < to; i++) { if (hole(i)) continue; const X = x + i, yy = Y(i), pi = i % 13, edgeL = pi === 1, edgeR = pi === 12, frame = pi === 0;
      P.put(X, yy, W.L); P.put(X, yy + 1, W.l); P.put(X, yy + 2, W.d); // 위 손잡이 레일
      for (let j = 3; j <= 7; j++) { let c = W.w; if (frame) c = W.m; else if (j === 3 || edgeL) c = W.D; else if (j === 7 || edgeR) c = W.l; else if ((i + j * 3) % 9 === 0) c = W.m; P.put(X, yy + j, c); } // 액자 등판
      P.put(X, yy + 8, W.d); P.put(X, yy + 9, W.L); P.put(X, yy + 10, W.m); P.put(X, yy + 11, W.s); // 찬송가 선반
      if (h2(X, y, 41) < (o.dust || 0.05) && i % 2) P.put(X, yy, '#c8c0b4'); }
    // 선반의 찬송가
    const BK = ['#5e1a20', '#2e4a3a', '#3a3a5e', '#6a4a2a'];
    for (let i = from + 3; i < to - 4; i += 5) { if (hole(i) || hole(i + 3) || h2(i, y, o.seed || 3) < 0.45) continue; const c = BK[Math.floor(h2(i, y, 5) * 4)], n = 1 + (h2(i, y, 6) < 0.4 ? 1 : 0), yy = Y(i);
      for (let k = 0; k < n; k++) { if (Y(i + k * 2 + 1) !== yy) break; P.put(x + i + k * 2, yy + 7, c); P.put(x + i + k * 2 + 1, yy + 7, c); P.put(x + i + k * 2, yy + 8, c); P.put(x + i + k * 2 + 1, yy + 8, '#1a1416'); P.put(x + i + k * 2, yy + 6, K); P.put(x + i + k * 2 + 1, yy + 6, K); } }
    // 부러진 단면: 밝은 속살 + 삐죽한 나무 가시
    const splinter = (gx, dir) => { const yy = Y(gx); P.rect(x + gx, yy - 1, 1, 14, K); for (const j of [0, 1, 3, 4, 5, 8, 9]) P.put(x + gx, yy + j, '#c8a878'); P.put(x + gx + dir, yy + 1, '#c8a878'); P.put(x + gx + dir, yy + 9, '#a8845e'); P.put(x + gx + dir * 2, yy + 1, K); P.put(x + gx + dir, yy, K); P.put(x + gx + dir, yy + 2, K); P.put(x + gx + dir, yy + 8, K); P.put(x + gx + dir, yy + 10, K); P.put(x + gx + dir * 2, yy + 9, K); };
    if (gap) { splinter(gap[0] - 1, 1); splinter(gap[1], -1); }
    if (o.from) splinter(from, -1); if (o.to != null && o.to < w) splinter(to - 1, 1);
    // 끝판 (고딕 머리 + 새긴 십자)
    if (o.endL !== false && from === 0) P.spr(PEW_END, { k: K, L: W.L, l: W.l, m: W.w, d: W.D, D: W.s }, x - 4, Y(0) - 4, false);
    if (o.endR !== false && to === w) P.spr(PEW_END, { k: K, L: W.L, l: W.l, m: W.w, d: W.D, D: W.s }, x + w, Y(w - 1) - 4, false);
    // 소품
    if (o.cloth) { const cx = x + Math.floor(w * o.cloth), yy = Y(Math.floor(w * o.cloth)); for (let i = 0; i < 9; i++) { const d = i < 2 || i > 6 ? 5 : 7; for (let j = 0; j < d; j++) P.put(cx + i, yy + j, j === 0 ? '#a83238' : (i + j) % 4 === 0 ? '#4a1418' : '#7a2428'); P.put(cx + i, yy + d, K); } }
    if (o.candle) { const cx = x + Math.floor(w * o.candle); P.spr(['.k.', 'kwk', 'kwk', 'kWk', 'kkk'], { k: K, w: '#e8e0c8', W: '#c8c0a8' }, cx, Y(Math.floor(w * o.candle)) - 4, false); }
  };
  // 줄마다 조금씩 어긋나게 (격자 느낌 줄이기)
  pew(RX0 + 14, ROWS[0], 78, { seed: 1 });
  pew(RX0 + 12, ROWS[1], 78, { broken: 0.5, dust: 0.08 });
  pew(RX0 + 15, ROWS[2], 78, { candle: 0.3, seed: 3 });
  pew(RX0 + 13, ROWS[3], 78, { cloth: 0.55, dust: 0.1, seed: 4 });
  pew(RX0 + 14, ROWS[4], 78, { broken: 0.42, dust: 0.12 });
  pew(CX + 22, ROWS[0], 78, { dust: 0.06, seed: 6 });
  pew(CX + 24, ROWS[1], 78, { cloth: 0.3, seed: 7 });
  pew(CX + 21, ROWS[2], 78, { broken: 0.62, dust: 0.08 });
  // 오른쪽 넷째 줄: 가운데가 부러져 오른쪽 반이 비스듬히 내려앉은 의자 (종이 떨어질 때 충격)
  pew(CX + 23, ROWS[3], 78, { broken: 0.44, yo: i => i < 39 ? 0 : 1 + Math.floor((i - 39) / 13), dust: 0.12, seed: 8 });

  // ---------------------------------------------------------------- 떨어진 종: 종탑에서 떨어져 신도석을 부수고 바닥에 박힘 — 똑바로 선 청동 종 (꼭대기 고리 · 어깨 · 허리띠 · 넓은 입술) + 금 + 부서진 신도석 조각 · 종추 · 밧줄 · 돌
  refloor(CX + 16, ROWS[4] - 8, RX1 - 2, RY1);
  { const bx = 262, by = ROWS[4] + 10; // 종 입술 가운데 아래
    // 종에 깔려 둘로 갈라진 의자: 양쪽 조각이 종 쪽으로 기울어 내려앉음 · 둘레에 나무 가시 부스러기
    pew(CX + 22, ROWS[4], 78, { to: 25, yo: i => Math.max(0, Math.floor((i - 13) / 4)), dust: 0.14, seed: 9 });
    pew(CX + 22, ROWS[4], 78, { from: 55, yo: i => Math.max(0, Math.floor((67 - i) / 4)), dust: 0.14, seed: 10 });
    for (const [x, y, c] of [[bx - 16, by - 6, '#c8a878'], [bx - 14, by - 3, '#a8845e'], [bx + 15, by - 5, '#c8a878'], [bx + 17, by - 2, '#a8845e'], [bx - 19, by + 1, '#8a6a4a'], [bx + 20, by + 2, '#8a6a4a']]) { P.put(x, y, c); P.put(x + 1, y, '#4e3626'); P.put(x, y + 1, K); }
    // 바닥이 갈라진 자리 + 그림자
    for (let i = -14; i <= 14; i++) for (let j = 0; j < 4; j++) if (((i + j) & 1) || Math.abs(i) < 10 - j * 2) P.put(bx + i, by + j, '#26222c');
    for (const [x0, y0, x1, y1] of [[bx - 13, by + 1, bx - 22, by + 6], [bx + 12, by + 2, bx + 20, by - 1], [bx + 4, by + 3, bx + 8, by + 9]]) P.line(x0, y0, x1, y1, '#1e1c24');
    // 종: 둥근 어깨 · 살짝 들어간 허리 · 넓게 벌어진 소리 테 · 입술 + 앞쪽 테두리 타원, 왼쪽 위에서 빛 (밝은 줄 하나), 오른쪽 그늘, 녹청 얼룩
    const prof = [3, 4.5, 5.5, 6, 6.5, 6.8, 7, 7, 7, 7, 7.2, 7.4, 7.7, 8, 8.5, 9, 9.8, 10.6, 11.4, 12, 12.3]; // 줄마다 반폭 (좁게)
    const H0 = prof.length, ytop = by - H0 - 2;
    const BR = t => t < 0.06 ? '#6a4614' : t < 0.14 ? '#b08030' : t < 0.24 ? '#f6dc8c' : t < 0.34 ? '#e0b84a' : t < 0.58 ? '#c0902e' : t < 0.78 ? '#9a6e20' : t < 0.92 ? '#7a5418' : '#5a3a10';
    for (let r = 0; r < H0; r++) { const hw = Math.round(prof[r]), y = ytop + r;
      for (let x = -hw - 1; x <= hw + 1; x++) {
        if (Math.abs(x) === hw + 1 || r === 0) { P.put(bx + x, y, K); continue; }
        let c = BR((x + hw) / (hw * 2));
        if (r === 4 || r === 15) c = (x + hw) / (hw * 2) < 0.5 ? '#f0d080' : '#b08030'; // 도드라진 띠 (윗줄 밝게)
        if (r === 5 || r === 16) c = '#6a4614'; // 띠 아래 그늘
        if (r === 8 && Math.abs(x) <= hw - 2 && (x & 1)) c = '#8a6220'; // 새긴 글자 띠 (한 줄)
        if (r > 10 && r < 15 && h2(bx + x, y, 77) < 0.12 && (x + y) & 1) c = '#4a7a6a'; // 녹청
        P.put(bx + x, y, c); } }
    // 입술 앞쪽 테두리 (타원) + 안쪽 어둠
    const rimY = ytop + H0;
    for (let x = -13; x <= 13; x++) { const d = Math.round(Math.sqrt(Math.max(0, 1 - (x / 13.5) ** 2)) * 3);
      P.put(bx + x, rimY, Math.abs(x) > 12 ? K : (x < -4 ? '#f0d080' : x < 4 ? '#c0902e' : '#7a5418'));
      for (let j = 1; j <= d; j++) P.put(bx + x, rimY + j, j === d ? K : (x < 0 ? '#9a6e20' : '#6a4614')); }
    // 머리 고리 (두 갈래 + 가운데 고리)
    P.spr(['..kkkkk..', '.kYOOOOk.', 'kYk...kOk', 'kOk...kOk', 'kkOOOOOkk', '.kOOOOOk.'], { k: K, O: '#9a6e20', Y: '#f0d080' }, bx - 4, ytop - 5, false);
    // 금 (위에서 아래로 갈라짐)
    for (const [x, y] of [[3, 3], [4, 4], [4, 5], [3, 6], [4, 7], [5, 8], [5, 9], [6, 10], [6, 11], [5, 12]]) P.put(bx + x, ytop + y, '#3a2a10');
    // 빠진 종추 · 끊긴 밧줄 · 돌 조각
    P.spr(['.kkk.', 'kIiik', 'kiiIk', '.kkk.'], { k: K, I: '#9a98a6', i: '#5a5866' }, bx + 22, by - 2, false);
    // (끊긴 밧줄은 뺌: 의자 조각과 겹쳐 지저분해 보임)
    for (const [x, y, w, h] of [[bx + 24, by + 5, 5, 3], [bx - 26, by + 6, 4, 2], [bx + 14, by + 8, 3, 2]]) { P.rect(x - 1, y - 1, w + 2, h + 2, '#2e2a36'); P.rect(x, y, w, h, '#625d6a'); P.rect(x, y, w, 1, '#8a8490'); P.rect(x + w - 1, y + 1, 1, h - 1, '#3a3542'); }
  }

  // ---------------------------------------------------------------- 제단: 돌계단 · 주름진 제단보 + 금실 테 · 붉은 띠 (해 문장) · 술 장식 · 촛대 2 · 경전 받침
  { const ax = CX, ay = RY0;
    // 옛 제단 위 초 자국 지우기 (벽돌 벽 다시)
    { const WB = Grid(); bricks(WB, RX0, top, RX1, RY0, { a: '#4e4a58', b: '#46424f', c: '#524e5c', gap: '#26222c', hi: '#5e5a68' }, 5, 10, 5); const wd = WB.g.getImageData(0, 0, GW, GH).data;
      for (let y = ay - 24; y < ay - 12; y++) for (const xs of [[ax - 28, ax - 10], [ax + 10, ax + 28]]) for (let x = xs[0]; x < xs[1]; x++) { const q = (y * GW + x) * 4; P.put(x, y, `rgb(${wd[q]},${wd[q + 1]},${wd[q + 2]})`); } }
    // 계단 2단 (모서리 깎인 돌, 위 밝게)
    // 오른쪽 반기둥 · 바닥 촛대를 왼쪽과 대칭인 자리로 옮김 (제단 가운데 = 191.5)
    { const WB = Grid(); bricks(WB, RX0, top, RX1, RY0, { a: '#4e4a58', b: '#46424f', c: '#524e5c', gap: '#26222c', hi: '#5e5a68' }, 5, 10, 5); const wd = WB.g.getImageData(0, 0, GW, GH).data;
      for (let y = top; y < RY0; y++) for (let x = 221; x < 242; x++) { const q = (y * GW + x) * 4; P.put(x, y, `rgb(${wd[q]},${wd[q + 1]},${wd[q + 2]})`); }
      for (let y = RY0; y < RY0 + 10; y++) for (let x = 234; x < 242; x++) P.put(x, y, (y < RY0 + 2 || ((x + y) & 1)) && y < RY0 + 4 ? '#221e28' : floorAt(x, y)); }
    const halfCol = px => { P.rect(px - 1, top, 8, 28, K); for (let y = top; y < RY0; y++) for (let x = 0; x < 6; x++) { let c = x === 0 ? '#77717e' : x === 5 ? '#3a3542' : (y - top) % 7 === 6 ? '#3e3a46' : '#5e5a68'; if (x > 0 && x < 5 && h2(px + x, y, 140) < 0.07) c = '#4e4a58'; if (x === 2 && (y - top) % 7 === 3) c = '#6a6572'; P.put(px + x, y, c); }
      P.rect(px - 2, top + 2, 10, 2, '#8e8894'); P.rect(px - 2, top + 4, 10, 1, '#45404c'); P.rect(px - 2, RY0 - 3, 10, 3, '#6a6572'); P.rect(px - 2, RY0 - 3, 10, 1, '#8e8894'); P.put(px - 2, top + 2, '#a8a2ae'); P.put(px - 2, RY0 - 3, '#a8a2ae'); };
    halfCol(155); halfCol(223);
    const floorCandle = cx => P.spr(['..k..', '.ccc.', '.ccc.', 'yyyyy', '..b..', '..b..', '..b..', '..b..', '..b..', '..b..', '..b..', '.bbb.', 'bbbbb'], { k: '#2a2228', c: '#e8e0c8', y: '#c09038', b: '#9a7028' }, cx, RY0 - 4);
    floorCandle(233);
    // 돌계단 3단: 단마다 디딤면 3줄(밝게, 앞 모서리 하이라이트) + 챌면 3줄(어둡게, 돌 줄눈) — 아래 단이 앞으로 나와 넓게
    const stair = (x, y, w, s) => { // y = 디딤면 맨 윗줄
      P.rect(x - 1, y - 1, w + 2, 8, K);
      for (let i = 0; i < w; i++) { const X = x + i, joint = (i + s) % 12 === 0;
        P.put(X, y, '#8e8894'); P.put(X, y + 1, h2(X, y, 82) < 0.1 ? '#7e7884' : h2(X, y, 84) < 0.05 ? '#9a94a0' : '#88828e'); P.put(X, y + 2, h2(X, y, 85) < 0.06 ? '#6a6572' : '#b4aeb8'); // 디딤면 (앞 모서리 밝게, 군데군데 이 빠짐)
        P.put(X, y + 3, joint ? '#2e2a36' : '#5e5866'); P.put(X, y + 4, joint ? (h2(X, y, 86) < 0.4 ? '#3e5634' : '#2e2a36') : (h2(X, y, 83) < 0.1 ? '#4a4554' : h2(X, y, 87) < 0.05 ? '#6a6572' : '#55505e')); P.put(X, y + 5, joint ? '#2e2a36' : (h2(X, y, 88) < 0.08 ? '#3a3542' : '#45404c')); } // 챌면 (줄눈에 이끼 · 얼룩)
      P.put(x, y + 2, '#8e8894'); P.put(x + w - 1, y + 2, '#6a6572'); for (let j = 3; j < 6; j++) { P.put(x, y + j, '#6a6572'); P.put(x + w - 1, y + j, '#34303c'); } };
    stair(ax - 46, ay + 13, 92, 2); stair(ax - 40, ay + 7, 80, 9); stair(ax - 34, ay + 1, 68, 5);
    // 제단 몸통 (낮게: 윗면 3줄 + 주름진 보 + 금실 테)
    P.rect(ax - 29, ay - 13, 58, 15, K);
    for (let y = ay - 12; y < ay + 1; y++) for (let x = ax - 28; x < ax + 28; x++) {
      const lx = x - (ax - 28), ly = y - (ay - 12);
      let c;
      if (ly < 3) c = ly === 0 ? '#fbf6ea' : ly === 2 ? '#c8c0ae' : '#ece4d4'; // 윗면
      else { c = ['#d8d0c0', '#e6dece', '#f0e8d8', '#e6dece', '#d4ccba', '#c0b8a6', '#ccc4b2'][lx % 7]; // 세로 주름
        if (ly === 8 || ly === 9) c = (lx % 4 === 0) ? '#fff0a0' : (lx % 4 === 2) ? '#9a7028' : '#e0b040'; // 금실 테
        if (ly === 7 || ly === 10) c = '#8a6a20';
        if (ly > 10) c = '#b8b0a0'; }
      if (lx === 0) c = ly < 3 ? '#e0d8c8' : '#a8a090'; if (lx === 55) c = '#8a8272';
      P.put(x, y, c); }
    for (let x = ax - 27; x < ax + 27; x += 3) { P.put(x, ay + 1, '#c09038'); P.put(x, ay + 2, '#9a7028'); } // 술 장식
    // 가운데 붉은 띠 + 해 문장
    P.rect(ax - 7, ay - 13, 14, 18, K);
    for (let y = ay - 12; y < ay + 4; y++) for (let x = ax - 6; x < ax + 6; x++) { const lx = x - (ax - 6); let c = lx === 0 || lx === 11 ? '#c09038' : lx === 1 ? '#8a2a2e' : lx === 10 ? '#4a1014' : '#661c22'; if (y < ay - 9) c = lx === 0 || lx === 11 ? '#c09038' : '#7a2428'; P.put(x, y, c); }
    for (let x = ax - 6; x < ax + 6; x += 2) P.put(x, ay + 4, '#c09038');
    const sx = ax - 1, sy = ay - 4;
    for (let a = 0; a < 8; a++) { const r = a / 8 * Math.PI * 2; P.put(sx + Math.round(Math.cos(r) * 3.4) + 1, sy + Math.round(Math.sin(r) * 3.4), a % 2 ? '#9a7028' : '#e0b040'); }
    P.rect(sx - 0, sy - 1, 3, 3, '#e0b040'); P.put(sx, sy - 1, '#fff0a0');
    // 경전 받침 + 펼친 경전
    P.spr(['.kkkkk.kkkkk.', 'kpppppkpppplk', 'kplllpkplllPk', 'kpppppkppppPk', '.kkkkkkkkkkk.', '....kWWWk....'], { k: K, p: '#f6eedc', P: '#c8c0a8', l: '#8a7a6a', W: '#6e5038' }, ax - 6, ay - 18, false);
    // 촛대 2: 윗면에 선 금 촛대 (받침 접시 · 기둥) + 초, 좌우 대칭 · 오른쪽만 불
    for (const [cx, lit] of [[ax - 21, false], [ax + 20, true]]) {
      P.spr(['.kk.', 'kwWk', 'kwWk', 'kwWk', 'kwWk', 'kGgk', '.kk.', 'kGgk', 'kkkk'], { k: K, w: '#f0e8d8', W: '#c8c0a8', g: '#9a7028', G: '#e0b040' }, cx - 1, ay - 19, false);
      if (lit) { P.put(cx, ay - 20, '#ff9a3a'); P.put(cx, ay - 21, '#ffd34d'); P.put(cx, ay - 22, '#fff6c8'); } else { P.put(cx, ay - 20, '#2a2228'); P.put(cx + 1, ay - 21, '#5a5866'); P.put(cx, ay - 23, '#45404c'); }
      P.put(cx + 2, ay - 15, '#f0e8d8'); }
    // 무릎 방석 2개 (계단 앞)
    for (const kx of [ax - 32, ax + 24]) P.spr(['.kkkkkk.', 'kRRRRRRk', 'kRrrrrRk', '.kkkkkk.'], { k: K, R: '#8a2a2e', r: '#661c22' }, kx, ay + 21, false);
  }
  // ---------------------------------------------------------------- 양탄자 끝: 닳아 찢어진 끝 (올이 풀린 실 · 구멍), 그 아래는 바닥 판석
  for (let x = CX - 13; x < CX + 13; x++) { const e = RY1 - 3 - Math.floor(h2(x >> 1, 0, 120) * 6) - (Math.abs(x - CX + 3) < 4 ? 3 : 0);
    for (let y = e + 1; y < RY1; y++) P.put(x, y, floorAt(x, y));
    P.put(x, e, '#3a1014'); // 찢어진 가장자리
    if (h2(x, 1, 121) < 0.4) { const n = 1 + Math.floor(h2(x, 2, 121) * 3); for (let k = 1; k <= n && e + k < RY1; k++) P.put(x, e + k, k === n ? '#4a1418' : (x & 1 ? '#8a2a2e' : '#661c22')); } } // 풀린 실
  for (const [hx, hy, hr] of [[CX + 6, RY1 - 18, 2.5], [CX - 7, RY1 - 26, 1.8]]) for (let y = Math.floor(hy - hr); y <= hy + hr; y++) for (let x = Math.floor(hx - hr - 1); x <= hx + hr + 1; x++) { const q = ((x - hx) / (hr + 1)) ** 2 + ((y - hy) / hr) ** 2; if (q < 1) P.put(x, y, floorAt(x, y)); else if (q < 1.6) P.put(x, y, '#3a1014'); } // 구멍
  // ---------------------------------------------------------------- 정문: 문짝 없이 돌기둥 2개로 입구 표시 · 벽 두께 안쪽은 석재 문턱 · 흙길은 벽 바깥부터
  { const y0 = RY1, y1 = RY1 + 6;
    for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = CX - 15; x < CX + 15; x++) { const lx = x - (CX - 15), ly = y - (y0 - 1), seam = lx === 15;
      let c = ly === 4 ? '#45404c' : ly === 0 ? '#625d6a' : (lx < 15 ? '#5a5664' : '#54505e'); // 판석 두 장 (가운데 이음매 · 가로 이음 한 줄)
      if (seam && ly !== 4) c = '#3a3542'; else if (ly === 1 || ly === 5) c = '#66616e'; else if (h2(x, y, 130) < 0.08) c = '#4e4a58';
      if (ly >= 6 && h2(x, y, 131) < (ly - 5) * 0.4 + (((x + y) & 1) ? 0.2 : 0)) c = h2(x, y, 132) < 0.5 ? '#3a3026' : '#2e261e'; // 아래쪽은 흙이 덮음
      P.put(x, y, c); }
    // 돌기둥 (주춧돌 · 세로 홈 기둥 · 머리돌) — 외곽선 한 줄
    for (const px of [CX - 24, CX + 15]) {
      P.rect(px - 1, RY1 - 18, 11, 26, K);
      for (let j = 0; j < 24; j++) for (let i = 0; i < 9; i++) { const y = RY1 - 17 + j; let c;
        if (j < 3) c = j === 0 ? (i === 0 || i === 8 ? '#8a8490' : '#b4aeb8') : j === 1 ? '#9a94a0' : '#5e5866'; // 머리돌
        else if (j >= 21) c = j === 21 ? (i === 0 || i === 8 ? '#77717e' : '#9a94a0') : j === 23 ? '#3a3542' : '#77717e'; // 주춧돌
        else { c = ['#45404c', '#6e6876', '#55505e', '#8a8490', '#9a94a0', '#8a8490', '#55505e', '#6e6876', '#45404c'][i]; if (i > 0 && i < 8 && h2(px + Math.min(i, 8 - i), y, 141) < 0.06) c = '#4e4a58'; } // 원기둥: 가운데 밝게 · 세로 홈 2줄 · 얼룩 (좌우 대칭)
        P.put(px + i, y, c); }
      P.put(px + 4, RY1 - 17, '#c8c2cc'); }
  }
  // 바깥 흙길 (벽 바깥부터): 문턱 바로 앞은 흙이 넓게 → 멀어질수록 좁아지고 풀이 섞임, 반쯤 묻힌 디딤돌 · 자갈 · 풀포기
  for (let y = RY1 + 8; y < GH; y++) for (let x = CX - 22; x < CX + 22; x++) { const v = h2(x, y, 91); P.put(x, y, v < 0.5 ? '#141a14' : '#18201a'); }
  for (let y = RY1 + 8; y < GH; y++) { const t = y - RY1 - 8, w = Math.max(9, 15 - t * 0.4);
    for (let x = Math.floor(CX - w - 2); x < CX + w + 2; x++) { const e = Math.abs(x - CX + 0.5) / w; if (h2(x, y, 97) < (t < 2 ? 1.2 : 0.95) - e * 0.8 + (((x + y) & 1) ? 0.12 : -0.12)) P.put(x, y, h2(x, y, 98) < 0.45 ? '#3a3026' : h2(x, y, 99) < 0.12 ? '#4a3e30' : '#2e261e'); } }
  for (const [x, y] of [[CX - 15, RY1 + 9], [CX + 13, RY1 + 11], [CX - 6, RY1 + 15], [CX + 5, RY1 + 18], [CX - 12, RY1 + 13]]) { P.put(x, y, '#6a6572'); P.put(x + 1, y, '#45404c'); P.put(x, y + 1, '#26222c'); } // 자갈
  for (const [x, y] of [[CX - 18, RY1 + 8], [CX + 17, RY1 + 9], [CX - 11, RY1 + 21], [CX + 12, RY1 + 16]]) { P.put(x, y, '#2e4228'); P.put(x + 1, y - 1, '#3e5634'); P.put(x - 1, y - 1, '#3e5634'); } // 풀포기
    };
  }
  // ---------------------------------------------------------------- v3.18 종이 멈춘 수도원 재점검 (시안 _시안/시작장소_도트개선_2단계재점검_종이멈춘수도원_시안02.html): 다듬은 판석 바닥 · 굽도리 · 장미창 · 무릎 방석 · 융단 구멍 메움 · 세로 홈 돌기둥(캐릭터 가림) · 움직임
  let PRIEST_FG = null;
  {
    const base = SCENES.priest.draw;
    SCENES.priest.draw = function (P) {
    // 바닥 · 벽 자리 알아내기: 판석 · 벽돌을 표시 색으로 칠한 그림을 한 번 더 그림
    const oFS = flagstones, oBR = bricks;
    flagstones = ((Q, x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) Q.put(x, y, '#ff00ff'); });
    bricks = ((Q, x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) Q.put(x, y, '#00ffff'); });
    const PM = Grid(); try { base(PM); } finally { flagstones = oFS; bricks = oBR; }
    base(P);
    const top = RY0 - 28, ax = CX, ay = RY0;
    const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], bay = (x, y) => (B4[y & 3][x & 3] + 0.5) / 16;
    const hx = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'), toHex = (r, g, b) => '#' + hx(r) + hx(g) + hx(b);
    const rgbOf = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const put = (x, y, c) => P.put(x, y, c);
    function blit(M, ol = K) { const key = (x, y) => x + ',' + y; for (const k of M.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!M.has(key(x + dx, y + dy))) put(x + dx, y + dy, ol); } for (const [k, c] of M) { const [x, y] = k.split(',').map(Number); put(x, y, c); } }
    const md = PM.g.getImageData(0, 0, GW, GH).data;
    const isFloor = (x, y) => { const i = (y * GW + x) * 4; return md[i] - md[i + 1] > 40 && md[i + 2] - md[i + 1] > 40; };
    const isWall = (x, y) => { const i = (y * GW + x) * 4; return md[i + 1] - md[i] > 40 && md[i + 2] - md[i] > 40; };
  
    // ================================================================ 1. 바닥: 다듬은 네모 판석 (벽돌보다 크고 밝은 돌 · 반 장씩 엇갈림 · 모서리 깎임 · 금 · 얼룩)
    const FS = { a: '#5e5a66', b: '#58545f', c: '#64606c', hi: '#726e7a', hi2: '#6a6672', sh: '#4c4856', gap: '#2a2632', sp: '#77737e', dk: '#4e4a58' };
    const floorAt = (x, y) => { const SW = 20, SH = 12, row = Math.floor((y - RY0) / SH), ly = (y - RY0) % SH, off = (row & 1) ? SW / 2 : 0, col = Math.floor((x - RX0 + off) / SW), lx = (x - RX0 + off) % SW, id = row * 53 + col, v = h2(id, 3, 801);
      let c = v < 0.34 ? FS.a : v < 0.7 ? FS.b : FS.c; const corner = (lx === 0 || lx === SW - 1) && (ly === 0 || ly === SH - 1);
      if (ly === SH - 1 || lx === SW - 1 || corner) c = FS.gap; else if (ly === 0) c = FS.hi; else if (lx === 0) c = FS.hi2; else if (ly === SH - 2 || lx === SW - 2) c = FS.sh;
      else { const n = h2(x, y, 802); if (n < 0.05) c = FS.sp; else if (n > 0.95) c = FS.dk; if (h2(id, 4, 801) < 0.18) { const cx0 = 3 + Math.floor(h2(id, 5, 801) * (SW - 6)), cxp = cx0 + Math.round((ly - 1) * (h2(id, 6, 801) < 0.5 ? 0.8 : -0.8)); if (lx === cxp && ly > 1 && ly < SH - 3) c = FS.gap; } }
      return c; };
    const D1 = P.g.getImageData(0, 0, GW, GH).data;
    for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) if (isFloor(x, y)) put(x, y, floorAt(x, y));
    // 색유리 빛 (바닥 부분만 다시): 창 아래에서 비스듬히 떨어지는 빛줄기 + 빛 웅덩이 — 디더 글로우
    { const D = P.g.getImageData(0, 0, GW, GH).data;
      const GLASS = ['#c88aa8', '#8aa0d8', '#d8c878', '#88c8a0', '#a888d0', '#e0a070'].map(rgbOf);
      const glowAt = (x, y, lv, tint) => { if (!isFloor(x, y)) return; if (x >= CX - 14 && x < CX + 14 && y >= RY0 + 14) return; if (lv < bay(x, y) * 0.9) return; const k = lv > 0.72 ? 0.55 : lv > 0.45 ? 0.38 : 0.24, i = (y * GW + x) * 4, r = D[i], g = D[i + 1], b = D[i + 2];
        put(x, y, toHex(r + (tint[0] - r) * k + 18 * k, g + (tint[1] - g) * k + 18 * k, b + (tint[2] - b) * k + 18 * k)); };
      for (const [wx, dir, t1, t2] of [[118, 1, '#d8a8c8', '#b8b0e0'], [266, -1, '#e0d098', '#a8c8b8']]) { const tint = rgbOf(t1), tint2 = rgbOf(t2), y0 = RY0, y1 = RY0 + 24;
        for (let y = y0; y <= y1; y++) { const t = (y - y0) / (y1 - y0), cx = wx + dir * t * 12, w = 8 + t * 5; for (let x = Math.floor(cx - w - 2); x <= cx + w + 2; x++) { const e = Math.abs(x - cx) / w; if (e > 1.15) continue; glowAt(x, y, (1 - Math.min(1, e)) * (0.5 + t * 0.25), t > 0.5 ? tint2 : tint); } }
        const px = wx + dir * 12, py = RY0 + 24; for (let y = py - 8; y <= py + 8; y++) for (let x = px - 20; x <= px + 20; x++) { const d = Math.hypot((x - px) / 19, (y - py) / 7.5); if (d < 1) glowAt(x, y, Math.min(1, (1 - d) * 1.35), GLASS[(Math.floor((x - px + 40) / 6) + Math.floor((y - py + 40) / 4)) % 6]); } } }
    // 굽도리: 벽 맨 아래 4줄 (벽 자리만) — 큰 받침돌 · 윗면 밝은 턱
    for (let y = RY0 - 4; y < RY0; y++) for (let x = RX0; x < RX1; x++) { if (!isWall(x, y)) continue; const ly = y - (RY0 - 4), id = Math.floor((x - RX0 + 7) / 21), lx = (x - RX0 + 7) % 21, v = h2(id, 9, 851);
      let c = v < 0.5 ? '#46424f' : '#403c4a'; if (ly === 0) c = '#6a6572'; else if (ly === 1) c = '#524e5c'; else if (lx === 20) c = '#1e1c24'; else if (ly === 3) c = '#2e2a36'; else if (lx === 0) c = '#4e4a58'; put(x, y, c); }
    for (let x = RX0; x < RX1; x++) if (isWall(x, RY0 - 5)) put(x, RY0 - 5, '#26222c');
  
    // ================================================================ 2. 융단: 회색 얼룩(작은 구멍 · 큰 회색 자리) → 융단 무늬로 메움. 진짜 구멍(테두리 있는 것)만 남김
    { const x0 = CX - 13, y0 = RY0 + 14, GRAY = new Set(['#54505e', '#4e4a58']);
      const rug = (x, y) => { const lx = x - x0, ly = y - y0; let c = lx === 0 || lx === 25 ? '#3a1014' : lx === 1 || lx === 24 ? '#b08a38' : lx === 2 || lx === 23 ? '#4a1418' : '#661c22';
        if (lx > 3 && lx < 22) { const dx = Math.abs(lx - 12.5), dy = Math.abs((ly % 14) - 7); if (Math.abs(dx + dy - 5) < 0.6) c = '#8a2a2e'; else if (dx + dy < 2) c = '#a0703a'; } return c; };
      for (let y = y0; y < RY1 - 2; y++) for (let x = x0; x < x0 + 26; x++) { const i = (y * GW + x) * 4, c = toHex(D1[i], D1[i + 1], D1[i + 2]); if ((GRAY.has(c) && !isFloor(x, y)) || (y < RY1 - 12 && x - x0 > 2 && x - x0 < 23 && (isFloor(x, y) || c === '#3a1014'))) put(x, y, rug(x, y)); } }
  
    // ================================================================ 3. 장미창: 제단 위 가운데 반쯤 가려진 창 → 온전히 보이는 둥근 장미창 (돌 테두리 · 여덟 갈래 창살 · 꽃잎 색유리 · 가운데 금빛 원)
    { const WB = Grid(); oBR(WB, RX0, top, RX1, RY0, { a: '#4e4a58', b: '#46424f', c: '#524e5c', gap: '#26222c', hi: '#5e5a68' }, 5, 10, 5); const wd = WB.g.getImageData(0, 0, GW, GH).data;
      for (let y = top; y < ay - 13; y++) for (let x = CX - 12; x < CX + 12; x++) { const q = (y * GW + x) * 4; put(x, y, toHex(wd[q], wd[q + 1], wd[q + 2])); }
      const rcx = CX - 0.5, rcy = top + 8, R1 = 7.6;
      const GL = ['#a86a8a', '#6a82b8', '#b8a86a', '#6ab88a', '#8a6ab8', '#c08a5a'];
      for (let y = Math.floor(rcy - R1 - 2); y <= rcy + R1 + 2; y++) for (let x = Math.floor(rcx - R1 - 2); x <= rcx + R1 + 2; x++) { const dx = x + 0.5 - rcx - 0.5, dy = y + 0.5 - rcy - 0.5, r = Math.hypot(dx, dy); if (r > R1 + 1.6) continue; const a = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
        let c; if (r > R1 + 0.6) c = K; else if (r > R1 - 0.6) c = dy < 0 && dx < 2 ? '#a8a2ae' : dy < 0 ? '#8a8490' : '#5e5866'; else if (r > R1 - 1.6) c = '#3a3642';
        else if (r < 2.2) c = r < 1.2 ? '#fff0a0' : '#c09038'; else if (r < 3) c = '#1a1820';
        else { const seg = Math.floor(a / (Math.PI / 4)), sa = a - (seg + 0.5) * Math.PI / 4; if (Math.abs(sa) * r < 0.55) c = '#1a1820'; else { const petal = r < 5.4 ? GL[seg % 6] : GL[(seg + 3) % 6]; c = Math.abs(r - 5.4) < 0.5 ? '#1a1820' : petal; if (r >= 5.9 && Math.abs(sa) * r < 1.4) c = GL[(seg + 1) % 6]; } }
        put(x, y, c); }
      // 창 둘레 은은한 후광 (벽만)
      const D = P.g.getImageData(0, 0, GW, GH).data, tint = rgbOf('#c8b0e0');
      for (let y = top; y < ay - 12; y++) for (let x = CX - 22; x < CX + 22; x++) { if (!isWall(x, y)) continue; const r = Math.hypot(x + 0.5 - rcx - 0.5, y + 0.5 - rcy - 0.5); if (r <= R1 + 1.6 || r > R1 + 9) continue; const lv = (1 - (r - R1 - 1.6) / 7.4) * 0.55; if (lv < bay(x, y) * 0.9) continue; const k = lv > 0.45 ? 0.3 : 0.18, i = (y * GW + x) * 4;
        put(x, y, toHex(D[i] + (tint[0] - D[i]) * k + 12 * k, D[i + 1] + (tint[1] - D[i + 1]) * k + 12 * k, D[i + 2] + (tint[2] - D[i + 2]) * k + 12 * k)); }
      // 경전 받침 다시 (창 앞)
      P.spr(['.kkkkk.kkkkk.', 'kpppppkpppplk', 'kplllpkplllPk', 'kpppppkppppPk', '.kkkkkkkkkkk.'], { k: K, p: '#f6eedc', P: '#c8c0a8', l: '#8a7a6a', W: '#6e5038' }, ax - 6, ay - 14, false); }
  
    // ================================================================ 4. 무릎 방석 둘: 빨간 막대 → 통통한 방석 (윗면 밝음 · 누빈 단추 · 네 귀 금 술)
    for (const kx of [ax - 32, ax + 24]) { for (let y = ay + 20; y < ay + 26; y++) for (let x = kx - 1; x < kx + 10; x++) if (isFloor(x, y)) put(x, y, floorAt(x, y));
      P.spr(['y.kkkkkkk.y', '.kLLLLLLLk.', 'kLRRbRRbRrk', 'kRRRRRRRRrk', 'krrrrrrrrdk', 'y.kkkkkkk.y'], { k: K, L: '#b04a4a', R: '#8a2a2e', r: '#661c22', d: '#4a1418', b: '#c09038', y: '#e0b040' }, kx - 1, ay + 20, false);
      for (let x = kx; x < kx + 9; x++) if ((x & 1) && isFloor(x, ay + 26)) put(x, ay + 26, '#2a2632'); }
  
    // ================================================================ 5. 정문 돌기둥 (좌우 대칭): 넓은 머릿돌 + 마름돌 몸통 + 받침돌 + 기둥 위 뾰족 돌탑 장식, 캐릭터를 가림
    { const y0b = RY1, cap = { t: '#6a6572', m: '#55505e', d: '#34303c' };
      // 옛 기둥 지우기 → 바닥 · 벽 띠 · 바깥
      for (const px of [CX - 24, CX + 15]) for (let y = RY1 - 19; y < RY1 + 9; y++) for (let x = px - 2; x < px + 11; x++) { let c; if (y < RY1) c = floorAt(x, y); else if (y === RY1 || y === RY1 + 6) c = K; else if (y < RY1 + 6) c = y === RY1 + 5 ? cap.d : cap.m; else c = h2(x, y, 91) < 0.5 ? '#141a14' : '#18201a'; put(x, y, c); }
      // 바깥: 풀밭 + 흙길 (깔끔한 디더)
      for (let y = RY1 + 7; y < GH; y++) for (let x = 0; x < GW; x++) { const v = h2(x >> 1, y, 901) * 0.6 + h2(x, y, 902) * 0.4; put(x, y, ['#141a14', '#18201a', '#1c241c', '#202a1e'][v < 0.35 ? 0 : v < 0.65 ? 1 : v < 0.88 ? 2 : 3]); }
      for (let x = 0; x < GW; x++) { const n = h2(x, 1, 903); if (n < 0.4 || Math.abs(x - CX) < 16) continue; for (let j = 0; j < 1 + Math.floor((n - 0.4) * 5); j++) put(x, RY1 + 9 - j, n > 0.8 ? '#3a4a30' : '#2a3824'); }
      for (let y = RY1 + 7; y < GH; y++) { const w = 14 - Math.min(5, (y - RY1 - 7) * 0.2); for (let x = Math.floor(CX - w - 2); x < CX + w + 2; x++) { const d = Math.abs(x - CX + 0.5) / w; if (bay(x, y) < (1 - d) * 1.7 - 0.25) put(x, y, h2(x, y, 905) < 0.5 ? '#3a3026' : '#33291f'); } }
      for (const [x, y] of [[CX - 6, RY1 + 13], [CX + 5, RY1 + 18], [CX - 12, RY1 + 20]]) { put(x, y, '#6a6572'); put(x + 1, y, '#45404c'); put(x, y + 1, '#26222c'); put(x + 1, y + 1, '#26222c'); }
      // 문턱 아래쪽 흙 (벽 두께 안 아랫줄)
      const FGK = [];
      const pillar = (px) => { const W2 = 14, y0 = RY1 - 19, y1 = RY1 + 7, M = new Map(), set = (x, y, c) => M.set((px + x) + ',' + y, c);
        for (let y = y0; y < y1; y++) { const j = y - y0;
          if (j < 4) { for (let x = 0; x < W2; x++) set(x, y, j === 0 ? (x === 0 ? '#9a94a0' : '#a8a2ae') : x === 0 ? '#8a8490' : x === W2 - 1 ? '#6a6572' : (h2(x, y, 912) < 0.1 ? '#77717e' : '#8a8490')); continue; }
          if (j < 6) { for (let x = 0; x < W2; x++) set(x, y, j === 4 ? (x === W2 - 1 ? '#46424e' : '#625d6a') : '#4e4a56'); continue; }
          if (y >= y1 - 4) { for (let x = 0; x < W2; x++) { const k = y - (y1 - 4); set(x, y, k === 0 ? (x === W2 - 1 ? '#625d6a' : '#8a8490') : x === 0 ? '#5e5866' : x === W2 - 1 ? '#3a3542' : '#4e4a56'); } continue; }
          // 몸통: 세로 홈이 파인 둥근 기둥 (가운데 왼쪽이 가장 밝은 원통 명암 · 홈 3줄은 한 단 어둡게 · 위 목둘레 고리)
          const SHF = ['#5e5866', '#8a8490', '#9a94a0', '#a8a2ae', '#9a94a0', '#8a8490', '#77717e', '#6a6572', '#5a5562', '#4e4a56', '#3e3a46', '#34303c'], GROOVE = { 2: 1, 5: 1, 8: 1 }, DK2 = { '#9a94a0': '#6e6878', '#8a8490': '#625d6a', '#77717e': '#55505e', '#5a5562': '#46424e' };
          for (let x = 1; x < W2 - 1; x++) { let c = SHF[x - 1]; if (GROOVE[x - 1]) c = DK2[c] || '#46424e';
            if (j === 6) c = '#2a2630'; else if (j === 7) c = x - 1 < 4 ? '#b4aeb8' : x - 1 < 8 ? '#8a8490' : '#55505e'; else if (j === 8) c = '#46424e';
            if (j > 8 && h2(x, y, 913) < 0.05 && !GROOVE[x - 1]) c = '#625d6a';
            set(x, y, c); } }
        // 뾰족 돌탑 장식: 받침 두 단 + 위로 좁아지는 탑 (왼쪽 면 밝음 · 오른쪽 면 어둠) + 꼭대기 구슬
        for (let x = 3; x < 11; x++) { set(x, y0 - 1, x === 3 ? '#77717e' : x === 10 ? '#46424e' : '#5e5866'); set(x, y0 - 2, x === 10 ? '#77717e' : '#a8a2ae'); }
        for (let j = 0; j < 8; j++) { const hw = 3 - Math.floor(j * 0.4), yy = y0 - 3 - j; for (let x = 7 - hw; x < 7 + hw; x++) set(x, yy, x < 7 ? (x === 7 - hw ? '#9a94a0' : '#8a8490') : (x === 6 + hw ? '#3a3642' : '#55505e')); }
        set(6, y0 - 11, '#9a94a0'); set(7, y0 - 11, '#5e5866'); set(6, y0 - 12, '#c0bac6'); set(7, y0 - 12, '#77717e'); set(6, y0 - 13, '#a8a2ae');
        blit(M);
        FGK.push([...M.keys()].concat([...M.keys()].flatMap(k => { const [x, y] = k.split(',').map(Number); return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => (x + dx) + ',' + (y + dy)); })));
      };
      pillar(CX - 28); pillar(CX + 15);
      const D0 = P.g.getImageData(0, 0, GW, GH).data; PRIEST_FG = FGK.map(keys => ({ base: RY1 + 7, pix: [...new Set(keys)].map(k => { const [x, y] = k.split(',').map(Number), i = (y * GW + x) * 4; return [x, y, toHex(D0[i], D0[i + 1], D0[i + 2])]; }) })); }
  
    // ================================================================ 6. 바닥 촛대 둘 · 제단 오른쪽 초: 불꽃은 움직임에서 그림 (지금 그려진 불꽃 칸 지우기)
    { const WB = Grid(); oBR(WB, RX0, top, RX1, RY0, { a: '#4e4a58', b: '#46424f', c: '#524e5c', gap: '#26222c', hi: '#5e5a68' }, 5, 10, 5); const wd = WB.g.getImageData(0, 0, GW, GH).data;
      for (let y = ay - 23; y <= ay - 20; y++) for (let x = ax + 19; x <= ax + 21; x++) { const q = (y * GW + x) * 4; put(x, y, toHex(wd[q], wd[q + 1], wd[q + 2])); } }
  };
  }
  SCENES.priest.fg = () => PRIEST_FG;
  // ================================================================ 움직임: 촛불 · 꺼진 초 연기 · 색유리 빛 속 색 먼지 · 바람 (찢어진 융단 끝 · 담쟁이)
  SCENES.priest.fx = (t, cell) => {
    const [RX0, RY0, RX1, RY1] = SCENES.priest.room || ROOM0, CX = (RX0 + RX1) / 2, top = RY0 - 28, ax = CX, ay = RY0;
    const gt = t % 8.7, gust = gt < 1.4 ? Math.sin(Math.PI * gt / 1.4) : 0;
    // 촛불: 제단 오른쪽 초 · 바닥 촛대 둘 (심지 위 2~3칸이 박자 다르게 바뀜)
    for (const [x, y, sd] of [[ax + 20, ay - 20, 1], [148, RY0 - 4, 2], [235, RY0 - 4, 3]]) { const f = Math.floor(h2(Math.floor(t * 8 + sd * 3.1), sd, 961) * 4);
      cell(x, y, '#2a2228', 1);
      const F = [[[0, -1, '#ff9a3a'], [0, -2, '#ffd34d'], [0, -3, '#fff6c8']], [[0, -1, '#ff9a3a'], [0, -2, '#ffe9a0'], [1, -3, '#ffd34d']], [[0, -1, '#ff9a3a'], [0, -2, '#ffd34d']], [[0, -1, '#ff9a3a'], [0, -2, '#ffd34d'], [-1, -3, '#ffe9a0'], [0, -4, '#ff9a3a']]][f];
      for (const [dx, dy, c] of F) cell(x + dx + (gust > 0.6 && dy < -2 ? 1 : 0), y + dy, c, 1); }
    // 꺼진 왼쪽 초: 가는 연기가 굽이치며 올라가 사라짐
    for (let i = 0; i < 6; i++) { const ph = ((t * 0.35 + i / 6) % 1), x = ax - 21 + Math.round(Math.sin(ph * 7 + t * 1.3) * (0.4 + ph * 1.6)), y = Math.round(ay - 23 - ph * 12), a = (1 - ph) * 0.55; if (a > 0.05) cell(x, y, '#8a8494', a); }
    // 색유리 빛 속 먼지: 빛줄기를 따라 천천히 내려가며 지나는 칸의 유리 색을 띰
    const GL = ['#e8b0c8', '#b0c0f0', '#f0e0a0', '#b0e8c8', '#c8b0f0', '#f8c8a0'];
    for (const [wx, dir, s0] of [[118, 1, 0], [266, -1, 6]]) for (let i = 0; i < 6; i++) { const sp = 0.015 + h2(i, 1, 962 + s0) * 0.012, ph = (t * sp + h2(i, 2, 962 + s0)) % 1, tt = ph, y = RY0 - 4 + tt * 30, cx = wx + dir * tt * 12, w = 7 + tt * 5, x = cx + (h2(i, 3, 962 + s0) - 0.5) * 2 * w + Math.sin(t * 0.8 + i * 1.9) * 1.4;
      const a = Math.min(1, Math.min(ph, 1 - ph) * 6) * 0.8; if (a > 0.05) cell(Math.round(x), Math.round(y), GL[(Math.floor(x / 6) + Math.floor(y / 4) + 60) % 6], a); }
    // 장미창 빛 속 먼지 셋 (제단 위)
    for (let i = 0; i < 3; i++) { const ph = (t * 0.02 + i / 3) % 1, x = CX - 6 + i * 6 + Math.sin(t * 0.7 + i) * 2, y = top + 18 + ph * 10, a = Math.min(1, Math.min(ph, 1 - ph) * 5) * 0.6; cell(Math.round(x), Math.round(y), GL[i * 2], a); }
    // 바람: 찢어진 융단 끝 실이 들썩 · 담쟁이 잎 흔들림
    if (gust > 0.3) { for (let x = CX - 12; x < CX + 12; x += 3) { const e = RY1 - 3 - Math.floor(h2(x >> 1, 0, 120) * 6) - (Math.abs(x - CX + 3) < 4 ? 3 : 0); if (h2(x, 1, 121) < 0.4) cell(x + 1, e + 1 + Math.floor(h2(x, 2, 121) * 3), x & 1 ? '#8a2a2e' : '#661c22', 1); } }
    for (let i = 0; i < 30; i += 3) { const x = RX1 - 2 - Math.floor(h2(i, 1, 903) * 16 * (1 - i / 40)), y = top + Math.floor(i * 0.9); if (y >= RY0) break; if (gust > 0.35 && i % 2 === 0) { cell(x - 1, y, '#4e6e3c', 1); cell(x - 2, y + 1, '#3e5634', 0.8); } }
  };
  SCENES.priest.lights = [{ x: 118, y: 40, r: 36, a: 0.32, c: [190, 120, 170], fl: 11 }, { x: 192, y: 26, r: 34, a: 0.34, c: [170, 150, 220], fl: 12 }, { x: 266, y: 40, r: 36, a: 0.32, c: [200, 190, 120], fl: 13 }, { x: 192, y: 205, r: 50, a: 0.35, c: [230, 140, 90] }, { x: 192, y: 92, r: 30, a: 0.22 },
    { x: 212, y: 20, r: 14, a: 0.35, c: [255, 190, 100], fl: 1 }, { x: 148, y: 34, r: 14, a: 0.35, c: [255, 190, 100], fl: 2 }, { x: 235, y: 34, r: 14, a: 0.35, c: [255, 190, 100], fl: 3 }];
  SCENES.priest.lights.push({ x: 128, y: 66, r: 24, a: 0.42, c: [210, 150, 220] }, { x: 256, y: 66, r: 24, a: 0.42, c: [220, 200, 130] }); // v3.18 색유리 빛이 바닥에 맺힌 자리도 광원
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
      for (const [gx, gy] of [[112, 110], [144, 110], [176, 110], [112, 146], [144, 146], [176, 146]]) T.shOval(GR, gx + 3, gy + 1.5, 8, 2.4, '#141c12', gx + gy, 1.3);
      T.shOval(GR, 176, 75, 10, 2.4, '#141c12', 711, 1.3); T.shOval(GR, 245, 150, 18, 2.6, '#141c12', 712, 1.2); T.shOval(GR, 280, 156, 15, 2.2, '#141c12', 713, 1.2);
      T.shOval(GR, 92, 172, 6, 1.8, '#141c12', 714, 1.3); T.shOval(GR, 304, 172, 6, 1.8, '#141c12', 715, 1.3); T.shOval(GR, 128, 84, 44, 3, '#141c12', 716, 1);
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
  // v3.19 단군 대기 동작: 꽂아 둔 단도를 뽑아 → 돌리며 위로 던졌다 받고 → 손끝에서 빙글빙글 → 역수로 고쳐 쥐고 번쩍 → 바닥에 내리꽂음 (떨림 · 먼지)
  const DG_ROT = {};
  function dagRot(i) { i = ((i % 16) + 16) % 16; if (DG_ROT[i]) return DG_ROT[i]; // 16방향 (0 = 칼끝이 아래) · 그림 가운데(11,11)칸이 손잡이
    const N = 23, a = i / 16 * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), g = Array.from({ length: N }, () => Array(N).fill('.'));
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = x + 0.5 - 11.5, v = y + 0.5 - 11.5, sx = Math.floor(ca * u + sa * v + 1.5), sy = Math.floor(-sa * u + ca * v + 2.5); const r = DAGGER[sy]; if (r && r[sx] && r[sx] !== '.') g[y][x] = r[sx]; }
    return (DG_ROT[i] = gCanvas(gOutline(g), DAGGER_PAL)); }
  const DG_CYC = 14, DG_T = { reach: 6.0, pull: 6.25, toss1: 6.45, catchR: 7.05, spinR: 7.3, toss2: 8.2, catchL: 8.8, spinL: 9.05, flour: 9.95, throw: 10.35, stuck: 10.53, done: 10.95 };
  function dgAnim(t, p, dp) { // t: 한 바퀴(14초) 안의 시각 · p: 단군 발 · dp: 단도 꽂힌 자리 → 단도 · 앞발 · 자세
    // 뽑기 → 머리 위로 던져 오른손으로 받기 → 멈춤 → 돌리기 → 왼손으로 던져 받기 → 멈춤 → 돌리기 → 역수로 쥐고 번쩍 → 바닥에 내리꽂기
    const grip0 = { x: dp.x, y: dp.y - 11 }, L = { x: p.x - 9, y: p.y - 17 }, R = { x: p.x + 9, y: p.y - 17 }, T = DG_T, ease = k => k * k * (3 - 2 * k);
    const toss = (k, a, b) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k - 26 * 4 * k * (1 - k) }); // 머리 위로 넘어가는 포물선
    const hold = (t0, h, side) => { const hh = t - t0 < 0.08 ? { x: h.x, y: h.y + 2 } : h; return { dag: { x: hh.x, y: hh.y, i: 0 }, paw: hh, side }; }; // 탁 받고 잠깐 멈춤 (받는 순간 앞발이 한 칸 눌림)
    const spin = (t0, t1, h, side) => { const k = (t - t0) / (t1 - t0), sp = 0.5 - 0.5 * Math.cos(Math.PI * k), d = side; return { dag: { x: h.x, y: h.y, i: Math.round(sp * 32) * d }, paw: h, side, arc: { a: sp * 2 * Math.PI * 2 * d, v: Math.sin(Math.PI * k), d } }; }; // 두 바퀴 (빨라졌다 느려짐 · 오른손은 반대로 돎)
    if (t < T.reach || t >= T.done + 0.6) return { stuck: true };
    if (t < T.pull) return { stuck: true, lean: -1, crouch: true, paw: grip0, side: -1 };
    if (t < T.toss1) { const k = (t - T.pull) / (T.toss1 - T.pull), y = grip0.y - 8 * ease(k); return { dag: { x: grip0.x, y, i: 0 }, paw: { x: grip0.x, y }, lean: -1, side: -1 }; }
    if (t < T.catchR) { const k = (t - T.toss1) / (T.catchR - T.toss1), q = toss(k, { x: grip0.x, y: grip0.y - 8 }, R); return { dag: { x: q.x, y: q.y, i: -Math.round(k * 32) }, look: true }; }
    if (t < T.spinR) return hold(T.catchR, R, 1);
    if (t < T.toss2) return spin(T.spinR, T.toss2, R, 1);
    if (t < T.catchL) { const k = (t - T.toss2) / (T.catchL - T.toss2), q = toss(k, R, L); return { dag: { x: q.x, y: q.y, i: Math.round(k * 32) }, look: true }; }
    if (t < T.spinL) return hold(T.catchL, L, -1);
    if (t < T.flour) return spin(T.spinL, T.flour, L, -1);
    if (t < T.throw) { const k = (t - T.flour) / (T.throw - T.flour); return { dag: { x: L.x, y: L.y, i: 8 }, paw: L, side: -1, glint: k > 0.25 && k < 0.75, tail: true }; } // 역수로 고쳐 쥐고 칼끝이 위에서 번쩍
    if (t < T.stuck) { const k = (t - T.throw) / (T.stuck - T.throw); return { dag: { x: L.x + (grip0.x - L.x) * k, y: L.y + (grip0.y - L.y) * k, i: 0 }, lean: -1 }; }
    if (t < T.done) { const k = (t - T.stuck) / (T.done - T.stuck), w = Math.floor(k * 14) % 2 ? 2 : -2; return { stuck: true, wob: k < 0.8 ? w : 0, hit: t - T.stuck < 0.05 }; } // 꽂히며 떨림
    return { stuck: true, pose: true };
  }
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
    '단도 건들지 마라냥. 손목 날아간다냥.',
    '역마차가 끊긴 지 오래다냥. 그래도 소문은 마차보다 빠르다냥. 길은 끊겨도 내 장사는 안 끊긴다냥.',
    '넌 일은 깔끔한데 말이 없어서 좋다냥. 말 많은 놈은 꼭 수수료를 깎으려 든다냥.',
    '왕도 쪽 의뢰는 다들 피한다냥. 돌아온 놈이 없으니 보수를 받아 간 놈도 없다냥. …그러니 네가 첫 번째가 되라냥.'];
  SCENES.ranger.npc = { x: 238, y: 78, dag: [231, 80] };
  // v3.11 하비: 그레이브의 라이벌이자 마지막 남은 동료 (흰 고양이 · 허리 뒤에 일자로 맨 더블배럴 샷건). 대사는 나중에
  const HABI = {"f":{"base":["..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaanwwwnwwAkkHk...",".KKKKKkaaauwwwuwAAkkHk...","KBbbbbbkaawwNwwAAkKkHkKK.","KBBBBBBBkk11SSSkkBskHkssK","KBbbbbbk23CCBCCCckskHkssK",".KKKKKKkAk23xCckakkWWkssK","........kCCCkCCCkkWWkSSSK",".........kFFk.kFFkkkKKKK.",".........kkkk.kkkk......."],"baseB":["..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaaawwwawwAkkHk...",".KKKKKkaaanwwwnwAAkkHk...","KBbbbbbkaawwNwwAAkKkHkKK.","KBBBBBBBkk11SSSkkBskHkssK","KBbbbbbk23CCBCCCckskHkssK",".KKKKKKkAk23xCckakkWWkssK","........kCCCkCCCkkWWkSSSK",".........kFFk.kFFkkkKKKK.",".........kkkk.kkkk......."],"idle":[".........................","..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaanwwwnwwAkkHk...",".KKKKKkaaauwwwuwAAkkHk...","KBbbbbbkaawwNwwAAkKkHkKK.","KBBBBBBBkk11SSSkkBskHkssK","KBbbbbbk23CCBCCCckskHkssK",".KKKKKKkAk23xCckakkWWkssK",".........kFFk.kFFkkkSSSSK",".........kkkk.kkkkKKKKKK."],"idleB":[".........................","..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaaawwwawwAkkHk...",".KKKKKkaaanwwwnwAAkkHk...","KBbbbbbkaawwNwwAAkKkHkKK.","KBBBBBBBkk11SSSkkBskHkssK","KBbbbbbk23CCBCCCckskHkssK",".KKKKKKkAk23xCckakkWWkssK",".........kFFk.kFFkkkSSSSK",".........kkkk.kkkkKKKKKK."]},"p":{"1":"#b9b9c3","2":"#a9a9b4","3":"#8f8f9b","A":"#d8d4cc","B":"#5a5a62","C":"#c9c9d1","F":"#8a8a96","H":"#fbf9f5","K":"#0b0a0e","N":"#e8909a","S":"#4a3020","W":"#dcd8d0","a":"#fbf9f5","b":"#8d9097","c":"#dcdce2","k":"#0b0a0e","n":"#16120e","p":"#eaa4a8","s":"#6b4a2a","u":"#cfa628","w":"#fbf9f5","x":"#5e5e6a"}};
  // ---------------------------------------------------------------- v3.18 이름 없는 묘지 도트 개선 (시안 _시안/시작장소_도트개선_5단계_이름없는묘지_시안09.html): 갓돌 담 · 앞 담 쇠창살 울타리 · 마름돌 정문 기둥 + 쇠 아치 + 쇠문짝 · 무덤을 피하는 흙길 · 짙은 천 천막 · 짐 상자 · 물통 · 무덤 어긋나게 + 봉분 · 관 디테일 · 판 무덤 구덩이 · 흙더미 · 삽 · 쌓은 목재 · 탄약 작업대 · 큰 마른 나무 · 붙은 그림자 · 밤 색 보정 · 좁은 불빛 · 디더 어둠 · 움직임
  let GRAVE_FG = null, GRAVE_FLAMES = null, GRAVE_BG = null;
  {
    const base = SCENES.gunner.draw;
    SCENES.gunner.draw = function (P) {
    base(P);
    const CX = (RX0 + RX1) / 2, top = RY0 - 16;
    const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], bay = (x, y) => (B4[y & 3][x & 3] + 0.5) / 16;
    const hx = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'), toHex = (r, g, b) => '#' + hx(r) + hx(g) + hx(b);
    const rgbOf = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const put = (x, y, c) => P.put(x, y, c);
    function blit(M, ol = K) { const key = (x, y) => x + ',' + y; for (const k of M.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!M.has(key(x + dx, y + dy))) put(x + dx, y + dy, ol); } for (const [k, c] of M) { const [x, y] = k.split(',').map(Number); put(x, y, c); } }
    const segDist = (x, y, pts, sy = 1.5) => { let best = 1e9; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy))); best = Math.min(best, Math.hypot(x - ax - vx * t, (y - ay - vy * t) * sy)); } return best; };
    const D0 = P.g.getImageData(0, 0, GW, GH).data, col = (x, y) => { const i = (y * GW + x) * 4; return [D0[i], D0[i + 1], D0[i + 2]]; };
    const groundLike = (x, y) => { const [r, g, b] = col(x, y); return (g >= r - 4 && b <= g + 2 && r + g + b < 330) || (Math.abs(r - g) <= 7 && b <= g && r + g + b < 170); };
    // 남길 소품 (상자 안에서 땅이 아닌 칸만): 이름, 상자, 옮김
    const PROPS = [
      { n: 'g1', b: [104, 93, 122, 114], dx: -4, dy: 2 }, { n: 'g2', b: [137, 92, 153, 114], dx: 0, dy: 1 }, { n: 'g3', b: [168, 93, 186, 115], dx: 4, dy: 1 },
      { n: 'g4', b: [104, 128, 122, 151], dx: 3, dy: 1 }, { n: 'g5', b: [135, 129, 153, 152], dx: -3, dy: 4 }, { n: 'g6', b: [167, 129, 186, 152], dx: 2, dy: -2 },
      
      { n: 'lampL', b: [78, 128, 100, 174] }, { n: 'lampR', b: [291, 128, 311, 174] }, { n: 'coffin', b: [226, 127, 262, 158], raw: [227, 128, 261, 151] }, { n: 'saw', b: [268, 158, 287, 167] },
      { n: 'chest', b: [163, 57, 186, 76], dx: -2, dy: 4, rope: 1 }];
    const CUT = PROPS.map(p => { const [a, b, c, d] = p.b, px = []; for (let y = b; y < d; y++) for (let x = a; x < c; x++) { if (y < RY0 || y >= RY1 || x < RX0 || x >= RX1) continue; const rw = p.raw && x >= p.raw[0] && x < p.raw[2] && y >= p.raw[1] && y < p.raw[3]; if (!rw && groundLike(x, y)) continue; let [r, g, bb] = col(x, y); if (p.rope && r > 170 && g > 150 && bb > 100) { const [r2, g2, b2] = col(x + 1, y); if (r2 > 170 && g2 > 150) { r = 11; g = 10; bb = 14; } else { r = r2; g = g2; bb = b2; } } px.push([x + (p.dx || 0), y + (p.dy || 0), toHex(r, g, bb)]); } return px; });
    // 옮긴 무덤 비석 위치 (봉분 · 그림자용 발밑)
    const FOOT = n => { const p = PROPS.find(q => q.n === n); return [Math.round((p.b[0] + p.b[2]) / 2 + (p.dx || 0)), p.b[3] - 2 + (p.dy || 0)]; };
  
    // 옛 천막 기둥 자국 지우기 (담 면): 옆 깨끗한 벽돌 칸을 옮겨 칠함
    for (const [x0, x1, sx] of [[84, 92, 10], [152, 164, 14], [266, 312, -60]]) for (let y = top; y < RY0; y++) for (let x = x0; x < x1; x++) { const [r, g, b] = col(x + sx, y); put(x, y, toHex(r, g, b)); }
    // ================================================================ 1. 땅: 풀밭 (짙고 옅은 풀 얼룩 · 풀잎) + 성문에서 올라오는 밟힌 흙길 (천막 · 판 무덤으로 갈라짐) + 담 밑 그늘 · 웃자란 풀
    const GR = ['#1c2818', '#202e1c', '#24321e', '#283820', '#2e3e24'], DIRT = ['#2e2818', '#352d1c', '#3c3320', '#443a26'];
    const path = [[CX, RY1], [CX + 4, 156], [CX + 6, 128], [CX + 5, 100], [CX + 1, 90]], path2 = [[CX + 1, 90], [168, 89], [140, 94], [111, 93]];
    for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) { const n = h2(x >> 2, y >> 2, 801) * 0.55 + h2(x >> 1, y >> 1, 802) * 0.3 + h2(x, y, 803) * 0.15; let c = GR[Math.min(4, Math.floor(n * 5))];
      const d = Math.min(segDist(x, y, path), segDist(x, y, path2) + 1.5); if (d < 3.5 || (d < 6 && bay(x, y) < (6 - d) / 3.5)) c = DIRT[Math.floor(h2(x, y, 804) * 3.99)];
      if (h2(x, y, 805) < 0.05 && d >= 5) c = '#3a4c2c'; // 풀잎 끝
      put(x, y, c); }
    // 풀포기 (3가지) — 길 · 소품 피함
    for (let i = 0; i < 160; i++) { const x = RX0 + 2 + Math.floor(h2(i, 1, 806) * (RX1 - RX0 - 4)), y = RY0 + 3 + Math.floor(h2(i, 2, 806) * (RY1 - RY0 - 5)); if (segDist(x, y, path) < 7 || segDist(x, y, path2) < 6) continue; const k = i % 3;
      if (k === 0) { put(x, y, '#3e5634'); put(x, y - 1, '#4e6e3c'); } else if (k === 1) { put(x, y, '#3e5634'); put(x - 1, y - 1, '#4e6e3c'); put(x + 1, y - 1, '#4e6e3c'); } else { put(x, y, '#2e4228'); put(x, y - 1, '#3e5634'); put(x + 1, y - 2, '#5a7a44'); } }
    // 담 밑 그늘 + 웃자란 풀
    for (let y = RY0; y < RY1; y++) for (let x = RX0; x < RX1; x++) { const dw = Math.min(y - RY0, x - RX0, RX1 - 1 - x, (RY1 - 1 - y) * 1.5); if (dw < 3 && (dw < 1 || bay(x, y) < (3 - dw) / 3)) put(x, y, '#141a12'); }
    for (let x = RX0 + 1; x < RX1 - 1; x++) { const n = h2(x, 7, 807); if (n < 0.5) continue; const hgt = 1 + Math.floor((n - 0.5) * 8); for (let j = 0; j < hgt; j++) put(x + (j === hgt - 1 && n > 0.8 ? 1 : 0), RY0 + 4 - j, j === hgt - 1 ? '#5a7a44' : j === 0 ? '#2e4228' : '#4e6e3c'); }
    for (let y = RY0 + 6; y < RY1 - 2; y++) for (const [x, s2] of [[RX0 + 1, 1], [RX1 - 2, -1]]) { const n = h2(y, x, 808); if (n < 0.55) continue; const L = 1 + Math.floor((n - 0.55) * 9); for (let j = 0; j < L; j++) put(x + s2 * j, y - (j >> 1), j === L - 1 ? '#5a7a44' : '#3e5634'); }
    // 봉분: 비석 앞 흙 무덤 (풀이 덮임 · 위가 밝음)
    for (const n of ['g1', 'g2', 'g3', 'g4', 'g5', 'g6']) { const [fx, fy] = FOOT(n); for (let y = fy - 1; y < fy + 9; y++) for (let x = fx - 6; x <= fx + 6; x++) { const q = ((x - fx) / 6) ** 2 + ((y - fy - 3.5) / 4.6) ** 2; if (q > 1 || (q > 0.8 && bay(x, y) < 0.5)) continue;
        const v = h2(x, y, 808 + fx), lit = (x - fx) * 0.6 + (y - fy - 3.5) < -1; let c = lit ? (v < 0.5 ? '#3e3a26' : '#38341f') : (v < 0.5 ? '#2c2a1a' : '#302c1c'); if (h2(x, y, 809) < 0.3) c = lit ? '#344628' : '#283620'; if (y >= fy + 7 && bay(x, y) < 0.5) c = '#1a2216'; put(x, y, c); } }
    // 버섯: 나무 밑 · 비석 그늘에만 무리 지어
    const shroom = (x, y) => { put(x, y, '#c04a3a'); put(x + 1, y, '#a03a2e'); put(x, y - 1, '#e07a5a'); put(x, y + 1, '#d8ccb0'); };
    for (const [x, y] of [[300, 107], [303, 106], [286, 108], [119, 112], [121, 113], [186, 149]]) shroom(x, y);
  
    // ================================================================ 2. 남긴 소품 붙이기 + 붙은 그림자 (빛은 왼쪽 위 → 그림자는 밑동 바로 아래, 오른쪽으로 2칸 밀림)
    const SHD = '#111710', SHD2 = '#161e14';
    const castShadow = (pts, dx = 2, len = 2, band = 4) => { const low = new Map(); for (const [x, y] of pts) if (!low.has(x) || y > low.get(x)) low.set(x, y); { const ymax = Math.max(...low.values()); for (const [x, y] of [...low]) if (y < ymax - band) low.delete(x); }
      for (const [x, y] of low) for (let k = 1; k <= len + 1; k++) { const xx = x + dx - (k > 1 ? 0 : 1), yy = y + k; if (k <= len) put(xx, yy, k === len ? SHD2 : SHD); else if ((xx + yy) & 1) put(xx, yy, SHD2); }
      const xs = [...low.keys()], xr = Math.max(...xs); for (let i = 1; i <= dx; i++) { const y = low.get(xr); if (y != null) { put(xr + i, y, SHD2); if (i === 1) put(xr + i, y - 1, (xr + y) & 1 ? SHD2 : null); } } };
    const keysOf = M => [...M.keys()].map(k => k.split(',').map(Number));
    CUT.forEach((px, k) => { if (PROPS[k].n !== 'saw') castShadow(px, PROPS[k].n === 'tree' ? 3 : 2, PROPS[k].n.startsWith('lamp') ? 1 : 2, PROPS[k].n === 'tree' || PROPS[k].n.startsWith('lamp') ? 2 : 4); });
    GRAVE_FG = []; let FGK_ALL = [];
    CUT.forEach(px => { for (const [x, y, c] of px) put(x, y, c); });
    for (const n of ['g1', 'g2', 'g3', 'g4', 'g5', 'g6']) { const [fx, fy] = FOOT(n); for (const [dx, k] of [[-6, 0], [-5, 1], [6, 1], [7, 0], [-2, 2]]) { const x = fx + dx, y = fy + 2 + (k === 2 ? 1 : 0); put(x, y, '#3e5634'); put(x + (k & 1), y - 1, '#4e6e3c'); if (k === 1) put(x, y - 2, '#5a7a44'); } }
  
    // ================================================================ 2b. 묘지기 짐 상자 (비석 · 천막과 크기 맞춤): 3/4로 본 나무 궤짝 · 뒤로 젖혀 세운 뚜껑 (쇠띠 · 경첩) · 안에 접은 수의 천 · 초 · 녹색 병 · 앞면 판자 둘 · 모서리 쇠붙이 · 못 · 풀린 자물쇠
    { const x0 = 165, y0 = 69, W = 14, FH = 7, M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c);
      const WD = { H: '#b8926a', L: '#a07a54', m: '#8a6644', d: '#6e5038', D: '#553c2a', s: '#3e2c20', S: '#2a1e16' }, IR = { h: '#b4b2c0', l: '#8a8896', m: '#5e5c6a', d: '#3a3844' };
      for (let y = y0 - 5; y < y0; y++) for (let x = x0 + 1; x < x0 + W - 1; x++) { const r = y - (y0 - 5); let c = r === 0 ? WD.d : x === x0 + 1 ? WD.d : x === x0 + W - 2 ? WD.S : r === 2 ? WD.s : WD.D; if (x === x0 + 3 || x === x0 + W - 4) c = r === 0 ? IR.l : IR.d; set(x, y, c); }
      set(x0 + 3, y0 - 1, IR.h); set(x0 + W - 4, y0 - 1, IR.l);
      for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + W; x++) { const r = y - y0, edge = r !== 1 || x === x0 || x === x0 + W - 1; set(x, y, edge ? (r === 2 ? WD.H : x === x0 + W - 1 ? WD.d : WD.L) : '#1a120e'); }
      for (let x = x0 + 1; x < x0 + 6; x++) set(x, y0 + 1, x < x0 + 3 ? '#ece6d8' : '#cfc7b6'); set(x0 + 2, y0, '#ece6d8'); set(x0 + 3, y0, '#d8d0c0'); // 접은 천
      set(x0 + 7, y0 + 1, '#e8dcb0'); set(x0 + 8, y0 + 1, '#cfc08a'); set(x0 + 7, y0, '#f4d878'); // 초
      set(x0 + 10, y0 + 1, '#3e7a4c'); set(x0 + 11, y0 + 1, '#1e3a26'); set(x0 + 10, y0, '#4a8a5a'); set(x0 + 10, y0 - 1, '#7a5a34'); // 병
      for (let y = y0 + 3; y < y0 + 3 + FH; y++) for (let x = x0; x < x0 + W; x++) { const r = y - y0 - 3, lx = x - x0; let c = lx === 0 ? WD.L : lx === W - 1 ? WD.s : lx >= W - 2 ? WD.D : WD.m;
        if (r === 0) c = lx === 0 ? WD.m : WD.D; if (r === 3) c = lx === 0 ? WD.m : WD.s; if (r === FH - 1) c = WD.S;
        if ((r === 1 || r === 4) && lx > 0 && lx < W - 2 && h2(lx >> 1, r, 981) < 0.45) c = WD.L;
        if (lx === 2 || lx === W - 3) c = r === FH - 1 ? IR.d : lx === 2 ? IR.l : IR.m;
        if ((lx < 2 || lx > W - 3) && (r < 1 || r > FH - 2)) c = lx < 2 ? IR.h : IR.d;
        set(x, y, c); }
      for (const [lx, r] of [[2, 1], [2, 4], [W - 3, 1], [W - 3, 4]]) set(x0 + lx, y0 + 3 + r, '#dcdae4');
      const hx = x0 + 7; set(hx, y0 + 3, IR.h); set(hx, y0 + 4, IR.m); set(hx - 1, y0 + 5, '#c8a850'); set(hx, y0 + 5, '#a08a40'); set(hx - 1, y0 + 6, '#806a30'); set(hx, y0 + 6, '#5e4e24');
      castShadow(keysOf(M).map(([x, y]) => [x, y + 1]), 2, 2); blit(M);
      // 밧줄 사리 (상자 왼쪽)
      { const rx = x0 - 8, ry = y0 + 8; for (let a = 0; a < 6.3; a += 0.4) { const x = Math.round(rx + 3 + Math.cos(a) * 2.6), y = Math.round(ry + Math.sin(a) * 1.3); put(x, y, a < 3 ? '#c8b088' : '#9a8460'); } put(rx + 3, ry, '#5e4a30'); put(rx + 6, ry + 2, SHD); put(rx + 5, ry + 2, SHD); put(rx + 1, ry - 1, '#a8986c'); put(rx, ry - 2, '#a8986c'); } }
  
    // ================================================================ 2c. 물통 (크기 맞춤): 둥근 통 · 통널 음영 · 배 불룩 · 쇠테 둘 · 열린 위의 물 (달빛 반사 · 잎) · 테에 걸친 국자 · 밑동 물 얼룩
    { const cx = 188, by = 78, w = 10, h = 11, ry = 2, x0 = cx - (w >> 1), yT = by - h, M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c);
      const ST = ['#5e4430', '#a07a54', '#b48a60', '#a88058', '#987250', '#8a6644', '#7e5c3e', '#725438', '#664a32', '#5a402c', '#4e3826', '#443020', '#3a2a1c', '#30221a'], sc = i => ST[Math.min(13, Math.round(i * 12 / (w - 1)) + (i === 0 ? 0 : 1))];
      const e = i => Math.round(ry * Math.sqrt(Math.max(0, 1 - (((i + 0.5) / w) * 2 - 1) ** 2)));
      for (let i = 0; i < w; i++) { const y0 = yT + e(i), y1 = by + e(i); for (let y = y0; y <= y1; y++) { const r = y - y0, n = y1 - y0; let c = sc(i);
          if (i % 3 === 2 && r > 1 && r < n - 1) c = ST[Math.min(13, Math.round(i * 12 / (w - 1)) + 3)];
          const hp = r === 2 || r === 3 || r === n - 3 || r === n - 2; if (hp) c = i < 2 ? '#b4b2c0' : i < 4 ? (r === 2 || r === n - 3 ? '#a4a2b0' : '#7a7886') : i < 7 ? (r === 2 || r === n - 3 ? '#6e6c7a' : '#55535e') : '#3a3844';
          set(x0 + i, y, c); } }
      for (let y = yT + 4; y <= by - 3; y++) { set(x0 - 1, y, '#8a6644'); set(x0 + w, y, '#2a1e16'); }
      for (let i = 0; i < w; i++) { const k = e(i); for (let y = yT - k; y <= yT + k; y++) { const edge = y === yT - k || y === yT + k || i === 0 || i === w - 1; set(x0 + i, y, edge ? (y === yT + k ? (i < w / 2 ? '#c8a078' : '#8a6644') : '#6e5038') : (y < yT ? '#1e3448' : '#28445c')); } }
      set(x0 + 2, yT, '#8ab0d0'); set(x0 + 3, yT, '#b0d0e8'); set(x0 + 6, yT, '#3a6a3a'); set(x0 + 7, yT - 1, '#4a7a4a');
      castShadow(keysOf(M).map(([x, y]) => [x, y + 1]), 2, 2); blit(M);
      for (let i = 0; i < 5; i++) { const x = x0 + w - 2 + i, y = yT - 1 - Math.round(i * 0.8); put(x, y - 1, K); put(x, y, i < 1 ? '#8a6644' : '#a07a54'); put(x, y + 1, K); } put(x0 + w + 3, yT - 5, K);
      for (const [dx, dy] of [[-2, 2], [-3, 3], [-1, 3]]) put(x0 + dx, by + dy, '#1a2a2a'); for (const [x, y] of [[x0 - 2, by + 1], [x0 + w + 3, by + 2]]) { put(x, y, '#3e5634'); put(x, y - 1, '#4e6e3c'); } }
  
    // ================================================================ 2d. 탄약 작업대 (그레이브): 두꺼운 판 윗면 · 앞 덧판 · 앞다리 둘 + 가로대 · 아래 선반에 화약 통 · 납 덩이. 위: 바이스 · 탄환 틀 · 납 구슬 · 탄피 꽂이 · 화약 뿔 · 초 · 흩어진 탄피
    { const x0 = 208, y0 = 57, W = 28, M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c);
      const WD = { H: '#a88a66', L: '#94754f', m: '#7e6040', d: '#654a30', D: '#4e3824', s: '#3a2a1a', S: '#281c12' }, IR = { h: '#b4b2c0', l: '#8a8896', m: '#5e5c6a', d: '#3a3844' };
      // 다리 · 가로대 · 아래 선반
      for (let y = y0 + 9; y <= y0 + 18; y++) for (const lx of [1, 2, W - 3, W - 2]) set(x0 + lx, y, lx === 1 || lx === W - 3 ? WD.m : WD.s);
      for (let x = x0 + 3; x < x0 + W - 3; x++) { set(x, y0 + 14, WD.d); set(x, y0 + 15, WD.S); }
      // 선반 위 화약 통 (작은 통 · 테 · 표식) · 납 덩이 둘
      for (let y = y0 + 8; y < y0 + 14; y++) for (let x = x0 + 4; x < x0 + 11; x++) { const lx = x - x0 - 4, r = y - y0 - 8; let c = lx === 0 ? WD.L : lx >= 5 ? WD.D : WD.m; if (r === 1 || r === 4) c = lx < 2 ? IR.l : IR.m; if (r === 0) c = lx < 3 ? WD.H : WD.d; set(x, y, c); }
      set(x0 + 7, y0 + 11, '#2a1e16'); set(x0 + 8, y0 + 11, '#2a1e16'); set(x0 + 7, y0 + 12, '#8a2a20');
      for (const [dx, dy] of [[14, 12], [17, 12], [15, 11]]) { set(x0 + dx, y0 + dy, '#8a8a98'); set(x0 + dx + 1, y0 + dy, '#5a5a68'); set(x0 + dx + 2, y0 + dy, '#3e3e4a'); }
      // 윗면 (판자 셋 · 칼자국 · 앞 모서리 밝음)
      for (let y = y0; y < y0 + 5; y++) for (let x = x0; x < x0 + W; x++) { const r = y - y0, lx = x - x0; let c = r === 4 ? WD.H : (r === 1 || r === 3) && lx > 0 ? WD.L : WD.m; if (r === 2 && lx > 0) c = WD.d; if (lx === 0) c = WD.H; if (lx === W - 1) c = WD.d; if (h2(x, y, 1401) < 0.06 && r < 4) c = WD.D; set(x, y, c); }
      // 앞 덧판 (그늘) · 작은 서랍 · 손잡이
      for (let y = y0 + 5; y < y0 + 9; y++) for (let x = x0; x < x0 + W; x++) { const r = y - y0 - 5, lx = x - x0; let c = r === 0 ? WD.s : r === 3 ? WD.S : lx === 0 ? WD.L : lx >= W - 2 ? WD.s : WD.D; if (lx >= 11 && lx <= 17 && r >= 1 && r <= 2) c = lx === 11 || lx === 17 ? WD.s : WD.d; set(x, y, c); }
      set(x0 + 14, y0 + 6, IR.l); set(x0 + 14, y0 + 7, IR.d);
      // 바이스 (왼쪽 앞 모서리에 물림): 쇠 몸통 · 턱 · 손잡이 막대
      for (const [dx, dy, c] of [[1, -2, IR.h], [2, -2, IR.l], [3, -2, IR.m], [1, -1, IR.l], [2, -1, IR.m], [3, -1, IR.d], [1, 0, IR.m], [2, 0, IR.d], [3, 0, IR.d], [1, 1, IR.d], [3, 1, IR.d], [0, 5, IR.l], [1, 5, IR.m], [2, 5, IR.d], [1, 6, IR.d], [-1, 4, IR.h], [-2, 4, IR.l], [-1, 6, IR.l], [-2, 6, IR.m]]) set(x0 + dx, y0 + dy, c);
      // 탄환 틀 (집게: 쇠 머리 + 나무 자루 둘)
      for (const [dx, dy, c] of [[6, 2, IR.l], [7, 2, IR.m], [6, 3, IR.m], [7, 3, IR.d], [8, 2, '#6e5038'], [9, 2, '#8a6644'], [10, 1, '#8a6644'], [11, 1, '#a07a54'], [8, 3, '#5e4430'], [9, 3, '#6e5038'], [10, 3, '#8a6644'], [11, 3, '#a07a54'], [12, 3, '#8a6644']]) set(x0 + dx, y0 + dy, c);
      // 납 구슬 (윗점 밝음)
      for (const [dx, dy] of [[13, 1], [14, 3], [15, 2], [13, 3]]) { set(x0 + dx, y0 + dy, '#a8a8b8'); }
      // 탄피 꽂이 (나무 토막 · 놋쇠 탄 끝 두 줄) — 위로 솟음
      for (let x = x0 + 17; x < x0 + 23; x++) { set(x, y0 - 1, x === x0 + 17 ? WD.H : WD.L); set(x, y0, WD.d); set(x, y0 + 1, WD.s); }
      for (let x = x0 + 17; x < x0 + 23; x += 1) { if ((x - x0) % 2 === 1) { set(x, y0 - 2, '#e8c060'); set(x, y0 - 3, '#b08040'); } else set(x, y0 - 2, '#a07830'); }
      // 화약 뿔 (구부러진 뿔 · 어두운 끝 · 마개)
      for (const [dx, dy, c] of [[24, 1, '#d8ccb0'], [25, 1, '#e8dcc0'], [26, 2, '#c8b898'], [23, 2, '#c8b898'], [24, 2, '#b0a080'], [25, 2, '#a89878'], [26, 3, '#4a3a2a'], [22, 3, '#8a6644'], [23, 3, '#a89878']]) set(x0 + dx, y0 + dy, c);
      // 초 (짧은 초 · 녹은 촛농 · 불)
      for (const [dx, dy, c] of [[15, -3, '#e8dcb0'], [16, -3, '#cfc08a'], [15, -2, '#e8dcb0'], [16, -2, '#cfc08a'], [14, -1, '#e8dcb0'], [15, -1, '#d8cca0'], [16, -1, '#cfc08a'], [17, -1, '#e8dcb0'], [15, -4, '#3a2a1a'], [15, -5, '#ffd060'], [15, -6, '#fff0b0'], [16, -5, '#e09030']]) set(x0 + dx, y0 + dy, c);
      castShadow(keysOf(M).map(([x, y]) => [x, y + 1]), 2, 2, 3); blit(M);
      // 바닥에 떨어진 탄피 · 납 구슬
      for (const [x, y, c] of [[x0 + 5, y0 + 21, '#b08040'], [x0 + 6, y0 + 21, '#e8c060'], [x0 + 19, y0 + 22, '#8a8a98'], [x0 + 25, y0 + 20, '#b08040']]) put(x, y, c); }
  
    // ================================================================ 3. 묘지기 천막 (짙은 기름 먹인 천 · 비스듬히 선 마루 천막): 앞 박공(입구) · 뒤로 뻗은 오른쪽 비탈(그늘) · 달빛 받는 왼쪽 비탈 · 마루와 비탈 가운데가 살짝 처짐 · 박음질 이음선 · 기운 자국 · 빗물 얼룩 · 진흙 묻은 밑단 · 처마 누름돌 · 말아 묶은 입구 자락 · 안: 깔개 · 등불 · 기둥에 건 작은 등
    { const ax = 110, ay = 58, by = 90, hw = 23, V = [14, -13], M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c), SAG = 0;
      const C = { // 짙은 올리브 갈색 천
        R0: '#9a9476', R1: '#5a5646', L0: '#7e7962', L1: '#726d57', Ls: '#605b48', // 왼쪽 비탈 (달빛)
        F0: '#5c5846', F1: '#54503f', Fs: '#3e3b2e', Fe: '#6e6a54', // 앞 박공
        S0: '#36342a', S1: '#302e25', Ss: '#26241d', Sd: '#1e1c17', // 오른쪽 비탈 (그늘)
        st: '#7a745a', mud: '#3a2e20' };
      const A = [ax, ay], Lb = [ax - hw, by], Rb = [ax + hw, by];
      const par = (x, y, O, E) => { const ex = E[0] - O[0], ey = E[1] - O[1], det = ex * V[1] - ey * V[0], px = x - O[0], py = y - O[1]; return [(px * V[1] - py * V[0]) / det, (ex * py - ey * px) / det]; };
      const sagAt = () => 0; // 마루 처짐 + 천 가운데 처짐
      for (let y = ay + V[1] - 3; y <= by + 2; y++) for (let x = ax - hw - 1; x <= ax + hw + V[0] + 1; x++) {
        { let [s1, t1] = par(x, y, A, Rb); const [s1b, t1b] = par(x, y - Math.round(sagAt(Math.max(0, s1), Math.max(0, Math.min(1, t1)))), A, Rb); s1 = s1b; t1 = t1b;
          if (s1 >= 0 && s1 <= 1 && t1 >= 0 && t1 <= 1) { const shade = Math.sin(Math.PI * Math.min(1, s1 * 1.15)) * (0.6 + 0.4 * Math.sin(Math.PI * t1)); let c = s1 < 0.06 ? C.R1 : s1 < 0.14 ? '#46443a' : shade > 0.75 ? C.S1 : C.S0;
            if (Math.abs(s1 - 0.5) < 0.025) c = (Math.round(t1 * 40) & 1) ? C.Ss : C.st; // 가로 박음질
            if (Math.abs(t1 * 3 - Math.round(t1 * 3)) < 0.035 && t1 > 0.05 && t1 < 0.95) c = C.Ss; // 세로 이음
            { const ti = Math.round(t1 * 28); if ((ti === 5 && s1 > 0.25 && s1 < 0.8) || (ti === 15 && s1 > 0.55 && s1 < 0.88) || (ti === 22 && s1 > 0.15 && s1 < 0.6)) c = C.Ss; } // 빗물 얼룩 (흘러내린 줄)
            if (s1 > 0.92) c = s1 > 0.97 ? C.mud : C.Ss; if (t1 > 0.96) c = C.Sd; set(x, y, c); } }
        { let [s2, t2] = par(x, y, A, Lb); const [s2b, t2b] = par(x, y - Math.round(sagAt(Math.max(0, s2), Math.max(0, Math.min(1, t2)))), A, Lb); s2 = s2b; t2 = t2b;
          if (s2 >= 0 && s2 <= 1 && t2 >= 0 && t2 <= 1) { let c = s2 < 0.07 ? C.R0 : s2 < 0.4 ? C.L0 : C.L1; if (Math.abs(t2 * 3 - Math.round(t2 * 3)) < 0.05 && t2 > 0.05) c = C.Ls; if (s2 > 0.92) c = C.mud; set(x, y, c); } } }
      // 마루 선 (처진 줄)
      for (let i = 0; i <= 28; i++) { const t = i / 28; set(Math.round(ax + V[0] * t), Math.round(ay + V[1] * t + SAG * Math.sin(Math.PI * t)), i % 2 ? C.R0 : '#9a9478'); }
      // 앞 박공
      for (let y = ay; y <= by; y++) { const w = hw * (y - ay) / (by - ay); for (let x = Math.ceil(ax - w); x <= ax + w; x++) { const t = (y - ay) / (by - ay); let c = t < 0.5 ? C.F0 : C.F1;
        if (Math.abs(x - ax - w) < 1) c = C.Sd; if (Math.abs(x - ax + w) < 1) c = C.Fe; if (Math.abs(x - ax + w) < 2 && Math.abs(x - ax + w) >= 1) c = (y & 1) ? C.Fs : C.F0; // 왼쪽 모서리 박음질
        if (y >= by - 1) c = C.mud; set(x, y, c); } }
      // 박공 천의 당김 주름 (꼭짓점에서 아래 양쪽으로) · 밑단 때
      for (const [ex, c1, c2] of [[ax - 15, '#5e5a48', '#46423a'], [ax + 14, '#3e3b2e', '#56523f'], [ax - 21, '#5a5644', null]]) { const n = by - ay; for (let i = 3; i < n - 1; i++) { const x = Math.round(ax + (ex - ax) * i / n), y = ay + i; if (M.has(x + ',' + y)) set(x, y, c1); if (c2 && M.has((x + 1) + ',' + y)) set(x + 1, y, c2); } }
      for (let y = by - 4; y < by - 1; y++) { const w = hw * (y - ay) / (by - ay); for (let x = Math.ceil(ax - w) + 1; x < ax + w; x++) if (bay(x, y) < (y - by + 5) / 4) set(x, y, '#3e3626'); }
      // 입구
      const dt = ay + 10;
      for (let y = dt; y <= by; y++) { const w = 9 * (y - dt) / (by - dt); for (let x = Math.ceil(ax - w); x <= ax + w; x++) { const r = Math.hypot((x - ax - 1) / 8, (y - by + 3) / 6); set(x, y, r < 0.35 ? '#d09040' : r < 0.6 ? '#94602c' : r < 0.85 ? '#4e321c' : (y - dt) < 6 ? '#140e0a' : '#22160e'); } }
      for (let x = ax - 6; x <= ax + 7; x++) set(x, by, x < ax - 1 ? '#7a5a40' : x < ax + 3 ? '#8a6a48' : '#5e4430'); // 깔개
      for (let x = ax - 6; x <= ax - 2; x++) set(x, by - 1, '#a08a6a'); // 접은 담요
      for (const [dx, dy, c] of [[3, -7, '#2a2228'], [3, -6, '#5a5866'], [3, -5, '#ffe9a0'], [2, -5, '#e0a040'], [4, -5, '#e0a040'], [3, -4, '#ffc050'], [2, -4, '#5a3c14'], [4, -4, '#5a3c14'], [3, -3, '#3a2a14']]) set(ax + dx, by + dy, c);
      // 말아 올린 자락 (두루마리: 밝은 윗선 · 어두운 아랫선) + 붉은 끈
      for (const s2 of [-1, 1]) for (let j = 0; j < 12; j++) { const y = dt + 2 + j, x = ax + s2 * Math.round(9 * (y - dt) / (by - dt) + 1); set(x, y, s2 < 0 ? '#6e6a54' : '#4c4838'); set(x + s2, y, s2 < 0 ? '#58543f' : '#3a3729'); set(x + 2 * s2, y, '#2a2820'); if (j === 5 || j === 6) { set(x, y, j === 5 ? '#9a3a2a' : '#6a2a1e'); set(x + s2, y, '#5a1e18'); } }
      // 기운 자국 (조금 다른 천 + 큰 땀)
      for (const [px, py, w, h, c] of [[ax - 15, ay + 19, 6, 5, '#5e4e38'], [ax + 20, ay + 2, 7, 5, '#40403a']]) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = (px + x) + ',' + (py + y); if (!M.has(k)) continue; const bd = x === 0 || y === 0 || x === w - 1 || y === h - 1; M.set(k, bd ? ((x + y) % 2 === 0 ? C.st : '#1e1c17') : (y === 1 && x > 0 && x < w - 1 ? C.st : c)); }
      castShadow(keysOf(M).map(([x, y]) => [x, y + 1]), 3, 2, 40); blit(M);
      // 처마 누름돌 (오른쪽 처마 밑단을 따라 돌 셋)
      for (const t of [0.15, 0.5, 0.85]) { const x = Math.round(ax + hw + V[0] * t), y = Math.round(by + V[1] * t) + 1; put(x - 1, y, '#77717e'); put(x, y, '#5a5562'); put(x + 1, y, '#46424e'); put(x - 1, y - 1, '#8a8490'); put(x, y - 1, '#77717e'); put(x + 2, y, K); put(x - 2, y, K); put(x, y + 1, K); }
      // 기둥: 앞 · 뒤 꼭짓점 위로
      for (const [x, y0] of [[ax, ay], [ax + V[0], ay + V[1]]]) { for (let y = y0 - 5; y <= y0; y++) { put(x - 1, y, K); put(x, y, y === y0 - 5 ? '#b8946a' : '#8e6e50'); put(x + 1, y, K); } put(x, y0 - 6, K); }
      // 앞 기둥에 건 작은 등 (고리 · 갓 · 불)
      { const lx = ax - 3, ly = ay - 2; put(ax - 1, ly - 2, '#55535e'); put(lx + 1, ly - 2, '#55535e'); put(lx, ly - 1, K); put(lx - 1, ly, K); put(lx, ly, '#3a3844'); put(lx + 1, ly, K); put(lx - 1, ly + 1, K); put(lx, ly + 1, '#ffd060'); put(lx + 1, ly + 1, K); put(lx - 1, ly + 2, K); put(lx, ly + 2, '#c08030'); put(lx + 1, ly + 2, K); put(lx, ly + 3, K); }
      // 줄 (살짝 처진 곡선) + 말뚝
      const stake = (x, y) => { put(x, y - 1, K); put(x - 1, y, K); put(x, y, '#9e7e5a'); put(x + 1, y, K); put(x, y + 1, '#5e4430'); put(x + 1, y + 1, SHD); };
      const rope = (x0, y0, x1, y1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const t = i / n; put(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * 1.2), i % 3 === 0 ? '#8a7a58' : '#a8986c'); } stake(x1, y1); };
      rope(ax - 1, ay - 4, ax - hw - 9, ay + 16); rope(ax + V[0] + 1, ay + V[1] - 4, ax + hw + V[0] + 8, ay + V[1] + 18); rope(ax + hw + 3, by - 3, ax + hw + 10, by + 2); rope(ax - hw, by - 1, ax - hw - 5, by + 3); }
  
    // ================================================================ 3b. 판 무덤 (반듯한 네모 구덩이: 안쪽 먼 벽의 흙 켜 · 바닥 어둠 · 무너진 가장자리 · 흙 부스러기) + 파낸 흙더미 (왼쪽 위 빛 · 흙덩이 · 돌 · 꽂힌 삽 · 구덩이 쪽으로 흘러내린 흙)
    { const x0 = 205, x1 = 233, y0 = 96, y1 = 112, jag = (v, k) => Math.max(0, Math.min(3, Math.round(1.2 + Math.sin(v * 0.45 + k * 2.1) * 1.1 + (h2(v >> 1, k, 961) - 0.5) * 1.2)));
      // 가장자리 밟힌 흙 (디더)
      for (let y = y0 - 3; y <= y1 + 3; y++) for (let x = x0 - 3; x <= x1 + 3; x++) { const dx = Math.max(x0 - x, x - x1, 0), dy = Math.max(y0 - y, y - y1, 0), d = Math.hypot(dx, dy); if (d > 0 && d < 3.5 && bay(x, y) < (3.5 - d) / 3) put(x, y, h2(x, y, 962) < 0.5 ? '#3c3220' : '#33291a'); }
      const WALL = ['#4e3e28', '#46371f', '#3e311c', '#362a18', '#2e2414', '#262012', '#1e1810'];
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const L = x0 + jag(y, 1), R = x1 - jag(y, 2), T = y0 + jag(x, 3), B = y1 - jag(x, 4); if (x < L || x > R || y < T || y > B) continue; { const cr = 3, qx = Math.min(x - L, R - x), qy = Math.min(y - T, B - y); if (qx < cr && qy < cr && (cr - qx) ** 2 + (cr - qy) ** 2 > cr * cr + 1) continue; }
        const fromT = y - T; let c = fromT < WALL.length ? WALL[fromT] : '#120d0a'; // 먼 벽 (흙 켜, 아래로 어두워짐) → 바닥
        if (fromT === 2 && h2(x, 0, 963) < 0.5) c = '#2e2416'; // 켜 줄
        if (x === L || x === R) c = fromT < 4 ? '#2a2014' : '#0e0a08'; // 옆 벽 그늘
        if (fromT < 5 && h2(x, y, 964) < 0.04) c = '#5a3e2a'; // 뿌리
        if (fromT < 5 && h2(x, y, 963) < 0.025) c = '#6a6572'; // 돌
        if (y >= B - 1) c = '#0a0806'; // 앞 가장자리 밑 (가려진 바닥)
        put(x, y, c); }
      // 가장자리: 위 (땅 윗면 모서리, 달빛) · 옆 어두운 선 · 앞은 풀이 덮어 늘어짐
      for (let x = x0 + 3; x < x1 - 2; x++) { const T = y0 + jag(x, 3); put(x, T - 1, h2(x, 1, 970) < 0.5 ? '#6a5838' : '#5a4a30'); if (h2(x, 2, 972) < 0.3) put(x, T - 2, '#4e3f28'); }
      for (let y = y0 + 3; y <= y1 - 3; y++) { put(x0 + jag(y, 1) - 1, y, '#3c3220'); put(x1 - jag(y, 2) + 1, y, '#2a2216'); }
      for (let x = x0; x <= x1; x++) { const B = y1 - jag(x, 4), n = h2(x, 2, 971); put(x, B, n < 0.4 ? '#2e4228' : '#3a3220'); if (n > 0.7) put(x, B - 1, '#3e5634'); }
      // 바닥에 놓인 판자 하나 · 가장자리 흙 덩이
      for (let x = x0 + 8; x < x0 + 16; x++) put(x, y1 - 4, '#3a2a1c');
      for (const [x, y] of [[x0 + 4, y1 + 2], [x0 + 13, y1 + 3], [x1 - 7, y1 + 2], [x0 - 3, y0 + 5]]) { put(x, y, '#5a4a30'); put(x + 1, y, '#42341f'); }
      // 흙더미 (간결하게): 둥근 더미 하나 · 왼쪽 위 빛 5단 + 디더 · 흙덩이 몇 개 · 작은 돌 둘 · 구덩이 쪽 흘러내린 흙
      { const cx = 248, base = 95, rx = 11, Hm = 9, TN = ['#36241a', '#4a3222', '#62432c', '#7a5638', '#926a46'], M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c);
        for (let x = cx - rx; x <= cx + rx; x++) { const u = (x + 0.5 - cx) / rx, q = 1 - u * u; if (q <= 0) continue; const tY = Math.round(base - Hm * Math.pow(q, 0.62) + (h2(x >> 2, 0, 965) < 0.3 ? 1 : 0)), bY = Math.round(base + 3.5 * Math.sqrt(q));
          for (let y = tY; y <= bY; y++) { const v = (y - tY) / Math.max(1, bY - tY), b = -0.55 * u + 0.75 * (1 - v) - 0.1; let k = Math.floor((b + 0.45) / 1.3 * 5 + bay(x, y) - 0.5); k = Math.max(0, Math.min(4, k)); if (y === tY) k = Math.min(4, k + 1); set(x, y, TN[k]); } }
        for (const [x, y] of [[243, 91], [253, 92], [247, 94], [251, 88]]) if (M.has(x + ',' + y)) { set(x, y, TN[0]); set(x + 1, y, TN[1]); set(x, y - 1, TN[3]); } // 흙덩이
        for (const [x, y] of [[245, 93]]) { set(x, y, '#9a94a2'); set(x + 1, y, '#5e5966'); } // 돌
        castShadow(keysOf(M).map(([x, y]) => [x, y + 1]), 3, 2, 3); blit(M);
        for (let y = 94; y < 100; y++) for (let x = 231; x < 238; x++) { const d = Math.hypot((x - 238) / 6, (y - 98) / 3.5); if (d < 1 && bay(x, y) < 0.45 - d * 0.4 + 0.06) put(x, y, h2(x, y, 969) < 0.5 ? '#6e4626' : '#52331c'); } }
      // 삽 (간결하게): 작은 날이 더미 꼭대기에 박힘 · 1칸 자루 · T 손잡이
      { const bx = 250, bt = 87; for (const [dx, dy, c] of [[-2, 0, K], [-1, 0, '#c8c8d0'], [0, 0, '#9a98a6'], [1, 0, '#6a6876'], [2, 0, K], [-1, 1, '#8a5c34'], [0, 1, '#6e4626'], [1, 1, '#8a5c34'], [-1, -1, K], [0, -1, '#8a8896'], [1, -1, K]]) put(bx + dx, bt + dy, c);
        let tx = bx, ty = bt - 2; for (let i = 0; i < 11; i++) { const x = bx - Math.round(i * 0.45), y = bt - 2 - i; put(x - 1, y, K); put(x, y, i % 5 === 3 ? '#8a6644' : '#b8946a'); put(x + 1, y, K); tx = x; ty = y; }
        for (let k = -2; k <= 2; k++) { put(tx + k, ty - 1, Math.abs(k) === 2 ? K : k < 1 ? '#c8a070' : '#a07a54'); put(tx + k, ty - 2, K); put(tx + k, ty, Math.abs(k) >= 1 ? K : '#b8946a'); } }
    }
  
    // ================================================================ 4. 관 (모양 그대로 · 디테일): 판자 결 · 모서리 쇠 장식 · 못 · 안쪽 짙은 천 · 뚜껑 판자 기대어 둠 표식
    { const p = PROPS.find(q => q.n === 'coffin'), [a, b, c, d] = p.b;
      // 관 테두리 · 안쪽 칸을 색으로 찾아 디테일 덧칠
      const D1 = P.g.getImageData(0, 0, GW, GH).data, at = (x, y) => { const i = (y * GW + x) * 4; return [D1[i], D1[i + 1], D1[i + 2]]; };
      for (let y = b; y < d; y++) for (let x = a; x < c; x++) { const [r, g, bb] = at(x, y), br = r + g + bb;
        if (r > g + 15 && g > bb && br > 200) { // 밝은 나무 (테두리 판)
          if ((x * 7 + y * 3) % 11 === 0) put(x, y, '#7e5e44'); else if ((x + y * 5) % 13 === 0) put(x, y, '#c8a880'); }
        else if (r > g && br < 120 && br > 45 && x > a + 3 && x < c - 4 && y > b + 3 && y < d - 10) { // 안쪽 (짙은 판) → 짙은 보랏빛 천 + 주름
          put(x, y, (y - b) % 5 === 0 ? '#2a1e2a' : (x * 3 + y) % 17 === 0 ? '#46344a' : '#33263a'); } }
      // 모서리 쇠 장식 + 못
      for (const [x, y] of [[a + 3, b + 3], [c - 5, b + 3], [a + 3, d - 9], [c - 5, d - 9]]) { put(x, y, '#9a98a6'); put(x + 1, y, '#5a5866'); put(x, y + 1, '#5a5866'); }
      for (let x = a + 7; x < c - 6; x += 6) { put(x, b + 3, '#c8c8d0'); } }
  
    // ================================================================ 5. 둘레 돌담: 담 윗면 갓돌 (이음매 · 윗면 밝음 · 안쪽 모서리 그늘 · 이끼 · 빠진 돌) — 옆 · 아래 · 위 띠 모두
    { const band = (x0, y0, w, h, horiz) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const along = horiz ? x : y, across = horiz ? y - y0 : x - x0, n = horiz ? h : w, blk = Math.floor((along + 3) / 7), joint = (along + 3) % 7 === 0;
          let c = across === 0 ? '#8a8490' : across === n - 1 ? '#2e2a34' : across === n - 2 ? '#46424e' : (h2(blk, 1, 821) < 0.5 ? '#625d6a' : '#5a5562'); if (joint && across > 0 && across < n - 1) c = '#34303c';
          if (h2(blk, across, 822) < 0.12 && across > 0 && across < n - 2) c = h2(blk, 3, 823) < 0.5 ? '#3e5634' : '#2e4228'; // 이끼
          if (h2(blk, 4, 824) < 0.06 && across < n - 1) c = across === 0 ? '#26222c' : '#1e1c24'; // 빠진 돌
          put(x, y, c); } };
      band(RX0 - 7, top - 3, 7, RY1 - top + 9, false); band(RX1, top - 3, 7, RY1 - top + 9, false); band(RX0 - 7, top - 3, RX1 - RX0 + 14, 3, true);
      // 아래 담 (문 자리 빼고)
      band(RX0 - 7, RY1, 163 - (RX0 - 7), 6, true); band(222, RY1, RX1 + 7 - 222, 6, true);
      P.rect(RX0 - 8, top - 4, RX1 - RX0 + 16, 1, K); P.rect(RX0 - 8, top - 4, 1, RY1 - top + 11, K); P.rect(RX1 + 7, top - 4, 1, RY1 - top + 11, K); P.rect(RX0 - 8, RY1 + 6, 163 - (RX0 - 8), 1, K); P.rect(222, RY1 + 6, RX1 + 8 - 222, 1, K); }
  
    // ================================================================ 5b. 마른 나무 (더 크게 · 담 앞): 비틀린 줄기 · 큰 가지 다섯 · 잔가지 · 옹이 구멍 · 껍질 갈라진 결 (왼쪽 위 빛) · 땅을 움켜쥔 뿌리 · 까마귀 앉는 가지
    { const M = new Map(), BK = ['#8a7a68', '#6e604f', '#564a3e', '#423830', '#302822', '#201a16'];
      const seg = (x0, y0, x1, y1, w0, w1, sd) => { const vx = x1 - x0, vy = y1 - y0, L = Math.hypot(vx, vy) || 1;
        for (let y = Math.floor(Math.min(y0, y1) - 6); y <= Math.max(y0, y1) + 6; y++) for (let x = Math.floor(Math.min(x0, x1) - 6); x <= Math.max(x0, x1) + 6; x++) {
          const px = x + 0.5 - x0, py = y + 0.5 - y0, t = Math.max(0, Math.min(1, (px * vx + py * vy) / (L * L))), ex = px - vx * t, ey = py - vy * t, r = (w0 + (w1 - w0) * t) / 2; if (ex * ex + ey * ey > r * r) continue;
          const lv = -(ex * 0.75 + ey * 0.65) / Math.max(0.6, r); let k = lv > 0.55 ? 0 : lv > 0.15 ? 1 : lv > -0.25 ? 2 : lv > -0.65 ? 3 : 4;
          if (r < 1.1) k = lv > 0 ? 2 : 3;
          else if (h2(Math.round(t * L / 2.5), Math.round((ex * vy - ey * vx) / L * 1.2 + 3), sd) < 0.22) k = Math.min(5, k + 2); // 갈라진 껍질 결 (줄기 따라)
          M.set(x + ',' + y, BK[k]); } };
      const twig = (x, y, a, len, d, sd) => { let cx = x, cy = y; for (let i = 0; i < len; i++) { a += (h2(i, sd, 991) - 0.5) * 0.5; cx += Math.cos(a); cy += Math.sin(a); M.set(Math.round(cx) + ',' + Math.round(cy), i < len / 2 ? BK[3] : BK[4]); if (d > 0 && i === Math.floor(len * 0.55)) twig(cx, cy, a + (h2(sd, d, 992) < 0.5 ? -0.7 : 0.7), Math.max(2, len - 3), d - 1, sd * 3 + 1); } };
      // 큰 가지 (먼저) → 줄기 (위에)
      seg(290, 81, 278, 71, 4.6, 3.2, 1); seg(278, 71, 268, 66, 3.2, 2.2, 2); seg(268, 66, 260, 58, 2.2, 1.2, 3); seg(278, 71, 274, 59, 2.4, 1.3, 4);
      seg(293, 70, 303, 60, 4.2, 2.6, 5); seg(303, 60, 307, 49, 2.6, 1.5, 6); seg(307, 49, 305, 41, 1.5, 1, 7);
      seg(291, 90, 300, 86, 3.2, 2, 8); seg(300, 86, 304, 81, 2, 1.6, 9); M.set('304,80', BK[1]); M.set('305,80', BK[3]); // 부러진 가지 끝 (밝은 단면)
      seg(290, 53, 278, 43, 3.2, 2.2, 10); seg(278, 43, 265, 40, 2.2, 1.6, 11); // 까마귀 가지
      seg(291, 41, 299, 33, 2.2, 1.3, 12); seg(299, 33, 303, 28, 1.3, 1, 13);
      seg(292, 103, 290, 84, 9.5, 7, 20); seg(290, 84, 293, 66, 7, 5.6, 21); seg(293, 66, 290, 50, 5.6, 4, 22); seg(290, 50, 292, 35, 4, 2.2, 23); seg(292, 35, 290, 27, 2.2, 1, 24);
      // 뿌리
      seg(289, 101, 280, 105, 3.6, 1.2, 30); seg(296, 101, 305, 104, 3.6, 1.2, 31); seg(293, 102, 297, 107, 3, 1, 32); seg(288, 102, 285, 107, 2.4, 1, 33);
      // 잔가지
      for (const [x, y, a, l, sd] of [[260, 58, -2.4, 7, 41], [262, 61, -1.9, 5, 42], [274, 59, -1.8, 6, 43], [305, 41, -1.6, 6, 44], [306, 46, -0.6, 5, 45], [303, 28, -1.2, 5, 46], [299, 34, -2.6, 4, 47], [290, 27, -1.7, 4, 48], [265, 40, -2.9, 3, 49], [271, 42, -2.0, 4, 50], [268, 66, 2.6, 4, 51], [304, 61, -0.2, 4, 52]]) twig(x, y, a, l, 1, sd);
      // 옹이 구멍
      for (const [dx, dy, c] of [[-1, -2, BK[0]], [0, -3, BK[1]], [1, -2, BK[3]], [-1, -1, '#1a1210'], [0, -2, '#120c0a'], [0, -1, '#0e0a08'], [1, -1, '#1a1210'], [-1, 0, '#1a1210'], [0, 0, '#120c0a'], [1, 0, BK[4]], [0, 1, BK[2]]]) M.set((291 + dx) + ',' + (77 + dy), c);
      castShadow(keysOf(M).map(([x, y]) => [x, y + 1]), 3, 2, 3); blit(M);
      // 뿌리 사이 풀
      for (const [x, y] of [[283, 106], [299, 108], [307, 105]]) { put(x, y, '#3e5634'); put(x, y - 1, '#4e6e3c'); put(x + 1, y - 2, '#5a7a44'); } }
  
    // ================================================================ 5c. 쌓아 둔 목재: 받침목 위에 켜켜이 쌓은 널빤지 (윗면 결 · 옹이 · 앞 모서리 밝음 · 앞면 그늘 · 톱으로 자른 끝) · 기대 세운 판 · 박힌 못 · 톱밥
    { const M = new Map(), set = (x, y, c) => M.set(x + ',' + y, c);
      // 맨 위 널빤지 윗면 (넓은 면 · 결 · 옹이) + 아래로 널빤지 앞 모서리 셋 (사이 받침목 틈) — 켜마다 1칸씩 어긋남
      const X0 = 264, L = 24, Y0 = 141, TOP = ['#a8896a', '#9c7e5e', '#927454', '#86694a'];
      for (let y = Y0; y < Y0 + 4; y++) for (let x = X0; x < X0 + L; x++) { const lx = x - X0, r = y - Y0; let c = TOP[r];
        if (h2(x >> 2, r, 990) < 0.28 && (lx + r) % 6 < 4) c = '#7a6044'; // 결
        if (lx === 0) c = '#c8aa84'; if (lx === L - 1) c = '#6a5038';
        set(x, y, c); }
      set(X0 + 15, Y0 + 1, '#5e4630'); set(X0 + 16, Y0 + 1, '#7a6044'); set(X0 + 14, Y0 + 2, '#b0906a'); set(X0 + 15, Y0 + 2, '#6a5038'); // 옹이
      for (let y = Y0; y < Y0 + 4; y++) if (y !== Y0 + 1) set(X0 + 11, y, '#86694a'); // 두 장 이음
      const edge = (x0, y0, len) => { for (let x = x0; x < x0 + len; x++) { const lx = x - x0; set(x, y0, lx === 0 ? '#b8987a' : '#7a5e42'); set(x, y0 + 1, lx === 0 ? '#9a7a5a' : (h2(x >> 2, y0, 996) < 0.3 ? '#4e3a28' : '#5e4630')); } };
      edge(X0, Y0 + 4, L); for (let x = X0 + 1; x < X0 + L; x++) set(x, Y0 + 6, '#1e1610');
      edge(X0 - 1, Y0 + 7, L + 1); for (let x = X0; x < X0 + L; x++) set(x, Y0 + 9, '#1e1610');
      edge(X0 + 1, Y0 + 10, L - 1);
      for (const x of [X0 + 3, X0 + L - 5]) { set(x, Y0 + 6, '#5a4430'); set(x + 1, Y0 + 6, '#4a3424'); set(x - 1, Y0 + 9, '#5a4430'); set(x, Y0 + 9, '#4a3424'); set(x, Y0 + 12, '#4a3424'); set(x + 1, Y0 + 12, '#3a2a1c'); } // 받침목
      // 위에 비스듬히 걸쳐 둔 짧은 판
      for (let i = 0; i < 11; i++) { const x = X0 + 4 + i, y = Y0 - 1 - Math.round(i * 0.25); set(x, y, i === 0 ? '#d0b28a' : '#b0906a'); set(x, y + 1, '#6a5038'); }
      castShadow(keysOf(M).map(([x, y]) => [x, y + 1]), 2, 2, 3); blit(M);
      for (const [x, y] of [[267, 142], [284, 143]]) { put(x, y, '#c8c8d0'); put(x + 1, y, '#55535e'); } // 못
      for (const [x, y] of [[270, 160], [273, 161], [276, 159], [266, 160], [281, 161], [290, 160]]) put(x, y, h2(x, y, 995) < 0.5 ? '#d8bc8a' : '#b89c6a'); } // 톱밥
  
    // ================================================================ 6. 정문: 마름돌 기둥 둘 (머릿돌 + 돌 구슬) · 기둥 양옆 쇠창살 울타리 · 안으로 열린 왼쪽 쇠문짝 · 비뚤게 걸린 오른쪽 문짝 · 문 밖 흙길
    { // 문 밖 흙길 · 바깥 땅
      for (let y = RY1; y < GH; y++) for (let x = 150; x < 236; x++) { const v = h2(x, y, 161); let c = v < 0.6 ? '#0e120e' : v < 0.9 ? '#121812' : '#162016'; const w = 13 - Math.min(4, (y - RY1) * 0.15), dd = Math.abs(x + 0.5 - CX) / w; if (dd < 1 && bay(x, y) < (1 - dd) * 1.7 - 0.2 + (y < RY1 + 7 ? 0.5 : 0)) c = h2(x, y, 905) < 0.5 ? '#352d1c' : '#2e2818'; if (y < RY1 + 7 && (x < 163 || x >= 222)) continue; put(x, y, c); }
      // 문턱: 닳은 넓은 디딤돌 둘 (윗면 · 이음 · 가운데 흙 · 이끼)
      for (let y = RY1; y < RY1 + 6; y++) for (let x = 179; x < 205; x++) { const r = y - RY1, joint = x === 191 || x === 192; let c = r === 0 ? '#77717e' : r >= 4 ? '#3a3542' : (x < 191 ? '#5e5966' : '#56515e');
        if (joint && r < 5) c = '#2a2632'; if (r === 1 && !joint) c = x < 191 ? '#6a6572' : '#625d6a'; const dd = Math.abs(x + 0.5 - CX) / 7; if (r > 0 && r < 4 && dd < 1 && bay(x, y) < (1 - dd) * 0.9) c = h2(x, y, 905) < 0.5 ? '#3c3220' : '#33291a';
        if (r === 3 && h2(x, 1, 906) < 0.2) c = '#3e5634'; put(x, y, c); }
      for (let x = 178; x < 206; x++) put(x, RY1 + 6, K);
      const FGK = [], ST = { T: '#c4bec8', t: '#a8a2ae', m: '#77717e', M: '#625d6a', d: '#4e4a56', D: '#3a3542', S: '#2a2632' };
      // 돌기둥: 넓은 머릿돌 (윗면 · 앞면 · 밑 그늘) · 마름돌 몸통 (줄마다 이음 엇갈림 · 돌마다 테 · 얽은 자국 · 아래로 갈수록 이끼) · 비스듬한 금 · 넓은 받침돌 · 받침 위 돌 구슬
      const pillar = (px, flip) => { const W2 = 14, y0 = RY1 - 18, y1 = RY1 + 7, M = new Map(), set = (x, y, c) => M.set((px + x) + ',' + y, c);
        for (let x = -1; x <= W2; x++) { set(x, y0, x < 2 ? ST.T : ST.t); set(x, y0 + 1, x === W2 ? ST.m : ST.t); set(x, y0 + 2, x === -1 ? ST.t : x >= W2 - 1 ? ST.d : ST.m); set(x, y0 + 3, x >= W2 - 1 ? ST.D : ST.M); }
        for (let x = 0; x < W2; x++) set(x, y0 + 4, ST.S);
        const yb0 = y0 + 5, yb1 = y1 - 4;
        for (let y = yb0; y <= yb1; y++) { const j = y - yb0, row = Math.floor(j / 4), ly = j % 4, seam = row & 1 ? 5 : 9;
          for (let x = 0; x < W2; x++) { const bl = x > seam, bx0 = bl ? seam + 1 : 0, bx1 = bl ? W2 - 1 : seam - 1; let c = ST.M;
            if (ly === 3 || x === seam) c = ST.S; else if (ly === 0 || x === bx0) c = x >= W2 - 2 ? ST.d : ST.m; else if (x === bx1 || ly === 2) c = ST.d;
            if (x >= W2 - 2 && c === ST.M) c = ST.d; if (x === 0 && ly !== 3) c = ST.t;
            if (c === ST.M && h2(x, y, 913 + px) < 0.12) c = ST.d;
            if (ly < 3 && h2(row * 7 + (bl ? 1 : 0), x, 931 + px) < (row >= 2 ? 0.3 : row === 1 ? 0.1 : 0)) c = h2(x, y, 932) < 0.5 ? '#3e5634' : '#4e6e3c';
            set(x, y, c); } }
        for (let i = 0; i < 6; i++) set(flip ? W2 - 4 - (i >> 1) : 3 + (i >> 1), yb0 + i, ST.S);
        for (let x = -1; x <= W2; x++) { set(x, yb1 + 1, x < 1 ? ST.T : ST.t); set(x, yb1 + 2, x >= W2 - 1 ? ST.D : ST.m); set(x, yb1 + 3, x >= W2 - 1 ? ST.S : ST.d); }
        for (let x = 3; x < W2 - 3; x++) { set(x, y0 - 1, x === 3 ? ST.t : x >= W2 - 5 ? ST.d : ST.m); set(x, y0 - 2, x === 3 ? ST.T : ST.t); }
        const bc = (W2 - 1) / 2; for (let y = -8; y <= -3; y++) for (let x = 2; x < W2 - 2; x++) { const dx = (x - bc) / 3.2, dy = (y + 5.5) / 3; if (dx * dx + dy * dy > 1) continue; const l = -dx * 0.6 - dy * 0.7; set(x, y0 + y, l > 0.6 ? '#e4dee8' : l > 0.15 ? ST.t : l > -0.35 ? ST.m : ST.d); }
        blit(M); FGK.push([...M.keys()]); };
      // 쇠 아치: 두 기둥 머릿돌 사이 · 두 줄 곡선 (윗줄 밝음) + 사이 고리 · 가운데 작은 십자 · 양 끝 말린 장식
      { const AM = new Map(), as = (x, y, c) => AM.set(x + ',' + y, c), x0 = 172, x1 = 212, ya = RY1 - 14;
        const yAt = x => ya - Math.round(Math.sin(Math.PI * (x - x0) / (x1 - x0)) * 8);
        for (let x = x0; x <= x1; x++) { const y = yAt(x); as(x, y, '#8a8696'); as(x, y + 3, '#55515e'); }
        for (let x = x0 + 3; x < x1 - 1; x += 4) { const y = yAt(x); as(x, y + 1, '#46424e'); as(x, y + 2, '#46424e'); } // 고리 사이 기둥
        for (let x = x0 + 5; x < x1 - 3; x += 4) { const y = yAt(x); as(x - 1, y + 1, '#3a3642'); as(x + 1, y + 1, '#3a3642'); as(x - 1, y + 2, '#3a3642'); as(x + 1, y + 2, '#3a3642'); } // 작은 고리
        const cx = Math.round((x0 + x1) / 2), cy = yAt(cx); for (let k = 1; k <= 5; k++) as(cx, cy - k, k === 5 ? '#a8a4b4' : '#6e6a7a'); as(cx - 1, cy - 3, '#6e6a7a'); as(cx + 1, cy - 3, '#55515e'); as(cx - 2, cy - 3, '#55515e'); as(cx + 2, cy - 3, '#46424e');
        for (const [sx, s2] of [[180, 1], [204, -1]]) { const y = yAt(sx) + 4; for (const [dx, dy] of [[0, 0], [s2, 1], [2 * s2, 1], [3 * s2, 0], [2 * s2, -1]]) as(sx + dx, y + dy, '#55515e'); }
        // 문 기둥 쇠살 (아치 끝에서 문턱까지, 돌기둥 안쪽 면에 붙음) · 경첩 고리
        for (const px of [179, 204]) { for (let y = yAt(px) + 3; y <= RY1 + 4; y++) { as(px, y, '#6e6a7a'); as(px + (px < 192 ? 1 : -1), y, '#46424e'); } for (const yy of [RY1 - 8, RY1 + 1]) { as(px + (px < 192 ? 2 : -2), yy, '#8a8696'); } }
        blit(AM); FGK.push([...AM.keys()]); }
      pillar(164, false); pillar(206, true);
      // 앞 담 위 쇠창살 울타리: 담 윗면에 박힌 창끝 창살 · 위아래 가로대 · 마디마다 굵은 기둥 (둥근 머리) · 군데군데 녹 · 휜 창살 하나
      { const FM = new Map(), fs = (x, y, c) => FM.set(x + ',' + y, c), yb = RY1 + 1, H = 8;
        for (const [xa, xb] of [[RX0 - 6, 163], [222, RX1 + 7]]) { for (let x = xa; x < xb; x++) { fs(x, yb - 1, '#46424e'); fs(x, yb - H + 2, (x & 1) ? '#5e5a6a' : '#6e6a7a'); }
          for (let x = xa + 1; x < xb - 1; x += 3) { const bent = h2(x, 3, 997) < 0.04 ? 1 : 0; for (let k = 0; k < H; k++) fs(x + (bent && k > 4 ? 1 : 0), yb - k, k === H - 1 ? '#a8a4b4' : h2(x, k, 998) < 0.1 ? '#6a4a3a' : (k < 2 ? '#3e3a48' : '#5e5a6a')); fs(x + bent, yb - H, '#c4c0cc'); }
          for (let x = xa + 7; x < xb - 3; x += 14) { for (let k = 0; k < H + 1; k++) { fs(x, yb - k, '#7a7686'); fs(x + 1, yb - k, '#46424e'); } fs(x, yb - H - 1, '#b4b0c0'); fs(x + 1, yb - H - 1, '#6e6a7a'); fs(x, yb - H - 2, '#8a8696'); fs(x + 1, yb - H - 2, '#55515e'); } }
        blit(FM); FGK.push([...FM.keys()]); }
      // 쇠문짝 두 짝: 창끝 창살 · 위아래 가로대 · 가운데 고리 장식 · 녹. 왼쪽은 안으로 반쯤 열림, 오른쪽은 경첩 하나 빠져 비뚤게 기움
      const IRN = { h: '#9a96a6', m: '#5e5a6a', d: '#3e3a48', r: '#6a4a3a' };
      const LK = [], lput = (x, y, c) => { put(x, y, c); LK.push(x + ',' + y); };
      const leaf = (hx, hy, vx, vy, n, sag) => { for (let i = 0; i <= n; i++) { const x = Math.round(hx + vx * i / n), yb = Math.round(hy + vy * i / n + sag * (i / n) ** 2), h = 12;
          if (i % 2 === 0 || i === n) { for (let k = 0; k < h; k++) lput(x, yb - k, k < 2 ? IRN.d : (h2(x, k, 907) < 0.12 ? IRN.r : IRN.m)); lput(x, yb - h, IRN.h); lput(x, yb - h - 1, K); lput(x - 1, yb - h, K); lput(x + 1, yb - h, K); lput(x, yb + 1, K); }
          else { lput(x, yb - 1, IRN.d); lput(x, yb - h + 2, IRN.h); lput(x, yb - h + 3, IRN.d); lput(x, yb - 6, IRN.m); lput(x, yb - 5, IRN.d); lput(x, yb - 7, IRN.d); lput(x, yb, K); } } };
      leaf(181, RY1 + 4, 10, 0, 10, 0); leaf(202, RY1 + 4, -8, -3, 8, 2);
      FGK.push(LK); // 문짝도 캐릭터를 가림
      FGK_ALL = FGK; }
  
    // ================================================================ 7. 빛 (디더): 비석 윗면 달빛 · 천막 입구 등불빛이 앞 땅으로 · 판 무덤 안 짙은 그늘
    { const D = P.g.getImageData(0, 0, GW, GH).data;
      const glowAt = (x, y, lv, tint) => { if (lv < bay(x, y) * 0.9) return; const k = lv > 0.6 ? 0.4 : lv > 0.35 ? 0.26 : 0.15, i = (y * GW + x) * 4; put(x, y, toHex(D[i] + (tint[0] - D[i]) * k + 10 * k, D[i + 1] + (tint[1] - D[i + 1]) * k + 10 * k, D[i + 2] + (tint[2] - D[i + 2]) * k + 10 * k)); };
      const MOON = rgbOf('#b8c0e0'), LAMP = rgbOf('#f0b060');
      // 비석 윗면: 각 비석의 맨 위 밝은 돌 칸에 달빛
      for (const n of ['g1', 'g2', 'g3', 'g4', 'g5', 'g6']) { const p = PROPS.find(q => q.n === n), [a, b, c] = p.b; for (let y = b; y < b + 6; y++) for (let x = a; x < c; x++) { const i = ((y + (p.dy || 0)) * GW + x + (p.dx || 0)) * 4, r = D[i], g = D[i + 1], bb = D[i + 2]; if (Math.abs(r - bb) < 20 && r > 110 && y === b + (h2(x, 1, 999) < 0.5 ? 0 : 1)) glowAt(x + (p.dx || 0), y + (p.dy || 0), 0.3, MOON); } }
      // 천막 등불빛 (입구 앞 땅)
      for (let y = 90; y < 103; y++) for (let x = 96; x < 128; x++) { const d = Math.hypot((x - 111) / 15, (y - 91) / 9); if (d < 1) glowAt(x, y, (1 - d) * 0.65, LAMP); } }
  
    // ================================================================ 7b. 밤 색 (색 보정): 불빛 밖은 채도를 빼고 푸른 회색으로 · 밝은 점은 눌러 줌. 가로등 · 천막 등불 둘레만 원래 따뜻한 색
    { const D = P.g.getImageData(0, 0, GW, GH).data, WL = [[90, 140, 34], [298, 140, 34], [111, 90, 26], [222, 57, 9]];
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const i = (y * GW + x) * 4, r = D[i], g = D[i + 1], b = D[i + 2], sum = r + g + b; if (sum > 560 || (r > 200 && r > b + 80)) continue; // 불꽃
        let keep = 0; for (const [lx, ly, lr] of WL) { const q = Math.hypot(x - lx, (y - ly) * 1.25) / lr; if (q < 1) keep = Math.max(keep, 1 - q); }
        const amt = 0.62 * (1 - Math.min(1, keep * 1.6)); if (amt <= 0.01) continue;
        let Y = 0.3 * r + 0.55 * g + 0.15 * b; if (Y > 120) Y = 120 + (Y - 120) * 0.55; // 밝은 점 누름
        const nr = Y * 0.82, ng = Y * 0.92, nb = Y * 1.12 + 4;
        put(x, y, toHex(r + (nr - r) * amt, g + (ng - g) * amt, b + (nb - b) * amt)); } }
    // ================================================================ 8. 어둠 (디더): 맵 전체에 밤이 내려앉게 — 가장자리 · 구석일수록 짙게, 가로등 · 천막 등불 둘레만 걷힘. 4×4 디더로 두 단계 어둡게 (불꽃 · 밝은 빛은 그대로)
    { const D = P.g.getImageData(0, 0, GW, GH).data, LT = [[90, 140, 38], [298, 140, 38], [111, 90, 28], [223, 55, 18]];
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { let d = 0.34 + 0.75 * Math.pow(Math.min(1.3, Math.hypot((x - CX) / 175, (y - 112) / 110)), 1.6);
        for (const [lx, ly, lr] of LT) { const q = Math.hypot(x - lx, (y - ly) * 1.25) / lr; if (q < 1) d -= (1 - q) * 0.85; }
        if (d <= 0) continue; const i = (y * GW + x) * 4; if (D[i] + D[i + 1] + D[i + 2] > 560) continue;
        const b = bay(x, y), k = b < d - 0.5 ? 2 : b < d ? 1 : 0; if (!k) continue; const f = k === 1 ? 0.68 : 0.48;
        put(x, y, toHex(D[i] * f + 6 * (1 - f), D[i + 1] * f + 7 * (1 - f), D[i + 2] * f + 16 * (1 - f))); } }
    { const D2 = P.g.getImageData(0, 0, GW, GH).data; GRAVE_FG = FGK_ALL.map(keys => ({ base: RY1 + 7, pix: [...new Set(keys.flatMap(k => { const [x, y] = k.split(',').map(Number); return [k, (x + 1) + ',' + y, (x - 1) + ',' + y, x + ',' + (y + 1), x + ',' + (y - 1)]; }))].map(k => { const [x, y] = k.split(',').map(Number), i = (y * GW + x) * 4; return [x, y, toHex(D2[i], D2[i + 1], D2[i + 2])]; }) })); }
    // 가로등 불꽃 칸 기록 (움직임에서 깜빡임)
    { const D = P.g.getImageData(0, 0, GW, GH).data; GRAVE_FLAMES = []; for (const [a, b, c, d] of [[78, 128, 100, 150], [290, 128, 311, 150], [222, 50, 226, 53]]) for (let y = b; y < d; y++) for (let x = a; x < c; x++) { const i = (y * GW + x) * 4; if (D[i] > 220 && D[i + 1] > 150 && D[i + 2] < 140) GRAVE_FLAMES.push([x, y, toHex(D[i], D[i + 1], D[i + 2])]); } }
    // 까마귀 자리 (나뭇가지) 뒤 색 기록
    { const D = P.g.getImageData(0, 0, GW, GH).data; GRAVE_BG = {}; for (let y = 32; y < 41; y++) for (let x = 265; x < 277; x++) { const i = (y * GW + x) * 4; GRAVE_BG[x + ',' + y] = toHex(D[i], D[i + 1], D[i + 2]); } }
  };
  }
  SCENES.gunner.fg = () => GRAVE_FG;
  // ================================================================ 움직임: 바닥 안개 · 가로등 깜빡임 · 도깨비불 · 나뭇가지 까마귀 · 바람에 풀
  SCENES.gunner.fx = (t, cell) => {
    const [RX0, RY0, RX1, RY1] = ROOM0;
    const gt = t % 8.7, gust = gt < 1.4 ? Math.sin(Math.PI * gt / 1.4) : 0;
    // 바닥 안개: 낮은 띠 셋이 서로 다른 빠르기로 옆으로 흐름 (디더 점 · 옅게)
    for (const [y0, sp, a0] of [[RY0 + 52, 2.2, 0.28], [RY0 + 86, -1.6, 0.24], [RY0 + 112, 1.2, 0.2]]) for (let y = y0 - 3; y <= y0 + 3; y++) for (let x = RX0; x < RX1; x += 1) { const u = x - t * sp, n = h2(Math.floor(u / 9), Math.floor(y / 3), 951) * 0.6 + h2(Math.floor(u / 4), y, 952) * 0.4, d = 1 - Math.abs(y - y0) / 4; if (n * d < 0.42) continue; if (((x + y) & 1) === 0) continue; cell(x, y, '#9aa8b4', a0 * d); }
    // 가로등 불꽃 깜빡임
    if (GRAVE_FLAMES) { const f = Math.floor(t * 9); for (const [x, y, c] of GRAVE_FLAMES) { const v = h2(f, x + y, 953); if (v < 0.22) cell(x, y, '#c87830', 1); else if (v > 0.85) cell(x, y, '#fff4c8', 1); } }
    // 도깨비불: 무덤 위로 가끔 떠올라 흔들리다 사라짐 (푸른빛)
    for (let i = 0; i < 2; i++) { const per = 9 + i * 4, ph = ((t + i * 5.3) % per) / per; if (ph > 0.45) continue; const k = ph / 0.45, cyc = Math.floor((t + i * 5.3) / per), gx = [113, 145, 180, 116, 141, 180][Math.floor(h2(cyc, i, 954) * 6)], gy = [100, 96, 101, 136, 140, 135][Math.floor(h2(cyc, i, 954) * 6)];
      const x = Math.round(gx + Math.sin(k * 9) * 2), y = Math.round(gy - k * 12), a = Math.sin(Math.PI * k); cell(x, y, '#c8f0ff', a); cell(x, y + 1, '#6ab0e0', a * 0.8); cell(x - 1, y, '#4a90c8', a * 0.5); cell(x + 1, y, '#4a90c8', a * 0.5); }
    // 까마귀: 마른 나무 가지 끝에 앉아 몇 초에 한 번 고개를 돌림 (바람 불면 깃 부풂)
    { const x = 267, y = 34, turn = (t % 5.3) > 4.6; if (GRAVE_BG) for (let yy = y - 1; yy < y + 6; yy++) for (let xx = x - 1; xx < x + 8; xx++) { const c = GRAVE_BG[xx + ',' + yy]; if (c) cell(xx, yy, c, 1); }
      const R = turn ? ['..kk...', '.kkkkb.', 'kkkkkk.', '.kkkk..', '..k.k..'] : ['...kk..', 'bkkkk..', '.kkkkkk', '..kkkk.', '..k.k..'], pal = { k: '#141018', b: '#c09038' };
      R.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') cell(x + i, y + j, pal[ch], 1); })); cell(x + (turn ? 2 : 4), y + 1, '#e8e0d0', 1); if (gust > 0.5) cell(x + 1, y, '#141018', 1); }
    // 바람: 담 밑 웃자란 풀 끝이 기움
    if (gust > 0.3) for (let x = RX0 + 1; x < RX1 - 1; x++) { const n = h2(x, 7, 807); if (n < 0.75) continue; const hgt = 1 + Math.floor((n - 0.5) * 8); cell(x + 1, RY0 + 5 - (hgt - 1), '#4e6e3c', 1); }
  };
  SCENES.gunner.lights = [{ x: 90, y: 138, r: 38, a: 0.72, c: [255, 170, 80], fl: 1 }, { x: 298, y: 138, r: 38, a: 0.72, c: [255, 170, 80], fl: 2 }, { x: 192, y: 205, r: 26, a: 0.14, c: [230, 140, 90] }, { x: 111, y: 86, r: 20, a: 0.5, c: [255, 170, 80], fl: 3 }, { x: 223, y: 53, r: 16, a: 0.45, c: [255, 170, 80], fl: 4 }];
  SCENES.gunner.amb = 0.36;
  // v3.16 하비 대사: 그레이브에게 빚이 있는 현상금 사냥꾼 (라이벌이라는 말은 대사에 넣지 않음)
  const HABI_GREET = ['일어났나, 그레이브.', '총은 챙겼나. 오늘은 납과 화약이 필요한 날이다.', '…또 그 표정이군.'];
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
    knight: { line: '…맹세를 지켜야 해.', obs: [[108, 60, 16], [262, 56, 14], [212, 98, 9], [228, 98, 9], [244, 98, 9], [260, 98, 9], [276, 98, 9], [106, 112, 6], [118, 112, 6], [130, 112, 6], [258, 140, 6], [270, 140, 6]] /* v3.18 작아진 무기 거치대 */, wm: [6, 130] },
    ranger: { line: '…피 냄새가 나.', rects: [[96, 87, 131, 91], [143, 87, 156, 91], [152, 54, 156, 91]], obs: [[238, 66, 7], [252, 66, 7], [266, 66, 7], [281, 68, 7], [238, 77, 5], [232, 79, 2], [188, 106, 12], [110, 150, 10], [108, 134, 7], [122, 138, 6], [131, 143, 6], [268, 150, 10], [268, 136, 6], [281, 154, 5]] /* v3.18 역참: 넓어진 탁자 · 포대 · 옆 상자 */, wm: [26, 157] },
    mage: { line: '…별자리 하나가 끝내 이어지지 않네요.', obs: [[70, 48, 26], [314, 48, 26], [70, 182, 28], [314, 182, 28], [130, 125, 6], [137, 92, 6], [184, 87, 6], [192, 87, 6], [200, 87, 6], [212, 88, 3], [262, 92, 6], [238, 110, 7], [252, 110, 7], [266, 110, 7], [276, 110, 6], [106, 95, 8], [288, 112, 5]] /* v3.18 보면대 · 책 더미 옮김 */, wm: [3, 146] },
    priest: { line: '…오늘도 대답이 없으시군요.', obs: [], wm: [16, 132] },
    gunner: { line: '…한 발 남았군.', obs: [[294, 120, 6], [94, 82, 8], [110, 74, 10], [126, 80, 8], [138, 72, 8], [171, 74, 7], [188, 74, 5], [109, 106, 5], [145, 105, 5], [181, 105, 5], [116, 141, 5], [141, 145, 5], [178, 139, 5], [212, 104, 8], [226, 104, 8], [248, 92, 7], [216, 68, 7], [229, 68, 7], [291, 97, 5], [236, 138, 8], [250, 138, 8], [270, 148, 7], [282, 148, 7], [84, 166, 4], [304, 166, 4], [171, 172, 7], [213, 172, 7]], wm: [4, 157] },
  };
  { // v2.86 관측탑: 칠판 · 보면대 · 혼천의는 그림 전체를 막고(뒤로 돌아가 위를 밟지 않게), 둥근 벽의 책장은 벽처럼 바닥선까지 막는다
    const r = INFO.mage.rects = [[86, 58, 126, 98], [248, 56, 276, 96], [236, 56, 298, 121], [72, 40, 82, 200], [302, 40, 312, 200]]; // 책상 · 책 더미는 뒤로 못 들어가게 그림 전체
    for (let x = 72; x < 312; x += 4) { let m = -1e9; for (let i = x; i < x + 4; i++) { const t = (i + 0.5 - 192) / 118; m = Math.max(m, Math.abs(t) <= 1 ? Math.round(114 + 64 * Math.sqrt(1 - t * t)) : 0); } if (m < 177) r.push([x, m, x + 4, 200]); } // 둥근 벽 아래쪽 · 옆쪽: 바닥 원 밖은 막음
    for (let x = 72; x < 312; x += 4) { let m = 1e9; for (let i = x; i < x + 4; i++) { const t = (i + 0.5 - 192) / 118; if (Math.abs(t) <= 1) m = Math.min(m, Math.round(114 - 64 * Math.sqrt(1 - t * t))); } if (m < 1e9) r.push([x, 40, x + 4, m]); }
  }
  { // 수도원: 신도석 줄 · 제단 · 종
    const o = INFO.priest.obs;
    [72, 92, 112, 132, 152].forEach((y, i) => { for (let x = 92; x <= 160; x += 12) o.push([x, y + 5, 6]); if (i !== 3) for (let x = 220; x <= 288; x += 12) o.push([x, y + 5, 6]); });
    o.push([176, 48, 8], [192, 48, 8], [208, 48, 8], [146, 46, 4], [236, 46, 4], [270, 146, 9]);
  }
  // v3.19 외곽선 기준: 구조물 안에 놓인 작은 물건은 검은 외곽선 대신 제 색을 어둡게 (장면을 다 그린 뒤 그 자리만 바꿈)
  SCENES.ranger.deOut = P => { const top = RY0 - 22; deOutlineCtx(P.g, 233, top, 284, top + 20, { keepLine: true }); }; // 버려진 역참 · 벽 선반 2단
  SCENES.mage.deOut = P => deOutlineCtx(P.g, 239, 101, 280, 111, { bg: ['#9c7a56', '#a8845e', '#8e6e50', '#c8a880', '#b89470', '#6e5038'] }); // 외딴 관측탑 · 책상 윗면
  const ART = {};
  function art(cls) { // 장면 그림 (칸 384×216) — 한 번만 만든다
    if (ART[cls]) return ART[cls];
    const S = SCENES[cls]; setRoom(S.room); const P = Grid(); S.draw(P); if (S.deOut && window.DEOUT !== false) S.deOut(P);
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
    if (SCENES[R.cls].tileOut) { // v3.18 야외(이름 없는 묘지): 끝 칸을 늘이면 줄무늬로 깨지므로, 끝 띠를 거울로 번갈아 이어 붙여 숲을 이어 그림
      const S = 48, strip = (sx, dx, flip) => { g.save(); if (flip) { g.translate(dx + S * 2, 0); g.scale(-1, 1); dx = 0; } g.drawImage(a.c, sx, 0, S, GH, dx, o.y, S * 2, GH * 2); g.restore(); };
      let k = 0; for (let dx = o.x - S * 2; dx > -S * 2; dx -= S * 2, k++) strip(0, dx, k % 2 === 0);
      k = 0; for (let dx = o.x + GW * 2; dx < W; dx += S * 2, k++) strip(GW - S, dx, k % 2 === 0);
    }
    g.drawImage(a.c, o.x, o.y, GW * 2, GH * 2);
    g.restore();
  }
  // 빛: 장면의 빛 목록을 게임 광원으로
  function lights(list) {
    const R = G && G.dun && G.dun.cur; if (!R || R.type !== 'home') return;
    for (const l of SCENES[R.cls].lights) { const p = toW(R.cls, l.x, l.y); const nb = window.NIGHT !== false && l.fl != null ? 1.3 : 1; /* v3.19 밤: 깜빡이는 불(등불 · 초 · 화로)은 더 넓고 밝게 — 광원이 읽히게 */ list.push({ x: p.x, y: p.y, r: l.r * 2 * (nb > 1 ? 1.2 : 1), a: Math.min(1, l.a * 1.5 * nb * (l.fl != null ? homeFlick(l.fl, time) : 1)), /* v3.18 fl: 등불 · 초 깜빡임 */ c: l.c ? (l.win && window.NIGHT !== false ? '130,150,215' : l.c.join(',')) : undefined, ca: l.c ? 0.12 : 0 }); } // v3.19 밤: 창빛(win)은 푸른 달빛
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
    { const S1 = SCENES[R.cls], F1 = S1 && S1.fg && S1.fg(); if (F1) for (const f of F1) { if (!f.cv) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of f.pix) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } const [cv, g] = mk((x1 - x0 + 1) * 2, (y1 - y0 + 1) * 2); for (const [x, y, c] of f.pix) { g.fillStyle = c; g.fillRect((x - x0) * 2, (y - y0) * 2, 2, 2); } f.cv = cv; f.p = toW(R.cls, x0, y0); }
      list.push({ y: toW(R.cls, 0, f.base).y, d: () => ctx.drawImage(f.cv, f.p.x, f.p.y) }); } } // v3.18 캐릭터를 가리는 앞쪽 구조물 (성채 성문 기둥)
    { const S1 = SCENES[R.cls]; if (S1 && S1.fx) list.push({ y: -1e9, d: () => S1.fx(time, (x, y, c, a) => { const p = toW(R.cls, x, y); ctx.globalAlpha = a; ctx.fillStyle = c; ctx.fillRect(p.x, p.y, 2, 2); ctx.globalAlpha = 1; }) }); } // v3.18 장면 움직임 (바람 · 먼지 · 불꽃)
    if (R.cls === 'mage') { const o = off('mage'); list.push({ y: 1e9, d: () => { const im = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.drawImage(ringFg(), o.x, o.y, GW * 2, GH * 2); ctx.imageSmoothingEnabled = im; } }); }
    { const S1 = SCENES[R.cls]; if (S1 && S1.over) { const o = off(R.cls); list.push({ y: 1e9 - 1, d: () => { const im = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; S1.over(ctx, time, o); ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = im; } }); } } // v3.18 장면 맨 위 겹 (묘지 구름 그림자)
    { const S2 = SCENES[R.cls], N2 = S2 && S2.npc2; if (N2) { const p = toW(R.cls, N2.x, N2.y); list.push({ y: p.y, d: () => { // v3.11 하비 (숨 고르기 · 깜빡임은 플레이어블 캐릭터와 같게)
      const n = Math.floor((time + 0.3) / 0.6) % 2, bt = (time + 3.3) % 8.6, blink = bt < 0.12 || (bt >= 4.3 && bt < 4.42), fk = (n ? 'idle' : 'base') + (blink ? 'B' : '');
      const c = npcArt('habi' + fk, () => { const rows = HABI.f[fk], [cv, g] = mk(rows[0].length * 2, rows.length * 2); rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.' || !HABI.p[ch]) return; g.fillStyle = HABI.p[ch]; g.fillRect(x * 2, y * 2, 2, 2); })); return cv; });
      const fr = HABI.f.base[HABI.f.base.length - 1]; let a0 = -1, a1 = -1; for (let i = 0; i < fr.length; i++) if (fr[i] !== '.') { if (a0 < 0) a0 = i; a1 = i; }
      const x = Math.round(p.x - (a0 + a1 + 1)) & ~1, y = (p.y - c.height + 2) & ~1;
      dshEll(ctx, p.x, p.y + 1, 10, 3, 0.5); /* v3.23 디더 그림자 */
      ctx.drawImage(c, x, y);
    } }); } }
    { const hp = habiPos(); if (hp && TK.on !== 'habi') { const P = G.player, near = P && !P.dead && Math.hypot(P.x - hp.x, P.y - hp.y) < 80, say = npcTalk('habi', near, HABI_LINES, HABI_GREET); if (say) list.push({ y: hp.y, d: () => drawBubble(say.line, hp.x, hp.y - 26, 0) }); } } // v3.16 하비 인사 · 혼잣말
    const S = SCENES[R.cls], N = S && S.npc; if (!N) return;
    const p = toW(R.cls, N.x, N.y), dp = toW(R.cls, N.dag[0], N.dag[1]);
    const tt = (time + 3.1) % DG_CYC, A = TK.on === 'dangun' ? { stuck: true } : dgAnim(tt, p, dp); // 대화하는 동안에는 묘기를 멈추고 단도는 제자리에
    if (A.hit && !dgAnim.hitT0) { dgAnim.hitT0 = true; dust(dp.x, dp.y + 2, 5); } else if (!A.hit) dgAnim.hitT0 = false;
    const daggerC = () => npcArt('dagger', () => gCanvas(gOutline(fromRows(DAGGER)), DAGGER_PAL));
    list.push({ y: dp.y, d: () => { dshEll(ctx, dp.x + 1, dp.y + 1, 4, 2, 0.5); /* v3.23 디더 그림자 */ if (!A.stuck) return; const c = daggerC(); ctx.drawImage(c, ((dp.x - c.width / 2) & ~1) + (A.wob || 0), (dp.y - c.height + 4) & ~1); } });
    list.push({ y: p.y, d: () => {
      const n = Math.floor(time / 1.2), t = time % 1.2, crouch = A.crouch || (!A.dag && !A.lean && t >= 0.6), tail = A.tail || A.pose || (n % 3 === 0 && t < 0.3), bt = (time + 2.1) % 8.6, blink = !A.dag && (bt < 0.12 || (bt >= 4.3 && bt < 4.42) || (bt >= 4.6 && bt < 4.72));
      const c = npcArt('dangun' + (+crouch) + (+blink) + (+tail), () => gCanvas(fromRows(dangunRows(crouch, blink, tail)), DANGUN_PAL));
      const x = ((p.x - c.width / 2) & ~1) + (A.lean || 0) * 2, y = (p.y - c.height + 2) & ~1;
      dshEll(ctx, x - (A.lean || 0) * 2 + c.width / 2, y + c.height - 1, (c.width - 8) / 2, 3, 0.5); /* v3.23 디더 그림자 */
      ctx.drawImage(c, x, y);
      if (A.look) { ctx.fillStyle = '#1a1410'; ctx.fillRect(x + 8, y + 10, 2, 2); ctx.fillRect(x + 16, y + 10, 2, 2); ctx.fillStyle = '#f6f2ea'; ctx.fillRect(x + 8, y + 12, 2, 2); ctx.fillStyle = '#d98a3e'; ctx.fillRect(x + 16, y + 12, 2, 2); } // 위로 치켜뜬 눈
      const P = G.player, near = P && !P.dead && Math.hypot(P.x - p.x, P.y - p.y) < 80, say = TK.on === 'dangun' ? null : npcTalk('dangun', near, DANGUN_LINES, DANGUN_GREET);
      if (say) drawBubble(say.line, p.x, y + 2, 0);
    } });
    // 손에 든 단도 · 검 궤적 · 앞발: 손끝 오른쪽(몸 쪽)으로 넘어간 부분은 단군 뒤에, 나머지는 앞에 (몸 옆에서 세로로 도는 느낌)
    const held = back => { if (!A.dag) return; const D = A.dag, hx = A.paw ? A.paw.x : D.x, sd = A.side || -1, isBack = x => sd < 0 ? x > hx + 1 : x < hx - 1; // 몸 쪽으로 넘어간 부분은 뒤에
      if (A.arc && A.arc.v > 0.12) { const { a, v, d } = A.arc, sw = 0.5 + 2.4 * v, seen = new Set(); // 흰 검 궤적: 칼끝이 지나간 자리를 가는 초승달로 (앞은 하얗고 두 칸 → 꼬리는 한 칸으로 가늘어지며 흩어짐)
        for (let q = 0; q <= 48; q++) { const f = q / 48, b = a - f * sw * d, ro = 16 - f * 1.5, ri = f < 0.35 ? ro - 4 : f < 0.7 ? ro - 2 : ro - 0.5;
          for (let r = ri; r <= ro; r += 1) { const x = (D.x - Math.sin(b) * r) & ~1, y = (D.y + Math.cos(b) * r) & ~1, key = x + ',' + y; if (seen.has(key) || isBack(x) !== back) continue; seen.add(key);
            if (f > 0.55 && ((x + y) >> 1) & 1) continue; if (f > 0.82 && ((x >> 1) + (y >> 1) * 3) % 3) continue;
            ctx.fillStyle = f < 0.35 ? (r > ro - 2 ? '#ffffff' : '#dfe3ee') : f < 0.7 ? '#c8ccd8' : '#9a9eaa'; ctx.fillRect(x, y, 2, 2); } } }
      const ta = D.i / 16 * Math.PI * 2, tipBack = isBack(D.x - Math.sin(ta) * 10); if (tipBack !== back && !(A.arc == null && !back)) { if (A.arc || back) return; }
      if (!A.arc && back) return;
      const r = dagRot(D.i); ctx.drawImage(r, (D.x - 23) & ~1, (D.y - 23) & ~1);
      if (A.glint && !back) { const gx = (D.x) & ~1, gy = (D.y - 16) & ~1; ctx.fillStyle = '#ffffff'; ctx.fillRect(gx, gy - 4, 2, 10); ctx.fillRect(gx - 4, gy, 10, 2); ctx.fillStyle = '#fff4c8'; ctx.fillRect(gx - 2, gy - 2, 2, 2); ctx.fillRect(gx + 2, gy + 2, 2, 2); } }; // 칼끝 번쩍
    list.push({ y: p.y - 0.5, d: () => held(true) });
    list.push({ y: Math.max(p.y, dp.y) + 1, d: () => { held(false); // 앞발은 늘 앞에
      if (A.paw) { const px = (A.paw.x - 2) & ~1, py = (A.paw.y - 2) & ~1; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(px - 2, py, 8, 4); ctx.fillRect(px, py - 2, 4, 8); ctx.fillStyle = '#f6f2ea'; ctx.fillRect(px, py, 4, 4); ctx.fillStyle = '#d8d0c4'; ctx.fillRect(px, py + 2, 4, 2); } } });
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
    try { window.AudioSys.setMood('pro_' + G.cls, true); if (G) G.mood = 'pro_' + G.cls; } catch (e) { /* 소리 없음 */ } // v3.19 캐릭터별 프롤로그 곡
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
    { const nt = `${SAVE.runs}번째 밤`; ctx.font = '12px Galmuri11'; ctx.fillStyle = '#000'; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]]) ctx.fillText(nt, x + dx, y - 32 + dy); ctx.fillStyle = '#9ab0d8'; ctx.fillText(nt, x, y - 32); ctx.font = 'bold 24px Galmuri11'; } // v3.23 회차 = 밤 (장소 이름 위)
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
