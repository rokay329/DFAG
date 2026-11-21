// v3.16 단군의 난입자 의뢰서: 버려진 역참(네로 시작 장소)의 찢긴 의뢰 게시판에서 F → 장마다 한 장
// 정보만 보여 줌 (보상 · 목표 기능 없음). 의뢰인 칸은 모두 찢겨 있음. 그 장에 처음 도착하면 열림 (1장은 처음부터)
const BOUNTY = (() => {
  const LIST = [
    { st: 1, pan: ['invPanda'], n: '붉은 꼬리', sub: '석궁사수', at: '황혼 초원',
      req: '초원 길목에서 원정대를<br>노리는 석궁사수를 쫓아내 주시길 바랍니다.', hab: '거리를 벌리며 화살로 집요하게 노립니다.', memo: '꼬리 색이 눈에 띄니 숨어도 금방 찾는다냥.' },
    { st: 2, pan: ['invReaper'], n: '흑각', sub: '거대한 낫을 든 검은 망토', at: '성채',
      req: '성채 복도에 나타나는 낫잡이를<br>처리해 주십시오.', hab: '어두운 공간의 이점을 이용하여<br>시야에서 자주 사라집니다.', memo: '낫 든 놈한텐 거리가 곧 보수다냥.' },
    { st: 3, pan: ['invShrew', 'invShrewB'], n: '은고리 · 금고리', sub: '쌍둥이 땃쥐 형제', at: '핏빛 엄니 부락',
      req: '원정대의 뒤를 노리는 암살자 형제를<br>처리해 주세요.', hab: '마치 둘이 한 몸처럼 움직이며,<br>차크람으로 쉴 틈 없이 공격합니다.', memo: '형제는 둘이 한 몫이다냥. 보수도 반씩 나누더라냥.' },
    { st: 4, pan: ['invWeasel'], n: '검은 안대', sub: '두 자루의 리볼버', at: '잿빛 왕도',
      req: '왕도 길목의 총잡이의 숨통을<br>끊어 달라.', hab: '두 자루의 리볼버로 쉴 새 없이<br>몰아칩니다.', memo: '의뢰인은 누군지 모르겠지만 이 의뢰는 특히 보수가 두둑하다냥.' },
  ];
  const reached = () => { const b = (typeof SAVE !== 'undefined' && SAVE.best) || 0; return b ? Math.min(4, Math.floor((b - 1) / 11) + 1) : 1; };
  const open1 = it => it.st === 1 || it.st <= reached() || !!(SAVE.rec && SAVE.rec['inv_' + ({ 1: 'panda', 2: 'reaper', 3: 'shrews', 4: 'weasel' })[it.st]]);

  // ---- 도트 텍스처 (2px 칸): 양피지 · 찢긴 자리 · 쪽지 · 단군 발바닥 도장 · 밀랍 봉인
  const C = 2, hsh = (x, y, s) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
  function paper(w, h, seed, base, dark, lite, edge) { // w, h: 칸 수 · 가장자리는 칸 단위로 들쭉날쭉
    const c = document.createElement('canvas'); c.width = w * C; c.height = h * C; const g = c.getContext('2d');
    const bite = (x, y) => { const L = Math.floor(hsh(x, 0, seed) * 3), R = Math.floor(hsh(x, 9, seed) * 3), T = Math.floor(hsh(0, y, seed) * 2), B = Math.floor(hsh(9, y, seed) * 2);
      return y < (x % 7 === 3 ? 1 : 0) || y >= h - Math.max(1, L) || x < (y % 9 === 4 ? 1 : 0) || x >= w - Math.max(0, B) || (y >= h - 3 && hsh(x, y, seed) < 0.12) || (T && 0); };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (bite(x, y)) continue;
      const nearEdge = bite(x - 1, y) || bite(x + 1, y) || bite(x, y - 1) || bite(x, y + 1) || x === 0 || y === 0 || x === w - 1 || y === h - 1;
      const r = hsh(x, y, seed + 1);
      g.fillStyle = nearEdge ? edge : (r < 0.08 ? dark : r > 0.94 ? lite : ((x + y) % 2 && hsh(x >> 3, y >> 3, seed) < 0.3) ? dark : base);
      g.fillRect(x * C, y * C, C, C);
    }
    return c.toDataURL();
  }
  // 의뢰서 한 장: 네 변이 종이마다 다르게 살짝 물결치고, 귀퉁이 하나는 접히거나(fold) 말려 있음(curl) — 장마다 다른 귀퉁이
  // corner: 0 왼쪽 위 · 1 오른쪽 위 · 2 오른쪽 아래 · 3 왼쪽 아래
  function sheetCv(w, h, seed, corner, kind, P) {
    const c = document.createElement('canvas'); c.width = w * C; c.height = h * C; const g = c.getContext('2d');
    const wav = (t, k) => Math.max(0, Math.round(1.2 + Math.sin(t * (0.05 + k * 0.013) + seed * 1.7 + k) * 1.1 + Math.sin(t * 0.21 + k * 2 + seed) * 0.5 + (hsh(t, k, seed) < 0.12 ? 1 : 0)));
    const K = kind === 'fold' ? 13 + (seed % 3) : 10 + (seed % 3);
    const loc = (x, y) => [corner === 1 || corner === 2 ? w - 1 - x : x, corner === 2 || corner === 3 ? h - 1 - y : y]; // 귀퉁이 기준 좌표
    const body = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return false; if (y < wav(x, 0) || y >= h - wav(x, 1) || x < wav(y, 2) || x >= w - wav(y, 3)) return false;
      const [u, v] = loc(x, y); if (kind === 'fold') return u + v >= K; return Math.hypot(K - u, K - v) <= K || u >= K || v >= K; };
    const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x * C, y * C, C, C); };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!body(x, y)) continue;
      const edge = !body(x - 1, y) || !body(x + 1, y) || !body(x, y - 1) || !body(x, y + 1), r = hsh(x, y, seed + 1);
      put(x, y, edge ? P.edge : (r < 0.08 ? P.dark : r > 0.94 ? P.lite : ((x + y) % 2 && hsh(x >> 3, y >> 3, seed) < 0.3) ? P.dark : P.base));
    }
    // 귀퉁이 장식은 따로 위 장(fx)에 그려 본문 · 메모 위에 얹음 (메모가 귀퉁이를 덮지 않게)
    const f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const fg = f.getContext('2d');
    const fput = (x, y, col) => { fg.fillStyle = col; fg.fillRect(x * C, y * C, C, C); };
    const o = 1, at = (u, v) => [corner === 1 || corner === 2 ? w - 1 - o - u : o + u, corner === 2 || corner === 3 ? h - 1 - o - v : o + v];
    if (kind === 'fold') { // 접힌 귀퉁이: 45°로 반듯하게 접지 않고 비스듬히 · 넘어온 뒷면은 끝이 살짝 들려 둥글고, 접힌 선 쪽은 밝고 끝으로 갈수록 어두움
      const a = seed % 2 ? 1 : 1.45, b = seed % 2 ? 1.4 : 1, Ku = K * 1.1 / a, Kv = K * 1.1 / b, n2 = a * a + b * b, k2 = K * 1.1;
      const tx = 2 * k2 * a / n2, ty = 2 * k2 * b / n2;                                        // 귀퉁이 꼭짓점이 넘어온 자리
      const tri = (u, v, A, B, Cc) => { const d = (B[1] - Cc[1]) * (A[0] - Cc[0]) + (Cc[0] - B[0]) * (A[1] - Cc[1]), l1 = ((B[1] - Cc[1]) * (u - Cc[0]) + (Cc[0] - B[0]) * (v - Cc[1])) / d, l2 = ((Cc[1] - A[1]) * (u - Cc[0]) + (A[0] - Cc[0]) * (v - Cc[1])) / d; return l1 >= -0.02 && l2 >= -0.02 && 1 - l1 - l2 >= -0.02; };
      const E1 = [Ku, 0], E2 = [0, Kv], T0 = [tx, ty], flap = (u, v) => tri(u, v, E1, E2, T0) && Math.hypot(u - tx, v - ty) > 1.6; // 끝 한 칸은 들려서 둥글게
      for (let v = 0; v <= Kv + 4; v++) for (let u = 0; u <= Ku + 4; u++) {
        const [x, y] = at(u, v), line = a * u + b * v;
        if (line < k2 - 0.5) { fput(x, y, P.hole); continue; }                                    // 접혀 넘어간 자리 = 뒤 배경
        if (flap(u, v)) { const rim = !flap(u + 1, v) || !flap(u, v + 1) || !flap(u - 1, v) || !flap(u, v - 1), crease = line < k2 + 0.9;
          const t = (line - k2) / (Math.hypot(tx, ty) * Math.hypot(a, b) - k2 + 0.01); fput(x, y, crease ? P.crease : rim ? P.rim : (t * 16 > BAYER[v & 3][u & 3] + 3 ? P.back2 : P.back)); }
        else if (flap(u - 1, v - 1) || flap(u - 2, v - 1)) fput(x, y, P.shade);                  // 들린 뒷면 아래 그늘
      }
    } else { // 말린 귀퉁이: 1/4 원으로 말려 올라간 종이 관 (바깥 어두운 테 · 뒷면 밝은 면 · 안쪽 그늘) + 관 아래 종이에 그늘
      for (let v = 0; v <= K + 3; v++) for (let u = 0; u <= K + 3; u++) { const [x, y] = at(u, v), d = Math.hypot(K + 1 - u, K + 1 - v);
        if (u > K + 1 || v > K + 1) { continue; }
        if (d > K + 1) { fput(x, y, P.hole); continue; }                       // 말려 올라가 비어 보이는 자리
        const t = K + 1 - d; if (t < 1) fput(x, y, P.rim); else if (t < 2) fput(x, y, P.back); else if (t < 3) fput(x, y, P.back2); else if (t < 4) fput(x, y, P.crease); else if (t < 5) fput(x, y, P.shade); }
    }
    return [c.toDataURL(), f.toDataURL()];
  }
  function cells(rows, pal, s = C) { const c = document.createElement('canvas'); c.width = rows[0].length * s; c.height = rows.length * s; const g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.' || !pal[ch]) return; g.fillStyle = pal[ch]; g.fillRect(x * s, y * s, s, s); })); return c.toDataURL(); }
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  // 초상 칸: 위는 밝고 아래로 어두워지는 2px 디더 그라디언트 + 손으로 그은 듯 들쭉날쭉한 먹 테두리 + 난입자는 먹 실루엣
  // 초상: 따로 칸을 두지 않고 양피지 위에 먹 실루엣만 찍음. 둘(땃쥐 형제)이면 한 마리를 크게 앞에, 다른 한 마리는 뒤에서 반쯤 가려지게(조금 옅은 먹)
  function portraitCv(keys) {
    const w = 58, c = document.createElement('canvas'); c.width = w * C; c.height = 2; const g = c.getContext('2d');
    if (typeof ARCH === 'undefined' || !ARCH.pan) return c.toDataURL();
    const ps = keys.map(k => ARCH.pan(k)).filter(Boolean), k2 = 2;
    const hh = Math.max(...ps.map((p, i) => p.rows.length * k2 + (i ? 6 : 0))); c.height = hh * C; const base = hh; // 캔버스는 실루엣 높이에 딱 맞춤 (위 여백 없음)
    const dims = p => ({ w: Math.max(...p.rows.map(r => r.length)), h: p.rows.length });
    const ink = (p, ox, oy, col) => p.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { if (r[x] === '.' || !p.pal[r[x]]) continue; g.fillStyle = col; g.fillRect((ox + x * k2) * C, (oy + y * k2) * C, k2 * C, k2 * C); } });
    const front = ps[0], fd = dims(front), fx = Math.round((w - fd.w * k2) / 2) + (ps.length > 1 ? 6 : 0), fy = base - fd.h * k2;
    if (ps[1]) { const bd = dims(ps[1]); ink(ps[1], fx - 16, base - 6 - bd.h * k2, '#6a5438'); } // 뒤의 한 마리: 왼쪽 위로 비켜 서서 반쯤 가려짐
    ink(front, fx, fy, '#2a1c12');
    { const d = g.getImageData(0, 0, c.width, c.height).data, row = y => { for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3]) return true; return false; }; // 위 · 아래 빈 줄 잘라 냄
      let t = 0, b = c.height - 1; while (t < b && !row(t)) t++; while (b > t && !row(b)) b--;
      const o = document.createElement('canvas'); o.width = c.width; o.height = b - t + 1; o.getContext('2d').drawImage(c, 0, -t); return o.toDataURL(); }
  }
  // 구분선: 먹으로 그은 가는 선 · 양 끝은 디더로 흐려지고 가운데엔 작은 마름모 장식
  function divider() {
    const w = 170, h = 5, c = document.createElement('canvas'); c.width = w * C; c.height = h * C; const g = c.getContext('2d'), m = w >> 1;
    const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x * C, y * C, C, C); };
    for (let x = 0; x < w; x++) { const d = Math.abs(x - m); if (d < 5) continue; const fade = x < 22 ? x / 22 : x > w - 23 ? (w - 1 - x) / 22 : 1;
      if (fade * 16 > BAYER[2][x & 3] * 1 + (x & 1 ? 0 : 4)) put(x, 2, d < 30 ? '#4a3420' : '#6a5236'); }
    for (const [dx, dy, col] of [[0, 0, '#5a1a14'], [-1, 1, '#5a1a14'], [1, 1, '#5a1a14'], [0, 1, '#a8382a'], [-2, 2, '#5a1a14'], [2, 2, '#5a1a14'], [-1, 2, '#a8382a'], [0, 2, '#d8604a'], [1, 2, '#a8382a'], [-1, 3, '#5a1a14'], [1, 3, '#5a1a14'], [0, 3, '#a8382a'], [0, 4, '#5a1a14'], [-4, 2, '#4a3420'], [4, 2, '#4a3420']]) put(m + dx, dy, col);
    return c.toDataURL();
  }
  // 양초 밀랍 인장: 울퉁불퉁 녹아 퍼진 테두리 · 왼쪽 위 빛 · 오른쪽 아래 그늘 · 도드라진 테 · 가운데 눌린 발바닥 문양 · 아래로 흘러내린 방울
  function waxSeal() {
    const n = 26, c = document.createElement('canvas'); c.width = n * C; c.height = (n + 4) * C; const g = c.getContext('2d'), cx = 12.5, cy = 12.5;
    const rad = a => 10.2 + Math.sin(a * 5 + 0.7) * 0.7 + Math.sin(a * 3 + 2) * 0.5;
    const drip = (x, y) => (x >= 15 && x <= 16 && y >= 21 && y <= 23) || (x === 15 && y === 24) || (x === 16 && y === 24); // 녹아 흘러내린 방울 하나 (둥근 끝)
    const wax = (x, y) => { const dx = x - cx, dy = y - cy, a = Math.atan2(dy, dx); return Math.hypot(dx, dy) <= rad(a) || drip(x, y); };
    const PAWC = ['..o.o.o..', '..o.o.o..', '.........', '...ooo...', '..ooooo..', '..ooooo..', '...o.o...'];
    const inPaw = (x, y) => { const px = x - 8, py = y - 9; return py >= 0 && py < PAWC.length && px >= 0 && px < 9 && PAWC[py][px] === 'o'; };
    for (let y = 0; y < n + 4; y++) for (let x = 0; x < n; x++) { // 종이에 드리운 그림자 (오른쪽 아래로 1칸)
      if (!wax(x, y) && wax(x - 1, y - 1)) { g.fillStyle = 'rgba(70,46,24,.45)'; g.fillRect(x * C, y * C, C, C); } }
    for (let y = 0; y < n + 4; y++) for (let x = 0; x < n; x++) {
      if (!wax(x, y)) continue;
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), r = rad(Math.atan2(dy, dx)), lit = (-dx - dy) / 14; // 왼쪽 위가 밝음
      let col;
      if (drip(x, y) && d > r) col = y === 24 ? '#5a1014' : x === 15 ? '#c0383a' : '#7a1418';
      else if (d > r - 1.2) col = lit > 0.2 ? '#c0383a' : lit < -0.3 ? '#4a0e10' : '#8e1c20';        // 바깥 가장자리 (녹아 퍼진 끝)
      else if (d > r - 3.2) col = lit > 0.35 ? '#f08070' : lit > 0 ? '#d84a44' : lit < -0.4 ? '#7a1418' : '#b02a2c'; // 도드라진 테
      else if (d > r - 4.2) col = lit > 0 ? '#7a1418' : '#d84a44';                                    // 테 안쪽 턱 (빛 반대)
      else col = inPaw(x, y) ? '#6a1216' : '#a02428';                                                  // 눌린 바닥 · 발바닥 홈
      if (!inPaw(x, y) && inPaw(x - 1, y - 1) && d <= r - 4.2) col = '#c8423e';                         // 홈의 오른쪽 아래 턱에 빛
      g.fillStyle = col; g.fillRect(x * C, y * C, C, C);
    }
    return c.toDataURL();
  }
  // 찢겨 나간 의뢰인 이름: 양피지가 들쭉날쭉 뜯겨 나가 뒤의 게시판 나무가 보이고, 뜯긴 가장자리는 하얀 종이 결 · 위쪽 안에는 그늘 · 오른쪽 끝엔 덜 뜯긴 종이 조각이 말려 있음
  function tornHole() {
    const w = 64, h = 14, c = document.createElement('canvas'); c.width = w * C; c.height = h * C; const g = c.getContext('2d');
    const top = x => 3 + Math.round(Math.sin(x * 0.55) * 1.2 + Math.sin(x * 1.7 + 1) * 0.8 + hsh(x, 1, 13) * 1.2), bot = x => h - 3 - Math.round(Math.sin(x * 0.4 + 2) * 1.1 + hsh(x, 2, 13) * 1.4);
    const L = y => 3 + Math.abs(y - 6) + (y % 3 === 0 ? 1 : 0), Rr = y => w - 8 - Math.abs(y - 6) - (y % 2);
    const hole = (x, y) => x >= L(y) && x <= Rr(y) && y >= top(x) && y <= bot(x);
    const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x * C, y * C, C, C); };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const near1 = hole(x - 1, y) || hole(x + 1, y) || hole(x, y - 1) || hole(x, y + 1), near2 = !near1 && (hole(x - 2, y) || hole(x + 2, y) || hole(x, y - 2) || hole(x, y + 2) || hole(x - 1, y - 1) || hole(x + 1, y + 1));
      if (hole(x, y)) put(x, y, !hole(x, y - 1) || !hole(x, y - 2) ? '#2a1a10' : (y + (x >> 3)) % 4 === 0 ? '#3a2818' : '#4e3626'); // 뒤의 게시판 나무 (위쪽 안은 종이 그늘)
      else if (near1) put(x, y, hsh(x, y, 17) < 0.75 ? '#fbf3dc' : '#efe4c6'); // 뜯긴 하얀 종이 결
      else if (near2 && hsh(x, y, 19) < 0.6) put(x, y, '#e6d9b8');
    }
    for (const [x, y, col] of [[w - 7, 3, '#e8dcbc'], [w - 6, 3, '#d6c6a0'], [w - 7, 4, '#d6c6a0'], [w - 6, 4, '#c4b088'], [w - 5, 4, '#e8dcbc'], [w - 6, 5, '#c4b088'], [w - 5, 5, '#a8916a'], [w - 5, 6, '#8e7652']]) put(x, y, col); // 말려 올라간 조각
    return c.toDataURL();
  }
  const PAW = ['.r.r.r.', '.r.r.r.', '.......', '..rrr..', '.rrrrr.', '.rrrrr.', '..r.r..']; // 발가락 세 개 (비스트로 간판과 같은 발바닥)
  const NAIL = ['.kkkk.', 'kwhhmk', 'khhmmk', 'khmmdk', 'kmmddk', '.kkkk.', '..ss..']; // 못 머리 (왼쪽 위 빛 · 오른쪽 아래 그늘) + 종이에 진 그림자
  let tex = null;
  const SHP = { base: '#d8c7a0', dark: '#c9b68c', lite: '#e6d8b6', edge: '#a88e62', back: '#f0e6cc', back2: '#ddd0ae', crease: '#8e7450', rim: '#7a6240', shade: '#a8916a', hole: '#120e15' };
  const SHP_OLD = { base: '#bfae88', dark: '#b09e78', lite: '#ccbc96', edge: '#8e7650', back: '#d8caa6', back2: '#c4b48e', crease: '#76603e', rim: '#62502f', shade: '#958058', hole: '#120e15' };
  function textures() {
    if (tex) return tex;
    tex = {
      sheets: [[2, 'fold'], [0, 'curl'], [3, 'fold'], [1, 'curl']].map(([cn, kd], i) => sheetCv(235, 150, 3 + i * 7, cn, kd, SHP)),
      note: paper(184, 30, 7, '#f1e9d6', '#e6dcc4', '#f8f2e4', '#c4b08a'), // 양피지보다 밝은 종이
      torn: tornHole(),
      sealedS: [[2, 'fold'], [0, 'curl'], [3, 'fold'], [1, 'curl']].map(([cn, kd], i) => sheetCv(235, 150, 5 + i * 7, cn, kd, SHP_OLD)),
      rule: divider(), paw: cells(PAW, { r: '#a8382a' }, 3), seal: waxSeal(), nail: cells(NAIL, { k: '#2a2630', w: '#e8eaf0', h: '#b8bcc8', m: '#8a8e9c', d: '#5a5e6c', s: '#8e7652' }, 3),
    };
    return tex;
  }

  // ---- 창
  let el = null, cur = 0, prevMode = null; const porCache = {};
  function css() {
    if (document.getElementById('bntCss')) return;
    const s = document.createElement('style'); s.id = 'bntCss'; s.textContent = `
  #ovBounty { z-index: 41; }
  .bntWin { width: 660px; height: 404px; max-width: 96%; display: flex; flex-direction: column; }
  .bntWin h2 { text-align: center; }
  .bntSub { font: 10px 'Galmuri9'; color: var(--quiet); margin: -4px 0 8px; text-align: center; }
  .bntTabs { display: flex; gap: 3px; margin-bottom: 8px; }
  .bntTab { flex: 1; font: 10px 'Galmuri9'; color: var(--quiet); background: rgba(0,0,0,.4); border: 1px solid #2a2430; padding: 4px 0; cursor: pointer; text-align: center; }
  .bntTab.on { color: var(--gold-l); border-color: var(--gold-d); background: #241c14; }
  .bntTab.lock { color: var(--dim); }
  .bntStage { flex: 1; min-height: 0; position: relative; background: #120e15; border: 1px solid #000; box-shadow: inset 0 0 0 1px #3a2f40; display: flex; align-items: center; justify-content: center; }
  .bntSheet { position: relative; width: 470px; height: calc(100% - 10px); max-height: 290px; background-size: 100% 100%; image-rendering: pixelated; color: #3a2a1a; }
  .bntSheet .bntFx { position: absolute; inset: 0; width: 100%; height: 100%; image-rendering: pixelated; z-index: 2; pointer-events: none; }
  .bntSheet .nail { position: absolute; left: 50%; top: -5px; margin-left: -9px; z-index: 1; image-rendering: pixelated; }
  .bntSheet .ttl { position: absolute; left: 0; right: 0; top: 28px; text-align: center; font: bold 14px 'Galmuri11'; letter-spacing: 8px; color: #5a1a14; }
  .bntSheet .rule { position: absolute; left: 50%; margin-left: -170px; top: 50px; width: 340px; image-rendering: pixelated; }
  .bntRow { position: absolute; left: 14px; right: 18px; top: 72px; display: flex; align-items: flex-end; gap: 8px; } /* 왼쪽(실루엣 · 이름) 아랫선 = 오른쪽(습성 마지막 줄) 아랫선 */
  .bntL { width: 132px; margin-left: 70px; margin-right: -40px; flex: none; display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .bntPor { width: 116px; image-rendering: pixelated; display: block; }
  .bntPor img { image-rendering: pixelated; display: block; } .bntPor img + img { margin-left: -40px; }
  .bntName { text-align: center; font: bold 12px 'Galmuri11'; color: #6a1a14; }
  .bntName small { display: block; font: 9px 'Galmuri7'; color: #6a5236; margin-top: 3px; font-weight: normal; }
  .bntF { flex: 1; display: grid; grid-template-columns: 44px 1fr; gap: 7px 6px; font: 10px/1.45 'Galmuri9'; }
  .bntF b { font: 9px/1.6 'Galmuri7'; color: #7a5a36; font-weight: normal; border-right: 2px solid #b09a70; padding-right: 4px; text-align: right; }
  .bntF .torn { height: 28px; width: 128px; margin: -7px 0 -6px -6px; background-size: 100% 100%; image-rendering: pixelated; }
  .bntNote { position: absolute; left: 16px; right: 16px; bottom: 14px; height: 60px; background-size: 100% 100%; image-rendering: pixelated; transform: none; padding: 9px 12px 0 66px; box-sizing: border-box; font: 9px/1.5 'Galmuri9'; color: #4a3414; }
  .bntNote .h { font: 8px 'Galmuri7'; color: #8a7050; margin-bottom: 2px; }
  .bntNote .seal { position: absolute; left: 10px; top: 50%; width: 46px; margin-top: -27px; image-rendering: pixelated; } /* 단군의 밀랍 인장 */
  .bntSheet.lock .seal { position: absolute; left: 50%; top: 50%; width: 104px; margin: -62px 0 0 -52px; image-rendering: pixelated; }
  .bntSheet.lock .lk { position: absolute; left: 0; right: 0; top: 196px; text-align: center; font: 10px/1.6 'Galmuri9'; color: #5a4430; }
  .bntKeys { margin-top: 7px; display: flex; justify-content: center; gap: 14px; font: 9px 'Galmuri7'; color: var(--quiet); }
  .bntKeys .key { margin-right: 4px; }`;
    document.head.appendChild(s);
  }
  function build() {
    if (el) return el; css();
    el = document.createElement('div'); el.className = 'ov'; el.id = 'ovBounty';
    el.innerHTML = `<div class="pf win bntWin"><h2>단군의 의뢰 게시판</h2><div class="bntSub">수수료는 의뢰당 은화 20개라냥!</div><div class="bntTabs"></div><div class="bntStage"></div>
      <div class="bntKeys"><span><span class="key">←</span><span class="key">→</span>넘기기</span><span><span class="key">F</span><span class="key">ESC</span>닫기</span></div></div>`;
    (document.getElementById('ovPop') || document.body).parentNode.appendChild(el);
    el.addEventListener('click', e => { const t = e.target.closest('.bntTab'); if (t) { cur = +t.dataset.i; sfx('blip'); render(); } else if (e.target === el) close(); });
    return el;
  }
  function render() {
    const T = textures(), tabs = el.querySelector('.bntTabs'), stg = el.querySelector('.bntStage');
    tabs.innerHTML = LIST.map((it, i) => `<div class="bntTab${i === cur ? ' on' : ''}${open1(it) ? '' : ' lock'}" data-i="${i}">${it.st}장 · ${open1(it) ? it.n : '???'}</div>`).join('');
    const it = LIST[cur];
    if (!open1(it)) {
      stg.innerHTML = `<div class="bntSheet lock" style="background-image:url(${T.sealedS[cur][0]})"><img class="bntFx" src="${T.sealedS[cur][1]}"><img class="nail" src="${T.nail}"><div class="ttl">의뢰서</div><img class="rule" src="${T.rule}">
        <img class="seal" src="${T.seal}"><div class="lk">아직 봉인된 의뢰서입니다.<br>${it.st}장에 처음 도착하면 열립니다.</div></div>`;
      return;
    }
    stg.innerHTML = `<div class="bntSheet" style="background-image:url(${T.sheets[cur][0]})"><img class="bntFx" src="${T.sheets[cur][1]}"><img class="nail" src="${T.nail}"><div class="ttl">의뢰서</div><img class="rule" src="${T.rule}">
      <div class="bntRow"><div class="bntL"><img class="bntPor" src="${porCache[cur] || (porCache[cur] = portraitCv(it.pan))}"><div class="bntName">${it.n}<small>${it.sub}</small></div></div>
      <div class="bntF"><b>출몰</b><span>${it.at}</span><b>의뢰인</b><span><div class="torn" style="background-image:url(${T.torn})"></div></span><b>의뢰</b><span>${it.req}</span><b>습성</b><span>${it.hab}</span></div></div>
      <div class="bntNote" style="background-image:url(${T.note})"><div class="h">중개인 메모</div>「${it.memo}」<img class="seal" src="${T.seal}"></div></div>`;
  }
  function onKey(e) {
    if (!el || !el.classList.contains('on')) return;
    const k = e.key.toLowerCase();
    if (k === 'escape' || k === 'f') close();
    else if (k === 'arrowleft' || k === 'a') { cur = (cur + LIST.length - 1) % LIST.length; sfx('blip'); render(); }
    else if (k === 'arrowright' || k === 'd') { cur = (cur + 1) % LIST.length; sfx('blip'); render(); }
    else if (k >= '1' && k <= '4') { cur = +k - 1; sfx('blip'); render(); }
    else return;
    e.preventDefault(); e.stopImmediatePropagation();
  }
  addEventListener('keydown', onKey, true);
  function open() {
    build(); prevMode = mode; mode = 'bounty'; G.prompt = null;
    for (const k in keys) keys[k] = false; for (const k in pressed) pressed[k] = false;
    render(); el.classList.add('on'); sfx('select');
  }
  function close() { if (!el) return; el.classList.remove('on'); sfx('blip'); if (mode === 'bounty') mode = prevMode || 'play'; for (const k in pressed) pressed[k] = false; }
  return { open, close, LIST, get on() { return !!(el && el.classList.contains('on')); }, _set: i => { cur = i; if (el) render(); } };
})();
