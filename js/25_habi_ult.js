'use strict';
// 잿빛 왕관 원정대 — 25_habi_ult.js : 그레이브 각성 「등 맡기기」 (v3.15) — 하비가 내려와 6초 동안 그레이브 등 뒤를 맡는다
// 각성을 쓰면 하비가 왼쪽 위에서 비스듬히 내리꽂혀 그레이브 등 뒤에 착지 → 등을 맞댄 채 따라다니며 뒤쪽 적을 쌍열 샷건으로 쏨(2발 · 재장전). 뒤쪽에 적이 없으면 그레이브 옆으로 나와 앞쪽 적을 쏨 → 한마디 → 왼쪽 위로 튀어 오름
// 그레이브는 그동안 평소처럼 움직이고 쏜다 (조준하며 멈춰 서는 시간 없음) · 그레이브가 점멸하면 같이 점멸 · 난입자는 하비 산탄도 읽고 피함 · 장의사의 머스킷: 하비 산탄 150%
const HABIULT = (() => {
  const HD = {"f":{"base":["..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaanwwwnwwAkkHk...","......kaaauwwwuwAAkkHk...",".......kaawwNwwAAk.kHk...","........kk11SSSkkk.kHk...",".......k23CCBCCCck.kHk...",".......kAk23xCckakkWWk...","........kCCCkCCCkkWWk....",".........kFFk.kFFkkk.....",".........kkkk.kkkk......."],"baseB":["..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaaawwwawwAkkHk...","......kaaanwwwnwAAkkHk...",".......kaawwNwwAAk.kHk...","........kk11SSSkkk.kHk...",".......k23CCBCCCck.kHk...",".......kAk23xCckakkWWk...","........kCCCkCCCkkWWk....",".........kFFk.kFFkkk.....",".........kkkk.kkkk......."],"idle":[".........................","..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaanwwwnwwAkkHk...","......kaaauwwwuwAAkkHk...",".......kaawwNwwAAk.kHk...","........kk11SSSkkk.kHk...",".......k23CCBCCCck.kHk...",".......kAk23xCckakkWWk...",".........kFFk.kFFkkk.....",".........kkkk.kkkk......."],"idleB":[".........................","..........k...k..........",".........kak.kak...k.....","........kpak.kapk.kHk....",".......kaaaaaaaaak.kHk...","......kaaaaawaaaaakkHk...","......kaaaawwwawwAkkHk...","......kaaanwwwnwAAkkHk...",".......kaawwNwwAAk.kHk...","........kk11SSSkkk.kHk...",".......k23CCBCCCck.kHk...",".......kAk23xCckakkWWk...",".........kFFk.kFFkkk.....",".........kkkk.kkkk......."]},"p":{"1":"#b9b9c3","2":"#a9a9b4","3":"#8f8f9b","A":"#d8d4cc","B":"#5a5a62","C":"#c9c9d1","F":"#8a8a96","H":"#fbf9f5","K":"#0b0a0e","N":"#e8909a","S":"#4a3020","W":"#dcd8d0","a":"#fbf9f5","b":"#8d9097","c":"#dcdce2","k":"#0b0a0e","n":"#16120e","p":"#eaa4a8","s":"#6b4a2a","u":"#cfa628","w":"#fbf9f5","x":"#5e5e6a"}};
  const SR = ["......ymmmmmmmmmmh", "tt...ndddddddddddd", "tsssssyMMMMMMMMMMh", "tSSSs.n.ssssssss..", "SS....g..........."]; // 외곽선은 rotW가 바깥에 1칸 붙임 (칸 안에는 넣지 않음)
  const SG = { cells: SR.map(r => [...r]), w: SR[0].length, h: SR.length, px: 5, py: 3, pal: {'k': '#0b0a0e', 's': '#8a5a32', 'S': '#5a3820', 't': '#b07848', 'm': '#d8dce4', 'M': '#9da2ac', 'd': '#3e3e48', 'n': '#6a6a74', 'g': '#2a2a32', 'y': '#c9a24a', 'h': '#1a1a20'}, reach: 0, rot: {} };
  { let m = 0; SR.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') m = Math.max(m, Math.hypot(x - SG.px, y - SG.py)); })); SG.reach = Math.round(m * 2); }
  const DUR = 6, IN = ['등 뒤는 내가 맡지.', '앞만 봐라, 그레이브.', '빚을 갚도록 하지.'], OUT = ['빚은 갚았다.']; // 등장 · 퇴장 대사 확정
  const REACH = 190; // 하비 산탄이 닿는 거리 (이보다 멀면 겨누기만 하고 쏘지 않음)
  let H = null;
  const CV = {};
  // 플레이어블 캐릭터와 같은 움직임: 숨 고르기(0.6초 · 1칸) · 걷기 4프레임(80ms · 2·4프레임은 1칸 내려가고 한 발 듦) · 눈 깜빡임 · 시선(겨누는 쪽으로 눈 1칸)
  const EYE_ROW = 5, EYE_COLS = [10, 14];
  function rowsFor(walk, idle, blink, gaze) {
    let R = (blink ? (idle ? HD.f.idleB : HD.f.baseB) : (idle ? HD.f.idle : HD.f.base)).map(r => [...r]);
    if (walk === 1 || walk === 3) { const B = (blink ? HD.f.baseB : HD.f.base).map(r => [...r]); R = [Array(B[0].length).fill('.')].concat(B.slice(0, B.length - 1)); // 몸 1칸 내려감
      const L = R[R.length - 1], feet = []; for (let x = 0; x < L.length; x++) if (L[x] === 'F') feet.push(x); const half = feet.filter(x => walk === 1 ? x > 13 : x < 13); half.forEach(x => { L[x] = 'k'; }); } // 한 발 듦
    if (gaze) { const off = R[0].every(c => c === '.') ? 1 : 0; for (const y of [EYE_ROW + off, EYE_ROW + 1 + off]) { const row = R[y], keep = EYE_COLS.map(c => row[c]); EYE_COLS.forEach(c => { row[c] = 'w'; }); EYE_COLS.forEach((c, i) => { row[c + gaze] = keep[i]; }); } }
    return R;
  }
  function artW(key, rows) { const k = key + 'W'; if (CV[k]) return CV[k]; const c = document.createElement('canvas'); c.width = rows[0].length * 2; c.height = rows.length * 2; const g = c.getContext('2d'); g.fillStyle = '#ffffff';
    rows.forEach((r, y) => r.forEach((ch, x) => { if (ch !== '.') g.fillRect(x * 2, y * 2, 2, 2); })); return (CV[k] = c); }
  function art(key, rows) { if (CV[key]) return CV[key]; const c = document.createElement('canvas'); c.width = rows[0].length * 2; c.height = rows.length * 2; const g = c.getContext('2d');
    rows.forEach((r, y) => r.forEach((ch, x) => { if (ch === '.' || !HD.p[ch]) return; g.fillStyle = HD.p[ch]; g.fillRect(x * 2, y * 2, 2, 2); })); return (CV[key] = c); }
  const blinkAt = () => { const t = (time + 2.7) % 8.6; return t < 0.12 || (t >= 4.3 && t < 4.42) || (t >= 4.6 && t < 4.72); };
  const footX = (() => { const r = HD.f.base[HD.f.base.length - 1]; let a = -1, b = -1; for (let i = 0; i < r.length; i++) if (r[i] !== '.') { if (a < 0) a = i; b = i; } return (a + b + 1); })();
  const backPos = () => { const P = G.player, a = P.ang + Math.PI; return { x: P.x + Math.cos(a) * 24, y: P.y + Math.sin(a) * 10 + 6 }; }; // 등 뒤 · 살짝 아래 (그레이브에 가려지지 않게)
  const sidePos = e => { const P = G.player, a = P.ang, s = Math.sign(Math.cos(a) * (e.y - P.y) - Math.sin(a) * (e.x - P.x)) || 1, pa = a + s * Math.PI / 2; // 앞쪽 적을 쏠 땐 그레이브 옆(적이 있는 쪽 어깨)으로
    return { x: P.x + Math.cos(pa) * 22 - Math.cos(a) * 6, y: P.y + Math.sin(pa) * 12 + 6 }; };
  const slot = () => (H && H.front && H.tgt && !H.tgt.dead) ? sidePos(H.tgt) : backPos();
  function start() {
    const P = G.player; P.gauge = 0; const b = backPos();
    H = { ph: 'in', t: 0, x: b.x, y: b.y, z: 140, ang: P.ang + Math.PI, cd: 0.4, shot: 0, say: pick(IN), sayT: 1.6 };
    sfx('aim');
  }
  // 겨눌 적: ① 그레이브 등 뒤(보는 방향의 반대쪽 반원)의 가장 가까운 적 → ② 없으면 그레이브 사거리 안의 가장 가까운 적
  // 0.4초마다 다시 고르고, 지금 겨누는 적이 살아 있고 여전히 맞는 쪽이면 그대로 (이리저리 휙휙 돌지 않게)
  function pickTarget() {
    const P = G.player, back = P.ang + Math.PI; let bb = null, bd = REACH, fb = null, fd = REACH; // v3.16 산탄이 닿는 적만 고름 (닿지 않는 먼 적을 겨누느라 가까운 적을 놓치지 않게)
    for (const e of G.enemies) { if (e.dead || isDummy(e)) continue; const d = Math.hypot(e.x - P.x, e.y - P.y), isBack = Math.abs(angDiff(Math.atan2(e.y - P.y, e.x - P.x), back)) < 1.75;
      if (isBack && d < bd) { bd = d; bb = e; } if (!isBack && d < fd) { fd = d; fb = e; } }
    return bb ? { e: bb, front: false } : fb ? { e: fb, front: true } : null;
  }
  function target(dt) {
    H.pickT = (H.pickT || 0) - dt;
    const keep = H.tgt && !H.tgt.dead && Math.hypot(H.tgt.x - G.player.x, H.tgt.y - G.player.y) < REACH + 20 && (H.front || Math.abs(angDiff(Math.atan2(H.tgt.y - G.player.y, H.tgt.x - G.player.x), G.player.ang + Math.PI)) < 1.9);
    if (!keep || H.pickT <= 0) { const p = pickTarget(); if (!keep || (p && (p.e !== H.tgt) && (!p.front || H.front))) { H.tgt = p ? p.e : null; H.front = p ? p.front : false; } H.pickT = 0.4; }
    return H.tgt;
  }
  function threat(e) { // 난입자가 하비의 산탄을 읽음: 하비가 자기를 겨누고 곧 쏠 때
    if (!H || H.ph !== 'on' || H.hide || H.tgt !== e || H.cd > 0.12) { if (e) e.habiRead = false; return null; }
    if (e.habiRead) return null; e.habiRead = true; return Math.random() < 0.75 ? H.ang + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1) : null;
  }
  function shoot() {
    const h = hand(), m = { x: h.x + Math.cos(H.ang) * 26, y: h.y - 2 + Math.sin(H.ang) * 26 };
    const o = { x: h.x, y: h.y - 2 }; // v3.16 판정은 손(총 뿌리)에서 적의 몸통까지 — 총구 끝에서 재면 바로 앞 적이나 조금 비스듬한 적이 빠짐
    for (const e of G.enemies) { if (e.dead) continue; const ex = e.x, ey = e.y - 8, d = Math.hypot(ex - o.x, ey - o.y); if (d < 196 + e.r && (d < 26 + e.r || Math.abs(angDiff(Math.atan2(ey - o.y, ex - o.x), H.ang)) < 0.36 + Math.atan2(e.r, d))) damageEnemy(e, 1.9 * (G.stats.fx.has('undertaker') ? 1.5 : 1) * (1 - Math.min(Math.max(0, d - 26), 170) / 170 * 0.45), /* 장의사의 머스킷: 하비 산탄 150% */ { ang: H.ang, kb: 240, grogi: 6, stagger: 0.4, heavy: true, gauge: 0 }); }
    for (let i = 0; i < 6; i++) { const a = H.ang + rand(-0.32, 0.32), L = rand(110, 170); G.fx.push({ kind: 'tracer', x0: m.x, y0: m.y, x1: m.x + Math.cos(a) * L, y1: m.y + Math.sin(a) * L, w: 3, t: 0.2, max: 0.2, c: '255,220,150' }); }
    G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang: H.ang, s: 2.2, t: 0.14, max: 0.14 }); if (!(H.shot % 2)) sfx('shotgun', 0.85); /* v3.16 두 발에 총성은 한 번 */ if (typeof CASING !== 'undefined') CASING.spawn('red', h.x, h.y, H.y, H.ang); // v3.16 쏠 때마다 빨간 탄피
    H.recoil = 2.5;
  }
  const IN_T = 0.2, OUT_T = 0.22, CROUCH_T = 0.07;
  function landFx(x, y, big) { // 착지 · 도약: 흰 고리 두 겹 + 흙먼지 + 불티
    G.fx.push({ kind: 'ring', x, y, r: 6, grow: big ? 150 : 110, t: 0.24, max: 0.24, c: '#f4f0ff' }); G.fx.push({ kind: 'ring', x, y, r: 3, grow: 70, t: 0.3, max: 0.3, c: '#9fd2ff' });
    for (let i = 0; i < 16; i++) { const a = rand(0, TAU), sp = rand(50, 120); G.parts.push({ x: x + Math.cos(a) * 6, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.4 - 10, t: rand(0.2, 0.4), c: pick(['#8a7a6a', '#a89880', '#6a5a4a']), g: 0 }); }
    for (let i = 0; i < 8; i++) G.parts.push({ x: x + rand(-8, 8), y: y - rand(0, 10), vx: rand(-30, 30), vy: -rand(40, 110), t: rand(0.2, 0.35), c: pick(['#ffffff', '#cfe6ff']), g: 0, glow: true });
  }
  function update(dt) {
    if (!H) return; const P = G.player; H.t += dt; const px0 = H.x, py0 = H.y; H.sayT -= dt; H.recoil = Math.max(0, (H.recoil || 0) - dt * 12); H.flashT = Math.max(0, (H.flashT || 0) - dt);
    if (H.trail) { for (const q of H.trail) q.t -= dt; H.trail = H.trail.filter(q => q.t > 0); }
    if (P.dead && H.ph !== 'out' && H.ph !== 'crouch') { H.ph = 'crouch'; H.t = 0; }
    const b = slot();
    // 같이 점멸: 그레이브가 점멸하면 하비도 같은 효과로 사라졌다가 그레이브 등 뒤에 바로 나타남
    const blinking = P.state === 'dodge' && P.t < BLINK;
    if (H.ph === 'on' || H.ph === 'bye') {
      if (blinking && !H.hide) { H.hide = true; blinkBurst(H.x, H.y - 10); }
      else if (!blinking && H.hide) { H.hide = false; const q = slot(); H.x = q.x; H.y = q.y; H.ox = q.x - P.x; H.oy = q.y - P.y; blinkBurst(H.x, H.y - 10); }
    }
    if (H.ph === 'in') { const k = Math.min(1, H.t / IN_T); H.z = 240 * (1 - k) ** 2; H.x = b.x; H.y = b.y; (H.trail = H.trail || []).push({ x: H.x, y: H.y, z: H.z, t: 0.12 }); // 하늘에서 내리꽂힘
      if (k >= 1) { H.ph = 'on'; H.t = 0; H.z = 0; H.flashT = 0.08; landFx(H.x, H.y, true); sfx('step'); sfx('dodge'); } }
    if (H.ph === 'on' && !H.hide) {
      { const k = Math.min(1, dt * 10); if (H.ox == null) { H.ox = H.x - P.x; H.oy = H.y - P.y; } const tx = b.x - P.x, ty = b.y - P.y, ox0 = H.ox, oy0 = H.oy; H.ox += (tx - H.ox) * k; H.oy += (ty - H.oy) * k; H.oSpd = Math.hypot(H.ox - ox0, H.oy - oy0) / Math.max(dt, 1e-3); H.x = P.x + H.ox; H.y = P.y + H.oy; } // v3.16 등에 붙어 따라다님: 그레이브와의 간격만 부드럽게 바꾸고 몸은 그레이브와 같이 움직임 (따로 끌려오며 후들거리지 않게)
      const e = target(dt), want = e ? Math.atan2(e.y - 8 - (H.y - 5), e.x - H.x) : P.ang + Math.PI;
      H.ang = lerpAng(H.ang, want, Math.min(1, dt * 12)); H.cd -= dt;
      if (e && H.cd <= 0 && Math.abs(angDiff(H.ang, want)) < 0.25 && Math.hypot(e.x - H.x, e.y - H.y) < REACH + e.r) { shoot(); H.shot++; H.cd = H.shot % 2 ? 0.16 : 0.85; } // 두 발 → 재장전
    }
    if (H.ph === 'on' && H.t >= DUR) { H.ph = 'bye'; H.t = 0; H.say = pick(OUT); H.sayT = 1.0; }
    if (H.ph === 'bye' && !H.hide) { { const k = Math.min(1, dt * 10); if (H.ox == null) { H.ox = H.x - P.x; H.oy = H.y - P.y; } const tx = b.x - P.x, ty = b.y - P.y, ox0 = H.ox, oy0 = H.oy; H.ox += (tx - H.ox) * k; H.oy += (ty - H.oy) * k; H.oSpd = Math.hypot(H.ox - ox0, H.oy - oy0) / Math.max(dt, 1e-3); H.x = P.x + H.ox; H.y = P.y + H.oy; } if (H.t > 1.0) { H.ph = 'crouch'; H.t = 0; } }
    if (H.ph === 'crouch' && H.t >= CROUCH_T) { H.ph = 'out'; H.t = 0; H.hide = false; landFx(H.x, H.y, false); sfx('dodge'); } // 움츠렸다가
    if (H.ph === 'out') { const k = Math.min(1, H.t / OUT_T); H.z = 280 * k ** 1.4; (H.trail = H.trail || []).push({ x: H.x, y: H.y, z: H.z, t: 0.12 }); if (k >= 1) H = null; } // 하늘로 튀어 오름
    if (H) H.spd = Math.hypot(H.x - px0, H.y - py0) / Math.max(dt, 1e-3);
    if (H) { if (!H.bub || H.ph === 'in') H.bub = { x: H.x, y: H.y }; else { const k = Math.min(1, dt * 8); H.bub.x += (H.x - H.bub.x) * k; H.bub.y += (H.y - H.bub.y) * k; } } // v3.16 말풍선 자리: 몸을 천천히 따라감
  }
  const hand = () => { const f = Math.cos(H.ang) < 0 ? -1 : 1; return { x: H.x + f * 11 - Math.cos(H.ang) * (H.recoil || 0) * 4, y: H.y - 6 - Math.sin(H.ang) * (H.recoil || 0) * 4 }; }; // 그레이브 heroHand와 같음
  function draw() {
    if (!H || H.hide) return;
    const P = G.player, air = H.ph === 'in' || H.ph === 'out', crouch = H.ph === 'crouch', glued = (H.ph === 'on' || H.ph === 'bye') && H.ox != null, moving = !air && !crouch && (glued ? (P.moving && !P.dead) || (H.oSpd || 0) > 30 : (H.spd || 0) > 12); // v3.16 걷기 그림은 그레이브가 걸을 때 (속도가 문턱을 오가며 걷기·서기가 번갈아 깜빡이지 않게)
    const walk = moving ? Math.floor(time / 0.08) % 4 : -1, idle = crouch || (!air && !moving && Math.floor(time / 0.6) % 2 === 1), blink = !air && blinkAt();
    const flip = P.x < H.x;                                   // 꼬리는 늘 그레이브 쪽 (원래 도트는 꼬리가 오른쪽)
    const look = Math.abs(Math.cos(H.ang)) > 0.38 ? (Math.cos(H.ang) > 0 ? 1 : -1) : 0, gaze = look * (flip ? -1 : 1); // 겨누는 쪽으로 눈
    const key = [walk, +idle, +blink, gaze].join(','), rows = rowsFor(walk, idle, blink, gaze), c = art(key, rows);
    const SLANT = 0.35, ox = -Math.round(H.z * SLANT) & ~1; // 등장 · 퇴장은 똑바로 위가 아니라 살짝 왼쪽 위에서 비스듬히
    const gx0 = glued ? snap2(P.x) + snap2(H.ox) : Math.round(H.x) & ~1, gx = gx0 + ox, gy = glued ? snap2(P.y) + snap2(H.oy) : Math.round(H.y) & ~1, zy = Math.round(H.z) & ~1, bob = (walk === 1 || walk === 3 || idle) ? 2 : 0;
    const blit = (cv, y, a) => { ctx.save(); ctx.globalAlpha = a; if (flip) { ctx.translate(gx, 0); ctx.scale(-1, 1); ctx.drawImage(cv, -footX, y); } else ctx.drawImage(cv, gx - footX, y); ctx.restore(); };
    if (H.trail) { const w = artW(key, rows); for (const q of H.trail) { const qx = gx0 - (Math.round(q.z * SLANT) & ~1); ctx.save(); ctx.globalAlpha = q.t / 0.12 * 0.45; if (flip) { ctx.translate(qx, 0); ctx.scale(-1, 1); ctx.drawImage(w, -footX, gy - c.height + 2 - (Math.round(q.z) & ~1)); } else ctx.drawImage(w, qx - footX, gy - c.height + 2 - (Math.round(q.z) & ~1)); ctx.restore(); } } // 잔상 (흰 실루엣)
    drawShadow(gx0, gy + 1, H.z > 80 ? 4 : 8);
    const h0 = hand(), h = { x: h0.x - H.x + gx0 + ox, y: h0.y - H.y + gy }, /* v3.16 총도 몸과 같은 칸 기준 */ hy = h.y - zy + bob, behind = Math.sin(H.ang) < 0.55; // 그레이브처럼: 총은 몸 뒤 옆 (아래로 겨눌 때만 앞) · 몸이 내려가면 손도 1칸
    if (behind) drawBlade(SG, h.x, hy, H.ang);
    const top = gy - c.height + 2 - zy;
    blit(H.flashT > 0 ? artW(key, rows) : c, top, 1);
    if (!behind) drawBlade(SG, h.x, hy, H.ang);
    { const px = (Math.round(h.x) & ~1) - 2, py = (Math.round(hy) & ~1) - 2; // 그립을 감싼 앞발 (2×2칸 · 1칸 외곽선) — 방아쇠를 쥔 손
      ctx.fillStyle = '#0b0a0e'; ctx.fillRect(px - 2, py, 8, 4); ctx.fillRect(px, py - 2, 4, 8);
      ctx.fillStyle = '#fbf9f5'; ctx.fillRect(px, py, 4, 4); ctx.fillStyle = '#d8d4cc'; ctx.fillRect(px, py + 2, 4, 2); }
    if (H.sayT > 0 && !air && !crouch && H.bub) drawBubble(H.say, H.bub.x, H.bub.y - 34); // v3.16 말풍선은 칸에 맞춘 몸 위치가 아니라 부드럽게 따라가는 위치에 (2칸씩 툭툭 튀며 떨리지 않게)
  }
  function ents(list) { if (H) list.push({ y: H.y, d: draw }); }
  return { start, update, ents, threat, get on() { return !!H; }, _H: () => H };
})();
