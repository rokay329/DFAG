'use strict';
// 잿빛 왕관 원정대 — 73_baldor_free.js : v3.80 발도르 해방 컷신
//  · 진엔딩 루트(이번 판에 2장 「저주의 주문」을 읽음)에서 발도르를 쓰러뜨리면: 그 자리에 멈춤 → 컷신(대화) 「…드디어, 해방이군.」 / 「고맙네. 낯선 이여.」 → 원래 사망 장면
//  · 주문 「해가 뜨지 않는 한, 너는 눕지 못하리라」와 이어짐 · 대사는 다가가지 않아도 바로 나옴
const BALFREE = (() => {
  const LINES = [['bal', '…드디어, 해방이군.'], ['bal', '고맙네. 낯선 이여.']];
  const isBal = e => e && e.type === 'boss' && !e.kind && G && G.stage === 2;
  const on = () => !!(G && G.truthRun && G.truthRun.t2);
  let B = null;
  function hold(e) { try { cancelTele(e); } catch (x) { /* 없음 */ } e.steps = null; e.dash = null; e.air = null; e.z = 0; e.state = 'recover'; e.t = 99; e.hold = true; e.vx = 0; e.vy = 0; }
  { const o = killEnemy; killEnemy = function (e, silent) {
      if (isBal(e) && !e.dead && !e.balPass && on()) { if (!e.balD) { e.balD = { t: 0 }; e.hp = 1; hold(e); B = e;
          G.tele = G.tele.filter(t => t.owner !== e); G.eproj = []; G.mproj = []; G.hazards = []; G.vortex = null; /* 칠흑의 장막도 걷힘 */ sfx('growl', 0.5); addShake(4); } return; }
      return o.apply(this, arguments); }; }
  { const o = damageEnemy; damageEnemy = function (e) { if (e && e.balD) return; return o.apply(this, arguments); }; }
  { const o = update; update = function (dt) { const r = o.apply(this, arguments);
      try { if (B && G && !B.dead && mode === 'play') { const D = B.balD; hold(B); D.t += dt;
          if (D.t >= 0.6 && !D.talk) { D.talk = true; const e = B, P = G.player; try { CINE.focus(Math.round((e.x + P.x) / 2), Math.round((e.y - 34 + P.y - 12) / 2)); } catch (x) { /* 시네마 없음 */ } /* 발도르와 주인공 사이를 화면 한가운데로 */ TRUTH.talk(LINES, () => { e.balPass = true; B = null; killEnemy(e); }); } }
        if (B && (!G || B.dead)) B = null; } catch (x) { console.error(x); B = null; }
      return r; }; }
  { const o = TRUTH3.spk; TRUTH3.spk = function (who) { if (who === 'bal' && B) return { x: B.x, y: B.y - (B.tall || 64) - 26 }; return o.apply(this, arguments); }; }
  return { get on() { return !!B; } };
})();
