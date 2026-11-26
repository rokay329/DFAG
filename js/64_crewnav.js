'use strict';
// 잿빛 왕관 원정대 — 64_crewnav.js : v3.33 거치 무기(투석기 · 발리스타) 빈 자리를 채우러 오는 병사가 좁은 곳에 끼는 문제
//  · 자리까지 길찾기: 무기마다 「무기 몸통을 막은 길찾기 격자」에서 자리로부터 거리를 퍼뜨려 두고, 곧장 갈 수 없으면 그 거리를 따라 돌아감
//  · 자리로 갈 때는 플레이어 포위 자리(slotAng) · 플레이어 쪽 길찾기(steer)를 쓰지 않음 (자리 대신 플레이어 쪽으로 끌려가던 문제)
//  · 같은 무기의 병사끼리 · 자기 무기 몸통과는 서로 밀지 않음 (13_update_render.js 적끼리 밀기에서 뺌)
//  · 그래도 막히면: 자리 가까이(36 안)에서 1초 넘게 못 다가가면 자리로 붙고, 멀리서 2.5초 넘게 못 다가가면 자리를 내놓음 (6초 동안 다시 뽑히지 않음)
const CREWNAV = (() => {
  const CACHE = new WeakMap(); // 무기 → { nav, key, dist[] (자리별) }
  function postOf(c, g) {
    if (c.type === 'gcatapult') return [c.px + GCAT.POST[g.post][0] * c.face, c.py + GCAT.POST[g.post][1]];
    if (c.type === 'gballista') return GBAL.posts(c)[g.post];
    if (c.type === 'ghellaltar') return GHELL.posts(c)[g.post]; // v3.34 지옥불 의식대
    return null;
  }
  function field(c, post, i) {
    if (!G.nav) return null;
    let F = CACHE.get(c); const key = G.nav;
    if (!F || F.key !== key || F.px !== c.px || F.py !== c.py) {
      // 무기 몸통을 막은 격자 (자리 둘레는 비워 둠)
      const nav = new Uint8Array(G.nav), br = Math.max(8, (c.r || 18) - 4), posts = [0, 1].map(k => postOf(c, { post: k }));
      for (let j = 0; j < NR; j++) for (let k = 0; k < NC; k++) {
        const x = A.x0 + (k + 0.5) * NAV, y = A.y0 + (j + 0.5) * NAV;
        if (Math.hypot(x - c.px, y - c.py) < br && !posts.some(p => p && Math.hypot(x - p[0], y - p[1]) < 12)) nav[j * NC + k] = 0;
      }
      F = { key, px: c.px, py: c.py, nav, dist: [] }; CACHE.set(c, F);
    }
    if (!F.dist[i]) { // 자리 칸이 막혀 있으면 가장 가까운 빈 칸에서 퍼뜨림
      let [sx, sy] = post, s = navIdx(sx, sy);
      if (s < 0 || !F.nav[s]) { let bd = 1e9; for (let n = 0; n < F.nav.length; n++) if (F.nav[n]) { const x = A.x0 + (n % NC + 0.5) * NAV, y = A.y0 + ((n / NC | 0) + 0.5) * NAV, dd = Math.hypot(x - sx, y - sy); if (dd < bd) { bd = dd; s = n; } } if (s >= 0) { sx = A.x0 + (s % NC + 0.5) * NAV; sy = A.y0 + ((s / NC | 0) + 0.5) * NAV; } }
      F.dist[i] = navFlood(F.nav, sx, sy);
    }
    return F;
  }
  function clearTo(F, x0, y0, x1, y1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 6); for (let k = 1; k < n; k++) { const i = navIdx(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n); if (i >= 0 && !F.nav[i]) return false; } return true; }
  function dirTo(g, c, px, py) {
    const direct = Math.atan2(py - g.y, px - g.x), F = field(c, [px, py], g.post); if (!F) return direct;
    if (clearTo(F, g.x, g.y, px, py)) return direct;
    const D = F.dist[g.post], s = navIdx(g.x, g.y); if (!D || s < 0) return direct;
    const i = s % NC, j = (s / NC) | 0; let best = -1, bd = D[s] >= 0 ? D[s] : 1e9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NC || nj >= NR) continue; const n = nj * NC + ni, v = D[n]; if (v >= 0 && v < bd) { bd = v; best = n; } }
    if (best < 0) return direct;
    return Math.atan2(A.y0 + ((best / NC | 0) + 0.5) * NAV - g.y, A.x0 + (best % NC + 0.5) * NAV - g.x);
  }
  function walk(g, ang, spd, dt) { // 적 moveTo와 같되 steer(플레이어 쪽 끌림) 없이
    if (g.haste > 0) spd *= 1.5; if (g.rallyT > 0) spd *= 1.25;
    g.x += Math.cos(ang) * spd * dt; g.y += Math.sin(ang) * spd * dt; g.walk += dt * spd / 7; if (Math.abs(Math.cos(ang)) > 0.2) g.face = Math.cos(ang) > 0 ? 1 : -1;
  }
  function release(g, c) { if (c.crew && c.crew[g.post] === g) c.crew[g.post] = null; g.crewOf = null; g.atPost = false; g.crewBan = time + 6; g.cnav = null; }
  function wrap(M) {
    const o = M.updCrew; M.updCrew = function (g, dt, d, a, moveTo) {
      const c = g.crewOf;
      if (!c || c.dead || d < 30 || g.atPost || g.state !== 'chase') { g.cnav = null; return o.apply(this, arguments); }
      const p = postOf(c, g); if (!p) return o.apply(this, arguments);
      const dd = Math.hypot(p[0] - g.x, p[1] - g.y); if (dd <= 4) { g.cnav = null; return o.apply(this, arguments); }
      const S = g.cnav || (g.cnav = { best: dd, t: 0 });
      if (dd < S.best - 3) { S.best = dd; S.t = 0; } else S.t += dt;
      if (dd < 36 && S.t > 1.0) { g.x = p[0]; g.y = p[1]; g.cnav = null; return o.apply(this, arguments); } // 거의 다 왔는데 막힘 → 자리로 붙음
      if (S.t > 2.5) { release(g, c); return false; } // 멀리서 막힘 → 자리를 내놓음
      walk(g, dirTo(g, c, p[0], p[1]), g.spd * 1.6, dt); return true;
    };
    const r = M.recruit; M.recruit = function (e) { // 방금 자리를 내놓은 병사는 6초 동안 다시 뽑지 않음
      const ban = G.enemies.filter(o => !o.dead && o.crewBan > time && !o.crewOf); ban.forEach(o => { o.crewOf = o.__tmpBan = true; });
      try { return r.apply(this, arguments); } finally { ban.forEach(o => { if (o.__tmpBan) { o.crewOf = null; delete o.__tmpBan; } }); } };
  }
  if (typeof GCAT !== 'undefined') wrap(GCAT);
  if (typeof GBAL !== 'undefined') wrap(GBAL);
  return { postOf, field, wrap };
})();
