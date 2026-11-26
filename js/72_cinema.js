'use strict';
// 잿빛 왕관 원정대 — 72_cinema.js : v3.70 대화 시네마 모드 — 대화 · 연출 장면이 시작되면
//  · 화면 위아래에 검은 띠(레터박스, 높이 36칸=화면의 약 8%)가 0.25초 동안 들어옴 · 띠 끝은 2px 망점
//  · HUD(체력 · 스킬 칸 · 미니맵 · 알림 · 보스 막대 · 열쇠 · 조작 안내) 숨김 — 대화 글상자는 그대로
//  · 카메라는 시작할 때 한 번만 맞추고 고정 (v3.72) — 띠에 가리는 사람이 있을 때만 그만큼 옮김 · 작은 방에서도 방 끝 제한을 풀어 엠브라즈 등이 띠에 가리지 않게
//  · 말주머니가 띠에 걸리면 띠 아래로 내림
//  대상: 진엔딩 · NPC 대화(TRUTH) · 용의 유적(RUIN) · 안전 놀이터(DEN) 대화 · 연출 (다가가면 혼자 하는 인사 말주머니는 해당 없음)
const CINE = (() => {
  const BAR = 36;
  let FOC = null, focOn = false; // v3.80 화면 중앙에 둘 자리 (크루가쉬 대화 등) — 대화가 끝나면 풀림
  let k = 0, ox = 0, oy = 0, tx = 0, ty = 0, lockT = -1, lockN = 0, base = null, seen = [], pts = [], on = false;
  { const st = document.createElement('style'); st.textContent = 'body.cine #party,body.cine #phase,body.cine #bkPanel,body.cine #boss,body.cine #skills,body.cine #keyguide,body.cine #lootFeed,body.cine #gearCmp,body.cine #mute,body.cine #trQuest,body.cine #devKeys{visibility:hidden!important}'; document.head.appendChild(st); }
  const busy = () => { try { return !!((TRUTH.busy && TRUTH.busy()) || (typeof RUIN !== 'undefined' && (RUIN.talking ? RUIN.talking() : RUIN.busy())) || (typeof DEN !== 'undefined' && DEN.busy && DEN.busy())); } catch (e) { return false; } };
  const ease = v => v * v * (3 - 2 * v);
  const camOk = () => G && G.player && mode === 'play' && !G.cine && !CA.busy() && !END.busy() && !(typeof LOADQ !== 'undefined' && LOADQ.on);
  // v3.79 대화 중엔 게임 업데이트가 멈춰 막 생긴 이펙트(줍기 고리 · 불티 · 숫자)가 몸에 얼어붙은 채 남음 → 대화 중에도 꾸밈 이펙트만 계속 흘러가 사라지게
  function fadeFx(dt) {
    for (const p of G.parts) { p.t -= dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; p.vy = (p.vy || 0) + (p.g || 0) * dt; p.vx = (p.vx || 0) * 0.96; if (p.floor && p.y > p.floor && p.g > 0) p.t = 0; }
    { let j = 0; const A_ = G.parts; for (let i = 0; i < A_.length; i++) if (A_[i].t > 0) A_[j++] = A_[i]; A_.length = j; }
    for (const n of G.nums) { n.t -= dt; n.y += (n.vy == null ? -24 : n.vy) * dt; } G.nums = G.nums.filter(n => n.t > 0);
    for (const f of G.fx) { if (f.kind === 'lob') continue; f.t -= dt; if (f.grow) f.r += f.grow * dt; } G.fx = G.fx.filter(f => f.t > 0);
  }
  function tick(dt) {
    on = camOk() && busy();
    if (on && G && G.parts) try { fadeFx(dt); } catch (e) { /* 이펙트 */ }
    k = Math.max(0, Math.min(1, k + (on ? 1 : -1) * dt / 0.25));
    document.body.classList.toggle('cine', on);
    if (!camOk()) { ox = oy = 0; lockT = -1; return; }
    if (!on) lockT = -1;
    if (!on && !ox && !oy) return;
    // v3.73 카메라 완전 고정 — 대화가 시작된 순간의 화면을 그대로 붙잡음 (카메라를 다시 계산하지 않음 · 화자를 따라가지 않음)
    //  · 띠에 가리는 사람이 있을 때만, 띠가 들어오는 도중(0.15초) 한 번 '컷'으로 옮기고 끝까지 그대로 · 나중에 나온 말주머니는 띠 아래로 내리기만 함
    if (on && FOC) { // v3.80 지정한 자리를 화면 한가운데로 — 부드럽게 옮겨 고정
      focOn = true; if (lockT < 0) { lockT = 0; lockN = 4; base = { x: cam.x - ox, y: cam.y - oy }; }
      tx = Math.round(FOC.x - VW / 2 - base.x); ty = Math.round(FOC.y - VH / 2 - base.y); const a = Math.min(1, dt * 7); ox += (tx - ox) * a; oy += (ty - oy) * a; if (Math.abs(tx - ox) < 0.5) ox = tx; if (Math.abs(ty - oy) < 0.5) oy = ty;
      cam.x = base.x + ox; cam.y = base.y + oy; cam.clX = false; cam.clY = false; return;
    }
    if (!on && focOn) { focOn = false; FOC = null; }
    if (on) {
      if (lockT < 0) { lockT = 0; lockN = 0; seen = []; base = { x: cam.x - ox, y: cam.y - oy }; tx = ty = 0; }
      if (lockT < 0.15 || lockN < 4) { lockT += dt; lockN++; seen.push(...pts); { const r = typeof RUIN !== 'undefined' && RUIN.talkAt && RUIN.talkAt(); if (r) seen.push(r); }
        if (lockT >= 0.15 && lockN >= 4) { const P = G.player, L = [[P.x, P.y - 24], [P.x, P.y], ...seen]; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
          for (const q of L) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
          const fit = (lo, hi, a, b) => { const n0 = lo - a, n1 = hi - b; return n0 < 0 && n1 > 0 ? (n0 + n1) / 2 : n0 < 0 ? n0 : n1 > 0 ? n1 : 0; };
          tx = Math.round(fit(x0 - base.x, x1 - base.x, 56, VW - 56)); ty = Math.round(fit(y0 - base.y, y1 - base.y, BAR + 52, VH - BAR - 14)); ox = tx; oy = ty; } }
      cam.x = base.x + ox; cam.y = base.y + oy; if (ox || oy) { cam.clX = false; cam.clY = false; }
      return;
    }
    // 끝나면: 원래 카메라로 (옮겼던 경우만 띠가 빠지는 동안 빠르게 돌아감)
    lockT = -1; updateCamera(dt);
    const a = Math.min(1, dt * 10); ox -= ox * a; oy -= oy * a; if (Math.abs(ox) < 0.5) ox = 0; if (Math.abs(oy) < 0.5) oy = 0;
    cam.x += ox; cam.y += oy; if (ox || oy) { cam.clX = false; cam.clY = false; }
  }
  // ---------- v3.70 테스트 Shift+7: 시네마 모드가 나오는 대화 장면으로 차례대로 바로 가서 시작 (누를 때마다 다음 장면)
  const ready = () => G && G.player && !G.player.dead && mode === 'play' && !G.trans && !G.cine && G.dun && G.dun.cur && !(typeof LOADQ !== 'undefined' && LOADQ.on) && !busy();
  const feed = (t, c = '#9fd2ff') => lootFeed(t, c, 3200);
  const sub = () => !!(G.dun.home || G.dun.forge || G.dun.lab || G.dun.den);
  // n장으로 (이미 n장이고 원래 던전이면 그대로 · 유적 · 놀이터 · 실험실 같은 딴 곳에 있으면 그 장을 새로 엶)
  const toStage = n => () => { if (G.stage === n && !sub()) return; G.stage = n - 1; if (n === 4) G.altarDone = true; G.noLoad = true; nextStage(); if (mode === 'wmap') wmEnd(); if (mode === 'parchment') closeStageParchment(); };
  const here = () => () => { if (sub()) toStage(Math.max(1, G.stage))(); };
  const EV = [
    ['정보원 PRS-22 · DW-5000 (지금 장의 첫 열쇠)', [here(), () => { const D = G.dun, P = G.player, k0 = D.keys; D.informed = false; D.keys = 0; collectLoot({ type: 'sealkey', x: P.x, y: P.y, life: 1 }); D.keys = Math.max(D.keys, k0); }]],
    ['키륵 첫 만남 (1장 구덩이 실험실)', [toStage(1), () => { const q = TRUTH.Q; q.met = false; q.q = 0; q.book = false; if (G.dun.cur.type !== 'lab') TRUTH.dbgLab(); }, () => { if (!TRUTH.Q.met) TRUTH.dbgKirk(); }]],
    ['키륵에게 연구 일지 건네기 (1장 구덩이 실험실)', [toStage(1), () => { const q = TRUTH.Q; q.met = true; q.q = 1; q.book = false; if (G.dun.cur.type !== 'lab') TRUTH.dbgLab(); }, () => TRUTH.dbgJournal()]],
    ['엠브라즈 (용의 유적)', [here(), () => RUIN.debugEnter(), () => RUIN.dbgHead(), () => RUIN.dbgTalk()]],
    ['도박사 명수 (안전 놀이터)', [here(), () => DEN.debugEnter(), () => DEN.dbgTalk(0)]],
    ['도박사 영수 (안전 놀이터)', [here(), () => DEN.debugEnter(), () => DEN.dbgTalk(1)]],
    ['쿠키 (비스트로)', [here(), () => { if (G.dun.cur.type !== 'rest') debugToRest(); }, () => { if (G.dun.cur.type === 'rest' && G.dun.cur.bis) BISTRO.act({ who: 'cookie' }); else feed('테스트 — 이 층에는 비스트로가 없습니다', '#9a8f8a'); }]],
    ['쿠오 (비스트로)', [here(), () => { if (G.dun.cur.type !== 'rest') debugToRest(); }, () => { if (G.dun.cur.type === 'rest' && G.dun.cur.bis) BISTRO.act({ who: 'kuo' }); else feed('테스트 — 이 층에는 비스트로가 없습니다', '#9a8f8a'); }]],
    ['세 선조의 마지막 대화 (3장 선조의 결투장)', [() => { if (!TRUTH3.inArena()) TRUTH3.debugAnc(); }, { until: () => TRUTH3.inArena() }, () => TRUTH3.dbgFinale()]],
    ['크루가쉬 · 약속의 결투 (3장 보스)', [toStage(3), () => { TRUTH3.T3.freed = true; debugToBoss(); }, { until: () => G.enemies.some(e => e.kind === 'krugash' && e.kg && e.kg.ph === 'wait' && e.kg.t > 0.7) }, () => { const b = G.enemies.find(e => e.kind === 'krugash'); Object.assign(G.player, { x: b.x, y: b.y + 60 }); TRUTH.act({ a: 'c3kg' }); }]], // v3.76 말을 걸어야 시작
  ];
  let evI = -1, Q = null; // Q: { steps, i, wait }
  function skipTalk() { // v3.80 진행 중인 대화 · 연출을 모두 끊음 (테스트 전용)
    const f = [() => TRUTH.abort(), () => INFORM.abort(), () => RUIN.abortTalk(), () => DEN.abort(), () => { if (G.cine) { G.cine = null; if (typeof setHudDim === 'function') setHudDim(false); } }];
    for (const x of f) try { x(); } catch (e) { /* 없는 모듈 */ }
    if (G && G.player) { G.player.state = 'idle'; G.prompt = null; } Q = null;
  }
  function dbg(dt) {
    if (typeof DEV !== 'undefined' && DEV && !DEVK.has('sd7')) DEVK.set('sd7', '대화 장면(시네마 모드)으로 차례대로 가기');
    if (typeof DEV !== 'undefined' && DEV && pressed['sd7'] === 'shift' && G && mode === 'play') { pressed['sd7'] = false;
      if (busy() || G.cine) skipTalk(); // v3.80 대화 중에 눌러도 지금 대화를 끊고 바로 다음 장면으로
      if (G.trans) { feed('테스트 — 방을 옮기는 중입니다. 잠시 뒤 눌러 주세요', '#9a8f8a'); }
      else { evI = (evI + 1) % EV.length; Q = { steps: EV[evI][1], i: 0, wait: 0, lim: 12 }; feed(`테스트 — 대화 장면 ${evI + 1}/${EV.length} · ${EV[evI][0]} (Shift+7 다음)`); sfx('blip'); } }
    if (!Q) return;
    Q.lim -= dt; if (Q.lim < 0) { Q = null; return; } // 12초 안에 못 가면 포기
    if (Q.wait > 0) { Q.wait -= dt; return; }
    if (!ready()) return;
    const st = Q.steps[Q.i];
    if (st.until) { if (!st.until()) return; } else st(); // { until }: 될 때까지 기다리는 단계
    Q.i++; Q.wait = 0.35; if (Q.i >= Q.steps.length) Q = null;
  }
  { const o = update; update = function (dt) { const r = o.apply(this, arguments); try { tick(dt); dbg(dt); } catch (e) { console.error(e); } return r; }; }
  // 말주머니: 지난 화면의 자리를 카메라 초점으로 · 띠에 걸리면 띠 아래로
  { const o = flushBubbles; flushBubbles = function () {
      if (on) pts = BUBBLES.filter(b => b[3] >= 0).map(b => [b[1], b[2] - 15]).slice(0, 4); else pts = [];
      if (k > 0) { const h = BAR * ease(k); for (const b of BUBBLES) { const top = b[2] - 30 - CAMY; if (top < h + 4) b[2] += h + 4 - top; const bot = b[2] - CAMY; if (bot > VH - h - 4) b[2] -= bot - (VH - h - 4); } }
      return o.apply(this, arguments); }; }
  { const o = drawMinimap; drawMinimap = function () { if (k > 0.01) return; return o.apply(this, arguments); }; }
  { const o = render; render = function () { const r = o.apply(this, arguments);
      if (k > 0 && !(typeof LOADQ !== 'undefined' && LOADQ.on)) { const h = Math.round(BAR * ease(k) / 2) * 2; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, VW, h); ctx.fillRect(0, VH - h, VW, h);
        if (h > 0) for (let x = 0; x < VW; x += 4) { ctx.fillRect(x, h, 2, 2); ctx.fillRect(x + 2, VH - h - 2, 2, 2); } // 띠 끝 망점 한 줄
        ctx.restore(); }
      return r; }; }
  return { focus(x, y) { FOC = { x, y }; }, get on() { return on; }, get k() { return k; }, get dbgT() { return [tx, ty, ox, oy, lockT, seen.length]; } };
})();
