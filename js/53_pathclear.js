'use strict';
// 잿빛 왕관 원정대 — 53_pathclear.js : v3.26 길 둘레 비우기
// 길(1장 흙길 · 옛 돌길 · 개울 / 4장 재에 덮인 옛 가도)이 있는 방은, 길 가장자리에서 PAD(px)까지 환경요소를 두지 않음
//  · 서 있는 소품(나무 · 수풀 · 표지판 등): 그려지는 모양(높이 포함)이 길 띠에 걸리면 놓지 않음 (06 decorRoom의 add에서 검사)
//  · 둥근 장애물(바위 · 기둥 등): 그림이 길 띠에 걸리면 뺌 (벽 · 웅덩이 같은 큰 덩어리는 원래 규칙대로 — 길과 겹치면 길을 바꾸거나 장애물을 뺌)
//  · 바닥 장식(풀 · 꽃 · 버섯 · 뼈 · 돌 부스러기 · 자국 등): 길 띠 위에는 찍지 않음
//  · 시작 방은 정해진 대칭 시설물이라 제외
const PATHCLR = (() => {
  const PAD = 16; // 길 가장자리에서 비우는 거리
  const HW1 = 18; // 1장 길 · 개울 반폭 (흙 가장자리 포함)
  const HW4 = 30; // 4장 옛 가도 반폭 (연석 포함 — 40_road4.js HW)
  let cache = null, STG = null; // STG: 방을 꾸미는 중인 장 번호 (decorRoom이 넘겨줌)
  function rects(R) {
    if (!R || !G || R.type === 'start') return [];
    const st = STG != null ? STG : G.stage, key = R.id + ':' + st + ':' + A.x0 + ':' + A.y0 + ':' + A.x1 + ':' + A.y1 + ':' + (R.style && R.style.path);
    if (cache && cache.R === R && cache.key === key) return cache.out;
    const out = [];
    if (st === 1 && R.style && typeof meadowCurves === 'function') {
      const RS0 = ROOMSTYLE; let cs = []; try { ROOMSTYLE = R.style; cs = meadowCurves(); } finally { ROOMSTYLE = RS0; }
      const e = HW1 + PAD;
      for (const c of cs) { const lo = Math.max(c.a, c.vert ? A.y0 - 30 : A.x0 - 30), hi = Math.min(c.b, c.vert ? A.y1 + 30 : A.x1 + 30);
        for (let t = lo; t <= hi; t += 8) { const m = c.at(t), x = c.vert ? m : t, y = c.vert ? t : m; out.push({ x0: x - e, y0: y - e, x1: x + e, y1: y + e }); } }
    }
    if (st === 4 && R.type !== 'boss' && R.type !== 'altar' && !(G.dun && G.dun.forge) && typeof ROAD4 !== 'undefined') {
      const d = R.doors || {}, e = HW4 + PAD, cx = Math.round(CX / 2) * 2, cy = Math.round(CY / 2) * 2;
      if (d.n != null || d.s != null) out.push({ x0: cx - e, y0: A.y0 - 40, x1: cx + e, y1: A.y1 + 40 });
      if (d.w != null || d.e != null) out.push({ x0: A.x0 - 40, y0: cy - e, x1: A.x1 + 40, y1: cy + e });
    }
    cache = { R, key, out }; return out;
  }
  const over = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
  const hitRect = (R, q) => rects(R).some(b => over(q, b));
  const hitPt = (R, x, y, r = 0) => hitRect(R, { x0: x - r, y0: y - r, x1: x + r, y1: y + r });
  const obsVis = b => b.t === 'pillar' ? { x0: b.x - b.r * 2.4, y0: b.y - b.r * 6, x1: b.x + b.r * 2.4, y1: b.y + b.r } : { x0: b.x - b.r - 2, y0: b.y - b.r * 1.8, x1: b.x + b.r + 2, y1: b.y + b.r };

  // 둥근 장애물: 길 띠에 그림이 걸리면 뺌 (소품을 놓기 전에)
  { const o = decorRoom; decorRoom = function (r, stage, keyPts) {
      STG = stage; cache = null;
      if (r && r.obs && r.type !== 'start' && !SR_LAYOUT[r.type]) { const n0 = r.obs.length;
        let S = []; try { S = typeof makeObsSprites === 'function' ? makeObsSprites(r) || [] : []; } catch (e) { S = []; } // 실제 그림(나무 잎 · 기둥 머리 포함)으로 잼
        const vis = b => { const s = S.find(s => s.cv && Math.abs(b.y - s.sy) <= 2 && Math.abs(b.x - (s.x + s.cv.width / 2)) <= 8); return s ? { x0: s.x, y0: s.y, x1: s.x + s.cv.width, y1: s.y + s.cv.height } : obsVis(b); };
        r.obs = r.obs.filter(b => !(b.c && (b.t === 'rock' || b.t === 'pillar') && hitRect(r, vis(b))));
        if (r.obs.length !== n0) r.nav = buildNav(r.obs); }
      STG = stage; cache = null; try { return o.apply(this, arguments); } finally { STG = null; cache = null; } }; }
  // 바닥 장식: withDecor로 찍는 것 · decFree로 자리를 묻는 것 모두 길 띠를 피함
  { const o = withDecor; withDecor = function (g, R, fn) { if (!R || typeof fn !== 'function') return o.apply(this, arguments);
      return o.call(this, g, R, () => { if (DEC && DEC.solid) for (const q of rects(R)) DEC.solid.push(q); return fn(); }); }; }
  { const o = decFree; decFree = function (x, y, r = 6) { if (!o(x, y, r)) return false; const R = typeof CUR_ROOM !== 'undefined' ? CUR_ROOM : null; return !(R && G && hitPt(R, x, y, r)); }; }
  return { PAD, rects, hitRect, hitPt };
})();
