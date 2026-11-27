'use strict';
// 잿빛 왕관 원정대 — 77_clue.js : v3.81 보스 처치 후 단서 — 1장 「초록 파편」 · 2장 「발도르의 기록」 (시안 _시안/이야기연출_시안01 · 시안02 · 발도르의기록_쪽지_시안03)
//  · 보스가 쓰러지면 그 장의 왕관 조각(재의 제단 왕관 조각 그림)이 몸에서 튀어나와 옆에 떨어짐 → 「F 살펴보기」 → 조각이 주인공에게 날아옴 → 단서 양피지 → 말주머니
//  · 1장 점액왕 구루그: 초록 조각 · 2장 발도르: 파란 조각에 기사단 맹세 띠가 감겨 있음 → 띠가 풀려 작은 쪽지로 손에 남음 → 쪽지를 든 채 양피지 · 말주머니 → 접어 넣음 (두루마리 없음)
//  · 2장 네로는 집기 전에 좌우를 한 번 훑어봄 · 같은 캐릭터로 두 번째 밤부터는 양피지 없이 말주머니만 · 줍지 않고 떠나도 진행에는 영향 없음
//  · 진엔딩 루트: 1장은 이번 판에 키륵 진실을 봤으면 양피지 없이 말주머니만 · 2장은 발도르 해방 컷신 뒤에 조각이 떨어짐
//  · 단서 양피지는 원정 수첩 「진실 기록」에 넣지 않음 (opt.clue)
//  · 3장 크루가쉬: 붉은 조각 「F 줍기」 → 세 파편이 머리 위로 떠올라 돌고 재가 끌려옴 → 빛으로 이어짐 → 화면 위(왕도 쪽)로 빛줄기 → 내려앉고 번쩍 → 말주머니 (양피지 없음)
//    네로: 공명 뒤 옆 전리품 더미가 반짝 → 「F 살펴보기」 → 찢긴 계약서 조각 양피지 → 말주머니 · 그레이브: 줍기 전에 유품 더미를 한쪽으로 모아 둠
//  · 테스트: ?dev에서 Shift+9 — 1장 점액왕 · Shift+8 — 2장 발도르 · Shift+0 — 3장 크루가쉬를 보스 방 가운데에서 바로 쓰러뜨림 (이 캐릭터의 「처음 본 단서」 기록도 지움)
const CLUE = (() => {
  const CH = {
    1: { gem: 0, c: '#7ad84a', rgb: '122,216,74', hi: '#d4f8a8', name: '초록 파편', title: '초록 파편', band: false, dx: -64, dy: 18,
      common: '파편 표면에 왕가의 문양이 떠올라 있다.',
      para: {
        knight: '구루그의 몸에서 나온 파편에 왕가의 문양이 드러났다. 문양을 보는 순간 팔이 다시 욱신거렸고, 왕도 쪽으로 몸을 돌리자 통증이 조금 더 강해졌다.',
        ranger: '구루그에게서 나온 파편에는 왕가의 문양이 새겨져 있었다. 점액 냄새 밑으로, 계약서에서 맡았던 쇠 비린내가 희미하게 남아 있었다.',
        mage: '파편의 문양은 왕립 서고의 오래된 지도에서 본 왕가의 표식과 닮아 있었다. 마력을 재자 바늘은 왕도 쪽을 가리켰다. 관측탑의 별자리 기록과 같은 각도였다.',
        priest: '파편에 새겨진 왕가의 문양이 희미하게 빛났다. 그 빛은 왕도 쪽으로 기울었고, 미레아의 기도에는 여전히 아무 응답도 돌아오지 않았다.',
        gunner: '파편에는 왕가의 문양이 찍혀 있었다. 그레이브는 그 문양이 이름 없는 묘지의 비석 하나에 새겨진 표식과 같다는 걸 알아차렸다.' },
      say: {
        knight: ['이쪽이군.', '왜 내 팔이 길을 아는 거지?'],
        ranger: ['이건 단순한 사냥 의뢰가 아니야.', '의뢰인은 왕도에서 무언가를 찾고 있었어.'],
        mage: ['왕관은 목적지가 아니라, 무언가를 끌어당기는 중심일 수 있어요.'],
        priest: ['침묵의 한가운데까지 가야만 그 의미를 알 수 있을 거예요.'],
        gunner: ['무덤에 있어야 할 문양이 왜 괴물 배 속에 있지?'] } },
    2: { gem: 1, c: '#6aa8ff', rgb: '74,140,255', hi: '#c8e0ff', name: '파란 파편', title: '발도르의 기록', band: true, dx: -56, dy: 14,
      common: '「왕명을 받들어 기사단은 이 조각을 지킨다. 누구도 성채 밖으로 가져가지 못한다.」',
      para: {
        knight: '기록 끝에 찍힌 왕가의 문양을 보는 순간, 오른팔의 통증이 지금까지보다 깊게 파고들었다.',
        ranger: '기록 끝에는 네로의 계약서에 찍힌 인장과 같은 표식이 남아 있었다.',
        mage: '기록 뒷면의 주문은 파편을 중심에 두고 성채의 방들을 잇고 있었지만, 의식의 목적은 남아 있지 않았다.',
        priest: '파편을 지키라는 명령은 기록에 남았지만, 발도르가 왜 그 자리를 떠나지 못했는지는 적혀 있지 않았다.',
        gunner: '그가 적이었어도, 죽음 이후까지 자리를 지키게 된 자라는 걸 그레이브는 알았다.' },
      say: {
        knight: ['이건 단순한 흉터가 아니야.', '통증이 가리키는 곳으로 가면, 이 문장이 누구의 것인지 알 수 있을 거야.'],
        ranger: ['나 말고도 이걸 뒤진 놈이 있었군.', '의뢰인은 왕의 명령에 가담했거나, 그걸 막으려 했겠지.'],
        mage: ['왕의 명령은 확인했어요.', '이제 그 명령이 무엇을 위한 것이었는지 알아야 해요.'],
        priest: ['왕의 명령이 이들을 붙들었다면, 그 책임을 묻겠어요.'],
        gunner: ['이제 네가 지키던 건 내가 들고 간다.', '누가 널 여기 세워 뒀는지 확인하마.'] } },
    // v3.81e 3장 크루가쉬: 붉은 조각을 주우면 양피지 대신 「세 파편의 공명」 → 말주머니 · 네로는 전리품 더미의 찢긴 계약서 조각 · 그레이브는 유품 더미를 한쪽으로 정리
    3: { gem: 2, c: '#ff7060', rgb: '224,64,48', hi: '#ffb0a0', name: '붉은 파편', band: false, reso: true, dx: -60, dy: 16,
      say: {
        knight: ['도망치라고 아픈 게 아니야.', '가라고 하는 거다.', '…우리가 이걸 깨우고 있는 건가.'],
        ranger: [] /* 공명 뒤 말이 없고 옆 전리품 더미가 반짝이기 시작함 */,
        mage: ['우리가 길을 연 게 아니라…', '무언가가 우리를 통해 길을 찾은 걸지도 몰라요.'],
        priest: ['누구도 이 전쟁을 원하지 않았던 것 같아요.', '이 빛이 무엇을 깨우는지, 왕도에서 확인하겠어요.'],
        gunner: ['우리가 끝내려는 건 왕 하나가 아닐지도 모르겠군.'] } } };
  const CONTRACT = { title: '찢긴 계약서 조각', c: '#d0a050', para: '글자는 거의 지워졌지만, 모서리의 인장은 네로가 가진 계약서와 맞물렸다. 필체가 낯익었지만, 네로는 그 이유를 떠올리지 못했다.',
    say: ['이 의뢰는 왕관을 찾는 일이 아니야.', '누군가 왕관을 감시하라고 날 보낸 거야.'] };
  const sn = v => Math.round(v / 2) * 2;
  const px = (x, y, c, w = 2, h = 2) => { ctx.fillStyle = c; ctx.fillRect(sn(x), sn(y), w, h); };
  const curR = () => G && G.dun && G.dun.cur;
  const bossCh = e => !e || e.type !== 'boss' || !G ? 0 : e.kind === 'slimeking' && G.stage === 1 ? 1 : !e.kind && G.stage === 2 ? 2 : e.kind === 'krugash' && G.stage === 3 ? 3 : 0;
  const seenKey = ch => G.cls + ':' + ch;
  const seen = ch => !!(SAVE.clueSeen && SAVE.clueSeen[seenKey(ch)]);
  let S = null; // 진행 중인 장면

  // ---------------------------------------------------------------- 그림 (1칸 = 2px)
  const NOTE_P = { k: '#0b0a0e', W: '#f2e8cc', w: '#dcc89e', s: '#b89c6c', d: '#7e6040', l: '#4e3c2a', L: '#7a6448', r: '#b02c24', R: '#ec6a4c', q: '#6a1414' };
  // v3.81b 쪽지 디테일: 밝은 종이 · 오른쪽 아래로 그늘 · 짧고 긴 두 줄 글씨 · 하이라이트 있는 밀랍 인장 · 끝이 살짝 말린 모서리
  const NOTES = {
    A: { fold: ['.kkkk.', 'kWWwsk', 'kwwRrk', '.kkqk.'],
         open: ['.kkkkkkk', 'kWWWWWsk', 'kWlllLsk', 'kwwwwwsk', 'kwllLRrk', 'kssdrqdk', '.kkkkkk.'] },
    B: { fold: ['.kkkk.', 'kWWwsk', 'kwwRrk', '.kkqk.'],
         open: ['.kkkkkkkk', 'kWWWWWWsk', 'kWllllLsk', 'kwwwwwwsk', 'kwlllLwsk', 'kwwwwRrdk', 'kssddrqdk', '.kkkkkqk.'] } };
  const TORN = ['.kkkkk..', 'kWWWWsk.', 'kWllLskk', 'kwwwwwsk', 'kwlLwRrk', 'kssdsrqk', '.kkkkkk.']; // 3장 찢긴 계약서 조각 (오른쪽 위가 찢김 · 인장 모서리)
  let NOTE = NOTES.A; // v3.81b 사용자 결정: A안 (시안 _시안/발도르의기록_쪽지_시안03.html)
  function drawNote(cx, cy, key) { const m = key === 'torn' ? TORN : NOTE[key], H = m.length, W = m[0].length, X = sn(cx) - Math.floor(W / 2) * 2, Y = sn(cy) - Math.floor(H / 2) * 2;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const c = m[j][i]; if (c !== '.') px(X + i * 2, Y + j * 2, NOTE_P[c]); } }
  function piece(gi) { const C = CA.crownArt(); return { cv: C.pieces[gi], w: C.w, h: C.h, pc: C.pc[gi] }; }
  // 왕관 조각 (+ 2장: 감긴 맹세 띠) — cx, cy: 조각 가운데
  function drawShard(cx, cy, band, al = 1, gi = 1) {
    const p = piece(gi), X = sn(cx - p.pc[0] * 2), Y = sn(cy - p.pc[1] * 2);
    ctx.save(); ctx.globalAlpha = al; ctx.drawImage(p.cv, X, Y, p.w * 2, p.h * 2);
    if (band) { // 조각 아래쪽 금테에 한 바퀴 감긴 가는 띠(1칸) + 늘어진 끝과 붉은 밀랍 인장 — 보석은 가리지 않음
      const bx = sn(cx), by = sn(cy) + 4; px(bx - 6, by, '#0b0a0e'); px(bx - 4, by, NOTE_P.w, 8, 2); px(bx + 2, by, NOTE_P.W); px(bx + 4, by, '#0b0a0e');
      px(bx + 4, by + 2, NOTE_P.w); px(bx + 6, by + 2, '#0b0a0e'); px(bx + 4, by + 4, NOTE_P.r); px(bx + 6, by + 4, '#0b0a0e'); px(bx + 4, by + 6, '#0b0a0e'); }
    ctx.restore();
  }
  // 전리품 · 유품 더미 (16×7칸): 찌그러진 투구 · 뼈 · 금화 · 찢긴 천 — 네로 더미엔 계약서 조각이 끼어 있음
  const PILE_P = { k: '#0b0a0e', b: '#e8e0d0', B: '#b8b0a0', i: '#8a8a96', I: '#4e4e5a', g: '#e0b040', G: '#9a7028', c: '#8a3424', C: '#4a1a14', p: '#e8dcbc', P: '#bba275' };
  const PILE = ['....kkkk........', '...kiiIIk..kkk..', '..kiiIIIkkkbbBk.', '.kkkIIkkpPkBBk..', 'kccCCkgGkpPkkkk.', 'kcCCkgGGkkkGgk.k', '.kkkkkkkkkkkkkkk'];
  function drawPile(cx, by, paper) { const W = 16, H = PILE.length, X = sn(cx) - 16, Y = sn(by) - H * 2;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let c = PILE[j][i]; if (c === '.') continue; if (!paper && (c === 'p' || c === 'P')) c = c === 'p' ? 'c' : 'C'; px(X + i * 2, Y + j * 2, PILE_P[c]); } }
  const shard = (C, cx, cy, al) => drawShard(cx, cy, C.band, al, C.gem);
  function glow(C, cx, cy, k) { // 바닥의 빛 (디더)
    ctx.save(); ctx.fillStyle = `rgba(${C.rgb},${0.22 + 0.1 * k})`;
    for (let y = -4; y <= 4; y += 2) for (let x = -14; x <= 14; x += 2) if ((((x + y) / 2) & 1) === 0 && (x / 14) ** 2 + (y / 4) ** 2 <= 1) ctx.fillRect(sn(cx) + x, sn(cy) + y, 2, 2);
    ctx.restore(); }
  function twinkle(C, cx, cy, seed) { const t = time * 1.6 + seed; for (let i = 0; i < 3; i++) { const ph = (t + i / 3) % 1; if (ph > 0.35) continue; const a = i * 2.1 + Math.floor(t + i / 3) * 1.7, r = 8 + (i * 5) % 9;
      const x = cx + Math.cos(a) * r, y = cy - 10 + Math.sin(a) * r * 0.7; px(x, y, ph < 0.12 ? '#ffffff' : C.hi); if (ph < 0.18) { px(x - 2, y, C.c); px(x + 2, y, C.c); px(x, y - 2, C.c); px(x, y + 2, C.c); } } }

  // ---------------------------------------------------------------- 떨어짐 (보스 처치 → 1.1초 뒤 몸에서 튀어나와 옆에 떨어지고 두 번 튐)
  function drop(e, ch) { const R = curR(); if (!R || R.clue) return; const C = CH[ch]; // 쓰러진 몸의 왼쪽 (발도르 칼 · 점액 웅덩이를 피함)
    const lx = clamp(e.x + C.dx, A.x0 + 24, A.x1 - 24), ly = clamp(e.y + C.dy, A.y0 + 30, A.y1 - 14);
    R.clue = { ch, ph: 'wait', t: 0, bx: e.x, by: e.y - 30, x: lx, y: ly, z: 0 };
    if (ch === 3 && (G.cls === 'ranger' || G.cls === 'gunner')) R.clue.pile = { x: G.cls === 'ranger' ? lx - 40 : lx, y: ly + 4, paper: G.cls === 'ranger', ox: 0 }; } // 네로: 옆에 전리품 더미 · 그레이브: 조각 둘레에 유품 더미
  const BOUNCE = [[0, 0.55, 46], [0.55, 0.22, 10], [0.77, 0.14, 4]]; // [시작, 길이, 높이]
  function stepDrop(c, dt) { c.t += dt;
    if (c.ph === 'wait') { if (TRUTH.busy()) { c.t = Math.min(c.t, 0.6); return; } /* 진엔딩 루트: 크루가쉬 마지막 말 · 양피지가 끝난 뒤 */ if (c.t >= 1.1) { c.ph = 'fly'; c.t = 0; sfx('swing', 1.6); burstAt(c.bx, c.by, 6, CH[c.ch].c); } return; }
    if (c.ph === 'fly') { const t = c.t, u = Math.min(1, t / BOUNCE[0][1]); c.cx = c.bx + (c.x - c.bx) * u; c.cy = c.by + (c.y - 10 - c.by) * u; c.z = 0;
      for (const [s0, d, h] of BOUNCE) if (t >= s0 && t < s0 + d) c.z = Math.sin((t - s0) / d * Math.PI) * h;
      for (const [s0, d] of BOUNCE) if (!c['b' + s0] && t >= s0 + d) { c['b' + s0] = true; sfx('coin', 1.6 - s0 * 0.4); }
      if (t >= 0.95) { c.ph = 'rest'; c.t = 0; c.z = 0; c.cx = c.x; c.cy = c.y - 10; } } }
  function burstAt(x, y, n, col) { for (let i = 0; i < n; i++) G.parts.push({ x: x + rand(-6, 6), y: y + rand(-6, 6), vx: rand(-60, 60), vy: rand(-90, -20), t: rand(0.3, 0.6), max: 0.6, c: i % 2 ? col : '#ffffff', g: 200, s: 2 }); }

  // ---------------------------------------------------------------- 살펴보기 장면
  function begin(R) { const c = R.clue, P = G.player; if (!c || c.ph !== 'rest' || S) return;
    TRUTH.freeze(); G.prompt = null; P.state = 'idle'; P.face = Math.sign(c.x - P.x) || P.face || 1;
    const first = G.cls === 'ranger' && c.ch === 2 ? 'look' : c.ch === 3 && c.pile && !c.pile.paper ? 'tidy' : 'grab';
    S = { ph: first, t: 0, R, c, C: CH[c.ch], f0: P.face, note: null, parts: [] }; sfx('blip', 1.1); }
  function beginContract(R) { const c = R.clue, P = G.player; if (!c || !c.pile || !c.pile.spark || S) return;
    TRUTH.freeze(); G.prompt = null; P.state = 'idle'; P.face = Math.sign(c.pile.x - P.x) || P.face || 1;
    S = { ph: 'cgrab', t: 0, R, c, C: CH[3], note: null, parts: [] }; sfx('blip', 1.1); }
  function tick(dt) { const s = S, P = G.player; s.t += dt; const t = s.t; TRUTH.freeze(); G.prompt = null;
    for (const q of s.parts) { q.t -= dt; q.x += q.vx * dt; q.y += q.vy * dt; } s.parts = s.parts.filter(q => q.t > 0);
    if (s.ph === 'look') { P.face = t < 0.38 ? -s.f0 : s.f0; if (t > 0.95) { s.ph = 'grab'; s.t = 0; } return; } // 네로: 좌우를 한 번 훑어봄
    if (s.ph === 'tidy') { const pl = s.c.pile; pl.ox = -Math.round(Math.min(1, t / 0.7) * 26 / 2) * 2; if (Math.floor(t / 0.18) !== Math.floor((t - dt) / 0.18) && t < 0.75) sfx('step', 1.8); if (t > 0.95) { s.ph = 'grab'; s.t = 0; } return; } // 그레이브: 유품을 한쪽으로 모아 둠
    if (s.ph === 'grab') { const c = s.c, u = Math.min(1, t / 0.35), hx = P.x + P.face * 7, hy = P.y - 8;
      if (!s.from) s.from = { x: c.cx, y: c.cy }; c.ph = 'taken'; s.sx = s.from.x + (hx - s.from.x) * u; s.sy = s.from.y + (hy - s.from.y) * u - Math.sin(u * Math.PI) * 14;
      if (t >= 0.35) { s.sx = null; s.t = 0; sfx('coin', 1.9); burstAt(hx, hy, 8, s.C.c); lootFeed('왕관 조각 — ' + s.C.name, s.C.c, 3000);
        if (s.C.band) { s.ph = 'unfold'; s.note = 'fold'; } else if (s.C.reso) { s.ph = 'reso'; sfx('swing', 1.2); } else s.ph = 'hold'; } return; }
    if (s.ph === 'hold') { if (t > 0.45) { s.ph = 'parch'; s.t = 0; read(); } return; } // 1장: 조각을 손에 넣고 잠깐 멈춤
    if (s.ph === 'unfold') { if (t > 0.22 && s.note === 'fold') { s.note = 'open'; sfx('swing', 2.2); } if (t > 0.75) { s.ph = 'parch'; s.t = 0; read(); } return; }
    if (s.ph === 'reso') { resoTick(s, dt, t); if (t >= RESO.end) { s.ph = 'talk'; s.t = 0; afterReso(); } return; }
    if (s.ph === 'cgrab') { const pl = s.c.pile, u = Math.min(1, t / 0.35), hx = P.x + P.face * 7, hy = P.y - 8; // 네로: 더미에서 계약서 조각을 뽑아 듦
      s.cx = pl.x + 4 + (hx - pl.x - 4) * u; s.cy = pl.y - 8 + (hy - pl.y + 8) * u - Math.sin(u * Math.PI) * 10; pl.paper = false; pl.spark = false;
      if (t >= 0.35) { s.cx = null; s.note = 'torn'; sfx('swing', 2.2); s.ph = 'chold'; s.t = 0; } return; }
    if (s.ph === 'chold') { if (t > 0.5) { s.ph = 'parch'; s.t = 0; readContract(); } return; }
    if (s.ph === 'fold') { if (t > 0.12 && s.note !== 'torn') s.note = 'fold'; if (t > 0.3) { s.note = null; sfx('step', 1.6); } if (t > 0.45) { S = null; } return; }
  }
  // 세 파편의 공명 (약 3.2초): 떠오름 → 돌기 · 재가 끌려옴 → 빛으로 이어짐 → 왕도 쪽(화면 위)으로 빛줄기 → 끊기며 내려앉고 번쩍
  const RESO = { rise: 0.5, ash: [0.6, 2.2], link: 1.0, beam: [1.5, 2.6], fall: [2.6, 2.95], end: 3.2 };
  const resoC = () => { const P = G.player; return { x: sn(P.x), y: sn(P.y - 44) }; };
  function resoPos(t, i) { const P = G.player, o = resoC(), k = Math.min(1, t / RESO.rise), e = k * k * (3 - 2 * k);
    let r = 16 * e, cx = P.x + (o.x - P.x) * e, cy = P.y - 8 + (o.y - P.y + 8) * e;
    if (t > RESO.fall[0]) { const f = Math.min(1, (t - RESO.fall[0]) / (RESO.fall[1] - RESO.fall[0])); r = 16 * (1 - f); cx = o.x + (P.x - o.x) * f; cy = o.y + (P.y - 8 - o.y) * f; }
    const a = i * Math.PI * 2 / 3 - Math.PI / 2 + Math.max(0, t - 0.2) * 2.4; return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.8 + (Math.floor(t * 4 + i) % 2 ? -2 : 0) }; }
  function resoTick(s, dt, t) { const o = resoC();
    if (t > RESO.ash[0] && t < RESO.ash[1] && Math.random() < dt * 40) { const a = rand(0, Math.PI * 2), d = rand(70, 120), x = o.x + Math.cos(a) * d, y = o.y + 30 + Math.sin(a) * d * 0.5, T = rand(0.5, 0.8); // 바닥의 재가 바람 없이 끌려옴
      s.parts.push({ x, y, vx: (o.x - x) / T, vy: (o.y - y) / T, t: T, c: pick(['#9a948a', '#7e786e', '#c8c2b6']) }); }
    if (!s.did) s.did = {};
    if (t > RESO.link && !s.did.link) { s.did.link = true; sfx('ready', 1.2); }
    if (t > RESO.beam[0] && !s.did.beam) { s.did.beam = true; sfx('blast', 0.7); addShake(2); }
    if (t > RESO.beam[1] && !s.did.cut) { s.did.cut = true; sfx('swing', 0.8); }
    if (t > RESO.fall[1] && !s.did.land) { s.did.land = true; const P = G.player; sfx('coin', 1.4); flashT = Math.max(flashT, 0.08); flashColor = '#ffe0c0'; for (let i = 0; i < 3; i++) burstAt(P.x, P.y - 10, 5, CH[i + 1].c); } }
  function drawReso(s) { const t = s.t, o = resoC(), Cs = [CH[1], CH[2], CH[3]], ps = [0, 1, 2].map(i => resoPos(t, i));
    ctx.save();
    for (const q of s.parts) { ctx.fillStyle = q.c; ctx.fillRect(sn(q.x), sn(q.y), 2, 2); }
    ctx.globalCompositeOperation = 'lighter';
    if (t > RESO.link && t < RESO.fall[0]) for (let i = 0; i < 3; i++) { const a = ps[i], b = ps[(i + 1) % 3], n = Math.max(2, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 2)); // 파편끼리 빛으로 이어짐
      for (let k = 0; k <= n; k++) { if ((k + Math.floor(t * 12)) % 3 === 0) continue; const u = k / n; ctx.fillStyle = u < 0.5 ? Cs[i].hi : Cs[(i + 1) % 3].hi; ctx.globalAlpha = 0.7; ctx.fillRect(sn(a.x + (b.x - a.x) * u), sn(a.y + (b.y - a.y) * u), 2, 2); } }
    if (t > RESO.beam[0] && t < RESO.beam[1]) { const k = (t - RESO.beam[0]) / (RESO.beam[1] - RESO.beam[0]), w = Math.round((k < 0.2 ? k / 0.2 : k > 0.85 ? (1 - k) / 0.15 : 1) * 3) * 2, top = CAMY - 4; // 왕도 쪽(화면 위)으로 가는 빛줄기
      if (w > 0) { for (let y = sn(o.y) - 4; y > top; y -= 2) { const c = Cs[Math.floor((y / 6 + t * 18)) % 3 < 0 ? 0 : Math.floor((y / 6 + t * 18)) % 3]; ctx.globalAlpha = 0.55; ctx.fillStyle = c.c; ctx.fillRect(sn(o.x) - w - 2, y, w * 2 + 4, 2); ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffffff'; ctx.fillRect(sn(o.x) - Math.max(2, w / 2), y, Math.max(2, w / 2) * 2, 2); } } }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 3; i++) drawShard(ps[i].x, ps[i].y, false, 1, i);
    ctx.restore(); }
  function afterReso() { const C = CH[3]; let L = (C.say[G.cls] || C.say.knight).slice(); if (G.truthRun && G.truthRun.t3 && L.length) L = L.slice(-1); // 진엔딩 루트: 크루가쉬 마지막 말 뒤라 말주머니는 마지막 하나만
    const end = () => { if (!S) return; const pl = S.c.pile; if (pl && pl.paper) { pl.spark = true; sfx('blip', 1.6); } S = null; }; // 네로: 옆 전리품 더미가 반짝이기 시작함
    if (L.length) TRUTH.talk(L.map(t => ['me', t]), end); else end(); }
  function readContract() { const done = () => { if (!S) return; S.ph = 'talk'; TRUTH.talk(CONTRACT.say.map(t => ['me', t]), () => { if (S) { S.ph = 'fold'; S.t = 0; } }); };
    if (SAVE.clueSeen && SAVE.clueSeen['ranger:3c']) { done(); return; }
    (SAVE.clueSeen || (SAVE.clueSeen = {}))['ranger:3c'] = true; persist();
    showTruthParchment({ no: '발견', title: CONTRACT.title, ac: CONTRACT.c, paras: [CONTRACT.para], clue: true, onClose: done }); }
  function read() { const ch = S.c.ch, C = S.C;
    const done = () => { if (!S) return; S.ph = 'talk'; TRUTH.talk((C.say[G.cls] || C.say.knight).map(t => ['me', t]), () => { if (!S) return; if (S.note) { S.ph = 'fold'; S.t = 0; } else S = null; }); };
    const skip = seen(ch) || (ch === 1 && G.truthRun && G.truthRun.t1); // 두 번째 밤부터 · 1장 진엔딩 루트(키륵 진실)는 말주머니만
    if (skip) { done(); return; }
    (SAVE.clueSeen || (SAVE.clueSeen = {}))[seenKey(ch)] = true; persist();
    showTruthParchment({ no: '발견', title: C.title, ac: C.c, paras: [C.common, C.para[G.cls] || C.para.knight], clue: true, onClose: done }); }

  // ---------------------------------------------------------------- 그리기
  function ents(list) { const R = curR(); if (!R) return; const c = R.clue;
    if (c && c.pile) { const pl = c.pile; list.push({ y: pl.y - 1, d: () => { drawShadow(pl.x + pl.ox, pl.y, 14); drawPile(pl.x + pl.ox, pl.y, pl.paper); if (pl.spark) twinkle(CH[3], pl.x + 4, pl.y + 2, 0.7); } }); }
    if (c && (c.ph === 'fly' || c.ph === 'rest')) { const C = CH[c.ch], cx = c.cx == null ? c.x : c.cx, cy = c.cy == null ? c.y - 10 : c.cy, bob = c.ph === 'rest' ? (Math.floor(time * 2) % 2 ? -2 : 0) : 0;
      list.push({ y: c.y, d: () => { const rest = c.ph === 'rest', fx = rest && typeof KEYFX !== 'undefined'; if (fx) { KEYFX.under(c.x, c.y, C.rgb); KEYFX.pillar(c.x, c.y, C.rgb); } else if (rest) glow(C, c.x, c.y, 0.5 + 0.5 * Math.sin(time * 3)); drawShadow(c.x, c.y, 5); shard(C, cx, cy - c.z + bob); if (fx) KEYFX.over(c.x, c.y - 24, C.c, C.hi); /* v3.82c 크기는 원래대로 · 효과만 */ else if (rest) twinkle(C, c.x, c.y, 0.3); } }); } // v3.82 왕관 조각도 봉인 해제 아이템처럼 강조
    if (S && S.sx != null && S.c) { const s = S; list.push({ y: G.player.y + 2, d: () => shard(s.C, s.sx, s.sy) }); }
    if (S && S.cx != null) { const s = S; list.push({ y: G.player.y + 2, d: () => drawNote(s.cx, s.cy, 'torn') }); }
    if (S && S.ph === 'reso') { const s = S; list.push({ y: G.player.y + 60, d: () => drawReso(s) }); }
    if (S && S.note) { const P = G.player, s = S; list.push({ y: P.y + 1, d: () => drawNote(P.x + P.face * 7, P.y - 8, s.note) /* 가슴 앞 손 높이 · 얼굴을 가리지 않게 */ }); }
  }
  function lights(list) { const R = curR(), c = R && R.clue; if (c && c.ph === 'rest') list.push({ x: c.x, y: c.y - 10, r: 72, a: 0.8, c: CH[c.ch].rgb, ca: 0.3 });
    if (c && c.pile && c.pile.spark) list.push({ x: c.pile.x, y: c.pile.y - 6, r: 30, a: 0.4, c: '208,160,80', ca: 0.15 });
    if (S && S.ph === 'reso') { const o = resoC(); list.push({ x: o.x, y: o.y, r: 90, a: 0.9, c: '255,220,200', ca: 0.25 }); } }

  // ---------------------------------------------------------------- 연결
  { const o = killEnemy; killEnemy = function (e, silent) { const ch = !e || e.dead ? 0 : bossCh(e); const r = o.apply(this, arguments); try { if (ch && e.dead && !silent) drop(e, ch); } catch (x) { console.error(x); } return r; }; }
  if (typeof ORIG !== 'undefined' && ORIG.killEnemy) { const o = ORIG.killEnemy; ORIG.killEnemy = function (e, silent) { const ch = !e || e.dead ? 0 : bossCh(e); const r = o.apply(this, arguments); try { if (ch && e.dead && !silent) drop(e, ch); } catch (x) { console.error(x); } return r; }; } // 진엔딩 루트 크루가쉬는 ORIG로 쓰러짐
  { const o = update; update = function (dt) { const r = o.apply(this, arguments); try { const R = curR(), c = R && R.clue; if (c && (c.ph === 'wait' || c.ph === 'fly') && mode === 'play') stepDrop(c, dt); dbg(); } catch (x) { console.error(x); } return r; }; }
  { const o = TRUTH.interact; TRUTH.interact = function () { const r = o.apply(this, arguments); if (r) return r;
      const R = curR(), c = R && R.clue, P = G && G.player; if (!c || !P || S || TRUTH.busy()) return null;
      if (c.ph === 'rest' && Math.hypot(P.x - c.x, P.y - c.y) < 34) return { k: 'truth', a: 'clue', x: c.x, y: c.y - 30, t: c.ch === 3 ? 'F 줍기' : 'F 살펴보기' };
      if (c.pile && c.pile.spark && Math.hypot(P.x - c.pile.x, P.y - c.pile.y) < 40) return { k: 'truth', a: 'clueC', x: c.pile.x, y: c.pile.y - 28, t: 'F 살펴보기' };
      return null; }; }
  { const o = TRUTH.act; TRUTH.act = function (it) { if (it && it.a === 'clue') { begin(curR()); return; } if (it && it.a === 'clueC') { beginContract(curR()); return; } return o.apply(this, arguments); }; }
  { const o = TRUTH.busy; TRUTH.busy = function () { if (S && S.ph !== 'talk') { if (G) G.prompt = null; return true; } return o.apply(this, arguments); }; }
  { const o = TRUTH.update; TRUTH.update = function (rdt) { if (S && S.ph !== 'talk' && S.ph !== 'parch') { tick(rdt); return; } return o.apply(this, arguments); }; }
  { const o = TRUTH.ents; TRUTH.ents = function (list) { o.apply(this, arguments); try { ents(list); } catch (x) { console.error(x); } }; }
  { const o = TRUTH.lights; TRUTH.lights = function (list) { o.apply(this, arguments); lights(list); }; }

  // ---------------------------------------------------------------- 테스트 Shift+9 (1장) · Shift+8 (2장)
  let Q = null;
  function dbg() {
    if (typeof DEV === 'undefined' || !DEV) return;
    if (!DEVK.has('sd9')) DEVK.set('sd9', '1장 점액왕을 쓰러뜨린 자리로 (초록 파편 · 처음 본 기록 지움)');
    if (!DEVK.has('sd8')) DEVK.set('sd8', '2장 발도르를 쓰러뜨린 자리로 (발도르의 기록 · 처음 본 기록 지움)');
    if (!DEVK.has('sd0')) DEVK.set('sd0', '3장 크루가쉬를 쓰러뜨린 자리로 (세 파편의 공명 · 처음 본 기록 지움)');
    for (const [k, ch] of [['sd9', 1], ['sd8', 2], ['sd0', 3]]) if (pressed[k] === 'shift' && G && mode === 'play' && !G.trans) { pressed[k] = false; if (SAVE.clueSeen) { delete SAVE.clueSeen[seenKey(ch)]; if (ch === 3) delete SAVE.clueSeen['ranger:3c']; } S = null;
      if (G.stage !== ch || G.dun.home || G.dun.forge) { G.stage = ch - 1; G.noLoad = true; nextStage(); if (mode === 'wmap') wmEnd(); if (mode === 'parchment') closeStageParchment(); }
      Q = { t: 0, ch }; lootFeed(`테스트 — ${CH[ch].title || '세 파편의 공명'} (Shift+${[0, 9, 8, 0][ch]})`, '#9fd2ff', 2600); sfx('blip'); }
    if (!Q) return; Q.t += 1 / 60; if (Q.t > 15) { Q = null; return; }
    if (mode !== 'play' || G.trans || G.cine) return;
    if (G.dun.cur.type !== 'boss') { debugToBoss(); return; }
    const b = G.enemies.find(e => bossCh(e) === Q.ch && !e.dead); if (b && b.state !== 'intro' && (Q.ch === 3 || !b.intro)) { const P = G.player; P.x = Math.round((A.x0 + A.x1) / 2); P.y = Math.round(A.y1 - 150); b.x = P.x; b.y = P.y - 96; b.hp = 1; killEnemy(b); Q = null; } // 방 가운데에서 주인공 바로 위에 세우고 쓰러뜨림
  }
  return { get on() { return !!S; }, get ph() { return S ? S.ph : null; }, drawShard, drawNote, setNote(k) { NOTE = NOTES[k] || NOTES.A; }, abort() { S = null; } };
})();
