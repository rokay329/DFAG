'use strict';
// 잿빛 왕관 토벌대 — 05_dungeon.js : 던전 생성·방 진입·상호작용·길찾기·바닥 그리기, 오브젝트 도트, 보스 문 봉인, 특별한 방(상인·보물·야영지)
// index.html이 js/ 파일을 번호 순서대로 불러온다. 모든 파일이 같은 전역 스코프를 함께 쓴다(예전 game.js 한 덩어리를 그대로 나눔).

  // ================================================================ 던전 (v0.23) — 엔터 더 건전식 방 구조
  // 한 스테이지 = 방 그래프. 전투 방은 들어가면 문이 잠기고 적을 모두 쓰러뜨려야 열린다.
  // 엘리트 방 2곳을 처치하면 보스 방 봉인이 풀린다. 갈림길·순환 고리·막다른 길 끝의 보물·상인, 금 간 벽 너머 비밀 방.
  const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
  const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };
  const DOOR = { n: { x: 719, y: A.y0 }, s: { x: 719, y: A.y1 }, w: { x: A.x0, y: CY }, e: { x: A.x1, y: CY } };
  // 방 크기·모양 (v0.25): 스테이지마다 5종
  const SHAPES = {
    field: { w: 1000, h: 540, n: '들판' }, trail: { w: 1100, h: 210, n: '오솔길' }, trailV: { w: 300, h: 640, n: '숲길' }, glade: { w: 560, h: 360, n: '숲속 빈터' }, plain: { w: 1060, h: 580, n: '너른 벌판' },
    square: { w: 1000, h: 540, n: '부락 광장' }, fence: { w: 1100, h: 200, n: '말뚝 사이 길' }, canyon: { w: 300, h: 640, n: '협곡 비탈길' }, tents: { w: 560, h: 360, n: '천막 골목' }, arena: { w: 1060, h: 580, n: '투기장' }, arenaBoss: { w: 1180, h: 640, n: '투기장' } /* v2.86 큰 방 1180×640 → 1060×580 · 3장 보스방은 그대로 */,
    hall: { w: 1000, h: 540, n: '의식장' }, nook: { w: 480, h: 270, n: '아늑한 자리' }, vault: { w: 400, h: 240, n: '숨은 방' }, forge: { w: 420, h: 240, n: '대장간' } /* v1.71 500×280 → 420×240 */, corridor: { w: 1100, h: 190, n: '복도' }, corridorV: { w: 280, h: 640, n: '탑 계단' }, chamber: { w: 540, h: 340, n: '작은 방' }, greathall: { w: 1060, h: 580, n: '대회랑' },
    plaza: { w: 1000, h: 540, n: '재의 광장' }, gallery: { w: 1100, h: 200, n: '무너진 회랑' }, belfry: { w: 290, h: 640, n: '종탑 계단' }, sanctum: { w: 540, h: 340, n: '성소' }, court: { w: 1060, h: 580, n: '왕궁 앞뜰' }, coronation: { w: 1180, h: 640, n: '대관식장' }, altar: { w: 640, h: 300, n: '왕도 성문 앞' } /* v2.52 재의 제단 */,
    start1: { w: 700, h: 400, n: '초원 어귀' }, start2: { w: 700, h: 400, n: '성채 앞마당' }, start3: { w: 700, h: 400, n: '부락 어귀' }, start4: { w: 700, h: 400, n: '왕도 어귀' }, // v3.20 장마다 시작 방 (작게 · 그 장의 시설물을 정해진 자리에)
  };
  function setArena(sh) {
    A.x0 = 136 + Math.max(0, Math.round((1000 - sh.w) / 4) * 2); A.x1 = A.x0 + sh.w;
    A.y0 = 100 + Math.max(0, Math.round((540 - sh.h) / 4) * 2); A.y1 = A.y0 + sh.h;
    CX = (A.x0 + A.x1) / 2; CY = (A.y0 + A.y1) / 2;
    PILLARS = []; for (let x = A.x0 + 34; x <= A.x1 - 20; x += 157) PILLARS.push(x);
    if (G && (G.stage === 2 || G.stage === 4)) { const n = PILLARS.length; PILLARS = PILLARS.map((_, k) => Math.round((CX + (k - (n - 1) / 2) * 157) / 2) * 2); } // v3.29 2장 · 4장 기둥은 방 가운데 기준 좌우 대칭
    TORCHES = PILLARS.map(x => ({ x, y: A.y0 - 38 }));
    // 문은 장식 기둥 간격에 맞추지 않고 각 변의 정확한 중앙에 고정한다.
    const nx = Math.round(CX / 2) * 2;
    Object.assign(DOOR.n, { x: nx, y: A.y0 }); Object.assign(DOOR.s, { x: nx, y: A.y1 }); Object.assign(DOOR.w, { x: A.x0, y: CY }); Object.assign(DOOR.e, { x: A.x1, y: CY });
    NC = Math.ceil((A.x1 - A.x0) / NAV); NR = Math.ceil((A.y1 - A.y0) / NAV);
  }
  const doorIn = (d, k = 26) => ({ x: DOOR[d].x + (d === 'w' ? k : d === 'e' ? -k : 0), y: DOOR[d].y + (d === 'n' ? k : d === 's' ? -k : 0) });
  const ROOM_N = { shrine: '빛의 방', altar: '왕도 성문', forge: '쿤의 대장간', start: '시작 방', combat: '전투 방', elite: '엘리트 방', survive: '봉인된 방', rest: '쿠키 · 쿠오의 출장 비스트로', reward: '보물 방', shop: '살구의 비밀상점', secret: '비밀 방', boss: '보스', hidden: '숨은 공터', lab: '구덩이 실험실', chapel: '기사단 밀실' };
  // v1.21 챕터마다 다른 엘리트 방 이름·문구 (tier 4 = 첫째 엘리트 방, tier 9 = 둘째)
  const ELITE_ROOM = {
    1: { n: '우두머리의 굴', tag: '굴', foe: '우두머리', clear: '우두머리 처치', loot: '우두머리의 전리품',
      sub: { 4: '고블린 챔피언이 식지 않은 불씨를 쥐고 놓지 않는다', 9: '가시등 멧돼지가 불씨 주위를 맴돌며 땅을 판다' } },
    2: { n: '처형장', tag: '처형장', foe: '처형장', clear: '처형장 제압', loot: '처형장의 전리품',
      sub: { 4: '기사단 처형인이 아직 끝나지 않은 판결을 기다린다', 9: '처형인 곁, 역병 어미가 무너진 돌 틈에 둥지를 틀었다' } },
    3: { n: '결투장', tag: '결투장', foe: '결투', clear: '결투 승리', loot: '결투의 전리품',
      sub: { 4: '투기장 챔피언 우르그가 부러진 엄니를 걸고 서 있다', 9: '사슬이 끊어진 트롤 그러크가 우리 밖을 배회한다' } },
    4: { n: '알현실', tag: '알현실', foe: '알현', clear: '알현 종료', loot: '왕실의 하사품',
      sub: { 4: '근위대장 모르드레드가 주인 없는 문을 여전히 지킨다', 9: '상복의 왕비가 빈 왕좌 앞에서 재를 매만진다' } },
  };
  const ER = () => ELITE_ROOM[G && G.stage] || ELITE_ROOM[1];
  const roomName = t => t === 'ruin' ? RUIN.name() : t === 'den' ? DEN.name() : t === 'archive' ? ARCH.name() : t === 'home' && G ? HOME.name(G.cls) : t === 'elite' && G && G.dun && !G.dun.forge ? ER().n : ROOM_N[t];
  const roomTag = t => t === 'elite' ? ER().tag : ROOM_TAG[t];
  const ROOM_TAG = { shrine: '빛', altar: '성문', forge: '대장간', start: '시작', combat: '전투', elite: '엘리트', survive: '봉인', rest: '비스트로', reward: '보물', shop: '상인', secret: '비밀', boss: '보스', hidden: '공터', lab: '실험실', chapel: '밀실' };

  // withSeed: 04_monsters.js에서 불러올 때 먼저 써서 그쪽으로 옮김

  // ---------- 생성
  function genDungeon(stage) {
    for (let i = 0; i < 600; i++) { const D = tryGenDungeon(stage); if (D) return D; }
    throw new Error('던전 생성 실패');
  }
  function tryGenDungeon(stage) {
    const N = stage === 1 ? 12 : stage === 2 ? 13 : stage === 3 ? 14 : 15;
    const cells = new Map(), K = (x, y) => x + ',' + y, rooms = [];
    const add = (x, y) => { const r = { id: rooms.length, gx: x, gy: y, type: 'combat', doors: { n: null, s: null, w: null, e: null }, visited: false, seen: false, cleared: false, loot: [], seed: randi(1, 2e9) }; rooms.push(r); cells.set(K(x, y), r); return r; };
    const link = (a, b, d) => { a.doors[d] = b.id; b.doors[OPP[d]] = a.id; };
    const nbs = (x, y) => Object.keys(DIRS).filter(d => cells.has(K(x + DIRS[d][0], y + DIRS[d][1])));
    const at = (x, y, d) => cells.get(K(x + DIRS[d][0], y + DIRS[d][1]));
    add(0, 0);
    for (let guard = 0; rooms.length < N && guard < 3000; guard++) {
      const base = rooms[randi(0, rooms.length - 1)], d = pick(Object.keys(DIRS));
      const x = base.gx + DIRS[d][0], y = base.gy + DIRS[d][1];
      if (cells.has(K(x, y)) || nbs(x, y).length !== 1 || Math.abs(x) > 4 || Math.abs(y) > 3) continue;
      if (base.id === 0 && nbs(0, 0).length >= 3) continue;
      link(base, add(x, y), d);
    }
    if (rooms.length < N) return null;
    // 순환 고리: 양쪽에 방이 있는 빈 칸을 채워 두 갈래를 잇는다
    for (let l = 0; l < (stage === 1 ? 1 : 2); l++) {
      const cand = [];
      for (const r of rooms) for (const d in DIRS) { const x = r.gx + DIRS[d][0], y = r.gy + DIRS[d][1]; if (!cells.has(K(x, y)) && nbs(x, y).length === 2) cand.push([x, y]); }
      if (!cand.length) break;
      const [x, y] = pick(cand), nr = add(x, y);
      for (const d of nbs(x, y)) link(nr, at(x, y, d), d);
    }
    // 시작 방에서의 거리
    const depth = rooms.map(() => -1); depth[0] = 0;
    for (const q = [0]; q.length;) { const r = rooms[q.shift()]; for (const d in r.doors) { const id = r.doors[d]; if (id != null && depth[id] < 0) { depth[id] = depth[r.id] + 1; q.push(id); } } }
    const deg = r => Object.values(r.doors).filter(v => v != null).length;
    const dead = rooms.filter(r => r.id !== 0 && deg(r) === 1).sort((a, b) => depth[b.id] - depth[a.id]);
    if (dead.length < 3) return null;
    const boss = dead[0]; if (depth[boss.id] < 4) return null;
    const foyer = rooms[Object.values(boss.doors).find(v => v != null)];
    if (foyer.id === 0) return null;
    rooms[0].type = 'start'; boss.type = 'boss';
    const free = () => rooms.filter(r => r.type === 'combat' && r !== foyer);
    const de = dead.filter(r => r.type === 'combat' && r !== foyer);
    if (de.length < 2) return null;
    de[0].type = 'reward';
    const shop = de.length > 1 ? de[de.length - 1] : pick(free()); shop.type = 'shop';
    let F = free().filter(r => depth[r.id] >= 2).sort((a, b) => depth[a.id] - depth[b.id]);
    if (F.length < 4) return null;
    const e1 = F[Math.floor((F.length - 1) / 2)], e2 = F[F.length - 1];
    e1.type = 'elite'; e1.tier = 4; e2.type = 'elite'; e2.tier = 9;
    F = free().sort((a, b) => Math.abs(depth[a.id] - 3) - Math.abs(depth[b.id] - 3));
    if (!F.length) return null;
    F[0].type = 'rest'; F[0].tier = 5;
    if (stage <= 4) { F = free().filter(r => depth[r.id] >= 2).sort((a, b) => Math.abs(depth[a.id] - 4) - Math.abs(depth[b.id] - 4)); if (!F.length) return null; F[0].type = 'shrine'; F[0].tier = 5; } // v3.25 빛의 방 (1~4장 · 챕터마다 1개)
    F = free().filter(r => depth[r.id] >= 2);
    if (!F.length) return null;
    const sv = pick(F); sv.type = 'survive'; sv.tier = 10;
    const combats = rooms.filter(r => r.type === 'combat').sort((a, b) => depth[a.id] - depth[b.id]);
    if (combats.length < 3) return null;
    const TIERS = [1, 2, 3, 6, 7, 8];
    combats.forEach((r, i) => { r.tier = TIERS[Math.min(5, Math.floor(i * 6 / combats.length))]; });
    // 비밀 방: 보스 옆이 아닌 빈 칸, 이웃이 하나뿐인 깊은 자리를 우선
    const sc = [];
    for (const r of rooms) {
      if (r.type === 'boss' || r.type === 'start') continue;
      for (const d in DIRS) {
        const x = r.gx + DIRS[d][0], y = r.gy + DIRS[d][1];
        if (cells.has(K(x, y)) || r.doors[d] != null) continue;
        const n = nbs(x, y);
        if (n.some(nd => at(x, y, nd).type === 'boss')) continue;
        sc.push({ x, y, r, d, n: n.length });
      }
    }
    if (!sc.length) return null;
    sc.sort((a, b) => (a.n - b.n) || (depth[b.r.id] - depth[a.r.id]));
    const s0 = pick(sc.filter(s => s.n === sc[0].n).slice(0, 4));
    const sec = add(s0.x, s0.y); sec.type = 'secret';
    link(s0.r, sec, s0.d); s0.r.crack = { dir: s0.d, hp: 3, broken: false };
    for (const r of rooms) {
      r.depth = depth[r.id] == null || depth[r.id] < 0 ? depth[s0.r.id] + 1 : depth[r.id];
      if (!r.tier) r.tier = Math.max(1, Math.min(8, r.depth + 1));
      if (r.type === 'boss') r.tier = 11;
    }
    // 텔레포터: 시작·상인·모닥불·보물·봉인·보스 앞방 + 일부 전투 방
    for (const r of rooms) if (['start', 'shop', 'rest', 'reward', 'survive', 'boss', 'shrine'].includes(r.type) || r === foyer || (r.type === 'combat' && Math.random() < 0.3)) r.hasTele = true;
    // 방 모양: 양쪽 문만 있는 전투 방은 오솔길·복도가 되기 쉽고, 엘리트·봉인은 넓은 방, 쉼터는 작은 방
    const [STD, COR, CORV, SMALL, BIG] = stage === 1 ? ['field', 'trail', 'trailV', 'glade', 'plain'] : stage === 4 ? ['plaza', 'gallery', 'belfry', 'sanctum', 'court'] : stage === 2 ? ['hall', 'corridor', 'corridorV', 'chamber', 'greathall'] : ['square', 'fence', 'canyon', 'tents', 'arena'];
    const wpick = arr => { let t = Math.random() * arr.reduce((a, b) => a + b[1], 0); for (const [k, w] of arr) { if (t < w) return k; t -= w; } return arr[0][0]; };
    for (const r of rooms) {
      const ds = Object.keys(r.doors).filter(d => r.doors[d] != null), hz = ds.every(d => d === 'w' || d === 'e'), vt = ds.every(d => d === 'n' || d === 's');
      r.shape = r.type === 'boss' ? (stage === 3 ? 'arenaBoss' : stage === 4 ? 'coronation' : STD)
        : r.type === 'combat' ? (hz && Math.random() < 0.8 ? COR : vt && Math.random() < 0.8 ? CORV : wpick([[STD, 3], [SMALL, 2], [BIG, 2], [COR, ds.length <= 3 && !ds.includes('n') ? 1 : 0], [CORV, ds.length <= 3 && !ds.includes('w') ? 1 : 0]]))
        : r.type === 'elite' ? wpick([[STD, 2], [BIG, 3]])
        : r.type === 'survive' ? wpick([[STD, 1], [BIG, 2]])
        : r.type === 'start' ? 'start' + stage
        : r.type === 'secret' ? 'vault' // v1.11 특별한 방은 작게
        : ['shop', 'rest', 'reward', 'shrine'].includes(r.type) ? 'nook'
        : SMALL;
    }
    // 모든 칸에 적어도 오솔길/복도 하나는 나오게
    if (!rooms.some(r => r.shape === COR || r.shape === CORV)) { const nsCount = r => ['n', 's'].filter(d => r.doors[d] != null).length; const c = rooms.filter(r => r.type === 'combat').sort((a, b) => nsCount(a) - nsCount(b))[0]; if (c) c.shape = nsCount(c) <= 1 ? COR : CORV; }
    for (const r of rooms) { r.waves = r.type === 'combat' || r.type === 'elite' ? STAGES[stage].phases[r.tier] : null; setArena(SHAPES[r.shape]); layoutRoom(r, stage); if (['combat', 'elite', 'survive'].includes(r.type)) r.hue = pick(['r', 'b', 'g']); } // v2.34 방 색 성향 · v2.46 보스방은 색 성향 없음 (잿빛·색 물결·빛 조각 없음)
    setArena(SHAPES[STD]);
    const loop2 = TRUTH.loop2(); /* v2.74 진엔딩 단서는 그 캐릭터의 전기가 만들어진 뒤(2회차)부터 */ if (loop2 && stage === 1 && !TRUTH.prep1(rooms)) return null; if (loop2 && stage === 2 && G.truthRun && G.truthRun.t1 && !TRUTH.prep2(rooms)) return null; /* v3.20 2장 단서: 이번 판에 1장 진실을 봤을 때만 */ // v2.59 2장: 벽의 인장 · 밀실 · 문장 석상 // v2.58 진엔딩 1장 단서: 점액 묻은 나무 · 숨은 방 · 문 앞 점액 · 폭발 흔적
    // 지도 경계
    const xs = rooms.map(r => r.gx), ys = rooms.map(r => r.gy);
    { const D0 = { rooms }; markInvader(D0, stage); } // v1.57 난입 방 지정
    return { rooms, start: rooms[0], boss, foyer, cur: null, eliteDone: 0, keys: 0, sock: [false, false], bossOpen: false, gate: null, stage, bx0: Math.min(...xs), bx1: Math.max(...xs), by0: Math.min(...ys), by1: Math.max(...ys) };
  }

  // ---------- 방 구조물: 기둥(나무) · 무너진 벽(덤불) · 잔해(바위) · 구덩이(연못)
  const U = (u, v) => ({ x: A.x0 + u * (A.x1 - A.x0), y: A.y0 + v * (A.y1 - A.y0) });
  const LAYOUTS = {
    open: () => [],
    pillars4: () => [['p', .28, .3], ['p', .72, .3], ['p', .28, .72], ['p', .72, .72]],
    pillars6: () => [['p', .22, .3], ['p', .5, .3], ['p', .78, .3], ['p', .22, .72], ['p', .5, .72], ['p', .78, .72]],
    ring: () => Array.from({ length: 8 }, (_, i) => ['p', .5 + Math.cos(i / 8 * TAU + 0.39) * 0.2, .52 + Math.sin(i / 8 * TAU + 0.39) * 0.3]),
    centerPit: () => [['pit', .5, .24, 260, 70], ['pit', .5, .82, 260, 70]], // v3.19 둘 이상이면 같은 크기 · 줄 맞춤
    twinPits: () => [['pit', .3, .5, 150, 220], ['pit', .7, .5, 150, 220]],
    cross: () => [['w', .5, .2, 26, 120], ['w', .5, .84, 26, 120], ['w', .2, .52, 120, 26], ['w', .8, .52, 120, 26]], // v3.19 네 팔 길이 통일
    lanes: () => [['w', .5, .33, 560, 26], ['w', .5, .7, 560, 26], ['r', .14, .5, 16], ['r', .86, .5, 16]],
    rubble: () => { const out = [], k = randi(2, 3); // v2.91 고르게 흩뿌린 8개 → 2~3무더기 (무더기마다 1~3개)
      for (let i = 0; i < k; i++) { const u = rand(.18, .82), v = rand(.22, .8), m = randi(1, 3); for (let j = 0; j < m; j++) out.push(['r', u + (j ? rand(-.06, .06) : 0), v + (j ? rand(-.08, .08) : 0), j ? rand(10, 14) : rand(15, 22)]); }
      return out; },
    pitBand: () => [['pit', .25, .52, 290, 64], ['pit', .75, .52, 290, 64], ['p', .5, .25], ['p', .5, .8]],
    blocks: () => [['w', .22, .27, 170, 90], ['w', .78, .27, 170, 90], ['w', .22, .78, 170, 90], ['w', .78, .78, 170, 90]],
    pitsScatter: () => [['pit', .25, .28, 110, 70], ['pit', .75, .28, 110, 70], ['pit', .25, .78, 110, 70], ['pit', .75, .78, 110, 70], ['r', .5, .3, 15], ['r', .5, .8, 15]], // v3.19 제각각이던 구덩이 다섯 → 같은 크기 넷을 격자로
    halls: () => [['w', .36, .5, 26, 300], ['w', .64, .5, 26, 300], ['r', .18, .3, 18], ['r', .82, .74, 18]],
    pond: () => [['pit', .5, .2, 220, 80], ['p', .2, .3], ['p', .8, .3], ['p', .2, .78], ['p', .8, .78]],
  };
  // 모양 전용 배치 (크기 그대로)
  const LAYOUTS_SHAPE = {
    trailEdge: () => [...[.08, .3, .52, .74, .94].map(u => ['p', u, .1]), ...[.2, .42, .64, .86].map(u => ['p', u, .92]), ['r', .76, .5, 13]],
    trailZig: () => [['w', .2, .3, 46, 120], ['w', .42, .72, 46, 120], ['w', .64, .3, 46, 120], ['w', .86, .72, 46, 120]],
    trailPond: () => [['pit', .24, .5, 170, 70], ['pit', .76, .5, 170, 70], ['p', .2, .12], ['p', .8, .9]],
    vZig: () => [['w', .32, .24, 150, 30], ['w', .68, .5, 150, 30], ['w', .32, .76, 150, 30]],
    vEdge: () => [['p', .12, .18], ['p', .88, .32], ['p', .12, .48], ['p', .88, .62], ['p', .12, .8], ['r', .5, .35, 12]],
    colonnade: () => [...[.08, .26, .44, .62, .8, .96].map(u => ['p', u, .16]), ...[.08, .26, .44, .62, .8, .96].map(u => ['p', u, .86])],
    corrRubble: () => [['r', .18, .28, 22], ['r', .38, .72, 22], ['r', .58, .28, 22], ['r', .78, .72, 22]],
    corrPits: () => [['pit', .3, .3, 220, 56], ['pit', .7, .7, 220, 56]],
    vColon: () => [...[.12, .3, .48, .66, .84].map(v => ['p', .16, v]), ...[.12, .3, .48, .66, .84].map(v => ['p', .84, v])],
    vRubble: () => [['r', .3, .25, 20], ['r', .7, .45, 20], ['r', .3, .7, 20]],
    glade1: () => [['p', .2, .3], ['p', .8, .3], ['r', .5, .75, 14]],
    nave: () => [...[.12, .26, .4, .6, .74, .88].map(u => ['p', u, .3]), ...[.12, .26, .4, .6, .74, .88].map(u => ['p', u, .72])],
    groves: () => [['p', .2, .25], ['p', .27, .34], ['p', .14, .38], ['p', .8, .68], ['p', .87, .6], ['p', .74, .8], ['pit', .55, .2, 220, 80], ['r', .3, .75, 18]],
    sideHalls: () => [['w', .5, .3, 500, 30], ['w', .5, .72, 500, 30], ['p', .15, .5], ['p', .85, .5]],
  };
  Object.assign(LAYOUTS, LAYOUTS_SHAPE);
  const LAYOUT_SHAPE_POOL = {
    trail: ['trailEdge', 'trailZig', 'trailPond'], trailV: ['vZig', 'vEdge'], glade: ['glade1', 'open', 'pillars4'],
    corridor: ['colonnade', 'corrRubble', 'corrPits'], corridorV: ['vColon', 'vRubble'], chamber: ['open', 'pillars4', 'rubble'],
  };
  const BIG_RECT = ['centerPit', 'twinPits', 'pond', 'pitBand', 'blocks', 'halls'], LAYOUT_RECT = { centerPit: 1, twinPits: 1, pitBand: 1, pitsScatter: 1, pond: 1, groves: 1, trailPond: 1, corrPits: 1, cross: 2, lanes: 2, blocks: 2, halls: 2, trailZig: 2, vZig: 2, sideHalls: 2 }; // v3.19 1 = 구덩이류, 2 = 벽류
  const LAYOUT_BIG_EXTRA = { plain: ['groves'], greathall: ['nave', 'sideHalls'] };
  const LAYOUT_BY = {
    combat: ['pillars4', 'pillars6', 'ring', 'centerPit', 'twinPits', 'cross', 'lanes', 'rubble', 'pitBand', 'blocks', 'pitsScatter', 'halls', 'pond'],
    elite: ['open', 'pillars4', 'pillars6', 'ring', 'rubble', 'centerPit'],
    survive: ['pillars4', 'ring', 'rubble', 'pond', 'pitBand'],
  };
  function mkObs(spec, sx = 1, sy = 1) {
    let [k, u, v, a, b] = spec; const p = U(u, v);
    if (k === 'r') a = Math.max(10, Math.min(26, a * Math.min(sx, sy))); else if (k !== 'p') { a = Math.round(a * sx / 2) * 2; b = Math.round(b * sy / 2) * 2; }
    if (k === 'p') return { t: 'pillar', c: true, x: p.x, y: p.y, r: 13 };
    if (k === 'r') return { t: 'rock', c: true, x: p.x, y: p.y, r: a };
    const t = k === 'w' ? 'wall' : 'pit';
    return { t, c: false, x: p.x, y: p.y, w: a, h: b, x0: p.x - a / 2, y0: p.y - b / 2, x1: p.x + a / 2, y1: p.y + b / 2 };
  }
  // v2.91 격자처럼 줄 맞춰 보이지 않게: 둥근 장애물(나무 · 기둥 · 바위)은 칸 단위로 살짝 비틀고, 많이 늘어선 배치는 몇 개를 뺀다
  //        벽 · 구덩이도 조금 비튼다 (방 가운데 · 문 앞 · 길 연결 검사는 이 뒤에 그대로 함)
  const NAT_ROW = { colonnade: 1, nave: 1, vColon: 1, trailEdge: 1, vEdge: 1, pillars6: 1, ring: 1, groves: 1 };
  function naturalize(obs, name, gridPillar) { // v3.19 gridPillar: 성채(2장 · 4장)의 돌기둥은 비틀지 않고 줄을 맞춤 — 1장 나무 · 3장은 그대로
    const W = A.x1 - A.x0, H = A.y1 - A.y0, s2 = v => Math.round(v / 2) * 2;
    const rnd = obs.filter(b => b.c), jx = Math.min(26, W * 0.035), jy = Math.min(22, H * 0.05), nRect = obs.length - rnd.length; // v3.19 벽 · 구덩이가 둘 이상이면 비틀지 않고 줄을 맞춤
    for (const b of obs) {
      if (b.c && gridPillar && b.t === 'pillar') { b.x = s2(b.x); b.y = s2(b.y); }
      else if (b.c) { b.x = s2(b.x + rand(-jx, jx)); b.y = s2(b.y + rand(-jy, jy)); if (b.t === 'rock') b.r = Math.max(10, Math.round(b.r * rand(0.85, 1.12))); }
      else if (nRect < 2) { const dx = s2(rand(-10, 10)), dy = s2(rand(-8, 8)); b.x += dx; b.y += dy; b.x0 += dx; b.x1 += dx; b.y0 += dy; b.y1 += dy; }
    }
    if (NAT_ROW[name] && rnd.length >= 6) { // 줄지어 선 배치: 25%씩 빼되 4개는 남김
      let left = rnd.length; const gone = new Set();
      for (const b of rnd.slice().sort(() => Math.random() - 0.5)) if (left > 4 && Math.random() < 0.25) { gone.add(b); left--; }
      obs = obs.filter(b => !gone.has(b));
    }
    return obs;
  }
  function obsHitL(list, x, y, r, solidOnly) {
    for (const b of list) {
      if (b.ghost || (solidOnly && b.t === 'pit')) continue;
      if (b.c) { if (Math.hypot(x - b.x, y - b.y) < b.r + r) return b; }
      else { const cx = clamp(x, b.x0, b.x1), cy = clamp(y, b.y0, b.y1); if (Math.hypot(x - cx, y - cy) < r) return b; }
    }
    return null;
  }
  const solidAt = (x, y, r = 2) => !!(G && G.obs && G.obs.length && obsHitL(G.obs, x, y, r, true));
  // 투사체는 이전 위치→새 위치 선분을 4px 간격으로 검사해 얇은 장애물도 건너뛰지 않는다 (v0.59)
  function segSolid(x0, y0, x1, y1, r = 3) { if (!G || !G.obs || !G.obs.length) return false; const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / 4)); for (let i = 1; i <= n; i++) { const t = i / n; if (obsHitL(G.obs, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, true)) return true; } return false; }
  // 돌진은 장애물(구덩이 포함)에 닿으면 멈춘다
  const dashBlocked = (e, pits = true) => !!(G && G.obs && G.obs.length && obsHitL(G.obs, e.x, e.y, e.r, !pits));
  // 원(유닛)을 장애물 밖으로 밀어낸다
  const WALL_SIDE = 7;
  function solveObs(o, r, ignorePit) {
    const L = G && G.obs; if (!L || !L.length) return false;
    let hit = false;
    for (const b of L) {
      if (b.ghost || (ignorePit && b.t === 'pit')) continue;
      if (b.c) {
        let dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy); const m = b.r + r;
        if (d < m) { if (d < 0.01) { dx = 1; dy = 0; d = 1; } o.x = b.x + dx / d * m; o.y = b.y + dy / d * m; hit = true; }
      } else {
        const sp = b.t === 'wall' ? WALL_SIDE : 0, bx0 = b.x0 - sp, bx1 = b.x1 + sp; // v3.19 벽은 양옆으로 7px 더 막음 — 옆에 붙어 섰을 때 몸이 벽 그림에 반쯤 가려져 벽 안으로 들어간 것처럼 보이던 문제
        const cx = clamp(o.x, bx0, bx1), cy = clamp(o.y, b.y0, b.y1), dx = o.x - cx, dy = o.y - cy, d = Math.hypot(dx, dy);
        if (d < r) {
          if (d > 0.01) { o.x = cx + dx / d * r; o.y = cy + dy / d * r; }
          else {
            const l = o.x - bx0, rr = bx1 - o.x, t = o.y - b.y0, bt = b.y1 - o.y, m = Math.min(l, rr, t, bt);
            if (m === l) o.x = bx0 - r; else if (m === rr) o.x = bx1 + r; else if (m === t) o.y = b.y0 - r; else o.y = b.y1 + r;
          }
          hit = true;
        }
      }
    }
    return hit;
  }
  // 길찾기 격자 (10px)
  const NAV = 10; let NC = Math.ceil((A.x1 - A.x0) / NAV), NR = Math.ceil((A.y1 - A.y0) / NAV);
  const navIdx = (x, y) => { const i = Math.floor((x - A.x0) / NAV), j = Math.floor((y - A.y0) / NAV); return i < 0 || j < 0 || i >= NC || j >= NR ? -1 : j * NC + i; };
  function buildNav(obs, r = 9) {
    const f = new Uint8Array(NC * NR);
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) f[j * NC + i] = obsHitL(obs, A.x0 + (i + 0.5) * NAV, A.y0 + (j + 0.5) * NAV, r) ? 0 : 1;
    return f;
  }
  function navFlood(nav, sx, sy) {
    const dist = new Int16Array(NC * NR).fill(-1), s = navIdx(sx, sy);
    if (s < 0) return dist;
    const q = new Int32Array(NC * NR); let h = 0, t = 0;
    dist[s] = 0; q[t++] = s;
    while (h < t) {
      const c = q[h++], i = c % NC, j = (c / NC) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NC || nj >= NR) continue;
        const n = nj * NC + ni; if (dist[n] >= 0 || !nav[n]) continue;
        if (di && dj && (!nav[j * NC + ni] || !nav[nj * NC + i])) continue;
        dist[n] = dist[c] + 1; q[t++] = n;
      }
    }
    return dist;
  }
  // v3.20 시작 방 장애물 (방 비율 u · v): 기둥 · 바위는 방 가운데 기준 좌우 대칭 · 같은 크기
  const START_OBS = {
    1: [['p', 0.13, 0.24], ['p', 0.87, 0.24], ['w', 0.2, 0.74, 132, 74], ['h', 0.8, 0.74, 132, 74]], // 이끼 낀 부러진 돌기둥 둘 · 아래 좌우: 무너진 폐허 + 폐허 저수지 (같은 크기)
    2: [['p', 0.14, 0.26], ['p', 0.86, 0.26], ['w', 0.2, 0.76, 132, 70], ['w', 0.8, 0.76, 132, 70]], // 기둥 둘 · 아래 좌우: 쇠 울타리 두른 낭떠러지 (같은 크기)
    3: [['w', 0.2, 0.77, 152, 64], ['h', 0.8, 0.77, 152, 64]], // 아래 좌우: 짐승 우리 + 피웅덩이 (같은 크기)
    4: [['w', 0.19, 0.76, 140, 76], ['w', 0.81, 0.76, 140, 76]] }; // 아래 좌우: 늘어선 집 (같은 크기)
  const CLEAR_R = 64; // 방 가운데 비워 둘 반지름
  const THICK3 = 56; // v3.19 3장: 우리 · 피웅덩이의 최소 두께 (가늘고 긴 벽이 실처럼 보이지 않게, 가운데를 기준으로 양쪽으로 넓힘)
  const MIN1 = [120, 90]; // v3.19 1장: 속이 빈 폐허 · 저수지(폭 56px 이상 덩어리)의 최소 크기 — 좁으면 안쪽 잔해가 뭉쳐 보임. 가는 돌담은 그대로
  function min1(b) { if (b.c || b.brook || b.pool || (b.t !== 'wall' && b.t !== 'pit') || Math.min(b.w, b.h) < 56) return b; if (b.w < MIN1[0]) { b.w = MIN1[0]; b.x0 = b.x - b.w / 2; b.x1 = b.x + b.w / 2; } if (b.h < MIN1[1]) { b.h = MIN1[1]; b.y0 = b.y - b.h / 2; b.y1 = b.y + b.h / 2; } return b; }
  function thick3(b) { if (b.c) return b; if (b.w < THICK3) { b.w = THICK3; b.x0 = b.x - THICK3 / 2; b.x1 = b.x + THICK3 / 2; } if (b.h < THICK3) { b.h = THICK3; b.y0 = b.y - THICK3 / 2; b.y1 = b.y + THICK3 / 2; } return b; }
  function layoutRoom(r, stage) {
    const realStage = stage; if (stage === 4) stage = 2; // v1.22 왕도의 방 배치·장식은 우선 성채 규칙을 빌린다
    withSeed(r.seed, () => {
      const keyPts = []; // 문 앞, 텔레포터, 상자 등 비워 둘 자리
      for (const d in r.doors) if (r.doors[d] != null) keyPts.push(doorIn(d, 34));
      if (r.crack) keyPts.push(doorIn(r.crack.dir, 34));
      const fight = !!LAYOUT_BY[r.type], sh = r.shape, own = LAYOUT_SHAPE_POOL[sh];
      let pool = !fight ? (sh === 'glade' && r.type === 'start' ? ['glade1'] : ['open']) : own ? own.slice() : LAYOUT_BY[r.type].concat(r.type === 'combat' ? LAYOUT_BIG_EXTRA[sh] || [] : []);
      const sx = (A.x1 - A.x0) / 1000, sy = (A.y1 - A.y0) / 540, scaled = n => !LAYOUTS_SHAPE[n];
      // v3.19 큰 방(900×450 이상 전투방)에는 벽 · 웅덩이류가 반드시 하나 이상 — 4장은 구덩이가 잔해로 바뀌므로 벽(집 · 성벽)만 셈
      const big = fight && A.x1 - A.x0 >= 900 && A.y1 - A.y0 >= 450, rectOk = b => !b.c && (b.t === 'wall' || b.t === 'pit'); // v3.19 4장도 불탄 자리가 웅덩이 자리
      if (big) { const p2 = [...new Set(pool.concat(r.type === 'combat' ? [] : BIG_RECT))].filter(n => LAYOUT_RECT[n] === 2 || LAYOUT_RECT[n] === 1); if (p2.length) pool = p2; }
      let obs = [];
      for (let tries = 0; tries < 12 && pool.length; tries++) {
        const name = pool.splice(randi(0, pool.length - 1), 1)[0];
        obs = naturalize(LAYOUTS[name]().map(sp => scaled(name) ? mkObs(sp, sx, sy) : mkObs(sp)), name, stage === 2 || stage === 3 /* v3.26 3장 토템도 2장 기둥처럼 줄 맞춤 */).map(b => stage === 3 ? thick3(b) : realStage === 1 ? min1(b) : b).filter(b => !keyPts.some(p => obsHitL([b], p.x, p.y, Math.min(62, (Math.min(A.x1 - A.x0, A.y1 - A.y0)) * 0.22))));
        // 방 가운데(보상 상자·텔레포터 자리)는 비운다: 큰 벽·구덩이가 걸리면 다른 배치, 바위·기둥은 빼기 (v0.59)
        if (obs.some(b => !b.c && obsHitL([b], CX, CY - 10, CLEAR_R))) { obs = []; continue; }
        obs = obs.filter(b => !obsHitL([b], CX, CY - 10, CLEAR_R));
        if (stage === 3) { const sgD = (px, py, ax, ay) => { const vx = CX - ax, vy = CY - ay, L = vx * vx + vy * vy || 1, t = clamp(((px - ax) * vx + (py - ay) * vy) / L, 0, 1); return Math.hypot(px - ax - vx * t, py - ay - vy * t); }; // v3.26 바위 · 토템 등 둥근 장애물은 문 → 가운데 길을 막지 않게
          const drs = Object.keys(r.doors).filter(d => r.doors[d] != null).map(d => DOOR[d]); obs = obs.filter(b => !b.c || drs.every(q => sgD(b.x, b.y, q.x, q.y) > b.r + 24)); }
        if (big && !obs.some(rectOk)) { obs = []; continue; }
        // 둥근 장애물끼리 겹치지 않게
        obs = obs.filter((b, i) => !b.c || !obs.slice(0, i).some(o => o.c ? Math.hypot(o.x - b.x, o.y - b.y) < o.r + b.r + (stage === 3 ? 30 : 10) : obsHitL([o], b.x, b.y, b.r + 6)));
        if (!obs.length && name !== 'open') continue;
        const nav = buildNav(obs), ok = keyPts.length < 2 || (() => { const dd = navFlood(nav, keyPts[0].x, keyPts[0].y); return keyPts.every(p => dd[navIdx(p.x, p.y)] >= 0); })();
        const center = navFlood(nav, CX, CY + 40);
        if (ok && keyPts.every(p => center[navIdx(p.x, p.y)] >= 0 || !nav[navIdx(CX, CY + 40)])) { r.layout = name; break; }
        obs = [];
      }
      if (r.type === 'start' && START_OBS[realStage]) { obs = START_OBS[realStage].map(sp => mkObs(sp)).filter(b => !keyPts.some(p => obsHitL([b], p.x, p.y, 40))); r.layout = 'start'; } // v3.20 시작 방: 방 가운데 기준 좌우 대칭 고정 배치
      if (realStage <= 4 && r.type !== 'start') { // v3.19 같은 크기의 벽 · 웅덩이는 섞여 나올 수 있음 (3장: 우리 + 피웅덩이) (예: 벽 하나 + 웅덩이 하나, 벽 셋 + 웅덩이 하나) — 가늘고 긴 벽(폭 56px 미만)은 제외
        const RB = obs.filter(b => !b.c && (b.t === 'wall' || b.t === 'pit') && Math.min(b.w, b.h) >= 56);
        if (RB.length >= 2 && Math.random() < 0.6) { const sh = RB.slice().sort(() => Math.random() - 0.5), k = randi(1, RB.length - 1); for (let i = 0; i < k; i++) sh[i].t = sh[i].t === 'wall' ? 'pit' : 'wall'; }
      }
      if (realStage === 4) { // v1.23 왕도엔 구덩이 없음 — 그 자리엔 잔해·깨진 종이 줄지어 놓인다
        const add = [];
        const thin4 = b => b.t === 'pit' && (b.c || Math.min(b.w, b.h) < 56); // v3.19 폭 56px 이상 구덩이는 불탄 자리로 남고, 가는 것만 예전처럼 잔해 줄로
        for (const b of obs) if (thin4(b)) { const along = b.w >= b.h, L = along ? b.w : b.h, n = Math.max(1, Math.round(L / 70));
          for (let i = 0; i < n; i++) { if (n > 2 && Math.random() < 0.3) continue; const t = (i + 0.5) / n - 0.5 + rand(-0.12, 0.12) / n, rr = randi(11, 17), off = rand(-16, 16); add.push({ t: 'rock', c: true, x: Math.round((b.x + (along ? t * L : off)) / 2) * 2, y: Math.round((b.y + (along ? off : t * L)) / 2) * 2, r: rr }); } } // v2.91 한 줄로 반듯하게 늘어서지 않게
        obs = obs.filter(b => !thin4(b)).concat(add.filter(b => !obsHitL([{ t: 'x', c: true, x: CX, y: CY - 10, r: 0 }], b.x, b.y, CLEAR_R + b.r)));
      }
      if (stage === 3) for (const b of obs) {
        const sq = b.w <= 150 && b.h <= 150 && b.w / b.h > 0.5 && b.w / b.h < 2;
        const NO_TOWER3 = true; // v3.26 망루 삭제 (false로 두면 예전처럼 망루가 나옴)
        if (b.t === 'pit') { if (sq && !NO_TOWER3) { b.t = 'wall'; b.tower = true; } } // v3.19 네모난 작은 구덩이만 망루로 — 나머지는 피웅덩이로 남음
        else if (!NO_TOWER3 && b.t === 'wall' && sq && b.w >= 36 && Math.random() < 0.5) b.tower = true;
      }
      // v0.99 망루는 네 기둥만 막힌다 — 발판 아래로 지나갈 수 있음 (그림은 b, 판정은 기둥 4개)
      if (stage === 3) for (const b of obs.slice()) if (b.tower) { b.ghost = true; for (const [x, y] of [[b.x0 + 7, b.y0 + 2], [b.x1 - 7, b.y0 + 2], [b.x0 + 3, b.y1 - 4], [b.x1 - 3, b.y1 - 4]]) obs.push({ t: 'post', c: true, x, y, r: 5, of: b }); }
      // 특별한 방의 큰 소품은 막힌 자리 (v0.76)
      const box = (x0, y0, x1, y1) => obs.push({ t: 'prop', c: false, x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, x0, y0, x1, y1 }), ring = (x, y, rr) => obs.push({ t: 'prop', c: true, x, y, r: rr });
      if (r.type === 'rest') ring(CX + SR_FIRE.dx, CY + SR_FIRE.dy, 18);
      r.obs = obs; r.nav = buildNav(obs);
      // 특수 지점
      const freeSpot = (cands) => cands.map(([u, v]) => U(u, v)).find(p => !obsHitL(obs, p.x, p.y, 34)) || U(.5, .5);
      if (r.hasTele) { // v1.90 방 가운데는 보상 상자·봉인 열쇠 자리 → 텔레포터는 비켜서 둠
        const okT = p => !obsHitL(obs, p.x, p.y, 34) && Math.hypot(p.x - CX, p.y - (CY - 10)) > 90 && Math.hypot(p.x - CX, p.y - (CY + 44)) > 60;
        r.tele = [[.25, .5], [.75, .5], [.3, .3], [.7, .7], [.7, .3], [.3, .7], [.5, .2], [.5, .82], [.15, .2], [.85, .8], [.15, .8], [.85, .2]].map(([u, v]) => U(u, v)).find(okT) || (() => { let best = null, bd = -1; for (let u = 0.15; u <= 0.86; u += 0.05) for (let v = 0.18; v <= 0.84; v += 0.06) { const q = U(u, v); if (obsHitL(obs, q.x, q.y, 34)) continue; const d = Math.min(Math.hypot(q.x - CX, q.y - (CY - 10)), Math.hypot(q.x - CX, q.y - (CY + 44)) + 30); if (d > bd) { bd = d; best = q; } } return best || freeSpot([[.25, .5], [.75, .5]]); })(); }
      if (SR_TELE[r.type]) r.tele = { x: CX + SR_TELE[r.type][0], y: CY + SR_TELE[r.type][1] }; // v1.11
      if (r.type === 'boss') { const far = q => !obsHitL(obs, q.x, q.y, 34) && (!r.tele || Math.hypot(q.x - r.tele.x, q.y - r.tele.y) > 80) && Math.hypot(q.x - CX, q.y - (CY - 10)) > 70; // v1.01 다음 스테이지 출구
        r.exitP = [[.5, .22], [.5, .78], [.3, .25], [.7, .25], [.22, .5], [.78, .5], [.3, .75], [.7, .75]].map(([u, v]) => U(u, v)).find(far) || U(.5, .22); }
      if (r.type === 'reward') r.chest = { x: CX, y: CY - 20, opened: false, kind: 'reward' };
      if (r.type === 'secret') { r.chest = { x: CX, y: CY - 10, opened: false, kind: 'secret' }; r.altars = [{ x: CX - 96, y: CY + 44, k: 'gear' }, { x: CX + 96, y: CY + 44, k: 'heart' }]; } // v2.02 피의 제단
      if (r.type === 'shop') {
        const mul = realStage === 4 ? 1.9 : stage === 2 ? 1.3 : stage === 3 ? 1.6 : 1;
        const all = [['meat', 100], ['orb', 45], ['vial', 55], ['gear', 650], ['iron', 30], ['armor', 220]]; // v2.00 방패 조각
        const pickd = [all[0], all[3], ['heartUp', 800], ...all.filter((_, i) => i !== 0 && i !== 3).sort(() => Math.random() - 0.5).slice(0, 1)].sort((a, b) => a[1] - b[1]); // v2.02 빈 하트 그릇은 가게마다 하나
        r.shop = pickd.map(([k, p], i) => ({ k, price: Math.round(p * mul * ASCF.shop() / 5) * 5, x: CX - 135 + i * 90, y: CY + 40, sold: false }));
      }
      // 방 꾸미기 설정과 서 있는 소품
      r.style = stage === 3
        ? { orc: true, ground: pick(['tread', 'tread', 'ring', 'none']), wall: Array.from({ length: 10 }, () => pick(['hide', 'hide', 'skull', 'skull', 'banner', 'spikes', 'none'])) }
        : stage === 1
        ? { path: pick(['wind', 'wind', 'wind', 'straight', 'straight', 'stones', 'brook', 'none']), ph: rand(0, 6), off: pick([-1, 1]) * rand(0.5, 1), ea: rand(0.04, 0.22), eb: rand(0.04, 0.22), ec: rand(0.06, 0.2), doors: Object.keys(r.doors).filter(d => r.doors[d] != null) }
        : { wall: Array.from({ length: 8 }, () => pick(['window', 'window', 'window', 'tapestry', 'tapestry', 'shieldSwords', 'shieldSwords', 'portrait', 'chains', 'skullNiche'])) };
      if (SR_LAYOUT[r.type] && stage === 1) { r.style.path = 'none'; r.style.doors = []; } // v1.11 특별한 방엔 길 없음
      const brookSide = () => { if (r.style.path !== 'brook') return; const free = ['n', 's', 'w', 'e'].filter(d => r.doors[d] == null && !(r.crack && r.crack.dir === d)); if (!free.length) { r.style.path = 'wind'; return; } r.style.side = pick(free); };
      const spots = keyPts.concat(r.tele ? [r.tele] : [], r.chest ? [r.chest] : [], r.shop || [], r.type === 'rest' ? [{ x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy }] : []);
      if (stage === 1) brookSide();
      if (stage === 1 && (r.style.path !== 'none' || r.style.doors.length)) { // 길이 나무·덤불·연못 밑으로 지나가지 않게
        const RS0 = ROOMSTYLE, clash = () => { brookSide(); ROOMSTYLE = r.style; const cs = meadowCurves(); ROOMSTYLE = RS0; return cs.some(c => { for (let t = c.a; t < c.b; t += 4) { const m = c.at(t); const px = c.vert ? m : t, py = c.vert ? t : m; if (obsHitL(obs, px, py, c.kind === 'brook' ? 30 : 28) || (c.kind === 'brook' && (Math.hypot(px - CX, py - (CY - 10)) < CLEAR_R + 18 || spots.some(q => Math.hypot(px - q.x, py - q.y) < 46)))) return true; } return false; }); };
        for (let k = 0; k < 10 && clash(); k++) Object.assign(r.style, { path: pick(['wind', 'wind', 'straight', 'stones', 'brook']), ph: rand(0, 6), off: pick([-1, 1]) * rand(0.5, 1) });
        if (clash()) {
          r.style.path = 'straight'; r.style.ph = 0; r.style.off = 0;
          ROOMSTYLE = r.style; const safePaths = meadowCurves(); ROOMSTYLE = RS0;
          const blocksRoad = b => safePaths.some(c => { for (let t = c.a; t <= c.b; t += 4) { const m = c.at(t), px = c.vert ? m : t, py = c.vert ? t : m; if (obsHitL([b], px, py, 28)) return true; } return false; });
          const kept = obs.filter(b => !blocksRoad(b));
          if (big && !kept.some(rectOk)) { r.style.path = 'none'; r.style.doors = []; } // v3.19 큰 방의 벽 · 웅덩이가 길 때문에 다 빠지면 길을 없앰
          else { obs = kept; r.obs = obs; r.nav = buildNav(obs); }
        }
      }
      const pts = keyPts.slice(); pts.push({ x: CX, y: CY - 10, big: true });
      if (r.tele) pts.push(r.tele); if (r.chest) pts.push(r.chest); if (r.shop) pts.push(...r.shop, { x: CX, y: CY - 70 }, { x: CX + 30, y: CY - 70 }); if (r.type === 'rest') pts.push({ x: CX - 4, y: CY - 10 }); // 모닥불 옆 (불 자체는 막힌 자리라 연결 검사에서 빼야 소품이 지워지지 않는다)
      if (r.type === 'boss' && r.style.path === 'brook') r.style.path = 'wind'; // 보스 방에는 개울 없음
      if (stage === 1 && realStage === 1) r.style.pave = obs.some(b => !b.c && (b.t === 'wall' || (b.t === 'pit' && !b.brook && !b.pool))); // v3.19 폐허(벽)나 저수지가 있는 방만 옛 돌길, 나머지는 흙길
      if (r.type !== 'boss' || stage === 3) decorRoom(r, realStage, pts); else r.props = [];
      r.spritesN = spriteObsN(r); // v2.85 장애물 그림은 배치 때 한 번 만들어 그대로 씀 (점유 지도가 실제 그림으로 잼)
    });
  }
  const spriteObsN = R => R.obs.filter(b => !['pit', 'prop', 'drum', 'chest'].includes(b.t)).length;

  // ---------- 진입·진행
  function newDungeon() {
    G.dun = genDungeon(G.stage);
    G.mood = null;
    enterRoom(G.dun.start, null);
    if (!wmStart()) showStageParchment(G.stage, G.cls);
  }
  function setMood(m) { if (G.mood !== m) { G.mood = m; window.AudioSys.setMood(m, true); } }
  // v1.81: 챕터(1~4)마다 다른 칩튠 곡 — 탐험 '' · 봉인 'Survive' · 보스 'Boss' · 휴식 'Rest'
  function stageMood(k) { return 's' + clamp((G && G.stage) | 0, 1, 4) + k; }
  const hiddenDoor = (R, d) => (R.crack && R.crack.dir === d && !R.crack.broken) || TRUTH.sealHidden(R, d); // v2.59 인장 벽(닫힘)도 숨은 문
  function enterRoom(R, entry, opt = {}) {
    const D = G.dun, P = G.player;
    if (G.kgAuto && D.cur && D.cur !== R) { G.kg = false; G.kgAuto = false; } // v2.19 다음 방으로 넘어가면 조작 안내를 접는다 (H로 다시)
    if (D.cur && D.cur !== R) D.cur.loot = G.loot.filter(l => l.life > 0);
    setArena(SHAPES[R.shape]);
    if (R.sealW) { PILLARS = PILLARS.filter(x => Math.abs(x - DOOR.n.x) > 100); TORCHES = TORCHES.filter(t => Math.abs(t.x - DOOR.n.x) > 100); } // v2.64 인장 벽 둘레엔 벽 기둥·깃발·횃불 없음
    if (R.doors && R.doors.n != null && !R.sealW) { /* v3.20 모든 장: 3장 부락에서도 북문 안에 횃불이 서던 문제 */ PILLARS = PILLARS.filter(x => Math.abs(x - DOOR.n.x) > 78); TORCHES = TORCHES.filter(t => Math.abs(t.x - DOOR.n.x) > 78); } // v3.19 북문 자리의 벽 기둥 · 횃불은 뺌 (문 · 문 옆 화로와 겹침)
    if (R.type === 'altar') { PILLARS = [CX - 290, CX - 190, CX + 190, CX + 290]; TORCHES = PILLARS.map(x => ({ x, y: A.y0 - 38 })); } // v3.20 왕도 성문 방: 뒷벽 기둥 · 창 · 횃불을 성문 기준 좌우 대칭으로 (방 왼쪽 끝 기준이라 한쪽으로 쏠렸음)
    END.prepRoom(R); // v2.54 2회차부터 대관식장 가운데에 잿빛 왕의 흔적
    R.socks = sealSocks(R);
    D.cur = R; R.visited = true; R.seen = true;
    for (const d in R.doors) if (R.doors[d] != null && !hiddenDoor(R, d)) D.rooms[R.doors[d]].seen = true;
    G.meteorAim = false; G.wproj = []; G.dustC = []; G.soup = []; G.smoke = []; G.harp = null; G.mmet = []; G.tstopT = 0; G.enemies = []; G.tele = []; G.hazards = []; G.ashClouds = []; G.ashShots = []; G.proj = []; G.eproj = []; G.mproj = []; G.meteor = null; G.vortex = null; G.boss = null; G.bonfire = null;
    G.fx = []; G.parts = []; G.nums = []; G.corpses = R.keepC ? R.keepC.slice() : []; G.spawning = 0; // v2.38 난입자 시체는 방에 남음
    G.drums = R.drum ? [R.drum] : []; G.shocks = []; P.grab = null; P.thrown = null; P.lift = 0;
    G.loot = R.loot || []; R.loot = []; G.pfire = [];
    if (G.stats && G.stats.efx.has('first') && !R.cleared && ['combat', 'elite', 'survive', 'boss'].includes(R.type)) { P.critNext = true; P.firstCrit = true; P.firstN = 2; } /* v1.51 첫 적중 + 2번 더 */
    G.obs = R.obs; G.nav = R.nav; G.navDist = null; G.navT = 0;
    if (!R.sprites || (R.spritesN != null && R.spritesN !== spriteObsN(R))) { R.sprites = makeObsSprites(R); R.spritesN = spriteObsN(R); } // v2.85 장애물이 바뀐 방(진엔딩 단서 등)만 다시
    G.flies = G.stage === 1 && R.type !== 'forge' && R.type !== 'home' ? Array.from({ length: randi(6, 14) }, () => ({ x: rand(A.x0 + 20, A.x1 - 20), y: rand(A.y0 + 10, A.y1 - 20), rx: rand(10, 30), ry: rand(6, 16), s: rand(0.6, 1.4), p: rand(0, 6) })) : null;
    dg.clearRect(0, 0, W, H);
    floorCached(R); G.entryDt = true; P.staffUntil = time + 3; // v2.36 순례자의 지팡이 // v2.35 다시 들어간 방은 그려 둔 바닥을 그대로 · 들어온 직후 한 프레임은 시간 점프 없이
    G.phase = R.tier || 1;
    G.rs = { state: 'idle', t: 0, wave: 0, surviveT: 0 };
    G.sealed = false;
    // 플레이어 위치
    let p = entry ? doorIn(entry, 30) : opt.tele && R.tele ? { x: R.tele.x, y: R.tele.y + 22 } : { x: CX, y: Math.min(CY + 60, A.y1 - 30) };
    if (!entry && !opt.tele && R.type === 'boss') p = { x: CX, y: A.y1 - 60 };
    Object.assign(P, { x: p.x, y: p.y, state: 'idle', t: 0, lift: 0, giant: 0, queued: false, trail: [], trail2: [], inv: Math.max(P.inv, 0.6), iframe: 0 });
    solveObs(P, P.r);
    // 방 종류별
    const fresh = !R.cleared;
    if (R.type === 'combat' || R.type === 'elite' || R.type === 'survive' || R.type === 'boss') {
      if (fresh) { G.rs.state = 'intro'; sealRoom(true); }
    } else R.cleared = true;
    if (fresh && R.type === 'elite') banner(ER().n, ER().sub[R.tier] || STG().elite);
    if (fresh && R.type === 'survive') banner('봉인된 방', `문이 닫혔다 · ${SURV_N}차례의 습격을 견뎌야 한다`);
    if (fresh && R.type === 'boss') { banner(STG().boss, STG().bossSub); $('bossName').textContent = STG().boss; sfx('boss'); G.bossTime = 300; G.phase = 11; }
    if (R.type === 'shop') shopHeartFix(R);
    if (R.type === 'rest') { G.bonfire = { x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy }; if (!R.healed) { R.healed = true; if (hasRelic('lantern')) { addArmor(1); lootFeed('희망의 등불 — 방패 +1', '#ffd34d'); } /* v2.36 */ P.hp = ascOn(9) ? Math.min(G.stats.hp, P.hp + Math.round((G.stats.hp - P.hp) * 0.5 * ASCF.heal())) : G.stats.hp; /* v1.96 꺼진 모닥불 */ banner(BISTRO.NAME, '언제든 식사 됩니다.', false, CX); /* v3.10 맵 가운데 */ /* v3.10 */ } }
    if (R.type === 'shop' && !R.greeted) { R.greeted = true; banner('살구의 비밀상점', '네고 없음, 환불 불가'); }
    if (R.type === 'reward' && !R.greeted) { R.greeted = true; banner('보물 방', ''); }
    if (hasRelic('oldmap')) for (const r of G.dun.rooms) if (r.type === 'secret') r.seen = true; // v2.29 낡은 지도
    if (fresh && R.type === 'boss' && hasRelic('gravedirt')) { addArmor(1); lootFeed('무덤 흙 — 방패 +1', '#c8a880'); }
    if (R.type === 'secret' && !R.greeted) { rec('secret'); R.greeted = true; banner('비밀 방', '잊힌 틈새에 남은 물건이 있다'); }
    const RM = { den: 'den', ruin: 'ruin', rest: 'rmBistro', shop: 'rmShop', reward: 'rmReward', secret: 'rmSecret' }; // v3.19 쉬는 방마다 전용 곡 (비스트로 · 상점 · 보물 방 · 비밀 방)
    if (RM[R.type]) setMood(RM[R.type]); else
    setMood(stageMood(R.type === 'boss' && fresh ? 'Boss' : R.type === 'survive' && fresh ? 'Survive' : ['rest', 'shop', 'secret', 'reward', 'shrine'].includes(R.type) ? 'Rest' : ''));
    if (R.type === 'shrine' && !R.greeted) { R.greeted = true; banner('빛의 방', '세 빛이 겹친 자리에 흰 빛이 떠 있다'); } // v3.25
    if (R.type === 'start') {
      spawnDummy(); // v2.04 시작 방 허수아비 (무기 시험용)
      if (G.stage === 1 && !SAVE.tutDone && !G.tutDone) G.tut = { step: 0, moveT: 0, atkN: 0, skN: 0, awkN: 0, dashN: 0, doneT: 0 };
    } else if (G.tut) {
      G.tut = null;
    }
    updateCamera(0, true);
  }
  // v2.04 허수아비: 맞고, 상태 이상이 걸리고, 죽지 않는다 (HP가 바닥나면 다시 가득) · 움직이거나 공격하지 않음
  function spawnDummy() {
    const cands = [[90, -30], [-90, -30], [90, 30], [-90, 30], [0, -60], [120, 0], [-120, 0]];
    let px = CX + 90, py = CY - 30;
    for (const [dx, dy] of cands) { const x = CX + dx, y = CY + dy; if (!obsHitL(G.obs || [], x, y, 16) && Math.hypot(x - G.player.x, y - G.player.y) > 40) { px = x; py = y; break; } }
    G.enemies.push({ type: 'dummy', x: px, y: py, hx: px, hy: py, z: 0, r: 9, hp: 500, maxHp: 500, atk: 0, def: 0, spd: 0, kbRes: 0, vx: 0, vy: 0, face: -1, walk: 0, lean: 0, flash: 0, rise: 0, state: 'idle', t: 0, squash: 0, glow: 0, hitT: 0 });
  }
  const isDummy = e => e && e.type === 'dummy';
  function restartRoom() { enterRoom(G.dun.cur, null); }
  function sealRoom(on) {
    if (G.sealed === on) return;
    G.sealed = on; if (!on) pasOnClear(); // v2.22 보관 패시브 (방을 비움)
    sfx(on ? 'heavy' : 'ready'); addShake(on ? 4 : 2);
    for (const d in DIRS) if (G.dun.cur.doors[d] != null && !hiddenDoor(G.dun.cur, d)) { const q = doorIn(d, 4); dust(q.x, q.y, 8); }
  }
  function doorState(R, d) {
    const id = R.doors[d]; if (id == null) return 'none';
    if (hiddenDoor(R, d)) return R.crack && R.crack.dir === d ? 'crack' : 'none';
    if (G.sealed) return 'sealed';
    if (G.dun.rooms[id].type === 'boss' && !G.dun.bossOpen) return 'boss';
    return 'open';
  }
  function goRoom(R, entry, tele) {
    if (G.trans) return;
    sfx(tele ? 'awaken' : 'dodge');
    G.trans = { t: 0, dur: tele ? 0.3 : 0.16, phase: 'out', go: () => enterRoom(R, entry, { tele }) };
  }
  function updateTrans(rdt) {
    const tr = G.trans; if (!tr) return false;
    tr.t += rdt;
    if (tr.phase === 'out') { if (tr.t >= tr.dur) { tr.go(); tr.phase = 'in'; tr.t = 0; } return true; }
    if (tr.t >= tr.dur) G.trans = null;
    return false;
  }
  function updateRoom(dt) {
    const D = G.dun, R = D.cur, rs = G.rs, P = G.player;
    rs.t += dt;
    const alive = G.enemies.filter(e => !e.dead).length;
    if (rs.state === 'intro' && rs.t > (R.type === 'boss' ? 1.4 : 0.55)) {
      rs.state = 'run'; rs.t = 0;
      if (R.waves) spawnWave(R.waves[0]);
      if (R.type === 'survive') { G.spawnT = 0; rs.ph = 0; rs.phT = 0; rs.idleT = 0; survivePhase(0); }
      if (R.type === 'boss') { G.bossClean = true; /* v2.02 무피격 판정 시작 */ if (G.stage === 1) spawnSlimeKing(); else if (G.stage === 3) spawnKrugash(); else if (G.stage === 4) spawnAshKing(); else spawnBoss(); }
    } else if (rs.state === 'invade') { if (alive === 0 && G.spawning === 0 && rs.t > 0.8) roomClear(); // v1.57 난입자를 쓰러뜨리면 클리어
    } else if (rs.state === 'run') {
      if (R.waves) {
        const last = rs.wave >= R.waves.length - 1;
        if (G.spawning === 0 && (last ? alive === 0 : alive <= (R.type === 'elite' || G.enemies.some(x => !x.dead && isSemi(x)) ? 0 : 2) && rs.t > 1.5)) { rs.wave++; rs.t = 0; if (rs.wave < R.waves.length) { spawnWave(R.waves[rs.wave]); sfx('growl', 0.8); addShake(2); } else roomClear(); }
      } else if (R.type === 'survive') { // v0.76: 4페이즈 리젠 방 — 페이즈마다 적이 계속 다시 나타나고, 시간이 지나면(또는 잠시 적이 없으면) 다음 페이즈. 4페이즈가 끝나면 남은 적을 정리
        rs.surviveT += dt; rs.phT += dt; G.spawnT -= dt;
        const PT = SURV_PT(), last = rs.ph >= SURV_N - 1, regen = !(last && rs.phT >= PT);
        if (regen && G.spawnT <= 0 && alive + G.spawning < survCap(rs.ph)) { G.spawnT = (G.stage === 1 ? 1.5 : 1.2) * (1 - rs.ph * 0.12); let r = Math.random(); for (const [t, w] of STG().survive) { if (r < w) { queueSpawn(t); break; } r -= w; } }
        rs.idleT = alive + G.spawning === 0 ? rs.idleT + dt : 0;
        if (!last && (rs.phT >= PT || (rs.idleT > 1.2 && rs.phT > 4))) { rs.ph++; rs.phT = 0; survivePhase(rs.ph); }
        else if (last && rs.phT >= PT && !rs.final) { rs.final = true; banner('습격 종료', '남은 적을 정리하면 봉인이 풀린다'); sfx('grogi'); }
        { const c = Math.ceil(PT - rs.phT), k = rs.ph * 10 + c; if (c >= 1 && c <= 3 && rs.cdK !== k) { rs.cdK = k; banner(String(c), last ? '끝까지 버텨야 한다' : '다음 무리가 다가온다'); sfx('blip', c === 1 ? 1.5 : 1); } }
        if (last && rs.phT >= PT && alive === 0 && G.spawning === 0) roomClear();
      }
    }
    updateNav(dt);
    G.crackCd = Math.max(0, (G.crackCd || 0) - dt);
    updateGate(dt); updateAmbush(dt);
    if (!G.sealed && !G.trans && !P.dead) checkDoors();
    // 상호작용 (F)
    G.prompt = P.dead ? null : nearInteract();
    updateGearCmp();
    if (take('f') && G.prompt) doInteract(G.prompt);
    { // v2.19 F 홀드: 주변에 상호작용할 것이 없으면 들고 있는 무기를 바닥에 내려놓는다 (장비창 안 열고)
      const cw = eqWeapon(G.cls), ok = cw && !P.dead && !G.trans && !(G.dun && G.dun.cur && G.dun.cur.type === 'forge');
      if (!keys['f']) G.dropHold = 0;
      else if (G.prompt || !ok) G.dropHold = -1; // 상호작용으로 누른 F는 버리기로 이어지지 않게 (뗄 때까지 잠금)
      else if (G.dropHold >= 0) { G.dropHold += dt; if (G.dropHold >= 0.7) { G.dropHold = -1; dropWeapon(cw, P.x + 16 * P.face, P.y + 8); G.stats = calcStats(G.buffs); P.hp = Math.min(P.hp, G.stats.hp); P.chainL = null; P.whipL = null; persist(); sfx('drop'); lootFeed(`「${cw.name}」 버림`, gradeOf(cw).c, 1400); } }
    }
    // 비밀 벽 힌트: 가까이 가면 가끔 먼지가 떨어진다
    if (R.crack && !R.crack.broken) { const c = crackPoint(R); if (Math.hypot(P.x - c.x, P.y - c.y) < 220 && Math.random() < dt * 2.5) G.parts.push({ x: c.x + rand(-12, 12), y: c.y - rand(0, 20), vx: rand(-6, 6), vy: rand(10, 30), t: rand(0.4, 0.8), c: pick(['#6a6470', '#4d4858', '#8a8478']), g: 60 }); }
    // 텔레포터 위 F 안내는 nearInteract에서
  }
  // 4페이즈 리젠 방 설정: 페이즈 길이, 페이즈별 최대 동시 적 수, 페이즈 시작 시 한꺼번에 몰려오는 적
  const SURV_CRY = { // v1.18 습격마다 표시되는 문구
    1: ['덤불 너머에서 기척이 일어난다', '고블린 무리가 발소리를 죽이지 않고 몰려든다', '바닥 틈에서 탁한 점액이 스며 나온다', '거대 점액이 깨어났다 · 끝까지 버텨야 한다'],
    2: ['석관 덮개가 비틀리며 열린다', '이름을 잃은 망자들이 어둠 속에서 걸어 나온다', '짙은 역병의 악취가 방 안을 채운다', '부푼 시체가 기어온다 · 끝까지 버텨야 한다'],
    4: ['먼 곳에서 깨진 종소리가 울린다', '닫혀 있던 관들이 하나씩 열린다', '가라앉지 않은 재가 숨통을 조여 온다', '왕의 기수가 깃발을 세운다 · 끝까지 버텨야 한다'],
    3: ['협곡 바닥을 울리는 낮은 함성이 들린다', '부락의 전사들이 사방에서 들이닥친다', '피에 젖은 정예들이 대열을 갖춘다', '대족장의 친위대다 · 끝까지 버텨야 한다'],
  };
  const SURV_N = 4, SURV_PT = () => G.stage === 1 ? 14 : G.stage === 2 ? 15 : 16;
  const survCap = ph => Math.round(STG().surviveMax * (0.5 + ph * 0.17));
  function survivePhase(ph) {
    banner(ph === SURV_N - 1 ? '마지막 습격' : `습격 ${ph + 1}/${SURV_N}`, (SURV_CRY[G.stage] || SURV_CRY[1])[Math.min(ph, 3)]); sfx('growl', 0.8 - ph * 0.05); addShake(3 + ph);
    const n = 2 + ph; for (let i = 0; i < n; i++) { let r = Math.random(); for (const [t, w] of STG().survive) { if (r < w) { queueSpawn(t); break; } r -= w; } }
    if (G.stage === 3 && ph >= 2) queueSpawn(pick(['ocharge', 'otroll', 'ogrip']));
    if (G.stage !== 3 && ph === SURV_N - 1) queueSpawn(G.stage === 1 ? 'bigslime' : G.stage === 4 ? 'coffin' : 'bloat');
    if (G.stage === 4 && ph === 2) queueSpawn('herald');
  }
  function roomClear() {
    const R = G.dun.cur;
    if (R.invade && !R.invaded) { R.invaded = true; startInvasion(R); return; } // v1.57 난입
    R.cleared = true; R.clearAt = time; G.rs.state = 'done'; startPaint(R, G.player.x, G.player.y - 8); skShake(7, G.lastKillAng); // v2.34 빛 조각 · v3.25 마지막 적을 쓰러뜨리면 화면 흔들림
    sealRoom(false);
    if (R.type === 'elite') {
      const n = ++G.dun.eliteDone;
      banner(`${ER().clear} ${Math.min(n, 2)}/2`, SK().drop); sfx('grogi');
      { const q = freePoint(CX, CY + 44); spawnLoot('sealkey', q.x, q.y); G.fx.push({ kind: 'skybeam', x: q.x, y: q.y, w: 22, c: SK().rgb, t: 0.8, max: 0.8, up: true }); } // v1.18 봉인 열쇠
      // v2.32 정예 방은 상자 없음 (사용자 결정) — 봉인 열쇠 + 하트 또는 골드 확정
      { const P = G.player, q = freePoint(CX, CY - 10), heart = P.hp < G.stats.hp && Math.random() < 0.5; if (heart) spawnLoot('bigmeat', q.x, q.y); else { spawnLoot('pouch', q.x, q.y); spawnLoot('pouch', q.x, q.y); } G.fx.push({ kind: 'skybeam', x: q.x, y: q.y, w: 22, c: heart ? '255,90,100' : '255,210,120', t: 0.6, max: 0.6, up: true }); }
    } else if (R.type === 'survive') {
      banner('봉인 해제', '침묵이 돌아왔다 · 상자가 모습을 드러냈다');
      R.chest = { x: CX, y: CY - 10, opened: false, kind: 'reward' };
      G.fx.push({ kind: 'skybeam', x: CX, y: CY - 10, w: 30, c: '255,210,120', t: 0.6, max: 0.6 });
    }
    if (R.invaded) { rec('invader'); rec('inv_' + (R.invade || 'panda')); /* v3.00 난입자별 기록 (기록보관소 석상) */ banner('난입자 격퇴', '전리품 상자가 남았다'); R.chest = { x: CX, y: CY - 10, opened: false, kind: 'elite', inv: true }; if (ascOn(7)) { G.crystal++; lootFeed('난입자 격퇴 — 정령의 결정 +1', '#9fd2ff'); } G.fx.push({ kind: 'skybeam', x: CX, y: CY - 10, w: 30, c: '255,120,80', t: 0.6, max: 0.6 }); } // v1.57 난입자 처치 → 장비 3택1
    // 건전식 방 클리어 보상: 일정 확률로 보급품
    if (R.type === 'combat' && Math.random() < 0.35) { const p = freePoint(CX, CY); spawnLoot(pick(['meat', 'meat', 'orb', 'pouch']), p.x, p.y); }
    if (R.tele && !G.dun.teleHint) { G.dun.teleHint = true; lootFeed(TOUCH.on ? '텔레포터 활성화 — 지도에서 순간이동' : '텔레포터 활성화 — <span class="key">TAB</span> 지도에서 순간이동', '#9fd2ff'); }
  }
  function freePoint(x, y) { for (let i = 0; i < 30; i++) { const a = rand(0, TAU), d = i * 6; const px = clamp(x + Math.cos(a) * d, A.x0 + 20, A.x1 - 20), py = clamp(y + Math.sin(a) * d, A.y0 + 20, A.y1 - 20); if (!obsHitL(G.obs || [], px, py, 14)) return { x: px, y: py }; } return { x, y }; }
  function checkDoors() {
    const P = G.player, R = G.dun.cur;
    for (const d in DIRS) {
      if (doorState(R, d) !== 'open') continue;
      if (R.sealW && R.sealW.dir === d) continue; // v2.67 인장 문은 F로 들어감
      const D0 = DOOR[d], inX = Math.abs(P.x - D0.x) < 20, inY = Math.abs(P.y - D0.y) < 20;
      if ((d === 'n' && inX && P.y <= A.y0 + P.r + 1) || (d === 's' && inX && P.y >= A.y1 - P.r - 1) || (d === 'w' && inY && P.x <= A.x0 + P.r + 1) || (d === 'e' && inY && P.x >= A.x1 - P.r - 1)) {
        goRoom(G.dun.rooms[R.doors[d]], OPP[d]); return;
      }
    }
  }
  function debugClearRoom() {
    const R = G.dun.cur;
    if (!G.rs || (G.rs.state !== 'intro' && G.rs.state !== 'run' && G.rs.state !== 'invade') || R.type === 'boss') return;
    G.enemies.forEach(e => { if (!e.dead) killEnemy(e, true); }); G.tele = []; G.spawning = 0;
    if (R.type === 'elite' || R.type === 'combat' || R.type === 'survive') roomClear();
  }
  function debugToBoss() {
    const D = G.dun; D.eliteDone = 2; D.sock = [true, true]; D.bossOpen = true; D.gate = null;
    const entry = Object.keys(D.boss.doors).find(d => D.boss.doors[d] != null);
    D.foyer.visited = D.foyer.seen = true; D.foyer.cleared = true;
    goRoom(D.boss, entry);
  }

  function debugToShrine() { // v3.25 테스트: 빛의 방으로 (Shift+H) · 다시 쓸 수 있게 · 빛 각 45개
    const D = G.dun, R = D.rooms && D.rooms.find(r => r.type === 'shrine');
    if (!R) { lootFeed('테스트 — 이 층에는 빛의 방이 없습니다', '#9a8f8a', 2500); return; }
    R.shrineUsed = false; R.shrineOpts = null; R.visited = R.seen = true; for (const c of ['r', 'b', 'g']) G.pal[c] = Math.max(G.pal[c] || 0, 45); renderPal(); /* 해금 기록이 남지 않게 hueGain을 거치지 않음 */
    if (D.cur === R) { lootFeed('테스트 — 흰 빛을 다시 쓸 수 있습니다', '#9fd2ff', 2000); return; }
    goRoom(R, Object.keys(R.doors).find(d => R.doors[d] != null));
  }
  function debugToRest() { // v3.10 테스트: 휴게방(비스트로)으로 바로 이동 (Shift+R). 이미 휴게방이면 주문만 다시 가능하게
    const D = G.dun, R = D.rooms && D.rooms.find(r => r.type === 'rest');
    if (!R) { lootFeed('테스트 — 이 층에는 휴게방이 없습니다', '#9a8f8a', 2500); return; }
    R.used = false; R.visited = R.seen = true;
    if (D.cur === R) { lootFeed('테스트 — 다시 주문할 수 있습니다', '#9fd2ff', 2000); return; }
    goRoom(R, Object.keys(R.doors).find(d => R.doors[d] != null));
  }

  // ---------- 비밀 벽
  function crackPoint(R) { const d = R.crack.dir, p = DOOR[d]; return { x: p.x + (d === 'w' ? 6 : d === 'e' ? -6 : 0), y: p.y + (d === 'n' ? 6 : d === 's' ? -6 : 0) }; }
  function hitCrack(x, y, power = 1, rad = 40) { const a = (G && G.drums && G.drums.length ? hitDrums(x, y, power, rad) : false) | hitFolk(x, y, rad); return hitCrack0(x, y, power, rad) || a; }
  function hitCrack0(x, y, power = 1, rad = 40) {
    const R = G && G.dun && G.dun.cur; if (!R || !R.crack || R.crack.broken) return false;
    const c = crackPoint(R); if (Math.hypot(x - c.x, y - c.y) > rad) return false;
    if (G.crackCd > 0) return true;
    G.crackCd = 0.22; R.crack.hp -= power;
    debris(c.x, c.y, 10); sfx('block'); addShake(3); /* v1.08 역경직 제거 */
    G.fx.push({ kind: 'hitspark', x: c.x, y: c.y - 6, ang: rand(0, TAU), rot: 0, t: 0.12, max: 0.12, r: 18, c: '230,220,200' });
    if (R.crack.hp <= 0) {
      R.crack.broken = true;
      const S = G.dun.rooms[R.doors[R.crack.dir]]; S.seen = true;
      sfx('blast'); addShake(9); flashT = 0.08; flashColor = '#fff0d0'; debris(c.x, c.y, 30); dust(c.x, c.y, 20);
      banner('비밀 통로', '금 간 벽 너머로 길이 이어진다');
      paintRoomFloor(R); { const i = FL_CACHE.findIndex(c => c.key === G.stage + ':' + R.id); if (i >= 0) FL_CACHE.splice(i, 1); }
    }
    return true;
  }

  // ---------- 상호작용: 상자 · 상인 · 텔레포터 · 모닥불
  // v2.02 피의 제단 도트: 돌 제단 + 핏물 그릇 + 촛불, 앞면 문양 (하트 = 장비를 바쳐 하트 / 칼 = 하트를 바쳐 장비)
  // v2.80 피의 제단 키움 (22×20칸): 받침 · 위로 좁아지는 몸통 · 앞면 문양 판 · 핏물 그릇 · 흘러내린 피 · 양끝 초 (하트 = 장비를 바쳐 하트 / 칼 = 하트를 바쳐 장비)
  const BALT = {"balt_gear": ["......................", "......................", ".......kkkkkkkk.......", ".kk...k11112222k..kk..", "kwWk.k1RrerrRRR2kkwWk.", "kwWkkk22RRrrRR22kkwWk.", "k1w111133333r331111w4k", "k13333r33333r33333334k", ".kk122R22223RR33344kk.", "..k1222444444443344k..", "..k124245E5E5523344k..", "..k12224EEEEE523344k..", "..k12224EEEEE524344k..", "..k122245EEE5523344k..", "..k1224455E55523344k..", "..k1222422222223344k..", ".kk1555555555555544kk.", "k22222222222222222222k", "k33333333333333444444k", "k55555555555555555555k"], "balt_gear_u": ["......................", "......................", ".k.....kkkkkkkk...k...", "k4k...k11112222k.k4k..", "kwWk.k1544444452kkwWk.", "kwWkkk2255445522kkwWk.", "k1w1111333333331111w4k", "k13333333333333333334k", ".kk1222222233333344kk.", "..k1222444444443344k..", "..k124245R5R5523344k..", "..k12224RRRRR523344k..", "..k12224RRRRR524344k..", "..k122245RRR5523344k..", "..k1224455R55523344k..", "..k1222422222223344k..", ".kk1555555555555544kk.", "k22222222222222222222k", "k33333333333333444444k", "k55555555555555555555k"], "balt_heart": ["......................", "......................", ".......kkkkkkkk.......", ".kk...k11112222k..kk..", "kwWk.k1RrerrRRR2kkwWk.", "kwWkkk22RRrrRR22kkwWk.", "k1w111133333r331111w4k", "k13333r33333r33333334k", ".kk122R22223RR33344kk.", "..k1222444444443344k..", "..k1242455S55523344k..", "..k1222455S55523344k..", "..k1222455S55524344k..", "..k122245SSS5523344k..", "..k1224455s55523344k..", "..k1222422222223344k..", ".kk1555555555555544kk.", "k22222222222222222222k", "k33333333333333444444k", "k55555555555555555555k"], "balt_heart_u": ["......................", "......................", ".k.....kkkkkkkk...k...", "k4k...k11112222k.k4k..", "kwWk.k1544444452kkwWk.", "kwWkkk2255445522kkwWk.", "k1w1111333333331111w4k", "k13333333333333333334k", ".kk1222222233333344kk.", "..k1222444444443344k..", "..k1242455355523344k..", "..k1222455355523344k..", "..k1222455355524344k..", "..k1222453335523344k..", "..k1224455355523344k..", "..k1222422222223344k..", ".kk1555555555555544kk.", "k22222222222222222222k", "k33333333333333444444k", "k55555555555555555555k"]};
  const ALTAR_PAL = { k: '#0e0a0c', y: '#ffd060', Y: '#fff0b0', w: '#e8e0cc', W: '#bcb4a0', R: '#5a0a10', r: '#a01218', e: '#d83a3a', '1': '#8a8478', '2': '#6a665c', '3': '#4e4a42', '4': '#34312c', '5': '#24221e', g: '#c9952a', G: '#8a6418', E: '#e0303a', S: '#d8d8e0', s: '#9a9aa8' };
  function drawAltar(a) {
    const key = 'balt_' + a.k + (a.used ? '_u' : ''), cv = art(key, () => gCanvas(fromRows(BALT[key]), ALTAR_PAL));
    drawShadow(a.x, a.y + 1, 20);
    const x0 = snap2(a.x - cv.width / 2), y0 = snap2(a.y - cv.height + 2);
    ctx.drawImage(cv, x0, y0);
    if (!a.used) for (const cx of [1, 18]) { const f = (Math.floor(time * 7) + cx) % 3; ctx.fillStyle = '#ff8a2a'; ctx.fillRect(x0 + cx * 2, y0 + 4, 2, 2); ctx.fillStyle = '#fff3c0'; ctx.fillRect(x0 + cx * 2 + (f === 1 ? 2 : 0), y0 + 2 - (f === 2 ? 2 : 0), 2, 2); }
  }
  function nearInteract() {
    const P = G.player, R = G.dun.cur, near = (o, d = 34) => Math.hypot(P.x - o.x, P.y - o.y) < d;
    { const ti = TRUTH.interact(); if (ti) return ti; } // v2.58 진엔딩 단서
    { const fi = forgeInteract(); if (fi) return fi; }
    { const ai = CA.interact(); if (ai) return ai; } // v2.52 재의 제단
    { const ei = END.interact(); if (ei) return ei; } // v2.54 떨어진 왕관
    { const hi = HOME.interact(); if (hi) return hi; } // v2.55 시작 장소 출구
    { const ri = ARCH.interact(); if (ri) return ri; } // v3.00 코코아의 기록 보관소
    { const di = DEN.interact(); if (di) return di; } // v3.17 영수 명수의 안전 놀이터
    if (R.chest && (!R.chest.opened || R.chest.pending) && !R.chest.fall && near(R.chest, 36)) return { k: 'chest', o: R.chest, x: R.chest.x, y: R.chest.y - 30, t: R.chest.pending ? 'F 보류한 전리품 고르기' : R.chest.kind === 'boss' ? 'F 보스의 전리품' : 'F 상자 열기' };
    { const gl = nearGear(); if (gl) return { k: 'gear', o: gl, x: gl.x, y: gl.y - 30, t: wFull(G.cls) && gl.it.cls === G.cls ? 'F 바꿔 들기' : 'F 줍기' }; }
    if (R.socks && !G.dun.bossOpen && !G.dun.gate) for (const s of R.socks) if (!(s.dual ? G.dun.sock[0] && G.dun.sock[1] : G.dun.sock[s.i]) && near(s, 36)) { const K = SK(), y = s.y - SOCK_H[SST()] - 8; return G.dun.keys > 0 ? { k: 'sock', o: s, x: s.x, y, t: `F ${K.act}` } : { k: 'none', o: s, x: s.x, y, t: K.need, bad: true }; }
    if (R.exit && near(R.exit, 26)) return { k: 'exit', o: R.exit, x: R.exit.x, y: R.exit.y - 30, t: R.type === 'forge' ? `F STAGE ${G.stage + 1}로` : G.stage < lastStage() ? `F 다음 스테이지로 · 대장간` : 'F 원정 완료' };
    if (R.shop) for (const it of R.shop) if (!it.sold && near(it, 26)) return { k: 'shop', o: it, x: it.x, y: it.y - 34, t: `F ${SHOP_N[it.k]} · ${it.price}G`, bad: G.gold < it.price };
    if (R.altars) for (const a of R.altars) if (!a.used && near(a, 30)) { const t = altarText(a); return { k: 'altar', o: a, x: a.x, y: a.y - 40, t: t.t, bad: !t.ok }; }
    { const bi = BISTRO.interact(); if (bi) return bi; } // v3.10 쿠오 · 쿠키에게 말 걸기
    { const si = SHRINE.interact(R); if (si) return si; } // v3.25 빛의 방
    if (G.bonfire && !R.used && near(G.bonfire, 50)) return { k: 'rest', o: G.bonfire, x: G.bonfire.x, y: G.bonfire.y + 20, t: 'F 주문하기' }; // v3.10 비스트로
    if (R.tele && R.cleared && near(R.tele, 22)) return { k: 'tele', o: R.tele, x: R.tele.x, y: R.tele.y - 24, t: 'F 지도 · 순간이동' };
    return null;
  }
  // v2.02 피의 제단: 바칠 장비 = 장착하지 않은 레어 이상 중 가장 낮은 것
  const GRADE_I = { common: 0, rare: 1, unique: 2, legend: 3, rby: 4 };
  function altarFodder() {
    const eqIds = new Set(Object.values(eqOf(G.cls)));
    return SAVE.inv.filter(i => !eqIds.has(i.id) && GRADE_I[i.grade] >= 1 && i.grade !== 'rby').sort((a, b) => GRADE_I[a.grade] - GRADE_I[b.grade] || (a.lv || 0) - (b.lv || 0))[0] || null;
  }
  function altarText(a) {
    if (a.k === 'gear') { const f = altarFodder(); if (G.stats.hp >= HEART_CAP) return { t: 'F 피의 제단 — 하트 가득', ok: false };
      return f ? { t: `F 피의 제단 — 「${f.name}」 → 하트 +1`, ok: true } : { t: 'F 피의 제단 — 바칠 장비 없음', ok: false }; }
    return G.stats.hp > 4 ? { t: 'F 피의 제단 — 하트 2칸 → 무기 (레어 20% · 유니크 76.5% · 레전더리 3% · ??? 0.5%)', ok: true } : { t: 'F 피의 제단 — 하트 부족 (3칸 이상)', ok: false }; // v2.21 하트 2칸, 등급은 확률
  }
  function useAltar(a) {
    const t = altarText(a); if (!t.ok) { sfx('block'); lootFeed(t.t.replace('F ', ''), '#ff7070'); return; }
    const R0 = G.dun && G.dun.cur; if (R0 && R0.altars) for (const o of R0.altars) o.used = true; // v2.21 두 제단 중 하나만 — 하나를 쓰면 다른 쪽도 닫힘
    flashT = 0.15; flashColor = '#a01218'; sfx('boss'); burst(a.x, a.y - 14, '#a3161c', 18);
    G.fx.push({ kind: 'skybeam', x: a.x, y: a.y - 6, w: 22, c: '200,30,40', t: 0.6, max: 0.6, up: true });
    if (a.k === 'gear') { const f = altarFodder(); SAVE.inv = SAVE.inv.filter(i => i !== f); G.fieldItems = G.fieldItems.filter(i => i !== f); persist(); heartUp(1, `「${f.name}」을 바쳤다`); }
    else { heartDown(2); const r = Math.random() * 100; if (r >= 99.5) { const it = makeRBY(G.cls); spawnLoot('gear', a.x, a.y - 4, it); lootFeed('하트 두 칸을 바쳤다 — <b style="color:#ff2a2a">RGB?</b>', '#ff2a2a', 4000); return; } /* v2.40 RGB? 0.5% */ const gk = r < 20 ? 'rare' : r < 96.5 ? 'unique' : 'legend', owned = new Set(SAVE.inv.filter(i => i.cls === G.cls && i.wk != null).map(i => i.wk)), cands = wcat(G.cls).filter(o => o.grade === gk && !(o.i === 10 && !leg2Open(G.cls)) && !weaponLocked(G.cls, o.i)), fresh = cands.filter(o => !owned.has(o.i)), pickW = pick(fresh.length ? fresh : cands), it = makeItem(G.cls, pickW ? { grade: gk, wk: pickW.i } : { grade: gk }); /* 확률 그대로 (잿불 단계 보정 없음) */ spawnLoot('gear', a.x, a.y - 4, it); lootFeed(`하트 두 칸을 바쳤다 — ${gradeOf(it).n} 무기`, gradeOf(it).c, 3000); }
  }
  function shopHeartFix(R) { // v2.39 최대 하트(6칸)면 상점의 빈 하트 그릇을 다른 물건으로 바꿈
    if (!R || !R.shop || !G || !G.stats || G.stats.hp < HEART_CAP) return;
    const s = R.shop.find(x => x.k === 'heartUp' && !x.sold); if (!s) return;
    const have = new Set(R.shop.map(x => x.k)), alt = [['armor', 220], ['vial', 55], ['orb', 45], ['iron', 30], ['meat', 100]].find(([k]) => !have.has(k)) || ['armor', 220];
    const mul = G.stage === 4 ? 1.9 : G.stage === 2 ? 1.3 : G.stage === 3 ? 1.6 : 1;
    s.k = alt[0]; s.price = Math.round(alt[1] * mul * ASCF.shop() / 5) * 5;
  }
  const SHOP_N = { heartUp: '빈 하트 그릇', meat: '하트 반 칸', orb: '투지 결정', vial: '핏빛 영약', gear: '장비 꾸러미', iron: '철광석 3개', armor: '방패 조각' };
  function rollGradeW(w) { w = ascGradeW(w); let r = Math.random() * w.reduce((a, b) => a + b, 0); const ks = ['common', 'rare', 'unique', 'legend']; for (let i = 0; i < 4; i++) { if (r < w[i]) return ks[i]; r -= w[i]; } return 'common'; }
  function doInteract(it) {
    const R = G.dun.cur;
    if (it.k === 'station') { openForge('station', it.o.k); return; }
    if (it.k === 'truth') { TRUTH.act(it); return; } // v2.58
    if (it.k === 'crownAltar') { CA.start(); return; } // v2.52
    if (it.k === 'endCrown') { END.start(); return; } // v2.54
    if (it.k === 'homeExit') { HOME.leave(); return; } // v2.55
    if (it.k === 'bounty') { BOUNTY.open(); return; } // v3.16 단군의 난입자 의뢰서
    if (it.k === 'homeTalk') { HOME.talkNpc(it.who); return; } // v3.16 하비 · 단군 대화
    if (it.k === 'arch') { ARCH.act(it); return; } // v3.00 코코아의 기록 보관소
    if (it.k === 'den') { DEN.act(it); return; } // v3.17 영수 명수의 안전 놀이터
    if (it.k === 'bis') { BISTRO.act(it); return; } // v3.10 쿠오 · 쿠키 대화
    if (it.k === 'none') { sfx('block'); return; }
    if (it.k === 'sock') { placeSeal(it.o); return; }
    if (it.k === 'exit') { // v1.01: 주우지 않은 보스 전리품이 있으면 한 번 더 확인
      if (R.type === 'forge') { sfx('awaken'); flashT = 0.15; flashColor = '#ffe0b0'; leaveForge(); return; }
      const left = (R.chest && R.chest.kind === 'boss' && !R.chest.opened) || G.dun.rooms.some(r => r.chest && r.chest.pending) || G.loot.some(l => l.type === 'gear');
      if (left && !(G.exitArm > time)) { G.exitArm = time + 3; sfx('block'); lootFeed('아직 챙기지 않은 전리품이 있다 — 다시 F를 누르면 출발', '#ffb060', 3000); return; }
      sfx('awaken'); flashT = 0.15; flashColor = '#ffe0b0'; G.exitArm = 0;
      if (G.stage < lastStage()) stageClear(); else showResult(true); return;
    }
    if (it.k === 'gear') { collectLoot(it.o); it.o.life = -1; G.loot = G.loot.filter(l => l !== it.o); gearCmpId = null; sfx('select'); return; }
    if (it.k === 'chest') {
      const c = it.o; if (c.pending) { c.pending = false; spawnLoot('gear', c.x, c.y + 6, (c.pick && c.pick[0]) || rollChestWeapon(c.kind, c)); c.pick = null; return; } // 예전 저장의 보류 상자
      c.opened = true; c.openT = 0; if (hasRelic('glove')) { G.gold += 30; G.nums.push({ x: c.x, y: c.y - 26, v: '+30G', t: 0.9, c: '#ffd34d', s: 1 }); } // v2.29 도둑의 장갑
      sfx('drop'); sfx('coin'); addShake(3);
      G.fx.push({ kind: 'skybeam', x: c.x, y: c.y, w: 26, c: c.kind === 'secret' ? '200,140,255' : '255,210,120', t: 0.5, max: 0.5, up: true });
      spawnLoot('pouch', c.x, c.y + 6);
      if (c.kind === 'boss') { openBossChest(c); return; } // v0.98: 보스 장비는 상자에서
      if (c.kind !== 'reward' && (Math.random() < 0.3 + hueChest() || (c.inv && hasRelic('invhorn'))) && chestRelic(c)) { if (c.kind === 'secret') { spawnLoot('orb', c.x, c.y + 6); spawnLoot('bigmeat', c.x, c.y + 6); spawnLoot('armor', c.x, c.y + 6); G.crystal++; lootFeed('정령의 결정 +1', '#9fd2ff'); } return; } // v2.32 보물 방 밖의 상자: 30% 유물 · 70% 무기
      if (c.kind === 'reward' || c.kind === 'elite') { const w = rollChestWeapon(c.kind, c); spawnLoot('gear', c.x, c.y + 6, w); if (w.grade === 'legend') sfx('legend'); return; } // v2.19 고르기 없이 무기 하나가 튀어나온다 (F로 줍기)
      const g = rollGradeW(c.kind === 'secret' ? [0, 66, 33, 1] : [40, 52, 7.7, 0.3]); // v2.40 비밀 방 레전더리 4% → 1%
      spawnLoot('gear', c.x, c.y + 6, makeItem(G.cls, { grade: g }));
      if (c.kind === 'secret') { spawnLoot('orb', c.x, c.y + 6); spawnLoot('bigmeat', c.x, c.y + 6); spawnLoot('armor', c.x, c.y + 6); G.crystal++; lootFeed('정령의 결정 +1', '#9fd2ff'); }
    } else if (it.k === 'shop') {
      const s = it.o;
      const half = hasRelic('twincoin') && G.freeBuy !== G.stage, price = half ? Math.ceil(s.price / 2) : s.price; // v2.29 쌍둥이 동전: 챕터마다 1개 50%
      if (G.gold < price) { sfx('block'); NPC_TALK.merchant = { line: pick([`${price - G.gold}G 모자라. 외상은 안 돼`, `${price - G.gold}G만 더 가져와`, `${price - G.gold}G가 모자라는데?`]), until: time + 2.6, next: time + 9, near: true }; return; } // v2.93 골드 부족은 상인이 말주머니로
      if (half) { G.freeBuy = G.stage; lootFeed(`쌍둥이 동전 — 반값 (${price}G)`, '#f0c040'); } G.gold -= price; rec('spent', price); s.sold = true; sfx('coin');
      if (s.k === 'iron') { G.iron += 3; lootFeed('철광석 조각 +3', '#c9b07a'); }
      else if (s.k === 'gear') spawnLoot('gear', s.x, s.y + 4, makeItem(G.cls, { grade: rollGradeW([0, 85, 14.5, 0.5]) }) /* v2.40 레전더리 1.5% → 0.5% */);
      else spawnLoot(s.k, s.x, s.y + 4);
      G.nums.push({ x: s.x, y: s.y - 30, v: String(s.price), t: 0.8, c: '#ffd34d', s: 2 });
    } else if (it.k === 'altar') {
      useAltar(it.o);
    } else if (it.k === 'shrine') { SHRINE.open();
    } else if (it.k === 'rest') {
      openRest();
    } else if (it.k === 'tele') openMap();
  }
  // ---------- v0.98 전리품 3택1: 서로 다른 부위 3개 중 하나를 골라 바로 장착 (이전 장비는 가방으로)
  const PICK_W = { reward: { 1: [42, 52, 5.8, 0.2], 2: [35, 58, 6.75, 0.25], 3: [28, 63, 8.65, 0.35], 4: [23, 66, 10.5, 0.5] }, elite: { 1: [52, 45, 2.9, 0.1], 2: [44, 52, 3.85, 0.15], 3: [36, 58, 5.8, 0.2], 4: [30, 62, 7.65, 0.35] } }; // v2.40 레전더리 약 1/3로 // v1.98 유니크·레전더리 확률 크게 내림, 4장 표 추가
  function pickCompare(it) {
    if (!canEquip(it, G.cls)) return '<div class="pkCmp">다른 직업 무기</div>';
    SAVE.inv.push(it); const nx = statsIf(eqTarget(G.cls, it), it.id); SAVE.inv.pop(); const cur = calcStats(G.buffs);
    const curIt = eqCurFor(G.cls, it);
    const rows = INV_STATS.map(([k, n, f]) => { const dv = nx[k] - cur[k], tiny = ['crit', 'critDmg', 'cdr'].includes(k) ? 0.0005 : 0.5; if (Math.abs(dv) < tiny) return ''; return `<span class="${dv > 0 ? 'up' : 'dn'}">${n} ${dv > 0 ? '▲' : '▼'}${f(Math.abs(dv)).replace('%', '')}${['crit', 'critDmg', 'cdr'].includes(k) ? '%p' : ''}</span>`; }).join('');
    return `<div class="pkCmp"><i>${curIt ? `가방으로 · 「${curIt.name}」 대신 끼면` : '빈 칸 — 바로 장착'}</i>${rows || '<span>능력치 변화 없음</span>'}</div>`;
  }
  function rollChestWeapon(kind, c) { // v2.19 상자 무기 한 개 (예전 세 개 중 고르기와 같은 등급 규칙)
    const w = PICK_W[kind][G.stage] || PICK_W[kind][1], up = c && c.inv && ascOn(7);
    let gk = rollGradeW(w); if (up) gk = GRADES[Math.min(3, GI[gk] + 1)].k;
    if (kind === 'elite' && ascOn(3) && gk === 'common') gk = rollGradeW([0, w[1] || 1, w[2] || 0, w[3] || 0]); // 날 선 칼: 레어 이상 보장
    return makeItem(G.cls, { grade: gk, slot: 'weapon' });
  }
  // v0.98 보스 전리품 상자: 열면 장비가 튀어나와 등급 빛기둥을 세우고, 잠시 뒤 대장간(또는 결과 화면)으로
  function chestRelic(c, i, n) { // v2.32 상자에서 유물: 아직 없고 해금된 것 중 하나 (바닥에 떨어진 것도 제외)
    const onFloor = new Set(G.loot.filter(l => l.type === 'relic' && l.life > 0).map(l => l.relic)), left = Object.keys(RELICS).filter(k => !hasRelic(k) && !relicLocked(k) && !onFloor.has(k) && !RELICS[k].den); // v3.18 놀이터 전용 유물은 보스가 떨어뜨리지 않음
    if (!left.length) return false;
    const l0 = G.loot.length; spawnLoot('relic', c.x, c.y + 6); const L = G.loot[l0]; if (!L) return false; L.relic = pick(left);
    if (n > 1) { const a = Math.PI / 2 + (i - (n - 1) / 2) * 0.7; L.vx = Math.cos(a) * 90 + (i - (n - 1) / 2) * 40; L.vy = Math.sin(a) * 70; L.vz = 170; }
    lootFeed(`<b style="color:${RELICS[L.relic].c}">유물 · ${RELICS[L.relic].n}</b>`, RELICS[L.relic].c, 3500); sfx('legend'); return true;
  }
  function openBossChest(c) {
    c.items = c.items.filter((it, i) => !(Math.random() < 0.3 + hueChest() && chestRelic(c, i, c.items.length))); // v2.32 보스 상자도 칸마다 30% 유물
    G.newItems = []; const n = c.items.length; // v1.01: 보스 장비도 바닥에 떨어지고 F로 줍는다
    c.items.forEach((it, i) => { spawnLoot('gear', c.x, c.y + 6, it); const l = G.loot[G.loot.length - 1], a = Math.PI / 2 + (i - (n - 1) / 2) * 0.7; l.vx = Math.cos(a) * 90 + (i - (n - 1) / 2) * 40; l.vy = Math.sin(a) * 70; l.vz = 170; });
    addShake(6); flashT = 0.12; flashColor = '#fff0c0';
    G.fx.push({ kind: 'ring', x: c.x, y: c.y - 6, r: 8, grow: 220, t: 0.5, max: 0.5, c: '#ffd34d' });
    if (c.items.some(it => it.grade === 'legend')) setTimeout(() => { if (G) sfx('legend'); }, 500);
    c.items.forEach(it => lootFeed(`<b style="color:${gradeOf(it).c}">[${gradeOf(it).n}] ${it.name}</b>${it.set ? ` · ${SETS[it.set].n}` : ''}${it.curse ? ' · 저주' : ''}`, gradeOf(it).c, 4200));
    lootFeed('장비는 가까이 가서 F로 줍는다', '#9a8f8a');
  }
  function restDone() { G.dun.cur.used = true; const [a, b] = BISTRO.doneText(); banner(a, b, false, CX); } // 맵 가운데 // v3.10

  // ---------- 적 길찾기 (흐름장)
  function updateNav(dt) {
    if (!G.obs || !G.obs.length) { G.navDist = null; return; }
    G.navT -= dt; if (G.navT > 0 && G.navDist) return;
    G.navT = 0.25;
    G.navDist = navFlood(G.nav, G.player.x, G.player.y);
  }
  function losClear(x0, y0, x1, y1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8);
    for (let k = 1; k < n; k++) { const i = navIdx(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n); if (i >= 0 && !G.nav[i]) return false; }
    return true;
  }
  // 포위: 근접 잡몹은 각자 플레이어 둘레의 자리(slotAng)를 향해 다가가 사방을 막는다
  const SURROUND = new Set(['ghoul', 'dog', 'goblin', 'slime', 'bigslime', 'bloat']);
  function assignSlots() {
    const P = G.player, es = G.enemies.filter(e => !e.dead && SURROUND.has(e.type));
    if (!es.length) return;
    const an = e => Math.atan2(e.y - P.y, e.x - P.x);
    es.sort((a, b) => an(a) - an(b));
    const base = an(es[0]), n = es.length;
    es.forEach((e, i) => { e.slotAng = base + i * TAU / Math.max(n, 3); });
  }
  function slotAng(e, ang) {
    if (e.slotAng == null || !SURROUND.has(e.type)) return ang;
    const P = G.player, dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy), toP = Math.atan2(dy, dx);
    if (d > 240 || d < 34 || Math.abs(angDiff(ang, toP)) > 0.5) return ang;
    const R = Math.min(d * 0.55, 36);
    return Math.atan2(P.y + Math.sin(e.slotAng) * R - e.y, P.x + Math.cos(e.slotAng) * R - e.x);
  }
  function steer(e, ang) {
    ang = slotAng(e, ang);
    if (!G.navDist || e.type === 'crow' || e.type === 'boss') return ang;
    const P = G.player, toP = Math.atan2(P.y - e.y, P.x - e.x);
    if (Math.abs(angDiff(ang, toP)) > 0.8 || losClear(e.x, e.y, P.x, P.y)) return ang;
    const c = navIdx(e.x, e.y); if (c < 0) return ang;
    const i = c % NC, j = (c / NC) | 0; let best = -1, bd = 1e9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NC || nj >= NR) continue;
      const n = nj * NC + ni, v = G.navDist[n]; if (v >= 0 && v < bd) { bd = v; best = n; }
    }
    if (best < 0) return ang;
    return Math.atan2(A.y0 + (((best / NC) | 0) + 0.5) * NAV - e.y, A.x0 + (best % NC + 0.5) * NAV - e.x);
  }

  // ---------- 그리기: 바닥(문·구덩이), 구조물 스프라이트
  const FL_CACHE = []; // v2.35 최근 방 바닥 4개 (방 들어갈 때 바닥을 새로 그리던 60~90ms 멈춤 제거)
  function floorCached(R) {
    const m = G.stage === 1 && R.type !== 'forge' && R.type !== 'home' && R.type !== 'lab' && R.type !== 'archive' && R.type !== 'den' && R.type !== 'ruin', key = G.stage + ':' + R.id, i = FL_CACHE.findIndex(c => c.key === key && c.dun === G.dun);
    if (R.type !== 'forge' && R.type !== 'home' && R.type !== 'lab' && R.type !== 'archive' && R.type !== 'den' && R.type !== 'ruin' && i >= 0) { const c = FL_CACHE.splice(i, 1)[0]; FL_CACHE.unshift(c);
      ROOMSTYLE = R.style || { path: 'wind' }; CUR_ROOM = R;
      if (m) { fmg.clearRect(0, 0, W, H); fmg.drawImage(c.a, 0, 0); ffg.clearRect(0, 0, W, H); ffg.drawImage(c.b, 0, 0); FRONT_ON = true; } else { fg.clearRect(0, 0, W, H); fg.drawImage(c.a, 0, 0); }
      return; }
    paintRoomFloor(R);
    if (R.type === 'forge' || R.type === 'home' || R.type === 'lab' || R.type === 'archive' || R.type === 'den' || R.type === 'ruin') return;
    let c = FL_CACHE.length >= 4 ? FL_CACHE.pop() : null; if (!c) c = { a: mkCanvas(W, H)[0], b: mkCanvas(W, H)[0] };
    c.key = key; c.dun = G.dun; const ga = c.a.getContext('2d'), gb = c.b.getContext('2d'); ga.clearRect(0, 0, W, H); gb.clearRect(0, 0, W, H);
    ga.drawImage(m ? floorM : floor, 0, 0); if (m) gb.drawImage(frontM, 0, 0); FL_CACHE.unshift(c);
  }
  function paintRoomFloor(R) {
    withSeed(R.seed, () => {
      ROOMSTYLE = R.style || { path: 'wind' }; CUR_ROOM = R;
      if (R.type === 'forge') { paintForgeOut(fg, R); return; } // v1.71 출장 대장간 야외 바닥
      if (R.type === 'home') { HOME.paint(fg, R); return; } // v2.55 시작 장소
      if (R.type === 'archive') { ARCH.paint(fg, R); return; } // v3.00 코코아의 기록 보관소
      if (R.type === 'lab') { TRUTH.paintLab(fg, R); return; } // v2.58 구덩이 실험실
      if (R.type === 'den') { DEN.paint(fg, R); return; } // v3.17 영수 명수의 안전 놀이터
      const ac = G.stage === 4;
      if (G.stage === 1) paintMeadowFloor(fmg); else if (G.stage === 3) { paintOrcFloor(fg, R); paintOrcWall(fg, R); } else { paintCastle.noRite = ac; paintCastle(fg); paintCastle.noRite = false; paintCastleWall(fg); if (R.type !== 'altar') { if (!ac) withDecor(fg, R, () => paintCastleDecor(fg, R)); } /* v2.89 4장은 21_ash4.js 바닥 자국 */ }
      const g = G.stage === 1 ? fmg : fg;
      for (const b of R.obs) if (b.t === 'pit') (G.stage === 1 ? paintPond : G.stage === 3 && typeof CAMP3 !== 'undefined' ? paintBlood : G.stage === 4 && typeof TOWN4 !== 'undefined' ? () => {} /* v3.19 불탄 자리는 바닥의 재 덧칠에 묻히지 않게 장애물 그림 쪽에서 맨 아래에 그림 */ : paintChasm)(g, b);
      if (G.stage === 2 && typeof KEEP2 !== 'undefined') for (const b of R.obs) if (b.t === 'wall' && fencedPit(b)) paintChasm(g, b); // v3.19 울타리 낭떠러지: 바닥은 낭떠러지, 울타리는 장애물 그림으로
      if (ac) ashCityFloor(fg, R); // v1.22 왕도: 성채 바닥을 재로 덮고 가운데 왕관 모자이크 — 문보다 먼저 깔아 문이 재에 묻히지 않게
      for (const d in R.doors) if (R.doors[d] != null && !hiddenDoor(R, d) && !(R.sealW && R.sealW.dir === d)) (G.stage === 1 ? paintDoorMeadow : G.stage === 3 ? paintDoorOrc : paintDoorCastle)(g, d);
      if (SR_LAYOUT[R.type]) srFloor(g, R); // v1.11
      if (R.tele) paintTelePad(g, R.tele);
      TRUTH.floor(g, R); // v2.59 벽의 인장 · 밀실 바닥 원
    });
  }
  // ---------- 방 그래픽 (v0.24): 게임 전체와 같은 도트 규칙 — 2px 칸, 검은 외곽선, 4단계 명암, 그라데이션 대신 디더링
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const dith = (x, y, lv) => lv * 16 > BAYER[(y & 3) * 4 + (x & 3)]; // lv 0..1, 참이면 칠한다
  const mkGrid = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
  const gAt = (g, x, y) => (g[y] && g[y][x]) || '.';
  function gOutline(g, ch = 'k', skip = '') {
    const out = g.map(r => r.slice());
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
      if (g[y][x] !== '.') continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = gAt(g, x + dx, y + dy); if (c !== '.' && c !== ch && !skip.includes(c)) { out[y][x] = ch; break; } }
    }
    return out;
  }
  function gCanvas(g, pal) {
    const [c, cx] = mkCanvas(g[0].length * 2, g.length * 2);
    gPaint(cx, g, pal, 0, 0);
    return c;
  }
  function gPaint(cx, g, pal, x0, y0) {
    x0 = Math.round(x0 / 2) * 2; y0 = Math.round(y0 / 2) * 2;
    if (DEC && decBlock(cx, x0, y0, g[0].length * 2, g.length * 2)) return;
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) { const ch = g[y][x]; if (ch === '.' || !pal[ch]) continue; cx.fillStyle = pal[ch]; cx.fillRect(x0 + x * 2, y0 + y * 2, 2, 2); }
  }
  const fromRows = rows => { const w = Math.max(...rows.map(r => r.length)); return rows.map(r => r.padEnd(w, '.').split('')); };
  // 명암: 왼쪽 위에서 빛
  const shade4 = (dx, dy, r, j = 0.22) => { const v = (dx + dy * 1.1) / (r * 1.4) + rand(-j, j); return v < -0.5 ? 'h' : v < 0 ? 'l' : v < 0.5 ? 'd' : 'D'; };

  const STONE = { H: '#7a7488', k: '#0b0a0e', K: '#050407', h: '#5e5868', l: '#423d4c', d: '#2d2935', D: '#1c1922', m: '#3a5226', M: '#567234', w: '#a49c8e', W: '#d8d0c0', r: '#7a1820' };
  const LEAF = Object.assign({ k: '#07100a', r: '#b83040', y: '#e0c040', p: '#a070d0', t: '#3a2a1c', T: '#22180e' }, TREE_PAL.green);

  // --- 장애물 생성기 -------------------------------------------------
  // 초원 덤불 벽: 잎 뭉치를 겹쳐 쌓는다 (발자국 wc×hc칸 + 높이 HH칸)

  // 성채 기둥: 기둥머리·몸통(세로 4단 명암)·주춧돌, 부서진 것도 있다
  // 성채 무너진 벽: 윗면 벽돌 + 앞면 어두운 벽돌, 윗면 가장자리가 깨져 있다
  // ================================================================ v1.03 오브젝트 도트 다시 그리기 — 덩어리 대신 구조가 읽히게
  // 챕터 1 수풀: 둥근 덤불 여러 무더기(뒤→앞), 가장자리는 잎끝이 톡톡 튀어나오고, 안쪽은 잎 모양 무늬(밝은 칸+어두운 칸 짝)
  function genHedge(wc, hc) {
    const HH = 9, W0 = wc + 4, H0 = hc + HH + 4, g = mkGrid(W0, H0);
    const TONE = ['h', 'l', 'd', 'D'], tone = i => TONE[clamp(i, 0, 3)];
    const cl = [], n = Math.max(3, Math.round(W0 / 9) + Math.round(H0 / 14));
    for (let i = 0; i < n * 2; i++) { const R = rand(5, 8.5); cl.push({ x: rand(R * 0.7, W0 - R * 0.7), y: rand(R * 0.6 + 1, H0 - R * 0.75 - 2), R, ph: rand(0, 6) }); }
    for (let x = 4; x < W0 - 2; x += 7) cl.push({ x: x + rand(-1, 1), y: H0 - rand(6, 7.5), R: rand(5, 6.5), ph: rand(0, 6) });
    // 빈틈은 그늘로 칠하지 않고 그 자리에 작은 덤불을 더 놓아 메움 (충돌 영역이 다 덮이게)
    for (let it = 0; it < 600; it++) { let gap = null;
      for (let y = 8; y < H0 - 7 && !gap; y += 2) for (let x = 7; x < W0 - 7 && !gap; x += 2) if (!cl.some(c => Math.hypot(x - c.x, (y - c.y) * 1.12) < c.R * 0.95)) gap = { x, y }; // 안쪽만 (가장자리는 울퉁불퉁하게 둠)
      if (!gap) break; cl.push({ x: gap.x + rand(-0.5, 0.5), y: gap.y + rand(-0.5, 0.5), R: rand(4.5, 6), ph: rand(0, 6) }); }
    cl.sort((a, b) => a.y - b.y);
    const own = mkGrid(W0, H0);
    cl.forEach((c, ci) => {
      for (let y = 1; y < H0 - 1; y++) for (let x = 1; x < W0 - 1; x++) {
        const dx = x - c.x, dy = (y - c.y) * 1.12, a = Math.atan2(dy, dx), d = Math.hypot(dx, dy), edge = c.R * (1 + 0.1 * Math.sin(a * 6 + c.ph)) + (((x * 7 + y * 3) % 5 === 0) ? 0.6 : 0);
        if (d > edge) continue;
        const t = (dx * 0.62 + dy * 0.8) / c.R; let i = t < -0.5 ? 0 : t < 0.05 ? 1 : t < 0.55 ? 2 : 3;
        if (y > hc + 2) i += 1; // 앞면(세로)은 한 단계 어둡게
        if (d > edge - 1.1 && own[y][x] !== '.' && own[y][x] !== ci) i = 3; // 앞 무더기와 뒤 무더기 사이 그늘
        g[y][x] = tone(i); own[y][x] = ci;
      }
    });
    // 잎 무늬: 엇갈린 격자마다 밝은 칸 + 그 오른쪽 아래 어두운 칸
    for (let y = 2; y < H0 - 2; y += 2) for (let x = 2 + (y >> 1) % 3; x < W0 - 2; x += 3) {
      const c = g[y][x], j = TONE.indexOf(c); if (j < 0 || g[y + 1][x + 1] === '.') continue;
      if (j > 0) g[y][x] = TONE[j - 1]; const c2 = TONE.indexOf(g[y + 1][x + 1]); if (c2 >= 0 && c2 < 3) g[y + 1][x + 1] = TONE[c2 + 1];
    }
    // 꽃: 밝은 쪽에 작은 송이 몇 개만 (점 노이즈 대신 모아서)
    const fl = pick(['r', 'y', 'p']);
    for (let k = 0, tries = 0; k < Math.max(1, Math.round(W0 * H0 / 260)) && tries < 80; tries++) { const x = randi(3, W0 - 4), y = randi(2, hc + 2); if (g[y][x] !== 'h' && g[y][x] !== 'l') continue;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) if ('hl'.includes(g[y + dy][x + dx])) g[y + dy][x + dx] = dx || dy ? fl : 'y'; k++; }
    // 밑동: 그늘 + 줄기 + 풀잎
    for (let x = 2; x < W0 - 2; x++) { let y = H0 - 2; while (y > 0 && g[y][x] === '.') y--; if (y < 1) continue; g[y][x] = 'D'; if (x % 5 === 2 && y + 1 < H0 - 1) g[y + 1][x] = 't'; if (x % 4 === 1 && g[y - 1][x] !== '.') g[y - 1][x] = 'D'; }
    for (let x = 3; x < W0 - 3; x += randi(3, 5)) { let y = H0 - 2; while (y > 0 && g[y][x] === '.') y--; if (y > 2) { g[y][x] = 'l'; g[y - 1][x] = 'h'; } }
    return { g: gOutline(g), HH };
  }
  // 챕터 2 벽: 위는 판석 덮개(크기 제각각·이끼·금), 테두리 처마 그늘, 앞면은 크기 다른 벽돌마다 명암, 빠진 벽돌, 담쟁이, 밑동 이끼·돌부스러기, 가끔 찢어진 기사단 깃발
  function genWallBlock(wc, hc) {
    const HH = 12, W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0);
    // 위: 판석
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) g[y][x] = 'l';
    for (let y = 1; y <= hc;) { const rh = randi(3, 4); let x = 1;
      while (x <= wc) { const w = randi(4, 8);
        for (let yy = y; yy < Math.min(y + rh, hc + 1); yy++) for (let xx = x; xx < Math.min(x + w, wc + 1); xx++) {
          const top = yy === y, left = xx === x, right = xx === x + w - 1 || xx === wc, bot = yy === y + rh - 1;
          g[yy][xx] = (top || left) && !(right || bot) ? 'h' : right || bot ? 'D' : 'l';
        }
        if (w > 5 && Math.random() < 0.35) { let cx = x + randi(1, w - 2), cy = y; for (let k = 0; k < rh; k++) { if (g[cy] && g[cy][cx]) g[cy][cx] = 'd'; cx += pick([-1, 0, 1]); cy++; } } // 금
        x += w; }
      y += rh; }
    for (let k = 0; k < Math.max(1, wc * hc / 160); k++) { const mx = randi(2, wc - 1), my = randi(2, hc - 1), R0 = rand(1.5, 3); for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) { const d = Math.hypot(x - mx, (y - my) * 1.3); if (d < R0 && dith(x, y, 1 - d / R0 + 0.2)) g[y][x] = d < R0 * 0.5 ? 'M' : 'm'; } }
    // 처마: 밝은 테 + 아래 짙은 그늘
    for (let x = 1; x <= wc; x++) { g[hc][x] = 'h'; g[hc + 1][x] = 'K'; }
    // 앞: 벽돌 (줄마다 2칸 벽돌 + 1칸 줄눈, 너비 제각각)
    for (let row = 0, y = hc + 2; y <= hc + HH; row++, y += 3) { let x = 1 - (row % 2) * randi(1, 3);
      while (x <= wc) { const w = randi(3, 6), shade = Math.random(), miss = Math.random() < 0.05;
        for (let xx = Math.max(1, x); xx < Math.min(x + w, wc + 1); xx++) for (let yy = y; yy < Math.min(y + 2, hc + HH + 1); yy++) {
          const last = xx === x + w - 1, lit = shade < 0.6; let c = last ? 'D' : yy === y ? (lit ? 'l' : 'd') : (lit ? 'd' : 'D'); if (!last && yy === y && xx === Math.max(1, x) && lit) c = 'h';
          if (miss && !last) c = yy === y ? 'K' : 'k';
          g[yy][xx] = c; }
        x += w; }
      if (y + 2 <= hc + HH) for (let x2 = 1; x2 <= wc; x2++) g[y + 2][x2] = y + 2 >= hc + HH - 1 ? 'K' : 'D'; }
    // 담쟁이: 처마에서 늘어진 줄기 1~2개
    for (let k = 0; k < (wc > 30 ? 2 : 1); k++) { if (Math.random() < 0.35) continue; let x = randi(3, wc - 3); const L = randi(5, HH - 2);
      for (let j = 0; j < L; j++) { const y = hc + 1 + j; g[y][x] = 'M'; if (j % 2 === 0 && x + 1 <= wc) g[y][x + 1] = 'm'; else if (x - 1 >= 1) g[y][x - 1] = 'm'; if (Math.random() < 0.3) x = clamp(x + pick([-1, 1]), 2, wc - 1); } }
    // 기사단 깃발 (넓은 벽에서 가끔): 찢어진 붉은 천 + 금빛 테
    if (wc >= 34 && Math.random() < 0.3) { const bx = randi(6, wc - 10), L = HH - 3;
      for (let j = 0; j < L; j++) for (let i = 0; i < 6; i++) { const torn = j === L - 1 && (i === 1 || i === 4); if (torn) continue; g[hc + 2 + j][bx + i] = i === 0 || i === 5 ? 'w' : j === 0 ? 'w' : (j + i) % 5 === 0 ? 'D' : 'r'; } }
    // 밑동: 이끼 · 돌부스러기
    for (let x = 1; x <= wc; x++) { if (Math.random() < 0.4) g[hc + HH][x] = pick(['m', 'M']); if (Math.random() < 0.18) g[hc + HH - 1][x] = 'm'; }
    // 덮개 가장자리 깨짐
    for (let x = 1; x <= wc; x++) if (Math.random() < 0.18) { g[1][x] = '.'; if (Math.random() < 0.4 && g[2]) g[2][x] = 'd'; }
    return { g: gOutline(g), HH };
  }

  // 성채 잔해: 작은 돌 여러 개 + 뼈
  // v2.81
  // 초원 바위 더미 (기존 rockBig/rockA를 2px로 조합)

  // --- 바닥: 구덩이 · 연못 · 길 · 텔레포터 -------------------------
  function genChasm(wc, hc) {
    const W0 = wc + 2, H0 = hc + 2, g = mkGrid(W0, H0);
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) {
      const rim = y === 1 || y === hc || x === 1 || x === wc;
      if (rim) { g[y][x] = y === 1 ? 'h' : (x + y) % 5 === 0 ? 'D' : 'l'; continue; }
      const dy = y - 2; // 안쪽 윗벽: 벽돌이 아래로 갈수록 어두워진다
      if (dy < 7) {
        const off = (Math.floor(dy / 2) % 2) * 3, mort = dy % 2 === 1 || (x + off) % 6 === 0;
        g[y][x] = dy < 2 ? (mort ? 'D' : 'l') : dy < 4 ? (mort ? 'K' : 'd') : dith(x, y, (7 - dy) / 4) ? 'D' : 'K';
      } else g[y][x] = x === 2 || x === wc - 1 ? (dith(x, y, 0.5) ? 'D' : 'K') : 'K';
    }
    for (const [x, y] of [[1, 1], [wc, 1], [1, hc], [wc, hc]]) g[y][x] = '.';
    for (let i = 0; i < wc / 5; i++) { const x = randi(2, wc - 1); if (g[hc][x] === 'l') g[hc][x] = 'd'; }
    for (let i = 0; i < wc * hc / 70; i++) { const x = randi(3, wc - 2), y = randi(Math.min(hc - 1, 10), hc - 1); if (g[y][x] === 'K') g[y][x] = 'p'; }
    return gOutline(g);
  }
  const CHASM_PAL = Object.assign({}, STONE, { p: '#3a1e58' });
  function genPond(wc, hc, style = 'clear', shape = 'blob') {
    const W0 = wc + 14, H0 = hc + 18, g = mkGrid(W0, H0), cx = W0 / 2, cy = H0 / 2, rx = wc / 2, ry = hc / 2, a1 = rand(0, 6), a2 = rand(0, 6);
    const lobes = shape === 'lobes' ? [[-0.45, 0.12, 0.55], [0.42, -0.1, 0.58], [0, 0.05, 0.72]] : shape === 'kidney' ? [[-0.38, 0.05, 0.62], [0.36, -0.12, 0.64]] : null;
    const inside = (x, y) => {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, an = Math.atan2(dy, dx);
      if (lobes) return lobes.some(([ox, oy, r]) => ((dx - ox) / r) ** 2 + ((dy - oy) / r) ** 2 < 1 - 0.07 * Math.sin(an * 4 + a1));
      return dx * dx + dy * dy < 1 - 0.1 * Math.sin(an * 3 + a1) - 0.07 * Math.sin(an * 5 + a2);
    };
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) if (inside(x, y)) g[y][x] = 'W';
    // 가운데 작은 섬
    const isl = style === 'island' ? { x: cx + rand(-rx * 0.2, rx * 0.2), y: cy + rand(-ry * 0.1, ry * 0.15), r: Math.max(3, Math.min(rx, ry) * 0.32) } : null;
    if (isl) for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) { const e = ((x - isl.x) / isl.r) ** 2 + ((y - isl.y) / (isl.r * 0.7)) ** 2; if (e < 1 && g[y][x] === 'W') g[y][x] = e < 0.45 ? 'i' : e < 0.8 ? 'I' : 'B'; }
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
      if (g[y][x] !== 'W') continue;
      const up1 = !'Wiw'.includes(gAt(g, x, y - 1)) && gAt(g, x, y - 1) !== 'I', up2 = gAt(g, x, y - 2) === '.', up3 = gAt(g, x, y - 3) === '.';
      if (gAt(g, x, y - 1) === '.') g[y][x] = 'b'; else if (up2) g[y][x] = 'B'; else if (up3) g[y][x] = 'D';
      else { const t = (y - (cy + ry * 0.2)) / (ry * 0.4); if (t > 1 || (t > 0 && dith(x, y, t))) g[y][x] = 'w'; }
    }
    // 물결·달빛 줄기·녹조
    for (let i = 0; i < wc * hc / 100 + 1; i++) { const x = randi(3, W0 - 6), y = randi(4, H0 - 4); for (let k = 0; k < randi(2, 3); k++) if ('Ww'.includes(gAt(g, x + k, y)) && Math.random() < 0.65) g[y][x + k] = 'h'; }
    if (style !== 'swamp' && Math.random() < 0.3) { const mx = Math.round(cx + rand(-rx * 0.3, rx * 0.3)); for (let y = 3; y < H0 - 3; y += 4) for (let k = -1; k <= 1; k++) if ('Ww'.includes(gAt(g, mx + k + (y % 4 ? 1 : 0), y)) && Math.random() < 0.3) g[y][mx + k + (y % 4 ? 1 : 0)] = 'h'; }
    if (style === 'swamp') for (let i = 0; i < wc * hc / 60 + 3; i++) { const bx = rand(2, W0 - 2), by = rand(3, H0 - 2), br = rand(1.5, 4); for (let y = Math.floor(by - br); y <= by + br; y++) for (let x = Math.floor(bx - br * 1.5); x <= bx + br * 1.5; x++) { if (!'Ww'.includes(gAt(g, x, y))) continue; const e = ((x - bx) / (br * 1.5)) ** 2 + ((y - by) / br) ** 2; if (e < 1 && Math.random() < 1 - e * 0.6) g[y][x] = e < 0.35 ? 'o' : 'a'; } }
    // 수련 (맑은 물), 거품 (늪), 떠다니는 낙엽
    if (style === 'clear' || style === 'island') for (let i = 0; i < wc * hc / 90 + 1; i++) { const x = randi(3, W0 - 5), y = randi(5, H0 - 5); if (g[y][x] === 'W' && g[y][x + 1] === 'W' && g[y + 1][x] !== '.') { g[y][x] = 'L'; g[y][x + 1] = 'l'; g[y + 1][x] = 'L'; if (Math.random() < 0.4) g[y][x + 1] = 'f'; } }
    if (Math.random() < 0.35) for (let i = 0; i < wc * hc / 120 + 1; i++) { const x = randi(3, W0 - 4), y = randi(4, H0 - 4); if ('Ww'.includes(g[y][x])) g[y][x] = 'A'; }
    if (isl && Math.random() < 0.7) { const x = Math.round(isl.x), y = Math.round(isl.y) - 1; for (const [dx, dy, c] of [[-1, 0, 'L'], [0, -1, 'l'], [1, 0, 'L'], [0, 0, 'L'], [0, 1, 'k']]) if (g[y + dy]) g[y + dy][x + dx] = c; }
    const o = gOutline(g);
    // 물가: 갈대·풀 (늪은 갈대가 훨씬 많다), 돌 테두리 (바위 연못)
    const reedP = style === 'swamp' ? 0.45 : 0.18;
    for (let x = 1; x < W0 - 1; x++) for (let y = 1; y < H0 - 1; y++) {
      if (o[y][x] !== 'k') continue;
      if (style === 'rocky' && Math.random() < 0.22) { const w = randi(2, 3); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= w; dx++) { const yy = y + dy, xx = x + dx; if (!o[yy] || o[yy][xx] === undefined || 'WwDbBhLlfA'.includes(o[yy][xx])) continue; o[yy][xx] = dy === -1 || dx === -1 || dx === w || dy === 1 ? (o[yy][xx] === '.' || o[yy][xx] === 'k' ? 'K' : o[yy][xx]) : dx === 0 ? 'G' : dx === w - 1 ? 'd' : 'g'; } continue; }
      if (o[y - 1][x] !== '.') continue;
      if (Math.random() < reedP) { const h = randi(2, style === 'swamp' ? 6 : 4); for (let k = 1; k <= h; k++) if (o[y - k] && o[y - k][x] === '.') o[y - k][x] = k === h ? (style === 'swamp' && Math.random() < 0.5 ? 'T' : 'M') : 'R'; }
      else if (Math.random() < 0.25) o[y - 1][x] = 'm';
    }
    if (style === 'swamp') for (let x = 1; x < W0 - 1; x++) for (let y = 1; y < H0 - 1; y++) if ('Wwa'.includes(o[y][x]) && Math.random() < 0.01) { o[y][x] = 'R'; if (o[y - 1][x] !== '.') o[y - 1][x] = 'T'; }
    return o;
  }
  const POND_PALS = {
    clear: { W: '#13304c', w: '#1c4466', D: '#0c1a2c', h: '#456780' },
    island: { W: '#13304c', w: '#1c4466', D: '#0c1a2c', h: '#456780' },
    rocky: { W: '#0f2a46', w: '#18406a', D: '#081624', h: '#587b98' },
    swamp: { W: '#16221a', w: '#1e3024', D: '#0c140c', h: '#5a6a3a' },
  };
  const POND_PAL = { Y: '#a08a4a', K: '#0b0a0e', a: '#3a5a22', o: '#6a8a3a', A: '#c86a2a', I: '#2e5222', i: '#4a7a34', T: '#5a3a20', G: '#8a8494', g: '#6a6474', d: '#4a4554', k: '#081210', b: '#6e5236', B: '#4a3424', D: '#0c1a2c', W: '#13304c', w: '#1c4466', h: '#456780', L: '#3e6a2c', l: '#6a9a44', f: '#e8b8d0', R: '#4a6a2e', M: '#8aa84a', m: '#2e5222' };
  // 흙길 한 조각: dir 방향으로 이어지는 길, far 쪽은 디더링으로 어두워진다
  function genPath(wc, hc, vert, farSide) {
    const g = mkGrid(wc, hc), half = vert ? wc / 2 : hc / 2, len = vert ? hc : wc;
    for (let i = 0; i < len; i++) {
      const w = 5 + (Math.sin(i * 0.7) > 0.6 ? 1 : 0) + randi(0, 1);
      const span = Math.ceil(w * 1.4);
      for (let j = -span; j <= span; j++) {
        const x = vert ? Math.round(half + j) : i, y = vert ? i : Math.round(half + j);
        if (x < 0 || y < 0 || x >= wc || y >= hc) continue;
        const t = Math.abs(j + 0.5) / w;
        if (t < 0.5) { g[y][x] = Math.random() < 0.025 ? 'g' : Math.random() < 0.08 ? 'w' : 'b'; continue; }
        const lv = clamp((1.4 - t) / 0.9, 0, 1);
        if (dith(x, y, lv)) g[y][x] = Math.random() < 0.35 ? 'B' : 'b'; else if (dith(x + 1, y + 2, lv * 0.85)) g[y][x] = 'e';
      }
    }
    // 길가 풀
    for (let i = 0; i < len * 0.6; i++) { const x = randi(0, wc - 1), y = randi(0, hc - 1); if (g[y][x] === '.') g[y][x] = pick(['m', 'M', '.']); }
    // 먼 쪽 어둠
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const t = farSide === 'n' ? 1 - y / hc : farSide === 's' ? y / hc : farSide === 'w' ? 1 - x / wc : x / wc;
      const lv = clamp((t - 0.35) / 0.55, 0, 1);
      if (lv > 0 && g[y][x] !== '.' && dith(x, y, lv)) g[y][x] = lv > 0.85 ? '.' : 'k';
    }
    return g;
  }
  const PATH_PAL = { e: '#3a4426', k: '#081008', b: '#62482e', w: '#7e6040', B: '#56402a', g: '#8a8478', m: '#2e5222', M: '#4a7a34' };
  function genTelePad() {
    const W0 = 19, H0 = 11, g = mkGrid(W0, H0), cx = 9, cy = 5;
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
      const dx = (x - cx) / 8.6, dy = (y - cy) / 4.6, e = dx * dx + dy * dy;
      if (e < 1) g[y][x] = e > 0.5 ? (y < cy ? 'l' : 'd') : e > 0.38 ? 'D' : 'K';
    }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, x = Math.round(cx + Math.cos(a) * 7.2), y = Math.round(cy + Math.sin(a) * 3.8); g[y][x] = 'r'; }
    return gOutline(g);
  }
  const TELE_PAL = Object.assign({}, STONE, { r: '#2a2840' });

  // --- 문 · 봉쇄 -------------------------------------------------------
  // 성채 북문: 아치형 돌문틀 + 위로 오르는 계단이 어둠 속으로
  function genArch() {
    const W0 = 27, H0 = 36, g = mkGrid(W0, H0), cx = 13, top = 12;
    const outer = (x, y) => y >= top ? x >= 1 && x <= 25 : Math.hypot(x - cx, (y - top) * 1.0) <= 12.5;
    const inner = (x, y) => y >= top ? x >= 4 && x <= 22 : Math.hypot(x - cx, (y - top)) <= 9.4;
    for (let y = 0; y < H0 - 1; y++) for (let x = 0; x < W0; x++) {
      if (!outer(x, y)) continue;
      if (inner(x, y)) {
        const fromBottom = H0 - 2 - y; // 계단: 아래 6칸만 밝다
        if (fromBottom < 8) g[y][x] = fromBottom % 3 === 0 ? 'l' : 'd';
        else g[y][x] = 'K';
        if (fromBottom >= 5 && fromBottom < 13 && g[y][x] === 'K' && dith(x, y, (13 - fromBottom) / 9)) g[y][x] = 'D';
      } else {
        const ang = Math.atan2(y - top, x - cx), seam = y < top ? Math.abs(Math.sin(ang * 5)) < 0.18 : (y - top) % 4 === 3;
        g[y][x] = seam ? 'D' : x < cx ? 'h' : 'l';
        if (y >= top && x > 22) g[y][x] = seam ? 'K' : 'd';
      }
    }
    for (let y = 0; y < 3; y++) for (let x = cx - 1; x <= cx + 1; x++) if (g[y][x] !== '.') g[y][x] = y === 0 ? 'h' : 'w';
    return gOutline(g);
  }
  // 성채 남·서·동문: 바닥 돌판이 밖으로 이어지며 어두워진다
  function genFloorExit(wc, hc, farSide) {
    const g = mkGrid(wc, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const vert = farSide === 's', i = vert ? y : x, j = vert ? x : y, off = (Math.floor(i / 6) % 2) * 3;
      g[y][x] = i % 6 === 5 || (j + off) % 6 === 5 ? 'D' : (i % 6 === 0 ? 'l' : 'd');
      const t = farSide === 's' ? y / hc : farSide === 'w' ? 1 - x / wc : x / wc, lv = clamp((t - 0.15) / 0.7, 0, 1);
      if (dith(x, y, lv)) g[y][x] = 'K';
    }
    return g;
  }
  function genDoorPost(h) { const g = mkGrid(5, h + 2); for (let y = 1; y <= h; y++) for (let x = 1; x <= 3; x++) g[y][x] = y === 1 ? 'h' : (y - 1) % 4 === 0 ? 'D' : x === 1 ? 'h' : x === 2 ? 'l' : 'd'; return gOutline(g); }
  // 쇠창살 (n/s는 세로 창살, w/e는 가로)
  function genBars(wc, hc, vert) {
    const g = mkGrid(wc, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const along = vert ? x : y, cross = vert ? y : x, L = vert ? hc : wc;
      if (along % 4 === 1) g[y][x] = 'G'; else if (along % 4 === 2) g[y][x] = 'g'; else if (along % 4 === 3) g[y][x] = 'k';
      if (cross === Math.floor(L * 0.28) || cross === Math.floor(L * 0.68)) g[y][x] = along % 4 === 1 ? 'W' : 'g';
      if (vert && y === hc - 1 && along % 4 !== 1 && along % 4 !== 2) g[y][x] = '.';
    }
    return g;
  }
  const BAR_PAL = { k: '#0b0a0e', g: '#4a4656', G: '#7a7488', W: '#a49cb0' };
  const WOOD_BAR = { k: '#0b0806', g: '#553620', G: '#8a6034', W: '#e0d6c4' };
  // 가시덤불: 굵은 덩굴 몇 가닥 + 가시 + 잎 + 열매
  function genThorns(wc, hc, vert) {
    const g = mkGrid(wc, hc), L = vert ? wc : hc, span = vert ? hc : wc, n = Math.max(2, Math.round(span / 6));
    for (let i = 0; i < n; i++) {
      const ph = rand(0, 6), amp = rand(1, 2), base = 2 + i * (span - 4) / Math.max(1, n - 1);
      for (let t = 0; t < L; t++) {
        const o = Math.round(base + Math.sin(t * 0.45 + ph) * amp);
        for (const k of [-1, 0]) { const x = vert ? t : o + k, y = vert ? o + k : t; if (x >= 0 && y >= 0 && x < wc && y < hc) g[y][x] = k ? 'v' : 'V'; }
        if (t % 5 === 2) { const x = vert ? t : o - 2, y = vert ? o - 2 : t; if (x >= 0 && y >= 0 && x < wc && y < hc && g[y][x] === '.') g[y][x] = 't'; }
        if (t % 5 === 4) { const x = vert ? t : o + 1, y = vert ? o + 1 : t; if (x >= 0 && y >= 0 && x < wc && y < hc && g[y][x] === '.') g[y][x] = 't'; }
      }
    }
    for (let i = 0; i < wc * hc / 45; i++) { const x = randi(1, wc - 3), y = randi(1, hc - 2); if (g[y][x] === '.' && g[y][x + 1] === '.' && (gAt(g, x, y + 1) === 'v' || gAt(g, x, y - 1) === 'V')) { g[y][x] = 'L'; g[y][x + 1] = 'l'; } }
    for (let i = 0; i < 2; i++) { const x = randi(2, wc - 3), y = randi(2, hc - 3); if (g[y][x] === 'V') g[y][x] = 'r'; }
    return gOutline(g, 'k', 't');
  }
  const THORN_PAL = { k: '#070a04', V: '#2a3214', v: '#4a5626', t: '#b8a878', L: '#2e5222', l: '#5a8a3a', r: '#c03040' };
  // 보스 문장: 붉은 해골
  const SIGIL = fromRows(['..kkkkkk..', '.krrRRrrk.', 'krRRRRRRrk', 'krkkRRkkrk', 'krkKRRkKrk', 'krRRkkRRrk', '.krRRRRrk.', '..kRkRkRk.', '...kkkkk..']);
  const SIGIL_PAL = { k: '#1a0408', K: '#ff5060', r: '#7a1020', R: '#c02838' };
  // 상자
  const CHEST_C = fromRows(["..kkkkkkkkkkkkkk..", ".kyYwwywwwwywwYyk.", "kyYwwbywwwwybwwYyk", "kybbbbybbbbybbbbyk", "kyBbbbyBbbbyBbbByk", "kkkkkkkkYYkkkkkkkk", "kyYbbbykYYkybbbYyk", "kybbbbykyykybbbbyk", "kybBbbybkkbybbBbyk", "kybbbbybbbbybbbbyk", "kyBbbbyBbbbyBbbByk", "kybbbbybbbbybbbbyk", "kyYBBBByBBByBBBYyk", "kkkkkkkkkkkkkkkkkk"]); // v2.32 보물상자 다시 (18×14칸 · 둥근 뚜껑 · 쇠띠 · 자물쇠)
  const CHEST_O = fromRows(["..kkkkkkkkkkkkkk..", ".kyBbbybbbbybbByk.", "kyBKKKKKKKKKKKKByk", "kyKKKKKKKKKKKKKKyk", "kkkkkkkkkkkkkkkkkk", "kyKKKoKKKKKKoKKKyk", "kyYbbbykYYkybbbYyk", "kybbbbykyykybbbbyk", "kybBbbybkkbybbBbyk", "kybbbbybbbbybbbbyk", "kyBbbbyBbbbyBbbByk", "kybbbbybbbbybbbbyk", "kyYBBBByBBByBBBYyk", "kkkkkkkkkkkkkkkkkk"]);
  const CHEST_PAL = {"k": "#0b0a0e", "K": "#140c06", "w": "#a87e52", "b": "#7a5434", "B": "#4e3420", "y": "#b88a30", "Y": "#f0d070", "o": "#ffd34d"};
  const CHEST_PAL_B = {"k": "#0b0a0e", "K": "#160608", "w": "#c03a42", "b": "#7e2028", "B": "#4a1016", "y": "#e0a830", "Y": "#fff0a0", "o": "#ffe080"}; // 보스 전리품 상자: 핏빛 칠 · 금 장식
  const CHEST_PAL_S = {"k": "#0b0a0e", "K": "#120a1c", "w": "#9a7ac0", "b": "#5a3e84", "B": "#34224e", "y": "#a890d8", "Y": "#f4e8ff", "o": "#f0d8ff"}; // 비밀 방 상자: 보랏빛
  // 상인: 두건 쓴 떠돌이 상인과 짐수레
  // v2.93 상인 「살구」: 왕관앵무 수인 (크림 노랑 몸 · 노란 얼굴 · 주황 볼 · 세로 눈 · 큰 등짐과 침낭 · 한쪽 날개를 펼쳐 손님을 반김)
  const MERCHANT_ROWS = ['.'.repeat(20)].concat(["...Yy.............", "....yY.Yy.........", "rRRr.yYyY.YPPP....", "rSSr..yYyyYQQPP...", ".PP..gyYYyg.PcP...", ".PPPgyYYYYygPPQ...", ".QPgYYYYYYYYgPP...", ".PPgYeYYYeYYgPP...", ".PPooEYbbEYooPP...", ".QPgoYYBBYYogPdW..", ".PP.gyYYYYygGWWdW.", ".PdGPgcCcgPGWWdWd.", "..dWPggcggPdWdWd..", "..dWggggggg.d.d...", "...ddggggg........", "......ggg.........", "......l.l.........", ".....lL.lL........"].map(r => '.' + r + '.')); // 바깥 1칸 여백 (외곽선 자리)
  const MERCHANT_PAL = {"k": "#0b0a0e", "y": "#f0cc40", "Y": "#fbe680", "o": "#e8703a", "b": "#b8a8a0", "B": "#7a6a66", "e": "#141014", "w": "#ffffff", "g": "#ead79a", "G": "#f8eecc", "d": "#c0a45c", "c": "#e8902a", "C": "#9a5210", "P": "#7a4e2c", "Q": "#a8744a", "E": "#6a3a22", "R": "#b04038", "S": "#7a2828", "r": "#e0c8a0", "W": "#dcc078", "l": "#d4a098", "L": "#9a6a62"};
  // 장면: wing 펼친 날개를 한 칸 들어 퍼덕임 · crest 볏 끝이 한 칸 흔들림 · blink 눈 감음
  function merchantGrid(wing, crest, blink) {
    const g = MERCHANT_ROWS.map(r => r.split(''));
    if (wing) { const mv = []; for (let y = 10; y <= 14; y++) for (let x = 12; x < 20; x++) if ('WdG'.includes(g[y][x])) { mv.push([y, x, g[y][x]]); g[y][x] = '.'; } for (const [y, x, c] of mv) g[y - 1][x] = c; }
    if (crest) { for (const y of [1, 2]) { const r = g[y]; for (let x = 8; x >= 3; x--) if ('yY'.includes(r[x]) && r[x + 1] === '.') { r[x + 1] = r[x]; r[x] = '.'; } } }
    if (blink) for (const x of [6, 10]) { g[8][x] = 'Y'; g[9][x] = 'e'; }
    return gOutline(g);
  }
  const merchantArt = (wing, crest, blink) => art('merch' + (+wing) + (+crest) + (+blink), () => gCanvas(merchantGrid(wing, crest, blink), MERCHANT_PAL));
  const MERCHANT = merchantGrid(false, false, false); // 예전 그림 자리 (노점 · 수레 장면)
  const STAND = fromRows(['kkkkkkkkkkk', 'kwwwwwwwwwk', 'kbbbbbbbbbk', 'kbBkkkkkBbk', 'kbBk...kBbk', 'kkkk...kkkk']);
  const STAND_PAL = { k: '#0b0a0e', w: '#8a6a48', b: '#6a4a30', B: '#4a3220' };
  const GEARBOX = fromRows(["....kk....kk....", "...kRRk..kRRk...", "..kRrRRkkRRrRk..", "..kRrrRkkRrrRk..", "...kRRRooRRRk...", ".kkkkkkRRkkkkkk.", "kWLLLLkRrkLLLLdk", "kLlLLLkRrkLLLldk", "kkkkkkkRrkkkkkkk", ".kBBpBkRrkBpBbk.", ".kBBBBkRrkBBbbk.", ".kBpBBkRrkBBpbk.", ".kBBBBkRrkBBbbk.", ".kBBBpkRrkpBbbk.", ".kbbbbkrrkbbbbk.", ".kkkkkkkkkkkkkk."]); // v2.38 장비 꾸러미(선물상자) 16칸 · 리본 매듭 · 물방울 무늬
  const GEARBOX_PAL = {"k": "#0b0a0e", "R": "#ffd34d", "r": "#b08020", "o": "#fff6c8", "W": "#ff9aa0", "L": "#e05060", "l": "#a83040", "d": "#6a1828", "B": "#c8404e", "b": "#7a1e2e", "p": "#ff8a90"};
  const IRONORE = fromRows(["...kkkk.....", "..kNnnnkk...", ".kNnTSnnnk..", "kNnSTsnunnk.", "knnsnnnnTSk.", "knunnTSnsnNk", "kNnnSsnnnNNk", ".kNNnnnuNNk.", "..kkNNNNkk..", "....kkkk...."]); // v2.32 철광석 다시
  const IRONORE_PAL = { k: '#0b0a0e', n: '#6a6470', N: '#45404c', S: '#a8b8c8', s: '#6a7a8c', T: '#e8f0f8', u: '#b06a3a' };

  const artCache = {};
  const art = (key, fn) => artCache[key] || (artCache[key] = fn());

  // --- 바닥에 찍기 -----------------------------------------------------
  function paintBlood(g, b) { const c = CAMP3.bloodPool(b.w, b.h, (Math.random() * 1e6) | 0); g.drawImage(c, (Math.round(b.x0) & ~1) - c.pad * 2, (Math.round(b.y0) & ~1) - c.pad * 2); } // v3.19 3장 피웅덩이
  function paintChasm(g, b) { gPaint(g, genChasm(Math.round(b.w / 2), Math.round(b.h / 2)), CHASM_PAL, b.x0 - 2, b.y0 - 2); }
  // 샘물 웅덩이 (손으로 그린 3가지 크기): 흙 둑, 가운데 솟는 물결, 돌·수련·갈대
  const SPRINGS = {
    springS: fromRows([".....kkkkkk.....", "...kkbbbbbbkk...", "..kbBBBBBBBBbk..", ".kBDDDDDDDDDDBk.", ".kDWWWWhhWWWWDk.", "kgWWWWhWWhWWWWkM", "kGgWWWWhhWWWwwkm", ".kdwwwwwwwwwwk..", "..kkwwwwwwwkk...", "....kkkkkkk....."]),
    springM: fromRows(["........kkkkkk........", ".....kkkbbbbbbkkk.....", "...kkbbBBBBBBBBbbkk...", "..kbBBDDDDDDDDDDBBbk..", ".kGBDDWWWWWWWWWWDDBk..", "kGgdDWWWWWhhhWWWWWDk.R", "kgdkWWWWWhWWWhWWWWWkRY", ".kmWWLlWWWhhhWWWWWwkR.", ".kMwLLWWWWWWWWWwwwwk..", "..kwwwwwwwwwwwwwwwkM..", "..kkwwwwwwwwwwwwwkkm..", "....kkkwwwwwwwkkk.....", ".......kkkkkkk........"]),
    springL: fromRows(["..........kkkkkkkk..........", ".......kkkbbbbbbbbkkk.......", "....kkkbbBBBBBBBBBBbbkkk....", "...kbbBBBDDDDDDDDDDBBBbbk...", "..kGgBDDDDWWWWWWWWDDDDBBk...", ".kGGgdDWWWWWWWWWWWWWWDDBk.RY", "kGggdkWWWWWWhhhhWWWWWWWDk.R.", "kgddkWWWWWWhWWWWhWWWWWWWkkR.", ".kkmWWLlWWWhWWWWhWWWGgWWWkk.", ".kMWWLLWWWWWhhhhWWWWdkWWWk..", "..kmwwwWWWWWWWWWWWWWWWwwwk..", "..kMwwwwwwwwWWWWWwwwwwwwkGgk", "...kkwwwwwwwwwwwwwwwwwkkgddk", ".....kkwwwwwwwwwwwwwkk.kkkk.", ".......kkkkkkkkkkkkk........"]),
  };
  function paintPool(g, b) {
    withSeed(b.seed, () => {
      if (b.pool === 'poolM') { const sp = SPRINGS[pick(['springM', 'springL'])], f = Math.random() < 0.5 ? sp.map(r => r.slice().reverse()) : sp; gPaint(g, f, POND_PAL, b.x - f[0].length, b.y - f.length + 2); return; }
      const wc = b.pool === 'poolL' ? 34 : 48, hc = b.pool === 'poolL' ? 18 : 26, style = pick(['clear', 'clear', 'rocky', 'swamp', b.pool === 'poolXL' ? 'island' : 'clear']);
      const gr = genPond(wc, hc, style, pick(['blob', 'blob', 'kidney'])), pal = Object.assign({}, POND_PAL, POND_PALS[style]);
      // 가운데 솟는 물결
      const cx = Math.round(gr[0].length / 2), cy = Math.round(gr.length / 2);
      if (style !== 'island') for (const [dx, dy] of [[-2, 0], [2, 0], [-1, -1], [0, -1], [1, -1], [-1, 1], [0, 1], [1, 1]]) if ('Ww'.includes(gAt(gr, cx + dx, cy + dy))) gr[cy + dy][cx + dx] = 'h';
      gPaint(g, gr, pal, b.x - gr[0].length, b.y - gr.length);
    });
  }
  function paintPond(g, b) {
    if (b.brook) return;
    if (b.pool) return paintPool(g, b);
    if (typeof RUIN1 !== 'undefined') { const c = RUIN1.reservoir(b.w, b.h, (Math.random() * 1e6) | 0); g.drawImage(c, (Math.round(b.x0) & ~1) - 12, (Math.round(b.y0) & ~1) - 12); return; } // v3.19 큰 연못 → 폐허 저수지 (작은 물웅덩이 M · L · XL은 그대로)
    const wc = Math.round(b.w / 2), hc = Math.round(b.h / 2), style = pick(wc >= 50 && hc >= 30 ? ['clear', 'clear', 'swamp', 'rocky', 'island', 'island'] : ['clear', 'swamp', 'rocky']), shape = pick(wc > hc * 1.6 ? ['blob', 'kidney', 'lobes'] : ['blob', 'blob', 'kidney']); gPaint(g, genPond(wc, hc, style, shape), Object.assign({}, POND_PAL, POND_PALS[style]), b.x0 - 6, b.y0 - 6); }
  // 텔레포터 마법진 (v0.62): 바깥 고리 · 룬 띠 · 안쪽 고리 · 육망성 · 가운데 원. 'a'=고리 'b'=별 'c'=룬 'o'=가운데
  const MC_W = 36, MC_H = 18;
  function genMagicCircle() {
    const g = mkGrid(MC_W, MC_H), cx = (MC_W - 1) / 2, cy = (MC_H - 1) / 2, RX = MC_W / 2 - 0.6, RY = MC_H / 2 - 0.6;
    for (let y = 0; y < MC_H; y++) for (let x = 0; x < MC_W; x++) {
      const e = Math.hypot((x - cx) / RX, (y - cy) / RY);
      if (e <= 1 && e > 0.88) g[y][x] = 'a';
      else if (e <= 0.68 && e > 0.58) g[y][x] = 'a';
      else if (e <= 0.18) g[y][x] = 'o';
    }
    const line = (x0, y0, x1, y1) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); if (g[y] && g[y][x] === '.') g[y][x] = 'b'; } };
    for (const off of [-Math.PI / 2, Math.PI / 2]) { const v = [0, 1, 2].map(i => ({ x: cx + Math.cos(off + i * TAU / 3) * RX * 0.58, y: cy + Math.sin(off + i * TAU / 3) * RY * 0.58 })); for (let i = 0; i < 3; i++) line(v[i].x, v[i].y, v[(i + 1) % 3].x, v[(i + 1) % 3].y); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, x = Math.round(cx + Math.cos(a) * RX * 0.78), y = Math.round(cy + Math.sin(a) * RY * 0.78); if (g[y]) { g[y][x] = 'c'; if (i % 2 === 0 && g[y][x + 1] === '.') g[y][x + 1] = 'c'; } }
    return g;
  }
  function paintTelePad(g, p) { // 바닥에 새겨진 마법진 (꺼진 상태)
    const mc = genMagicCircle().map(r => r.map(c => c === '.' ? '.' : c === 'a' || c === 'o' ? 'K' : c === 'c' ? 'r' : 'D'));
    gPaint(g, mc, Object.assign({}, TELE_PAL, { K: '#121019', D: '#1c1a26', r: '#2a3450' }), p.x - MC_W, p.y - MC_H);
  }
  // 켜진 마법진: 고리·별·룬이 빛나고 룬 점이 고리를 따라 돈다
  function drawMagicCircle(p) {
    const on = 0.65 + 0.35 * Math.sin(time * 3.2), x0 = (Math.round(p.x) - MC_W) & ~1, y0 = (Math.round(p.y) - MC_H) & ~1;
    const glow = art('mcGlow', () => gCanvas(genMagicCircle(), { a: '#9fd2ff', b: '#6fa8ff', c: '#e8f6ff', o: '#bfe2ff' }));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45 + 0.35 * on; ctx.drawImage(glow, x0, y0);
    ctx.globalAlpha = 1;
    const cx = p.x, cy = p.y - 1;
    for (let i = 0; i < 10; i++) { const a = time * 0.9 + i / 10 * TAU; ctx.fillStyle = i % 2 ? 'rgba(220,240,255,.95)' : 'rgba(140,190,255,.9)'; ctx.fillRect((Math.round(cx + Math.cos(a) * (MC_W - 2)) & ~1), (Math.round(cy + Math.sin(a) * (MC_H - 1)) & ~1), 2, 2); }
    for (let i = 0; i < 6; i++) { const a = -time * 1.6 + i / 6 * TAU; ctx.fillStyle = 'rgba(200,230,255,.8)'; ctx.fillRect((Math.round(cx + Math.cos(a) * MC_W * 0.36) & ~1), (Math.round(cy + Math.sin(a) * MC_H * 0.36) & ~1), 2, 2); }
    ctx.restore();
  }
  // 빛기둥: 마법진에서 위로 솟는 디더링 빛 + 오르내리는 밝은 띠 (엔티티 위에 더한다)
  function drawExit(p) { // v1.01 다음 스테이지 출구: 텔레포터(푸른색)와 구분되는 핏빛·금빛 마법진
    const on = 0.65 + 0.35 * Math.sin(time * 3.6), x0 = (Math.round(p.x) - MC_W) & ~1, y0 = (Math.round(p.y) - MC_H) & ~1;
    const glow = art('mcGlowExit', () => gCanvas(genMagicCircle(), { a: '#ffb060', b: '#d0402a', c: '#fff0c0', o: '#ffd080' }));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.4 * on; ctx.drawImage(glow, x0, y0); ctx.globalAlpha = 1;
    for (let i = 0; i < 12; i++) { const a = -time * 1.1 + i / 12 * TAU; ctx.fillStyle = i % 3 ? 'rgba(255,120,60,.9)' : 'rgba(255,230,160,.95)'; ctx.fillRect(Math.round(p.x + Math.cos(a) * (MC_W - 2)) & ~1, Math.round(p.y - 1 + Math.sin(a) * (MC_H - 1)) & ~1, 2, 2); }
    ctx.restore();
  }
  const RGBAQ = new Map(); const rgbaQ = (c, a) => { const q = Math.round(a * 40), k = c + q; let v = RGBAQ.get(k); if (!v) { v = `rgba(${c},${q / 40})`; RGBAQ.set(k, v); } return v; }; // v1.78 색 문자열 캐시 (알파 1/40 단위)
  function drawExitPillar() {
    const R = G.dun && G.dun.cur; if (!R || !R.exit) return;
    const p = R.exit, H0 = 150, w0 = 44, pulse = 0.8 + 0.2 * Math.sin(time * 5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let y = 0; y < H0; y += 2) { const k = 1 - y / H0, hw = Math.round((w0 / 2) * (0.5 + 0.5 * k) + Math.sin(time * 7 + y * 0.25)) & ~1;
      for (let x = -hw; x < hw; x += 2) { const edge = Math.abs(x + 1) / hw, lv = Math.min(1, (0.35 + k) * (1 - edge * 0.7) * pulse); if (!dith((x + 64) >> 1, (y + Math.floor(time * 26)) >> 1, lv)) continue;
        ctx.fillStyle = edge < 0.35 ? rgbaQ('255,236,190', 0.25 + 0.6 * k) : rgbaQ('230,70,40', 0.25 + 0.5 * k); ctx.fillRect((Math.round(p.x) + x) & ~1, (Math.round(p.y - 2) - y) & ~1, 2, 2); } }
    for (let i = 0; i < 3; i++) { const yy = (time * 60 + i * H0 / 3) % H0; ctx.fillStyle = `rgba(255,220,160,${0.55 * (1 - yy / H0)})`; ctx.fillRect((Math.round(p.x) - 10) & ~1, Math.round(p.y - 2 - yy) & ~1, 20, 2); }
    ctx.restore();
    if (Math.random() < 0.7) G.parts.push({ x: p.x + rand(-16, 16), y: p.y - rand(0, 8), vx: rand(-5, 5), vy: -rand(50, 110), t: rand(0.5, 1.0), c: pick(['#ffb060', '#ff6a3a', '#fff0c0']), g: 0, glow: true });
  }
  function drawTelePillar() {
    const R = G.dun && G.dun.cur; if (!R || !R.tele || !R.cleared) return;
    const p = R.tele, H0 = 120, w0 = 40, pulse = 0.8 + 0.2 * Math.sin(time * 4.2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const L = pxLayer((Math.round(p.x) - w0 / 2 - 4) & ~1, (Math.round(p.y - 2) - H0 - 2) & ~1, w0 + 10, H0 + 6, true); // v1.17 한 장으로
    for (let y = 0; y < H0; y += 2) {
      const k = 1 - y / H0, hw = Math.round((w0 / 2) * (0.55 + 0.45 * k) + Math.sin(time * 6 + y * 0.2)) & ~1;
      for (let x = -hw; x < hw; x += 2) {
        const edge = Math.abs(x + 1) / hw, lv = Math.min(1, (0.35 + k) * (1 - edge * 0.7) * pulse);
        if (!dith((x + 64) >> 1, (y + Math.floor(time * 20)) >> 1, lv)) continue;
        if (edge < 0.35) L.rect((Math.round(p.x) + x) & ~1, (Math.round(p.y - 2) - y) & ~1, 2, 2, 225, 242, 255, 0.25 + 0.6 * k);
        else L.rect((Math.round(p.x) + x) & ~1, (Math.round(p.y - 2) - y) & ~1, 2, 2, 110, 170, 255, 0.2 + 0.5 * k);
      }
    }
    L.flush();
    for (let i = 0; i < 2; i++) { const yy = ((time * 50 + i * H0 / 2) % H0); ctx.fillStyle = `rgba(230,245,255,${0.5 * (1 - yy / H0)})`; ctx.fillRect((Math.round(p.x) - 8) & ~1, (Math.round(p.y - 2 - yy)) & ~1, 16, 2); }
    ctx.restore();
    if (Math.random() < 0.6) G.parts.push({ x: p.x + rand(-14, 14), y: p.y - rand(0, 8), vx: rand(-4, 4), vy: -rand(40, 90), t: rand(0.5, 1.0), c: pick(['#bfe2ff', '#9fd2ff', '#ffffff']), g: 0, glow: true });
  }
  // v2.21 2~4장 좌우 문: 벽을 뚫고 밖으로 이어지는 통로 (위 벽면·바닥 타일·아래 벽 윗면 + 문턱 계단, 밖으로 갈수록 어둠)
  function genSideGate(d, wood) {
    const wc = 40, hc = 28, g = mkGrid(wc, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const dist = d === 'w' ? wc - 1 - x : x; let c;
      if (y <= 3) { // 위쪽 벽면
        c = y === 0 ? 'h' : wood ? ((dist % 4 === 0) ? 'D' : dist % 4 === 1 ? 'h' : 'l') : (((dist + (y % 2) * 3) % 6 === 0) ? 'D' : y === 1 ? 'l' : 'd');
      } else if (y === 4) c = 'D'; // 벽 그늘
      else if (y <= 23) { // 바닥
        const r = y - 5, off = (Math.floor(r / 5) % 2) * 3;
        c = wood ? ((dist % 5 === 4) ? 'D' : r % 7 === 0 ? 'l' : 'd') : (r % 5 === 4 || (dist + off) % 6 === 5) ? 'D' : r % 5 === 0 ? 'l' : 'd';
        if (dist <= 1) c = dist === 0 ? 'h' : 'l'; // 문턱 돌
        else if (dist === 8 || dist === 16) c = wood ? 'l' : 'h'; else if (dist === 9 || dist === 17) c = 'D'; // 내려가는 계단 두 단
      } else c = y === 24 ? 'h' : y === 25 ? 'l' : 'D'; // 아래 벽 윗면
      const t = dist / wc, lv = clamp((t - 0.12) / 0.7, 0, 1);
      if (dith(x, y, lv)) c = 'K'; else if (lv > 0.55 && c !== 'K') c = 'D';
      g[y][x] = c;
    }
    return g;
  }
  function paintDoorCastle(g, d) {
    const p = DOOR[d];
    if (d === 'n') { gPaint(g, genArch(), STONE, p.x - 27, p.y - 70); return; }
    if (d === 's') { gPaint(g, genFloorExit(20, 36, 's'), STONE, p.x - 20, p.y); gPaint(g, genDoorPost(14), STONE, p.x - 30, p.y - 2); gPaint(g, genDoorPost(14), STONE, p.x + 20, p.y - 2); return; }
    gPaint(g, genSideGate(d, false), STONE, d === 'w' ? p.x - 80 : p.x, p.y - 28); // v2.21
  }
  function paintMeadowDoorPaths(g, R) {
    const curve = (d) => {
      const p = DOOR[d], ph = rand(0, 6);
      for (let t = 0; t < 150; t += 2) {
        const c = Math.round(((d === 's' ? p.x : p.y) + Math.sin(t * 0.05 + ph) * 5) / 2) * 2, hw = 10 - Math.floor(t / 50) * 2 + (Math.random() < 0.3 ? 2 : 0);
        const span = Math.ceil(hw * 1.4 / 2) * 2;
        for (let o = -span; o <= span; o += 2) {
          const x = (d === 's' ? c + o : d === 'w' ? p.x - t : p.x + t) & ~1, y = (d === 's' ? p.y - 14 + t : c + o) & ~1;
          if (t < 20 && dith(x >> 1, y >> 1, 1 - (t + 4) / 24)) continue; // 벽선에서 시작하는 부분은 성기게
          const col = dirtCol(o, hw, x, y); if (col) { g.fillStyle = col; g.fillRect(x, y, 2, 2); }
        }
      }
    };
    for (const d of ['s', 'w', 'e']) if (R.doors[d] != null && !(R.crack && R.crack.dir === d && !R.crack.broken)) curve(d);
  }
  function paintDoorMeadow(g, d) {
    const p = DOOR[d];
    const bushes = (pts) => { for (const [x, y, f] of pts) stamp(g, DECO_MAPS.bush, Object.assign({}, DECO, { m: '#1e3a18', M: '#2e5222', r: '#8a2030' }), Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, f); };
    if (d === 'n') {
      // 나무 사이로 뚫린 잎 터널: 아치 모양 그늘 + 바닥 흙길, 가장자리는 잎 뭉치
      const W0 = 30, H0 = 40, cx = 14.5, top = 13, gg = mkGrid(W0, H0);
      const inShape = (x, y) => y >= top ? x >= 4 && x <= 25 : Math.hypot(x - cx, y - top) <= 10.5;
      const path = genPath(W0, H0, true, 'n');
      for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
        if (inShape(x, y)) { const t = y / H0; if (y > H0 - 8 && !dith(x, y, (H0 - 1 - y) / 8)) continue; gg[y][x] = dith(x, y, clamp((0.85 - t) / 0.35, 0, 1)) ? 'K' : 'q'; }
        else if (inShape(x - 2, y) || inShape(x + 2, y) || inShape(x, y + 2) || inShape(x - 1, y + 1) || inShape(x + 1, y + 1)) { if (y < H0 - 1) gg[y][x] = shade4(x - cx, y - top, 12, 0.35); }
      }
      for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) if (gg[y][x] === '.' && y > H0 - 9 && x > 5 && x < 24) gg[y][x] = '_'; // 아래쪽 디더링 빈칸은 외곽선을 두르지 않음
      const og = gOutline(gg).map(r => r.map(c => c === '_' ? '.' : c));
      if (false) gPaint(g, og, Object.assign({ q: '#1a2a14', K: '#050905', k: '#07100a' }, PATH_PAL, { h: TREE_PAL.green.h, l: TREE_PAL.green.l, d: TREE_PAL.green.d, D: TREE_PAL.green.D }), p.x - 30, p.y - 78); /* v2.21 사용자 결정: 초록 잎 터널(아치) 없앰 — 불기둥 + 울타리로 문 표시 */
      // 터널 안 어둠에서 시작해 문턱 아래 풀밭으로 흐려지는 흙길
      const ph = rand(0, 6), B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (let y = (p.y - 58) & ~1; false && y < p.y + 30; y += 2) { /* v2.21 북문 바깥 흙길 없앰 */
        const c = Math.round((p.x + Math.sin(y * 0.06 + ph) * 3) / 2) * 2, f = Math.min(1, (y - (p.y - 60)) / 34, (p.y + 30 - y) / 26), hw = Math.round((4 + 6 * clamp((y - (p.y - 50)) / 60, 0, 1)) / 2) * 2;
        for (let o = -14; o <= 14; o += 2) {
          const x = c + o; if (y < p.y - 2 && Math.abs(x - p.x) > 18) continue;
          if (!((0.15 + f * 1.1) * 16 > B4[((y >> 1) & 3) * 4 + ((x >> 1) & 3)])) continue;
          const col = dirtCol(o, hw, x, y); if (col) { g.fillStyle = y < p.y ? mixHex(col, '#050905', clamp((p.y - y) / 60, 0, 0.75)) : col; g.fillRect(x, y, 2, 2); }
        }
      }
    }
  }

  // --- 장애물 스프라이트 ------------------------------------------------
  const fencedPit = b => Math.min(b.w, b.h) >= 56; // v3.19 2장 벽: 덩어리는 울타리 낭떠러지, 폭 56px 미만은 쇠 창살 벽
  function makeObsSprites(R) {
    const out = [];
    withSeed(R.seed ^ 0x5bd1, () => {
      for (const b of R.obs) {
        if (b.t === 'pit' && !b.c && G.stage === 4 && typeof TOWN4 !== 'undefined') { const c = TOWN4.scorch(b.w, b.h, (Math.random() * 1e6) | 0); out.push({ cv: c, x: (Math.round(b.x0) & ~1) - c.pad * 2, y: (Math.round(b.y0) & ~1) - c.pad * 2, sy: -1e5, raw: true }); continue; } // v3.19 4장 불탄 자리 (웅덩이 자리 · 바닥 바로 위에 깔림)
        if (b.t === 'pit' || b.t === 'prop' || b.t === 'drum') continue;
        if (G.stage === 3) continue;
        if (G.stage === 1) {
          if (b.t === 'pillar') {
            const kind = pick(['round', 'round', 'pine']); // v3.19 흰 줄기 작은 나무(자작나무) 삭제
            if (kind === 'round' && typeof RUIN1 !== 'undefined') { const c = RUIN1.tree(pick(['green', 'green', 'deep', 'autumn', 'dusk']), (Math.random() * 1e6) | 0); out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 10) & ~1, sy: b.y }); continue; } // v3.19 둥근 나무: 잎 뭉치 · 줄기 결 · 뿌리 (29_ruin1.js)
            const map = genTree(kind), pal = Object.assign({}, TRUNK, TREE_PAL[kind === 'pine' ? 'deep' : kind === 'birch' ? 'birch' : pick(['green', 'green', 'deep', 'autumn', 'dusk'])]);
            const w = map[0].length * 2, h = map.length * 2, [c, g] = mkCanvas(w + 8, h + 6);
            dshRect(g, 6, h, w - 4, 2, 0.5); dshRect(g, 10, h + 2, w - 12, 2, 0.3);
            stamp(g, map, pal, 4, 0, 2, Math.random() < 0.5);
            if (typeof RUIN1 !== 'undefined') { out.push({ cv: RUIN1.withShadow(c), x: (Math.round(b.x - w / 2 - 4) & ~1) - 8, y: (Math.round(b.y - h + 2) & ~1) - 8, sy: b.y }); continue; } // v3.19 전나무 · 자작나무: 납작 띠 → 붙은 그림자
            out.push({ cv: c, x: Math.round(b.x - w / 2 - 4) & ~1, y: Math.round(b.y - h + 2) & ~1, sy: b.y });
          } else if (b.t === 'rock') {
            if (typeof RUIN1 !== 'undefined') { // v3.19 폐허에서 떨어져 나온 돌 — 연달아 나오지 않게: 260px 안에 이미 있거나 방에 둘이 있으면 이끼 바위로
              const sd = (Math.random() * 1e6) | 0, ruin = out.filter(o => o.ruin).length < 2 && !out.some(o => o.ruin && Math.hypot(o.rx - b.x, o.ry - b.y) < 260), c = ruin ? (b.r > 17 ? RUIN1.chunkL(sd) : RUIN1.chunkS(sd)) : RUIN1.boulder(b.r, sd);
              out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 14) & ~1, sy: b.y, ruin, rx: b.x, ry: b.y }); continue; }
          } else {
            if (typeof RUIN1 !== 'undefined') { const c = RUIN1.ruinBlock(b.w, b.h, (Math.random() * 1e6) | 0); out.push({ cv: c, x: (Math.round(b.x0) & ~1) - 12, y: (Math.round(b.y0 - c.HH * 2) & ~1) - 12, sy: b.y1 }); continue; } // v3.19 산울타리 → 이끼 낀 폐허 돌담 · 한 면이 열린 폐허
            const { g, HH } = genHedge(Math.round(b.w / 2), Math.round(b.h / 2));
            out.push({ cv: gCanvas(g, LEAF), x: Math.round(b.x0 - 4) & ~1, y: Math.round(b.y0 - HH * 2 - 4) & ~1, sy: b.y1 });
          }
        } else if (G.stage === 4) { const n0 = out.length; // v1.23 왕도: 녹아내린 왕의 동상 · 부서진 기둥 / 깨진 종 · 잔해 / 마차 · 무너진 성벽, 모두 위에 재
          if (b.t === 'pillar') {
            const king = Math.random() < 0.35 && false /* v2.82 녹아내린 왕 동상 삭제 (사용자 결정) — 부서진 기둥만 */, lp = !king, c = king ? gCanvas(genMeltKing(), KING4) : ASH4.lamp() /* v2.89 녹아내린 가로등 (v3.20 옛 기둥 genPillar 삭제) */;
            out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 6) & ~1, sy: b.y, raw: king || lp });
          } else if (b.t === 'rock') {
            const bell = b.r >= 10 && Math.random() < 0.55, jk = !bell, c = bell ? gCanvas(genBell(b.r), BELL4) : ASH4.junk(b); // v2.87 4장 고유: 짐 더미 · 우물 · 무구 더미
            out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 6) & ~1, sy: b.y, raw: bell || jk });
          } else {
            const wc = Math.round(b.w / 2), hc = Math.round(b.h / 2);
            const hs = typeof HOUSE4 !== 'undefined' && wc >= 24 && hc >= 8 /* v2.88 불탄 집 — 폭이 모자라면 성벽 덩어리 */, { g, HH } = hs ? (HOUSE4.genRow || HOUSE4.gen)(wc, hc) /* v3.19 길면 모양이 다른 집 여러 채 + 보도블록 단 + 가로등 */ : genWallBlock(wc, hc);
            out.push({ cv: hs ? gCanvas(g, HOUSE4.pal) : gCanvas(ashCap(g, hc), STONE4), x: Math.round(b.x0 - 2) & ~1, y: Math.round(b.y0 - HH * 2 - 2) & ~1, sy: b.y1, raw: hs });
          }
          if (typeof RUIN1 !== 'undefined') for (let i = n0; i < out.length; i++) { const o = out[i]; o.cv = RUIN1.withShadow(o.cv); o.x -= 8; o.y -= 8; } // v3.19 4장도 밑동에 붙은 그림자
        } else {
          if (G.stage === 2 && typeof KEEP2 !== 'undefined') { // v3.19 2장: 새 돌기둥 · 돌무더기 · 석벽 덩어리 → 쇠 울타리를 두른 낭떠러지 (가늘고 긴 벽은 쇠 창살 벽)
            const sd = (Math.random() * 1e6) | 0;
            if (b.t === 'pillar') { const c = KEEP2.pillar(Math.random() < 0.35, sd); out.push({ cv: c, x: Math.round(b.x - 31) & ~1, y: Math.round(b.y - c.height + 14) & ~1, sy: b.y }); }
            else if (b.t === 'rock') { const c = KEEP2.rubble(b.r, sd); out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 14) & ~1, sy: b.y }); }
            else { const c = fencedPit(b) ? KEEP2.fence(b.w, b.h, sd) : KEEP2.fenceWall(b.w, b.h, sd); out.push({ cv: c, x: (Math.round(b.x0) & ~1) - 8, y: (Math.round(b.y0) & ~1) - c.FH * 2 - 8, sy: b.y1 }); }
            continue;
          }
          if (b.t !== 'pillar' && b.t !== 'rock') {
            const { g, HH } = genWallBlock(Math.round(b.w / 2), Math.round(b.h / 2));
            out.push({ cv: gCanvas(g, STONE), x: Math.round(b.x0 - 2) & ~1, y: Math.round(b.y0 - HH * 2 - 2) & ~1, sy: b.y1 });
          }
        }
      }
      if (G.stage === 3) makeOrcObsSprites(R, out);
    });
    if (G.stage === 4) for (const o of out) if (!o.raw) o.cv = ashify(o.cv);
    return out;
  }

  // --- 동적: 잠긴 문 · 금 간 벽 · 텔레포터 · 상자 · 상인 -----------------
  function drawRoomBack() {
    const R = G.dun.cur;
    const sa0 = G.sealAnim || 0;
    G.sealAnim = Math.min(1, (G.sealAnim || 0) + (G.sealed ? 1 : -1) * 0.08);
    if (!G.sealed && G.sealAnim < 0) G.sealAnim = 0;
    if (sa0 < 1 && G.sealAnim >= 1 && G.stage >= 2) { sfx('block'); addShake(2); for (const d of ['w', 'e']) if (R.doors[d] != null && !hiddenDoor(R, d)) { const q = doorIn(d, 2); dust(q.x, q.y, 10); for (let i = 0; i < 6; i++) G.parts.push({ x: q.x, y: q.y + rand(-4, 4), vx: rand(-60, 60), vy: rand(-80, -20), t: rand(0.2, 0.4), c: pick(['#ffd080', '#ffffff', '#ff9a40']), g: 300, glow: true }); } } // v2.21 문짝이 맞물리는 순간
    for (const d in DIRS) {
      const st = doorState(R, d); if (st === 'none') continue;
      if (st === 'crack') drawCrack(R, d);
      else if (G.stage >= 2 && (d === 'w' || d === 'e')) drawSideLeaves(d, st === 'boss' ? gateK() : G.sealAnim); // v2.21 좌우 문은 문짝이 여닫힘
      else if (st === 'boss') drawSeal(d, gateK());
      else if (G.sealAnim > 0) drawSeal(d, G.sealAnim);
      if (R.doors[d] != null && G.dun.rooms[R.doors[d]].type === 'boss' && st !== 'crack') drawBossSigil(d, st === 'boss');
    }
    if (R.tele && R.cleared) drawMagicCircle(R.tele);
    if (R.exit) drawExit(R.exit);
    drawAshClouds();
  }
  // v2.21 2~4장 좌우 문: 경첩 달린 두 짝 문 — 열려 있으면 통로 벽에 붙어 바깥을 향하고, 봉쇄되면 안쪽으로 닫혀 가운데서 맞물린다 (k: 0 열림 → 1 닫힘)
  const LEAF_PAL = { 4: { k: '#0b0a09', h: '#5a4232', l: '#3e2e22', d: '#241a12', b: '#3a3940', B: '#7c7a84' } /* v2.90 4장 탄 문짝 */, 2: { k: '#0b0a0e', h: '#7a5a3a', l: '#5a3e26', d: '#3e2a18', b: '#4a4656', B: '#8a8498' }, 3: { k: '#0b0806', h: '#9a6a40', l: '#7a5030', d: '#553620', b: '#3a2a1a', B: '#c8a070' } };
  function drawSideLeaves(d, k) {
    const p = DOOR[d], pal = LEAF_PAL[G.stage === 3 ? 3 : G.stage === 4 ? 4 : 2], e = k * k * (3 - 2 * k), out = d === 'w' ? Math.PI : 0, one = G.stage !== 3, L = one ? 19 : 10; // 2·4장은 외짝 문(21칸, 위 경첩) · 3장은 두 짝(11칸씩)
    for (const s of one ? [-1] : [-1, 1]) { // 위 짝(s=-1) · 아래 짝(s=1)
      const hx = p.x, hy = p.y + s * 18, closed = s < 0 ? Math.PI / 2 : -Math.PI / 2, a = out + (((closed - out + Math.PI * 3) % TAU) - Math.PI) * e;
      const ca = Math.cos(a), sa = Math.sin(a), cells = new Map();
      for (let i = 0; i < L; i++) for (let j = -1; j <= 2; j++) {
        const cx = Math.round((hx + ca * i * 2 - sa * j * 2) / 2), cy = Math.round((hy + sa * i * 2 + ca * j * 2) / 2);
        cells.set(cx + ',' + cy, i % 4 === 1 ? (j === -1 ? 'B' : 'b') : j === -1 ? 'h' : j === 2 ? 'd' : (i + j) % 5 === 0 ? 'd' : 'l');
      }
      ctx.fillStyle = pal.k;
      for (const key of cells.keys()) { const [x, y] = key.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!cells.has((x + dx) + ',' + (y + dy))) ctx.fillRect((x + dx) * 2, (y + dy) * 2, 2, 2); }
      for (const [key, c] of cells) { const [x, y] = key.split(',').map(Number); ctx.fillStyle = pal[c]; ctx.fillRect(x * 2, y * 2, 2, 2); }
      // 경첩 축: 문짝이 도는 쇠 기둥 (위에서 본 둥근 머리 + 아래로 보이는 몸통)
      const ax = (Math.round(hx / 2) - 2) * 2, ay = (Math.round(hy / 2) - 3) * 2;
      const AX = ['.kkk.', 'kWBbk', 'kBBbk', 'kbbdk', 'kbbdk', 'kbbdk', '.kkk.'], AP = { k: pal.k, W: '#e8e4f0', B: pal.B, b: pal.b, d: '#1a1820' };
      AX.forEach((r, yy) => { for (let xx = 0; xx < 5; xx++) { const c = AP[r[xx]]; if (c && r[xx] !== '.') { ctx.fillStyle = c; ctx.fillRect(ax + xx * 2, ay + yy * 2, 2, 2); } } });
    }
  }
  // 봉쇄: 성채는 쇠창살이 내려오고, 초원은 가시덤불이 자라난다 (k: 0→1)
  function drawSeal(d, k) {
    const p = DOOR[d], meadow = G.stage === 1, vert = d === 'n' || d === 's';
    const key = (meadow ? 'th' : 'bar' + G.stage) + d;
    const spr = art(key, () => withSeed(d.charCodeAt(0) * 99, () => meadow
      ? gCanvas(vert ? genThorns(22, d === 'n' ? 18 : 16, true) : genThorns(18, 24, false), THORN_PAL)
      : gCanvas(vert ? genBars(19, d === 'n' ? 28 : 16, true) : genBars(17, 21, false), G.stage === 3 ? WOOD_BAR : BAR_PAL)));
    const W0 = spr.width, H0 = spr.height;
    let x = vert ? p.x - W0 / 2 : d === 'w' ? p.x - W0 + 4 : p.x - 4, y = d === 'n' ? p.y - H0 + 2 : d === 's' ? p.y - 6 : p.y - H0 / 2;
    x = Math.round(x) & ~1; y = Math.round(y) & ~1;
    if (meadow) { // 문 가장자리에서 가운데로 자라난다
      const sw = Math.round(W0 * k / 2) & ~1, sh = Math.round(H0 * k / 2) & ~1;
      if (vert) { ctx.drawImage(spr, 0, 0, sw, H0, x, y, sw, H0); ctx.drawImage(spr, W0 - sw, 0, sw, H0, x + W0 - sw, y, sw, H0); }
      else { ctx.drawImage(spr, 0, 0, W0, sh, x, y, W0, sh); ctx.drawImage(spr, 0, H0 - sh, W0, sh, x, y + H0 - sh, W0, sh); }
    } else { // 위에서 떨어진다
      const sh = Math.round(H0 * k) & ~1;
      if (sh > 0) ctx.drawImage(spr, 0, H0 - sh, W0, sh, x, y, W0, sh);
    }
  }
  function drawBossSigil(d, locked) {
    const q = d === 'n' ? { x: DOOR.n.x, y: DOOR.n.y - 84 } : doorIn(d, -18);
    const spr = art('sigil', () => gCanvas(SIGIL, SIGIL_PAL)), glow = art('sigilG', () => gCanvas(SIGIL.map(r => r.map(c => c === 'K' || c === 'R' ? c : '.')), { K: '#ffb0b0', R: '#ff4050' }));
    const x = Math.round(q.x - spr.width / 2) & ~1, y = Math.round(q.y - spr.height / 2) & ~1;
    ctx.drawImage(spr, x, y);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = locked ? 0.25 + 0.25 * Math.sin(time * 3) : 0.7; ctx.drawImage(glow, x, y); ctx.restore();
    if (locked) { const t = `${SK().unit} ${sealPlaced()}/2`; ctx.font = '8px Galmuri7'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; fillTextW(t, q.x + 1, q.y + 19); ctx.fillStyle = '#ff8080'; fillTextW(t, q.x, q.y + 18); }
  }
  // ================================================================ v1.18 보스 문 봉인 기믹
  // 엘리트를 쓰러뜨리면 「봉인 열쇠」가 떨어진다. 주워서 보스 방 앞 받침 2곳에 바치면(F) 챕터마다 다른 연출로 문이 열린다.
  // 1장 황혼 초원: 정령의 불씨 → 화톳대에 초록 불 → 가시덤불이 타서 걷힘
  // 2장 무너진 성채: 기사단 인장 조각 → 문장 받침에 반쪽씩 → 방패가 맞물리면 쇠사슬이 끊기고 창살이 오름
  // 3장 핏빛 엄니 부락: 전사의 엄니 → 해골 토템에 걸면 눈이 붉게 타오름 → 뿔나팔·북소리와 함께 통나무 문이 올라감
  const SEAL = {
    1: { key: '정령의 불씨', unit: '불씨', sockN: '화톳대', act: '정령의 불씨 붙이기', need: '불씨가 없다 · 우두머리의 굴로 향해야 한다', c: '#c8f070', rgb: '190,240,110',
      intro: '두 우두머리가 쥔 정령의 불씨로 보스 방 앞 가시덤불을 태워야 한다', drop: '정령의 불씨를 얻었다 · 보스 방 앞 화톳대로',
      put: '화톳대에 초록 불이 붙었다', open: ['가시덤불이 재로 사그라졌다', '점액왕의 둥지로 가는 길이 열렸다'] },
    2: { key: '기사단 인장 조각', unit: '인장', sockN: '문장 받침', act: '인장 조각 끼우기', need: '인장 조각이 없다 · 처형장을 지나야 한다', c: '#ffd070', rgb: '255,205,110',
      intro: '두 처형장에 나뉜 기사단 인장을 맞춰야 문이 열린다', drop: '기사단 인장 조각을 거두었다 · 보스 방 앞 받침으로',
      put: '인장 조각이 받침에 끼워졌다', put2: '두 조각이 하나의 문장으로 맞물렸다', open: ['기사단의 인장이 제자리를 찾았다', '녹슨 쇠사슬이 끊어지며 창살이 오른다'] },
    3: { key: '전사의 엄니', unit: '엄니', sockN: '해골 토템', act: '엄니 바치기', need: '바칠 엄니가 없다 · 결투장을 거쳐야 한다', c: '#ff8a60', rgb: '255,110,70',
      intro: '결투장 두 곳의 엄니를 해골 토템에 바쳐야 한다', drop: '전사의 엄니를 거두었다 · 보스 방 앞 토템으로',
      put: '해골 토템의 빈 눈구멍에 불이 붙었다', open: ['토템이 피를 마셨다', '낮은 뿔나팔 소리와 함께 투기장 문이 오른다'] },
  };
  SEAL[4] = { key: '붉은 보석', unit: '보석', sockN: '보석 홈', act: '보석 끼우기', need: '끼울 보석이 없다 · 알현실로 향해야 한다', c: '#ff8090', rgb: '255,120,140',
    intro: '알현실 두 곳에서 붉은 보석을 거두어 보스 방 앞 홈에 끼워야 문이 열린다', drop: '붉은 보석을 거두었다 · 보스 방 앞 홈으로',
    put: '보석이 홈에 박혔다', open: ['왕이 눈을 떴다', '대관식의 문이 천천히 열린다'] }; // v2.55 왕관과 상관없이 돌기둥의 홈에 보석을 끼운다
  const SK = () => SEAL[G && G.stage] || SEAL[1];
  const SST = () => G.stage; // v2.55 4장은 문 양옆 돌기둥의 보석 홈 (성채 받침 그림을 빌리던 것 대체)
  const sealPlaced = () => (G.dun && G.dun.sock ? G.dun.sock.filter(Boolean).length : 0);
  // v2.51 보스 문 열쇠 패널 (미니맵 아래): 칸 2개 — 빈 칸(못 얻음) · 열쇠(가지고 있음) · 금 테두리(받침에 설치함)
  const SKEY_URL = {};
  function skeyURL() { const st = SST() in SKEY_ART ? SST() : 1; return SKEY_URL[st] || (SKEY_URL[st] = gCanvas(fromRows(SKEY_ART[st][0]), SKEY_PAL[st]).toDataURL()); }
  function updateBossKeys() {
    const el = $('bkPanel'); if (!el) return; const D = G && G.dun, R = D && D.cur;
    const show = !!(D && !D.forge && !D.home && !D.bossOpen && R && R.type !== 'boss' && mode !== 'map' && mode !== 'wmap' && $('phase').style.display !== 'none');
    if (!show) { if (el.style.display !== 'none') el.style.display = 'none'; hudPrev.bk = ''; return; }
    const put = sealPlaced(), held = D.keys || 0, pe = $('party'), top = pe ? pe.offsetTop + pe.offsetHeight + 6 : 160, // v2.53 왼쪽 캐릭터·빛 패널 바로 아래
       key = `${G.stage}|${put}|${held}|${top}`;
    if (el.style.display === 'none') el.style.display = '';
    if (key === hudPrev.bk) return; hudPrev.bk = key; el.style.top = top + 'px';
    const u = skeyURL(), K = SK(); el.dataset.name = K.key; el.dataset.tip = `${K.key} 2개를 보스 문 앞 ${K.sockN}에 바치면 보스 방이 열립니다. 정예 몬스터가 지키는 방에서 얻을 수 있습니다.`;
    const mir = SST() === 2; // 인장 조각은 오른쪽 칸을 뒤집어 좌우 대칭
    el.innerHTML = `<span class="lb">${K.key}</span>` + [0, 1].map(i => { const st = i < put ? 'put' : i < put + held ? 'on' : 'off'; return `<span class="kslot ${st}${mir ? (i === 1 ? ' mir' : ' mirL') : ''}">${st === 'off' ? '' : `<img src="${u}" alt="">`}</span>`; }).join(''); // 못 얻은 칸은 비워 둠
  }
  function sealHud() { const D = G.dun; if (!D || D.forge || D.home) return ''; const K = SK(); return D.bossOpen ? '보스 방 열림' : `${K.unit} ${sealPlaced()}/2${D.keys ? ` (+${D.keys})` : ''}`; }
  // 보스 문 양옆 받침 2곳: 문이 난 벽에 붙여 세운다 (몸이 걸리지 않는 장식 — 바닥 장애물과 별개)
  function sealSocks(R) {
    const D = G.dun; if (!D || D.forge || D.home || !R.doors) return null;
    const d = Object.keys(R.doors).find(k => R.doors[k] != null && D.rooms[R.doors[k]] && D.rooms[R.doors[k]].type === 'boss'); if (!d) return null;
    const p = DOOR[d];
    if (SST() === 2) { const q = d === 'n' ? { x: p.x + 60, y: A.y0 + 26 } : d === 's' ? { x: p.x + 60, y: A.y1 - 8 } : { x: d === 'w' ? A.x0 + 24 : A.x1 - 24, y: p.y + 66 }; return [Object.assign(q, { i: 0, d, dual: true })]; } // v1.21 성채는 받침 하나에 인장 두 조각을 맞춘다
    return [-1, 1].map((s, i) => d === 'n' ? { x: p.x + s * 60, y: A.y0 + 26, i, d } : d === 's' ? { x: p.x + s * 60, y: A.y1 - 8, i, d }
      : { x: d === 'w' ? A.x0 + 24 : A.x1 - 24, y: p.y + s * 50 + 16, i, d });
  }
  const SOCK_H = { 1: 30, 2: 38, 3: 44, 4: 36 };
  // 받침 그림 (2px 칸)
  const SOCK_PAL = {
    1: { k: '#0b0a0e', H: '#9a9488', h: '#6a6474', l: '#4a4554', d: '#2d2935', D: '#1c1922', a: '#2a2622', A: '#4a423a', m: '#4a6a2a', M: '#6a8a3a' },
    2: { k: '#0b0a0e', H: '#8a8496', h: '#5e5868', l: '#423d4c', d: '#2d2935', D: '#1c1922', s: '#7a7488', S: '#141218', G: '#e0b040', g: '#8a6420', R: '#a01828', r: '#6a0c18', W: '#f0e8d0', c: '#3a3442' },
    3: { k: '#0b0806', W: '#e0d6c4', w: '#a49a84', b: '#c8bca0', B: '#8a7e66', t: '#6b4a2a', T: '#3a2416', r: '#a01820', e: '#1a0c08', E: '#ff4020', u: '#f0e6c8', U: '#b8a880', f: '#2e1d12' },
    4: { k: '#0b0a0e', H: '#8a8496', h: '#5e5868', l: '#423d4c', d: '#2d2935', D: '#1c1922', e: '#16131a', E: '#0b0a0e', a: '#9a948c', R: '#c02838', r: '#6a0c18', W: '#ffd0d8' },
  };
  const SOCK_ART = {
    1: ['.kk......kk.', '.kHk....kHk.', 'kHhkkkkkkhHk', 'khaAaaAaaAhk', 'kHhhhhhhhhHk', '.kllllllldk.', '..kldddddk..', '...kkddkk...', '....khdk....', '....kmdk....', '....khdk....', '...kkhdkk...', '..khMmhddk..', '.kHhhhhhddk.', '.kkkkkkkkkk.'],
    2: ['..kkkkkkkk..', '.kssssssssk.', '.ksSSSSSSsk.', '.ksSSSSSSsk.', '.ksSSSSSSsk.', '..ksSSSSsk..', '...ksSSsk...', '....kssk....', '.kkkkkkkkkk.', 'kHhhhhhhhhHk', '.kllllllldk.', '.khlllllldk.', '.khlccccldk.', '.khllllldDk.', '.khllllldDk.', '.khllllldDk.', 'kkhhhhhhhdkk', 'kHhhhhhhhhHk', 'kkkkkkkkkkkk'],
    3: ['.k........k.', 'kWk......kWk', 'kWWk....kWWk', '.kWWkkkkWWk.', '..kbbbbbbk..', '..kbBbbBbk..', '..kbebbebk..', '..kbbbbbbk..', '..kbWbbWbk..', '...kWkkWk...', '....kttk....', '...kttTtk...', '...ktrrTk...', '...kttTtk...', '...ktTTtk...', '...kttTtk...', '...ktrrTk...', '...kttTtk...', '...kttTtk...', '..kkttTtkk..', '.kfttttTTfk.', '.kkkkkkkkkk.'],
    4: ['..kkkkkkkk..', '.kHHaHHHaHk.', 'kHhhhhhhhhHk', 'kkkkkkkkkkkk', '.khhhhhhhdk.', '.khhhkkhhdk.', '.khhkeekhdk.', '.khkeEEekdk.', '.khkeEEekdk.', '.khhkeekhdk.', '.khhhkkhhdk.', '.khhhhhhhdk.', '.khlllllldk.', '.khllllldDk.', '.khllllldDk.', 'kkhhhhhhhdkk', 'kHhhhhhhhhHk', 'kkkkkkkkkkkk'], // v2.55 돌기둥 앞면의 마름모 홈
  };
  function sockArt(st, i, on) {
    const g = fromRows(SOCK_ART[st]);
    if (st === 2 && on) { // 인장 받침 하나: on 비트 1 = 왼쪽 반, 2 = 오른쪽 반 → 둘 다면 온전한 방패
      for (let y = 1; y <= 7; y++) for (let x = 0; x < g[y].length; x++) {
        const c = g[y][x]; if (c !== 's' && c !== 'S') continue;
        if (x <= 5 ? !(on & 1) : !(on & 2)) continue;
        g[y][x] = c === 's' ? 'G' : (x === 5 || x === 6) && y >= 2 && y <= 6 || y === 3 && x >= 3 && x <= 8 ? 'W' : (x + y) % 3 ? 'R' : 'r';
      }
      if (on !== 3) for (let y = 1; y <= 7; y++) { const x = on === 1 ? 5 : 6; if (g[y][x] === 'G' && y > 1) g[y][x] = 'g'; } // 반쪽일 때 금 간 단면
    }
    if (st === 3) {
      if (on) { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) if (g[y][x] === 'e') g[y][x] = 'E';
        // 끈에 매단 엄니 (문 반대쪽으로 늘어뜨림)
        const T = [[9, 10, 'f'], [9, 11, 'k'], [10, 11, 'f'], [10, 12, 'k'], [11, 12, 'k'], [10, 13, 'u'], [11, 13, 'k'], [10, 14, 'u'], [11, 14, 'U'], [12, 14, 'k'], [11, 15, 'u'], [12, 15, 'k'], [11, 16, 'U'], [12, 16, 'k'], [11, 17, 'r'], [12, 17, 'k'], [11, 18, 'k']];
        for (const r of g) if (i === 0) r.unshift('.', '.'); else r.push('.', '.');
        for (const [x, y, c] of T) g[y][i === 0 ? 13 - x : x] = c;
      }
    }
    if (st === 4 && on) { let first = true; for (const r of g) for (let x = 0; x < r.length; x++) { if (r[x] === 'e') r[x] = 'r'; else if (r[x] === 'E') { r[x] = first ? 'W' : 'R'; first = false; } } } // 홈에 박힌 붉은 보석
    return gCanvas(g, SOCK_PAL[st]);
  }
  // 초록 정령불 (칸 단위로 흔들림)
  function spiritFlame(x, y, big) {
    const n = big ? 7 : 5, base = big ? 14 : 8;
    for (let i = 0; i < n; i++) { const c = i - (n - 1) / 2, ph = Math.sin(time * 12 + i * 2.1 + x), h = (base + (ph + 1) * 4 - Math.abs(c) * 3) | 0, fx = (x - n + i * 2) & ~1;
      if (h <= 0) continue;
      ctx.fillStyle = '#2a7a3a'; ctx.fillRect(fx, y - (h & ~1), 2, h & ~1);
      if (Math.abs(c) < n / 2 - 1) { ctx.fillStyle = '#7ad040'; ctx.fillRect(fx, y - ((h * 0.72) & ~1), 2, (h * 0.72) & ~1); }
      if (Math.abs(c) < 1.5) { ctx.fillStyle = '#eaffb8'; ctx.fillRect(fx, y - ((h * 0.4) & ~1), 2, (h * 0.4) & ~1); } }
  }
  function drawSock(s) {
    const D = G.dun, st = SST() in SOCK_ART ? SST() : 1, mask = s.dual ? (D.sock[0] ? 1 : 0) | (D.sock[1] ? 2 : 0) : D.sock[s.i] ? 1 : 0, on = mask > 0, full = s.dual ? mask === 3 : on;
    const spr = art(`sock${st}${s.i}${mask}`, () => sockArt(st, s.i, st === 2 ? mask : on));
    const bx = Math.round(s.x) & ~1, by = Math.round(s.y) & ~1, x = (bx - spr.width / 2) & ~1, y = by - spr.height;
    dshRect(ctx, x + 4, by - 2, spr.width - 8, 4, 0.5);
    ctx.drawImage(spr, x, y);
    const pt = s.putT != null ? time - s.putT : 9;
    if (st === 1 && on) { spiritFlame(bx, y + 6, D.gate || pt < 0.6); if (Math.random() < 0.15) G.parts.push({ x: bx + rand(-4, 4), y: y - 4, vx: rand(-6, 6), vy: -rand(25, 45), t: rand(0.4, 0.8), c: pick(['#c8f070', '#7ad040', '#eaffb8']), g: 0, glow: true }); }
    if (st === 3 && on && Math.floor(time * 8 + s.i * 3) % 3 === 0) { const ex = x + (s.i === 0 ? 4 : 0); ctx.fillStyle = '#ffc080'; ctx.fillRect(ex + 8, y + 12, 2, 2); ctx.fillRect(ex + 14, y + 12, 2, 2); }
    if (st === 3 && on && Math.random() < 0.08) { const ex = x + (s.i === 0 ? 4 : 0); G.parts.push({ x: ex + 8 + rand(0, 6), y: y + 12, vx: rand(-4, 4), vy: -rand(10, 25), t: rand(0.3, 0.6), c: pick(['#ff4020', '#ff8040']), g: 0, glow: true }); }
    if (st === 4 && on && Math.floor(time * 3 + s.i * 1.5) % 4 === 0) { ctx.fillStyle = '#fff0f4'; ctx.fillRect(x + 10, y + 12, 2, 2); } // 보석 반짝임
    if (st === 2 && on && Math.floor(time * 3 + s.i * 1.5) % 4 === 0) { ctx.fillStyle = '#fff6d0'; ctx.fillRect(x + (s.i === 0 ? 8 : 14), y + 4, 2, 2); }
    if (pt < 0.35) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - pt / 0.35; ctx.drawImage(art(`sockW${st}${s.i}`, () => { const c = sockArt(st, s.i, st === 2 ? (s.dual ? 3 : 1) : true), [o, ox] = mkCanvas(c.width, c.height); ox.drawImage(c, 0, 0); ox.globalCompositeOperation = 'source-in'; ox.fillStyle = '#fff'; ox.fillRect(0, 0, c.width, c.height); return o; }), x, y); ctx.restore(); }
    // 열쇠를 들고 있으면 빈 받침 위에서 깜빡이는 화살표
    if (!full && D.keys > 0 && !D.gate && Math.floor(time * 3) % 2 === 0) { const ay = y - 8 + (Math.floor(time * 3) % 4 === 0 ? 2 : 0), K = SK(); ctx.fillStyle = '#000'; ctx.fillRect(bx - 4, ay - 2, 8, 2); ctx.fillRect(bx - 2, ay, 4, 2); ctx.fillStyle = K.c; ctx.fillRect(bx - 4, ay - 4, 8, 2); ctx.fillRect(bx - 2, ay - 2, 4, 2); }
  }
  // 떨어진 봉인 열쇠 (불씨·인장 조각·엄니) + 위로 오르는 빛
  const SKEY_ART = {
    1: [['...k..', '..kyk.', '.kyYk.', '.kYWyk', 'kyWWYk', 'kYWWYk', '.kYYk.', '..kk..'], ['..k...', '.kyk..', '.kYyk.', 'kyWYk.', 'kYWWyk', 'kYWWYk', '.kYYk.', '..kk..']],
    2: [['kkkk...', 'kGGGk..', 'kGRRWk.', 'kGRWWWk', 'kGRRWk.', '.kGRgk.', '..kGgk.', '...kk..']],
    3: [['....kk.', '...kWk.', '..kWWk.', '..kWwk.', '.kWwk..', '.kWwk..', 'kWwk...', 'krrk...', '.kk....']],
    4: [['..kk..', '.kRWk.', 'kRRWRk', 'krRRRk', '.krrk.', '..kk..'], ['..kk..', '.kRRk.', 'kRRRWk', 'krRRRk', '.krrk.', '..kk..']],
  };
  const SKEY_PAL = { 4: { k: '#0b0a0e', R: '#c02838', r: '#6a0c18', W: '#ffd0d8' }, 1: { k: '#0c1406', y: '#5a9a2a', Y: '#a8e050', W: '#f0ffc0' }, 2: { k: '#0b0a0e', G: '#e0b040', g: '#8a6420', R: '#a01828', W: '#f0e8d0' }, 3: { k: '#0b0806', W: '#f0e6c8', w: '#b8a880', r: '#a01820' } };
  function drawSealKey(l, x, y) {
    const st = SST() in SKEY_ART ? SST() : 1, fr = SKEY_ART[st], f = Math.floor(time * 6) % fr.length;
    const spr = art(`skey${st}${f}`, () => gCanvas(fromRows(fr[f]), SKEY_PAL[st])), K = SK();
    const bx = Math.round(x) & ~1, by = Math.round(l.y) & ~1, h = 70 * Math.min(1, l.t * 2), pulse = 0.75 + Math.sin(time * 5) * 0.25;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let yy = 16; yy < h; yy += 2) { const k = yy / h; for (let c = -2; c < 2; c++) { const edge = c === -2 || c === 1; if (!dith((bx >> 1) + c, (by - yy) >> 1, (1 - k) * (edge ? 0.4 : 0.85) * pulse)) continue; ctx.fillStyle = `rgba(${K.rgb},${(edge ? 0.45 : 0.8) * (1 - k * 0.6)})`; ctx.fillRect(bx + c * 2, by - yy, 2, 2); } }
    ctx.restore();
    ctx.drawImage(spr, (bx - spr.width / 2) & ~1, (Math.round(y) & ~1) - spr.height + 2);
  }
  function placeSeal(s) {
    const D = G.dun, K = SK(), idx = s.dual ? D.sock.indexOf(false) : s.i; if (D.keys <= 0 || idx < 0 || D.sock[idx]) return;
    D.keys--; D.sock[idx] = true; s.putT = time;
    const top = s.y - SOCK_H[SST()] + 6, n = sealPlaced();
    G.fx.push({ kind: 'ring', x: s.x, y: top, r: 6, grow: 120, t: 0.4, max: 0.4, c: K.c }); burst(s.x, top, K.c, 14);
    if (SST() === 1) { sfx('fireball'); sfx('ready'); }
    else if (SST() === 2) { sfx('block'); sfx('heavy'); debris(s.x, top, 6); }
    else if (SST() === 4) { sfx('coin'); sfx('block', 1.3); for (let i = 0; i < 8; i++) G.parts.push({ x: s.x + rand(-4, 4), y: top + 14, vx: rand(-20, 20), vy: -rand(20, 50), t: rand(0.3, 0.6), c: pick(['#ff8090', '#ffd0d8', '#c02838']), g: 0, glow: true }); }
    else { sfx('hit'); sfx('growl', 0.7); for (let i = 0; i < 6; i++) G.parts.push({ x: s.x + rand(-4, 4), y: top + 10, vx: rand(-10, 10), vy: rand(10, 40), t: rand(0.3, 0.6), c: '#a01820', g: 200 }); }
    if (n >= 2) { D.gate = { t: 0, fired: {} }; banner(K.put2 || K.put, '봉인의 기운이 흔들린다'); }
    else { banner(K.put, `하나 더 바치면 길이 열린다 (${n}/2)`); }
  }
  // 문이 열리는 동안 봉쇄 그림의 남은 비율 (1 → 0)
  function gateK() { const g = G.dun && G.dun.gate; return g ? clamp(1 - (g.t - 0.8) / 1.0, 0, 1) : 1; }
  function updateGate(dt) {
    const D = G.dun, g = D && D.gate; if (!g) return;
    g.t += dt; const R = D.cur, S = R && R.socks, st = SST(), once = (k, at, fn) => { if (g.t >= at && !g.fired[k]) { g.fired[k] = 1; fn(); } };
    if (S) {
      const d = S[0].d, q = doorIn(d, 2), along = d === 'n' || d === 's' ? [1, 0] : [0, 1];
      const onDoor = (c, vy = -30) => { const o = rand(-22, 22); G.parts.push({ x: q.x + along[0] * o + rand(-4, 4), y: q.y + along[1] * o - rand(0, 10), vx: rand(-10, 10), vy: vy * rand(0.6, 1.3), t: rand(0.4, 0.8), c, g: vy > 0 ? 300 : 0, glow: vy < 0 }); };
      if (st === 1) { // 화톳대에서 덤불로 초록 불길이 번진다
        if (g.t < 0.8) for (const s of S) if (Math.random() < 0.6) { const k = g.t / 0.8, sx = s.x + (q.x - s.x) * k, sy = s.y - 24 + (q.y - s.y + 24) * k; G.parts.push({ x: sx + rand(-3, 3), y: sy + rand(-3, 3), vx: 0, vy: -20, t: 0.35, c: pick(['#c8f070', '#7ad040']), g: 0, glow: true }); }
        if (g.t > 0.6 && g.t < 1.9) for (let i = 0; i < 3; i++) onDoor(pick(['#c8f070', '#7ad040', '#ffb040', '#ff7020', '#eaffb8']), -50);
        once('ign', 0.7, () => { sfx('fireball'); sfx('blast', 1.4); });
      } else if (st === 2) { // 쇠사슬이 끊기고 창살이 오른다
        once('c1', 0.2, () => { sfx('block', 0.8); onDoor('#a49cb0', 40); }); once('c2', 0.45, () => { sfx('block', 0.7); }); once('c3', 0.7, () => { sfx('heavy'); sfx('crunch'); for (let i = 0; i < 10; i++) onDoor(pick(['#7a7488', '#a49cb0', '#ffe0a0']), 60); });
        if (g.t > 0.8 && g.t < 1.8 && Math.random() < 0.5) onDoor('#4a4656', 30);
      } else if (st === 4) { // 두 홈의 보석에서 붉은 빛이 문으로 흘러 들어가고, 무거운 문이 열린다
        if (g.t < 0.8) for (const s of S) if (Math.random() < 0.6) { const k = g.t / 0.8, sx = s.x + (q.x - s.x) * k, sy = s.y - 22 + (q.y - s.y + 22) * k; G.parts.push({ x: sx + rand(-3, 3), y: sy + rand(-3, 3), vx: 0, vy: -10, t: 0.35, c: pick(['#ff8090', '#c02838']), g: 0, glow: true }); }
        once('h1', 0.1, () => sfx('coin', 0.7)); once('h2', 0.8, () => { sfx('heavy'); sfx('crunch'); });
        if (g.t > 0.8 && g.t < 1.8 && Math.random() < 0.5) onDoor('#8a8496', 30);
      } else { // 뿔나팔 · 북 세 번 · 통나무 문이 끌려 올라간다
        once('horn', 0.05, () => sfx('roar', 0.8)); once('b1', 0.6, () => sfx('beat')); once('b2', 0.9, () => sfx('beat')); once('b3', 1.2, () => { sfx('beat'); sfx('heavy'); });
        if (g.t > 0.8 && g.t < 1.8 && Math.random() < 0.5) dust(q.x + rand(-16, 16), q.y, 2);
      }
    }
    if (g.t >= 2) { D.gate = null; D.bossOpen = true; const K = SK(); banner(K.open[0], K.open[1]); sfx('grogi'); flashT = 0.08; flashColor = st === 1 ? '#d0ffa0' : st === 2 ? '#fff0c0' : '#ffb090'; if (S) { const q = doorIn(S[0].d, 6); dust(q.x, q.y, 14); } }
  }
  // 금 간 벽: 성채는 벽면의 갈라짐, 초원은 숲길을 막은 바위 더미 (맞을수록 금이 늘어난다)
  function drawCrack(R, d) {
    const c = crackPoint(R), stage = 3 - Math.max(0, R.crack.hp);
    const spr = art(`crack${G.stage}${d}${stage}`, () => withSeed(77 + stage, () => {
      if (G.stage === 1) {
        const [cv, cx] = mkCanvas(60, 40);
        stamp(cx, DECO_MAPS.rockBig, DECO, 2, 10, 2); stamp(cx, DECO_MAPS.rockBig, DECO, 26, 12, 2, true); stamp(cx, DECO_MAPS.rockA, DECO, 18, 0, 2);
        const g = mkGrid(30, 20); let x = 14, y = 4; for (let i = 0; i < 6 + stage * 4; i++) { g[y][x] = 'k'; x = clamp(x + randi(-1, 1), 2, 27); y = clamp(y + (Math.random() < 0.6 ? 1 : 0), 2, 18); }
        gPaint(cx, g, { k: '#121214' }, 0, 0);
        return cv;
      }
      const g = mkGrid(22, 18);
      for (let s = 0; s < 3 + stage * 2; s++) { let x = 11 + randi(-2, 2), y = 8 + randi(-2, 2); for (let i = 0; i < 4 + stage * 2; i++) { g[y][x] = 'K'; if (Math.random() < 0.4 && g[y][x + 1] === '.') g[y][x + 1] = 'D'; x = clamp(x + randi(-1, 1), 0, 21); y = clamp(y + randi(-1, 1), 0, 17); } }
      for (let i = 0; i < 3 + stage * 2; i++) { const x = randi(5, 16), y = randi(14, 17); g[y][x] = pick(['l', 'd', 'h']); }
      return gCanvas(g, G.stage === 3 ? WOODPAL : STONE);
    }));
    let x = c.x - spr.width / 2, y = d === 'n' ? c.y - spr.height + 4 : c.y - spr.height / 2;
    if (G.stage === 1 && d === 'w') x = c.x - spr.width + 16; if (G.stage === 1 && d === 'e') x = c.x - 16;
    ctx.drawImage(spr, Math.round(x) & ~1, Math.round(y) & ~1);
  }
  function drawChest(c) {
    const sec = c.kind === 'secret', boss = c.kind === 'boss', key = (c.opened ? 'chO' : 'chC') + (sec ? 's' : boss ? 'b' : '');
    const spr = art(key, () => gCanvas(c.opened ? CHEST_O : CHEST_C, sec ? CHEST_PAL_S : boss ? CHEST_PAL_B : CHEST_PAL));
    if (boss && !c.opened && !c.fall) { const bx = Math.round(c.x) & ~1, by = Math.round(c.y) & ~1; ctx.save(); ctx.globalCompositeOperation = 'lighter'; // 바닥 금빛 고리 + 위로 오르는 불티
      for (let i = 0; i < 14; i++) { const a = i * TAU / 14 + time * 0.6; ctx.fillStyle = `rgba(255,${190 + (i % 2) * 40},90,${0.55 + 0.3 * Math.sin(time * 4 + i)})`; ctx.fillRect(Math.round(bx + Math.cos(a) * 20) & ~1, Math.round(by + 2 + Math.sin(a) * 7) & ~1, 2, 2); }
      for (let i = 0; i < 5; i++) { const k = (time * 0.7 + i / 5) % 1; ctx.fillStyle = `rgba(255,210,110,${0.8 * (1 - k)})`; ctx.fillRect(Math.round(bx - 12 + i * 6 + Math.sin(time * 3 + i) * 2) & ~1, Math.round(by - 14 - k * 40) & ~1, 2, 2); }
      ctx.restore(); }
    const bob = !c.opened && Math.floor(time * 2) % 2 ? 2 : 0, x = Math.round(c.x - spr.width / 2) & ~1, y = Math.round(c.y - spr.height + 2 - (c.lift || 0)) & ~1;
    { const xa = x + 2, xb = x + spr.width - 2; if (xb > xa) dshRect(ctx, xa, y + spr.height + (c.kind === 'boss' ? c.lift || 0 : 0), Math.ceil((xb - xa) / 2) * 2, 2, 0.5); } // 떨어지는 보스 상자는 그림자가 바닥에 남는다
    ctx.drawImage(spr, x, y - bob);
    if (!c.opened && Math.floor(time * 6) % 7 === 0) { ctx.fillStyle = sec ? '#f0e0ff' : '#fff0b0'; ctx.fillRect((x + 6 + Math.floor(time * 6) % 14 * 1) & ~1, y + 4 - bob, 2, 2); }
  }
  // ================================================================ 특별한 방 (v0.76): 상인의 노점 · 보물 제단 · 야영지
  // 공통: 2px 칸 · 검은 외곽선 · 왼쪽 위 빛. 그리드에 칠한 뒤 gOutline → gCanvas
  const SP_PAL = { k: '#140c08', R: '#b8342c', r: '#7e2220', C: '#efe2c4', c: '#bba886', S: '#1c130d', w: '#7a5232', W: '#a0703f', b: '#4a3020', B: '#2e1d12',
    y: '#ffd34d', Y: '#c9952a', Z: '#fff4b8', P: '#5a2a6a', p: '#3a1a48', g: '#8a8478', G: '#b4ada0', d: '#4e4a44', D: '#2e2b28',
    '1': '#e0303a', '2': '#4f8dff', '3': '#7ac843', '4': '#e8e0d0', '5': '#c07a3a', '6': '#b05cff', f: '#ff8a2a', F: '#ffe28a', e: '#e2501c', n: '#6a2a1a', N: '#9a3a22' };
  const spGrid = (w, h, fn) => { const g = mkGrid(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); if (c) g[y][x] = c; } return g; };
  const spCv = (key, w, h, fn) => art('sp_' + key, () => gCanvas(gOutline(spGrid(w, h, fn)), SP_PAL));
  // 소품 등록 도우미 (3장 부락 소품이 씀)
  function spProp(name, w, h, fn, opt, pal) { if (PROP_MAPS[name]) return; const g = gOutline(spGrid(w, h, fn)); PROP_MAPS[name] = [g.map(r => r.join('')), pal || SP_PAL]; PROPS[name] = Object.assign({ foot: 1 }, opt || {}); }
  // --- 상인의 노점: 줄무늬 차양 · 기둥 · 물건이 놓인 뒷선반 · 동전 간판 / 앞 계산대(보라 천)
  const STALL_W = 84;
  // --- 보물 제단: 금 상감 원형 단 · 금화 더미 · 금 화로 4개 · 위에서 내리는 금빛 기둥
  const GOLDPILE = (v) => spCv('gold' + v, 24, 12, (x, y) => { const e = Math.hypot((x - 11.5) / 12, (y - 11) / (10 + v)); if (e > 1) return null; const h = (x * 7 + y * 13 + v * 5) % 11; return h === 0 ? 'Z' : h === 3 && y > 6 ? (v ? '1' : '2') : h < 4 ? 'y' : (x + y) % 3 ? 'Y' : 'y'; });
  const GOLDBRAZIER = () => spCv('gbraz', 10, 16, (x, y) => { if (y < 4) return Math.abs(x - 4.5) < 4 - y * 0.3 ? (y < 2 ? 'F' : 'f') : null; if (y < 7) return x >= 1 && x <= 8 ? (y === 4 ? 'Z' : 'y') : null; if (y < 14) return x >= 3 && x <= 6 ? (x === 3 ? 'y' : 'Y') : null; return x >= 1 && x <= 8 ? 'Y' : null; });
  function paintTreasureFloor(g, R) {
    const c = R.chest; if (!c) return; const cx = c.x, cy = c.y + 4, st = G.stage;
    if (st === 1) { // 잊힌 성소: 이끼 낀 돌 원판과 들꽃
      for (let y = -40; y <= 40; y += 2) for (let x = -76; x <= 76; x += 2) { const e = Math.hypot(x / 76, y / 40); if (e > 1) continue; const edge = !(Math.hypot((x - 2) / 76, y / 40) <= 1 && Math.hypot((x + 2) / 76, y / 40) <= 1 && Math.hypot(x / 76, (y - 2) / 40) <= 1 && Math.hypot(x / 76, (y + 2) / 40) <= 1); const stone = ((Math.floor((x + 80) / 14) + Math.floor((y + 40) / 10)) % 2), seam = (x + 80) % 14 < 2 || (y + 40) % 10 < 2, moss = Math.sin(x * 0.2 + y * 0.31) > 0.55;
        g.fillStyle = edge ? '#2a2e26' : seam ? '#2e3328' : moss ? (stone ? '#4a6a34' : '#3e5a2c') : stone ? '#6a6a62' : '#5a5a52'; g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2); }
      for (let i = 0; i < 60; i++) { const a = rand(0, TAU), r = rand(76, 150); g.fillStyle = pick(['#e8e0c0', '#e0c040', '#b080e0', '#e07090']); g.fillRect((cx + Math.cos(a) * r) & ~1, (cy + Math.sin(a) * r * 0.5) & ~1, 2, 2); }
      return;
    }
    if (st === 3) { // 약탈품 더미: 짓밟힌 흙·핏자국·흩어진 금화
      for (let y = -46; y <= 46; y += 2) for (let x = -96; x <= 96; x += 2) { const e = Math.hypot(x / 96, y / 46); if (e > 1 || !dith((x + 200) >> 1, (y + 200) >> 1, 1 - e * 0.8)) continue; g.fillStyle = Math.sin(x * 0.13) * Math.cos(y * 0.2) > 0.6 ? '#4a0c0c' : e < 0.5 ? '#2a1a10' : '#3a2416'; g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2); }
      for (let i = 0; i < 70; i++) { const a = rand(0, TAU), r = rand(10, 110); g.fillStyle = pick(['#ffd34d', '#c9952a', '#fff4b8', '#a8aeb6']); g.fillRect((cx + Math.cos(a) * r) & ~1, (cy + Math.sin(a) * r * 0.5) & ~1, 2, 2); }
      return;
    }
    const RX = 66, RY = 34; // 성채 보물고: 금 상감 원형 단
    for (let y = -RY - 4; y <= RY + 4; y += 2) for (let x = -RX - 6; x <= RX + 6; x += 2) {
      const e = Math.hypot(x / RX, y / RY), E = (u, v) => Math.hypot(u / RX, v / RY); if (e > 1.06) continue;
      if (e > 1 && !(E(x - 2, y) <= 1 || E(x + 2, y) <= 1 || E(x, y - 2) <= 1 || E(x, y + 2) <= 1)) continue; // v2.80 바깥 테두리는 1칸만
      const a = Math.atan2(y / RY, x / RX), ray = Math.abs(Math.sin(a * 6)) < 0.12 && e > 0.3 && e < 0.88;
      g.fillStyle = e > 1 ? '#140c08' : e > 0.92 ? '#c9952a' : e > 0.86 ? '#6a5a3a' : ray ? '#c9952a' : e < 0.28 ? (e > 0.22 ? '#ffd34d' : '#5a4a32') : ((x >> 1) + (y >> 1)) % 2 ? '#4a4038' : '#3e352e';
      g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2);
    }
    for (let i = 0; i < 40; i++) { const a = rand(0, TAU), r = rand(70, 120); g.fillStyle = pick(['#ffd34d', '#c9952a', '#fff4b8']); g.fillRect((cx + Math.cos(a) * r) & ~1, (cy + Math.sin(a) * r * 0.55) & ~1, 2, 2); }
  }

  const PEDESTAL = () => spCv('pedestal', 28, 13, (x, y) => { if (y < 5) return Math.abs(x - 13.5) <= 13 - (y === 0 ? 1 : 0) ? (y === 4 ? 'y' : y === 0 ? 'G' : (x + y) % 5 ? 'g' : 'G') : null; if (x < 1 || x > 26) return null; return y === 12 ? 'Y' : (x - 1) % 6 === 0 ? 'D' : y === 7 && x % 3 === 0 ? 'Y' : y > 9 ? 'D' : 'd'; });
  function drawTreasure(R) { // 받침대 (금화 더미·화로 등은 소품으로 배치)
    const c = R.chest, pd = PEDESTAL(); ctx.drawImage(pd, (c.x - pd.width / 2) & ~1, (c.y + 6 - pd.height) & ~1); c.lift = 12;
  }

  function drawTreasureBeam(R) { // 열지 않은 상자 위로 내리는 금빛 기둥 + 떠다니는 금가루
    const c = R && R.chest; if (!c || c.opened || R.type !== 'reward') return;
    const H0 = 150, pulse = 0.75 + 0.25 * Math.sin(time * 2.5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const L = pxLayer((Math.round(c.x) - 34) & ~1, (Math.round(c.y - 36) - H0 - 2) & ~1, 72, H0 + 6, true); // v1.17 한 장으로
    for (let y = 0; y < H0; y += 2) { const k = y / H0, hw = Math.round((10 + 18 * k) / 2) * 2; for (let x = -hw; x < hw; x += 2) { const ed = Math.abs(x) / hw; if (!dith((x + 64) >> 1, (y + Math.floor(time * 8)) >> 1, (1 - k * 0.6) * (1 - ed) * 0.55 * pulse)) continue; if (ed < 0.4) L.rect((Math.round(c.x) + x) & ~1, (Math.round(c.y - 36) - (H0 - y)) & ~1, 2, 2, 255, 240, 190, 0.5); else L.rect((Math.round(c.x) + x) & ~1, (Math.round(c.y - 36) - (H0 - y)) & ~1, 2, 2, 255, 200, 90, 0.35); } }
    L.flush(); ctx.restore();
    if (Math.random() < 0.5) G.parts.push({ x: c.x + rand(-20, 20), y: c.y - rand(10, 120), vx: rand(-5, 5), vy: rand(8, 20), t: rand(0.8, 1.4), c: pick(['#ffd34d', '#fff4b8']), g: 0, glow: true });
  }
  // --- 야영지: 큰 모닥불(돌 둘레·장작·삼발이 냄비) · 천막 · 통나무 의자 · 침낭 · 장작더미
  const TENT = () => spCv('camptent', 36, 26, (x, y) => { const h = 24 - Math.abs(x - 17.5) * 1.35; if (y < 25 - h - 1 || y > 24) return x === 17 && y < 25 - h - 1 && y > 25 - h - 4 ? 'b' : null; const door = Math.abs(x - 17.5) < (y - 6) * 0.38 && y > 8; if (door) return y > 20 ? 'S' : 'B'; return x < 17 ? (x % 6 === 0 ? 'c' : 'C') : (x % 6 === 0 ? 'Y' : 'c'); });
  const LOGSEAT = () => spCv('logseat', 28, 8, (x, y) => (x <= 2 || x >= 25) ? (Math.hypot(x <= 2 ? x - 2 : x - 25, y - 3.5) < 3.4 ? (Math.hypot(x <= 2 ? x - 2 : x - 25, y - 3.5) < 1.6 ? 'W' : 'w') : null) : y === 0 ? 'W' : y > 5 ? 'b' : x % 7 === 0 ? 'B' : 'w');
  const BEDROLL = () => spCv('bedroll', 26, 9, (x, y) => x > 21 ? (Math.hypot(x - 22, y - 4) < 4.4 ? (y < 4 ? 'R' : 'r') : null) : (y >= 1 && y <= 7 ? (x % 5 === 0 ? 'C' : y < 3 ? 'R' : 'r') : null));
  const WOODPILE = () => spCv('woodpile', 20, 13, (x, y) => { const row = Math.floor((12 - y) / 4), off = row % 2 ? 2 : 0, cx = (x - off) % 4; if (y > 12 || x - off < 0 || x - off > 19 - row * 4) return null; return cx === 0 ? 'B' : (12 - y) % 4 === 3 ? 'b' : cx === 1 ? 'W' : 'w'; });
  function drawCampFire(b) {
    const x = Math.round(b.x) & ~1, y = Math.round(b.y) & ~1;
    { const rb = srArt('ringBack', G.stage, SR.ringBack); ctx.drawImage(rb, x - rb.width / 2, y - rb.height + 4); } // v1.11 돌 둘레 뒤쪽 반
    // v2.78 엇갈린 장작 (껍질 · 숯 · 잉걸) + 물방울 모양 불꽃 (가장자리 붉게 → 안쪽 노랗게 → 심지 하얗게 · 칸 단위로 일렁임)
    const P2 = (px, py, c) => { ctx.fillStyle = c; ctx.fillRect(px & ~1, py & ~1, 2, 2); };
    for (const sx of [-1, 1]) for (let i = -6; i <= 6; i++) { const px = x + i * 2, py = y - 6 + Math.round(i * sx * 0.5) * 2, end = Math.abs(i) >= 5; // 엇갈린 장작 두 개 (위 껍질 빛 · 아래 숯 · 가운데 잉걸)
      P2(px, py - 2, '#140c08'); P2(px, py, end ? (i * sx > 0 ? '#c8a070' : '#6b4a2a') : Math.abs(i) < 2 ? '#2a1a10' : '#8a6038'); P2(px, py + 2, Math.abs(i) < 3 ? '#ff7020' : '#3a2416'); P2(px, py + 4, '#140c08'); }
    const ft = Math.floor(time * 10), nz = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233 + ft * 3.1) * 43758.5453; return v - Math.floor(v); };
    for (let yy = 0; yy < 30; yy += 2) { const k = yy / 30, sway = Math.round(Math.sin(time * 5 + yy * 0.22) * 2.5 * k), hw = (11 * (1 - k * 0.92)) * (0.85 + 0.2 * Math.sin(time * 9 + yy * 0.5));
      for (let xx = -12; xx <= 12; xx += 2) { const d = Math.abs(xx - sway) / Math.max(1, hw); if (d > 1 || (d > 0.75 && nz(xx, yy) < 0.4)) continue;
        P2(x + xx, y - 6 - yy, d < 0.3 && k < 0.55 ? '#fff4c8' : d < 0.55 && k < 0.75 ? '#ffd060' : d < 0.8 ? '#ff8a2a' : '#e2501c'); } }
    for (let i = 0; i < 3; i++) { const k = ((time * 1.6 + i / 3) % 1), px = x + Math.round(Math.sin(i * 2.1 + time * 3) * 6), py = y - 34 - Math.round(k * 14); if (nz(i, 9) < 0.7) P2(px, py, k < 0.5 ? '#ff8a2a' : '#e2501c'); } // 떨어져 나가는 불꽃 조각
    { const rf = srArt('ringFront', G.stage, SR.ringFront); ctx.drawImage(rf, x - rf.width / 2, y - 4); } // 앞쪽 반
    if (G.stage === 3) { // 꼬챙이 고기 굽기
      ctx.fillStyle = '#2e1d12'; for (const s of [-1, 1]) { ctx.fillRect(x + s * 18 - 1, y - 24, 2, 22); ctx.fillRect(x + s * 18 - 3, y - 26, 6, 2); }
      ctx.fillStyle = '#140c08'; ctx.fillRect(x - 22, y - 26, 44, 2); const rot = Math.floor(time * 3) % 2;
      ctx.fillStyle = '#140c08'; ctx.fillRect(x - 10, y - 32, 20, 12); ctx.fillStyle = rot ? '#8a3a22' : '#9a4a2a'; ctx.fillRect(x - 8, y - 30, 16, 8); ctx.fillStyle = '#c87040'; ctx.fillRect(x - 6, y - 30, 8, 2); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + 8, y - 28, 4, 2);
      if (Math.random() < 0.2) G.parts.push({ x: x + rand(-6, 6), y: y - 22, vx: 0, vy: 30, t: 0.3, c: '#ffb050', g: 200 }); // 떨어지는 기름
      return;
    }
    // 삼발이와 냄비
    ctx.fillStyle = '#2e1d12'; for (const [dx, dy] of [[-16, 0], [16, 0]]) for (let k = 0; k < 18; k += 2) ctx.fillRect((x + dx - Math.sign(dx) * k * 0.8) & ~1, (y + dy - k * 1.9) & ~1, 2, 4);
    ctx.fillStyle = '#140c08'; ctx.fillRect(x - 1, y - 36, 2, 8); ctx.fillRect(x - 7, y - 30, 14, 10); ctx.fillStyle = '#4e4a44'; ctx.fillRect(x - 5, y - 28, 10, 6); ctx.fillStyle = '#8a8478'; ctx.fillRect(x - 5, y - 28, 10, 2);
    if (Math.random() < 0.25) G.parts.push({ x: x + rand(-3, 3), y: y - 32, vx: rand(-4, 4), vy: -18, t: 1.2, c: 'rgba(200,200,210,.5)', g: 0 }); // 냄비 김
    if (Math.random() < 0.6) G.parts.push({ x: x + rand(-6, 6), y: y - 14, vx: rand(-10, 10), vy: -rand(30, 60), t: rand(0.6, 1.1), c: pick(['#ffb050', '#ff7030', '#ffe28a']), g: 0, glow: true });
  }
  function drawCamp(R) { // y 정렬 소품: 천막 · 통나무 의자 2 · 침낭 · 장작더미
    const b = G.bonfire; if (!b) return []; const t = TENT(), lg = LOGSEAT(), bd = BEDROLL(), wp = WOODPILE();
    return [
      { y: b.y - 46, d: () => ctx.drawImage(t, (b.x - 92 - t.width / 2) & ~1, (b.y - 46 - t.height + 2) & ~1) },
      { y: b.y - 22, d: () => ctx.drawImage(lg, (b.x - lg.width / 2) & ~1, (b.y - 22 - lg.height + 2) & ~1) },
      { y: b.y + 30, d: () => ctx.drawImage(lg, (b.x - lg.width / 2) & ~1, (b.y + 30 - lg.height + 2) & ~1) },
      { y: b.y + 8, d: () => ctx.drawImage(bd, (b.x + 44) & ~1, (b.y + 8 - bd.height + 2) & ~1) },
      { y: b.y - 30, d: () => ctx.drawImage(wp, (b.x + 48) & ~1, (b.y - 30 - wp.height + 2) & ~1) },
      { y: b.y, d: () => drawCampFire(b) },
    ];
  }
  function paintCampFloor(g, R) { // 불 주변 그을리고 다져진 땅
    const b = { x: CX + 40, y: CY - 10 };
    for (let y = -48; y <= 48; y += 2) for (let x = -96; x <= 96; x += 2) { const e = Math.hypot(x / 96, y / 48); if (e > 1 || !dith((x + 200) >> 1, (y + 200) >> 1, (1 - e) * 0.8)) continue; g.fillStyle = e < 0.25 ? '#1a120c' : e < 0.5 ? '#2a1e14' : '#3a2c1e'; g.fillRect((b.x + x) & ~1, (b.y + y) & ~1, 2, 2); }
    for (let i = 0; i < 18; i++) { g.fillStyle = pick(['#4e4a44', '#2e2b28', '#6b6560']); g.fillRect((b.x + rand(-26, 26)) & ~1, (b.y + rand(-8, 8)) & ~1, 2, 2); } // 재
  }
  // 상점 바닥: 노점 앞에 깔린 큰 직물 깔개
  function paintShopFloor(g, R) { // 상품을 늘어놓은 낡은 누비 깔개 두 장 (가장자리가 해지고 비뚤어짐)
    const pals = [['#6a5030', '#5a4228', '#8a6a40', '#3a5a3a', '#7a3028'], ['#5a4a6a', '#4a3a58', '#7a6a50', '#6a3028', '#4a5a30']];
    for (const [ox, oy, w, h, k] of [[CX - 162, CY + 8, 176, 44, 0], [CX + 6, CY + 12, 158, 40, 1]]) {
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
        const wob = Math.sin(x * 0.11 + k) * 3 + Math.sin(y * 0.3) * 2, ey = y + wob * 0.3, frayed = x < 4 + (y * 7 % 5) || x > w - 6 + (y * 3 % 4) || ey < 2 + (x * 5 % 4) || ey > h - 4 + (x * 3 % 3);
        if (frayed && ((x + y) >> 1) % 3 === 0) continue;
        const patch = (Math.floor((x + 6 * k) / 22) * 7 + Math.floor(y / 14) * 3) % 5, seam = x % 22 === 0 || y % 14 === 0;
        g.fillStyle = frayed ? '#2a1e14' : seam ? '#1e150e' : pals[k][patch]; g.fillRect((ox + x) & ~1, (oy + y + Math.round(wob * 0.3) * 2) & ~1, 2, 2);
      }
    }
  }

  // ---- v0.77: 특별한 방을 챕터별 장면으로 — 생성한 도트 소품을 일반 소품(PROPS)으로 등록해 y정렬·조명·막힘을 그대로 쓴다
  Object.assign(SP_PAL, { m: '#4a7a34', M: '#6e9a4a', h: '#9a7450', H: '#6a4a30', v: '#5a6638', V: '#3c4628', s: '#a8aeb6', q: '#5a6068', o: '#d8d0b8', O: '#a89880' });
  let SP_READY = false;
  // ================================================================ v1.11 특별한 방 다시 그리기 (대장간 수준): 상인 · 모닥불 · 보물 방 · 비밀 방
  // 2px 칸 · 검은 외곽선 · 왼쪽 위 빛 · 4단계 명암. 챕터별로 팔레트만 바꿔 같은 물건을 다른 재질로
  const SRPAL = { k: '#0b0a0e',
    o: '#b07c44', O: '#83592f', p: '#5c3c20', P: '#3c2614', // 나무
    e: '#e8705a', r: '#c03c30', R: '#86241e', E: '#4e1214', // 붉은 천
    c: '#f2e4c2', C: '#d0b98c', v: '#a08658', V: '#6a5636', // 생천 · 캔버스
    '1': '#9a94a4', '2': '#706a80', '3': '#4c4758', '4': '#2e2a36', // 돌
    y: '#fff3c0', Y: '#ffd060', g: '#e0a030', G: '#9a6418', // 금
    i: '#e0e4ec', I: '#a8aeb8', j: '#6e747e', J: '#43474f', // 쇠
    m: '#8cc058', M: '#5a8a34', n: '#34522a', N: '#1e3218', // 풀 · 이끼
    u: '#8ac4e8', U: '#4078a8', q: '#b080d8', Q: '#6a3e8a', z: '#3e2458', // 파랑 · 보라
    f: '#ffb040', F: '#ff6a2a', w: '#ffffff', // 불 · 흰빛
    b: '#ece4cc', B: '#bcae8c', x: '#7a6e56', // 뼈
    h: '#b08458', H: '#7a5636', a: '#4e3626', A: '#2e2018', // 털가죽
    d: '#24202a', D: '#16131a', s: '#5a5a62', S: '#3a3a42', l: '#f2f0f6', L: '#cfcbd9', t: '#a29eb2', T: '#68647a', // l~T 대리석
    '5': '#9894a6', '6': '#726e84', '7': '#4e4a60', '8': '#302c3e', '9': '#1e1b28' }; // v2.80 5~9 어두운 대리석 (비밀방 제단)
  // 챕터별 재질 바꾸기: 키는 SRPAL 글자, 값은 바꿀 색
  const SR_ST = {
    1: {},
    2: { '1': '#a8a4b4', '2': '#7c7890', '3': '#56526a', '4': '#34303e' },
    3: { '1': '#a08868', '2': '#7a6448', '3': '#54442e', '4': '#33281c', c: '#d8b48a', C: '#b08a60', v: '#86643e', V: '#5a4028', r: '#a83a24', R: '#70241a', e: '#d06040' },
  };
  const srPal = st => Object.assign({}, SRPAL, SR_ST[st] || {});
  // v3.19 상점 소품 다시 그림 (비스트로 수레 수준: 재질마다 3~4단 명암 · 왼쪽 위 빛 · 주름 · 결 · 쇠 장식) — 칸 그림 + 외곽선 포함
  const SR_NEW = {"stall":[".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.","k21212121212121212121212121212121212121212121212121212121212121212121k",".krrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwk.","krrrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwwwWrrrrrrRwwwwwk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","krRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWWxrRRRRRswWWWWk","kssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxk","kssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxxXssssssSxxxxxk","kSSsssSSXXxxxXXSSsssSSXXxxxXXSSsssSSXXxxxXXSSsssSSXXxxxXXSSsssSSXXxxxk",".kksss6666xxx6666sss6666xxx6666sss6666xxx6666sss6666xxx6666sss6623xxxk","..k2355555555555555555555555555555555555555555555555555555555555235kk.","..k235344453444J344453444534445344453444535445344453J44534J45344235k..","..k2Z5344423442J344453444534445344452444234445354453J44534J453432Z5k..","..k2353444334JJJJJ4453444534445344453444334445344422222222222344235k..","..k2353444R34JlLLJ4XXX44453444534445G444P3444XXX442333yyY3335344235k..","..k235354rRs4JLlLJxxxxx445344453444gGh4pPq44xxxxx4233yyYYY335354235k..","..k235344wRs5JoooJYzzzZ445344453444wGh4wPq43xXXXv4233yYzYY335344235k..","..k235344rRs4JoooJYwzzZ44cccccccc44gGh3pPq44xwXXv4233YYYYZ335344235k..","..k235344rRs4bJJJ4YWWWZ44XCCRsCCX34gGh4pPq44xWWWv42333YYZ3335344235k..","..k235344rRs4bBn34YzzzZ44CCCsCCCC44gGh4pPq44xXXXv425555555555344235k..","..k235344rRs4bBn34YZZZZ34vvvvvvvv44gGh4pPq44xvvvv453444534445344235k..","..k2352222222222222222222222222222222222222222222222222222222222235k..","..k2354445444444445444444445444444445444444445444444445444444445235k..","..k235343J53444534445344453444534445344453444535445344453444J344235k..","..k235344j53444534445344453444534445344XXX44453Bn45Pq445G444j344235k..","..k23534445344453444534x4534x4534x4534xxxxx44RsYnGhYq4G5h5G45343235k..","..k2Z5354YYYYYYYYY445rrrrsbbbbnppppq34iIIIj44YsBnYhPq4h5h4h453542Z5k..","..k235344z333y333z445rwRRsbwBBnpwPPq34iwIIj44RsBnGhPq34hhh445344235k..","..k235344z444Y444z445rrrrsbbbbnppppq34iWWWj44RsBnGhPq44hhh445344235k..","..k235344z4444444z445rRRRsbBBBnpPPPq34iIIIj34RsBnGhPq44555445344235k..","..k235344zzzzzzzzz445rrrrsbbbbnppppq34ijjjj44RsBnGhPq445h4445344235k..","..k2352222222222222222222222222222222222222222222222222222222222235k..","..k2354445444444445444444445444444445444444445444444445444444445235k..","..k235344J53444534445343453444534445344453544534445344453444J344235k..","..k235344j53444534345344453444534445344453444535445344453444j344235k..","..k2353444534345344453444534445344453444534445344453544534445344235k..","..k2352222222222222222222222222222222222222222222222222222222222235k..","..k2355333333335333333335333333335333333335333333335333333335333235k..","..k2355444444445444444445444444445444444445444444445444444445444235k..","..k2355444444445444444445444444445444444445444444445444444445444235k..","..k2355444444445444444445444444445444444445444444445444444445444235k..","..k235kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk235k..","..k2Z5k........................................................k2Z5k..","..k235k........................................................k235k..","..k235k........................................................k235k..","...kkk..........................................................kkk..."],"counter":[".kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.","k2222222122222221222222212222222122222221222222212222k","k3333333333433333333334333333333343333333333433333333k",".kzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYzYk.",".kPppPPPqqQPppPPPqqQPppPPPqqQPppPPPqqQPppPPPqqQPppPPk.",".kPppPPPqqQPppPPPqqQPppPPPYqQPppPPPqqQPppPPPqqQPppPPk.",".kPppPPPqqQPppPPPqqQPppPPYyYQPppPPPqqQPppPPPqqQPppPPk.",".kPppPPPqqQPppPPPqqQPppPPPYzQPppPPPqqQPppPPPqqQPppPPk.",".kPppPPPqqQPppPPPqqQPppPPPqqQPppPPPqqQPppPPPqqQPppPPk.",".kqqqqqqQQQqqqqqqQQQqqqqqqQQQqqqqqqQQQqqqqqqQQQqqqqqk.","..kYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkYkkk..","...k.kzk.k.kzk.k.kzk.k.kzk.k.kzk.k.kzk.k.kzk.k.kzk...."],"stand":[".kkkkkkkkkkkkkkkkkk.","krwrrrrrrrrrrrrrrrrk","kRRssRRssRRssRRssRRk","kRRssRRssRRssRRssRRk","kRRssRRssRRssRRssRRk","kszYzYzYzYzYzYzYzYsk",".k3kk5kkkkkkkk5kk3k.",".k3kk5k......k5kk3k.",".k3kk5k......k5kk3k.",".k3kk5k......k5kk3k.",".k5k.k........k.k5k.","..k..............k.."],"banner":["kkkCkkkkCkkk","Y2222222222Y","z4444444444z","kzgGGhhGGhZk","kzYYYYYYYYZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgYGYYGYhZk","kzgyYYYYYhZk","kzgyYRsYYhZk","kzgZZZZZZhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk","kzgGGhhGGhZk",".kGGGGhhhhk.","..kGGGhhhk..","...kGGhhk...","....kGhk....",".....kk.....","............","............","............"],"banner_2":["kkkCkkkkCkkk","Y2222222222Y","z4444444444z","kzBnnNNnnNZk","kzYYYYYYYYZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBYnYYnYNZk","kzByYYYYYNZk","kzByYRsYYNZk","kzBZZZZZZNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk","kzBnnNNnnNZk",".knnnnNNNNk.","..knnnNNNk..","...knnNNk...","....knNk....",".....kk.....","............","............","............"],"banner_3":["kkkCkkkkCkkk","Y2222222222Y","z4444444444z","kzrRRssRRsZk","kzYYYYYYYYZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRwwWRRsZk","kzrwwWWWRsZk","kzrwkWWkRsZk","kzrWWWxxRsZk","kzrRWxxRRsZk","kzrRxWxWRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk","kzrRRssRRsZk",".kRRRRssssk.","..kRRRsssk..","...kRRssk...","....kRsk....",".....kk.....","............","............","............"]};
  const SR_NEWPAL = {"k":"#0b0a0e","1":"#e0b07a","2":"#c89260","3":"#a06e40","4":"#7a4e2a","5":"#5a3a20","6":"#3a2416","r":"#f07060","R":"#d84a4a","s":"#a8303a","S":"#7a2028","w":"#fffaf0","W":"#f4ead6","x":"#d4c4a4","X":"#b0a080","p":"#d8a8f0","P":"#a868d8","q":"#7a40a8","Q":"#4e2870","b":"#b8e0f8","B":"#7ab0d8","n":"#4a7aa8","N":"#2a4a70","g":"#b8e890","G":"#6cc048","h":"#4a9a34","H":"#2a6a24","y":"#fff4c0","Y":"#f2c84a","z":"#d8a030","Z":"#9a6a18","i":"#d8dce4","I":"#a8aeb8","j":"#6a6e78","J":"#3e4250","l":"#fff9d8","L":"#ffe08a","o":"#ffb050","O":"#e07a30","c":"#e8d8b8","C":"#c0a880","v":"#8a7458"};
  const srArt = (k, st, fn) => art('sr_' + k + '_' + st, () => { const nk = SR_NEW[k + '_' + st] || SR_NEW[k]; return nk ? gCanvas(fromRows(nk), SR_NEWPAL) : gCanvas(fn(st), srPal(st)); }); // 벽 깃발은 장마다 색 (2 파랑 · 3 붉은 해골)
  const SR = {};
  // 판자 (세로결): x0~x1 너비, 왼쪽이 밝음
  const plank = (x, w) => x === 0 ? 'o' : x === w - 1 ? 'p' : 'O';

  // ---- 상인 ----------------------------------------------------------------
  // 노점 뒤편: 줄무늬 차양(물결 끝단) · 두 기둥 · 판자 벽 · 선반 2단(병·단지·두루마리·작은 함) · 매단 등 · 동전 간판
  SR.stall = st => { const W = 70, H = 50, g = FG.mk(W, H);
    // 판자 벽
    FG.rect(g, 6, 12, W - 7, 44, (x, y) => (x - 6) % 7 === 0 ? 'P' : (x - 6) % 7 === 1 ? 'O' : ((x * 5 + y * 3) % 23 === 0 ? 'P' : 'p'));
    // 선반 2단
    for (const sy of [24, 35]) { FG.rect(g, 6, sy, W - 7, sy, 'o'); FG.rect(g, 6, sy + 1, W - 7, sy + 1, 'P'); for (const bx of [10, W - 11]) FG.rect(g, bx, sy + 2, bx, sy + 3, 'P'); }
    // 윗단 물건: 병 · 단지 · 두루마리 · 병
    const bottle = (x, y, c1, c2) => { FG.rect(g, x + 1, y - 7, x + 1, y - 6, 'V'); FG.put(g, x + 1, y - 8, 'v'); FG.rect(g, x, y - 5, x + 2, y - 1, (xx, yy) => xx === x ? (yy === y - 5 ? 'w' : c1) : c2); };
    const jar = (x, y, c1, c2) => { FG.rect(g, x + 1, y - 5, x + 3, y - 5, 'v'); FG.rect(g, x, y - 4, x + 4, y - 1, (xx, yy) => xx === x ? c1 : xx === x + 4 || yy === y - 1 ? c2 : (yy === y - 3 && xx === x + 1 ? 'c' : c1)); };
    const scroll = (x, y) => { FG.rect(g, x, y - 3, x + 7, y - 1, (xx, yy) => yy === y - 3 ? 'c' : yy === y - 1 ? 'v' : 'C'); FG.put(g, x + 3, y - 2, 'r'); FG.put(g, x + 3, y - 3, 'R'); };
    bottle(9, 23, 'e', 'R'); bottle(13, 23, 'u', 'U'); jar(18, 23, 'h', 'H'); scroll(25, 23); bottle(35, 23, 'm', 'M'); bottle(39, 23, 'q', 'Q'); jar(44, 23, 'C', 'v'); scroll(51, 23); bottle(60, 23, 'Y', 'G');
    // 아랫단: 작은 함 · 천 두루마리 · 단지 · 해골잔(3)/촛대(2)/허브다발(1)
    FG.rect(g, 9, 29, 17, 33, (x, y) => y === 29 ? 'g' : x === 9 ? 'o' : x === 17 || y === 33 ? 'p' : y === 31 ? 'G' : 'O'); FG.put(g, 13, 31, 'Y');
    for (const [x, c1, c2] of [[21, 'r', 'R'], [26, 'u', 'U'], [31, 'm', 'M']]) FG.rect(g, x, 30, x + 4, 34, (xx, yy) => yy === 30 ? 'c' : xx === x ? c1 : xx === x + 4 ? c2 : (yy % 2 ? c1 : c2));
    jar(39, 34, 'I', 'j'); jar(46, 34, 'e', 'R');
    if (st === 3) { FG.ell(g, 57, 31, 3, 2.6, (dx, dy) => dx + dy < -1 ? 'b' : dx + dy > 1.5 ? 'x' : 'B'); FG.put(g, 56, 31, 'k'); FG.put(g, 58, 31, 'k'); }
    else if (st === 2) { FG.rect(g, 57, 29, 57, 34, 'j'); FG.rect(g, 55, 34, 59, 34, 'J'); FG.put(g, 57, 28, 'c'); FG.put(g, 57, 27, 'f'); }
    else { for (const x of [55, 57, 59]) FG.line(g, 57, 34, x, 28, 'M'); FG.put(g, 55, 28, 'm'); FG.put(g, 59, 28, 'm'); FG.put(g, 57, 28, 'Y'); FG.rect(g, 56, 33, 58, 33, 'v'); }
    // 아래 판자 받침
    FG.rect(g, 6, 40, W - 7, 44, (x, y) => y === 40 ? 'o' : (x - 6) % 9 === 0 ? 'P' : 'O');
    // 기둥 2개
    for (const x0 of [3, W - 6]) FG.rect(g, x0, 6, x0 + 2, H - 1, (x) => plank(x - x0, 3));
    // 차양: 줄무늬 · 위는 밝고 아래는 어두움 · 물결 끝단
    for (let y = 0; y <= 14; y++) for (let x = 0; x < W; x++) {
      const inset = Math.max(0, 3 - y); if (x < inset || x > W - 1 - inset) continue;
      const sx = Math.floor(x / 7), red = sx % 2 === 0, lx = x % 7;
      if (y >= 11) { const bump = Math.hypot(lx - 3, (y - 10.5) * 1.3); if (bump > 3.6) continue; }
      let c = red ? (y < 3 ? 'e' : y < 9 ? 'r' : 'R') : (y < 3 ? 'c' : y < 9 ? 'C' : 'v');
      if (lx === 0) c = red ? 'R' : 'v'; // 주름
      if (y === 9) c = red ? 'E' : 'V';
      FG.put(g, x, y, c);
    }
    FG.rect(g, 1, 0, W - 2, 0, 'p'); // 위 장대
    // 매단 등 (왼쪽) · 동전 간판 (오른쪽)
    FG.rect(g, 15, 13, 15, 15, 'J'); FG.rect(g, 13, 16, 17, 16, 'J'); FG.rect(g, 13, 17, 17, 20, (x, y) => x === 13 || x === 17 ? 'J' : y === 17 ? 'y' : 'Y'); FG.rect(g, 14, 21, 16, 21, 'J');
    FG.rect(g, 52, 13, 52, 14, 'J'); FG.rect(g, 58, 13, 58, 14, 'J'); FG.rect(g, 50, 15, 60, 21, (x, y) => x === 50 || y === 15 ? 'o' : x === 60 || y === 21 ? 'P' : 'O');
    FG.ell(g, 55, 18, 2.4, 2.4, (dx, dy) => dx + dy < -1 ? 'y' : dx + dy > 1.2 ? 'G' : 'Y'); FG.put(g, 55, 18, 'g');
    return gOutline(g); };
  // 노점 앞 계산대: 판자 + 늘어진 보라 천(금테·술)
  SR.counter = st => { const W = 54, H = 12, g = FG.mk(W, H);
    FG.rect(g, 0, 0, W - 1, 1, (x, y) => y === 0 ? 'o' : 'O');
    FG.rect(g, 1, 2, W - 2, 9, (x, y) => { const fold = (x % 9); if (y === 2) return 'g'; if (y === 9) return x % 3 === 1 ? 'Y' : 'G'; return fold === 0 ? 'z' : fold < 3 ? 'q' : fold > 6 ? 'z' : 'Q'; });
    for (let x = 2; x < W - 2; x += 4) FG.put(g, x, 10, 'g');
    FG.put(g, Math.floor(W / 2), 5, 'Y'); FG.put(g, Math.floor(W / 2) - 1, 5, 'g'); FG.put(g, Math.floor(W / 2) + 1, 5, 'g'); FG.put(g, Math.floor(W / 2), 4, 'g'); FG.put(g, Math.floor(W / 2), 6, 'g');
    return gOutline(g); };
  // 물건 진열대: 다리 넷 + 붉은 천 덮개(금테)
  SR.stand = st => { const W = 20, H = 12, g = FG.mk(W, H);
    for (const x of [2, W - 3]) FG.rect(g, x, 5, x, H - 1, (xx, y) => y === H - 1 ? 'P' : 'p'); for (const x of [4, W - 5]) FG.rect(g, x, 5, x, H - 2, 'P');
    FG.rect(g, 0, 0, W - 1, 1, (x, y) => y === 0 ? 'e' : 'r'); FG.rect(g, 0, 2, W - 1, 4, (x, y) => y === 4 ? (x % 2 ? 'Y' : 'G') : x % 5 === 0 ? 'R' : 'r');
    return gOutline(g); };

  // ---- 모닥불 --------------------------------------------------------------
  // 돌 둘레(앞뒤 반쪽으로 나눠 불꽃이 사이에): 크기 제각각 돌 + 그을음
  SR.ringBack = st => { const W = 32, H = 10, g = FG.mk(W, H);
    for (let i = 0; i < 6; i++) { const a = Math.PI + (i + 0.5) / 6 * Math.PI, cx = 16 + Math.cos(a) * 12.5, cy = 7 + Math.sin(a) * 4.6, r = i % 3 === 1 ? 2.7 : 2.2; FG.ell(g, cx, cy, r + 0.9, r * 0.8 + 0.9, 'k'); FG.ell(g, cx, cy, r, r * 0.8, (dx, dy) => dx + dy < -0.8 ? '1' : dx + dy > 1 ? '3' : '2'); }
    return gOutline(g); };
  SR.ringFront = st => { const W = 34, H = 10, g = FG.mk(W, H);
    for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * Math.PI, cx = 17 + Math.cos(a) * 13.5, cy = 2.8 + Math.sin(a) * 4.8, r = i % 2 ? 2.9 : 2.4; FG.ell(g, cx, cy, r + 0.9, r * 0.8 + 0.9, 'k'); FG.ell(g, cx, cy, r, r * 0.8, (dx, dy) => dx + dy < -0.8 ? '1' : dx + dy > 1 ? '4' : '2'); FG.put(g, Math.round(cx - r * 0.4), Math.round(cy - r * 0.4), 'b'); }
    return gOutline(g); };
  // 통나무 의자: 나무껍질 결 · 잘린 단면 나이테 · 이끼(1)
  SR.log = st => { const W = 32, H = 10, g = FG.mk(W, H);
    FG.rect(g, 3, 1, W - 4, 8, (x, y) => y === 1 ? 'O' : y === 8 ? 'P' : (x * 3 + y * 7) % 11 === 0 ? 'P' : y < 4 ? (x % 5 === 0 ? 'p' : 'O') : 'p');
    for (const cx of [3, W - 4]) FG.ell(g, cx, 4.5, 2.6, 3.8, (dx, dy, q) => q > 0.7 ? 'O' : q > 0.35 ? 'h' : 'c');
    if (st === 1) for (const x of [10, 11, 12, 20, 21]) FG.put(g, x, 1, x % 2 ? 'm' : 'M');
    if (st === 3) { FG.ell(g, 16, 1.2, 4, 1.5, (dx) => dx < 0 ? 'h' : 'H'); } // 털가죽 깔개
    return gOutline(g); };

  // ---- 보물 방 --------------------------------------------------------------
  // 키 큰 화로: 받침 · 기둥 · 넓은 그릇 (불꽃은 따로 움직임)
  // v2.80 화로대 작게: 세 발 · 마디 기둥 · 넓은 그릇 · 숯 (0 9 % & = 챕터 재질 밝은→어두운)
  const BRAZ2 = ["..............", "..............", ".kkkkkkkkkkkk.", "kddFddFddFDDDk", "0000099999%%%%", "k0009999%%%&&k", "k0009999%%%&&k", ".k009999%%%&k.", "..kkk999%kkk..", ".....k0&k.....", ".....k0&k.....", ".....k0&k.....", "....k99%%k....", ".....k0&k.....", ".....k0&k.....", "....kk0&k.....", "...k%%9&&k....", "..kk%k9&k&k...", ".k%%%k9&kk&kk.", "k0%kkk9&k.k&&k"];
  SR.brazier = st => { const m = st === 2 ? ['y', 'Y', 'g', 'G'] : st === 3 ? ['I', 'j', 'J', 'S'] : ['1', '2', '3', '4'], M = { '0': m[0], '9': m[1], '%': m[2], '&': m[3] }; return fromRows(BRAZ2).map(r => r.map(c => M[c] || c)); };
  // 금화 더미: 동전 결 · 보석 · 금잔 · 왕관
  // v2.80 보물 더미(큰 언덕 · 흘러내린 동전 · 금잔 · 왕관 · 보석)와 금화 더미(낮은 더미 · 동전 탑)를 따로
  const GOLD2 = ["......................................", "......................................", "......................................", "...................kk.................", "..................kYYkk.kk..k.........", "...........kkkkkkkyYYYYkYYkkYk........", "..........kyyyyyyyGYYyYYYYYYYk........", ".......kkkyyYYYYYGYGYyqYrYYuYk........", "......kyYYYGGyyYGYyYYGGGGGGGGgk.......", "......kywYYGYYYYYYYggggggggggYgk......", "......kyYYYGYGYYYYGyGggggyggggGGk.....", "....kkyyYYYGYYYGYgGgggGgggwggGGGk.....", "...kyyGGygYGYYwgggGyggygGgugGGGGGk....", "..kyYYYYYgyYYGrygggyggggggGGGGGGGGk...", ".kGGYyYGGGGGggGgggggGggYGGGYGGGGGGYk..", ".kYYGyYYYYYgggggGggygggGGGGGGYGwGYGGk.", "kyYyyywyYYggggGyyGgGYgGGGGGGGGGmYGGGGk", "kYYGYYqYggGGygGGgggwgGGGGGYGGGGGGGGGGk", ".kGYYyygggggGygggYgrGGGGGGGGGGGGGGGGk.", "..kYGYggGggggGgGgYGGGGGGGGGGGGGGGYGk.k", "k..kGgGggggggggGgGGGYGGGGGGGGGGGGGk.kg", "Yk..kkkgggggggYYGGGGGGGGGGGGGGGkkk.k.k", "k.k....kkkkkggGGGYGGGGGGGGkkkkk...kgk.", ".kYk....kYk.kkkkkkkkkkkkkk..kgk....k.."], COINS2 = ["........................", "........................", "........................", ".........kkkkkk.........", ".......kkyywYYYkk.......", "......kyyYYrYYYYYk......", "...kkkyYGYyYYYYggyk.....", "..kyYGYYyYYyYYuggGgk....", "..kygGYYqyYyggggggggk...", "..kyYGYYYGYgggggygyYGk..", ".kyygGYYyggggggggGygGYk.", "kyYyYGYYggGggyggGGyYGGGk", "kYYygGggggggggGGGGygGGGk", "YkkYYgygGggGgGYGGGGGGkk.", "k..kkkgggggGGGGGGGkkk.k.", "..kYk.kkkkkkkkkkkk...kgk"];
  SR.gold = st => fromRows(GOLD2);
  SR.coins = st => fromRows(COINS2);
  // 수호 석상: 받침 위에 칼을 짚은 기사 (1 이끼 낀 돌 · 2 흰 대리석 · 3 나무 토템 우상)
  // v2.77 수호 석상 (외곽선은 1칸만): 재의 제단 근위기사와 같은 비율(큰 투구 · 짧은 몸) + 깃털 장식 · 뒤로 늘어진 망토 · 받침 (1 이끼 돌 · 2 흰 대리석과 금 · 4 잿빛). 3장은 나무 토템 그대로
  const STATUE_K = ["...........kkk......", "..........ka12k.....", ".........ka1k33k....", "........k121kk44k...", "........kkkk..k4k...", ".......k1a13k..k....", "......kkk13kkk......", ".....k1a111223k.....", "....k1a12222223k....", "....kGGGGGGGGG4k....", "....k44e444e444k....", "....k1222422223k....", ".....kk12k223kk.....", "...kk1112GGGk33kk...", "..k1a111kGGk22233k..", "..k1122k1GG3k2233k..", "..k112k1aGG33k233k..", "...kkkGGGGGGGGGkk...", "..k2k4122a32234k4k..", ".k22k4122a32334k44k.", ".k22k4122a32334k44k.", ".k22k412Ga3G334k44k.", "k222k4421a33344k444k", "k222k44k1a33k44k444k", "k22k44k111k33k44k44k", "k22kkkkkk33kkkkkk44k", "kkkkkkkkkkkkkkkkkkkk", "ka11111111111111123k", "k222222222222222234k", ".kkkkkkkkkkkkkkkkkk.", ".k1222222222222224k.", ".k133PPPPPPPPPP334k.", ".k13P3333333333P34k.", ".k133PPPPPPPPPP334k.", ".k1333333333333334k.", "kkkkkkkkkkkkkkkkkkkk", "ka1111111111111113kk", "k444444444444444444k", "kkkkkkkkkkkkkkkkkkkk"];
  const STATUE_MAT = { 1: { a: 'L', G: '3', P: 'n', e: '4' }, 2: { a: 'l', G: 'g', P: 'G', e: '4' }, 4: { a: 'L', G: '3', P: '4', e: '4' } };
  SR.statue = st => { if (st !== 3) { const M = STATUE_MAT[st] || STATUE_MAT[1]; const rows = STATUE_K.map(r => [...r].map(c => M[c] || c));
      if (st === 1) [[7, 7], [6, 8], [10, 5], [3, 14], [4, 15], [4, 14], [16, 20], [17, 21], [2, 23], [3, 22], [3, 27], [4, 27], [5, 28], [15, 27], [3, 31], [16, 34], [2, 36], [3, 36]].forEach(([x, y], i) => { if ('1234LIl'.includes(rows[y][x])) rows[y][x] = i % 2 ? 'm' : 'M'; }); // 이끼
      return fromRows(rows.map(r => r.join(''))); }
    const W = 22, H = 46, g = FG.mk(W, H), m = ['1', '2', '3', '4'];
    FG.rect(g, 1, 38, 20, 45, (x, y) => y === 38 ? m[0] : y === 45 || x === 20 ? m[3] : y === 41 ? m[3] : x === 1 ? m[1] : m[2]); // 받침
    FG.rect(g, 3, 36, 18, 37, (x, y) => y === 36 ? m[0] : m[2]);
    if (st === 3) { // 토템: 쌓인 얼굴 셋 + 날개
      for (const [y0, ey] of [[4, 'F'], [15, 'Y'], [26, 'F']]) { FG.rect(g, 5, y0, 16, y0 + 10, (x, y) => x === 5 ? 'o' : x === 16 ? 'p' : y === y0 ? 'o' : y === y0 + 10 ? 'P' : 'O');
        FG.rect(g, 7, y0 + 3, 8, y0 + 4, ey); FG.rect(g, 13, y0 + 3, 14, y0 + 4, ey); FG.rect(g, 8, y0 + 7, 13, y0 + 8, (x, y) => (x % 2) ? 'b' : 'k'); }
      FG.rect(g, 0, 15, 4, 17, (x, y) => y === 15 ? 'e' : 'r'); FG.rect(g, 17, 15, 21, 17, (x, y) => y === 15 ? 'e' : 'R'); FG.rect(g, 8, 0, 13, 3, (x, y) => y === 0 ? 'b' : 'B');
      return gOutline(g); }
    // 망토 (뒤, 아래로 넓어짐)
    for (let y = 12; y <= 35; y++) { const hw = 6 + (y - 12) * 0.16; for (let x = Math.ceil(11 - hw); x <= Math.floor(11 + hw); x++) FG.put(g, x, y, x - 11 < -hw + 1.5 ? m[1] : x - 11 > hw - 2 ? m[3] : m[2]); }
    for (let y = 20; y <= 35; y += 1) { FG.put(g, 6, y, m[3]); FG.put(g, 16, y, m[3]); } // 망토 주름
    // 몸통 (갑옷) · 허리띠 · 다리
    FG.rect(g, 8, 12, 14, 24, (x, y) => x === 8 ? m[0] : x === 14 ? m[2] : y === 21 ? m[3] : (y === 13 && x < 12) ? m[0] : m[1]);
    FG.rect(g, 8, 25, 10, 35, (x) => x === 8 ? m[0] : m[1]); FG.rect(g, 12, 25, 14, 35, (x) => x === 14 ? m[3] : m[2]);
    // 어깨받이
    FG.ell(g, 7, 12.5, 2.6, 2, (dx, dy) => dx + dy < -0.5 ? m[0] : m[1]); FG.ell(g, 15, 12.5, 2.6, 2, (dx, dy) => dx + dy < -0.5 ? m[1] : m[3]);
    // 투구 + 깃털장식 + 눈구멍
    FG.ell(g, 11, 7, 3.6, 4, (dx, dy) => dx + dy < -1.5 ? m[0] : dx + dy > 2 ? m[3] : m[1]); FG.rect(g, 9, 7, 13, 7, m[3]); FG.put(g, 11, 8, m[3]); FG.rect(g, 10, 10, 12, 11, m[2]);
    FG.rect(g, 10, 1, 11, 3, (x) => x === 10 ? m[0] : m[1]); FG.rect(g, 12, 0, 14, 2, (x, y) => y === 0 ? m[1] : m[2]); FG.put(g, 15, 2, m[2]);
    // 짚은 칼: 손잡이 · 가로날 · 칼날 (밝은 면 + 어두운 날선)
    FG.rect(g, 11, 14, 11, 16, m[3]); FG.put(g, 11, 13, m[0]);
    FG.rect(g, 9, 17, 13, 18, (x, y) => y === 17 ? m[0] : m[2]); FG.rect(g, 7, 18, 15, 18, (x) => x === 7 ? m[0] : x === 15 ? m[3] : m[2]);
    FG.rect(g, 10, 19, 12, 36, (x, y) => x === 10 ? m[0] : x === 12 ? m[3] : y > 33 ? m[2] : m[1]);
    if (st === 1) for (const [x, y] of [[5, 11], [6, 11], [7, 12], [16, 30], [17, 31], [5, 38], [6, 38], [7, 39], [14, 38], [3, 44], [18, 40], [11, 4]]) FG.put(g, x, y, (x + y) % 2 ? 'm' : 'M'); // 이끼
    if (st === 2) { FG.put(g, 11, 22, 'Y'); FG.put(g, 11, 23, 'g'); FG.rect(g, 3, 41, 18, 41, 'g'); } // 금 장식
    return gOutline(g); };
  // 걸개 깃발 (보물 방·상인): 장대 + 천 + 문장
  SR.banner = st => { const W = 16, H = 40, g = FG.mk(W, H), L = st === 3 ? ['h', 'H', 'a', 'A'] : st === 2 ? ['u', 'U', 'z', 'D'] : ['m', 'M', 'n', 'N'];
    FG.rect(g, 0, 0, 15, 1, (x, y) => y === 0 ? 'o' : 'p');
    FG.rect(g, 2, 2, 13, 30, (x, y) => x === 2 ? L[0] : x === 13 ? L[3] : x === 3 || x === 12 ? 'g' : y === 3 ? 'g' : (x % 4 === 0 ? L[2] : L[1]));
    for (let x = 2; x <= 13; x++) { const d = Math.abs(x - 7.5); for (let y = 31; y < 31 + Math.max(0, 6 - d * 0.9); y++) FG.put(g, x, y, x < 7 ? L[1] : L[2]); }
    // 문장: 왕관(1·2) / 해골(3)
    if (st === 3) { FG.ell(g, 7.5, 14, 3, 3, (dx, dy) => dy > 1.5 ? 'B' : 'b'); FG.put(g, 6, 14, 'k'); FG.put(g, 9, 14, 'k'); FG.rect(g, 6, 17, 9, 18, (x) => x % 2 ? 'b' : 'k'); }
    else { FG.rect(g, 4, 13, 11, 16, (x, y) => y === 16 ? 'G' : x === 4 ? 'y' : 'Y'); for (const x of [4, 7, 8, 11]) FG.put(g, x, 12, 'Y'); FG.put(g, 7, 15, 'r'); FG.put(g, 8, 15, 'r'); }
    return gOutline(g); };

  // ---- 비밀 방 --------------------------------------------------------------
  // 대리석 제단: 윗판(상자가 놓이는 면) · 금테 두른 몸체 · 보랏빛 룬 판 · 계단 받침, 대리석 결
  // ---- 배치: 큰 물건은 뒷벽을 따라 (가운데 북문 자리는 비움), 가운데는 그 방의 쓰임새, 아래 모서리엔 잡동사니
  // ================================================================ v2.78 시설물 정비 B: 모닥불 방 · 비밀 방 · 상인 등불 (진엔딩 시설과 같은 품질 · 외곽선 1칸 · 왼쪽 위 빛)
  { const hh = (x, y, s = 0) => { const v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.7) * 43758.5453; return v - Math.floor(v); };
    // 통나무 의자: 위가 밝은 껍질 · 세로 껍질 골 · 양끝도 껍질로 둥글게(단면 안 보임) · 이끼(1) / 붉은 깔개(2) / 털가죽(3)
    SR.log = st => { const W = 34, H = 12, g = FG.mk(W, H);
      FG.rect(g, 3, 1, W - 5, 10, (x, y) => { const seg = Math.floor((x + y * 3) / 4), dash = y >= 3 && y <= 8 && hh(seg, y, 3) < 0.28; return y <= 2 ? 'O' : y >= 9 ? 'P' : dash ? (y <= 4 ? 'p' : 'P') : y <= 4 ? 'o' : 'p'; }); // 결을 따라 짧게 끊긴 껍질 골
      for (const cx of [3, W - 5]) FG.ell(g, cx + (cx < 10 ? 0 : 1), 5.5, 2.8, 4.6, (dx, dy) => dy < -2.5 ? 'O' : dy > 2.5 ? 'P' : dx * (cx < 10 ? -1 : 1) > 1.4 ? 'P' : 'p'); // 끝도 껍질로 둥글게 (단면 안 보임)
      if (st === 1) for (const [x, y] of [[9, 1], [10, 1], [11, 1], [10, 2], [19, 1], [20, 1], [24, 2], [25, 1]]) FG.put(g, x, y, (x + y) % 2 ? 'm' : 'M');
      if (st === 2) FG.rect(g, 12, 1, 20, 3, (x, y) => y === 3 ? (x % 2 ? 'g' : 'R') : y === 1 ? 'e' : 'r');
      if (st === 3) FG.ell(g, 16, 2, 6, 1.8, (dx, dy) => (dx < 0 ? 'h' : 'H'));
      return gOutline(g); };
    // 불 둘레 돌: 둥근 돌마다 위 빛 · 아래 그늘 · 반짝이는 결 · 그을음
    const stone = (g, cx, cy, r, front) => FG.ell(g, cx, cy, r, r * 0.78, (dx, dy, q) => q > 0.7 && dy > 0 ? '4' : dx + dy * 1.3 < -r * 0.55 ? '1' : dx + dy > r * 0.6 ? (front ? '3' : '4') : (front ? '2' : '3')); // 위 빛 · 아래 그늘 · 그을린 밑동
    SR.ringBack = st => { const W = 34, H = 12, g = FG.mk(W, H);
      for (let i = 0; i < 7; i++) { const a = Math.PI + (i + 0.5) / 7 * Math.PI, r = 2.2 + hh(i, 1) * 0.8; stone(g, 17 + Math.cos(a) * 13, 8 + Math.sin(a) * 5, r, false); }
      return gOutline(g); };
    SR.ringFront = st => { const W = 36, H = 12, g = FG.mk(W, H);
      for (let i = 0; i < 7; i++) { const a = (i + 0.5) / 7 * Math.PI, r = 2.6 + hh(i, 2) * 0.8; stone(g, 18 + Math.cos(a) * 14, 3 + Math.sin(a) * 5, r, true); }
      return gOutline(g); };
    // 비밀 방 제단: 위 판(대리석 결 · 금 테) · 몸통 새김판(금 테두리 · 보랏빛 보석) · 양 끝 촛대 · 계단 받침
    // v2.80 돌은 어두운 대리석(5~9, 왼쪽 위 빛 · 오른쪽 그늘 · 결) · 붉은 융은 윗판에만 넓게 걸침(모서리에서 부풂 · 물결 단 · 금 테 · 금실 마름모 · 술)
    SR.altar = st => { const W = 50, H = 22, g = FG.mk(W, H), vein = (x, y) => hh(x, y, 5) < 0.09, sh = (x, a, b, c) => x < 16 ? a : x < 36 ? b : c;
      FG.rect(g, 0, 19, W - 1, 21, (x, y) => y === 19 ? (x < W - 8 ? '5' : '6') : y === 21 ? '9' : x === 0 ? '6' : vein(x, y) ? '6' : sh(x, '6', '7', '8')); // 계단 받침
      FG.rect(g, 4, 6, W - 5, 18, (x, y) => x === 4 ? '5' : x === 5 ? '6' : x === W - 5 ? '9' : x === W - 6 ? '8' : y === 18 ? '8' : y === 6 ? '9' : vein(x, y) ? sh(x, '5', '6', '7') : sh(x, '6', '7', '8')); // 몸통 (윗판 아래 그늘 한 줄)
      FG.rect(g, 1, 1, W - 2, 5, (x, y) => y === 1 ? '5' : y === 5 ? '8' : x === 1 ? '5' : x === W - 2 ? '8' : y === 4 ? ((x % 2) ? 'g' : 'Y') : vein(x, y) ? sh(x, '5', '5', '6') : y === 2 ? sh(x, '5', '6', '6') : sh(x, '6', '6', '7')); // 위 판 · 금 테
      FG.rect(g, 8, 8, W - 9, 16, (x, y) => (x === 8 || x === W - 9 || y === 8 || y === 16) ? ((x + y) % 2 ? 'g' : 'G') : y === 9 || x === 9 ? '9' : '8'); // 새김판 금 테두리 · 안쪽 그늘
      for (const gx of [13.5, W - 14.5]) { FG.ell(g, gx, 12.5, 2.4, 1.7, (dx, dy) => dx + dy < -1 ? 'q' : dx + dy > 1 ? 'z' : 'Q'); FG.put(g, Math.round(gx - 1), 12, 'w'); } // 양쪽 보석
      for (let x = 9; x <= 40; x++) { const t = (x - 9) / 31, hem = 8 + ((x - 9) % 6 < 3 ? 0 : 1) + (x === 9 || x === 40 ? -1 : 0), fold = (x - 9) % 5; // 위에만 넓게 걸친 붉은 융 (모서리를 감싸며 부풂 · 아래 끝은 물결 단 · 금 테)
        for (let y = 1; y <= hem; y++) FG.put(g, x, y, y === hem ? (x % 2 ? 'Y' : 'g') : (x === 9 || x === 40) && y > 3 ? (x === 9 ? 'g' : 'G') : y <= 3 ? (t < 0.6 ? 'e' : 'r') : y <= 5 ? (t < 0.7 ? 'r' : 'R') : fold === 1 && t < 0.5 ? 'e' : fold <= 2 ? (t > 0.7 ? 'R' : 'r') : fold === 3 ? 'R' : 'E');
        if ((x - 9) % 6 === 1) { FG.put(g, x, hem + 1, 'g'); FG.put(g, x, hem + 2, 'G'); } } // 술
      FG.rect(g, 8, 4, 8, 6, 'R'); FG.rect(g, 41, 4, 41, 6, 'E'); // 모서리에서 부푼 자락
      for (const [dx, dy] of [[0, -2], [-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2]]) FG.put(g, 24 + dx, 5 + dy, dy <= 0 ? 'Y' : 'g'); FG.put(g, 24, 5, 'r'); // 금실 마름모
      for (const cx of [5, W - 6]) FG.rect(g, cx - 1, 0, cx + 1, 0, (x) => x === cx - 1 ? 'g' : 'G'); // 촛대 받침
      return gOutline(g); };
  }
  // [종류, dx, dy, 막힘(반지름 또는 [가로, 세로]), 벽에 붙음]
  const SR_LAYOUT = {
    shop: st => [['stall', 0, -36, [134, 14]], ['counter', 0, -20, [100, 8]], ['banner', 212, -78, 0, 1], ['banner', -212, -78, 0, 1]], // v3.19 상인 노점은 가운데 · 진열대와 깃발만 (깔개 걸이 · 상자 · 술통 · 가로등 뺌)
    rest: st => [/* v3.12 비스트로: 텐트 · 장작 대신 출장 식당 소품(수레 · 술통 · 볏짚 포대)은 BISTRO가 그림 · 통나무 의자는 그대로 */ ['log', -78, 46, [52, 8]], ['log', 78, 46, [52, 8]], ...(st === 2 ? [['banner', 0, -112, 0, 1]] : [])],
    reward: st => [['statue', -118, -74, 14], ['statue', 118, -74, 14], ['brazier', -64, -36, 9], ['brazier', 64, -36, 9], ['gold', -96, 34, 20], ['coins', 98, 38, 12], /* v2.80 보물 더미 하나 + 작은 금화 더미 하나 */
      ['banner', -196, -86, 0, 1], ['banner', 196, -86, 0, 1], ['brazier', -190, 90, 9], ['brazier', 190, 90, 9]],
    secret: st => [['altar', 0, -11, [92, 14]]], // v1.11 대리석 제단 위 상자 하나만
    shrine: st => [], // v3.25 빛의 방: 시설물 없이 원형 돌바닥 · 세 빛의 마법진 · 빛기둥 · 흰 구체 (51_shrine.js가 바닥과 빛을 그림)
  };
  const SR_TELE = { shop: [-188, 54], rest: [150, 70], reward: [-150, 66], shrine: [-206, 96] };
  const SR_FIRE = { dx: 0, dy: 10 };
  function srPlace(r, stage) {
    r.props = []; r.srp = [];
    const keep = [...Object.keys(r.doors).filter(d => r.doors[d] != null).map(d => doorIn(d, 40)), ...(r.crack ? [doorIn(r.crack.dir, 40)] : []), ...(r.tele ? [r.tele] : [])];
    const fits = (x, y, rad) => x > A.x0 + 6 && x < A.x1 - 6 && y > A.y0 - 4 && y < A.y1 - 4 && !keep.some(q => Math.hypot(q.x - x, q.y - y) < rad + 30);
    for (const [k, dx, dy, blk, wall] of SR_LAYOUT[r.type](stage)) {
      if (k === 'banner' && stage === 1) continue; // 숲엔 걸 벽이 없음
      const rad = Array.isArray(blk) ? blk[0] / 2 : blk || 10;
      let x = CX + dx, y = CY + dy;
      if ((k === 'stall' || k === 'counter') && r.type === 'shop') { const sx = r._stallX != null ? r._stallX : [0, 110, -110].find(o => fits(CX + o, CY - 36, 67)); if (sx == null) continue; r._stallX = sx; x = CX + sx; } // v3.19 상인 노점은 가운데 (북문이 있으면 옆으로)
      else if (k !== 'altar' && !fits(x, y, rad)) { x = CX - dx; if (!fits(x, y, rad)) continue; }
      if (k !== 'counter' && r.srp.some(s => s.k !== 'counter' && s.k !== 'stall' && Math.hypot(s.x - x, s.y - y) < 20)) continue;
      const s = { k, x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2, flip: x < CX && (k === 'skeleton') };
      if (k === 'banner') s.y = Math.round((A.y0 - 4) / 2) * 2; // v3.19 깃발은 작게 · 벽 위쪽에 매닮 (바닥에 서 있지 않게)
      r.srp.push(s);
      if (wall || !blk) continue;
      if (Array.isArray(blk)) { const [w, h] = blk; r.obs.push({ t: 'prop', c: false, x: s.x, y: s.y - h / 2, w, h, x0: s.x - w / 2, y0: s.y - h, x1: s.x + w / 2, y1: s.y }); }
      else r.obs.push({ t: 'prop', c: true, x: s.x, y: s.y - 2, r: blk });
    }
    // 상인: 노점 계산대 뒤에 앉음
    const st0 = r.srp.find(s => s.k === 'stall'); if (st0) r.keeper = { x: st0.x, y: st0.y + 6 };
    if (r.type === 'rest') BISTRO.place(r); // v3.10 쿠키 · 쿠오의 출장 비스트로
    const al = r.srp.find(s => s.k === 'altar'); if (al && r.chest) { al.foot = r.chest.y + 8 - al.y; r.chest.lift = 30; /* v2.80 상자가 윗판 위에 온전히 */ } // 제단은 상자보다 먼저 그림
    r.nav = buildNav(r.obs);
  }
  const SR_FOOT = { stall: 2, counter: 2, statue: 2 };
  // v2.80 시설이 차지하는 그림 칸 (바닥 자국이 겹치지 않게) — 벽에 거는 깃발은 뺌
  function srRect(s) { if (s.k === 'banner') return null; try { const st = G.stage === 4 ? 2 : G.stage, c = srArt(s.k, st, SR[s.k]); const x = s.x - c.width / 2, yb = s.y + (s.foot || 0) + 2; return { x0: x, y0: yb - c.height - (s.k === 'brazier' ? 22 : 0), x1: x + c.width, y1: yb }; } catch (e) { return null; } }
  function drawSR(s) {
    const st = G.stage === 4 ? 2 : G.stage, k = s.k;
    const c = ash4(srArt(k, st, SR[k]), 'sr_' + k);
    const x = (s.x - c.width / 2) & ~1, y = (s.y + (s.foot || 0) - c.height + 2) & ~1;
    if (k !== 'banner') { const xa = x + 4, xb = x + c.width - 4; if (xb > xa) dshRect(ctx, xa, s.y + (s.foot || 0), Math.ceil((xb - xa) / 2) * 2, 2, 0.5); }
    if (s.flip) { ctx.save(); ctx.translate(x + c.width, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0); ctx.restore(); } else ctx.drawImage(c, x, y);
    const fl = Math.floor(time * 10 + s.x * 0.37);
    if (k === 'brazier') { // 그릇 위 불꽃: 칸 단위로 일렁임
      const ph = ((fl % 4) + 4) % 4; let fc = SR_FLAME[ph]; // v1.17 불꽃 4장면을 미리 그려 둠
      if (!fc) fc = SR_FLAME[ph] = gCanvas(fromRows(FLAME2[ph]), { r: '#c83018', F: '#ff6a2a', f: '#ffb040', y: '#fff3c0' }); // v2.80 세 갈래 불꽃 혀 · 흰 심지 · 불티
      ctx.drawImage(fc, x + 2, y - 20);
      if (Math.random() < 0.25) G.parts.push({ x: s.x + rand(-6, 6), y: y - 6, vx: rand(-6, 6), vy: -rand(20, 45), t: rand(0.4, 0.8), c: pick(['#ffb040', '#ff6a2a']), g: 0, glow: true });
    }
  }
  const SR_FLAME = [], FLAME2 = [[".y....f.....", "............", "............", "......FF....", "......FF....", "......ff....", ".....Fff....", ".....FffF...", "...FFfyyF.FF", "...fFfyyF.fF", "..FfffyyFFff", "..fffyyyffff", ".Ffffyyyffff", ".FFffffffFFf"], ["............", "............", "....y....f..", "............", ".....r......", ".....FF.....", ".....FF.F...", ".F...ffFFF..", ".FF.FffFff..", ".ffFFyyfffF.", ".fffFyyffff.", ".fffFyyyfffF", ".ffffyyyfffF", ".FFffffffFFf"], ["............", "..f....y....", ".......r....", ".......F....", "......FF....", "......ffF...", "......ffF...", ".....FffF.F.", ".....FyyF.F.", "...F.fyyfffF", "..FfFfyyfffF", "..ffFyyyfffF", ".Ffffyyyffff", ".FFffffffFFf"], [".....f....y.", "............", "............", ".....r......", ".....F......", "....FFF.....", "....Fff..F..", "..F.FffF.F..", "..F.FyyF.fF.", ".FffFyyfFff.", ".FfffyyfFff.", ".FfffyyyFffF", ".ffffyyyfffF", ".FFffffffFFf"]];
  const SR_LIGHT = { brazier: [-30, 84, '255,150,60', 0.2], stall: [-70, 90, '255,200,120', 0.12] };
  function srLights(lights, R) { if (R.srp) for (const s of R.srp) { const L = SR_LIGHT[s.k]; if (L) lights.push({ x: s.x + (s.k === 'lampPost' ? 14 : s.k === 'stall' ? -56 : 0), y: s.y + L[0], r: L[1] + Math.sin(time * 9 + s.x) * 3, a: 0.75, c: L[2], ca: L[3] }); } }
  // ---- 바닥 그림 (2px 칸, 디더)
  function srFloor(g, R) {
    const st = G.stage, P = srPal(st), px = (x, y, c) => { g.fillStyle = c; g.fillRect(x & ~1, y & ~1, 2, 2); };
    const blot = (cx, cy, rx, ry, lv, col) => { for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) { const q = Math.hypot(x / rx, y / ry); if (q < 1 && dith((cx + x) >> 1, (cy + y) >> 1, lv * (1 - q))) px(cx + x, cy + y, col); } };
    if (R.type === 'shrine') SHRINE.floor(g, px, dith); // v3.25 빛의 방: 원형 돌바닥 + 세 빛의 마법진
    if (R.type === 'shop') { // 물건 아래 짠 깔개: 테두리 띠 · 마름모 줄무늬 · 양끝 술
      const W0 = 160, H0 = 22, x0 = (CX - W0) & ~1, y0 = (CY + 28) & ~1, C = st === 2 ? ['#1e2a44', '#34406a', '#4a5c94', '#b8863a', '#d8c09a'] : st === 3 ? ['#2e1c10', '#5a3418', '#7a4a22', '#c08a3a', '#e0c08a'] : ['#2a1610', '#5a2a1a', '#7e3a22', '#c09040', '#e8d0a0'];
      for (let j = 0; j < H0; j++) for (let i = 0; i < W0; i++) { const e = Math.min(i, W0 - 1 - i, j, H0 - 1 - j); let c = e === 0 ? C[0] : e === 1 ? C[3] : e === 2 ? C[1] : ((i + j) % 8 < 1 || (i - j + 400) % 8 < 1) ? C[2] : (j === H0 >> 1 && i % 4 < 2) ? C[4] : C[1]; if (e > 2 && Math.random() < 0.04) c = C[0]; px(x0 + i * 2, y0 + j * 2, c); }
      for (let j = 1; j < H0 - 1; j += 2) { px(x0 - 2, y0 + j * 2, C[4]); px(x0 + W0 * 2, y0 + j * 2, C[4]); }
      blot(CX - 100, CY - 28, 90, 26, 0.5, 'rgba(0,0,0,.35)'); // 노점 아래 그늘
    }
    if (R.type === 'rest') { const f = { x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy };
      // v3.25 모닥불 화덕 자리: 돌을 둥글게 두른 화덕 · 안쪽 숯 바닥 · 둘레로 번진 그을음과 재 (가장자리는 디더로 바닥에 녹아듦). 천 · 나무 · 짚처럼 불붙는 깔개는 쓰지 않음
      const hsh = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }, cl = v => Math.max(0, Math.min(1, v));
      const vn = (x, y, s, k) => { const X = x / s, Y = y / s, x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, sm = t => t * t * (3 - 2 * t), a = hsh(x0 * 7 + k, y0), b = hsh(x0 * 7 + 7 + k, y0), c = hsh(x0 * 7 + k, y0 + 1), d = hsh(x0 * 7 + 7 + k, y0 + 1), u = sm(fx), v = sm(fy); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
      const SR = 64, SRY = 26, ST = { 1: ['#7a7a70', '#5e5e56', '#42423c'], 2: ['#6e6a78', '#55515f', '#3a3644'], 3: ['#7e7062', '#605448', '#443a30'], 4: ['#86828c', '#686470', '#4a4650'] }[st] || ['#6e6a78', '#55515f', '#3a3644'];
      // 1) 그을음 · 재: 화덕에서 멀수록 옅게, 덩어리 소음으로 가장자리가 들쭉날쭉
      for (let y = -60; y <= 60; y += 2) for (let x = -134; x <= 134; x += 2) { const X = f.x + x, Y = f.y + y, u = Math.hypot(x / 130, y / 56); if (u > 1.05) continue;
        const N = vn(X, Y * 2.2, 14, 21), lv = cl((1 - u) * 1.15 + (N - 0.5) * 0.7) * 0.9; if (!dith(X >> 1, Y >> 1, lv)) { if (u < 0.95 && dith((X >> 1) + 2, (Y >> 1) + 1, 0.05)) px(X, Y, '#6a645c'); continue; } // 가장자리엔 재 티끌
        px(X, Y, u < 0.5 ? (hsh(X, Y) < 0.5 ? '#221e1c' : '#2a2522') : u < 0.78 ? '#332e2a' : '#3e3832'); }
      // 2) 화덕 안쪽: 숯 바닥 + 사그라든 불씨
      for (let y = -SRY; y <= SRY; y += 2) for (let x = -SR; x <= SR; x += 2) { const u = Math.hypot(x / (SR - 7), y / (SRY - 4)); if (u > 1) continue; const X = f.x + x, Y = f.y + y, n = hsh(X * 3, Y);
        px(X, Y, n < 0.04 ? '#c0501a' : n < 0.06 ? '#ff8a3a' : n < 0.4 ? '#1a1614' : '#14100f'); }
      // 3) 화덕 돌: 둥글게 두른 돌 16개 — 두어 개는 빠지거나 밖으로 굴러가 있음
      const NS = 22;
      for (let k = 0; k < NS; k++) { const a = k / NS * TAU + 0.1, r0 = hsh(k, 41); if (r0 < 0.12) continue; const out = r0 > 0.9 ? 1.45 : 1;
        const sx = Math.round((f.x + Math.cos(a) * SR * out) / 2) * 2, sy = Math.round((f.y + Math.sin(a) * SRY * out) / 2) * 2, w = 4 + (hsh(k, 43) < 0.5 ? 1 : 0), h = 3;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const e = (i === 0 || i === w - 1) && (j === 0 || j === h - 1); if (e) continue;
          px(sx + (i - (w >> 1)) * 2, sy + (j - 1) * 2, j === 0 ? ST[0] : j === h - 1 ? ST[2] : ST[1]); }
        px(sx + ((w >> 1) - 1) * 2, sy + 4, '#1a1614'); } // 돌 아래 그늘 한 칸
    }
    if (R.type === 'reward') { // 판석 원판 · 금 상감 고리 · 룬 — v3.25 빛의 방처럼 가장자리가 부서지며 바닥에 녹아듦 (계단 옆면 · 외곽선 없앰)
      const cx = CX, cy = CY - 14, RX = 112, RY = 52, S = [P['1'], P['2'], P['3'], P['4']];
      const hsh = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }, cl = v => Math.max(0, Math.min(1, v));
      const vn = (x, y, s, k) => { const X = x / s, Y = y / s, x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, sm = t => t * t * (3 - 2 * t), a = hsh(x0 * 7 + k, y0), b = hsh(x0 * 7 + 7 + k, y0), c = hsh(x0 * 7 + k, y0 + 1), d = hsh(x0 * 7 + 7 + k, y0 + 1), u = sm(fx), v = sm(fy); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
      for (let y = -RY - 2; y <= RY + 2; y += 2) for (let x = -RX - 2; x <= RX + 2; x += 2) {
        const q = Math.hypot(x / RX, y / RY); if (q > 1) continue;
        const ang = Math.atan2(y / RY, x / RX), ring = q * 5 | 0, seg = ((ang + Math.PI) / TAU * (8 + ring * 4)) | 0, X = cx + x, Y = cy + y, bx = X >> 1, by = Y >> 1;
        const N = vn(X, Y * 2.1, 16, 3), N2 = vn(X, Y * 2.1, 6, 8), keep = 1 - cl((q - 0.72) / 0.28 * 1.15 + (N - 0.5) * 0.9 + (N2 - 0.5) * 0.35);
        if (keep < 1 && !dith(bx, by, keep)) { if (keep > 0.15 && dith(bx + 1, by + 2, 0.12)) px(X, Y, S[3]); continue; } // 깎인 가장자리 · 부스러기
        if (ring >= 3 && hsh(seg * 31 + ring, 17) < (ring - 2) * 0.22) { if (dith(bx, by, 0.16)) px(X, Y, S[3]); continue; } // 바깥 고리 판석이 군데군데 빠짐
        let c = (seg + ring) % 2 ? S[1] : S[2];
        if (Math.abs(q - 0.62) < 0.035 || Math.abs(q - 0.93) < 0.03) c = Math.abs(q - 0.62) < 0.035 ? '#e0a030' : S[3];
        if (q < 0.25) c = (x + y) % 4 ? S[0] : S[1];
        if (q > 0.7 && q < 0.88 && seg % 3 === 0 && Math.abs((q - 0.79)) < 0.04) c = '#ffd060'; // 룬 점
        if ((x * 3 + y * 7) % 37 === 0) c = S[3]; // 금
        px(X, Y, c);
      }
    }
    if (R.type === 'secret') blot(CX, CY - 4, 70, 18, 0.6, 'rgba(0,0,0,.35)'); // v1.11 제단 그늘만
  }
  // 방 종류·챕터별 배치표: [소품, x, y] — 큰 장면 하나가 아니라 이야기가 있는 자리 배치
