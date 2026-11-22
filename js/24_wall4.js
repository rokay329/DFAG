'use strict';
// 잿빛 왕관 원정대 — 24_wall4.js (v2.92) : 4장 잿빛 왕도 윗벽 고유 요소 (시안 4장_윗벽_고유요소_시안.html B안)
// 벽돌 · 기둥 자리 · 창 자리 배치는 성채 그대로 두고, 기둥 · 기둥 깃발 · 창 · 벽 장식만 4장 것으로 바꾼다.
// 재로 바꾸는 단계(ashImg) 바로 뒤에 제 색으로 덧칠한다 (재 바닥 · 문보다 먼저).
const WALL4 = (() => {
  const PAL = {
    k: '#0b0a09', a: '#d4cec2', h: '#8e887e', l: '#6e6860', d: '#4e4a44', D: '#34312d', j: '#1c1a1e',
    p: '#c8b898', P: '#9a8a6a', q: '#6e604a',
    g: '#d8b860', G: '#a08038', o: '#6e5626',
    r: '#a83a34', R: '#7a2428', x: '#4a1a1c',
    e: '#ff9a40', E: '#d0501c', y: '#f0dc98',
    i: '#7c7a84', I: '#55535c', J: '#3a3940',
    w: '#5e4c3a', W: '#45372a', c: '#30261e', C: '#17120f',
  };
  const ART = {
    // 포고문: 못 하나에 걸린 왕실 포고문, 뒤에 한 장 더 · 붉은 밀랍 봉인
    edict: [
      '...kk......',
      '..kiJk.....',
      'kkkkIkkkk..',
      'kappapppakk',
      'kpqqqqqppPk',
      'kppppppppPk',
      'kplllllppPk',
      'kppppppppPk',
      'kpllllllpPk',
      'kppppppppPk',
      'kplllprrpPk',
      'kpppprRRpPk',
      'kPpPpkxRkPk',
      '.kPk.k.kkqk',
      '..k.....kk.',
    ],
    // 그을린 초상: 왕관을 쓴 인물, 얼굴만 타서 지워짐
    portrait: [
      'kkkkkkkkkkkk',
      'kgggggggggok',
      'kgjjjjjjjjok',
      'kgjjjgjgjjok',
      'kgjjjgggjjok',
      'kgjjCCCCjjok',
      'kgjECDCCEjok',
      'kgjjjCCjjjok',
      'kgjRRxhRRjok',
      'kgjRRRhRRjok',
      'kgRRRRRRRRok',
      'kgoooooooook',
      'kkkkkkkkkkkk',
    ],
    // 벽걸이 종: 쇠 팔걸이에 매단 작은 종, 금이 감 (외곽선은 gOutline)
    bell: [
      'iI.........',
      'II.........',
      'IIiiiiiI...',
      '......J....',
      '.....gGo...',
      '....gGGGo..',
      '....gGoGo..',
      '...gGGoGGo.',
      '...gGGGoGo.',
      '..gGGGGGGGo',
      '......o....',
    ],
    // 녹아내린 금 문장: 왕관과 보석이 새겨진 방패, 아래로 금이 흘러내림 (외곽선은 gOutline)
    crest: [
      '.............',
      '.gggggggggGo.',
      '.gGGGGGGGGGo.',
      '.gGGoGoGoGGo.',
      '.gGGoooooGGo.',
      '.gGGooRooGGo.',
      '.gGGGGGGGGGo.',
      '.gGGGGGGGGGo.',
      '..gGGGGGGGo..',
      '..gGGGGGGGo..',
      '..g.gGGGGo.o.',
      '..G..gGGo..o.',
      '..G...gG.....',
      '..o...gG.....',
      '......Go.....',
      '......o......',
      '.............',
    ],
    // 유골 단지 (벽감 안에 넣음, 외곽선은 gOutline)
    urnNiche: [ // v3.20 유골함을 앉힌 벽감 (항아리 · 넘친 재까지 한 장으로 구움)
      '...kkkkkkkk...',
      '..kllllllllk..',
      '.klJJJkkJJJlk.',
      'klJJJkahkJJJlk',
      'klJJkhaahkJJlk',
      'klJJJkddkJJJlk',
      'klJJkhlldkJJlk',
      'klJkhllldDkJlk',
      'klJkhlllDDkJlk',
      'klJklllldDkJlk',
      'klJhaldDDhahlk',
      'kllllkkkklllk.',
      'kkkkkkkkkkkkk.',
    ],
  };
  const SLOT = { tapestry: 'edict', shieldSwords: 'crest', portrait: 'portrait', chains: 'bell', skullNiche: 'urn' };
  const G4 = {}; for (const k in ART) G4[k] = fromRows(ART[k]);
  G4.bell = gOutline(G4.bell); G4.crest = gOutline(G4.crest);
  G4.urn = G4.urnNiche;
  const hex = s => { const v = parseInt(s.slice(1), 16); return [v >> 16, (v >> 8) & 255, v & 255]; };
  const toHex = ([r, g, b]) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const ashHex = s => toHex(ashPx(...hex(s)));
  // 창: 바깥 도시가 불타는 잉걸빛 + 지붕 실루엣 (9칸 × 18칸, 위는 아치)
  function genWindow() { // 돌 테 아치 창 · 창살 · 아래로 갈수록 붉게 타오르는 도시 · 지붕과 첨탑 실루엣
    return fromRows([
      '...kkkkk...',
      '..klllldk..',
      '.klxxxxxdk.',
      'kdxxxJxxxdk',
      'kdxxxJxxxdk',
      'kdxRxJxRxdk',
      'kdRxRJRxRdk',
      'kdRRRJRRRdk',
      'kdJJJJJJJdk',
      'kdRERJRERdk',
      'kdEREJEREdk',
      'kdEEEJEEEdk',
      'kdEeEJEkEdk',
      'kdeeeJekedk',
      'kdkeeJkkkdk',
      'kdkkyJkkkdk',
      'kdkkkJkkkdk',
      'klllllllldk',
      'kkkkkkkkkkk',
    ]);
  }
  const WIN = genWindow();
  // 기둥 깃발: 그을린 왕실 깃발, 아래가 타서 해짐
  const BANNER = fromRows([
    'kIiIiIiIk',
    '.kRrRRRk.',
    '.krRRRRk.',
    '.krgRgRk.',
    '.krgggRk.',
    '.krGGGRk.',
    '.krRRRRk.',
    '.krRRRRk.',
    '.krRRxRk.',
    '.kxRRRxk.',
    '.kCxRkCk.',
    '..kCkEk..',
    '...k.k...',
  ]);
  // ---------------- 기둥 (가로 11칸: 몸통 9칸 + 띠·받침이 양옆으로 1칸씩)
  function genColumn(rows, x0seed) { // 금박이 벗겨진 왕실 석주 · 세로 홈 · 머리띠와 받침 위에 쌓인 재
    const g = mkGrid(11, rows), bot = rows - 1;
    for (let y = 0; y < rows; y++) for (let x = 1; x <= 9; x++) g[y][x] = x === 1 || x === 9 ? 'k' : x === 2 ? 'h' : x === 4 || x === 6 ? 'D' : x >= 8 ? 'D' : x === 3 ? 'l' : 'd';
    const ring = (y, h2) => { for (let x = 0; x <= 10; x++) { g[y - 1][x] = 'k'; for (let k = 0; k < h2; k++) g[y + k][x] = x === 0 || x === 10 ? 'k' : k === 0 ? (x < 4 && hsh2(x0seed + x, y) > 0.3 ? 'g' : 'G') : (x > 6 || hsh2(x0seed + x, y + k) < 0.35 ? 'o' : 'G'); g[y + h2][x] = 'k'; } };
    const cap = Math.max(4, bot - 78); ring(cap, 3); for (let x = 1; x <= 9; x++) if (hsh2(x0seed + x, 3) < 0.7) { g[cap - 1][x] = x < 5 ? 'a' : 'h'; g[cap - 2][x] = hsh2(x, 4) < 0.5 ? 'k' : '.'; }
    for (let y = cap - 2; y >= 0; y--) for (let x = 1; x <= 9; x++) if (g[y][x] === '.') g[y][x] = x === 1 || x === 9 ? 'k' : x === 2 ? 'h' : x === 4 || x === 6 || x >= 8 ? 'D' : x === 3 ? 'l' : 'd';
    ring(bot - 8, 2);
    for (let y = bot - 5; y <= bot; y++) for (let x = 0; x <= 10; x++) g[y][x] = x === 0 || x === 10 || y === bot - 5 ? 'k' : x <= 2 ? 'l' : x >= 8 ? 'D' : 'd';
    for (let k = 0; k < 2; k++) { const cx = 3 + Math.floor(hsh2(x0seed, k) * 4), cy = cap + 10 + Math.floor(hsh2(k, x0seed) * 30); for (let s = 0; s < 3; s++) if (g[cy + s] && g[cy + s][cx + (s % 2)] !== 'k') g[cy + s][cx + (s % 2)] = 'j'; }
    return g;
  }
  const hsh2 = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  
  function paint(g, R) {
    const T0 = A.y0 - 100, slots = PILLARS.slice(0, -1).map((x, i) => [i, Math.round((x + PILLARS[i + 1]) / 4) * 2]);
    // 창 자리: 성채 장식은 4장 장식으로, 빈 창은 잉걸빛 창으로
    for (const [i, mx] of slots) {
      if (R.sealW && Math.abs(mx - DOOR.n.x) < 110) continue;
      if (Math.abs(mx - DOOR.n.x) < (R.doors && R.doors.n != null ? 40 : 8)) continue; // v3.19 북문 위엔 창 · 장식 없음
      const k0 = ROOMSTYLE.wall ? ROOMSTYLE.wall[i % ROOMSTYLE.wall.length] : 'window', k = SLOT[k0];
      let put = !!k; const art = k && G4[k];
      if (put) { const w0 = art[0].length * 2, h0 = art.length * 2, y0 = T0 + 30 - h0 / 2 + (k === 'edict' ? 4 : 0); if (typeof OCC !== 'undefined' && !OCC.wall(mx - w0 / 2, y0, w0, h0)) put = false; }
      g.drawImage(g.canvas, mx + 22, Math.max(0, T0 - 2), 28, 52, mx - 14, Math.max(0, T0 - 2), 28, 52); // 옆 벽돌을 그대로 옮겨 창을 메움 (벽돌 무늬 주기 18px의 배수만큼 옆)
      if (!put) { gPaint(g, WIN, PAL, mx - 11, T0 + 8); continue; } // 창은 성채 창보다 10px 낮게
      const w = art[0].length * 2, h = art.length * 2;
      gPaint(g, art, PAL, mx - w / 2, T0 + 30 - h / 2 + (k === 'edict' ? 4 : 0));
    }
    // 기둥과 깃발
    const rows = Math.ceil((A.y0 + 4) / 2) + 1;
    PILLARS.forEach((x, i) => {
      const pg = genColumn(rows, i * 7 + 3);
      gPaint(g, pg, PAL, x - 11, A.y0 + 6 - rows * 2);
      if (i % 2 === 1) gPaint(g, BANNER, PAL, x - 9, T0 + 2);
    });
  }
  const on = () => G && G.stage === 4 && !(G.dun && G.dun.forge) && typeof CUR_ROOM !== 'undefined' && CUR_ROOM && CUR_ROOM.type !== 'altar';
  { const o = paintCastleWall; paintCastleWall = function (g) { if (on()) return; return o(g); }; }
  { const o = ashImg; ashImg = function (cx, w, h) { o(cx, w, h); if (cx === fg && on()) paint(cx, CUR_ROOM); }; }
  return { arts: G4, paint, ART, PAL, WIN, BANNER, genColumn };
})();
