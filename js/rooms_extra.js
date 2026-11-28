'use strict';
// 잿빛 왕관 원정대 · rooms_extra.js — 합친 파일: 48_moon.js, 49_pups.js, 50_swap.js, 51_shrine.js, 52_bloodaltar.js, 53_pathclear.js, 54_out2.js, 55_out3.js, 56_orc3.js, 57_out4.js, 58_walldeco.js, 59_pillars.js (v3.84 파일 정리 · typeof로 먼저 확인하는 이름 몇 개는 var로 선언)

// ==================================================================== 48_moon.js
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
;

// ==================================================================== 49_pups.js
'use strict';
// 잿빛 왕관 원정대 — 49_pups.js : v3.23 2장 사냥개 → 갈색 강아지 · 3장 전투 늑대 → 회색 강아지
// 등장인물이 수인이라 너무 사실적이던 개 도트를 머리를 키운 덜 사실적인 비율로. 너무 귀엽지 않게 주둥이 · 붉은 눈은 남기고 (이빨은 그리지 않음),
// 명암은 기존 몬스터처럼 어두운 윤곽 + 채도 낮은 3단 (등 밝게 · 배 어둡게). 갈색 사냥개는 가시 목줄, 회색 늑대는 쫑긋한 귀 · 가죽 끈 · 뼈 장식
(() => {
  // v3.23 사용자 수정 도트 (사냥개 · 늑대)
  const DOG = [
    '...........kkkk.....',
    '..........kDDLLkk...',
    '.........kDDDLLddk..',
    '..k......kDDDddddk..',
    '.kdk.....kDDdddEedk.',
    '.kdk.....kLdddddddkk',
    '..kdk....kLdddddLLLk',
    '..kdkkkkkkDddddLLLE.',
    '..kdLLLLLDDddddkkk..',
    '..kdLLddddDDrgrgk...',
    '..kddddddddDDDdk....',
    '..kDDkkkDDkkkDDk....',
    '..kDDk.kDDk.kDDk....',
    '...kDDk.kDDk.kDDk...',
    '...kkkk.kkkk.kkkk...',
  ];
  const WOLF = [
    '...........k...k....',
    '..........kdk.kLk...',
    '..........kddkdLdk..',
    '..........kdddddddk.',
    '.k.......kLddddEedk.',
    'kLk......kLdddddddkk',
    'kLLk.....kLddddmmmmk',
    '.kdLk...kkDdddmmmmE.',
    '..kdLkkkkDDddmmkkk..',
    '..kdLLLLDDDddmmk....',
    '..kdLddddDDcbcbk....',
    '..kddddddddDDDdk....',
    '..kddk.kddk.kDDk....',
    '..kDDk.kDDk.kDDk....',
    '...kDDk.kDDk.kDDk...',
    '...kkkk.kkkk.kkkk...',
  ];
  // 걸음: 다리 칸만 바꿈 (대각선 한 쌍씩 들어 올림)
  // 걸음: 사용자 도트의 다리(비스듬히 내딛은 모양)와, 다리를 곧게 모은 모양을 번갈아
  const straight = M => { const R = M.slice(), n = R.length; R[n - 2] = R[n - 3]; R[n - 1] = R[n - 3].replace(/[dDL]/g, 'k'); return R; };
  MAPS.nDog = DOG; MAPS.nDogW1 = straight(DOG); MAPS.nDogW3 = DOG;
  MAPS.nWolf = WOLF; MAPS.nWolfW1 = straight(WOLF); MAPS.nWolfW3 = WOLF;
  // 기존 몬스터와 같은 결: 아주 어두운 윤곽 · 채도 낮은 3단 명암(등은 밝게 · 배는 어둡게) · 붉게 빛나는 눈
  PAL.nDog = { k: '#100c0c', d: '#8e6448', D: '#5c3e2c', L: '#b88e6e', /* v3.23 어두운 성채 바닥에서 보이게 두 단계 밝게 */  E: '#1a1010', e: '#ff3b2c', n: '#1a1010', r: '#7a1a22', g: '#b89040' };
  PAL.nWolf = { k: '#0a080c', d: '#5a5664', D: '#36323e', L: '#8a8694', m: '#b4b0bc', E: '#1a1010', e: '#ff3a20', n: '#1a1010', c: '#5a3a22', b: '#d8d0b8' };
})();
;

// ==================================================================== 50_swap.js
'use strict';
// 잿빛 왕관 토벌대 — 50_swap.js : v3.25 무기 바꾸기 모션 「뽑아 들기」 (숫자키 · 휠 · 터치 버튼)
// 든 무기를 아래로 내리며 몸을 낮춰 거두고(0.09초), 새 무기를 들어 올리며 몸을 펴 쥔다(0.17초). 쥐는 순간 작게 반짝임.
// 판정 · 쿨타임은 그대로이고 그림만 바뀜. 공격 · 기술을 시작하면 모션은 바로 끝남.
  const SWAPFX = (() => {
    const OUT = 0.09, IN = 0.17, D = OUT + IN;
    let t0 = -9, old = null;
    const ease = q => 1 - Math.pow(1 - q, 3), back = q => { const c = 1.9; return 1 + (c + 1) * Math.pow(q - 1, 3) + c * Math.pow(q - 1, 2); };
    const bell = (q, a, b) => q <= a || q >= b ? 0 : Math.sin((q - a) / (b - a) * Math.PI), st2 = v => Math.round(v / 2) * 2;
    const el = () => time - t0;
    function on() { const P = G && G.player; if (!P) return false; if (el() >= D || el() < 0) return false; if (!['idle', 'rattack'].includes(P.state)) { t0 = -9; return false; } return true; }
    function start(oldTex) { if (on() && el() < OUT) oldTex = old; /* 바꾸는 중에 또 바꾸면: 지금 보이는 무기를 거두는 것부터 다시 */ old = oldTex; t0 = time; }
    // 손에 든 무기 그리기를 비틈 (drawBlade에서 부름)
    function mod(b, x, y, ang) {
      const f = G.player.face || 1, e = el();
      if (e < OUT) { const p = e / OUT; if (!old) return null; return { b: old, x, y: y + p * 4, ang: ang + f * 1.4 * p, a: 1 - p }; }
      const q = Math.min(1, (e - OUT) / IN), k = back(q);
      return { b, x, y, ang: ang + f * 1.9 * (1 - k), a: Math.min(1, 0.35 + q * 2.2), w: q < 0.22 };
    }
    // 몸 동작 (playerPose와 같은 형식): 무기를 내리며 몸을 낮췄다가, 새 무기를 들어 올리며 몸을 펴고 제자리
    function pose(P) {
      const f = P.face || 1, e = el(), o = Math.min(1, e / OUT), q = e < OUT ? 0 : Math.min(1, (e - OUT) / IN);
      const dn = e < OUT ? ease(o) : 1 - Math.min(1, q / 0.35), up = bell(q, 0.25, 0.85);
      return { dx: st2(f * 2 * dn), dy: st2(2 * dn - 2 * up), sx: 1 + 0.06 * dn - 0.04 * up, sy: 1 - 0.07 * dn + 0.06 * up, rot: 0.1 * f * dn - 0.05 * f * up };
    }
    // 새 무기를 쥔 순간의 반짝임 (2px 칸) — 무기를 다 그린 뒤 위에
    function post() {
      const P = G.player, e = el() - OUT; if (e < 0) return; const q = e / IN; if (q <= 0.45 || q >= 0.95) return;
      const f = P.face || 1, gx = snap2(P.x + f * 8) + f * 4, gy = snap2(P.y - 6) - 10, n = Math.sin((q - 0.45) / 0.5 * Math.PI) > 0.6 ? 2 : 1;
      ctx.save(); ctx.fillStyle = '#fff4d8'; ctx.fillRect(gx - 1, gy - 1, 2, 2);
      for (let i = 1; i <= n; i++) { ctx.fillRect(gx - 1 + i * 2, gy - 1, 2, 2); ctx.fillRect(gx - 1 - i * 2, gy - 1, 2, 2); ctx.fillRect(gx - 1, gy - 1 + i * 2, 2, 2); ctx.fillRect(gx - 1, gy - 1 - i * 2, 2, 2); }
      ctx.restore();
    }
    return { on, start, mod, pose, post, D };
  })();
;

// ==================================================================== 51_shrine.js
'use strict';
// 잿빛 왕관 토벌대 — 51_shrine.js : v3.25 빛의 샘 (1~4장 · 챕터마다 특수방 1개)
// 바닥: 원형 돌바닥(외딴 관측탑과 같은 동심원 부채꼴 판석) 위에 빛의 3원색 마법진 셋이 삼각형으로 겹쳐 있고, 마법진마다 빛기둥이 솟는다.
// 세 빛기둥이 겹친 가운데에 흰 구체가 떠 있고, 거기서 빛을 바쳐 각인 한 장을 얻는다 (모은 빛 = 재화).
// 같은 색을 살수록 비싸짐 15 → 30 → 45. 그 색 세 번째부터는 가진 각인을 완성하거나 새 각인 (예전 3단계와 같은 규칙).
  const SHRINE = (() => {
    const PRICE = [15, 30, 45], CS = ['r', 'b', 'g'];
    const SY = 1.9, FRX = 176, CRX = 54, CRY = Math.round(CRX / SY);
    const price = c => PRICE[Math.min(PRICE.length - 1, (G.engBuy && G.engBuy[c]) || 0)];
    const fc = () => ({ x: CX, y: Math.round((CY + 8) / 2) * 2 }); // 바닥 가운데
    const circ = () => { const F = fc(); return { r: { x: F.x - 24, y: F.y - 12 }, g: { x: F.x + 24, y: F.y - 12 }, b: { x: F.x, y: F.y + 14 } }; }; // 빨 왼쪽 위 · 초 오른쪽 위 · 파 아래 (빛의 3원색 그림처럼)
    const orbAt = () => { const F = fc(); return { x: F.x, y: F.y - 40 }; };
    const COL = { r: ['#ff4a4a', '#a01828', '#ffb0a0'], b: ['#5aa8ff', '#1e4a9a', '#b8dcff'], g: ['#6ad84a', '#2e7a1a', '#c8f8a8'] };
    // ---------------------------------------------------------------- 바닥 (방 바닥 캔버스에 한 번 그림)
    function floor(g, px, dith) {
      const F = fc(), RW = 22, hsh = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
      // 장마다 그 지형에 어울리는 돌 색 (1장 이끼 낀 회녹 · 2장 성채 회보라 · 3장 흙빛 · 4장 잿빛)
      const PALS = {
        1: { a: '#44494a', b: '#3f4444', c: '#494e4c', hi: '#585e5a', hi2: '#505652', sh: '#343a38', gap: '#1c241a', sp: '#4e6a3a', dk: '#38403a', rimT: '#545a54', rim: '#3e4440', rimD: '#262c26', rub: '#2e3830' },
        2: { a: '#4a4654', b: '#45414f', c: '#4f4b59', hi: '#5e5a68', hi2: '#56525f', sh: '#3a3644', gap: '#22202a', sp: '#625e6c', dk: '#3e3a48', rimT: '#5a5664', rim: '#423e4c', rimD: '#2e2a36', rub: '#34303c' },
        3: { a: '#4e4640', b: '#48403a', c: '#544a42', hi: '#665a50', hi2: '#5c5248', sh: '#3a322c', gap: '#2a201a', sp: '#6e6052', dk: '#40362e', rimT: '#62564c', rim: '#463c34', rimD: '#2e261e', rub: '#3a2e24' },
        4: { a: '#57545a', b: '#504d54', c: '#5c5960', hi: '#6e6a72', hi2: '#646068', sh: '#423f46', gap: '#2e2b30', sp: '#7a7680', dk: '#48454c', rimT: '#68646c', rim: '#4a474e', rimD: '#333036', rub: '#3e3b42' } };
      const FS = PALS[G.stage] || PALS[2];
      // 부서짐: 가장자리로 갈수록 판석이 통째로 빠지거나(땅이 드러남) 덩어리 소음 + 디더로 깎여 나감. 가운데(마법진 자리)는 온전
      const vn = (x, y, s, k) => { const X = x / s, Y = y / s, x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, sm = t => t * t * (3 - 2 * t), a = hsh(x0 * 7 + k, y0), b = hsh(x0 * 7 + 7 + k, y0), c = hsh(x0 * 7 + k, y0 + 1), d = hsh(x0 * 7 + 7 + k, y0 + 1), u = sm(fx), v = sm(fy); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
      const cl = v => Math.max(0, Math.min(1, v));
      const sid = (x, y) => { const dx = x + 1 - F.x, dy = (y + 1 - F.y) * SY, r = Math.hypot(dx, dy); if (r > FRX) return -2; const ring = Math.floor(r / RW); if (ring < 1) return 0;
        const n = Math.max(6, Math.round(2 * Math.PI * (ring + 0.5) * RW / 40)), a = (Math.atan2(dy, dx) + Math.PI * 2 + ring * 0.37) % (Math.PI * 2); return ring * 1000 + Math.floor(a / (Math.PI * 2) * n); };
      const broken = id => { if (id <= 0) return false; const ring = Math.floor(id / 1000), u = (ring + 0.5) * RW / FRX; return hsh(id, 11) < Math.pow(cl((u - 0.5) / 0.5), 1.3) * 0.7; };
      const ry = Math.ceil((FRX + 10) / SY) + 2;
      for (let y = (F.y - ry) & ~1; y <= F.y + ry; y += 2) for (let x = (F.x - FRX - 12) & ~1; x <= F.x + FRX + 12; x += 2) {
        const dx = x + 1 - F.x, dy = (y + 1 - F.y) * SY, r = Math.hypot(dx, dy), u = r / FRX;
        if (r > FRX + 10) continue;
        const N = vn(x, y * SY, 18, 5), N2 = vn(x, y * SY, 7, 9), bx = x >> 1, by = y >> 1;
        if (r > FRX) { if (!dith(bx, by, cl((N - 0.38) * 3.2 + (N2 - 0.5) * 0.6))) continue; // 테두리는 군데군데 끊김
          px(x, y, r > FRX + 8 ? FS.rimD : dy < 0 ? (r < FRX + 4 ? FS.rimT : FS.rim) : (r < FRX + 4 ? FS.rim : FS.rimD)); continue; }
        const keep = 1 - cl((u - 0.74) / 0.26 * 1.15 + (N - 0.5) * 0.9 + (N2 - 0.5) * 0.35); // 가장자리 깎임 (덩어리 소음 + 디더)
        if (keep < 1 && !dith(bx, by, keep)) { if (keep > 0.15 && dith(bx + 1, by + 2, 0.12)) px(x, y, FS.rub); continue; } // 깎인 자리엔 부스러기 몇 알
        const me = sid(x, y);
        if (broken(me)) { if (dith(bx, by, 0.16)) px(x, y, (bx + by) % 3 ? FS.rub : FS.gap); continue; } // 통째로 빠진 판석: 땅 위에 부스러기만
        const v = hsh(me, 3); let c = v < 0.34 ? FS.a : v < 0.7 ? FS.b : FS.c;
        if (sid(x + 2, y) !== me || sid(x, y + 2) !== me) c = FS.gap; else if (sid(x, y - 2) !== me) c = broken(sid(x, y - 2)) ? FS.sh : FS.hi; else if (sid(x - 2, y) !== me) c = FS.hi2; else if (sid(x + 4, y) !== me || sid(x, y + 4) !== me) c = FS.sh;
        else { const n = hsh(x, y * 7 + 1); if (n < 0.05 + (G.stage === 1 ? 0.04 * u : 0)) c = FS.sp; else if (n > 0.95) c = FS.dk; } // 1장은 가장자리로 갈수록 이끼 점
        px(x, y, c);
      }
    }
    // ---------------------------------------------------------------- 마법진 (바닥에 굽지 않고 따로 한 장 — 각인을 고르면 디더로 사라짐)
    let CIRC = null;
    function circCv() {
      const F = fc(); if (CIRC && CIRC.x === F.x && CIRC.y === F.y) return CIRC;
      const x0 = ((F.x - 24 - CRX - 6) & ~1), y0 = ((F.y - 12 - CRY - 6) & ~1), [cv, g2] = mkCanvas(2 * CRX + 48 + 12, 2 * CRY + 26 + 12), px = (x, y, c) => { g2.fillStyle = c; g2.fillRect((Math.round(x) & ~1) - x0, (Math.round(y) & ~1) - y0, 2, 2); };
      // 세 빛의 마법진: 바깥 고리 · 안쪽 고리 · 그 사이 룬 눈금 · 안쪽은 옅은 디더 물듦
      const C = circ();
      // 마법진 무늬(고리 · 룬 눈금 · 안쪽 삼각형)만 그림 — 바닥을 칠하지 않음. 다른 마법진 안을 지나는 무늬는 빛의 3원색 혼합 색 (빨+초 노랑 · 초+파 청록 · 빨+파 자홍 · 셋 다 흰색)
      const MIX = { r: COL.r, g: COL.g, b: COL.b, rg: ['#ffd84a', '#9a7a14', '#fff0a8'], gb: ['#4ae0e8', '#1a7480', '#b8f8ff'], rb: ['#d05aff', '#6a2296', '#f0b8ff'], rgb: ['#ffffff', '#a8aec4', '#ffffff'] };
      for (const c of CS) { const o = C[c];
        const pm = (x, y, ti) => { const key = ['r', 'g', 'b'].filter(k => k === c || Math.hypot((x - C[k].x) / CRX, (y - C[k].y) / CRY) < 1.01).join(''); px(x, y, MIX[key][ti]); }; // ti: 0 밝은 본색 · 1 어두운 색 · 2 가장 밝은 색
        const ring = (k, ti) => { const n = Math.round(2 * Math.PI * CRX * k / 1.6); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pm(o.x + Math.cos(a) * CRX * k, o.y + Math.sin(a) * CRY * k, ti); } };
        ring(1, 2); ring(0.96, 0); ring(0.8, 0); ring(0.56, 2);
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + 0.13; for (const k of [0.86, 0.92]) pm(o.x + Math.cos(a) * CRX * k, o.y + Math.sin(a) * CRY * k, i % 3 ? 2 : 0); } // 룬 눈금
        for (let i = 0; i < 3; i++) { const a0 = i / 3 * Math.PI * 2 - Math.PI / 2, a1 = a0 + Math.PI * 2 / 3; for (let t = 0; t <= 1; t += 0.04) pm(o.x + (Math.cos(a0) * (1 - t) + Math.cos(a1) * t) * CRX * 0.56, o.y + (Math.sin(a0) * (1 - t) + Math.sin(a1) * t) * CRY * 0.56, 1); } // 안쪽 삼각형
      }
          return (CIRC = { cv, x: F.x, y: F.y, x0, y0 });
    }
    // ---------------------------------------------------------------- 빛기둥 (색마다 한 번 만든 디더 그림을 더하기 합성으로)
    const BEAM = {}, BH = 150;
    function beam(c, f = 0) { // v3.67 f: 0~7 — 무늬와 옅은 띠가 천천히 위로 흘러가는 8장
      const key = c + f; if (BEAM[key]) return BEAM[key];
      const w = Math.round(CRX * 0.66 / 2) * 2, H = BH + CRY + 4, [cv, g] = mkCanvas(w * 2 + 2, H), [r, gg, b] = [1, 3, 5].map(i => parseInt(COL[c][0].slice(i, i + 2), 16));
      const BY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (let x = 0; x <= w * 2; x += 2) { const u = (x + 1 - w) / w, side = 1 - u * u, yb = BH - Math.round(CRY * 0.66 * Math.sqrt(Math.max(0, side)) / 2) * 2; /* 기둥은 마법진 뒤쪽 테두리에서 솟음 — 바닥 마법진(겹친 색)이 가려지지 않게 */ if (side <= 0) continue;
        for (let y = 0; y < yb; y += 2) { const t = y / yb, wave = 0.86 + 0.14 * Math.sin(t * Math.PI * 3 + f * Math.PI / 4), lv = Math.pow(t, 1.3) * (0.35 + 0.65 * side) * 0.9 * wave; /* 아래(바닥)가 진하고 위로 옅어짐 · v3.67 옅은 띠가 위로 흐름 */ if (lv * 16 <= BY[(((y >> 1) + (f >> 1)) & 3) * 4 + ((x >> 1) & 3)]) continue;
          g.fillStyle = `rgb(${r},${gg},${b})`; g.fillRect(x, y, 2, 2); } }
      return (BEAM[key] = { cv, w });
    }
    // 흰 구체 (2px 칸 원판 · 왼쪽 위 빛)
    let ORB = null;
    function orbCv() {
      if (ORB) return ORB; const R = 6.5, N = 14, o = (N - 1) / 2, [cv, g] = mkCanvas((N + 2) * 2, (N + 2) * 2); g.translate(2, 2); // 명암으로 둥근 구체 (왼쪽 위 빛 · 오른쪽 아래 그늘 · 가장자리 반사광) + v3.67 외곽선 (검정 대신 푸른 보라 · 왼쪽 위는 밝게)
      const L = [-0.55, -0.62, 0.56], ln = Math.hypot(...L), TONE = ['#3a4470', '#56629a', '#8492c2', '#b8c4e4', '#e6ecfa', '#ffffff'];
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const dx = (i - o) / R, dy = (j - o) / R, r2 = dx * dx + dy * dy; if (r2 > 1) continue;
        const nz = Math.sqrt(1 - r2), sh = (dx * L[0] + dy * L[1] + nz * L[2]) / ln; let t = sh > 0.93 ? 5 : sh > 0.72 ? 4 : sh > 0.45 ? 3 : sh > 0.12 ? 2 : sh > -0.25 ? 1 : 0;
        if (r2 > 0.72 && dx + dy > 0.6 && t < 2) t = t + 1; // 오른쪽 아래 가장자리 반사광 (그늘보다 한 단계 밝게)
        g.fillStyle = TONE[t]; g.fillRect(i * 2, j * 2, 2, 2); }
      const inO = (i, j) => { const dx = (i - o) / R, dy = (j - o) / R; return i >= 0 && j >= 0 && i < N && j < N && dx * dx + dy * dy <= 1; };
      for (let j = -1; j <= N; j++) for (let i = -1; i <= N; i++) { if (inO(i, j)) continue; if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inO(i + a, j + b))) continue;
        g.fillStyle = (i - o) + (j - o) < -2 ? '#7a84c4' : (i - o) + (j - o) > 2 ? '#2e3468' : '#4a5296'; g.fillRect(i * 2, j * 2, 2, 2); }
      return (ORB = cv);
    }
    // 각인을 고른 뒤 사라짐: 구체 0~0.5초(떠오르며) → 빛기둥 0.2~1.2초 → 바닥 마법진 0.6~1.8초. 다시 와도 없음
    const cl = v => Math.max(0, Math.min(1, v));
    function fade(R) { if (!R.shrineUsed) return { orb: 1, beam: 1, circ: 1, e: 0 }; const e = R.shrineT != null ? time - R.shrineT : 99; return { orb: 1 - cl(e / 0.5), beam: 1 - cl((e - 0.2) / 1.0), circ: 1 - cl((e - 0.6) / 1.2), e }; }
    function ents(R, list) {
      const K = fade(R), Cc = circCv();
      if (K.circ > 0) list.push({ y: -1e9, d: () => { ctx.save(); ctx.globalAlpha = K.circ; ctx.drawImage(Cc.cv, Cc.x0, Cc.y0); ctx.restore(); } }); // 바닥 마법진 (가장 먼저)
      const C = circ(), used = false, fl = (0.46 + Math.sin(time * 2.2) * 0.05) * K.beam; if (K.orb <= 0 && K.beam <= 0) return;
      if (K.beam > 0) for (const c of CS) { const o = C[c], B = beam(c);
        list.push({ y: o.y, d: () => { const B2 = beam(c, Math.floor(time * 5) % 8); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fl; ctx.drawImage(B2.cv, o.x - B2.w - 1, o.y - BH);
          const [r, gg, b] = [1, 3, 5].map(i => parseInt(COL[c][0].slice(i, i + 2), 16)); ctx.fillStyle = `rgb(${Math.min(255, r + 90)},${Math.min(255, gg + 90)},${Math.min(255, b + 90)})`; // v3.67 기둥 안을 천천히 떠오르는 빛 알갱이
          for (let i = 0; i < 6; i++) { const k = (time * 0.18 + i / 6 + (c === 'b' ? 0.33 : c === 'g' ? 0.66 : 0)) % 1, X = Math.round((o.x + Math.sin(time * 1.3 + i * 2.1) * B2.w * 0.55) / 2) * 2, Y = Math.round((o.y - 8 - k * (BH - 20)) / 2) * 2; ctx.globalAlpha = fl * Math.sin(k * Math.PI) * 1.4; ctx.fillRect(X, Y, 2, 2); }
          ctx.restore(); } }); }
      // 둥둥 떠 있는 느낌: 느린 위아래(최대 6px, 2px 칸) + 아주 작은 좌우 흔들림 · 바닥 그림자는 높이에 따라 크기와 진하기가 바뀜
      const F = fc(), O = orbAt(), ph = time * 1.7, lift = used ? 0 : Math.sin(ph) * 6 + Math.sin(ph * 2.3) * 1.2, bob = -Math.round(lift / 2) * 2, sway = used ? 0 : Math.round(Math.sin(time * 0.9) * 1.6 / 2) * 2;
      const rise = K.e > 0 ? Math.round(Math.min(K.e, 0.5) * 24 / 2) * 2 : 0; // 사라지며 떠오름
      if (K.orb > 0) list.push({ y: F.y - 2, d: () => { const k = (lift + 7) / 14, rx = Math.round((9 - k * 3) / 2) * 2, ry = Math.max(2, rx / 3); ctx.save(); ctx.globalAlpha = (0.5 - k * 0.2) * K.orb; ctx.fillStyle = '#0b0a0e';
        for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) ctx.fillRect(Math.round((O.x + sway) / 2) * 2 + x - 1, F.y - 6 + y, 2, 2); ctx.restore(); } }); // 바닥 그림자 (디더)
      if (K.orb > 0) list.push({ y: F.y + 20, d: () => { const cv = orbCv(); /* 빛기둥 셋을 다 그린 뒤 */ ctx.save(); ctx.globalAlpha = K.orb; ctx.drawImage(cv, Math.round((O.x + sway - cv.width / 2) / 2) * 2, Math.round((O.y + bob - rise - cv.height / 2) / 2) * 2);
        if (K.orb >= 1) { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { const a = time * 1.6 + i * Math.PI / 2, x = Math.round((O.x + sway + Math.cos(a) * 18) / 2) * 2, y = Math.round((O.y + bob + Math.sin(a) * 7) / 2) * 2; ctx.fillRect(x, y, 2, 2); } }
        ctx.restore(); } });
    }
    function lights(R, list) {
      const C = circ(), K = fade(R), O = orbAt();
      for (const c of CS) { if (K.beam > 0) list.push({ x: C[c].x, y: C[c].y - 30, r: 96, a: 0.75 * K.beam, c: HUES[c].rgb, ca: 0.12 * K.beam }); if (K.circ > 0) list.push({ x: C[c].x, y: C[c].y, r: 70, a: 0.6 * K.circ, c: HUES[c].rgb, ca: 0.08 * K.circ }); } // 기둥 · 바닥 마법진
      if (K.orb > 0) list.push({ x: O.x, y: O.y + 30, r: 80, a: 0.5 * K.orb, c: '255,255,255', ca: 0.05 * K.orb }); // 구체 명암이 하얗게 날아가지 않게 빛은 구체 아래(바닥)에 약하게
    }
    // ---------------------------------------------------------------- 각인 카드
    function cardFor(c) { // 그 색 카드 한 장 (처음 열 때 정해 두고 다시 굴리지 않음)
      if (!G.eng) engReset();
      const mine = G.eng[c], pool = Object.keys(ENG).filter(k => ENG[k].c === c && ENG[k].t === engT() && !mine.includes(k));
      const opts = pool.map(k => ({ k, done: false }));
      if (((G.engBuy && G.engBuy[c]) || 0) >= 2) for (const k of mine) if (!G.engC.has(k)) opts.push({ k, done: true });
      return opts.length ? opts[randi(0, opts.length - 1)] : null;
    }
    function ensure(R) { if (!R.shrineOpts) { R.shrineOpts = {}; for (const c of CS) R.shrineOpts[c] = cardFor(c); } return R.shrineOpts; }
    function interact(R) {
      if (!R || R.type !== 'shrine' || R.shrineUsed) return null; const P = G.player, F = fc(), O = orbAt();
      if (Math.hypot(P.x - F.x, (P.y - F.y) * 1.4) > 66) return null;
      return { k: 'shrine', o: O, x: O.x, y: O.y - 22, t: 'F 건드리기' };
    }
    function open() {
      const R = G.dun && G.dun.cur; if (!R || R.type !== 'shrine' || R.shrineUsed) return;
      const O = ensure(R); mode = 'shrine'; sfx('grogi', 1.4);
      $('engTitle').innerHTML = '빛의 샘';
      $('engSub').textContent = '빛을 바쳐 각인 하나를 얻습니다. 흰 빛은 한 번만 응답합니다.';
      $('engChoices').innerHTML = CS.map((c, i) => { const o = O[c], H = HUES[c], p = price(c), have = G.pal[c] || 0;
        if (!o) return `<button class="choice engC none" data-c="${c}" style="--ec:${H.c}"><span class="engHue">${H.n}</span><b>받을 수 있는 각인이 없습니다</b><span class="engD">이 빛의 각인을 모두 얻었습니다.</span><span class="key">${i + 1}</span></button>`;
        const E = ENG[o.k], poor = have < p;
        return `<button class="choice engC${o.done ? ' done' : ''}${poor ? ' poor' : ''}" data-c="${c}" style="--ec:${H.c};--ecd:${ENG_ICOL[c].M[2]}"><span class="engHue">${H.n}</span><span class="engSeal"><img src="${engSeal(o.k, o.done)}" data-seal="${o.k}${o.done ? '+' : ''}" alt=""></span>${o.done ? '<span class="engDone">완성</span>' : ''}<b>${E.n}</b><span class="engD">${o.done ? E.x : E.d}</span><span class="engCost"><img src="${hueURL(c)}" alt="">${p} <span style="color:#8a8494">(보유 ${have})</span></span><span class="key">${i + 1}</span></button>`; }).join('');
      $('engChoices').querySelectorAll('[data-c]').forEach(bt => bt.addEventListener('click', () => buy(bt.dataset.c)));
      { let lv = $('shrineLeave'); if (!lv) { lv = document.createElement('button'); lv.id = 'shrineLeave'; lv.className = 'pbtn shrineLeave'; lv.innerHTML = '닫기 <span class="key kc">ESC</span>'; lv.addEventListener('click', close); $('engChoices').after(lv); } lv.style.display = ''; } // 카드 줄 아래
      $('ovEng').classList.add('on');
    }
    function close() { $('ovEng').classList.remove('on'); { const lv = $('shrineLeave'); if (lv) lv.style.display = 'none'; } if (mode === 'shrine') mode = 'play'; for (const k in pressed) pressed[k] = false; }
    function buy(c) {
      const R = G.dun && G.dun.cur, Op = R && R.shrineOpts, o = Op && Op[c]; if (!o) { sfx('block'); return; }
      const p = price(c); if ((G.pal[c] || 0) < p) { sfx('block'); lootFeed(`${HUES[c].n}이 ${p - (G.pal[c] || 0)}개 모자랍니다`, '#ff9a8a', 2000); return; }
      G.pal[c] -= p; G.engBuy[c] = (G.engBuy[c] || 0) + 1; R.shrineUsed = true; R.shrineT = time;
      close(); chooseEng(o.k, o.done); // 각인 얻기 · 알림 · 고리 · 팔레트 갱신 (09_skills.js)
      const O = orbAt(); for (let i = 0; i < 28; i++) { const t = rand(0, TAU), sp = rand(40, 120); G.parts.push({ x: O.x, y: O.y, vx: Math.cos(t) * sp, vy: Math.sin(t) * sp * 0.6 - 20, t: rand(0.4, 0.9), c: pick([HUES[c].c, '#ffffff', '#ffffff']), g: 60 }); }
      sfx('heal', 1.1);
    }
    return { floor, interact, open, close, ents, lights, price };
  })();
;

// ==================================================================== 52_bloodaltar.js
'use strict';
// 잿빛 왕관 원정대 — 52_bloodaltar.js : v3.26 잊힌 틈새의 두 제단
// · 이름: 왼쪽(무기 → 생명력) 「생명의 제단」 · 오른쪽(생명력 → 무기) 「피의 제단」
// · 두 제단은 장애물 (밟고 지나갈 수 없음 · 몬스터 길 찾기 격자에도 반영)
// · 바닥: 검은 그을음(가장자리는 디더로 각 장 바닥에 녹아듦 · 재 티끌) + 두 제단에서 가운데 제단으로 끌린 핏자국 + 말라붙은 핏자국
// · 바치는 연출 — 생명의 제단: 무기가 날아가 핏물 그릇에 가라앉고, 끓어오른 핏물에서 하트가 솟아 주인공에게 날아옴
//                 피의 제단: 주인공에게서 하트 두 개와 핏방울이 그릇으로 빨려 들어가고, 핏물이 끓어오르다 핏빛 기둥과 함께 무기가 솟음
// 다른 파일은 고치지 않고 함수를 감싸서 끼워 넣음 (테스트 단축키 한 줄만 13에)
const BLOODALT = (() => {
  const NAME = { gear: '생명의 제단', heart: '피의 제단' };
  const josa = (s, a, b) => { const c = String(s).charCodeAt(String(s).length - 1); return s + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? a : b); };
  const surf = a => ({ x: a.x, y: a.y - 30 }); // 핏물 그릇 수면 (제단 그림 4번째 줄)
  const room = () => { const R = G && G.dun && G.dun.cur; return R && R.type === 'secret' && R.altars ? R : null; };
  let S = null, lastT = 0; const DR = [], BUB = [];

  // ================================================================ 문구 (게임 텍스트 규칙: 「~합니다」 체)
  altarText = function (a) {
    if (a.k === 'gear') { const f = altarFodder();
      if (G.stats.hp >= HEART_CAP) return { t: `F ${NAME.gear} — 생명력이 이미 가득 찼습니다`, ok: false };
      if (!f) return { t: `F ${NAME.gear} — 바칠 무기가 없습니다`, ok: false };
      return { t: `F ${NAME.gear} — 무기를 바쳐 생명력(♥)을 얻습니다 · 바칠 무기 「${f.name}」`, ok: true }; }
    return G.stats.hp > 4 ? { t: `F ${NAME.heart} — 생명력(♥♥)을 바쳐 무기를 얻습니다`, ok: true } : { t: `F ${NAME.heart} — 생명력이 부족합니다 (♥♥♥ 이상 필요)`, ok: false };
  };

  // ================================================================ 바치기 (연출이 끝날 때 결과가 들어옴)
  useAltar = function (a) {
    if (S) return;
    const t = altarText(a); if (!t.ok) { sfx('block'); lootFeed(t.t.replace(/^F\s+/, ''), '#ff7070'); return; }
    const R = G.dun.cur, P = G.player; for (const o of R.altars) if (o !== a) o.used = true; // 두 제단 중 하나만 — 하나를 쓰면 다른 쪽도 닫힘
    if (a.k === 'gear') { const f = altarFodder(); SAVE.inv = SAVE.inv.filter(i => i !== f); G.fieldItems = G.fieldItems.filter(i => i !== f); persist();
      S = { k: 'gear', a, R, t: 0, it: f, from: { x: P.x, y: P.y - 20 }, ev: {} }; sfx('select'); }
    else { heartDown(2); S = { k: 'heart', a, R, t: 0, ev: {} }; sfx('hit', 0.8); flashT = Math.max(flashT, 0.08); flashColor = '#5a0a10'; }
  };
  function heartGain(name) { // heartUp과 같은 계산 · 문구만 게임 텍스트 규칙으로
    const P = G.player, before = G.stats.hp;
    G.heartBonus = (G.heartBonus || 0) + Math.max(0, Math.min(2, HEART_CAP - before)); G.stats = calcStats(G.buffs);
    const d = G.stats.hp - before; P.hp = clamp(P.hp + Math.max(0, d), 1, G.stats.hp); hudPrev.heart = null;
    sfx('legend'); G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 8, grow: 200, t: 0.6, max: 0.6, c: '#ff5a64' });
    lootFeed(d > 0 ? `${josa(`「${name}」`, '을', '를')} 바쳐 최대 생명력이 ♥ 1칸 늘었습니다` : `${josa(`「${name}」`, '을', '를')} 바쳤습니다 — 생명력이 이미 가득 찼습니다`, '#ff5a64', 3000);
  }
  function weaponGain(a, here) {
    const x = here ? a.x : G.player.x, y = here ? a.y - 4 : G.player.y + 6, r = Math.random() * 100;
    if (r >= 99.5) { const it = makeRBY(G.cls); spawnLoot('gear', x, y, it); lootFeed('생명력(♥♥)을 바쳤습니다 — <b style="color:#ff2a2a">RGB?</b>', '#ff2a2a', 4000); return; } // v2.40 RGB? 0.5%
    const gk = r < 20 ? 'rare' : r < 96.5 ? 'unique' : 'legend', owned = new Set(SAVE.inv.filter(i => i.cls === G.cls && i.wk != null).map(i => i.wk)),
      cands = wcat(G.cls).filter(o => o.grade === gk && !(o.i === 10 && !leg2Open(G.cls)) && !weaponLocked(G.cls, o.i)), fresh = cands.filter(o => !owned.has(o.i)), pickW = pick(fresh.length ? fresh : cands),
      it = makeItem(G.cls, pickW ? { grade: gk, wk: pickW.i } : { grade: gk });
    spawnLoot('gear', x, y, it); lootFeed(`생명력(♥♥)을 바쳤습니다 — ${gradeOf(it).n} 무기`, gradeOf(it).c, 3000);
  }
  function climax(a) { // 그릇의 핏물이 다 쓰임 (제단이 꺼진 그림으로)
    a.used = true; flashT = Math.max(flashT, 0.15); flashColor = '#a01218'; sfx('boss'); addShake(5);
    const s = surf(a); burst(s.x, s.y, '#a3161c', 16); G.fx.push({ kind: 'skybeam', x: a.x, y: a.y - 6, w: 22, c: '200,30,40', t: 0.6, max: 0.6, up: true });
    G.fx.push({ kind: 'ring', x: a.x, y: a.y, r: 10, grow: 160, t: 0.5, max: 0.5, c: '#c0202c' });
  }
  function splash(a, n) { const s = surf(a); for (let i = 0; i < n; i++) G.parts.push({ x: s.x + rand(-6, 6), y: s.y, vx: rand(-45, 45), vy: rand(-110, -50), t: rand(0.3, 0.55), c: pick(['#a3161c', '#d83a3a', '#5a0a10']), g: 320, floor: s.y + rand(0, 4) }); }
  function finish() { // 방을 떠나는 등으로 연출이 끊기면 결과만 바로 넣음
    if (!S) return; const { a, k, it } = S, here = G.dun.cur === S.R; a.used = true;
    if (k === 'gear') heartGain(it.name); else weaponGain(a, here); S = null; DR.length = 0; BUB.length = 0;
  }
  const T = { gear: { fly: 0.55, sink: 0.95, rise: 1.25, home: 1.6 }, heart: { pull: 0.75, boil: 1.3 } };
  function tick(dt) {
    if (!S) return; if (G.dun.cur !== S.R) { finish(); return; }
    const a = S.a, s = surf(a), P = G.player, t0 = S.t; S.t += dt; const t = S.t, cross = v => t0 < v && t >= v;
    const bubble = rate => { if (Math.random() < rate * dt) BUB.push({ x: s.x + (rand(-7, 5) & ~1), t: 0, max: rand(0.25, 0.45) }); };
    if (S.k === 'gear') { const K = T.gear;
      if (cross(K.fly)) { splash(a, 10); sfx('drop', 0.6); }
      if (t > K.fly && t < K.sink) bubble(30);
      if (cross(K.sink)) climax(a);
      if (cross(K.rise)) sfx('awaken', 0.6);
      if (t >= K.home) { heartGain(S.it.name); S = null; }
    } else { const K = T.heart;
      if (t < K.pull - 0.15 && Math.random() < 45 * dt) DR.push({ t: 0, max: rand(0.32, 0.45), x0: P.x + rand(-5, 5), y0: P.y - rand(8, 18), hy: rand(16, 34) }); // 핏방울 줄기
      for (const h of [0.08, 0.26]) if (cross(h + 0.48)) { splash(a, 7); sfx('hit', 0.6); }
      if (t > 0.5 && t < K.boil) { bubble(12 + (t - 0.5) * 60); if (Math.random() < 6 * dt) addShake(1); }
      if (t > 0.9 && t < K.boil && Math.random() < 14 * dt) G.parts.push({ x: s.x + rand(-6, 6), y: s.y - 2, vx: rand(-10, 10), vy: rand(-60, -30), t: rand(0.25, 0.45), c: pick(['#d83a3a', '#ff6a6a']), g: 60 }); // 끓어 튀는 방울
      if (cross(K.boil)) { climax(a); weaponGain(a, true); S = null; }
    }
    for (const d of DR) d.t += dt; for (let i = DR.length - 1; i >= 0; i--) if (DR[i].t >= DR[i].max) DR.splice(i, 1);
    for (const b of BUB) b.t += dt; for (let i = BUB.length - 1; i >= 0; i--) if (BUB[i].t >= BUB[i].max) BUB.splice(i, 1);
  }

  // ================================================================ 그림
  const HEART = [".kk.kk.", "krrkrRk", "kwrrrRk", "krrrrRk", ".krrRk.", "..kRk..", "...k..."];
  const HPAL = { k: '#1a0608', r: '#e0303a', R: '#8a1018', w: '#ffc8c8' };
  const heartArt = () => art('bloodalt_heart', () => gCanvas(fromRows(HEART), HPAL));
  const ease = v => v * v * (3 - 2 * v), lerp = (p, q, v) => p + (q - p) * v;
  const arcAt = (x0, y0, x1, y1, h, v) => ({ x: lerp(x0, x1, v), y: lerp(y0, y1, v) - Math.sin(v * Math.PI) * h });
  function drawHeart(x, y, trail) { const c = heartArt();
    if (trail) { ctx.fillStyle = 'rgba(200,30,40,.7)'; for (const [i, p] of trail.entries()) if (i % 2 === 0) ctx.fillRect(snap2(p.x), snap2(p.y), 2, 2); }
    ctx.drawImage(c, snap2(x - c.width / 2), snap2(y - c.height / 2)); }
  function draw() {
    if (!S && !BUB.length) return; const P = G.player;
    for (const b of BUB) { const s = S ? surf(S.a) : null; if (!s) break; const v = b.t / b.max; ctx.fillStyle = v < 0.75 ? '#d83a3a' : '#ff9a9a'; ctx.fillRect(b.x, snap2(s.y - (v < 0.75 ? 0 : 2)), 2, 2); if (v >= 0.75) { ctx.fillRect(b.x - 2, snap2(s.y), 2, 2); ctx.fillRect(b.x + 2, snap2(s.y), 2, 2); } }
    if (!S) return; const a = S.a, s = surf(a), t = S.t;
    if (S.k === 'gear') { const K = T.gear;
      if (t < K.fly) { const v = ease(t / K.fly), p = arcAt(S.from.x, S.from.y, s.x, s.y - 6, 34, v); drawGearIcon(S.it, p.x, p.y + 8); }
      else if (t < K.sink) { const v = (t - K.fly) / (K.sink - K.fly); // 그릇에 가라앉음 (수면 아래는 잘림)
        ctx.save(); ctx.beginPath(); ctx.rect(s.x - 40, s.y - 80, 80, 80); ctx.clip(); drawGearIcon(S.it, s.x + (Math.floor(t * 30) % 2 ? 2 : 0), s.y + 2 + snap2(v * v * 40)); ctx.restore();
        ctx.fillStyle = '#d83a3a'; for (let i = -3; i <= 3; i++) if ((i + Math.floor(t * 20)) % 3 === 0) ctx.fillRect(snap2(s.x + i * 4 - 2), snap2(s.y), 2, 2); } // 수면 물결
      else if (t < K.rise) { const v = ease((t - K.sink) / (K.rise - K.sink)); drawHeart(s.x, s.y - 4 - v * 22); if (Math.floor(t * 16) % 2) { ctx.fillStyle = '#ffd0d0'; ctx.fillRect(snap2(s.x + 8), snap2(s.y - 22 - v * 10), 2, 2); } }
      else { const v = ease((t - K.rise) / (K.home - K.rise)), trail = [], q = { x: P.x, y: P.y - 22 };
        for (let k = 1; k <= 6; k++) { const w = Math.max(0, v - k * 0.04); trail.push(arcAt(s.x, s.y - 26, q.x, q.y, 26, w)); }
        const p = arcAt(s.x, s.y - 26, q.x, q.y, 26, v); drawHeart(p.x, p.y, trail); }
    } else {
      for (const d of DR) { const v = d.t / d.max, p = arcAt(d.x0, d.y0, s.x + rand(-2, 2), s.y, d.hy, v * v); ctx.fillStyle = v < 0.5 ? '#c0202c' : '#7a1018'; ctx.fillRect(snap2(p.x), snap2(p.y), 2, 2); }
      for (const [i, h] of [0.08, 0.26].entries()) { const u = (t - h) / 0.48; if (u < 0 || u >= 1) continue; const v = u * u, x0 = P.x + (i ? 6 : -6), y0 = P.y - 30, trail = [];
        for (let k = 1; k <= 5; k++) trail.push(arcAt(x0, y0, s.x, s.y - 2, 40, Math.max(0, v - k * 0.05)));
        const p = arcAt(x0, y0, s.x, s.y - 2, 40, v); if (u > 0.85 && Math.floor(t * 30) % 2) continue; drawHeart(p.x, p.y, trail); }
    }
  }

  // ================================================================ 바닥 (그을음 · 핏자국) — 2px 칸 · 디더
  const hsh = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }, cl = v => Math.max(0, Math.min(1, v));
  const vn = (x, y, s, k) => { const X = x / s, Y = y / s, x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, sm = t => t * t * (3 - 2 * t), a = hsh(x0 * 7 + k, y0), b = hsh(x0 * 7 + 7 + k, y0), c = hsh(x0 * 7 + k, y0 + 1), d = hsh(x0 * 7 + 7 + k, y0 + 1), u = sm(fx), v = sm(fy); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  function floor(g, R) { // v3.26b 판석 단 → 검은 그을음 (다른 맵 바닥재와 어울리게 — 바닥 위에 그을음 · 재 · 핏자국만 얹음)
    const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x & ~1, y & ~1, 2, 2); };
    const K = ['#141110', '#1c1816', '#24201d', '#2e2925'], ASH = ['#5e5852', '#6e675f'];
    const B = { fresh: '#7a121a', mid: '#5a0a10', dry: '#3e0a0e', old: '#4a0c12' };
    const cx = CX, cy = CY + 8, RX = 150, RY = 62, alt = R.altars || [];
    // 1) 그을음: 가운데 제단과 두 제단 밑에서 가장 짙고 바깥으로 갈수록 옅게 · 덩어리 소음으로 가장자리가 들쭉날쭉 (디더)
    const heat = (X, Y) => { let h = 1 - Math.hypot((X - cx) / RX, (Y - cy) / RY); for (const a of alt) h = Math.max(h, 0.85 - Math.hypot((X - a.x) / 54, (Y - a.y - 2) / 24)); h = Math.max(h, 1 - Math.hypot((X - cx) / 80, (Y - CY + 6) / 30)); return h; };
    const soot = new Set();
    for (let Y = (cy - RY - 30) & ~1; Y <= cy + RY + 30; Y += 2) for (let X = (cx - RX - 40) & ~1; X <= cx + RX + 40; X += 2) {
      const h = heat(X, Y); if (h < -0.15) continue; const bx = X >> 1, by = Y >> 1;
      const N = vn(X, Y * 2.2, 16, 21), N2 = vn(X, Y * 2.2, 6, 4), lv = cl(h * 1.5 + (N - 0.5) * 0.8 + (N2 - 0.5) * 0.3);
      if (!dith(bx, by, lv)) { if (lv > 0.12 && hsh(bx * 5 + 1, by * 3) < 0.035 * lv + 0.01) px(X, Y, hsh(bx, by) < 0.5 ? ASH[0] : ASH[1]); continue; } // 가장자리엔 재 티끌 (흩어지게 — 격자 무늬 없음)
      const d = lv + (hsh(bx, by) - 0.5) * 0.12; px(X, Y, d > 0.85 ? K[0] : d > 0.65 ? K[1] : d > 0.4 ? K[2] : K[3]); soot.add(bx + ',' + by);
      if (lv > 0.5 && hsh(bx * 3, by) < 0.012) px(X, Y, ASH[1]); // 그을음 위 흰 재
    }
    const on = (X, Y) => soot.has((X >> 1) + ',' + (Y >> 1));
    const blot = (x0, y0, rx, ry, lv, col, onSoot) => { for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) { const q = Math.hypot(x / rx, y / ry), X = (x0 + x) & ~1, Y = (y0 + y) & ~1; if (q >= 1) continue; if (onSoot && !on(X, Y)) continue; const n = vn(X, Y * 2, 6, 17); if (dith(X >> 1, Y >> 1, lv * (1 - q) + (n - 0.5) * 0.5)) px(X, Y, col); } };
    // 2) 두 제단에서 가운데 제단 밑동으로 끌린 핏자국 (홈이 아니라 바닥에 흘러 말라붙은 자국 — 끊기며 이어짐)
    for (const sd of [-1, 1]) { const P0 = [cx + sd * 76, CY + 38], P1 = [cx + sd * 68, CY + 12], P2 = [cx + sd * 34, CY + 6];
      for (let t = 0; t <= 1; t += 0.006) { const u = 1 - t, x = u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], y = u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1], w = vn(x, y, 9, 61);
        if (w < 0.3) continue; // 군데군데 끊김
        for (let dy = -2; dy <= 2; dy += 2) for (let dx = -2; dx <= 2; dx += 2) { const X = (Math.round(x) + dx) & ~1, Y = (Math.round(y) + dy) & ~1; if (Math.hypot(dx, dy) > (w > 0.6 ? 2.9 : 2)) continue; px(X, Y, hsh(X, Y) < 0.15 ? B.fresh : t > 0.7 && hsh(X * 3, Y) < 0.5 ? B.dry : B.mid); } } }
    // 3) 가운데 제단 밑동에 고인 피 · 두 제단 둘레의 말라붙은 핏자국 · 튄 핏방울
    blot(cx, CY + 4, 40, 5, 1.1, B.mid, false); blot(cx, CY + 3, 26, 3, 1.2, B.fresh, false);
    for (const a of alt) { blot(a.x, a.y + 4, 26, 7, 0.8, B.old, false); blot(a.x + (a.x < cx ? 6 : -6), a.y + 2, 14, 4, 0.9, B.dry, false);
      for (let i = 0; i < 12; i++) { const an = hsh(i, a.x) * TAU, r = 18 + hsh(i, 5) * 28, X = (a.x + Math.cos(an) * r) & ~1, Y = (a.y + 4 + Math.sin(an) * r * 0.4) & ~1; px(X, Y, hsh(i, 9) < 0.5 ? B.mid : B.dry); } }
    blot(CX, CY - 4, 70, 18, 0.6, 'rgba(0,0,0,.35)'); // 가운데 제단 그늘 (예전 그대로)
  }

  // ================================================================ 기존 함수 감싸기
  { const o = srFloor; srFloor = function (g, R) { if (R && R.type === 'secret') { floor(g, R); return; } return o(g, R); }; }
  { const o = srPlace; srPlace = function (r, stage) { o(r, stage); if (r.type !== 'secret' || !r.altars) return; // 두 제단 = 장애물 (받침 폭 44px · 바닥 쪽 14px)
      for (const a of r.altars) r.obs.push({ t: 'prop', c: false, x: a.x, y: a.y - 6, w: 44, h: 14, x0: a.x - 22, y0: a.y - 12, x1: a.x + 22, y1: a.y + 2 });
      r.nav = buildNav(r.obs); }; }
  { const o = nearInteract; nearInteract = function () { const r = o(); if (S && r && r.k === 'altar') return null; if (r || S) return r;
      const R = room(), P = G.player; if (R && P) for (const a of R.altars) if (!a.used && Math.hypot(P.x - a.x, P.y - a.y) < 40) { const t = altarText(a); return { k: 'altar', o: a, x: a.x, y: a.y - 40, t: t.t, bad: !t.ok }; } // 장애물이 되어 옆에서도 닿게
      return r; }; }
  { const o = drawAltar; drawAltar = function (a) { const sh = S && S.a === a && S.k === 'heart' && S.t > 0.75 ? (Math.floor(time * 24) % 2) * 2 : 0; // 끓어오를 때 제단이 떨림
      if (!sh) return o(a); ctx.save(); ctx.translate(sh, 0); o(a); ctx.restore(); }; }
  { const o = roomEnts; roomEnts = function (list) { o(list); const dt = Math.min(0.05, Math.max(0, time - lastT)); lastT = time; if (!S && !BUB.length) return; tick(dt); list.push({ y: 1e6, d: draw }); }; }
  { const o = roomLights; roomLights = function (lights) { o(lights); if (!S || G.dun.cur !== S.R) return; const s = surf(S.a), k = S.k === 'heart' ? Math.min(1, S.t / T.heart.boil) : 0.7;
      lights.push({ x: s.x, y: s.y, r: 50 + k * 40, a: 0.5 + k * 0.3 + 0.1 * Math.sin(time * 20), c: '220,40,50', ca: 0.12 + k * 0.12 }); }; }

  // 테스트: 잊힌 틈새로 (두 제단을 다시 쓸 수 있게)
  function debugTo() {
    const D = G.dun, R = D.rooms && D.rooms.find(r => r.type === 'secret');
    if (!R) { lootFeed('테스트 — 이 층에는 잊힌 틈새가 없습니다', '#9a8f8a', 2500); return; }
    for (const a of R.altars || []) a.used = false; S = null; R.visited = R.seen = true;
    for (const q of D.rooms) if (q.crack && (D.rooms[q.doors[q.crack.dir]] === R || q.doors[q.crack.dir] === R.id) &&!q.crack.broken) { q.crack.broken = true; const i = FL_CACHE.findIndex(c => c.key === G.stage + ':' + q.id); if (i >= 0) FL_CACHE.splice(i, 1); }
    if (D.cur === R) { lootFeed('테스트 — 제단을 다시 쓸 수 있습니다', '#9fd2ff', 2000); return; }
    goRoom(R, Object.keys(R.doors).find(d => R.doors[d] != null));
  }
  return { NAME, debugTo, busy: () => !!S };
})();
;

// ==================================================================== 53_pathclear.js
'use strict';
// 잿빛 왕관 원정대 — 53_pathclear.js : v3.26 길 둘레 비우기
// 길(1장 흙길 · 옛 돌길 · 개울 / 4장 재에 덮인 옛 가도)이 있는 방은, 길 가장자리에서 PAD(px)까지 환경요소를 두지 않음
//  · 서 있는 소품(나무 · 수풀 · 표지판 등): 그려지는 모양(높이 포함)이 길 띠에 걸리면 놓지 않음 (06 decorRoom의 add에서 검사)
//  · 둥근 장애물(바위 · 기둥 등): 그림이 길 띠에 걸리면 뺌 (벽 · 웅덩이 같은 큰 덩어리는 원래 규칙대로 — 길과 겹치면 길을 바꾸거나 장애물을 뺌)
//  · 바닥 장식(풀 · 꽃 · 버섯 · 뼈 · 돌 부스러기 · 자국 등): 길 띠 위에는 찍지 않음
//  · 들머리는 정해진 대칭 시설물이라 제외
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
      return o.call(this, g, R, () => { if (DEC && DEC.solid) { for (const q of rects(R)) DEC.solid.push(q);
          // v3.35 장애물의 실제 그림(폐허 벽 · 기둥 · 나무 잎 등 발 자리보다 큰 그림) 밑에도 바닥 장식을 찍지 않음 — 통나무가 폐허 벽 밑으로 깔려 보이던 문제
          let S = []; try { S = typeof makeObsSprites === 'function' ? makeObsSprites(R) || [] : []; } catch (e) { S = []; }
          for (const sp of S) if (sp && sp.cv) DEC.solid.push({ x0: sp.x, y0: sp.y, x1: sp.x + sp.cv.width, y1: sp.y + sp.cv.height }); }
        return fn(); }); }; }
  { const o = decFree; decFree = function (x, y, r = 6) { if (!o(x, y, r)) return false; const R = typeof CUR_ROOM !== 'undefined' ? CUR_ROOM : null; return !(R && G && hitPt(R, x, y, r)); }; }
  return { PAD, rects, hitRect, hitPt };
})();
;

// ==================================================================== 54_out2.js
'use strict';
// 잿빛 왕관 원정대 — 54_out2.js : v3.26 시안02 — 2장 벽 바깥 (좌 · 우 · 아래)
// 컨셉: 「무너진 성채」 — 방을 두른 판석 턱 너머로 성채 바닥이 무너져 내린 낭떠러지.
//  · 판석 턱(좌 · 우 · 아래): 간격이 넓은 큰 판석 (벽돌 아님) · 왼쪽 위 빛 · 군데군데 떨어져 나간 모서리
//  · 아래 턱은 앞면이 보이고 밑동이 부서져 낭떠러지로 · 쇠사슬이 매달림
//  · 낭떠러지: 깊어질수록 어둡게(디더) · 찬 안개 띠 (아래층 실루엣 없음)
//  · 떨어져 나간 바닥 조각이 일정 간격으로 반복 — 조각마다 기둥 하나(#090) / 부러진 기둥 하나(#110) / 바닥만 · 어둡고 희미하게
//  · 좌 · 우 · 아래 문: 문틀(게이트) 없음 — 문 자리 턱은 판석 문턱, 밖은 돌다리. 문이 닫히면 다리가 어둠에 잠기고 열리면 디더로 떠오름
//  · 좌 · 우 문 횃불은 4장처럼 맵 안쪽, 문턱 양 끝에 섬 (v3.28)
const OUT2 = (() => {
  const hh = (x, y, s) => FP.hh(x, y, s);
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sm = v => v * v * (3 - 2 * v), a = (i, j) => hh(xi + i, yi + j, s); return (a(0, 0) * (1 - sm(fx)) + a(1, 0) * sm(fx)) * (1 - sm(fy)) + (a(0, 1) * (1 - sm(fx)) + a(1, 1) * sm(fx)) * sm(fy); };
  const ST = ['#8e889a', '#7a7488', '#5e5868', '#423d4c', '#2d2935', '#1c1922', '#131117']; // 2장 돌기둥과 같은 돌빛 (밝 → 어둠)
  const CH = ['#0f0d14', '#0b0a0f', '#08070b', '#050407']; // 낭떠러지 (얕음 → 깊음)
  const FT = ['#3a3842', '#2c2a32', '#24222a', '#1a181f']; // 방 바닥 판석 결 (문턱 · 다리)
  const FD = ['#25232b', '#1d1b22', '#18161c', '#110f15']; // 떨어져 나간 조각 (어둡게 · 희미하게)
  const MIST = '#2e3040', MIST2 = '#1f202b'; // 찬 안개
  const RW = 28, FC = 18, BR = 22; // 판석 턱 두께 · 아래 턱 앞면 · 다리 반폭
  let ON = true;
  const on2 = R => ON && G && G.stage === 2 && R && !['forge', 'home', 'archive', 'lab', 'den', 'ruin', 'boss', 'altar'].includes(R.type) && !(G.dun && G.dun.forge);
  const geo = () => ({ L: A.x0, RR: A.x1, T: A.y0, B: A.y1, BY: CY + 2, SX: DOOR.s.x, top0: A.y0 - 100 });

  function paint(g, R) {
    const px = (x, y, c) => { g.fillStyle = c; g.fillRect(x & ~1, y & ~1, 2, 2); };
    const sd = ((R.seed || 1) * 13 + 7) | 0, { L, RR, T, B, BY, SX, top0 } = geo();
    const D = R.doors || {}, dW = D.w != null && !hiddenDoor(R, 'w'), dE = D.e != null && !hiddenDoor(R, 'e'), dS = D.s != null && !hiddenDoor(R, 's');
    const inRoom = (x, y) => x >= L && x < RR && y < B;
    const gapW = (x, y) => dW && x < L && x >= L - RW && Math.abs(y - BY) < BR, gapE = (x, y) => dE && x >= RR && x < RR + RW && Math.abs(y - BY) < BR, gapS = (x, y) => dS && y >= B && y < B + RW + FC && Math.abs(x - SX) < BR;
    const gap = (x, y) => gapW(x, y) || gapE(x, y) || gapS(x, y);
    const rimZ = (x, y) => y >= top0 && x >= L - RW && x < RR + RW && y < B + RW && !inRoom(x, y) && !gap(x, y);
    const faceZ = (x, y) => x >= L - RW && x < RR + RW && y >= B + RW && y < B + RW + FC && !gap(x, y);
    // 1) 낭떠러지: 턱에서 멀수록 깊게(디더) · 찬 안개 띠
    const depth = (x, y) => Math.max(x < L - RW ? (L - RW) - x : x >= RR + RW ? x - (RR + RW) : 0, y >= B + RW + FC ? y - (B + RW + FC) : 0);
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      if (inRoom(x, y) || rimZ(x, y) || faceZ(x, y) || gap(x, y) || (y < top0 + 100 && x >= L && x < RR)) continue;
      const d = depth(x, y), bx = x >> 1, by = y >> 1, lv = Math.min(1, d / 170);
      let c = dith(bx, by, lv) ? (dith(bx + 1, by, lv - 0.4) ? CH[3] : CH[2]) : (dith(bx, by + 1, 0.55 - lv) ? CH[0] : CH[1]);
      if (d < 70 && dith(bx + 1, by + 2, (1 - d / 70) * 0.55)) c = d < 30 ? '#1c1a24' : '#15131b'; // 벼랑에 붙은 찬 안개 (가장자리가 잘린 그림처럼 보이지 않게)
      const m = vn(x / 60, y / 12, sd + 5) + vn(x / 18, y / 8, sd + 6) * 0.35; if (m > 0.95 && dith(bx + 2, by + 1, (m - 0.95) * 2)) c = m > 1.12 ? MIST : MIST2;
      px(x, y, c);
    }
    const slab = (x, y, ox, oy, sw, sh, pal) => { const u = x - ox, v = y - oy, row = Math.floor(v / sh), off = (row % 2) * (sw >> 1), col = Math.floor((u + off) / sw), sx = (u + off) - col * sw, sy = v - row * sh, k = hh(col, row, sd + 4);
      if (sx === 0 || sy === sh - 2) return pal[3]; if (sy === 0 || sx === 2) return pal[0]; if (hh(x >> 1, y >> 1, sd + 17) < 0.02) return pal[2]; return k < 0.3 ? pal[2] : pal[1]; };
    // 3) 판석 턱 (좌 · 우 · 아래): 큰 판석 한 장이 턱 폭 전체를 덮음 — 판석마다 빛 받는 모서리(위 · 왼쪽) · 그늘 모서리(아래 · 오른쪽) · 낡은 얼룩 · 잔금 · 모서리 이 빠짐
    //    바깥 끝은 한 단 높은 갓돌(밝은 윗선 + 어두운 아랫면)로 마감 · 갓돌 아래로 벼랑 바위 밑면이 들쭉날쭉 이어지다 어둠에 묻힘 · 위쪽 끝은 디더로 사라짐
    const SL = 44; // 판석 길이
    const rimC = (x, y) => { const side = x < L || x >= RR, corner = side && y >= B, u = side ? y - top0 : x - (L - RW), v = corner ? Math.max(x < L ? L - x : x - RR + 2, y - B + 2) : side ? (x < L ? L - x : x - RR + 2) : y - B + 2; // u: 턱을 따라 · v: 방에서 바깥으로 · v3.28 아래 모서리는 좌우 · 아래 턱이 ㄴ자로 이어짐 (갓돌이 모서리를 돌아감)
      const k = corner ? (x < L ? -1 : -2) : Math.floor(u / SL), su = corner ? SL >> 1 : u - k * SL, id = hh(k, side ? (x < L ? 1 : 2) : 3, sd), tone = id < 0.25 ? 1 : id < 0.75 ? 0 : -1;
      const B0 = [ST[3], ST[2], ST[4]], base = tone > 0 ? ST[2] : tone < 0 ? ST[4] : ST[3];
      if (v <= 2) return ST[5]; // 방 쪽 턱 그늘
      if (v >= RW - 6) return v >= RW - 2 ? ST[6] : v >= RW - 4 ? ST[4] : ST[1]; // 갓돌: 밝은 윗선 → 앞면 → 아랫면
      if (su < 2) return ST[6]; // 판석 사이 줄눈
      if (su < 4 || v <= 4) return tone < 0 ? ST[3] : ST[2]; // 빛 받는 모서리
      if (su >= SL - 2) return ST[5]; // 그늘 모서리
      const n = vn(x / 18, y / 18, sd + 13 + k), m = vn(x / 5, y / 5, sd + 19);
      if ((su === 4 || su === SL - 4) && (v === 6 || v === RW - 8) && hh(k, v, sd) < 0.5) return ST[5]; // 모서리 이 빠짐
      const crack = Math.abs((su - 10 - id * 20) - (v - 6) * 0.8) < 1 && id > 0.55 && v > 6 && v < RW - 8; if (crack) return ST[5]; // 잔금
      if (n > 0.66 && dith(x >> 1, y >> 1, (n - 0.66) * 2.4)) return tone < 0 ? ST[5] : ST[4]; // 낡은 얼룩
      if (m > 0.86) return tone > 0 ? ST[1] : ST[2]; // 닳아 반들거리는 자리
      if (hh(x >> 1, y >> 1, sd + 23) < 0.012) return '#4a5a3a'; // 얼룩 이끼
      return base; };
    for (let y = top0 & ~1; y < B + RW + FC + 2; y += 2) for (let x = (L - RW) & ~1; x < RR + RW; x += 2) {
      if (rimZ(x, y)) { if (y < top0 + 30 && dith(x >> 1, y >> 1, (top0 + 30 - y) / 30)) { px(x, y, CH[1]); continue; } px(x, y, rimC(x, y)); }
      else if (faceZ(x, y)) { const v = y - (B + RW), k = Math.floor((x - (L - RW)) / SL), su = (x - (L - RW)) - k * SL; let c = v < 2 ? ST[2] : su < 2 ? ST[6] : su < 4 ? ST[3] : v < 6 ? ST[4] : ST[5]; if (v > FC - 8 && dith(x >> 1, y >> 1, (v - (FC - 8)) / 8)) c = ST[6]; px(x, y, c); }
      else if (gap(x, y)) { const c = bridgePix(gapS(x, y), x, y); px(x, y, c || ST[5]); } } // 문턱: 다리(판석 바닥 · 난간)가 벽 안까지 이어짐
    // 갓돌 아래 벼랑 바위 밑면 (좌 · 우): 들쭉날쭉한 바위가 몇 칸 이어지다 디더로 어둠에 묻힘
    for (let y = (top0 + 30) & ~1; y < B + RW; y += 2) for (const sideX of [-1, 1]) { const ln = 6 + Math.round(vn(y / 9, sideX, sd + 31) * 8) * 2;
      for (let i = 0; i < ln; i += 2) { const x = sideX < 0 ? L - RW - 2 - i : RR + RW + i; if (gap(x + (sideX < 0 ? 2 : -2) * 0, y) || (sideX < 0 ? dW : dE) && Math.abs(y - BY) < BR + 10) continue;
        if (dith(x >> 1, y >> 1, i / ln * 0.9)) continue; px(x, y, i < 4 ? ST[5] : ST[6]); } }
    // 다리 마감: 방 쪽 문턱돌(밝은 턱) · 난간 끝마다 머릿돌 · 다리 옆 판석과 맞닿는 줄눈
    const cap = (x, y) => { for (let j = 0; j < 8; j += 2) for (let i = 0; i < 6; i += 2) px(x + i, y + j, j === 0 ? ST[1] : i === 4 ? ST[4] : j === 6 ? ST[5] : ST[2]); };
    if (dW || dE) for (const [on, xi, xo] of [[dW, L - 4, L - RW], [dE, RR, RR + RW - 6]]) { if (!on) continue;
      for (let y = BY - BR + 4; y < BY + BR - 6; y += 2) { px(xi, y, FT[0]); px(xi + 2, y, ST[2]); } // 문턱돌
      for (const yy of [BY - BR, BY + BR - 8]) { cap(xi === L - 4 ? L - 6 : RR, yy); cap(xo, yy); }
    }
    if (dW) for (let x = L - RW; x < L; x += 2) { px(x, BY - BR - 2, ST[6]); px(x, BY + BR, ST[6]); }
    if (dE) for (let x = RR; x < RR + RW; x += 2) { px(x, BY - BR - 2, ST[6]); px(x, BY + BR, ST[6]); }
    if (dS) { for (let x = SX - BR + 4; x < SX + BR - 4; x += 2) { px(x, B, FT[0]); px(x, B + 2, ST[2]); }
      for (const xx of [SX - BR, SX + BR - 6]) { cap(xx, B); cap(xx, B + RW + FC - 8); }
      for (let y = B; y < B + RW + FC; y += 2) { px(SX - BR - 2, y, ST[6]); px(SX + BR, y, ST[6]); } }
    // 4) 아래 턱에 매달린 쇠사슬
    const chain = (x, y0, len) => { for (let y = y0; y < y0 + len; y += 2) { const ring = ((y - y0) >> 1) % 3; px(x, y, ring === 0 ? ST[2] : ring === 1 ? ST[3] : ST[5]); if (ring === 1) { px(x - 2, y, ST[4]); px(x + 2, y, ST[5]); } } px(x - 2, y0 + len, ST[3]); px(x, y0 + len + 2, ST[3]); px(x + 2, y0 + len, ST[4]); };
    for (let i = 0; i < 7; i++) { const x = (L + (i + 0.3 + hh(i, 4, sd) * 0.4) * (RR - L) / 7) & ~1; if (dS && Math.abs(x - SX) < BR + 24) continue; if (hh(i, 5, sd) < 0.6) chain(x, B + RW + 4, 14 + Math.floor(hh(i, 6, sd) * 22) * 2); }
    // 5) 북문만 다시 (좌 · 우 · 아래 문틀은 없앰)
    if (D.n != null && !hiddenDoor(R, 'n') && !(R.sealW && R.sealW.dir === 'n')) paintDoorCastle(g, 'n');
    R._out2 = { bridges: [dW && bridge('w', R), dE && bridge('e', R), dS && bridge('s', R)].filter(Boolean), k: {} };
  }
  // 다리 한 칸의 색 (문턱 안 · 밖 공통): vert = 남쪽 다리
  function bridgePix(vert, X, Y) { const { BY, SX } = geo(), wv = vert ? X - SX : Y - BY, aw = Math.abs(wv), u = vert ? Y : X;
    if (!vert && wv >= BR) return null; if (vert && aw >= BR + 1) return null;
    let c;
    if (vert) c = aw >= BR - 4 ? (aw >= BR - 2 ? ST[5] : (wv < 0 ? ST[2] : ST[4])) : ((u >> 1) % 7 === 0 ? FT[3] : (u >> 1) % 7 === 1 ? FT[0] : FT[1]);
    else c = wv <= -(BR - 4) ? (wv <= -(BR - 2) ? ST[2] : ST[3]) : wv >= BR - 6 ? (wv >= BR - 2 ? ST[6] : ST[4]) : ((u >> 1) % 7 === 0 ? FT[3] : (u >> 1) % 7 === 1 ? FT[0] : FT[1]);
    if (((u - 6) >> 1) % 14 === 0 && aw >= BR - 4 && aw < BR) c = ST[1]; // 난간 기둥
    return c; }
  // 다리: 문 밖 낭떠러지를 건너는 돌다리 — 판석 바닥 · 양옆 난간 · 난간 기둥 · 밑 그늘 · 멀어지며 디더로 사라짐. 열림 정도(4단계 디더)별로 미리 그림
  function bridge(d, R) {
    const { L, RR, B, BY, SX } = geo(), LEN = 190, vert = d === 's';
    const x0 = d === 'w' ? L - RW - LEN : d === 'e' ? RR + RW : SX - BR - 2, y0 = vert ? B + RW + FC : BY - BR, w = vert ? BR * 2 + 4 : LEN, h = vert ? LEN : BR * 2 + 12;
    const base = document.createElement('canvas'); base.width = w; base.height = h; const g = base.getContext('2d'), px = (x, y, c) => { g.fillStyle = c; g.fillRect(x & ~1, y & ~1, 2, 2); };
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const X = x0 + x, Y = y0 + y, far = vert ? y : d === 'w' ? w - x : x; if (far > 30 && dith(X >> 1, Y >> 1, Math.min(1, (far - 30) / 150))) continue; // 멀어지며 어둠에 묻힘
      const wv = vert ? X - SX : Y - BY;
      if (!vert && wv >= BR) { if (wv < BR + 10 && dith(X >> 1, Y >> 1, 0.55)) px(x, y, CH[3]); continue; } // 다리 밑 그늘 (디더)
      const c = bridgePix(vert, X, Y); if (!c) continue;
      px(x, y, c);
    }
    const lv = [0.25, 0.5, 0.75].map(t => { const c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d'); for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (dith((x0 + x) >> 1, (y0 + y) >> 1, t)) q.drawImage(base, x, y, 2, 2, x, y, 2, 2); return c; });
    return { d, x: x0, y: y0, lv: [...lv, base] };
  }
  { const o = paintRoomFloor; paintRoomFloor = function (R) { const r = o.apply(this, arguments); if (on2(R)) withSeed((R.seed || 1) + 991, () => paint(fg, R)); return r; }; }
  // 다리: 문이 열려 있으면 떠오르고(디더 4단계) 닫히면 어둠에 잠김
  let lastT = 0;
  { const o = roomEnts; roomEnts = function (list) { o(list); const R = G && G.dun && G.dun.cur, dt = Math.min(0.05, Math.max(0, time - lastT)); lastT = time; if (!on2(R) || !R._out2) return;
      for (const b of R._out2.bridges) { const open = doorState(R, b.d) === 'open', k0 = R._out2.k[b.d] != null ? R._out2.k[b.d] : open ? 1 : 0, k = Math.max(0, Math.min(1, k0 + (open ? 1 : -1) * dt * 1.6)); R._out2.k[b.d] = k;
        const i = Math.ceil(k * 4) - 1; if (i < 0) continue; list.push({ y: -1e9, d: () => ctx.drawImage(b.lv[i], b.x, b.y) }); } }; }
  // 좌 · 우 문의 나무 문짝(여닫힘)은 없앰 — 닫힘은 다리가 어둠에 잠기는 것으로 보여 줌
  { const o = drawSideLeaves; drawSideLeaves = function (d, k) { if (on2(G && G.dun && G.dun.cur)) return; return o.apply(this, arguments); }; }
  // 북문: 아치 안쪽 모양에 맞춘 내리닫이 쇠창살 (4장 북문과 같은 방식 · 장식 없이 철문만)
  let GN = null;
  function gateN2Init() { const W0 = 27, H0 = 36, cx = 13, top = 12, path = new Path2D(); let c0 = 99, c1 = -1, r0 = 99, r1 = -1;
    for (let y = 0; y < H0 - 1; y++) { let a = -1, b = -1; for (let x = 0; x < W0; x++) { const inner = y >= top ? x >= 4 && x <= 22 : Math.hypot(x - cx, y - top) <= 9.4; if (inner) { if (a < 0) a = x; b = x; } } if (a >= 0) { path.rect(a * 2, y * 2, (b - a + 1) * 2, 2); c0 = Math.min(c0, a); c1 = Math.max(c1, b); r0 = Math.min(r0, y); r1 = Math.max(r1, y); } }
    const Wc = c1 - c0 + 1, Hc = r1 - r0 + 1, c = document.createElement('canvas'); c.width = Wc * 2; c.height = Hc * 2; const g = c.getContext('2d'), P = { i: '#8e8a98', I: '#5c5866', J: '#2c2934', K: '#0b0a0e' }, px = (x, y, k) => { g.fillStyle = P[k]; g.fillRect(x * 2, y * 2, 2, 2); };
    for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) { const m = x % 3, band = y === 3 || y === Math.round(Hc * 0.5) || y === Hc - 6;
      if (y >= Hc - 2) { if (m === 1) px(x, y, y === Hc - 1 ? 'J' : 'I'); continue; } // 아래 창끝
      if (band) px(x, y, m === 1 ? 'i' : 'I'); else if (y === 4 || y === Math.round(Hc * 0.5) + 1 || y === Hc - 5) px(x, y, 'J'); else if (m === 1) px(x, y, 'i'); else if (m === 2) px(x, y, 'J'); }
    GN = { c, path, c0, r0, Hc }; }
  function gateN2(k) { if (!GN) gateN2Init(); if (k <= 0) return; const p = DOOR.n, ax = p.x - 27, ay = p.y - 70, off = Math.round(GN.Hc * (1 - k)) * 2;
    ctx.save(); ctx.translate(ax, ay); ctx.clip(GN.path); ctx.drawImage(GN.c, GN.c0 * 2, GN.r0 * 2 - off); ctx.restore(); }
  // 남쪽 문 쇠창살도 없앰 — 닫힘은 다리가 어둠에 잠기는 것으로만
  { const o = drawSeal; drawSeal = function (d, k) { if (on2(G && G.dun && G.dun.cur)) { if (d === 's') return; if (d === 'n') return gateN2(k); } return o.apply(this, arguments); }; }
  // 좌 · 우 문 횃불: v3.28 4장처럼 맵 안쪽으로 (판석 턱 가운데 → 턱 안쪽 바닥) · 문턱 양 끝에 섬
  { const o = gateParts; gateParts = function (d) { const r = o.apply(this, arguments); const R = G && G.dun && G.dun.cur; if (!on2(R) || (d !== 'w' && d !== 'e')) return r;
      const dx = d === 'w' ? 14 : -14, { BY } = geo(), ys = [BY - BR + 2, BY + BR + 20];
      r.parts.forEach((q, i) => { const ny = ys[i] != null ? ys[i] : q.sy, dy = ny - q.sy; q.x = (q.x + dx) & ~1; q.y = (q.y + dy) & ~1; q.sy = ny; if (r.flames[i]) { r.flames[i].x += dx; r.flames[i].y += dy; } });
      return r; }; }
  // 낭떠러지 아래에서 올라오는 옅은 찬 빛 (아주 약하게)
  { const o = roomLights; roomLights = function (lights) { o(lights); const R = G && G.dun && G.dun.cur; if (!on2(R)) return;
      const sd = ((R.seed || 1) * 13 + 7) | 0, { L, RR, B, T } = geo(), P = [];
      for (let y = T + 30; y < B + 60; y += 120) { P.push([L - 90, y]); P.push([RR + 90, y]); }
      for (let x = L + 40; x < RR; x += 140) P.push([x, B + 100]);
      for (const [i, [x, y]] of P.entries()) lights.push({ x: x + (hh(i, 1, sd) - 0.5) * 30, y: y + (hh(i, 2, sd) - 0.5) * 20, r: 80, a: 0.3 + 0.05 * Math.sin(time * 0.7 + i), c: '120,140,190', ca: 0.05 }); }; }
  // v3.28 아래 판석 턱은 캐릭터 · 적 · 시체와 남쪽 문 횃대를 가림: 턱 윗선(A.y1)부터 아래로는 그리지 않음 (남쪽 문 틈은 열어 둠) — 4장과 같은 처리
  const BLINE = () => A.y1;
  { const o = sideClip; sideClip = function (fn) { const R = G && G.dun && G.dun.cur; if (!on2(R)) return o(fn);
      return o(() => { ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - 200, A.y0 - 600, A.x1 - A.x0 + 400, BLINE() - (A.y0 - 600));
        if (R.doors && R.doors.s != null && !hiddenDoor(R, 's')) { const { SX } = geo(); ctx.rect(SX - BR, BLINE(), BR * 2, 200); }
        ctx.clip(); try { return fn(); } finally { ctx.restore(); } }); }; }
  const CUT = new Map(); // 남쪽 문 횃대: 턱 윗선 아래는 잘라 낸 그림 (턱 뒤에 선 모습)
  { const o = gateParts; gateParts = function (d) { const r = o.apply(this, arguments); const R = G && G.dun && G.dun.cur; if (d !== 's' || !on2(R)) return r;
      const DN = 6; r.parts.forEach(q => { q.y += DN; q.sy += DN; }); r.flames.forEach(f => { f.y += DN; }); // v3.28 남쪽 문 횃대를 3칸 아래로
      r.parts = r.parts.map(q => { const h = Math.max(0, BLINE() - q.y) & ~1; if (h >= q.c.height) return q; const k = q.c.width + 'x' + q.c.height + ':' + h; let c = CUT.get(k);
        if (!c || c.src !== q.c) { const [cc, g] = mkCanvas(q.c.width, Math.max(2, h)); g.drawImage(q.c, 0, 0); cc.src = q.c; CUT.set(k, cc); c = cc; } return Object.assign({}, q, { c }); });
      return r; }; }
  // v3.28 윗벽 기둥 받침: 바닥을 다 칠한 뒤 기둥 밑동에 받침돌을 얹어 바닥을 침범하게 · 둘레와 맨 아래는 외곽선 (4장 기둥과 같은 처리)
  { const o = paintRoomFloor; paintRoomFloor = function (R) { const r = o.apply(this, arguments);
      if (G && G.stage === 2 && G.dun && !G.dun.forge && R && !['forge', 'home', 'archive', 'lab', 'den', 'ruin'].includes(R.type) && PILLARS.length) {
        const K = '#08070b', TOP = '#4a4656', HI = '#3a3644', MD = '#2b2733', DK = '#1d1a23', SH = '#0c0b10', P = (x, y, c) => { fg.fillStyle = c; fg.fillRect(x, y, 2, 2); };
        const floorY = cx => { const d = fg.getImageData(cx + 18, A.y0, 1, 16).data; for (let k = 0; k < 16; k += 2) if (d[k * 4] <= 11 && d[k * 4 + 1] <= 11) return A.y0 + k + 2; return A.y0 + 8; }; // 벽 밑동 맨 아래 검은 줄 바로 다음 칸 = 바닥 첫 칸 (방마다 2px 차이)
        const FLY = (() => { const n = {}; for (let x = A.x0 + 24; x < A.x1 - 24; x += 26) { if (PILLARS.some(p => Math.abs(x + 18 - p) < 16)) continue; const v = floorY(x); n[v] = (n[v] || 0) + 1; } let b = A.y0 + 8, m = 0; for (const k in n) if (n[k] > m) { m = n[k]; b = +k; } return b; })(); // v3.28 방 전체에서 가장 많이 나온 바닥 첫 줄 하나로 모든 기둥을 맞춤 (기둥마다 재면 바닥 자국에 따라 길이가 달라졌음)
        for (const px0 of PILLARS) { const cx = px0 & ~1, x0 = cx - 14, rows = (FLY >> 1) + 1; // v3.29 기둥 전체를 새 성채 석주로 (주두 · 마름돌 · 받침) — 맨 아래 외곽선은 바닥 첫 칸(FLY)
          gPaint(fg, PILLARGEN.gen2(rows, (px0 * 7) % 97), PILLARGEN.PAL2, x0, 0);
          for (let x = x0 + 4; x < x0 + 28; x += 4) P(x, FLY + 2, K); } } // 받침 밑 디더 그림자 한 줄
      return r; }; }
  return { paint, wide: () => on2(G && G.dun && G.dun.cur), set on(v) { ON = v; }, get on() { return ON; } };
})();
;

// ==================================================================== 55_out3.js
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
;

// ==================================================================== 56_orc3.js
'use strict';
// 잿빛 왕관 원정대 — 56_orc3.js : v3.26 3장 오크 부락 장애물 · 소품 정리
//  · 소품: 고기 건조대 · 가죽 건조대 · 고기 교수대 삭제
//  · 윗벽 장식: 가죽 · 가시 · 해골 삭제, 깃발만 — 크고 거친 짐승 가죽 깃발로 새로 그림 (55_out3.js 위쪽 말뚝 벽에서 그림)
//  · 바닥 자국(뼈 · 턱뼈 · 자갈 · 짚): 무슨 모양인지 읽히게 크게 다시 그림
//  · 바위: 이 부락만의 붉은 사암 바위 — 평평한 윗면 · 지층 · 세로 결 · 오크가 칠한 붉은 엄니 표식
var ORC3 = (() => {
  const hh = (x, y, s) => FP.hh(x, y, s);
  const on = () => G && G.stage === 3;
  // ---------------------------------------------------------------- 소품 삭제
  const DEL = new Set(['meatRack', 'hideRack', 'meatGallows']);
  // 한 방에 같은 소품은 하나만 (북문 양옆 해골 말뚝 한 쌍만 예외) · 보스 투기장은 그대로
  { const o = decorOrc; decorOrc = function (r, add, ...rest) { const used = {}, boss = r && r.type === 'boss';
      return o.call(this, r, (name, ...a) => { if (DEL.has(name)) return; if (!boss) { const n = used[name] || 0; if (n >= (name === 'skullPike' ? 2 : 1)) return; used[name] = n + 1; } return add(name, ...a); }, ...rest); }; }
  // 숨은 보고 석상 자리: 장애물 토템과 같은 그림
  let TOT = null;
  if (typeof drawSR === 'function') { const o = drawSR; drawSR = function (s) { if (!(on() && s.k === 'statue')) return o.apply(this, arguments);
      const c = TOT || (TOT = gCanvas(genTotem(), WOODPAL)), x = (s.x - c.width / 2) & ~1, y = (s.y + (s.foot || 0) - c.height + 8) & ~1;
      { const xa = x + 4, xb = x + c.width - 4; if (xb > xa) dshRect(ctx, xa, s.y + (s.foot || 0), Math.ceil((xb - xa) / 2) * 2, 2, 0.5); }
      if (s.flip) { ctx.save(); ctx.translate(x + c.width, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0); ctx.restore(); } else ctx.drawImage(c, x, y); }; }
  // ---------------------------------------------------------------- 쇠창살 우리 (조금 크게 · 바깥 외곽선이 또렷하게): 나무 지붕 · 굵은 모서리 기둥 · 쇠창살 · 자물쇠 · 안에 웅크린 해골
  if (typeof spProp === 'function' && typeof PEN_PAL !== 'undefined') delete PROP_MAPS.orcCage; // 예전 지도 그림을 지우고 새로
  if (typeof spProp === 'function' && typeof PEN_PAL !== 'undefined') spProp('orcCage', 22, 31, (x0, y) => { const W = 20, H = 30, x = x0 - 1; if (x0 === 0 || x0 === 21 || y === 30) return null; // 둘레 한 칸 비워 외곽선이 생기게
    if (y === 0) return x >= 8 && x <= 11 ? (x === 8 ? 'n' : 'g') : null; // 매다는 고리
    if (y <= 3) return x >= 0 && x <= W - 1 ? (y === 1 ? (x === 0 ? 'l' : 'h') : y === 2 ? 'l' : 'D') : null; // 나무 지붕
    if (y >= H - 3) return y === H - 3 ? (x === 0 ? 'l' : 'h') : y === H - 2 ? 'd' : 'D'; // 나무 받침
    if (x <= 1) return x === 0 ? 'h' : 'l'; if (x >= W - 2) return x === W - 1 ? 'D' : 'd'; // 모서리 기둥
    if (x >= 9 && x <= 10 && y >= 12 && y <= 15) return y === 15 ? 'O' : x === 9 ? 'y' : 'o'; // 쇠띠에 건 자물쇠
    if (y === 13 || y === 14) return y === 13 ? 'n' : 'G'; // 가운데 쇠띠
    if ((x - 2) % 3 === 1) return (x === 3 ? 'n' : 'g'); // 쇠창살
    // 안: 웅크린 해골 · 뼈
    if (y >= 18 && y <= 21 && x >= 5 && x <= 9) return y === 18 ? (x === 5 || x === 9 ? 'U' : 'p') : y === 19 ? (x === 6 || x === 8 ? 'K' : 'w') : y === 20 ? (x === 9 ? 'W' : 'w') : (x === 6 || x === 8 ? 'W' : 'U'); // 해골
    if (y >= 21 && y <= 25 && x >= 5 && x <= 12) return (y % 2 === 0 && x >= 6 && x <= 11) ? 'W' : (x === 8 ? 'w' : 'U');
    return y >= 22 ? 'U' : y <= 5 ? 'u' : 'X';
  }, { r: 14, foot: 1 }, PEN_PAL);
  // ---------------------------------------------------------------- 바닥 자국 (2px 칸) — 외곽선 k · 뼈 w/W/b · 돌 n/g/G · 짚 y/s/o
  if (window.SCN34) {
    Object.assign(SCN34.decPal, { b: '#7a705e', h: '#e8e0cc', m: '#3a2c20' });
    Object.assign(SCN34.dec, {
      bone1: [ // 긴 뼈 (양 끝 둥근 마디)
        '.kk........kk.',
        'khwk......kwWk',
        'kwwkkkkkkkkwWk',
        '.kwhhwwwwwwWk.',
        'kwwWWWWWWWWwWk',
        'kwWk......kWbk',
        '.kk........kk.'],
      bone2: [ // 갈비뼈 세 대
        '.kk..kk..kk.',
        'khk.khk.khk.',
        'kwk.kwk.kwk.',
        'kwWkkwWkkwWk',
        '.kwWk.kwWk.kWk',
        '..kwk..kwk..k.',
        '...kk...kk....'].map(r => r.padEnd(14, '.').slice(0, 14)),
      jaw: [ // 엄니 달린 아래턱 (위에서 본 U자)
        'kk........kk',
        'khk......khk',
        'kwk......kwk',
        'kwWk....kwWk',
        'kwwWkkkkkwWk',
        '.kwwhwhwwWk.',
        '..kWkWkWkk..',
        '...kkkkkk...'],
      peb1: [ // 자갈 셋 (윗면 빛 · 밑 그늘)
        '..kkk.......',
        '.knngk..kk..',
        'kngggGk.kngk',
        'kgggGGk.kgGk',
        '.kGGGk.kkkk.',
        '..kkk.kngk..',
        '......kGGk..',
        '.......kk...'],
      peb2: [ // 납작한 돌 하나 + 조각
        '...kkkk....',
        '.kknnggk...',
        'kngggggGk..',
        'kgggggGGk.k',
        '.kGGGGGk.kgk',
        '..kkkkk...k.'].map(r => r.padEnd(12, '.').slice(0, 12)),
      straw1: [ // 마른 짚 한 줌 (엇갈린 줄기)
        'y.....s...',
        '.y...s..y.',
        '..s.o..y..',
        '..yso.s...',
        '.syyoss...',
        's.oyys.o..',
        '..o..y..s.',
        '.o....y...'],
      straw2: [ // 흩어진 짚 줄기
        'yy........',
        '..ss....y.',
        '....oo.s..',
        '.y....s...',
        '..ss.o..yy',
        '....o.....'] });
  }
  // ---------------------------------------------------------------- 대각선으로 반 부러진 뼈 — 'bone1' 자리에 긴 뼈와 반반 섞임
  if (window.SCN34) { const N = 20, g = Array.from({ length: N }, () => Array(N).fill('.')), set = (x, y, c) => { x += 2; y += 2; if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; };
    const seg = (a, b, ox) => { for (let i = a; i <= b; i++) { set(i + ox, i, 'w'); set(i + 1 + ox, i, 'w'); set(i + ox, i + 1, 'W'); } };
    seg(2, 5, 0); seg(9, 11, 3); // 두 토막 — 아래 토막은 한 칸 비껴 떨어짐 (가운데 6~8 칸은 부러져 빔)
    set(1, 1, 'h'); set(2, 1, 'w'); set(1, 2, 'w'); set(0, 1, 'w'); set(1, 0, 'h'); // 위 마디
    set(15, 12, 'W'); set(16, 12, 'w'); set(15, 13, 'W'); set(14, 13, 'W'); set(16, 11, 'w'); // 아래 마디
    set(6, 6, 'h'); set(7, 6, 'w'); set(6, 7, 'W'); // 위 토막 부러진 끝 (뾰족한 조각)
    set(12, 8, 'h'); set(11, 9, 'b'); // 아래 토막 부러진 끝
    const out = g.map(r => r.slice()); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const c = (g[y + dy] || [])[x + dx]; return c && c !== '.'; })) out[y][x] = 'k';
    const BROKEN = out.map(r => r.join('')), LONG = SCN34.dec.bone1;
    Object.defineProperty(SCN34.dec, 'bone1', { configurable: true, get: () => (Math.random() < 0.5 ? BROKEN : LONG) }); }
  // ---------------------------------------------------------------- 바위: 붉은 사암 — 평평한 윗면(지층 고리) · 세로 결 옆면 · 가로 지층 · 왼쪽 위 빛 · 붉은 엄니 표식
  const TOP = ['#c8946a', '#b07c52', '#946240'], SIDE = ['#a8704a', '#8a5636', '#6c3e26', '#56301e', '#422417', '#2e1810'];
  // 바위 자리 구조물 (v3.26): 큰 것 = 부서진 토템(밑동만 남은 얼굴 기둥 + 옆에 떨어진 윗토막) · 작은 것 = 나무 밑동(나이테 · 뿌리)
  const WDC = { hi: '#e0b888', cut: '#c89a68', cut2: '#a87848', h: '#9a6a40', l: '#7a5030', d: '#553620', D: '#33200f', r: '#9a2a24', R: '#5e1612', w: '#e0d6c4', W: '#a89a84', K: '#0b0806' };
  function sandRock(wPx, hPx, seed) { const big = wPx > 40;
    if (big && window.SCN34 && SCN34.totem) { // 장애물 토템과 같은 그림을 반으로 부러뜨림: 아래 토막은 서 있고, 뿔 해골 달린 윗토막은 옆에 쓰러져 누움
      const T = SCN34.totem[0].map(r => [...r]), TW = T[0].length, TH = T.length, cut = 12, keepH = TH - cut, topH = cut + 1;
      const w = TW + 2 + topH, h = Math.max(keepH, TW) + 1, S = FP.Spr(w, h), put = (x, y, ch) => { const c = ch === '.' ? null : WOODPAL[ch]; if (c) S.set(x, y, c); };
      const by0 = h - keepH; // 서 있는 아래 토막 (윗면은 들쭉날쭉 쪼개짐)
      for (let x = 0; x < TW; x++) { const jag = (hh(x, 1, seed) * 3) | 0; for (let r = cut + jag; r < TH; r++) { let ch = T[r][x]; if (ch === '.') continue; if (r === cut + jag && ch !== 'k') { ch = x < TW / 2 ? 's' : 'o'; S.set(x, by0 + (r - cut) - 1, '#0b0806'); } put(x, by0 + (r - cut), ch); } }
      const fx0 = TW + 2, fy0 = h - TW; // 쓰러진 윗토막: 뿔이 오른쪽으로 가게 90도 눕힘
      for (let r = 0; r <= cut; r++) for (let c = 0; c < TW; c++) { let ch = T[r][c]; if (ch === '.') continue; if (r === cut && ch !== 'k') { ch = 's'; S.set(fx0 - 1, fy0 + c, '#0b0806'); } put(fx0 + (cut - r), fy0 + c, ch); }
      for (const [x, y] of [[TW, h - 2], [TW + 1, h - 1]]) if (!S.has(x, y)) S.set(x, y, '#0b0806'); // 튄 조각 자리
      FP.shadow(S, 2, 2, 2); return FP.render(S, false); } // 토템 그림에 이미 1칸 외곽선이 있어 두 번 두르지 않음
    // 나무 밑동: 둥근 윗면 나이테 · 껍질 옆면 · 퍼진 뿌리
    const w = 17, h = 15, S = FP.Spr(w, h), cx = 8.5, tcy = 4, trx = 5.5, tRy = 2.6, bot = h - 3;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = x + 0.5 - cx, inTop = (X / trx) ** 2 + ((y + 0.5 - tcy) / tRy) ** 2 <= 1, inBody = y + 0.5 >= tcy && y <= bot && Math.abs(X) <= trx + (y > bot - 2 ? (y - bot + 2) * 0.8 : 0);
      if (!inTop && !inBody) continue; let c;
      if (inTop) { const rr = Math.sqrt((X / trx) ** 2 + ((y + 0.5 - tcy) / tRy) ** 2); c = rr > 0.82 ? WDC.l : (Math.round(rr * 3.5) % 2 ? WDC.cut2 : WDC.cut); if (rr < 0.2) c = WDC.cut2; if (rr > 0.82 && X < 0 && y + 0.5 < tcy) c = WDC.h; }
      else { const u = (X + trx) / (2 * trx); c = u < 0.2 ? WDC.h : u < 0.55 ? WDC.l : u < 0.85 ? WDC.d : WDC.D; if (hh(x, (y / 3) | 0, seed) < 0.18) c = WDC.D; } // 세로 껍질 결
      S.set(x, y, c); }
    // 뿌리: 좌우로 뻗은 굵은 뿌리 둘 + 가는 뿌리
    for (const [sx, dir, L] of [[2, -1, 3], [14, 1, 3], [6, -1, 2]]) for (let k = 0; k < L; k++) { const x = sx + dir * k, y = bot + 1 + (k > 1 ? 1 : 0); if (x >= 0 && x < w) { S.set(x, y, k === 0 ? WDC.l : WDC.d); } }
    // 쪼개진 금 하나
    S.set(Math.round(cx + 1), tcy, WDC.D); S.set(Math.round(cx + 2), tcy + 1, WDC.D);
    FP.shadow(S, 2, 2, 2); return FP.render(S); }
  if (typeof CAMP3 !== 'undefined') { const o = CAMP3.rock; CAMP3.rock = function (wPx, hPx, kind, seed) { if (kind === 'red' && on()) return sandRock(wPx, hPx, seed || 1); return o.apply(this, arguments); }; }
  // ---------------------------------------------------------------- 윗벽 깃발: 가로 막대에 매단 거친 짐승 가죽 — 털 테두리 · 찢어진 밑단 세 갈래 · 붉게 칠한 엄니 해골 · 매달린 뼈 구슬
  const BAN = {};
  function banner(seed, red) { const key = seed + (red ? 'r' : ''); if (BAN[key]) return BAN[key]; const Wc = 20, Hc = 36, S = FP.Spr(Wc, Hc, 2);
    const HI = red ? ['#c0402c', '#a02a1c', '#821c12', '#62120c', '#420a06'] : ['#c49a68', '#a8804e', '#8a6438', '#6a4a2a', '#4a3220'], FUR = ['#6a523a', '#4a3826'], RD = ['#a82014', '#7a120c', '#520a06'], BN = ['#e0d6c4', '#a89a84'], WD = ['#9a6a40', '#6a4626', '#3a2414'], RP = ['#8a7448', '#5a4a2c'];
    const L0 = 3, R0 = 16, top = 2, bot = 27;
    // 가로 막대 (양 끝 깎은 통나무 · 밧줄 매듭)
    for (let x = 0; x < Wc; x++) { S.set(x, 0, x === 0 || x === Wc - 1 ? WD[1] : WD[0]); S.set(x, 1, WD[2]); }
    for (const x of [L0, R0]) { S.set(x, 0, RP[0]); S.set(x, 1, RP[1]); S.set(x + 1, 1, RP[0]); }
    // 가죽: 가장자리가 들쭉날쭉 · 밑으로 갈수록 넓어짐 · 밑단 세 갈래로 찢김
    const lx = y => L0 - Math.round((y - top) * 0.08) + (hh(y, 1, seed) < 0.25 ? 1 : 0), rx = y => R0 + Math.round((y - top) * 0.08) - (hh(y, 2, seed) < 0.25 ? 1 : 0);
    // 밑단: 찢어진 천 — 길이가 제각각인 가닥 · 구멍 · 들쭉날쭉한 끝
    const tailLen = u => { const k = Math.floor(u * 7); return Math.round(hh(k, 3, seed) ** 0.7 * 8) - (hh(k, 4, seed) < 0.3 ? 3 : 0); };
    const tails = [[0.2, 4 + (hh(1, 3, seed) * 3 | 0)], [0.55, 6 + (hh(2, 3, seed) * 3 | 0)], [0.88, 3 + (hh(3, 3, seed) * 3 | 0)]];
    for (let y = top; y < Hc; y++) { const a = lx(Math.min(y, bot)), b = rx(Math.min(y, bot));
      for (let x = a; x <= b; x++) { const u = (x - a) / Math.max(1, b - a), sl = (y - bot) * 0.03 * (hh(y > bot ? 1 : 0, 9, seed) < 0.5 ? 1 : -1), u2 = Math.min(0.999, Math.max(0, u + sl)), L = tailLen(u2), kk = Math.floor(u2 * 7), gap = kk !== Math.floor((u2 + 1 / Math.max(1, b - a)) * 7) && y > bot - 4 + (hh(kk, 8, seed) * 4 | 0) && hh(kk, 7, seed) < 0.65; // 비스듬히 찢긴 틈 · 길이 제각각
        if (y > bot - 4 + Math.min(0, L)) { if (y > bot + L || gap) continue; if (y > bot + L - 2 && hh(x, y, seed + 5) < 0.45) continue; } // 가닥 끝은 해져서 듬성듬성
        if (y > top + 6 && y < bot - 5 && hh(x >> 1, y >> 1, seed + 21) < 0.025) continue; // 구멍
        let i = u < 0.12 ? 0 : u < 0.4 ? 1 : u < 0.75 ? 2 : 3; if (y === top) i = 3; if (((x + (y >> 2)) % 6 === 0) && y > top + 1) i = Math.min(4, i + 1); // 처진 주름
        if (hh(x, y, seed + 9) < 0.06) i = Math.min(4, i + 1); if (y > bot - 2) i = Math.min(4, i + 1);
        S.set(x, y, HI[i]); }
      // 테두리: 가죽은 털, 붉은 천은 해진 실밥
      if (y < bot && y > top) { S.set(a, y, red ? HI[3] : FUR[y % 3 === 0 ? 1 : 0]); S.set(b, y, red ? HI[4] : FUR[1]); if (hh(y, 5, seed) < (red ? 0.2 : 0.4)) S.set(a - 1, y, red ? HI[2] : FUR[1]); if (hh(y, 6, seed) < (red ? 0.2 : 0.4)) S.set(b + 1, y, red ? HI[3] : FUR[1]); } }
    // 붉게 칠한 엄니 해골 (거친 붓질)
    const SK = ['..rrrrrrr..', '.rrrrrrrrr.', 'rrr..r..rrr', 'rrr..r..rrr', 'rrrrr.rrrrr', '.rrr...rrr.', '..r.r.r.r..', 'R.........R', 'RR.......RR', '.RR.....RR.', '..RR...RR..'];
    const ox = 5, oy = 8; SK.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return; if (ch === 'r' && hh(i, j, seed + 3) < 0.12) return; S.set(ox + i, oy + j, red ? (ch === 'r' ? ((i + j) % 5 === 0 ? '#a89a84' : '#d8cfbc') : '#2a1410') : ch === 'r' ? RD[(i + j) % 5 === 0 ? 1 : 0] : RD[1]); }));
    for (let k = 0; k < 3; k++) { const x = ox + 2 + k * 3, L = 1 + (hh(k, 7, seed) * 3 | 0); for (let j = 0; j < L; j++) S.set(x, oy + 11 + j, red ? (j === L - 1 ? '#8a8070' : '#c8c0b0') : RD[j === L - 1 ? 2 : 1]); } // 흘러내린 물감
    // 밑단 끝에 매단 뼈 구슬 · 송곳니
    for (const [c] of tails) { const x = Math.round(lx(bot) + c * (rx(bot) - lx(bot))), L = Math.max(0, tailLen(c)), y = bot + L; if (y + 3 >= Hc) continue; S.set(x, y + 1, RP[1]); S.set(x, y + 2, BN[0]); S.set(x, y + 3, BN[1]); }
    // 옆에 늘어진 끈 + 깃털
    S.set(R0 + 2, 2, RP[0]); S.set(R0 + 2, 3, RP[1]); S.set(R0 + 2, 4, RP[0]); S.set(R0 + 2, 5, '#c8c0b0'); S.set(R0 + 2, 6, '#8a2a20'); S.set(R0 + 3, 6, '#c8c0b0');
    return (BAN[key] = FP.render(S)); }
  // ---------------------------------------------------------------- 나무 벽 횃불 제거 (3장 부락 방 — 바깥 디자인을 쓰는 방만)
  { const o = enterRoom; enterRoom = function () { const r = o.apply(this, arguments); if (on() && typeof OUT3 !== 'undefined' && OUT3.wide && OUT3.wide()) TORCHES = []; return r; }; }
  return { banner, sandRock, DEL };
})();
;

// ==================================================================== 57_out4.js
'use strict';
// 잿빛 왕관 원정대 — 57_out4.js : v3.27 시안01 — 4장 벽 바깥 (좌 · 우 · 아래)
// 컨셉: 「불탄 왕도의 높은 광장」 — 방은 왕도 한가운데 높이 쌓은 돌 광장. 둘레는 그을린 돌 난간(난간동자 · 받침 기둥)
//  · 난간 밖: 판석 턱 → 큰 마름돌 옹벽(남쪽은 높게, 좌우는 좁게) → 아래로 연기 속에 사라짐
//  · 그 아래: 한 단 낮게 깔린 같은 돌 바닥 — 어둡게, 광장에서 멀어질수록 디더로 어둠 속에 (시안02)
//  · 문: 난간을 가르고 돌다리(아치 고가)가 이웃 광장으로 이어짐. 닫히면 쇠창살 문
const OUT4 = (() => {
  const hh = (x, y, s) => FP.hh(x, y, s);
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sm = v => v * v * (3 - 2 * v), a = (i, j) => hh(xi + i, yi + j, s); return (a(0, 0) * (1 - sm(fx)) + a(1, 0) * sm(fx)) * (1 - sm(fy)) + (a(0, 1) * (1 - sm(fx)) + a(1, 1) * sm(fx)) * sm(fy); };
  const ST = ['#b0aa9e', '#928c82', '#76716a', '#5c5853', '#45423e', '#302e2b', '#201f1d']; // 그을린 돌 (밝 → 어둠)
  const SOOT = ['#1a1816', '#121110', '#0b0a09'];
  const EMB = ['#ffcf6a', '#ff8a30', '#c8481a', '#7a2810']; // 잉걸
  const ROOF = [['#463c36', '#362e29', '#28221e'], ['#3e3c40', '#302e32', '#232125'], ['#48392e', '#382c24', '#29201a']]; // 지붕 (그을린 붉은 기와 · 슬레이트 · 갈색 기와)
  const WALLC = ['#3a3530', '#2c2824', '#1f1c19'];
  const PT = 20, LG = 10, CF = 48, CS = 14, PW = 20, BH = 66; // 난간 굵기 · 턱 · 남쪽 옹벽 · 좌우 옹벽 · 길 반폭 · 아래 난간 높이
  let ON = true;
  const on4 = R => ON && G && G.stage === 4 && R && !['forge', 'home', 'archive', 'lab', 'den', 'ruin', 'boss', 'altar'].includes(R.type) && !(G.dun && G.dun.forge);
  const geo = () => ({ L: A.x0, RR: A.x1, T: A.y0, B: A.y1, PY: CY + 2, SX: DOOR.s.x });

  function paint(g, R) {
    const LY = cellLayer(0, 0, W, H), px = (x, y, c) => LY.set(x & ~1, y & ~1, c);
    const sd = ((R.seed || 1) * 23 + 5) | 0, { L, RR, T, B, PY, SX } = geo();
    const D = R.doors || {}, dW = D.w != null && !hiddenDoor(R, 'w'), dE = D.e != null && !hiddenDoor(R, 'e'), dS = D.s != null && !hiddenDoor(R, 's');
    const FL = L - 4 - PT, FR = RR + 4 + PT, FB = B + BH, lipL = FL - LG, lipR = FR + LG, lipB = FB + LG, TT = T - 10, HZ = T - 70;
    const gapW = y => dW && Math.abs(y - PY) < PW + 4, gapE = y => dE && Math.abs(y - PY) < PW + 4, gapS = x => dS && Math.abs(x - SX) < PW + 4;
    const inTer = (x, y) => x >= lipL && x < lipR && y >= TT && y < lipB; // 광장(턱 포함)
    const LAND = 120, BW = 22; // 돌다리 길이 · 반폭
    // ------------------------------------------------ 1) 바깥 전부: 어두운 바탕 · 지평선 붉은 연기 띠 · 불탄 지붕들 · 연기 · 고원에서 멀수록 어둠
    const fadeOf = (x, y) => { const dx = x < lipL ? lipL - x : x > lipR ? x - lipR : 0, dy = y > lipB ? y - lipB : 0; return clamp((Math.sqrt(dx * dx + dy * dy) - 30) / 160, 0, 1); };
    const CW = W >> 1, CH = H >> 1, buf = new Array(CW * CH).fill(null);
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) { const y = j * 2, hz = clamp(1 - Math.abs(y - HZ) / 40, 0, 1); buf[j * CW + i] = y < HZ ? (dith(i, j, clamp((y - (HZ - 90)) / 90, 0, 1) * 0.6) ? '#1e1512' : '#100c0b') : hz > 0 && dith(i, j, hz * 0.7) ? '#2a1a14' : SOOT[1]; }
    const bset = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= H) return; buf[(y >> 1) * CW + (x >> 1)] = c; };
    // 집: 박공지붕(위 비탈 · 아래 비탈 · 용마루) + 처마 밑 벽(잉걸 창) — 멀수록 작게
    const house = (cx, by, w, s) => { const p = clamp((by - HZ) / 320, 0.15, 1), sc = 0.45 + 0.55 * p, ww = Math.max(10, Math.round(w * sc / 2) * 2), rh = Math.round(ww * 0.42 / 2) * 2 + 2, wh = Math.round(ww * 0.28 / 2) * 2 + 2;
      const x0 = (cx - ww / 2) & ~1, y0 = (by - rh - wh) & ~1, P = ROOF[s % 3], burnt = hh(s, 1, sd) < 0.35, hole = hh(s, 2, sd) < 0.1, lit = hh(s, 8, sd) < 0.18, dim = (1 - p);
      const far = dim > 0.5, DK = { [P[0]]: P[1], [P[1]]: P[2], [P[2]]: SOOT[0], [WALLC[0]]: WALLC[1], [WALLC[1]]: WALLC[2], [WALLC[2]]: SOOT[0] }, dk = c => far ? (DK[c] || c) : c; // 먼 집은 한 단계 어둡게
      for (let y = 0; y < rh; y += 2) for (let x = 0; x < ww; x += 2) { const ridge = y === rh / 2 - (rh / 2) % 2, up = y < rh / 2, tile = ((y >> 1) % 2 === 0), e = Math.min(x, ww - 2 - x); if (e < (up ? (rh / 2 - y) * 0.5 : 0)) continue; // 위 비탈은 박공 끝이 살짝 들어감
        let c = ridge ? P[0] : up ? (tile ? P[1] : P[2]) : (tile ? P[0] : P[1]); if (x === 0 || x === ww - 2) c = SOOT[0];
        if (burnt && hh((x0 + x) >> 2, (y0 + y) >> 2, sd + 3) < 0.35) c = SOOT[0]; // 그을음
        if (hole && Math.abs(x - ww * 0.6) < ww * 0.16 && Math.abs(y - rh * 0.55) < rh * 0.25) c = hh(x, y, sd + 4) < 0.5 ? EMB[2] : EMB[3]; // 무너진 지붕 틈의 잉걸
        bset(x0 + x, y0 + y, dk(c)); }
      for (let y = rh; y < rh + wh; y += 2) for (let x = 0; x < ww; x += 2) { let c = y === rh ? SOOT[0] : x < 2 ? WALLC[0] : x > ww - 4 ? WALLC[2] : WALLC[1];
        const win = (x % 8 === 4 || x % 8 === 6) && y > rh + 1 && y < rh + wh - 2; if (win) c = lit && hh(x0 + x, y0, sd + 6) < 0.5 ? (y === rh + 2 ? EMB[2] : EMB[3]) : SOOT[0];
        bset(x0 + x, y0 + y, dk(c)); }
      if (hh(s, 7, sd) < 0.5) for (let y = -6; y < 2; y += 2) for (let x = 0; x < 4; x += 2) bset(x0 + ww * 0.25 + x & ~1, y0 + y, dk(x ? ST[5] : ST[4])); // 굴뚝
      return { x0, y0, ww, rh, wh, hole, burnt }; };
    // 한 단 아래 바닥: 광장과 같은 돌 바닥이 한 층 낮게 깔림 — 어둡게, 멀어질수록 디더로 어둠 속에
    const LOWF = ['#3a3632', '#302d29', '#272421', '#1c1a18'];
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { if (inTer(x, y) || (x >= FL && x < FR && y < T)) continue;
      const row = Math.floor(y / 12), off = (row % 2) * 12, bx = Math.floor((x + off) / 24), mx = (x + off) % 24, my = y % 12;
      let i = hh(bx, row, sd + 60) < 0.35 ? 0 : hh(bx, row, sd + 61) < 0.5 ? 1 : 2; if (mx === 0 || my === 0) i = 3; if (i < 3 && mx < 2 && my > 1) i = Math.max(0, i - 1);
      let c = LOWF[i]; if (i < 3 && hh(x >> 1, y >> 1, sd + 62) < 0.03) c = '#55504a'; // 재 부스러기
      bset(x, y, c); }
    // 광장 옹벽 밑 그늘 (아래 바닥에 드리움)
    for (let y = lipB & ~1; y < lipB + 70; y += 2) for (let x = (lipL - 24) & ~1; x < lipR + 24; x += 2) { const k = (y - lipB) / 70; if (dith(x >> 1, y >> 1, (1 - k) * 0.6)) bset(x, y, SOOT[1]); }
    for (const sg of [-1, 1]) for (let y = TT & ~1; y < lipB + 40; y += 2) for (let d = 0; d < 40; d += 2) { const x = sg < 0 ? lipL - CS - d : lipR + CS + d; if (dith(x >> 1, y >> 1, (1 - d / 40) * 0.5)) bset(x, y, SOOT[1]); }
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) { const x = i * 2, y = j * 2; if (inTer(x, y) || (x >= FL && x < FR && y < T)) continue; let c = buf[j * CW + i]; const f = fadeOf(x, y); if (f > 0 && dith(i, j, f)) c = dith(i + 1, j, f - 0.5) ? SOOT[2] : SOOT[1]; if (y >= HZ - 4 || x < FL || x >= FR) LY.set(x, y, c); }
    // ------------------------------------------------ 2) 옹벽: 큰 마름돌 (넓은 간격) · 위 갓돌 · 아래로 어두워지며 연기 속에 사라짐
    const block = (x, y, v, sideLen) => { const row = Math.floor(v / 14), off = (row % 2) * 13 + (hh(row, 1, sd) * 6 | 0) * 2, bx = Math.floor((x + off) / 26), mx = (x + off) % 26, my = v % 14, k = v / sideLen;
      let i = mx < 2 ? 1 : my < 2 ? 2 : mx > 22 || my > 11 ? 4 : hh(bx, row, sd + 30) < 0.3 ? 2 : 3; if (my === 0 || mx === 0 || (mx === 24)) i = 5; // 줄눈
      if (hh(bx, row, sd + 31) < 0.12 && my > 3 && my < 10 && mx > 6 && mx < 18 && (mx + my) % 5 === 0) i = 6; // 금
      i = Math.min(6, i + (dith(x >> 1, y >> 1, k * 1.6) ? 1 : 0)); return k > 0.35 && dith((x >> 1) + 1, y >> 1, (k - 0.35) * 1.8) ? null : ST[i]; };
    for (let y = lipB & ~1; y < lipB + CF; y += 2) for (let x = (lipL - CS) & ~1; x < lipR + CS; x += 2) { const v = y - lipB; if (dS && Math.abs(x - SX) < BW + 8) continue; const c = block(x, y, v, CF * 0.8); if (c) px(x, y, c); }
    for (const sg of [-1, 1]) for (let y = TT & ~1; y < lipB + 30; y += 2) for (let d = 0; d < CS; d += 2) { const x = sg < 0 ? lipL - 2 - d : lipR + d; if ((sg < 0 ? dW : dE) && Math.abs(y - PY) < BW + 8) continue; const k = d / CS; let c = d < 2 ? ST[2] : ST[hh(x >> 3, y >> 3, sd) < 0.4 ? 4 : 3]; if (k > 0.3 && dith(x >> 1, y >> 1, (k - 0.3) * 1.5)) continue; px(x, y, c); }
    // ------------------------------------------------ 3) 광장 턱: 판석 (난간 밖) · 바깥 끝 갓돌 (밝은 모서리)
    for (let y = TT & ~1; y < lipB; y += 2) for (let x = lipL & ~1; x < lipR; x += 2) { if (x >= FL && x < FR && y < FB) continue; const e = Math.min(x - lipL, lipR - 2 - x, lipB - 2 - y); let c = e < 2 ? ST[1] : e < 4 ? ST[3] : (((x >> 4) + (y >> 4)) & 1) ? ST[3] : ST[4]; if (e >= 4 && (x % 16 === 0 || y % 16 === 0)) c = ST[5]; if (e >= 4 && hh(x >> 1, y >> 1, sd + 40) < 0.05) c = '#c8c2b6'; px(x, y, c); }
    // 재 더미 (난간 밑에 쌓인 흰 재 · 디더)
    for (let k = 0; k < 10; k++) { const side = k % 3, t = hh(k, 41, sd); const [cx, cy] = side === 0 ? [FL + 2, T + t * (B - T)] : side === 1 ? [FR - 2, T + t * (B - T)] : [L + t * (RR - L), FB + 2]; const r = 6 + hh(k, 42, sd) * 8;
      for (let dy = -r; dy <= r; dy += 2) for (let dx = -r * 1.4; dx <= r * 1.4; dx += 2) { const q = Math.hypot(dx / 1.4, dy) / r, x = (cx + dx) & ~1, y = (cy + dy) & ~1; if (q < 1 && inTer(x, y) && !(x >= L && x < RR && y < B) && dith(x >> 1, y >> 1, (1 - q) * 1.2)) px(x, y, q < 0.5 ? '#c8c2b6' : '#a8a296'); } }
    // ------------------------------------------------ 4) 돌다리 (아치 고가): 판석 길 · 양옆 낮은 난간 · 아래 아치 구멍
    // 계단: 광장 끝에서 한 단 아래 바닥으로 내려감 — 디딤판 앞 모서리 밝게 · 아래로 갈수록 어둡게 · 양옆 돌 난간벽
    const SL = 56;
    const stairsV = () => { const y0 = lipB - 2; for (let t = 0; t < SL; t += 2) { const y = y0 + t, step = Math.floor(t / 8), sv = t % 8, k = t / SL;
        for (let w = -BW; w < BW; w += 2) { const x = SX + w; let i = sv < 2 ? 0 : sv < 4 ? 2 : 3; i = Math.min(6, i + Math.floor(k * 3)); if (w <= -BW + 2) i = Math.min(6, i + 1); if (dith(x >> 1, y >> 1, Math.max(0, k - 0.6) * 2)) continue; px(x, y, ST[i]); }
        for (const [xx, cl] of [[SX - BW - 6, 1], [SX + BW, 3]]) for (let c = 0; c < 6; c += 2) if (!dith(xx >> 1, y >> 1, Math.max(0, k - 0.5) * 2)) px(xx + c, y, ST[Math.min(6, cl + (c === 4 ? 1 : 0) + Math.floor(k * 2))]); } };
    const stairsH = sgn => { const x0 = sgn < 0 ? lipL - 2 : lipR; for (let t = 0; t < SL; t += 2) { const x = x0 + sgn * t, sv = t % 8, k = t / SL;
        for (let w = -BW; w < BW; w += 2) { const y = PY + w; let i = sv < 2 ? 1 : sv < 4 ? 2 : 3; i = Math.min(6, i + Math.floor(k * 3)); if (dith(x >> 1, y >> 1, Math.max(0, k - 0.6) * 2)) continue; px(x, y, ST[i]); }
        for (const [yy, cl] of [[PY - BW - 6, 1], [PY + BW, 3]]) for (let c = 0; c < 6; c += 2) if (!dith(x >> 1, (yy + c) >> 1, Math.max(0, k - 0.5) * 2)) px(x, yy + c, ST[Math.min(6, cl + (c === 4 ? 1 : 0) + Math.floor(k * 2))]); } };
    if (dW) stairsH(-1); if (dE) stairsH(1); if (dS) stairsV();
    // ------------------------------------------------ 5) 돌벽 (윗벽과 같은 결): 갓돌 · 큰 벽돌 몸 · 밑돌 · 금테 두른 붙임기둥 — 그을음 · 금 간 돌
    const P4 = { h: '#8e887e', l: '#6e6860', d: '#4e4a44', D: '#34312d', j: '#1c1a1e', k: '#0b0a09', g: '#d8b860', G: '#a08038', o: '#6e5626' };
    // 아래 벽 (앞면)
    { const TS = PT, top = B - 2 + TS, base = FB - 6; // 위에서 보이는 벽 윗면(두께 = 좌우 벽과 같음) → 그 아래 앞면
      const hole = (x, y) => gapS(x) && holeS(x, y), pxW = (x, y, c) => { if (!hole(x, y)) px(x, y, c); }; // v3.29 남쪽 문 자리도 벽으로 메우고 아치 안쪽 구멍만 비움 (아치 뒤 · 벽 사이 빈틈 없앰)
      for (let x = FL & ~1; x < FR; x += 2) {
        pxW(x, top, P4.l); pxW(x, top + 2, P4.d); pxW(x, top + 4, P4.j); // 갓돌 앞면 · 처마 그늘
        for (let y = top + 6; y < base; y += 2) { const v = y - top - 6, row = Math.floor(v / 10), off = (row % 2) * 12, mx = (x - FL + off) % 24, my = v % 10, bx = Math.floor((x - FL + off) / 24);
          let c = mx === 0 || my === 8 ? P4.j : my === 0 ? P4.l : hh(bx, row, sd + 70) < 0.3 ? P4.D : P4.d; if (mx === 2 && my > 0 && my < 8) c = my < 4 ? P4.l : c;
          if (hh(bx, row, sd + 71) < 0.12 && my > 1 && my < 7 && (mx + my) % 6 === 0) c = P4.j; // 금
          if (my > 0 && my < 8 && mx > 2 && dith(x >> 1, y >> 1, Math.max(0, vn(x / 60, y / 40, sd + 72) - 0.68) * 1.2)) c = P4.D; // 옅은 그을음
          pxW(x, y, c); }
        for (let y = base; y < FB; y += 2) pxW(x, y, y === base ? P4.l : y === FB - 2 ? P4.k : P4.D); } // 밑돌
      for (const ex of [FL & ~1, (FR - 2) & ~1]) for (let y = top; y < FB; y += 2) pxW(ex, y, P4.k); // 양 끝 외곽선 (좌우 벽 외곽선과 이어짐)
      const pil = (x0, tall) => { const y0 = top - (tall ? 14 : 8); for (let y = y0; y < FB; y += 2) for (let c = 0; c < 12; c += 2) { let col = c === 0 ? P4.k : c === 2 ? P4.h : c < 8 ? P4.l : c === 8 ? P4.d : c === 10 ? P4.k : P4.d;
          const ring = (y - y0 < 6) || (y >= FB - 6 && y < FB - 2); if (ring && c > 0 && c < 10) col = c < 6 ? P4.g : c < 8 ? P4.G : P4.o; if (y === y0) col = c === 0 || c === 10 ? P4.k : P4.g; px(x0 + c, y, col); } };
      }
    // 벽 윗면 (위에서 본 갓돌) — 좌 · 우 · 아래를 한 덩어리로: 바깥 둘레만 외곽선, 모서리에서 끊기지 않음 · 큰 돌 이음 · 아래 벽 앞 모서리는 밝은 턱
    { const yT = (T - 104) & ~1, yB = (B - 2 + PT) & ~1, inL = (x, y) => x >= FL && x < FL + PT && y >= yT && y < yB && !gapW(y), inR = (x, y) => x >= RR + 4 && x < RR + 4 + PT && y >= yT && y < yB && !gapE(y), inB = (x, y) => x >= FL && x < FR && y >= B - 2 && y < yB && !(gapS(x) && holeS(x, y));
      const inW = (x, y) => inL(x, y) || inR(x, y) || inB(x, y);
      for (let y = yT; y < yB; y += 2) for (let x = FL & ~1; x < FR; x += 2) { if (!inW(x, y)) continue; let c;
        const out = !inW(x - 2, y) || !inW(x + 2, y) || !inW(x, y - 2), front = !inW(x, y + 2);
        if (!inW(x - 2, y) || !inW(x + 2, y)) c = P4.k; else if (front && y === yB - 2) c = P4.h; else if (out) c = P4.k; // 아래 앞 모서리는 밝은 턱, 나머지 둘레는 외곽선
        else { const bandB = y >= B - 2 && !(inL(x, y) || inR(x, y)) , jy = ((y - T) % 24 + 24) % 24, jx = (x - FL) % 24, corner = y >= B - 2 && (inL(x, y) || inR(x, y)), joint = corner ? false : bandB ? jx === 0 : jy === 0; // 모서리 돌은 이음 없이 한 덩어리
          const lit = !inW(x - 4, y) || !inW(x, y - 4); c = joint ? P4.j : lit ? P4.h : hh(Math.floor(bandB ? (x - FL) / 24 : (y - T) / 24), bandB ? 1 : 2, sd + 73) < 0.25 ? P4.D : P4.l; }
        px(x, y, c); } }
    LY.flush(g);
    // v3.28 좌 · 우 문 통로: 벽 틈을 막던 옛 옆문 그림 대신, 방 바닥(재 쌓인 바닥)이 턱 끝 계단까지 그대로 이어짐 · 통로 양옆은 벽 끝 외곽선 · 가장자리에 흰 재가 쌓임
    for (const [on, sg] of [[dW, -1], [dE, 1]]) { if (!on) continue;
      const x0 = sg < 0 ? lipL & ~1 : RR & ~1, x1 = sg < 0 ? L & ~1 : lipR & ~1, w = x1 - x0, y0 = (PY - PW - 2) & ~1, h = ((PY + PW + 4) & ~1) - y0, sx = sg < 0 ? L & ~1 : (RR - w) & ~1; // 문 앞(비워 둔 자리) 방 바닥
      g.drawImage(g.canvas, sx, y0, w, h, x0, y0, w, h); // 방 안 재 바닥을 떠서 통로에 깖
      const P = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 2, 2); };
      { const wx0 = sg < 0 ? FL & ~1 : (RR + 4) & ~1; for (let x = wx0; x < wx0 + PT; x += 2) { P(x, y0 - 2, '#0b0a09'); P(x, y0 + h, '#0b0a09'); } } // 외곽선은 측면 벽이 끊긴 끝에만 (재 바닥 · 턱에는 없음)
      const AL = ['#5e5952', '#77726a', '#948e84', '#aaa49a']; // 방 바닥 재 더께와 같은 색
      for (let y = y0; y < y0 + h; y += 2) for (let x = x0; x < x1; x += 2) { const e = Math.min(y - y0, y0 + h - 2 - y), out = sg < 0 ? (x1 - x) / w : (x - x0) / w; // 벽 쪽 가장자리 · 바깥쪽일수록 재가 두껍게 (디더)
        const lv = clamp(Math.max(0, 1 - e / 14) * 0.9 + out * 0.35 + (vn(x / 14, y / 10, sd + 91) - 0.5) * 0.5, 0, 1); if (!dith(x >> 1, y >> 1, lv)) continue;
        P(x, y, AL[lv > 0.8 ? 3 : lv > 0.55 ? 2 : lv > 0.3 ? 1 : 0]); } }
    // v3.29 낡은 벽: 불탄 왕도답게 — 위에서 흘러내린 그을음 · 금 · 깨진 벽돌 모서리 · 떨어져 나간 갓돌 · 턱과 밑동에 쌓인 재 (좌 · 우 · 아래 벽 + 윗벽)
    { const Q = (x, y, c) => { g.fillStyle = c; g.fillRect(x & ~1, y & ~1, 2, 2); }, SO = ['#1a1714', '#100e0c'], AS = ['#c8c2b6', '#a8a296', '#8a857c'], CK = '#0e0d0c', CKL = '#5a554e';
      const yT = (T - 104) & ~1, yB = (B - 2 + PT) & ~1, faceT = (B - 2 + PT + 6) & ~1, faceB = (FB - 6) & ~1;
      const inBand = (x, y) => ((x >= FL + 2 && x < FL + PT - 2) || (x >= RR + 6 && x < RR + 2 + PT)) && y >= yT + 4 && y < yB - 2 && !(gapW(y) && x < L) && !(gapE(y) && x > RR) || (x >= FL + 2 && x < FR - 2 && y >= B && y < yB - 2 && !gapS(x));
      const inFace = (x, y) => x >= FL + 2 && x < FR - 2 && y >= faceT && y < faceB && !gapS(x) && !(dS && Math.abs(x - SX) < PW + 10);
      const nDoor = R.doors && R.doors.n != null && !hiddenDoor(R, 'n'), slots = PILLARS.slice(0, -1).map((x, i) => (x + PILLARS[i + 1]) / 2);
      const inTop = (x, y) => x >= L + 2 && x < RR - 2 && y >= T - 96 && y < T - 8 && !PILLARS.some(p => Math.abs(x - p) < 14) && !(nDoor && Math.abs(x - DOOR.n.x) < 64) && !slots.some(m => Math.abs(x - m) < 24); // v3.29 창 자리 장식은 위아래 전체를 그을음 · 금에서 뺌
      const any = (x, y) => inBand(x, y) || inFace(x, y) || inTop(x, y);
      // 1) 그을음: 벽 위에서 아래로 흘러내린 얼룩 (디더 · 위가 진함)
      for (let y = yT; y < FB; y += 2) for (let x = (FL & ~1); x < FR; x += 2) { if (!(inFace(x, y) || inTop(x, y))) continue;
        const col = vn(x / 12, 0.5, sd + 200) * 0.7 + vn(x / 40, 1.5, sd + 201) * 0.3, y0 = inFace(x, y) ? faceT : T - 96, k = clamp((y - y0) / (inFace(x, y) ? 40 : 70), 0, 1), lv = Math.max(0, col - 0.58) * 3 * (1 - k * 0.85); // 좁은 줄기 · 위에서 아래로 옅어짐
        if (lv > 0 && dith(x >> 1, y >> 1, Math.min(0.85, lv))) Q(x, y, lv > 0.55 ? SO[1] : SO[0]); }
      // 2) 금: 벽돌 몇 장을 가로지르는 갈라짐 (어두운 줄 + 아래 밝은 턱)
      const crack = (x, y, n, sg) => { for (let i = 0; i < n; i++) { if (!any(x, y)) return; Q(x, y, CK); if (any(x + 2, y)) Q(x + 2, y, CKL); y += 2; x += hh(i, x, sd + 210) < 0.45 ? sg * 2 : hh(i, y, sd + 211) < 0.2 ? -sg * 2 : 0; } };
      for (let i = 0; i < 40; i++) { const x = (FL + hh(i, 1, sd + 212) * (FR - FL)) & ~1, y = (yT + hh(i, 2, sd + 212) * (FB - yT)) & ~1; if (any(x, y) && !inBand(x, y)) crack(x, y, 7 + Math.floor(hh(i, 3, sd + 212) * 8), hh(i, 4, sd + 212) < 0.5 ? -1 : 1); }
      // 3) 깨진 벽돌 모서리: 앞면 벽돌 귀퉁이가 떨어져 나가 속이 드러남 (어둠 + 위 밝은 테)
      for (let i = 0; i < 46; i++) { const x = (FL + hh(i, 5, sd + 220) * (FR - FL)) & ~1, y = (faceT + hh(i, 6, sd + 220) * (faceB - faceT)) & ~1, w = 6 + Math.floor(hh(i, 7, sd + 220) * 3) * 2, sg = hh(i, 8, sd + 220) < 0.5 ? -1 : 1;
        for (let j = 0; j < w; j += 2) for (let k = 0; k < w - j; k += 2) { const xx = x + sg * k, yy = y + j; if (!inFace(xx, yy)) continue; Q(xx, yy, k === w - j - 2 ? CKL : j === 0 ? '#2a2724' : '#1c1a18'); } }
      for (let i = 0; i < 26; i++) { const x = (L + hh(i, 9, sd + 221) * (RR - L)) & ~1, y = (T - 90 + hh(i, 10, sd + 221) * 76) & ~1, w = 4 + Math.floor(hh(i, 11, sd + 221) * 2) * 2;
        for (let j = 0; j < w; j += 2) for (let k = 0; k < w - j; k += 2) { if (!inTop(x + k, y + j)) continue; Q(x + k, y + j, k === w - j - 2 ? CKL : '#1c1a18'); } }
      // 4) 떨어져 나간 갓돌: 벽 윗면 앞 모서리 · 바깥 모서리가 군데군데 이 빠짐
      for (let i = 0; i < 18; i++) { const x = (FL + 6 + hh(i, 12, sd + 230) * (FR - FL - 12)) & ~1, w = 4 + Math.floor(hh(i, 13, sd + 230) * 4) * 2, d = 2 + Math.floor(hh(i, 14, sd + 230) * 2) * 2; if (dS && Math.abs(x - SX) < PW + 20) continue;
        for (let k = 0; k < w; k += 2) for (let j = 0; j < d - (k === 0 || k === w - 2 ? 2 : 0); j += 2) Q(x + k, yB - 2 - j, j === 0 ? P4.k : '#2a2724'); }
      // 5) 재: 벽 윗면 · 밑동 · 앞면 줄눈 턱에 쌓인 흰 재 (디더)
      for (let y = yT; y < FB + 4; y += 2) for (let x = (FL & ~1); x < FR; x += 2) { let lv = 0;
        if (inBand(x, y)) lv = Math.max(0, vn(x / 16, y / 16, sd + 240) - 0.5) * 1.6;
        else if (y >= FB - 8 && y < FB + 4 && x >= FL && x < FR && !(dS && Math.abs(x - SX) < PW + 8)) lv = Math.max(0, vn(x / 12, 1, sd + 241) - 0.3) * (1 - (FB + 4 - y) / 12) * 1.6;
        else if (inFace(x, y) && hh(x >> 1, y >> 1, sd + 242) < 0.05 && ((y - faceT) % 10) === 6) lv = 1; // 벽돌 줄눈 턱에 얹힌 재 알갱이
        if (lv > 0 && dith(x >> 1, y >> 1, Math.min(0.9, lv))) Q(x, y, lv > 0.7 ? AS[0] : lv > 0.4 ? AS[1] : AS[2]); } }
    R._out4 = { bars: [dW && 'w', dE && 'e', dS && 's'].filter(Boolean) };
  }
  { const o = paintRoomFloor; paintRoomFloor = function (R) { const r = o.apply(this, arguments); if (on4(R)) withSeed((R.seed || 1) + 991, () => paint(fg, R)); return r; }; }
  // 좌 · 우 · 아래 문틀은 그리지 않음 (난간 기둥과 돌다리가 대신) · v3.29 북문도 성채 아치를 그리지 않음 — 4장 아치(23_sr4.js)가 보이게 해 남쪽 문과 같은 디자인
  { const o = paintDoorCastle; paintDoorCastle = function (g, d) { if (on4(G && G.dun && G.dun.cur)) return; return o.apply(this, arguments); }; }
  // 남쪽 문: 윗문과 같은 아치(왕관 쐐기돌) — 아래 벽 앞면에 서서 벽 위로 솟음 · 앞 레이어(아치 안쪽은 비워 지나가는 모습이 보이게)
  let ARCH = null, AGATE = null, ARCHM = null;
  function holeS(x, y) { if (!ARCHM) archInit(); const p = archPos(), ry = (y - p.y) & ~1; if (ry >= SR4.cv('arch').height) return true; if (ry < 0) return false; const m = ARCHM[ry >> 1]; return !!m && m[1] >= 0 && ry > 10 && x - p.x >= m[1] && x - p.x <= m[2]; } // 아치 안쪽 구멍 (지나가는 길)
  function archInit() { const src = SR4.cv('arch'), Wd = src.width, Ht = src.height, [c, g] = mkCanvas(Wd, Ht); g.drawImage(src, 0, 0); const id = g.getImageData(0, 0, Wd, Ht), dd = id.data;
    const dark = (r, gg, b) => r < 64 && gg < 56 && b < 48 && Math.abs(r - b) < 30; // v3.29 아치 안 바닥(어두운 갈색)까지 구멍으로 — 닫힌 창살이 바닥까지 내려와 떠 보이지 않게 // 아치 안쪽 어둠(C · c)
    const mask = []; for (let y = 0; y < Ht; y += 2) { let a = -1, b = -1; for (let x = 0; x < Wd; x += 2) { const o = (y * Wd + x) * 4; if (dd[o + 3] && dark(dd[o], dd[o + 1], dd[o + 2]) && x > 8 && x < Wd - 8) { if (a < 0) a = x; b = x; } } mask.push([y, a, b]); }
    for (const [y, a, b] of mask) if (a >= 0 && y > 10) for (let x = a; x <= b; x += 2) for (let k = 0; k < 2; k++) { const o = ((y + k) * Wd + x) * 4; dd[o + 3] = 0; dd[o + 4 + 3] = 0; }
    g.putImageData(id, 0, 0); ARCH = c; ARCHM = mask;
    // 내리닫이 쇠창살 (북문 것과 같은 결): 세로 창살 · 가로띠 셋 · 아래 창끝 · 가운데 왕관 판
    const r0 = mask.find(m => m[1] >= 0)[0], gH = Ht - r0, [gc, gg] = mkCanvas(Wd, gH), P = (x, y, col) => { gg.fillStyle = col; gg.fillRect(x, y, 2, 2); }, path = new Path2D();
    for (const [y, a, b] of mask) if (a >= 0) path.rect(a, y - r0, b - a + 2, 2);
    for (let y = 0; y < gH; y += 2) for (let x = 0; x < Wd; x += 2) { const m = (x >> 1) % 3, band = y === 10 || y === gH - 18 || y === Math.round(gH * 0.48 / 2) * 2; if (y >= gH - 4) { if (m === 0) P(x, y, y === gH - 2 ? '#2e2d34' : '#55535c'); continue; } if (band) P(x, y, m === 0 ? '#8a8894' : '#55535c'); else if (m === 0) P(x, y, '#8a8894'); else if (m === 1) P(x, y, '#2e2d34'); }
    { const cx = Wd / 2 & ~1, cy = Math.round(gH * 0.48 / 2) * 2 - 10; for (const [dx, dy, col] of [[-4, 0, '#c8a850'], [0, 0, '#c8a850'], [4, 0, '#c8a850'], [-4, 2, '#c8a850'], [-2, 2, '#8a6a30'], [0, 2, '#c8a850'], [2, 2, '#8a6a30'], [4, 2, '#c8a850'], [-4, 4, '#8a6a30'], [-2, 4, '#c8a850'], [0, 4, '#ff9a40'], [2, 4, '#c8a850'], [4, 4, '#5a4620']]) P(cx + dx, cy + dy, col); }
    AGATE = { c: gc, path, r0, H: gH }; }
  const archPos = () => { const { SX } = geo(), s = SR4.cv('arch'); return { x: (SX - s.width / 2) & ~1, y: (A.y1 + BH - s.height) & ~1 }; };
  function gateS(k) { if (!AGATE) archInit(); if (k <= 0) return; const p = archPos(), off = Math.round(AGATE.H * (1 - k) / 2) * 2; ctx.save(); ctx.translate(p.x, p.y + AGATE.r0); ctx.clip(AGATE.path); ctx.drawImage(AGATE.c, 0, -off); ctx.restore(); }
  { const o = roomEnts; roomEnts = function (list) { o(list); const R = G && G.dun && G.dun.cur; if (!on4(R) || !R._out4 || !R._out4.bars.includes('s')) return; if (!ARCH) archInit(); const p = archPos();
      list.push({ y: A.y1 + 12, d: () => { const st = doorState(R, 's'); gateS(st === 'boss' ? gateK() : G.sealAnim || 0); ctx.drawImage(ARCH, p.x, p.y); } }); }; }
  // 좌우 문: 북문 쇠창살을 90도 눕힌 모양 — 위로 올라가는 대신 바깥쪽 벽 속으로 밀려 들어감 (닫힐 땐 벽에서 미끄러져 나와 틈을 막음 · 창끝은 방 쪽)
  let SGATE = null;
  function sideGateInit() { const w = PT + 6, h = PW * 2 + 8, [c, g] = mkCanvas(w, h), P = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 2, 2); };
    for (let x = 0; x < w; x += 2) for (let y = 0; y < h; y += 2) { const m = (y >> 1) % 3, band = x === 2 || x === w - 8; if (x >= w - 4) { if (m === 0) P(x, y, x === w - 2 ? '#2e2d34' : '#55535c'); continue; } // 창끝 (방 쪽)
      if (band) P(x, y, m === 0 ? '#8a8894' : '#55535c'); else if (m === 0) P(x, y, '#8a8894'); else if (m === 1) P(x, y, '#2e2d34'); }
    { const cx = (w / 2 - 2) & ~1, cy = (h / 2) & ~1; for (const [dx, dy, col] of [[0, -4, '#c8a850'], [0, 0, '#c8a850'], [0, 4, '#c8a850'], [2, -4, '#c8a850'], [2, -2, '#8a6a30'], [2, 0, '#c8a850'], [2, 2, '#8a6a30'], [2, 4, '#c8a850'], [4, -4, '#8a6a30'], [4, -2, '#c8a850'], [4, 0, '#ff9a40'], [4, 2, '#c8a850'], [4, 4, '#5a4620']]) P(cx + dx, cy + dy, col); }
    const [cf, gf] = mkCanvas(w, h); gf.translate(w, 0); gf.scale(-1, 1); gf.drawImage(c, 0, 0); SGATE = { w: c, e: cf, W: w, H: h }; } // e: 창끝이 왼쪽(방 쪽)
  function sideGate(d, k) { if (!SGATE) sideGateInit(); if (k <= 0) return; const { L, RR, PY } = geo(), vis = Math.round(SGATE.W * Math.min(1, k) / 2) * 2, y = (PY - SGATE.H / 2) & ~1;
    if (d === 'w') { const x0 = (L - 2 - SGATE.W) & ~1; ctx.drawImage(SGATE.w, SGATE.W - vis, 0, vis, SGATE.H, x0 + SGATE.W - vis - (SGATE.W - vis), y, vis, SGATE.H); }
    else { const x0 = (RR + 2) & ~1; ctx.drawImage(SGATE.e, 0, 0, vis, SGATE.H, x0 + (SGATE.W - vis), y, vis, SGATE.H); } }
  { const o = drawSideLeaves; drawSideLeaves = function (d, k) { if (on4(G && G.dun && G.dun.cur)) return sideGate(d, k); return o.apply(this, arguments); }; }
  { const o = drawSeal; drawSeal = function (d, k) { if (d === 's' && on4(G && G.dun && G.dun.cur)) return; return o.apply(this, arguments); }; } // 남쪽 쇠창살은 앞 레이어(아치)에서 그림
  // 좌 · 우 문 횃불은 난간 안쪽으로
  { const o = gateParts; gateParts = function (d) { const r = o.apply(this, arguments); const R = G && G.dun && G.dun.cur; if (!on4(R) || (d !== 'w' && d !== 'e')) return r;
      const dx = d === 'w' ? 14 : -14; r.parts.forEach((q, i) => { q.x = (q.x + dx) & ~1; if (r.flames[i]) r.flames[i].x += dx; }); return r; }; }
  // v3.28 아래 벽은 캐릭터 · 적 · 시체와 남쪽 문 횃대를 가림: 벽 윗면 외곽선(A.y1 - 2)부터 아래로는 그리지 않음 (남쪽 문 틈은 열어 둠)
  const BLINE = () => A.y1 - 2;
  { const o = sideClip; sideClip = function (fn) { const R = G && G.dun && G.dun.cur; if (!on4(R)) return o(fn);
      return o(() => { ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - 200, A.y0 - 600, A.x1 - A.x0 + 400, BLINE() - (A.y0 - 600));
        if (R._out4 && R._out4.bars.includes('s')) { const { SX } = geo(); ctx.rect(SX - PW - 4, BLINE(), (PW + 4) * 2, 200); }
        ctx.clip(); try { return fn(); } finally { ctx.restore(); } }); }; }
  const CUT = new Map(); // 남쪽 문 횃대: 벽 윗면 아래는 잘라 낸 그림 (벽 뒤에 선 모습 · 잘린 자리는 벽 윗면 외곽선이 마감)
  { const o = gateParts; gateParts = function (d) { const r = o.apply(this, arguments); const R = G && G.dun && G.dun.cur; if (d !== 's' || !on4(R)) return r;
      const DN = 6; r.parts.forEach(q => { q.y += DN; q.sy += DN; }); r.flames.forEach(f => { f.y += DN; }); // v3.28 남쪽 문 횃대를 3칸 아래로
      r.parts = r.parts.map(q => { const h = Math.max(0, BLINE() - q.y) & ~1; if (h >= q.c.height) return q; const k = q.c.width + 'x' + q.c.height + ':' + h + ':' + G.stage; let c = CUT.get(k);
        if (!c || c.src !== q.c) { const [cc, g] = mkCanvas(q.c.width, Math.max(2, h)); g.drawImage(q.c, 0, 0); cc.src = q.c; CUT.set(k, cc); c = cc; } return Object.assign({}, q, { c }); });
      return r; }; }
  return { paint, wide: () => on4(G && G.dun && G.dun.cur), set on(v) { ON = v; }, get on() { return ON; } };
})();
;

// ==================================================================== 58_walldeco.js
'use strict';
// 잿빛 왕관 원정대 — 58_walldeco.js : v3.29 2장 · 4장 윗벽 장식 TO-BE (시안 _시안/2장_4장_벽장식_TOBE_시안01.html · 문장은 더 길게 · 창은 더 크게 44×78px)
//  · 4장 문장 깃발은 파란 바탕 · 아래가 곧은 깃발 + 금 술 (v3.29)
//  · 2장 창은 유리 없이 쇠창살(세로 3줄) + 뒤는 검은 어둠 (v3.29)
//  · 2장: 창 · 벽걸이 천 · 방패와 검 · 초상화 · 사슬 · 해골 벽감 / 4장: 잉걸빛 창 · 문장 · 초상화 · 유골함 벽감 (칸 = 2px)
//  · 종 · 칙령 · 기둥 깃발은 뺌 (4장 창 자리: 창 30% · 문장 30% · 초상화 20% · 유골함 20%)
const WDECO = (() => {
  const A_ = {"w2":{"rows":["......aaaaaaaaaa......",".....abbbbbccddda.....","....abbbbbbccdddda....","...abbbbeefgeedddda...","..abbbbgeehgeefdddda..",".abbbbfgeehgeehgdddda.",".abbbehgeehgeehgeddda.",".abbeehgeehgeehgeedda.",".abbeehgeehgeehgeedda.",".abbeehgeehgeehgeedda.",".abbeehgeehgeehgeedda.",".abbeehgeehgeehgeedda.",".aiieehgeehgeehgeeiia.",".abbeehgeehgeehgeedda.",".abbjjfjjjfjjjfjjjdda.",".abbkkkkkkkkkkkkkkdda.",".abbeehgeehgeehgeedda.",".abbeehgeehgeehgeedda.",".aiieehgeehgeehgeeiia.",".abbeehgeehgeehgeedda.",".acceehgeehgeehgeedda.",".acceehgeehgeehgeedda.",".acceehgeehgeehgeedda.",".acceehgeehgeehgeedda.",".aiieehgeehgeehgeeiia.",".accjjfjjjfjjjfjjjdda.",".acckkkkkkkkkkkkkkdda.",".acceehgeehgeehgeedda.",".acceehgeehgeehgeedda.",".acceehgeehgeehgeedda.",".aiieehgeehgeehgeeiia.",".acceehgeehgeehgeedda.",".acceehgeehgeehgeedda.",".abbbbbbbbbbbbbbbbbba.",".acccccccccccccccccca.","..aaddddddddddddddda..","....aaaaaaaaaaaaaaa...","......................","......................"],"pal":{"a":"#0b0a0e","b":"#5e5a6a","c":"#4a4656","d":"#3a3644","e":"#07060a","f":"#a8a6b6","g":"#36343e","h":"#7c7a8a","i":"#2c2934","j":"#55535f","k":"#1a1820"}},"tapestry2":{"rows":["a..................a","baaaaaaaaaaaaaaaaaab","cddddddddddddddddddc","effffffffffffffffffe","aaabbbbbbbbbbbbbbaaa","..abghggihhggihgba..","..aeghggihhggihgea..","..abgeeeeeeeeeegba..","..abghggihhggihgba..","..aeghggiccggihgea..","..abghggcbbcgihgba..","..abghgcbjjbcihgba..","..aeghggbjjbgihgea..","..abghggbjjbgihgba..","..abghgbbjjbbihgba..","..aeghgbjjjjbihgea..","..abghgbbbbbbihgba..","..abghggihhggihgba..","..aeghggihhggihgea..","..abgeeeeeeeeeegba..","..abghggihhggihgba..","..aeghggihhggihgea..","..abghggihhggihgba..","..abghggieaggihgba..","..aeghggaaaegihgea..","..abghaea..aaehgba..","..abgeaa.....aagba..","..aeaa........aea...","...a...........a....","...................."],"pal":{"a":"#0b0a0e","b":"#d0a848","c":"#f0d47a","d":"#5a3a22","e":"#9a7430","f":"#3a2414","g":"#5c1016","h":"#8a2028","i":"#b8343a","j":"#3a0a10"}},"tapestry2t":{"rows":["a..................a","baaaaaaaaaaaaaaaaaab","cddddddddddddddddddc","effffffffffffffffffe","aaabbbbbbbbbbbbbbaaa","..abghggihhggihgba..","..aeghggihhggihgea..","..abgeeeeeeeeeegba..","...ajhggihhggihgba..","...ajhggiccggihgea..","..abghggcbbcgihgba..","..abghgcbjjbcihgba..","..aegjggbjjbgihgea..","..abjajgbjjbgiggba..","..abjaabbjjbbihgba..","...ajaabjjjjbghgea..","..abjaabbbbbbihjba..","..abjaajihhghijaa...","..aejajgihhgjijaea..","..abgeeeeeeeaea.a...","..abghggihhjaa......","...ajhggihja........","...ajhggija.........","..abghggiea.........","..aeghjgja..........","..abgjaea...........","..abeeaa............","..aeaa..............","...a................","...................."],"pal":{"a":"#0b0a0e","b":"#d0a848","c":"#f0d47a","d":"#5a3a22","e":"#9a7430","f":"#3a2414","g":"#5c1016","h":"#8a2028","i":"#b8343a","j":"#3a0a10"}},"shield2":{"rows":["..........................","..a....................a..",".aba...a..........a...aba.","..aca.ada........ada.aca..","...aeabaaaaaaaaaaaadaea...","....affffffffgggggggfa....","...adhfiiiiiijjjjjjghba...","..adaafiiiiiijjjjjjgaada..","...a.afiikiiijjjkjjga.a...",".....afiiiiikbjjjjjga.....",".....afiiiibbbbjjjjga.....",".....afiiiiiijjjjjjga.....",".....afllllllmmmmmmga.....",".....afllllllmmmmmmga.....",".....afllllllmmmmmmga.....",".....afiiiiiijjjjjjga.....","......afiiiiijjjjjga......",".......afiiiijjjjga.......","......afffiiijjjggfa......",".....afhaffikjjggahfa.....","....afha.affijgga.ahfa....","...afha...afijga...ahfa...","..afha.....afga.....ahfa..","..aha.......aa.......aha..","...a..................a...",".........................."],"pal":{"a":"#0b0a0e","b":"#d0a848","c":"#3a2414","d":"#9a7430","e":"#5a3a22","f":"#a8a6b6","g":"#7c7a8a","h":"#55535f","i":"#b8343a","j":"#8a2028","k":"#f0d47a","l":"#c4b89c","m":"#8a7e66"}},"portrait2":{"rows":["abbbbbbbbaabbbbbbbba","bccccccccccccccccccb","bcddddddddddddddddcb","bcdeeeeeeeeeeeeeedcb","bcdefgfgfgfgfgfgedcb","bcdegfgfgfgfgfgfedcb","bcdefgfghhhhhgfgedcb","bcdegfghgijjghgfedcb","bcdefgfhiijjfgfgedcb","bcdegfgfikjkjfgfedcb","bcdefgfgiijjjgfgedcb","bcdegfgfiijjjfgfedcb","bcdefgfgfijjfgfgedab","bcdegfgllmmnnfgfedab","bcdefgllllnnnnfgedab","bcdeglllllnnnnnfedab","bcdeflllllnnnnngedab","bcdeglllllnnnnnfedab","bcdeflllllnnnnngedab","bcdeglllllnnnnnfedab","bcdeeeeeeeeeeeeeedab","bcddddddddddddddddab","bcccccccccaaaaaaaaab","abbbbbbbbbbbbbbbbbba"],"pal":{"a":"#d0a848","b":"#0b0a0e","c":"#f0d47a","d":"#9a7430","e":"#64481c","f":"#3a2a40","g":"#2a1e30","h":"#3a2418","i":"#e0b894","j":"#b8906c","k":"#2a1a14","l":"#8a2028","m":"#d8c8a0","n":"#5c1016"}},"chains2":{"rows":["..aaaaaaaaaaaaaaaaaa..",".abbbbbbbbbbbbbbbbbba.",".acdccccccddccccccdca.",".aeeeeeeeeeeeeeeeeeea.","..aaadbaaaaaaaadbaaa..","...adaaba....adaaba...","...adaaba....adaaba...","....abca......abca....","....abca......abca....","...afdba......adba....","...adaaba....adaaba...","...adaaba....adaaba...","....abca......abca....","....abca......abca....","....adba......adba....","...adaaba....adafba...","...adafba....adaaba...","...addcca.....abca....","..adaaaaca....abca....","..ada..aca....adba....","..addaaccba..adaaba...","...aa..aaa...adfaba...","..............abca....","..............abca....",".............addcca...","............adaaaaca..","............ada..aca..","............addaaccba.",".............aa..aaa..","......................"],"pal":{"a":"#0b0a0e","b":"#7c7a8a","c":"#55535f","d":"#a8a6b6","e":"#36343e","f":"#7a4a2a"}},"niche2":{"rows":[".....aaaaaaaaaa.....","....abbbbbbbcdda....","...abbbbbbbbcddda...","..abbbbeeeeeedddda..",".abbbbeeeeeeeedddda.",".abbbeeeeeeeeeeddda.",".abbeeffffffffffdda.",".abbeeffffffffffdda.",".abbeeffffffffffdda.",".abbeeffffffffffdda.",".abbeeffffffffffdda.",".abbeeffgggfffffdda.",".abbeefgggghffffdda.",".abbeeggggghhfffdda.",".abbeegiggighffjdda.",".abbeegiigiigffkdda.",".abbeeggggghhffldda.",".abbeemgigihmffldda.",".abbehmmhhhmmfnldda.",".abbenhmmmmmmnhldda.",".abbbbbbbbbbbbbbbba.",".acccccccccccccccca.","..aaddddddddddddda..","....aaaaaaaaaaaaa..."],"pal":{"a":"#0b0a0e","b":"#5e5a6a","c":"#4a4656","d":"#3a3644","e":"#141218","f":"#1e1c24","g":"#ece4d0","h":"#8a7e66","i":"#100c10","j":"#ffe08a","k":"#ff9a40","l":"#d8d0b8","m":"#2c2934","n":"#c4b89c"}},"w4":{"rows":["......aaaaaaaaaa......",".....abcbcbcdceca.....","....abcbcbcdcececa....","...abfbfgfgfgfefefa...","..abfbfhfgfgfffefefa..",".abfbfgfgfgfgfgfefefa.",".afbfgfhfgfgfffgfefea.",".abfgfgfgfgfgfgfgfefa.",".abbggghgggggfgiggeea.",".abbggghgggggfggggeea.",".abbggghiggggfggggeea.",".abbggghgggggfggggeea.",".accjjjhjjjjjfjjjjcca.",".abbjjjhjjjjjfjjjjeea.",".abbjjjhjjjjjfjjjjeea.",".abbjjjhjjjjjfjjjjeea.",".abbjjjhjjjjjfjjjjeea.",".abbjjihjjjjjfjjjjeea.",".accjjkhjjkjjfkjjjcca.",".abbjjjhjjjjjfjjjjeea.",".addklkhklklkfklkleea.",".addhhhhhhhhhhhhhheea.",".addklkhklklkfklkleea.",".addlllhlllklflklleea.",".accklkhklklkfklklcca.",".addlklhmklklflklkeea.",".addklkhnlkmmfklkleea.",".addlklhnmlnnflkmmeea.",".addkmmhnnknnfmlnneea.",".addlnnhnnmnnfnknneea.",".accmnnhnnnnofnmnncca.",".addnnohnnnnnfnonneea.",".addnnnhnonnnfnnnneea.",".abbbbbbbbbbbbbbbbbba.",".adddddddddddddddddda.","..aaeeeeeeeeeeeeeeea..","....aaaaaaaaaaaaaaa...","......................","......................"],"pal":{"a":"#0b0a0e","b":"#7e786e","c":"#383532","d":"#625d56","e":"#4c4842","f":"#2a2622","g":"#2a0c08","h":"#3a3632","i":"#d0501c","j":"#5a160c","k":"#c8481a","l":"#8a2a14","m":"#2a100a","n":"#140806","o":"#ff9a40"}},"crest4":{"rows":[".........abca.........","........adaada........","...aaaaadaaaadaaaaa...","..aeeeeeeeeeeeeeeeea..","..aeeeeeeeeffffffffa..","..aeggggggghhhhhhafa..","..aeggggggghhhhhhaa...","..aeggggggghhhhhhha...","..aeggggggghhhhhhhfa..","..aeggggeggehhehhhfa..","..aeggggeffeffehhhfa..","..aeggggfffifffhhhfa..","..aeggggjjjjjjjhhhfa..","..aeggggggghhhhhhhfa..","..aeggggggghhhhhhhfa..","..aegggjjjjjjjjhhhfa..","..aeggggggghhhhhhhfa..","..aeggggggefhhhhhhfa..","..aeggggggfjhhhhhhfa..","..aeggggffffffhhhhfa..","..aeggggggfjhhhhhhfa..","..aeggggggfjhhhhhhfa..","..aeggggggfjhhkhhhla..","..aeggggggfjhhhhhhfa..","..aeggggggfjkhkhkhla..","..aeggggggfjhkhhhkfa..","..aeggggggfjkhkhkhla..","..aeggggggfjhhhkhhfa..","..aeggggggfjkhkhkhla..","..aeggggggghhkhkhkfa..","..aeggggggghkhkkkhla..","..aeggggggghhkhkhkfa..","..aeggggggghkkkkkkla..","..aeeeeeeeefllflllfa..","..aeeeeeeeefllllllla..","..ajajajajajajajaja..."],"pal":{"a":"#0b0a0e","b":"#7c7a8a","c":"#55535f","d":"#5a3a22","e":"#f0d47a","f":"#d0a848","g":"#2e4e8e","h":"#203a6e","i":"#b8343a","j":"#9a7430","k":"#121a30","l":"#2a2018"}},"crest4b":{"rows":[".........abca.........","........adaada........","...aaaaadaaaadaaaaa...","..aeeeeeeeeeeeeeeeea..","..aeeeeeeeeffffffffa..","..aeggggggghhhhhhafa..","..aeggggggghhhhhhaa...","..aegggiigghhhhhhha...","..aegggijgghhhhhhhfa..","..aeggggeggehhehhhfa..","..aeggggeffeffehhhfa..","..aeggggfffkfffhhhfa..","..aegggglllllliihhfa..","..aeggggggghhhmihhfa..","..aeggngggnhhhnhhhoa..","..aeggglllpllllhhhfa..","..aenpngnpnhnpnhnhoa..","..aepnggpnaphnphhnfa..","..aenangnaainanhnhoa..","..aoaaina..aiaaninfa..","..apa.aia...a.aianoa..","..ana..a.......aanpa..","...a.............aia..","..................a...","......................","......................","......................","......................","......................","......................","......................","......................","......................","......................","......................","......................"],"pal":{"a":"#0b0a0e","b":"#7c7a8a","c":"#55535f","d":"#5a3a22","e":"#f0d47a","f":"#d0a848","g":"#2e4e8e","h":"#203a6e","i":"#1a1210","j":"#d0501c","k":"#b8343a","l":"#9a7430","m":"#8a2a14","n":"#121a30","o":"#2a1c14","p":"#3a2418"}},"portrait4":{"rows":["abbbbbbbbaabbbbbbbba","bccccccccccccccccccb","bcddddddddddddddddcb","bcdeeeeeeeeeeeeeedcb","bcdefgfgcgcgcgfgedcb","bcdeghhfaaaaafgfedcb","bcdefhfgiiiiigfgedcb","bcdegfgigjkkgigfedcb","bcdefgfijjkkfgfgedcb","bcdegfgfjlklkfgfedcb","bcdefgfgjjkkkgfgedcb","bcdegfgfjjkkkfgfedcb","bcdefgfgfjkkfgfgedab","bcdegfgmmaanofgfedab","bcdefgmmmmnopppgedab","bcdegmmmmmnppppqedab","bcdefmmmmmnoqppoedab","bcdegmmmmmnnnppfedab","bcdefmmmmmnnnohgedrb","bcdehhmmmmnnnnnferab","bcdeeeeeeeeeeeeeerrb","bcdddddddddddddrdrab","bcccccccccaaaarrrrrb","abbbbbbbbbbbbbbbbbba"],"pal":{"a":"#d0a848","b":"#0b0a0e","c":"#f0d47a","d":"#9a7430","e":"#64481c","f":"#3a2820","g":"#2a1c16","h":"#1a1210","i":"#4a3a2a","j":"#e0b894","k":"#b8906c","l":"#2a1a14","m":"#4a3a6a","n":"#2e2448","o":"#d0501c","p":"#0e0806","q":"#8a2a14","r":"#4a3a22"}},"urn4":{"rows":[".....aaaaaaaaaa.....","....abcbcbcbdbea....","...abcbcbcbcbebea...","..abcccbfffbfeebea..",".abcbcbfbfbfbfbebea.",".acbcbfbfbfbfbfbeba.",".accffggggggggggeea.",".accffggggggggggeea.",".accffggggggggggeea.",".accffggggggggggeea.",".accffggghhgggggeea.",".accffggiiiiggggeea.",".accffgjjjjjjgggeea.",".accffggkiikggggeea.",".accfflkiiiikgggeea.",".accfflkimmikggneea.",".accfflkiiiikggoeea.",".accffllkiiklggpeea.",".accfqlljjjjlgrpeea.",".accrqrjjjjjjqrpeea.",".acccccccccccccccca.",".adddddddddddddddda.","..aaeeeeeeeeeeeeea..","....aaaaaaaaaaaaa..."],"pal":{"a":"#0b0a0e","b":"#2a2622","c":"#7e786e","d":"#625d56","e":"#4c4842","f":"#18140f","g":"#262422","h":"#f0d47a","i":"#9a7430","j":"#d0a848","k":"#64481c","l":"#383532","m":"#5c1016","n":"#ffe08a","o":"#ff9a40","p":"#c8b898","q":"#c8c2b6","r":"#a8a296"}}};
  Object.assign(A_, {"w4b":{"rows":["......aaaaaaaaaa......",".....abcbcbcdceca.....","....abcbcbcdcececa....","...abfbfgfgfgfefefa...","..abfbfhfgfgfffefefa..",".abfbfgfgfgfgfgfefefa.",".afbfgfhfgfgfffgfefea.",".abfgfgfgfgfgfgfgfefa.",".abbggghggiggfjgjgeea.",".abbggghggkggfggggeea.",".abbggghggkggfjjjgeea.",".abbggghgikggfgjggeea.",".accggghgkkkgfjgjgcca.",".abbggghgkkkgfgjggeea.",".abbggghgkkkgfjgjgeea.",".abblllhlkkklfljlleea.",".abblllhlkkklfjljleea.",".abblllhlkkklflllleea.",".acclllhlkkklfjljlcca.",".abblllhlkkklfljlleea.",".addlllhlkkklfjljleea.",".addhhhhhhhhhhhhhheea.",".addlllhlkkklfjjjleea.",".addlllhkkkkkfljlleea.",".accmnmhkkkkkfjnjncca.",".addnnnhkkkkkfnjnneea.",".addmnmhkkkkkfmnmneea.",".addnnnhkkkkkfnmnneea.",".addmnmhkkkkkfonmneea.",".addnmnhkkkkkfomnmeea.",".accmnmhkkkkkfonmncca.",".addnmnhkkkkkfomnmeea.",".addmmmhkkkkkfommmeea.",".abbbbbbbbbbbbbbbbbba.",".adddddddddddddddddda.","..aaeeeeeeeeeeeeeeea..","....aaaaaaaaaaaaaaa...","......................","......................"],"pal":{"a":"#0b0a0e","b":"#7e786e","c":"#383532","d":"#625d56","e":"#4c4842","f":"#2a2622","g":"#1e0a08","h":"#3a3632","i":"#ff9a40","j":"#4a2a22","k":"#120604","l":"#3e120a","m":"#a8381a","n":"#6a1e0e","o":"#160806"}},"w4c":{"rows":["......aaaaaaaaaa......",".....abcbcbcdceca.....","....abcbcbcdcececa....","...abfbfgfgfgfefefa...","..abfbfhfgfgfffefefa..",".abfbfgfgfgfgfgfefefa.",".afbfgfhfgfgfffgfefea.",".abfgfgfgfgfgfgfgfefa.",".abbigihigigifigigeea.",".abbgighgigggfgggieea.",".abbigihigigifigigeea.",".abbjjjhjjjjjfjjjjeea.",".accjjjhjjjjjfjjjjcca.",".abbjjjhjjjjjfjjjjeea.",".abbjjjhjjjjjfjjjjeea.",".abbjjjhjjjjjfjjjjeea.",".abbjjjhjjjjjfjjjjeea.",".abbjjjhjjjjjfjjjjeea.",".acckkkhkkkkkfkkkkcca.",".abbkkkhkkkkkfkkkkeea.",".addkkkhkkkkkfkkkkeea.",".addhhhhhhhhhhhhhheea.",".addkllhkklkkfllkkeea.",".addkllhklllkflllkeea.",".acclllhklllkflllkcca.",".addlllhklllkflllkeea.",".addlllhlllllflllleea.",".addlmlhllmllflmlleea.",".addmmmhlmmmlfmmmleea.",".addmmmhlmmmlfmmmleea.",".accmnnhmmnmmfnnmmcca.",".addnnnhnnnnnfnnnneea.",".addnnnhnnnnnfnnnneea.",".abbbbbbbbbbbbbbbbbba.",".adddddddddddddddddda.","..aaeeeeeeeeeeeeeeea..","....aaaaaaaaaaaaaaa...","......................","......................"],"pal":{"a":"#0b0a0e","b":"#7e786e","c":"#383532","d":"#625d56","e":"#4c4842","f":"#2a2622","g":"#3a0e08","h":"#3a3632","i":"#5a1a0c","j":"#7a2010","k":"#b8401a","l":"#d0501c","m":"#ff9a40","n":"#ffe08a"}},"w4d":{"rows":["......aaaaaaaaaa......",".....abcbcbcdceca.....","....abcbcbcdcececa....","...abfbfgfgfgfefefa...","..abfbfhfgfgfffefefa..",".abfbfgfgfgfifgfefefa.",".afbfgfhfgfgfffgfefea.",".abfgfgfifgfgfgfgfefa.",".abbggihgggggfgggieea.",".abbigghgggggfgiggeea.",".abbggghgggggfggggeea.",".abbggghgggigfggggeea.",".accggghgigggfggggcca.",".abbggghgggggfggggeea.",".abbgighgggggfggigeea.",".abbggghgggggfigggeea.",".abbggghggggifggggeea.",".abbggghggiggfggggeea.",".accjjjhijjjjfjjjjcca.",".abbjjihjjjjjfjjjieea.",".addijjhjjjjjfjijjeea.",".addhhhhhhhhhhhhhheea.",".addjjjhjjjijfjjjjeea.",".addjjjhjijjjfjjjjeea.",".accjjjhjjjjjfjjjjcca.",".addjijhjjjjjfjjijeea.",".addjjjhjjjjjfijjjeea.",".addkkkhkkkkkfkkkkeea.",".addkkkhkkkkkflkkkeea.",".addkkkhkklkkfkkkkeea.",".accmmmhmmmmmfmmmmcca.",".addmmmhmmmmmfmmmmeea.",".addmmmhmmmmmfmmmmeea.",".abbbbbbbbbbbbbbbbbba.",".adddddddddddddddddda.","..aaeeeeeeeeeeeeeeea..","....aaaaaaaaaaaaaaa...","......................","......................"],"pal":{"a":"#0b0a0e","b":"#7e786e","c":"#383532","d":"#625d56","e":"#4c4842","f":"#2a2622","g":"#120808","h":"#3a3632","i":"#6a625a","j":"#1e0c0a","k":"#2e120c","l":"#d0501c","m":"#0c0605"}}}); // v3.29 4장 창 바깥 풍경 3종 더 (첨탑 실루엣 · 가까운 큰 불 · 재 내리는 밤)
  const G_ = {}; for (const k in A_) G_[k] = fromRows(A_[k].rows);
  const size = k => [G_[k][0].length * 2, G_[k].length * 2];
  // 창 자리 가운데(mx) 기준: 세로는 T0 + 42 가운데, 위가 T0 + 10보다 올라가면 거기에 맞춤 (v3.29 전체를 12px 내려 걸기)
  const DY = 12, pos = (k, mx, T0) => { const [w, h] = size(k); return [Math.round((mx - w / 2) / 2) * 2, Math.max(T0 + DY - 2, Math.round((T0 + 30 + DY - h / 2) / 2) * 2)]; };
  function draw(g, k, mx, T0) { const [x, y] = pos(k, mx, T0); gPaint(g, G_[k], A_[k].pal, x, y); }
  function fits(k, mx, T0) { const [w, h] = size(k), [x, y] = pos(k, mx, T0); return typeof OCC === 'undefined' || OCC.wall(x, y, w, h); }
  // v3.29 배치 규칙 (2장 · 4장 윗벽): 좌우 대칭 (기둥 포함) · 빈 벽도 있음 · 창이 있는 방은 창만 · 깃발 / 문장은 대칭 한 쌍(2개)만
  //  방마다 시드로 한 번 정함: 창 방(40%) — 대칭 쌍마다 창 75% / 빈 벽, 장식 방(60%) — 깃발 · 문장 한 쌍(70%) + 나머지 쌍은 빈 벽 45% / 다른 장식, 빈 쌍은 적어도 하나
  const slotX = i => Math.round((PILLARS[i] + PILLARS[i + 1]) / 4) * 2;
  function layout(R) { const n = Math.max(0, PILLARS.length - 1), key = n + ':' + PILLARS[0]; if (R && R._wdl && R._wdl.key === key) return R._wdl.v;
    let sd = ((R && R.seed) || 1) * 9301 + 49297 + n * 7; const rnd = () => (sd = (sd * 9301 + 49297) % 233280) / 233280;
    const st = G && G.stage, others = st === 4 ? ['portrait', 'niche'] : ['portrait', 'chains', 'niche'], v = Array(n).fill('empty'), P = n >> 1, pairs = [...Array(P).keys()];
    const set = (i, k) => { v[i] = k; v[n - 1 - i] = k; };
    if (rnd() < 0.4) { let any = false; for (const i of pairs) if (rnd() < 0.75) { set(i, 'window'); any = true; } if (!any && P) set(Math.floor(rnd() * P), 'window'); if (n % 2 && rnd() < 0.5) v[P] = 'window'; }
    else { const free = pairs.slice(); if (P && rnd() < 0.7) { const b = free.splice(Math.floor(rnd() * free.length), 1)[0]; set(b, rnd() < (st === 4 ? 0.34 : 0.5) ? 'banner2' : 'banner'); }
      const bag = others.slice().sort(() => rnd() - 0.5); let bi = 0; const next = () => bag[bi++ % bag.length]; // v3.29 나머지 장식은 쌍마다 서로 다른 것끼리 섞어 씀 (쌍 안은 대칭으로 같게)
      for (const i of free) set(i, rnd() < 0.45 ? 'empty' : next());
      if (free.length && !free.some(i => v[i] === 'empty')) set(free[Math.floor(rnd() * free.length)], 'empty');
      if (n % 2) v[P] = rnd() < 0.6 ? 'empty' : next(); }
    if (R) R._wdl = { key, v }; return v; }
  const ART2 = { banner: 'tapestry2', banner2: 'tapestry2t', portrait: 'portrait2', chains: 'chains2', niche: 'niche2', window: 'w2' };
  const ART4 = { banner: 'crest4', banner2: 'crest4b', portrait: 'portrait4', niche: 'urn4', window: 'w4' };
  // 슬롯 i에 그릴 그림 키 (없으면 null) — 대칭 짝 자리가 소품에 가려 못 걸면 둘 다 비움
  function pick(R, i, T0) { const v = layout(R), k = v[i]; if (!k || k === 'empty' || !(['banner', 'banner2', 'window'].includes(k) || (k === 'chains' && G.stage === 2))) return null; /* v3.63 깃발 · 문장 · 창만 + 2장은 사슬도 (초상화 · 벽감은 빈 벽) */ const a = (G.stage === 4 ? ART4 : ART2)[k]; if (!a) return null;
    const j = v.length - 1 - i; if (!(fits(a, slotX(i), T0) && fits(a, slotX(j), T0))) return null;
    if (a === 'w4') { const m = Math.min(i, j), q = (((R && R.seed) || 1) * 7 + m * 3) % 4; return ['w4', 'w4b', 'w4c', 'w4d'][q]; } // v3.29 4장 창 풍경 — 대칭 쌍은 같게, 쌍 · 방마다 다르게
    return a; }
  return { draw, fits, size, layout, pick, slotX };
})();
;

// ==================================================================== 59_pillars.js
'use strict';
// 잿빛 왕관 원정대 — 59_pillars.js : v3.29 2장 · 4장 뒷벽(윗벽) 기둥 퀄리티 업
//  · 2장 성채 석주: 맨 위 주두(판 · 쇠시리 · 목띠) · 마름돌을 쌓은 네모 기둥(돌마다 줄눈 · 왼쪽 빛 · 오른쪽 그늘 · 이 빠진 모서리 · 잔금 · 밑동 이끼) · 받침(둥근 띠 + 주춧돌)
//  · 4장 왕실 석주: 맨 위 주두(판 위 재 · 금 소용돌이 · 금 목띠) · 세로 홈 원기둥(홈마다 빛 받는 날 · 남은 금박) · 아래로 갈수록 그을음 · 잔금 · 받침(금 띠 · 주춧돌 위 재)
//  · 칸 = 2px · 가로 15칸(외곽선 포함) · 둘레 외곽선은 gOutline
const PILLARGEN = (() => {
  const hs = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  const BAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], dith = (x, y, t) => t * 16 > BAY[y & 3][x & 3];
  const W = 15, C = 7; // 가운데 칸
  const PAL2 = { k: '#08070b', a: '#5a566a', b: '#4a4658', c: '#3c3848', d: '#302d3a', e: '#24212c', f: '#18161e', m: '#3a4632', n: '#2a3424' };
  // 2장: rows = 그림 높이(칸) — 맨 아래 한 줄은 외곽선 자리(바닥 첫 칸)
  function gen2(rows, sd) {
    const g = Array.from({ length: rows }, () => Array(W).fill('.')), put = (x, y, c) => { if (y >= 0 && y < rows && x >= 0 && x < W) g[y][x] = c; };
    const bot = rows - 2; // 실제로 칠하는 마지막 줄
    // 주두
    for (let x = 1; x <= 13; x++) { put(x, 0, x < 12 ? 'a' : 'c'); put(x, 1, x < 3 ? 'b' : x > 11 ? 'e' : 'd'); }
    for (let x = 2; x <= 12; x++) { put(x, 2, x < 4 ? 'a' : x > 10 ? 'd' : 'b'); put(x, 3, x < 4 ? 'c' : x > 10 ? 'f' : 'e'); }
    for (let x = 3; x <= 11; x++) { put(x, 4, x < 6 ? 'a' : x > 9 ? 'd' : 'c'); put(x, 5, 'f'); }
    // 받침 (아래 7줄): 둥근 띠 2줄 + 주춧돌 4줄
    const b0 = bot - 6;
    for (let x = 2; x <= 12; x++) { put(x, b0, x < 4 ? 'a' : x > 10 ? 'd' : 'b'); put(x, b0 + 1, x < 4 ? 'c' : x > 10 ? 'f' : 'd'); }
    for (let y = b0 + 2; y <= bot; y++) for (let x = 1; x <= 13; x++) put(x, y, y === b0 + 2 ? (x < 12 ? 'a' : 'c') : y === bot ? 'e' : x < 3 ? 'b' : x > 11 ? 'e' : 'c');
    // 기둥 몸: 마름돌 (돌마다 높이가 조금씩 다름)
    const shade = x => x === 3 ? 'b' : x === 4 ? 'a' : x <= 6 ? 'b' : x <= 8 ? 'c' : x === 9 ? 'd' : 'e';
    let jy = 6 + Math.floor(hs(sd, 1) * 4), blk = 0;
    for (let y = 6; y < b0; y++) {
      const joint = y === jy; if (joint) { blk++; jy += 7 + Math.floor(hs(sd, blk + 3) * 4); }
      for (let x = 3; x <= 11; x++) { let c = joint ? 'f' : shade(x); if (!joint && y === jy - (jy - y) && false) c = 'a'; put(x, y, c); }
      if (!joint && g[y - 1] && g[y - 1][5] === 'f') for (let x = 4; x <= 7; x++) put(x, y, 'a'); // 줄눈 아래 돌 윗면 빛
      if (joint) { if (hs(sd, blk * 5) < 0.5) { put(3, y + 1, 'e'); put(3, y - 1, 'e'); } if (hs(sd, blk * 7) < 0.4) { put(11, y + 1, 'f'); put(10, y + 1, 'e'); } } // 이 빠진 모서리
    }
    // 잔금 (돌 두세 장에)
    for (let k = 0; k < 3; k++) { const y0 = 10 + Math.floor(hs(sd, 20 + k) * Math.max(1, b0 - 22)); let x = 5 + Math.floor(hs(sd, 30 + k) * 4); for (let i = 0; i < 5; i++) { if (g[y0 + i] && g[y0 + i][x] !== 'f') put(x, y0 + i, 'e'); if (hs(sd + i, k) < 0.5) x += hs(sd, i + k) < 0.5 ? -1 : 1; x = Math.max(4, Math.min(10, x)); } }
    // 밑동 이끼
    for (let y = b0 - 10; y < b0 + 2; y++) for (let x = 2; x <= 6; x++) if (g[y] && g[y][x] !== '.' && g[y][x] !== 'f' && hs(x * 3 + sd, y) < (y - (b0 - 10)) / 22) put(x, y, hs(x, y + sd) < 0.5 ? 'm' : 'n');
    return gOutline(g);
  }
  // 4장 (24_wall4 PAL 글자 그대로): k a h l d D j g G o
  function gen4(rows, sd) {
    const g = Array.from({ length: rows }, () => Array(W).fill('.')), put = (x, y, c) => { if (y >= 0 && y < rows && x >= 0 && x < W) g[y][x] = c; };
    const bot = rows - 2;
    // 주두: 판(위에 재) · 금 소용돌이 · 둥근 받침 · 금 목띠
    for (let x = 1; x <= 13; x++) { put(x, 0, hs(x, sd) < 0.6 ? 'a' : 'h'); put(x, 1, x < 12 ? 'l' : 'd'); put(x, 2, x < 3 ? 'd' : x > 11 ? 'D' : 'd'); }
    for (const [x, f] of [[1, 1], [13, -1]]) { put(x, 3, 'G'); put(x + f, 3, 'g'); put(x, 4, 'g'); put(x + f, 4, 'o'); }
    for (let x = 3; x <= 11; x++) { put(x, 3, x < 6 ? 'h' : x > 9 ? 'D' : 'l'); put(x, 4, x < 6 ? 'l' : x > 9 ? 'D' : 'd'); }
    for (let x = 3; x <= 11; x++) { put(x, 5, x < 7 ? 'g' : x > 9 ? 'o' : 'G'); put(x, 6, 'o'); }
    // 받침: 금 띠 · 둥근 띠 · 주춧돌(위에 재)
    const b0 = bot - 7;
    for (let x = 3; x <= 11; x++) { put(x, b0, x < 7 ? 'g' : x > 9 ? 'o' : 'G'); put(x, b0 + 1, 'o'); }
    for (let x = 2; x <= 12; x++) { put(x, b0 + 2, x < 4 ? 'h' : x > 10 ? 'D' : 'l'); put(x, b0 + 3, x < 4 ? 'l' : x > 10 ? 'j' : 'd'); }
    for (let y = b0 + 4; y <= bot; y++) for (let x = 1; x <= 13; x++) put(x, y, y === b0 + 4 ? (hs(x, sd + 9) < 0.55 ? 'a' : 'h') : y === bot ? 'D' : x < 3 ? 'h' : x > 11 ? 'D' : 'l');
    // 기둥 몸: 세로 홈 — 홈(어둠) 양옆에 빛 받는 날
    const FL = ['l', 'h', 'l', 'd', 'h', 'l', 'd', 'D', 'd']; // 3..11
    for (let y = 7; y < b0; y++) for (let x = 3; x <= 11; x++) put(x, y, x === 3 ? 'h' : x === 11 ? 'D' : FL[x - 3]);
    for (let y = 7; y < b0; y++) for (const x of [5, 8]) if ((y + sd) % 9 === 0) put(x, y, 'l'); // 홈 마디
    // 남은 금박 (홈 위쪽에 띄엄띄엄)
    for (let y = 8; y < Math.min(b0, 30); y++) for (const x of [4, 7]) if (hs(x + sd, y) < 0.16) put(x, y, hs(y, x) < 0.5 ? 'g' : 'G');
    // 아래로 갈수록 그을음 (디더)
    const H = b0 - 7; for (let y = 7; y < b0; y++) { const t = Math.max(0, (y - 7) / H - 0.45) * 1.6; for (let x = 3; x <= 11; x++) if (dith(x, y, t * (x > 7 ? 1 : 0.7))) put(x, y, x > 7 ? 'j' : 'D'); }
    // 잔금
    for (let k = 0; k < 2; k++) { let x = 5 + Math.floor(hs(sd, 40 + k) * 4); const y0 = 12 + Math.floor(hs(sd, 50 + k) * Math.max(1, b0 - 24)); for (let i = 0; i < 6; i++) { put(x, y0 + i, 'j'); if (hs(sd + i, k + 7) < 0.45) x += hs(i, k + sd) < 0.5 ? -1 : 1; x = Math.max(4, Math.min(10, x)); } }
    return gOutline(g);
  }
  return { gen2, gen4, PAL2, W };
})();
;
