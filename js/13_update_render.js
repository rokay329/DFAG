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
  function showResult(win) {
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
      if (L >= A.max && A.max < ASC_MAX) { A.max = L + 1; A.sel = A.max; ascMsg = L === 0 ? ` · 잿불 단계가 열렸다 (잿불 1 — ${ASC[1].n})` : ` · 잿불 ${L} 돌파 — 잿불 ${L + 1}(${ASC[L + 1].n})이 열렸다`; }
      else if (L > 0) ascMsg = ` · 잿불 ${L} 돌파`; }
    persist();
    resultShowAll = false;
    $('resTitle').textContent = win ? '원정 완료' : '사망';
    $('resTitle').style.color = win ? 'var(--gold-l)' : '#ff7070';
    const chMsg = newChronicle ? ` · [전서 기록: ${newChronicle.label}]` : '';
    $('resSub').textContent = win ? `STAGE ${Array.from({ length: G.stage }, (_, i) => i + 1).join(' · ')} 돌파 · 처치 수 ${G.kills} · ${opened ? '오크 부락이 열렸다 — 다음 원정은 STAGE 3까지 이어진다' : '다음 원정은 다시 빈손으로 시작한다'}${ascMsg}${chMsg}` : `STAGE ${G.stage} ${G.dun && G.dun.cur ? ROOM_N[G.dun.cur.type] : ''}에서 쓰러졌다 · 장비 ${G.lostItems}개와 모든 재료·골드를 잃었다`;
    if (G.newUnl && G.newUnl.length) $('resSub').textContent += ' · 새로 열림: ' + G.newUnl.map(id => { const u = UNLOCKS.find(x => x.id === id); if (id.startsWith('w:')) { const [, c, i] = id.split(':'), W0 = wcat(c)[+i]; return `${GRADES.find(x => x.k === W0.grade).n} 무기 「${W0.name}」`; } return u && u.kind === 'r' ? RELICS[u.key].n : id; }).join(', ') + ' (코코아의 기록 보관소)'; // v2.29
    renderResultItems(win);
    $('ovResult').classList.add('on');
  }
  function renderResultItems(win) {
    const list = !win ? [] : resultShowAll ? SAVE.inv.slice().reverse() : [...G.newItems, ...G.fieldItems];
    $('resItems').innerHTML = list.length ? list.map(it => itemCard(it, true, !resultShowAll)).join('') : `<p>${!win ? '남은 장비가 없다.' : resultShowAll ? '보유 장비가 없다.' : '획득한 장비가 없다.'}</p>`;
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
  const SAFE = { cx: (136 + VW) / 2, cy: (70 + 350) / 2 }; // UI 패널을 뺀 화면 영역의 중심
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
    const bk = snap ? 1 : Math.min(1, dt * 2.5), bxT = G.boss && !G.boss.dead ? (G.boss.x - P.x) * 0.15 : 0, byT = G.boss && !G.boss.dead ? (G.boss.y - P.y) * 0.15 : 0;
    cam.bx = (cam.bx || 0) + (bxT - (cam.bx || 0)) * bk; cam.by = (cam.by || 0) + (byT - (cam.by || 0)) * bk;
    let tx = P.x - SAFE.cx + cam.bx, ty = P.y - 10 - SAFE.cy + cam.by;
    { const x0 = A.x0 - 136, x1 = A.x1 + 16 - VW, y0 = A.y0 - (G.stage === 3 && G.dun && G.dun.cur && G.dun.cur.type === 'boss' ? 150 : 100), y1 = A.y1 + 88 - VH;
      const cx = x1 >= x0 ? clamp(tx, x0, x1) : (x0 + x1) / 2, cy = y1 >= y0 ? clamp(ty, y0, y1) : (y0 + y1) / 2; cam.clX = cx !== tx; cam.clY = cy !== ty; tx = cx; ty = cy; }
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
    if (G && TRUTH.busy()) { TRUTH.update(rdt); return; } // v2.58 진엔딩 단서 대화 · 연출 중엔 조작 없음
    if (G && G.dun && G.dun.arch && ARCH.update(rdt)) return; // v3.00 코코아의 기록 보관소: 인사 · ESC로 나가기
    if (G && G.dun && G.dun.home && HOME.update(rdt)) return; // v2.55 시작 장소: 대사 · 장소 이름 · 아래 문으로 나가면 출발
    if (take('escape')) { openPause(); return; }
    if (take('tab')) { openMap(); return; }
    if (take('i')) { if (!G.player.dead && !G.trans) openInv('play'); return; }
    for (const n of ['1', '2', '3']) if (take(n)) { swapWeapon(+n - 1); break; } // v2.19 숫자키로 무기 바꾸기 (장비창 오른쪽 칸 순서)
    if (take('h')) { G.kg = !G.kg; G.kgT = G.kg ? 999 : 0; G.kgAuto = false; sfx('blip'); }
    if (G.tut && !G.cine) updateTut(rdt);
    if (G.kg && G.kgT < 900) { G.kgT -= rdt; if (G.kgT <= 0) G.kg = false; }
    const dbgK = k => { if (pressed[k] !== 'shift') return false; pressed[k] = false; return true; }; // v1.14 테스트 키는 Shift와 함께 (Shift+N·B·V·T·R), 그냥 누르면 아무 일 없음
    if (dbgK('n') && !G.clear) debugClearRoom();
    if (dbgK('v')) { debugStageClear(); return; }
    if (dbgK('t')) { // 테스트: 무기 등급 순환 (커먼 → 레어 → 유니크 → 레전더리)
      const cw0 = eqWeapon(G.cls), nk = ((cw0 && cw0.wk != null ? cw0.wk : 0) + 1) % wcat(G.cls).length, W1 = wcat(G.cls)[nk]; // v2.03 도감 무기를 차례로
      const it = makeItem(G.cls, { grade: W1.grade, slot: 'weapon', wk: nk, noCurse: true }); lootFeed(`테스트 무기 ${nk + 1}/${wcat(G.cls).length} — ${it.name}`, gradeOf(it).c, 2500);
      SAVE.inv.push(it); eqOf(G.cls).weapon = it.id; G.stats = calcStats(G.buffs); persist();
      lootFeed(`<b style="color:${gradeOf(it).c}">[${gradeOf(it).n}] ${it.name}</b> 장착 (테스트)`, gradeOf(it).c); sfx('drop'); if (it.grade === 'legend') { if (G.seenLegendLore) delete G.seenLegendLore[it.fx]; triggerLegendPickup(it); }
    }
    if (dbgK('p')) { const cs = ['r', 'b', 'g'], c = cs[(G.engDbg = ((G.engDbg || 0) + 1)) % 3 === 1 ? 0 : G.engDbg % 3 === 2 ? 1 : 2], n = G.pal[c] || 0, nx = HUE_TIER.find(v => v > n); if (nx) hueGain(c, nx - n); } // v2.41 테스트: 색 단계 올리기 (각인 고르기)
    if (dbgK('o')) { GOD_MODE = !GOD_MODE; lootFeed(GOD_MODE ? '테스트 — 무적 켜짐' : '테스트 — 무적 꺼짐', GOD_MODE ? '#9fd2ff' : '#9a8f8a', 2500); sfx('blip'); } // v2.40 테스트: 무적 켜기·끄기
    if (dbgK('y')) { const P = G.player; spawnLoot('gear', P.x + 30, P.y, makeRBY(G.cls)); hueGain('r', 10); lootFeed('테스트 — RGB? · 색 조각 +10', '#ff2a2a', 2500); } // v2.40 테스트: RGB? 떨어뜨림 + 색 조각
    if (dbgK('b') && !G.clear && G.dun.cur.type !== 'boss') debugToBoss();
    if (dbgK('r') && !G.clear && !G.trans && !G.cine) debugToRest(); // v3.10 테스트: 휴게방으로
    if (dbgK('g') && !G.clear && !G.trans && G.dun.cur.type !== 'boss' && !G.dun.forge && !G.enemies.some(x => !x.dead && INV_MAP[x.type])) { const R = G.dun.cur; R.invade = R.invade || INV_KIND[G.stage] || 'panda'; R.invaded = true; R.cleared = false; startInvasion(R); } // v1.57 테스트: 난입자 소환

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
    TRUTH.tick(dt); // v2.58
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
        const b = live[j], d = dist(a, b), m = a.r + b.r;
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
    if (t.shape === 'circle') ctx.arc(t.x, t.y, Math.max(0.1, t.r * k), 0, TAU);
    else if (t.shape === 'cone') { ctx.moveTo(t.x, t.y); ctx.arc(t.x, t.y, Math.max(0.1, t.r * k), t.ang - t.arc / 2, t.ang + t.arc / 2); ctx.closePath(); }
    else if (t.shape === 'line') {
      const ux = Math.cos(t.ang), uy = Math.sin(t.ang), nx = -uy * t.w / 2, ny = ux * t.w / 2, L = t.len * k;
      ctx.moveTo(t.x + nx, t.y + ny); ctx.lineTo(t.x + ux * L + nx, t.y + uy * L + ny); ctx.lineTo(t.x + ux * L - nx, t.y + uy * L - ny); ctx.lineTo(t.x - nx, t.y - ny); ctx.closePath();
    }
  }
  function teleFront(t, p) {
    ctx.beginPath();
    if (t.shape === 'circle') ctx.arc(t.x, t.y, Math.max(0.1, t.r * p), 0, TAU);
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
  function drawShadow(x, y, w) { const c = AURA_MAIN || ctx; c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(x, y, w, w * 0.32, 0, 0, TAU); c.fill(); }
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
  const SLASH_COL = { knight: '#ece6e2', ranger: '#ffc8a8', priest: '#ffd34d', holy: '#ffd34d', ice: '#9fd2ff', storm: '#7affb0', shadow: '#c08cff' };
  function drawSlashPx(trail, px, py, rout, col, heavy) {
    const n = trail.length; if (n < 2) return;
    const A = [trail[0].a]; for (let i = 1; i < n; i++) A.push(A[i - 1] + angDiff(trail[i].a, trail[i - 1].a));
    const tot = Math.abs(A[n - 1] - A[0]) || 1e-6, thMax = rout * 0.4 * (heavy ? 1.15 : 1), seen = new Set();
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = col;
    for (let i = 1; i < n; i++) {
      const life = Math.ceil(clamp(trail[i].t / 0.11, 0, 1) * 4) / 4, a0 = A[i - 1], a1 = A[i], m = Math.max(1, Math.ceil(Math.abs(a1 - a0) * rout / 1.6));
      for (let j = 0; j <= m; j++) { const a = a0 + (a1 - a0) * j / m, u = Math.abs(a - A[0]) / tot, th = thMax * Math.pow(Math.sin(Math.PI * clamp(u, 0, 1)), 0.9) * (0.35 + 0.65 * life), ca = Math.cos(a), sa = Math.sin(a);
        for (let d = 0; d <= th; d += 1.5) { const x = snap2(px + ca * (rout - d)), y = snap2(py + sa * (rout - d)), key = x * 8192 + y; if (seen.has(key)) continue; seen.add(key); ctx.fillRect(x, y, 2, 2); } }
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
  function drawArm(x, y, ang, len, w, white, back, pal) { drawBlade(cellLimb('arm', pal || 'butcher', len, w, back), x, y, ang, 1, white); }
  function drawArmOld(x, y, ang, len, w, white, back, pal) {
    const P = PAL[pal || 'butcher'], skin = white ? '#ffffff' : back ? P.S : P.s;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang);
    ctx.fillStyle = P.k; ctx.fillRect(-2, -w / 2 - 1, len + 2, w + 2);
    ctx.fillStyle = skin; ctx.fillRect(-1, -w / 2, len, w);
    if (!white) {
      ctx.fillStyle = back ? '#5a4036' : '#d0a892'; ctx.fillRect(-1, -w / 2, len, 1);
      ctx.fillStyle = P.c; ctx.fillRect(len - 10, -w / 2 - 1, 2, w + 2); ctx.fillRect(len - 6, -w / 2 - 1, 2, w + 2);
      ctx.fillStyle = P.C; ctx.fillRect(len - 8, -w / 2 - 1, 2, w + 2);
    }
    ctx.fillStyle = P.k; ctx.fillRect(len - 1, -w / 2 - 2, 9, w + 4);
    ctx.fillStyle = skin; ctx.fillRect(len, -w / 2 - 1, 7, w + 2);
    if (!white) { ctx.fillStyle = P.k; ctx.fillRect(len + 3, -w / 2, 1, w); ctx.fillStyle = P.b; ctx.fillRect(len + 4, -w / 2 - 1, 3, 2); ctx.fillRect(len + 1, w / 2 - 1, 2, 2); }
    ctx.restore();
  }
  // 누더기 거인 팔: 위팔 → 팔꿈치(뼈가 비죽) → 아래팔 → 길게 뻗은 손가락. 꿰맨 자국과 썩은 상처
  function drawZombieArm(x, y, ang, len, white, back) { drawBlade(cellLimb('zombie', 'abom', len + 4, 8, back), x, y, ang, 1, white); }
  function drawZombieArmOld(x, y, ang, len, white, back) {
    const P = PAL.abom, skin = white ? '#ffffff' : back ? '#4e564a' : P.s, dark = white ? '#ffffff' : back ? '#363c34' : P.S, hi = white ? '#ffffff' : back ? '#5e665a' : '#a8b09c';
    const hx = x + Math.cos(ang) * len, hy = y + Math.sin(ang) * len;
    let px = -Math.sin(ang), py = Math.cos(ang); if (py < 0) { px = -px; py = -py; }
    const ex = (x + hx) / 2 + px * 4, ey = (y + hy) / 2 + py * 4;
    const seg = (x0, y0, x1, y1, w, col) => { const L = Math.hypot(x1 - x0, y1 - y0); ctx.save(); ctx.translate(Math.round(x0), Math.round(y0)); ctx.rotate(Math.atan2(y1 - y0, x1 - x0)); ctx.fillStyle = col; ctx.fillRect(-1, -w / 2, L + 2, w); ctx.restore(); };
    // 윤곽
    seg(x, y, ex, ey, 9, P.k); seg(ex, ey, hx, hy, 7, P.k);
    // 위팔 (굵고 축 늘어짐) · 아래팔 (말라붙어 가늘다)
    seg(x, y, ex, ey, 7, skin); seg(ex, ey, hx, hy, 5, skin);
    if (!white) {
      seg(x, y, ex, ey, 2, hi); seg(ex, ey, hx, hy, 1, hi);
      const ux = (ex - x), uy = (ey - y);
      ctx.fillStyle = dark; ctx.fillRect(Math.round(x + ux * 0.6 + px * 2), Math.round(y + uy * 0.6 + py * 2), 3, 2);
      ctx.fillStyle = P.c; // 꿰맨 자국
      for (const t of [0.35, 0.6]) { const sx = Math.round(x + ux * t), sy = Math.round(y + uy * t); ctx.fillRect(sx - 1, sy - 2, 1, 4); ctx.fillRect(sx - 2, sy - 1, 3, 1); ctx.fillRect(sx - 2, sy + 1, 3, 1); }
      const fx = ex + (hx - ex) * 0.45, fy = ey + (hy - ey) * 0.45; // 썩은 상처
      ctx.fillStyle = P.A; ctx.fillRect(Math.round(fx) - 1, Math.round(fy) - 1, 3, 3); ctx.fillStyle = P.a; ctx.fillRect(Math.round(fx), Math.round(fy) - 1, 2, 2);
      ctx.fillStyle = P.k; ctx.fillRect(Math.round(ex + px * 3) - 1, Math.round(ey + py * 3) - 1, 4, 4); ctx.fillStyle = P.b; ctx.fillRect(Math.round(ex + px * 3), Math.round(ey + py * 3), 2, 2); // 팔꿈치 뼈
    }
    // 손: 손바닥 + 길게 갈라진 손가락 3개, 끝은 뼈가 드러난 손톱
    ctx.fillStyle = P.k; ctx.fillRect(Math.round(hx) - 3, Math.round(hy) - 3, 7, 7);
    ctx.fillStyle = skin; ctx.fillRect(Math.round(hx) - 2, Math.round(hy) - 2, 5, 5);
    for (const off of [-0.45, 0, 0.45]) {
      const a2 = ang + off, L2 = off ? 6 : 8, tx = hx + Math.cos(a2) * L2, ty = hy + Math.sin(a2) * L2;
      seg(hx, hy, tx, ty, 3, P.k); seg(hx, hy, tx, ty, 1.4, skin);
      if (!white) { ctx.fillStyle = P.b; ctx.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 2, 2); }
    }
  }
  function drawButcher(e, ya, al) {
    const white = e.flash > 0, lf = e.lift || 0;
    const hobM = e.kind === 'hob'; // v1.37 고블린 대장: 몸통·다리를 따로, 웅크림·착지는 칸 단위로 내려앉음 (늘이기 제거)
    let hbob = 0, hlL = 0, hlR = 0;
    if (hobM) { if (e.state === 'chase') { const ph = Math.floor(e.walk * 0.9) % 4; if (ph === 0) hlL = -2; else if (ph === 2) hlR = -2; else hbob = 2; }
      if (e.state === 'wind' && e.pat === 1 && e.glow < 0.25) hbob = e.glow < 0.12 ? 2 : 4;
      if (e.state === 'wind' && e.pat === 2) { hbob = 2; if (Math.floor(time * 9) % 2) hlR = -2; }
      if (e.state === 'dash') { if (Math.floor(time * 12) % 2) { hlL = -2; } else { hlR = -2; hbob = -2; } }
      if (e.squash > 0) hbob = e.squash > 0.1 ? 4 : 2; }
    const sq = hobM ? 1 : e.squash > 0 ? 1 - 0.2 * (e.squash / 0.2) : 1 + Math.sin(e.walk * 2) * 0.03;
    const sx = hobM ? 1 : e.squash > 0 ? 1 + 0.18 * (e.squash / 0.2) : 1;
    const crouch = hobM ? 1 : e.state === 'wind' && e.pat === 1 && e.glow < 0.25 ? 1 - 0.14 * (e.glow / 0.25) : 1;
    const tr = e.enraged ? rand(-0.6, 0.6) : 0;
    drawShadow(e.x, e.y + 2, 17 - Math.min(7, lf * 0.3));
    const bp = e.kind === 'hob' ? 'hob' : 'abom';
    // 어깨는 큰 머리 바깥쪽 몸통 끝에 (v0.60: 팔을 들 때 머리 옆에 붙어 보이던 문제)
    const by0 = e.y + 2 + ya - lf, by = by0 + hbob, shY = by - (bp === 'hob' ? 21 : 22) * sq * crouch, so = bp === 'hob' ? 11 : 12;
    const fx = e.x + e.face * so + tr, bx = e.x - e.face * so + tr;
    if (e.armTrail && e.armTrail.length > 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; enemyTrail(e, e.armTrail, fx, shY, 8, 30, '255,60,40', true); ctx.restore(); }
    if (bp === 'abom') drawZombieArm(bx, shY, e.armB, 20, white, true); else drawArm(bx, shY, e.armB, 20, 5, white, true, bp);
    if (hobM) { const ro = e.lean + (e.grogiT > 0 ? 0.25 * e.face : 0); drawSprite('hbLegL', 'hob', 2, e.x + tr, by0 + hlL, e.face < 0, { white, rot: ro, alpha: al }); drawSprite('hbLegR', 'hob', 2, e.x + tr, by0 + hlR, e.face < 0, { white, rot: ro, alpha: al }); drawSprite('hbBody', 'hob', 2, e.x + tr, by, e.face < 0, { white, rot: ro, alpha: al }); }
    else drawSprite('abom', bp, 2, e.x + tr, by, e.face < 0, { white, rot: e.lean + (e.grogiT > 0 ? 0.25 * e.face : 0), alpha: al, sx, sy: sq * crouch });
    if (bp === 'abom') drawZombieArm(fx, shY, e.armA, 20, white, false); else drawArm(fx, shY, e.armA, 20, 5, white, false, bp);
    if (e.grogiT > 0) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(by - 50 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); } }
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
