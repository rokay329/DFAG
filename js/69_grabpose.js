'use strict';
// 잿빛 왕관 토벌대 — 69_grabpose.js : v3.48 오크에게 잡혔을 때 공용 모션 (잡기 오크 · 우르그 · 크루가쉬 — 재의 잠식은 그대로)
// · 버둥거림: 몸이 0.11초마다 좌우로 2px 흔들리고(오크 잡기는 매달려 좌우로 한 칸씩 기울어짐) · 머리 양옆에 버둥 선이 번갈아 튐
// · SPACE를 누를 때마다 몸이 위로 홱 튀고 버둥 선이 크게 · 오크는 팔을 들어 들어 올리고 무기는 등에 멤(12_chapter3.js)
const GRABPOSE = (() => {
  let ROT = 0;
  const sn = v => Math.round(v / 2) * 2;
  function px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(sn(x), sn(y), 2, 2); }
  function jolt(g) { if (g._m == null) g._m = g.mash || 0; if ((g.mash || 0) > g._m) { g._m = g.mash; g.joltAt = time; } return g.joltAt != null && time - g.joltAt < 0.14 ? 1 - (time - g.joltAt) / 0.14 : 0; }
  function wrapDraw(o) {
    return function () {
      const P = G && G.player, g = P && P.grab; if (!g || P.dead || g.kind === 'ash') return o.apply(this, arguments);
      const orc = g.kind !== 'ash', j = jolt(g), ph = Math.floor(time / 0.11) % 2;
      const jx = (ph ? 2 : -2) * (j > 0 ? 1.5 : 1), jy = j > 0 ? -2 : 0;
      ROT = orc ? (ph ? 1 : -1) * Math.PI / 20 : 0;
      ctx.save(); ctx.translate(Math.round(jx), jy);
      try { o.apply(this, arguments); } finally { ROT = 0; ctx.restore(); }
      const lift = P.lift || 0, cx = P.x + jx, top = P.y - lift - 30 + jy;
      // 버둥 선 (머리 양옆, 번갈아)
      const big = j > 0 ? 1 : 0, col = j > 0 ? '#ffffff' : '#fff0d0';
      for (const s of [-1, 1]) { const on = (ph === (s > 0 ? 1 : 0)) || big; if (!on) continue; const bx = cx + s * (14 + big * 2);
        px(bx, top + 4, col); px(bx + s * 2, top + 2, col); px(bx + s * 2, top + 10, col); px(bx + s * 4, top + 10 + 0, col); px(bx, top + 16, col); px(bx + s * 2, top + 18, col);
        if (big) { px(bx + s * 4, top + 2, col); px(bx + s * 6, top + 10, col); px(bx + s * 4, top + 18, col); } }
    };
  }
  return { wrapDraw, get ROT() { return ROT; } };
})();
{ drawPlayer = GRABPOSE.wrapDraw(drawPlayer); }
{ const o = drawSprite; drawSprite = function (map, pal, scale, x, y, flip, opt) { const r = GRABPOSE.ROT; if (!r || typeof PLAYER_MAPS === 'undefined' || !PLAYER_MAPS.has(String(map).split('__ag')[0])) return o.apply(this, arguments); return o.call(this, map, pal, scale, x, y, flip, Object.assign({}, opt || {}, { rot: ((opt && opt.rot) || 0) + r })); }; }
