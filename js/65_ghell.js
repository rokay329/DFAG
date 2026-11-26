'use strict';
// 잿빛 왕관 원정대 — 65_ghell.js : v3.34 3장 거치 무기 「지옥불 의식대」
//  · 통나무 단 · 뒤 기둥 둘과 가로대 · 뿔 짐승 두개골 · 붉은 천 · 돌 화로 (시안 _시안/3장_의식대_지옥불의식대_움짤시안08.html 과 칸 단위로 같음)
//  · 주술사 둘이 양옆에서 마주 보고 지팡이를 들어 불덩이를 소환 → 공중으로 떠올라 멈춤 → 플레이어에게 곧게 날아가 폭발 → 불바닥 3초
//  · 주술사 하나면 대기 · 소환이 두 배 느림, 없으면 멈춤 · 근처 주술사가 빈 자리를 채움 (투석기 · 발리스타와 같은 규칙)
//  · 의식대는 부술 수 있음. 소환 도중에 부수면 자라던 불덩이가 그 자리에서 폭발해 양옆 주술사도 피해를 입음
//  · 3장 3 · 6 · 7 · 8등급 방에 한 대씩 (다른 장 거치 무기보다 자주)
const GHELL = (() => {
  const WP={k:'#0b0806',K:'#060403',h:'#9a6a40',l:'#7a5030',d:'#553620',D:'#33200f',w:'#e0d6c4',W:'#a89a84',r:'#9a2a24',R:'#5e1612',o:'#8a6034',O:'#5a3a1e',s:'#c8a070',y:'#d8a840',b:'#7a5a3a',B:'#4e3a26',
   n:'#8a7c6c',g:'#6a5e52',G:'#463c34',c:'#2a1810',f:'#e8602a',F:'#ffa830',Y:'#fff0a0',e:'#c03a1a'};
  const grid=(w,h)=>Array.from({length:h},()=>Array(w).fill('.'));
  function outline(g,col='k'){const H=g.length,W=g[0].length,o=grid(W+2,H+2);
   for(let y=0;y<H;y++)for(let x=0;x<W;x++)o[y+1][x+1]=g[y][x];
   const r=o.map(a=>a.slice());
   for(let y=0;y<H+2;y++)for(let x=0;x<W+2;x++)if(o[y][x]==='.'){for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const v=(o[y+dy]||[])[x+dx];if(v&&v!=='.'&&v!=='k'&&v!=='K'){r[y][x]=col;break}}}
   return r}
  function genAltar(broken){const W=32,H=32,g=grid(W,H),set=(x,y,c)=>{if(x>=0&&x<W&&y>=0&&y<H)g[y][x]=c},get=(x,y)=>(g[y]&&g[y][x])||'.';
   const tone=(x,a,b,c)=>x<=10?a:x<=21?b:c;
   if(!broken){
    // 뒤 기둥 둘 (끝을 깎음) — 왼쪽은 밝게, 오른쪽은 어둡게
    for(let y=1;y<=18;y++){ if(y>1)set(3,y,'h'); set(4,y,y===1?'l':'d'); set(27,y,y===1?'d':'l'); if(y>1)set(28,y,'D'); }
    set(3,1,'l');set(28,1,'D');
    // 가로대
    for(let x=1;x<=30;x++){set(x,5,tone(x,'h','l','d'));set(x,6,tone(x,'d','d','D'))}
    // 기둥 이음새 가죽끈
    for(const px of[3,27]){set(px,4,'s');set(px+1,4,'y');set(px,7,'y');set(px+1,7,'s');set(px,5,'s');set(px+1,6,'y')}
    // 가로대 위 뿔 짐승 두개골
    const SK=[".wwww.","wwrrwW","wKwwKW",".wKKW.",".WwwW."];SK.forEach((r,j)=>[...r].forEach((c,i)=>{if(c!=='.')set(13+i,1+j,c)}));
    set(12,2,'w');set(11,1,'w');set(10,0,'W');set(19,2,'W');set(20,1,'w');set(21,0,'W');
    // 붉은 천 두 줄 · 매달린 뼈
    for(let y=7;y<=12;y++){set(5,y,'r');set(6,y,y>=11?'.':'R');set(25,y,y===12?'.':'r');set(26,y,'R')}
    set(5,13,'R');set(26,13,'R');
    // 단 윗면: 가로로 누운 통나무 셋
    for(let x=1;x<=30;x++)for(let k=0;k<3;k++){const y=18+k*2;set(x,y,tone(x,'h','l','d'));set(x,y+1,tone(x,'l','d','D'))}
    for(const bx of[6,25])for(let y=18;y<=23;y++)set(bx,y,y%2?'y':'s');
    // 앞면: 통나무 마구리 여섯
    for(let x=1;x<=30;x++)for(let y=24;y<=28;y++)set(x,y,'K');
    const END=[".ooO.","osssO","osbsO","osssO",".OOO."],ENDd=[".OOB.","OoooB","OoOoB","OoooB",".BBB."];
    for(let i=0;i<6;i++){const E=i>=4?ENDd:END;E.forEach((r,j)=>[...r].forEach((c,q)=>{if(c!=='.')set(1+i*5+q,24+j,c)}))}
    // 붉은 엄니 칠
    [[13,25],[14,26],[14,27],[18,25],[17,26],[17,27],[15,28],[16,28]].forEach(([x,y])=>set(x,y,'r'));
    // 단 위 돌 화로
    for(let x=11;x<=20;x++)set(x,12,'G');
    set(10,13,'n');for(let x=11;x<=20;x++)set(x,13,'c');set(21,13,'G');
    for(let x=10;x<=21;x++)set(x,14,tone(x+2,'n','g','G'));
    for(let y=15;y<=17;y++)for(let x=11;x<=20;x++)set(x,y,x<=13?'g':x<=18?'G':'c');
    for(let x=12;x<=19;x++)set(x,18,'G');
    set(13,16,'r');set(14,15,'r');set(15,16,'r'); // 화로 겉 붉은 칠
   } else {
    // 꺾인 기둥 밑동
    for(let y=12;y<=18;y++){set(3,y,'h');set(4,y,'d')} set(3,11,'l');set(4,12,'w');
    for(let y=15;y<=18;y++){set(27,y,'l');set(28,y,'D')} set(28,14,'d');set(27,14,'w');
    // 단 윗면: 가운데가 꺼져 내려앉음
    for(let x=1;x<=30;x++)for(let k=0;k<3;k++){const y=18+k*2+(x>=11&&x<=20?1:0);if(x>=13&&x<=18&&k===0)continue;set(x,y,tone(x,'h','l','d'));set(x,y+1,tone(x,'l','d','D'))}
    for(let x=13;x<=18;x++){set(x,18,'K');set(x,19,'K')}
    set(12,18,'w');set(19,18,'w');
    // 앞면: 마구리 일부가 빠짐
    for(let x=1;x<=30;x++)for(let y=24;y<=28;y++)set(x,y,'K');
    const END=[".ooO.","osssO","osbsO","osssO",".OOO."];
    for(let i=0;i<6;i++){if(i===3)continue;END.forEach((r,j)=>[...r].forEach((c,q)=>{if(c!=='.')set(1+i*5+q,24+j+(i===2?1:0),c)}))}
    for(let x=16;x<=20;x++)for(let y=24;y<=28;y++)set(x,y,'K');
    [[13,26],[14,27],[18,25]].forEach(([x,y])=>set(x,y,'r'));
    // 엎어진 화로 (금 감) · 꺼진 숯
    for(let y=14;y<=17;y++)for(let x=19;x<=26;x++)set(x,y,x<=21?'g':'G');
    for(let x=20;x<=25;x++)set(x,13,'n'); set(22,14,'k');set(23,15,'k');set(23,16,'k');
    for(let x=13;x<=18;x++)set(x,17,(x%2)?'c':'G');
    // 떨어진 가로대 (앞 땅에 비스듬히)
    for(let x=0;x<=24;x++){const y=29+(x>16?1:0)+(x>22?1:0);set(x,y,tone(x,'h','l','d'));set(x,y+1,tone(x,'d','d','D'))}
    set(3,29,'s');set(4,29,'y');
    // 굴러 떨어진 두개골
    const SK=[".wwww.","wwrrwW","wKwwKW",".wKKW."];SK.forEach((r,j)=>[...r].forEach((c,i)=>{if(c!=='.')set(25+i,23+j-1,c)}));
    set(24,21,'W');
    // 찢긴 천
    set(8,22,'r');set(9,22,'R');set(10,23,'r');
   }
   return outline(g)}
  // ---------------------------------------------------------------- 그림 캐시
  const toCv = (g, white) => { const H = g.length, W = g[0].length, [c, x] = mkCanvas(W * 2, H * 2);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = g[j][i]; if (v === '.' || !WP[v]) continue; x.fillStyle = white ? '#ffffff' : WP[v]; x.fillRect(i * 2, j * 2, 2, 2); } return c; };
  let CV = null; const cvs = () => CV || (CV = { a: toCv(genAltar(false)), aw: toCv(genAltar(false), true), b: toCv(genAltar(true)) });
  const sn = v => Math.round(v / 2) * 2, px2 = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(sn(x), sn(y), 2, 2); };
  const hash = (a, b, c = 0) => { let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  function dith(cx, cy, rx, ry, col) { ctx.fillStyle = col; for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) { if ((x * x) / (rx * rx) + (y * y) / (ry * ry) > 1) continue; const X = sn(cx + x), Y = sn(cy + y); if (((X + Y) / 2) % 2 === 0) ctx.fillRect(X, Y, 2, 2); } }
  function ring(cx, cy, rx, ry, col) { ctx.fillStyle = col; const n = Math.max(16, Math.round(rx * 1.2)); for (let i = 0; i < n; i++) { const a = i / n * TAU; ctx.fillRect(sn(cx + Math.cos(a) * rx), sn(cy + Math.sin(a) * ry), 2, 2); } }
  // ---------------------------------------------------------------- 수치
  const IDLE = 1.2, SUMMON = 1.8, RISE = 0.5, HOVER = 0.25, PULL = 0.1, FLY = 0.45, REST = 1.4;
  const FB_H = 92, HOV_H = 124, BLAST_R = 40, PATCH_T = 3, PATCH_RX = 34, PATCH_RY = 15;
  const posts = e => [[e.px - 52, e.py], [e.px + 52, e.py]];
  const crewOn = e => (e.crew || []).filter(g => g && !g.dead && g.crewOf === e && g.atPost);
  const easeOutBack = k => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const easeInOut = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  // ---------------------------------------------------------------- 불덩이 그리기 (반지름 R칸 · 불꼬리 ta 방향, tl 0~1)
  function drawFire(x, y, R, ta, tl) {
    const f = Math.floor(time * 14), cx = sn(x), cy = sn(y), Rc = Math.ceil(R);
    dith(cx, cy, R * 2 + 10, R * 2 + 10, 'rgba(255,110,30,.28)');
    for (let j = -Rc - 1; j <= Rc + 1; j++) for (let i = -Rc - 1; i <= Rc + 1; i++) {
      const n = (hash(i + 40, j + 40, f) - 0.5) * 0.9, q = Math.hypot(i, j + 0.3) / (R + n * 0.6);
      let c = null; if (q <= 1) c = q < 0.38 ? '#ffd060' : q < 0.62 ? (hash(i, j, f + 3) < 0.2 ? '#ffd060' : '#ff7a20') : q < 0.86 ? (hash(i, j, f + 5) < 0.25 ? '#ff7a20' : '#d8301a') : '#9a1a10';
      else if (q <= 1.13) c = '#3a0606';
      if (c) { ctx.fillStyle = c; ctx.fillRect(cx + i * 2, cy + j * 2, 2, 2); } }
    const L = tl * (R * 2.2 + 2); if (L < 1.5) return;
    const ux = Math.cos(ta), uy = Math.sin(ta), vx = -uy, vy = ux;
    for (let i = -Math.floor(R) + 1; i <= Math.floor(R) - 1; i++) { const edge = Math.sqrt(Math.max(0, R * R - i * i)), hh = Math.floor((0.35 + 0.65 * hash(i + 9, f, 3)) * L * (1 - Math.abs(i) / (R + 1) * 0.6));
      for (let k = 1; k <= hh; k++) { if (hash(i, k, f) < 0.25) continue; const d = edge + k; ctx.fillStyle = k > hh * 0.75 ? '#d8301a' : k > hh * 0.4 ? '#ff7a20' : '#ffd060'; ctx.fillRect(cx + Math.round(vx * i + ux * d) * 2, cy + Math.round(vy * i + uy * d) * 2, 2, 2); } }
  }
  // ---------------------------------------------------------------- 자리 · 놓기
  function occFree(x0, y0, x1, y1) { // 방 점유 지도: 장애물 · 소품 그림과 겹치지 않게 (그림끼리 겹쳐 보이지 않도록)
    const R = G.dun && G.dun.cur, O = R && R.occ; if (!O || !O.vis) return true;
    for (let y = y0; y <= y1; y += 4) for (let x = x0; x <= x1; x += 4) { const cx = Math.floor((x - O.x0) / 4), cy = Math.floor((y - O.y0) / 4); if (cx < 0 || cy < 0 || cx >= O.w || cy >= O.h) continue; const v = O.vis[cy * O.w + cx]; if (v === 3 || v === 4 || v === 1) return false; }
    return true;
  }
  function fits(x, y) {
    if (!occFree(x - 40, y - 72, x + 40, y + 8) || !occFree(x - 68, y - 60, x - 36, y + 6) || !occFree(x + 36, y - 60, x + 68, y + 6)) return false; // 단 · 기둥 · 주술사(지팡이 포함) 그림 자리
    if (typeof obsHitL !== 'function') return true;
    for (let dx = -34; dx <= 34; dx += 10) for (const dy of [-12, -2]) if (obsHitL(G.obs, x + dx, y + dy, 8)) return false; // 단
    for (const p of [[x - 52, y], [x + 52, y]]) if (obsHitL(G.obs, p[0], p[1], 12)) return false; // 주술사 자리
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; if (obsHitL(G.obs, x + Math.cos(a) * 78, y + Math.sin(a) * 30, 8)) return false; } // 둘레 통로
    return x - 90 > A.x0 && x + 90 < A.x1 && y - 80 > A.y0 && y + 30 < A.y1;
  }
  function spot() {
    const P = G.player, pref = P.x > CX ? 1 : -1;
    for (const f of [pref, -pref]) for (let i = 0; i < 50; i++) {
      const x = f > 0 ? A.x0 + rand(120, 220) : A.x1 - rand(120, 220), y = i < 25 ? clamp(P.y + rand(-80, 80), A.y0 + 90, A.y1 - 40) : rand(A.y0 + 90, A.y1 - 40);
      if (fits(x, y)) return { x: sn(x), y: sn(y) };
    }
    return null;
  }
  function mkCrew(e, i, x, y) { const g = makeEnemy('shaman', x, y); g.crewOf = e; g.post = i; g.face = i === 0 ? 1 : -1; g.rise = 0.35; return g; }
  function addCrew(e) { e.crew = []; const P = posts(e); for (let i = 0; i < 2; i++) { const g = mkCrew(e, i, P[i][0], P[i][1]); e.crew.push(g); G.enemies.push(g); } }
  // ---------------------------------------------------------------- 의식대 갱신
  function update(e, dt) {
    e.x = e.px; e.y = e.py; e.vx = e.vy = 0;
    const n = crewOn(e).length, slow = n >= 2 ? 1 : 2;
    e.ph = e.ph || 'idle'; e.pt = e.pt || 0;
    if (e.ph === 'rest') { e.pt += dt; if (e.pt >= REST) { e.ph = 'idle'; e.pt = 0; } return; }
    if (!e.armed || !n) { if (e.ph === 'summon') { e.fr = Math.max(0, (e.fr || 0) - dt * 8); if (e.fr <= 0.5) { e.ph = 'idle'; e.pt = 0; e.fr = 0; } } return; } // 주술사가 없으면 멈춤 · 자라던 불덩이는 사그라듦
    e.pt += dt / slow;
    if (e.ph === 'idle') { if (e.pt >= IDLE) { e.ph = 'summon'; e.pt = 0; sfx('warn', 0.5); } return; }
    if (e.ph === 'summon') { const k = Math.min(1, e.pt / SUMMON); e.fr = 2 + 8 * easeOutBack(k);
      if (Math.random() < dt * 14) G.parts.push({ x: e.px + rand(-14, 14), y: e.py - 30, vx: 0, vy: -rand(40, 70), t: rand(0.3, 0.6), c: pick(['#ff7a20', '#ffd060', '#d8301a']), g: 0 });
      if (k >= 1) launch(e); return; }
  }
  function launch(e) { // 불덩이가 의식대를 떠나 공중으로 — 이때부터 따로 움직임
    const P = G.player;
    (G.hfb = G.hfb || []).push({ src: e, ax: e.px, ay: e.py, t: 0, tx: P.x, ty: P.y, dmg: e.atk * 1.3, lock: false });
    e.ph = 'rest'; e.pt = 0; e.fr = 0; sfx('whoosh', 0.7);
  }
  // 불덩이 위치 (시안과 같은 이징): 떠오름(넘쳤다 자리 잡음) → 둥실 → 뒤로 살짝 당김 → 가속하며 날아감
  function fbPos(b) {
    const T = b.t, y0 = b.ay - FB_H, yH = b.ay - HOV_H, gy0 = b.ay + 4, AX = b.ax;
    if (T < RISE) { const e = easeOutBack(Math.max(0, T / RISE)); return [AX, y0 + (yH - y0) * e, AX, gy0]; }
    if (T < RISE + HOVER) { const k = (T - RISE) / HOVER; return [AX, yH + Math.sin(k * TAU) * 2, AX, gy0]; }
    const dx = b.tx - AX, dy = b.ty - yH, dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl, t2 = T - RISE - HOVER;
    if (t2 < PULL) { const k = easeInOut(t2 / PULL) * Math.sin(Math.PI * Math.min(1, t2 / PULL) * 0.5); return [AX - ux * 6 * k, yH - uy * 6 * k, AX, gy0]; }
    const k = Math.min(1, (t2 - PULL) / FLY), e = k * k * (1.6 - 0.6 * k), sx = AX - ux * 6, sy = yH - uy * 6;
    return [sx + (b.tx - sx) * e, sy + (b.ty - sy) * e, AX + (b.tx - AX) * e, gy0 + (b.ty - gy0) * e];
  }
  function updFire(dt) {
    const P = G.player;
    if (G.hfb && G.hfb.length) for (const b of G.hfb.slice()) {
      b.t += dt;
      if (!b.lock) { b.tx = clamp(P.x, A.x0 + 8, A.x1 - 8); b.ty = clamp(P.y, A.y0 + 8, A.y1 - 8); if (b.t >= RISE + HOVER) { b.lock = true; sfx('swing', 0.7); } } // 멈춘 순간의 플레이어 자리로
      if (b.t >= RISE + HOVER + PULL + FLY) { G.hfb.splice(G.hfb.indexOf(b), 1); impact(b.tx, b.ty, b.dmg, b.src); }
    }
    if (G.hpatch && G.hpatch.length) { for (const p of G.hpatch) { p.t += dt;
        if (p.t < PATCH_T && !P.dead && Math.pow((P.x - p.x) / (PATCH_RX + P.r * 0.5), 2) + Math.pow((P.y - p.y) / (PATCH_RY + P.r * 0.3), 2) < 1) { p.tick -= dt; if (p.tick <= 0) { p.tick = 0.5; hurtPlayer(p.dmg, null, false, true); } } else p.tick = Math.min(p.tick, 0.15); }
      G.hpatch = G.hpatch.filter(p => p.t < PATCH_T + 1.2); }
    if (G.hboom && G.hboom.length) { for (const b of G.hboom) b.t += dt; G.hboom = G.hboom.filter(b => b.t < 0.45); }
  }
  function impact(x, y, dmg, src) {
    const P = G.player;
    if (!P.dead && Math.pow((P.x - x) / (BLAST_R + P.r), 2) + Math.pow((P.y - y) / (BLAST_R * 0.45 + P.r * 0.6), 2) <= 1) hurtPlayer(dmg, src && !src.dead ? src : null);
    (G.hboom = G.hboom || []).push({ x, y, t: 0, seed: rand(0, 9) });
    (G.hpatch = G.hpatch || []).push({ x, y, t: 0, tick: 0.3, seed: randi(1, 99), dmg: dmg * 0.25 });
    for (let i = 0; i < 18; i++) { const a = rand(0, TAU), sp = rand(60, 200); G.parts.push({ x, y: y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 50, t: rand(0.3, 0.7), c: pick(['#ffd060', '#ff7a20', '#d8301a', '#3a3640']), g: 260, floor: y + rand(-6, 8) }); }
    dust(x, y, 10); addShake(5); sfx('blast');
  }
  // ---------------------------------------------------------------- 그리기
  function draw(e, ya, al) {
    const C = cvs(), white = e.flash > 0, x = sn(e.px - C.a.width / 2), y = sn(e.py - C.a.height + 6 + (ya || 0));
    dshEll(ctx, e.px, e.py + 2, 34, 6, 0.5);
    ctx.save(); if (al != null && al !== 1) ctx.globalAlpha = al; ctx.drawImage(white ? C.aw : C.a, x, y); ctx.restore();
    if (white) return;
    const cell = (i, j) => [x + (i + 1) * 2, y + (j + 1) * 2], sum = e.ph === 'summon', f = Math.floor(time * (sum ? 14 : 6)), lift = sum ? Math.min(1, e.pt / 0.3) : 0;
    for (let i = 11; i <= 20; i++) { const [cx, cy] = cell(i, 13), v = hash(i, f); px2(cx, cy, v < 0.35 ? '#9a2a24' : v < 0.7 ? '#e8602a' : '#ffa830'); // 화로 불씨 · 소환 중엔 불길
      if (sum) { const hh = 1 + Math.floor(hash(i, f, 9) * 4 * lift); for (let k = 1; k <= hh; k++) if (hash(i, k, f) > 0.3) px2(cx, cy - k * 2, k === hh ? '#fff0a0' : k % 2 ? '#ffa830' : '#e8602a'); }
      else if (v > 0.8) px2(cx, cy - 2, '#e8602a'); }
    if (sum && e.fr > 0.5) { const fy = e.py - FB_H;
      for (const g of crewOn(e)) { const tipx = g.x + g.face * 12, tipy = g.y - 52; // 지팡이 두개골 끝 불티가 불덩이로 모임
        for (let i = 0; i < 5; i++) { const k = (e.pt * 1.6 + i / 5 + g.post * 0.1) % 1; px2(tipx + (e.px - tipx) * k, tipy + (fy - tipy) * k - Math.sin(k * Math.PI) * 8, i % 2 ? '#ffa830' : '#e8602a'); } }
      for (let i = 0; i < 6; i++) { const k = (e.pt * 2.2 + i / 6) % 1; px2(e.px - 4 + (i * 5) % 9, e.py - 34 - k * 40, k > 0.6 ? '#fff0a0' : i % 2 ? '#ffa830' : '#e8602a'); }
      drawFire(e.px, fy, e.fr + Math.sin(time * 9) * 0.35 * Math.min(1, e.pt / SUMMON), -Math.PI / 2, 0); }
  }
  // 땅 위: 부서진 의식대 · 불바닥 · 예고 원
  function drawGround() {
    const C = cvs();
    if (G.hbroken) for (const b of G.hbroken) ctx.drawImage(C.b, sn(b.x - C.b.width / 2), sn(b.y - C.b.height + 6));
    if (G.hpatch) for (const p of G.hpatch) { const fade = p.t > PATCH_T, f = Math.floor(time * 10);
      dith(p.x, p.y, 38, 17, fade ? 'rgba(20,10,6,.55)' : 'rgba(40,10,4,.7)');
      if (!fade) { dith(p.x, p.y, 32, 14, 'rgba(255,90,30,.35)');
        for (let i = 0; i < 14; i++) { const a = i * 0.9 + p.seed, fx = p.x + Math.cos(a) * 30 * (0.3 + 0.7 * hash(i, 1, p.seed * 7)), fy = p.y + Math.sin(a) * 13 * (0.3 + 0.7 * hash(i, 2, p.seed * 7)), hgt = 3 + Math.floor(hash(i, f, p.seed) * 4);
          for (let k = 0; k < hgt; k++) { px2(fx, fy - k * 2, k === 0 ? '#e8602a' : k === hgt - 1 ? '#fff0a0' : '#ffa830'); if (k < hgt - 1 && k > 0) px2(fx + 2, fy - k * 2 + 2, '#e8602a'); } } }
      else for (let i = 0; i < 6; i++) if (hash(i, Math.floor(time * 4), p.seed) < 0.3) px2(p.x + (hash(i, 5, p.seed) - 0.5) * 40, p.y - 4 - (p.t - PATCH_T) * 20 * hash(i, 6, p.seed), '#5a504a'); }
    if (G.hfb) for (const b of G.hfb) { const k = Math.min(1, b.t / 0.45); dith(b.tx, b.ty, Math.round(BLAST_R * k), Math.round(BLAST_R * 0.45 * k), 'rgba(200,40,24,.55)'); ring(b.tx, b.ty, BLAST_R, BLAST_R * 0.45, '#e04028'); }
  }
  // 공중: 날아가는 불덩이 · 폭발
  function drawAir() {
    if (G.hfb) for (const b of G.hfb) { const p = fbPos(b), q = fbPos({ ...b, t: b.t + 0.016 }), vx = q[0] - p[0], vy = q[1] - p[1], v = Math.hypot(vx, vy), sp = v / 0.016;
      const flying = b.t >= RISE + HOVER + PULL, w = (b.t < RISE && vy < 0) || flying ? Math.min(1, sp / 90) : 0, ta = v > 0.01 ? Math.atan2(-vy, -vx) : -Math.PI / 2;
      if (flying) for (let i = 1; i <= 7; i++) { const r2 = fbPos({ ...b, t: Math.max(RISE + HOVER + PULL, b.t - i * 0.025) }); if (hash(i, Math.floor(time * 20)) > 0.25) { const c = i < 3 ? '#ff7a20' : i < 5 ? '#d8301a' : '#5a3a30'; px2(r2[0], r2[1], c); px2(r2[0] + 2, r2[1], c); px2(r2[0], r2[1] + 2, c); } }
      dshEll(ctx, p[2], p[3], 16, 6, 0.5);
      drawFire(p[0], p[1], 10 + Math.sin(time * 9) * 0.35, ta, w); }
    if (G.hboom) for (const b of G.hboom) { const k = b.t / 0.45, R = 10 + k * 46;
      ring(b.x, b.y, R, R * 0.5, k < 0.5 ? '#fff0a0' : '#e8602a'); ring(b.x, b.y, R * 0.7, R * 0.35, '#ffa830');
      if (k < 0.35) dith(b.x, b.y - 6, 24, 16, '#ffd060');
      for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + b.seed, d = R * 1.1 * hash(i, 3, b.seed * 5) + 4; px2(b.x + Math.cos(a) * d, b.y - 6 + Math.sin(a) * d * 0.6 - k * 10, i % 3 ? '#e8602a' : '#3a2a22'); } }
  }
  // ---------------------------------------------------------------- 주술사: 자리로 가서 붙음 (플레이어가 바싹 붙으면 일반 주술사처럼 싸움)
  function updCrew(g, dt, d, a, moveTo) {
    const c = g.crewOf; if (!c || c.dead) { g.crewOf = null; g.atPost = false; return false; }
    if (d < 30) { g.atPost = false; return false; }
    const [px, py] = posts(c)[g.post], dd = Math.hypot(px - g.x, py - g.y);
    if (!g.atPost && dd > 4) { if (g.state === 'chase') moveTo(Math.atan2(py - g.y, px - g.x), g.spd * 1.6); return true; }
    g.x = px; g.y = py; g.atPost = true; g.face = g.post === 0 ? 1 : -1; g.vx = g.vy = 0;
    if (c.ph === 'summon' && c.armed) { g.glowT = 0.2; g.glowMax = 0.6; g.aa = -90 * DEG; g.steps = null; } // 지팡이를 높이 듦
    return true;
  }
  function recruit(e) { if (!e.armed) return;
    for (let i = 0; i < 2; i++) { if (e.crew[i] && !e.crew[i].dead && e.crew[i].crewOf === e) continue;
      const g = G.enemies.filter(o => !o.dead && o.type === 'shaman' && !o.crewOf).sort((p, q) => Math.hypot(p.x - e.px, p.y - e.py) - Math.hypot(q.x - e.px, q.y - e.py))[0];
      if (g && Math.hypot(g.x - e.px, g.y - e.py) < 360) { g.crewOf = e; g.post = i; g.atPost = false; e.crew[i] = g; } }
  }
  // 소환 도중에 부서짐: 자라던 불덩이가 그 자리에서 폭발 (양옆 주술사 · 플레이어 모두 피해)
  function burst(e) {
    if (e.ph !== 'summon' || !(e.fr > 3)) return;
    const x = e.px, y = e.py, fy = e.py - FB_H;
    (G.hboom = G.hboom || []).push({ x, y: fy + 30, t: 0, seed: rand(0, 9) });
    (G.hpatch = G.hpatch || []).push({ x, y: y + 6, t: 0, tick: 0.3, seed: randi(1, 99), dmg: e.atk * 0.3 });
    if (typeof GSEMI !== 'undefined' && GSEMI.blast) GSEMI.blast(x, y, 64, e.atk * 1.3 * Math.min(1, e.fr / 10), e, false); // 주술사는 크게 다치지만 한 방에 쓰러지지는 않게
  }
  return { posts, spot, addCrew, mkCrew, update, draw, drawGround, drawAir, updFire, updCrew, recruit, burst };
})();

// ---- 연결
{ const o = queueSpawn; queueSpawn = function (type, at) {
    if (type === 'ghellaltar') { const c = G.enemies.find(e => !e.dead && e.type === 'ghellaltar' && !e.armed);
      if (c) c.armed = true;
      if (c || G.hellPlaced) { o.call(this, 'ghcrew'); return o.call(this, 'ghcrew'); } // 미리 놓인 의식대를 부숴 뒀으면 주술사 둘만
      if (!at) at = GHELL.spot(); if (!at) { o.call(this, 'shaman'); return o.call(this, 'shaman'); } }
    return o.call(this, type, at); }; }
let GHELL_PLACE = false;
{ const o = makeEnemy; makeEnemy = function (type, x, y) {
    if (type === 'ghcrew') { // 주술사 + 빈 자리 배정 (0 왼쪽 · 1 오른쪽)
      const c = G.enemies.find(e => !e.dead && e.type === 'ghellaltar' && e.armed);
      if (c) { c.crew = c.crew || []; const i = [0, 1].find(k => !c.crew[k] || c.crew[k].dead || c.crew[k].crewOf !== c); if (i != null) { const g = GHELL.mkCrew(c, i, x, y); c.crew[i] = g; return g; } }
      return o.call(this, 'shaman', x, y); }
    const e = o.apply(this, arguments);
    if (e && e.type === 'ghellaltar') { e.px = e.x; e.py = e.y; e.r = 24; e.tall = 64; e.face = 1; e.ph = 'idle'; e.pt = 0; e.fr = 0; e.rise = 0; e.grogiMax = 0; e.recruitT = 0;
      if (GHELL_PLACE) { e.crew = []; e.armed = false; } else { e.armed = true; GHELL.addCrew(e); } }
    return e; }; }
{ const o = killEnemy; killEnemy = function (e, silent) {
    if (e && e.type === 'ghellaltar') { GHELL.burst(e); const r = o.apply(this, arguments); // 부서진 채 남음
      if (G.corpses) G.corpses = G.corpses.filter(c => c.e !== e);
      (G.hbroken = G.hbroken || []).push({ x: e.px, y: e.py }); debris(e.px, e.py - 14, 18); dust(e.px, e.py, 14); sfx('crunch', 0.7); addShake(4);
      for (const g of e.crew || []) if (g && g.crewOf === e) { g.crewOf = null; g.atPost = false; }
      return r; }
    return o.apply(this, arguments); }; }
{ const o = drawAshClouds; drawAshClouds = function () { GHELL.drawGround(); return o.apply(this, arguments); }; }
{ const o = drawEProjs; drawEProjs = function () { const r = o.apply(this, arguments); GHELL.drawAir(); return r; }; }
{ const o = updateEProj; updateEProj = function (dt) { const r = o.apply(this, arguments); GHELL.updFire(dt); return r; }; }
{ const o = enterRoom; enterRoom = function (R) { G.hbroken = []; G.hfb = []; G.hpatch = []; G.hboom = []; G.hellPlaced = false; G.hellCrewDone = false; const r = o.apply(this, arguments);
    if (G.stage === 3 && R && !R.cleared && R.type === 'combat' && R.waves && R.waves.some(w => w.some(q => q[0] === 'ghellaltar'))) { // 처음부터 빈 의식대가 놓여 있음
      const pt = GHELL.spot(); G.hellPlaced = true; if (pt) { GHELL_PLACE = true; try { const c = makeEnemy('ghellaltar', pt.x, pt.y); G.enemies.push(c); } finally { GHELL_PLACE = false; } } }
    return r; }; }
// 의식대 방: 의식대가 든 웨이브가 시작되면 주술사 둘이 자리에 소환됨
{ const o = spawnWave; spawnWave = function (w) {
    const c = G.hellPlaced && !G.hellCrewDone && w.some(q => q[0] === 'ghellaltar') && G.enemies.find(e => !e.dead && e.type === 'ghellaltar');
    if (c) { G.hellCrewDone = true; c.armed = true; const P = GHELL.posts(c);
      for (let i = 0; i < 2; i++) queueSpawn('ghcrew', { x: clamp(P[i][0] + rand(-6, 6), A.x0 + 10, A.x1 - 10), y: clamp(P[i][1] + rand(-10, 10), A.y0 + 10, A.y1 - 10) });
      w = w.filter(q => q[0] !== 'ghellaltar'); }
    return o.call(this, w); }; }
// 주술사 말고는 다 쓰러지면 의식대는 버려져 부서짐 (방 클리어를 막지 않게)
{ const o = updateRoom; updateRoom = function (dt) {
    const al = G.enemies.filter(e => !e.dead && e.type === 'ghellaltar');
    if (al.length && G.spawning === 0) {
      const others = G.enemies.filter(e => !e.dead && e.type !== 'ghellaltar' && !(e.crewOf && !e.crewOf.dead));
      const R = G.dun && G.dun.cur, rs = G.rs, last = R && R.waves && rs && rs.wave >= R.waves.length - 1;
      if (last && !others.length && al.every(c => c.armed && (!c.crew || c.crew.every(g => !g || g.dead || g.crewOf !== c)))) for (const c of al) { c.ph = 'idle'; c.hp = 0; killEnemy(c, true); }
    }
    for (const c of al) { c.recruitT -= dt; if (c.recruitT <= 0) { c.recruitT = 1.2; GHELL.recruit(c); } }
    return o.apply(this, arguments); }; }
// 웨이브: 3장 3 · 6 · 7 · 8등급 방에 한 대씩 (다른 장 거치 무기보다 자주)
PHASES_ORC[3][0].push(['ghellaltar', 1]); PHASES_ORC[6][1].push(['ghellaltar', 1]); PHASES_ORC[7][0].push(['ghellaltar', 1]); PHASES_ORC[8][1].push(['ghellaltar', 1]);
if (typeof CREWNAV !== 'undefined' && CREWNAV.wrap) CREWNAV.wrap(GHELL); // v3.33 자리까지 길찾기 · 끼임 방지
