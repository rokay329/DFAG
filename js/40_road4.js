'use strict';
// ================================================================ v3.20 4장 잿빛 왕도: 재에 덮인 희미한 옛 가도 — 판석 (시안 4장_가도_시안1 B안)
//  · 방에 북 · 남 문이 있으면 세로 가도, 서 · 동 문이 있으면 가로 가도 → 둘 다면 「+」, 하나면 「일자」
//  · 바닥(성채 → 잿빛)을 깐 바로 다음 · 재 더께보다 먼저 그려서, 위에 내려앉는 재가 가도를 군데군데 덮음
//  · 낮은 대비 · 2px 칸 · 디더는 재 경계에만. 보스 방 · 제단 방 · 대장간은 없음
const ROAD4 = (() => {
  const hh = (x, y, s) => FP.hh(x, y, s);
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sm = v => v * v * (3 - 2 * v), a = (i, j) => hh(xi + i, yi + j, s); return (a(0, 0) * (1 - sm(fx)) + a(1, 0) * sm(fx)) * (1 - sm(fy)) + (a(0, 1) * (1 - sm(fx)) + a(1, 1) * sm(fx)) * sm(fy); };
  // 바닥 잿빛보다 한 톤 따뜻하고 살짝 밝은 돌 (튀지 않게 대비를 낮춤)
  const ST = ['#56524a', '#4a463f', '#413e38', '#3a3732', '#322f2b', '#252320'];
  const ASH = ['#5e5952', '#77726a', '#948e84', '#4a4640'];
  const HW = 30; // 가도 반폭(px) — 연석 포함
  function paint(g, R) {
    if (!R || R.type === 'boss' || R.type === 'altar' || (G.dun && G.dun.forge)) return;
    const d = R.doors || {}, vert = d.n != null || d.s != null, hor = d.w != null || d.e != null; if (!vert && !hor) return;
    const sd = (R.seed || 1) * 7 + 3;
    const cx = Math.round(CX / 2) * 2, cy = Math.round(CY / 2) * 2;
    // 칸 하나가 가도 위인지 · 가도 축 기준 좌표 (u: 길 방향, w: 가로 방향, -HW..HW)
    const at = (x, y) => { const r = []; if (vert && Math.abs(x + 1 - cx) <= HW) r.push({ u: y, w: x + 1 - cx, ax: 'v' }); if (hor && Math.abs(y + 1 - cy) <= HW) r.push({ u: x, w: y + 1 - cy, ax: 'h' }); return r; };
    const put = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 2, 2); };
    for (let y = A.y0; y < A.y1; y += 2) for (let x = A.x0; x < A.x1; x += 2) {
      const L = at(x, y); if (!L.length) continue;
      const cross = L.length > 1, q = cross ? (Math.abs(L[0].w) < Math.abs(L[1].w) ? L[1] : L[0]) : L[0]; // 교차로는 안쪽 판정
      const aw = Math.abs(q.w), U = q.u, Wc = q.w;
      // 재에 덮이는 정도: 낮은 주파수 얼룩 + 가장자리일수록 두껍게 + 방 가장자리(벽 밑)일수록 두껍게
      const e = Math.min(x - A.x0, A.x1 - x, (y - A.y0) * 1.3, A.y1 - y), edge = Math.max(0, 1 - e / 60);
      const n = vn(x / 46, y / 30, sd), cover = n * 0.9 + (aw / HW) * 0.25 + edge * 0.6 - 0.18;
      if (cover > 0.62) continue; // 재가 완전히 덮음 → 바닥(재)이 그대로
      let c = null;
      const curb = !cross && aw >= HW - 4; // 연석 (가도 양옆 2칸)
      if (curb) { const blk = Math.floor((U + (q.ax === 'v' ? 0 : 3)) / 14); c = (U % 14) < 2 ? ST[5] : aw >= HW - 2 ? ST[hh(blk, 1, sd) < 0.5 ? 2 : 3] : ST[hh(blk, 2, sd) < 0.5 ? 1 : 2]; }
      else { // 판석: 큰 네모 돌 (가로 세 장) · 금 · 이 빠진 모서리 
        const row = Math.floor((Wc + HW) / 18), lenU = 22, off = row % 2 ? 11 : 0, col = Math.floor((U + off) / lenU), sx = (U + off) % lenU, sy = (Wc + HW) % 18;
        c = sx < 2 || sy < 2 ? ST[5] : ST[1 + Math.floor(hh(col, row, sd + 5) * 3)];
        if (sy === 2 && sx >= 2) c = ST[0]; else if (sx === 2 && sy > 2) c = ST[Math.max(0, ST.indexOf(c) - 1)];
        if (c !== ST[5] && hh(col, row, sd + 9) < 0.3 && Math.abs((sx - 2) - (sy - 2) * 1.2 - 4) < 1.2) c = ST[5]; // 금
      }
      if (cover > 0.46) { if (!dith(x >> 1, y >> 1, (cover - 0.46) / 0.16)) put(x, y, c); continue; } // 재 경계: 디더로 바닥에 스며듦 (위에 재 더께가 다시 내려앉음)
      put(x, y, c);
    }
  }
  return { paint };
})();
