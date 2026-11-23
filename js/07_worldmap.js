'use strict';
// 잿빛 왕관 원정대 — 07_worldmap.js : 챕터 시작 월드맵
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ v1.69 챕터 시작 월드맵
  // 240×160 도트 월드맵(4개 지역)을 화면 2px 칸으로 띄우고, 이번 챕터 지역만 밝히고(나머지는 어둡게),
  // 지나온 길을 이어 그은 뒤 금빛 테두리·노드 고리·챕터 이름 패찰을 보여 주고 F를 누르면 게임으로 넘어간다 (v2.56, 그리는 중 F는 건너뜀)
  const WM_IMG = 'data:image/png;base64,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';
  const WM_REGI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAACgCAMAAAAFBRFXAAADAFBMVEUAAAABAQECAgIDAwMEBAQFBQUGBgYHBwcICAgJCQkKCgoLCwsMDAwNDQ0ODg4PDw8QEBARERESEhITExMUFBQVFRUWFhYXFxcYGBgZGRkaGhobGxscHBwdHR0eHh4fHx8gICAhISEiIiIjIyMkJCQlJSUmJiYnJycoKCgpKSkqKiorKyssLCwtLS0uLi4vLy8wMDAxMTEyMjIzMzM0NDQ1NTU2NjY3Nzc4ODg5OTk6Ojo7Ozs8PDw9PT0+Pj4/Pz9AQEBBQUFCQkJDQ0NERERFRUVGRkZHR0dISEhJSUlKSkpLS0tMTExNTU1OTk5PT09QUFBRUVFSUlJTU1NUVFRVVVVWVlZXV1dYWFhZWVlaWlpbW1tcXFxdXV1eXl5fX19gYGBhYWFiYmJjY2NkZGRlZWVmZmZnZ2doaGhpaWlqampra2tsbGxtbW1ubm5vb29wcHBxcXFycnJzc3N0dHR1dXV2dnZ3d3d4eHh5eXl6enp7e3t8fHx9fX1+fn5/f3+AgICBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4ODh4eHi4uLj4+Pk5OTl5eXm5ubn5+fo6Ojp6enq6urr6+vs7Ozt7e3u7u7v7+/w8PDx8fHy8vLz8/P09PT19fX29vb39/f4+Pj5+fn6+vr7+/v8/Pz9/f3+/v7////isF19AAAB1UlEQVR42u3cbW6DMBREUS/MC5uFvYV5CVVVtWkhFGJMbDx3/oGIlAP+eMhAKj0T708qxYsMeHZxd3ABDJg+DJhpaViwW6XlVlqGGTgAzw0OwIDpw4ABAwYMGDDz8I29/cDhBY7wAocZOLzAEV7gADw3OAADpg8DZh4GPFRpCRgwYAYtwBQegLl5AAwYMGBGaQoPx5uHYgf2Wz3sKGZBnEceeKgFMM9pcYUBAwYMGDBgCo87vV0qabVDq52zvD8sLXnSet88b4jrTxabZ8UDfgNAe5nrKw86knqvasD5MxeBpUvFqgKXLW/Viajx1opVCS5580ycu8R6IY/fvOKtBH+16ic51aZVn8Pe6ibdzKtGOcatbtK7eTtY/5cvPxuNm3Q/75K8dVDKzS9uL+9v8fYxqZWxxqvm2R/9Umkv7uc9kHToX+bTGQ7culWP6v0Gt+/Hg3ofTfrKFDfw0wCeHZwBAwYMmFEa8DBgmYHlBZa8wDIDywsseYEFeG6wANOkATMtAR670gJMLQ0YMGAGLcAUHoABc7fEFQbMtGRZWtottfgtpvktlxouiPMkngE424EzYMCAGbQAAwYMGDDTEuD7iPuCsx0424Ez4NnBGTBg+vCZfAA0Ld/zdJjdIwAAAABJRU5ErkJggg==';
  const WM_PATH = [[12,150],[13,149],[15,148],[16,148],[17,147],[18,146],[19,146],[20,145],[21,144],[22,144],[24,143],[25,142],[26,141],[27,141],[28,140],[29,139],[30,138],[31,138],[32,137],[33,136],[34,135],[35,134],[36,133],[37,132],[38,131],[39,131],[40,130],[41,129],[42,129],[43,128],[44,128],[45,128],[46,128],[48,128],[49,128],[50,128],[52,128],[53,129],[54,129],[56,129],[57,130],[59,130],[60,131],[62,131],[63,131],[65,132],[66,132],[68,132],[69,133],[71,133],[72,133],[74,133],[75,134],[77,134],[79,134],[80,135],[82,135],[84,135],[85,135],[87,135],[89,136],[90,136],[92,136],[94,136],[96,136],[97,136],[99,136],[101,136],[103,136],[105,136],[107,136],[109,136],[111,136],[113,136],[114,136],[116,136],[118,136],[119,136],[121,136],[122,136],[124,136],[125,136],[127,135],[128,135],[129,135],[130,135],[132,134],[133,134],[134,134],[135,134],[136,133],[137,133],[138,133],[139,132],[140,132],[142,131],[143,131],[145,130],[146,129],[148,128],[149,127],[151,127],[152,126],[153,125],[155,125],[156,124],[157,124],[158,123],[160,123],[162,122],[163,122],[164,122],[165,122],[167,122],[168,121],[170,121],[171,121],[173,121],[175,121],[177,120],[179,120],[181,120],[182,120],[184,120],[186,119],[187,119],[189,118],[190,118],[191,117],[192,117],[194,116],[195,116],[196,115],[197,114],[198,113],[199,113],[200,112],[201,111],[201,110],[202,109],[203,108],[204,107],[204,105],[204,103],[204,102],[204,100],[203,98],[202,96],[201,94],[200,93],[200,91],[199,90],[198,88],[198,87],[197,85],[196,84],[195,83],[194,82],[193,80],[192,79],[191,78],[190,77],[189,76],[188,75],[186,74],[185,73],[183,71],[182,71],[181,70],[180,70],[179,69],[178,68],[177,68],[176,67],[175,67],[174,66],[173,65],[172,65],[171,64],[170,63],[169,63],[168,62],[167,61],[166,61],[165,60],[164,59],[163,58],[162,58],[162,57],[161,56],[160,55],[159,54],[158,54],[157,53],[156,52],[156,51],[155,51],[154,50],[153,49],[152,47],[151,46],[150,44],[149,43],[148,42],[146,41],[145,40],[144,40],[143,40],[141,39],[139,39],[137,38],[135,38],[132,38],[130,37],[128,37],[125,37],[123,37],[121,36],[119,36],[117,36],[115,36],[113,36],[112,36],[111,36],[109,36],[108,37],[108,39],[108,40],[107,41],[106,42],[104,43],[103,43],[102,44],[101,45],[100,45],[98,46],[97,46],[96,47],[94,47],[93,48],[91,49],[90,49],[89,49],[87,50],[86,50],[85,50],[83,50],[82,51],[81,51],[79,51],[78,51],[77,51],[75,51],[74,51],[73,50],[72,50],[70,50],[69,50],[68,50],[67,50],[65,50],[63,50],[62,49],[60,49],[59,49],[58,49],[57,48]]; // 길 픽셀 [x, y] 순서대로 (시작 → 1 → 2 → 3 → 4)
  const WM_FORGE = { 2: 90, 3: 156, 4: 221 }; // v1.89 2~4장 출발점 = 앞 장 끝의 출장 대장간 (길 번호)
  const WM_NODE = {"1":[44,128,30],"2":[164,122,111],"3":[168,62,181],"4":[56,48,266]}; // 스테이지 → [x, y, 길 번호]
  const WM_W = 240, WM_H = 160, WM_S = 2, WM_X = (VW - WM_W * WM_S) / 2, WM_Y = 4, WM_T = 6.0; // v1.70 4.4→7초 (사용자 요청: 더 길게) · v1.89 7→6초
  const WM = { ready: false, base: null, dim: {}, edge: {} };
  (function wmLoad() {
    const a = new Image(), b = new Image(); let n = 0;
    const done = () => { if (++n === 2) { try { wmBuild(a, b); } catch (err) { console.error(err); } } };
    a.onload = done; b.onload = done; a.src = WM_IMG; b.src = WM_REGI;
  })();
  function wmBuild(a, b) {
    const w = WM_W, h = WM_H, cv0 = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const cb = cv0(), xb = cb.getContext('2d'); xb.drawImage(a, 0, 0);
    const px = xb.getImageData(0, 0, w, h).data;
    const cr = cv0(), xr = cr.getContext('2d'); xr.drawImage(b, 0, 0);
    const rd = xr.getImageData(0, 0, w, h).data, reg = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) reg[i] = Math.round(rd[i * 4] / 60);
    const frame = (x, y) => x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
    for (let k = 1; k <= 4; k++) {
      const cd = cv0(), xd = cd.getContext('2d'), id = xd.createImageData(w, h), D = id.data;
      const ce = cv0(), xe = ce.getContext('2d'), ie = xe.createImageData(w, h), E = ie.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, o = i * 4;
        if (frame(x, y)) continue;
        if (reg[i] !== k) { // 다른 지역: 채도를 빼고 푸르스름하게 어둡게
          const l = px[o] * 0.3 + px[o + 1] * 0.59 + px[o + 2] * 0.11;
          D[o] = l * 0.38 + px[o] * 0.06; D[o + 1] = l * 0.38 + px[o + 1] * 0.06; D[o + 2] = l * 0.46 + px[o + 2] * 0.08; D[o + 3] = 255;
        } else { // 이번 지역의 가장자리 = 금빛 테두리
          let edge = false;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx >= 2 && ny >= 2 && nx < w - 2 && ny < h - 2 && reg[ny * w + nx] !== k) edge = true; }
          if (edge) { E[o] = 255; E[o + 1] = 214; E[o + 2] = 120; E[o + 3] = 255; }
        }
      }
      xd.putImageData(id, 0, 0); xe.putImageData(ie, 0, 0);
      WM.dim[k] = cd; WM.edge[k] = ce;
    }
    WM.base = cb; WM.ready = true;
  }
  function wmStart() {
    if (!WM.ready || !WM_NODE[G.stage]) return false;
    G.wm = { t: 0, s: G.stage, arrived: false };
    { const sk = $('wmSkip'); if (sk && !sk.wired) { sk.wired = true; sk.addEventListener('click', () => { if (G && G.wm) G.wm.skipClick = true; }); } }
    mode = 'wmap';
    for (const k in pressed) pressed[k] = false;
    return true;
  }
  function wmEnd() {
    G.wm = null; G.wmHome = null; { const ft = $('wmFoot'); if (ft) ft.classList.remove('on'); }
    for (const k in pressed) pressed[k] = false;
    if (CA.isRoom()) CA.greet(); else showStageParchment(G.stage, G.cls); // v2.52 왕도 성문 앞에서는 진입 문구를 성문이 열린 뒤로
  }
  function updateWorldIntro(dt) {
    const m = G.wm; if (!m) { mode = 'play'; return; }
    m.t += dt;
    // v2.56 F 키로 진행: 그리는 중이든 다 그린 뒤든 F 한 번이면 넘어감, 누르지 않으면 다 그린 뒤 기다린다 (터치는 탭) · ESC·「건너뛰기」 클릭도 같음
    const HOLD = WM_T - 0.7, go = () => take('f') || take('escape') || m.skipClick || (TOUCH.on && (take(' ') || take('enter') || take('j') || take('k')));
    { const ft = $('wmFoot'), on = !m.go && m.t >= 1.95; if (ft && ft.classList.contains('on') !== on) ft.classList.toggle('on', on); } // v2.56 지역 이름·설명이 다 나온 뒤 「F 건너뛰기」
    if (!m.go) {
      if (m.t > 0.5 && go()) { m.t = Math.max(m.t, HOLD); m.go = true; m.arrived = m.trace = true; sfx('select'); } // v2.56 F 한 번이면 언제든 바로 넘어감
      if (!m.go && m.t > HOLD) { m.t = HOLD; m.wait = (m.wait || 0) + dt; }
    }
    if (!m.trace && m.t >= 0.9) { m.trace = true; sfx('blip', 0.8); }
    if (!m.arrived && m.t >= 2.1) { m.arrived = true; sfx('select'); }
    if (m.t >= WM_T) wmEnd();
  }
  const wmStep = (v, n = 4) => Math.floor(clamp(v, 0, 1) * n) / n; // 페이드도 계단식(도트 느낌)
  function drawWorldIntro() {
    const m = G.wm; if (!m || !WM.ready) return;
    const t = m.t, s = m.s, S = WM_S, X0 = WM_X, Y0 = WM_Y;
    const A = t < 0.35 ? wmStep(t / 0.35) : t > WM_T - 0.7 ? wmStep((WM_T - t) / 0.7) : 1;
    if (A <= 0) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = A;
    ctx.fillStyle = '#07060a'; ctx.fillRect(0, 0, VW, VH);
    ctx.drawImage(WM.base, X0, Y0, WM_W * S, WM_H * S);
    // 다른 지역 어둡게
    const dA = wmStep((t - 0.45) / 0.4);
    if (dA > 0) { ctx.globalAlpha = A * dA; ctx.drawImage(WM.dim[s], X0, Y0, WM_W * S, WM_H * S); ctx.globalAlpha = A; }
    const P = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(X0 + x * S, Y0 + y * S, S, S); };
    // 지나온 길 (금빛) — 이번 구간은 이어 그어짐
    const i0 = s > 1 ? (WM_FORGE[s] != null ? WM_FORGE[s] : WM_NODE[s - 1][2]) : 0, i1 = WM_NODE[s][2];
    const tp = clamp((t - 0.9) / 1.2, 0, 1), ep = 1 - (1 - tp) * (1 - tp);
    const pre = (s === 1 && G.wmHome && HOME.wmPath(G.wmHome)) || [], tot = pre.length + (i1 - i0), cT = Math.round(tot * ep); // v2.55 시작 장소에서 출발하는 짧은 길
    const cur = i0 + Math.max(0, cT - pre.length);
    if (pre.length) { const [hx, hy] = pre[0]; for (const [dx, dy, c] of [[0, -2, '#c8a050'], [-1, -1, '#c8a050'], [1, -1, '#c8a050'], [-1, 0, '#8a6a3a'], [0, 0, '#100c08'], [1, 0, '#8a6a3a']]) P(hx + dx, hy + dy, c); // 시작 장소 표시 (작은 지붕)
      for (let i = 1; i < Math.min(cT, pre.length); i++) if (i % 4 !== 3) P(pre[i][0], pre[i][1], '#ffd86a'); }
    if (cT >= pre.length) for (let i = 0; i <= cur; i++) { if (i % 4 === 3) continue; const [x, y] = WM_PATH[i]; P(x, y, i <= i0 ? '#b08a3a' : '#ffd86a'); }
    // 지나온 노드는 붉은 X 표시
    for (let k = 1; k < s; k++) { const [x, y] = WM_NODE[k]; for (let d = -2; d <= 2; d++) { P(x + d, y + d, '#c83a2a'); P(x + d, y - d, '#c83a2a'); } }
    // 지역 테두리 (깜빡이다 고정)
    if (t > 1.0 && (t > 2.6 || Math.floor(t * 6) % 2 === 0)) ctx.drawImage(WM.edge[s], X0, Y0, WM_W * S, WM_H * S);
    // 원정대 깃발 (길 끝을 따라 이동, 2칸씩 통통)
    { const [x, y] = cT < pre.length ? pre[Math.max(0, cT)] : WM_PATH[cur], bob = m.arrived ? (Math.floor(t * 3) % 2) : 0;
      const FL = ['.kkk.', 'kyyyk', 'kyrrk', 'kyyk.', 'kp...', 'kp...', 'kp...'];
      const FC = { k: '#100c08', y: '#e8c060', r: '#a8302a', p: '#6a4a2a' };
      FL.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (FC[row[i]]) P(x - 1 + i, y - 12 + j - bob, FC[row[i]]); }); }
    // 노드 고리 (도착 후 퍼지는 도트 고리)
    if (m.arrived) {
      const [nx, ny] = WM_NODE[s], ph = ((t - 2.1) * 1.2) % 1, r = 8 + Math.floor(ph * 4) * 2;
      const seen = new Set(), col = ph < 0.5 ? '#ffe7a0' : '#c8a050';
      for (let a = 0; a < 64; a++) { const x = Math.round(nx + Math.cos(a / 64 * Math.PI * 2) * r), y = Math.round(ny + Math.sin(a / 64 * Math.PI * 2) * r * 0.8), key = x * 999 + y; if (!seen.has(key)) { seen.add(key); P(x, y, col); } }
    }
    // v3.23 네 지역을 묶은 이름 — 지도 위쪽 가운데 띠
    { const nA = wmStep((t - 0.2) / 0.4); if (nA > 0) { ctx.globalAlpha = A * nA; const tw = 236, th = 30, nx0 = Math.round((VW - tw) / 2), ny0 = Y0 + 8;
      ctx.fillStyle = '#0c0908'; ctx.fillRect(nx0 - 2, ny0 - 2, tw + 4, th + 4); ctx.fillStyle = '#6a4c2a'; ctx.fillRect(nx0, ny0, tw, th); ctx.fillStyle = '#16100c'; ctx.fillRect(nx0 + 2, ny0 + 2, tw - 4, th - 4);
      ctx.fillStyle = '#c8a050'; for (const sx of [nx0 - 10, nx0 + tw + 4]) { ctx.fillRect(sx, ny0 + th / 2 - 1, 6, 2); ctx.fillRect(sx + 2, ny0 + th / 2 - 3, 2, 6); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.font = '18px Galmuri11'; ctx.fillStyle = '#000'; ctx.fillText('영원한 어둠의 땅', VW / 2 + 2, ny0 + 23); ctx.fillStyle = '#e8dcc0'; ctx.fillText('영원한 어둠의 땅', VW / 2, ny0 + 21);
      ctx.globalAlpha = A; } }
    // 챕터 이름 패찰
    const pA = wmStep((t - 1.6) / 0.35);
    if (pA > 0) {
      ctx.globalAlpha = A * pA;
      const st = STAGES[s], pw = 400, ph = 74, px0 = Math.round((VW - pw) / 2), py0 = Y0 + WM_H * S + 8;
      ctx.fillStyle = '#0c0908'; ctx.fillRect(px0 - 2, py0 - 2, pw + 4, ph + 4);
      ctx.fillStyle = '#6a4c2a'; ctx.fillRect(px0, py0, pw, ph);
      ctx.fillStyle = '#1e140e'; ctx.fillRect(px0 + 2, py0 + 2, pw - 4, ph - 4);
      ctx.fillStyle = '#c8a050'; for (const [cx, cy] of [[px0, py0], [px0 + pw - 6, py0], [px0, py0 + ph - 6], [px0 + pw - 6, py0 + ph - 6]]) { ctx.fillRect(cx, cy, 6, 2); ctx.fillRect(cx, cy, 2, 6); ctx.fillRect(cx + 4, cy, 2, 6); ctx.fillRect(cx, cy + 4, 6, 2); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const tx = VW / 2, tl = (txt, y, font, c) => { ctx.font = font; ctx.fillStyle = '#000'; ctx.fillText(txt, tx + 2, y + 2); ctx.fillStyle = c; ctx.fillText(txt, tx, y); };
      tl(`STAGE ${s}${G.asc ? ' · 잿불 ' + G.asc : ''}`, py0 + 20, '16px Galmuri7', G.asc ? '#ffb040' : '#c8a050');
      tl(st.n, py0 + 46, '24px Galmuri11', '#f4e6bc');
      tl(st.sub, py0 + 66, '10px Galmuri9', '#a89a84');
    }
    ctx.globalAlpha = A;
    ctx.restore();
  }
  function drawTransition() {
    const tr = G && G.trans; if (!tr) return;
    const a = tr.phase === 'out' ? tr.t / tr.dur : 1 - tr.t / tr.dur;
    ctx.fillStyle = `rgba(0,0,0,${clamp(a, 0, 1)})`; ctx.fillRect(0, 0, VW, VH);
  }

  function startPhase(p) {
    window.AudioSys.setMood(stageMood(p === 11 ? 'Boss' : p === 5 ? 'Rest' : p === 10 ? 'Survive' : ''), true);
    G.phase = p; G.enemies = []; G.tele = []; G.hazards = []; G.proj = []; G.eproj = []; G.bonfire = null; G.vortex = null; G.boss = null;
    G.waveIdx = 0; G.spawning = 0; G.phaseT = 0; G.surviveT = 0; G.spawnT = 0; G.hazardT = 2;
    G.phaseState = 'intro';
    const P = G.player; P.state = 'idle'; P.dead = false; P.hp = Math.max(P.hp, 1);
    if (p === 11) { banner(STG().boss, STG().bossSub); $('bossName').textContent = STG().boss; sfx('boss'); G.bossTime = 300; }
    else banner(`STAGE ${G.stage} · PHASE ${p}`, p === 1 ? `${STG().n} — ${phaseLabel(p)}` : phaseLabel(p));
    if (p === 5) { G.bonfire = { x: clamp(P.x + 40, A.x0 + 30, A.x1 - 30), y: clamp(P.y - 20, A.y0 + 30, A.y1 - 30) }; P.hp = G.stats.hp; }
  }
  function phaseScale() { const p = Math.min(G.phase, 10); return { hp: 1 + 0.07 * (p - 1), atk: 1 + 0.05 * (p - 1) }; }

  function spawnPoint() {
    // 65%는 벽 가장자리·문 쪽에서 몰려 들어오고, 나머지는 방 안 빈자리. 플레이어와는 적당히 떨어진 곳
    const P = G.player, dmin = clamp(Math.min(A.x1 - A.x0, A.y1 - A.y0) * 0.45, 90, 200), obs = G.obs || [];
    const doors = G.dun && G.dun.cur ? Object.keys(G.dun.cur.doors).filter(d => G.dun.cur.doors[d] != null) : [];
    let best = null, bd = -1;
    for (let i = 0; i < 60; i++) {
      let x, y;
      const r = Math.random();
      if (r < 0.25 && doors.length) { const q = doorIn(pick(doors), 30); x = q.x + rand(-24, 24); y = q.y + rand(-14, 14); }
      else if (r < 0.65) { const side = randi(0, 3); x = side === 0 ? A.x0 + 24 : side === 1 ? A.x1 - 24 : rand(A.x0 + 24, A.x1 - 24); y = side === 2 ? A.y0 + 24 : side === 3 ? A.y1 - 24 : rand(A.y0 + 24, A.y1 - 24); }
      else { x = rand(A.x0 + 22, A.x1 - 22); y = rand(A.y0 + 22, A.y1 - 22); }
      x = clamp(x, A.x0 + 18, A.x1 - 18); y = clamp(y, A.y0 + 18, A.y1 - 18);
      if (obsHitL(obs, x, y, 18)) continue;
      const d = Math.hypot(x - P.x, y - P.y);
      if (d >= dmin && d < 480) return { x, y };
      if (d > bd) { bd = d; best = { x, y }; }
    }
    return best || freePoint(CX, CY);
  }
  function queueSpawn(type, at) {
    const pt = at || spawnPoint();
    G.spawning++;
    G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: isEliteT(type) ? 16 : type === 'bigslime' ? 13 : 10, t: 0, dur: 0.7, owner: null, onFire: () => { G.spawning--; G.enemies.push(makeEnemy(type, pt.x, pt.y)); burst(pt.x, pt.y - 6, '#2a1830', 10); } });
  }
  function spawnWave(w) { for (const [type, n] of w) for (let i = 0; i < n; i++) queueSpawn(type); const R = G.dun && G.dun.cur; if (ascOn(4) && w.length && R && (R.type === 'combat' || R.type === 'survive' || R.type === 'elite')) queueSpawn(w[0][0]); } // v1.96 무리: 웨이브마다 +1

  function updatePhase(dt) {
    G.phaseT += dt;
    const p = G.phase, alive = G.enemies.filter(e => !e.dead).length;
    if (G.phaseState === 'intro') {
      if (G.phaseT > 1.4) {
        G.phaseState = 'run'; G.phaseT = 0;
        if (STG().phases[p]) spawnWave(STG().phases[p][0]);
        if (p === 5) setTimeout(() => { if (G && G.phase === 5 && mode === 'play') openRest(); }, 900);
        if (p === 11) { if (G.stage === 1) spawnSlimeKing(); else if (G.stage === 3) spawnKrugash(); else if (G.stage === 4) spawnAshKing(); else spawnBoss(); }
      }
      return;
    }
    if (G.phaseState !== 'run') return;
    const PH = STG().phases;
    if (PH[p]) {
      if (alive === 0 && G.spawning === 0) {
        G.waveIdx++;
        if (G.waveIdx < PH[p].length) spawnWave(PH[p][G.waveIdx]);
        else phaseClear();
      }
    } else if (p === 10) {
      G.surviveT += dt;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && alive + G.spawning < STG().surviveMax) { G.spawnT = G.stage === 1 ? 1.7 : 1.35; let r = Math.random(); for (const [t, w] of STG().survive) { if (r < w) { queueSpawn(t); break; } r -= w; } }
      if (G.surviveT >= 60) {
        G.enemies.forEach(e => { if (!e.dead) killEnemy(e, true); });
        G.tele = [];
        phaseClear();
      }
    }
  }
  function phaseClear() {
    G.phaseState = 'clear'; G.phaseT = 0;
    banner('PHASE CLEAR', G.phase === 10 ? '무언가 다가온다…' : '');
    setTimeout(() => { if (G && mode === 'play' && G.phaseState === 'clear') startPhase(G.phase + 1); }, 1600);
  }

  // ---------------------------------------------------------------- 무기 휘두르기 (공용)
  // 적·보스 무기: bladeAng를 목표 각도로 따라가고, swing이 있으면 빠르게 휘두르며 잔상을 남긴다
  function startSwing(e, toAng, side, dur) {
    let d = angDiff(toAng, e.bladeAng);
    if (side > 0 && d < 0) d += TAU; if (side < 0 && d > 0) d -= TAU;
    e.sw = { from: e.bladeAng, d, t: 0, dur };
  }
  function updateBlade(e, dt) {
    if (e.sw) {
      e.sw.t += dt;
      e.bladeAng = e.sw.from + e.sw.d * easeOut(e.sw.t / e.sw.dur);
      e.trail.push({ a: e.bladeAng, t: 0.11 });
      if (e.sw.t >= e.sw.dur) e.sw = null;
    } else e.bladeAng = lerpAng(e.bladeAng, e.bladeTarget, dt * 9);
    for (const s of e.trail) s.t -= dt;
    e.trail = e.trail.filter(s => s.t > 0);
  }
