'use strict';
// 잿빛 왕관 원정대 — 39_altarwind.js : v3.20 왕도 성문 앞 제단 방 오른쪽 아래의 「바람이 새는 잔해 더미」 → 용의 유적 입구
// 조건: 그 캐릭터의 2회차 + 이번 판에 진실 1 · 2 · 3을 모두 봄 (3→4 대장간 음유시인 「제단의 바람 소리」와 같음)
// 잔해 더미 두 곳(오른쪽 아래 큰 것 · 왼쪽 아래 작은 것)은 늘 있는 장애물. 조건을 채웠을 때만 오른쪽 더미에서 바람이 새고 상호작용 · 부수기가 됨
// 말을 걸면 주인공 혼잣말뿐 · 여러 번(9번) 공격하면 잔해가 걷히며 룬이 새겨진 돌 테 + 석재 사다리 구멍이 드러남 → 「F 내려가기」로 용의 유적
// 잔해 · 구멍은 장애물 (밟고 지나갈 수 없음). 그림은 FP(11_altar_forge.js)의 도트 도우미 (칸 = 2px · 외곽선 · 디더 그림자)
const ALTARWIND = (() => {
  const room = () => { const R = G && G.dun && G.dun.altar && G.dun.cur; return R && R.type === 'altar' ? R : null; }; // 잔해는 늘 있음 (1회차 · 다른 조건에서도) — 바람 · 상호작용 · 부수기는 아래 조건일 때만
  const on = () => { const R = G && G.dun && G.dun.altar && G.dun.cur; if (!R || R.type !== 'altar' || R.seqT != null) return null;
    const run = G.truthRun || {}; return TRUTH.loop2() && run.t1 && run.t2 && run.t3 ? R : null; };
  const pos = () => ({ x: (A.x1 - 58) & ~1, y: (A.y1 - 26) & ~1 }); // 바닥 오른쪽 아래 모서리 (구멍 한가운데)
  const HITS = 9; // 이만큼 때려야 걷힘 (3번마다 위쪽 돌이 한 겹씩 굴러 떨어짐)

  // ================================================================ 그림 (칸 좌표 · 그림 안의 구멍 중심 = CX, CY)
  const W = 46, H = 32, CX = 23, CY = 19;
  const P = ['#aea89c', '#948e84', '#77726a', '#5e5952', '#4a4640', '#373531']; // 제단 방 바닥 돌과 같은 따뜻한 잿빛 (바닥 그림에서 뽑은 색) // 돌 (밝 → 어둠) — 빛은 왼쪽 위
  const VOID = ['#0b0a08', '#110f0c', '#171511'], VOIDS = new Set(VOID);
  const hh = (x, y, s) => FP.hh(x, y, s);
  const EDGE = '#23211d';
  // 돌 하나를 그린 뒤: 뒤에 깔린 돌과 맞닿는 칸에 어두운 틈을 둘러 돌끼리 또렷이 나뉘게
  function sep(S, cells) { const own = new Set(cells.map(([x, y]) => x + ',' + y)); for (const [x, y] of cells) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (!own.has(k) && S.has(x + dx, y + dy) && !VOIDS.has(S.get(x + dx, y + dy))) S.set(x + dx, y + dy, EDGE); } }
  // 시드가 같은 난수 (같은 판이면 늘 같은 모양)
  const rng = sd => () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // 거친 돌: 가장자리가 울퉁불퉁한 덩이 (각마다 반지름이 다름) · 윗면이 밝고 오른쪽 아래로 어두움 · 결 얼룩
  function rock(S, cx, cy, rx, ry, sd, dark = 0) { const C = [], R = rng(sd), J = Array.from({ length: 8 }, () => 0.72 + R() * 0.4), flat = R() < 0.45;
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, a = (Math.atan2(dy, dx) / (Math.PI * 2) + 1) * 8, i = Math.floor(a) % 8, f = a - Math.floor(a), lim = J[i] * (1 - f) + J[(i + 1) % 8] * f;
      if (Math.hypot(dx, dy) > lim) continue;
      let l = -0.5 * dx - 0.9 * dy + (hh(x, y, sd) - 0.5) * 0.4; if (flat && dy < -0.35) l += 0.35; // 넓적한 돌은 윗면이 평평하게 밝음
      const k = l > 0.6 ? 0 : l > 0.15 ? 1 : l > -0.3 ? 2 : l > -0.75 ? 3 : 4;
      S.set(x, y, P[Math.min(5, k + dark)]); C.push([x, y]);
    }
    sep(S, C);
  }
  // 나무 조각 (부러진 판자 · 들보): (x0,y0)→(x1,y1) 굵기 th칸 · 윗면 밝고 아래 어두움 · 나뭇결 · 쪼개진 끝 · 박힌 못
  const WD = ['#9a8064', '#7d664e', '#62503e', '#4a3c2f', '#332a21']; // 바랜 나무 (제단 방의 따뜻한 잿빛에 맞춤)
  function plank(S, x0, y0, x1, y1, th, sd, dark = 0) { const C = [], R = rng(sd), n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)), sp0 = R() < 0.7, sp1 = R() < 0.7, nail = R() < 0.5 ? Math.floor(n * (0.2 + R() * 0.6)) : -1;
    for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n), end = i === 0 || i === n;
      for (let j = 0; j < th; j++) { if (end && ((i === 0 && sp0) || (i === n && sp1)) && j % 2 === (i === 0 ? 0 : 1)) continue; // 쪼개진 끝: 한 줄씩 들쭉날쭉
        let k = j === 0 ? 0 : j === th - 1 ? 3 : 1; if (j > 0 && j < th - 1 && hh(i, j, sd) < 0.22) k = 2; if (end && !(sp0 || sp1)) k = Math.min(4, k + 1); // 나뭇결 · 잘린 마구리
        S.set(x, y + j, WD[Math.min(4, k + dark)]); C.push([x, y + j]); }
      if (i === nail) S.set(x, y + (th > 2 ? 1 : 0), '#2a2622'); }
    sep(S, C);
  }
  // ---- 무너진 잔해: 돌 · 부서진 판자와 들보가 아무렇게나 쏟아져 쌓임 — 큰 돌 몇 · 중간 돌 · 자갈 · 부스러기 (한쪽으로 조금 더 흘러내림)
  // cx · cy: 더미 중심(칸) · ex · ey: 퍼진 정도 · hgt: 높이 · nw: 나무 조각 수
  function pileOf(seed, n, cx, cy, ex, ey, hgt, nw) { const R = rng(seed), L = [];
    for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, r = Math.pow(R(), 0.7), bx = cx + Math.cos(a) * r * ex + (R() - 0.3) * 3, by = cy + Math.sin(a) * r * ey;
      const el = Math.pow(1 - r, 1.3) * hgt + R() * 2.5, big = R(), k = ex / 19, rx = (big < 0.15 ? 3.8 + R() * 1.4 : big < 0.55 ? 2.4 + R() * 1.2 : 1.3 + R() * 0.8) * (0.7 + 0.3 * k);
      L.push({ k: 'r', x: bx, y: by - el, rx, ry: rx * (0.62 + R() * 0.2), base: by, el, sd: seed + i, dark: R() < 0.3 ? 1 : 0 }); }
    for (let i = 0; i < nw; i++) { const a = R() * Math.PI * 2, r = Math.pow(R(), 0.8) * 0.85, bx = cx + Math.cos(a) * r * ex, by = cy + Math.sin(a) * r * ey, el = Math.pow(1 - r, 1.3) * hgt * 0.8 + R() * 2;
      const len = 6 + Math.floor(R() * (ex > 12 ? 9 : 5)), sl = (R() - 0.5) * 0.9, dir = R() < 0.5 ? -1 : 1, beam = R() < 0.3, dx = Math.round(len / Math.sqrt(1 + sl * sl)) * dir, dy = Math.round(dx * sl);
      L.push({ k: 'w', x0: Math.round(bx - dx / 2), y0: Math.round(by - el - dy / 2), x1: Math.round(bx + dx / 2), y1: Math.round(by - el + dy / 2), th: beam ? 3 : 2, base: by + 0.5, el, sd: seed + 500 + i, dark: R() < 0.35 ? 1 : 0 }); }
    return L.sort((p, q) => (p.base + p.el * 0.15) - (q.base + q.el * 0.15)); }
  const draw1 = (T, q) => q.k === 'w' ? plank(T, q.x0, q.y0, q.x1, q.y1, q.th, q.sd, q.dark) : rock(T, q.x, q.y, q.rx, q.ry, q.sd, q.dark);
  const gravelOf = (seed, n, cx, cy, ex, ey) => { const R = rng(seed), L = []; for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()), x = Math.round(cx + Math.cos(a) * r * ex + (R() - 0.35) * 2), y = Math.round(cy + Math.sin(a) * r * ey); L.push([x, y, R() < 0.5 ? 3 : R() < 0.5 ? 2 : 4, R(), R() < 0.2]); } return L; }; // 마지막: 나무 부스러기인지
  const STONES = pileOf(4417, 40, CX + 1, CY + 2, 19, 7.5, 13, 8);
  const ELS = STONES.map(q => q.el).sort((a, b) => b - a), CUT = [99, ELS[Math.floor(ELS.length * 0.4)], ELS[Math.floor(ELS.length * 0.78)]]; // 단계마다 이보다 높이 얹힌 것은 굴러 떨어짐
  const GRAVEL = gravelOf(91, 90, CX + 1, CY + 3, 23, 8.5);
  function gravel(S, keep, G_ = GRAVEL) { for (const [x, y, k, r, w] of G_) if (r < keep && !S.has(x, y)) { const c = w ? WD : P; S.set(x, y, c[Math.min(4, k)]); if ((w || r < keep * 0.25) && !S.has(x + 1, y)) S.set(x + 1, y, c[Math.min(4, k + 1)]); } } // 자갈 · 나무 부스러기 (한두 칸)
  function rubbleArt(st) {
    const B = FP.Spr(W, H, 4); pit(B, st >= 2); // 밑에 깔린 구멍 (잔해가 걷힐수록 드러남 · 사다리 머리는 마지막 겹에서)
    const T = FP.Spr(W, H, 4); for (const q of STONES) if (q.el <= CUT[st]) draw1(T, q);
    const R = rng(700 + st); for (let i = 0; i < st * 4; i++) { const a = R() * Math.PI * 2, x = CX + Math.cos(a) * (19 + R() * 3), y = CY + 3 + Math.sin(a) * (7 + R() * 2);
      if (i % 3 === 2) plank(T, Math.round(x - 3), Math.round(y), Math.round(x + 3), Math.round(y + (R() < 0.5 ? 1 : -1)), 2, 820 + st * 10 + i, 1); else rock(T, x, y, 1.4 + R() * 1.2, 1 + R() * 0.7, 800 + st * 10 + i, 1); } // 굴러 떨어진 돌 · 나뭇조각
    gravel(B, 0.55 + st * 0.15); FP.shadow(T, 2, 1, 6, 0.45); // 자갈은 외곽선 없이 바닥에
    return stack(FP.render(B, false), FP.render(T));
  }
  // ---- 화면 왼쪽 아래의 작은 잔해 (같은 무너짐의 흔적 · 장식 + 장애물)
  const LW = 30, LH = 20, LCX = 15, LCY = 13, SMALL = pileOf(5521, 16, LCX, LCY, 10, 4, 7, 4), SGRAV = gravelOf(77, 40, LCX, LCY + 1, 13, 5);
  function smallArt() { const B = FP.Spr(LW, LH, 4), T = FP.Spr(LW, LH, 4); for (const q of SMALL) draw1(T, q); gravel(B, 0.7, SGRAV); FP.shadow(T, 2, 1, 6, 0.45); return stack(FP.render(B, false), FP.render(T)); }
  const posL = () => ({ x: (A.x0 + 96) & ~1, y: (A.y1 - 30) & ~1 });
  const stack = (a, b) => { const g = a.getContext('2d'); g.drawImage(b, 0, 0); return a; };

  // ---- 걷힌 뒤: 바닥이 안쪽으로 꺼져 파인 구멍 (테를 쌓지 않음) — 깨진 가장자리 · 바닥 금 · 먼 쪽 안벽(거친 돌 · 룬 띠) · 석재 사다리 · 아래는 끝없는 어둠
  const PX0 = 6, PX1 = 41, PY0 = 11, PY1 = 27; // 구멍 대략의 범위 (칸)
  let RUNES = [];
  const inPit = (x, y) => { const dx = (x + 0.5 - CX - 0.5) / 17, dy = (y + 0.5 - CY) / 8, a = Math.atan2(dy, dx), n = 1 + 0.08 * Math.sin(a * 3 + 1.3) + 0.05 * Math.sin(a * 5 + 0.4); return Math.pow(Math.abs(dx), 2.6) + Math.pow(Math.abs(dy), 2.6) <= n * n; };
  function pit(S, ladder) { RUNES = [];
    const top = {}, bot = {}; for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (inPit(x, y)) { if (top[x] == null) top[x] = y; bot[x] = y; }
    const xs = Object.keys(top).map(Number), xl = Math.min(...xs), xr = Math.max(...xs);
    for (const x of xs) for (let y = top[x]; y <= bot[x]; y++) { if (!inPit(x, y)) continue;
      const d = y - top[x], sl = x - xl, sr = xr - x; let c;
      if (d === 0) c = P[3]; // 먼 쪽 깨진 가장자리 (바닥 높이 · 가는 빛줄)
      else if (d <= 2) c = hh(x, y, 5) < 0.3 ? P[5] : P[4]; // 안벽 윗부분 (거친 돌 · 바로 그늘로)
      else if (d === 3) c = (x + y) & 1 ? VOID[2] : P[5];
      else if (d === 4) c = (x + y) & 1 ? VOID[0] : VOID[2];
      else c = VOID[0]; // 끝을 알 수 없는 어둠
      if (d > 0 && sl <= 1 && d < 4) c = P[4]; // 왼쪽 안벽
      if (d > 0 && sr <= 1 && d < 4) c = P[5]; // 오른쪽 안벽 (그늘)
      if (y === bot[x] && d > 3) c = VOID[1]; // 가까운 쪽 가장자리 (바로 아래로 꺼짐)
      S.set(x, y, c);
    }
    // 가장자리 바깥: 깨져 나간 바닥 조각 · 가장자리를 따라 꺼진 그늘 · 바닥으로 뻗은 금
    for (const x of xs) { if (hh(x, 1, 21) < 0.45 && !S.has(x, top[x] - 1)) S.set(x, top[x] - 1, P[4]); if (hh(x, 2, 22) < 0.3 && !S.has(x, bot[x] + 1)) S.set(x, bot[x] + 1, P[3]); }
    for (const x of xs) for (const y of [top[x] - 1, top[x] - 2, bot[x] + 1]) if (!S.has(x, y) && hh(x, y, 41) < (y === top[x] - 2 ? 0.12 : 0.28)) S.set(x, y, y > top[x] ? P[5] : P[4]); // 깨져 나간 바닥 부스러기 (가장자리에 붙어서)
    // 먼 쪽 안벽에 새긴 룬 띠 (옛 유적의 흔적 · 따로 빛남)
    for (const [gx, g] of [[11, 2], [16, 0], [31, 1], [35, 3]]) { const gy = top[gx + 1] + 1; for (const [dx, dy] of GLY[g]) if (inPit(gx + dx, gy + dy)) { S.set(gx + dx, gy + dy, P[5]); RUNES.push([gx + dx, gy + dy]); } }
    if (!ladder) return;
    // 석재 사다리: 먼 쪽 안벽에 붙은 두 돌기둥 + 디딤돌 — 위 끝이 가장자리 위로 두 칸 나오고, 아래로 갈수록 어둠에 잠김
    const RL = [18, 27], t0 = Math.min(top[18], top[29]), fade = y => y <= t0 + 1 ? 0 : y <= t0 + 3 ? 1 : y <= t0 + 6 ? 2 : 3, SC = [P[1], P[2], P[3], P[4]], SD = [P[3], P[4], P[5], VOID[2]];
    for (const rx of RL) for (let y = t0 - 2; y <= t0 + 10; y++) { const f = fade(y); if (f >= 3 && (y + rx) & 1) continue; S.set(rx, y, y === t0 - 2 ? P[0] : SC[f]); S.set(rx + 1, y, SD[f]); }
    for (const ry of [t0 + 1, t0 + 4, t0 + 7]) { const f = fade(ry); for (let x = RL[0] + 2; x < RL[1]; x++) { S.set(x, ry, SC[f]); S.set(x, ry + 1, SD[f]); } }
  }
  function gateArt() {
    const B = FP.Spr(W, H, 4); pit(B, true);
    const T = FP.Spr(W, H, 4), R = rng(55); // 걷어낸 잔해: 구멍 둘레에 흩어진 돌 몇 덩이 · 자갈
    for (let i = 0; i < 7; i++) { const a = R() * Math.PI * 2; rock(T, CX + Math.cos(a) * (19.5 + R() * 3), CY + 2 + Math.sin(a) * (9 + R() * 2), 1.3 + R() * 1.4, 1 + R() * 0.8, 900 + i, 1); }
    plank(T, 1, 15, 7, 17, 2, 951, 1); plank(T, 37, 27, 44, 26, 2, 952, 1); plank(T, 13, 29, 18, 30, 2, 953, 1); // 걷어낸 판자 조각
    for (const [x, y, k, r] of GRAVEL) if (r < 0.35 && !inPit(x, y) && !inPit(x, y - 1) && !inPit(x, y + 1) && !B.has(x, y)) B.set(x, y, P[k]);
    FP.shadow(T, 1, 1, 6, 0.4);
    return stack(FP.render(B, false), FP.render(T));
  }
  const GLY = [[[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]], [[0, 0], [0, 1], [0, 2], [1, 1], [2, 0], [2, 2]]];
  let CV = {};
  const art = k => CV[k] || (CV[k] = k === 'gate' ? gateArt() : k === 'small' ? smallArt() : rubbleArt(+k.slice(1)));
  const org = (c, p) => ({ x: (p.x - (CX + 4) * 2) & ~1, y: (p.y - (CY + 4) * 2) & ~1 }); // 그림 왼쪽 위 (pad 4칸 포함)

  const LINES = { knight: '…정말 휘파람 같은 바람 소리가 들리는군.', ranger: '…진짜 바람 소리네.', mage: '정말 휘파람 소리가 들리네요.|틈 너머에 빈 공간이 있는 걸까요.', priest: '정말… 휘파람 소리가 들려요.', gunner: '휘파람 소리라…|진짜였군.' };

  // ================================================================ 장애물 (잔해 · 구멍 모두 같은 자리)
  function ensureObs(R) {
    if (R.awObs) return; const p = pos(); R.awObs = true;
    const b = { t: 'prop', c: false, aw: true, x0: p.x - (CX - PX0) * 2, x1: p.x + (PX1 - CX) * 2, y0: p.y - (CY - PY0 - 1) * 2, y1: p.y + (PY1 + 1 - CY) * 2 };
    const q = posL(), b2 = { t: 'prop', c: false, aw: true, x0: q.x - 18, x1: q.x + 18, y0: q.y - 6, y1: q.y + 6 }; // 왼쪽 작은 잔해
    for (const o of [b, b2]) { R.obs.push(o); if (G.obs && G.obs !== R.obs) G.obs.push(o); } R.nav = buildNav(R.obs);
    const P_ = G.player; if (P_) solveObs(P_, P_.r);
  }

  // ================================================================ 바람: 돌 틈 · 구멍에서 왼쪽 위로 흩어지는 짧은 바람결 몇 가닥 — 3초마다 한 번 세게 + 「휘잉-」
  const WIND = []; let gustT = 1.2, lastT = 0, sayT = -9;
  const GAPS = [[[-6, -8], [6, -6], [-12, -2], [10, -12]], [[-4, -4], [8, -2], [-10, 0], [2, -8]], [[-2, -2], [6, 0], [-8, 0], [0, -4]]]; // 단계별 바람이 새는 틈 (구멍 중심 기준 px)
  function windTick(R, dt) {
    const p = pos(), open = R.crevOpen != null, st = Math.min(2, Math.floor((R.crevHits || 0) / 3));
    gustT -= dt; const gust = gustT <= 0; if (gust) { gustT = 3 + Math.random() * 1.2; sayT = time; const Pl = G.player; if (Pl && Math.hypot(Pl.x - p.x, Pl.y - p.y) < 220) sfx('whoosh', open ? 0.3 : 0.2); }
    const n = (Math.random() < dt * (open ? 4 : 2.5) ? 1 : 0) + (gust ? (open ? 3 : 2) : 0);
    for (let i = 0; i < n; i++) { const g = open ? [rand(-10, 10), rand(-10, -2)] : pick(GAPS[st]); WIND.push({ x: p.x + g[0] + rand(-2, 2), y: p.y + g[1] + rand(-2, 2), vx: -rand(30, 50), vy: -rand(26, 40), ph: rand(0, 6), len: randi(2, 4) * 2, t: 0, max: rand(0.6, 0.9) }); }
    for (let i = WIND.length - 1; i >= 0; i--) { const w = WIND[i]; w.t += dt; if (w.t >= w.max) { WIND.splice(i, 1); continue; } w.x += (w.vx + Math.sin(w.t * 5 + w.ph) * 14) * dt; w.y += w.vy * dt; }
  }
  function drawWind() {
    for (const w of WIND) { const k = w.t / w.max; ctx.globalAlpha = k < 0.2 ? 0.35 : k > 0.7 ? 0.35 : 0.6; ctx.fillStyle = '#e6e2ee'; ctx.fillRect(Math.round(w.x) & ~1, Math.round(w.y) & ~1, w.len, 2); }
    ctx.globalAlpha = 1;
  }
  function draw(R) {
    const p = pos(), open = R.crevOpen != null, t = open ? time - R.crevOpen : 0;
    if (open && t > 0.18) { const c = art('gate'), o = org(c, p); ctx.drawImage(c, o.x, o.y);
      const pulse = [0.4, 0.65, 0.9, 0.65][Math.floor(time * 2.5) % 4]; ctx.save(); ctx.globalAlpha = pulse; ctx.fillStyle = '#5aa4ee'; // 룬: 마나빛으로 천천히 맥동
      for (const [rx, ry] of RUNES) ctx.fillRect(o.x + (rx + 4) * 2, o.y + (ry + 4) * 2, 2, 2); ctx.globalAlpha = pulse * 0.35; ctx.fillStyle = '#9ad6ff'; for (const [rx, ry] of RUNES) ctx.fillRect(o.x + (rx + 4) * 2, o.y + (ry + 4) * 2 - 2, 2, 2); ctx.restore(); }
    else { const st = open ? 2 : Math.min(2, Math.floor((R.crevHits || 0) / 3)), c = art('r' + st), o = org(c, p);
      ctx.drawImage(c, o.x, o.y);
      if ((open && t < 0.18) || time - (R.crevHitT || -9) < 0.08) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6; ctx.drawImage(c, o.x, o.y); ctx.restore(); } }
    drawWind();
    if (time - sayT < 1.3) drawBubble('휘잉-', p.x, p.y - (open ? 20 : 34), 0); // 바람이 셀 때 잔해 틈 · 구멍에서
  }

  // ================================================================ 공격 받는 자리 (허수아비처럼 고정 · 보이지 않음)
  function ensureTarget(R) {
    if (R.crevOpen != null || G.enemies.some(e => e.crev && !e.dead)) return;
    const p = pos();
    G.enemies.push({ type: 'dummy', crev: true, x: p.x, y: p.y + 4, hx: p.x, hy: p.y + 4, z: 0, r: 26, hp: 500, maxHp: 500, atk: 0, def: 0, spd: 0, kbRes: 0, vx: 0, vy: 0, face: -1, walk: 0, lean: 0, flash: 0, rise: 0, state: 'idle', t: 0, squash: 0, glow: 0, hitT: 0 });
  }
  function hitCrack(e) {
    const R = on(); if (!R || R.crevOpen != null || time - (R.crevHitT || -9) < 0.15) return; // 한 번 휘두를 때 여러 번 세지 않게
    R.crevHitT = time; R.crevHits = (R.crevHits || 0) + 1; const p = pos(), last = R.crevHits >= HITS, drop = R.crevHits % 3 === 0;
    sfx(last ? 'block' : 'hit', last ? 0.6 : 0.7); addShake(last ? 3 : 1); if (drop && !last) sfx('drop', 0.5); // 한 겹 걷힐 때 돌 구르는 소리
    for (let i = 0; i < (last ? 30 : drop ? 12 : 5); i++) G.parts.push({ x: p.x + rand(-24, 24), y: p.y + rand(-20, 2), vx: rand(-80, 80), vy: rand(-90, -30), t: rand(0.4, 0.8), c: pick(P.slice(1, 5)), g: 260, floor: p.y + rand(-2, 12) });
    if (!last) return;
    e.dead = true; G.enemies = G.enemies.filter(q => q !== e);
    R.crevOpen = time; sfx('drop', 0.8); flashT = Math.max(flashT, 0.06); flashColor = '#d8d4e0'; gustT = 0.5;
  }

  // ================================================================ 기존 함수 감싸기
  { const o = roomEnts; roomEnts = function (list) { o(list); const R = room(); if (!R) return; ensureObs(R);
      const q = posL(); list.push({ y: q.y - 2, d: () => { const c = art('small'); ctx.drawImage(c, (q.x - (LCX + 4) * 2) & ~1, (q.y - (LCY + 4) * 2) & ~1); } });
      if (!on()) { const p = pos(); list.push({ y: p.y - 2, d: () => { const c = art('r0'), g = org(c, p); ctx.drawImage(c, g.x, g.y); } }); return; } // 그냥 잔해 (바람 · 상호작용 없음 · 부서지지 않음)
      const dt = Math.min(0.05, Math.max(0, time - lastT)); lastT = time; windTick(R, dt); ensureTarget(R); list.push({ y: pos().y - 2, d: () => draw(R) }); }; }
  { const o = roomLights; roomLights = function (lights) { o(lights); const R = room(); if (!R) return; const p = pos();
      if (on() && R.crevOpen != null) lights.push({ x: p.x, y: p.y - 12, r: 70, a: 0.6 + 0.08 * Math.sin(time * 2.5), c: '110,170,240', ca: 0.05 }); // 구멍 속 룬의 마나빛
      else lights.push({ x: p.x - 10, y: p.y - 20, r: 70, a: 0.45, c: '215,208,195', ca: 0.03 }); }; } // 잔해 더미가 어둠에 묻히지 않게 아주 옅게
  { const o = drawDummy; drawDummy = function (e) { if (e && e.crev) return; return o.apply(this, arguments); }; }
  { const o = damageEnemy; damageEnemy = function (e) { if (e && e.crev) { if (!e.dead) hitCrack(e); return; } return o.apply(this, arguments); }; }
  { const o = nearInteract; nearInteract = function () { const R = on(), Pl = G.player;
      if (R && Pl && !Pl.dead && !G.trans) { const p = pos(); if (Pl.x > p.x - 64 && Pl.x < p.x + 64 && Pl.y > p.y - 40 && Pl.y < p.y + 36) return { k: 'altarWind', x: p.x, y: Pl.y < p.y - 14 ? p.y + 30 : p.y - 46, t: R.crevOpen != null ? 'F 내려가기' : 'F 살펴보기' }; }
      return o(); }; }
  { const o = doInteract; doInteract = function (it) { if (it && it.k === 'altarWind') { const R = on(); if (!R) return;
      if (R.crevOpen != null) { if (time - R.crevOpen > 0.4) { const p = pos(); RUIN.debugEnter(); if (G.ruinRet) { G.ruinRet.x = p.x - 4; G.ruinRet.y = p.y - (CY - PY0) * 2 - 14; } } } // 올라오면 사다리 앞(구멍 위쪽)에 섬
      else sayPlayer(LINES[G.cls] || LINES.knight, 4); return; }
      return o(it); }; }
  return { on, pos, art };
})();
