'use strict';
// 잿빛 왕관 원정대 — 48_moon.js : v3.23 「다시 뜨는 초승달」 — 원정에 실패하고 시작 장소에서 다시 깨어나기 직전
// 캄캄한 화면 오른쪽 아래 작은 창에서 초승달이 한 바퀴 돎: 오른쪽 구름 뒤로 지고 → 해 대신 같은 초승달이 왼쪽 구름 뒤에서 다시 떠오름
// 2px 칸 도트, 글자 · 얼굴 없음 (약 3.6초). 아무 키나 누르면 건너뜀. window.MOONSKY_OFF = true면 끔
const MOONSKY = (() => {
  { const st = document.createElement('style'); st.textContent = 'body.moonsky .hud{visibility:hidden!important}'; document.head.appendChild(st); } // 장면 동안 HUD 숨김
  const DUR = 3.6, C = 2, PW = 84, PH = 56; // 화면 오른쪽 아래 작은 창 (84×56칸 = 168×112px)
  let pending = false, S = null, OX = 0, OY = 0;
  const cell = (x, y, c, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(OX + Math.round(x) * C, OY + Math.round(y) * C, w * C, h * C); };
  const STARS = (() => { const a = []; let s = 11; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 26; i++) a.push({ x: Math.floor(r() * PW), y: Math.floor(r() * 30), b: r(), tw: r() < 0.25 }); return a; })();
  function cloud(cx, cy, bumps, pal) { const [o, d, m, l] = pal, pts = [];
    for (const [bx, by, r] of bumps) for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6 && by + y <= 0) pts.push([cx + bx + x, cy + by + y, by + y, r, x, y]);
    const key = new Set(pts.map(p => p[0] + ',' + p[1]));
    for (const p of pts) for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1]]) if (!key.has((p[0] + dx) + ',' + (p[1] + dy))) cell(p[0] + dx, p[1] + dy, o);
    for (const p of pts) cell(p[0], p[1], p[2] > -2 ? d : m);
    for (const p of pts) if (p[4] + p[5] < -p[3] * 0.55 && p[2] < -1) cell(p[0], p[1], l);
  }
  const CL_B = ['#0c1230', '#252c5a', '#323a70', '#424a88'], CL_F = ['#0a0e26', '#3a4280', '#4e58a0', '#7a84c8'];
  // 초승달 (반지름 7칸, 얼굴 없음): 둥근 쪽이 왼쪽 아래
  function moon(cx, cy, hz) { const R = 7, off = [3, -2], inC = (x, y) => x * x + y * y <= R * R && (x - off[0]) ** 2 + (y - off[1]) ** 2 > (R - 1) * (R - 1);
    for (let y = -R - 3; y <= R + 3; y++) for (let x = -R - 3; x <= R + 3; x++) { const d = Math.hypot(x, y); if (d > R + 0.5 && d < R + 3 && (x + y) % 2 === 0 && !inC(x, y) && cy + y < hz) cell(cx + x, cy + y, '#2a2e52'); }
    for (let y = -R - 1; y <= R + 1; y++) for (let x = -R - 1; x <= R + 1; x++) { if (inC(x, y) || cy + y >= hz) continue; if (inC(x + 1, y) || inC(x - 1, y) || inC(x, y + 1) || inC(x, y - 1)) cell(cx + x, cy + y, '#5a4020'); }
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) if (inC(x, y) && cy + y < hz) cell(cx + x, cy + y, x + y > 2 ? '#f0c860' : x + y < -7 ? '#fffbe0' : '#ffe8a0');
  }
  function draw(t) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH); // 다시 깨어나기 전의 캄캄한 화면
    const a = t < 0.3 ? t / 0.3 : t > DUR - 0.4 ? (DUR - t) / 0.4 : 1; // 들고 나는 것은 마지막에 검은 막으로 (망점 가장자리가 비치지 않게)
    OX = VW - PW * C - 20; OY = VH - PH * C - 20;
    ctx.save(); ctx.beginPath(); ctx.rect(OX, OY, PW * C, PH * C); ctx.clip(); // 창 밖으로 구름이 삐져나오지 않게
    const top = ['#070a1c', '#0b1026', '#101834', '#16204a'], hz = 40;
    for (let y = 0; y < PH; y++) { const k = y / hz * (top.length - 1), i = Math.min(top.length - 1, Math.floor(k)), f = k - i; ctx.fillStyle = top[i]; ctx.fillRect(OX, OY + y * C, PW * C, C); if (f > 0.5 && i + 1 < top.length) { ctx.fillStyle = top[i + 1]; for (let x = y % 2; x < PW; x += 2) ctx.fillRect(OX + x * C, OY + y * C, C, C); } }
    for (const s of STARS) { const on = 0.5 + 0.5 * Math.sin(t * (3 + s.b * 4) + s.b * 20); if (s.tw && on > 0.75) { cell(s.x, s.y, '#ffffff'); cell(s.x - 1, s.y, '#8a9ad8'); cell(s.x + 1, s.y, '#8a9ad8'); cell(s.x, s.y - 1, '#8a9ad8'); cell(s.x, s.y + 1, '#8a9ad8'); } else cell(s.x, s.y, on > 0.4 ? '#c8d0ff' : '#4a5488'); }
    const dr = t * 2;
    cloud(Math.round(18 - dr * 0.5), hz - 3, [[-6, 0, 3], [-1, -2, 4], [5, 0, 3]], CL_B); cloud(Math.round(66 - dr * 0.4), hz - 5, [[-7, 0, 3], [-1, -2, 5], [6, 0, 4]], CL_B);
    // 달: 지평선 아래를 중심으로 한 바퀴 — 꼭대기 → 오른쪽으로 내려가 구름 뒤로 지고 → 아래를 돌아 → 왼쪽 구름 뒤에서 다시 떠 꼭대기로
    const p = Math.min(1, Math.max(0, (t - 0.25) / (DUR - 0.75))), e = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p), th = -Math.PI / 2 + e * Math.PI * 2;
    moon(Math.round(PW / 2 + Math.cos(th) * 27), Math.round(hz + 6 + Math.sin(th) * 25), hz + 1);
    cloud(Math.round(10 + dr * 0.3), hz + 1, [[-6, 0, 4], [1, -2, 5], [8, 0, 3]], CL_F); cloud(Math.round(42 + Math.sin(t * 0.8)), hz + 1, [[-8, 0, 4], [-1, -3, 5], [7, -1, 4], [13, 0, 3]], CL_F); cloud(Math.round(76 - dr * 0.3), hz + 1, [[-6, 0, 4], [1, -2, 5], [7, 0, 3]], CL_F);
    ctx.fillStyle = '#0a0e26'; ctx.fillRect(OX, OY + (hz + 1) * C, PW * C, (PH - hz - 1) * C); for (let x = 0; x < PW; x += 2) cell(x + ((x >> 1) % 2), hz + 1, '#141a3c');
    // 가장자리: 푸른 밤이 망점으로 성기어지며 검은 화면으로 빠짐 (테두리 없음)
    { const B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]; ctx.fillStyle = '#000';
      const fa = Math.max(0, Math.min(1, 1 - Math.ceil(a * 4) / 4));
      for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const dx = (x + 0.5 - PW / 2) / (PW / 2), dy = (y + 0.5 - PH / 2) / (PH / 2), d = Math.sqrt(dx * dx * 0.9 + dy * dy * 1.1), f = Math.max((d - 0.55) / 0.42, fa * 1.0001); if (f <= 0) continue; if (f >= 1 || f * 16 > B4[(y % 4) * 4 + (x % 4)]) ctx.fillRect(OX + x * C, OY + y * C, C, C); } }
    ctx.restore();
  }
  // ---------------------------------------------------------------- 연결: 실패 결과 → 다음 원정 시작 장소에 들어올 때 한 번
  const _sr = showResult; showResult = function (win, ...a) { if (!win) pending = true; return _sr.call(this, win, ...a); };
  const _en = HOME.enter; HOME.enter = function (...a) { const r = _en.apply(this, a); if (pending && !window.MOONSKY_OFF && G && G.home) { /* 다시 떠나는 길(re)이어도 실패 뒤라면 */ S = { t: 0, n: SAVE.runs }; document.body.classList.add('moonsky'); sfx('blip', 0.5); } pending = false; return r; };
  const _up = HOME.update; HOME.update = function (dt) { if (S && G && G.home) { S.t += dt; const any = Object.keys(pressed).some(k => pressed[k]) || mouse.down; if (S.t > 0.6 && any) S.t = Math.max(S.t, DUR - 0.45); if (S.t >= DUR) { S = null; document.body.classList.remove('moonsky'); for (const k in pressed) pressed[k] = false; } return true; } if (S) { S = null; document.body.classList.remove('moonsky'); } return _up.call(this, dt); };
  const _sc = HOME.screen; HOME.screen = function (...a) { if (S) { draw(S.t); return; } return _sc.apply(this, a); };
  return { draw, DUR, get on() { return !!S; }, get pending() { return pending; }, test(n) { pending = true; } };
})();
