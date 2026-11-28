'use strict';
// 잿빛 왕관 원정대 · core.js — 합친 파일: 01_core.js, 02_weapons.js, 03_state.js (v3.84 파일 정리 · typeof로 먼저 확인하는 이름 몇 개는 var로 선언)

// ==================================================================== 01_core.js
'use strict';
// 잿빛 왕관 원정대 — 01_core.js : 기본: 화면·캔버스 상수, 디더·도트 규칙, 저장, 잿불 단계, 사운드, 도트 스프라이트
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // (원본 머리말) 잿빛 왕관 원정대 — 오프라인 솔로 프로토타입 v0.2
  // 의존성 없음. index.html을 브라우저로 열면 실행된다.

  const VW = 768, VH = 432;          // 화면(캔버스) 크기
  const W = 1700, H = 960;           // 바닥 캔버스 크기 — 방마다 전투장(A) 크기가 다르고 가장 큰 방이 들어가게 잡는다
  const cv = document.getElementById('game');
  cv.width = VW; cv.height = VH;
  const cam = { x: 0, y: 0 };
  let ctx = cv.getContext('2d'); // v1.05: 시체를 따로 그릴 때 잠깐 바꿔 끼우려고 let
  ctx.imageSmoothingEnabled = false;
  const A = { x0: 136, y0: 100, x1: 1136, y1: 640 }; // 바깥 벽 두께는 카메라가 맵 끝에 붙어도 UI 뒤로 들어가지 않을 만큼 // 플레이 영역
  let CX = (A.x0 + A.x1) / 2, CY = (A.y0 + A.y1) / 2; // 방에 들어갈 때마다 setArena가 바꾼다
  const DEG = Math.PI / 180, TAU = Math.PI * 2;

  // ---------------------------------------------------------------- utils
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const lerpAng = (a, b, k) => a + angDiff(b, a) * clamp(k, 0, 1);
  const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const $ = id => document.getElementById(id);
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  // 칸(2px) 단위로 넓은 바닥을 칠할 때: 칸마다 fillRect 하지 않고 반 해상도 픽셀 버퍼에 모았다가 한 번에 2배로 찍는다 (방에 들어갈 때 끊김 줄이기)
  const CELL_RGBA = new Map();
  function cellLayer(x0, y0, x1, y1) {
    x0 &= ~1; y0 &= ~1; const w = Math.max(1, Math.ceil((x1 - x0) / 2)), h = Math.max(1, Math.ceil((y1 - y0) / 2)), [c, cg] = mkCanvas(w, h), im = cg.createImageData(w, h), u = new Uint32Array(im.data.buffer);
    return { set(x, y, hex) { const i = (x - x0) >> 1, j = (y - y0) >> 1; if (i < 0 || j < 0 || i >= w || j >= h) return; let v = CELL_RGBA.get(hex); if (v === undefined) { v = (0xff000000 | (parseInt(hex.slice(5, 7), 16) << 16) | (parseInt(hex.slice(3, 5), 16) << 8) | parseInt(hex.slice(1, 3), 16)) >>> 0; CELL_RGBA.set(hex, v); } u[j * w + i] = v; },
      flush(g) { cg.putImageData(im, 0, 0); const sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0, w, h, x0, y0, w * 2, h * 2); g.imageSmoothingEnabled = sm; } };
  }
  // ================================================================ v1.79 반투명·그라데이션을 도트 디더로 (화면 캔버스 ctx 전용)
  // 1) 반투명 칠하기(fillRect·fill·stroke): globalAlpha × 색 알파를 16단계로 끊어, 4×4 바이어 무늬(2px 칸)로 불투명 칸만 칠함
  // 2) 반투명 그림(drawImage, 사라지는 적·시체·잔상·이펙트): 같은 무늬로 칸을 지워 '흩어지는 점'처럼 사라짐
  // 3) 그라데이션: dRadial/dLinear가 칸마다 색·알파를 계산해 디더 무늬(CanvasPattern)를 만들어 줌 (화면 테두리·광채·빛줄기·바닥 굽기)
  // 무늬는 8px(=4칸) 격자로 월드에 고정. DITHER_ON = false면 예전 그대로
  let DITHER_ON = true;
  let DLV = 4; // v1.80 반투명 알파 단계 수 — 0%·25%·50%·75%·100% 중 이웃한 두 단계 사이만 점으로 섞음 (예전: 0%와 100%를 섞어 망점이 셌음)
  const dBandQ = (s, t, W = 0.4) => { const b = Math.floor(s), r = s - b, lo = 0.5 - W / 2; return r < lo ? b : r > lo + W ? b + 1 : b + ((r - lo) / W > t ? 1 : 0); };
  const DBAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const DMASK = [], DCOLP = new Map(), DRGBA = new Map();
  const dAnchor = () => { const cx = CAMX, cy = CAMY; return [((-cx % 8) + 8) % 8, ((-cy % 8) + 8) % 8]; };
  function dMaskTile(lv) { // lv 1..15: 바이어 값 < lv인 칸만 불투명한 8×8 타일
    if (DMASK[lv]) return DMASK[lv];
    const [c, g] = mkCanvas(8, 8); g.fillStyle = '#fff';
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (DBAY[y * 4 + x] < lv) g.fillRect(x * 2, y * 2, 2, 2);
    return (DMASK[lv] = c);
  }
  function dParse(s) { // 'rgba(r, g, b, a)' · '#rrggbb' → [hex, alpha]
    let v = DRGBA.get(s); if (v) return v;
    if (s.charCodeAt(0) === 114) { const m = s.match(/[\d.]+/g); const h = '#' + [0, 1, 2].map(i => (+m[i]).toString(16).padStart(2, '0')).join(''); v = [h, m.length > 3 ? +m[3] : 1]; }
    else v = [s, 1];
    if (DRGBA.size > 2000) DRGBA.clear();
    DRGBA.set(s, v); return v;
  }
  function dColPat(g, hex, lv) {
    const k = hex + lv; let p = DCOLP.get(k);
    if (!p) { const [c, cg] = mkCanvas(8, 8); cg.drawImage(dMaskTile(lv), 0, 0); cg.globalCompositeOperation = 'source-in'; cg.fillStyle = hex; cg.fillRect(0, 0, 8, 8); p = g.createPattern(c, 'repeat'); if (DCOLP.size > 4000) DCOLP.clear(); DCOLP.set(k, p); }
    return p;
  }
  const _P2D = CanvasRenderingContext2D.prototype, _fillRect = _P2D.fillRect, _fill = _P2D.fill, _stroke = _P2D.stroke, _drawImage = _P2D.drawImage;
  // fillStyle/strokeStyle를 읽으면(게터) 매번 색 문자열을 새로 만들어 느려서, 넣을 때 원본을 기억해 둔다 (save/restore도 따라감)
  const DSTY = { f: '#000', s: '#000', stack: [] };
  { const pf = Object.getOwnPropertyDescriptor(_P2D, 'fillStyle'), ps = Object.getOwnPropertyDescriptor(_P2D, 'strokeStyle'), _save = _P2D.save, _restore = _P2D.restore;
    Object.defineProperty(ctx, 'fillStyle', { get() { return pf.get.call(this); }, set(v) { DSTY.f = v; pf.set.call(this, v); }, configurable: true });
    Object.defineProperty(ctx, 'strokeStyle', { get() { return ps.get.call(this); }, set(v) { DSTY.s = v; ps.set.call(this, v); }, configurable: true });
    ctx.save = function () { DSTY.stack.push(DSTY.f, DSTY.s); return _save.call(this); };
    ctx.restore = function () { if (DSTY.stack.length) { DSTY.s = DSTY.stack.pop(); DSTY.f = DSTY.stack.pop(); } return _restore.call(this); }; }
  function dStyleCall(ctx2, orig, args, prop) {
    if (!DITHER_ON) return orig.apply(ctx2, args);
    const ga = ctx2.globalAlpha, st = prop === 'fillStyle' ? DSTY.f : DSTY.s;
    if (typeof st !== 'string') return orig.apply(ctx2, args);
    let hex = st, ca = 1;
    if (st.charCodeAt(0) === 114 && st.charCodeAt(3) === 97) { const v = dParse(st); hex = v[0]; ca = v[1]; } // 'rgba('
    const ea = ga * ca;
    if (ea >= 0.999) return orig.apply(ctx2, args);
    const sK = ea * DLV, bi = Math.floor(sK), base = bi / DLV, up = (bi + 1) / DLV, lv = Math.round((sK - bi) * 16); // base 단계 + 위 단계로 올릴 칸 비율(lv/16)
    const pd = prop === 'fillStyle' ? Object.getOwnPropertyDescriptor(_P2D, 'fillStyle') : Object.getOwnPropertyDescriptor(_P2D, 'strokeStyle');
    if (orig === _fillRect && args[2] <= 2 && args[3] <= 2) { // 한 칸짜리(불티·재·빛기둥 칸): 그 칸의 바이어 값으로 두 단계 중 하나
      const a = DBAY[((args[1] >> 1) & 3) * 4 + ((args[0] >> 1) & 3)] < lv ? up : base; if (a <= 0) return;
      ctx2.globalAlpha = Math.min(1, a); pd.set.call(ctx2, hex); orig.apply(ctx2, args); ctx2.globalAlpha = ga; pd.set.call(ctx2, st); return;
    }
    pd.set.call(ctx2, hex);
    if (base > 0) { ctx2.globalAlpha = base; orig.apply(ctx2, args); }
    if (lv > 0) { ctx2.globalAlpha = Math.min(1, up) - base; pd.set.call(ctx2, lv >= 16 ? hex : dColPat(ctx2, hex, lv)); orig.apply(ctx2, args); }
    ctx2.globalAlpha = ga; pd.set.call(ctx2, st);
  }
  let DSC = null; const DMIMG = new WeakMap();
  function dDrawImage(ctx2, args) {
    const ga = ctx2.globalAlpha;
    if (!DITHER_ON || ga >= 0.999) return _drawImage.apply(ctx2, args);
    const sK = ga * DLV, bi = Math.floor(sK), base = bi / DLV, step = 1 / DLV, lv = Math.round((sK - bi) * 16);
    if (base > 0) { ctx2.globalAlpha = base; _drawImage.apply(ctx2, args); ctx2.globalAlpha = ga; } // 아래 단계는 그냥 반투명으로
    if (lv <= 0) return;
    { const img0 = args[0], iw = img0.width, ih = img0.height; // 작은 그림은 그림 자체에 무늬를 입힌 사본을 캐시해서 바로 그림 (스프라이트는 이미 2px 칸)
      if (iw * ih <= 160000 && (img0 instanceof HTMLCanvasElement || img0 instanceof HTMLImageElement)) {
        let mp = DMIMG.get(img0); if (!mp) { mp = new Map(); DMIMG.set(img0, mp); }
        let mc = mp.get(lv);
        if (!mc) { const [c2, g2] = mkCanvas(iw, ih); _drawImage.call(g2, img0, 0, 0); g2.globalCompositeOperation = 'destination-in'; g2.fillStyle = g2.createPattern(dMaskTile(lv), 'repeat'); _fillRect.call(g2, 0, 0, iw, ih); mc = c2; mp.set(lv, mc); }
        const a2 = args.slice(); a2[0] = mc; const pa = ctx2.globalAlpha; ctx2.globalAlpha = step; _drawImage.apply(ctx2, a2); ctx2.globalAlpha = pa; return;
      } }
    const img = args[0]; let dx, dy, dw, dh;
    if (args.length === 3) { dx = args[1]; dy = args[2]; dw = img.width; dh = img.height; } else if (args.length === 5) { dx = args[1]; dy = args[2]; dw = args[3]; dh = args[4]; } else { dx = args[5]; dy = args[6]; dw = args[7]; dh = args[8]; }
    const m = ctx2.getTransform(), xs = [], ys = [];
    for (const [px, py] of [[dx, dy], [dx + dw, dy], [dx, dy + dh], [dx + dw, dy + dh]]) { xs.push(m.a * px + m.c * py + m.e); ys.push(m.b * px + m.d * py + m.f); }
    const Wc = ctx2.canvas.width, Hc = ctx2.canvas.height;
    const bx0 = Math.max(0, Math.floor(Math.min(...xs))), by0 = Math.max(0, Math.floor(Math.min(...ys))), bx1 = Math.min(Wc, Math.ceil(Math.max(...xs))), by1 = Math.min(Hc, Math.ceil(Math.max(...ys)));
    const w = bx1 - bx0, h = by1 - by0; if (w <= 0 || h <= 0) return;
    if (!DSC) { const [c, g] = mkCanvas(VW, VH); DSC = { c, g }; }
    const g = DSC.g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, w, h);
    g.setTransform(m.a, m.b, m.c, m.d, m.e - bx0, m.f - by0); g.filter = ctx2.filter || 'none'; g.imageSmoothingEnabled = false;
    _drawImage.apply(g, args);
    g.filter = 'none'; g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in';
    const [ax, ay] = dAnchor(), pat = g.createPattern(dMaskTile(lv), 'repeat'); pat.setTransform(new DOMMatrix([1, 0, 0, 1, ax - bx0, ay - by0]));
    g.fillStyle = pat; _fillRect.call(g, 0, 0, w, h); g.globalCompositeOperation = 'source-over';
    ctx2.save(); ctx2.setTransform(1, 0, 0, 1, 0, 0); ctx2.globalAlpha = step; ctx2.filter = 'none';
    _drawImage.call(ctx2, DSC.c, 0, 0, w, h, bx0, by0, w, h); ctx2.restore();
  }
  ctx.fillRect = function (...a) { return dStyleCall(this, _fillRect, a, 'fillStyle'); };
  ctx.fill = function (...a) { return dStyleCall(this, _fill, a, 'fillStyle'); };
  ctx.stroke = function (...a) { return dStyleCall(this, _stroke, a, 'strokeStyle'); };
  ctx.drawImage = function (...a) { return dDrawImage(this, a); };
  // ================================================================ v1.85 도트 규칙 강제 (화면 캔버스 ctx 한정)
  // 1) 사각형·그림: 화면 좌표가 2px 칸 격자에 맞도록 (홀수·소수 좌표 → 가까운 짝수, 1px 두께 → 한 칸)
  // 2) 곡선·선(경로 fill/stroke): 안티에일리어싱 없이 '칸 가운데가 모양 안에 드는 칸'만 사각형으로 칠함
  //    (그림자·휘두르기 궤적·타격 이펙트·공격 예고 등). 회전된 좌표계에서 칠할 때만 예전 방식으로
  let PX_STRICT = true;
  const PXM = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, st: [] };
  {
    const M = PXM, wrap = (name, fn) => { const o = ctx[name]; ctx[name] = function (...a) { fn(...a); return o.apply(this, a); }; };
    wrap('save', () => M.st.push(M.a, M.b, M.c, M.d, M.e, M.f));
    wrap('restore', () => { if (M.st.length >= 6) { M.f = M.st.pop(); M.e = M.st.pop(); M.d = M.st.pop(); M.c = M.st.pop(); M.b = M.st.pop(); M.a = M.st.pop(); } });
    wrap('translate', (x, y) => { M.e += M.a * x + M.c * y; M.f += M.b * x + M.d * y; });
    wrap('scale', (sx, sy) => { M.a *= sx; M.b *= sx; M.c *= sy; M.d *= sy; });
    wrap('rotate', t => { const cs = Math.cos(t), sn = Math.sin(t), a = M.a, b = M.b, c = M.c, d = M.d; M.a = a * cs + c * sn; M.b = b * cs + d * sn; M.c = c * cs - a * sn; M.d = d * cs - b * sn; });
    wrap('transform', (A, B, C, D, E, F) => { const a = M.a, b = M.b, c = M.c, d = M.d; M.a = a * A + c * B; M.b = b * A + d * B; M.c = a * C + c * D; M.d = b * C + d * D; M.e += a * E + c * F; M.f += b * E + d * F; });
    wrap('setTransform', (a, b, c, d, e, f) => { if (a == null) { M.a = 1; M.b = 0; M.c = 0; M.d = 1; M.e = 0; M.f = 0; } else if (typeof a === 'object') { M.a = a.a; M.b = a.b; M.c = a.c; M.d = a.d; M.e = a.e; M.f = a.f; } else { M.a = a; M.b = b; M.c = c; M.d = d; M.e = e; M.f = f; } });
    wrap('resetTransform', () => { M.a = 1; M.b = 0; M.c = 0; M.d = 1; M.e = 0; M.f = 0; });
  }
  const pxEven = v => Math.round(v / 2) * 2;
  { // 1) 사각형·그림 격자 맞춤
    const M = PXM, oRect = ctx.fillRect, oImg = ctx.drawImage;
    ctx.fillRect = function (x, y, w, h) {
      if (!PX_STRICT || M.b || M.c) return oRect.call(this, x, y, w, h);
      const X0 = M.a * x + M.e, X1 = M.a * (x + w) + M.e, Y0 = M.d * y + M.f, Y1 = M.d * (y + h) + M.f;
      const xa = Math.min(X0, X1), xb = Math.max(X0, X1), ya = Math.min(Y0, Y1), yb = Math.max(Y0, Y1);
      if (!(xb > xa && yb > ya)) return; // 빈 사각형·NaN
      let R0 = pxEven(xa), R1 = pxEven(xb), S0 = pxEven(ya), S1 = pxEven(yb);
      if (R1 <= R0) R1 = R0 + 2; if (S1 <= S0) S1 = S0 + 2;
      if (R0 === xa && R1 === xb && S0 === ya && S1 === yb) return oRect.call(this, x, y, w, h);
      return oRect.call(this, (R0 - M.e) / M.a, (S0 - M.f) / M.d, (R1 - R0) / M.a, (S1 - S0) / M.d);
    };
    ctx.drawImage = function (img, ...a) {
      if (!PX_STRICT || M.b || M.c) return oImg.call(this, img, ...a);
      const n = a.length, ix = n === 8 ? 4 : 0;
      const dx = a[ix], dy = a[ix + 1], dw = n === 2 ? img.width : a[ix + 2], dh = n === 2 ? img.height : a[ix + 3];
      const X = Math.min(M.a * dx, M.a * (dx + dw)) + M.e, Y = Math.min(M.d * dy, M.d * (dy + dh)) + M.f;
      const ex = pxEven(X) - X, ey = pxEven(Y) - Y;
      if (ex || ey) { a = a.slice(); a[ix] = dx + ex / M.a; a[ix + 1] = dy + ey / M.d; }
      return oImg.call(this, img, ...a);
    };
  }
  { // 2) 경로를 칸 단위로: 경로 명령을 화면 좌표로 기록 → fill은 스캔라인(0이 아닌 감김), stroke는 선분까지 거리
    const M = PXM, P = []; let cur = null, bad = false, sx = 0, sy = 0, lx = 0, ly = 0;
    const T = (x, y) => [M.a * x + M.c * y + M.e, M.b * x + M.d * y + M.f];
    const sub = (x, y) => { cur = { pts: [x, y], closed: false }; P.push(cur); sx = lx = x; sy = ly = y; };
    const add = (x, y) => { if (!cur) sub(x, y); else { cur.pts.push(x, y); lx = x; ly = y; } };
    const devR = (rx, ry) => Math.max(Math.abs(rx) * Math.hypot(M.a, M.b), Math.abs(ry) * Math.hypot(M.c, M.d));
    const rec = (name, fn) => { const o = ctx[name]; ctx[name] = function (...a) { fn(...a); return o.apply(this, a); }; };
    rec('beginPath', () => { P.length = 0; cur = null; bad = false; });
    rec('moveTo', (x, y) => { const [X, Y] = T(x, y); sub(X, Y); });
    rec('lineTo', (x, y) => { const [X, Y] = T(x, y); add(X, Y); });
    rec('closePath', () => { if (cur) { cur.closed = true; const x = sx, y = sy; sub(x, y); } });
    rec('rect', (x, y, w, h) => { const q = [T(x, y), T(x + w, y), T(x + w, y + h), T(x, y + h)]; sub(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) add(q[i][0], q[i][1]); cur.closed = true; sub(q[0][0], q[0][1]); });
    const ell = (x, y, rx, ry, rot, a0, a1, ccw) => {
      if (!(rx >= 0 && ry >= 0)) { bad = true; return; }
      let d = a1 - a0;
      if (!ccw) { if (Math.abs(d) >= TAU) d = TAU; else { d %= TAU; if (d < 0) d += TAU; } } else { if (Math.abs(d) >= TAU) d = -TAU; else { d %= TAU; if (d > 0) d -= TAU; } } /* 브라우저처럼 0→TAU 역방향도 한 바퀴로 */
      const n = Math.max(6, Math.min(96, Math.ceil(Math.abs(d) * devR(rx, ry) / 3))), cr = Math.cos(rot), sr = Math.sin(rot);
      for (let i = 0; i <= n; i++) { const t = a0 + d * i / n, ex = rx * Math.cos(t), ey = ry * Math.sin(t); const [X, Y] = T(x + ex * cr - ey * sr, y + ex * sr + ey * cr); if (i === 0 && !cur) sub(X, Y); else add(X, Y); }
    };
    rec('arc', (x, y, r, a0, a1, ccw) => ell(x, y, r, r, 0, a0, a1, ccw));
    rec('ellipse', (x, y, rx, ry, rot, a0, a1, ccw) => ell(x, y, rx, ry, rot, a0, a1, ccw));
    rec('quadraticCurveTo', (cx, cy, x, y) => { const [X0, Y0] = [lx, ly], [CX, CY] = T(cx, cy), [X, Y] = T(x, y); for (let i = 1; i <= 10; i++) { const t = i / 10, u = 1 - t; add(u * u * X0 + 2 * u * t * CX + t * t * X, u * u * Y0 + 2 * u * t * CY + t * t * Y); } });
    rec('bezierCurveTo', (c1x, c1y, c2x, c2y, x, y) => { const X0 = lx, Y0 = ly, [A, B] = T(c1x, c1y), [C, D] = T(c2x, c2y), [X, Y] = T(x, y); for (let i = 1; i <= 14; i++) { const t = i / 14, u = 1 - t; add(u * u * u * X0 + 3 * u * u * t * A + 3 * u * t * t * C + t * t * t * X, u * u * u * Y0 + 3 * u * u * t * B + 3 * u * t * t * D + t * t * t * Y); } });
    rec('arcTo', () => { bad = true; });
    // 칸 지도 (화면 384×216칸 + 둘레 여유)
    const GX = -16, GY = -16, GW = (VW + 32) / 2, GH = (VH + 32) / 2, MAP = new Uint8Array(GW * GH);
    let mx0, my0, mx1, my1;
    const touch = (i, j) => { MAP[j * GW + i] = 1; if (i < mx0) mx0 = i; if (i > mx1) mx1 = i; if (j < my0) my0 = j; if (j > my1) my1 = j; };
    function fillMap(evenOdd) {
      let y0 = 1e9, y1 = -1e9; const E = [];
      for (const s of P) { const p = s.pts, n = p.length / 2; if (n < 2) continue; for (let i = 0; i < n; i++) { const k = (i + 1) % n; const ax = p[i * 2], ay = p[i * 2 + 1], bx = p[k * 2], by = p[k * 2 + 1]; if (ay !== by) E.push(ax, ay, bx, by); if (ay < y0) y0 = ay; if (ay > y1) y1 = ay; } }
      if (!E.length) return;
      const j0 = Math.max(0, Math.floor((y0 - GY) / 2)), j1 = Math.min(GH - 1, Math.ceil((y1 - GY) / 2));
      const xs = [];
      for (let j = j0; j <= j1; j++) {
        const yc = GY + j * 2 + 1; xs.length = 0;
        for (let e = 0; e < E.length; e += 4) { const ay = E[e + 1], by = E[e + 3]; if ((yc >= ay && yc < by) || (yc >= by && yc < ay)) xs.push(E[e] + (yc - ay) * (E[e + 2] - E[e]) / (by - ay), by > ay ? 1 : -1); }
        if (xs.length < 4) continue;
        const ord = []; for (let i = 0; i < xs.length; i += 2) ord.push(i); ord.sort((p, q) => xs[p] - xs[q]);
        let w = 0;
        for (let k = 0; k < ord.length - 1; k++) {
          w = evenOdd ? w ^ 1 : w + xs[ord[k] + 1]; if (!w) continue;
          const xa = xs[ord[k]], xb = xs[ord[k + 1]];
          const i0 = Math.max(0, Math.ceil((xa - GX - 1) / 2)), i1 = Math.min(GW - 1, Math.ceil((xb - GX - 1) / 2) - 1);
          for (let i = i0; i <= i1; i++) touch(i, j);
        }
      }
    }
    function strokeMap(lw) { // 선분을 반 칸 간격으로 따라가며 반지름 hw 안의 칸을 칠함 (화면 밖 부분은 잘라냄)
      const hw = Math.max(lw / 2, 1), hw2 = hw * hw, XL = GX - hw, XR = GX + GW * 2 + hw, YT = GY - hw, YB = GY + GH * 2 + hw;
      for (const s of P) {
        const p = s.pts, n = p.length / 2; if (n < 2) continue;
        const segs = n - 1 + (s.closed ? 1 : 0);
        for (let i = 0; i < segs; i++) {
          const k = (i + 1) % n; let ax = p[i * 2], ay = p[i * 2 + 1], bx = p[k * 2], by = p[k * 2 + 1];
          // 화면 사각형으로 자르기 (리앙-바스키)
          let t0 = 0, t1 = 1; const dx = bx - ax, dy = by - ay; let ok = true;
          for (const [pp, qq] of [[-dx, ax - XL], [dx, XR - ax], [-dy, ay - YT], [dy, YB - ay]]) {
            if (pp === 0) { if (qq < 0) { ok = false; break; } continue; }
            const r = qq / pp; if (pp < 0) { if (r > t1) { ok = false; break; } if (r > t0) t0 = r; } else { if (r < t0) { ok = false; break; } if (r < t1) t1 = r; }
          }
          if (!ok) continue;
          const x0 = ax + dx * t0, y0 = ay + dy * t0, L = Math.hypot(dx, dy) * (t1 - t0), steps = Math.max(1, Math.ceil(L / 1.5));
          for (let q = 0; q <= steps; q++) {
            const px = x0 + dx * (t1 - t0) * q / steps, py = y0 + dy * (t1 - t0) * q / steps;
            const i0 = Math.max(0, Math.ceil((px - hw - GX - 1) / 2)), i1 = Math.min(GW - 1, Math.floor((px + hw - GX - 1) / 2));
            const j0 = Math.max(0, Math.ceil((py - hw - GY - 1) / 2)), j1 = Math.min(GH - 1, Math.floor((py + hw - GY - 1) / 2));
            for (let jj = j0; jj <= j1; jj++) { const qy = GY + jj * 2 + 1 - py; for (let ii = i0; ii <= i1; ii++) { const qx = GX + ii * 2 + 1 - px; if (qx * qx + qy * qy <= hw2) touch(ii, jj); } }
          }
        }
      }
    }
    function emit(g, rectFn) { // 칸 지도 → 줄마다 이어진 칸을 사각형 하나로
      const ia = M.a, id = M.d, e = M.e, f = M.f;
      for (let j = my0; j <= my1; j++) {
        let i = mx0; const row = j * GW;
        while (i <= mx1) {
          if (!MAP[row + i]) { i++; continue; }
          let k = i; while (k <= mx1 && MAP[row + k]) { MAP[row + k] = 0; k++; }
          let h = 1; // 아래 줄들이 똑같은 구간이면 한 사각형으로 합침
          for (let jj = j + 1; jj <= my1; jj++) {
            const r2 = jj * GW; if (MAP[r2 + i - 1] && i > 0 || MAP[r2 + k]) break;
            let same = true; for (let q = i; q < k; q++) if (!MAP[r2 + q]) { same = false; break; }
            if (!same) break; for (let q = i; q < k; q++) MAP[r2 + q] = 0; h++;
          }
          const X = GX + i * 2, Y = GY + j * 2;
          rectFn.call(g, (X - e) / ia, (Y - f) / id, (k - i) * 2 / ia, h * 2 / id);
          i = k;
        }
      }
    }
    const pathOK = () => !bad && P.length && !M.b && !M.c && M.a && M.d;
    const oFill = ctx.fill, oStroke = ctx.stroke, rectRaw = ctx.fillRect;
    const run = (g, mapFn) => { mx0 = my0 = 1e9; mx1 = my1 = -1; mapFn(); if (mx1 >= 0) emit(g, rectRaw); };
    ctx.fill = function (...a) {
      if (!PX_STRICT || !DITHER_ON || a.length && typeof a[0] !== 'string' || !pathOK()) return oFill.apply(this, a); // v1.95 공격 예고(디더 예외 구간)는 원래대로 — 칸 쪼개기가 무거움
      run(this, () => fillMap(a[0] === 'evenodd'));
    };
    ctx.stroke = function (...a) {
      if (!PX_STRICT || !DITHER_ON || a.length || !pathOK()) return oStroke.apply(this, a);
      const fs = DSTY.f, lw = this.lineWidth * Math.max(Math.abs(M.a), Math.abs(M.d));
      this.fillStyle = DSTY.s;
      try { run(this, () => strokeMap(lw)); } finally { this.fillStyle = fs; }
    };
  }
  // 디더 그라데이션: 쓰는 곳은 createRadialGradient 대신 dRadial, fillStyle = gr 대신 gr.p(ctx [, x, y, w, h])
  const DGC = new Map(), DGS = new Map();
  function dCol(c) { // 색 문자열 → [r,g,b,a]
    if (c[0] === '#') return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 1];
    const m = c.match(/-?[\d.]+(?:e[-+]?\d+)?/gi); return [+m[0], +m[1], +m[2], m.length > 3 ? Math.max(0, Math.min(1, +m[3])) : 1]; // v3.81 고침: 알파가 -5.5e-17처럼 지수로 적히면 「5.5」로 읽혀 꽉 찬 빛이 한 프레임 번쩍이던 문제 (화염구 폭발 끝 등)
  }
  function dGrad(kind, geo) {
    return { kind, geo, st: [], addColorStop(t, c) { this.st.push([t, dCol(c)]); },
      p(g, ex, ey, ew, eh, N = 10, dk = 1) { // dk < 1: 색을 dk배 어둡게 하고 알파를 1/dk배로 (어두운 화면 위 테두리가 덜 거칠게)
        const geo = this.geo;
        if (ex == null) { const r = geo[5]; ex = geo[3] - r; ey = geo[4] - r; ew = eh = r * 2; }
        const X0 = Math.floor(ex / 8) * 8, Y0 = Math.floor(ey / 8) * 8, X1 = Math.ceil((ex + ew) / 8) * 8, Y1 = Math.ceil((ey + eh) / 8) * 8, cw = (X1 - X0) / 2, ch = (Y1 - Y0) / 2;
        if (cw <= 0 || ch <= 0 || cw * ch > 400000) return 'rgba(0,0,0,0)';
        const st = this.st.slice().sort((a, b) => a[0] - b[0]).map(([t, c]) => [t, [c[0], c[1], c[2], Math.round(c[3] * 12) / 12]]); // 알파는 1/12 단위 (캐시 적중)
        const q = v => Math.round(v / 2) * 2; // 위치·반지름은 2px 단위
        const gk = this.kind === 'r' ? [geo[3] - X0, geo[4] - Y0, geo[2], geo[5]] : [geo[0] - X0, geo[1] - Y0, geo[2] - X0, geo[3] - Y0];
        const key = this.kind + gk.map(q).join(',') + '|' + cw + 'x' + ch + '|' + N + '|' + dk + '|' + DLV + '|' + st.map(s => s[0] + ':' + s[1].join(',')).join(';');
        let cv2 = DGC.get(key) || DGS.get(key);
        if (!cv2) {
          const [c, gg] = mkCanvas(cw, ch), im = gg.createImageData(cw, ch), px = im.data;
          const col0 = t => { if (t <= st[0][0]) return st[0][1]; for (let i = 1; i < st.length; i++) if (t <= st[i][0]) { const a = st[i - 1], b = st[i], k = (t - a[0]) / Math.max(1e-6, b[0] - a[0]); return [0, 1, 2, 3].map(j => a[1][j] + (b[1][j] - a[1][j]) * k); } return st[st.length - 1][1]; };
          const LUT = []; for (let i = 0; i <= N; i++) LUT.push(col0(i / N)); // 단계가 N+1개뿐이라 미리 계산
          const gk2 = gk.map(q), G0 = this.kind === 'r' ? [gk2[0] + X0, gk2[1] + Y0, gk2[2], gk2[3]] : [gk2[0] + X0, gk2[1] + Y0, gk2[2] + X0, gk2[3] + Y0];
          for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) {
            const wx = X0 + i * 2 + 1, wy = Y0 + j * 2 + 1; let t;
            if (this.kind === 'r') { const d = Math.hypot(wx - G0[0], wy - G0[1]); t = (d - G0[2]) / Math.max(1e-6, G0[3] - G0[2]); }
            else { const vx = G0[2] - G0[0], vy = G0[3] - G0[1], L2 = vx * vx + vy * vy || 1; t = ((wx - G0[0]) * vx + (wy - G0[1]) * vy) / L2; }
            t = Math.max(0, Math.min(1, t));
            const b = (DBAY[(j & 3) * 4 + (i & 3)] + 0.5) / 16, c3 = LUT[Math.min(N, dBandQ(t * N, b))];
            const al = Math.min(1, c3[3] / dk), sK = al * DLV, bi = Math.floor(sK), aq = Math.min(1, (bi + ((sK - bi) > b ? 1 : 0)) / DLV); if (aq <= 0) continue; // 알파도 단계 사이만 디더
            const o = (j * cw + i) * 4; px[o] = c3[0] * dk; px[o + 1] = c3[1] * dk; px[o + 2] = c3[2] * dk; px[o + 3] = Math.round(aq * 255);
          }
          gg.putImageData(im, 0, 0); cv2 = c;
          if (cw * ch <= 4096) { if (DGS.size > 3000) DGS.clear(); DGS.set(key, cv2); } // 작은 무늬(손 빛 등)는 따로 넉넉히 — 큰 무늬 때문에 같이 비워지지 않게
          else { if (DGC.size > 240) DGC.clear(); DGC.set(key, cv2); }
        }
        const pat = g.createPattern(cv2, 'no-repeat'); pat.setTransform(new DOMMatrix([2, 0, 0, 2, X0, Y0]));
        return pat;
      } };
  }
  const dRadial = (g, x0, y0, r0, x1, y1, r1) => DITHER_ON ? dGrad('r', [x0, y0, r0, x1, y1, r1]) : Object.assign(g.createRadialGradient(x0, y0, r0, x1, y1, r1), { p() { return this; } });
  const dLinear = (g, x0, y0, x1, y1) => DITHER_ON ? dGrad('l', [x0, y0, x1, y1]) : Object.assign(g.createLinearGradient(x0, y0, x1, y1), { p() { return this; } });

  // ---------------------------------------------------------------- 저장
  const SAVE_KEY = 'acr_proto_v1';
  const blankSave = () => ({ inv: [], equip: {}, equipBy: { knight: {}, ranger: {}, mage: {}, priest: {}, gunner: {} }, mats: { iron: 0, crystal: 0 }, gold: 0, runs: 0, clears: 0, nextId: 1, lastCls: 'knight', lastStage: 1 });
  let SAVE = blankSave();
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.inv) SAVE = Object.assign(blankSave(), s); } catch (e) { /* 저장소 없음 */ }
  // v3.53 캐릭터별 기록 분리 (사용자 결정): 회차(밤) · 원정 완료 · 최고 도달 · 진실 기록 · 수첩 진실 기록 · 「해」를 처음 들음
  //  SAVE.byCls[직업]에 따로 담고, SAVE.runs 같은 이름은 지금 캐릭터(G.cls → 선택 중인 CUR → lastCls) 것을 읽고 쓰는 통로로 바꾼다 (저장 JSON에는 byCls만 남음)
  //  해금 · 업적 누적(rec · unl) · 인벤토리 · 재료는 그대로 함께 씀. 예전 저장의 공용 기록은 마지막으로 고른 직업으로 옮김
  { const PK = ['runs', 'clears', 'clears3', 'clears4', 'best', 'truth', 'noteTruth', 'sunKnown'], C5 = ['knight', 'ranger', 'mage', 'priest', 'gunner'];
    if (!SAVE.byCls) { SAVE.byCls = {}; const o = SAVE.byCls[C5.includes(SAVE.lastCls) ? SAVE.lastCls : 'knight'] = {}; for (const k of PK) if (SAVE[k] != null) o[k] = SAVE[k]; }
    for (const c of C5) if (!SAVE.byCls[c]) SAVE.byCls[c] = {};
    const curC = () => { if (typeof G !== 'undefined' && G && G.cls) return G.cls; if (typeof CUR !== 'undefined' && CUR) return CUR; return SAVE.lastCls || 'knight'; };
    const box = () => { const c = curC(); return SAVE.byCls[c] || (SAVE.byCls[c] = {}); };
    for (const k of PK) { delete SAVE[k]; Object.defineProperty(SAVE, k, { get: () => { const v = box()[k]; return v === undefined && (k === 'runs' || k === 'clears') ? 0 : v; }, set: v => { box()[k] = v; }, enumerable: false, configurable: true }); } }
  // 이전 버전 저장 데이터 옮기기: 장착은 기사 것으로, 무기는 기사 무기로
  if (!SAVE.equipBy || !SAVE.equipBy.knight) SAVE.equipBy = { knight: Object.assign({}, SAVE.equip || {}), ranger: {} };
  for (const k of ['knight', 'ranger', 'mage', 'priest', 'gunner']) if (!SAVE.equipBy[k]) SAVE.equipBy[k] = {};
  SAVE.inv.forEach(it => { if (it.slot === 'weapon' && !it.cls) it.cls = 'knight'; if (it.lv == null) it.lv = 0; if (it.fail == null) it.fail = 0; if (it.grade === 'rby' && it.name === 'RBY?') it.name = 'RGB?'; }); // v2.56 RBY? → RGB?
  if (!SAVE.weaponRolls) SAVE.weaponRolls = {};
  SAVE.inv.forEach(it => { if (it.slot === 'weapon' && it.wk != null && it.grade !== 'rby') { const k = `${it.cls || 'knight'}:${it.wk}`; if (!SAVE.weaponRolls[k]) SAVE.weaponRolls[k] = { val: it.val, opts: (it.opts || []).map(o => ({ ...o })) }; } });
  // v2.00 하트 방식: 방어구(투구·갑옷·장화) 삭제(사용자 결정), 목걸이 주 능력치 HP → 쿨타임 감소, HP·방어 옵션 삭제
  if (!SAVE.v200) {
    const gone = new Set(SAVE.inv.filter(it => ['helm', 'armor', 'boots'].includes(it.slot)).map(it => it.id));
    SAVE.inv = SAVE.inv.filter(it => !gone.has(it.id));
    for (const k in SAVE.equipBy) for (const sk of ['helm', 'armor', 'boots']) delete SAVE.equipBy[k][sk];
    const GM = { common: 1, rare: 1.25, unique: 1.6, legend: 2.1 };
    SAVE.inv.forEach(it => { if (it.slot === 'neck' && it.stat === 'hp') { it.stat = 'cdr'; it.val = Math.round((3 + Math.floor(Math.random() * 4)) * (GM[it.grade] || 1)); } it.opts = (it.opts || []).filter(o => o.k !== 'hpP' && o.k !== 'defP'); });
    SAVE.v200 = true;
  }
  // v2.06 무기에 붙어 있던 효과 옵션·세트 지우기 (무기는 고유 기술만)
  SAVE.inv.forEach(it => { if (it.slot === 'weapon') { it.efx = null; it.set = null; } });
  // v2.07 반지·목걸이 지우기 · 저주 지우기 (저주 보너스 옵션도)
  { const gone = new Set(SAVE.inv.filter(it => it.slot !== 'weapon').map(it => it.id)); SAVE.inv = SAVE.inv.filter(it => !gone.has(it.id));
    for (const k in SAVE.equipBy) for (const sk of ['ring', 'ring2', 'neck', 'helm', 'armor', 'boots']) delete SAVE.equipBy[k][sk];
    SAVE.inv.forEach(it => { if (it.curse) { it.curse = null; it.opts = (it.opts || []).filter(o => !o.cb); it.name = it.name.replace(/^저주받은 /, ''); } }); }
  if (SAVE.gold == null) SAVE.gold = 0;
  // v1.96 승천 「잿불 단계」 저장: max 열린 최고 단계 · sel 마지막으로 고른 단계 · best 직업별 최고 클리어 단계 · unl 단계 돌파 기록
  if (!SAVE.asc) SAVE.asc = { max: (SAVE.clears4 || 0) > 0 ? 1 : 0, sel: 0, best: {}, unl: [] };
  // v2.29 해금: 누적 기록(SAVE.rec)으로 추가 유물(나중에 추가 무기)이 열린다
  if (!SAVE.rec) SAVE.rec = {}; if (!SAVE.unl) SAVE.unl = {};
  const josa = (w, a, b) => { const c = (w || '').charCodeAt(w.length - 1) - 0xac00; return c >= 0 && c <= 11171 && c % 28 ? a : b; }; // 받침 있으면 a
  const UNLOCKS = [
    { id: 'r:mirror', kind: 'r', key: 'mirror', s: '퍼펙트 회피를 150번 하면 열립니다.', rec: 'perfect', n: 150, how: '퍼펙트 회피' },
    { id: 'r:glove', kind: 'r', key: 'glove', s: '잊힌 틈새를 8번 찾으면 열립니다.', rec: 'secret', n: 8, how: '잊힌 틈새 찾기' },
    { id: 'r:oldmap', kind: 'r', key: 'oldmap', s: '잊힌 틈새를 25번 찾으면 열립니다.', rec: 'secret', n: 25, how: '잊힌 틈새 찾기' },
    { id: 'r:gravedirt', kind: 'r', key: 'gravedirt', s: '보스를 한 번도 맞지 않고 3번 처치하면 열립니다.', rec: 'nohit', n: 3, how: '보스를 한 번도 맞지 않고 처치' },
    { id: 'r:horn', kind: 'r', key: 'horn', s: '정예를 100마리 처치하면 열립니다.', rec: 'elite', n: 100, how: '정예 처치' },
    { id: 'r:coal', kind: 'r', key: 'coal', s: '모닥불에서 30번 쉬면 열립니다.', rec: 'rest', n: 30, how: '모닥불에서 쉬기' },
    { id: 'r:twincoin', kind: 'r', key: 'twincoin', s: '상점에서 골드를 8,000 쓰면 열립니다.', rec: 'spent', n: 8000, how: '상점에서 골드 쓰기' },
    { id: 'r:cloak', kind: 'r', key: 'cloak', s: '점멸을 2,000번 하면 열립니다.', rec: 'blink', n: 2000, how: '점멸' },
    { id: 'r:deadring', kind: 'r', key: 'deadring', s: '30번 쓰러지면 열립니다.', rec: 'death', n: 30, how: '쓰러지기' },
    { id: 'r:scales', kind: 'r', key: 'scales', s: '무기 칸 3개를 모두 채운 판을 15번 만들면 열립니다.', rec: 'fullbag', n: 15, how: '한 판에 무기 칸 3개를 모두 채우기' },
    // v2.36 해금 유물 2차 — 한 판 안의 업적 위주
    { id: 'r:prism', kind: 'r', key: 'prism', s: '한 판에서 세 빛을 각각 25개 이상 모으면 열립니다.', rec: 'u_prism', n: 1, how: '한 판에서 세 빛을 각각 25개 모으기' },
    { id: 'r:brush', kind: 'r', key: 'brush', s: '한 챕터의 격전지를 모두 정리하는 일을 3번 해내면 열립니다.', rec: 'paintall', n: 3, how: '한 챕터의 격전지를 모두 정리하기' },
    { id: 'r:wick', kind: 'r', key: 'wick', s: '한 판에 분노의 빛을 45개 모으면 열립니다.', rec: 'u_wick', n: 1, how: '한 판에 분노의 빛 45개 모으기' },
    { id: 'r:droplet', kind: 'r', key: 'droplet', s: '한 판에 퍼펙트 회피를 15번 하면 열립니다.', rec: 'u_drop', n: 1, how: '한 판에 퍼펙트 회피 15번' },
    { id: 'r:lantern', kind: 'r', key: 'lantern', s: '한 판에 희망의 빛을 45개 모으면 열립니다.', rec: 'u_lant', n: 1, how: '한 판에 희망의 빛 45개 모으기' },
    { id: 'r:duelband', kind: 'r', key: 'duelband', s: '역습 한 번 동안 적을 5마리 처치하면 열립니다.', rec: 'u_duel', n: 1, how: '역습 한 번 동안 적 5마리 처치' },
    { id: 'r:glassheart', kind: 'r', key: 'glassheart', s: '하트가 반 칸 남은 채로 보스를 처치하면 열립니다.', rec: 'u_glass', n: 1, how: '하트 반 칸 남은 채로 보스 처치' },
    { id: 'r:chain', kind: 'r', key: 'chain', s: '역습으로 적을 300번 경직시키면 열립니다.', rec: 'cstun', n: 300, how: '역습으로 적 경직시키기' },
    { id: 'r:staff', kind: 'r', key: 'staff', s: '한 번도 맞지 않고 챕터 하나를 클리어하면 열립니다.', rec: 'u_staff', n: 1, how: '한 번도 맞지 않고 챕터 클리어' },
    { id: 'r:invhorn', kind: 'r', key: 'invhorn', s: '난입자를 15번 물리치면 열립니다.', rec: 'invader', n: 15, how: '난입자 격퇴' },
    { id: 'r:candle', kind: 'r', key: 'candle', s: '1장을 8분 안에 클리어하면 열립니다.', rec: 'u_candle', n: 1, how: '1장을 8분 안에 클리어' },
    { id: 'r:banner5', kind: 'r', key: 'banner5', s: '서로 다른 다섯 직업으로 4장 보스를 처치하면 열립니다.', rec: 'cls4', n: 5, how: '서로 다른 직업으로 4장 보스 처치', unit: '직업' },
  ];
  const recOnce = k => { if (!G) return; G.urec = G.urec || {}; if (G.urec[k]) return; G.urec[k] = 1; rec(k); }; // v2.36 한 판에 한 번만 세는 기록
  { // v2.31 직업마다 레어 3종(3·4·5번) · 유니크 2종(7·8번)은 해금 (사용자 결정)
    const CN = { knight: '기사', ranger: '암살자', mage: '마법사', priest: '사제', gunner: '거너' }, RO = { knight: '기사로', ranger: '암살자로', mage: '마법사로', priest: '사제로', gunner: '거너로' }, PS = { knight: '흘려내기', ranger: '베어내기', mage: '마나 격류 흘려냄', priest: '신의 가호', gunner: '교활 빗나감' };
    for (const c in CN) UNLOCKS.push(
      { id: `w:${c}:3`, kind: 'w', key: `${c}:3`, rec: `boss_${c}_1`, n: 1, how: `${RO[c]} 1장 보스 처치`, s: `${RO[c]} 1장 보스를 처치하면 열립니다.` },
      { id: `w:${c}:4`, kind: 'w', key: `${c}:4`, rec: `kill_${c}`, n: 300, how: `${RO[c]} 적 처치`, s: `${RO[c]} 적을 300마리 처치하면 열립니다.` },
      { id: `w:${c}:5`, kind: 'w', key: `${c}:5`, rec: `ev_${c}`, n: 20, how: `${CN[c]} ${PS[c]}`, s: `${CN[c]}의 ${PS[c]}${josa(PS[c], '을', '를')} 20번 발동하면 열립니다.` },
      { id: `w:${c}:7`, kind: 'w', key: `${c}:7`, rec: `boss_${c}_2`, n: 1, how: `${RO[c]} 2장 보스 처치`, s: `${RO[c]} 2장 보스를 처치하면 열립니다.` },
      { id: `w:${c}:8`, kind: 'w', key: `${c}:8`, rec: `boss_${c}_3`, n: 1, how: `${RO[c]} 3장 보스 처치`, s: `${RO[c]} 3장 보스를 처치하면 열립니다.` });
  }
  const unlocked = id => !!SAVE.unl[id];
  const weaponLocked = (c, i) => UNLOCKS.some(u => u.kind === 'w' && u.key === c + ':' + i && !unlocked(u.id));
  const relicLocked = k => UNLOCKS.some(u => u.kind === 'r' && u.key === k && !unlocked(u.id));
  function unlockCheck() {
    for (const u of UNLOCKS) if (!unlocked(u.id) && (SAVE.rec[u.rec] || 0) >= u.n) {
      SAVE.unl[u.id] = 1; persist();
      const nm = u.kind === 'r' ? RELICS[u.key].n : (() => { const [c, i] = u.key.split(':'); return wcat(c)[+i].name; })();
      if (G) { (G.newUnl = G.newUnl || []).push(u.id); lootFeed(`<b style="color:#ffd34d">새로 열림 · ${u.kind === 'r' ? '유물' : '무기'} 「${nm}」</b> — 코코아의 기록 보관소`, '#ffd34d', 4500); sfx('legend'); }
    }
  }
  const rec = (k, n) => { SAVE.rec[k] = (SAVE.rec[k] || 0) + (n == null ? 1 : n); unlockCheck(); };
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { /* 무시 */ } };
  // ---------------------------------------------------------------- v1.96 승천 「잿불 단계」 (0 = 원래 게임, 1~10 규칙 누적)
  const ASC_MAX = 10;
  const ASC = [
    null,
    { n: '잿불', d: '적 체력이 10% 증가합니다.' },
    { n: '마른 샘', d: '모든 회복 −25%' },
    { n: '날 선 칼', d: '정예·보스에게 맞으면 한 칸' },
    { n: '무리', d: '격전지 웨이브마다 적 +1' },
    { n: '왕의 분노', d: '보스 체력이 15% 증가하고, 보스 공격 예고 시간이 감소합니다.' },
    { n: '궁핍', d: '상점 가격 +30% · 골드 −20%' },
    { n: '침입자의 땅', d: '난입자가 챕터마다 2번' },
    { n: '피의 칼', d: '맞을 때 20% 확률로 한 칸' },
    { n: '꺼진 모닥불', d: '모닥불 회복 절반 · 축복 선택지 2개' },
    { n: '잿빛 왕관', d: '정예 적에게 특성 · 보스가 쓰러지기 전 한 번 다시 일어섬' },
  ];
  const ascLv = () => (G && G.asc) || 0;
  const ascOn = n => ascLv() >= n;
  const ASCF = { // 이번 런 단계까지 누적된 배율
    eHp: () => ascOn(1) ? 1.1 : 1,
    heal: () => ascOn(2) ? 0.75 : 1,
    eAtk: () => 1, // v2.00 하트 방식: 3·8단계는 한 칸 피격으로 바뀜
    bossHp: () => ascOn(5) ? 1.15 : 1,
    bossTele: () => ascOn(5) ? 1 / 0.9 : 1,
    shop: () => ascOn(6) ? 1.3 : 1,
    gold: () => ascOn(6) ? 0.8 : 1,
    mat: () => 1 + 0.1 * ascLv(),
    gear: () => 1 + 0.02 * ascLv(), // v1.97 잿불 장비: 기본 수치 +2%×단계
  };
  const ascTag = it => it && it.asc ? ` <span class="ascTag">잿불 ${it.asc}</span>` : ''; // v1.97 잿불 장비 표기
  // v1.97 첫 돌파 꾸러미 (8 = 보류)
  const ASC_FIRST = { 0: { crystal: 2 }, 1: { iron: 10 }, 2: { crystal: 2 }, 3: { iron: 15 }, 4: { gold: 500 }, 5: { crystal: 4 }, 6: { gold: 800 }, 7: { crystal: 3, iron: 20 }, 9: { crystal: 5 } };
  // 장비 등급 가중치(일반·희귀·유니크·전설): 단계마다 일반에서 희귀 이상으로 2%, 8단계부터 전설 +1%씩
  function ascGradeW(w) {
    const L = ascLv(); if (!L) return w;
    const t = w.reduce((a, b) => a + b, 0), k = t / 100, v = w.slice();
    let mv = Math.min(v[0], 2 * L * k); v[0] -= mv; v[1] += mv * 0.7; v[2] += mv * 0.25; v[3] += mv * 0.05; // v1.98 60/30/10 → 70/25/5
    if (L >= 8) { const lg = Math.min(v[1], (L - 7) * 0.5 * k); v[1] -= lg; v[3] += lg; } // v1.98 +1 → +0.5%
    return v;
  }

  // ---------------------------------------------------------------- 사운드
  let AC = null;
  const initAudio = () => { window.AudioSys.init(); AC = window.AudioSys.ctx; };
  // 효과음: 여러 레이어(톤·노이즈·아르페지오)를 겹쳐 만든다. [종류, 파형/필터, 시작Hz, 끝Hz, 길이, 볼륨]
  const SFX = {
    legend:  [['tone', 'triangle', 523, 1046, 0.55, 0.35], ['tone', 'sine', 784, 1568, 0.7, 0.28], ['noise', 'highpass', 3000, 8000, 0.45, 0.18]],
    // v3.18 안전 놀이터 (7번째 값 = 늦게 시작하는 시간)
    denCard: [['noise', 'bandpass', 1800, 900, 0.07, 0.4], ['noise', 'lowpass', 700, 250, 0.06, 0.2]],
    denDice: [0, 0.08, 0.17, 0.24, 0.36, 0.45, 0.6, 0.78].flatMap((d, i) => [['noise', 'bandpass', 1500 - i * 60, 1100, 0.035, 0.42 - i * 0.035, d], ['tone', 'triangle', 640 - i * 20, 420, 0.04, 0.14 - i * 0.012, d]]),
    denWin:  [['arp', [69, 72, 76, 81], 0.08, 0.16], ['noise', 'bandpass', 1600, 1200, 0.03, 0.35, 0], ['noise', 'bandpass', 1500, 1100, 0.03, 0.3, 0.07], ['noise', 'bandpass', 1400, 1000, 0.03, 0.28, 0.14]],
    denLose: [['arp', [64, 60, 57], 0.14, 0.15], ['tone', 'triangle', 196, 98, 0.5, 0.14, 0.3]],
    swing:   [['noise', 'bandpass', 700, 2600, 0.16, 0.55], ['tone', 'triangle', 320, 110, 0.1, 0.18]],
    whoosh:  [['noise', 'bandpass', 400, 2400, 0.3, 0.7], ['tone', 'sawtooth', 160, 55, 0.22, 0.14]],
    hit:     [['noise', 'lowpass', 4000, 700, 0.09, 0.8], ['tone', 'square', 240, 60, 0.08, 0.32], ['tone', 'sine', 110, 40, 0.14, 0.7]],
    heavy:   [['noise', 'lowpass', 2600, 250, 0.22, 0.95], ['tone', 'sine', 130, 32, 0.3, 1.0], ['tone', 'square', 180, 50, 0.12, 0.3]],
    kill:    [['noise', 'bandpass', 1400, 250, 0.26, 0.7], ['tone', 'sawtooth', 220, 45, 0.22, 0.3]],
    crit:    [['tone', 'square', 2400, 1800, 0.07, 0.22], ['tone', 'triangle', 3200, 2600, 0.16, 0.2], ['noise', 'highpass', 6000, 3000, 0.06, 0.5], ['tone', 'sine', 90, 35, 0.18, 0.8]],
    crunch:  [['noise', 'lowpass', 3000, 120, 0.16, 1.0], ['tone', 'sine', 75, 28, 0.22, 1.0], ['tone', 'square', 140, 40, 0.1, 0.3]],
    finisher:[['noise', 'lowpass', 5000, 100, 0.6, 1.0], ['tone', 'sine', 60, 22, 0.7, 1.0], ['tone', 'triangle', 1800, 600, 0.5, 0.18]],
    beat:    [['tone', 'sine', 72, 38, 0.16, 0.9], ['noise', 'lowpass', 220, 80, 0.1, 0.35]],
    beat2:   [['tone', 'sine', 64, 34, 0.14, 0.6]],
    growl:   [['noise', 'lowpass', 700, 180, 0.28, 0.45], ['tone', 'sawtooth', 95, 55, 0.26, 0.22], ['tone', 'square', 60, 40, 0.2, 0.12]],
    step:    [['noise', 'lowpass', 1100, 300, 0.035, 0.22], ['tone', 'sine', 140, 70, 0.03, 0.12]],
    hurt:    [['noise', 'lowpass', 1800, 300, 0.2, 0.85], ['tone', 'sawtooth', 200, 55, 0.25, 0.5], ['tone', 'sine', 90, 40, 0.2, 0.6]],
    dodge:   [['noise', 'highpass', 1800, 7000, 0.14, 0.5], ['tone', 'sine', 500, 1500, 0.12, 0.28]],
    perfect: [['tone', 'sine', 880, 1760, 0.35, 0.45], ['tone', 'triangle', 1320, 2640, 0.45, 0.32], ['noise', 'highpass', 4000, 9000, 0.3, 0.35]],
    drop:    [['arp', [72, 76, 79, 84, 88, 91], 0.07, 0.4]],
    boss:    [['tone', 'sawtooth', 95, 40, 0.9, 0.55], ['noise', 'lowpass', 700, 100, 0.9, 0.6]],
    roar:    [['tone', 'sawtooth', 85, 34, 1.2, 0.7], ['tone', 'square', 62, 30, 1.2, 0.35], ['noise', 'lowpass', 900, 140, 1.0, 0.75]],
    blast:   [['noise', 'lowpass', 3000, 110, 0.75, 1.0], ['tone', 'sine', 95, 28, 0.65, 0.95]],
    grogi:   [['tone', 'triangle', 1300, 280, 0.5, 0.45], ['tone', 'square', 650, 140, 0.5, 0.22], ['arp', [84, 79, 76, 72], 0.06, 0.25]],
    awaken:  [['tone', 'sawtooth', 200, 800, 0.5, 0.38], ['tone', 'sine', 400, 1600, 0.6, 0.45], ['noise', 'highpass', 3000, 9000, 0.5, 0.35]],
    block:   [['tone', 'square', 1500, 1400, 0.09, 0.4], ['tone', 'triangle', 2200, 2100, 0.18, 0.32], ['noise', 'highpass', 5000, 5000, 0.05, 0.45]],
    warn:    [['tone', 'square', 900, 880, 0.1, 0.32], ['tone', 'square', 1350, 1330, 0.08, 0.18]],
    ready:   [['arp', [84, 88, 91], 0.05, 0.32]],
    blip:    [['tone', 'square', 660, 660, 0.04, 0.22]],
    select:  [['arp', [76, 83], 0.05, 0.3]],
    bolt:    [['tone', 'square', 900, 1500, 0.08, 0.16], ['noise', 'highpass', 3000, 6000, 0.06, 0.2]],
    boltBig: [['tone', 'sawtooth', 500, 1300, 0.14, 0.25], ['noise', 'bandpass', 1500, 4000, 0.12, 0.35]],
    fireball:[['noise', 'lowpass', 2200, 500, 0.35, 0.6], ['tone', 'sawtooth', 200, 90, 0.3, 0.3]],
    shot:    [['noise', 'lowpass', 6000, 300, 0.22, 1.0], ['tone', 'square', 170, 40, 0.12, 0.55], ['noise', 'highpass', 4000, 2000, 0.05, 0.5]],
    shotgun: [['noise', 'lowpass', 5000, 200, 0.38, 1.0], ['tone', 'sine', 120, 35, 0.3, 0.9], ['noise', 'highpass', 3000, 1500, 0.08, 0.5]],
    snipe:   [['noise', 'lowpass', 8000, 150, 0.7, 1.0], ['tone', 'sine', 90, 25, 0.6, 1.0], ['tone', 'sawtooth', 700, 80, 0.3, 0.4]],
    reload:  [['tone', 'square', 1800, 1700, 0.03, 0.25], ['noise', 'highpass', 5000, 5000, 0.03, 0.3]],
    trapClick: [['noise', 'highpass', 4800, 3200, 0.025, 0.65], ['tone', 'square', 2600, 1900, 0.02, 0.3], ['noise', 'bandpass', 2300, 1500, 0.035, 0.55, 0.08], ['tone', 'square', 1700, 1150, 0.03, 0.28, 0.08], ['tone', 'sine', 190, 90, 0.07, 0.35, 0.08]], // v3.20 갱도 함정: 찰칵 (두 번 맞물리는 쇳소리)
    heal:    [['arp', [72, 76, 79, 84, 88], 0.06, 0.32], ['tone', 'sine', 600, 1200, 0.45, 0.25]],
    aim:     [['tone', 'sine', 300, 1300, 1.9, 0.16], ['tone', 'triangle', 150, 650, 1.9, 0.1]],
    eat:     [['noise', 'lowpass', 1200, 400, 0.12, 0.5], ['arp', [67, 71, 74], 0.05, 0.3]],
    coin:    [['arp', [88, 95, 100], 0.04, 0.32], ['tone', 'square', 1900, 2400, 0.08, 0.15]],
    frenzy:  [['tone', 'sawtooth', 110, 330, 0.4, 0.45], ['noise', 'bandpass', 600, 2400, 0.35, 0.5], ['arp', [62, 65, 69, 74], 0.05, 0.3]],
  };
  // v3.20 디더 그림자 (소품 공통): 2px 칸을 체크무늬로 찍음 — 진하기 a(0~1)는 찍는 칸의 비율 (0.5 = 체크무늬 한 겹)
  const DSH_B = [0.125, 0.625, 0.875, 0.375], DSH_C = 'rgba(4,3,8,.8)';
  function dshOn(cx, cy, a) { return DSH_B[(cy & 1) * 2 + (cx & 1)] < a; }
  // v3.20 디더 타원 그림자 (캐릭터 · 적 · 투사체 · 떨어진 물건): 가운데 a, 가장자리 a×0.55 — s = 칸 크기(px)
  function dshEll(g, cx, cy, rx, ry, a = 0.5, s = 2) { if (!g || !g.fillRect || rx <= 0) return; g.fillStyle = DSH_C; ry = Math.max(ry, s); const ox = Math.round(cx / s) * s, oy = Math.round(cy / s) * s, nx = Math.ceil(rx / s), ny = Math.ceil(ry / s); for (let j = -ny; j < ny; j++) for (let i = -nx; i < nx; i++) { const q = (((i + 0.5) * s) / rx) ** 2 + (((j + 0.5) * s) / ry) ** 2; if (q > 1) continue; const x = ox + i * s, y = oy + j * s; const ci = Math.floor(x / s), cj = Math.floor(y / s), chk = ((ci + cj) & 1) === 0, sp = chk && (((ci - (cj & 1)) >> 1) & 1) === 0; if (a >= 0.45 ? chk : a >= 0.15 && sp) g.fillRect(x, y, s, s); } } // 가운데를 칸 경계에 맞춰 좌우·위아래 대칭
  function dshRect(g, x, y, w, h, a = 0.5) { g.fillStyle = DSH_C; x = Math.round(x) & ~1; y = Math.round(y) & ~1; for (let yy = y; yy < y + h; yy += 2) for (let xx = x; xx < x + w; xx += 2) if (dshOn(xx >> 1, yy >> 1, a)) g.fillRect(xx, yy, 2, 2); }
  const sfxLast = {};
  function sfx(name, pitch = 1) {
    if (!AC || !window.AudioSys.sfxBus) return;
    const L = SFX[name]; if (!L) return;
    const t = AC.currentTime;
    if (sfxLast[name] && t - sfxLast[name] < 0.035) return; // 같은 소리가 한 프레임에 겹쳐 터지지 않게
    sfxLast[name] = t;
    const bus = window.AudioSys.sfxBus, GAIN = 1.4; // 음악 위로 확실히 들리도록
    const t0 = t;
    for (const ly of L) {
      if (ly[0] === 'tone') {
        const [, type, f0, f1, dur, vol] = ly, t = t0 + (ly[6] || 0), o = AC.createOscillator(), g = AC.createGain();
        o.type = type; o.frequency.setValueAtTime(f0 * pitch, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * pitch), t + dur);
        g.gain.setValueAtTime(vol * GAIN, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
      } else if (ly[0] === 'noise') {
        const [, ft, f0, f1, dur, vol] = ly, t = t0 + (ly[6] || 0), n = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
        n.buffer = noiseBuffer(); f.type = ft; f.Q.value = ft === 'bandpass' ? 1.4 : 0.7;
        f.frequency.setValueAtTime(f0 * pitch, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1 * pitch), t + dur);
        g.gain.setValueAtTime(vol * GAIN, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        n.connect(f); f.connect(g); g.connect(bus); n.start(t); n.stop(t + dur + 0.02);
      } else {
        const [, notes, step, vol] = ly;
        notes.forEach((m, i) => {
          const tt = t + i * step, o = AC.createOscillator(), g = AC.createGain();
          o.type = 'triangle'; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
          g.gain.setValueAtTime(vol * GAIN, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.25);
          o.connect(g); g.connect(bus); o.start(tt); o.stop(tt + 0.27);
        });
      }
    }
  }
  let _noise = null;
  function noiseBuffer() {
    if (_noise) return _noise;
    _noise = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = _noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return _noise;
  }

  // ---------------------------------------------------------------- 도트 스프라이트 (명암 4단계)
  const MAPS = {
    // ---- v0.95 챕터 2 기사단 (타락한 종자 · 기사단 사냥개 · 타락한 사제 · 역병 기사 · 기사단 처형인 · 타락한 기수)
    squire: [
      '....kkkkkk......',
      '...kwllllmk.....',
      '..kwllllllmk....',
      '..klllllllmk....',
      '..kkkkkkkekk....',
      '..klllmllmmk....',
      '..klmlmlmmmk....',
      '...kkkkkkkk.....',
      '..kcRRgRRck.....',
      '.kcCRrgrRCck....',
      '.kckRrrrRkck....',
      '.kk.kRrrRk.kk...',
      '....kRrRRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    squireUp: [
      '....kkkkkk......',
      '...kwllllmk.....',
      '..kwllllllmk....',
      '..klllllllmk....',
      '..kkkkkkkekk....',
      '..klllmllmmk....',
      '..klmlmlmmmk....',
      '...kkkkkkkk.....',
      '..kcRRgRRck.....',
      '.kcCRrgrRCck....',
      '..kkRrrrRkk.....',
      '...kkRrrRk......',
      '....kRrRRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    chaplain: [
      '.....kkkk.....',
      '....kWwwwk....',
      '...kWgwgwgk...',
      '..kWwgggggWk..',
      '..kWwwwwwwWk..',
      '..kWwkkkkkWk..',
      '..kWkSSekekk..',
      '..kWkSSSSSWk..',
      '..kWWkkkkWWk..',
      '...kWRggRWk...',
      '..kWwRwwRwWk..',
      '.ksWwRwgRwWsk.',
      '..kkWRwwRwWk..',
      '..kWwRwwRwwWk.',
      '.kWWwRrwRwrWWk',
      '.kkkkkkkkkkkkk',
    ],
    pknight: [
      '.....kkkkk......',
      '....klllllk.....',
      '...kllllllmk....',
      '...kkkkkkekk....',
      '...kmmmmmmmk....',
      '..kkkSsssSkkk...',
      '.kmlkPsssPklmk..',
      'kmllkssPsssklmk.',
      'kmlksssssPsskmk.',
      'kdmkPssssssPkdk.',
      'kdmksssPssssskk.',
      '.kkmmkssssskmmk.',
      '..kdmmkkkkkmmdk.',
      '...kdk...kdk....',
      '...kdk...kdk....',
      '...kkk...kkkk...',
    ],
    hound: [
      '.............k..k.......',
      '............kDkkLk......',
      '............kDdkLlk.....',
      '...........kmlllmLdk....',
      '...........kmmmmLLddk...',
      '..........kdddddkeLdkk..',
      'kk........kddddddLLLLLkk',
      'kLk.......kLddddDDLLLLkk',
      'kLdk......kLLdddDkkkkkk.',
      '.kddkkkkkkkLLdddDtDDk...',
      '..kdRrrrgrrrRddddDkkk...',
      '.kddRrrrrrrrRdddddk.....',
      '.kdDDgkkkkkgDDddddk.....',
      '..kDdkkDdk..kDdkDdk.....',
      '..kDdkkDdk..kDdkDdk.....',
      '..kDddkDddk.kDddkDddk...',
      '..kkkkkkkkk.kkkkkkkkk...',
    ],
    exec: [
      '......kkkkkk........',
      '.....kHHHHHHk.......',
      '....kHhhhhhhHk......',
      '....kHhhhhhhHk......',
      '....kHhkehkehk......',
      '....kHhhhhhhHk......',
      '....kHHhhhhHHk......',
      '...kkHHHHHHHHkk.....',
      '..kHHHssssssHHHk....',
      '.kHHsssssssssHHk....',
      '.kHsssbssssbssHk....',
      '..kssssbssbssssk....',
      '..kssssssbbssssk....',
      '...kAAAAAAAAAAk.....',
      '...kAaaaaaaaaAk.....',
      '...kAarraaaaaAk.....',
      '...kAaaaaraaaAk.....',
      '....kAaaraaaAk......',
      '....kBBk.kBBk.......',
      '....kBBk.kBBk.......',
      '...kBBBk.kBBBk......',
      '...kkkkk.kkkkk......',
    ],
    squireB: [
      '....kkkkk.......',
      '...kmllllk......',
      '..kmllllllk.....',
      '..kkkkkkkkkk....',
      '..kcSSSkSek.....',
      '..kcSSSkSSk.....',
      '..kccSSmmSk.....',
      '...kkcccck......',
      '..kcRRgRRck.....',
      '.kmlRrrrRCck....',
      '.kmkRrgrRkck....',
      '.kk.kRrrRk.kk...',
      '....kRrRRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    squireBUp: [
      '....kkkkk.......',
      '...kmllllk......',
      '..kmllllllk.....',
      '..kkkkkkkkkk....',
      '..kcSSSkSek.....',
      '..kcSSSkSSk.....',
      '..kccSSmmSk.....',
      '...kkcccck......',
      '..kcRRgRRck.....',
      '.kmlRrrrRCck....',
      '..kkRrgrRkk.....',
      '...kkRrrRk......',
      '....kRrRRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    squireC: [
      '.....kkkk.......',
      '...kkccccck.....',
      '..kcCcccccck....',
      '..kcccccccck....',
      '..kcSSSSeSk.....',
      '..kcSDSSSSk.....',
      '..kcSSSmmSk.....',
      '...kcccccck.....',
      '..kcRRRRRck.....',
      '.kcCRrgrRCck....',
      '.kckbbbybkck....',
      '.kk.kRrkRk.kk...',
      '....kR.kRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    squireCUp: [
      '.....kkkk.......',
      '...kkccccck.....',
      '..kcCcccccck....',
      '..kcccccccck....',
      '..kcSSSSeSk.....',
      '..kcSDSSSSk.....',
      '..kcSSSmmSk.....',
      '...kcccccck.....',
      '..kcRRRRRck.....',
      '.kcCRrgrRCck....',
      '..kkbbbybkk.....',
      '...kkRrkRk......',
      '....kR.kRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    houndB: [
      '.............k..k.......',
      '............kDkkLk......',
      '............kDdkLlk.....',
      '...........kmlllmLdk....',
      '...........kmmmmLLddk...',
      '..........kdddddkeLdkk..',
      'kk........kddddddLLLLLkk',
      'kLk.......kLddddDDLLLLkk',
      'kLdk......kLLdddDkkkkkk.',
      '.kddkkkkkkkLLdddDtDDk...',
      '..kdRrrrgrrrRddddDkkk...',
      '.kddRrrrrrrrRdddddk.....',
      '.kdDDgkkkkkgDDdddddk....',
      'kDdkkDdk.....kDdkkDdk...',
      'kDkk.kDdk.....kDdkkDdk..',
      'kDdk..kDdk.....kDddkDddk',
      'kkkk..kkkk.....kkkkkkkkk',
    ],
    mother: [
      '......kkkkkkkk......',
      '.....kHHhhhhHHk.....',
      '....kHhhhhhhhhHk....',
      '...kHhhhSSSSShhHk...',
      '...kHhSsssssssShk...',
      '...kHhssessseshHk...',
      '...kHhsssssssssHk...',
      '..kHHhsSsmmmsSsHHk..',
      '..kHHkhSsmmmsSkHHk..',
      '.kHHkkkksssskkkkHHk.',
      '.kHkSSSSkkkkSSSSkHk.',
      'kHkSssssSssSssssSkHk',
      'kHksskssvvvvssksskHk',
      'kkksk.ksvVVVvsk.kskk',
      '..ksk.ksvVVVVsk.ksk.',
      '..kbk.ksvvVVvsk.kbk.',
      '..k.k.kSsvvvsSk.k.k.',
      '.....krRrRrRrRk.....',
      '....krRrRrRrRrRk....',
      '...krRrRrRrRrRrRk...',
      '...kRrRrRrRrRrRrk...',
      '...kkSSkkkkkkSSkk...',
      '....kSSk....kSSk....',
      '...kSSSk....kSSSk...',
      '...kkkkk....kkkkk...',
    ],
    crowA: [
      'K.........K.....',
      'Kk.......kK.....',
      '.kk.....kk.kkk..',
      '..kKk.kKk.kKkkk.',
      '...kKkKkkkkkekyy',
      '....kkkkkkkkkk..',
      '...kkkkkkkk.....',
      '.......k.k......',
    ],
    crowB: [
      '................',
      '...........kkk..',
      '....kkk...kKkkk.',
      '.kkkKKkkkkkkekyy',
      'kKkkkkkkkkkkkk..',
      'k..kkkkkkkk..k..',
      '...kkkkkk.......',
      '.......k.k......',
    ],
    gbrute: [
      '...........kkkkkk...........',
      '..........khhhhssk..........',
      '.........khhhhssssk.........',
      '..kk....khhhsssssrsk...kk...',
      '.khhkk.khhhsssssssrskkkhhk..',
      '..kShhkkhsSSSSSSSrsSkhhSk...',
      '...kSshkssseesseesSSksSk....',
      '....kSrksssskssskSSSkSk.....',
      '.....kSksssssSSSSSSSkk......',
      '......kkssswsSSSwSSSk.......',
      '........ksswkkkkwSSk........',
      '......kkkkSSSSSSSSkkkk......',
      '.....khhsskkSSSSkkhhssk.....',
      '.....ksssshbkkkkssssssk.....',
      '.....kssSShsssssssssSSk.....',
      '....kksSSSsssssssssSSSkk....',
      '...khskksssSSssSSSSSkkssk...',
      '...kssSksssssssSSSSSksssk...',
      '...khsskskkkkkkkkkkSkhssk...',
      '...kssSSkCCCCCCCCCCksssSk...',
      '...kSSSkkCccCccCccCkkSSSk...',
      '....kkk..kcckcckcck..kkk....',
      '.........kkkSkkskkk.........',
      '........kSSSSkSSSSSk........',
      '.........kkkk.kkkkk.........',
    ],
    gbruteUp: [
      '..kkk......kkkkkk......kkk..',
      '.khhsk....khhhhssk....khssk.',
      '.ksssSk..khhhhssssk..kssssk.',
      '.kSkSSk.khhhsssssrsk.kskSSk.',
      '..khkk.khhhsssssssrskkkhkSk.',
      '..kshhkkhsSSSSSSSrsSkhhskSk.',
      '.kskSshkssseesseesSSksSkssk.',
      '.ksskSrksssskssskSSSkSksssk.',
      '.kssSkSksssssSSSSSSSkkksssk.',
      'ksssSskkssswsSSSwSSSkkhsssSk',
      '.kSSssskksswkkkkwSSkkhssSSk.',
      '..kssskkkkSSSSSSSSkkkksSSk..',
      '...kskhhsskkSSSSkkhhsskSk...',
      '....kksssshbkkkksssssskk....',
      '.....kssSShsssssssssSSk.....',
      '.....ksSSSsssssssssSSSk.....',
      '......kksssSSssSSSSSkk......',
      '.......ksssssssSSSSSk.......',
      '.......kskkkkkkkkkkSk.......',
      '........kCCCCCCCCCCk........',
      '........kCccCccCccCk........',
      '.........kcckcckcck.........',
      '.........kkkSkkskkk.........',
      '........kSSSSkSSSSSk........',
      '.........kkkk.kkkkk.........',
    ],
    boar: [
      '....................k.............',
      '........k..k.......kdk............',
      '......kkbkkbkk.....kpDk...........',
      '.....kbkkbbkbbkk.kkdpDkkkkk.......',
      '...k.kbbkbbkbbkbkDdddDDLLLLk......',
      '..kbkkbbkbbkbbkdDdDLLLLLLLddk.....',
      '...kbbkLLLLLLLdDdDLLLLLLdddddk....',
      'k..kbLLLLLLLLLDdDLLLLLddkkkDddk...',
      'Dk.kLLLLLLLddddDdLLddddddkedddk...',
      'kDkLLLLdddddddDdDddddddddkeddpkk..',
      'kdkddddddddddddDdddddddddddpppPPk.',
      '.kkdddddddddddddDddddddddDDpppPk..',
      '..kddddddddddDDDDddddddDDDDwppPPk.',
      '...kddddddDDDDDDDDdddDDDDDDwppPk..',
      '....kdDDDDDDDDDDDDDDDDDkkkwwkpk...',
      '....kDDDDDDDDDDDDDDDDDDDDDDk.k....',
      '....kDDDkDddkkkkkDDDkDddkkk.......',
      '....kDDDkDddk...kDDDkDddk.........',
      '....khhhkhhhk...khhhkhhhk.........',
      '.....kkk.kkk.....kkk.kkk..........',
      '..................................',
    ],
    goblin: [
      '....kkkkkk....',
      '...kssssssk...',
      'kkkssssssssskk',
      'kSSsesssessSSk',
      '..kksSSSsskk..',
      '....kksskk....',
      '...kccccccck..',
      '..kscCccCcsk..',
      '.ks.kcCcck.sk.',
      '.kS.kccCck.Sk.',
      '.kk.kCCCCk.kk.',
      '....kSk.kSk...',
      '...kkSk.kSkk..',
      '...kkkk.kkkk..',
    ],
    goblinUp: [ // v3.25 팔 길이는 예전 그대로, 어깨(몸)에서 올림 · 팔 칸은 14_rig.js GOB_UP_ARM으로 팔 부위
      '................',
      '.....kkkkkk.....',
      '....kssssssk....',
      '.kkkssssssssskk.',
      'kskSsesssessSksk',
      'kSkkksSSSsskkkSk',
      '.kSk.kksskk.kSk.',
      '..kSkcccccccSk..',
      '....kcCccCck....',
      '.....kcCcck.....',
      '.....kCCCCk.....',
      '.....kSk.kSk....',
      '....kkSk.kSkk...',
      '....kkkk.kkkk...',
    ],
    mage: [
      '........kk........',
      '.......kPHk.......',
      '......kPhHk.......',
      '......kPhhHk......',
      '..kkkkPPhhhHkkkk..',
      '.kHPPhhhhhhhhhHHk.',
      '..kkkksesseSkkkk..', // 귀 없이 모자챙만 길게
      '.....ksssssSk.....',
      '.kk..kqggggRk.....',
      'kWWkkqqRrrRRQk....',
      'kFEEkqrRggRRQk....',
      'kEEEkqrRrrRRQk....',
      '.kEEkkkdkkdkk.....',
      ',.kk.kkk..kkk....,',
    ],
    priest: [
      '......kk..kk......',
      '.....kEikkiEk.....',
      '.....kEikkiEk.....',
      '.....kEikkiEk.....',
      '......kEkkEk......',
      '......kwWWVk......',
      '.....kWwwwvVk.....',
      '.....kWkkkkVk.....',
      '.....kWesseVk.....',
      '.....kWsssSVk.....',
      '......kkggkk......',
      '.....kwwgGgvVk....',
      '....kwwwgggvVk....',
      '..kkkwwwwgvvVk....',
      '.kEEkWwwwgvvVk....',
      '.kFEkkWwwvvVk.....',
      '..kk.kdk..kdk.....',
      ',....kkk..kkk....,',
    ],
    gunner: [
      '......k....k......',
      '.....kEk..kEk.....',
      '.....kiEkkEik.....',
      '.....kkkkkkkk.....',
      '....khhHHHHHHk....',
      '...kHHhbhhbhHHk...',
      '....kkkkkkkkkk....',
      '.....ksesseSk.....',
      '.....kmmmmmmk.....',
      '....kCcmmmcxxk....',
      '.kkkCCcclccxxk....',
      'kFEkCcckbkcxxk....',
      'kEEEkCcccccxxk....',
      'kEEkkCckkkcxk.....',
      '.kWk.kdk..kdk.....',
      ',.k..kkk..kkk....,',
    ],
    gunner2: [
      '....k.....k....',
      '...kqk...kqk...',
      '...kHrrHrrHk...',
      '...krqLrqLrk...',
      '.kHHHHHHHHHHHk.',
      '..kgggggggggk..',
      '..kgekGGGekgk..',
      '.kgdGGWWWGGGgk.',
      '..kgkWWnWWkgk..',
      '...kkSSSSSkk...',
      '..kcCCCBCCCck..',
      'kgkGkcCxCckGk..',
      'kgkkCCCkCCCk...',
      '.kk.kFFk.kFFk..',
      '....kkkk.kkkk.,',
    ], // v2.42 그레이브 새 도트 (13×14 기준, 월드 플리퍼 비율 참고)
    gunner2W1: [
      '...............',
      '....k.....k....',
      '...kqk...kqk...',
      '...kHrrHrrHk...',
      '...krqLrqLrk...',
      '.kHHHHHHHHHHHk.',
      '..kgggggggggk..',
      '..kgekGGGekgk..',
      '.kgdGGWWWGGGgk.',
      '..kgkWWnWWkgk..',
      '...kkSSSSSkk...',
      '..kcCCCBCCCck..',
      'kgkGkcCxCckGk..',
      'kgkkCCCkCCCk...',
      '.kk.kFFkkkkk..,',
    ], // 걷기 2프레임: 1칸 내려감 · 왼발
    gunner2W3: [
      '...............',
      '....k.....k....',
      '...kqk...kqk...',
      '...kHrrHrrHk...',
      '...krqLrqLrk...',
      '.kHHHHHHHHHHHk.',
      '..kgggggggggk..',
      '..kgekGGGekgk..',
      '.kgdGGWWWGGGgk.',
      '..kgkWWnWWkgk..',
      '...kkSSSSSkk...',
      '..kcCCCBCCCck..',
      'kgkGkcCxCckGk..',
      'kgkkCCCkCCCk...',
      '.kk.kkkkFFk...,',
    ], // 걷기 4프레임: 1칸 내려감 · 오른발
    gunner2R: [
      '....k.....k....',
      '...kqk...kqk...',
      '...kHrrHrrHk...',
      '...krqLrqLrk...',
      '.kHHHHHHHHHHHk.',
      '..kgggggggggk..',
      '..kgekGGGekgk..',
      '.kgdGGWWWGGGgk.',
      '..kgkWWnWWkgk..',
      '...kkSSSSSkk...',
      '..kcCCCBCCCck..',
      'kgkGkcCxCckGk..',
      'kgkkCCCkCCCk...',
      '.kk.kFFk.kFFk..',
      '....kkkk.kkkk.,',
    ], // 눈이 앞(오른쪽)을 봄
    gunner2W1R: [
      '...............',
      '....k.....k....',
      '...kqk...kqk...',
      '...kHrrHrrHk...',
      '...krqLrqLrk...',
      '.kHHHHHHHHHHHk.',
      '..kgggggggggk..',
      '..kgekGGGekgk..',
      '.kgdGGWWWGGGgk.',
      '..kgkWWnWWkgk..',
      '...kkSSSSSkk...',
      '..kcCCCBCCCck..',
      'kgkGkcCxCckGk..',
      'kgkkCCCkCCCk...',
      '.kk.kFFkkkkk..,',
    ], // 눈이 앞(오른쪽)을 봄
    gunner2W3R: [
      '...............',
      '....k.....k....',
      '...kqk...kqk...',
      '...kHrrHrrHk...',
      '...krqLrqLrk...',
      '.kHHHHHHHHHHHk.',
      '..kgggggggggk..',
      '..kgekGGGekgk..',
      '.kgdGGWWWGGGgk.',
      '..kgkWWnWWkgk..',
      '...kkSSSSSkk...',
      '..kcCCCBCCCck..',
      'kgkGkcCxCckGk..',
      'kgkkCCCkCCCk...',
      '.kk.kkkkFFk...,',
    ], // 눈이 앞(오른쪽)을 봄
    potion: ['..kkkk..', '..kbbk..', '...kk...', '..knnk..', '.kppppk.', 'kpqpppPk', 'kppppPPk', 'kPpppPPk', '.kkkkkk.'],
    orb: ['..kkk..', '.kyYyk.', 'kyYWYyk', 'kYYYYYk', 'kyYYYyk', '.kyyyk.', '..kkk..'],
    pouch: ['..k.k..', '..kgk..', '.kbbbk.', 'kbbBbbk', 'kbBgBbk', 'kbbbbbk', '.kkkkk.'],
    vial: ['..kkk..', '..kck..', '..kck..', '.kvVvk.', 'kvVVVvk', 'kvVHVvk', '.kvvvk.'],
    crumb: ['.kkkk.', 'kYyYyk', 'kBYBYk', 'kBBBBk', '.kkkk.'], // v2.03 빵조각
    carrot: ['.k.k...', 'kGkGk..', '.kGk...', '.kook..', '.koOk..', '..kok..', '..kok..', '...k...'], // v2.13 당근
    mochi: ['.kkkk.', 'kmmmMk', 'kmimmk', 'kmmmMk', '.kkkk.'], // v2.13 떡
    relic: ['..kkk..', '.kRhRk.', 'kRhYhRk', 'kRYWYRk', 'kRhYhRk', '.kRhRk.', '..kkk..'], // v2.07 유물 (잿불 심장)
    heartUp: ['.YY.YY.', 'YqpYppY', 'YpppWpY', 'YppWWWY', '.YppWY.', '..YpY..', '...Y...'], // v2.02 빈 하트 그릇
    medal: ['.rRRr.', '.rRRr.', '..kk..', '.kYYk.', 'kYWYyk', 'kYYYyk', '.kyyk.'], // v2.02 잿빛 훈장
    heartFull: ['.kk.kk.', 'kqpkppk', 'kppppPk', 'kppppPk', '.kppPk.', '..kPk..', '...k...'], // v2.01 하트 한 칸
    heartHalf: ['.kk.kk.', 'kqpkrrk', 'kppkrrk', 'kppkrrk', '.kpkrk.', '..kkk..', '...k...'], // v2.01 하트 반 칸 (오른쪽은 빈 칸)
    dummy: ['..........kYk.........', '.........kykYk........', '........kYkykyk.......', '.......kSSSSssk.......', '......kSSSttsssk......', '......kSStwwTszk......', '.....kSStwttwTzzk.....', '.....kSStwttwTzzk.....', '......ksstwwTzzk......', '......ksssttzzZk......', '.......kszzzzZk.......', '.......kkggGGGk.......', '.kkkkkkSySSSssYkkkkkk.', 'kySgSSSSSSSsssssssgsyk', 'yksgssSSSSssZssszzgzkY', 'kYzGzzSSSSssssszZZGZYk', 'YykZZkSSSsssZszzkZZkYy', 'kk.kkkSSggGssszzkkk.kk', '.....kSSggssZzzzk.....', '.....kSssssszzzzk.....', '.....kssssszZzzZk.....', '.....kgggggGGGGGk.....', '.....ksssszzzzZZk.....', '......ksszzzzZZk......', '......kykYbBkyYk......', '.......kYkyBYkk.......', '........kkbBk.........', '........kkbBkk........', '.....kkkbbbBBBkkk.....', '....kbbbbbbBBBBBBk....', '...kddddddddddddddk...', '....kkkkkkkkkkkkkk....'], // v3.20 연습용 허수아비: 짚을 채운 자루 몸 · 팔(가로대) · 과녁 그린 자루 머리 · 밧줄 · 짚 · 십자 받침
    shieldPk: ['kkkkkkk', 'kWnnnyk', 'knnYnyk', 'knYYYyk', '.knYnk.', '..kyk..', '...k...'], // v2.00 방패 조각
    gear: ['....kk', '...kck', '..kck.', 'kkck..', '.kk...', 'k.k...'],
    knight: [
      '.....rr.....',
      '....rrrr....',
      '...kkkkkkk..',
      '..kwllllllk.',
      '..klllllmmk.',
      '..klsessemk.',
      '..klmsssmdk.',
      '...kkkkkkk..',
      '..Rkwlmmdk..',
      '.RRkmggmdk..',
      '.RRkmmmmdk..',
      '.R.kdkkdk...',
      '...kdk.kdk..',
      '...kkk.kkk..',
    ],
    soldier: [
      '.....rr.......',
      '....rrrr......',
      '...kkkkkkk....',
      '..kwllllllk...',
      '..klllllmmk...',
      '..kllmmmmmk...',
      '..kkkkekkekk..',
      '..klmmmmmmdk..',
      '...kkkkkkkk...',
      '.RRkwlmmmdkR..',
      'RRRklmggmdkk..',
      'RRRkmmmmmdk...',
      'RR.kdmmmdk....',
      'R..kdkkkdk....',
      '...kdk.kdk....',
      '..kkdk.kkdk...',
      '..kkkk..kkk...',
    ],
    boss: [
      '.k...........k....',
      '.kk.........kk....',
      '..kk.kkkkkk.kk....',
      '...kkwllllmkk.....',
      '...kklkeekkkk.....',
      '...kkllmmmmk......',
      '...kkkmggmkk......',
      '..RkkkkkkkkkR.....',
      '.RRkwlmmmdkkRk....',
      '.RRklmmmddkkkk....',
      '.RRkmmgmmdk.......',
      '.RRkkmmmdkk.......',
      'RRRRkdmmdk........',
      'RRR.kmkkmk........',
      'RR..kdk.kdk.......',
      'RR..kdk.kdk.......',
      'R..kkdk.kkdk......',
      '...kkkk..kkk......',
    ],
    ghoul: [
      '...kkkkkkk....',
      '..kCCCCcCCk...',
      '.kCCsssssCCk..',
      '.kCsssssssCk..',
      '..kSskesskek..',
      '..kSsssssssk..',
      '..kSssmmmssk..',
      '...kkSmbmSk...',
      '..kcccccSkk...',
      '.kscCcCcCcksk.',
      '.kS.kccCcck.Sk',
      '.kbk.kcCck.kbk',
      '..k..kSkkSk.k.',
      '....kkSk.kSk..',
      '....kkkk.kkkk.',
    ],
    ranger: [
      '......k...k.......',
      '.....kEk.kEk......',
      '.....kEikkiEk.....',
      '.....kEFFFEk......',
      '....kHhhhhhhk.....',
      '....kHhkkkkkk.....',
      '.kk.kEkseksek.....',
      'kFEkkEkssssskk....',
      'kEk..kkrrrrrk.....',
      'kEk.krrrlllmk.....',
      'kEkrrklllmmk......',
      'kEkr.kmbbbmk......',
      '.kEEkklllmmk......',
      '..kk.kmkkmk.......',
      '.....kdk.kdk......',
      ',....kkk.kkk.....,',
    ],
    ghoulUp: [
      'kbk...........kbk',
      'ksk...........ksk',
      'kSk.kkkkkkk...kSk',
      'kSkkCCCCcCCk..kSk',
      'kSkCCsssssCCk.kSk',
      '.kSksssssssCkkSk.',
      '.kSkSskesskekkSk.',
      '..kSkssssssskSk..',
      '..kSkssmmmsskSk..',
      '...kkkSmbmSkkk...',
      '....kcccccSk.....',
      '....kcCcCcck.....',
      '.....kccCcck.....',
      '.....kcCcck......',
      '.....kSkkSk......',
      '....kkSk.kSk.....',
      '....kkkk.kkkk....',
    ],
    cultist: [
      '.....kkkk.....',
      '....kRRRRk....',
      '...kRrrrrRk...',
      '..kRrrrrrrRk..',
      '..kRrkkkkkRk..',
      '..kRkkkkekek..',
      '..kRkkkkkkRk..',
      '..kRRkkkkRRk..',
      '...kRRhhRRk...',
      '..kRrrRRrrRk..',
      '.kskRrRRrRksk.',
      '..kkRrrRRrRk..',
      '..kRrrrRRrrRk.',
      '.kRRrrrRRrrRRk',
      '.kkkkkkkkkkkkk',
    ],
    bloat: [
      '.....kkkkk......',
      '....kSsssSk.....',
      '...kSssssssk....',
      '...kSsskeskek...',
      '...kSssssssk....',
      '...kkSsmmmSk....',
      '..kSskkSSkkSk...',
      '.kSssPssssPssk..',
      'kSsPsssssPsssSk.',
      'kSsssPPsssssPsk.',
      'kSPsssssssPssSk.',
      'kSssPssPssssSSk.',
      '.kSSsssssPsSSk..',
      '..kkSSSSSSSkk...',
      '...kSk...kSk....',
      '...kkk...kkk....',
    ],
    dog: [
      '.............k..k.......',
      '............kDkkLk......',
      '............kDdkLlk.....',
      '...........kdddddLdk....',
      '...........kddddLLddk...',
      '..........kdddddkeLdkk..',
      'kk........kddddddLLLLLkk',
      'kLk.......kLddddDDLLLLkk',
      'kLdk......kLLdddDkkkkkk.',
      '.kddkkkkkkkLLdddDtDDk...',
      '..kdLLdLLLdLLddddDkkk...',
      '.kddLdddDdDdddddddk.....',
      '.kdDDdkkkkkkDDddddk.....',
      '..kDdkkDdk..kDdkDdk.....',
      '..kDdkkDdk..kDdkDdk.....',
      '..kDddkDddk.kDddkDddk...',
      '..kkkkkkkkk.kkkkkkkkk...',
    ],
    dogB: [
      '.............k..k.......',
      '............kDkkLk......',
      '............kDdkLlk.....',
      '...........kdddddLdk....',
      '...........kddddLLddk...',
      '..........kdddddkeLdkk..',
      'kk........kddddddLLLLLkk',
      'kLk.......kLddddDDLLLLkk',
      'kLdk......kLLdddDkkkkkk.',
      '.kddkkkkkkkLLdddDtDDk...',
      '..kdLLdLLLdLLddddDkkk...',
      '.kddLdddDdDdddddddk.....',
      '.kdDDdkkkkkkDDdddddk....',
      'kDdkkDdk.....kDdkkDdk...',
      'kDkk.kDdk.....kDdkkDdk..',
      'kDdk..kDdk.....kDddkDddk',
      'kkkk..kkkk.....kkkkkkkkk',
    ],
    wolfA: [
      '............k...k.......',
      '............kk..kk......',
      '............kDkkLLk.....',
      '............kDdkLlk.....',
      '...........kddddLLdk....',
      '..........kldddLLLddk...',
      'kkk.......klddddkeLdkk..',
      'kLLk.....klldddddLLLLkkk',
      'kLLLk....kllldddDLLLLLkk',
      '.kLddk...kllcccccDkkkkkk.',
      '.kkdddkkkcmcmcmcDtDDk...',
      '...kdLLLLdLLLddddDkkk...',
      '..kddLdddDdDdddddddk....',
      '..kdDDdkkkkkkDDddddk....',
      '..kDdkkDdk...kDdkDdk....',
      '..kDdkkDdk...kDdkDdk....',
      '..kDddkDddk..kDddkDddk..',
      '..kkkkkkkkk..kkkkkkkkk..',
    ],
    wolfB: [
      '............k...k.......',
      '............kk..kk......',
      '............kDkkLLk.....',
      '............kDdkLlk.....',
      '...........kddddLLdk....',
      '..........kldddLLLddk...',
      'kkk.......klddddkeLdkk..',
      'kLLk.....klldddddLLLLkkk',
      'kLLLk....kllldddDLLLLLkk',
      '.kLddk...kllcccccDkkkkkk.',
      '.kkdddkkkcmcmcmcDtDDk...',
      '...kdLLLLdLLLddddDkkk...',
      '..kddLdddDdDdddddddk....',
      '.kdDDdkkkkkkkDDdddddk...',
      'kDdkkDdk......kDdkkDdk..',
      'kDkk.kDdk......kDdkkDdk.',
      'kDdk..kDdk......kDddkDdd',
      'kkkk..kkkk......kkkkkkkk',
    ],
    heldDrum: [
      '...kkkkkk...',
      '.kkWWWWWWkk.',
      'kWWwwwwwwWWk',
      'kWwwwwwwwwWk',
      'kkWWWWWWWWkk',
      'kQbbbbbbbbQk',
      'kbRbbbbbbRBk',
      'kbbRbbbbRbBk',
      'kbbbRbbRbbBk',
      'kbbbbRRbbbBk',
      'kbbbRbbRbbBk',
      'kQbbbbbbbbQk',
      'kkWWWWWWWWkk',
      '.kkkkkkkkkk.',
    ],
    baldor: [
      '..k....................k..',
      '..kk..................kk..',
      '..kwk....kkkkkkkk....kwk..',
      '...kwk..kwllllllmk..kwk...',
      '....kwkkwlllllllmmkkwk....',
      '.....kkwllllllllmmdkk.....',
      '......klllllllmmmmdk......',
      '......kllkkkkkkkkkkk......',
      '......klmkkeekkeekkk......',
      '......kllmmmmmmmmddk......',
      '...kkkklmmmgggmmmddkkkk...',
      '..krrrqkkmmmmmmmdkkRRRRk..',
      '..krrrqqqqqGgGGrrrRRRRGk..',
      '...kqrrrgqqlmmdrrgRRRRk...',
      '..kgGGgGGgGlmmdgGGgGGgk...',
      '..kqqqRqrrllmmddrrRRRRRk..',
      '..kqqqRqrrllggddrrRrRRRk..',
      '..kqqqRqrrlleeddrrRrRRRk..',
      '.kqqqqqrrlllggdddRrrRRRk..',
      '.kqqqqqrrlllmmdddRrrRRRRk.',
      '.kqqqRqrrlllmmdddRrrRRRRk.',
      '.kqqqRqrlgkkgkkgkkrrRRRRk.',
      'kqqqqRqrllllmmddddrrRRRRk.',
      'kqqqqRqrrRdmmRdmmRrrRRRRRk',
      'kqqqqqrrRqdmmrdmmrrrRRRRRk',
      'kqqkRkkrRkdmmrdmmrkrkkRRk.',
      'kRkkRkkRkkdmmRdmmkkRkkRk..',
      '.k..k..k.kkkkkkkkk.k..k...',
    ],
  };
  const PAL = {
    dummy: { k: '#120c0a', S: '#d8c098', s: '#b89c72', z: '#8a7050', Z: '#665238', y: '#e8cc70', Y: '#b8983c', b: '#9a7048', B: '#6e4c2e', d: '#4a3220', t: '#c03030', T: '#841c22', w: '#efe6d2', g: '#5a4a36', G: '#3e3226' }, // v3.20 허수아비
    squire: {'S': '#8a9476', 'D': '#5a2a2a', 'b': '#4a3020', 'y': '#b89040', 'k':  '#0e0c10', 'w':  '#d8dce4', 'l':  '#9aa0ac', 'm':  '#6a707c', 'd':  '#3c404a', 'e':  '#ff4030', 'c':  '#7a7a80', 'C':  '#4a4a52', 'R':  '#4a0e14', 'r':  '#7a1a22', 'g':  '#b89040'},
    chaplain: {'k':  '#0e0a0c', 'W':  '#7e786c', 'w':  '#c0b8a6', 'g':  '#c9a24a', 'S':  '#2a2228', 'e':  '#ffcc66', 'R':  '#6a1520', 'r':  '#8a1a1a', 's':  '#c9b49a'},
    pknight: {'k':  '#121012', 'l':  '#8a8e96', 'm':  '#5a5e68', 'd':  '#3a3c44', 's':  '#8f9a6a', 'S':  '#5f6a45', 'P':  '#a3452e', 'e':  '#ff3b2c'},
    hound: {'k':  '#100c0c', 'd':  '#4e3b33', 'D':  '#2f231e', 'l':  '#a8aeb8', 'L':  '#94766a', 't':  '#e0d8c0', 'e':  '#ff3b2c', 'm':  '#6a707c', 'r':  '#7a1a22', 'R':  '#4a0e14', 'g':  '#b89040'},
    exec: {'B':  '#2a2024', 'k':  '#0c0a0a', 'H':  '#141014', 'h':  '#2a242a', 'e':  '#ff3020', 's':  '#b08a78', 'S':  '#7a5a4c', 'b':  '#3a2418', 'A':  '#3a2418', 'a':  '#5a3a24', 'r':  '#7a1418'},
    pknightHot: { k: '#300808', l: '#e08a5a', m: '#b05030', d: '#702010', s: '#e05a36', S: '#a02818', P: '#ffd060', e: '#ffffff' },
    mother: { k: '#0c0a0c', H: '#1a1418', h: '#3a2e34', s: '#b8b09c', S: '#7a7464', e: '#c8f060', m: '#2a1010', v: '#9ae050', V: '#4a7a20', r: '#4a3a38', R: '#2a2020', b: '#d8d0b8' },
    crow: { k: '#141018', K: '#5a5070', e: '#ff3030', y: '#8a8070', r: '#8a1a22' },
    gbrute: { k: '#0b0f08', s: '#5e8a34', S: '#3e5e24', h: '#8ab858', e: '#ffdf3a', r: '#a3222a', w: '#ece0c4', b: '#d8d0b8', c: '#5a3a22', C: '#3a2414' },
    boar: { k: '#0a0806', d: '#4a3428', D: '#2e2018', L: '#6a5040', b: '#e0d8c0', e: '#ff3020', r: '#140c08', p: '#a06060', P: '#603838', w: '#ece0c4', h: '#1a1410' },
    shadeBoar: { k: '#3a0808', d: '#a02020', D: '#701414', L: '#d03434', b: '#ff8070', e: '#ffffff', r: '#3a0808', p: '#d03434', P: '#701414', w: '#ff8070', h: '#3a0808' },
    garcher: { k: '#0e120a', s: '#6e9a3a', S: '#46682a', c: '#3a5a34', C: '#22381f', e: '#ffd23a' },
    goblin: { k: '#0e120a', s: '#6e9a3a', S: '#46682a', c: '#5a4030', C: '#3a2a1e', e: '#ffd23a' },
    // v3.25 고블린 피부 4색 — 오크처럼 개체마다 무작위 (녹색 · 황토 · 핏빛 · 잿빛). 옷 · 눈은 그대로
    goblin_v1: { k: '#0e120a', s: '#967a3e', S: '#6a5428', c: '#5a4030', C: '#3a2a1e', e: '#ffd23a' },
    goblin_v2: { k: '#0e120a', s: '#9a5a42', S: '#6c3c2c', c: '#5a4030', C: '#3a2a1e', e: '#ffd23a' },
    goblin_v3: { k: '#0e120a', s: '#788282', S: '#545c5e', c: '#5a4030', C: '#3a2a1e', e: '#ffd23a' },
    garcher_v1: { k: '#0e120a', s: '#967a3e', S: '#6a5428', c: '#3a5a34', C: '#22381f', e: '#ffd23a' },
    garcher_v2: { k: '#0e120a', s: '#9a5a42', S: '#6c3c2c', c: '#3a5a34', C: '#22381f', e: '#ffd23a' },
    garcher_v3: { k: '#0e120a', s: '#788282', S: '#545c5e', c: '#3a5a34', C: '#22381f', e: '#ffd23a' },
    gthrower: { k: '#0e120a', s: '#7aa040', S: '#4a6a2a', c: '#6a3a5a', C: '#3e2034', e: '#ff9a3a' },
    mage: { k: '#120c0a', H: '#7a4868', h: '#a25c86', s: '#ecbb7e', e: '#2a1a12', r: '#8a5078', R: '#6a3c60', g: '#eca359', d: '#5a3a2a', E: '#c0723e', F: '#eca359', i: '#5a3028', W: '#fae1ca', P: '#c07aa0', q: '#a8689a', Q: '#4a2844', S: '#d68b59' }, // 초상(섬네일)과 같은 따뜻한 색으로
    priest: { k: '#120c0a', W: '#c8ad94', w: '#f3dbb6', s: '#f3cf9f', e: '#2a1a12', g: '#c0723e', G: '#eca359', d: '#895042', E: '#fae1ca', F: '#ecd4af', i: '#eca359', v: '#d6bea4', V: '#b89277', S: '#e0a878' }, // 초상(섬네일)과 같은 따뜻한 색으로
    gunner2: { k: '#0b0a0e', H: '#2a2a30', r: '#70707a', L: '#16161a', q: '#b39a78', b: '#9a9aa4', G: '#f3dbb6', g: '#c8ad94', d: '#a29378', W: '#fae1ca', e: '#f8f4ee', n: '#26262e', C: '#44444e', c: '#62626e', x: '#26262e', S: '#9a9aa4', B: '#c8b890', F: '#1c1c22' }, // v2.42 그레이브 새 도트
    gunner2Ghost: { k: '#16233a', r: '#5f86b8', L: '#16233a', q: '#9cc1ea', H: '#3b5a86', b: '#9cc1ea', G: '#cfe6ff', g: '#9cc1ea', d: '#5f86b8', W: '#e4f2ff', e: '#cfe6ff', n: '#16233a', C: '#3b5a86', c: '#5f86b8', x: '#16233a', S: '#9cc1ea', B: '#cfe6ff', F: '#16233a' },
    gunner: { k: '#0b0a0c', H: '#2e2e34', h: '#4e4e56', s: '#d6bea4', e: '#2a1a12', m: '#34343a', c: '#3a3a42', l: '#6a6a72', b: '#b4b4bc', d: '#1e1e22', E: '#a29378', F: '#c8ad94', i: '#5a3a30', W: '#ecd4af', C: '#56565e', x: '#24242a', S: '#b89a80' }, // 초상(섬네일)과 같은 따뜻한 색으로
    loot: { o: '#f08a2a', O: '#b8561a', G: '#5ab040', m: '#f8f0f4', M: '#d8c8d0', i: '#f0a0b8', p: '#e0303a', P: '#8a1020', q: '#ffc0c0', n: '#c8d8e0', k: '#120c0a', r: '#6e2416', R: '#b5502e', h: '#e8925e', w: '#ece0c4', y: '#a8801e', Y: '#ffd34d', W: '#fff8d8', b: '#5a3c22', B: '#8a6236', g: '#ffd34d', v: '#3a0a30', V: '#9a1a7a', H: '#ff90e0', c: '#9fb2c4' },
    ranger: { k: '#120c0a', H: '#6f7a4e', h: '#9ca973', s: '#f3cf9f', e: '#ffe9a0', r: '#c03116', l: '#b16f46', m: '#895042', b: '#eca359', d: '#5a3a2a', E: '#c0723e', F: '#ecbb7e', i: '#f3dbb6' }, // 초상(섬네일)과 같은 따뜻한 색으로
    rangerGhost: { k: '#16233a', H: '#3b5a86', h: '#5f86b8', s: '#cfe6ff', e: '#ffffff', r: '#9cc1ea', l: '#5f86b8', m: '#3b5a86', b: '#e4f2ff', d: '#3b5a86', E: '#5f86b8', F: '#9cc1ea', i: '#9cc1ea' },
    shadow: { k: '#120818', H: '#2a1238', h: '#3d1d52', s: '#6b3d8a', e: '#e0a0ff', r: '#4a1a66', l: '#3d1d52', m: '#2a1238', b: '#8a5aa8', d: '#2a1238', E: '#3d1d52', F: '#6b3d8a', i: '#6b3d8a' },
    knight: { k: '#120c0a', d: '#895042', m: '#b89277', l: '#ecd4af', w: '#fae1ca', g: '#eca359', r: '#c03116', R: '#8a2410', e: '#2a1a12', s: '#eca359' }, // 초상(섬네일)과 같은 따뜻한 색으로
    ghost: { k: '#16233a', s: '#cfe6ff', d: '#3b5a86', m: '#5f86b8', l: '#9cc1ea', w: '#e4f2ff', g: '#9cc1ea', r: '#cfe6ff', R: '#4f74a6', e: '#ffffff' },
    boss: { k: '#050407', d: '#1d1a24', m: '#2f2a3a', l: '#4d465c', w: '#7a7090', g: '#6d1c83', e: '#d17aff', r: '#4a0f14', R: '#2a070b', q: '#6e1a24', G: '#a87a30' },
    ghoul: { k: '#120f12', s: '#8a9476', S: '#59614c', c: '#4b3b30', C: '#2c231d', e: '#ff3b2c', b: '#d8d0b8', m: '#3a0c0c' },
    dog: { k: '#100c0c', d: '#4e3b33', D: '#2f231e', l: '#74594d', L: '#94766a', t: '#e0d8c0', e: '#ff3b2c' },
    cultist: { k: '#0e080a', R: '#3d0c14', r: '#6a1722', e: '#ffcc66', s: '#c9b49a', h: '#24070b' },
    bloat: { k: '#121012', s: '#8f9a6a', S: '#5f6a45', P: '#a3452e', e: '#ff3b2c', m: '#2a1010' },
    bloatHot: { k: '#300808', s: '#e05a36', S: '#a02818', P: '#ffd060', e: '#ffffff', m: '#ffd060' },
    shadeR: { k: '#3a0808', s: '#b02424', S: '#701414', c: '#d03434', C: '#501010', e: '#ffffff' },
    heldDrum: { k: '#140c08', W: '#e0d0a8', w: '#bca880', b: '#8a2e22', B: '#5a1a14', R: '#d8c090', Q: '#3a2418' },
    shade: { k: '#2a0f3a', d: '#5a2280', m: '#7a34a6', l: '#a35fd0', w: '#d9a8ff', g: '#d9a8ff', e: '#ffffff', r: '#4a1a66', R: '#2a0f3a', q: '#5a2280', G: '#a35fd0' },
  };
  // 잔상용 푸른 팔레트를 밝기에 따라 자동 생성
  const ghostOf = pal => { const ramp = ['#16233a', '#3b5a86', '#5f86b8', '#9cc1ea', '#e4f2ff'], o = {}; for (const k in pal) { const h = pal[k], r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); o[k] = ramp[Math.min(4, Math.floor((0.3 * r + 0.59 * g + 0.11 * b) / 52))]; } return o; };
  PAL.mageGhost = ghostOf(PAL.mage); PAL.priestGhost = ghostOf(PAL.priest); PAL.gunnerGhost = ghostOf(PAL.gunner);
  // v2.43 새 정면 도트 (월드 플리퍼 비율 · 측면 음영 · 꼬리) — 파티 5인 + 난입자 5종, 걷기 2·4프레임(W1·W3)은 한 칸 내려앉고 한쪽 발만 보임
  Object.assign(MAPS, {
    hKnight: ["..........k1Rk...........", "........kk1rRRk..........", ".......k1rkkMMMk.........", ".......k6kMMMMMMk........", ".......k23MMMMMMMk.......", ".......k277hhhhhmk.......", ".......k25vSSSvSmk.......", "......k22SvSSSvSmmk......", "......kk2D5SsSSDmk.......", "....kkRRkk11RRRkk........", "..kkRRRk23MRRRMMmk.......", ".kRRRRrk5k24RDmkSk.......", "k11RrrRkk22RRRmmk........", "k16RkRRrkkFFk.kFFk.......", ".k6kk6kk.kkkk.kkkk......,"],
    hKnightW0: ["..........k1Rk...........", "........kk1rRRk..........", ".......k1rkkMMMk.........", ".......k6kMMMMMMk........", ".......k23MMMMMMMk.......", ".......k277hhhhhmk.......", ".......k25vSSSvSmk.......", "......k22SvSSSvSmmk......", "......kk2D5SsSSDmk.......", "....kkRRkk11RRRkk........", "..kkRRRk23MRRRMMmk.......", ".kRRRRrk5k24RDmkSk.......", "k11RrrRkk22RRRmmk........", "k16RkRRrkkFFk.kFFk.......", ".k6kk6kk.kkkk.kkkk......,"],
    hKnightW1: [".........................", "..........k1Rk...........", "........kk1rRRk..........", ".......k1rkkMMMk.........", ".......k6kMMMMMMk........", ".......k23MMMMMMMk.......", ".......k277hhhhhmk.......", ".......k25vSSSvSmk.......", "......k22SvSSSvSmmk......", "......kk2D5SsSSDmk.......", "...kkkRRkk11RRRkk........", ".kkRRRRk23MRRRMMmk.......", "k11RRrRk5k24RDmkSk.......", "k11rrRRkk22RRRmmk........", "k61k16k..kFFk.kkkk......,"],
    hKnightW2: ["..........k1Rk...........", "........kk1rRRk..........", ".......k1rkkMMMk.........", ".......k6kMMMMMMk........", ".......k23MMMMMMMk.......", ".......k277hhhhhmk.......", ".......k25vSSSvSmk.......", "......k22SvSSSvSmmk......", "......kk2D5SsSSDmk.......", "....kkRRkk11RRRkk........", "...kRRRk23MRRRMMmk.......", "..kRRRrk5k24RDmkSk.......", ".k11rrRkk22RRRmmk........", "k11RkRRrkkFFk.kFFk.......", "k6kk6kkk.kkkk.kkkk......,"],
    hKnightW3: [".........................", "..........k1Rk...........", "........kk1rRRk..........", ".......k1rkkMMMk.........", ".......k6kMMMMMMk........", ".......k23MMMMMMMk.......", ".......k277hhhhhmk.......", ".......k25vSSSvSmk.......", "......k22SvSSSvSmmk......", ".....kkk2D5SsSSDmk.......", "..kkkRRRkk11RRRkk........", ".kRRRRRk23MRRRMMmk.......", "k11RRrRk5k24RDmkSk.......", "k61RrRRkk22RRRmmk........", ".k6k16k..kkkk.kFFk......,"],
    hRanger: [".........k...k.........", "........kDk.kLk........", "...k...kPDk.koPk.......", "..kqk..kGGHHHHHk.......", "..kOk.kDggGGGGGLk......", "..kokkDDLkLLLkLoLk.....", "..kok.kDnGmmmGmDk......", "..kqkkkkDnmzmmik.......", ".kq4RRRkk11RRRkk.......", "k11oR1kk22cYcCCk.......", "k9kqoqk4k23CxCkok......", ".k.kq44kCCCkCCCk.......", "...kkqqkkFFk.kFFk......", "...kkkkkkkkk.kkkk.....,"],
    hRangerW0: [".........k...k.........", "........kDk.kLk........", "...k...kPDk.koPk.......", "..kqk..kGGHHHHHk.......", "..kOk.kDggGGGGGLk......", "..kokkDDLkLLLkLoLk.....", "..kok.kDnGmmmGmDk......", "..kqkkkkDnmzmmik.......", ".kq4RRRkk11RRRkk.......", "k11oR1kk22cYcCCk.......", "k9kqoqk4k23CxCkok......", ".k.kq44kCCCkCCCk.......", "...kkqqkkFFk.kFFk......", "...kkkkkkkkk.kkkk.....,"],
    hRangerW1: [".......................", ".........k...k.........", "........kDk.kLk........", "...k...kPDk.koPk.......", "..kqk..kGGHHHHHk.......", "..kOk.kDggGGGGGLk......", "..kokkDDLkLLLkLoLk.....", "..kok.kDnGmmmGmDk......", "..kqkkkkDnmzmmik.......", ".kq4RRRkk11RRRkk.......", "k11oRR1k22cYcCCk.......", "k9kqoqk4k23CxCkok......", ".k.kq44kCCCkCCCk.......", "...kkqqkkFFk.kkkk.....,"],
    hRangerW2: [".........k...k.........", "........kDk.kLk........", "...k...kPDk.koPk.......", "..kqk..kGGHHHHHk.......", "..kOk.kDggGGGGGLk......", "..kokkDDLkLLLkLoLk.....", "..kok.kDnGmmmGmDk......", "..kqkkkkDnmzmmik.......", ".kq4RRRkk11RRRkk.......", ".k14RR1k22cYcCCk.......", "..k9oqk4k23CxCkok......", "...kq44kCCCkCCCk.......", "....kqqkkFFk.kFFk......", "....kkkkkkkk.kkkk.....,"],
    hRangerW3: [".......................", ".........k...k.........", "........kDk.kLk........", "...k...kPDk.koPk.......", "..kqk..kGGHHHHHk.......", "..kOk.kDggGGGGGLk......", "..kokkDDLkLLLkLoLk.....", "..kok.kDnGmmmGmDk......", "..kqkkkkDnmzmmik.......", ".kq4qRRkk11RRRkk.......", "k11oRRRk22cYcCCk.......", ".kkq4qk4k23CxCkok......", "...kq44kCCCkCCCk.......", "...kkqqkkkkk.kFFk.....,"],
    hMage: ["............k............", "...........k2k...........", "..........k2LPk..........", "..........k2LPk..........", ".........k2LPPPk.........", ".........k2LPPPk.........", "........k25PPPPPk........", ".......kk22PPPPPkk.......", ".....k22PPPPPPPPPPPk.....", ".k....kk16YYYYYYpkk......", "kWkk...kOokoookook.......", ".kWWkkk7OWUWWWUWook......", ".kWWookkOWWWnWWWok.......", ".kWooookkkpYYYpkk........", "k88ooook12PPYPPPpk.......", "k88oook22k22YPPkPPk......", ".k8oOk223k22PPPkWPPk.....", "..k9999kk22PPPPPPk.......", "...kkkkk11ppppppppk......", "........kkFFkFFkkk......,"],
    hMageW1: [".........................", "............k............", "...........k2k...........", "..........k2LPk..........", "..........k2LPk..........", ".........k2LPPPk.........", ".........k2LPPPk.........", "........k25PPPPPk........", ".......kk22PPPPPkk.......", ".....k22PPPPPPPPPPPk.....", ".k....kk16YYYYYYpkk......", "kWkk...kOokoookook.......", ".kWWkkk7OWUWWWUWook......", ".kWWookkOWWWnWWWok.......", ".kWooookkkpYYYpkk........", "k88ooook12PPYPPPpk.......", "k88oook22k22YPPkPPk......", ".k8oOk223k22PPPkWPPk.....", "..k9999kk22PPPPPPk.......", "...kkkkk11ppppppppk.....,"],
    hMageW3: [".........................", "............k............", "...........k2k...........", "..........k2LPk..........", "..........k2LPk..........", ".........k2LPPPk.........", ".........k2LPPPk.........", "........k25PPPPPk........", ".......kk22PPPPPkk.......", ".....k22PPPPPPPPPPPk.....", ".k....kk16YYYYYYpkk......", "kWkk...kOokoookook.......", ".kWWkkk7OWUWWWUWook......", ".kWWookkOWWWnWWWok.......", ".kWooookkkpYYYpkk........", "k88ooook12PPYPPPpk.......", "k88oook22k22YPPkPPk......", ".k8oOk223k22PPPkWPPk.....", "..k9999kk22PPPPPPk.......", "...kkkkk11ppppppppk.....,"],
    hPriest: [".......kk.....kk.......", "......k1Hk...kHHk......", "......k1qk...kqHk......", "......k1qk...kqHk......", ".......k1qk.kqHk.......", ".......k1qkkkqHk.......", "......k11HHHHHHHk......", "......k12hhhhhhHk......", "......k14vSSSvSHk......", ".....k214ESSSEShHk.....", "...kkkk244SnSSShk......", "..kHHHkkk11XHHkk.......", ".kHHHHk21HXXXHHhk......", ".k5Hk4k3k21XHhksk......", ".k5Hk4kk21HHHHhk.......", "..k55kk.kFFk.kFFk......", "...kkk..kkkk.kkkk.....,"],
    hPriestW1: [".......................", ".......kk.....kk.......", "......k1Hk...kHHk......", "......k1qk...kqHk......", "......k1qk...kqHk......", ".......k1qk.kqHk.......", ".......k1qkkkqHk.......", "......k11HHHHHHHk......", "......k12hhhhhhHk......", "......k14vSSSvSHk......", ".....k214ESSSEShHk.....", "...kkkk244SnSSShk......", "..kHHHkkk11XHHkk.......", ".kHHHHk21HXXXHHhk......", ".k5Hk4k3k21XHhksk......", ".k5Hk4kk21HHHHhk.......", "..k55kk.kFFk.kkkk.....,"],
    hPriestW3: [".......................", ".......kk.....kk.......", "......k1Hk...kHHk......", "......k1qk...kqHk......", "......k1qk...kqHk......", ".......k1qk.kqHk.......", ".......k1qkkkqHk.......", "......k11HHHHHHHk......", "......k12hhhhhhHk......", "......k14vSSSvSHk......", ".....k214ESSSEShHk.....", "...kkkk244SnSSShk......", "..kHHHkkk11XHHkk.......", ".kHHHHk21HXXXHHhk......", ".k5Hk4k3k21XHhksk......", ".k5Hk4kk21HHHHhk.......", "..k55kk.kkkk.kFFk.....,"],
    hGunner: [".........k.....k.........", "........kdk...kgk........", "........kkkkkkkkk........", "........kHHHHHHHk........", ".......kkQVQHQVQkk.......", "......kkkkkkkkkkkkk......", ".......kdZkgggkZgk.......", "....kkkdgUXZZZXZggk......", "..kkgggkkVUUNUUUkk.......", ".kGGggggkk11SSSkk........", "kGGDgggk23CCBCCCck.......", ".kkDdddk4k23xCckGk.......", "...kkEEEkCCCkCCCk........", ".....kkk.kFFk.kFFk.......", ".........kkkk.kkkk......,"],
    hGunnerW1: [".........................", ".........k.....k.........", "........kdk...kgk........", "........kkkkkkkkk........", "........kHHHHHHHk........", ".......kkQVQHQVQkk.......", "......kkkkkkkkkkkkk......", ".......kdZkgggkZgk.......", "....kkkdgUXZZZXZggk......", "..kkgggkkVUUNUUUkk.......", ".kGGggggkk11SSSkk........", "kGGDgggk23CCBCCCck.......", ".kkDdddk4k23xCckGk.......", "...kkEEEkCCCkCCCk........", ".....kkk.kFFk.kkkk......,"],
    hGunnerW3: [".........................", ".........k.....k.........", "........kdk...kgk........", "........kkkkkkkkk........", "........kHHHHHHHk........", ".......kkQVQHQVQkk.......", "......kkkkkkkkkkkkk......", ".......kdZkgggkZgk.......", "....kkkdgUXZZZXZggk......", "..kkgggkkVUUNUUUkk.......", ".kGGggggkk11SSSkk........", "kGGDgggk23CCBCCCck.......", ".kkDdddk4k23xCckGk.......", "...kkEEEkCCCkCCCk........", ".....kkk.kkkk.kFFk......,"],
    invPanda: ["........kk.....kk........", ".......kRWk...kWRk.......", ".......kRRkkkkkRRk.......", ".k....k44RRRRRRRRRk......", "krkk..k45WRRRRRWWRk......", ".kTTkkk45ExWWWExWRk......", ".kTRRTkrWWWWk5WWWrk......", ".kRRTTRk66WWWWWrrk.......", "k7RTTRRTkk12GGgkk........", "k7TTRRTk22GGgGGGGk.......", ".kT7RTk4k23GgGcGkRk......", "..k7TTRkkGGGkGGGkk.......", "...kkkk..kFFk.kFFk.......", ".........kkkk.kkkk......,"],
    invPandaW1: [".........................", "........kk.....kk........", ".......kRWk...kWRk.......", ".......kRRkkkkkRRk.......", ".k....k44RRRRRRRRRk......", "krkk..k45WRRRRRWWRk......", ".kTTkkk45ExWWWExWRk......", ".kTRRTkrWWWWk5WWWrk......", ".kRRTTRk66WWWWWrrk.......", "k7RTTRRTkk12GGgkk........", "k7TTRRTk22GGgGGGGk.......", ".kT7RTk4k23GgGcGkRk......", "..k7TTRkkGGGkGGGkk.......", "...kkkk..kFFk.kkkk......,"],
    invPandaW3: [".........................", "........kk.....kk........", ".......kRWk...kWRk.......", ".......kRRkkkkkRRk.......", ".k....k44RRRRRRRRRk......", "krkk..k45WRRRRRWWRk......", ".kTTkkk45ExWWWExWRk......", ".kTRRTkrWWWWk5WWWrk......", ".kRRTTRk66WWWWWrrk.......", "k7RTTRRTkk12GGgkk........", "k7TTRRTk22GGgGGGGk.......", ".kT7RTk4k23GgGcGkRk......", "..k7TTRkkGGGkGGGkk.......", "...kkkk..kkkk.kFFk......,"],
    invReaper: ["....kHk.......kHk....", "...kHHk.......kHHk...", "...k3k.kkkkkkk.kHk...", "....k3kCCCCCCCkHk....", ".....k22CCCCCCCk.....", "....kCc4hhhhhhcCk....", "....kCcExhhhExcCk....", "....kCc4hhshhhcCk....", ".....kCk4hhhhkCk.....", "......kcCkhkCck......", ".k...kcCCCgCCCck.....", "kckkk12CCCCCCCCck....", "k5CCk12CCCCCCCCCk....", ".k6k12CCCCCCCCCCCk...", "..kkkk22CCCCCCCCCk...", "......kkCkCCkCCCk....", ".......k.kk.kkkk....,"],
    invReaperW1: [".....................", "....kHk.......kHk....", "...kHHk.......kHHk...", "...k3k.kkkkkkk.kHk...", "....k3kCCCCCCCkHk....", ".....k22CCCCCCCk.....", "....kCc4hhhhhhcCk....", "....kCcExhhhExcCk....", "....kCc4hhshhhcCk....", ".....kCk4hhhhkCk.....", "......kcCkhkCck......", ".k...kcCCCgCCCck.....", "kckkk12CCCCCCCCck....", "k5CCk12CCCCCCCCCk....", ".k6k12CCCCCCCCCCCk...", "..kkkk22CCCCCCCCCk...", "......kkCkCCkCCCk...,"],
    invReaperW3: [".....................", "....kHk.......kHk....", "...kHHk.......kHHk...", "...k3k.kkkkkkk.kHk...", "....k3kCCCCCCCkHk....", ".....k22CCCCCCCk.....", "....kCc4hhhhhhcCk....", "....kCcExhhhExcCk....", "....kCc4hhshhhcCk....", ".....kCk4hhhhkCk.....", "......kcCkhkCck......", ".k...kcCCCgCCCck.....", "kckkk12CCCCCCCCck....", "k5CCk12CCCCCCCCCk....", ".k6k12CCCCCCCCCCCk...", "..kkkk22CCCCCCCCCk...", "......kkCkCCkCCCk...,"],
    invShrew: [".......kk.....kk.......", "......kSpk...kpSk......", "......kSSkkkkkSSk......", ".....k44SSSSSSSSSk.....", ".....k44ExSSSExSSk.....", "......k11SsssSssk......", ".......kk11Psskk.......", ".k......kk2rrkk........", "kskk...k32rrrrbk.......", ".k5skkk4k33bbbkSk......", "..kk5sskkFFk.kFFk......", "....kkk.kkkk.kkkk.....,"],
    invShrewW1: [".......................", ".......kk.....kk.......", "......kSpk...kpSk......", "......kSSkkkkkSSk......", ".....k44SSSSSSSSSk.....", ".....k44ExSSSExSSk.....", "......k11SsssSssk......", ".......kk11Psskk.......", ".k......kk2rrkk........", "kskk...k32rrrrbk.......", ".k5skkk4k33bbbkSk......", "..kk5sskkFFk.kkkk.....,"],
    invShrewW3: [".......................", ".......kk.....kk.......", "......kSpk...kpSk......", "......kSSkkkkkSSk......", ".....k44SSSSSSSSSk.....", ".....k44ExSSSExSSk.....", "......k11SsssSssk......", ".......kk11Psskk.......", ".k......kk2rrkk........", "kskk...k32rrrrbk.......", ".k5skkk4k33bbbkSk......", "..kk5sskkkkk.kFFk.....,"],
    invShrewB: [".......kk.....kk.......", "......kSpk...kpSk......", "......kSSkkkkkSSk......", ".....k44SSSSSpSSSk.....", ".....k44ExSSpExSSk.....", "......k11SsssSssk......", ".......kk11Psskk.......", ".k......kk2rrkk........", "kskk...k32rrrrbk.......", ".k5skkk4k33bbbkSk......", "..kk5sskkFFk.kFFk......", "....kkk.kkkk.kkkk.....,"],
    invShrewBW1: [".......................", ".......kk.....kk.......", "......kSpk...kpSk......", "......kSSkkkkkSSk......", ".....k44SSSSSpSSSk.....", ".....k44ExSSpExSSk.....", "......k11SsssSssk......", ".......kk11Psskk.......", ".k......kk2rrkk........", "kskk...k32rrrrbk.......", ".k5skkk4k33bbbkSk......", "..kk5sskkFFk.kkkk.....,"],
    invShrewBW3: [".......................", ".......kk.....kk.......", "......kSpk...kpSk......", "......kSSkkkkkSSk......", ".....k44SSSSSpSSSk.....", ".....k44ExSSpExSSk.....", "......k11SsssSssk......", ".......kk11Psskk.......", ".k......kk2rrkk........", "kskk...k32rrrrbk.......", ".k5skkk4k33bbbkSk......", "..kk5sskkkkk.kFFk.....,"],
    invWeasel: ["........kk.....kk........", ".......kFfk...kfFk.......", ".......kFFkkkkkFFk.......", "......k33FFFFFFFFFk......", "......k3dddFFFFFdFk......", "......k3dddFFFExFFk......", ".kk...kFFdWWk4WWFFk......", "kddk...k34WWWWWWFk.......", "kddFk...kk11rrrkk........", ".k5FFkkk22CCgCCCCk.......", "..k5FFk3k22CgCCCkFk......", "...k5FFkk22CgCCCkk.......", "....kkkkkkFFk.kFFk.......", ".........kkkk.kkkk......,"],
    invWeaselW1: [".........................", "........kk.....kk........", ".......kFfk...kfFk.......", ".......kFFkkkkkFFk.......", "......k33FFFFFFFFFk......", "......k3dddFFFFFdFk......", "......k3dddFFFExFFk......", ".kk...kFFdWWk4WWFFk......", "kddk...k34WWWWWWFk.......", "kddFk...kk11rrrkk........", ".k5FFkkk22CCgCCCCk.......", "..k5FFk3k22CgCCCkFk......", "...k5FFkk22CgCCCkk.......", "....kkkkkkFFk.kkkk......,"],
    invWeaselW3: [".........................", "........kk.....kk........", ".......kFfk...kfFk.......", ".......kFFkkkkkFFk.......", "......k33FFFFFFFFFk......", "......k3dddFFFFFdFk......", "......k3dddFFFExFFk......", ".kk...kFFdWWk4WWFFk......", "kddk...k34WWWWWWFk.......", "kddFk...kk11rrrkk........", ".k5FFkkk22CCgCCCCk.......", "..k5FFk3k22CgCCCkFk......", "...k5FFkk22CgCCCkk.......", "....kkkkkkkkk.kFFk......,"],
  });
  Object.assign(PAL, {
    hKnight: {"k": "#0b0a0e", "R": "#c03116", "r": "#7a1e10", "M": "#ecd4af", "m": "#c8ad94", "D": "#a29378", "h": "#895042", "S": "#f3dbb6", "s": "#c0723e", "v": "#2a2030", "F": "#3a2a26", "1": "#771d0e", "2": "#7c6961", "3": "#928073", "4": "#64594e", "5": "#968577", "6": "#4b120a", "7": "#54302b"},
    hRanger: {"k": "#0b0a0e", "o": "#c0723e", "O": "#d68b59", "p": "#f3cf9f", "w": "#e0dce6", "B": "#9ca973", "b": "#6e7a4a", "e": "#2a1810", "N": "#f08aa0", "C": "#5a3426", "c": "#895042", "x": "#2a1810", "Y": "#c9a24a", "F": "#2a1e1e", "R": "#c03116", "1": "#771d0e", "2": "#371f18", "3": "#1a0e0a", "4": "#895042", "5": "#444a30", "6": "#b16f46", "q": "#ecbb7e", "9": "#491109", "H": "#5e9058", "g": "#3a5e38", "n": "#ecc888", "P": "#eb90bf", "G": "#4a7a46", "L": "#f3b86d", "D": "#af602b", "m": "#fee1a1", "i": "#e67346", "z": "#c0723e"},
    hMage: {"k": "#0b0a0e", "P": "#a25c86", "p": "#6e3a5e", "L": "#c886b0", "o": "#eca359", "O": "#c0723e", "W": "#f3dbb6", "e": "#f8f4ee", "n": "#3a2030", "Y": "#e8c060", "F": "#2a1e2a", "1": "#44233d", "2": "#643758", "3": "#968577", "4": "#92633a", "5": "#7c5173", "6": "#8f743f", "7": "#955733", "8": "#92633a", "9": "#774528", "U": "#4a86d8"},
    hPriest: {"k": "#0b0a0e", "H": "#f6f4f0", "h": "#c8c6d0", "q": "#eca359", "S": "#ecbb7e", "s": "#c0723e", "v": "#2a2030", "n": "#e8968a", "X": "#c0723e", "F": "#5a4434", "1": "#98949d", "2": "#7c7888", "3": "#774528", "4": "#927152", "5": "#98949d", "E": "#c0303a"},
    hGunner: {"k": "#0b0a0e", "H": "#2a2a30", "r": "#70707a", "L": "#16161a", "q": "#b39a78", "G": "#f3dbb6", "g": "#c8ad94", "d": "#a29378", "W": "#fae1ca", "e": "#f8f4ee", "n": "#26262e", "C": "#44444e", "c": "#62626e", "x": "#26262e", "S": "#9a9aa4", "B": "#c8b890", "F": "#1c1c22", "1": "#5f5d6b", "2": "#3c3b48", "3": "#2a2933", "4": "#968577", "5": "#7c6961", "6": "#1a191f", "7": "#454450", "8": "#6e5d4e", "9": "#7e7063", "A": "#c3aba7", "D": "#7c6961", "E": "#64594e", "Q": "#4a4848", "V": "#cbc0a9", "Z": "#fefefe", "X": "#434343", "U": "#eee6dc", "N": "#6f6c66"},
    invPanda: {"k": "#0b0a0e", "R": "#c0582a", "r": "#8a3a1c", "W": "#f0e6d8", "T": "#e8b070", "g": "#c9a24a", "G": "#3e6a2e", "c": "#2e5022", "F": "#2a1a14", "E": "#2a1414", "x": "#ff3b2c", "1": "#7c6230", "2": "#26401e", "3": "#1c3016", "4": "#77351b", "5": "#bbafb2", "6": "#6b2c17", "7": "#77351b"},
    invReaper: {"k": "#08070a", "C": "#2a2532", "c": "#433c4e", "h": "#5e566c", "H": "#a49c88", "s": "#1c1a22", "g": "#8a8094", "F": "#14121a", "E": "#1a1022", "x": "#c070ff", "1": "#292433", "2": "#1a1620", "3": "#655e59", "4": "#494159", "5": "#292433", "6": "#040406"},
    invShrew: {"k": "#0e0c0a", "S": "#7a6a5c", "s": "#b8a898", "p": "#d87a8a", "P": "#d87a8a", "b": "#5a3c22", "r": "#a3222a", "F": "#3a2a20", "E": "#2a1414", "x": "#ff3b2c", "1": "#726663", "2": "#65141b", "3": "#372416", "4": "#4b403c", "5": "#726663"},
    invShrewB: {"k": "#0e0c0a", "S": "#4e4038", "s": "#8a7a6a", "p": "#d87a8a", "P": "#d87a8a", "b": "#5a3c22", "r": "#3e6a2e", "F": "#3a2a20", "E": "#2a1414", "x": "#ff3b2c", "1": "#554a45", "2": "#26401e", "3": "#372416", "4": "#302624", "5": "#554a45"},
    invWeasel: {"k": "#0b0a0c", "F": "#8a5a30", "f": "#d8a070", "W": "#e8d8b8", "d": "#1e1a18", "r": "#a3222a", "C": "#3a3440", "g": "#c9a24a", "E": "#2a1414", "x": "#ff3b2c", "1": "#65141b", "2": "#231f2a", "3": "#55361f", "4": "#b4a598", "5": "#55361f"},
  });
  for (const k of ['hKnight', 'hRanger', 'hMage', 'hPriest', 'hGunner']) PAL[k + 'Ghost'] = ghostOf(PAL[k]); // 잔상·숨기 (푸른 단계)
  const rampOf = (pal, ramp, eye) => { const o = {}; for (const k in pal) { const h = pal[k], L = (0.3 * parseInt(h.slice(1, 3), 16) + 0.59 * parseInt(h.slice(3, 5), 16) + 0.11 * parseInt(h.slice(5, 7), 16)) / 255; o[k] = ramp[Math.min(ramp.length - 1, Math.floor(L * ramp.length * 1.4))]; } if (eye) for (const k of eye) if (o[k]) o[k] = '#ffffff'; return o; };
  PAL.hRangerShadow = rampOf(PAL.hRanger, ['#120818', '#2a1238', '#3d1d52', '#6b3d8a', '#8a5aa8'], ['e']); // 그림자 습격 잔상 (보랏빛)
  PAL.invReaperEcho = rampOf(PAL.invReaper, ['#2a0f3a', '#5a2280', '#7a34a6', '#a35fd0', '#d9a8ff'], ['x']); // 흑각 메아리
  // v2.44 3장 오크 9종 + 1·2·4장 엘리트·준엘리트 8종 새 정면 도트 (파티와 같은 비율 · 왼쪽 음영) — 걷기 2·4프레임(W1·W3)
  Object.assign(MAPS, {
    nOrc: [".......k.......", "......kHk......", ".....k1HHk.....", "...kk2HHHlkk...", "..k22lllllllk..", "klkk22lllllkklk", ".k22EelllEellk.", "..k2lTkkkTllk..", "...kk3llldkk...", "..kbbk2llkbbk..", ".kllkk3ldkkllk.", ".kllk4BwBBkllk.", ".kddk5bbbbkddk.", "...kFFk.kFFk...", "...kkkk.kkkk..,"],
    nOrcW1: ["...............", ".......k.......", "......kHk......", ".....k1HHk.....", "...kk2HHHlkk...", "..k22lllllllk..", "klkk22lllllkklk", ".k22EelllEellk.", "..k2lTkkkTllk..", "...kk3llldkk...", "..kbbk2llkbbk..", ".kllkk3ldkkllk.", ".kllk4BwBBkllk.", ".kddk5bbbbkddk.", "...kFFk.kkkk..,"],
    nOrcW3: ["...............", ".......k.......", "......kHk......", ".....k1HHk.....", "...kk2HHHlkk...", "..k22lllllllk..", "klkk22lllllkklk", ".k22EelllEellk.", "..k2lTkkkTllk..", "...kk3llldkk...", "..kbbk2llkbbk..", ".kllkk3ldkkllk.", ".kllk4BwBBkllk.", ".kddk5bbbbkddk.", "...kkkk.kFFk..,"],
    nOthrow: ["............k..", "...........kw..", "....kkkkkkkwk..", "...k11lllllk...", "..k11lllllllk..", "klk22rrrrrrrklk", ".kkwEelllEewlk.", ".k3llTkkkTllk..", "ko.kk4llldkk...", "k.k55blllbbbk..", ".klk55blbbbklk.", ".klk66BOBBBklk.", ".kdk77OOOOOkdk.", "...kFFk.kFFk...", "...kkkk.kkkk..,"],
    nOthrowW1: ["...............", "............k..", "...........kw..", "....kkkkkkkwk..", "...k11lllllk...", "..k11lllllllk..", "klk22rrrrrrrklk", ".kkwEelllEewlk.", ".k3llTkkkTllk..", "ko.kk4llldkk...", "k.k55blllbbbk..", ".klk55blbbbklk.", ".klk66BOBBBklk.", ".kdk77OOOOOkdk.", "...kFFk.kkkk..,"],
    nOthrowW3: ["...............", "............k..", "...........kw..", "....kkkkkkkwk..", "...k11lllllk...", "..k11lllllllk..", "klk22rrrrrrrklk", ".kkwEelllEewlk.", ".k3llTkkkTllk..", "ko.kk4llldkk...", "k.k55blllbbbk..", ".klk55blbbbklk.", ".klk66BOBBBklk.", ".kdk77OOOOOkdk.", "...kkkk.kFFk..,"],
    nShaman: ["..k....k....k..", ".kwk.kkkkk.kwk.", ".kwwkwwwwwkwwk.", "..kwwwkwkwwwk..", "..kWWWWWWWWWk..", "klk11EelEellklk", ".k11wlllllwllk.", "..k11lldllllk..", "...kwwwwwwwk...", ".kWWWk1llkWWWk.", ".kWWlk2bbk1WWk.", ".kWWlk2bbk1WWk.", ".kWWdkWWWk3WWk.", "...kFFk.kFFk...", "...kkkk.kkkk..,"],
    nShamanW1: ["...............", "..k....k....k..", ".kwk.kkkkk.kwk.", ".kwwkwwwwwkwwk.", "..kwwwkwkwwwk..", "..kWWWWWWWWWk..", "klk11EelEellklk", ".k11wlllllwllk.", "..k11lldllllk..", "...kwwwwwwwk...", ".kWWWk1llkWWWk.", ".kWWlk2bbk1WWk.", ".kWWlk2bbk1WWk.", ".kWWdkWWWk3WWk.", "...kFFk.kkkk..,"],
    nShamanW3: ["...............", "..k....k....k..", ".kwk.kkkkk.kwk.", ".kwwkwwwwwkwwk.", "..kwwwkwkwwwk..", "..kWWWWWWWWWk..", "klk11EelEellklk", ".k11wlllllwllk.", "..k11lldllllk..", "...kwwwwwwwk...", ".kWWWk1llkWWWk.", ".kWWlk2bbk1WWk.", ".kWWlk2bbk1WWk.", ".kWWdkWWWk3WWk.", "...kkkk.kFFk..,"],
    nOcharge: [".n...........n.", ".wk.........kw.", ".wwkkkknkkkkww.", "..k11mmnmmmmk..", ".k22MMMMMMMMMk.", "klk33EelEellklk", ".k33lllllllllk.", "..k3lTkkkTllk..", "...kk4llldkk...", "kmmk11mmmmmkmmk", "kmmk22MyMMMkmmk", ".klk55BRBBBklk.", ".kdk66RRRRRkdk.", "...kFFk.kFFk...", "...kkkk.kkkk..,"],
    nOchargeW1: ["...............", ".n...........n.", ".wk.........kw.", ".wwkkkknkkkkww.", "..k11mmnmmmmk..", ".k22MMMMMMMMMk.", "klk33EelEellklk", ".k33lllllllllk.", "..k3lTkkkTllk..", "...kk4llldkk...", "kmmk11mmmmmkmmk", "kmmk22MyMMMkmmk", ".klk55BRBBBklk.", ".kdk66RRRRRkdk.", "...kFFk.kkkk..,"],
    nOchargeW3: ["...............", ".n...........n.", ".wk.........kw.", ".wwkkkknkkkkww.", "..k11mmnmmmmk..", ".k22MMMMMMMMMk.", "klk33EelEellklk", ".k33lllllllllk.", "..k3lTkkkTllk..", "...kk4llldkk...", "kmmk11mmmmmkmmk", "kmmk22MyMMMkmmk", ".klk55BRBBBklk.", ".kdk66RRRRRkdk.", "...kkkk.kFFk..,"],
    nOdrum: ["...............", "....kkkkkkk....", "...k11HHHHHk...", "..k22lllllllk..", ".k22lllllllllk.", "kHk2EelllEelkHk", "k12llllllllllHk", "kHk2lTkkkTllkHk", "kykk32lllldkkyk", ".kk22lllllllkk.", "klk42llllllhklk", "klk22lldllllklk", "kdkkWWWWWWWkkdk", "...kFFk.kFFk...", "...kkkk.kkkk..,"],
    nOdrumW1: ["...............", "...............", "....kkkkkkk....", "...k11HHHHHk...", "..k22lllllllk..", ".k22lllllllllk.", "kHk2EelllEelkHk", "k12llllllllllHk", "kHk2lTkkkTllkHk", "kykk32lllldkkyk", ".kk22lllllllkk.", "klk42llllllhklk", "klk22lldllllklk", "kdkkWWWWWWWkkdk", "...kFFk.kkkk..,"],
    nOdrumW3: ["...............", "...............", "....kkkkkkk....", "...k11HHHHHk...", "..k22lllllllk..", ".k22lllllllllk.", "kHk2EelllEelkHk", "k12llllllllllHk", "kHk2lTkkkTllkHk", "kykk32lllldkkyk", ".kk22lllllllkk.", "klk42llllllhklk", "klk22lldllllklk", "kdkkWWWWWWWkkdk", "...kkkk.kFFk..,"],
    nOgrip: ["...............", "....kkkkkkk....", "...k11lllllk...", "..k11lllllllk..", ".k11rllllllllk.", "klk12EelEellklk", ".k11lrlllllllk.", "..k1lTkkkTllk..", "..k34mMmMmMmk..", "kllk11lllllkllk", "k1llk5ldldk1llk", "kMMk15llldlkMMk", "kddk66BBBBBkddk", "...kFFk.kFFk...", "...kkkk.kkkk..,"],
    nOgripW1: ["...............", "...............", "....kkkkkkk....", "...k11lllllk...", "..k11lllllllk..", ".k11rllllllllk.", "klk12EelEellklk", ".k11lrlllllllk.", "..k1lTkkkTllk..", "..k34mMmMmMmk..", "kllk11lllllkllk", "k1llk5ldldk1llk", "kMMk15llldlkMMk", "kddk66BBBBBkddk", "...kFFk.kkkk..,"],
    nOgripW3: ["...............", "...............", "....kkkkkkk....", "...k11lllllk...", "..k11lllllllk..", ".k11rllllllllk.", "klk12EelEellklk", ".k11lrlllllllk.", "..k1lTkkkTllk..", "..k34mMmMmMmk..", "kllk11lllllkllk", "k1llk5ldldk1llk", "kMMk15llldlkMMk", "kddk66BBBBBkddk", "...kkkk.kFFk..,"],
    nOtroll: [".......k.......", "......kHk......", ".....k1HHk.....", "...kk2HHHlkk...", "..k22lllllllk..", ".kkk22lllllkkk.", ".k22EelllEellk.", "..kkTkkkkkTkk..", "...kk3llldkk...", "..kk22lllllkk..", ".kllkk2dlkkllk.", ".kllkWWWWWkllk.", ".kllkWWWWWkllk.", ".kllkFFkFFkllk.", ".kTTkkkkkkkTTk,"],
    nOtrollW1: ["...............", ".......k.......", "......kHk......", ".....k1HHk.....", "...kk2HHHlkk...", "..k22lllllllk..", ".kkk22lllllkkk.", ".k22EelllEellk.", "..kkTkkkkkTkk..", "...kk3llldkk...", "..kk22lllllkk..", ".kllkk2dlkkllk.", ".kllkWWWWWkllk.", ".kllkWWWWWkllk.", ".kllkFFkkkkllk,"],
    nOtrollW3: ["...............", ".......k.......", "......kHk......", ".....k1HHk.....", "...kk2HHHlkk...", "..k22lllllllk..", ".kkk22lllllkkk.", ".k22EelllEellk.", "..kkTkkkkkTkk..", "...kk3llldkk...", "..kk22lllllkk..", ".kllkk2dlkkllk.", ".kllkWWWWWkllk.", ".kllkWWWWWkllk.", ".kllkkkkFFkllk,"],
    nUrg: ["......kHk......", ".....kyHyk.....", "....kk1HHkk....", "...k22lllllk...", "..k22lllllllk..", "klk22EelEellklk", ".k23lllllllrlk.", "..k2lTkkkTllk..", ".kwkk4llldkkwk.", "kwwwkTwwwTkwwwk", "kwlk22llrdlklwk", ".klk55yyyBBklk.", ".kdk33rrrrrkdk.", "...kFFk.kFFk...", "...kkkk.kkkk..,"],
    nUrgW1: ["...............", "......kHk......", ".....kyHyk.....", "....kk1HHkk....", "...k22lllllk...", "..k22lllllllk..", "klk22EelEellklk", ".k23lllllllrlk.", "..k2lTkkkTllk..", ".kwkk4llldkkwk.", "kwwwkTwwwTkwwwk", "kwlk22llrdlklwk", ".klk55yyyBBklk.", ".kdk33rrrrrkdk.", "...kFFk.kkkk..,"],
    nUrgW3: ["...............", "......kHk......", ".....kyHyk.....", "....kk1HHkk....", "...k22lllllk...", "..k22lllllllk..", "klk22EelEellklk", ".k23lllllllrlk.", "..k2lTkkkTllk..", ".kwkk4llldkkwk.", "kwwwkTwwwTkwwwk", "kwlk22llrdlklwk", ".klk55yyyBBklk.", ".kdk33rrrrrkdk.", "...kkkk.kFFk..,"],
    nTroll: ["......kkk......", ".....k1HHk.....", "....kk1HHkk....", "...kk2HHHlkk...", "..k22lllllllk..", ".kkk22lllllkkk.", ".k22EelllEellk.", "..kkTkkkkkTkk..", "...kk3llldkk...", "..kk22lllllkk..", ".kllkk2dlkkllk.", ".kllkWWWWWkllk.", ".kMmkWWWWWkmMk.", ".kllkFFkFFkllk.", ".kTTkkkkkkkTTk,"],
    nTrollW1: ["...............", "......kkk......", ".....k1HHk.....", "....kk1HHkk....", "...kk2HHHlkk...", "..k22lllllllk..", ".kkk22lllllkkk.", ".k22EelllEellk.", "..kkTkkkkkTkk..", "...kk3llldkk...", "..kk22lllllkk..", ".kllkk2dlkkllk.", ".kllkWWWWWkllk.", ".kMmkWWWWWkmMk.", ".kllkFFkkkkllk,"],
    nTrollW3: ["...............", "......kkk......", ".....k1HHk.....", "....kk1HHkk....", "...kk2HHHlkk...", "..k22lllllllk..", ".kkk22lllllkkk.", ".k22EelllEellk.", "..kkTkkkkkTkk..", "...kk3llldkk...", "..kk22lllllkk..", ".kllkk2dlkkllk.", ".kllkWWWWWkllk.", ".kMmkWWWWWkmMk.", ".kllkkkkFFkllk,"],
    nBrute: [".......kkkkkkk.......", "k.....k11sssrsk.....k", "hkkk.k11ssssrssk.kkkh", "1sskk.k11ssssrk.kk1ss", "kk11ssssssssssssssskk", "..kkk11EesssEesskkk..", ".....ksTkkkkkTsk.....", "......kk1sssskk......", ".....kk11ssssskk.....", "....ksskk1Sskkssk....", "....kssk2cbcckssk....", "....kSSk3CCCCkSSk....", "......kssk.kssk......", "......kkkk.kkkk.....,"],
    nBruteW1: [".....................", ".......kkkkkkk.......", "k.....k11sssrsk.....k", "hkkk.k11ssssrssk.kkkh", "1sskk.k11ssssrk.kk1ss", "kk11ssssssssssssssskk", "..kkk11EesssEesskkk..", ".....ksTkkkkkTsk.....", "......kk1sssskk......", ".....kk11ssssskk.....", "....ksskk1Sskkssk....", "....kssk2cbcckssk....", "....kSSk3CCCCkSSk....", "......kssk.kssk.....,"],
    nBruteW3: [".....................", ".......kkkkkkk.......", "k.....k11sssrsk.....k", "hkkk.k11ssssrssk.kkkh", "1sskk.k11ssssrk.kk1ss", "kk11ssssssssssssssskk", "..kkk11EesssEesskkk..", ".....ksTkkkkkTsk.....", "......kk1sssskk......", ".....kk11ssssskk.....", "....ksskk1Sskkssk....", "....kssk2cbcckssk....", "....kSSk3CCCCkSSk....", "......kssk.kssk.....,"],
    nBoar: ["....kbk.kbk.kbkbk...", "...kbbkkbbkkbbkbbk..", "..kbBbkbBbkbBbkBbk..", ".k1BBb1BBb1BBbBbkk..", ".k11ddddddddddddddk.", "k111dddddddddddEeddk", "1111dddddddddddddddk", "D111dddddddddddddLLp", "k111ddddddddddddLLLL", ".k11ddddddddddddddTT", ".k21dDddddDdddDddkkT", "..kDDkDkkkkDDkDkk..k", "..khhkhk..khhkhk....", "...kk.k....kk.k....."], // v2.93 다리 두껍·얇·두껍·얇(원근감) · 등가시 4개(끝이 머리 쪽)
    nBoarW1: ["....kbk.kbk.kbkbk...", "...kbbkkbbkkbbkbbk..", "..kbBbkbBbkbBbkBbk..", ".k1BBb1BBb1BBbBbkk..", ".k11ddddddddddddddk.", "k111dddddddddddEeddk", "1111dddddddddddddddk", "D111dddddddddddddLLp", "k111ddddddddddddLLLL", ".k11ddddddddddddddTT", ".k21dDddddDdddDddkkT", "..khhkDkkkkDDkhkk..k", "...kkkhk..khhkk.....", "......k....kk......."],
    nBoarW3: ["....kbk.kbk.kbkbk...", "...kbbkkbbkkbbkbbk..", "..kbBbkbBbkbBbkBbk..", ".k1BBb1BBb1BBbBbkk..", ".k11ddddddddddddddk.", "k111dddddddddddEeddk", "1111dddddddddddddddk", "D111dddddddddddddLLp", "k111ddddddddddddLLLL", ".k11ddddddddddddddTT", ".k21dDddddDdddDddkkT", "..kDDkhkkkkhhkDkk..k", "..khhkk....kkkhk....", "...kk.........k....."],
    nExec: ["....kkkkkkk....", "...k11HHHHHk...", "..k11HHHHHHHk..", "..k11HHHHHHHk..", ".k11hhhhhhhHHk.", ".k11hehhhheHHk.", ".k11HHHHHHHHHk.", ".k11HHHHHHHHHk.", ".kHk22ssssskHk.", ".kHk32ssssSkHk.", ".ksskk3SSkkssk.", ".kssk4bmbbkssk.", ".kSSk5aarakSSk.", "...kBBk.kBBk...", "...kFFk.kFFk...", "...kkkk.kkkk..,"],
    nExecW1: ["...............", "....kkkkkkk....", "...k11HHHHHk...", "..k11HHHHHHHk..", "..k11HHHHHHHk..", ".k11hhhhhhhHHk.", ".k11hehhhheHHk.", ".k11HHHHHHHHHk.", ".k11HHHHHHHHHk.", ".kHk22ssssskHk.", ".kHk32ssssSkHk.", ".ksskk3SSkkssk.", ".kssk4bmbbkssk.", ".kSSk5aarakSSk.", "...kBBk.kBBk...", "...kFFk.kkkk..,"],
    nExecW3: ["...............", "....kkkkkkk....", "...k11HHHHHk...", "..k11HHHHHHHk..", "..k11HHHHHHHk..", ".k11hhhhhhhHHk.", ".k11hehhhheHHk.", ".k11HHHHHHHHHk.", ".k11HHHHHHHHHk.", ".kHk22ssssskHk.", ".kHk32ssssSkHk.", ".ksskk3SSkkssk.", ".kssk4bmbbkssk.", ".kSSk5aarakSSk.", "...kBBk.kBBk...", "...kkkk.kFFk..,"],
    nMother: ["....kkkkkkk....", "...k11HHHHHk...", "..k11HHHHHHHk..", ".k11sssssssHHk.", ".k12ssssssssHk.", ".k12EesssEesHk.", ".k12sbmmmbssHk.", ".k11sssssssHHk.", ".kHHkk2sskkHHk.", ".kHk33rrrrrkHk.", "kSSk34VvVVrkSSk", "kSSk45vbvvVkSSk", ".ksk34VVVVrksk.", "..k66RRRRRRRk..", "..kRkRkRkRkRk..", "..kk.k.k.k.kk.,"],
    nMotherW1: ["...............", "....kkkkkkk....", "...k11HHHHHk...", "..k11HHHHHHHk..", ".k11sssssssHHk.", ".k12ssssssssHk.", ".k12EesssEesHk.", ".k12sbmmmbssHk.", ".k11sssssssHHk.", ".kHHkk2sskkHHk.", ".kHk33rrrrrkHk.", "kSSk34VvVVrkSSk", "kSSk45vbvvVkSSk", ".ksk34VVVVrksk.", "..k66RRRRRRRk..", "..kRkRkRkRkRk.,"],
    nMotherW3: ["...............", "....kkkkkkk....", "...k11HHHHHk...", "..k11HHHHHHHk..", ".k11sssssssHHk.", ".k12ssssssssHk.", ".k12EesssEesHk.", ".k12sbmmmbssHk.", ".k11sssssssHHk.", ".kHHkk2sskkHHk.", ".kHk33rrrrrkHk.", "kSSk34VvVVrkSSk", "kSSk45vbvvVkSSk", ".ksk34VVVVrksk.", "..k66RRRRRRRk..", "..kRkRkRkRkRk.,"],
    nCoffin: ["....kkkkkkk....", "...k11aaaaak...", "..k11aaaaaaak..", ".k11acccccaaak.", ".k11cccccccaak.", ".k11cceccecaak.", ".k11cccccccaak.", ".k11acccccaaak.", "..k11aaaaaaak..", ".kAak1aaaakgAk.", ".kaak11aaggaak.", ".kaak1aggakaak.", ".kAAk2gaaakAAk.", "..k11aaaaaaak..", "..kAkAkAkAkAk..", "..kk.k.k.k.kk.,"],
    nCoffinW1: ["...............", "....kkkkkkk....", "...k11aaaaak...", "..k11aaaaaaak..", ".k11acccccaaak.", ".k11cccccccaak.", ".k11cceccecaak.", ".k11cccccccaak.", ".k11acccccaaak.", "..k11aaaaaaak..", ".kAak1aaaakgAk.", ".kaak11aaggaak.", ".kaak1aggakaak.", ".kAAk2gaaakAAk.", "..k11aaaaaaak..", "..kAkAkAkAkAk.,"],
    nCoffinW3: ["...............", "....kkkkkkk....", "...k11aaaaak...", "..k11aaaaaaak..", ".k11acccccaaak.", ".k11cccccccaak.", ".k11cceccecaak.", ".k11cccccccaak.", ".k11acccccaaak.", "..k11aaaaaaak..", ".kAak1aaaakgAk.", ".kaak11aaggaak.", ".kaak1aggakaak.", ".kAAk2gaaakAAk.", "..k11aaaaaaak..", "..kAkAkAkAkAk.,"],
    nHerald: ["......kkk......", ".....k1Rrk.....", "....kk1Rrkk....", "...k22aaaaak...", "..k22aaaaaaak..", "..k33deddeddk..", "..k22aaaaaaak..", "..k22aaaaaaak..", "...kk2aaaakk...", "..kaak1rrkaak..", ".kaak1rgrrkaak.", ".kaak1grgrkaak.", ".kAAk1rgrrkAAk.", "...kddk.kddk...", "...kFFk.kFFk...", "...kkkk.kkkk..,"],
    nHeraldW1: ["...............", "......kkk......", ".....k1Rrk.....", "....kk1Rrkk....", "...k22aaaaak...", "..k22aaaaaaak..", "..k33deddeddk..", "..k22aaaaaaak..", "..k22aaaaaaak..", "...kk2aaaakk...", "..kaak1rrkaak..", ".kaak1rgrrkaak.", ".kaak1grgrkaak.", ".kAAk1rgrrkAAk.", "...kddk.kddk...", "...kFFk.kkkk..,"],
    nHeraldW3: ["...............", "......kkk......", ".....k1Rrk.....", "....kk1Rrkk....", "...k22aaaaak...", "..k22aaaaaaak..", "..k33deddeddk..", "..k22aaaaaaak..", "..k22aaaaaaak..", "...kk2aaaakk...", "..kaak1rrkaak..", ".kaak1rgrrkaak.", ".kaak1grgrkaak.", ".kAAk1rgrrkAAk.", "...kddk.kddk...", "...kkkk.kFFk..,"],
    nMordred: ["........kykyyykyk........", "........k11gggggk........", ".......k22PPPPPPPk.......", "......k22PPPPPPPPPk......", "......k22PPPPPPPPPk......", "......k33QeQQQQeQQk......", "......k22PPPPPPPPPk......", "......k22pPpPpPpPPk......", "....k..kk22PPPPPkk.......", "...krkWWk22PPPPPkWWk.....", ".kk4rrkPk22gggPPkPk......", "k4RrrRkPk22PgPPPkPk......", "k4RrrRkpk55qqqqqkpk......", "krRkrRk.kppk.kppk........", "krk.kRk.kQQk.kQQk........", ".k...k..kkkk.kkkk.......,"],
    nMordredW1: [".........................", "........kykyyykyk........", "........k11gggggk........", ".......k22PPPPPPPk.......", "......k22PPPPPPPPPk......", "......k22PPPPPPPPPk......", "......k33QeQQQQeQQk......", "......k22PPPPPPPPPk......", "......k22pPpPpPpPPk......", "....k..kk22PPPPPkk.......", "...krkWWk22PPPPPkWWk.....", ".kk4rrkPk22gggPPkPk......", "k4RrrRkPk22PgPPPkPk......", "k4RrrRkpk55qqqqqkpk......", "krRkrRk.kppk.kppk........", "krk.kRk.kQQk.kQQk.......,"],
    nMordredW3: [".........................", "........kykyyykyk........", "........k11gggggk........", ".......k22PPPPPPPk.......", "......k22PPPPPPPPPk......", "......k22PPPPPPPPPk......", "......k33QeQQQQeQQk......", "......k22PPPPPPPPPk......", "......k22pPpPpPpPPk......", "....k..kk22PPPPPkk.......", "...krkWWk22PPPPPkWWk.....", ".kk4rrkPk22gggPPkPk......", "k4RrrRkPk22PgPPPkPk......", "k4RrrRkpk55qqqqqkpk......", "krRkrRk.kppk.kppk........", "krk.kRk.kQQk.kQQk.......,"],
    nQueen: ["...kykyyykyk...", "...k11gggggk...", "..k22VVVVVVVk..", ".k23vvvvvvvvVk.", ".k23sssssssvVk.", ".k23EesssEevVk.", ".k23esssssevVk.", ".k22evSSSvvVVk.", ".k22vvxgxvvVVk.", "..k23vvvvvvVk..", "..k33vvvvvvvk..", ".k33vvvvvvvvvk.", ".k33VvvVvvVvvk.", "k33VvvVvVvvVvvk", "k22VVVVVVVVVVVk", "kkkkkkkkkkkkkk,"],
    nQueenW1: ["...............", "...kykyyykyk...", "...k11gggggk...", "..k22VVVVVVVk..", ".k23vvvvvvvvVk.", ".k23sssssssvVk.", ".k23EesssEevVk.", ".k23esssssevVk.", ".k22evSSSvvVVk.", ".k22vvxgxvvVVk.", "..k23vvvvvvVk..", "..k33vvvvvvvk..", ".k33vvvvvvvvvk.", ".k33VvvVvvVvvk.", "k33VvvVvVvvVvvk", "k22VVVVVVVVVVV,"],
    nQueenW3: ["...............", "...kykyyykyk...", "...k11gggggk...", "..k22VVVVVVVk..", ".k23vvvvvvvvVk.", ".k23sssssssvVk.", ".k23EesssEevVk.", ".k23esssssevVk.", ".k22evSSSvvVVk.", ".k22vvxgxvvVVk.", "..k23vvvvvvVk..", "..k33vvvvvvvk..", ".k33vvvvvvvvvk.", ".k33VvvVvvVvvk.", "k33VvvVvVvvVvvk", "k22VVVVVVVVVVV,"],
    nDog: ["...........kdk.kdk..", "...........kddkddk..", "...........klllllk..", "k..........klmlmlk..", "dk........kl1dEeddkk", "dk..kkkkkkk21dddLLLD", "kdkk33rrrrdmddddLLLL", ".kk13rRrrrdmdddddttk", ".k11ggggggdmdkdkkkk.", "..k11dddddddk.k.....", "..k41DdddDdDk.......", "..kDkDkkkDkDk.......", "..kDkDk.kDkDk.......", "...k.k...k.k.......,"],
    nGuard: ["......kkk......", ".....k1GGk.....", "...kkk2aakkk...", "..k22aaaaaaak..", "..k22aaaaaaak..", "..k33DeDDeDDk..", "..k22aaaaaaak..", "..kAk2aaaakAk..", "...kk4mmmmkk...", "k2aak5dgddk2aak", "kAak55dGdddkaAk", ".kak55dgdddkak.", ".kak33DgDDDkak.", "...kddk.kddk...", "...kDDk.kDDk...", "...kkkk.kkkk..,"],
    nGuardW1: ["...............", "......kkk......", ".....k1GGk.....", "...kkk2aakkk...", "..k22aaaaaaak..", "..k22aaaaaaak..", "..k33DeDDeDDk..", "..k22aaaaaaak..", "..kAk2aaaakAk..", "...kk4mmmmkk...", "k2aak5dgddk2aak", "kAak55dGdddkaAk", ".kak55dgdddkak.", ".kak33DgDDDkak.", "...kddk.kddk...", "...kDDk.kDDk..,"],
    nGuardW3: ["...............", "......kkk......", ".....k1GGk.....", "...kkk2aakkk...", "..k22aaaaaaak..", "..k22aaaaaaak..", "..k33DeDDeDDk..", "..k22aaaaaaak..", "..kAk2aaaakAk..", "...kk4mmmmkk...", "k2aak5dgddk2aak", "kAak55dGdddkaAk", ".kak55dgdddkak.", ".kak33DgDDDkak.", "...kddk.kddk...", "...kDDk.kDDk..,"],
    nGuardShield: [".kkkkkk.", "kaaaaaak", "kaGGGGak", "kaaGGaak", "kaaGGaak", "kaaGGaak", "kAaaaaAk", ".kAaaAk.", "..kAAk..", "...kk..."],
    nBaldor: [".........kk...k.k.k...kk.....", ".........kik.kGkGkGk.kik.....", "..........kikkgggggkkik......", "...........kHk1PPPPkHk.......", "...........k11PPPPPPPk.......", "..........k11PPPPPPPPPk......", "..........k2EvQQQQEvQQk......", "..........k31PpPPPpPPpk......", ".........kkk31PPPPPPpkk......", ".......kcrrkkk5qqqkkkk.......", "......kcckPPPk5pupqkPPPk.....", "......kcckgggk5uvuqkgggk.....", ".....kcRrrrkPk5pupqkPk6Dk....", ".....kcRrrrkkkgGGGgkkk6Dk....", "....kcrRrrrrrkqqkqqkR64Dk....", "....kkkRkkkkkkQQkQQkk6kkk....", "....k..k.....kkkkkkk.k..k...."],
    nBaldorW0: [".........kk...k.k.k...kk.....", ".........kik.kGkGkGk.kik.....", "..........kikkgggggkkik......", "...........kHk1PPPPkHk.......", "...........k11PPPPPPPk.......", "..........k11PPPPPPPPPk......", "..........k2EvQQQQEvQQk......", "..........k31PpPPPpPPpk......", ".........kkk31PPPPPPpkk......", ".......kcrrkkk5qqqkkkk.......", "......kcckPPPk5pupqkPPPk.....", "......kcckgggk5uvuqkgggk.....", ".....kcRrrrkPk5pupqkPk6Dk....", ".....kcRrrrkkkgGGGgkkk6Dk....", "....kcrRrrrrrkqqkqqkR64Dk....", "....kkkRkkkkkkQQkQQkk6kkk....", "....k..k.....kkkkkkk.k..k...."],
    nBaldorW1: [".............................", ".........kk...k.k.k...kk.....", ".........kik.kGkGkGk.kik.....", "..........kikkgggggkkik......", "...........kHk1PPPPkHk.......", "..........k11PPPPPPPPPk......", "..........k2EvQQQQEvQQk......", "..........k31PpPPPpPPpk......", ".........kkk31PPPPPPpkk......", ".......kcrrkkk5qqqkkkk.......", "......kcckPPPk5pupqkPPPk.....", "......kcckgggk5uvuqkgggk.....", ".....kcRrrrkPk5pupqkPk6Dk....", ".....kcRrrrkkkgGGGgkkk6Dk....", "....kcrRrrrrrkqqkqqkR64Dk....", "....kkkRkkkkkkQQkQQkk6kkk....", "....k..k.....kkkkkkk.k..k...."],
    nBaldorW2: [".........kk...k.k.k...kk.....", ".........kik.kGkGkGk.kik.....", "..........kikkgggggkkik......", "...........kHk1PPPPkHk.......", "...........k11PPPPPPPk.......", "..........k11PPPPPPPPPk......", "..........k2EvQQQQEvQQk......", "..........k31PpPPPpPPpk......", ".........kkk31PPPPPPpkk......", ".......kcrrkkk5qqqkkkk.......", "......kcckPPPk5pupqkPPPk.....", "......kcckgggk5uvuqkgggk.....", ".....kcrRrrkPk5pupqkPk6Dk....", ".....kcrRrrkkkgGGGgkkk6Dk....", "....kcRrrrRrrkqqkqqkR64Dk....", "....kkkkRkkkkkQQkQQkk6kkk....", "....k...k....kkkkkkk.k..k...."],
    nBaldorW3: [".............................", ".........kk...k.k.k...kk.....", ".........kik.kGkGkGk.kik.....", "..........kikkgggggkkik......", "...........kHk1PPPPkHk.......", "..........k11PPPPPPPPPk......", "..........k2EvQQQQEvQQk......", "..........k31PpPPPpPPpk......", ".........kkk31PPPPPPpkk......", ".......kcrrkkk5qqqkkkk.......", "......kcckPPPk5pupqkPPPk.....", "......kcckgggk5uvuqkgggk.....", ".....kcrRrrkPk5pupqkPk6Dk....", ".....kcrRrrkkkgGGGgkkk6Dk....", "....kcRrrrRrrkqqkqqkR64Dk....", "....kkkkRkkkkkQQkQQkk6kkk....", "....k...k....kkkkkkk.k..k...."],
    nKrugash: [".......krRk..........krrk........", ".....kkrRrk..........krRrkk......", "....krrRkrk...........krrRrk.....", "...kwwRkkRk...........kRkrwwk....", "..kwVwk..k.............k.kwwVk...", "..kWWk....................kWWk...", "..kWWk....................kWVk...", ".kwwk......................kwwk..", ".kwwVk....................kwVwk..", ".kwWWk....................kWWwk..", "..kwwk....................kwwk...", "..kwwwk..................kwwwk...", "..kwWWWkk..............kkWWWwk...", "..kwWWWwwkkk........kkkwwVWWwk...", "...kWWVwwwVwk......kVwwwwWWWk....", "....kWWwwwwVkkkkkkkkwVwwwVWk.....", ".....kVwwwVMMmmmnmmmMMwwwWk......", "......kkkwwVMMMMMMMMMVwkkk.......", ".........kkk11ddlddddkkk.........", ".........klkAEeAAAEeAklk.........", "........k.kk2lTklkTllkk.k........", ".......kwkWk2lTkkkTllkWkwk.......", ".......k3WwWkk2llllkkWwWuk.......", "........k3WWmmBlllk4mWWuk........", ".......kuk4mmk2wBllk4mmkuk.......", "........kkrllk2llBBk2lrkk........", ".........krddk5ywyBk1drk.........", ".........krkkWWWWWWWkkrk.........", "..........k.kMMkkkMMk.k..........", "............kFFk.kFFk............", "............kkkk.kkkk...........,"],
    nKrugashW1: [".................................", ".......krRk..........krrk........", ".....kkrRrk..........krRrkk......", "....krrRkrk...........krrRrk.....", "...kwwRkkRk...........kRkrwwk....", "..kwVwk..k.............k.kwwVk...", "..kWWk....................kWWk...", "..kWWk....................kWVk...", ".kwwk......................kwwk..", ".kwwVk....................kwVwk..", ".kwWWk....................kWWwk..", "..kwwk....................kwwk...", "..kwwwk..................kwwwk...", "..kwWWWkk..............kkWWWwk...", "..kwWWWwwkkk........kkkwwVWWwk...", "...kWWVwwwVwk......kVwwwwWWWk....", "....kWWwwwwVkkkkkkkkwVwwwVWk.....", ".....kVwwwVMMmmmnmmmMMwwwWk......", "......kkkwwVMMMMMMMMMVwkkk.......", ".........kkk11ddlddddkkk.........", ".........klkAEeAAAEeAklk.........", "........k.kk2lTklkTllkk.k........", ".......kwkWk2lTkkkTllkWkwk.......", ".......k3WwWkk2llllkkWwWuk.......", "........k3WWmmBlllk4mWWuk........", ".......kuk4mmk2wBllk4mmkuk.......", "........kkrllk2llBBk2lrkk........", ".........krddk5ywyBk1drk.........", ".........krkkWWWWWWWkkrk.........", "..........k.kMMkkkMMk.k..........", "............kFFk.kkkk...........,"],
    nKrugashW3: [".................................", ".......krRk..........krrk........", ".....kkrRrk..........krRrkk......", "....krrRkrk...........krrRrk.....", "...kwwRkkRk...........kRkrwwk....", "..kwVwk..k.............k.kwwVk...", "..kWWk....................kWWk...", "..kWWk....................kWVk...", ".kwwk......................kwwk..", ".kwwVk....................kwVwk..", ".kwWWk....................kWWwk..", "..kwwk....................kwwk...", "..kwwwk..................kwwwk...", "..kwWWWkk..............kkWWWwk...", "..kwWWWwwkkk........kkkwwVWWwk...", "...kWWVwwwVwk......kVwwwwWWWk....", "....kWWwwwwVkkkkkkkkwVwwwVWk.....", ".....kVwwwVMMmmmnmmmMMwwwWk......", "......kkkwwVMMMMMMMMMVwkkk.......", ".........kkk11ddlddddkkk.........", ".........klkAEeAAAEeAklk.........", "........k.kk2lTklkTllkk.k........", ".......kwkWk2lTkkkTllkWkwk.......", ".......k3WwWkk2llllkkWwWuk.......", "........k3WWmmBlllk4mWWuk........", ".......kuk4mmk2wBllk4mmkuk.......", "........kkrllk2llBBk2lrkk........", ".........krddk5ywyBk1drk.........", ".........krkkWWWWWWWkkrk.........", "..........k.kMMkkkMMk.k..........", "............kkkk.kFFk...........,"],
  });
  Object.assign(PAL, {
    nOrc: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#8fb35e", "l": "#6e9444", "d": "#4c6c30", "1": "#1a1215", "2": "#44592c", "3": "#2f411f", "4": "#301d15", "5": "#4b3022"},
    nOrc_v0: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#8fb35e", "l": "#6e9444", "d": "#4c6c30", "1": "#1a1215", "2": "#44592c", "3": "#2f411f", "4": "#301d15", "5": "#4b3022"},
    nOrc_v1: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#bc9c5c", "l": "#967a3e", "d": "#6a5428", "1": "#1a1215", "2": "#5d4a28", "3": "#41331a", "4": "#301d15", "5": "#4b3022"},
    nOrc_v2: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#c07a5e", "l": "#9a5a42", "d": "#6c3c2c", "1": "#1a1215", "2": "#5f362b", "3": "#42241c", "4": "#301d15", "5": "#4b3022"},
    nOrc_v3: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#9aa2a2", "l": "#788282", "d": "#545c5e", "1": "#1a1215", "2": "#4a4e55", "3": "#34373d", "4": "#301d15", "5": "#4b3022"},
    nOthrow: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#9aa85a", "l": "#7a883e", "d": "#56622a", "1": "#4b5228", "2": "#65191b", "3": "#656373", "4": "#353b1b", "5": "#4b3022", "6": "#301d15", "7": "#372313"},
    nOthrow_v0: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#8fb35e", "l": "#6e9444", "d": "#4c6c30", "1": "#44592c", "2": "#65191b", "3": "#656373", "4": "#2f411f", "5": "#4b3022", "6": "#301d15", "7": "#372313"},
    nOthrow_v1: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#bc9c5c", "l": "#967a3e", "d": "#6a5428", "1": "#5d4a28", "2": "#65191b", "3": "#656373", "4": "#41331a", "5": "#4b3022", "6": "#301d15", "7": "#372313"},
    nOthrow_v2: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#c07a5e", "l": "#9a5a42", "d": "#6c3c2c", "1": "#5f362b", "2": "#65191b", "3": "#656373", "4": "#42241c", "5": "#4b3022", "6": "#301d15", "7": "#372313"},
    nOthrow_v3: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#9aa2a2", "l": "#788282", "d": "#545c5e", "1": "#4a4e55", "2": "#65191b", "3": "#656373", "4": "#34373d", "5": "#4b3022", "6": "#301d15", "7": "#372313"},
    nShaman: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#9aaa86", "l": "#7a8a68", "d": "#56644a", "1": "#4b5344", "2": "#4b3022", "3": "#353c30"},
    nShaman_v0: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#8fb35e", "l": "#6e9444", "d": "#4c6c30", "1": "#44592c", "2": "#4b3022", "3": "#2f411f"},
    nShaman_v1: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#bc9c5c", "l": "#967a3e", "d": "#6a5428", "1": "#5d4a28", "2": "#4b3022", "3": "#41331a"},
    nShaman_v2: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#c07a5e", "l": "#9a5a42", "d": "#6c3c2c", "1": "#5f362b", "2": "#4b3022", "3": "#42241c"},
    nShaman_v3: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#9aa2a2", "l": "#788282", "d": "#545c5e", "1": "#4a4e55", "2": "#4b3022", "3": "#34373d"},
    nOcharge: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#76984c", "l": "#587a36", "d": "#3e5826", "1": "#656373", "2": "#3a3945", "3": "#364a23", "4": "#263518", "5": "#301d15", "6": "#3a0c0e"},
    nOdrum: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#a8a860", "l": "#868642", "d": "#5e5e2c", "1": "#1a1215", "2": "#53512b", "3": "#3a391c", "4": "#68663f"},
    nOdrum_v0: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#8fb35e", "l": "#6e9444", "d": "#4c6c30", "1": "#1a1215", "2": "#44592c", "3": "#2f411f", "4": "#586c3d"},
    nOdrum_v1: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#bc9c5c", "l": "#967a3e", "d": "#6a5428", "1": "#1a1215", "2": "#5d4a28", "3": "#41331a", "4": "#745e3c"},
    nOdrum_v2: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#c07a5e", "l": "#9a5a42", "d": "#6c3c2c", "1": "#1a1215", "2": "#5f362b", "3": "#42241c", "4": "#774a3d"},
    nOdrum_v3: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#9aa2a2", "l": "#788282", "d": "#545c5e", "1": "#1a1215", "2": "#4a4e55", "3": "#34373d", "4": "#5f626a"},
    nOgrip: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#c07a5e", "l": "#9a5a42", "d": "#6c3c2c", "1": "#5f362b", "2": "#65191b", "3": "#656373", "4": "#3a3945", "5": "#42241c", "6": "#301d15"},
    nOgrip_v0: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#8fb35e", "l": "#6e9444", "d": "#4c6c30", "1": "#44592c", "2": "#65191b", "3": "#656373", "4": "#3a3945", "5": "#2f411f", "6": "#301d15"},
    nOgrip_v1: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#bc9c5c", "l": "#967a3e", "d": "#6a5428", "1": "#5d4a28", "2": "#65191b", "3": "#656373", "4": "#3a3945", "5": "#41331a", "6": "#301d15"},
    nOgrip_v2: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#c07a5e", "l": "#9a5a42", "d": "#6c3c2c", "1": "#5f362b", "2": "#65191b", "3": "#656373", "4": "#3a3945", "5": "#42241c", "6": "#301d15"},
    nOgrip_v3: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#9aa2a2", "l": "#788282", "d": "#545c5e", "1": "#4a4e55", "2": "#65191b", "3": "#656373", "4": "#3a3945", "5": "#34373d", "6": "#301d15"},
    nOtroll: {"k": "#0b0a0e", "e": "#ff9a30", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#9a9a72", "l": "#787a54", "d": "#56583a", "1": "#1a1215", "2": "#4a4a37", "3": "#353526"},
    nUrg: {"k": "#0b0a0e", "e": "#ffd23a", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#8aa070", "l": "#6a8052", "d": "#4a5a38", "1": "#1a1215", "2": "#414d35", "3": "#65191b", "4": "#2d3624", "5": "#301d15"},
    nTroll: {"k": "#0b0a0e", "e": "#ffe060", "E": "#2a1410", "w": "#ece0c4", "W": "#b8ac90", "b": "#7a5034", "B": "#4e3020", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "H": "#2a1e20", "r": "#a32a2a", "R": "#5e1416", "y": "#d8a840", "o": "#8a6034", "O": "#5a3a1e", "s": "#d8c49a", "T": "#f4ecd8", "F": "#2a1e18", "u": "#c0b4a0", "h": "#9aa8a8", "l": "#76848a", "d": "#56626a", "1": "#1a1215", "2": "#49505a", "3": "#353b45"},
    nBrute: {"k": "#0b0f08", "s": "#5e8a34", "S": "#3e5e24", "h": "#8ab858", "e": "#ffdf3a", "E": "#2a1a08", "r": "#a3222a", "T": "#f4ecd8", "b": "#d8d0b8", "c": "#5a3a22", "C": "#3a2414", "1": "#3a5322", "2": "#372316", "3": "#23150d"},
    nBoar: {"1": "#2d1f1a", "2": "#1c130f", "k": "#0a0806", "d": "#4a3428", "D": "#2e2018", "L": "#6a5040", "b": "#ece4cc", "e": "#ff3020", "E": "#140c08", "p": "#a06060", "T": "#f4ecd8", "h": "#1a1410", "B": "#a89c80"},
    nExec: {"k": "#0c0a0a", "H": "#141014", "h": "#2a242a", "e": "#ff3020", "E": "#2a242a", "s": "#b08a78", "S": "#7a5a4c", "b": "#3a2418", "a": "#5a3a24", "r": "#7a1418", "B": "#2a2024", "F": "#1a1414", "m": "#8a8a92", "1": "#0c090d", "2": "#6d534e", "3": "#4b3631", "4": "#23150f", "5": "#4b0c0f"},
    nMother: {"k": "#0c0a0c", "H": "#1a1418", "s": "#b8b09c", "S": "#7a7464", "e": "#c8f060", "E": "#1a1418", "m": "#2a1010", "v": "#9ae050", "V": "#4a7a20", "r": "#4a3a38", "R": "#2a2020", "b": "#d8d0b8", "1": "#100c0f", "2": "#726a66", "3": "#2d2324", "4": "#2d4a15", "5": "#5f8834", "6": "#1a1315"},
    nCoffin: {"k": "#0b0a09", "a": "#a8a296", "A": "#7a746c", "e": "#ff7a30", "c": "#2a2420", "g": "#9a7a38", "1": "#686262", "2": "#5f4a24"},
    nHerald: {"k": "#0b0a09", "a": "#a8a296", "A": "#7a746c", "r": "#6a2a1e", "R": "#4a1c14", "g": "#c8a050", "e": "#ff7a30", "E": "#2e2b28", "d": "#4a4642", "D": "#2e2b28", "F": "#2e2b28", "1": "#411913", "2": "#686262", "3": "#2d2a2b"},
    nMordred: {"k": "#0b0a09", "W": "#dcd6ca", "P": "#aaa49a", "p": "#7e7870", "q": "#56514b", "Q": "#36322e", "g": "#c8a050", "y": "#f0d890", "r": "#8a2e20", "R": "#4e1c14", "e": "#ff7a30", "E": "#36322e", "1": "#7c6134", "2": "#696365", "3": "#211e1e", "4": "#551b15", "5": "#353131"},
    nQueen: {"k": "#0b0a09", "v": "#5e5466", "V": "#3e3648", "x": "#9a90a4", "s": "#d8d0c4", "S": "#a89e92", "g": "#c8a050", "y": "#f0d890", "e": "#ff7a30", "E": "#251f2c", "1": "#7c6134", "2": "#26202f", "3": "#3a3343"},
    nDog: {"k": "#100c0c", "d": "#5e4638", "D": "#3a2a22", "L": "#8a6a5a", "l": "#a8aeb8", "m": "#6a707c", "t": "#e0d8c0", "e": "#ff3b2c", "E": "#1a1010", "r": "#7a1a22", "R": "#4a0e14", "g": "#b89040", "1": "#3a2a24", "2": "#414451", "3": "#4b0f16", "4": "#231916"},
    nGuard: {"k": "#0b0a09", "a": "#a49e94", "A": "#7a746c", "d": "#524e48", "D": "#34312c", "g": "#9a7a38", "G": "#c8a050", "e": "#ff7a30", "E": "#34312c", "m": "#8a847a", "1": "#7c6134", "2": "#656061", "3": "#201d1c", "4": "#555050", "5": "#322f2f"},
    nBaldor: {"k": "#050407", "P": "#655d7a", "p": "#4d465c", "q": "#3a3448", "Q": "#2a2534", "H": "#1d1a24", "i": "#57506a", "r": "#8e2632", "R": "#561420", "g": "#a87a30", "G": "#e0b860", "u": "#b450d8", "v": "#d17aff", "E": "#2a070b", "D": "#3e0d14", "1": "#3e3850", "2": "#1a1622", "3": "#2f2a3c", "4": "#581720", "5": "#231f2f", "6": "#350c15", "c": "#b23a44"},
    nKrugash: {"u": "#6a5a40", "V": "#7a6a50", "k": "#0b0a0e", "l": "#527c32", "d": "#365a20", "m": "#a4a4b0", "M": "#5e5e6a", "n": "#e4e4ec", "w": "#ece0c4", "A": "#d83a2c", "e": "#ff3a20", "E": "#2a0604", "T": "#f4ecd8", "r": "#a32a2a", "R": "#5e1416", "B": "#4e3020", "y": "#d8a840", "F": "#2a1e18", "W": "#b8ac90", "1": "#213615", "2": "#324b20", "3": "#41362a", "4": "#656373", "5": "#301d15"},
  });
  // v2.93 네발짐승 걷기: 몸은 그대로, 대각선 다리 한 쌍씩 한 칸 들어 올림 (몸 전체가 내려가 껑충 뛰는 것처럼 보이던 것 대신)
  function quadWalk(rows, a, b) { const g = rows.map(r => r.split('')), H = g.length; for (const c of [a, b]) { if (g[H - 2][c] === 'D') g[H - 2][c] = 'k'; if (g[H - 1][c] === 'k') g[H - 1][c] = '.'; } return g.map(r => r.join('')); }
  MAPS.nDogW1 = quadWalk(MAPS.nDog, 3, 11); MAPS.nDogW3 = quadWalk(MAPS.nDog, 5, 9);
  PAL.nMordredShade = rampOf(PAL.nMordred, ['#3a0808', '#701414', '#a02020', '#d03434', '#ff8070'], ['e']); PAL.nQueenShade = rampOf(PAL.nQueen, ['#3a0808', '#701414', '#a02020', '#d03434', '#ff8070'], ['e']); // 붉은 환영

  const spriteCache = {};
  const PLAYER_MAPS = new Set(['knight', 'ranger', 'mage', 'priest', 'gunner', ...['hKnight', 'hRanger', 'hMage', 'hPriest', 'hGunner'].flatMap(k => [k, k + 'W0', k + 'W1', k + 'W2', k + 'W3'])]);
  for (const k of ['nOrc', 'nOthrow', 'nShaman', 'nOcharge', 'nOdrum', 'nOgrip', 'nOtroll', 'nUrg', 'nTroll', 'nBrute', 'nBoar', 'nExec', 'nMother', 'nCoffin', 'nHerald', 'nMordred', 'nQueen', 'nDog', 'nGuard', 'nBaldor', 'nKrugash', 'invPanda', 'invReaper', 'invShrew', 'invShrewB', 'invWeasel']) for (const v of ['', 'W1', 'W3']) PLAYER_MAPS.add(k + v); // v2.43~44 새 도트는 질감 점 없이
  function sprite(map, pal, scale, white) {
    const key = map + pal + scale + (white ? 'w' : '');
    if (spriteCache[key]) return spriteCache[key];
    const rows = MAPS[map], p = PAL[pal];
    let minX = 99, maxX = 0;
    rows.forEach(r => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') { minX = Math.min(minX, x); maxX = Math.max(maxX, x); } });
    const w = maxX - minX + 1, h = rows.length;
    const [c, g] = mkCanvas(w * scale, h * scale);
    rows.forEach((r, y) => {
      for (let x = minX; x <= maxX; x++) {
        const ch = r[x]; if (!ch || ch === '.' || !p[ch]) continue;
        g.fillStyle = white ? '#ffffff' : p[ch];
        g.fillRect((x - minX) * scale, y * scale, scale, scale);
        // 픽셀 하이라이트로 질감
        // v2.93 1px 질감 점 없앰 — 게임 도트는 2px 칸만 쓴다
      }
    });
    spriteCache[key] = c;
    return c;
  }

  // ================================================================ v3.19 외곽선 기준: 구조물 안에 들어간 작은 물건은 검은 외곽선 대신 제 색을 한 단계 어둡게 (셀아웃)
  // get(x,y) → '#rrggbb' | null(빈칸) · set(x,y,hex). 사각형 [x0,x1]×[y0,y1] 안의 검은 칸만 바꾼다.
  //  · 빈칸이나 사각형 밖과 맞닿은 검은 칸 = 덩어리 바깥 외곽선 → 그대로
  //  · 물건 색으로 둘러싸인 작은 검은 점·구멍(눈구멍 · 열쇠 구멍) → 그대로
  //  · 나머지: 옆에 물건 색이 있으면 그 색 ×0.62, 없으면 옆 배경 색 (keepLine이면 물건과 닿은 칸만 바꾸고 구조물 선은 남김)
  function deOutlineCells(get, set, x0, y0, x1, y1, o = {}) {
    const rgb = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const hx = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    const kMax = o.kMax != null ? o.kMax : 0x1a, isK = c => !!c && Math.max(...rgb(c)) <= kMax;
    const f = o.f || 0.62, dk = c => { const [r, g, b] = rgb(c); return '#' + hx(r * f) + hx(g * f) + hx(b * f); };
    const inR = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1, key = (x, y) => x + ',' + y, N4 = [[0, -1], [-1, 0], [1, 0], [0, 1]];
    // 배경 색: 주어지지 않으면 사각형 안에서 가장 흔한 색부터 몫(bgShare)이 찰 때까지
    let bg = o.bg ? new Set(o.bg) : null;
    if (!bg) { const cnt = new Map(); let tot = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const c = get(x, y); if (!c || isK(c)) continue; cnt.set(c, (cnt.get(c) || 0) + 1); tot++; }
      bg = new Set(); let acc = 0; for (const [c, n] of [...cnt].sort((a, b) => b[1] - a[1])) { if (acc >= tot * (o.bgShare || 0.45)) break; bg.add(c); acc += n; } }
    const isBg = c => bg.has(c) || (o.isBg && o.isBg(c));
    const pend = new Set();
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!isK(get(x, y))) continue;
      let edge = false; for (const [dx, dy] of N4) { const X = x + dx, Y = y + dy; if (!inR(X, Y) || !get(X, Y)) { edge = true; break; } }
      if (!edge || o.noEdge) pend.add(key(x, y)); }
    // 작은 구멍 (물건 색으로만 둘러싸인 검은 덩어리, hole칸 이하)은 남김
    const seen = new Set(), hole = o.hole != null ? o.hole : 4;
    for (const k0 of pend) { if (seen.has(k0)) continue; const comp = [k0], q = [k0]; seen.add(k0); let enclosed = true;
      while (q.length) { const [x, y] = q.pop().split(',').map(Number); for (const [dx, dy] of N4) { const X = x + dx, Y = y + dy, k = key(X, Y), c = get(X, Y);
        if (pend.has(k)) { if (!seen.has(k)) { seen.add(k); comp.push(k); q.push(k); } } else if (!c || isK(c) || isBg(c)) enclosed = false; } }
      if (enclosed && comp.length <= hole) comp.forEach(k => pend.delete(k)); }
    const base = new Map(); // 원래 물건 색 (한 번만 어둡게)
    for (let pass = 0; pass < 8 && pend.size; pass++) {
      const next = [];
      for (const k of pend) { const [x, y] = k.split(',').map(Number), items = new Map(); let bgc = null, any = null;
        for (const [dx, dy] of N4) { const X = x + dx, Y = y + dy, kk = key(X, Y); if (pend.has(kk) || !inR(X, Y)) continue; const c = get(X, Y); if (!c || isK(c)) continue;
          if (base.has(kk)) { any = any || c; continue; } if (isBg(c)) { bgc = bgc || c; continue; } items.set(c, (items.get(c) || 0) + 1); }
        if (items.size && o.sepOnly && bgc) next.push([k, x, y, bgc, true]); // 어두운 바닥 위: 바닥과 닿은 테두리는 바닥색 (물건끼리 닿은 곳만 어둡게)
        else if (items.size) { const c = [...items].sort((a, b) => b[1] - a[1])[0][0]; next.push([k, x, y, dk(c), true]); }
        else if (bgc || any) next.push([k, x, y, bgc || any, false]); }
      if (o.keepLine) for (let i = next.length - 1; i >= 0; i--) if (!next[i][4]) next.splice(i, 1); // 물건과 닿지 않은 검은 선(선반 · 판 테두리)은 그대로
      if (!next.length) break;
      for (const [k, x, y, c, it] of next) { set(x, y, c); pend.delete(k); if (it) base.set(k, 1); }
    }
    if (o.fill) for (const k of pend) { const [x, y] = k.split(',').map(Number); set(x, y, o.fill); }
  }
  // 캔버스용 (1칸 = 1px)
  function deOutlineCtx(g, x0, y0, x1, y1, o = {}) {
    const W = x1 - x0 + 1, H = y1 - y0 + 1, im = g.getImageData(x0, y0, W, H), d = im.data, hx = n => n.toString(16).padStart(2, '0');
    const get = (x, y) => { if (x < x0 || y < y0 || x > x1 || y > y1) return null; const i = ((y - y0) * W + (x - x0)) * 4; return d[i + 3] < 128 ? null : '#' + hx(d[i]) + hx(d[i + 1]) + hx(d[i + 2]); };
    const set = (x, y, c) => { const i = ((y - y0) * W + (x - x0)) * 4; d[i] = parseInt(c.slice(1, 3), 16); d[i + 1] = parseInt(c.slice(3, 5), 16); d[i + 2] = parseInt(c.slice(5, 7), 16); d[i + 3] = 255; };
    deOutlineCells(get, set, x0, y0, x1, y1, Object.assign({ noEdge: true }, o)); g.putImageData(im, x0, y0);
  }
  // 글자 칸 그림용 (g = 글자 배열의 배열, pal에 새 색 글자를 더함)
  function deOutlineGrid(g, pal, x0, y0, x1, y1, o = {}) {
    const inv = new Map(Object.entries(pal).map(([k, v]) => [String(v).toLowerCase(), k]));
    const get = (x, y) => { const ch = g[y] && g[y][x]; if (!ch || ch === '.') return null; const c = pal[ch]; return c ? String(c).toLowerCase() : null; };
    const set = (x, y, c) => { let ch = inv.get(c); if (!ch) { let n = 0x100; while (pal[String.fromCharCode(n)]) n++; ch = String.fromCharCode(n); pal[ch] = c; inv.set(c, ch); } g[y][x] = ch; };
    deOutlineCells(get, set, x0, y0, x1, y1, o); return g;
  }
;

// ==================================================================== 02_weapons.js
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
  const skinOpen = () => false; // v3.84 외형 변경(잿불 외형) 폐기 — 항상 기본 외형
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

  // 8 유니크 — 철퇴 (v3.41 성문 빗장 → 검은 홈을 판 넓은 대검 · 시안07)
  add('unique', '철퇴', '검은 홈을 깊게 판 넓은 대검입니다. 죄인을 벽까지 밀어붙여 심판합니다.', '길고 무거워 휘두르는 속도가 30% 느린 대신, 공격 거리가 길고 피해가 25% 증가합니다. 3타가 적을 뒤로 크게 밀어내고, 장애물에 부딪힌 적은 0.6초 동안 기절합니다.', cellWeapon(60, 15, 6, 7, { // v3.42 날 8칸 길게 (시안08)
    C: '#eef0f4', B: '#dde0e6', b: '#c4c8d0', F: '#2c2a32', K: '#1c1a20', f: '#3c3a44', D: '#b4b8c2', M: '#8a8e98', m: '#6e727c',
    t: '#e8eaef', g: '#a4a8b2', n: '#6a6e78', h: '#2e3038', J: '#7e3a30', L: '#5a2420', I: '#2a0e0c', k: '#0b0a0e', p: '#dde0e6', q: '#9a9ea8', r: '#5a5e68',
  }, put => {
    for (let y = 5; y <= 9; y++) put(0, y, y === 6 ? 'p' : 'q'); for (let y = 4; y <= 10; y++) put(1, y, y <= 5 ? 'p' : y <= 8 ? 'q' : 'r'); for (let y = 5; y <= 9; y++) put(2, y, y === 5 ? 'q' : 'r'); // 육각 쇠뭉치 자루 끝
    for (let y = 5; y <= 9; y++) { const c = y === 5 ? 't' : y === 9 ? 'n' : 'g'; put(3, y, c); put(10, y, c); } // 손잡이 양 끝 쇠테
    for (let x = 4; x <= 9; x++) for (let y = 6; y <= 8; y++) { const d = (x + y) % 3; put(x, y, d === 0 ? 'I' : (y === 6 ? 'J' : y === 7 ? (d === 1 ? 'J' : 'L') : 'L')); } // 붉은 가죽을 사선으로 감음
    for (let y = 2; y <= 12; y++) { put(11, y, y <= 4 ? 't' : y <= 10 ? 'g' : 'n'); put(12, y, y === 2 ? 't' : y === 12 ? 'n' : y <= 4 ? 't' : y <= 10 ? 'g' : 'n'); put(13, y, y === 2 ? 'g' : 'n'); put(14, y, 'k'); } // 날과 같은 높이의 코등이 + 경계
    put(12, 7, 'h'); // 코등이 못
    const TIP = 54, top = x => x < TIP ? 2 : 2 + (x - TIP + 1), bot = x => x < TIP ? 12 : 12 - (x - TIP + 1), fEnd = { 5: 50, 6: 51, 7: 52, 8: 51, 9: 50 };
    for (let x = 15; x < 60; x++) { const T = top(x), Bt = bot(x); if (T > Bt) break;
      for (let y = T; y <= Bt; y++) { let c;
        if (fEnd[y] != null && x <= fEnd[y]) c = y === 5 ? 'F' : y === 9 ? 'f' : 'K'; // 검은 홈 (위 벽 그늘 · 아래 벽 반사)
        else if (x > fEnd[7] && y === 7) c = 'D'; // 날 끝까지 이어진 능선
        else if (y === T) c = 'C'; else if (y === Bt) c = 'm';
        else if (y < 7) c = (x < TIP && y === 4) ? 'b' : 'B'; else c = (x < TIP && y === 11) ? 'M' : 'D';
        if (x >= TIP) { if (y < 7 && y !== T) c = 'B'; if (y > 7 && y !== Bt) c = 'M'; } // 끝 두 면: 위 밝음 · 아래 어둠
        put(x, y, c); } }
    for (let y = 2; y <= 4; y++) put(15, y, 'b'); for (let y = 10; y <= 11; y++) put(15, y, 'M'); // 날 뿌리의 코등이 그림자
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
  add('legend', '별의 서약 대검', '여덟 갈래 별 가드와 붉은 리본, 타오르는 룬이 새겨진 넓은 금빛 대검입니다.', '기본 공격 3타가 적을 꿰뚫는 빛의 검기를 날립니다.', cellWeapon(46, 21, 6, 10, {
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
  add('legend', '잿빛 왕의 처형검', '왕관 가드와 감긴 사슬, 검은 날에 잿불 균열이 녹아 흐르는 검입니다.', '3타가 잿불 장판을 남깁니다. 성채의 맹세의 빛의 검 충격파가 지나간 자리도 잿불로 탑니다.', cellWeapon(44, 19, 6, 9, {
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

// 암살자 · 마법사 · 사제 · 거너 무기 시안 — cellWeapon(w, h, px, py, pal, draw). 1칸 = 2px, 오른쪽이 끝, (px,py) 손잡이 축
(() => {
  const disc = (put, cx, cy, rx, ry, f) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const d = (x * x) / (rx * rx + 0.4) + (y * y) / (ry * ry + 0.4); if (d <= 1) f(cx + x, cy + y, x, y, d); } };
  const line = (put, x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); };

  // ================= 암살자 (쌍검 — 양손에 같은 무기)
  WF.ranger = H => {
    const { cellWeapon: cw, WEAP } = H, W = [], add = (g, n, l, s, w) => W.push({ grade: g, name: n, look: l, skill: s, w });
    add('common', '쌍단검', '암살자의 기본 쌍검입니다.', '—', WEAP.ranger[0]);
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
    add('unique', '그림자 사슬낫', '검은 사슬이 달린 쿠사리가마입니다.', '3타에 사슬낫을 한 바퀴 휘둘러 주변 적을 벱니다.', cw(18, 13, 4, 6, { h: '#1a1420', H: '#3a2a48', c: '#5a5a6a', C: '#2a2a34', m: '#6a5a8a', w: '#d8c8ff', p: '#a070ff' }, put => {
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
    add('legend', '쌍둥이 송곳니', '작은 박쥐 날개 가드에 핏줄 홈이 빛나는 송곳니입니다.', '퍼펙트 회피에 성공하면 우클릭 기술이 바로 충전됩니다. 우클릭 기술을 쓴 뒤 2초 동안 투명해집니다.', cw(22, 9, 4, 4, { h: '#1a0a0e', H: '#4a1418', G: '#c9a24a', g: '#ffe08a', i: '#f8f0e0', I: '#d8c8a8', j: '#9a8a6a', J: '#6a5a42', r: '#ff3040', R: '#8a1018', w: '#3a1a2a', W: '#6a2a3a' }, put => {
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
    add('rare', '촛대', '촛농이 흘러내리는 놋쇠 촛대입니다.', '기본 공격이 촛농이 되어, 떨어진 자리에 작은 화상 장판을 남깁니다.', cw(28, 11, 5, 5, { b: '#8a6a30', B: '#c9a24a', w: '#f4ecdc', W: '#c8bca8', k: '#2a2020', y: '#ffd060', o: '#ff8a2a', r: '#ff4030', s: '#fff8d8' }, put => {
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
    add('unique', '국자 🥄', '자루 끝에 고리가 달린 커다란 국자로, 수프가 찰랑거립니다.', '기본 공격이 맞힌 적에게 짧은 화상을 입힙니다.', cw(31, 14, 4, 4, { m: '#9aa0a8', l: '#e0e4ea', d: '#5a6068', s: '#e8903a', S: '#c05a1a', g: '#7ab040', w: '#f0f2f4' }, put => {
      const cy = 4; put(0, cy - 1, 'm'); put(0, cy, 'd'); put(0, cy + 1, 'm'); put(1, cy - 2, 'm'); put(1, cy + 2, 'm'); put(2, cy - 2, 'd'); put(2, cy + 2, 'd'); // 자루 끝 걸이 고리
      for (let x = 2; x <= 17; x++) { put(x, cy, x === 3 ? 'd' : 'm'); put(x, cy - 1, x > 3 && x < 17 ? 'l' : '.'); }
      put(17, cy + 1, 'm'); put(18, cy + 1, 'm'); put(18, cy + 2, 'm'); put(19, cy + 2, 'd'); // 아래로 꺾인 목
      const bx = 24, ry = cy + 3; // 그릇: 테두리 + 반구
      for (let x = bx - 6; x <= bx + 6; x++) put(x, ry, Math.abs(x - bx) === 6 ? 'm' : 'l');
      for (let dy = 1; dy <= 6; dy++) { const hw = Math.round(Math.sqrt(36 - dy * dy * 0.9)); for (let dx = -hw; dx <= hw; dx++) put(bx + dx, ry + dy, Math.abs(dx) === hw || dy === 6 ? 'd' : dx < -2 && dy < 4 ? 'l' : 'm'); }
      for (let x = bx - 5; x <= bx + 5; x++) put(x, ry - 1, (x % 4 === 0) ? 'g' : (x % 3 === 0 ? 'S' : 's')); put(bx - 2, ry - 2, 's'); put(bx + 1, ry - 2, 'S'); put(bx + 3, ry - 2, 's'); // 넘칠 듯한 수프
      put(bx - 3, ry - 4, 'w'); put(bx - 2, ry - 5, 'w'); put(bx + 1, ry - 4, 'w'); put(bx + 2, ry - 6, 'w'); put(bx + 4, ry - 5, 'w'); // 김
    }));
    add('unique', '거울 지팡이', '금테 손거울이 달린 지팡이입니다.', '기본 공격이 거울 분신에서도 함께 나갑니다.', cw(28, 13, 5, 6, { h: '#3a2430', H: '#5a3a4a', G: '#c9a24a', g: '#ffe08a', m: '#a8c8e8', M: '#6a8ab0', w: '#f0faff' }, put => {
      const cy = 6; for (let x = 0; x < 17; x++) put(x, cy, x % 4 ? 'h' : 'G');
      disc(put, 22, cy, 5, 5, (x, y, dx, dy, d) => put(x, y, d > 0.68 ? (d > 0.86 ? 'G' : 'g') : (dx + dy < -2 ? 'w' : dx - dy > 2 ? 'M' : 'm')));
      put(20, cy - 2, 'w'); put(21, cy - 3, 'w'); put(19, cy - 1, 'w');
    }));
    add('legend', '잿빛 별의 홀', '재가 도는 별 보주와 초승달 뿔, 금 자루로 된 홀입니다.', '기본 공격의 큰 마력탄이 3갈래로 나가고, 운석이 작은 운석 5개로 쪼개집니다.', cw(34, 17, 5, 8, { h: '#c9a24a', H: '#ffe08a', G: '#8a6420', K: '#2a2628', m: '#4a4246', r: '#ff4030', y: '#ffd060', o: '#ff8a2a', c: '#ffe08a', C: '#c9952a', s: '#fff4c0' }, put => {
      const cy = 8; for (let x = 0; x < 20; x++) put(x, cy, x % 5 === 0 ? 'G' : x % 2 ? 'h' : 'H');
      for (let y = cy - 3; y <= cy + 3; y++) put(20, y, 'C'); put(21, cy - 3, 'c'); put(21, cy + 3, 'c');
      disc(put, 26, cy, 5, 5, (x, y, dx, dy, d) => put(x, y, d < 0.15 ? 'y' : d < 0.35 ? 'o' : d < 0.55 ? ((dx + dy) % 2 ? 'r' : 'm') : (dx * 3 + dy) % 5 === 0 ? 'r' : d > 0.85 ? 'K' : 'm'));
      for (const sg of [-1, 1]) { for (let i = 0; i < 6; i++) put(21 + Math.round(i * 0.6), cy + sg * (6 + Math.round(Math.sin(i * 0.5) * 2)), i > 3 ? 's' : 'c'); put(24, cy + sg * 7, 'c'); }
      for (const [x, y] of [[32, cy], [26, cy - 6], [26, cy + 6], [31, cy - 4], [31, cy + 4]]) put(x, y, 's');
    }));
    add('legend', '모래시계 지팡이', '금 톱니 고리에 둘러싸인, 거꾸로 흐르는 모래시계입니다.', '영혼박리의 분신이 4초 더 오래 남습니다.', cw(34, 17, 5, 8, { h: '#2a1a3a', H: '#4a2a5a', G: '#ffd34d', g: '#fff2b0', Y: '#c9952a', w: '#d8f0ff', W: '#ffffff', s: '#ffd080', S: '#e0a040', b: '#5a8ac0' }, put => {
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
    add('rare', '향로 철퇴', '사슬에 매단 흔들 향로입니다.', '휘두르면 향 연기가 퍼집니다. 연기 안에서는 공격을 흘려낼 확률이 20% 증가합니다.', cw(21, 11, 2, 5, { h: '#6b4a2a', G: '#c9a24a', g: '#ffe08a', c: '#8a8a94', b: '#a07030', B: '#5a3a14', e: '#ff8a2a', s: '#c8c0b8' }, put => {
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
    add('rare', '당근 메이스 🥕', '잎이 흔들리는 거대한 당근입니다.', '적을 처치하면 4% 확률로 당근이 떨어집니다. 당근을 주우면 하트 반 칸을 회복하며, 챕터당 3개까지 떨어집니다.', cw(21, 9, 4, 4, { g: '#5ab040', G: '#2a7a20', o: '#f08a2a', O: '#c05a10', y: '#ffb060' }, put => {
      const cy = 4; for (const [x, y] of [[0, cy - 3], [1, cy - 2], [2, cy - 1], [0, cy + 3], [1, cy + 2], [2, cy + 1], [1, cy], [2, cy], [3, cy], [0, cy]]) put(x, y, (x + y) % 2 ? 'g' : 'G');
      for (let x = 4; x <= 20; x++) { const hw = x < 15 ? 2 : x < 19 ? 1 : 0; for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw ? 'y' : y === cy + hw ? 'O' : 'o'); if (x % 4 === 2 && hw) put(x, cy, 'O'); }
    }));
    add('rare', '종탑 망치', '종 모양 머리가 달린 망치입니다.', '3타 충격파의 범위가 두 배가 됩니다.', cw(20, 13, 2, 6, { h: '#6b4a2a', G: '#8a8a94', b: '#b08038', B: '#6a4818', Y: '#e8c070', k: '#3a2810' }, put => {
      const cy = 6; for (let x = 0; x < 12; x++) put(x, cy, x === 0 ? 'G' : 'h');
      for (let x = 12; x <= 18; x++) { const hw = 2 + Math.round((x - 12) * 0.55); for (let y = cy - hw; y <= cy + hw; y++) put(x, y, x === 18 ? 'B' : y === cy - hw ? 'Y' : y === cy + hw ? 'B' : 'b'); } put(19, cy, 'k');
    }));
    add('unique', '성유물함 플레일', '작은 금빛 성물함을 사슬에 단 플레일입니다.', '빛의 방패가 2칸까지 쌓입니다.', cw(23, 13, 2, 6, { h: '#6b4a2a', G: '#c9a24a', g: '#ffe08a', Y: '#8a6420', c: '#8a8a94', r: '#c0303a', w: '#fff8e0' }, put => {
      const cy = 6; for (let x = 0; x < 9; x++) put(x, cy, x === 0 || x === 8 ? 'G' : 'h'); for (let x = 9; x < 13; x++) put(x, cy, x % 2 ? 'c' : '.');
      for (let x = 13; x <= 20; x++) for (let y = cy - 2; y <= cy + 3; y++) put(x, y, y === cy + 3 ? 'Y' : x === 13 || x === 20 ? 'G' : 'g'); for (let i = 0; i < 4; i++) { put(13 + i, cy - 3 - i, 'G'); put(20 - i, cy - 3 - i, 'G'); }
      put(16, cy - 6, 'g'); put(17, cy - 6, 'g'); put(16, cy, 'r'); put(17, cy, 'r'); put(16, cy - 1, 'r'); put(17, cy + 1, 'r'); put(15, cy, 'r'); put(18, cy, 'r'); put(16, cy + 2, 'w');
    }));
    add('unique', '고해의 채찍', '가시가 박힌 가죽 채찍입니다.', '3타에 맞은 적에게 출혈을 일으킵니다.', cw(26, 9, 2, 4, { h: '#3a1a14', H: '#5a2a20', G: '#8a8a94', l: '#7a3a24', L: '#a0503a', t: '#d8d0c0' }, put => {
      const cy = 4; for (let x = 0; x < 7; x++) put(x, cy, x === 0 ? 'G' : x % 2 ? 'h' : 'H');
      for (let x = 7; x <= 25; x++) { const y = cy + Math.round(Math.sin((x - 7) * 0.5) * 2.5); put(x, y, x % 2 ? 'l' : 'L'); if (x % 3 === 0) put(x, y - 1, 't'); }
    }));
    add('unique', '달토끼 떡메 🍡', '떡이 붙은 커다란 나무 떡메입니다.', '3타에 떡을 찧어 적을 떡에 붙여 느리게 합니다. 떡이 붙은 적이 쓰러지면 떡이 터져 주변 적도 붙습니다.', cw(21, 13, 2, 6, { h: '#8a6034', H: '#5a3a1e', w: '#a0743e', W: '#7a5228', r: '#fff8f0', R: '#e0d8d0', p: '#f0a0b0' }, put => {
      const cy = 6; for (let x = 0; x < 12; x++) put(x, cy, x % 3 ? 'h' : 'H');
      for (let x = 12; x <= 19; x++) for (let y = cy - 5; y <= cy + 5; y++) put(x, y, x === 12 || x === 19 ? 'W' : (y === cy - 5 ? 'w' : (x + y) % 5 === 0 ? 'W' : 'w'));
      disc(put, 20, cy + 1, 1, 3, (x, y) => put(x, y, 'r')); put(19, cy + 3, 'r'); put(19, cy + 4, 'R'); put(20, cy - 2, 'p');
    }));
    add('legend', '별빛 성가', '빛 고리가 머리를 감싼 금빛 날개 메이스로, 별 보석이 박혀 있습니다.', '우클릭 기술을 쓰면 2초 동안 보호막도 함께 얻습니다.', cw(31, 19, 3, 9, { h: '#8a6a20', G: '#ffe08a', Y: '#c9952a', m: '#ffd34d', l: '#fffbe6', d: '#a8781a', u: '#ff6a2a', U: '#ffb040', a: '#fff8c0', f: '#ffffff', F: '#ffe8b0', E: '#d8b060' }, put => {
      const cy = 9, hx = 24;
      for (let a = 0; a < 24; a++) { const an = a / 24 * Math.PI * 2; if (a % 2) continue; put(Math.round(hx + Math.cos(an) * 6), Math.round(cy + Math.sin(an) * 6), 'a'); } // 빛 고리
      put(0, cy, 'G'); for (let x = 1; x < 18; x++) put(x, cy, x % 4 === 0 ? 'G' : x < 6 ? (x % 2 ? 'Y' : 'h') : 'h'); // 자루 (손잡이 감김)
      for (const sg of [-1, 1]) for (let i = 0; i < 6; i++) for (let j = 0; j <= Math.min(i, 5 - Math.floor(i / 2)); j++) put(21 - i + j, cy + sg * (2 + i), j === 0 ? 'E' : (i + j) % 2 ? 'F' : 'f'); // 날개
      for (let y = cy - 2; y <= cy + 2; y++) put(19, y, 'Y'); put(20, cy, 'G');
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const d = Math.hypot(dx, dy); if (d > 3.4) continue; put(hx + dx, cy + dy, d > 2.6 ? (dx + dy > 0 ? 'd' : 'G') : dx + dy < -2 ? 'l' : 'm'); }
      put(hx, cy, 'u'); put(hx - 1, cy, 'U'); put(hx, cy - 1, 'U'); put(hx - 1, cy - 1, 'f'); // 태양 보석
      put(hx + 4, cy, 'G'); put(hx + 5, cy, 'l'); put(hx, cy - 4, 'G'); put(hx, cy + 4, 'd'); // 가시
    }));
    add('legend', '날개 달린 성창', '겹깃 천사 날개와 금 십자 코등이, 붉은 리본, 빛나는 잎사귀 창날이 달린 창입니다.', '기적으로 되살아난 뒤 무적인 동안 성창이 비처럼 떨어집니다. 그동안 적을 처치하면 무적 시간이 0.5초 증가합니다.', cw(38, 19, 3, 9, { h: '#e8e0cc', H: '#c8bca0', G: '#ffd34d', Y: '#c9952a', f: '#ffffff', F: '#d8e4f0', E: '#a8bcd0', s: '#fffbe6', S: '#ffe08a', r: '#e02a2a', R: '#8a1020' }, put => {
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
    add('legend', '장의사의 머스킷', '관 모양 개머리판에 은 십자 못과 은 해골, 초록 혼불 룬, 낫 모양 총검이 달린 총입니다.', '등 맡기기에서 하비가 쏘는 산탄의 피해가 150%로 증가합니다. 처치한 큰 적은 관이 되어 굴러가며 피해를 줍니다.', cw(42, 13, 9, 6, { s: '#2a1e22', S: '#140e10', n: '#c8ccd4', b: '#2e322e', B: '#c8c0a8', i: '#ece8e0', I: '#9a948a', g: '#7aff9a', G: '#2a9a4a', k: '#0b0a0e', m: '#a8acb4', w: '#eef2f6' }, put => {
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
    priest: ['3타의 피해가 10% 증가합니다.', '공격이 맞으면 8% 확률로 적을 0.4초 동안 기절시킵니다.', '권능 재사용 대기 시간이 1초 감소합니다.'],
    gunner: ['정예와 보스에게 주는 피해가 8% 증가합니다.', '재장전한 뒤 첫 발은 반드시 치명타가 됩니다.', '장탄이 1발 증가합니다.'],
  };
  const uncK = () => { if (!G) return null; const it = eqWeapon(G.cls); return it && it.cls === G.cls && it.wk >= 11 && it.wk <= 13 ? G.cls + it.wk : null; }; // 예: 'knight12'
  // v3.19 기사 무기 9종 다시 그림 (기사_무기_TOBE_시안01) — 크기 · 손잡이 축은 그대로, 칸 그림 · 색만 바꿈
  const W_OVR = { gunner: {"0":{"rows":[".......kf.D.............k..",".......k..lllilllllillllllD","iwwwwwsbDDbbbibbbbbibbbbbbD","isSsSsssDsSssisSsssiSs.....","iSSSSS.kk.kVVVVVVVVVV......",".........k................."],"pal":{"w":"#9a6e40","s":"#6b4a2a","S":"#4a3020","V":"#2e1c10","l":"#b0b4bc","b":"#767a84","D":"#5a5e66","k":"#2a2a30","f":"#d0d0c8","i":"#b8bcc4"},"px":6,"py":3},"12":{"rows":[".......kf.D.................kB.",".......k..llllBlllllBlllllBlllD","BwwwwwsbDDbbbbBbbbbbBbbbbbBbbbD","BsSsSsssDsSsssBSssssBssssSBss..","BSSSSS.Bk.BVVVVVVVVVVVVVVVVV...",".........B....................."],"pal":{"w":"#a8743e","s":"#7a4a24","S":"#4e2e14","V":"#2e1c10","l":"#b0b4bc","b":"#767a84","D":"#5a5e66","k":"#2a2a30","f":"#d0d0c8","i":"#b8bcc4","B":"#d0a040","Y":"#f2dc94"},"px":6,"py":3},"4":{"rows":[".......kf.D.k......................k..",".......k..llllllBlllllllBllllllllllllD","iwwwwwsbDDbbbbbbBbbbbbbbBbbbbbbbbbbbbD","isSsSsssDsSssssSBsssSsssBSssssS.......","iSSSSS.kk.kVVVVVVVVVVVVVVVVVVV........",".........k............................","......................................"],"pal":{"w":"#9a6e40","s":"#6b4a2a","S":"#4a3020","V":"#2e1c10","l":"#b0b4bc","b":"#767a84","D":"#5a5e66","k":"#2a2a30","f":"#d0d0c8","i":"#b8bcc4","B":"#d0a040","Y":"#f2dc94"},"px":6,"py":3},"11":{"rows":["........kllllllDc......","........kDDDDDDDC......","........llllllllllllD..","kwwwwwsbbbbbbbbbbbbbD..","ksssssssSsssSs.........","kSSS....k..k...........","kS.......kk............"],"pal":{"w":"#9a6e40","s":"#6b4a2a","S":"#4a3020","V":"#2e1c10","l":"#b0b4bc","b":"#767a84","D":"#5a5e66","k":"#2a2a30","f":"#d0d0c8","i":"#b8bcc4","c":"#9ad8ff","C":"#3a78a8"},"px":6,"py":4},"13":{"rows":["........k...................",".......YkYLLlllllllllllllr..","swwwwwsLLLLLbbbbbbbbbbbbbbD.","sssssssLLLLdnmmmnmmmnmmmnn..","SSSSSS.Lk..L................","........LLLL................"],"pal":{"w":"#c09060","s":"#a07a4a","S":"#6a4a2a","b":"#9aa0a8","l":"#d8dce4","D":"#5a5e66","m":"#7a7e86","n":"#b8bcc4","k":"#2a2a30","L":"#c9a24a","Y":"#f2dc94","d":"#8a6a26","r":"#c03030"},"px":6,"py":3},"6":{"rows":["....e.e..........................",".....f...........................",".....B..WW..bbb.........WW..Y....","...WWWWWYY..B.B.W.......YYWWWWWWY","...YYYYYYYWWWWWWYWWWWWWWYYYYYYYYh","...YYYYYYYYWYYWYYWYYWYYWYYYYYYYYh",".b.bbbbbbbbbbbbbbbbbBrBbbbbbbbYbh","YbBbbbbbbbbbbbbbbbbbbBbbbbbbbbbbh",".B.bbbbbbbBbbBbbBkWBbbBbbbbbbbbbh","...BBBBBbbBBBBBBbBBBBBBBbbBBBBbbB","...BBBBBbbLL....B...d...bbBBBBBB.","...lllllBBll........d...BB.......","....l.....l........ddd..........."],"pal":{"k":"#1a120a","b":"#b8843c","B":"#6a4818","Y":"#e8c070","W":"#fff2c8","h":"#0b0805","L":"#8a5a34","l":"#5a3a20","f":"#d0c0a0","e":"#ff7a30","d":"#4a4c54","r":"#c03020"},"px":7,"py":7},"9":{"rows":[".............iii..........................",".............kik..........................","...e.........iIi....G......G......G...I...","..esee.....hhhhhhh.GG..B..GG..B..GG...BI..",".msswseme..bbbbbbbhgghhBhhgghhBhhgghhhBk..","esssnsssseebbbbbbbbbbbbBbbbbbbBbbbbbbbBk..","sssnnnsssssbbbbbbbSSSSSISSSSSSISSSSSSSIk..","SsssnssssSSSIIIIIS.....I......I....ImwII..",".mssnsSmS..SBBBBBS..................Imw...","..SsnS.....km.k......................Imw..","...S........kk........................Imw.",".......................................Imw","........................................Iw"],"pal":{"s":"#26262c","S":"#0e0e12","e":"#44444c","n":"#e8e8ec","w":"#ffffff","m":"#a8a8b0","h":"#62626a","b":"#2c2c32","B":"#e6e6e6","I":"#96969e","i":"#f6f6f6","k":"#0b0a0e","g":"#ffffff","G":"#8a8a94"},"px":9,"py":6},"10":{"rows":["..............g.g.g.................","..............GGrGG.................","..............ggggg.................","G............gYGYGYG....g....g...rGY","GGGGGGG...ggggYGYGYGggggggggggggggGY","GvvvGvvGGGGGGgYGYGYGGGGGYGGGGYGGGGGb","GvvGgGvvVVGGGYbYbYbYYYYYYYYYYYYYYYYb","YvvvGVVVYYYYYYbYbYbYbbbbYbbbbYbbbbYY","YVVVYYYY..YYYYbYbYbY....b....b....YY","YYYY......Yb.YbYbYbY................","..........YYY.bbbbb.................","....................................","...................................."],"pal":{"v":"#a81828","V":"#6a0a14","G":"#ffd34d","g":"#fff2b0","Y":"#c9952a","b":"#5a4218","r":"#ff3020"},"px":8,"py":6},"1":{"rows":[".............................WW","............................WBY",".........dmm...............WYhY","YYww......d.Y..W...W.....WWYbhY","bbsswwwwwmmmmYYYYYYYYYYWWbbbbhY","bbsswswssddddbbYrBbYrBbbbbbbbhb","bbsssSSSSddddBBYBBBYBBBBBbbbbhb","bbSSSS...b.d.b.B...B.....BBbbhb","BB.......bbbbb.............Bbhb","............................BBb",".............................BB"],"pal":{"k":"#1a120a","s":"#7a5232","S":"#4a3020","w":"#9a6e40","b":"#b08038","B":"#6a4818","Y":"#e0b860","W":"#fff0c0","m":"#a8acb4","d":"#4a4c54","h":"#140c06","r":"#c03020"},"px":6,"py":5}}, priest: {"0":{"rows":["..................","..........l..l....","..........wm.wm...",".........GlDmlDmm.","ghhHhhHhhYlDDlDDlD",".........gmddmddd.","..........md.md...","..........D..D....",".................."],"pal":{"w":"#f4f6fa","l":"#cfd5dd","m":"#a2aab4","D":"#7a828e","d":"#555c68","h":"#6b4a2a","H":"#4a3018","G":"#a8802e","Y":"#f2dc94","g":"#8a6a26"},"px":2,"py":4},"1":{"rows":[".................s.s.","................G.S.S","...............gGB...","..............gYgGB..",".........c...GGGGGGB.","GhhhGhhGcCcCGbbbbbbB.",".........C..GeBeBeBB.","............bbbbbbbB.",".............BbbbbB..","...............BB....","....................."],"pal":{"h":"#6b4a2a","G":"#c9a24a","Y":"#ffe08a","g":"#e8c870","b":"#a07030","B":"#5a3a14","e":"#ff9a3a","c":"#9a9aa4","C":"#5a5a64","s":"#d8d2cc","S":"#9a948e"},"px":2,"py":5},"2":{"rows":[".............llll...","...........llKKKKll.","...........lKffffKl.","..........mKfwwfffKK","........K.mKwfffffKK","HhhHhhHhk.mnffffffnK","........K.mnfffowfnK","..........mnffffffnK","...........mnffffnk.","...........kknnnnkk.",".............kkkk..."],"pal":{"k":"#2e2a2e","K":"#181418","m":"#5a545a","l":"#9a929a","n":"#3a3438","f":"#4a4448","w":"#c8c2cc","o":"#7a7280","h":"#5a3a22","H":"#3a2414"},"px":2,"py":5},"8":{"rows":[".....................","............eeeeewww.","............ijiiiIII.","............WeWwhhWV.","............WeWwhWWVp","............WewwhhWrr","HhhHhhHhhHhhWewwhhWrr","............WewwWhWVr","............WewwWhWVr","............WewWhhWVR","............ijiiiIIIR","............VVVVVVVV.","....................."],"pal":{"h":"#8a6034","H":"#5a3a1e","w":"#b08048","e":"#c8985a","W":"#6a4422","V":"#4a2e16","i":"#9aa0aa","I":"#5a606a","j":"#e0e4ea","r":"#fff8f0","R":"#e0d8d0","p":"#f0a0b0"},"px":2,"py":6},"11":{"rows":["..................","............llll..","...........lwwwwww","..........Glmmmmml","GhhHhhHhhHYDmmmmml","..........gDDDDDDD","...........DdddddD","............dddd..",".................."],"pal":{"w":"#f4f6fa","l":"#cfd5dd","m":"#a2aab4","D":"#7a828e","d":"#555c68","h":"#5a3e24","H":"#3a2614","G":"#a8802e","Y":"#f2dc94","g":"#8a6a26"},"px":2,"py":4},"12":{"rows":["...................","................n..",".............nkkN..","..........nkkNhhhk.","........kkNhhhhNhh.","bhHhHhHkwwwhNhhhhhn","........HHNwwwhNhw.","..........nHHNwwwH.",".............nHHN..","................n.."],"pal":{"h":"#7a5432","H":"#4a2e18","k":"#a07a4c","w":"#5e3e22","n":"#d8dce4","N":"#6a6e76","b":"#4a3a2a"},"px":2,"py":5},"13":{"rows":["...............lm...","............l.wwll.m",".............wwwllm.",".............wwllmm.","GhhhhGhhhhhG.llllmD.",".............llmmDD.",".............mmmDDd.","............D.DDdd.d","...............dd..."],"pal":{"w":"#f4f6fa","l":"#cfd5dd","m":"#a2aab4","D":"#7a828e","d":"#555c68","h":"#6b4a2a","G":"#c9a24a"},"px":2,"py":4}}, mage: {"1":{"rows":["............................","..........Bb................","Bb........YB..........o.....","YB........YBwwwwwwww..oo....","BB..Y...Y.BBswwssssV.oyyor..","BbYbBbYbBbBbwwwwwwwWkyssyor.","Bb..b...b.BbWWWWWWWW.oyyo...","bb........bbVVVVVVVW..o.....","dd........bdw.W.w.W.........","..........bwW...W...........","............................"],"pal":{"Y":"#f2dc94","B":"#c9a24a","b":"#8a6a30","d":"#5a4418","w":"#f4ecdc","s":"#fffcf2","W":"#d4c8b0","V":"#a89a80","k":"#2a2020","y":"#ffd060","o":"#ff8a2a","r":"#ff4030"},"px":5,"py":5},"2":{"rows":["................................","................................","................................","................................","qqqqqgBgggggBgggggBgggggBgggggg.","QQQQQbBbbbbb...................l","......RRR......................l",".....RrkrRR....................l","......rrr......................l","..............................cc","..............................cC","..............................WW","...............................l"],"pal":{"g":"#9aac58","b":"#6a7a34","B":"#4a5424","q":"#c8a070","Q":"#8a6a44","r":"#4a4c54","R":"#9aa0aa","k":"#22242a","l":"#e0e0d8","c":"#e83a30","C":"#a02018","W":"#ffffff"},"px":5,"py":4},"4":{"rows":["..............................","..........................LL..","........................LSSSS.","......................Lsssssss","....................rSrSSSSS..","...................srsrssssss.","HhhhHhhhHhhhHhhhHhhSrSrSSSSSSS","...................sRsRsssss..","....................RSRSSSSSS.","......................Dsssssss","........................DSSS..","..........................DDD.",".............................."],"pal":{"h":"#6a4a2a","H":"#8a6a3a","s":"#e0c470","S":"#b89440","L":"#f4e0a0","D":"#8a6a2a","r":"#b04030","R":"#6a2018"},"px":5,"py":6},"5":{"rows":["...................iiii...",".................ihhiiiiI.","................ihhiiiiiII","................iiiiiiiiII","h..h..h..h..h..hiikkiikkiI","iIjiIjiIjiIjiIjiiikeiikeII","j..j..j..j..j..jIiiiiiiiij",".................IiiikiiI.","..................iIiIiIj.","..................j.j.j...",".........................."],"pal":{"i":"#e8dcc0","h":"#fff6e2","I":"#b8a888","j":"#7a6e58","k":"#1a1414","e":"#7aff7a"},"px":5,"py":5}}, ranger: {"0":{"rows":["............lw","..........wlD.","........wllmD.","....G.wlmmDd..","qhHhYwlmmDd...","....gmDdd.....",".............."],"pal":{"w":"#f4f6fa","l":"#cfd5dd","m":"#a2aab4","D":"#7a828e","d":"#555c68","G":"#c9a24a","Y":"#f2dc94","g":"#8a6a26","h":"#3b2416","H":"#6a4f3b","q":"#946c46"},"px":2,"py":4},"3":{"rows":[".....mmmmD.....","...wllllmmD....","..w......lmD...","..........lmD..","..........wmD..","..........wmD..",".........wlmD..","........wlmDd..","qhHhHhHGgDd....",".......Gg......","...............","..............."],"pal":{"w":"#f4f6fa","l":"#cfd5dd","m":"#a2aab4","D":"#7a828e","d":"#555c68","G":"#c9a24a","g":"#8a6a26","h":"#3a2a20","H":"#5a4232","q":"#7a5a42"},"px":2,"py":8},"4":{"rows":[".......ssrrqqw.","......ssrrrssw.",".....ssrsssRrww",".....ssssRRRrrw","....mmsRRRRRrrw","GHkGmmssssssssl","....ddsrrrrrqql",".....ssssrrrqql",".....ssRsssrqmm","......ssRRRssm.",".......ssRRrrm."],"pal":{"k":"#2a2228","H":"#4a3a40","G":"#e0bc60","m":"#9aa0aa","d":"#5a5e68","w":"#f0f2f6","l":"#c4c8d0","s":"#b4b8c2","r":"#c8323a","R":"#86181e","q":"#e85a5a"},"px":2,"py":5},"6":{"rows":["..........DDmmm...",".........Dmppppw..",".........Dpb...ww.",".........Dp.......",".........Dp.......","........GDp.......","cHhHhHhHGg........",".C................","cCc...............","C.C...............","cCc...............",".C................",".c................"],"pal":{"h":"#1a1420","H":"#3a2a48","G":"#8a7aa8","g":"#5a4a78","D":"#2e2448","m":"#6a5a8a","p":"#a070ff","b":"#7a50d0","w":"#efe6ff","c":"#8a8a9c","C":"#4a4a5a"},"px":4,"py":6},"9":{"rows":["......................",".......G........iiiiww","......Ggjjiiwiiwjjj...",".G....GgjjIIjjjj......","rghHGHrRjjjj..........",".G....GGjjiiwi........","......GGJJjjjjiii.....",".......G........jw....","......................"],"pal":{"h":"#3a0e14","H":"#6a1a22","G":"#a8802e","g":"#ffe08a","i":"#fff8ec","I":"#e8dcc0","j":"#b8a880","J":"#7a6a4e","w":"#ffffff","r":"#ff3040","R":"#a01822"},"px":4,"py":4},"10":{"rows":["........................",".......g.g..............",".......GgG..............",".t.....GGGggggggggggg...","t.T....GeGccgcgcgccccgw.",".tThHhHGGGCgCgCgCCCCDDw.","..T....GeGCCCCCCCCDDD...",".......GGGDDDDDDDDD.....",".......g.g..............","........................","........................"],"pal":{"h":"#1a1430","H":"#3a2a60","G":"#6a5ab8","g":"#e8e0ff","e":"#ffe060","c":"#c8b8ff","C":"#8a7ae8","D":"#4a3a98","w":"#ffffff","t":"#7af0ff","T":"#3aa0e0"},"px":6,"py":5}}, knight: {"0":{"rows":["...............................","......Gg.......................","......YG.......................","......YGmmllwllllllwllllll.....","YGHHHHYGDDmmmmmmmmmmmmmmmmll...","GYqhqhRrDDfffffffffffffDDDDDdww","gGhhhhGgDDDDDDDDDDDDDDDDDDdd...","......GgDDddddd.dddddddd.d.....","......Gg.......................","......gg.......................","..............................."],"pal":{"w":"#f4f6fa","l":"#cfd5dd","m":"#a2aab4","D":"#7a828e","d":"#555c68","f":"#5f6672","F":"#bcc2cc","Y":"#f2dc94","G":"#c9a24a","g":"#8a6a26","h":"#3e2818","H":"#6e4c30","q":"#946c46","r":"#b02a34","R":"#ff7a6a"},"px":3,"py":5},"3":{"rows":["...................................","...................................","......YG...........................","......YGDllw...Dllw...Dllw...Dl....","g.HHHHYGDmmwwCcDmmwwCcDmmwwCcDmmm..","GgqhqhGGdffffcCdffffcCdffffcCdfffww","G.hhhhGGdDDDDCcdDDDDCcdDDDDCcdDDD..","......GGdddd...dddd...dddd...dd....","......GG...........................","...................................","..................................."],"pal":{"w":"#f4f6fa","l":"#cfd5dd","m":"#a2aab4","D":"#7a828e","d":"#555c68","f":"#5f6672","F":"#bcc2cc","G":"#8a8a94","g":"#c0c0c8","Y":"#dcdce4","h":"#3a2a3a","H":"#5a4256","q":"#7a6276","c":"#2e3038","C":"#9a9ea8"},"px":3,"py":5},"4":{"rows":["................................","................................",".........................wwwlll.","........................lwwwllll","..................oo...llwwlllll","HHHHHHi..i..i..i.oOOolllmmmmmmmm","hqhqhqiIIiIIiIIiIO..Ommmmmmmmmmm","hhhhhhi..i..i..i.oOOodDDDmmmmmmD","..................oo...dDDDDDDDD","........................ddDDDDDd",".........................dddddd.","................................","................................"],"pal":{"h":"#5a3a22","H":"#8a6438","q":"#b08a58","I":"#7a7e88","i":"#4a4c54","w":"#e8ecf2","l":"#b4bac4","m":"#868c98","D":"#5e6470","d":"#3e424c","o":"#c8a048","O":"#8a6a26"},"px":3,"py":6},"5":{"rows":["...................................","...........eeeeeeeeeeeeeeeeeeeeeeee","...........occcocccoccco...o...o...","...........occcocccocccoc..o...o...","...........oCCCoCCCoCCCoCx.o...o...",".........IIoCCCoCCCoCCCott.o...o...","oeoeoeoeoeoeoeoeoeoeoeoeoeoeoeoeoeo","..........OOOOOOOOOOOOOOOOOOOOOOOOO",".........iiocccocccocccocccocccoccc","...........oCCCoCCCoCCCoCCCoCCCx.CC","...........oCCCoCCCoCCCoCCCoCCt...C","...........OOOOOOOOOOOOOOOOOOOOOOOO","..................................."],"pal":{"o":"#9a6c3c","O":"#5e3e20","e":"#c89458","E":"#3e2814","c":"#ece2ca","C":"#cdbf9e","t":"#a89878","x":"#7a6a50","i":"#5a5c64","I":"#8a8e98"},"px":3,"py":6},"6":{"rows":["...................................",".......YY..........................","......YYYYYYYaaaaaa................","......YYYYYYYaaaaaaaaaaaaaaaaaa....","I.....YYYYYYYiiiiiiiiiaaiiiiiiiiiIJ","HHHHHHyyyIIIIiiiiiiiiiiiiiiIIIIj...","hqhqhqRryIIIIiiiiIIIIIIIIIIIjj.....","hhhhhhyyyIIIIIIIIIIIIIIjIjjJ.......","J.....yyyIIIIIIjIIIjjjjjJ..........","......JJJjjjjjjjjjjjJJ.............","......JJJjjjjJJJJJ.................",".......JJJ.........................","..................................."],"pal":{"h":"#5a1a1a","H":"#8a2a24","q":"#b0463a","r":"#ff4030","R":"#ffb090","a":"#fffbea","i":"#eee2c2","I":"#cdb88c","j":"#a08a62","J":"#6e5a3c","y":"#b89a5a","Y":"#d8bc7a"},"px":3,"py":6},"7":{"rows":["...................................","........NNeeeeeeeNNeeeeeeeNNeeeeeoo","........nneeeeeeenneeeeeeenneeeeeoo","........vnoOoOOoOvnOoOoOOovnOOoOoOO","RRRRRRRRnnoOooooonnOooOooonnooOooOO","RrRrRrRrnnooooooonnooooooonnoooooOO","uuuuuuuunnOoOOoOonnoOoOOoOnnOoOoOOO","........vnOOOOOOOvnOOOOOOOvnOOOOOOO","........nnOOOOOOOnnOOOOOOOnnOOOOOOO","........nnEEEEEEEnnEEEEEEEnnEEEEEOO","..................................."],"pal":{"o":"#8a5c34","O":"#5a3a20","e":"#a87448","E":"#3e2814","n":"#4a4c54","N":"#8a8e98","v":"#c8ccd4","R":"#d8c89a","r":"#a89868","u":"#786a48"},"px":3,"py":5},"11":{"rows":[".....gYGg.........................","......YG..........................","......YGdddlllwlllllllwlllll......","......YGDDDlllllllllllllllllll....","G.HHHHYGDDDmmmmmmmmmmmmmmmmmmmll..","YGqhqhGgDDDfffffffffffffDDDDDDDDww","g.hhhhGgDDDDDDDDDDDDDDDDDDDDDDdd..","......GgDDDddddddddddddddddddd....","......Ggdddddddddddddddddddd......","......Gg..........................",".....gGgg........................."],"pal":{"w":"#f4f6fa","l":"#cfd5dd","m":"#a2aab4","D":"#7a828e","d":"#555c68","f":"#5f6672","F":"#bcc2cc","G":"#5a5e66","g":"#8a8e96","Y":"#b0b4bc","h":"#3a2a1c","H":"#6a4e34","q":"#8a6a48"},"px":3,"py":5},"12":{"rows":["...............................","...............................","......YG.......................","......YG.......................","G.HHHHYGllllllllllllllllllllllw","gGqhqhGgFFFFFFFFFFFFFFFFmmmmmD.","..hhhhGgDDDDDDmmmmmmmmmmmmmmDw.","......GgwwDDDDDDDDDDDDDDDDDDw..","......Gg..wwwwDDDDDDDDDDDDDD...","..............wwwwDDDDDDDDDw...","..................wwwwwwwww....","..............................."],"pal":{"w":"#f4f6fa","l":"#cfd5dd","m":"#a2aab4","D":"#7a828e","d":"#555c68","f":"#5f6672","F":"#bcc2cc","G":"#7a5a2a","g":"#b08a48","Y":"#d8b468","h":"#2a2018","H":"#4a3a2a","q":"#6a5440"},"px":3,"py":5},"13":{"rows":["..................................",".......gG.........................",".......YG.........................","GgHHHHHYGllllwllllllwllllllwll....","YGqhqhqGgDDDDDDDDDDDDDDDDDDDDDddww","gghhhhhGgddddddddddddddddddddd....",".......Gg.........................",".......gg.........................",".................................."],"pal":{"w":"#f4f6fa","l":"#cfd5dd","m":"#a2aab4","D":"#7a828e","d":"#555c68","f":"#5f6672","F":"#bcc2cc","G":"#6a6e78","g":"#a8acb4","Y":"#d0d4dc","h":"#2a3448","H":"#4a5a78","q":"#6a7a98"},"px":3,"py":4}} };
  if (W_OVR.knight) delete W_OVR.knight['7']; // v3.41 철퇴는 새 그림(위 add 8 유니크)을 그대로 씀 — v3.19 덧그림 뺌
  const ovrW_all = (cls, L) => L.map(o => (W_OVR[cls] || {})[o.i] ? { ...o, w: ovrW(cls, o.i, o.w) } : o);
  const OVR_C = {};
  const ovrW = (cls, i, w0) => { const o = (W_OVR[cls] || {})[i]; if (!o) return w0; if (OVR_C[cls + i]) return OVR_C[cls + i]; const b = OVR_C[cls + i] = cellWeapon(o.rows[0].length, o.rows.length, o.px, o.py, o.pal, put => o.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') put(x, y, r[x]); })); return b; };
  WEAP.gunner[0] = ovrW('gunner', 0, WEAP.gunner[0]);
  WEAP.priest[0] = ovrW('priest', 0, WEAP.priest[0]);
  WEAP.ranger[0] = ovrW('ranger', 0, WEAP.ranger[0]);
  WEAP.knight[0] = ovrW('knight', 0, WEAP.knight[0]); // 시작 기본 무기(선택창 · 장비 없음)도 새 그림
  function wcat(cls) {
    if (WCAT_C[cls]) return WCAT_C[cls];
    const H = { cellWeapon, WEAP };
    return (WCAT_C[cls] = ovrW_all(cls, WF[cls](H).concat((COMMON_EXTRA[cls] || []).map((o, j) => ({ grade: 'common', name: o.name, look: o.look, skill: (UNC_D[cls] || [])[j] || '—', w: o.w, st: Object.assign({}, o.st, { val: UNC_VAL }), uncSk: true }))).map((o, i) => ({ ...o, name: stripEmoji(o.name), i, sk: (WSK[cls] || [])[i] || (o.uncSk ? 'unc' + i : null), fx: i === 9 ? WEAPON_FX[cls] : i === 10 ? ({ knight: 'execsword', ranger: 'nine', mage: 'hourglass', priest: 'spearrain', gunner: 'kingrev' })[cls] || null : null }))));
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
    // 암살자 레어 — 쿠크리: 아래로 꺾였다 휘어 오르는 넓은 배
    const kukri = o => cellWeapon(17, 9, 2, 5, dagPal(o), put => {
      const cy = 5; put(0, cy, 'G'); put(1, cy, 'h'); put(2, cy, 'H'); put(3, cy, 'h'); for (let y = cy - 1; y <= cy + 1; y++) put(4, y, 'G');
      bladeCols(put, 5, [[4, 5], [4, 6], [4, 7], [3, 7], [3, 7], [2, 6], [2, 6], [1, 5], [1, 4], [0, 3], [0, 1]], { botW: true });
      put(6, 5, 'u');
    });
    // 암살자 유니크 — 톱날 단검: 등에 톱니, 손등을 감싸는 손잡이 고리
    const serr = o => cellWeapon(18, 10, 3, 5, dagPal(o), put => {
      const cy = 5; put(0, cy + 1, 'G'); put(0, cy + 2, 'G'); put(1, cy + 3, 'G'); put(2, cy + 3, 'G'); put(3, cy + 3, 'g'); put(4, cy + 2, 'G');
      put(1, cy, 'G'); put(2, cy, 'h'); put(3, cy, 'H'); put(4, cy, 'h'); for (let y = cy - 2; y <= cy + 1; y++) put(5, y, 'G'); put(5, cy, 'g');
      bladeCols(put, 6, [[4, 6], [4, 6], [3, 6], [3, 6], [3, 5], [2, 5], [2, 5], [1, 4], [1, 3], [1, 2], [0, 1], [0, 0]], { botW: true });
      for (const x of [7, 9, 11, 13]) put(x, [3, 2, 1, 0][(x - 7) / 2], 'd'); put(8, 5, 'u'); put(10, 4, 'u');
    });
    // 암살자 레전더리 — 핏빛 엄니: 짐승 송곳니처럼 길게 휜 뼈 날, 뒤쪽 갈고리, 핏물 홈
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
    // 사제 3단계 망치: 금빛 큰 망치 머리, 뒤로 퍼지는 별(v3.19, 예전 해 원반), 보석
    const sunham = o => cellWeapon(24, 17, 2, 8, macePal(o, { r: '#ffffff' }), put => {
      const cy = 8; put(0, cy, 'G'); put(0, cy - 1, 'G'); put(0, cy + 1, 'G'); for (let x = 1; x < 13; x++) put(x, cy, x % 3 === 0 ? 'G' : x % 2 ? 'h' : 'H');
      const ox = 16; if (window.NIGHT !== false) { for (const [a, L] of [[0, 7], [90, 8], [180, 7], [270, 8], [45, 6], [135, 6], [225, 6], [315, 6]]) { const t = a * DEG; for (let k = 4; k <= L; k++) put(Math.round(ox + Math.cos(t) * k), Math.round(cy + Math.sin(t) * k), k === L ? 's' : 'l'); } } // v3.19 해 원반 → 여덟 갈래 별 (긴 네 줄 · 짧은 대각 네 줄)
      else for (let a = 0; a < 360; a += 15) { const t = a * DEG, r = a % 30 ? 6 : 7; for (let k = 5; k <= r; k++) put(Math.round(ox + Math.cos(t) * k), Math.round(cy + Math.sin(t) * k), k === r ? 's' : 'l'); }
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
  const rbyPal = c => (G && G.palTot ? G.palTot[c] || 0 : G && G.pal ? G.pal[c] || 0 : 0); // v3.25 빛을 써도 줄지 않게 (이번 토벌에 모은 개수)
  function rbyVal() { return 15 + Math.floor(rbyPal('r') / 2); } // v2.55 기본 15 · 분노의 빛 2개마다 공격력 +1
  function rbyOpts() { const o = [], cd = Math.min(30, Math.floor(rbyPal('b') / 2)), cr = Math.min(30, Math.floor(rbyPal('g') / 2)); if (cd) o.push({ k: 'cdr', v: cd }); if (cr) o.push({ k: 'crit', v: cr }); return o; } // 평온 → 쿨타임 · 희망 → 치명타 (v2.55 각 2개마다 1%, 최대 30%)
  // RGB? 고유 도트: 직업별 무기 꼴은 유지하되 잿빛 몸체 + 빨·파·초 세 면의 프리즘 보석 + 날·총신의 삼색 상감. 크기는 기본 무기와 비슷하게
  const RBY_PAL = { g: '#2a2630', a: '#3e3a46', A: '#625e6c', s: '#9a96a4', W: '#ece8f4', R: '#e0303a', B: '#3a7cff', Y: '#4ac83a', r: '#8a1820', b: '#1a3a8a', y: '#1e6a14' };
  const RBY3 = ['R', 'B', 'Y'];
  // v3.19 RGB? 리디자인: 검은 무광 몸체 + LED 띠. LED 칸(0~9 · x · y = 무지개 12단계)은 매 0.09초마다 한 단계씩 밀려 손잡이 → 끝으로 흐름
  const RBY_KEYS = '0123456789xy', RBY_BODY = { n: '#0e0e14', c: '#1c1c26', C: '#2c2c3a', e: '#62627a', E: '#34344a', W: '#ffffff' };
  const RBY_ROWS = {"knight":{"rows":["......1.......................",".....ce.......................","......eeeeeeeeeeeeeeeeeee.....","C.....ecccccccccccccccccceee..","0CcCcCCc23456789xy012345678cWW","C.....EccccccccccccccccccEEE..","......EEEEEEEEEEEEEEEEEEE.....",".....cE.......................","......1......................."],"px":3,"py":4},"ranger":{"rows":["...............","....1..........","....Ceeeeeee...","0CcCe23456789WW","....CEEEEEEE...","....1..........","..............."],"px":2,"py":3},"mage":{"rows":[".........................","...................e.....","..................e..y0..",".................CC.yW12.",".................C.yW1234","cCc0cCc1cCc2cCc3ce.012345",".................C.123456",".................CC.3456.","..................E..56..","...................E.....","........................."],"px":5,"py":5},"priest":{"rows":["...........CCCC...","..........eeeeee..","..........Cc2c4cC.","..........Cc3c5cC.","cc0cc1cc2cCc4c6cCW","..........Cc5c7cC.","..........Cc6c8cC.","..........EEEEEE..","...........nnnn..."],"px":2,"py":4},"gunner":{"rows":["...........................",".........e..............e..","CCCCCCCCCCCC0123456789xy01W","c12345ccccccccccccccccccccE","nnnnnnnnEnnn...............",".......nn.CC..............."],"px":6,"py":3}};
  const rbyHue = h => { h = ((h % 1) + 1) % 1; const i = Math.floor(h * 6), f = h * 6 - i, v = 1, s = 0.82, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s), c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6]; return '#' + c.map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
  const RBY_LED = [];
  const RBY_RAIN = [0, 1, 2, 3, 4, 5].map(i => rbyHue(i / 6)); // 불티 색 (무지개 여섯)
  function rbyRGB(off) { const h = rbyHue((time + (off || 0)) / 1.1); return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(','); } // 1.1초에 한 바퀴 도는 무지개 'r,g,b'
  const rbyLedPal = f => RBY_LED[f] || (RBY_LED[f] = Object.assign({}, RBY_BODY, ...[...RBY_KEYS].map((k, i) => ({ [k]: rbyHue((i - f) / 12) }))));
  let RBY_W = null;
  function rbyWeapons() {
    if (RBY_W) return RBY_W;
    RBY_W = {};
    for (const cls in RBY_ROWS) { const o = RBY_ROWS[cls]; RBY_W[cls] = cellWeapon(o.rows[0].length, o.rows.length, o.px, o.py, rbyLedPal(0), put => o.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') put(x, y, r[x]); })); }
    return RBY_W;
  }
  const rbyBase = (cls, fb) => rbyWeapons()[cls] || fb;
  function makeRBY(cls) { return { id: SAVE.nextId++, grade: 'rby', slot: 'weapon', cls, name: 'RGB?', stat: SLOTS[0].stat, val: 15, opts: [], fx: null, lv: 0, fail: 0, efx: null, set: null, curse: null, wk: 0 }; }
  function rbyFrame(off) { const p = (time + off) % 1.7; return p < 0.32 ? Math.floor(p / 0.08) : -1; } // 1.7초마다 0.32초 동안 흰 → 빨 → 파 → 초
  const RBY_TINT = new WeakMap();
  function rbyTex(b) { // v3.19 무기 전체 깜빡임 → LED 무지개 흐름 (12장면 팔레트만 바꿔 끼움)
    if (!b.cells) return b;
    const f = Math.floor(time / 0.09) % 12;
    let m = RBY_TINT.get(b); if (!m) RBY_TINT.set(b, m = []);
    return m[f] || (m[f] = Object.assign({}, b, { pal: Object.assign({}, b.pal, rbyLedPal(f)), rot: {} }));
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
  function tierFx(cls) { const t = weaponTier(cls); { const it = eqWeapon(cls); if (it && it.grade === 'rby') { return { c: rbyRGB(0), p: RBY_RAIN }; } /* v3.19 휘두른 자국 · 불티도 무지개 흐름 */ } return t === 3 ? LEGEND_FX_COL[cls] : TIER_FX[t]; }
  // 무기 위에 등급 연출: 레어 — 칼날을 훑는 반짝임 / 유니크 — 보랏빛 맥동과 불티 / 레전더리 — 직업색 광채와 불꽃
  function weaponAura(tex, x, y, ang, cls, scale = 1) {
    return; // v3.19 무기를 들었을 때 등급 연출(덧칠 · 반짝임 · 불티)은 쓰지 않음 (사용자 결정) — 아래는 다시 켤 때를 위해 남겨 둠
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
  let SWAP_DRAW = false; // v3.25 무기 바꾸기 모션 중 (50_swap.js)
  let ROLL_HIDEW = false; // v3.19 구르기 공중 동작 중엔 손에 든 무기를 그리지 않음 (몸과 따로 돌아 어색함)
  function drawBlade(b, x, y, ang, alpha = 1, white, scale = 1, comp) {
    if (ROLL_HIDEW) return;
    if (SWAP_DRAW) { const m = SWAPFX.mod(b, x, y, ang); if (!m) return; b = m.b; x = m.x; y = m.y; ang = m.ang; alpha *= m.a; if (m.w) white = true; } // v3.25 무기 바꾸기 모션
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
;

// ==================================================================== 03_state.js
'use strict';
// 잿빛 왕관 원정대 — 03_state.js : 성채 배경, 4장 재 색, 입력, 직업, 아이템, 강화 규칙, 스탯, 게임 상태, 페이즈
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ---------------------------------------------------------------- v3.20 테스트 모드: 주소 뒤 ?dev 로 한 번 들어오면 이 브라우저에 기억 (?dev=off 로 끔)
  //  켜져 있을 때만 Shift 조합 테스트 키가 동작하고, 화면 왼쪽 아래에 작게 「TEST」 표시
  const DEV = (() => { try { const q = new URLSearchParams(location.search); if (q.has('dev')) { if (q.get('dev') === 'off' || q.get('dev') === '0') localStorage.removeItem('dfag_dev'); else localStorage.setItem('dfag_dev', '1'); }
    return localStorage.getItem('dfag_dev') === '1'; } catch (e) { return false; } })();
  window.DEV = DEV;
  let DEV_LIST = (() => { try { return localStorage.getItem('dfag_devlist') !== '0'; } catch (e) { return true; } })(); // v3.20 테스트 단축키 목록 열림 (Shift+? 로 열고 닫음 · 기억)
  const DEVK = new Map(); // v3.20 테스트 단축키 → 설명 (dbgK에 설명을 붙이거나 DEVK.set으로 등록하면 목록에 자동으로 추가)
  if (DEV) addEventListener('DOMContentLoaded', () => { // 오른쪽 아래: 테스트 단축키 목록
    const el = document.createElement('div'); el.id = 'devKeys'; el.className = 'hud pf glass';
    el.style.cssText = 'right:8px;bottom:40px;padding:6px 8px;font:8px/12px Galmuri7,monospace;color:var(--quiet);white-space:nowrap;pointer-events:none;display:none';
    (document.getElementById('ui') || document.body).appendChild(el); let key = '';
    setInterval(() => { const on = typeof mode !== 'undefined' && mode === 'play' && !!G; el.style.display = on ? 'block' : 'none'; if (!on) return;
      const rows = [...DEVK].map(([k, d]) => [k.startsWith('sd') ? (+k.slice(2) >= 1 && +k.slice(2) <= 4 ? '1~4' : k.slice(2)) /* v3.83 Shift+0이 1~4로 묶여 목록에서 안 보이던 문제 */ : k.toUpperCase(), d]).filter((r, i, a) => a.findIndex(q => q[0] === r[0]) === i).sort((p, q) => (p[0] === 'ESC') - (q[0] === 'ESC')), k2 = rows.map(r => r.join()).join('|') + (GOD_MODE ? 1 : 0);
      if (!DEV_LIST) { if (key === 'closed') return; key = 'closed'; el.innerHTML = '<span style="color:#ffe9b0">Shift+?</span> 테스트 단축키 열기'; return; }
      if (k2 === key) return; key = k2;
      el.innerHTML = '<b style="color:#9fd2ff;font:9px Galmuri9">테스트 단축키</b><br>' + rows.map(([k, d]) => `<span style="color:#ffe9b0">Shift+${k}</span> ${d}${k === 'O' && GOD_MODE ? ' <span style="color:#9fd2ff">(켜짐)</span>' : ''}`).join('<br>'); }, 400); });
  if (DEV) addEventListener('DOMContentLoaded', () => { const b = document.createElement('div'); b.textContent = 'TEST';
    b.style.cssText = 'position:fixed;left:6px;bottom:4px;z-index:99999;font:9px Galmuri9,monospace;color:#9fd2ff;opacity:.55;letter-spacing:1px;pointer-events:none'; document.body.appendChild(b); });

  // ---------------------------------------------------------------- 배경: 무너진 성채의 의식장
  let PILLARS = [170, 327, 484, 641, 798, 955, 1110];
  const [floor, fg] = mkCanvas(W, H);
  function paintCastle(g) {
    g.fillStyle = '#09080c'; g.fillRect(0, 0, W, H);
    // 석판
    if (typeof castleTiles === 'function') castleTiles(g); else {
    let row = 0;
    for (let y = A.y0 - 6; y < A.y1 + 10; y += 14, row++) {
      const off = (row % 2) * 12;
      for (let x = A.x0 - 30 - off; x < A.x1 + 24; x += 24) {
        const v = randi(-5, 5), b = 31 + v;
        g.fillStyle = `rgb(${b + 1},${b - 1},${b + 5})`; g.fillRect(x + 1, y + 1, 23, 13);
        g.fillStyle = `rgb(${b + 10},${b + 8},${b + 14})`; g.fillRect(x + 1, y + 1, 23, 1); g.fillRect(x + 1, y + 1, 1, 13);
        g.fillStyle = `rgb(${b - 9},${b - 10},${b - 6})`; g.fillRect(x + 1, y + 13, 23, 1);
        if (Math.random() < 0.25) { // 금
          g.fillStyle = `rgb(${b - 14},${b - 15},${b - 11})`;
          let cx = x + randi(4, 18), cy = y + randi(3, 10);
          for (let i = 0; i < randi(3, 6); i++) { g.fillRect(cx, cy, 1, 1); cx += randi(-1, 1); cy += randi(0, 1) || 1; }
        }
        if (Math.random() < 0.08) { g.fillStyle = 'rgba(70,95,50,.5)'; g.fillRect(x + randi(2, 16), y + randi(2, 9), randi(2, 5), randi(1, 2)); }
        if (Math.random() < 0.07) { g.fillStyle = 'rgba(95,12,18,.5)'; g.fillRect(x + randi(2, 16), y + randi(2, 9), randi(2, 6), randi(1, 3)); }
      }
    }
    }
    const isForge = !!paintCastle.forge; // v1.02 대장간엔 의식의 원·뼈 잔해 없음
    // 의식의 원
    if (!isForge && !paintCastle.noRite) {
    g.strokeStyle = 'rgba(120,18,28,.35)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(CX, CY, 92, 62, 0, 0, TAU); g.stroke();
    g.beginPath(); g.ellipse(CX, CY, 82, 55, 0, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(140,22,32,.35)';
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.fillRect(Math.round(CX + Math.cos(a) * 87) - 1, Math.round(CY + Math.sin(a) * 58.5) - 1, 2, 2); }
    }
    // 잔해: 뼈, 해골, 부서진 돌
    for (let i = 0; i < 26; i++) {
      if (isForge) break;
      const x = rand(A.x0 + 10, A.x1 - 10), y = rand(A.y0 + 10, A.y1 - 10);
      if (Math.hypot(x - CX, y - CY) < 100 || (typeof decFree === "function" && !decFree(x, y, 6, true))) continue;
      const t = randi(0, 2);
      if (t === 0) { g.fillStyle = '#8f887a'; g.fillRect(x, y, randi(4, 7), 1); g.fillRect(x - 1, y - 1, 2, 3); }
      else if (t === 1) { g.fillStyle = '#9d968a'; g.fillRect(x, y, 4, 3); g.fillStyle = '#0a090c'; g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x + 3, y + 1, 1, 1); }
      else { g.fillStyle = '#2a2731'; g.fillRect(x, y, randi(3, 6), randi(2, 4)); g.fillStyle = '#3a3642'; g.fillRect(x, y, 2, 1); }
    }
    // 위쪽 벽
    g.fillStyle = '#121017'; g.fillRect(0, 0, W, A.y0);
    for (let y = 2; y < A.y0 - 2; y += 8) for (let x = ((y / 8) % 2) * 9 - 9; x < W; x += 18) {
      const v = randi(-4, 4); g.fillStyle = `rgb(${34 + v},${31 + v},${40 + v})`; g.fillRect(x, y, 17, 7);
      g.fillStyle = `rgb(${44 + v},${41 + v},${52 + v})`; g.fillRect(x, y, 17, 1);
    }
    const T0 = A.y0 - 100;
    // 아치 창문 (달빛)
    for (let i = 0; i < PILLARS.length - 1; i++) {
      const mx = (PILLARS[i] + PILLARS[i + 1]) / 2;
      if (typeof CUR_ROOM !== 'undefined' && CUR_ROOM && ((CUR_ROOM.sealW && Math.abs(mx - DOOR.n.x) < 110) || (CUR_ROOM.doors && CUR_ROOM.doors.n != null && Math.abs(mx - DOOR.n.x) < 40))) continue; // v2.64 · v3.19 북문 위엔 창문 없음 인장 벽 자리엔 창문 없음
      if (typeof WDECO !== 'undefined' && G && G.stage === 2 && !(CUR_ROOM && CUR_ROOM.type === 'altar')) { if (WDECO.pick(CUR_ROOM, i, T0) === 'w2') WDECO.draw(g, 'w2', WDECO.slotX(i), T0); continue; } // v3.29 2장: 창 방에서만 창 (대칭 배치)
      g.fillStyle = '#07060a'; g.fillRect(mx - 9, T0 + 8, 18, 26); g.beginPath(); g.arc(mx, T0 + 8, 9, Math.PI, 0); g.fill();
      const mg = dLinear(g, 0, T0, 0, T0 + 34); mg.addColorStop(0, 'rgba(110,100,160,.35)'); mg.addColorStop(1, 'rgba(40,30,70,.1)');
      g.fillStyle = mg.p(g, mx - 7, T0 + 2, 14, 32); g.fillRect(mx - 7, T0 + 9, 14, 24); g.beginPath(); g.arc(mx, T0 + 9, 7, Math.PI, 0); g.fill();
      g.fillStyle = '#07060a'; g.fillRect(mx - 1, T0 + 2, 2, 32); g.fillRect(mx - 7, T0 + 20, 14, 1);
    }
    // 기둥과 깃발
    PILLARS.forEach((x, i) => {
      g.fillStyle = '#1d1a23'; g.fillRect(x - 9, 0, 18, A.y0 + 4);
      g.fillStyle = '#3a3644'; g.fillRect(x - 9, 0, 3, A.y0 + 4);
      g.fillStyle = '#0c0b10'; g.fillRect(x + 7, 0, 2, A.y0 + 4);
      g.fillStyle = '#2b2733'; g.fillRect(x - 11, A.y0 - 2, 22, 6);
      if (typeof CUR_ROOM !== 'undefined' && CUR_ROOM && CUR_ROOM.type === 'altar' ? (i === 1 || i === PILLARS.length - 2) : false) { // v3.29 기둥 깃발은 뺌 (왕도 성문 방의 대칭 깃발만 남김) // v3.20 왕도 성문 방은 성문 양옆 기둥에 하나씩 (좌우 대칭)
        g.fillStyle = '#5c1016'; g.fillRect(x - 6, T0 + 4, 12, 22);
        g.fillStyle = '#7d1820'; g.fillRect(x - 6, T0 + 4, 3, 22);
        for (let k = 0; k < 6; k++) { g.fillStyle = '#5c1016'; g.fillRect(x - 6 + k * 2, T0 + 26, 2, randi(1, 5)); }
        g.fillStyle = '#c9a24a'; g.fillRect(x - 2, T0 + 10, 4, 4); g.fillRect(x - 1, T0 + 14, 2, 4);
      }
    });
    // 측면/아래 벽
    g.fillStyle = '#0d0b11'; g.fillRect(0, A.y1, W, H - A.y1); g.fillRect(0, 0, A.x0, H); g.fillRect(A.x1, 0, W - A.x1, H);
    for (let y = 0; y < H; y += 8) for (let x = ((y / 8) % 2) * 9 - 9; x < W; x += 18) {
      if (x + 17 > A.x0 - 2 && x < A.x1 + 2 && y + 7 > A.y0 - 2 && y < A.y1 + 2) continue;
      if (y < A.y0) continue;
      const v = randi(-4, 4); g.fillStyle = `rgb(${22 + v},${19 + v},${27 + v})`; g.fillRect(x, y, 17, 7);
      g.fillStyle = `rgb(${30 + v},${27 + v},${37 + v})`; g.fillRect(x, y, 17, 1);
    }
    // 바닥 가장자리 돌턱 (2px 도트): 좁은 방에서도 벽 경계가 읽히게
    g.fillStyle = '#0b0a0e'; g.fillRect(A.x0 - 8, A.y0, 2, A.y1 - A.y0 + 8); g.fillRect(A.x1 + 6, A.y0, 2, A.y1 - A.y0 + 8); g.fillRect(A.x0 - 8, A.y1 + 6, A.x1 - A.x0 + 16, 2);
    g.fillStyle = '#2b2733'; g.fillRect(A.x0 - 6, A.y0, 4, A.y1 - A.y0 + 6); g.fillRect(A.x1 + 2, A.y0, 4, A.y1 - A.y0 + 6); g.fillRect(A.x0 - 6, A.y1 + 2, A.x1 - A.x0 + 12, 4);
    g.fillStyle = '#4a4554'; g.fillRect(A.x0 - 2, A.y0, 2, A.y1 - A.y0 + 2); g.fillRect(A.x1, A.y0, 2, A.y1 - A.y0 + 2); g.fillRect(A.x0 - 2, A.y1, A.x1 - A.x0 + 4, 2);
    g.fillStyle = '#1b1820'; for (let y = A.y0 + 8; y < A.y1; y += 12) { g.fillRect(A.x0 - 6, y, 4, 2); g.fillRect(A.x1 + 2, y, 4, 2); } for (let x = A.x0 + 8; x < A.x1; x += 12) g.fillRect(x, A.y1 + 2, 2, 4);
    // 벽 아래 그림자
    const sg = dLinear(g, 0, A.y0, 0, A.y0 + 22); sg.addColorStop(0, 'rgba(0,0,0,.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sg.p(g, A.x0, A.y0, A.x1 - A.x0, 22); g.fillRect(A.x0, A.y0, A.x1 - A.x0, 22);
  }
  // ================================================================ v1.22 STAGE 4 잿빛 왕도 — 성채 그림을 재의 색으로 바꾸고 바닥에 재를 쌓는다
  // 색 바꾸기: 밝기는 지키고 채도를 빼서 따뜻한 잿빛으로. 금빛은 바랜 금으로, 붉은 천·피는 그을린 갈색으로
  function ashPx(r, g, b) {
    const L = r * 0.3 + g * 0.55 + b * 0.15, mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx - mn;
    if (sat > 40 && r >= g && g > b + 20 && L > 70) return [Math.min(255, L * 1.05 + 30), Math.min(255, L * 0.92 + 18), L * 0.5 + 4]; // 금 → 바랜 금
    if (sat > 25 && r > g + 20 && r > b + 10) return [L * 1.25 + 14, L * 0.95 + 8, L * 0.75 + 4]; // 붉은 것 → 그을린 갈색
    if (sat > 30 && (r > 200 || g > 200)) return [r, g, b]; // 불빛·룬처럼 빛나는 점은 그대로
    const v = L * 1.12 + 5; return [v + 3, v + 1, v - 3];
  }
  function ashImg(cx, w, h) {
    const im = cx.getImageData(0, 0, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const [r, g, b] = ashPx(d[i], d[i + 1], d[i + 2]); d[i] = r; d[i + 1] = g; d[i + 2] = b; }
    cx.putImageData(im, 0, 0);
  }
  function ashify(cv) { const [c, cx] = mkCanvas(cv.width, cv.height); cx.drawImage(cv, 0, 0); ashImg(cx, cv.width, cv.height); return c; }
  const ash4 = (cv, key) => G && G.stage === 4 && !(G.dun && G.dun.forge) ? art('a4_' + key, () => ashify(cv)) : cv;
  // 바닥: 성채를 잿빛으로 → 벽 밑·구석에 재가 쌓이고, 바람결 따라 재 줄무늬, 발자국, 가운데엔 반쯤 묻힌 금빛 왕관 모자이크
  function ashCityFloor(g, R) {
    ashImg(g, W, H);
    if (typeof ROAD4 !== 'undefined') ROAD4.paint(g, R); // v3.20 재에 덮인 옛 가도 (재 더께보다 먼저)
    const A0 = { x0: A.x0, y0: A.y0, x1: A.x1, y1: A.y1 }, ph = rand(0, 6), ph2 = rand(0, 6);
    const AL = ['#4a4640', '#5e5952', '#77726a', '#948e84'];
    // 재 더께: 2px 칸 디더, 가장자리와 낮은 주파수 얼룩에서 두껍게
    const CL = cellLayer(A0.x0, A0.y0, A0.x1, A0.y1);
    for (let y = A0.y0; y < A0.y1; y += 2) for (let x = A0.x0; x < A0.x1; x += 2) {
      const e = Math.min(x - A0.x0, A0.x1 - x, (y - A0.y0) * 1.3, A0.y1 - y), edge = Math.max(0, 1 - e / 70);
      const n = 0.5 + 0.28 * Math.sin(x * 0.021 + ph) * Math.cos(y * 0.034 + ph2) + 0.22 * Math.sin((x + y * 1.7) * 0.012 + ph2);
      const drift = Math.max(0, Math.sin(x * 0.006 + y * 0.022 + ph) * 0.5 + 0.1); // 바람 줄무늬
      const lv = clamp(edge * 0.95 + (n - 0.55) * 0.9 + drift * 0.35, 0, 1);
      if (!dith(x >> 1, y >> 1, lv)) continue;
      const k = lv > 0.8 ? 3 : lv > 0.55 ? 2 : lv > 0.3 ? 1 : 0;
      CL.set(x, y, AL[k]);
    }
    CL.flush(g);
    // 가운데 왕관 모자이크 (특별한 방·보스 방 제외, 문 앞 아님) — 금빛 테 + 붉은 보석 자리, 위에 재가 덮인다
    if (R.type === 'boss') { // v2.88 왕관 모자이크는 대관식장(보스 방)에만 · v2.52 재의 제단 방은 낙인을 깔므로 모자이크 없음
      const rx = 64, ry = 40, cx0 = Math.round(CX / 2) * 2, cy0 = Math.round(CY / 2) * 2;
      for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) {
        const q = Math.hypot(x / rx, y / ry); if (q > 1) continue;
        let c = null;
        if (q > 0.9) c = (x + y) % 4 ? '#8a7438' : '#6a5828'; // 바깥 테
        else if (q > 0.84) c = '#2a2620';
        else { // 안쪽 타일 + 왕관 모양
          const u = x / 26, v = y / 20, crown = Math.abs(u) < 1 && v > -0.2 && v < 0.6 || v <= -0.2 && v > -0.9 && (Math.abs(Math.abs(u) - 0.85) < 0.18 || Math.abs(u) < 0.16);
          c = crown ? ((x >> 1) + (y >> 1)) % 3 ? '#b09040' : '#d8b860' : ((x >> 2) + (y >> 2)) % 2 ? '#3a3530' : '#46403a';
          if (crown && Math.abs(u) < 0.2 && v > 0 && v < 0.3) c = '#7a2a20';
        }
        // 재가 절반쯤 덮음
        const cover = 0.5 + 0.35 * Math.sin(x * 0.08 + ph) * Math.cos(y * 0.11 + ph2);
        if (dith((cx0 + x) >> 1, (cy0 + y) >> 1, cover * 0.85)) c = AL[cover > 0.7 ? 2 : 1];
        g.fillStyle = c; g.fillRect(cx0 + x, cy0 + y, 2, 2);
      }
    }
    // 재 위의 발자국 줄 (두어 갈래)
    for (let t = 0; t < 1; t++) { // v3.29 발자국 줄 2 → 1갈래
      let x = rand(A0.x0 + 40, A0.x1 - 40), y = rand(A0.y0 + 30, A0.y1 - 30); const a = rand(0, TAU);
      for (let i = 0; i < 14; i++) { x += Math.cos(a) * 14; y += Math.sin(a) * 9; if (x < A0.x0 + 8 || x > A0.x1 - 8 || y < A0.y0 + 8 || y > A0.y1 - 8) break; if ((typeof decFree === "function" && !decFree(x, y, 6, true))) continue; const s = i % 2 ? 4 : -4;
        g.fillStyle = '#3a3632'; g.fillRect((Math.round(x - Math.sin(a) * s) & ~1), (Math.round(y + Math.cos(a) * s * 0.6) & ~1), 4, 2); }
    }
    // 작은 재 둔덕과 타다 남은 잉걸
    for (let i = 0; i < 26; i++) { /* v3.29 재 둔덕 · 잉걸 빈도 줄임 (40 → 26번 시도) */ const x = Math.round(rand(A0.x0 + 6, A0.x1 - 10) / 2) * 2, y = Math.round(rand(A0.y0 + 6, A0.y1 - 8) / 2) * 2; if (Math.hypot(x - CX, y - CY) < 80 || (typeof decFree === "function" && !decFree(x, y, 6, true))) continue;
      if (window.SCN34) { if (i % 2) continue; const k = i % 5 === 0 ? 'ember' : pick(['m1', 'm1', 'm2', 'm3']); gPaint(g, fromRows(SCN34.ash[k]), SCN34.ashPal, x - 6, y - 6); continue; } // v2.82 재 둔덕 · 잉걸
      if (i % 5 === 0) { g.fillStyle = '#2a1a12'; g.fillRect(x, y, 4, 2); g.fillStyle = '#ff7a30'; g.fillRect(x + 2, y, 2, 2); }
      else { g.fillStyle = '#948e84'; g.fillRect(x, y, 6, 2); g.fillStyle = '#b4aea2'; g.fillRect(x + 2, y - 2, 2, 2); g.fillStyle = '#4a4640'; g.fillRect(x, y + 2, 6, 2); } }
  }
  paintCastle(fg);
  let TORCHES = PILLARS.map(x => ({ x, y: 62 }));
  const titleEmbers = [];

  // 조명/핏자국 레이어
  const [lightC, lg] = mkCanvas(VW, VH);
  let LIGHT_GL = false; // v1.78 조명 GL(디더) — 그래픽 카드가 없으면 매우 느려서 기본은 끔, __proto.lightGL로 시험
  let LIGHT_DITH = true; // v1.78 디더 빛 도장 (기본) — __proto.lightDith로 끄면 예전 부드러운 그라데이션
  const LIGHTH = (() => { const [c, g] = mkCanvas(VW / 2, VH / 2), [gc, gg] = mkCanvas(VW / 2, VH / 2); return { c, g, gc, gg }; })(); // v1.17 반 해상도 빛 지도·빛 번짐
  const [decal, dg] = mkCanvas(W, H);
  function splat(x, y, n, col = '110,10,16') {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), r = rand(0, 10) * (i / n + 0.3);
      dg.fillStyle = `rgba(${col},${rand(0.25, 0.55)})`;
      dg.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.6), randi(1, 3), randi(1, 2));
    }
  }

  // ---------------------------------------------------------------- 입력
  const keys = {};
  const pressed = {};
  const mouse = { x: CX, y: CY, active: 0, down: false };
  // v2.19 한글 입력 상태에서도 키가 먹게: 글자 대신 물리 키 위치(e.code)로 읽는다 (F가 'ㄹ'로 들어오던 문제)
  function keyName(e) { const c = e.code || ''; if (/^Key[A-Z]$/.test(c)) return e.shiftKey ? c[3] : c[3].toLowerCase(); if (/^Digit[0-9]$/.test(c)) return e.shiftKey ? 'sd' + c[5] /* v3.19 Shift+숫자 = 테스트 키 (자판 배열과 무관하게) */ : c[5]; return e.key; }
  addEventListener('keydown', e => {
    initAudio();
    const k = keyName(e).toLowerCase();
    if (!keys[k]) pressed[k] = e.shiftKey ? 'shift' : true; // v1.14 Shift와 같이 눌렸는지 기억 (테스트 키)
    keys[k] = true; IDLE_PING = true;
    if ([' ', 'arrowup', 'arrowdown', 'tab'].includes(k)) e.preventDefault();
  });
  addEventListener('keyup', e => { keys[keyName(e).toLowerCase()] = false; keys[e.key.toLowerCase()] = false; });
  // v1.16 타이틀 음악: 브라우저는 첫 클릭·터치·키 입력 전엔 소리를 못 내게 막음 → 메뉴 버튼이 아니어도 화면 어디든 처음 누르는 순간 타이틀 음악 시작
  for (const t of ['pointerdown', 'touchstart']) addEventListener(t, () => { initAudio(); IDLE_PING = true; }, { capture: true, passive: true });
  cv.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width * VW; mouse.y = (e.clientY - r.top) / r.height * VH; mouse.active = 2.5; IDLE_PING = true;
  });
  cv.addEventListener('mousedown', e => { initAudio(); IDLE_PING = true; if (G && G.cine) { G.cine.click = true; return; } mouse.active = 2.5; if (e.button === 0) { pressed['j'] = true; mouse.down = true; } if (e.button === 2) { pressed['k'] = true; mouse.rdown = true; } });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; if (e.button === 2) mouse.rdown = false; });
  const take = k => { const v = pressed[k]; pressed[k] = false; return v; };

  // ---------------------------------------------------------------- 직업
  const CLASSES = {
    knight: {
      dmgMul: 1.22, n: '기사', name: '알드릭', sub: '??? 기사', role: '탱커 · 그로기', map: 'hKnight', pal: 'hKnight', ghostPal: 'hKnightGhost', weapon: '대검',
      base: { atk: 20, def: 0, hp: 6, crit: 0.10, spd: 88 }, tier: { atk: '상', crit: '하', spd: '하' }, skill: '돌진 참격', skillCd: 8, awaken: '성채의 맹세',
      skillD: '돌진한 뒤 크게 올려베며 푸른 검기를 날립니다.', awakenD: '8초 동안 갑옷이 빛나며 밀려나지 않고 경직되지 않습니다. 기본 공격 3타마다 빛의 검 충격파가 앞으로 날아갑니다.',
      atkD: '묵직한 3연타, 3타는 회전베기입니다. 흘려내기: 맞을 때 10% 확률로 흘려냅니다.',
    },
    ranger: {
      n: '암살자', name: '네로', sub: '고양이 암살자', role: '근접 연타 딜러', map: 'hRanger', pal: 'hRanger', ghostPal: 'hRangerGhost', weapon: '쌍검',
      base: { atk: 18, def: 0, hp: 6, crit: 0.18, spd: 100 }, tier: { atk: '중', crit: '중', spd: '상' }, skill: '그림자 도약', skillCd: 7, awaken: '개다래나무 가지',
      skillD: '조준한 적의 등 뒤로 순간 이동해 X자로 베고, 반드시 치명타가 됩니다.', awakenD: '7초 동안 몸에 붉은 기운이 돌고 눈이 붉어집니다. 공격 속도와 치명타 확률이 증가하고, 이동 속도가 크게 증가합니다.',
      atkD: '빠른 3연타, 3타는 교차베기입니다. 베어내기: 기본 공격 중 맞을 때 10% 확률로 베어냅니다.',
    },
    mage: {
      dmgMul: 0.88, n: '마법사', name: '세리안', sub: '여우 마법사', role: '원거리 광역 딜러', map: 'hMage', pal: 'hMage', ghostPal: 'hMageGhost', weapon: '지팡이',
      base: { atk: 24, def: 0, hp: 5, crit: 0.12, spd: 90 }, tier: { atk: '상', crit: '중', spd: '중' }, skill: '화염구', skillCd: 10, awaken: '영혼박리',
      skillD: '폭발하는 화염구를 날립니다. 범위 피해를 주고 3초 동안 화상을 입힙니다.', awakenD: '10초 동안 마나로 된 분신을 만듭니다. 분신은 따라다니며 기본 공격을 절반의 피해로 따라 쏩니다. 기본 공격에 붙는 효과와 우클릭 기술은 따라 하지 않습니다.',
      atkD: '마력탄을 연사하고 3발마다 큰 탄이 나갑니다. 마나 격류: 점멸 뒤 3초간 10% 확률로 흘려냅니다.', icons: ['bolt', 'fireball', 'meteor'],
    },
    priest: {
      n: '사제', name: '미레아', sub: '토끼 사제', role: '방패 · 버프', map: 'hPriest', pal: 'hPriest', ghostPal: 'hPriestGhost', weapon: '메이스',
      base: { atk: 20, def: 0, hp: 6, crit: 0.08, spd: 90 }, tier: { atk: '중', crit: '하', spd: '중' }, skill: '권능', skillCd: 12, awaken: '기적',
      skillD: '빛의 방패 1칸을 얻고 주변 적을 밀쳐냅니다.', awakenD: '사용할 수 없습니다. 한 판에 한 번, 쓰러지면 하트 1.5칸으로 되살아납니다.',
      atkD: '메이스 3연타, 3타는 충격파를 일으킵니다. 신의 가호: 맞을 때 10% 확률로 막아냅니다.', icons: ['mace', 'heal', 'miracle'],
    },
    gunner: {
      dmgMul: 0.65,
      n: '거너', name: '그레이브', sub: '늑대 총잡이', role: '원거리 단일 고화력', map: 'hGunner', pal: 'hGunner', ghostPal: 'hGunnerGhost', weapon: '머스킷',
      base: { atk: 28, def: 0, hp: 5, crit: 0.50, spd: 92 }, tier: { atk: '상', crit: '상', spd: '중' }, skill: '파열탄', skillCd: 8, awaken: '등 맡기기',
      skillD: '쏘면 부채꼴로 터지며 적을 강하게 밀쳐내고, 곧바로 재장전합니다.', awakenD: '하비가 6초 동안 등 뒤를 맡아 그레이브 뒤쪽의 적을 쌍열 산탄으로 쏩니다. 뒤쪽에 적이 없으면 앞쪽의 적을 쏩니다.',
      atkD: '5발마다 재장전하고 가까운 적은 개머리판으로 칩니다. 교활: 적의 공격이 10% 확률로 빗나갑니다.', icons: ['musket', 'shotgun', 'duo'],
    },
  };
  // 삭제된 직업(예: 테스트했던 버서커)의 무기·장착 정보가 저장에 남아 있으면 정리한다
  SAVE.inv = SAVE.inv.filter(it => it.slot !== 'weapon' || !it.cls || CLASSES[it.cls]);
  for (const k in SAVE.equipBy) if (!CLASSES[k]) delete SAVE.equipBy[k];
  if (SAVE.lastCls && !CLASSES[SAVE.lastCls]) SAVE.lastCls = 'knight';
  var CUR = SAVE.lastCls && CLASSES[SAVE.lastCls] ? SAVE.lastCls : 'knight';
  const CL = () => CLASSES[G ? G.cls : CUR];
  const eqOf = cls => SAVE.equipBy[cls || CUR];

  // ---------------------------------------------------------------- 아이템
  const GRADES = [
    { k: 'common', n: '커먼', c: '#d8d8d8', opt: [0, 1], mul: 1, w: 66, pre: '낡은' }, // v1.98 확률 66/31/2.7/0.3 (전 60/30/9/1)
    { k: 'rare', n: '레어', c: '#4f8dff', opt: [1, 2], mul: 1.25, w: 31, pre: '단단한' },
    { k: 'unique', n: '유니크', c: '#b05cff', opt: [2, 3], mul: 1.6, w: 2.9, pre: '성채의' }, // v2.40 2.7 → 2.9 // v1.98 위력 1.5 → 1.6
    { k: 'legend', n: '레전더리', c: '#ff9a2e', opt: [4, 4], mul: 2.1, w: 0.1, pre: '' }, // v1.98 위력 1.8 → 2.1 · 옵션 4개 확정 · v2.40 확률 0.3 → 0.1
    { k: 'rby', n: '???', c: '#ff2a2a', opt: [0, 0], mul: 1.25, w: 0, pre: '' }, // v2.40 레전더리 위 등급: 피의 제단에서만 (일반 굴림에서는 나오지 않음)
  ];
  const SLOTS = [
    { k: 'weapon', n: '무기', stat: 'atk', base: [6, 10], label: '공격력' },
    { k: 'ring', n: '반지', stat: 'crit', base: [2, 4], label: '치명타 확률 %' },
    { k: 'neck', n: '목걸이', stat: 'cdr', base: [3, 6], label: '쿨타임 감소' }, // v2.00 HP → 쿨타임 감소
  ];
  const OPTS = [
    { k: 'atkP', n: '공격력 +{v}%', r: [4, 8] }, // v2.00 HP·방어 옵션 삭제
    { k: 'crit', n: '치명타 확률 +{v}%', r: [2, 5] }, { k: 'critDmg', n: '치명타 피해 +{v}%', r: [8, 15] }, { k: 'cdr', n: '쿨타임 -{v}%', r: [4, 8] },
    { k: 'spd', n: '이동 속도 +{v}%', r: [4, 8] },
  ];
  const LEGEND_FX = {
    bulwark: { n: '별의 서약 대검', d: '기본 공격 3타가 적을 꿰뚫는 빛의 검기를 날립니다.' },
    execsword: { n: '잿빛 왕의 처형검', d: '3타가 잿불 장판을 남깁니다. 성채의 맹세의 빛의 검 충격파가 지나간 자리도 잿불로 탑니다.' },
    fangs: { n: '쌍둥이 송곳니', d: '퍼펙트 회피에 성공하면 우클릭 기술이 충전됩니다. 우클릭 기술을 쓴 뒤 2초 동안 은신합니다.' },
    kingrev: { n: '왕의 연발총', d: '6발을 연달아 쏩니다. 마지막 탄은 폭발하고, 재장전할 때 주변 적을 밀쳐냅니다.' },
    spearrain: { n: '날개 달린 성창', d: '기적으로 되살아난 뒤 무적인 동안 성창이 떨어집니다. 그동안 적을 처치할 때마다 무적 시간이 0.5초 증가합니다.' },
    hourglass: { n: '모래시계 지팡이', d: '영혼박리의 분신이 4초 더 오래 남습니다.' },
    nine: { n: '아홉 목숨', d: '한 판에 한 번, 쓰러져도 되살아납니다. 적을 처치할 때마다 고양이 유령이 나타나 적을 쫓습니다.' },
    ashstar: { n: '잿빛 별의 홀', d: '기본 공격의 큰 마력탄이 3갈래로 나갑니다.' },
    dawn: { n: '별빛 성가', d: '우클릭 기술을 쓰면 2초 동안 모든 피해를 막는 보호막도 함께 얻습니다.' },
    undertaker: { n: '장의사의 머스킷', d: '등 맡기기에서 하비가 쏘는 산탄의 피해가 150%로 증가합니다.' },
    vigil: { n: '철야의 ', d: '퍼펙트 회피를 5번 할 때마다 하트 반 칸을 회복합니다.' },
    ember: { n: '불씨의 ', d: '콤보 3타가 사방으로 충격파를 일으킵니다.' },
    tusk: { n: '크루가쉬의 엄니 ', d: '준엘리트, 정예, 보스에게 주는 피해가 15% 증가합니다.' },
  };
  // v0.98 효과 옵션 (레어 이상 장비에 1개): 행동을 바꾸는 옵션
  const EFX = {
    corpse: { n: '시체 폭발', d: '적을 처치하면 시체가 터져 주변 적에게 피해를 줍니다.' },
    blinkFire: { n: '불길 점멸', d: '점멸한 자리에 4초 동안 불길이 남아, 지나가는 적에게 화상을 입힙니다.' },
    wave3: { n: '검기', d: '3타마다(원거리는 3발마다) 앞으로 검기를 날립니다.' },
    bleed: { n: '출혈', d: '치명타를 맞은 적은 3초 동안 출혈 상태가 됩니다.' },
    chain: { n: '연쇄 번개', d: '치명타가 터지면 번개가 주변 적 2명에게 튑니다.' },
    vamp: { n: '흡혈', d: '적을 5마리 처치할 때마다 하트 반 칸을 회복합니다.' },
    nova: { n: '반격 파동', d: '퍼펙트 회피에 성공하면 주변에 충격파가 일어납니다.' },
    exec: { n: '처형', d: '체력이 30% 이하인 적에게 주는 피해가 25% 증가합니다.' },
    thorns: { n: '가시', d: '공격을 맞으면 주변 적에게 큰 피해를 되돌려 줍니다.' },
    echo: { n: '전투 집중', d: '특수 기술을 쓰면 3초 동안 치명타 확률이 25% 증가합니다.' },
    greed: { n: '탐욕', d: '적을 처치하면 15% 확률로 금화 주머니가 떨어집니다.' },
    first: { n: '선제', d: '격전지에 들어간 뒤 처음 3번의 공격은 반드시 치명타가 됩니다.' },
  };
  // v0.98 챕터 세트 (2·4세트): 챕터마다 그 챕터 세트가 나온다
  const SETS = {
    slime: { n: '점액왕의 유산', pre: '점액왕의', c: '#9be060', b2: '최대 하트가 1칸 늘어납니다.', b4: '공격을 맞으면 50% 확률로 산성 폭발이 일어나 주변 적에게 큰 피해를 줍니다.' },
    order: { n: '타락한 기사단', pre: '기사단의', c: '#a8b8ff', b2: '챕터를 시작할 때마다 방패를 1개 얻습니다.', b4: '공격이 맞으면 12% 확률로 망령 검이 내리꽂힙니다.' },
    orc: { n: '핏빛 엄니', pre: '엄니의', c: '#ff7a50', b2: '공격력이 12% 증가합니다.', b4: '하트가 절반 이하일 때 주는 피해가 30% 늘어나고, 적을 3마리 처치할 때마다 하트 반 칸을 회복합니다.' },
  };
  const SET_BY_STAGE = { 1: 'slime', 2: 'order', 3: 'orc' };
  // v0.98 저주 장비: 강한 보너스 옵션 + 대가
  const CURSES = { frail: { d: '최대 하트가 1칸 감소합니다.' }, glass: { d: '공격을 맞을 때 25% 확률로 하트를 한 칸 잃습니다.' }, slow: { d: '이동 속도가 12% 감소합니다.' }, nopot: { d: '하트 회복량이 절반으로 감소합니다.' } };
  const CURSE_BONUS = [['atkP', 15, 20], ['critDmg', 25, 35], ['crit', 8, 12]]; /* v1.51 25~35/40~60/12~18 → 줄임 */
  const WEAPON_FX = { knight: 'bulwark', ranger: 'fangs', mage: 'ashstar', priest: 'dawn', gunner: 'undertaker' };
  function rollGrade() {
    const w = ascGradeW(GRADES.map(g => g.w)); let r = Math.random() * w.reduce((a, b) => a + b, 0); // v1.96 잿불 단계 등급 보정
    for (let i = 0; i < GRADES.length; i++) { if (r < w[i]) return GRADES[i]; r -= w[i]; }
    return GRADES[0];
  }
  // v1.98 옵션 수치: 유니크는 범위 위쪽 절반, 레전더리는 최대값 (대장간 다시 굴리기도 같음)
  const optRoll = (o, g) => Math.round(randi(g.k === 'legend' ? o.r[1] : g.k === 'unique' ? Math.ceil((o.r[0] + o.r[1]) / 2) : o.r[0], o.r[1]) * (1 + (g.mul - 1) * 0.5));
  const GRADE_VAL = { common: [7, 8], rare: [11, 13], unique: [14, 17], legend: [19, 23], rby: [15, 15] }, UNC_VAL = [9, 10]; // v2.31 (사용자 결정) 커먼 7~8 · 언커먼 9~10 · 레어 11~13 · 유니크 14~17 · 레전더리 19~23
  const GRADE_NOPT = { common: 0, rare: 1, unique: 2, legend: 4, rby: 0 };
  function rollOpts(g, n) { const pool = OPTS.slice(), out = []; for (let i = 0; i < n && pool.length; i++) { const o = pool.splice(randi(0, pool.length - 1), 1)[0]; out.push({ k: o.k, v: optRoll(o, g) }); } return out; }
  function fixRoll(W0, f) { // 예전에 굴려 둔 수치를 새 범위로 맞춤
    const [a, b] = W0.st ? W0.st.val : GRADE_VAL[W0.grade]; f.val = clamp(Math.round(f.val), a, b);
    if (W0.st) f.opts = W0.st.opts.map(o => ({ ...o }));
    else { const n = GRADE_NOPT[W0.grade], g = GRADES.find(x => x.k === W0.grade); if (f.opts.length > n) f.opts = f.opts.slice(0, n); if (f.opts.length < n) { const have = new Set(f.opts.map(o => o.k)); f.opts = f.opts.concat(rollOpts(g, 6).filter(o => !have.has(o.k)).slice(0, n - f.opts.length)); } }
    return f;
  }
  function makeItem(cls, force = {}) {
    let g = force.grade ? GRADES.find(x => x.k === force.grade) : rollGrade();
    const slot = SLOTS[0]; // v2.07 장비는 무기만 (반지·목걸이 드랍 없음)
    let val = randi(...GRADE_VAL[g.k]); // v2.31 등급별 공격력 범위가 겹치지 않게
    const nOpt = GRADE_NOPT[g.k];
    const pool = OPTS.slice(), opts = [];
    for (let i = 0; i < nOpt; i++) {
      const o = pool.splice(randi(0, pool.length - 1), 1)[0];
      opts.push({ k: o.k, v: optRoll(o, g) });
    }
    // 무기는 80% 확률로 지금 직업용, 아니면 다른 직업용
    const hasClearedChar = k => !!(SAVE.chronicle && SAVE.chronicle[k] && (SAVE.chronicle[k].normal || SAVE.chronicle[k].leg1 || SAVE.chronicle[k].leg2));
    const weaponPool = k => {
      const seen = G && G.weaponAcquired && G.weaponAcquired[k] || [], owned = SAVE.inv.filter(it => it.slot === 'weapon' && it.cls === k).map(it => it.wk);
      const reserved = G && G.weaponRolls && G.weaponRolls[k] || [];
      return wcat(k).filter(o => !(o.i === 10 && !hasClearedChar(k)) && !weaponLocked(k, o.i) && !seen.includes(o.i) && !owned.includes(o.i) && !reserved.includes(o.i));
    };
    let W0 = null;
    let wcls = null;
    if (slot.k === 'weapon') {
      if (force.wk != null) { wcls = force.wcls || cls; W0 = wcat(wcls)[force.wk] || null; }
      else {
        const preferred = force.wcls || cls; // v2.20 무기는 지금 직업용만 드랍
        const available = weaponPool(preferred);
        const choices = available.filter(o => o.grade === g.k);
        const pool = choices.length ? choices : available;
        if (pool.length) { wcls = preferred; W0 = pick(pool); }
        else { // v2.20 이번 런에 나올 무기를 다 봤으면 같은 직업 무기에서 다시 (다른 직업 무기로 넘어가지 않음)
          const all = wcat(preferred).filter(o => !(o.i === 10 && !hasClearedChar(preferred)) && !weaponLocked(preferred, o.i)), same = all.filter(o => o.grade === g.k);
          wcls = preferred; W0 = pick(same.length ? same : all);
        }
      }
      if (W0 && G) { G.weaponRolls = G.weaponRolls || {}; G.weaponRolls[wcls] = G.weaponRolls[wcls] || []; if (!G.weaponRolls[wcls].includes(W0.i)) G.weaponRolls[wcls].push(W0.i); }
    }
    if (W0) {
      g = GRADES.find(x => x.k === W0.grade) || g;
      const key = `${wcls}:${W0.i}`;
      let fixed = SAVE.weaponRolls[key];
      if (!fixed) { fixed = SAVE.weaponRolls[key] = W0.st ? { val: randi(W0.st.val[0], W0.st.val[1]), opts: W0.st.opts.map(o => ({ ...o })) } /* v2.20 추가 커먼: 정해진 능력치 */ : { val: randi(...GRADE_VAL[W0.grade]), opts: rollOpts(g, GRADE_NOPT[W0.grade]) }; }
      else if (!fixed.v231) { fixRoll(W0, fixed); fixed.v231 = true; } // v2.31 새 범위로 한 번 맞춤
      val = fixed.val;
      opts.splice(0, opts.length, ...fixed.opts.map(o => ({ ...o })));
    }
    const sname = wcls ? CLASSES[wcls].weapon : slot.n;
    let name = `${g.pre} ${sname}`.trim(), fx = null;
    if (g.k === 'legend') {
      fx = slot.k === 'weapon' ? WEAPON_FX[wcls] : force.legendFx && Math.random() < 0.5 ? force.legendFx : pick(['vigil', 'ember']);
      name = slot.k === 'weapon' ? LEGEND_FX[fx].n : LEGEND_FX[fx].n + slot.n;
    }
    // v0.98: 효과 옵션 · 세트 · 저주
    const stg = (G && G.stage) || 1, hi = g.k !== 'common';
    const efx = hi && slot.k !== 'weapon' && !force.noEfx && (g.k !== 'rare' || Math.random() < 0.5) ? pick(Object.keys(EFX)) : null; // v1.98 레어는 50%, 유니크 이상은 확정 · v2.06 무기는 고유 기술만 (효과 옵션 없음)
    const set = hi && slot.k !== 'weapon' && (force.set || /* v2.06 무기는 세트 없음 */ Math.random() < (force.setP != null ? force.setP : g.k === 'unique' ? 0.4 : 0.25)) ? (force.set || SET_BY_STAGE[stg]) : null;
    let curse = null, v2 = val;
    if (false && hi && g.k !== 'legend' && !force.noCurse && (force.curse || /* v2.07 저주 없음 */ Math.random() < (force.curseP != null ? force.curseP : 0.07))) {
      curse = force.curse || pick(Object.keys(CURSES)); v2 = Math.round(val * 1.3);
      const [ck, a, b] = pick(CURSE_BONUS); const ex = opts.find(o => o.k === ck);
      if (ex) { ex.v += randi(a, b); ex.cb = true; } else opts.push({ k: ck, v: randi(a, b), cb: true });
    }
    if (set && g.k !== 'legend') name = `${SETS[set].pre} ${sname}`;
    if (W0) { if (g.k === 'legend') fx = W0.fx; name = W0.name; } // 도감 무기는 이름 그대로 (세트는 카드에 표시)
    if (curse) name = '저주받은 ' + name;
    const it = { id: SAVE.nextId++, grade: g.k, slot: slot.k, cls: wcls, name, stat: slot.stat, val: v2, opts, fx, lv: 0, fail: 0, efx, set, curse };
    if (W0) it.wk = W0.i;
    if (G && G.asc) it.asc = G.asc; // v1.97 잿불 장비
    return it;
  }
  const setCount = (set, cls) => { const eq = eqOf(cls || (G ? G.cls : CUR)); let n = 0; for (const k in eq) { const it = SAVE.inv.find(i => i.id === eq[k]); if (it && it.set === set && canEquip(it, cls || (G ? G.cls : CUR))) n++; } return n; };
  function itemExtra(it, cls) {
    let h = '';
    if (it.hold === 'card') return `<div class="fx">✦ ${BDC.CARD_D}</div>`; // v3.18
    if (it.grade === 'rby') { const r = rbyPal('r'), b = rbyPal('b'), g = rbyPal('g'), o = rbyOpts(), v = k => (o.find(x => x.k === k) || { v: 0 }).v; // v2.40 색마다 오르는 능력치가 다름
      return `<div class="fx" style="color:#ff6a6a">✦ 분노의 빛 2개마다 공격력이 1 증가합니다. (${r}개 · +${rbyVal() - 15})</div><div class="fx" style="color:#7aa8ff">✦ 평온의 빛 2개마다 쿨타임이 1% 감소합니다. 최대 30%입니다. (${b}개 · -${v('cdr')}%)</div><div class="fx" style="color:#7ad85a">✦ 희망의 빛 2개마다 치명타 확률이 1% 증가합니다. 최대 30%입니다. (${g}개 · +${v('crit')}%)</div>`; }
    if (it.wk != null && !it.fx) { const W0 = wcat(it.cls || 'knight')[it.wk]; if (W0 && W0.skill !== '—') h += `<div class="fx">✦ ${stripEmoji(W0.skill)}${W0.sk ? '' : ' <i style="opacity:.6">(준비 중)</i>'}</div>`; } // v2.03 무기 기술
    if (it.efx) h += `<div class="efx">◆ ${EFX[it.efx].n} — ${EFX[it.efx].d}</div>`;
    if (it.set) { const S = SETS[it.set], n = setCount(it.set, cls); h += `<div class="setx" style="--sc:${S.c}">⬢ ${S.n} <b>${n}/4</b><span class="${n >= 2 ? 'on' : ''}">2세트: ${S.b2}</span><span class="${n >= 4 ? 'on' : ''}">4세트: ${S.b4}</span></div>`; }
    if (it.curse) h += `<div class="cursex">☠ 저주 — ${CURSES[it.curse].d}</div>`;
    return h;
  }
  const UNCOMMON = Object.assign({}, GRADES[0], { n: '언커먼', c: '#62d46e' }); // v2.30 직업별 추가 기본 무기(도감 11~13번): 초록 등급 (드랍 규칙은 커먼과 같음)
  const isUnc = it => !!it && it.slot === 'weapon' && it.wk >= 11 && it.wk <= 13;
  const gradeOf = it => isUnc(it) ? UNCOMMON : GRADES.find(g => g.k === it.grade);
  const slotOf = it => SLOTS.find(s => s.k === it.slot);
  const slotName = it => it.slot === 'weapon' ? CLASSES[it.cls || 'knight'].weapon : slotOf(it).n;
  const canEquip = (it, cls) => it.slot !== 'weapon' || (!it.hold && (it.cls || 'knight') === cls); // v3.18 보관 전용 무기(칼날카드)는 장착 불가
  // v2.00 장착 칸: 무기 · 반지 · 반지 · 목걸이 (반지는 두 칸 어디든)
  const EQ_KEYS = ['weapon']; // v2.07 무기 한 칸 (반지·목걸이 없앰)
  const eqKeys = slot => slot === 'ring' ? ['ring', 'ring2'] : [slot];
  const slotDef = k => SLOTS.find(x => x.k === (k === 'ring2' ? 'ring' : k));
  const eqKeyOf = (cls, it) => eqKeys(it.slot).find(k => eqOf(cls)[k] === it.id) || null;
  const isEq = (cls, it) => !!eqKeyOf(cls, it);
  const eqTarget = (cls, it) => eqKeyOf(cls, it) || eqKeys(it.slot).find(k => !SAVE.inv.some(i => i.id === eqOf(cls)[k])) || eqKeys(it.slot)[0]; // 이미 낀 칸 > 빈 칸 > 첫 칸
  const eqCurFor = (cls, it) => { const k = eqTarget(cls, it); return SAVE.inv.find(i => i.id === eqOf(cls)[k] && i.id !== it.id) || null; };
  const equipIt = (cls, it) => { eqOf(cls)[eqTarget(cls, it)] = it.id; };
  const unequipIt = (cls, it) => { const k = eqKeyOf(cls, it); if (k) delete eqOf(cls)[k]; };
  // v2.17 무기 칸: 캐릭터당 3자루. 가득 찬 채로 새 무기를 얻으면 지금 든 무기를 바닥에 내려놓고 바꿔 든다
  const WCAP = 3;
  const wOwned = cls => SAVE.inv.filter(i => i.slot === 'weapon' && i.cls === cls);
  const wFull = cls => wOwned(cls).length >= WCAP;
  function dropWeapon(it, x, y, noAuto) { if (!it || !G) return; const wasEq = isEq(G.cls, it); unequipIt(G.cls, it); SAVE.inv = SAVE.inv.filter(i => i !== it); G.fieldItems = (G.fieldItems || []).filter(i => i !== it); spawnLoot('gear', x, y, it); const L = G.loot[G.loot.length - 1]; if (L) { L.t = -0.6; L.vz = 90; }
    if (wasEq && !noAuto && it.cls === G.cls) { const nx = invList().find(i => i.slot === 'weapon' && i.cls === G.cls && canEquip(i, G.cls)); if (nx) { equipIt(G.cls, nx); lootFeed(`<b style="color:${gradeOf(nx).c}">${nx.name}</b> 장착`, gradeOf(nx).c, 1400); } } // v2.19 버리면 1번 무기를 든다 · 가진 무기가 없을 때만 기본 무기
  }
  function makeRoomFor(it, x, y) { // 새 무기를 받기 전에 칸 확보
    if (!G || it.slot !== 'weapon' || it.cls !== G.cls || !wFull(G.cls)) return null;
    const out = it.hold ? (wOwned(G.cls).find(i => !isEq(G.cls, i)) || wOwned(G.cls)[0]) : (eqWeapon(G.cls) || wOwned(G.cls)[0]); dropWeapon(out, x, y, !it.hold); return out; // v3.18 칼날카드는 손에 들 수 없으니 들고 있지 않은 무기를 내려놓음 // 바꿔 드는 중이라 새 무기가 손에 들어온다
  }
  const PCT_STAT = { crit: '치명 확률', cdr: '쿨타임 감소' };

  // ---------------------------------------------------------------- 강화 규칙 (기획서 9장)
  // 성공률: 목표 단계 +1~+9 (v2.40 최대 +9, 대장간별 상한은 enhCap). +10 이상을 노리다 실패하면 1단계 하락, 실패할 때마다 다음 시도 +2% (장인의 숨결)
  const ENH_RATE = [100, 100, 100, 100, 65, 50, 40, 25, 10]; // v2.40 +1~+4는 반드시 성공, 실패는 +5 도전부터
  const enhGain = i => i < 5 ? 0.05 : i < 9 ? 0.07 : i < 12 ? 0.10 : 0.12;
  const enhBonus = lv => { let b = 0; for (let i = 0; i < lv; i++) b += enhGain(i); return b; };
  const itemVal = (it, lv) => Math.round((it.grade === 'rby' ? rbyVal() : it.val) * (1 + enhBonus(lv == null ? (it.lv || 0) : lv)) * (1 + 0.02 * (it.asc || 0))); // v1.97 잿불 장비 +2%×단계
  const enhCost = lv => ({ iron: lv < 9 ? lv + 1 : 3, crystal: lv < 9 ? 0 : lv < 12 ? 1 : 2, gold: 20 * (lv + 1) * (lv + 1) });
  const enhRate = it => Math.min(100, ENH_RATE[it.lv] + 2 * (it.fail || 0));
  // v2.40 강화는 최대 +9. 대장간마다 상한: 1→2 사이 +3 · 2→3 사이 +6 · 3→4 사이 +9 (타이틀 대장간은 +9)
  const ENH_MAX = 9;
  const enhCap = () => (G && typeof forgeFrom !== 'undefined' && forgeFrom !== 'title' ? Math.min(ENH_MAX, 3 * Math.max(1, G.stage || 1)) : ENH_MAX);
  SAVE.inv.forEach(it => { if ((it.lv || 0) > ENH_MAX) it.lv = ENH_MAX; }); // 예전 저장의 +10 이상은 +9로
  const optText = o => (o.cb ? '<span style="color:#ff8a7a">☠ </span>' : '') + OPTS.find(x => x.k === o.k).n.replace('{v}', o.v);

  // ---------------------------------------------------------------- 스탯
  const BUFFS = {
    atk: { n: '분노의 잉걸', d: '공격력이 20% 증가합니다.', t: '공격력↑' },
    spd: { n: '바람의 재', d: '이동 속도가 15% 증가합니다.', t: '이동 속도↑' },
    hp: { n: '굳은 피', d: '최대 하트가 1칸 늘어납니다.', t: '최대 체력↑' },
    stam: { n: '가벼운 발', d: '점멸 충전 속도가 40% 증가합니다.', t: '점멸 충전↑' },
    cd: { n: '종소리의 메아리', d: '스킬과 각성 충전 속도가 25% 증가합니다.', t: '쿨타임↓' },
  };
  function calcStats(buffs, cls) {
    cls = cls || (G ? G.cls : CUR);
    const B = CLASSES[cls].base;
    const s = { atk: B.atk, def: B.def, hp: B.hp, crit: B.crit, critDmg: 1.5, cdr: 0, spd: B.spd, stamRate: 1, gaugeRate: 1, fx: new Set(), efx: new Set(), sets: {}, set4: new Set(), curse: new Set() };
    let atkP = 0, hpP = 0, defP = 0, spdP = 0;
    for (const ek of EQ_KEYS) {
      const it = SAVE.inv.find(i => i.id === eqOf(cls)[ek]); if (!it || !canEquip(it, cls)) continue;
      const v = itemVal(it);
      if (PCT_STAT[it.stat]) s[it.stat] += v / 100; else if (it.stat === 'atk') s.atk += v;
      for (const o of (it.grade === 'rby' ? rbyOpts().concat(it.opts) : it.opts)) { // v2.40 RGB?는 색 조각으로 옵션이 붙음
        if (o.k === 'atkP') atkP += o.v; else if (o.k === 'hpP') hpP += o.v; else if (o.k === 'defP') defP += o.v;
        else if (o.k === 'crit') s.crit += o.v / 100; else if (o.k === 'critDmg') s.critDmg += o.v / 100;
        else if (o.k === 'cdr') s.cdr += o.v / 100; else if (o.k === 'spd') spdP += o.v;
      }
      if (it.fx) s.fx.add(it.fx);
      if (it.efx) s.efx.add(it.efx);
      if (it.set) s.sets[it.set] = (s.sets[it.set] || 0) + 1;
      if (it.curse) s.curse.add(it.curse);
    }
    for (const k in s.sets) if (s.sets[k] >= 4) s.set4.add(k);
    if (s.sets.slime >= 2) s.hp += 2; if (s.sets.orc >= 2) atkP += 12; // v2.00 점액왕 2세트: 최대 체력 +1칸 (기사단 2세트는 챕터마다 방패)
    if (s.curse.has('frail')) s.hp -= 2; if (s.curse.has('slow')) spdP -= 12;
    if (buffs.includes('atk')) atkP += 20;
    if (buffs.includes('spd')) spdP += 15;
    if (buffs.includes('hp')) s.hp += 2;
    if (buffs.includes('stam')) s.stamRate = 1.4;
    if (buffs.includes('cd')) { s.cdr += 0.2; s.gaugeRate = 1.25; }
    if (G && cls === G.cls) s.hp += G.heartBonus || 0; // v2.02 하트 그릇·훈장·피의 제단
    /* v2.41 색 단계 수치 효과 → 빛의 각인으로 대체 */ // v2.34 색 단계
    s.pas = pasCalc(cls); { const Q = s.pas; if (Q.atkP) atkP += Q.atkP.v; if (Q.spd) spdP += Q.spd.v; if (Q.crit) s.crit += Q.crit.v / 100; if (Q.critDmg) s.critDmg += Q.critDmg.v / 100; if (Q.cdr) s.cdr += Q.cdr.v / 100; if (Q.gauge) s.gaugeRate *= 1 + Q.gauge.v / 100; } // v2.22 보관 패시브
    if (G && cls === G.cls && G.relics && G.relics.includes('scales')) atkP += 2 * wOwned(cls).length; // v2.29 왕의 저울
    if (G && cls === G.cls && G.relics) { const R = G.relics; if (R.includes('wick') && G.pal) s.critDmg += 0.1 * hueTier('r'); if (R.includes('glassheart')) { s.hp -= 2; atkP += 25; } if (R.includes('banner5')) atkP += Math.min(15, Object.keys(SAVE.unl).length); } // v2.36
    if (G && cls === G.cls && G.relics) { const R = G.relics; if (R.includes('finger')) atkP += 5; if (R.includes('crown')) atkP += 30; if (R.includes('boots')) spdP += 12; if (R.includes('eye')) s.crit += 0.10; if (R.includes('hourglass')) s.cdr += 0.10; } // v2.19 유물 능력치
    if (G && cls === G.cls && typeof BDC !== 'undefined') BDC.statMods(s, (k, v) => { if (k === 'atk') atkP += v; else spdP += v; }); // v3.18 뼈주사위 효과
    s.atk *= 1 + atkP / 100; s.hp = clamp(s.hp, 2, HEART_CAP); s.def = 0; s.spd *= 1 + spdP / 100; // v2.00 체력 = 반 칸 수, 방어력 없음
    s.cdr = Math.min(s.cdr, 0.5); s.crit = Math.min(s.crit, 0.8); s.critDmg = Math.min(s.critDmg, 2.5); /* v1.51 치명 피해 상한 250% */
    return s;
  }

  // ---------------------------------------------------------------- 게임 상태
  var G = null;
  let mode = 'title'; // title | play | rest | result | pause | wmap(v1.69 챕터 시작 월드맵)
  let hitstop = 0, shake = 0, shakeX = 0, shakeY = 0, slowmo = 0, flashT = 0, flashColor = '#fff', time = 0;
  let zoomK = 0, stopHeat = 0; // 타격감: 줌 펀치, 연속 히트스톱 누적(과하게 멈추지 않게)

  // 로그라이크: 장비·재료·골드는 한 번의 원정(런) 동안만 유지된다
  function wipeRunItems() {
    SAVE.inv = []; for (const k of Object.keys(SAVE.equipBy)) SAVE.equipBy[k] = {};
    SAVE.mats = { iron: 0, crystal: 0 }; SAVE.gold = 0;
  }
  function newRun() {
    wipeRunItems();
    G = {
      cls: CUR, stage: 1, last: 4, gold: 0, committed: { gold: 0, iron: 0, crystal: 0 }, asc: 0, /* v2.29 잿불 단계 취소 (사용자 결정) — 0 고정 */
      phase: 1, buffs: [], retries: 0, enemies: [], tele: [], parts: [], nums: [], hazards: [], drops: [], fx: [], ash: [], lights: [],
      waves: [], waveIdx: 0, spawning: 0, phaseState: 'intro', phaseT: 0, surviveT: 0, spawnT: 0, hazardT: 0,
      boss: null, bossTime: 300, proj: [], eproj: [], kills: 0, iron: 0, crystal: 0, newItems: [], loot: [], weaponRolls: {}, weaponAcquired: { knight: [], ranger: [], mage: [], priest: [], gunner: [] }, mproj: [], meteor: null, fieldItems: [], frenzyT: 0, bonfire: null, vortex: null, clear: false,
    };
    for (let i = 0; i < (G.stage === 4 ? 65 : 70); i++) G.ash.push(G.stage === 4 ? { x: rand(0, VW), y: rand(0, VH), vx: rand(-4, 4), vy: rand(5, 14), s: 2, a: rand(0.3, 0.8) } : G.stage === 3 ? { x: rand(0, VW), y: rand(0, VH), vx: rand(-5, 5), vy: -rand(8, 22), s: Math.random() < 0.25 ? 2 : 1, a: rand(0.3, 0.85), ff: rand(0, 6) } : G.stage === 1 ? { x: rand(0, VW), y: rand(0, VH), vx: rand(-8, 8), vy: rand(-4, 4), s: Math.random() < 0.3 ? 2 : 1, a: rand(0.3, 0.9), ff: rand(0, 6) } : { x: rand(0, VW), y: rand(0, VH), vx: rand(-6, 6), vy: rand(6, 16), s: Math.random() < 0.2 ? 2 : 1, a: rand(0.2, 0.6) });
    dg.clearRect(0, 0, W, H);
    { const st = makeItem(G.cls, { slot: 'weapon', grade: 'common', wk: 0 }); st.cls = G.cls; SAVE.inv.push(st); SAVE.equipBy[G.cls].weapon = st.id; } // v2.30 런 시작: 직업 커먼 무기 1자루를 들고 출발
    G.pal = { r: 0, b: 0, g: 0 }; engReset(); // v2.41 빛의 각인 G.paintW = null; G.stT0 = time; G.runPerf = 0; G.urec = {}; G.hitStage = 0; palPrev = null; setTimeout(renderPal, 0); // v2.34
    G.stats = calcStats(G.buffs);
    G.player = makePlayer(); chapterArmor();
    SAVE.runs++; persist();
    G.kg = false; G.kgT = 0; G.kgAuto = false; G.kgCls = null; // 상단 안내문 기본 숨김 (H로 토글) · 시작맵 튜토리얼로 대체
    HOME.enter(); // v2.55 캐릭터가 눈을 뜬 시작 장소에서 출발 (출구 → 월드맵 → 1장)
  }
  function makePlayer() {
    const s = G.stats;
    return {
      x: CX, y: CY + 60, r: 7, hp: s.hp, hpBack: s.hp, ang: 0, face: 1, state: 'idle', t: 0,
      combo: 0, comboWin: 0, queued: false, atkAng: 0, swingRel: 0, prevRel: 0, hitSet: new Set(), sign: 1,
      blade: 150 * DEG, trail: [], blade2: 120 * DEG, trail2: [], spin: 0,
      stam: 2, stamT: 0, iframe: 0, dodgeT: 0, dvx: 0, dvy: 0, hurtT: 0, inv: 0,
      chargeCd: [0, 0, 0, 0], chargeHit: new Set(), gauge: 0, reload: 0, ammo: 5, mana: 100, recoil: 0, poisonT: 0, poisonTick: 0, poisonDmg: 0, shieldT: 0, miracleT: 0, boltN: 0, awakenT: 0, critNext: false, dead: false, deadT: 0, walk: 0, moving: false,
    };
  }

  // ---------------------------------------------------------------- 페이즈
  const PHASES = {
    1: [[['ghoul', 4]], [['ghoul', 3], ['crow', 3]]],
    2: [[['ghoul', 3], ['dog', 2]], [['ghoul', 3], ['bloat', 2], ['crow', 2]]],
    3: [[['ghoul', 4], ['cultist', 2]], [['crow', 4], ['dog', 2], ['bloat', 1]]],
    4: [[['exec', 1], ['ghoul', 3], ['cultist', 1]], [['mother', 1], ['crow', 2]]], // v2.33 엘리트 2
    6: [[['ghoul', 4], ['dog', 2], ['bloat', 2]], [['ghoul', 3], ['cultist', 3], ['crow', 2]], [['ghoul', 5], ['dog', 2], ['cultist', 1]]],
    7: [[['mother', 1], ['ghoul', 2]], [['dog', 3], ['cultist', 2]], [['ghoul', 4], ['crow', 3], ['cultist', 2]]],
    8: [[['ghoul', 5], ['dog', 3], ['bloat', 2]], [['crow', 4], ['cultist', 3], ['bloat', 2]], [['exec', 1], ['ghoul', 3], ['cultist', 1]]],
    9: [[['exec', 1], ['dog', 2], ['cultist', 1]], [['mother', 1], ['crow', 3], ['cultist', 1]]],
  };
  function phaseLabel(p) {
    if (p === 5) return '휴식 — 모닥불';
    if (p === 10) return '60초 동안 버텨라';
    if (p === 4 || p === 9) return '엘리트 출현';
    if (p >= 6 && p <= 8) return '혼합 웨이브';
    return '잡몹 웨이브';
  }
;
