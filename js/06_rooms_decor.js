'use strict';
// 잿빛 왕관 토벌대 — 06_rooms_decor.js : NPC 말주머니, 전설 무기 독백·시네마틱, 방 꾸미기, 4장 왕도 오브젝트, 맵 분위기, 칸 묶음 최적화, 문 표시, 미니맵·지도·순간이동
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ v1.10 NPC 말주머니 · 가격표
  // 말주머니: 밝은 바탕 + 검은 외곽선 + 아래 꼬리 (2px 칸). 가까이 오면 한 번 인사, 머무는 동안은 9~13초마다 한 줄, 3.2초 보임. 같은 줄 연달아 안 나옴
  const NPC_TALK = {};
  function npcTalk(key, near, lines, greet) {
    const s = NPC_TALK[key] || (NPC_TALK[key] = { line: null, until: 0, next: 0, near: false });
    if (near && !s.near && time >= s.next - 7) { s.line = greet ? pick(greet) : pick(lines); s.until = time + 3.2; s.next = time + rand(9, 13); }
    else if (near && time >= s.next) { let l = pick(lines); if (l === s.line && lines.length > 1) l = pick(lines.filter(x => x !== s.line)); s.line = l; s.until = time + 3.2; s.next = time + rand(9, 13); }
    s.near = near;
    return time < s.until ? s : null;
  }
  const BUBBLES = [];
  function drawBubble(text, x, y, side = 0) { BUBBLES.push([text, x, y, side]); }
  function flushBubbles() {
    if (G && G.player && !G.player.dead && P_BUBBLE.until > time && P_BUBBLE.text) {
      drawBubble(P_BUBBLE.text, G.player.x, G.player.y - 38 - (G.player.lift || 0), 0);
    }
    for (const b of BUBBLES) paintBubble(b[0], b[1], b[2], b[3]);
    BUBBLES.length = 0;
  }
  // ---------------------------------------------------------------- [1] 전설 무기 독백·말풍선 데이터 및 렌더러
  const SK_TO_FX = {
    sun: 'bulwark', exec: 'execsword',
    fangs2: 'fangs', nine: 'nine',
    ashstar2: 'ashstar', hourglass: 'hourglass',
    dawn: 'dawn', spear: 'spearrain',
    undertaker: 'undertaker', kingrev: 'kingrev',
  };

  const LEGEND_LORE = {
    // 1. 기사 (인간 / 대검)
    bulwark: {
      cls: 'knight', name: '태양 서약 대검', c: '#ffc040',
      pickupBubble: '…아직 따뜻하네.',
      pickupMono: [
        '자루에 묶인 붉은 천이 잿가루 속에서도 색을 잃지 않았다.',
        '누가 묶어줬는지는 잘 기억나지 않는다.',
        '그래도 손에 쥐니, 오래 식어 있던 금속에서 희미한 온기가 올라온다.',
      ],
      bossBubble: '이 밤도 슬슬 끝낼 때가 됐지.',
      bossIntro: [
        '그 왕관 아래에 남은 불씨가 아직 꺼지지 않았군.',
        '내가 들고 온 이 검이, 길었던 밤을 끝낼 수 있을지 보자.',
      ],
      coronationBubble: '왕관을 고쳐 쓰는 손길이… 어딘가 익숙한데.',
    },
    execsword: {
      cls: 'knight', name: '잿빛 왕의 처형검', c: '#ff7a30',
      pickupBubble: '사슬이 손목에 감기네.',
      pickupMono: [
        '붉은 천 대신 차가운 쇠사슬이 자루에 감겨 있다.',
        '들어 올리자마자 사슬이 손목을 따라 단단히 조여 든다.',
        '처음 보는 검인데도, 손바닥의 굳은살이 자루의 홈에 딱 맞는다.',
      ],
      bossBubble: '거울을 마주 보고 선 기분이네.',
      bossIntro: [
        '네가 짚고 선 홀의 금 간 자국과, 이 검날의 결이 똑같군.',
        '그 투구 안에 누구 얼굴이 들어 있는지는 묻지 않겠다.',
        '집행인은 원래 상대 얼굴을 기억하지 않는 법이니까.',
      ],
      coronationBubble: '아직 끝난 거 아니다.',
    },

    // 2. 어세신 (고양이 수인 / 쌍검)
    fangs: {
      cls: 'ranger', name: '쌍둥이 송곳니', c: '#ff5060',
      pickupBubble: '오래된 피 냄새가 배어 있네.',
      pickupMono: [
        '가드 아래 홈을 따라 검붉은 자국이 희미하게 남아 있다.',
        '그림자 안으로 몸을 숨길 때마다 등 뒤가 서늘하다.',
        '예전에 실패했던 의뢰의 감각이 칼날에 그대로 남아 있는 듯하다.',
      ],
      bossBubble: '이번엔 빗나가지 않아.',
      bossIntro: [
        '등 뒤를 잡는 건 내 쪽이 훨씬 빠르지.',
        '네 목이 이미 한쪽으로 꺾여 있고, 가슴엔 불씨만 남았어도 상관없어.',
        '숨통이 없다면, 그 불씨라도 끄고 갈게.',
      ],
      coronationBubble: '그림자가 겹치네… 빠져나갈 생각 마.',
    },
    nine: {
      cls: 'ranger', name: '아홉 목숨', c: '#a890ff',
      pickupBubble: '아직 한 번쯤은 더 남았겠지.',
      pickupMono: [
        '자루에 박힌 노란 보석이 촛불처럼 희미하게 반짝인다.',
        '허공을 베면 반 박자 늦게 옅은 잔상이 같은 자리를 따라 벤다.',
        '하나, 둘… 여덟. 전부 내가 여기까지 오면서 흘려둔 흔적들이구나.',
      ],
      bossBubble: '이번엔 혼자 온 게 아니야.',
      bossIntro: [
        '여기까지 오는 동안 여덟 번은 쓰러졌던 것 같아.',
        '그때마다 남았던 그림자들이 아직 내 뒤에 남아 있거든.',
        '이번이 아홉 번째야. 더 아껴둘 목숨도 없으니 끝까지 가보자.',
      ],
      coronationBubble: '다들 지켜보고 있어. 이제 그만 끝내자.',
    },

    // 3. 마법사 (여우 수인 / 지팡이)
    ashstar: {
      cls: 'mage', name: '잿빛 별의 홀', c: '#ffb060',
      pickupBubble: '그날 밤 떨어진 별 조각이 아직 뜨겁네.',
      pickupMono: [
        '유리 구슬 안에서 식지 않은 재가 천천히 맴돈다.',
        '왕도 위로 쏟아지던 유성을 이 작은 구슬에 담아보려 했었지.',
        '무리한 계산이었다는 걸… 아직도 식지 않은 이 열기가 말해준다.',
      ],
      bossBubble: '아직 그날 밤에서 못 벗어났군요, 폐하.',
      bossIntro: [
        '왕관에 박힌 세 파편이 내 지팡이의 별과 같은 빛을 내고 있어요.',
        '우리가 지키려던 성은 이미 바닥의 돌조각과 함께 재가 됐는데,',
        '당신도 나도 아직 그 밤에 멈춰 서 있네요.',
      ],
      coronationBubble: '부서진 궤도를 억지로 붙잡아봐야 무너질 뿐이에요.',
    },
    hourglass: {
      cls: 'mage', name: '모래시계 지팡이', c: '#ffd34d',
      pickupBubble: '…결국 이걸 다시 잡게 되네.',
      pickupMono: [
        '금빛 톱니 안쪽에서 모래알이 거꾸로 위를 향해 올라간다.',
        '째깍이는 소리 하나 없이 조용하다.',
        '멸망을 찰나의 시간만큼 미뤄보겠다고 돌렸던 지팡이가, 다시 내 손에 들어왔다.',
      ],
      bossBubble: '멈춘 시간 속에서 우리만 지쳐가네요.',
      bossIntro: [
        '원망해도 할 말은 없어요.',
        '당신이 죽지도 못한 채 왕좌를 지키게 붙들어 둔 건, 시간을 되돌린 내 술식이었으니까.',
        '자, 모래시계를 한 번만 더 뒤집어 볼까요. 미뤄둔 끝이 어떻게 올지.',
      ],
      coronationBubble: '모래가 거꾸로 쏟아져… 예전 일까지 끌어오려는 건가!',
    },

    // 4. 사제 (토끼 수인 / 메이스)
    dawn: {
      cls: 'priest', name: '새벽 성가', c: '#ffe08a',
      pickupBubble: '예전엔 이 빛을 새벽이라 불렀는데…',
      pickupMono: [
        '날개 장식 안쪽의 보석에서 미지근한 온기가 번진다.',
        '깊은 상처를 아물게 하진 못해도, 잠시 통증을 덮어줄 수는 있는 빛.',
        '다들 기도를 멈춘 뒤에도, 이 메이스만은 옛 성가의 가락을 기억하고 있나 보다.',
      ],
      bossBubble: '이제는 편히 쉬실 때가 됐습니다.',
      bossIntro: [
        '성 밖에서 왕비께서 아직도 당신을 기다리며 울고 계셨습니다.',
        '새벽은 오지 않았고 기도는 닿지 않았지만,',
        '지친 그 어깨에 마지막 축복을 올릴 힘 정도는 아직 남아 있습니다.',
      ],
      coronationBubble: '편히 눈을 감는 것조차 허락받지 못하셨군요.',
    },
    spearrain: {
      cls: 'priest', name: '날개 달린 성창', c: '#ff9a8a',
      pickupBubble: '기도만으론 아무도 못 살려요.',
      pickupMono: [
        '날개 장식 아래, 검붉게 물든 붉은 리본이 단단히 묶여 있다.',
        '어느 기사의 검에서 풀려나 내 창에 묶인, 끝내 지키지 못한 약속.',
        '기적이라는 건 기도가 아니라, 누군가의 피로 겨우 이어지는 거라는 걸 이제는 안다.',
      ],
      bossBubble: '그 불씨를 빌려서라도 이 기적을 이어가겠습니다.',
      bossIntro: [
        '저 위로 떨어지는 빛의 창들을 보십시오.',
        '예전처럼 상처를 꿰매던 사제는 성채가 무너지던 날 이미 죽었습니다.',
        '당신 가슴속에 남은 그 불씨를 보태서라도, 꺼지지 않는 성소를 세우겠습니다.',
      ],
      coronationBubble: '더 불러내십시오. 기적이 멈추지 않게.',
    },

    // 5. 거너 (늑대 수인 / 머스킷)
    undertaker: {
      cls: 'gunner', name: '장의사의 머스킷', c: '#7aff9a',
      pickupBubble: '익숙한 나무 냄새네. 내가 짜던 관짝이랑 같아.',
      pickupMono: [
        '개머리판에 박힌 은 못이 손바닥에 서늘하게 닿는다.',
        '왕도의 시신들을 묻을 때 쓰던 연장이, 이제는 총이 되어 어깨에 걸린다.',
        '땅에 묻혀야 할 것들이 걸어 다니니, 장의사가 총을 드는 것도 이상할 건 없지.',
      ],
      bossBubble: '네 치수에 맞는 관은 아직 못 짰는데 말이야.',
      bossIntro: [
        '성문 밖에서 네 근위병들이 아직도 빈 관을 메고 돌아다니더군.',
        '내가 직접 못을 박아 묻어줬던 녀석들인데 말이야.',
        '죽은 사람이 땅 위를 어슬렁거리는 건 질색이야. 이제 그만 누워, 폐하.',
      ],
      coronationBubble: '남의 무덤까지 다 헤집어 놓을 셈인가.',
    },
    kingrev: {
      cls: 'gunner', name: '왕의 연발총', c: '#ffd34d',
      pickupBubble: '…여섯 번째 약실은 아직 비어 있네.',
      pickupMono: [
        '낡은 붉은 손잡이 위로 작은 왕관 문양이 새겨져 있다.',
        '실린더를 돌려 닫자 묵직한 쇠 소리가 손목에 울린다.',
        '내가 정신을 잃으면 여섯 번째 탄환으로 끝내 달라고… 그때 분명 그렇게 말했지.',
      ],
      bossBubble: '약속했던 여섯 발이야. 이번엔 끝내자.',
      bossIntro: [
        '아직 사람의 눈을 하고 있을 때, 네가 내 손에 직접 쥐여준 총이야.',
        '앞의 다섯 발은 네 움직임을 멈추는 데 쓰지.',
        '마지막 여섯 번째 탄환은, 그 왕관을 부수는 데 쓸 거다.',
      ],
      coronationBubble: '실린더 돈다. 비켜, 마지막 한 발 남았어.',
    },
  };

  // 현재 장착 중인 전설 무기의 LEGEND_LORE 키 반환
  function eqLegendKey() {
    if (!G) return null;
    const it = eqWeapon(G.cls);
    if (!it) return null;
    if (it.fx && LEGEND_LORE[it.fx]) return it.fx;
    const sk = wSkill();
    return (sk && SK_TO_FX[sk]) || null;
  }

  // 플레이어 머리 위 도트 말풍선 타이머 상태 (전투 중 단문용)
  const P_BUBBLE = { text: null, until: 0 };
  function sayPlayer(text, dur = 3.8) {
    if (!text) return;
    P_BUBBLE.text = text;
    P_BUBBLE.until = time + dur;
  }

  // 시네마틱 암전 스포트라이트 + 레터박스 시스템 (방식 1)
  function setHudDim(on) {
    const ids = ['party', 'phase', 'bkPanel', 'boss', 'skills', 'keyguide', 'lootFeed', 'gearCmp', 'mute', 'banner', 'tutBar'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.style.transition = 'opacity 0.25s ease';
      el.style.opacity = on ? '0' : '';
      el.style.pointerEvents = on ? 'none' : '';
    }
  }

  function ensureCineBox() {
    let el = document.getElementById('cineBox');
    if (el) return el;
    const ui = document.getElementById('ui');
    if (!ui) return null;
    el = document.createElement('div');
    el.id = 'cineBox';
    el.style.cssText = [
      'position:absolute',
      'left:50%',
      'bottom:26px',
      'transform:translateX(-50%)',
      'width:640px',
      'max-width:92%',
      'text-align:center',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity 0.2s ease',
      'z-index:60',
    ].join(';');
    ui.appendChild(el);
    return el;
  }

  function renderCineBox() {
    const c = G && G.cine;
    const el = ensureCineBox();
    if (!el) return;
    if (!c) { el.style.opacity = '0'; el.innerHTML = ''; return; }
    const line = c.lines[c.idx] || '';
    el.innerHTML = `<div style="font:11px Galmuri9;color:#ffffff;line-height:1.55;letter-spacing:0.2px">${line}</div>`;
    el.style.opacity = '1';
  }

  function startCinematic(lines, title, col = '#ffd34d', focus = 'player', onDone = null) {
    if (!G || !lines || !lines.length) return;
    G.cine = {
      lines: lines.slice(),
      idx: 0,
      title,
      col,
      focus,
      t: 0,
      cd: 0.22,
      click: false,
      onDone,
    };
    for (const k in keys) keys[k] = false;
    for (const k in pressed) pressed[k] = false;
    mouse.down = false; mouse.rdown = false;
    setHudDim(true);
    renderCineBox();
  }

  function endCinematic() {
    if (!G || !G.cine) return;
    const cb = G.cine.onDone;
    G.cine = null;
    for (const k in keys) keys[k] = false;
    for (const k in pressed) pressed[k] = false;
    setHudDim(false);
    renderCineBox();
    if (cb) cb();
  }

  function updateCine(rdt) {
    const c = G && G.cine;
    if (!c) return;
    c.t += rdt;
    c.cd = Math.max(0, c.cd - rdt);
    const esc = take('escape');
    const next = take(' ') || take('f') || take('enter') || take('j') || c.click;
    c.click = false;
    if (c.cd > 0) return;
    if (esc) { sfx('blip'); endCinematic(); return; }
    if (next) {
      sfx('blip');
      if (c.idx < c.lines.length - 1) {
        c.idx++;
        c.cd = 0.16;
        renderCineBox();
      } else {
        endCinematic();
      }
    }
  }

  // 2px 도트 격자 기반 4x4 바이어 디더 원형 스포트라이트 (맵 전체 완전 블랙)
  const CINE_B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let CINE_CV = null, CINE_CTX = null, CINE_IM = null;
  function drawCinematic() {
    const c = G && G.cine;
    if (!c) return;
    const k = Math.min(1, c.t / 0.24);
    const cw = VW >> 1, ch = VH >> 1; // 384 x 216 (2px 도트 단위)
    if (!CINE_CV) {
      CINE_CV = document.createElement('canvas');
      CINE_CV.width = cw; CINE_CV.height = ch;
      CINE_CTX = CINE_CV.getContext('2d');
      CINE_IM = CINE_CTX.createImageData(cw, ch);
    }
    const P = G.player;
    const px = (P ? P.x - cam.x : VW / 2) * 0.5;
    const py = (P ? P.y - 14 - cam.y : VH / 2) * 0.5;
    const B = G.boss && !G.boss.dead && c.focus === 'both' ? G.boss : null;
    const bx = B ? (B.x - cam.x) * 0.5 : px;
    const by = B ? (B.y - 24 - cam.y) * 0.5 : py;
    const rP = 34 * k + (1 - k) * 180; // 플레이어 스포트라이트 반경 (2px 셀 기준)
    const rB = 46 * k + (1 - k) * 180; // 보스 스포트라이트 반경
    const feather = 18;
    const d = CINE_IM.data;
    for (let y = 0; y < ch; y++) {
      const y4 = (y & 3) << 2;
      const dyP = y - py, dyB = y - by;
      for (let x = 0; x < cw; x++) {
        const dxP = x - px;
        let light = 1 - (Math.hypot(dxP, dyP) - (rP - feather)) / feather;
        if (B) {
          const dxB = x - bx;
          const lB = 1 - (Math.hypot(dxB, dyB) - (rB - feather)) / feather;
          if (lB > light) light = lB;
        }
        light = light < 0 ? 0 : light > 1 ? 1 : light;
        // 4x4 바이어 디더: 빛이 닿는 원 안쪽은 투명(0), 바깥쪽은 완전 블랙(255)
        const thr = (CINE_B4[y4 | (x & 3)] + 0.5) / 16;
        const a = light > thr ? 0 : Math.round(255 * k);
        const idx = (y * cw + x) << 2;
        d[idx] = 0; d[idx + 1] = 0; d[idx + 2] = 0; d[idx + 3] = a;
      }
    }
    CINE_CTX.putImageData(CINE_IM, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(CINE_CV, 0, 0, VW, VH);
    ctx.restore();
  }

  // (A) 전설 무기 최초 습득 트리거 -> 시네마틱
  function triggerLegendPickup(it) {
    if (!it || it.grade !== 'legend') return;
    const fxKey = (it.fx && LEGEND_LORE[it.fx]) ? it.fx : (it.wk != null && it.cls ? (wcat(it.cls)[it.wk] || {}).fx : null);
    const L = fxKey && LEGEND_LORE[fxKey];
    if (!L) return;
    G.seenLegendLore = G.seenLegendLore || {};
    if (G.seenLegendLore[fxKey]) return;
    G.seenLegendLore[fxKey] = true;
    startCinematic(L.pickupMono, `${CLASSES[L.cls].n} · ${L.name}`, L.c, 'player', () => {
      sayPlayer(L.pickupBubble, 3.5);
    });
  }

  // (B) 4장 잿빛 왕 조우 트리거 -> 시네마틱 (플레이어 + 왕 스포트라이트)
  function triggerAshKingIntro() {
    const fxKey = eqLegendKey(), L = fxKey && LEGEND_LORE[fxKey];
    if (!L) return;
    startCinematic(L.bossIntro, `대관식장 대면 · ${L.name}`, L.c, 'both', () => {
      sayPlayer(L.bossBubble, 3.8);
    });
  }

  // (C) 4장 잿빛 왕 2단계 『대관식』 전환 트리거 -> 전투 중이므로 짧은 말풍선만 유지
  function triggerAshKingCoronation() {
    const fxKey = eqLegendKey(), L = fxKey && LEGEND_LORE[fxKey];
    if (!L) return;
    sayPlayer(L.coronationBubble, 4.0);
  }

  // (D) v2.55 처치 직후 무기별 시네마틱 「왕관의 잔향」 폐기 — 엔딩은 무기와 상관없이 하나
  // v2.93 말끝의 ♪는 글꼴에 없어서 2px 칸 도트 음표로 그린다
  const NOTE_G = ['..kkk', '..k.k', '..k..', 'kkk..', 'kkk..'];
  function paintBubble(text, x, y, side) { // (x, y) = 꼬리 끝. side 0: 몸통이 위, 꼬리 아래로 / side -1: 몸통이 왼쪽, 꼬리 오른쪽으로
    const note = text.endsWith('♪'); if (note) text = text.slice(0, -1);
    ctx.font = '10px Galmuri9'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const tw = Math.ceil(ctx.measureText(text).width) + (note ? 14 : 0), w = (tw + 14) & ~1, h = 16, X = Math.round(x) & ~1, Y = Math.round(y) & ~1;
    const bx = side < 0 ? X - 6 - w : (X - (w >> 1)) & ~1, by = side < 0 ? Y - 8 : Y - h - 6;
    ctx.fillStyle = '#0b0a0e'; ctx.fillRect(bx + 2, by - 2, w - 4, h + 4); ctx.fillRect(bx, by, w, h); ctx.fillRect(bx - 2, by + 2, w + 4, h - 4); // 외곽선(모서리 깎음)
    ctx.fillStyle = '#f4ead2'; ctx.fillRect(bx + 2, by, w - 4, h); ctx.fillRect(bx, by + 2, w, h - 4);
    ctx.fillStyle = '#d8c8a4'; ctx.fillRect(bx + 2, by + h - 2, w - 4, 2); // 아래 그늘
    if (side < 0) { // 오른쪽 꼬리
      const ty = by + 4; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(bx + w, ty - 2, 2, 8); ctx.fillRect(bx + w + 2, ty, 2, 4); ctx.fillRect(bx + w + 4, ty + 2, 2, 2);
      ctx.fillStyle = '#f4ead2'; ctx.fillRect(bx + w - 2, ty, 4, 4);
    } else {
      const tx = X - 2; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(tx - 2, by + h, 8, 2); ctx.fillRect(tx, by + h + 2, 4, 2); ctx.fillRect(tx + 2, by + h + 4, 2, 2);
      ctx.fillStyle = '#d8c8a4'; ctx.fillRect(tx, by + h, 4, 2); ctx.fillStyle = '#f4ead2'; ctx.fillRect(tx, by + h - 2, 4, 2);
    }
    ctx.fillStyle = '#2a1e18'; fillTextW(text, bx + w / 2 - (note ? 7 : 0), by + 12);
    if (note) { const nx = (bx + w - 18) & ~1, ny = by + 3; NOTE_G.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === 'k') ctx.fillRect(nx + i * 2, ny + j * 2, 2, 2); }); }
  }
  function drawPriceTag(price, x, y, ok) { // 동전 + 가격, 어두운 판 (y = 판 위쪽)
    ctx.font = '10px Galmuri9'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const t = String(price), tw = Math.ceil(ctx.measureText(t).width), w = (tw + 20) & ~1, h = 14, bx = (Math.round(x) - (w >> 1)) & ~1, by = Math.round(y) & ~1;
    ctx.fillStyle = '#0b0a0e'; ctx.fillRect(bx, by - 2, w, h + 4); ctx.fillRect(bx - 2, by, w + 4, h);
    ctx.fillStyle = ok ? '#2a2018' : '#2a1416'; ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = ok ? '#4a3a26' : '#4a2226'; ctx.fillRect(bx, by, w, 2);
    const cx = bx + 4, cy = by + 3; // 동전 8x8
    ctx.fillStyle = ok ? '#8a5a10' : '#5a4040'; ctx.fillRect(cx + 2, cy, 4, 8); ctx.fillRect(cx, cy + 2, 8, 4);
    ctx.fillStyle = ok ? '#ffd34d' : '#9a7a7a'; ctx.fillRect(cx + 2, cy, 4, 6); ctx.fillRect(cx, cy + 2, 6, 2);
    ctx.fillStyle = ok ? '#fff0b0' : '#c0a8a8'; ctx.fillRect(cx + 2, cy + 2, 2, 2);
    ctx.fillStyle = ok ? '#ffe08a' : '#ff7a6a'; fillTextW(t, bx + 15, by + 11);
  }
  // 상인 「살구」(왕관앵무): 계산대 뒤에 서서 숨 쉬듯 들썩이고, 볏이 흔들리고, 펼친 날개를 이따금 두 번 퍼덕이고, 눈을 깜빡인다
  function drawShopKeeper(R) {
    const x = ((R.keeper ? R.keeper.x : CX) + 2) & ~1, y = ((R.keeper ? R.keeper.y - 8 : CY - 30)) & ~1, bob = Math.floor(time * 1.5) % 2 ? 2 : 0;
    const ph = time % 2.6, wing = ph < 0.6 && Math.floor(ph * 6.67) % 2 === 0, crest = Math.floor(time * 1.4) % 2 === 1, blink = time % 3.7 < 0.15;
    const m = merchantArt(wing, crest, blink);
    ctx.drawImage(m, x - 18, y - m.height + 2 - bob); // 몸통 가운데가 x에 오게 (펼친 날개는 오른쪽으로)
    const P = G.player, sy = npcTalk('merchant', P && Math.hypot(P.x - x, P.y - y) < 120, ['싸게 줄게', '골라 봐', '이건 귀한 물건이야', '외상은 안 돼', '살아남으려면 사 둬'], ['어서 와♪', '살구의 비밀상점이야♪']);
    if (sy) drawBubble(sy.line, x, y - m.height + 6 - bob);
  }
  function drawShopItem(s) {
    const x = Math.round(s.x) & ~1, y = Math.round(s.y) & ~1, st = srArt('stand', G.stage, SR.stand); // v1.11 천 덮인 진열대
    ctx.fillStyle = 'rgba(0,0,0,.3)'; { const xa = x - st.width / 2 + 4, xb = x + st.width / 2 - 4; if (xb > xa) ctx.fillRect(xa, y + 2, Math.ceil((xb - xa) / 2) * 2, 2); }
    ctx.drawImage(st, x - st.width / 2, y - st.height + 4);
    if (s.sold) return;
    const by = (y - st.height + 8 + (Math.floor(time * 2 + x) % 2 ? 0 : -2)) & ~1;
    if (s.k === 'gear') { const g = art('gearbox2', () => gCanvas(GEARBOX, GEARBOX_PAL)), gx = x - g.width / 2, gy = by - g.height + 4; ctx.drawImage(g, gx, gy); const ph = Math.floor(time * 3 + x) % 6; if (ph < 2) { ctx.fillStyle = '#fffbe6'; const sx = gx + (ph ? 26 : 4), sy = gy + (ph ? 14 : 4); ctx.fillRect(sx, sy, 2, 2); ctx.globalAlpha = 0.6; ctx.fillRect(sx - 2, sy, 2, 2); ctx.fillRect(sx + 2, sy, 2, 2); ctx.fillRect(sx, sy - 2, 2, 2); ctx.fillRect(sx, sy + 2, 2, 2); ctx.globalAlpha = 1; } } // v2.38 반짝임
    else if (s.k === 'iron') { const g = art('ironore', () => gCanvas(IRONORE, IRONORE_PAL)); ctx.drawImage(g, x - g.width / 2, by - g.height + 4); }
    else { const L = LOOT[s.k]; drawSprite(L.map, L.pal || 'loot', L.sc, x, by + 4, false); }
    { const pr = hasRelic('twincoin') && G.freeBuy !== G.stage ? Math.ceil(s.price / 2) : s.price; drawPriceTag(pr, x, y + 8, G.gold >= pr); } // v1.10 가격표 · v2.29 쌍둥이 동전 반값 표시
  }
  const PROP_MAPS = {
    goblinStatue: [[".....kkkkkk.....", "....k23aaaak....", ".kkka111111a1kk.", ".k221e111e1123k.", "...kka22211kk...", ".....kka1kk.....", "....k2222223k...", "...ka2322321k...", "..ka.k2323k.ak..", "..k2.k2233k.2k..", "..kk.k3333k.kk..", ".....k3k.k3k....", "....kk3k.k3kk...", "kkkkkkkkkkkkkkkk", "ka1111111111123k", "k23222222222324k", ".kkkkkkkkkkkkkk.", ".k123222222234k.", ".k122223323334k.", "kkkkkkkkkkkkkkkk", "k44444444444444k", "kkkkkkkkkkkkkkkk"], {"k": "#0b0a0e", "a": "#bcb6c4", "1": "#9a94a4", "2": "#706a80", "3": "#4c4758", "4": "#2e2a36", "e": "#1a1820", "M": "#5a8a34", "m": "#34522a"}], // v2.77 고블린 몬스터 도트를 그대로 돌로 깎은 석상 + 돌 받침 (2장 성채)
    armor: [["......krRk......", ".....krrRRk.....", "......kkkk......", ".....k1a13k.....", "....kkk13kkk....", "...k1a111223k...", "..k1a12222223k..", "..k3333333334k..", "..k4444444444k..", "..k1222422223k..", "...kk12k2233k3k.", ".kk1112a22k33kk.", "k1a111ka2k22233k", "k1122k1a23k2233k", ".k12k1aa233k23k.", "..kkaaaa22222k3k", "..k4122232234kk.", "..k4122232334k..", "..k4122232334k..", "...kkkkopkkkk...", "......kopk......", "......kopk......", "......kopk......", ".....kkkkkk.....", "...kkooopppkk...", "..kPPkkkkkkPPk.."], {"k": "#0b0a0e", "a": "#d8d4e0", "1": "#a8a4b4", "2": "#7c7890", "3": "#56526a", "4": "#34303e", "r": "#a8382a", "R": "#6e2018", "o": "#b07c44", "p": "#83592f", "P": "#5c3c20"}], // v2.77 근위기사와 같은 비율의 빈 갑옷 + 나무 받침대 (외곽선 1칸)
    brazier: [["...o..O...", "..oOyoOo..", ".OoyyyoOO.", "kOryyyyrOk", "kGGGGGggdk", ".kgggggdk.", "..kgggdk..", "...kgdk...", "...kgdk...", "..kggddk..", ".kkkkkkkk."], {"k": "#0b0a0e", "G": "#7a7488", "g": "#4e4a5a", "d": "#2e2a36", "o": "#ffd060", "O": "#ff8a2a", "r": "#c03018", "y": "#fff0b0"}],
    candelabra: [[".o...o...o.", ".y...y...y.", "kWk.kWk.kWk", "kWk.kWk.kWk", "kgkkkgkkkgk", ".kgggggggk.", "....kgk....", "....kgk....", "....kgk....", "....kgk....", "....kgk....", "...kgggk...", "..kgggddk..", "..kkkkkkk.."], {"k": "#0b0a0e", "G": "#7a7488", "g": "#4e4a5a", "d": "#2e2a36", "o": "#ffd060", "O": "#ff8a2a", "r": "#c03018", "y": "#fff0b0", "W": "#e8e0c8"}],
    bookshelf: [["WWWWWWWWWWWWWWWWWWWWWW", "BwwwwwwwwwwwwwwwwwxxbB", "BPPPPPPPPPPPPPPPPPxxbB", "BPPPPPPPHhhPPPPPPxVPbB", "BUuVvvNnHhhvVvvPVvVPbB", "BUuVvvNnHhhvVvvvVvVPbB", "BwwwwwwwwwbbbbbbbbbbbB", "BPPPPPPPPPPPPPPPPPPPbB", "BHhhQqUuVvvPPPPPVvPPbB", "BHhhQqUuVvvUuXxxVvVPbB", "BHhhHHUuVvvUuDxDVvHPbB", "BHhhQqUuVvvUuXDxVvVPbB", "BwwwwwwwwwbbbbbbbbbbbB", "BPPPPPPPPPPPPPPPPPPPbB", "BQqPPPPPPVvvPPPPPPPPbB", "BHHvUuVvPVvvQqqPNnnPbB", "BQqvUuVvvVvvQqqvNnnPbB", "BwwwwwwwwwbbbbbbbbbbbB", "BBBBBBBBBBBBBBBBBBBBBB"], {"k": "#0b0a0e", "W": "#c09060", "w": "#9a7048", "b": "#74522f", "B": "#523822", "P": "#3a2614", "X": "#ece4d0", "x": "#bcb2a0", "z": "#7a7262", "D": "#1a1418", "q": "#7a2430", "Q": "#a83a46", "n": "#2e4e30", "N": "#4a7a4a", "u": "#30346a", "U": "#4e5aa0", "h": "#8a6420", "H": "#c89a40", "v": "#4a2450", "V": "#74407a"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    chairBroken: [[".kwkkkbk.....", ".kWWWWWk.....", ".kwkkkbk.....", ".kwkkkbk.....", ".kwwwwwk.....", ".kwkkkbk.....", ".kwkkkbk.....", "kWWWWWWkkkkk.", "kwwwwwwwwwwwk", ".kwkkkbbbbbbk", ".kbk.kBkkkkk.", ".kbk..kBkkkBk", ".kbk...kkbBBk"], {"k": "#0b0a0e", "W": "#c09060", "w": "#9a7048", "b": "#74522f", "B": "#523822", "P": "#3a2614"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    table: [["...kok........kkkk....", "...kXxk......kGgggk...", "kkkkXxkkkkkkkkGggkkkkk", "WWWWWWWWWWWWWWWWWWWWWW", "wwwwwwwBwwwwwwBwwwwwww", "wwwwwwwBwwwwwwBwwwwwww", "kbbbbbbbbbbbbbbbbbbbbk", "kBBBBBBBBBBBBBBBBBBBBk", ".kbPkkkkkkkkkkkkkkkbPk", ".kbPk.............kbPk", ".kbPk.............kbPk", ".kbPk.............kbPk", ".kbPk.............kbPk"], {"k": "#0b0a0e", "W": "#c09060", "w": "#9a7048", "b": "#74522f", "B": "#523822", "P": "#3a2614", "X": "#ece4d0", "x": "#bcb2a0", "z": "#7a7262", "a": "#c4c0d0", "G": "#8e889c", "g": "#615c72", "d": "#3e3a4a", "D": "#26222e", "o": "#ffd060"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    cage: [["....kkkkk....", "...kGgggdk...", "..kkkkkkkkk..", "..kG.g.g.dk..", "..kG.g.g.dk..", "..kG.g.W.dk..", "..kG.gWWdd k.", "..kG.g.W.dk..", "..kGkgkgkdk..", "..kkkkkkkkk.."], {"k": "#0b0a0e", "G": "#7a7488", "g": "#4e4a5a", "d": "#2e2a36", "o": "#ffd060", "O": "#ff8a2a", "r": "#c03018", "y": "#fff0b0", "W": "#d8d0c0"}],
    tapestry: [["kkkkkkkkkkkk", "kbbbbbbbbbbk", "kRRRRRRRRRRk", "kRyyyyyyyyRk", "kRyRRRRRRyRk", "kRyRRYYRRyRk", "kRyRYrrYRyRk", "kRyRRYYRRyRk", "kRyRRYYRRyRk", "kRyRRRRRRyRk", "kRyyyyyyyyRk", "kRRRRRRRRRRk", "kRRRRRRRRRRk", "kRkRkRkRkRkk", "k.k.k.k.k.k."], {"k": "#0b0a0e", "r": "#6a1018", "R": "#9a1c28", "y": "#c9a24a", "Y": "#e8c860", "p": "#3a1a48", "P": "#5a2a6a", "b": "#3a3036"}],
    shieldSwords: [["kW............Wk", ".kW..kkkkkk..Wk.", "..kWkYyyyyykWk..", "...kWRRrrRWyk...", "...kyWRrrWryk...", "...kyRWrWRryk...", "...kyRRWRRryk...", "...kyRWrWRryk...", "....kyRrrRyk....", "...kWkyRRyk.k...", "..kW..kyyk..Wk..", ".kW....kk....Wk.", "kk............kk"], {"k": "#0b0a0e", "W": "#d0ccd8", "G": "#9a94a8", "g": "#66627a", "r": "#8a1c28", "R": "#b82a38", "y": "#c9a24a", "Y": "#e8c860"}],
    portrait: [["kkkkkkkkkkkk", "kYyyyyyyyyYk", "kyddddddddyk", "kydddSSSddyk", "kyddSsssSdyk", "kyddsrssrsyk", "kyddSsssSdyk", "kydddSssSdyk", "kydDDDsDDDyk", "kyDDDDDDDDyk", "kyDDDDDDDDyk", "kYyyyyyyyyYk", "kkkkkkkkkkkk"], {"k": "#0b0a0e", "y": "#a8822e", "Y": "#e0b850", "d": "#1a1620", "D": "#2a2232", "s": "#8a6a5a", "S": "#5a4038", "r": "#ff3040"}],
    chains: [[".kaggk..kaggk.", ".kaggk..kaggk.", "..kak....kak..", ".kaDgk..kaDgk.", ".kGDdk..kGDdk.", "..kgk....kgk..", "..kGk....kGk..", "..kak....kak..", ".kaDgk..kaDgk.", ".kGDdk..kGDdk.", "..kgk....kgk..", "..kGk....kGk..", "..kak....kak..", ".kaDgk..kaDgk.", ".kGDdk..kGDdk.", "..kgk....kgk..", "..kGk....kGk.."], {"k": "#0b0a0e", "a": "#c4c0d0", "G": "#8e889c", "g": "#615c72", "d": "#3e3a4a", "D": "#26222e"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    skullNiche: [["...kkkkkk...", "..kllllllk..", ".klDDDDDDlk.", "klDDDDDDDDlk", "klDDkkkkDDlk", "klDkWWWWkDlk", "klDWkWWkWDlk", "klDWWwwWWDlk", "klDkWkWkWDlk", "klllllllllk.", "kkkkkkkkkkk."], {"k": "#0b0a0e", "D": "#100c14", "d": "#2a2632", "W": "#d8d0c0", "w": "#a49c8e", "o": "#ffd060", "y": "#fff0b0", "l": "#4a4554"}],
    signpost: [["..................", ".......kkk........", ".kkkkkkWwbkkkkk...", "kWMMWWWWWWWWWWWk..", "kwwwwwwwwwwwwwwwk.", "kwwBBBBBwwBBBwwwwk", "kwwwwwwwwwwwwwwwk.", "kbbbbbbbbbbbbbbk..", ".kkkkkkWwbkkkkkk..", ".kwwwwwwwwwwwwMMk.", "kbbbbbbbbbbbbbbbk.", "bbbbbBBBBbbBBBBbk.", "kbbbbbbbbbbbbbbbk.", ".kBBBBBBBBBBBBBBk.", "..kkkkkWwbkkkkkk..", ".....kkWwbkkmk....", "....kmkWwbkMk.....", "...kMMmMMmMMmk...."], {"k": "#0b0a0e", "W": "#c09060", "w": "#9a7048", "b": "#74522f", "B": "#523822", "P": "#3a2614", "m": "#3e6a2c", "M": "#6a9a44"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    campfire: [["...kkkkkk...", ".kkGgcCcgkk.", "kGgcCwoCcGdk", "kgcwCOowCcdk", "kgcCcoCcwcdk", ".kkgdccdgkk.", "...kkkkkk..."], {"k": "#0b0a0e", "G": "#9a94a4", "g": "#6a6474", "d": "#3a3644", "c": "#1a1410", "C": "#2a2018", "o": "#ff8a2a", "O": "#ffd060", "w": "#6a4a30"}],
    deerSkull: [["kW.......Wk", ".kW.k.k.Wk.", "..kWWkWWk..", "...kWWWk...", "..kWWWWwk..", "..kWkWkwk..", "...kWWwk...", "...kwWwk...", "....kwk....", "....kk....."], {"k": "#0b0a0e", "W": "#e0d8c8", "w": "#a8a090", "d": "#5a5448"}],
    ruinPillar: [["........k......", ".......k1k.....", "....kkka31k....", "...kamk1341k...", "..kam3a1442k...", "..ka13114221k..", "..ka131142231k.", "..ka131142232k.", "..ka131442232k.", "..ka131432232k.", "..kM131142232k.", "..km131132232k.", "..kam31132232k.", "..km131132232k.", "..ka131132232k.", "..ka131132M32k.", ".k111Mm1111M11k", ".k333333333333k", "k22333333333333", ".kkkkkkkkkkkk33"], {"k": "#0b0a0e", "a": "#bcb6c4", "1": "#9a94a4", "2": "#76708a", "3": "#55506a", "4": "#38344a", "m": "#3e6a2c", "M": "#6a9a44"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
    wheel: [[".....kkkkkkk.....", "...kkGGWWWGGkk...", "..kGWwkkkkkWWGk..", ".kGWkkwk.kkkkWGk.", "kGWk.kwwkbbk.kWGk", "kGWkkkkWPBkkkkWGk", "kgbbbbbWBBwwwwbgk", "kgbkkkkbkbbkkkbgk", ".kgbkkbk.kbkkbgk.", "..kgbbkkkkkbbgk..", ".kmkkggbbbggkkmk.", "kMkMkkkkkkkkkMkMk"], {"k": "#0b0a0e", "W": "#c09060", "w": "#9a7048", "b": "#74522f", "B": "#523822", "P": "#3a2614", "a": "#c4c0d0", "G": "#8e889c", "g": "#615c72", "d": "#3e3a4a", "D": "#26222e", "m": "#3e6a2c", "M": "#6a9a44"}], // v2.79 시설물 정비 C (외곽선 1칸 · 왼쪽 위 빛)
  };
  // ================================================================ 방 꾸미기 (v0.26) — 초원은 숲 느낌, 성채는 고성 느낌의 소품을 방마다 무작위로
  // 서 있는 소품: r=충돌 반지름(없으면 밟고 지나감), w/h=사각 충돌, light=빛, flame=불꽃 위치(칸)
  const PROPS = {
    goblinStatue: { r: 12, foot: 2 }, armor: { r: 9, foot: 2 }, brazier: { r: 9, foot: 2, light: { r: 90, c: '255,150,60', ca: 0.2, dy: -18 }, flame: [[3, 0], [5, 0], [7, 0]] },
    candelabra: { r: 7, foot: 2, light: { r: 60, c: '255,190,90', ca: 0.14, dy: -26 }, flame: [[1, 0], [5, 0], [9, 0]] },
    bookshelf: { w: 34, h: 10, foot: 2 }, table: { w: 30, h: 8, foot: 2 }, chairBroken: { foot: 2 }, cage: { r: 11, foot: 2 },
    ruinPillar: { r: 10, foot: 2 }, signpost: { r: 4, foot: 2 },
    smileFlower: { r: 6, anim: 'flower' }, meatPole: { r: 5, anim: 'meat' }, breathHeap: { r: 12, anim: 'heap' }, ashCitizen: { r: 8, anim: 'citizen' }, // v1.52
    poolM: { w: 38, h: 18, pit: true }, poolL: { w: 64, h: 32, pit: true }, poolXL: { w: 92, h: 46, pit: true },
  };
  // ================================================================ v1.23 STAGE 4 왕도 오브젝트 — 2px 칸 · 검은 외곽선 · 왼쪽 위 빛 · 윗면에 재가 쌓임
  const STONE4 = Object.assign({}, STONE, { a: '#bdb7ab', A: '#8e887e', m: '#8e887e', M: '#a8a296' });
  // 윗면 재 더께: 열마다 맨 위 칸부터 1~2칸을 재 색으로, 윗면 안쪽에도 디더로 재
  function ashCap(g, topRows = 0) {
    const H0 = g.length, W0 = g[0].length, SH = 'HhlLdD';
    for (let x = 0; x < W0; x++) { let y = 0; while (y < H0 && (g[y][x] === '.' || g[y][x] === 'k')) y++; if (y >= H0) continue;
      const n = Math.random() < 0.6 ? 2 : 1; for (let j = 0; j < n && y + j < H0; j++) if (SH.includes(g[y + j][x])) g[y + j][x] = j ? 'A' : 'a'; }
    const ph = rand(0, 6); for (let y = 1; y <= topRows; y++) for (let x = 1; x < W0 - 1; x++) { const v = 0.5 + 0.5 * Math.sin(x * 0.45 + ph) * Math.cos(y * 0.6 + ph * 0.7); if ('hlLdD'.includes(g[y][x]) && v > 0.62 && dith(x, y, (v - 0.55) * 2.2)) g[y][x] = v > 0.85 ? 'a' : 'A'; }
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) if (g[y][x] === 'm') g[y][x] = 'A'; else if (g[y][x] === 'M') g[y][x] = 'a';
    return g;
  }
  // 녹아내린 옛 왕의 동상: 받침 위 망토 두른 왕, 왕관·왕홀, 아래로 흘러내린 자국
  const KING4 = { k: '#0b0a09', h: '#a49e94', l: '#7c766e', d: '#56524c', D: '#3a3732', a: '#c4beb2', A: '#948e84', g: '#c8a850', G: '#8a7034', e: '#2a2622', c: '#24221e' };
  function genMeltKing() {
    const W0 = 19, H0 = 30, g = mkGrid(W0, H0), cx = 9;
    const sh = (x, c0, w) => { const t = (x - (c0 - w)) / (2 * w + 0.001); return t < 0.22 ? 'h' : t < 0.55 ? 'l' : t < 0.82 ? 'd' : 'D'; };
    // 받침
    for (let y = 23; y <= 28; y++) for (let x = 1; x <= 17; x++) g[y][x] = y === 23 ? 'h' : y === 28 ? 'D' : y === 24 ? 'D' : x <= 4 ? 'l' : x >= 14 ? 'D' : 'd';
    for (let x = 3; x <= 15; x += 4) g[26][x] = 'c';
    // 망토(사다리꼴) — 아래로 갈수록 넓고, 끝단이 흘러내림
    for (let y = 8; y <= 22; y++) { const w = Math.round(3 + (y - 8) * 0.3); for (let x = cx - w; x <= cx + w; x++) g[y][x] = sh(x, cx, w); }
    for (let i = 0; i < 6; i++) { const x = randi(cx - 6, cx + 6), L = randi(1, 4); for (let j = 0; j < L; j++) if (g[23 + j]) g[23 + j][x] = j === L - 1 ? 'D' : 'd'; }
    // 어깨 · 팔(가슴에 모은 손)
    for (let x = cx - 4; x <= cx + 4; x++) g[8][x] = x < cx ? 'h' : 'l';
    g[12][cx - 1] = 'h'; g[12][cx] = 'l'; g[13][cx - 1] = 'l'; g[13][cx] = 'd';
    // 머리 (한쪽이 녹아 흘러내림)
    for (let y = 4; y <= 7; y++) for (let x = cx - 2; x <= cx + 2; x++) g[y][x] = x === cx - 2 ? 'h' : x === cx + 2 ? 'D' : x < cx ? 'l' : 'd';
    g[7][cx + 2] = '.'; g[8][cx + 3] = 'd'; g[9][cx + 4] = 'D';
    g[5][cx - 1] = 'e'; g[5][cx + 1] = 'e'; g[7][cx] = 'c';
    // 왕관
    for (let x = cx - 2; x <= cx + 2; x++) { g[3][x] = x === cx + 2 ? 'G' : 'g'; }
    for (const x of [cx - 2, cx, cx + 2]) g[2][x] = 'g'; g[1][cx] = 'g';
    // 왕홀 (오른손)
    for (let y = 6; y <= 20; y++) g[y][cx + 6] = y === 6 ? 'g' : 'G';
    g[5][cx + 6] = 'g'; g[5][cx + 5] = 'G'; g[5][cx + 7] = 'G'; g[4][cx + 6] = 'g';
    for (let y = 13; y <= 14; y++) { g[y][cx + 5] = 'l'; }
    // 금
    let x0 = randi(cx - 2, cx + 2), y0 = 10; for (let i = 0; i < 6; i++) { if ('hldD'.includes(g[y0][x0])) g[y0][x0] = 'c'; x0 += randi(-1, 1); y0++; }
    ashCap(g); return gOutline(g);
  }
  // 떨어져 깨진 종: 옆으로 누운 청동 종, 입구는 오른쪽, 금이 가고 윗면엔 재
  const BELL4 = { k: '#0b0806', h: '#c8a060', l: '#94723e', d: '#64492a', D: '#3e2c18', K: '#140e08', v: '#5e7e6a', V: '#3e5a4c', c: '#1a120a', a: '#c4beb2', A: '#948e84' };
  function genBell(r) {
    const L = Math.max(14, Math.round(r * 1.25)), R0 = Math.max(7, Math.round(r * 0.62)), W0 = L + 5, H0 = Math.round(R0 * 1.5) + 6, g = mkGrid(W0, H0), cy = Math.round(H0 / 2) - 1;
    for (let x = 0; x < L; x++) { const t = x / (L - 1), rad = R0 * (0.5 + 0.5 * Math.pow(t, 1.6)) + (t > 0.9 ? 1 : 0), ry = rad * 0.72;
      for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) { const v = (y - (cy - ry)) / (2 * ry); g[y][x + 2] = v < 0.22 ? 'h' : v < 0.55 ? 'l' : v < 0.82 ? 'd' : 'D'; }
      if (x % 5 === 2 && t > 0.15 && t < 0.85) for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) if (g[y][x + 2] !== 'h') g[y][x + 2] = 'D'; // 띠
    }
    // 입구 (오른쪽 끝 안쪽 어둠)
    { const rad = R0 + 1, ry = rad * 0.72; for (let y = Math.ceil(cy - ry + 1); y <= cy + ry - 1; y++) { g[y][L] = 'K'; if (Math.abs(y - cy) < ry - 2) g[y][L - 1] = 'K'; } }
    // 꼭지 고리 (왼쪽)
    for (let y = cy - 2; y <= cy + 2; y++) g[y][1] = y === cy - 2 ? 'h' : 'd'; g[cy - 1][0] = 'l'; g[cy + 1][0] = 'D';
    // 녹청 · 금
    for (let i = 0; i < L * 0.8; i++) { const x = randi(3, L), y = randi(cy - 3, cy + 3); if ('ld'.includes(g[y][x])) g[y][x] = Math.random() < 0.5 ? 'v' : 'V'; }
    let x0 = L - 1, y0 = cy - 2; for (let i = 0; i < L * 0.55; i++) { if (g[y0] && 'hldDvV'.includes(g[y0][x0])) g[y0][x0] = 'c'; x0--; y0 += randi(-1, 1); y0 = clamp(y0, 1, H0 - 2); }
    ashCap(g, 0); return gOutline(g);
  }
  // 재에 묻힌 마차: 판자 짐칸(윗면) + 앞면 바퀴 둘, 짐칸 위로 재가 수북
  const CART4 = { k: '#0b0806', h: '#8a7a64', l: '#66584a', d: '#463c32', D: '#2c2620', w: '#a49a8a', W: '#5a5248', c: '#1a1612', a: '#c4beb2', A: '#948e84', e: '#ff7a30' };
  function genCart(wc, hc) {
    const HH = 9, W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0);
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) g[y][x] = (x - 1) % 5 === 4 ? 'D' : x === 1 ? 'h' : y === 1 ? 'h' : (x + y) % 7 ? 'l' : 'd';
    for (let x = 1; x <= wc; x++) { g[1][x] = 'h'; g[hc][x] = 'd'; g[hc + 1][x] = 'D'; }
    for (let y = hc + 2; y <= hc + HH - 2; y++) for (let x = 1; x <= wc; x++) g[y][x] = (y - hc) % 3 === 0 ? 'D' : x === 1 ? 'l' : 'd';
    // 바퀴 둘
    for (const wx of [Math.round(wc * 0.22), Math.round(wc * 0.78)]) { const wy = hc + HH - 3, R = Math.min(4, Math.max(3, Math.round(HH / 2.4)));
      for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y); if (d > R + 0.3) continue; const X = wx + x, Y = wy + y; if (!g[Y] || X < 1 || X > wc) continue;
        g[Y][X] = d > R - 0.8 ? (x + y < 0 ? 'w' : 'W') : d < 1 ? 'W' : (x === 0 || y === 0) ? 'W' : 'c'; } }
    // 부러진 끌채
    for (let i = 0; i < 4 && wc > 8; i++) if (g[hc + 3]) g[hc + 3][Math.min(wc, 2 + i)] = 'W';
    // 재 더미: 짐칸 위로 둔덕
    const mx = rand(wc * 0.3, wc * 0.7), mr = rand(wc * 0.3, wc * 0.5);
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) { const q = Math.hypot((x - mx) / mr, (y - hc / 2) / (hc * 0.6)); if (q < 1 && dith(x, y, (1 - q) * 0.9)) g[y][x] = q < 0.35 && (x + y) % 2 ? 'a' : 'A'; }
    if (Math.random() < 0.5) { const x = randi(2, wc - 1); if (g[2]) g[2][x] = 'e'; }
    ashCap(g); return { g: gOutline(g), HH };
  }
  // 재가 된 사람들 (서 있는 소품, 2px 칸) — 막은 팔, 무릎 꿇고 비는 이, 아이를 안은 어머니. 'e'는 눈 자리
  const FOLK_PAL = { k: '#0b0a09', h: '#b2ac9e', l: '#8a847a', d: '#625e56', D: '#423f3a', a: '#cdc7ba', A: '#9a948a', e: '#2a2622', c: '#26231f', w: '#c8c2b4' };
  const FOLK_RAW = {
    folkA: ['............', '.....hl.....', '....hlld....', '...hhlldd...', '..hhhhlddd..', '....hledd...', '...hhlldd...', '..hllllllddD', '..hllcllld.D', '..hlllllldd.', '...hlllldd..', '...hlllldd..', '...hllllldd.', '..hllllllld.', '..hll..lldd.', '.hll....ldd.', '.hl......dd.', 'aaAa....AAa.', 'AAAAAaaAAAAA', '............'],
    folkB: ['............', '....hhld....', '...hhlldd...', '...hlledd...', '....hlld....', '...hhhlldd..', '..hhllllddd.', '..hlhhhhldd.', '..hllhhlldd.', '..hllllllddd', '.hhlllcllddd', 'hhllllllllld', 'aaaaaaaAAAAA', 'AAAAAAAAAAAA', '............'],
    folkC: ['............', '.....hld....', '....hlldd...', '....hledd...', '.....hld....', '...hhhlldd..', '..hhwwllddd.', '..hwwwhlddd.', '..hlwwhhddd.', '...hllhhdd..', '...hlllldd..', '...hllcldd..', '..hllllllddd', '..hlllllllld', '.hllllllllld', 'aaaAaaaAAAAA', 'AAAAAAAAAAAA', '............'],
  };
  const FOLK_EYE = { folkA: [5, 5], folkB: [5, 3], folkC: [5, 3] }; // 외곽선을 둘러도 칸 위치는 같다
  for (const n in FOLK_RAW) PROP_MAPS[n] = [gOutline(fromRows(FOLK_RAW[n])).map(r => r.join('')), FOLK_PAL];
  // 꺼진 가로등: 쇠기둥 + 깨진 등갓, 기둥 아래 재
  PROP_MAPS.ashLamp = [["...kgk....", "..kkGdkkk.", ".ksssssssk", "..kGGggkk.", "...kkkkk..", "..kgggggk.", "..kGDCDgk.", "..kGDcDgk.", "..kGSDDgk.", "..kaagggk.", "...kGdkk..", "...kGdk...", "..kaaggk..", "...kGdk...", "...kGdk...", "..kkGdkk..", ".kaaGGggk.", "kssSSSgggk"], {"k": "#0b0a0e", "a": "#a8a4ae", "G": "#7e7a88", "g": "#5c5866", "d": "#403c4a", "D": "#2a2632", "s": "#c8c2c0", "S": "#8e8884", "c": "#3a2a24", "C": "#6a3a28"}]; // v2.80 잿빛 왕도 가로등 다시 그림
  Object.assign(PROPS, { folkA: { r: 6, foot: 1, folk: true }, folkB: { r: 7, foot: 1, folk: true }, folkC: { r: 6, foot: 1, folk: true }, ashLamp: { r: 4, foot: 1 } });
  // 왕도 장식: 북쪽 벽 아래 가로등·갑옷, 방 곳곳에 재가 된 사람들 (전투 방에선 일부가 매복)
  function decorAsh(r, add, W0, H0) {
    const nx = DOOR.n.x, topY = A.y0 + 18, fight = r.type === 'combat';
    const n = Math.max(1, Math.floor(W0 / 240));
    for (let i = 0; i < n; i++) if (Math.random() < 0.7) { const x = A.x0 + 50 + (i + rand(0.2, 0.8)) * (W0 - 100) / n; if (Math.abs(x - nx) > 70) add(pick(['ashLamp', 'ashLamp', 'royalBanner']), x, topY); /* v2.89 갑옷 장식 → 그을린 왕실 깃대 */ }
    if (r.doors.n != null && Math.random() < 0.4) { add('royalBanner', nx - 46, topY + 4); add('royalBanner', nx + 46, topY + 4); }
    const cnt = r.type === 'boss' ? 0 : r.shape === 'gallery' || r.shape === 'belfry' ? randi(1, 3) : randi(3, 6);
    let ambN = fight ? (Math.random() < 0.25 ? 0 : randi(1, 2)) : 0;
    for (let i = 0, tries = 0; i < cnt && tries < 40; tries++) {
      const x = rand(A.x0 + 40, A.x1 - 40), y = rand(A.y0 + 40, A.y1 - 30); if (Math.hypot(x - CX, y - CY) < 120) continue;
      const nm = pick(['folkA', 'folkA', 'folkB', 'folkC']); if (!add(nm, x, y)) continue;
      i++; const p = r.props[r.props.length - 1]; if (ambN > 0) { p.amb = true; ambN--; }
    }
    if (r.shape === 'sanctum' && Math.random() < 0.6) { const x = CX + rand(-W0 * 0.25, W0 * 0.25), y = CY + rand(-H0 * 0.2, H0 * 0.2); if (add('feastTable', x, y) && Math.random() < 0.7) add('feastChair', x + pick([-40, 40]), y + 6); } // v2.89 연회 식탁 · 의자
    if (Math.random() < 0.5) { const cs = [[A.x0 + 26, A.y0 + 30], [A.x1 - 26, A.y0 + 30]]; for (const c of cs) add('crownBrazier', ...c); } // v2.89 왕관 테 화로
  }
  // 재의 사람들: 매복 조각상이 깨지며 적이 튀어나온다 (재 망자)
  function breakFolk(R, p, spawn) {
    const i = R.props.indexOf(p); if (i < 0) return; R.props.splice(i, 1);
    R.obs = R.obs.filter(b => !(b.t === 'prop' && b.c && b.x === p.x && b.y === p.y)); R.nav = buildNav(R.obs);
    if (G.dun.cur === R) { G.obs = R.obs; G.nav = R.nav; G.navDist = null; }
    debris(p.x, p.y - 14, 14); dust(p.x, p.y - 4, 12); sfx('crunch'); sfx('block', 0.6);
    for (let k = 0; k < 10; k++) G.parts.push({ x: p.x + rand(-6, 6), y: p.y - rand(4, 30), vx: rand(-30, 30), vy: -rand(10, 50), t: rand(0.4, 0.9), c: pick(['#b2ac9e', '#8a847a', '#cdc7ba']), g: 160 });
    if (spawn) { queueSpawn('husk', { x: p.x, y: p.y + 4 }); G.nums.push({ x: p.x, y: p.y - 40, v: '매복!', t: 0.9, c: '#ff9a50', s: 1, txt: true }); }
  }
  function updateAmbush(dt) {
    const R = G.dun && G.dun.cur, rs = G.rs; if (!R || !R.props || G.stage !== 4) return;
    const live = rs && rs.state === 'run' && !R.cleared;
    if (!live) return;
    R.ambT = (R.ambT || 0) + dt;
    for (const p of R.props.slice()) { if (!p.amb) continue;
      if (p.wakeT == null) p.wakeT = rand(2, 9);
      p.warn = R.ambT > p.wakeT - 1.1;
      if (R.ambT >= p.wakeT) breakFolk(R, p, true); }
  }
  // 플레이어 공격·투사체가 조각상에 닿으면 부서진다 (매복이었으면 그 자리에서 깨어남)
  function hitFolk(x, y, rad) {
    const R = G && G.dun && G.dun.cur; if (!R || !R.props || G.stage !== 4) return false;
    let hit = false;
    for (const p of R.props.slice()) if (PROPS[p.name].folk && Math.hypot(p.x - x, p.y - 8 - y) < rad * 0.7 + 8) { breakFolk(R, p, p.amb && !R.cleared && G.rs && G.rs.state === 'run'); hit = true; }
    return hit;
  }
  const propCanvas = name => art('prop_' + name, () => gCanvas(fromRows(PROP_MAPS[name][0]), PROP_MAPS[name][1]));
  // 방 스타일: 바닥을 칠할 때 쓰는 방별 설정 (타이틀 화면은 기본값)

  // ---------- 방 생성 때: 서 있는 소품 배치 (큰 것은 장애물이 되고, 문 사이 길이 막히면 뺀다)
  function decorRoom(r, stage, keyPts) {
    const st4 = stage === 4; if (st4) stage = 2;
    r.props = [];
    const W0 = A.x1 - A.x0, H0 = A.y1 - A.y0;
    const previousStyle = ROOMSTYLE; ROOMSTYLE = stage === 1 ? r.style : ROOMSTYLE;
    const paths = stage === 1 ? meadowCurves() : []; ROOMSTYLE = previousStyle;
    const onRoad = (x, y, clearance) => paths.some(c => { for (let t = c.a; t <= c.b; t += 6) { const m = c.at(t), px = c.vert ? m : t, py = c.vert ? t : m; if (Math.hypot(px - x, py - y) < clearance) return true; } return false; });
    if (SR_LAYOUT[r.type]) { srPlace(r, stage); return; } // v1.11 특별한 방은 정해진 배치만
    const ok = (x, y, rad) => x > A.x0 + rad + 4 && x < A.x1 - rad - 4 && y > A.y0 + 8 && y < A.y1 - rad - 4 && !obsHitL(r.obs, x, y, rad + 8) && !onRoad(x, y, rad + 20)
      && !keyPts.some(p => Math.hypot(p.x - x, p.y - y) < rad + (p.big ? CLEAR_R : 46)) && !r.props.some(p => Math.hypot(p.x - x, p.y - y) < rad + p.rad + 12);
    // 그려지는 모양(높이 포함)끼리도 겹치지 않게: 소품끼리, 소품과 나무·바위·벽 (v0.59)
    const obsVis = b => b.c ? (b.t === 'pillar' ? { x0: b.x - b.r * 2.4, y0: b.y - b.r * 6, x1: b.x + b.r * 2.4, y1: b.y + b.r } : { x0: b.x - b.r - 2, y0: b.y - b.r * 1.8, x1: b.x + b.r + 2, y1: b.y + b.r }) : b.t === 'pit' ? { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 } : { x0: b.x0, y0: b.y0 - (b.tower ? 90 : 40), x1: b.x1, y1: b.y1 };
    const add = (name, x, y) => { const sp = PROPS[name], rad = sp.r || (sp.w ? (sp.pit ? Math.max(sp.w, sp.h) / 2 + 6 : sp.w / 2) : 8);
      if (typeof OCC !== 'undefined' && OCC.on()) { // v2.85 점유 지도: 발 자리 · 실제 그림으로 겹침 판정
        if (!(x > A.x0 + rad + 4 && x < A.x1 - rad - 4 && y > A.y0 + 8 && y < A.y1 - rad - 4) || onRoad(x, y, rad + 20)) return false;
        const q = { name, x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2, rad }; if (!OCC.prop(q)) return false; r.props.push(q); return true; }
      if (!ok(x, y, rad)) return false;
      const q = { name, x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2, rad }, me = propRect(q);
      if (r.props.some(p => rectHit(me, propRect(p), 6)) || r.obs.some(b => rectHit(me, obsVis(b), 4))) return false;
      r.props.push(q); return true; };
    const fightRoom = ['combat', 'elite', 'survive', 'start'].includes(r.type);
    if (stage === 3) decorOrc(r, add, W0, H0, keyPts);
    else if (st4) decorAsh(r, add, W0, H0);
    else if (stage === 2) {
      const nx = DOOR.n.x, topY = A.y0 + 18;
      if (r.doors.n != null && Math.random() < 0.5) { const nm = pick(['goblinStatue', 'goblinStatue', 'armor']); add(nm, nx - 46, topY + 4); add(nm, nx + 46, topY + 4); }
      const n = Math.max(1, Math.floor(W0 / 260));
      const pool = r.shape === 'chamber' ? ['bookshelf', 'bookshelf', 'candelabra', 'armor'] : ['armor', 'goblinStatue', 'candelabra', 'brazier', 'armor'];
      for (let i = 0; i < n; i++) if (Math.random() < 0.7) { const x = A.x0 + 50 + (i + rand(0.2, 0.8)) * (W0 - 100) / n; if (Math.abs(x - nx) > 70) add(pick(pool), x, topY); }
      if (Math.random() < 0.6) { const cs = [[A.x0 + 26, A.y0 + 30], [A.x1 - 26, A.y0 + 30], [A.x0 + 26, A.y1 - 24], [A.x1 - 26, A.y1 - 24]].sort(() => Math.random() - 0.5); const m = pick(['brazier', 'candelabra']); add(m, ...cs[0]); add(m, ...cs[1]); }
      if (r.shape === 'chamber' || (r.shape === 'hall' && Math.random() < 0.3)) {
        if (Math.random() < 0.6) { const x = CX + rand(-W0 * 0.25, W0 * 0.25), y = CY + rand(-H0 * 0.2, H0 * 0.2); if (add('table', x, y) && Math.random() < 0.7) add('chairBroken', x + pick([-28, 28]), y + 6); }
        if (Math.random() < 0.35) add('cage', pick([A.x0 + 40, A.x1 - 40]), A.y1 - 40);
      }
      if (r.shape === 'corridorV' && Math.random() < 0.6) { add('candelabra', A.x0 + 22, CY - 120); add('candelabra', A.x1 - 22, CY + 120); }
    } else {
      // 개울: 걸어서 못 건넘(투사체는 넘어감). 문 앞을 지나면 그 자리에 다리, 길이 막히면 다리를 더 놓는다
      r.bridges = null;
      if (r.style && r.style.path === 'brook') {
        const RS0 = ROOMSTYLE; ROOMSTYLE = r.style; const bc = meadowCurves()[0]; ROOMSTYLE = RS0;
        const lo = bc.vert ? A.y0 : A.x0, hi = bc.vert ? A.y1 : A.x1, at = t => { const m = bc.at(t); return bc.vert ? { x: m, y: t } : { x: t, y: m }; };
        const br = [];
        for (const kp of keyPts) { let bt = null, bd = 1e9; for (let t = lo; t <= hi; t += 4) { const q = at(t), d = Math.hypot(q.x - kp.x, q.y - kp.y); if (d < bd) { bd = d; bt = t; } } if (bd < 70 && !br.some(b => Math.abs(b - bt) < 60)) br.push(bt); }
        if (!br.length) br.push(lo + (hi - lo) * rand(0.3, 0.7));
        if (Math.random() < 0.5) { const t = lo + (hi - lo) * rand(0.12, 0.88); if (!br.some(b => Math.abs(b - t) < 120)) br.push(t); }
        const segs = () => { const out = []; for (let t = lo - 14; t <= hi + 14; t += 12) { if (br.some(b => Math.abs(b - t) < 20)) continue; const q = at(t), hw = bc.vert ? 16 : 7, hh = bc.vert ? 7 : 16; out.push({ t: 'pit', c: false, brook: true, x: q.x, y: q.y, w: hw * 2, h: hh * 2, x0: q.x - hw, x1: q.x + hw, y0: q.y - hh, y1: q.y + hh }); } return out; };
        for (let k = 0; k < 6; k++) {
          if (keyPts.length < 2) break;
          const nav = buildNav(r.obs.concat(segs())), dd = navFlood(nav, keyPts[0].x, keyPts[0].y);
          const miss = keyPts.find(p => dd[navIdx(p.x, p.y)] < 0); if (!miss) break;
          let bt = lo, bd = 1e9; for (let t = lo; t <= hi; t += 4) { const q = at(t), d = Math.hypot(q.x - miss.x, q.y - miss.y); if (d < bd) { bd = d; bt = t; } } br.push(bt);
        }
        r.obs = r.obs.concat(segs());
        r.bridges = br.map(t => at(t));
      }
      if (Math.random() < 0.4) { const k = randi(1, W0 > 900 ? 3 : 1); for (let i = 0; i < k; i++) add('ruinPillar', rand(A.x0 + 40, A.x1 - 40), rand(A.y0 + 30, A.y1 - 40)); }
      if (Math.random() < 0.3) { const ds = Object.keys(r.doors).filter(d => r.doors[d] != null); if (ds.length) { const q = doorIn(pick(ds), 70); add('signpost', q.x + pick([-40, 40]), q.y); } }
      // 물웅덩이 M·L·XL: 못 건너가는 장애물, 흙길·개울과 겹치지 않게
      if (r.type !== 'boss') {
        const farFromPath = (x, y, w, h) => !onRoad(x, y, Math.max(w, h) / 2 + 28);
        const n = Math.random() < 0.35 ? 0 : randi(1, W0 * H0 > 400000 ? 3 : 2);
        for (let i = 0; i < n; i++) {
          const k = pick(W0 > 500 && H0 > 300 ? ['poolM', 'poolM', 'poolL', 'poolL', 'poolXL'] : ['poolM', 'poolM', 'poolL']), sp = PROPS[k];
          for (let tries = 0; tries < 12; tries++) {
            const x = rand(A.x0 + sp.w / 2 + 30, A.x1 - sp.w / 2 - 30), y = rand(A.y0 + sp.h / 2 + 30, A.y1 - sp.h / 2 - 30);
            if (!farFromPath(x, y, sp.w, sp.h)) continue;
            if (add(k, x, y)) break;
          }
        }
      }
    }
    // v1.52 기괴한 소품 배치
    if (r.type !== 'boss' && r.type !== 'start') {
      const rx = () => rand(A.x0 + 60, A.x1 - 60), ry = () => rand(A.y0 + 50, A.y1 - 40);
      const tryAdd = (nm, n) => { for (let t = 0; t < 10; t++) if (add(nm, rx(), ry())) { if (--n <= 0) return; } };
      if (st4) {
        if (Math.random() < 0.4) tryAdd('breathHeap', 1);
        if (Math.random() < 0.35) for (let t = 0; t < 8; t++) { const x = rx(), y = ry(), n0 = r.props.length; let k = 0;
          for (const o of [-30, 0, 30]) if (add('ashCitizen', x + o, y + (o ? 6 : 0))) { const q = r.props[r.props.length - 1]; q.kind = o === 0 && Math.random() < 0.6 ? 'b' : 'h'; q.fl = Math.random() < 0.5; k++; }
          if (k >= 2) break; r.props.length = n0; }
      } else if (stage === 3) { if (Math.random() < 0.4) tryAdd('meatPole', 1); }
      else if (stage === 1) { if (Math.random() < 0.45) tryAdd('smileFlower', randi(1, 2)); }
    }
    // 장애물로 등록 + 문 사이 길 검사
    const solid = p => PROPS[p.name].r || PROPS[p.name].w;
    const toObs = p => { const sp = PROPS[p.name]; if (sp.pit) return { t: 'pit', c: false, pool: p.name, seed: p.x * 31 + p.y, x: p.x, y: p.y, w: sp.w, h: sp.h, x0: p.x - sp.w / 2, y0: p.y - sp.h / 2, x1: p.x + sp.w / 2, y1: p.y + sp.h / 2 }; return sp.w ? { t: 'prop', c: false, x: p.x, y: p.y, w: sp.w, h: sp.h, x0: p.x - sp.w / 2, y0: p.y - sp.h, x1: p.x + sp.w / 2, y1: p.y } : { t: 'prop', c: true, x: p.x, y: p.y, r: sp.r }; };
    const base = r.obs.slice();
    for (;;) {
      const obs = base.concat(r.props.filter(solid).map(toObs)), nav = buildNav(obs);
      const conn = keyPts.length < 2 || (() => { const dd = navFlood(nav, keyPts[0].x, keyPts[0].y); return keyPts.every(p => dd[navIdx(p.x, p.y)] >= 0); })();
      if (conn || !r.props.some(solid)) { r.obs = obs; r.nav = nav; break; }
      const i = r.props.map(solid).lastIndexOf(true); r.props.splice(i, 1);
    }
  }
  function drawGroProp(p, sp) { // v1.52 움직이는 기괴한 소품 (칸 단위로만 움직임)
    const P = G.player, dx = P ? P.x - p.x : 999, d = P ? Math.hypot(dx, P.y - p.y) : 999, by = p.y + 2;
    if (sp.anim === 'flower') { // 웃는 꽃: 가까이 오면 이빨 난 입을 벌리고 고개를 돌림
      const near = d < 90, hx = near && Math.abs(dx) > 8 ? (dx > 0 ? 2 : -2) : 0;
      drawSprite('flStem', 'gro', 2, p.x, by, false); drawSprite(near ? 'flHeadO' : 'flHead', 'gro', 2, p.x + hx, by, false);
    } else if (sp.anim === 'meat') { // 고기 장식: 바람도 없는데 흔들리고, 피가 떨어짐
      const sw = [0, 2, 2, 0, -2, -2][Math.floor(time * 6 + p.x) % 6], X = p.x + 14;
      drawSprite('mpPole', 'gro', 2, X, by, false); drawSprite('mpMeat', 'gro', 2, X + sw, by, false);
      if (Math.random() < 0.012) G.parts.push({ x: X - 18 + 27 + sw, y: by - 56 + 26, vx: 0, vy: 10, t: 0.5, c: '#a82a2a', g: 220 });
    } else if (sp.anim === 'heap') { // 숨 쉬는 재 더미: 가까이 가면 숨을 멈추고 잉걸 눈이 깜빡
      const near = d < 70, br = near ? 0 : Math.floor((time + p.x * 0.013) / 0.34) % 2;
      drawSprite('ghBot', 'ashHeap', 2, p.x, by, false); drawSprite('ghTop', 'ashHeap', 2, p.x, by - br * 2, false);
      if (near && Math.floor(time * 3) % 2 === 0) { ctx.fillStyle = '#ff7a30'; ctx.fillRect((p.x - 16 + 12) & ~1, (by - 28 + 10) & ~1, 2, 2); }
    } else if (sp.anim === 'citizen') { // 잿빛 시민: 등을 돌린 사이 자세가 바뀌어 있음
      if (P) { const away = (p.x > P.x ? 1 : -1) !== (P.face || 1); if (away && !p._away && Math.random() < 0.5) { p.pose = !p.pose; p.fl = P.x < p.x; } p._away = away; }
      const h = p.kind !== 'b', m = h ? (p.pose ? 'huskUp' : 'huskA') : (p.pose ? 'heraldB' : 'herald');
      if (!h) { const pd = art('heraldPed', () => gCanvas(fromRows(['kkkkkkkkkkkkkkkkkk', 'ka11111111111111kk', 'k2222222222222234k', 'kkkkkkkkkkkkkkkkkk', '.k3333333333333k.'.padEnd(18, '.'), '.kkkkkkkkkkkkkkk..'.padEnd(18, '.')]), { k: '#0b0a09', a: '#b9b9af', '1': '#9a9a92', '2': '#6f6f69', '3': '#43433f', '4': '#292926' })); // v2.77 왕의 기수 석상 받침
        ctx.drawImage(pd, (p.x - pd.width / 2) & ~1, (by - pd.height + 2) & ~1); drawSprite(m, 'statueB', 2, p.x, by - pd.height + 6, !!p.fl); }
      else drawSprite(m, 'statueH', 2, p.x, by, !!p.fl);
    }
  }
  function drawProp(p) {
    if (PROPS[p.name].anim) { const sp = PROPS[p.name]; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect((p.x - (sp.r || 8)) & ~1, p.y, ((sp.r || 8) * 2) & ~1, 2); drawGroProp(p, sp); return; }
    const sp = PROPS[p.name], c = sp.raw ? propCanvas(p.name) : ash4(propCanvas(p.name), 'prop_' + p.name), x = (p.x - c.width / 2) & ~1, y = (p.y - c.height + (sp.foot || 0) * 2) & ~1;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; { const xa = x + 2, xb = x + c.width - 2; if (xb > xa) ctx.fillRect(xa, p.y, Math.ceil((xb - xa) / 2) * 2, 2); }
    if (p.amb && sp.folk) { // 매복 조각상: 눈에 희미한 불씨, 깨어나기 직전엔 떨린다
      const R = G.dun && G.dun.cur, on = R && !R.cleared, sx = p.warn && on ? (Math.floor(time * 24) % 2 ? 2 : -2) : 0, e = FOLK_EYE[p.name];
      ctx.drawImage(c, x + sx, y);
      if (on && (p.warn || Math.floor(time * 3 + p.x) % 5 === 0)) { ctx.fillStyle = p.warn ? '#ffb060' : '#ff6a2a'; ctx.fillRect(x + sx + (e[0] + 0) * 2, y + e[1] * 2, 2, 2); }
      if (p.warn && on && Math.random() < 0.4) G.parts.push({ x: p.x + rand(-6, 6), y: p.y - rand(4, 28), vx: rand(-8, 8), vy: -rand(10, 30), t: 0.4, c: pick(['#cdc7ba', '#8a847a']), g: 0 });
    } else ctx.drawImage(c, x, y);
    if (sp.flame) for (const [fx, fy] of sp.flame) {
      const f = Math.floor(time * 10 + fx * 3 + p.x) % 3;
      ctx.fillStyle = '#ff8a2a'; ctx.fillRect(x + fx * 2, y + fy * 2 - 2 - (f === 1 ? 2 : 0), 2, 2);
      ctx.fillStyle = '#ffe08a'; ctx.fillRect(x + fx * 2 + (f === 2 ? 2 : 0), y + fy * 2 - 4 - (f === 0 ? 2 : 0), 2, 2);
    }
  }

  // ---------- 바닥 무늬 생성기 (모두 2px 칸)
  function genFern() {
    const g = mkGrid(15, 10);
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI / 2 + (f - 2) * 0.6, L = rand(4.5, 6.5);
      for (let t = 1; t < L; t++) {
        const x = Math.round(7 + Math.cos(a) * t), y = Math.round(9 + Math.sin(a) * t * 0.85 + t * t * 0.07 * Math.abs(f - 2));
        if (!g[y] || g[y][x] === undefined) continue;
        g[y][x] = t > L - 1.5 ? 'M' : 'm';
        if (t % 2 === 0 && t < L - 1) { const sx = x + (Math.cos(a) > 0 ? 1 : -1); if (g[y - 1] && g[y - 1][sx] !== undefined) g[y - 1][sx] = 'd'; }
      }
    }
    return g;
  }
  const FERN_PAL = { m: '#36602a', M: '#6a9a44', d: '#24401c' };
  const SHROOMS = {
    red: fromRows(['.kkk.', 'kRWRk', 'kRRRk', 'kkkkk', '.kwk.', '.kkk.']),
    brown: fromRows(['.kkkk.', 'kbBbbk', 'kkkkkk', '.kwwk.', '.kkkk.']),
    tall: fromRows(['.kk.', 'kWWk', 'kkkk', '.kw.', '.kw.', '.kk.']),
    glow: fromRows(['.kkk.', 'kcCck', 'kkkkk', '.kwk.', '.kk.']),
  };
  const SHROOM_PAL = { k: '#121214', R: '#a83030', W: '#f0ece0', w: '#d8d0c0', b: '#8a5a30', B: '#a87040', c: '#3aa0b8', C: '#a0f0ff' };
  const BONES = fromRows(["..............", "........k.kkk.", "......kkWkWWwk", "....kkwwWWWWww", "k.kkwwwkkWdWdw", "Wkwwkkk.kwwwww", "wwkkwwwk.kwdwk", "wkkwwkk...kkk."]); // v2.81
  const STONEPAD = fromRows(['.kkkk.', 'kGGggk', 'kGgggk', 'kgggdk', '.kkkk.']);
  const STONEPAD_PAL = { k: '#121214', G: '#a8a4ae', g: '#7c7a82', d: '#4c4a52' };
  const CANDLES = fromRows([".....ok.....", "....keEk....", "..okkeek....", ".keEkeEkok..", ".keekeEkeEok", ".keEkeEkeeeE", ".keEkeEkeEee", "kEeEEeEweEeE", "kEEEEEwwwwww"]); // v2.81
  // 타원 영역에 점을 디더링으로 흩뿌린다
  function scatterPatch(g, cx, cy, rx, ry, cols, dens) {
    for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) {
      const e = (x * x) / (rx * rx) + (y * y) / (ry * ry); if (e > 1) continue;
      if (Math.random() < dens * (1 - e * 0.7)) { g.fillStyle = pick(cols); g.fillRect(((cx + x) & ~1), ((cy + y) & ~1), 2, 2); }
    }
  }
  function genWeb() {
    const g = mkGrid(12, 10);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI / 2; for (let t = 0; t < 11; t++) { const x = Math.round(Math.cos(a) * t), y = Math.round(Math.sin(a) * t * 0.85); if (g[y] && g[y][x] !== undefined) g[y][x] = 'w'; } }
    for (const R of [4, 7, 10]) for (let a = 0; a < Math.PI / 2; a += 0.12) { const x = Math.round(Math.cos(a) * R), y = Math.round(Math.sin(a) * R * 0.85); if (g[y] && g[y][x] !== undefined && Math.random() < 0.85) g[y][x] = 'W'; }
    return g;
  }
  function genCarpet(len, wid, vert) {
    // 붉은 융단: 금실 테두리, 마름모 무늬, 끝은 술 장식, 군데군데 해지고 바랬다
    const L = len, Wd = wid, g = mkGrid(vert ? Wd : L, vert ? L : Wd);
    const set = (i, j, c) => { const x = vert ? j : i, y = vert ? i : j; if (g[y] && g[y][x] !== undefined) g[y][x] = c; };
    for (let i = 0; i < L; i++) for (let j = 0; j < Wd; j++) {
      const e = Math.min(j, Wd - 1 - j), endD = Math.min(i, L - 1 - i);
      let c = e === 0 ? 'k' : e === 1 ? 'y' : e === 2 ? 'D' : 'R';
      if (c === 'R') { const m = ((i % 14) + 14) % 14, dj = Math.abs(j - (Wd - 1) / 2); if (Math.abs(m - 7) + dj === Math.round(Wd / 4) || (m === 7 && dj < 1)) c = 'y'; else if (Math.abs(m - 7) + dj < Wd / 4) c = 'r'; }
      if (endD === 0) c = j % 2 ? 'y' : '.'; else if (endD === 1) c = 'k';
      if (endD > 1 && endD < 10 && Math.random() < (10 - endD) / 40) c = '.';
      set(i, j, c);
    }
    for (let k = 0; k < L / 30; k++) { const i = randi(8, L - 9), j = randi(3, Wd - 4); for (let d = 0; d < 6; d++) set(i + randi(-2, 2), j + randi(-1, 1), dith(i + d, j, 0.5) ? 'D' : '.'); }
    return g;
  }
  const CARPET_PAL = { k: '#1a0c10', y: '#a8822e', D: '#4a0c14', R: '#7a1420', r: '#5a0e18' };
  function genRug(rx, ry) {
    const g = mkGrid(rx * 2 + 1, ry * 2 + 1);
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const e = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry)); if (e > 1) continue;
      g[y + ry][x + rx] = e > 0.92 ? 'k' : e > 0.84 ? 'y' : e > 0.62 ? 'P' : e > 0.55 ? 'y' : e > 0.25 ? ((Math.abs(x) + Math.abs(y)) % 4 === 0 ? 'p' : 'R') : 'y';
    }
    return g;
  }
  const RUG_PAL = { k: '#120a10', y: '#a8822e', P: '#3a1848', p: '#5a2a6a', R: '#6a1420' };
  const RUG_PALS = [
    RUG_PAL,
    { k: '#0a0c14', y: '#b8a060', P: '#142a4a', p: '#2a4a78', R: '#1a3050' },
    { k: '#0a100a', y: '#9a8a4a', P: '#1a3a22', p: '#2e5a36', R: '#5a1418' },
    { k: '#140c08', y: '#c8a050', P: '#4a2a14', p: '#7a4a22', R: '#7a2a14' },
    { k: '#0e0a10', y: '#8a8494', P: '#2a2232', p: '#4a3e5a', R: '#3a1a2a' },
  ];
  // 무늬가 다른 원형 (0 동심원, 1 햇살, 2 점박이)
  function genRugRound(rx, ry, pat) {
    const g = mkGrid(rx * 2 + 1, ry * 2 + 1);
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const e = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry)); if (e > 1) continue;
      const an = Math.atan2(y / ry, x / rx);
      let c = e > 0.92 ? 'k' : e > 0.84 ? 'y' : 'R';
      if (c === 'R') {
        if (pat === 0) c = e > 0.62 ? 'P' : e > 0.55 ? 'y' : e > 0.25 ? ((Math.abs(x) + Math.abs(y)) % 4 === 0 ? 'p' : 'R') : 'y';
        else if (pat === 1) c = e < 0.18 ? 'y' : Math.floor((an + Math.PI) / (TAU / 16)) % 2 ? (e > 0.6 ? 'P' : 'R') : (e > 0.6 ? 'p' : 'P');
        else c = e > 0.7 ? 'P' : (Math.round(x / 3 + y / 2) % 3 === 0 && (x + y) % 2 === 0 ? 'y' : e < 0.3 ? 'p' : 'R');
      }
      g[y + ry][x + rx] = c;
    }
    return g;
  }
  // 사각 융단: 무늬 띠 테두리, 가운데 마름모 문장, 네 귀 장식, 짧은 변에 술
  function genRugRect(wc, hc, torn) {
    const g = mkGrid(wc + 4, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const e = Math.min(x, y, wc - 1 - x, hc - 1 - y);
      let c = e === 0 ? 'k' : e === 1 ? 'y' : e <= 3 ? ((x + y) % 3 === 0 ? 'y' : 'P') : e === 4 ? 'y' : 'R';
      if (c === 'R') {
        const dx = Math.abs(x - (wc - 1) / 2) / (wc / 2), dy = Math.abs(y - (hc - 1) / 2) / (hc / 2), d = dx + dy;
        if (d < 0.42) c = d > 0.36 ? 'y' : d > 0.2 ? 'P' : d > 0.12 ? 'p' : 'y';
        else if (Math.min(x, wc - 1 - x) + Math.min(y, hc - 1 - y) < 11 && Math.min(x, wc - 1 - x) > 4 && Math.min(y, hc - 1 - y) > 4) c = 'p';
        else if ((x * 3 + y * 5) % 17 === 0) c = 'P';
      }
      if (torn && (Math.sin(x * 0.7) + Math.sin(y * 0.9 + 1) > 1.4 || (x > wc * 0.7 && y > hc * 0.6 && dith(x, y, (x / wc - 0.7) * 3)))) c = '.';
      g[y][x + 2] = c;
    }
    for (let y = 1; y < hc - 1; y += 2) { g[y][0] = 'y'; g[y][1] = 'y'; g[y][wc + 2] = 'y'; g[y][wc + 3] = 'y'; }
    return g;
  }
  // 팔각 깔개: 별 무늬
  function genRugOct(r) {
    const n = r * 2 + 1, g = mkGrid(n, Math.round(n * 0.62));
    const ry = (g.length - 1) / 2;
    for (let y = 0; y < g.length; y++) for (let x = 0; x < n; x++) {
      const dx = Math.abs(x - r) / r, dy = Math.abs(y - ry) / ry, o = Math.max(dx, dy, (dx + dy) * 0.72);
      if (o > 1) continue;
      const an = Math.atan2((y - ry) / ry, (x - r) / r), star = o < 0.55 * (0.7 + 0.3 * Math.cos(an * 8));
      g[y][x] = o > 0.92 ? 'k' : o > 0.84 ? 'y' : star ? (o < 0.15 ? 'y' : 'p') : o > 0.66 && o < 0.72 ? 'y' : 'R';
    }
    return g;
  }
  // 짐승 가죽 깔개 (머리·다리 달린 털가죽)
  const PELT = fromRows([
    '.....kk.........kk.....', '....kFFk.......kFFk....', '.....kFFkkkkkkkFFk.....', '.......kFfffffffFk......', '.....kkFfffFffffFkk.....', '....kFFfffffffffffFFk...',
    '...kFffffDffffDfffffFk..', '..kFfffffffffffffffffFk.', '..kFffDfffffffffDffffFk.', '..kFfffffffDffffffffFk..', '...kFfffffffffffffffFk..', '....kFFfffDfffffffFFk...',
    '.....kkFffffffffFkk.....', '.......kFFkkkkFFk.......', '......kWkk....kkWk......', '.....kFk........kFk.....', '......k..........k......']);
  const PELT_PAL = { k: '#140c06', F: '#4a3018', f: '#6e4a2a', D: '#3a2412', W: '#d8d0c0' };

  // ---------- 바닥 꾸미기: 초원
  function paintMeadowDecor(g, R) {
    const fl = G ? (G.flatLights = []) : [];
    const MPs = meadowCurves(), onPath = (x, y, clearance = 20) => MPs.some(c => { for (let t = c.a; t <= c.b; t += 6) { const m = c.at(t), px = c.vert ? m : t, py = c.vert ? t : m; if (Math.hypot(px - x, py - y) < clearance) return true; } return false; });
    const busy = (x, y, r) => (R && obsHitL(R.obs, x, y, r)) || onPath(x, y, r + 20) || !decFree(x, y, Math.max(r, 6));
    const spot = (pad = 20, r = 10) => { for (let i = 0; i < 30; i++) { const x = rand(A.x0 + pad, A.x1 - pad), y = rand(A.y0 + pad, A.y1 - pad - 10); if (!busy(x, y, r)) return { x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2 }; } return null; };
    const area = (A.x1 - A.x0) * (A.y1 - A.y0) / 540000;
    // 땅 얼룩: 이끼·맨흙·짙은 풀
    for (let i = 0; i < 6 * area + 2; i++) { const p = spot(30, 0); if (p) scatterPatch(g, p.x, p.y, randi(20, 50), randi(12, 26), pick([['#2e5222', '#36602a'], ['#3a3020', '#46382a'], ['#1a2e14', '#22381a']]), 0.35); }
    // 낙엽 더미 (가을빛)
    for (let i = 0; i < randi(1, 4) * area; i++) { const p = spot(30, 10); if (p) scatterPatch(g, p.x, p.y, randi(18, 34), randi(10, 18), ['#a04a1a', '#d8883a', '#6a2a12', '#d8c050', '#8a3a14'], 0.45); }
    // 꽃밭
    for (let i = 0; i < randi(0, 3) * area; i++) { const p = spot(30, 10); if (p) { scatterPatch(g, p.x, p.y, randi(16, 30), randi(8, 16), ['#3e6a2c', '#4a7a34'], 0.5); scatterPatch(g, p.x, p.y, randi(14, 26), randi(7, 14), pick([['#e8e0c0', '#e0c040'], ['#b080e0', '#e8e0c0'], ['#e07090', '#e0c040']]), 0.22); } }
    // 고사리 · 키 큰 풀
    for (let i = 0; i < randi(6, 14) * area; i++) { const p = spot(10, 8); if (p) gPaint(g, genFern(), FERN_PAL, p.x - 14, p.y - 18); }
    for (let i = 0; i < 40 * area; i++) { const p = spot(6, 0); if (p) { const t = pick(['tuft1', 'tuft2', 'tuft3']); stamp(g, DECO_MAPS[t], Object.assign({}, DECO, Math.random() < 0.5 ? { m: '#4a7a34', M: '#78a850' } : { m: '#36602a', M: '#5a8a3a' }), p.x, p.y, 2, Math.random() < 0.5); } }
    for (let i = 0; i < 14 * area; i++) { const p = spot(6, 0); if (p) stamp(g, DECO_MAPS[pick(['flowerY', 'flowerP', 'flowerW'])], DECO, p.x, p.y, 2, Math.random() < 0.5); }
    // 바위 · 그루터기 · 통나무(버섯 돋은) · 덤불
    // v2.91 바위는 방 전체에 고르게 뿌리지 않고 몇 무더기로만 · 바위 장애물이 많은 방은 그만큼 덜 놓음
    { const obsRock = R ? R.obs.filter(b => b.t === 'rock').length : 0, big = Math.max(0, Math.round(randi(0, 2) * Math.min(area, 1.6)) - (obsRock > 2 ? 1 : 0));
      for (let i = 0; i < big; i++) { const p = spot(40, 20); if (p) { stamp(g, DECO_MAPS.rockBig, DECO, p.x, p.y, 2, Math.random() < 0.5); if (Math.random() < 0.6) stamp(g, DECO_MAPS.rockB, DECO, p.x + pick([-18, 24]), p.y + randi(5, 8) * 2, 2); } }
      const clumps = Math.max(0, Math.round(randi(1, 3) * Math.min(area, 1.6)) - Math.floor(obsRock / 3));
      for (let i = 0; i < clumps; i++) { const p = spot(24, 10); if (!p) continue; const m = randi(1, 3);
        for (let j = 0; j < m; j++) { const x = p.x + (j ? randi(-9, 9) * 2 : 0), y = p.y + (j ? randi(-5, 5) * 2 : 0); if (j && !decFree(x, y, 6)) continue; stamp(g, DECO_MAPS[pick(j ? ['rockB', 'rockA'] : ['rockA', 'rockC', 'rockD'])], DECO, x, y, 2, Math.random() < 0.5); } } }
    for (let i = 0; i < randi(0, 3) * area; i++) { const p = spot(30, 12); if (p) { stamp(g, DECO_MAPS.stump, woodPal(), p.x, p.y, 2); if (Math.random() < 0.5) gPaint(g, SHROOMS.brown, SHROOM_PAL, p.x + 14, p.y + 4); } }
    for (let i = 0; i < randi(0, 2) * area; i++) { const p = spot(40, 16); if (p) { stamp(g, DECO_MAPS.log, woodPal(), p.x, p.y, 2, Math.random() < 0.5); for (let k = 0; k < randi(1, 3); k++) gPaint(g, pick([SHROOMS.brown, SHROOMS.red, SHROOMS.tall]), SHROOM_PAL, p.x + 4 + k * 8, p.y - 8); } }
    for (let i = 0; i < randi(2, 6) * area; i++) { const p = spot(20, 10); if (p) stamp(g, DECO_MAPS.bush2, Object.assign({}, DECO, pick([{ '6': '#c03040' }, { '6': '#6a40a0' }, { '6': '#e0c040' }])), p.x, p.y, 2, Math.random() < 0.5); }
    // 버섯: 요정의 고리(종류·크기 무작위) 또는 흩어진 무리
    const kinds = ['red', 'brown', 'tall', 'glow'];
    if (Math.random() < 0.4) {
      const rx = randi(36, 80), ry = Math.round(rx * 0.62), c = spot(rx + 20, rx * 0.6);
      if (c) { const k1 = pick(kinds), k2 = pick(kinds), n = Math.round(rx / 5.5); for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-0.1, 0.1), k = Math.random() < 0.8 ? k1 : k2, x = c.x + Math.cos(a) * rx, y = c.y + Math.sin(a) * ry; gPaint(g, SHROOMS[k], SHROOM_PAL, x - 5, y - 10); if (k === 'glow' && i % 3 === 0) fl.push({ x, y: y - 4, r: 34, a: 0.35, c: '120,230,255', ca: 0.12 }); } }
    }
    for (let i = 0; i < randi(1, 5) * area; i++) { const p = spot(20, 10); if (!p) continue; const k = pick(kinds); for (let j = 0; j < randi(2, 5); j++) gPaint(g, SHROOMS[k], SHROOM_PAL, p.x + randi(-10, 10), p.y + randi(-6, 6)); if (k === 'glow') fl.push({ x: p.x, y: p.y, r: 40, a: 0.4, c: '120,230,255', ca: 0.14 }); }
    if (Math.random() < 0.45) { const p = spot(40, 24); if (p && !onPath(p.x, p.y, 52)) { const sp = SPRINGS.springS; gPaint(g, sp, POND_PAL, p.x - sp[0].length, p.y - sp.length); } }
    // 이야기 소품: 꺼진 모닥불, 짐승 뼈, 부서진 수레바퀴, 거미줄, 룬 비석, 허수아비
    if (Math.random() < 0.35) { const p = spot(40, 20); if (p) { gPaint(g, fromRows(PROP_MAPS.campfire[0]), PROP_MAPS.campfire[1], p.x - 12, p.y - 6); fl.push({ x: p.x, y: p.y, r: 30, a: 0.3, c: '255,120,50', ca: 0.14, flick: true }); for (let k = 0; k < 2; k++) gPaint(g, STONEPAD, STONEPAD_PAL, p.x + pick([-30, 22]), p.y + randi(-4, 8)); } }
    if (Math.random() < 0.4) { const p = spot(30, 10); if (p) gPaint(g, fromRows(PROP_MAPS.deerSkull[0]), PROP_MAPS.deerSkull[1], p.x, p.y); }
    if (Math.random() < 0.4) { const p = spot(30, 10); if (p) gPaint(g, BONES, PROP_MAPS.deerSkull[1], p.x, p.y); }
    if (Math.random() < 0.25) { const p = spot(30, 10); if (p) gPaint(g, fromRows(PROP_MAPS.wheel[0]), PROP_MAPS.wheel[1], p.x, p.y); }
    if (Math.random() < 0.5) { const left = Math.random() < 0.5, web = genWeb(); gPaint(g, left ? web : web.map(r => r.slice().reverse()), { w: 'rgba(200,200,215,.55)', W: 'rgba(230,230,240,.75)' }, left ? A.x0 + 2 : A.x1 - 26, A.y0 + 2); }
    if (Math.random() < 0.4) { const p = spot(40, 14); if (p) { stamp(g, DECO_MAPS.rune, DECO, p.x, p.y, 2); fl.push({ x: p.x + 6, y: p.y + 12, r: 30, a: 0.25, c: '255,60,60', ca: 0.1 }); } }
    if (Math.random() < 0.35) { const p = spot(60, 20); if (p) stamp(g, DECO_MAPS.scarecrow, DECO, p.x, p.y - 30, 2, Math.random() < 0.5); }
  }
  // 초원 길 모양: 구불길·곧은길·갈림길·교차·징검돌·개울·없음
  // meadowCurves: 04_monsters.js에서 불러올 때 먼저 써서 그쪽으로 옮김
  // 흙길 한 칸 색: 가운데는 흙, 가장자리로 갈수록 흙 점이 성겨지며 풀색과 디더링으로 섞인다 (null = 칠하지 않음, 풀 그대로)
  // dirtCol: 04_monsters.js에서 불러올 때 먼저 써서 그쪽으로 옮김
  // 나무다리: 개울을 가로지르는 널판 (vertFlow = 개울이 세로로 흐름)
  function genBridge(vertFlow) {
    const L = 22, Wd = 12, g = mkGrid(vertFlow ? L : Wd, vertFlow ? Wd : L);
    for (let i = 0; i < L; i++) for (let j = 0; j < Wd; j++) {
      const rail = j <= 1 || j >= Wd - 2, end = i === 0 || i === L - 1;
      let c = rail ? (j === 0 || j === Wd - 1 ? 'k' : (i % 6 === 0 ? 'k' : 'B')) : i % 3 === 2 ? 'k' : (i % 6 < 3 ? 'w' : 'b');
      if (!rail && i % 3 === 0 && (j === 3 || j === Wd - 4)) c = 'y';
      if (end && !rail) c = 'k';
      const x = vertFlow ? i : j, y = vertFlow ? j : i; g[y][x] = c;
    }
    return g;
  }
  const BRIDGE_PAL = { k: '#0b0a0e', w: '#8a6a48', b: '#6a4a30', B: '#4a3220', y: '#a8a090' };
  // paintMeadowCurve: 04_monsters.js에서 불러올 때 먼저 써서 그쪽으로 옮김

  // ---------- 바닥 꾸미기: 성채
  function paintCastleDecor(g, R) {
    const fl = G ? (G.flatLights = []) : [];
    const busy = (x, y, r) => (R && obsHitL(R.obs, x, y, r)) || !decFree(x, y, Math.max(r, 6));
    const spot = (pad = 20, r = 10) => { for (let i = 0; i < 30; i++) { const x = rand(A.x0 + pad, A.x1 - pad), y = rand(A.y0 + pad, A.y1 - pad); if (!busy(x, y, r)) return { x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2 }; } return null; };
    const W0 = A.x1 - A.x0, H0 = A.y1 - A.y0, area = W0 * H0 / 540000, sh = R ? R.shape : 'hall';
    // 붉은 융단
    const cp = { hall: 0.55, greathall: 0.75, corridor: 0.7, corridorV: 0.7, chamber: 0 }[sh] || 0;
    let carpet = false; // v1.53 긴 융단을 깐 방엔 작은 깔개를 겹쳐 깔지 않음
    if (Math.random() < cp) { const D0 = DEC; DEC = null;
      // 융단이 기둥·잔해·벽·소품 밑으로 지나가면 깔지 않는다 (v0.59)
      const clear = (x0, y0, x1, y1) => !R || (!R.obs.some(o => o.c ? o.x + o.r > x0 - 4 && o.x - o.r < x1 + 4 && o.y + o.r > y0 - 4 && o.y - o.r * 1.6 < y1 + 4 : o.x1 > x0 - 4 && o.x0 < x1 + 4 && o.y1 > y0 - 4 && o.y0 - 30 < y1 + 4) && !(R.props || []).some(q => rectHit(propRect(q), { x0, y0, x1, y1 }, 4)));
      if (sh === 'corridorV' || (sh !== 'corridor' && R && R.doors.n != null && Math.random() < 0.45)) { const wd = sh === 'corridorV' ? 18 : 24, len = Math.floor((A.y1 - A.y0 - 20) / 2); if (clear(DOOR.n.x - wd, A.y0 + 6, DOOR.n.x + wd, A.y1 - 14)) carpet = true, gPaint(g, genCarpet(len, wd, true), CARPET_PAL, DOOR.n.x - wd, A.y0 + 6); }
      else { const wd = sh === 'corridor' ? 20 : 24, len = Math.floor((W0 - 60) / 2); if (clear(A.x0 + 30, CY - wd, A.x1 - 30, CY + wd)) carpet = true, gPaint(g, genCarpet(len, wd, false), CARPET_PAL, A.x0 + 30, CY - wd); }
      DEC = D0; }
    // 깔개: 원형(무늬 3종)·사각 문장 융단·해진 융단·팔각 별 무늬·짐승 가죽, 색 5종
    const nRug = sh === 'chamber' ? (Math.random() < 0.85 ? 1 : 0) : sh === 'greathall' ? randi(0, 2) : sh === 'hall' ? (Math.random() < 0.4 ? 1 : 0) : sh === 'corridorV' || sh === 'corridor' ? 0 : 0;
    for (let i = 0; i < (carpet ? 0 : nRug); i++) {
      const kind = pick(['round', 'rect', 'rect', 'torn', 'oct', 'pelt']), pal = pick(RUG_PALS);
      let grid, gp = pal;
      if (kind === 'round') { const rx = randi(24, 38); grid = genRugRound(rx, Math.round(rx * 0.6), randi(0, 2)); }
      else if (kind === 'rect' || kind === 'torn') grid = genRugRect(randi(30, 46), randi(18, 26), kind === 'torn');
      else if (kind === 'oct') grid = genRugOct(randi(18, 26));
      else { grid = Math.random() < 0.5 ? PELT : PELT.map(r => r.slice().reverse()); gp = PELT_PAL; }
      const p = spot(grid[0].length + 30, grid[0].length * 0.9); if (p) gPaint(g, grid, gp, p.x - grid[0].length, p.y - grid.length);
    }
    // 깨진 바닥판
    for (let i = 0; i < randi(2, 5) * area; i++) { const p = spot(20, 0); if (!p) continue; for (let k = 0; k < randi(4, 9); k++) { g.fillStyle = pick(['#121017', '#0b0a0e', '#3a3642']); g.fillRect(p.x + randi(-8, 8) * 2, p.y + randi(-4, 4) * 2, 2 * randi(1, 3), 2); } }
    // 핏자국 웅덩이 (도트)
    for (let i = 0; i < randi(0, 3) * area; i++) { const p = spot(30, 0); if (p) scatterPatch(g, p.x, p.y, randi(10, 22), randi(6, 12), ['#4a0c12', '#5a1016', '#3a080c'], 0.6); }
    // 뼈 · 해골
    for (let i = 0; i < randi(1, 4) * area; i++) { const p = spot(20, 6); if (p) gPaint(g, BONES, PROP_MAPS.deerSkull[1], p.x, p.y); }
    for (let i = 0; i < randi(0, 2) * area; i++) { const p = spot(20, 6); if (p) gPaint(g, fromRows(['.kkk.', 'kWWWk', 'kkWkk', 'kWWWk', '.kWk.']), PROP_MAPS.deerSkull[1], p.x, p.y); }
    // 바닥 촛불 무리 (벽 가까이)
    for (let i = 0; i < randi(0, 3); i++) { const x = rand(A.x0 + 30, A.x1 - 30), y = pick([A.y0 + 12, A.y1 - 14]); if (busy(x, y, 8)) continue; gPaint(g, CANDLES, { e: '#e8e0c8', E: '#bcb4a0', w: '#a49c8e', k: '#0b0a0e', o: '#ffc060' }, x, y - 10); fl.push({ x: x + 6, y: y - 6, r: 44, a: 0.45, c: '255,190,90', ca: 0.14, flick: true }); }
    // 잔해 조각
    for (let i = 0; i < 6 * area; i++) { const p = spot(10, 0); if (p) { g.fillStyle = pick(['#2a2731', '#3a3642', '#4d4858']); g.fillRect(p.x, p.y, 2 * randi(1, 3), 2 * randi(1, 2)); } }
  }
  // 성채 윗벽 장식: 창문 자리마다 창·태피스트리·방패·초상화·사슬·해골 벽감 중 하나
  function paintCastleWall(g) {
    const T0 = A.y0 - 100;
    for (let i = 0; i < PILLARS.length - 1; i++) {
      const mx = Math.round((PILLARS[i] + PILLARS[i + 1]) / 4) * 2;
      if (Math.abs(mx - DOOR.n.x) < 8 || (CUR_ROOM && CUR_ROOM.sealW && Math.abs(mx - DOOR.n.x) < 110)) continue; // v2.59 인장 벽 둘레엔 장식 없음
      const k = ROOMSTYLE.wall ? ROOMSTYLE.wall[i % ROOMSTYLE.wall.length] : 'window';
      if (k === 'window') continue;
      { const m0 = PROP_MAPS[k], g0 = fromRows(m0[0]), w0 = g0[0].length * 2, h0 = g0.length * 2, y0 = T0 + 30 - h0 / 2 + (k === 'tapestry' ? 6 : 0); if (typeof OCC !== 'undefined' && !OCC.wall(mx - w0 / 2, y0, w0, h0)) continue; } // v2.85 벽 장식은 앞에 선 소품 · 장애물 그림과 겹치면 걸지 않음
      // 창을 벽돌로 덮고 장식을 건다
      g.fillStyle = '#121017'; g.fillRect(mx - 14, T0 + 2, 28, 40);
      for (let y = T0 + 2; y < T0 + 42; y += 8) for (let x = mx - 14 + ((y / 8) % 2) * 9 - 9; x < mx + 14; x += 18) { g.fillStyle = '#2a2731'; g.fillRect(Math.max(mx - 14, x), y, Math.min(17, mx + 14 - Math.max(mx - 14, x)), 7); }
      const m = PROP_MAPS[k];
      const grid = fromRows(m[0]), w = grid[0].length * 2, h = grid.length * 2;
      gPaint(g, grid, m[1], mx - w / 2, T0 + 30 - h / 2 + (k === 'tapestry' ? 6 : 0));
    }
  }
  // ================================================================ v1.55 맵 분위기 (모두 2px 칸 단위 · 디더는 그늘에만)
  // 챕터1: 구름 그림자 · 반딧불이 깜빡임 · 날리는 꽃씨 · 연못 물고기 / 챕터2: 달빛 줄기+먼지 · 횃불 3단계 일렁임 · 쥐 · 물방울
  // 챕터3: 횃불 불티 · 연기 · 울타리 위 까마귀 / 챕터4: 재 눈(절반) · 성벽 너머 잉걸 섬광 · 화로·횃불 불꽃 3단계 + 연기
  const AMB = { room: null, s: null };
  const BAY4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let CLOUD_CV = null;
  function cloudStamp() { // 구름 그림자: 가운데로 갈수록 칸이 촘촘한 디더 그늘 (검은 2px 칸만)
    if (CLOUD_CV) return CLOUD_CV;
    const W = 170, H = 74, [cv, g] = mkCanvas(W * 2, H * 2); g.fillStyle = '#000';
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const e = ((x - W / 2) / (W / 2)) ** 2 + ((y - H / 2) / (H / 2)) ** 2 + 0.12 * Math.sin(x * 0.21) * Math.cos(y * 0.33); if (e < 1 && Math.min(1, (1 - e) * 1.7) * 16 > BAY4[(y & 3) * 4 + (x & 3)]) g.fillRect(x * 2, y * 2, 2, 2); }
    return (CLOUD_CV = cv);
  }
  const aS2 = v => Math.round(v / 2) * 2, hsh = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  const crowX = () => { for (let t = 0; t < 20; t++) { const x = aS2(rand(A.x0 + 60, A.x1 - 60)); if (TORCHES.every(tc => Math.abs(tc.x - x) > 20) && Math.abs(x - DOOR.n.x) > 40) return x; } return aS2(A.x0 + 90); }; // 울타리 가로대 위
  function ambState() {
    const R = G.dun && G.dun.cur; if (!R || G.dun.forge || G.dun.home) return null;
    if (AMB.room === R) return AMB.s;
    AMB.room = R; const st = G.stage, S = AMB.s = { st, t0: time };
    if (st === 1) {
      S.clouds = [0, 1].map(i => ({ x: A.x0 - 340 - i * 620 + rand(0, 200), y: rand(A.y0 + 40, A.y1 - 160), v: rand(10, 14) }));
      S.seeds = Array.from({ length: 9 }, () => ({ x: rand(0, VW), y: rand(0, VH), c: pick(['#f0ecdc', '#f0b4d2', '#f0ecdc', '#e8d890']), p: rand(0, 6) }));
      S.ponds = (R.obs || []).filter(b => b.pool); S.fish = null; S.nextFish = time + rand(3, 7);
    } else if (st === 2) {
      const xs = PILLARS.slice(0, -1).map((x, i) => (x + PILLARS[i + 1]) / 2).filter(x => !R.sealW || x < DOOR.n.x - 150 || x > DOOR.n.x + 100); S.beams = []; // v2.64 달빛 줄기가 인장 벽을 가리지 않게
      for (const x of xs) if (hsh(x, R.x || 0) < 0.45) S.beams.push({ x: aS2(x - 30), motes: Array.from({ length: 7 }, () => ({ u: rand(0, 40), v: rand(0, 1), p: rand(0, 9) })) });
      if (!S.beams.length && xs.length) S.beams.push({ x: aS2(xs[1 % xs.length] - 30), motes: Array.from({ length: 7 }, () => ({ u: rand(0, 40), v: rand(0, 1), p: rand(0, 9) })) });
      S.hole = aS2(rand(A.x0 + 60, A.x1 - 60)); S.rat = null; S.nextRat = time + rand(2, 6); S.drips = []; S.nextDrip = time + rand(1, 3);
    } else if (st === 3) {
      S.crow = { x: crowX(), y: A.y0 - 30, state: 'perch', t: 0 }; S.nextCrow = 0;
      S.embers = []; S.smoke = [];
    } else if (st === 4) { S.smoke = []; }
    return S;
  }
  // 어둠보다 아래(세계 좌표): 구름 그림자 · 물고기 · 쥐 · 물방울 · 연기 · 까마귀
  function ambBack() {
    const S = ambState(); if (!S) return; const st = S.st, P = G.player;
    if (st === 1) {
      ctx.save(); ctx.globalAlpha = 0.3;
      for (const c of S.clouds) { const x = aS2(c.x + (time - S.t0) * c.v); if (x > A.x1 + 40) c.x -= (A.x1 - A.x0) + 760; ctx.drawImage(cloudStamp(), x, aS2(c.y)); }
      ctx.restore();
      if (S.ponds.length && !S.fish && time > S.nextFish) { const b = pick(S.ponds); S.fish = { x: aS2(b.x + rand(-b.w * 0.2, b.w * 0.2)), y: aS2(b.y + rand(-b.h * 0.15, b.h * 0.15)), t: time, d: Math.random() < 0.5 ? 1 : -1 }; }
      if (S.fish) { const f = S.fish, k = Math.floor((time - f.t) / 0.1);
        if (k < 6) { const a = [[0, 0], [1, -3], [3, -5], [5, -5], [7, -3], [8, 0]][k]; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(f.x + (a[0] * f.d - f.d) * 2, f.y + a[1] * 2, 2, 2); ctx.fillStyle = '#e6aa5a'; ctx.fillRect(f.x + a[0] * f.d * 2, f.y + a[1] * 2, 2, 2); ctx.fillStyle = '#c8783c'; ctx.fillRect(f.x + (a[0] * f.d + f.d) * 2, f.y + a[1] * 2, 2, 2); }
        for (const [kk, cx] of [[k, f.x], [k - 6, f.x + 16 * f.d]]) if (kk >= 0 && kk < 4) { ctx.fillStyle = kk < 2 ? '#7a98c0' : '#3e5a82'; const r = kk + 1; for (let a = 0; a < 12; a++) { const an = a / 12 * Math.PI * 2; ctx.fillRect(aS2(cx + Math.cos(an) * r * 3.2), aS2(f.y + 2 + Math.sin(an) * r * 1.4), 2, 2); } }
        if (k > 11) { S.fish = null; S.nextFish = time + rand(5, 11); } }
    } else if (st === 2) {
      const wy = A.y0 + 4; ctx.fillStyle = '#060508'; ctx.fillRect(S.hole, wy - 2, 6, 4); ctx.fillStyle = '#1a161e'; ctx.fillRect(S.hole - 2, wy - 4, 10, 2);
      if (!S.rat && time > S.nextRat) { const fromR = Math.random() < 0.5; S.rat = { x: aS2(fromR ? Math.min(A.x1 - 20, S.hole + rand(200, 420)) : Math.max(A.x0 + 20, S.hole - rand(200, 420))), d: fromR ? -1 : 1 }; }
      if (S.rat) { const r = S.rat; if (Math.floor(time * 30) % 2 === 0) r.x += r.d * 4; const leg = Math.floor(time * 15) % 2, d = r.d, X = r.x, Y = wy;
        if ((X - S.hole) * d >= 0) { S.rat = null; S.nextRat = time + rand(8, 15); }
        else { const C = (dx, dy, c) => { ctx.fillStyle = c; ctx.fillRect(X + dx * 2 * d, Y + dy * 2, 2, 2); };
          C(-2, 0, '#5a504c'); C(-3, 0 + leg, '#5a504c'); C(-1, 0, '#6e625c'); C(0, 0, '#6e625c'); C(1, 0, '#6e625c'); C(0, -1, '#5a504c'); C(2, 0, '#c87884'); C(1, -1, '#0b0a0e');
          C(0, 1 - leg, '#0b0a0e'); C(-1, leg, '#0b0a0e'); } }
      if (time > S.nextDrip) { S.drips.push({ x: aS2(rand(Math.max(A.x0, CAMX), Math.min(A.x1, CAMX + VW))), y0: A.y0 - 14, y1: aS2(A.y0 + rand(30, 150)), t: time }); S.nextDrip = time + rand(1.6, 3.4); }
      for (let i = S.drips.length - 1; i >= 0; i--) { const d = S.drips[i], el = time - d.t, fall = (d.y1 - d.y0) / 180;
        if (el < fall) { const y = aS2(d.y0 + el * 180); ctx.fillStyle = '#5a6e8c'; ctx.fillRect(d.x, y - 2, 2, 2); ctx.fillStyle = '#96aac8'; ctx.fillRect(d.x, y, 2, 2); }
        else { const k = Math.floor((el - fall) / 0.09); if (k > 3) { S.drips.splice(i, 1); continue; } ctx.fillStyle = k < 2 ? '#50648a' : '#323c54'; const r = k + 1; for (let a = 0; a < 8; a++) { const an = a / 8 * Math.PI * 2; ctx.fillRect(aS2(d.x + Math.cos(an) * r * 3), aS2(d.y1 + Math.sin(an) * r * 1.2), 2, 2); } } }
    } else if (st === 3 || st === 4) {
      // 연기: 3칸 → 2칸 → 1칸으로 줄며 오름 (녹아 사라지지 않음)
      TORCHES.forEach((tc, i) => { for (let n = 0; n < 2; n++) { const a = Math.floor((time * 6 + i * 5 + n * 8)) % 16, sz = a < 6 ? 3 : a < 11 ? 2 : a < 14 ? 1 : 0; if (!sz) continue;
        const x = aS2(tc.x - 2 + Math.floor(a / 5) * 2 * (i % 2 ? 1 : -1)), y = aS2(tc.y - 10 - a * 2);
        for (let dy = 0; dy < sz; dy++) for (let dx = 0; dx < sz; dx++) { ctx.fillStyle = (dx + dy) % 2 ? '#3e322c' : '#5a4a40'; ctx.fillRect(x + dx * 2, y + dy * 2, 2, 2); } } });
      if (st === 3) { // 울타리 위 까마귀: 두리번대다 플레이어가 다가오면 날아감, 한참 뒤 다른 자리에 다시 앉음
        const c = S.crow;
        if (c.state === 'perch' && Math.abs(P.x - c.x) < 100 && P.y < A.y0 + 90) { c.state = 'fly'; c.t = time; c.d = P.x < c.x ? 1 : -1; }
        if (c.state === 'gone' && time > c.t) { c.x = crowX(); c.state = Math.hypot(P.x - c.x, P.y - c.y) > 160 ? 'perch' : 'gone'; c.t = time + 2; }
        const B = (dx, dy, col) => { ctx.fillStyle = col; ctx.fillRect(dx, dy, 2, 2); };
        if (c.state === 'perch') { const fl = Math.floor(time / 1.1 + c.x) % 3 === 0 ? -1 : 1, X = c.x, Y = c.y;
          for (const [x, y] of [[0, 0], [1, 0], [2, 0], [3, 0], [1, -1], [2, -1], [0, 1], [3, 1], [-1, 0]]) B(X + x * 2 * fl, Y + y * 2, '#1a161e');
          B(X + 4 * 2 * fl, Y - 2, '#1a161e'); B(X + 3 * 2 * fl, Y - 2, '#d84a32'); B(X + 5 * 2 * fl, Y - 2, '#c8a040'); }
        else if (c.state === 'fly') { const k = Math.floor((time - c.t) / 0.07), X = c.x + k * 8 * c.d, Y = c.y - k * 4, w = k % 2 ? -1 : 1;
          for (const [x, y] of [[0, 0], [1, 0], [2, 0], [-1, -w], [3, -w], [-2, -2 * w], [4, -2 * w]]) B(aS2(X) + x * 2 * c.d, aS2(Y) + y * 2, '#1a161e');
          if (k > 26) { c.state = 'gone'; c.t = time + rand(14, 24); } }
      }
    }
  }
  // 어둠보다 위(세계 좌표): 꽃씨 · 달빛 줄기 · 불티 · 잉걸 섬광 — 빛나는 것들
  function ambFront() {
    const S = ambState(); if (!S) return; const st = S.st;
    if (st === 1) { // 바람에 날리는 꽃씨·꽃잎 (0.1초마다 한 칸씩)
      const k = Math.floor(time * 10);
      for (const sd of S.seeds) { const x = ((aS2(sd.x) + k * 2) % (VW + 40) + VW + 40) % (VW + 40) - 20, y = ((aS2(sd.y) + (Math.floor(k / 4 + sd.p) % 3) * 2 - Math.floor(k / 8) * 2) % VH + VH) % VH;
        ctx.fillStyle = sd.c; ctx.fillRect(aS2(CAMX) + x, aS2(CAMY) + y, 2, 2); }
    } else if (st === 2) { // 높은 창의 달빛 줄기 (디더 없이 같은 세기, 가장자리는 칸 계단) + 그 안을 떠도는 먼지
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const b of S.beams) { const y0 = A.y0 - 100, L = 330; // v1.62 성벽 맨 위(맵 끝)에서 시작
        if (!AMB.beam) { const [bc, bg] = mkCanvas(44 + aS2(L * 0.55) + 2, L); for (let y = 0; y < L; y += 2) { bg.fillStyle = y < L - 50 ? 'rgba(70,84,130,.13)' : 'rgba(70,84,130,.07)'; bg.fillRect(aS2(y * 0.55), y, 44, 2); } AMB.beam = bc; }
        ctx.drawImage(AMB.beam, b.x, y0);
        for (const m of b.motes) { const v = ((m.v * L + Math.floor(time * 2.5 + m.p) * 2) % L), u = m.u + (Math.floor(time * 1.3 + m.p) % 2) * 2; ctx.fillStyle = Math.floor(time * 2 + m.p) % 7 ? 'rgba(190,200,230,.75)' : 'rgba(120,130,160,.6)'; ctx.fillRect(b.x + aS2(v * 0.55) + aS2(u), y0 + aS2(v), 2, 2); } }
      ctx.restore();
    } else if (st === 3) { // 횃불 불티: 칸 단위로 솟으며 식어감
      TORCHES.forEach((tc, i) => { for (let n = 0; n < 4; n++) { const ph = hsh(i, n) * 12, a = Math.floor(time * 9 + ph) % 12, dr = Math.round(hsh(n, i) * 2) - 1;
        ctx.fillStyle = a < 5 ? '#ffbe50' : a < 9 ? '#dc5a1e' : '#783214'; ctx.fillRect(aS2(tc.x + dr * Math.floor(a / 4) * 2 + (Math.floor(a / 2) % 2) * 2), aS2(tc.y - 8 - a * 2), 2, 2); } });
    } else if (st === 4) { // 성벽 너머 하늘의 잉걸 섬광: 가끔 두 번 번쩍 (계단식 세기)
      const c = (time % 9), lv = c < 0.12 ? 3 : c < 0.24 ? 5 : c < 0.36 ? 3 : c < 0.48 ? 1 : c > 1.2 && c < 1.32 ? 2 : c > 1.32 && c < 1.44 ? 4 : c > 1.44 && c < 1.56 ? 2 : 0;
      if (lv) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let r = 0; r < 7; r++) { ctx.fillStyle = `rgba(255,110,30,${(lv * (7 - r) / 7 * 0.035).toFixed(3)})`; ctx.fillRect(A.x0 - 40, A.y0 - 96 + r * 8, A.x1 - A.x0 + 80, 8); } ctx.restore(); }
    }
  }
  function drawFireflies() {
    if (G.stage !== 1 || !G.flies) return;
    for (const f of G.flies) {
      const tq = Math.floor(time * 4) / 4, x = aS2(f.x + Math.sin(tq * f.s + f.p) * f.rx), y = aS2(f.y + Math.sin(tq * f.s * 1.3 + f.p * 2) * f.ry), ph = Math.floor(time * 3 + f.p * 3) % 9; // v1.55
      if (ph >= 5) continue; f.cx = x; f.cy = y;
      if (ph === 1 || ph === 2) { ctx.fillStyle = 'rgba(200,255,120,.35)'; ctx.fillRect(x - 2, y, 6, 2); ctx.fillRect(x, y - 2, 2, 6); }
      ctx.fillStyle = ph === 1 || ph === 2 ? '#e8ff8a' : '#86b84a'; ctx.fillRect(x, y, 2, 2);
    }
  }
  // ---------------------------------------------------------------- 적 투사체 (v0.37): 조명 위에 2px 도트로, 검은 외곽선 + 밝은 심 + 깜빡이는 테두리 + 잔상
  // ================================================================ v1.17 최적화: 칸 무더기를 한 장으로 모아 그리기
  // fillRect를 수백 번 부르던 이펙트(텔레포터 빛기둥·보물 기둥·깃발·버프 고리)를 메모리 버퍼에 칠한 뒤 drawImage 한 번으로. 겉모습은 같음
  // __proto.opt = false 로 끄면 예전처럼 fillRect로 바로 그림 (같은 화면 비교용)
  let OPT = true;
  const LY = { buf: null, cap: 0, cv: null, g: null, imgs: new Map() };
  function pxLayer(x0, y0, w, h, add) {
    x0 = Math.floor(x0); y0 = Math.floor(y0); w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
    if (!OPT) return { rect(x, y, rw, rh, r, g, b, a) { ctx.fillStyle = `rgba(${r},${g},${b},${a})`; ctx.fillRect(x, y, rw, rh); }, flush() {} };
    const n = w * h * 4; if (LY.cap < n) { LY.buf = new Float32Array(n); LY.cap = n; } else LY.buf.fill(0, 0, n);
    const B = LY.buf; let any = false;
    return {
      rect(x, y, rw, rh, r, g, b, a) {
        if (a <= 0) return; any = true;
        let xa = Math.max(0, x - x0), ya = Math.max(0, y - y0); const xb = Math.min(w, x - x0 + rw), yb = Math.min(h, y - y0 + rh);
        const pr = r * a, pg = g * a, pb = b * a, ia = 1 - a;
        for (let yy = ya; yy < yb; yy++) for (let xx = xa, i = (yy * w + xa) * 4; xx < xb; xx++, i += 4) {
          if (add) { B[i] += pr; B[i + 1] += pg; B[i + 2] += pb; B[i + 3] += a; }
          else { B[i] = pr + B[i] * ia; B[i + 1] = pg + B[i + 1] * ia; B[i + 2] = pb + B[i + 2] * ia; B[i + 3] = a + B[i + 3] * ia; }
        }
      },
      flush() {
        if (!any) return;
        const key = w + 'x' + h; let img = LY.imgs.get(key); if (!img) { if (LY.imgs.size > 48) LY.imgs.clear(); img = new ImageData(w, h); LY.imgs.set(key, img); }
        const d = img.data;
        for (let i = 0; i < n; i += 4) { const A = B[i + 3]; if (A <= 0) { d[i + 3] = 0; continue; } const k = 1 / A; d[i] = B[i] * k; d[i + 1] = B[i + 1] * k; d[i + 2] = B[i + 2] * k; d[i + 3] = (A > 1 ? 1 : A) * 255; }
        if (!LY.cv || LY.cv.width < w || LY.cv.height < h) { [LY.cv, LY.g] = mkCanvas(Math.max(w, LY.cv ? LY.cv.width : 0), Math.max(h, LY.cv ? LY.cv.height : 0)); }
        LY.g.putImageData(img, 0, 0); ctx.drawImage(LY.cv, 0, 0, w, h, x0, y0, w, h);
      } };
  }
  const RGBN = new Map(); // 'r,g,b' 문자열 → 숫자 배열
  const rgbN = c => { let v = RGBN.get(c); if (!v) { v = c.split(',').map(Number); RGBN.set(c, v); } return v; };
  const HEXN = new Map();
  const hexN = c => { let v = HEXN.get(c); if (!v) { v = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; HEXN.set(c, v); } return v; };
  // 둥근 판(투사체 등): 반지름·색·좌표 짝홀마다 한 번만 칠해 두고 붙임
  const DISC = new Map();
  function pxDisc(cx, cy, r, col) {
    const rx = Math.round(cx), ry = Math.round(cy);
    if (!OPT) { ctx.fillStyle = col; const R = r * r; for (let y = -r; y <= r; y += 2) for (let x = -r; x <= r; x += 2) if (x * x + y * y <= R + 1) ctx.fillRect((Math.round(cx + x)) & ~1, (Math.round(cy + y)) & ~1, 2, 2); return; }
    const px = rx & 1, py = ry & 1, key = r + '|' + col + '|' + px + py; let e = DISC.get(key);
    if (!e) { const S = 2 * r + 6, [c, g] = mkCanvas(S, S), o = r + 2, R = r * r; g.fillStyle = col; let minX = 1e9, minY = 1e9;
      for (let y = -r; y <= r; y += 2) for (let x = -r; x <= r; x += 2) if (x * x + y * y <= R + 1) { const X = ((px + x) & ~1), Y = ((py + y) & ~1); g.fillRect(X + o, Y + o, 2, 2); }
      e = { c, o }; if (DISC.size > 200) DISC.clear(); DISC.set(key, e); }
    ctx.drawImage(e.c, rx - px - e.o, ry - py - e.o);
  }

  // v1.05 투사체·방향 화살표 도트 (회전은 rotW가 칸 단위로)
  const PROJ_W = (() => {
    const arrow = head => cellWeapon(14, 5, 7, 2, { k: '#0b0a0e', w: '#d8bd82', W: '#a8875a', m: head, M: '#ffffff', r: '#a92c30', R: '#e85a48' }, put => {
      for (let x = 2; x <= 9; x++) put(x, 2, 'w'); put(1, 2, 'W'); for (const y of [1, 2, 3]) put(10, y, 'm'); put(11, 2, 'm'); put(12, 2, 'M');
      for (const y of [1, 3]) { put(0, y, 'r'); put(1, y, 'r'); put(2, y, 'R'); } });
    const spear = head => cellWeapon(20, 5, 9, 2, { k: '#0b0a0e', o: '#9a673d', O: '#6a4428', g: '#d7a653', m: head, M: '#f0e5c8' }, put => {
      for (let x = 0; x <= 12; x++) put(x, 2, x === 0 ? 'O' : 'o'); for (const x of [6, 9]) for (const y of [1, 2, 3]) put(x, y, 'g');
      for (const y of [1, 2, 3]) { put(13, y, 'm'); put(14, y, 'm'); } put(15, 1, 'm'); put(15, 2, 'M'); put(15, 3, 'm'); put(16, 2, 'm'); put(17, 2, 'M'); });
    return { arrow: arrow('#c8ccd4'), arrowB: arrow('#ffffff'), spear: spear('#c8cbd0'), spearB: spear('#fff4dc') };
  })();
  const TRI_W = {}, triW = (col, n) => TRI_W[col + n] || (TRI_W[col + n] = cellWeapon(n + 2, n * 2 + 3, 1 + (n >> 1), n + 1, { k: '#000000', c: `rgb(${col})` }, put => { for (let x = 0; x <= n; x++) for (let y = -(n - x); y <= n - x; y++) put(x + 1, n + 1 + y, 'c'); }));
  function drawEProjs() {
    const blink = Math.floor(time * 14) % 2;
    for (const pr of G.eproj) {
      const gx = Math.round(pr.x) & ~1, gy = Math.round(pr.y) & ~1, hy = pr.y - 10;
      // 바닥 그림자 (날아가는 높이를 보여 준다)
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(gx - 4, gy, 8, 2); ctx.fillRect(gx - 2, gy - 2, 4, 2);
      if (pr.kind === 'arrow' || pr.kind === 'spear') {
        drawBlade(pr.kind === 'arrow' ? (blink ? PROJ_W.arrowB : PROJ_W.arrow) : (blink ? PROJ_W.spearB : PROJ_W.spear), gx, hy, pr.ang); // v1.05 칸 단위 회전 도트 (투척꾼은 다시 투창)
        continue;
      }
      if (pr.kind === 'ember') { const I = invInit(); pr.hist.forEach((q, i) => { if (i % 2) return; ctx.fillStyle = `rgba(255,140,50,${0.45 * (i + 1) / pr.hist.length})`; ctx.fillRect(Math.round(q.x) & ~1, Math.round(q.y - 10) & ~1, 2, 2); }); drawBlade(blink ? I.emberB : I.ember, gx, hy, pr.ang); continue; } // v1.65 총잡이 잉걸 탄
      if (pr.kind === 'crescent') { const I = invInit(); drawBlade(blink ? I.crescentB : I.crescent, gx, hy, pr.ang); continue; } // v1.59 낫잡이 초승달 탄
      if (pr.kind === 'quill') {
        const ux = Math.cos(pr.ang), uy = Math.sin(pr.ang), L = 12;
        ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let k = L; k < L + 14; k += 2) ctx.fillRect(Math.round(pr.x - ux * k) & ~1, Math.round(hy - uy * k) & ~1, 2, 2);
        ctx.fillStyle = '#0b0a0e'; for (let k = 0; k <= L; k += 2) ctx.fillRect((Math.round(pr.x - ux * k) & ~1) - 2, (Math.round(hy - uy * k) & ~1) - 2, 6, 6);
        ctx.fillStyle = '#fff4dc'; for (let k = 2; k <= L; k += 2) ctx.fillRect((Math.round(pr.x - ux * k) & ~1) - 1, (Math.round(hy - uy * k) & ~1) - 1, 4, 4);
        ctx.fillStyle = blink ? '#ffffff' : '#ffc890'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 6, 6);
        continue;
      }
      if (pr.kind === 'tear') { // v1.30 왕비의 잉걸 눈물: 검은 외곽선 물방울 + 꼬리
        const ux = Math.cos(pr.ang), uy = Math.sin(pr.ang);
        pr.hist.forEach((q, i) => { ctx.fillStyle = `rgba(255,140,60,${0.4 * (i + 1) / pr.hist.length})`; ctx.fillRect(Math.round(q.x) & ~1, Math.round(q.y - 10) & ~1, 2, 2); });
        ctx.fillStyle = '#0b0a09'; ctx.fillRect(gx - 4, (Math.round(hy) & ~1) - 4, 8, 8); ctx.fillRect((Math.round(pr.x - ux * 6) & ~1) - 2, (Math.round(hy - uy * 6) & ~1) - 2, 6, 6);
        ctx.fillStyle = '#ff7a30'; ctx.fillRect(gx - 2, (Math.round(hy) & ~1) - 2, 4, 4); ctx.fillRect(Math.round(pr.x - ux * 6) & ~1, Math.round(hy - uy * 6) & ~1, 2, 2);
        ctx.fillStyle = blink ? '#ffffff' : '#ffc070'; ctx.fillRect(gx - 2, (Math.round(hy) & ~1) - 2, 2, 2);
        continue;
      }
      if (pr.kind === 'rock') {
        pr.hist.forEach((q, i) => { ctx.fillStyle = `rgba(200,190,170,${0.25 * (i + 1) / pr.hist.length})`; ctx.fillRect(Math.round(q.x) & ~1, Math.round(q.y - 10) & ~1, 2, 2); });
        pxDisc(pr.x, hy, 9, '#0b0a0e'); pxDisc(pr.x, hy, 7, blink ? '#d0c8d8' : '#9a94a4'); pxDisc(pr.x, hy, 5, '#7a7484'); ctx.fillStyle = '#d0c8d8'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 4, 2);
        if (blink) { ctx.fillStyle = '#ffffff'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 2, 2); }
        continue;
      }
      const green = pr.kind === 'acid' || pr.kind === 'bile';
      const body = green ? (pr.kind === 'bile' ? '#c8e040' : '#80e040') : '#ff3048', rim = green ? '#f0ffb0' : '#ffd0d8', trail = green ? '150,230,60' : '255,60,80';
      pr.hist.forEach((q, i) => { const k = (i + 1) / pr.hist.length; ctx.fillStyle = `rgba(${trail},${0.55 * k})`; const rr = Math.max(2, Math.round(pr.r * k)); ctx.fillRect((Math.round(q.x) & ~1) - (rr & ~1) / 2, (Math.round(q.y - 10) & ~1) - (rr & ~1) / 2, rr & ~1 || 2, rr & ~1 || 2); });
      const r = Math.max(4, Math.round(pr.r + 1));
      pxDisc(pr.x, hy, r + 3, '#0b0a0e');
      pxDisc(pr.x, hy, r + 1, blink ? rim : body);
      pxDisc(pr.x, hy, r - 1, body);
      ctx.fillStyle = '#ffffff'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 4, 4);
    }
  }
  // v2.64 키캡 한 개: DOM .key와 같은 크기 (글자 폭 + 8 × 11, 글자 8px Galmuri7 · 정수 좌표라 글자가 깨지지 않음). (X, Y)는 왼쪽 위
  function keyCap(c, X, Y, key, off) {
    c.font = '8px Galmuri7'; X = Math.round(X); Y = Math.round(Y);
    const tw = Math.round(c.measureText(key).width), w = Math.max(11, tw + 8), H = 11;
    c.fillStyle = '#000'; c.fillRect(X, Y, w, H);
    c.fillStyle = off ? '#241b2b' : '#f2d78c'; c.fillRect(X + 1, Y + 1, w - 2, H - 2);
    c.fillStyle = off ? '#4a3d52' : '#fff4c8'; c.fillRect(X + 1, Y + 1, w - 2, 1);
    c.fillStyle = off ? '#0a070c' : '#a8883a'; c.fillRect(X + 1, Y + H - 2, w - 2, 1);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = off ? '#9a8ea5' : '#1a1208'; c.fillText(key, X + Math.floor((w - tw) / 2), Y + 9);
    return w;
  }
  // v2.62 F 키 안내 공통 모양: 금빛 키캡 + 글자, 어두운 판 + 금 테
  function drawKeyTag(c, x, y, key, label, o = {}) {
    c.save(); c.textBaseline = 'alphabetic';
    c.font = '9px Galmuri9'; const lw = label ? Math.round(c.measureText(label).width) : 0;
    c.font = '8px Galmuri7'; const kw = Math.max(11, Math.round(c.measureText(key).width) + 8);
    const gap = label ? 4 : 0, w = 4 + kw + gap + lw + 6, X = Math.round(o.left ? x : x - w / 2), Y = Math.round(y) - 11, H = 15;
    if (!o.bare) { c.fillStyle = 'rgba(10,8,14,.88)'; c.fillRect(X, Y, w, H); c.strokeStyle = o.border || '#c9a24a'; c.lineWidth = 1; c.strokeRect(X + 0.5, Y + 0.5, w - 1, H - 1); }
    keyCap(c, X + 4, Y + 2, key, !!o.capOff);
    if (label) { c.font = '9px Galmuri9'; c.textAlign = 'left'; c.fillStyle = o.color || '#ffe9b0'; c.fillText(label, X + 4 + kw + gap, Y + 11); }
    c.restore();
    return w;
  }
  // v2.63 키 안내 한 줄: [['TAB','지도'],['ENTER','이동'],'문장'] → 키캡 + 글자 (o.align: center|right|left). y는 글자 기준선
  function drawKeyRow(c, x, y, items, o = {}) {
    const seg = [], gap = 8; let W = 0;
    c.save(); c.textBaseline = 'alphabetic'; c.font = '8px Galmuri7';
    for (const it of items) { if (typeof it === 'string') { const w = Math.round(c.measureText(it).width); seg.push({ t: it, w }); W += w + gap; }
      else { const kw = Math.max(11, Math.round(c.measureText(it[0]).width) + 8), lw = it[1] ? Math.round(c.measureText(it[1]).width) + 3 : 0; seg.push({ k: it[0], l: it[1], kw, w: kw + lw }); W += kw + lw + gap; } }
    W -= gap; let X = Math.round(o.align === 'right' ? x - W : o.align === 'left' ? x : x - W / 2); const Y = Math.round(y);
    if (o.box) { c.fillStyle = 'rgba(10,8,14,.8)'; c.fillRect(X - 5, Y - 11, W + 10, 15); }
    for (const s of seg) {
      c.font = '8px Galmuri7'; c.textAlign = 'left';
      if (s.t) { c.fillStyle = '#000'; c.fillText(s.t, X + 1, Y + 1); c.fillStyle = o.color || '#8a8496'; c.fillText(s.t, X, Y); }
      else { keyCap(c, X, Y - 9, s.k);
        if (s.l) { c.font = '8px Galmuri7'; c.textAlign = 'left'; c.fillStyle = '#000'; c.fillText(s.l, X + s.kw + 4, Y + 1); c.fillStyle = o.color || '#8a8496'; c.fillText(s.l, X + s.kw + 3, Y); } }
      X += s.w + gap;
    }
    c.restore(); return W;
  }
  function drawPrompt() {
    const p0 = G.prompt; if (!p0 || p0.hide || mode !== 'play') return;
    const p = TOUCH.on ? Object.assign({}, p0, { t: p0.t.replace(/^F\s+/, '') }) : p0; // v2.26 모바일은 F 없이 (오른쪽 행동 버튼)
    if (!TOUCH.on && /^F\s+/.test(p0.t)) { drawKeyTag(ctx, p.x, p.y + Math.sin(time * 4) * 1.5, 'F', p0.t.replace(/^F\s+/, ''), p.bad ? { border: '#a04040', color: '#ff9090' } : {}); return; } // v2.62 키 캡 모양 통일
    ctx.font = '9px Galmuri9'; ctx.textAlign = 'center';
    const w = ctx.measureText(p.t).width + 10, x = Math.round(p.x), y = Math.round(p.y + Math.sin(time * 4) * 1.5);
    ctx.fillStyle = 'rgba(10,8,14,.85)'; ctx.fillRect(x - w / 2, y - 10, w, 14);
    ctx.strokeStyle = p.bad ? '#a04040' : '#c9a24a'; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2 + 0.5, y - 9.5, w - 1, 13);
    ctx.fillStyle = p.bad ? '#ff9090' : '#ffe9b0'; ctx.fillText(p.t, x, y);
  }
  // ================================================================ 문 표시: 문마다 양옆 기둥 + 불 — "불 두 개가 켜진 곳 = 나가는 문"
  // 1장 이끼 낀 통나무 · 2장 돌기둥 · 3장 밧줄 감은 통나무 · 4장 잿빛 돌기둥. 불은 열려 있으면 주황, 봉쇄·보스 봉인 중이면 붉게 낮아짐
  const GATE_PAL = {
    1: { k: '#0b0806', s: '#c8a070', w: '#b08a5a', h: '#8a6a44', l: '#6a4e30', d: '#4a3420', D: '#2e1e12', m: '#3a6a2a', M: '#5a8a3a', i: '#1a1820', I: '#5a5664' },
    2: { k: '#0b0a0e', s: '#d8d0c0', w: '#a49c8e', h: '#6e687a', l: '#504a5c', d: '#36313f', D: '#211e28', m: '#3a5226', M: '#567234', i: '#1a1820', I: '#6a6478' },
    3: { k: '#0b0806', s: '#c8a070', w: '#9a6a40', h: '#8a6038', l: '#6a4628', d: '#4a301a', D: '#2a1a0e', m: '#8a6034', M: '#c8a070', i: '#1a1210', I: '#5a4a3c' },
  };
  GATE_PAL[4] = GATE_PAL[2];
  const gateMat = () => (G.stage === 2 || G.stage === 4 ? 'stone' : G.stage === 3 ? 'rope' : 'moss');
  function genGatePost(hc, mat, bowl) { // 칸 단위 (가로 10 = 몸 6 + 머리·받침 8 + 외곽선)
    const top = bowl ? 2 : 0, H0 = top + 2 + hc + 2 + 1, g = mkGrid(10, H0 + 1);
    if (bowl) { for (let x = 2; x <= 7; x++) g[1][x] = 'I'; for (let x = 3; x <= 6; x++) g[2][x] = 'i'; }
    const y0 = top + 1;
    for (let x = 1; x <= 8; x++) { g[y0][x] = mat === 'stone' ? 'w' : 's'; g[y0 + 1][x] = x === 8 ? 'd' : 'h'; }
    for (let y = y0 + 2; y < y0 + 2 + hc; y++) {
      const r = y - y0 - 2;
      for (let x = 2; x <= 7; x++) g[y][x] = x === 2 ? 'h' : x <= 4 ? 'l' : x <= 6 ? 'd' : 'D';
      if (mat === 'stone' && r % 5 === 4) for (let x = 2; x <= 7; x++) g[y][x] = 'D';
      if (mat !== 'stone' && r % 6 === 5) for (let x = 3; x <= 6; x++) g[y][x] = 'D';
      if (mat === 'rope' && (r === 2 || r === hc - 4)) for (let x = 2; x <= 7; x++) g[y][x] = x % 2 ? 'M' : 'm';
      if (mat === 'moss' && (r * 7 + 3) % 5 === 0) g[y][2 + (r % 2)] = 'M';
    }
    const yb = y0 + 2 + hc; for (let x = 1; x <= 8; x++) { g[yb][x] = mat === 'moss' && x % 3 === 0 ? 'm' : 'l'; g[yb + 1][x] = 'd'; }
    return gOutline(g);
  }
  function genGateBeam(wc, mat) { // 남쪽 문 상인방 (양 끝에 불그릇)
    const g = mkGrid(wc + 2, 9);
    for (const ex of [3, wc - 4]) { for (let x = ex - 2; x <= ex + 3; x++) g[1][x] = 'I'; for (let x = ex - 1; x <= ex + 2; x++) g[2][x] = 'i'; }
    for (let x = 1; x <= wc; x++) {
      g[3][x] = mat === 'stone' ? 'w' : 's'; g[4][x] = 'h'; g[5][x] = (x % 6 === 0) ? 'D' : 'l'; g[6][x] = 'd'; g[7][x] = 'D';
      if (mat === 'moss' && (x * 5) % 7 === 0) g[3][x] = 'M';
      if (mat === 'rope' && (x === 6 || x === wc - 5)) for (let y = 4; y <= 7; y++) g[y][x] = y % 2 ? 'M' : 'm';
    }
    if (mat === 'stone') { const c = Math.floor(wc / 2); for (let x = c - 1; x <= c + 2; x++) { g[2][x] = 'w'; g[3][x] = 's'; g[4][x] = 'w'; } }
    return gOutline(g);
  }
  const gateArt = (key, fn) => art('gate' + G.stage + key, () => { const c = fn(); return G.stage === 4 ? ashify(c) : c; });
  function gateParts(d) { // 문 하나의 기둥·상인방 위치(월드 px)와 불 자리
    const p = DOOR[d], mat = gateMat(), out = [], fl = [];
    const post = (cx, baseY, hc, bowl) => { const c = gateArt('p' + hc + (bowl ? 'b' : ''), () => gCanvas(genGatePost(hc, mat, bowl), GATE_PAL[G.stage] || GATE_PAL[2])); const x = (Math.round(cx - c.width / 2) & ~1), y = (Math.round(baseY - c.height) & ~1); out.push({ c, x, y, sy: baseY }); if (bowl) fl.push({ x: x + c.width / 2, y: y + 4 }); };
    if (d === 'n') { post(p.x - 46, A.y0 + 10, 14, true); post(p.x + 46, A.y0 + 10, 14, true); }
    else if (d === 's') {
      post(p.x - 32, A.y1 + 10, 14, true); post(p.x + 32, A.y1 + 10, 14, true); // 상인방 없이 양옆 기둥만
    } else { const cx = d === 'w' ? A.x0 - 2 : A.x1 + 2; post(cx, p.y - 22, 5, true); post(cx, p.y + 44, 5, true); }
    return { parts: out, flames: fl };
  }
  const GATE_FLAME = [
    ['..o..', '.oyo.', '.oyo.', 'oyWyo', 'oyWyo', '.ooo.'],
    ['.o...', '.oo..', '.oyo.', 'oyWyo', 'oyWyo', '.ooo.'],
    ['...o.', '..oo.', '.oyo.', 'oyWyo', 'oyWyo', '.ooo.'],
  ];
  const GATE_FC = { open: { o: '#e2501c', y: '#ff9a2e', W: '#ffe28a' }, ash: { o: '#a02818', y: '#e05a2a', W: '#ffb070' }, shut: { o: '#5e0c14', y: '#b01e2a', W: '#ff6a5a' } };
  function gateFlameKind(st) { return st === 'open' ? (G.stage === 4 ? 'ash' : 'open') : 'shut'; }
  function drawGateFlame(f, kind, i) {
    const fr = kind === 'shut' ? 0 : Math.floor(time * 8 + i * 1.7) % 3, rows = GATE_FLAME[fr].slice(kind === 'shut' ? 2 : 0), pal = GATE_FC[kind];
    const x0 = (Math.round(f.x) - 5) & ~1, y0 = (Math.round(f.y) - rows.length * 2) & ~1;
    rows.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { const c = pal[r[xx]]; if (c) { ctx.fillStyle = c; ctx.fillRect(x0 + xx * 2, y0 + yy * 2, 2, 2); } } });
  }
  function gateEnts(ents) {
    const R = G.dun && G.dun.cur; if (!R || G.dun.forge || G.dun.home) return;
    for (const d in DIRS) {
      const st = doorState(R, d); if (st === 'none' || st === 'crack') continue;
      const { parts, flames } = gateParts(d), kind = gateFlameKind(st);
      parts.forEach((q, k) => ents.push({ y: q.sy, d: () => { ctx.drawImage(q.c, q.x, q.y); if (G.stage === 1) TRUTH.gatePost(R, d, k, q); /* v2.67 점액 묻은 문 기둥 */ if (k === parts.length - 1) flames.forEach((f, i) => drawGateFlame(f, kind, i + d.charCodeAt(0))); } }));
    }
  }
  function gateLights(lights) {
    const R = G.dun && G.dun.cur; if (!R || G.dun.forge || G.dun.home) return;
    for (const d in DIRS) { const st = doorState(R, d); if (st === 'none' || st === 'crack') continue; const k = gateFlameKind(st);
      for (const f of gateParts(d).flames) lights.push({ x: f.x, y: f.y - 6, r: k === 'shut' ? 44 : 64 + Math.sin(time * 9 + f.x) * 2, a: k === 'shut' ? 0.45 : 0.7, c: k === 'shut' ? '255,60,60' : k === 'ash' ? '255,120,70' : '255,170,80', ca: k === 'shut' ? 0.12 : 0.18 }); }
  }
  function roomEnts(ents) {
    const R = G.dun && G.dun.cur; if (!R) return;
    gateEnts(ents);
    if (R.sprites) for (const s of R.sprites) ents.push({ y: s.sy, d: s.ob && s.ob.tower ? () => { const P = G.player, b = s.ob, under = P.x > b.x0 - 6 && P.x < b.x1 + 6 && P.y > b.y0 - 50 && P.y < b.y1; ctx.globalAlpha = under ? 0.55 : 1; ctx.drawImage(s.cv, s.x, s.y); ctx.globalAlpha = 1; } : () => ctx.drawImage(s.cv, s.x, s.y) });
    if (R.props) for (const p of R.props) if (!PROPS[p.name].pit) ents.push({ y: p.y, d: () => drawProp(p) });
    if (G.drums) for (const dm of G.drums) ents.push({ y: dm.y, d: () => drawWarDrum(dm) });
    if (R.chest) ents.push({ y: R.chest.y + (R.chest.lift && !(R.chest.fall > 0) ? 1 : 0) /* v2.80 제단 위 상자는 제단 다음에 */, d: () => drawChest(R.chest) });
    if (R.socks) for (const s of R.socks) ents.push({ y: s.y, d: () => drawSock(s) });
    ashShotEnts(ents);
    if (R.srp) for (const s of R.srp) ents.push({ y: s.y, d: () => drawSR(s) });
    if (R.type === 'shop') { ents.push({ y: R.keeper ? R.keeper.y - 5 : CY - 28, d: () => drawShopKeeper(R) }); for (const s of R.shop) ents.push({ y: s.y, d: () => drawShopItem(s) }); }
    if (R.type === 'reward' && R.chest) ents.push({ y: R.chest.y - 1, d: () => drawTreasure(R) });
    if (R.altars) for (const a of R.altars) ents.push({ y: a.y, d: () => drawAltar(a) }); // v2.02 피의 제단
    if (R.type === 'rest' && G.bonfire) BISTRO.ents(ents); // v3.10 모닥불 위 큰 솥 · 쿠오 · 쿠키
    if (R.type === 'home') HOME.ents(ents); // v2.97 시작 장소 NPC (역참 단군)
    if (R.type === 'archive') ARCH.ents(ents); // v3.00 코코아의 기록 보관소
  }
  function roomLights(lights) {
    const R = G.dun && G.dun.cur; if (!R) return;
    srLights(lights, R); if (R.type === 'shop') lights.push({ x: CX, y: CY + 40, r: 140, a: 0.45, c: '255,200,140', ca: 0.06 });
    if (R.type === 'reward' && R.chest) { lights.push({ x: R.chest.x, y: R.chest.y - 10, r: R.chest.opened ? 80 : 120, a: 0.75, c: '255,210,110', ca: R.chest.opened ? 0.1 : 0.22 }); }
    if (R.type === 'rest' && G.bonfire) lights.push({ x: G.bonfire.x, y: G.bonfire.y - 10, r: 150 + Math.sin(time * 8) * 6, a: 0.85, c: '255,150,60', ca: 0.22 });
    if (R.type === 'rest') BISTRO.lights(lights); // v3.10 쿠오 · 쿠키 · 메뉴판
    if (R.exit) { lights.push({ x: R.exit.x, y: R.exit.y, r: 90, a: 0.7, c: '255,120,60', ca: 0.22 }); lights.push({ x: R.exit.x, y: R.exit.y - 70, r: 60, a: 0.45, c: '255,170,90', ca: 0.14 }); }
    if (R.tele && R.cleared) { lights.push({ x: R.tele.x, y: R.tele.y, r: 70, a: 0.6, c: '120,180,255', ca: 0.18 }); lights.push({ x: R.tele.x, y: R.tele.y - 60, r: 50, a: 0.4, c: '150,200,255', ca: 0.1 }); }
    if (R.props) for (const p of R.props) { const L = PROPS[p.name].light; if (L) lights.push({ x: p.x, y: p.y + L.dy, r: L.r + Math.sin(time * 9 + p.x) * 3, a: 0.8, c: L.c, ca: L.ca }); }
    for (const e of G.enemies) if (!e.dead && INV_MAP[e.type] && (e.fadeA == null || e.fadeA > 0.2)) lights.push({ x: e.x, y: e.y - 14, r: 64, a: 0.5, c: e.type === 'reaper' ? '200,140,255' : '255,180,120', ca: 0.12 }); // v1.59 난입자는 어둠 속에서도 보이게
    for (const e of G.enemies) if (!e.dead && e.type === 'reaper' && e.echoes) for (const q of e.echoes) if (!q.done) lights.push({ x: q.x, y: q.y - 14, r: 40, a: 0.35, c: '200,140,255', ca: 0.14 });
    for (const e of G.enemies) if (e.chak && e.chak.st !== 'held') lights.push({ x: e.chak.x, y: e.chak.y - 10, r: 30, a: 0.45, c: e.type === 'shrewB' ? '255,210,90' : '220,225,240', ca: 0.12 });
    for (const pr of G.eproj) if (pr.kind === 'ember') lights.push({ x: pr.x, y: pr.y - 10, r: 18, a: 0.35, c: '255,150,60', ca: 0.12 });
    for (const pr of G.eproj) if (pr.kind === 'crescent') lights.push({ x: pr.x, y: pr.y - 10, r: 22, a: 0.4, c: '200,140,255', ca: 0.12 });
    if (G.flatLights) for (const l of G.flatLights) lights.push(l.flick ? Object.assign({}, l, { r: l.r + Math.sin(time * 10 + l.x) * 2 }) : l);
    if (G.stage === 1 && G.flies) for (const f of G.flies) if (f.cx != null) lights.push({ x: f.cx, y: f.cy, r: 14, a: 0.35, c: '220,255,120', ca: 0.2 });
    if (R.socks) for (const s of R.socks) { const on = s.dual ? G.dun.sock[0] || G.dun.sock[1] : G.dun.sock[s.i]; lights.push({ x: s.x, y: s.y - SOCK_H[SST()] + 6, r: on ? 64 + Math.sin(time * 9 + s.i) * 3 : 30, a: on ? 0.8 : 0.35, c: on ? SK().rgb : '200,200,220', ca: on ? 0.22 : 0.05 }); }
    if (R.chest && !R.chest.opened) lights.push({ x: R.chest.x, y: R.chest.y - 10, r: 60, a: 0.6, c: R.chest.kind === 'secret' ? '200,140,255' : '255,200,110', ca: 0.18 });
    if (R.chest && R.chest.kind === 'boss' && !R.chest.fall) lights.push({ x: R.chest.x, y: R.chest.y - 10, r: R.chest.opened ? 90 : 130, a: 0.8, c: '255,190,90', ca: R.chest.opened ? 0.1 : 0.25 });
    if (G.stage >= 2) for (const b of R.obs) if (b.t === 'post') continue; else if (b.t === 'pit') lights.push({ x: b.x, y: b.y0 + 10, r: Math.max(b.w, b.h) * 0.55, a: 0.22 }); else lights.push({ x: b.x, y: b.y - (b.t === 'pillar' ? 20 : 8), r: b.c ? 42 : Math.max(b.w, b.h) * 0.6 + 20, a: 0.28 });
    for (const d in DIRS) { const st = doorState(R, d); if (st === 'open' || st === 'sealed') { const q = doorIn(d, 6); lights.push({ x: q.x, y: q.y, r: 50, a: 0.45, c: st === 'sealed' ? '255,60,60' : null, ca: 0.1 }); } }
    gateLights(lights); // 문 기둥의 불
  }

  // ---------- 미니맵 · 지도 · 순간이동
  const shapeFit = r => { const sh = SHAPES[r.shape] || SHAPES.field; return { w: sh.w >= 1300 ? 1 : sh.w >= 1000 ? 0.82 : sh.w >= 500 ? 0.6 : 0.36, h: sh.h >= 700 ? 1 : sh.h >= 500 ? 0.82 : sh.h >= 300 ? 0.6 : 0.36 }; };
  const roomColor = (r) => ({ boss: '#a02a34', shop: '#b08a2a', rest: '#c06a2a', reward: '#c0a040', secret: '#8a5ac0', elite: '#7a2a40', survive: '#5a4a7a', start: '#4a6a4a' }[r.type] || '#3a3444');
  const FIGHT_T = new Set(['combat', 'elite', 'survive', 'boss']);
  // 클리어 표시: 금색 체크 (검은 외곽선, s = 칸 크기)
  function drawCheck(x, y, s) {
    const cells = [[0, 2], [1, 3], [2, 2], [3, 1], [4, 0]], put = (c, col, o) => { ctx.fillStyle = col; for (const [cx, cy] of cells) { ctx.fillRect(x + cx * s - o, y + cy * s - o, s + o * 2, s + o * 2); ctx.fillRect(x + cx * s - o, y + (cy + 1) * s - o, s + o * 2, s + o * 2); } };
    put(cells, '#000', 1); put(cells, '#7dff9a', 0);
  }
  const MM = { phT: -1, phH: 52, key: '', c: null }; // v1.78 미니맵 방 그림 캐시 (방 상태가 바뀔 때만 다시 그림)
  // v1.90 방 바닥에 남은 아이템 → 지도 아이콘 (장비가 있으면 가장 높은 등급 색)
  function roomLoot(r) {
    const arr = r === G.dun.cur ? G.loot : r.loot; if (!arr || !arr.length) return null;
    let n = 0, gi = -1;
    for (const l of arr) { if (!(l.life > 0)) continue; n++; if (l.type === 'gear') gi = Math.max(gi, { common: 0, rare: 1, unique: 2, legend: 3, rby: 4 }[l.it.grade]); }
    return n ? { n, c: gi >= 0 ? GRADES.find(g => g.k === ['common', 'rare', 'unique', 'legend', 'rby'][gi]).c : '#f0e8c8' } : null;
  }
  // v1.92 TAB 지도: 방 바닥 아이템 종류별 [아이콘 그리는 함수, 개수]
  function roomLootCats(r) {
    const arr = (r === G.dun.cur ? G.loot : r.loot) || [];
    const GI = { common: 0, rare: 1, unique: 2, legend: 3, rby: 4 }; let gear = null, gn = 0; const n = {}, key = {};
    for (const l of arr) { if (!(l.life > 0)) continue; if (l.type === 'gear') { gn++; if (!gear || GI[l.it.grade] > GI[gear.grade]) gear = l.it; } else { const k = l.type === 'bigmeat' ? 'meat' : l.type; n[k] = (n[k] || 0) + 1; if (k === 'sealkey') key.l = l; } }
    const out = [];
    if (r.chest && !r.chest.opened) out.unshift([(x, y) => drawMapIcon(MAP_CHEST, x, y), 1]); // v1.93 열지 않은 보물상자
    if (gear) out.push([(x, y) => drawMapIcon(MAP_SWORD, x, y), gn]); // v1.93 장비는 검 모양 하나로
    if (n.pouch) out.push([(x, y) => drawSprite(LOOT.pouch.map, 'loot', 2, x, y, false), n.pouch]);
    if (n.meat) out.push([(x, y) => drawSprite('heartHalf', 'loot', 2, x, y, false), n.meat]);
    if (n.vial) out.push([(x, y) => drawSprite('vial', 'loot', 2, x, y, false), n.vial]);
    if (n.orb) out.push([(x, y) => drawSprite('orb', 'loot', 2, x, y, false), n.orb]);
    if (n.sealkey) out.push([(x, y) => drawSealKey(key.l, x, y), n.sealkey]);
    return out;
  }
  // v1.93 지도용 작은 아이콘 (2px 칸, 아래 가운데 기준)
  const MAP_SWORD = { rows: ['......wk', '.....wwk', '....wwk.', 'k..wwk..', 'kkwwk...', '.kgk....', 'kgkk....', 'kk......'], pal: { w: '#e8ecf4', k: '#1a1820', g: '#c8a050' } };
  const MAP_CHEST = { rows: ['.kkkkkk.', 'kyyyyyyk', 'kbbybbbk', 'kkkgkkkk', 'kbbgbbbk', 'kbbbbbbk', '.kkkkkk.'], pal: { k: '#140c08', y: '#ffd34d', b: '#8a5a2a', g: '#ffe9a0' } };
  function drawMapIcon(ic, x, y) {
    const h = ic.rows.length, w = ic.rows[0].length, x0 = (Math.round(x) & ~1) - w, y0 = (Math.round(y) & ~1) - h * 2;
    ic.rows.forEach((row, j) => { for (let i = 0; i < w; i++) { const c = ic.pal[row[i]]; if (!c) continue; ctx.fillStyle = c; ctx.fillRect(x0 + i * 2, y0 + j * 2, 2, 2); } });
  }
  function drawRoomLoot(cats, x, y, rw, rh) { // 아이콘(16px) + 개수 — 방 폭에 안 들어가면 개수부터 빼고, 그래도 넘치면 앞에서부터 들어가는 만큼 + 「+」
    const avail = rw - 14, wOf = cnt => cats.reduce((a, c) => a + 16 + (cnt && c[1] > 1 ? 12 : 0), 0) + (cats.length - 1) * 4;
    const cnt = wOf(true) <= avail; let list = cats, more = false;
    if (!cnt && wOf(false) > avail) { const n = Math.max(1, Math.floor((avail - 8 + 4) / 20)); list = cats.slice(0, n); more = n < cats.length; }
    const ws = list.map(c => 16 + (cnt && c[1] > 1 ? 12 : 0)), W = ws.reduce((a, b) => a + b, 0) + (list.length - 1) * 4 + (more ? 8 : 0), by = y + rh - 5;
    let cx = Math.round(x + (rw - 12) / 2 - W / 2 + 2);
    ctx.save(); ctx.font = '8px Galmuri7'; ctx.textAlign = 'left';
    list.forEach(([draw, k], i) => {
      draw(cx + 8, by);
      if (cnt && k > 1) { ctx.fillStyle = '#000'; ctx.fillText('×' + k, cx + 18, by); ctx.fillStyle = '#f0e8d8'; ctx.fillText('×' + k, cx + 17, by - 1); }
      cx += ws[i] + 4;
    });
    if (more) { ctx.fillStyle = '#000'; ctx.fillText('+', cx + 1, by); ctx.fillStyle = '#f0e8d8'; ctx.fillText('+', cx, by - 1); }
    ctx.restore();
  }
  function drawLootMark(x, y, c, big) { // 작은 보석 모양 (검은 테두리)
    const s = big ? 2 : 1;
    ctx.fillStyle = '#000'; ctx.fillRect(x - s, y - 2 * s, 3 * s, 5 * s); ctx.fillRect(x - 2 * s, y - s, 5 * s, 3 * s);
    ctx.fillStyle = c; ctx.fillRect(x, y - s, s, 3 * s); ctx.fillRect(x - s, y, 3 * s, s);
  }
  const HF = { t: 0, L: null, R: null, dimL: false, dimR: false, a: 1 };
  function hudFade() {
    if (!G || !G._wt) return; const T = G._wt;
    if (!(time < HF.t)) { HF.t = time + 0.5; const pa = $('party'), ph = $('phase'); HF.L = pa ? { x: pa.offsetLeft, y: pa.offsetTop, w: pa.offsetWidth, h: pa.offsetHeight } : null; HF.R = ph ? { x: VW - 8 - 140, y: 8, w: 140, h: (MM.bot || 160) - 8 } : null; }
    const pts = []; const P = G.player; if (P && !P.dead) pts.push([P.x, P.y - 16]);
    for (const e of G.enemies) if (!e.dead && !isDummy(e)) pts.push([e.x, e.y - 14]);
    const hit = r => r && pts.some(([x, y]) => { const sx = T.a * x + T.e, sy = T.d * y + T.f; return sx > r.x - 8 && sx < r.x + r.w + 8 && sy > r.y - 8 && sy < r.y + r.h + 12; });
    const dl = hit(HF.L), dr = hit(HF.R);
    if (dl !== HF.dimL) { HF.dimL = dl; const pa = $('party'); if (pa) pa.classList.toggle('hudDim', dl); }
    if (dr !== HF.dimR) { HF.dimR = dr; const ph = $('phase'); if (ph) ph.classList.toggle('hudDim', dr); }
    HF.a += ((dr ? 0.28 : 1) - HF.a) * 0.25;
  }
  function drawMinimap() {
    const D = G.dun; if (!D) return;
    if (!(time < MM.phT)) { const ph = $('phase'); MM.phH = ph && ph.offsetHeight ? ph.offsetHeight : 52; MM.phT = time + 0.5; } // v1.78 패널 높이는 0.5초마다만 읽음
    const W0 = 140, H0 = 100, x0 = VW - 8 - W0, y0 = 8 + MM.phH + 6, cw = 30, ch = 20, gap = 8; // v1.39 단계 패널 바로 아래 6px · v1.91 방을 크게(16×11 → 30×20), 내 방 주변만
    MM.bot = y0 + H0;
    const key = D.cur.id + '|' + D.rooms.map(r => (r.seen ? 1 : 0) + (r.visited ? 2 : 0) + (r.cleared ? 4 : 0) + (r.tele ? 8 : 0) + (r.exit ? 16 : 0) + (r.chest && !r.chest.opened ? 32 : 0) + (r.crack && r.crack.broken ? 64 : 0) + (r.visited ? (((q) => q ? 'L' + q.n + q.c : '')(roomLoot(r))) : '')).join(',');
    const blink = Math.floor(time * 4) % 2;
    if (MM.key !== key || !MM.c || MM.dun !== D) { MM.key = key; MM.dun = D; const [mc, mg] = MM.c ? [MM.c, MM.g] : mkCanvas(W0, H0); MM.c = mc; MM.g = mg; mg.clearRect(0, 0, W0, H0);
      const ctx0 = ctx; ctx = mg; try { drawMinimapRooms(D, 0, 0, W0, H0, cw, ch, gap); } finally { ctx = ctx0; } }
    ctx.save(); ctx.globalAlpha = HF.a; /* v2.38 캐릭터·적이 뒤에 있으면 미니맵도 흐리게 */ ctx.drawImage(MM.c, x0, y0);
    ctx.font = '8px Galmuri7'; ctx.textAlign = 'right'; if (!TOUCH.on) drawKeyRow(ctx, VW - 12, y0 + H0 + 11, [['TAB', '지도']], { align: 'right' }); // v2.63 키캡
    { const cur = D.cur, sf = shapeFit(cur), rw = Math.max(4, Math.round(cw * sf.w / 2) * 2), rh = Math.max(4, Math.round(ch * sf.h / 2) * 2), x = Math.round(x0 + W0 / 2 - rw / 2), y = Math.round(y0 + H0 / 2 - rh / 2);
      ctx.save(); ctx.strokeStyle = blink ? '#ffe39a' : '#fff'; ctx.lineWidth = 1; ctx.strokeRect(x - 0.5, y - 0.5, rw + 1, rh + 1); ctx.restore(); }
    ctx.restore();
  }
  function drawMinimapRooms(D, x0, y0, W0, H0, cw, ch, gap) {
    ctx.save();
    ctx.fillStyle = 'rgba(8,6,12,.72)'; ctx.fillRect(x0, y0, W0, H0);
    ctx.strokeStyle = 'rgba(201,162,74,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, W0 - 1, H0 - 1);
    ctx.beginPath(); ctx.rect(x0 + 1, y0 + 1, W0 - 2, H0 - 2); ctx.clip();
    const cx = x0 + W0 / 2, cy = y0 + H0 / 2, cur = D.cur;
    const pos = r => ({ x: cx + (r.gx - cur.gx) * (cw + gap), y: cy + (r.gy - cur.gy) * (ch + gap) });
    ctx.fillStyle = '#6a6478';
    for (const r of D.rooms) { if (!r.visited) continue; for (const d in r.doors) { const id = r.doors[d]; if (id == null || hiddenDoor(r, d)) continue; const o = D.rooms[id]; if (!o.seen) continue; const p = pos(r), q = pos(o); if (DIRS[d][0]) ctx.fillRect(Math.round(Math.min(p.x, q.x)), Math.round(p.y) - 1, Math.round(Math.abs(q.x - p.x)), 2); else ctx.fillRect(Math.round(p.x) - 1, Math.round(Math.min(p.y, q.y)), 2, Math.round(Math.abs(q.y - p.y))); } } // v1.91 통로를 선으로
    for (const r of D.rooms) {
      if (!r.seen) continue;
      const sf = shapeFit(r), rw = Math.max(4, Math.round(cw * sf.w / 2) * 2), rh = Math.max(4, Math.round(ch * sf.h / 2) * 2), p = pos(r), x = Math.round(p.x - rw / 2), y = Math.round(p.y - rh / 2);
      if (r.visited) { ctx.fillStyle = roomColor(r); ctx.fillRect(x, y, rw, rh); }
      else { ctx.fillStyle = r.type === 'boss' ? 'rgba(160,40,52,.35)' : 'rgba(40,36,48,.9)'; ctx.fillRect(x, y, rw, rh); ctx.strokeStyle = r.type === 'boss' ? '#a02a34' : '#5a5466'; ctx.strokeRect(x + 0.5, y + 0.5, rw - 1, rh - 1); }
      if (r.visited && r.tele && r.cleared) { ctx.fillStyle = '#9fd2ff'; ctx.fillRect(x + rw - 6, y + 2, 4, 4); }
      if (r.exit) { ctx.fillStyle = '#ff7a40'; ctx.fillRect(x + 2, y + 2, 4, 4); }
      if (r.chest && !r.chest.opened && r.visited) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(x + 2, y + 2, 4, 4); }
      if (r.cleared && FIGHT_T.has(r.type)) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y, rw, rh); drawCheck(Math.round(p.x - 5), Math.round(p.y - 3), 2); }
      if (r.visited) { const q = roomLoot(r); if (q) drawLootMark(x + rw - 4, y + rh - 4, q.c, true); } // v1.90 바닥 아이템 (오른쪽 아래 모서리)
    }
    ctx.restore();
  }
  const teleRooms = () => G.dun.rooms.filter(r => r.visited && r.tele && r.cleared);
  function openMap() {
    if (mode !== 'play' || G.trans) return;
    mode = 'map'; sfx('blip');
    const L = teleRooms(); G.mapSel = L.includes(G.dun.cur) ? G.dun.cur : L[0] || null;
    for (const k in pressed) pressed[k] = false;
  }
  function closeMap() { mode = 'play'; for (const k in pressed) pressed[k] = false; }
  function mapLayout() {
    const D = G.dun, cols = D.bx1 - D.bx0 + 1, rows = D.by1 - D.by0 + 1;
    // v1.92~93 화면에 꽉 차게: 가로 728 · 세로 308(제목 아래 ~ 범례 위) 안에서 칸을 최대한 크게
    const side = G.stage === 2 && D.rooms.some(r => r.type === 'chapel' && r.oath && r.oath.read.length) ? 200 : 0, AW = 728 - side; // v2.66 「주운 구절」 패널 자리만큼 지도를 왼쪽으로
    const cw = Math.floor(clamp(AW / (cols * 1.3 - 0.3), side ? 36 : 50, 120) / 2) * 2, gap = Math.round(cw * 0.3 / 2) * 2;
    const ch = Math.floor(clamp(Math.min(cw * 0.64, 308 / (rows * 1.4 - 0.4)), 24, 80) / 2) * 2, gapY = Math.max(8, Math.round(ch * 0.4 / 2) * 2);
    const ox = (VW - side) / 2 - (cols * (cw + gap) - gap) / 2, oy = 64 + Math.max(0, (308 - (rows * (ch + gapY) - gapY)) / 2);
    return { cw, ch, gap, gapY, pos: r => ({ x: ox + (r.gx - D.bx0) * (cw + gap), y: oy + (r.gy - D.by0) * (ch + gapY) }) };
  }
  function updateMap() {
    if (take('tab') || take('escape') || take('m')) { closeMap(); return; }
    const L = teleRooms();
    const mv = [['arrowup', 'w', 0, -1], ['arrowdown', 's', 0, 1], ['arrowleft', 'a', -1, 0], ['arrowright', 'd', 1, 0]];
    for (const [k1, k2, dx, dy] of mv) if (take(k1) || take(k2)) {
      const s = G.mapSel || G.dun.cur; let best = null, bd = 1e9;
      for (const r of L) { const vx = r.gx - s.gx, vy = r.gy - s.gy, along = vx * dx + vy * dy; if (along <= 0) continue; const sc = along + Math.abs(vx * dy - vy * dx) * 2; if (sc < bd) { bd = sc; best = r; } }
      if (best) { G.mapSel = best; sfx('blip'); }
    }
    let go = take('enter') || take(' ') || take('f');
    if (take('j') && mouse.active > 0) {
      const M = mapLayout();
      const hit = L.find(r => { const p = M.pos(r); return mouse.x >= p.x && mouse.x <= p.x + M.cw && mouse.y >= p.y && mouse.y <= p.y + M.ch; });
      if (hit) { G.mapSel = hit; go = true; }
    }
    if (go && G.mapSel) {
      if (G.sealed) { sfx('block'); lootFeed('전투 중에는 순간이동할 수 없다', '#ff7070'); return; }
      const t = G.mapSel; closeMap();
      if (t !== G.dun.cur) goRoom(t, null, true);
    }
  }
  function drawMapOverlay() {
    const D = G.dun, M = mapLayout(), L = teleRooms();
    ctx.fillStyle = 'rgba(6,5,10,.86)'; ctx.fillRect(0, 0, VW, VH);
    ctx.textAlign = 'center'; ctx.font = 'bold 12px Galmuri11'; ctx.fillStyle = '#ffe39a';
    ctx.fillText(`STAGE ${G.stage} · ${STG().n}`, VW / 2, 40);
    ctx.font = '8px Galmuri7'; ctx.fillStyle = '#9a92a8';
    ctx.fillText(`${ER().foe} ${D.eliteDone}/2 · ${sealHud()} · ${D.bossOpen ? '보스 방 열림' : '보스 방 봉인'} · 골드 ${G.gold}G`, VW / 2, 54);
    // 통로
    ctx.fillStyle = '#5a5466';
    for (const r of D.rooms) { if (!r.visited) continue; const p = M.pos(r); for (const d in r.doors) { const id = r.doors[d]; if (id == null || hiddenDoor(r, d) || !D.rooms[id].seen) continue; const q = M.pos(D.rooms[id]), cx0 = p.x + M.cw / 2, cy0 = p.y + M.ch / 2, cx1 = q.x + M.cw / 2, cy1 = q.y + M.ch / 2; if (DIRS[d][0]) ctx.fillRect(Math.round(Math.min(cx0, cx1)), Math.round(cy0) - 2, Math.round(Math.abs(cx1 - cx0)), 4); else ctx.fillRect(Math.round(cx0) - 2, Math.round(Math.min(cy0, cy1)), 4, Math.round(Math.abs(cy1 - cy0))); } } // v1.93 통로 = 방 가운데끼리 잇는 선
    for (const r of D.rooms) {
      if (!r.seen) continue;
      const lootCats = r.visited ? roomLootCats(r) : [];
      const sf = r.visited ? shapeFit(r) : { w: 0.82, h: 0.82 }, needW = lootCats.length ? lootCats.reduce((a, c) => a + 20 + (c[1] > 1 ? 12 : 0), 0) + 14 : 0;
      const rw = Math.min(M.cw, Math.max(Math.round(M.cw * sf.w), Math.round(M.cw * 0.55), needW)), rh = Math.min(M.ch, Math.max(Math.round(M.ch * sf.h), Math.round(M.ch * 0.55), lootCats.length ? 40 : 0)), p0 = M.pos(r), x = Math.round(p0.x + (M.cw - rw) / 2), y = Math.round(p0.y + (M.ch - rh) / 2); // v1.92 아이템이 있으면 방을 아이콘이 들어갈 만큼
      ctx.fillStyle = r.visited ? roomColor(r) : 'rgba(30,27,36,.95)'; ctx.fillRect(x, y, rw, rh);
      if (r.cleared && FIGHT_T.has(r.type)) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x, y, rw, rh); }
      ctx.strokeStyle = r.visited ? 'rgba(255,255,255,.15)' : r.type === 'boss' ? '#a02a34' : '#5a5466'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, rw - 1, rh - 1);
      ctx.font = '8px Galmuri7'; ctx.fillStyle = r.visited ? '#f0e8d8' : r.type === 'boss' ? '#ff8080' : '#6a6478';
      if (!lootCats.length || rh >= 34) ctx.fillText(r.visited || r.type === 'boss' ? roomTag(r.type) : '?', x + rw / 2, lootCats.length ? y + 12 : y + rh / 2 + 3); // 낮은 방은 아이콘만 (방 종류는 색으로)
      if (r.visited && r.tele) { ctx.fillStyle = r.cleared ? '#9fd2ff' : '#4a4560'; ctx.fillRect(x + rw - 6, y + 2, 4, 4); }
      if (r.cleared && FIGHT_T.has(r.type)) { drawCheck(x + rw - 5, y + rh - 6, 2); ctx.font = "8px Galmuri7"; }
      if (lootCats.length) drawRoomLoot(lootCats, x, y, rw, rh); // v1.92 바닥 아이템을 실제 모양(장비·골드·물약…)으로
      if (r === D.cur) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - 1, rw + 2, rh + 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + rw / 2 - 2, y - 7, 4, 4); }
      if (r === G.mapSel) { ctx.strokeStyle = Math.floor(time * 5) % 2 ? '#9fd2ff' : '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x - 3, y - 3, rw + 6, rh + 6); }
    }
    ctx.font = '8px Galmuri7'; ctx.fillStyle = '#8a8496';
    if (TOUCH.on) ctx.fillText(L.length ? '방을 탭하면 순간이동 · 지도 버튼으로 닫기' : '방을 클리어하면 그 방의 텔레포터가 켜진다 · 지도 버튼으로 닫기', VW / 2, VH - 26);
    else drawKeyRow(ctx, VW / 2, VH - 25, L.length ? [['↑↓←→', '선택'], ['ENTER', '이동'], ['TAB', '닫기']] : ['방을 클리어하면 그 방의 텔레포터가 켜진다', ['TAB', '닫기']]); // v2.63 키캡
    ctx.textAlign = 'left'; const lg = (x, txt) => { ctx.fillStyle = '#8a8496'; ctx.fillText(txt, x, VH - 40); };
    ctx.fillStyle = '#9fd2ff'; ctx.fillRect(VW / 2 - 196, VH - 44, 4, 4); lg(VW / 2 - 189, '텔레포터');
    drawMapIcon(MAP_CHEST, VW / 2 - 134, VH - 36); lg(VW / 2 - 123, '보물상자');
    drawMapIcon(MAP_SWORD, VW / 2 - 70, VH - 36); lg(VW / 2 - 59, '장비');
    ctx.fillStyle = '#a02a34'; ctx.fillRect(VW / 2 - 28, VH - 44, 4, 4); lg(VW / 2 - 21, '보스');
    ctx.fillStyle = '#5a5466'; ctx.fillRect(VW / 2 + 8, VH - 44, 4, 4); lg(VW / 2 + 15, '? 가 보지 않은 방');
    drawCheck(VW / 2 + 98, VH - 46, 1); lg(VW / 2 + 107, '클리어');

    ctx.textAlign = 'left';
  }
