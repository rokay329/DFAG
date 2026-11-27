// v3.65 잡몹 「약한 예고」 — 수가 많은 잡몹(종자 · 주민 · 재 망자 · 유령 병사 · 고블린 · 슬라임)용
// 엘리트 · 보스 예고보다 눈에 덜 띄게: 빗금 · 불씨 없이 흐린 바탕 + 바깥 테두리 + 차오르는 경계선만
// 부채꼴은 몸에 가려지는 안쪽을 비우고 앞쪽만 그린다
let WTELE = 2; /* 0 예고 없음 · 1 일반 예고 · 2 약한 예고 */
let WCOL = { base: '140,80,10', fill: '220,140,30', edge: '255,170,60', front: '255,230,170' }; /* 잡몹 예고 색: 호박색 (빨강 = 일반 · 엘리트, 진홍 + 금빛 = 보스) */
function weakTele(e, t, dur, states) {
  if (WTELE === 0) return;
  Object.assign(t, { t: 0, dur, owner: e, oSt: states, noImpact: true, weak: WTELE === 2, inner0: t.shape === 'cone' ? t.r * 0.3 : 0 });
  G.tele.push(t);
}
function weakPath(t, k) {
  const r0 = t.inner0, r = Math.max(r0 + 0.1, r0 + (t.r - r0) * k);
  ctx.beginPath();
  if (t.shape === 'cone') { ctx.arc(t.x, t.y, r, t.ang - t.arc / 2, t.ang + t.arc / 2); ctx.arc(t.x, t.y, r0, t.ang + t.arc / 2, t.ang - t.arc / 2, true); ctx.closePath(); }
  else ctx.arc(t.x, t.y, Math.max(0.1, t.r * k), 0, Math.PI * 2);
}
function drawWeakTele(t, p) {
  ctx.fillStyle = `rgba(${WCOL.base},${0.24 + 0.12 * p})`; weakPath(t, 1); ctx.fill();
  ctx.fillStyle = `rgba(${WCOL.fill},${0.28 + 0.3 * p})`; weakPath(t, p); ctx.fill();
}
function drawWeakGlow(t, p) {
  const near = p > 0.75, flick = near ? (Math.floor(time * 24) % 2 ? 1 : 0.45) : 1;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(${WCOL.edge},${(0.55 + 0.45 * p) * flick})`;
  ctx.beginPath();
  if (t.shape === 'cone') ctx.arc(t.x, t.y, t.r, t.ang - t.arc / 2, t.ang + t.arc / 2); else ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
  ctx.stroke();
  const r0 = t.inner0, rf = r0 + (t.r - r0) * p;
  ctx.lineWidth = 1; ctx.strokeStyle = `rgba(${WCOL.front},${0.6 + 0.4 * p})`;
  ctx.beginPath();
  if (t.shape === 'cone') ctx.arc(t.x, t.y, Math.max(0.1, rf), t.ang - t.arc / 2, t.ang + t.arc / 2); else ctx.arc(t.x, t.y, Math.max(0.1, t.r * p), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/* v3.65b 바깥 호 한 줄만 캐릭터 위에 다시 그림 — 붙어서 치는 잡몹은 예고 대부분이 몸에 가려짐 */
function drawWeakTop() {
  if (!G || !G.tele) return;
  for (const t of G.tele) {
    if (!t.weak) continue;
    const p = Math.min(1, Math.max(0, t.t / t.dur)), near = p > 0.75, flick = near ? (Math.floor(time * 24) % 2 ? 1 : 0.45) : 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${WCOL.edge},${(0.45 + 0.45 * p) * flick})`;
    ctx.beginPath();
    if (t.shape === 'cone') ctx.arc(t.x, t.y, t.r, t.ang - t.arc / 2, t.ang + t.arc / 2); else ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.stroke(); ctx.restore();
  }
}
