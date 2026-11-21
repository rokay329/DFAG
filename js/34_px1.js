'use strict';
// 잿빛 왕관 원정대 — 34_px1.js : v3.19 1px 도트 보기 (F7 · 주소 끝 ?px1)
// 게임은 도트 한 칸을 2px로 그린다(768×432). 이 보기를 켜면 다 그린 화면을 384×216(한 칸 = 1px)으로 줄이고, 창도 모니터 픽셀 384×216 크기로 줄여 키우지 않고 그대로 보여 준다.
// 그림 · 게임 규칙은 그대로이고 보여 주는 단계만 바뀐다. HUD(체력 · 스킬 칸 · 글자 상자)도 같은 비율로 작아진다.
  const PX1 = (() => {
    const c = document.createElement('canvas'); c.id = 'px1'; c.width = VW / 2; c.height = VH / 2;
    Object.assign(c.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', imageRendering: 'pixelated', pointerEvents: 'none', display: 'none' });
    cv.insertAdjacentElement('afterend', c);
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const tag = document.createElement('div'); tag.textContent = '1px 도트 보기 (F7)';
    Object.assign(tag.style, { position: 'absolute', right: '0', top: '-22px', whiteSpace: 'nowrap', padding: '2px 6px', background: 'rgba(11,10,14,.8)', color: '#f0d080', border: '1px solid #8a6a2a', font: '10px Galmuri9, monospace', pointerEvents: 'none', display: 'none', zIndex: 50 });
    cv.parentElement.appendChild(tag);
    let on = false;
    const set = v => { on = !!v; window.PX1_ON = on; c.style.display = on ? 'block' : 'none'; tag.style.display = on ? 'block' : 'none'; if (typeof fit === 'function') fit(); try { localStorage.setItem('acr_px1', on ? '1' : '0'); } catch (e) {} };
    // 칸은 짝수 좌표에 2×2로 찍혀 있으므로 가장 가까운 점을 고르는 축소로 한 칸이 한 점이 된다
    const draw = () => { if (!on) return; g.clearRect(0, 0, c.width, c.height); g.drawImage(cv, 0, 0, VW, VH, 0, 0, c.width, c.height); };
    let init = /[?&]px1\b/.test(location.search); try { if (!init && localStorage.getItem('acr_px1') === '1') init = true; } catch (e) {}
    set(init);
    window.addEventListener('keydown', e => { if (e.key === 'F7') { e.preventDefault(); set(!on); } });
    return { draw, set, get on() { return on; } };
  })();
  { const r0 = render; render = function () { r0.apply(this, arguments); PX1.draw(); }; }
