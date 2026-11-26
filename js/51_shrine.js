'use strict';
// 잿빛 왕관 토벌대 — 51_shrine.js : v3.25 빛의 방 (1~4장 · 챕터마다 특수방 1개)
// 바닥: 원형 돌바닥(외딴 관측탑과 같은 동심원 부채꼴 판석) 위에 빛의 3원색 마법진 셋이 삼각형으로 겹쳐 있고, 마법진마다 빛기둥이 솟는다.
// 세 빛기둥이 겹친 가운데에 흰 구체가 떠 있고, 거기서 빛을 바쳐 각인 한 장을 얻는다 (모은 빛 = 재화).
// 같은 색을 살수록 비싸짐 15 → 30 → 45. 그 색 세 번째부터는 가진 각인을 완성하거나 새 각인 (예전 3단계와 같은 규칙).
  const SHRINE = (() => {
    const PRICE = [15, 30, 45], CS = ['r', 'b', 'g'];
    const SY = 1.9, FRX = 176, CRX = 54, CRY = Math.round(CRX / SY);
    const price = c => PRICE[Math.min(PRICE.length - 1, (G.engBuy && G.engBuy[c]) || 0)];
    const fc = () => ({ x: CX, y: Math.round((CY + 8) / 2) * 2 }); // 바닥 가운데
    const circ = () => { const F = fc(); return { r: { x: F.x - 24, y: F.y - 12 }, g: { x: F.x + 24, y: F.y - 12 }, b: { x: F.x, y: F.y + 14 } }; }; // 빨 왼쪽 위 · 초 오른쪽 위 · 파 아래 (빛의 3원색 그림처럼)
    const orbAt = () => { const F = fc(); return { x: F.x, y: F.y - 40 }; };
    const COL = { r: ['#ff4a4a', '#a01828', '#ffb0a0'], b: ['#5aa8ff', '#1e4a9a', '#b8dcff'], g: ['#6ad84a', '#2e7a1a', '#c8f8a8'] };
    // ---------------------------------------------------------------- 바닥 (방 바닥 캔버스에 한 번 그림)
    function floor(g, px, dith) {
      const F = fc(), RW = 22, hsh = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
      // 장마다 그 지형에 어울리는 돌 색 (1장 이끼 낀 회녹 · 2장 성채 회보라 · 3장 흙빛 · 4장 잿빛)
      const PALS = {
        1: { a: '#44494a', b: '#3f4444', c: '#494e4c', hi: '#585e5a', hi2: '#505652', sh: '#343a38', gap: '#1c241a', sp: '#4e6a3a', dk: '#38403a', rimT: '#545a54', rim: '#3e4440', rimD: '#262c26', rub: '#2e3830' },
        2: { a: '#4a4654', b: '#45414f', c: '#4f4b59', hi: '#5e5a68', hi2: '#56525f', sh: '#3a3644', gap: '#22202a', sp: '#625e6c', dk: '#3e3a48', rimT: '#5a5664', rim: '#423e4c', rimD: '#2e2a36', rub: '#34303c' },
        3: { a: '#4e4640', b: '#48403a', c: '#544a42', hi: '#665a50', hi2: '#5c5248', sh: '#3a322c', gap: '#2a201a', sp: '#6e6052', dk: '#40362e', rimT: '#62564c', rim: '#463c34', rimD: '#2e261e', rub: '#3a2e24' },
        4: { a: '#57545a', b: '#504d54', c: '#5c5960', hi: '#6e6a72', hi2: '#646068', sh: '#423f46', gap: '#2e2b30', sp: '#7a7680', dk: '#48454c', rimT: '#68646c', rim: '#4a474e', rimD: '#333036', rub: '#3e3b42' } };
      const FS = PALS[G.stage] || PALS[2];
      // 부서짐: 가장자리로 갈수록 판석이 통째로 빠지거나(땅이 드러남) 덩어리 소음 + 디더로 깎여 나감. 가운데(마법진 자리)는 온전
      const vn = (x, y, s, k) => { const X = x / s, Y = y / s, x0 = Math.floor(X), y0 = Math.floor(Y), fx = X - x0, fy = Y - y0, sm = t => t * t * (3 - 2 * t), a = hsh(x0 * 7 + k, y0), b = hsh(x0 * 7 + 7 + k, y0), c = hsh(x0 * 7 + k, y0 + 1), d = hsh(x0 * 7 + 7 + k, y0 + 1), u = sm(fx), v = sm(fy); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
      const cl = v => Math.max(0, Math.min(1, v));
      const sid = (x, y) => { const dx = x + 1 - F.x, dy = (y + 1 - F.y) * SY, r = Math.hypot(dx, dy); if (r > FRX) return -2; const ring = Math.floor(r / RW); if (ring < 1) return 0;
        const n = Math.max(6, Math.round(2 * Math.PI * (ring + 0.5) * RW / 40)), a = (Math.atan2(dy, dx) + Math.PI * 2 + ring * 0.37) % (Math.PI * 2); return ring * 1000 + Math.floor(a / (Math.PI * 2) * n); };
      const broken = id => { if (id <= 0) return false; const ring = Math.floor(id / 1000), u = (ring + 0.5) * RW / FRX; return hsh(id, 11) < Math.pow(cl((u - 0.5) / 0.5), 1.3) * 0.7; };
      const ry = Math.ceil((FRX + 10) / SY) + 2;
      for (let y = (F.y - ry) & ~1; y <= F.y + ry; y += 2) for (let x = (F.x - FRX - 12) & ~1; x <= F.x + FRX + 12; x += 2) {
        const dx = x + 1 - F.x, dy = (y + 1 - F.y) * SY, r = Math.hypot(dx, dy), u = r / FRX;
        if (r > FRX + 10) continue;
        const N = vn(x, y * SY, 18, 5), N2 = vn(x, y * SY, 7, 9), bx = x >> 1, by = y >> 1;
        if (r > FRX) { if (!dith(bx, by, cl((N - 0.38) * 3.2 + (N2 - 0.5) * 0.6))) continue; // 테두리는 군데군데 끊김
          px(x, y, r > FRX + 8 ? FS.rimD : dy < 0 ? (r < FRX + 4 ? FS.rimT : FS.rim) : (r < FRX + 4 ? FS.rim : FS.rimD)); continue; }
        const keep = 1 - cl((u - 0.74) / 0.26 * 1.15 + (N - 0.5) * 0.9 + (N2 - 0.5) * 0.35); // 가장자리 깎임 (덩어리 소음 + 디더)
        if (keep < 1 && !dith(bx, by, keep)) { if (keep > 0.15 && dith(bx + 1, by + 2, 0.12)) px(x, y, FS.rub); continue; } // 깎인 자리엔 부스러기 몇 알
        const me = sid(x, y);
        if (broken(me)) { if (dith(bx, by, 0.16)) px(x, y, (bx + by) % 3 ? FS.rub : FS.gap); continue; } // 통째로 빠진 판석: 땅 위에 부스러기만
        const v = hsh(me, 3); let c = v < 0.34 ? FS.a : v < 0.7 ? FS.b : FS.c;
        if (sid(x + 2, y) !== me || sid(x, y + 2) !== me) c = FS.gap; else if (sid(x, y - 2) !== me) c = broken(sid(x, y - 2)) ? FS.sh : FS.hi; else if (sid(x - 2, y) !== me) c = FS.hi2; else if (sid(x + 4, y) !== me || sid(x, y + 4) !== me) c = FS.sh;
        else { const n = hsh(x, y * 7 + 1); if (n < 0.05 + (G.stage === 1 ? 0.04 * u : 0)) c = FS.sp; else if (n > 0.95) c = FS.dk; } // 1장은 가장자리로 갈수록 이끼 점
        px(x, y, c);
      }
    }
    // ---------------------------------------------------------------- 마법진 (바닥에 굽지 않고 따로 한 장 — 각인을 고르면 디더로 사라짐)
    let CIRC = null;
    function circCv() {
      const F = fc(); if (CIRC && CIRC.x === F.x && CIRC.y === F.y) return CIRC;
      const x0 = ((F.x - 24 - CRX - 6) & ~1), y0 = ((F.y - 12 - CRY - 6) & ~1), [cv, g2] = mkCanvas(2 * CRX + 48 + 12, 2 * CRY + 26 + 12), px = (x, y, c) => { g2.fillStyle = c; g2.fillRect((Math.round(x) & ~1) - x0, (Math.round(y) & ~1) - y0, 2, 2); };
      // 세 빛의 마법진: 바깥 고리 · 안쪽 고리 · 그 사이 룬 눈금 · 안쪽은 옅은 디더 물듦
      const C = circ();
      // 마법진 무늬(고리 · 룬 눈금 · 안쪽 삼각형)만 그림 — 바닥을 칠하지 않음. 다른 마법진 안을 지나는 무늬는 빛의 3원색 혼합 색 (빨+초 노랑 · 초+파 청록 · 빨+파 자홍 · 셋 다 흰색)
      const MIX = { r: COL.r, g: COL.g, b: COL.b, rg: ['#ffd84a', '#9a7a14', '#fff0a8'], gb: ['#4ae0e8', '#1a7480', '#b8f8ff'], rb: ['#d05aff', '#6a2296', '#f0b8ff'], rgb: ['#ffffff', '#a8aec4', '#ffffff'] };
      for (const c of CS) { const o = C[c];
        const pm = (x, y, ti) => { const key = ['r', 'g', 'b'].filter(k => k === c || Math.hypot((x - C[k].x) / CRX, (y - C[k].y) / CRY) < 1.01).join(''); px(x, y, MIX[key][ti]); }; // ti: 0 밝은 본색 · 1 어두운 색 · 2 가장 밝은 색
        const ring = (k, ti) => { const n = Math.round(2 * Math.PI * CRX * k / 1.6); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pm(o.x + Math.cos(a) * CRX * k, o.y + Math.sin(a) * CRY * k, ti); } };
        ring(1, 2); ring(0.96, 0); ring(0.8, 0); ring(0.56, 2);
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + 0.13; for (const k of [0.86, 0.92]) pm(o.x + Math.cos(a) * CRX * k, o.y + Math.sin(a) * CRY * k, i % 3 ? 2 : 0); } // 룬 눈금
        for (let i = 0; i < 3; i++) { const a0 = i / 3 * Math.PI * 2 - Math.PI / 2, a1 = a0 + Math.PI * 2 / 3; for (let t = 0; t <= 1; t += 0.04) pm(o.x + (Math.cos(a0) * (1 - t) + Math.cos(a1) * t) * CRX * 0.56, o.y + (Math.sin(a0) * (1 - t) + Math.sin(a1) * t) * CRY * 0.56, 1); } // 안쪽 삼각형
      }
          return (CIRC = { cv, x: F.x, y: F.y, x0, y0 });
    }
    // ---------------------------------------------------------------- 빛기둥 (색마다 한 번 만든 디더 그림을 더하기 합성으로)
    const BEAM = {}, BH = 150;
    function beam(c, f = 0) { // v3.67 f: 0~7 — 무늬와 옅은 띠가 천천히 위로 흘러가는 8장
      const key = c + f; if (BEAM[key]) return BEAM[key];
      const w = Math.round(CRX * 0.66 / 2) * 2, H = BH + CRY + 4, [cv, g] = mkCanvas(w * 2 + 2, H), [r, gg, b] = [1, 3, 5].map(i => parseInt(COL[c][0].slice(i, i + 2), 16));
      const BY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (let x = 0; x <= w * 2; x += 2) { const u = (x + 1 - w) / w, side = 1 - u * u, yb = BH - Math.round(CRY * 0.66 * Math.sqrt(Math.max(0, side)) / 2) * 2; /* 기둥은 마법진 뒤쪽 테두리에서 솟음 — 바닥 마법진(겹친 색)이 가려지지 않게 */ if (side <= 0) continue;
        for (let y = 0; y < yb; y += 2) { const t = y / yb, wave = 0.86 + 0.14 * Math.sin(t * Math.PI * 3 + f * Math.PI / 4), lv = Math.pow(t, 1.3) * (0.35 + 0.65 * side) * 0.9 * wave; /* 아래(바닥)가 진하고 위로 옅어짐 · v3.67 옅은 띠가 위로 흐름 */ if (lv * 16 <= BY[(((y >> 1) + (f >> 1)) & 3) * 4 + ((x >> 1) & 3)]) continue;
          g.fillStyle = `rgb(${r},${gg},${b})`; g.fillRect(x, y, 2, 2); } }
      return (BEAM[key] = { cv, w });
    }
    // 흰 구체 (2px 칸 원판 · 왼쪽 위 빛)
    let ORB = null;
    function orbCv() {
      if (ORB) return ORB; const R = 6.5, N = 14, o = (N - 1) / 2, [cv, g] = mkCanvas((N + 2) * 2, (N + 2) * 2); g.translate(2, 2); // 명암으로 둥근 구체 (왼쪽 위 빛 · 오른쪽 아래 그늘 · 가장자리 반사광) + v3.67 외곽선 (검정 대신 푸른 보라 · 왼쪽 위는 밝게)
      const L = [-0.55, -0.62, 0.56], ln = Math.hypot(...L), TONE = ['#3a4470', '#56629a', '#8492c2', '#b8c4e4', '#e6ecfa', '#ffffff'];
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const dx = (i - o) / R, dy = (j - o) / R, r2 = dx * dx + dy * dy; if (r2 > 1) continue;
        const nz = Math.sqrt(1 - r2), sh = (dx * L[0] + dy * L[1] + nz * L[2]) / ln; let t = sh > 0.93 ? 5 : sh > 0.72 ? 4 : sh > 0.45 ? 3 : sh > 0.12 ? 2 : sh > -0.25 ? 1 : 0;
        if (r2 > 0.72 && dx + dy > 0.6 && t < 2) t = t + 1; // 오른쪽 아래 가장자리 반사광 (그늘보다 한 단계 밝게)
        g.fillStyle = TONE[t]; g.fillRect(i * 2, j * 2, 2, 2); }
      const inO = (i, j) => { const dx = (i - o) / R, dy = (j - o) / R; return i >= 0 && j >= 0 && i < N && j < N && dx * dx + dy * dy <= 1; };
      for (let j = -1; j <= N; j++) for (let i = -1; i <= N; i++) { if (inO(i, j)) continue; if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inO(i + a, j + b))) continue;
        g.fillStyle = (i - o) + (j - o) < -2 ? '#7a84c4' : (i - o) + (j - o) > 2 ? '#2e3468' : '#4a5296'; g.fillRect(i * 2, j * 2, 2, 2); }
      return (ORB = cv);
    }
    // 각인을 고른 뒤 사라짐: 구체 0~0.5초(떠오르며) → 빛기둥 0.2~1.2초 → 바닥 마법진 0.6~1.8초. 다시 와도 없음
    const cl = v => Math.max(0, Math.min(1, v));
    function fade(R) { if (!R.shrineUsed) return { orb: 1, beam: 1, circ: 1, e: 0 }; const e = R.shrineT != null ? time - R.shrineT : 99; return { orb: 1 - cl(e / 0.5), beam: 1 - cl((e - 0.2) / 1.0), circ: 1 - cl((e - 0.6) / 1.2), e }; }
    function ents(R, list) {
      const K = fade(R), Cc = circCv();
      if (K.circ > 0) list.push({ y: -1e9, d: () => { ctx.save(); ctx.globalAlpha = K.circ; ctx.drawImage(Cc.cv, Cc.x0, Cc.y0); ctx.restore(); } }); // 바닥 마법진 (가장 먼저)
      const C = circ(), used = false, fl = (0.46 + Math.sin(time * 2.2) * 0.05) * K.beam; if (K.orb <= 0 && K.beam <= 0) return;
      if (K.beam > 0) for (const c of CS) { const o = C[c], B = beam(c);
        list.push({ y: o.y, d: () => { const B2 = beam(c, Math.floor(time * 5) % 8); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fl; ctx.drawImage(B2.cv, o.x - B2.w - 1, o.y - BH);
          const [r, gg, b] = [1, 3, 5].map(i => parseInt(COL[c][0].slice(i, i + 2), 16)); ctx.fillStyle = `rgb(${Math.min(255, r + 90)},${Math.min(255, gg + 90)},${Math.min(255, b + 90)})`; // v3.67 기둥 안을 천천히 떠오르는 빛 알갱이
          for (let i = 0; i < 6; i++) { const k = (time * 0.18 + i / 6 + (c === 'b' ? 0.33 : c === 'g' ? 0.66 : 0)) % 1, X = Math.round((o.x + Math.sin(time * 1.3 + i * 2.1) * B2.w * 0.55) / 2) * 2, Y = Math.round((o.y - 8 - k * (BH - 20)) / 2) * 2; ctx.globalAlpha = fl * Math.sin(k * Math.PI) * 1.4; ctx.fillRect(X, Y, 2, 2); }
          ctx.restore(); } }); }
      // 둥둥 떠 있는 느낌: 느린 위아래(최대 6px, 2px 칸) + 아주 작은 좌우 흔들림 · 바닥 그림자는 높이에 따라 크기와 진하기가 바뀜
      const F = fc(), O = orbAt(), ph = time * 1.7, lift = used ? 0 : Math.sin(ph) * 6 + Math.sin(ph * 2.3) * 1.2, bob = -Math.round(lift / 2) * 2, sway = used ? 0 : Math.round(Math.sin(time * 0.9) * 1.6 / 2) * 2;
      const rise = K.e > 0 ? Math.round(Math.min(K.e, 0.5) * 24 / 2) * 2 : 0; // 사라지며 떠오름
      if (K.orb > 0) list.push({ y: F.y - 2, d: () => { const k = (lift + 7) / 14, rx = Math.round((9 - k * 3) / 2) * 2, ry = Math.max(2, rx / 3); ctx.save(); ctx.globalAlpha = (0.5 - k * 0.2) * K.orb; ctx.fillStyle = '#0b0a0e';
        for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) ctx.fillRect(Math.round((O.x + sway) / 2) * 2 + x - 1, F.y - 6 + y, 2, 2); ctx.restore(); } }); // 바닥 그림자 (디더)
      if (K.orb > 0) list.push({ y: F.y + 20, d: () => { const cv = orbCv(); /* 빛기둥 셋을 다 그린 뒤 */ ctx.save(); ctx.globalAlpha = K.orb; ctx.drawImage(cv, Math.round((O.x + sway - cv.width / 2) / 2) * 2, Math.round((O.y + bob - rise - cv.height / 2) / 2) * 2);
        if (K.orb >= 1) { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { const a = time * 1.6 + i * Math.PI / 2, x = Math.round((O.x + sway + Math.cos(a) * 18) / 2) * 2, y = Math.round((O.y + bob + Math.sin(a) * 7) / 2) * 2; ctx.fillRect(x, y, 2, 2); } }
        ctx.restore(); } });
    }
    function lights(R, list) {
      const C = circ(), K = fade(R), O = orbAt();
      for (const c of CS) { if (K.beam > 0) list.push({ x: C[c].x, y: C[c].y - 30, r: 96, a: 0.75 * K.beam, c: HUES[c].rgb, ca: 0.12 * K.beam }); if (K.circ > 0) list.push({ x: C[c].x, y: C[c].y, r: 70, a: 0.6 * K.circ, c: HUES[c].rgb, ca: 0.08 * K.circ }); } // 기둥 · 바닥 마법진
      if (K.orb > 0) list.push({ x: O.x, y: O.y + 30, r: 80, a: 0.5 * K.orb, c: '255,255,255', ca: 0.05 * K.orb }); // 구체 명암이 하얗게 날아가지 않게 빛은 구체 아래(바닥)에 약하게
    }
    // ---------------------------------------------------------------- 각인 카드
    function cardFor(c) { // 그 색 카드 한 장 (처음 열 때 정해 두고 다시 굴리지 않음)
      if (!G.eng) engReset();
      const mine = G.eng[c], pool = Object.keys(ENG).filter(k => ENG[k].c === c && ENG[k].t === engT() && !mine.includes(k));
      const opts = pool.map(k => ({ k, done: false }));
      if (((G.engBuy && G.engBuy[c]) || 0) >= 2) for (const k of mine) if (!G.engC.has(k)) opts.push({ k, done: true });
      return opts.length ? opts[randi(0, opts.length - 1)] : null;
    }
    function ensure(R) { if (!R.shrineOpts) { R.shrineOpts = {}; for (const c of CS) R.shrineOpts[c] = cardFor(c); } return R.shrineOpts; }
    function interact(R) {
      if (!R || R.type !== 'shrine' || R.shrineUsed) return null; const P = G.player, F = fc(), O = orbAt();
      if (Math.hypot(P.x - F.x, (P.y - F.y) * 1.4) > 66) return null;
      return { k: 'shrine', o: O, x: O.x, y: O.y - 22, t: 'F 건드리기' };
    }
    function open() {
      const R = G.dun && G.dun.cur; if (!R || R.type !== 'shrine' || R.shrineUsed) return;
      const O = ensure(R); mode = 'shrine'; sfx('grogi', 1.4);
      $('engTitle').innerHTML = '빛의 방';
      $('engSub').textContent = '빛을 바쳐 각인 하나를 얻습니다. 흰 빛은 한 번만 응답합니다.';
      $('engChoices').innerHTML = CS.map((c, i) => { const o = O[c], H = HUES[c], p = price(c), have = G.pal[c] || 0;
        if (!o) return `<button class="choice engC none" data-c="${c}" style="--ec:${H.c}"><span class="engHue">${H.n}</span><b>받을 수 있는 각인이 없습니다</b><span class="engD">이 빛의 각인을 모두 얻었습니다.</span><span class="key">${i + 1}</span></button>`;
        const E = ENG[o.k], poor = have < p;
        return `<button class="choice engC${o.done ? ' done' : ''}${poor ? ' poor' : ''}" data-c="${c}" style="--ec:${H.c};--ecd:${ENG_ICOL[c].M[2]}"><span class="engHue">${H.n}</span><span class="engSeal"><img src="${engSeal(o.k, o.done)}" data-seal="${o.k}${o.done ? '+' : ''}" alt=""></span>${o.done ? '<span class="engDone">완성</span>' : ''}<b>${E.n}</b><span class="engD">${o.done ? E.x : E.d}</span><span class="engCost"><img src="${hueURL(c)}" alt="">${p} <span style="color:#8a8494">(보유 ${have})</span></span><span class="key">${i + 1}</span></button>`; }).join('');
      $('engChoices').querySelectorAll('[data-c]').forEach(bt => bt.addEventListener('click', () => buy(bt.dataset.c)));
      { let lv = $('shrineLeave'); if (!lv) { lv = document.createElement('button'); lv.id = 'shrineLeave'; lv.className = 'shrineLeave'; lv.textContent = '떠나기 (Esc)'; lv.addEventListener('click', close); $('engChoices').after(lv); } lv.style.display = ''; } // 카드 줄 아래
      $('ovEng').classList.add('on');
    }
    function close() { $('ovEng').classList.remove('on'); { const lv = $('shrineLeave'); if (lv) lv.style.display = 'none'; } if (mode === 'shrine') mode = 'play'; for (const k in pressed) pressed[k] = false; }
    function buy(c) {
      const R = G.dun && G.dun.cur, Op = R && R.shrineOpts, o = Op && Op[c]; if (!o) { sfx('block'); return; }
      const p = price(c); if ((G.pal[c] || 0) < p) { sfx('block'); lootFeed(`${HUES[c].n}이 ${p - (G.pal[c] || 0)}개 모자랍니다`, '#ff9a8a', 2000); return; }
      G.pal[c] -= p; G.engBuy[c] = (G.engBuy[c] || 0) + 1; R.shrineUsed = true; R.shrineT = time;
      close(); chooseEng(o.k, o.done); // 각인 얻기 · 알림 · 고리 · 팔레트 갱신 (09_skills.js)
      const O = orbAt(); for (let i = 0; i < 28; i++) { const t = rand(0, TAU), sp = rand(40, 120); G.parts.push({ x: O.x, y: O.y, vx: Math.cos(t) * sp, vy: Math.sin(t) * sp * 0.6 - 20, t: rand(0.4, 0.9), c: pick([HUES[c].c, '#ffffff', '#ffffff']), g: 60 }); }
      sfx('heal', 1.1);
    }
    return { floor, interact, open, close, ents, lights, price };
  })();
