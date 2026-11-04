'use strict';
// 잿빛 왕관 토벌대 — 절차적 BGM v2 (멜로디 곡)
// 외부 음원 없이 WebAudio로 실시간 연주한다. 곡마다 화음 진행·주선율·베이스·아르페지오·드럼 패턴이 정해져 있고 반복된다.
window.AudioSys = (() => {
  let ctx = null, comp, master, bgmGain, sfxBus, musicBus, reverb, revOut, noiseBuf, timer = null;
  const st = { bgm: 0.45, sfx: 1.0, muted: false };
  const VER = 2; // 저장된 옛 음량 설정은 한 번 새 기본값으로
  try { const sv = JSON.parse(localStorage.getItem('acr_audio') || '{}'); if (sv.v === VER) Object.assign(st, sv); } catch (e) { /* 무시 */ }
  const save = () => { try { localStorage.setItem('acr_audio', JSON.stringify(Object.assign({ v: VER }, st))); } catch (e) { /* 무시 */ } };

  // ------------------------------------------------------------ 악보
  // 음 이름 → MIDI. 숫자는 옥타브(C4 = 60).
  const NOTE = n => {
    if (n == null) return null;
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return base + (+m[3] + 1) * 12;
  };
  // 마디 문자열: "D5:2 A4:2 D5 E5 F5:2" — 길이는 8분음표 수(생략 시 1), "-:4"는 쉼표
  const bar = s => s.trim().split(/\s+/).map(tok => { const [n, l] = tok.split(':'); return [n === '-' ? null : NOTE(n), l ? +l : 1]; });
  const CH = {
    Dm: [50, 53, 57], Bb: [46, 50, 53], C: [48, 52, 55], Gm: [43, 46, 50], A: [45, 49, 52], Am: [45, 48, 52],
    Eb: [51, 55, 58], F: [53, 57, 60], Fh: [41, 45, 48],
  };
  // 테마 「잿빛 왕관」: 필드·타이틀·버티기가 같은 선율을 공유한다
  const THEME = [
    ['Dm', 'D5:2 A4:2 D5 E5 F5:2'], ['Dm', 'E5 D5 C#5:2 D5:4'], ['Bb', 'F5:2 D5:2 F5 G5 A5:2'], ['C', 'G5 F5 E5:2 C5:4'],
    ['Gm', 'G5:2 F5 E5 D5:2 Bb4:2'], ['A', 'C#5:2 E5:2 A5:3 G5'], ['Dm', 'F5 E5 D5:2 A4:2 F4:2'], ['A', 'E4:2 G4 A4 C#5:4'],
    ['Bb', 'Bb5:4 A5:2 G5:2'], ['C', 'A5:3 G5 E5:4'], ['Am', 'E5:2 A5:2 C6:2 B5 A5'], ['Dm', 'A5:4 F5:4'],
    ['Gm', 'G5:2 Bb5:2 A5 G5 F5:2'], ['Bb', 'F5:2 D5:2 E5:2 F5:2'], ['A', 'E5:2 C#5:2 E5 G5 A5:2'], ['A', 'A5:4 -:4'],
  ];
  const BOSS = [
    ['Dm', 'D5 D5 A5:2 G5 F5 E5 F5'], ['Dm', 'D5:2 A4:2 D5 E5 F5:2'], ['Bb', 'F5 F5 Bb5:2 A5 G5 F5 G5'], ['A', 'A5:4 E5:2 C#5:2'],
    ['Dm', 'D6:2 C6 A5 Bb5:2 A5:2'], ['Dm', 'G5 F5 E5 F5 D5:4'], ['Eb', 'Eb5:2 G5:2 Bb5:2 G5:2'], ['A', 'A5:2 G5 F5 E5:2 C#5:2'],
  ];
  const REST = [
    ['F', 'A4:4 C5:2 A4:2'], ['C', 'G4:4 E4:4'], ['Dm', 'F4:2 A4:2 D5:4'], ['Bb', 'C5:2 Bb4:2 A4:2 G4:2'],
    ['F', 'A4:4 C5:2 F5:2'], ['C', 'E5:4 C5:4'], ['Bb', 'D5:2 C5:2 Bb4:2 G4:2'], ['C', 'G4:4 -:4'],
  ];
  // 오크 부락: 낮은 음역의 무거운 행진 + 전쟁 북 (챕터 3)
  const ORC = [
    ['Dm', 'D4:2 D4 F4 E4:2 D4:2'], ['Bb', 'F4:2 D4 Bb3 C4:4'], ['C', 'E4:2 C4 E4 G4:2 F4:2'], ['A', 'E4:3 D4 C#4:4'],
    ['Dm', 'D5:2 C5 A4 Bb4:2 A4:2'], ['Gm', 'G4:2 Bb4 A4 G4:2 D4:2'], ['Eb', 'Eb4:2 G4:2 F4 Eb4 D4:2'], ['A', 'C#4:2 E4:2 A4:4'],
  ];
  const ORC_BOSS = [
    ['Dm', 'D5 D5 F5 D5 E5:2 D5:2'], ['Bb', 'D5 D5 F5 D5 Bb4:4'], ['C', 'E5 E5 G5 E5 F5:2 E5:2'], ['A', 'C#5:2 E5:2 A5:4'],
    ['Eb', 'G5:2 F5 Eb5 D5:2 Bb4:2'], ['Dm', 'A4:2 D5:2 F5 E5 D5:2'], ['Gm', 'Bb4:2 D5:2 G5:2 F5:2'], ['A', 'E5:2 C#5:2 A4:4'],
  ];
  // 무너진 성채: 타락 기사단의 의식장. 반음계 하강과 종소리 같은 긴 선율.
  const CITADEL = [
    ['Dm', 'D5:2 F5:2 E5 Eb5 D5:2'], ['Bb', 'D5:2 Bb4:2 D5 F5 G5:2'], ['Gm', 'Bb5:2 A5 G5 F5 Eb5:2'], ['A', 'E5:2 C#5:2 A4 C#5 D5:2'],
    ['Dm', 'F5:2 A5:2 G5 F5 Eb5:2'], ['Eb', 'G5:2 Bb5:2 A5 G5 F5:2'], ['Bb', 'D5:2 F5:2 Eb5 D5 C#5:2'], ['A', 'A4:2 C#5:2 E5:2 -:2'],
    ['Gm', 'G5:2 Bb5:2 D6:2 C6:2'], ['Dm', 'A5:2 F5:2 D5:2 C#5:2'], ['Eb', 'Eb5:2 G5:2 Bb5:2 G5:2'], ['A', 'F5:2 E5:2 C#5:2 A4:2'],
    ['Dm', 'D5:2 A4:2 D5 F5 G5:2'], ['Bb', 'F5:2 Eb5:2 D5 C#5 D5:2'], ['Gm', 'Bb4:2 D5:2 G5 F5 Eb5:2'], ['A', 'E5:2 C#5:2 D5:4'],
  ];
  const CITADEL_BOSS = [
    ['Dm', 'D5 D5 A5:2 F5 Eb5 D5'], ['Eb', 'Eb5 Eb5 Bb5:2 G5 F5 Eb5'], ['Bb', 'D5 F5 Bb5:2 A5 G5 F5'], ['A', 'C#5:2 E5:2 A5:4'],
    ['Dm', 'D6:2 C#6 A5 Bb5:2 A5:2'], ['Gm', 'G5 Bb5 D6:2 C6 Bb5 A5'], ['Eb', 'Eb6:2 D6 Bb5 G5 F5 Eb5'], ['A', 'A5:2 G5 F5 E5:2 C#5:2'],
  ];
  const CITADEL_REST = [
    ['Dm', 'A4:4 D5:4'], ['Bb', 'F4:4 Bb4:4'], ['Gm', 'D5:2 Bb4:2 G4:4'], ['A', 'E5:4 C#5:4'],
    ['Dm', 'F4:4 A4:4'], ['Eb', 'G4:4 Bb4:4'], ['Bb', 'D5:4 F5:4'], ['A', 'E5:4 -:4'],
  ];
  const song = (rows) => rows.map(([c, m]) => ({ ch: CH[c], mel: bar(m) }));
  const SONGS = {
    title:   { bpm: 76,  bars: song(THEME.slice(0, 8)), lead: 'bell',  leadVol: 0.07, bass: 'long', arp: 'harp', drum: null,    pad: 0.035, choir: 0.03 },
    field:   { bpm: 112, bars: song(THEME),             lead: 'pulse', leadVol: 0.06, bass: 'pulse', arp: 'harpsi', drum: 'field', pad: 0.025, choir: 0.02 },
    survive: { bpm: 132, bars: song(THEME),             lead: 'pulse', leadVol: 0.06, bass: 'pulse', arp: 'harpsi', drum: 'drive', pad: 0.025, choir: 0.025 },
    rest:    { bpm: 84,  bars: song(REST),              lead: 'lute',  leadVol: 0.08, bass: 'long', arp: 'lute',   drum: null,    pad: 0.03,  choir: 0.025 },
    orc:     { bpm: 104, bars: song(ORC),               lead: 'pulse', leadVol: 0.05, bass: 'drive', arp: null,     drum: 'war',  pad: 0.03,  choir: 0.04 },
    orcboss: { bpm: 140, bars: song(ORC_BOSS),          lead: 'pulse', leadVol: 0.06, bass: 'drive', arp: 'harpsi', drum: 'warboss', pad: 0.03, choir: 0.045, stab: true },
    citadel: { bpm: 96, bars: song(CITADEL),             lead: 'bell', leadVol: 0.065, bass: 'long', arp: 'harpsi', drum: 'field', pad: 0.045, choir: 0.035 },
    citadelSurvive: { bpm: 116, bars: song(CITADEL),      lead: 'pulse', leadVol: 0.06, bass: 'pulse', arp: 'harpsi', drum: 'drive', pad: 0.035, choir: 0.035 },
    citadelBoss: { bpm: 136, bars: song(CITADEL_BOSS),    lead: 'pulse', leadVol: 0.07, bass: 'drive', arp: 'harpsi', drum: 'boss', pad: 0.04, choir: 0.045, stab: true },
    citadelRest: { bpm: 72, bars: song(CITADEL_REST),     lead: 'bell', leadVol: 0.055, bass: 'long', arp: 'lute', drum: null, pad: 0.04, choir: 0.04 },
    boss:    { bpm: 152, bars: song(BOSS),              lead: 'pulse', leadVol: 0.065, bass: 'drive', arp: 'harpsi', drum: 'boss', pad: 0.03, choir: 0.04, stab: true },
  };

  let mood = 'title', nextMood = 'title', barIdx = 0, eighth = 0, nextT = 0;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  // ------------------------------------------------------------ 악기
  function env(g, t, a, peak, hold, r) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.setValueAtTime(Math.max(0.0002, peak), t + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + r);
  }
  function out(node, wet) {
    node.connect(musicBus);
    if (wet) { const s = ctx.createGain(); s.gain.value = wet; node.connect(s); s.connect(reverb); }
  }
  // 주선율: 펄스파(사각) + 한 옥타브 아래 삼각파, 살짝 떨림 — 8비트 고딕 오르간 느낌
  function pulse(m, t, dur, vol) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3000;
    const g = ctx.createGain();
    const o1 = ctx.createOscillator(); o1.type = 'square'; o1.frequency.value = mtof(m);
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = mtof(m - 12);
    const g2 = ctx.createGain(); g2.gain.value = 0.6;
    const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.5; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(dur > 0.3 ? 14 : 0, t + Math.min(0.25, dur));
    vib.connect(vg); vg.connect(o1.detune);
    o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(g);
    env(g, t, 0.008, vol, Math.max(0.02, dur * 0.85 - 0.008), 0.09); out(g, 0.28);
    for (const o of [o1, o2, vib]) { o.start(t); o.stop(t + dur + 0.2); }
  }
  // 성당 종
  function bell(m, t, dur, vol) {
    for (const [r, a] of [[1, 1], [2.76, 0.3], [5.4, 0.09]]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m) * r;
      const g = ctx.createGain(); env(g, t, 0.004, vol * a, 0, Math.max(0.6, dur * 1.5) / r + 0.2); o.connect(g); out(g, 0.6); o.start(t); o.stop(t + 3);
    }
  }
  // 류트·하프시코드: 뜯는 소리
  function pluck(m, t, vol, bright, decay) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(bright, t); f.frequency.exponentialRampToValueAtTime(400, t + decay);
    const g = ctx.createGain(); env(g, t, 0.002, vol, 0, decay);
    o.connect(f); f.connect(g); out(g, 0.35); o.start(t); o.stop(t + decay + 0.1);
  }
  function lute(m, t, dur, vol) { pluck(m, t, vol, 2400, Math.min(1.4, dur + 0.5)); }
  function bassNote(m, t, dur, vol, sharp) {
    const o = ctx.createOscillator(); o.type = sharp ? 'square' : 'triangle'; o.frequency.value = mtof(m);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = sharp ? 700 : 400;
    const g = ctx.createGain(); env(g, t, 0.005, vol, Math.max(0.02, dur * 0.7), 0.06);
    o.connect(f); f.connect(g); out(g, 0.08); o.start(t); o.stop(t + dur + 0.15);
  }
  function pad(ch, t, dur, vol, choirVol) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    const g = ctx.createGain();
    for (const m of ch) for (const dt of [-7, 7]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m + 12); o.detune.value = dt; o.connect(f); o.start(t); o.stop(t + dur + 1.2); }
    f.connect(g); env(g, t, 0.25, vol, Math.max(0.05, dur - 0.25), 0.8); out(g, 0.5);
    if (choirVol) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(ch[2] + 12);
      const sum = ctx.createGain(), cg = ctx.createGain();
      for (const [fr, q, a] of [[730, 7, 1], [1090, 9, 0.55], [2440, 12, 0.2]]) { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = q; const bg = ctx.createGain(); bg.gain.value = a; o.connect(b); b.connect(bg); bg.connect(sum); }
      sum.connect(cg); env(cg, t, 0.4, choirVol, Math.max(0.05, dur - 0.4), 1.2); out(cg, 0.9); o.start(t); o.stop(t + dur + 1.8);
    }
  }
  function kick(t, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    env(g, t, 0.002, vol, 0, 0.22); o.connect(g); out(g, 0.05); o.start(t); o.stop(t + 0.3);
  }
  function noiseHit(t, vol, type, freq, dec, wet) {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 0.8;
    const g = ctx.createGain(); env(g, t, 0.001, vol, 0, dec);
    n.connect(f); f.connect(g); out(g, wet); n.start(t); n.stop(t + dec + 0.05);
  }
  const snare = (t, vol) => { noiseHit(t, vol, 'bandpass', 1900, 0.16, 0.25); const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 190; env(g, t, 0.001, vol * 0.6, 0, 0.08); o.connect(g); out(g, 0.1); o.start(t); o.stop(t + 0.12); };
  const hat = (t, vol) => noiseHit(t, vol, 'highpass', 7500, 0.04, 0);
  function tom(t, vol, f0) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.5, t + 0.25);
    env(g, t, 0.002, vol, 0, 0.28); o.connect(g); out(g, 0.2); o.start(t); o.stop(t + 0.32);
  }
  function stab(ch, t, vol) {
    for (const m of ch) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m + 12);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2200, t); f.frequency.exponentialRampToValueAtTime(400, t + 0.35);
      const g = ctx.createGain(); env(g, t, 0.005, vol, 0.05, 0.3);
      o.connect(f); f.connect(g); out(g, 0.35); o.start(t); o.stop(t + 0.5);
    }
  }

  // ------------------------------------------------------------ 연주 (8분음표 단위)
  function playEighth(t) {
    const S = SONGS[mood], E = 60 / S.bpm / 2;
    const B = S.bars[barIdx % S.bars.length], ch = B.ch, root = ch[0];
    if (eighth === 0) pad(ch, t, E * 8, S.pad, S.choir);
    // 주선율
    let pos = 0;
    for (const [m, len] of B.mel) {
      if (pos === eighth && m != null) {
        const dur = len * E;
        if (S.lead === 'pulse') pulse(m, t, dur, S.leadVol);
        else if (S.lead === 'bell') bell(m, t, dur, S.leadVol);
        else lute(m, t, dur, S.leadVol);
      }
      pos += len;
    }
    // 베이스
    if (S.bass === 'pulse') bassNote(eighth % 2 ? root : root - 12, t, E, 0.09, true);
    else if (S.bass === 'drive') bassNote(eighth === 7 ? root + 12 : root - 12, t, E, 0.1, true);
    else if (eighth % 4 === 0) bassNote(root - 12, t, E * 4, 0.09, false);
    // 아르페지오
    const up = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12];
    if (S.arp === 'harpsi') pluck(up[eighth % 4] + (eighth >= 4 ? 12 : 0), t, 0.022, 3200, 0.22);
    else if (S.arp === 'harp' && eighth % 2 === 0) pluck(up[(eighth / 2) % 4] + 12, t, 0.02, 1800, 0.9);
    else if (S.arp === 'lute') pluck(up[eighth % 4], t, 0.024, 2000, 0.5);
    // 드럼
    if (S.drum === 'field') {
      if (eighth === 0 || eighth === 5) kick(t, 0.32);
      if (eighth === 2 || eighth === 6) snare(t, 0.07);
      hat(t, eighth % 2 ? 0.015 : 0.025);
    } else if (S.drum === 'drive') {
      if (eighth % 2 === 0) kick(t, 0.3);
      if (eighth === 2 || eighth === 6) snare(t, 0.09);
      hat(t, 0.025);
    } else if (S.drum === 'boss') {
      if (eighth === 0 || eighth === 3 || eighth === 4) kick(t, 0.36);
      if (eighth === 2 || eighth === 6) snare(t, 0.11);
      hat(t, 0.03); hat(t + E / 2, 0.015);
      if (barIdx % 4 === 3 && eighth >= 6) { tom(t, 0.22, 200); tom(t + E / 2, 0.22, 150); }
    }
    else if (S.drum === 'war') {
      if (eighth === 0 || eighth === 4) { kick(t, 0.34); tom(t, 0.2, 110); }
      if (eighth === 2 || eighth === 3) tom(t, 0.16, 92);
      if (eighth === 6) snare(t, 0.08);
      if (eighth === 7 && barIdx % 2 === 1) { tom(t, 0.18, 140); tom(t + E / 2, 0.16, 120); }
    } else if (S.drum === 'warboss') {
      if (eighth % 2 === 0) kick(t, 0.34);
      if (eighth % 2 === 1) tom(t, 0.2, eighth % 4 === 1 ? 160 : 120);
      if (eighth === 2 || eighth === 6) snare(t, 0.1);
      hat(t, 0.02);
      if (barIdx % 4 === 3 && eighth >= 6) { tom(t, 0.24, 200); tom(t + E / 2, 0.24, 150); }
    }
    if (S.stab && (eighth === 0 || (eighth === 3 && barIdx % 2 === 1))) stab(ch, t, 0.03);
  }
  function tick() {
    if (!ctx) return;
    if (ctx.currentTime > nextT + 1) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.2) {
      playEighth(nextT);
      eighth++;
      if (eighth >= 8) { eighth = 0; barIdx++; if (nextMood !== mood) { mood = nextMood; barIdx = 0; } }
      nextT += 60 / SONGS[mood].bpm / 2;
    }
  }
  function makeImpulse(sec, decay) {
    const len = Math.floor(ctx.sampleRate * sec), buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }
  function applyVol() {
    if (!ctx) return;
    const now = ctx.currentTime;
    bgmGain.gain.setTargetAtTime(st.muted ? 0 : st.bgm * 0.9, now, 0.08);
    sfxBus.gain.setTargetAtTime(st.sfx, now, 0.05);
  }

  return {
    st,
    get ctx() { return ctx; },
    get sfxBus() { return sfxBus; },
    get mood() { return nextMood; },
    init() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; return; }
      const limiter = ctx.createDynamicsCompressor(); limiter.threshold.value = -2; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.08; limiter.connect(ctx.destination);
      comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
      const makeup = ctx.createGain(); makeup.gain.value = 1.25; comp.connect(makeup); makeup.connect(limiter);
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(comp);
      bgmGain = ctx.createGain(); bgmGain.connect(master);
      sfxBus = ctx.createGain(); sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.connect(bgmGain);
      reverb = ctx.createConvolver(); reverb.buffer = makeImpulse(2.8, 2.6);
      revOut = ctx.createGain(); revOut.gain.value = 0.45; reverb.connect(revOut); revOut.connect(bgmGain);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      applyVol();
      nextT = ctx.currentTime + 0.1;
      timer = setInterval(tick, 30);
    },
    setMood(m, immediate) {
      if (!SONGS[m]) return;
      nextMood = m;
      if (!ctx || !immediate || m === mood) return;
      const old = musicBus;
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
      setTimeout(() => { try { old.disconnect(); } catch (e) { /* 무시 */ } }, 1500);
      musicBus = ctx.createGain(); musicBus.connect(bgmGain);
      mood = m; barIdx = 0; eighth = 0; nextT = ctx.currentTime + 0.08;
    },
    setVolume(kind, v) { st[kind] = Math.max(0, Math.min(1, v)); save(); applyVol(); },
    toggleMute() { st.muted = !st.muted; save(); applyVol(); return st.muted; },
    // 테스트용: 각 마디가 8분음표 8개인지 확인
    _check() { const bad = []; for (const [k, S] of Object.entries(SONGS)) S.bars.forEach((b, i) => { const n = b.mel.reduce((a, x) => a + x[1], 0); if (n !== 8) bad.push(`${k}#${i + 1}=${n}`); }); return bad; },
  };
})();
