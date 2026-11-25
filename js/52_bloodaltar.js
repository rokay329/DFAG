'use strict';
// 잿빛 왕관 원정대 — 52_bloodaltar.js : v3.26 비밀 방의 두 제단
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

  // 테스트: 비밀 방으로 (두 제단을 다시 쓸 수 있게)
  function debugTo() {
    const D = G.dun, R = D.rooms && D.rooms.find(r => r.type === 'secret');
    if (!R) { lootFeed('테스트 — 이 층에는 비밀 방이 없습니다', '#9a8f8a', 2500); return; }
    for (const a of R.altars || []) a.used = false; S = null; R.visited = R.seen = true;
    for (const q of D.rooms) if (q.crack && (D.rooms[q.doors[q.crack.dir]] === R || q.doors[q.crack.dir] === R.id) &&!q.crack.broken) { q.crack.broken = true; const i = FL_CACHE.findIndex(c => c.key === G.stage + ':' + q.id); if (i >= 0) FL_CACHE.splice(i, 1); }
    if (D.cur === R) { lootFeed('테스트 — 제단을 다시 쓸 수 있습니다', '#9fd2ff', 2000); return; }
    goRoom(R, Object.keys(R.doors).find(d => R.doors[d] != null));
  }
  return { NAME, debugTo, busy: () => !!S };
})();
