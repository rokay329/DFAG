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
    { id: 'r:glove', kind: 'r', key: 'glove', s: '비밀 방을 8번 찾으면 열립니다.', rec: 'secret', n: 8, how: '비밀 방 찾기' },
    { id: 'r:oldmap', kind: 'r', key: 'oldmap', s: '비밀 방을 25번 찾으면 열립니다.', rec: 'secret', n: 25, how: '비밀 방 찾기' },
    { id: 'r:gravedirt', kind: 'r', key: 'gravedirt', s: '보스를 한 번도 맞지 않고 3번 처치하면 열립니다.', rec: 'nohit', n: 3, how: '보스를 한 번도 맞지 않고 처치' },
    { id: 'r:horn', kind: 'r', key: 'horn', s: '정예를 100마리 처치하면 열립니다.', rec: 'elite', n: 100, how: '정예 처치' },
    { id: 'r:coal', kind: 'r', key: 'coal', s: '모닥불에서 30번 쉬면 열립니다.', rec: 'rest', n: 30, how: '모닥불에서 쉬기' },
    { id: 'r:twincoin', kind: 'r', key: 'twincoin', s: '상점에서 골드를 8,000 쓰면 열립니다.', rec: 'spent', n: 8000, how: '상점에서 골드 쓰기' },
    { id: 'r:cloak', kind: 'r', key: 'cloak', s: '점멸을 2,000번 하면 열립니다.', rec: 'blink', n: 2000, how: '점멸' },
    { id: 'r:deadring', kind: 'r', key: 'deadring', s: '30번 쓰러지면 열립니다.', rec: 'death', n: 30, how: '쓰러지기' },
    { id: 'r:scales', kind: 'r', key: 'scales', s: '무기 칸 3개를 모두 채운 판을 15번 만들면 열립니다.', rec: 'fullbag', n: 15, how: '한 판에 무기 칸 3개를 모두 채우기' },
    // v2.36 해금 유물 2차 — 한 판 안의 업적 위주
    { id: 'r:prism', kind: 'r', key: 'prism', s: '한 판에서 세 빛을 각각 25개 이상 모으면 열립니다.', rec: 'u_prism', n: 1, how: '한 판에서 세 빛을 각각 25개 모으기' },
    { id: 'r:brush', kind: 'r', key: 'brush', s: '한 챕터의 전투 방을 모두 정리하는 일을 3번 해내면 열립니다.', rec: 'paintall', n: 3, how: '한 챕터의 전투 방을 모두 정리하기' },
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
    const CN = { knight: '기사', ranger: '어세신', mage: '마법사', priest: '사제', gunner: '거너' }, RO = { knight: '기사로', ranger: '어세신으로', mage: '마법사로', priest: '사제로', gunner: '거너로' }, PS = { knight: '흘려내기', ranger: '베어내기', mage: '마나 격류 흘려냄', priest: '신의 가호', gunner: '교활 빗나감' };
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
    { n: '무리', d: '전투 방 웨이브마다 적 +1' },
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
  // 장비 등급 가중치(일반·희귀·유니크·전설): 단계마다 일반에서 희귀 이상으로 2%p, 8단계부터 전설 +1%p씩
  function ascGradeW(w) {
    const L = ascLv(); if (!L) return w;
    const t = w.reduce((a, b) => a + b, 0), k = t / 100, v = w.slice();
    let mv = Math.min(v[0], 2 * L * k); v[0] -= mv; v[1] += mv * 0.7; v[2] += mv * 0.25; v[3] += mv * 0.05; // v1.98 60/30/10 → 70/25/5
    if (L >= 8) { const lg = Math.min(v[1], (L - 7) * 0.5 * k); v[1] -= lg; v[3] += lg; } // v1.98 +1 → +0.5%p
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
