'use strict';
// 잿빛 왕관 원정대 — 15_lighting_title.js : 조명(GL·캔버스), 타이틀 화면 도트 그림
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ v1.78 조명 GL: 빛 지도를 GPU에서 계산하고 4×4 바이어 디더로 단계를 나눔
  // 2px 칸(384×216) 기준, 디더 무늬는 월드 좌표에 고정(카메라가 움직여도 점이 기어다니지 않음). 어둠 5단계 · 빛 색 12씩 단계.
  // 한 장의 GL 캔버스 왼쪽 절반 = 어둠(미리 곱한 알파), 오른쪽 절반 = 더할 빛 색. WebGL이 없거나 끊기면 예전 방식(v1.17)으로.
  const LGL = (() => {
    const W2 = VW / 2, H2 = VH / 2, MAXL = 64;
    try {
      const c = document.createElement('canvas'); c.width = W2 * 2; c.height = H2;
      const gl = c.getContext('webgl', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false, alpha: true, depth: false, stencil: false });
      if (!gl || gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) < MAXL * 2 + 8) return null;
      const VS = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
      const FS = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec4 L[${MAXL}]; uniform vec4 C[${MAXL}]; uniform int n; uniform vec2 cam; uniform vec3 dk; uniform float A0; uniform float N;
float b2(vec2 v) { return 2.0 * v.x + 3.0 * v.y - 4.0 * v.x * v.y; }
void main() {
  vec2 fc = floor(gl_FragCoord.xy);
  float hf = step(${W2}.0, fc.x); float x = fc.x - hf * ${W2}.0; float y = ${H2 - 1}.0 - fc.y;
  vec2 w = cam + (vec2(x, y) + 0.5) * 2.0;
  vec2 cell = vec2(x, y) + cam * 0.5;
  float t = (4.0 * b2(mod(cell, 2.0)) + b2(mod(floor(cell * 0.5), 2.0)) + 0.5) / 16.0;
  if (hf < 0.5) {
    float a = A0;
    for (int i = 0; i < ${MAXL}; i++) { if (i >= n) break; vec4 l = L[i]; float d = distance(w, l.xy); if (d < l.z) { float q = d / l.z; float f = q < 0.55 ? 1.0 - q / 0.55 * 0.45 : 0.55 * (1.0 - (q - 0.55) / 0.45); a *= 1.0 - l.w * f; } }
    float lv = A0 > 0.0 ? min(N, floor(a / A0 * N + t)) / N * A0 : 0.0;
    gl_FragColor = vec4(dk * lv, lv);
  } else {
    vec3 col = vec3(0.0);
    for (int i = 0; i < ${MAXL}; i++) { if (i >= n) break; vec4 cc = C[i]; if (cc.w <= 0.0) continue; vec4 l = L[i]; float rc = l.z * 0.8; float d = distance(w, l.xy); if (d < rc) col += cc.rgb * cc.w * (1.0 - d / rc); }
    col = min(floor(col * 255.0 / 12.0 + t) * 12.0 / 255.0, vec3(1.0));
    gl_FragColor = vec4(col, 1.0);
  }
}`;
      const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      gl.useProgram(pr);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const ap = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
      const U = {}; for (const k of ['L', 'C', 'n', 'cam', 'dk', 'A0', 'N']) U[k] = gl.getUniformLocation(pr, k);
      gl.viewport(0, 0, W2 * 2, H2); gl.disable(gl.BLEND);
      const st = { c, gl, U, W2, H2, MAXL, Lb: new Float32Array(MAXL * 4), Cb: new Float32Array(MAXL * 4), off: false };
      c.addEventListener('webglcontextlost', e => { e.preventDefault(); st.off = true; });
      return st;
    } catch (err) { console.warn('조명 GL 사용 안 함:', err); return null; }
  })();
  const LGL_DK = { 1: [14, 10, 30], 3: [20, 6, 4], 4: [12, 10, 8] };
  function renderLightingGL(vis) {
    const S = LGL, gl = S.gl, n = Math.min(S.MAXL, vis.length);
    if (vis.length > S.MAXL) vis = vis.slice().sort((a, b) => b.r * b.a - a.r * a.a); // 넘치면 크고 센 빛부터
    let anyC = false;
    for (let i = 0; i < n; i++) { const l = vis[i], j = i * 4; S.Lb[j] = l.x; S.Lb[j + 1] = l.y; S.Lb[j + 2] = l.r; S.Lb[j + 3] = l.a;
      if (l.c) { anyC = true; const p = l.cRGB || (l.cRGB = l.c.split(',').map(v => +v / 255)); S.Cb[j] = p[0]; S.Cb[j + 1] = p[1]; S.Cb[j + 2] = p[2]; S.Cb[j + 3] = l.ca; } else S.Cb[j + 3] = 0; }
    const dk = LGL_DK[G.stage] || [4, 3, 10];
    gl.uniform4fv(S.U.L, S.Lb); gl.uniform4fv(S.U.C, S.Cb); gl.uniform1i(S.U.n, n); gl.uniform2f(S.U.cam, CAMX, CAMY);
    gl.uniform3f(S.U.dk, dk[0] / 255, dk[1] / 255, dk[2] / 255); gl.uniform1f(S.U.A0, STG().dark); gl.uniform1f(S.U.N, 5);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    ctx.drawImage(S.c, 0, 0, S.W2, S.H2, CAMX, CAMY, VW, VH);
    if (anyC) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(S.c, S.W2, 0, S.W2, S.H2, CAMX, CAMY, VW, VH); ctx.restore(); }
  }
  // 조명: 어둠을 깔고 광원 자리만 지운 뒤, 따뜻한 빛을 더한다
  // v3.00 빛 자르기: l.clip = [x0, y0, x1, y1] (월드 좌표) 안에만 빛을 낸다 — 벽에 박힌 구슬 빛을 벽 안쪽 바닥에만 (벽에 잘린 반원)
  function clipL(g, l, f) { if (!l.clip) { f(); return; } g.save(); g.beginPath(); g.rect(l.clip[0], l.clip[1], l.clip[2] - l.clip[0], l.clip[3] - l.clip[1]); g.clip(); f(); g.restore(); }
  function renderLighting() {
    const P = G.player, lights = [];
    lights.push({ x: P.x, y: P.y - 8, r: 105, a: 0.95 });
    if (STG().torches) TORCHES.forEach((t, i) => { const lv = G.stage === 2 && !G.dun.forge ? [1, 2, 1, 0, 1, 2, 2, 1][Math.floor(time * 8 + i * 3) % 8] : -1; lights.push(lv < 0 ? { x: t.x, y: t.y + 20, r: 85 + Math.sin(time * 9 + t.x) * 3, a: 0.85, c: '255,150,60', ca: 0.12 } : { x: t.x, y: t.y + 20, r: 78 + lv * 8, a: 0.85, c: '255,150,60', ca: 0.09 + lv * 0.035 }); }); // v1.55 챕터2: 3단계로 일렁임
    if (G.drums && G.boss && G.boss.armorMul < 1) for (const d of G.drums) if (d.boss && !d.broken && !(d.drop > 0)) lights.push({ x: d.x, y: d.y - 20, r: 70 + (d.pulse || 0) * 90, a: 0.7, c: '255,60,30', ca: 0.12 + (d.pulse || 0) * 0.3 });
    if (G.bonfire) { const rs = G.dun && G.dun.cur && G.dun.cur.type === 'rest'; lights.push({ x: G.bonfire.x, y: G.bonfire.y + (rs ? 16 : -6), r: 170 + Math.sin(time * 12) * 5, a: 1, c: '255,140,50', ca: rs ? 0.13 : 0.22 }); } // v3.10 비스트로: 빛 중심을 솥 아래 불로 내려 솥 음영이 씻기지 않게
    if (P.state === 'attack' && P.trail.length) { const a = P.blade; lights.push({ x: P.x + Math.cos(a) * 30, y: P.y - 10 + Math.sin(a) * 30, r: 60, a: 0.6, c: '255,240,210', ca: 0.12 }); }
    if (P.awakenT > 0) lights.push({ x: P.x, y: P.y - 8, r: 120, a: 0.6, c: '255,210,90', ca: 0.18 });
    if (P.state === 'awaken') lights.push({ x: P.x, y: P.y - 14, r: 160 + (P.giant || 0) * 60, a: 0.9, c: '255,210,90', ca: 0.28 });
    if (P.state === 'storm') lights.push({ x: P.x, y: P.y - 10, r: 120, a: 0.8, c: '120,255,180', ca: 0.22 });
    if (P.state === 'shadow') lights.push({ x: P.x, y: P.y - 10, r: 70, a: 0.6, c: '170,110,240', ca: 0.18 });
    if (P.state === 'dodge' || P.state === 'skill' || P.state === 'charge') lights.push({ x: P.x, y: P.y - 10, r: 70, a: 0.6, c: '150,210,255', ca: 0.18 });
    for (const pr of G.proj) lights.push({ x: pr.x, y: pr.y, r: 70, a: 0.7, c: '150,210,255', ca: 0.22 });
    for (const pr of G.eproj) if (!['rock', 'arrow', 'quill'].includes(pr.kind)) lights.push({ x: pr.x, y: pr.y - 10, r: pr.kind === 'acid' || pr.kind === 'bile' ? 30 : pr.kind === 'tear' ? 26 : 44, a: 0.6, c: pr.kind === 'acid' || pr.kind === 'bile' ? '140,230,60' : pr.kind === 'tear' ? '255,140,60' : '255,50,60', ca: pr.kind === 'tear' ? 0.14 : 0.22 });
    for (const f of G.fx) if (f.kind === 'pillar') lights.push({ x: f.x, y: f.y - 30, r: 55, a: 0.6 * (f.t / f.max), c: '255,210,90', ca: 0.2 * (f.t / f.max) });
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (e.type === 'boss') lights.push({ x: e.x, y: e.y - 30 - (e.z || 0), r: e.kind === 'slimeking' ? 90 : e.kind === 'krugash' || e.kind === 'ashking' ? 120 : 70, a: 0.45, c: e.kind === 'slimeking' ? (e.stage === 3 ? '230,90,170' : '140,230,90') : e.kind === 'krugash' ? (e.stage === 3 ? '255,50,30' : '255,130,60') : '170,80,230', ca: 0.14 });
      else if (e.type === 'mordred') lights.push({ x: e.x + e.face * 4, y: e.y - 48, r: 34 + (e.state === 'guard' ? 30 : 0), a: 0.45, c: e.state === 'guard' ? '255,210,100' : '255,130,50', ca: 0.08 + (e.state === 'guard' ? 0.12 : 0) });
      else if (e.type === 'queen') lights.push({ x: e.x, y: e.y - 44, r: e.pose === 'weep' ? 50 : 32, a: 0.45 * (e.fadeA == null ? 1 : e.fadeA), c: '255,130,60', ca: e.pose ? 0.14 : 0.06 });
      else if (e.ash === 'lancer') lights.push({ x: e.x, y: e.y - 10, r: e.state === 'wind' ? 44 : 26, a: 0.4, c: '255,130,50', ca: e.state === 'wind' ? 0.16 : 0.06 }); // v1.27 잿더미 잉걸 심장
      else if (e.type === 'ghost') lights.push({ x: e.x, y: e.y - 12, r: 40, a: 0.4, c: '150,200,255', ca: 0.12 });
      else if (e.type === 'butcher') lights.push({ x: e.x, y: e.y - 24, r: 40 + 40 * (e.glow || 0), a: 0.45, c: '255,60,40', ca: 0.06 + 0.16 * (e.glow || 0) + (e.enraged ? 0.06 : 0) });
      else if (e.type === 'crow') lights.push({ x: e.x, y: e.y - (e.z || 0) - 6, r: 24, a: 0.4, c: '150,100,200', ca: 0.06 });
      else if (e.type === 'mother') lights.push({ x: e.x, y: e.y - 24, r: 50 + 40 * Math.max(e.glow || 0, e.state === 'bilecharge' ? 1 - e.t / e.chargeMax : 0), a: 0.5, c: '150,230,80', ca: 0.08 + 0.15 * (e.glow || 0) });
      else if (e.type === 'gbrute' || e.type === 'boar') lights.push({ x: e.x, y: e.y - 24, r: 40 + 40 * (e.glow || 0), a: 0.45, c: e.type === 'boar' ? '255,70,40' : '255,190,60', ca: 0.05 + 0.15 * (e.glow || 0) + (e.enraged ? 0.06 : 0) });
      else if (e.type === 'cultist' && e.state === 'wind') lights.push({ x: e.x, y: e.y - 18, r: 46, a: 0.6, c: '255,40,60', ca: 0.2 });
      else lights.push({ x: e.x, y: e.y - 8, r: 22, a: 0.25 });
    }
    for (const t of G.tele) if (t.shape !== 'spawn' && !(t.r > 600)) { const lx = t.shape === 'line' ? t.x + Math.cos(t.ang) * t.len / 2 : t.x, ly = t.shape === 'line' ? t.y + Math.sin(t.ang) * t.len / 2 : t.y; lights.push({ x: lx, y: ly, r: (t.shape === 'line' ? t.len / 2 : t.r) + 16, a: 0.45, c: t.mark ? '170,60,220' : '240,30,30', ca: 0.1 + 0.12 * (t.t / t.dur) }); }
    gearLights(lights); forgeLights(lights); CA.lights(lights); END.lights(lights); HOME.lights(lights); ARCH.lights(lights); TRUTH.lights(lights);
    for (const f of G.fx) if (f.kind === 'skybeam') lights.push({ x: f.x, y: f.y - 20, r: 90, a: 0.7 * (f.t / f.max), c: f.c, ca: 0.25 * (f.t / f.max) });
    for (const t of G.tele) if (t.shape !== 'spawn') { const c = teleCenter(t), boss = t.mark || isBossTele(t); lights.push({ x: c.x, y: c.y, r: (t.shape === 'line' ? t.len * 0.5 : t.r) + 20, a: boss ? 0.45 : 0.35, c: t.mark ? '190,100,255' : boss ? '255,160,80' : '255,70,50', ca: 0.06 }); } // 바닥 경고가 어둠에 묻히지 않게
    for (const h of G.hazards) lights.push({ x: h.x, y: h.y, r: 40, a: 0.35, c: '120,200,60', ca: 0.08 });
    for (const d of G.drops) if (d.t > 0.6) { const gr = gradeOf(d.it); lights.push({ x: d.x, y: d.y - 20, r: 90, a: 0.8, c: hexRgb(gr.c), ca: 0.25 }); }
    for (const l of G.loot) { const c = l.type === 'gear' ? hexRgb(gradeOf(l.it).c) : LOOT[l.type].light; lights.push({ x: l.x, y: l.y - 6, r: l.type === 'gear' ? 60 : 26, a: 0.55, c, ca: l.type === 'gear' ? 0.22 : 0.12 }); }
    for (const pr of G.mproj) lights.push({ x: pr.x, y: pr.y, r: pr.kind === 'fireball' ? 60 : pr.big ? 40 : 28, a: 0.7, c: pr.kind === 'fireball' ? '255,140,60' : '190,120,255', ca: 0.22 });
    if (G.meteor) { const m = G.meteor, k = Math.min(1, m.t / m.dur); lights.push({ x: m.x, y: m.y, r: m.fell ? 200 : 60 + 80 * k, a: m.fell ? 1 - m.post / 0.7 : 0.6, c: '255,140,60', ca: m.fell ? 0.4 * (1 - m.post / 0.7) : 0.12 + 0.12 * k }); }
    for (const f of G.fx) if (f.kind === 'muzzle') lights.push({ x: f.x, y: f.y, r: 50 * f.s, a: f.t / f.max, c: '255,200,120', ca: 0.35 * f.t / f.max });
    if (G.player.miracleT > 0 || G.player.shieldT > 0) lights.push({ x: G.player.x, y: G.player.y - 10, r: 60, a: 0.6, c: '255,225,140', ca: 0.18 });
    if (G.cls === 'mage' && !G.player.dead) { const tp = staffTip(); lights.push({ x: tp.x, y: tp.y, r: G.player.state === 'cast' ? 70 : 30, a: 0.5, c: G.player.state === 'cast' ? '255,150,70' : '190,120,255', ca: 0.12 }); }
    { const t = weaponTier(G.cls); if (t === 3 && !G.player.dead) lights.push({ x: G.player.x, y: G.player.y - 14, r: 70, a: 0.5, c: LEGEND_FX_COL[G.cls].c, ca: 0.12 + 0.04 * Math.sin(time * 6) }); }
    // v0.92 버프 이펙트가 어둠에 묻히지 않게: 보호막·강화한 적, 망령 기사 영혼 사슬에 빛
    for (const e of G.enemies) { const B = buffState(e); if (!B) continue; const h = enemyH(e);
      if (B.bar) lights.push({ x: e.x, y: e.y, r: Math.max(40, enemyW(e) * 2 + 20), a: 0.55, c: B.bar.c, ca: 0.1 + 0.05 * Math.sin(time * 4) });
      if (B.emp) lights.push({ x: e.x, y: e.y - 4, r: 34, a: 0.45, c: B.emp, ca: 0.1 }); }
    for (const f of G.enemies) if (f.type === 'flag' && !f.dead) { lights.push({ x: f.x, y: f.y - 50, r: 60, a: 0.55, c: '255,200,110', ca: 0.12 }); lights.push({ x: f.x, y: f.y, r: FLAG_R + 20, a: 0.25, c: '255,200,90', ca: 0.04 }); }
    if (G.boss && !G.boss.dead && G.boss.shield) for (const g2 of G.enemies) if (g2.type === 'ghost' && !g2.dead) for (let i = 1; i <= 3; i++) { const t = i / 4; lights.push({ x: g2.x + (G.boss.x - g2.x) * t, y: g2.y - 20 + (G.boss.y - 14 - g2.y) * t, r: 30, a: 0.4, c: '120,170,240', ca: 0.06 }); }
    if (G.frenzyT > 0) lights.push({ x: G.player.x, y: G.player.y - 12, r: 48, a: 0.5, c: '255,40,50', ca: 0.14 + 0.05 * Math.sin(time * 10) });
    for (const f of G.fx) if (f.kind === 'hitspark') lights.push({ x: f.x, y: f.y, r: f.r * 1.6, a: 0.4 * (f.t / f.max), c: f.c, ca: 0.07 * (f.t / f.max) });
    for (const f of G.fx) if (f.kind === 'hitflash') lights.push({ x: f.x, y: f.y, r: 50, a: 0.7 * (f.t / f.max), c: '255,240,200', ca: 0.2 * (f.t / f.max) });
    for (const p of G.parts) if (p.glow) lights.push({ x: p.x, y: p.y, r: 8, a: 0.4 });
    roomLights(lights);
    if (flashT > 0) lights.push({ x: cam.x + VW / 2, y: cam.y + VH / 2, r: 900, a: Math.min(1, flashT * 4), flash: OPT && !(LGL && !LGL.off && LIGHT_GL) });

    const vis = lights.filter(l => l.x + l.r > cam.x && l.x - l.r < cam.x + VW && l.y + l.r > cam.y && l.y - l.r < cam.y + VH);
    if (LGL && !LGL.off && LIGHT_GL) { renderLightingGL(vis); return; } // v1.78 GPU + 디더
    if (OPT) { // v1.17 빛 지도를 반 해상도로 (화면도 어차피 2px 칸으로 다시 뽑으므로 겉모습 같음) — 칠하는 넓이 1/4
      const fl = vis.find(l => l.flash), flK = fl ? 1 - Math.round(fl.a * 0.8 * DLV) / DLV : 1; // 번쩍일 때는 어둠을 단계로 옅게 (화면만 한 빛 도장을 새로 만들면 순간 멈춤)
      const H = LIGHTH, dark = `rgba(${G.stage === 1 ? '14,10,30' : G.stage === 3 ? '20,6,4' : G.stage === 4 ? '12,10,8' : '4,3,10'},${STG().dark * flK})`;
      H.g.setTransform(1, 0, 0, 1, 0, 0); H.g.globalCompositeOperation = 'source-over'; H.g.clearRect(0, 0, VW / 2, VH / 2); H.g.fillStyle = dark; H.g.fillRect(0, 0, VW / 2, VH / 2);
      H.g.globalCompositeOperation = 'destination-out'; H.g.setTransform(0.5, 0, 0, 0.5, -CAMX / 2, -CAMY / 2);
      for (const l of vis) { if (l.flash) continue; clipL(H.g, l, () => { if (LIGHT_DITH) stampL(H.g, l, false); else { const st = lightStamp(l.r, l.a, null, 0); H.g.drawImage(st.c, l.x - st.R, l.y - st.R); } }); }
      ctx.drawImage(H.c, 0, 0, VW / 2, VH / 2, CAMX, CAMY, VW, VH);
      let anyC = false; H.gg.setTransform(1, 0, 0, 1, 0, 0); H.gg.globalCompositeOperation = 'source-over'; H.gg.clearRect(0, 0, VW / 2, VH / 2);
      H.gg.globalCompositeOperation = 'lighter'; H.gg.setTransform(0.5, 0, 0, 0.5, -CAMX / 2, -CAMY / 2);
      for (const l of vis) if (l.c) { anyC = true; clipL(H.gg, l, () => { if (LIGHT_DITH) stampL(H.gg, l, true); else { const st = lightStamp(l.r, 0, l.c, l.ca); H.gg.drawImage(st.c, l.x - st.R, l.y - st.R); } }); }
      if (anyC) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(H.gc, 0, 0, VW / 2, VH / 2, CAMX, CAMY, VW, VH); ctx.restore(); }
      return;
    }
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, VW, VH);
    lg.fillStyle = `rgba(${G.stage === 1 ? '14,10,30' : G.stage === 3 ? '20,6,4' : G.stage === 4 ? '12,10,8' : '4,3,10'},${STG().dark})`; lg.fillRect(0, 0, VW, VH);
    lg.globalCompositeOperation = 'destination-out';
    lg.setTransform(1, 0, 0, 1, -CAMX, -CAMY);
    for (const l of vis) {
      if (OPT) { const st = lightStamp(l.r, l.a, null, 0); lg.drawImage(st.c, l.x - st.R, l.y - st.R); continue; } // v1.17 미리 그린 빛 도장
      const gr = lg.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      gr.addColorStop(0, `rgba(0,0,0,${l.a})`); gr.addColorStop(0.55, `rgba(0,0,0,${l.a * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = gr; lg.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    lg.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(lightC, CAMX, CAMY);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const l of vis) if (l.c) {
      if (OPT) { const st = lightStamp(l.r, 0, l.c, l.ca); ctx.drawImage(st.c, l.x - st.R, l.y - st.R); continue; }
      const gr = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.8);
      gr.addColorStop(0, `rgba(${l.c},${l.ca})`); gr.addColorStop(1, `rgba(${l.c},0)`);
      ctx.fillStyle = gr; ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    ctx.restore();
  }
  const hexRgb = h => `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;

  // ---- v1.05 화면 도트화: 월드를 다 그린 뒤 화면을 2px 칸 격자로 한 번 다시 뽑는다 (매끈한 선·호·그라데이션 이펙트도 칸 단위가 됨)
  // 카메라·흔들림이 2px에 맞춰져 있어 이미 칸에 맞는 스프라이트는 그대로 남는다. 월드 글자는 뭉개지지 않게 이 뒤에 그린다.
  const [PXL, PXLg] = mkCanvas(VW / 2, VH / 2); PXLg.imageSmoothingEnabled = false;
  let wtextDefer = false; const WTEXT = [];
  function fillTextW(t, x, y) { if (!wtextDefer) return ctx.fillText(t, x, y); WTEXT.push({ t, x, y, font: ctx.font, align: ctx.textAlign, base: ctx.textBaseline, fs: ctx.fillStyle, a: ctx.globalAlpha, m: ctx.getTransform() }); }
  function drawW(fn) { if (!wtextDefer) return fn(); WTEXT.push({ fn, m: ctx.getTransform(), a: ctx.globalAlpha }); } // v2.63 키캡 같은 그림도 조명 위에 (글자와 같이)
  // v1.06 카메라 격자를 플레이어 기준으로: 카메라와 플레이어를 따로 반올림하면 둘의 차이가 0/2px로 오가며 화면이 떨림 → 지연(카메라-플레이어)만 반올림해서 더함
  let CAMX = 0, CAMY = 0;
  let CAM_LX = 0, CAM_LY = 0, CAM_INIT = false;
  function camSnap() { // v1.07: 카메라가 실제로 움직이는 방향의 반대로는 격자가 되돌아가지 않게 (멈출 때·출발할 때 앞뒤 떨림 방지)
    const P = G && G.player;
    let cx = P && !cam.clX ? snap2(cam.x - P.x) + snap2(P.x) : snap2(cam.x), cy = P && !cam.clY ? snap2(cam.y - P.y) + snap2(P.y) : snap2(cam.y); // 방 가장자리에 걸려 멈춘 축은 카메라 그대로
    if (CAM_INIT && Math.abs(cx - CAMX) <= 4 && Math.abs(cy - CAMY) <= 4) {
      const vx = cam.x - CAM_LX, vy = cam.y - CAM_LY;
      if ((cx - CAMX) * vx <= 0 && cx !== CAMX && Math.abs(snap2(cam.x) - CAMX) <= 2) cx = CAMX;
      if ((cy - CAMY) * vy <= 0 && cy !== CAMY && Math.abs(snap2(cam.y) - CAMY) <= 2) cy = CAMY;
    }
    CAMX = cx; CAMY = cy; CAM_LX = cam.x; CAM_LY = cam.y; CAM_INIT = true;
  }
  function pixelPass() {
    if (PERF.noPP) { wtextDefer = false; for (const w of WTEXT) { ctx.save(); ctx.setTransform(w.m); if (w.fn) { ctx.globalAlpha = w.a; w.fn(); ctx.restore(); continue; } ctx.font = w.font; ctx.textAlign = w.align; ctx.textBaseline = w.base; ctx.fillStyle = w.fs; ctx.globalAlpha = w.a; ctx.fillText(w.t, w.x, w.y); ctx.restore(); } WTEXT.length = 0; return; } // 측정용: F9로 도트화 단계 건너뛰기
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    PXLg.clearRect(0, 0, VW / 2, VH / 2); PXLg.drawImage(cv, 0, 0, VW, VH, 0, 0, VW / 2, VH / 2);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(PXL, 0, 0, VW / 2, VH / 2, 0, 0, VW, VH); ctx.restore();
    wtextDefer = false;
    for (const w of WTEXT) { ctx.save(); ctx.setTransform(w.m); if (w.fn) { ctx.globalAlpha = w.a; w.fn(); ctx.restore(); continue; } ctx.font = w.font; ctx.textAlign = w.align; ctx.textBaseline = w.base; ctx.fillStyle = w.fs; ctx.globalAlpha = w.a; ctx.fillText(w.t, w.x, w.y); ctx.restore(); }
    WTEXT.length = 0;
  }
  // ================================================================ v1.12 타이틀 화면 도트 그림: 잿빛 하늘 · 달 · 성채 · 절벽 위 원정대와 모닥불 (v2.56 잿빛 세계: 사람 없는 잿빛 풍경, 떨어지는 빛 조각만 색을 지님)
  // 2px 칸(384×216). 가만있는 부분은 한 번 그려 두고, 재·불티·창불·모닥불만 매 프레임 칸 단위로 움직인다
  const TS = { cv: null, win: [], ash: [], emb: [] };
  function tsHash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function genTitleScene() {
    const [c, g] = mkCanvas(VW, VH), W = VW / 2, H = VH / 2, C = (x, y, col) => { g.fillStyle = col; g.fillRect(x * 2, y * 2, 2, 2); };
    // v2.56 하늘: 색을 빼앗긴 잿빛 (위는 먹빛, 지평선 쪽은 옅은 재)
    const SKY = ['#060608', '#0a0a0d', '#0f0f12', '#151518', '#1c1c1f', '#242426', '#2c2c2e', '#353536', '#3e3e3e'];
    for (let y = 0; y < H; y++) { const t = Math.min(SKY.length - 1.001, y / 168 * (SKY.length - 1)), i = Math.floor(t), f = t - i; for (let x = 0; x < W; x++) C(x, y, dith(x, y, f) ? SKY[i + 1] : SKY[i]); }
    // 별 몇 개 (위쪽만)
    for (let i = 0; i < 70; i++) { const x = Math.floor(tsHash(i, 3) * W), y = Math.floor(tsHash(i, 7) * 70); C(x, y, tsHash(i, 9) < 0.2 ? '#c8c8cc' : '#4a4a50'); }
    // 달: 잿빛 원반 + 잿빛 달무리 (v2.56 붉은 기 뺌)
    const mx = 300, my = 48, mr = 30;
    for (let y = -mr - 16; y <= mr + 16; y++) for (let x = -mr - 16; x <= mr + 16; x++) { const d = Math.hypot(x, y); if (d > mr && d < mr + 16 && dith(mx + x, my + y, (1 - (d - mr) / 16) * 0.55)) C(mx + x, my + y, d < mr + 6 ? '#4a4a4c' : '#2e2e32'); }
    for (let y = -mr; y <= mr; y++) for (let x = -mr; x <= mr; x++) { const d = Math.hypot(x, y); if (d > mr) continue;
      const n = tsHash((x + 40) >> 2, (y + 40) >> 2) * 0.6 + tsHash((x + 40) >> 1, (y + 40) >> 1) * 0.4, lit = (x * -0.5 + y * -0.7) / mr;
      let col = n > 0.72 ? '#9e9e9c' : n > 0.6 ? '#b2b2ae' : '#cacac4'; if (lit > 0.45 && dith(x + 99, y + 99, (lit - 0.45) * 1.6)) col = n > 0.6 ? '#8e8e8c' : '#a8a8a4'; if (d > mr - 1.4) col = '#88888a'; if (lit < -0.6 && d < mr - 2) col = '#e2e2dc';
      C(mx + x, my + y, col); }
    // 구름 띠 (달 앞은 비움)
    for (const [cy, x0, x1, hh, col] of [[60, 150, 384, 3, '#19191c'], [72, 200, 360, 2, '#242427'], [36, 240, 384, 2, '#141417'], [92, 120, 330, 2, '#2e2e31']]) for (let x = x0; x < x1; x++) { const w = hh + Math.round(Math.sin(x * 0.09 + cy) * 1.4 + Math.sin(x * 0.23) * 0.8); for (let k = 0; k < w; k++) if (Math.hypot(x - mx, cy + k - my) > mr + 1 && dith(x, cy + k, 0.85 - k * 0.15 - (x < x0 + 20 ? (x0 + 20 - x) / 20 : 0))) C(x, cy + k, col); }
    // 먼 산 두 겹 (위 테에 달빛)
    const ridge = (base, amp, seed, col, rim) => { for (let x = 0; x < W; x++) { const h = base - Math.abs(Math.sin(x * 0.031 + seed)) * amp - Math.abs(Math.sin(x * 0.083 + seed * 2)) * amp * 0.45 - tsHash(x >> 2, seed) * 3; for (let y = Math.floor(h); y < H; y++) C(x, y, y === Math.floor(h) ? rim : col); } };
    ridge(150, 26, 1.3, '#1b1b1f', '#38383c'); ridge(166, 16, 4.1, '#131316', '#27272b');
    // 성채 마스크
    const M = Array.from({ length: H }, () => new Uint8Array(W)), R = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && x < W && y >= 0 && y < H) M[y][x] = 1; };
    const cren = (x0, x1, y) => { for (let x = x0; x <= x1; x++) if (((x - x0) >> 1) % 2 === 0) { M[y][x] = 1; M[y - 1][x] = 1; } };
    const cone = (x0, x1, y0, apex) => { const cx = (x0 + x1) / 2, hw = (x1 - x0) / 2 + 1; for (let y = apex; y <= y0; y++) { const k = (y - apex) / (y0 - apex), w = Math.round(hw * k); for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) M[y][x] = 1; } M[apex - 1][Math.round(cx)] = 1; M[apex - 2][Math.round(cx)] = 1; };
    for (let x = 236; x <= 364; x++) { const top = Math.round(146 + ((x - 300) / 64) ** 2 * 16 + tsHash(x >> 1, 5) * 2); R(x, top, x, 175); } // 바위 언덕
    R(256, 116, 344, 150); cren(256, 344, 115); // 성벽
    R(284, 74, 316, 150); cren(284, 316, 73); // 본성
    R(260, 92, 272, 150); cone(259, 273, 91, 76); // 왼쪽 큰 탑
    R(246, 110, 254, 150); cone(245, 255, 109, 98); // 왼쪽 작은 탑
    R(330, 96, 342, 150); for (let x = 330; x <= 342; x++) { const j = Math.round(Math.abs(Math.sin(x * 1.7)) * 5); for (let y = 96 - j; y < 96; y++) M[y][x] = 1; } // 오른쪽 무너진 탑
    R(348, 112, 356, 150); cone(347, 357, 111, 100); // 오른쪽 작은 탑
    // 성채 칠하기: 몸은 아주 어둡게, 위·달쪽 테두리에 달빛, 벽돌결 디더
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!M[y][x]) continue;
      const up = y > 0 && !M[y - 1][x], side = (x < W - 1 && !M[y][x + 1] && x < mx) || (x > 0 && !M[y][x - 1] && x > mx);
      let col = '#0e0e10'; if ((y % 4 === 0 || ((x + (y >> 2) * 3) % 8 === 0)) && dith(x, y, 0.5)) col = '#151517';
      if (side) col = '#28282c'; if (up) col = '#46464a'; C(x, y, col); }
    // 성문 (붉은 빛) · 걸린 찢어진 깃발
    for (let y = 136; y <= 150; y++) for (let x = 294; x <= 306; x++) { const ar = y < 140 ? Math.hypot(x - 300, (y - 140) * 1.4) <= 6.5 : true; if (ar) C(x, y, y > 146 ? '#2c2c2e' : dith(x, y, (y - 136) / 14) ? '#1e1e20' : '#0a0a0c'); }
    for (const bx of [288, 309]) for (let y = 78; y < 98; y++) for (let x = bx; x < bx + 4; x++) { if (y > 92 && (x + y) % 3 === 0) continue; C(x, y, x === bx ? '#4a4a4e' : y === 78 ? '#6a6a6a' : '#333336'); }
    TS.win = [[264, 100], [268, 112], [288, 86], [296, 92], [304, 86], [312, 98], [290, 110], [310, 112], [334, 104], [250, 118], [352, 120], [300, 104]];
    // 앞 절벽: 원정대가 선 바위 턱 (왼쪽 글자 쪽으로 갈수록 낮아짐)
    const ledgeTop = x => Math.round(178 + Math.max(0, (220 - x) / 220) ** 1.5 * 22 + Math.sin(x * 0.11) * 1.2 + Math.sin(x * 0.037) * 1.5 + (x > 330 ? (x - 330) * 0.25 : 0)); // 한 줄로 이어진 능선 (v1.12: 왼쪽 계단처럼 끊기던 것 수정)
    TS.ledge = ledgeTop;
    for (let x = 0; x < W; x++) { const t = ledgeTop(x); for (let y = t; y < H; y++) { const d = y - t, n = tsHash(x >> 1, y >> 1);
      let col = d === 0 ? '#5e5e62' : d < 2 ? '#424246' : n < 0.18 ? '#101012' : (x + y * 2) % 13 === 0 ? '#1a1a1d' : d < 8 ? '#2b2b2f' : '#202023';
      if (d > 2 && ((x * 3 + y) % 29 === 0 || (x - y * 2 + 300) % 31 === 0)) col = '#101012'; // 바위 틈
      C(x, y, col); }
      if (x > 150 && tsHash(x, 1) < 0.35) { C(x, t - 1, '#36363a'); if (tsHash(x, 2) < 0.4) C(x, t - 2, '#4e4e50'); } } // 마른 풀
    // 죽은 나무 실루엣 (오른쪽 끝) · 꽂힌 깃대
    { const tx = 372, tb = ledgeTop(372); for (let y = tb - 34; y < tb; y++) C(tx, y, '#0e0e10'), C(tx + 1, y, '#0e0e10'); for (const [x0, y0, dx, n] of [[tx, tb - 24, -1, 9], [tx + 1, tb - 30, 1, 8], [tx, tb - 16, -1, 6], [tx + 1, tb - 12, 1, 5]]) for (let i = 0; i < n; i++) C(x0 + dx * i, y0 - (i >> 1), '#0e0e10'); }
    { const fx = 212, fb = ledgeTop(212); for (let y = fb - 30; y < fb; y++) C(fx, y, '#3a3836'); for (let y = fb - 30; y < fb - 18; y++) for (let x = fx + 1; x < fx + 9; x++) { if (y > fb - 21 && (x + y) % 3 === 0) continue; C(x, y, x === fx + 1 ? '#8a8a88' : y === fb - 30 ? '#a8a8a4' : '#626264'); } C(fx + 4, fb - 25, '#a8a8a4'); C(fx + 5, fb - 25, '#a8a8a4'); C(fx + 4, fb - 24, '#a8a8a4'); }
    return c;
  }
  // 원정대: 모닥불을 가운데 두고 성채를 바라봄 (스프라이트는 게임 그대로, 무기도 같은 도트)
  Object.assign(MAPS, {"knightBack": ["....krrk....", "...krrrrk...", "...kkkkkkk..", "..kwllllllk.", "..klllllmmk.", "..klllllmmk.", "..klmmmmmdk.", "..kkkkkkkk..", ".kRkRrrrRk..", "kRRkRrrrRk..", "kRRkRrRrRk..", "kRkkdkkdk...", ".k.kdk.kdk..", "...kkk.kkk.."], "priestBack": ["......kk..kk......", ".....kEEkkEEk.....", ".....kEEkkEEk.....", ".....kEEkkEEk.....", "......kEkkEk......", "......kWWWWk......", ".....kWwwwwWk.....", ".....kWwwwwWk.....", ".....kWwwwwWk.....", ".....kWWwwWWk.....", "......kkWWkkk.....", ".....kwwwwwwwk....", "....kwwwkkwwwk....", "....kwwkEEkwwk....", "....kWwkFEkwWk....", ".....kWwkkwWk.....", ".....kdk..kdk.....", ",....kkk..kkk....,"], "mageBack": ["........kk........", ".......kHHk.......", "..kkk.kHhHk..kkk..", "..kEEkkHhhHkkEEk..", "..kEEkHhhhhHkEEk..", "...kkkkkkkkkkkk...", ".....kEFFFFEk.....", ".....kEEEEEEk.....", ".....krrrrrrk.....", "....krrkEEkrrk....", "....krkEFEEkrk....", "....kRkEEFEkRk....", ".....kkWWWWkk.....", ",....kkkkkkkk....,"], "rangerBack": ["......k...k.......", ".....kEk.kEk......", ".....kEEkkEEk.....", ".....kHhhhhk......", "....kHhhhhhhk.....", "....kHhhhhhhk.....", "....kHhhhhhhk.....", "....kHhhhhhhkk....", ".....kkhhhhhk.....", "....khhhhhhhk.....", "...krkhhkEkk......", "....kkhHkEkk......", "....kkllkEkk......", ".....kmkkEEk......", ".....kdk.kFk......", ",....kkk.kkk.....,"], "gunnerBack": ["......k....k......", ".....kEk..kEk.....", ".....kEEkkEEk.....", ".....kkkkkkkk.....", "....kHHHHHHHHk....", "...kHHhhhhhhHHk...", "....kkkkkkkkkk....", ".....kEFFFFEk.....", ".....kEEEEEEkk....", "....kccccccccck...", "...kcccccccccck...", "...kccckEEkccck...", "....kckEFFEkck....", "....kckEEEEkk.....", ".....kdkWWkdk.....", ",....kkkkkkkk....,"]}); // v1.40 타이틀 영웅 뒷모습: 얼굴·앞장식 대신 투구 뒤·두건·머리털·망토, 귀 안쪽은 털색 · v1.41 꼬리는 엉덩이 가운데
  const TS_CROWN = ["............k4k............", ".....k.....k445k.....k.....", "....k1k....k556k....k7k....", "...k112k...k666k...k778k...", "...k223k....kak....k889k...", "...k333k...kaaAk...k999k...", "....kak...kaaaAAk...kak....", "...kaaAk.kkaaaAAkk.kaaAk...", "..kaaaAAkAkaaaAAkAkaaaAAk..", "..kaaaAAAAAaaaAAAAAaaaAAk..", "..kaaaAAAAAAaaAAAAAAaaAAk..", ".kaaaaaaaaaaaaaaaaaaaaaaak.", ".kAdAwAdAdAdAwAdAdAdAwAdAk.", ".kAAAAAAAAAAAAAAAAAAAAAAAk.", ".kdddddddddddddddddddddddk.", "..kkkkkkkkkkkkkkkkkkkkkkk..", "..........................."]; // v2.56 재의 왕관 도트 (타이틀 로고, 1~3 초록 · 4~6 파랑 · 7~9 빨강)
  const TS_GEMS = [[5, 3, '122,216,74', 0, '#7ad84a'], [13, 2, '74,140,255', 2, '#4a8cff'], [21, 3, '224,64,48', 4, '#e04030']];
  const TS_HEROES = [['knight', 484, -2.25], ['priest', 516, -2.0], ['mage', 598, -1.4], ['ranger', 628, 1.9], ['gunner', 660, -0.25]]; // x는 px
  function drawTitleScene() {
    if (!TS.cv) TS.cv = genTitleScene();
    ctx.drawImage(TS.cv, 0, 0);
    const C = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x * 2, y * 2, 2, 2); }, f = Math.floor(time * 8);
    // 창불: 칸마다 따로 깜빡
    for (const [i, [x, y]] of TS.win.entries()) { const on = (f + i * 5) % 23 !== 0; C(x, y, on ? ((f >> 1) + i) % 5 ? '#5e5e60' : '#7a7a7a' : '#2a2a2c'); C(x, y + 1, on ? '#3a3a3c' : '#1a1a1c'); } // v2.56 창도 색을 잃음
    // 모닥불 (칸 단위)
    const fx = 277, fy = TS.ledge(277);
    for (const [dx, c] of [[-3, '#4a3c48'], [-2, '#2e2632'], [2, '#2e2632'], [3, '#4a3c48']]) C(fx + dx, fy - 1, c);
    C(fx - 2, fy - 1, '#4a4846'); C(fx - 1, fy - 1, '#2e2c2a'); C(fx, fy - 1, '#4a4846'); C(fx + 1, fy - 1, '#2e2c2a');
    for (let i = -2; i <= 2; i++) { const h = 2 + ((f + i * 7 + 20) % 3) + (i === 0 ? 3 : Math.abs(i) === 1 ? 1 : 0); for (let k = 0; k < h; k++) C(fx + i, fy - 2 - k, k < 1 ? '#8a8a88' : k < h - 1 ? '#c4c4c0' : '#f0f0ea'); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let y = -14; y <= 4; y++) for (let x = -22; x <= 22; x++) { const d = Math.hypot(x / 22, y / 12); if (d < 1 && dith(fx + x, fy + y, (1 - d) * 0.45)) C(fx + x, fy - 3 + y, '#1e1e1e'); }
    ctx.restore();
    // 재: 위에서 천천히 내림 / 불티: 모닥불에서 오름 (칸 단위)
    if (TS.ash.length < 90 && Math.random() < 0.6) TS.ash.push({ x: rand(0, 384), y: -2, vx: rand(-3, 1), vy: rand(6, 14), ph: rand(0, 6) });
    if (Math.random() < 0.25) TS.emb.push({ x: fx + rand(-2, 2), y: fy - 4, vx: rand(-3, 3), vy: -rand(8, 16), t: rand(1.5, 3) });
    if (Math.random() < 0.03) TS.emb.push({ x: rand(40, 384), y: -2, vx: rand(-6, 1), vy: rand(6, 12), t: 30, c: pick(TS_GEMS)[4] }); // v2.56 재 사이로 가끔 떨어지는 빛 조각 (초록 · 파랑 · 빨강)
    for (const a of TS.ash) { a.x += (a.vx + Math.sin(time * 0.8 + a.ph) * 3) / 60; a.y += a.vy / 60; C(Math.round(a.x), Math.round(a.y), a.ph < 2 ? '#8a8088' : '#5a525c'); }
    for (const e of TS.emb) { e.x += (e.vx + Math.sin(time * 2 + e.t * 3) * 4) / 60; e.y += e.vy / 60; e.t -= 1 / 60; C(Math.round(e.x), Math.round(e.y), e.c || (e.t > 1 ? '#d8d8d2' : '#6a6a6a')); }
    TS.ash = TS.ash.filter(a => a.y < 216); TS.emb = TS.emb.filter(e => e.t > 0 && e.y < 216);
  }
  function render() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    if (!G) { drawTitleScene(); ctx.restore(); return; } // v1.12 타이틀 도트 그림
    let sx = 0, sy = 0;
    // v1.07: 화면 흔들림 전부 끔 (사용자 결정 — 액션할 때 화면이 흔들리거나 움직이지 않게). shake 값은 계산만 남음
    // v1.05: 타격 줌(화면 전체 비정수 배율)은 도트 격자를 깨서 끔 — 흔들림·히트스톱으로 손맛
    camSnap(); ctx.translate(-CAMX + snap2(sx), -CAMY + snap2(sy)); // v1.05: 카메라·흔들림도 2px 단위 (v1.06 플레이어 기준)
    wtextDefer = !!G; WTEXT.length = 0;
    ctx.drawImage(G && G.stage === 1 && !(G.dun && (G.dun.forge || G.dun.home)) ? floorM : floor, 0, 0);
    ctx.drawImage(decal, 0, 0);
    if (G && G.dun) drawRoomBack();
    if (!G || STG().torches) drawTorches();
    if (!G) {
      ctx.restore();
      ctx.fillStyle = 'rgba(4,3,10,.5)'; ctx.fillRect(0, 0, VW, VH);
      if (Math.random() < 0.5) titleEmbers.push({ x: rand(0, VW), y: VH + 4, vx: rand(-8, 8), vy: -rand(14, 34), t: rand(5, 10), c: pick(['#ff8a2a', '#c0303a', '#ffd060']) });
      for (const e of titleEmbers) { e.x += (e.vx + Math.sin(time + e.y * 0.03) * 8) / 60; e.y += e.vy / 60; e.t -= 1 / 60; ctx.fillStyle = e.c; ctx.globalAlpha = Math.min(1, e.t / 2); ctx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1); }
      ctx.globalAlpha = 1;
      for (let i = titleEmbers.length - 1; i >= 0; i--) if (titleEmbers[i].t <= 0 || titleEmbers[i].y < -4) titleEmbers.splice(i, 1);
      return;
    }
    if (G.bonfire && !(G.dun && G.dun.cur && G.dun.cur.type === 'rest')) drawBonfire(G.bonfire);
    drawMeteorMark(); drawMeteorAim();
    { const dz = DITHER_ON; DITHER_ON = false; for (const t of G.tele) if (!t.mark) drawTele(t); DITHER_ON = dz; } // v1.79 공격 예고는 잘 보이게 디더 제외
    // 보스 전조(경고)는 보스·캐릭터 그래픽 아래에 (v0.74)
    drawSqueeze(); drawRiteGround(); TRUTH.ground(); // v2.40 관중 제거 · 3단계 좁아지는 방책 (바깥 어둠만 — 말뚝은 sqzEnts에서 깊이 정렬)
    drawSoupFloor(); drawSmokeFloor(); drawPenance(); drawGearGround();
    { const dz = DITHER_ON; DITHER_ON = false; for (const t of G.tele) { if (t.mark) drawTele(t); drawTeleGlow(t); } DITHER_ON = dz; } // v0.79: 모든 몬스터의 예고는 캐릭터·몬스터 그래픽 아래에
    drawBuffBatch(); // v2.50 바닥 강화 고리 한 장으로
    const ents = G.enemies.filter(e => !e.dead).map(e => ({ y: e.y, d: () => drawEnemyShk(e) }));
    if (G.corpses) for (const c of G.corpses) ents.push({ y: c.e.y, d: () => drawCorpse(c) });
    ents.push({ y: G.player.y, d: drawPlayer });
    roomEnts(ents); gearEnts(ents); forgeEnts(ents); CA.ents(ents); END.ents(ents); sqzEnts(ents); TRUTH.ents(ents); // v2.57 크루가쉬 방책 말뚝도 깊이 정렬
    for (const f of G.fx) if (f.kind === 'rockspike') ents.push({ y: f.y, d: () => drawFx(f) }); // 솟는 바위는 깊이 정렬
    if (TOUCH.on && TOUCH.lock && !TOUCH.lock.dead && G.enemies.includes(TOUCH.lock) && mouse.active <= 0) { const L = TOUCH.lock; ents.push({ y: L.y - 0.5, d: () => drawAimMark(L) }); } // v2.25 모바일 조준 표시
    { const ES = ents.sort((a, b) => a.y - b.y); ES.forEach(o => o.d()); for (const l of G.loot) drawLoot(l); /* v2.80 보상은 늘 맨 위 층 (상자 · 소품 · 캐릭터에 가려지지 않게) */ BUFF_BATCH = false; G._occ = null; drawEvOutline(); drawGateArrows(); G._wt = ctx.getTransform();
      if (G.player.counterT > 0 || grayRoom(G.dun && G.dun.cur)) { const i = ES.findIndex(o => o.d === drawPlayer), py = G.player.y; G._occ = i < 0 ? [] : ES.slice(i + 1).filter(o => o.y < py + 140); } } // v2.28 반격 흑백: 캐릭터를 가리는 앞쪽 물체
    if (FRONT_ON && G.stage === 1 && !(G.dun && (G.dun.forge || G.dun.home))) ctx.drawImage(frontM, 0, 0); // 아래쪽 울타리·나무를 캐릭터 앞에
    enemySays(); TRUTH.top(); // v2.58
    flushBubbles(); // v1.10 말주머니는 모든 물체 위에
    drawGearTop();
    drawWproj(); // v2.05
    drawHarp(); // v2.19 작살은 캐릭터 위에
    if (G.dropHold > 0.08 && G.player) { const P = G.player, k = Math.min(1, G.dropHold / 0.7), x = snap2(P.x - 12), y = snap2(P.y - 40); // v2.19 F 홀드 버리기 게이지
      ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 2, y - 2, 28, 6); ctx.fillStyle = '#3a2f40'; ctx.fillRect(x, y, 24, 2); ctx.fillStyle = '#d02030'; ctx.fillRect(x, y, Math.round(24 * k / 2) * 2, 2);
      ctx.font = '8px Galmuri7'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#000'; fillTextW('무기 버리기', x + 13, y - 4); ctx.fillStyle = '#ff9a8a'; fillTextW('무기 버리기', x + 12, y - 5); }
    for (const d of G.drops) drawDrop(d);
    for (const f of G.fx) if (f.kind !== 'rockspike') drawFx(f);
    for (const pr of G.proj) drawProj(pr);
    for (const pr of G.mproj) drawMProj(pr);
    drawMeteorRock(); drawAimLine();
    for (const p of G.parts) { ctx.globalAlpha = Math.min(1, p.t * 3); ctx.fillStyle = p.c; ctx.fillRect(snap2(p.x), snap2(p.y), 2, 2); } // 2px 칸
    ctx.globalAlpha = 1;
    if (G.dun) ambBack(); // v1.55
    // v1.86 안개 제거 (7%로 옅어 거의 안 보이고, 도트 규칙의 예외였음)
    ctx.globalAlpha = 1;
    { const t0 = PERF.on ? performance.now() : 0; renderLighting(); if (PERF.on) PERF.li += performance.now() - t0; }
    drawEProjs(); // 적 투사체는 어둠 위에 그려 항상 또렷하게
    drawOrcWorld();
    if (G.dun) drawFireflies();
    if (G.dun) ambFront(); // v1.55
    drawTelePillar(); drawExitPillar(); CA.top(); END.top();
    drawTreasureBeam(G.dun && G.dun.cur);
    drawVortex();
    { const P = G.player, RC = G.dun && G.dun.cur, gk = grayRoom(RC) ? HUE_GRAY : 0, ck = P && P.counterT > 0 && !P.dead ? Math.min(1, ((P.counterMax || COUNTER_T) - P.counterT) / 0.15, P.counterT / 0.35) : 0;
      if (P && !P.dead && (ck > 0 || gk > 0)) { // v2.28 역습 + v2.34 잿빛 방 — v2.35: 화면을 복사하지 않고 「회색 막(나 모양만 뚫림)」을 채도 합성으로 한 번 덮음 (가벼움)
      const k = ck, WT = ctx.getTransform();
      if (!CNT_COL) { CNT_COL = document.createElement('canvas'); CNT_MK = document.createElement('canvas'); CNT_OC = document.createElement('canvas'); }
      if (CNT_COL.width !== cv.width || CNT_COL.height !== cv.height) { for (const c of [CNT_COL, CNT_MK, CNT_OC]) { c.width = cv.width; c.height = cv.height; } }
      const gl = CNT_COL.getContext('2d'), mk = CNT_MK.getContext('2d'), oc = CNT_OC.getContext('2d');
      const PB = 72, bx = Math.max(0, Math.floor(WT.a * P.x + WT.e - PB)), by = Math.max(0, Math.floor(WT.d * (P.y - 16) + WT.f - PB)), bw = Math.min(cv.width - bx, PB * 2), bh = Math.min(cv.height - by, PB * 2);
      const hole = (k > 0.5 || gk > 0) && bw > 0 && bh > 0;
      if (hole) { // 나 모양 − 앞을 가리는 물체 = 컬러로 남길 자리
        for (const g of [mk, oc]) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(bx, by, bw, bh); g.setTransform(WT); }
        const main = ctx, wt0 = WTEXT.length, np = G.parts.length;
        try { ctx = mk; drawPlayer(); ctx = oc; for (const o of G._occ || []) o.d(); if (FRONT_ON && G.stage === 1 && !(G.dun && (G.dun.forge || G.dun.home))) oc.drawImage(frontM, 0, 0); }
        finally { ctx = main; WTEXT.length = wt0; G.parts.length = Math.min(G.parts.length, np); }
        mk.setTransform(1, 0, 0, 1, 0, 0); mk.globalCompositeOperation = 'destination-out'; mk.drawImage(CNT_OC, bx, by, bw, bh, bx, by, bw, bh); mk.globalCompositeOperation = 'source-over';
      }
      gl.setTransform(1, 0, 0, 1, 0, 0); gl.globalCompositeOperation = 'source-over'; gl.globalAlpha = 1; gl.fillStyle = '#808080'; gl.fillRect(0, 0, cv.width, cv.height);
      if (hole) { gl.globalCompositeOperation = 'destination-out'; gl.drawImage(CNT_MK, bx, by, bw, bh, bx, by, bw, bh); gl.globalCompositeOperation = 'source-over'; }
      const W = G.paintW && G.paintW.R === RC ? G.paintW : null, wr = W ? Math.pow(W.t / 1.3, 0.8) * 1100 : 0;
      if (gk > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); if (W) { ctx.beginPath(); ctx.rect(0, 0, cv.width, cv.height); ctx.arc(WT.a * W.x + WT.e, WT.d * W.y + WT.f, wr * WT.a, 0, TAU); ctx.clip('evenodd'); } ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = gk; ctx.drawImage(CNT_COL, 0, 0); ctx.restore(); }
      if (k > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = k; if (k > 0.5) ctx.drawImage(CNT_COL, 0, 0); else { ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, cv.width, cv.height); } ctx.restore(); }
      if (W) { const H = HUES[RC.hue], f = 1 - W.t / 1.3; ctx.save(); ctx.globalAlpha = 0.55 * f; ctx.strokeStyle = H.c; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(W.x, W.y, wr, 0, TAU); ctx.stroke(); ctx.globalAlpha = 0.25 * f; ctx.lineWidth = 16; ctx.stroke(); ctx.restore(); }
      if (k > 0.5) { // 역습: 내 이펙트도 컬러로 다시
        { const np = G.parts.length; drawGearGround(); G.parts.length = Math.min(G.parts.length, np); }
        drawWproj(); drawHarp(); for (const f of G.fx) if (!f.en) drawFx(f); for (const pr of G.proj) drawProj(pr); for (const pr of G.mproj) drawMProj(pr); drawAimLine(); for (const q of G.parts) if (!q.en) { ctx.globalAlpha = Math.min(1, q.t * 3); ctx.fillStyle = q.c; ctx.fillRect(snap2(q.x), snap2(q.y), 2, 2); } ctx.globalAlpha = 1; }
      for (const l of G.loot) if (l.type === 'hue') drawLoot(l); // 색 조각은 늘 제 색으로
      TRUTH.slimeColor(); // v2.70 문 기둥 점액도 늘 제 색으로 (잿빛 방에서도 보이게)
    } }
    { const t0 = PERF.on ? performance.now() : 0; pixelPass(); if (PERF.on) PERF.pp += performance.now() - t0; } // v1.05 화면 도트화 (글자·프롬프트·숫자는 이 뒤)
    engDraw(); // v2.41
    drawPrompt();
    for (const n of G.nums) { if (n.v == null || /NaN|undefined|Infinity|null|object|function|=>|\$\{|\d[eE][+-]/.test(String(n.v))) continue; /* v2.38 잘못된 값은 그리지 않음 */ ctx.globalAlpha = Math.min(1, n.t * 3); if (n.txt || (typeof n.v === 'string' && /[^0-9+\-]/.test(n.v))) { /* v2.33 글자(흘려냄·반격! 등)는 숫자 글꼴로 안 그려져 보이지 않던 문제 → 글자로, 외곽선 */ const big = (n.s || 1) >= 2, x = Math.round(n.x), y = Math.round(n.y) - (n.pop > 0 ? 2 : 0); ctx.font = big ? '11px Galmuri11' : '9px Galmuri9'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) ctx.fillText(n.v, x + dx, y + dy); ctx.fillStyle = n.c; ctx.fillText(n.v, x, y); } else { const nv = typeof n.v === 'number' ? (isFinite(n.v) ? String(Math.round(n.v)) : '') : String(n.v).replace(/(\d)\.\d+/g, '$1'); /* v2.38 소수·무한대가 0000…으로 그려지던 문제 */ if (nv) drawNumber(nv, n.x, n.y - (n.pop > 0 ? 2 : 0), n.pop > 0 ? '#ffffff' : n.c, n.s + (n.pop > 0 ? 1 : 0)); } }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ---- 여기부터 화면 좌표
    drawVortexVignette(); drawRiteVignette();
    if (!(G.dun && G.dun.lab)) for (const a of G.ash) { ctx.fillStyle = `rgba(${STG().ash},${a.ff != null ? a.a * (0.35 + 0.65 * Math.max(0, Math.sin(time * 2.2 + a.ff))) : a.a})`; ctx.fillRect(snap2(a.x), snap2(a.y), 2, 2); } // 재도 2px 칸 (모든 챕터)
    drawOffscreen();
    let danger = 0;
    if (!G.player.dead) for (const t of G.tele) if (t.shape !== 'spawn' && t.owner !== null && inShape(t, G.player.x, G.player.y, G.player.r)) danger = Math.max(danger, t.t / t.dur);
    if (danger > 0.35) {
      const k = (danger - 0.35) / 0.65, vg = dRadial(ctx, VW / 2, VH / 2, 180, VW / 2, VH / 2, 470);
      vg.addColorStop(0, 'rgba(160,0,0,0)'); vg.addColorStop(1, `rgba(200,10,20,${(0.25 + 0.3 * k) * (0.7 + 0.3 * Math.sin(time * 30))})`);
      ctx.fillStyle = vg.p(ctx, 0, 0, VW, VH); ctx.fillRect(0, 0, VW, VH);
    }
    if (slowmo > 0) { ctx.fillStyle = 'rgba(30,50,90,.14)'; ctx.fillRect(0, 0, VW, VH); }
    if (G.press > 0.6 && !G.player.dead) {
      const k = Math.min(1, (G.press - 0.6) / 3), vg = dRadial(ctx, VW / 2, VH / 2, 200 - k * 50, VW / 2, VH / 2, 480);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(8,2,6,${0.15 + 0.35 * k})`);
      ctx.fillStyle = vg.p(ctx, 0, 0, VW, VH); ctx.fillRect(0, 0, VW, VH);
    }
    if (G.player.hp / G.stats.hp < 0.3 && !G.player.dead) {
      const vg = dRadial(ctx, VW / 2, VH / 2, 170, VW / 2, VH / 2, 460);
      vg.addColorStop(0, 'rgba(120,0,0,0)'); vg.addColorStop(1, `rgba(140,0,0,${0.35 + Math.sin(time * 5) * 0.1})`);
      ctx.fillStyle = vg.p(ctx, 0, 0, VW, VH); ctx.fillRect(0, 0, VW, VH);
    }
    hudFade(); // v2.38 캐릭터·적이 좌우 패널 뒤로 가면 패널을 흐리게
    if (mode !== 'map' && !(G && G.cine) && !(G && END.busy()) && !(G && G.dun && G.dun.home)) drawMinimap(); // v1.92 TAB 지도를 열면 미니맵은 숨김
    drawCombo();
    CA.screen(); END.screen(); HOME.screen(); ARCH.screen(); TRUTH.hud(); // v2.52 · v2.54 · v2.55
    if (flashT > 0) { ctx.globalAlpha = Math.min(0.6, flashT * 2.5); ctx.fillStyle = flashColor; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
    if (mode === 'map') drawMapOverlay();
    if (G && G.cine) drawCinematic();
    drawTransition();
    if (mode === 'wmap') drawWorldIntro();
  }
  // 맞는 순간 적 스프라이트를 맞은 방향으로 좌우 떨림
  // v2.50 전투를 끝낸 방: 캐릭터 둘레에 갈 수 있는 게이트 쪽을 가리키는 도트 화살표 (안 가 본 방은 금색 · 가 본 방은 회색 · 게이트에 다가가면 숨김)
  const GATE_ARW = (() => { const c = []; for (let y = -3; y <= 3; y++) for (let x = 0; x <= 3 - Math.abs(y); x++) c.push([x, y]); return c; })(); // 오른쪽(→)
  const GATE_ARW_D = (() => { const c = []; for (let y = -3; y <= 0; y++) for (let x = 0; x <= 3; x++) if (x - y >= 3) c.push([x - 1, y + 1]); return c; })(); // 오른쪽 위(↗), 직각 끝이 바깥
  function drawGateArrows() {
    const R = G.dun && G.dun.cur, P = G.player; if (!R || !R.cleared || G.sealed || G.trans || !P || P.dead || mode !== 'play' || END.busy() || CA.busy() || G.dun.home) return; // v2.54 연출 중엔 문 화살표 없음
    const age = time - (R.clearAt || -9); if (age < 0.4 && Math.floor(age * 20) % 2) return; // 막 열렸을 때는 깜빡이며 등장
    const step = Math.floor(time * 4) % 2 * 2, cx = P.x, cy = P.y - 10;
    for (const d in DIRS) {
      if (doorState(R, d) !== 'open') continue; const D = DOOR[d]; if (!D || Math.hypot(D.x - P.x, D.y - P.y) < 70) continue;
      const nr = G.dun.rooms[R.doors[d]], fill = nr && nr.visited ? ['#c8c4d0', '#f0eef4'] : ['#ffd34d', '#fff2b0'];
      const a = Math.atan2(D.y - cy, D.x - cx), idx = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8; // 8방향: 0 → · 2 ↓ · 4 ← · 6 ↑ · 홀수는 대각
      const diag = idx % 2 === 1, k = diag ? (((idx - 7) / 2) % 4 + 4) % 4 : idx / 2, shape = diag ? GATE_ARW_D : GATE_ARW;
      const rot = ([x, y]) => { for (let i = 0; i < k; i++) [x, y] = [-y, x]; return [x, y]; }; // 시계 방향 90°씩
      const qa = idx * Math.PI / 4, ox = snap2(cx + Math.cos(qa) * (32 + step)), oy = snap2(cy + Math.sin(qa) * (22 + step));
      const cells = shape.map(rot), on = new Set(cells.map(c => c.join(','))), minY = Math.min(...cells.map(c => c[1])), maxY = Math.max(...cells.map(c => c[1]));
      ctx.fillStyle = '#0b0a0e'; for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!on.has((x + dx) + ',' + (y + dy))) ctx.fillRect(ox + (x + dx) * 2, oy + (y + dy) * 2, 2, 2);
      for (const [x, y] of cells) { ctx.fillStyle = y < (minY + maxY) / 2 ? fill[1] : fill[0]; ctx.fillRect(ox + x * 2, oy + y * 2, 2, 2); } // 위쪽 절반은 밝게
    }
  }
  function drawEnemyShk(e) {
    if (!(e.shk > 0)) return drawEnemy(e);
    const ox = e.x, oy = e.y, j = (Math.floor(e.shk * 60) % 2 ? 1 : -1) * Math.min(3, 1 + e.shk * 14);
    e.x += Math.round(Math.cos(e.shkAng) * j); e.y += Math.round(Math.sin(e.shkAng) * j * 0.5);
    drawEnemy(e);
    e.x = ox; e.y = oy;
  }
  // 연속 타격 카운터 (화면 우측)
  function drawCombo() {
    const C = G.combo; if (!C || C.n < 3 || G.player.dead) return;
    const s = C.pop > 0 ? 4 : 3, str = String(C.n), x = VW - 18, y = Math.max(170, (MM.bot || 140) + 30); // v1.91 미니맵이 커져서 아래로
    const col = C.n >= 50 ? '#ff5a3c' : C.n >= 25 ? '#ffb030' : C.n >= 10 ? '#ffe39a' : '#ffffff';
    ctx.globalAlpha = Math.min(1, C.t * 2);
    const w = str.length * 4 * s - s;
    drawNumber(str, x - 34 - w / 2, y - (C.pop > 0 ? 2 : 0), C.pop > 0 ? '#ffffff' : col, s);
    drawNumber('HIT', x - 12, y + 5 * s - 10, col, 2);
    const bw = 60, k = Math.max(0, C.t / 2.6);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - bw, y + 5 * s + 4, bw, 3);
    ctx.fillStyle = col; ctx.fillRect(x - bw, y + 5 * s + 4, Math.round(bw * k), 3);
    ctx.globalAlpha = 1;
  }
  // 화면 밖 적: UI를 피한 안쪽 테두리에 방향 화살표
  function drawOffscreen() {
    const R0 = { x0: 142, y0: 76, x1: VW - 10, y1: VH - 88 }, cx = SAFE.cx, cy = SAFE.cy;
    for (const e of G.enemies) {
      if (e.dead) continue;
      const sx = e.x - cam.x, sy = e.y - 12 - cam.y;
      if (sx > 0 && sx < VW && sy > 0 && sy < VH) continue;
      const dx = sx - cx, dy = sy - cy, k = Math.min((dx > 0 ? R0.x1 - cx : cx - R0.x0) / Math.max(1e-3, Math.abs(dx)), (dy > 0 ? R0.y1 - cy : cy - R0.y0) / Math.max(1e-3, Math.abs(dy)));
      const ax = cx + dx * k, ay = cy + dy * k, a = Math.atan2(dy, dx);
      const big = e.type === 'boss' || isElite(e), winding = e.state === 'wind' || e.state === 'hold';
      const col = e.type === 'boss' ? '200,120,255' : winding ? '255,60,50' : big ? '255,90,70' : '200,70,70';
      const al = winding ? (Math.floor(time * 12) % 2 ? 1 : 0.4) : 0.75, s = big ? 7 : 5;
      drawBlade(triW(col, big ? 4 : 3), ax, ay, a, al); // v1.05 칸 단위 회전 도트
    }
  }
