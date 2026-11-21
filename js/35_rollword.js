'use strict';
// 잿빛 왕관 원정대 — 35_rollword.js : v3.19 기사 · 거너 · 사제(구르기)일 때 화면 글자의 「점멸」을 「구르기」로 (조사 · 활용까지 맞춤)
// 화면의 글자 마디를 지켜보다가, 구르기 직업이면 바꾸고 아니면 원래 글자로 되돌린다 (원문은 마디마다 따로 기억).
  const ROLLWORD = (() => {
    const RULES = [
      [/점멸합니다/g, '구릅니다'], [/점멸해서/g, '굴러서'], [/점멸하면/g, '구르면'], [/점멸할 때/g, '구를 때'], [/점멸하여/g, '굴러'],
      [/점멸한/g, '구른'], [/점멸을/g, '구르기를'], [/점멸이/g, '구르기가'], [/점멸은/g, '구르기는'], [/점멸과/g, '구르기와'], [/점멸/g, '구르기']];
    const conv = s => RULES.reduce((a, [r, t]) => a.replace(r, t), s);
    const ORIG = new WeakMap();
    const on = () => typeof isRoll === 'function' && isRoll();
    function fix(node, roll) {
      let o = ORIG.get(node);
      if (o == null) { if (!node.nodeValue || node.nodeValue.indexOf('점멸') < 0) return; o = node.nodeValue; ORIG.set(node, o); }
      else if (node.nodeValue !== o && node.nodeValue !== conv(o)) { if (node.nodeValue.indexOf('점멸') < 0) { ORIG.delete(node); return; } o = node.nodeValue; ORIG.set(node, o); } // 다른 글로 바뀜
      const want = roll ? conv(o) : o; if (node.nodeValue !== want) node.nodeValue = want;
    }
    function walk(root, roll) { if (!root) return; if (root.nodeType === 3) return fix(root, roll); const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) fix(n, roll); }
    let last = null;
    const mo = new MutationObserver(ms => { const roll = on(); for (const m of ms) { if (m.type === 'characterData') fix(m.target, roll); else for (const n of m.addedNodes) walk(n, roll); } });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
    setInterval(() => { const roll = on(); if (roll !== last) { last = roll; walk(document.body, roll); } }, 300); // 직업이 바뀌거나 Shift+K로 켜고 끌 때 전체를 다시 맞춤
    return { conv };
  })();
  // v3.19 네로 · 세리안 회피 칸 아이콘: 점멸했을 때 남는 자기 잔상 (푸른 잔상 팔레트) — 뒤에 흐린 잔상 한 겹 + 앞에 또렷한 잔상, 머리 · 어깨만
  {
    const CROP = { hRanger: [5, 0, 17, 10], hMage: [6, 4, 19, 15] }; // [x0, y0, x1, y1]
    const dim = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => Math.round(v * k).toString(16).padStart(2, '0'); return '#' + f(n >> 16) + f((n >> 8) & 255) + f(n & 255); };
    for (const m of ['hRanger', 'hMage']) {
      const src = MAPS[m], gp = PAL[m + 'Ghost']; if (!src || !gp) continue;
      const [x0, y0, x1, y1] = CROP[m], rows = src.slice(y0, y1 + 1).map(r => r.slice(x0, x1 + 1)), w = x1 - x0 + 1, h = y1 - y0 + 1;
      const ox = 16 - w - 0, oy = 16 - h - 3; // 아래 3칸 비움: 회피 횟수 선이 잔상 위에 묻히지 않게
      ICON32['ghost_' + m] = icon32(['#0a0816', '#141030', '#221a48'], a => { a.layer('top');
        const put = (dx, pal, k) => rows.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.' && pal[c]) { const X = (x + ox + dx) * 2, Y = (y + oy) * 2; if (X >= 0 && Y >= 0 && X < 32 && Y < 32) a.rect(X, Y, X + 1, Y + 1, k === 1 ? pal[c] : dim(pal[c], k)); } }));
        put(-4, gp, 0.45); put(-2, gp, 0.7); put(0, gp, 1); }); // 뒤로 갈수록 흐린 잔상 두 겹
    }
  }
  // v3.19 회피 칸 아이콘: 구르기 직업은 몸을 동그랗게 만 그 직업의 말림 도트를 뒤집힌(180°) 채로 (16칸 아이콘 안에 그대로, 외곽선 한 겹), 아니면 예전 점멸 아이콘
  {
    for (const m of ['hKnight', 'hPriest', 'hGunner']) {
      const src = MAPS[m + '_rcurl'], pal = PAL[m]; if (!src) continue;
      const rows = src.slice().reverse().map(r => [...r].reverse().join('')); // 공중에서 뒤집힌(180°) 모습
      let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }));
      const ox = Math.floor((16 - (x1 - x0 + 1)) / 2) - x0, oy = Math.floor((16 - (y1 - y0 + 1)) / 2) - y0 + 1;
      ICON32['roll_' + m] = icon32(['#081020', '#0e2040', '#1a3a70'], a => { a.layer('top'); /* 도트에 외곽선이 이미 있으므로 아이콘 외곽선을 또 두르지 않는 top 층에 */ rows.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.' && pal[c]) { const X = (x + ox) * 2, Y = (y + oy) * 2; if (X >= 0 && Y >= 0 && X < 32 && Y < 32) a.rect(X, Y, X + 1, Y + 1, pal[c]); } })); });
    }
    const want = () => { if (!G || !CLASSES[G.cls]) return 'blink'; const m = CLASSES[G.cls].map; if (typeof isRoll === 'function' && isRoll() && ICON32['roll_' + m]) return 'roll_' + m; return ICON32['ghost_' + m] ? 'ghost_' + m : 'blink'; }; // 구르기 직업은 말림, 점멸 직업은 자기 잔상
    const d0 = drawIcon32; drawIcon32 = function (c, key) { if (key === 'blink' && c) key = want(); d0(c, key); if (c) c.dataset.ik = key; };
    setInterval(() => { const k = want(); for (const id of ['skD', 'tDodge']) { const el = document.getElementById(id), c = el && el.querySelector('canvas'); if (c && c.dataset.ik !== k) drawIcon32(c, 'blink'); } }, 300);
  }
