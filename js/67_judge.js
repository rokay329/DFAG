// v3.40 기사 「단죄」 돌진 — 검은 실루엣(눈만 붉게) 팔레트 + 지나간 자리의 검은 궤적
// 궤적: 몸 높이만 한 검은 띠 · 눈 높이엔 붉은 선 · 0.35초 동안 꽉 참 → 바둑판 디더 → 성긴 디더 → 사라짐
(() => {
  const D = {}; for (const k in PAL.hKnight) D[k] = '#16141c'; D.k = '#000000'; D.v = '#ff2a2a'; PAL.hKnightDark = D;
  { const Gy = {}; for (const k in PAL.hKnight) { const h = PAL.hKnight[k], L = 0.3 * parseInt(h.slice(1, 3), 16) + 0.59 * parseInt(h.slice(3, 5), 16) + 0.11 * parseInt(h.slice(5, 7), 16), v = Math.round(10 + L * 0.27), hx = n => n.toString(16).padStart(2, '0'); Gy[k] = '#' + hx(v) + hx(v) + hx(Math.min(255, v + 6)); }
    Gy.k = '#0b0a0e'; Gy.v = '#ff2a2a'; PAL.hKnightGray = Gy; if (PAL.hKnightGhost) PAL.hKnightGrayGhost = PAL.hKnightGhost; } // v3.44 철퇴를 든 기사: 밝기만 남긴 어두운 무채색 · 눈만 붉게 (시안10)
  const HW = 8, TOP = -24, BOT = -4, EYE = -16; // 발 기준 몸 칸 범위 (2px 격자)
  const s2 = v => Math.round(v / 2) * 2;
  function cells(f) {
    if (f.cells) return f.cells; const m = new Map(), L = Math.hypot(f.x1 - f.x0, f.y1 - f.y0), n = Math.max(1, Math.ceil(L / 2));
    for (let i = 0; i <= n; i++) { const x = f.x0 + (f.x1 - f.x0) * i / n, y = f.y0 + (f.y1 - f.y0) * i / n, bx = s2(x), by = s2(y);
      for (let X = bx - HW; X <= bx + HW; X += 2) for (let dy = TOP; dy <= BOT; dy += 2) { const Y = by + dy, key = X + ',' + Y;
        const v = (dy === EYE ? 2 : 0) | (dy === TOP || dy === BOT ? 1 : 0), o = m.get(key); m.set(key, o == null ? v : ((o | v) & 2) | (o & v & 1)); } }
    return (f.cells = [...m].map(([k, v]) => { const [X, Y] = k.split(',').map(Number); return [X, Y, v]; }));
  }
  const o = drawFx; drawFx = function (f) {
    if (f.kind !== 'jtrail') return o.apply(this, arguments);
    const k = 1 - f.t / f.max;
    for (const [X, Y, v] of cells(f)) { const chk = (((X + Y) >> 1) & 1) === 0, sp = ((X >> 1) & 1) === 0 && ((Y >> 1) & 1) === 0;
      const on = k < 0.2 ? !((v & 1) && !chk) : k < 0.55 ? chk : sp; if (!on) continue;
      ctx.fillStyle = v & 2 ? (k < 0.55 ? '#ff2a2a' : '#7a1010') : '#0c0a10'; ctx.fillRect(X, Y, 2, 2); }
  };
})();
