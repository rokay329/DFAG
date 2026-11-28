'use strict';
// 잿빛 왕관 원정대 — 71_informant.js : v3.69 정보원 PRS-22(오목눈이) · DW-5000(햄스터) 등장 장면 (시안 _시안/정보원_PRS-22_DW-5000.html)
//  · 일반 루트: 장마다 첫 번째 보스 문 열쇠(정령의 불씨 · 기사단 인장 조각 · 전사의 엄니 · 붉은 보석)를 줍는 순간 (v3.69b 두 번째 → 첫 번째)
//  · v3.80 시선: 눈·부리(코)를 앞쪽으로 옮기고 눈을 한 줄 올려, 플레이어 쪽을 올려다봄 (시안 _시안/정보원_시선_시안01.html C안)
//  · 흐름: 근처 장애물 뒤가 바스락거림 → 둘이 튀어나와 플레이어 양옆에 내려앉음 → 속담 「밤말은 새가 듣고, / 쥐가 듣는다.」 → PRS-22 봉인 소문 → DW-5000 왕관 조각 소문
//          → PRS-22는 날아가고 DW-5000은 땅을 파고 사라짐 · 장마다 대사가 다름 · 한 판에 장마다 한 번
const INFORM = (() => {
  const PR = {"m": [".....kkkkk.....", "....kBWWWBk....", "...kBWEWWWEk...", "...kWWWWWywk...", "...kWWWWWWwk...", "..kBWWWWWWwBk..", "..kBPWWWWWPBk..", "..kBpPWWWPpBk..", ".kBkkpPPPpkk...", "kBk..kkkkk.....", "kk...kf.kf.....", ".....kk.kk....."], "p": {"k": "#0b0a0e", "W": "#f6f2ee", "w": "#d6cfd2", "B": "#57505f", "b": "#4a4452", "P": "#e9bcc0", "p": "#c4929c", "E": "#0b0a0e", "e": "#ffffff", "y": "#4a3a36", "f": "#6a5650"}, "bob": 5, "face": "W"};
  const DW = {"m": [".kk.......kk.", "knOk.....kOnk", "kNOkkkkkkkONk", ".kOOOEOOOEOk.", "kOOOOXOOOXOOk", "kWOOOOOnOOOWk", "kWWWOOONOWWWk", "kWWWWWWWWWWWk", "kOWWfWWWfWWok", "kOOWWWWWWWOok", ".kOOWWWWWOok.", "..kfkkkkkfk..", "..kk.....kk.."], "p": {"k": "#0b0a0e", "O": "#e8a35a", "o": "#c47e3c", "d": "#9a5c2a", "W": "#fbf3e6", "w": "#e2d6c4", "n": "#f0a0a8", "N": "#d07884", "E": "#0b0a0e", "e": "#ffffff", "f": "#f0b8b0", "X": "#5a3420"}, "bob": 7, "face": "O"};
  // 장마다 소문 (말주머니는 문장마다 하나)
  const LINES = {
    1: { intro: [['prs', '잠깐. 무기는 내려 둬.'], ['prs', '우린 소문에 죽고 소문에 살지.'], ['prs', '나는 PRS-22.'], ['dw', '나는 DW-5000.'], ['prs', '밤말은 새가 듣고,'], ['dw', '쥐가 듣는다.']] /* 1장은 소개 사이에 속담 */, // v3.69c 1장: 처음 만나는 자리라 자기소개
      prs: ['어디서 들은 얘긴데.', '정령의 불씨 두 개를 문 앞에 바치면 봉인이 풀린대.', '방금 하나를 주웠으니, 남은 건 하나야.', '나머지는 다른 우두머리의 굴에 있대.'], dw: ['이건 볼주머니에 넣어 둔 소문인데.', '문 너머 구루그가 왕관 조각 하나를 삼키고 있대.', '조각을 다 모으면 잿빛 왕에게 닿는다나 봐.'] },
    2: { prs: ['어디서 들은 얘긴데.', '쪼개진 기사단 인장을 맞추면 성채의 문이 열린대.', '네가 주운 건 반쪽뿐이야.', '나머지 반쪽은 다른 처형장에 있대.'], dw: ['볼주머니에서 꺼낸 소문이야.', '발도르는 왕관 조각을 지키느라 성채를 떠나지 않는대.', '조각을 다 모으면 잿빛 왕에게 닿는다나 봐.'] },
    3: { prs: ['어디서 들은 얘긴데.', '전사의 엄니 두 개를 꽂으면 부락의 문이 열린대.', '결투에서 진 전사들의 엄니라던데.', '남은 하나는 다른 결투장에 있대.'], dw: ['볼주머니 깊숙이 넣어 둔 소문인데.', '크루가쉬는 왕관 조각을 전리품처럼 지니고 있대.', '피 냄새를 따라가면 찾을 수 있다나 봐.'] },
    4: { prs: ['어디서 들은 얘긴데.', '붉은 보석 두 개가 마지막 문을 연대.', '남은 하나는 다른 알현실에 있대.', '그 너머엔 잿빛 왕이 있다지.'], dw: [], bye: [['prs', '우리가 줄 수 있는 소문은 여기까지야.'], ['dw', '건투를 빌게.']] } /* v3.80 4장: 이미 왕관을 맞춰 들어온 뒤라 왕관 소문 대신 마지막 인사 */,
  };
  let S = null;
  // v3.66 정보원이 사라진 뒤 주인공 혼잣말 (장 · 캐릭터별, 말주머니는 문장마다 하나 · 주인공은 멈춰 서서 F로 넘김)
  const AFTER = {"1": {"knight": ["잿빛 왕…", "그 이름을 들으니 팔의 상처가 욱신거리는군…"], "ranger": ["첫 번째 대상이 조각을 삼켰다고…?", "우연이겠지.", "우선 처리 대상부터 제거하자."], "mage": ["조각을 모으면 잿빛 왕에게 닿는다…", "마력이 끌려가던 방향과 같네요.", "우연이라고 하기엔 너무 잘 맞아요."], "priest": ["잿빛 왕에게 닿는 조각이라…", "이 순례길도 왕도로 이어져 있어요.", "신께서 침묵하시는 이유도 그곳에 있을까요?"], "gunner": ["조각을 다 모으면 왕에게 닿는다라.", "소문치곤 친절하군.", "점액 덩어리.", "그걸 죽여 보면 알겠지."]}, "2": {"knight": ["조각을 지키는 기사라…", "발도르에게 이 통증에 대한 단서가 있을지도 몰라."], "ranger": ["두 번째 대상도 조각을 지키고 있다니.", "이 성채의 문양… 첫 파편과 같은 문양이군.", "의뢰인, 당신은 도대체 무얼 찾고 있던 거지…?"], "mage": ["조각 때문에 성채를 떠나지 않는 기사라…", "지키는 걸까요, 묶여 있는 걸까요?", "그 조각을 직접 확인해 봐야겠어요."], "priest": ["조각을 지키느라 성채를 떠나지 못한다니…", "그건 지키는 게 아니라 갇혀 있는 거예요."], "gunner": ["조각 하나 지키겠다고 성채에 눌러앉은 기사라.", "고집 하나는 알아줘야겠군."]}, "3": {"knight": ["왕관 조각을 손에 넣을 때마다 통증이 강해져.", "역시 이 통증이 나를 이끄는군."], "ranger": ["피 냄새라면 내 전문이지.", "마지막 대상도 조각을 가졌군.", "의뢰와 왕관 조각을 찾는 일이 같은 곳을 향하고 있어…"], "mage": ["조각을 전리품처럼 지니고 있다니…", "크루가쉬는 그 가치를 알고 있는 걸까요?", "세 조각이 모이면 무슨 일이 생기는지, 이제 확인할 수 있겠네요."], "priest": ["조각을 전리품처럼 지니고 있다니…", "그 조각 때문에 이 부락의 싸움이 끝나지 않는 걸까요?"], "gunner": ["피 냄새라면 이 부락에 넘쳐나는데.", "제일 진한 쪽으로 가면 되겠군."]}, "4": {"knight": ["잿빛 왕.", "곧 답을 들을 수 있겠군."], "ranger": ["보수는 상관없어.", "이 일의 끝에 무엇이 있는지 직접 확인해야겠어."], "mage": ["그 너머에 잿빛 왕이…", "더는 멀리서 추측하지 않겠어요."], "priest": ["붉은 보석 너머에 잿빛 왕이…", "더는 응답을 기다리지 않겠어요."], "gunner": ["붉은 보석 두 개, 그 너머에 왕.", "길은 다 들었군.", "이제 방아쇠만 당기면 돼."]}}; // v3.83 대사 개정 (claude/주인공_대사정리_소문_왕관조각_v3.83.md)
  function afterTalk(st) { try { const L = AFTER[st] && AFTER[st][G.cls]; if (L && L.length && G.player && !G.player.dead) TRUTH.talk(L.map(t => ['me', t])); } catch (e) { console.error(e); } }
  const sn = v => Math.round(v / 2) * 2;
  // ---------------------------------------------------------------- 그리기 (2px 칸 · 발 가운데 기준 · face: 1 오른쪽)
  function drawGuy(it, x, y, z, face, bob, blink, al) {
    const m = it.m, H = m.length, W = m[0].length, X0 = sn(x) - Math.floor(W / 2) * 2, B = sn(y - z);
    ctx.save(); if (al != null && al < 1) ctx.globalAlpha = al;
    for (let j = H - 1; j >= 0; j--) for (let i = 0; i < W; i++) { let c = m[j][i]; if (c === '.') continue;
      if (blink && c === 'E' && j + 1 < H && m[j + 1][i] === 'X') c = it.face; else if (blink && c === 'X') c = 'k'; else if (blink && c === 'E') c = it.face;
      const ii = face < 0 ? W - 1 - i : i; ctx.fillStyle = it.p[c]; ctx.fillRect(X0 + ii * 2, B - (H - j) * 2 + (j < it.bob ? bob * 2 : 0), 2, 2); }
    ctx.restore();
  }
  function shadow(x, y, w, a) { ctx.save(); ctx.fillStyle = 'rgba(4,3,8,.8)'; ctx.globalAlpha = a; for (let yy = -2; yy <= 2; yy += 2) for (let xx = -w; xx <= w; xx += 2) if (((xx + yy) / 2 & 1) === 0 && (xx / w) ** 2 + (yy / 3) ** 2 <= 1) ctx.fillRect(sn(x) + xx, sn(y) + yy, 2, 2); ctx.restore(); }
  // ---------------------------------------------------------------- 시작
  function hideSpot(R, P, used) { // 플레이어 가까운 장애물 뒤 (없으면 방 위쪽 끝)
    let best = null, bd = 1e9;
    for (const b of R.obs || []) { const bx = b.x != null ? b.x : (b.x0 + b.x1) / 2, by = b.y != null ? b.y : b.y0; if (bx == null || by == null) continue; const d = Math.hypot(bx - P.x, by - P.y);
      if (d < 70 || d > 320 || used.some(u => Math.hypot(u.x - bx, u.y - by) < 60)) continue; if (d < bd) { bd = d; best = { x: bx, y: by - (b.r || 10) - 2 }; } }
    return best || { x: clamp(P.x + (used.length ? 140 : -140), A.x0 + 30, A.x1 - 30), y: A.y0 + 14 };
  }
  function start() {
    const D = G.dun, R = D && D.cur, P = G.player; if (!R || !P) return;
    const h1 = hideSpot(R, P, []), h2 = hideSpot(R, P, [h1]);
    const side = h1.x <= h2.x ? [-1, 1] : [1, -1];
    const land = s => ({ x: clamp(P.x + s * 46, A.x0 + 24, A.x1 - 24), y: clamp(P.y + 18, A.y0 + 24, A.y1 - 10) /* v3.80 올려다보니 주인공보다 살짝 앞(아래)에 내려앉음 */ });
    S = { t: 0, ph: 'rustle', st: G.stage, a: { it: PR, h: h1, l: land(side[0]), x: h1.x, y: h1.y, z: 0, show: false }, b: { it: DW, h: h2, l: land(side[1]), x: h2.x, y: h2.y, z: 0, show: false }, parts: [] };
    TRUTH.freeze(); P.state = 'idle'; P.face = 1; sfx('blip', 1.4);
  }
  function puff(x, y, cols, n, up) { for (let i = 0; i < n; i++) S.parts.push({ x: x + rand(-8, 8), y: y - rand(0, 10), vx: rand(-50, 50), vy: -rand(20, up || 80), t: rand(0.3, 0.6), c: pick(cols), g: 240 }); }
  const LEAF = ['#6a8a4a', '#4a6a34', '#8aa060', '#5a4a36'];
  function tick(dt) {
    const s = S; s.t += dt; const t = s.t, P = G.player;
    for (const q of s.parts) { q.t -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; } s.parts = s.parts.filter(q => q.t > 0);
    if (s.ph === 'rustle') { // 장애물 뒤가 바스락 (두 번)
      for (const [o, d] of [[s.a, 0], [s.b, 0.25]]) if (t > d && Math.random() < dt * 18) puff(o.h.x + rand(-10, 10), o.h.y + 4, LEAF, 1, 50);
      if (t > 0.9) { s.ph = 'pop'; s.t = 0; sfx('dodge', 1.3); }
    } else if (s.ph === 'pop') { // 튀어나와 포물선으로 내려앉음 (PRS-22는 날갯짓으로 조금 더 높이)
      for (const [o, d, hgt] of [[s.a, 0, 46], [s.b, 0.18, 30]]) { const k = Math.min(1, Math.max(0, (t - d) / 0.5)); if (k > 0 && !o.show) { o.show = true; puff(o.h.x, o.h.y + 2, LEAF, 8, 120); sfx('swing', o === s.a ? 1.7 : 1.4); }
        o.x = o.h.x + (o.l.x - o.h.x) * k; o.y = o.h.y + (o.l.y - o.h.y) * k; o.z = Math.sin(k * Math.PI) * hgt; if (k >= 1 && !o.landed) { o.landed = true; o.z = 0; puff(o.x, o.y, ['#8a8a8a', '#6a6a6a'], 4, 30); sfx('step', 1.2); } }
      if (t > 0.9) { s.ph = 'talk'; s.t = 0; P.face = Math.sign((s.a.x + s.b.x) / 2 - P.x) || 1;
        const L = LINES[s.st] || LINES[1], lines = [...(L.intro || [['prs', '밤말은 새가 듣고,'], ['dw', '쥐가 듣는다.']]), ...L.prs.map(x => ['prs', x]), ...L.dw.map(x => ['dw', x]), ...(L.bye || [['prs', '그럼, 우린 이만.'], ['dw', '들은 건 비밀이야.']])];
        TRUTH.talk(lines, () => { if (S) { S.ph = 'exit'; S.t = 0; sfx('dodge', 1.2); } }); }
    } else if (s.ph === 'exit') { // PRS-22는 비스듬히 날아오르고, DW-5000은 땅을 파고 들어감
      const a = s.a, b = s.b, ka = Math.min(1, t / 0.8);
      a.z = ka * ka * 260; a.x = a.l.x - (a.l.x < P.x ? 1 : -1) * ka * 120; a.al = 1 - Math.max(0, (ka - 0.6) / 0.4);
      const kb = Math.min(1, t / 0.6); b.sink = kb; if (Math.random() < dt * 30 && kb < 1) puff(b.x, b.y, ['#6a5040', '#4a3828', '#8a6a4a'], 1, 60);
      if (t > 0.9) { if (dg) { dg.fillStyle = 'rgba(30,20,14,.6)'; for (let y = -2; y <= 2; y += 2) for (let x = -6; x <= 6; x += 2) if ((x / 6) ** 2 + (y / 3) ** 2 <= 1) dg.fillRect(sn(b.x) + x, sn(b.y) + y, 2, 2); } // 파고 들어간 자리
        S = null; afterTalk(s.st); }
    }
    if (S && S.ph !== 'talk') { TRUTH.freeze(); G.prompt = null; }
  }
  function ents(list) {
    if (!S) return; const now = time;
    for (const [o, k] of [[S.a, 0], [S.b, 1]]) { if (!o.show) continue; const P = G.player, face = (o.x <= P.x ? 1 : -1) * (k === 0 ? 1 : 1);
      const bob = Math.floor(now * 2 + k * 0.5) % 2, blink = ((now + k * 0.9) % 3.4) < 0.13, flap = k === 0 && o.z > 2;
      list.push({ y: o.y, d: () => { shadow(o.x, o.y, o.it === DW ? 8 : 9, 0.8 * (1 - Math.min(1, o.z / 80)) * (o.al == null ? 1 : o.al) * (1 - (o.sink || 0)));
        if (o.sink) { ctx.save(); ctx.beginPath(); ctx.rect(o.x - 40, o.y - 80, 80, 80 + 1); ctx.clip(); drawGuy(o.it, o.x, o.y + o.sink * 28, 0, face, bob, blink, 1); ctx.restore(); return; }
        drawGuy(o.it, o.x, o.y, o.z, face, flap ? Math.floor(now * 14) % 2 : bob, blink, o.al); } }); }
    for (const q of S.parts) list.push({ y: q.y + 30, d: () => { ctx.fillStyle = q.c; ctx.fillRect(sn(q.x), sn(q.y), 2, 2); } });
  }
  function spk(who) { if (!S) return null; const o = who === 'prs' ? S.a : who === 'dw' ? S.b : null; return o ? { x: o.x, y: o.y - 34 } : null; }
  // ---------------------------------------------------------------- 연결
  { const o = collectLoot; collectLoot = function (l) { const r = o.apply(this, arguments);
      try { const D = G && G.dun; if (l && l.type === 'sealkey' && D && !D.home && !D.forge && D.keys >= 1 && !D.informed) { D.informed = true; PEND = { t: 0, st: G.stage }; } /* v3.79 바로 등장 (적이 남아 있거나 방을 옮기는 중이면 그게 끝난 뒤) — 몸에 남던 이펙트는 72_cinema가 대화 중에도 흘려보냄 */ } catch (e) { console.error(e); }
      return r; }; }
  // v3.79 조각을 줍고 2.4초쯤 지나 한숨 돌린 뒤 등장 — 그동안 조작이 자유로울 때만 시간이 흐름 (방을 옮기는 중 · 다른 대화 · 살아 있는 적이 있으면 기다림)
  let PEND = null;
  const FIELD = ['combat', 'elite', 'survive', 'start']; // v3.80 전투를 끝낸 싸움터에서만 등장 — 열쇠를 줍자마자 문으로 나가면 비스트로 · 상점 · 빛의 방 같은 곳에서 튀어나오던 문제 → 다음 싸움터를 정리한 뒤로 미룸
  { const o = update; update = function (rdt) { const r = o.apply(this, arguments);
      try { if (PEND && G && G.player && mode === 'play' && !S) { const R0 = G.dun.cur, free = R0 && FIELD.includes(R0.type) && R0.cleared && !G.dun.home && !G.dun.forge && !G.trans && !G.cine && !G.player.dead && !TRUTH.busy() && !(typeof LOADQ !== 'undefined' && LOADQ.on) && !G.enemies.some(e => !e.dead && e.type !== 'anc' && e.type !== 'dummy' && !e.ally) /* v3.80 시작 방 허수아비는 빼고 */;
          if (free) { PEND.t -= rdt; if (PEND.t <= 0) { PEND = null; start(); } } }
        if (PEND && (!G || G.stage !== PEND.st)) PEND = null; /* 다른 장으로 넘어가면 취소 */ } catch (e) { console.error(e); PEND = null; }
      return r; }; }
  { const o = TRUTH.busy; TRUTH.busy = function () { if (S && S.ph !== 'talk') { if (G) G.prompt = null; return true; } return o.apply(this, arguments); }; }
  { const o = TRUTH.update; TRUTH.update = function (rdt) { if (S && S.ph !== 'talk') { tick(rdt); return; } const r = o.apply(this, arguments); if (S && S.ph === 'talk') { /* 대화 중에도 알갱이는 흩어짐 */ for (const q of S.parts) { q.t -= rdt; q.x += q.vx * rdt; q.y += q.vy * rdt; q.vy += q.g * rdt; } S.parts = S.parts.filter(q => q.t > 0); } return r; }; }
  { const o = TRUTH.ents; TRUTH.ents = function (list) { o.apply(this, arguments); ents(list); }; }
  { const o = TRUTH3.spk; TRUTH3.spk = function (who) { const q = spk(who); return q || o.apply(this, arguments); }; }
  return { start, abort() { S = null; PEND = null; } /* v3.80 테스트 Shift+7 */, get on() { return !!S; } };
})();
