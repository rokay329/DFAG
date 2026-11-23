'use strict';
// 잿빛 왕관 토벌대 — 14_rig.js : 일반 몹 부위 리그(머리·몸·팔다리 분리 애니메이션)
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ v1.54 일반 몹 부위 리그 — 엘리트·보스처럼 머리·몸통·팔·다리를 2px 칸 단위로 따로 움직인다
  // h=머리 끝 줄, l=다리 시작 줄, m=다리를 가르는 열, b=뒷팔 끝 열, f=앞팔 시작 열, robe=옷자락(다리 대신 흔들림)
  const NRB = {
    goblin: { h: 6, l: 11, m: 7, b: 3, f: 10 }, goblinUp: { h: 7, l: 11, m: 7, b: 3, f: 10 },
    ghoul: { h: 8, l: 12, m: 7, b: 3, f: 11 }, ghoulUp: { h: 10, l: 14, m: 8, b: 3, f: 13 },
    squire: { h: 8, l: 13, m: 7, b: 2, f: 10 }, squireUp: { h: 8, l: 13, m: 7, b: 2, f: 10 }, squireB: { h: 8, l: 13, m: 7, b: 2, f: 10 }, squireBUp: { h: 8, l: 13, m: 7, b: 2, f: 10 }, squireC: { h: 8, l: 13, m: 7, b: 2, f: 10 }, squireCUp: { h: 8, l: 13, m: 7, b: 2, f: 10 },
    chaplain: { h: 8, l: 12, m: 7, b: 1, f: 12, robe: 1 }, bloat: { h: 6, l: 14, m: 7 },
    huskA: { h: 8, l: 15, m: 8, b: 3, f: 12 }, huskUp: { h: 9, l: 15, m: 8, b: 2, f: 12 },
    cantor: { h: 7, l: 13, m: 6, robe: 1 }, cantorUp: { h: 7, l: 13, m: 6, robe: 1 },
    aguard: { h: 6, l: 13, m: 6, b: 2, f: 10 }, herald: { h: 9, l: 18, m: 7, b: 2, f: 11 },
  };
  // 네발: x≥hx·y<hr 머리, x≤tx·y<tr 꼬리, y≥lr 다리(열 구간 4개: 뒤 먼쪽·뒤 가까운쪽·앞 먼쪽·앞 가까운쪽)
  const NRQ = {
    hound: { hx: 10, hr: 10, tx: 4, tr: 10, lr: 13, legs: [[2, 5, 'lBF'], [6, 10, 'lBN'], [12, 15, 'lFF'], [16, 20, 'lFN']] },
    houndB: { hx: 10, hr: 10, tx: 4, tr: 10, lr: 13, legs: [[0, 4, 'lBF'], [5, 10, 'lBN'], [13, 17, 'lFF'], [18, 23, 'lFN']] },
    wolfA: { hx: 10, hr: 10, tx: 5, tr: 11, lr: 14, legs: [[2, 5, 'lBF'], [6, 10, 'lBN'], [13, 16, 'lFF'], [17, 21, 'lFN']] },
    wolfB: { hx: 10, hr: 10, tx: 5, tr: 11, lr: 14, legs: [[0, 4, 'lBF'], [5, 10, 'lBN'], [14, 18, 'lFF'], [19, 23, 'lFN']] },
  };
  function nrWho(map) {
    const b = NRB[map], q = NRQ[map];
    if (b) return (i, j) => j < b.h ? 'head' : j >= b.l ? (i < b.m ? 'legB' : 'legF') : b.b != null && i <= b.b ? 'armB' : b.f != null && i >= b.f ? 'armF' : 'torso';
    if (q) return (i, j) => { if (j >= q.lr) { for (const [a, c, n] of q.legs) if (i >= a && i <= c) return n; return 'body'; } return i >= q.hx && j < q.hr ? 'head' : i <= q.tx && j < q.tr ? 'tail' : 'body'; };
    return (i, j) => j <= 7 ? 'top' : 'bot'; // 덩어리(잿더미): 7행에서 위·아래
  }
  // 부위 지도: 원래 크기 그대로(모서리 ','로 고정) — 같은 자리에 그리면 원래 그림과 정확히 겹친다. ':k'=외곽선만, ':f'=속만
  function nrPart(map, part) {
    const key = map + '~' + part; if (key in MAPS) return MAPS[key] ? key : null;
    const R = MAPS[map], H = R.length, W = R[0].length, [pn, flt] = part.split(':'), who = nrWho(map); let any = false;
    const rows = R.map((r, j) => { let s = ''; for (let i = 0; i < W; i++) { const c = r[i], ok = c !== '.' && c !== ',' && who(i, j) === pn && (!flt || (flt === 'k') === (c === 'k')); if (ok) any = true; s += ok ? c : '.'; } return s; });
    for (const j of [0, H - 1]) rows[j] = (rows[j][0] === '.' ? ',' : rows[j][0]) + rows[j].slice(1, -1) + (rows[j][W - 1] === '.' ? ',' : rows[j][W - 1]);
    MAPS[key] = any ? rows : null; return any ? key : null;
  }
  // 지금 무슨 동작인지: 대기 · 걷기 · 준비 · 공격 · 복귀 · 피격 (+ 단계 f)
  const NR_WIND = new Set(['hold', 'wind', 'sing', 'blow', 'sqz', 'spit']);
  function nrMotion(e) {
    if (e._nrS !== e.state) { e._nrP = e._nrS; e._nrS = e.state; e._nrT = time; }
    if (e.flash > 0 && !(e._nrF > 0)) e._nrH = time; e._nrF = e.flash;
    const el = time - (e._nrT || 0), st = e.state, moved = e._nrW !== e.walk; e._nrW = e.walk;
    if (NR_WIND.has(st) || e.crouch > 0 || (e.type === 'slave' && e.up > 0)) { const k = st === 'hold' ? 1 - e.t / e.holdMax : e.glow > 0 ? e.glow : Math.min(1, el / 0.6); return { m: 'wind', f: k > 0.75 ? 4 + (Math.floor(time * 14) % 2) : Math.min(3, Math.floor(k * 4)) }; }
    if (st === 'dash' || e.dash || (st === 'thrust' && e.poke > 0)) return { m: 'hit', f: 1 };
    if (st === 'recover' && NR_WIND.has(e._nrP) || st === 'thrust') { if (el < 0.4) return { m: 'hit', f: el < 0.06 ? 0 : el < 0.12 ? 1 : el < 0.2 ? 2 : 3 }; if (el < 0.64) return { m: 'back', f: el < 0.52 ? 0 : 1 }; }
    if (e._nrH != null && time - e._nrH < 0.32) return { m: 'hurt', f: Math.min(3, Math.floor((time - e._nrH) / 0.08)) };
    if (st === 'chase' && moved) return { m: 'walk', f: Math.floor(e.walk * 0.9) % 4 };
    return { m: 'idle', f: Math.floor(time * 1.8 + e.x * 0.013) % 4 };
  }
  // v2.44 새 정면 도트(오크·엘리트) 공용: 걷기 4프레임 + 예비동작(움츠림·뒤로) → 타격(앞으로 늘어남) → 여운 · 맞으면 뒤로 젖힘
  function nmPose(e) {
    const M = nrMotion(e), f = e.face || 1, o = { dx: 0, rot: 0, sx: 1, sy: 1, wf: -1 };
    if (M.m === 'walk') o.wf = M.f;
    else if (M.m === 'wind') { const k = Math.min(1, M.f / 4); o.dx = -2 * f * k; o.sx = 1 + 0.08 * k; o.sy = 1 - 0.1 * k; o.rot = -0.16 * f * k; }
    else if (M.m === 'hit') { const k = 1 - Math.min(1, M.f / 4); o.dx = 4 * f * k; o.sx = 1 + 0.12 * k; o.sy = 1 - 0.08 * k; o.rot = 0.22 * f * k; }
    else if (M.m === 'back') { o.dx = f; o.rot = 0.06 * f; }
    else if (M.m === 'hurt') { const k = 1 - M.f / 4; o.dx = -2 * f * k; o.rot = -0.14 * f * k; }
    if (e.crouch > 0) { o.sy *= 0.88; o.sx *= 1.06; }
    o.rot += (e.lean || 0) + (e.grogiT > 0 ? 0.25 * f : 0); o.bob = o.wf % 2 ? 2 : 0;
    return o;
  }
  const NM_HAND = 10; // 새 도트의 손: 몸 중심에서 옆으로 10px · 발밑에서 위로 7px
  // v2.49 도트 오오라: 번지는 글로우 대신 실루엣 바깥에 한 칸 단색 외곽선 + (엘리트) 체크 무늬 두 번째 칸 + (보스) 성긴 세 번째 칸.
  //   밝기 변화는 반투명이 아니라 팔레트 순환(4단 스텝)과 디더 위상 전환으로 표현한다
  const AURA_BUF = {}, AURA_DITH = {};
  const auraShade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)))); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; };
  function auraDith(ph, sparse) { // 2px 칸 체크 무늬 (sparse: 4칸 중 1칸)
    const k = ph + (sparse ? 's' : ''); if (AURA_DITH[k]) return AURA_DITH[k];
    const [c, g] = mkCanvas(8, 8); g.fillStyle = '#fff';
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const on = sparse ? ((x + ph * 2) % 4 === 0 && (y + (x >> 1) * 2 + ph) % 2 === 0) || ((x + y * 2 + ph * 2) % 4 === 0 && y % 2 === 1) : (x + y + ph) % 2 === 0; if (on) g.fillRect(x * 2, y * 2, 2, 2); }
    return (AURA_DITH[k] = c);
  }
  const AURA_NOP = { beginPath() {}, ellipse() {}, fill() {}, fillRect() {}, set fillStyle(v) {} }; // 실루엣 단계에서는 그림자를 그리지 않음 (본 그림 때 한 번만)
  let AURA_MAIN = null; // 오오라용으로 따로 그리는 동안 그림자는 본 화면에 그린다
  function pxAura(e, col, lv, S, below, ax, ay, fn) {
    const id = 'S' + S, buf = n => AURA_BUF[id + n] || (AURA_BUF[id + n] = n ? mkCanvas(S, S) : (c => [c, c.getContext('2d', { willReadFrequently: true })])(Object.assign(document.createElement('canvas'), { width: S, height: S }))); // 0번은 실루엣을 읽어 오므로 CPU 쪽 캔버스
    const [c0, g0] = buf(0), [c1, g1] = buf(1), [c2, g2] = buf(2), [c3, g3] = buf(3);
    const ox = snap2(ax) - S / 2, oy = snap2(ay) - S + below;
    const reset = g => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.imageSmoothingEnabled = false; g.clearRect(0, 0, S, S); };
    reset(g0); g0.setTransform(1, 0, 0, 1, -ox, -oy);
    // v2.50 실루엣은 몸만: 빛 더하기(lighter)나 반투명으로 그리는 광채·예고 효과는 빼고 그린다 (패턴 중 테두리가 부풀던 문제)
    //   그 뒤 본 그림은 화면에 그대로 다시 그림 (파티클·이펙트가 두 번 생기지 않게 실루엣 단계에서는 빈 목록으로 바꿔 둠)
    const sil = new Proxy(g0, { get(t, k) { const v = t[k]; if (typeof v !== 'function') return v;
        if (k === 'fillRect' || k === 'fill' || k === 'stroke' || k === 'drawImage' || k === 'putImageData' || k === 'strokeRect') return (...a) => (t.globalCompositeOperation !== 'source-over' || t.globalAlpha < 0.6) ? undefined : v.apply(t, a);
        return v.bind(t); }, set(t, k, v) { t[k] = v; return true; } });
    const main = ctx, keep = [G.parts, G.fx, G.nums]; AURA_MAIN = AURA_NOP; ctx = sil; G.parts = []; G.fx = []; G.nums = [];
    try { fn(); } finally { ctx = main; AURA_MAIN = null; [G.parts, G.fx, G.nums] = keep; g0.setTransform(1, 0, 0, 1, 0, 0); }
    // 실루엣: 조금이라도 보이는 픽셀은 꽉 찬 칸으로 (반투명 번짐 제거)
    reset(g1); const im = g0.getImageData(0, 0, S, S), d = im.data;
    for (let i = 3; i < d.length; i += 4) { const on = d[i] >= 24; d[i - 3] = d[i - 2] = d[i - 1] = 255; d[i] = on ? 255 : 0; }
    g1.putImageData(im, 0, 0);
    const ring = (g, dd, inner, color, dith) => { // dd칸 바깥 테두리에서 inner칸 안쪽을 뺀 고리 (모서리는 계단식)
      reset(g); const sh = (r, op) => { g.globalCompositeOperation = op; for (let dy = -r; dy <= r; dy += 2) for (let dx = -r; dx <= r; dx += 2) if (Math.abs(dx) + Math.abs(dy) <= r + (r > 2 ? 2 : 0)) g.drawImage(c1, dx, dy); };
      sh(dd, 'source-over'); if (inner >= 0) sh(inner, 'destination-out');
      if (dith) { g.globalCompositeOperation = 'destination-in'; g.fillStyle = g.createPattern(dith, 'repeat'); g.fillRect(0, 0, S, S); }
      g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, S, S);
    };
    const st = Math.floor(time * 6 + e.x * 0.03) % 4, ph = Math.floor(time * 4) % 2; // 팔레트 순환 스텝 · 디더 위상
    const inC = auraShade(col, [0, 0.25, 0.5, 0.25][st]);
    if (lv > 2) { ring(g3, 6, 4, auraShade(col, -0.45), auraDith(ph, true)); ctx.drawImage(c3, ox, oy); }
    if (lv > 1) { ring(g3, 4, 2, auraShade(col, -0.25), auraDith(ph)); ctx.drawImage(c3, ox, oy); }
    ring(g2, 2, 0, inC, null); ctx.drawImage(c2, ox, oy);
    fn(); // 본 그림은 효과까지 화면에 직접
    // 떠오르는 빛 알갱이: 2px 칸 (번짐 조명 없음)
    if (Math.random() < (lv > 2 ? 0.3 : lv > 1 ? 0.25 : 0.12)) G.parts.push({ x: snap2(ax + rand(-12, 12)), y: snap2(ay - rand(4, (e.tall || 30) - 4)), vx: 0, vy: -rand(14, 30), t: rand(0.3, 0.6), c: inC, g: 0 });
  }
  const NM_AURA = { gbrute: ['#ffb040', 1], boar: ['#ff4a30', 1], exec: ['#d02828', 1], mother: ['#9ae050', 1], mordred: ['#ff9a40', 1], queen: ['#b890ff', 1], urg: ['#ffd34d', 1], troll: ['#8ad0ff', 1], // v2.93 엘리트도 준엘리트처럼 외곽선 한 줄
    boss: ['#c070ff', 2], coffin: ['#ff7a30', 1], herald: ['#ffd060', 1], ocharge: ['#ff6a2a', 1], odrum: ['#ff4030', 1], ogrip: ['#ff8a50', 1], otroll: ['#c0e070', 1] };
  const nmAuraOf = e => e.orc === 'krugash' ? (e.freed ? null : ['#ff5a2a', 2]) /* v2.84 저주가 풀린 크루가쉬는 붉은 기운 없음 */ : NM_AURA[e.type];
  function withAura(e, col, fn) { // 여러 부위로 그리는 보스(점액왕·잿빛 왕)
    if (e.flash > 0 || e.dead || (e.fadeA != null && e.fadeA < 0.5)) return fn();
    pxAura(e, col, 2, 360, 80, e.x, e.y, fn); // v2.50 보스도 두 칸까지만 (과하게 퍼지지 않게)
  }
  function drawNM(e, key, pal, x, y, o, white, al, ex) {
    const mk = walkMap(key, o.wf); pal = pal || key; e.tall = MAPS[key].length * 2 + 4; // 이름표·경고 표시 높이를 새 도트 키에 맞춤
    const A = !white && al >= 0.5 && nmAuraOf(e); // v2.50 도트 오오라 (스프라이트 그림마다 캐시)
    drawSprite(mk, pal, 2, x + o.dx, y, e.face < 0, Object.assign({ white, alpha: al, rot: o.rot, sx: o.sx, sy: o.sy, pa: A || null }, ex || {}));
    if (A && Math.random() < (A[1] > 2 ? 0.3 : A[1] > 1 ? 0.25 : 0.12)) G.parts.push({ x: snap2(x + rand(-12, 12)), y: snap2(y - rand(4, (e.tall || 30) - 4)), vx: 0, vy: -rand(14, 30), t: rand(0.3, 0.6), c: A[0], g: 0 });
  }
  // 사람형 자세(칸): 부위 → [dx, dy]
  function nrPoseB(M, robe) {
    const o = {}, f = M.f, U = (ns, d) => { for (const n of ns) o[n] = d; };
    if (M.m === 'idle') { const t = [0, 1, 1, 0][f]; U(['torso', 'armB', 'armF'], [0, t]); o.head = [0, [0, 0, 1, 1][f]]; }
    else if (M.m === 'walk') { const t = [0, 1, 0, 1][f]; o.torso = [0, t]; o.head = [0, 1 - t]; o.armF = [[-1, 0, 1, 0][f], t]; o.armB = [[1, 0, -1, 0][f], t];
      if (robe) { o.legB = [[0, 0, 1, 0][f], 0]; o.legF = [[-1, 0, 0, 0][f], 0]; } else { if (f === 0) o.legB = [0, -1]; if (f === 2) o.legF = [0, -1]; } }
    else if (M.m === 'wind') { const dx = [-1, -1, -1, -1, -2, -1][f], dy = [0, 1, 1, 1, 1, 1][f]; U(['torso', 'armB'], [dx, dy]); o.head = [[0, -1, -1, -1, -2, -1][f], [0, 0, 1, 1, 1, 1][f]]; o.armF = [dx, dy - (f >= 2 ? 1 : 0)]; }
    else if (M.m === 'hit') { const P = [[[2, 0], [1, 0], [3, 0]], [[2, 1], [2, 0], [3, 1]], [[2, 1], [2, 1], [3, 1]], [[1, 1], [2, 1], [2, 1]]][f]; o.torso = P[0]; o.armB = P[0]; o.head = P[1]; o.armF = P[2]; o.legF = [1, 0]; }
    else if (M.m === 'back') { o.torso = o.armF = o.armB = [[1, 0], [0, 0]][f]; o.head = [[1, 1], [1, 0]][f]; }
    else if (M.m === 'hurt') { o.torso = o.armB = [[-1, 0], [-1, 0], [0, 0], [0, 0]][f]; o.head = [[0, 0], [-2, 0], [-1, 0], [0, 0]][f]; o.armF = [[-1, 0], [-1, -1], [0, 0], [0, 0]][f]; }
    return o;
  }
  function nrPoseQ(M) {
    const o = {}, f = M.f, U = (ns, d) => { for (const n of ns) o[n] = d; };
    if (M.m === 'idle') { const t = [0, 1, 1, 0][f]; o.body = [0, t]; o.tail = [0, t - (f % 2)]; o.head = [0, [0, 0, 1, 1][f]]; }
    else if (M.m === 'walk') { const b = [0, 1, 0, 1][f]; o.body = [0, b]; o.head = [0, 1 - b]; o.tail = [[0, -1, 0, 1][f], b]; if (f === 0) { o.lBN = [1, -1]; o.lFF = [1, -1]; } if (f === 2) { o.lBF = [1, -1]; o.lFN = [1, -1]; } }
    else if (M.m === 'wind') { const dy = [0, 1, 1, 1, 1, 1][f], dx = [0, -1, -1, -1, -2, -1][f]; o.body = [dx, dy]; o.head = [dx, dy + (f >= 2 ? 1 : 0)]; o.tail = [dx, dy - 1]; }
    else if (M.m === 'hit') { const d = [2, 3, 3, 2][f]; U(['body', 'tail', 'lBN', 'lBF'], [d - 1, 0]); U(['lFN', 'lFF'], [d, 0]); o.head = [d + (f === 1 || f === 2 ? 1 : 0), f === 2 ? 1 : 0]; }
    else if (M.m === 'back') U(['body', 'tail', 'head', 'lFN', 'lFF'], [[1, 0], [0, 0]][f]);
    else if (M.m === 'hurt') { U(['body', 'tail'], [[-1, 0], [-1, 0], [0, 0], [0, 0]][f]); o.head = [[0, 0], [-2, -1], [-1, 0], [0, 0]][f]; }
    return o;
  }
  // 부위를 순서대로 그림. 몸통이 내려가거나 머리가 올라가 생기는 틈은 같은 부위를 한 칸씩 이어 찍어 메움
  const NRC = new Map(), NR_Z = [0, 0];
  function nrDraw(map, pal, x, by, flip, o, off, order) { // v1.56 자세 합성 캐시
    const key = map + '|' + pal + '|' + (flip ? 1 : 0) + '|' + (o.white ? 1 : 0) + '|' + order[0] + '|' + order.map(p => (off[p.split(':')[0]] || NR_Z).join(',')).join(';');
    let c = NRC.get(key);
    if (!c) { const R = MAPS[map], ax = ((R[0].length + 13) >> 1) << 1, ay = R.length * 2 + 12, [cv2, g] = mkCanvas(ax * 2, ay + 12), old = ctx;
      ctx = g; try { nrDrawRaw(map, pal, ax, ay, flip, { white: o.white }, off, order); } finally { ctx = old; }
      c = { cv: cv2, ax, ay }; if (NRC.size > 4000) NRC.clear(); NRC.set(key, c); }
    const a = o.alpha == null ? 1 : o.alpha; if (a !== 1) { ctx.save(); ctx.globalAlpha = a; }
    ctx.drawImage(c.cv, snap2(x) - c.ax, snap2(by) - c.ay); if (a !== 1) ctx.restore();
  }
  function nrDrawRaw(map, pal, x, by, flip, o, off, order) {
    const F = flip ? -1 : 1;
    for (const p of order) {
      const k = nrPart(map, p); if (!k) continue; const [dx, dy] = off[p.split(':')[0]] || [0, 0], X = x + dx * 2 * F;
      if (dy > 0 && (p === 'torso' || p === 'body')) for (let s = 0; s < dy; s++) drawSprite(k, pal, 2, X, by + s * 2, flip, o);
      if (dy < 0 && p === 'head') for (let s = 0; s > dy; s--) drawSprite(k, pal, 2, X, by + s * 2, flip, o);
      drawSprite(k, pal, 2, X, by + dy * 2, flip, o);
    }
  }
  const NR_ORD_B = ['legB', 'legF', 'armB', 'torso', 'head', 'armF'], NR_ORD_Q = ['lBF', 'lFF', 'tail', 'body', 'lBN', 'lFN', 'head'];
  function nrBiped(e, map, pal, x, by, flip, o, M) { const off = nrPoseB(M || nrMotion(e), NRB[map] && NRB[map].robe); nrDraw(map, pal, x, by, flip, o, off, NR_ORD_B); return off; }
  function nrQuad(e, map, pal, x, by, flip, o, M) { const off = nrPoseQ(M || nrMotion(e)); nrDraw(map, pal, x, by, flip, o, off, NR_ORD_Q); return off; }
  const nrHand = (off, e) => { const a = off.armF || off.torso || [0, 0]; return [a[0] * 2 * e.face, a[1] * 2]; }; // 앞팔이 옮겨 간 만큼 손(무기)도
  function drawEnemy(e) { drawBuffBack(e); drawEnemyBody(e); drawBuffFront(e); }
  function bdPose(e) { // 발도르 자세 (2px 단위): dy 몸 내려앉음 · ux 어깨·머리 앞뒤 · hx/hdy 머리 더 · mx 망토 자락 · lL/lR 든 발 · eye 눈빛
    if (e._bpT === time && e._bp) return e._bp; // 한 장면에 한 번만 계산 (걸음 판정이 두 번 불리면 어긋남)
    const st = e.state, f = e.face, ln = (e.lean || 0) * f, P = { dy: 0, ux: 0, hx: 0, hdy: 0, mx: 0, lL: 0, lR: 0, eye: (e.glow || 0) > 0 || st === 'cast' };
    const mv = e.walk !== e._bw; e._bw = e.walk;
    if (e.grogiT > 0) Object.assign(P, { dy: 2, ux: 2 * f, hdy: 2 }); // 고개를 떨구고 앞으로 무너짐
    else if (st === 'dash') { const k = Math.floor(time * 14) % 2; Object.assign(P, { ux: 2 * f, mx: -2 * f * (1 + k), lL: k ? 2 : 0, lR: k ? 0 : 2 }); } // 몸을 앞으로, 망토 자락은 뒤로 펄럭
    else if (st === 'cast') { const k = Math.floor(time * 8) % 2; Object.assign(P, { mx: k ? 2 : -2 }); } // 시전: 망토 자락이 들썩
    else if (ln < -0.08) Object.assign(P, { dy: 2, ux: -2 * f, mx: 2 * f }); // 준비: 몸을 낮추며 뒤로 젖힘
    else if (ln > 0.08) Object.assign(P, { ux: 2 * f, hx: 2 * f, hdy: 2, mx: -2 * f }); // 베기: 어깨·머리가 앞으로 쏠리고 자락은 뒤로
    else if (mv && (st === 'chase' || st === 'idle')) { const k = Math.floor(e.walk * 0.9) % 4; // 걷기: 디딤(내려앉음) → 발 듦(머리는 한 박자 늦게) · 망토 자락은 반대로 흔들림
      if (k === 0 || k === 2) P.dy = 2; else { P.hdy = 2; if (k === 1) { P.lL = 2; P.mx = 2; } else { P.lR = 2; P.mx = -2; } } }
    e._bpT = time; return (e._bp = P);
  }
  // v2.04 허수아비 도트: 나무 기둥 + 짚 몸통 + 자루 머리(과녁 그림) + 팔 막대
  // v3.20 맞으면 회전 대신 칸 단위로 기우뚱 (머리 · 어깨는 2칸, 몸은 1칸, 받침은 그대로) — 기운 그림은 처음 쓸 때 한 번 만듦
  function dummyLean(dir, lv) { const k = 'dummy' + (dir > 0 ? 'R' : 'L') + lv; if (!MAPS[k]) MAPS[k] = MAPS.dummy.map((r, y) => { const d = dir * (y < 12 ? lv : y < 24 ? lv - 1 : 0); return d > 0 ? '.'.repeat(d) + r.slice(0, r.length - d) : d < 0 ? r.slice(-d) + '.'.repeat(-d) : r; }); return k; }
  function drawDummy(e, white) {
    drawShadow(e.x, e.y + 1, 10);
    const L = e.lean || 0, lv = Math.abs(L) > 0.12 ? 2 : Math.abs(L) > 0.04 ? 1 : 0;
    drawSprite(lv ? dummyLean(Math.sign(L), lv) : 'dummy', 'dummy', 2, e.x, e.y + 2, false, { white });
  }
  function drawEnemyBody(e) {
    const flip = e.face < 0, white = e.flash > 0;
    const bob = Math.sin(e.walk) * 0.8, sq = 1 + Math.sin(e.walk * 2) * 0.03;
    const rise = e.rise > 0 ? e.rise / 0.35 : 0;
    const ya = rise * 10, al = (1 - rise * 0.8) * (e.fadeA == null ? 1 : e.fadeA);
    const lean = e.lean + (e.state === 'stun' ? 0.2 * e.face : 0);
    if (isDummy(e)) { drawDummy(e, white); return; }
    if (e.orc) drawOrc(e, ya, al, bob, lean);
    else if (e.type === 'slime' || e.type === 'bigslime' || e.type === 'toxslime') drawSlime(e, ya, al);
    else if (e.type === 'gbrute') drawBrute(e, ya, al);
    else if (e.type === 'boar') drawBoar(e, ya, al);
    else if (e.type === 'crow') drawCrow(e, ya, al);
    else if (e.type === 'cantor') drawCantor(e, ya, al);
    else if (e.type === 'aguard') drawAGuard(e, ya, al, bob);
    else if (e.type === 'coffin') drawCoffin(e, ya, al, bob);
    else if (e.type === 'herald') drawHerald(e, ya, al, bob);
    else if (e.type === 'mother') drawMother(e, ya, al);
    else if (e.type === 'mordred') drawMordred(e, ya, al);
    else if (e.type === 'queen') drawQueen(e, ya, al);
    else if (e.type === 'exec') drawExec(e, ya, al);
    else if (e.type === 'bearer') drawBearer(e, ya, al);
    else if (e.type === 'flag') drawFlagEnt(e, ya, al);
    else if (e.type === 'boss' && e.kind === 'ashking') withAura(e, '#ff8a3a', () => drawAshKing(e, ya, al));
    else if (e.type === 'boss' && e.kind === 'slimeking') withAura(e, '#7ae0ff', () => { drawSlimeKing(e, ya, al); TRUTH.belly(e); }); // v2.46 보스 오오라
    else if (INV_DRAW[e.type]) invDraw(e, ya, al, white); // v2.43 난입자 (공격 모션 포함)
    else if (e.type === 'goblin' || e.type === 'garcher') {
      drawShadow(e.x, e.y + 1, 8);
      const pal = e.type, M = nrMotion(e); // v1.54 부위별 칸 단위
      nrBiped(e, e.type === 'goblin' && M.m === 'wind' ? 'goblinUp' : 'goblin', pal, e.x, e.y + 2 + ya, flip, { white, alpha: al }, M);
      if (e.state === 'hold') holdGlow(e.x + e.face * 1, e.y - 26, 1 - e.t / e.holdMax, '255,200,60');
      if (e.type === 'garcher' && !white) drawBow(e, ya);
    }
    else if (e.type === 'ghoul' && !e.sq) { // 감염된 주민 (원래 디자인)
      drawShadow(e.x, e.y + 1, 9);
      { const M = nrMotion(e), w = M.m === 'wind'; // v1.54 부위별 칸 단위
        nrBiped(e, e.ash ? (w ? 'huskUp' : 'huskA') : (w ? 'ghoulUp' : 'ghoul'), e.ash ? 'ashHusk' : 'ghoul', e.x, e.y + 2 + ya, flip, { white, alpha: al }, M);
        if (e.state === 'hold') holdGlow(e.x + e.face * 1, e.y - 26, 1 - e.t / e.holdMax, '255,60,40'); }
      if (e.ash && al > 0.5) { const f = e.face, up = e.state === 'hold', PP = (x, y, vx, vy, t, c, glow, g) => G.parts.push({ x, y, vx, vy, t, c, g: g || 0, glow, floor: g ? e.y + 1 : undefined });
        if (Math.random() < (up ? 0.25 : 0.1)) { const sd = pick([-1, 1]); PP(e.x + sd * (up ? 9 : 11) * f, e.y - (up ? rand(20, 30) : rand(8, 14)), 0, rand(10, 20), rand(0.3, 0.5), pick(['#86807a', '#5e5a54']), false, 160); } // 녹아 떨어지는 재 방울 (팔 끝)
        if (Math.random() < 0.06) PP(e.x + f * rand(1, 5), e.y - 26, 0, rand(8, 16), 0.45, pick(['#ff7a30', '#ffc070']), true, 60); // 불 눈물
        if (Math.random() < 0.04) PP(e.x + rand(-4, 4), e.y - 34, rand(-3, 3), -rand(8, 16), 0.8, '#5e5a54', false); } // 머리 위 재 연기
    }
    else if (e.type === 'ghoul') { // v0.95 타락한 종자: 녹슨 장검을 든 견습 기사 (v0.96: 외형 3종 · 칼은 항상 몸 위에)
      drawShadow(e.x, e.y + 1, 9);
      const hold = e.state === 'hold', k = hold ? 1 - e.t / e.holdMax : 0, M = nrMotion(e), mp = ['squire', 'squireB', 'squireC'][e.sv || 0], by = e.y + 2 + ya; // v1.54 부위별 칸 단위
      const off = nrBiped(e, M.m === 'wind' ? mp + 'Up' : mp, 'squire', e.x, by, flip, { white, alpha: al }, M), [ox, oy] = nrHand(off, e);
      const hx = e.x + e.face * 6 + ox, hy = by - 12 + oy, bl = BLADES.squire;
      enemyTrail(e, e.trail, hx, hy, 6, bl.reach, '230,220,210');
      drawBlade(bl, hx, hy, e.bladeAng, al, white);
      if (hold) holdGlow(e.x + e.face * 1, e.y - 26, k, '255,60,40');
    }
    else if (e.type === 'dog' && e.ash === 'lancer') drawAshHeap(e, ya, al, bob);
    else if (e.type === 'dog') { drawShadow(e.x, e.y + 1, 11); const o = nmPose(e); if (e.state === 'dash') { o.wf = Math.floor(time * 22) % 4; o.sx = 1.1; o.sy = 0.92; o.rot = 0; } drawNM(e, 'nDog', null, e.x, e.y + 2 + ya, o, white, al); } // v2.44 새 도트 (옆모습 2등신)·꼬리·네 다리
    else if (e.type === 'cultist') {
      drawShadow(e.x, e.y + 1, 9);
      const casting = e.state === 'wind';
      if (casting) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255,40,50,${0.4 + 0.5 * e.glow})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, 14, 6, 0, 0, TAU); ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = time * 4 + i / 6 * TAU; ctx.fillStyle = 'rgba(255,90,90,.9)'; ctx.fillRect(Math.round(e.x + Math.cos(a) * 14) - 1, Math.round(e.y + Math.sin(a) * 6), 2, 1); }
        ctx.restore();
      }
      nrBiped(e, 'chaplain', 'chaplain', e.x, e.y + 2 + ya, flip, { white, alpha: al }); // v1.54
      if (casting) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const hx = e.x + e.face * 3, hy = e.y - 18, rr = 3 + 7 * e.glow;
        const gr = dRadial(ctx, hx, hy, 0, hx, hy, rr * 2);
        gr.addColorStop(0, 'rgba(255,230,230,.95)'); gr.addColorStop(0.4, 'rgba(255,40,60,.8)'); gr.addColorStop(1, 'rgba(255,40,60,0)');
        ctx.fillStyle = gr.p(ctx); ctx.fillRect(hx - rr * 2, hy - rr * 2, rr * 4, rr * 4);
        ctx.restore();
        if (Math.random() < 0.7) { const a = rand(0, TAU), r = rand(10, 18); G.parts.push({ x: e.x + Math.cos(a) * r, y: e.y - 18 + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, t: 0.2, c: '#ff4050', g: 0, glow: true }); }
      }
    }
    else if (e.type === 'bloat') {
      drawShadow(e.x, e.y + 1, 12);
      const winding = e.state === 'wind';
      const hot = winding && Math.floor(time * (6 + e.glow * 22)) % 2 === 0, pal = hot ? 'bloatHot' : 'bloat', o = { white, alpha: al }, by = e.y + 2 + ya; // v1.54
      if (winding) { const g = Math.min(2, Math.floor(e.glow * 3)), x = e.x + (e.glow > 0.7 ? (Math.floor(time * 16) % 2) * 2 : 0); // 배가 한 칸씩 부풂: 외곽선을 먼저 넓게, 속을 그 위에
        for (const p of ['legB', 'legF']) { const k = nrPart('bloat', p); if (k) drawSprite(k, pal, 2, x, by, flip, o); }
        for (const ly of ['torso:k', 'torso:f']) { const k = nrPart('bloat', ly); if (k) for (let dx = -g; dx <= g; dx++) for (let dy = -g; dy <= 0; dy++) drawSprite(k, pal, 2, x + dx * 2, by + dy * 2, flip, o); }
        const hk = nrPart('bloat', 'head'); for (let s = 0; s >= -g; s--) drawSprite(hk, pal, 2, x, by + s * 2, flip, o);
      } else nrBiped(e, 'bloat', pal, e.x, by, flip, o);
    }
    else if (e.type === 'butcher') drawButcher(e, ya, al);
    else if (e.type === 'ghost' || (e.type === 'boss' && e.kind !== 'slimeking')) {
      const sc = 2;
      const map = e.type === 'boss' ? 'baldor' : e.type === 'ghost' ? 'soldier' : 'ghoul';
      const pal = e.type === 'boss' ? 'boss' : e.type === 'ghost' ? 'ghost' : 'butcher';
      const handY = e.type === 'boss' ? 30 : e.type === 'butcher' ? 24 : 14;
      const hx0 = e.x + e.face * (e.type === 'boss' ? NM_HAND + (e.sw ? 0 : 4) : 3), hy = e.type === 'boss' ? e.y - (e.sw ? 8 : 14) + bdPose(e).dy : e.y - handY; /* v2.50 들고 다닐 때는 가슴 높이에서 쥠 */ const hx = hx0 + (e.type === 'boss' ? bdPose(e).ux : 0);
      const bl = e.type === 'boss' ? BOSS_SWORD : BLADES[e.blade]; // v2.46 발도르: 특대형 대검
      const behind = e.type === 'boss' ? !e.sw && Math.cos(e.bladeAng) * e.face < -0.25 /* v2.50 발도르: 세워 든 칼은 손에 쥔 채 몸 앞, 뒤로 넘긴 때만 등 뒤 */ : !e.sw && Math.sin(e.bladeAng) < -0.2 === false && Math.cos(e.bladeAng) * e.face < 0;
      drawShadow(e.x, e.y + 2, e.type === 'boss' ? 24 : e.type === 'butcher' ? 16 : 10);
      if (e.type === 'boss' && !e.dead && Math.random() < 0.5) G.parts.push({ x: e.x + rand(-16, 16), y: e.y - rand(0, 48), vx: 0, vy: -24, t: 0.6, c: e.stage === 3 ? '#8a3fb0' : '#3e2b4a', g: 0 });
      if (bl && behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
      if (bl) enemyTrail(e, e.trail, hx, hy, 10, bl.reach, e.type === 'ghost' ? '170,210,255' : e.type === 'boss' ? '190,120,240' : '230,220,210', e.type === 'boss');
      let rot = (e.grogiT > 0 ? 0.3 * e.face : e.state === 'dash' ? 0.25 * e.face : 0) + lean;
      if (e.type === 'ghost' && e.state === 'hold') { const k = 1 - e.t / e.holdMax; rot = -0.2 * e.face * (0.5 + k); }
      if (e.type === 'boss') { const p = bdPose(e), by = e.y + 3 + ya - (e.lift || 0), q = nmPose(e); q.dx += p.ux; q.rot += e.state === 'dash' ? 0.2 * e.face : 0; if (q.wf < 0 && e.state !== 'idle' && !(e.grogiT > 0)) q.wf = e.state === 'dash' ? Math.floor(time * 16) % 4 : [0, 2][Math.floor(time * 9) % 2]; drawNM(e, 'nBaldor', null, e.x, by + p.dy, q, white, al); } // 동작할 때 망토가 휘날림 // v2.46 새 정면 도트 (망토 포함)
      else drawSprite(map, pal, sc, e.x, e.y + 3 + (e.grogiT > 0 ? 0 : bob) + ya - (e.lift || 0), flip, { white, rot, alpha: al * (e.type === 'ghost' ? 0.85 : 1), sy: e.grogiT > 0 ? 0.92 : sq });
      if (bl && !behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
      if (bl && !behind && e.type !== 'boss' && (e.sw || !['idle', 'chase', 'recover', 'cast'].includes(e.state))) { // 칼자루를 쥔 건틀릿: 검을 등에 진 평소엔 숨기고 공격할 때만 (v0.66)
        const P0 = PAL[pal], fx = Math.round(hx) & ~1, fy = Math.round(hy) & ~1;
        ctx.globalAlpha = al * (e.type === 'ghost' ? 0.85 : 1); ctx.fillStyle = white ? '#fff' : P0.k; ctx.fillRect(fx - 4, fy - 4, 8, 8);
        ctx.fillStyle = white ? '#fff' : P0.l; ctx.fillRect(fx - 2, fy - 2, 4, 2); ctx.fillStyle = white ? '#fff' : P0.m; ctx.fillRect(fx - 2, fy, 4, 2); ctx.globalAlpha = 1;
      }
      if (e.type === 'ghost' && e.state === 'hold') {
        const k = 1 - e.t / e.holdMax;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const ox of [-5, 5]) { ctx.fillStyle = `rgba(200,230,255,${0.5 + 0.5 * k})`; ctx.fillRect(Math.round(e.x + ox - e.face * 3) - 2, Math.round(e.y - 40 - 4 * k) - 2, 4, 4); }
        ctx.restore();
        holdGlow(e.x - e.face * 3, e.y - 40, k, '150,200,255');
      }
      if (e.grogiT > 0) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(e.y - (e.type === 'boss' ? 62 : 50) + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); } }
    }
    if (e.type === 'boss' && e.kind !== 'slimeking' && e.kind !== 'krugash') drawBossAura(e);
    if (e.type === 'butcher' && !e.dead) {
      const lf = e.lift || 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (e.glow > 0) {
        const cx = e.x + e.face * 6, cy = e.y - 26 - lf, rr = 14 + 22 * e.glow;
        const gr = dRadial(ctx, cx, cy, 0, cx, cy, rr);
        gr.addColorStop(0, `rgba(255,80,50,${0.55 * e.glow})`); gr.addColorStop(1, 'rgba(255,40,30,0)');
        ctx.fillStyle = gr.p(ctx); ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
      }
      ctx.fillStyle = e.enraged ? 'rgba(255,60,40,.95)' : `rgba(220,240,110,${0.4 + 0.5 * e.glow})`;
      ctx.fillRect(Math.round(e.x + (e.face > 0 ? -1 : 1) * 3) - 3, Math.round(e.y - 34 - lf), 2, 2); ctx.fillRect(Math.round(e.x + (e.face > 0 ? -1 : 1) * 3) + 3, Math.round(e.y - 34 - lf), 2, 2);
      ctx.restore();
    }
    // 준엘리트·엘리트 이름표 (v0.69: 챕터 1~3 모두) — 엘리트는 주황, 준엘리트는 금색
    const nm = e.type !== 'boss' && !e.dead && (e.semiName || (isElite(e) ? eliteName(e) : null));
    if (nm) {
      const top = e.tall ? e.tall + 8 : (ELITE_TOP[e.kind === 'hob' ? 'hob' : e.type] || 60);
      ctx.font = '8px Galmuri7'; ctx.textAlign = 'center';
      const ty = Math.round(e.y - top - 5 - (e.z || 0) - (e.lift || 0)), el = isElite(e);
      ctx.fillStyle = '#000'; fillTextW(nm, Math.round(e.x) + 1, ty + 1); ctx.fillStyle = el ? '#ffa070' : '#f2d78c'; fillTextW(nm, Math.round(e.x), ty);
    }
    if (e.type !== 'boss' && e.hp < e.maxHp && !e.dead) {
      const w = isElite(e) ? 30 : isSemi(e) ? 22 : 16, top = e.tall ? e.tall + 8 : isElite(e) ? (ELITE_TOP[e.kind === 'hob' ? 'hob' : e.type] || 60) : 40;
      ctx.fillStyle = '#000'; ctx.fillRect(Math.round(e.x - w / 2) - 1, Math.round(e.y - top) - 1, w + 2, 4);
      ctx.fillStyle = '#b3262b'; ctx.fillRect(Math.round(e.x - w / 2), Math.round(e.y - top), Math.round(w * e.hp / e.maxHp), 2);
      if (e.grogiMax) { ctx.fillStyle = '#e8c35a'; ctx.fillRect(Math.round(e.x - w / 2), Math.round(e.y - top) + 2, Math.round(w * (e.grogiT > 0 ? 1 : e.grogi / e.grogiMax)), 1); }
    }
  }
  // v3.20 어세신 대시: 앞쪽 몸은 그대로 두고 몸 뒷부분만 이동 반대쪽으로 늘임 — 뒤쪽 가장자리 칸의 색을 칸 단위로 끌어 늘이고(가운데 길게 · 위아래 짧게 → 뾰족한 꼬리), 바깥에 검은 테두리. 가로·세로·대각선(8방향)
  const SMEAR_C = new Map();
  function smearCv(key, pal, flip, ux, uy, L) {
    const ck = key + pal + (flip ? 1 : 0) + ux + ',' + uy + ',' + L; if (SMEAR_C.has(ck)) return SMEAR_C.get(ck);
    const rows = MAPS[key], pc = PAL[pal]; let x0 = 99, x1 = 0; rows.forEach(r => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); } });
    const W = x1 - x0 + 1, H = rows.length, m = L + 2, GW = W + m * 2, GH = H + m * 2, G2 = new Array(GW * GH).fill(null), at = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH) ? null : G2[y * GW + x];
    const src = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return null; const ch = rows[y][flip ? x1 - x : x0 + x]; return ch && ch !== '.' && pc[ch] ? ch : null; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = src(x, y); if (ch) G2[(y + m) * GW + x + m] = pc[ch]; }
    const tx = -ux, ty = -uy, ql = Math.hypot(uy, ux) || 1, qx = -uy / ql, qy = ux / ql; let hw = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (src(x, y)) hw = Math.max(hw, Math.abs((x + 0.5 - W / 2) * qx + (y + 0.5 - H / 2) * qy));
    const ext = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const ch = src(x, y); if (!ch || src(x + tx, y + ty)) continue;
      const pr = ((x + 0.5 - W / 2) * qx + (y + 0.5 - H / 2) * qy) / (hw || 1), n = Math.round(L * (1 - pr * pr)); if (n <= 0) continue;
      const lt = -pr * (qx + qy >= 0 ? 1 : -1), c = pc[lt > 0.4 ? 'L' : lt < -0.4 ? 'D' : 'o'] || pc.o; // 네로의 털색 3단 (밝음 L · 중간 o · 어둠 D, 빛은 왼쪽 위)
      ext.push([x + m, y + m, c]); for (let k = 1; k <= n; k++) ext.push([x + m + tx * k, y + m + ty * k, c]); }
    for (const [x, y, c] of ext) G2[y * GW + x] = c;
    const OC = pc.k || '#0b0a0e', edge = [];
    for (const [x, y] of ext) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!at(x + dx, y + dy) && x + dx >= 0 && y + dy >= 0 && x + dx < GW && y + dy < GH) edge.push((y + dy) * GW + x + dx);
    for (const e of edge) G2[e] = OC;
    const [c, g] = mkCanvas(GW * 2, GH * 2); for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const v = G2[y * GW + x]; if (v) { g.fillStyle = v; g.fillRect(x * 2, y * 2, 2, 2); } }
    const r = { c, ox: W - 0 + m * 2, oy: H * 2 + m * 2, m }; r.ox = Math.floor(W * 2 / 2) + m * 2; SMEAR_C.set(ck, r); return r;
  }
  function dashSmear(P, key, alpha) {
    let pal = 'hRanger'; if (STEALTH_DRAW && PAL.hRangerGhost) pal = 'hRangerGhost'; else if (ASH_DRAW) pal = ashPalKey(pal);
    const k = clamp((P.t - 0.03) / (BLINK - 0.03), 0, 1), L = Math.round(14 - 7 * k), ux = Math.abs(P.dvx) > 0.38 ? Math.sign(P.dvx) : 0, uy = Math.abs(P.dvy) > 0.38 ? Math.sign(P.dvy) : 0;
    const r = smearCv(key, pal, P.face < 0, ux, uy, L); ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(r.c, snap2(P.x) - r.ox, snap2(P.y + 2) - r.oy); ctx.restore();
  }
  function drawRanger() {
    const P = G.player, storm = P.state === 'storm', tex = storm ? BLADES.daggerG : weaponTex('ranger');
    if (P.arsHide && !P.dead) return; // v3.22 박쥐 떼 · 사슬에 끌려가는 동안 몸을 감춤
    if (P.dead) {
      drawShadow(P.x, P.y + 1, 8);
      drawBlade(weaponTex('ranger'), P.x + 10, P.y - 2, 0.3, 0.9); drawBlade(weaponTex('ranger'), P.x - 8, P.y, 2.6, 0.9);
      drawSprite('hRanger', 'hRanger', 2, P.x, P.y + 4, P.face < 0, { rot: Math.PI / 2 * P.face, alpha: 0.85 });
      return;
    }
    if (P.state === 'shadow' && P.t < 0.08) return; // v3.20 회피는 숨지 않고 몸이 늘어나는 대시
    const blink = P.inv > 0 && Math.floor(time * 16) % 2 === 0;
    drawShadow(P.x, P.y + 1, 8);
    if (storm) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(120,255,180,${0.45 + Math.sin(time * 20) * 0.15})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(P.x, P.y - 2, 30, 12, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    const ifr = idleFrame(P), wFr = walkFr(P), bob = ifr ? (ifr.F.drop ? 2 : 0) : (wFr % 2 || wFr === -2) ? 2 : 0; // v2.43 걷기 4프레임 · v2.51 대기 동작
    let rot = 0, alpha = blink ? 0.45 : 1, sx = 1, sy = 1;
    const dashS = P.state === 'dodge' && P.t >= 0.03 && P.t < BLINK;
    if (P.state === 'dodge') { const [a, b] = DASH_POSE(P.t), hz = Math.abs(P.dvx) >= Math.abs(P.dvy); [sx, sy] = hz ? [a, b] : [b, a]; } // v3.20 어세신 대시: 웅크림 → 몸 뒷부분만 늘어남 → 되튐 → 자리잡기 (눌림 방향은 가로·세로 중 큰 쪽)
    if (PPOSE) ({ rot, sx, sy } = PPOSE); // v2.43 공격 모션
    if (P.state === 'shadow') { rot = 0.25 * P.face; sx = 1.1; sy = 0.92; }
    if (storm) { rot = Math.sin(time * 30) * 0.15; }
    const fhx = P.x + P.face * 7, fhy = P.y - 5 + bob, bhx = P.x - P.face * 7, bhy = P.y - 6 + bob; // v2.43 새 도트의 양손
    const swinging = P.state === 'attack' || P.state === 'shadow' || storm || (P.state === 'ars' && P.arsFront);
    const col = storm ? '120,255,180' : P.state === 'shadow' ? '190,140,255' : weaponTrailCol(weaponTex('ranger'), 0.4); // v2.19 평타 궤적은 무기 색
    if (swinging) {
      const sc = storm ? SLASH_COL.storm : P.state === 'shadow' ? SLASH_COL.shadow : AWK.on('ranger') ? '#ff3a3a' : rbySlash('ranger', SLASH_COL.ranger); // v3.23 개다래나무 가지: 눈과 같은 붉은 궤적 // v2.50 도트 궤적 · v3.19 RGB? 무지개
      drawSlashPx(P.trail, fhx, fhy, storm ? 34 : 42, sc, P.combo === 2);
      drawSlashPx(P.trail2, bhx, bhy, storm ? 34 : 42, sc, P.combo === 2);
    }
    // 역수 쥐기: 주먹은 휘두르는 방향으로 뻗고, 날은 주먹 아래에서 뒤로 끌리듯 눕는다
    const REV = P.face * 100 * DEG, ext = swinging ? 5 : 0;
    const v1 = P.blade + REV, v2 = P.blade2 + REV;
    const f1x = fhx + Math.cos(P.blade) * ext, f1y = fhy + Math.sin(P.blade) * ext * 0.7, b2x = bhx + Math.cos(P.blade2) * ext, b2y = bhy + Math.sin(P.blade2) * ext * 0.7;
    // v1.09 겹침 순서: 뒷날(+광채) → 몸 → 앞날(+광채). 뒷날 광채가 몸 위로 올라오던 문제 수정
    if (!P.arsHideW) { drawBlade(tex, b2x, b2y, v2, alpha * 0.95); if (!storm) weaponAura(tex, b2x, b2y, v2, 'ranger'); } // v3.22 쌍낫을 던진 동안 빈손
    if (dashS) dashSmear(P, heroMap(walkMap('hRanger', wFr), P), alpha);
    else drawSprite(ifr ? ifr.key : heroMap(walkMap('hRanger', wFr), P), 'hRanger', 2, P.x, P.y + 2, P.face < 0, { rot, alpha, white: P.hurtT > 0.12, sx, sy });
    if (!(ifr && ifr.a.st === 2) && !P.arsHideW) { drawBlade(tex, f1x, f1y, v1, alpha); if (!storm) weaponAura(tex, f1x, f1y, v1, 'ranger'); } // v2.51 그루밍 중엔 앞손 단검을 내려놓음
    if (ifr) idleZz(ifr, snap2(P.x), snap2(P.y + 2), P.face < 0);
    if (storm) for (let i = 0; i < 4; i++) { const a = P.spin * 1.3 + i * Math.PI / 2; drawBlade(BLADES.daggerG, P.x + Math.cos(a) * 16, P.y - 10 + Math.sin(a) * 7, a, 0.75, false, 1, 'lighter'); }
    ctx.fillStyle = 'rgba(232,228,216,.45)';
    ctx.fillRect(Math.round(P.x + Math.cos(P.ang) * 26) - 1, Math.round(P.y - 8 + Math.sin(P.ang) * 26) - 1, 2, 2);
  }
  // v1.08 플레이어 그리기 래퍼: 몸 위치를 먼저 2px에 맞춰 손·무기 위치가 몸과 같이 움직이게, 무기 각도는 회전 한 칸(1/96바퀴)의 0.8배 넘게 바뀔 때만 다음 그림으로 (이동 사격 시 무기 떨림 방지)
  function drawPlayer() {
    if (TRUTH.hidePlayer()) return; // v2.58 점액왕 몸속에 들어간 동안
    const P = G.player, ox = P.x, oy = P.y, ob = P.blade, ob2 = P.blade2, th = TAU / ROT_N * 0.8;
    if (P.bladeShow == null || Math.abs(angDiff(P.blade, P.bladeShow)) > th) P.bladeShow = P.blade;
    if (P.blade2 != null && (P.blade2Show == null || Math.abs(angDiff(P.blade2, P.blade2Show)) > th)) P.blade2Show = P.blade2;
    PPOSE = playerPose(); if (PPOSE) { P.x += PPOSE.dx; P.y += PPOSE.dy; } // v2.43 공격 모션: 몸과 손이 같이 움직임
    if (P.state === 'dodge' && P.rolling) { const rp = rollPose(P); P.rollGY = snap2(P.y); P.y -= rp.lift; ROLL_HIDEW = rp.air; } // v3.19 구르기: 공중에 뜬 높이 · 그림자는 땅에
    P.x = snap2(P.x); P.y = snap2(P.y); P.blade = P.bladeShow; if (P.blade2 != null) P.blade2 = P.blade2Show;
    ASH_DRAW = SAVE.skin === 'ash' && skinOpen(); STEALTH_DRAW = G.player.stealthT > 0; // v1.99 잿불 외형 · v2.05 숨기
    try { drawPlayerInner(); } finally { PPOSE = null; ASH_DRAW = false; STEALTH_DRAW = false; ROLL_HIDEW = false; P.rollGY = null; P.x = ox; P.y = oy; P.blade = ob; P.blade2 = ob2; }
  }
  function drawPlayerInner() {
    if (G.cls === 'ranger') return drawRanger();
    if (G.cls === 'mage' || G.cls === 'priest' || G.cls === 'gunner') return drawHero();
    const P = G.player;
    if (P.krsHideW) ROLL_HIDEW = true; // v3.21 바게트 · 대검을 던져 손이 비어 있음
    const lift = P.lift || 0;
    const ifr = idleFrame(P), wFr = walkFr(P), bob = ifr ? (ifr.F.drop ? 2 : 0) : (wFr % 2 || wFr === -2) ? 2 : 0; // v2.43 걷기 4프레임 · v2.51 대기 동작
    const hx = P.x + P.face * 7, hy = P.y - 9 - lift + bob; // v2.43 새 도트: 옆구리의 손
    const holy = P.awakenT > 0 || P.state === 'awaken';
    const brk = !holy && G.breadBrk > 0 && wSkill() === 'bread', tex = brk ? breadHalf(0) : weaponTex('knight'); // v2.19 각성해도 들고 있는 무기 모양 그대로 (금빛은 덧칠로)
    const chainLash = !holy && wSkill() === 'chain' && ((P.state === 'attack' && P.combo === 2) || (P.state === 'krs' && P.krsChain));
    if (P.dead) {
      drawShadow(P.x, P.y + 1, 8);
      drawBlade(weaponTex('knight'), P.x + 14, P.y - 2, 0.15, 0.9);
      drawSprite('hKnight', 'hKnight', 2, P.x, P.y + 4, P.face < 0, { rot: Math.PI / 2 * P.face, alpha: 0.85 });
      return;
    }
    if (P.state === 'dodge' && P.t < BLINK && !P.rolling) return; // 점멸 중에는 보이지 않는다 (구르기는 보임)
    const blink = P.inv > 0 && Math.floor(time * 16) % 2 === 0;
    drawShadow(P.x, (P.rollGY != null ? P.rollGY : P.y) + 1, 8 - Math.min(3, lift * 0.3));
    if (holy) { ctx.fillStyle = `rgba(255,211,77,${0.22 + Math.sin(time * 11) * 0.07})`; ctx.beginPath(); ctx.ellipse(P.x, P.y, 20, 8, 0, 0, TAU); ctx.fill(); }
    let rot = 0, alpha = blink ? 0.45 : 1, sx = 1, sy = 1;
    if (P.state === 'dodge') { if (P.rolling) rot = rollPose(P).rot; else { alpha = 0.5 + 0.5 * clamp((P.t - BLINK) / 0.09, 0, 1); sx = 0.9; sy = 1.1; } }
    if (P.state === 'charge') { rot = 0.3 * P.face; sx = 1.1; }
    if (PPOSE) ({ rot, sx, sy } = PPOSE); // v2.43 공격 모션
    if (P.state === 'skill') { rot = (P.t < SKILL.wind ? -0.25 : 0.2) * P.face; sx = 1.06; sy = P.t < SKILL.wind ? 0.9 : 1.04; }
    if (P.state === 'awaken') { sy = P.t < 0.15 ? 0.88 : 1; rot = P.t > 0.9 && P.t < 1.1 ? 0.3 * P.sign : 0; }
    const swinging = P.state === 'attack' || P.state === 'skill' || P.state === 'awaken' || (P.state === 'krs' && P.krsFront);
    const behind = !swinging && P.state !== 'charge';
    const trailCol = P.state === 'skill' ? '170,220,255' : holy ? '255,214,120' : weaponTrailCol(tex, P.combo === 2 ? 0.3 : 0.5); // v2.19 평타 궤적은 무기 색
    const giantK = P.state === 'awaken' ? (P.giant || 0) : 0;
    const rout = giantK > 0 ? tex.reach * (1 + 1.7 * giantK) : P.state === 'skill' ? SKILL.reach : tex.reach + 2;
    if (swinging) {
      drawSlashPx(P.trail, hx, hy + 4, rout, P.state === 'skill' ? SLASH_COL.ice : holy ? SLASH_COL.holy : rbySlash('knight', SLASH_COL.knight), P.state !== 'attack' || P.combo === 2); // v2.50 도트 궤적 · v3.19 RGB? 무지개
    }
    if (brk) drawBlade(breadHalf(1), P.x - P.face * 8, hy + 4, P.blade + Math.PI * 0.85 * P.face, alpha); // 반대 손의 반 토막
    if (behind && !ifr) { drawBlade(tex, hx - P.face * 2, hy + 2, P.blade, alpha); if (!holy && !brk) weaponAura(tex, hx - P.face * 2, hy + 2, P.blade, 'knight'); }
    const rmk = rollMap(P, 'hKnight'), [rox, roy] = rmk ? rollOff(rmk, rot) : [0, 0];
    drawSprite(rmk || (ifr ? ifr.key : heroMap(walkMap('hKnight', wFr), P)), 'hKnight', 2, P.x + rox, P.y + 2 - lift + roy, P.face < 0, { rot, alpha, white: P.hurtT > 0.12, sx, sy });
    if (ifr) { idleKnightBlade(ifr, tex, snap2(P.x), snap2(P.y + 2 - lift), P.face < 0, alpha); idleZz(ifr, snap2(P.x), snap2(P.y + 2 - lift), P.face < 0); } // v2.51 대기 동작
    if (giantK > 0) {
      { const sc = 1 + 1.7 * giantK; // v2.19 빛의 거대검도 들고 있는 무기 모양 · 배율마다 회전 그림을 새로 만들면 끊기므로 배율 1 그림을 늘려 그린다
        const drawBig = (al, comp) => { if (!tex.cells) { drawBlade(tex, hx, hy + 4, P.giantAng, al, false, sc, comp); return; } const r = rotW(tex, P.giantAng); ctx.save(); ctx.globalAlpha = al; if (comp) ctx.globalCompositeOperation = comp; ctx.imageSmoothingEnabled = false; ctx.translate(snap2(hx), snap2(hy + 4)); ctx.scale(sc, sc); ctx.drawImage(r.c, -r.o + 1, -r.o + 1); ctx.restore(); };
        drawBig(0.8 * giantK); drawBig(0.55 * giantK, 'lighter'); }
    } else if (chainLash) { drawChainBlade(hx, hy + 4);
    } else if (!behind) {
      if ((P.state === 'attack' || P.state === 'skill') && P.trail.length > 3) {
        drawBlade(tex, hx, hy + 4, P.trail[P.trail.length - 3].a, 0.25);
        drawBlade(tex, hx, hy + 4, P.trail[P.trail.length - 2].a, 0.45);
      }
      drawBlade(tex, hx, hy + 4, P.blade, alpha);
      if (!holy && !brk) weaponAura(tex, hx, hy + 4, P.blade, 'knight');
    }
    if (holy && giantK === 0) drawBlade(tex, behind ? hx - P.face * 2 : hx, behind ? hy + 2 : hy + 4, P.blade, 0.35 + Math.sin(time * 9) * 0.1, false, 1, 'lighter');
    ctx.fillStyle = 'rgba(232,228,216,.45)';
    ctx.fillRect(Math.round(P.x + Math.cos(P.ang) * 26) - 1, Math.round(P.y - 8 + Math.sin(P.ang) * 26) - 1, 2, 2);
  }
  function drawProj(pr) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const fade = Math.min(1, pr.t / 0.12);
    const pts = pr.hist.concat([{ x: pr.x, y: pr.y }]);
    pts.forEach((q, i) => {
      const k = (i + 1) / pts.length;
      ctx.strokeStyle = `rgba(120,190,255,${0.55 * k * fade})`; ctx.lineWidth = Math.max(1, 6 * k);
      ctx.beginPath(); ctx.arc(q.x - Math.cos(pr.ang) * 14, q.y - Math.sin(pr.ang) * 14, pr.r, pr.ang - 1.15, pr.ang + 1.15); ctx.stroke();
    });
    ctx.strokeStyle = `rgba(255,255,255,${0.95 * fade})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pr.x - Math.cos(pr.ang) * 14, pr.y - Math.sin(pr.ang) * 14, pr.r, pr.ang - 1.0, pr.ang + 1.0); ctx.stroke();
    ctx.restore();
  }
  function drawFx(f) {
    if (f.kind && f.kind.charCodeAt(0) === 103 && f.kind.slice(0, 3) === 'gx_') { ctx.save(); drawGearFx(f); ctx.restore(); return; }
    const p = 1 - f.t / f.max;
    ctx.save();
    if (f.kind === 'ring' && f.px) { // v2.50 도트 고리 (난입자): 한 가지 색 — 두꺼운 고리 → 가는 고리 → 끊긴 조각
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = f.c;
      const R = Math.max(2, f.grow ? f.r : f.r + p * 26), ph = p < 0.35 ? 0 : p < 0.7 ? 1 : 2, n = Math.max(16, Math.round(R * 3.2)), seen = new Set();
      for (let i = 0; i < n; i++) { if (ph === 2 && (i >> 1) % 3) continue; const a = i / n * TAU;
        for (let d = 0; d <= (ph === 0 ? 2 : 0); d += 2) { const x = snap2(f.x + Math.cos(a) * (R - d)), y = snap2(f.y + Math.sin(a) * (R - d) * (f.ry || 1)), k = x * 8192 + y; if (seen.has(k)) continue; seen.add(k); if (typeof SKD !== 'undefined') SKD.pd(x, y, SKD.oid(f), f.c); else ctx.fillRect(x, y, 2, 2); } } // v3.22 겹침 디더
    } else if (f.kind === 'ring') {
      ctx.strokeStyle = f.c; ctx.globalAlpha = 1 - p; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(1, f.grow ? f.r : f.r + p * 26), 0, TAU); ctx.stroke();
    } else if (f.kind === 'impact') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = f.mark ? `rgba(200,120,255,${0.7 * (1 - p)})` : `rgba(255,140,90,${0.7 * (1 - p)})`;
      telePath(f); ctx.fill();
      const k = 1 + p * 0.2;
      ctx.strokeStyle = `rgba(255,240,220,${0.9 * (1 - p)})`; ctx.lineWidth = 2;
      ctx.beginPath();
      if (f.shape === 'circle') ctx.arc(f.x, f.y, f.r * k, 0, TAU);
      else if (f.shape === 'cone') ctx.arc(f.x, f.y, f.r * k, f.ang - f.arc / 2, f.ang + f.arc / 2);
      ctx.stroke();
    } else if (f.kind === 'arcwave') {
      const r = f.r0 + (f.r1 - f.r0) * easeOut(p), w = 12 * (1 - p) + 2;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${f.c},${0.85 * (1 - p)})`; ctx.lineWidth = w;
      ctx.beginPath(); ctx.arc(f.x, f.y, r, f.ang - f.arc / 2, f.ang + f.arc / 2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - p)})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(f.x, f.y, r, f.ang - f.arc * 0.45, f.ang + f.arc * 0.45); ctx.stroke();
    } else if (f.kind === 'skybeam') {
      ctx.globalCompositeOperation = 'lighter';
      const w = f.w * (f.up ? 0.6 + 0.4 * Math.sin(p * Math.PI) : 1 - p * 0.85), a = f.up ? Math.sin(p * Math.PI) : 1 - p;
      const gr = dLinear(ctx, 0, -20, 0, f.y);
      gr.addColorStop(0, `rgba(${f.c},0)`); gr.addColorStop(1, `rgba(${f.c},${0.85 * a})`);
      ctx.fillStyle = gr.p(ctx, f.x - w / 2, -20, w, f.y + 20); ctx.fillRect(Math.round(f.x - w / 2), -20, Math.round(w), f.y + 20);
      ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`; ctx.fillRect(Math.round(f.x - w / 8), -20, Math.max(1, Math.round(w / 4)), f.y + 20);
      if (!f.up) { ctx.fillStyle = `rgba(${f.c},${0.7 * a})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, w * 1.1, w * 0.4, 0, 0, TAU); ctx.fill(); }
    } else if (f.kind === 'alert') {
      const o = f.o;
      if (o && !o.dead) {
        const bounce = -Math.max(0, 1 - p * 4) * 6;
        drawNumber('!', o.x, o.y - f.h + bounce, Math.floor(time * 14) % 2 ? '#ff3b2c' : '#ffe0d0', f.s);
      }
    } else if (f.kind === 'spark') {
      ctx.strokeStyle = f.c; ctx.globalAlpha = 1 - p; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - Math.cos(f.ang) * f.len * (1 - p), f.y - Math.sin(f.ang) * f.len * (1 - p)); ctx.stroke();
    } else if (f.kind === 'puff') {
      // 달릴 때 발밑 흙먼지 뭉게 (2px 도트 고리가 퍼지며 사라짐)
      const r = 2 + p * 7, n = 7;
      ctx.globalAlpha = 0.85 * (1 - p); ctx.fillStyle = f.c;
      for (let i = 0; i < n; i++) { const a = i / n * TAU + f.x; ctx.fillRect(Math.round(f.x + Math.cos(a) * r) & ~1, Math.round(f.y - p * 6 + Math.sin(a) * r * 0.5) & ~1, 2, 2); }
      if (p < 0.4) ctx.fillRect(Math.round(f.x) & ~1, Math.round(f.y - p * 6) & ~1, 2, 2);
    } else if (f.kind === 'hitspark') {
      // 타격 순간의 별 모양 섬광 + 베인 자국
      ctx.globalCompositeOperation = 'lighter';
      const R = f.r * (0.55 + easeOut(Math.min(1, p * 1.6)) * 0.75), a = 1 - p, n = f.crit ? 8 : 6;
      ctx.fillStyle = `rgba(${f.c},${0.85 * a})`;
      for (let i = 0; i < n; i++) {
        const an = f.ang + f.rot + i * TAU / n, main = i === 0 || i === n / 2, L = R * (main ? 1.3 : i % 2 ? 0.5 : 0.85), w = (main ? 3 : 1.6) * (1 - p) + 0.6;
        const cx = Math.cos(an), cy = Math.sin(an);
        ctx.beginPath(); ctx.moveTo(f.x + cx * L, f.y + cy * L); ctx.lineTo(f.x - cy * w, f.y + cx * w); ctx.lineTo(f.x - cx * w, f.y - cy * w); ctx.lineTo(f.x + cy * w, f.y - cx * w); ctx.closePath(); ctx.fill();
      }
      if (p < 0.5) {
        const k = 1 - p * 2, pa = f.ang + Math.PI / 2 + f.rot, L = f.r * 1.4;
        ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 2.5 * k + 0.5;
        ctx.beginPath(); ctx.moveTo(f.x - Math.cos(pa) * L, f.y - Math.sin(pa) * L); ctx.lineTo(f.x + Math.cos(pa) * L, f.y + Math.sin(pa) * L); ctx.stroke();
      }
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(0.5, f.r * 0.18 * (1 - p)), 0, TAU); ctx.fill();
    } else if (f.kind === 'hitflash') {
      ctx.fillStyle = `rgba(255,250,235,${0.9 * (1 - p)})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.6 + p * 0.6), 0, TAU); ctx.fill();
      ctx.fillRect(Math.round(f.x - f.r * 1.6), Math.round(f.y), Math.round(f.r * 3.2), 1);
      ctx.fillRect(Math.round(f.x), Math.round(f.y - f.r * 1.2), 1, Math.round(f.r * 2.4));
    } else if (f.kind === 'claw' && f.brute) { // 오크·트롤: 거칠게 찢긴 세 줄 손톱자국 (v0.71) — 2px 칸, 들쭉날쭉한 굵기·흔들림, 검붉은 테두리, 끝에 튀는 파편, 칸 단위로 사라짐
      const hs = n => { const v = Math.sin(n * 127.1 + f.seed * 311.7) * 43758.5453; return v - Math.floor(v); };
      const r = f.r || 30, gap = Math.max(10, r * 0.3), arc = f.arc || 1.6, sweep = Math.min(1, p * 4), W0 = (f.w || 3) >= 4 ? 2.2 : 1.5;
      for (let i = -1; i <= 1; i++) {
        const st = hs(i + 3) * 0.18, en = 1 - hs(i + 7) * 0.22, rr0 = r + i * gap + (hs(i + 11) - 0.5) * 6, steps = Math.ceil(arc * rr0 / 2);
        for (let k = 0; k <= steps; k++) {
          const u = k / steps; if (u < st || u > en || u > sweep) continue;
          const uu = (u - st) / (en - st), a = f.ang - arc / 2 + arc * u, rr = rr0 + Math.sin(u * 9 + i * 2 + f.seed) * 2.5 + (hs(k * 0.37 + i * 13) - 0.5) * 3;
          const wd = Math.max(0, Math.round(W0 * Math.sin(Math.PI * uu) ** 0.7 * (0.55 + 0.8 * hs(k + i * 31)) - 0.4));
          const cx = f.x + Math.cos(a) * rr, cy = f.y + Math.sin(a) * rr * 0.85, nx = Math.cos(a), ny = Math.sin(a);
          if (hs(k * 1.7 + i) < p * 1.4 - 0.25) continue; // 칸 단위로 부서지며 사라짐
          for (let j = -wd - 1; j <= wd + 1; j++) {
            const x = (Math.round(cx + nx * j * 2) & ~1), y = (Math.round(cy + ny * j * 2) & ~1), edge = Math.abs(j) > wd;
            ctx.fillStyle = edge ? `rgba(30,6,4,${0.85 * (1 - p)})` : Math.abs(j) === wd ? `rgba(160,30,20,${1 - p * 0.6})` : `rgba(${f.c || '255,215,170'},${1 - p * 0.5})`;
            ctx.fillRect(x, y, 2, 2);
          }
        }
        if (p < 0.5 && sweep >= en) for (let q = 0; q < 3; q++) { const a = f.ang - arc / 2 + arc * en + hs(q + i * 5) * 0.3, rr = rr0 + (hs(q * 3 + i) - 0.5) * 10 + q * 3; ctx.fillStyle = q % 2 ? `rgba(160,30,20,${1 - p * 2})` : `rgba(${f.c || '255,215,170'},${1 - p * 2})`; ctx.fillRect(Math.round(f.x + Math.cos(a) * (rr + 6 * p * 4)) & ~1, Math.round(f.y + Math.sin(a) * (rr + 6 * p * 4) * 0.85) & ~1, 2, 2); }
      }
    } else if (f.kind === 'claw') {
      const r = f.r || 18, gap = Math.max(3, r * 0.16), sweep = Math.min(1, p * 2.5);
      if (f.glow) ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${f.c || '230,220,200'},${1 - p})`; ctx.lineWidth = (f.w || 1) + 1;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(f.x, f.y, r + i * gap, f.ang - 0.7, f.ang - 0.7 + 1.4 * sweep); ctx.stroke(); }
    } else if (f.kind === 'hollow') { // v1.52 빈 갑옷
      const el = f.max - f.t, fl = f.face < 0, F = fl ? -1 : 1, al = Math.min(1, f.t / 0.4), [mh, mb] = splitMap(f.mp, 8), by = f.y + 2, sk = el > 0.15 ? 2 : 0;
      drawSprite(mb, 'squire', 2, f.x, by + sk, fl, { alpha: al });
      ctx.save(); ctx.globalAlpha = al; const top = by + sk - 32;
      for (let i = 3; i < 11; i++) { const X = fl ? f.x + 16 - (i + 1) * 2 : f.x - 16 + i * 2; ctx.fillStyle = i >= 5 && i <= 8 ? '#000000' : '#0e0c10'; ctx.fillRect(X, top + 16, 2, i >= 5 && i <= 8 ? 4 : 2); }
      const HP = [[0, 0], [1, 1], [2, 3], [3, 5], [4, 7], [5, 6]], h = HP[Math.min(HP.length - 1, Math.floor(el / 0.12))];
      drawSprite(mh, 'squire', 2, f.x + h[0] * 4 * F, by + h[1] * 2, fl, { alpha: al });
      for (let n = 0; n < 4; n++) { const t = Math.floor((el - 0.3 - n * 0.3) / 0.12); if (t < 0 || t > 8) continue;
        const sx = f.x + (n % 2 ? -2 : 2) * Math.floor(t / 3) * 2 + (n % 2) * 4 - 2, sy = top + 14 - t * 2, z = t < 5 ? 4 : 2;
        ctx.fillStyle = '#2a2030'; ctx.fillRect(sx & ~1, sy & ~1, z, z); if (z > 2) { ctx.fillStyle = '#4a4058'; ctx.fillRect((sx & ~1) + 2, sy & ~1, 2, 2); } }
      ctx.restore();
    } else if (f.kind === 'ghost') {
      if (f.glowy) ctx.globalCompositeOperation = 'lighter';
      drawSprite(f.map || CL().map, f.pal || (f.tint ? CL().ghostPal : CL().pal), f.sc || 2, f.x, f.y + 2, f.face < 0, { rot: f.rot, alpha: (f.tint || f.map ? 0.55 : 0.3) * (1 - p), white: !f.tint && !f.map });
    } else if (f.kind === 'pillar') {
      const a = f.t / f.max, h = f.h * (0.4 + 0.6 * Math.min(1, p * 3));
      const gr = dLinear(ctx, 0, f.y - h, 0, f.y);
      gr.addColorStop(0, 'rgba(255,220,120,0)'); gr.addColorStop(1, `rgba(255,220,120,${0.85 * a})`);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr.p(ctx, f.x - 3, f.y - h, 6, h); ctx.fillRect(Math.round(f.x - 3), Math.round(f.y - h), 6, Math.round(h));
      ctx.fillStyle = `rgba(255,255,230,${a})`; ctx.fillRect(Math.round(f.x), Math.round(f.y - h), 1, Math.round(h));
    } else if (f.kind === 'xslash') {
      ctx.globalCompositeOperation = 'lighter';
      const L = 26 * Math.min(1, p * 3);
      for (const d of [-0.78, 0.78]) {
        const a = f.ang + Math.PI / 2 + d, ux = Math.cos(a), uy = Math.sin(a);
        ctx.strokeStyle = `rgba(190,140,255,${0.8 * (1 - p)})`; ctx.lineWidth = 5 * (1 - p) + 1;
        ctx.beginPath(); ctx.moveTo(f.x - ux * L, f.y - uy * L); ctx.lineTo(f.x + ux * L, f.y + uy * L); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${1 - p})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(f.x - ux * L, f.y - uy * L); ctx.lineTo(f.x + ux * L, f.y + uy * L); ctx.stroke();
      }
    } else if (f.kind === 'drumwave') {
      drawDrumWave(f, p);
    } else if (f.kind === 'rockspike') {
      drawRockSpike(f, p);
    } else if (f.kind === 'spikes') { // 투기장 가시 함정: 솟았다가 다시 들어간다 (2px 칸 도트)
      const up = (p < 0.12 ? p / 0.12 : p > 0.7 ? (1 - p) / 0.3 : 1) * (f.big ? 1.7 : 1), bx = Math.round(f.x) & ~1, by = Math.round(f.y) & ~1;
      if (f.big && p < 0.25) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,90,40,${0.5 * (1 - p * 4)})`; ctx.fillRect(bx - 14, by - 30, 28, 30); ctx.restore(); }
      dshEll(ctx, bx, by, 12, 4, 0.5);
      for (const [ox, h0] of [[-8, 8], [-3, 12], [2, 14], [7, 10], [11, 6]]) { const h = Math.round(h0 * up / 2) * 2; if (h <= 0) continue;
        ctx.fillStyle = '#140c08'; ctx.fillRect(bx + ox - 2, by - h - 2, 6, h + 2);
        ctx.fillStyle = '#b8b0a0'; ctx.fillRect(bx + ox, by - h, 2, h); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(bx + ox, by - h, 2, 2); ctx.fillStyle = '#7a3020'; ctx.fillRect(bx + ox, by - 4, 2, 2); }
    } else if (f.kind === 'lob') {
      drawLob(f, p);
    } else if (f.kind === 'boom') {
      ctx.globalCompositeOperation = 'lighter';
      const r = f.r * (0.5 + 0.5 * easeOut(Math.min(1, p * 2.5))), gr = dRadial(ctx, f.x, f.y, 0, f.x, f.y, r);
      gr.addColorStop(0, `rgba(255,240,200,${0.9 * (1 - p)})`); gr.addColorStop(0.45, `rgba(255,140,50,${0.7 * (1 - p)})`); gr.addColorStop(1, 'rgba(160,30,10,0)');
      ctx.fillStyle = gr.p(ctx); ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.87, 0, 0, TAU); ctx.fill();
    } else if (f.kind === 'tracer') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${f.c},${0.8 * (1 - p)})`; ctx.lineWidth = f.w * (1 - p * 0.6) + 1;
      ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(f.x1, f.y1); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${1 - p})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(f.x0 + (f.x1 - f.x0) * p * 0.6, f.y0 + (f.y1 - f.y0) * p * 0.6); ctx.lineTo(f.x1, f.y1); ctx.stroke();
    } else if (f.kind === 'muzzle') { // v2.50 총구 섬광 (도트·한 가지 색): 앞이 열린 초승달(양 끝 뾰족) + 앞으로 부채꼴 빛줄기 → 마지막엔 조각나 흩어짐
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = f.col || '#ffe14a';
      const ph = p < 0.3 ? 0 : p < 0.65 ? 1 : 2, S = f.s, ca = Math.cos(f.ang), sa = Math.sin(f.ang), seen = new Set();
      const put = (u, v) => { const x = snap2(f.x + u * ca - v * sa), y = snap2(f.y + u * sa + v * ca), k = x * 8192 + y; if (seen.has(k)) return; seen.add(k); if (ph === 2 && ((x >> 1) * 7 + (y >> 1) * 13) % 3) return; ctx.fillRect(x, y, 2, 2); };
      const R = (8 + 5 * S) * [0.7, 1, 1.2][ph], th = 3 + 1.6 * S;
      for (let i = 0; i <= 24; i++) { const t = i / 24, a2 = Math.PI * (0.62 + 0.76 * t), w = th * Math.sin(Math.PI * t); // 뒤쪽 반원 (앞이 열림)
        for (let d = 0; d <= w; d += 1.5) put(R * 0.55 + Math.cos(a2) * (R - d), Math.sin(a2) * (R - d)); }
      const L = (14 + 12 * S) * [0.55, 1, 1.25][ph];
      for (const [da, k] of [[0, 1], [-0.28, 0.75], [0.28, 0.75], [-0.55, 0.5], [0.55, 0.5]]) for (let r = 2; r <= L * k; r += 1.6) put(Math.cos(da) * r, Math.sin(da) * r);
    } else if (f.kind === 'castfx') { // v2.50 지팡이 끝 시전 섬광 (도트·한 가지 색): 뾰족한 별 → 작아짐 → 조각
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = f.col || '#e8c8ff';
      const ph = p < 0.35 ? 0 : p < 0.7 ? 1 : 2, r = f.r * [1, 0.6, 1.3][ph], seen = new Set();
      const put = (x, y) => { x = snap2(x); y = snap2(y); const k = x * 8192 + y; if (seen.has(k)) return; seen.add(k); if (ph === 2 && ((x >> 1) * 5 + (y >> 1) * 11) % 3) return; ctx.fillRect(x, y, 2, 2); };
      for (const [dx, dy, k] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [0.7, 0.7, 0.5], [-0.7, 0.7, 0.5], [0.7, -0.7, 0.5], [-0.7, -0.7, 0.5]]) for (let t = 0; t <= r * k; t += 1.6) put(f.x + dx * t, f.y + dy * t);
      if (ph < 2) for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) put(f.x + dx, f.y + dy); // 가운데는 조금 두껍게 (끝은 뾰족)
    } else if (f.kind === 'streak' && f.px) { // v2.50 도트 빛줄기 (난입자 순간이동): 한 가지 색, 양 끝 뾰족, 뒤에서부터 짧아짐
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = f.px;
      const L = Math.hypot(f.x1 - f.x0, f.y1 - f.y0), t0 = Math.min(0.85, p * 1.2), n = Math.max(2, Math.ceil(L / 2)), nx = -(f.y1 - f.y0) / (L || 1), ny = (f.x1 - f.x0) / (L || 1), seen = new Set();
      for (let i = 0; i <= n; i++) { const t = i / n; if (t < t0) continue; const u = (t - t0) / (1 - t0), w = 3 * Math.sin(Math.PI * u) * (1 - p * 0.5);
        for (let k = -w; k <= w; k += 1.5) { const x = snap2(f.x0 + (f.x1 - f.x0) * t + nx * k), y = snap2(f.y0 + (f.y1 - f.y0) * t + ny * k), q = x * 8192 + y; if (seen.has(q)) continue; seen.add(q); ctx.fillRect(x, y, 2, 2); } }
    } else if (f.kind === 'streak') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${f.c || '120,190,255'},${0.6 * (1 - p)})`; ctx.lineWidth = 6 * (1 - p) + 1;
      ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(f.x1, f.y1); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - p)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(f.x1, f.y1); ctx.stroke();
    }
    ctx.restore();
  }
  function drawBonfire(b) {
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(b.x - 9, b.y - 2, 18, 3); ctx.fillRect(b.x - 7, b.y - 4, 14, 2);
    ctx.fillStyle = '#6b6560'; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; ctx.fillRect(Math.round(b.x + Math.cos(a) * 11) - 1, Math.round(b.y + Math.sin(a) * 4), 3, 2); }
    for (let i = 0; i < 7; i++) {
      const h = 7 + ((Math.sin(time * 13 + i * 1.7) + 1) * 5);
      ctx.fillStyle = i % 3 === 0 ? '#ffe28a' : i % 2 ? '#ff8a2a' : '#e2501c';
      ctx.fillRect(Math.round(b.x - 7 + i * 2), Math.round(b.y - 4 - h), 2, Math.round(h));
    }
    if (Math.random() < 0.35) G.parts.push({ x: b.x + rand(-5, 5), y: b.y - 12, vx: rand(-6, 6), vy: -34, t: 0.9, c: '#ffb050', g: 0, glow: true });
  }
  function drawDrop(d) { // v0.98: 상자에서 튀어나와 착지 → 필드 장비와 같은 도트 빛기둥
    const p = clamp(d.t / 0.5, 0, 1), sx = d.sx == null ? d.x : d.sx, sy = d.sy == null ? d.y : d.sy;
    const x = sx + (d.x - sx) * p, y = sy + (d.y - sy) * p;
    drawLoot({ type: 'gear', it: d.it, x, y, z: Math.sin(p * Math.PI) * 34, vz: p < 1 ? 1 : 0, bob: d.x, life: 999, t: Math.max(0, d.t - 0.5) });
  }
  // v3.20 칠흑의 장막 (이전 잿빛 회오리): 범위 바깥을 효과 없이 완전 검은색으로 — 2px 줄마다 원 안 구간만 비우고 양옆을 채움 (원 가장자리도 2px 칸)
  // 바깥의 적 · 발도르도 어둠에 가려지고, 플레이어만 어둠 위에 다시 그림
  function drawVortex() {
    const v = G.vortex; if (!v) return;
    const P = G.player, outside = Math.hypot(P.x - v.cx, P.y - v.cy) > v.r;
    const x0 = (Math.floor(cam.x) & ~1) - 40, x1 = x0 + VW + 80, y0 = (Math.floor(cam.y) & ~1) - 40, y1 = y0 + VH + 80, cx = Math.round(v.cx) & ~1, cy = Math.round(v.cy) & ~1, r2 = v.r * v.r;
    ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000';
    for (let y = y0; y < y1; y += 2) { const dy = y + 1 - cy;
      if (dy * dy >= r2) { ctx.fillRect(x0, y, x1 - x0, 2); continue; }
      const hw = (Math.round(Math.sqrt(r2 - dy * dy) / 2) * 2), l = cx - hw, r = cx + hw;
      if (l > x0) ctx.fillRect(x0, y, l - x0, 2); if (r < x1) ctx.fillRect(r, y, x1 - r, 2); }
    ctx.restore();
    if (outside && !P.dead) drawPlayer();
  }
  // 칠흑의 장막: 남은 시간 · 바깥에 있을 때 경고 문구만 (화면 좌표 · 붉은 테두리 효과 없음)
  function drawVortexVignette() {
    const v = G && G.vortex; if (!v) return;
    const P = G.player, out = Math.hypot(P.x - v.cx, P.y - v.cy) > v.r;
    const shr = v.t < v.shrink, hold = !shr && v.t < v.shrink + v.hold;
    if (shr || hold) { const left = shr ? v.shrink - v.t + v.hold : v.shrink + v.hold - v.t, txt = (shr ? '칠흑의 장막이 조여 온다 ' : '칠흑의 장막 ') + left.toFixed(1) + 's'; ctx.font = '9px Galmuri9'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(txt, VW / 2 + 1, 151); ctx.fillStyle = '#ff9aa8'; ctx.fillText(txt, VW / 2, 150); }
    if (out) { ctx.font = 'bold 12px Galmuri11'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText('장막 안으로!', VW / 2 + 1, 167); ctx.fillStyle = Math.floor(time * 6) % 2 ? '#ffffff' : '#ff6070'; ctx.fillText('장막 안으로!', VW / 2, 166); }
  }
  function drawTorches() {
    TORCHES.forEach((tc, i) => {
      ctx.fillStyle = '#2b2018'; ctx.fillRect(tc.x - 3, tc.y + 2, 6, 3); ctx.fillRect(tc.x - 1, tc.y + 5, 2, 6);
      const st4 = G && G.stage === 4 && !(G.dun && G.dun.forge), q = Math.floor(time * 8 + i * 2) % 3, f = st4 ? [0, -2, 0][q] : Math.sin(time * 11 + i * 1.3); // v1.55 챕터4: 불꽃 3단계
      ctx.fillStyle = '#e2501c'; ctx.fillRect(tc.x - 3, tc.y - 4 + Math.round(f), 6, 6);
      ctx.fillStyle = '#ff9a2e'; ctx.fillRect(tc.x - 2, tc.y - 6 + Math.round(f), 4, 6);
      ctx.fillStyle = '#ffe28a'; ctx.fillRect(tc.x - 1, tc.y - 3, 2, 3);
      if (st4) { ctx.fillStyle = '#ff9a2e'; ctx.fillRect(tc.x - 1 + (q === 2 ? 2 : q === 0 ? -2 : 0), tc.y - 8 + f, 2, 2); }
      if (Math.random() < 0.15 && !(G && G.stage === 3)) G && G.parts.push({ x: tc.x + rand(-2, 2), y: tc.y - 6, vx: rand(-4, 4), vy: -20, t: 0.6, c: '#ffb050', g: 0, glow: true });
    });
  }

  // v1.17 빛 도장: 반지름(정수)·세기(0.01 단위)·색마다 그라데이션을 한 번만 그려 두고 붙인다 (매 프레임 그라데이션 수백 개 생성 → 0)
  const LSTAMP = new Map();
  function lightStamp(r, a, c, ca) {
    const R = Math.max(1, Math.round(r)), key = c ? R + '|' + c + '|' + Math.round(ca * 100) : R + '|' + Math.round(a * 100);
    let st = LSTAMP.get(key); if (st) return st;
    const [cv2, g] = mkCanvas(R * 2, R * 2);
    if (c) { const A = Math.round(ca * 100) / 100, gr = g.createRadialGradient(R, R, 0, R, R, R * 0.8); gr.addColorStop(0, `rgba(${c},${A})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; }
    else { const A = Math.round(a * 100) / 100, gr = g.createRadialGradient(R, R, 0, R, R, R); gr.addColorStop(0, `rgba(0,0,0,${A})`); gr.addColorStop(0.55, `rgba(0,0,0,${A * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; }
    g.fillRect(0, 0, R * 2, R * 2);
    if (LSTAMP.size > 400) LSTAMP.clear();
    st = { c: cv2, R }; LSTAMP.set(key, st); return st;
  }
  // v1.78 디더 빛 도장: 2px 칸 단위로 빛 세기를 단계(어둠 5단계 · 빛 색 12씩)로 끊고 4×4 바이어 디더로 섞음.
  // 도장의 왼쪽 위를 월드 8px(=4칸) 격자에 맞춰 찍으므로 디더 무늬가 월드에 고정됨 (빛이 겹쳐도 무늬가 어긋나지 않음)
  const LBAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const bandQ = (s, t, W = 0.4) => { const b = Math.floor(s), r = s - b, lo = 0.5 - W / 2; return r < lo ? b : r > lo + W ? b + 1 : b + ((r - lo) / W > t ? 1 : 0); }; // 단계는 납작하게, 단계 가운데 폭 W만 디더 (평균 밝기 유지)
  let LSTAMP_PX = 0;
  // v2.50 큰 빛은 반지름을 8칸 단위로 끊어 도장을 재사용 (북이 울릴 때 매 프레임 새 도장을 만들던 문제)
  const lRc = r => r > 48 ? Math.max(2, Math.round(r / 16) * 4) : Math.max(2, Math.ceil(r / 4) * 2);
  function lightStampD(r, a, c, ca, phx = 0, phy = 0) { // phx·phy: 도장 왼쪽 위 칸의 월드 위상(0~3) — 도장이 2px씩 움직여도 망점 무늬는 월드에 고정
    const Rc = lRc(r), key = (c ? 'd' + Rc + '|' + c + '|' + Math.round(ca * 25) : 'd' + Rc + '|' + Math.round(a * 20)) + '|' + phx + phy;
    let st = LSTAMP.get(key); if (st) return st;
    const n = Rc * 2 + 4, [cv2, g] = mkCanvas(n, n), im = g.createImageData(n, n), px = im.data, ctr = n / 2, R = r > 48 ? Rc : r / 2, rc = R * 0.8;
    const A = Math.round(a * 20) / 20, CA = Math.round(ca * 25) / 25, col = c ? c.split(',').map(v => +v) : null, Nd = 10; // v1.80 5 → 10단계 (단계 사이 차이가 작아 점이 덜 보임)
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const ddx = x + 0.5 - ctr, ddy = y + 0.5 - ctr, d = Math.sqrt(ddx * ddx + ddy * ddy), t = (LBAY[((y + phy) & 3) * 4 + ((x + phx) & 3)] + 0.5) / 16, o = (y * n + x) * 4;
      if (!c) { if (d >= R) continue; const q = d / R, f = q < 0.55 ? 1 - q / 0.55 * 0.45 : 0.55 * (1 - (q - 0.55) / 0.45), lv = Math.min(Nd, bandQ(f * Nd, t, 0.3)) / Nd; px[o + 3] = Math.round(A * lv * 255); }
      else { if (d >= rc) continue; const v = CA * (1 - d / rc) * 255, qv = bandQ(v / 6, t, 0.3) * 6; if (qv <= 0) continue; px[o] = col[0]; px[o + 1] = col[1]; px[o + 2] = col[2]; px[o + 3] = Math.min(255, qv); }
    }
    g.putImageData(im, 0, 0);
    if (LSTAMP.size > 6000 || LSTAMP_PX > 12e6) { LSTAMP.clear(); LSTAMP_PX = 0; }
    LSTAMP_PX += n * n; st = { c: cv2, n, ctr }; LSTAMP.set(key, st); return st;
  }
  // 도장 찍기: 반 해상도 빛 지도(H.g, 월드 → ×0.5 변환)에 1칸 = 1px로, 왼쪽 위를 8px 격자에 맞춤
  const stampL = (g2, l, col) => { // 빛 하나 찍기: 칸(2px) 단위 위치 + 그 위상의 도장
    const Rc = lRc(l.r), ctr = Rc + 2, cx = Math.round(l.x / 2) - ctr, cy = Math.round(l.y / 2) - ctr;
    const st = col ? lightStampD(l.r, 0, l.c, l.ca, cx & 3, cy & 3) : lightStampD(l.r, l.a, null, 0, cx & 3, cy & 3);
    g2.drawImage(st.c, cx * 2, cy * 2, st.n * 2, st.n * 2); };
  const stampAt = (g2, st, x, y) => { const X = Math.round((x - st.ctr * 2) / 8) * 8, Y = Math.round((y - st.ctr * 2) / 8) * 8; g2.drawImage(st.c, X, Y, st.n * 2, st.n * 2); };
