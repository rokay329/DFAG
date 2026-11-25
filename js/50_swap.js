'use strict';
// 잿빛 왕관 토벌대 — 50_swap.js : v3.25 무기 바꾸기 모션 「뽑아 들기」 (숫자키 · 휠 · 터치 버튼)
// 든 무기를 아래로 내리며 몸을 낮춰 거두고(0.09초), 새 무기를 들어 올리며 몸을 펴 쥔다(0.17초). 쥐는 순간 작게 반짝임.
// 판정 · 쿨타임은 그대로이고 그림만 바뀜. 공격 · 기술을 시작하면 모션은 바로 끝남.
  const SWAPFX = (() => {
    const OUT = 0.09, IN = 0.17, D = OUT + IN;
    let t0 = -9, old = null;
    const ease = q => 1 - Math.pow(1 - q, 3), back = q => { const c = 1.9; return 1 + (c + 1) * Math.pow(q - 1, 3) + c * Math.pow(q - 1, 2); };
    const bell = (q, a, b) => q <= a || q >= b ? 0 : Math.sin((q - a) / (b - a) * Math.PI), st2 = v => Math.round(v / 2) * 2;
    const el = () => time - t0;
    function on() { const P = G && G.player; if (!P) return false; if (el() >= D || el() < 0) return false; if (!['idle', 'rattack'].includes(P.state)) { t0 = -9; return false; } return true; }
    function start(oldTex) { if (on() && el() < OUT) oldTex = old; /* 바꾸는 중에 또 바꾸면: 지금 보이는 무기를 거두는 것부터 다시 */ old = oldTex; t0 = time; }
    // 손에 든 무기 그리기를 비틈 (drawBlade에서 부름)
    function mod(b, x, y, ang) {
      const f = G.player.face || 1, e = el();
      if (e < OUT) { const p = e / OUT; if (!old) return null; return { b: old, x, y: y + p * 4, ang: ang + f * 1.4 * p, a: 1 - p }; }
      const q = Math.min(1, (e - OUT) / IN), k = back(q);
      return { b, x, y, ang: ang + f * 1.9 * (1 - k), a: Math.min(1, 0.35 + q * 2.2), w: q < 0.22 };
    }
    // 몸 동작 (playerPose와 같은 형식): 무기를 내리며 몸을 낮췄다가, 새 무기를 들어 올리며 몸을 펴고 제자리
    function pose(P) {
      const f = P.face || 1, e = el(), o = Math.min(1, e / OUT), q = e < OUT ? 0 : Math.min(1, (e - OUT) / IN);
      const dn = e < OUT ? ease(o) : 1 - Math.min(1, q / 0.35), up = bell(q, 0.25, 0.85);
      return { dx: st2(f * 2 * dn), dy: st2(2 * dn - 2 * up), sx: 1 + 0.06 * dn - 0.04 * up, sy: 1 - 0.07 * dn + 0.06 * up, rot: 0.1 * f * dn - 0.05 * f * up };
    }
    // 새 무기를 쥔 순간의 반짝임 (2px 칸) — 무기를 다 그린 뒤 위에
    function post() {
      const P = G.player, e = el() - OUT; if (e < 0) return; const q = e / IN; if (q <= 0.45 || q >= 0.95) return;
      const f = P.face || 1, gx = snap2(P.x + f * 8) + f * 4, gy = snap2(P.y - 6) - 10, n = Math.sin((q - 0.45) / 0.5 * Math.PI) > 0.6 ? 2 : 1;
      ctx.save(); ctx.fillStyle = '#fff4d8'; ctx.fillRect(gx - 1, gy - 1, 2, 2);
      for (let i = 1; i <= n; i++) { ctx.fillRect(gx - 1 + i * 2, gy - 1, 2, 2); ctx.fillRect(gx - 1 - i * 2, gy - 1, 2, 2); ctx.fillRect(gx - 1, gy - 1 + i * 2, 2, 2); ctx.fillRect(gx - 1, gy - 1 - i * 2, 2, 2); }
      ctx.restore();
    }
    return { on, start, mod, pose, post, D };
  })();
