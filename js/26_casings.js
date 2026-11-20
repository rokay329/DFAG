// v3.16 탄피: 총을 쏠 때마다 총 뿌리에서 탄피가 튀어 나와 바닥에 떨어져 잠깐 굴렀다가 사라짐
// 그레이브 = 금색 탄피 (고래 작살총 제외) · 하비 = 빨간 산탄 탄피 (끝은 놋쇠)
// 칸(2px) 단위 도트 · 공중에서는 가로 → 세로 → 뒤집은 가로 → 뒤집은 세로로 칸 단위 회전 · 바닥에 닿으면 한 번 튀고 눕는다
const CASING = (() => {
  const C = 2;
  const PAL = {
    k: '#0b0a0e',
    H: '#fff0a8', Y: '#e8b84a', d: '#9a6a1a',                // 금색 탄피: 밝은 면 · 몸통 · 그늘(테두리 쪽)
    h: '#ff9a80', R: '#d8402e', r: '#8a1c1c', B: '#e8b84a', b: '#9a6a1a', // 빨간 산탄 탄피: 밝은 면 · 몸통 · 그늘 · 놋쇠 머리
  };
  const SPR = { // 누운 모양 (오른쪽이 뒤끝) — 바깥 외곽선은 그릴 때 1칸 둘러 붙임
    gold: ['HYd', 'Ydd'],
    red: ['hRRB', 'rrrb'],
  };
  const OUTLINE = true;
  const tr = rows => rows[0].split('').map((_, x) => rows.map(r => r[x]).join(''));        // 가로 ↔ 세로
  const mir = rows => rows.map(r => r.split('').reverse().join(''));                        // 좌우 뒤집기
  const FR = {}; for (const k in SPR) { const a = SPR[k]; FR[k] = [a, tr(a), mir(a), mir(tr(a))]; }
  const CV = {};
  function art(kind, f) {
    const key = kind + f; if (CV[key]) return CV[key];
    const rows = FR[kind][f], w = rows[0].length, h = rows.length, o = OUTLINE ? 1 : 0;
    const c = document.createElement('canvas'); c.width = (w + o * 2) * C; c.height = (h + o * 2) * C; const g = c.getContext('2d');
    if (o) { g.fillStyle = PAL.k; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.fillRect((x + o + dx) * C, (y + o + dy) * C, C, C); }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { g.fillStyle = PAL[rows[y][x]]; g.fillRect((x + o) * C, (y + o) * C, C, C); }
    return (CV[key] = c);
  }
  let room = null;
  const list = () => { const R = G.dun && G.dun.cur; if (room !== R) { room = R; G.casings = []; } return (G.casings = G.casings || []); };
  // x, y: 총 뿌리 위치(화면상) · ground: 그 사람이 서 있는 바닥 y · ang: 겨눈 방향
  function spawn(kind, x, y, ground, ang) {
    const L = list(); if (L.length > 48) L.shift();
    const back = Math.cos(ang) >= 0 ? -1 : 1;                                // 겨눈 쪽 반대로 튀어 나감
    L.push({ kind, x, gy: ground + rand(-3, 3), z: Math.max(4, ground - y), vx: back * rand(40, 80), vy: rand(-12, 12), vz: rand(110, 150), spin: rand(0, 4), lie: Math.random() < 0.5 ? 0 : 2, bounce: 0, rest: 0, life: 1.8 });
  }
  function update(dt) {
    if (!G || !G.dun) return; const L = list();
    for (const s of L) {
      if (s.rest) { s.life -= dt; continue; }
      { // v3.16 장애물·벽에 막힘: 바닥 자리(x, gy)로 검사해 부딪히면 튕겨 나옴 (장애물 위로 올라가지 않게)
        const nx = s.x + s.vx * dt, ny = s.gy + s.vy * dt, hit = (x, y) => x < A.x0 + 2 || x > A.x1 - 2 || y < A.y0 + 2 || y > A.y1 - 2 || solidAt(x, y, 2);
        if (!hit(nx, ny)) { s.x = nx; s.gy = ny; }
        else if (!hit(nx, s.gy)) { s.x = nx; s.vy = -s.vy * 0.4; }
        else if (!hit(s.x, ny)) { s.gy = ny; s.vx = -s.vx * 0.4; }
        else { s.vx = -s.vx * 0.4; s.vy = -s.vy * 0.4; }
      }
      s.z += s.vz * dt; s.vz -= 520 * dt; s.spin += dt * 18;
      if (s.z <= 0 && G.obs && G.obs.length && obsHitL(G.obs, s.x, s.gy, 1, false)) { s.life = 0; continue; } // 구덩이에 떨어지면 사라짐
      if (s.z <= 0) { s.z = 0; if (!s.bounce) { s.bounce = 1; s.vz = -s.vz * 0.35; s.vx *= 0.5; s.vy *= 0.5; } else { s.rest = 1; s.vx = s.vy = s.vz = 0; } }
    }
    G.casings = L.filter(s => s.life > 0);
  }
  function drawOne(s) {
    if (s.rest && s.life < 0.45 && Math.floor(s.life * 14) % 2) return;     // 사라지기 직전엔 깜빡임
    const f = s.rest ? s.lie : Math.floor(s.spin) % 4, c = art(s.kind, f);
    const x = snap2(s.x) - (c.width >> 1) & ~1, y = snap2(s.gy - s.z) - c.height;
    ctx.drawImage(c, x, y);
  }
  function ents(ents) { if (!G || !G.casings) return; for (const s of G.casings) ents.push({ y: s.gy - 1, d: () => drawOne(s) }); }
  return { spawn, update, ents, art };
})();
