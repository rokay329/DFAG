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
  const SK_META = { hourglass: { L: '시간 정지', Li: 'hourglass' }, ladle: { K: '끓는 수프', Ki: 'soup' } }; // 무기가 기술 자체를 바꾸면 이름·아이콘도 바꾼다
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
      <div class="kr">${k('왼쪽 끌기', '이동')}${k('공격', '가까운 적 자동 조준')}${k('스킬', C.skill)}${k('각성', C.awaken)}${k('점멸', '회피')}</div>
      <div class="kr">${k('F', '상호작용')}${k('지도', '방 지도·순간이동')}${k('가방', '장비')}${k('❚❚', '일시정지')}</div>
      <div class="kh">적의 공격 직전에 점멸하면 퍼펙트 회피가 됩니다. 화면을 탭하면 그쪽으로 공격합니다.</div>`;
    return `<div class="kt">조작 안내</div>
      <div class="kr">${k('WASD', '이동')}${k('좌클릭', '공격')}${k('우클릭', C.skill)}${k('E', C.awaken)}${k('SPACE', '점멸')}</div>
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
    const statusTags = G.buffs.map(b => `<span class="tag">${BUFFS[b].t}</span>`).join('') + (P.awakenT > 0 || P.state === 'awaken' ? '<span class="tag aw">각성</span>' : '') + (P.state === 'storm' ? '<span class="tag aw">폭풍</span>' : '') + (P.poisonT > 0 ? '<span class="tag" style="background:#4a2060;color:#d8b0ff">중독</span>' : '');
    /* 유물은 패널에 표시하지 않음 (장비창에서 확인) */
    if (statusTags !== hudPrev.status) { $('p1status').innerHTML = statusTags; hudPrev.status = statusTags; }
    // 페이즈
    { const R = G.dun && G.dun.cur, rs = G.rs || {};
      $('phaseText').textContent = R ? `${G.stage} · ${roomName(R.type)}` : '';
      let sub = ''; // v2.51 방 모양·봉인 글자는 빼고, 전투 중일 때만 남은 적 (보스 문 열쇠는 따로 #bkPanel)
      if (R && R.type === 'survive' && rs.state === 'run') { const left = SURV_PT() - (rs.phT || 0), al = G.enemies.filter(e => !e.dead).length; sub = rs.ph >= SURV_N - 1 && left <= 0 ? `남은 적 ${al}` : `남은 시간 ${Math.max(0, Math.ceil(left))}초`; }
      else if (R && R.waves && (rs.state === 'run' || rs.state === 'intro')) sub = `남은 적 ${G.enemies.filter(e => !e.dead).length + G.spawning}`;
      if (sub !== hudPrev.phSub) { hudPrev.phSub = sub; $('phaseSub').textContent = sub; }
      updateBossKeys(); }
    if (hudPrev.hearts !== G.stage) { hudPrev.hearts = G.stage; $('hearts').innerHTML = `<span class="f7" style="color:var(--quiet)">STAGE ${G.stage} · ${STG().n}${G.asc ? ` · <b style="color:#ffb040">잿불 ${G.asc}</b>` : ''}</span>`; }
    // 스킬: 공격 콤보 단계
    const step = G.cls === 'mage' ? (P.boltN || 0) % 3 : G.cls === 'gunner' ? (P.reload > 0 ? 0 : 3) : P.state === 'attack' ? P.combo + 1 : P.comboWin > 0 ? P.combo : 0;
    if (G.cls === 'gunner') setCnt('skA', gunMag() !== GUN_MAG ? P.ammo : null); else setCnt('skA', null);
    if (G.cls === 'gunner') setSkill('skA', P.reload <= 0 && P.ammo > 0 && !P.dead, (P.reload / (P.reloadMax || GUN_RELOAD)) * 100, '');
    $('comboPips').style.display = G.cls === 'gunner' ? 'none' : ''; // 거너 사격 칸에는 연타 단계 칸이 필요 없음
    $('comboPips').querySelectorAll('b').forEach((b, i) => b.classList.toggle('on', i < step));
    // 돌진 참격
    const charges = skMax('K'), total = Math.max(1, CL().skillCd * (1 - s.cdr) * (1 - pasV('kcd')) - (uncK() === 'priest13' ? 1 : 0));
    const readyN = P.chargeCd.slice(0, charges).filter(c => c <= 0).length;
    const minCd = Math.min(...P.chargeCd.slice(0, charges));
    const kReady = readyN > 0 && !P.dead;
    setSkill('skK', kReady, (minCd / total) * 100, kReady ? '' : Math.ceil(minCd));
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
    const b = G.boss;
    $('boss').style.display = b ? 'block' : 'none';
    if (b) {
      b.hpBack = b.hpBack == null ? b.hp : b.hpBack + (b.hp - b.hpBack) * 0.06;
      $('bossfill').style.width = `${clamp(b.hp / b.maxHp, 0, 1) * 100}%`;
      $('bossback').style.width = `${clamp(b.hpBack / b.maxHp, 0, 1) * 100}%`;
      $('grogifill').style.width = `${!b.grogiMax ? 0 : b.grogiT > 0 ? (b.grogiT / 5) * 100 : (b.grogi / b.grogiMax) * 100}%`;
      $('bossTime').textContent = b.dead ? '처치' : b.type === 'anc' ? b.duelTxt /* v2.84 */ : `남은 시간 ${Math.floor(Math.max(0, G.bossTime) / 60)}:${String(Math.floor(Math.max(0, G.bossTime) % 60)).padStart(2, '0')}`;
      $('bossStage').textContent = b.dead ? '' : b.type === 'anc' ? b.title : b.grogiT > 0 ? '그로기!' : b.kind === 'ashking' ? ['재의 왕', '대관식', b.fell ? '몰락' : '타오르는 왕'][b.stage - 1] : b.stage === 3 ? (b.kind === 'slimeking' ? '폭주' : b.kind === 'krugash' ? '피의 광란' : '광폭화') : b.armorMul && b.armorMul < 1 ? '2단계 · 북의 가호' : `${b.stage}단계`;
      $('shieldtag').style.display = b.shield && !b.dead ? 'inline' : 'none';
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
    const cur = u ? Math.min(u.n, SAVE.rec[u.rec] || 0) : 0, cond = l10 ? `${({ knight: '기사로', ranger: '어세신으로', mage: '마법사로', priest: '사제로', gunner: '거너로' })[c]} 4장 보스를 처치하면 열립니다.` : u ? (u.s || u.how) : '';
    const sub = l10 ? '4장 보스 클리어' : lock ? `${u.how} ${cur}/${u.n}` : (u || i === 10) ? '해금됨' : '기본';
    return `<div class="arcC${lock ? ' lock' : ''}" ${aTip(lock ? '???' : W0.name, lock ? cond : `<span style="color:${g.c}">${g.n}</span> · ${sk}`, lock ? '#9a8ea5' : g.c)}><img src="${weaponIconURL({ slot: 'weapon', cls: c, wk: i, grade: W0.grade })}"><span><span class="an" style="color:${lock ? '#8a8494' : g.c}">${lock ? '???' : W0.name}</span><span class="ac">${sub}</span>${lock && u ? `<span class="bar"><b style="width:${Math.round(cur / u.n * 100)}%"></b></span>` : ''}</span></div>`;
  }
  const TRUTH_ARC = [ // v2.58 기록 보관소 「진실」 — 내용은 11d_truth.js와 같게
    { k: 't1', no: '구덩이 실험실', title: '키륵의 연구 일지', c: '#7ad050', hint: '초록 자국은 어디서 왔을까요.', paras: ['셋째 배양체 관찰. 동화 속도가 공급량을 상회하여 기아에 이르는 시간이 현저히 단축됨. 유기물과 무기물을 가리지 않는 무차별 포식성 확인.', '조각 입수 이후 일몰이 관측되지 않음. 그림자의 방위와 길이가 고정되어 있음 — 국소적 시간 정체로 추정.', '조각 주변의 채도가 점진적으로 감쇠함. 흡수라기보다 전송의 양상. 소실된 색의 수신처는 미상.', '본인은 조각의 보존을 최우선 과제로 상정하고 있음. 그 근거를 기술하고자 하였으나 전제가 성립하지 않음.', '제단으로의 이송이 필연이라는 확신이 존재함. 확신의 출처 불명. 재검토 요망.', '재검토 불가. 보존해야 함. 이송해야 함. 그 이유는.........'] },
    { k: 't2', no: '기사단 밀실', title: '바닥에 새겨진 주문', c: '#b070ff', hint: '흩어진 서약을 이어 보세요.', paras: ['기사단장 발도르여,', '해가 지지 않는 한, 너는 눕지 못하리라.', '빈 자리를 지키는 자여, 네 이름은 그 자리에 묶이리라.', '왕관이 돌아올 때마다 너는 다시 눈을 뜨리라.', '재가 되어도, 서약은 재가 되지 않으리라.'] },
    { k: 't3', no: '붉은 엄니 부락', title: '크루가쉬의 마지막 말', c: '#ff6a50', hint: '피로 그린 원을 찾아보세요.', paras: ['"왕관은 바치는 게 아니다. 지지 않는 해에 비추어-"', '말을 끝내기도 전에 하늘에서 떨어진 빛줄기에 의해 크루가쉬의 몸은 산산조각 갈라졌다.'] },
  ];
  function renderArchive() { // v2.29 기록 보관소 · v2.30 탭: 유물 / 직업별 무기
    const fmt = n => n >= 1000 ? n.toLocaleString() : n, CL5 = ['knight', 'ranger', 'mage', 'priest', 'gunner'];
    const tabs = `<div class="arcTabs">${[['relic', '유물'], ...CL5.map(c => [c, CLASSES[c].n]), ['truth', '진실']].map(([k, n]) => `<button class="arcTab${arcTab === k ? ' on' : ''}" data-t="${k}">${n}</button>`).join('')}</div>`;
    let body = '';
    if (arcTab === 'relic') {
      const cell = k => { const r = RELICS[k], u = UNLOCKS.find(x => x.kind === 'r' && x.key === k), lock = u && !unlocked(u.id), cur = u ? Math.min(u.n, SAVE.rec[u.rec] || 0) : 0;
        const sub = !u ? '기본' : lock ? `${u.how} ${fmt(cur)}/${fmt(u.n)}` : '해금됨';
        return `<div class="arcC${lock ? ' lock' : ''}" ${aTip(lock ? '???' : r.n, lock ? (u.s || `${u.how} ${fmt(u.n)}`) : r.d, lock ? '#9a8ea5' : r.c)}><img src="${relicIconURL(k)}"><span><span class="an">${lock ? '???' : r.n}</span><span class="ac">${sub}</span>${lock ? `<span class="bar"><b style="width:${Math.round(cur / u.n * 100)}%"></b></span>` : ''}</span></div>`; };
      const keys = Object.keys(RELICS), base = keys.filter(k => !UNLOCKS.some(u => u.key === k)), ext = keys.filter(k => UNLOCKS.some(u => u.key === k)), got = ext.filter(k => !relicLocked(k)).length;
      body = `<div class="arcH">해금 유물<i>${got} / ${ext.length}</i></div><div class="arcGrid">${ext.map(cell).join('')}</div>`
        + `<div class="arcH">기본 유물<i>${base.length}</i></div><div class="arcGrid">${base.map(cell).join('')}</div>`;
    } else if (arcTab === 'truth') { // v2.58 진엔딩 단서: 진실 기록 3칸 (얻기 전엔 잠긴 칸 + 짧은 힌트)
      const T = SAVE.truth || {}, got = ['t1', 't2', 't3'].filter(k => T[k]).length;
      body = `<div class="arcH">진실<i>${got} / 3</i></div><div class="arcTruth">` + TRUTH_ARC.map(t => T[t.k]
        ? `<div class="arcTr"><div class="arcTrH" style="color:${t.c}">${t.no} · ${t.title}</div>${t.paras.map(p => `<p>${p}</p>`).join('')}</div>`
        : `<div class="arcTr lock"><div class="arcTrH">잠긴 기록</div><p>${t.hint}</p></div>`).join('') + '</div>';
    } else {
      const c = arcTab, W = wcat(c), sec = (t, ids) => ids.length ? `<div class="arcH">${t}<i>${ids.filter(i => !(i === 10 && !leg2Open(c)) && !weaponLocked(c, i)).length} / ${ids.length}</i></div><div class="arcGrid">${ids.map(i => arcWeaponCell(c, i)).join('')}</div>` : '';
      const by = g => W.filter(w => w.grade === g && !isUnc({ slot: 'weapon', wk: w.i }) && w.i !== 0).map(w => w.i);
      body = sec('커먼', [0]) + sec('언커먼', [11, 12, 13]) + sec('레어', by('rare')) + sec('유니크', by('unique')) + sec('레전더리', [9, 10]) + `<div class="arcH">추가 무기<i>준비 중</i></div>`;
    }
    $('arcList').innerHTML = tabs + body;
    $('arcList').querySelectorAll('.arcTab').forEach(b => b.addEventListener('click', () => { arcTab = b.dataset.t; sfx('blip'); renderArchive(); $('arcList').scrollTop = 0; }));
  }
  function closePop() { if (!popOpen) return; popOpen = null; $('ovPop').classList.remove('on'); $('tmHowto').classList.remove('on'); $('tmSound').classList.remove('on'); $('tmArchive').classList.remove('on'); pxTip.hide(); sfx('blip'); }
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
    else if (act === 'archive') openPop('archive');
    else if (act === 'sound') openPop('sound');
    else if (act === 'popClose') closePop();
    else if (act === 'back') showTitlePanel('main');
    else if (act === 'reset') {
      if (!resetArmed) { resetArmed = true; btn.textContent = '정말 지울까? 한 번 더 선택'; }
      else { SAVE = blankSave(); persist(); resetArmed = false; btn.textContent = '초기화 완료'; titleMats(); }
    }
    else if (act === 'resume') resume();
    else if (act === 'inv') openInv('pause');
    else if (act === 'quit') { $('ovPause').classList.remove('on'); showResult(false); }
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
    if ($('titleInfo')) $('titleInfo').innerHTML = `원정 완료 <b>${SAVE.clears}</b>${SAVE.clears3 ? ` (오크 부락 <b>${SAVE.clears3}</b>)` : ''} / 시도 <b>${SAVE.runs}</b> · 최고 도달 <b>${bs}</b><br>로그라이크 — 장비·재료는 한 번의 원정 동안만 유지되고, 쓰러지면 모두 잃는다`;
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
    window.AudioSys.setMood('title', true);
  }
  function openPause() { mode = 'pause'; syncVol(); $('ovPause').classList.add('on'); sfx('blip'); }
  function resume() { $('ovPause').classList.remove('on'); for (const k in pressed) pressed[k] = false; mode = 'play'; }
  $('btnAgain').addEventListener('click', start);
  $('btnTitle').addEventListener('click', toTitle);
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
  const itemIcon = it => (it.slot === 'weapon' && weaponIconURL(it)) || itemIconURL(iconKeyOf(it), gradeOf(it).c);
  const iconImg = it => { const w = it.slot === 'weapon' && weaponIconURL(it); return w ? `<img class="thumb" src="${w}">` : `<img src="${itemIconURL(iconKeyOf(it), gradeOf(it).c)}">`; };
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
    const cls = invCls(); if (!it || (on && !canEquip(it, cls))) return;
    if (on) equipIt(cls, it); else unequipIt(cls, it);
    if (G) { const P = G.player, oldHp = G.stats.hp; G.stats = calcStats(G.buffs); if (P) P.hp = clamp(P.hp + Math.max(0, G.stats.hp - oldHp), 1, G.stats.hp); }
    persist(); sfx(on ? 'select' : 'blip'); renderInv();
  }
  const myWeapons = cls => invList().filter(i => i.slot === 'weapon' && i.cls === cls); // 장비창 오른쪽 세로 칸과 같은 순서
  function swapWeapon(i) {
    const P = G.player, it = myWeapons(G.cls)[i];
    if (!P || P.dead || G.trans) return;
    if (!it) { lootFeed(`${i + 1}번 칸 비어 있음`, '#8a8090', 1200); sfx('blip', 0.6); return; }
    if (isEq(G.cls, it)) return;
    if (!['idle', 'rattack'].includes(P.state)) { pressed[String(i + 1)] = true; return; } // 공격·기술 중이면 끝나고 바꾼다
    equipIt(G.cls, it); const oldHp = G.stats.hp; G.stats = calcStats(G.buffs); P.hp = clamp(P.hp + Math.max(0, G.stats.hp - oldHp), 1, G.stats.hp);
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
      return `<button class="eqSlot wSlot ${it.id === invSel ? 'sel' : ''} ${canEquip(it, cls) ? '' : 'off'} ${invSeen.has(it.id) ? '' : 'new'}" data-id="${it.id}" style="--c:${g.c}"><div class="box">${iconImg(it)}${it.lv ? `<i class="lv">+${it.lv}</i>` : ''}${on ? '<i class="eq">E</i>' : pasOf(it, cls) ? '<i class="pas">보관</i>' : ''}<i class="key">${list.indexOf(it) + 1}</i></div></button>`; };
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
    atkP: q => `공격력이 ${q.v}% 증가합니다.`, crit: q => `치명타 확률이 ${q.v}%p 증가합니다.`, critDmg: q => `치명타 피해가 ${q.v}%p 증가합니다.`, spd: q => `이동 속도가 ${q.v}% 증가합니다.`, cdr: q => `재사용 대기 시간이 ${q.v}% 감소합니다.`, gauge: q => `각성 게이지가 ${q.v}% 더 빨리 찹니다.`,
    stun: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 적을 ${q.d}초 동안 기절시킵니다.`, stagger: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 적을 ${q.d}초 동안 경직시킵니다.`, slow: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 적을 ${q.d}초 동안 느리게 합니다.`, mochi: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 적을 ${q.d}초 동안 끈적이게 합니다.`,
    reach3: q => `3타의 사거리가 ${PN(q.v * 100)}% 증가합니다.`, grogi: q => `적에게 쌓는 그로기가 ${PN(q.v * 100)}% 증가합니다.`, spinKb: q => `3타의 밀쳐내는 힘이 ${PN(q.v * 100)}% 강해집니다.`, bleed: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 출혈을 일으킵니다.`, bleed3: q => `3타가 맞으면 ${PN(q.p * 100)}% 확률로 출혈을 일으킵니다.`,
    wallWave: () => '벽 근처에서 회피가 끝나면 작은 충격파가 일어납니다.', crumb: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 빵조각이 떨어집니다. 빵조각을 주우면 하트 반 칸을 회복하며, 챕터당 1개까지 떨어집니다.`, kcd: q => `K 스킬의 재사용 대기 시간이 ${PN(q.v * 100)}% 감소합니다.`, exec: q => `체력이 30% 미만인 적에게 주는 피해가 ${PN(q.v * 100)}% 증가합니다.`,
    bone: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 뼈다귀가 다음 적에게 날아갑니다.`, deflectAtk: q => `공격하는 동안 ${PN(q.p * 100)}% 확률로 투사체를 되받아칩니다.`, deflect: q => `${PN(q.p * 100)}% 확률로 투사체를 되받아칩니다.`, bind: q => `치명타가 터지면 ${PN(q.p * 100)}% 확률로 적을 ${q.d}초 동안 묶습니다.`,
    focus4: q => `같은 적을 4번 맞히면 다음 한 방의 피해가 ${PN(q.v * 100)}% 증가합니다.`, pdInvis: q => `퍼펙트 회피에 성공하면 ${q.v}초 동안 은신합니다.`, cat: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 고양이 혼이 다음 적에게 날아갑니다.`,
    burnPool: q => `마법탄이 ${PN(q.p * 100)}% 확률로 작은 불길을 남깁니다.`, fish: q => `방을 비우면 ${PN(q.p * 100)}% 확률로 물고기가 떨어집니다. 물고기를 주우면 하트 반 칸을 회복하며, 챕터당 1마리까지 떨어집니다.`, bounce: q => `마법탄이 ${PN(q.p * 100)}% 확률로 벽에 한 번 튕깁니다.`, blink: q => `점멸 거리가 ${PN(q.v * 100)}% 증가합니다.`,
    wisp: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 도깨비불이 3초 동안 나타납니다.`, zap: q => `공격이 맞으면 ${PN(q.p * 100)}% 확률로 옆의 적에게 번개가 튑니다.`, soup: () => '하트가 반 칸 이하일 때 방을 비우면 반 칸을 회복합니다. 챕터마다 1번 발동합니다.', mirror: q => `화염구가 ${PN(q.p * 100)}% 확률로 하나 더 나갑니다.`, meteor: q => `운석의 피해가 ${PN(q.v * 100)}% 증가합니다.`,
    parry: q => `패링 판정 시간이 ${q.v}초 증가합니다.`, undead: q => `2장과 4장에서 주는 피해가 ${PN(q.v * 100)}% 증가합니다.`, carrot: q => `적을 처치하면 ${PN(q.p * 100)}% 확률로 당근이 떨어집니다. 당근을 주우면 하트 반 칸을 회복하며, 챕터당 1개까지 떨어집니다.`, wave3: q => `3타 충격파의 범위가 ${PN(q.v * 100)}% 넓어집니다.`, reliq: () => '치유할 때 성스러운 갑옷을 1칸 더 쌓을 수 있습니다. 챕터마다 1번 발동합니다.',
    lowAtk: q => `하트가 1칸 이하일 때 주는 피해가 ${PN(q.v * 100)}% 증가합니다.`, healShield: q => `치유할 때 ${q.v}초 동안 보호막이 생깁니다.`, miracle: q => `기적의 지속 시간이 ${q.v}초 증가합니다.`,
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
    const curIt = on ? null : eqCurFor(cls, it);
    const main = PCT_STAT[it.stat] ? `${PCT_STAT[it.stat]} +${v}%` : `${slotOf(it).label} +${v}`;
    let right = '';
    if (ok) {
      const nx = on ? statsIf(eqKeyOf(cls, it), null) : statsIf(eqTarget(cls, it), it.id);
      const rows = INV_STATS.map(([k, n, f]) => {
        const dv = nx[k] - cur[k], same = Math.abs(dv) < (['crit', 'critDmg', 'cdr'].includes(k) ? 0.0005 : 0.5);
        const ds = same ? '–' : (dv > 0 ? '+' : '−') + f(Math.abs(dv)).replace('%', '') + (['crit', 'critDmg', 'cdr'].includes(k) ? '%p' : '');
        return `<span>${n}</span><b>${f(nx[k])}</b><em class="${same ? 'eq0' : dv > 0 ? 'up' : 'dn'}">${ds}</em>`;
      }).join('');
      right = on ? '' : `<div class="dr"><div class="cmpT">${curIt ? `장착하면 (「${curIt.name}」 대신)` : '장착하면'}</div><div class="cmp">${rows}</div></div>`;
    }
    const idx = myWeapons(cls).indexOf(it) + 1;
    const K = t => `<span class="key">${t}</span>`; // 키보드·마우스 키는 네모 칸으로
    const keys = TOUCH.on ? [ok && !on ? '한 번 더 탭 — 장착' : on ? '장착 중' : `${CLASSES[it.cls].n} 전용 무기라 지금 직업으로는 쓸 수 없습니다.`] : [ok && !on ? `${K('좌클릭')} 장착` : on ? '장착 중' : `${CLASSES[it.cls].n} 전용 무기라 지금 직업으로는 쓸 수 없습니다.`, idx ? `${K(idx)} 게임 중 바꿔 들기` : '', invCanDrop() ? `${K('F')} 길게 눌러 버리기` : '', `${K('I')} ${K('ESC')} 닫기`].filter(Boolean);
    return `<div class="dl"><div class="gr">${g.n} · ${slotName(it)}${ascTag(it)}${on ? ' · 장착 중' : ''}</div><div class="nm">${it.name}${it.lv ? ` <b>+${it.lv}</b>` : ''}</div>
      <div class="mn">${main}</div>${it.opts.map(o => `<div class="op">${optText(o)}</div>`).join('')}${it.fx ? `<div class="fx">★ ${LEGEND_FX[it.fx].d}</div>` : ''}${itemExtra(it, cls)}${pasLine(it, cls)}
      ${it.lv || it.fail ? `<div class="rp">강화 +${it.lv || 0}${it.fail ? ` · 장인의 숨결 +${2 * it.fail}%p` : ''}</div>` : ''}</div>${right}
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
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(bx, by, 22, 6, 0, 0, TAU); g.fill();
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
    const tip = open ? '잿빛 몸·무기, 붉은 안광과 기운' + '' : '잿불 3을 돌파하면 열린다';
    return `<span class="skinRow"><span class="ascT">외형</span><button class="ascB skinB${cur ? '' : ' on'}" data-skin="">기본</button><button class="ascB skinB${cur ? ' on' : ''}" data-skin="ash" ${open ? '' : 'disabled'} ${aTip('잿불 외형', tip, '#ffb040')}>잿불</button></span>`;
  }
  function bindSkin(el) { el.querySelectorAll('.skinB').forEach(b => b.addEventListener('click', () => { if (b.disabled) return; pxTip.hide(); SAVE.skin = b.dataset.skin || undefined; persist(); sfx('blip'); renderAsc(); $('selCards').querySelectorAll('canvas[data-pv]').forEach(c => classPreview(c, c.dataset.pv, true)); })); }
  // 잿불 단계: 한 줄만 보이고, 자세한 내용은 마우스를 올리면 도트 말풍선으로
  const escAttr = t => String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const aTip = (name, html, c) => `data-atip="${escAttr(html)}" data-aname="${escAttr(name)}"${c ? ` data-ac="${c}"` : ''}`;
  function renderAsc() {
    const A = SAVE.asc, el = $('ascRow'); if (!el) return;
    if (true) { el.innerHTML = `<div class="ascHead">${skinRowHtml()}</div>`; bindSkin(el); return; } // v2.29 잿불 단계 취소: 외형만
    if (!A.max) { el.innerHTML = `<div class="ascHead"><span class="ascT" ${aTip('잿불 단계', '첫 원정(마지막 보스)을 마치면 열린다', '#ffb040')}>잿불 단계</span><span class="ascLock">잠김</span>${skinRowHtml()}</div>`; bindSkin(el); return; }
    const L = Math.min(A.sel || 0, A.max), best = A.best[selCls];
    const next = A.max < ASC_MAX ? `잿불 ${A.max} 클리어 → 잿불 ${A.max + 1} 열림` : '모든 단계 열림';
    const sum = `<div>${CLASSES[selCls].name} 최고 ${best == null || best < 0 ? '—' : '잿불 ' + best} · ${next}</div>`
      + (L ? `<div class="fx">보상 재료 +${L * 10}% · 장비 수치 +${L * 2}%<br>높은 등급 ↑ · 클리어 골드 +${L * 50}</div><div class="rp">적용 중인 규칙</div>` + ASC.slice(1, L + 1).map((r, i) => `<div><b style="color:#ff8a2a;font-weight:normal">${i + 1}</b> ${r.n}</div>`).join('') : '<div class="rp">원래 난이도 — 규칙 없음</div>');
    const pips = Array.from({ length: ASC_MAX }, (_, i) => { const r = ASC[i + 1], open = i < A.max; return `<i class="${i < L ? 'on' : ''}${open ? '' : ' lock'}" ${aTip(`잿불 ${i + 1} · ${open ? r.n : '???'}`, open ? r.d : `잿불 ${i} 클리어 시 열림`, i < L ? '#ffb040' : '#9a8ea5')}></i>`; }).join('');
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
      <span class="key">${TOUCH.on ? '각성' : 'E'}</span><span><b>${C.awaken}</b> — ${C.awakenD}</span></div>`;
  }
  function openSelect() { mode = 'select'; selCls = CUR; $('ovTitle').classList.remove('on'); buildSelect(); renderSelect(); $('ovSelect').classList.add('on'); }
  function closeSelect() { selMiniStop(); pxTip.hide(); $('ovSelect').classList.remove('on'); mode = 'title'; $('ovTitle').classList.add('on'); }
  function chooseClass(cls) { selMiniStop(); CUR = cls; SAVE.lastCls = cls; persist(); start(); }

  // ---------------------------------------------------------------- 대장간
  let forgeFrom = 'title', forgeSel = null, forgeCls = CUR, forgeMsg = null;
  function openForge(from, m) {
    $('ovForge').dataset.m = m || 'all'; $('fgTitle').textContent = { enh: '모루 — 강화', roll: '숫돌 — 재련 (옵션 다시 굴리기)', salv: '용광로 — 분해' }[m] || '대장간 — 강화';
    forgeFrom = from; forgeCls = G ? G.cls : CUR; forgeMsg = from === 'between' ? `<span class="ok">STAGE ${G.stage} 클리어 — 보스 전리품 획득</span>` : null; mode = 'forge';
    if (from === 'between' && G.newItems[0]) forgeSel = G.newItems[0].id;
    ['ovTitle', 'ovResult'].forEach(id => $(id).classList.remove('on'));
    $('fgTabs').style.display = from === 'between' || from === 'station' ? 'none' : '';
    $('fgClose').innerHTML = (from === 'between' ? `STAGE ${G.stage + 1}로` : from === 'station' ? '대장간으로' : '돌아가기') + ' <span class="key kc">ESC</span>'; // v2.63 키캡
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
    return SAVE.inv.slice().sort((a, b) => (ids.has(b.id) - ids.has(a.id)) || (go[a.grade] - go[b.grade]) || ((b.lv || 0) - (a.lv || 0)) || (b.id - a.id));
  }
  function renderForge() {
    $('fgGold').textContent = SAVE.gold; $('fgIron').textContent = SAVE.mats.iron; $('fgCrystal').textContent = SAVE.mats.crystal;
    document.querySelectorAll('#fgTabs [data-cls]').forEach(b => b.classList.toggle('sel', b.dataset.cls === forgeCls));
    const list = forgeList();
    if (!forgeSel || !SAVE.inv.some(i => i.id === forgeSel)) forgeSel = list[0] ? list[0].id : null;
    const ids = new Set(Object.values(eqOf(forgeCls)));
    $('fgList').innerHTML = list.length ? list.map(it => `<button class="fgRow ${it.id === forgeSel ? 'sel' : ''}" data-id="${it.id}" style="--c:${gradeOf(it).c}">${ids.has(it.id) ? '<span class="eq">E</span>' : ''}<span class="nm">${it.name}</span>${it.lv ? `<span class="lv">+${it.lv}</span>` : ''}<span class="sl">${slotName(it)}</span></button>`).join('')
      : '<p>장비가 없다. 던전의 적·상자·상인·보스에게서 얻을 수 있다.</p>';
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
    if (!it) { forgeEqRow(null); d.innerHTML = `<p>${{ roll: '옵션을 다시 굴릴', salv: '녹여서 재료로 바꿀' }[$('ovForge').dataset.m] || '강화할'} 장비를 고른다.</p>`; return; }
    const g = gradeOf(it), sl = slotOf(it), lv = it.lv || 0, cap = enhCap(), max = lv >= cap, full = lv >= ENH_MAX;
    const label = PCT_STAT[it.stat] || sl.label, unit = PCT_STAT[it.stat] ? '%' : '';
    const cur = itemVal(it), next = max ? cur : itemVal(it, lv + 1);
    const c = enhCost(lv), rate = max ? 0 : enhRate(it);
    const has = { iron: SAVE.mats.iron >= c.iron, crystal: SAVE.mats.crystal >= c.crystal, gold: SAVE.gold >= c.gold };
    const can = !max && has.iron && has.crystal && has.gold;
    const eq = isEq(forgeCls, it), ok = canEquip(it, forgeCls);
    d.innerHTML = `
      <div class="fgHead" style="--c:${g.c}"><div class="gr">${g.n} · ${slotName(it)}${ascTag(it)}</div><div class="big">${it.name} <b>+${lv}</b></div></div>
      <div class="fgStat"><span>${label}</span><b>${cur}${unit}</b>${max ? '' : `<i>▶</i><b class="up">${next}${unit}</b>`}</div>
      ${it.opts.map(o => `<div class="fgOpt">${optText(o)}</div>`).join('')}${it.fx ? `<div class="fgOpt fx">★ ${LEGEND_FX[it.fx].d}</div>` : ''}<div class="fgOpt">${itemExtra(it, forgeCls)}</div>
      ${max ? (full ? '<div class="fgRate"><b>MAX</b><span>최대 강화</span></div>' : `<div class="fgRate"><b>+${cap}</b><span>이 대장간에서는 +${cap}까지 강화할 수 있습니다.</span></div>`) : `
      <div class="fgRate"><span>성공 확률</span><b>${rate}%</b>${it.fail ? `<em>장인의 숨결 +${2 * it.fail}%p</em>` : ''}</div>
      <div class="fgRisk">${lv + 1 < 5 ? '반드시 성공합니다.' : '실패해도 단계는 유지됩니다. 실패할 때마다 다음 성공 확률이 2%p 증가합니다.'}</div>
      ${[3, 6, 9].includes(lv + 1) ? `<div class="mile">★ +${lv + 1} 달성 시 옵션 1줄 추가</div>` : ''}
      <div class="fgCost"><span class="${has.iron ? '' : 'no'}">철광석 조각 ${c.iron} <small>보유 ${SAVE.mats.iron}</small></span>${c.crystal ? `<span class="${has.crystal ? '' : 'no'}">정령의 결정 ${c.crystal} <small>보유 ${SAVE.mats.crystal}</small></span>` : ''}<span class="${has.gold ? '' : 'no'}">골드 ${c.gold} <small>보유 ${SAVE.gold}</small></span></div>`}
      <div id="fgMsg">${forgeMsg || ''}</div>`;
    // v1.15 강화·다시 굴리기·분해 버튼은 설명 칸 밖 (창 아래 줄, 장착 버튼 옆)
    const rc = rerollCost(it), sv = salvageGain(it), canR = SAVE.gold >= rc.gold && SAVE.mats.crystal >= rc.crystal;
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
    const c = rerollCost(it); if (SAVE.gold < c.gold || SAVE.mats.crystal < c.crystal) { sfx('block'); forgeMsg = '<span class="ng">재료가 모자란다</span>'; renderForgeDetail(); return; }
    SAVE.gold -= c.gold; SAVE.mats.crystal -= c.crystal;
    const g = gradeOf(it), keep = it.opts.filter(o => o.cb), n = it.opts.length - keep.length, pool = OPTS.filter(o => !keep.some(k => k.k === o.k)), opts = keep.slice();
    for (let i = 0; i < n && pool.length; i++) { const o = pool.splice(randi(0, pool.length - 1), 1)[0]; opts.push({ k: o.k, v: optRoll(o, g) }); }
    it.opts = opts; if (it.efx) it.efx = pick(Object.keys(EFX).filter(k => k !== it.efx));
    if (G) G.grindT = 1.6; persist(); sfx('drop'); forgeMsg = `<span class="ok">옵션을 다시 굴렸다${it.efx ? ` · 효과 「${EFX[it.efx].n}」` : ''}</span>`; renderForge();
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
    if (SAVE.mats.iron < c.iron || SAVE.mats.crystal < c.crystal || SAVE.gold < c.gold) { sfx('block'); forgeMsg = '<span class="ng">재료가 모자란다</span>'; renderForgeDetail(); return; }
    SAVE.mats.iron -= c.iron; SAVE.mats.crystal -= c.crystal; SAVE.gold -= c.gold;
    const from = it.lv || 0, success = Math.random() * 100 < enhRate(it);
    if (success) {
      it.lv = from + 1; it.fail = 0;
      let extra = '';
      if ([3, 6, 9].includes(it.lv) && it.opts.length < 4) { // v2.40 옵션 추가 단계 +3 · +6 · +9
        const pool = OPTS.filter(o => !it.opts.some(x => x.k === o.k)), o = pick(pool);
        it.opts.push({ k: o.k, v: randi(o.r[0], o.r[1]) }); extra = ` · 새 옵션 「${optText(it.opts[it.opts.length - 1])}」`;
      }
      forgeMsg = `<span class="ok">강화 성공! +${from} → +${it.lv}${extra}</span>`; sfx('drop');
    } else {
      it.fail = (it.fail || 0) + 1;
      let t = `강화 실패… +${from} 유지`;
      if (from + 1 >= 10) { it.lv = from - 1; t = `강화 실패… +${from} → +${it.lv}`; }
      forgeMsg = `<span class="ng">${t} · 장인의 숨결 +2%p</span>`; sfx('hurt');
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
    { const b = $('tSkill'), n = skMax('K'), total = Math.max(0.1, CL().skillCd * (1 - s.cdr) * (1 - pasV('kcd'))), cds = P.chargeCd.slice(0, n), rd = cds.filter(c => c <= 0).length, mn = Math.min(...cds);
      set(b.querySelector('.cdo'), '--p', rd ? '0' : Math.min(1, mn / total).toFixed(3)); set(b.querySelector('.cdn'), 'txt', rd ? '' : String(Math.ceil(mn))); b.classList.toggle('cding', !rd); pips(b.querySelector('.pips'), n, rd);
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
    const s = typeof TOUCH !== 'undefined' && TOUCH.on ? fitS : dev / dpr; // 모바일은 화면에 꽉 차게
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
