'use strict';
// 잿빛 왕관 토벌대 — 17_main.js : 메인 루프 시작, 디버그(__proto), 전서·스테이지 진입 양피지
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ---------------------------------------------------------------- 루프
  let last = performance.now();
  const FRAME_MS = 1000 / 60; let nextDue = 0; // 60프레임 고정: 주사율이 높은 모니터(120·144Hz)에서도 초당 60번만 계산·그리기
  function frame(now) {
    if (now < nextDue - 1.5) { requestAnimationFrame(frame); return; } // 아직 다음 프레임 차례가 아님
    nextDue = Math.max(nextDue + FRAME_MS, now - FRAME_MS / 2); // 평균 60을 유지 (늦었으면 따라잡으려 몰아 그리지 않음)
    const gap = now - last; last = now;
    let dt = gap > 12 && gap < 22 ? 1 / 60 : Math.min(0.05, gap / 1000); if (G && G.entryDt) { G.entryDt = false; dt = 1 / 60; } // v2.35 방 들어온 직후 순간이동처럼 보이는 점프 방지 // 60 근처면 딱 1/60초로 — 프레임마다 이동 거리가 같아 2px 칸 이동이 고르게 보임
    const pf0 = PERF.on ? performance.now() : 0;
    try { update(dt); } catch (err) { console.error(err); }
    const pf1 = PERF.on ? performance.now() : 0;
    try { render(); } catch (err) { console.error(err); for (let i = 0; i < 64; i++) ctx.restore(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; } // v2.40 그리다 오류가 나도 save가 쌓여 화면이 어두워지거나 UI가 어긋나지 않게
    if (PERF.on) perfTick(now, pf0, pf1);
    try { hud(); updatePeek(); touchHud(); if (++fitTick % 30 === 0 && (viewW() !== fitW || viewH() !== fitH)) fit(); } catch (err) { console.error(err); } // v1.78 창 크기는 이벤트 + 30프레임마다만 (매 프레임 읽으면 레이아웃 재계산)
    requestAnimationFrame(frame);
  }
  titleMats();
  try { if (sessionStorage.getItem('acr_reset_done')) { sessionStorage.removeItem('acr_reset_done'); const b = document.querySelector('#tmMain [data-act="reset"]'); if (b) b.textContent = '초기화 완료'; } } catch (e) { /* 무시 */ } // v2.86 저장 초기화 뒤 새로 불러왔음을 표시
  requestAnimationFrame(frame);

  window.__proto = { TRUTH, get dlv() { return DLV; }, set dlv(v) { DLV = v; DGC.clear(); }, dRadial: (...a) => dRadial(...a), get dither() { return DITHER_ON; }, set dither(v) { DITHER_ON = !!v; LIGHT_DITH = !!v; }, get lightDith() { return LIGHT_DITH; }, set lightDith(v) { LIGHT_DITH = !!v; }, get lightGL() { return !!(LGL && !LGL.off && LIGHT_GL); }, set lightGL(v) { LIGHT_GL = !!v; }, wmIntro: () => wmStart(), get wmReady() { return WM.ready; }, spawnInv: (k, x, y) => { invInit(); const e = makeEnemy(k, x, y); G.enemies.push(e); return e; }, spawnPanda: (x, y) => { invInit(); const e = makeEnemy("panda", x, y); G.enemies.push(e); return e; }, invade: { markInvader, startInvasion }, art4: () => ({ genMeltKing, genBell, genWallBlock, KING4, BELL4, STONE4, ashCap, gCanvas, propCanvas, withSeed }), set opt(v) { OPT = v; }, get opt() { return OPT; }, renderAt: (t, seed) => { const t0 = time; time = t; withSeed(seed || 7, () => { render(); }); time = t0; return document.getElementById('game').toDataURL(); }, setMode: m => { mode = m; }, sr: { SR, srPal, gCanvas }, camS: () => [CAMX, CAMY], spr: { sprite, drawSprite, drawBlade, BLADES, get ctx() { return ctx; } }, artk: { genHedge, genWallBlock, genPalisade, LEAF, STONE, PEN_PAL, gCanvas, withSeed }, WEAP, fxt: { chainBolt, ghostSword, fireWave, gearOnKill, gearOnHurt, fxRing, nearFoes, damageEnemy, killEnemy, gxNova, gxThorns, gxCoins, gxCrit, gxExec, gxSpurt, gxFocus, gxIgnite, gxOrbs }, gear: { makeItem, spawnLoot, openForge, EFX, SETS, CURSES, setCount, recalc: () => { G.stats = calcStats(G.buffs); } }, get G() { return G; }, get cam() { return cam; }, get fxs() { return { shake, zoomK }; }, get mode() { return mode; }, start, SAVE: () => SAVE, mk: makeEnemy, stage3: () => { G.stage = 3; G.last = 3; G.ash = []; newDungeon(); }, orc: { ORC_SPEC, orcSprite, genOrcBody, rotW }, inv: { open: openInv, close: closeInv, equipNow, statsIf, makeItem, get sel() { return invSel; } }, choose: chooseClass, asc: { ASC, get lv() { return ascLv(); }, set lv(v) { if (G) G.asc = v; }, F: ASCF, save: () => SAVE.asc, result: w => showResult(w), openSelect: () => openSelect(), rest: () => openRest() }, dbg: { get ICON32() { return ICON32; }, pen: (wc, hc, k) => gCanvas(genPalisade(wc, hc, k).g, PEN_PAL), propCv: n => { ensureOrcProps(); return propCanvas(n); }, floorCv: () => fg.canvas, MAPS, PAL, sprite, propRect, navFlood, navIdx, get CENTER() { return { x: CX, y: CY - 10, r: CLEAR_R }; }, artCache, DOOR, doorIn, doorState, hitCrack, crackPoint, enterRoom, goRoom, newDungeon: () => { G.dun = genDungeon(G.stage); G.dun.cur = null; enterRoom(G.dun.start, null); }, get mode() { return mode; } } };

  // ================================================================
  // 전서(캐릭터 전기) & 스테이지 입장 양피지 서사 시스템
  // ================================================================
  SAVE.chronicle = SAVE.chronicle || {};

  const CHRONICLE_DATA = {
    knight: {
      title: '알드릭 — ??? 기사',
      prologue: '불탄 변경 성채의 잿더미 속에서 깨어난 이름 없는 기사. 갑옷 안쪽에 새겨져 있던 문장은 반쯤 녹아 오른팔에 눌어붙었고, 그가 기억하는 것은 오직 왕을 향해 칼을 들어야 한다는 희미한 맹세뿐이었다. 잿빛 왕의 이름을 들을 때마다, 팔에 눌어붙은 문장 아래가 욱신거린다.',
      endings: {
        normal: {
          title: '선 채로 굳은 왕',
          hint: '잿빛 왕을 쓰러뜨리면 기록됩니다.',
          text: [
            '철검이 마지막으로 투구를 내리쳤을 때, 잿빛 왕은 쓰러지지 않았다. 왕홀을 쥔 자세 그대로 발끝부터 잿빛으로 굳어 갔고, 머리에서 미끄러진 왕관만이 알드릭의 발치까지 굴러와 멈추었다.',
            '허리를 숙이자 굳은 왕의 갑옷 안쪽으로 반쯤 녹아내린 문장이 비쳐 보였다. 어디선가 본 듯한 모양이었지만, 알드릭이 그 기억을 더듬기도 전에 손끝에 닿은 왕관이 세 조각으로 쪼개졌다. 하얀 재가 시야를 덮었다.',
            '눈을 뜬 곳은 불탄 변경 성채의 잿더미 위였다. 무엇이 끝났는지, 왜 이곳에 누워 있는지 알드릭은 기억하지 못했다. 오직 왕을 향해 칼을 들어야 한다는 희미한 맹세만이 가슴속에 남아, 그를 다시 일으켜 세웠다.'
          ]
        }
      }
    },
    ranger: {
      title: '네로 — 고양이 어세신',
      prologue: '밤보다 옅은 발소리로 전장을 스치는 암살자. 버려진 역참의 다락에서 눈을 떴을 때, 계약서에 적힌 의뢰인의 이름은 이미 찢겨 나가 있었다. 네로는 본능적으로 피 냄새의 근원인 왕도를 향해 발걸음을 옮겼다.',
      endings: {
        normal: {
          title: '끝나지 않는 계약',
          hint: '잿빛 왕을 쓰러뜨리면 기록됩니다.',
          text: [
            '단검이 잿빛 왕의 심장을 찾아들었지만, 피는 흐르지 않았다. 왕은 선 채로 잿더미처럼 굳었고, 발치에 떨어진 왕관만이 희미하게 빛났다.',
            '알현실 바닥에는 수많은 발자국이 겹겹이 찍혀 있었다. 네로는 그것이 앞서 이곳을 지나간 누군가의 것이라 여기고 눈길을 거두었다. 손을 뻗자 왕관은 손끝에 닿기도 전에 세 조각으로 갈라졌고, 하얀 재가 휘몰아쳤다.',
            '네로는 버려진 역참의 다락에서 눈을 떴다. 품에는 의뢰인의 이름이 찢겨 나간 계약서 한 장뿐이었다. 창틈으로 희미한 피 냄새가 실려 왔다. 네로는 아무 말 없이 그 냄새가 시작되는 곳, 왕도를 향해 발걸음을 옮겼다.'
          ]
        }
      }
    },
    mage: {
      title: '세리안 — 여우 마법사',
      prologue: '왕립 서고의 금서를 불태운 뒤 외딴 관측탑으로 자취를 감춘 탐구자. 밤하늘의 별자리를 하나하나 수식으로 옮기던 세리안은, 끝내 이어지지 않는 별자리의 빈자리가 왕도 위를 가리키고 있음을 알아냈다.',
      endings: {
        normal: {
          title: '이어지지 않는 별자리',
          hint: '잿빛 왕을 쓰러뜨리면 기록됩니다.',
          text: [
            '마지막 마력탄이 닿자 잿빛 왕은 그 자리에 멈춰 섰다. 무너지지도 흩어지지도 않은 채 발끝부터 재의 빛깔로 굳어 갔다. 왕관이 미끄러져 바닥을 구르는 소리만이 정지한 알현실에 울렸다.',
            '세리안은 왕관에 박힌 세 파편을 보며 수첩을 펼쳤다. 풀리지 않던 수식의 마지막 항이 거의 맞아떨어지려던 순간, 손끝에 닿은 왕관이 세 조각으로 흩어졌다. 하얀 재가 수첩의 글자를 덮었다.',
            '외딴 관측탑의 바닥에서 몸을 일으킨 세리안은 보면대 위에 펼쳐진 책과, 언제 적었는지 모를 수식이 빼곡한 칠판을 번갈아 보았다. 가는 창 너머 별들은 어제와 같은 자리에서 빛나고 있었다. 별자리의 빈자리는 여전히 왕도 위에 있었다. 세리안은 그 빈자리를 메우러 다시 왕도로 향했다.'
          ]
        }
      }
    },
    priest: {
      title: '미레아 — 토끼 사제',
      prologue: '종이 멈춘 수도원에서 마지막까지 기도를 멈추지 않았던 사제. 대답 없는 하늘을 향해 수백 번 종을 울린 끝에, 미레아는 신의 침묵을 확인하기 위해 스스로 성지 밖으로 걸어 나왔다.',
      endings: {
        normal: {
          title: '응답 대신 내린 재',
          hint: '잿빛 왕을 쓰러뜨리면 기록됩니다.',
          text: [
            '메이스의 마지막 일격에도 잿빛 왕은 무릎을 꿇지 않았다. 지친 어깨를 그대로 편 채 잿더미로 굳어 갔고, 머리에서 미끄러진 왕관이 미레아의 발치에서 멈추었다.',
            '미레아는 굳은 왕 앞에서 짧은 장례의 기도를 올렸다. 왕관을 거두려 손을 뻗자 왕관은 세 조각으로 쪼개져 흩어졌다. 하늘에서 내려온 것은 응답이 아니라 하얀 재였다.',
            '눈을 뜬 곳은 종이 멈춘 수도원의 제단 앞이었다. 종소리도, 신의 목소리도 들리지 않았다. 미레아는 두 손을 모았다. 이 침묵이 무엇을 뜻하는지 확인하기 위해, 미레아는 다시 왕도를 향해 걸음을 내디뎠다.'
          ]
        }
      }
    },
    gunner: {
      title: '그레이브 — 늑대 총잡이',
      prologue: '수많은 전장에서 살아남아 동료들의 무덤을 대신 파주던 떠돌이 총잡이. 이름 없는 묘지에서 눈을 뜬 그를, 탄창에 남은 마지막 화약 냄새가 다시 잿빛 왕도로 이끌었다. 그곳에 묻어야 할 마지막 시신이 남아 있었기에.',
      endings: {
        normal: {
          title: '눕지 않는 마지막 시신',
          hint: '잿빛 왕을 쓰러뜨리면 기록됩니다.',
          text: [
            '마지막 탄환이 심장을 꿰뚫었지만, 잿빛 왕은 쓰러지지 않았다. 선 채로 잿더미가 되어 굳었고, 머리에서 떨어진 왕관만이 화약 연기 속을 굴러 그레이브의 장화 앞에서 멈추었다.',
            '묻어야 할 시신은 끝내 눕지 않았다. 굳은 왕의 손목에는 낡은 가죽 끈이 감겨 있었지만, 그레이브는 그 매듭을 눈여겨보지 않았다. 하다못해 왕관이라도 거두려 손을 뻗자, 왕관은 세 조각으로 쪼개졌고 하얀 재가 쏟아졌다.',
            '그레이브는 이름 없는 묘지의 파다 만 구덩이 곁에서 눈을 떴다. 탄약 주머니는 이상하리만치 묵직했고, 바람에는 익숙한 화약 냄새가 섞여 있었다. 그 냄새가 이끄는 곳은 잿빛 왕도였다. 그곳에는 아직 묻어야 할 마지막 시신이 남아 있었다.'
          ]
        }
      }
    }
  };

  const STAGE_PARCHMENT = { // v3.66 일반 루트 캐릭터별 스토리 (claude/일반루트_캐릭터별스토리_게임반영안.md)
    1: {"title": "제1장 · 황혼 초원", "knight": ["빛이 바랜 변경의 들판. 마른 풀잎마다 오래전에 식은 재가 서리처럼 내려앉아 있다.", "알드릭은 오른팔을 감싼 붕대를 풀어 눌어붙은 문장 자국을 살폈다. 반쯤 녹은 자국은 잠잠했다. 왕의 흔적을 직접 마주하기 전까지는 아무것도 알려 주지 않을 듯했다."], "ranger": ["바람이 멈춘 초원 위로 썩은 점액과 쇠 비린내가 낮게 깔린다. 사냥감을 숨겨 줄 그림자조차 얕은 땅이다.", "네로는 발끝으로 풀숲의 감촉을 재었다. 찢긴 계약서에 남은 냄새가 이 들판을 지나 왕도 쪽으로 이어졌다."], "mage": ["시간이 멈춘 듯한 들판. 대기 속 마력은 흩어져 있으면서도 어딘가 한 방향으로 끌려가고 있다.", "세리안은 수첩에 흐름을 기록했다. 그 방향의 끝은 왕도와 겹쳐 있었다."], "priest": ["기도 소리 대신 괴물들의 신음만 맴도는 들판. 버려진 이정표에는 목적지를 읽을 글자조차 남아 있지 않았다.", "미레아는 메이스를 가슴에 품었다. 신이 침묵한 이유를 찾기 위해 첫발을 내디뎠다."], "gunner": ["화약 냄새보다 먼저 습한 점액과 재 냄새가 코끝을 찌른다. 늑대의 눈에도 이 들판의 끝은 가늠되지 않는다.", "그레이브는 머스킷의 격철을 확인했다. 마지막으로 묻어야 할 자가 왕도에 있다면, 이 길부터 지나야 한다."]},
    2: {"title": "제2장 · 무너진 성채", "knight": ["무너진 회랑에는 왕국의 깃발이 찢긴 채 매달려 있다. 돌벽마다 새겨진 기사단의 문장은 알드릭의 오른팔 자국과 어딘가 닮아 보였다.", "성채 안으로 들어설수록 팔의 통증이 되살아났다. 알드릭은 문장의 흔적을 찾아 회랑 깊숙이 향했다."], "ranger": ["꺼진 횃불과 눅눅한 돌벽이 미로처럼 이어진다. 벽면의 검흔은 이곳을 지나간 누군가가 필사적으로 빠져나가려 했음을 말해 준다.", "네로는 흔적을 따라갔다. 어쩌면 의뢰인이 남긴 자국일지도 모른다."], "mage": ["성채 안에는 역병과 금지된 의식의 잔재가 엉켜 있다. 벽에 새겨진 주문들은 파편의 마력 흐름과 같은 방향으로 배열되어 있었다.", "세리안은 코트를 여미고 기록을 시작했다. 이 성채는 오래전부터 무언가를 붙들어 두고 있었다."], "priest": ["부서진 제단과 쓰러진 성녀상 위로 검은 곰팡이가 번져 있다. 신성했던 곳은 오래전에 버려졌고, 그곳을 지키던 자들은 아직도 떠나지 못했다.", "미레아는 떨리는 숨을 고르며 기도문을 읊었다. 이 영혼들을 두고 지나갈 수는 없었다."], "gunner": ["갑옷이 썩어 가는 냄새와 젖은 돌 냄새가 폐부를 채운다. 쓰러져야 할 기사들이 창을 놓지 않은 채 회랑을 지키고 있었다.", "그레이브는 탄약을 세었다. 이들은 살아 있는 적이 아니라, 끝나지 못한 장례의 일부처럼 보였다."]},
    3: {"title": "제3장 · 핏빛 엄니 부락", "knight": ["협곡의 북소리가 대지를 울린다. 크루가쉬는 왕관 조각을 전리품처럼 지니고, 부락의 전사들은 그 힘을 두고 싸우고 있었다.", "알드릭의 오른팔은 부락에 들어선 뒤부터 쉬지 않고 욱신거렸다. 파편이 가까이 있다는 신호인지, 더 큰 위험이 기다린다는 경고인지 알 수 없었다."], "ranger": ["함성과 횃불이 사방에서 밀려온다. 크루가쉬는 파편을 전리품으로 삼고, 부락의 전사들은 그것을 빼앗으려 서로 싸우고 있었다.", "네로는 피 냄새가 한곳에만 머물지 않는다는 걸 알아차렸다. 이 파편을 쫓는 추적자는 자신만이 아니었다."], "mage": ["식지 않는 열기가 마력의 흐름마저 일렁이게 만든다. 부락의 토템과 뼈 장식은 파편의 문양을 흉내 내듯 배열되어 있었다.", "세리안은 이것이 주술인지 모방인지 알 수 없었다. 다만 모든 흔적이 왕도 쪽을 가리키고 있었다."], "priest": ["전쟁의 광기와 핏빛 환호가 협곡을 가득 채운다. 이 땅에서는 기도가 아니라 뼈나팔이 하늘을 향해 울린다.", "미레아는 빛의 방패를 단단히 감쌌다. 살아서 걸어 나갈 이들을 한 명이라도 더 지키기 위해서였다."], "gunner": ["가죽 타는 냄새와 뜨거운 화기가 협곡을 채운다. 부락의 전사들은 파편을 두고 서로 죽이며, 북소리는 그들의 죽음을 덮어 버린다.", "그레이브는 낮은 휘파람을 불었다. 왕관이 이 싸움을 불러왔다면 마지막 장례는 아직 멀었다."]},
    4: {"title": "제4장 · 잿빛 왕도", "knight": ["흰 재가 눈처럼 내리는 수도. 성벽과 바닥에는 알드릭의 오른팔에 눌어붙은 것과 같은 문장이 되풀이되어 있었다.", "왕도에 가까워질수록 통증은 걷기 어려울 만큼 강해졌다. 이제 문장은 방향뿐 아니라 왕궁의 중심까지 알드릭을 이끌고 있었다."], "ranger": ["소리마저 재에 파묻힌 죽은 도시. 겹겹이 찍힌 발자국은 이곳에 다다른 이들이 하나같이 돌아가지 못했음을 보여 준다.", "네로는 복면을 고쳐 썼다. 의뢰인은 보이지 않지만, 계약의 끝은 왕궁 안에 있었다."], "mage": ["흰 재가 내리는 수도. 거리와 성벽의 문양은 거대한 술식의 일부처럼 되풀이되고, 모든 흐름은 왕궁으로 모이고 있었다.", "세리안은 수첩의 마지막 빈칸을 남겨 두었다. 그 답은 왕궁 안에서 직접 확인해야 했다."], "priest": ["부러진 종탑이 재의 하늘을 찌르고 있다. 이 도시에는 기도도, 장례의 종소리도 들리지 않는다.", "미레아는 마지막으로 눈을 감았다 떴다. 이제 답을 기다리는 대신, 침묵의 중심으로 걸어가기로 했다."], "gunner": ["모든 발자국이 흰 재에 덮여 사라지는 도시. 무너진 성벽 아래에는 묻히지 못한 자들의 흔적이 겹겹이 쌓여 있다.", "그레이브는 삽을 묘지에 두고 왔다. 이번에는 누구를 묻어야 하는지 먼저 확인해야 했다."]}
  };


  const leg2Open = cls => !!(SAVE.chronicle && SAVE.chronicle[cls] && (SAVE.chronicle[cls].normal || SAVE.chronicle[cls].leg1 || SAVE.chronicle[cls].leg2)); // v2.29 레전더리 2: 그 직업으로 4장 보스(마지막) 클리어
  function chronicleCount(cls) { // v2.55 연대기 엔딩 하나로 통합 — 예전 저장의 leg1/leg2 기록도 클리어로 인정
    return leg2Open(cls) ? 1 : 0;
  }
  function recordChronicleEnding(cls) {
    SAVE.chronicle = SAVE.chronicle || {};
    SAVE.chronicle[cls] = SAVE.chronicle[cls] || {};
    const isNew = !chronicleCount(cls);
    SAVE.chronicle[cls].normal = true;
    return { key: 'normal', isNew, label: CHRONICLE_DATA[cls].endings.normal.title };
  }

  // 전기 버튼 · 전서 창 · 스테이지 입장 문구 — 게임 UI 규칙(#ui 768×432 안 · Galmuri 원래 크기 · 어두운 픽셀 프레임 · 칸 단위 등장)
  const BOOK_ICON = (() => { // 9×7 펼친 책
    const rows = ['.kkk.kkk.', 'kWWWkWWWk', 'kwwWkWwwk', 'kWWWkWWWk', 'kwwWkWwwk', 'kWWWkWWWk', '.kkkkkkk.'], pal = { k: '#1a1208', W: '#f2d78c', w: '#a8843a' };
    const [c, g] = mkCanvas(9, 7);
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
    return c.toDataURL();
  })();

  (function injectNarrativeUI() {
    if (document.getElementById('narrativeStyle')) return;
    const st = document.createElement('style');
    st.id = 'narrativeStyle';
    st.textContent = `
      .selc { position: relative; }
      .selc .pv { position: relative; overflow: visible; } .selc .pv .pvMini { position: absolute; left: -10px; bottom: 3px; width: 56px; height: 48px; z-index: 5; pointer-events: none; } /* v2.95 미니 도트는 액자 위 · 넓은 캔버스라 망토·꼬리가 안 잘림 */ .selc .pv .pvArt { position: relative; z-index: 2; } .selc .pv .pvFrame { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; z-index: 3; pointer-events: none; } /* v2.21 초상화 액자 */
      .chrCardBtn { position: absolute; top: 6px; left: 6px; z-index: 4; white-space: nowrap; display: flex; align-items: center; gap: 3px; padding: 1px 4px 1px 2px; cursor: pointer;
        font-family: 'Galmuri7'; font-size: 8px; line-height: 9px; color: var(--gold-l); background: #0d0a10; border: 1px solid #000; box-shadow: inset 0 0 0 1px var(--gold-d); }
      .chrCardBtn img { width: 9px; height: 7px; image-rendering: pixelated; }
      .chrCardBtn:hover { color: #1a1208; background: var(--gold-l); box-shadow: inset 0 0 0 1px #fff3b8; }

      #ovParchment, #ovChronicle { z-index: 45; }
      #ovParchment { background: rgba(5,3,8,.74); cursor: pointer; }
      .stWrap { display: flex; flex-direction: column; align-items: center; }
      .stHead { display: flex; flex-direction: column; align-items: center; margin-bottom: 8px; }
      .stNo { font-family: 'Galmuri7'; font-size: 8px; letter-spacing: 3px; color: var(--ac); text-shadow: 1px 0 0 #000, -1px 0 0 #000, 0 1px 0 #000, 0 -1px 0 #000; }
      .stTitle { margin-top: 3px; font-family: 'Galmuri11'; font-weight: bold; font-size: 24px; line-height: 28px; letter-spacing: 2px; color: var(--gold-l); white-space: nowrap;
        text-shadow: 2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 2px 0 #000, 0 3px 0 var(--blood-d); }
      .stRule { position: relative; width: 240px; height: 5px; margin-top: 6px; background: linear-gradient(var(--gold-d), var(--gold-d)) 0 2px / 100% 1px no-repeat; }
      .stRule::before { content: ''; position: absolute; left: 50%; top: 0; width: 1px; height: 1px; margin-left: -1px; background: var(--ac);
        box-shadow: -1px 1px 0 var(--ac), 0 1px 0 #fff3b8, 1px 1px 0 var(--ac), -2px 2px 0 var(--ac), -1px 2px 0 #fff3b8, 0 2px 0 #fff3b8, 1px 2px 0 #fff3b8, 2px 2px 0 var(--ac),
          -1px 3px 0 var(--ac), 0 3px 0 #fff3b8, 1px 3px 0 var(--ac), 0 4px 0 var(--ac), -3px 2px 0 #000, 3px 2px 0 #000; }
      .stPaper { position: relative; width: 432px; padding: 14px 28px 17px 26px; background-repeat: no-repeat; image-rendering: pixelated; }
      .stCls { display: block; text-align: right; margin-bottom: 4px; font-family: 'Galmuri7'; font-size: 8px; color: #6e5232; }
      .stBody { display: flex; flex-direction: column; gap: 6px; }
      .stPara { position: relative; word-break: keep-all; font-family: 'Galmuri9'; font-size: 10px; line-height: 16px; color: #2a1a0e; }
      .stPara .rest { visibility: hidden; }
      .stPara.wait { visibility: hidden; }
      .stFoot { display: flex; justify-content: center; gap: 12px; margin-top: 7px; font-family: 'Galmuri7'; font-size: 8px; color: var(--quiet); }
      .stFoot > span { display: inline-flex; align-items: center; gap: 3px; }
      .stFoot #parchSkip { cursor: pointer; } .stFoot #parchSkip:hover { color: var(--ink); }
      .parchHL { color: #c0601a; } /* v3.20 양피지 · 진실 기록의 {강조} — 말주머니 강조색과 같음 */
      .stCaret { display: inline-block; width: 4px; height: 8px; margin-left: 1px; vertical-align: -1px; background: #2a1a0e; animation: blink .6s steps(2) infinite; }

      .chrWin { width: 470px; height: 372px; display: flex; flex-direction: column; padding: 11px 14px 6px; }
      .chrTop { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 5px; border-bottom: 1px solid #3a2f40; }
      .chrTop h2 { margin: 0; }
      .chrTop .sub { font-family: 'Galmuri7'; font-size: 8px; color: var(--quiet); margin-top: 1px; }
      .chrPips { display: flex; align-items: center; gap: 3px; font-family: 'Galmuri7'; font-size: 8px; color: var(--quiet); }
      .chrPips i { width: 7px; height: 7px; background: #0b080d; border: 1px solid #000; box-shadow: inset 0 0 0 1px #3a2f40; }
      .chrPips i.on { background: var(--gold); box-shadow: inset 1px 1px 0 #fff3b8, inset -1px -1px 0 var(--gold-d); }
      .chrScroll { flex: 1; min-height: 0; overflow-y: auto; margin: 7px -6px 0 0; padding-right: 6px; }
      .chrScroll::-webkit-scrollbar { width: 4px; } .chrScroll::-webkit-scrollbar-track { background: #0b080d; } .chrScroll::-webkit-scrollbar-thumb { background: var(--gold-d); }
      .chrPro { word-break: keep-all; margin-bottom: 7px; padding: 5px 8px; font-family: 'Galmuri9'; font-size: 10px; line-height: 16px; color: var(--quiet);
        background: #120e15; border-left: 2px solid var(--gold-d); }
      .chrChap { margin-bottom: 6px; padding: 6px 8px 7px; background: #120e15; border: 1px solid #000; box-shadow: inset 0 0 0 1px #3a2f40; }
      .chrChapH { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-family: 'Galmuri9'; font-size: 10px; color: var(--gold-l); }
      .chrChapH .tag { font-family: 'Galmuri7'; font-size: 8px; line-height: 9px; padding: 0 3px; color: #1a1208; background: var(--gold-l); }
      .chrChapP { word-break: keep-all; margin: 0 0 5px; font-family: 'Galmuri9'; font-size: 10px; line-height: 16px; color: var(--ink); }
      .chrChapP:last-child { margin-bottom: 0; }
      .chrChap.locked { background: #0d0a10; box-shadow: inset 0 0 0 1px #241b2b; }
      .chrChap.locked .chrChapH { margin-bottom: 1px; color: var(--dim); }
      .chrChap.locked .chrChapH .tag { color: var(--dim); background: #241b2b; }
      .chrLockedMsg { font-family: 'Galmuri7'; font-size: 8px; color: var(--dim); }
      .chrWin .menu { flex-direction: row; justify-content: flex-end; margin-top: 2px; }
    `;
    document.head.appendChild(st);

    const ui = document.getElementById('ui');
    const pDiv = document.createElement('div');
    pDiv.id = 'ovParchment'; pDiv.className = 'ov';
    pDiv.innerHTML = `<div class="stWrap" id="parchBox">
      <div class="stHead"><span class="stNo" id="parchNo"></span><div class="stTitle" id="parchStg"></div><div class="stRule"></div></div>
      <div class="stPaper" id="parchPaper"><span class="stCls" id="parchCls"></span><div class="stBody" id="parchBody"></div></div>
      <div class="stFoot"><span id="parchPrompt"></span><span id="parchSkip"><span class="key">ESC</span>건너뛰기</span></div>
    </div>`;
    ui.appendChild(pDiv);

    const cDiv = document.createElement('div');
    cDiv.id = 'ovChronicle'; cDiv.className = 'ov';
    cDiv.innerHTML = `<div class="pf win chrWin" id="chrModal"></div>`;
    ui.appendChild(cDiv);

    pDiv.addEventListener('click', e => {
      if (e.target && e.target.closest && e.target.closest('#parchSkip')) closeStageParchment();
      else advanceStageParchment();
    });
    cDiv.addEventListener('click', e => {
      if (e.target === cDiv) closeChronicle();
    });
  })();

  // 입장 문구: 문단마다 한 글자씩 찍힌다 (칸 단위 등장 — 부드러운 페이드 없음)
  let parchState = null;
  const PARCH_CPS = 34, PARCH_AUTO = 2400;
  function showStageParchment(stage, cls) {
    const data = STAGE_PARCHMENT[stage];
    if (!data || !data[cls] || (G && G.dun && G.dun.forge)) {
      mode = 'play';
      banner(`STAGE ${stage}`, `영원한 어둠의 땅 · ${STG().n}`, true); // v2.51 목표 문구 없이 · v2.55 화면 가운데 · v3.23 상위 지명
      return;
    }
    mode = 'parchment';
    for (const k in pressed) pressed[k] = false;
    const C = CLASSES[cls], S0 = STAGES[stage];
    $('parchBox').style.setProperty('--ac', S0 && S0.ash ? `rgb(${S0.ash})` : 'var(--gold)');
    $('parchNo').textContent = `STAGE ${stage}`;
    $('parchStg').textContent = data.title;
    $('parchCls').textContent = `${C.name} · ${C.sub}`;
    const paras = data[cls];
    $('parchBody').innerHTML = paras.map(t => `<div class="stPara wait"><span class="typed"></span><span class="rest">${parchPlain(t)}</span></div>`).join(''); // 자리를 미리 잡아 창 크기가 변하지 않게
    parchState = { stage, paras, total: paras.length, idx: -1, ch: 0, typing: false, tick: null, timer: null };
    parchPrompt();
    $('ovParchment').classList.add('on');
    bakeParchment();
    parchState.timer = setTimeout(() => advanceStageParchment(), 160);
  }
  // v2.58 진실 기록: 진입 문구와 같은 낱장 양피지 (머리글 · 제목 · 문단이 한 글자씩) — 닫으면 o.onClose
  function showTruthParchment(o) {
    mode = 'parchment';
    for (const k in pressed) pressed[k] = false;
    $('parchBox').style.setProperty('--ac', o.ac || 'var(--gold)');
    $('parchNo').textContent = o.no || '';
    $('parchStg').textContent = o.title || '';
    $('parchCls').textContent = '';
    const paras = o.paras;
    $('parchBody').innerHTML = paras.map(t => `<div class="stPara wait"><span class="typed"></span><span class="rest">${parchPlain(t)}</span></div>`).join('');
    parchState = { stage: 0, paras, total: paras.length, idx: -1, ch: 0, typing: false, tick: null, timer: null, truth: o };
    parchPrompt();
    $('ovParchment').classList.add('on');
    bakeParchment();
    parchState.timer = setTimeout(() => advanceStageParchment(), 160);
  }
  // 도트 양피지 낱장: 창 크기 그대로 1:1 픽셀로 굽는다 (해진 네 변 · 디더 얼룩 · 그을린 모서리)
  function drawParchment(w, h, seed = 7) {
    const [c, g] = mkCanvas(w, h);
    let sd = seed * 9301 + 49297; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    const GW = Math.ceil(w / 22) + 2, GH = Math.ceil(h / 16) + 2, grid = Array.from({ length: GW * GH }, rnd);
    const noise = (x, y, sx = 22, sy = 16) => { const fx = x / sx, fy = y / sy, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, q = (i, j) => grid[((iy + j) % GH) * GW + ((ix + i) % GW)];
      return (q(0, 0) * (1 - tx) + q(1, 0) * tx) * (1 - ty) + (q(0, 1) * (1 - tx) + q(1, 1) * tx) * ty; };
    const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const TONE = ['#ddc9a0', '#cdb68a', '#bba275', '#a48a5e'], EDGE = '#8a6c44', BURN = '#5e4228', OUT = '#24160c', SH = '#050307';
    const x0 = 1, x1 = w - 5, y0 = 1, y1 = h - 5; // 종이 영역 (오른쪽·아래 3px은 그림자)
    // 해진 가장자리: 네 변 모두 줄마다 0~2px 안쪽으로 들어감 (걸음마다 1칸씩만)
    const walk = n => { const o = []; let v = 1; for (let i = 0; i < n; i++) { if (rnd() < 0.3) v = Math.max(0, Math.min(2, v + (rnd() < 0.5 ? -1 : 1))); o[i] = v; } return o; };
    const Lw = walk(h), Rw = walk(h), Tw = walk(w), Bw = walk(w);
    const inside = (x, y) => x >= x0 + Lw[y] && x <= x1 - Rw[y] && y >= y0 + Tw[x] && y <= y1 - Bw[x];
    const edgeD = (x, y) => Math.min(x - x0 - Lw[y], x1 - Rw[y] - x, y - y0 - Tw[x], y1 - Bw[x] - y);
    const burnC = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].filter(() => rnd() < 0.45); // 그을린 모서리
    if (!burnC.length) burnC.push([x1, y1]);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inside(x, y)) px(x + 3, y + 3, SH);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!inside(x, y)) continue;
      const d = edgeD(x, y), bay = BAY[(y & 3) * 4 + (x & 3)] / 16;
      let v = noise(x, y) * 2.1 + noise(x + 97, y + 53, 7, 6) * 0.7 - 0.4; // 0~3 톤 (큰 얼룩 + 잔결)
      let col = TONE[Math.max(0, Math.min(3, Math.floor(v + bay)))];
      if (d === 0) col = OUT; else if (d === 1) col = EDGE; else if (d === 2 && bay < 0.5) col = EDGE;
      for (const [bx, by] of burnC) { const k = Math.hypot((x - bx) / 34, (y - by) / 20); if (d > 0 && k < 1) { if (k < 0.45) col = k < 0.25 ? OUT : BURN; else if (bay > (k - 0.45) / 0.55) col = k < 0.7 ? BURN : EDGE; } }
      if (d > 2 && rnd() < 0.006) col = TONE[3]; // 섬유 반점
      px(x, y, col);
    }
    return c.toDataURL();
  }
  function bakeParchment() {
    const el = $('parchPaper'); if (!el) return;
    const w = el.offsetWidth, h = el.offsetHeight; if (!w || !h) return;
    el.style.backgroundImage = `url(${drawParchment(w, h, (parchState && parchState.stage || 1) * 13 + 5)})`;
    el.style.backgroundSize = `${w}px ${h}px`;
  }
  function parchPrompt() {
    const P = parchState; if (!P) return;
    const last = P.idx >= P.total - 1 && !P.typing && !(P.truth && P.truth.pages && (P.pg || 0) < P.truth.pages.length); // v3.75 다음 장이 남았으면 넘기기
    $('parchPrompt').innerHTML = `<span class="key go">F</span>${last ? (P.truth ? '닫기' : '출발') : '넘기기'}`; // v2.62 F 키 캡 통일 · 뒤 내용이 있으면 넘기기
    $('parchSkip').style.display = P.truth ? 'none' : '';
  }
  // v3.20 양피지 문단의 {강조}(해 · 낮 등): 말주머니와 같은 주황색 — 찍히는 글자 수는 괄호를 뺀 글자로 셈
  function parchPlain(s) { return String(s).replace(/[{}]/g, ''); }
  function parchHL(raw, n) { let out = '', k = 0, on = false; for (const ch of String(raw)) { if (ch === '{') { on = true; continue; } if (ch === '}') { on = false; continue; } if (k >= n) break; out += on ? `<span class="parchHL">${ch}</span>` : ch; k++; } return out; }
  function parchPaint() {
    const P = parchState, node = $('parchBody').children[P.idx]; if (!node) return;
    const t = P.paras[P.idx];
    node.querySelector('.typed').innerHTML = parchHL(t, P.ch) + (P.typing ? '<i class="stCaret"></i>' : '');
    node.querySelector('.rest').textContent = parchPlain(t).slice(P.ch);
  }
  function parchStopTimers() { const P = parchState; if (!P) return; clearInterval(P.tick); P.tick = null; clearTimeout(P.timer); P.timer = null; }
  function parchFinishLine() {
    const P = parchState; parchStopTimers();
    P.typing = false; P.ch = parchPlain(P.paras[P.idx]).length; parchPaint(); parchPrompt();
    if (P.idx < P.total - 1) P.timer = setTimeout(() => advanceStageParchment(), PARCH_AUTO);
  }
  function advanceStageParchment() {
    const P = parchState;
    if (!P) return;
    if (P.typing) { parchFinishLine(); return; } // 찍히는 중이면 그 문단을 마저 보여준다
    parchStopTimers();
    if (P.idx >= P.total - 1) {
      // v3.75 여러 장 양피지: o.pages = [[문단…], …] — 마지막 문단 뒤 F를 누르면 다음 장으로 넘김 (종이를 새로 굽고 첫 문단부터 다시 찍음)
      const more = P.truth && P.truth.pages, pg = P.pg || 0;
      if (more && pg < more.length) { P.pg = pg + 1; P.paras = more[pg]; P.total = P.paras.length; P.idx = -1; P.stage = pg + 2;
        $('parchBody').innerHTML = P.paras.map(t => `<div class="stPara wait"><span class="typed"></span><span class="rest">${parchPlain(t)}</span></div>`).join('');
        bakeParchment(); sfx('denCard'); parchPrompt(); P.timer = setTimeout(() => advanceStageParchment(), 260); return; }
      closeStageParchment(); return; }
    const nodes = $('parchBody').children;
    if (nodes[P.idx]) nodes[P.idx].classList.remove('cur');
    P.idx++; P.ch = 0; P.typing = true;
    nodes[P.idx].classList.remove('wait'); nodes[P.idx].classList.add('cur');
    sfx('blip', 0.9);
    parchPaint(); parchPrompt();
    P.tick = setInterval(() => {
      if (parchState !== P) return;
      P.ch = Math.min(parchPlain(P.paras[P.idx]).length, P.ch + 1);
      if (P.ch >= parchPlain(P.paras[P.idx]).length) parchFinishLine(); else parchPaint();
    }, 1000 / PARCH_CPS);
  }

  function closeStageParchment() {
    if (!parchState) return;
    parchStopTimers();
    const stg = parchState.stage, tr = parchState.truth;
    parchState = null;
    $('ovParchment').classList.remove('on');
    for (const k in pressed) pressed[k] = false;
    mode = 'play';
    sfx('select');
    if (tr) { if (tr.onClose) tr.onClose(); return; } // v2.58 진실 기록
    banner(`STAGE ${stg}`, `영원한 어둠의 땅 · ${STG().n}`, true); // v2.55 화면 가운데 · v3.23 상위 지명
  }

  function openChronicle(cls) {
    const D = CHRONICLE_DATA[cls];
    if (!D) return;
    const cnt = chronicleCount(cls), C = CLASSES[cls];
    const chapHtml = ['normal'].map(k => {
      const ch = D.endings[k];
      if (cnt) {
        return `<div class="chrChap"><div class="chrChapH"><span>${ch.title}</span><span class="tag">기록</span></div>${ch.text.map(p => `<p class="chrChapP">${p}</p>`).join('')}</div>`;
      }
      return `<div class="chrChap locked"><div class="chrChapH"><span>${ch.title}</span><span class="tag">미기록</span></div><div class="chrLockedMsg">아직 기록되지 않은 장</div></div>`;
    }).join('');

    $('chrModal').innerHTML = `
      <div class="chrTop">
        <div><h2>${C ? C.name : D.title} · 전기</h2><div class="sub">${C ? C.sub : ''}</div></div>
      </div>
      <div class="chrScroll"><div class="chrPro">${D.prologue}</div>${chapHtml}</div>
      <div class="menu"><button class="mi sel" id="btnChrClose">닫기 <span class="key kc">ESC</span></button></div>
    `;
    $('btnChrClose').addEventListener('click', closeChronicle);
    $('ovChronicle').classList.add('on');
    sfx('select');
  }
  function closeChronicle() {
    $('ovChronicle').classList.remove('on');
    sfx('blip');
  }

  addEventListener('keydown', e => {
    const k = keyName(e).toLowerCase();
    if ($('ovChronicle') && $('ovChronicle').classList.contains('on')) {
      if (k === 'escape') { e.stopImmediatePropagation(); closeChronicle(); }
      return;
    }
    if (mode === 'parchment' && parchState) {
      e.stopImmediatePropagation();
      if (k === 'escape') { if (!parchState.truth) closeStageParchment(); }
      else if (k === ' ' || k === 'f' || k === 'enter') advanceStageParchment();
    }
  }, true);
