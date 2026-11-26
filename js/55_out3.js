'use strict';
// 잿빛 왕관 원정대 — 55_out3.js : v3.26 시안02 — 3장 벽 바깥 (좌 · 우 · 아래)
// 컨셉: 「고원 위의 부락」 — 부락은 고원 위에 있고, 울타리 너머는 벼랑 · 그 아래 낮은 땅은 아지랑이 속에 깊게 가라앉음. 다른 고원들과는 구름다리로 이어짐
//  · 울타리: 위쪽 통나무 말뚝 벽과 같은 나무 · 같은 굵기(12px) · 같은 깎은 끝 — 좌 · 우는 위에서 본 말뚝 머리 줄(묶은 밧줄 띠), 아래는 짧은 말뚝 앞면
//  · 울타리 바깥: 고원 가장자리 흙 턱 → 벼랑 끝 밝은 선 → 붉은 흙 · 바위 지층 벼랑면(아래는 높게, 좌 · 우는 좁게) → 벼랑 밑 먼지 아지랑이 → 아득히 낮은 땅
//  · 바깥 기물 없음
//  · 문: 좌 · 우 · 아래 울타리를 가르고 흙길이 고원 끝까지 → 구름다리로 맞은편 고원과 이어짐. 닫히면 문 크기에 맞춘 가시 말뚝 바리케이드(새로 그림) · 북문은 통나무 문이 위로 들려 열림
const OUT3 = (() => {
  const hh = (x, y, s) => FP.hh(x, y, s);
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sm = v => v * v * (3 - 2 * v), a = (i, j) => hh(xi + i, yi + j, s); return (a(0, 0) * (1 - sm(fx)) + a(1, 0) * sm(fx)) * (1 - sm(fy)) + (a(0, 1) * (1 - sm(fx)) + a(1, 1) * sm(fx)) * sm(fy); };
  const WD = { hi: '#d8b080', tip: '#c8a070', h: '#9a6a40', l: '#7a5030', d: '#553620', D: '#33200f', K: '#060403', rope: '#4a3a24', rope2: '#6a5634' }; // 위쪽 말뚝 벽과 같은 나무색
  const LIP = ['#6e4628', '#5a3a20', '#46301a']; // 고원 가장자리 흙
  const CLF = ['#7a4426', '#62361e', '#4c2a17', '#3a2012', '#2a170d', '#1c0f08']; // 벼랑면 지층 (밝 → 어둠)
  const LOW = ['#1a0d08', '#140a06', '#0e0704', '#090403']; // 아래 낮은 땅 (아득히 어둡게)
  const HAZE = ['#3a1c12', '#2c160e', '#22110b']; // 벼랑 밑 먼지 아지랑이 (하늘 붉은 빛과 같은 결)
  const PT = 12, LG = 14, CF = 130, CS = 16, PW = 20; // 말뚝 굵기 · 고원 턱 · 아래 벼랑 높이 · 좌우 벼랑 폭 · 흙길 반폭
  let ON = true;
  const on3 = R => ON && G && G.stage === 3 && R && !['forge', 'home', 'archive', 'lab', 'den', 'ruin', 'altar', 'ancArena'].includes(R.type) && !(G.dun && (G.dun.forge || G.dun.anc)); // v3.56 선조의 결투장 제외
  const geo = () => ({ L: A.x0, RR: A.x1, T: A.y0, B: A.y1, PY: CY + 2, SX: DOOR.s.x });

  // ================================================================ v3.26 시안07 — 다시 디자인
  //  · 높이감: 고원 아래는 구름 바다(위에서 빛을 받아 윗면이 밝은 구름 덩어리) · 북쪽으로 갈수록 작고 납작해지며 지평선으로 · 구름 위로 솟은 먼 메사들 · 구름에 떨어진 구름다리 그림자
  //  · 벼랑: 남쪽은 세로 기둥 결의 높은 바위벽(왼쪽 위 빛) — 아래로 갈수록 어두워지며 구름 둑에 잠김 · 좌우는 좁은 바위 옆면
  //  · 울타리: 위 · 아래 · 좌우 모두 같은 통나무 말뚝 — 둥근 통나무 음영 · 깎은 끝 두 면 · 껍질 결 · 옹이 · 밧줄 묶음 · 모서리마다 굵은 기둥
  const W2 = { K: '#120904', L: ['#c69a66', '#a2733f', '#875c32', '#6c4626', '#50321b', '#382213'], T: ['#f0cc96', '#d4a66c', '#a47444', '#7a5430'], R: ['#a08a5a', '#73603a', '#45371f'] };
  const RK = ['#a8704a', '#8a5636', '#6c3e26', '#56301e', '#422417', '#2e1810', '#1e0f08']; // 바위벽 (밝 → 어둠)
  const CL = ['#110706', '#190b08', '#22100b', '#2f150e', '#431d14', '#5c291c']; // 구름 (그늘 → 빛받은 윗면)
  const DIRT = ['#7a5232', '#6a4629', '#5a3b22', '#4a301b', '#3a2515'];
  const SKY0 = '#140806', SKY1 = '#2a0e08', HAZEC = '#3a170f';
  const fbm = (x, y, s) => vn(x, y, s) * 0.62 + vn(x * 2.13, y * 2.13, s + 5) * 0.28 + vn(x * 4.7, y * 4.7, s + 9) * 0.1;
  // 통나무 하나: x(왼쪽), tip(끝 꼭대기), base(밑), o: { w 폭, fac 깎은 면 높이, s 씨앗, broken 부러짐 }
  function logP(px, x, tip, base, o) {
    const w = o.w || 12, fac = o.fac || 10, s = o.s || 0, mid = (w - 4) / 2, dark = hh(s, 3, 77) < 0.25 ? 1 : 0, br = o.broken;
    const kx = hh(s, 5, 77) < 0.55 ? ((hh(s, 6, 77) * (w - 6)) & ~1) : -99, ky = tip + fac + 6 + ((hh(s, 7, 77) * Math.max(2, base - tip - fac - 14)) & ~1);
    for (let c = 0; c <= w - 4; c += 2) { const f = c / (w - 4), tY = br ? tip + fac - 2 + (hh(c, s, 79) < 0.5 ? 0 : 2) : tip + Math.abs(c - mid);
      const bark0 = tip + fac + (hh(c, s, 78) < 0.5 ? 0 : 2);
      for (let y = tY & ~1; y < base; y += 2) { let col;
        if (br && y < tY + 2) col = c < mid ? W2.T[1] : W2.T[2];
        else if (y < bark0) col = c === 0 ? W2.T[0] : c < mid ? W2.T[1] : c === mid ? (f < 0.5 ? W2.T[1] : W2.T[2]) : c >= w - 4 ? W2.T[3] : W2.T[2];
        else { let i = f < 0.15 ? 0 : f < 0.4 ? 1 : f < 0.62 ? 2 : f < 0.82 ? 3 : 4; i = Math.min(5, i + dark);
          if (hh(c, (y - tip) / 6 | 0, s + 11) < 0.2) i = Math.min(5, i + 1); // 껍질 결
          if (y === bark0) i = Math.min(5, i + 1); // 껍질 시작 턱
          if (Math.abs(c - kx - 2) <= 2 && Math.abs(y - ky) <= 2) i = (c === kx + 2 && y === ky) ? 5 : 4; // 옹이
          col = W2.L[i]; }
        px(x + c, y, col); }
      if (!br) px(x + c, tY - 2, o.noK ? W2.L[5] : W2.K); }
    for (let y = (tip + fac) & ~1; y < base; y += 2) px(x + w - 2, y, o.gapD && !dith((x >> 1) + 5, y >> 1, 0.5) ? W2.L[5] : W2.K); // 통나무 사이 틈
  }
  // 거칠게 꼰 밧줄: 말뚝 사이로 살짝 처지고 · 군데군데 비뚤고 · 매듭 · 풀린 올
  function ropeP(px, x0, x1, y, s = 0, skip) { const ph = ((x0 % 12) + 12) % 12;
    for (let x = x0 & ~1; x < x1; x += 2) { if (skip && skip(x)) continue; const m = ((x - x0 + ph) % 12 + 12) % 12, seg = Math.floor((x - x0) / 12);
      const taut = vn(seg / 3.5, 7, s + 403) < 0.48; // 팽팽한 일자 구간과 처진 구간이 섞임
      let dy = taut ? 0 : (m >= 4 && m <= 8 ? 2 : 0) + (hh(seg, 1, s + 401) < 0.22 ? 2 : 0) - (hh(seg, 2, s + 401) < 0.12 && m < 4 ? 2 : 0);
      const yy = y + dy; px(x, yy - 2, W2.K); for (let j = 0; j < 4; j += 2) px(x, yy + j, W2.R[((x >> 1) + (j >> 1) + seg) % 3]); px(x, yy + 4, W2.K);
      if (m === 10 && hh(seg, 3, s + 401) < 0.18) { for (let k = 0; k < 6; k += 2) px(x, yy + 4 + k, k < 4 ? W2.R[1] : W2.R[2]); } // 풀린 올
      if (m === 0 && hh(seg, 4, s + 401) < 0.25) { px(x - 2, yy - 2, W2.R[0]); px(x, yy - 2, W2.R[1]); px(x - 2, yy + 4, W2.R[2]); px(x, yy + 4, W2.R[1]); px(x + 2, yy + 4, W2.K); } } } // 매듭
  // 위쪽 말뚝 벽 (paintOrcWall 대신): 좌우 울타리 폭까지만
  { const o = paintOrcWall; paintOrcWall = function (g, R) { if (!on3(R)) return o.apply(this, arguments);
      let LY = cellLayer(0, 0, W, A.y0 + 8); const px = (x, y, c) => LY.set(x & ~1, y & ~1, c), top = A.y0 - 84, T = A.y0, sd = ((R.seed || 1) * 31 + 7) | 0;
      const FL = A.x0 - 4 - PT, FR = A.x1 + 4 + PT, HZ = T - 64;
      for (let y = 0; y < T; y += 2) for (let x = 0; x < W; x += 2) { const k = clamp((y - (top - 40)) / 60, 0, 1), hz = clamp(1 - Math.abs(y - HZ) / 26, 0, 1);
        px(x, y, hz > 0 && dith(x >> 1, y >> 1, hz * 0.8) ? HAZEC : dith(x >> 1, y >> 1, k * 0.7) ? SKY1 : SKY0); }
      LY.flush(g); LY = cellLayer(0, 0, W, A.y0 + 8);
      for (let i = 0; i < 40; i++) { const x = (hh(i, 1, sd) * W) & ~1, y = (top - 30 + hh(i, 2, sd) * 50) & ~1; g.fillStyle = 'rgba(80,30,20,.35)'; g.fillRect(x, y, (6 + hh(i, 3, sd) * 14) & ~1, 2); }
      const LW = 12; let n = 0;
      for (let x = FL & ~1; x < FR; x += LW, n++) { const tip = (top + (hh(n, 1, sd) * 4 | 0) * 2 - 4) & ~1, broken = hh(n, 2, sd) < 0.06;
        const sub = (pxx => (xx, y, c) => { if (xx < FR) pxx(xx, y, c); })(px); logP(sub, x, broken ? tip + 8 : tip, T + 2, { w: LW, fac: 12, s: n * 7 + sd, broken }); }
      for (const [k, by] of [[0, top + 24], [1, T - 26]]) ropeP(px, FL, FR, by, sd + k * 9);
      for (let x = FL & ~1; x < FR; x += 2) { if (dith(x >> 1, T >> 1, 0.6)) px(x, T + 2, W2.K); if (dith(x >> 1, (T >> 1) + 1, 0.3)) px(x, T + 4, W2.K); }
      LY.flush(g);
      // v3.26 윗벽 장식은 깃발만 (가죽 · 가시 · 해골 삭제) — 크고 거친 짐승 가죽 깃발
      const nDoor = R.doors && R.doors.n != null && !hiddenDoor(R, 'n');
      // 깃발은 대칭 한 쌍만: 북문이 있으면 문 양옆, 없으면 벽 가운데 기준 양옆 (같은 종류 · 오른쪽은 좌우 뒤집음)
      if (typeof ORC3 !== 'undefined') { const red = hh(1, 7, sd) < 0.5, c = ORC3.banner((R.seed || 1) % 5, red), yy = top + 8, ax = nDoor ? DOOR.n.x : Math.round((A.x0 + A.x1) / 4) * 2, off = nDoor ? 80 : 96;
        for (const sg of [-1, 1]) { const mx = ax + sg * off, x0 = (mx - c.width / 2) & ~1; if (sg < 0) g.drawImage(c, x0, yy & ~1); else { g.save(); g.translate(x0 + c.width, yy & ~1); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); } } }
    }; }

  function paint(g, R) {
    const LY = cellLayer(0, 0, W, H), px = (x, y, c) => LY.set(x & ~1, y & ~1, c);
    const sd = ((R.seed || 1) * 17 + 3) | 0, { L, RR, T, B, PY, SX } = geo();
    const D = R.doors || {}, dW = D.w != null && !hiddenDoor(R, 'w'), dE = D.e != null && !hiddenDoor(R, 'e'), dS = D.s != null && !hiddenDoor(R, 's');
    const FL = L - 4 - PT, FR = RR + 4 + PT, FB = B + 30, HZ = T - 64;
    const lipL = FL - LG, lipR = FR + LG, lipB = FB + LG, TT = T - 12, LAND = 118, RC = 18;
    const jag = (t, s) => Math.round((vn(t / 14, s, sd + 3) - 0.5) * 6 / 2) * 2;
    const gapW = y => dW && Math.abs(y - PY) < PW + 2, gapE = y => dE && Math.abs(y - PY) < PW + 2, gapS = x => dS && Math.abs(x - SX) < PW + 2;
    const rr = d => d >= RC ? 0 : Math.round((RC - Math.sqrt(Math.max(0, RC * RC - (RC - d) * (RC - d)))) / 2) * 2;
    // 고원 하나 (우리 고원 · 다리가 닿는 맞은편 고원): 둥근 모서리 · 들쭉날쭉한 끝선
    const mk = (x0, x1, y0, y1, s, ours) => { const j = (t, k) => jag(t, s * 10 + k);
      const mm = f => { const m = new Map(); return t => { let v = m.get(t); if (v === undefined) { v = f(t); m.set(t, v); } return v; }; };
      const p = { x0, x1, y0, y1, ours, eL: mm(y => x0 + j(y, 1) + rr(Math.min(y1 - y, y - y0))), eR: mm(y => x1 + j(y, 2) - rr(Math.min(y1 - y, y - y0))), eB: mm(x => y1 + j(x, 3) - rr(Math.min(x - x0, x1 - x))), CF: mm(x => CF + j(x, 9) * 3), SW: mm(y => CS + j(y, 11)) };
      p.top = (x, y) => y >= y0 && y < y1 + 8 && x >= x0 - 8 && x < x1 + 8 && x >= p.eL(y) && x < p.eR(y) && y < p.eB(x);
      p.face = (x, y) => { if (x < x0 + j(y, 1) - 2 || x >= x1 + j(y, 2) + 2) return -1; const e = p.eB(x), v = y - e; return v >= 0 && v < p.CF(x) ? v : -1; };
      p.side = (x, y) => { if (y < y0 || y >= y1 + 30) return 0; const l = p.eL(y) - x, r = x - p.eR(y) + 1, sw = p.SW(y), ok = d => d > 0 && d <= sw && y >= y0 + rr(sw - d) * 0.6; if (ok(l)) return l; if (ok(r)) return -r; return 0; };
      return p; };
    const P0 = mk(lipL, lipR, TT, lipB, 1, true), PS = [P0];
    if (dW) PS.push(mk(-400, lipL - LAND, PY - 52, PY + 40, 2, false)); if (dE) PS.push(mk(lipR + LAND, W + 400, PY - 52, PY + 40, 3, false)); if (dS) PS.push(mk(SX - 96, SX + 96, lipB + LAND, H + 400, 4, false));
    const BW = 10, sh = [];
    const inRoom = (x, y) => x >= FL && x < FR && y < TT + 12;
    // ---------------------------------------------------- 구름 바다 (망점): 어두운 바탕 위에 붉은 점 밀도로 구름 — 둥근 덩어리를 지평선부터 앞으로 겹쳐 · 앞(아래)은 크게 · 고원에서 멀어질수록 디더로 사라짐
    const CW = W >> 1, CH = H >> 1, LV = new Float32Array(CW * CH), MC = new Array(CW * CH).fill(null), BG0 = '#0b0504', DOT0 = '#33150e', DOT1 = '#56261a';
    const pOf = y => clamp((y - HZ) / 300, 0, 1);
    const keep = (x, y) => PS.some(q => q.top(x, y)) || inRoom(x, y); // 고원 윗면 · 방은 건드리지 않음
    const fadeOf = (x, y) => { const dx = x < lipL ? lipL - x : x > lipR ? x - lipR : 0, dy = y > lipB ? y - lipB : 0; return clamp((Math.sqrt(dx * dx + dy * dy * 0.3) - 40) / 220, 0, 1); };
    const KL = [0, 0.1, 0.2, 0.34, 0.52, 0.78];
    const puff = (cx, cy, r, sq, s, big, amp) => { const ry = r * sq, p = pOf(cy), dim = (0.45 + 0.55 * p) * (amp || 1);
      const blobs = [[0, 0, 1]];
      if (big) { const lean = hh(s, 1, sd) < 0.5 ? -1 : 1, nb = 5 + (hh(s, 2, sd) * 3 | 0); for (let b = 0; b < nb; b++) { const t = hh(s, b + 3, sd), side = (t < 0.7 ? lean : -lean) * hh(s, b + 13, sd); blobs.push([side * r * 1.25, -hh(s, b + 23, sd) * ry * 0.55, 0.35 + hh(s, b + 33, sd) * 0.45 * (1 - Math.abs(side) * 0.5)]); } }
      else { const nb = 2 + (hh(s, 1, sd) * 3 | 0); for (let b = 0; b < nb; b++) { const a = (hh(s, b + 2, sd) - 0.5) * 2.2, rr2 = 0.55 + hh(s, b + 7, sd) * 0.35; blobs.push([Math.sin(a) * r * 0.85, -Math.abs(Math.cos(a)) * ry * 0.35, rr2]); } }
      const ex = big ? 2.4 : 1.9, x0 = Math.max(0, (cx - r * ex) >> 1), x1 = Math.min(CW - 1, (cx + r * ex) >> 1), y0 = Math.max(0, (cy - ry * 1.6) >> 1), y1 = Math.min(CH - 1, (cy + ry * 1.1) >> 1);
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) { const x = i * 2, y = j * 2; let bd = 1, nd = 0;
        for (const [bx, by, br] of blobs) { const dy = (y - cy - by) / (ry * br); if (dy <= -1 || dy >= 1) continue; const dx = (x - cx - bx) / (r * br), d = dx * dx + dy * dy; if (d < bd) { bd = d; nd = dy; } }
        if (bd >= 1) continue; const best = 1 - Math.sqrt(bd), tail = clamp(1 - (y - (cy + ry * 0.1)) / (ry * 0.8), 0, 1); if (tail <= 0) continue; // 밑은 자르지 않고 점점 옅어짐
        let k = nd < -0.55 && best < 0.22 ? 5 : nd < -0.25 ? 4 : nd < 0.2 ? 3 : 2; if (nd > 0.35 && best < 0.25) k = 1;
        const I = j * CW + i, v = KL[k] * dim * tail; if (tail < 1) { if (v > LV[I]) LV[I] = v; } else LV[I] = v; MC[I] = null; } };
    // 지평선 붉은 띠
    for (let j = HZ >> 1; j < CH; j++) { const hz = clamp(1 - (j * 2 - HZ) / 50, 0, 1) * 0.4; if (hz <= 0) break; for (let i = 0; i < CW; i++) LV[j * CW + i] = hz; }
    // 먼 메사 (구름 위로 솟은 봉우리)
    const items = [];
    const spots = [[lipL - 64 - hh(1, 24, sd) * 30, T + 30 + hh(2, 24, sd) * 30, 34], [lipR + 60 + hh(3, 24, sd) * 30, T + 10 + hh(4, 24, sd) * 40, 40], [lipL - 80, lipB + 10, 46], [lipR + 70, lipB + 30, 30], [lipL - 110, T - 30, 24], [lipR + 120, T - 36, 22]];
    for (let i = 0, n = 0; i < 0 && n < 8; i++) { const sp = spots[i], y = sp ? sp[1] : HZ + 8 + hh(i, 21, sd) ** 1.3 * (H - HZ - 40), p = pOf(y), w = sp ? sp[2] : (40 + hh(i, 22, sd) * 80) * (0.25 + 0.75 * p), x = sp ? sp[0] : hh(i, 23, sd) * W;
      if (fadeOf(x, y) > 0.7 || PS.some(q => x + w / 2 > q.x0 - 24 && x - w / 2 < q.x1 + 24 && y > q.y0 - 40 && y < q.y1 + (q.ours ? 60 : 120)) || Math.abs(y - PY) < 50 && (dW && x < lipL || dE && x > lipR) || dS && Math.abs(x - SX) < w / 2 + 30 && y > lipB) continue; n++;
      items.push({ y: y + w * 0.5 + 28, f: () => { const td = Math.max(4, w * 0.14) & ~1, fh = w * 0.6;
        for (let yy = (y - 4) & ~1; yy < y + td + fh; yy += 2) for (let xx = (x - w / 2 - fh * 0.35) & ~1; xx < x + w / 2 + fh * 0.35; xx += 2) {
          const tE0 = y + (vn(xx / 9, i, sd + 60) - 0.5) * 4, vv = yy - tE0, half = w / 2 + Math.max(0, vv - td) * 0.35 - Math.max(0, 4 - vv) * 0.8, e = half - Math.abs(xx - x); if (vv < 0 || e < 0) continue;
          const I = (xx >> 1) + (yy >> 1) * CW; if (xx < 0 || xx >= W || I < 0 || I >= MC.length) continue; const lw = xx < x, k = (vv - td) / fh;
          let c = vv < 2 ? '#5e2c1c' : vv < td ? (e < 3 ? '#4a2416' : '#3c1d12') : lw && e < 3 ? '#3a1b11' : lw ? '#2a130c' : '#21100a';
          if (vv >= td && dith(xx >> 1, yy >> 1, k * 1.4)) c = null; if (p < 0.4 && dith((xx >> 1) + 1, yy >> 1, (0.4 - p) * 2)) c = null; MC[I] = c; if (c) LV[I] = 0; } } }); }
    // 구름 줄: 지평선 근처는 작고 납작하게 · 앞으로 올수록 큰 덩어리
    for (let y = HZ + 4, row = 0; y < H + 60; row++) { const p = pOf(y), r0 = 10 + 64 * p, step = r0 * 2;
      for (let x = -40 + hh(row, 31, sd) * step, n = 0; x < W + 40; n++) { const id = row * 97 + n, r = r0 * (0.75 + hh(id, 32, sd) * 0.5), xx = x, yy = y + (hh(id, 34, sd) - 0.5) * r0 * 0.4;
        const under = xx > lipL - 60 && xx < lipR + 60 && yy > lipB - 20;
        if (!under && hh(id, 33, sd) < 0.45 && fadeOf(xx, yy) < 0.7 && fbm(xx / 200, yy / (40 + 110 * p), sd + 90) > 0.5) items.push({ y: yy + r * 0.35, f: () => puff(xx, yy, r, 0.4 + p * 0.12, id, false, 0.35) }); x += step * (0.75 + hh(id, 35, sd) * 0.6); }
      y += Math.max(6, r0 * 0.7) & ~1 || 2; }
    // 아래: 완만하고 큰 구름 세 덩어리 (서로 크기 · 높이 · 기울기가 다르게)
    { const span = lipR - lipL, xs = [lipL + span * (0.12 + hh(1, 51, sd) * 0.12), lipL + span * (0.48 + hh(2, 51, sd) * 0.1), lipL + span * (0.82 + hh(3, 51, sd) * 0.12)];
      xs.forEach((cx, k) => { const r = 70 + hh(k, 52, sd) * 50, cy = lipB + 58 + hh(k, 53, sd) * 40 + k % 2 * 24; items.push({ y: cy + r * 0.2, f: () => puff(cx, cy, r, 0.3 + hh(k, 54, sd) * 0.08, 900 + k + sd, true, 0.45) }); }); }
    items.sort((a, b) => a.y - b.y); for (const it of items) it.f();
    // 구름에 떨어진 구름다리 그림자 (멀리 아래)
    if (dW) sh.push([lipL - LAND + 10, lipL + 6, PY - BW + 50, PY + BW + 50]); if (dE) sh.push([lipR - 6, lipR + LAND + 10, PY - BW + 50, PY + BW + 50]); if (dS) sh.push([SX - BW + 18, SX + BW + 18, lipB + 40, lipB + LAND + 36]);
    for (const [a, b, c, d] of sh) for (let y = c & ~1; y < d; y += 2) for (let x = Math.max(0, a) & ~1; x < Math.min(W, b); x += 2) { if ((x - a < 4 || b - x < 6 || y - c < 2 || d - y < 4) && dith(x >> 1, y >> 1, 0.5)) continue; const I = (x >> 1) + (y >> 1) * CW; if (I < LV.length) LV[I] *= 0.25; }
    // ---------------------------------------------------- 1) 하늘 아래 · 고원 바깥 전부: 어두운 바탕 + 망점 구름
    for (let j = HZ >> 1; j < CH; j++) for (let i = 0; i < CW; i++) { const x = i * 2, y = j * 2; if (keep(x, y)) continue; const I = j * CW + i, f = fadeOf(x, y); let c = BG0;
      if (MC[I]) { if (!(f > 0 && dith(i, j, f))) c = MC[I]; }
      else { const lv = LV[I] * (1 - f); if (lv > 0 && dith(i, j, lv)) c = lv > 0.42 && dith(i + 2, j + 1, (lv - 0.42) * 2.6) ? DOT1 : DOT0; }
      LY.set(x, y, c); }
    // ---------------------------------------------------- 2) 벼랑: 남쪽 바위벽(폭이 다른 세로 기둥 결 · 드문드문 턱 · 왼쪽 위 빛 · 아래로 어두워짐) · 좌우 좁은 옆면 — 밑은 앞쪽 구름 둑에 잠김
    for (const q of PS) { const bx0 = Math.max(0, q.x0 - CS - 8) & ~1, bx1 = Math.min(W, q.x1 + CS + 8), by0 = Math.max(HZ, q.y0) & ~1, by1 = Math.min(H, q.y1 + CF + 40);
      for (let y = by0; y < by1; y += 2) for (let x = bx0; x < bx1; x += 2) { if (q.top(x, y) || (q.ours && inRoom(x, y))) continue; const bx = x >> 1, by = y >> 1;
        const v = q.face(x, y); let c = null;
        if (v >= 0) { const k = v / 72, wq = (x + (fbm(y / 30, x / 70, sd + 3) - 0.5) * 18) / 15 + vn(x / 41, 3, sd + 4) * 1.3, col = Math.floor(wq), u = wq - col, bulge = fbm(x / 22, y / 36, sd + 8); let i;
          const l1 = 10 + (hh(col, 1, sd) * 10 | 0) * 2, l2 = l1 + 22 + (hh(col, 2, sd) * 12 | 0) * 2, hasL = hh(col, 3, sd) < 0.65;
          if (v < 2) i = 0; else if (v < 4) i = 1; else if (v < 6 && hh(col, 4, sd) < 0.6) i = 5;
          else { i = bulge > 0.6 ? 2 : bulge < 0.38 ? 4 : 3; if (u < 0.2) i--; else if (u > 0.9) i = 5; else if (u > 0.78) i++;
            if (hasL && (v === l1 || v === l2)) i = 1; else if (hasL && (v === l1 + 2 || v === l2 + 2)) i = 5;
            i = clamp(i, 1, 6) + (k > 0.1 && dith(bx, by, (k - 0.1) * 2.2) ? 1 : 0) + (k > 0.45 && dith(bx + 1, by, (k - 0.45) * 2.2) ? 1 : 0); i = Math.min(6, i); }
          c = v > 22 && dith(bx, by, (v - 22) / 44) ? null : RK[i]; }
        else { const sdd = q.side(x, y); if (sdd) { const d = Math.abs(sdd), sw = q.SW(y), k = d / sw, nn = fbm(x / 8, y / 14, sd + 70);
            let i = d < 2 ? 1 : nn > 0.6 ? 3 : nn < 0.38 ? 5 : 4; if (dith(bx, by, (k - 0.3) * 1.5)) i = Math.min(6, i + 1);
            c = k > 0.15 && dith(bx + 1, by, (k - 0.15) * 1.25) ? null : RK[i]; } }
        if (c) px(x, y, c); } }
    // ---------------------------------------------------- 3) 고원 윗면 (울타리 바깥 턱 · 맞은편 고원): 마른 흙 · 마른 풀 · 자갈 · 끝은 밝은 턱
    for (const q of PS) { const bx0 = Math.max(0, q.x0 - 8) & ~1, bx1 = Math.min(W, q.x1 + 8), by0 = Math.max(0, q.y0) & ~1, by1 = Math.min(H, q.y1 + 8);
      for (let y = by0; y < by1; y += 2) for (let x = bx0; x < bx1; x += 2) { if ((q.ours && x >= FL && x < FR && y < FB) || !q.top(x, y)) continue; const bx = x >> 1, by = y >> 1;
        const de = Math.min(x - q.eL(y), q.eR(y) - 2 - x, q.eB(x) - 2 - y), n = fbm(x / 18, y / 18, sd + 14);
        let c = de < 2 ? RK[0] : de < 4 ? DIRT[0] : n > 0.6 ? DIRT[1] : n < 0.38 ? DIRT[3] : DIRT[2];
        if (q.ours && de >= 4) { const fd = Math.min(x < FL ? FL - x : 99, x >= FR ? x - FR + 2 : 99, y >= FB ? y - FB : 99); if (fd < 4) c = DIRT[4]; else if (fd < 6 && dith(bx, by, 0.5)) c = DIRT[4]; } // 울타리 그늘
        if (de >= 4 && hh(bx, by, sd + 16) < 0.035) c = '#8a7a56'; else if (de >= 4 && hh(bx, by, sd + 17) < 0.03) { c = '#9a8a4a'; px(x, y - 2, '#6e6234'); } // 자갈 · 마른 풀
        px(x, y, c); } }
    // ---------------------------------------------------- 4) 흙길: 방 안에서 문 · 고원 끝까지
    const path = (x, y) => {
      if (dW && x < L + 60 && x >= lipL - 6 && Math.abs(y - PY) < PW) return { d: Math.abs(y - PY), far: L - x };
      if (dE && x >= RR - 60 && x < lipR + 6 && Math.abs(y - PY) < PW) return { d: Math.abs(y - PY), far: x - RR };
      if (dS && y >= B - 60 && y < lipB + 6 && Math.abs(x - SX) < PW) return { d: Math.abs(x - SX), far: y - B };
      return null; };
    for (let y = (T + 10) & ~1; y < lipB + 8; y += 2) for (let x = (lipL - 8) & ~1; x < lipR + 8; x += 2) { const p = path(x, y); if (!p || !P0.top(x, y) && !(x >= FL && x < FR)) continue;
      if (p.far < 0 && dith(x >> 1, y >> 1, Math.min(1, -p.far / 60))) continue;
      const pd = p.d + (vn((x + y) / 11, 5, sd + 80) - 0.5) * 10, pw = PW - 4 + (vn((x - y) / 23, 6, sd + 81) - 0.5) * 8; if (pd >= pw || (pd > pw - 6 && dith(x >> 1, y >> 1, (pd - pw + 6) / 6))) continue; // 굽고 폭이 들쭉날쭉
      px(x, y, Math.abs(Math.abs(pd) - 5) < 1.6 && vn((x + y) / 7, 8, sd + 82) > 0.42 ? EARTH[1] : pd > pw - 6 ? EARTH[2] : hh(x >> 1, y >> 1, sd + 7) < 0.06 ? EARTH[1] : EARTH[3]); }
    // ---------------------------------------------------- 5) 구름다리
    const post = (x, y) => { for (let j = 0; j < 20; j += 2) for (let i = 0; i < 6; i += 2) { const tipY = j < 4 && i !== 2; if (tipY && j < 2) continue; px(x + i, y - 20 + j, j < 4 ? (i === 0 ? WD.hi : WD.tip) : i === 0 ? WD.h : i === 2 ? WD.l : WD.D); }
      for (const j of [8, 10]) { px(x, y - 20 + j, WD.rope2); px(x + 2, y - 20 + j, WD.rope); px(x + 4, y - 20 + j, WD.rope2); } px(x - 2, y, WD.K); px(x + 6, y, WD.K); };
    const ropeC = t => ((t >> 1) % 3 === 0 ? WD.rope : WD.rope2);
    const bridgeH = sgn => { const x0 = sgn < 0 ? P0.eL(PY) - 2 : P0.eR(PY), LEN = LAND + 6;
      const sagA = t => Math.round(Math.sin(t / LEN * Math.PI) * 6 / 2) * 2;
      for (let t = 0, n = 0; t < LEN; t += 10, n++) { const miss = hh(n, 61, sd) < 0.07 && t > 12 && t < LEN - 12, s0 = sagA(t), len = BW - (hh(n, 62, sd) < 0.3 ? 2 : 0), tone = hh(n, 63, sd);
        if (miss) continue; for (let i = 0; i < 8; i += 2) for (let w = -len; w <= len; w += 2) { const x = x0 + sgn * (t + i), y = PY + w + s0;
          px(x, y, w === -len ? (tone < 0.3 ? WD.h : WD.hi) : w >= len - 2 ? WD.D : i === 6 && sgn > 0 || i === 0 && sgn < 0 ? WD.d : tone < 0.35 ? WD.d : WD.l); }
        for (let w = -len; w <= len; w += 2) px(x0 + sgn * (t + (sgn > 0 ? 8 : -2)), PY + w + s0, W2.K); }
      for (let t = 0; t < LEN; t += 2) { const x = x0 + sgn * t, s0 = sagA(t), s1 = Math.round(Math.sin(t / LEN * Math.PI) * 10 / 2) * 2;
        px(x, PY - BW - 8 + s1, ropeC(t)); px(x, PY - BW - 6 + s1, WD.K);
        px(x, PY + BW + 2 + s0, ropeC(t + 2)); px(x, PY + BW + 4 + s0, WD.K);
        if (t % 12 === 6) { for (let y = PY - BW - 6 + s1; y < PY - BW + s0; y += 2) px(x, y, WD.rope); } }
      const xs = sgn < 0 ? x0 - 4 : x0 - 2; post(xs, PY - BW - 2); post(xs, PY + BW + 10); const xe = x0 + sgn * (LEN - 2) - 2; post(xe, PY - BW - 2 + sagA(LEN - 2)); post(xe, PY + BW + 10 + sagA(LEN - 2)); };
    const bridgeV = () => { const y0 = P0.eB(SX) - 2, LEN = LAND + 6;
      for (let t = 0, n = 0; t < LEN; t += 10, n++) { if (hh(n, 61, sd) < 0.07 && t > 12 && t < LEN - 12) continue; const len = BW - (hh(n, 62, sd) < 0.3 ? 2 : 0), tone = hh(n, 63, sd);
        for (let j = 0; j < 8; j += 2) for (let w = -len; w <= len; w += 2) px(SX + w, y0 + t + j, j === 0 ? (w === -len ? WD.hi : tone < 0.3 ? WD.h : WD.tip) : j === 6 ? WD.D : w >= len - 2 ? WD.d : tone < 0.35 ? WD.d : WD.l);
        for (let w = -len; w <= len; w += 2) px(SX + w, y0 + t + 8, W2.K); }
      for (let t = 0; t < LEN; t += 2) { px(SX - BW - 4, y0 + t, ropeC(t)); px(SX + BW + 2, y0 + t, ropeC(t + 2)); px(SX + BW + 4, y0 + t, WD.K); px(SX - BW - 6, y0 + t, WD.K); if (t % 12 === 6) { px(SX - BW - 2, y0 + t, WD.rope); px(SX + BW, y0 + t, WD.rope); } }
      post(SX - BW - 6, y0 + 4); post(SX + BW + 2, y0 + 4); post(SX - BW - 6, y0 + LEN); post(SX + BW + 2, y0 + LEN); };
    if (dW) bridgeH(-1); if (dE) bridgeH(1); if (dS) bridgeV();
    // ---------------------------------------------------- 5.5) 울타리 그림자: 방 안쪽으로 디더 (검은 띠 대신)
    { const SHC = '#140b07', soil = (x, y) => EARTH[hh(x >> 1, y >> 1, sd + 5) < 0.5 ? 2 : 1];
      for (let y = (T + 2) & ~1; y < B + 14; y += 2) { if (gapW(y)) continue; for (let x = (FL + 10) & ~1; x < L + 14; x += 2) { const lv = 0.85 * (1 - (x - FL - 10) / 22); const hit = dith(x >> 1, y >> 1, lv); if (x < L - 4) px(x, y, hit ? SHC : soil(x, y)); else if (hit) px(x, y, SHC); } }
      for (let y = (T + 2) & ~1; y < B + 14; y += 2) { if (gapE(y)) continue; for (let x = (RR - 10) & ~1; x < RR + 4; x += 2) { const lv = 0.5 * (1 - (RR + 4 - x) / 14); if (dith(x >> 1, y >> 1, lv)) px(x, y, SHC); } }
      for (let x = (L - 4) & ~1; x < RR + 4; x += 2) { if (gapS(x)) continue; for (let y = (B - 26) & ~1; y < B + 14; y += 2) { const lv = 0.8 * (1 - (B + 2 - y) / 26); const hit = dith(x >> 1, y >> 1, lv); if (y >= B + 4) px(x, y, hit ? SHC : soil(x, y)); else if (hit) px(x, y, SHC); } } }
    // ---------------------------------------------------- 6) 울타리: 위쪽 말뚝 벽과 같은 통나무 — 좌우는 위아래로 겹쳐 늘어선 말뚝, 아래는 앞면 · 모서리는 굵은 기둥
    const bottomFence = pp => { let n = 0; for (let x = FL & ~1; x < FR; x += 12, n++) { if (gapS(x + 6)) continue; logP(pp, x, B - 10 + (hh(n, 9, sd) * 3 | 0) * 2, FB, { w: 12, fac: 8, s: n * 5 + sd, broken: hh(n, 8, sd) < 0.05 }); }
      ropeP(pp, FL & ~1, FR, B + 12, sd + 77, gapS); };
    const cornerPost = (pp, x, tip, base) => { logP(pp, x, tip, base, { w: 16, fac: 12, s: x + tip });
      for (const by of base - tip > 60 ? [tip + 26, base - 28] : [tip + 18]) { for (let xx = x; xx < x + 14; xx += 2) { const dy = xx - x >= 8 ? 2 : xx - x >= 4 ? (hh(by, 5, sd) < 0.5 ? 2 : 0) : 0; pp(xx, by - 2 + dy, W2.K); for (let j = 0; j < 4; j += 2) pp(xx, by + j + dy, W2.R[((xx >> 1) + (j >> 1)) % 3]); pp(xx, by + 4 + dy, W2.K); } pp(x + 12, by + 8, W2.R[1]); pp(x + 12, by + 10, W2.R[2]); } };
    for (const [x, tip, base] of [[FL - 2, T - 98, T + 4], [FR - 14, T - 98, T + 4]]) cornerPost(px, x, tip, base); // 위 모서리 기둥은 좌우 말뚝 아래 레이어
    for (const [x0, open] of [[FL, gapW], [RR + 4, gapE]]) { let n = 0; for (let y = T - 6; y < FB - 26; y += 16, n++) { if (open(y + 22) || open(y + 6)) continue; const t0 = y + (hh(n, x0, sd) < 0.5 ? 0 : 2); logP(px, x0, t0, y + 28, { w: 12, fac: 6, s: n * 13 + x0, noK: n > 0, gapD: true });
        { const tr = hh(n, 71, sd + x0), tl = tr < 0.3 ? 1 : tr < 0.6 ? -1 : 0; for (let xx = x0; xx < x0 + 10; xx += 2) { const dy = tl ? ((xx - x0) >= 6 ? 2 : 0) * tl + (tl < 0 ? 2 : 0) : 0; px(xx, t0 + 10 + dy, W2.R[((xx >> 1) + n) % 3]); px(xx, t0 + 12 + dy, W2.R[((xx >> 1) + n + 1) % 3]); px(xx, t0 + 14 + dy, W2.L[5]); } if (tl && hh(n, 72, sd + x0) < 0.25) { px(x0 + (tl > 0 ? 8 : 0), t0 + 16, W2.R[1]); px(x0 + (tl > 0 ? 8 : 0), t0 + 18, W2.R[2]); } } } }
    bottomFence(px);
    for (const [x, tip, base] of [[FL - 2, B - 22, FB + 2], [FR - 14, B - 22, FB + 2]]) cornerPost(px, x, tip, base);
    // 아래 울타리를 앞 레이어로 한 장 더 (남쪽 문 화롯대 · 캐릭터 발이 울타리 뒤로 가려지게)
    { const ox = (FL - 4) & ~1, oy = (B - 26) & ~1, fw = FR + 8 - ox, fh = FB + 6 - oy, LF = cellLayer(0, 0, fw, fh), pf = (x, y, c) => LF.set((x & ~1) - ox, (y & ~1) - oy, c);
      bottomFence(pf); cornerPost(pf, FL - 2, B - 22, FB + 2); cornerPost(pf, FR - 14, B - 22, FB + 2);
      const fc = document.createElement('canvas'); fc.width = fw; fc.height = fh; LF.flush(fc.getContext('2d')); R._out3front = { c: fc, x: ox, y: oy }; }
    for (let x = (FL - 2) & ~1; x < FR + 2; x += 2) if (!gapS(x) && dith(x >> 1, FB >> 1, 0.6)) px(x, FB + 2, W2.K);
    LY.flush(g);
    // 북문만 다시
    if (D.n != null && !hiddenDoor(R, 'n') && !(R.sealW && R.sealW.dir === 'n')) paintDoorOrc(g, 'n');
    R._out3 = { bars: [dW && 'w', dE && 'e', dS && 's'].filter(Boolean), k: {} };
  }
  { const o = paintRoomFloor; paintRoomFloor = function (R) { const r = o.apply(this, arguments); if (on3(R)) withSeed((R.seed || 1) + 773, () => paint(fg, R)); return r; }; }
  // ---------------------------------------------------------------- 문 크기에 맞춘 가시 말뚝 바리케이드 (새로 그림): 가로대 통나무 + 엇갈린 끝을 깎은 말뚝 셋 (X자)
  function barArt(vert) { return art('out3_bar_' + (vert ? 'v' : 'h'), () => { const Wc = vert ? 16 : 18, Hc = vert ? 18 : 16, /* v3.49 길이 26 → 18칸: 문 틈 폭만큼만, 말뚝 울타리와 안 겹치게 */ cell = new Map(), set = (x, y, k) => { if (x >= 0 && y >= 0 && x < Wc && y < Hc) cell.set(x + ',' + y, k); };
      if (vert) for (let y = 0; y < Hc; y++) { set(6, y, 'h'); set(7, y, 'l'); set(8, y, 'd'); set(9, y, 'D'); } // 세로 가로대 (위에서 본 통나무)
      else for (let x = 0; x < Wc; x++) { set(x, 9, 'h'); set(x, 10, 'l'); set(x, 11, 'd'); set(x, 12, 'D'); } // 가로대
      const cross = (cx, cy) => { for (let i = -6; i <= 6; i++) { const tip = Math.abs(i) >= 5; for (const sg of [-1, 1]) { const x = cx + i, y = cy - i * sg * 0.9 | 0; set(x, y, tip && (i * sg < 0 ? y < cy : y < cy) ? 't' : 'l'); set(x, y + 1, tip ? 'h' : 'd'); } } };
      if (vert) for (const cy of [5, 13]) cross(8, cy); else for (const cx of [5, 13]) cross(cx, 8);
      const c = document.createElement('canvas'); c.width = Wc * 2 + 4; c.height = Hc * 2 + 4; const g = c.getContext('2d'), COL = { h: WD.h, l: WD.l, d: WD.d, D: WD.D, t: WD.hi };
      const has = (x, y) => cell.has(x + ',' + y);
      for (const key of cell.keys()) { const [x, y] = key.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!has(x + dx, y + dy)) { g.fillStyle = WD.K; g.fillRect((x + dx) * 2 + 2, (y + dy) * 2 + 2, 2, 2); } }
      for (const [key, k] of cell) { const [x, y] = key.split(',').map(Number); g.fillStyle = COL[k]; g.fillRect(x * 2 + 2, y * 2 + 2, 2, 2); }
      return c; }); }
  const B_FRONT = () => A.y1 + 12;
  // 문이 닫히면 바리케이드가 길을 막음 · 열리면 치움
  { const o = roomEnts; roomEnts = function (list) { o(list); const R = G && G.dun && G.dun.cur; if (!on3(R) || !R._out3) return;
      if (R._out3front) { const F = R._out3front; list.push({ y: B_FRONT(), d: () => ctx.drawImage(F.c, F.x, F.y) }); }
      const { L, RR, B, PY, SX } = geo();
      for (const d of R._out3.bars) { if (doorState(R, d) === 'open') continue; const vert = d !== 's', c = barArt(vert);
        const x = d === 'w' ? L - 4 - PT / 2 : d === 'e' ? RR + 4 + PT / 2 - 2 : SX, y = d === 's' ? B + 30 : PY + 26 - 8; /* 짧아진 만큼 위아래 가운데 맞춤 */
        list.push({ y, d: () => ctx.drawImage(c, (x - c.width / 2) & ~1, (y - c.height) & ~1) }); } }; }
  // 북문: 아래로 깎은 통나무를 엮은 나무 문이 위로 들려 열림 (2 · 4장 북문처럼 · 장식 없이)
  let GN = null;
  // 통나무 문: 끝을 아래로 깎은 통나무 넷 + 가로대 통나무 둘 · 거친 밧줄로 묶음 (위 벽 통나무와 같은 그림)
  function gateN3Init() { const GW = 48, GH = 76, LF = cellLayer(0, 0, GW, GH), pf = (x, y, c) => LF.set(x & ~1, y & ~1, c);
    for (let i = 0; i < 4; i++) logP(pf, i * 12, 0 + (i % 2) * 2, GH, { w: 12, fac: 10, s: 300 + i * 7 });
    const t = document.createElement('canvas'); t.width = GW; t.height = GH; LF.flush(t.getContext('2d'));
    const c = document.createElement('canvas'); c.width = GW; c.height = GH; const g = c.getContext('2d'); g.save(); g.translate(0, GH); g.scale(1, -1); g.drawImage(t, 0, 0); g.restore(); // 끝이 아래로
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x & ~1, y & ~1, 2, 2); };
    for (const by of [12, 44]) { for (let x = 0; x < GW; x += 2) { const r = x === 0 || x === GW - 2; px(x, by - 2, W2.K); px(x, by, r ? W2.T[1] : W2.L[1]); px(x, by + 2, r ? W2.T[2] : W2.L[2]); px(x, by + 4, r ? W2.T[3] : W2.L[3]); px(x, by + 6, W2.L[4]); px(x, by + 8, W2.K);
        if (hh(x >> 1, by, 5) < 0.15) px(x, by + 2, W2.L[3]); }
      for (let i = 0; i < 4; i++) { const cx = i * 12 + 4; for (let k = 0; k < 10; k += 2) { px(cx + (k >> 1) % 2 * 2, by - 2 + k, W2.R[(k >> 1) % 3]); } px(cx + 4, by + 8, W2.K); } } // 가로대 · 통나무마다 밧줄 감기
    for (let y = 0; y < GH; y += 2) { if (g.getImageData(1, y + 1, 1, 1).data[3]) px(0, y, W2.K); } // 왼쪽 외곽선
    GN = c; }
  // 북문 문틀: 굵은 통나무 기둥 둘 + 가로 통나무 상인방(잘린 끝 나이테) + 밧줄 매듭 + 가운데 뿔 해골
  { const o = paintDoorOrc; paintDoorOrc = function (g, d) { const R = G && G.dun && G.dun.cur; if (d !== 'n' || !on3(R)) return o.apply(this, arguments);
      const p = DOOR.n, T = A.y0, LY = cellLayer(p.x - 70, T - 120, p.x + 70, T + 8), px = (x, y, c) => LY.set(x & ~1, y & ~1, c);
      for (let y = T - 72; y < T + 2; y += 2) for (let x = p.x - 22; x < p.x + 22; x += 2) { const k = (y - (T - 72)) / 74; px(x, y, dith(x >> 1, y >> 1, k * 0.5) ? '#160c08' : '#060302'); } // 문 안 어둠
      for (let x = p.x - 22; x < p.x + 22; x += 2) if (dith(x >> 1, 3, 0.5)) px(x, T - 72, W2.K);
      logP(px, p.x - 40, T - 100, T + 4, { w: 18, fac: 14, s: 511 }); logP(px, p.x + 22, T - 98, T + 4, { w: 18, fac: 14, s: 517 });
      for (const [ox, tp] of [[p.x - 42, T - 100], [p.x + 20, T - 98]]) for (let y = tp + 8; y < T + 6; y += 2) px(ox, y, W2.K); // 기둥 외곽선
      for (let x = p.x - 42; x < p.x - 22; x += 2) px(x, T + 4, W2.K); for (let x = p.x + 20; x < p.x + 40; x += 2) px(x, T + 4, W2.K);
      // 상인방: 가로 통나무 (위 빛 → 아래 그늘) · 껍질 결 · 양 끝 나이테
      const bx0 = p.x - 54, bx1 = p.x + 54, by = T - 86, BH = 14;
      for (let x = bx0; x < bx1; x += 2) { px(x, by - 2, W2.K); for (let j = 0; j < BH; j += 2) { let i = j < 2 ? 0 : j < 5 ? 1 : j < 8 ? 2 : j < 11 ? 3 : 4; if (hh((x - bx0) / 8 | 0, j, 523) < 0.16) i = Math.min(5, i + 1); px(x, by + j, W2.L[i]); } px(x, by + BH, W2.K); }
      for (let j = -2; j <= BH; j += 2) { px(bx0 - 4, by + j, W2.K); px(bx1 + 2, by + j, W2.K); } // 상인방 끝 외곽선
      for (const ex of [bx0 - 2, bx1 - 4]) { for (let j = 0; j < BH; j += 2) for (let k = 0; k < 6; k += 2) { const dd = Math.abs(j - 6) + Math.abs(k - 2); px(ex + k, by + j, dd > 6 ? W2.K : dd > 4 ? W2.T[2] : (dd & 2) ? W2.T[1] : W2.T[3]); } }
      // 기둥 · 상인방 만나는 곳 X자 밧줄
      for (const cx of [p.x - 40, p.x + 22]) for (let k = 0; k < 18; k += 2) { const a = k, b2 = 16 - k; px(cx + a, by - 2 + (k >> 1) * 2 % 18, W2.R[(k >> 1) % 3]); px(cx + b2, by - 2 + (k >> 1) * 2 % 18, W2.R[((k >> 1) + 1) % 3]); }
      // 늘어진 끈 + 뼈 구슬
      for (const [hx, L] of [[p.x - 30, 10], [p.x + 30, 14]]) { for (let k = 0; k < L; k += 2) px(hx, by + BH + 2 + k, W2.R[(k >> 1) % 2]); px(hx - 2, by + BH + 2 + L, '#d8cfbc'); px(hx, by + BH + 2 + L, '#e0d6c4'); px(hx, by + BH + 4 + L, '#a89a84'); }
      LY.flush(g);
      const sk = fromRows(ORC_WALL_MAPS.skull), sw = sk[0].length * 2, shh = sk.length * 2, sx = p.x - sw / 2, sy = by - shh + 6;
      const horn = fromRows(['w......', 'Wk.....', '.Wk....', '..WWk..', '...kWWk']), hw = horn[0].length * 2;
      gPaint(g, horn, WOODPAL, sx - hw + 2, sy - 2); gPaint(g, horn.map(r => r.slice().reverse()), WOODPAL, sx + sw - 2, sy - 2); gPaint(g, sk, WOODPAL, sx, sy);
    }; }
  function gateN3(k) { if (!GN) gateN3Init(); if (k <= 0) return; const p = DOOR.n, x0 = p.x - 22, y0 = A.y0 - 72, h = 74, off = Math.round(GN.height * (1 - k) / 2) * 2;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, 44, h); ctx.clip(); ctx.drawImage(GN, x0, y0 + h - GN.height - off); ctx.restore(); }
  // 좌 · 우 · 아래 문의 나무 문짝 · 막음은 없앰 (닫힘은 바리케이드로)
  { const o = drawSideLeaves; drawSideLeaves = function (d, k) { if (on3(G && G.dun && G.dun.cur)) return; return o.apply(this, arguments); }; }
  { const o = drawSeal; drawSeal = function (d, k) { if (on3(G && G.dun && G.dun.cur)) { if (d === 's') return; if (d === 'n') return gateN3(k); } return o.apply(this, arguments); }; }
  // 좌 · 우 문 횃불: 말뚝 머리 줄 위, 흙길 양옆
  { const o = gateParts; gateParts = function (d) { const r = o.apply(this, arguments); const R = G && G.dun && G.dun.cur; if (!on3(R) || (d !== 'w' && d !== 'e')) return r;
      const dx = d === 'w' ? 14 : -14, { PY } = geo(), ys = [PY - PW + 2, PY + PW + 18]; // 울타리보다 방 안쪽
      r.parts.forEach((q, i) => { const ny = ys[i] != null ? ys[i] : q.sy, dy = ny - q.sy; q.x = (q.x + dx) & ~1; q.y = (q.y + dy) & ~1; q.sy = ny; if (r.flames[i]) { r.flames[i].x += dx; r.flames[i].y += dy; } });
      return r; }; }
  return { paint, wide: () => on3(G && G.dun && G.dun.cur), set on(v) { ON = v; }, get on() { return ON; } };
})();
