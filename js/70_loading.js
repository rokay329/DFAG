'use strict';
// 잿빛 왕관 원정대 — 70_loading.js : v3.65 진짜 로딩 — 「다시 뜨는 초승달」 창을 로딩 화면으로 씀
//  · 로딩 작업 목록(LOADQ): 한 프레임에 약 12ms씩 작업을 처리 · 작업이 다 끝나고 최소 시간이 지나야 닫힘 · 키 · 클릭으로 넘길 수 없음 (v3.66 준비가 끝나고 달이 정해진 바퀴 수만큼 졌다가 다시 떠야 닫힘 — 해가 뜨지 않는 세계)
//  · 처음 시작 · 원정 실패 뒤 다시 깨어날 때(시작 장소): 1장 던전을 미리 만들고 시작 방 · 가까운 방 바닥 그림을 미리 그려 둠
//  · 장 넘어갈 때: 던전 생성 + 시작 방 · 가까운 방 바닥 그림을 달 창이 도는 동안 처리한 뒤 월드맵으로
//  · 게임 중 틈날 때(방을 비운 조용한 시간): 문으로 이어진 이웃 방 바닥 그림을 1.5초에 한 방씩 미리 그림
window.MOONSKY_OFF = true; // 예전 「실패 뒤 초승달」 연출은 이 로딩 화면이 대신함
const LOADQ = (() => {
  let S = null;
  const DUR = MOONSKY.DUR, LOOP = DUR - 0.75;
  // ---------------------------------------------------------------- 방 그림 미리 그리기 (지금 보이는 방의 상태를 건드리지 않게 저장 → 그리기 → 되돌림)
  const tmp = {};
  const snapCv = (k, cv) => { const c = tmp[k] || (tmp[k] = mkCanvas(cv.width, cv.height)[0]); const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.drawImage(cv, 0, 0); return c; };
  const backCv = (k, gg) => { const c = tmp[k]; gg.clearRect(0, 0, gg.canvas.width, gg.canvas.height); gg.drawImage(c, 0, 0); };
  function withCtx(D, fn) {
    const k = { A: Object.assign({}, A), CX, CY, PIL: PILLARS.slice(), TOR: TORCHES.map(t => Object.assign({}, t)), DOOR: JSON.parse(JSON.stringify(DOOR)), NC, NR, RS: ROOMSTYLE, CR: CUR_ROOM, st: G.stage, dun: G.dun, fl: G.flatLights, FO: FRONT_ON, cur: D.cur };
    snapCv('fg', floor); snapCv('fmg', floorM); snapCv('ffg', frontM);
    G.stage = D.stage || G.stage; G.dun = D;
    try { return fn(); } finally {
      Object.assign(A, k.A); CX = k.CX; CY = k.CY; PILLARS = k.PIL; TORCHES = k.TOR; for (const d in k.DOOR) Object.assign(DOOR[d], k.DOOR[d]); NC = k.NC; NR = k.NR;
      ROOMSTYLE = k.RS; CUR_ROOM = k.CR; G.stage = k.st; G.dun = k.dun; G.flatLights = k.fl; FRONT_ON = k.FO; D.cur = k.cur;
      backCv('fg', fg); backCv('fmg', fmg); backCv('ffg', ffg);
    }
  }
  const cached = (D, R) => FL_CACHE.some(c => c.key === (D.stage || G.stage) + ':' + R.id && c.dun === D);
  function prePaint(D, R) {
    if (!D || !R || cached(D, R) || ['forge', 'home', 'lab', 'archive', 'den', 'ruin', 'ancArena'].includes(R.type)) return false;
    withCtx(D, () => { D.cur = R; setArena(SHAPES[R.shape]); roomPillars(R);
      if (!R.sprites || (R.spritesN != null && R.spritesN !== spriteObsN(R))) { R.sprites = makeObsSprites(R); R.spritesN = spriteObsN(R); }
      floorCached(R); });
    return true;
  }
  // 시작 방부터 문으로 이어진 순서대로 n개
  function nearRooms(D, R0, n) { const out = [], seen = new Set([R0.id]), q = [R0];
    while (q.length && out.length < n) { const R = q.shift(); out.push(R); for (const d in R.doors) { const id = R.doors[d]; if (id == null || seen.has(id)) continue; seen.add(id); q.push(D.rooms[id]); } }
    return out; }
  const paintJobs = (D, n) => nearRooms(D, D.start, n).map(R => () => prePaint(D, R));
  // ---------------------------------------------------------------- 로딩 화면
  function run(jobs, o = {}) {
    S = { jobs: jobs.slice(), t: 0, loops: o.loops || 1, done: o.done || null, out: -1, ready: false }; // v3.66 시간이 아니라 달이 지고 다시 뜨는 바퀴 수로 끊음
    document.body.classList.add('moonsky'); clearKeys();
  }
  function clearKeys() { for (const k in pressed) pressed[k] = false; if (typeof mouse !== 'undefined') { mouse.down = false; mouse.rdown = false; } }
  function tick(dt) {
    if (!S) return; S.t += dt;
    if (S.out >= 0) { S.out += dt; clearKeys(); if (S.out >= 0.4) { S = null; document.body.classList.remove('moonsky'); clearKeys(); } return; }
    const t0 = performance.now();
    while (S.jobs.length && performance.now() - t0 < 12) { const j = S.jobs.shift(); try { const more = j(); if (Array.isArray(more)) S.jobs.unshift(...more); } catch (e) { console.error(e); } }
    if (!S.jobs.length && !S.ready) S.ready = true;
    if (S.t >= 0.3 + S.loops * LOOP && !S.ready) S.loops++; // 바퀴를 다 돌았는데 아직 준비 중이면 한 바퀴 더
    if (S.ready && S.t >= 0.3 + S.loops * LOOP) { /* v3.66 키 · 클릭으로 넘길 수 없음 — 준비가 끝나고 달이 정해진 바퀴를 다 돌아 다시 떠오른 순간 닫힘 */ const f = S.done; S.done = null; S.out = 0; try { if (f) f(); } catch (e) { console.error(e); } }
    clearKeys(); // 로딩 중 눌린 키는 버림 (화면 넘기기 · 조작이 새지 않게)
  }
  function draw() {
    if (!S) return; let t;
    if (S.out >= 0) t = DUR - 0.4 + S.out; else if (S.t < 0.3) t = S.t; else t = 0.3 + ((S.t - 0.3) % LOOP);
    MOONSKY.draw(Math.min(DUR - 0.001, t));
  }
  // ---------------------------------------------------------------- 연결
  // 1) 시작 장소에 들어올 때 (처음 시작 · 원정 실패 뒤): 1장 던전을 미리 만들고 가까운 방 바닥까지
  { const o = HOME.enter; HOME.enter = function (...a) { const fail = MOONSKY.pending; const r = o.apply(this, a);
      if (G && G.home) { G.preDun = G.preDun || {};
        run([() => { const D = withCtx({ stage: 1 }, () => genDungeon(1)); D.stage = D.stage || 1; G.preDun[1] = D; return paintJobs(D, 6); }], { loops: 1 });
        if (fail) sfx('blip', 0.5); }
      return r; }; }
  // 2) 장 넘어갈 때: newDungeon을 로딩 화면으로 (테스트 키는 G.noLoad로 바로)
  { const o = newDungeon; newDungeon = function () {
      const st = G.stage, pre = G.preDun && G.preDun[st]; if (pre) delete G.preDun[st];
      const finish = () => { G.mood = null; enterRoom(G.dun.start, null); if (!wmStart()) showStageParchment(G.stage, G.cls); };
      if (pre && cached(pre, pre.start)) { G.dun = pre; G.noLoad = false; finish(); return; } // 이미 다 준비됨 → 바로
      if (G.noLoad) { G.noLoad = false; if (pre) { G.dun = pre; finish(); } else o.apply(this, arguments); return; }
      run([() => { const D = pre || genDungeon(st); D.stage = D.stage || st; G.dun = D; return paintJobs(D, 6); }], { loops: 1, done: finish }); }; }
  // 3) 업데이트 · 그리기: 로딩 중엔 게임을 멈추고 달 창만 · 틈날 때 이웃 방 미리 그리기
  let calmT = 0, nextPre = 0;
  { const o = update; update = function (dt) { if (S) { tick(dt); return; } const r = o.apply(this, arguments);
      try { const D = G && G.dun, R = D && D.cur;
        const calm = mode === 'play' && R && !D.home && !D.forge && !D.lab && !D.anc && R.cleared && !G.sealed && !G.trans && !G.cine && !G.enemies.some(e => !e.dead && !isDummy(e));
        calmT = calm ? calmT + dt : 0;
        if (calmT > 1.0 && time > nextPre) { nextPre = time + 1.5; for (const d in R.doors) { const id = R.doors[d]; if (id == null) continue; if (prePaint(D, D.rooms[id])) break; } }
      } catch (e) { console.error(e); }
      return r; }; }
  { const o = render; render = function () { if (S) { draw(); return; } return o.apply(this, arguments); }; }
  return { run, prePaint, get on() { return !!S; }, get ready() { return !!(S && S.ready); } };
})();
