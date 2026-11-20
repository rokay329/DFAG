'use strict';
// 잿빛 왕관 원정대 — 03_state.js : 성채 배경, 4장 재 색, 입력, 직업, 아이템, 강화 규칙, 스탯, 게임 상태, 페이즈
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

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
      if (typeof CUR_ROOM !== 'undefined' && CUR_ROOM && CUR_ROOM.sealW && Math.abs(mx - DOOR.n.x) < 110) continue; // v2.64 인장 벽 자리엔 창문 없음
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
      if (i % 2 === 1) {
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
    for (let t = 0; t < 2; t++) {
      let x = rand(A0.x0 + 40, A0.x1 - 40), y = rand(A0.y0 + 30, A0.y1 - 30); const a = rand(0, TAU);
      for (let i = 0; i < 14; i++) { x += Math.cos(a) * 14; y += Math.sin(a) * 9; if (x < A0.x0 + 8 || x > A0.x1 - 8 || y < A0.y0 + 8 || y > A0.y1 - 8) break; if ((typeof decFree === "function" && !decFree(x, y, 6, true))) continue; const s = i % 2 ? 4 : -4;
        g.fillStyle = '#3a3632'; g.fillRect((Math.round(x - Math.sin(a) * s) & ~1), (Math.round(y + Math.cos(a) * s * 0.6) & ~1), 4, 2); }
    }
    // 작은 재 둔덕과 타다 남은 잉걸
    for (let i = 0; i < 40; i++) { const x = Math.round(rand(A0.x0 + 6, A0.x1 - 10) / 2) * 2, y = Math.round(rand(A0.y0 + 6, A0.y1 - 8) / 2) * 2; if (Math.hypot(x - CX, y - CY) < 80 || (typeof decFree === "function" && !decFree(x, y, 6, true))) continue;
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
  function keyName(e) { const c = e.code || ''; if (/^Key[A-Z]$/.test(c)) return e.shiftKey ? c[3] : c[3].toLowerCase(); if (/^Digit[0-9]$/.test(c) && !e.shiftKey) return c[5]; return e.key; }
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
      skillD: '돌진한 뒤 크게 올려베며 푸른 검기를 날립니다.', awakenD: '회전베기 2번 뒤 빛의 거대검을 내려치고, 5초간 30% 확률로 흘려냅니다.',
      atkD: '묵직한 3연타, 3타는 회전베기입니다. 흘려내기: 맞을 때 10% 확률로 흘려냅니다.',
    },
    ranger: {
      n: '어세신', name: '네로', sub: '고양이 어세신', role: '근접 연타 딜러', map: 'hRanger', pal: 'hRanger', ghostPal: 'hRangerGhost', weapon: '쌍검',
      base: { atk: 18, def: 0, hp: 6, crit: 0.18, spd: 100 }, tier: { atk: '중', crit: '중', spd: '상' }, skill: '그림자 도약', skillCd: 7, awaken: '칼날 폭풍',
      skillD: '조준한 적의 등 뒤로 순간 이동해 X자로 베고, 반드시 치명타가 됩니다.', awakenD: '3초 동안 쌍검 회오리를 일으키고, 그동안 50% 확률로 흘려냅니다.',
      atkD: '빠른 3연타, 3타는 교차베기입니다. 베어내기: 기본 공격 중 맞을 때 10% 확률로 베어냅니다.',
    },
    mage: {
      dmgMul: 0.88, n: '마법사', name: '세리안', sub: '여우 마법사', role: '원거리 광역 딜러', map: 'hMage', pal: 'hMage', ghostPal: 'hMageGhost', weapon: '지팡이',
      base: { atk: 24, def: 0, hp: 5, crit: 0.12, spd: 90 }, tier: { atk: '상', crit: '중', spd: '중' }, skill: '화염구', skillCd: 10, awaken: '운석 낙하',
      skillD: '폭발하는 화염구를 날립니다. 범위 피해를 주고 3초 동안 화상을 입힙니다.', awakenD: 'E로 조준해 클릭한 지점에 운석을 떨어뜨리고, 넓게 화상을 입힙니다.',
      atkD: '마력탄을 연사하고 3발마다 큰 탄이 나갑니다. 마나 격류: 점멸 뒤 3초간 10% 확률로 흘려냅니다.', icons: ['bolt', 'fireball', 'meteor'],
    },
    priest: {
      n: '사제', name: '미레아', sub: '토끼 사제', role: '방패 · 버프', map: 'hPriest', pal: 'hPriest', ghostPal: 'hPriestGhost', weapon: '메이스',
      base: { atk: 20, def: 0, hp: 6, crit: 0.08, spd: 90 }, tier: { atk: '중', crit: '하', spd: '중' }, skill: '치유의 빛', skillCd: 12, awaken: '기적',
      skillD: '빛의 방패 1칸을 얻고 주변 적을 밀쳐냅니다.', awakenD: '3초 무적 빛기둥을 세웁니다. 챕터마다 한 번, 쓰러지면 저절로 발동합니다.',
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
  let CUR = SAVE.lastCls && CLASSES[SAVE.lastCls] ? SAVE.lastCls : 'knight';
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
    bulwark: { n: '태양 서약 대검', d: '돌진 참격을 2번까지 충전할 수 있습니다. 돌진한 길에 빛의 검기가 남았다가 터집니다.' },
    execsword: { n: '잿빛 왕의 처형검', d: '3타가 잿불 장판을 남깁니다. 각성 내려찍기의 둘레도 잿불로 탑니다.' },
    fangs: { n: '쌍둥이 송곳니', d: '퍼펙트 회피에 성공하면 그림자 도약이 충전됩니다. 도약한 뒤 2초 동안 은신합니다.' },
    kingrev: { n: '왕의 연발총', d: '6발을 연달아 쏩니다. 마지막 탄은 폭발하고, 재장전할 때 주변 적을 밀쳐냅니다.' },
    spearrain: { n: '날개 달린 성창', d: '기적 중에 성창이 떨어집니다. 기적 중 적을 처치할 때마다 기적이 0.5초 증가합니다.' },
    hourglass: { n: '모래시계 지팡이', d: '각성하면 3초 동안 시간이 멈춥니다. 시간이 다시 흐를 때 그동안 넣은 피해의 50%가 추가로 들어갑니다. 보스는 멈추는 대신 감소합니다.' },
    nine: { n: '아홉 목숨', d: '한 판에 한 번, 쓰러져도 되살아납니다. 적을 처치할 때마다 고양이 유령이 나타나 적을 쫓습니다.' },
    ashstar: { n: '잿빛 별의 홀', d: '화염구가 3갈래로 나갑니다. 운석 주위에 작은 운석 5개가 함께 떨어집니다.' },
    dawn: { n: '새벽 성가', d: '치유의 빛이 2초 동안 모든 피해를 막는 보호막도 함께 줍니다.' },
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
    echo: { n: '전투 집중', d: '특수 기술을 쓰면 3초 동안 치명타 확률이 25%p 증가합니다.' },
    greed: { n: '탐욕', d: '적을 처치하면 15% 확률로 금화 주머니가 떨어집니다.' },
    first: { n: '선제', d: '전투 방에 들어간 뒤 처음 3번의 공격은 반드시 치명타가 됩니다.' },
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
  // 성공률: 목표 단계 +1~+9 (v2.40 최대 +9, 대장간별 상한은 enhCap). +10 이상을 노리다 실패하면 1단계 하락, 실패할 때마다 다음 시도 +2%p (장인의 숨결)
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
  let G = null;
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
