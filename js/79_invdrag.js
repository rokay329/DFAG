'use strict';
// 잿빛 왕관 원정대 — 79_invdrag.js : v3.83 인벤토리에서 무기 · 유물을 끌어 창 밖에 놓으면 버리기 (PC 마우스)
//  · 무기: F 홀드 버리기와 같은 처리 (발밑에 내려놓음 · 다시 주울 수 있음 · 들고 있던 무기면 1번 무기를 듦)
//  · 유물: 발밑에 유물로 내려놓음 (다시 주우면 다시 얻음) · 능력치 다시 계산 · 최대 하트가 줄면 하트도 맞춰 줄임
//  · 4px 넘게 움직여야 끌기 시작 (그냥 클릭은 지금처럼 장착) · 창 안에 놓으면 취소 · 버릴 수 없는 곳(대장간 · 일시정지에서 연 창)에서는 끌리지 않음
const INVDRAG = (() => {
  let D = null, eatClick = false;
  const ui = () => document.getElementById('ui');
  const scl = () => { const r = ui().getBoundingClientRect(); return { r, s: r.width / 768 || 1 }; };
  const win = () => document.querySelector('#ovInv .invWin');
  const outside = (x, y) => { const w = win(); if (!w) return false; const b = w.getBoundingClientRect(); return x < b.left || x > b.right || y < b.top || y > b.bottom; };
  function ghost() { let g = document.getElementById('invGhost'); if (!g) { g = document.createElement('div'); g.id = 'invGhost'; ui().appendChild(g); } return g; }
  function place(x, y) { const g = ghost(), { r, s } = scl(); g.style.left = ((x - r.left) / s - 14) + 'px'; g.style.top = ((y - r.top) / s - 14) + 'px'; }
  function begin(e) {
    if (mode !== 'inv' || e.button !== 0 || (typeof TOUCH !== 'undefined' && TOUCH.on)) return;
    const w = e.target.closest && e.target.closest('#eqR .wSlot[data-id]'), rl = e.target.closest && e.target.closest('#invRelic .relicRow:not(.empty)');
    if (!w && !rl) return;
    let src;
    if (w) { const it = SAVE.inv.find(i => i.id === +w.dataset.id); if (!it) return; src = { k: 'w', it, img: w.querySelector('img'), c: gradeOf(it).c, el: w }; }
    else { const i = [...rl.parentNode.children].indexOf(rl), k = G && G.relics && G.relics[i]; if (!k) return; src = { k: 'r', i, key: k, img: rl.querySelector('img'), c: RELICS[k].c, el: rl }; }
    D = Object.assign(src, { x0: e.clientX, y0: e.clientY, on: false, out: false });
    e.preventDefault(); // 그림(img)을 끌면 브라우저 기본 끌기가 시작돼 마우스 움직임이 끊기므로 막음
  }
  function move(e) {
    if (!D) return;
    if (!D.on) { if (Math.hypot(e.clientX - D.x0, e.clientY - D.y0) < 4) return; if (!invCanDrop()) { D = null; return; } D.on = true; pxTip.hide();
      const g = ghost(); g.innerHTML = (D.img ? `<img class="px" src="${D.img.src}">` : '') + '<span>버리기</span>'; g.style.setProperty('--c', D.c); g.classList.add('on'); D.el.classList.add('dragSrc'); }
    D.out = outside(e.clientX, e.clientY); ghost().classList.toggle('out', D.out); place(e.clientX, e.clientY); e.preventDefault();
  }
  function end(e) {
    if (!D) return; const d = D; D = null;
    if (!d.on) return; eatClick = true; setTimeout(() => { eatClick = false; }, 0);
    ghost().classList.remove('on', 'out'); d.el.classList.remove('dragSrc');
    if (!d.out || !invCanDrop() || mode !== 'inv') return;
    const P = G.player;
    if (d.k === 'w') { dropWeapon(d.it, P.x + 16, P.y + 8); G.stats = calcStats(G.buffs); lootFeed(`「${d.it.name}」 버림`, d.c, 1400); }
    else { if (G.relics[d.i] !== d.key) return; G.relics.splice(d.i, 1); spawnLoot('relic', P.x + 16, P.y + 8); const L = G.loot[G.loot.length - 1]; if (L) { L.relic = d.key; L.t = -0.6; L.vz = 90; }
      G.stats = calcStats(G.buffs); P.hp = clamp(P.hp, 1, G.stats.hp); lootFeed(`「${RELICS[d.key].n}」 버림`, d.c, 1400); }
    persist(); sfx('drop'); renderInv();
  }
  addEventListener('mousedown', begin, true);
  addEventListener('mousemove', move, true);
  addEventListener('mouseup', end, true);
  addEventListener('dragstart', e => { if (e.target.closest && e.target.closest('#ovInv')) e.preventDefault(); }, true);
  addEventListener('click', e => { if (eatClick) { e.stopPropagation(); e.preventDefault(); eatClick = false; } }, true); // 끌고 난 뒤의 클릭(장착)은 무시
  { const st = document.createElement('style'); st.textContent = `
    #invGhost { position: absolute; z-index: 80; display: none; pointer-events: none; width: 28px; height: 28px; align-items: center; justify-content: center; background: #0d0a10; border: 1px solid #000; box-shadow: inset 0 0 0 1px var(--c, #3a2f40); }
    #invGhost.on { display: flex; } #invGhost img { width: 22px; height: 22px; image-rendering: pixelated; }
    #invGhost span { display: none; position: absolute; top: 30px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-family: 'Galmuri7'; font-size: 8px; line-height: 9px; padding: 1px 3px; color: #ffffff; background: #a8322a; box-shadow: 0 0 0 1px #000; } /* v3.83 글자 흰색 · 바탕은 흰 글자가 읽히게 어두운 빨강 */
    #invGhost.out { box-shadow: inset 0 0 0 1px #e06050; } #invGhost.out span { display: block; }
    .dragSrc { opacity: .35; }
    #ovInv .invHint #ivNote { margin-right: auto !important; }`; document.head.appendChild(st); } /* v3.83 원정 수첩 단추는 창 왼쪽 끝에 맞춤 */
  // 유물 칸 설명에 버리는 법 한 줄 (인벤토리 창에서만)
  { const o = renderInv; renderInv = function () { const r = o.apply(this, arguments); try { if (invCanDrop() && !(typeof TOUCH !== 'undefined' && TOUCH.on)) document.querySelectorAll('#invRelic .relicRow:not(.empty)').forEach(el => { el.dataset.tip += ' 창 밖으로 끌어 놓으면 버립니다.'; }); } catch (x) { console.error(x); } return r; }; }
  return { get on() { return !!(D && D.on); } };
})();
