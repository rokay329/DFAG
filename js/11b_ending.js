'use strict';
// 잿빛 왕관 토벌대 — 11b_ending.js : 엔딩 「다시 황혼으로」(v2.54) · 잿빛 왕의 흔적(2회차부터)
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다.
// 시안: _작업자료/시안/엔딩_시안.html
//   잿빛 왕 처치 → 몸은 그 자세 그대로 발끝부터 잿더미로 굳음 · 머리에 걸친 왕관이 들썩이다 미끄러져 발치로 떨어지고 90°씩 뒤집히며 굴러 멈춤
//   → 「F 왕관 줍기」 → 왕관이 떨리고 세 보석이 번쩍 · 금이 감 → 세 조각으로 쪼개져 흩어짐 → 흰 재 폭풍 · 화면이 하얗게
//   → 캐릭터의 시작 장소(11c HOME)에서 잠든 채 → 깨어남 · 시작 때와 같은 대사 → 「장소 이름?」 → 4단계 암전 → 원정 완료 결과 화면 (v2.55)
//   2회차부터(원정 완료 1회 이상) 대관식장 바닥 가운데 왕관 무늬(카페트) 위에 앞선 잿빛 왕의 굳은 잿더미가 남아 있다.

  const END = (() => {
    const CS = 2;
    const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const clampV = (v, a, b) => Math.max(a, Math.min(b, v));
    const stepT = (t, fps) => Math.floor(t * fps) / fps;
    const blit = (c, x, y) => ctx.drawImage(c, snap2(x), snap2(y), c.width * CS, c.height * CS);
    const ASH = [[46, 43, 40], [74, 70, 64], [110, 106, 98], [148, 142, 132], [184, 178, 166], [207, 201, 189]];

    // ---- 왕관 글자를 지운 머리 그림 (왕관이 떨어진 뒤)
    const NC = { j: 'e', y: 'h', A: 'c', v: 'h', q: 'h', z: 'h', w: 'l' };
    for (const n of ['akHeadS', 'akHead45', 'akHead45H', 'akHeadF']) if (MAPS[n] && !MAPS[n + 'NC']) MAPS[n + 'NC'] = MAPS[n].map(r => r.replace(/[jyAvqzw]/g, ch => NC[ch]));

    // ---- 잿빛 왕을 캔버스에 찍어 두기 (그 순간 자세 그대로) · 잿빛으로 굳힌 판 만들기
    const OX = 120, OY = 200; // 캔버스 안 발 위치
    function snapKing(b, nc) {
      const [c, g] = mkCanvas(240, 240); g.setTransform(1, 0, 0, 1, OX - b.x, OY - b.y);
      const m = ctx, np = G.parts.length, keep = { flash: b.flash, shardGlow: b.shardGlow, trail: b.trail, rings: G.akRings };
      b.flash = 0; b.shardGlow = null; b.trail = []; G.akRings = []; b.nc = nc;
      ctx = g; try { drawAshKing(b, 0, 1); } catch (e) { console.error(e); } finally { ctx = m; b.nc = false; G.parts.length = Math.min(G.parts.length, np); b.flash = keep.flash; b.shardGlow = keep.shardGlow; b.trail = keep.trail; G.akRings = keep.rings; }
      return c;
    }
    function stoneOf(src) {
      const [c, g] = mkCanvas(src.width, src.height); g.drawImage(src, 0, 0);
      const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 200) continue; // 그림자는 그대로
        const r = d[i], gg = d[i + 1], bb = d[i + 2]; if (r < 16 && gg < 16 && bb < 18) continue; // 외곽선
        const mx = Math.max(r, gg, bb), mn = Math.min(r, gg, bb), sat = mx ? (mx - mn) / mx : 0;
        let L = (0.3 * r + 0.59 * gg + 0.11 * bb) / 255; if (sat > 0.4 && mx > 90) L = 0.42; // 잉걸·보석도 굳은 재로
        const k = L < 0.08 ? 0 : L < 0.16 ? 1 : L < 0.3 ? 2 : L < 0.45 ? 3 : L < 0.62 ? 4 : 5;
        d[i] = ASH[k][0]; d[i + 1] = ASH[k][1]; d[i + 2] = ASH[k][2];
      }
      g.putImageData(id, 0, 0); return c;
    }
    function crownCentroid(a, n) { // 왕관이 있는 판과 없는 판의 차이 = 머리에 걸친 왕관
      const A0 = a.getContext('2d').getImageData(0, 0, 240, 240).data, N0 = n.getContext('2d').getImageData(0, 0, 240, 240).data;
      let sx = 0, sy = 0, k = 0; for (let i = 0; i < A0.length; i += 4) if (A0[i] !== N0[i] || A0[i + 1] !== N0[i + 1] || A0[i + 2] !== N0[i + 2]) { const p = i / 4; sx += p % 240; sy += Math.floor(p / 240); k++; }
      return k ? [sx / k - OX, sy / k - OY] : [0, -30];
    }
    function topRow(c) { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 200) return y; return 0; }

    // ---- 2회차부터 남는 흔적: 기본 자세의 잿빛 왕을 굳힌 판 (한 번만 만듦)
    let REMAINS = null;
    function remainsArt() {
      if (REMAINS) return REMAINS;
      const b = { x: 0, y: 0, face: -1, state: 'idle', walk: 0, bladeAng: -Math.PI / 2, bladeTarget: -Math.PI / 2, sw: null, headT: 0, trail: [], flash: 0, stage: 1, shardGlow: null, t: 0, r: 16, type: 'boss', kind: 'ashking' };
      return (REMAINS = stoneOf(snapKing(b, true)));
    }

    const isThrone = R => R && R.type === 'boss' && R.shape === 'coronation';
    function prepRoom(R) { // enterRoom 앞에서: 흔적이 남는 방이면 받침 자리를 막는다
      if (!isThrone(R) || R.remainsChecked) return;
      R.remainsChecked = true; R.remains = (SAVE.clears4 || 0) >= 1;
      if (R.remains) { R.obs.push({ t: 'prop', c: true, x: CX, y: CY + 16, r: 16 }); R.nav = buildNav(R.obs); }
    }

    // ---- 처치 순간
    const ES = () => G && G.endS;
    function onBossDefeat(b) {
      if (!b || b.kind !== 'ashking' || G.stage < lastStage()) return false;
      const A0 = snapKing(b, false), N = snapKing(b, true), S = stoneOf(N), [hx, hy] = crownCentroid(A0, N);
      const dir = b.x <= CX ? 1 : -1, head = { x: b.x + hx, y: b.y + hy }, L1 = { x: head.x + 4 * dir, y: b.y + 8 };
      const F = { x: clamp(L1.x + 52 * dir, A.x0 + 30, A.x1 - 30), y: clamp(L1.y + 24, A.y0 + 30, A.y1 - 30) };
      G.endS = { R: G.dun.cur, t0: time, king: { x: b.x, y: b.y, N, S, top: topRow(N) }, head, L1, F, rot0: b.face > 0 ? 3 : 1, seq: null };
      return true;
    }
    // 왕관 길: 들썩임 → 미끄러져 떨어짐 → 90°씩 뒤집히며 튀고 구름 → 기우뚱 → 멈춤
    const IN = { pop: 0.15, slip: 0.5, land: 0.95, roll: [0.95, 2.35], petrify: [0.15, 1.05] };
    const HOPS = [[0, 0.3, 14], [0.3, 0.55, 8], [0.55, 0.75, 4], [0.75, 0.88, 2]];
    function crownPos(s, t) { // t = 처치 뒤 시간 → [x, y, 회전]
      const S = s.head, L1 = s.L1, F = s.F;
      if (t < IN.pop) return null;
      if (t < IN.slip) { const k = Math.floor((t - IN.pop) * 10); return [S.x + (k % 2 ? 2 : 0), S.y + (k >= 2 ? 2 : 0), s.rot0]; }
      if (t < IN.land) { const k = clampV((stepT(t, 20) - IN.slip) / (IN.land - IN.slip), 0, 1); return [S.x + (L1.x - S.x) * k, S.y + 2 + (L1.y - S.y - 2) * k * k, k < 0.7 ? s.rot0 : 2]; }
      if (t < IN.roll[1]) { const u = (stepT(t, 15) - IN.roll[0]) / (IN.roll[1] - IN.roll[0]), d = 1 - (1 - u) * (1 - u); let hop = 0; for (const [a, b, hh] of HOPS) if (u >= a && u < b) hop = hh * Math.sin(Math.PI * (u - a) / (b - a));
        return [L1.x + (F.x - L1.x) * d, L1.y + (F.y - L1.y) * d - Math.round(hop / 2) * 2, u < 0.88 ? Math.floor(d * 9) % 4 : u < 0.94 ? 1 : 0]; }
      if (t < IN.roll[1] + 0.3) { const k = Math.floor((t - IN.roll[1]) * 12); return [F.x + [2, 0, -2, 0][k % 4] * (k < 2 ? 1 : 0), F.y, 0]; }
      return [F.x, F.y, 0];
    }
    const ROT = {};
    function crownRot(q) { const c0 = CA.crownArt().full; if (!q) return c0; if (ROT[q]) return ROT[q]; const sw = q % 2 ? c0.height : c0.width, sh = q % 2 ? c0.width : c0.height, [c, g] = mkCanvas(sw, sh); g.translate(sw / 2, sh / 2); g.rotate(q * Math.PI / 2); g.drawImage(c0, -c0.width / 2, -c0.height / 2); return (ROT[q] = c); }
    const settled = s => time - s.t0 >= IN.roll[1] + 0.3;
    const here = () => { const s = ES(); return s && G.dun && G.dun.cur === s.R ? s : null; };

    // ---- 연출 시간표 (F를 누른 뒤)
    const SQ = { gem: [0.2, 0.5, 0.8], crack: [0.9, 1.4], shatter: 1.4, fly: 1.0, storm: 2.4, white: [3.2, 4.0], meadow: 4.1, reveal: [4.4, 5.2], wake: 7.4, bubble: 7.6, title: [9.2, 11.4], fade: [11.6, 12.4], end: 12.4 }; // v2.55 대사 말풍선이 걷힌 뒤 장소 이름 (가운데에서 겹치지 않게)
    function interact() {
      const s = here(); if (!s || s.seq || !settled(s)) return null;
      const P = G.player; if (Math.hypot(P.x - s.F.x, P.y - s.F.y) > 34) return null;
      return { k: 'endCrown', o: s, x: s.F.x, y: s.F.y - 30, t: 'F 왕관 줍기' };
    }
    function start() {
      const s = here(); if (!s || s.seq) return;
      const R = G.dun.cur, left = (R.chest && R.chest.kind === 'boss' && !R.chest.opened) || G.dun.rooms.some(r => r.chest && r.chest.pending) || G.loot.some(l => l.type === 'gear');
      if (left && !(G.exitArm > time)) { G.exitArm = time + 3; sfx('block'); lootFeed('아직 챙기지 않은 전리품이 있다 — 다시 F를 누르면 왕관을 줍는다', '#ffb060', 3000); return; }
      G.exitArm = 0; s.seq = { t: 0, ev: {}, crown: crownPos(s, 99) }; G.prompt = null;
      Object.assign(G.player, { state: 'idle', t: 0, queued: false }); for (const k in pressed) pressed[k] = false; mouse.down = false; mouse.rdown = false;
      setHudDim(true); sfx('select');
    }
    const busy = () => !!(ES() && ES().seq);
    function toMeadow(s) { // v2.55 캐릭터의 시작 장소로 (잠든 자세) — 원정을 떠났던 그 자리
      s.endStage = G.stage; G.stage = 1; G.ash = [];
      HOME.place(G.cls, true);
    }
    function finish(s) {
      G.stage = s.endStage || 4; G.endS = null; setHudDim(false);
      showResult(true);
    }
    function update(dt) {
      const s = ES(); if (!s || !s.seq) return;
      const q = s.seq, t0 = q.t, t = q.t += dt, hit = (k, at) => { if (!q.ev[k] && t >= at) { q.ev[k] = true; return true; } return false; };
      for (const k in pressed) pressed[k] = false; G.prompt = null; flashT = Math.max(0, flashT - dt);
      SQ.gem.forEach((g0, i) => { if (hit('g' + i, g0)) sfx('coin', 0.9 + i * 0.15); });
      if (hit('crack', SQ.crack[0])) sfx('block', 0.7);
      if (hit('shatter', SQ.shatter)) { sfx('awaken'); flashT = 0.1; flashColor = '#fff0c0'; }
      if (hit('storm', SQ.storm)) sfx('boss', 0.6);
      if (hit('meadow', SQ.meadow)) toMeadow(s);
      if (hit('wake', SQ.wake)) { G.player.idleT = 0; sfx('blip'); }
      if (hit('bubble', SQ.bubble)) sayPlayer(HOME.line(G.cls), 1.5); // v2.55 시작 때와 같은 대사
      if (t >= SQ.end && t0 < SQ.end) finish(s);
    }

    // ---- 그리기
    function ents(list) {
      const R = G.dun && G.dun.cur;
      if (R && R.remains) list.push({ y: CY + 16, d: () => { const c = remainsArt(); ctx.drawImage(c, snap2(CX - OX), snap2(CY + 16 - OY)); } }); // 바닥 가운데 왕관 무늬 위
      const s = here(); if (!s || (s.seq && s.seq.t >= SQ.meadow)) return;
      const t = time - s.t0, k = s.king;
      list.push({ y: k.y, d: () => { // 발끝부터 2px씩 굳음
        const x0 = snap2(k.x - OX), y0 = snap2(k.y - OY);
        if (t < IN.petrify[0]) { ctx.drawImage(k.N, x0, y0); return; }
        const u = clampV(stepT(t - IN.petrify[0], 12) / (IN.petrify[1] - IN.petrify[0]), 0, 1), cut = OY + 4 - Math.round(u * (OY + 4 - k.top) / 2) * 2;
        if (cut > 0) ctx.drawImage(k.N, 0, 0, 240, cut, x0, y0, 240, cut);
        ctx.drawImage(k.S, 0, cut, 240, 240 - cut, x0, y0 + cut, 240, 240 - cut);
        if (u < 1) { ctx.fillStyle = '#d8d2c6'; for (let x = OX - 40; x < OX + 40; x += 2) if (hash(x + Math.floor(time * 12)) < 0.3) ctx.fillRect(x0 + x, y0 + cut, 2, 2); }
      } });
      if (s.seq && s.seq.t >= SQ.shatter) return;
      const p = s.seq ? s.seq.crown : crownPos(s, t); if (!p) return;
      list.push({ y: p[1] + 12, d: () => drawCrown(s, p, t) });
    }
    function drawCrown(s, p, t) {
      const C = CA.crownArt(), sq = s.seq ? s.seq.t : -1;
      let [cx, cy, rq] = p;
      if (sq >= 0) { const k = Math.floor(sq * 20); cx += [0, 2, 0, -2][k % 4]; cy += k % 3 === 0 ? -2 : 0; } // 손을 뻗으면 떨림
      const cv = crownRot(rq), ox = cx - C.w, oy = cy - C.h;
      if (sq < 0 && settled(s) && Math.floor(t / 0.3) % 3 === 0) blit(C.glow[Math.floor(t / 0.9) % 3], ox, oy);     // 보석이 차례로 맥박
      if (sq >= 0 && Math.floor(sq / 0.1) % 2 === 0) for (let i = 0; i < 3; i++) blit(C.glow[i], ox, oy);
      blit(cv, cx - cv.width, cy - cv.height);
      const fi = sq >= 0 ? SQ.gem.findIndex(g0 => sq >= g0 && sq < g0 + 0.15) : -1; if (fi >= 0) blit(C.glow[fi], ox, oy);
      if (sq >= SQ.crack[0]) { const k = (sq - SQ.crack[0]) / (SQ.crack[1] - SQ.crack[0]); blit(C.cracks[k < 0.33 ? 2 : k < 0.66 ? 1 : 0], ox, oy); }
      if (t >= IN.land && t < IN.roll[1] + 0.4) { // 바닥에 닿을 때마다 재 먼지 · 금빛 불티
        [IN.land, ...HOPS.map(h => IN.roll[0] + h[1] * (IN.roll[1] - IN.roll[0]))].forEach((t0, j) => { if (t < t0 || t > t0 + 0.4) return; const q = crownPos(s, t0 + 0.001), s0 = stepT(t - t0, 20), n = 10 - j * 2;
          for (let i = 0; i < n; i++) { const a = Math.PI + (i / (n - 1)) * Math.PI, sp = (30 + hash(i * 5 + j) * 40) * (1 - j * 0.18); ctx.fillStyle = i % 3 ? '#8a8496' : '#ffd34d'; ctx.fillRect(snap2(q[0] + Math.cos(a) * sp * s0 * 1.4), snap2(q[1] + 8 + Math.sin(a) * sp * s0 * 0.5), 2, 2); } });
      }
    }
    const FLYDIR = [[-1.0, 0.55], [0.0, -1.0], [1.0, 0.1]];
    function top() { // 어둠 위: 날아가는 파편 · 불티
      const s = here(); if (!s || !s.seq) return; const q = s.seq, t = q.t; if (t < SQ.shatter || t >= SQ.meadow) return;
      const C = CA.crownArt(), [cx, cy] = q.crown;
      if (t < SQ.shatter + SQ.fly) for (let i = 0; i < 3; i++) {
        const pos = tt => { const u = stepT(tt - SQ.shatter, 15), d = 520 * u * u + 60 * u; return [cx + (C.pc[i][0] - C.w / 2) * CS + FLYDIR[i][0] * d, cy + (C.pc[i][1] - C.h / 2) * CS + FLYDIR[i][1] * d]; };
        const p = pos(t), ox = p[0] - C.pc[i][0] * CS, oy = p[1] - C.pc[i][1] * CS;
        for (let k = 1; k <= 4; k++) { const r = pos(t - k * 0.05); ctx.fillStyle = k % 2 ? CA.GEM[i].c : '#ffffff'; ctx.fillRect(snap2(r[0] + (hash(k + i * 9) - 0.5) * 6), snap2(r[1] + (hash(k * 3 + i) - 0.5) * 6), 2, 2); }
        blit(C.glow[i], ox, oy); blit(C.pieces[i], ox, oy);
      }
      if (t < SQ.shatter + 0.5) { const u = stepT(t - SQ.shatter, 20), cols = ['#ffffff', '#ffe9a0', '#7ad84a', '#6aa8ff', '#ff7060'];
        for (let i = 0; i < 22; i++) { const a = (i / 22) * TAU + hash(77 + i) * 0.5, sp = 60 + hash(77 + i * 3) * 80, life = 0.3 + hash(77 + i * 7) * 0.2; if (u > life) continue; ctx.fillStyle = cols[i % 5]; ctx.fillRect(snap2(cx + Math.cos(a) * sp * u), snap2(cy + Math.sin(a) * sp * u * 0.8 + 40 * u * u), 2, 2); } }
    }
    function lights(list) {
      const R = G.dun && G.dun.cur;
      if (R && R.remains) list.push({ x: CX, y: CY, r: 60, a: 0.3 });
      const s = here(); if (!s) return; const t = time - s.t0, q = s.seq;
      if (q && q.t >= SQ.meadow) return;
      const p = q ? q.crown : crownPos(s, t);
      if (p && !(q && q.t >= SQ.shatter)) { const fi = q ? SQ.gem.findIndex(g0 => q.t >= g0 && q.t < g0 + 0.15) : -1; list.push({ x: p[0], y: p[1], r: 64, a: 0.7, c: fi >= 0 ? CA.GEM[fi].rgb : '255,200,110', ca: fi >= 0 ? 0.3 : 0.12 }); }
      if (q && q.t >= SQ.shatter && q.t < SQ.shatter + SQ.fly) { const C = CA.crownArt(), [cx, cy] = q.crown; for (let i = 0; i < 3; i++) { const u = stepT(q.t - SQ.shatter, 15), d = 520 * u * u + 60 * u; list.push({ x: cx + FLYDIR[i][0] * d, y: cy + FLYDIR[i][1] * d, r: 50, a: 0.7, c: CA.GEM[i].rgb, ca: 0.25 }); } }
      if (q && q.t >= SQ.storm) list.push({ x: cam.x + VW / 2, y: cam.y + VH / 2, r: 700, a: Math.min(0.85, (q.t - SQ.storm) * 0.6) });
    }
    function screen() { // 화면 좌표: 흰 재 폭풍 · 하얗게 바램/걷힘 · 제목 · 암전
      const s = ES(); if (!s || !s.seq) return; const t = s.seq.t, steps = (a, b) => Math.min(4, Math.floor((t - a) / ((b - a) / 4)) + 1);
      if (t >= SQ.storm && t < SQ.meadow) { const n = Math.min(220, Math.floor((t - SQ.storm) * 140));
        for (let i = 0; i < n; i++) { const sp = 80 + hash(i * 3) * 160, x = hash(i) * VW + Math.sin(t * 2 + i) * 6, y = VH - ((t - SQ.storm) * sp + hash(i * 7) * VH) % (VH + 20); ctx.fillStyle = i % 4 ? 'rgba(220,214,204,.8)' : '#ffffff'; ctx.fillRect(snap2(x), snap2(y), 2, 2); } }
      let wk = 0; if (t >= SQ.white[0] && t < SQ.meadow) wk = steps(SQ.white[0], SQ.white[1]); else if (t >= SQ.meadow && t < SQ.reveal[1]) wk = t < SQ.reveal[0] ? 4 : 4 - steps(SQ.reveal[0], SQ.reveal[1]);
      if (wk > 0) { ctx.fillStyle = `rgba(232,226,214,${wk / 4})`; ctx.fillRect(0, 0, VW, VH); }
      if (t >= SQ.title[0] && t < SQ.title[1]) HOME.drawTitle(HOME.name(G.cls) + '?', t - SQ.title[0], SQ.title[1] - t < 0.2); // v2.55 시작 때와 같은 장소 이름 뒤에 ?만
      if (t >= SQ.fade[0]) { ctx.fillStyle = `rgba(0,0,0,${steps(SQ.fade[0], SQ.fade[1]) / 4})`; ctx.fillRect(0, 0, VW, VH); }
    }
    return { onBossDefeat, prepRoom, interact, start, busy, update, ents, top, lights, screen, isThrone };
  })();

