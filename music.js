'use strict';
// 잿빛 왕관 토벌대 — 절차적 BGM v5 (SFC 사양 준수 샘플 음원)
// 슈퍼패미컴 음원(S-SMP/S-DSP) 사양 안에서만 소리를 낸다.
//   · 동시 발음 8채널: 0 주선율 · 1 반주 · 2~4 화음 · 5 베이스 · 6 북 · 7 심벌·잡음. 같은 채널의 새 음은 이전 음을 끊는다(키오프)
//   · 32kHz 샘플 + 루프: 모든 악기는 BRR로 치면 몇 KB짜리 짧은 샘플(어택 + 반복 구간). 음높이는 재생 속도로만 바꾸고 최대 4배(+2옥타브)
//   · 채널별 필터 없음. 음색은 샘플 자체 · ADSR/GAIN 음량 엔벨로프 · 피치 변조(비브라토)만
//   · 하드웨어 노이즈 발생기 하나(하이햇·탬버린·심벌)
//   · 에코: 지연 16ms 단위 1~15(최대 240ms) · 피드백 · 8탭 FIR · 채널별 켜기/끄기 · 에코 버퍼 16ms당 2KB
//   · 곡마다 샘플 + 에코 버퍼 + 드라이버가 64KB 음원 메모리 안에 들어가는지 _check()로 검사
// 외부 음원 파일 없이, 시작할 때 샘플을 직접 합성해 둔다.
window.AudioSys = (() => {
  let ctx = null, comp, master, bgmGain, sfxBus, musicBus, sfcLP, echoIn, echoDelay, echoFb, echoOut, timer = null;
  let SMP = null;
  const st = { bgm: 0.45, sfx: 1.0, muted: false };
  const VER = 2; // 저장된 옛 음량 설정은 한 번 새 기본값으로
  try { const sv = JSON.parse(localStorage.getItem('acr_audio') || '{}'); if (sv.v === VER) Object.assign(st, sv); } catch (e) { /* 무시 */ }
  const save = () => { try { localStorage.setItem('acr_audio', JSON.stringify(Object.assign({ v: VER }, st))); } catch (e) { /* 무시 */ } };

  // ------------------------------------------------------------ 악보
  // 음 이름 → MIDI (C4 = 60)
  const NOTE = n => {
    const m = /^([A-G])(#|b)?(\d)$/.exec(n);
    if (!m) throw new Error('bad note ' + n);
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return base + (+m[3] + 1) * 12;
  };
  // 마디 문자열 "D5:2 A4 -:2" — 길이 단위는 sc×16분음표(기본 sc=2 → 8분음표), "-"는 쉼표
  const bar = (s, sc) => s.trim().split(/\s+/).map(tok => { const [n, l] = tok.split(':'); return [n === '-' ? null : NOTE(n), (l ? +l : 1) * sc]; });
  // 화음 "Dm" "Bb" "A7" "F#dim" → 3옥타브 근음 기준 구성음
  const CHORD = c => {
    const m = /^([A-G])(#|b)?(m7|m|dim|7)?$/.exec(c);
    if (!m) throw new Error('bad chord ' + c);
    const r = 48 + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const iv = { m: [0, 3, 7], dim: [0, 3, 6], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10] }[m[3]] || [0, 4, 7];
    return iv.map(i => r + i);
  };
  // 곡 정의 → 마디마다 16분음표 칸별 시작 음표 표
  function mk(def) {
    const M = def.M || 16, sc = def.sc || 2;
    def.M = M;
    def.bars = def.rows.map(([c, mel]) => {
      const notes = bar(mel, sc), on = new Array(M).fill(null);
      let p = 0;
      for (const [m, l] of notes) { if (m != null && p < M) on[p] = [m, l]; p += l; }
      return { ch: CHORD(c), on, len: p };
    });
    return def;
  }

  // 테마 「잿빛 왕관」 (타이틀) — 8분음표 단위
  const THEME = [
    ['Dm', 'D5:2 A4:2 D5 E5 F5:2'], ['Dm', 'E5 D5 C#5:2 D5:4'], ['Bb', 'F5:2 D5:2 F5 G5 A5:2'], ['C', 'G5 F5 E5:2 C5:4'],
    ['Gm', 'G5:2 F5 E5 D5:2 Bb4:2'], ['A', 'C#5:2 E5:2 A5:3 G5'], ['Dm', 'F5 E5 D5:2 A4:2 F4:2'], ['A', 'E4:2 G4 A4 C#5:4'],
    ['Bb', 'Bb5:4 A5:2 G5:2'], ['C', 'A5:3 G5 E5:4'], ['Am', 'E5:2 A5:2 C6:2 B5 A5'], ['Dm', 'A5:4 F5:4'],
    ['Gm', 'G5:2 Bb5:2 A5 G5 F5:2'], ['Bb', 'F5:2 D5:2 E5:2 F5:2'], ['A', 'E5:2 C#5:2 E5 G5 A5:2'], ['A', 'A5:4 -:4'],
  ];
  const DR = { // 드럼 패턴 (k 킥 · s 스네어 · h 닫힌 하이햇 · o 열린 하이햇 · t/T 낮은/높은 탐 · c 크래시 · m 쇳소리)
    title:  ['k.......s.......', 'k.......s...k...'],
    field:  ['k.h.s.h.k.hks.h.'],
    fieldF: 'k.h.s.h.k.s.sTtt',
    drive:  ['k.h.s.hkk.h.s.hh'],
    driveF: 'k.h.s.hks.s.ssTt',
    boss1:  ['k.hks.hkk.hks.hs'],
    boss1F: 'k.k.s.s.ssssTTtt',
    proc:   ['k...h...t...h...', 'k...h...t...t.t.'],
    surv2:  ['k.hhs.hhk.hhs.hh'],
    surv2F: 'k.hhs.hhs.s.sstt',
    boss2:  ['k.s.k.s.kks.k.ss'],
    boss2F: 'kksskksskkssTTtt',
    war6:   ['k..t.tk..t.t'],
    war6F:  'k.tk.tTTTttt',
    gallop: ['k.tkk.tks.tkk.tk'],
    gallF:  'k.tkk.tks.s.TTtt',
    war4:   ['k.tkk.tTs.tTk.tT'],
    war4F:  'kTkTkTkTttttssss',
    hand:   ['t.....t..t..'],
    march:  ['k...s..sk...s.ss'],
    marchF: 'k...s..ss.s.ssss',
    drive4: ['k.h.s.hkk.hks.hh'],
    drive4F:'k.h.s.hks.s.sTtt',
    waltz:  ['k...s...s...', 'k...s...s.s.'],
    waltzF: 'k...s.s.ssTt',
    forge:  ['k.m.s.m.k.mms.m.'],
    forgeF: 'k.m.s.m.k.mmsTtt',
    vict:   ['k.h.s.h.k.h.s.h.'],
  };
  const SONGS = {
    title: mk({ bpm: 92, rows: THEME,
      lead: { i: 'brass', vol: 0.11 }, p2: { style: 'arp16', i: 'harp', vol: 0.09 }, pad: { i: 'strpad', vol: 0.05 }, bass: { style: 'walk', i: 'contra' }, drum: { pat: DR.title, kit: 'orch', vol: 0.8 }, echo: { t: 0.2, fb: 0.45, mix: 0.4 } }),
    victory: mk({ bpm: 116, rows: [
      ['D', 'D5 F#5 A5 D6:2 A5 F#5 A5'], ['G', 'B5:2 A5 G5 F#5:2 E5:2'], ['A', 'E5 F#5 G5 A5:2 G5 F#5 E5'], ['D', 'F#5:3 E5 D5:4'],
      ['Bm', 'D5 F#5 B5:2 A5 G5 F#5:2'], ['G', 'G5:2 B5:2 D6:2 B5:2'], ['Em', 'E5:2 G5 A5 B5:2 G5:2'], ['A7', 'A5:2 G5 F#5 E5:2 C#5:2'],
    ], lead: { i: 'brass', vol: 0.11 }, p2: { style: 'harm', iv: -12, i: 'horn', vol: 0.6 }, pad: { i: 'strpad', vol: 0.045 }, bass: { style: 'oct8', i: 'bassP' }, drum: { pat: DR.vict, kit: 'orch', vol: 0.8 }, echo: { t: 0.16, fb: 0.4, mix: 0.35 } }),
    forge: mk({ bpm: 132, rows: [
      ['C', 'E5 G5 C6 G5 E5:2 G5:2'], ['F', 'F5 A5 C6 A5 F5:2 A5:2'], ['G', 'G5 B5 D6 B5 G5 F5 E5 D5'], ['C', 'C5:2 E5:2 G5:2 -:2'],
      ['Am', 'A5:2 G5 E5 C5:2 E5:2'], ['F', 'F5:2 E5 D5 C5:2 A4:2'], ['G', 'B4 C5 D5 E5 F5 E5 D5 B4'], ['C', 'C5:4 G4:4'],
    ], lead: { i: 'clar', vol: 0.1, gate: 0.7 }, p2: { style: 'pluck8', i: 'pizz', vol: 0.1 }, bass: { style: 'oct8', i: 'bassP' }, drum: { pat: DR.forge, fill: DR.forgeF, kit: 'light', vol: 0.9 }, echo: { t: 0.14, fb: 0.35, mix: 0.3 } }),

    // ---------------- 1장 잿빛 초원 — G장조, 메아리 펄스
    s1: mk({ bpm: 124, rows: [
      ['G', 'D5 G5 A5 B5:2 A5 G5 A5'], ['C', 'C6:2 B5 A5 G5:2 E5:2'], ['Em', 'B4 E5 F#5 G5:2 F#5 E5 D5'], ['D', 'F#5:3 E5 D5:4'],
      ['G', 'D5 G5 A5 B5:2 D6 C6 B5'], ['C', 'E6:2 D6 C6 B5:2 A5:2'], ['Am', 'C6 B5 A5 G5 E5:2 F#5:2'], ['D', 'A5:4 -:2 D5 F#5'],
      ['Em', 'G5:3 F#5 E5:2 B4:2'], ['C', 'C5:2 E5:2 G5:3 F#5'], ['D', 'F#5:2 A5:2 D6:3 C6'], ['Bm', 'B5:4 F#5:4'],
      ['C', 'E5 G5 C6:2 B5 A5 G5:2'], ['G', 'D5 G5 B5:2 A5 G5 F#5:2'], ['Am', 'E5 A5 C6:2 B5 A5 F#5:2'], ['D7', 'A5:3 G5 F#5:2 E5:2'],
    ], lead: { i: 'flute', vol: 0.11, gate: 0.85 }, p2: { style: 'pluck8', i: 'harp', vol: 0.085 }, pad: { i: 'strpad', vol: 0.035 }, bass: { style: 'oct8', i: 'bassP' }, drum: { pat: DR.field, fill: DR.fieldF, kit: 'light', vol: 0.85 }, echo: { t: 0.18, fb: 0.45, mix: 0.45 } }),
    s1Survive: mk({ bpm: 148, rows: [
      ['Em', 'E5 E5 G5 E5 B5:2 A5 G5'], ['C', 'E5 E5 G5 E5 C6:2 B5 A5'], ['D', 'F#5 F#5 A5 F#5 D6:2 C6 A5'], ['B', 'B5:2 A5 G5 F#5:2 D#5:2'],
      ['Em', 'G5:2 B5:2 E6:2 D6 B5'], ['C', 'C6:2 B5 A5 G5:2 E5:2'], ['Am', 'A5 C6 B5 A5 G5:2 F#5:2'], ['B', 'D#5:2 F#5:2 B5:4'],
    ], lead: { i: 'strings', vol: 0.1, gate: 0.8 }, p2: { style: 'arp16', i: 'pizz', vol: 0.09 }, bass: { style: 'oct8', i: 'bassP' }, drum: { pat: DR.drive, fill: DR.driveF, kit: 'orch', vol: 0.9 }, echo: { t: 0.15, fb: 0.35, mix: 0.3 } }),
    s1Boss: mk({ bpm: 164, rows: [
      ['Em', 'E5 B4 E5 F#5 G5 F#5 E5 B4'], ['Em', 'E5 B4 E5 F#5 G5 A5 B5:2'], ['C', 'C6 B5 A5 G5 A5:2 E5:2'], ['D', 'D6 C6 B5 A5 B5:2 F#5:2'],
      ['Am', 'A5:2 C6:2 E6:2 D6 C6'], ['Em', 'B5:2 G5:2 E5:2 G5 B5'], ['C', 'C6 C6 B5 B5 A5 A5 G5 G5'], ['B7', 'F#5:2 A5:2 B5:2 D#6:2'],
    ], lead: { i: 'brass', vol: 0.11 }, p2: { style: 'arp16', i: 'harpsi', vol: 0.07, oct: 12 }, pad: { i: 'strings', vol: 0.035 }, bass: { style: 'drive16', i: 'bassP' }, drum: { pat: DR.boss1, fill: DR.boss1F, kit: 'orch', vol: 1 }, echo: { t: 0.15, fb: 0.35, mix: 0.3 }, stab: true }),
    s1Rest: mk({ bpm: 80, M: 12, rows: [
      ['G', 'B4:2 D5:2 G5:2'], ['C', 'E5:3 D5 C5:2'], ['G', 'D5:2 B4:2 G4:2'], ['D', 'A4:4 -:2'],
      ['Em', 'G4:2 B4:2 E5:2'], ['C', 'G5:3 F#5 E5:2'], ['Am', 'C5:2 E5 D5 C5:2'], ['D', 'F#4:4 A4:2'],
    ], lead: { i: 'celesta', vol: 0.12 }, p2: { style: 'pluck8', i: 'harp', vol: 0.08 }, pad: { i: 'strpad', vol: 0.03 }, bass: { style: 'waltz', i: 'bassP' }, drum: null, echo: { t: 0.24, fb: 0.5, mix: 0.55 } }),

    // ---------------- 2장 무너진 성채 — D 프리지안, 성가와 오르간
    s2: mk({ bpm: 92, rows: [
      ['Dm', 'D5:2 F5:2 A5:3 G5'], ['Eb', 'G5:2 F5 Eb5 D5:4'], ['Dm', 'A4:2 D5:2 F5 G5 A5:2'], ['Eb', 'Bb5:3 A5 G5:2 Eb5:2'],
      ['Gm', 'D5:2 G5:2 Bb5:2 A5 G5'], ['Cm', 'Eb5:2 G5:2 C6:3 Bb5'], ['Bb', 'D6 C6 Bb5 A5 G5:2 F5:2'], ['Eb', 'Eb5:4 -:4'],
      ['Dm', 'F5:4 Eb5:2 D5:2'], ['Cm', 'C5:2 Eb5:2 G5:2 F5:2'], ['Bb', 'D5:2 F5:2 Bb5:4'], ['A', 'A5:2 G5 F5 E5:2 C#5:2'],
      ['Dm', 'D5:2 A5:2 G5 F5 Eb5:2'], ['Eb', 'G5:2 Bb5:2 A5 G5 F5:2'], ['Gm', 'Bb4:2 D5:2 G5 F5 Eb5:2'], ['A', 'C#5:2 E5:2 D5:4'],
    ], lead: { i: 'reed', vol: 0.1, gate: 0.95 }, p2: { style: 'trem', i: 'organ', vol: 0.03 }, pad: { i: 'choir', vol: 0.045 }, bass: { style: 'long', i: 'contra' }, drum: { pat: DR.proc, kit: 'orch', vol: 0.75 }, echo: { t: 0.24, fb: 0.55, mix: 0.55 } }),
    s2Survive: mk({ bpm: 128, rows: [
      ['Dm', 'D5 Eb5 D5 A4 D5 Eb5 F5 Eb5'], ['Dm', 'D5 Eb5 D5 A4 G5:2 F5 Eb5'], ['Eb', 'Eb5 F5 Eb5 Bb4 Eb5 F5 G5 F5'], ['Eb', 'Eb5 F5 Eb5 Bb4 Bb5:2 A5 G5'],
      ['Cm', 'C6:2 Bb5 G5 Eb5:2 G5:2'], ['Bb', 'D6:2 C6 Bb5 F5:2 D5:2'], ['Gm', 'G5 Bb5 A5 G5 F5 Eb5 D5 C5'], ['A', 'C#5:2 E5:2 A5:2 C#6:2'],
    ], lead: { i: 'strings', vol: 0.1, gate: 0.8 }, p2: { style: 'arp16', i: 'harpsi', vol: 0.07 }, pad: { i: 'organ', vol: 0.02 }, bass: { style: 'oct8', i: 'contra' }, drum: { pat: DR.surv2, fill: DR.surv2F, kit: 'orch', vol: 0.9 }, echo: { t: 0.18, fb: 0.4, mix: 0.4 } }),
    s2Boss: mk({ bpm: 144, rows: [
      ['Dm', 'D5 D5 Eb5 D5 A5:2 G5 F5'], ['Eb', 'Eb5 Eb5 F5 Eb5 Bb5:2 A5 G5'], ['Dm', 'F5 A5 D6:2 C6 Bb5 A5:2'], ['Eb', 'G5 Bb5 Eb6:2 D6 C6 Bb5:2'],
      ['Gm', 'D6:2 Bb5:2 G5:2 Bb5 D6'], ['Cm', 'Eb6:2 C6:2 G5:2 C6 Eb6'], ['Bb', 'D6 C6 Bb5 A5 G5 F5 Eb5 D5'], ['A', 'C#5:2 E5:2 A5:2 G5 E5'],
    ], lead: { i: 'brass', vol: 0.11 }, p2: { style: 'arp16', i: 'harpsi', vol: 0.07, oct: 12 }, pad: { i: 'choir', vol: 0.045 }, bass: { style: 'drive16', i: 'bassP' }, drum: { pat: DR.boss2, fill: DR.boss2F, kit: 'orch', vol: 1 }, echo: { t: 0.18, fb: 0.4, mix: 0.4 }, stab: true }),
    s2Rest: mk({ bpm: 66, M: 12, rows: [
      ['Dm', 'A4:2 D5:2 F5:2'], ['Bb', 'F5:4 D5:2'], ['Gm', 'G5:2 F5:2 Eb5:2'], ['Dm', 'D5:6'],
      ['Eb', 'Eb5:2 G5:2 Bb5:2'], ['Dm', 'A5:4 F5:2'], ['Gm', 'G5:2 Bb4:2 C5:2'], ['A', 'C#5:4 E5:2'],
    ], lead: { i: 'choir', vol: 0.09, gate: 0.97, oct: -12 }, p2: { style: 'trem', i: 'organ', vol: 0.025 }, bass: { style: 'long', i: 'contra' }, drum: null, echo: { t: 0.24, fb: 0.55, mix: 0.6 } }),

    // ---------------- 3장 핏빛 엄니 부락 — A 프리지안 도미넌트, 6/8 전쟁 북
    s3: mk({ bpm: 108, M: 12, rows: [
      ['A', 'A4 A4 Bb4 A4:2 E4'], ['A', 'A4 C#5 D5 E5:2 D5'], ['Bb', 'F5:2 E5 D5:2 C#5'], ['A', 'E5:3 A4:3'],
      ['Dm', 'D5:2 F5 E5:2 D5'], ['Bb', 'Bb4:2 D5 F5:2 E5'], ['A', 'C#5 D5 E5 F5 E5 D5'], ['A', 'C#5:2 Bb4 A4:3'],
      ['Dm', 'A5:2 F5 D5:2 F5'], ['Gm', 'G5:2 D5 Bb4:2 D5'], ['Bb', 'F5 E5 D5 E5:2 F5'], ['A', 'E5:6'],
      ['Dm', 'D5 F5 A5 G5:2 F5'], ['Bb', 'F5 D5 Bb4 C#5:2 D5'], ['A', 'E5 F5 E5 D5 C#5 Bb4'], ['A', 'A4:6'],
    ], lead: { i: 'horn', vol: 0.12, oct: -12 }, p2: { style: 'harm', iv: -5, i: 'sitar', vol: 0.8 }, bass: { style: 'drone6', i: 'contra' }, drum: { pat: DR.war6, fill: DR.war6F, kit: 'tribal', vol: 1 }, echo: { t: 0.12, fb: 0.3, mix: 0.3 } }),
    s3Survive: mk({ bpm: 132, rows: [
      ['A', 'A4 A4 Bb4 A4 E5:2 D5 C#5'], ['Dm', 'D5 D5 E5 D5 A5:2 G5 F5'], ['Bb', 'F5 F5 E5 D5 C#5:2 D5 E5'], ['A', 'E5:4 A4:4'],
      ['A', 'A5 A5 G5 F5 E5:2 F5 E5'], ['Gm', 'D5 D5 Bb4 D5 G5:2 F5 E5'], ['Bb', 'F5 E5 D5 C#5 Bb4 C#5 D5 E5'], ['A', 'A4:2 C#5:2 E5:2 -:2'],
    ], lead: { i: 'horn', vol: 0.12, oct: -12, gate: 0.75 }, p2: { style: 'harm', iv: -5, i: 'sitar', vol: 0.8 }, bass: { style: 'gallop', i: 'bassP' }, drum: { pat: DR.gallop, fill: DR.gallF, kit: 'tribal', vol: 1 }, echo: { t: 0.12, fb: 0.3, mix: 0.3 } }),
    s3Boss: mk({ bpm: 152, rows: [
      ['A', 'A4 Bb4 A4 Bb4 C#5 D5 E5:2'], ['A', 'F5 E5 D5 C#5 Bb4:2 A4:2'], ['Dm', 'D5 E5 F5 E5 D5 C#5 D5 A4'], ['Bb', 'Bb4:2 D5:2 F5:2 E5:2'],
      ['A', 'A5:2 G5 F5 E5:2 F5 G5'], ['Dm', 'A5:2 F5 D5 A4:2 D5:2'], ['Bb', 'Bb5 A5 G5 F5 E5 D5 C#5 Bb4'], ['A', 'A4:2 E5:2 A5:4'],
    ], lead: { i: 'brass', vol: 0.11 }, p2: { style: 'harm', iv: -7, i: 'horn', vol: 0.6 }, pad: { i: 'choir', vol: 0.035 }, bass: { style: 'drive16', i: 'bassP' }, drum: { pat: DR.war4, fill: DR.war4F, kit: 'tribal', vol: 1 }, echo: { t: 0.14, fb: 0.35, mix: 0.3 }, stab: true }),
    s3Rest: mk({ bpm: 84, M: 12, rows: [
      ['Am', 'E4:2 A4 C5:2 B4'], ['G', 'D5:3 B4:3'], ['F', 'C5:2 A4 F4:2 G4'], ['E', 'G#4:6'],
      ['Am', 'A4:2 C5 E5:2 D5'], ['G', 'B4:2 D5 G5:2 F5'], ['F', 'E5 D5 C5 A4:2 B4'], ['E', 'G#4:3 B4:3'],
    ], lead: { i: 'flute', vol: 0.1 }, p2: { style: 'pluck8', i: 'sitar', vol: 0.09 }, bass: { style: 'drone6', i: 'contra' }, drum: { pat: DR.hand, kit: 'tribal', vol: 0.55 }, echo: { t: 0.2, fb: 0.45, mix: 0.45 } }),

    // ---------------- 4장 잿빛 왕도 — D 화성단음계, 장송 행진 / 죽음의 왈츠
    s4: mk({ bpm: 84, rows: [
      ['Dm', 'A4:3 D5 F5:2 E5 D5'], ['Gm', 'D5:3 G5 Bb5:2 A5 G5'], ['A', 'A5:3 G5 F5 E5 C#5:2'], ['Dm', 'D5:6 -:2'],
      ['Bb', 'F5:3 G5 A5:2 Bb5 A5'], ['Gm', 'G5:3 F5 E5:2 D5 E5'], ['A', 'F5:2 E5:2 C#5:2 A4:2'], ['A', 'E5:6 -:2'],
      ['Dm', 'D6:3 C#6 D6:2 A5:2'], ['Bb', 'Bb5:3 A5 G5:2 F5:2'], ['Gm', 'G5:2 Bb5:2 D6:3 C6'], ['A', 'C#6:4 A5:4'],
      ['Dm', 'F5:3 E5 D5:2 F5:2'], ['Gm', 'Bb4:3 C5 D5:2 G5:2'], ['A', 'A5:2 G5 F5 E5:2 C#5:2'], ['Dm', 'D5:8'],
    ], lead: { i: 'violin', vol: 0.11, gate: 0.95 }, p2: { style: 'trem', i: 'strings', vol: 0.03 }, pad: { i: 'choir', vol: 0.03 }, bass: { style: 'march', i: 'contra' }, drum: { pat: DR.march, fill: DR.marchF, kit: 'orch', vol: 0.85 }, echo: { t: 0.22, fb: 0.5, mix: 0.5 } }),
    s4Survive: mk({ bpm: 140, rows: [
      ['Dm', 'D5 F5 A5 F5 D6:2 C#6 A5'], ['Bb', 'Bb5:2 A5 G5 F5:2 D5:2'], ['Gm', 'G5 Bb5 D6 Bb5 G5:2 A5 Bb5'], ['A', 'C#6:2 Bb5 A5 E5:2 C#5:2'],
      ['Dm', 'F5 E5 D5 E5 F5 G5 A5:2'], ['Bb', 'D6 C6 Bb5 A5 G5:2 F5:2'], ['Gm', 'E5 F5 G5 A5 Bb5:2 G5:2'], ['A', 'A5:2 C#6:2 E6:4'],
    ], lead: { i: 'strings', vol: 0.1, gate: 0.8 }, p2: { style: 'arp16', i: 'harpsi', vol: 0.07, oct: 12 }, bass: { style: 'oct8', i: 'bassP' }, drum: { pat: DR.drive4, fill: DR.drive4F, kit: 'orch', vol: 0.95 }, echo: { t: 0.16, fb: 0.4, mix: 0.35 } }),
    s4Boss: mk({ bpm: 176, M: 12, rows: [
      ['Dm', 'D5:2 F5:2 A5:2'], ['Dm', 'D6:4 C#6:2'], ['Gm', 'D6:2 Bb5:2 G5:2'], ['Gm', 'D5:4 G5:2'],
      ['A', 'E5:2 G5:2 Bb5:2'], ['A', 'C#6:2 E6:2 C#6:2'], ['Dm', 'D6:2 A5:2 F5:2'], ['Dm', 'D5:4 -:2'],
      ['Bb', 'F5 G5 A5 Bb5 C6 D6'], ['Bb', 'F6:4 D6:2'], ['Gm', 'Bb5 A5 G5 F5 E5 D5'], ['A', 'C#5:4 E5:2'],
      ['Dm', 'F5 E5 F5 A5 D6:2'], ['Gm', 'G5 F#5 G5 Bb5 D6:2'], ['A', 'C#6 D6 E6 D6 C#6 Bb5'], ['A', 'A5:2 E5:2 C#5:2'],
    ], lead: { i: 'strings', vol: 0.11 }, p2: { style: 'waltz', i: 'harpsi', vol: 0.07 }, bass: { style: 'waltz', i: 'bassP' }, drum: { pat: DR.waltz, fill: DR.waltzF, kit: 'orch', vol: 1 }, echo: { t: 0.16, fb: 0.4, mix: 0.35 }, stab: true }),
    s4Rest: mk({ bpm: 66, rows: [
      ['Dm', 'F5:4 E5:2 D5:2'], ['Bb', 'D5:4 F5:4'], ['Gm', 'G5:3 F5 E5:2 D5:2'], ['A', 'C#5:6 -:2'],
      ['Dm', 'A5:4 G5:2 F5:2'], ['Bb', 'F5:4 D5:2 Bb4:2'], ['Gm', 'G4:2 Bb4:2 D5:2 E5:2'], ['A', 'C#5:2 E5:2 A4:4'],
    ], lead: { i: 'piano', vol: 0.12 }, p2: { style: 'trem', i: 'strpad', vol: 0.03 }, bass: { style: 'long', i: 'contra' }, drum: null, echo: { t: 0.24, fb: 0.55, mix: 0.6 } }),
  };
  // 옛 무드 이름 호환
  const ALIAS = { field: 's1', survive: 's1Survive', boss: 's1Boss', rest: 's1Rest', citadel: 's2', citadelSurvive: 's2Survive', citadelBoss: 's2Boss', citadelRest: 's2Rest', orc: 's3', orcboss: 's3Boss' };

  let mood = 'title', nextMood = 'title', barIdx = 0, step = 0, nextT = 0;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const SR = 32000;            // SFC 샘플링 주파수
  const ARAM = 65536, DRIVER = 10240; // 음원 메모리 64KB 중 드라이버·악보 몫(대략)
  const brr = n => Math.ceil(n / 16) * 9; // BRR: 16샘플 = 9바이트
  // SFC 에코 FIR 계수 (흔히 쓰던 저역통과 세트, 합 128 = 1.0)
  const FIR = [12, 33, 43, 43, 19, -2, -13, -7].map(v => v / 128);

  // ------------------------------------------------------------ 악기 (샘플 + 엔벨로프)
  // kind 'loop' = 지속음(ADSR) · 'pluck' = 어택 뒤 반복 구간을 GAIN 지수 감쇠로 끝냄
  // gn 음량 보정 · vib 비브라토(센트) · wet 에코 기본 켬 여부는 곡 설정이 정함
  const INST = {
    strings: { kind: 'loop', gn: 0.87, a: 0.07, d: 0.2, s: 0.85, r: 0.22, vib: 14 },
    violin:  { kind: 'loop', gn: 0.72, a: 0.05, d: 0.15, s: 0.9, r: 0.2, vib: 24 },
    strpad:  { kind: 'loop', gn: 1, a: 0.35, d: 0.3, s: 0.9, r: 0.45, vib: 8 },
    contra:  { kind: 'loop', gn: 1, a: 0.03, d: 0.2, s: 0.8, r: 0.12, vib: 0 },
    brass:   { kind: 'loop', gn: 0.7, a: 0.03, d: 0.18, s: 0.8, r: 0.12, vib: 10 },
    horn:    { kind: 'loop', gn: 0.6, a: 0.05, d: 0.2, s: 0.85, r: 0.18, vib: 8 },
    flute:   { kind: 'loop', gn: 0.52, a: 0.04, d: 0.1, s: 0.85, r: 0.12, vib: 18 },
    reed:    { kind: 'loop', gn: 1, a: 0.025, d: 0.1, s: 0.88, r: 0.1, vib: 16 },
    clar:    { kind: 'loop', gn: 0.56, a: 0.02, d: 0.1, s: 0.85, r: 0.08, vib: 8 },
    organ:   { kind: 'loop', gn: 1, a: 0.02, d: 0.05, s: 1, r: 0.15, vib: 0 },
    choir:   { kind: 'loop', gn: 1, a: 0.22, d: 0.3, s: 0.9, r: 0.45, vib: 10 },
    harp:    { kind: 'pluck', gn: 1, decay: 0.8, vib: 0 },
    pizz:    { kind: 'pluck', gn: 1, decay: 0.12, vib: 0 },
    harpsi:  { kind: 'pluck', gn: 1, decay: 0.35, vib: 0 },
    sitar:   { kind: 'pluck', gn: 1, decay: 0.55, vib: 0 },
    celesta: { kind: 'pluck', gn: 0.66, decay: 0.6, vib: 0 },
    piano:   { kind: 'pluck', gn: 1.7, decay: 0.7, vib: 0 },
    bassP:   { kind: 'pluck', gn: 1, decay: 0.45, vib: 0 },
  };
  const KITS = { // 드럼 글자 → [소리, 재생 속도, 음량] — 'N:주파수' 는 노이즈 발생기
    orch:   { k: ['kick', 1, 1], s: ['snare', 1, 0.8], h: ['N:hat', 1, 0.45], o: ['N:tamb', 1, 0.5], t: ['timp', 1, 0.9], T: ['timp', 1.33, 0.8], c: ['N:crash', 1, 0.6], m: ['anvil', 1, 0.6] },
    light:  { k: ['kick', 1.15, 0.7], s: ['N:tamb', 1, 0.75], h: ['N:hat', 1, 0.5], o: ['N:tamb', 0.9, 0.6], t: ['hand', 1, 0.8], T: ['hand', 1.4, 0.7], c: ['N:crash', 1, 0.45], m: ['anvil', 1, 0.75] },
    tribal: { k: ['taiko', 1, 1], s: ['snare', 0.8, 0.7], h: ['N:hat', 1, 0.45], o: ['N:tamb', 1, 0.5], t: ['taiko', 1.5, 0.85], T: ['hand', 1, 0.8], c: ['N:crash', 0.85, 0.55], m: ['anvil', 1, 0.6] },
  };
  const NOISE = { hat: [0.03, 1], tamb: [0.16, 0.8], crash: [1.2, 0.7] }; // 노이즈 [감쇠 시간, 음량]
  const KCH = { k: 6, t: 6, T: 6 }; // 그 밖의 글자는 채널 7

  // ------------------------------------------------------------ 샘플 합성 (32kHz, 시작할 때 한 번)
  function makeSamples() {
    const S = {};
    let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x3fffffff - 1;
    const mkBuf = (d, base, ls, le) => {
      let pk = 0; for (const v of d) pk = Math.max(pk, Math.abs(v)); if (pk) for (let i = 0; i < d.length; i++) d[i] /= pk;
      const b = ctx.createBuffer(1, d.length, SR); b.getChannelData(0).set(d);
      return { b, base, ls: ls == null ? null : ls / SR, le: le == null ? null : le / SR, bytes: brr(d.length) };
    };
    // 지속음 루프: 배음 함수 harm(n), 기준 base Hz, 루프 안 주기 수 cyc, ens = 한 주기 어긋난 둘째 성분(합주 맥놀이)
    const loopWave = (harm, base, cyc, ens) => {
      const L = Math.round(SR * cyc / base), real = SR * cyc / L, d = new Float32Array(L);
      for (const [k, amp] of ens ? [[cyc, 1], [cyc + 1, 0.8]] : [[cyc, 1]]) {
        const f = SR * k / L;
        for (let n = 1; n * f < 14000 && n < 60; n++) { const a = harm(n, f) * amp; if (!a) continue; const w = 2 * Math.PI * n * k / L; for (let i = 0; i < L; i++) d[i] += a * Math.sin(w * i); }
      }
      return mkBuf(d, real, 0, L);
    };
    const fmt = (hz, F) => F.reduce((a, [c, bw, g]) => a + g * Math.exp(-(((hz - c) / bw) ** 2)), 0);
    S.strings = loopWave(n => 1 / n * Math.exp(-n / 18), 440, 40, true);
    S.violin = loopWave(n => 1 / n * (1 + 0.6 * Math.exp(-(((n * 440 - 2800) / 900) ** 2))), 440, 8);
    S.strpad = loopWave(n => 1 / n * Math.exp(-n / 6), 440, 60, true);
    S.contra = loopWave(n => 1 / n * Math.exp(-n / 7), 110, 4);
    S.brass = loopWave(n => 1 / Math.pow(n, 0.8) * Math.exp(-n / 10), 440, 8);
    S.horn = loopWave(n => 1 / Math.pow(n, 0.9) * Math.exp(-n / 4), 220, 8);
    S.flute = loopWave(n => [0, 1, 0.28, 0.12, 0.05, 0.03][n] || 0, 440, 8);
    S.reed = loopWave(n => 0.25 / n + Math.exp(-(((n - 5) / 2.5) ** 2)) / Math.sqrt(n), 440, 8);
    S.clar = loopWave(n => (n % 2 ? 1 / n : 0.05 / n) * Math.exp(-n / 12), 440, 8);
    S.organ = loopWave(n => ({ 1: 1, 2: 0.7, 3: 0.45, 4: 0.4, 6: 0.25, 8: 0.25, 10: 0.08 })[n] || 0, 440, 8);
    S.choir = loopWave((n, f) => (1 / n) * (0.04 + fmt(n * f, [[700, 140, 1], [1150, 160, 0.55], [2600, 260, 0.22]])), 220, 30, true);
    // 뜯는 현: 카플러스-스트롱 어택 att초 + 마지막 한 주기 반복
    const ks = (f0, att, bright, keep, buzz) => {
      const P = Math.round(SR / f0), dl = new Float32Array(P), N = Math.round(att * SR / P) * P + P, d = new Float32Array(N);
      let lp = 0; for (let i = 0; i < P; i++) { lp += (rnd() - lp) * bright; dl[i] = lp; }
      let p = 0;
      for (let i = 0; i < N; i++) { let y = keep * (dl[p] * 0.5 + dl[(p + 1) % P] * 0.5); if (buzz && Math.abs(y) > 0.2) y += buzz * (Math.sign(y) * 0.2 - y); d[i] = dl[p]; dl[p] = y; p = (p + 1) % P; }
      return mkBuf(d, SR / P, N - P, N);
    };
    S.harp = ks(440, 0.12, 0.5, 0.996);
    S.pizz = ks(440, 0.06, 0.35, 0.99);
    S.harpsi = ks(440, 0.08, 0.95, 0.997);
    S.sitar = ks(220, 0.15, 0.8, 0.997, 0.35);
    S.bassP = ks(55, 0.12, 0.25, 0.999);
    const tone = (sec, base, fn, loopCyc) => { const N = Math.round(sec * SR), d = new Float32Array(N); for (let i = 0; i < N; i++) d[i] = fn(i / SR); if (!loopCyc) return mkBuf(d, base); const P = Math.round(SR / base * loopCyc); return mkBuf(d, base, N - P, N); };
    S.celesta = tone(0.1, 523.25, t => Math.sin(2 * Math.PI * 523.25 * t + 1.2 * Math.exp(-t * 20) * Math.sin(2 * Math.PI * 523.25 * 3.5 * t)), 4);
    S.piano = tone(0.12, 261.63, t => { let v = 0; for (let n = 1; n <= 9; n++) v += Math.sin(2 * Math.PI * 261.63 * n * t) * Math.exp(-t * n * 6) / n; return v * Math.min(1, t * 400); }, 2);
    // 북: 짧은 원샷 (BRR 몇 KB)
    let ph = 0;
    S.kick = tone(0.2, 1, t => { if (t === 0) ph = 0; ph += 2 * Math.PI * (48 + 70 * Math.exp(-t * 30)) / SR; return Math.sin(ph) * Math.exp(-t * 9) + rnd() * 0.15 * Math.exp(-t * 80); });
    S.taiko = tone(0.28, 1, t => { if (t === 0) ph = 0; ph += 2 * Math.PI * (62 + 30 * Math.exp(-t * 18)) / SR; return Math.sin(ph) * Math.exp(-t * 7) + rnd() * 0.4 * Math.exp(-t * 30); });
    S.timp = tone(0.16, 98, t => (Math.sin(2 * Math.PI * 98 * t) + 0.5 * Math.sin(2 * Math.PI * 147 * t) * Math.exp(-t * 8)) * Math.min(1, t * 300) + rnd() * 0.6 * Math.exp(-t * 40), 2);
    { let lp = 0, x0 = 0, hp = 0; S.snare = tone(0.15, 1, t => { const x = rnd(); lp += (x - lp) * 0.45; hp = 0.9 * (hp + lp - x0); x0 = lp; return hp * Math.exp(-t * 18) + 0.6 * Math.sin(2 * Math.PI * 185 * t) * Math.exp(-t * 30); }); }
    S.hand = tone(0.12, 1, t => Math.sin(2 * Math.PI * (190 + 60 * Math.exp(-t * 40)) * t) * Math.exp(-t * 20) + rnd() * 0.3 * Math.exp(-t * 90));
    S.anvil = tone(0.06, 880, t => [[1, 1], [2.76, 0.55], [5.4, 0.3]].reduce((a, [r, g]) => a + g * Math.sin(2 * Math.PI * 880 * r * t), 0), 22);
    // 하드웨어 노이즈 (메모리 0)
    const nb = ctx.createBuffer(1, SR, SR), nd = nb.getChannelData(0); let r = 1;
    for (let i = 0; i < SR; i++) { const bit = (r ^ (r >> 1)) & 1; r = (r >> 1) | (bit << 14); nd[i] = r & 1 ? 0.8 : -0.8; }
    S.noise = { b: nb, base: 1, ls: 0, le: 1, bytes: 0 };
    return S;
  }
  const DECAY = { anvil: 0.12, timp: 0.6 }; // 반복 구간이 있는 북의 감쇠

  // ------------------------------------------------------------ 채널 (8개)
  const chan = new Array(8).fill(null);
  function keyOff(c, t) {
    const v = chan[c]; if (!v) return;
    try { v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, 0.003); v.src.stop(t + 0.03); } catch (e) { /* 이미 끝남 */ }
    chan[c] = null;
  }
  function voice(c, name, m, t, dur, vol, o) {
    o = o || {};
    const I = INST[name], S = SMP[name];
    let rate = mtof(m) / S.base;
    rate = Math.min(4, Math.max(1 / 64, rate)); // 피치 레지스터 한계
    keyOff(c, t);
    const src = ctx.createBufferSource(); src.buffer = S.b; src.playbackRate.value = rate;
    if (S.ls != null) { src.loop = true; src.loopStart = S.ls; src.loopEnd = S.le; }
    const g = ctx.createGain(), V = vol * I.gn;
    let end;
    g.gain.value = 0;
    if (I.kind === 'loop') {
      const gate = Math.max(0.05, dur * (o.gate == null ? 0.92 : o.gate));
      g.gain.setTargetAtTime(V, t, I.a / 3); g.gain.setTargetAtTime(V * I.s, t + I.a, I.d / 3); g.gain.setTargetAtTime(0, t + Math.max(gate, I.a), I.r / 3);
      end = t + Math.max(gate, I.a) + I.r * 1.6 + 0.05;
    } else {
      const ring = Math.max(dur, o.ring || 0) + I.decay * 1.5;
      g.gain.setValueAtTime(V, t); g.gain.setTargetAtTime(0, t, I.decay); // GAIN 지수 감쇠
      end = t + ring;
      g.gain.setTargetAtTime(0, end - 0.06, 0.01);
    }
    if (I.vib && dur > 0.3) { const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.5; lg.gain.value = 0; lg.gain.setValueAtTime(0, t + 0.15); lg.gain.linearRampToValueAtTime(I.vib, t + 0.45); lfo.connect(lg); lg.connect(src.detune); lfo.start(t); lfo.stop(end); }
    let node = src;
    if (o.trem) { const amp = ctx.createGain(), lfo = ctx.createOscillator(), tg = ctx.createGain(); amp.gain.value = 0.65; lfo.frequency.value = o.trem; tg.gain.value = 0.35; lfo.connect(tg); tg.connect(amp.gain); src.connect(amp); node = amp; lfo.start(t); lfo.stop(end); }
    node.connect(g); out(g, c);
    src.start(t); src.stop(end);
    chan[c] = { g, src };
  }
  function drumHit(c, nm, t, vol, rate) {
    keyOff(c, t);
    const noise = nm.startsWith('N:'), key = noise ? nm.slice(2) : nm;
    const S = SMP[noise ? 'noise' : key], src = ctx.createBufferSource(); src.buffer = S.b;
    const g = ctx.createGain();
    if (noise) { const [dec, v] = NOISE[key]; src.loop = true; src.playbackRate.value = rate * (key === 'hat' ? 1 : 0.6); g.gain.setValueAtTime(vol * v, t); g.gain.setTargetAtTime(0, t, dec / 3); src.start(t, rnd01() * 0.9); src.stop(t + dec * 2 + 0.05); }
    else {
      src.playbackRate.value = Math.min(4, rate);
      if (S.ls != null) { src.loop = true; src.loopStart = S.ls; src.loopEnd = S.le; }
      const dec = DECAY[key];
      g.gain.setValueAtTime(vol, t); if (dec) g.gain.setTargetAtTime(0, t + 0.05, dec / 2);
      src.start(t); src.stop(t + (dec ? dec * 3 : S.b.duration / src.playbackRate.value + 0.02));
    }
    src.connect(g); out(g, c);
    chan[c] = { g, src };
  }
  let rs = 7; const rnd01 = () => (rs = (rs * 16807) % 2147483647) / 2147483647;
  let EON = 0; // 에코 켠 채널 비트
  function out(g, c) { g.connect(musicBus); if (EON & (1 << c)) g.connect(echoIn); }

  // ------------------------------------------------------------ 악보 연주
  const BASS = {
    oct8: (r, s) => s % 2 === 0 ? [s % 4 === 0 ? r - 12 : r, 2, 0.75] : null,
    walk: (r, s) => s % 4 === 0 ? [[r - 12, r - 5, r, r - 5][(s / 4) % 4], 4, 0.9] : null,
    drive16: (r, s) => [s % 8 === 7 ? r : r - 12, 1, 0.6],
    gallop: (r, s) => [0, 2, 3].includes(s % 4) ? [r - 12, 1, 0.7] : null,
    drone6: (r, s) => s % 6 === 0 ? [s % 12 === 0 ? r - 12 : r - 5, 6, 0.95] : s % 6 === 4 ? [r - 12, 1, 0.5] : null,
    march: (r, s) => ({ 0: [r - 12, 3, 0.9], 3: [r - 12, 1, 0.6], 4: [r - 5, 4, 0.9], 8: [r - 12, 3, 0.9], 11: [r - 12, 1, 0.6], 12: [r - 5, 4, 0.9] })[s] || null,
    waltz: (r, s, b) => s === 0 ? [b % 2 ? r - 17 : r - 12, 4, 0.9] : null,
    long: (r, s, b, M) => s === 0 ? [r - 12, M / 2, 0.98] : s === M / 2 ? [r - 5, M / 2, 0.98] : null,
  };
  const BASSVOL = { contra: 0.058, bassP: 0.1 };
  let rendering = false, solo = null;
  function playStep(t) {
    const S = SONGS[mood], dt = 60 / S.bpm / 4, M = S.M;
    const B = S.bars[barIdx % S.bars.length], ch = B.ch, r = ch[0];
    const L = S.lead, P = S.p2, SO = solo; // solo: 테스트용 파트 하나만
    const up = ch.slice(0, 3).map(x => x + 12 + (P.oct || 0));
    // 화음 (채널 2~4)
    if ((!SO || SO === 'pad') && S.pad && step % (M / 2) === 0) ch.slice(0, 3).forEach((x, i) => voice(2 + i, S.pad.i, x + 12, t, dt * M / 2, S.pad.vol / 1.7, { gate: 0.98 }));
    // 주선율 (채널 0) + 평행 화음 (채널 1)
    const n = (!SO || SO === 'lead') && B.on[step];
    if (n) {
      const m = n[0] + (L.oct || 0), dur = n[1] * dt;
      voice(0, L.i, m, t, dur, L.vol, { gate: L.gate, ring: 1.2 });
      if (P.style === 'harm' && SO !== 'lead') voice(1, P.i, m + P.iv, t, dur, L.vol * P.vol, { gate: L.gate, ring: 0.8 });
    }
    // 반주 (채널 1, 왈츠 화음은 2~4)
    if (!SO || SO === 'p2') {
      if (P.style === 'arp16') voice(1, P.i, [up[0], up[1], up[2], up[1], up[0] + 12, up[2], up[1], up[2]][step % 8], t, dt, P.vol, { gate: 0.8 });
      else if (P.style === 'pluck8' && step % 2 === 0) voice(1, P.i, [up[0], up[2], up[1], up[2]][(step / 2) % 4], t, dt * 2, P.vol, { gate: 0.6, ring: 0.9 });
      else if (P.style === 'trem' && step % (M / 2) === 0) voice(1, P.i, up[2], t, dt * M / 2, P.vol * 1.6, { gate: 0.97, trem: P.i === 'organ' ? 0 : 7.5 });
      else if (P.style === 'waltz' && (step === 4 || step === 8)) up.forEach((x, i) => voice(2 + i, P.i, x, t + i * 0.008, dt * 3, P.vol * 0.7, { gate: 0.6 }));
    }
    // 베이스 (채널 5)
    const bn = (!SO || SO === 'bass') && BASS[S.bass.style](r, step, barIdx, M);
    if (bn) voice(5, S.bass.i, bn[0], t, bn[1] * dt, BASSVOL[S.bass.i], { gate: bn[2], ring: bn[1] * dt });
    // 타악기 (채널 6 북 · 7 심벌·잡음)
    if ((!SO || SO === 'drum') && S.drum) {
      const D = S.drum, K = KITS[D.kit], last = barIdx % 4 === 3 && D.fill;
      const c = (last ? D.fill : D.pat[barIdx % D.pat.length])[step];
      const lv = (D.kit === 'tribal' ? 0.12 : D.kit === 'light' ? 0.2 : 0.19) * D.vol;
      if (c && c !== '.' && K[c]) { const [nm, rate, v] = K[c]; drumHit(KCH[c] || 7, nm, t, lv * v, nm === 'timp' ? mtof(r - 12) / 98 * rate : rate); }
      if (step === 0 && barIdx % 8 === 0 && barIdx > 0 && D.vol > 0.8 && !(c && !KCH[c] && c !== '.')) drumHit(7, 'N:crash', t, lv * 0.9, 1);
    }
    // 오케스트라 히트: 화음 채널을 잠깐 빼앗아 금관 화음
    if (!SO && S.stab && step === 0 && barIdx % 2 === 0) ch.slice(0, 3).forEach((x, i) => voice(2 + i, 'brass', x + 12, t, 0.2, 0.035, { gate: 1 }));
  }
  function tick() {
    if (!ctx || rendering) return;
    if (ctx.currentTime > nextT + 1) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.25) {
      playStep(nextT);
      step++;
      if (step >= SONGS[mood].M) { step = 0; barIdx++; if (nextMood !== mood) { mood = nextMood; barIdx = 0; setEcho(); } }
      nextT += 60 / SONGS[mood].bpm / 4;
    }
  }
  // 곡 설정 echo.t → EDL(16ms 단위 1~15)
  const EDL = S => Math.max(1, Math.min(15, Math.round((S.echo ? S.echo.t : 0.16) / 0.016)));
  function setEcho() {
    if (!ctx) return;
    const S = SONGS[mood], E = S.echo || { t: 0.16, fb: 0.4, mix: 0.35 }, now = ctx.currentTime;
    EON = 0; for (const c of E.on || [0, 1, 2, 3, 4]) EON |= 1 << c;
    echoDelay.delayTime.setValueAtTime(EDL(S) * 0.016, now);
    echoFb.gain.setValueAtTime(Math.max(-1, Math.min(127 / 128, E.fb)), now); // EFB
    echoOut.gain.setValueAtTime(Math.min(1, E.mix * 1.4), now);              // EVOL
  }
  function applyVol() {
    if (!ctx) return;
    const now = ctx.currentTime;
    bgmGain.gain.setTargetAtTime(st.muted ? 0 : st.bgm * 0.9, now, 0.08);
    sfxBus.gain.setTargetAtTime(st.sfx, now, 0.05);
  }
  const resolve = m => SONGS[m] ? m : ALIAS[m];
  function graph() {
    const limiter = ctx.createDynamicsCompressor(); limiter.threshold.value = -2; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.08; limiter.connect(ctx.destination);
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.15;
    const makeup = ctx.createGain(); makeup.gain.value = 1.25; comp.connect(makeup); makeup.connect(limiter);
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(comp);
    bgmGain = ctx.createGain(); bgmGain.connect(master);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    // 출력단: 32kHz DAC + 가우스 보간의 부드러운 고음 감쇠
    sfcLP = ctx.createBiquadFilter(); sfcLP.type = 'lowpass'; sfcLP.frequency.value = 7000; sfcLP.Q.value = 0.5;
    const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 9500; lp2.Q.value = 0.5;
    const mu = ctx.createGain(); mu.gain.value = 1.1;
    sfcLP.connect(lp2); lp2.connect(mu); mu.connect(bgmGain);
    musicBus = ctx.createGain(); musicBus.connect(sfcLP);
    // 에코: 입력(EON 채널 합) → 지연(EDL) → 8탭 FIR → 출력(EVOL) / 피드백(EFB)
    echoIn = ctx.createGain(); echoDelay = ctx.createDelay(0.25); echoFb = ctx.createGain(); echoOut = ctx.createGain();
    let fir;
    if (ctx.sampleRate === SR && ctx.createIIRFilter) fir = ctx.createIIRFilter(FIR, [1]);
    else { fir = ctx.createBiquadFilter(); fir.type = 'lowpass'; fir.frequency.value = 3200; fir.Q.value = 0.3; } // 다른 샘플레이트에선 같은 특성의 저역통과로 근사
    echoIn.connect(echoDelay); echoDelay.connect(fir); fir.connect(echoFb); echoFb.connect(echoDelay); fir.connect(echoOut); echoOut.connect(sfcLP);
    SMP = makeSamples();
    chan.fill(null);
  }
  // 곡이 64KB 안에 들어가는지 (샘플 + 에코 버퍼 + 드라이버)
  function memOf(k) {
    const S = SONGS[k], used = new Set([S.lead.i, S.p2.i, S.bass.i]);
    if (S.pad) used.add(S.pad.i); if (S.stab) used.add('brass');
    if (S.drum) for (const p of [].concat(S.drum.pat, S.drum.fill || [])) for (const c of p) { const e = KITS[S.drum.kit][c]; if (e && !e[0].startsWith('N:')) used.add(e[0]); }
    let smp = 0; for (const u of used) smp += SMP[u].bytes;
    return { smp, echo: EDL(S) * 2048, total: smp + EDL(S) * 2048 + DRIVER, used: [...used] };
  }

  return {
    st,
    get ctx() { return ctx; },
    get sfxBus() { return sfxBus; },
    get mood() { return nextMood; },
    init() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; return; }
      graph();
      applyVol(); setEcho();
      nextT = ctx.currentTime + 0.1;
      timer = setInterval(tick, 30);
    },
    setMood(m, immediate) {
      m = resolve(m);
      if (!m) return;
      nextMood = m;
      if (!ctx || !immediate || m === mood) return;
      const old = musicBus;
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
      setTimeout(() => { try { old.disconnect(); } catch (e) { /* 무시 */ } }, 2500);
      musicBus = ctx.createGain(); musicBus.connect(sfcLP); chan.fill(null);
      mood = m; barIdx = 0; step = 0; nextT = ctx.currentTime + 0.08; setEcho();
    },
    setVolume(kind, v) { st[kind] = Math.max(0, Math.min(1, v)); save(); applyVol(); },
    toggleMute() { st.muted = !st.muted; save(); applyVol(); return st.muted; },
    songs: () => Object.keys(SONGS),
    // 테스트용: 곡 하나를 오프라인(32kHz)으로 렌더해 16비트 PCM(base64)으로 돌려준다
    async _render(m, sec, rate, part) {
      solo = part || null; rate = SR;
      const keep = [ctx, comp, master, bgmGain, sfxBus, musicBus, sfcLP, echoIn, echoDelay, echoFb, echoOut, SMP, mood, barIdx, step, EON, chan.slice()];
      rendering = true;
      try {
        ctx = new OfflineAudioContext(1, Math.ceil(rate * sec), rate);
        graph(); bgmGain.gain.value = st.bgm * 0.9;
        mood = resolve(m); barIdx = 0; step = 0; setEcho();
        for (let t = 0.02; t < sec - 0.3;) { playStep(t); t += 60 / SONGS[mood].bpm / 4; if (++step >= SONGS[mood].M) { step = 0; barIdx++; } }
        const buf = await ctx.startRendering(), d = buf.getChannelData(0);
        let peak = 0; const pcm = new Int16Array(d.length);
        for (let i = 0; i < d.length; i++) { const v = Math.max(-1, Math.min(1, d[i])); peak = Math.max(peak, Math.abs(v)); pcm[i] = v * 32767; }
        let bin = ''; const u8 = new Uint8Array(pcm.buffer); for (let i = 0; i < u8.length; i += 8192) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
        return { rate, peak, b64: btoa(bin) };
      } finally { let ch; [ctx, comp, master, bgmGain, sfxBus, musicBus, sfcLP, echoIn, echoDelay, echoFb, echoOut, SMP, mood, barIdx, step, EON, ch] = keep; chan.splice(0, 8, ...ch); rendering = false; solo = null; }
    },
    // 테스트용: 마디 길이 · 악기 존재 · 64KB 메모리 · 음높이 4배 한계 확인 (샘플이 필요해 오프라인 컨텍스트로 한 번 만든다)
    _check() {
      const bad = [];
      const had = ctx; let tmp = false;
      if (!SMP) { tmp = true; ctx = new OfflineAudioContext(1, SR, SR); SMP = makeSamples(); }
      for (const [k, S] of Object.entries(SONGS)) {
        S.bars.forEach((b, i) => { if (b.len !== S.M) bad.push(`${k}#${i + 1}=${b.len}/${S.M}`); });
        for (const x of [S.lead.i, S.p2.i, S.bass.i, S.pad && S.pad.i]) if (x && !INST[x]) bad.push(`${k}: no inst ${x}`);
        const mm = memOf(k); if (mm.total > ARAM) bad.push(`${k}: 메모리 ${(mm.total / 1024).toFixed(1)}KB > 64KB`);
        const top = Math.max(...S.bars.flatMap(b => b.on.filter(Boolean).map(x => x[0]))) + (S.lead.oct || 0);
        if (mtof(top) / SMP[S.lead.i].base > 4.0001) bad.push(`${k}: 음높이 ${top}가 샘플 4배 초과`);
      }
      for (const [k, p] of Object.entries(DR)) for (const s of [].concat(p)) { const want = /war6|hand|waltz/.test(k) ? 12 : 16; if (s.length !== want) bad.push(`drum ${k}=${s.length}`); }
      if (tmp) { ctx = had; SMP = null; }
      return bad;
    },
    _mem() { const had = ctx, keepS = SMP; if (!SMP) { ctx = new OfflineAudioContext(1, SR, SR); SMP = makeSamples(); } const r = {}; for (const k of Object.keys(SONGS)) { const m = memOf(k); r[k] = `${(m.total / 1024).toFixed(1)}KB (샘플 ${(m.smp / 1024).toFixed(1)} + 에코 ${(m.echo / 1024).toFixed(0)} + 드라이버 ${DRIVER / 1024})`; } ctx = had; SMP = keepS; return r; },
  };
})();
