'use strict';
// 잿빛 왕관 원정대 · frame.js — 합친 파일: 13_update_render.js, 14_rig.js, 15_lighting_title.js, 16_ui.js, 17_main.js (v3.84 파일 정리 · typeof로 먼저 확인하는 이름 몇 개는 var로 선언)

// ==================================================================== 13_update_render.js
'use strict';
// 잿빛 왕관 원정대 — 13_update_render.js : 보상, 휴식, 배너, 업데이트(매 프레임 로직), 렌더(그리기 순서), 보스 경고·버프 표시
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ---------------------------------------------------------------- 보상
  function bossDefeated(b) {
    if (G.sqz && !G.sqz.out) { G.sqz.out = true; G.sqz.outT = 0; } // v2.40 방책이 다시 하늘로 걷힌다
    rec(`boss_${G.cls}_${G.stage}`); { const P = G.player; if (P.hp <= 1) recOnce('u_glass'); if (G.hitStage !== G.stage) recOnce('u_staff'); if (G.stage === 1 && time - (G.stT0 || 0) < 480) recOnce('u_candle'); if (G.stage === 4) { const n = ['knight', 'ranger', 'mage', 'priest', 'gunner'].filter(c => (SAVE.rec[`boss_${c}_4`] || 0) > 0).length; SAVE.rec.cls4 = n; unlockCheck(); } } // v2.36 해금 기록 { const onFl = new Set(G.loot.filter(l => l.type === 'relic' && l.life > 0).map(l => l.relic)), left = Object.keys(RELICS).filter(k => !hasRelic(k) && !relicLocked(k) && !onFl.has(k)); if (left.length) { const l0 = G.loot.length; spawnLoot('relic', b.x, b.y - 4); const L1 = G.loot[l0]; if (L1) L1.relic = pick(left); } else { G.crystal += 2; lootFeed('유물이 더 없다 — 정령의 결정 +2', '#9fd2ff'); } } // v2.07 보스 유물
    if (G.bossClean) { G.bossClean = false; rec('nohit'); rec(`nohit_${G.cls}_${G.stage}`); spawnLoot('medal', b.x, b.y); lootFeed('한 번도 맞지 않고 쓰러뜨렸다 — 잿빛 훈장', '#ffd34d', 3500); } // v2.02
    window.AudioSys.setMood('victory', true);
    slowmo = 1.6; flashT = 0.2; flashColor = '#ffffff';
    G.vortex = null; G.tele = []; G.akRings = [];
    { const R = G.dun && G.dun.cur; if (R) { for (let i = 0; i < 3; i++) { const l0 = G.loot.length; spawnLoot('hue', b.x, b.y); if (G.loot[l0]) G.loot[l0].hue = G.stage === 4 ? pick(['r', 'b', 'g']) : R.hue; } startPaint(R, b.x, b.y); } } // v2.34 원색의 심장 · 색 물결
    G.enemies.forEach(e => { if (!e.dead && e !== b) killEnemy(e, true); });
    const endS = END.onBossDefeat(b); // v2.54 잿빛 왕: 붉은 출구 대신 굳은 몸 앞에 떨어진 왕관
    banner(G.stage < lastStage() ? `STAGE ${G.stage} 보스 처치` : `${STG().boss} 처치`, endS ? '전리품 상자를 열어라 · 떨어진 왕관을 주워라' : '전리품 상자를 열어라 · 탐색을 마치면 붉은 출구로');
    { const R = G.dun.cur; R.cleared = true; G.rs.state = 'done'; sealRoom(false); if (R.exitP && !endS) R.exit = R.exitP; } // v1.01: 보스를 잡아도 바로 넘어가지 않는다
    const n = (G.stage === 3 ? (Math.random() < 0.25 ? 3 : 2) : Math.random() < 0.25 ? 2 : 1) + (ascOn(5) ? 1 : 0); // v1.97 왕의 분노: 상자 +1
    G.newItems = []; const items = [];
    for (let i = 0; i < n; i++) items.push(makeItem(G.cls, G.stage === 3 ? { grade: rollGradeW([50, 42, 7.7, 0.3]), legendFx: 'tusk' } : {}));
    if (ascOn(8) && !items.some(it => GI[it.grade] >= 2)) items[0] = makeItem(G.cls, { grade: rollGradeW([0, 0, 80, 20]), legendFx: G.stage === 3 ? 'tusk' : undefined }); // v1.97 피의 칼: 유니크 이상 1개
    if (ascOn(10) && G.stage === lastStage() && !items.some(it => it.grade === 'legend')) items[items.length - 1] = makeItem(G.cls, { grade: 'legend' }); // v1.97 잿빛 왕관: 레전더리 확정
    if (b.ascRisen) { G.crystal += 2; lootFeed('재기한 보스 — 정령의 결정 +2', '#9fd2ff'); }
    G.dun.cur.chest = { x: CX, y: G.dun.cur.remains ? CY + 74 : CY - 10, opened: false, kind: 'boss', items, fall: 1 }; // v2.54 흔적이 있으면 그 앞에 // v0.98: 보스 장비는 하늘에서 떨어지는 상자로
    if (ascOn(2) || Math.random() < 0.4) G.crystal++; // v1.97 마른 샘: 보스 결정 확정
    if (G.stage === 3) G.crystal++;
    G.clear = true;
  }
  function itemCard(it, withEquip, isNew) {
    const g = gradeOf(it), sl = slotOf(it), eq = isEq(CUR, it), ok = canEquip(it, CUR), v = itemVal(it);
    const statTxt = PCT_STAT[it.stat] ? `${PCT_STAT[it.stat]} +${v}%` : `${sl.label} +${v}`;
    const fx = (it.fx ? `<div class="fx">★ ${LEGEND_FX[it.fx].d}</div>` : '') + itemExtra(it, it.cls || CUR);
    const btn = withEquip ? (ok ? `<button class="pbtn" data-eq="${it.id}">${eq ? '장착 중' : '장착'}</button>` : `<span class="f7" style="color:var(--quiet)">${CLASSES[it.cls].n} 전용</span>`) : '';
    return `<div class="item" style="--c:${g.c}">${isNew ? '<span class="new">NEW</span>' : ''}<div class="gr">${g.n} · ${slotName(it)}${ascTag(it)}</div><div class="nm">${it.name}${it.lv ? ` <span style="color:var(--gold-l)">+${it.lv}</span>` : ''}</div><div>${statTxt}</div>${it.opts.map(o => `<div>${optText(o)}</div>`).join('')}${fx}${btn}</div>`;
  }
  function statLine(cls) {
    const s = calcStats([], cls || CUR);
    return `${CLASSES[cls || CUR].n} 현재 장비 — 공격력 ${s.atk.toFixed(0)} · 체력 ${s.hp / 2}칸 · 치명타 확률 ${(s.crit * 100).toFixed(0)}% · 치명타 피해 ${(s.critDmg * 100).toFixed(0)}% · 쿨타임 감소 ${(s.cdr * 100).toFixed(0)}%`;
  }
  let resultShowAll = false, resultWin = false;
  function failPlace() { // v3.19 실패 장소: 프롤로그 · 기록 보관소 · 도박장처럼 ROOM_N에 없는 곳은 장소 이름으로, 던전은 STAGE + 방 이름
    const D = G.dun, R = D && D.cur; if (!R) return `STAGE ${G.stage}`;
    if (R.type === 'home') return typeof HOME !== 'undefined' ? HOME.name(R.cls || G.cls) || '시작 장소' : '시작 장소';
    if (R.type === 'archive') return '코코아의 기록 보관소';
    if (R.type === 'den') return '영수 · 명수의 안전 놀이터';
    if (R.type === 'ruin') return RUIN.name(); // v3.20 유폐된 지하 유적 · 용의 유적
    return ROOM_N[R.type] ? `STAGE ${G.stage} ${ROOM_N[R.type]}` : `STAGE ${G.stage}`;
  }
  function showResult(win, quit) {
    mode = 'result'; resultWin = win;
    window.AudioSys.setMood(win ? 'victory' : 'title', true);
    G.lostItems = SAVE.inv.length;
    let opened = false;
    let newChronicle = null;
    if (win) {
      takeBossItems(); commitRunMats(); SAVE.clears++;
      if (G.stage >= 3) SAVE.clears3 = (SAVE.clears3 || 0) + 1;
      if (G.stage >= 4) SAVE.clears4 = (SAVE.clears4 || 0) + 1;
      if (G.stage >= lastStage()) { const was = leg2Open(G.cls); newChronicle = recordChronicleEnding(G.cls); if (!was && leg2Open(G.cls)) (G.newUnl = G.newUnl || []).push('w:' + G.cls + ':10'); } // v2.29 레전더리 2 해금
    }
    else wipeRunItems(); // 사망·포기: 이번 런의 장비·재료·골드를 모두 잃는다
    SAVE.best = Math.max(SAVE.best || 0, (G.stage - 1) * 11 + G.phase);
    let ascMsg = ''; // v1.96 잿불 단계 돌파·해금
    if (win && false) { const A = SAVE.asc, L = G.asc || 0; // v2.29 잿불 단계 취소 A.best[G.cls] = Math.max(A.best[G.cls] == null ? -1 : A.best[G.cls], L);
      const first = !A.unl.includes(L); if (first) A.unl.push(L);
      { const bonus = 50 * L + (ascOn(6) ? Math.round(G.gold * 0.4) : 0); if (bonus) { SAVE.gold += bonus; G.ascBonus = bonus; } } // v1.97 클리어 정산 골드 · 궁핍 정산
      if (first && ASC_FIRST[L]) { const f = ASC_FIRST[L]; SAVE.gold += f.gold || 0; SAVE.mats.iron += f.iron || 0; SAVE.mats.crystal += f.crystal || 0; G.ascFirst = f; } // v1.97 첫 돌파 꾸러미
      if (L >= A.max && A.max < ASC_MAX) { A.max = L + 1; A.sel = A.max; ascMsg = L === 0 ? ` · 잿불 단계가 열렸습니다 (잿불 1 — ${ASC[1].n})` : ` · 잿불 ${L} 돌파 — 잿불 ${L + 1}(${ASC[L + 1].n})이 열렸습니다`; }
      else if (L > 0) ascMsg = ` · 잿불 ${L} 돌파`; }
    persist();
    resultShowAll = false;
    $('resTitle').textContent = win ? '원정 완료' : '원정 실패';
    { let n = $('resNight'); if (!n) { n = document.createElement('div'); n.id = 'resNight'; n.style.cssText = 'font-size:11px;color:#a89a84;letter-spacing:1px;margin-bottom:2px'; $('resTitle').before(n); } n.textContent = `영원한 어둠의 땅 · ${SAVE.runs}번째 밤`; } // v3.23 회차 = 밤
    $('resTitle').style.color = win ? 'var(--gold-l)' : '#ff7070';
    const chMsg = newChronicle ? ` · [전서 기록: ${newChronicle.label}]` : '';
    $('resSub').textContent = win ? `STAGE ${Array.from({ length: G.stage }, (_, i) => i + 1).join(' · ')} 돌파 · 처치 수 ${G.kills} · ${opened ? '오크 부락이 열렸습니다 — 다음 원정은 STAGE 3까지 이어집니다' : '다음 원정은 다시 빈손으로 시작합니다'}${ascMsg}${chMsg}` : `${failPlace()}에서 ${quit ? '원정을 포기했습니다' : '쓰러졌습니다'} · 장비 ${G.lostItems}개와 모든 재료·골드를 잃었습니다`;
    if (G.newUnl && G.newUnl.length) $('resSub').textContent += ' · 새로 열림: ' + G.newUnl.map(id => { const u = UNLOCKS.find(x => x.id === id); if (id.startsWith('w:')) { const [, c, i] = id.split(':'), W0 = wcat(c)[+i]; return `${GRADES.find(x => x.k === W0.grade).n} 무기 「${W0.name}」`; } return u && u.kind === 'r' ? RELICS[u.key].n : id; }).join(', ') + ' (코코아의 기록 보관소)'; // v2.29
    renderResultItems(win);
    $('ovResult').classList.add('on');
  }
  function renderResultItems(win) {
    const list = !win ? [] : resultShowAll ? SAVE.inv.slice().reverse() : [...G.newItems, ...G.fieldItems];
    $('resItems').innerHTML = list.length ? list.map(it => itemCard(it, true, !resultShowAll)).join('') : `<p>${!win ? '남은 장비가 없습니다.' : resultShowAll ? '보유 장비가 없습니다.' : '획득한 장비가 없습니다.'}</p>`;
    $('resMats').innerHTML = win ? `이번 런 — 골드 ${G.gold} · 철광석 조각 ${G.iron} · 정령의 결정 ${G.crystal} · 현장 장비 ${G.fieldItems.length}${G.ascBonus ? ` · <span style="color:#ffb040">잿불 정산 골드 +${G.ascBonus}</span>` : ''}${G.ascFirst ? ` · <span style="color:#ffb040">첫 돌파 꾸러미 ${[G.ascFirst.gold && `골드 ${G.ascFirst.gold}`, G.ascFirst.iron && `철광석 ${G.ascFirst.iron}`, G.ascFirst.crystal && `결정 ${G.ascFirst.crystal}`].filter(Boolean).join(' · ')}</span>` : ''}` : `<span style="color:#ff7070">잃음 — 골드 ${G.gold} · 철광석 조각 ${G.iron} · 정령의 결정 ${G.crystal} · 장비 ${G.lostItems}</span>`;
    $('resStats').textContent = statLine();
    $('btnInv').textContent = resultShowAll ? '이번 획득만 보기' : `장비 전체 보기 (${SAVE.inv.length})`;
    $('btnInv').style.display = win ? '' : 'none';
    $('resItems').querySelectorAll('[data-eq]').forEach(bt => bt.addEventListener('click', () => {
      const it = SAVE.inv.find(i => i.id === +bt.dataset.eq);
      equipIt(CUR, it); persist(); sfx('select'); renderResultItems(win);
    }));
  }

  // ---------------------------------------------------------------- 휴식
  function openRest() {
    mode = 'rest';
    const keysB = Object.keys(BUFFS).filter(k => !G.buffs.includes(k));
    const opts = [];
    rec('rest'); while (opts.length < 3 + (hasRelic('coal') ? 1 : 0) && keysB.length) opts.push(keysB.splice(randi(0, keysB.length - 1), 1)[0]);
    $('restChoices').innerHTML = BISTRO.menu(opts); /* v3.10 요리로 */ if (false) $('restChoices').innerHTML = opts.map((k, i) => `<button class="choice pf" data-b="${k}"><canvas class="px" width="16" height="16" data-icon="${k}"></canvas><b>${BUFFS[k].n}</b>${BUFFS[k].d}<br><span class="key">${i + 1}</span></button>`).join('');
    $('restChoices').querySelectorAll('canvas[data-icon]').forEach(c => drawIcon(c, BUFF_ICON[c.dataset.icon]));
    $('restChoices').querySelectorAll('[data-b]').forEach(bt => bt.addEventListener('click', () => chooseBuff(bt.dataset.b)));
    $('ovRest').classList.add('on');
  }
  function chooseBuff(k) {
    G.buffs.push(k); BISTRO.ate(k);
    const hp0 = G.stats.hp; G.stats = calcStats(G.buffs);
    G.player.hp = ascOn(9) ? Math.min(G.stats.hp, G.player.hp + Math.max(0, G.stats.hp - hp0)) : G.stats.hp; // v1.96 꺼진 모닥불: 꽉 채우지 않음
    $('ovRest').classList.remove('on');
    sfx('select');
    mode = 'play';
    restDone();
  }

  // ---------------------------------------------------------------- 배너
  let bannerTimer = null;
  let bannerWX = null; const bannerPlace = () => { if (bannerWX != null) $('banner').style.left = (Math.round(bannerWX - cam.x) - 240) + 'px'; }; // 카메라가 움직여도 맵 기준 가운데
  function banner(t, sub, mid, wx) { // mid: 화면 가운데 (스테이지 진입) · wx: 이 월드 x를 가운데로 (v3.10 맵 기준 가운데)
    const el = $('banner');
    el.classList.toggle('mid', !!mid);
    bannerWX = wx == null ? null : wx; if (wx != null) { el.style.right = 'auto'; el.style.width = '480px'; bannerPlace(); } else { el.style.left = el.style.right = el.style.width = ''; }
    el.innerHTML = `<div class="b1">${t}</div>${sub ? `<div class="b2 out">${sub}</div>` : ''}`;
    el.style.opacity = 1;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => { el.style.opacity = 0; }, 1500);
  }

  // ---------------------------------------------------------------- 업데이트
  const SAFE = { cx: VW / 2, cy: (70 + 350) / 2 }; // v3.18 캐릭터는 화면 가로 가운데 (예전: UI 패널을 뺀 영역의 중심이라 오른쪽으로 쏠림)
  // ---------------------------------------------------------------- 압박감 (v0.31)
  // 가까이 몰린 적이 많을수록 화면이 조여 오고(줌·어두운 테두리) 심장이 뛴다. 공격 직전 적은 으르렁거린다. 맞으면 살짝 밀려난다
  const WIND_STATES = new Set(['wind', 'hold', 'sqz', 'leap', 'dash', 'spit', 'bilecharge', 'dive']);
  function updatePressure(dt) {
    const P = G.player;
    G.slotT = (G.slotT || 0) - dt; if (G.slotT <= 0) { G.slotT = 0.4; assignSlots(); }
    let p = 0;
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - P.x, e.y - P.y);
      if (d < 160) p += (1 - d / 160) * (e.type === 'boss' ? 2.5 : isElite(e) ? 2 : 1);
      if (e.state !== e.pst) { if (WIND_STATES.has(e.state) && d < 240 && (G.growlT || 0) <= 0) { G.growlT = 0.22; sfx('growl', rand(0.8, 1.3)); } e.pst = e.state; }
    }
    G.growlT = (G.growlT || 0) - dt;
    G.press = (G.press || 0) + (p - (G.press || 0)) * Math.min(1, dt * 3);
    if (G.press > 1.3 && !P.dead) { G.beatT = (G.beatT || 0) - dt; if (G.beatT <= 0) { G.beatT = clamp(1.05 - G.press * 0.1, 0.5, 1); sfx('beat'); setTimeout(() => sfx('beat2'), 150); } }
    zoomK = Math.max(zoomK, Math.min(0.022, G.press * 0.006));
    // 맞고 밀려남
    if (P.kx || P.ky) {
      P.x += P.kx * dt; P.y += P.ky * dt; const k = Math.pow(0.0008, dt); P.kx *= k; P.ky *= k;
      if (Math.abs(P.kx) + Math.abs(P.ky) < 6) P.kx = P.ky = 0;
      solveObs(P, P.r); P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r);
    }
  }
  function updateCamera(dt, snap) {
    const P = G.player;
    // v1.07: 카메라는 캐릭터에 딱 붙음 (늦게 따라가며 미끄러지던 것·조준 방향 쏠림 제거). 보스전에서 보스 쪽 15% 보정만 천천히 바뀜
    const bk = snap ? 1 : Math.min(1, dt * 2.5), bxT = G.boss && !G.boss.dead ? (G.boss.x - P.x) * (G.boss.camK || 0.15) : 0, byT = G.boss && !G.boss.dead ? (G.boss.y - P.y) * (G.boss.camK || 0.15) : 0; /* v3.53 camK: 보스마다 보정 (교주 2페이즈 0.5) */
    cam.bx = (cam.bx || 0) + (bxT - (cam.bx || 0)) * bk; cam.by = (cam.by || 0) + (byT - (cam.by || 0)) * bk;
    let tx = P.x - SAFE.cx + cam.bx, ty = P.y - 10 - SAFE.cy + cam.by;
    { const OW = (typeof OUT2 !== 'undefined' && OUT2.wide && OUT2.wide()) || (typeof OUT3 !== 'undefined' && OUT3.wide && OUT3.wide()) || (typeof OUT4 !== 'undefined' && OUT4.wide && OUT4.wide()) /* v3.26 3장 고원 구름다리도 */ /* v3.26 2장 벽 바깥: 오른쪽 · 아래도 판석 턱과 다리까지 보이게 (왼쪽과 같은 여유) */, x0 = A.x0 - 136, x1 = A.x1 + (OW ? 136 : 16) - VW, y0 = A.y0 - ((typeof RUIN !== 'undefined' && RUIN.camTop && RUIN.camTop()) /* v3.21 교단 본거지: 윗벽 태피스트리까지 보이게 */ || (G.stage === 3 && G.dun && G.dun.cur && G.dun.cur.type === 'boss' ? 150 : 100)), y1 = A.y1 + (OW ? (((typeof OUT3 !== 'undefined' && OUT3.wide && OUT3.wide()) || (typeof OUT4 !== 'undefined' && OUT4.wide && OUT4.wide())) ? 150 : 120) : 88) - VH; /* v3.26 3장: 벼랑이 구름에 잠기는 데까지 */
      const cx = G.dun && G.dun.altar ? snap2((A.x0 + A.x1 - VW) / 2) /* v3.20 왕도 성문 방: 성문 · 제단이 화면 가로 가운데에 오도록 방을 가운데에 고정 */ : x1 >= x0 ? clamp(tx, x0, x1) : (A.x0 + A.x1 - VW) / 2, /* v3.18 화면보다 좁은 방은 방 가운데를 화면 가운데에 */ cy = y1 >= y0 ? clamp(ty, y0, y1) : (y0 + y1) / 2; cam.clX = cx !== tx; cam.clY = cy !== ty; tx = cx; ty = cy; }
    cam.x = tx; cam.y = ty;
    bannerPlace();
  }
  function update(rdt) {
    time += rdt;
    if (G) for (const a of G.ash) { a.x += (a.vx + Math.sin(time + a.y * 0.05) * 6) * rdt; a.y += a.vy * rdt; if (a.y > VH) { a.y = -4; a.x = rand(0, VW); } if (a.y < -6) a.y = VH; if (a.x < 0) a.x += VW; if (a.x > VW) a.x -= VW; }
    if (mode === 'map' && G) { updateMap(); return; }
    if (mode === 'wmap' && G) { updateWorldIntro(rdt); return; }
    if (mode !== 'play') return;
    if (G && G.cine) { updateCine(rdt); return; }
    if (G && CA.busy()) { CA.update(rdt); return; } // v2.52 재의 제단 연출 중엔 조작 없음
    if (G && END.busy()) { END.update(rdt); return; } // v2.54 엔딩 연출 중엔 조작 없음
    if (G && TRUTH.busy()) { flashT = Math.max(0, flashT - rdt); TRUTH.update(rdt); return; } // v3.83 연출 중에도 번쩍임이 줄어들게 (3장 공명 끝 번쩍임이 말주머니 동안 화면에 남던 문제) // v2.58 진엔딩 단서 대화 · 연출 중엔 조작 없음
    if (G && RUIN.busy()) { flashT = Math.max(0, flashT - rdt); RUIN.update(rdt); return; } // v3.84 대화 중에도 번쩍임이 줄어들게 (태양석 연출 뒤 화면이 계속 밝던 문제) // v3.20 용의 유적: 엠브라즈 대화 중엔 조작 없음
    if (G && DEN.busy()) { DEN.update(rdt); return; } // v3.18 안전 놀이터 도박사 대화 중엔 조작 없음 (F로 넘김)
    if (G && G.dun && G.dun.arch && ARCH.update(rdt)) return; // v3.00 코코아의 기록 보관소: 인사 · ESC로 나가기
    if (G && G.dun && G.dun.home && HOME.update(rdt)) return; // v2.55 시작 장소: 대사 · 장소 이름 · 아래 문으로 나가면 출발
    if (take('escape')) { openPause(); return; }
    if (take('tab')) { openMap(); return; }
    if (take('i')) { if (!G.player.dead && !G.trans) openInv('play'); return; }
    for (const n of ['1', '2', '3']) if (take(n)) { swapWeapon(+n - 1); break; } // v2.19 숫자키로 무기 바꾸기 (장비창 오른쪽 칸 순서)
    if (pressed.h !== 'shift' && take('h')) { /* v3.25 Shift+H(테스트: 빛의 샘)는 조작 안내를 켜지 않음 */ G.kg = !G.kg; G.kgT = G.kg ? 999 : 0; G.kgAuto = false; sfx('blip'); }
    if (G.tut && !G.cine) updateTut(rdt);
    if (G.kg && G.kgT < 900) { G.kgT -= rdt; if (G.kgT <= 0) G.kg = false; }
    // v3.20 테스트: 지금 캐릭터를 2회차(전기 있음)로 켜고 끔 — 끌 때는 켜기 전 전기 상태로 되돌림
    const devLoop2 = (want) => { const c = G.cls, B = SAVE.devLoop; // v3.20 실제 클리어 기록은 건드리지 않고 테스트용 강제 값만 바꿈 (예전 방식으로 바꿔 둔 기록은 되돌림)
      if (B && B[c] !== undefined) { const C = SAVE.chronicle = SAVE.chronicle || {}; if (B[c]) C[c] = JSON.parse(B[c]); else delete C[c]; delete B[c]; }
      const F = SAVE.devLoopF = SAVE.devLoopF || {}; F[c] = (want == null ? !TRUTH.loop2() : want) ? 1 : 0; persist(); return !!F[c]; };
    const dbgK = (k, d) => { if (d && !DEVK.has(k)) DEVK.set(k, d); /* v3.20 설명을 붙이면 테스트 모드 단축키 목록(오른쪽 UI)에 자동으로 실림 */ if (!DEV || pressed[k] !== 'shift') return false; /* v3.20 테스트 모드(?dev)일 때만 */ pressed[k] = false; return true; }; // v1.14 테스트 키는 Shift와 함께 (Shift+N·B·V·T·R·X), 그냥 누르면 아무 일 없음
    if (dbgK('?', '단축키 목록 열기 / 닫기')) { DEV_LIST = !DEV_LIST; try { localStorage.setItem('dfag_devlist', DEV_LIST ? '1' : '0'); } catch (e) {} sfx('blip'); } // v3.20
    if (dbgK('z', '1회차 ↔ 2회차 바꾸기 (지금 캐릭터)')) { const on = devLoop2(); lootFeed(on ? '테스트 — 2회차 (Shift+Z)' : '테스트 — 1회차 (Shift+Z)', on ? '#9fd2ff' : '#c8c0b0', 2600); sfx('blip'); } // v3.20 진엔딩 단서가 나오는 2회차로
    if (dbgK('q', '제단 방 잔해 앞으로 (진실 1~3 켜기 · 회차는 지금 그대로)') && !G.trans && !G.cine && !G.player.dead) { // v3.20 테스트: 4장 앞 제단 방 오른쪽 아래 잔해 앞으로 — 바람 · 부수기는 2회차(Shift+Z)일 때만
      G.truthRun = Object.assign(G.truthRun || {}, { t1: true, t2: true, t3: true });
      G.altarDone = false; G.stage = 3; G.noLoad = true; nextStage(); if (mode === 'wmap') wmEnd(); if (mode === 'parchment') closeStageParchment();
      const p = ALTARWIND.pos(); Object.assign(G.player, { x: p.x - 56, y: p.y - 18 }); lootFeed(TRUTH.loop2() ? '테스트 — 제단 방 잔해 앞 · 2회차 (Shift+Q)' : '테스트 — 제단 방 잔해 앞 · 1회차 (Shift+Q)', '#9fd2ff', 2600); sfx('blip'); return; }
    if (dbgK('n', '방 클리어 (적 전부 처치)') && !G.clear) debugClearRoom();
    if (dbgK('v', '스테이지 클리어')) { debugStageClear(); return; }
    for (const n of [1, 2, 3, 4]) if (dbgK('sd' + n, '해당 스테이지로 이동')) { if (G.trans || G.cine || G.player.dead) break; if (n === 4) G.altarDone = true; G.stage = n - 1; G.noLoad = true; nextStage(); if (mode === 'wmap') wmEnd(); if (mode === 'parchment') closeStageParchment(); /* 월드맵 연출 · 진입 문구는 건너뜀 */ lootFeed(`테스트 — ${n}장으로 건너뜁니다 (Shift+${n})`, '#9fd2ff', 2500); sfx('blip'); return; } // v3.19 테스트: Shift+1~4로 그 장의 첫 방으로 바로 이동 (4장은 재의 제단을 건너뜀)
    if (dbgK('t', '무기 순환 (도감 순서)')) { // 테스트: 무기 등급 순환 (커먼 → 레어 → 유니크 → 레전더리)
      const cw0 = eqWeapon(G.cls), nk = ((cw0 && cw0.wk != null ? cw0.wk : 0) + 1) % wcat(G.cls).length, W1 = wcat(G.cls)[nk]; // v2.03 도감 무기를 차례로
      const it = makeItem(G.cls, { grade: W1.grade, slot: 'weapon', wk: nk, noCurse: true }); lootFeed(`테스트 무기 ${nk + 1}/${wcat(G.cls).length} — ${it.name}`, gradeOf(it).c, 2500);
      SAVE.inv.push(it); eqOf(G.cls).weapon = it.id; G.stats = calcStats(G.buffs); persist();
      lootFeed(`<b style="color:${gradeOf(it).c}">[${gradeOf(it).n}] ${it.name}</b> 장착 (테스트)`, gradeOf(it).c); sfx('drop'); if (it.grade === 'legend') { if (G.seenLegendLore) delete G.seenLegendLore[it.fx]; triggerLegendPickup(it); }
    }
    if (dbgK('p', '빛 15개 얻기 (빨 → 파 → 초 차례로)')) { const cs = ['r', 'b', 'g'], c = cs[(G.engDbg = ((G.engDbg || 0) + 1)) % 3 === 1 ? 0 : G.engDbg % 3 === 2 ? 1 : 2]; hueGain(c, 15); } // v3.25 테스트: 빛을 재화로
    if (dbgK('h', '빛의 샘으로 (빛 각 45개)') && !G.clear && !G.trans && !G.cine) debugToShrine(); // v3.25
    if (dbgK('o', '무적 켜기 / 끄기')) { GOD_MODE = !GOD_MODE; lootFeed(GOD_MODE ? '테스트 — 무적 켜짐' : '테스트 — 무적 꺼짐', GOD_MODE ? '#9fd2ff' : '#9a8f8a', 2500); sfx('blip'); } // v2.40 테스트: 무적 켜기·끄기
    if (dbgK('y', 'RGB? 장비 + 빨강 조각 +10')) { const P = G.player; spawnLoot('gear', P.x + 30, P.y, makeRBY(G.cls)); hueGain('r', 10); lootFeed('테스트 — RGB? · 색 조각 +10', '#ff2a2a', 2500); } // v2.40 테스트: RGB? 떨어뜨림 + 색 조각
    if (dbgK('b', '보스 방으로') && !G.clear && G.dun.cur.type !== 'boss') debugToBoss();
    if (dbgK('r', '휴게방(비스트로)으로') && !G.clear && !G.trans && !G.cine) debugToRest(); // v3.10 테스트: 휴게방으로
    if (dbgK('sd5', '잊힌 틈새로 (생명의 제단 · 피의 제단 다시 쓰기)') && !G.clear && !G.trans && !G.cine && typeof BLOODALT !== 'undefined') BLOODALT.debugTo(); // v3.26 테스트: 잊힌 틈새로
    if (dbgK('sd6', '선조의 결투장 드나들기 (3장 아니면 3장으로 건너뛴 뒤)') && !G.clear) TRUTH3.debugAnc(); // v3.54 테스트
    if (dbgK('c', '용의 유적 드나들기') && !G.clear && !G.trans && !G.cine) RUIN.debugEnter(); // v3.20 테스트: 용의 유적으로 (Shift+C · 안에서 다시 누르면 나옴)
    if (dbgK('j', '교단의 갱도로 바로 가기') && !G.clear && !G.trans && !G.cine) RUIN.debugMine(); // v3.20 테스트: 갱도 (유적 밖이면 유적에 들어간 뒤 갱도로)
    if (dbgK('l', '불꽃 비늘 교주 전투 (지하 석실로 → 말 걸기 → 페이즈 넘기기)') && !G.clear && !G.trans && !G.cine) CULTB.debug(); // v3.53 테스트
    if (dbgK('m', '엠브라즈 앞으로 (교주 처치 · 용혈 덩어리를 가진 상태 → 말을 걸면 태양석 대화)') && !G.clear && !G.trans && !G.cine) RUIN.debugSun(); // v3.84 테스트
    if (dbgK('sd7', '쿠키 · 쿠오 요리 컷 보기 (누를 때마다 A 플립 협동 ↔ B 플람베 대소동 번갈아)') && !COOKCUT.on && !G.trans && !G.cine) { const m = (G.ckTest = !G.ckTest) ? 'B' : 'A', ks = ['atk', 'spd', 'hp', 'stam', 'cd']; mode = 'cook'; COOKCUT.play(ks[Math.floor(Math.random() * 5)], () => { mode = 'play'; }, m); } // v3.85
    if (dbgK('k', '교단 본거지로 (누를 때마다 앞 홀 → 교주의 방 → 지하 석실)') && !G.clear && !G.trans && !G.cine) RUIN.debugCult(); // v3.21 테스트
    if (dbgK('u', '안전 놀이터로') && !G.clear && !G.trans && !G.cine) DEN.debugEnter(); // v3.17 테스트: 영수 명수의 안전 놀이터로 (Shift+U)
    if (dbgK('x', '각성 게이지 가득')) { const P = G.player; if (P && !P.dead) { P.gauge = 100; lootFeed('테스트 — 각성 게이지 가득 (Shift+X)', '#ffd76a', 2500); sfx('blip'); } } // v3.16 테스트: 각성 게이지 채우기
    if (dbgK('g', '난입자 소환') && !G.clear && !G.trans && G.dun.cur.type !== 'boss' && !G.dun.forge && !G.enemies.some(x => !x.dead && INV_MAP[x.type])) { const R = G.dun.cur; R.invade = R.invade || INV_KIND[G.stage] || 'panda'; R.invaded = true; R.cleared = false; startInvasion(R); } // v1.57 테스트: 난입자 소환

    shake = Math.max(0, shake - rdt * 22);
    shakeX *= Math.pow(0.001, rdt); shakeY *= Math.pow(0.001, rdt);
    flashT = Math.max(0, flashT - rdt);
    zoomK *= Math.pow(0.0004, rdt); if (zoomK < 0.001) zoomK = 0;
    stopHeat = Math.max(0, stopHeat - rdt * 1.5);
    for (const e of G.enemies) if (e.shk > 0) e.shk -= rdt;
    if (G.combo && G.combo.pop > 0) G.combo.pop -= rdt;
    if (updateTrans(rdt)) return;
    if (hitstop > 0) { hitstop -= rdt; return; }
    let dt = rdt;
    if (slowmo > 0) { slowmo -= rdt; dt *= 0.35; }

    updatePlayer(dt);
    ascTick(dt); // v1.96 잿빛 왕관
    updatePressure(dt);
    updateRoom(dt);
    TRUTH.tick(dt); DEN.tick(dt); RUIN.tick(dt); BDC.tick(dt); CULTB.tick(dt); /* v3.53 교주 전투 */ // v2.58 · v3.17 안전 놀이터
    updateCamera(dt);
    updateProj(dt);
    const fxE0 = G.fx.length, ptE0 = G.parts.length; // v2.28 적이 만든 이펙트 표시 (반격 시간 흑백용)
    updateEProj(dt);
    updateOrcWorld(dt);
    for (const e of G.enemies) if (!e.dead && isDummy(e)) { stTick(e, dt); e.flash = Math.max(0, e.flash - dt); e.lean *= Math.pow(0.02, dt); e.x = e.hx; e.y = e.hy; e.vx = e.vy = 0; if (e.bleedT > 0) {} }
    for (const e of G.enemies) if (!e.dead && !isDummy(e)) { stTick(e, dt); if (e.grogiMax && e.grogi > 0 && !(e.grogiT > 0) && time - (e.grogiHitT || 0) > GROGI_DECAY.wait) e.grogi = Math.max(0, e.grogi - e.grogiMax * GROGI_DECAY.rate * dt); /* v2.19 그로기 게이지 자연 감소 */ const edt = dt * stScale(e); /* v2.03 상태 효과 */ if (e.type === 'boss') { if (e.kind === 'slimeking') { updateSlimeKing(e, edt); slimeKingStage(e); } else if (e.kind === 'krugash') updateKrugash(e, edt); else if (e.kind === 'ashking') updateAshKing(e, edt); else { updateBoss(e, edt); bossStageCheck(e); } } else if (e.hitStun > 0 && e.state === 'chase') hitStunTick(e, edt); else { e.hitStun = 0; engDecoyUpd(e, edt); } }
    for (let i = fxE0; i < G.fx.length; i++) G.fx[i].en = 1; for (let i = ptE0; i < G.parts.length; i++) G.parts[i].en = 1;
    weaponTick(dt); // v2.03 무기 기술
    const P = G.player;
    const live = G.enemies.filter(e => !e.dead && !isDummy(e)); // v2.04 허수아비는 밀리지 않음
    for (let i = 0; i < live.length; i++) {
      const a = live[i];
      for (let j = i + 1; j < live.length; j++) {
        const b = live[j]; if (a.crewOf === b || b.crewOf === a || (a.crewOf && a.crewOf === b.crewOf)) continue; // v3.33 거치 무기 병사: 자기 무기 · 같은 무기 병사와는 밀지 않음
        const d = dist(a, b), m = a.r + b.r;
        if (d < m && d > 0.01) { const push = (m - d) / 2, ux = (a.x - b.x) / d, uy = (a.y - b.y) / d; if (a.type !== 'boss' && a.type !== 'flag') { a.x += ux * push; a.y += uy * push; } if (b.type !== 'boss' && b.type !== 'flag') { b.x -= ux * push; b.y -= uy * push; } }
      }
      if (!P.dead && P.state !== 'dodge' && P.state !== 'charge') {
        const d = dist(a, P), m = a.r + P.r - 2;
        if (d < m && d > 0.01) { const ux = (P.x - a.x) / d, uy = (P.y - a.y) / d; P.x += ux * (m - d); P.y += uy * (m - d); }
      }
      if (a.type !== 'crow' && !(a.type === 'boss' && (a.kind === 'krugash' || a.state === 'jump' || a.z > 0))) solveObs(a, a.r);
      a.x = clamp(a.x, A.x0 + a.r, A.x1 - a.r); a.y = clamp(a.y, A.y0 + a.r, A.y1 - a.r);
    }
    G.enemies = G.enemies.filter(e => !e.dead || e.type === 'boss');
    squeezeTick(dt); // v2.40 크루가쉬 3단계 방책
    engTick(dt); engTryOpen(); // v2.41 빛의 각인
    G.tele = G.tele.filter(t => !t.oa || (t.owner && !t.owner.dead && t.owner.state === 'seq'));
    G.tele = G.tele.filter(t => !t.oSt || (t.owner && !t.owner.dead && t.oSt.includes(t.owner.state))); /* v3.65 공격이 끊기면 예고도 지움 */
    for (const t of G.tele) {
      t.t += dt * (t.owner && t.owner.type === 'boss' ? ASCF.bossTele() : 1) * (t.owner ? stScale(t.owner) : 1) * engTeleRate(t); // v1.96 왕의 분노 · v2.03 둔화·기절이면 예고도 같이
      if (t.pin) { const Q = t.owner && t.owner.air; if (Q) { t.x = Q.x1; t.y = Q.y1; } }
      if (t.owner && !t.owner.dead && t.follow && t.t < t.dur * 0.6) { t.x = t.owner.x; t.y = t.owner.y; t.ang = angTo(t.owner, P); if (t.owner.sw == null && t.owner.blade) t.owner.bladeTarget = t.ang - ((t.owner.step % 2 ? 1 : -1) * t.owner.face) * 115 * DEG; }
      if (t.track && t.t < t.dur - 0.6) { t.x += (P.x - t.x) * Math.min(1, dt * 6); t.y += (P.y - t.y) * Math.min(1, dt * 6); }
    }
    const fxE1 = G.fx.length, ptE1 = G.parts.length;
    const fired = G.tele.filter(t => t.t >= t.dur);
    G.tele = G.tele.filter(t => t.t < t.dur);
    for (const t of fired) {
      if (t.shape !== 'spawn' && t.shape !== 'line' && !t.noImpact) G.fx.push({ kind: 'impact', shape: t.shape, x: t.x, y: t.y, r: t.r, ang: t.ang, arc: t.arc, t: t.heavy ? 0.3 : 0.2, max: t.heavy ? 0.3 : 0.2, mark: t.mark });
      if (isKrug(t.owner) && !t.owner.dead && t.shape !== 'line' && t.shape !== 'spawn' && t.ff !== false) krugHitShape(t, t.owner.atk * 0.8, t.owner);
      t.onFire && t.onFire(t);
      engTeleFired(t); // v2.41 붉은 표적판
    }
    for (const h of G.hazards) {
      h.t -= dt;
      if (Math.hypot(P.x - h.x, P.y - h.y) < h.r + P.r - 3) { h.tick -= dt; if (h.tick <= 0) { h.tick = 0.5; hurtPlayer(4, null, false, true); } }
    }
    G.hazards = G.hazards.filter(h => h.t > 0);
    updateVortex(dt);
    for (let i = fxE1; i < G.fx.length; i++) G.fx[i].en = 1; for (let i = ptE1; i < G.parts.length; i++) G.parts[i].en = 1;
    for (const p of G.parts) {
      p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; p.vx *= 0.96; // v1.85 g 없는 파티클이 NaN 되던 것
      if (p.floor && p.y > p.floor && p.g > 0) { if (p.c === '#8f1418' || p.c === '#a3161c') { dg.fillStyle = 'rgba(100,10,16,.6)'; dg.fillRect(Math.round(p.x) & ~1, Math.round(p.y) & ~1, 2, 2); } p.t = 0; }
    }
    { let j = 0; const A_ = G.parts; for (let i = 0; i < A_.length; i++) if (A_[i].t > 0) A_[j++] = A_[i]; A_.length = j; if (j > 420) A_.splice(0, j - 420); } // v1.78 새 배열 없이 정리 + 상한 420
    for (const n of G.nums) { n.t -= dt; n.pop = Math.max(0, (n.pop || 0) - dt); n.x += (n.vx || 0) * dt; n.vx = (n.vx || 0) * Math.pow(0.02, dt); n.vy = (n.vy == null ? -24 : Math.min(-14, n.vy + 160 * dt)); n.y += n.vy * dt; }
    if (G.combo && G.combo.n > 0) { G.combo.t -= dt; if (G.combo.t <= 0) G.combo.n = 0; }
    if (G.corpses) { for (const c of G.corpses) updateCorpse(c, dt); G.corpses = G.corpses.filter(c => c.t > 0); }
    G.nums = G.nums.filter(n => n.t > 0);
    for (const f of G.fx) { f.t -= dt; if (f.grow) f.r += f.grow * dt; if (f.kind === 'spark') { f.x += Math.cos(f.ang) * f.sp * dt; f.y += Math.sin(f.ang) * f.sp * dt; } }
    G.fx = G.fx.filter(f => f.t > 0);
    for (const d of G.drops) d.t += dt;
    updateLoot(dt);
    updateMProj(dt); updateMeteor(dt);
    P.hpBack += (P.hp - P.hpBack) * Math.min(1, rdt * 3);
  }

  // ---------------------------------------------------------------- 렌더
  // 텔레그래프: 바닥(어둠 아래) + 발광(조명 위) 두 단계로 그린다
  function telePath(t, k = 1) {
    ctx.beginPath();
    if (t.shape === 'circle' && t.inner) { ctx.arc(t.x, t.y, Math.max(0.1, t.inner + (t.r - t.inner) * k), 0, TAU); ctx.moveTo(t.x + t.inner, t.y); ctx.arc(t.x, t.y, t.inner, TAU, 0, true); } // v3.58 도넛 (몸 쪽이 빈 원)
    else if (t.shape === 'circle') ctx.arc(t.x, t.y, Math.max(0.1, t.r * k), 0, TAU);
    else if (t.shape === 'cone') { ctx.moveTo(t.x, t.y); ctx.arc(t.x, t.y, Math.max(0.1, t.r * k), t.ang - t.arc / 2, t.ang + t.arc / 2); ctx.closePath(); }
    else if (t.shape === 'line') {
      const ux = Math.cos(t.ang), uy = Math.sin(t.ang), nx = -uy * t.w / 2, ny = ux * t.w / 2, L = t.len * k;
      ctx.moveTo(t.x + nx, t.y + ny); ctx.lineTo(t.x + ux * L + nx, t.y + uy * L + ny); ctx.lineTo(t.x + ux * L - nx, t.y + uy * L - ny); ctx.lineTo(t.x - nx, t.y - ny); ctx.closePath();
    }
  }
  function teleFront(t, p) {
    ctx.beginPath();
    if (t.shape === 'circle') ctx.arc(t.x, t.y, Math.max(0.1, t.inner ? t.inner + (t.r - t.inner) * p : t.r * p), 0, TAU);
    else if (t.shape === 'cone') ctx.arc(t.x, t.y, Math.max(0.1, t.r * p), t.ang - t.arc / 2, t.ang + t.arc / 2);
    else if (t.shape === 'line') { const ux = Math.cos(t.ang), uy = Math.sin(t.ang), cx = t.x + ux * t.len * p, cy = t.y + uy * t.len * p; ctx.moveTo(cx - uy * t.w / 2, cy + ux * t.w / 2); ctx.lineTo(cx + uy * t.w / 2, cy - ux * t.w / 2); }
  }
  function teleEdgePoint(t) {
    if (t.shape === 'circle') { const a = rand(0, TAU); return { x: t.x + Math.cos(a) * t.r, y: t.y + Math.sin(a) * t.r }; }
    if (t.shape === 'cone') { const a = t.ang + rand(-t.arc / 2, t.arc / 2); return { x: t.x + Math.cos(a) * t.r, y: t.y + Math.sin(a) * t.r }; }
    const k = rand(0, 1), sd = Math.random() < 0.5 ? 1 : -1;
    return { x: t.x + Math.cos(t.ang) * t.len * k - Math.sin(t.ang) * t.w / 2 * sd, y: t.y + Math.sin(t.ang) * t.len * k + Math.cos(t.ang) * t.w / 2 * sd };
  }
  // 직선 예고(돌진선 등)의 양끝을 디더링으로 흐리게 (v0.80): 가운데는 그대로, 끝 쪽 F px는 2px 칸 베이어 디더로 점점 성기게 잘라낸 클립 안에 그린다
  function withLineFade(t, draw) {
    const F = Math.min(72, t.len * 0.3), W = t.w / 2 + 16, ux = Math.cos(t.ang), uy = Math.sin(t.ang), nx = -uy, ny = ux;
    ctx.save(); ctx.beginPath();
    const P4 = (u0, u1) => { ctx.moveTo(t.x + ux * u0 + nx * W, t.y + uy * u0 + ny * W); ctx.lineTo(t.x + ux * u1 + nx * W, t.y + uy * u1 + ny * W); ctx.lineTo(t.x + ux * u1 - nx * W, t.y + uy * u1 - ny * W); ctx.lineTo(t.x + ux * u0 - nx * W, t.y + uy * u0 - ny * W); ctx.closePath(); };
    if (t.len > F * 2) P4(F, t.len - F);
    for (const [ua, ub, dir] of [[-6, F, 1], [t.len - F, t.len + 26, -1]]) {
      const cs = [[ua, -W], [ua, W], [ub, -W], [ub, W]].map(([u, v]) => [t.x + ux * u + nx * v, t.y + uy * u + ny * v]);
      const x0 = Math.floor(Math.min(...cs.map(c => c[0])) / 2) * 2, x1 = Math.max(...cs.map(c => c[0])), y0 = Math.floor(Math.min(...cs.map(c => c[1])) / 2) * 2, y1 = Math.max(...cs.map(c => c[1]));
      for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) {
        const dx = x + 1 - t.x, dy = y + 1 - t.y, u = dx * ux + dy * uy, v = dx * nx + dy * ny; if (u < ua || u > ub || Math.abs(v) > W) continue;
        const k = dir > 0 ? (u + 6) / (F + 6) : (t.len + 26 - u) / (F + 26); if (dith(x >> 1, y >> 1, Math.min(1, k * 1.05))) ctx.rect(x, y, 2, 2);
      }
    }
    ctx.clip(); draw(); ctx.restore();
  }
  function drawTele(t) {
    if (t.shape === 'line' && !t.fading) { t.fading = true; withLineFade(t, () => drawTele(t)); t.fading = false; return; }
    const p = clamp(t.t / t.dur, 0, 1);
    ctx.save();
    if (t.shape === 'spawn') {
      const k = 0.5 + p * 0.7, c = t.portal ? '120,170,255' : '150,60,180';
      ctx.fillStyle = `rgba(20,6,26,${0.5 + p * 0.4})`;
      ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * k, t.r * 0.45 * k, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(${c},${0.4 + p * 0.5})`; ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) { const a = time * 3 + i / 8 * TAU; ctx.fillStyle = `rgba(${c},${0.5 + p * 0.5})`; ctx.fillRect(Math.round(t.x + Math.cos(a) * t.r * k * 1.15), Math.round(t.y + Math.sin(a) * t.r * 0.5 * k * 1.15), 2, 1); }
      ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * k, t.r * 0.45 * k, 0, 0, TAU); ctx.stroke();
      if (Math.random() < 0.5) G.parts.push({ x: t.x + rand(-t.r, t.r) * 0.7, y: t.y, vx: 0, vy: -rand(20, 50), t: 0.5, c: t.portal ? '#9cc1ea' : '#5a1f78', g: 0, glow: !!t.portal });
      ctx.restore(); return;
    }
    if (t.mark) { drawMarkTele(t, p); ctx.restore(); return; }
    if (t.weak) { drawWeakTele(t, p); ctx.restore(); return; }
    if (isBossTele(t)) { drawBossTele(t, p); ctx.restore(); return; }
    const col = t.mark ? '120,30,170' : '170,10,20';
    ctx.fillStyle = `rgba(${col},${0.22 + 0.16 * p})`; telePath(t); ctx.fill();
    // 내부 경고 빗금 (흐름)
    telePath(t); ctx.clip();
    const R = (t.shape === 'line' ? t.len : t.r) + 20, off = (time * 40) % 14;
    ctx.strokeStyle = `rgba(${t.mark ? '170,70,230' : '230,30,40'},${0.18 + 0.22 * p})`; ctx.lineWidth = 4;
    for (let d = -R * 2; d < R * 2; d += 14) { ctx.beginPath(); ctx.moveTo(t.x + d + off - R, t.y - R); ctx.lineTo(t.x + d + off + R, t.y + R); ctx.stroke(); }
    // 차오르는 진행도
    ctx.fillStyle = `rgba(${t.mark ? '160,60,220' : '220,25,30'},${0.25 + 0.35 * p})`; telePath(t, p); ctx.fill();
    ctx.restore();
  }
  // ---------- 보스 패턴 경고 (v0.62): 일반 몬스터의 붉은 빗금과 다르게 — 짙은 진홍 바탕 + 금빛 이중 테두리 · 돌아가는 룬 · 밖으로 퍼지는 파문/쉐브론 · 가운데 해골 문장
  const isBossTele = t => t.owner && t.owner.type === 'boss' && !t.mark;
  const SKULL = ['.kkkkk.', 'kwwwwwk', 'kwkwkwk', 'kwwwwwk', '.kwkwk.', '..kkk..'];
  function teleCenter(t) { if (t.shape === 'circle') return { x: t.x, y: t.y }; const L = t.shape === 'line' ? t.len * 0.5 : t.r * 0.55; return { x: t.x + Math.cos(t.ang) * L, y: t.y + Math.sin(t.ang) * L }; }
  function drawBossTele(t, p) {
    ctx.fillStyle = `rgba(70,4,24,${0.38 + 0.2 * p})`; telePath(t); ctx.fill();
    telePath(t); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    if (t.shape === 'line') { // 진행 방향으로 흐르는 금빛 쉐브론
      const ux = Math.cos(t.ang), uy = Math.sin(t.ang), step = 18, off = (time * 120) % step, s2 = t.w * 0.42;
      ctx.lineWidth = 3;
      for (let d = off - step; d < t.len + step; d += step) { const cx = t.x + ux * d, cy = t.y + uy * d; ctx.strokeStyle = `rgba(255,${150 + 60 * p},60,${0.25 + 0.35 * p})`; ctx.beginPath(); ctx.moveTo(cx - ux * s2 - uy * s2, cy - uy * s2 + ux * s2); ctx.lineTo(cx, cy); ctx.lineTo(cx - ux * s2 + uy * s2, cy - uy * s2 - ux * s2); ctx.stroke(); }
    } else { // 중심에서 밖으로 퍼지는 파문
      const R = t.r, sp = 26;
      for (let k = 0; k < 4; k++) { const rr = ((time * 70 + k * R / 4) % R); ctx.strokeStyle = `rgba(255,${120 + 100 * (rr / R)},60,${(0.15 + 0.35 * p) * (1 - rr / R * 0.6)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.x, t.y, Math.max(1, rr), 0, TAU); ctx.stroke(); }
      if (t.shape === 'cone') for (let i = -2; i <= 2; i++) { const a = t.ang + i / 2 * t.arc / 2 * 0.85; ctx.strokeStyle = `rgba(255,200,90,${0.12 + 0.2 * p})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x + Math.cos(a) * R, t.y + Math.sin(a) * R); ctx.stroke(); }
    }
    // 차오르는 진행도: 진홍 → 금빛
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(${200 + 55 * p},${40 + 120 * p * p},${30},${0.22 + 0.3 * p})`; telePath(t, p); ctx.fill();
  }
  function drawBossTeleGlow(t, p) {
    const near = p > 0.75, flick = near ? (Math.floor(time * 26) % 2 ? 1 : 0.45) : 0.8 + Math.sin(time * 9) * 0.2;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // 이중 테두리: 바깥 금빛 두꺼운 선 + 안쪽 흰 선
    ctx.strokeStyle = `rgba(255,190,70,${(0.6 + 0.4 * p) * flick})`; ctx.lineWidth = 3; telePath(t); ctx.stroke();
    ctx.strokeStyle = `rgba(255,245,220,${(0.35 + 0.5 * p) * flick})`; ctx.lineWidth = 1; telePath(t); ctx.stroke();
    ctx.fillStyle = `rgba(255,80,40,${(0.04 + 0.16 * p * p) * flick})`; telePath(t); ctx.fill();
    // 진행 경계선
    ctx.strokeStyle = 'rgba(255,240,200,.95)'; ctx.lineWidth = 2; teleFront(t, p); ctx.stroke();
    // 테두리를 따라 도는 룬 점
    const n = t.shape === 'circle' ? 20 : 14;
    for (let i = 0; i < n; i++) {
      let x, y; const u = (i / n + time * 0.25) % 1;
      if (t.shape === 'circle') { const a = u * TAU; x = t.x + Math.cos(a) * (t.r + 4); y = t.y + Math.sin(a) * (t.r + 4); }
      else if (t.shape === 'cone') { const a = t.ang - t.arc / 2 + u * t.arc; x = t.x + Math.cos(a) * (t.r + 4); y = t.y + Math.sin(a) * (t.r + 4); }
      else { const sd = i % 2 ? 1 : -1; x = t.x + Math.cos(t.ang) * t.len * u - Math.sin(t.ang) * (t.w / 2 + 4) * sd; y = t.y + Math.sin(t.ang) * t.len * u + Math.cos(t.ang) * (t.w / 2 + 4) * sd; }
      ctx.fillStyle = i % 3 ? `rgba(255,210,110,${0.85 * flick})` : `rgba(255,255,255,${flick})`; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, i % 3 ? 2 : 3, i % 3 ? 2 : 3);
    }
    // 가운데 해골 문장 (커졌다 작아지며 깜빡임)
    ctx.globalCompositeOperation = 'source-over';
    if ((t.shape === 'circle' && t.r < 30) || t.quiet) { ctx.restore(); return; } // 작은 원·가시 경고선엔 해골 문장 생략
    const c = teleCenter(t), sc = 2 + (near ? 1 : 0), w = SKULL[0].length * sc, h = SKULL.length * sc, bx = Math.round(c.x - w / 2), by = Math.round(c.y - h / 2 - 4);
    ctx.globalAlpha = (0.55 + 0.45 * p) * flick;
    SKULL.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { const ch = r[xx]; if (ch === '.') continue; ctx.fillStyle = ch === 'k' ? '#2a0408' : near ? '#ffffff' : '#ffd070'; ctx.fillRect(bx + xx * sc, by + yy * sc, sc, sc); } });
    ctx.globalAlpha = 1;
    ctx.restore();
    // 금빛·붉은 불티와 직전의 흰 섬광
    if (Math.random() < 0.95) { const e = teleEdgePoint(t); G.parts.push({ x: e.x, y: e.y, vx: rand(-10, 10), vy: -rand(30, 70), t: 0.55, c: pick(['#ffd070', '#ff6030', '#fff2c0']), g: 0, glow: true }); }
    if (near && Math.random() < 0.5) { const e = teleEdgePoint(t); G.parts.push({ x: e.x, y: e.y, vx: 0, vy: -rand(60, 110), t: 0.35, c: '#ffffff', g: 0, glow: true }); }
  }
  // ---------- 발도르 「죽음의 표식」 (v0.67): 회전하는 이중 마법진 + 조여 오는 조준 괄호 + 보스와 이어진 사슬 + 하늘에서 내려오는 망령 대검
  function drawMarkTele(t, p) {
    const R = t.r, cx = t.x, cy = t.y;
    ctx.fillStyle = `rgba(30,6,48,${0.22 + 0.15 * p})`; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { const rr = R * (1 - ((time * 0.9 + k / 3) % 1)); ctx.strokeStyle = `rgba(190,90,255,${0.35 * (1 - rr / R) + 0.1})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, rr), 0, TAU); ctx.stroke(); } // 안으로 빨려드는 파문
    ctx.restore();
    ctx.fillStyle = `rgba(150,40,220,${0.12 + 0.18 * p})`; ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, R * p), 0, TAU); ctx.fill();
  }
  function drawMarkGlow(t, p) {
    const R = t.r, cx = t.x, cy = t.y, near = p > 0.72, flick = near ? (Math.floor(time * 24) % 2 ? 1 : 0.5) : 0.8 + 0.2 * Math.sin(time * 8);
    const b = t.owner, poly = (n, r, a0, step) => { ctx.beginPath(); for (let i = 0; i <= n; i++) { const a = a0 + (i * step % n) / n * TAU; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); };
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // 보스와 이어진 사슬 (추적 중임을 보여 줌)
    if (b && !b.dead) { const dx = cx - b.x, dy = cy - (b.y - 30), L = Math.hypot(dx, dy), n = Math.floor(L / 10); for (let i = 1; i < n; i++) { const k = i / n, w = Math.sin(k * Math.PI) * 10 * Math.sin(time * 3); if ((i + Math.floor(time * 12)) % 3 === 0) continue; ctx.fillStyle = `rgba(200,120,255,${0.25 + 0.35 * p})`; ctx.fillRect(Math.round(b.x + dx * k - dy / L * w) - 1, Math.round(b.y - 30 + dy * k + dx / L * w) - 1, 3, 2); } }
    // 바깥 고리 (두꺼운 보라 + 흰 선) · 룬 눈금 · 반대로 도는 안쪽 고리
    ctx.strokeStyle = `rgba(200,100,255,${(0.7 + 0.3 * p) * flick})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(255,235,255,${0.7 * flick})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R - 3, 0, TAU); ctx.stroke();
    for (let i = 0; i < 24; i++) { const a = time * 0.8 + i / 24 * TAU, l = i % 3 ? 3 : 7; ctx.strokeStyle = `rgba(230,170,255,${0.8 * flick})`; ctx.lineWidth = i % 3 ? 1 : 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - 4), cy + Math.sin(a) * (R - 4)); ctx.lineTo(cx + Math.cos(a) * (R - 4 - l), cy + Math.sin(a) * (R - 4 - l)); ctx.stroke(); }
    ctx.strokeStyle = `rgba(220,150,255,${0.6 * flick})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R * 0.62, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(210,130,255,${(0.5 + 0.4 * p) * flick})`; ctx.lineWidth = 2; poly(5, R * 0.6, -time * 1.4 - Math.PI / 2, 2); // 오망성
    for (let i = 0; i < 5; i++) { const a = -time * 1.4 - Math.PI / 2 + i / 5 * TAU; ctx.fillStyle = `rgba(255,240,255,${flick})`; ctx.fillRect(Math.round(cx + Math.cos(a) * R * 0.6) - 2, Math.round(cy + Math.sin(a) * R * 0.6) - 2, 4, 4); }
    // 조여 오는 조준 괄호 4개
    const g = R * (1.7 - 0.85 * p) + Math.sin(time * 10) * 2, arm = 9;
    ctx.strokeStyle = `rgba(255,${near ? 255 : 120},${near ? 255 : 220},${0.9 * flick})`; ctx.lineWidth = 2;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const x = cx + sx * g * 0.72, y = cy + sy * g * 0.72; ctx.beginPath(); ctx.moveTo(x - sx * arm, y); ctx.lineTo(x, y); ctx.lineTo(x, y - sy * arm); ctx.stroke(); }
    // 하늘에서 내려오는 망령 대검 (닿는 순간 폭발)
    const top = cy - 170 + 140 * p * p, blen = 54, bx = Math.round(cx), al = (0.25 + 0.6 * p) * flick;
    ctx.fillStyle = `rgba(150,60,230,${al * 0.5})`; ctx.fillRect(bx - 5, top - blen - 6, 10, blen + 16);
    ctx.fillStyle = `rgba(230,190,255,${al})`; ctx.fillRect(bx - 2, top - blen, 4, blen); ctx.fillRect(bx - 1, top, 2, 6);
    ctx.fillStyle = `rgba(255,255,255,${al})`; ctx.fillRect(bx - 1, top - blen, 1, blen);
    ctx.fillStyle = `rgba(200,120,255,${al})`; ctx.fillRect(bx - 9, top - blen - 2, 18, 3); ctx.fillRect(bx - 2, top - blen - 12, 4, 10);
    for (let i = 0; i < 3; i++) { const yy = top + 8 + ((time * 160 + i * 20) % Math.max(10, cy - top - 8)); if (yy < cy) { ctx.fillStyle = `rgba(220,160,255,${0.5 * al})`; ctx.fillRect(bx - 1, Math.round(yy), 2, 6); } }
    ctx.globalCompositeOperation = 'source-over';
    // 카운트다운: 박동하며 커진다
    const sec = Math.ceil(t.dur - t.t), beat = 1 - ((t.t % 1)), sc = 3 + (beat > 0.8 ? 1 : 0) + (near ? 1 : 0);
    drawNumber(String(sec), cx, cy - 6, near ? '#ffffff' : '#f0c8ff', sc);
    ctx.restore();
    if (Math.random() < 0.9) { const a = rand(0, TAU), r = R + rand(4, 26); G.parts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: -Math.cos(a) * r * 2.4 - Math.sin(a) * 40, vy: -Math.sin(a) * r * 2.4 + Math.cos(a) * 40, t: 0.32, c: pick(['#d9a8ff', '#b45cff', '#ffffff']), g: 0, glow: true }); }
  }
  function drawTeleGlow(t) {
    if (t.shape === 'spawn') return;
    if (t.shape === 'line' && !t.fading) { t.fading = true; withLineFade(t, () => drawTeleGlow(t)); t.fading = false; return; }
    if (t.mark) return drawMarkGlow(t, clamp(t.t / t.dur, 0, 1));
    if (t.weak) return drawWeakGlow(t, clamp(t.t / t.dur, 0, 1));
    if (isBossTele(t)) return drawBossTeleGlow(t, clamp(t.t / t.dur, 0, 1));
    const p = clamp(t.t / t.dur, 0, 1), near = p > 0.72;
    const flick = near ? (Math.floor(time * 24) % 2 ? 1 : 0.35) : 0.75 + Math.sin(time * 10) * 0.25;
    const col = t.mark ? '200,90,255' : '255,40,30';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${col},${(0.05 + 0.18 * p * p) * flick})`; telePath(t); ctx.fill();
    ctx.strokeStyle = `rgba(${col},${(0.55 + 0.45 * p) * flick})`; ctx.lineWidth = near || t.heavy ? 2 : 1; telePath(t); ctx.stroke();
    if (near) { ctx.strokeStyle = `rgba(255,230,220,${0.55 * flick})`; ctx.lineWidth = 1; telePath(t); ctx.stroke(); }
    // 진행 경계선
    ctx.strokeStyle = `rgba(255,${t.mark ? '210,255' : '200,170'},${0.85})`; ctx.lineWidth = t.heavy ? 2 : 1; teleFront(t, p); ctx.stroke();
    // 돌진 경로 화살표
    if (t.shape === 'line') {
      const ux = Math.cos(t.ang), uy = Math.sin(t.ang), step = 26, off = (time * 140) % step;
      ctx.strokeStyle = `rgba(255,120,100,${0.5 + 0.4 * p})`; ctx.lineWidth = 2;
      for (let d = off; d < t.len - 6; d += step) {
        const cx = t.x + ux * d, cy = t.y + uy * d, s = t.w * 0.28;
        ctx.beginPath(); ctx.moveTo(cx - ux * s - uy * s, cy - uy * s + ux * s); ctx.lineTo(cx, cy); ctx.lineTo(cx - ux * s + uy * s, cy - uy * s - ux * s); ctx.stroke();
      }
    }
    // 표식: 회전하는 문양과 카운트다운
    if (t.mark) {
      for (let i = 0; i < 16; i++) { const a = time * 2.2 + i / 16 * TAU; ctx.fillStyle = `rgba(230,170,255,${0.7 * flick})`; ctx.fillRect(Math.round(t.x + Math.cos(a) * (t.r + 5)) - 1, Math.round(t.y + Math.sin(a) * (t.r + 5)) - 1, 2, 2); }
      for (let i = 0; i < 6; i++) { const a = -time * 3 + i / 6 * TAU; ctx.strokeStyle = `rgba(230,170,255,${0.5 * flick})`; ctx.beginPath(); ctx.moveTo(t.x + Math.cos(a) * t.r * 0.3, t.y + Math.sin(a) * t.r * 0.3); ctx.lineTo(t.x + Math.cos(a + 1.2) * t.r * 0.85, t.y + Math.sin(a + 1.2) * t.r * 0.85); ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over';
      drawNumber(String(Math.ceil(t.dur - t.t)), t.x, t.y - 6, near ? '#ffffff' : '#e6b8ff', 3);
    }
    ctx.restore();
    // 가장자리에서 피어오르는 불씨
    if (Math.random() < (t.heavy ? 0.9 : 0.35)) { const e = teleEdgePoint(t); G.parts.push({ x: e.x, y: e.y, vx: rand(-6, 6), vy: -rand(20, 45), t: 0.45, c: t.mark ? '#d9a8ff' : pick(['#ff4030', '#ff9070']), g: 0, glow: true }); }
  }
  function drawBossAura(b) {
    if (b.dead) return;
    const bl = BLADES.boss, hx = b.x + b.face * 4, hy = b.y - 30;
    if (b.glow > 0) {
      drawBlade(bl, hx, hy, b.bladeAng, 0.35 + 0.5 * b.glow, false, 1, 'lighter');
      const tx = hx + Math.cos(b.bladeAng) * bl.reach, ty = hy + Math.sin(b.bladeAng) * bl.reach;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = dRadial(ctx, tx, ty, 0, tx, ty, 10 + 14 * b.glow);
      gr.addColorStop(0, `rgba(240,200,255,${0.8 * b.glow})`); gr.addColorStop(1, 'rgba(180,90,255,0)');
      ctx.fillStyle = gr.p(ctx); ctx.fillRect(tx - 30, ty - 30, 60, 60);
      ctx.restore();
    }
    // 붉은 눈빛
    const ex = b.x + b.face * 2, ey = b.y - 42; // v2.93 옛 투구 틈 눈빛 막대는 없앰 (새 도트에 눈이 있음) — 3단계 붉은 입자만 남김
    if (b.stage === 3 && Math.random() < 0.9) G.parts.push({ x: b.x + rand(-14, 14), y: b.y - rand(4, 46), vx: rand(-8, 8), vy: -rand(30, 60), t: 0.45, c: pick(['#ff3050', '#b45cff', '#ff8060']), g: 0, glow: true });
    if (b.stage === 3 && Math.random() < 0.5) G.parts.push({ x: ex, y: ey, vx: -b.face * 40, vy: -10, t: 0.35, c: '#ff3050', g: 0, glow: true });
  }
  function drawShadow(x, y, w) { const c = AURA_MAIN || ctx; dshEll(c, x, y, w, w * 0.32, 0.5); } // v3.20 디더
  // 칼날 잔상: 휘두른 궤적을 초승달 모양으로 채운다
  // v2.19 휘두름 궤적 색 = 무기 도트에서 가장 많이 쓴 밝은 색 (흰빛을 섞어 궤적답게)
  function weaponTrailCol(tex, white = 0.45) {
    if (!tex) return '240,236,226'; const ck = '_trail' + white; if (tex[ck]) return tex[ck];
    const cnt = new Map(), add = (r, g, b, n = 1) => { const L = 0.299 * r + 0.587 * g + 0.114 * b, mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (L < 60) return; const w = n * (1 + (mx - mn) / 255 * 4); /* 채도 높은 색(무기 고유색)을 더 쳐준다 */ const k = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4); const o = cnt.get(k) || { r: 0, g: 0, b: 0, w: 0 }; o.r += r * w; o.g += g * w; o.b += b * w; o.w += w; cnt.set(k, o); };
    if (tex.cells) { for (const row of tex.cells) for (const ch of row) { if (ch === '.') continue; const h = tex.pal[ch]; if (!h || h[0] !== '#') continue; add(parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)); } }
    else if (tex.c) { const d = tex.c.getContext('2d').getImageData(0, 0, tex.c.width, tex.c.height).data; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) add(d[i], d[i + 1], d[i + 2]); }
    let best = null; for (const o of cnt.values()) if (!best || o.w > best.w) best = o;
    if (!best) return (tex[ck] = '240,236,226');
    const m = c => Math.round(c / best.w * (1 - white) + 255 * white);
    return (tex[ck] = `${m(best.r)},${m(best.g)},${m(best.b)}`);
  }
  // v2.50 플레이어 근접 궤적 (도트): 한 가지 색의 초승달 — 칼끝 반경에서 안쪽으로 2px 칸을 채우고, 두께는 가운데가 가장 두껍고 양 끝은 반드시 뾰족하게.
  //   오래된 칸은 투명해지지 않고 두께가 단계적으로 줄다가 사라진다
  // v3.19 RGB? 무기: 휘두른 궤적을 무지개 띠로 (바깥 빨강 → 안쪽 보라, 결 따라 천천히 흐름). window.RBY_TRAIL = false면 예전 색
  const rbySlash = (cls, col) => window.RBY_TRAIL !== false && typeof eqWeapon === 'function' && (eqWeapon(cls) || {}).grade === 'rby' ? 'rainbow' : col;
  const SLASH_COL = { knight: '#ece6e2', ranger: '#ffc8a8', priest: '#ffd34d', holy: '#ffd34d', ice: '#9fd2ff', storm: '#7affb0', shadow: '#c08cff' };
  function drawSlashPx(trail, px, py, rout, col, heavy) {
    const n = trail.length; if (n < 2) return;
    const A = [trail[0].a]; for (let i = 1; i < n; i++) A.push(A[i - 1] + angDiff(trail[i].a, trail[i - 1].a));
    const tot = Math.abs(A[n - 1] - A[0]) || 1e-6, thMax = rout * 0.4 * (heavy ? 1.15 : 1), seen = new Set();
    const rb = col === 'rainbow', sh = rb ? Math.floor(time * 6) : 0;
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; if (!rb) ctx.fillStyle = col;
    for (let i = 1; i < n; i++) {
      const life = Math.ceil(clamp(trail[i].t / 0.11, 0, 1) * 4) / 4, a0 = A[i - 1], a1 = A[i], m = Math.max(1, Math.ceil(Math.abs(a1 - a0) * rout / 1.6));
      for (let j = 0; j <= m; j++) { const a = a0 + (a1 - a0) * j / m, u = Math.abs(a - A[0]) / tot, th = thMax * Math.pow(Math.sin(Math.PI * clamp(u, 0, 1)), 0.9) * (0.35 + 0.65 * life), ca = Math.cos(a), sa = Math.sin(a);
        for (let d = 0; d <= th; d += 1.5) { const x = snap2(px + ca * (rout - d)), y = snap2(py + sa * (rout - d)), key = x * 8192 + y; if (seen.has(key)) continue; seen.add(key); if (rb) ctx.fillStyle = RBY_RAIN[(Math.min(5, Math.floor(d / Math.max(1.5, th) * 6)) + sh) % 6]; ctx.fillRect(x, y, 2, 2); } }
    }
    ctx.restore();
  }
  // v2.50 몬스터 궤적: 준엘리트·엘리트·보스만 도트 초승달(테두리 색 한 가지, 양 끝 뾰족), 일반 몬스터는 예전 궤적
  const hiTier = e => !!e && (e.type === 'boss' || isElite(e) || isSemi(e) || !!nmAuraOf(e));
  const slashCol = e => e.kind === 'ashking' ? '#ff9650' : (nmAuraOf(e) || [e.type === 'boss' ? '#c070ff' : '#ece6e2'])[0];
  function enemyTrail(e, trail, px, py, rin, rout, col, heavy) { if (hiTier(e)) drawSlashPx(trail, px, py, rout, slashCol(e), heavy); else drawTrail(trail, px, py, rin, rout, col, heavy); }
  function drawTrail(trail, px, py, rin, rout, col, heavy) {
    if (trail.length < 2) return;
    ctx.save();
    for (let i = 1; i < trail.length; i++) {
      const a0 = trail[i - 1].a, a1 = trail[i].a, life = trail[i].t / 0.11;
      const k = i / trail.length;
      ctx.fillStyle = `rgba(${col},${0.55 * life * (0.35 + 0.65 * k)})`;
      ctx.beginPath();
      ctx.moveTo(px + Math.cos(a0) * rin, py + Math.sin(a0) * rin);
      ctx.lineTo(px + Math.cos(a0) * rout, py + Math.sin(a0) * rout);
      ctx.lineTo(px + Math.cos(a1) * rout, py + Math.sin(a1) * rout);
      ctx.lineTo(px + Math.cos(a1) * rin, py + Math.sin(a1) * rin);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * life * k})`; ctx.lineWidth = heavy ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(px + Math.cos(a0) * rout, py + Math.sin(a0) * rout); ctx.lineTo(px + Math.cos(a1) * rout, py + Math.sin(a1) * rout); ctx.stroke();
    }
    ctx.restore();
  }

  function holdGlow(x, y, k, c) {
    k = Math.round(clamp(k, 0, 1) * 6) / 6; x = snap2(x); y = snap2(y); // v2.50 6단계로 끊어 디더 무늬 재사용 (모으는 동안 매 프레임 새로 만들던 문제)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const r = 6 + 10 * k, gr = dRadial(ctx, x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${c},${0.25 + 0.45 * k})`); gr.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = gr.p(ctx); ctx.fillRect(x - r, y - r, r * 2, r * 2);
    if (k > 0.75 && Math.floor(time * 24) % 2) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); }
    ctx.restore();
  }
  // 팔도 2px 칸 도트로 만들어 rotW로 돌린다 (v0.57): 위팔 → 팔꿈치 → 아래팔 → 손
  const limbCache = {};
  function cellLimb(kind, pal, len, w, back) {
    const key = kind + pal + len + w + (back ? 'b' : ''); if (limbCache[key]) return limbCache[key];
    const P = PAL[pal], L = Math.round(len / 2), th = Math.max(2, Math.round(w / 2)), zb = kind === 'zombie';
    const C = { k: P.k, h: P.hl ? (back ? P.S : P.hl) : zb ? (back ? '#5e665a' : '#a8b09c') : (back ? '#5a4036' : '#d0a892'), l: back ? P.S : P.s, d: back ? P.S : P.S, D: P.k, c: P.c, C: P.C, a: P.a, A: P.A || P.a, b: P.b };
    const bend = zb ? 28 * DEG : 12 * DEG, L1 = Math.round(L * 0.5), ux = Math.cos(bend), uy = Math.sin(bend), E = { x: L1, y: 0 }, Hh = { x: L1 + ux * (L - L1), y: uy * (L - L1) };
    const cells = new Map(), segD = (x, y, ax, ay, bx, by) => { const vx = bx - ax, vy = by - ay, l0 = vx * vx + vy * vy || 1, t = clamp(((x - ax) * vx + (y - ay) * vy) / l0, 0, 1); return [Math.hypot(x - ax - vx * t, y - ay - vy * t), t, (-(x - ax) * vy + (y - ay) * vx) / Math.sqrt(l0)]; };
    for (let y = -L; y <= L; y++) for (let x = -2; x <= L + 5; x++) {
      const [d1, t1, s1] = segD(x, y, 0, 0, E.x, E.y), [d2, t2, s2] = segD(x, y, E.x, E.y, Hh.x, Hh.y);
      const r1 = th / 2 + 0.3, r2 = (zb ? th - 1 : th) / 2 + 0.2;
      let c = null;
      if (d1 <= r1) c = s1 < -r1 * 0.4 ? 'h' : 'l';
      if (d2 <= r2) c = s2 < -r2 * 0.4 ? 'h' : (zb ? 'd' : 'l');
      if (c && !back && zb && Math.abs(t1 - 0.5) < 0.08 && d1 <= r1) c = 'c'; // 꿰맨 자국
      if (c && !zb && d2 <= r2 && t2 > 0.55 && t2 < 0.8 && Math.round(t2 * 10) % 2 === 0) c = Math.round(t2 * 10) % 4 ? 'c' : 'C'; // 손목 감은 천
      if (Math.hypot(x - Hh.x, y - Hh.y) <= th * 0.75) c = (y - Hh.y) < 0 ? 'l' : 'd';
      if (zb && x > Hh.x && x <= Hh.x + 3 && Math.abs(y - Hh.y - (x - Hh.x) * uy) <= 1.2 && (Math.round(y) - Math.round(Hh.y)) % 2 === 0) c = x >= Hh.x + 3 ? 'b' : 'l'; // 긴 손가락 + 손톱
      if (c) cells.set(x + ',' + y, c);
    }
    if (zb) { cells.set(Math.round(E.x) + ',' + (Math.round(E.y) + Math.ceil(th / 2)), 'b'); const wx = Math.round((E.x + Hh.x) / 2), wy = Math.round((E.y + Hh.y) / 2); cells.set(wx + ',' + wy, 'a'); }
    let mx = 1e9, my = 1e9, Mx = -1e9, My = -1e9; for (const k of cells.keys()) { const [x, y] = k.split(',').map(Number); mx = Math.min(mx, x); my = Math.min(my, y); Mx = Math.max(Mx, x); My = Math.max(My, y); }
    return (limbCache[key] = cellWeapon(Mx - mx + 3, My - my + 3, 1 - mx, 1 - my, C, put => { for (const [k, c] of cells) { const [x, y] = k.split(',').map(Number); put(x + 1 - mx, y + 1 - my, c); } }));
  }
  // ---------- 버프 상태 표시 (v0.92): 타원 선 하나 대신 2px 도트 이펙트
  //  보호막(발도르 망령 방벽 · 주술사 피의 방벽 · 의식 방벽) = 격자 무늬 돔 + 위로 훑는 빛 + 도는 룬 + 맞으면 번쩍, 줄면 금이 감
  //  강화(북·함성·격분) = 발밑 도는 고리 + 솟는 불꽃 혀 + 머리 위 겹화살표
  //  망령 기사 → 발도르로 이어지는 영혼 사슬
  function enemyH(e) { return e.tall || (e.type === 'boss' ? (e.kind === 'slimeking' ? 50 : 64) : e.type === 'ghost' ? 38 : 24 + (e.r || 8) * 1.2); }
  function enemyW(e) { if (e.orc && e.orc !== 'wolf' && e.orc !== 'slave') return orcSprite(e.orc, e.ov).w * 0.5; return Math.max(14, enemyH(e) * 0.42); }
  function buffState(e) {
    if (e.dead) return null;
    const bar = e.type === 'boss' && e.shield ? { c: '150,200,255', h2: '230,245,255', k: 1 } : e.ward > 0 ? { c: '255,60,50', h2: '255,190,170', k: clamp(e.ward / (e.wardMax || e.ward), 0, 1) } : e.armorMul && e.armorMul < 1 && e !== G.boss ? { c: '255,90,40', h2: '255,210,150', k: 1 } : null;
    const emp = e.buffT > 0 || e.drumT > 0 ? '255,60,40' : e.rallyT > 0 ? '255,205,90' : e.frenzyT > 0 ? '255,130,40' : e.haste > 0 ? '255,190,60' : null;
    return bar || emp ? { bar, emp } : null;
  }
  // v0.94: 버프는 발밑 바닥 원으로만 (사용자 결정) — 몸을 덮는 돔·불꽃·화살표 없음
  //  보호막 = 두 겹 고리(바깥 실선 + 안쪽 반대로 도는 점선) + 둘레를 도는 룬 4개 + 디더 바닥 빛, 맞으면 번쩍. 주술사 방벽은 남은 양만큼만 바깥 고리가 이어짐
  //  강화 = 한 겹 끊긴 고리가 빠르게 돌고 안쪽에 맥동하는 디더 빛 + 고리에서 튀는 불티 몇 점
  // v2.50 성능: 강화·보호막 바닥 고리를 적마다 따로 업로드하지 않고, 반 해상도(2px 칸) 레이어 한 장에 모아 프레임당 한 번만 올린다
  //   (북 의식으로 오크 여럿이 동시에 강화되면 적 수만큼 putImageData가 일어나 프레임이 크게 떨어졌음)
  const BUFL = { cap: 0, buf: null, cv: null, g: null, img: null };
  function buffLayer(x0, y0, x1, y1) {
    x0 = Math.floor(x0 / 2) * 2; y0 = Math.floor(y0 / 2) * 2; const w = Math.max(1, Math.ceil((x1 - x0) / 2)), h = Math.max(1, Math.ceil((y1 - y0) / 2)), n = w * h * 4;
    if (BUFL.cap < n) { BUFL.buf = new Float32Array(n); BUFL.cap = n; } else BUFL.buf.fill(0, 0, n);
    const B = BUFL.buf;
    return { rect(x, y, rw, rh, r, g, b, a) { if (a <= 0) return;
        const xa = Math.max(0, (x - x0) >> 1), ya = Math.max(0, (y - y0) >> 1), xb = Math.min(w, (x - x0 + rw + 1) >> 1), yb = Math.min(h, (y - y0 + rh + 1) >> 1);
        const pr = r * a, pg = g * a, pb = b * a;
        for (let yy = ya; yy < yb; yy++) for (let xx = xa, i = (yy * w + xa) * 4; xx < xb; xx++, i += 4) { B[i] += pr; B[i + 1] += pg; B[i + 2] += pb; B[i + 3] += a; } },
      flush() {
        if (!BUFL.img || BUFL.img.width !== w || BUFL.img.height !== h) BUFL.img = new ImageData(w, h);
        const d = BUFL.img.data; for (let i = 0; i < n; i += 4) { const A = B[i + 3]; if (A <= 0) { d[i + 3] = 0; continue; } const k = 1 / A; d[i] = B[i] * k; d[i + 1] = B[i + 1] * k; d[i + 2] = B[i + 2] * k; d[i + 3] = (A > 1 ? 1 : A) * 255; }
        if (!BUFL.cv || BUFL.cv.width < w || BUFL.cv.height < h) [BUFL.cv, BUFL.g] = mkCanvas(Math.max(w, BUFL.cv ? BUFL.cv.width : 0), Math.max(h, BUFL.cv ? BUFL.cv.height : 0));
        BUFL.g.putImageData(BUFL.img, 0, 0);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = false; ctx.drawImage(BUFL.cv, 0, 0, w, h, x0, y0, w * 2, h * 2); ctx.restore(); } };
  }
  let BUFF_BATCH = false;
  function drawBuffBatch() { // 캐릭터를 그리기 전에 바닥 고리를 한꺼번에
    BUFF_BATCH = false; if (!OPT) return;
    const L = []; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const e of G.enemies) { if (e.dead) continue; const B = buffState(e); if (!B) continue; const LR = enemyW(e) * 1.25 + 16; L.push([e, B]);
      x0 = Math.min(x0, e.x - LR - 4); x1 = Math.max(x1, e.x + LR + 4); y0 = Math.min(y0, e.y - LR * 0.5 - 6); y1 = Math.max(y1, e.y + LR * 0.5 + 8); }
    BUFF_BATCH = true; if (!L.length) return;
    const Ly = buffLayer(x0, y0, x1, y1); for (const [e, B] of L) drawBuffBack(e, Ly, B); Ly.flush();
  }
  function drawBuffBack(e, LyIn, Bin) {
    if (BUFF_BATCH && !LyIn) return; // 이번 프레임은 이미 한꺼번에 그림
    const B = Bin || buffState(e); if (!B) return;
    const w = enemyW(e), cx = e.x, cy = e.y + 1;
    if (!LyIn) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; }
    const LR = w * 1.25 + 16, Ly = LyIn || pxLayer(cx - LR - 4, cy - LR * 0.5 - 6, LR * 2 + 8, LR + 12, true); // v1.17 한 장으로
    const dot = (x, y, c, a) => { const v = rgbN(c); Ly.rect(Math.round(x) & ~1, Math.round(y) & ~1, 2, 2, v[0], v[1], v[2], a); };
    const ring = (rx, c, a, rot, gapEvery, len) => { const ry = rx * 0.45, n = Math.max(24, Math.round(rx * 1.7)), m = Math.round(n * (len == null ? 1 : len)); for (let i = 0; i < m; i++) { if (gapEvery && i % gapEvery === 0) continue; const t = i / n * TAU + rot; dot(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, c, a); } };
    const fill = (rx, c, a) => { const ry = rx * 0.45, v = rgbN(c); for (let y = Math.round(cy - ry) & ~1; y <= cy + ry; y += 2) for (let x = Math.round(cx - rx) & ~1; x <= cx + rx; x += 2) { const q = Math.hypot((x - cx) / rx, (y - cy) / ry); if (q < 1 && dith(x >> 1, y >> 1, 0.45 * (1 - q))) Ly.rect(x, y, 2, 2, v[0], v[1], v[2], a); } };
    if (B.bar) {
      const R = w * 1.25 + 10, k = B.bar.k, hit = e.barHit ? Math.max(0, 1 - (time - e.barHit) / 0.3) : 0, pul = 0.5 + 0.5 * Math.sin(time * 3);
      fill(R * 0.95, B.bar.c, (0.22 + 0.12 * pul + hit * 0.3) * (0.5 + 0.5 * k));
      ring(R, B.bar.c, 0.8 + hit * 0.2, -Math.PI / 2, 0, 0.15 + 0.85 * k); // 남은 양만큼 이어지는 바깥 고리
      ring(R + 2, B.bar.h2, (0.25 + hit * 0.6) * (0.4 + 0.6 * k), -Math.PI / 2, 4, 0.15 + 0.85 * k);
      ring(R * 0.72, B.bar.c, 0.55 + hit * 0.3, -time * 1.6, 3);
      for (let i = 0; i < 4; i++) { const t = i / 4 * TAU + time * 0.9, gx = (Math.round(cx + Math.cos(t) * R * 0.86) & ~1) - 3, gy = (Math.round(cy + Math.sin(t) * R * 0.86 * 0.45) & ~1) - 3, g = RUNES[(i * 3 + 1) % RUNES.length];
        const hv = rgbN(B.bar.h2), ha = (0.75 + hit * 0.25) * (0.5 + 0.5 * k); for (let m = 0; m < 9; m++) if (g[m] === '1') Ly.rect(gx + (m % 3) * 2, gy + ((m / 3) | 0) * 2, 2, 2, hv[0], hv[1], hv[2], ha); }
    }
    if (B.emp) {
      const R = w * (B.bar ? 0.75 : 1.0) + 6, pul = 0.5 + 0.5 * Math.sin(time * 7);
      fill(R * 0.9, B.emp, 0.18 + 0.2 * pul);
      ring(R, B.emp, 0.85, time * 3.2, 4);
      ring(R * 0.6, '255,230,170', 0.35 + 0.3 * pul, -time * 2.4, 3);
      if (Math.random() < 0.35) { const t = rand(0, TAU); G.parts.push({ x: cx + Math.cos(t) * R, y: cy + Math.sin(t) * R * 0.45, vx: 0, vy: -rand(20, 40), t: 0.35, c: `rgb(${B.emp})`, g: 0, glow: true }); }
    }
    if (!LyIn) { Ly.flush(); ctx.restore(); }
  }
  function drawBuffFront(e) { if (e.type === 'ghost' && !e.dead && G.boss && !G.boss.dead && G.boss.shield) drawSoulChain(e, G.boss); }
  // 망령 기사 → 발도르: 출렁이는 영혼 사슬, 빛 덩이가 발도르 쪽으로 흘러감
  function drawSoulChain(g2, b) {
    const x0 = g2.x, y0 = g2.y - 20, x1 = b.x, y1 = b.y - 34, L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(8, Math.round(L / 6)), nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i <= n; i++) { const t = i / n, wob = Math.sin(t * Math.PI) * Math.sin(time * 5 + t * 9) * 6, x = Math.round(x0 + (x1 - x0) * t + nx * wob) & ~1, y = Math.round(y0 + (y1 - y0) * t + ny * wob) & ~1;
      ctx.fillStyle = `rgba(130,180,250,${i % 2 ? 0.5 : 0.8})`; ctx.fillRect(x, y, 2, 2); ctx.fillRect(x, y + 2, 2, 2); if (i % 3 === 0) { ctx.fillStyle = 'rgba(90,130,210,0.5)'; ctx.fillRect(x + 2, y, 2, 2); ctx.fillRect(x - 2, y + 2, 2, 2); } }
    for (let j = 0; j < 3; j++) { const t = (time * 0.8 + j / 3) % 1, wob = Math.sin(t * Math.PI) * Math.sin(time * 5 + t * 9) * 6, x = Math.round(x0 + (x1 - x0) * t + nx * wob) & ~1, y = Math.round(y0 + (y1 - y0) * t + ny * wob) & ~1;
      ctx.fillStyle = 'rgba(220,240,255,0.95)'; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = 'rgba(150,200,255,0.5)'; ctx.fillRect(x - 4, y, 2, 2); ctx.fillRect(x + 2, y, 2, 2); ctx.fillRect(x, y - 4, 2, 2); ctx.fillRect(x, y + 2, 2, 2); }
    ctx.restore();
  }
;

// ==================================================================== 14_rig.js
'use strict';
// 잿빛 왕관 토벌대 — 14_rig.js : 일반 몹 부위 리그(머리·몸·팔다리 분리 애니메이션)
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ v1.54 일반 몹 부위 리그 — 엘리트·보스처럼 머리·몸통·팔·다리를 2px 칸 단위로 따로 움직인다
  // h=머리 끝 줄, l=다리 시작 줄, m=다리를 가르는 열, b=뒷팔 끝 열, f=앞팔 시작 열, robe=옷자락(다리 대신 흔들림)
  const NRB = {
    goblin: { h: 6, l: 11, m: 7, b: 3, f: 10 }, goblinUp: { h: 7, l: 11, m: 8, mask: ["................", "................", "................", ".B............F.", "BBB..........FFF", "BBB..........FFF", ".BBB........FFF.", "..BB........FF..", "................", "................", "................", "................", "................", "................"] },
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
    if (b && b.mask) return (i, j) => { const c = b.mask[j][i]; return c === 'B' ? 'armB' : c === 'F' ? 'armF' : j < b.h ? 'head' : j >= b.l ? (i < b.m ? 'legB' : 'legF') : 'torso'; }; // v3.25 팔 칸을 따로 지정 (머리 높이까지 든 팔도 몸에 붙어 움직임)
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
  // v3.64 맞으면 뒤로 크게 휘었다가 용수철처럼 되돌아오며 흔들림 — 기둥 밑동(26줄)을 축으로 위로 갈수록 많이 휨 (칸 단위로 다시 뽑아 도트 유지)
  function dummyBend(b) { const k = 'dummyB' + b; if (!MAPS[k]) { const PAD = 9; MAPS[k] = MAPS.dummy.map((r, y) => { const d = y < 26 ? Math.round(b * Math.pow((26 - y) / 26, 1.5)) : 0, s = '.'.repeat(PAD) + r + '.'.repeat(PAD); return d > 0 ? '.'.repeat(d) + s.slice(0, s.length - d) : d < 0 ? s.slice(-d) + '.'.repeat(-d) : s; }); if (typeof PLAYER_MAPS !== 'undefined' && PLAYER_MAPS.add && false) PLAYER_MAPS.add(k); } return k; }
  function drawDummy(e, white) {
    drawShadow(e.x, e.y + 1, 10);
    const dt = Math.min(0.05, Math.max(0, time - (e._bt == null ? time : e._bt))); e._bt = time;
    e.bendV = (e.bendV || 0) + (-170 * (e.bend || 0) - 7 * (e.bendV || 0)) * dt; e.bend = clamp((e.bend || 0) + e.bendV * dt, -8, 8);
    const b = Math.round(e.bend || 0), sq = e.dSq > 0 ? (e.dSq -= dt, 2) : 0;
    drawSprite(b ? dummyBend(b) : 'dummy', 'dummy', 2, e.x, e.y + 2 + sq, false, { white });
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
    else if (e.type === 'boss' && e.kind === 'ashking') withAura(e, '#ff8a3a', () => drawAshKing(e, ya, al));
    else if (e.type === 'boss' && e.kind === 'slimeking') withAura(e, '#7ae0ff', () => { drawSlimeKing(e, ya, al); TRUTH.belly(e); }); // v2.46 보스 오오라
    else if (INV_DRAW[e.type]) invDraw(e, ya, al, white); // v2.43 난입자 (공격 모션 포함)
    else if (e.type === 'grider') GSEMI.withLine(e, al, () => GSEMI.drawRider(e, ya, al)); // v3.30 준엘리트 외곽선
    else if (e.type === 'goblin' && GSEMI.isFallenAtk(e)) GSEMI.drawFallenAtk(e, ya, al);
    else if (e.type === 'gcatapult') GCAT.draw(e, ya, al); // v3.31
    else if (e.type === 'goblin' && e.crewOf && GCAT.crewDraw(e, ya, al)) { /* 투석기 사수 자세 */ }
    else if (e.type === 'gballista') GBAL.draw(e, ya, al); // v3.32
    else if (e.type === 'ghellaltar') GHELL.draw(e, ya, al); // v3.34 지옥불 의식대
    else if (e.type === 'ghoul' && e.crewOf && e.crewOf.type === 'gballista' && GBAL.crewDraw(e, ya, al)) { /* 발리스타 병사 자세 */ }
    else if (e.type === 'gbomber') GSEMI.withLine(e, al, () => GSEMI.drawBomber(e, ya, al));
    else if (e.type === 'goblin' || e.type === 'garcher') {
      drawShadow(e.x, e.y + 1, 8);
      const pal = e.gv ? e.type + '_v' + e.gv : e.type, M = nrMotion(e); // v1.54 · v3.25 피부 4색 부위별 칸 단위
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
    else if (e.type === 'ghost' || (e.type === 'boss' && e.kind !== 'slimeking')) {
      const sc = 2;
      const map = e.type === 'boss' ? 'baldor' : e.type === 'ghost' ? 'soldier' : 'ghoul';
      const pal = e.type === 'boss' ? 'boss' : e.type === 'ghost' ? 'ghost' : 'ghoul';
      const handY = e.type === 'boss' ? 30 : 14;
      const hx0 = e.x + e.face * (e.type === 'boss' ? NM_HAND + (e.sw ? 0 : 4) : 3), hy = e.type === 'boss' ? e.y - (e.sw ? 8 : 14) + bdPose(e).dy : e.y - handY; /* v2.50 들고 다닐 때는 가슴 높이에서 쥠 */ const hx = hx0 + (e.type === 'boss' ? bdPose(e).ux : 0);
      const bl = e.type === 'boss' ? BOSS_SWORD : BLADES[e.blade]; // v2.46 발도르: 특대형 대검
      const behind = e.type === 'boss' ? !e.sw && Math.cos(e.bladeAng) * e.face < -0.25 /* v2.50 발도르: 세워 든 칼은 손에 쥔 채 몸 앞, 뒤로 넘긴 때만 등 뒤 */ : !e.sw && Math.sin(e.bladeAng) < -0.2 === false && Math.cos(e.bladeAng) * e.face < 0;
      drawShadow(e.x, e.y + 2, e.type === 'boss' ? 24 : 10);
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
    // 준엘리트·엘리트 이름표 (v0.69: 챕터 1~3 모두) — 엘리트는 주황, 준엘리트는 금색
    const nm = e.type !== 'boss' && !e.dead && (e.semiName || (isElite(e) ? eliteName(e) : null));
    if (nm) {
      const top = e.tall ? e.tall + 8 : (ELITE_TOP[e.type] || 60);
      ctx.font = '8px Galmuri7'; ctx.textAlign = 'center';
      const ty = Math.round(e.y - top - 5 - (e.z || 0) - (e.lift || 0)), el = isElite(e);
      ctx.fillStyle = '#000'; fillTextW(nm, Math.round(e.x) + 1, ty + 1); ctx.fillStyle = el ? '#ffa070' : '#f2d78c'; fillTextW(nm, Math.round(e.x), ty);
    }
    if (e.type !== 'boss' && e.hp < e.maxHp && !e.dead) {
      const w = isElite(e) ? 30 : isSemi(e) ? 22 : 16, top = e.tall ? e.tall + 8 : isElite(e) ? (ELITE_TOP[e.type] || 60) : 40;
      ctx.fillStyle = '#000'; ctx.fillRect(Math.round(e.x - w / 2) - 1, Math.round(e.y - top) - 1, w + 2, 4);
      ctx.fillStyle = '#b3262b'; ctx.fillRect(Math.round(e.x - w / 2), Math.round(e.y - top), Math.round(w * e.hp / e.maxHp), 2);
      if (e.grogiMax) { ctx.fillStyle = '#e8c35a'; ctx.fillRect(Math.round(e.x - w / 2), Math.round(e.y - top) + 2, Math.round(w * (e.grogiT > 0 ? 1 : e.grogi / e.grogiMax)), 1); }
    }
  }
  // v3.20 암살자 대시: 앞쪽 몸은 그대로 두고 몸 뒷부분만 이동 반대쪽으로 늘임 — 뒤쪽 가장자리 칸의 색을 칸 단위로 끌어 늘이고(가운데 길게 · 위아래 짧게 → 뾰족한 꼬리), 바깥에 검은 테두리. 가로·세로·대각선(8방향)
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
    let rot = 0, alpha = blink ? 0.45 : 1, sx = 1, sy = 1; if (P.blinkRec > time && G.cls === 'mage') alpha = Math.min(alpha, 1 - 0.55 * (P.blinkRec - time) / 0.29); // v3.62 점멸 뒤 나타나는 동안 몸이 또렷해짐
    const dashS = P.state === 'dodge' && P.t >= 0.03 && P.t < BLINK;
    if (P.state === 'dodge') { const [a, b] = DASH_POSE(P.t), hz = Math.abs(P.dvx) >= Math.abs(P.dvy); [sx, sy] = hz ? [a, b] : [b, a]; } // v3.20 암살자 대시: 웅크림 → 몸 뒷부분만 늘어남 → 되튐 → 자리잡기 (눌림 방향은 가로·세로 중 큰 쪽)
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
    SWAP_DRAW = SWAPFX.on(); // v3.25 무기 바꾸기 모션
    try { drawPlayerInner(); if (SWAP_DRAW) { SWAP_DRAW = false; SWAPFX.post(); } } finally { SWAP_DRAW = false; PPOSE = null; ASH_DRAW = false; STEALTH_DRAW = false; ROLL_HIDEW = false; P.rollGY = null; P.x = ox; P.y = oy; P.blade = ob; P.blade2 = ob2; }
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
    let rot = 0, alpha = blink ? 0.45 : 1, sx = 1, sy = 1; if (P.blinkRec > time && G.cls === 'mage') alpha = Math.min(alpha, 1 - 0.55 * (P.blinkRec - time) / 0.29); // v3.62 점멸 뒤 나타나는 동안 몸이 또렷해짐
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
    drawSprite(rmk || (ifr ? ifr.key : heroMap(walkMap('hKnight', wFr), P)), (P.krs && P.krs.k === 'gate' && P.krs.did && !P.krs.did.end ? 'hKnightDark' : wSkill() === 'gate' ? 'hKnightGray' : 'hKnight') /* v3.44 철퇴를 들면 어두운 무채색 */, 2, /* v3.40 단죄 돌진 중 검은 실루엣 */ P.x + rox, P.y + 2 - lift + roy, P.face < 0, { rot, alpha, white: P.hurtT > 0.12, sx, sy });
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
;

// ==================================================================== 15_lighting_title.js
'use strict';
// 잿빛 왕관 원정대 — 15_lighting_title.js : 조명(GL·캔버스), 타이틀 화면 도트 그림
  // v3.19 해가 뜨지 않는 세계: 시작 장소는 밤 — 조금 더 어둡고 푸른 어둠, 등불 · 촛불 · 창 달빛이 광원 (window.NIGHT = false면 예전)
  const HOME_NIGHT = { dark: 0.5, dk: [6, 8, 24] };
  const homeNight = () => window.NIGHT !== false && !!(G && G.dun && G.dun.home);
  const darkA = () => homeNight() ? ((typeof RUIN !== 'undefined' && RUIN.ambA && RUIN.ambA()) || HOME_NIGHT.dark) : (typeof RUIN !== 'undefined' && RUIN.darkA && RUIN.darkA()) || STG().dark; // v3.20 갱도는 더 어둡게
  const MOON = window.__MOON = { x: 0.1, y: -0.45, r: 1.1, a: 0.45, c: '150,170,235', ca: 0.14, shafts: false, per: 150, bw: 34, sc: [70, 86, 130], sa: 0.22 };
  let MOON_CV = null;
  function moonShafts() { // 방마다 한 번 그려 둔 달빛 띠(세계 좌표, 2px 칸 디더)를 더해 그림
    const key = (G.dun && G.dun.cur) || 0;
    if (!MOON_CV || MOON_CV.key !== key) { const cw = W >> 1, ch = H >> 1, [c, g] = mkCanvas(cw, ch), im = g.createImageData(cw, ch), d = im.data, B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const sv = y - x * 0.55, ph = ((sv % MOON.per) + MOON.per) % MOON.per, w = MOON.bw, e = ph < w ? Math.sin(Math.PI * ph / w) : 0; if (!e) continue;
        const k = e * (1 - Math.min(1, y / ch) * 0.5); if (k * 0.9 < (B4[y & 3][x & 3] + 0.5) / 16) continue; const i = (y * cw + x) * 4; d[i] = MOON.sc[0]; d[i + 1] = MOON.sc[1]; d[i + 2] = MOON.sc[2]; d[i + 3] = 255; }
      g.putImageData(im, 0, 0); MOON_CV = { key, c }; }
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = MOON.sa; ctx.drawImage(MOON_CV.c, 0, 0, W, H); ctx.restore(); }
  const moonOn = () => window.MOON !== false && !!G && (G.stage === 1 || G.stage === 3) && !(G.dun && (G.dun.home || G.dun.forge)) && !(typeof DEN !== 'undefined' && DEN.on && DEN.on()) && !(typeof RUIN !== 'undefined' && RUIN.on());
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
  const dkCol = () => homeNight() ? ((typeof RUIN !== 'undefined' && RUIN.ambDk && RUIN.ambDk()) || HOME_NIGHT.dk) : (typeof RUIN !== 'undefined' && RUIN.dark && RUIN.dark()) || LGL_DK[G.stage] || [4, 3, 10]; // v3.20 갱도는 거의 검은 어둠
  function renderLightingGL(vis) {
    const S = LGL, gl = S.gl, n = Math.min(S.MAXL, vis.length);
    if (vis.length > S.MAXL) vis = vis.slice().sort((a, b) => b.r * b.a - a.r * a.a); // 넘치면 크고 센 빛부터
    let anyC = false;
    for (let i = 0; i < n; i++) { const l = vis[i], j = i * 4; S.Lb[j] = l.x; S.Lb[j + 1] = l.y; S.Lb[j + 2] = l.r; S.Lb[j + 3] = l.a;
      if (l.c) { anyC = true; const p = l.cRGB || (l.cRGB = l.c.split(',').map(v => +v / 255)); S.Cb[j] = p[0]; S.Cb[j + 1] = p[1]; S.Cb[j + 2] = p[2]; S.Cb[j + 3] = l.ca; } else S.Cb[j + 3] = 0; }
    const dk = dkCol();
    gl.uniform4fv(S.U.L, S.Lb); gl.uniform4fv(S.U.C, S.Cb); gl.uniform1i(S.U.n, n); gl.uniform2f(S.U.cam, CAMX, CAMY);
    gl.uniform3f(S.U.dk, dk[0] / 255, dk[1] / 255, dk[2] / 255); gl.uniform1f(S.U.A0, darkA()); gl.uniform1f(S.U.N, 5);
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
      if (e.type === 'boss') lights.push({ x: e.x, y: e.y - 30 - (e.z || 0), r: e.kind === 'slimeking' ? 90 : e.kind === 'krugash' || e.kind === 'ashking' ? 120 : 70, a: 0.45, c: e.kind === 'cultlead' ? '255,110,50' : e.kind === 'slimeking' ? (e.stage === 3 ? '230,90,170' : '140,230,90') : e.kind === 'krugash' ? (e.stage === 3 ? '255,50,30' : '255,130,60') : '170,80,230', ca: 0.14 });
      else if (e.type === 'mordred') lights.push({ x: e.x + e.face * 4, y: e.y - 48, r: 34 + (e.state === 'guard' ? 30 : 0), a: 0.45, c: e.state === 'guard' ? '255,210,100' : '255,130,50', ca: 0.08 + (e.state === 'guard' ? 0.12 : 0) });
      else if (e.type === 'queen') lights.push({ x: e.x, y: e.y - 44, r: e.pose === 'weep' ? 50 : 32, a: 0.45 * (e.fadeA == null ? 1 : e.fadeA), c: '255,130,60', ca: e.pose ? 0.14 : 0.06 });
      else if (e.ash === 'lancer') lights.push({ x: e.x, y: e.y - 10, r: e.state === 'wind' ? 44 : 26, a: 0.4, c: '255,130,50', ca: e.state === 'wind' ? 0.16 : 0.06 }); // v1.27 잿더미 잉걸 심장
      else if (e.type === 'ghost') lights.push({ x: e.x, y: e.y - 12, r: 40, a: 0.4, c: '150,200,255', ca: 0.12 });
      else if (e.type === 'crow') lights.push({ x: e.x, y: e.y - (e.z || 0) - 6, r: 24, a: 0.4, c: '150,100,200', ca: 0.06 });
      else if (e.type === 'mother') lights.push({ x: e.x, y: e.y - 24, r: 50 + 40 * Math.max(e.glow || 0, e.state === 'bilecharge' ? 1 - e.t / e.chargeMax : 0), a: 0.5, c: '150,230,80', ca: 0.08 + 0.15 * (e.glow || 0) });
      else if (e.type === 'gbrute' || e.type === 'boar') lights.push({ x: e.x, y: e.y - 24, r: 40 + 40 * (e.glow || 0), a: 0.45, c: e.type === 'boar' ? '255,70,40' : '255,190,60', ca: 0.05 + 0.15 * (e.glow || 0) + (e.enraged ? 0.06 : 0) });
      else if (e.type === 'cultist' && e.state === 'wind') lights.push({ x: e.x, y: e.y - 18, r: 46, a: 0.6, c: '255,40,60', ca: 0.2 });
      else lights.push({ x: e.x, y: e.y - 8, r: 22, a: 0.25 });
    }
    for (const t of G.tele) if (t.shape !== 'spawn' && !(t.r > 600)) { const lx = t.shape === 'line' ? t.x + Math.cos(t.ang) * t.len / 2 : t.x, ly = t.shape === 'line' ? t.y + Math.sin(t.ang) * t.len / 2 : t.y; lights.push({ x: lx, y: ly, r: (t.shape === 'line' ? t.len / 2 : t.r) + 16, a: 0.45, c: t.mark ? '170,60,220' : '240,30,30', ca: 0.1 + 0.12 * (t.t / t.dur) }); }
    gearLights(lights); forgeLights(lights); CA.lights(lights); END.lights(lights); HOME.lights(lights); ARCH.lights(lights); TRUTH.lights(lights); DEN.lights(lights);
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
    { const t = 0; /* v3.19 전설 무기 광채(빛) 삭제 */ if (t === 3 && !G.player.dead) lights.push({ x: G.player.x, y: G.player.y - 14, r: 70, a: 0.5, c: LEGEND_FX_COL[G.cls].c, ca: 0.12 + 0.04 * Math.sin(time * 6) }); }
    // v0.92 버프 이펙트가 어둠에 묻히지 않게: 보호막·강화한 적, 망령 기사 영혼 사슬에 빛
    for (const e of G.enemies) { const B = buffState(e); if (!B) continue; const h = enemyH(e);
      if (B.bar) lights.push({ x: e.x, y: e.y, r: Math.max(40, enemyW(e) * 2 + 20), a: 0.55, c: B.bar.c, ca: 0.1 + 0.05 * Math.sin(time * 4) });
      if (B.emp) lights.push({ x: e.x, y: e.y - 4, r: 34, a: 0.45, c: B.emp, ca: 0.1 }); }
    if (G.boss && !G.boss.dead && G.boss.shield) for (const g2 of G.enemies) if (g2.type === 'ghost' && !g2.dead) for (let i = 1; i <= 3; i++) { const t = i / 4; lights.push({ x: g2.x + (G.boss.x - g2.x) * t, y: g2.y - 20 + (G.boss.y - 14 - g2.y) * t, r: 30, a: 0.4, c: '120,170,240', ca: 0.06 }); }
    if (G.frenzyT > 0) lights.push({ x: G.player.x, y: G.player.y - 12, r: 48, a: 0.5, c: '255,40,50', ca: 0.14 + 0.05 * Math.sin(time * 10) });
    for (const f of G.fx) if (f.kind === 'hitspark') lights.push({ x: f.x, y: f.y, r: f.r * 1.6, a: 0.4 * (f.t / f.max), c: f.c, ca: 0.07 * (f.t / f.max) });
    for (const f of G.fx) if (f.kind === 'hitflash') lights.push({ x: f.x, y: f.y, r: 50, a: 0.7 * (f.t / f.max), c: '255,240,200', ca: 0.2 * (f.t / f.max) });
    for (const p of G.parts) if (p.glow) lights.push({ x: p.x, y: p.y, r: 8, a: 0.4 });
    roomLights(lights);
    if (moonOn()) lights.push({ x: cam.x + VW * MOON.x, y: cam.y + VH * MOON.y, r: VW * MOON.r, a: MOON.a, c: MOON.c, ca: MOON.ca }); // v3.19 야외(1장 · 3장) 달빛: 화면 왼쪽 위 하늘에서 비스듬히 드리우는 넓고 옅은 푸른 빛
    if (flashT > 0) lights.push({ x: cam.x + VW / 2, y: cam.y + VH / 2, r: 900, a: Math.min(1, flashT * 4), flash: OPT && !(LGL && !LGL.off && LIGHT_GL) });

    const vis = lights.filter(l => l.x + l.r > cam.x && l.x - l.r < cam.x + VW && l.y + l.r > cam.y && l.y - l.r < cam.y + VH);
    if (LGL && !LGL.off && LIGHT_GL) { renderLightingGL(vis); return; } // v1.78 GPU + 디더
    if (OPT) { // v1.17 빛 지도를 반 해상도로 (화면도 어차피 2px 칸으로 다시 뽑으므로 겉모습 같음) — 칠하는 넓이 1/4
      const fl = vis.find(l => l.flash), flK = fl ? 1 - Math.round(fl.a * 0.8 * DLV) / DLV : 1; // 번쩍일 때는 어둠을 단계로 옅게 (화면만 한 빛 도장을 새로 만들면 순간 멈춤)
      const H = LIGHTH, dark = `rgba(${dkCol().join(',')},${darkA() * flK})`;
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
    lg.fillStyle = `rgba(${dkCol().join(',')},${darkA()})`; lg.fillRect(0, 0, VW, VH);
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
  // v3.21 좌우 벽은 캐릭터를 가림: 바닥 그림(floor)의 좌우 벽 띠를 캐릭터 위에 한 번 더 그림 (초원 · 시작 장소 · 대장간 · 유적 · 도박장 · 실험실 · 기록 보관소처럼 따로 그리는 방은 제외 · 옆문 자리는 비움)
  // v3.25 주인공 집중 조명 (어두운 실내 전부: 용의 유적 · 갱도 · 교단 본거지 · 은신처/도박장 · 실험실 · 기록 보관소 · 대장간 · 예배당): 발밑 바닥에 넓고 옅게 깔리는 빛 웅덩이 — 바닥 층에서 그려 캐릭터 위를 덮지 않음 · 2px 칸 · 월드에 고정된 4×4 망점으로 3단계
  const SPOT = { r: 76, ry: 0.62, al: [0, 0.68, 0.8, 0.92], c: [1.0, 0.93, 0.8] }; let spotCv = null; // v3.25 소프트 라이트로 깔기: 0.5 = 그대로 · 높을수록 밝게 · 새까만 곳(바깥 어둠 · 외곽선)은 밝아지지 않음
  function spotPool() { const P = G.player; if (!P || P.dead) return;
    const R = SPOT.r, RY = Math.round(R * SPOT.ry), w = R * 2 + 1, h = RY * 2 + 1;
    if (!spotCv || spotCv.width !== w) { [spotCv] = mkCanvas(w, h); spotCv.g = spotCv.getContext('2d'); spotCv.im = spotCv.g.createImageData(w, h); }
    const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], cx = Math.round(P.x / 2), cy = Math.round(P.y / 2), d = spotCv.im.data, [cr, cg, cb] = SPOT.c;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const dx = (i - R) / R, dy = (j - RY) / RY, q = Math.sqrt(dx * dx + dy * dy), k = (j * w + i) * 4;
      if (q >= 1) { d[k + 3] = 0; continue; } const f = Math.pow(1 - q, 1.25) * 3, t = (B4[(cy + j) & 3][(cx + i) & 3] + 0.5) / 16, lv = Math.min(3, Math.floor(f + t)), a = SPOT.al[lv];
      if (!lv) { d[k + 3] = 0; continue; } d[k] = 255 * (0.5 + (a - 0.5) * cr); d[k + 1] = 255 * (0.5 + (a - 0.5) * cg); d[k + 2] = 255 * (0.5 + (a - 0.5) * cb); d[k + 3] = 255; }
    spotCv.g.putImageData(spotCv.im, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = 'soft-light'; ctx.drawImage(spotCv, (cx - R) * 2, (cy - RY) * 2, w * 2, h * 2); ctx.restore(); }
  const indoorDark = () => { const D = G && G.dun, R = D && D.cur; if (!R) return false; return !!(D.forge || D.den || D.lab || D.ruin || ['den', 'lab', 'archive', 'forge', 'ruin', 'chapel'].includes(R.type) || (typeof RUIN !== 'undefined' && RUIN.on()) || (typeof DEN !== 'undefined' && DEN.on && DEN.on())); };
  const SKSHAKE = { t: 0, max: 0.3, n: 0, dx: 0, dy: 0, last: 0 };
  function skShake(n, ang) { const A = Math.min(10, n * 0.7); if (A < SKSHAKE.n * (SKSHAKE.t / SKSHAKE.max)) return; SKSHAKE.n = A; SKSHAKE.max = 0.18 + A * 0.02; SKSHAKE.t = SKSHAKE.max; SKSHAKE.dx = ang == null ? 0 : Math.cos(ang); SKSHAKE.dy = ang == null ? 1 : Math.sin(ang); } // v3.25 화면 흔들림은 v1.07부터 꺼 두었음 — 기사 레전더리 기술(별의 서약 · 처형)에서만 켬
  function sideClip(fn) { // v3.25 2~4장 방: 캐릭터 · 적 · 시체를 좌우 벽 안쪽(옆문 자리는 열어 둠)으로만 그림
    const D = G && G.dun, R = D && D.cur; if (!R || G.stage === 1 || D.forge || D.home || D.ruin || D.den || D.lab || ['home', 'archive', 'lab', 'den', 'forge', 'ruin'].includes(R.type)) return fn();
    ctx.save(); ctx.beginPath(); ctx.rect(A.x0, A.y0 - 600, A.x1 - A.x0, A.y1 - A.y0 + 1200);
    for (const d of ['w', 'e']) if (R.doors && R.doors[d] != null && !(typeof hiddenDoor === 'function' && hiddenDoor(R, d))) { const p = DOOR[d].y; ctx.rect(d === 'w' ? A.x0 - 120 : A.x1, p - 30, 120, 60); }
    ctx.clip(); try { return fn(); } finally { ctx.restore(); } }
  function drawSideWalls() {
    const D = G && G.dun, R = D && D.cur; if (!R || G.stage === 1 || D.forge || D.home || D.ruin || D.den || D.lab || ['home', 'archive', 'lab', 'den', 'forge', 'ruin'].includes(R.type)) return;
    const y0 = Math.max(0, A.y0), y1 = Math.min(H, A.y1 + 40), WW = 64;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    for (const [xa, xb, d] of [[Math.max(0, A.x0 - WW), A.x0, 'w'], [A.x1, Math.min(W, A.x1 + WW), 'e']]) {
      if (xb <= xa) continue; let ys = [[y0, y1]];
      if (R.doors && R.doors[d] != null && !(typeof hiddenDoor === 'function' && hiddenDoor(R, d))) { const p = DOOR[d].y; ys = [[y0, p - 30], [p + 30, y1]]; } // 옆문 자리는 비워 문으로 드나들 때 몸이 잘리지 않게
      for (const [a, b] of ys) if (b > a) ctx.drawImage(floor, xa, a, xb - xa, b - a, xa, a, xb - xa, b - a); }
    ctx.restore(); }
  function render() {
    { const hide = BUB_RECTS.some(r => mouse.x >= r[0] && mouse.x < r[0] + r[2] && mouse.y >= r[1] && mouse.y < r[1] + r[3]); // v3.18 말주머니가 마우스 커서보다 위로 보이게: 그 위에선 커서를 숨김
      cv.classList.toggle('noCur', hide); BUB_RECTS.length = 0; }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    if (!G) { drawTitleScene(); ctx.restore(); return; } // v1.12 타이틀 도트 그림
    let sx = 0, sy = 0;
    // v1.07: 화면 흔들림 전부 끔 (사용자 결정 — 액션할 때 화면이 흔들리거나 움직이지 않게). shake 값은 계산만 남음
    // v1.05: 타격 줌(화면 전체 비정수 배율)은 도트 격자를 깨서 끔 — 흔들림·히트스톱으로 손맛
    { const S = SKSHAKE, now = performance.now() / 1000; if (S.t > 0) { S.t -= Math.min(0.05, now - (S.last || now)); const k = Math.max(0, S.t / S.max), A = S.n * k * k; if (S.t > S.max - 0.05) { sx = S.dx * A; sy = S.dy * A; } else { sx = (Math.random() * 2 - 1) * A; sy = (Math.random() * 2 - 1) * A * 0.7; } } S.last = now; } // v3.25 기사 레전더리 기술 화면 흔들림 (2px 칸)
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
    drawSqueeze(); drawRiteGround(); TRUTH.ground(); DEN.ground(); RUIN.ground(); if (indoorDark() && !RUIN.on()) spotPool(); /* 유적 · 갱도 · 교단 본거지는 RUIN.ground 안에서 */ // v2.40 관중 제거 · 3단계 좁아지는 방책 (바깥 어둠만 — 말뚝은 sqzEnts에서 깊이 정렬)
    drawSoupFloor(); drawSmokeFloor(); drawPenance(); drawGearGround();
    { const dz = DITHER_ON; DITHER_ON = false; for (const t of G.tele) { if (t.mark) drawTele(t); drawTeleGlow(t); } DITHER_ON = dz; } // v0.79: 모든 몬스터의 예고는 캐릭터·몬스터 그래픽 아래에
    drawBuffBatch(); // v2.50 바닥 강화 고리 한 장으로
    const ents = G.enemies.filter(e => !e.dead).map(e => ({ y: e.type === 'crow' && (e.z || 0) > 8 ? e.y + 4000 : e.y, d: e.type === 'crow' && (e.z || 0) > 8 ? () => drawEnemyShk(e) : () => sideClip(() => drawEnemyShk(e)) })); // v3.19 날고 있는 까마귀 · 나방은 벽 · 울타리 · 기둥보다 위에 그림 (밑으로 지나가 보이던 문제)
    if (G.corpses) for (const c of G.corpses) ents.push({ y: c.e.y, d: () => sideClip(() => drawCorpse(c)) });
    ents.push({ y: G.player.y, d: drawPlayer });
    roomEnts(ents); gearEnts(ents); forgeEnts(ents); CA.ents(ents); END.ents(ents); sqzEnts(ents); TRUTH.ents(ents); DEN.ents(ents); BDC.ents(ents); if (typeof HABIULT !== 'undefined') HABIULT.ents(ents); if (typeof CASING !== 'undefined') CASING.ents(ents); // v2.57 크루가쉬 방책 말뚝도 깊이 정렬
    for (const f of G.fx) if (f.kind === 'rockspike') ents.push({ y: f.y, d: () => drawFx(f) }); // 솟는 바위는 깊이 정렬
    if (TOUCH.on && TOUCH.lock && !TOUCH.lock.dead && G.enemies.includes(TOUCH.lock) && mouse.active <= 0) { const L = TOUCH.lock; ents.push({ y: L.y - 0.5, d: () => drawAimMark(L) }); } // v2.25 모바일 조준 표시
    { const ES = ents.sort((a, b) => a.y - b.y); ES.forEach(o => o.d === drawPlayer ? sideClip(drawPlayer) : o.d()); for (const l of G.loot) drawLoot(l); /* v2.80 보상은 늘 맨 위 층 (상자 · 소품 · 캐릭터에 가려지지 않게) */ BUFF_BATCH = false; G._occ = null; drawEvOutline(); drawGateArrows(); drawWeakTop(); G._wt = ctx.getTransform();
      if (G.player.counterT > 0 || grayRoom(G.dun && G.dun.cur)) { const i = ES.findIndex(o => o.d === drawPlayer), py = G.player.y; G._occ = i < 0 ? [] : ES.slice(i + 1).filter(o => o.y < py + 140); } } // v2.28 반격 흑백: 캐릭터를 가리는 앞쪽 물체
    if (FRONT_ON && G.stage === 1 && !(G.dun && (G.dun.forge || G.dun.home))) ctx.drawImage(frontM, 0, 0); // 아래쪽 울타리·나무를 캐릭터 앞에
    // v3.25 좌우 벽 가림은 sideClip(캐릭터 · 적 · 시체를 벽 안쪽으로 잘라 그림)으로 대체 — 예전 drawSideWalls는 바닥 그림을 벽 띠에 다시 덮어 옆문 · 문 기둥 · 바닥 효과까지 지웠음
    enemySays(); TRUTH.top(); BDC.top(); // v2.58 · v3.18 머리 위 뼈주사위
    drawGearTop();
    drawWproj(); // v2.05
    drawHarp(); // v2.19 작살은 캐릭터 위에
    if (G.dropHold > 0.08 && G.player) { const P = G.player, k = Math.min(1, G.dropHold / 0.7), x = snap2(P.x - 12), y = snap2(P.y - 40); // v2.19 F 홀드 버리기 게이지
      ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 2, y - 2, 28, 6); ctx.fillStyle = '#3a2f40'; ctx.fillRect(x, y, 24, 2); ctx.fillStyle = '#d02030'; ctx.fillRect(x, y, Math.round(24 * k / 2) * 2, 2);
      ctx.font = '8px Galmuri7'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#000'; fillTextW('무기 버리기', x + 13, y - 4); ctx.fillStyle = '#ff9a8a'; fillTextW('무기 버리기', x + 12, y - 5); }
    for (const d of G.drops) drawDrop(d);
    for (const f of G.fx) if (f.kind !== 'rockspike' && f.zY == null) drawFx(f); // v3.22 zY 붙은 기술 효과는 깊이 정렬로 그림 (SKD)
    for (const pr of G.proj) drawProj(pr);
    BDC.air(); // v3.18 칼날카드
    for (const pr of G.mproj) drawMProj(pr);
    drawMeteorRock(); drawAimLine();
    for (const p of G.parts) { if (p.zY != null) continue; ctx.globalAlpha = Math.min(1, p.t * 3); ctx.fillStyle = p.c; ctx.fillRect(snap2(p.x), snap2(p.y), 2, 2); } // 2px 칸
    ctx.globalAlpha = 1;
    if (G.dun) ambBack(); // v1.55
    // v1.86 안개 제거 (7%로 옅어 거의 안 보이고, 도트 규칙의 예외였음)
    ctx.globalAlpha = 1;
    { const t0 = PERF.on ? performance.now() : 0; renderLighting(); if (PERF.on) PERF.li += performance.now() - t0; }
    if (moonOn() && MOON.shafts) moonShafts(); // v3.19 달빛 줄기 (비스듬한 띠, 디더)
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
        try { ctx = mk; sideClip(drawPlayer); ctx = oc; drawBubble.mute = true; try { for (const o of G._occ || []) o.d(); } finally { drawBubble.mute = false; } if (FRONT_ON && G.stage === 1 && !(G.dun && (G.dun.forge || G.dun.home))) oc.drawImage(frontM, 0, 0); }
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
    flushBubbles(); // v3.20 말주머니는 조명 · 어둠 · 잿빛 · 도트화 뒤에 — 주변 환경과 상관없이 또렷하게 (v1.10 모든 물체 위)
    drawPrompt();
    for (const n of G.nums) { if (n.v == null || /NaN|undefined|Infinity|null|object|function|=>|\$\{|\d[eE][+-]/.test(String(n.v))) continue; /* v2.38 잘못된 값은 그리지 않음 */ if (!n.txt && (typeof n.v === 'number' || /^[+\-]?\d+(\.\d+)?$/.test(String(n.v)))) { const rv = Math.round(Number(n.v)); if (!rv) continue; n.v = String(rv); } /* v3.83 숫자는 소수점 없이 정수로, 0은 표기하지 않음 */ ctx.globalAlpha = Math.min(1, n.t * 3); if (n.txt || (typeof n.v === 'string' && /[^0-9+\-]/.test(n.v))) { /* v2.33 글자(흘려냄·반격! 등)는 숫자 글꼴로 안 그려져 보이지 않던 문제 → 글자로, 외곽선 */ const big = (n.s || 1) >= 2, x = Math.round(n.x), y = Math.round(n.y) - (n.pop > 0 ? 2 : 0); ctx.font = big ? '11px Galmuri11' : '9px Galmuri9'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) ctx.fillText(n.v, x + dx, y + dy); ctx.fillStyle = n.c; ctx.fillText(n.v, x, y); } else { const nv = typeof n.v === 'number' ? (isFinite(n.v) ? String(Math.round(n.v)) : '') : String(n.v).replace(/(\d)\.\d+/g, '$1'); /* v2.38 소수·무한대가 0000…으로 그려지던 문제 */ if (nv) drawNumber(nv, n.x, n.y - (n.pop > 0 ? 2 : 0), n.pop > 0 ? '#ffffff' : n.c, n.s + (n.pop > 0 ? 1 : 0)); } }
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
    { const tf = typeof RUIN !== 'undefined' && RUIN.topFog && RUIN.topFog(); if (tf) { const fg = dLinear(ctx, 0, 0, 0, VH * 0.55); fg.addColorStop(0, `rgba(2,1,4,${tf})`); fg.addColorStop(1, 'rgba(2,1,4,0)'); ctx.fillStyle = fg.p(ctx, 0, 0, VW, VH); ctx.fillRect(0, 0, VW, Math.ceil(VH * 0.55)); } } // v3.20 갱도: 천장 쪽으로 어둠이 낌 (디더 그라데이션)
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
    CA.screen(); END.screen(); HOME.screen(); ARCH.screen(); DEN.screen(); RUIN.screen(); TRUTH.hud(); // v2.52 · v2.54 · v2.55
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
    const R = G.dun && G.dun.cur, P = G.player; if (!R || !R.cleared || G.sealed || G.trans || !P || P.dead || mode !== 'play' || END.busy() || CA.busy() || G.dun.home || G.cine || (typeof CINE !== 'undefined' && CINE.k > 0) || (typeof TRUTH !== 'undefined' && TRUTH.busy())) return; // v2.54 연출 중엔 문 화살표 없음 · v3.80 컷신(대화) 중에도 숨김
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
;

// ==================================================================== 16_ui.js
'use strict';
// 잿빛 왕관 원정대 — 16_ui.js : 픽셀·스킬 아이콘, 파티 패널, HUD, 메뉴, 장비·인벤토리, 직업 선택, 대장간 창, 모바일 터치, 화면 맞춤, 성능 측정
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ---------------------------------------------------------------- 픽셀 아이콘
  const ICON_PAL = { s: '#8a5aa8', k: '#000000', w: '#ffffff', l: '#b9bfca', g: '#c9a24a', h: '#6a4528', b: '#8fc8ff', B: '#3d6fa8', G: '#e3b54a', W: '#fff0b0', y: '#f2d78c', r: '#d33a3a', R: '#8e1d21', e: '#7cc98a', E: '#3d7a4a', a: '#8d8496', A: '#5b5560' };
  const ICONS = {
    atk: [
      '..............kk', '.............kwk', '............kwlk', '...........kwlk.', '..........kwlk..', '.........kwlk...',
      '........kwlk....', '.......kwlk.....', '......kwlk......', '..kk.kwlk.......', '..kgkwlk........', '...kgkk.........',
      '..kgkgk.........', '.khk.kgk........', 'khk...kk........', 'kk..............'],
    skill: [
      '.....kkkk.......', '....kbbbbk...kk.', '...kbBkkkb..kwk.', '...kbk...kkkwlk.', '..kbk.....kwlk..', '..kbk....kwlk...',
      '..kbk...kwlk....', '...kbk.kwlk.....', '...kbkkwlk......', '..kk.kwlk.......', '..kgkwlk........', '...kgkk.........',
      '..kgkgk.........', '.khk.kgk........', 'khk...kk........', 'kk..............'],
    awaken: [
      '.......y........', '...y...y...y....', '....y..y..y.....', '.....kkkkk......', '..yykGGGGGkyy...', '....kGWWWGk.....',
      'yyy.kGWwWGk.yyy.', '....kGWWWGk.....', '..yykGGGGGkyy...', '.....kkkkk......', '....y..y..y.....', '...y...y...y....',
      '.......y........', '................', '................', '................'],
    blink: [
      '................', '..........kkk...', '.........kbbbk..', '.........kbwbk..', 'bbbbb....kbbbk..', '.........kkkkk..',
      '...bbbbbkbbbbbk.', '........kbbbbbk.', 'bbbbbbb.kbBbBbk.', '........kkbkbk..', '...bbbb..kb.kb..', '.........kk.kk..',
      '................', '................', '................', '................'],
    heart: [
      '................', '..kkk....kkk....', '.krrrk..krrrk...', 'krwrrrkkrrrrrk..', 'krrrrrrrrrrrrk..', 'krrrrrrrrrrrrk..',
      '.krrrrrrrrrrk...', '..krrrrrrrrk....', '...krrrrrrk.....', '....krrrrk......', '.....krrk.......', '......kk........'],
    bell: [
      '.......kk.......', '......kGGk......', '.....kGWGGk.....', '....kGWGGGGk....', '....kGWGGGGk....', '....kGGGGGGk....',
      '...kGGGGGGGGk...', '..kGGGGGGGGGGk..', '..kkkkkkkkkkkk..', '.......kGk......', '........k.......'],
    boot: [
      '................', '.....kkkk.......', '.....keEk.......', '.....keEk.......', '.....keEk.......', '.....keEkk......',
      '.....keeEEk.....', '....keeeeEEk....', '...keeeeeeEEk...', '...kkkkkkkkkk...', '..e....e....e...', '...e....e....e..'],
    rage: [
      '..............kk', '.............krk', '............krRk', '...........krRk.', '..........krRk..', '.........krRk...',
      '........krRk....', '.......krRk.....', '......krRk......', '..kk.krRk.......', '..kgkrRk........', '...kgkk.........',
      '..kgkgk.........', '.khk.kgk........', 'khk...kk........', 'kk..............'],
    shadow: [
      '................', '......kkkk......', '.....kssssk.....', '.....ksWsWk.....', '..k..kssssk..k..', '..kk..kkkk..kk..',
      '...kk.kssk.kk...', '....kkksskkk....', '.....kksskk.....', '....kkksskkk....', '...kk.kssk.kk...', '..kk..kssk..kk..',
      '..k..kss.ssk.k..', '.....kk...kk....', '................', '................'],
    storm: [
      '.....eeeee......', '...ee.....ee....', '..e...lll...e...', '.e..ll...ll..e..', '.e.l..kkk..l.e..', 'e.l..kwwwk..l.e.',
      'e.l.kwEEEwk.l.e.', 'e.l..kwwwk..l.e.', '.e.l..kkk..l.e..', '.e..ll...ll..e..', '..e...lll...e...', '...ee.....ee....',
      '.....eeeee......', '................', '................', '................'],
    dual: [
      'kk............kk', 'kwk..........kwk', 'klwk........kwlk', '.klwk......kwlk.', '..klwk....kwlk..', '...klwk..kwlk...',
      '....klwkkwlk....', '.....klwwlk.....', '.....kgkkgk.....', '....kgk..kgk....', '...khk....khk...', '..khk......khk..',
      '..kk........kk..', '................', '................', '................'],
    skull: ['.kkkkk.', 'kwwwwwk', 'kwkwkwk', 'kwwwwwk', '.kwkwk.', '.kwwwk.', '..kkk..'],
    crown: [
      '................', 'k.......k......k', 'kak....kAk....ka', 'kaak..kaaak..kaa', 'kaaakkaaaaakkaaa', 'kaaaaaaarraaaaaa',
      'kaaaaaarrrraaaaa', 'kaaaaaaarraaaaaa', 'kAAAAAAAAAAAAAAA', 'kkkkkkkkkkkkkkkk'],
  };
  const BUFF_ICON = { atk: ICONS.rage, spd: ICONS.blink, hp: ICONS.heart, stam: ICONS.boot, cd: ICONS.bell };
  // 새 직업 아이콘은 코드로 그린다 (윤곽선 자동)
  function genIcon(fn) {
    const g = Array.from({ length: 16 }, () => Array(16).fill('.'));
    const P = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < 16 && y >= 0 && y < 16) g[y][x] = c; };
    const disc = (cx, cy, r, c) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) P(x, y, c); };
    const line = (x0, y0, x1, y1, c, w) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; P(x, y, c); if (w) P(x + 1, y, c); } };
    fn(P, disc, line);
    const out = g.map(r => r.slice());
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx] && g[y + dy][x + dx] !== '.')) out[y][x] = 'k';
    return out.map(r => r.join(''));
  }
  Object.assign(ICON_PAL, { o: '#ff9a2e', O: '#c0501a', p: '#c890ff', P: '#5a2a8a' });
  Object.assign(ICONS, {
    bolt: genIcon((P, disc, line) => { line(2, 13, 8, 7, 's'); line(1, 10, 6, 7, 'p'); line(4, 14, 8, 10, 'p'); disc(10, 6, 3.6, 'P'); disc(10, 6, 2.5, 'p'); disc(9.5, 5.5, 1, 'w'); }),
    fireball: genIcon((P, disc, line) => { line(1, 14, 6, 9, 'O', 1); line(3, 14, 7, 11, 'o'); line(1, 11, 5, 8, 'o'); disc(9.5, 6.5, 4.6, 'O'); disc(9.5, 6.5, 3.4, 'o'); disc(9, 6, 1.7, 'y'); }),
    meteor: genIcon((P, disc, line) => { line(1, 1, 7, 7, 'o', 1); line(3, 1, 8, 6, 'O', 1); line(1, 3, 6, 8, 'y'); disc(10, 9, 3.8, 'A'); disc(9.5, 8.5, 2.6, 'a'); for (let x = 3; x < 16; x += 2) P(x, 15, 'o'); P(13, 13, 'o'); P(6, 13, 'o'); }),
    mace: genIcon((P, disc, line) => { line(2, 14, 9, 7, 'h', 1); P(2, 14, 'g'); P(3, 13, 'g'); disc(11, 5, 3.4, 'l'); disc(11, 5, 1.8, 'w'); P(11, 0, 'l'); P(15, 5, 'l'); P(14, 2, 'l'); P(8, 2, 'l'); }),
    heal: genIcon((P, disc, line) => { for (let y = 2; y <= 13; y++) for (let x = 6; x <= 9; x++) P(x, y, 'W'); for (let y = 6; y <= 9; y++) for (let x = 2; x <= 13; x++) P(x, y, 'W'); line(7.5, 3, 7.5, 12, 'G'); line(3, 7.5, 12, 7.5, 'G'); P(1, 1, 'y'); P(14, 1, 'y'); P(1, 14, 'y'); P(14, 14, 'y'); }),
    miracle: genIcon((P, disc, line) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d > 5.2 && d < 6.6) P(x, y, 'y'); } disc(7.5, 7.5, 2.6, 'W'); disc(7.5, 7.5, 1.2, 'w'); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P(7.5 + Math.cos(a) * 4, 7.5 + Math.sin(a) * 4, 'G'); } }),
    musket: genIcon((P, disc, line) => { line(4, 11, 15, 1, 'A', 1); line(5, 11, 15, 2, 'l'); line(0, 14, 5, 10, 'h', 1); P(1, 14, 'h'); P(7, 9, 'g'); P(11, 5, 'g'); P(5, 12, 'A'); }),
    shotgun: genIcon((P, disc, line) => { line(0, 15, 5, 10, 'h', 1); line(4, 11, 7, 8, 'A', 1); for (let i = 0; i < 7; i++) { const a = -Math.PI / 4 + (i - 3) * 0.2, r = 6 + (i % 3) * 1.5; P(8 + Math.cos(a) * r, 7 + Math.sin(a) * r, 'y'); P(8 + Math.cos(a) * (r - 3), 7 + Math.sin(a) * (r - 3), 'o'); } }),
    snipe: genIcon((P, disc, line) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d > 5 && d < 6.3) P(x, y, 'r'); } line(7.5, 0, 7.5, 4, 'r'); line(7.5, 11, 7.5, 15, 'r'); line(0, 7.5, 4, 7.5, 'r'); line(11, 7.5, 15, 7.5, 'r'); P(7.5, 7.5, 'w'); }),
  });
  function drawIcon(c, map) {
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    const oy = Math.floor((c.height - map.length) / 2), ox = Math.floor((c.width - map[0].length) / 2);
    map.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch !== '.' && ICON_PAL[ch]) { g.fillStyle = ICON_PAL[ch]; g.fillRect(ox + x, oy + y, 1, 1); } } });
  }
  // ---------------------------------------------------------------- 스킬 아이콘 32×32 (디더링 배경 + 윤곽선 자동)
  const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  // N=32: 1px 아이콘 / N=16: 캐릭터와 같은 2px 칸 아이콘 (같은 그리기 코드를 좌표·굵기만 반으로 줄여 다시 그린다)
  function icon32(theme, draw) { const c = iconBuild(theme, draw, 32); c.cell = iconBuild(theme, draw, 16); return c; }
  function iconBuild(theme, draw, N) {
    const [c, g] = mkCanvas(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - 15.5 * N / 32, y - 13 * N / 32) / (20 * N / 32), v = 1 - d + (BAYER4[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * 0.35;
      g.fillStyle = v > 0.66 ? theme[2] : v > 0.3 ? theme[1] : v > -0.05 ? theme[0] : '#06050a'; g.fillRect(x, y, 1, 1);
    }
    const L = { back: new Array(N * N).fill(null), main: new Array(N * N).fill(null), top: new Array(N * N).fill(null) };
    let cur = 'main';
    const px = (x, y, col) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < N && y >= 0 && y < N) L[cur][y * N + x] = col; };
    const each = fn => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) fn(x, y); };
    const api = {
      layer: k => { cur = k; },
      px,
      disc: (cx, cy, r, col) => each((x, y) => { if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) px(x, y, col); }),
      ring: (cx, cy, r0, r1, col, a0 = -999, a1 = 999) => each((x, y) => { const d = Math.hypot(x - cx, y - cy); if (d < r0 || d > r1) return; let a = Math.atan2(y - cy, x - cx) * 180 / Math.PI; if (a0 > -999) { while (a < a0) a += 360; if (a > a1) return; } px(x, y, col); }),
      rect: (x0, y0, x1, y1, col) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) px(x, y, col); },
      tri: (p, col) => each((x, y) => { const s = (a, b) => (b[0] - a[0]) * (y + 0.5 - a[1]) - (b[1] - a[1]) * (x + 0.5 - a[0]); const d1 = s(p[0], p[1]), d2 = s(p[1], p[2]), d3 = s(p[2], p[0]); if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) px(x, y, col); }),
      line: (x0, y0, x1, y1, w, col) => { const L2 = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L2, uy = (y1 - y0) / L2; each((x, y) => { const dx = x + 0.5 - x0 - 0.5, dy = y + 0.5 - y0 - 0.5, t = dx * ux + dy * uy, s = Math.abs(-dx * uy + dy * ux); if (t >= -0.5 && t <= L2 + 0.5 && s <= w / 2) px(x, y, col); }); },
      // 칼날: 한쪽 날은 밝게, 반대쪽은 어둡게, 끝은 뾰족하게
      blade: (x0, y0, x1, y1, w, cols, tip = 0.22) => { const L2 = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L2, uy = (y1 - y0) / L2; each((x, y) => { const dx = x - x0, dy = y - y0, t = (dx * ux + dy * uy) / L2, s = -dx * uy + dy * ux; if (t < 0 || t > 1) return; const hw = w / 2 * (t > 1 - tip ? (1 - t) / tip : 1) + 0.3; if (Math.abs(s) > hw) return; px(x, y, s < -hw * 0.25 ? cols[0] : s > hw * 0.4 ? cols[2] : cols[1]); }); },
      // 혜성 꼬리: 꼬리 끝(x0,y0)은 가늘고 어둡게, 머리(x1,y1)로 갈수록 굵고 밝게. 끝은 점으로 흩어진다
      comet: (x0, y0, x1, y1, r0, r1, cols, wave = 0) => {
        const n = 40, L2 = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L2, ny = (x1 - x0) / L2;
        for (let i = 0; i <= n; i++) {
          const t = i / n, w = Math.sin(t * Math.PI * 2) * wave * (1 - t), cx = x0 + (x1 - x0) * t + nx * w, cy = y0 + (y1 - y0) * t + ny * w, r = r0 + (r1 - r0) * t * t;
          const col = cols[Math.min(cols.length - 1, Math.floor(t * cols.length))];
          if (t < 0.18) { if (i % 3 === 0) px(cx, cy, col); continue; }
          for (let yy = Math.floor(cy - r); yy <= Math.ceil(cy + r); yy++) for (let xx = Math.floor(cx - r); xx <= Math.ceil(cx + r); xx++) if ((xx - cx) ** 2 + (yy - cy) ** 2 <= r * r) px(xx, yy, col);
        }
      },
      arc: (cx, cy, r, a0, a1, w0, w1, cols, rev) => {
        const n = 60;
        for (let i = 0; i <= n; i++) {
          let t = i / n; const tt = rev ? 1 - t : t, an = (a0 + (a1 - a0) * t) * Math.PI / 180, w = (w0 + (w1 - w0) * tt * tt) / 2;
          const col = cols[Math.min(cols.length - 1, Math.floor(tt * cols.length))], x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r;
          if (tt < 0.15) { if (i % 3 === 0) px(x, y, col); continue; }
          for (let yy = Math.floor(y - w); yy <= Math.ceil(y + w); yy++) for (let xx = Math.floor(x - w); xx <= Math.ceil(x + w); xx++) if ((xx - x) ** 2 + (yy - y) ** 2 <= w * w) px(xx, yy, col);
        }
      },
      slash: (x0, y0, x1, y1, w, cols) => {
        const n = 40;
        for (let i = 0; i <= n; i++) {
          const t = i / n, k = Math.sin(t * Math.PI), r = w / 2 * k, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
          const col = cols[Math.min(cols.length - 1, Math.floor(k * cols.length))];
          for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) if ((xx - x) ** 2 + (yy - y) ** 2 <= r * r + 0.2) px(xx, yy, col);
        }
      },
      glow: (cx, cy, r, cols) => each((x, y) => { const d = Math.hypot(x - cx, y - cy) / r; if (d > 1) return; const v = 1 - d + (BAYER4[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * 0.4; const i = Math.min(cols.length - 1, Math.floor(v * cols.length)); if (i >= 0) px(x, y, cols[i]); }),
      star: (x, y, r, col, core = '#ffffff') => { for (let i = -r; i <= r; i++) { px(x + i, y, col); px(x, y + i, col); } if (r > 2) { px(x - 1, y - 1, col); px(x + 1, y - 1, col); px(x - 1, y + 1, col); px(x + 1, y + 1, col); } px(x, y, core); },
    };
    if (N === 32) draw(api);
    else {
      const k = N / 32, S = v => v * k - (1 - k) * 0.5, W = (v, m) => Math.max(m, v * k);
      draw({
        layer: api.layer, px: (x, y, col) => px(S(x), S(y), col),
        disc: (cx, cy, r, col) => api.disc(S(cx), S(cy), W(r, 0.6), col),
        ring: (cx, cy, r0, r1, col, a0, a1) => api.ring(S(cx), S(cy), r0 * k, W(r1, r0 * k + 0.8), col, a0, a1),
        rect: (x0, y0, x1, y1, col) => api.rect(Math.round(S(x0)), Math.round(S(y0)), Math.round(S(x1)), Math.round(S(y1)), col),
        tri: (p, col) => api.tri(p.map(([x, y]) => [S(x), S(y)]), col),
        line: (x0, y0, x1, y1, w, col) => api.line(S(x0), S(y0), S(x1), S(y1), W(w, 1), col),
        blade: (x0, y0, x1, y1, w, cols, tip) => api.blade(S(x0), S(y0), S(x1), S(y1), W(w, 1.6), cols, tip),
        comet: (x0, y0, x1, y1, r0, r1, cols, wave = 0) => api.comet(S(x0), S(y0), S(x1), S(y1), W(r0, 0.4), W(r1, 0.6), cols, wave * k),
        arc: (cx, cy, r, a0, a1, w0, w1, cols, rev) => api.arc(S(cx), S(cy), r * k, a0, a1, W(w0, 0.6), W(w1, 1), cols, rev),
        slash: (x0, y0, x1, y1, w, cols) => api.slash(S(x0), S(y0), S(x1), S(y1), W(w, 1.6), cols),
        glow: (cx, cy, r, cols) => api.glow(S(cx), S(cy), r * k, cols),
        star: (x, y, r, col, core) => api.star(Math.round(S(x)), Math.round(S(y)), Math.max(1, Math.round(r * k)), col, core),
      });
    }
    const OUT = '#06050a', main = L.main, outl = main.slice();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!main[y * N + x]) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < N && yy >= 0 && yy < N && main[yy * N + xx]) { outl[y * N + x] = OUT; break; } } }
    for (const layer of [L.back, outl, L.top]) layer.forEach((col, i) => { if (col) { g.fillStyle = col; g.fillRect(i % N, Math.floor(i / N), 1, 1); } });
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.strokeRect(0.5, 0.5, N - 1, N - 1);
    return c;
  }
  const STEEL = ['#ffffff', '#c8ccd8', '#6a7084'], GOLDP = ['#fff4c0', '#e8b84a', '#8a5a1a'], HOLY = ['#ffffff', '#ffe08a', '#c08a2a'];
  const FIG = (a, x, col, eye) => { a.disc(x, 10, 3.6, col); a.tri([[x, 11], [x - 6, 27], [x + 6, 27]], col); if (eye) { a.px(x + 1, 10, eye); a.px(x - 1, 10, eye); } };
  const ICON32 = {
    atk: icon32(['#1a0c0c', '#3a1414', '#6a2418'], a => {
      a.layer('back'); a.glow(23, 8, 7, ['#5a1a10', '#8a3018']);
      a.arc(15, 18, 12, 195, 325, 0.4, 4.2, ['#5a1a10', '#a03a18', '#e07030', '#ffc890']);
      a.arc(15, 18, 9, 215, 315, 0.3, 1.6, ['#a03a18', '#ffb070']);
      a.layer('main'); a.blade(9, 23, 27, 5, 6, STEEL, 0.22); a.line(12, 20, 24, 8, 0.8, '#8a90a0');
      a.line(6, 19, 13, 26, 2.4, '#c9902a'); a.line(6, 19, 13, 26, 0.8, '#ffe08a');
      a.line(4, 28, 8, 24, 2.6, '#4a2e1a'); a.px(5, 26, '#7a5232'); a.px(7, 25, '#7a5232'); a.disc(3.5, 28.5, 1.6, '#a3222a'); a.px(3, 28, '#ff8080');
      a.layer('top'); a.star(26, 6, 3, '#fff4c0'); a.px(20, 12, '#ffffff');
    }),
    skill: icon32(['#081428', '#10284a', '#1e4a80'], a => {
      a.layer('back'); for (const [y, l] of [[9, 10], [15, 13], [21, 9]]) a.comet(3, y, 3 + l, y, 0.3, 1.4, ['#1e4a80', '#4a90e0', '#9fd8ff']);
      a.arc(14, 19, 12, -105, 5, 0.4, 4, ['#1e4a80', '#3a80d0', '#9fd8ff', '#e8f4ff']);
      a.glow(26, 8, 5, ['#1e4a80', '#3a70b0']);
      a.layer('main'); a.blade(8, 24, 27, 8, 6, STEEL, 0.22); a.line(11, 21, 23, 11, 0.8, '#8a90a0');
      a.line(5, 19, 11, 27, 2.4, '#c9902a'); a.line(5, 19, 11, 27, 0.8, '#ffe08a'); a.line(3, 29, 7, 25, 2.6, '#4a2e1a'); a.px(4, 27, '#7a5232');
      a.layer('top'); a.star(27, 7, 2, '#cfe8ff'); a.px(22, 4, '#ffffff'); a.px(28, 15, '#9fd8ff');
    }),
    awaken: icon32(['#1a1206', '#3a2a0c', '#7a5a18'], a => {
      a.layer('back'); a.glow(16, 12, 12, ['#4a3410', '#7a5a18', '#b08a2a']);
      for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + 0.2; a.comet(16 + Math.cos(an) * 14, 12 + Math.sin(an) * 13, 16 + Math.cos(an) * 7, 12 + Math.sin(an) * 7, 0.3, 1.3, ['#8a6a20', '#d8b040', '#fff0b0']); }
      a.ring(16, 12, 8.5, 10, '#ffe08a'); a.ring(16, 12, 10, 10.8, '#c8902a');
      a.layer('main'); a.blade(16, 7, 16, 30, 8, HOLY, 0.28); a.line(16, 9, 16, 26, 0.8, '#fff8e0');
      a.line(9, 8, 23, 8, 2.6, '#c9902a'); a.line(9, 8, 23, 8, 0.8, '#ffe08a'); a.disc(9, 8, 1.4, '#a3222a'); a.disc(23, 8, 1.4, '#a3222a');
      a.line(16, 2, 16, 7, 2.8, '#7a5232'); a.disc(16, 2, 1.5, '#ffe08a');
      a.layer('top'); a.star(9, 19, 2, '#fff4c0'); a.star(24, 24, 2, '#fff4c0'); a.px(16, 15, '#ffffff');
    }),
    dual: icon32(['#0a160e', '#14301c', '#24502e'], a => {
      a.layer('back'); a.glow(16, 15, 9, ['#14301c', '#1e4a2c']);
      a.arc(16, 17, 12, 200, 300, 0.3, 3.4, ['#1e4a2c', '#3aa070', '#9ff0c8']);
      a.arc(16, 17, 12, -20, 80, 0.3, 3.4, ['#1e4a2c', '#3aa070', '#9ff0c8'], true);
      a.layer('main'); a.blade(7, 25, 25, 6, 4.6, STEEL, 0.3); a.blade(25, 25, 7, 6, 4.6, STEEL, 0.3);
      a.line(4, 28, 8, 24, 2.6, '#4a2e1a'); a.line(28, 28, 24, 24, 2.6, '#4a2e1a'); a.px(5, 27, '#7a5232'); a.px(27, 27, '#7a5232');
      a.line(5, 22, 10, 27, 1.8, '#a3222a'); a.line(27, 22, 22, 27, 1.8, '#a3222a');
      a.layer('top'); a.star(16, 14, 2, '#e8fff4'); a.px(24, 7, '#ffffff'); a.px(8, 7, '#ffffff');
    }),
    shadow: icon32(['#120a1c', '#24123a', '#4a2470'], a => {
      a.layer('back'); a.comet(3, 28, 11, 22, 0.4, 3.5, ['#24123a', '#3a2258', '#4a2a78']); a.comet(4, 18, 10, 16, 0.3, 2.4, ['#24123a', '#3a2258']);
      FIG(a, 8, '#2a1840'); FIG(a, 12, '#3e2466');
      a.glow(24, 15, 8, ['#3a1e5a', '#5a2e8a']);
      a.layer('main'); FIG(a, 17, '#1a0e26', '#e0a0ff'); a.line(13, 13, 21, 13, 1.6, '#a3222a'); a.px(21, 14, '#a3222a'); a.px(22, 15, '#a3222a');
      a.layer('top'); a.slash(18, 5, 30, 25, 3, ['#8a5ac8', '#e0b0ff', '#ffffff']); a.slash(18, 25, 30, 5, 3, ['#8a5ac8', '#e0b0ff', '#ffffff']); a.star(24, 15, 2, '#ffffff');
    }),
    storm: icon32(['#06140f', '#0c2a20', '#165040'], a => {
      a.layer('back'); a.glow(16, 16, 8, ['#0c2a20', '#1a5a40']);
      a.arc(16, 16, 12.5, 160, 430, 0.3, 3.4, ['#165040', '#3aa070', '#9ff0c8']);
      a.arc(16, 16, 8, -20, 250, 0.3, 2.4, ['#165040', '#3aa070', '#c8ffe4']);
      a.layer('main'); for (let i = 0; i < 4; i++) { const an = i * Math.PI / 2 + 0.4, cx = 16 + Math.cos(an) * 10, cy = 16 + Math.sin(an) * 10, tx = -Math.sin(an), ty = Math.cos(an); a.blade(cx - tx * 5, cy - ty * 5, cx + tx * 6, cy + ty * 6, 3.6, ['#ffffff', '#a8f0d0', '#3aa070'], 0.35); }
      a.layer('top'); a.star(16, 16, 2, '#e8fff4'); a.px(6, 7, '#9ff0c8'); a.px(26, 26, '#9ff0c8');
    }),
    bolt: icon32(['#0e0818', '#1e1036', '#3a1e66'], a => {
      a.layer('back');
      a.comet(3, 29, 20, 12, 0.8, 5.6, ['#4a2478', '#6a34a8', '#8a4ad0', '#a868f0']);
      a.comet(8, 29, 20, 15, 0.4, 2.4, ['#3e1c66', '#6a34a8', '#9a5ae0'], 1.4);
      a.comet(3, 23, 18, 11, 0.4, 2.2, ['#3e1c66', '#6a34a8', '#9a5ae0'], -1.4);
      a.comet(6, 26, 20, 12, 0.3, 1.8, ['#8a4ad0', '#c890ff', '#e8d0ff']);
      a.layer('main'); a.disc(21.5, 10.5, 6.6, '#6a2ab0'); a.disc(20.9, 9.9, 5, '#a060f0'); a.disc(20.2, 9.2, 3.2, '#d8b8ff'); a.disc(19.6, 8.6, 1.5, '#ffffff');
      a.layer('top'); a.star(26, 22, 2, '#d090ff'); a.star(10, 8, 1, '#d090ff'); a.px(28, 4, '#ffffff'); a.px(5, 17, '#b070ff'); a.px(15, 27, '#9a5ae0');
    }),
    fireball: icon32(['#180806', '#3a1208', '#6a2a0c'], a => {
      a.layer('back');
      a.comet(3, 29, 20, 12, 0.8, 6.8, ['#7a2008', '#b0380e', '#e05a1a', '#ff8a3a']);
      a.comet(9, 29, 21, 15, 0.4, 3.2, ['#6a1e08', '#c0401a', '#ff7a2a'], 1.8);
      a.comet(3, 22, 17, 10, 0.4, 3.0, ['#6a1e08', '#c0401a', '#ff7a2a'], -1.8);
      a.comet(6, 26, 20, 12, 0.3, 2.6, ['#ff7a2a', '#ffb050', '#ffe0a0']);
      a.layer('main'); a.disc(21.5, 10.5, 7.6, '#b0380e'); a.disc(20.9, 9.9, 5.9, '#ff6a1a'); a.disc(20.2, 9.2, 4, '#ffb040'); a.disc(19.6, 8.6, 2.2, '#fff0b0'); a.px(19, 8, '#ffffff');
      a.layer('top'); for (const [x, y, c] of [[29, 4, '#ffe0a0'], [28, 20, '#ffb060'], [11, 5, '#ffb060'], [5, 15, '#ff7a2a'], [16, 27, '#ff7a2a'], [24, 25, '#ffd080']]) a.px(x, y, c);
    }),
    meteor: icon32(['#120a0a', '#2a1410', '#5a2414'], a => {
      a.layer('back');
      a.comet(4, 4, 16, 15, 0.6, 7, ['#3a1006', '#6a1e08', '#a0300e', '#e0601e']);
      a.comet(9, 3, 18, 13, 0.4, 3, ['#6a1e08', '#c0401a', '#ff8a3a'], 1.4);
      a.comet(3, 9, 14, 17, 0.4, 3, ['#6a1e08', '#c0401a', '#ff8a3a'], -1.4);
      a.comet(6, 6, 16, 15, 0.3, 3, ['#ff8a3a', '#ffc060', '#ffe8b0']);
      a.ring(19, 29, 0, 10, '#5a1e0c'); a.ring(19, 29, 0, 6, '#a0401a'); a.ring(19, 29, 0, 3, '#ff8a3a');
      a.layer('main'); a.disc(20, 19, 7, '#3a2a2a'); a.disc(18.8, 17.8, 5, '#5a4848'); a.disc(17.8, 16.8, 2.4, '#8a7878'); a.px(16, 16, '#b0a0a0');
      a.px(23, 22, '#ff8a3a'); a.px(24, 21, '#ff8a3a'); a.px(22, 23, '#ffc060'); a.px(25, 18, '#ffc060');
      a.layer('top'); a.star(9, 26, 1, '#ffe0a0'); a.star(28, 26, 1, '#ffc060'); a.px(27, 11, '#ffb060'); a.px(12, 22, '#ff8a3a');
    }),
    mace: icon32(['#14100a', '#2e2414', '#5a4620'], a => {
      a.layer('back'); a.glow(21, 11, 10, ['#3a2e14', '#6a5420', '#a08030']);
      a.arc(15, 17, 12, 195, 300, 0.3, 3.2, ['#5a4620', '#c8902a', '#ffe8a0']);
      a.layer('main'); a.line(5, 27, 17, 15, 3.4, '#5a3a22'); a.line(5, 27, 17, 15, 1, '#8a6236'); a.line(5, 27, 8, 24, 3.6, '#c9902a'); a.line(13, 19, 15, 17, 3.6, '#c9902a'); a.px(6, 25, '#ffe08a'); a.px(14, 17, '#ffe08a');
      a.line(21, 3, 21, 19, 3.2, '#9aa0b0'); a.line(13, 11, 29, 11, 3.2, '#9aa0b0'); a.line(20, 3, 20, 19, 1, '#e0e4ec'); a.line(13, 10, 29, 10, 1, '#e0e4ec');
      a.disc(21, 11, 5.4, '#6a7084'); a.disc(20.3, 10.3, 4, '#a8aebc'); a.disc(19.6, 9.6, 2.2, '#e0e4ec'); a.px(19, 9, '#ffffff');
      a.layer('top'); a.star(27, 4, 3, '#fff4c0'); a.px(9, 7, '#ffe08a'); a.px(25, 22, '#ffe08a');
    }),
    heal: icon32(['#0a140a', '#18301a', '#2e5a2a'], a => {
      a.layer('back'); a.glow(16, 16, 12, ['#18301a', '#2e5a2a', '#4a7a2a']);
      for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + 0.39; a.comet(16 + Math.cos(an) * 15, 16 + Math.sin(an) * 15, 16 + Math.cos(an) * 9, 16 + Math.sin(an) * 9, 0.3, 1.4, ['#4a7a2a', '#a8c84a', '#f0f8b0']); }
      a.layer('main'); a.rect(13, 4, 18, 27, '#c9902a'); a.rect(5, 11, 26, 16, '#c9902a'); a.rect(14, 5, 17, 26, '#ffe08a'); a.rect(6, 12, 25, 15, '#ffe08a');
      a.rect(14, 5, 14, 26, '#fff8d8'); a.rect(6, 12, 25, 12, '#fff8d8'); a.rect(17, 6, 17, 26, '#b07a1a'); a.rect(6, 15, 25, 15, '#b07a1a'); a.rect(15, 13, 16, 14, '#ffffff');
      a.layer('top'); for (const [x, y] of [[6, 6], [26, 25], [25, 6], [6, 25]]) { a.px(x, y, '#7dff8a'); a.px(x - 1, y, '#4ac860'); a.px(x + 1, y, '#4ac860'); a.px(x, y - 1, '#4ac860'); a.px(x, y + 1, '#4ac860'); }
      a.comet(22, 30, 22, 22, 0.3, 1, ['#2e5a2a', '#7dff8a']); a.comet(9, 30, 9, 24, 0.3, 1, ['#2e5a2a', '#7dff8a']);
    }),
    miracle: icon32(['#16120a', '#3a3016', '#806a2a'], a => {
      a.layer('back'); a.glow(16, 18, 12, ['#3a3016', '#6a5a22', '#a08a40']);
      a.line(16, 8, 16, 30, 9, '#8a6a20'); a.line(16, 8, 16, 30, 6, '#d8b040'); a.line(16, 8, 16, 30, 3, '#fff4c0'); a.line(16, 8, 16, 30, 1, '#ffffff');
      a.layer('main');
      for (const sg of [-1, 1]) { const ox = 16 + sg * 2;
        a.comet(ox + sg * 13, 6, ox, 13, 0.6, 2.4, ['#c8c0b0', '#e8e0d0', '#ffffff']);
        a.comet(ox + sg * 14, 13, ox, 15, 0.6, 2.4, ['#b0a898', '#d8d0c0', '#f0ece0']);
        a.comet(ox + sg * 12, 20, ox, 17, 0.6, 2.2, ['#9a9284', '#c8c0b0', '#e8e0d0']);
        a.comet(ox + sg * 9, 26, ox, 19, 0.6, 2, ['#8a8274', '#b0a898', '#d8d0c0']); }
      a.disc(16, 16, 3.2, '#fff8d8'); a.disc(16, 16, 1.6, '#ffffff');
      a.layer('top'); a.ring(16, 5, 3.2, 4.6, '#ffe08a'); a.ring(16, 5, 2.6, 3.2, '#fff8d8'); a.star(5, 28, 1, '#fff4c0'); a.star(27, 28, 1, '#fff4c0');
    }),
    musket: icon32(['#100c0a', '#241a14', '#4a3020'], a => {
      a.layer('back'); a.comet(17, 4, 26, 6, 0.6, 3.4, ['#2a2630', '#4a4650', '#6a6670']); a.comet(22, 13, 27, 8, 0.5, 2.2, ['#2a2630', '#4a4650']);
      a.glow(27, 6, 6, ['#4a2a10', '#8a5018']);
      a.layer('main'); a.line(3, 27, 10, 21, 5.6, '#6b4a2a'); a.line(3, 28, 10, 22, 1.6, '#3e2818'); a.line(4, 25, 9, 21, 0.8, '#9a7248');
      a.line(9, 22, 20, 14, 3.4, '#7a5232'); a.line(9, 21, 20, 13, 0.8, '#a07a50');
      a.line(12, 19, 26, 8, 2.4, '#5a5e6a'); a.line(12, 18, 26, 7, 0.8, '#d8dce4');
      a.px(17, 15, '#e8b84a'); a.px(18, 15, '#e8b84a'); a.px(22, 11, '#e8b84a'); a.px(23, 11, '#e8b84a'); a.px(12, 21, '#3a3a40'); a.px(13, 22, '#3a3a40');
      a.layer('top'); a.slash(25, 8, 30, 3, 2.4, ['#ff9a3a', '#ffd080', '#ffffff']); a.slash(24, 5, 30, 7, 1.6, ['#ff9a3a', '#ffd080']); a.star(27, 6, 2, '#ffd080', '#ffffff');
    }),
    shotgun: icon32(['#140a06', '#2e1408', '#5a2a10'], a => {
      a.layer('back'); a.glow(13, 19, 8, ['#5a2a10', '#a04a18']);
      for (const [x, y] of [[23, 5], [27, 10], [28, 16], [27, 22], [21, 9], [24, 16], [22, 21]]) a.comet(11, 20, x, y, 0.3, 1.4, ['#5a2a10', '#c0501a', '#ff9a3a', '#ffe0a0']);
      a.layer('main'); a.line(3, 28, 10, 21, 5, '#2e2e34'); a.line(3, 27, 10, 20, 1.2, '#8d9097'); a.line(1, 30, 5, 26, 5, '#5a3a22'); a.px(2, 29, '#8a6236');
      a.layer('top'); a.slash(9, 22, 15, 16, 3.6, ['#ff7a2a', '#ffd080', '#ffffff']); for (const [x, y] of [[23, 5], [27, 10], [28, 16], [27, 22], [21, 9], [24, 16], [22, 21]]) a.px(x, y, '#fff8e0');
    }),
    snipe: icon32(['#140608', '#2e0c12', '#5a1420'], a => {
      a.layer('back'); a.glow(16, 16, 9, ['#2e0c12', '#5a1420', '#8a2030']);
      a.comet(3, 25, 15, 17, 0.3, 1.6, ['#5a1420', '#c06040', '#ffd080']);
      a.layer('main'); a.ring(16, 16, 10, 11.8, '#b02a30'); a.ring(16, 16, 10, 10.6, '#ff6a6a', 200, 320);
      a.line(16, 2, 16, 9, 1.4, '#e04848'); a.line(16, 23, 16, 30, 1.4, '#e04848'); a.line(2, 16, 9, 16, 1.4, '#e04848'); a.line(23, 16, 30, 16, 1.4, '#e04848');
      a.layer('top'); a.disc(16, 16, 1.4, '#ffffff'); for (const t of [12, 20]) { a.px(t, 16, '#ffb0b0'); a.px(16, t, '#ffb0b0'); } a.star(16, 16, 1, '#ffd0d0', '#ffffff');
    }),
    blink: icon32(['#081020', '#0e2040', '#1a3a70'], a => {
      a.layer('back'); for (const [y, l] of [[12, 9], [18, 12], [24, 8]]) a.comet(3, y, 3 + l, y, 0.3, 1.3, ['#1a3a70', '#4a80c0', '#9fd2ff']);
      a.glow(22, 17, 8, ['#1a3a70', '#3a6ab0']); FIG(a, 9, '#1e3a6a'); FIG(a, 15, '#3a6ab0');
      a.layer('main'); FIG(a, 22, '#cfe6ff', '#1a3a70'); a.line(19, 18, 19, 25, 1, '#ffffff');
      a.layer('top'); a.star(28, 7, 2, '#ffffff', '#ffffff'); a.px(26, 27, '#9fd2ff'); a.px(5, 6, '#9fd2ff');
    }),
  };
  ICON32.hourglass = icon32(['#0a1018', '#142434', '#24405a'], a => { // 16칸 도트 맵을 그대로 찍는다 (1칸 = 2px)
    const M = ['', '', '..GGGGGGGGGGGG..', '..YYYYYYYYYYYY..', '...bwsssssswb...', '...b.wssssw.b...', '...b..wssw..b...', '...b...ss...b...', '...b..wssw..b...', '...b.w....w.b...', '...b.w.ss.w.b...', '...bwsssssswb...', '..GGGGGGGGGGGG..', '..YYYYYYYYYYYY..'];
    const C = { G: '#e8c060', Y: '#8a6420', b: '#b08838', w: '#bfe8ff', s: '#f0a040' };
    a.layer('back'); a.glow(16, 16, 12, ['#142434', '#24405a', '#3a6a8a']);
    a.layer('main'); M.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (C[r[x]]) a.rect(x * 2, y * 2, x * 2 + 1, y * 2 + 1, C[r[x]]); });
    a.layer('top'); a.rect(28, 4, 29, 5, '#ffffff'); a.rect(2, 22, 3, 23, '#d8f0ff');
  });

  // v3.15 그레이브 탄환 아이콘 셋 — 좌클릭: 머스킷 탄 / 우클릭(파열탄): 짧고 통통한 산탄 / 각성(등 맡기기): 서로 스쳐 지나가는 두 탄
  // 45° 대각선 탄환: s = x - y (탄 길이 방향, 오른쪽 위로 갈수록 큼), t = x + y (가로지르는 방향, 작을수록 왼쪽 위 = 빛 받는 쪽)
  const DIAG = (a, s0, s1, tc, hw, col) => { for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const S = x - y, T = x + y; if (S < s0 || S > s1) continue; const h = typeof hw === 'function' ? hw(S) : hw; if (Math.abs(T - tc) > h) continue; const c = col(S, T - tc, h); if (c) a.px(x, y, c); } };
  ICON32.musket = icon32(['#100c0a', '#241a14', '#4a3020'], a => { // 머스킷 탄: 놋쇠 탄피 + 구리 탄두 · 끝에 반짝임 (반듯한 45°)
    a.layer('back'); a.glow(16, 16, 12, ['#241a14', '#4a3020', '#7a4a20']);
    a.layer('main');
    DIAG(a, -24, -3, 32, 4, (S, d) => S < -21 ? (d < -1 ? '#e0b860' : d > 1 ? '#6a4810' : '#a8802a') : d <= -3 ? '#f8e08a' : d <= -1 ? '#e0b860' : d < 2 ? '#c9a24a' : '#8a6420'); // 놋쇠 탄피 (아래 끝은 테)
    DIAG(a, -2, 20, 32, S => S < 4 ? 3 : Math.max(0, 3 - Math.floor((S - 4) / 4)), (S, d) => d <= -2 ? '#f8b070' : d <= 0 ? '#d07a38' : '#8a4418'); // 구리 탄두 (끝으로 갈수록 가늘게)
    a.layer('top'); a.star(26, 5, 2, '#ffe0a0', '#ffffff');
  });
  const SHELL45 = (a, s0, s1, sHead, tc, hw, dir) => { // 짧고 통통한 산탄 (45°): dir 1 = 머리가 왼쪽 아래 · 끝이 오른쪽 위 / -1 = 반대
    DIAG(a, s0, s1, tc, hw, (S, d) => { const k = dir > 0 ? S - s0 : s1 - S, head = k <= sHead, end = k >= (s1 - s0) - 2;
      if (head) return k < 2 ? (d < -1 ? '#e0b860' : '#7a5414') : d <= -4 ? '#fff0b0' : d <= -2 ? '#f0d27a' : d < 2 ? '#c9a24a' : '#8a6420'; // 놋쇠 머리 (끝 테)
      if (end) return d <= -2 ? '#c8302a' : '#7a1414';                                                                       // 접어 막은 끝
      return d <= -4 ? '#ff9a8a' : d <= -2 ? '#e8504a' : d < 2 ? '#c8302a' : '#7a1414'; });
  };
  ICON32.shotgun = icon32(['#140a06', '#2e1408', '#5a2a10'], a => { // 파열탄: 짧고 통통한 붉은 산탄 · 아래 놋쇠 머리에 반짝임 (반듯한 45°)
    a.layer('back'); a.glow(16, 16, 12, ['#2e1408', '#5a2a10', '#8a3a14']);
    a.layer('main'); SHELL45(a, -16, 12, 9, 32, 6.5, 1);
    a.layer('top'); a.star(7, 18, 2, '#fff0b0', '#ffffff');
  });
  ICON32.duo = icon32(['#081414', '#0e2a28', '#1a4a44'], a => { // v3.15 등 맡기기: 머스킷 탄(오른쪽 위로)과 산탄(왼쪽 아래로)이 서로 빗나가듯 스쳐 지나감 · 스친 자리에 불티
    a.layer('back'); a.glow(16, 16, 13, ['#0e2a28', '#1a4a44', '#2a6a60']);
    a.layer('main');
    DIAG(a, -21, -7, 27, 3, (S, d) => S < -19 ? (d < 0 ? '#e0b860' : '#6a4810') : d <= -2 ? '#f8e08a' : d <= 0 ? '#e0b860' : d < 2 ? '#c9a24a' : '#8a6420'); // 머스킷 놋쇠 탄피
    DIAG(a, -6, 7, 27, S => S < -3 ? 3 : Math.max(0, 3 - Math.floor((S + 3) / 3)), (S, d) => d <= -2 ? '#f8b070' : d <= 0 ? '#d07a38' : '#8a4418'); // 구리 탄두 (오른쪽 위)
    SHELL45(a, -3, 21, 7, 38, 4.5, -1);                                                                                     // 산탄 (머리가 오른쪽 위 · 끝이 왼쪽 아래)
    a.layer('top'); a.star(17, 15, 2, '#ffd080', '#ffffff'); a.px(19, 14, '#fff0c0'); a.px(15, 17, '#fff0c0'); // 스친 자리 불티
  });



  ICON32.blink = icon32(['#081020', '#0e2040', '#1a3a70'], a => { // v3.15 회피(점멸) 다시 그림 — 날카로운 초승달 잔상 두 겹이 몸을 감싸듯 비켜 감 · 끝의 별빛
    a.layer('back'); a.glow(16, 16, 13, ['#0e2040', '#1a3a70', '#2a5aa0']);
    a.arc(16, 16, 12, 120, 380, 0.3, 3.6, ['#1a3a70', '#2a5aa0', '#4a80c0', '#7ab4f0']);                             // 바깥 초승달 (흐린 잔상)
    a.layer('main');
    a.arc(16, 16, 8.5, 150, 400, 0.3, 4.4, ['#2a5aa0', '#7ab4f0', '#cfe6ff', '#ffffff']);                            // 안쪽 초승달 (밝음)
    for (const [x, y, c] of [[5, 22, '#3a6ab0'], [3, 17, '#2a5aa0'], [7, 27, '#1e3a6a']]) a.rect(x, y, x + 1, y + 1, c);
    a.layer('top'); a.star(23, 9, 3, '#9fd2ff', '#ffffff'); a.px(28, 4, '#cfe6ff'); a.px(26, 26, '#9fd2ff'); a.px(12, 13, '#cfe6ff');
  });
  ICON32.soup = icon32(['#180e08', '#2e1a10', '#5a3418'], a => { // v2.10 끓는 수프 그릇
    const M = ['', '', '......w....w....', '.....w....w.....', '......w....w....', '', '..LLLLLLLLLLLL..', '.LssgssSsgsssL..', '.BBBBBBBBBBBBBB.', '..BBbBBBBBBbBB..', '..BBBBBBBBBBBB..', '...DBBBBBBBBD...', '....DDDDDDDD....'];
    const C = { w: '#e8ecf0', L: '#f0e0b8', s: '#e8903a', S: '#ffc060', g: '#6aa040', B: '#b0683a', b: '#f0e0b8', D: '#6a3a20' };
    a.layer('back'); a.glow(16, 14, 12, ['#2e1a10', '#5a3418', '#8a4a20']);
    a.layer('main'); M.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (C[r[x]]) a.rect(x * 2, y * 2, x * 2 + 1, y * 2 + 1, C[r[x]]); });
  });
  function drawIcon32(c, key) { c.width = 32; c.height = 32; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 32, 32); if (ICON32[key]) { const I = ICON32[key].cell || ICON32[key]; g.drawImage(I, 0, 0, 32, 32); } } // v0.49: 캐릭터와 같은 2px 칸 아이콘
  drawIcon32($('skA').querySelector('canvas'), 'atk');
  drawIcon32($('skK').querySelector('canvas'), 'skill');
  drawIcon32($('skL').querySelector('canvas'), 'awaken');
  drawIcon32($('skD').querySelector('canvas'), 'blink');
  drawIcon($('bossIcon'), ICONS.skull); drawIcon($('bossIcon2'), ICONS.skull);
  { const c = $('crown'), g = c.getContext('2d'), P = { k: '#0b0a0e', w: '#e2e0da', a: '#b4b2ae', A: '#7e7c80', d: '#4c4a50', 1: '#d4f8a8', 2: '#7ad84a', 3: '#3e7a20', 4: '#c8e0ff', 5: '#4a8cff', 6: '#1a3a8a', 7: '#ffb0a0', 8: '#e04030', 9: '#801818' }; // v2.56 로고 위 재의 왕관: 잿빛 몸체 + 초록 · 파랑 · 빨강 보석
    c.width = TS_CROWN[0].length; c.height = TS_CROWN.length; TS_CROWN.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (P[r[x]]) { g.fillStyle = P[r[x]]; g.fillRect(x, y, 1, 1); } }); }

  // 초상화: 기사 스프라이트의 머리와 상반신
  function portraitURL() {
    const [c, g] = mkCanvas(14, 14);
    const rows = MAPS[CLASSES[CUR].map], pal = PAL[CLASSES[CUR].pal];
    // 수인 직업(18칸 폭)은 얼굴을 기준으로 귀까지 보이게 잘라낸다
    const wide = rows[0].length >= 18, face = rows.findIndex(r => r.includes('s')), y0 = wide ? Math.max(0, face - 7) : 0;
    rows.slice(y0, y0 + (wide ? 13 : 12)).forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(wide ? x - 2 : x + 1, y + (wide ? 1 : 2), 1, 1); } } });
    return c.toDataURL();
  }
  // 캐릭터 초상 (30×39, 2px 칸으로 그려 60×78) — 원본 도트를 1배로 되돌려 테두리·잔점을 정리한 것
  const PORTRAITS = {
    knight: { pal: {'a': '#895042', 'b': '#a29378', 'c': '#b16f46', 'd': '#b89277', 'e': '#c03116', 'f': '#c0723e', 'g': '#c8ad94', 'h': '#d68b59', 'i': '#d6bea4', 'j': '#ecbb7e', 'k': '#ecd4af', 'l': '#f3dbb6', 'm': '#fae1ca'}, rows: ['..............................', '.................aeea.........', '................eeeeee........', '...............eeeeeeaaf......', '..............eeee..aeeee.....', '..............eee..eeeeeeee...', '...............a..eeeaaaeeea..', '.......kkk...gd...a..aee..ee..', '.....amgglgdabgiba...eeeee....', '.....km..kkkm..kkkg....eeee...', '....mk..la.dkkg.kkkgb...aeee..', '...dlb.gi..k.ikk.bkgbb...aee..', '..kkb..d..kb..kkk.abbbb...ae..', '..lk..mb.am..gi.ki..dbb....a..', '.adi..kgaikbaia.iig..bba......', '.dad.dkklkikkkg.gib..abb......', '.kkgaba.......aagbdgi..b......', '.la.....af..fa...alkdb.b......', '.b....ac....acf...kg.d........', '..b....fffb.lcja..kiga........', '.....a.jjjb.ljja.g............', '.....gjjjjjjjjj.mgaa..........', '....jjjjjjjjjjj.kg.kiba.......', '....jjjjjjjjjjj.miaaaaa.......', '.....jja.jjjjjj..gkkkkiid.....', '.....djjjjjjjhh...............', '......fjjjjjj.................', '........aa......ablmkgda......', '..............ilmkaa....a.....', '......k.....akkda.digba.......', '....mga..mlmm..g.gdkk...e.....', '....lg..igaag.kgaida.aeeeea...', '....dk..baaakabilg..eeeee.....', '.....gg..gkbmiia..aeeea.......', '..e..bl..glmka...aeeea..kkib..', '.ae..ala.kda...a.eeea..kkkkki.', '.e.....ib....ig.eeea..ikkkkg..', '.e........bgkg..eeea..ikkba...', '.....aaikklkd...eee...bba.....'] },
    ranger: { pal: {'a': '#895042', 'b': '#9ca973', 'c': '#a29378', 'd': '#b16f46', 'e': '#b89277', 'f': '#c03116', 'g': '#c0723e', 'h': '#c8ad94', 'i': '#d68b59', 'j': '#d6bea4', 'k': '#ecbb7e', 'l': '#ecd4af', 'm': '#f3cf9f', 'n': '#f3dbb6', 'S': '#f8f0e0'}, rows: ['..............................', '..............................', '..............................', '....................dd........', '...................g..a.......', '....dd............d.jia.......', '...aa.da.........aaelkga......', '...akm.gd.......gganmmkg......', '...cmmcagd......gahnlmkg......', '...hmmm.gg.....dg.nnmmlg......', '...almmi..abbbbb...eammga.....', '....hma.bbbbbbbbbbb..kkgg.....', '....aaabbbbbbbbaaabbb..ga.....', '.ddd..bbbbbbbbbbbba.bb........', '.....bbbbb......bbba.bb...a...', '......bbb.........bbb..b..aa..', '.....b....hdid.ga...bb........', '.....b.aainikg.dggg..ba.......', '.......agnnkd.aldggg..........', '........innniecnkga.gg........', '......a.mnlnk.cna.dgaggd......', '..S..adailnnlcegghhdca..gS....', '...SSdkdennnlnnmln.hlkiSS.....', '.....SllnnnnnnnnnjlelkSh......', '....alnnlh.ennnnnnnna..a......', '...aSSnnh...cnnnnnnnnmSS......', '..SS..nnl.agknnnnnnnle..SS....', '.......annaihlnnnnha..........', '.........nlnnnnma.............', '...........cca......fffa......', '.......ff........ffffff.......', '.....ffffff...afffffa.........', '.....affffffaagffff...afff....', '........affffa......affff.....', '...ggga...ffffff..affff.......', '...aggag...afffffffffa...aa...', '.addagg.ad...fffffff...dgddd..', '..ad..gd.da....afff....gd.a...', '...a..gd.agaa....a...dga......'] },
    mage: { pal: {'a': '#895042', 'b': '#997171', 'c': '#a25c86', 'd': '#a29378', 'e': '#b89277', 'f': '#c0723e', 'g': '#c8ad94', 'h': '#d68b59', 'i': '#d6bea4', 'j': '#eca359', 'k': '#ecbb7e', 'l': '#ecd4af', 'm': '#f3dbb6', 'n': '#fae1ca'}, rows: ['..............................', '..................baaa........', '.................accccc.......', '................ccccccccc.....', '...............cccccccccca....', '.............accccccccccccc...', '............acccccccc.acccc...', '...........cccccccccaa..accc..', '..........acccccccccca...accc.', '.........cccccccccccca....acc.', '........accccccccccacc......a.', '..............ccccca.b........', '....cccccccccc...accc.........', 'acccccccccccccccc..acca.......', '......cccccccccccca...........', '........acccccccccccc.........', '...........accccccccccc.......', '.......afa...cccccccccccca....', '......aahffa...bccccccccccca..', '......hjjjjhjf....ccccccccca..', '.......hjjjfjj.fa....accccccc.', '.....ajjjjj.a.jjjha.....abcca.', '...hhjjjjjjjjjjjhkkkh.........', '.....fkkkkkkkklmmmmkgh........', '....ammmmmmmmmmlmmmml.hh......', '....dmmmmmmmmmmmmmmmegh.......', '......mmlb.mmmmmmmmlk.........', '........dinmmmmmmga...........', '............flmmh...acccc.....', '........a...lmlf.acccca.......', '........cc......ccca..cccc....', '.....acaaa.gkja.ca..acccccc...', '.....ccca..gjej...cccccaa.....', '.......a.bkdjfaj..a...........', '....ac...ajjjjjj.......acc....', '....cc...aj.ja.j.....cccccca..', '...ac..ca.hajbja..c...cccccca.', '...a..ccca.aff..acccc..ccccc..', '.....cccc........ccaac..cca...'] },
    priest: { pal: {'a': '#895042', 'b': '#a29378', 'c': '#b16f46', 'd': '#b89277', 'e': '#c0723e', 'f': '#c8ad94', 'g': '#d68b59', 'h': '#d6bea4', 'i': '#eca359', 'j': '#ecbb7e', 'k': '#ecd4af', 'l': '#f3cf9f', 'm': '#f3dbb6', 'n': '#fae1ca'}, rows: ['.............knnnma...........', '............annnnna...........', '...........fnjjinna...........', '...........nngginna.....knn...', '..........nnjigknn....annnj...', '..........nnigjnn.....nnlgi...', '.........dnjgiknf....nnjiii...', '.........nnggmnn....nnjgiii...', '.........nkijnna...annggiil...', '........anjgjnj....nnlgginn...', '........anjejh....anleignnn...', '.........nl..hknlfangglnnm....', '..........kknnnnnnnnjmnn......', '.........nnna..nnnnnnna.......', '........hna.....afnnnnda......', '.......nna..agi...nnnnnnn.....', '......fn..alllhacaadnnnnnm....', '......nb.jlllllljja.nnnnnn....', '.....nd...llllf.bjj.bnnknnm...', '....an..a.klllk.n.jj.nnnknn...', '....nl..a.llllb.nljjc.nnfnn...', '....m..ifjllllfamlljicannnn...', '...nf..gaellllllliilji.nnfm...', '...nb.ajlllllllljjjkja.ankh...', '...nd.amklamllllkllh.ga.nnb...', '...dh..kmh.alllllklajja.nna...', '...ak...klagkllllmklll..nnb...', '....mm..amldllllkkg....nnm....', '.....nha..blklklklc...nnnd....', '......fnka...illlh..knmk......', '.......cmmnfa.jlb.knkfknnd....', '.....ahnmmkfka...bfbknnnnnh...', '.....nnnnhnk.faia.amnnfadnn...', '.....kb.......aia.............', '........mjc.aljijja..ahnna....', '......bnkjn.aiiiija.nnkfnnh...', '.....fnhknm...aia...fnnnnnn...', '....ankmnm.ba.aia.ab.dnnnnn...', '....dnknn.hnnh....nnnadnnnn...'] },
    gunner: { pal: {'a': '#4a4a50', 'b': '#a29378', 'c': '#6a6a72', 'd': '#b89277', 'e': '#34343a', 'f': '#7c7c84', 'g': '#c8ad94', 'h': '#9a9aa2', 'i': '#d6bea4', 'j': '#b4b4bc', 'k': '#ecd4af', 'l': '#f3cf9f', 'm': '#f3dbb6', 'n': '#fae1ca', 'A': '#2a2a30', 'C': '#3a3a42', 'E': '#1e1e22', 'F': '#46464e', 'Q': '#5a5a62', 'J': '#70707a', 'o': '#16161a', 'z': '#b39a78'}, rows: ['......................o.......', '...................Coko.......', '.................ACodko.......', '......o.........CFoddko.......', '......ooC......FFokddkC.......', '......ozo...FF...okdkoC.......', '......ozzoCFA.CCC..A.CCA......', '......CzzoF.Al...JJ...........', '.......ozzo.CAmkAAJ..A........', '........FF..Aikgd.J.AJAQA.....', '....gbJC....QAdd.JF...........', '...JdiAJ....AJFFJ...ACFFFFC...', '..A.idCJ......AA.FFFCA........', '..A.ddJE...CCCFdFF............', '...JCAF..CCFFF................', '...QJQ.CFCFC..................', '......ffa.......babaaaa.......', '...afcc.....ad...bbbbbba......', '..acaa.....ab.andabbbbbbd.....', '.cc......dbb...nn.bbbbbbd.....', '.........dddb.anibdbdbdddddd..', '........adbdggkkllkgdikgd.....', '....gbdbblklllmmkmmlmllldd....', '....a..kkkkmmmmmmmmmmkbbdda...', '......blkmmmkmmmmmmmklgbbad...', '.....akmmmmmmammmmmklggdb.....', '......mmmmmlakmmmmmmfb........', '.......iiaaakkmkjkd...........', '........dllmmlgc.....eeeeee...', '...........a......eeeeeeeaa...', '................eeeeeeaa......', '........ee....aeeeeea...eeea..', '........eeeeeeeeeea...eeeeeea.', '.........eeeeeee...aeeeee.....', '......ea.aaeeea...eeeeee......', '....aa.ea..aa...aeeeea....cca.', '...aca..ee....aeeeee....acccc.', '...caa..aee.aaeeeea....acccc..', '...ca....aeeeeeee.....fcfa....'] },
  };
  const COIN_ICON = (() => { const rows = ['.kkkkk.', 'kYWWYYk', 'kWYyYYk', 'kWYyYyk', 'kYYyYyk', 'kYYYyyk', '.kkkkk.'], pal = { k: '#1a1208', Y: '#e3b54a', W: '#fff3b8', y: '#9a6f1c' }; const [c, g] = mkCanvas(7, 7);
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } })); return c.toDataURL(); })(); // 금화 (7×7)
  const PORTRAIT_URL = {}, PORTRAIT_W = {};
  function portraitArt(cls) { if (PORTRAIT_URL[cls]) return PORTRAIT_URL[cls]; const D = PORTRAITS[cls]; if (!D) return ''; const w = Math.max(...D.rows.map(r => r.replace(/\.+$/, '').length)); PORTRAIT_W[cls] = w; const [c, g] = mkCanvas(w, D.rows.length); // 오른쪽 빈 칸은 잘라 칸 오른쪽 끝에 딱 붙게
    const h = D.rows.length, at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && (D.rows[y][x] || '.') === '.', out = new Uint8Array(w * h), st = [];
    for (let x = 0; x < w; x++) st.push([x, 0], [x, h - 1]); for (let y = 0; y < h; y++) st.push([0, y], [w - 1, y]);
    while (st.length) { const [x, y] = st.pop(); if (!at(x, y) || out[y * w + x]) continue; out[y * w + x] = 1; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); } // 바깥 배경만 투명 — 안쪽 검정은 칠해서 뒤가 비치지 않게
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const col = D.pal[D.rows[y][x]]; if (col) g.fillStyle = col; else if (!out[y * w + x]) g.fillStyle = '#0d0a10'; else continue; g.fillRect(x, y, 1, 1); }
    g.fillStyle = '#0b0a0e'; // v2.21 캐릭터 외곽선: 투명 배경 중 그림에 맞닿은 칸을 가장 어두운 색으로
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (out[y * w + x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < w && Y < h && !out[Y * w + X]; })) g.fillRect(x, y, 1, 1);
    return PORTRAIT_URL[cls] = c.toDataURL(); }
  // ---------------------------------------------------------------- 파티 패널 (1~4P · 온라인 구현 전까지 2~4P 및 1P 배지 숨김)
  const ONLINE_PARTY = false;
  function buildParty() {
    const C0 = CLASSES[CUR]; // 초상 없이 이름 · 종족/직업 · 골드 · 하트 · 상태를 한 패널에
    let html = `<div class="slot pf glass" id="p1">
      <div class="pTop"><b class="pName">${C0.name || C0.n}</b><span class="pGold"><img class="px" src="${COIN_ICON}" alt=""><span id="p1gold">0</span><em>G</em></span></div>
      <div class="pSub">${C0.sub || C0.n}</div>
      <div class="hearts1" id="p1hearts"></div>
      <div class="pState"><span class="statusTags" id="p1status"></span><span class="tags" id="p1tags"></span></div>
      <span id="p1hpt" style="display:none"></span></div>`;
    if (ONLINE_PARTY) {
      for (let i = 2; i <= 4; i++) html += `<div class="slot pf glass dim empty" style="height:40px">
        <div class="portrait" style="width:30px;height:30px;flex-basis:30px"><span class="q">?</span><span class="pn">${i}P</span></div>
        <div class="sinfo"><div class="sname"><b>빈 자리</b></div><div class="wait">온라인 합류 대기</div></div></div>`;
    }
    html += `<div class="pf glass" id="p1pal"></div>`; // v2.35 색 팔레트는 캐릭터 패널 아래 따로
    $('party').innerHTML = html; if (typeof renderPal === 'function') renderPal();
    try { hudPrev.gold = null; hudPrev.heart = null; hudPrev.hearts = -1; hudPrev.tags = ''; } catch (e) { /* 처음 불릴 때는 아직 없음 */ } // v2.38 패널을 다시 만들면 골드·하트 표시도 다시 채움 (스테이지 넘어가면 0으로 보이던 문제)
  }
  buildParty();
  function applyClassUI() {
    const C = CLASSES[CUR];
    buildParty();
    $('skK').querySelector('.skn').textContent = C.skill;
    $('skL').querySelector('.skn').textContent = C.awaken;
    const ic = C.icons || (CUR === 'ranger' ? ['dual', 'shadow', 'storm'] : ['atk', 'skill', 'awaken']);
    drawIcon32($('skA').querySelector('canvas'), ic[0]);
    drawIcon32($('skK').querySelector('canvas'), ic[1]);
    drawIcon32($('skL').querySelector('canvas'), ic[2]);
    $('skA').querySelector('.skn').textContent = CUR === 'gunner' ? '사격' : CUR === 'mage' ? '마력탄' : '공격';
    $('skA').classList.remove('cd'); $('skA').classList.add('ready');
    const sw = $('skA').querySelector('.sweep'); if (sw) sw.style.setProperty('--p', '0%');
    const nm = $('skA').querySelector('.num'); if (nm) nm.textContent = '';
    hudPrev.meta = null;
  }

  // ---------------------------------------------------------------- HUD
  const hudPrev = { K: true, L: false, D: true, tags: '', hearts: -1 };
  function setCnt(id, n) { // 횟수 배지: 장비로 횟수가 늘어난 기술에만 남은 횟수 표시
    const ic = $(id).querySelector('.ic'); let b = ic.querySelector('.cnt');
    if (n == null) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.className = 'cnt'; ic.appendChild(b); }
    const t = '×' + n; if (b.textContent !== t) b.textContent = t; b.classList.toggle('zero', n <= 0);
  }
  const SK_META = { ladle: { K: '끓는 수프', Ki: 'soup' } }; // 무기가 기술 자체를 바꾸면 이름·아이콘도 바꾼다
  function skMeta() {
    const key = G.cls + ':' + (wSkill() || ''); if (hudPrev.meta === key) return; hudPrev.meta = key;
    const C = CLASSES[G.cls], m = SK_META[wSkill()] || {}, ic = C.icons || (G.cls === 'ranger' ? ['dual', 'shadow', 'storm'] : ['atk', 'skill', 'awaken']);
    $('skK').querySelector('.skn').textContent = m.K || C.skill; $('skL').querySelector('.skn').textContent = m.L || C.awaken;
    drawIcon32($('skK').querySelector('canvas'), m.Ki || ic[1]); drawIcon32($('skL').querySelector('canvas'), m.Li || ic[2]);
  }
  function popSkill(id) { const el = $(id); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 360); }
  function setSkill(id, ready, cdPct, num) {
    const el = $(id);
    el.classList.toggle('ready', ready); el.classList.toggle('cd', !ready);
    const sw = el.querySelector('.sweep'); if (sw) sw.style.setProperty('--p', `${ready ? 0 : cdPct}%`);
    const n = el.querySelector('.num'); if (n) n.textContent = num;
  }
  const PEEK_IDS = ['party', 'phase', 'bkPanel', 'boss', 'skills'];
  let peekRects = null, peekAge = 0;
  function updatePeek() {
    if (!G) return;
    if (!peekRects || ++peekAge > 30) {
      peekAge = 0;
      const wr = $('wrap').getBoundingClientRect(), sc = wr.width / VW;
      peekRects = PEEK_IDS.map(id => { const el = $(id); if (el.style.display === 'none') return null; const r = el.getBoundingClientRect(); return { id, x0: (r.left - wr.left) / sc, y0: (r.top - wr.top) / sc, x1: (r.right - wr.left) / sc, y1: (r.bottom - wr.top) / sc }; });
    }
    const boxes = [];
    const P = G.player, ox = cam.x, oy = cam.y; boxes.push([P.x - 14 - ox, P.y - 30 - oy, P.x + 14 - ox, P.y + 4 - oy]);
    for (const e of G.enemies) if (!e.dead) { const h = e.tall || (e.type === 'boss' ? 64 : isElite(e) ? 56 : 40), w = e.tall ? e.tall * 0.45 : e.type === 'boss' ? 30 : isElite(e) ? 26 : 14; boxes.push([e.x - w - ox, e.y - h - (e.lift || 0) - oy, e.x + w - ox, e.y + 4 - oy]); }
    for (const r of peekRects) {
      if (!r) continue;
      const hit = boxes.some(b => b[0] < r.x1 && b[2] > r.x0 && b[1] < r.y1 && b[3] > r.y0);
      $(r.id).classList.toggle('peek', hit);
    }
  }

  // 시작맵 인터랙티브 튜토리얼 (로컬 세이브 이력 없을 때만 1회 실행)
  function updateTut(dt) {
    const t = G && G.tut;
    if (!t) return;
    const P = G.player;
    if (t.step === 0) {
      const moving = keys['w'] || keys['a'] || keys['s'] || keys['d'] || (typeof TOUCH !== 'undefined' && TOUCH.on && (Math.abs(TOUCH.mx) > 0.2 || Math.abs(TOUCH.my) > 0.2));
      if (moving) t.moveT += dt;
      if (t.moveT >= 3.0) { t.step = 1; sfx('blip'); }
    } else if (t.step === 1) {
      if (t.atkN >= 3) {
        t.step = 2;
        P.chargeCd = [0, 0, 0, 0];
        sfx('blip');
      }
    } else if (t.step === 2) {
      if (t.skN >= 1) {
        t.step = 3;
        P.gauge = 100; // 각성기 쿨타임/게이지 완충
        sfx('blip');
      }
    } else if (t.step === 3) {
      P.gauge = Math.max(P.gauge, 100);
      if (t.awkN >= 1) {
        t.step = 4;
        P.stam = Math.max(P.stam, 2);
        sfx('blip');
      }
    } else if (t.step === 4) {
      if (t.dashN >= 3) {
        t.step = 5;
        t.doneT = 2.6;
        G.tutDone = true;
        SAVE.tutDone = true;
        if (G.tutSeal) { G.tutSeal = false; sealRoom(false); } // v3.64 튜토리얼 완료 → 통로 열림
        persist();
        sfx('blip');
      }
    } else if (t.step === 5) {
      t.doneT -= dt;
      if (t.doneT <= 0) G.tut = null;
    }
  }

  function renderTutBar(show) {
    let el = document.getElementById('tutBar');
    if (!el) {
      const ui = document.getElementById('ui');
      if (!ui) return;
      el = document.createElement('div');
      el.id = 'tutBar';
      el.style.cssText = 'position:absolute;left:50%;top:58px;transform:translateX(-50%);padding:5px 12px;background:rgba(10,9,14,0.78);border:1px solid rgba(255,211,77,0.35);font:9px Galmuri9;color:#f4ede0;letter-spacing:0.2px;pointer-events:none;white-space:nowrap;z-index:35;transition:opacity 0.25s ease';
      ui.appendChild(el);
    }
    const t = G && G.tut;
    if (!show || mode !== 'play' || !t || G.cine) { el.style.opacity = '0'; return; }
    const isT = typeof TOUCH !== 'undefined' && TOUCH.on;
    const ak = `${Math.min(3, t.atkN)}/3회`;
    const ds = `${Math.min(3, t.dashN)}/3회`;
    const steps = isT ? [
      ['왼쪽 끌기', '이동해보기 (1/5)'],
      ['공격', `기본 공격 3회 — ${ak} (2/5)`],
      ['스킬', '특수기술 사용해보기 (3/5)'],
      ['각성', '각성기 발동해보기 (4/5)'],
      ['점멸', `회피 점멸 3회 — ${ds} (5/5)`],
      ['완료', '튜토리얼 완료 · 붉은 출구로 나아가세요']
    ] : [
      ['WASD', '이동해보기 (1/5)'],
      ['좌클릭', `기본 공격 3회 — ${ak} (2/5)`],
      ['우클릭', '특수기술 사용해보기 (3/5)'],
      ['E', '각성기 발동해보기 (4/5)'],
      ['SPACE', `회피 점멸 3회 — ${ds} (5/5)`],
      ['완료', '튜토리얼 완료 · 출구로 나아가세요 · 전체 조작 <span class="key kc">H</span>']
    ];
    const [k, msg] = steps[t.step] || steps[5];
    const kCol = t.step === 5 ? '#9ee88a' : '#ffd34d';
    el.innerHTML = (t.step === 5 ? `<span style="display:inline-block;padding:1px 5px;margin-right:7px;border:1px solid ${kCol};color:${kCol};font:8px Galmuri7">${k}</span>` : `<span class="key" style="margin-right:7px">${k}</span>`) + `<span>${msg}</span>`; // v2.63 키는 키캡 · 완료는 상태 표시
    el.style.opacity = '1';
  }

  // 조작 안내 (화면 위쪽)
  function keyGuideHTML() {
    const C0 = CL(), M0 = (G && SK_META[wSkill()]) || {}, C = { skill: M0.K || C0.skill, awaken: M0.L || C0.awaken }, k = (key, t) => `<span class="ki"><span class="key">${key}</span>${t}</span>`;
    if (typeof TOUCH !== 'undefined' && TOUCH.on) return `<div class="kt">터치 조작</div>
      <div class="kr">${k('왼쪽 끌기', '이동')}${k('공격', '가까운 적 자동 조준')}${k('스킬', C.skill)}${G && G.cls === 'priest' ? '' : k('각성', C.awaken)}${k('점멸', '회피')}</div>
      <div class="kr">${k('F', '상호작용')}${k('지도', '방 지도·순간이동')}${k('가방', '장비')}${k('❚❚', '일시정지')}</div>
      <div class="kh">적의 공격 직전에 점멸하면 퍼펙트 회피가 됩니다. 화면을 탭하면 그쪽으로 공격합니다.</div>`;
    return `<div class="kt">조작 안내</div>
      <div class="kr">${k('WASD', '이동')}${k('좌클릭', '공격')}${k('우클릭', C.skill)}${G && G.cls === 'priest' ? '' : k('E', C.awaken)}${k('SPACE', '점멸')}</div>
      <div class="kr">${k('F', '상호작용')}${k('TAB', '지도')}${k('I', '장비')}${k('1~3', '무기')}${k('ESC', '일시정지')}${k('M', '음악')}</div>
      <div class="kh">적의 공격 직전에 점멸하면 퍼펙트 회피가 됩니다. H 키로 이 안내를 열고 닫습니다.</div>`;
  }
  // v2.00 하트·방패 아이콘 (도트 7칸, 2배)
  const HEART_MAPS = {
    full: ['.kk.kk.', 'kWrkrrk', 'krrrrRk', '.krrRk.', '..kRk..', '...k...'],
    pfull: ['.kk.kk.', 'kVgkggk', 'kggggGk', '.kggGk.', '..kGk..', '...k...'], // v2.50 중독 하트
    phalf: ['.kk.kk.', 'kVgkeek', 'kggeeEk', '.kgeEk.', '..kEk..', '...k...'],
    half: ['.kk.kk.', 'kWrkeek', 'krreeEk', '.kreEk.', '..kEk..', '...k...'],
    empty: ['.kk.kk.', 'keekeek', 'keeeeEk', '.keeEk.', '..kEk..', '...k...'],
    armor: ['kkkkkkk', 'kWnnnmk', 'knnYnmk', 'knYYYmk', '.knYmk.', '..kmk..', '...k...'],
    holy: ['..kkk..', '.kYoYk.', 'kYwwwok', 'kowLwok', 'kYwwwok', '.kooYk.', '..kkk..'], // v2.19 사제 빛의 가호 — 빛 구슬
  };
  const HEART_PAL = { g: '#6cc040', G: '#2e6a1a', V: '#d8ffb0', o: '#c9952a', w: '#fff3b8', L: '#ffffff', k: '#0e0a0c', W: '#ffd0d0', r: '#e0303a', R: '#8a1020', e: '#3a2a30', E: '#241a1e', n: '#c8d8e0', m: '#7a8898', Y: '#ffd34d' };
  const HEART_URL = {};
  const heartURL = k => HEART_URL[k] || (HEART_URL[k] = (() => { const m = HEART_MAPS[k], [c, g] = mkCanvas(m[0].length * 2, m.length * 2); m.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = HEART_PAL[ch]; g.fillRect(x * 2, y * 2, 2, 2); })); return c.toDataURL(); })());
  function heartsHTML(hp, max, armor, holy = 0, poison = false) {
    let h = ''; const n = Math.ceil(max / 2), top = Math.ceil(hp / 2) - 1; // 중독이면 맨 위(다음에 깎일) 하트가 초록
    for (let i = 0; i < n; i++) { const v = hp - i * 2, pz = poison && i === top; h += `<img class="px" src="${heartURL(v >= 2 ? (pz ? 'pfull' : 'full') : v === 1 ? (pz ? 'phalf' : 'half') : 'empty')}">`; }
    for (let i = 0; i < armor; i++) h += `<img class="px ar" src="${heartURL(i >= armor - holy ? 'holy' : 'armor')}">`;
    return h;
  }
  // v3.10 식사 효과 아이콘 칩 (9×9칸): 공격력 칼 · 이동 속도 장화 · 최대 체력 하트 · 점멸 충전 깃털 · 쿨타임 모래시계
  const MEAL_ICON = {"atk":["....k....","...kWk...","...kWk...","...kWk...","..kkwkk..",".kYYYyyk.","..kkBkk..","...kYk...","....k...."],"spd":["...kkk...",".kkLLLk..","kSkLMDk..",".kkLMDk..","kSkLMDkk.",".kkLMMMDk","..kDDDDDk","...kkkkk.","........."],"hp":["..kk.kk..",".kHHkHHk.","kHhHHHHHk","kHHHHHHdk",".kHHHHdk.","..kHHdk..","...kdk...","....k....","........."],"stam":[".....kkk.","....kFFfk","...kFFqfk","..kFFqffk","..kFqffk.","..kqffk..",".kqkkk...","kqk......",".k......."],"cd":[".kkkkkkk.","kOOOOOOOk",".kGGYGGk.","..kGYGk..","...kYk...","..kGYGk..",".kYYYYYk.","koooooook",".kkkkkkk."]}, MEAL_IPAL = {"k":"#0b0a0e","W":"#f4f0e8","w":"#b8b4c0","Y":"#f2c84a","y":"#b88a28","B":"#7a4a2a","L":"#9ad8f0","M":"#5aa8d8","D":"#2e6a9a","S":"#bfe8ff","H":"#ff4a5a","h":"#ffb8c0","d":"#b02838","F":"#ece0ff","f":"#a890d8","q":"#6a5aa0","O":"#c08a4a","o":"#8a5a2a","G":"#8ac8e0"};
  const MEAL_C = { atk: '#ff7a4a', spd: '#7ad0ff', hp: '#ff5a6a', stam: '#b8a0f0', cd: '#f2c84a' }, MEAL_URL = {};
  const buffIconURL = k => MEAL_URL[k] || (MEAL_URL[k] = (() => { const m = MEAL_ICON[k] || MEAL_ICON.atk, [c, g] = mkCanvas(18, 18); m.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = MEAL_IPAL[ch]; g.fillRect(x * 2, y * 2, 2, 2); })); return c.toDataURL(); })());
  function hud() {
    const show = !!G && !['title', 'select', 'forge'].includes(mode);
    ['party', 'phase', 'skills'].forEach(id => { $(id).style.display = show && mode !== 'map' && mode !== 'wmap' ? '' : 'none'; });
    { const kgOn = show && mode === 'play' && G && G.kg; if (kgOn && G.kgCls !== G.cls) { $('keyguide').innerHTML = keyGuideHTML(); G.kgCls = G.cls; } $('keyguide').style.opacity = kgOn ? 1 : 0; }
    renderTutBar(show);
    $('mute').innerHTML = '<span class="key">M</span> ' + (window.AudioSys.st.muted ? '음악 켜기' : '음악 끄기'); // v2.63 키캡
    if (!show) { $('boss').style.display = 'none'; return; }
    const P = G.player, s = G.stats;
    // 1P
    { const pz = P.poisonT > 0 && !(P.poisonT < 2 && Math.floor(time * 6) % 2), key = P.hp + '/' + s.hp + '/' + (P.armor || 0) + '/' + (P.holyArmor || 0) + '/' + pz; if (hudPrev.heart !== key) { hudPrev.heart = key; $('p1hearts').innerHTML = heartsHTML(P.hp, s.hp, P.armor || 0, Math.min(P.armor || 0, P.holyArmor || 0), pz); /* v2.50 중독이 풀리기 전 2초는 깜빡임 */ $('p1hpt').textContent = ''; } } // v2.00 하트
    if (hudPrev.gold !== G.gold) { hudPrev.gold = G.gold; $('p1gold').textContent = G.gold; }
    $('p1').classList.toggle('dead', P.dead);
    $('p1').classList.toggle('hurt', P.hurtT > 0);
    const relicTags = (G.relics || []).map(k => `<span class="tag relicTag relicRow" style="--c:${RELICS[k].c}" data-name="${RELICS[k].n}" data-tip="${RELICS[k].d}"><img class="px" src="${relicIconURL(k)}"></span>`).join(''); /* 유물은 하트 아래, 이름에 마우스를 올리면 설명 */
    const statusTags = (P.awakenT > 0 || P.state === 'awaken' ? '<span class="tag aw">각성</span>' : '') + (P.state === 'storm' ? '<span class="tag aw">폭풍</span>' : '') + (P.poisonT > 0 ? '<span class="tag" style="background:#4a2060;color:#d8b0ff">중독</span>' : '') + BDC.tags() + G.buffs.map(b => `<span class="tag relicTag relicRow buffTag" style="--c:${MEAL_C[b]}" data-name="${BISTRO.dishName(b) || BUFFS[b].n}" data-tip="${BUFFS[b].d}"><img class="px" src="${buffIconURL(b)}"></span>`).join(''); // v3.10 잠깐 걸리는 상태는 글자 칩 · 식사 효과는 아이콘 칩 (마우스를 올리면 설명)
    /* 유물은 패널에 표시하지 않음 (장비창에서 확인) */
    if (statusTags !== hudPrev.status) { $('p1status').innerHTML = statusTags; hudPrev.status = statusTags; }
    // 페이즈
    { const R = G.dun && G.dun.cur, rs = G.rs || {};
      $('phaseText').textContent = R ? roomName(R.type) : ''; // v3.19 방 이름 앞의 장 번호 삭제 (바로 아래 줄에 몇 장인지 이미 적혀 있음)
      { const n = R && R.type === 'den' ? 14 : $('phaseText').textContent.length; /* v3.17 안전 놀이터 이름도 한 줄로 */ $('phaseText').style.letterSpacing = n >= 14 ? '0' : ''; $('phaseText').style.whiteSpace = n >= 14 ? 'nowrap' : ''; $('phaseText').style.fontSize = n >= 14 ? '10px' : ''; } // v3.10 긴 장소 이름은 한 줄로 (기록 보관소 지하 · 출장 비스트로)
      let sub = ''; // v2.51 방 모양·봉인 글자는 빼고, 전투 중일 때만 남은 적 (보스 문 열쇠는 따로 #bkPanel)
      if (R && R.type === 'survive' && rs.state === 'run') { const left = SURV_PT() - (rs.phT || 0), al = G.enemies.filter(e => !e.dead).length; sub = rs.ph >= SURV_N - 1 && left <= 0 ? `남은 적 ${al}` : `남은 시간 ${Math.max(0, Math.ceil(left))}초`; }
      else if (R && R.waves && (rs.state === 'run' || rs.state === 'intro')) sub = `남은 적 ${G.enemies.filter(e => !e.dead).length + G.spawning}`;
      if (sub !== hudPrev.phSub) { hudPrev.phSub = sub; $('phaseSub').textContent = sub; }
      updateBossKeys(); }
    { const R0 = G.dun && G.dun.cur; if (R0 && R0.type === 'archive') { const k = 'arch' + R0.fl; if (hudPrev.hearts !== k) { hudPrev.hearts = k; $('hearts').innerHTML = `<span class="f7" style="color:var(--quiet)">${ARCH.floorSub()}</span>`; } } } // v3.00
    if (!(G.dun && G.dun.cur && G.dun.cur.type === 'archive') && hudPrev.hearts !== G.stage) { hudPrev.hearts = G.stage; $('hearts').innerHTML = `<span class="f7" style="color:var(--quiet)">STAGE ${G.stage} · ${STG().n}${G.asc ? ` · <b style="color:#ffb040">잿불 ${G.asc}</b>` : ''}</span>`; }
    // 스킬: 공격 콤보 단계
    const step = G.cls === 'mage' ? (P.boltN || 0) % 3 : G.cls === 'gunner' ? (P.reload > 0 ? 0 : 3) : P.state === 'attack' ? P.combo + 1 : P.comboWin > 0 ? P.combo : 0;
    if (G.cls === 'gunner') setCnt('skA', gunMag() !== GUN_MAG ? P.ammo : null); else setCnt('skA', null);
    if (G.cls === 'gunner') setSkill('skA', P.reload <= 0 && P.ammo > 0 && !P.dead, (P.reload / (P.reloadMax || GUN_RELOAD)) * 100, '');
    $('comboPips').style.display = G.cls === 'gunner' ? 'none' : ''; // 거너 사격 칸에는 연타 단계 칸이 필요 없음
    $('comboPips').querySelectorAll('b').forEach((b, i) => b.classList.toggle('on', i < step));
    // 돌진 참격
    const charges = skMax('K'), total = Math.max(1, skCdBase() * (1 - s.cdr) * (1 - pasV('kcd')) - (uncK() === 'priest13' ? 1 : 0));
    const readyN = P.chargeCd.slice(0, charges).filter(c => c <= 0).length;
    const minCd = Math.min(...P.chargeCd.slice(0, charges));
    const kReady = readyN > 0 && !P.dead;
    if (kReady && P.gcd > 0) setSkill('skK', false, P.gcd / SWAP_GCD * 100, ''); // v3.22 무기 바꾼 직후 0.4초 공용 쿨타임이 한 바퀴 돎
    else setSkill('skK', kReady, (minCd / total) * 100, kReady ? '' : Math.ceil(minCd));
    setCnt('skK', charges > 1 ? readyN : null);
    if (kReady && !hudPrev.K) { popSkill('skK'); sfx('ready'); }
    hudPrev.K = kReady;
    // 각성
    const lReady = P.gauge >= 100 && !P.dead;
    setSkill('skL', lReady, 0, lReady ? '' : `${Math.floor(P.gauge)}`);
    $('skL').classList.toggle('awake', lReady);
    $('skL').querySelector('.fill').style.setProperty('--f', `${lReady ? 0 : P.gauge}%`);
    $('skL').querySelector('.ic').style.setProperty('--rot', `${(time * 120) % 360}deg`);
    $('skL').querySelector('.num').style.fontSize = lReady ? '' : '8px';
    if (lReady && !hudPrev.L) { popSkill('skL'); sfx('ready'); }
    hudPrev.L = lReady;
    // 점멸
    const dReady = P.stam > 0 && !P.dead;
    setSkill('skD', dReady, (1 - P.stamT / 1.5) * 100, '');
    const dMax = skMax('D'); if ($('skD').querySelectorAll('.pips b').length !== Math.min(dMax, 4)) $('skD').querySelector('.pips').innerHTML = '<b></b>'.repeat(Math.min(dMax, 4));
    $('skD').querySelectorAll('.pips b').forEach((b, i) => b.classList.toggle('on', i < P.stam)); setCnt('skD', dMax > 2 ? P.stam : null);
    skMeta();
    if (dReady && !hudPrev.D) popSkill('skD');
    hudPrev.D = dReady;
    // 보스
    const b0 = G.boss, b = b0 && b0.kind === 'krugash' && b0.freed && b0.kg && (b0.kg.ph === 'wait' || b0.kg.ph === 'talk') ? null : b0; // v3.80 저주가 풀린 크루가쉬: 대화가 끝나고 결투가 시작될 때 이름 · 체력 막대가 뜸
    $('boss').style.display = b ? 'block' : 'none';
    if (b) {
      b.hpBack = b.hpBack == null ? b.hp : b.hpBack + (b.hp - b.hpBack) * 0.06;
      $('bossfill').style.width = `${clamp(b.hp / b.maxHp, 0, 1) * 100}%`;
      $('bossback').style.width = `${clamp(b.hpBack / b.maxHp, 0, 1) * 100}%`;
      $('grogifill').style.width = `${!b.grogiMax ? 0 : b.grogiT > 0 ? (b.grogiT / 5) * 100 : (b.grogi / b.grogiMax) * 100}%`;
      $('bossTime').textContent = b.dead ? '처치' : b.kind === 'cultlead' ? (b.barTxt || '') : b.type === 'anc' ? b.duelTxt /* v2.84 */ : `남은 시간 ${Math.floor(Math.max(0, G.bossTime) / 60)}:${String(Math.floor(Math.max(0, G.bossTime) % 60)).padStart(2, '0')}`;
      $('bossStage').textContent = b.dead ? '' : b.kind === 'cultlead' ? (b.stageTxt || '') : b.type === 'anc' ? b.title : b.grogiT > 0 ? '그로기!' : b.kind === 'ashking' ? ['재의 왕', '대관식', b.fell ? '몰락' : '타오르는 왕'][b.stage - 1] : b.stage === 3 ? (b.kind === 'slimeking' ? '폭주' : b.kind === 'krugash' ? '피의 광란' : '광폭화') : b.armorMul && b.armorMul < 1 ? '2단계 · 북의 가호' : `${b.stage}단계`;
      $('shieldtag').style.display = b.shield && !b.dead && b.kind !== 'cultlead' ? 'inline' : 'none'; /* v3.53 교주는 보호막 설명 없음 (팅팅 소리로 알림) */
    }
  }

  // ---------------------------------------------------------------- 메뉴 (키보드·마우스)
  let titlePanel = 'main', resetArmed = false;
  function menuBox() {
    if (mode === 'title') return $(titlePanel === 'main' ? 'tmMain' : titlePanel === 'howto' ? 'tmHowto' : 'tmSound');
    if (mode === 'pause') return $('pmMenu');
    return null;
  }
  function menuItems() { const box = menuBox(); return box ? [...box.querySelectorAll('.mi')] : []; }
  function moveSel(d) {
    const items = menuItems(); if (!items.length) return;
    let i = items.findIndex(x => x.classList.contains('sel'));
    i = (i + d + items.length) % items.length;
    items.forEach((x, k) => x.classList.toggle('sel', k === i)); sfx('blip');
  }
  // v2.19 공용 팝업 (조작법 · 사운드) — 타이틀·일시정지에서 같은 크기로
  let popOpen = null;
  function openPop(name) { popOpen = name; syncVol(); $('tmHowto').classList.toggle('on', name === 'howto'); $('tmSound').classList.toggle('on', name === 'sound'); $('tmArchive').classList.toggle('on', name === 'archive'); $('ovPop').querySelector('.popWin').classList.toggle('arc', name === 'archive'); if (name === 'archive') renderArchive(); $('ovPop').classList.add('on'); }
  let arcTab = 'relic';
  function arcWeaponCell(c, i) { // v2.30 기록 보관소 무기 칸 · v2.31 해금 조건·진행도
    const W0 = wcat(c)[i], u = UNLOCKS.find(x => x.kind === 'w' && x.key === c + ':' + i), l10 = i === 10 && !leg2Open(c), lock = l10 || (u && !unlocked(u.id));
    const g = isUnc({ slot: 'weapon', wk: i }) ? UNCOMMON : GRADES.find(x => x.k === W0.grade), sk = W0.skill && W0.skill !== '—' ? stripEmoji(W0.skill) : '고유 기술 없음';
    const cur = u ? Math.min(u.n, SAVE.rec[u.rec] || 0) : 0, cond = l10 ? `${({ knight: '기사로', ranger: '암살자로', mage: '마법사로', priest: '사제로', gunner: '거너로' })[c]} 4장 보스를 처치하면 열립니다.` : u ? (u.s || u.how) : '';
    const sub = l10 ? '4장 보스 클리어' : lock ? `${u.how} ${cur}/${u.n}` : (u || i === 10) ? '해금됨' : '기본';
    return `<div class="arcC${lock ? ' lock' : ''}" ${aTip(lock ? '???' : W0.name, lock ? cond : `<span style="color:${g.c}">${g.n}</span> · ${sk}`, lock ? '#9a8ea5' : g.c)}><img src="${weaponIconURL({ slot: 'weapon', cls: c, wk: i, grade: W0.grade })}"><span><span class="an" style="color:${lock ? '#8a8494' : g.c}">${lock ? '???' : W0.name}</span><span class="ac">${sub}</span>${lock && u ? `<span class="bar"><b style="width:${Math.round(cur / u.n * 100)}%"></b></span>` : ''}</span></div>`;
  }
  const TRUTH_ARC = [ // v2.58 기록 보관소 「진실」 — 내용은 11d_truth.js와 같게
    { k: 't1', no: '구덩이 실험실', title: '키륵의 연구 일지', c: '#7ad050', hint: '초록 자국은 어디서 왔을까요.', paras: ['셋째 배양체 관찰. 동화 속도가 공급량을 상회하여 기아에 이르는 시간이 현저히 단축됨. 유기물과 무기물을 가리지 않는 무차별 포식성 확인.',  '조각 주변의 채도가 점진적으로 감쇠함. 흡수라기보다 전송의 양상. 소실된 색의 수신처는 미상.', '본인은 조각의 보존을 최우선 과제로 상정하고 있음. 그 근거를 기술하고자 하였으나 전제가 성립하지 않음.', '제단으로의 이송이 필연이라는 확신이 존재함. 확신의 출처 불명. 재검토 필요.', '재검토 결과. 보존해야 함. 이송해야 함. 확신 출처 불명. 재검토 필요.', '재검토 결과. 보존해야 함. 이송해야 함. 확신 출처 불명. 재검토 필요.', '재검토 결과. 보존해야 함. 이송해야 함. 확신 출처 불명. 재검토 필요.', '재검토 결과. 보존해야 함. 이송해야 함. 확신 출처 불명. 재검토 필요.', '재검토 결과. 보존해야 함. 이송해야 함. 확신 출처 불명. 재검토 필요.', '재검토 결과. 보존해야 함. 이송해야 함. 확신 출처 불명. 재검토 필요.'] }, // v3.78 일지 문구 (1장 끝 한 번 + 2장에 다섯 번)
    { k: 't2', no: '기사단 밀실', title: '바닥에 새겨진 주문', c: '#b070ff', hint: '흩어진 서약을 이어 보세요.', paras: ['기사단장 발도르여,', '{해}가 뜨지 않는 한, 너는 눕지 못하리라.', '빈 자리를 지키는 자여, 네 이름은 그 자리에 묶이리라.', '왕관이 돌아올 때마다 너는 다시 눈을 뜨리라.', '재가 되어도, 서약은 재가 되지 않으리라.'] },
    { k: 't3', no: '핏빛 엄니 부락', title: '크루가쉬의 마지막 말', c: '#ff6a50', hint: '피로 그린 원을 찾아보세요.', paras: ['"왕관은 {해}에 의해 정화되어야 한다…"', '"왕관의 주인은 {해}가 비치는 곳에…"', '말을 끝맺지 못한 채 크루가쉬는 무릎을 꿇었고, 다시는 일어나지 않았다.'] },
  ];
  function renderArchive() { // v2.29 기록 보관소 · v2.30 탭: 유물 / 직업별 무기
    const fmt = n => n >= 1000 ? n.toLocaleString() : n, CL5 = ['knight', 'ranger', 'mage', 'priest', 'gunner'];
    const tabs = `<div class="arcTabs">${[['relic', '유물'], ...CL5.map(c => [c, CLASSES[c].n]), ['truth', '진실']].map(([k, n]) => `<button class="arcTab${arcTab === k ? ' on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>`;
    let body = '';
    if (arcTab === 'relic') {
      const cell = k => { const r = RELICS[k], u = UNLOCKS.find(x => x.kind === 'r' && x.key === k), lock = u && !unlocked(u.id), cur = u ? Math.min(u.n, SAVE.rec[u.rec] || 0) : 0;
        const sub = !u ? '기본' : lock ? `${u.how} ${fmt(cur)}/${fmt(u.n)}` : '해금됨';
        return `<div class="arcC${lock ? ' lock' : ''}" ${aTip(lock ? '???' : r.n, lock ? (u.s || `${u.how} ${fmt(u.n)}`) : r.d, lock ? '#9a8ea5' : r.c)}><img src="${relicIconURL(k)}"><span><span class="an">${lock ? '???' : r.n}</span><span class="ac">${sub}</span>${lock ? `<span class="bar"><b style="width:${Math.round(cur / u.n * 100)}%"></b></span>` : ''}</span></div>`; };
      const keys = Object.keys(RELICS), base = keys.filter(k => !UNLOCKS.some(u => u.key === k) && !RELICS[k].den), ext = keys.filter(k => UNLOCKS.some(u => u.key === k)), got = ext.filter(k => !relicLocked(k)).length;
      body = `<div class="arcH">해금 유물<i>${got} / ${ext.length}</i></div><div class="arcGrid">${ext.map(cell).join('')}</div>`
        + `<div class="arcH">기본 유물<i>${base.length}</i></div><div class="arcGrid">${base.map(cell).join('')}</div>`;
    } else if (arcTab === 'truth') { // v2.58 진엔딩 단서: 진실 기록 3칸 (얻기 전엔 잠긴 칸 + 짧은 힌트)
      const T = SAVE.truth || {}, got = ['t1', 't2', 't3'].filter(k => T[k]).length;
      body = `<div class="arcH">진실<i>${got} / 3</i></div><div class="arcTruth">` + TRUTH_ARC.map(t => T[t.k]
        ? `<div class="arcTr"><div class="arcTrH" style="color:${t.c}">${t.no} · ${t.title}</div>${t.paras.map(p => `<p>${String(p).replace(/\{([^}]*)\}/g, '<span class="parchHL">$1</span>')}</p>`).join('')}</div>`
        : `<div class="arcTr lock"><div class="arcTrH">잠긴 기록</div><p>${t.hint}</p></div>`).join('') + '</div>';
    } else {
      const c = arcTab, W = wcat(c), sec = (t, ids) => ids.length ? `<div class="arcH">${t}<i>${ids.filter(i => !(i === 10 && !leg2Open(c)) && !weaponLocked(c, i)).length} / ${ids.length}</i></div><div class="arcGrid">${ids.map(i => arcWeaponCell(c, i)).join('')}</div>` : '';
      const by = g => W.filter(w => w.grade === g && !isUnc({ slot: 'weapon', wk: w.i }) && w.i !== 0).map(w => w.i);
      body = sec('커먼', [0]) + sec('언커먼', [11, 12, 13]) + sec('레어', by('rare')) + sec('유니크', by('unique')) + sec('레전더리', [9, 10]) + `<div class="arcH">추가 무기<i>준비 중</i></div>`;
    }
    $('arcList').innerHTML = tabs + body;
    $('arcList').querySelectorAll('.arcTab').forEach(b => b.addEventListener('click', () => { arcTab = b.dataset.t; sfx('blip'); renderArchive(); $('arcList').scrollTop = 0; }));
  }
  function closePop() { if (!popOpen) return; popOpen = null; $('ovPop').classList.remove('on'); $('tmHowto').classList.remove('on'); $('tmSound').classList.remove('on'); $('tmArchive').classList.remove('on'); pxTip.hide(); sfx('blip'); ARCH.closed(); }
  function showTitlePanel(name) {
    titlePanel = name;
    $('tmMain').style.display = name === 'main' ? '' : 'none';
    resetArmed = false; $('tmMain').querySelector('[data-act="reset"]').textContent = '저장 초기화';
  }
  function activate(btn) {
    const act = btn.dataset.act;
    initAudio();
    sfx('select');
    if (act === 'start') openSelect();
    else if (act === 'forge') openForge('title');
    else if (act === 'howto') openPop('howto');
    else if (act === 'archive') ARCH.fromTitle(); // v3.00 팝업 대신 코코아의 기록 보관소로 걸어 들어감
    else if (act === 'sound') openPop('sound');
    else if (act === 'popClose') closePop();
    else if (act === 'back') showTitlePanel('main');
    else if (act === 'reset') {
      if (!resetArmed) { resetArmed = true; btn.textContent = '정말 지우시겠습니까? 한 번 더 선택하면 지워집니다'; }
      else { SAVE = blankSave(); persist(); try { sessionStorage.setItem('acr_reset_done', '1'); } catch (e) { /* 무시 */ } location.reload(); } // v2.86 불러오기 때 채우는 저장 항목(weaponRolls 등)까지 다시 갖추도록 새로 불러옴 — 초기화 직후 출정하면 멈추던 문제
    }
    else if (act === 'resume') resume();
    else if (act === 'inv') openInv('pause');
    else if (act === 'quit') { $('ovPause').classList.remove('on'); showResult(false, true); }
  }
  document.querySelectorAll('.mi').forEach(btn => {
    btn.addEventListener('mouseenter', () => { btn.parentElement.querySelectorAll('.mi').forEach(x => x.classList.toggle('sel', x === btn)); });
    btn.addEventListener('click', () => activate(btn));
  });
  // 볼륨 슬라이더 (타이틀·일시정지 공용)
  function syncVol() {
    const st = window.AudioSys.st;
    document.querySelectorAll('.volBgm').forEach(el => { el.value = Math.round(st.bgm * 100); });
    document.querySelectorAll('.volSfx').forEach(el => { el.value = Math.round(st.sfx * 100); });
    document.querySelectorAll('.volBgmV').forEach(el => { el.textContent = Math.round(st.bgm * 100); });
    document.querySelectorAll('.volSfxV').forEach(el => { el.textContent = Math.round(st.sfx * 100); });
  }
  document.querySelectorAll('.volBgm').forEach(el => el.addEventListener('input', () => { initAudio(); window.AudioSys.setVolume('bgm', el.value / 100); syncVol(); }));
  document.querySelectorAll('.volSfx').forEach(el => el.addEventListener('input', () => { initAudio(); window.AudioSys.setVolume('sfx', el.value / 100); syncVol(); sfx('blip'); }));
  syncVol();

  function titleMats() {
    const b = SAVE.best || 0, bst = Math.floor((b - 1) / 11) + 1, bp = b - (bst - 1) * 11, bs = b ? `STAGE ${bst} · ${bp === 11 ? 'BOSS' : 'PHASE ' + bp}` : '없음';
    if ($('titleInfo')) $('titleInfo').innerHTML = `원정 완료 <b>${SAVE.clears}</b>${SAVE.clears3 ? ` (오크 부락 <b>${SAVE.clears3}</b>)` : ''} / 시도 <b>${SAVE.runs}</b> · 최고 도달 <b>${bs}</b><br>로그라이크 — 장비·재료는 한 번의 원정 동안만 유지되며, 쓰러지면 모두 잃습니다`;
  }
  function start() {
    ['ovTitle', 'ovResult', 'ovPause', 'ovRest', 'ovSelect', 'ovForge', 'ovInv'].forEach(id => $(id).classList.remove('on'));
    initAudio(); sfx('select');
    applyClassUI();
    for (const k in pressed) pressed[k] = false;
    HOME.again = mode === 'result'; // v2.55 원정 다시 떠나기: 시작 장소에서 선 채로
    newRun();
    mode = G.wm ? 'wmap' : 'play'; // v1.69 챕터 시작 월드맵
  }
  function toTitle() {
    ['ovResult', 'ovPause', 'ovRest', 'ovInv'].forEach(id => $(id).classList.remove('on'));
    G = null; mode = 'title'; titleMats(); showTitlePanel('main'); $('ovTitle').classList.add('on');
    { const bk = $('bkPanel'); if (bk) bk.style.display = 'none'; hudPrev.bk = ''; } // v3.18 원정을 끝내고 타이틀로 오면 보스 문 열쇠 패널이 남지 않게
    window.AudioSys.setMood('title', true);
  }
  function openPause() { mode = 'pause'; syncVol(); $('ovPause').classList.add('on'); sfx('blip'); }
  function resume() { $('ovPause').classList.remove('on'); for (const k in pressed) pressed[k] = false; mode = 'play'; }
  $('btnAgain').addEventListener('click', start);
  $('btnTitle').addEventListener('click', toTitle);
  $('btnArch').addEventListener('click', () => ARCH.fromResult()); // v3.00
  $('btnInv').addEventListener('click', () => { resultShowAll = !resultShowAll; sfx('blip'); renderResultItems(resultWin); });
  addEventListener('keydown', e => {
    const k = keyName(e);
    if (k === 'm' || k === 'M') { initAudio(); window.AudioSys.toggleMute(); return; }
    if (popOpen) { if (k === 'Escape' || k === 'Enter') { e.preventDefault(); closePop(); } return; } // v2.19 팝업이 떠 있으면 닫기만
    if (mode === 'inv') { if (invKey(k)) e.preventDefault(); return; }
    if (mode === 'pause' && (k === 'i' || k === 'I')) { openInv('pause'); return; }
    if (mode === 'title' || mode === 'pause') {
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); moveSel(-1); }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); moveSel(1); }
      else if (k === 'Enter' || k === ' ' || k === 'j' || k === 'J') { e.preventDefault(); const it = menuItems().find(x => x.classList.contains('sel')); if (it) activate(it); }
      else if (k === 'Escape') { if (mode === 'pause') resume(); else if (titlePanel !== 'main') showTitlePanel('main'); }
    } else if (mode === 'result' && k === 'Enter') start();
    else if (mode === 'select') {
      if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'ArrowRight' || k === 'd' || k === 'D') { const ks = Object.keys(CLASSES), d = (k === 'ArrowLeft' || k === 'a' || k === 'A') ? -1 : 1; selCls = ks[(ks.indexOf(selCls) + d + ks.length) % ks.length]; sfx('blip'); renderSelect(); }
      else if (k === 'Enter' || k === ' ' || k === 'j' || k === 'J') { e.preventDefault(); chooseClass(selCls); }
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); ascShift(1); }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); ascShift(-1); }
      else if (k === 'Escape') closeSelect();
    } else if (mode === 'forge') {
      if (k === 'Escape') closeForge();
      else if (k === 'Enter') { e.preventDefault(); doEnhance(); }
      else if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'w' || k === 'W' || k === 's' || k === 'S') {
        e.preventDefault();
        const list = forgeList(), i = list.findIndex(x => x.id === forgeSel), d = (k === 'ArrowUp' || k === 'w' || k === 'W') ? -1 : 1;
        if (list.length) { forgeSel = list[(i + d + list.length) % list.length].id; forgeMsg = null; sfx('blip'); renderForge(); }
      }
    }
    else if (mode === 'rest' && ['1', '2', '3'].includes(k)) { const b = $('restChoices').children[+k - 1]; if (b) b.click(); }
    else if (mode === 'eng' && ['1', '2', '3'].includes(k)) { const b = $('engChoices').children[+k - 1]; if (b) b.click(); }
    else if (mode === 'shrine') { if (['1', '2', '3'].includes(k)) { const b = $('engChoices').children[+k - 1]; if (b) b.click(); } else if (k === 'Escape') SHRINE.close(); } // v3.25 빛의 샘
  });

  // ---------------------------------------------------------------- 장비 · 인벤토리 (v0.52)
  // 장비 아이콘: 캐릭터와 같은 2px 칸 도트 (검은 외곽선, 왼쪽 위 빛, 등급색 포인트)
  const ITEM_ICON = {
    helm: ['....hhhh....', '..hhllllld..', '.hllggggldd.', '.hlllllllld.', 'hllllllllldd', 'hlDDDDDDDDld', 'hllDllDlDldd', 'hllllllllldd', '.hllllllldd.', '.hld....ldd.', '.hd......dd.'],
    armor: ['..hh....dd..', '.hllh..dlld.', 'hllllhhllldd', 'hlllggggllld', 'hllllggllldd', '.hllllllldd.', '.hlllllllld.', '.hllDDDDlld.', '.hlllllllld.', '..hlllllld..', '..ggggggGG..'],
    boots: ['..hhhh......', '..hlld......', '..hlld......', '..hlld......', '..ggGG......', '..hlld......', '..hllldd....', '..hllllllld.', '..hlllllllld', '..DDDDDDDDDD'],
    ring: ['....gggg....', '...gGhhGg...', '....GggG....', '...yy..YY...', '..yy....YY..', '..y......Y..', '..y......Y..', '..yy....YY..', '...yy..YY...', '....YYYY....'],
    neck: ['y..........Y', '.y........Y.', '..y......Y..', '...y....Y...', '....y..Y....', '.....yY.....', '....yyYY....', '...gGhgGg...', '...ghggGG...', '...gggGGG...', '....gGGG....', '.....GG.....'],
    great: ['..........hh', '.........hld', '........hld.', '.......hld..', '......hld...', '.....hld....', '..g.hld.....', '...ggd......', '...wgg......', '..ww..g.....', '.ww.........', 'yy..........'],
    dagger: ['........hh..', '.......hlld.', '......hlld..', '.....hlld...', '....hlld....', '...ggld.....', '..wgg.......', '.ww.g.......', 'yw..........'],
    staff: ['........ggg.', '.......ghhGg', '.......ghGGg', '........gGg.', '.......wy...', '......ww....', '.....ww.....', '....ww......', '...ww.......', '..ww........', '.ww.........', 'ww..........'],
    mace: ['........h.h.', '.......hllh.', '......hllldd', '.......lgdd.', '......hdddd.', '.....yw.d...', '....ww......', '...ww.......', '..ww........', '.ww.........', 'yy..........'],
    musket: ['...........h', '..........hl', '.........hl.', '........hl..', '.......wdl..', '......ww....', '....wwwy....', '..wwww......', '.wWWw.......', '.WW.........'],
  };
  const ICON_OF_CLS = { knight: 'great', ranger: 'dagger', mage: 'staff', priest: 'mace', gunner: 'musket' };
  const SLOT_ICON = { helm: 'helm', armor: 'armor', boots: 'boots', ring: 'ring', ring2: 'ring', neck: 'neck' };
  const iconKeyOf = it => it.slot === 'weapon' ? ICON_OF_CLS[it.cls || 'knight'] : SLOT_ICON[it.slot];
  const darkHex = (h, k = 0.55) => '#' + [1, 3, 5].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
  const iconCache = {};
  function itemIconURL(key, gradeC) {
    const ck = key + gradeC; if (iconCache[ck]) return iconCache[ck];
    const rows = ITEM_ICON[key], w = 14, h = 14, g = mkGrid(w, h), oy = Math.floor((12 - rows.length) / 2);
    rows.forEach((r, y) => r.split('').forEach((ch, x) => { if (ch !== '.') g[y + 1 + oy][x + 1] = ch; }));
    const pal = { k: '#000', h: '#e8e2d4', l: '#a8a2ae', d: '#625c6c', D: '#2e2a36', w: '#a0703c', W: '#5a3a1e', y: '#f2d78c', Y: '#a8803a', g: gradeC, G: darkHex(gradeC) };
    return (iconCache[ck] = gCanvas(gOutline(g), pal).toDataURL());
  }
  // v2.19 무기 아이콘은 실제 들고 있는 무기 도트를 45도로 세워서 (도감 무기 = 게임 속 무기와 같은 그림)
  // v2.19 무기 아이콘: 게임 속 무기 도트를 45도로 세워 원본 크기 그대로 (확대·축소 없음) 맨 윗 끝부터 잘라낸 섬네일
  const THUMB = 32;
  function weaponIconURL(it) {
    const cls = it.cls || 'knight', W0 = it.wk != null ? wcat(cls)[it.wk] : null, tex = it.grade === 'rby' ? rbyBase(cls, W0 && W0.w) : W0 && W0.w;
    if (!tex || !tex.cells) return null;
    const ck = 'w:' + cls + ':' + (it.grade === 'rby' ? 'rby' : it.wk); if (iconCache[ck]) return iconCache[ck];
    const r = rotW(tex, -Math.PI / 4), src = r.c, d = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
    let x0 = src.width, y0 = src.height, x1 = -1, y1 = -1;
    for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) if (d[(y * src.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, sx = (bw <= THUMB ? Math.round((x0 + x1 + 1 - THUMB) / 2) : x1 + 1 - THUMB) & ~1, sy = (bh <= THUMB ? Math.round((y0 + y1 + 1 - THUMB) / 2) : y0) & ~1, [c, g] = mkCanvas(THUMB, THUMB); // 무기 맨 윗 끝(오른쪽 위 촉·날끝)부터 보이게 · 작은 무기는 가운데
    g.imageSmoothingEnabled = false; g.drawImage(src, sx, sy, THUMB, THUMB, 0, 0, THUMB, THUMB);
    return (iconCache[ck] = c.toDataURL());
  }
  const itemIcon = it => (it.hold === 'card' && BDC.cardIconURL()) || (it.slot === 'weapon' && weaponIconURL(it)) || itemIconURL(iconKeyOf(it), gradeOf(it).c);
  const iconImg = it => { const w = it.hold === 'card' ? BDC.cardIconURL() : it.slot === 'weapon' && weaponIconURL(it); return w ? `<img class="thumb" src="${w}">` : `<img src="${itemIconURL(iconKeyOf(it), gradeOf(it).c)}">`; };
  const INV_TABS = [['all', '전체', () => true], ['weapon', '무기', it => it.slot === 'weapon']];
  const INV_STATS = [['atk', '공격력', v => v.toFixed(0)], ['hp', '최대 체력', v => (v / 2) + '칸'], ['crit', '치명 확률', v => (v * 100).toFixed(0) + '%'], ['critDmg', '치명 피해', v => (v * 100).toFixed(0) + '%'], ['cdr', '쿨타임 감소', v => (v * 100).toFixed(0) + '%'], ['spd', '이동 속도', v => v.toFixed(0)]];
  const INV_COLS = 10, GO = { rby: -1, legend: 0, unique: 1, rare: 2, common: 3 };
  let invTab = 'all', invSort = 'grade', invSel = null, invFrom = 'play', invSeen = new Set(), invDropArm = null;
  const invCls = () => G ? G.cls : CUR;
  function invList() {
    const f = INV_TABS.find(t => t[0] === invTab)[2], cls = invCls();
    return SAVE.inv.filter(f).sort((a, b) => (canEquip(b, cls) - canEquip(a, cls)) ||
      (invSort === 'grade' ? (GO[a.grade] - GO[b.grade]) || ((b.lv || 0) - (a.lv || 0)) || (b.id - a.id) : (b.id - a.id)));
  }
  // 장착을 바꿨다고 가정했을 때의 능력치 (id가 null이면 그 칸을 비운 경우)
  function statsIf(slot, id) {
    const eq = eqOf(invCls()), prev = eq[slot];
    if (id == null) delete eq[slot]; else eq[slot] = id;
    const s = calcStats(G ? G.buffs : [], invCls());
    if (prev == null) delete eq[slot]; else eq[slot] = prev;
    return s;
  }
  function equipNow(it, on) {
    const cls = invCls(); if (on && it && it.hold) { lootFeed('장착할 수 없는 무기입니다.', '#ff9a9a', 1400); sfx('blip', 0.6); return; } // v3.18 칼날카드
    if (!it || (on && !canEquip(it, cls))) return;
    if (on) equipIt(cls, it); else unequipIt(cls, it);
    if (G) { const P = G.player, oldHp = G.stats.hp; G.stats = calcStats(G.buffs); if (P) P.hp = clamp(P.hp + Math.max(0, G.stats.hp - oldHp), 1, G.stats.hp); }
    persist(); sfx(on ? 'select' : 'blip'); renderInv();
  }
  const myWeapons = cls => invList().filter(i => i.slot === 'weapon' && i.cls === cls); // 장비창 오른쪽 세로 칸과 같은 순서
  const SWAP_GCD = 0.4; // v3.22 무기를 바꾼 뒤 우클릭 공용 쿨타임
  // v3.22 마우스 휠로 무기 바꾸기: 아래로 굴리면 다음 칸, 위로 굴리면 이전 칸 (빈 칸은 건너뜀) · 0.15초에 한 칸 · 트랙패드의 작은 움직임은 모아서 한 칸
  { let acc = 0, last = 0;
    addEventListener('wheel', e => { if (!G || mode !== 'play' || !G.player || G.player.dead) return; e.preventDefault();
      acc += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY; const now = performance.now(); if (Math.abs(acc) < 40 || now - last < 150) return;
      const dir = acc > 0 ? 1 : -1; acc = 0; last = now; const L = myWeapons(G.cls); if (L.length < 2) return;
      const cur = L.indexOf(eqWeapon(G.cls)); for (let k = 1; k < L.length; k++) { const i = ((cur < 0 ? 0 : cur) + dir * k + L.length * 4) % L.length; if (L[i] && !L[i].hold) { swapWeapon(i); break; } } }, { passive: false }); }
  function swapWeapon(i) {
    const P = G.player, it = myWeapons(G.cls)[i];
    if (!P || P.dead || G.trans) return;
    if (!it) { lootFeed(`${i + 1}번 칸 비어 있음`, '#8a8090', 1200); sfx('blip', 0.6); return; }
    if (isEq(G.cls, it)) return;
    if (it.hold) { lootFeed('장착할 수 없는 무기입니다.', '#ff9a9a', 1400); sfx('blip', 0.6); return; } // v3.18 칼날카드
    if (!['idle', 'rattack'].includes(P.state)) { pressed[String(i + 1)] = true; return; } // 공격·기술 중이면 끝나고 바꾼다
    const oldTex = weaponTex(G.cls); equipIt(G.cls, it); SWAPFX.start(oldTex); P.gcd = SWAP_GCD; // v3.25 무기 바꾸기 모션 const oldHp = G.stats.hp; G.stats = calcStats(G.buffs); P.hp = clamp(P.hp + Math.max(0, G.stats.hp - oldHp), 1, G.stats.hp);
    P.state = 'idle'; P.combo = 0; P.chainL = null; P.whipL = null;
    if (G.cls === 'gunner') { P.ammo = 0; startReload(); } // 총을 바꾸면 새로 장전
    persist(); sfx('select'); lootFeed(`<b style="color:${gradeOf(it).c}">[${i + 1}] ${it.name}</b>`, gradeOf(it).c, 1400);
  }
  function openInv(from) {
    if (!G) return;
    invFrom = from || 'play'; mode = 'inv'; invTab = 'all';
    if (!invSel || !SAVE.inv.some(i => i.id === invSel)) invSel = null;
    $('ovPause').classList.remove('on'); $('ovInv').classList.add('on');
    for (const k in pressed) pressed[k] = false;
    invHover = false; invKbd = false; invDropT = 0; clearInterval(invDropTimer); invDropTimer = setInterval(invDropTick, 50);
    sfx('blip'); renderInv();
  }
  function closeInv() {
    clearInterval(invDropTimer); pxTip.hide(); $('ovInv').classList.remove('on'); for (const k in pressed) pressed[k] = false;
    SAVE.inv.forEach(i => invSeen.add(i.id));
    if (invFrom === 'pause') openPause(); else { mode = 'play'; sfx('blip'); }
  }
  function renderInv() {
    const cls = invCls(), C = CLASSES[cls], eq = eqOf(cls), s = G ? G.stats : calcStats([], cls);
    $('ivGold').textContent = G ? G.gold : SAVE.gold; $('ivIron').textContent = G ? G.iron : SAVE.mats.iron; $('ivCrystal').textContent = G ? G.crystal : SAVE.mats.crystal;
    classPreview($('invPv'), cls);
    $('invCls').innerHTML = `${C.n}<small>${C.weapon}</small>`;
    // v2.19 가방 칸 없앰 — 가진 무기(최대 3)를 캐릭터 창 오른쪽에 세로로
    const list = myWeapons(cls), ids = new Set(Object.values(eq));
    if (invSel != null && typeof invSel === 'number' && !list.some(i => i.id === invSel)) invSel = null;
    if (invSel == null && list[0]) invSel = list[0].id;
    const wcell = it => { const g = gradeOf(it), on = ids.has(it.id);
      return `<button class="eqSlot wSlot ${it.id === invSel ? 'sel' : ''} ${canEquip(it, cls) || it.hold ? '' : 'off'} ${invSeen.has(it.id) ? '' : 'new'}" data-id="${it.id}" style="--c:${g.c}"><div class="box">${iconImg(it)}${it.lv ? `<i class="lv">+${it.lv}</i>` : ''}${on ? '<i class="eq">E</i>' : it.hold || pasOf(it, cls) ? '<i class="pas">보관</i>' : ''}<i class="key">${list.indexOf(it) + 1}</i></div></button>`; };
    $('eqL').innerHTML = '';
    $('eqR').innerHTML = Array.from({ length: Math.max(WCAP, list.length) }, (_, i) => list[i] ? wcell(list[i]) : `<div class="eqSlot wSlot empty"><div class="box"></div></div>`).join('');
    $('invStats').innerHTML = INV_STATS.map(([k, n, f]) => `<span>${n}</span><b>${f(s[k])}</b>`).join('');
    $('invRelic').innerHTML = relicSlotsHTML(); // v2.19 레전더리 효과는 오른쪽 상세에만 (중복 제거) · 유물은 캐릭터 창 하단
    $('eqR').querySelectorAll('.wSlot[data-id]').forEach(b => {
      b.addEventListener('mouseenter', () => { if (TOUCH.on) return; invSel = +b.dataset.id; invHover = true; $('eqR').querySelectorAll('.wSlot').forEach(x => x.classList.toggle('sel', x === b)); invTipShow(); });
      b.addEventListener('mouseleave', () => { invHover = false; invDropT = 0; pxTip.hide(); });
      b.addEventListener('click', () => { const it = SAVE.inv.find(i => i.id === +b.dataset.id);
        if (TOUCH.on && !(invKbd && invSel === +b.dataset.id)) { invSel = +b.dataset.id; invKbd = true; TOUCH.tipEl = null; $('eqR').querySelectorAll('.wSlot').forEach(x => x.classList.toggle('sel', x === b)); invTipShow(); sfx('blip'); return; } // v2.26 모바일: 첫 탭은 설명, 다음 탭은 장착
        if (it && !isEq(cls, it)) equipNow(it, true); });
    });
    if (invHover || invKbd) invTipShow(); else pxTip.hide();
  }
  const invCanDrop = () => !!(G && invFrom === 'play' && G.dun && G.dun.cur && G.dun.cur.type !== 'forge');
  function invTipShow() { const it = SAVE.inv.find(i => i.id === invSel), node = it && $('eqR').querySelector(`.wSlot[data-id="${it.id}"]`); if (!node) { pxTip.hide(); return; } pxTip.show(invTipHTML(it), gradeOf(it).c); pxTip.el.classList.add('wide'); pxTip.beside(node);
    if (TOUCH.on) { pxTip.el.classList.add('pin'); const hb = pxTip.el.querySelector('.tHold'); if (hb) { const on = e => { e.preventDefault(); TOUCH.dropHold = true; }, off = () => { TOUCH.dropHold = false; }; hb.addEventListener('touchstart', on, { passive: false }); hb.addEventListener('touchend', off); hb.addEventListener('touchcancel', off); hb.addEventListener('mousedown', on); hb.addEventListener('mouseup', off); hb.addEventListener('mouseleave', off); } } }
  const PN = x => +x.toFixed(2);
  const PAS_D = { // 보관 패시브 설명 (툴팁)
    atkP: q => `공격력이 ${q.v}% 증가합니다.`, crit: q => `치명타 확률이 ${q.v}% 증가합니다.`, critDmg: q => `치명타 피해가 ${q.v}% 증가합니다.`, spd: q => `이동 속도가 ${q.v}% 증가합니다.`, cdr: q => `재사용 대기 시간이 ${q.v}% 감소합니다.`, gauge: q => `각성 게이지가 ${q.v}% 더 빨리 찹니다.`,
    stun: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 적을 ${q.d}초 동안 기절시킵니다.`, stagger: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 적을 ${q.d}초 동안 경직시킵니다.`, slow: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 적을 ${q.d}초 동안 느리게 합니다.`, mochi: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 적을 ${q.d}초 동안 끈적이게 합니다.`,
    reach3: q => `3타의 사거리가 ${PN(q.v * 100)}% 증가합니다.`, grogi: q => `적에게 쌓는 그로기가 ${PN(q.v * 100)}% 증가합니다.`, spinKb: q => `3타의 밀쳐내는 힘이 ${PN(q.v * 100)}% 강해집니다.`, bleed: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 출혈을 일으킵니다.`, bleed3: q => `3타가 맞으면 ${PN(q.p * 100)}% 확률로 출혈을 일으킵니다.`,
    wallWave: () => '벽 근처에서 회피가 끝나면 작은 충격파가 일어납니다.', crumb: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 빵조각이 떨어집니다. 빵조각을 주우면 하트 반 칸을 회복하며, 챕터당 1개까지 떨어집니다.`, kcd: q => `K 스킬의 재사용 대기 시간이 ${PN(q.v * 100)}% 감소합니다.`, exec: q => `체력이 30% 미만인 적에게 주는 피해가 ${PN(q.v * 100)}% 증가합니다.`,
    bone: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 뼈다귀가 다음 적에게 날아갑니다.`, deflectAtk: q => `공격하는 동안 ${PN(q.p * 100)}% 확률로 투사체를 되받아칩니다.`, deflect: q => `${PN(q.p * 100)}% 확률로 투사체를 되받아칩니다.`, bind: q => `치명타가 터지면 ${PN(q.p * 100)}% 확률로 적을 ${q.d}초 동안 묶습니다.`,
    focus4: q => `같은 적을 4번 맞히면 다음 한 방의 피해가 ${PN(q.v * 100)}% 증가합니다.`, pdInvis: q => `퍼펙트 회피에 성공하면 ${q.v}초 동안 은신합니다.`, cat: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 고양이 혼이 다음 적에게 날아갑니다.`,
    burnPool: q => `마법탄이 ${PN(q.p * 100)}% 확률로 작은 불길을 남깁니다.`, fish: q => `방을 비우면 ${PN(q.p * 100)}% 확률로 물고기가 떨어집니다. 물고기를 주우면 하트 반 칸을 회복하며, 챕터당 1마리까지 떨어집니다.`, bounce: q => `마법탄이 ${PN(q.p * 100)}% 확률로 벽에 한 번 튕깁니다.`, blink: q => `점멸 거리가 ${PN(q.v * 100)}% 증가합니다.`,
    wisp: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 도깨비불이 3초 동안 나타납니다.`, zap: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 옆의 적에게 번개가 튑니다.`, soup: () => '하트가 반 칸 이하일 때 방을 비우면 반 칸을 회복합니다. 챕터마다 1번 발동합니다.', mirror: q => `화염구가 ${PN(q.p * 100)}% 확률로 하나 더 나갑니다.`, meteor: q => `영혼박리 분신의 피해가 ${PN(q.v * 100)}% 증가합니다.`,
    parry: q => `패링 판정 시간이 ${q.v}초 증가합니다.`, undead: q => `2장과 4장에서 주는 피해가 ${PN(q.v * 100)}% 증가합니다.`, carrot: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 당근이 떨어집니다. 당근을 주우면 하트 반 칸을 회복하며, 챕터당 1개까지 떨어집니다.`, wave3: q => `3타 충격파의 범위가 ${PN(q.v * 100)}% 넓어집니다.`, reliq: () => '치유할 때 성스러운 갑옷을 1칸 더 쌓을 수 있습니다. 챕터마다 1번 발동합니다.',
    lowAtk: q => `하트가 1칸 이하일 때 주는 피해가 ${PN(q.v * 100)}% 증가합니다.`, healShield: q => `치유할 때 ${q.v}초 동안 보호막이 생깁니다.`, miracle: q => `기적으로 되살아난 뒤 무적 시간이 ${q.v}초 증가합니다.`,
    reload: q => `재장전 시간이 ${PN(q.v * 100)}% 감소합니다.`, close: q => `가까운 적(60px 안)에게 주는 피해가 ${PN(q.v * 100)}% 증가합니다.`, gbounce: q => `빗나간 탄이 ${PN(q.p * 100)}% 확률로 한 번 튕깁니다.`, still: q => `멈춰서 쏘면 피해가 ${PN(q.v * 100)}% 증가합니다.`, ammo: q => `장탄이 ${q.v}발 증가합니다.`,
    boom: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 작은 폭발이 일어납니다.`, spikes: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 가시가 터집니다.`, burn: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 화상을 입힙니다.`, grogiDmg: q => `그로기 상태인 적에게 주는 피해가 ${PN(q.v * 100)}% 증가합니다.`, lastShot: q => `마지막 탄의 피해가 ${PN(q.v * 100)}% 증가합니다.`,
  };
  const pasOf = (it, cls) => it && it.slot === 'weapon' && it.wk != null && it.cls === cls ? (PAS_T[cls] || {})[it.wk] || null : null;
  function pasLine(it, cls) { // 툴팁: 보관 시 효과
    const q = pasOf(it, cls); if (!q || !PAS_D[q.f]) return ''; const on = isEq(cls, it), act = G && G.stats && G.stats.pas && G.stats.pas[q.f];
    const st = on ? '장착 중엔 꺼짐' : act === q ? '적용 중' : act ? '같은 계열 더 높은 효과 적용 중' : '';
    return `<div class="pasT">보관 시 · ${PAS_D[q.f](q)}${st ? ` <em>(${st})</em>` : ''}</div>`;
  }
  function invTipHTML(it) {
    const cls = invCls(), cur = G ? G.stats : calcStats([], cls);
    const g = gradeOf(it), v = itemVal(it), on = isEq(cls, it), ok = canEquip(it, cls);
    if (it.hold) return BDC.cardTip(it, cls, TOUCH.on && invCanDrop() ? '<button class="tHold"><i></i>길게 눌러 버리기</button>' : '<div class="tDrop"><i></i></div>'); // v3.18 칼날카드
    const curIt = on ? null : eqCurFor(cls, it);
    const main = PCT_STAT[it.stat] ? `${PCT_STAT[it.stat]} +${v}%` : `${slotOf(it).label} +${v}`;
    let right = '';
    if (ok) {
      const nx = on ? statsIf(eqKeyOf(cls, it), null) : statsIf(eqTarget(cls, it), it.id);
      const rows = INV_STATS.map(([k, n, f]) => {
        const dv = nx[k] - cur[k], same = Math.abs(dv) < (['crit', 'critDmg', 'cdr'].includes(k) ? 0.0005 : 0.5);
        const ds = same ? '–' : (dv > 0 ? '+' : '−') + f(Math.abs(dv)).replace('%', '') + (['crit', 'critDmg', 'cdr'].includes(k) ? '%' : '');
        return `<span>${n}</span><b>${f(nx[k])}</b><em class="${same ? 'eq0' : dv > 0 ? 'up' : 'dn'}">${ds}</em>`;
      }).join('');
      right = on ? '' : `<div class="dr"><div class="cmpT">${curIt ? `장착하면 (「${curIt.name}」 대신)` : '장착하면'}</div><div class="cmp">${rows}</div></div>`;
    }
    const idx = myWeapons(cls).indexOf(it) + 1;
    const K = t => `<span class="key">${t}</span>`; // 키보드·마우스 키는 네모 칸으로
    const keys = TOUCH.on ? [ok && !on ? '한 번 더 탭 — 장착' : on ? '장착 중' : `${CLASSES[it.cls].n} 전용 무기라 지금 직업으로는 쓸 수 없습니다.`] : [ok && !on ? `${K('좌클릭')} 장착` : on ? '장착 중' : `${CLASSES[it.cls].n} 전용 무기라 지금 직업으로는 쓸 수 없습니다.`, idx ? `${K(idx)} 게임 중 바꿔 들기` : '', invCanDrop() ? `${K('F')} 길게 누르거나 창 밖으로 끌어 놓아 버리기` : '', `${K('I')} ${K('ESC')} 닫기`].filter(Boolean);
    return `<div class="dl"><div class="gr">${g.n} · ${slotName(it)}${ascTag(it)}${on ? ' · 장착 중' : ''}</div><div class="nm">${it.name}${it.lv ? ` <b>+${it.lv}</b>` : ''}</div>
      <div class="mn">${main}</div>${it.opts.map(o => `<div class="op">${optText(o)}</div>`).join('')}${it.fx ? `<div class="fx">★ ${LEGEND_FX[it.fx].d}</div>` : ''}${itemExtra(it, cls)}${pasLine(it, cls)}
      ${it.lv || it.fail ? `<div class="rp">강화 +${it.lv || 0}${it.fail ? ` · 장인의 숨결 +${2 * it.fail}%` : ''}</div>` : ''}</div>${right}
      <div class="tK">${keys.map(x => `<span class="kI">${x}</span>`).join('')}</div>${TOUCH.on && invCanDrop() ? '<button class="tHold"><i></i>길게 눌러 버리기</button>' : '<div class="tDrop"><i></i></div>'}`;
  }
  // F 홀드: 마우스를 올린(또는 고른) 무기를 바닥에 내려놓는다
  let invHover = false, invKbd = false, invDropT = 0, invDropTimer = null;
  function invDropTick() {
    if (mode !== 'inv') return; const it = SAVE.inv.find(i => i.id === invSel), on = (invHover || invKbd) && (keys['f'] || (TOUCH.on && TOUCH.dropHold)) && it && invCanDrop();
    invDropT = on ? invDropT + 0.05 : 0; const bar = pxTip.el.querySelector('.tDrop i, .tHold i'); if (bar) bar.style.width = Math.min(100, invDropT / 0.7 * 100) + '%';
    if (on && invDropT >= 0.7) { invDropT = 0; keys['f'] = false; TOUCH.dropHold = false; const P = G.player; dropWeapon(it, P.x + 16, P.y + 8); G.stats = calcStats(G.buffs); persist(); sfx('drop'); lootFeed(`「${it.name}」 버림`, gradeOf(it).c, 1400); invSel = null; invHover = false; invKbd = false; pxTip.hide(); renderInv(); }
  }
  function invKey(k) {
    const list = invList().filter(i => i.slot === 'weapon' && i.cls === invCls());
    if (k === 'Escape' || k === 'i' || k === 'I') { closeInv(); return true; }
    if (k === 'Enter' || k === ' ') { const it = SAVE.inv.find(i => i.id === invSel); if (it) equipNow(it, !isEq(invCls(), it)); return true; }
    const dir = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1, ArrowUp: -1, w: -1, W: -1, ArrowDown: 1, s: 1, S: 1 }[k];
    if (dir && list.length) {
      let i = list.findIndex(x => x.id === invSel); if (i < 0) i = 0; else i = clamp(i + dir, 0, list.length - 1);
      invSel = list[i].id; invKbd = true; sfx('blip'); renderInv(); return true;
    }
    return false;
  }
  $('ivClose').addEventListener('click', closeInv);

  // ---------------------------------------------------------------- 직업 선택
  let selCls = CUR;
  // v2.95 선택 카드 미니 도트: f -1 정지 · 0~3 걷기 장면 (마우스를 올리면 제자리 걸음)
  function selMini(mini, cls, f) {
    const mg = mini.getContext('2d'); mg.imageSmoothingEnabled = false; mg.clearRect(0, 0, mini.width, mini.height); const C1 = CLASSES[cls], ash1 = SAVE.skin === 'ash' && skinOpen(), pal = ash1 ? ashPalKey(C1.pal) : C1.pal;
    const base = sprite(C1.map, pal, 2), sp = f < 0 ? base : sprite(walkMap(C1.map, f), pal, 2);
    const sx = Math.round((mini.width - base.width) / 4) * 2, sy = mini.height - 4 - sp.height; mg.fillStyle = '#060408'; mg.fillRect(sx + 2, mini.height - 6, base.width - 4, 2); mg.fillRect(sx + 4, mini.height - 4, base.width - 8, 2);
    if (ash1) { const A1 = auraOf(sp, 2); mg.drawImage(A1.c, sx - A1.p, sy - A1.p); } mg.drawImage(sp, sx, sy);
  }
  let selAnim = null; // { el, raf }
  function selMiniStart(el) {
    selMiniStop(); const mini = el.querySelector('canvas[data-mini]'); if (!mini) return; const cls = el.dataset.cls; let last = -9;
    const tick = () => { const f = Math.floor(performance.now() / 170) % 4; if (f !== last) { last = f; selMini(mini, cls, f); } selAnim.raf = requestAnimationFrame(tick); };
    selAnim = { el, mini, cls, raf: 0 }; tick();
  }
  function selMiniStop() { if (!selAnim) return; cancelAnimationFrame(selAnim.raf); selMini(selAnim.mini, selAnim.cls, -1); selAnim = null; }
  function classPreview(c0, cls, base) { // base: 선택창 — 런은 맨손(기본 무기)으로 시작하니 기본 무기를 그린다 // v2.19 넓은 캔버스에 그린 뒤 캐릭터 중심을 맞춰 찍는다
    { const mini = c0.parentNode && c0.parentNode.querySelector('canvas[data-mini]'); // 선택 카드: 초상 왼쪽 아래에 실제 게임 속 모습(2px 칸) — 외형을 바꾸면 여기서 보인다
      if (mini) selMini(mini, cls, -1); }
    const g0 = c0.getContext('2d'); g0.imageSmoothingEnabled = false; g0.clearRect(0, 0, c0.width, c0.height);
    const PVX = 40, [c, g] = mkCanvas(c0.width + PVX * 2, c0.height); g.imageSmoothingEnabled = false;
    const C = CLASSES[cls], ash = SAVE.skin === 'ash' && skinOpen(), spr = sprite(C.map, ash ? ashPalKey(C.pal) : C.pal, 4); // v1.99 잿불 외형 미리보기
    const bx = c.width / 2, by = c.height - 6;
    dshEll(g, bx, by, 22, 8, 0.5, 4);
    const drawW = (b, x, y, a, sc) => { if (ash) b = ashBlade(b); if (b.cells) { const r = rotW(b, a); g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(2, 2); g.drawImage(r.c, -r.o, -r.o); g.restore(); return; } g.save(); g.translate(x, y); g.rotate(a); g.scale(sc, Math.cos(a) < 0 ? -sc : sc); g.drawImage(b.c, -b.pivotX, -b.pivotY); g.restore(); };
    const WT = base ? WEAP[cls][0] : weaponTex(cls); // v2.19 장비창은 실제 들고 있는 무기 · 선택창은 시작 기본 무기
    if (cls === 'knight') drawW(WT, bx + 8, by - 22, -0.9, 1.4);
    else if (cls === 'ranger') { drawW(WT, bx - 12, by - 22, -2.3, 2); } // v2.19 쌍검을 양손에 세워 든 자세
    else if (cls === 'mage') drawW(WT, bx + 14, by - 18, -1.35, 1.5);
    else if (cls === 'priest') drawW(WT, bx + 12, by - 24, -0.6, 1.5);
    if (ash) { const A = auraOf(spr, 4); g.drawImage(A.c, Math.round(bx - spr.width / 2) - A.p, by - spr.height - A.p); }
    g.drawImage(spr, Math.round(bx - spr.width / 2), by - spr.height);
    if (cls === 'ranger') drawW(WT, bx + 12, by - 22, -0.85, 2);
    if (cls === 'gunner') drawW(WT, bx + 6, by - 18, -0.35, 1.4);
    g0.drawImage(c, -PVX, 0); // 캐릭터를 창 가운데(이름 바로 위)에 · 넓게 그려서 긴 무기가 옆에서 잘리지 않게
  }
  // v2.21 선택 카드 초상 배경(직업색 3단 디더) + 금빛 초상화 액자 — 칸(2px) 단위
  const SEL_BG = { knight: ['#1c0b10', '#36121a', '#561c26'], ranger: ['#0b140e', '#16261a', '#24402a'], mage: ['#120c1e', '#221638', '#362252'], priest: ['#18130a', '#2e2412', '#4a3a1a'], gunner: ['#0c1016', '#172029', '#263341'] };
  const SEL_GEM = { knight: '#e04040', ranger: '#5ad07a', mage: '#b070ff', priest: '#ffe08a', gunner: '#8ab8e0' };
  const SEL_ART = {};
  function portraitDark(cls) { // 초상 팔레트 중 실제로 쓴 가장 어두운 색
    const D = PORTRAITS[cls]; if (!D) return '#0d0a10'; const used = new Set(D.rows.join('')); let best = null, bl = 1e9;
    for (const ch of used) { const c = D.pal[ch]; if (!c) continue; const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16), l = r * 0.3 + g * 0.59 + b * 0.11; if (l < bl) { bl = l; best = c; } }
    return best || '#0d0a10';
  }
  function selArt(cls, wC, hC) {
    const key = cls + wC + 'x' + hC; if (SEL_ART[key]) return SEL_ART[key];
    const C = SEL_BG[cls] || SEL_BG.knight, B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const [bc, bg] = mkCanvas(wC, hC);
    for (let y = 0; y < hC; y++) { const t = y / (hC - 1) * 2.2 - 0.1, lo = clamp(Math.floor(t), 0, 2), f = t - lo;
      for (let x = 0; x < wC; x++) { bg.fillStyle = '#0d0a10'; bg.fillRect(x, y, 1, 1); /* v2.21 사용자 결정: 배경은 초상 안쪽 어둠과 같은 검정 */ } }
    const [fc, fg] = mkCanvas(wC, hC), P = (x, y, c) => { fg.fillStyle = c; fg.fillRect(x, y, 1, 1); };
    const K = '#0b0a0e', HI = '#f0d488', MID = '#c09a48', LO = '#7a5a22';
    for (let y = 0; y < hC; y++) for (let x = 0; x < wC; x++) {
      const d = Math.min(x, y, wC - 1 - x, hC - 1 - y); if (d > 1) continue;
      if (d === 0) { P(x, y, K); continue; }
      P(x, y, (y === 1 || x === 1) && x < wC - 2 && y < hC - 2 ? HI : (y === hC - 2 || x === wC - 2) ? LO : MID);
    }
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { // 모서리 장식 (안쪽으로 꺾쇠)
      const ox = sx > 0 ? 2 : wC - 3, oy = sy > 0 ? 2 : hC - 3;
      for (const [dx, dy, c] of [[0, 0, MID], [1, 0, MID], [0, 1, MID], [2, 0, LO], [0, 2, LO], [1, 1, K]]) P(ox + dx * sx, oy + dy * sy, c);
    }
    const cx = wC >> 1; // 위 가운데 보석
    for (const [dx, dy, c] of [[0, 1, MID], [-1, 2, MID], [1, 2, MID], [0, 3, MID], [-2, 2, K], [2, 2, K], [0, 4, K], [0, 2, SEL_GEM[cls] || HI]]) P(cx + dx, dy, c);
    return (SEL_ART[key] = { bg: bc.toDataURL(), frame: fc.toDataURL() });
  }
  function buildSelect() {
    const tCol = v => v === '상' ? '#ffd34d' : v === '중' ? '#e8dfd2' : '#7b7380';
    const tTag = v => `<span style="color:${tCol(v)};font-weight:bold;text-align:right">${v}</span>`;
    $('selCards').innerHTML = Object.entries(CLASSES).map(([k, C]) => `
      <div class="selc pf" data-cls="${k}">
        <div class="pv" style="background-image:url(${selArt(k, 44, 43).bg})"><img class="pvFrame" src="${selArt(k, 44, 43).frame}" alt=""><button class="chrCardBtn" data-chr="${k}" title="전기 읽기"><img src="${BOOK_ICON}" alt="">전기</button><canvas class="px pvMini" width="56" height="48" data-mini="${k}"></canvas><img class="px pvArt" src="${portraitArt(k)}" style="width:${PORTRAIT_W[k] * 2}px" alt=""><canvas class="px" width="108" height="88" data-pv="${k}" style="display:none"></canvas></div>
        <h3>${C.name}</h3><div class="role">${C.sub}</div>
        <div class="st">
          <span>체력</span><div class="selHearts" style="display:flex;gap:2px;align-items:center;justify-content:flex-end">${heartsHTML(C.base.hp, C.base.hp, 0)}</div>
          <span>공격</span>${tTag(C.tier.atk)}
          <span>치명타</span>${tTag(C.tier.crit)}
          <span>속도</span>${tTag(C.tier.spd)}
        </div>
      </div>`).join('');
    $('selCards').querySelectorAll('.selHearts img').forEach(img => { img.style.width = '10px'; img.style.height = '10px'; });
    $('selCards').querySelectorAll('canvas[data-pv]').forEach(c => classPreview(c, c.dataset.pv, true));
    $('selCards').querySelectorAll('.chrCardBtn').forEach(bt => {
      bt.addEventListener('click', e => { e.stopPropagation(); openChronicle(bt.dataset.chr); });
    });
    $('selCards').querySelectorAll('.selc').forEach(el => {
      el.addEventListener('mouseenter', () => { if (selCls !== el.dataset.cls) { selCls = el.dataset.cls; sfx('blip'); renderSelect(); } selMiniStart(el); });
      el.addEventListener('mouseleave', () => { if (selAnim && selAnim.el === el) selMiniStop(); });
      el.addEventListener('touchstart', () => { el._wasSel = selCls === el.dataset.cls; }, { passive: true });
      el.addEventListener('click', () => { if (TOUCH.on && !el._wasSel) { el._wasSel = true; if (selCls !== el.dataset.cls) { selCls = el.dataset.cls; renderSelect(); } sfx('blip'); return; } chooseClass(el.dataset.cls); }); // v2.26 모바일: 첫 탭은 살펴보기, 다음 탭은 출정
    });
  }
  function renderStages() {
    $('stageTabs').innerHTML = Object.entries(STAGES).map(([k, S]) => `<button class="stg pf ${+k === STAGE ? 'sel' : ''}" data-st="${k}"><span class="sn">STAGE ${k}</span><b>${S.n}</b><span class="sd">${'★'.repeat(S.diff)}${'☆'.repeat(2 - S.diff)}</span><span class="ss">${S.sub} · 보스 ${S.boss}</span></button>`).join('');
    $('stageTabs').querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { setStage(+b.dataset.st); }));
  }
  function setStage(k) { if (!STAGES[k] || k === STAGE) return; STAGE = k; SAVE.lastStage = k; persist(); sfx('blip'); renderStages(); }
  // v1.96 직업 선택 화면의 잿불 단계 고르기
  function ascShift(d) { return; // v2.29 잿불 단계 취소
  }
  function ascShiftOld(d) { const A = SAVE.asc, v = clamp((A.sel || 0) + d, 0, A.max || 0); if (v === (A.sel || 0)) return; A.sel = v; persist(); sfx('blip'); renderAsc(); }
  function skinRowHtml() { // v1.99 외형 고르기 (설명은 마우스를 올리면)
    const open = skinOpen(), cur = SAVE.skin === 'ash' && open ? 'ash' : '';
    const tip = open ? '잿빛 몸·무기, 붉은 안광과 기운' + '' : '잿불 3을 돌파하면 열립니다';
    return `<span class="skinRow"><span class="ascT">외형</span><button class="ascB skinB${cur ? '' : ' on'}" data-skin="">기본</button><button class="ascB skinB${cur ? ' on' : ''}" data-skin="ash" ${open ? '' : 'disabled'} ${aTip('잿불 외형', tip, '#ffb040')}>잿불</button></span>`;
  }
  function bindSkin(el) { el.querySelectorAll('.skinB').forEach(b => b.addEventListener('click', () => { if (b.disabled) return; pxTip.hide(); SAVE.skin = b.dataset.skin || undefined; persist(); sfx('blip'); renderAsc(); $('selCards').querySelectorAll('canvas[data-pv]').forEach(c => classPreview(c, c.dataset.pv, true)); })); }
  // 잿불 단계: 한 줄만 보이고, 자세한 내용은 마우스를 올리면 도트 말풍선으로
  const escAttr = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const aTip = (name, html, c) => `data-atip="${escAttr(html)}" data-aname="${escAttr(name)}"${c ? ` data-ac="${c}"` : ''}`;
  function renderAsc() {
    const A = SAVE.asc, el = $('ascRow'); if (!el) return;
    if (true) { el.innerHTML = ''; el.style.display = 'none'; return; } // v2.29 잿불 단계 취소 · v3.84 외형 변경도 폐기 → 줄 자체를 숨김
    if (!A.max) { el.innerHTML = `<div class="ascHead"><span class="ascT" ${aTip('잿불 단계', '첫 원정(마지막 보스)을 마치면 열립니다', '#ffb040')}>잿불 단계</span><span class="ascLock">잠김</span>${skinRowHtml()}</div>`; bindSkin(el); return; }
    const L = Math.min(A.sel || 0, A.max), best = A.best[selCls];
    const next = A.max < ASC_MAX ? `잿불 ${A.max} 단계를 클리어하면 다음 단계가 열립니다` : '모든 단계가 열렸습니다';
    const sum = `<div>${CLASSES[selCls].name} 최고 ${best == null || best < 0 ? '—' : '잿불 ' + best} · ${next}</div>`
      + (L ? `<div class="fx">보상 재료 +${L * 10}% · 장비 수치 +${L * 2}%<br>높은 등급 ↑ · 클리어 골드 +${L * 50}</div><div class="rp">적용 중인 규칙</div>` + ASC.slice(1, L + 1).map((r, i) => `<div><b style="color:#ff8a2a;font-weight:normal">${i + 1}</b> ${r.n}</div>`).join('') : '<div class="rp">원래 난이도 — 규칙 없음</div>');
    const pips = Array.from({ length: ASC_MAX }, (_, i) => { const r = ASC[i + 1], open = i < A.max; return `<i class="${i < L ? 'on' : ''}${open ? '' : ' lock'}" ${aTip(`잿불 ${i + 1} · ${open ? r.n : '???'}`, open ? r.d : `잿불 ${i} 단계를 클리어하면 열립니다`, i < L ? '#ffb040' : '#9a8ea5')}></i>`; }).join('');
    el.innerHTML = `<div class="ascHead"><span class="ascT" ${aTip(`잿불 ${L}`, sum, '#ffb040')}>잿불 단계</span><button class="ascB" data-d="-1">◀</button><b class="ascN" ${aTip(`잿불 ${L}`, sum, '#ffb040')}>${L}</b><button class="ascB" data-d="1">▶</button>
      <span class="ascEm">${pips}</span>${skinRowHtml()}</div>`;
    bindSkin(el);
    el.querySelectorAll('.ascB:not(.skinB)').forEach(b => b.addEventListener('click', () => ascShift(+b.dataset.d)));
  }
  { // data-atip이 달린 요소에 마우스를 올리면 도트 말풍선
    const at = e => e.target.closest && e.target.closest('[data-atip]');
    addEventListener('mouseover', e => { const r = at(e); if (!r) return; pxTip.show(`<div class="tN">${r.dataset.aname}</div><div class="tD">${r.dataset.atip}</div>`, r.dataset.ac || null); pxTip.at(e.clientX, e.clientY); });
    addEventListener('mousemove', e => { if (at(e)) pxTip.at(e.clientX, e.clientY); });
    addEventListener('mouseout', e => { const r = at(e); if (r && !(e.relatedTarget && r.contains(e.relatedTarget))) pxTip.hide(); });
  }
  function renderSelect() {
    renderAsc();
    $('stageTabs').style.display = 'none';
    $('selCards').querySelectorAll('.selc').forEach(el => el.classList.toggle('sel', el.dataset.cls === selCls));
    const C = CLASSES[selCls];
    $('selDetail').innerHTML = `<div class="sdh"><b>${C.n}</b> <span>${C.role} · ${C.weapon}</span></div><div class="sk2">
      <span class="key">${TOUCH.on ? '공격' : '좌클릭'}</span><span>${C.atkD}</span>
      <span class="key">${TOUCH.on ? '스킬' : '우클릭'}</span><span><b>${C.skill}</b> — ${C.skillD} <i>(쿨타임 ${C.skillCd}초)</i></span>
      <span class="key">${selCls === 'priest' ? '패시브' : TOUCH.on ? '각성' : 'E'}</span><span><b>${C.awaken}</b> — ${C.awakenD}</span></div>`;
  }
  function openSelect() { mode = 'select'; selCls = CUR; $('ovTitle').classList.remove('on'); buildSelect(); renderSelect(); $('ovSelect').classList.add('on'); }
  function closeSelect() { selMiniStop(); pxTip.hide(); $('ovSelect').classList.remove('on'); mode = 'title'; $('ovTitle').classList.add('on'); }
  function chooseClass(cls) { selMiniStop(); CUR = cls; SAVE.lastCls = cls; persist(); start(); }

  // ---------------------------------------------------------------- 대장간
  let forgeFrom = 'title', forgeSel = null, forgeCls = CUR, forgeMsg = null;
  // v3.83 대장간 골드는 원정 중에는 플레이어 소지 골드(G.gold) 하나로 표시·차감한다 (예전에는 SAVE.gold만 깎여 HUD 골드와 어긋남)
  const fgGold = () => G ? G.gold : SAVE.gold;
  function fgPay(n) { SAVE.gold -= n; if (G) { G.gold -= n; if (G.committed) G.committed.gold -= n; } }
  function openForge(from, m) {
    $('ovForge').dataset.m = m || 'all'; $('fgTitle').textContent = { enh: '모루 — 강화', roll: '숫돌 — 재련 (옵션 다시 굴리기)', salv: '용광로 — 분해' }[m] || '대장간 — 강화';
    forgeFrom = from; forgeCls = G ? G.cls : CUR; forgeMsg = from === 'between' ? `<span class="ok">STAGE ${G.stage} 클리어 — 보스 전리품 획득</span>` : null; mode = 'forge';
    if (from === 'between' && G.newItems[0]) forgeSel = G.newItems[0].id;
    ['ovTitle', 'ovResult'].forEach(id => $(id).classList.remove('on'));
    $('fgTabs').style.display = from === 'between' || from === 'station' ? 'none' : '';
    $('fgClose').innerHTML = (from === 'between' ? `STAGE ${G.stage + 1}로` : '닫기') + ' <span class="key kc">ESC</span>'; // v2.63 키캡
    $('fgClose').classList.toggle('primary', from === 'between');
    $('ovForge').classList.add('on'); renderForge();
  }
  function closeForge() {
    $('ovForge').classList.remove('on'); sfx('blip');
    if (forgeFrom === 'station') { mode = 'play'; for (const k in pressed) pressed[k] = false; if ($('ovForge').dataset.m === 'roll' && G) G.grindT = 0; }
    else if (forgeFrom === 'between') { applyClassUI(); nextStage(); }
    else if (forgeFrom === 'title') { mode = 'title'; titleMats(); $('ovTitle').classList.add('on'); }
    else { mode = 'result'; renderResultItems(resultWin); $('ovResult').classList.add('on'); }
  }
  function forgeList() {
    const ids = new Set(Object.values(eqOf(forgeCls)));
    const go = { rby: -1, legend: 0, unique: 1, rare: 2, common: 3 };
    return SAVE.inv.filter(i => !i.hold).sort((a, b) => (ids.has(b.id) - ids.has(a.id)) || (go[a.grade] - go[b.grade]) || ((b.lv || 0) - (a.lv || 0)) || (b.id - a.id));
  }
  function renderForge() {
    $('fgGold').textContent = fgGold(); $('fgIron').textContent = SAVE.mats.iron; $('fgCrystal').textContent = SAVE.mats.crystal;
    document.querySelectorAll('#fgTabs [data-cls]').forEach(b => b.classList.toggle('sel', b.dataset.cls === forgeCls));
    const list = forgeList();
    if (!forgeSel || !SAVE.inv.some(i => i.id === forgeSel)) forgeSel = list[0] ? list[0].id : null;
    const ids = new Set(Object.values(eqOf(forgeCls)));
    $('fgList').innerHTML = list.length ? list.map(it => `<button class="fgRow ${it.id === forgeSel ? 'sel' : ''}" data-id="${it.id}" style="--c:${gradeOf(it).c}">${ids.has(it.id) ? '<span class="eq">E</span>' : ''}<span class="nm">${it.name}</span>${it.lv ? `<span class="lv">+${it.lv}</span>` : ''}<span class="sl">${slotName(it)}</span></button>`).join('')
      : '<p>장비가 없습니다. 던전의 적·상자·상인·보스에게서 얻을 수 있습니다.</p>';
    $('fgList').querySelectorAll('.fgRow').forEach(b => b.addEventListener('click', () => { forgeSel = +b.dataset.id; forgeMsg = null; sfx('blip'); renderForge(); }));
    const selRow = $('fgList').querySelector('.fgRow.sel'); if (selRow) selRow.scrollIntoView({ block: 'nearest' });
    renderForgeDetail();
  }
  // v1.14 장착·해제 버튼은 창 왼쪽 아래 (예전 테스트 버튼 자리)
  function forgeEqRow(it, eq, ok, act = '') {
    const r = $('fgEqRow'); if (!r) return;
    if (!it) { r.innerHTML = ''; return; }
    if (!ok) { r.innerHTML = act + `<span class="f7" style="color:var(--quiet)">${CLASSES[it.cls].n} 전용 무기</span>`; return; }
    const n = CLASSES[forgeCls].n;
    r.innerHTML = act + (eq ? `<button class="pbtn" id="fgEq">${n} 장착 해제</button>` : `<button class="pbtn" id="fgEq">${n}에게 장착</button>`);
    $('fgEq').addEventListener('click', () => { if (eq) unequipIt(forgeCls, it); else equipIt(forgeCls, it); tierCache.key = null; persist(); sfx('select'); renderForge(); });
  }
  function renderForgeDetail() {
    const it = SAVE.inv.find(i => i.id === forgeSel), d = $('fgDetail');
    if (!it) { forgeEqRow(null); d.innerHTML = `<p>${{ roll: '옵션을 다시 굴릴', salv: '녹여서 재료로 바꿀' }[$('ovForge').dataset.m] || '강화할'} 장비를 고르십시오.</p>`; return; }
    const g = gradeOf(it), sl = slotOf(it), lv = it.lv || 0, cap = enhCap(), max = lv >= cap, full = lv >= ENH_MAX;
    const label = PCT_STAT[it.stat] || sl.label, unit = PCT_STAT[it.stat] ? '%' : '';
    const cur = itemVal(it), next = max ? cur : itemVal(it, lv + 1);
    const c = enhCost(lv), rate = max ? 0 : enhRate(it);
    const has = { iron: SAVE.mats.iron >= c.iron, crystal: SAVE.mats.crystal >= c.crystal, gold: fgGold() >= c.gold };
    const can = !max && has.iron && has.crystal && has.gold;
    const eq = isEq(forgeCls, it), ok = canEquip(it, forgeCls);
    d.innerHTML = `
      <div class="fgHead" style="--c:${g.c}"><div class="gr">${g.n} · ${slotName(it)}${ascTag(it)}</div><div class="big">${it.name} <b>+${lv}</b></div></div>
      <div class="fgStat"><span>${label}</span><b>${cur}${unit}</b>${max ? '' : `<i>▶</i><b class="up">${next}${unit}</b>`}</div>
      ${it.opts.map(o => `<div class="fgOpt">${optText(o)}</div>`).join('')}${it.fx ? `<div class="fgOpt fx">★ ${LEGEND_FX[it.fx].d}</div>` : ''}<div class="fgOpt">${itemExtra(it, forgeCls)}</div>
      ${max ? (full ? '<div class="fgRate"><b>MAX</b><span>최대 강화</span></div>' : `<div class="fgRate"><b>+${cap}</b><span>이 대장간에서는 +${cap}까지 강화할 수 있습니다.</span></div>`) : `
      <div class="fgRate"><span>성공 확률</span><b>${rate}%</b>${it.fail ? `<em>장인의 숨결 +${2 * it.fail}%</em>` : ''}</div>
      <div class="fgRisk">${lv + 1 < 5 ? '반드시 성공합니다.' : '실패해도 단계는 유지됩니다. 실패할 때마다 다음 성공 확률이 2% 증가합니다.'}</div>
      ${[3, 6, 9].includes(lv + 1) ? `<div class="mile">★ +${lv + 1} 달성 시 옵션 1줄 추가</div>` : ''}
      <div class="fgCost"><span class="${has.iron ? '' : 'no'}">철광석 조각 ${c.iron} <small>보유 ${SAVE.mats.iron}</small></span>${c.crystal ? `<span class="${has.crystal ? '' : 'no'}">정령의 결정 ${c.crystal} <small>보유 ${SAVE.mats.crystal}</small></span>` : ''}<span class="${has.gold ? '' : 'no'}">골드 ${c.gold} <small>보유 ${fgGold()}</small></span></div>`}
      <div id="fgMsg">${forgeMsg || ''}</div>`;
    // v1.15 강화·다시 굴리기·분해 버튼은 설명 칸 밖 (창 아래 줄, 장착 버튼 옆)
    const rc = rerollCost(it), sv = salvageGain(it), canR = fgGold() >= rc.gold && SAVE.mats.crystal >= rc.crystal;
    const act = (max ? '' : `<button class="pbtn primary" id="fgGo" ${can ? '' : 'disabled'}>강화하기 <span class="key kc">ENTER</span></button>`)
      + `<button class="pbtn" id="fgSalv" ${eq ? 'disabled' : ''}>${forgeSalvArm === it.id ? '정말 분해? 한 번 더' : '분해'} <small>${eq ? '장착 중' : `철광석 ${sv.iron}${sv.crystal ? ` · 결정 ${sv.crystal}` : ''}`}</small></button>`;
    forgeEqRow(it, eq, ok, act);
    const rb = $('fgRoll'); if (rb) rb.addEventListener('click', doReroll);
    const sb = $('fgSalv'); if (sb) sb.addEventListener('click', doSalvage);
    const go = $('fgGo'); if (go) go.addEventListener('click', doEnhance);
  }
  // v0.98 대장간: 옵션 다시 굴리기(옵션 줄 수는 그대로, 효과 옵션도 새로) · 분해(재료로 환급, 장착 중이면 불가, 두 번 눌러 확정)
  let forgeSalvArm = null;
  const GI = { common: 0, rare: 1, unique: 2, legend: 3, rby: 4 };
  const rerollCost = it => ({ gold: [40, 90, 160, 260, 160][GI[it.grade]], crystal: GI[it.grade] >= 2 ? 1 : 0 });
  const salvageGain = it => ({ iron: [1, 2, 4, 6, 6][GI[it.grade]] + Math.floor((it.lv || 0) / 2) + Math.floor((it.asc || 0) / 3), crystal: [0, 0, 1, 2, 3][GI[it.grade]] + ((it.lv || 0) >= 10 ? 1 : 0) });
  function doReroll() {
    const it = SAVE.inv.find(i => i.id === forgeSel); if (!it) return;
    const c = rerollCost(it); if (fgGold() < c.gold || SAVE.mats.crystal < c.crystal) { sfx('block'); forgeMsg = '<span class="ng">재료가 부족합니다</span>'; renderForgeDetail(); return; }
    fgPay(c.gold); SAVE.mats.crystal -= c.crystal;
    const g = gradeOf(it), keep = it.opts.filter(o => o.cb), n = it.opts.length - keep.length, pool = OPTS.filter(o => !keep.some(k => k.k === o.k)), opts = keep.slice();
    for (let i = 0; i < n && pool.length; i++) { const o = pool.splice(randi(0, pool.length - 1), 1)[0]; opts.push({ k: o.k, v: optRoll(o, g) }); }
    it.opts = opts; if (it.efx) it.efx = pick(Object.keys(EFX).filter(k => k !== it.efx));
    if (G) G.grindT = 1.6; persist(); sfx('drop'); forgeMsg = `<span class="ok">옵션을 다시 굴렸습니다${it.efx ? ` · 효과 「${EFX[it.efx].n}」` : ''}</span>`; renderForge();
    const d = $('fgDetail'); d.classList.remove('hitok', 'hitng'); void d.offsetWidth; d.classList.add('hitok');
  }
  function doSalvage() {
    const it = SAVE.inv.find(i => i.id === forgeSel); if (!it) return;
    if (Object.values(eqOf(forgeCls)).includes(it.id)) { sfx('block'); return; }
    if (forgeSalvArm !== it.id) { forgeSalvArm = it.id; sfx('blip'); renderForgeDetail(); return; }
    forgeSalvArm = null; const gn = salvageGain(it);
    SAVE.inv = SAVE.inv.filter(i => i.id !== it.id); for (const k of Object.keys(SAVE.equipBy)) for (const sl in SAVE.equipBy[k]) if (SAVE.equipBy[k][sl] === it.id) delete SAVE.equipBy[k][sl];
    SAVE.mats.iron += gn.iron; SAVE.mats.crystal += gn.crystal; forgeSel = null;
    persist(); sfx('crunch'); forgeMsg = `<span class="ok">「${it.name}」 분해 — 철광석 +${gn.iron}${gn.crystal ? ` · 결정 +${gn.crystal}` : ''}</span>`; renderForge();
  }
  function doEnhance() {
    const it = SAVE.inv.find(i => i.id === forgeSel);
    if (!it || (it.lv || 0) >= enhCap()) return; // v2.40 대장간별 상한
    const c = enhCost(it.lv || 0);
    if (SAVE.mats.iron < c.iron || SAVE.mats.crystal < c.crystal || fgGold() < c.gold) { sfx('block'); forgeMsg = '<span class="ng">재료가 부족합니다</span>'; renderForgeDetail(); return; }
    SAVE.mats.iron -= c.iron; SAVE.mats.crystal -= c.crystal; fgPay(c.gold);
    const from = it.lv || 0, success = Math.random() * 100 < enhRate(it);
    if (success) {
      it.lv = from + 1; it.fail = 0;
      let extra = '';
      if ([3, 6, 9].includes(it.lv) && it.opts.length < 4) { // v2.40 옵션 추가 단계 +3 · +6 · +9
        const pool = OPTS.filter(o => !it.opts.some(x => x.k === o.k)), o = pick(pool);
        it.opts.push({ k: o.k, v: randi(o.r[0], o.r[1]) }); extra = ` · 새 옵션 「${optText(it.opts[it.opts.length - 1])}」`;
      }
      forgeMsg = `<span class="ok">강화에 성공했습니다! +${from} → +${it.lv}${extra}</span>`; sfx('drop');
    } else {
      it.fail = (it.fail || 0) + 1;
      let t = `강화에 실패했습니다 · +${from} 단계가 유지됩니다`;
      if (from + 1 >= 10) { it.lv = from - 1; t = `강화에 실패했습니다 · +${from} → +${it.lv}`; }
      forgeMsg = `<span class="ng">${t} · 장인의 숨결 +2%</span>`; sfx('hurt');
    }
    persist(); renderForge();
    const d = $('fgDetail'); d.classList.remove('hitok', 'hitng'); void d.offsetWidth; d.classList.add(success ? 'hitok' : 'hitng');
  }
  document.querySelectorAll('#fgTabs [data-cls]').forEach(b => b.addEventListener('click', () => { forgeCls = b.dataset.cls; forgeMsg = null; sfx('blip'); renderForge(); }));
  $('fgClose').addEventListener('click', closeForge);


  // ---------------------------------------------------------------- 모바일 터치 조작
  // 왼쪽 아무 곳이나 눌러 끌면 가상 조이스틱(WASD), 오른쪽 버튼은 키 입력을 그대로 흉내 낸다 → 기존 입력 처리를 모두 재사용
  const TOUCH = { on: false, held: {}, stick: null, dirs: { w: false, a: false, s: false, d: false } };
  const keyEv = (type, key) => dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
  function enableTouch() {
    if (TOUCH.on) return; TOUCH.on = true; document.body.classList.add('touch'); fit();
    if (G) { G.kgCls = null; }
    touchStripAll(); new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') touchStrip(m.target); else for (const n of m.addedNodes) touchStripAll(n); } }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  // v2.26 모바일: PC 키 표기 지우기 ([ESC] · [I] · [F] · TAB 지도 …) — 화면에 새 글자가 생길 때마다
  const KEY_RX = [[/\s*\[(?:ESC|Esc|I|F|TAB|Tab|H|M|E|Q|ENTER|Enter|SPACE|Space)\]/g, ''], [/TAB 지도/g, '지도'], [/\s*·\s*전체 조작 \[H\]/g, ''], [/\s*·\s*전체 조작\s*$/g, ''], [/E 조준 → 클릭 지점에/g, '조준 → 탭한 곳에'], [/좌클릭/g, '공격 버튼'], [/우클릭/g, '스킬 버튼'], [/\bRMB\b/g, '스킬 버튼'], [/\bLMB\b/g, '공격 버튼'], [/SPACE/g, '점멸']];
  function touchStrip(n) { if (!n || n.nodeType !== 3 || !n.nodeValue || (n.parentNode && n.parentNode.closest && n.parentNode.closest('#touch'))) return; let v = n.nodeValue; for (const [r, t] of KEY_RX) v = v.replace(r, t); if (v !== n.nodeValue) n.nodeValue = v; }
  function touchStripAll(root) { root = root || document.body; if (root.nodeType === 3) { touchStrip(root); return; } if (root.nodeType !== 1) return; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) touchStrip(n); }
  const buzz = ms => { if (TOUCH.on && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }; // 안드로이드 진동 (아이폰은 무시)
  { // v2.26 모바일: 유물·잿불 설명은 탭하면 보이고, 다른 곳을 탭하면 닫힘
    addEventListener('click', e => { if (!TOUCH.on) return; const r = e.target.closest && e.target.closest('.relicRow[data-tip], [data-atip]');
      if (r) { const nm = r.dataset.name || r.dataset.aname, d = r.dataset.tip || r.dataset.atip; pxTip.show(`<div class="tN">${nm}</div><div class="tD">${d}</div>`, getComputedStyle(r).getPropertyValue('--c').trim() || r.dataset.ac || null); pxTip.el.classList.remove('wide'); pxTip.beside(r); TOUCH.tipEl = r; return; }
      if (e.target.closest && (e.target.closest('.pxTip') || e.target.closest('.wSlot[data-id]'))) return;
      if (TOUCH.tipEl) { TOUCH.tipEl = null; pxTip.hide(); return; }
      if (mode === 'inv' && (invKbd || invHover)) { invKbd = false; invHover = false; pxTip.hide(); } }, true); // v2.27 빈 곳을 탭하면 설명 닫기
  }
  if (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 && !matchMedia('(pointer: fine)').matches) setTimeout(enableTouch, 0); /* 스크립트 끝까지 읽은 뒤 (fit이 아래 상수를 씀) */
  addEventListener('touchstart', () => enableTouch(), { passive: true });
  function setDir(k, on) { if (TOUCH.dirs[k] === on) return; TOUCH.dirs[k] = on; keyEv(on ? 'keydown' : 'keyup', k); }
  function stickTo(dx, dy) {
    const d = Math.hypot(dx, dy), R = 40, k = d > R ? R / d : 1;
    $('tKnob').style.transform = `translate(${dx * k}px,${dy * k}px)`;
    const dead = 10, a = Math.atan2(dy, dx), on = d > dead;
    TOUCH.mv = on ? { x: Math.cos(a), y: Math.sin(a) } : null; // v2.26 아날로그 이동: 8방향이 아니라 스틱 방향 그대로
    // 8방향: 각 축은 ±67.5° 안이면 켠다
    setDir('d', on && Math.cos(a) > 0.38); setDir('a', on && Math.cos(a) < -0.38);
    setDir('s', on && Math.sin(a) > 0.38); setDir('w', on && Math.sin(a) < -0.38);
  }
  const zone = $('tZone'), stick = $('tStick');
  zone.addEventListener('touchstart', e => {
    e.preventDefault(); const t = e.changedTouches[0]; if (TOUCH.stick) return;
    TOUCH.stick = { id: t.identifier, x: t.clientX, y: t.clientY };
    const zr = zone.getBoundingClientRect(); stick.style.left = (t.clientX - zr.left) + 'px'; stick.style.top = (t.clientY - zr.top) + 'px'; /* 조이스틱은 zone 안 좌표 */ stick.classList.add('on'); stickTo(0, 0);
  }, { passive: false });
  zone.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (TOUCH.stick && t.identifier === TOUCH.stick.id) stickTo(t.clientX - TOUCH.stick.x, t.clientY - TOUCH.stick.y); }, { passive: false });
  const stickEnd = e => { for (const t of e.changedTouches) if (TOUCH.stick && t.identifier === TOUCH.stick.id) { TOUCH.stick = null; stick.classList.remove('on'); stickTo(0, 0); } };
  zone.addEventListener('touchend', stickEnd); zone.addEventListener('touchcancel', stickEnd);
  document.querySelectorAll('#touch .tb[data-k]').forEach(b => {
    const k = b.dataset.k;
    const dn = e => { e.preventDefault(); b.classList.add('dn'); TOUCH.held[k] = true; keyEv('keydown', k); if (k !== 'j') buzz(8); };
    const up = e => { e.preventDefault(); b.classList.remove('dn'); if (TOUCH.held[k]) { TOUCH.held[k] = false; keyEv('keyup', k); } };
    b.addEventListener('touchstart', dn, { passive: false }); b.addEventListener('touchend', up); b.addEventListener('touchcancel', up);
    b.addEventListener('mousedown', dn); b.addEventListener('mouseup', up); b.addEventListener('mouseleave', up);
  });
  { const b = $('tWep'), go = e => { e.preventDefault(); if (!G || mode !== 'play') return; const L = myWeapons(G.cls), i = L.indexOf(eqWeapon(G.cls)); if (L.length > 1) { b.classList.add('dn'); setTimeout(() => b.classList.remove('dn'), 90); swapWeapon((i + 1) % L.length); buzz(8); } };
    b.addEventListener('touchstart', go, { passive: false }); b.addEventListener('mousedown', go); } // v2.26 모바일 무기 바꾸기 (숫자키 대신)
  $('tFull').addEventListener('click', () => { const d = document.documentElement; if (!document.fullscreenElement) { (d.requestFullscreen || d.webkitRequestFullscreen || (() => {})).call(d); try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { } } else document.exitFullscreen && document.exitFullscreen(); });
  if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) $('tFull').style.display = 'none';
  // 조준 보조: 터치로 공격·기술을 쓰면 가까운 적을 향한다 (마우스로 조준 중이면 그대로)
  function touchAim() { // v2.25 모바일 자동 조준: 목표 고정 · 이동 방향 우선 · 벽 너머·허수아비 제외 · 무기 사거리
    if (!TOUCH.on || mouse.active > 0 || !G) return null;
    const P = G.player, R = G.cls === 'gunner' ? 360 : G.cls === 'mage' ? 300 : 260;
    const mvx = (TOUCH.dirs.d ? 1 : 0) - (TOUCH.dirs.a ? 1 : 0), mvy = (TOUCH.dirs.s ? 1 : 0) - (TOUCH.dirs.w ? 1 : 0), mv = TOUCH.mv && TOUCH.stick ? Math.atan2(TOUCH.mv.y, TOUCH.mv.x) : mvx || mvy ? Math.atan2(mvy, mvx) : null;
    const ok = (e, r) => !e.dead && e.type !== 'flag' && Math.hypot(e.x - P.x, e.y - P.y) < r && !segSolid(P.x, P.y - 8, e.x, e.y - 8);
    const score = e => { const d = Math.hypot(e.x - P.x, e.y - P.y); return mv == null ? d : d * (1 + 0.8 * Math.abs(angDiff(Math.atan2(e.y - P.y, e.x - P.x), mv)) / Math.PI); };
    const live = G.enemies.filter(e => ok(e, R)), real = live.filter(e => !isDummy(e)), pool = real.length ? real : live;
    let best = null, bs = Infinity; for (const e of pool) { const v = score(e); if (v < bs) { bs = v; best = e; } }
    const L = TOUCH.lock;
    if (L && G.enemies.includes(L) && ok(L, R * 1.1) && (!real.length || !isDummy(L)) && !(best && best !== L && bs < score(L) * 0.7)) return L; // 다른 적이 30% 넘게 더 나을 때만 바꿈
    TOUCH.lock = best; return best;
  }
  function drawAimMark(e) { // 고정한 적 발밑 조준 표시 (깜빡이는 네 귀퉁이)
    const w = Math.round(e.r + 6) * 2, h = Math.round(e.r * 0.5 + 4) * 2, x = snap2(e.x - w / 2), y = snap2(e.y - h / 2 + 2), a = 4;
    ctx.fillStyle = Math.floor(time * 4) % 2 ? '#ffd34d' : '#fff2c0';
    for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { ctx.fillRect(sx > 0 ? cx : cx - a, sy > 0 ? cy : cy - 2, a, 2); ctx.fillRect(sx > 0 ? cx : cx - 2, sy > 0 ? cy : cy - a, 2, a); }
  }
  function touchCd() { // v2.26 모바일 버튼: 쿨타임·충전·각성 게이지·상황 행동·무기
    const P = G.player, s = G.stats, set = (el, k, v) => { if (el._v === undefined) el._v = {}; if (el._v[k] !== v) { el._v[k] = v; if (k === 'txt') el.textContent = v; else el.style.setProperty(k, v); } };
    const pips = (el, n, on) => { const key = n + '/' + on; if (el._pk === key) return; el._pk = key; el.innerHTML = n > 1 ? Array.from({ length: n }, (_, i) => `<i class="${i < on ? '' : 'off'}"></i>`).join('') : ''; };
    const flash = el => { el.classList.remove('rdy'); void el.offsetWidth; el.classList.add('rdy'); };
    { const b = $('tSkill'), n = skMax('K'), total = Math.max(0.1, skCdBase() * (1 - s.cdr) * (1 - pasV('kcd'))), cds = P.chargeCd.slice(0, n), rd = cds.filter(c => c <= 0).length, mn = Math.min(...cds);
      set(b.querySelector('.cdo'), '--p', rd ? (P.gcd > 0 ? (P.gcd / SWAP_GCD).toFixed(3) : '0') : Math.min(1, mn / total).toFixed(3)); set(b.querySelector('.cdn'), 'txt', rd ? '' : String(Math.ceil(mn))); b.classList.toggle('cding', !rd); pips(b.querySelector('.pips'), n, rd);
      if (TOUCH.skRd !== undefined && rd > TOUCH.skRd) flash(b); TOUCH.skRd = rd; }
    { const b = $('tAwk'), g = Math.min(100, P.gauge || 0); set(b.querySelector('.gfill'), '--g', (g / 100).toFixed(3)); b.classList.toggle('full', g >= 100); set(b.querySelector('.cdn'), 'txt', g >= 100 ? '' : Math.floor(g) + '%');
      if (TOUCH.awFull === false && g >= 100) flash(b); TOUCH.awFull = g >= 100; }
    { const b = $('tDodge'), n = skMax('D'); set(b.querySelector('.cdo'), '--p', P.stam > 0 ? '0' : Math.max(0, 1 - (P.stamT || 0) / 1.5).toFixed(3)); pips(b.querySelector('.pips'), n, P.stam);
      if (TOUCH.dgN !== undefined && P.stam > TOUCH.dgN && TOUCH.dgN === 0) flash(b); TOUCH.dgN = P.stam; }
    { const C0 = CL(), M0 = SK_META[wSkill()] || {}, atk = G.cls === 'gunner' ? '사격' : G.cls === 'mage' ? '마력탄' : '공격', key = G.cls + '|' + wSkill();
      if (TOUCH.lblKey !== key) { TOUCH.lblKey = key; $('tAtk').querySelector('span').textContent = atk; $('tSkill').querySelector('span').textContent = M0.K || C0.skill; $('tAwk').querySelector('span').textContent = M0.L || C0.awaken; } } // v2.26 글자만
    { const b = $('tF'), p = G.prompt; b.style.display = p ? '' : 'none';
      if (p) { let t = p.t.replace(/^F\s+/, ''); if (t.length > 11) t = t.slice(0, 10) + '…'; set(b.querySelector('.al'), 'txt', t); b.classList.toggle('bad', !!p.bad); } }
    { const b = $('tWep'), L = myWeapons(G.cls), cw = eqWeapon(G.cls); b.style.display = L.length > 1 && !P.dead ? '' : 'none';
      const key = cw ? cw.id + '/' + L.length : ''; if (b._wk !== key) { b._wk = key; b.innerHTML = cw ? `<span class="wl">무기</span><span class="wc">${L.indexOf(cw) + 1}/${L.length}</span>` : ''; } }
  }
  function touchHud() {
    const show = TOUCH.on && (mode === 'play' || mode === 'map');
    $('touch').classList.toggle('on', show);
    document.body.classList.toggle('portrait', TOUCH.on && fitH > fitW); // v1.78 fit 때 잰 값
    if (!show) { for (const k in TOUCH.held) if (TOUCH.held[k]) { TOUCH.held[k] = false; keyEv('keyup', k); } for (const k in TOUCH.dirs) setDir(k, false); return; }
    if (G && TOUCH.iconCls !== G.cls) {
      TOUCH.iconCls = G.cls; const C = CL(), ic = C.icons || (G.cls === 'ranger' ? ['dual', 'shadow', 'storm'] : ['atk', 'skill', 'awaken']);
      drawIcon32($('tAtk').querySelector('canvas'), ic[0]); drawIcon32($('tSkill').querySelector('canvas'), ic[1]); drawIcon32($('tAwk').querySelector('canvas'), ic[2]); drawIcon32($('tDodge').querySelector('canvas'), 'blink');
      
    }
    if (G && G.player) { const P = G.player, sk = P.chargeCd.some((c, i) => c <= 0 && i < skMax('K')); $('tSkill').classList.toggle('cd', !sk); $('tAwk').classList.toggle('cd', P.gauge < 100); $('tDodge').classList.toggle('cd', P.stam <= 0); touchCd(); }
    if (mode !== 'play' && (gearCmpId !== null || $('gearCmp').classList.contains('on'))) { $('gearCmp').classList.remove('on'); gearCmpId = null; }
  }

  // ---------------------------------------------------------------- 화면 맞춤
  var fitW = 0, fitH = 0, fitTick = 0; // enableTouch가 먼저 fit을 부를 수 있어 var/function으로 끌어올린다
  function viewW() { return window.visualViewport ? visualViewport.width : innerWidth; }
  function viewH() { return window.visualViewport ? visualViewport.height : innerHeight; }
  // 조준 커서: 흰 십자 + 금색 안쪽 끝 + 검은 두꺼운 외곽선 — 어두운 바닥·밝은 이펙트 어디서든 보이게. 게임 화면 배율에 맞춰 1칸 = 게임 2px (도트 칸과 같은 굵기)
  const AIM_CUR = (() => { const N = 11, c = 5, g = Array.from({ length: N }, () => Array(N).fill('.'));
    g[c][c] = 'W'; for (let d = 2; d <= 4; d++) { const ch = d === 2 ? 'Y' : 'W'; g[c][c + d] = g[c][c - d] = g[c + d][c] = g[c - d][c] = ch; }
    const out = g.map(r => r.slice()); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (g[y][x] === '.') { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((g[y + dy] || [])[x + dx] && g[y + dy][x + dx] !== '.') out[y][x] = 'k'; }
    return { rows: out, N, c }; })();
  let aimCurKey = '';
  function setAimCursor(s, dpr) {
    const cell = Math.max(2, Math.round(s * dpr * 2)), key = cell + '|' + dpr; if (key === aimCurKey) return; aimCurKey = key;
    const { rows, N, c } = AIM_CUR, pal = { k: '#0a0608', W: '#fff3d8', Y: '#ffd34d' }, [cc, g] = mkCanvas(N * cell, N * cell);
    rows.forEach((r, y) => r.forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x * cell, y * cell, cell, cell); } }));
    const u = cc.toDataURL(), hs = Math.round((c + 0.5) * cell / dpr), sz = N * cell / dpr;
    if (sz > 128) return; // 브라우저 커서 최대 크기
    cv.style.cursor = dpr === 1 ? `url(${u}) ${hs} ${hs}, crosshair` : `-webkit-image-set(url(${u}) ${dpr}x) ${hs} ${hs}, url(${u}) ${hs} ${hs}, crosshair`;
  }
  function fit() {
    fitW = viewW(); fitH = viewH();
    const fitS = Math.min(fitW / VW, fitH / VH), dpr = window.devicePixelRatio || 1;
    // v1.07: 2px 칸 하나가 모니터 픽셀 정수 개가 되게 (윈도 배율 125%·150% 포함). 0.25 단위 CSS 배율이면 칸이 3·4px로 섞여 움직일 때 우글거림
    const dev = Math.max(1, Math.floor(fitS * dpr * 2) / 2);
    let s = typeof TOUCH !== 'undefined' && TOUCH.on ? fitS : dev / dpr; // 모바일은 화면에 꽉 차게
    if (window.PX1_ON) s = 0.5 / dpr; // v3.19 1px 도트 보기(F7): 도트 한 칸 = 모니터 픽셀 하나 → 화면이 384×216 그대로
    const wrap = $('wrap');
    wrap.style.width = `${VW * s}px`; wrap.style.height = `${VH * s}px`;
    cv.style.width = `${VW * s}px`; cv.style.height = `${VH * s}px`;
    $('ui').style.transform = `scale(${s})`;
    setAimCursor(s, dpr);
    if (typeof TOUCH !== 'undefined' && TOUCH.on) {
      const u = Math.max(0.75, Math.min(1.35, fitH / 400)), side = (fitW - VW * s) / 2;
      const t = $('touch'); t.style.setProperty('--u', u.toFixed(3)); t.classList.toggle('side', side >= 46 * u);
    }
  }
  addEventListener('resize', fit); addEventListener('orientationchange', () => { fit(); setTimeout(fit, 250); setTimeout(fit, 700); });
  if (window.visualViewport) visualViewport.addEventListener('resize', fit);
  fit();

  // ---------------------------------------------------------------- 성능 측정 (F8 켜기/끄기 · F9 화면 도트화 단계 켜기/끄기) — 실제 PC에서 어디가 무거운지 보는 용도
  const PERF = { on: false, noPP: false, n: 0, fr: 0, up: 0, rd: 0, pp: 0, li: 0, mx: 0, prev: 0, t0: 0, el: null };
  function perfTick(now, a, b) {
    const e = performance.now(), gap = PERF.prev ? now - PERF.prev : 16.7; PERF.prev = now;
    PERF.n++; PERF.fr += gap; PERF.up += b - a; PERF.rd += e - b; if (gap > PERF.mx) PERF.mx = gap;
    if (now - PERF.t0 < 1000) return;
    const n = PERF.n, f = v => (v / n).toFixed(1);
    PERF.el.textContent = `FPS ${Math.round(1000 / (PERF.fr / n))} · 가장 긴 프레임 ${PERF.mx.toFixed(0)}ms | 계산 ${f(PERF.up)} · 그리기 ${f(PERF.rd)} (도트화 ${PERF.noPP ? '끔' : f(PERF.pp)} · 조명 ${f(PERF.li)}) ms | F9 도트화 ${PERF.noPP ? '끔' : '켬'}`;
    PERF.n = 0; PERF.fr = PERF.up = PERF.rd = PERF.pp = PERF.li = PERF.mx = 0; PERF.t0 = now;
  }
  addEventListener('keydown', e => {
    if (e.key !== 'F8' && e.key !== 'F9') return; e.preventDefault();
    if (!PERF.el) { const d = document.createElement('div'); d.style.cssText = "position:absolute;left:50%;top:2px;transform:translateX(-50%);z-index:80;padding:1px 5px;background:#000;color:#9fe870;font-family:'Galmuri7';font-size:8px;white-space:nowrap;pointer-events:none"; $('ui').appendChild(d); PERF.el = d; }
    if (e.key === 'F8') { PERF.on = !PERF.on; PERF.t0 = 0; PERF.prev = 0; PERF.el.style.display = PERF.on ? '' : 'none'; PERF.el.textContent = '측정 중…'; if (!PERF.on) PERF.noPP = false; }
    else if (PERF.on) PERF.noPP = !PERF.noPP;
  });
;

// ==================================================================== 17_main.js
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
      title: '네로 — 고양이 암살자',
      prologue: '밤보다 옅은 발소리로 전장을 스치는 암살자. 버려진 역참의 다락에서 눈을 떴을 때, 계약서에 적힌 의뢰인의 이름은 이미 찢겨 나가 있었다. 계약서에는 처리할 대상 셋과, 일을 마치면 왕도에서 보수를 치른다는 문장만 남아 있었다. 네로는 본능적으로 피 냄새의 근원인 왕도를 향해 발걸음을 옮겼다.',
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
      prologue: '종이 멈춘 수도원에서 마지막까지 기도를 멈추지 않았던 사제. 대답 없는 하늘을 향해 수백 번 종을 울린 끝에, 미레아는 신의 목소리가 끊긴 성지들을 직접 순례하기로 했다. 옛 순례길은 침묵한 땅들을 지나 왕도로 이어져 있었다.', // v3.83 순례
      endings: {
        normal: {
          title: '응답 대신 내린 재',
          hint: '잿빛 왕을 쓰러뜨리면 기록됩니다.',
          text: [
            '메이스의 마지막 일격에도 잿빛 왕은 무릎을 꿇지 않았다. 지친 어깨를 그대로 편 채 잿더미로 굳어 갔고, 머리에서 미끄러진 왕관이 미레아의 발치에서 멈추었다.',
            '미레아는 굳은 왕 앞에서 짧은 장례의 기도를 올렸다. 왕관을 거두려 손을 뻗자 왕관은 세 조각으로 쪼개져 흩어졌다. 하늘에서 내려온 것은 응답이 아니라 하얀 재였다.',
            '눈을 뜬 곳은 종이 멈춘 수도원의 제단 앞이었다. 종소리도, 신의 목소리도 들리지 않았다. 미레아는 두 손을 모았다. 이 침묵이 무엇을 뜻하는지 확인하기 위해, 미레아는 다시 왕도로 가는 순례길에 올랐다.'
          ]
        }
      }
    },
    gunner: {
      title: '그레이브 — 늑대 총잡이',
      prologue: '이름 없는 묘지에서 눈을 뜬 떠돌이 총잡이. 어떻게 이곳까지 왔는지는 기억나지 않았다. 머스킷에는 단 한 발이 장전되어 있었고, 묘지 한구석의 비석 하나에는 본 적 없는 문양이 새겨져 있었다. 그레이브는 그 한 발을 쏠 곳을 찾아 길을 나섰다.', // v3.83 장의사 설정 폐기 → 한 발 남은 총잡이
      endings: {
        normal: {
          title: '마지막 한 발',
          hint: '잿빛 왕을 쓰러뜨리면 기록됩니다.',
          text: [
            '마지막 한 발이 심장을 꿰뚫었지만, 잿빛 왕은 쓰러지지 않았다. 선 채로 잿더미가 되어 굳었고, 머리에서 떨어진 왕관만이 화약 연기 속을 굴러 그레이브의 장화 앞에서 멈추었다.',
            '한 발을 쏘고도 끝난 것은 없었다. 굳은 왕의 손목에는 낡은 가죽 끈이 감겨 있었지만, 그레이브는 그 매듭을 눈여겨보지 않았다. 하다못해 왕관이라도 거두려 손을 뻗자, 왕관은 세 조각으로 쪼개졌고 하얀 재가 쏟아졌다.',
            '그레이브는 이름 없는 묘지에서 눈을 떴다. 머스킷에는 어느새 한 발이 장전되어 있었고, 바람에는 익숙한 화약 냄새가 섞여 있었다. 그레이브는 그 한 발을 쏠 곳을 찾아 다시 잿빛 왕도로 길을 나섰다.'
          ]
        }
      }
    }
  };

  const STAGE_PARCHMENT = { // v3.66 일반 루트 캐릭터별 스토리 (claude/일반루트_캐릭터별스토리_게임반영안.md)
    1: {"title": "제1장 · 빛바랜 초원", "knight": ["빛이 바랜 변경의 들판. 마른 풀잎마다 오래전에 식은 재가 서리처럼 내려앉아 있다.", "알드릭은 오른팔을 감싼 붕대를 풀어 눌어붙은 문장 자국을 살폈다. 반쯤 녹은 자국은 잠잠했다. 왕의 흔적을 직접 마주하기 전까지는 아무것도 알려 주지 않을 듯했다."], "ranger": ["바람이 멈춘 초원 위로 썩은 점액과 쇠 비린내가 낮게 깔린다. 사냥감을 숨겨 줄 그림자조차 얕은 땅이다.", "네로는 발끝으로 풀숲의 감촉을 재었다. 찢긴 계약서에 남은 냄새가 이 들판을 지나 왕도 쪽으로 이어졌다."], "mage": ["시간이 멈춘 듯한 들판. 대기 속 마력은 흩어져 있으면서도 어딘가 한 방향으로 끌려가고 있다.", "세리안은 수첩에 흐름을 기록했다. 그 방향의 끝은 왕도와 겹쳐 있었다."], "priest": ["기도 소리 대신 괴물들의 신음만 맴도는 들판. 길가의 작은 사당에는 꺼진 등불과 마른 꽃만 남아 있었다.", "미레아는 사당 앞에서 무릎을 꿇었지만, 이번에도 응답은 없었다. 이끼 낀 순례 이정표만이 희미하게 왕도를 가리키고 있었다."], "gunner": ["화약 냄새보다 먼저 습한 점액과 재 냄새가 코끝을 찌른다. 늑대의 눈에도 이 들판의 끝은 가늠되지 않는다.", "그레이브는 머스킷의 격철을 확인했다. 장전된 한 발을 아무 데나 쓸 생각은 없었다."]},
    2: {"title": "제2장 · 무너진 성채", "knight": ["무너진 회랑에는 왕국의 깃발이 찢긴 채 매달려 있다. 돌벽마다 새겨진 기사단의 문장은 알드릭의 오른팔 자국과 어딘가 닮아 보였다.", "성채 안으로 들어설수록 팔의 통증이 되살아났다. 알드릭은 문장의 흔적을 찾아 회랑 깊숙이 향했다."], "ranger": ["꺼진 횃불과 눅눅한 돌벽이 미로처럼 이어진다. 벽면의 검흔은 이곳을 지나간 누군가가 필사적으로 빠져나가려 했음을 말해 준다.", "네로는 흔적을 따라갔다. 어쩌면 의뢰인이 남긴 자국일지도 모른다."], "mage": ["성채 안에는 역병과 금지된 의식의 잔재가 엉켜 있다. 벽에 새겨진 주문들은 파편의 마력 흐름과 같은 방향으로 배열되어 있었다.", "세리안은 코트를 여미고 기록을 시작했다. 이 성채는 오래전부터 무언가를 붙들어 두고 있었다."], "priest": ["부서진 제단과 쓰러진 성녀상 위로 검은 곰팡이가 번져 있다. 순례자들이 쉬어 가던 성채의 예배당은 오래전에 버려졌다.", "미레아는 예배당에 남은 순례자 명부를 펼쳤다. 마지막 몇 장에는 하나같이 「왕도로」라는 글자만 적혀 있었다."], "gunner": ["갑옷이 썩어 가는 냄새와 젖은 돌 냄새가 폐부를 채운다. 쓰러져야 할 기사들이 창을 놓지 않은 채 회랑을 지키고 있었다.", "그레이브는 탄약을 세었다. 죽은 놈들이 길을 막는다면, 한 번 더 눕혀 줄 뿐이었다."]},
    3: {"title": "제3장 · 핏빛 엄니 부락", "knight": ["협곡의 북소리가 대지를 울린다. 크루가쉬는 왕관 조각을 전리품처럼 지니고, 부락의 전사들은 그 힘을 두고 싸우고 있었다.", "알드릭의 오른팔은 부락에 들어선 뒤부터 쉬지 않고 욱신거렸다. 파편이 가까이 있다는 신호인지, 더 큰 위험이 기다린다는 경고인지 알 수 없었다."], "ranger": ["함성과 횃불이 사방에서 밀려온다. 크루가쉬는 파편을 전리품으로 삼고, 부락의 전사들은 그것을 빼앗으려 서로 싸우고 있었다.", "네로는 피 냄새가 한곳에만 머물지 않는다는 걸 알아차렸다. 이 파편을 쫓는 추적자는 자신만이 아니었다."], "mage": ["식지 않는 열기가 마력의 흐름마저 일렁이게 만든다. 부락의 토템과 뼈 장식은 파편의 문양을 흉내 내듯 배열되어 있었다.", "세리안은 이것이 주술인지 모방인지 알 수 없었다. 다만 모든 흔적이 왕도 쪽을 가리키고 있었다."], "priest": ["전쟁의 광기와 핏빛 환호가 협곡을 가득 채운다. 이 땅에서는 기도가 아니라 뼈나팔이 하늘을 향해 울린다.", "옛 순례길은 부락 한가운데를 지나고 있었다. 짓밟힌 길가의 돌무더기 위에는 앞서 간 순례자의 표식이 왕도 쪽을 향해 놓여 있었다."], "gunner": ["가죽 타는 냄새와 뜨거운 화기가 협곡을 채운다. 부락의 전사들은 파편을 두고 서로 죽이며, 북소리는 그들의 죽음을 덮어 버린다.", "그레이브는 낮은 휘파람을 불었다. 싸움판 한가운데에 조각이 있다면, 가장 시끄러운 곳으로 가면 될 일이었다."]},
    4: {"title": "제4장 · 잿빛 왕도", "knight": ["흰 재가 눈처럼 내리는 수도. 성벽과 바닥에는 알드릭의 오른팔에 눌어붙은 것과 같은 문장이 되풀이되어 있었다.", "왕도에 가까워질수록 통증은 걷기 어려울 만큼 강해졌다. 이제 문장은 방향뿐 아니라 왕궁의 중심까지 알드릭을 이끌고 있었다."], "ranger": ["소리마저 재에 파묻힌 죽은 도시. 겹겹이 찍힌 발자국은 이곳에 다다른 이들이 하나같이 돌아가지 못했음을 보여 준다.", "네로는 복면을 고쳐 썼다. 의뢰인은 보이지 않지만, 계약의 끝은 왕궁 안에 있었다."], "mage": ["흰 재가 내리는 수도. 거리와 성벽의 문양은 거대한 술식의 일부처럼 되풀이되고, 모든 흐름은 왕궁으로 모이고 있었다.", "세리안은 수첩의 마지막 빈칸을 남겨 두었다. 그 답은 왕궁 안에서 직접 확인해야 했다."], "priest": ["부러진 종탑이 재의 하늘을 찌르고 있다. 순례길의 끝, 왕도의 대성당에서도 종소리는 들리지 않았다.", "미레아는 마지막으로 눈을 감았다 떴다. 이제 답을 기다리는 대신, 침묵의 중심으로 걸어가기로 했다."], "gunner": ["모든 발자국이 흰 재에 덮여 사라지는 도시. 무너진 성벽 아래에는 묻히지 못한 자들의 흔적이 겹겹이 쌓여 있다.", "그레이브는 남은 한 발을 다시 확인했다. 이 도시 어딘가에 그 한 발의 주인이 있었다."]}
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
      .stPaper { position: relative; width: 432px; padding: 14px 28px 24px 26px; /* v3.83 아래 여백 17→24: 오른쪽·아래 그림자 4px와 해진 가장자리만큼 위보다 좁아 보이던 것 */ background-repeat: no-repeat; image-rendering: pixelated; }
      .stCls { display: block; text-align: right; margin-bottom: 4px; font-family: 'Galmuri7'; font-size: 8px; color: #6e5232; }
      .stBody { display: flex; flex-direction: column; gap: 6px; }
      .stPara { position: relative; word-break: keep-all; font-family: 'Galmuri9'; font-size: 10px; line-height: 16px; color: #2a1a0e; }
      .stPara .rest { visibility: hidden; }
      .stPara.wait { visibility: hidden; }
      .stFoot { display: flex; justify-content: center; gap: 12px; margin-top: 7px; font-family: 'Galmuri7'; font-size: 8px; color: var(--quiet); }
      .stFoot > span { display: inline-flex; align-items: center; gap: 3px; }
      .stFoot #parchSkip { cursor: pointer; } .stFoot #parchSkip:hover { color: var(--ink); }
      .parchHL { color: #c0601a; } /* v3.20 양피지 · 진실 기록의 {강조} — 말주머니 강조색과 같음 */
      /* v3.83 커서를 글 흐름 밖(absolute)으로 — 커서 폭·줄바꿈 기회 때문에 글자가 찍힐 때마다 줄 수가 바뀌어 양피지 높이·위치가 요동치던 문제 */
      .stCaret { position: absolute; display: inline-block; width: 4px; height: 8px; margin: 4px 0 0 1px; background: #2a1a0e; animation: blink .6s steps(2) infinite; }

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
;
