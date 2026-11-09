'use strict';
// 잿빛 왕관 토벌대 — 오프라인 솔로 프로토타입 v0.2
// 의존성 없음. index.html을 브라우저로 열면 실행된다.
(() => {
  const VW = 768, VH = 432;          // 화면(캔버스) 크기
  const W = 1700, H = 960;           // 바닥 캔버스 크기 — 방마다 전투장(A) 크기가 다르고 가장 큰 방이 들어가게 잡는다
  const cv = document.getElementById('game');
  cv.width = VW; cv.height = VH;
  const cam = { x: 0, y: 0 };
  let ctx = cv.getContext('2d'); // v1.05: 시체를 따로 그릴 때 잠깐 바꿔 끼우려고 let
  ctx.imageSmoothingEnabled = false;
  const A = { x0: 136, y0: 100, x1: 1136, y1: 640 }; // 바깥 벽 두께는 카메라가 맵 끝에 붙어도 UI 뒤로 들어가지 않을 만큼 // 플레이 영역
  let CX = (A.x0 + A.x1) / 2, CY = (A.y0 + A.y1) / 2; // 방에 들어갈 때마다 setArena가 바꾼다
  const DEG = Math.PI / 180, TAU = Math.PI * 2;

  // ---------------------------------------------------------------- utils
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const lerpAng = (a, b, k) => a + angDiff(b, a) * clamp(k, 0, 1);
  const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const $ = id => document.getElementById(id);
  const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };

  // ---------------------------------------------------------------- 저장
  const SAVE_KEY = 'acr_proto_v1';
  const blankSave = () => ({ inv: [], equip: {}, equipBy: { knight: {}, ranger: {}, mage: {}, priest: {}, gunner: {} }, mats: { iron: 0, crystal: 0 }, gold: 0, runs: 0, clears: 0, nextId: 1, lastCls: 'knight', lastStage: 1 });
  let SAVE = blankSave();
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && s.inv) SAVE = Object.assign(blankSave(), s); } catch (e) { /* 저장소 없음 */ }
  // 이전 버전 저장 데이터 옮기기: 장착은 기사 것으로, 무기는 기사 무기로
  if (!SAVE.equipBy || !SAVE.equipBy.knight) SAVE.equipBy = { knight: Object.assign({}, SAVE.equip || {}), ranger: {} };
  for (const k of ['knight', 'ranger', 'mage', 'priest', 'gunner']) if (!SAVE.equipBy[k]) SAVE.equipBy[k] = {};
  SAVE.inv.forEach(it => { if (it.slot === 'weapon' && !it.cls) it.cls = 'knight'; if (it.lv == null) it.lv = 0; if (it.fail == null) it.fail = 0; });
  if (SAVE.gold == null) SAVE.gold = 0;
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { /* 무시 */ } };

  // ---------------------------------------------------------------- 사운드
  let AC = null;
  const initAudio = () => { window.AudioSys.init(); AC = window.AudioSys.ctx; };
  // 효과음: 여러 레이어(톤·노이즈·아르페지오)를 겹쳐 만든다. [종류, 파형/필터, 시작Hz, 끝Hz, 길이, 볼륨]
  const SFX = {
    legend:  [['tone', 'triangle', 523, 1046, 0.55, 0.35], ['tone', 'sine', 784, 1568, 0.7, 0.28], ['noise', 'highpass', 3000, 8000, 0.45, 0.18]],
    swing:   [['noise', 'bandpass', 700, 2600, 0.16, 0.55], ['tone', 'triangle', 320, 110, 0.1, 0.18]],
    whoosh:  [['noise', 'bandpass', 400, 2400, 0.3, 0.7], ['tone', 'sawtooth', 160, 55, 0.22, 0.14]],
    hit:     [['noise', 'lowpass', 4000, 700, 0.09, 0.8], ['tone', 'square', 240, 60, 0.08, 0.32], ['tone', 'sine', 110, 40, 0.14, 0.7]],
    heavy:   [['noise', 'lowpass', 2600, 250, 0.22, 0.95], ['tone', 'sine', 130, 32, 0.3, 1.0], ['tone', 'square', 180, 50, 0.12, 0.3]],
    kill:    [['noise', 'bandpass', 1400, 250, 0.26, 0.7], ['tone', 'sawtooth', 220, 45, 0.22, 0.3]],
    crit:    [['tone', 'square', 2400, 1800, 0.07, 0.22], ['tone', 'triangle', 3200, 2600, 0.16, 0.2], ['noise', 'highpass', 6000, 3000, 0.06, 0.5], ['tone', 'sine', 90, 35, 0.18, 0.8]],
    crunch:  [['noise', 'lowpass', 3000, 120, 0.16, 1.0], ['tone', 'sine', 75, 28, 0.22, 1.0], ['tone', 'square', 140, 40, 0.1, 0.3]],
    finisher:[['noise', 'lowpass', 5000, 100, 0.6, 1.0], ['tone', 'sine', 60, 22, 0.7, 1.0], ['tone', 'triangle', 1800, 600, 0.5, 0.18]],
    beat:    [['tone', 'sine', 72, 38, 0.16, 0.9], ['noise', 'lowpass', 220, 80, 0.1, 0.35]],
    beat2:   [['tone', 'sine', 64, 34, 0.14, 0.6]],
    growl:   [['noise', 'lowpass', 700, 180, 0.28, 0.45], ['tone', 'sawtooth', 95, 55, 0.26, 0.22], ['tone', 'square', 60, 40, 0.2, 0.12]],
    step:    [['noise', 'lowpass', 1100, 300, 0.035, 0.22], ['tone', 'sine', 140, 70, 0.03, 0.12]],
    hurt:    [['noise', 'lowpass', 1800, 300, 0.2, 0.85], ['tone', 'sawtooth', 200, 55, 0.25, 0.5], ['tone', 'sine', 90, 40, 0.2, 0.6]],
    dodge:   [['noise', 'highpass', 1800, 7000, 0.14, 0.5], ['tone', 'sine', 500, 1500, 0.12, 0.28]],
    perfect: [['tone', 'sine', 880, 1760, 0.35, 0.45], ['tone', 'triangle', 1320, 2640, 0.45, 0.32], ['noise', 'highpass', 4000, 9000, 0.3, 0.35]],
    drop:    [['arp', [72, 76, 79, 84, 88, 91], 0.07, 0.4]],
    boss:    [['tone', 'sawtooth', 95, 40, 0.9, 0.55], ['noise', 'lowpass', 700, 100, 0.9, 0.6]],
    roar:    [['tone', 'sawtooth', 85, 34, 1.2, 0.7], ['tone', 'square', 62, 30, 1.2, 0.35], ['noise', 'lowpass', 900, 140, 1.0, 0.75]],
    blast:   [['noise', 'lowpass', 3000, 110, 0.75, 1.0], ['tone', 'sine', 95, 28, 0.65, 0.95]],
    grogi:   [['tone', 'triangle', 1300, 280, 0.5, 0.45], ['tone', 'square', 650, 140, 0.5, 0.22], ['arp', [84, 79, 76, 72], 0.06, 0.25]],
    awaken:  [['tone', 'sawtooth', 200, 800, 0.5, 0.38], ['tone', 'sine', 400, 1600, 0.6, 0.45], ['noise', 'highpass', 3000, 9000, 0.5, 0.35]],
    block:   [['tone', 'square', 1500, 1400, 0.09, 0.4], ['tone', 'triangle', 2200, 2100, 0.18, 0.32], ['noise', 'highpass', 5000, 5000, 0.05, 0.45]],
    warn:    [['tone', 'square', 900, 880, 0.1, 0.32], ['tone', 'square', 1350, 1330, 0.08, 0.18]],
    ready:   [['arp', [84, 88, 91], 0.05, 0.32]],
    blip:    [['tone', 'square', 660, 660, 0.04, 0.22]],
    select:  [['arp', [76, 83], 0.05, 0.3]],
    bolt:    [['tone', 'square', 900, 1500, 0.08, 0.16], ['noise', 'highpass', 3000, 6000, 0.06, 0.2]],
    boltBig: [['tone', 'sawtooth', 500, 1300, 0.14, 0.25], ['noise', 'bandpass', 1500, 4000, 0.12, 0.35]],
    fireball:[['noise', 'lowpass', 2200, 500, 0.35, 0.6], ['tone', 'sawtooth', 200, 90, 0.3, 0.3]],
    shot:    [['noise', 'lowpass', 6000, 300, 0.22, 1.0], ['tone', 'square', 170, 40, 0.12, 0.55], ['noise', 'highpass', 4000, 2000, 0.05, 0.5]],
    shotgun: [['noise', 'lowpass', 5000, 200, 0.38, 1.0], ['tone', 'sine', 120, 35, 0.3, 0.9], ['noise', 'highpass', 3000, 1500, 0.08, 0.5]],
    snipe:   [['noise', 'lowpass', 8000, 150, 0.7, 1.0], ['tone', 'sine', 90, 25, 0.6, 1.0], ['tone', 'sawtooth', 700, 80, 0.3, 0.4]],
    reload:  [['tone', 'square', 1800, 1700, 0.03, 0.25], ['noise', 'highpass', 5000, 5000, 0.03, 0.3]],
    heal:    [['arp', [72, 76, 79, 84, 88], 0.06, 0.32], ['tone', 'sine', 600, 1200, 0.45, 0.25]],
    aim:     [['tone', 'sine', 300, 1300, 1.9, 0.16], ['tone', 'triangle', 150, 650, 1.9, 0.1]],
    eat:     [['noise', 'lowpass', 1200, 400, 0.12, 0.5], ['arp', [67, 71, 74], 0.05, 0.3]],
    coin:    [['arp', [88, 95, 100], 0.04, 0.32], ['tone', 'square', 1900, 2400, 0.08, 0.15]],
    frenzy:  [['tone', 'sawtooth', 110, 330, 0.4, 0.45], ['noise', 'bandpass', 600, 2400, 0.35, 0.5], ['arp', [62, 65, 69, 74], 0.05, 0.3]],
  };
  const sfxLast = {};
  function sfx(name, pitch = 1) {
    if (!AC || !window.AudioSys.sfxBus) return;
    const L = SFX[name]; if (!L) return;
    const t = AC.currentTime;
    if (sfxLast[name] && t - sfxLast[name] < 0.035) return; // 같은 소리가 한 프레임에 겹쳐 터지지 않게
    sfxLast[name] = t;
    const bus = window.AudioSys.sfxBus, GAIN = 1.4; // 음악 위로 확실히 들리도록
    for (const ly of L) {
      if (ly[0] === 'tone') {
        const [, type, f0, f1, dur, vol] = ly, o = AC.createOscillator(), g = AC.createGain();
        o.type = type; o.frequency.setValueAtTime(f0 * pitch, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * pitch), t + dur);
        g.gain.setValueAtTime(vol * GAIN, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
      } else if (ly[0] === 'noise') {
        const [, ft, f0, f1, dur, vol] = ly, n = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
        n.buffer = noiseBuffer(); f.type = ft; f.Q.value = ft === 'bandpass' ? 1.4 : 0.7;
        f.frequency.setValueAtTime(f0 * pitch, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1 * pitch), t + dur);
        g.gain.setValueAtTime(vol * GAIN, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        n.connect(f); f.connect(g); g.connect(bus); n.start(t); n.stop(t + dur + 0.02);
      } else {
        const [, notes, step, vol] = ly;
        notes.forEach((m, i) => {
          const tt = t + i * step, o = AC.createOscillator(), g = AC.createGain();
          o.type = 'triangle'; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
          g.gain.setValueAtTime(vol * GAIN, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.25);
          o.connect(g); g.connect(bus); o.start(tt); o.stop(tt + 0.27);
        });
      }
    }
  }
  let _noise = null;
  function noiseBuffer() {
    if (_noise) return _noise;
    _noise = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = _noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return _noise;
  }

  // ---------------------------------------------------------------- 도트 스프라이트 (명암 4단계)
  const MAPS = {
    // ---- v0.95 챕터 2 기사단 (타락한 종자 · 기사단 사냥개 · 타락한 사제 · 역병 기사 · 기사단 처형인 · 타락한 기수)
    squire: [
      '....kkkkkk......',
      '...kwllllmk.....',
      '..kwllllllmk....',
      '..klllllllmk....',
      '..kkkkkkkekk....',
      '..klllmllmmk....',
      '..klmlmlmmmk....',
      '...kkkkkkkk.....',
      '..kcRRgRRck.....',
      '.kcCRrgrRCck....',
      '.kckRrrrRkck....',
      '.kk.kRrrRk.kk...',
      '....kRrRRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    squireUp: [
      '....kkkkkk......',
      '...kwllllmk.....',
      '..kwllllllmk....',
      '..klllllllmk....',
      '..kkkkkkkekk....',
      '..klllmllmmk....',
      '..klmlmlmmmk....',
      '...kkkkkkkk.....',
      '..kcRRgRRck.....',
      '.kcCRrgrRCck....',
      '..kkRrrrRkk.....',
      '...kkRrrRk......',
      '....kRrRRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    chaplain: [
      '.....kkkk.....',
      '....kWwwwk....',
      '...kWgwgwgk...',
      '..kWwgggggWk..',
      '..kWwwwwwwWk..',
      '..kWwkkkkkWk..',
      '..kWkSSekekk..',
      '..kWkSSSSSWk..',
      '..kWWkkkkWWk..',
      '...kWRggRWk...',
      '..kWwRwwRwWk..',
      '.ksWwRwgRwWsk.',
      '..kkWRwwRwWk..',
      '..kWwRwwRwwWk.',
      '.kWWwRrwRwrWWk',
      '.kkkkkkkkkkkkk',
    ],
    pknight: [
      '.....kkkkk......',
      '....klllllk.....',
      '...kllllllmk....',
      '...kkkkkkekk....',
      '...kmmmmmmmk....',
      '..kkkSsssSkkk...',
      '.kmlkPsssPklmk..',
      'kmllkssPsssklmk.',
      'kmlksssssPsskmk.',
      'kdmkPssssssPkdk.',
      'kdmksssPssssskk.',
      '.kkmmkssssskmmk.',
      '..kdmmkkkkkmmdk.',
      '...kdk...kdk....',
      '...kdk...kdk....',
      '...kkk...kkkk...',
    ],
    hound: [
      '.............k..k.......',
      '............kDkkLk......',
      '............kDdkLlk.....',
      '...........kmlllmLdk....',
      '...........kmmmmLLddk...',
      '..........kdddddkeLdkk..',
      'kk........kddddddLLLLLkk',
      'kLk.......kLddddDDLLLLkk',
      'kLdk......kLLdddDkkkkkk.',
      '.kddkkkkkkkLLdddDtDDk...',
      '..kdRrrrgrrrRddddDkkk...',
      '.kddRrrrrrrrRdddddk.....',
      '.kdDDgkkkkkgDDddddk.....',
      '..kDdkkDdk..kDdkDdk.....',
      '..kDdkkDdk..kDdkDdk.....',
      '..kDddkDddk.kDddkDddk...',
      '..kkkkkkkkk.kkkkkkkkk...',
    ],
    exec: [
      '......kkkkkk........',
      '.....kHHHHHHk.......',
      '....kHhhhhhhHk......',
      '....kHhhhhhhHk......',
      '....kHhkehkehk......',
      '....kHhhhhhhHk......',
      '....kHHhhhhHHk......',
      '...kkHHHHHHHHkk.....',
      '..kHHHssssssHHHk....',
      '.kHHsssssssssHHk....',
      '.kHsssbssssbssHk....',
      '..kssssbssbssssk....',
      '..kssssssbbssssk....',
      '...kAAAAAAAAAAk.....',
      '...kAaaaaaaaaAk.....',
      '...kAarraaaaaAk.....',
      '...kAaaaaraaaAk.....',
      '....kAaaraaaAk......',
      '....kBBk.kBBk.......',
      '....kBBk.kBBk.......',
      '...kBBBk.kBBBk......',
      '...kkkkk.kkkkk......',
    ],
    bearer: [
      '.....rr...........',
      '....rrrR..........',
      '....kkkkkkk.......',
      '...kwlllllmk......',
      '..kwllllllmmk.....',
      '..klllllllmmk.....',
      '..kkkkkkkkekk.....',
      '..klmlmllmmmk.....',
      '...kkkkkkkkk......',
      '.kmlkgRgRgkmlk....',
      'kmllkgggggkllmk...',
      'kdmkRrrrrrRkdmk...',
      '.kk.kRrrrRk.kk....',
      '....kRrrrRk.......',
      '...kmRrrrRmk......',
      '...kdRRrRRdk......',
      '....kRrrRrk.......',
      '....kdmk.kdmk.....',
      '....kdmk.kdmk.....',
      '...kddmk.kddmk....',
      '...kkkkk.kkkkk....',
    ],
    squireB: [
      '....kkkkk.......',
      '...kmllllk......',
      '..kmllllllk.....',
      '..kkkkkkkkkk....',
      '..kcSSSkSek.....',
      '..kcSSSkSSk.....',
      '..kccSSmmSk.....',
      '...kkcccck......',
      '..kcRRgRRck.....',
      '.kmlRrrrRCck....',
      '.kmkRrgrRkck....',
      '.kk.kRrrRk.kk...',
      '....kRrRRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    squireBUp: [
      '....kkkkk.......',
      '...kmllllk......',
      '..kmllllllk.....',
      '..kkkkkkkkkk....',
      '..kcSSSkSek.....',
      '..kcSSSkSSk.....',
      '..kccSSmmSk.....',
      '...kkcccck......',
      '..kcRRgRRck.....',
      '.kmlRrrrRCck....',
      '..kkRrgrRkk.....',
      '...kkRrrRk......',
      '....kRrRRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    squireC: [
      '.....kkkk.......',
      '...kkccccck.....',
      '..kcCcccccck....',
      '..kcccccccck....',
      '..kcSSSSeSk.....',
      '..kcSDSSSSk.....',
      '..kcSSSmmSk.....',
      '...kcccccck.....',
      '..kcRRRRRck.....',
      '.kcCRrgrRCck....',
      '.kckbbbybkck....',
      '.kk.kRrkRk.kk...',
      '....kR.kRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    squireCUp: [
      '.....kkkk.......',
      '...kkccccck.....',
      '..kcCcccccck....',
      '..kcccccccck....',
      '..kcSSSSeSk.....',
      '..kcSDSSSSk.....',
      '..kcSSSmmSk.....',
      '...kcccccck.....',
      '..kcRRRRRck.....',
      '.kcCRrgrRCck....',
      '..kkbbbybkk.....',
      '...kkRrkRk......',
      '....kR.kRk......',
      '....kdk.kdk.....',
      '...kddk.kddk....',
      '...kkkk.kkkk....',
    ],
    houndB: [
      '.............k..k.......',
      '............kDkkLk......',
      '............kDdkLlk.....',
      '...........kmlllmLdk....',
      '...........kmmmmLLddk...',
      '..........kdddddkeLdkk..',
      'kk........kddddddLLLLLkk',
      'kLk.......kLddddDDLLLLkk',
      'kLdk......kLLdddDkkkkkk.',
      '.kddkkkkkkkLLdddDtDDk...',
      '..kdRrrrgrrrRddddDkkk...',
      '.kddRrrrrrrrRdddddk.....',
      '.kdDDgkkkkkgDDdddddk....',
      'kDdkkDdk.....kDdkkDdk...',
      'kDkk.kDdk.....kDdkkDdk..',
      'kDdk..kDdk.....kDddkDddk',
      'kkkk..kkkk.....kkkkkkkkk',
    ],
    abom: [
      '.....kkkkkkk......',
      '....kHhhhhhhk.....',
      '...kHhchhhhhHk....',
      '..kHhhchhhhhhHk...',
      '..khhhhcccchhhk...',
      '..khhhhhhhhhhhk...',
      '..kHhhekhhhekhk...',
      '..kHhhhhhhhhhhk...',
      '..kHhmmcmcmmhhk...',
      '...kHhhhhhhhHk....',
      '..kkkSSSSSSSkkk...',
      '.kSscSssSsscSSk...',
      'kSsAAbAssssSsSsk..',
      'kssAbAbAssccsSsk..',
      'kSsAAbAsssssSsSk..',
      '.kksssssscsssskk..',
      '..kSsssssssscsk...',
      '..kcCcCcCcCcCck...',
      '...kSSk...kSSk....',
      '...kSSk...kSSk....',
      '..kSSSk..kSSSk....',
      '..kkkkk..kkkkk....',
    ],
    mother: [
      '......kkkkkkkk......',
      '.....kHHhhhhHHk.....',
      '....kHhhhhhhhhHk....',
      '...kHhhhSSSSShhHk...',
      '...kHhSsssssssShk...',
      '...kHhssessseshHk...',
      '...kHhsssssssssHk...',
      '..kHHhsSsmmmsSsHHk..',
      '..kHHkhSsmmmsSkHHk..',
      '.kHHkkkksssskkkkHHk.',
      '.kHkSSSSkkkkSSSSkHk.',
      'kHkSssssSssSssssSkHk',
      'kHksskssvvvvssksskHk',
      'kkksk.ksvVVVvsk.kskk',
      '..ksk.ksvVVVVsk.ksk.',
      '..kbk.ksvvVVvsk.kbk.',
      '..k.k.kSsvvvsSk.k.k.',
      '.....krRrRrRrRk.....',
      '....krRrRrRrRrRk....',
      '...krRrRrRrRrRrRk...',
      '...kRrRrRrRrRrRrk...',
      '...kkSSkkkkkkSSkk...',
      '....kSSk....kSSk....',
      '...kSSSk....kSSSk...',
      '...kkkkk....kkkkk...',
    ],
    crowA: [
      'K.........K.....',
      'Kk.......kK.....',
      '.kk.....kk.kkk..',
      '..kKk.kKk.kKkkk.',
      '...kKkKkkkkkekyy',
      '....kkkkkkkkkk..',
      '...kkkkkkkk.....',
      '.......k.k......',
    ],
    crowB: [
      '................',
      '...........kkk..',
      '....kkk...kKkkk.',
      '.kkkKKkkkkkkekyy',
      'kKkkkkkkkkkkkk..',
      'k..kkkkkkkk..k..',
      '...kkkkkk.......',
      '.......k.k......',
    ],
    gbrute: [
      '...........kkkkkk...........',
      '..........khhhhssk..........',
      '.........khhhhssssk.........',
      '..kk....khhhsssssrsk...kk...',
      '.khhkk.khhhsssssssrskkkhhk..',
      '..kShhkkhsSSSSSSSrsSkhhSk...',
      '...kSshkssseesseesSSksSk....',
      '....kSrksssskssskSSSkSk.....',
      '.....kSksssssSSSSSSSkk......',
      '......kkssswsSSSwSSSk.......',
      '........ksswkkkkwSSk........',
      '......kkkkSSSSSSSSkkkk......',
      '.....khhsskkSSSSkkhhssk.....',
      '.....ksssshbkkkkssssssk.....',
      '.....kssSShsssssssssSSk.....',
      '....kksSSSsssssssssSSSkk....',
      '...khskksssSSssSSSSSkkssk...',
      '...kssSksssssssSSSSSksssk...',
      '...khsskskkkkkkkkkkSkhssk...',
      '...kssSSkCCCCCCCCCCksssSk...',
      '...kSSSkkCccCccCccCkkSSSk...',
      '....kkk..kcckcckcck..kkk....',
      '.........kkkSkkskkk.........',
      '........kSSSSkSSSSSk........',
      '.........kkkk.kkkkk.........',
    ],
    gbruteUp: [
      '..kkk......kkkkkk......kkk..',
      '.khhsk....khhhhssk....khssk.',
      '.ksssSk..khhhhssssk..kssssk.',
      '.kSkSSk.khhhsssssrsk.kskSSk.',
      '..khkk.khhhsssssssrskkkhkSk.',
      '..kshhkkhsSSSSSSSrsSkhhskSk.',
      '.kskSshkssseesseesSSksSkssk.',
      '.ksskSrksssskssskSSSkSksssk.',
      '.kssSkSksssssSSSSSSSkkksssk.',
      'ksssSskkssswsSSSwSSSkkhsssSk',
      '.kSSssskksswkkkkwSSkkhssSSk.',
      '..kssskkkkSSSSSSSSkkkksSSk..',
      '...kskhhsskkSSSSkkhhsskSk...',
      '....kksssshbkkkksssssskk....',
      '.....kssSShsssssssssSSk.....',
      '.....ksSSSsssssssssSSSk.....',
      '......kksssSSssSSSSSkk......',
      '.......ksssssssSSSSSk.......',
      '.......kskkkkkkkkkkSk.......',
      '........kCCCCCCCCCCk........',
      '........kCccCccCccCk........',
      '.........kcckcckcck.........',
      '.........kkkSkkskkk.........',
      '........kSSSSkSSSSSk........',
      '.........kkkk.kkkkk.........',
    ],
    boar: [
      '....................k.............',
      '........k..k.......kdk............',
      '......kkbkkbkk.....kpDk...........',
      '.....kbkkbbkbbkk.kkdpDkkkkk.......',
      '...k.kbbkbbkbbkbkDdddDDLLLLk......',
      '..kbkkbbkbbkbbkdDdDLLLLLLLddk.....',
      '...kbbkLLLLLLLdDdDLLLLLLdddddk....',
      'k..kbLLLLLLLLLDdDLLLLLddkkkDddk...',
      'Dk.kLLLLLLLddddDdLLddddddkedddk...',
      'kDkLLLLdddddddDdDddddddddkeddpkk..',
      'kdkddddddddddddDdddddddddddpppPPk.',
      '.kkdddddddddddddDddddddddDDpppPk..',
      '..kddddddddddDDDDddddddDDDDwppPPk.',
      '...kddddddDDDDDDDDdddDDDDDDwppPk..',
      '....kdDDDDDDDDDDDDDDDDDkkkwwkpk...',
      '....kDDDDDDDDDDDDDDDDDDDDDDk.k....',
      '....kDDDkDddkkkkkDDDkDddkkk.......',
      '....kDDDkDddk...kDDDkDddk.........',
      '....khhhkhhhk...khhhkhhhk.........',
      '.....kkk.kkk.....kkk.kkk..........',
      '..................................',
    ],
    goblin: [
      '....kkkkkk....',
      '...kssssssk...',
      'kkkssssssssskk',
      'kSSsesssessSSk',
      '..kksSSSsskk..',
      '....kksskk....',
      '...kccccccck..',
      '..kscCccCcsk..',
      '.ks.kcCcck.sk.',
      '.kS.kccCck.Sk.',
      '.kk.kCCCCk.kk.',
      '....kSk.kSk...',
      '...kkSk.kSkk..',
      '...kkkk.kkkk..',
    ],
    goblinUp: [
      '.k..........k.',
      'ksk..kkkk..ksk',
      '.Sk.kssssk.kS.',
      'kkSksssssskSkk',
      'kSSsesssessSSk',
      '..kksSSSsskk..',
      '....kksskk....',
      '...kccccccck..',
      '...kcCccCck...',
      '....kcCcck....',
      '....kCCCCk....',
      '....kSk.kSk...',
      '...kkSk.kSkk..',
      '...kkkk.kkkk..',
    ],
    mage: [
      '........kk........',
      '.......kHHk.......',
      '..kk..kHhHk...kk..',
      '..kEikkHhhHkkiEk..',
      '..kEEkHhhhhHkEEk..',
      '...kkkkkkkkkkkk...',
      '.....ksessesk.....',
      '.....kssssssk.....',
      '.kk..krggggrk.....',
      'kWWkkrrRrrRrrk....',
      'kFEEkrrRggRrrk....',
      'kEEEkRrRrrRrRk....',
      '.kEEkkkdkkdkk.....',
      ',.kk.kkk..kkk....,',
    ],
    priest: [
      '......kk..kk......',
      '.....kEikkiEk.....',
      '.....kEikkiEk.....',
      '.....kEikkiEk.....',
      '......kEkkEk......',
      '......kWWWWk......',
      '.....kWwwwwWk.....',
      '.....kWkkkkWk.....',
      '.....kWesseWk.....',
      '.....kWssssWk.....',
      '......kkggkk......',
      '.....kwwgGgwwk....',
      '....kwwwgggwwk....',
      '..kkkwwwwgwwwk....',
      '.kEEkWwwwgwwWk....',
      '.kFEkkWwwwwWk.....',
      '..kk.kdk..kdk.....',
      ',....kkk..kkk....,',
    ],
    gunner: [
      '......k....k......',
      '.....kEk..kEk.....',
      '.....kiEkkEik.....',
      '.....kkkkkkkk.....',
      '....kHHHHHHHHk....',
      '...kHHhhhhhhHHk...',
      '....kkkkkkkkkk....',
      '.....ksessesk.....',
      '.....kmmmmmmk.....',
      '....kccmmmccck....',
      '.kkkcccclcccck....',
      'kFEkccckbkccck....',
      'kEEEkcccccccck....',
      'kEEkkcckkkcck.....',
      '.kWk.kdk..kdk.....',
      ',.k..kkk..kkk....,',
    ],
    potion: ['..kkkk..', '..kbbk..', '...kk...', '..knnk..', '.kppppk.', 'kpqpppPk', 'kppppPPk', 'kPpppPPk', '.kkkkkk.'],
    orb: ['..kkk..', '.kyYyk.', 'kyYWYyk', 'kYYYYYk', 'kyYYYyk', '.kyyyk.', '..kkk..'],
    pouch: ['..k.k..', '..kgk..', '.kbbbk.', 'kbbBbbk', 'kbBgBbk', 'kbbbbbk', '.kkkkk.'],
    vial: ['..kkk..', '..kck..', '..kck..', '.kvVvk.', 'kvVVVvk', 'kvVHVvk', '.kvvvk.'],
    gear: ['....kk', '...kck', '..kck.', 'kkck..', '.kk...', 'k.k...'],
    knight: [
      '.....rr.....',
      '....rrrr....',
      '...kkkkkkk..',
      '..kwllllllk.',
      '..klllllmmk.',
      '..kkekkkekk.',
      '..klmmmmmdk.',
      '...kkkkkkk..',
      '..Rkwlmmdk..',
      '.RRkmggmdk..',
      '.RRkmmmmdk..',
      '.R.kdkkdk...',
      '...kdk.kdk..',
      '...kkk.kkk..',
    ],
    soldier: [
      '.....rr.......',
      '....rrrr......',
      '...kkkkkkk....',
      '..kwllllllk...',
      '..klllllmmk...',
      '..kllmmmmmk...',
      '..kkkkekkekk..',
      '..klmmmmmmdk..',
      '...kkkkkkkk...',
      '.RRkwlmmmdkR..',
      'RRRklmggmdkk..',
      'RRRkmmmmmdk...',
      'RR.kdmmmdk....',
      'R..kdkkkdk....',
      '...kdk.kdk....',
      '..kkdk.kkdk...',
      '..kkkk..kkk...',
    ],
    boss: [
      '.k...........k....',
      '.kk.........kk....',
      '..kk.kkkkkk.kk....',
      '...kkwllllmkk.....',
      '...kklkeekkkk.....',
      '...kkllmmmmk......',
      '...kkkmggmkk......',
      '..RkkkkkkkkkR.....',
      '.RRkwlmmmdkkRk....',
      '.RRklmmmddkkkk....',
      '.RRkmmgmmdk.......',
      '.RRkkmmmdkk.......',
      'RRRRkdmmdk........',
      'RRR.kmkkmk........',
      'RR..kdk.kdk.......',
      'RR..kdk.kdk.......',
      'R..kkdk.kkdk......',
      '...kkkk..kkk......',
    ],
    ghoul: [
      '...kkkkkkk....',
      '..kCCCCcCCk...',
      '.kCCsssssCCk..',
      '.kCsssssssCk..',
      '..kSskesskek..',
      '..kSsssssssk..',
      '..kSssmmmssk..',
      '...kkSmbmSk...',
      '..kcccccSkk...',
      '.kscCcCcCcksk.',
      '.kS.kccCcck.Sk',
      '.kbk.kcCck.kbk',
      '..k..kSkkSk.k.',
      '....kkSk.kSk..',
      '....kkkk.kkkk.',
    ],
    ranger: [
      '......k...k.......',
      '.....kEk.kEk......',
      '.....kEikkiEk.....',
      '.....kHhhhhk......',
      '....kHhhhhhhk.....',
      '....kHhkkkkkk.....',
      '.kk.kHkseksek.....',
      'kFEkkHkssssskk....',
      'kEk..kkrrrrrk.....',
      'kEk.krrrlllmk.....',
      'kEkrrklllmmk......',
      'kEkr.kmbbbmk......',
      '.kEEkklllmmk......',
      '..kk.kmkkmk.......',
      '.....kdk.kdk......',
      ',....kkk.kkk.....,',
    ],
    ghoulUp: [
      'kbk...........kbk',
      'ksk...........ksk',
      'kSk.kkkkkkk...kSk',
      'kSkkCCCCcCCk..kSk',
      'kSkCCsssssCCk.kSk',
      '.kSksssssssCkkSk.',
      '.kSkSskesskekkSk.',
      '..kSkssssssskSk..',
      '..kSkssmmmsskSk..',
      '...kkkSmbmSkkk...',
      '....kcccccSk.....',
      '....kcCcCcck.....',
      '.....kccCcck.....',
      '.....kcCcck......',
      '.....kSkkSk......',
      '....kkSk.kSk.....',
      '....kkkk.kkkk....',
    ],
    butcher: [
      '....kkkkkk......',
      '...kHhhhhHk.....',
      '..kHhhhhhhHk....',
      '..khkhhhkhhk....',
      '..khekhhekhk....',
      '..kHhmhmhhHk....',
      '...kHhhhhHk.....',
      '..kkkSSSSkkk....',
      '.kSccCccCccSk...',
      'kSsSaaaaaaSsSk..',
      'kssAaaabaaAssk..',
      'kSsAaaaabaAsSk..',
      '.kkAabaaaaAkk...',
      '..kAaaaaaaAk....',
      '..kAaaaabaAk....',
      '..kAAaaaaAAk....',
      '...kAAAAAAk.....',
      '...kSSkkSSk.....',
      '...kSSk.kSSk....',
      '..kSSSk.kSSSk...',
      '..kkkkk.kkkkk...',
    ],
    cultist: [
      '.....kkkk.....',
      '....kRRRRk....',
      '...kRrrrrRk...',
      '..kRrrrrrrRk..',
      '..kRrkkkkkRk..',
      '..kRkkkkekek..',
      '..kRkkkkkkRk..',
      '..kRRkkkkRRk..',
      '...kRRhhRRk...',
      '..kRrrRRrrRk..',
      '.kskRrRRrRksk.',
      '..kkRrrRRrRk..',
      '..kRrrrRRrrRk.',
      '.kRRrrrRRrrRRk',
      '.kkkkkkkkkkkkk',
    ],
    bloat: [
      '.....kkkkk......',
      '....kSsssSk.....',
      '...kSssssssk....',
      '...kSsskeskek...',
      '...kSssssssk....',
      '...kkSsmmmSk....',
      '..kSskkSSkkSk...',
      '.kSssPssssPssk..',
      'kSsPsssssPsssSk.',
      'kSsssPPsssssPsk.',
      'kSPsssssssPssSk.',
      'kSssPssPssssSSk.',
      '.kSSsssssPsSSk..',
      '..kkSSSSSSSkk...',
      '...kSk...kSk....',
      '...kkk...kkk....',
    ],
    dog: [
      '.............k..k.......',
      '............kDkkLk......',
      '............kDdkLlk.....',
      '...........kdddddLdk....',
      '...........kddddLLddk...',
      '..........kdddddkeLdkk..',
      'kk........kddddddLLLLLkk',
      'kLk.......kLddddDDLLLLkk',
      'kLdk......kLLdddDkkkkkk.',
      '.kddkkkkkkkLLdddDtDDk...',
      '..kdLLdLLLdLLddddDkkk...',
      '.kddLdddDdDdddddddk.....',
      '.kdDDdkkkkkkDDddddk.....',
      '..kDdkkDdk..kDdkDdk.....',
      '..kDdkkDdk..kDdkDdk.....',
      '..kDddkDddk.kDddkDddk...',
      '..kkkkkkkkk.kkkkkkkkk...',
    ],
    dogB: [
      '.............k..k.......',
      '............kDkkLk......',
      '............kDdkLlk.....',
      '...........kdddddLdk....',
      '...........kddddLLddk...',
      '..........kdddddkeLdkk..',
      'kk........kddddddLLLLLkk',
      'kLk.......kLddddDDLLLLkk',
      'kLdk......kLLdddDkkkkkk.',
      '.kddkkkkkkkLLdddDtDDk...',
      '..kdLLdLLLdLLddddDkkk...',
      '.kddLdddDdDdddddddk.....',
      '.kdDDdkkkkkkDDdddddk....',
      'kDdkkDdk.....kDdkkDdk...',
      'kDkk.kDdk.....kDdkkDdk..',
      'kDdk..kDdk.....kDddkDddk',
      'kkkk..kkkk.....kkkkkkkkk',
    ],
    wolfA: [
      '............k...k.......',
      '............kk..kk......',
      '............kDkkLLk.....',
      '............kDdkLlk.....',
      '...........kddddLLdk....',
      '..........kldddLLLddk...',
      'kkk.......klddddkeLdkk..',
      'kLLk.....klldddddLLLLkkk',
      'kLLLk....kllldddDLLLLLkk',
      '.kLddk...kllcccccDkkkkkk.',
      '.kkdddkkkcmcmcmcDtDDk...',
      '...kdLLLLdLLLddddDkkk...',
      '..kddLdddDdDdddddddk....',
      '..kdDDdkkkkkkDDddddk....',
      '..kDdkkDdk...kDdkDdk....',
      '..kDdkkDdk...kDdkDdk....',
      '..kDddkDddk..kDddkDddk..',
      '..kkkkkkkkk..kkkkkkkkk..',
    ],
    wolfB: [
      '............k...k.......',
      '............kk..kk......',
      '............kDkkLLk.....',
      '............kDdkLlk.....',
      '...........kddddLLdk....',
      '..........kldddLLLddk...',
      'kkk.......klddddkeLdkk..',
      'kLLk.....klldddddLLLLkkk',
      'kLLLk....kllldddDLLLLLkk',
      '.kLddk...kllcccccDkkkkkk.',
      '.kkdddkkkcmcmcmcDtDDk...',
      '...kdLLLLdLLLddddDkkk...',
      '..kddLdddDdDdddddddk....',
      '.kdDDdkkkkkkkDDdddddk...',
      'kDdkkDdk......kDdkkDdk..',
      'kDkk.kDdk......kDdkkDdk.',
      'kDdk..kDdk......kDddkDdd',
      'kkkk..kkkk......kkkkkkkk',
    ],
    heldDrum: [
      '...kkkkkk...',
      '.kkWWWWWWkk.',
      'kWWwwwwwwWWk',
      'kWwwwwwwwwWk',
      'kkWWWWWWWWkk',
      'kQbbbbbbbbQk',
      'kbRbbbbbbRBk',
      'kbbRbbbbRbBk',
      'kbbbRbbRbbBk',
      'kbbbbRRbbbBk',
      'kbbbRbbRbbBk',
      'kQbbbbbbbbQk',
      'kkWWWWWWWWkk',
      '.kkkkkkkkkk.',
    ],
    baldor: [
      '..k....................k..',
      '..kk..................kk..',
      '..kwk....kkkkkkkk....kwk..',
      '...kwk..kwllllllmk..kwk...',
      '....kwkkwlllllllmmkkwk....',
      '.....kkwllllllllmmdkk.....',
      '......klllllllmmmmdk......',
      '......kllkkkkkkkkkkk......',
      '......klmkkeekkeekkk......',
      '......kllmmmmmmmmddk......',
      '...kkkklmmmgggmmmddkkkk...',
      '..krrrqkkmmmmmmmdkkRRRRk..',
      '..krrrqqqqqGgGGrrrRRRRGk..',
      '...kqrrrgqqlmmdrrgRRRRk...',
      '..kgGGgGGgGlmmdgGGgGGgk...',
      '..kqqqRqrrllmmddrrRRRRRk..',
      '..kqqqRqrrllggddrrRrRRRk..',
      '..kqqqRqrrlleeddrrRrRRRk..',
      '.kqqqqqrrlllggdddRrrRRRk..',
      '.kqqqqqrrlllmmdddRrrRRRRk.',
      '.kqqqRqrrlllmmdddRrrRRRRk.',
      '.kqqqRqrlgkkgkkgkkrrRRRRk.',
      'kqqqqRqrllllmmddddrrRRRRk.',
      'kqqqqRqrrRdmmRdmmRrrRRRRRk',
      'kqqqqqrrRqdmmrdmmrrrRRRRRk',
      'kqqkRkkrRkdmmrdmmrkrkkRRk.',
      'kRkkRkkRkkdmmRdmmkkRkkRk..',
      '.k..k..k.kkkkkkkkk.k..k...',
    ],
  };
  const PAL = {
    squire: {'S': '#8a9476', 'D': '#5a2a2a', 'b': '#4a3020', 'y': '#b89040', 'k':  '#0e0c10', 'w':  '#d8dce4', 'l':  '#9aa0ac', 'm':  '#6a707c', 'd':  '#3c404a', 'e':  '#ff4030', 'c':  '#7a7a80', 'C':  '#4a4a52', 'R':  '#4a0e14', 'r':  '#7a1a22', 'g':  '#b89040'},
    chaplain: {'k':  '#0e0a0c', 'W':  '#7e786c', 'w':  '#c0b8a6', 'g':  '#c9a24a', 'S':  '#2a2228', 'e':  '#ffcc66', 'R':  '#6a1520', 'r':  '#8a1a1a', 's':  '#c9b49a'},
    pknight: {'k':  '#121012', 'l':  '#8a8e96', 'm':  '#5a5e68', 'd':  '#3a3c44', 's':  '#8f9a6a', 'S':  '#5f6a45', 'P':  '#a3452e', 'e':  '#ff3b2c'},
    hound: {'k':  '#100c0c', 'd':  '#4e3b33', 'D':  '#2f231e', 'l':  '#a8aeb8', 'L':  '#94766a', 't':  '#e0d8c0', 'e':  '#ff3b2c', 'm':  '#6a707c', 'r':  '#7a1a22', 'R':  '#4a0e14', 'g':  '#b89040'},
    exec: {'B':  '#2a2024', 'k':  '#0c0a0a', 'H':  '#141014', 'h':  '#2a242a', 'e':  '#ff3020', 's':  '#b08a78', 'S':  '#7a5a4c', 'b':  '#3a2418', 'A':  '#3a2418', 'a':  '#5a3a24', 'r':  '#7a1418'},
    bearer: {'k':  '#0e0c10', 'w':  '#d8dce4', 'l':  '#9aa0ac', 'm':  '#6a707c', 'd':  '#3c404a', 'e':  '#ff4030', 'R':  '#4a0e14', 'r':  '#8a1a22', 'g':  '#c9a24a', 's':  '#9aa0ac', 'S':  '#5a5e68', 'hl':  '#d8dce4'},
    pknightHot: { k: '#300808', l: '#e08a5a', m: '#b05030', d: '#702010', s: '#e05a36', S: '#a02818', P: '#ffd060', e: '#ffffff' },
    abom: { k: '#0e0c0c', H: '#4a5048', h: '#7a8274', e: '#d8e070', m: '#2a1414', s: '#8a9282', S: '#5a6256', c: '#2a2420', C: '#14100e', a: '#6e2a24', A: '#3d1411', b: '#d8d0b8' },
    mother: { k: '#0c0a0c', H: '#1a1418', h: '#3a2e34', s: '#b8b09c', S: '#7a7464', e: '#c8f060', m: '#2a1010', v: '#9ae050', V: '#4a7a20', r: '#4a3a38', R: '#2a2020', b: '#d8d0b8' },
    crow: { k: '#141018', K: '#5a5070', e: '#ff3030', y: '#8a8070', r: '#8a1a22' },
    gbrute: { k: '#0b0f08', s: '#5e8a34', S: '#3e5e24', h: '#8ab858', e: '#ffdf3a', r: '#a3222a', w: '#ece0c4', b: '#d8d0b8', c: '#5a3a22', C: '#3a2414' },
    boar: { k: '#0a0806', d: '#4a3428', D: '#2e2018', L: '#6a5040', b: '#e0d8c0', e: '#ff3020', r: '#140c08', p: '#a06060', P: '#603838', w: '#ece0c4', h: '#1a1410' },
    shadeBoar: { k: '#3a0808', d: '#a02020', D: '#701414', L: '#d03434', b: '#ff8070', e: '#ffffff', r: '#3a0808', p: '#d03434', P: '#701414', w: '#ff8070', h: '#3a0808' },
    garcher: { k: '#0e120a', s: '#6e9a3a', S: '#46682a', c: '#3a5a34', C: '#22381f', e: '#ffd23a' },
    goblin: { k: '#0e120a', s: '#6e9a3a', S: '#46682a', c: '#5a4030', C: '#3a2a1e', e: '#ffd23a' },
    gthrower: { k: '#0e120a', s: '#7aa040', S: '#4a6a2a', c: '#6a3a5a', C: '#3e2034', e: '#ff9a3a' },
    hob: { k: '#0b0f08', H: '#2e3e1c', h: '#4a6228', e: '#ffd23a', m: '#141c0c', s: '#6e9a3a', S: '#46682a', c: '#8a8070', C: '#3a3428', a: '#5a3a22', A: '#3a2414', b: '#9a2a1a' },
    mage: { k: '#0e0a14', H: '#2a1d44', h: '#4a3478', s: '#e0b896', e: '#9fe8ff', r: '#3a2a62', R: '#241a40', g: '#c9a24a', d: '#2e2218', E: '#d8742c', F: '#f09a48', i: '#3a1a10', W: '#f4ece0' },
    priest: { k: '#120e0a', W: '#b8ae96', w: '#e8e0cc', s: '#e0b896', e: '#5a4020', g: '#c9a24a', G: '#ffe39a', d: '#3a2a1c', E: '#f4f0e8', F: '#d8d0c4', i: '#f0b0b8' },
    gunner: { k: '#0b0a0c', H: '#2a2420', h: '#4a3e34', s: '#e0b896', e: '#ffd080', m: '#5a1418', c: '#3a3440', l: '#6a6070', b: '#c9a24a', d: '#1e1a18', E: '#82828e', F: '#b4b4c0', i: '#2a2228', W: '#e0e0e8' },
    loot: { p: '#e0303a', P: '#8a1020', q: '#ffc0c0', n: '#c8d8e0', k: '#120c0a', r: '#6e2416', R: '#b5502e', h: '#e8925e', w: '#ece0c4', y: '#a8801e', Y: '#ffd34d', W: '#fff8d8', b: '#5a3c22', B: '#8a6236', g: '#ffd34d', v: '#3a0a30', V: '#9a1a7a', H: '#ff90e0', c: '#9fb2c4' },
    ranger: { k: '#0e0c0a', H: '#1f3d28', h: '#33623f', s: '#e0b896', e: '#ffe9a0', r: '#a3222a', l: '#7a5232', m: '#4e341f', b: '#c9a24a', d: '#2e2218', E: '#c8783a', F: '#e8a060', i: '#f0a8a0' },
    rangerGhost: { k: '#16233a', H: '#3b5a86', h: '#5f86b8', s: '#cfe6ff', e: '#ffffff', r: '#9cc1ea', l: '#5f86b8', m: '#3b5a86', b: '#e4f2ff', d: '#3b5a86', E: '#5f86b8', F: '#9cc1ea', i: '#9cc1ea' },
    shadow: { k: '#120818', H: '#2a1238', h: '#3d1d52', s: '#6b3d8a', e: '#e0a0ff', r: '#4a1a66', l: '#3d1d52', m: '#2a1238', b: '#8a5aa8', d: '#2a1238', E: '#3d1d52', F: '#6b3d8a', i: '#6b3d8a' },
    knight: { k: '#0e0c12', d: '#3c404d', m: '#707686', l: '#b0b6c4', w: '#eceff4', g: '#c9a24a', r: '#a3222a', R: '#5c1016', e: '#bfe6ff' },
    ghost: { k: '#16233a', d: '#3b5a86', m: '#5f86b8', l: '#9cc1ea', w: '#e4f2ff', g: '#9cc1ea', r: '#cfe6ff', R: '#4f74a6', e: '#ffffff' },
    boss: { k: '#050407', d: '#1d1a24', m: '#2f2a3a', l: '#4d465c', w: '#7a7090', g: '#6d1c83', e: '#d17aff', r: '#4a0f14', R: '#2a070b', q: '#6e1a24', G: '#a87a30' },
    ghoul: { k: '#120f12', s: '#8a9476', S: '#59614c', c: '#4b3b30', C: '#2c231d', e: '#ff3b2c', b: '#d8d0b8', m: '#3a0c0c' },
    butcher: { k: '#0f0b0b', H: '#4a3a28', h: '#6e5a40', e: '#ff4030', m: '#2a1a14', s: '#b08a78', S: '#7a5a4c', c: '#9a9da4', C: '#4d4f55', a: '#6e2a24', A: '#3d1411', b: '#b01c22' },
    shadeB: { k: '#3a0808', H: '#701414', h: '#a02020', e: '#ffffff', m: '#3a0808', s: '#d03434', S: '#901c1c', c: '#ff6050', C: '#701414', a: '#b02424', A: '#701414', b: '#ff8070' },
    dog: { k: '#100c0c', d: '#4e3b33', D: '#2f231e', l: '#74594d', L: '#94766a', t: '#e0d8c0', e: '#ff3b2c' },
    cultist: { k: '#0e080a', R: '#3d0c14', r: '#6a1722', e: '#ffcc66', s: '#c9b49a', h: '#24070b' },
    bloat: { k: '#121012', s: '#8f9a6a', S: '#5f6a45', P: '#a3452e', e: '#ff3b2c', m: '#2a1010' },
    bloatHot: { k: '#300808', s: '#e05a36', S: '#a02818', P: '#ffd060', e: '#ffffff', m: '#ffd060' },
    shadeR: { k: '#3a0808', s: '#b02424', S: '#701414', c: '#d03434', C: '#501010', e: '#ffffff' },
    heldDrum: { k: '#140c08', W: '#e0d0a8', w: '#bca880', b: '#8a2e22', B: '#5a1a14', R: '#d8c090', Q: '#3a2418' },
    shade: { k: '#2a0f3a', d: '#5a2280', m: '#7a34a6', l: '#a35fd0', w: '#d9a8ff', g: '#d9a8ff', e: '#ffffff', r: '#4a1a66', R: '#2a0f3a', q: '#5a2280', G: '#a35fd0' },
  };
  // 잔상용 푸른 팔레트를 밝기에 따라 자동 생성
  const ghostOf = pal => { const ramp = ['#16233a', '#3b5a86', '#5f86b8', '#9cc1ea', '#e4f2ff'], o = {}; for (const k in pal) { const h = pal[k], r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); o[k] = ramp[Math.min(4, Math.floor((0.3 * r + 0.59 * g + 0.11 * b) / 52))]; } return o; };
  PAL.mageGhost = ghostOf(PAL.mage); PAL.priestGhost = ghostOf(PAL.priest); PAL.gunnerGhost = ghostOf(PAL.gunner);
  const spriteCache = {};
  function sprite(map, pal, scale, white) {
    const key = map + pal + scale + (white ? 'w' : '');
    if (spriteCache[key]) return spriteCache[key];
    const rows = MAPS[map], p = PAL[pal];
    let minX = 99, maxX = 0;
    rows.forEach(r => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') { minX = Math.min(minX, x); maxX = Math.max(maxX, x); } });
    const w = maxX - minX + 1, h = rows.length;
    const [c, g] = mkCanvas(w * scale, h * scale);
    rows.forEach((r, y) => {
      for (let x = minX; x <= maxX; x++) {
        const ch = r[x]; if (!ch || ch === '.' || !p[ch]) continue;
        g.fillStyle = white ? '#ffffff' : p[ch];
        g.fillRect((x - minX) * scale, y * scale, scale, scale);
        // 픽셀 하이라이트로 질감
        if (!white && scale >= 2 && ch !== 'k' && (x + y) % 3 === 0) { g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect((x - minX) * scale, y * scale, 1, 1); }
      }
    });
    spriteCache[key] = c;
    return c;
  }
  // ================================================================ v1.05 도트 규칙을 지키는 변형
  // 매끈한 회전·비정수 배율 대신, 스프라이트를 칸(2px) 단위로 다시 뽑아 칸이 옮겨 가게 한다. 외곽선은 다시 두른다. 위치는 2px 격자에 맞춘다.
  const snap2 = v => Math.round(v / 2) * 2;
  const PXCELL = new WeakMap();
  function pxCells(cv, cs, fresh) { // 캔버스 → 칸 색 배열 (투명 칸과 맞닿은 어두운 칸은 외곽선 표시)
    let o = !fresh && PXCELL.get(cv); if (o && o.cs === cs) return o;
    const W = Math.max(1, Math.round(cv.width / cs)), H = Math.max(1, Math.round(cv.height / cs)), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, col = new Array(W * H), dark = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = ((Math.min(cv.height - 1, y * cs + (cs >> 1))) * cv.width + Math.min(cv.width - 1, x * cs + (cs >> 1))) * 4, a = d[i + 3];
      if (a > 20) { col[y * W + x] = `rgba(${d[i]},${d[i + 1]},${d[i + 2]},${(a / 255).toFixed(3)})`; dark[y * W + x] = d[i] + d[i + 1] + d[i + 2] < 70 ? 1 : 0; } else col[y * W + x] = null; }
    const out = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!col[i] || !dark[i]) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H || !col[Y * W + X]) { out[i] = 1; break; } } }
    o = { W, H, cs, col, out, cache: new Map() }; if (!fresh) PXCELL.set(cv, o); return o;
  }
  // ang 라디안(1/80바퀴 단위로 끊음), sx·sy 배율(칸 수로 반올림), flip 좌우 반전, 기준점 pvx·pvy(px, 기본 아래 가운데)
  // 반환 {c, ax, ay}: (x-ax, y-ay)에 그리면 기준점이 (x,y)
  function pxXform(cv, cs, ang, sx, sy, flip, o = {}) {
    const fresh = o.fresh, oc = o.oc || '#0b0a0e', P = pxCells(cv, cs, fresh), q = Math.round(ang / (Math.PI / 40)), A = q * Math.PI / 40;
    const Wd = Math.max(1, Math.round(P.W * sx)), Hd = Math.max(1, Math.round(P.H * sy)), pvx = o.pvx == null ? P.W * cs / 2 : o.pvx, pvy = o.pvy == null ? P.H * cs : o.pvy;
    const key = q + '|' + Wd + '|' + Hd + '|' + (flip ? 1 : 0) + '|' + oc + '|' + pvx + ',' + pvy;
    if (!fresh && P.cache.has(key)) return P.cache.get(key);
    const kx = Wd / P.W, ky = Hd / P.H, ca = Math.cos(A), sa = Math.sin(A), px = pvx / cs, py = pvy / cs;
    // 원본 네 귀퉁이를 옮겨 결과 범위를 구함
    let u0 = 1e9, v0 = 1e9, u1 = -1e9, v1 = -1e9;
    for (const [X, Y] of [[-px, -py], [P.W - px, -py], [-px, P.H - py], [P.W - px, P.H - py]]) { const x = (flip ? -X : X) * kx, y = Y * ky, u = x * ca - y * sa, v = x * sa + y * ca; u0 = Math.min(u0, u); v0 = Math.min(v0, v); u1 = Math.max(u1, u); v1 = Math.max(v1, v); }
    u0 = Math.floor(u0) - 2; v0 = Math.floor(v0) - 2; u1 = Math.ceil(u1) + 2; v1 = Math.ceil(v1) + 2;
    const GW = u1 - u0 + 1, GH = v1 - v0 + 1, grid = new Int32Array(GW * GH).fill(-1);
    let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1;
    for (let gy = 1; gy < GH - 1; gy++) for (let gx = 1; gx < GW - 1; gx++) {
      const cx = u0 + gx + 0.5, cy = v0 + gy + 0.5; let x = (cx * ca + cy * sa) / kx, y = (-cx * sa + cy * ca) / ky; if (flip) x = -x;
      const i = Math.floor(x + px), j = Math.floor(y + py); if (i < 0 || j < 0 || i >= P.W || j >= P.H) continue;
      const k = j * P.W + i; if (!P.col[k] || P.out[k]) continue; grid[gy * GW + gx] = k;
      if (gx < bx0) bx0 = gx; if (gy < by0) by0 = gy; if (gx > bx1) bx1 = gx; if (gy > by1) by1 = gy;
    }
    if (bx1 < 0) return { c: mkCanvas(2, 2)[0], ax: 0, ay: 0 };
    bx0--; by0--; bx1++; by1++;
    const [c, g] = mkCanvas((bx1 - bx0 + 1) * cs, (by1 - by0 + 1) * cs);
    g.fillStyle = oc;
    for (let gy = by0; gy <= by1; gy++) for (let gx = bx0; gx <= bx1; gx++) { if (grid[gy * GW + gx] >= 0) continue;
      if (grid[gy * GW + gx + 1] >= 0 || grid[gy * GW + gx - 1] >= 0 || grid[(gy + 1) * GW + gx] >= 0 || grid[(gy - 1) * GW + gx] >= 0) g.fillRect((gx - bx0) * cs, (gy - by0) * cs, cs, cs); }
    for (let gy = by0; gy <= by1; gy++) for (let gx = bx0; gx <= bx1; gx++) { const k = grid[gy * GW + gx]; if (k < 0) continue; g.fillStyle = P.col[k]; g.fillRect((gx - bx0) * cs, (gy - by0) * cs, cs, cs); }
    const r = { c, ax: -(u0 + bx0) * cs, ay: -(v0 + by0) * cs };
    if (!fresh) { if (P.cache.size > 96) P.cache.delete(P.cache.keys().next().value); P.cache.set(key, r); }
    return r;
  }
  function drawSprite(map, pal, scale, x, y, flip, o = {}) { // v1.05: 기울이기·늘이기는 칸 단위 (pxXform), 위치는 2px 격자
    const s = sprite(map, pal, scale, o.white), X = snap2(x), Y = snap2(y), rot = o.rot || 0, sx = o.sx || 1, sy = o.sy || 1;
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    const W = s.width / scale, H = s.height / scale;
    if (Math.round(rot / (Math.PI / 40)) === 0 && Math.round(W * sx) === W && Math.round(H * sy) === H) {
      if (flip) { ctx.translate(X, Y); ctx.scale(-1, 1); ctx.drawImage(s, -Math.floor(s.width / 2), -s.height); } else ctx.drawImage(s, X - Math.floor(s.width / 2), Y - s.height);
    } else { const t = pxXform(s, scale, rot, sx, sy, flip, { pvx: Math.floor(s.width / 2) }); ctx.drawImage(t.c, X - t.ax, Y - t.ay); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- 무기 텍스처 (오른쪽을 향하도록 그림, 손잡이 중심이 회전축)
  function makeBlade(o) {
    const [c, g] = mkCanvas(o.len + 2, o.wide + 6);
    const cy = Math.floor((o.wide + 6) / 2);
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // 손잡이
    px(0, cy - 2, 3, 4, o.gold); px(3, cy - 1, o.grip, 3, o.handle); px(3, cy - 1, o.grip, 1, '#7a5034');
    const gx = 3 + o.grip;
    px(gx - 1, cy - Math.floor(o.wide / 2) - 3, 3, o.wide + 6, '#0b0a0e');
    px(gx, cy - Math.floor(o.wide / 2) - 2, 1, o.wide + 4, o.gold);
    // 칼날
    const bx = gx + 2, blen = o.len - bx;
    for (let x = 0; x < blen; x++) {
      const tip = x > blen - o.tip ? (blen - x) / o.tip : 1;
      const hw = Math.max(1, Math.round((o.wide / 2) * (o.cleaver ? 1 : tip)));
      const top = cy - hw, bot = cy + hw;
      px(bx + x, top - 1, 1, bot - top + 2, '#0b0a0e');
      px(bx + x, top, 1, bot - top, o.mid);
      px(bx + x, top, 1, 1, o.edge);
      px(bx + x, bot - 1, 1, 1, o.dark);
      if (!o.cleaver && x < blen - o.tip) px(bx + x, cy, 1, 1, o.dark);
      if (o.rune && x > 6 && x < blen - o.tip - 4 && x % 7 === 0) px(bx + x, cy - 1, 2, 2, o.rune);
      if (o.rust && Math.random() < 0.12) px(bx + x, randi(top, bot - 1), 1, 1, o.rust);
    }
    if (o.post) o.post(px, cy, gx, bx, blen);
    return { c, pivotX: 3 + Math.floor(o.grip / 2), pivotY: cy, reach: o.len - 3 - Math.floor(o.grip / 2) };
  }
  const BLADES = {
    great: makeBlade({ len: 58, wide: 8, grip: 9, tip: 7, handle: '#4a2f1d', gold: '#c9a24a', mid: '#b9bfca', edge: '#f4f6fa', dark: '#6b7280' }),
    boss: cellBlade({ len: 92, wide: 13, grip: 14, tip: 10, handle: '#241a22', gold: '#5c1a70', mid: '#3c3846', edge: '#8a8199', dark: '#17151c', rune: '#b45cff' }),
    cleaver: cellBlade({ len: 36, wide: 14, grip: 10, tip: 3, cleaver: true, handle: '#3b2416', gold: '#2a2a2a', mid: '#8d9097', edge: '#c8cbd0', dark: '#4d4f55', rust: '#6e2a24' }),
    ghost: cellBlade({ len: 34, wide: 5, grip: 6, tip: 5, handle: '#3f5f8a', gold: '#9cc1ea', mid: '#9cc1ea', edge: '#e4f2ff', dark: '#5f86b8' }),
    // v0.95 기사단 무기
    squire: cellBlade({ len: 30, wide: 5, grip: 6, tip: 5, handle: '#3b2416', gold: '#8a7040', mid: '#8a909c', edge: '#c8ccd4', dark: '#4a4e58' }),
    bsword: cellBlade({ len: 40, wide: 7, grip: 8, tip: 6, handle: '#3b2416', gold: '#c9a24a', mid: '#9aa0ac', edge: '#e4e8f0', dark: '#5a5e68' }),
    // 참수 도끼: 긴 자루 끝에 초승달 날(위쪽), 뒤로 뻗은 가시, 녹·핏자국
    headsman: cellWeapon(32, 24, 2, 15, { k: '#0b0a0e', h: '#5a3a22', H: '#3a2414', m: '#7d8087', w: '#d0d3d8', d: '#3d3f45', x: '#6a2a1a', r: '#8a1418' }, put => {
      for (let x = 0; x <= 27; x++) put(x, 15, x % 5 === 0 ? 'H' : 'h');
      for (let x = 18; x <= 29; x++) { const t = (x - 17.5) / 12, top = 15 - Math.round(12 * Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.05))), bot = 16 - Math.round(3 * t);
        for (let y = top; y <= Math.max(top, 15 + (x > 26 ? 0 : 0)); y++) { const edge = y === top || x === 29, inner = x <= 19; put(x, y, edge ? 'w' : inner ? 'd' : (x * 5 + y * 3) % 13 === 0 ? 'x' : (x + y) % 9 === 0 ? 'r' : 'm'); } }
      for (let y = 16; y <= 18; y++) put(21 + (y - 16), y, y === 18 ? 'w' : 'd'); put(22, 16, 'd');
      put(28, 15, 'd'); put(29, 15, 'd');
    }),
    dagger: makeBlade({ len: 26, wide: 5, grip: 6, tip: 6, handle: '#3b2416', gold: '#8a8a8a', mid: '#c8ccd4', edge: '#ffffff', dark: '#6b7280' }),
    daggerG: makeBlade({ len: 26, wide: 5, grip: 6, tip: 6, handle: '#1f4a34', gold: '#9ff0c8', mid: '#8ff0c0', edge: '#ffffff', dark: '#3aa070' }),
    holy: makeBlade({ len: 58, wide: 8, grip: 9, tip: 7, handle: '#8a6a20', gold: '#fff0b0', mid: '#ffd34d', edge: '#fffbe6', dark: '#c9952a' }),
  };
  // 몬스터 칼도 캐릭터 무기와 같은 2px 칸 회전(rotW)으로 (v0.57)
  function cellBlade(o) {
    const L = Math.round(o.len / 2), wd = Math.max(2, Math.round(o.wide / 2)), gp = Math.max(2, Math.round(o.grip / 2)), tp = Math.max(1, Math.round(o.tip / 2));
    const h = wd + 6, py = Math.floor(h / 2), pal = { k: '#0b0a0e', h: o.handle, G: o.gold, m: o.mid, w: o.edge, d: o.dark, u: o.rune || o.dark, x: o.rust || o.dark };
    return cellWeapon(L + 2, h, 2, py, pal, put => {
      for (let x = 0; x < gp; x++) put(x, py, 'h');
      for (let y = -Math.ceil(wd / 2) - 1; y <= Math.ceil(wd / 2) + 1; y++) put(gp, py + y, 'G');
      const top = py - Math.floor(wd / 2), x0 = gp + 1;
      for (let x = x0; x < L + 1; x++) {
        const t = (x - x0) / Math.max(1, L - x0), cut = o.cleaver ? 0 : Math.max(0, Math.round((x - (L + 1 - tp)) * wd / tp / 1.6));
        for (let r = 0; r < wd; r++) {
          if (r < cut) continue;
          const c = r === 0 + cut ? 'w' : r === wd - 1 ? 'd' : (o.rune && r === Math.floor(wd / 2) && x % 3 === 0) ? 'u' : 'm';
          put(x, top + r, o.cleaver && (x * 7 + r * 3) % 11 === 0 && r > 0 ? 'x' : c);
        }
      }
      if (o.cleaver) for (let r = 0; r < wd; r++) put(L + 1, top + r, r === 0 ? 'w' : 'd');
    });
  }
  function mkTool(w, h, draw, pivotX, pivotY, reach) { const [c, g] = mkCanvas(w, h); draw((x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); }); return { c, pivotX, pivotY, reach }; }
  const maceTool = (head, hi, lo, grip) => mkTool(32, 14, px => {
    px(0, 5, 20, 4, '#0b0a0e'); px(1, 6, 19, 2, '#6b4a2a'); px(1, 6, 4, 2, grip); px(16, 5, 3, 4, grip);
    px(19, 1, 12, 12, '#0b0a0e'); px(20, 2, 10, 10, head); px(20, 2, 10, 2, hi); px(20, 10, 10, 2, lo);
    px(22, 0, 2, 14, '#0b0a0e'); px(27, 0, 2, 14, '#0b0a0e'); px(22, 1, 2, 12, hi); px(27, 1, 2, 12, hi); px(30, 5, 2, 4, hi);
  }, 4, 7, 30);
  const TOOLS = {
    staff: mkTool(44, 12, px => {
      px(0, 5, 34, 3, '#0b0a0e'); px(1, 6, 33, 1, '#6b4a2a');
      for (let x = 5; x < 32; x += 8) px(x, 5, 2, 3, '#c9a24a');
      px(33, 2, 3, 9, '#0b0a0e'); px(34, 3, 1, 7, '#8a6236');
      px(36, 1, 8, 10, '#0b0a0e'); px(37, 2, 6, 8, '#5a2a8a'); px(38, 3, 4, 6, '#b070ff'); px(39, 4, 2, 2, '#f0d8ff');
    }, 10, 6, 40),
    mace: maceTool('#8d9097', '#e6e8ec', '#4d4f55', '#c9a24a'),
    maceH: maceTool('#ffd34d', '#fffbe6', '#c9952a', '#fff0b0'),
    musket: mkTool(50, 10, px => {
      px(0, 3, 12, 7, '#0b0a0e'); px(1, 4, 11, 5, '#6b4a2a'); px(1, 7, 11, 1, '#4a3020');
      px(11, 3, 20, 4, '#0b0a0e'); px(12, 4, 19, 2, '#7a5232');
      px(14, 2, 36, 3, '#0b0a0e'); px(15, 3, 35, 1, '#8d9097');
      px(20, 2, 2, 4, '#c9a24a'); px(32, 2, 2, 3, '#c9a24a'); px(47, 1, 1, 2, '#c9a24a');
      px(14, 1, 3, 2, '#3a3a40'); px(16, 6, 3, 3, '#0b0a0e');
    }, 12, 5, 48),
  };
  // ---------------------------------------------------------------- 무기 등급별 외형 (커먼 · 레어 · 유니크 · 레전더리)
  const TIER_OF = { common: 0, rare: 1, unique: 2, legend: 3 };
  const staffTool = o => mkTool(o.len + 4, 14, px => {
    const L = o.len, cy = 7;
    px(0, cy - 1, L - 10, 3, '#0b0a0e'); px(1, cy, L - 11, 1, o.wood); if (o.wood2) for (let x = 2; x < L - 12; x += 3) px(x, cy, 1, 1, o.wood2);
    if (o.band) for (let x = 5; x < L - 12; x += 8) px(x, cy - 1, 2, 3, o.band);
    const hx = L - 11;
    px(hx, cy - 4, 3, 9, '#0b0a0e'); px(hx + 1, cy - 3, 1, 7, o.band || o.wood);
    if (o.crescent) { px(hx + 2, cy - 6, 2, 3, '#0b0a0e'); px(hx + 2, cy + 4, 2, 3, '#0b0a0e'); px(hx + 3, cy - 5, 1, 2, o.crescent); px(hx + 3, cy + 4, 1, 2, o.crescent); }
    const r = o.orbR;
    px(hx + 3, cy - r - 1, r * 2 + 2, r * 2 + 3, '#0b0a0e'); px(hx + 4, cy - r, r * 2, r * 2 + 1, o.orb1); px(hx + 5, cy - r + 1, r * 2 - 2, r * 2 - 1, o.orb2); px(hx + 5, cy - r + 1, 2, 2, o.orb3);
    if (o.star) { const sx = hx + 4 + r; px(sx, cy - r - 4, 1, 3, o.star); px(sx, cy + r + 2, 1, 3, o.star); px(sx + r + 2, cy, 3, 1, o.star); }
  }, 10, 7, o.len - 2);
  const maceTier = (head, hi, lo, grip, post) => mkTool(36, 18, px => {
    const cy = 9;
    px(0, cy - 2, 20, 4, '#0b0a0e'); px(1, cy - 1, 19, 2, '#6b4a2a'); px(1, cy - 1, 4, 2, grip); px(16, cy - 2, 3, 4, grip);
    px(19, cy - 6, 12, 12, '#0b0a0e'); px(20, cy - 5, 10, 10, head); px(20, cy - 5, 10, 2, hi); px(20, cy + 3, 10, 2, lo);
    px(22, cy - 7, 2, 14, '#0b0a0e'); px(27, cy - 7, 2, 14, '#0b0a0e'); px(22, cy - 6, 2, 12, hi); px(27, cy - 6, 2, 12, hi); px(30, cy - 2, 2, 4, hi);
    if (post) post(px, cy);
  }, 4, 9, 30);
  const musketTier = o => mkTool(o.len, 12, px => {
    const L = o.len;
    px(0, 4, 12, 7, '#0b0a0e'); px(1, 5, 11, 5, o.stock); px(1, 8, 11, 1, o.stock2);
    px(11, 4, 20, 4, '#0b0a0e'); px(12, 5, 19, 2, o.stock);
    px(14, 3, L - 14, 3, '#0b0a0e'); px(15, 4, L - 15, 1, o.barrel);
    for (const x of o.bands) px(x, 3, 2, 4, o.band); px(L - 3, 2, 1, 2, o.band);
    px(14, 2, 3, 2, '#3a3a40'); px(16, 7, 3, 3, '#0b0a0e');
    if (o.post) o.post(px, L);
  }, 12, 6, o.len - 2);
  const WEAP = {
    knight: [
      makeBlade({ len: 54, wide: 8, grip: 9, tip: 7, handle: '#4a2f1d', gold: '#6a6a70', mid: '#9aa0a8', edge: '#d0d4da', dark: '#5a6068', rust: '#6e4a2a' }),
      makeBlade({ len: 58, wide: 8, grip: 9, tip: 7, handle: '#2a3448', gold: '#c0c8d8', mid: '#a8b8d0', edge: '#f0f8ff', dark: '#5a6a88', rune: '#4f8dff' }),
      makeBlade({ len: 62, wide: 9, grip: 10, tip: 8, handle: '#2a1a2a', gold: '#c9a24a', mid: '#4a3e5a', edge: '#d8b8ff', dark: '#241a30', rune: '#b05cff' }),
      makeBlade({ len: 66, wide: 10, grip: 10, tip: 9, handle: '#5a1a10', gold: '#ffe08a', mid: '#e8d090', edge: '#fffbe6', dark: '#a07820', rune: '#ff6a2a',
        post: (px, cy, gx) => { px(gx - 2, cy - 9, 2, 4, '#0b0a0e'); px(gx - 2, cy + 6, 2, 4, '#0b0a0e'); px(gx - 1, cy - 8, 1, 3, '#ffe08a'); px(gx - 1, cy + 6, 1, 3, '#ffe08a'); px(1, cy - 1, 2, 2, '#ff3020'); } }),
    ],
    ranger: [
      makeBlade({ len: 25, wide: 5, grip: 6, tip: 6, handle: '#3b2416', gold: '#6a6a70', mid: '#9aa0a8', edge: '#d8dce4', dark: '#5a6068', rust: '#6e4a2a' }),
      makeBlade({ len: 27, wide: 5, grip: 6, tip: 7, handle: '#2a3448', gold: '#c0c8d8', mid: '#b8c8e0', edge: '#ffffff', dark: '#5a6a88' }),
      makeBlade({ len: 29, wide: 6, grip: 6, tip: 8, handle: '#2a1a2a', gold: '#c9a24a', mid: '#5a3e6a', edge: '#e8c8ff', dark: '#2a1a3a', rune: '#b05cff' }),
      makeBlade({ len: 31, wide: 6, grip: 7, tip: 11, handle: '#3a0e10', gold: '#a3222a', mid: '#e8e0d0', edge: '#ffffff', dark: '#a89880', rune: '#ff3040' }),
    ],
    mage: [
      staffTool({ len: 40, wood: '#6b4a2a', orbR: 2, orb1: '#2a4a7a', orb2: '#5a8ac0', orb3: '#c0e0ff' }),
      staffTool({ len: 42, wood: '#6b4a2a', band: '#c0c8d8', orbR: 3, orb1: '#1a3a8a', orb2: '#4a80ff', orb3: '#e0f0ff' }),
      staffTool({ len: 44, wood: '#3a2430', wood2: '#5a3a4a', band: '#c9a24a', crescent: '#c9a24a', orbR: 3, orb1: '#5a2a8a', orb2: '#b070ff', orb3: '#f0d8ff' }),
      staffTool({ len: 48, wood: '#c9a24a', wood2: '#ffe08a', band: '#fff0b0', crescent: '#ffe08a', star: '#ffd080', orbR: 4, orb1: '#a0300e', orb2: '#ff9a3a', orb3: '#fff0b0' }),
    ],
    priest: [
      maceTier('#6a6e78', '#a8acb4', '#3a3e44', '#6a6a70'),
      maceTier('#8d9097', '#e6e8ec', '#4d4f55', '#c0c8d8', (px, cy) => { px(24, cy - 1, 2, 2, '#4f8dff'); }),
      maceTier('#4a3e5a', '#c8a8f0', '#241a30', '#c9a24a', (px, cy) => { px(31, cy - 4, 3, 2, '#0b0a0e'); px(31, cy + 2, 3, 2, '#0b0a0e'); px(32, cy - 4, 2, 1, '#c8a8f0'); px(32, cy + 3, 2, 1, '#c8a8f0'); px(24, cy - 1, 2, 2, '#b05cff'); }),
      maceTier('#ffd34d', '#fffbe6', '#c9952a', '#fff0b0', (px, cy) => { for (const [x, y] of [[33, cy - 1], [18, cy - 8], [18, cy + 7], [34, cy - 6], [34, cy + 5]]) px(x, y, 2, 2, '#fff4c0'); px(24, cy - 1, 2, 2, '#ff6a2a'); }),
    ],
    gunner: [
      musketTier({ len: 48, stock: '#6b4a2a', stock2: '#4a3020', barrel: '#8d9097', band: '#6a6a70', bands: [20, 32] }),
      musketTier({ len: 50, stock: '#7a5232', stock2: '#4a3020', barrel: '#a8acb4', band: '#c9a24a', bands: [20, 32, 42] }),
      musketTier({ len: 52, stock: '#2a1a2a', stock2: '#1a1018', barrel: '#5a5a68', band: '#c0c8d8', bands: [20, 32, 44], post: (px) => { px(2, 6, 9, 1, '#b05cff'); px(13, 5, 17, 1, '#b05cff'); } }),
      musketTier({ len: 56, stock: '#1a1418', stock2: '#0e0a0c', barrel: '#3a3e3a', band: '#d8d0b8', bands: [20, 34, 46], post: (px, L) => { px(15, 4, L - 16, 1, '#7aff9a'); px(4, 5, 3, 3, '#d8d0b8'); px(5, 6, 1, 1, '#0b0a0e'); px(L - 4, 1, 4, 1, '#d8d0b8'); } }),
    ],
  };

  // ================================================================ 칸 단위 무기 (v0.45)
  // 캐릭터와 같은 크기의 도트: 1칸 = 게임 2px. 회전도 칸 단위로 하고 외곽선을 다시 붙여, 어떤 각도에서도 계단형 도트가 유지된다
  const wMix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  function cellWeapon(w, h, px, py, pal, draw) {
    const g = Array.from({ length: h }, () => Array(w).fill('.'));
    const put = (x, y, c) => { if (x >= 0 && x < w && y >= 0 && y < h) g[y][x] = c; };
    draw(put, g);
    let reach = 0; g.forEach((r, y) => r.forEach((c, x) => { if (c !== '.') reach = Math.max(reach, Math.hypot(x - px, y - py)); }));
    return { cells: g, w, h, px, py, pal, reach: Math.round(reach * 2), rot: {} };
  }
  const ROT_N = 96;
  function rotW(b, ang, sc = 1) { // v1.05: sc 배율도 칸 단위 (1/8 단위로 끊음)
    sc = Math.max(0.25, Math.round(sc * 8) / 8);
    const flip = Math.cos(ang) < 0, step = ((Math.round(ang / TAU * ROT_N) % ROT_N) + ROT_N) % ROT_N, key = step + (flip ? 'f' : '') + (sc !== 1 ? 's' + sc : '');
    if (b.rot[key]) return b.rot[key];
    const a = step / ROT_N * TAU, ca = Math.cos(a), sa = Math.sin(a), R = Math.ceil(Math.hypot(b.w, b.h) * sc) + 2, N = R * 2 + 3, out = new Map();
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const lx = (x * ca + y * sa) / sc; let ly = (-x * sa + y * ca) / sc; if (flip) ly = -ly;
      const sx = Math.round(lx + b.px), sy = Math.round(ly + b.py);
      if (sx >= 0 && sx < b.w && sy >= 0 && sy < b.h && b.cells[sy][sx] !== '.') out.set(x + ',' + y, b.cells[sy][sx]);
    }
    const [c, g] = mkCanvas(N * 2, N * 2), o = R + 1;
    g.fillStyle = '#0b0a0e';
    for (const k of out.keys()) { const [x, y] = k.split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!out.has((x + dx) + ',' + (y + dy))) g.fillRect((x + dx + o) * 2, (y + dy + o) * 2, 2, 2); }
    for (const [k, v] of out) { const [x, y] = k.split(',').map(Number); g.fillStyle = b.pal[v] || '#0b0a0e'; g.fillRect((x + o) * 2, (y + o) * 2, 2, 2); }
    return (b.rot[key] = { c, o: o * 2 + 1 });
  }
  // 기사 대검: 날 5칸 두께, 큰 가드와 보석
  const swordC = o => cellWeapon(31, 11, 3, 5, {
    G: o.gold, g: wMix(o.gold, '#ffffff', 0.45), r: o.gem || '#a3222a', h: o.handle, H: wMix(o.handle, '#c0a080', 0.35),
    m: o.mid, l: wMix(o.mid, o.edge, 0.55), w: o.edge, d: o.dark, D: wMix(o.mid, o.dark, 0.5), u: o.rune || o.dark, x: o.rust || o.dark,
  }, put => {
    const cy = 5, L = 22;
    put(0, cy, 'G'); put(1, cy, 'G'); put(0, cy - 1, 'G'); put(0, cy + 1, 'G');
    for (let x = 2; x < 6; x++) put(x, cy, x % 2 ? 'h' : 'H');
    for (let y = 1; y < 10; y++) put(6, y, 'G'); for (let y = 2; y < 9; y++) put(7, y, 'G');
    put(6, 1, 'g'); put(6, 9, 'g'); put(7, cy, 'r');
    if (o.spikes) { put(5, 0, 'G'); put(5, 10, 'G'); put(6, 0, 'g'); put(6, 10, 'g'); }
    for (let t = 0; t < L; t++) {
      const x = 8 + t, hw = t < L - 4 ? 2 : t < L - 1 ? 1 : 0;
      for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw ? 'l' : (y === cy + hw && hw) ? 'd' : (y === cy && hw === 2 && t < L - 6) ? 'D' : 'm');
      if (t === L - 1) put(x, cy, 'w');
      if (t >= 10 && t < L - 1) put(x, t < L - 4 ? cy - 2 : cy - 1, 'w');
      if (o.rune && t > 2 && t < L - 7 && t % 4 === 1) put(x, cy, 'u');
      if (o.rust && [3, 9, 14].includes(t)) put(x, cy + 1, 'x');
    }
  });
  // 레인저 단검: 끝이 위로 휘는 날 (역수로 쥔다)
  const daggerC = o => cellWeapon(14, 7, 2, 4, {
    G: o.gold, h: o.handle, H: wMix(o.handle, '#c0a080', 0.35), m: o.mid, l: wMix(o.mid, o.edge, 0.55), w: o.edge, u: o.rune || o.edge,
  }, put => {
    const cy = 4, cv = [0, 0, 0, 1, 1, 2, 2, 3, 4];
    put(0, cy, 'G'); put(1, cy, 'h'); put(2, cy, 'H'); put(3, cy, 'h');
    for (let y = cy - 1; y <= cy + 1; y++) put(4, y, 'G');
    cv.forEach((c, t) => { const x = 5 + t, y = cy - c; if (t < cv.length - 2) { put(x, y, 'l'); put(x, y + 1, t < cv.length - 3 ? 'm' : 'w'); } else put(x, y, 'w'); });
    put(7, cy + 1, 'w'); put(8, cy, 'w');
    if (o.rune) put(6, cy, 'u');
  });
  // 마법사 지팡이: 띠를 두른 자루 + 보주 (등급이 오르면 초승달 뿔, 별빛)
  const staffC = o => cellWeapon(25, 11, 5, 5, {
    h: o.wood, H: o.wood2 || wMix(o.wood, '#000000', 0.25), G: o.band || wMix(o.wood, '#000000', 0.4), C: o.band || '#8a6236',
    o: o.orb1, O: o.orb2, W: o.orb3, c: o.crescent || o.band || '#c9a24a', s: o.star || '#ffffff',
  }, put => {
    const cy = 5;
    for (let x = 0; x < 17; x++) put(x, cy, x % 4 === 0 ? 'G' : (o.wood2 && x % 2) ? 'H' : 'h');
    for (let y = cy - 2; y <= cy + 2; y++) put(17, y, 'C');
    const r = o.orbR, ox = 19 + (r > 2 ? 1 : 0);
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 0.6) put(ox + x, cy + y, x + y < -r * 0.6 ? 'W' : x + y < 0.5 ? 'O' : 'o');
    if (o.crescent) { put(18, cy - r - 1, 'c'); put(19, cy - r - 2, 'c'); put(18, cy + r + 1, 'c'); put(19, cy + r + 2, 'c'); }
    if (o.star) { put(ox + r + 2, cy, 's'); put(ox, cy - r - 2, 's'); put(ox, cy + r + 2, 's'); }
  });
  // 사제 메이스: 자루 + 날개(플랜지) 달린 머리
  const maceC = o => cellWeapon(18, 9, 2, 4, {
    G: o.grip, h: '#6b4a2a', m: o.head, l: o.hi, d: o.lo, u: o.gem || o.hi, s: o.spike || o.hi,
  }, put => {
    const cy = 4;
    put(0, cy, 'G'); for (let x = 1; x < 10; x++) put(x, cy, x === 1 || x === 8 ? 'G' : 'h');
    for (let x = 10; x < 15; x++) for (let y = cy - 2; y <= cy + 2; y++) put(x, y, y === cy - 2 ? 'l' : y === cy + 2 ? 'd' : 'm');
    for (let y = cy - 3; y <= cy + 3; y++) { put(11, y, 'l'); put(13, y, 'l'); }
    put(15, cy, 'l');
    if (o.gem) put(12, cy, 'u');
    if (o.spike) { put(12, cy - 4, 's'); put(12, cy + 4, 's'); put(16, cy, 's'); }
  });
  // 거너 머스킷: 넓은 개머리판 + 긴 총신 + 띠
  const musketC = o => cellWeapon(27, 6, 6, 3, {
    s: o.stock, S: o.stock2, b: o.barrel, B: o.band, k: '#3a3a40', u: o.rune || o.band,
  }, put => {
    const cy = 3, L = o.len;
    for (let x = 0; x < 6; x++) { put(x, cy - 1, 's'); put(x, cy, 's'); put(x, cy + 1, 'S'); }
    for (let x = 6; x < 11; x++) put(x, cy, 's');
    for (let x = 7; x < L; x++) put(x, cy - 1, 'b');
    for (const x of o.bands) put(x, cy - 1, 'B'); put(L - 1, cy - 2, 'B');
    put(8, cy + 1, 'k'); put(7, cy - 2, 'k');
    if (o.rune) for (let x = 1; x < 5; x++) put(x, cy, 'u');
  });
  WEAP.knight = [
    swordC({ handle: '#4a2f1d', gold: '#6a6a70', mid: '#9aa0a8', edge: '#d0d4da', dark: '#5a6068', rust: '#6e4a2a', gem: '#5a6068' }),
    swordC({ handle: '#2a3448', gold: '#c0c8d8', mid: '#a8b8d0', edge: '#f0f8ff', dark: '#5a6a88', rune: '#4f8dff', gem: '#4f8dff' }),
    swordC({ handle: '#2a1a2a', gold: '#c9a24a', mid: '#4a3e5a', edge: '#d8b8ff', dark: '#241a30', rune: '#b05cff', gem: '#b05cff' }),
    swordC({ handle: '#5a1a10', gold: '#ffe08a', mid: '#e8d090', edge: '#fffbe6', dark: '#a07820', rune: '#ff6a2a', gem: '#ff3020', spikes: true }),
  ];
  WEAP.ranger = [
    daggerC({ handle: '#3b2416', gold: '#6a6a70', mid: '#9aa0a8', edge: '#d8dce4' }),
    daggerC({ handle: '#2a3448', gold: '#c0c8d8', mid: '#b8c8e0', edge: '#ffffff', rune: '#4f8dff' }),
    daggerC({ handle: '#2a1a2a', gold: '#c9a24a', mid: '#5a3e6a', edge: '#e8c8ff', rune: '#b05cff' }),
    daggerC({ handle: '#3a0e10', gold: '#a3222a', mid: '#e8e0d0', edge: '#ffffff', rune: '#ff3040' }),
  ];
  WEAP.mage = [
    staffC({ wood: '#6b4a2a', orbR: 2, orb1: '#2a4a7a', orb2: '#5a8ac0', orb3: '#c0e0ff' }),
    staffC({ wood: '#6b4a2a', band: '#c0c8d8', orbR: 2, orb1: '#1a3a8a', orb2: '#4a80ff', orb3: '#e0f0ff' }),
    staffC({ wood: '#3a2430', wood2: '#5a3a4a', band: '#c9a24a', crescent: '#c9a24a', orbR: 2, orb1: '#5a2a8a', orb2: '#b070ff', orb3: '#f0d8ff' }),
    staffC({ wood: '#c9a24a', wood2: '#ffe08a', band: '#fff0b0', crescent: '#ffe08a', star: '#ffd080', orbR: 3, orb1: '#a0300e', orb2: '#ff9a3a', orb3: '#fff0b0' }),
  ];
  WEAP.priest = [
    maceC({ head: '#6a6e78', hi: '#a8acb4', lo: '#3a3e44', grip: '#6a6a70' }),
    maceC({ head: '#8d9097', hi: '#e6e8ec', lo: '#4d4f55', grip: '#c0c8d8', gem: '#4f8dff' }),
    maceC({ head: '#4a3e5a', hi: '#c8a8f0', lo: '#241a30', grip: '#c9a24a', gem: '#b05cff', spike: '#c8a8f0' }),
    maceC({ head: '#ffd34d', hi: '#fffbe6', lo: '#c9952a', grip: '#fff0b0', gem: '#ff6a2a', spike: '#fff4c0' }),
  ];
  WEAP.gunner = [
    musketC({ len: 24, stock: '#6b4a2a', stock2: '#4a3020', barrel: '#8d9097', band: '#6a6a70', bands: [10, 16] }),
    musketC({ len: 25, stock: '#7a5232', stock2: '#4a3020', barrel: '#a8acb4', band: '#c9a24a', bands: [10, 16, 21] }),
    musketC({ len: 26, stock: '#2a1a2a', stock2: '#1a1018', barrel: '#5a5a68', band: '#c0c8d8', bands: [10, 16, 22], rune: '#b05cff' }),
    musketC({ len: 27, stock: '#1a1418', stock2: '#0e0a0c', barrel: '#3a3e3a', band: '#d8d0b8', bands: [10, 17, 23], rune: '#7aff9a' }),
  ];
  BLADES.great = swordC({ handle: '#4a2f1d', gold: '#c9a24a', mid: '#b9bfca', edge: '#f4f6fa', dark: '#6b7280' });
  BLADES.holy = swordC({ handle: '#8a6a20', gold: '#fff0b0', mid: '#ffd34d', edge: '#fffbe6', dark: '#c9952a', gem: '#ffffff', spikes: true });
  BLADES.dagger = daggerC({ handle: '#3b2416', gold: '#8a8a8a', mid: '#c8ccd4', edge: '#ffffff' });
  BLADES.daggerG = daggerC({ handle: '#1f4a34', gold: '#9ff0c8', mid: '#8ff0c0', edge: '#ffffff' });
  TOOLS.staff = WEAP.mage[2];
  TOOLS.mace = WEAP.priest[1];
  TOOLS.maceH = maceC({ head: '#ffd34d', hi: '#fffbe6', lo: '#c9952a', grip: '#fff0b0', gem: '#ffffff' });
  TOOLS.musket = WEAP.gunner[1];
  // ---- v0.99 레어 이상 무기는 모양 자체가 다르다 (색·등급 연출은 그대로). 판정 범위는 SWING 수치라 그림과 무관
  {
    // 칼날 기둥 목록으로 그리기: cols[i] = [위 y, 아래 y], 위 칸은 밝게, 아래 칸은 어둡게, 마지막 칸은 날 끝
    const bladeCols = (put, x0, cols, o = {}) => cols.forEach(([t, b], i) => {
      const x = x0 + i, last = i === cols.length - 1;
      for (let y = t; y <= b; y++) put(x, y, last ? 'w' : y === t ? (o.topW && i % 2 ? 'w' : 'l') : y === b && b > t ? (o.botW ? 'w' : 'd') : (o.core && y === Math.round((t + b) / 2) && b - t >= 3 ? 'D' : 'm'));
    });
    const swordPal = (o, extra) => Object.assign({
      G: o.gold, g: wMix(o.gold, '#ffffff', 0.45), r: o.gem || '#a3222a', h: o.handle, H: wMix(o.handle, '#c0a080', 0.35),
      m: o.mid, l: wMix(o.mid, o.edge, 0.55), w: o.edge, d: o.dark, D: wMix(o.mid, o.dark, 0.5), u: o.rune || o.dark,
    }, extra || {});
    // 기사 레어 — 츠바이한더: 긴 손잡이, 곧은 큰 가드, 리카소와 걸쇠, 가운데 홈에 푸른 룬
    const zwei = o => cellWeapon(37, 13, 3, 6, swordPal(o), put => {
      const cy = 6; put(0, cy, 'G'); put(1, cy, 'G'); put(0, cy - 1, 'g'); put(0, cy + 1, 'G');
      for (let x = 2; x < 7; x++) put(x, cy, x % 2 ? 'h' : 'H');
      for (let y = 1; y <= 11; y++) put(7, y, y === 1 || y === 11 ? 'g' : 'G'); put(8, 1, 'G'); put(8, 11, 'G'); put(7, cy, 'r');
      for (let x = 8; x < 12; x++) { put(x, cy - 1, 'l'); put(x, cy, 'm'); put(x, cy + 1, 'd'); }
      put(11, cy - 2, 'G'); put(11, cy + 2, 'G'); put(12, cy - 3, 'g'); put(12, cy + 3, 'G');
      const L = 24; for (let t = 0; t < L; t++) { const x = 12 + t, hw = t < L - 5 ? 2 : t < L - 2 ? 1 : 0;
        for (let y = cy - hw; y <= cy + hw; y++) put(x, y, y === cy - hw ? 'l' : y === cy + hw && hw ? 'd' : 'm');
        if (hw === 2 && t > 1 && t < L - 6) put(x, cy, t % 3 === 0 ? 'u' : 'D'); if (t >= 6 && t < L - 1 && hw) put(x, cy - hw, 'w'); }
      put(12 + L - 1, cy, 'w');
    });
    // 기사 유니크 — 플랑베르주: 물결치는 날, 날 쪽으로 휜 가드
    const flamb = o => cellWeapon(37, 13, 3, 6, swordPal(o), put => {
      const cy = 6; put(0, cy, 'G'); put(1, cy, 'g'); put(0, cy - 1, 'G'); put(0, cy + 1, 'G');
      for (let x = 2; x < 6; x++) put(x, cy, x % 2 ? 'h' : 'H');
      for (let y = 3; y <= 9; y++) put(6, y, 'G'); put(7, 2, 'G'); put(8, 1, 'g'); put(9, 0, 'g'); put(7, 10, 'G'); put(8, 11, 'g'); put(9, 12, 'g'); put(6, cy, 'r'); put(7, cy, 'G');
      const L = 26; for (let t = 0; t < L; t++) { const x = 8 + t, wv = [0, 0, 1, 1, 1, 0][t % 6] * (t > 1 ? 1 : 0), hw = t < L - 4 ? 2 : t < L - 2 ? 1 : 0, top = cy - hw - (hw ? wv : 0), bot = cy + hw - (hw ? wv : 0);
        for (let y = top; y <= bot; y++) put(x, y, y === top ? 'w' : y === top + 1 ? 'l' : y === bot && hw ? 'd' : 'm');
        if (hw === 2) put(x, cy - wv, t % 6 === 3 && t < L - 6 ? 'u' : 'D'); }
      put(8 + L - 1, cy, 'w');
    });
    // 기사 레전더리 — 용살의 대검: 두꺼운 쇳덩이 날, 사선으로 잘린 끝, 등의 홈, 가시 달린 금빛 가드와 불꽃 룬
    const slayer = o => cellWeapon(37, 15, 3, 7, swordPal(o, { x: '#3a2a10' }), put => {
      const cy = 7; put(0, cy, 'G'); put(1, cy, 'G'); put(0, cy - 1, 'g'); put(0, cy + 1, 'G'); put(1, cy - 1, 'G'); put(1, cy + 1, 'G');
      for (let x = 2; x < 6; x++) put(x, cy, x % 2 ? 'h' : 'H');
      for (let y = 1; y <= 13; y++) put(6, y, 'G'); for (let y = 2; y <= 12; y++) put(7, y, y % 3 ? 'G' : 'g'); put(5, 0, 'g'); put(5, 14, 'g'); put(6, 0, 'G'); put(6, 14, 'G'); put(7, cy, 'r'); put(6, cy, 'r');
      const L = 26; for (let t = 0; t < L; t++) { const x = 8 + t, cut = t >= L - 4 ? t - (L - 4) : -1, top = cy - 3 + (cut >= 0 ? cut * 2 : 0), bot = cy + 3;
        if (top > bot) continue;
        for (let y = top; y <= bot; y++) put(x, y, y === top ? 'l' : y === bot ? 'w' : y === bot - 1 ? 'm' : y === cy - 2 && cut < 0 ? 'l' : 'm');
        if ((t === 5 || t === 12) && cut < 0) { put(x, top, 'x'); put(x + 1, top, 'x'); }
        if (cut < 0 && t > 1 && t < L - 5) put(x, cy, t % 3 === 1 ? 'u' : 'D'); if (cut >= 0) put(x, top, 'w'); }
    });
    // 단검 공통 팔레트
    const dagPal = (o, extra) => Object.assign({ G: o.gold, g: wMix(o.gold, '#ffffff', 0.4), h: o.handle, H: wMix(o.handle, '#c0a080', 0.35), m: o.mid, l: wMix(o.mid, o.edge, 0.55), w: o.edge, d: wMix(o.mid, '#000000', 0.35), D: wMix(o.mid, '#000000', 0.2), u: o.rune || o.edge }, extra || {});
    // 어세신 레어 — 쿠크리: 아래로 꺾였다 휘어 오르는 넓은 배
    const kukri = o => cellWeapon(17, 9, 2, 5, dagPal(o), put => {
      const cy = 5; put(0, cy, 'G'); put(1, cy, 'h'); put(2, cy, 'H'); put(3, cy, 'h'); for (let y = cy - 1; y <= cy + 1; y++) put(4, y, 'G');
      bladeCols(put, 5, [[4, 5], [4, 6], [4, 7], [3, 7], [3, 7], [2, 6], [2, 6], [1, 5], [1, 4], [0, 3], [0, 1]], { botW: true });
      put(6, 5, 'u');
    });
    // 어세신 유니크 — 톱날 단검: 등에 톱니, 손등을 감싸는 손잡이 고리
    const serr = o => cellWeapon(18, 10, 3, 5, dagPal(o), put => {
      const cy = 5; put(0, cy + 1, 'G'); put(0, cy + 2, 'G'); put(1, cy + 3, 'G'); put(2, cy + 3, 'G'); put(3, cy + 3, 'g'); put(4, cy + 2, 'G');
      put(1, cy, 'G'); put(2, cy, 'h'); put(3, cy, 'H'); put(4, cy, 'h'); for (let y = cy - 2; y <= cy + 1; y++) put(5, y, 'G'); put(5, cy, 'g');
      bladeCols(put, 6, [[4, 6], [4, 6], [3, 6], [3, 6], [3, 5], [2, 5], [2, 5], [1, 4], [1, 3], [1, 2], [0, 1], [0, 0]], { botW: true });
      for (const x of [7, 9, 11, 13]) put(x, [3, 2, 1, 0][(x - 7) / 2], 'd'); put(8, 5, 'u'); put(10, 4, 'u');
    });
    // 어세신 레전더리 — 핏빛 엄니: 짐승 송곳니처럼 길게 휜 뼈 날, 뒤쪽 갈고리, 핏물 홈
    const fang = o => cellWeapon(21, 12, 3, 7, dagPal(o, { b: '#c8bea8' }), put => {
      const cy = 7; put(0, cy, 'G'); put(1, cy, 'b'); put(2, cy, 'H'); put(3, cy, 'b'); put(4, cy, 'H');
      for (let y = cy - 2; y <= cy + 2; y++) put(5, y, 'G'); put(4, cy - 2, 'g'); put(4, cy + 2, 'G'); put(3, cy + 3, 'G'); put(2, cy + 4, 'g');
      bladeCols(put, 6, [[6, 8], [5, 8], [5, 8], [4, 8], [4, 7], [3, 7], [3, 6], [2, 6], [2, 5], [1, 4], [1, 3], [0, 2], [0, 1], [0, 0]], { botW: true });
      for (let x = 7; x < 15; x++) put(x, [7, 7, 6, 6, 5, 5, 4, 4][x - 7], 'u');
      put(6, 9, 'm'); put(7, 10, 'l'); put(8, 11, 'w');
    });
    // 지팡이 팔레트
    const stfPal = o => ({ h: o.wood, H: o.wood2 || wMix(o.wood, '#000000', 0.25), G: o.band || wMix(o.wood, '#000000', 0.4), C: o.band || '#8a6236', c: o.crescent || o.band || '#c9a24a', o: o.orb1, O: o.orb2, W: o.orb3, s: o.star || '#ffffff' });
    const orb = (put, ox, cy, r) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + 0.6) put(ox + x, cy + y, x + y < -r * 0.6 ? 'W' : x + y < 0.5 ? 'O' : 'o'); };
    // 마법사 레어 — 집게발 지팡이: 쇠 집게 세 가닥이 보주를 붙잡음
    const claw = o => cellWeapon(28, 13, 5, 6, stfPal(o), put => {
      const cy = 6; for (let x = 0; x < 18; x++) put(x, cy, x % 5 === 0 ? 'G' : x % 2 ? 'H' : 'h'); put(0, cy - 1, 'G'); put(0, cy + 1, 'G');
      for (let y = cy - 1; y <= cy + 1; y++) put(18, y, 'C'); orb(put, 22, cy, 2);
      for (const s of [-1, 1]) { put(19, cy + s * 2, 'C'); put(20, cy + s * 3, 'C'); put(21, cy + s * 4, 'C'); put(22, cy + s * 4, 'C'); put(23, cy + s * 3, 'c'); put(24, cy + s * 2, 'c'); }
      put(25, cy, 'C'); put(26, cy, 'c');
    });
    // 마법사 유니크 — 초승달 지팡이: 비틀린 나무 자루, 커다란 초승달이 보주를 감쌈
    const moon = o => cellWeapon(30, 15, 5, 7, stfPal(o), put => {
      const cy = 7; for (let x = 0; x < 18; x++) put(x, cy, x % 4 === 0 ? 'G' : x % 2 ? 'h' : 'H'); for (const x of [4, 10]) { put(x, cy - 1, 'H'); put(x + 1, cy + 1, 'H'); }
      for (let y = cy - 1; y <= cy + 1; y++) put(18, y, 'C'); orb(put, 23, cy, 2);
      for (let a = 95; a <= 265; a += 7) { const t = a * DEG; for (const r of [5, 6]) put(Math.round(23 + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), r === 5 ? 'c' : 'G'); }
      put(24, cy - 6, 'c'); put(25, cy - 6, 's'); put(24, cy + 6, 'c'); put(25, cy + 6, 's'); put(26, cy - 3, 's'); put(26, cy + 3, 's');
    });
    // 마법사 레전더리 — 태양의 지팡이: 금 나선 자루, 후광 고리와 별빛 네 갈래, 날개 장식
    const sunst = o => cellWeapon(34, 17, 5, 8, stfPal(o), put => {
      const cy = 8; for (let x = 0; x < 20; x++) put(x, cy, x % 4 === 0 ? 'C' : x % 4 === 1 ? 'G' : x % 2 ? 'H' : 'h');
      put(16, cy - 2, 'c'); put(17, cy - 3, 'c'); put(16, cy + 2, 'c'); put(17, cy + 3, 'c'); put(15, cy - 1, 'G'); put(15, cy + 1, 'G');
      for (let y = cy - 2; y <= cy + 2; y++) put(20, y, 'C'); orb(put, 26, cy, 3);
      for (let a = 0; a < 360; a += 10) { const t = a * DEG; put(Math.round(26 + Math.cos(t) * 5.5), Math.round(cy + Math.sin(t) * 5.5), a % 40 === 0 ? 's' : 'c'); }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 7; k <= 8; k++) put(26 + dx * k, cy + dy * k, k === 8 ? 's' : 'c');
    });
    // 메이스 팔레트
    const macePal = (o, extra) => Object.assign({ G: o.grip, h: '#6b4a2a', H: '#4a3020', m: o.head, l: o.hi, d: o.lo, u: o.gem || o.hi, s: o.spike || o.hi }, extra || {});
    // 사제 레어 — 전쟁 망치: 긴 자루, 납작한 망치 머리와 반대편 곡괭이 날
    const hammer = o => cellWeapon(20, 15, 2, 6, macePal(o), put => {
      const cy = 6; put(0, cy, 'G'); for (let x = 1; x < 13; x++) put(x, cy, x === 1 || x === 10 ? 'G' : x % 2 ? 'h' : 'H');
      for (let x = 11; x < 17; x++) for (let y = cy - 2; y <= cy + 5; y++) put(x, y, x === 11 || y === cy - 2 ? 'l' : x === 16 || y === cy + 5 ? 'd' : 'm');
      for (let x = 11; x < 17; x++) put(x, cy + 6, x % 2 ? 'd' : 'm'); put(13, cy + 1, 'u'); put(14, cy + 1, 'u'); put(13, cy + 2, 'u'); put(14, cy + 2, 'u');
      for (let k = 0; k < 4; k++) { put(13, cy - 3 - k, k < 2 ? 'm' : 'l'); if (k < 2) put(14, cy - 3 - k, 'd'); } put(13, cy - 7, 's'); put(17, cy + 1, 'l'); put(18, cy + 1, 's');
    });
    // 사제 유니크 — 모닝스타: 둥근 쇠공에 사방으로 가시
    const mstar = o => cellWeapon(21, 13, 2, 6, macePal(o), put => {
      const cy = 6; put(0, cy, 'G'); for (let x = 1; x < 11; x++) put(x, cy, x === 1 || x === 9 ? 'G' : x % 2 ? 'h' : 'H');
      const ox = 14; for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 10) put(ox + x, cy + y, x + y < -2 ? 'l' : x + y > 2 ? 'd' : 'm');
      put(ox, cy, 'u'); put(ox - 1, cy - 1, 'l');
      for (let a = 0; a < 360; a += 45) { const t = a * DEG; for (const r of [4, 5]) put(Math.round(ox + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), r === 5 ? 's' : 'm'); }
    });
    // 사제 레전더리 — 태양 망치: 금빛 큰 망치 머리, 뒤로 퍼지는 해 원반, 보석
    const sunham = o => cellWeapon(24, 17, 2, 8, macePal(o, { r: '#ffffff' }), put => {
      const cy = 8; put(0, cy, 'G'); put(0, cy - 1, 'G'); put(0, cy + 1, 'G'); for (let x = 1; x < 13; x++) put(x, cy, x % 3 === 0 ? 'G' : x % 2 ? 'h' : 'H');
      const ox = 16; for (let a = 0; a < 360; a += 15) { const t = a * DEG, r = a % 30 ? 6 : 7; for (let k = 5; k <= r; k++) put(Math.round(ox + Math.cos(t) * k), Math.round(cy + Math.sin(t) * k), k === r ? 's' : 'l'); }
      for (let x = 13; x < 20; x++) for (let y = cy - 3; y <= cy + 3; y++) put(x, y, x === 13 || y === cy - 3 ? 'l' : x === 19 || y === cy + 3 ? 'd' : 'm');
      for (let y = cy - 4; y <= cy + 4; y++) { put(14, y, 'l'); put(18, y, 'd'); }
      put(16, cy, 'u'); put(15, cy, 'u'); put(16, cy - 1, 'r');
    });
    // 머스킷 팔레트
    const gunPal = (o, extra) => Object.assign({ s: o.stock, S: o.stock2, b: o.barrel, d: wMix(o.barrel, '#000000', 0.35), l: wMix(o.barrel, '#ffffff', 0.35), B: o.band, k: '#3a3a40', u: o.rune || o.band, w: '#e8ecf0', W: '#a8b0b8' }, extra || {});
    // 거너 레어 — 총검 머스킷
    const bayo = o => cellWeapon(34, 7, 6, 3, gunPal(o), put => {
      const cy = 3, L = 26;
      for (let x = 0; x < 6; x++) { put(x, cy - 1, 's'); put(x, cy, 's'); put(x, cy + 1, 'S'); } put(0, cy + 2, 'S'); put(1, cy + 2, 'S');
      for (let x = 6; x < 13; x++) put(x, cy, 's'); for (let x = 7; x < L; x++) put(x, cy - 1, x % 9 === 0 ? 'l' : 'b');
      for (const x of o.bands) put(x, cy - 1, 'B'); put(8, cy + 1, 'k'); put(7, cy - 2, 'k');
      put(L - 1, cy, 'B'); put(L, cy, 'W'); for (let x = L + 1; x < L + 7; x++) put(x, cy, x === L + 6 ? 'w' : 'W'); for (let x = L + 1; x < L + 5; x++) put(x, cy + 1, 'w');
    });
    // 거너 유니크 — 나팔총: 짧고 굵은 총신이 나팔처럼 벌어짐, 장식 개머리판
    const blund = o => cellWeapon(29, 9, 6, 4, gunPal(o), put => {
      const cy = 4;
      for (let x = 0; x < 6; x++) { put(x, cy - 1, 's'); put(x, cy, x % 2 ? 'u' : 's'); put(x, cy + 1, 'S'); } put(0, cy + 2, 'S'); put(0, cy - 2, 'S');
      for (let x = 6; x < 12; x++) put(x, cy, 's'); put(8, cy + 1, 'k'); put(7, cy - 3, 'k');
      for (let x = 7; x < 22; x++) { put(x, cy - 2, 'l'); put(x, cy - 1, x % 5 === 0 ? 'B' : 'b'); }
      for (let x = 22; x < 27; x++) { const f = x - 21; for (let y = cy - 2 - Math.floor(f / 2); y <= cy - 1 + Math.floor(f / 2); y++) put(x, y, y === cy - 2 - Math.floor(f / 2) ? 'l' : x === 26 ? 'd' : 'b'); }
      put(26, cy - 2, 'k'); put(26, cy - 1, 'k'); for (const x of [10, 16]) put(x, cy - 2, 'B');
    });
    // 거너 레전더리 — 쌍열 장총: 위아래 두 총신, 놋쇠 망원 조준경, 룬 새긴 개머리판
    const rifle = o => cellWeapon(36, 9, 6, 5, gunPal(o), put => {
      const cy = 5, L = 32;
      for (let x = 0; x < 6; x++) { put(x, cy - 1, 's'); put(x, cy, 's'); put(x, cy + 1, 'S'); } put(0, cy + 2, 'S'); put(1, cy + 2, 'S'); put(0, cy - 2, 'S');
      for (let x = 1; x < 5; x++) put(x, cy, 'u');
      for (let x = 6; x < 14; x++) put(x, cy, 's'); put(8, cy + 1, 'k');
      for (let x = 7; x < L; x++) { put(x, cy - 1, 'b'); put(x, cy - 2, x < L - 1 ? 'l' : 'b'); } for (const x of o.bands) { put(x, cy - 1, 'B'); put(x, cy - 2, 'B'); }
      for (let x = 11; x < 21; x++) put(x, cy - 4, x === 11 || x === 20 ? 'k' : 'B'); put(12, cy - 3, 'k'); put(19, cy - 3, 'k'); put(20, cy - 4, 'u');
      put(L, cy - 1, 'k'); put(L, cy - 2, 'k'); put(L - 2, cy - 3, 'B');
    });
    const K = WEAP.knight, R = WEAP.ranger, M = WEAP.mage, Pr = WEAP.priest, Gn = WEAP.gunner;
    K[1] = zwei({ handle: '#2a3448', gold: '#c0c8d8', mid: '#a8b8d0', edge: '#f0f8ff', dark: '#5a6a88', rune: '#4f8dff', gem: '#4f8dff' });
    K[2] = flamb({ handle: '#2a1a2a', gold: '#c9a24a', mid: '#4a3e5a', edge: '#d8b8ff', dark: '#241a30', rune: '#b05cff', gem: '#b05cff' });
    K[3] = slayer({ handle: '#5a1a10', gold: '#e8a830', mid: '#d09a38', edge: '#ffe49a', dark: '#6a3e10', rune: '#ff6a2a', gem: '#ff3020' });
    R[1] = kukri({ handle: '#2a3448', gold: '#c0c8d8', mid: '#b8c8e0', edge: '#ffffff', rune: '#4f8dff' });
    R[2] = serr({ handle: '#2a1a2a', gold: '#c9a24a', mid: '#5a3e6a', edge: '#e8c8ff', rune: '#b05cff' });
    R[3] = fang({ handle: '#3a0e10', gold: '#5a1018', mid: '#a82434', edge: '#ff7080', rune: '#ffc890' }); // v1.09 흰 날 → 핏빛 날
    M[1] = claw({ wood: '#6b4a2a', band: '#c0c8d8', orb1: '#1a3a8a', orb2: '#4a80ff', orb3: '#e0f0ff' });
    M[2] = moon({ wood: '#3a2430', wood2: '#5a3a4a', band: '#c9a24a', crescent: '#e0c070', orb1: '#5a2a8a', orb2: '#b070ff', orb3: '#f0d8ff', star: '#f0d8ff' });
    M[3] = sunst({ wood: '#a8782a', wood2: '#e0b050', band: '#e8b040', crescent: '#f0c050', star: '#fff0b0', orb1: '#a0300e', orb2: '#ff9a3a', orb3: '#fff0b0' });
    Pr[1] = hammer({ head: '#8d9097', hi: '#e6e8ec', lo: '#4d4f55', grip: '#c0c8d8', gem: '#4f8dff' });
    Pr[2] = mstar({ head: '#4a3e5a', hi: '#c8a8f0', lo: '#241a30', grip: '#c9a24a', gem: '#b05cff', spike: '#e0c8ff' });
    Pr[3] = sunham({ head: '#e8a828', hi: '#ffe08a', lo: '#8a5418', grip: '#c9952a', gem: '#ff5a1a', spike: '#ffc040' });
    Gn[1] = bayo({ stock: '#7a5232', stock2: '#4a3020', barrel: '#a8acb4', band: '#c9a24a', bands: [10, 16, 22] });
    Gn[2] = blund({ stock: '#2a1a2a', stock2: '#1a1018', barrel: '#5a5a68', band: '#c9a24a', rune: '#b05cff' });
    Gn[3] = rifle({ stock: '#1a1418', stock2: '#0e0a0c', barrel: '#3a3e3a', band: '#a89868', bands: [10, 17, 24, 29], rune: '#7aff9a' });
  }
  const TIER_FX = [null, { c: '120,170,255', p: ['#9fc8ff', '#ffffff'] }, { c: '190,110,255', p: ['#c890ff', '#f0d8ff'] }];
  const LEGEND_FX_COL = { knight: { c: '255,180,60', p: ['#ffc040', '#ff9a2e'] }, ranger: { c: '255,60,70', p: ['#ff4050', '#c02030'] }, mage: { c: '255,140,50', p: ['#ffb060', '#ff7a2a'] }, priest: { c: '255,190,80', p: ['#ffc040', '#ff9a2e'] }, gunner: { c: '110,255,150', p: ['#7aff9a', '#30c060'] } }; // v1.09 흰 불티 빼고 직업색으로
  let tierCache = { key: null, t: 0 };
  function weaponTier(cls) {
    cls = cls || (G ? G.cls : CUR);
    const id = (SAVE.equipBy[cls] || {}).weapon, key = cls + ':' + id + ':' + SAVE.inv.length;
    if (tierCache.key === key) return tierCache.t;
    const it = id != null ? SAVE.inv.find(i => i.id === id) : null;
    tierCache = { key, t: it ? TIER_OF[it.grade] : 0 };
    return tierCache.t;
  }
  const weaponTex = cls => WEAP[cls][weaponTier(cls)];
  function tierFx(cls) { const t = weaponTier(cls); return t === 3 ? LEGEND_FX_COL[cls] : TIER_FX[t]; }
  // 무기 위에 등급 연출: 레어 — 칼날을 훑는 반짝임 / 유니크 — 보랏빛 맥동과 불티 / 레전더리 — 직업색 광채와 불꽃
  function weaponAura(tex, x, y, ang, cls, scale = 1) {
    const t = weaponTier(cls); if (!t || !G) return;
    const fx = tierFx(cls), ux = Math.cos(ang), uy = Math.sin(ang), reach = tex.reach * scale;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (t >= 2) { ctx.globalAlpha = (t === 3 ? 0.12 : 0.16) + Math.sin(time * (t === 3 ? 7 : 4)) * (t === 3 ? 0.05 : 0.08); drawBlade(tex, x, y, ang, 1, false, scale, 'lighter'); ctx.globalAlpha = 1; } // v1.09: 레전더리 덧칠 0.3 → 0.12 (하얗게 날아가던 문제)
    const ph = (time % 1.6) / 0.35;
    if (ph < 1) { const k = 0.2 + ph * 0.8, gx = x + ux * reach * k, gy = y + uy * reach * k; ctx.fillStyle = `rgba(255,255,255,${1 - ph * 0.5})`; ctx.fillRect(Math.round(gx) - 1, Math.round(gy) - 1, 2, 2); ctx.fillStyle = `rgba(${fx.c},.7)`; ctx.fillRect(Math.round(gx) - 2, Math.round(gy), 4, 1); ctx.fillRect(Math.round(gx), Math.round(gy) - 2, 1, 4); }
    ctx.restore();
    if (t >= 2 && Math.random() < (t === 3 ? 0.3 : 0.18)) { const k = rand(0.3, 1); G.parts.push({ x: x + ux * reach * k + rand(-2, 2), y: y + uy * reach * k + rand(-2, 2), vx: rand(-8, 8), vy: rand(-30, -10), t: rand(0.3, 0.6), c: pick(fx.p), g: 0, glow: true }); }
  }
  function drawBlade(b, x, y, ang, alpha = 1, white, scale = 1, comp) {
    if (b.cells) { // v1.05: 배율도 칸 단위, 칸 경계를 2px 격자에 맞춤
      const r = rotW(b, ang, scale);
      ctx.save(); ctx.globalAlpha = alpha; if (comp) ctx.globalCompositeOperation = comp; if (white) ctx.filter = 'brightness(3)';
      ctx.drawImage(r.c, snap2(x) - r.o + 1, snap2(y) - r.o + 1); ctx.restore(); return; // r.o는 홀수 → 캔버스 원점이 짝수 좌표
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    if (comp) ctx.globalCompositeOperation = comp;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(ang);
    ctx.scale(scale, Math.cos(ang) < 0 ? -scale : scale);
    if (white) ctx.filter = 'brightness(3)';
    ctx.drawImage(b.c, -b.pivotX, -b.pivotY);
    ctx.restore();
  }

  // 3x5 도트 숫자
  const DIGITS = {
    '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001',
    '5': '111100111001111', '6': '111100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001111', '!': '010010010000010', '+': '000010111010000',
    'H': '101101111101101', 'I': '111010010010111', 'T': '111010010010010',
  };
  const NUMC = new Map(); // v1.17 숫자 그림을 문자열·색·크기마다 한 장으로
  function drawNumber(str, x, y, color, s) {
    if (OPT) { str = String(str); const key = str + '|' + color + '|' + s; let c = NUMC.get(key);
      if (!c) { const w0 = str.length * 4 * s - s, [cv2, g] = mkCanvas(w0 + 2, 5 * s + 2); let cx0 = 0; for (const ch of str) { const d = DIGITS[ch]; if (d) for (let i = 0; i < 15; i++) if (d[i] === '1') { const px = cx0 + (i % 3) * s, py = Math.floor(i / 3) * s; g.fillStyle = '#000'; g.fillRect(px + 1, py + 1, s, s); g.fillStyle = color; g.fillRect(px, py, s, s); } cx0 += 4 * s; } c = cv2; if (NUMC.size > 300) NUMC.clear(); NUMC.set(key, c); }
      ctx.drawImage(c, Math.round(x - (str.length * 4 * s - s) / 2), Math.round(y)); return; }
    const w = str.length * 4 * s - s;
    let cx = Math.round(x - w / 2);
    for (const ch of str) {
      const d = DIGITS[ch]; if (!d) { cx += 4 * s; continue; }
      for (let i = 0; i < 15; i++) if (d[i] === '1') {
        const px = cx + (i % 3) * s, py = Math.round(y) + Math.floor(i / 3) * s;
        ctx.fillStyle = '#000'; ctx.fillRect(px + 1, py + 1, s, s);
        ctx.fillStyle = color; ctx.fillRect(px, py, s, s);
      }
      cx += 4 * s;
    }
  }

  // ---------------------------------------------------------------- 배경: 무너진 성채의 의식장
  let PILLARS = [170, 327, 484, 641, 798, 955, 1110];
  const [floor, fg] = mkCanvas(W, H);
  function paintCastle(g) {
    g.fillStyle = '#09080c'; g.fillRect(0, 0, W, H);
    // 석판
    let row = 0;
    for (let y = A.y0 - 6; y < A.y1 + 10; y += 14, row++) {
      const off = (row % 2) * 12;
      for (let x = A.x0 - 30 - off; x < A.x1 + 24; x += 24) {
        const v = randi(-5, 5), b = 31 + v;
        g.fillStyle = `rgb(${b + 1},${b - 1},${b + 5})`; g.fillRect(x + 1, y + 1, 23, 13);
        g.fillStyle = `rgb(${b + 10},${b + 8},${b + 14})`; g.fillRect(x + 1, y + 1, 23, 1); g.fillRect(x + 1, y + 1, 1, 13);
        g.fillStyle = `rgb(${b - 9},${b - 10},${b - 6})`; g.fillRect(x + 1, y + 13, 23, 1);
        if (Math.random() < 0.25) { // 금
          g.fillStyle = `rgb(${b - 14},${b - 15},${b - 11})`;
          let cx = x + randi(4, 18), cy = y + randi(3, 10);
          for (let i = 0; i < randi(3, 6); i++) { g.fillRect(cx, cy, 1, 1); cx += randi(-1, 1); cy += randi(0, 1) || 1; }
        }
        if (Math.random() < 0.08) { g.fillStyle = 'rgba(70,95,50,.5)'; g.fillRect(x + randi(2, 16), y + randi(2, 9), randi(2, 5), randi(1, 2)); }
        if (Math.random() < 0.07) { g.fillStyle = 'rgba(95,12,18,.5)'; g.fillRect(x + randi(2, 16), y + randi(2, 9), randi(2, 6), randi(1, 3)); }
      }
    }
    const isForge = !!paintCastle.forge; // v1.02 대장간엔 의식의 원·뼈 잔해 없음
    // 의식의 원
    if (!isForge) {
    g.strokeStyle = 'rgba(120,18,28,.35)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(CX, CY, 92, 62, 0, 0, TAU); g.stroke();
    g.beginPath(); g.ellipse(CX, CY, 82, 55, 0, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(140,22,32,.35)';
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.fillRect(Math.round(CX + Math.cos(a) * 87) - 1, Math.round(CY + Math.sin(a) * 58.5) - 1, 2, 2); }
    }
    // 잔해: 뼈, 해골, 부서진 돌
    for (let i = 0; i < 26; i++) {
      if (isForge) break;
      const x = rand(A.x0 + 10, A.x1 - 10), y = rand(A.y0 + 10, A.y1 - 10);
      if (Math.hypot(x - CX, y - CY) < 100) continue;
      const t = randi(0, 2);
      if (t === 0) { g.fillStyle = '#8f887a'; g.fillRect(x, y, randi(4, 7), 1); g.fillRect(x - 1, y - 1, 2, 3); }
      else if (t === 1) { g.fillStyle = '#9d968a'; g.fillRect(x, y, 4, 3); g.fillStyle = '#0a090c'; g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x + 3, y + 1, 1, 1); }
      else { g.fillStyle = '#2a2731'; g.fillRect(x, y, randi(3, 6), randi(2, 4)); g.fillStyle = '#3a3642'; g.fillRect(x, y, 2, 1); }
    }
    // 위쪽 벽
    g.fillStyle = '#121017'; g.fillRect(0, 0, W, A.y0);
    for (let y = 2; y < A.y0 - 2; y += 8) for (let x = ((y / 8) % 2) * 9 - 9; x < W; x += 18) {
      const v = randi(-4, 4); g.fillStyle = `rgb(${34 + v},${31 + v},${40 + v})`; g.fillRect(x, y, 17, 7);
      g.fillStyle = `rgb(${44 + v},${41 + v},${52 + v})`; g.fillRect(x, y, 17, 1);
    }
    const T0 = A.y0 - 100;
    // 아치 창문 (달빛)
    for (let i = 0; i < PILLARS.length - 1; i++) {
      const mx = (PILLARS[i] + PILLARS[i + 1]) / 2;
      g.fillStyle = '#07060a'; g.fillRect(mx - 9, T0 + 8, 18, 26); g.beginPath(); g.arc(mx, T0 + 8, 9, Math.PI, 0); g.fill();
      const mg = g.createLinearGradient(0, T0, 0, T0 + 34); mg.addColorStop(0, 'rgba(110,100,160,.35)'); mg.addColorStop(1, 'rgba(40,30,70,.1)');
      g.fillStyle = mg; g.fillRect(mx - 7, T0 + 9, 14, 24); g.beginPath(); g.arc(mx, T0 + 9, 7, Math.PI, 0); g.fill();
      g.fillStyle = '#07060a'; g.fillRect(mx - 1, T0 + 2, 2, 32); g.fillRect(mx - 7, T0 + 20, 14, 1);
    }
    // 기둥과 깃발
    PILLARS.forEach((x, i) => {
      g.fillStyle = '#1d1a23'; g.fillRect(x - 9, 0, 18, A.y0 + 4);
      g.fillStyle = '#3a3644'; g.fillRect(x - 9, 0, 3, A.y0 + 4);
      g.fillStyle = '#0c0b10'; g.fillRect(x + 7, 0, 2, A.y0 + 4);
      g.fillStyle = '#2b2733'; g.fillRect(x - 11, A.y0 - 2, 22, 6);
      if (i % 2 === 1) {
        g.fillStyle = '#5c1016'; g.fillRect(x - 6, T0 + 4, 12, 22);
        g.fillStyle = '#7d1820'; g.fillRect(x - 6, T0 + 4, 3, 22);
        for (let k = 0; k < 6; k++) { g.fillStyle = '#5c1016'; g.fillRect(x - 6 + k * 2, T0 + 26, 2, randi(1, 5)); }
        g.fillStyle = '#c9a24a'; g.fillRect(x - 2, T0 + 10, 4, 4); g.fillRect(x - 1, T0 + 14, 2, 4);
      }
    });
    // 측면/아래 벽
    g.fillStyle = '#0d0b11'; g.fillRect(0, A.y1, W, H - A.y1); g.fillRect(0, 0, A.x0, H); g.fillRect(A.x1, 0, W - A.x1, H);
    for (let y = 0; y < H; y += 8) for (let x = ((y / 8) % 2) * 9 - 9; x < W; x += 18) {
      if (x + 17 > A.x0 - 2 && x < A.x1 + 2 && y + 7 > A.y0 - 2 && y < A.y1 + 2) continue;
      if (y < A.y0) continue;
      const v = randi(-4, 4); g.fillStyle = `rgb(${22 + v},${19 + v},${27 + v})`; g.fillRect(x, y, 17, 7);
      g.fillStyle = `rgb(${30 + v},${27 + v},${37 + v})`; g.fillRect(x, y, 17, 1);
    }
    // 바닥 가장자리 돌턱 (2px 도트): 좁은 방에서도 벽 경계가 읽히게
    g.fillStyle = '#0b0a0e'; g.fillRect(A.x0 - 8, A.y0, 2, A.y1 - A.y0 + 8); g.fillRect(A.x1 + 6, A.y0, 2, A.y1 - A.y0 + 8); g.fillRect(A.x0 - 8, A.y1 + 6, A.x1 - A.x0 + 16, 2);
    g.fillStyle = '#2b2733'; g.fillRect(A.x0 - 6, A.y0, 4, A.y1 - A.y0 + 6); g.fillRect(A.x1 + 2, A.y0, 4, A.y1 - A.y0 + 6); g.fillRect(A.x0 - 6, A.y1 + 2, A.x1 - A.x0 + 12, 4);
    g.fillStyle = '#4a4554'; g.fillRect(A.x0 - 2, A.y0, 2, A.y1 - A.y0 + 2); g.fillRect(A.x1, A.y0, 2, A.y1 - A.y0 + 2); g.fillRect(A.x0 - 2, A.y1, A.x1 - A.x0 + 4, 2);
    g.fillStyle = '#1b1820'; for (let y = A.y0 + 8; y < A.y1; y += 12) { g.fillRect(A.x0 - 6, y, 4, 2); g.fillRect(A.x1 + 2, y, 4, 2); } for (let x = A.x0 + 8; x < A.x1; x += 12) g.fillRect(x, A.y1 + 2, 2, 4);
    // 벽 아래 그림자
    const sg = g.createLinearGradient(0, A.y0, 0, A.y0 + 22); sg.addColorStop(0, 'rgba(0,0,0,.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sg; g.fillRect(A.x0, A.y0, A.x1 - A.x0, 22);
  }
  paintCastle(fg);
  let TORCHES = PILLARS.map(x => ({ x, y: 62 }));
  const titleEmbers = [];

  // 안개 텍스처
  const [fog, fogg] = mkCanvas(VW, VH);
  for (let i = 0; i < 46; i++) {
    const x = rand(0, VW), y = rand(0, VH), r = rand(30, 90);
    const gr = fogg.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(120,112,140,.07)'); gr.addColorStop(1, 'rgba(120,112,140,0)');
    fogg.fillStyle = gr; fogg.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // 조명/핏자국 레이어
  const [lightC, lg] = mkCanvas(VW, VH);
  const LIGHTH = (() => { const [c, g] = mkCanvas(VW / 2, VH / 2), [gc, gg] = mkCanvas(VW / 2, VH / 2); return { c, g, gc, gg }; })(); // v1.17 반 해상도 빛 지도·빛 번짐
  const [decal, dg] = mkCanvas(W, H);
  function splat(x, y, n, col = '110,10,16') {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), r = rand(0, 10) * (i / n + 0.3);
      dg.fillStyle = `rgba(${col},${rand(0.25, 0.55)})`;
      dg.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r * 0.6), randi(1, 3), randi(1, 2));
    }
  }

  // ---------------------------------------------------------------- 입력
  const keys = {};
  const pressed = {};
  const mouse = { x: CX, y: CY, active: 0, down: false };
  addEventListener('keydown', e => {
    initAudio();
    const k = e.key.toLowerCase();
    if (!keys[k]) pressed[k] = e.shiftKey ? 'shift' : true; // v1.14 Shift와 같이 눌렸는지 기억 (테스트 키)
    keys[k] = true;
    if ([' ', 'arrowup', 'arrowdown', 'tab'].includes(k)) e.preventDefault();
  });
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  // v1.16 타이틀 음악: 브라우저는 첫 클릭·터치·키 입력 전엔 소리를 못 내게 막음 → 메뉴 버튼이 아니어도 화면 어디든 처음 누르는 순간 타이틀 음악 시작
  for (const t of ['pointerdown', 'touchstart']) addEventListener(t, () => initAudio(), { capture: true, passive: true });
  cv.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) / r.width * VW; mouse.y = (e.clientY - r.top) / r.height * VH; mouse.active = 2.5;
  });
  cv.addEventListener('mousedown', e => { initAudio(); mouse.active = 2.5; if (e.button === 0) { pressed['j'] = true; mouse.down = true; } if (e.button === 2) pressed['k'] = true; });
  cv.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; });
  const take = k => { const v = pressed[k]; pressed[k] = false; return v; };

  // ---------------------------------------------------------------- 직업
  const CLASSES = {
    knight: {
      dmgMul: 1.22, n: '기사', role: '탱커 · 그로기', map: 'knight', pal: 'knight', ghostPal: 'ghost', weapon: '대검과 방패',
      base: { atk: 20, def: 30, hp: 110, crit: 0.10, spd: 88 }, skill: '돌진 참격', skillCd: 8, awaken: '성채의 맹세',
      skillD: '돌진 후 크게 올려베며 푸른 검기를 날린다', awakenD: '금빛 회전베기 2회 → 빛의 거대검 내려찍기, 5초간 받는 피해 -30%',
      atkD: '느리고 묵직한 대검 3타, 3타는 회전베기 · 근접 투지(받는 피해 -15%, 처치 시 HP 회복)',
    },
    ranger: {
      n: '어세신', role: '근접 연타 딜러', map: 'ranger', pal: 'ranger', ghostPal: 'rangerGhost', weapon: '쌍검',
      base: { atk: 18, def: 22, hp: 95, crit: 0.18, spd: 100 }, skill: '그림자 도약', skillCd: 7, awaken: '칼날 폭풍',
      skillD: '조준한 적의 등 뒤로 순간 이동해 X자로 베기, 치명타 확정', awakenD: '3초간 쌍검 회오리를 두르고 이동하며 연속 베기, 받는 피해 -50%',
      atkD: '빠른 쌍검 3타, 3타는 앞으로 파고드는 교차베기 · 근접 투지(받는 피해 -15%, 처치 시 HP 회복)',
    },
    mage: {
      dmgMul: 0.88, n: '마법사', role: '원거리 광역 딜러', map: 'mage', pal: 'mage', ghostPal: 'mageGhost', weapon: '지팡이',
      base: { atk: 24, def: 14, hp: 75, crit: 0.12, spd: 90 }, skill: '화염구', skillCd: 10, awaken: '운석 낙하',
      skillD: '폭발하는 화염구를 날린다. 범위 피해 + 3초 화상', awakenD: '1초 영창 후 커서 위치에 운석이 떨어진다. 초대형 광역 + 화상',
      atkD: '평타는 마력 20 소모, 시간에 따라 회복 · 3발마다 큰 탄', icons: ['bolt', 'fireball', 'meteor'],
    },
    priest: {
      n: '사제', role: '회복 · 버프', map: 'priest', pal: 'priest', ghostPal: 'priestGhost', weapon: '메이스',
      base: { atk: 20, def: 26, hp: 105, crit: 0.08, spd: 90 }, skill: '치유의 빛', skillCd: 12, awaken: '기적',
      skillD: 'HP 25% 회복 + 주변 적을 빛으로 밀쳐낸다', awakenD: 'HP 완전 회복, 3초 무적, 큰 빛기둥. 게이지가 차 있으면 쓰러질 때 자동 발동',
      atkD: '메이스 3타, 3타는 땅을 내리쳐 빛의 충격파 · 근접 투지(받는 피해 -15%, 처치 시 HP 회복)', icons: ['mace', 'heal', 'miracle'],
    },
    gunner: {
      dmgMul: 0.65,
      n: '거너', role: '원거리 단일 폭딜', map: 'gunner', pal: 'gunner', ghostPal: 'gunnerGhost', weapon: '머스킷',
      base: { atk: 28, def: 18, hp: 82, crit: 0.50, spd: 92 }, skill: '산탄 사격', skillCd: 8, awaken: '집중 저격',
      skillD: '근거리 부채꼴 산탄 + 강한 넉백, 즉시 재장전', awakenD: '2초 조준 후 모든 적을 꿰뚫는 대형탄. 보스 그로기 대량 누적',
      atkD: '5발 사격 후 총을 두 바퀴 돌려 재장전 · 가까운 적은 개머리판 타격', icons: ['musket', 'shotgun', 'snipe'],
    },
  };
  // 삭제된 직업(예: 테스트했던 버서커)의 무기·장착 정보가 저장에 남아 있으면 정리한다
  SAVE.inv = SAVE.inv.filter(it => it.slot !== 'weapon' || !it.cls || CLASSES[it.cls]);
  for (const k in SAVE.equipBy) if (!CLASSES[k]) delete SAVE.equipBy[k];
  if (SAVE.lastCls && !CLASSES[SAVE.lastCls]) SAVE.lastCls = 'knight';
  let CUR = SAVE.lastCls && CLASSES[SAVE.lastCls] ? SAVE.lastCls : 'knight';
  const CL = () => CLASSES[G ? G.cls : CUR];
  const eqOf = cls => SAVE.equipBy[cls || CUR];

  // ---------------------------------------------------------------- 아이템
  const GRADES = [
    { k: 'common', n: '커먼', c: '#d8d8d8', opt: [0, 1], mul: 1, w: 60, pre: '낡은' },
    { k: 'rare', n: '레어', c: '#4f8dff', opt: [1, 2], mul: 1.25, w: 30, pre: '단단한' },
    { k: 'unique', n: '유니크', c: '#b05cff', opt: [2, 3], mul: 1.5, w: 9, pre: '성채의' },
    { k: 'legend', n: '레전더리', c: '#ff9a2e', opt: [3, 4], mul: 1.8, w: 1, pre: '' },
  ];
  const SLOTS = [
    { k: 'weapon', n: '무기', stat: 'atk', base: [6, 10], label: '공격력' },
    { k: 'helm', n: '투구', stat: 'def', base: [8, 14], label: '방어력' },
    { k: 'armor', n: '갑옷', stat: 'def', base: [12, 20], label: '방어력' },
    { k: 'boots', n: '장화', stat: 'def', base: [6, 10], label: '방어력' },
    { k: 'ring', n: '반지', stat: 'crit', base: [2, 4], label: '치명 확률 %' },
    { k: 'neck', n: '목걸이', stat: 'hp', base: [10, 20], label: '최대 HP' },
  ];
  const OPTS = [
    { k: 'atkP', n: '공격력 +{v}%', r: [4, 8] }, { k: 'hpP', n: 'HP +{v}%', r: [5, 10] }, { k: 'defP', n: '방어력 +{v}%', r: [5, 10] },
    { k: 'crit', n: '치명 확률 +{v}%', r: [2, 5] }, { k: 'critDmg', n: '치명 피해 +{v}%', r: [8, 15] }, { k: 'cdr', n: '쿨타임 -{v}%', r: [4, 8] },
    { k: 'spd', n: '이동 속도 +{v}%', r: [3, 6] },
  ];
  const LEGEND_FX = {
    bulwark: { n: '불굴의 성벽', d: '돌진 참격이 2회 충전된다' },
    fangs: { n: '쌍둥이 송곳니', d: '퍼펙트 회피 시 그림자 도약 즉시 충전' },
    ashstar: { n: '잿빛 별의 홀', d: '화염구가 3갈래로 나뉜다' },
    dawn: { n: '새벽 성가', d: '치유의 빛이 2초간 모든 피해를 막는 보호막도 부여' },
    undertaker: { n: '장의사의 머스킷', d: '그로기 상태의 적에게 집중 저격 피해 2배' },
    vigil: { n: '철야의 ', d: '퍼펙트 회피 시 HP 8% 회복' },
    ember: { n: '불씨의 ', d: '콤보 3타가 사방으로 충격파를 일으킨다' },
    tusk: { n: '크루가쉬의 엄니 ', d: '준엘리트·엘리트·보스에게 주는 피해 +15%' },
  };
  // v0.98 효과 옵션 (레어 이상 장비에 1개): 행동을 바꾸는 옵션
  const EFX = {
    corpse: { n: '시체 폭발', d: '적을 처치하면 시체가 터져 주변 적에게 피해' },
    blinkFire: { n: '불길 점멸', d: '점멸한 자리에 3초간 불길 — 지나는 적에게 화상' },
    wave3: { n: '검기', d: '3타째(원거리는 3발째)마다 앞으로 검기를 날림' },
    bleed: { n: '출혈', d: '치명타를 맞은 적은 3초간 출혈' },
    chain: { n: '연쇄 번개', d: '치명타 시 번개가 주변 적 2명에게 튐' },
    vamp: { n: '흡혈', d: '적을 처치하면 HP 2% 회복' },
    nova: { n: '반격 파동', d: '퍼펙트 회피 시 주변에 충격파' },
    exec: { n: '처형', d: 'HP 30% 이하인 적에게 주는 피해 +25%' },
    thorns: { n: '가시', d: '피격 시 주변 적에게 피해를 되돌림' },
    echo: { n: '전투 집중', d: '특수기술을 쓰면 3초간 치명 확률 +25%' },
    greed: { n: '탐욕', d: '적을 처치하면 15% 확률로 금화 주머니' },
    first: { n: '선제', d: '전투가 벌어지는 방에 들어간 뒤 첫 공격은 치명타' },
  };
  // v0.98 챕터 세트 (2·4세트): 챕터마다 그 챕터 세트가 나온다
  const SETS = {
    slime: { n: '점액왕의 유산', pre: '점액왕의', c: '#9be060', b2: '최대 HP +15%', b4: '피격 시 30% 확률로 산성 폭발 — 주변 적에게 피해' },
    order: { n: '타락한 기사단', pre: '기사단의', c: '#a8b8ff', b2: '방어력 +20%', b4: '공격이 맞을 때 12% 확률로 망령 검이 내리꽂힘' },
    orc: { n: '핏빛 엄니', pre: '엄니의', c: '#ff7a50', b2: '공격력 +12%', b4: 'HP 50% 이하일 때 주는 피해 +30% · 처치 시 HP 3% 회복' },
  };
  const SET_BY_STAGE = { 1: 'slime', 2: 'order', 3: 'orc' };
  // v0.98 저주 장비: 강한 보너스 옵션 + 대가
  const CURSES = { frail: { d: '최대 HP -20%' }, glass: { d: '받는 피해 +25%' }, slow: { d: '이동 속도 -12%' }, nopot: { d: '체력 물약 회복량 -50%' } };
  const CURSE_BONUS = [['atkP', 25, 35], ['critDmg', 40, 60], ['crit', 12, 18]];
  const WEAPON_FX = { knight: 'bulwark', ranger: 'fangs', mage: 'ashstar', priest: 'dawn', gunner: 'undertaker' };
  function rollGrade() {
    let r = Math.random() * 100;
    for (const g of GRADES) { if (r < g.w) return g; r -= g.w; }
    return GRADES[0];
  }
  function makeItem(cls, force = {}) {
    const g = force.grade ? GRADES.find(x => x.k === force.grade) : rollGrade(), slot = force.slot ? SLOTS.find(x => x.k === force.slot) : pick(SLOTS);
    const val = Math.round(randi(slot.base[0], slot.base[1]) * g.mul);
    const nOpt = randi(g.opt[0], g.opt[1]);
    const pool = OPTS.slice(), opts = [];
    for (let i = 0; i < nOpt; i++) {
      const o = pool.splice(randi(0, pool.length - 1), 1)[0];
      opts.push({ k: o.k, v: Math.round(randi(o.r[0], o.r[1]) * (1 + (g.mul - 1) * 0.5)) });
    }
    // 무기는 80% 확률로 지금 직업용, 아니면 다른 직업용
    const wcls = slot.k === 'weapon' ? (force.slot || Math.random() < 0.8 ? cls : pick(Object.keys(CLASSES).filter(k => k !== cls))) : null;
    const sname = wcls ? CLASSES[wcls].weapon : slot.n;
    let name = `${g.pre} ${sname}`.trim(), fx = null;
    if (g.k === 'legend') {
      fx = slot.k === 'weapon' ? WEAPON_FX[wcls] : force.legendFx && Math.random() < 0.5 ? force.legendFx : pick(['vigil', 'ember']);
      name = slot.k === 'weapon' ? LEGEND_FX[fx].n : LEGEND_FX[fx].n + slot.n;
    }
    // v0.98: 효과 옵션 · 세트 · 저주
    const stg = (G && G.stage) || 1, hi = g.k !== 'common';
    const efx = hi && !force.noEfx ? pick(Object.keys(EFX)) : null;
    const set = hi && (force.set || Math.random() < (force.setP != null ? force.setP : 0.25)) ? (force.set || SET_BY_STAGE[stg]) : null;
    let curse = null, v2 = val;
    if (hi && !force.noCurse && (force.curse || Math.random() < (force.curseP != null ? force.curseP : 0.07))) {
      curse = force.curse || pick(Object.keys(CURSES)); v2 = Math.round(val * 1.3);
      const [ck, a, b] = pick(CURSE_BONUS); const ex = opts.find(o => o.k === ck);
      if (ex) { ex.v += randi(a, b); ex.cb = true; } else opts.push({ k: ck, v: randi(a, b), cb: true });
    }
    if (set && g.k !== 'legend') name = `${SETS[set].pre} ${sname}`;
    if (curse) name = '저주받은 ' + name;
    return { id: SAVE.nextId++, grade: g.k, slot: slot.k, cls: wcls, name, stat: slot.stat, val: v2, opts, fx, lv: 0, fail: 0, efx, set, curse };
  }
  const setCount = (set, cls) => { const eq = eqOf(cls || (G ? G.cls : CUR)); let n = 0; for (const k in eq) { const it = SAVE.inv.find(i => i.id === eq[k]); if (it && it.set === set && canEquip(it, cls || (G ? G.cls : CUR))) n++; } return n; };
  function itemExtra(it, cls) {
    let h = '';
    if (it.efx) h += `<div class="efx">◆ ${EFX[it.efx].n} — ${EFX[it.efx].d}</div>`;
    if (it.set) { const S = SETS[it.set], n = setCount(it.set, cls); h += `<div class="setx" style="--sc:${S.c}">⬢ ${S.n} <b>${n}/4</b><span class="${n >= 2 ? 'on' : ''}">2세트: ${S.b2}</span><span class="${n >= 4 ? 'on' : ''}">4세트: ${S.b4}</span></div>`; }
    if (it.curse) h += `<div class="cursex">☠ 저주 — ${CURSES[it.curse].d}</div>`;
    return h;
  }
  const gradeOf = it => GRADES.find(g => g.k === it.grade);
  const slotOf = it => SLOTS.find(s => s.k === it.slot);
  const slotName = it => it.slot === 'weapon' ? CLASSES[it.cls || 'knight'].weapon : slotOf(it).n;
  const canEquip = (it, cls) => it.slot !== 'weapon' || (it.cls || 'knight') === cls;

  // ---------------------------------------------------------------- 강화 규칙 (기획서 9장)
  // 성공률: 목표 단계 +1~+15. +10 이상을 노리다 실패하면 1단계 하락, 실패할 때마다 다음 시도 +2%p (장인의 숨결)
  const ENH_RATE = [100, 95, 90, 85, 80, 70, 65, 60, 50, 40, 35, 30, 20, 15, 10];
  const enhGain = i => i < 5 ? 0.05 : i < 9 ? 0.07 : i < 12 ? 0.10 : 0.12;
  const enhBonus = lv => { let b = 0; for (let i = 0; i < lv; i++) b += enhGain(i); return b; };
  const itemVal = (it, lv) => Math.round(it.val * (1 + enhBonus(lv == null ? (it.lv || 0) : lv)));
  const enhCost = lv => ({ iron: lv < 9 ? lv + 1 : 3, crystal: lv < 9 ? 0 : lv < 12 ? 1 : 2, gold: 20 * (lv + 1) * (lv + 1) });
  const enhRate = it => Math.min(100, ENH_RATE[it.lv] + 2 * (it.fail || 0));
  const optText = o => (o.cb ? '<span style="color:#ff8a7a">☠ </span>' : '') + OPTS.find(x => x.k === o.k).n.replace('{v}', o.v);

  // ---------------------------------------------------------------- 스탯
  const BUFFS = {
    atk: { n: '분노의 잉걸', d: '공격력 +20%', t: '공격↑' },
    spd: { n: '바람의 재', d: '이동 속도 +15%', t: '이속↑' },
    hp: { n: '굳은 피', d: '최대 HP +30', t: 'HP↑' },
    stam: { n: '가벼운 발', d: '점멸 충전 +40%', t: '점멸↑' },
    cd: { n: '종소리의 메아리', d: '스킬·각성 충전 +25%', t: '쿨↓' },
  };
  function calcStats(buffs, cls) {
    cls = cls || (G ? G.cls : CUR);
    const B = CLASSES[cls].base;
    const s = { atk: B.atk, def: B.def, hp: B.hp, crit: B.crit, critDmg: 1.5, cdr: 0, spd: B.spd, stamRate: 1, gaugeRate: 1, fx: new Set(), efx: new Set(), sets: {}, set4: new Set(), curse: new Set() };
    let atkP = 0, hpP = 0, defP = 0, spdP = 0;
    for (const slot of SLOTS) {
      const it = SAVE.inv.find(i => i.id === eqOf(cls)[slot.k]); if (!it || !canEquip(it, cls)) continue;
      const v = itemVal(it);
      if (it.stat === 'crit') s.crit += v / 100; else s[it.stat] += v;
      for (const o of it.opts) {
        if (o.k === 'atkP') atkP += o.v; else if (o.k === 'hpP') hpP += o.v; else if (o.k === 'defP') defP += o.v;
        else if (o.k === 'crit') s.crit += o.v / 100; else if (o.k === 'critDmg') s.critDmg += o.v / 100;
        else if (o.k === 'cdr') s.cdr += o.v / 100; else if (o.k === 'spd') spdP += o.v;
      }
      if (it.fx) s.fx.add(it.fx);
      if (it.efx) s.efx.add(it.efx);
      if (it.set) s.sets[it.set] = (s.sets[it.set] || 0) + 1;
      if (it.curse) s.curse.add(it.curse);
    }
    for (const k in s.sets) if (s.sets[k] >= 4) s.set4.add(k);
    if (s.sets.slime >= 2) hpP += 15; if (s.sets.order >= 2) defP += 20; if (s.sets.orc >= 2) atkP += 12;
    if (s.curse.has('frail')) hpP -= 20; if (s.curse.has('slow')) spdP -= 12;
    if (buffs.includes('atk')) atkP += 20;
    if (buffs.includes('spd')) spdP += 15;
    if (buffs.includes('hp')) s.hp += 30;
    if (buffs.includes('stam')) s.stamRate = 1.4;
    if (buffs.includes('cd')) { s.cdr += 0.2; s.gaugeRate = 1.25; }
    s.atk *= 1 + atkP / 100; s.hp = Math.round(s.hp * (1 + hpP / 100)); s.def *= 1 + defP / 100; s.spd *= 1 + spdP / 100;
    s.cdr = Math.min(s.cdr, 0.5); s.crit = Math.min(s.crit, 0.8);
    return s;
  }

  // ---------------------------------------------------------------- 게임 상태
  let G = null;
  let mode = 'title'; // title | play | rest | result | pause
  let hitstop = 0, shake = 0, shakeX = 0, shakeY = 0, slowmo = 0, flashT = 0, flashColor = '#fff', time = 0;
  let zoomK = 0, stopHeat = 0; // 타격감: 줌 펀치, 연속 히트스톱 누적(과하게 멈추지 않게)

  // 로그라이크: 장비·재료·골드는 한 번의 토벌(런) 동안만 유지된다
  function wipeRunItems() {
    SAVE.inv = []; for (const k of Object.keys(SAVE.equipBy)) SAVE.equipBy[k] = {};
    SAVE.mats = { iron: 0, crystal: 0 }; SAVE.gold = 0;
  }
  function newRun() {
    wipeRunItems();
    G = {
      cls: CUR, stage: 1, last: 3, gold: 0, committed: { gold: 0, iron: 0, crystal: 0 },
      phase: 1, buffs: [], retries: 0, enemies: [], tele: [], parts: [], nums: [], hazards: [], drops: [], fx: [], ash: [], lights: [],
      waves: [], waveIdx: 0, spawning: 0, phaseState: 'intro', phaseT: 0, surviveT: 0, spawnT: 0, hazardT: 0,
      boss: null, bossTime: 300, proj: [], eproj: [], kills: 0, iron: 0, crystal: 0, newItems: [], loot: [], mproj: [], meteor: null, fieldItems: [], frenzyT: 0, bonfire: null, vortex: null, clear: false,
    };
    for (let i = 0; i < 70; i++) G.ash.push(G.stage === 3 ? { x: rand(0, VW), y: rand(0, VH), vx: rand(-5, 5), vy: -rand(8, 22), s: Math.random() < 0.25 ? 2 : 1, a: rand(0.3, 0.85), ff: rand(0, 6) } : G.stage === 1 ? { x: rand(0, VW), y: rand(0, VH), vx: rand(-8, 8), vy: rand(-4, 4), s: Math.random() < 0.3 ? 2 : 1, a: rand(0.3, 0.9), ff: rand(0, 6) } : { x: rand(0, VW), y: rand(0, VH), vx: rand(-6, 6), vy: rand(6, 16), s: Math.random() < 0.2 ? 2 : 1, a: rand(0.2, 0.6) });
    dg.clearRect(0, 0, W, H);
    G.stats = calcStats(G.buffs);
    G.player = makePlayer();
    SAVE.runs++; persist();
    G.kg = true; G.kgT = 15; G.kgCls = null; // 시작하면 조작 안내를 띄운다
    newDungeon();
  }
  function makePlayer() {
    const s = G.stats;
    return {
      x: CX, y: CY + 60, r: 7, hp: s.hp, hpBack: s.hp, ang: 0, face: 1, state: 'idle', t: 0,
      combo: 0, comboWin: 0, queued: false, atkAng: 0, swingRel: 0, prevRel: 0, hitSet: new Set(), sign: 1,
      blade: 150 * DEG, trail: [], blade2: 120 * DEG, trail2: [], spin: 0,
      stam: 2, stamT: 0, iframe: 0, dodgeT: 0, dvx: 0, dvy: 0, hurtT: 0, inv: 0,
      chargeCd: [0, 0], chargeHit: new Set(), gauge: 0, reload: 0, ammo: 5, mana: 100, recoil: 0, poisonT: 0, poisonTick: 0, poisonDmg: 0, shieldT: 0, miracleT: 0, boltN: 0, awakenT: 0, critNext: false, dead: false, deadT: 0, walk: 0, moving: false,
    };
  }

  // ---------------------------------------------------------------- 페이즈
  const PHASES = {
    1: [[['ghoul', 4]], [['ghoul', 3], ['crow', 3]]],
    2: [[['ghoul', 3], ['dog', 2]], [['ghoul', 3], ['bloat', 2], ['crow', 2]]],
    3: [[['ghoul', 4], ['cultist', 2]], [['crow', 4], ['dog', 2], ['bloat', 1]]],
    4: [[['exec', 1], ['ghoul', 3], ['cultist', 1]]],
    6: [[['ghoul', 4], ['dog', 2], ['bloat', 2]], [['ghoul', 3], ['cultist', 3], ['crow', 2]], [['ghoul', 5], ['dog', 2], ['cultist', 1]]],
    7: [[['mother', 1], ['ghoul', 2]], [['dog', 3], ['cultist', 2]], [['ghoul', 4], ['crow', 3], ['cultist', 2]]],
    8: [[['ghoul', 5], ['dog', 3], ['bloat', 2]], [['crow', 4], ['cultist', 3], ['bloat', 2]], [['exec', 1], ['ghoul', 3], ['cultist', 1]]],
    9: [[['exec', 1], ['dog', 2], ['cultist', 1]], [['mother', 1], ['crow', 3], ['cultist', 1]]],
  };
  function phaseLabel(p) {
    if (p === 5) return '휴식 — 모닥불';
    if (p === 10) return '60초 동안 버텨라';
    if (p === 4 || p === 9) return '엘리트 출현';
    if (p >= 6 && p <= 8) return '혼합 웨이브';
    return '잡몹 웨이브';
  }

  // ================================================================ 성채 확장: 역병 까마귀 · 역병 어미
  function crowTick(e, dt) {
    e.walk += dt * 14;
    const target = e.state === 'dive' ? 4 : 18 + Math.sin(time * 5 + e.orbP) * 3;
    e.z += (target - e.z) * Math.min(1, dt * (e.state === 'dive' ? 10 : 4));
    if (e.orb == null) { e.orb = Math.random() < 0.5 ? 1 : -1; e.orbP = rand(0, 6); }
  }
  function updateCrow(e, dt, d, a) {
    const P = G.player;
    if (e.state === 'chase') {
      const R0 = 90, off = d > R0 * 1.2 ? 0.45 : d < R0 * 0.7 ? 2.4 : 1.45;
      const ang = a + off * e.orb;
      e.x += Math.cos(ang) * e.spd * dt; e.y += Math.sin(ang) * e.spd * dt;
      if (Math.abs(Math.cos(ang)) > 0.2) e.face = Math.cos(ang) > 0 ? 1 : -1;
      if (Math.random() < dt * 0.3) e.orb = -e.orb;
      if (e.cd <= 0 && d < 210) {
        e.state = 'wind'; e.lockAng = a; e.face = Math.cos(a) > 0 ? 1 : -1;
        G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 180, w: 12, t: 0, dur: 0.6, owner: e, thin: true,
          onFire: () => { e.state = 'dive'; e.t = 0.42; e.hitPlayer = false; sfx('swing'); } });
      }
    } else if (e.state === 'dive') {
      e.x += Math.cos(e.lockAng) * 400 * dt; e.y += Math.sin(e.lockAng) * 400 * dt;
      if (dashBlocked(e, false)) { solveObs(e, e.r, true); e.t = 0; dust(e.x, e.y, 6); G.parts.push({ x: e.x, y: e.y - 8, vx: 0, vy: -30, t: 0.4, c: '#2a2430', g: 60 }); }
      if (Math.random() < 0.6) G.parts.push({ x: e.x, y: e.y - e.z, vx: rand(-20, 20), vy: rand(-10, 10), t: 0.3, c: '#2a2430', g: 40 });
      if (!e.hitPlayer && dist(e, P) < e.r + P.r + 3) { e.hitPlayer = true; hurtPlayer(e.atk, e); }
      if (e.t <= 0) { e.state = 'recover'; e.t = 0.45; e.cd = rand(1.8, 2.8); }
    }
  }
  function drawCrow(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0, z = e.z || 0;
    drawShadow(e.x, e.y + 1, 6);
    const frame = e.state === 'dive' ? 'crowB' : Math.floor(e.walk) % 2 ? 'crowA' : 'crowB';
    const rot = e.state === 'dive' ? 0.35 * e.face : e.state === 'wind' ? -0.25 * e.face : 0;
    drawSprite(frame, 'crow', 2, e.x, e.y - z + ya, flip, { white, rot, alpha: al });
    if (e.state === 'wind') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,60,40,.9)'; ctx.fillRect(Math.round(e.x + e.face * 6), Math.round(e.y - z - 8 + ya), 2, 2); ctx.restore(); }
  }

  function motherTick(e, dt) {
    if (!e.enraged && e.hp < e.maxHp * 0.5 && !e.dead) {
      e.enraged = true; e.spd *= 1.25;
      G.fx.push({ kind: 'ring', x: e.x, y: e.y - 24, r: 8, t: 0.5, max: 0.5, c: '#9ae050', grow: 300 }); addShake(5); sfx('roar'); alertMark(e, 70, true);
    }
    e.broodT = (e.broodT == null ? 5 : e.broodT) - dt;
    if (Math.random() < dt * 4) G.parts.push({ x: e.x + rand(-10, 10), y: e.y - rand(14, 30), vx: rand(-4, 4), vy: -rand(8, 20), t: 0.7, c: pick(['#9ae050', '#4a7a20', '#6a6a3a']), g: 0, glow: Math.random() < 0.3 });
  }
  function updateMother(e, dt, d, a, moveTo) {
    if (e.state === 'bilecharge') {
      const k = 1 - e.t / e.chargeMax, mx = e.x + e.face * 1, my = e.y - 32;
      e.lean = -0.18 * e.face * k; e.face = Math.cos(a) > 0 ? 1 : -1;
      for (let i = 0; i < 2; i++) { const aa = rand(0, TAU), r = rand(16, 34) * (1 - k * 0.5); G.parts.push({ x: mx + Math.cos(aa) * r, y: my + Math.sin(aa) * r, vx: -Math.cos(aa) * r * 4, vy: -Math.sin(aa) * r * 4, t: 0.22, c: pick(['#9ae050', '#d8f0a0', '#6a9a2a']), g: 0, glow: true }); }
      if (e.t <= 0) motherBileFire(e);
      return;
    }
    if (e.state !== 'chase') return;
    if (d > 80) moveTo(a, e.spd);
    if (e.cd > 0) return;
    if (e.broodT <= 0 && G.enemies.filter(x => !x.dead && x.type === 'ghoul').length < 5) return motherBrood(e);
    if (d < 90) motherMiasma(e); else motherBile(e, a);
  }
  function motherBrood(e) { // 배를 움켜쥐고 시체를 땅에서 끌어올린다
    e.state = 'wind'; e.pat = 'brood'; e.broodT = e.enraged ? 10 : 13; alertMark(e, 64, true); sfx('warn');
    const n = e.enraged ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const pt = { x: clamp(e.x + rand(-110, 110), A.x0 + 20, A.x1 - 20), y: clamp(e.y + rand(-70, 80), A.y0 + 20, A.y1 - 20) };
      G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: 11, t: 0, dur: 1.1 + i * 0.12, owner: e,
        onFire: () => {
          const g = makeEnemy('ghoul', pt.x, pt.y); g.rise = 0.6; G.enemies.push(g);
          burst(pt.x, pt.y - 6, '#4a7a20', 10); dust(pt.x, pt.y, 8); splat(pt.x, pt.y, 10, '50,60,20');
          if (i === n - 1) { e.state = 'recover'; e.t = 0.7; e.cd = rand(1.0, 1.6); }
        } });
    }
  }
  function motherBile(e, a) { // 담즙 토하기: 범위 표시 없이 입에 독을 모으는 동작으로 예고
    e.state = 'bilecharge'; e.t = 0.95; e.chargeMax = 0.95; e.face = Math.cos(a) > 0 ? 1 : -1; alertMark(e, 64); sfx('warn');
  }
  function motherBileFire(e) {
    const tt = { ang: angTo(e, G.player) };
    e.face = Math.cos(tt.ang) > 0 ? 1 : -1;
    for (let w = 0; w < (e.enraged ? 2 : 1); w++) for (let i = 0; i < 7; i++) {
      const ang = tt.ang + (i - 3) * (70 * DEG / 6) + w * 0.09;
      G.eproj.push({ x: e.x + Math.cos(ang) * 16, y: e.y + Math.sin(ang) * 12, ang, sp: 210 - w * 50, r: 5, dmg: e.atk * 0.7, t: 1.8, hist: [], kind: 'bile', poison: true });
    }
    const mx = e.x + e.face * 1, my = e.y - 32;
    for (let i = 0; i < 16; i++) { const aa = tt.ang + rand(-0.6, 0.6), sp = rand(60, 180); G.parts.push({ x: mx, y: my, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, t: rand(0.2, 0.45), c: pick(['#9ae050', '#d8f0a0', '#4a7a20']), g: 120, glow: true }); }
    G.fx.push({ kind: 'ring', x: mx, y: my, r: 4, grow: 160, t: 0.22, max: 0.22, c: '#c8f070' });
    e.lean = 0.3 * e.face; sfx('fireball'); addShake(3, tt.ang);
    e.state = 'recover'; e.t = 0.8; e.cd = rand(1.2, 1.8);
  }
  function motherMiasma(e) { // 독기 분출: 몸 주위를 독으로 덮는다
    e.state = 'wind'; e.pat = 'miasma'; alertMark(e, 64, true); sfx('warn');
    G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 84, t: 0, dur: 1.1, owner: e, heavy: true,
      onFire: tt => {
        const P = G.player;
        if (!P.dead && inShape(tt, P.x, P.y, P.r)) { const hp0 = P.hp; hurtPlayer(e.atk, e); if (P.hp < hp0) poisonPlayer(4, e.atk * 0.25); }
        G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 10, t: 0.5, max: 0.5, c: '#9ae050', grow: 300 });
        G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 8, t: 0.4, max: 0.4, c: '#d8f0a0', grow: 200 });
        for (let i = 0; i < 40; i++) { const aa = rand(0, TAU), sp = rand(40, 160); G.parts.push({ x: e.x, y: e.y - 8, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.6, t: rand(0.4, 0.9), c: pick(['#9ae050', '#4a7a20', '#c8d870', '#6a6a3a']), g: 0, glow: Math.random() < 0.4 }); }
        splat(e.x, e.y, 30, '50,60,20'); addShake(5); sfx('blast');
        e.state = 'recover'; e.t = 0.9; e.cd = rand(1.3, 1.9);
      } });
  }
  function drawMother(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0;
    let sx = 1, sy = 1 + Math.sin(e.walk * 2) * 0.03, tr = 0, rot = e.lean + (e.grogiT > 0 ? 0.25 * e.face : 0);
    if (e.state === 'bilecharge') { const k = 1 - e.t / e.chargeMax; sy = 1 + 0.06 * k; rot = -0.18 * e.face * k; tr = k > 0.7 ? rand(-0.8, 0.8) : 0; }
    if (e.state === 'wind') { const g = e.glow; if (e.pat === 'brood') { sx = 1 + 0.08 * Math.sin(time * 30) * g; tr = rand(-1, 1) * g; } if (e.pat === 'miasma') { sx = sy = 1 + 0.12 * g; } if (e.pat === 'bile') rot = -0.15 * e.face * g; }
    drawShadow(e.x, e.y + 2, 18);
    if (e.state === 'wind' && e.pat === 'miasma' && !white) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(e.x, e.y - 10, 0, e.x, e.y - 10, 30 + 50 * e.glow); gr.addColorStop(0, `rgba(150,220,80,${0.35 * e.glow})`); gr.addColorStop(1, 'rgba(150,220,80,0)'); ctx.fillStyle = gr; ctx.fillRect(e.x - 90, e.y - 100, 180, 180); ctx.restore(); }
    drawSprite('mother', 'mother', 2, e.x + tr, e.y + 2 + ya, flip, { white, rot, alpha: al, sx, sy });
    if (!white) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.35 + 0.25 * Math.sin(time * 4) + (e.state === 'wind' ? 0.4 * e.glow : 0);
      const gr = ctx.createRadialGradient(e.x, e.y - 22 + ya, 0, e.x, e.y - 22 + ya, 14); gr.addColorStop(0, `rgba(170,240,90,${pulse})`); gr.addColorStop(1, 'rgba(170,240,90,0)');
      ctx.fillStyle = gr; ctx.fillRect(e.x - 14, e.y - 36 + ya, 28, 28);
      ctx.fillStyle = `rgba(200,250,110,${0.6 + 0.4 * e.glow})`; for (const ox of [-4, 4]) ctx.fillRect(Math.round(e.x + (flip ? -ox - 2 : ox)), Math.round(e.y - 38 + ya), 2, 2);
      ctx.restore();
    }
    if (e.state === 'bilecharge' && !white) {
      const k = 1 - e.t / e.chargeMax, mx = e.x + e.face * 1, my = e.y - 32 + ya;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const rr = 4 + 12 * k, gr = ctx.createRadialGradient(mx, my, 0, mx, my, rr);
      gr.addColorStop(0, `rgba(230,255,170,${0.6 + 0.4 * k})`); gr.addColorStop(0.5, `rgba(150,230,70,${0.5 * k + 0.2})`); gr.addColorStop(1, 'rgba(150,230,70,0)');
      ctx.fillStyle = gr; ctx.fillRect(mx - rr, my - rr, rr * 2, rr * 2);
      if (k > 0.75 && Math.floor(time * 20) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 1, 3, 3); }
      ctx.restore();
    }
    if (e.grogiT > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(e.y - 56 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); }
  }

  // ================================================================ 초원 확장: 엘리트 2종 · 고블린 아처 · 독침 슬라임 · 소품
  // ================================================================ v0.95 챕터 2 기사단 엘리트
  // 판정 순간 무기가 이미 70% 내려와 있게 (엇박 금지)
  function slamBlade(e, to, side, dur = 0.06) { e.bladeAng += angDiff(to, e.bladeAng) * 0.7; startSwing(e, to, side, dur); }
  function eAtkFx(x, y, power, c) { addShake(4 + 4 * power); dust(x, y, 8 * power); debris(x, y, 10 * power); G.fx.push({ kind: 'ring', x, y, r: 6, t: 0.35, max: 0.35, c: c || '#e0d8c8', grow: 200 * power }); }
  // ---- 기사단 처형인: 처형 내려찍기 · 회전 베기 2연 · 사슬 갈고리(끌어당긴 뒤 곧바로 내려찍기)
  function execTick(e, dt) {
    const P = G.player;
    if (e.hook) { e.hook.t += dt; if (e.hook.t > e.hook.dur + (e.pull ? 0.45 : 0.15)) e.hook = null; }
    if (e.pull) { e.pull.t -= dt; const dd = dist(P, e); if (dd > 46 && !P.dead) { const k = Math.min(1, 560 * dt / dd); P.x += (e.x - P.x) * k; P.y += (e.y - P.y) * k; } if (e.pull.t <= 0) e.pull = null; }
    if (e.state === 'chase') e.vuln = 1;
  }
  function updateExec(e, dt, d, a, moveTo) {
    const P = G.player;
    if (d > 64) moveTo(a, e.spd * (d > 200 ? 1.3 : 1));
    if (e.cd > 0) return;
    e.face = Math.cos(a) > 0 ? 1 : -1;
    let pat = e.forceChop ? 'chop' : d < 95 ? wpick2([['chop', 4], ['spin', 2]]) : d < 170 ? wpick2([['spin', 2], ['chop', 1], ['hook', 2]]) : d < 330 ? 'hook' : null;
    if (!pat) return;
    if (pat === e.lastPat && pat !== 'chop') pat = 'chop';
    e.lastPat = pat; const fast = e.forceChop; e.forceChop = false;
    const side = e.face;
    if (pat === 'chop') { // 처형 내려찍기: 도끼를 등 뒤로 크게 치켜들었다가 앞으로 내리꽂음
      e.state = 'wind'; e.bladeTarget = a - side * 160 * DEG; e.lean = -0.2 * side; alertMark(e, 56, true); sfx('warn');
      G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 132, w: 40, t: 0, dur: fast ? 0.55 : 0.85, owner: e,
        onFire: tt => { if (e.dead) return; slamBlade(e, tt.ang + side * 25 * DEG, side); e.lean = 0.3 * side; hitShape(tt, e.atk * 1.4); sfx('heavy'); sfx('blast', 0.7);
          const ex = e.x + Math.cos(tt.ang) * 90, ey = e.y + Math.sin(tt.ang) * 70; eAtkFx(ex, ey, 1.2); crack(ex, ey); hitstop = Math.max(hitstop, 0.04);
          e.state = 'recover'; e.t = 1.0; e.vuln = 1.3; e.cd = rand(0.8, 1.3); G.nums.push({ x: e.x, y: e.y - 70, v: '도끼가 박혔다!', t: 0.8, c: '#ffd34d', s: 1, txt: true }); } });
    } else if (pat === 'spin') { // 회전 베기 2연: 원 경고 → 한 바퀴 → 짧은 원 경고 → 한 바퀴
      e.state = 'wind'; e.bladeTarget = a + Math.PI; e.lean = -0.25 * side; alertMark(e, 56, true); sfx('warn');
      const spin = (mul) => tt => { if (e.dead) return; startSwing(e, e.bladeAng + side * (TAU - 0.01), side, 0.26); hitShape(tt, e.atk * mul); sfx('whoosh'); sfx('heavy', 0.8); eAtkFx(e.x, e.y, 0.8);
        G.fx.push({ kind: 'arcwave', x: e.x, y: e.y - 8, ang: 0, arc: TAU, r0: 20, r1: tt.r + 10, t: 0.28, max: 0.28, c: '230,220,210' }); };
      G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 86, t: 0, dur: 0.8, owner: e, onFire: tt => { spin(0.9)(tt); if (e.dead) return;
        G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 86, t: 0, dur: 0.38, owner: e, onFire: spin(0.9) }); e.state = 'recover'; e.t = 0.38 + 0.75; e.cd = rand(0.9, 1.4); } });
    } else { // 사슬 갈고리: 가는 선 경고 → 갈고리를 던져 맞으면 끌어당기고 곧바로 내려찍기
      e.state = 'wind'; e.lean = -0.15 * side; e.bladeTarget = restAng(e); alertMark(e, 56); sfx('warn', 0.8);
      G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 320, w: 16, t: 0, dur: 0.65, owner: e, thin: true,
        onFire: tt => { if (e.dead) return; e.hook = { ang: tt.ang, t: 0, dur: 0.2, len: 320, hit: false }; sfx('whoosh');
          if (!P.dead && inShape(tt, P.x, P.y, P.r)) { const hp0 = P.hp; hurtPlayer(e.atk * 0.5, e); if (P.hp < hp0) { e.hook.hit = true; e.pull = { t: 0.42 }; G.nums.push({ x: P.x, y: P.y - 40, v: '끌려간다!', t: 0.8, c: '#ff8a5a', s: 1, txt: true }); } }
          e.state = 'recover'; e.t = e.hook.hit ? 0.45 : 0.75; e.cd = e.hook.hit ? 0 : rand(1.0, 1.5); e.forceChop = e.hook.hit; } });
    }
  }
  function drawExec(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0, bob = e.state === 'chase' ? Math.sin(e.walk) * 0.8 : 0;
    const by = e.y + 2 + ya + bob, shY = by - 27, fx = e.x + e.face * 10, bx = e.x - e.face * 10;
    const bl = BLADES.headsman, hx = fx + Math.cos(e.bladeAng) * 12, hy = shY + Math.sin(e.bladeAng) * 12, behind = !e.sw && Math.cos(e.bladeAng) * e.face < -0.2;
    drawShadow(e.x, e.y + 2, 17);
    drawArm(bx, shY, (e.face > 0 ? 100 : 80) * DEG, 18, 6, white, true, 'exec');
    if (behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
    drawTrail(e.trail, hx, hy, 14, bl.reach, '230,220,210', true);
    drawSprite('exec', 'exec', 2, e.x, by, flip, { white, rot: e.lean + (e.grogiT > 0 ? 0.25 * e.face : 0), alpha: al, sy: e.state === 'wind' ? 0.96 : 1 });
    drawArm(fx, shY, e.bladeAng, 12, 6, white, false, 'exec');
    if (!behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
    if (e.hook) { // 사슬: 2px 고리 마디 + 갈고리
      const H2 = e.hook, k = H2.hit && e.pull ? Math.max(0, dist(G.player, e) / H2.len) : Math.min(1, H2.t / H2.dur) * (H2.t > H2.dur ? Math.max(0, 1 - (H2.t - H2.dur) / 0.15) : 1), L = H2.len * k, ux = Math.cos(H2.ang), uy = Math.sin(H2.ang);
      for (let i = 0; i < L; i += 4) { const x = Math.round(fx + ux * i) & ~1, y = Math.round(shY + uy * i) & ~1; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x - 1, y - 1, 4, 4); ctx.fillStyle = i % 8 ? '#5a5e68' : '#9aa0ac'; ctx.fillRect(x, y, 2, 2); }
      const tx = Math.round(fx + ux * L) & ~1, ty = Math.round(shY + uy * L) & ~1; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(tx - 3, ty - 3, 8, 8); ctx.fillStyle = '#c8ccd4'; ctx.fillRect(tx - 1, ty - 1, 4, 4); ctx.fillRect(tx + Math.round(-uy * 4) - 1, ty + Math.round(ux * 4) - 1, 2, 2);
    }
    if (e.grogiT > 0) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(by - 56 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); } }
  }
  // ---- 타락한 기수: 깃발 꽂기(주변 기사단 집결 버프: 이동 +25%·공격 +20%, 깃발은 부술 수 있음) · 종자 소집 · 깃대 휘두르기/찌르기 → 깃발을 꽂은 뒤엔 장검 2연베기/찌르기
  function bearerTick(e, dt) {
    e.callT = (e.callT == null ? 7 : e.callT) - dt; e.plantT = (e.plantT == null ? 3.5 : e.plantT) - dt;
    if (e.flagRef && e.flagRef.dead && !e.lostFlag) { e.lostFlag = true; e.spd *= 1.2; banner2(e, '깃발이 꺾였다!'); alertMark(e, 60, true); sfx('roar', 1.2); }
    if (e.state === 'chase') e.vuln = 1;
  }
  function updateBearer(e, dt, d, a, moveTo) {
    const P = G.player, carry = !e.flagRef;
    if (d > 58) moveTo(a, e.spd * (d > 200 ? 1.25 : 1));
    if (e.cd > 0) return;
    e.face = Math.cos(a) > 0 ? 1 : -1; const side = e.face;
    const squires = G.enemies.filter(o => !o.dead && o.type === 'ghoul').length;
    let pat = carry && e.plantT <= 0 ? 'plant' : e.callT <= 0 && squires < 4 ? 'call' : carry ? (d < 88 ? wpick2([['sweep', 3], ['thrust', 1]]) : d < 150 ? 'thrust' : null) : (d < 80 ? wpick2([['slash', 3], ['stab', 1]]) : d < 145 ? 'stab' : null);
    if (!pat) return;
    if (pat === 'plant') {
      const px = clamp(e.x + side * 26, A.x0 + 24, A.x1 - 24), py = clamp(e.y + 6, A.y0 + 24, A.y1 - 24);
      e.state = 'wind'; e.bladeTarget = -90 * DEG; alertMark(e, 60, true); sfx('warn');
      G.tele.push({ shape: 'spawn', x: px, y: py, r: 22, t: 0, dur: 0.85, owner: e, onFire: () => { if (e.dead) return;
        const f = makeEnemy('flag', px, py); f.face = side; f.owner = e; f.rise = 0.2; G.enemies.push(f); e.flagRef = f; e.blade = 'bsword'; e.bladeAng = restAng(e); e.bladeTarget = e.bladeAng;
        addShake(5); dust(px, py, 16); debris(px, py, 10); sfx('blast', 0.8); G.fx.push({ kind: 'ring', x: px, y: py, r: 8, t: 0.6, max: 0.6, c: '#ffd070', grow: 360 }); banner2(e, '깃발을 꽂았다!');
        e.state = 'recover'; e.t = 0.6; e.cd = 0.5; } });
      return;
    }
    if (pat === 'call') { // 종자 소집: 깃대(검)를 높이 들고 외치면 종자 둘이 달려옴
      e.state = 'wind'; e.bladeTarget = -90 * DEG; alertMark(e, 60, true); sfx('roar', 1.3); e.callT = 15;
      G.tele.push({ shape: 'spawn', x: e.x, y: e.y, r: 18, t: 0, dur: 0.7, owner: e, onFire: () => { if (e.dead) return; for (let i = 0; i < 2; i++) queueSpawn('ghoul', { x: clamp(e.x + rand(-110, 110), A.x0 + 20, A.x1 - 20), y: clamp(e.y + rand(-70, 70), A.y0 + 20, A.y1 - 20) }); banner2(e, '집결하라!'); e.state = 'recover'; e.t = 0.4; e.cd = 0.6; } });
      return;
    }
    const finish = (rec, cd) => { e.state = 'recover'; e.t = rec; e.cd = cd; };
    if (pat === 'sweep') { // 깃대 휘두르기: 넓은 부채꼴
      e.state = 'wind'; e.bladeTarget = a - side * 140 * DEG; e.lean = -0.2 * side; sfx('warn');
      G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: a, r: 84, arc: 160 * DEG, t: 0, dur: 0.7, owner: e, onFire: tt => { if (e.dead) return; slamBlade(e, tt.ang + side * 70 * DEG, side, 0.08); hitShape(tt, e.atk * 1.0); sfx('whoosh'); sfx('heavy', 0.8); eAtkFx(e.x + Math.cos(tt.ang) * 50, e.y + Math.sin(tt.ang) * 40, 0.8); finish(0.75, rand(0.8, 1.2)); } });
    } else if (pat === 'thrust' || pat === 'stab') { // 찌르기: 앞으로 한 걸음 내디디며
      const len = pat === 'thrust' ? 132 : 112;
      e.state = 'wind'; e.bladeTarget = a + Math.PI * 0.92; e.lean = -0.2 * side; sfx('warn');
      G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len, w: 22, t: 0, dur: pat === 'thrust' ? 0.65 : 0.5, owner: e, onFire: tt => { if (e.dead) return; e.bladeAng = tt.ang; e.bladeTarget = tt.ang; e.x += Math.cos(tt.ang) * 14; e.y += Math.sin(tt.ang) * 14; hitShape(tt, e.atk * 1.1); sfx('whoosh'); sparks(e.x + Math.cos(tt.ang) * len * 0.8, e.y + Math.sin(tt.ang) * len * 0.6, tt.ang, '#e0e0e8', 6); finish(0.65, rand(0.8, 1.2)); } });
    } else { // 장검 2연베기
      e.state = 'wind'; e.bladeTarget = a - side * 120 * DEG; e.lean = -0.2 * side; sfx('warn');
      const cut = (mul, next) => tt => { if (e.dead) return; slamBlade(e, tt.ang + side * (next ? 80 : -80) * DEG, next ? side : -side, 0.07); hitShape(tt, e.atk * mul); sfx('whoosh'); sfx('heavy', 0.6);
        G.fx.push({ kind: 'arcwave', x: e.x, y: e.y - 6, ang: tt.ang, arc: tt.arc, r0: 18, r1: tt.r + 14, t: 0.25, max: 0.25, c: '230,220,210' });
        if (next) { const q = angTo(e, G.player); G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: q, r: 66, arc: 120 * DEG, t: 0, dur: 0.38, owner: e, onFire: cut(1.0, false) }); } else finish(0.6, rand(0.8, 1.2)); };
      G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: a, r: 66, arc: 120 * DEG, t: 0, dur: 0.55, owner: e, onFire: cut(0.9, true) });
    }
  }
  // 깃대 + 펄럭이는 깃발 천 (2px 칸): 붉은 천 · 금빛 왕관 문장 · 제비꼬리 끝
  function drawPole(x, y, ang, L, dir, white, al) {
    const ux = Math.cos(ang), uy = Math.sin(ang);
    ctx.save(); ctx.globalAlpha = al;
    const ex = x + ux * (L + 3), ey = y + uy * (L + 3), Q = pxLayer(Math.min(x, ex) - 40, Math.min(y, ey) - 40, Math.abs(ex - x) + 80, Math.abs(ey - y) + 80, false); // v1.17 한 장으로
    const K = [11, 10, 14], W = [255, 255, 255], C = (h) => white ? W : hexN(h);
    for (let i = -6; i <= L; i += 2) { const px = Math.round(x + ux * i) & ~1, py = Math.round(y + uy * i) & ~1; Q.rect(px - 1, py - 1, 4, 4, K[0], K[1], K[2], 1); }
    for (let i = -6; i <= L; i += 2) { const px = Math.round(x + ux * i) & ~1, py = Math.round(y + uy * i) & ~1, c = C((i / 2) % 6 === 0 ? '#3a2416' : '#6a4a2a'); Q.rect(px, py, 2, 2, c[0], c[1], c[2], 1); }
    const tx = Math.round(x + ux * (L + 3)) & ~1, ty = Math.round(y + uy * (L + 3)) & ~1; Q.rect(tx - 3, ty - 3, 8, 8, K[0], K[1], K[2], 1); { const c = C('#e8c060'); Q.rect(tx - 1, ty - 1, 4, 4, c[0], c[1], c[2], 1); }
    // 천: 깃대 위쪽에서 뒤쪽(dir)으로, 아래로 늘어지며 펄럭
    const ax = x + ux * (L - 4), ay = y + uy * (L - 4), CW = 9, CH = 12, CROWN = { '1,3': 1, '1,5': 1, '1,7': 1, '2,3': 1, '2,4': 1, '2,5': 1, '2,6': 1, '2,7': 1 };
    for (let cx = 0; cx < CW; cx++) for (let cy = 0; cy < CH; cy++) {
      if (cy >= CH - 2 && cx >= 3 && cx <= 5 && cy - (CH - 2) >= Math.abs(cx - 4) - 0) continue; // 제비꼬리
      const wv = Math.round(Math.sin(time * 5 + cx * 0.7) * cx * 0.22) * 2, px = (Math.round(ax) & ~1) + dir * (cx * 2 + 2), py = (Math.round(ay) & ~1) + cy * 2 + wv;
      const edge = cx === CW - 1 || cy === 0 || cy === CH - 1, crown = CROWN[(cy - 2) + ',' + (cx + 1)];
      const c = C(edge ? '#2a0a0e' : crown ? '#e8c060' : (cx + cy) % 5 === 0 ? '#4a0e14' : cx < 2 ? '#a32a2a' : '#8a1a22'); Q.rect(px, py, 2, 2, c[0], c[1], c[2], 1);
    }
    Q.flush();
    ctx.restore();
  }
  function drawBearer(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0, bob = e.state === 'chase' ? Math.sin(e.walk) * 0.8 : 0;
    const by = e.y + 2 + ya + bob, shY = by - 25, fx = e.x + e.face * 9, bx = e.x - e.face * 9, hx = fx + Math.cos(e.bladeAng) * 11, hy = shY + Math.sin(e.bladeAng) * 11;
    const behind = !e.sw && Math.cos(e.bladeAng) * e.face < -0.2;
    drawShadow(e.x, e.y + 2, 15);
    drawArm(bx, shY, (e.face > 0 ? 100 : 80) * DEG, 16, 5, white, true, 'bearer');
    const weapon = () => { if (!e.flagRef) drawPole(hx, hy, e.bladeAng, 60, -e.face, white, al); else drawBlade(BLADES.bsword, hx, hy, e.bladeAng, al, white); };
    if (behind) weapon();
    if (e.flagRef) drawTrail(e.trail, hx, hy, 8, BLADES.bsword.reach, '230,220,210'); else drawTrail(e.trail, hx, hy, 10, 60, '230,200,160');
    drawSprite('bearer', 'bearer', 2, e.x, by, flip, { white, rot: e.lean + (e.grogiT > 0 ? 0.25 * e.face : 0), alpha: al });
    drawArm(fx, shY, e.bladeAng, 11, 5, white, false, 'bearer');
    if (!behind) weapon();
    if (e.grogiT > 0) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(by - 60 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); } }
  }
  // 꽂힌 깃발: 주변 170px 기사단 집결 (바닥에 금빛 범위 고리)
  const FLAG_R = 170;
  function flagTick(f, dt) {
    for (const o of G.enemies) if (!o.dead && o !== f && o.type !== 'flag' && o.type !== 'boss' && Math.hypot(o.x - f.x, o.y - f.y) < FLAG_R) { if (!o.rallied) { o.atkBase = o.atk; o.atk *= 1.2; o.rallied = true; } o.rallyT = 0.3; }
  }
  function drawFlagEnt(f, ya, al) {
    const white = f.flash > 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; // 범위 고리 (바닥)
    const n = 110, ry = FLAG_R * 0.45; for (let i = 0; i < n; i++) { if (i % 6 === 0) continue; const t = i / n * TAU + time * 0.35; ctx.fillStyle = `rgba(255,205,90,${0.32 + 0.12 * Math.sin(time * 3 + i)})`; ctx.fillRect(Math.round(f.x + Math.cos(t) * FLAG_R) & ~1, Math.round(f.y + Math.sin(t) * ry) & ~1, 2, 2); }
    ctx.restore();
    drawShadow(f.x, f.y + 1, 7);
    ctx.fillStyle = '#0b0a0e'; ctx.fillRect((Math.round(f.x) & ~1) - 5, (Math.round(f.y) & ~1) - 1, 12, 4); ctx.fillStyle = '#5a5e68'; ctx.fillRect((Math.round(f.x) & ~1) - 3, (Math.round(f.y) & ~1), 8, 2); // 꽂힌 자리 돌
    drawPole(f.x, f.y + ya, -90 * DEG, 66, -(f.face || 1), white, al);
  }
  const isEliteT = t => t === 'butcher' || t === 'gbrute' || t === 'boar' || t === 'hob' || t === 'mother' || t === 'urg' || t === 'troll' || t === 'exec' || t === 'bearer';
  const isElite = e => isEliteT(e.type);
  const ELITE_NAMES = { gbrute: '거대 고블린', boar: '가시등 멧돼지', hob: '고블린 대장', butcher: '누더기 거인', mother: '역병 어미', exec: '기사단 처형인', bearer: '타락한 기수', urg: '투기장 챔피언 우르그', troll: '사슬 풀린 트롤 그러크' };
  const eliteName = e => ELITE_NAMES[e.kind === 'hob' ? 'hob' : e.type];
  const ELITE_TOP = { gbrute: 58, boar: 48, hob: 50, butcher: 52, mother: 58, exec: 56, bearer: 62 }; // 머리 위 (이름표·HP 막대 높이)
  const SEMI_T = new Set(['ocharge', 'otroll', 'ogrip']), isSemi = e => SEMI_T.has(e.type);
  // 바닥 꾸미기 중(DEC)에는 서 있는 장식(바위·그루터기·통나무·뼈·깔개 등)이 장애물·소품·중요 지점·서로와 겹치지 않게 건너뛴다 (v0.59)
  let DEC = null;
  const rectHit = (a, b, m = 0) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;
  function propRect(p) { const sp = PROPS[p.name]; if (sp.pit || !PROP_MAPS[p.name]) { const w = sp.w || (sp.r || 8) * 2, h = sp.h || (sp.r || 8) * 2; return { x0: p.x - w / 2, y0: p.y - (sp.pit ? h / 2 : h), x1: p.x + w / 2, y1: p.y + (sp.pit ? h / 2 : 0) }; } const c = propCanvas(p.name), x = (p.x - c.width / 2) & ~1, y = (p.y - c.height + (sp.foot || 0) * 2) & ~1; return { x0: x, y0: y, x1: x + c.width, y1: y + c.height }; }
  function decBlock(cv, x, y, w, h) {
    if (!DEC || cv !== DEC.g || w * h < 160) return false;
    const me = { x0: x, y0: y, x1: x + w, y1: y + h };
    if (DEC.solid.some(a => rectHit(me, a, 4)) || DEC.rects.some(a => rectHit(me, a, 2))) return true;
    DEC.rects.push(me); return false;
  }
  function withDecor(g, R, fn) {
    if (!R) return fn();
    const solid = [];
    for (const sp of R.sprites || []) solid.push({ x0: sp.x, y0: sp.y, x1: sp.x + sp.cv.width, y1: sp.y + sp.cv.height });
    for (const b of R.obs || []) if (!b.c) solid.push({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 }); else solid.push({ x0: b.x - b.r, y0: b.y - b.r, x1: b.x + b.r, y1: b.y + b.r });
    for (const p of R.props || []) solid.push(propRect(p));
    const key = (x, y, r) => solid.push({ x0: x - r, y0: y - r, x1: x + r, y1: y + r });
    for (const d in R.doors) if (R.doors[d] != null) { const q = doorIn(d, 34); key(q.x, q.y, 30); }
    if (R.tele) key(R.tele.x, R.tele.y, 42); if (R.chest) key(R.chest.x, R.chest.y, 30); if (R.shop) for (const q of R.shop) key(q.x, q.y, 24);
    if (R.bridges) for (const q of R.bridges) key(q.x, q.y, 26);
    key(CX, CY - 10, CLEAR_R - 8);
    DEC = { g, solid, rects: [] };
    try { fn(); } finally { DEC = null; }
  }
  function stamp(g, map, pal, x, y, sc = 2, flip) {
    const w = map[0].length;
    if (DEC && decBlock(g, x, y, w * sc, map.length * sc)) return;
    map.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { const ch = r[xx]; if (ch === '.' || !pal[ch]) continue; g.fillStyle = pal[ch]; g.fillRect(Math.round(x + (flip ? w - 1 - xx : xx) * sc), Math.round(y + yy * sc), sc, sc); } });
  }
  const DECO_MAPS = {
    rockA: ['..kkkkk..', '.kGGggdk.', 'kGGgggddk', 'kGgggdddk', 'kggMmdddk', 'kmmmMdDDk', '.kkkkkkk.'],
    rockB: ['.kkkkk.', 'kGgggdk', 'kgggddk', '.kkkkk.'],
    rockC: ['.kk..kk.', 'kGgk.kGk', 'kddk.kdk', '.kk.kkk.', '...kGgk.', '...kkkk.'],
    rockD: ['..kkk..', '.kMmmk.', 'kMmGgdk', 'kmGggdk', 'kGggddk', 'kggdddk', 'kgdddDk', 'kmdDDmk', '.kkkkk.'],
    rune: ['.kkkk.', 'kGggdk', 'kGgddk', 'kgrrdk', 'kgdrdk', 'kgrrdk', 'kgddDk', 'kgdrdk', 'kgddDk', 'kmmdDk', 'kMmmmk', 'kkkkkk'],
    stump: ['.kkkkkk.', 'kwbwwbwk', 'kbwBBwbk', 'kBbbbbBk', 'kBbBbbBk', 'kkBkkBkk'],
    log: ['.kkkkkkkkkkkk.', 'kbbbBbbbbBbkwk', 'kBbbbbBbbbbkbk', 'kbBbbbbbBbbkwk', '.kkkkkkkkkkkk.'],
    bush: ['...kkkk...', '.kkmMMmkk.', 'kmMMmrMmmk', 'kmMrmmMmrk', 'kmmmMmmrmk', '.kmmmmmmk.', '..kkkkkk..'],
    scarecrow: ['....kkk....', '...ksssk...', '..kskSksk..', '..ksssssk..', '..kSkkkSk..', '...ksssk...', 'kkkkkbkkkkk', 'kcCcCbcCcCk', '.kcCcbcCck.', '..kCcbcCk..', '..kcCbCck..', '...kCbCk...', '...kcbck...', '....kbk....', '....kbk....', '....kbk....', '...kkbkk...', '..kkkkkkk..'],
    tuft1: ['.m.m.', 'mMmMm', '.mmm.'], tuft2: ['M...M', '.m.m.', 'mmMmm'], tuft3: ['..M..', '.mMm.', 'm.m.m'],
    flowerY: ['.y.y.', 'yoymy', '.m.m.'], flowerP: ['p...p', '.p.p.', '.mpm.'], flowerW: ['.W.W.', 'WoW.W', '.m.m.'],
    shroom: ['.kkk.', 'kRWRk', 'kRRRk', 'kkkkk', '.kwk.', '.kkk.'],
    rockBig: ['....kkkkk.....', '..kkGGGggkk...', '.kGGGGgggddk..', 'kGGGgggggdddk.', 'kGGgggggddddkk', 'kgggggggdddDDk', 'kMmgggggddDDDk', 'kmMmmgggdDDDmk', '.kmMmmmmmmmmk.', '..kkkkkkkkkk..'],
    fenceA: ['.kk........', 'kwbk.......', 'kbBk.......', 'kbBkkkkkkkk', 'kbBkwbbwbbk', 'kbBkkkkkkkk', 'kbBk.......', 'kbBkkkkkkkk', 'kbBkbbwbbbk', 'kbBkkkkkkkk', 'kbBk.......', 'kkkk.......'],
    fenceB: ['.kk........', 'kwbk.......', 'kbBk.......', 'kbBkkkkkkkk', 'kbBkwbbwbbk', 'kbBkkkkkkkk', 'kbBk.......', 'kbBkkkkk...', 'kbBkbbwk.k.', 'kbBkkkk..kk', 'kbBk.......', 'kkkk.......'],
    fenceC: ['.kk........', 'kwbk.......', 'kbBk.......', 'kbBkkkkkkkk', 'koookbbwbbk', 'kooBkkkkkkk', 'kbBk.......', 'kbBkkkkkkkk', 'kbBkbbwbbbk', 'kbBkkkkkkkk', 'kbBk.......', 'kkkk.......'],
    fenceD: ['.kk..', 'kwbk.', 'kbBk.', 'kbBk.', 'kbBk.', 'kbBk.', 'kbBk.', 'kbBkk', 'kbBkk', 'kbBk.', 'kbBk.', 'kkkk.'],
    fenceV: ['.kk.', 'kwbk', 'kbBk', 'kbBk', 'kkkk', '.kb.', '.kw.', '.kb.', '.kb.', '.kw.', '.kb.'],
    fenceVo: ['.kk.', 'kwbk', 'kooo', 'kbBk', 'kkkk', '.kb.', '.kw.', '.kb.', '.kb.', '.kw.', '.kb.'],
    boulder: ['..kkkkk..', '.kGGggdk.', 'kGGgggddk', 'kGgggdddk', 'kgggddddk', 'kgddddDDk', '.kkkkkkk.'],
  };
  const DECO = { k: '#121214', G: '#b0aeb4', g: '#7c7a82', d: '#4c4a52', D: '#34323a', m: '#3e6a2c', M: '#6a9a44', r: '#b03030',
    w: '#8a6a48', b: '#6a4a30', B: '#4a3220', o: '#c8b080', s: '#a08a5a', S: '#6a5a3a', c: '#5a3a5a', C: '#3a2a3a',
    y: '#e8d040', p: '#b080e0', W: '#f0ece0', R: '#a83030' };
  PAL.deco = DECO;
  MAPS.boulder = DECO_MAPS.boulder;
  const WOOD = [{ w: '#8a6a48', b: '#6a4a30', B: '#4a3220' }, { w: '#7a5e40', b: '#5a3e28', B: '#3e2a1a' }, { w: '#968060', b: '#6e5a40', B: '#4a3c2a' }];
  const woodPal = () => Object.assign({}, DECO, pick(WOOD));

  // ---------- 초원 위쪽 숲: 나무를 도트로 생성 (둥근 활엽수 · 전나무 · 자작나무 · 고사목 · 단풍)
  const TREE_PAL = {
    green: { D: '#0e200c', d: '#1a3a16', l: '#2e5a22', h: '#4a7e30' },
    deep: { D: '#081610', d: '#10281a', l: '#1c4026', h: '#2c5a34' },
    autumn: { D: '#3a140c', d: '#6a2a12', l: '#a04a1a', h: '#d8883a' },
    gold: { D: '#3a2a0c', d: '#6a5014', l: '#a08020', h: '#d8c050' },
    dusk: { D: '#16122a', d: '#261e40', l: '#3a3060', h: '#584a84' },
    birch: { D: '#1e3010', d: '#36561c', l: '#5a8a2c', h: '#8ab84a' },
  };
  const TRUNK = { k: '#07070a', t: '#3a2a1c', T: '#22180e', w: '#d8d0c0', x: '#2a2420', c: '#0b0a0e', e: '#c03030' };
  function genTree(kind) {
    const Wd = kind === 'pine' ? 17 : kind === 'dead' ? 19 : kind === 'birch' ? 15 : 21, Ht = kind === 'pine' ? 34 : kind === 'dead' ? 28 : kind === 'birch' ? 32 : 30;
    const g = Array.from({ length: Ht }, () => Array(Wd).fill('.')), cx = Math.floor(Wd / 2);
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < Wd && y >= 0 && y < Ht) g[y][x] = c; };
    const shade = (dx, dy, r) => { const v = (dx + dy) / (r * 1.4) + rand(-0.25, 0.25); return v < -0.55 ? 'h' : v < -0.05 ? 'l' : v < 0.5 ? 'd' : 'D'; };
    if (kind === 'dead') {
      const branch = (x, y, ang, len, dep) => {
        for (let i = 0; i < len; i++) { set(x, y, dep > 2 ? 't' : (i % 3 ? 't' : 'T')); if (dep > 2) set(x + 1, y, 'T'); x += Math.cos(ang); y += Math.sin(ang); }
        if (dep <= 0) return;
        branch(x, y, ang - rand(0.35, 0.7), len * rand(0.55, 0.75), dep - 1);
        branch(x, y, ang + rand(0.35, 0.7), len * rand(0.55, 0.75), dep - 1);
      };
      branch(cx, Ht - 1, -Math.PI / 2 + rand(-0.1, 0.1), 11, 3);
      set(cx - 2, Ht - 1, 'T'); set(cx + 2, Ht - 1, 'T');
      if (Math.random() < 0.6) { const by = randi(6, 12); for (let x = 0; x < Wd; x++) if (g[by][x] === 't' || g[by][x] === 'T') { set(x, by - 1, 'c'); set(x + 1, by - 1, 'c'); set(x, by - 2, 'c'); set(x + 1, by - 2, 'e'); break; } } // 까마귀
    } else if (kind === 'pine') {
      for (let y = Ht - 7; y < Ht; y++) { set(cx, y, 't'); set(cx + 1, y, 'T'); }
      for (let tier = 0; tier < 5; tier++) {
        const top = 1 + tier * 5, h = 9;
        for (let y = 0; y < h; y++) { const hw = Math.floor((y + 1) * (0.55 + tier * 0.08)); for (let x = -hw; x <= hw; x++) set(cx + x, top + y, x < -hw / 3 ? (y < 3 ? 'h' : 'l') : x < hw / 3 ? 'd' : 'D'); }
      }
    } else {
      const birch = kind === 'birch';
      const tH = birch ? 14 : 10;
      for (let y = Ht - tH; y < Ht; y++) { set(cx, y, birch ? 'w' : 't'); set(cx + 1, y, birch ? (y % 4 === 0 ? 'x' : 'w') : 'T'); if (!birch) set(cx - 1, y, 't'); if (birch && y % 5 === 2) set(cx, y, 'x'); }
      if (!birch) { set(cx - 2, Ht - 1, 't'); set(cx + 2, Ht - 1, 'T'); set(cx + 3, Ht - 1, 'T'); }
      const blobs = [], n = birch ? 3 : randi(4, 6);
      for (let i = 0; i < n; i++) blobs.push({ x: cx + rand(-5, 5) * (birch ? 0.6 : 1), y: rand(6, Ht - tH - 2), r: birch ? rand(3.5, 5) : rand(4.5, 7.5) });
      for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) for (const b of blobs) {
        const dx = x - b.x, dy = y - b.y;
        if (dx * dx + dy * dy <= b.r * b.r) { set(x, y, shade(dx, dy, b.r)); break; }
      }
      if (!birch) for (let i = 0; i < 3; i++) set(cx + randi(-1, 2), Ht - tH - randi(0, 2), 'T'); // 가지 틈
    }
    // 윤곽선
    const out = g.map(r => r.slice());
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wd; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g[y + b] && g[y + b][x + a] && g[y + b][x + a] !== '.')) out[y][x] = 'k';
    return out.map(r => r.join(''));
  }
  const mixHex = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A1 = p(a), B1 = p(b); return '#' + A1.map((v, i) => Math.round(v + (B1[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  // 숲과 풀밭이 만나는 곳: 들쭉날쭉한 디더링 그늘 (나무보다 먼저)
  function paintForestShadow(g) {
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let x = 0; x < W; x += 2) {
      const depth = 30 + Math.sin(x * 0.045) * 8 + Math.sin(x * 0.13 + 1) * 5 + rand(-3, 3);
      for (let y = A.y0 - 30; y < A.y0 + depth; y += 2) {
        const t = (y - (A.y0 - 30)) / (depth + 30), lv = Math.pow(1 - t, 1.3) * 0.95;
        if (lv * 16 > B[((y >> 1) & 3) * 4 + ((x >> 1) & 3)]) { g.fillStyle = t < 0.35 ? '#0a1408' : '#12200e'; g.fillRect(x, y, 2, 2); }
      }
    }
  }
  // 나무 밑동 앞쪽 덤불·고사리·키 큰 풀·뿌리 (나무 다음에)
  function paintUndergrowth(g) {
    for (let x = -10; x < W; x += randi(10, 22)) {
      const y = A.y0 + randi(-4, 16), r = Math.random();
      if (r < 0.3) stamp(g, DECO_MAPS.bush, Object.assign({}, DECO, { m: pick(['#1e3a18', '#24401c']), M: pick(['#2e5222', '#36602a']), r: pick(['#8a2030', '#5a3a7a', '#2e5222']) }), x, y - 6, 2, Math.random() < 0.5);
      else if (r < 0.55 && G) gPaint(g, genFern(), { m: '#24401c', M: '#3e6a2c', d: '#16280f' }, x - 8, y - 14);
      else if (r < 0.85) stamp(g, DECO_MAPS[pick(['tuft1', 'tuft2', 'tuft3'])], Object.assign({}, DECO, { m: '#2e5222', M: '#4a7a34' }), x, y, 2, Math.random() < 0.5);
      else { g.fillStyle = '#22180e'; for (let k = 0; k < randi(3, 6); k++) g.fillRect((x + k * 2) & ~1, (y + (k % 2) * 2) & ~1, 2, 2); }
    }
  }
  function paintTreeline(g) {
    const row = (yBase, dim, step) => {
      for (let x = -20; x < W + 20; x += randi(step[0], step[1])) {
        const r = Math.random(), kind = r < 0.38 ? 'round' : r < 0.66 ? 'pine' : r < 0.82 ? 'birch' : 'dead';
        const palK = kind === 'pine' ? (Math.random() < 0.5 ? 'deep' : 'green') : kind === 'birch' ? 'birch' : kind === 'dead' ? 'green' : pick(['green', 'green', 'deep', 'autumn', 'gold', 'dusk']);
        const map = genTree(kind), pal = Object.assign({}, TRUNK, TREE_PAL[palK]);
        if (dim) for (const k in pal) pal[k] = mixHex(pal[k], '#140e22', dim);
        const sc = 2, h = map.length * sc, y = yBase - h + randi(-6, 6);
        stamp(g, map, pal, x - map[0].length, y, sc, Math.random() < 0.5);
      }
    };
    row(A.y0 - 26, 0.5, [16, 26]);   // 뒷줄 (어둡게 깔린다)
    row(A.y0 + 4, 0, [26, 40]);      // 앞줄
    // 뿌리 쪽 덤불과 풀
    for (let x = 0; x < W; x += randi(10, 18)) stamp(g, DECO_MAPS[pick(['bush', 'tuft1', 'tuft2', 'tuft3'])], Object.assign({}, DECO, { m: '#1e3a18', M: '#2e5222', r: pick(['#8a2030', '#4a3070']) }), x, A.y0 - 2 + randi(-3, 3), 2, Math.random() < 0.5);
  }
  function paintMeadowProps(g) {
    if (G) withDecor(g, CUR_ROOM, () => paintMeadowDecor(g, CUR_ROOM));
    // 울타리: 아래쪽 가로 울타리 (구간마다 모양이 다르다)
    const DR = CUR_ROOM && G ? CUR_ROOM.doors : {};
    for (let x = A.x0 - 6; x < A.x1; x += 22) {
      if (DR.s != null && x + 22 > DOOR.s.x - 22 && x < DOOR.s.x + 22) continue;
      const r = Math.random(), m = r < 0.6 ? 'fenceA' : r < 0.78 ? 'fenceB' : r < 0.92 ? 'fenceC' : 'fenceD';
      stamp(g, DECO_MAPS[m], woodPal(), x, A.y1 - 16, 2);
      if (Math.random() < 0.6) stamp(g, DECO_MAPS[pick(['tuft1', 'tuft2'])], DECO, x + rand(-2, 4), A.y1 + 2, 2);
    }
    // 양옆 세로 울타리
    for (let y = A.y0 + 8; y < A.y1 - 20; y += 22) for (const x of [A.x0 - 10, A.x1 + 2]) {
      if (((x < CX && DR.w != null) || (x > CX && DR.e != null)) && y + 22 > CY - 24 && y < CY + 24) continue;
      stamp(g, DECO_MAPS[Math.random() < 0.2 ? 'fenceVo' : 'fenceV'], woodPal(), x, y, 2);
    }
    // 문 자리 양 끝 기둥
    if (DR.s != null) { stamp(g, DECO_MAPS.fenceD, woodPal(), DOOR.s.x - 32, A.y1 - 16, 2); stamp(g, DECO_MAPS.fenceD, woodPal(), DOOR.s.x + 22, A.y1 - 16, 2); }
  }

  // ---------- 독 (플레이어 상태이상)
  function poisonPlayer(dur, dmg) {
    const P = G.player; if (P.dead) return;
    P.poisonT = Math.max(P.poisonT || 0, dur); P.poisonDmg = Math.max(1, Math.round(dmg)); P.poisonTick = P.poisonTick > 0 ? P.poisonTick : 0.5;
    for (let i = 0; i < 10; i++) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(4, 18), vx: rand(-20, 20), vy: rand(-40, -10), t: rand(0.3, 0.6), c: pick(['#b070e0', '#8ae050']), g: 0, glow: true });
  }
  function updatePoison(dt) {
    const P = G.player; if (!(P.poisonT > 0) || P.dead) return;
    P.poisonT -= dt; P.poisonTick -= dt;
    if (Math.random() < dt * 10) G.parts.push({ x: P.x + rand(-6, 6), y: P.y - rand(2, 20), vx: rand(-4, 4), vy: rand(-30, -14), t: rand(0.3, 0.6), c: pick(['#b070e0', '#8ae050', '#6a3a8a']), g: 0, glow: Math.random() < 0.5 });
    if (P.poisonTick <= 0) { P.poisonTick = 0.5; hurtPlayer(P.poisonDmg, null, false, true); }
  }
  // 포물선으로 날아가는 투척물 (바위·독액). d0 이전에는 아직 손에 들고 있다
  // 크루가쉬 십자·X 공격의 솟는 바위 가시 (v0.81): 2px 칸 도트, 검은 외곽선, 왼쪽 위 빛 4단계 명암
  const ROCK_PAL = { k: '#140c08', h: '#c8a882', l: '#946e50', m: '#6a4c3a', d: '#3e2a20', c: '#24160f' };
  function genRockSpike(v) {
    let seed = 7 + v * 131; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const W = 30, H = 30, g = mkGrid(W, H), base = H - 2;
    const shard = (cx, h, w, lean) => {
      for (let r = 0; r <= h; r++) {
        const t = r / h, hw = Math.max(0.6, (w / 2) * Math.pow(t, 0.75)) + (r > 3 && rnd() < 0.18 ? (rnd() < 0.5 ? -0.7 : 0.7) : 0), c = cx + lean * (1 - t) * h, y = base - h + r;
        for (let x = Math.floor(c - hw); x <= Math.ceil(c + hw); x++) {
          if (x < 1 || x >= W - 1 || y < 1 || Math.abs(x - c) > hw) continue;
          const rel = (x - c) / Math.max(1, hw);
          g[y][x] = rel < -0.45 ? 'l' : rel > 0.35 ? 'd' : 'm';
          if (rel < -0.45 && x <= c - hw + 1 && r < h * 0.7) g[y][x] = 'h';
          if (r > 3 && Math.abs(rel) < 0.3 && rnd() < 0.08) g[y][x] = 'c';
        }
      }
    };
    const hs = [[25, 22, 26, 20][v], [13, 16, 11, 15][v], [9, 7, 12, 10][v]];
    shard(9, hs[1], 9, -0.3); shard(22, hs[2], 8, 0.34); shard(15, hs[0], 12, rnd() * 0.14 - 0.07);
    // 밑동의 잔돌
    for (const [x, y] of [[3, base], [4, base], [4, base - 1], [26, base], [27, base], [26, base - 1]]) g[y][x] = 'd';
    return gOutline(g);
  }
  function drawRockSpike(f, p) {
    const spr = art('rspk' + f.v, () => gCanvas(genRockSpike(f.v), ROCK_PAL)), W = spr.width, H = spr.height, bx = Math.round(f.x) & ~1, by = Math.round(f.y) & ~1;
    // 솟기: 0~0.07 쑥 올라오며 살짝 튀었다 자리 잡고, 0.72부터 바스러지며 땅속으로 가라앉는다
    const up = p < 0.07 ? easeOut(p / 0.07) * 1.12 : p < 0.13 ? 1.12 - (p - 0.07) / 0.06 * 0.12 : p < 0.72 ? 1 : Math.max(0, 1 - (p - 0.72) / 0.28);
    const vis = Math.min(H, Math.round(H * up / 2) * 2);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx - 14, by - 2, 28, 4); ctx.fillRect(bx - 10, by - 4, 20, 2); ctx.fillRect(bx - 10, by + 2, 20, 2);
    if (p < 0.2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,110,40,${0.55 * (1 - p / 0.2)})`; ctx.fillRect(bx - 12, by - 4, 24, 6); ctx.restore(); }
    if (vis > 0) {
      ctx.save(); if (f.fl) { ctx.translate(bx * 2, 0); ctx.scale(-1, 1); }
      const sh = p < 0.07 ? Math.round((1 - p / 0.07) * 2) * 2 * (((p * 60) | 0) & 1 ? 1 : -1) : 0;
      if (p > 0.72) { // 바스러짐: 2px 디더로 구멍이 점점 늘어난다
        const k = (p - 0.72) / 0.28; ctx.beginPath();
        for (let y = by - vis + 2; y < by + 2; y += 2) for (let x = bx - W / 2; x < bx + W / 2; x += 2) if (!dith(x >> 1, y >> 1, k * 0.95)) ctx.rect(x, y, 2, 2);
        ctx.clip();
      }
      ctx.drawImage(spr, 0, 0, W, vis, bx - W / 2 + sh, by - vis + 2, W, vis);
      ctx.restore();
    }
    // 튀는 돌조각 (외곽선 있는 4px 덩이)
    if (p < 0.45) { let sd = f.sd | 0; const rnd = () => (sd = (sd * 16807 + 11) % 2147483647) / 2147483647, tt = p * f.max;
      for (let i = 0; i < 5; i++) { const vx = (rnd() - 0.5) * 140, vy = -(70 + rnd() * 110), x = Math.round((bx + vx * tt) / 2) * 2, y = Math.round((by - 14 + vy * tt + 380 * tt * tt) / 2) * 2; if (y > by + 4) continue;
        ctx.fillStyle = '#140c08'; ctx.fillRect(x - 2, y - 2, 8, 8); ctx.fillStyle = i % 2 ? '#7c604a' : '#ae8e6c'; ctx.fillRect(x, y, 4, 4); ctx.fillStyle = i % 2 ? '#4c3829' : '#e2ccaa'; ctx.fillRect(i % 2 ? x + 2 : x, i % 2 ? y + 2 : y, 2, 2); }
    }
  }
  function drawLob(f, p) {
    const k = (p - (f.d0 || 0)) / (1 - (f.d0 || 0)); if (k < 0) return;
    const x = f.x0 + (f.x1 - f.x0) * k, gy = f.gy0 + (f.y1 - f.gy0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * f.h;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, gy, f.rock ? 8 : 4, f.rock ? 3 : 1.5, 0, 0, TAU); ctx.fill();
    if (f.rock) { drawSprite('boulder', 'deco', 2, x, y + 7, false, { rot: k * 6 }); return; }
    if (f.meat) { // 관중의 선물: 빙글빙글 도는 뼈 달린 고깃덩이
      const X = Math.round(x) & ~1, Y = Math.round(y) & ~1, fl = Math.floor(k * 8) % 2;
      ctx.fillStyle = '#0b0806'; ctx.fillRect(X - 6, Y - 6, 12, 10); ctx.fillRect(fl ? X + 4 : X - 10, Y - 2, 8, 4);
      ctx.fillStyle = '#a83a2a'; ctx.fillRect(X - 4, Y - 4, 8, 6); ctx.fillStyle = '#d86a4a'; ctx.fillRect(X - 4, Y - 4, 4, 2); ctx.fillStyle = '#6a1a12'; ctx.fillRect(X, Y, 4, 2);
      ctx.fillStyle = '#ece0c4'; ctx.fillRect(fl ? X + 4 : X - 8, Y - 2, 4, 2); ctx.fillRect(fl ? X + 6 : X - 10, Y, 2, 2); return; }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(170,90,230,.45)'; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#120816'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8a4aa0'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#9ae060'; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 2, 2);
    if (Math.random() < 0.6) G.parts.push({ x, y, vx: rand(-10, 10), vy: rand(10, 30), t: 0.3, c: pick(['#b070e0', '#8ae050']), g: 60, glow: true });
  }

  // ---------- 독침 슬라임
  function updateToxSlime(e, dt, d, a) {
    const P = G.player;
    if (e.state === 'chase') {
      if (e.hop) stepHop(e, dt);
      else if (e.cd <= 0 && d < 240 && d > 40) {
        e.state = 'spit'; e.t = 0.6; e.holdMax = 0.6; e.face = Math.cos(a) > 0 ? 1 : -1;
        const tx = clamp(P.x, A.x0 + 10, A.x1 - 10), ty = clamp(P.y, A.y0 + 10, A.y1 - 10), dur = 1.15;
        G.fx.push({ kind: 'lob', x0: e.x, y0: e.y - 12, gy0: e.y, x1: tx, y1: ty, h: 46, d0: 0.5, t: dur, max: dur, owner: e });
        G.tele.push({ shape: 'circle', x: tx, y: ty, r: 26, t: 0, dur, owner: e,
          onFire: tt => {
            const P2 = G.player;
            if (!P2.dead && inShape(tt, P2.x, P2.y, P2.r)) { const hp0 = P2.hp; hurtPlayer(e.atk, e); if (P2.hp < hp0) poisonPlayer(4, e.atk * 0.3); }
            G.fx.push({ kind: 'ring', x: tt.x, y: tt.y, r: 4, grow: 140, t: 0.25, max: 0.25, c: '#c890ff' });
            for (let i = 0; i < 14; i++) { const aa = rand(0, TAU), sp = rand(30, 110); G.parts.push({ x: tt.x, y: tt.y - 4, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.5 - 40, t: rand(0.3, 0.6), c: pick(['#8a4aa0', '#b070e0', '#8ae050']), g: 220, floor: tt.y + rand(-4, 6) }); }
            splat(tt.x, tt.y, 16, '80,30,90'); sfx('hit');
          } });
      } else {
        e.hopT = (e.hopT || 0) - dt;
        if (e.hopT <= 0) {
          e.hopT = rand(0.35, 0.7);
          const ang = d < 90 ? a + Math.PI + rand(-0.5, 0.5) : d > 170 ? a + rand(-0.4, 0.4) : a + Math.PI / 2 * (Math.random() < 0.5 ? 1 : -1);
          e.hop = { t: 0, dur: 0.42, ang: steer(e, ang), sp: e.spd, h: 7 };
        }
      }
    } else if (e.state === 'spit') {
      if (e.t <= 0) { e.state = 'recover'; e.t = 0.45; e.cd = rand(2.4, 3.2); e.squash = 0.18; sfx('swing'); }
    }
  }

  // ---------- 엘리트: 거대 고블린
  function bruteTick(e, dt) {
    e.rockT = Math.max(0, (e.rockT || 0) - dt); e.slamT = Math.max(0, (e.slamT || 0) - dt); e.beatT = Math.max(0, (e.beatT || 0) - dt);
    if (!e.enraged && e.hp < e.maxHp * 0.5 && !e.dead) {
      e.enraged = true; e.spd *= 1.2;
      G.fx.push({ kind: 'ring', x: e.x, y: e.y - 24, r: 8, t: 0.5, max: 0.5, c: '#ffb030', grow: 300 }); addShake(5); sfx('roar'); alertMark(e, 66, true);
    }
    if (e.enraged && Math.random() < 0.4) G.parts.push({ x: e.x + rand(-10, 10), y: e.y - rand(20, 44), vx: rand(-6, 6), vy: -rand(20, 40), t: 0.4, c: pick(['#ffb030', '#c0c0c0']), g: 0, glow: true });
  }
  function updateBrute(e, dt, d, a, moveTo) {
    const P = G.player;
    e.rallyT = (e.rallyT == null ? 7 : e.rallyT) - dt;
    if (e.state !== 'chase') return;
    if (d > 56) moveTo(a, e.spd);
    if (e.cd > 0) return;
    if (e.rallyT <= 0 && G.enemies.filter(x => !x.dead && x.type === 'goblin').length < 4) return bruteRally(e);
    if (d < 100) bruteQuake(e, a); else if (d < 290) bruteBoulder(e);
  }
  function bruteQuake(e, a) { // 지면 연쇄 강타: 앞으로 3~4번 땅이 터져 나간다
    const n = e.enraged ? 4 : 3;
    e.state = 'wind'; e.pose = 'up'; e.face = Math.cos(a) > 0 ? 1 : -1; e.lean = -0.15 * e.face; alertMark(e, 58); sfx('warn');
    for (let i = 0; i < n; i++) {
      const dd = 34 + i * 38, r = 28 + i * 4;
      G.tele.push({ shape: 'circle', x: e.x + Math.cos(a) * dd, y: e.y + Math.sin(a) * dd * 0.85, r, t: 0, dur: 0.85 + i * 0.17, owner: e, heavy: i === n - 1,
        onFire: tt => {
          if (i === 0) { e.pose = null; e.slamT = 0.25; e.lean = 0.25 * e.face; addShake(7); flashT = 0.04; flashColor = '#ffb030'; }
          hitShape(tt, e.atk * (i === 0 ? 1.15 : 0.9));
          G.fx.push({ kind: 'ring', x: tt.x, y: tt.y, r: 6, t: 0.35, max: 0.35, c: '#e0c080', grow: 200 });
          for (let k = 0; k < 4; k++) G.fx.push({ kind: 'arcwave', x: tt.x, y: tt.y, ang: k / 4 * TAU + rand(-0.3, 0.3), arc: 50 * DEG, r0: 6, r1: tt.r + 10, t: 0.25, max: 0.25, c: '230,190,110' });
          debris(tt.x, tt.y, 14); dust(tt.x, tt.y, 12); crack(tt.x, tt.y); sfx(i === n - 1 ? 'blast' : 'heavy'); addShake(4);
          if (i === n - 1) { e.state = 'recover'; e.t = 0.9; e.cd = rand(1.2, 1.8); }
        } });
    }
  }
  function bruteBoulder(e) { // 바위를 머리 위로 들어 던진다
    const P = G.player, n = e.enraged ? 2 : 1;
    e.state = 'wind'; e.pose = 'up'; alertMark(e, 58); sfx('warn');
    for (let j = 0; j < n; j++) {
      const tx = clamp(P.x + (j ? rand(-70, 70) : 0), A.x0 + 20, A.x1 - 20), ty = clamp(P.y + (j ? rand(-50, 50) : 0), A.y0 + 20, A.y1 - 20), dur = 1.35 + j * 0.45;
      e.rockT = dur * 0.5 + j * 0.45;
      G.fx.push({ kind: 'lob', x0: e.x, y0: e.y - 52, gy0: e.y, x1: tx, y1: ty, h: 80, d0: (dur * 0.5 + j * 0.2) / dur, t: dur, max: dur, rock: true, owner: e });
      G.tele.push({ shape: 'circle', x: tx, y: ty, r: 46, t: 0, dur, owner: e, heavy: true,
        onFire: tt => {
          hitShape(tt, e.atk * 1.2);
          G.fx.push({ kind: 'ring', x: tt.x, y: tt.y, r: 8, t: 0.4, max: 0.4, c: '#e0c080', grow: 240 });
          debris(tt.x, tt.y, 24); dust(tt.x, tt.y, 18); crack(tt.x, tt.y); addShake(7); sfx('blast');
          for (let k = 0; k < (e.enraged ? 8 : 6); k++) { const aa = k / (e.enraged ? 8 : 6) * TAU + rand(-0.15, 0.15); G.eproj.push({ x: tt.x, y: tt.y, ang: aa, sp: 170, r: 4, dmg: e.atk * 0.5, t: 0.8, hist: [], kind: 'rock' }); }
          if (j === n - 1) { e.state = 'recover'; e.t = 0.7; e.cd = rand(1.3, 1.9); e.pose = null; }
        } });
    }
  }
  function bruteRally(e) { // 가슴을 두드리며 고블린을 부르고 주변 고블린을 흥분시킨다
    e.rallyT = 16; e.state = 'recover'; e.t = 1.1; e.beatT = 1.1; e.cd = 0.6;
    sfx('roar'); addShake(5); alertMark(e, 66, true);
    G.fx.push({ kind: 'ring', x: e.x, y: e.y - 24, r: 10, t: 0.6, max: 0.6, c: '#ffb030', grow: 360 });
    for (let i = 0; i < 2; i++) queueSpawn('goblin', { x: clamp(e.x + rand(-90, 90), A.x0 + 20, A.x1 - 20), y: clamp(e.y + rand(-60, 60), A.y0 + 20, A.y1 - 20) });
    for (const g of G.enemies) if (!g.dead && g.type === 'goblin' && dist(g, e) < 260) { g.haste = 6; alertMark(g, 34); }
  }
  function drawBrute(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0;
    const up = (e.state === 'wind' && e.pose === 'up') || (e.beatT > 0 && Math.floor(time * 9) % 2 === 0);
    let sx = 1, sy = 1 + Math.sin(e.walk * 2) * 0.03, tr = 0;
    if (e.slamT > 0) { const k = e.slamT / 0.25; sy = 1 - 0.18 * k; sx = 1 + 0.14 * k; }
    if (up && e.glow > 0.6) tr = rand(-0.8, 0.8);
    drawShadow(e.x, e.y + 2, 20);
    drawSprite(up ? 'gbruteUp' : 'gbrute', 'gbrute', 2, e.x + tr, e.y + 2 + ya, flip, { white, rot: e.lean + (e.grogiT > 0 ? 0.25 * e.face : 0), alpha: al, sx, sy });
    if (e.rockT > 0 && !white) drawSprite('boulder', 'deco', 3, e.x + tr, e.y - 50, false);
    if (up && e.state === 'wind' && e.rockT <= 0) holdGlow(e.x, e.y - 52, e.glow, '255,180,60');
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = e.enraged ? 'rgba(255,120,40,.95)' : `rgba(255,220,60,${0.4 + 0.5 * e.glow})`;
    const ey = Math.round(e.y - 36 + ya); // 새 얼굴의 두 눈 (v0.61)
    for (const ox of up ? [-6, 2] : [-5, 3]) ctx.fillRect(Math.round(e.x + (flip ? -ox - 4 : ox)), ey, 4, 2);
    ctx.restore();
    if (e.grogiT > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(e.y - 58 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); }
  }

  // ---------- 엘리트: 가시등 멧돼지
  function boarTick(e, dt) {
    if (!e.enraged && e.hp < e.maxHp * 0.5 && !e.dead) {
      e.enraged = true; e.spd *= 1.2;
      G.fx.push({ kind: 'ring', x: e.x, y: e.y - 14, r: 8, t: 0.5, max: 0.5, c: '#ff4030', grow: 300 }); addShake(5); sfx('roar'); alertMark(e, 50, true);
    }
    if (e.state === 'wind' && e.pat === 'rush' && Math.random() < dt * 24) { dust(e.x - e.face * 10, e.y, 1); G.parts.push({ x: e.x - e.face * 12, y: e.y - 2, vx: -e.face * rand(30, 70), vy: -rand(20, 50), t: 0.3, c: '#5a4a36', g: 200 }); }
    if (e.enraged && Math.random() < 0.3) G.parts.push({ x: e.x + e.face * 18, y: e.y - 12, vx: e.face * 20, vy: -10, t: 0.35, c: '#c8c0c0', g: 0 });
  }
  function updateBoar(e, dt, d, a, moveTo) {
    const P = G.player;
    if (e.state === 'dash') {
      const sp = e.enraged ? 420 : 380;
      e.x += Math.cos(e.lockAng) * sp * dt; e.y += Math.sin(e.lockAng) * sp * dt;
      if (Math.random() < 0.8) dust(e.x - Math.cos(e.lockAng) * 10, e.y, 1);
      if (Math.random() < 0.5) G.fx.push({ kind: 'ghost', x: e.x, y: e.y, face: e.face, rot: 0, t: 0.18, max: 0.18, map: 'boar', pal: 'shadeBoar', sc: 2, glowy: true });
      if (!e.hitPlayer && dist(e, P) < e.r + P.r + 4) { e.hitPlayer = true; hurtPlayer(e.atk, e); }
      const wall = e.x < A.x0 + e.r + 1 || e.x > A.x1 - e.r - 1 || e.y < A.y0 + e.r + 1 || e.y > A.y1 - e.r - 1 || dashBlocked(e);
      if (e.t <= 0 || wall) {
        solveObs(e, e.r);
        e.x = clamp(e.x, A.x0 + e.r + 2, A.x1 - e.r - 2); e.y = clamp(e.y, A.y0 + e.r + 2, A.y1 - e.r - 2);
        dust(e.x, e.y, 10); addShake(wall ? 6 : 3, e.lockAng);
        if (wall) { debris(e.x, e.y, 12); sfx('blast'); G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 8, t: 0.35, max: 0.35, c: '#ff8060', grow: 200 }); }
        e.chargesLeft--;
        if (e.chargesLeft > 0) boarRush(e, angTo(e, P), e.chargesLeft, true);
        else { e.state = 'recover'; e.t = 1.1; e.cd = rand(1.4, 2.0); }
      }
      return;
    }
    if (e.state !== 'chase') return;
    if (d > 70) moveTo(a, e.spd); else moveTo(a + Math.PI / 2, e.spd * 0.5);
    if (e.cd > 0) return;
    if (d < 64) boarGore(e, a);
    else if (Math.random() < 0.4) boarQuills(e);
    else boarRush(e, a, e.enraged ? 4 : 3);
  }
  function boarRush(e, a, n, quick) { // 연속 돌진: 매번 방향을 다시 잡는다
    e.chargesLeft = n; e.state = 'wind'; e.pat = 'rush'; e.lockAng = a; e.face = Math.cos(a) > 0 ? 1 : -1;
    if (!quick) alertMark(e, 40); sfx('warn');
    G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 250, w: 24, t: 0, dur: quick ? 0.5 : 0.9, owner: e, heavy: true,
      onFire: () => { e.state = 'dash'; e.t = 0.66; e.hitPlayer = false; sfx('whoosh'); } });
  }
  function boarQuills(e) { // 등가시 난사
    e.state = 'wind'; e.pat = 'quill'; alertMark(e, 40); sfx('warn');
    G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 38, t: 0, dur: 0.85, owner: e,
      onFire: tt => {
        hitShape(tt, e.atk * 0.8);
        for (let ring = 0; ring < (e.enraged ? 2 : 1); ring++) for (let k = 0; k < 12; k++) { const aa = k / 12 * TAU + ring * TAU / 24; G.eproj.push({ x: e.x + Math.cos(aa) * 14, y: e.y + Math.sin(aa) * 10, ang: aa, sp: 210 - ring * 50, r: 3, dmg: e.atk * 0.6, t: 1.5, hist: [], kind: 'quill' }); }
        G.fx.push({ kind: 'ring', x: e.x, y: e.y - 10, r: 6, t: 0.3, max: 0.3, c: '#f0e8d0', grow: 200 }); addShake(4); sfx('heavy');
        e.state = 'recover'; e.t = 0.7; e.cd = rand(1.2, 1.8);
      } });
  }
  function boarGore(e, a) { // 엄니 올려치기
    e.state = 'wind'; e.pat = 'gore'; e.face = Math.cos(a) > 0 ? 1 : -1; e.lean = 0.2 * e.face; sfx('warn');
    G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: a, arc: 100 * DEG, r: 56, t: 0, dur: 0.6, owner: e,
      onFire: tt => {
        e.x += Math.cos(tt.ang) * 16; e.y += Math.sin(tt.ang) * 16; e.lean = -0.35 * e.face;
        hitShape(tt, e.atk * 1.1);
        G.fx.push({ kind: 'claw', x: e.x, y: e.y - 8, ang: tt.ang, r: 40, w: 3, c: '255,240,220', glow: true, t: 0.22, max: 0.22 });
        G.fx.push({ kind: 'arcwave', x: e.x, y: e.y - 6, ang: tt.ang, arc: tt.arc, r0: 12, r1: 66, t: 0.25, max: 0.25, c: '255,200,170' });
        addShake(4, tt.ang); sfx('heavy');
        e.state = 'recover'; e.t = 0.7; e.cd = rand(0.9, 1.4);
      } });
  }
  function drawBoar(e, ya, al) {
    const white = e.flash > 0, flip = e.face < 0, dash = e.state === 'dash';
    let sx = 1, sy = 1 + Math.sin(e.walk * 2) * 0.03, rot = e.lean, tr = 0;
    if (dash) { sx = 1.12; sy = 0.92; rot = 0; }
    if (e.state === 'wind' && e.pat === 'rush') { rot = -0.1 * e.face; tr = rand(-0.6, 0.6); }
    if (e.state === 'wind' && e.pat === 'quill') { sy = 1.06; tr = e.glow > 0.6 ? rand(-0.8, 0.8) : 0; }
    if (e.grogiT > 0) rot = 0.3 * e.face;
    drawShadow(e.x, e.y + 2, 24);
    drawSprite('boar', 'boar', 2, e.x + tr, e.y + 3 + ya, flip, { white, rot, alpha: al, sx, sy });
    if (!white && e.state === 'wind' && e.pat === 'quill') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(255,240,200,${0.4 + 0.5 * e.glow})`; ctx.fillRect(Math.round(e.x + (-24 + i * 6) * e.face) - 1, Math.round(e.y - 36 - e.glow * 4 + ya), 2, 4); } ctx.restore(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = e.enraged ? 'rgba(255,40,30,1)' : `rgba(255,80,40,${0.5 + 0.5 * e.glow})`;
    ctx.fillRect(Math.round(e.x + e.face * 19) - 1, Math.round(e.y - 23 + ya), 2, 4);
    ctx.restore();
    if (e.grogiT > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(e.y - 50 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); }
  }

  // ---------- 고블린 아처의 활
  function drawBow(e, ya) {
    const aim = e.state === 'wind' ? e.lockAng : (e.face > 0 ? 0.5 : Math.PI - 0.5);
    const hx = e.x + Math.cos(aim) * 6, hy = e.y - 13 + ya + Math.sin(aim) * 3, pull = e.state === 'wind' ? Math.min(1, e.glow * 1.3) : 0;
    const ux = Math.cos(aim), uy = Math.sin(aim), nx = -uy, ny = ux, R = 9;
    const pts = []; for (let i = -4; i <= 4; i++) { const t = i / 4, bend = (1 - t * t) * 4; pts.push({ x: hx + nx * t * R + ux * bend, y: hy + ny * t * R + uy * bend }); }
    const sx = hx - ux * (1 + pull * 6), sy = hy - uy * (1 + pull * 6);
    ctx.strokeStyle = 'rgba(220,210,190,.9)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(sx, sy); ctx.lineTo(pts[8].x, pts[8].y); ctx.stroke();
    for (const q of pts) { ctx.fillStyle = '#0b0a0e'; ctx.fillRect(Math.round(q.x) - 1, Math.round(q.y) - 1, 3, 3); }
    for (const q of pts) { ctx.fillStyle = '#7a5232'; ctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }
    if (pull > 0) {
      ctx.strokeStyle = '#0b0a0e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx + ux * 7, hy + uy * 7); ctx.stroke();
      ctx.strokeStyle = '#a07a50'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx + ux * 7, hy + uy * 7); ctx.stroke();
      ctx.fillStyle = '#d8dce4'; ctx.fillRect(Math.round(hx + ux * 7) - 1, Math.round(hy + uy * 7) - 1, 2, 2);
      if (pull > 0.75 && Math.floor(time * 20) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(hx + ux * 8), Math.round(hy + uy * 8), 1, 1); }
    }
  }

  // ================================================================ 1스테이지: 잿빛 초원 — 슬라임 · 고블린 · 점액왕
  const isSlime = e => e.type === 'slime' || e.type === 'bigslime' || e.kind === 'slimeking';
  const bloodOf = e => e.type === 'flag' ? '#8a6a40' : e.type === 'ghost' ? '#9cc1ea' : e.type === 'crow' ? '#3a3446' : e.type === 'mother' ? '#6a8a2a' : isSlime(e) ? '#7ac843' : '#8f1418';
  const splatOf = e => isSlime(e) ? '60,120,30' : '110,10,16';
  const SLIME_COL = {
    slime: { k: '#0c160a', d: '#3a7a26', m: '#62b03a', l: '#b8f080' },
    bigslime: { k: '#081414', d: '#1f6a6a', m: '#3aa8a0', l: '#a0f0e0' },
    king: { k: '#0a1408', d: '#2e6a20', m: '#5aa032', l: '#a8e070' },
    toxslime: { k: '#120816', d: '#4a2060', m: '#7a3a92', l: '#d090f0' },
    kingR: { k: '#160810', d: '#6a2050', m: '#a0407a', l: '#f0a0d0' },
  };
  // 픽셀 돔(점액) 그리기
  function drawBlob(cx, by, w, h, C, o = {}) {
    const px = 2, rows = Math.max(3, Math.round(h / px));
    const rowW = t => (w / 2) * Math.sqrt(Math.max(0, 1 - Math.pow(1 - t, 2))) * (t > 0.85 ? 1 - (t - 0.85) * 0.8 : 1);
    ctx.save(); ctx.globalAlpha = o.alpha == null ? 0.92 : o.alpha;
    const top = Math.round(by - h); let topX = cx;
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < rows; i++) {
      const t = (i + 0.5) / rows, J = o.jelly, wv = J ? 1 + Math.sin(i * 0.55 - time * 7 + J.ph) * J.wave * (1 - t * 0.6) : 1, hw = Math.round(rowW(t) * wv / px) * px + (pass === 0 ? px : 0), y = top + i * px - (pass === 0 && i === 0 ? px : 0);
      if (hw <= 0) continue;
      const X = J ? Math.round((cx + J.lean * h * (1 - t) * (1 - t) * 0.9 + Math.sin(time * 5 - t * 4 + J.ph) * J.wave * 20 * (1 - t)) / px) * px : cx; if (i === 2) topX = X;
      if (pass === 0) { ctx.fillStyle = o.white ? '#ffffff' : C.k; ctx.fillRect(Math.round(X - hw), y, hw * 2, px + (i === rows - 1 ? px : 0) + (i === 0 ? px : 0)); continue; }
      ctx.fillStyle = o.white ? '#ffffff' : C.m; ctx.fillRect(Math.round(X - hw), y, hw * 2, px);
      if (!o.white) {
        const sh = Math.max(px, Math.round(hw * 0.35 / px) * px);
        ctx.fillStyle = C.d; ctx.fillRect(Math.round(X + hw - sh), y, sh, px);
        if (i >= rows - 2) ctx.fillRect(Math.round(X - hw), y, hw * 2, px);
      }
    }
    if (!o.white) {
      ctx.fillStyle = C.l;
      ctx.fillRect(Math.round(topX - w * 0.22) & ~1, top + px * 2, px * 2, px); ctx.fillRect(Math.round(topX - w * 0.28) & ~1, top + px * 3, px, px * 2);
      if (o.jelly) { ctx.fillRect(Math.round(topX - w * 0.16) & ~1, top + px * 2, px * 3, px); ctx.globalAlpha *= 0.6; ctx.fillRect(Math.round(topX - w * 0.32) & ~1, top + px * 6, px, px * 3); }
    }
    ctx.restore();
  }
  function stepHop(e, dt) {
    const h = e.hop; h.t += dt;
    const k = Math.min(1, h.t / h.dur);
    e.x += Math.cos(h.ang) * h.sp * dt; e.y += Math.sin(h.ang) * h.sp * dt;
    e.z = Math.sin(k * Math.PI) * h.h;
    if (Math.abs(Math.cos(h.ang)) > 0.2) e.face = Math.cos(h.ang) > 0 ? 1 : -1;
    if (k >= 1) { e.hop = null; e.z = 0; e.squash = 0.18; dust(e.x, e.y, 2); }
  }
  function updateSlime(e, dt, d, a) {
    const P = G.player, big = e.type === 'bigslime';
    if (e.state === 'chase') {
      if (e.hop) stepHop(e, dt);
      else if (d < (big ? 48 : 38) && e.cd <= 0) { e.state = 'sqz'; e.t = big ? 0.7 : 0.55; e.holdMax = e.t; e.face = Math.cos(a) > 0 ? 1 : -1; }
      else { e.hopT = (e.hopT || 0) - dt; if (e.hopT <= 0) { e.hopT = rand(0.3, 0.6); e.hop = { t: 0, dur: 0.42, ang: steer(e, a) + rand(-0.4, 0.4), sp: e.spd, h: big ? 9 : 7 }; } }
    } else if (e.state === 'sqz') {
      if (e.t <= 0) {
        const ang = angTo(e, P), dd = Math.min(d, big ? 72 : 58);
        e.state = 'leap'; e.hop = { t: 0, dur: 0.3, ang, sp: dd / 0.3, h: big ? 22 : 16 }; sfx('swing');
      }
    } else if (e.state === 'leap') {
      if (e.hop) stepHop(e, dt);
      if (!e.hop) {
        if (dist(e, P) < e.r + P.r + (big ? 14 : 10)) hurtPlayer(e.atk, e);
        G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 6, grow: big ? 200 : 140, t: 0.25, max: 0.25, c: big ? '#a0f0e0' : '#b8f080' });
        splat(e.x, e.y, big ? 14 : 8, '60,120,30'); dust(e.x, e.y, big ? 8 : 4); if (big) addShake(3);
        e.state = 'recover'; e.t = 0.6; e.cd = rand(0.9, 1.5);
      }
    }
  }
  function drawSlime(e, ya, al) {
    const big = e.type === 'bigslime', tox = e.type === 'toxslime', C = SLIME_COL[e.type], white = e.flash > 0, z = e.z || 0;
    const w0 = big ? 34 : tox ? 24 : 22, h0 = big ? 26 : tox ? 18 : 16;
    let sx = 1, sy = 1, tr = 0;
    if (e.state === 'sqz' || e.state === 'spit') { const k = 1 - e.t / e.holdMax; sx = 1 + 0.3 * k; sy = 1 - 0.3 * k; tr = k > 0.6 ? rand(-1, 1) : 0; }
    else if (z > 0) { sx = 0.88; sy = 1.14; }
    else if (e.squash > 0) { const k = e.squash / 0.18; sx = 1 + 0.25 * k; sy = 1 - 0.22 * k; }
    else { sy = 1 + Math.sin(time * 5 + e.walk) * 0.04; sx = 2 - sy; }
    drawShadow(e.x, e.y + 1, (big ? 16 : 11) * (1 - Math.min(0.5, z / 60)));
    const cx = Math.round(e.x + tr) & ~1, by = Math.round(e.y + 2 + ya - z) & ~1;
    drawBlob(cx, by, w0 * sx, h0 * sy, C, { white, alpha: 0.92 * al });
    if (!white) {
      const ey = Math.round(by - h0 * sy * 0.6) & ~1, ex = (cx + e.face * 2) & ~1;
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(ex - 6, ey, 4, 4); ctx.fillRect(ex + 2, ey, 4, 4);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(ex - 6, ey, 2, 2); ctx.fillRect(ex + 2, ey, 2, 2);
      if (tox) { ctx.fillStyle = '#9ae060'; ctx.fillRect(Math.round(cx - 7), Math.round(by - h0 * 0.35), 2, 2); ctx.fillRect(Math.round(cx + 5), Math.round(by - h0 * 0.25), 2, 2); ctx.fillRect(Math.round(cx - 1), Math.round(by - h0 * 0.8), 2, 2); }
      if (big) { ctx.fillStyle = 'rgba(10,30,30,.5)'; ctx.fillRect(Math.round(cx - 3), Math.round(by - h0 * 0.3), 4, 3); ctx.fillRect(Math.round(cx + 5), Math.round(by - h0 * 0.45), 2, 2); }
    }
    if (e.state === 'sqz' || e.state === 'spit') holdGlow(cx, by - h0 * 0.5, 1 - e.t / e.holdMax, big ? '120,255,230' : tox ? '200,110,255' : '160,255,90');
  }

  // ---------- 점액왕 구루그
  function spawnSlimeKing() {
    const P0 = G.player, S = STG(), b = makeEnemy('ghoul', clamp(P0.x, A.x0 + 80, A.x1 - 80), clamp(P0.y - 170, A.y0 + 50, A.y1 - 50));
    Object.assign(b, { type: 'boss', kind: 'slimeking', r: 22, hp: 2400 * S.hpMul, maxHp: 2400 * S.hpMul, atk: 15 * S.atkMul, def: 50, spd: 40, kbRes: 0, grogiMax: 90,
      stage: 1, state: 'idle', cd: 1.6, shield: false, summonT: 4, nextPat: 0, blade: null, rise: 0.8, z: 0, squash: 0, rollA: 0 });
    G.boss = b; G.enemies.push(b);
    dust(b.x, b.y, 30); splat(b.x, b.y, 40, '60,120,30');
    G.fx.push({ kind: 'skybeam', x: b.x, y: b.y, w: 60, c: '140,230,90', t: 0.7, max: 0.7 });
    bossRoar(b, '#8fe060');
  }
  function slimeKingStage(b) {
    const pct = b.hp / b.maxHp;
    if (b.stage === 1 && pct <= 0.65) { b.stage = 2; banner('2단계', '새끼 점액 소환 · 연속 도약'); bossRoar(b, '#8fe060'); cancelTele(b); b.state = 'idle'; b.cd = 0.6; b.z = 0; b.summonT = 0; }
    if (b.stage === 2 && pct <= 0.3) { b.stage = 3; banner('폭주', '점액왕이 날뛴다'); bossRoar(b, '#ff60b0'); cancelTele(b); b.state = 'idle'; b.cd = 0.6; b.z = 0; b.spd *= 1.3; }
  }
  function updateSlimeKing(b, dt) {
    const P = G.player;
    // 말캉함 (v0.87): 세로 늘어남(jy)과 기울기(jl)를 감쇠 스프링으로 — 맞거나 착지하면 출렁, 움직이면 윗부분이 늦게 따라온다
    { const z = b.z || 0, T = b.grogiT > 0 ? -0.2 : b.squash > 0 ? -0.24 * Math.min(1, b.squash / 0.3) : z > 4 ? 0.2 : b.state === 'roll' ? -0.1 : 0;
      if (b.flash > (b._pf || 0) + 0.01) { b.jyv = (b.jyv || 0) - 3.2 - Math.random() * 1.5; b.jlv = (b.jlv || 0) + Math.sign(b.x - P.x || 1) * (1.6 + Math.random()); } b._pf = b.flash;
      if ((b._pz || 0) > 4 && z <= 4) b.jyv = (b.jyv || 0) - 4.5; b._pz = z;
      if (b.squash > (b._psq || 0) + 0.05) b.jyv = (b.jyv || 0) - 3; b._psq = b.squash;
      const st = Math.min(dt, 1 / 30); b.jyv = (b.jyv || 0) + (-170 * ((b.jy || 0) - T) - 7 * (b.jyv || 0)) * st; b.jy = clamp((b.jy || 0) + b.jyv * st, -0.42, 0.42);
      const mvx = (b.x - (b._px == null ? b.x : b._px)) / Math.max(dt, 1e-3); b._px = b.x;
      b.jlv = (b.jlv || 0) + (-110 * ((b.jl || 0) - clamp(-mvx / 900, -0.25, 0.25)) - 6 * (b.jlv || 0)) * st; b.jl = clamp((b.jl || 0) + b.jlv * st, -0.35, 0.35); }
    b.flash = Math.max(0, b.flash - dt); b.rise = Math.max(0, b.rise - dt); b.squash = Math.max(0, b.squash - dt);
    b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= Math.pow(0.001, dt); b.vy *= Math.pow(0.001, dt);
    b.glow = 0;
    for (const t of G.tele) if (t.owner === b && t.shape !== 'spawn') b.glow = Math.max(b.glow, t.t / t.dur);
    if (Math.random() < 0.4) G.parts.push({ x: b.x + rand(-20, 20), y: b.y - rand(0, 8) - b.z, vx: 0, vy: rand(10, 30), t: 0.5, c: pick(['#5aa032', '#2e6a20']), g: 80, floor: b.y + 2 });
    G.bossTime -= dt;
    if (G.bossTime <= 0 && !b.wipe) {
      b.wipe = true; cancelTele(b); banner('전멸기', '제한 시간 초과');
      sfx('roar'); G.tele.push({ shape: 'circle', x: CX, y: CY, r: 700, t: 0, dur: 2.0, owner: b, heavy: true, onFire: () => { hurtPlayer(9999, b, true); flashT = 0.3; flashColor = '#ffffff'; } });
    }
    if (b.grogiT > 0) { b.grogiT -= dt; b.z = Math.max(0, b.z - dt * 300); if (b.grogiT <= 0) { b.state = 'idle'; b.cd = 0.8; } return; }
    if (b.state === 'wind') return;
    if (P.dead) return;
    const enr = b.stage === 3, d = dist(b, P), a = angTo(b, P);
    if (b.state === 'idle' && Math.abs(Math.cos(a)) > 0.2) b.face = Math.cos(a) > 0 ? 1 : -1;
    if (b.stage >= 2 && b.state === 'idle') {
      b.summonT -= dt;
      if (b.summonT <= 0) {
        b.summonT = enr ? 14 : 18;
        if (G.enemies.filter(e => !e.dead && e.type === 'slime').length < 6) {
          for (let i = 0; i < 3; i++) {
            const pt = { x: clamp(b.x + rand(-100, 100), A.x0 + 30, A.x1 - 30), y: clamp(b.y + rand(-50, 70), A.y0 + 30, A.y1 - 30) };
            G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: 10, t: 0, dur: 0.8, owner: b, onFire: () => { G.enemies.push(makeEnemy('slime', pt.x, pt.y)); burst(pt.x, pt.y - 6, '#7ac843', 10); } });
          }
          b.state = 'cast'; b.t = 0.9; b.squash = 0.3; sfx('warn');
          for (let i = 0; i < 16; i++) { const aa = rand(0, TAU), sp = rand(60, 160); G.parts.push({ x: b.x, y: b.y - 20, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.6 - 60, t: rand(0.4, 0.8), c: pick(['#62b03a', '#b8f080']), g: 280, floor: b.y + rand(-10, 20) }); }
          return;
        }
      }
    }
    if (b.state === 'cast' || b.state === 'recover') { b.t -= dt; if (b.t <= 0) { b.state = 'idle'; b.cd = enr ? 0.35 : 0.75; } return; }
    if (b.state === 'jump') {
      b.jt += dt;
      if (b.jt < 0) { b.squash = Math.max(b.squash, 0.3); return; } // 웅크림
      const k = Math.min(1, b.jt / b.jdur), kk = k < 0.5 ? 2 * k * k : 1 - 2 * (1 - k) * (1 - k);
      b.x = b.jx0 + (b.jtx - b.jx0) * kk; b.y = b.jy0 + (b.jty - b.jy0) * kk;
      b.z = Math.sin(k * Math.PI) * 90;
      return;
    }
    if (b.state === 'roll') {
      const sp = enr ? 430 : 370;
      b.x += Math.cos(b.lockAng) * sp * dt; b.y += Math.sin(b.lockAng) * sp * dt; b.dashLeft -= sp * dt; b.rollA += dt * 18 * b.face;
      if (Math.random() < 0.9) splat(b.x + rand(-10, 10), b.y + rand(-3, 3), 3, '60,120,30');
      if (Math.random() < 0.6) dust(b.x, b.y, 1);
      if (!b.hitPlayer && dist(b, P) < b.r + P.r + 4) { b.hitPlayer = true; hurtPlayer(b.atk * 1.15, b); }
      if (b.dashLeft <= 0 || b.x < A.x0 + b.r || b.x > A.x1 - b.r || b.y < A.y0 + b.r || b.y > A.y1 - b.r || dashBlocked(b)) {
        solveObs(b, b.r); b.x = clamp(b.x, A.x0 + b.r, A.x1 - b.r); b.y = clamp(b.y, A.y0 + b.r, A.y1 - b.r);
        b.state = 'recover'; b.t = enr ? 0.6 : 0.95; b.squash = 0.3; addShake(7, b.lockAng); sfx('blast');
        G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 10, t: 0.4, max: 0.4, c: '#b8f080', grow: 240 });
        if (b.stage >= 2) kingBurst(b, 6);
      }
      return;
    }
    // idle: 출렁이며 다가온다. 멀면 더 빨리 좁혀 오고 다음 패턴도 빨리 고른다 (v0.88)
    const far = d > 200;
    if (d > 80) { const sp = b.spd * (far ? 1.6 : 1); b.x += Math.cos(a) * sp * dt; b.y += Math.sin(a) * sp * dt; b.walk += dt * (far ? 6 : 4); }
    b.cd -= dt * (far ? 1.6 : 1);
    if (b.cd > 0) return;
    // v0.88: 거리별 가중치 — 멀면 도약·구르기로 붙고, 제자리 산성 뱉기는 가끔만. 뱉기는 연속 금지
    let pat = far ? wpick2([['jump', 5], ['roll', 4], ['spit', b.lastPat === 'spit' ? 0 : 1.2]])
      : d > 90 ? wpick2([['jump', 3], ['roll', 3], ['spit', b.lastPat === 'spit' ? 0 : 1.5]])
      : wpick2([['jump', 4], ['roll', 2]]);
    b.lastPat = pat;
    if (pat === 'jump') kingJump(b, enr ? 3 : b.stage >= 2 ? 2 : 1, 0.45);
    else if (pat === 'spit') kingSpit(b, a);
    else kingRoll(b, a);
  }
  function kingJump(b, n, crouch) {
    const P = G.player;
    b.jumpsLeft = n - 1; b.state = 'jump'; b.jt = -crouch; b.jdur = 0.85;
    b.jx0 = b.x; b.jy0 = b.y; b.jtx = clamp(P.x, A.x0 + 30, A.x1 - 30); b.jty = clamp(P.y, A.y0 + 30, A.y1 - 30);
    if (Math.abs(b.jtx - b.x) > 4) b.face = b.jtx > b.x ? 1 : -1;
    alertMark(b, 70, true); sfx('warn');
    G.tele.push({ shape: 'circle', x: b.jtx, y: b.jty, r: 72, t: 0, dur: crouch + b.jdur, owner: b, heavy: true, onFire: tt => kingLand(b, tt) });
  }
  function kingLand(b, tt) {
    b.x = tt.x; b.y = tt.y; b.z = 0; b.squash = 0.35;
    hitShape(tt, b.atk * 1.2);
    G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 10, t: 0.45, max: 0.45, c: '#b8f080', grow: 300 });
    G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 6, t: 0.3, max: 0.3, c: '#ffffff', grow: 200 });
    for (let i = 0; i < 6; i++) G.fx.push({ kind: 'arcwave', x: b.x, y: b.y, ang: i / 6 * TAU + rand(-0.2, 0.2), arc: 40 * DEG, r0: 12, r1: 80, t: 0.3, max: 0.3, c: '150,230,90' });
    for (let i = 0; i < 30; i++) { const aa = rand(0, TAU), sp = rand(60, 220); G.parts.push({ x: b.x, y: b.y - 6, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp * 0.6 - 60, t: rand(0.4, 0.8), c: pick(['#62b03a', '#b8f080', '#3a7a26']), g: 300, floor: b.y + rand(-8, 14) }); }
    splat(b.x, b.y, 50, '60,120,30'); dust(b.x, b.y, 20); crack(b.x, b.y);
    addShake(10); sfx('blast'); flashT = 0.05; flashColor = '#b8f080';
    if (b.stage >= 2) kingBurst(b, 8);
    if (b.jumpsLeft > 0) { const left = b.jumpsLeft; kingJump(b, left, 0.3); b.jumpsLeft = left - 1; }
    else { b.state = 'recover'; b.t = b.stage === 3 ? 0.7 : 1.1; }
  }
  function kingBurst(b, n) { // 사방으로 점액 덩어리
    for (let i = 0; i < n; i++) { const aa = i / n * TAU + rand(-0.1, 0.1); G.eproj.push({ x: b.x + Math.cos(aa) * 20, y: b.y + Math.sin(aa) * 14, ang: aa, sp: 150, r: 5, dmg: b.atk * 0.6, t: 1.6, hist: [], kind: 'acid' }); }
  }
  function kingSpit(b, a) {
    const n = b.stage >= 2 ? 7 : 5, spread = 0.85;
    b.state = 'wind'; b.squash = 0.4; alertMark(b, 70, true); sfx('warn');
    G.tele.push({ shape: 'cone', x: b.x, y: b.y, ang: a, arc: spread * 2 + 0.25, r: 150, t: 0, dur: 0.8, owner: b, follow: true,
      onFire: tt => {
        for (let k = 0; k < (b.stage === 3 ? 2 : 1); k++) for (let i = 0; i < n; i++) {
          const ang = tt.ang + (i - (n - 1) / 2) * (spread * 2 / (n - 1)) + k * 0.12;
          G.eproj.push({ x: b.x + Math.cos(ang) * 22, y: b.y + Math.sin(ang) * 14, ang, sp: 190 - k * 40, r: 6, dmg: b.atk * 0.8, t: 2.4, hist: [], kind: 'acid' });
        }
        b.squash = 0.3; sfx('whoosh'); sfx('fireball'); addShake(3, tt.ang);
        b.state = 'recover'; b.t = 0.7;
      } });
  }
  function kingRoll(b, a) {
    b.state = 'wind'; b.lockAng = a; b.face = Math.cos(a) > 0 ? 1 : -1; b.squash = 0.4; alertMark(b, 70, true); sfx('warn');
    G.tele.push({ shape: 'line', x: b.x, y: b.y, ang: a, len: 320, w: 46, t: 0, dur: 0.95, owner: b, heavy: true,
      onFire: () => { b.state = 'roll'; b.dashLeft = 320; b.hitPlayer = false; sfx('whoosh'); dust(b.x, b.y, 12); } });
  }
  let CROWN_G = null;
  function drawSlimeKing(e, ya, al) {
    const C = SLIME_COL[e.stage === 3 ? 'kingR' : 'king'], white = e.flash > 0, z = e.z || 0;
    // 스프링 값으로 늘어나고(세로) 그만큼 퍼지며(가로, 부피 유지), 숨 쉬듯 출렁
    let sy = 1 + (e.jy || 0) + Math.sin(time * 4) * 0.04 + Math.sin(time * 9.3) * 0.012, sx = 1 / Math.sqrt(Math.max(0.3, sy)) * (1 + Math.max(0, -(e.jy || 0)) * 0.35);
    const W0 = 64, H0 = 50, cx = Math.round(e.x) & ~1, by = Math.round(e.y + 2 + ya - z) & ~1;
    drawShadow(e.x, e.y + 2, 30 * (1 - Math.min(0.55, z / 200)));
    if (e.glow > 0 && !white) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(cx, by - 24, 0, cx, by - 24, 50); gr.addColorStop(0, `rgba(160,255,90,${0.4 * e.glow})`); gr.addColorStop(1, 'rgba(160,255,90,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - 50, by - 74, 100, 100); ctx.restore(); }
    drawBlob(cx, by, W0 * sx, H0 * sy, C, { white, alpha: 0.9 * al, jelly: { lean: (e.jl || 0) + Math.sin(time * 2.6) * 0.04, wave: 0.035 + Math.min(0.08, Math.abs(e.jyv || 0) * 0.012), ph: e.x * 0.01 } });
    const lx = (e.jl || 0) * H0 * sy * 0.5; // 이후 장식은 기울기 따라 옮긴다
    if (white) return;
    const h = H0 * sy;
    // 몸 속에 떠 있는 해골과 뼈 (삼킨 것들)
    ctx.save(); ctx.globalAlpha = 0.5 * al;
    const skx = Math.round(cx - 8 + Math.sin(time * 1.3) * 3), sky = Math.round(by - h * 0.42 + Math.cos(time * 1.1) * 2);
    const sx2 = skx & ~1, sy2 = sky & ~1; ctx.fillStyle = '#d8d0b8'; ctx.fillRect(sx2, sy2, 8, 6); ctx.fillRect(sx2 + 2, sy2 + 6, 4, 2);
    ctx.fillStyle = C.d; ctx.fillRect(sx2 + 2, sy2 + 2, 2, 2); ctx.fillRect(sx2 + 4, sy2 + 2, 2, 2);
    ctx.fillStyle = '#d8d0b8'; ctx.fillRect(Math.round(cx + 10 + Math.sin(time) * 2) & ~1, Math.round(by - h * 0.25) & ~1, 8, 2);
    if (e.state === 'roll') { ctx.fillStyle = C.l; for (let i = 0; i < 3; i++) { const aa = e.rollA + i * 2.1; ctx.fillRect(Math.round(cx + Math.cos(aa) * 20), Math.round(by - h / 2 + Math.sin(aa) * 14), 3, 3); } }
    ctx.restore();
    // 눈
    const ey = Math.round(by - h * 0.62) & ~1, ex = (Math.round(cx + e.face * 6 + lx * 0.62)) & ~1;
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(ex - 10, ey, 6, 6); ctx.fillRect(ex + 4, ey, 6, 6);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = e.stage === 3 ? 'rgba(255,70,140,.95)' : 'rgba(230,255,120,.9)'; ctx.fillRect(ex - 8, ey + 2, 2, 2); ctx.fillRect(ex + 6, ey + 2, 2, 2);
    ctx.restore();
    // 왕관
    const crY = Math.round(by - h - 8 + Math.max(0, -(e.jy || 0)) * 6) & ~1, crX = Math.round(cx - 10 + e.face * 2 + lx) & ~1;
    gPaint(ctx, CROWN_G || (CROWN_G = gOutline(fromRows(['y...yy...y', 'yy.yyyy.yy', 'YyyyyrryyY', 'YYYYYYYYYY']))), { y: '#e8c060', Y: '#a8822e', r: '#b01c22', k: '#0b0a0e' }, crX, crY);
    if (e.grogiT > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(cx + Math.cos(time * 6 + i * 2.1) * 20), Math.round(by - h - 14 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); }
  }

  // ---------- 초원 배경
  // 초원 흙길의 중심선: 넓은 방은 아래쪽으로 굽이치고, 좁은 오솔길은 가운데를 따라 흐른다
  let CUR_ROOM = null, ROOMSTYLE = { path: 'wind', wall: null };
  function meadowPath() {
    const w = A.x1 - A.x0, h = A.y1 - A.y0;
    if (h > w * 1.3) { const amp = Math.min(40, w * 0.14); return { vert: true, at: y => CX + Math.sin(y * 0.012) * amp + Math.sin(y * 0.03) * 4 }; }
    const amp = Math.min(70, h * 0.13), base = h > 400 ? CY + Math.min(120, h * 0.22) : CY;
    return { vert: false, at: x => base + Math.sin(x * 0.007) * amp + Math.sin(x * 0.02) * Math.min(8, amp * 0.3) };
  }
  // 전투장 바깥: 어두운 숲 (도트 나무를 촘촘히 세우고 멀수록 디더링으로 어둡게)
  function paintForestBorder(g) {
    g.fillStyle = '#0a140a';
    g.fillRect(0, A.y0 - 6, A.x0 - 4, H); g.fillRect(A.x1 + 4, A.y0 - 6, W - A.x1, H); g.fillRect(0, A.y1 + 4, W, H - A.y1);
    if (CUR_ROOM && G) paintMeadowDoorPaths(g, CUR_ROOM); // 문 길은 숲 나무보다 먼저
    const pts = [];
    const band = (x0, x1, y0, y1) => { for (let y = y0; y < y1; y += 30) for (let x = x0; x < x1; x += 26) pts.push({ x: x + rand(-8, 8), y: y + rand(-8, 8) }); };
    band(A.x0 - 230, A.x0 - 6, A.y0 + 10, A.y1 + 200); band(A.x1 + 10, A.x1 + 240, A.y0 + 10, A.y1 + 200); band(A.x0 - 6, A.x1 + 10, A.y1 + 30, A.y1 + 200);
    const D0 = CUR_ROOM && G ? CUR_ROOM.doors : {}, onDoor = p => (D0.s != null && Math.abs(p.x - DOOR.s.x) < 26 && p.y > A.y1) || (D0.w != null && Math.abs(p.y - CY) < 26 && p.x < A.x0) || (D0.e != null && Math.abs(p.y - CY) < 26 && p.x > A.x1);
    pts.sort((a, b) => a.y - b.y);
    for (const p of pts) {
      if (onDoor({ x: p.x, y: p.y - 20 })) continue;
      const kind = pick(['round', 'round', 'pine', 'pine', 'dead']), map = genTree(kind);
      const pal = Object.assign({}, TRUNK, TREE_PAL[kind === 'pine' ? 'deep' : pick(['deep', 'dusk', 'green'])]);
      stamp(g, map, pal, Math.round((p.x - map[0].length) / 2) * 2, Math.round((p.y - map.length * 2) / 2) * 2, 2, Math.random() < 0.5);
    }
    // 멀수록 어둡게 (디더링)
    for (let y = A.y0 - 6; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      const dx = x < A.x0 ? A.x0 - x : x > A.x1 ? x - A.x1 : 0, dy = y > A.y1 ? y - A.y1 : 0, d = Math.max(dx, dy);
      if (d <= 12) continue;
      const lv = clamp((d - 12) / 150, 0, 1) * 0.85 + 0.15, bx = (x >> 1) & 3, by = (y >> 1) & 3;
      if (lv * 16 > [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][by * 4 + bx]) { g.fillStyle = '#050905'; g.fillRect(x, y, 2, 2); }
    }
  }
  const [floorM, fmg] = mkCanvas(W, H);
  function paintMeadowFloor(g) {
    const sky = g.createLinearGradient(0, 0, 0, A.y0); sky.addColorStop(0, '#1e1830'); sky.addColorStop(0.55, '#4a2e48'); sky.addColorStop(1, '#8a5040');
    g.fillStyle = sky; g.fillRect(0, 0, W, A.y0);
    // 지는 해
    g.fillStyle = 'rgba(255,170,90,.5)'; g.beginPath(); g.arc(CX + 100, A.y0 - 34, 22, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,200,120,.8)'; g.beginPath(); g.arc(CX + 100, A.y0 - 34, 14, 0, TAU); g.fill();
    g.fillStyle = '#1e3018'; g.fillRect(0, A.y0 - 40, W, H);
    for (let i = 0; i < 11000 * (W * (H - A.y0)) / (1152 * 630); i++) { g.fillStyle = pick(['#24401c', '#2a4820', '#22401a']); g.fillRect(randi(0, W), randi(A.y0 - 40, H), randi(1, 3), 1); }
    for (let i = 0; i < 16; i++) { const x = rand(A.x0, A.x1), y = rand(A.y0, A.y1), r = rand(20, 60); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(90,130,50,.18)'); gr.addColorStop(1, 'rgba(90,130,50,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    // 풀 무더기
    for (let i = 0; i < 420 * (A.x1 - A.x0) * (A.y1 - A.y0) / 540000; i++) {
      const x = randi(A.x0 - 20, A.x1 + 20), y = randi(A.y0, A.y1 + 20);
      g.fillStyle = pick(['#4a7a34', '#56883a', '#3e6a2c', '#68984a']);
      g.fillRect(x, y, 1, 2); g.fillRect(x + 1, y - 1, 1, 3); g.fillRect(x + 2, y + 1, 1, 1);
    }
    // 들꽃
    for (let i = 0; i < 36; i++) { const x = randi(A.x0, A.x1), y = randi(A.y0, A.y1); g.fillStyle = '#3e6a2c'; g.fillRect(x, y + 1, 1, 2); g.fillStyle = pick(['#e8e0c0', '#e0c040', '#b080e0', '#e07090', '#f0f0f0']); g.fillRect(x, y, 1, 1); if (Math.random() < 0.4) { g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); } }
    paintForestShadow(g);
    paintTreeline(g);
    paintUndergrowth(g);
    paintForestBorder(g);
    paintMeadowProps(g);
    // 길을 마지막에 그려 잔디·꽃·덤불이 덮거나 끊어 보이지 않게 한다.
    for (const c of meadowCurves()) paintMeadowCurve(g, c);
  }
  paintMeadowFloor(fmg);

  // ---------- 스테이지 정의
  const PHASES_MEADOW = {
    1: [[['slime', 4]], [['slime', 3], ['goblin', 2]]],
    2: [[['goblin', 4]], [['slime', 3], ['toxslime', 1], ['bigslime', 1]]],
    3: [[['goblin', 3], ['garcher', 2]], [['slime', 3], ['toxslime', 2], ['goblin', 1]]],
    4: [[['gbrute', 1], ['goblin', 3]]],
    6: [[['goblin', 5], ['garcher', 3]], [['bigslime', 2], ['toxslime', 3], ['slime', 3]], [['goblin', 5], ['slime', 2], ['garcher', 2]]],
    7: [[['slime', 5], ['bigslime', 2], ['toxslime', 2]], [['goblin', 6], ['garcher', 3]], [['boar', 1], ['slime', 3], ['goblin', 2]]],
    8: [[['goblin', 6], ['garcher', 3]], [['bigslime', 3], ['toxslime', 2], ['goblin', 3]], [['gbrute', 1], ['goblin', 3], ['garcher', 2]]],
    9: [[['boar', 1], ['goblin', 4], ['garcher', 1]], [['gbrute', 1], ['boar', 1], ['goblin', 2]]],
  };
  // 챕터 3 웨이브 (※ ocharge·odrum·ogrip = 준엘리트)
  const PHASES_ORC = {
    1: [[['orc', 3], ['slave', 3]], [['orc', 2], ['othrow', 2], ['slave', 2]]],
    2: [[['wolf', 3], ['orc', 2]], [['orc', 3], ['shaman', 1], ['ocharge', 1]]],
    3: [[['orc', 4], ['othrow', 2]], [['slave', 5], ['wolf', 2], ['otroll', 1]]],
    4: [[['urg', 1], ['orc', 2]]],
    6: [[['ogrip', 1], ['orc', 3], ['slave', 3]], [['wolf', 4], ['othrow', 2], ['shaman', 1]], [['ocharge', 1], ['orc', 4]]],
    7: [[['otroll', 1], ['orc', 4], ['othrow', 1]], [['slave', 6], ['shaman', 2]], [['ogrip', 1], ['wolf', 3], ['othrow', 2]]],
    8: [[['ocharge', 1], ['orc', 5], ['othrow', 2]], [['otroll', 1], ['wolf', 4], ['shaman', 1]], [['ogrip', 1], ['ocharge', 1], ['orc', 3]]],
    9: [[['troll', 1], ['ogrip', 1], ['orc', 2], ['shaman', 1]]],
  };
  const STAGES = {
    1: { n: '잿빛 초원', sub: '황혼이 내린 변경의 들판', diff: 1, hpMul: 1.15, atkMul: 1.45, dark: 0.34, ash: '205,240,120', torches: false,
      phases: PHASES_MEADOW, survive: [['slime', 0.3], ['goblin', 0.3], ['garcher', 0.15], ['bigslime', 0.1], ['toxslime', 0.15]], surviveMax: 10,
      boss: '점액왕 구루그', bossSub: '들판을 삼키는 거대한 점액 · 재의 왕관 파편 보유', bossGold: 160, elite: '거대 고블린 · 가시등 멧돼지' },
    2: { n: '무너진 성채', sub: '타락한 기사단의 의식장', diff: 2, hpMul: 1.15, atkMul: 0.95, dark: 0.66, ash: '160,150,170', torches: true,
      phases: PHASES, survive: [['ghoul', 0.4], ['dog', 0.15], ['bloat', 0.15], ['cultist', 0.15], ['crow', 0.15]], surviveMax: 12,
      boss: '타락 기사단장 발도르', bossSub: '무너진 성채의 주인 · 재의 왕관 파편 보유', bossGold: 250, elite: '기사단 처형인 · 역병 어미' },
    3: { n: '핏빛 엄니 부락', sub: '협곡 바닥의 오크 전쟁 부락', diff: 3, hpMul: 1.4, atkMul: 1.32, dark: 0.5, ash: '255,140,60', torches: true, embers: true,
      phases: PHASES_ORC, survive: [['orc', 0.35], ['othrow', 0.15], ['wolf', 0.2], ['slave', 0.2], ['shaman', 0.1]], surviveMax: 14, surviveSemi: 20,
      boss: '붉은 엄니 대족장 크루가쉬', bossSub: '부락의 왕 · 재의 왕관 파편을 엄니 왕관에 박았다', bossGold: 360, elite: '투기장 챔피언 우르그 · 사슬 풀린 트롤 그러크' },
  };
  // 이번 런의 마지막 스테이지: STAGE 2를 한 번 클리어하면 STAGE 3(오크 부락)이 열린다
  const lastStage = () => (G && G.last) || 3;
  let STAGE = STAGES[SAVE.lastStage] ? SAVE.lastStage : 1;
  let FORGE_STG = null; // v1.02 대장간 방은 성채 설정에 대장간 분위기를 덮어씀
  const STG = () => G && G.dun && G.dun.forge ? (FORGE_STG || (FORGE_STG = Object.assign({}, STAGES[2], { n: '곰 대장장이의 대장간', sub: '바위 굴 속 대장간', dark: 0.6, ash: '255,150,70', torches: true }))) : STAGES[G ? G.stage : STAGE];
  // ================================================================ 던전 (v0.23) — 엔터 더 건전식 방 구조
  // 한 스테이지 = 방 그래프. 전투 방은 들어가면 문이 잠기고 적을 모두 쓰러뜨려야 열린다.
  // 엘리트 방 2곳을 처치하면 보스 방 봉인이 풀린다. 갈림길·순환 고리·막다른 길 끝의 보물·상인, 금 간 벽 너머 비밀 방.
  const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
  const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };
  const DOOR = { n: { x: 719, y: A.y0 }, s: { x: 719, y: A.y1 }, w: { x: A.x0, y: CY }, e: { x: A.x1, y: CY } };
  // 방 크기·모양 (v0.25): 스테이지마다 5종
  const SHAPES = {
    field: { w: 1000, h: 540, n: '들판' }, trail: { w: 1100, h: 210, n: '오솔길' }, trailV: { w: 300, h: 640, n: '숲길' }, glade: { w: 560, h: 360, n: '숲속 빈터' }, plain: { w: 1180, h: 640, n: '너른 벌판' },
    square: { w: 1000, h: 540, n: '부락 광장' }, fence: { w: 1100, h: 200, n: '말뚝 사이 길' }, canyon: { w: 300, h: 640, n: '협곡 비탈길' }, tents: { w: 560, h: 360, n: '천막 골목' }, arena: { w: 1180, h: 640, n: '투기장' },
    hall: { w: 1000, h: 540, n: '의식장' }, nook: { w: 480, h: 270, n: '아늑한 자리' }, vault: { w: 400, h: 240, n: '숨은 방' }, forge: { w: 500, h: 280, n: '대장간' }, corridor: { w: 1100, h: 190, n: '복도' }, corridorV: { w: 280, h: 640, n: '탑 계단' }, chamber: { w: 540, h: 340, n: '작은 방' }, greathall: { w: 1180, h: 640, n: '대회랑' },
  };
  function setArena(sh) {
    A.x0 = 136 + Math.max(0, Math.round((1000 - sh.w) / 4) * 2); A.x1 = A.x0 + sh.w;
    A.y0 = 100 + Math.max(0, Math.round((540 - sh.h) / 4) * 2); A.y1 = A.y0 + sh.h;
    CX = (A.x0 + A.x1) / 2; CY = (A.y0 + A.y1) / 2;
    PILLARS = []; for (let x = A.x0 + 34; x <= A.x1 - 20; x += 157) PILLARS.push(x);
    TORCHES = PILLARS.map(x => ({ x, y: A.y0 - 38 }));
    // 문은 장식 기둥 간격에 맞추지 않고 각 변의 정확한 중앙에 고정한다.
    const nx = Math.round(CX / 2) * 2;
    Object.assign(DOOR.n, { x: nx, y: A.y0 }); Object.assign(DOOR.s, { x: nx, y: A.y1 }); Object.assign(DOOR.w, { x: A.x0, y: CY }); Object.assign(DOOR.e, { x: A.x1, y: CY });
    NC = Math.ceil((A.x1 - A.x0) / NAV); NR = Math.ceil((A.y1 - A.y0) / NAV);
  }
  const doorIn = (d, k = 26) => ({ x: DOOR[d].x + (d === 'w' ? k : d === 'e' ? -k : 0), y: DOOR[d].y + (d === 'n' ? k : d === 's' ? -k : 0) });
  const ROOM_N = { forge: '대장간', start: '시작 방', combat: '전투 방', elite: '엘리트 방', survive: '봉인된 방', rest: '모닥불', reward: '보물 방', shop: '상인', secret: '비밀 방', boss: '보스' };
  // v1.21 챕터마다 다른 엘리트 방 이름·문구 (tier 4 = 첫째 엘리트 방, tier 9 = 둘째)
  const ELITE_ROOM = {
    1: { n: '우두머리의 굴', tag: '굴', foe: '우두머리', clear: '우두머리 처치', loot: '우두머리의 전리품',
      sub: { 4: '거대 고블린이 정령의 불씨를 움켜쥐고 있다', 9: '가시등 멧돼지가 불씨를 지키며 땅을 긁는다' } },
    2: { n: '처형장', tag: '처형장', foe: '처형장', clear: '처형장 제압', loot: '처형장의 전리품',
      sub: { 4: '기사단 처형인이 마지막 판결을 기다린다', 9: '처형인 곁에 역병 어미가 둥지를 틀었다' } },
    3: { n: '결투장', tag: '결투장', foe: '결투', clear: '결투 승리', loot: '결투의 전리품',
      sub: { 4: '투기장 챔피언 우르그가 엄니를 걸고 덤빈다', 9: '사슬 풀린 트롤 그러크가 우리 밖으로 뛰쳐나왔다' } },
  };
  const ER = () => ELITE_ROOM[G && G.stage] || ELITE_ROOM[1];
  const roomName = t => t === 'elite' && G && G.dun && !G.dun.forge ? ER().n : ROOM_N[t];
  const roomTag = t => t === 'elite' ? ER().tag : ROOM_TAG[t];
  const ROOM_TAG = { forge: '대장간', start: '시작', combat: '전투', elite: '엘리트', survive: '봉인', rest: '모닥불', reward: '보물', shop: '상인', secret: '비밀', boss: '보스' };

  function withSeed(seed, fn) {
    const R0 = Math.random; let s = (seed >>> 0) || 1;
    Math.random = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    try { return fn(); } finally { Math.random = R0; }
  }

  // ---------- 생성
  function genDungeon(stage) {
    for (let i = 0; i < 600; i++) { const D = tryGenDungeon(stage); if (D) return D; }
    throw new Error('던전 생성 실패');
  }
  function tryGenDungeon(stage) {
    const N = stage === 1 ? 12 : stage === 2 ? 13 : 14;
    const cells = new Map(), K = (x, y) => x + ',' + y, rooms = [];
    const add = (x, y) => { const r = { id: rooms.length, gx: x, gy: y, type: 'combat', doors: { n: null, s: null, w: null, e: null }, visited: false, seen: false, cleared: false, loot: [], seed: randi(1, 2e9) }; rooms.push(r); cells.set(K(x, y), r); return r; };
    const link = (a, b, d) => { a.doors[d] = b.id; b.doors[OPP[d]] = a.id; };
    const nbs = (x, y) => Object.keys(DIRS).filter(d => cells.has(K(x + DIRS[d][0], y + DIRS[d][1])));
    const at = (x, y, d) => cells.get(K(x + DIRS[d][0], y + DIRS[d][1]));
    add(0, 0);
    for (let guard = 0; rooms.length < N && guard < 3000; guard++) {
      const base = rooms[randi(0, rooms.length - 1)], d = pick(Object.keys(DIRS));
      const x = base.gx + DIRS[d][0], y = base.gy + DIRS[d][1];
      if (cells.has(K(x, y)) || nbs(x, y).length !== 1 || Math.abs(x) > 4 || Math.abs(y) > 3) continue;
      if (base.id === 0 && nbs(0, 0).length >= 3) continue;
      link(base, add(x, y), d);
    }
    if (rooms.length < N) return null;
    // 순환 고리: 양쪽에 방이 있는 빈 칸을 채워 두 갈래를 잇는다
    for (let l = 0; l < (stage === 1 ? 1 : 2); l++) {
      const cand = [];
      for (const r of rooms) for (const d in DIRS) { const x = r.gx + DIRS[d][0], y = r.gy + DIRS[d][1]; if (!cells.has(K(x, y)) && nbs(x, y).length === 2) cand.push([x, y]); }
      if (!cand.length) break;
      const [x, y] = pick(cand), nr = add(x, y);
      for (const d of nbs(x, y)) link(nr, at(x, y, d), d);
    }
    // 시작 방에서의 거리
    const depth = rooms.map(() => -1); depth[0] = 0;
    for (const q = [0]; q.length;) { const r = rooms[q.shift()]; for (const d in r.doors) { const id = r.doors[d]; if (id != null && depth[id] < 0) { depth[id] = depth[r.id] + 1; q.push(id); } } }
    const deg = r => Object.values(r.doors).filter(v => v != null).length;
    const dead = rooms.filter(r => r.id !== 0 && deg(r) === 1).sort((a, b) => depth[b.id] - depth[a.id]);
    if (dead.length < 3) return null;
    const boss = dead[0]; if (depth[boss.id] < 4) return null;
    const foyer = rooms[Object.values(boss.doors).find(v => v != null)];
    if (foyer.id === 0) return null;
    rooms[0].type = 'start'; boss.type = 'boss';
    const free = () => rooms.filter(r => r.type === 'combat' && r !== foyer);
    const de = dead.filter(r => r.type === 'combat' && r !== foyer);
    if (de.length < 2) return null;
    de[0].type = 'reward';
    const shop = de.length > 1 ? de[de.length - 1] : pick(free()); shop.type = 'shop';
    let F = free().filter(r => depth[r.id] >= 2).sort((a, b) => depth[a.id] - depth[b.id]);
    if (F.length < 4) return null;
    const e1 = F[Math.floor((F.length - 1) / 2)], e2 = F[F.length - 1];
    e1.type = 'elite'; e1.tier = 4; e2.type = 'elite'; e2.tier = 9;
    F = free().sort((a, b) => Math.abs(depth[a.id] - 3) - Math.abs(depth[b.id] - 3));
    if (!F.length) return null;
    F[0].type = 'rest'; F[0].tier = 5;
    F = free().filter(r => depth[r.id] >= 2);
    if (!F.length) return null;
    const sv = pick(F); sv.type = 'survive'; sv.tier = 10;
    const combats = rooms.filter(r => r.type === 'combat').sort((a, b) => depth[a.id] - depth[b.id]);
    if (combats.length < 3) return null;
    const TIERS = [1, 2, 3, 6, 7, 8];
    combats.forEach((r, i) => { r.tier = TIERS[Math.min(5, Math.floor(i * 6 / combats.length))]; });
    // 비밀 방: 보스 옆이 아닌 빈 칸, 이웃이 하나뿐인 깊은 자리를 우선
    const sc = [];
    for (const r of rooms) {
      if (r.type === 'boss' || r.type === 'start') continue;
      for (const d in DIRS) {
        const x = r.gx + DIRS[d][0], y = r.gy + DIRS[d][1];
        if (cells.has(K(x, y)) || r.doors[d] != null) continue;
        const n = nbs(x, y);
        if (n.some(nd => at(x, y, nd).type === 'boss')) continue;
        sc.push({ x, y, r, d, n: n.length });
      }
    }
    if (!sc.length) return null;
    sc.sort((a, b) => (a.n - b.n) || (depth[b.r.id] - depth[a.r.id]));
    const s0 = pick(sc.filter(s => s.n === sc[0].n).slice(0, 4));
    const sec = add(s0.x, s0.y); sec.type = 'secret';
    link(s0.r, sec, s0.d); s0.r.crack = { dir: s0.d, hp: 3, broken: false };
    for (const r of rooms) {
      r.depth = depth[r.id] == null || depth[r.id] < 0 ? depth[s0.r.id] + 1 : depth[r.id];
      if (!r.tier) r.tier = Math.max(1, Math.min(8, r.depth + 1));
      if (r.type === 'boss') r.tier = 11;
    }
    // 텔레포터: 시작·상인·모닥불·보물·봉인·보스 앞방 + 일부 전투 방
    for (const r of rooms) if (['start', 'shop', 'rest', 'reward', 'survive', 'boss'].includes(r.type) || r === foyer || (r.type === 'combat' && Math.random() < 0.3)) r.hasTele = true;
    // 방 모양: 양쪽 문만 있는 전투 방은 오솔길·복도가 되기 쉽고, 엘리트·봉인은 넓은 방, 쉼터는 작은 방
    const [STD, COR, CORV, SMALL, BIG] = stage === 1 ? ['field', 'trail', 'trailV', 'glade', 'plain'] : stage === 2 ? ['hall', 'corridor', 'corridorV', 'chamber', 'greathall'] : ['square', 'fence', 'canyon', 'tents', 'arena'];
    const wpick = arr => { let t = Math.random() * arr.reduce((a, b) => a + b[1], 0); for (const [k, w] of arr) { if (t < w) return k; t -= w; } return arr[0][0]; };
    for (const r of rooms) {
      const ds = Object.keys(r.doors).filter(d => r.doors[d] != null), hz = ds.every(d => d === 'w' || d === 'e'), vt = ds.every(d => d === 'n' || d === 's');
      r.shape = r.type === 'boss' ? (stage === 3 ? 'arena' : STD)
        : r.type === 'combat' ? (hz && Math.random() < 0.8 ? COR : vt && Math.random() < 0.8 ? CORV : wpick([[STD, 3], [SMALL, 2], [BIG, 2], [COR, ds.length <= 3 && !ds.includes('n') ? 1 : 0], [CORV, ds.length <= 3 && !ds.includes('w') ? 1 : 0]]))
        : r.type === 'elite' ? wpick([[STD, 2], [BIG, 3]])
        : r.type === 'survive' ? wpick([[STD, 1], [BIG, 2]])
        : r.type === 'start' ? STD
        : r.type === 'secret' ? 'vault' // v1.11 특별한 방은 작게
        : ['shop', 'rest', 'reward'].includes(r.type) ? 'nook'
        : SMALL;
    }
    // 모든 칸에 적어도 오솔길/복도 하나는 나오게
    if (!rooms.some(r => r.shape === COR || r.shape === CORV)) { const nsCount = r => ['n', 's'].filter(d => r.doors[d] != null).length; const c = rooms.filter(r => r.type === 'combat').sort((a, b) => nsCount(a) - nsCount(b))[0]; if (c) c.shape = nsCount(c) <= 1 ? COR : CORV; }
    for (const r of rooms) { r.waves = r.type === 'combat' || r.type === 'elite' ? STAGES[stage].phases[r.tier] : null; setArena(SHAPES[r.shape]); layoutRoom(r, stage); }
    setArena(SHAPES[STD]);
    // 지도 경계
    const xs = rooms.map(r => r.gx), ys = rooms.map(r => r.gy);
    return { rooms, start: rooms[0], boss, foyer, cur: null, eliteDone: 0, keys: 0, sock: [false, false], bossOpen: false, gate: null, stage, bx0: Math.min(...xs), bx1: Math.max(...xs), by0: Math.min(...ys), by1: Math.max(...ys) };
  }

  // ---------- 방 구조물: 기둥(나무) · 무너진 벽(덤불) · 잔해(바위) · 구덩이(연못)
  const U = (u, v) => ({ x: A.x0 + u * (A.x1 - A.x0), y: A.y0 + v * (A.y1 - A.y0) });
  const LAYOUTS = {
    open: () => [],
    pillars4: () => [['p', .28, .3], ['p', .72, .3], ['p', .28, .72], ['p', .72, .72]],
    pillars6: () => [['p', .22, .3], ['p', .5, .3], ['p', .78, .3], ['p', .22, .72], ['p', .5, .72], ['p', .78, .72]],
    ring: () => Array.from({ length: 8 }, (_, i) => ['p', .5 + Math.cos(i / 8 * TAU + 0.39) * 0.2, .52 + Math.sin(i / 8 * TAU + 0.39) * 0.3]),
    centerPit: () => [['pit', .5, .24, 300, 96], ['pit', .5, .84, 220, 60]],
    twinPits: () => [['pit', .3, .5, 150, 220], ['pit', .7, .5, 150, 220]],
    cross: () => [['w', .5, .2, 26, 110], ['w', .5, .86, 26, 90], ['w', .2, .52, 200, 26], ['w', .8, .52, 200, 26]],
    lanes: () => [['w', .5, .33, 560, 26], ['w', .5, .7, 560, 26], ['r', .14, .5, 16], ['r', .86, .5, 16]],
    rubble: () => Array.from({ length: 8 }, () => ['r', rand(.15, .85), rand(.18, .85), rand(12, 22)]),
    pitBand: () => [['pit', .25, .52, 290, 64], ['pit', .75, .52, 290, 64], ['p', .5, .25], ['p', .5, .8]],
    blocks: () => [['w', .22, .27, 170, 90], ['w', .78, .27, 170, 90], ['w', .22, .78, 170, 90], ['w', .78, .78, 170, 90]],
    pitsScatter: () => [['pit', .25, .3, 110, 70], ['pit', .7, .25, 90, 80], ['pit', .5, .84, 130, 60], ['pit', .2, .75, 90, 60], ['pit', .82, .72, 100, 70], ['r', .4, .35, 15], ['r', .62, .82, 15]],
    halls: () => [['w', .36, .5, 26, 300], ['w', .64, .5, 26, 300], ['r', .18, .3, 18], ['r', .82, .74, 18]],
    pond: () => [['pit', .5, .2, 220, 80], ['p', .2, .3], ['p', .8, .3], ['p', .2, .78], ['p', .8, .78]],
  };
  // 모양 전용 배치 (크기 그대로)
  const LAYOUTS_SHAPE = {
    trailEdge: () => [...[.08, .3, .52, .74, .94].map(u => ['p', u, .1]), ...[.2, .42, .64, .86].map(u => ['p', u, .92]), ['r', .76, .5, 13]],
    trailZig: () => [['w', .2, .3, 46, 120], ['w', .42, .72, 46, 120], ['w', .64, .3, 46, 120], ['w', .86, .72, 46, 120]],
    trailPond: () => [['pit', .24, .5, 170, 70], ['pit', .76, .5, 170, 70], ['p', .2, .12], ['p', .8, .9]],
    vZig: () => [['w', .32, .24, 150, 30], ['w', .68, .5, 150, 30], ['w', .32, .76, 150, 30]],
    vEdge: () => [['p', .12, .18], ['p', .88, .32], ['p', .12, .48], ['p', .88, .62], ['p', .12, .8], ['r', .5, .35, 12]],
    colonnade: () => [...[.08, .26, .44, .62, .8, .96].map(u => ['p', u, .16]), ...[.08, .26, .44, .62, .8, .96].map(u => ['p', u, .86])],
    corrRubble: () => [['r', .18, .28, 22], ['r', .38, .72, 22], ['r', .58, .28, 22], ['r', .78, .72, 22]],
    corrPits: () => [['pit', .3, .3, 220, 56], ['pit', .7, .7, 220, 56]],
    vColon: () => [...[.12, .3, .48, .66, .84].map(v => ['p', .16, v]), ...[.12, .3, .48, .66, .84].map(v => ['p', .84, v])],
    vRubble: () => [['r', .3, .25, 20], ['r', .7, .45, 20], ['r', .3, .7, 20]],
    glade1: () => [['p', .2, .3], ['p', .8, .3], ['r', .5, .75, 14]],
    nave: () => [...[.12, .26, .4, .6, .74, .88].map(u => ['p', u, .3]), ...[.12, .26, .4, .6, .74, .88].map(u => ['p', u, .72])],
    groves: () => [['p', .2, .25], ['p', .27, .34], ['p', .14, .38], ['p', .8, .68], ['p', .87, .6], ['p', .74, .8], ['pit', .55, .2, 220, 80], ['r', .3, .75, 18]],
    sideHalls: () => [['w', .5, .3, 500, 30], ['w', .5, .72, 500, 30], ['p', .15, .5], ['p', .85, .5]],
  };
  Object.assign(LAYOUTS, LAYOUTS_SHAPE);
  const LAYOUT_SHAPE_POOL = {
    trail: ['trailEdge', 'trailZig', 'trailPond'], trailV: ['vZig', 'vEdge'], glade: ['glade1', 'open', 'pillars4'],
    corridor: ['colonnade', 'corrRubble', 'corrPits'], corridorV: ['vColon', 'vRubble'], chamber: ['open', 'pillars4', 'rubble'],
  };
  const LAYOUT_BIG_EXTRA = { plain: ['groves'], greathall: ['nave', 'sideHalls'] };
  const LAYOUT_BY = {
    combat: ['pillars4', 'pillars6', 'ring', 'centerPit', 'twinPits', 'cross', 'lanes', 'rubble', 'pitBand', 'blocks', 'pitsScatter', 'halls', 'pond'],
    elite: ['open', 'pillars4', 'pillars6', 'ring', 'rubble', 'centerPit'],
    survive: ['pillars4', 'ring', 'rubble', 'pond', 'pitBand'],
  };
  function mkObs(spec, sx = 1, sy = 1) {
    let [k, u, v, a, b] = spec; const p = U(u, v);
    if (k === 'r') a = Math.max(10, Math.min(26, a * Math.min(sx, sy))); else if (k !== 'p') { a = Math.round(a * sx / 2) * 2; b = Math.round(b * sy / 2) * 2; }
    if (k === 'p') return { t: 'pillar', c: true, x: p.x, y: p.y, r: 13 };
    if (k === 'r') return { t: 'rock', c: true, x: p.x, y: p.y, r: a };
    const t = k === 'w' ? 'wall' : 'pit';
    return { t, c: false, x: p.x, y: p.y, w: a, h: b, x0: p.x - a / 2, y0: p.y - b / 2, x1: p.x + a / 2, y1: p.y + b / 2 };
  }
  function obsHitL(list, x, y, r, solidOnly) {
    for (const b of list) {
      if (b.ghost || (solidOnly && b.t === 'pit')) continue;
      if (b.c) { if (Math.hypot(x - b.x, y - b.y) < b.r + r) return b; }
      else { const cx = clamp(x, b.x0, b.x1), cy = clamp(y, b.y0, b.y1); if (Math.hypot(x - cx, y - cy) < r) return b; }
    }
    return null;
  }
  const solidAt = (x, y, r = 2) => !!(G && G.obs && G.obs.length && obsHitL(G.obs, x, y, r, true));
  // 투사체는 이전 위치→새 위치 선분을 4px 간격으로 검사해 얇은 장애물도 건너뛰지 않는다 (v0.59)
  function segSolid(x0, y0, x1, y1, r = 3) { if (!G || !G.obs || !G.obs.length) return false; const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / 4)); for (let i = 1; i <= n; i++) { const t = i / n; if (obsHitL(G.obs, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, true)) return true; } return false; }
  // 돌진은 장애물(구덩이 포함)에 닿으면 멈춘다
  const dashBlocked = (e, pits = true) => !!(G && G.obs && G.obs.length && obsHitL(G.obs, e.x, e.y, e.r, !pits));
  // 원(유닛)을 장애물 밖으로 밀어낸다
  function solveObs(o, r, ignorePit) {
    const L = G && G.obs; if (!L || !L.length) return false;
    let hit = false;
    for (const b of L) {
      if (b.ghost || (ignorePit && b.t === 'pit')) continue;
      if (b.c) {
        let dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy); const m = b.r + r;
        if (d < m) { if (d < 0.01) { dx = 1; dy = 0; d = 1; } o.x = b.x + dx / d * m; o.y = b.y + dy / d * m; hit = true; }
      } else {
        const cx = clamp(o.x, b.x0, b.x1), cy = clamp(o.y, b.y0, b.y1), dx = o.x - cx, dy = o.y - cy, d = Math.hypot(dx, dy);
        if (d < r) {
          if (d > 0.01) { o.x = cx + dx / d * r; o.y = cy + dy / d * r; }
          else {
            const l = o.x - b.x0, rr = b.x1 - o.x, t = o.y - b.y0, bt = b.y1 - o.y, m = Math.min(l, rr, t, bt);
            if (m === l) o.x = b.x0 - r; else if (m === rr) o.x = b.x1 + r; else if (m === t) o.y = b.y0 - r; else o.y = b.y1 + r;
          }
          hit = true;
        }
      }
    }
    return hit;
  }
  // 길찾기 격자 (10px)
  const NAV = 10; let NC = Math.ceil((A.x1 - A.x0) / NAV), NR = Math.ceil((A.y1 - A.y0) / NAV);
  const navIdx = (x, y) => { const i = Math.floor((x - A.x0) / NAV), j = Math.floor((y - A.y0) / NAV); return i < 0 || j < 0 || i >= NC || j >= NR ? -1 : j * NC + i; };
  function buildNav(obs, r = 9) {
    const f = new Uint8Array(NC * NR);
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) f[j * NC + i] = obsHitL(obs, A.x0 + (i + 0.5) * NAV, A.y0 + (j + 0.5) * NAV, r) ? 0 : 1;
    return f;
  }
  function navFlood(nav, sx, sy) {
    const dist = new Int16Array(NC * NR).fill(-1), s = navIdx(sx, sy);
    if (s < 0) return dist;
    const q = new Int32Array(NC * NR); let h = 0, t = 0;
    dist[s] = 0; q[t++] = s;
    while (h < t) {
      const c = q[h++], i = c % NC, j = (c / NC) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NC || nj >= NR) continue;
        const n = nj * NC + ni; if (dist[n] >= 0 || !nav[n]) continue;
        if (di && dj && (!nav[j * NC + ni] || !nav[nj * NC + i])) continue;
        dist[n] = dist[c] + 1; q[t++] = n;
      }
    }
    return dist;
  }
  const CLEAR_R = 64; // 방 가운데 비워 둘 반지름
  function layoutRoom(r, stage) {
    withSeed(r.seed, () => {
      const keyPts = []; // 문 앞, 텔레포터, 상자 등 비워 둘 자리
      for (const d in r.doors) if (r.doors[d] != null) keyPts.push(doorIn(d, 34));
      if (r.crack) keyPts.push(doorIn(r.crack.dir, 34));
      const fight = !!LAYOUT_BY[r.type], sh = r.shape, own = LAYOUT_SHAPE_POOL[sh];
      const pool = !fight ? (sh === 'glade' && r.type === 'start' ? ['glade1'] : ['open']) : own ? own.slice() : LAYOUT_BY[r.type].concat(r.type === 'combat' ? LAYOUT_BIG_EXTRA[sh] || [] : []);
      const sx = (A.x1 - A.x0) / 1000, sy = (A.y1 - A.y0) / 540, scaled = n => !LAYOUTS_SHAPE[n];
      let obs = [];
      for (let tries = 0; tries < 12 && pool.length; tries++) {
        const name = pool.splice(randi(0, pool.length - 1), 1)[0];
        obs = LAYOUTS[name]().map(sp => scaled(name) ? mkObs(sp, sx, sy) : mkObs(sp)).filter(b => !keyPts.some(p => obsHitL([b], p.x, p.y, Math.min(62, (Math.min(A.x1 - A.x0, A.y1 - A.y0)) * 0.22))));
        // 방 가운데(보상 상자·텔레포터 자리)는 비운다: 큰 벽·구덩이가 걸리면 다른 배치, 바위·기둥은 빼기 (v0.59)
        if (obs.some(b => !b.c && obsHitL([b], CX, CY - 10, CLEAR_R))) { obs = []; continue; }
        obs = obs.filter(b => !obsHitL([b], CX, CY - 10, CLEAR_R));
        // 둥근 장애물끼리 겹치지 않게
        obs = obs.filter((b, i) => !b.c || !obs.slice(0, i).some(o => o.c ? Math.hypot(o.x - b.x, o.y - b.y) < o.r + b.r + (stage === 3 ? 30 : 10) : obsHitL([o], b.x, b.y, b.r + 6)));
        if (!obs.length && name !== 'open') continue;
        const nav = buildNav(obs), ok = keyPts.length < 2 || (() => { const dd = navFlood(nav, keyPts[0].x, keyPts[0].y); return keyPts.every(p => dd[navIdx(p.x, p.y)] >= 0); })();
        const center = navFlood(nav, CX, CY + 40);
        if (ok && keyPts.every(p => center[navIdx(p.x, p.y)] >= 0 || !nav[navIdx(CX, CY + 40)])) { r.layout = name; break; }
        obs = [];
      }
      if (stage === 3) for (const b of obs) {
        const sq = b.w <= 150 && b.h <= 150 && b.w / b.h > 0.5 && b.w / b.h < 2;
        if (b.t === 'pit') { b.t = 'wall'; b.tower = sq; }
        else if (b.t === 'wall' && sq && b.w >= 36 && Math.random() < 0.5) b.tower = true;
      }
      // v0.99 망루는 네 기둥만 막힌다 — 발판 아래로 지나갈 수 있음 (그림은 b, 판정은 기둥 4개)
      if (stage === 3) for (const b of obs.slice()) if (b.tower) { b.ghost = true; for (const [x, y] of [[b.x0 + 7, b.y0 + 2], [b.x1 - 7, b.y0 + 2], [b.x0 + 3, b.y1 - 4], [b.x1 - 3, b.y1 - 4]]) obs.push({ t: 'post', c: true, x, y, r: 5, of: b }); }
      // 특별한 방의 큰 소품은 막힌 자리 (v0.76)
      const box = (x0, y0, x1, y1) => obs.push({ t: 'prop', c: false, x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, x0, y0, x1, y1 }), ring = (x, y, rr) => obs.push({ t: 'prop', c: true, x, y, r: rr });
      if (r.type === 'rest') ring(CX + SR_FIRE.dx, CY + SR_FIRE.dy, 18);
      r.obs = obs; r.nav = buildNav(obs);
      // 특수 지점
      const freeSpot = (cands) => cands.map(([u, v]) => U(u, v)).find(p => !obsHitL(obs, p.x, p.y, 34)) || U(.5, .5);
      if (r.hasTele) r.tele = freeSpot([...(r.type === 'survive' || r.type === 'boss' ? [] : [[.5, .5]]), [.4, .62], [.6, .4], [.3, .5], [.7, .5], [.5, .3], [.5, .75], [.15, .2], [.85, .8]]);
      if (SR_TELE[r.type]) r.tele = { x: CX + SR_TELE[r.type][0], y: CY + SR_TELE[r.type][1] }; // v1.11
      if (r.type === 'boss') { const far = q => !obsHitL(obs, q.x, q.y, 34) && (!r.tele || Math.hypot(q.x - r.tele.x, q.y - r.tele.y) > 80) && Math.hypot(q.x - CX, q.y - (CY - 10)) > 70; // v1.01 다음 스테이지 출구
        r.exitP = [[.5, .22], [.5, .78], [.3, .25], [.7, .25], [.22, .5], [.78, .5], [.3, .75], [.7, .75]].map(([u, v]) => U(u, v)).find(far) || U(.5, .22); }
      if (r.type === 'reward') r.chest = { x: CX, y: CY - 20, opened: false, kind: 'reward' };
      if (r.type === 'secret') r.chest = { x: CX, y: CY - 10, opened: false, kind: 'secret' };
      if (r.type === 'shop') {
        const mul = stage === 2 ? 1.3 : stage === 3 ? 1.6 : 1;
        const all = [['meat', 35], ['orb', 45], ['vial', 55], ['gear', 160], ['iron', 30]];
        const pickd = [all[0], all[3], ...all.filter((_, i) => i !== 0 && i !== 3).sort(() => Math.random() - 0.5).slice(0, 2)].sort((a, b) => a[1] - b[1]);
        r.shop = pickd.map(([k, p], i) => ({ k, price: Math.round(p * mul / 5) * 5, x: CX - 135 + i * 90, y: CY + 40, sold: false }));
      }
      // 방 꾸미기 설정과 서 있는 소품
      r.style = stage === 3
        ? { orc: true, ground: pick(['tread', 'tread', 'ring', 'none']), wall: Array.from({ length: 10 }, () => pick(['hide', 'hide', 'skull', 'skull', 'banner', 'spikes', 'none'])) }
        : stage === 1
        ? { path: pick(['wind', 'wind', 'wind', 'straight', 'straight', 'stones', 'brook', 'none']), ph: rand(0, 6), off: pick([-1, 1]) * rand(0.5, 1), ea: rand(0.04, 0.22), eb: rand(0.04, 0.22), ec: rand(0.06, 0.2), doors: Object.keys(r.doors).filter(d => r.doors[d] != null) }
        : { wall: Array.from({ length: 8 }, () => pick(['window', 'window', 'window', 'tapestry', 'tapestry', 'shieldSwords', 'shieldSwords', 'portrait', 'chains', 'skullNiche'])) };
      if (SR_LAYOUT[r.type] && stage === 1) { r.style.path = 'none'; r.style.doors = []; } // v1.11 특별한 방엔 길 없음
      const brookSide = () => { if (r.style.path !== 'brook') return; const free = ['n', 's', 'w', 'e'].filter(d => r.doors[d] == null && !(r.crack && r.crack.dir === d)); if (!free.length) { r.style.path = 'wind'; return; } r.style.side = pick(free); };
      const spots = keyPts.concat(r.tele ? [r.tele] : [], r.chest ? [r.chest] : [], r.shop || [], r.type === 'rest' ? [{ x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy }] : []);
      if (stage === 1) brookSide();
      if (stage === 1 && (r.style.path !== 'none' || r.style.doors.length)) { // 길이 나무·덤불·연못 밑으로 지나가지 않게
        const RS0 = ROOMSTYLE, clash = () => { brookSide(); ROOMSTYLE = r.style; const cs = meadowCurves(); ROOMSTYLE = RS0; return cs.some(c => { for (let t = c.a; t < c.b; t += 4) { const m = c.at(t); const px = c.vert ? m : t, py = c.vert ? t : m; if (obsHitL(obs, px, py, c.kind === 'brook' ? 30 : 28) || (c.kind === 'brook' && (Math.hypot(px - CX, py - (CY - 10)) < CLEAR_R + 18 || spots.some(q => Math.hypot(px - q.x, py - q.y) < 46)))) return true; } return false; }); };
        for (let k = 0; k < 10 && clash(); k++) Object.assign(r.style, { path: pick(['wind', 'wind', 'straight', 'stones', 'brook']), ph: rand(0, 6), off: pick([-1, 1]) * rand(0.5, 1) });
        if (clash()) {
          r.style.path = 'straight'; r.style.ph = 0; r.style.off = 0;
          ROOMSTYLE = r.style; const safePaths = meadowCurves(); ROOMSTYLE = RS0;
          const blocksRoad = b => safePaths.some(c => { for (let t = c.a; t <= c.b; t += 4) { const m = c.at(t), px = c.vert ? m : t, py = c.vert ? t : m; if (obsHitL([b], px, py, 28)) return true; } return false; });
          obs = obs.filter(b => !blocksRoad(b)); r.obs = obs; r.nav = buildNav(obs);
        }
      }
      const pts = keyPts.slice(); pts.push({ x: CX, y: CY - 10, big: true });
      if (r.tele) pts.push(r.tele); if (r.chest) pts.push(r.chest); if (r.shop) pts.push(...r.shop, { x: CX, y: CY - 70 }, { x: CX + 30, y: CY - 70 }); if (r.type === 'rest') pts.push({ x: CX - 4, y: CY - 10 }); // 모닥불 옆 (불 자체는 막힌 자리라 연결 검사에서 빼야 소품이 지워지지 않는다)
      if (r.type === 'boss' && r.style.path === 'brook') r.style.path = 'wind'; // 보스 방에는 개울 없음
      if (r.type !== 'boss' || stage === 3) decorRoom(r, stage, pts); else r.props = [];
      r.sprites = null;
    });
  }

  // ---------- 진입·진행
  function newDungeon() {
    G.dun = genDungeon(G.stage);
    G.mood = null;
    enterRoom(G.dun.start, null);
    banner(`STAGE ${G.stage}`, `${STG().n} — ${SK().intro}`);
  }
  function setMood(m) { if (G.mood !== m) { G.mood = m; window.AudioSys.setMood(m, true); } }
  const hiddenDoor = (R, d) => R.crack && R.crack.dir === d && !R.crack.broken;
  function enterRoom(R, entry, opt = {}) {
    const D = G.dun, P = G.player;
    if (D.cur && D.cur !== R) D.cur.loot = G.loot.filter(l => l.life > 0);
    setArena(SHAPES[R.shape]);
    R.socks = sealSocks(R);
    D.cur = R; R.visited = true; R.seen = true;
    for (const d in R.doors) if (R.doors[d] != null && !hiddenDoor(R, d)) D.rooms[R.doors[d]].seen = true;
    G.enemies = []; G.tele = []; G.hazards = []; G.proj = []; G.eproj = []; G.mproj = []; G.meteor = null; G.vortex = null; G.boss = null; G.bonfire = null;
    G.fx = []; G.parts = []; G.nums = []; G.corpses = []; G.spawning = 0;
    G.drums = R.drum ? [R.drum] : []; G.shocks = []; P.grab = null; P.thrown = null; P.lift = 0;
    G.loot = R.loot || []; R.loot = []; G.pfire = [];
    if (G.stats && G.stats.efx.has('first') && !R.cleared && ['combat', 'elite', 'survive', 'boss'].includes(R.type)) { P.critNext = true; P.firstCrit = true; }
    G.obs = R.obs; G.nav = R.nav; G.navDist = null; G.navT = 0;
    if (!R.sprites) R.sprites = makeObsSprites(R);
    G.flies = G.stage === 1 && R.type !== 'forge' ? Array.from({ length: randi(6, 14) }, () => ({ x: rand(A.x0 + 20, A.x1 - 20), y: rand(A.y0 + 10, A.y1 - 20), rx: rand(10, 30), ry: rand(6, 16), s: rand(0.6, 1.4), p: rand(0, 6) })) : null;
    dg.clearRect(0, 0, W, H);
    paintRoomFloor(R);
    G.phase = R.tier || 1;
    G.rs = { state: 'idle', t: 0, wave: 0, surviveT: 0 };
    G.sealed = false;
    // 플레이어 위치
    let p = entry ? doorIn(entry, 30) : opt.tele && R.tele ? { x: R.tele.x, y: R.tele.y + 22 } : { x: CX, y: Math.min(CY + 60, A.y1 - 30) };
    if (!entry && !opt.tele && R.type === 'boss') p = { x: CX, y: A.y1 - 60 };
    Object.assign(P, { x: p.x, y: p.y, state: 'idle', t: 0, lift: 0, giant: 0, queued: false, trail: [], trail2: [], inv: Math.max(P.inv, 0.6), iframe: 0 });
    solveObs(P, P.r);
    // 방 종류별
    const fresh = !R.cleared;
    if (R.type === 'combat' || R.type === 'elite' || R.type === 'survive' || R.type === 'boss') {
      if (fresh) { G.rs.state = 'intro'; sealRoom(true); }
    } else R.cleared = true;
    if (fresh && R.type === 'elite') banner(ER().n, ER().sub[R.tier] || STG().elite);
    if (fresh && R.type === 'survive') banner('봉인된 방', `문이 닫혔다! ${SURV_N}번의 습격을 버텨라`);
    if (fresh && R.type === 'boss') { banner(STG().boss, STG().bossSub); $('bossName').textContent = STG().boss; sfx('boss'); G.bossTime = 300; G.phase = 11; }
    if (R.type === 'rest') { G.bonfire = { x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy }; if (!R.healed) { R.healed = true; P.hp = G.stats.hp; banner('모닥불', '불가에서 쉬면 축복을 하나 얻는다 · F'); } }
    if (R.type === 'shop' && !R.greeted) { R.greeted = true; banner('상인', '골드로 보급품을 산다 · F'); }
    if (R.type === 'reward' && !R.greeted) { R.greeted = true; banner('보물 방', ''); }
    if (R.type === 'secret' && !R.greeted) { R.greeted = true; banner('비밀 방', '숨겨진 보물이다'); }
    { const s = G.stage; setMood(R.type === 'boss' && fresh ? (s === 3 ? 'orcboss' : s === 2 ? 'citadelBoss' : 'boss') : R.type === 'survive' && fresh ? (s === 3 ? 'orcboss' : s === 2 ? 'citadelSurvive' : 'survive') : ['rest', 'shop', 'secret', 'reward'].includes(R.type) ? (s === 2 ? 'citadelRest' : 'rest') : s === 3 ? 'orc' : s === 2 ? 'citadel' : 'field'); }
    updateCamera(0, true);
  }
  function restartRoom() { enterRoom(G.dun.cur, null); }
  function sealRoom(on) {
    if (G.sealed === on) return;
    G.sealed = on;
    sfx(on ? 'heavy' : 'ready'); addShake(on ? 4 : 2);
    for (const d in DIRS) if (G.dun.cur.doors[d] != null && !hiddenDoor(G.dun.cur, d)) { const q = doorIn(d, 4); dust(q.x, q.y, 8); }
  }
  function doorState(R, d) {
    const id = R.doors[d]; if (id == null) return 'none';
    if (hiddenDoor(R, d)) return 'crack';
    if (G.sealed) return 'sealed';
    if (G.dun.rooms[id].type === 'boss' && !G.dun.bossOpen) return 'boss';
    return 'open';
  }
  function goRoom(R, entry, tele) {
    if (G.trans) return;
    sfx(tele ? 'awaken' : 'dodge');
    G.trans = { t: 0, dur: tele ? 0.3 : 0.16, phase: 'out', go: () => enterRoom(R, entry, { tele }) };
  }
  function updateTrans(rdt) {
    const tr = G.trans; if (!tr) return false;
    tr.t += rdt;
    if (tr.phase === 'out') { if (tr.t >= tr.dur) { tr.go(); tr.phase = 'in'; tr.t = 0; } return true; }
    if (tr.t >= tr.dur) G.trans = null;
    return false;
  }
  function updateRoom(dt) {
    const D = G.dun, R = D.cur, rs = G.rs, P = G.player;
    rs.t += dt;
    const alive = G.enemies.filter(e => !e.dead).length;
    if (rs.state === 'intro' && rs.t > (R.type === 'boss' ? 1.4 : 0.55)) {
      rs.state = 'run'; rs.t = 0;
      if (R.waves) spawnWave(R.waves[0]);
      if (R.type === 'survive') { G.spawnT = 0; rs.ph = 0; rs.phT = 0; rs.idleT = 0; survivePhase(0); }
      if (R.type === 'boss') { if (G.stage === 1) spawnSlimeKing(); else if (G.stage === 3) spawnKrugash(); else spawnBoss(); }
    } else if (rs.state === 'run') {
      if (R.waves) {
        const last = rs.wave >= R.waves.length - 1;
        if (G.spawning === 0 && (last ? alive === 0 : alive <= (R.type === 'elite' || G.enemies.some(x => !x.dead && isSemi(x)) ? 0 : 2) && rs.t > 1.5)) { rs.wave++; rs.t = 0; if (rs.wave < R.waves.length) { spawnWave(R.waves[rs.wave]); sfx('growl', 0.8); addShake(2); } else roomClear(); }
      } else if (R.type === 'survive') { // v0.76: 4페이즈 리젠 방 — 페이즈마다 적이 계속 다시 나타나고, 시간이 지나면(또는 잠시 적이 없으면) 다음 페이즈. 4페이즈가 끝나면 남은 적을 정리
        rs.surviveT += dt; rs.phT += dt; G.spawnT -= dt;
        const PT = SURV_PT(), last = rs.ph >= SURV_N - 1, regen = !(last && rs.phT >= PT);
        if (regen && G.spawnT <= 0 && alive + G.spawning < survCap(rs.ph)) { G.spawnT = (G.stage === 1 ? 1.5 : 1.2) * (1 - rs.ph * 0.12); let r = Math.random(); for (const [t, w] of STG().survive) { if (r < w) { queueSpawn(t); break; } r -= w; } }
        rs.idleT = alive + G.spawning === 0 ? rs.idleT + dt : 0;
        if (!last && (rs.phT >= PT || (rs.idleT > 1.2 && rs.phT > 4))) { rs.ph++; rs.phT = 0; survivePhase(rs.ph); }
        else if (last && rs.phT >= PT && !rs.final) { rs.final = true; banner('습격 종료!', '남은 놈들을 쓸어버려라'); sfx('grogi'); }
        { const c = Math.ceil(PT - rs.phT), k = rs.ph * 10 + c; if (c >= 1 && c <= 3 && rs.cdK !== k) { rs.cdK = k; banner(String(c), last ? '버텨라!' : '다음 습격이 온다'); sfx('blip', c === 1 ? 1.5 : 1); } }
        if (last && rs.phT >= PT && alive === 0 && G.spawning === 0) roomClear();
      }
    }
    updateNav(dt);
    G.crackCd = Math.max(0, (G.crackCd || 0) - dt);
    updateGate(dt);
    if (!G.sealed && !G.trans && !P.dead) checkDoors();
    // 상호작용 (F)
    G.prompt = P.dead ? null : nearInteract();
    updateGearCmp();
    if (take('f') && G.prompt) doInteract(G.prompt);
    // 비밀 벽 힌트: 가까이 가면 가끔 먼지가 떨어진다
    if (R.crack && !R.crack.broken) { const c = crackPoint(R); if (Math.hypot(P.x - c.x, P.y - c.y) < 220 && Math.random() < dt * 2.5) G.parts.push({ x: c.x + rand(-12, 12), y: c.y - rand(0, 20), vx: rand(-6, 6), vy: rand(10, 30), t: rand(0.4, 0.8), c: pick(['#6a6470', '#4d4858', '#8a8478']), g: 60 }); }
    // 텔레포터 위 F 안내는 nearInteract에서
  }
  // 4페이즈 리젠 방 설정: 페이즈 길이, 페이즈별 최대 동시 적 수, 페이즈 시작 시 한꺼번에 몰려오는 적
  const SURV_CRY = { // v1.18 습격마다 외치는 한 줄
    1: ['덤불이 술렁인다 — 놈들이 온다!', '고블린 떼가 몰려온다!', '바닥에서 점액이 끓어오른다!', '거대 점액이 깨어났다 — 끝까지 버텨라!'],
    2: ['무덤 뚜껑이 열린다 — 망자가 온다!', '썩은 기사단이 몰려든다!', '역병의 악취가 짙어진다!', '부푼 시체가 다가온다 — 끝까지 버텨라!'],
    3: ['전쟁 함성이 협곡을 울린다!', '부락 전사들이 쏟아진다!', '정예 오크가 섞여 들어온다!', '대족장의 친위대다 — 끝까지 버텨라!'],
  };
  const SURV_N = 4, SURV_PT = () => G.stage === 1 ? 14 : G.stage === 2 ? 15 : 16;
  const survCap = ph => Math.round(STG().surviveMax * (0.5 + ph * 0.17));
  function survivePhase(ph) {
    banner(ph === SURV_N - 1 ? '최후의 습격!' : `습격 ${ph + 1}/${SURV_N}`, (SURV_CRY[G.stage] || SURV_CRY[1])[Math.min(ph, 3)]); sfx('growl', 0.8 - ph * 0.05); addShake(3 + ph);
    const n = 2 + ph; for (let i = 0; i < n; i++) { let r = Math.random(); for (const [t, w] of STG().survive) { if (r < w) { queueSpawn(t); break; } r -= w; } }
    if (G.stage === 3 && ph >= 2) queueSpawn(pick(['ocharge', 'otroll', 'ogrip']));
    if (G.stage !== 3 && ph === SURV_N - 1) queueSpawn(G.stage === 1 ? 'bigslime' : 'bloat');
  }
  function roomClear() {
    const R = G.dun.cur; R.cleared = true; G.rs.state = 'done';
    sealRoom(false);
    if (R.type === 'elite') {
      const n = ++G.dun.eliteDone;
      banner(`${ER().clear} ${Math.min(n, 2)}/2`, SK().drop); sfx('grogi');
      { const q = freePoint(CX, CY + 44); spawnLoot('sealkey', q.x, q.y); G.fx.push({ kind: 'skybeam', x: q.x, y: q.y, w: 22, c: SK().rgb, t: 0.8, max: 0.8, up: true }); } // v1.18 봉인 열쇠
      R.chest = { x: CX, y: CY - 10, opened: false, kind: 'elite' }; // v0.98 엘리트 보상 상자 → 장비 3택1
      G.fx.push({ kind: 'skybeam', x: CX, y: CY - 10, w: 30, c: '255,170,90', t: 0.6, max: 0.6 });
    } else if (R.type === 'survive') {
      banner('봉인 해제!', '살아남았다 — 보상 상자가 나타났다');
      R.chest = { x: CX, y: CY - 10, opened: false, kind: 'reward' };
      G.fx.push({ kind: 'skybeam', x: CX, y: CY - 10, w: 30, c: '255,210,120', t: 0.6, max: 0.6 });
    }
    // 건전식 방 클리어 보상: 일정 확률로 보급품
    if (R.type === 'combat' && Math.random() < 0.35) { const p = freePoint(CX, CY); spawnLoot(pick(['meat', 'meat', 'orb', 'pouch']), p.x, p.y); }
    if (R.tele && !G.dun.teleHint) { G.dun.teleHint = true; lootFeed('텔레포터 활성화 — TAB 지도에서 순간이동', '#9fd2ff'); }
  }
  function freePoint(x, y) { for (let i = 0; i < 30; i++) { const a = rand(0, TAU), d = i * 6; const px = clamp(x + Math.cos(a) * d, A.x0 + 20, A.x1 - 20), py = clamp(y + Math.sin(a) * d, A.y0 + 20, A.y1 - 20); if (!obsHitL(G.obs || [], px, py, 14)) return { x: px, y: py }; } return { x, y }; }
  function checkDoors() {
    const P = G.player, R = G.dun.cur;
    for (const d in DIRS) {
      if (doorState(R, d) !== 'open') continue;
      const D0 = DOOR[d], inX = Math.abs(P.x - D0.x) < 20, inY = Math.abs(P.y - D0.y) < 20;
      if ((d === 'n' && inX && P.y <= A.y0 + P.r + 1) || (d === 's' && inX && P.y >= A.y1 - P.r - 1) || (d === 'w' && inY && P.x <= A.x0 + P.r + 1) || (d === 'e' && inY && P.x >= A.x1 - P.r - 1)) {
        goRoom(G.dun.rooms[R.doors[d]], OPP[d]); return;
      }
    }
  }
  function debugClearRoom() {
    const R = G.dun.cur;
    if (!G.rs || (G.rs.state !== 'intro' && G.rs.state !== 'run') || R.type === 'boss') return;
    G.enemies.forEach(e => { if (!e.dead) killEnemy(e, true); }); G.tele = []; G.spawning = 0;
    if (R.type === 'elite' || R.type === 'combat' || R.type === 'survive') roomClear();
  }
  function debugToBoss() {
    const D = G.dun; D.eliteDone = 2; D.sock = [true, true]; D.bossOpen = true; D.gate = null;
    const entry = Object.keys(D.boss.doors).find(d => D.boss.doors[d] != null);
    D.foyer.visited = D.foyer.seen = true; D.foyer.cleared = true;
    goRoom(D.boss, entry);
  }

  // ---------- 비밀 벽
  function crackPoint(R) { const d = R.crack.dir, p = DOOR[d]; return { x: p.x + (d === 'w' ? 6 : d === 'e' ? -6 : 0), y: p.y + (d === 'n' ? 6 : d === 's' ? -6 : 0) }; }
  function hitCrack(x, y, power = 1, rad = 40) { const a = G && G.drums && G.drums.length ? hitDrums(x, y, power, rad) : false; return hitCrack0(x, y, power, rad) || a; }
  function hitCrack0(x, y, power = 1, rad = 40) {
    const R = G && G.dun && G.dun.cur; if (!R || !R.crack || R.crack.broken) return false;
    const c = crackPoint(R); if (Math.hypot(x - c.x, y - c.y) > rad) return false;
    if (G.crackCd > 0) return true;
    G.crackCd = 0.22; R.crack.hp -= power;
    debris(c.x, c.y, 10); sfx('block'); addShake(3); /* v1.08 역경직 제거 */
    G.fx.push({ kind: 'hitspark', x: c.x, y: c.y - 6, ang: rand(0, TAU), rot: 0, t: 0.12, max: 0.12, r: 18, c: '230,220,200' });
    if (R.crack.hp <= 0) {
      R.crack.broken = true;
      const S = G.dun.rooms[R.doors[R.crack.dir]]; S.seen = true;
      sfx('blast'); addShake(9); flashT = 0.08; flashColor = '#fff0d0'; debris(c.x, c.y, 30); dust(c.x, c.y, 20);
      banner('비밀 통로', '숨겨진 방을 찾았다');
      paintRoomFloor(R);
    }
    return true;
  }

  // ---------- 상호작용: 상자 · 상인 · 텔레포터 · 모닥불
  function nearInteract() {
    const P = G.player, R = G.dun.cur, near = (o, d = 34) => Math.hypot(P.x - o.x, P.y - o.y) < d;
    { const fi = forgeInteract(); if (fi) return fi; }
    if (R.chest && (!R.chest.opened || R.chest.pending) && !R.chest.fall && near(R.chest, 36)) return { k: 'chest', o: R.chest, x: R.chest.x, y: R.chest.y - 30, t: R.chest.pending ? 'F 보류한 전리품 고르기' : R.chest.kind === 'boss' ? 'F 보스의 전리품' : 'F 상자 열기' };
    { const gl = nearGear(); if (gl) return { k: 'gear', o: gl, x: gl.x, y: gl.y - 30, t: 'F 줍기' }; }
    if (R.socks && !G.dun.bossOpen && !G.dun.gate) for (const s of R.socks) if (!(s.dual ? G.dun.sock[0] && G.dun.sock[1] : G.dun.sock[s.i]) && near(s, 36)) { const K = SK(), y = s.y - SOCK_H[G.stage] - 8; return G.dun.keys > 0 ? { k: 'sock', o: s, x: s.x, y, t: `F ${K.act}` } : { k: 'none', o: s, x: s.x, y, t: K.need, bad: true }; }
    if (R.exit && near(R.exit, 26)) return { k: 'exit', o: R.exit, x: R.exit.x, y: R.exit.y - 30, t: R.type === 'forge' ? `F STAGE ${G.stage + 1}로` : G.stage < lastStage() ? `F 다음 스테이지로 · 대장간` : 'F 토벌 완료' };
    if (R.shop) for (const it of R.shop) if (!it.sold && near(it, 26)) return { k: 'shop', o: it, x: it.x, y: it.y - 34, t: `F ${SHOP_N[it.k]} · ${it.price}G`, bad: G.gold < it.price };
    if (G.bonfire && !R.used && near(G.bonfire, 44)) return { k: 'rest', o: G.bonfire, x: G.bonfire.x, y: G.bonfire.y - 38, t: 'F 휴식 · 축복 선택' };
    if (R.tele && R.cleared && near(R.tele, 22)) return { k: 'tele', o: R.tele, x: R.tele.x, y: R.tele.y - 24, t: 'F 지도 · 순간이동' };
    return null;
  }
  const SHOP_N = { meat: '체력 물약', orb: '투지 구슬', vial: '핏빛 영약', gear: '장비 꾸러미', iron: '철광석 3개' };
  function rollGradeW(w) { let r = Math.random() * w.reduce((a, b) => a + b, 0); const ks = ['common', 'rare', 'unique', 'legend']; for (let i = 0; i < 4; i++) { if (r < w[i]) return ks[i]; r -= w[i]; } return 'common'; }
  function doInteract(it) {
    const R = G.dun.cur;
    if (it.k === 'station') { openForge('station', it.o.k); return; }
    if (it.k === 'none') { sfx('block'); return; }
    if (it.k === 'sock') { placeSeal(it.o); return; }
    if (it.k === 'exit') { // v1.01: 주우지 않은 보스 전리품이 있으면 한 번 더 확인
      if (R.type === 'forge') { sfx('awaken'); flashT = 0.15; flashColor = '#ffe0b0'; leaveForge(); return; }
      const left = (R.chest && R.chest.kind === 'boss' && !R.chest.opened) || G.dun.rooms.some(r => r.chest && r.chest.pending) || G.loot.some(l => l.type === 'gear');
      if (left && !(G.exitArm > time)) { G.exitArm = time + 3; sfx('block'); lootFeed('아직 챙기지 않은 전리품이 있다 — 다시 F를 누르면 출발', '#ffb060', 3000); return; }
      sfx('awaken'); flashT = 0.15; flashColor = '#ffe0b0'; G.exitArm = 0;
      if (G.stage < lastStage()) stageClear(); else showResult(true); return;
    }
    if (it.k === 'gear') { collectLoot(it.o); it.o.life = -1; G.loot = G.loot.filter(l => l !== it.o); gearCmpId = null; sfx('select'); return; }
    if (it.k === 'chest') {
      const c = it.o; if (c.pending) { openPick(c.kind, c); return; }
      c.opened = true; c.openT = 0;
      sfx('drop'); sfx('coin'); addShake(3);
      G.fx.push({ kind: 'skybeam', x: c.x, y: c.y, w: 26, c: c.kind === 'secret' ? '200,140,255' : '255,210,120', t: 0.5, max: 0.5, up: true });
      spawnLoot('pouch', c.x, c.y + 6);
      if (c.kind === 'boss') { openBossChest(c); return; } // v0.98: 보스 장비는 상자에서
      if (c.kind === 'reward' || c.kind === 'elite') { openPick(c.kind, c); return; } // v0.98: 장비 3개 중 하나를 고른다
      const g = rollGradeW(c.kind === 'secret' ? [0, 35, 50, 15] : [25, 50, 20, 5]);
      spawnLoot('gear', c.x, c.y + 6, makeItem(G.cls, { grade: g }));
      if (c.kind === 'secret') { spawnLoot('orb', c.x, c.y + 6); spawnLoot('bigmeat', c.x, c.y + 6); G.crystal++; lootFeed('정령의 결정 +1', '#9fd2ff'); }
    } else if (it.k === 'shop') {
      const s = it.o;
      if (G.gold < s.price) { sfx('block'); lootFeed(`골드가 부족하다 (${G.gold}/${s.price}G)`, '#ff7070'); return; }
      G.gold -= s.price; s.sold = true; sfx('coin');
      if (s.k === 'iron') { G.iron += 3; lootFeed('철광석 조각 +3', '#c9b07a'); }
      else if (s.k === 'gear') spawnLoot('gear', s.x, s.y + 4, makeItem(G.cls, { grade: rollGradeW([0, 70, 26, 4]) }));
      else spawnLoot(s.k, s.x, s.y + 4);
      G.nums.push({ x: s.x, y: s.y - 30, v: String(s.price), t: 0.8, c: '#ffd34d', s: 2 });
    } else if (it.k === 'rest') {
      openRest();
    } else if (it.k === 'tele') openMap();
  }
  // ---------- v0.98 전리품 3택1: 서로 다른 부위 3개 중 하나를 골라 바로 장착 (이전 장비는 가방으로)
  const PICK_W = { reward: { 1: [20, 52, 23, 5], 2: [12, 50, 30, 8], 3: [6, 46, 38, 10] }, elite: { 1: [30, 50, 17, 3], 2: [20, 50, 25, 5], 3: [10, 48, 34, 8] } };
  function pickCompare(it) {
    if (!canEquip(it, G.cls)) return '<div class="pkCmp">다른 직업 무기</div>';
    SAVE.inv.push(it); const nx = statsIf(it.slot, it.id); SAVE.inv.pop(); const cur = calcStats(G.buffs);
    const curIt = SAVE.inv.find(i => i.id === eqOf(G.cls)[it.slot]);
    const rows = INV_STATS.map(([k, n, f]) => { const dv = nx[k] - cur[k], tiny = ['crit', 'critDmg', 'cdr'].includes(k) ? 0.0005 : 0.5; if (Math.abs(dv) < tiny) return ''; return `<span class="${dv > 0 ? 'up' : 'dn'}">${n} ${dv > 0 ? '▲' : '▼'}${f(Math.abs(dv)).replace('%', '')}${['crit', 'critDmg', 'cdr'].includes(k) ? '%p' : ''}</span>`; }).join('');
    return `<div class="pkCmp"><i>${curIt ? `가방으로 · 「${curIt.name}」 대신 끼면` : '빈 칸 — 바로 장착'}</i>${rows || '<span>능력치 변화 없음</span>'}</div>`;
  }
  // v1.00 지금 장착 중인 장비 6칸 요약 (3택1 화면)
  function curGearStrip() {
    const eq = eqOf(G.cls);
    return '<div class="gcH">착용 중</div><div class="pcRow">' + SLOTS.map(sl => { const it = SAVE.inv.find(i => i.id === eq[sl.k]); if (!it) return `<div class="pc" style="--c:#3a2f40"><b>${sl.k === 'weapon' ? CLASSES[G.cls].weapon : sl.n}</b><i>빈 칸</i></div>`;
      const g = gradeOf(it), v = itemVal(it); return `<div class="pc" style="--c:${g.c}"><b>${slotName(it)}</b><span>${it.name}${it.lv ? ` +${it.lv}` : ''}</span><i>${it.stat === 'crit' ? `치명 +${v}%` : `${sl.label} +${v}`}${it.efx ? ` · ◆${EFX[it.efx].n}` : ''}${it.set ? ` · ⬢` : ''}</i></div>`; }).join('') + '</div>';
  }
  function openPick(kind, c) {
    mode = 'pick'; const w = PICK_W[kind][G.stage] || PICK_W[kind][1], slots = SLOTS.map(x => x.k);
    let ch = c && c.pick; // v1.19 보류했던 상자는 같은 세 장비를 다시 보여 준다
    if (!ch) { ch = []; for (let i = 0; i < 3; i++) { const sl = slots.splice(randi(0, slots.length - 1), 1)[0]; ch.push(makeItem(G.cls, { grade: rollGradeW(w), slot: sl })); } if (c) { c.pick = ch; c.pending = true; } }
    G.pickCh = ch; G.pickChest = c || null; sfx('drop'); if (ch.some(it => it.grade === 'legend')) sfx('legend');
    $('pkTitle').textContent = kind === 'elite' ? ER().loot : '보상 상자';
    $('pkChoices').innerHTML = ch.map((it, i) => { const g = gradeOf(it), sl = slotOf(it), v = itemVal(it);
      return `<button class="pkCard pf" data-i="${i}" style="--c:${g.c}"><div class="gr">${g.n} · ${slotName(it)}</div><div class="nm">${it.name}</div><div class="mn">${it.stat === 'crit' ? `치명 확률 +${v}%` : `${sl.label} +${v}`}</div>${it.opts.map(o => `<div>${optText(o)}</div>`).join('')}${it.fx ? `<div class="fx">★ ${LEGEND_FX[it.fx].d}</div>` : ''}${itemExtra(it, G.cls)}${pickCompare(it)}<span class="key">${i + 1}</span></button>`; }).join('');
    $('pkChoices').querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => takePick(+b.dataset.i)));
    $('pkCur').innerHTML = curGearStrip();
    $('ovPick').classList.add('on');
  }
  // v1.19 고르지 않고 닫기: 상자는 열린 채로 남고, 다시 F를 누르면 같은 세 장비 중에서 고른다
  function closePick() {
    if (mode !== 'pick') return;
    G.pickCh = null; G.pickChest = null; $('ovPick').classList.remove('on'); for (const k in pressed) pressed[k] = false; mode = 'play'; sfx('blip');
    lootFeed('전리품을 보류했다 — 상자 앞에서 F로 다시 고를 수 있다', '#9a8f8a', 3200);
  }
  function takePick(i) {
    const it = G.pickCh && G.pickCh[i]; if (!it) return;
    const P = G.player, g = gradeOf(it);
    SAVE.inv.push(it); G.fieldItems.push(it);
    const empty = canEquip(it, G.cls) && !SAVE.inv.find(x => x.id === eqOf(G.cls)[it.slot]); // v1.19 빈 칸일 때만 바로 장착, 아니면 가방으로
    if (empty) { const oldHp = G.stats.hp; eqOf(G.cls)[it.slot] = it.id; G.stats = calcStats(G.buffs); P.hp = clamp(P.hp + Math.max(0, G.stats.hp - oldHp), 1, G.stats.hp); }
    if (G.pickChest) { G.pickChest.pending = false; G.pickChest.pick = null; G.pickChest = null; }
    persist(); G.pickCh = null; $('ovPick').classList.remove('on'); for (const k in pressed) pressed[k] = false; mode = 'play'; sfx('select');
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 10, grow: 160, t: 0.5, max: 0.5, c: g.c });
    lootFeed(`<b style="color:${g.c}">[${g.n}] ${it.name}</b> — ${empty ? '빈 칸이라 바로 장착' : '가방에 보관 (I)'}${it.set ? ` · ${SETS[it.set].n} ${setCount(it.set)}/4` : ''}`, g.c, 4200);
  }
  // v0.98 보스 전리품 상자: 열면 장비가 튀어나와 등급 빛기둥을 세우고, 잠시 뒤 대장간(또는 결과 화면)으로
  function openBossChest(c) {
    G.newItems = []; const n = c.items.length; // v1.01: 보스 장비도 바닥에 떨어지고 F로 줍는다
    c.items.forEach((it, i) => { spawnLoot('gear', c.x, c.y + 6, it); const l = G.loot[G.loot.length - 1], a = Math.PI / 2 + (i - (n - 1) / 2) * 0.7; l.vx = Math.cos(a) * 90 + (i - (n - 1) / 2) * 40; l.vy = Math.sin(a) * 70; l.vz = 170; });
    addShake(6); flashT = 0.12; flashColor = '#fff0c0';
    G.fx.push({ kind: 'ring', x: c.x, y: c.y - 6, r: 8, grow: 220, t: 0.5, max: 0.5, c: '#ffd34d' });
    if (c.items.some(it => it.grade === 'legend')) setTimeout(() => { if (G) sfx('legend'); }, 500);
    c.items.forEach(it => lootFeed(`<b style="color:${gradeOf(it).c}">[${gradeOf(it).n}] ${it.name}</b>${it.set ? ` · ${SETS[it.set].n}` : ''}${it.curse ? ' · 저주' : ''}`, gradeOf(it).c, 4200));
    lootFeed('장비는 가까이 가서 F로 줍는다', '#9a8f8a');
  }
  function restDone() { G.dun.cur.used = true; banner('축복을 얻었다', ''); }

  // ---------- 적 길찾기 (흐름장)
  function updateNav(dt) {
    if (!G.obs || !G.obs.length) { G.navDist = null; return; }
    G.navT -= dt; if (G.navT > 0 && G.navDist) return;
    G.navT = 0.25;
    G.navDist = navFlood(G.nav, G.player.x, G.player.y);
  }
  function losClear(x0, y0, x1, y1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8);
    for (let k = 1; k < n; k++) { const i = navIdx(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n); if (i >= 0 && !G.nav[i]) return false; }
    return true;
  }
  // 포위: 근접 잡몹은 각자 플레이어 둘레의 자리(slotAng)를 향해 다가가 사방을 막는다
  const SURROUND = new Set(['ghoul', 'dog', 'goblin', 'slime', 'bigslime', 'bloat']);
  function assignSlots() {
    const P = G.player, es = G.enemies.filter(e => !e.dead && SURROUND.has(e.type));
    if (!es.length) return;
    const an = e => Math.atan2(e.y - P.y, e.x - P.x);
    es.sort((a, b) => an(a) - an(b));
    const base = an(es[0]), n = es.length;
    es.forEach((e, i) => { e.slotAng = base + i * TAU / Math.max(n, 3); });
  }
  function slotAng(e, ang) {
    if (e.slotAng == null || !SURROUND.has(e.type)) return ang;
    const P = G.player, dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy), toP = Math.atan2(dy, dx);
    if (d > 240 || d < 34 || Math.abs(angDiff(ang, toP)) > 0.5) return ang;
    const R = Math.min(d * 0.55, 36);
    return Math.atan2(P.y + Math.sin(e.slotAng) * R - e.y, P.x + Math.cos(e.slotAng) * R - e.x);
  }
  function steer(e, ang) {
    ang = slotAng(e, ang);
    if (!G.navDist || e.type === 'crow' || e.type === 'boss') return ang;
    const P = G.player, toP = Math.atan2(P.y - e.y, P.x - e.x);
    if (Math.abs(angDiff(ang, toP)) > 0.8 || losClear(e.x, e.y, P.x, P.y)) return ang;
    const c = navIdx(e.x, e.y); if (c < 0) return ang;
    const i = c % NC, j = (c / NC) | 0; let best = -1, bd = 1e9;
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NC || nj >= NR) continue;
      const n = nj * NC + ni, v = G.navDist[n]; if (v >= 0 && v < bd) { bd = v; best = n; }
    }
    if (best < 0) return ang;
    return Math.atan2(A.y0 + (((best / NC) | 0) + 0.5) * NAV - e.y, A.x0 + (best % NC + 0.5) * NAV - e.x);
  }

  // ---------- 그리기: 바닥(문·구덩이), 구조물 스프라이트
  function paintRoomFloor(R) {
    withSeed(R.seed, () => {
      ROOMSTYLE = R.style || { path: 'wind' }; CUR_ROOM = R;
      if (R.type === 'forge') { paintCastle.forge = true; paintCastle(fg); paintCastle.forge = false; paintCastleWall(fg); paintForgeFloor(fg, R); return; }
      if (G.stage === 1) paintMeadowFloor(fmg); else if (G.stage === 3) { paintOrcFloor(fg, R); paintOrcWall(fg, R); } else { paintCastle(fg); paintCastleWall(fg); withDecor(fg, R, () => paintCastleDecor(fg, R)); }
      const g = G.stage === 1 ? fmg : fg;
      for (const b of R.obs) if (b.t === 'pit') (G.stage === 1 ? paintPond : paintChasm)(g, b);
      for (const d in R.doors) if (R.doors[d] != null && !hiddenDoor(R, d)) (G.stage === 1 ? paintDoorMeadow : G.stage === 3 ? paintDoorOrc : paintDoorCastle)(g, d);
      if (SR_LAYOUT[R.type]) srFloor(g, R); // v1.11
      if (R.tele) paintTelePad(g, R.tele);
    });
  }
  // ---------- 방 그래픽 (v0.24): 게임 전체와 같은 도트 규칙 — 2px 칸, 검은 외곽선, 4단계 명암, 그라데이션 대신 디더링
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const dith = (x, y, lv) => lv * 16 > BAYER[(y & 3) * 4 + (x & 3)]; // lv 0..1, 참이면 칠한다
  const mkGrid = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
  const gAt = (g, x, y) => (g[y] && g[y][x]) || '.';
  function gOutline(g, ch = 'k', skip = '') {
    const out = g.map(r => r.slice());
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) {
      if (g[y][x] !== '.') continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = gAt(g, x + dx, y + dy); if (c !== '.' && c !== ch && !skip.includes(c)) { out[y][x] = ch; break; } }
    }
    return out;
  }
  function gCanvas(g, pal) {
    const [c, cx] = mkCanvas(g[0].length * 2, g.length * 2);
    gPaint(cx, g, pal, 0, 0);
    return c;
  }
  function gPaint(cx, g, pal, x0, y0) {
    x0 = Math.round(x0 / 2) * 2; y0 = Math.round(y0 / 2) * 2;
    if (DEC && decBlock(cx, x0, y0, g[0].length * 2, g.length * 2)) return;
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) { const ch = g[y][x]; if (ch === '.' || !pal[ch]) continue; cx.fillStyle = pal[ch]; cx.fillRect(x0 + x * 2, y0 + y * 2, 2, 2); }
  }
  const fromRows = rows => { const w = Math.max(...rows.map(r => r.length)); return rows.map(r => r.padEnd(w, '.').split('')); };
  // 명암: 왼쪽 위에서 빛
  const shade4 = (dx, dy, r, j = 0.22) => { const v = (dx + dy * 1.1) / (r * 1.4) + rand(-j, j); return v < -0.5 ? 'h' : v < 0 ? 'l' : v < 0.5 ? 'd' : 'D'; };

  const STONE = { k: '#0b0a0e', K: '#050407', h: '#5e5868', l: '#423d4c', d: '#2d2935', D: '#1c1922', m: '#3a5226', M: '#567234', w: '#a49c8e', W: '#d8d0c0', r: '#7a1820' };
  const LEAF = Object.assign({ k: '#07100a', r: '#b83040', y: '#e0c040', p: '#a070d0', t: '#3a2a1c', T: '#22180e' }, TREE_PAL.green);

  // --- 장애물 생성기 -------------------------------------------------
  // 초원 덤불 벽: 잎 뭉치를 겹쳐 쌓는다 (발자국 wc×hc칸 + 높이 HH칸)

  // 성채 기둥: 기둥머리·몸통(세로 4단 명암)·주춧돌, 부서진 것도 있다
  function genPillar(broken) {
    const Hc = broken ? randi(13, 17) : 24, W0 = 17, g = mkGrid(W0, Hc + 2);
    const col = x => x <= 4 ? 'h' : x <= 7 ? 'l' : x <= 10 ? 'd' : 'D';
    for (let y = 1; y <= Hc; y++) {
      const base = y >= Hc - 2, cap = !broken && y <= 3;
      const x0 = base || cap ? 1 : 3, x1 = base || cap ? W0 - 2 : W0 - 4;
      for (let x = x0; x <= x1; x++) g[y][x] = base ? (y === Hc - 2 ? 'h' : y === Hc ? 'D' : col(x)) : cap ? (y === 1 ? 'h' : y === 3 ? 'D' : 'l') : ((y - 4) % 5 === 4 ? 'D' : col(x));
    }
    if (broken) for (let x = 3; x <= W0 - 4; x++) { const cut = randi(0, 3); for (let y = 1; y < 1 + cut; y++) g[y][x] = '.'; if (g[1 + cut]) g[1 + cut][x] = 'l'; }
    let cx = randi(5, 11), cy = randi(5, Hc - 5); for (let i = 0; i < 5; i++) { if (g[cy] && g[cy][cx] !== '.') g[cy][cx] = 'K'; cx += randi(-1, 1); cy++; }
    for (let i = 0; i < 4; i++) { const x = randi(2, W0 - 3), y = randi(Hc - 4, Hc - 1); if (g[y][x] !== '.' && Math.random() < 0.7) g[y][x] = pick(['m', 'M']); }
    return gOutline(g);
  }
  // 성채 무너진 벽: 윗면 벽돌 + 앞면 어두운 벽돌, 윗면 가장자리가 깨져 있다
  // ================================================================ v1.03 오브젝트 도트 다시 그리기 — 덩어리 대신 구조가 읽히게
  // 챕터 1 수풀: 둥근 덤불 여러 무더기(뒤→앞), 가장자리는 잎끝이 톡톡 튀어나오고, 안쪽은 잎 모양 무늬(밝은 칸+어두운 칸 짝)
  function genHedge(wc, hc) {
    const HH = 9, W0 = wc + 4, H0 = hc + HH + 4, g = mkGrid(W0, H0);
    const TONE = ['h', 'l', 'd', 'D'], tone = i => TONE[clamp(i, 0, 3)];
    const cl = [], n = Math.max(3, Math.round(W0 / 9) + Math.round(H0 / 14));
    for (let i = 0; i < n * 2; i++) { const R = rand(5, 8.5); cl.push({ x: rand(R * 0.7, W0 - R * 0.7), y: rand(R * 0.6 + 1, H0 - R * 0.75 - 2), R, ph: rand(0, 6) }); }
    for (let x = 4; x < W0 - 2; x += 7) cl.push({ x: x + rand(-1, 1), y: H0 - rand(6, 7.5), R: rand(5, 6.5), ph: rand(0, 6) });
    // 빈틈은 그늘로 칠하지 않고 그 자리에 작은 덤불을 더 놓아 메움 (충돌 영역이 다 덮이게)
    for (let it = 0; it < 600; it++) { let gap = null;
      for (let y = 8; y < H0 - 7 && !gap; y += 2) for (let x = 7; x < W0 - 7 && !gap; x += 2) if (!cl.some(c => Math.hypot(x - c.x, (y - c.y) * 1.12) < c.R * 0.95)) gap = { x, y }; // 안쪽만 (가장자리는 울퉁불퉁하게 둠)
      if (!gap) break; cl.push({ x: gap.x + rand(-0.5, 0.5), y: gap.y + rand(-0.5, 0.5), R: rand(4.5, 6), ph: rand(0, 6) }); }
    cl.sort((a, b) => a.y - b.y);
    const own = mkGrid(W0, H0);
    cl.forEach((c, ci) => {
      for (let y = 1; y < H0 - 1; y++) for (let x = 1; x < W0 - 1; x++) {
        const dx = x - c.x, dy = (y - c.y) * 1.12, a = Math.atan2(dy, dx), d = Math.hypot(dx, dy), edge = c.R * (1 + 0.1 * Math.sin(a * 6 + c.ph)) + (((x * 7 + y * 3) % 5 === 0) ? 0.6 : 0);
        if (d > edge) continue;
        const t = (dx * 0.62 + dy * 0.8) / c.R; let i = t < -0.5 ? 0 : t < 0.05 ? 1 : t < 0.55 ? 2 : 3;
        if (y > hc + 2) i += 1; // 앞면(세로)은 한 단계 어둡게
        if (d > edge - 1.1 && own[y][x] !== '.' && own[y][x] !== ci) i = 3; // 앞 무더기와 뒤 무더기 사이 그늘
        g[y][x] = tone(i); own[y][x] = ci;
      }
    });
    // 잎 무늬: 엇갈린 격자마다 밝은 칸 + 그 오른쪽 아래 어두운 칸
    for (let y = 2; y < H0 - 2; y += 2) for (let x = 2 + (y >> 1) % 3; x < W0 - 2; x += 3) {
      const c = g[y][x], j = TONE.indexOf(c); if (j < 0 || g[y + 1][x + 1] === '.') continue;
      if (j > 0) g[y][x] = TONE[j - 1]; const c2 = TONE.indexOf(g[y + 1][x + 1]); if (c2 >= 0 && c2 < 3) g[y + 1][x + 1] = TONE[c2 + 1];
    }
    // 꽃: 밝은 쪽에 작은 송이 몇 개만 (점 노이즈 대신 모아서)
    const fl = pick(['r', 'y', 'p']);
    for (let k = 0, tries = 0; k < Math.max(1, Math.round(W0 * H0 / 260)) && tries < 80; tries++) { const x = randi(3, W0 - 4), y = randi(2, hc + 2); if (g[y][x] !== 'h' && g[y][x] !== 'l') continue;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) if ('hl'.includes(g[y + dy][x + dx])) g[y + dy][x + dx] = dx || dy ? fl : 'y'; k++; }
    // 밑동: 그늘 + 줄기 + 풀잎
    for (let x = 2; x < W0 - 2; x++) { let y = H0 - 2; while (y > 0 && g[y][x] === '.') y--; if (y < 1) continue; g[y][x] = 'D'; if (x % 5 === 2 && y + 1 < H0 - 1) g[y + 1][x] = 't'; if (x % 4 === 1 && g[y - 1][x] !== '.') g[y - 1][x] = 'D'; }
    for (let x = 3; x < W0 - 3; x += randi(3, 5)) { let y = H0 - 2; while (y > 0 && g[y][x] === '.') y--; if (y > 2) { g[y][x] = 'l'; g[y - 1][x] = 'h'; } }
    return { g: gOutline(g), HH };
  }
  // 챕터 2 벽: 위는 판석 덮개(크기 제각각·이끼·금), 테두리 처마 그늘, 앞면은 크기 다른 벽돌마다 명암, 빠진 벽돌, 담쟁이, 밑동 이끼·돌부스러기, 가끔 찢어진 기사단 깃발
  function genWallBlock(wc, hc) {
    const HH = 12, W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0);
    // 위: 판석
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) g[y][x] = 'l';
    for (let y = 1; y <= hc;) { const rh = randi(3, 4); let x = 1;
      while (x <= wc) { const w = randi(4, 8);
        for (let yy = y; yy < Math.min(y + rh, hc + 1); yy++) for (let xx = x; xx < Math.min(x + w, wc + 1); xx++) {
          const top = yy === y, left = xx === x, right = xx === x + w - 1 || xx === wc, bot = yy === y + rh - 1;
          g[yy][xx] = (top || left) && !(right || bot) ? 'h' : right || bot ? 'D' : 'l';
        }
        if (w > 5 && Math.random() < 0.35) { let cx = x + randi(1, w - 2), cy = y; for (let k = 0; k < rh; k++) { if (g[cy] && g[cy][cx]) g[cy][cx] = 'd'; cx += pick([-1, 0, 1]); cy++; } } // 금
        x += w; }
      y += rh; }
    for (let k = 0; k < Math.max(1, wc * hc / 160); k++) { const mx = randi(2, wc - 1), my = randi(2, hc - 1), R0 = rand(1.5, 3); for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) { const d = Math.hypot(x - mx, (y - my) * 1.3); if (d < R0 && dith(x, y, 1 - d / R0 + 0.2)) g[y][x] = d < R0 * 0.5 ? 'M' : 'm'; } }
    // 처마: 밝은 테 + 아래 짙은 그늘
    for (let x = 1; x <= wc; x++) { g[hc][x] = 'h'; g[hc + 1][x] = 'K'; }
    // 앞: 벽돌 (줄마다 2칸 벽돌 + 1칸 줄눈, 너비 제각각)
    for (let row = 0, y = hc + 2; y <= hc + HH; row++, y += 3) { let x = 1 - (row % 2) * randi(1, 3);
      while (x <= wc) { const w = randi(3, 6), shade = Math.random(), miss = Math.random() < 0.05;
        for (let xx = Math.max(1, x); xx < Math.min(x + w, wc + 1); xx++) for (let yy = y; yy < Math.min(y + 2, hc + HH + 1); yy++) {
          const last = xx === x + w - 1, lit = shade < 0.6; let c = last ? 'D' : yy === y ? (lit ? 'l' : 'd') : (lit ? 'd' : 'D'); if (!last && yy === y && xx === Math.max(1, x) && lit) c = 'h';
          if (miss && !last) c = yy === y ? 'K' : 'k';
          g[yy][xx] = c; }
        x += w; }
      if (y + 2 <= hc + HH) for (let x2 = 1; x2 <= wc; x2++) g[y + 2][x2] = y + 2 >= hc + HH - 1 ? 'K' : 'D'; }
    // 담쟁이: 처마에서 늘어진 줄기 1~2개
    for (let k = 0; k < (wc > 30 ? 2 : 1); k++) { if (Math.random() < 0.35) continue; let x = randi(3, wc - 3); const L = randi(5, HH - 2);
      for (let j = 0; j < L; j++) { const y = hc + 1 + j; g[y][x] = 'M'; if (j % 2 === 0 && x + 1 <= wc) g[y][x + 1] = 'm'; else if (x - 1 >= 1) g[y][x - 1] = 'm'; if (Math.random() < 0.3) x = clamp(x + pick([-1, 1]), 2, wc - 1); } }
    // 기사단 깃발 (넓은 벽에서 가끔): 찢어진 붉은 천 + 금빛 테
    if (wc >= 34 && Math.random() < 0.3) { const bx = randi(6, wc - 10), L = HH - 3;
      for (let j = 0; j < L; j++) for (let i = 0; i < 6; i++) { const torn = j === L - 1 && (i === 1 || i === 4); if (torn) continue; g[hc + 2 + j][bx + i] = i === 0 || i === 5 ? 'w' : j === 0 ? 'w' : (j + i) % 5 === 0 ? 'D' : 'r'; } }
    // 밑동: 이끼 · 돌부스러기
    for (let x = 1; x <= wc; x++) { if (Math.random() < 0.4) g[hc + HH][x] = pick(['m', 'M']); if (Math.random() < 0.18) g[hc + HH - 1][x] = 'm'; }
    // 덮개 가장자리 깨짐
    for (let x = 1; x <= wc; x++) if (Math.random() < 0.18) { g[1][x] = '.'; if (Math.random() < 0.4 && g[2]) g[2][x] = 'd'; }
    return { g: gOutline(g), HH };
  }

  // 성채 잔해: 작은 돌 여러 개 + 뼈
  function genRubble(r) {
    // 무너진 돌무더기: 둔덕 모양 안을 돌 덩이(보로노이)로 나누고 덩이마다 명암을 준다
    const rx = Math.ceil(r / 2) + 2, ry = Math.ceil(r / 2.6) + 2, W0 = rx * 2 + 3, H0 = ry * 2 + 3, g = mkGrid(W0, H0), cx = W0 / 2, base = H0 - 2;
    for (let x = 1; x < W0 - 1; x++) { const dx = (x + 0.5 - cx) / rx; if (Math.abs(dx) >= 1) continue; const h = Math.round(ry * 1.6 * Math.sqrt(1 - dx * dx) + rand(-0.6, 0.6)); for (let y = base - h; y <= base; y++) if (y >= 1) g[y][x] = '#'; }
    const seeds = []; for (let i = 0; i < Math.max(4, rx * ry / 3.5); i++) seeds.push({ x: rand(1, W0 - 1), y: rand(base - ry * 1.6, base) });
    const own = (x, y) => { let bi = 0, bd = 1e9; seeds.forEach((s, i) => { const d = (x - s.x) ** 2 + ((y - s.y) * 1.4) ** 2; if (d < bd) { bd = d; bi = i; } }); return bi; };
    const O = g.map((row, y) => row.map((c, x) => c === '#' ? own(x, y) : -1));
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
      if (O[y][x] < 0) continue;
      const s = seeds[O[y][x]], edge = (O[y][x + 1] >= 0 && O[y][x + 1] !== O[y][x]) || (O[y + 1] && O[y + 1][x] >= 0 && O[y + 1][x] !== O[y][x]);
      g[y][x] = edge ? 'K' : shade4(x - s.x, y - s.y, 2.2, 0.15);
    }
    if (Math.random() < 0.6) { const x = randi(3, W0 - 6), y = randi(base - ry, base - 1); if (g[y][x] !== '.' && g[y][x + 2] !== '.') { g[y][x] = 'W'; g[y][x + 1] = 'w'; g[y][x + 2] = 'W'; } }
    for (let i = 0; i < 2; i++) { const x = randi(2, W0 - 3); for (let y = 0; y < H0; y++) if (g[y][x] !== '.') { if (Math.random() < 0.5) g[y][x] = pick(['m', 'M']); break; } }
    return gOutline(g);
  }
  // 초원 바위 더미 (기존 rockBig/rockA를 2px로 조합)
  function rockCanvas(r) {
    const big = r > 17, [c, cx] = mkCanvas(big ? 52 : 32, big ? 30 : 22);
    cx.fillStyle = 'rgba(0,0,0,.35)'; for (let x = 4; x < (big ? 48 : 28); x += 2) cx.fillRect(x, (big ? 26 : 18), 2, 2);
    if (big) { stamp(cx, DECO_MAPS.rockBig, DECO, 0, 6, 2); stamp(cx, DECO_MAPS.rockA, DECO, 30, 12, 2, true); }
    else stamp(cx, DECO_MAPS.rockBig, DECO, 2, 2, 2, Math.random() < 0.5);
    return c;
  }

  // --- 바닥: 구덩이 · 연못 · 길 · 텔레포터 -------------------------
  function genChasm(wc, hc) {
    const W0 = wc + 2, H0 = hc + 2, g = mkGrid(W0, H0);
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) {
      const rim = y === 1 || y === hc || x === 1 || x === wc;
      if (rim) { g[y][x] = y === 1 ? 'h' : (x + y) % 5 === 0 ? 'D' : 'l'; continue; }
      const dy = y - 2; // 안쪽 윗벽: 벽돌이 아래로 갈수록 어두워진다
      if (dy < 7) {
        const off = (Math.floor(dy / 2) % 2) * 3, mort = dy % 2 === 1 || (x + off) % 6 === 0;
        g[y][x] = dy < 2 ? (mort ? 'D' : 'l') : dy < 4 ? (mort ? 'K' : 'd') : dith(x, y, (7 - dy) / 4) ? 'D' : 'K';
      } else g[y][x] = x === 2 || x === wc - 1 ? (dith(x, y, 0.5) ? 'D' : 'K') : 'K';
    }
    for (const [x, y] of [[1, 1], [wc, 1], [1, hc], [wc, hc]]) g[y][x] = '.';
    for (let i = 0; i < wc / 5; i++) { const x = randi(2, wc - 1); if (g[hc][x] === 'l') g[hc][x] = 'd'; }
    for (let i = 0; i < wc * hc / 70; i++) { const x = randi(3, wc - 2), y = randi(Math.min(hc - 1, 10), hc - 1); if (g[y][x] === 'K') g[y][x] = 'p'; }
    return gOutline(g);
  }
  const CHASM_PAL = Object.assign({}, STONE, { p: '#3a1e58' });
  function genPond(wc, hc, style = 'clear', shape = 'blob') {
    const W0 = wc + 6, H0 = hc + 6, g = mkGrid(W0, H0), cx = W0 / 2, cy = H0 / 2, rx = wc / 2, ry = hc / 2, a1 = rand(0, 6), a2 = rand(0, 6);
    const lobes = shape === 'lobes' ? [[-0.45, 0.12, 0.55], [0.42, -0.1, 0.58], [0, 0.05, 0.72]] : shape === 'kidney' ? [[-0.38, 0.05, 0.62], [0.36, -0.12, 0.64]] : null;
    const inside = (x, y) => {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, an = Math.atan2(dy, dx);
      if (lobes) return lobes.some(([ox, oy, r]) => ((dx - ox) / r) ** 2 + ((dy - oy) / r) ** 2 < 1 - 0.07 * Math.sin(an * 4 + a1));
      return dx * dx + dy * dy < 1 - 0.1 * Math.sin(an * 3 + a1) - 0.07 * Math.sin(an * 5 + a2);
    };
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) if (inside(x, y)) g[y][x] = 'W';
    // 가운데 작은 섬
    const isl = style === 'island' ? { x: cx + rand(-rx * 0.2, rx * 0.2), y: cy + rand(-ry * 0.1, ry * 0.15), r: Math.max(3, Math.min(rx, ry) * 0.32) } : null;
    if (isl) for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) { const e = ((x - isl.x) / isl.r) ** 2 + ((y - isl.y) / (isl.r * 0.7)) ** 2; if (e < 1 && g[y][x] === 'W') g[y][x] = e < 0.45 ? 'i' : e < 0.8 ? 'I' : 'B'; }
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
      if (g[y][x] !== 'W') continue;
      const up1 = !'Wiw'.includes(gAt(g, x, y - 1)) && gAt(g, x, y - 1) !== 'I', up2 = gAt(g, x, y - 2) === '.', up3 = gAt(g, x, y - 3) === '.';
      if (gAt(g, x, y - 1) === '.') g[y][x] = 'b'; else if (up2) g[y][x] = 'B'; else if (up3) g[y][x] = 'D';
      else { const t = (y - (cy + ry * 0.2)) / (ry * 0.4); if (t > 1 || (t > 0 && dith(x, y, t))) g[y][x] = 'w'; }
    }
    // 물결·달빛 줄기·녹조
    for (let i = 0; i < wc * hc / 100 + 1; i++) { const x = randi(3, W0 - 6), y = randi(4, H0 - 4); for (let k = 0; k < randi(2, 3); k++) if ('Ww'.includes(gAt(g, x + k, y)) && Math.random() < 0.65) g[y][x + k] = 'h'; }
    if (style !== 'swamp' && Math.random() < 0.3) { const mx = Math.round(cx + rand(-rx * 0.3, rx * 0.3)); for (let y = 3; y < H0 - 3; y += 4) for (let k = -1; k <= 1; k++) if ('Ww'.includes(gAt(g, mx + k + (y % 4 ? 1 : 0), y)) && Math.random() < 0.3) g[y][mx + k + (y % 4 ? 1 : 0)] = 'h'; }
    if (style === 'swamp') for (let i = 0; i < wc * hc / 60 + 3; i++) { const bx = rand(2, W0 - 2), by = rand(3, H0 - 2), br = rand(1.5, 4); for (let y = Math.floor(by - br); y <= by + br; y++) for (let x = Math.floor(bx - br * 1.5); x <= bx + br * 1.5; x++) { if (!'Ww'.includes(gAt(g, x, y))) continue; const e = ((x - bx) / (br * 1.5)) ** 2 + ((y - by) / br) ** 2; if (e < 1 && Math.random() < 1 - e * 0.6) g[y][x] = e < 0.35 ? 'o' : 'a'; } }
    // 수련 (맑은 물), 거품 (늪), 떠다니는 낙엽
    if (style === 'clear' || style === 'island') for (let i = 0; i < wc * hc / 90 + 1; i++) { const x = randi(3, W0 - 5), y = randi(5, H0 - 5); if (g[y][x] === 'W' && g[y][x + 1] === 'W' && g[y + 1][x] !== '.') { g[y][x] = 'L'; g[y][x + 1] = 'l'; g[y + 1][x] = 'L'; if (Math.random() < 0.4) g[y][x + 1] = 'f'; } }
    if (Math.random() < 0.35) for (let i = 0; i < wc * hc / 120 + 1; i++) { const x = randi(3, W0 - 4), y = randi(4, H0 - 4); if ('Ww'.includes(g[y][x])) g[y][x] = 'A'; }
    if (isl && Math.random() < 0.7) { const x = Math.round(isl.x), y = Math.round(isl.y) - 1; for (const [dx, dy, c] of [[-1, 0, 'L'], [0, -1, 'l'], [1, 0, 'L'], [0, 0, 'L'], [0, 1, 'k']]) if (g[y + dy]) g[y + dy][x + dx] = c; }
    const o = gOutline(g);
    // 물가: 갈대·풀 (늪은 갈대가 훨씬 많다), 돌 테두리 (바위 연못)
    const reedP = style === 'swamp' ? 0.45 : 0.18;
    for (let x = 1; x < W0 - 1; x++) for (let y = 1; y < H0 - 1; y++) {
      if (o[y][x] !== 'k') continue;
      if (style === 'rocky' && Math.random() < 0.22) { const w = randi(2, 3); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= w; dx++) { const yy = y + dy, xx = x + dx; if (!o[yy] || o[yy][xx] === undefined || 'WwDbBhLlfA'.includes(o[yy][xx])) continue; o[yy][xx] = dy === -1 || dx === -1 || dx === w || dy === 1 ? (o[yy][xx] === '.' || o[yy][xx] === 'k' ? 'K' : o[yy][xx]) : dx === 0 ? 'G' : dx === w - 1 ? 'd' : 'g'; } continue; }
      if (o[y - 1][x] !== '.') continue;
      if (Math.random() < reedP) { const h = randi(2, style === 'swamp' ? 6 : 4); for (let k = 1; k <= h; k++) if (o[y - k] && o[y - k][x] === '.') o[y - k][x] = k === h ? (style === 'swamp' && Math.random() < 0.5 ? 'T' : 'M') : 'R'; }
      else if (Math.random() < 0.25) o[y - 1][x] = 'm';
    }
    if (style === 'swamp') for (let x = 1; x < W0 - 1; x++) for (let y = 1; y < H0 - 1; y++) if ('Wwa'.includes(o[y][x]) && Math.random() < 0.01) { o[y][x] = 'R'; if (o[y - 1][x] !== '.') o[y - 1][x] = 'T'; }
    return o;
  }
  const POND_PALS = {
    clear: { W: '#13304c', w: '#1c4466', D: '#0c1a2c', h: '#456780' },
    island: { W: '#13304c', w: '#1c4466', D: '#0c1a2c', h: '#456780' },
    rocky: { W: '#0f2a46', w: '#18406a', D: '#081624', h: '#587b98' },
    swamp: { W: '#16221a', w: '#1e3024', D: '#0c140c', h: '#5a6a3a' },
  };
  const POND_PAL = { Y: '#a08a4a', K: '#0b0a0e', a: '#3a5a22', o: '#6a8a3a', A: '#c86a2a', I: '#2e5222', i: '#4a7a34', T: '#5a3a20', G: '#8a8494', g: '#6a6474', d: '#4a4554', k: '#081210', b: '#6e5236', B: '#4a3424', D: '#0c1a2c', W: '#13304c', w: '#1c4466', h: '#456780', L: '#3e6a2c', l: '#6a9a44', f: '#e8b8d0', R: '#4a6a2e', M: '#8aa84a', m: '#2e5222' };
  // 흙길 한 조각: dir 방향으로 이어지는 길, far 쪽은 디더링으로 어두워진다
  function genPath(wc, hc, vert, farSide) {
    const g = mkGrid(wc, hc), half = vert ? wc / 2 : hc / 2, len = vert ? hc : wc;
    for (let i = 0; i < len; i++) {
      const w = 5 + (Math.sin(i * 0.7) > 0.6 ? 1 : 0) + randi(0, 1);
      const span = Math.ceil(w * 1.4);
      for (let j = -span; j <= span; j++) {
        const x = vert ? Math.round(half + j) : i, y = vert ? i : Math.round(half + j);
        if (x < 0 || y < 0 || x >= wc || y >= hc) continue;
        const t = Math.abs(j + 0.5) / w;
        if (t < 0.5) { g[y][x] = Math.random() < 0.025 ? 'g' : Math.random() < 0.08 ? 'w' : 'b'; continue; }
        const lv = clamp((1.4 - t) / 0.9, 0, 1);
        if (dith(x, y, lv)) g[y][x] = Math.random() < 0.35 ? 'B' : 'b'; else if (dith(x + 1, y + 2, lv * 0.85)) g[y][x] = 'e';
      }
    }
    // 길가 풀
    for (let i = 0; i < len * 0.6; i++) { const x = randi(0, wc - 1), y = randi(0, hc - 1); if (g[y][x] === '.') g[y][x] = pick(['m', 'M', '.']); }
    // 먼 쪽 어둠
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const t = farSide === 'n' ? 1 - y / hc : farSide === 's' ? y / hc : farSide === 'w' ? 1 - x / wc : x / wc;
      const lv = clamp((t - 0.35) / 0.55, 0, 1);
      if (lv > 0 && g[y][x] !== '.' && dith(x, y, lv)) g[y][x] = lv > 0.85 ? '.' : 'k';
    }
    return g;
  }
  const PATH_PAL = { e: '#3a4426', k: '#081008', b: '#62482e', w: '#7e6040', B: '#56402a', g: '#8a8478', m: '#2e5222', M: '#4a7a34' };
  function genTelePad() {
    const W0 = 19, H0 = 11, g = mkGrid(W0, H0), cx = 9, cy = 5;
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
      const dx = (x - cx) / 8.6, dy = (y - cy) / 4.6, e = dx * dx + dy * dy;
      if (e < 1) g[y][x] = e > 0.5 ? (y < cy ? 'l' : 'd') : e > 0.38 ? 'D' : 'K';
    }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, x = Math.round(cx + Math.cos(a) * 7.2), y = Math.round(cy + Math.sin(a) * 3.8); g[y][x] = 'r'; }
    return gOutline(g);
  }
  const TELE_PAL = Object.assign({}, STONE, { r: '#2a2840' });

  // --- 문 · 봉쇄 -------------------------------------------------------
  // 성채 북문: 아치형 돌문틀 + 위로 오르는 계단이 어둠 속으로
  function genArch() {
    const W0 = 27, H0 = 36, g = mkGrid(W0, H0), cx = 13, top = 12;
    const outer = (x, y) => y >= top ? x >= 1 && x <= 25 : Math.hypot(x - cx, (y - top) * 1.0) <= 12.5;
    const inner = (x, y) => y >= top ? x >= 4 && x <= 22 : Math.hypot(x - cx, (y - top)) <= 9.4;
    for (let y = 0; y < H0 - 1; y++) for (let x = 0; x < W0; x++) {
      if (!outer(x, y)) continue;
      if (inner(x, y)) {
        const fromBottom = H0 - 2 - y; // 계단: 아래 6칸만 밝다
        if (fromBottom < 8) g[y][x] = fromBottom % 3 === 0 ? 'l' : 'd';
        else g[y][x] = 'K';
        if (fromBottom >= 5 && fromBottom < 13 && g[y][x] === 'K' && dith(x, y, (13 - fromBottom) / 9)) g[y][x] = 'D';
      } else {
        const ang = Math.atan2(y - top, x - cx), seam = y < top ? Math.abs(Math.sin(ang * 5)) < 0.18 : (y - top) % 4 === 3;
        g[y][x] = seam ? 'D' : x < cx ? 'h' : 'l';
        if (y >= top && x > 22) g[y][x] = seam ? 'K' : 'd';
      }
    }
    for (let y = 0; y < 3; y++) for (let x = cx - 1; x <= cx + 1; x++) if (g[y][x] !== '.') g[y][x] = y === 0 ? 'h' : 'w';
    return gOutline(g);
  }
  // 성채 남·서·동문: 바닥 돌판이 밖으로 이어지며 어두워진다
  function genFloorExit(wc, hc, farSide) {
    const g = mkGrid(wc, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const vert = farSide === 's', i = vert ? y : x, j = vert ? x : y, off = (Math.floor(i / 6) % 2) * 3;
      g[y][x] = i % 6 === 5 || (j + off) % 6 === 5 ? 'D' : (i % 6 === 0 ? 'l' : 'd');
      const t = farSide === 's' ? y / hc : farSide === 'w' ? 1 - x / wc : x / wc, lv = clamp((t - 0.15) / 0.7, 0, 1);
      if (dith(x, y, lv)) g[y][x] = 'K';
    }
    return g;
  }
  function genDoorPost(h) { const g = mkGrid(5, h + 2); for (let y = 1; y <= h; y++) for (let x = 1; x <= 3; x++) g[y][x] = y === 1 ? 'h' : (y - 1) % 4 === 0 ? 'D' : x === 1 ? 'h' : x === 2 ? 'l' : 'd'; return gOutline(g); }
  // 쇠창살 (n/s는 세로 창살, w/e는 가로)
  function genBars(wc, hc, vert) {
    const g = mkGrid(wc, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const along = vert ? x : y, cross = vert ? y : x, L = vert ? hc : wc;
      if (along % 4 === 1) g[y][x] = 'G'; else if (along % 4 === 2) g[y][x] = 'g'; else if (along % 4 === 3) g[y][x] = 'k';
      if (cross === Math.floor(L * 0.28) || cross === Math.floor(L * 0.68)) g[y][x] = along % 4 === 1 ? 'W' : 'g';
      if (vert && y === hc - 1 && along % 4 !== 1 && along % 4 !== 2) g[y][x] = '.';
    }
    return g;
  }
  const BAR_PAL = { k: '#0b0a0e', g: '#4a4656', G: '#7a7488', W: '#a49cb0' };
  const WOOD_BAR = { k: '#0b0806', g: '#553620', G: '#8a6034', W: '#e0d6c4' };
  // 가시덤불: 굵은 덩굴 몇 가닥 + 가시 + 잎 + 열매
  function genThorns(wc, hc, vert) {
    const g = mkGrid(wc, hc), L = vert ? wc : hc, span = vert ? hc : wc, n = Math.max(2, Math.round(span / 6));
    for (let i = 0; i < n; i++) {
      const ph = rand(0, 6), amp = rand(1, 2), base = 2 + i * (span - 4) / Math.max(1, n - 1);
      for (let t = 0; t < L; t++) {
        const o = Math.round(base + Math.sin(t * 0.45 + ph) * amp);
        for (const k of [-1, 0]) { const x = vert ? t : o + k, y = vert ? o + k : t; if (x >= 0 && y >= 0 && x < wc && y < hc) g[y][x] = k ? 'v' : 'V'; }
        if (t % 5 === 2) { const x = vert ? t : o - 2, y = vert ? o - 2 : t; if (x >= 0 && y >= 0 && x < wc && y < hc && g[y][x] === '.') g[y][x] = 't'; }
        if (t % 5 === 4) { const x = vert ? t : o + 1, y = vert ? o + 1 : t; if (x >= 0 && y >= 0 && x < wc && y < hc && g[y][x] === '.') g[y][x] = 't'; }
      }
    }
    for (let i = 0; i < wc * hc / 45; i++) { const x = randi(1, wc - 3), y = randi(1, hc - 2); if (g[y][x] === '.' && g[y][x + 1] === '.' && (gAt(g, x, y + 1) === 'v' || gAt(g, x, y - 1) === 'V')) { g[y][x] = 'L'; g[y][x + 1] = 'l'; } }
    for (let i = 0; i < 2; i++) { const x = randi(2, wc - 3), y = randi(2, hc - 3); if (g[y][x] === 'V') g[y][x] = 'r'; }
    return gOutline(g, 'k', 't');
  }
  const THORN_PAL = { k: '#070a04', V: '#2a3214', v: '#4a5626', t: '#b8a878', L: '#2e5222', l: '#5a8a3a', r: '#c03040' };
  // 보스 문장: 붉은 해골
  const SIGIL = fromRows(['..kkkkkk..', '.krrRRrrk.', 'krRRRRRRrk', 'krkkRRkkrk', 'krkKRRkKrk', 'krRRkkRRrk', '.krRRRRrk.', '..kRkRkRk.', '...kkkkk..']);
  const SIGIL_PAL = { k: '#1a0408', K: '#ff5060', r: '#7a1020', R: '#c02838' };
  // 상자
  const CHEST_C = fromRows(['.kkkkkkkkkkkk.', 'kwwwwwwwwwwwwk', 'kbbbbbbbbbbbbk', 'kybBbbbbbbBbyk', 'kkkkkkyykkkkkk', 'kybbbbkkbbbbyk', 'kbbbbbyybbbbbk', 'kbbbbbbbbbbbbk', 'kybBbbbbbbBbyk', 'kBBBBBBBBBBBBk', '.kkkkkkkkkkkk.']);
  const CHEST_O = fromRows(['.kkkkkkkkkkkk.', 'kBBBBBBBBBBBBk', 'kbbbbbbbbbbbbk', 'kwwwwwwwwwwwwk', 'kkkkkkkkkkkkkk', 'kKyKKKyKKyKKKk', 'kybbbbbbbbbbyk', 'kbbbbbbbbbbbbk', 'kybBbbbbbbBbyk', 'kBBBBBBBBBBBBk', '.kkkkkkkkkkkk.']);
  const CHEST_PAL = { k: '#0b0a0e', K: '#140c06', w: '#a07850', b: '#6a4a30', B: '#4a3220', y: '#e0b040' };
  const CHEST_PAL_B = { k: '#0b0a0e', K: '#160608', w: '#a8323a', b: '#6a1a20', B: '#3e0c12', y: '#ffd34d' }; // v0.98 보스 전리품 상자: 핏빛 칠 · 금 장식
  const CHEST_PAL_S = { k: '#0b0a0e', K: '#120a1c', w: '#8a6ab0', b: '#4a3070', B: '#2e1c4a', y: '#e8d0ff' };
  // 상인: 두건 쓴 떠돌이 상인과 짐수레
  const MERCHANT = fromRows([
    '....kkkk....', '...kCCCCk...', '..kCccccCk..', '..kCkkkkCk..', '.kCkeKKekCk.', '.kCkKKKKkCk.', '.kCCkkkkCCk.',
    'kCccCCCCccCk', 'kCcsCccCscCk', 'kCcsCyyCscCk', 'kCccCyyCccCk', 'kCccCccCccCk', '.kCcCccCcCk.', '.kCcCccCcCk.', '.kCCCCCCCCk.', '..kkkkkkkk..']);
  const MERCHANT_PAL = { k: '#0b0a0e', K: '#050407', C: '#3a2a40', c: '#56405e', e: '#ffd060', s: '#a08a5a', y: '#c9a24a' };
  const CART = fromRows([
    '..kkkk.kkk..kkkk...', '.kbrrbkkggkkyyyyk..', '.kbrrbkgGGgkyooyk..', 'kkkkkkkkkkkkkkkkkk.', 'kwwwwwwwwwwwwwwwwk.', 'kbbbbbbbbbbbbbbbbkk', 'kBBBBBBBBBBBBBBBBk.', '.kkkkkkkkkkkkkkkk..', '..kkk.........kkk..', '.kgGgk.......kgGgk.', '..kkk.........kkk..']);
  const CART_PAL = { k: '#0b0a0e', w: '#8a6a48', b: '#6a4a30', B: '#4a3220', r: '#8a2030', g: '#3a5a7a', G: '#6a8aaa', y: '#c9a24a', o: '#e8d080' };
  const LANTERN = fromRows(['.kkk.', 'kyYyk', 'kYWYk', 'kyYyk', '.kkk.', '..k..', '..b..', '..b..', '..b..', '..b..', '..b..', '..b..', '..b..', '..b..', '.kbk.', 'kbbbk']);
  const LANTERN_PAL = { k: '#0b0a0e', y: '#c08030', Y: '#ffc060', W: '#fff0c0', b: '#3a3036' };
  const STAND = fromRows(['kkkkkkkkkkk', 'kwwwwwwwwwk', 'kbbbbbbbbbk', 'kbBkkkkkBbk', 'kbBk...kBbk', 'kkkk...kkkk']);
  const STAND_PAL = { k: '#0b0a0e', w: '#8a6a48', b: '#6a4a30', B: '#4a3220' };
  const GEARBOX = fromRows(['.kkkkkk.', 'kGGyGGGk', 'kgggyggk', 'kkkkykkk', 'kgggyggk', 'kGggyggk', '.kkkkkk.']);
  const GEARBOX_PAL = { k: '#0b0a0e', G: '#8ab0e0', g: '#4a6aa0', y: '#e0b040' };
  const IRONORE = fromRows(['..kkk...', '.kGgdk..', 'kGgydkkk', 'kgddkGgk', '.kkkgydk', '...kkkk.']);
  const IRONORE_PAL = { k: '#0b0a0e', G: '#a8a2b0', g: '#7a7480', d: '#4c4a52', y: '#c9b07a' };

  const artCache = {};
  const art = (key, fn) => artCache[key] || (artCache[key] = fn());

  // --- 바닥에 찍기 -----------------------------------------------------
  function paintChasm(g, b) { gPaint(g, genChasm(Math.round(b.w / 2), Math.round(b.h / 2)), CHASM_PAL, b.x0 - 2, b.y0 - 2); }
  // 샘물 웅덩이 (손으로 그린 3가지 크기): 흙 둑, 가운데 솟는 물결, 돌·수련·갈대
  const SPRINGS = {
    springS: fromRows([".....kkkkkk.....", "...kkbbbbbbkk...", "..kbBBBBBBBBbk..", ".kBDDDDDDDDDDBk.", ".kDWWWWhhWWWWDk.", "kgWWWWhWWhWWWWkM", "kGgWWWWhhWWWwwkm", ".kdwwwwwwwwwwk..", "..kkwwwwwwwkk...", "....kkkkkkk....."]),
    springM: fromRows(["........kkkkkk........", ".....kkkbbbbbbkkk.....", "...kkbbBBBBBBBBbbkk...", "..kbBBDDDDDDDDDDBBbk..", ".kGBDDWWWWWWWWWWDDBk..", "kGgdDWWWWWhhhWWWWWDk.R", "kgdkWWWWWhWWWhWWWWWkRY", ".kmWWLlWWWhhhWWWWWwkR.", ".kMwLLWWWWWWWWWwwwwk..", "..kwwwwwwwwwwwwwwwkM..", "..kkwwwwwwwwwwwwwkkm..", "....kkkwwwwwwwkkk.....", ".......kkkkkkk........"]),
    springL: fromRows(["..........kkkkkkkk..........", ".......kkkbbbbbbbbkkk.......", "....kkkbbBBBBBBBBBBbbkkk....", "...kbbBBBDDDDDDDDDDBBBbbk...", "..kGgBDDDDWWWWWWWWDDDDBBk...", ".kGGgdDWWWWWWWWWWWWWWDDBk.RY", "kGggdkWWWWWWhhhhWWWWWWWDk.R.", "kgddkWWWWWWhWWWWhWWWWWWWkkR.", ".kkmWWLlWWWhWWWWhWWWGgWWWkk.", ".kMWWLLWWWWWhhhhWWWWdkWWWk..", "..kmwwwWWWWWWWWWWWWWWWwwwk..", "..kMwwwwwwwwWWWWWwwwwwwwkGgk", "...kkwwwwwwwwwwwwwwwwwkkgddk", ".....kkwwwwwwwwwwwwwkk.kkkk.", ".......kkkkkkkkkkkkk........"]),
  };
  function paintPool(g, b) {
    withSeed(b.seed, () => {
      if (b.pool === 'poolM') { const sp = SPRINGS[pick(['springM', 'springL'])], f = Math.random() < 0.5 ? sp.map(r => r.slice().reverse()) : sp; gPaint(g, f, POND_PAL, b.x - f[0].length, b.y - f.length + 2); return; }
      const wc = b.pool === 'poolL' ? 34 : 48, hc = b.pool === 'poolL' ? 18 : 26, style = pick(['clear', 'clear', 'rocky', 'swamp', b.pool === 'poolXL' ? 'island' : 'clear']);
      const gr = genPond(wc, hc, style, pick(['blob', 'blob', 'kidney'])), pal = Object.assign({}, POND_PAL, POND_PALS[style]);
      // 가운데 솟는 물결
      const cx = Math.round(gr[0].length / 2), cy = Math.round(gr.length / 2);
      if (style !== 'island') for (const [dx, dy] of [[-2, 0], [2, 0], [-1, -1], [0, -1], [1, -1], [-1, 1], [0, 1], [1, 1]]) if ('Ww'.includes(gAt(gr, cx + dx, cy + dy))) gr[cy + dy][cx + dx] = 'h';
      gPaint(g, gr, pal, b.x - gr[0].length, b.y - gr.length);
    });
  }
  function paintPond(g, b) {
    if (b.brook) return;
    if (b.pool) return paintPool(g, b); const wc = Math.round(b.w / 2), hc = Math.round(b.h / 2), style = pick(wc >= 50 && hc >= 30 ? ['clear', 'clear', 'swamp', 'rocky', 'island', 'island'] : ['clear', 'swamp', 'rocky']), shape = pick(wc > hc * 1.6 ? ['blob', 'kidney', 'lobes'] : ['blob', 'blob', 'kidney']); gPaint(g, genPond(wc, hc, style, shape), Object.assign({}, POND_PAL, POND_PALS[style]), b.x0 - 6, b.y0 - 6); }
  // 텔레포터 마법진 (v0.62): 바깥 고리 · 룬 띠 · 안쪽 고리 · 육망성 · 가운데 원. 'a'=고리 'b'=별 'c'=룬 'o'=가운데
  const MC_W = 36, MC_H = 18;
  function genMagicCircle() {
    const g = mkGrid(MC_W, MC_H), cx = (MC_W - 1) / 2, cy = (MC_H - 1) / 2, RX = MC_W / 2 - 0.6, RY = MC_H / 2 - 0.6;
    for (let y = 0; y < MC_H; y++) for (let x = 0; x < MC_W; x++) {
      const e = Math.hypot((x - cx) / RX, (y - cy) / RY);
      if (e <= 1 && e > 0.88) g[y][x] = 'a';
      else if (e <= 0.68 && e > 0.58) g[y][x] = 'a';
      else if (e <= 0.18) g[y][x] = 'o';
    }
    const line = (x0, y0, x1, y1) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))); for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); if (g[y] && g[y][x] === '.') g[y][x] = 'b'; } };
    for (const off of [-Math.PI / 2, Math.PI / 2]) { const v = [0, 1, 2].map(i => ({ x: cx + Math.cos(off + i * TAU / 3) * RX * 0.58, y: cy + Math.sin(off + i * TAU / 3) * RY * 0.58 })); for (let i = 0; i < 3; i++) line(v[i].x, v[i].y, v[(i + 1) % 3].x, v[(i + 1) % 3].y); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, x = Math.round(cx + Math.cos(a) * RX * 0.78), y = Math.round(cy + Math.sin(a) * RY * 0.78); if (g[y]) { g[y][x] = 'c'; if (i % 2 === 0 && g[y][x + 1] === '.') g[y][x + 1] = 'c'; } }
    return g;
  }
  function paintTelePad(g, p) { // 바닥에 새겨진 마법진 (꺼진 상태)
    const mc = genMagicCircle().map(r => r.map(c => c === '.' ? '.' : c === 'a' || c === 'o' ? 'K' : c === 'c' ? 'r' : 'D'));
    gPaint(g, mc, Object.assign({}, TELE_PAL, { K: '#121019', D: '#1c1a26', r: '#2a3450' }), p.x - MC_W, p.y - MC_H);
  }
  // 켜진 마법진: 고리·별·룬이 빛나고 룬 점이 고리를 따라 돈다
  function drawMagicCircle(p) {
    const on = 0.65 + 0.35 * Math.sin(time * 3.2), x0 = (Math.round(p.x) - MC_W) & ~1, y0 = (Math.round(p.y) - MC_H) & ~1;
    const glow = art('mcGlow', () => gCanvas(genMagicCircle(), { a: '#9fd2ff', b: '#6fa8ff', c: '#e8f6ff', o: '#bfe2ff' }));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.45 + 0.35 * on; ctx.drawImage(glow, x0, y0);
    ctx.globalAlpha = 1;
    const cx = p.x, cy = p.y - 1;
    for (let i = 0; i < 10; i++) { const a = time * 0.9 + i / 10 * TAU; ctx.fillStyle = i % 2 ? 'rgba(220,240,255,.95)' : 'rgba(140,190,255,.9)'; ctx.fillRect((Math.round(cx + Math.cos(a) * (MC_W - 2)) & ~1), (Math.round(cy + Math.sin(a) * (MC_H - 1)) & ~1), 2, 2); }
    for (let i = 0; i < 6; i++) { const a = -time * 1.6 + i / 6 * TAU; ctx.fillStyle = 'rgba(200,230,255,.8)'; ctx.fillRect((Math.round(cx + Math.cos(a) * MC_W * 0.36) & ~1), (Math.round(cy + Math.sin(a) * MC_H * 0.36) & ~1), 2, 2); }
    ctx.restore();
  }
  // 빛기둥: 마법진에서 위로 솟는 디더링 빛 + 오르내리는 밝은 띠 (엔티티 위에 더한다)
  function drawExit(p) { // v1.01 다음 스테이지 출구: 텔레포터(푸른색)와 구분되는 핏빛·금빛 마법진
    const on = 0.65 + 0.35 * Math.sin(time * 3.6), x0 = (Math.round(p.x) - MC_W) & ~1, y0 = (Math.round(p.y) - MC_H) & ~1;
    const glow = art('mcGlowExit', () => gCanvas(genMagicCircle(), { a: '#ffb060', b: '#d0402a', c: '#fff0c0', o: '#ffd080' }));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.4 * on; ctx.drawImage(glow, x0, y0); ctx.globalAlpha = 1;
    for (let i = 0; i < 12; i++) { const a = -time * 1.1 + i / 12 * TAU; ctx.fillStyle = i % 3 ? 'rgba(255,120,60,.9)' : 'rgba(255,230,160,.95)'; ctx.fillRect(Math.round(p.x + Math.cos(a) * (MC_W - 2)) & ~1, Math.round(p.y - 1 + Math.sin(a) * (MC_H - 1)) & ~1, 2, 2); }
    ctx.restore();
  }
  function drawExitPillar() {
    const R = G.dun && G.dun.cur; if (!R || !R.exit) return;
    const p = R.exit, H0 = 150, w0 = 44, pulse = 0.8 + 0.2 * Math.sin(time * 5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let y = 0; y < H0; y += 2) { const k = 1 - y / H0, hw = Math.round((w0 / 2) * (0.5 + 0.5 * k) + Math.sin(time * 7 + y * 0.25)) & ~1;
      for (let x = -hw; x < hw; x += 2) { const edge = Math.abs(x + 1) / hw, lv = Math.min(1, (0.35 + k) * (1 - edge * 0.7) * pulse); if (!dith((x + 64) >> 1, (y + Math.floor(time * 26)) >> 1, lv)) continue;
        ctx.fillStyle = edge < 0.35 ? `rgba(255,236,190,${0.25 + 0.6 * k})` : `rgba(230,70,40,${0.25 + 0.5 * k})`; ctx.fillRect((Math.round(p.x) + x) & ~1, (Math.round(p.y - 2) - y) & ~1, 2, 2); } }
    for (let i = 0; i < 3; i++) { const yy = (time * 60 + i * H0 / 3) % H0; ctx.fillStyle = `rgba(255,220,160,${0.55 * (1 - yy / H0)})`; ctx.fillRect((Math.round(p.x) - 10) & ~1, Math.round(p.y - 2 - yy) & ~1, 20, 2); }
    ctx.restore();
    if (Math.random() < 0.7) G.parts.push({ x: p.x + rand(-16, 16), y: p.y - rand(0, 8), vx: rand(-5, 5), vy: -rand(50, 110), t: rand(0.5, 1.0), c: pick(['#ffb060', '#ff6a3a', '#fff0c0']), g: 0, glow: true });
  }
  function drawTelePillar() {
    const R = G.dun && G.dun.cur; if (!R || !R.tele || !R.cleared) return;
    const p = R.tele, H0 = 120, w0 = 40, pulse = 0.8 + 0.2 * Math.sin(time * 4.2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const L = pxLayer((Math.round(p.x) - w0 / 2 - 4) & ~1, (Math.round(p.y - 2) - H0 - 2) & ~1, w0 + 10, H0 + 6, true); // v1.17 한 장으로
    for (let y = 0; y < H0; y += 2) {
      const k = 1 - y / H0, hw = Math.round((w0 / 2) * (0.55 + 0.45 * k) + Math.sin(time * 6 + y * 0.2)) & ~1;
      for (let x = -hw; x < hw; x += 2) {
        const edge = Math.abs(x + 1) / hw, lv = Math.min(1, (0.35 + k) * (1 - edge * 0.7) * pulse);
        if (!dith((x + 64) >> 1, (y + Math.floor(time * 20)) >> 1, lv)) continue;
        if (edge < 0.35) L.rect((Math.round(p.x) + x) & ~1, (Math.round(p.y - 2) - y) & ~1, 2, 2, 225, 242, 255, 0.25 + 0.6 * k);
        else L.rect((Math.round(p.x) + x) & ~1, (Math.round(p.y - 2) - y) & ~1, 2, 2, 110, 170, 255, 0.2 + 0.5 * k);
      }
    }
    L.flush();
    for (let i = 0; i < 2; i++) { const yy = ((time * 50 + i * H0 / 2) % H0); ctx.fillStyle = `rgba(230,245,255,${0.5 * (1 - yy / H0)})`; ctx.fillRect((Math.round(p.x) - 8) & ~1, (Math.round(p.y - 2 - yy)) & ~1, 16, 2); }
    ctx.restore();
    if (Math.random() < 0.6) G.parts.push({ x: p.x + rand(-14, 14), y: p.y - rand(0, 8), vx: rand(-4, 4), vy: -rand(40, 90), t: rand(0.5, 1.0), c: pick(['#bfe2ff', '#9fd2ff', '#ffffff']), g: 0, glow: true });
  }
  function paintDoorCastle(g, d) {
    const p = DOOR[d];
    if (d === 'n') { gPaint(g, genArch(), STONE, p.x - 27, p.y - 70); return; }
    if (d === 's') { gPaint(g, genFloorExit(20, 36, 's'), STONE, p.x - 20, p.y); gPaint(g, genDoorPost(14), STONE, p.x - 30, p.y - 2); gPaint(g, genDoorPost(14), STONE, p.x + 20, p.y - 2); return; }
    const x0 = d === 'w' ? p.x - 80 : p.x;
    gPaint(g, genFloorExit(40, 20, d), STONE, x0, p.y - 20);
    const post = mkGrid(17, 5); for (let x = 1; x < 16; x++) for (let y = 1; y < 4; y++) post[y][x] = y === 1 ? 'h' : x % 5 === 0 ? 'D' : 'l';
    const po = gOutline(post), px = d === 'w' ? p.x - 32 : p.x - 2;
    gPaint(g, po, STONE, px, p.y - 30); gPaint(g, po, STONE, px, p.y + 20);
  }
  function paintMeadowDoorPaths(g, R) {
    const curve = (d) => {
      const p = DOOR[d], ph = rand(0, 6);
      for (let t = 0; t < 150; t += 2) {
        const c = Math.round(((d === 's' ? p.x : p.y) + Math.sin(t * 0.05 + ph) * 5) / 2) * 2, hw = 10 - Math.floor(t / 50) * 2 + (Math.random() < 0.3 ? 2 : 0);
        const span = Math.ceil(hw * 1.4 / 2) * 2;
        for (let o = -span; o <= span; o += 2) {
          const x = (d === 's' ? c + o : d === 'w' ? p.x - t : p.x + t) & ~1, y = (d === 's' ? p.y - 14 + t : c + o) & ~1;
          if (t < 20 && dith(x >> 1, y >> 1, 1 - (t + 4) / 24)) continue; // 벽선에서 시작하는 부분은 성기게
          const col = dirtCol(o, hw, x, y); if (col) { g.fillStyle = col; g.fillRect(x, y, 2, 2); }
        }
      }
    };
    for (const d of ['s', 'w', 'e']) if (R.doors[d] != null && !(R.crack && R.crack.dir === d && !R.crack.broken)) curve(d);
  }
  function paintDoorMeadow(g, d) {
    const p = DOOR[d];
    const bushes = (pts) => { for (const [x, y, f] of pts) stamp(g, DECO_MAPS.bush, Object.assign({}, DECO, { m: '#1e3a18', M: '#2e5222', r: '#8a2030' }), Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, f); };
    if (d === 'n') {
      // 나무 사이로 뚫린 잎 터널: 아치 모양 그늘 + 바닥 흙길, 가장자리는 잎 뭉치
      const W0 = 30, H0 = 40, cx = 14.5, top = 13, gg = mkGrid(W0, H0);
      const inShape = (x, y) => y >= top ? x >= 4 && x <= 25 : Math.hypot(x - cx, y - top) <= 10.5;
      const path = genPath(W0, H0, true, 'n');
      for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
        if (inShape(x, y)) { const t = y / H0; if (y > H0 - 8 && !dith(x, y, (H0 - 1 - y) / 8)) continue; gg[y][x] = dith(x, y, clamp((0.85 - t) / 0.35, 0, 1)) ? 'K' : 'q'; }
        else if (inShape(x - 2, y) || inShape(x + 2, y) || inShape(x, y + 2) || inShape(x - 1, y + 1) || inShape(x + 1, y + 1)) { if (y < H0 - 1) gg[y][x] = shade4(x - cx, y - top, 12, 0.35); }
      }
      for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) if (gg[y][x] === '.' && y > H0 - 9 && x > 5 && x < 24) gg[y][x] = '_'; // 아래쪽 디더링 빈칸은 외곽선을 두르지 않음
      const og = gOutline(gg).map(r => r.map(c => c === '_' ? '.' : c));
      gPaint(g, og, Object.assign({ q: '#1a2a14', K: '#050905', k: '#07100a' }, PATH_PAL, { h: TREE_PAL.green.h, l: TREE_PAL.green.l, d: TREE_PAL.green.d, D: TREE_PAL.green.D }), p.x - 30, p.y - 78);
      // 터널 안 어둠에서 시작해 문턱 아래 풀밭으로 흐려지는 흙길
      const ph = rand(0, 6), B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      for (let y = (p.y - 58) & ~1; y < p.y + 30; y += 2) {
        const c = Math.round((p.x + Math.sin(y * 0.06 + ph) * 3) / 2) * 2, f = Math.min(1, (y - (p.y - 60)) / 34, (p.y + 30 - y) / 26), hw = Math.round((4 + 6 * clamp((y - (p.y - 50)) / 60, 0, 1)) / 2) * 2;
        for (let o = -14; o <= 14; o += 2) {
          const x = c + o; if (y < p.y - 2 && Math.abs(x - p.x) > 18) continue;
          if (!((0.15 + f * 1.1) * 16 > B4[((y >> 1) & 3) * 4 + ((x >> 1) & 3)])) continue;
          const col = dirtCol(o, hw, x, y); if (col) { g.fillStyle = y < p.y ? mixHex(col, '#050905', clamp((p.y - y) / 60, 0, 0.75)) : col; g.fillRect(x, y, 2, 2); }
        }
      }
    }
  }

  // --- 장애물 스프라이트 ------------------------------------------------
  function makeObsSprites(R) {
    const out = [];
    withSeed(R.seed ^ 0x5bd1, () => {
      for (const b of R.obs) {
        if (b.t === 'pit' || b.t === 'prop' || b.t === 'drum') continue;
        if (G.stage === 3) continue;
        if (G.stage === 1) {
          if (b.t === 'pillar') {
            const kind = pick(['round', 'round', 'pine', 'birch']), map = genTree(kind), pal = Object.assign({}, TRUNK, TREE_PAL[kind === 'pine' ? 'deep' : kind === 'birch' ? 'birch' : pick(['green', 'green', 'deep', 'autumn', 'dusk'])]);
            const w = map[0].length * 2, h = map.length * 2, [c, g] = mkCanvas(w + 8, h + 6);
            g.fillStyle = 'rgba(0,0,0,.35)'; for (let x = 6; x < w + 2; x += 2) g.fillRect(x, h, 2, 2); for (let x = 10; x < w - 2; x += 2) g.fillRect(x, h + 2, 2, 2);
            stamp(g, map, pal, 4, 0, 2, Math.random() < 0.5);
            out.push({ cv: c, x: Math.round(b.x - w / 2 - 4) & ~1, y: Math.round(b.y - h + 2) & ~1, sy: b.y });
          } else if (b.t === 'rock') {
            const c = rockCanvas(b.r);
            out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 6) & ~1, sy: b.y });
          } else {
            const { g, HH } = genHedge(Math.round(b.w / 2), Math.round(b.h / 2));
            out.push({ cv: gCanvas(g, LEAF), x: Math.round(b.x0 - 4) & ~1, y: Math.round(b.y0 - HH * 2 - 4) & ~1, sy: b.y1 });
          }
        } else {
          if (b.t === 'pillar') {
            const g = genPillar(Math.random() < 0.35), c = gCanvas(g, STONE);
            out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 6) & ~1, sy: b.y });
          } else if (b.t === 'rock') {
            const g = genRubble(b.r), c = gCanvas(g, STONE);
            out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 6) & ~1, sy: b.y });
          } else {
            const { g, HH } = genWallBlock(Math.round(b.w / 2), Math.round(b.h / 2));
            out.push({ cv: gCanvas(g, STONE), x: Math.round(b.x0 - 2) & ~1, y: Math.round(b.y0 - HH * 2 - 2) & ~1, sy: b.y1 });
          }
        }
      }
      if (G.stage === 3) makeOrcObsSprites(R, out);
    });
    return out;
  }

  // --- 동적: 잠긴 문 · 금 간 벽 · 텔레포터 · 상자 · 상인 -----------------
  function drawRoomBack() {
    const R = G.dun.cur;
    G.sealAnim = Math.min(1, (G.sealAnim || 0) + (G.sealed ? 1 : -1) * 0.08);
    if (!G.sealed && G.sealAnim < 0) G.sealAnim = 0;
    for (const d in DIRS) {
      const st = doorState(R, d); if (st === 'none') continue;
      if (st === 'crack') drawCrack(R, d);
      else if (st === 'boss') drawSeal(d, gateK());
      else if (G.sealAnim > 0) drawSeal(d, G.sealAnim);
      if (R.doors[d] != null && G.dun.rooms[R.doors[d]].type === 'boss' && st !== 'crack') drawBossSigil(d, st === 'boss');
    }
    if (R.tele && R.cleared) drawMagicCircle(R.tele);
    if (R.exit) drawExit(R.exit);
  }
  // 봉쇄: 성채는 쇠창살이 내려오고, 초원은 가시덤불이 자라난다 (k: 0→1)
  function drawSeal(d, k) {
    const p = DOOR[d], meadow = G.stage === 1, vert = d === 'n' || d === 's';
    const key = (meadow ? 'th' : 'bar' + G.stage) + d;
    const spr = art(key, () => withSeed(d.charCodeAt(0) * 99, () => meadow
      ? gCanvas(vert ? genThorns(22, d === 'n' ? 18 : 16, true) : genThorns(18, 24, false), THORN_PAL)
      : gCanvas(vert ? genBars(19, d === 'n' ? 28 : 16, true) : genBars(17, 21, false), G.stage === 3 ? WOOD_BAR : BAR_PAL)));
    const W0 = spr.width, H0 = spr.height;
    let x = vert ? p.x - W0 / 2 : d === 'w' ? p.x - W0 + 4 : p.x - 4, y = d === 'n' ? p.y - H0 + 2 : d === 's' ? p.y - 6 : p.y - H0 / 2;
    x = Math.round(x) & ~1; y = Math.round(y) & ~1;
    if (meadow) { // 문 가장자리에서 가운데로 자라난다
      const sw = Math.round(W0 * k / 2) & ~1, sh = Math.round(H0 * k / 2) & ~1;
      if (vert) { ctx.drawImage(spr, 0, 0, sw, H0, x, y, sw, H0); ctx.drawImage(spr, W0 - sw, 0, sw, H0, x + W0 - sw, y, sw, H0); }
      else { ctx.drawImage(spr, 0, 0, W0, sh, x, y, W0, sh); ctx.drawImage(spr, 0, H0 - sh, W0, sh, x, y + H0 - sh, W0, sh); }
    } else { // 위에서 떨어진다
      const sh = Math.round(H0 * k) & ~1;
      if (sh > 0) ctx.drawImage(spr, 0, H0 - sh, W0, sh, x, y, W0, sh);
    }
  }
  function drawBossSigil(d, locked) {
    const q = d === 'n' ? { x: DOOR.n.x, y: DOOR.n.y - 84 } : doorIn(d, -18);
    const spr = art('sigil', () => gCanvas(SIGIL, SIGIL_PAL)), glow = art('sigilG', () => gCanvas(SIGIL.map(r => r.map(c => c === 'K' || c === 'R' ? c : '.')), { K: '#ffb0b0', R: '#ff4050' }));
    const x = Math.round(q.x - spr.width / 2) & ~1, y = Math.round(q.y - spr.height / 2) & ~1;
    ctx.drawImage(spr, x, y);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = locked ? 0.25 + 0.25 * Math.sin(time * 3) : 0.7; ctx.drawImage(glow, x, y); ctx.restore();
    if (locked) { const t = `${SK().unit} ${sealPlaced()}/2`; ctx.font = '8px Galmuri7'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; fillTextW(t, q.x + 1, q.y + 19); ctx.fillStyle = '#ff8080'; fillTextW(t, q.x, q.y + 18); }
  }
  // ================================================================ v1.18 보스 문 봉인 기믹
  // 엘리트를 쓰러뜨리면 「봉인 열쇠」가 떨어진다. 주워서 보스 방 앞 받침 2곳에 바치면(F) 챕터마다 다른 연출로 문이 열린다.
  // 1장 잿빛 초원: 정령의 불씨 → 화톳대에 초록 불 → 가시덤불이 타서 걷힘
  // 2장 무너진 성채: 기사단 인장 조각 → 문장 받침에 반쪽씩 → 방패가 맞물리면 쇠사슬이 끊기고 창살이 오름
  // 3장 핏빛 엄니 부락: 전사의 엄니 → 해골 토템에 걸면 눈이 붉게 타오름 → 뿔나팔·북소리와 함께 통나무 문이 올라감
  const SEAL = {
    1: { key: '정령의 불씨', unit: '불씨', sockN: '화톳대', act: '정령의 불씨 붙이기', need: '불씨가 없다 — 우두머리의 굴에서 빼앗아 와라', c: '#c8f070', rgb: '190,240,110',
      intro: '우두머리 둘이 품은 정령의 불씨로 보스 방의 가시덤불을 태워라', drop: '정령의 불씨가 떨어졌다 — 보스 방 앞 화톳대로!',
      put: '화톳대에 초록 불이 붙었다', open: ['가시덤불이 불타 사라졌다', '점액왕의 둥지로 가는 길이 열렸다'] },
    2: { key: '기사단 인장 조각', unit: '인장', sockN: '문장 받침', act: '인장 조각 끼우기', need: '인장 조각이 없다 — 처형장에서 되찾아 와라', c: '#ffd070', rgb: '255,205,110',
      intro: '두 처형장에 흩어진 기사단 인장을 하나로 맞춰 봉인을 풀어라', drop: '기사단 인장 조각을 되찾았다 — 보스 방 앞 문장 받침으로!',
      put: '인장 조각이 받침에 끼워졌다', put2: '두 조각이 하나의 문장으로 맞물렸다', open: ['기사단의 인장이 되살아났다', '쇠사슬이 끊어지고 창살이 올라간다'] },
    3: { key: '전사의 엄니', unit: '엄니', sockN: '해골 토템', act: '엄니 바치기', need: '바칠 엄니가 없다 — 결투장 챔피언의 엄니를 뽑아 와라', c: '#ff8a60', rgb: '255,110,70',
      intro: '결투장 챔피언 둘의 엄니를 뽑아 대족장의 해골 토템에 바쳐라', drop: '전사의 엄니를 뽑았다 — 보스 방 앞 해골 토템으로!',
      put: '해골 토템의 눈에 불이 켜졌다', open: ['토템이 피를 마셨다', '뿔나팔이 울린다 — 대족장의 투기장 문이 올라간다'] },
  };
  const SK = () => SEAL[G && G.stage] || SEAL[1];
  const sealPlaced = () => (G.dun && G.dun.sock ? G.dun.sock.filter(Boolean).length : 0);
  function sealHud() { const D = G.dun; if (!D || D.forge) return ''; const K = SK(); return D.bossOpen ? '보스 방 열림' : `${K.unit} ${sealPlaced()}/2${D.keys ? ` (+${D.keys})` : ''}`; }
  // 보스 문 양옆 받침 2곳: 문이 난 벽에 붙여 세운다 (몸이 걸리지 않는 장식 — 바닥 장애물과 별개)
  function sealSocks(R) {
    const D = G.dun; if (!D || D.forge || !R.doors) return null;
    const d = Object.keys(R.doors).find(k => R.doors[k] != null && D.rooms[R.doors[k]] && D.rooms[R.doors[k]].type === 'boss'); if (!d) return null;
    const p = DOOR[d];
    if (G.stage === 2) { const q = d === 'n' ? { x: p.x + 60, y: A.y0 + 26 } : d === 's' ? { x: p.x + 60, y: A.y1 - 8 } : { x: d === 'w' ? A.x0 + 24 : A.x1 - 24, y: p.y + 66 }; return [Object.assign(q, { i: 0, d, dual: true })]; } // v1.21 성채는 받침 하나에 인장 두 조각을 맞춘다
    return [-1, 1].map((s, i) => d === 'n' ? { x: p.x + s * 60, y: A.y0 + 26, i, d } : d === 's' ? { x: p.x + s * 60, y: A.y1 - 8, i, d }
      : { x: d === 'w' ? A.x0 + 24 : A.x1 - 24, y: p.y + s * 50 + 16, i, d });
  }
  const SOCK_H = { 1: 30, 2: 38, 3: 44 };
  // 받침 그림 (2px 칸)
  const SOCK_PAL = {
    1: { k: '#0b0a0e', H: '#9a9488', h: '#6a6474', l: '#4a4554', d: '#2d2935', D: '#1c1922', a: '#2a2622', A: '#4a423a', m: '#4a6a2a', M: '#6a8a3a' },
    2: { k: '#0b0a0e', H: '#8a8496', h: '#5e5868', l: '#423d4c', d: '#2d2935', D: '#1c1922', s: '#7a7488', S: '#141218', G: '#e0b040', g: '#8a6420', R: '#a01828', r: '#6a0c18', W: '#f0e8d0', c: '#3a3442' },
    3: { k: '#0b0806', W: '#e0d6c4', w: '#a49a84', b: '#c8bca0', B: '#8a7e66', t: '#6b4a2a', T: '#3a2416', r: '#a01820', e: '#1a0c08', E: '#ff4020', u: '#f0e6c8', U: '#b8a880', f: '#2e1d12' },
  };
  const SOCK_ART = {
    1: ['.kk......kk.', '.kHk....kHk.', 'kHhkkkkkkhHk', 'khaAaaAaaAhk', 'kHhhhhhhhhHk', '.kllllllldk.', '..kldddddk..', '...kkddkk...', '....khdk....', '....kmdk....', '....khdk....', '...kkhdkk...', '..khMmhddk..', '.kHhhhhhddk.', '.kkkkkkkkkk.'],
    2: ['..kkkkkkkk..', '.kssssssssk.', '.ksSSSSSSsk.', '.ksSSSSSSsk.', '.ksSSSSSSsk.', '..ksSSSSsk..', '...ksSSsk...', '....kssk....', '.kkkkkkkkkk.', 'kHhhhhhhhhHk', '.kllllllldk.', '.khlllllldk.', '.khlccccldk.', '.khllllldDk.', '.khllllldDk.', '.khllllldDk.', 'kkhhhhhhhdkk', 'kHhhhhhhhhHk', 'kkkkkkkkkkkk'],
    3: ['.k........k.', 'kWk......kWk', 'kWWk....kWWk', '.kWWkkkkWWk.', '..kbbbbbbk..', '..kbBbbBbk..', '..kbebbebk..', '..kbbbbbbk..', '..kbWbbWbk..', '...kWkkWk...', '....kttk....', '...kttTtk...', '...ktrrTk...', '...kttTtk...', '...ktTTtk...', '...kttTtk...', '...ktrrTk...', '...kttTtk...', '...kttTtk...', '..kkttTtkk..', '.kfttttTTfk.', '.kkkkkkkkkk.'],
  };
  function sockArt(st, i, on) {
    const g = fromRows(SOCK_ART[st]);
    if (st === 2 && on) { // 인장 받침 하나: on 비트 1 = 왼쪽 반, 2 = 오른쪽 반 → 둘 다면 온전한 방패
      for (let y = 1; y <= 7; y++) for (let x = 0; x < g[y].length; x++) {
        const c = g[y][x]; if (c !== 's' && c !== 'S') continue;
        if (x <= 5 ? !(on & 1) : !(on & 2)) continue;
        g[y][x] = c === 's' ? 'G' : (x === 5 || x === 6) && y >= 2 && y <= 6 || y === 3 && x >= 3 && x <= 8 ? 'W' : (x + y) % 3 ? 'R' : 'r';
      }
      if (on !== 3) for (let y = 1; y <= 7; y++) { const x = on === 1 ? 5 : 6; if (g[y][x] === 'G' && y > 1) g[y][x] = 'g'; } // 반쪽일 때 금 간 단면
    }
    if (st === 3) {
      if (on) { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) if (g[y][x] === 'e') g[y][x] = 'E';
        // 끈에 매단 엄니 (문 반대쪽으로 늘어뜨림)
        const T = [[9, 10, 'f'], [9, 11, 'k'], [10, 11, 'f'], [10, 12, 'k'], [11, 12, 'k'], [10, 13, 'u'], [11, 13, 'k'], [10, 14, 'u'], [11, 14, 'U'], [12, 14, 'k'], [11, 15, 'u'], [12, 15, 'k'], [11, 16, 'U'], [12, 16, 'k'], [11, 17, 'r'], [12, 17, 'k'], [11, 18, 'k']];
        for (const r of g) if (i === 0) r.unshift('.', '.'); else r.push('.', '.');
        for (const [x, y, c] of T) g[y][i === 0 ? 13 - x : x] = c;
      }
    }
    return gCanvas(g, SOCK_PAL[st]);
  }
  // 초록 정령불 (칸 단위로 흔들림)
  function spiritFlame(x, y, big) {
    const n = big ? 7 : 5, base = big ? 14 : 8;
    for (let i = 0; i < n; i++) { const c = i - (n - 1) / 2, ph = Math.sin(time * 12 + i * 2.1 + x), h = (base + (ph + 1) * 4 - Math.abs(c) * 3) | 0, fx = (x - n + i * 2) & ~1;
      if (h <= 0) continue;
      ctx.fillStyle = '#2a7a3a'; ctx.fillRect(fx, y - (h & ~1), 2, h & ~1);
      if (Math.abs(c) < n / 2 - 1) { ctx.fillStyle = '#7ad040'; ctx.fillRect(fx, y - ((h * 0.72) & ~1), 2, (h * 0.72) & ~1); }
      if (Math.abs(c) < 1.5) { ctx.fillStyle = '#eaffb8'; ctx.fillRect(fx, y - ((h * 0.4) & ~1), 2, (h * 0.4) & ~1); } }
  }
  function drawSock(s) {
    const D = G.dun, st = G.stage in SOCK_ART ? G.stage : 1, mask = s.dual ? (D.sock[0] ? 1 : 0) | (D.sock[1] ? 2 : 0) : D.sock[s.i] ? 1 : 0, on = mask > 0, full = s.dual ? mask === 3 : on;
    const spr = art(`sock${st}${s.i}${mask}`, () => sockArt(st, s.i, st === 2 ? mask : on));
    const bx = Math.round(s.x) & ~1, by = Math.round(s.y) & ~1, x = (bx - spr.width / 2) & ~1, y = by - spr.height;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x + 4, by - 2, spr.width - 8, 4);
    ctx.drawImage(spr, x, y);
    const pt = s.putT != null ? time - s.putT : 9;
    if (st === 1 && on) { spiritFlame(bx, y + 6, D.gate || pt < 0.6); if (Math.random() < 0.15) G.parts.push({ x: bx + rand(-4, 4), y: y - 4, vx: rand(-6, 6), vy: -rand(25, 45), t: rand(0.4, 0.8), c: pick(['#c8f070', '#7ad040', '#eaffb8']), g: 0, glow: true }); }
    if (st === 3 && on && Math.floor(time * 8 + s.i * 3) % 3 === 0) { const ex = x + (s.i === 0 ? 4 : 0); ctx.fillStyle = '#ffc080'; ctx.fillRect(ex + 8, y + 12, 2, 2); ctx.fillRect(ex + 14, y + 12, 2, 2); }
    if (st === 3 && on && Math.random() < 0.08) { const ex = x + (s.i === 0 ? 4 : 0); G.parts.push({ x: ex + 8 + rand(0, 6), y: y + 12, vx: rand(-4, 4), vy: -rand(10, 25), t: rand(0.3, 0.6), c: pick(['#ff4020', '#ff8040']), g: 0, glow: true }); }
    if (st === 2 && on && Math.floor(time * 3 + s.i * 1.5) % 4 === 0) { ctx.fillStyle = '#fff6d0'; ctx.fillRect(x + (s.i === 0 ? 8 : 14), y + 4, 2, 2); }
    if (pt < 0.35) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - pt / 0.35; ctx.drawImage(art(`sockW${st}${s.i}`, () => { const c = sockArt(st, s.i, st === 2 ? (s.dual ? 3 : 1) : true), [o, ox] = mkCanvas(c.width, c.height); ox.drawImage(c, 0, 0); ox.globalCompositeOperation = 'source-in'; ox.fillStyle = '#fff'; ox.fillRect(0, 0, c.width, c.height); return o; }), x, y); ctx.restore(); }
    // 열쇠를 들고 있으면 빈 받침 위에서 깜빡이는 화살표
    if (!full && D.keys > 0 && !D.gate && Math.floor(time * 3) % 2 === 0) { const ay = y - 8 + (Math.floor(time * 3) % 4 === 0 ? 2 : 0), K = SK(); ctx.fillStyle = '#000'; ctx.fillRect(bx - 4, ay - 2, 8, 2); ctx.fillRect(bx - 2, ay, 4, 2); ctx.fillStyle = K.c; ctx.fillRect(bx - 4, ay - 4, 8, 2); ctx.fillRect(bx - 2, ay - 2, 4, 2); }
  }
  // 떨어진 봉인 열쇠 (불씨·인장 조각·엄니) + 위로 오르는 빛
  const SKEY_ART = {
    1: [['...k..', '..kyk.', '.kyYk.', '.kYWyk', 'kyWWYk', 'kYWWYk', '.kYYk.', '..kk..'], ['..k...', '.kyk..', '.kYyk.', 'kyWYk.', 'kYWWyk', 'kYWWYk', '.kYYk.', '..kk..']],
    2: [['kkkk...', 'kGGGk..', 'kGRRWk.', 'kGRWWWk', 'kGRRWk.', '.kGRgk.', '..kGgk.', '...kk..']],
    3: [['....kk.', '...kWk.', '..kWWk.', '..kWwk.', '.kWwk..', '.kWwk..', 'kWwk...', 'krrk...', '.kk....']],
  };
  const SKEY_PAL = { 1: { k: '#0c1406', y: '#5a9a2a', Y: '#a8e050', W: '#f0ffc0' }, 2: { k: '#0b0a0e', G: '#e0b040', g: '#8a6420', R: '#a01828', W: '#f0e8d0' }, 3: { k: '#0b0806', W: '#f0e6c8', w: '#b8a880', r: '#a01820' } };
  function drawSealKey(l, x, y) {
    const st = G.stage in SKEY_ART ? G.stage : 1, fr = SKEY_ART[st], f = Math.floor(time * 6) % fr.length;
    const spr = art(`skey${st}${f}`, () => gCanvas(fromRows(fr[f]), SKEY_PAL[st])), K = SK();
    const bx = Math.round(x) & ~1, by = Math.round(l.y) & ~1, h = 70 * Math.min(1, l.t * 2), pulse = 0.75 + Math.sin(time * 5) * 0.25;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let yy = 16; yy < h; yy += 2) { const k = yy / h; for (let c = -2; c < 2; c++) { const edge = c === -2 || c === 1; if (!dith((bx >> 1) + c, (by - yy) >> 1, (1 - k) * (edge ? 0.4 : 0.85) * pulse)) continue; ctx.fillStyle = `rgba(${K.rgb},${(edge ? 0.45 : 0.8) * (1 - k * 0.6)})`; ctx.fillRect(bx + c * 2, by - yy, 2, 2); } }
    ctx.restore();
    ctx.drawImage(spr, (bx - spr.width / 2) & ~1, (Math.round(y) & ~1) - spr.height + 2);
  }
  function placeSeal(s) {
    const D = G.dun, K = SK(), idx = s.dual ? D.sock.indexOf(false) : s.i; if (D.keys <= 0 || idx < 0 || D.sock[idx]) return;
    D.keys--; D.sock[idx] = true; s.putT = time;
    const top = s.y - SOCK_H[G.stage] + 6, n = sealPlaced();
    G.fx.push({ kind: 'ring', x: s.x, y: top, r: 6, grow: 120, t: 0.4, max: 0.4, c: K.c }); burst(s.x, top, K.c, 14);
    if (G.stage === 1) { sfx('fireball'); sfx('ready'); }
    else if (G.stage === 2) { sfx('block'); sfx('heavy'); debris(s.x, top, 6); }
    else { sfx('hit'); sfx('growl', 0.7); for (let i = 0; i < 6; i++) G.parts.push({ x: s.x + rand(-4, 4), y: top + 10, vx: rand(-10, 10), vy: rand(10, 40), t: rand(0.3, 0.6), c: '#a01820', g: 200 }); }
    if (n >= 2) { D.gate = { t: 0, fired: {} }; banner(K.put2 || K.put, '봉인이 흔들린다…'); }
    else { banner(K.put, `하나 더 바치면 봉인이 풀린다 (${n}/2)`); }
  }
  // 문이 열리는 동안 봉쇄 그림의 남은 비율 (1 → 0)
  function gateK() { const g = G.dun && G.dun.gate; return g ? clamp(1 - (g.t - 0.8) / 1.0, 0, 1) : 1; }
  function updateGate(dt) {
    const D = G.dun, g = D && D.gate; if (!g) return;
    g.t += dt; const R = D.cur, S = R && R.socks, st = G.stage, once = (k, at, fn) => { if (g.t >= at && !g.fired[k]) { g.fired[k] = 1; fn(); } };
    if (S) {
      const d = S[0].d, q = doorIn(d, 2), along = d === 'n' || d === 's' ? [1, 0] : [0, 1];
      const onDoor = (c, vy = -30) => { const o = rand(-22, 22); G.parts.push({ x: q.x + along[0] * o + rand(-4, 4), y: q.y + along[1] * o - rand(0, 10), vx: rand(-10, 10), vy: vy * rand(0.6, 1.3), t: rand(0.4, 0.8), c, g: vy > 0 ? 300 : 0, glow: vy < 0 }); };
      if (st === 1) { // 화톳대에서 덤불로 초록 불길이 번진다
        if (g.t < 0.8) for (const s of S) if (Math.random() < 0.6) { const k = g.t / 0.8, sx = s.x + (q.x - s.x) * k, sy = s.y - 24 + (q.y - s.y + 24) * k; G.parts.push({ x: sx + rand(-3, 3), y: sy + rand(-3, 3), vx: 0, vy: -20, t: 0.35, c: pick(['#c8f070', '#7ad040']), g: 0, glow: true }); }
        if (g.t > 0.6 && g.t < 1.9) for (let i = 0; i < 3; i++) onDoor(pick(['#c8f070', '#7ad040', '#ffb040', '#ff7020', '#eaffb8']), -50);
        once('ign', 0.7, () => { sfx('fireball'); sfx('blast', 1.4); });
      } else if (st === 2) { // 쇠사슬이 끊기고 창살이 오른다
        once('c1', 0.2, () => { sfx('block', 0.8); onDoor('#a49cb0', 40); }); once('c2', 0.45, () => { sfx('block', 0.7); }); once('c3', 0.7, () => { sfx('heavy'); sfx('crunch'); for (let i = 0; i < 10; i++) onDoor(pick(['#7a7488', '#a49cb0', '#ffe0a0']), 60); });
        if (g.t > 0.8 && g.t < 1.8 && Math.random() < 0.5) onDoor('#4a4656', 30);
      } else { // 뿔나팔 · 북 세 번 · 통나무 문이 끌려 올라간다
        once('horn', 0.05, () => sfx('roar', 0.8)); once('b1', 0.6, () => sfx('beat')); once('b2', 0.9, () => sfx('beat')); once('b3', 1.2, () => { sfx('beat'); sfx('heavy'); });
        if (g.t > 0.8 && g.t < 1.8 && Math.random() < 0.5) dust(q.x + rand(-16, 16), q.y, 2);
      }
    }
    if (g.t >= 2) { D.gate = null; D.bossOpen = true; const K = SK(); banner(K.open[0], K.open[1]); sfx('grogi'); flashT = 0.08; flashColor = st === 1 ? '#d0ffa0' : st === 2 ? '#fff0c0' : '#ffb090'; if (S) { const q = doorIn(S[0].d, 6); dust(q.x, q.y, 14); } }
  }
  // 금 간 벽: 성채는 벽면의 갈라짐, 초원은 숲길을 막은 바위 더미 (맞을수록 금이 늘어난다)
  function drawCrack(R, d) {
    const c = crackPoint(R), stage = 3 - Math.max(0, R.crack.hp);
    const spr = art(`crack${G.stage}${d}${stage}`, () => withSeed(77 + stage, () => {
      if (G.stage === 1) {
        const [cv, cx] = mkCanvas(60, 40);
        stamp(cx, DECO_MAPS.rockBig, DECO, 2, 10, 2); stamp(cx, DECO_MAPS.rockBig, DECO, 26, 12, 2, true); stamp(cx, DECO_MAPS.rockA, DECO, 18, 0, 2);
        const g = mkGrid(30, 20); let x = 14, y = 4; for (let i = 0; i < 6 + stage * 4; i++) { g[y][x] = 'k'; x = clamp(x + randi(-1, 1), 2, 27); y = clamp(y + (Math.random() < 0.6 ? 1 : 0), 2, 18); }
        gPaint(cx, g, { k: '#121214' }, 0, 0);
        return cv;
      }
      const g = mkGrid(22, 18);
      for (let s = 0; s < 3 + stage * 2; s++) { let x = 11 + randi(-2, 2), y = 8 + randi(-2, 2); for (let i = 0; i < 4 + stage * 2; i++) { g[y][x] = 'K'; if (Math.random() < 0.4 && g[y][x + 1] === '.') g[y][x + 1] = 'D'; x = clamp(x + randi(-1, 1), 0, 21); y = clamp(y + randi(-1, 1), 0, 17); } }
      for (let i = 0; i < 3 + stage * 2; i++) { const x = randi(5, 16), y = randi(14, 17); g[y][x] = pick(['l', 'd', 'h']); }
      return gCanvas(g, G.stage === 3 ? WOODPAL : STONE);
    }));
    let x = c.x - spr.width / 2, y = d === 'n' ? c.y - spr.height + 4 : c.y - spr.height / 2;
    if (G.stage === 1 && d === 'w') x = c.x - spr.width + 16; if (G.stage === 1 && d === 'e') x = c.x - 16;
    ctx.drawImage(spr, Math.round(x) & ~1, Math.round(y) & ~1);
  }
  function drawChest(c) {
    const sec = c.kind === 'secret', boss = c.kind === 'boss', key = (c.opened ? 'chO' : 'chC') + (sec ? 's' : boss ? 'b' : '');
    const spr = art(key, () => gCanvas(c.opened ? CHEST_O : CHEST_C, sec ? CHEST_PAL_S : boss ? CHEST_PAL_B : CHEST_PAL));
    if (boss && !c.opened && !c.fall) { const bx = Math.round(c.x) & ~1, by = Math.round(c.y) & ~1; ctx.save(); ctx.globalCompositeOperation = 'lighter'; // 바닥 금빛 고리 + 위로 오르는 불티
      for (let i = 0; i < 14; i++) { const a = i * TAU / 14 + time * 0.6; ctx.fillStyle = `rgba(255,${190 + (i % 2) * 40},90,${0.55 + 0.3 * Math.sin(time * 4 + i)})`; ctx.fillRect(Math.round(bx + Math.cos(a) * 20) & ~1, Math.round(by + 2 + Math.sin(a) * 7) & ~1, 2, 2); }
      for (let i = 0; i < 5; i++) { const k = (time * 0.7 + i / 5) % 1; ctx.fillStyle = `rgba(255,210,110,${0.8 * (1 - k)})`; ctx.fillRect(Math.round(bx - 12 + i * 6 + Math.sin(time * 3 + i) * 2) & ~1, Math.round(by - 14 - k * 40) & ~1, 2, 2); }
      ctx.restore(); }
    const bob = !c.opened && Math.floor(time * 2) % 2 ? 2 : 0, x = Math.round(c.x - spr.width / 2) & ~1, y = Math.round(c.y - spr.height + 2 - (c.lift || 0)) & ~1;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; { const xa = x + 2, xb = x + spr.width - 2; if (xb > xa) ctx.fillRect(xa, y + spr.height + (c.kind === 'boss' ? c.lift || 0 : 0), Math.ceil((xb - xa) / 2) * 2, 2); } // 떨어지는 보스 상자는 그림자가 바닥에 남는다
    ctx.drawImage(spr, x, y - bob);
    if (!c.opened && Math.floor(time * 6) % 7 === 0) { ctx.fillStyle = sec ? '#f0e0ff' : '#fff0b0'; ctx.fillRect((x + 6 + Math.floor(time * 6) % 14 * 1) & ~1, y + 4 - bob, 2, 2); }
  }
  function drawMerchant(R) {
    const x = CX & ~1, y = (CY - 70) & ~1, bob = Math.floor(time * 2) % 2 ? 2 : 0;
    const m = art('merch', () => gCanvas(MERCHANT, MERCHANT_PAL)), cart = art('cart', () => gCanvas(CART, CART_PAL)), lan = art('lantern', () => gCanvas(LANTERN, LANTERN_PAL));
    ctx.fillStyle = 'rgba(0,0,0,.4)'; { const xa = x - 10, xb = x + 50; if (xb > xa) ctx.fillRect(xa, y, Math.ceil((xb - xa) / 2) * 2, 2); }
    ctx.drawImage(cart, x + 12, y - cart.height + 2);
    ctx.drawImage(lan, x - 30, y - lan.height + 2);
    ctx.drawImage(m, x - m.width / 2, y - m.height + 2 - bob);
  }
  // ================================================================ 특별한 방 (v0.76): 상인의 노점 · 보물 제단 · 야영지
  // 공통: 2px 칸 · 검은 외곽선 · 왼쪽 위 빛. 그리드에 칠한 뒤 gOutline → gCanvas
  const SP_PAL = { k: '#140c08', R: '#b8342c', r: '#7e2220', C: '#efe2c4', c: '#bba886', S: '#1c130d', w: '#7a5232', W: '#a0703f', b: '#4a3020', B: '#2e1d12',
    y: '#ffd34d', Y: '#c9952a', Z: '#fff4b8', P: '#5a2a6a', p: '#3a1a48', g: '#8a8478', G: '#b4ada0', d: '#4e4a44', D: '#2e2b28',
    '1': '#e0303a', '2': '#4f8dff', '3': '#7ac843', '4': '#e8e0d0', '5': '#c07a3a', '6': '#b05cff', f: '#ff8a2a', F: '#ffe28a', e: '#e2501c', n: '#6a2a1a', N: '#9a3a22' };
  const spGrid = (w, h, fn) => { const g = mkGrid(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = fn(x, y); if (c) g[y][x] = c; } return g; };
  const spCv = (key, w, h, fn) => art('sp_' + key, () => gCanvas(gOutline(spGrid(w, h, fn)), SP_PAL));
  // --- 상인의 노점: 줄무늬 차양 · 기둥 · 물건이 놓인 뒷선반 · 동전 간판 / 앞 계산대(보라 천)
  const STALL_W = 84;
  function stallBack() {
    return spCv('stallB', STALL_W, 46, (x, y) => {
      const W0 = STALL_W, mid = W0 / 2, st = Math.floor((x - 1) / 6);
      if (y <= 11) { if (x < 1 || x > W0 - 2) return null; const sc = y >= 9 && Math.hypot(((x - 1) % 6) - 2.5, y - 8.5) > 3.2; if (sc) return null; const red = st % 2 === 0; return y === 0 ? (red ? 'r' : 'c') : red ? (x < mid ? 'R' : 'r') : (x < mid ? 'C' : 'c'); }
      if ((x >= 3 && x <= 5) || (x >= W0 - 6 && x <= W0 - 4)) return (x === 3 || x === W0 - 6) ? 'W' : 'w';
      if (y >= 12 && y <= 13 && x > 5 && x < W0 - 6) return 'S';
      if (y >= 13 && y <= 18 && Math.abs(x - mid) <= 7) { if (y === 13) return x === mid - 5 || x === mid + 5 ? 'b' : null; if (Math.hypot(x - mid, y - 16) <= 2.2) return y < 16 ? 'Z' : 'y'; return y === 14 || y === 18 ? 'B' : 'W'; }
      if (y >= 16 && y <= 33 && x > 5 && x < W0 - 6) {
        if (y === 24 || y === 33) return 'W';
        const slot = Math.floor((x - 7) / 4), sx = (x - 7) % 4, row = y < 24 ? 0 : 1, top = row ? 28 : 19, it = '1234561356245'[(slot * 3 + row * 5) % 13];
        if (sx < 3 && y >= top && y < (row ? 33 : 24) && !(Math.abs(x - mid) <= 7 && y < 19)) return y === top && sx === 1 ? 'k' : (sx === 0 ? 'Z' : it);
        return y % 4 === 0 ? 'B' : 'b';
      }
      return null;
    });
  }
  function stallFront() {
    return spCv('stallF', STALL_W, 13, (x, y) => {
      if (x < 2 || x > STALL_W - 3) return null;
      if (y <= 1) return y === 0 ? 'W' : 'w';
      const cl = x > 14 && x < STALL_W - 15 && y >= 2 && y <= 8 + ((x % 5) === 0 ? 1 : 0);
      if (cl) return y === 2 || (y === 7 && x % 3 === 0) ? 'y' : x % 6 < 3 ? 'P' : 'p';
      return x % 9 === 0 ? 'B' : y > 10 ? 'b' : 'w';
    });
  }
  const CRATE = () => spCv('crate', 14, 12, (x, y) => (x === 0 || x === 13 || y === 0 || y === 11 || x === y || x === 13 - y + 1) ? 'b' : y < 2 ? 'W' : 'w');
  const BARREL = () => spCv('barrel', 11, 14, (x, y) => { const e = Math.abs(x - 5) / 5.5; if (e > 1 - (y === 0 || y === 13 ? 0.25 : 0)) return null; return y === 3 || y === 10 ? 'D' : x < 4 ? 'W' : x > 7 ? 'b' : 'w'; });
  const SACK = () => spCv('sack', 12, 11, (x, y) => { if (Math.hypot((x - 5.5) / 6, (y - 6) / 5.5) > 1) return null; if (y < 2 && Math.abs(x - 5.5) > 1.5) return null; return y === 2 ? 'b' : x < 5 ? 'C' : 'c'; });
  function drawStall(R) {
    const x = CX & ~1, base = (CY - 30) & ~1, bk = stallBack(), fr = stallFront(), bob = Math.floor(time * 2) % 2 ? 2 : 0;
    const m = art('merch', () => gCanvas(MERCHANT, MERCHANT_PAL)), cart = art('cart', () => gCanvas(CART, CART_PAL));
    ctx.fillStyle = 'rgba(0,0,0,.4)'; { const xa = x - 84, xb = x + 84; if (xb > xa) ctx.fillRect(xa, base, Math.ceil((xb - xa) / 2) * 2, 2); }
    ctx.drawImage(cart, x + 92, base - cart.height + 4);
    ctx.drawImage(bk, x - bk.width / 2, base - bk.height + 2);
    ctx.drawImage(m, x - m.width / 2 + 10, base - 22 - m.height + 2 - bob);
    ctx.drawImage(fr, x - fr.width / 2, base - fr.height + 2);
    const cr = CRATE(), br = BARREL(), sk = SACK();
    ctx.drawImage(cr, x - 110, base - cr.height + 2); ctx.drawImage(cr, x - 104, base - cr.height * 2 + 4); ctx.drawImage(br, x - 126, base - br.height + 4); ctx.drawImage(sk, x - 94, base - sk.height + 6);
    // 차양 모서리에 매단 등불 두 개 (흔들림)
    const lan = art('lantern', () => gCanvas(LANTERN, LANTERN_PAL));
    for (const s of [-1, 1]) { const sw = Math.round(Math.sin(time * 2 + s) * 1.5) * 2, lx = (x + s * (bk.width / 2 - 4) + sw) & ~1, ly = base - bk.height + 26; ctx.fillStyle = '#2e1d12'; ctx.fillRect(lx, ly - 4, 2, 4); ctx.drawImage(lan, lx - lan.width / 2 + 1, ly); }
    if (Math.floor(time * 5) % 9 === 0) { ctx.fillStyle = '#fff4b8'; ctx.fillRect((x - 3 + (Math.floor(time * 5) % 7)) & ~1, (base - bk.height + 30) & ~1, 2, 2); }
  }
  // --- 보물 제단: 금 상감 원형 단 · 금화 더미 · 금 화로 4개 · 위에서 내리는 금빛 기둥
  const GOLDPILE = (v) => spCv('gold' + v, 24, 12, (x, y) => { const e = Math.hypot((x - 11.5) / 12, (y - 11) / (10 + v)); if (e > 1) return null; const h = (x * 7 + y * 13 + v * 5) % 11; return h === 0 ? 'Z' : h === 3 && y > 6 ? (v ? '1' : '2') : h < 4 ? 'y' : (x + y) % 3 ? 'Y' : 'y'; });
  const GOLDBRAZIER = () => spCv('gbraz', 10, 16, (x, y) => { if (y < 4) return Math.abs(x - 4.5) < 4 - y * 0.3 ? (y < 2 ? 'F' : 'f') : null; if (y < 7) return x >= 1 && x <= 8 ? (y === 4 ? 'Z' : 'y') : null; if (y < 14) return x >= 3 && x <= 6 ? (x === 3 ? 'y' : 'Y') : null; return x >= 1 && x <= 8 ? 'Y' : null; });
  function paintTreasureFloor(g, R) {
    const c = R.chest; if (!c) return; const cx = c.x, cy = c.y + 4, st = G.stage;
    if (st === 1) { // 잊힌 성소: 이끼 낀 돌 원판과 들꽃
      for (let y = -40; y <= 40; y += 2) for (let x = -76; x <= 76; x += 2) { const e = Math.hypot(x / 76, y / 40); if (e > 1) continue; const stone = ((Math.floor((x + 80) / 14) + Math.floor((y + 40) / 10)) % 2), seam = (x + 80) % 14 < 2 || (y + 40) % 10 < 2, moss = Math.sin(x * 0.2 + y * 0.31) > 0.55;
        g.fillStyle = e > 0.94 ? '#2a2e26' : seam ? '#2e3328' : moss ? (stone ? '#4a6a34' : '#3e5a2c') : stone ? '#6a6a62' : '#5a5a52'; g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2); }
      for (let i = 0; i < 60; i++) { const a = rand(0, TAU), r = rand(76, 150); g.fillStyle = pick(['#e8e0c0', '#e0c040', '#b080e0', '#e07090']); g.fillRect((cx + Math.cos(a) * r) & ~1, (cy + Math.sin(a) * r * 0.5) & ~1, 2, 2); }
      return;
    }
    if (st === 3) { // 약탈품 더미: 짓밟힌 흙·핏자국·흩어진 금화
      for (let y = -46; y <= 46; y += 2) for (let x = -96; x <= 96; x += 2) { const e = Math.hypot(x / 96, y / 46); if (e > 1 || !dith((x + 200) >> 1, (y + 200) >> 1, 1 - e * 0.8)) continue; g.fillStyle = Math.sin(x * 0.13) * Math.cos(y * 0.2) > 0.6 ? '#4a0c0c' : e < 0.5 ? '#2a1a10' : '#3a2416'; g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2); }
      for (let i = 0; i < 70; i++) { const a = rand(0, TAU), r = rand(10, 110); g.fillStyle = pick(['#ffd34d', '#c9952a', '#fff4b8', '#a8aeb6']); g.fillRect((cx + Math.cos(a) * r) & ~1, (cy + Math.sin(a) * r * 0.5) & ~1, 2, 2); }
      return;
    }
    const RX = 66, RY = 34; // 성채 보물고: 금 상감 원형 단
    for (let y = -RY - 4; y <= RY + 4; y += 2) for (let x = -RX - 6; x <= RX + 6; x += 2) {
      const e = Math.hypot(x / RX, y / RY); if (e > 1.06) continue;
      const a = Math.atan2(y / RY, x / RX), ray = Math.abs(Math.sin(a * 6)) < 0.12 && e > 0.3 && e < 0.88;
      g.fillStyle = e > 1 ? '#140c08' : e > 0.92 ? '#c9952a' : e > 0.86 ? '#6a5a3a' : ray ? '#c9952a' : e < 0.28 ? (e > 0.22 ? '#ffd34d' : '#5a4a32') : ((x >> 1) + (y >> 1)) % 2 ? '#4a4038' : '#3e352e';
      g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2);
    }
    for (let i = 0; i < 40; i++) { const a = rand(0, TAU), r = rand(70, 120); g.fillStyle = pick(['#ffd34d', '#c9952a', '#fff4b8']); g.fillRect((cx + Math.cos(a) * r) & ~1, (cy + Math.sin(a) * r * 0.55) & ~1, 2, 2); }
  }

  const PEDESTAL = () => spCv('pedestal', 28, 13, (x, y) => { if (y < 5) return Math.abs(x - 13.5) <= 13 - (y === 0 ? 1 : 0) ? (y === 4 ? 'y' : y === 0 ? 'G' : (x + y) % 5 ? 'g' : 'G') : null; if (x < 1 || x > 26) return null; return y === 12 ? 'Y' : (x - 1) % 6 === 0 ? 'D' : y === 7 && x % 3 === 0 ? 'Y' : y > 9 ? 'D' : 'd'; });
  function drawTreasure(R) { // 받침대 (금화 더미·화로 등은 소품으로 배치)
    const c = R.chest, pd = PEDESTAL(); ctx.drawImage(pd, (c.x - pd.width / 2) & ~1, (c.y + 6 - pd.height) & ~1); c.lift = 12;
  }

  function drawTreasureBeam(R) { // 열지 않은 상자 위로 내리는 금빛 기둥 + 떠다니는 금가루
    const c = R && R.chest; if (!c || c.opened || R.type !== 'reward') return;
    const H0 = 150, pulse = 0.75 + 0.25 * Math.sin(time * 2.5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const L = pxLayer((Math.round(c.x) - 34) & ~1, (Math.round(c.y - 36) - H0 - 2) & ~1, 72, H0 + 6, true); // v1.17 한 장으로
    for (let y = 0; y < H0; y += 2) { const k = y / H0, hw = Math.round((10 + 18 * k) / 2) * 2; for (let x = -hw; x < hw; x += 2) { const ed = Math.abs(x) / hw; if (!dith((x + 64) >> 1, (y + Math.floor(time * 8)) >> 1, (1 - k * 0.6) * (1 - ed) * 0.55 * pulse)) continue; if (ed < 0.4) L.rect((Math.round(c.x) + x) & ~1, (Math.round(c.y - 36) - (H0 - y)) & ~1, 2, 2, 255, 240, 190, 0.5); else L.rect((Math.round(c.x) + x) & ~1, (Math.round(c.y - 36) - (H0 - y)) & ~1, 2, 2, 255, 200, 90, 0.35); } }
    L.flush(); ctx.restore();
    if (Math.random() < 0.5) G.parts.push({ x: c.x + rand(-20, 20), y: c.y - rand(10, 120), vx: rand(-5, 5), vy: rand(8, 20), t: rand(0.8, 1.4), c: pick(['#ffd34d', '#fff4b8']), g: 0, glow: true });
  }
  // --- 야영지: 큰 모닥불(돌 둘레·장작·삼발이 냄비) · 천막 · 통나무 의자 · 침낭 · 장작더미
  const TENT = () => spCv('camptent', 36, 26, (x, y) => { const h = 24 - Math.abs(x - 17.5) * 1.35; if (y < 25 - h - 1 || y > 24) return x === 17 && y < 25 - h - 1 && y > 25 - h - 4 ? 'b' : null; const door = Math.abs(x - 17.5) < (y - 6) * 0.38 && y > 8; if (door) return y > 20 ? 'S' : 'B'; return x < 17 ? (x % 6 === 0 ? 'c' : 'C') : (x % 6 === 0 ? 'Y' : 'c'); });
  const LOGSEAT = () => spCv('logseat', 28, 8, (x, y) => (x <= 2 || x >= 25) ? (Math.hypot(x <= 2 ? x - 2 : x - 25, y - 3.5) < 3.4 ? (Math.hypot(x <= 2 ? x - 2 : x - 25, y - 3.5) < 1.6 ? 'W' : 'w') : null) : y === 0 ? 'W' : y > 5 ? 'b' : x % 7 === 0 ? 'B' : 'w');
  const BEDROLL = () => spCv('bedroll', 26, 9, (x, y) => x > 21 ? (Math.hypot(x - 22, y - 4) < 4.4 ? (y < 4 ? 'R' : 'r') : null) : (y >= 1 && y <= 7 ? (x % 5 === 0 ? 'C' : y < 3 ? 'R' : 'r') : null));
  const WOODPILE = () => spCv('woodpile', 20, 13, (x, y) => { const row = Math.floor((12 - y) / 4), off = row % 2 ? 2 : 0, cx = (x - off) % 4; if (y > 12 || x - off < 0 || x - off > 19 - row * 4) return null; return cx === 0 ? 'B' : (12 - y) % 4 === 3 ? 'b' : cx === 1 ? 'W' : 'w'; });
  function drawCampFire(b) {
    const x = Math.round(b.x) & ~1, y = Math.round(b.y) & ~1;
    { const rb = srArt('ringBack', G.stage, SR.ringBack); ctx.drawImage(rb, x - rb.width / 2, y - rb.height + 4); } // v1.11 돌 둘레 뒤쪽 반
    // 엇갈린 장작
    ctx.fillStyle = '#140c08'; ctx.fillRect(x - 14, y - 6, 28, 6); ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - 12, y - 4, 24, 2); ctx.fillStyle = '#3a2416'; ctx.fillRect(x - 12, y - 2, 24, 2);
    ctx.fillStyle = '#ff7020'; ctx.fillRect(x - 8, y - 4, 4, 2); ctx.fillRect(x + 4, y - 4, 4, 2);
    // 층층이 타오르는 불꽃 (칸 단위로 흔들림)
    for (let i = 0; i < 9; i++) { const ph = Math.sin(time * 11 + i * 1.9), h = (12 + ((ph + 1) * 6) + (i === 4 ? 8 : i === 3 || i === 5 ? 4 : 0)) | 0, fx = x - 9 + i * 2;
      ctx.fillStyle = '#e2501c'; ctx.fillRect(fx, y - 4 - (h & ~1), 2, h & ~1);
      if (i > 1 && i < 7) { ctx.fillStyle = '#ff8a2a'; ctx.fillRect(fx, y - 4 - ((h * 0.7) & ~1), 2, (h * 0.7) & ~1); }
      if (i > 2 && i < 6) { ctx.fillStyle = '#ffe28a'; ctx.fillRect(fx, y - 4 - ((h * 0.4) & ~1), 2, (h * 0.4) & ~1); } }
    { const rf = srArt('ringFront', G.stage, SR.ringFront); ctx.drawImage(rf, x - rf.width / 2, y - 4); } // 앞쪽 반
    if (G.stage === 3) { // 꼬챙이 고기 굽기
      ctx.fillStyle = '#2e1d12'; for (const s of [-1, 1]) { ctx.fillRect(x + s * 18 - 1, y - 24, 2, 22); ctx.fillRect(x + s * 18 - 3, y - 26, 6, 2); }
      ctx.fillStyle = '#140c08'; ctx.fillRect(x - 22, y - 26, 44, 2); const rot = Math.floor(time * 3) % 2;
      ctx.fillStyle = '#140c08'; ctx.fillRect(x - 10, y - 32, 20, 12); ctx.fillStyle = rot ? '#8a3a22' : '#9a4a2a'; ctx.fillRect(x - 8, y - 30, 16, 8); ctx.fillStyle = '#c87040'; ctx.fillRect(x - 6, y - 30, 8, 2); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + 8, y - 28, 4, 2);
      if (Math.random() < 0.2) G.parts.push({ x: x + rand(-6, 6), y: y - 22, vx: 0, vy: 30, t: 0.3, c: '#ffb050', g: 200 }); // 떨어지는 기름
      return;
    }
    // 삼발이와 냄비
    ctx.fillStyle = '#2e1d12'; for (const [dx, dy] of [[-16, 0], [16, 0]]) for (let k = 0; k < 18; k += 2) ctx.fillRect((x + dx - Math.sign(dx) * k * 0.8) & ~1, (y + dy - k * 1.9) & ~1, 2, 4);
    ctx.fillStyle = '#140c08'; ctx.fillRect(x - 1, y - 36, 2, 8); ctx.fillRect(x - 7, y - 30, 14, 10); ctx.fillStyle = '#4e4a44'; ctx.fillRect(x - 5, y - 28, 10, 6); ctx.fillStyle = '#8a8478'; ctx.fillRect(x - 5, y - 28, 10, 2);
    if (Math.random() < 0.25) G.parts.push({ x: x + rand(-3, 3), y: y - 32, vx: rand(-4, 4), vy: -18, t: 1.2, c: 'rgba(200,200,210,.5)', g: 0 }); // 냄비 김
    if (Math.random() < 0.6) G.parts.push({ x: x + rand(-6, 6), y: y - 14, vx: rand(-10, 10), vy: -rand(30, 60), t: rand(0.6, 1.1), c: pick(['#ffb050', '#ff7030', '#ffe28a']), g: 0, glow: true });
  }
  function drawCamp(R) { // y 정렬 소품: 천막 · 통나무 의자 2 · 침낭 · 장작더미
    const b = G.bonfire; if (!b) return []; const t = TENT(), lg = LOGSEAT(), bd = BEDROLL(), wp = WOODPILE();
    return [
      { y: b.y - 46, d: () => ctx.drawImage(t, (b.x - 92 - t.width / 2) & ~1, (b.y - 46 - t.height + 2) & ~1) },
      { y: b.y - 22, d: () => ctx.drawImage(lg, (b.x - lg.width / 2) & ~1, (b.y - 22 - lg.height + 2) & ~1) },
      { y: b.y + 30, d: () => ctx.drawImage(lg, (b.x - lg.width / 2) & ~1, (b.y + 30 - lg.height + 2) & ~1) },
      { y: b.y + 8, d: () => ctx.drawImage(bd, (b.x + 44) & ~1, (b.y + 8 - bd.height + 2) & ~1) },
      { y: b.y - 30, d: () => ctx.drawImage(wp, (b.x + 48) & ~1, (b.y - 30 - wp.height + 2) & ~1) },
      { y: b.y, d: () => drawCampFire(b) },
    ];
  }
  function paintCampFloor(g, R) { // 불 주변 그을리고 다져진 땅
    const b = { x: CX + 40, y: CY - 10 };
    for (let y = -48; y <= 48; y += 2) for (let x = -96; x <= 96; x += 2) { const e = Math.hypot(x / 96, y / 48); if (e > 1 || !dith((x + 200) >> 1, (y + 200) >> 1, (1 - e) * 0.8)) continue; g.fillStyle = e < 0.25 ? '#1a120c' : e < 0.5 ? '#2a1e14' : '#3a2c1e'; g.fillRect((b.x + x) & ~1, (b.y + y) & ~1, 2, 2); }
    for (let i = 0; i < 18; i++) { g.fillStyle = pick(['#4e4a44', '#2e2b28', '#6b6560']); g.fillRect((b.x + rand(-26, 26)) & ~1, (b.y + rand(-8, 8)) & ~1, 2, 2); } // 재
  }
  // 상점 바닥: 노점 앞에 깔린 큰 직물 깔개
  function paintShopFloor(g, R) { // 상품을 늘어놓은 낡은 누비 깔개 두 장 (가장자리가 해지고 비뚤어짐)
    const pals = [['#6a5030', '#5a4228', '#8a6a40', '#3a5a3a', '#7a3028'], ['#5a4a6a', '#4a3a58', '#7a6a50', '#6a3028', '#4a5a30']];
    for (const [ox, oy, w, h, k] of [[CX - 162, CY + 8, 176, 44, 0], [CX + 6, CY + 12, 158, 40, 1]]) {
      for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
        const wob = Math.sin(x * 0.11 + k) * 3 + Math.sin(y * 0.3) * 2, ey = y + wob * 0.3, frayed = x < 4 + (y * 7 % 5) || x > w - 6 + (y * 3 % 4) || ey < 2 + (x * 5 % 4) || ey > h - 4 + (x * 3 % 3);
        if (frayed && ((x + y) >> 1) % 3 === 0) continue;
        const patch = (Math.floor((x + 6 * k) / 22) * 7 + Math.floor(y / 14) * 3) % 5, seam = x % 22 === 0 || y % 14 === 0;
        g.fillStyle = frayed ? '#2a1e14' : seam ? '#1e150e' : pals[k][patch]; g.fillRect((ox + x) & ~1, (oy + y + Math.round(wob * 0.3) * 2) & ~1, 2, 2);
      }
    }
  }

  // ---- v0.77: 특별한 방을 챕터별 장면으로 — 생성한 도트 소품을 일반 소품(PROPS)으로 등록해 y정렬·조명·막힘을 그대로 쓴다
  Object.assign(SP_PAL, { m: '#4a7a34', M: '#6e9a4a', h: '#9a7450', H: '#6a4a30', v: '#5a6638', V: '#3c4628', s: '#a8aeb6', q: '#5a6068', o: '#d8d0b8', O: '#a89880' });
  function spProp(name, w, h, fn, opt, pal) { if (PROP_MAPS[name]) return; const g = gOutline(spGrid(w, h, fn)); PROP_MAPS[name] = [g.map(r => r.join('')), pal || SP_PAL]; PROPS[name] = Object.assign({ foot: 1 }, opt || {}); }
  function spPropGrid(name, g, pal, opt) { if (PROP_MAPS[name]) return; PROP_MAPS[name] = [g.map(r => r.join('')), pal]; PROPS[name] = Object.assign({ foot: 1 }, opt || {}); }
  let SP_READY = false;
  function ensureSpecialProps() {
    if (SP_READY) return; SP_READY = true;
    const hs = (n) => { const v = Math.sin(n * 91.3) * 43758.5; return v - Math.floor(v); };
    // 기울어진 장대 두 개 사이에 처진 천막 지붕 (덧댄 천, 너덜너덜한 밑단, 매단 냄비, 버팀줄) — 초원: 풀빛 천 / 성채: 찢긴 붉은 태피스트리 / 부락: 꿰맨 가죽
    for (const [nm, A1, A2, P1] of [['tarpM', 'v', 'V', 'c'], ['tarpC', 'R', 'r', 'y'], ['tarpO', 'h', 'H', 'k']]) spProp(nm, 62, 42, (x, y) => {
      const sag = 5 + Math.sin(x / 61 * Math.PI) * 4, bot = 17 + Math.round(hs(x * 0.7 + 3) * 3) + (x % 7 === 0 ? 2 : 0);
      if ((x === 5 || x === 6) && y >= 3) return x === 5 ? 'W' : 'w'; if ((x === 55 || x === 56) && y >= 6) return x === 55 ? 'W' : 'w';
      if (y >= 39 && (x <= 2 || x >= 59)) return 'b';
      if (Math.abs(y - (3 + (36 / 4) * (5 - x) / 1.25)) < 0.6 && x < 5) return 'b'; if (Math.abs(y - (6 + (33 / 5) * (x - 56) / 1.2)) < 0.6 && x > 56) return 'b';
      if (x >= 4 && x <= 57 && y >= sag && y <= bot) {
        const pt = ((Math.floor(x / 9) + Math.floor(y / 6)) % 3 === 0) && x > 8 && x < 52, edge = y === Math.round(sag);
        if (P1 === 'k' && (x + y) % 6 === 0 && y > sag + 1) return 'k';
        if (P1 === 'y' && y >= bot - 1) return 'y';
        return edge ? (A1 === 'h' ? 'o' : 'C') : pt ? (P1 === 'c' ? 'c' : A2) : (x < 30 ? A1 : A2);
      }
      for (const px of [16, 28, 40]) if (Math.abs(x - px) <= 2 && y > bot && y <= bot + 4 && nm !== 'tarpO') return y === bot + 1 ? 'q' : 'D';
      if (nm === 'tarpO') for (const px of [14, 30, 46]) if (Math.abs(x - px) <= 1 && y > bot && y <= bot + 3) return y === bot + 3 ? 'k' : 'o';
      return null; });
    // 상품을 늘어놓은 낡은 상자
    spProp('goodsBox', 16, 9, (x, y) => (y === 0 ? (x % 4 === 1 ? 'c' : 'C') : x === 0 || x === 15 || y === 8 ? 'b' : x % 5 === 0 ? 'B' : 'w'), {});
    // 바구니 (초원: 버섯 / 성채: 양초 / 부락: 뼈)
    for (const [nm, a, b] of [['basketM', '1', '4'], ['basketC', '4', 'F'], ['basketO', 'o', 'O']]) spProp(nm, 12, 10, (x, y) => { if (y < 4) return (x > 1 && x < 10 && (x + y) % 3 !== 0) ? (y < 2 ? a : b) : null; return Math.abs(x - 5.5) <= 5.5 - (y > 8 ? 1 : 0) ? ((x + y) % 2 ? 'W' : 'w') : null; }, { r: 5 });
    // 등불 장대
    spProp('lampPole', 9, 30, (x, y) => { if (x === 2 && y >= 2) return 'w'; if (y === 2 && x >= 2 && x <= 7) return 'b'; if (x >= 5 && x <= 8 && y >= 4 && y <= 9) return y === 4 || y === 9 ? 'k' : y < 6 ? 'Z' : 'y'; if (x === 6 && y === 3) return 'b'; return null; }, { r: 3, light: { r: 60, c: '255,190,100', ca: 0.16, dy: -22 } });
    // 이끼 낀 선돌 2종
    for (const v of [0, 1]) spProp('menhir' + v, 10, 20 - v * 3, (x, y) => { const H0 = 20 - v * 3, hw = 4.5 - (y < 3 ? (3 - y) * 0.8 : 0) - (v ? 0.5 : 0); if (Math.abs(x - 4.5) > hw) return null; const moss = (y > H0 - 6 && (x + y) % 3 === 0) || (y < 5 && x < 4 && (x + y) % 2 === 0); return moss ? (y % 2 ? 'm' : 'M') : x < 4 ? 'G' : x > 6 ? 'd' : 'g'; }, { r: 6 });
    // 깃대에 매단 찢긴 깃발 (성채)
    spProp('banner', 13, 34, (x, y) => { if (x === 1 && y >= 1) return 'W'; if (y === 2 && x <= 11) return 'b'; if (x >= 3 && x <= 11 && y >= 3 && y <= 22 - (x % 3 === 0 ? 3 : 0)) return (y === 3 ? 'y' : x === 3 || x === 11 ? 'r' : (y > 8 && y < 13 && Math.abs(x - 7) < 2) ? 'y' : 'R'); return null; }, { r: 3 });
    // 땅에 꽂힌 무기 더미 (부락)
    spProp('weaponPile', 28, 20, (x, y) => { for (const [bx, a, len, c] of [[6, -0.3, 16, 's'], [12, 0.15, 18, 'q'], [18, -0.1, 14, 's'], [23, 0.35, 15, 'q']]) { const t = (19 - y) / len; if (t >= 0 && t <= 1 && Math.abs(x - (bx + Math.sin(a) * len * t)) < 1) return t > 0.85 ? 'k' : t < 0.25 ? 'b' : c; } if (y >= 16 && Math.abs(x - 14) < 13 - (19 - y) * 2) return (x + y) % 3 ? 'H' : 'h'; return null; }, { r: 10 });
    // 부서진 신도석 (성채)
    spProp('pew', 30, 12, (x, y) => { if (y < 6) return x >= 1 && x <= 28 - (x > 20 && y < 3 ? 6 : 0) ? (y === 0 ? 'W' : 'w') : null; if (y === 6) return x <= 28 ? 'b' : null; return (x <= 2 || (x >= 25 && x <= 27)) ? 'B' : null; }, { w: 56, h: 10 });
    // 빨랫줄 (초원 야영지)
    spProp('clothesline', 52, 28, (x, y) => { if ((x === 1 || x === 50) && y >= 2) return 'w'; const ly = 3 + Math.sin((x - 1) / 49 * Math.PI) * 3; if (x > 1 && x < 50 && Math.abs(y - ly) < 0.6) return 'b'; for (const [cx, w, c] of [[10, 7, 'C'], [22, 6, 'R'], [33, 8, 'c'], [43, 5, 'v']]) if (Math.abs(x - cx) < w / 2 && y > ly + 0.5 && y < ly + 10 - (x % 3 === 0 ? 2 : 0)) return c; return null; }, { r: 3 });
    // 생성해 둔 야영 소품도 소품으로
    const fromCv = (nm, key, w, h, fn, opt) => spProp(nm, w, h, fn, opt);
    spProp('campTent', 36, 26, (x, y) => { const h = 24 - Math.abs(x - 17.5) * 1.35; if (y < 25 - h - 1 || y > 24) return x === 17 && y < 25 - h - 1 && y > 25 - h - 4 ? 'b' : null; const door = Math.abs(x - 17.5) < (y - 6) * 0.38 && y > 8; if (door) return y > 20 ? 'S' : 'B'; return x < 17 ? (x % 6 === 0 ? 'c' : 'C') : (x % 6 === 0 ? 'Y' : 'c'); }, { w: 64, h: 18 });
    spProp('logSeat', 28, 8, (x, y) => (x <= 2 || x >= 25) ? (Math.hypot(x <= 2 ? x - 2 : x - 25, y - 3.5) < 3.4 ? (Math.hypot(x <= 2 ? x - 2 : x - 25, y - 3.5) < 1.6 ? 'W' : 'w') : null) : y === 0 ? 'W' : y > 5 ? 'b' : x % 7 === 0 ? 'B' : 'w', { w: 52, h: 6 });
    spProp('bedRoll', 26, 9, (x, y) => x > 21 ? (Math.hypot(x - 22, y - 4) < 4.4 ? (y < 4 ? 'R' : 'r') : null) : (y >= 1 && y <= 7 ? (x % 5 === 0 ? 'C' : y < 3 ? 'R' : 'r') : null), { w: 48, h: 8 });
    spProp('firewood', 20, 13, (x, y) => { const row = Math.floor((12 - y) / 4), off = row % 2 ? 2 : 0, cx = (x - off) % 4; if (y > 12 || x - off < 0 || x - off > 19 - row * 4) return null; return cx === 0 ? 'B' : (12 - y) % 4 === 3 ? 'b' : cx === 1 ? 'W' : 'w'; }, { r: 10 });
    spProp('crateP', 14, 12, (x, y) => (x === 0 || x === 13 || y === 0 || y === 11 || x === y || x === 13 - y + 1) ? 'b' : y < 2 ? 'W' : 'w', { r: 7 });
    spProp('barrelP', 11, 14, (x, y) => { const e = Math.abs(x - 5) / 5.5; if (e > 1 - (y === 0 || y === 13 ? 0.25 : 0)) return null; return y === 3 || y === 10 ? 'D' : x < 4 ? 'W' : x > 7 ? 'b' : 'w'; }, { r: 6 });
    spProp('sackP', 12, 11, (x, y) => { if (Math.hypot((x - 5.5) / 6, (y - 6) / 5.5) > 1) return null; if (y < 2 && Math.abs(x - 5.5) > 1.5) return null; return y === 2 ? 'b' : x < 5 ? 'C' : 'c'; }, { r: 6 });
    for (const v of [0, 1]) spProp('goldPile' + v, 24, 12, (x, y) => { const e = Math.hypot((x - 11.5) / 12, (y - 11) / (10 + v)); if (e > 1) return null; const h = (x * 7 + y * 13 + v * 5) % 11; return h === 0 ? 'Z' : h === 3 && y > 6 ? (v ? '1' : '2') : h < 4 ? 'y' : (x + y) % 3 ? 'Y' : 'y'; }, { w: 44, h: 10 });
    spProp('goldBrazier', 10, 16, (x, y) => { if (y < 4) return Math.abs(x - 4.5) < 4 - y * 0.3 ? (y < 2 ? 'F' : 'f') : null; if (y < 7) return x >= 1 && x <= 8 ? (y === 4 ? 'Z' : 'y') : null; if (y < 14) return x >= 3 && x <= 6 ? (x === 3 ? 'y' : 'Y') : null; return x >= 1 && x <= 8 ? 'Y' : null; }, { r: 6, light: { r: 40, c: '255,170,70', ca: 0.14, dy: -14 }, flame: [[3, 0], [5, 0]] });
    spPropGrid('cartP', CART.map(r => r.slice()), CART_PAL, { w: 56, h: 14 });
    spPropGrid('hideTent', genTent(30, 16).g, WOODPAL, { w: 58, h: 16 });
  }
  // ================================================================ v1.11 특별한 방 다시 그리기 (대장간 수준): 상인 · 모닥불 · 보물 방 · 비밀 방
  // 2px 칸 · 검은 외곽선 · 왼쪽 위 빛 · 4단계 명암. 챕터별로 팔레트만 바꿔 같은 물건을 다른 재질로
  const SRPAL = { k: '#0b0a0e',
    o: '#b07c44', O: '#83592f', p: '#5c3c20', P: '#3c2614', // 나무
    e: '#e8705a', r: '#c03c30', R: '#86241e', E: '#4e1214', // 붉은 천
    c: '#f2e4c2', C: '#d0b98c', v: '#a08658', V: '#6a5636', // 생천 · 캔버스
    '1': '#9a94a4', '2': '#706a80', '3': '#4c4758', '4': '#2e2a36', // 돌
    y: '#fff3c0', Y: '#ffd060', g: '#e0a030', G: '#9a6418', // 금
    i: '#e0e4ec', I: '#a8aeb8', j: '#6e747e', J: '#43474f', // 쇠
    m: '#8cc058', M: '#5a8a34', n: '#34522a', N: '#1e3218', // 풀 · 이끼
    u: '#8ac4e8', U: '#4078a8', q: '#b080d8', Q: '#6a3e8a', z: '#3e2458', // 파랑 · 보라
    f: '#ffb040', F: '#ff6a2a', w: '#ffffff', // 불 · 흰빛
    b: '#ece4cc', B: '#bcae8c', x: '#7a6e56', // 뼈
    h: '#b08458', H: '#7a5636', a: '#4e3626', A: '#2e2018', // 털가죽
    d: '#24202a', D: '#16131a', s: '#5a5a62', S: '#3a3a42', l: '#f2f0f6', L: '#cfcbd9', t: '#a29eb2', T: '#68647a' }; // l~T 대리석
  // 챕터별 재질 바꾸기: 키는 SRPAL 글자, 값은 바꿀 색
  const SR_ST = {
    1: {},
    2: { '1': '#a8a4b4', '2': '#7c7890', '3': '#56526a', '4': '#34303e' },
    3: { '1': '#a08868', '2': '#7a6448', '3': '#54442e', '4': '#33281c', c: '#d8b48a', C: '#b08a60', v: '#86643e', V: '#5a4028', r: '#a83a24', R: '#70241a', e: '#d06040' },
  };
  const srPal = st => Object.assign({}, SRPAL, SR_ST[st] || {});
  const srArt = (k, st, fn) => art('sr_' + k + '_' + st, () => gCanvas(fn(st), srPal(st)));
  const SR = {};
  // 판자 (세로결): x0~x1 너비, 왼쪽이 밝음
  const plank = (x, w) => x === 0 ? 'o' : x === w - 1 ? 'p' : 'O';

  // ---- 상인 ----------------------------------------------------------------
  // 노점 뒤편: 줄무늬 차양(물결 끝단) · 두 기둥 · 판자 벽 · 선반 2단(병·단지·두루마리·작은 함) · 매단 등 · 동전 간판
  SR.stall = st => { const W = 70, H = 50, g = FG.mk(W, H);
    // 판자 벽
    FG.rect(g, 6, 12, W - 7, 44, (x, y) => (x - 6) % 7 === 0 ? 'P' : (x - 6) % 7 === 1 ? 'O' : ((x * 5 + y * 3) % 23 === 0 ? 'P' : 'p'));
    // 선반 2단
    for (const sy of [24, 35]) { FG.rect(g, 6, sy, W - 7, sy, 'o'); FG.rect(g, 6, sy + 1, W - 7, sy + 1, 'P'); for (const bx of [10, W - 11]) FG.rect(g, bx, sy + 2, bx, sy + 3, 'P'); }
    // 윗단 물건: 병 · 단지 · 두루마리 · 병
    const bottle = (x, y, c1, c2) => { FG.rect(g, x + 1, y - 7, x + 1, y - 6, 'V'); FG.put(g, x + 1, y - 8, 'v'); FG.rect(g, x, y - 5, x + 2, y - 1, (xx, yy) => xx === x ? (yy === y - 5 ? 'w' : c1) : c2); };
    const jar = (x, y, c1, c2) => { FG.rect(g, x + 1, y - 5, x + 3, y - 5, 'v'); FG.rect(g, x, y - 4, x + 4, y - 1, (xx, yy) => xx === x ? c1 : xx === x + 4 || yy === y - 1 ? c2 : (yy === y - 3 && xx === x + 1 ? 'c' : c1)); };
    const scroll = (x, y) => { FG.rect(g, x, y - 3, x + 7, y - 1, (xx, yy) => yy === y - 3 ? 'c' : yy === y - 1 ? 'v' : 'C'); FG.put(g, x + 3, y - 2, 'r'); FG.put(g, x + 3, y - 3, 'R'); };
    bottle(9, 23, 'e', 'R'); bottle(13, 23, 'u', 'U'); jar(18, 23, 'h', 'H'); scroll(25, 23); bottle(35, 23, 'm', 'M'); bottle(39, 23, 'q', 'Q'); jar(44, 23, 'C', 'v'); scroll(51, 23); bottle(60, 23, 'Y', 'G');
    // 아랫단: 작은 함 · 천 두루마리 · 단지 · 해골잔(3)/촛대(2)/허브다발(1)
    FG.rect(g, 9, 29, 17, 33, (x, y) => y === 29 ? 'g' : x === 9 ? 'o' : x === 17 || y === 33 ? 'p' : y === 31 ? 'G' : 'O'); FG.put(g, 13, 31, 'Y');
    for (const [x, c1, c2] of [[21, 'r', 'R'], [26, 'u', 'U'], [31, 'm', 'M']]) FG.rect(g, x, 30, x + 4, 34, (xx, yy) => yy === 30 ? 'c' : xx === x ? c1 : xx === x + 4 ? c2 : (yy % 2 ? c1 : c2));
    jar(39, 34, 'I', 'j'); jar(46, 34, 'e', 'R');
    if (st === 3) { FG.ell(g, 57, 31, 3, 2.6, (dx, dy) => dx + dy < -1 ? 'b' : dx + dy > 1.5 ? 'x' : 'B'); FG.put(g, 56, 31, 'k'); FG.put(g, 58, 31, 'k'); }
    else if (st === 2) { FG.rect(g, 57, 29, 57, 34, 'j'); FG.rect(g, 55, 34, 59, 34, 'J'); FG.put(g, 57, 28, 'c'); FG.put(g, 57, 27, 'f'); }
    else { for (const x of [55, 57, 59]) FG.line(g, 57, 34, x, 28, 'M'); FG.put(g, 55, 28, 'm'); FG.put(g, 59, 28, 'm'); FG.put(g, 57, 28, 'Y'); FG.rect(g, 56, 33, 58, 33, 'v'); }
    // 아래 판자 받침
    FG.rect(g, 6, 40, W - 7, 44, (x, y) => y === 40 ? 'o' : (x - 6) % 9 === 0 ? 'P' : 'O');
    // 기둥 2개
    for (const x0 of [3, W - 6]) FG.rect(g, x0, 6, x0 + 2, H - 1, (x) => plank(x - x0, 3));
    // 차양: 줄무늬 · 위는 밝고 아래는 어두움 · 물결 끝단
    for (let y = 0; y <= 14; y++) for (let x = 0; x < W; x++) {
      const inset = Math.max(0, 3 - y); if (x < inset || x > W - 1 - inset) continue;
      const sx = Math.floor(x / 7), red = sx % 2 === 0, lx = x % 7;
      if (y >= 11) { const bump = Math.hypot(lx - 3, (y - 10.5) * 1.3); if (bump > 3.6) continue; }
      let c = red ? (y < 3 ? 'e' : y < 9 ? 'r' : 'R') : (y < 3 ? 'c' : y < 9 ? 'C' : 'v');
      if (lx === 0) c = red ? 'R' : 'v'; // 주름
      if (y === 9) c = red ? 'E' : 'V';
      FG.put(g, x, y, c);
    }
    FG.rect(g, 1, 0, W - 2, 0, 'p'); // 위 장대
    // 매단 등 (왼쪽) · 동전 간판 (오른쪽)
    FG.rect(g, 15, 13, 15, 15, 'J'); FG.rect(g, 13, 16, 17, 16, 'J'); FG.rect(g, 13, 17, 17, 20, (x, y) => x === 13 || x === 17 ? 'J' : y === 17 ? 'y' : 'Y'); FG.rect(g, 14, 21, 16, 21, 'J');
    FG.rect(g, 52, 13, 52, 14, 'J'); FG.rect(g, 58, 13, 58, 14, 'J'); FG.rect(g, 50, 15, 60, 21, (x, y) => x === 50 || y === 15 ? 'o' : x === 60 || y === 21 ? 'P' : 'O');
    FG.ell(g, 55, 18, 2.4, 2.4, (dx, dy) => dx + dy < -1 ? 'y' : dx + dy > 1.2 ? 'G' : 'Y'); FG.put(g, 55, 18, 'g');
    return gOutline(g); };
  // 노점 앞 계산대: 판자 + 늘어진 보라 천(금테·술)
  SR.counter = st => { const W = 54, H = 12, g = FG.mk(W, H);
    FG.rect(g, 0, 0, W - 1, 1, (x, y) => y === 0 ? 'o' : 'O');
    FG.rect(g, 1, 2, W - 2, 9, (x, y) => { const fold = (x % 9); if (y === 2) return 'g'; if (y === 9) return x % 3 === 1 ? 'Y' : 'G'; return fold === 0 ? 'z' : fold < 3 ? 'q' : fold > 6 ? 'z' : 'Q'; });
    for (let x = 2; x < W - 2; x += 4) FG.put(g, x, 10, 'g');
    FG.put(g, Math.floor(W / 2), 5, 'Y'); FG.put(g, Math.floor(W / 2) - 1, 5, 'g'); FG.put(g, Math.floor(W / 2) + 1, 5, 'g'); FG.put(g, Math.floor(W / 2), 4, 'g'); FG.put(g, Math.floor(W / 2), 6, 'g');
    return gOutline(g); };
  // 물건 진열대: 다리 넷 + 붉은 천 덮개(금테)
  SR.stand = st => { const W = 20, H = 12, g = FG.mk(W, H);
    for (const x of [2, W - 3]) FG.rect(g, x, 5, x, H - 1, (xx, y) => y === H - 1 ? 'P' : 'p'); for (const x of [4, W - 5]) FG.rect(g, x, 5, x, H - 2, 'P');
    FG.rect(g, 0, 0, W - 1, 1, (x, y) => y === 0 ? 'e' : 'r'); FG.rect(g, 0, 2, W - 1, 4, (x, y) => y === 4 ? (x % 2 ? 'Y' : 'G') : x % 5 === 0 ? 'R' : 'r');
    return gOutline(g); };
  // 쌓인 나무 상자 3개 + 밧줄 + 낙인
  SR.crates = st => { const W = 30, H = 25, g = FG.mk(W, H);
    const box = (x0, y0, s) => { FG.rect(g, x0, y0, x0 + s, y0 + 2, (x, y) => y === y0 ? 'o' : 'O'); // 윗면
      FG.rect(g, x0, y0 + 3, x0 + s, y0 + s, (x, y) => x === x0 || x === x0 + s || y === y0 + 3 || y === y0 + s ? 'p' : (Math.abs((x - x0) - (y - y0 - 3)) < 1 || Math.abs((x - x0) + (y - y0 - 3) - s) < 1) ? 'O' : (y - y0) % 3 === 0 ? 'P' : 'p'); };
    box(1, 11, 13); box(15, 11, 13); box(8, 0, 12);
    FG.rect(g, 21, 15, 23, 17, (x, y) => (x + y) % 2 ? 'R' : 'k'); // 낙인
    FG.line(g, 13, 1, 13, 12, 'v'); FG.line(g, 9, 6, 20, 6, 'C'); FG.put(g, 13, 6, 'V');
    return gOutline(g); };
  // 곡식 자루 3개 (하나는 열려 낟알이 쏟아짐)
  SR.sacks = st => { const W = 30, H = 17, g = FG.mk(W, H);
    const sack = (cx, cy, rx, ry, open) => { FG.ell(g, cx, cy, rx, ry, (dx, dy) => { const v = dx * 0.7 + dy; return v < -ry * 0.5 ? 'c' : v < 0.5 ? 'C' : v < ry * 0.6 ? 'v' : 'V'; });
      if (open) { FG.ell(g, cx, cy - ry + 1, rx * 0.6, 1.2, (dx) => dx < 0 ? 'Y' : 'g'); } else { FG.rect(g, cx - 1, cy - ry - 2, cx + 1, cy - ry, (x, y) => y === cy - ry - 2 ? 'C' : 'v'); FG.rect(g, cx - 2, cy - ry, cx + 2, cy - ry, 'R'); } };
    sack(7, 10, 6, 5.5, false); sack(22, 11, 6.5, 5, true); sack(14, 8, 5, 5.5, false);
    for (const [x, y] of [[26, 15], [28, 14], [27, 16], [29, 16], [24, 16]]) FG.put(g, x, y, (x + y) % 2 ? 'Y' : 'g');
    return gOutline(g); };
  // 양탄자 거치대: A자 나무틀 + 말린 양탄자 셋(무늬)
  SR.rugRack = st => { const W = 28, H = 30, g = FG.mk(W, H);
    FG.line(g, 3, 29, 7, 2, 'O'); FG.line(g, 24, 29, 20, 2, 'p'); FG.rect(g, 4, 2, 23, 3, (x, y) => y === 2 ? 'o' : 'p');
    const roll = (x0, c1, c2, c3) => { FG.rect(g, x0, 4, x0 + 5, 25, (x, y) => { const lx = x - x0; if (y > 23 && (lx === 0 || lx === 5)) return null; if (y === 25) return lx % 2 ? c3 : null; return lx === 0 ? c1 : lx === 5 ? c3 : ((y + lx) % 6 === 0 ? 'Y' : (y % 6 < 3 ? c2 : c1)); }); };
    roll(5, 'r', 'R', 'E'); roll(11, 'u', 'U', 'z'); roll(17, 'm', 'M', 'n');
    return gOutline(g); };
  // 등 기둥: 나무 기둥 + 쇠 갈고리 + 매단 등
  SR.lampPost = st => { const W = 12, H = 36, g = FG.mk(W, H);
    FG.rect(g, 2, 2, 3, H - 2, (x) => x === 2 ? 'o' : 'p'); FG.rect(g, 0, H - 2, 5, H - 1, (x, y) => y === H - 2 ? 'O' : 'P');
    FG.rect(g, 2, 2, 9, 2, 'J'); FG.rect(g, 8, 3, 8, 4, 'J');
    FG.rect(g, 6, 5, 10, 5, 'J'); FG.rect(g, 6, 6, 10, 10, (x, y) => x === 6 || x === 10 ? 'J' : y === 6 ? 'y' : 'Y'); FG.rect(g, 7, 11, 9, 11, 'J');
    return gOutline(g); };

  // ---- 모닥불 --------------------------------------------------------------
  // 돌 둘레(앞뒤 반쪽으로 나눠 불꽃이 사이에): 크기 제각각 돌 + 그을음
  SR.ringBack = st => { const W = 32, H = 10, g = FG.mk(W, H);
    for (let i = 0; i < 6; i++) { const a = Math.PI + (i + 0.5) / 6 * Math.PI, cx = 16 + Math.cos(a) * 12.5, cy = 7 + Math.sin(a) * 4.6, r = i % 3 === 1 ? 2.7 : 2.2; FG.ell(g, cx, cy, r + 0.9, r * 0.8 + 0.9, 'k'); FG.ell(g, cx, cy, r, r * 0.8, (dx, dy) => dx + dy < -0.8 ? '1' : dx + dy > 1 ? '3' : '2'); }
    return gOutline(g); };
  SR.ringFront = st => { const W = 34, H = 10, g = FG.mk(W, H);
    for (let i = 0; i < 6; i++) { const a = (i + 0.5) / 6 * Math.PI, cx = 17 + Math.cos(a) * 13.5, cy = 2.8 + Math.sin(a) * 4.8, r = i % 2 ? 2.9 : 2.4; FG.ell(g, cx, cy, r + 0.9, r * 0.8 + 0.9, 'k'); FG.ell(g, cx, cy, r, r * 0.8, (dx, dy) => dx + dy < -0.8 ? '1' : dx + dy > 1 ? '4' : '2'); FG.put(g, Math.round(cx - r * 0.4), Math.round(cy - r * 0.4), 'b'); }
    return gOutline(g); };
  // 통나무 의자: 나무껍질 결 · 잘린 단면 나이테 · 이끼(1)
  SR.log = st => { const W = 32, H = 10, g = FG.mk(W, H);
    FG.rect(g, 3, 1, W - 4, 8, (x, y) => y === 1 ? 'O' : y === 8 ? 'P' : (x * 3 + y * 7) % 11 === 0 ? 'P' : y < 4 ? (x % 5 === 0 ? 'p' : 'O') : 'p');
    for (const cx of [3, W - 4]) FG.ell(g, cx, 4.5, 2.6, 3.8, (dx, dy, q) => q > 0.7 ? 'O' : q > 0.35 ? 'h' : 'c');
    if (st === 1) for (const x of [10, 11, 12, 20, 21]) FG.put(g, x, 1, x % 2 ? 'm' : 'M');
    if (st === 3) { FG.ell(g, 16, 1.2, 4, 1.5, (dx) => dx < 0 ? 'h' : 'H'); } // 털가죽 깔개
    return gOutline(g); };
  // 털가죽 위 침낭 + 베개
  SR.bedroll = st => { const W = 34, H = 16, g = FG.mk(W, H);
    FG.ell(g, 17, 8, 16.5, 7.5, (dx, dy, q) => { if (q > 0.86 && ((Math.atan2(dy, dx) * 8 | 0) & 1)) return null; return q > 0.7 ? 'H' : (dx + dy * 2) < -6 ? 'h' : (dx * 3 + dy * 5) % 7 === 0 ? 'a' : 'h'; });
    FG.rect(g, 6, 4, 25, 11, (x, y) => y === 4 ? (st === 2 ? 'u' : 'e') : y === 11 ? (st === 2 ? 'z' : 'E') : x % 6 === 0 ? (st === 2 ? 'U' : 'R') : y < 7 ? (st === 2 ? 'u' : 'r') : (st === 2 ? 'U' : 'R'));
    FG.rect(g, 6, 4, 9, 11, (x, y) => y === 4 ? 'c' : x === 9 ? 'v' : 'C'); // 접힌 이불깃
    FG.ell(g, 28, 7.5, 3.5, 2.6, (dx, dy) => dx + dy < -0.5 ? 'c' : dx + dy > 1 ? 'v' : 'C'); // 베개
    return gOutline(g); };
  // 장작더미: 쪼갠 장작 단면 + 받침대
  SR.wood = st => { const W = 26, H = 18, g = FG.mk(W, H);
    FG.rect(g, 0, 15, W - 1, 17, (x, y) => y === 15 ? 'O' : 'P'); FG.rect(g, 1, 6, 1, 15, 'p'); FG.rect(g, W - 2, 6, W - 2, 15, 'p');
    for (let row = 0; row < 3; row++) for (let i = 0; i < 6 - row; i++) { const cx = 4 + i * 3.6 + row * 1.8, cy = 13 - row * 3.2; FG.ell(g, cx, cy, 1.9, 1.7, (dx, dy, q) => q > 0.55 ? (dx + dy < 0 ? 'O' : 'P') : q > 0.2 ? 'h' : 'c'); }
    FG.line(g, 12, 2, 22, 5, 'J'); FG.ell(g, 11, 2, 2, 1.4, (dx) => dx < 0 ? 'i' : 'I'); // 꽂힌 도끼
    return gOutline(g); };
  // 냄비 삼발이: 나무 막대 셋 + 사슬 + 검은 냄비(국)
  SR.tripod = st => { const W = 22, H = 26, g = FG.mk(W, H);
    FG.line(g, 11, 1, 2, 25, 'p'); FG.line(g, 11, 1, 20, 25, 'P'); FG.line(g, 11, 1, 12, 23, 'O');
    FG.rect(g, 11, 2, 11, 12, (x, y) => y % 2 ? 'j' : 'J');
    FG.ell(g, 11, 17, 5.5, 4, (dx, dy) => dy < -2.5 ? (dx < 0 ? 'f' : 'F') : dx + dy < -2 ? 's' : 'S'); FG.rect(g, 6, 13, 16, 13, 'j'); FG.put(g, 9, 13, 'h'); FG.put(g, 12, 13, 'm');
    return gOutline(g); };
  // 천막: 앞자락이 젖혀진 A자 천막 · 말뚝 · 끈. 1 생천 / 2 기사단 붉은 천 / 3 가죽(뼈 말뚝)
  SR.tent = st => { const W = 48, H = 36, g = FG.mk(W, H), L = st === 2 ? ['e', 'r', 'R', 'E'] : ['c', 'C', 'v', 'V'], cx = 24;
    for (let y = 2; y < H - 2; y++) { const hw = (y - 2) * 0.66; for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) { const dx = x - cx, side = dx < 0;
      let c = side ? (dx > -hw * 0.5 ? L[0] : L[1]) : (dx < hw * 0.5 ? L[2] : L[3]);
      if (((x + (st === 3 ? y >> 2 : 0)) % 6 === 0)) c = side ? L[1] : L[3]; // 솔기
      if (st === 3 && (x * 7 + y * 3) % 17 === 0) c = side ? 'a' : 'A'; // 가죽 얼룩
      FG.put(g, x, y, c); } }
    // 입구: 안쪽은 어둡고 젖힌 자락
    for (let y = 14; y < H - 2; y++) { const hw = (y - 14) * 0.45; for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) FG.put(g, x, y, y > H - 6 ? 'A' : 'D'); FG.put(g, Math.round(cx - hw) - 1, y, L[0]); FG.put(g, Math.round(cx + hw) + 1, y, L[2]); }
    if (st === 2) for (let y = 4; y < 12; y++) FG.put(g, cx, y, y % 2 ? 'Y' : 'g'); // 금실 솔기
    FG.rect(g, cx, 0, cx, 2, 'p'); FG.put(g, cx, 0, st === 3 ? 'b' : 'o'); // 꼭대기 장대
    if (st === 2) { FG.rect(g, cx + 1, 0, cx + 4, 1, (x, y) => y ? 'R' : 'e'); }
    // 끈 · 말뚝
    for (const s of [-1, 1]) { FG.line(g, cx + s * 10, 9, cx + s * 22, H - 3, 'V'); FG.rect(g, cx + s * 22, H - 4, cx + s * 22, H - 2, st === 3 ? 'B' : 'p'); }
    FG.rect(g, 0, H - 2, W - 1, H - 2, null);
    return gOutline(g); };
  // 배낭
  SR.pack = st => { const W = 14, H = 15, g = FG.mk(W, H);
    FG.rect(g, 2, 2, 11, 14, (x, y) => x === 2 ? 'h' : x === 11 || y === 14 ? 'a' : 'H');
    FG.rect(g, 2, 2, 11, 6, (x, y) => y === 2 ? 'h' : y === 6 ? 'a' : x === 2 ? 'h' : 'H'); FG.rect(g, 6, 6, 7, 8, 'G'); FG.put(g, 6, 7, 'Y');
    FG.rect(g, 3, 0, 10, 1, (x, y) => y === 0 ? 'C' : 'v'); FG.rect(g, 4, 9, 9, 12, (x, y) => y === 9 ? 'h' : 'H');
    FG.rect(g, 0, 8, 1, 13, (x) => x ? 'r' : 'R'); // 매단 담요
    return gOutline(g); };

  // ---- 보물 방 --------------------------------------------------------------
  // 키 큰 화로: 받침 · 기둥 · 넓은 그릇 (불꽃은 따로 움직임)
  SR.brazier = st => { const W = 16, H = 32, g = FG.mk(W, H), m = st === 2 ? ['y', 'Y', 'g', 'G'] : st === 3 ? ['I', 'j', 'J', 'S'] : ['1', '2', '3', '4'];
    FG.rect(g, 2, 28, 13, 31, (x, y) => y === 28 ? m[0] : x === 13 || y === 31 ? m[3] : m[1]);
    FG.rect(g, 4, 26, 11, 27, (x, y) => y === 26 ? m[0] : m[2]);
    FG.rect(g, 6, 10, 9, 25, (x, y) => x === 6 ? m[0] : x === 9 ? m[3] : y % 5 === 0 ? m[2] : m[1]);
    FG.rect(g, 4, 12, 11, 13, (x, y) => y === 12 ? m[0] : m[2]); FG.rect(g, 4, 20, 11, 21, (x, y) => y === 20 ? m[0] : m[2]);
    FG.rect(g, 0, 3, 15, 4, (x, y) => y === 3 ? m[0] : m[1]); FG.rect(g, 1, 5, 14, 7, (x, y) => x === 1 ? m[1] : x === 14 ? m[3] : y === 7 ? m[3] : m[2]); FG.rect(g, 3, 8, 12, 9, (x, y) => y === 8 ? m[2] : m[3]);
    if (st === 3) for (const x of [1, 5, 10, 14]) FG.put(g, x, 2, 'b');
    FG.rect(g, 2, 2, 13, 2, 'F'); FG.rect(g, 4, 1, 11, 1, 'f');
    return gOutline(g); };
  // 금화 더미: 동전 결 · 보석 · 금잔 · 왕관
  SR.gold = st => { const W = 30, H = 16, g = FG.mk(W, H);
    FG.ell(g, 15, 15, 14.5, 9.5, (dx, dy) => { if (dy > 0) return null; const h = (Math.round(dx) * 7 + Math.round(dy) * 13 + 40) % 9, v = dx * 0.6 + dy; return h === 0 ? 'y' : v < -6 ? 'Y' : v < -1 ? (h < 4 ? 'Y' : 'g') : (h < 3 ? 'g' : 'G'); });
    for (const [x, y, c] of [[9, 11, 'r'], [19, 9, 'u'], [23, 12, 'm'], [13, 8, 'q']]) { FG.put(g, x, y, c); FG.put(g, x, y - 1, 'w'); }
    // 금잔
    FG.rect(g, 4, 3, 8, 6, (x, y) => x === 4 ? 'y' : x === 8 ? 'G' : 'Y'); FG.rect(g, 6, 7, 6, 9, 'g'); FG.rect(g, 5, 10, 7, 10, 'G');
    // 왕관
    FG.rect(g, 20, 3, 26, 5, (x, y) => y === 5 ? 'G' : x === 20 ? 'y' : 'Y'); for (const x of [20, 23, 26]) FG.put(g, x, 2, 'Y'); FG.put(g, 23, 4, 'r');
    return gOutline(g); };
  // 수호 석상: 받침 위에 칼을 짚은 기사 (1 이끼 낀 돌 · 2 흰 대리석 · 3 나무 토템 우상)
  SR.statue = st => { const W = 22, H = 46, g = FG.mk(W, H), m = ['1', '2', '3', '4'];
    FG.rect(g, 1, 38, 20, 45, (x, y) => y === 38 ? m[0] : y === 45 || x === 20 ? m[3] : y === 41 ? m[3] : x === 1 ? m[1] : m[2]); // 받침
    FG.rect(g, 3, 36, 18, 37, (x, y) => y === 36 ? m[0] : m[2]);
    if (st === 3) { // 토템: 쌓인 얼굴 셋 + 날개
      for (const [y0, ey] of [[4, 'F'], [15, 'Y'], [26, 'F']]) { FG.rect(g, 5, y0, 16, y0 + 10, (x, y) => x === 5 ? 'o' : x === 16 ? 'p' : y === y0 ? 'o' : y === y0 + 10 ? 'P' : 'O');
        FG.rect(g, 7, y0 + 3, 8, y0 + 4, ey); FG.rect(g, 13, y0 + 3, 14, y0 + 4, ey); FG.rect(g, 8, y0 + 7, 13, y0 + 8, (x, y) => (x % 2) ? 'b' : 'k'); }
      FG.rect(g, 0, 15, 4, 17, (x, y) => y === 15 ? 'e' : 'r'); FG.rect(g, 17, 15, 21, 17, (x, y) => y === 15 ? 'e' : 'R'); FG.rect(g, 8, 0, 13, 3, (x, y) => y === 0 ? 'b' : 'B');
      return gOutline(g); }
    // 망토 (뒤, 아래로 넓어짐)
    for (let y = 12; y <= 35; y++) { const hw = 6 + (y - 12) * 0.16; for (let x = Math.ceil(11 - hw); x <= Math.floor(11 + hw); x++) FG.put(g, x, y, x - 11 < -hw + 1.5 ? m[1] : x - 11 > hw - 2 ? m[3] : m[2]); }
    for (let y = 20; y <= 35; y += 1) { FG.put(g, 6, y, m[3]); FG.put(g, 16, y, m[3]); } // 망토 주름
    // 몸통 (갑옷) · 허리띠 · 다리
    FG.rect(g, 8, 12, 14, 24, (x, y) => x === 8 ? m[0] : x === 14 ? m[2] : y === 21 ? m[3] : (y === 13 && x < 12) ? m[0] : m[1]);
    FG.rect(g, 8, 25, 10, 35, (x) => x === 8 ? m[0] : m[1]); FG.rect(g, 12, 25, 14, 35, (x) => x === 14 ? m[3] : m[2]);
    // 어깨받이
    FG.ell(g, 7, 12.5, 2.6, 2, (dx, dy) => dx + dy < -0.5 ? m[0] : m[1]); FG.ell(g, 15, 12.5, 2.6, 2, (dx, dy) => dx + dy < -0.5 ? m[1] : m[3]);
    // 투구 + 깃털장식 + 눈구멍
    FG.ell(g, 11, 7, 3.6, 4, (dx, dy) => dx + dy < -1.5 ? m[0] : dx + dy > 2 ? m[3] : m[1]); FG.rect(g, 9, 7, 13, 7, m[3]); FG.put(g, 11, 8, m[3]); FG.rect(g, 10, 10, 12, 11, m[2]);
    FG.rect(g, 10, 1, 11, 3, (x) => x === 10 ? m[0] : m[1]); FG.rect(g, 12, 0, 14, 2, (x, y) => y === 0 ? m[1] : m[2]); FG.put(g, 15, 2, m[2]);
    // 짚은 칼: 손잡이 · 가로날 · 칼날 (밝은 면 + 어두운 날선)
    FG.rect(g, 11, 14, 11, 16, m[3]); FG.put(g, 11, 13, m[0]);
    FG.rect(g, 9, 17, 13, 18, (x, y) => y === 17 ? m[0] : m[2]); FG.rect(g, 7, 18, 15, 18, (x) => x === 7 ? m[0] : x === 15 ? m[3] : m[2]);
    FG.rect(g, 10, 19, 12, 36, (x, y) => x === 10 ? m[0] : x === 12 ? m[3] : y > 33 ? m[2] : m[1]);
    if (st === 1) for (const [x, y] of [[5, 11], [6, 11], [7, 12], [16, 30], [17, 31], [5, 38], [6, 38], [7, 39], [14, 38], [3, 44], [18, 40], [11, 4]]) FG.put(g, x, y, (x + y) % 2 ? 'm' : 'M'); // 이끼
    if (st === 2) { FG.put(g, 11, 22, 'Y'); FG.put(g, 11, 23, 'g'); FG.rect(g, 3, 41, 18, 41, 'g'); } // 금 장식
    return gOutline(g); };
  // 걸개 깃발 (보물 방·상인): 장대 + 천 + 문장
  SR.banner = st => { const W = 16, H = 40, g = FG.mk(W, H), L = st === 3 ? ['h', 'H', 'a', 'A'] : st === 2 ? ['u', 'U', 'z', 'D'] : ['m', 'M', 'n', 'N'];
    FG.rect(g, 0, 0, 15, 1, (x, y) => y === 0 ? 'o' : 'p');
    FG.rect(g, 2, 2, 13, 30, (x, y) => x === 2 ? L[0] : x === 13 ? L[3] : x === 3 || x === 12 ? 'g' : y === 3 ? 'g' : (x % 4 === 0 ? L[2] : L[1]));
    for (let x = 2; x <= 13; x++) { const d = Math.abs(x - 7.5); for (let y = 31; y < 31 + Math.max(0, 6 - d * 0.9); y++) FG.put(g, x, y, x < 7 ? L[1] : L[2]); }
    // 문장: 왕관(1·2) / 해골(3)
    if (st === 3) { FG.ell(g, 7.5, 14, 3, 3, (dx, dy) => dy > 1.5 ? 'B' : 'b'); FG.put(g, 6, 14, 'k'); FG.put(g, 9, 14, 'k'); FG.rect(g, 6, 17, 9, 18, (x) => x % 2 ? 'b' : 'k'); }
    else { FG.rect(g, 4, 13, 11, 16, (x, y) => y === 16 ? 'G' : x === 4 ? 'y' : 'Y'); for (const x of [4, 7, 8, 11]) FG.put(g, x, 12, 'Y'); FG.put(g, 7, 15, 'r'); FG.put(g, 8, 15, 'r'); }
    return gOutline(g); };

  // ---- 비밀 방 --------------------------------------------------------------
  // 대리석 제단: 윗판(상자가 놓이는 면) · 금테 두른 몸체 · 보랏빛 룬 판 · 계단 받침, 대리석 결
  SR.altar = st => { const W = 46, H = 18, g = FG.mk(W, H), vein = (x, y) => ((x * 5 + y * 9) % 17 === 0 || (x * 3 - y * 7 + 99) % 23 === 0);
    FG.rect(g, 0, 13, W - 1, 17, (x, y) => y === 13 ? 'l' : y === 17 ? 'T' : x === W - 1 ? 't' : x === 0 ? 'l' : vein(x, y) ? 't' : 'L'); // 받침 계단
    FG.rect(g, 4, 5, W - 5, 12, (x, y) => x === 4 ? 'l' : x === W - 5 ? 'T' : y === 5 ? 'g' : y === 12 ? 't' : vein(x, y) ? 't' : 'L'); // 몸체
    FG.rect(g, 15, 7, W - 16, 11, (x, y) => x === 15 || y === 7 ? 'T' : x === W - 16 || y === 11 ? 'l' : 'z'); // 룬 판
    for (const [x, y] of [[19, 9], [22, 8], [23, 10], [26, 9], [29, 8], [30, 10]]) FG.put(g, x, y, 'q'); FG.put(g, 23, 9, 'w');
    FG.rect(g, 2, 0, W - 3, 4, (x, y) => y === 0 ? 'l' : y === 4 ? 'T' : x === 2 ? 'l' : x === W - 3 ? 't' : y === 3 ? 't' : vein(x, y) ? 't' : (y === 1 ? 'l' : 'L')); // 윗판
    for (const x of [6, W - 7]) FG.rect(g, x, 6, x + 1, 12, (xx) => xx === x ? 'Y' : 'G'); // 금 기둥 장식
    return gOutline(g); };
  // 부서진 책장: 기운 선반 · 낡은 책 · 쏟아진 종이 · 거미줄
  SR.shelf = st => { const W = 28, H = 34, g = FG.mk(W, H);
    FG.rect(g, 0, 0, W - 1, H - 1, (x, y) => x <= 1 ? (x ? 'O' : 'o') : x >= W - 2 ? (x === W - 1 ? 'P' : 'p') : y <= 1 ? (y ? 'O' : 'o') : y >= H - 2 ? 'P' : 'A');
    for (const sy of [11, 22]) FG.rect(g, 2, sy, W - 3, sy + 1, (x, y) => y === sy ? 'o' : 'P');
    const books = (y0, list) => { let x = 2; for (const [w, h, c1, c2, tilt] of list) { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) FG.put(g, x + i + (tilt && j < 2 ? 1 : 0), y0 - j, i === 0 ? c1 : i === w - 1 ? c2 : (j === h - 2 ? 'Y' : c1)); x += w; } };
    books(10, [[2, 7, 'r', 'R'], [2, 6, 'U', 'z'], [3, 8, 'M', 'n'], [2, 5, 'h', 'a'], [2, 7, 'q', 'Q'], [0, 0], [2, 4, 'C', 'v', 1]]);
    books(21, [[2, 8, 'R', 'E'], [2, 6, 'm', 'M'], [3, 7, 'u', 'U'], [2, 8, 'r', 'R']]);
    FG.ell(g, 20, 19, 2.6, 2.4, (dx, dy) => dx + dy < -1 ? 'b' : 'B'); FG.put(g, 19, 19, 'k'); FG.put(g, 21, 19, 'k'); // 해골
    FG.rect(g, 4, 28, 11, 31, (x, y) => y === 28 ? 'c' : 'C'); FG.rect(g, 14, 30, 22, 31, (x) => x % 2 ? 'v' : 'C'); // 바닥 칸 종이 뭉치
    // 거미줄 (오른쪽 위)
    for (let i = 0; i < 7; i++) { FG.put(g, W - 3 - i, 2, i % 2 ? 'B' : null); FG.put(g, W - 3, 2 + i, i % 2 ? 'B' : null); FG.put(g, W - 3 - Math.round(i * 0.7), 2 + Math.round(i * 0.7), 'b'); }
    FG.put(g, 6, 0, '.'); FG.put(g, 7, 0, '.'); FG.put(g, 8, 1, 'P'); // 깨진 윗판
    return gOutline(g); };
  // 벽에 기대 앉은 해골: 투구 · 녹슨 칼 · 늑골
  SR.skeleton = st => { const W = 26, H = 20, g = FG.mk(W, H);
    FG.ell(g, 6, 5, 3.6, 3.4, (dx, dy) => dx + dy < -1 ? 'b' : dx + dy > 1.5 ? 'x' : 'B'); FG.put(g, 5, 5, 'k'); FG.put(g, 7, 5, 'k'); FG.rect(g, 5, 8, 7, 8, (x) => x % 2 ? 'b' : 'k');
    FG.ell(g, 6, 2.5, 4, 2, (dx, dy) => dy < 0 ? 'j' : 'J'); // 녹슨 투구
    FG.rect(g, 6, 9, 6, 16, 'B'); for (let y = 10; y <= 15; y += 2) FG.rect(g, 3, y, 9, y, (x) => x === 6 ? 'B' : x < 6 ? 'b' : 'x');
    FG.line(g, 8, 10, 13, 15, 'B'); FG.line(g, 4, 10, 2, 16, 'x'); // 팔
    FG.line(g, 6, 16, 16, 18, 'B'); FG.line(g, 6, 17, 13, 19, 'x'); FG.rect(g, 16, 17, 18, 18, 'b'); // 다리
    FG.line(g, 12, 13, 24, 10, 'j'); FG.line(g, 12, 14, 24, 11, 'J'); FG.rect(g, 11, 12, 11, 15, 'G'); FG.put(g, 20, 11, 'p'); FG.put(g, 22, 10, 'p'); // 녹슨 칼
    return gOutline(g); };
  // 촛대 무더기 (불꽃은 따로)
  SR.candles = st => { const W = 14, H = 12, g = FG.mk(W, H);
    for (const [x, h] of [[2, 7], [6, 10], [10, 5]]) { FG.rect(g, x, H - 1 - h, x + 1, H - 2, (xx, y) => xx === x ? 'c' : 'C'); FG.put(g, x, H - 1 - h - 1, 'D'); }
    FG.rect(g, 0, H - 1, W - 1, H - 1, 'C'); FG.put(g, 4, H - 2, 'c'); FG.put(g, 9, H - 2, 'c'); // 흘러내린 촛농
    return gOutline(g); };
  // ---- 배치: 큰 물건은 뒷벽을 따라 (가운데 북문 자리는 비움), 가운데는 그 방의 쓰임새, 아래 모서리엔 잡동사니
  // [종류, dx, dy, 막힘(반지름 또는 [가로, 세로]), 벽에 붙음]
  const SR_LAYOUT = {
    shop: st => [['stall', -100, -36, [134, 14]], ['counter', -100, -20, [100, 8]], ['rugRack', 62, -54, 14], ['crates', 124, -50, 18], ['fbarrel', 170, -40, 9], ['lampPost', 30, -40, 5],
      ['sacks', 188, 98, 16], ['crates', -196, 100, 18], ['banner', 212, -78, 0, 1], ['banner', -212, -78, 0, 1], ['fbarrel', -150, 104, 9]],
    rest: st => [['tent', -128, -42, [72, 14]], ['pack', -66, -40, 7], ['wood', 120, -54, 18], ['log', -66, 18, [52, 8]], ['log', 66, 18, [52, 8]], ['wood', 180, 98, 18], ...(st === 2 ? [['banner', 0, -112, 0, 1]] : [])],
    reward: st => [['statue', -118, -74, 14], ['statue', 118, -74, 14], ['brazier', -64, -36, 9], ['brazier', 64, -36, 9], ['gold', -96, 34, 18], ['gold', 96, 34, 18],
      ['banner', -196, -86, 0, 1], ['banner', 196, -86, 0, 1], ['brazier', -190, 90, 9], ['brazier', 190, 90, 9]],
    secret: st => [['altar', 0, -11, [92, 14]]], // v1.11 대리석 제단 위 상자 하나만
  };
  const SR_TELE = { shop: [-188, 54], rest: [150, 70], reward: [-150, 66] };
  const SR_FIRE = { dx: 0, dy: 10 };
  function srPlace(r, stage) {
    r.props = []; r.srp = [];
    const keep = [...Object.keys(r.doors).filter(d => r.doors[d] != null).map(d => doorIn(d, 40)), ...(r.crack ? [doorIn(r.crack.dir, 40)] : []), ...(r.tele ? [r.tele] : [])];
    const fits = (x, y, rad) => x > A.x0 + 6 && x < A.x1 - 6 && y > A.y0 - 4 && y < A.y1 - 4 && !keep.some(q => Math.hypot(q.x - x, q.y - y) < rad + 30);
    for (const [k, dx, dy, blk, wall] of SR_LAYOUT[r.type](stage)) {
      if (k === 'banner' && stage === 1) continue; // 숲엔 걸 벽이 없음
      const rad = Array.isArray(blk) ? blk[0] / 2 : blk || 10;
      let x = CX + dx, y = CY + dy; if (k !== 'altar' && !fits(x, y, rad)) { x = CX - dx; if (!fits(x, y, rad)) continue; }
      if (k !== 'counter' && r.srp.some(s => s.k !== 'counter' && s.k !== 'stall' && Math.hypot(s.x - x, s.y - y) < 20)) continue;
      const s = { k, x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2, flip: x < CX && (k === 'skeleton') };
      r.srp.push(s);
      if (wall || !blk) continue;
      if (Array.isArray(blk)) { const [w, h] = blk; r.obs.push({ t: 'prop', c: false, x: s.x, y: s.y - h / 2, w, h, x0: s.x - w / 2, y0: s.y - h, x1: s.x + w / 2, y1: s.y }); }
      else r.obs.push({ t: 'prop', c: true, x: s.x, y: s.y - 2, r: blk });
    }
    // 상인: 노점 계산대 뒤에 앉음
    const st0 = r.srp.find(s => s.k === 'stall'); if (st0) r.keeper = { x: st0.x, y: st0.y + 6 };
    const al = r.srp.find(s => s.k === 'altar'); if (al && r.chest) { al.foot = r.chest.y + 8 - al.y; r.chest.lift = 22; } // 제단은 상자보다 먼저 그림
    r.nav = buildNav(r.obs);
  }
  const SR_FOOT = { stall: 2, counter: 2, tent: 2, statue: 2 };
  function drawSR(s) {
    const st = G.stage, k = s.k;
    const c = k === 'fbarrel' ? forgeArt('barrel', FORGE_DECO.barrel) : srArt(k, st, SR[k]);
    const x = (s.x - c.width / 2) & ~1, y = (s.y + (s.foot || 0) - c.height + 2) & ~1;
    if (k !== 'banner') { ctx.fillStyle = 'rgba(0,0,0,.3)'; { const xa = x + 4, xb = x + c.width - 4; if (xb > xa) ctx.fillRect(xa, s.y + (s.foot || 0), Math.ceil((xb - xa) / 2) * 2, 2); } }
    if (s.flip) { ctx.save(); ctx.translate(x + c.width, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0); ctx.restore(); } else ctx.drawImage(c, x, y);
    const fl = Math.floor(time * 10 + s.x * 0.37);
    if (k === 'brazier') { // 그릇 위 불꽃: 칸 단위로 일렁임
      const ph = ((fl % 4) + 4) % 4; let fc = SR_FLAME[ph]; // v1.17 불꽃 4장면을 미리 그려 둠
      if (!fc) { const [c2, g2] = mkCanvas(24, 20); for (let i = 0; i < 6; i++) { const h = 3 + ((ph + i * 3) % 4) + (i === 2 || i === 3 ? 3 : 0); for (let j = 0; j < h; j++) { g2.fillStyle = j < 2 ? '#ff6a2a' : j < h - 2 ? '#ffb040' : '#fff3c0'; g2.fillRect(i * 4, 16 - j * 2, 4, 2); } } fc = SR_FLAME[ph] = c2; }
      ctx.drawImage(fc, x + 6, y - 14);
      if (Math.random() < 0.25) G.parts.push({ x: s.x + rand(-6, 6), y: y - 6, vx: rand(-6, 6), vy: -rand(20, 45), t: rand(0.4, 0.8), c: pick(['#ffb040', '#ff6a2a']), g: 0, glow: true });
    }
    if (k === 'candles') for (const [cx, h] of [[2, 7], [6, 10], [10, 5]]) { const f = (fl + cx) % 3; ctx.fillStyle = '#ff8a2a'; ctx.fillRect(x + 2 + cx * 2, y + (12 - 1 - h - 2) * 2 + 2, 2, 2); ctx.fillStyle = '#fff3c0'; ctx.fillRect(x + 2 + cx * 2 + (f === 1 ? 2 : 0), y + (12 - 1 - h - 2) * 2 - (f === 2 ? 2 : 0), 2, 2); }
  }
  const SR_FLAME = [];
  const SR_LIGHT = { brazier: [-40, 92, '255,150,60', 0.2], candles: [-12, 64, '255,190,110', 0.14], lampPost: [-58, 70, '255,200,120', 0.14], stall: [-70, 90, '255,200,120', 0.12] };
  function srLights(lights, R) { if (R.srp) for (const s of R.srp) { const L = SR_LIGHT[s.k]; if (L) lights.push({ x: s.x + (s.k === 'lampPost' ? 14 : s.k === 'stall' ? -56 : 0), y: s.y + L[0], r: L[1] + Math.sin(time * 9 + s.x) * 3, a: 0.75, c: L[2], ca: L[3] }); } }
  // ---- 바닥 그림 (2px 칸, 디더)
  function srFloor(g, R) {
    const st = G.stage, P = srPal(st), px = (x, y, c) => { g.fillStyle = c; g.fillRect(x & ~1, y & ~1, 2, 2); };
    const blot = (cx, cy, rx, ry, lv, col) => { for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) { const q = Math.hypot(x / rx, y / ry); if (q < 1 && dith((cx + x) >> 1, (cy + y) >> 1, lv * (1 - q))) px(cx + x, cy + y, col); } };
    if (R.type === 'shop') { // 물건 아래 짠 깔개: 테두리 띠 · 마름모 줄무늬 · 양끝 술
      const W0 = 160, H0 = 22, x0 = (CX - W0) & ~1, y0 = (CY + 28) & ~1, C = st === 2 ? ['#1e2a44', '#34406a', '#4a5c94', '#b8863a', '#d8c09a'] : st === 3 ? ['#2e1c10', '#5a3418', '#7a4a22', '#c08a3a', '#e0c08a'] : ['#2a1610', '#5a2a1a', '#7e3a22', '#c09040', '#e8d0a0'];
      for (let j = 0; j < H0; j++) for (let i = 0; i < W0; i++) { const e = Math.min(i, W0 - 1 - i, j, H0 - 1 - j); let c = e === 0 ? C[0] : e === 1 ? C[3] : e === 2 ? C[1] : ((i + j) % 8 < 1 || (i - j + 400) % 8 < 1) ? C[2] : (j === H0 >> 1 && i % 4 < 2) ? C[4] : C[1]; if (e > 2 && Math.random() < 0.04) c = C[0]; px(x0 + i * 2, y0 + j * 2, c); }
      for (let j = 1; j < H0 - 1; j += 2) { px(x0 - 2, y0 + j * 2, C[4]); px(x0 + W0 * 2, y0 + j * 2, C[4]); }
      blot(CX - 100, CY - 28, 90, 26, 0.5, 'rgba(0,0,0,.35)'); // 노점 아래 그늘
    }
    if (R.type === 'rest') { const f = { x: CX + SR_FIRE.dx, y: CY + SR_FIRE.dy };
      blot(f.x, f.y, 120, 56, 0.55, st === 1 ? '#3e3020' : 'rgba(30,22,16,.6)'); blot(f.x, f.y, 52, 22, 0.8, '#2a2622'); blot(f.x, f.y, 34, 14, 0.9, '#55504a');
      for (let i = 0; i < 26; i++) { const a = rand(0, TAU), d = rand(26, 90); px(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d * 0.45, pick(['#6a5a48', '#3a2a1c', '#8a7a64'])); }
      for (let i = 0; i < 6; i++) { const x = f.x + rand(-100, 100), y = f.y + rand(-40, 40); if (Math.hypot(x - f.x, (y - f.y) * 2) < 60) continue; for (let k = 0; k < 4; k++) px(x + k * 2, y + (k > 1 ? 2 : 0), '#4a3020'); } // 잔가지
    }
    if (R.type === 'reward') { // 단: 계단 테두리 · 판석 · 금 상감 고리 · 룬
      const cx = CX, cy = CY - 14, RX = 100, RY = 46, S = [P['1'], P['2'], P['3'], P['4']];
      for (let y = -RY - 2; y <= RY + 8; y += 2) for (let x = -RX - 2; x <= RX + 2; x += 2) {
        const q = Math.hypot(x / RX, y / RY), qs = Math.hypot(x / RX, (y - 6) / RY);
        if (q > 1 && qs <= 1) { px(cx + x, cy + y, y > 0 ? S[3] : S[2]); continue; } // 앞 계단 옆면
        if (q > 1) { if (q < 1.06) px(cx + x, cy + y, '#0b0a0e'); continue; }
        const ang = Math.atan2(y / RY, x / RX), ring = q * 5 | 0, seg = ((ang + Math.PI) / TAU * (8 + ring * 4)) | 0;
        let c = (seg + ring) % 2 ? S[1] : S[2];
        if (Math.abs(q - 0.62) < 0.035 || Math.abs(q - 0.93) < 0.03) c = Math.abs(q - 0.62) < 0.035 ? '#e0a030' : S[3];
        if (q < 0.25) c = (x + y) % 4 ? S[0] : S[1];
        if (q > 0.7 && q < 0.88 && seg % 3 === 0 && Math.abs((q - 0.79)) < 0.04) c = '#ffd060'; // 룬 점
        if ((x * 3 + y * 7) % 37 === 0) c = S[3]; // 금
        if (x * 0.7 + y < -RY * 0.6 && q > 0.9) c = S[0]; // 윗 테 빛
        px(cx + x, cy + y, c);
      }
    }
    if (R.type === 'secret') blot(CX, CY - 4, 70, 18, 0.6, 'rgba(0,0,0,.35)'); // v1.11 제단 그늘만
  }
  // 방 종류·챕터별 배치표: [소품, x, y] — 큰 장면 하나가 아니라 이야기가 있는 자리 배치
  function specialLayout(r, stage) {
    const L = [], P = (n, x, y) => L.push([n, x, y]);
    if (r.type === 'shop') { // 떠돌이 상인이 대충 펼친 노점
      const t = stage === 1 ? 'M' : stage === 2 ? 'C' : 'O';
      P('tarp' + t, CX - 4, CY - 30); P('crateP', CX - 44, CY - 30); P('crateP', CX - 40, CY - 46); P('barrelP', CX + 46, CY - 32); P('sackP', CX + 60, CY - 26); P('basket' + t, CX + 30, CY - 24);
      P('cartP', CX + 120, CY - 34); P('lampPole', CX - 82, CY - 24);
      if (stage === 1) { P('signpost', CX - 140, CY - 40); P('sackP', CX + 150, CY + 4); }
      if (stage === 2) { P('ruinPillar', CX - 150, CY - 46); P('banner', CX + 160, CY + 6); P('candelabra', CX - 118, CY + 2); }
      if (stage === 3) { P('skullPike', CX - 150, CY - 40); P('hideRack', CX + 160, CY + 4); P('boneHeap', CX - 120, CY + 6); }
    }
    if (r.type === 'reward') { const cx = CX, cy = CY - 20;
      if (stage === 1) { for (const [i, a] of [-160, -122, -90, -58, -20, 160].entries()) { const q = a * DEG; P('menhir' + (i % 2), cx + Math.cos(q) * 118, cy + Math.sin(q) * 66); } P('ruinPillar', cx - 150, cy + 50); P('basketM', cx + 140, cy + 44); }
      if (stage === 2) { for (const [dx, dy] of [[-56, -26], [56, -26], [-72, 30], [72, 30]]) P('goldBrazier', cx + dx, cy + dy); P('armor', cx - 112, cy - 34); P('armor', cx + 112, cy - 34); P('banner', cx - 150, cy - 2); P('banner', cx + 156, cy - 2); P('ruinPillar', cx - 168, cy + 56); P('candelabra', cx + 160, cy + 58); }
      if (stage === 3) { P('weaponPile', cx - 104, cy - 22); P('weaponPile', cx + 104, cy - 22); for (const [dx, dy] of [[-150, -40], [150, -40], [-40, -70], [40, -70]]) P('skullPike', cx + dx, cy + dy); P('boneHeap', cx - 66, cy + 44); P('boneHeap', cx + 70, cy + 46); P('orcFire', cx - 140, cy + 30); P('orcFire', cx + 140, cy + 30); }
    }
    if (r.type === 'rest') { const bx = CX + 40, by = CY - 10;
      P('logSeat', bx, by - 22); P('logSeat', bx, by + 30);
      if (stage === 1) { P('campTent', bx - 94, by - 44); P('bedRoll', bx + 70, by + 8); P('firewood', bx + 70, by - 30); P('clothesline', bx + 150, by - 48); P('lampPole', bx - 44, by - 56); P('basketM', bx - 36, by + 44); }
      if (stage === 2) { P('pew', bx - 116, by - 46); P('pew', bx - 116, by - 14); P('candelabra', bx - 160, by - 70); P('candelabra', bx + 112, by - 64); P('candelabra', bx + 132, by + 44); P('ruinPillar', bx + 160, by - 30); P('bedRoll', bx + 70, by + 8); P('firewood', bx + 66, by - 32); P('bookshelf', bx - 30, by - 74); }
      if (stage === 3) { P('hideTent', bx - 96, by - 42); P('meatRack', bx + 82, by - 30); P('skullPike', bx - 40, by - 70); P('skullPike', bx + 134, by - 58); P('boneHeap', bx + 88, by + 34); P('woodPile', bx - 70, by + 40); P('hideRack', bx + 150, by + 10); }
    }
    return L;
  }
  function placeSpecial(r, stage) { // 배치표를 문·텔레포터와 겹치지 않는 것만 강제로 놓는다
    ensureSpecialProps();
    const keep = [...Object.keys(r.doors).filter(d => r.doors[d] != null).map(d => doorIn(d, 40)), ...(r.tele ? [r.tele] : []), ...(r.shop || []).map(s => ({ x: s.x, y: s.y }))];
    for (const [name, x, y] of specialLayout(r, stage)) {
      const sp = PROPS[name]; if (!sp) continue; const rad = sp.r || (sp.w ? sp.w / 2 : 8);
      if (x < A.x0 + 12 || x > A.x1 - 12 || y < A.y0 + 10 || y > A.y1 - 6) continue;
      if (keep.some(q => Math.hypot(q.x - x, q.y - y) < rad + 30)) continue;
      r.props.push({ name, x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2, rad, special: true });
    }
  }
  // ================================================================ v1.10 NPC 말주머니 · 가격표
  // 말주머니: 밝은 바탕 + 검은 외곽선 + 아래 꼬리 (2px 칸). 가까이 오면 한 번 인사, 머무는 동안은 9~13초마다 한 줄, 3.2초 보임. 같은 줄 연달아 안 나옴
  const NPC_TALK = {};
  function npcTalk(key, near, lines, greet) {
    const s = NPC_TALK[key] || (NPC_TALK[key] = { line: null, until: 0, next: 0, near: false });
    if (near && !s.near && time >= s.next - 7) { s.line = greet ? pick(greet) : pick(lines); s.until = time + 3.2; s.next = time + rand(9, 13); }
    else if (near && time >= s.next) { let l = pick(lines); if (l === s.line && lines.length > 1) l = pick(lines.filter(x => x !== s.line)); s.line = l; s.until = time + 3.2; s.next = time + rand(9, 13); }
    s.near = near;
    return time < s.until ? s : null;
  }
  const BUBBLES = [];
  function drawBubble(text, x, y, side = 0) { BUBBLES.push([text, x, y, side]); }
  function flushBubbles() { for (const b of BUBBLES) paintBubble(b[0], b[1], b[2], b[3]); BUBBLES.length = 0; }
  function paintBubble(text, x, y, side) { // (x, y) = 꼬리 끝. side 0: 몸통이 위, 꼬리 아래로 / side -1: 몸통이 왼쪽, 꼬리 오른쪽으로
    ctx.font = '10px Galmuri9'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const tw = Math.ceil(ctx.measureText(text).width), w = (tw + 14) & ~1, h = 16, X = Math.round(x) & ~1, Y = Math.round(y) & ~1;
    const bx = side < 0 ? X - 6 - w : (X - (w >> 1)) & ~1, by = side < 0 ? Y - 8 : Y - h - 6;
    ctx.fillStyle = '#0b0a0e'; ctx.fillRect(bx + 2, by - 2, w - 4, h + 4); ctx.fillRect(bx, by, w, h); ctx.fillRect(bx - 2, by + 2, w + 4, h - 4); // 외곽선(모서리 깎음)
    ctx.fillStyle = '#f4ead2'; ctx.fillRect(bx + 2, by, w - 4, h); ctx.fillRect(bx, by + 2, w, h - 4);
    ctx.fillStyle = '#d8c8a4'; ctx.fillRect(bx + 2, by + h - 2, w - 4, 2); // 아래 그늘
    if (side < 0) { // 오른쪽 꼬리
      const ty = by + 4; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(bx + w, ty - 2, 2, 8); ctx.fillRect(bx + w + 2, ty, 2, 4); ctx.fillRect(bx + w + 4, ty + 2, 2, 2);
      ctx.fillStyle = '#f4ead2'; ctx.fillRect(bx + w - 2, ty, 4, 4);
    } else {
      const tx = X - 2; ctx.fillStyle = '#0b0a0e'; ctx.fillRect(tx - 2, by + h, 8, 2); ctx.fillRect(tx, by + h + 2, 4, 2); ctx.fillRect(tx + 2, by + h + 4, 2, 2);
      ctx.fillStyle = '#d8c8a4'; ctx.fillRect(tx, by + h, 4, 2); ctx.fillStyle = '#f4ead2'; ctx.fillRect(tx, by + h - 2, 4, 2);
    }
    ctx.fillStyle = '#2a1e18'; fillTextW(text, bx + w / 2, by + 12);
  }
  function drawPriceTag(price, x, y, ok) { // 동전 + 가격, 어두운 판 (y = 판 위쪽)
    ctx.font = '10px Galmuri9'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const t = String(price), tw = Math.ceil(ctx.measureText(t).width), w = (tw + 20) & ~1, h = 14, bx = (Math.round(x) - (w >> 1)) & ~1, by = Math.round(y) & ~1;
    ctx.fillStyle = '#0b0a0e'; ctx.fillRect(bx, by - 2, w, h + 4); ctx.fillRect(bx - 2, by, w + 4, h);
    ctx.fillStyle = ok ? '#2a2018' : '#2a1416'; ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = ok ? '#4a3a26' : '#4a2226'; ctx.fillRect(bx, by, w, 2);
    const cx = bx + 4, cy = by + 3; // 동전 8x8
    ctx.fillStyle = ok ? '#8a5a10' : '#5a4040'; ctx.fillRect(cx + 2, cy, 4, 8); ctx.fillRect(cx, cy + 2, 8, 4);
    ctx.fillStyle = ok ? '#ffd34d' : '#9a7a7a'; ctx.fillRect(cx + 2, cy, 4, 6); ctx.fillRect(cx, cy + 2, 6, 2);
    ctx.fillStyle = ok ? '#fff0b0' : '#c0a8a8'; ctx.fillRect(cx + 2, cy + 2, 2, 2);
    ctx.fillStyle = ok ? '#ffe08a' : '#ff7a6a'; fillTextW(t, bx + 15, by + 11);
  }
  // 떠돌이 상인: 상자에 걸터앉아 있다
  function drawShopKeeper(R) {
    const x = ((R.keeper ? R.keeper.x : CX) + 2) & ~1, y = ((R.keeper ? R.keeper.y - 8 : CY - 30)) & ~1, bob = Math.floor(time * 1.5) % 2 ? 2 : 0, m = art('merch', () => gCanvas(MERCHANT, MERCHANT_PAL));
    ctx.drawImage(m, x - m.width / 2, y - m.height + 2 - bob); // v1.11 계산대 뒤에 서 있음 (아랫몸은 계산대에 가려짐)
    const P = G.player, sy = npcTalk('merchant', P && Math.hypot(P.x - x, P.y - y) < 120, ['싸게 줄게', '흐흐… 골라 봐', '이건 귀한 물건이야', '외상은 안 돼', '살아남으려면 사 둬'], ['어서 와', '손님이군, 흐흐']);
    if (sy) drawBubble(sy.line, x + 2, y - m.height - 2 - bob);
  }
  function drawShopItem(s) {
    const x = Math.round(s.x) & ~1, y = Math.round(s.y) & ~1, st = srArt('stand', G.stage, SR.stand); // v1.11 천 덮인 진열대
    ctx.fillStyle = 'rgba(0,0,0,.3)'; { const xa = x - st.width / 2 + 4, xb = x + st.width / 2 - 4; if (xb > xa) ctx.fillRect(xa, y + 2, Math.ceil((xb - xa) / 2) * 2, 2); }
    ctx.drawImage(st, x - st.width / 2, y - st.height + 4);
    if (s.sold) return;
    const by = (y - st.height + 8 + (Math.floor(time * 2 + x) % 2 ? 0 : -2)) & ~1;
    if (s.k === 'gear') { const g = art('gearbox', () => gCanvas(GEARBOX, GEARBOX_PAL)); ctx.drawImage(g, x - g.width / 2, by - g.height + 4); }
    else if (s.k === 'iron') { const g = art('ironore', () => gCanvas(IRONORE, IRONORE_PAL)); ctx.drawImage(g, x - g.width / 2, by - g.height + 4); }
    else { const L = LOOT[s.k]; drawSprite(L.map, 'loot', L.sc, x, by + 4, false); }
    drawPriceTag(s.price, x, y + 8, G.gold >= s.price); // v1.10 가격표
  }
  const PROP_MAPS = {
    goblinStatue: [["..kk..........kk..", "..kGk...kkkk...kdk", "..kGgk.kGGgdk.kddk", "...kggkGGgggdkddk.", "....kggGgggggddk..", "....kgGkkggkkddk..", "....kggrkggrkddk..", ".....kgggggdddk...", ".....kgkWkWkWdk...", "....kkggkkkkddkk..", "...kGGgggggggddDk.", "..kGGgkgggggdkdDDk", "..kGgk.kgggddk.kDk", "..kGgk.kgggddk.kDk", "...kk.kgggggddk.k.", ".....kGgk..kgddk..", ".....kGgk..kgddk..", "....kGggk..kgdddk.", "..kkkkkkkkkkkkkkkk", "..kGGGgggggggggddk", "..kgggdddddddddDDk", "..kdmDDDDDDDDmDDDk", "..kkkkkkkkkkkkkkkk"], {"k": "#0b0a0e", "G": "#9a94a4", "g": "#726c7e", "d": "#4e4958", "D": "#322e3a", "r": "#c03030", "W": "#c8c0d0", "m": "#3e5a2a", "M": "#5a7a38"}],
    armor: [[".....kk.....", "....krRk....", "....krrk....", "...kkkkkk...", "..kWGGGgdk..", "..kGkkkkdk..", "..kGGGggdk..", "...kkkkkk...", ".kkWGyGgdkk.", "kWGGGyGgggdk", "kGkWGyggdkdk", "kGkGGyggdkdk", "kgkGGgggdkdk", ".k.kGgggdk.k", "...kkkkkkk..", "...kGgkgdk..", "...kGgkgdk..", "...kGgkgdk..", "...kWgkgdk..", "..kkkkkkkkk.", "..kbbbbbbBk.", "..kkkkkkkkk."], {"k": "#0b0a0e", "W": "#d0ccd8", "G": "#9a94a8", "g": "#66627a", "d": "#3e3a4c", "r": "#9a2030", "R": "#c83040", "b": "#5a4028", "B": "#3a2818", "y": "#c9a24a"}],
    brazier: [["...o..O...", "..oOyoOo..", ".OoyyyoOO.", "kOryyyyrOk", "kGGGGGggdk", ".kgggggdk.", "..kgggdk..", "...kgdk...", "...kgdk...", "..kggddk..", ".kkkkkkkk."], {"k": "#0b0a0e", "G": "#7a7488", "g": "#4e4a5a", "d": "#2e2a36", "o": "#ffd060", "O": "#ff8a2a", "r": "#c03018", "y": "#fff0b0"}],
    candelabra: [[".o...o...o.", ".y...y...y.", "kWk.kWk.kWk", "kWk.kWk.kWk", "kgkkkgkkkgk", ".kgggggggk.", "....kgk....", "....kgk....", "....kgk....", "....kgk....", "....kgk....", "...kgggk...", "..kgggddk..", "..kkkkkkk.."], {"k": "#0b0a0e", "G": "#7a7488", "g": "#4e4a5a", "d": "#2e2a36", "o": "#ffd060", "O": "#ff8a2a", "r": "#c03018", "y": "#fff0b0", "W": "#e8e0c8"}],
    bookshelf: [["kkkkkkkkkkkkkkkkkk", "kwwwwwwwwwwwwwwwwk", "kbkrrkguukrygkuubk", "kbkrrkguukrygkuubk", "kbkrrkguukrygkuubk", "kbkkkkkkkkkkkkkkbk", "kbwwwwwwwwwwwwwwbk", "kbkgukrr.kWkurrgbk", "kbkgukrr.kWkurrgbk", "kbkgukrrkkWkurrgbk", "kbkkkkkkkkkkkkkkbk", "kbwwwwwwwwwwwwwwbk", "kbBBBBBBBBBBBBBBbk", "kkkkkkkkkkkkkkkkkk"], {"k": "#0b0a0e", "w": "#8a6a48", "b": "#6a4a30", "B": "#4a3220", "r": "#7a2030", "g": "#3a5a3a", "u": "#3a3a6a", "y": "#c9a24a", "W": "#d8d0c0"}],
    chairBroken: [["kk........", "kwk.......", "kbk.......", "kbk.kkkk..", "kbkkwwwwk.", "kbbbbbbbbk", "kBkkkkkkBk", "kBk..k.kBk", "kk......kk"], {"k": "#0b0a0e", "w": "#8a6a48", "b": "#6a4a30", "B": "#4a3220", "r": "#7a2030", "g": "#3a5a3a", "u": "#3a3a6a", "y": "#c9a24a", "W": "#d8d0c0"}],
    table: [["kkkkkkkkkkkkkkkk", "kwwwwwwwwwwwwwwk", "kbbbbbbbbbbbbbbk", "kBBBBBBBBBBBBBBk", "kkkBkkkkkkkkBkkk", "..kBk......kBk..", "..kBk......kBk..", "..kkk......kkk.."], {"k": "#0b0a0e", "w": "#8a6a48", "b": "#6a4a30", "B": "#4a3220", "r": "#7a2030", "g": "#3a5a3a", "u": "#3a3a6a", "y": "#c9a24a", "W": "#d8d0c0"}],
    cage: [["....kkkkk....", "...kGgggdk...", "..kkkkkkkkk..", "..kG.g.g.dk..", "..kG.g.g.dk..", "..kG.g.W.dk..", "..kG.gWWdd k.", "..kG.g.W.dk..", "..kGkgkgkdk..", "..kkkkkkkkk.."], {"k": "#0b0a0e", "G": "#7a7488", "g": "#4e4a5a", "d": "#2e2a36", "o": "#ffd060", "O": "#ff8a2a", "r": "#c03018", "y": "#fff0b0", "W": "#d8d0c0"}],
    tapestry: [["kkkkkkkkkkkk", "kbbbbbbbbbbk", "kRRRRRRRRRRk", "kRyyyyyyyyRk", "kRyRRRRRRyRk", "kRyRRYYRRyRk", "kRyRYrrYRyRk", "kRyRRYYRRyRk", "kRyRRYYRRyRk", "kRyRRRRRRyRk", "kRyyyyyyyyRk", "kRRRRRRRRRRk", "kRRRRRRRRRRk", "kRkRkRkRkRkk", "k.k.k.k.k.k."], {"k": "#0b0a0e", "r": "#6a1018", "R": "#9a1c28", "y": "#c9a24a", "Y": "#e8c860", "p": "#3a1a48", "P": "#5a2a6a", "b": "#3a3036"}],
    shieldSwords: [["kW............Wk", ".kW..kkkkkk..Wk.", "..kWkYyyyyykWk..", "...kWRRrrRWyk...", "...kyWRrrWryk...", "...kyRWrWRryk...", "...kyRRWRRryk...", "...kyRWrWRryk...", "....kyRrrRyk....", "...kWkyRRyk.k...", "..kW..kyyk..Wk..", ".kW....kk....Wk.", "kk............kk"], {"k": "#0b0a0e", "W": "#d0ccd8", "G": "#9a94a8", "g": "#66627a", "r": "#8a1c28", "R": "#b82a38", "y": "#c9a24a", "Y": "#e8c860"}],
    portrait: [["kkkkkkkkkkkk", "kYyyyyyyyyYk", "kydddddddddk", "kydddSSSdddk", "kyddSsssSddk", "kyddsrssrsdk", "kyddSsssSddk", "kydddSssSddk", "kydDDDsDDDdk", "kyDDDDDDDDDk", "kyDDDDDDDDDk", "kYyyyyyyyyYk", "kkkkkkkkkkkk"], {"k": "#0b0a0e", "y": "#a8822e", "Y": "#e0b850", "d": "#1a1620", "D": "#2a2232", "s": "#8a6a5a", "S": "#5a4038", "r": "#ff3040"}],
    chains: [[".kk......kk.", "kGgk....kGgk", ".kk......kk.", "kGgk....kGgk", ".kk......kk.", "kGgk....kGgk", ".kkk....kkk.", "kGGgk..kGGgk", "kgddk..kgddk", ".kkk....kkk."], {"k": "#0b0a0e", "G": "#7a7488", "g": "#4e4a5a", "d": "#2e2a36", "o": "#ffd060", "O": "#ff8a2a", "r": "#c03018", "y": "#fff0b0"}],
    skullNiche: [["...kkkkkk...", "..kllllllk..", ".klDDDDDDlk.", "klDDDDDDDDlk", "klDDkkkkDDlk", "klDkWWWWkDlk", "klDWkWWkWDlk", "klDWWwwWWDlk", "klDkWkWkWDlk", "klllllllllk.", "kkkkkkkkkkk."], {"k": "#0b0a0e", "D": "#100c14", "d": "#2a2632", "W": "#d8d0c0", "w": "#a49c8e", "o": "#ffd060", "y": "#fff0b0", "l": "#4a4554"}],
    signpost: [[".kkkkkkkkkk...", "kwwwwwwwwwwk..", "kbWbbWWbbbbbk.", "kbbbbbbbbbbbbk", "kBBBBBBBBBBBk.", ".kkkkbkkkkkk..", "....kbk.......", "....kbk.......", "....kbk.......", "....kBk.......", "...mkBkm......", "..mMkkkMm....."], {"k": "#0b0a0e", "w": "#8a6a48", "b": "#6a4a30", "B": "#4a3220", "W": "#d8d0c0", "m": "#3e6a2c", "M": "#6a9a44"}],
    campfire: [["...kkkkkk...", ".kkGgcCcgkk.", "kGgcCwoCcGdk", "kgcwCOowCcdk", "kgcCcoCcwcdk", ".kkgdccdgkk.", "...kkkkkk..."], {"k": "#0b0a0e", "G": "#9a94a4", "g": "#6a6474", "d": "#3a3644", "c": "#1a1410", "C": "#2a2018", "o": "#ff8a2a", "O": "#ffd060", "w": "#6a4a30"}],
    deerSkull: [["kW.......Wk", ".kW.k.k.Wk.", "..kWWkWWk..", "...kWWWk...", "..kWWWWwk..", "..kWkWkwk..", "...kWWwk...", "...kwWwk...", "....kwk....", "....kk....."], {"k": "#0b0a0e", "W": "#e0d8c8", "w": "#a8a090", "d": "#5a5448"}],
    ruinPillar: [["..k.kk.k..", ".kGkGgkdk.", "kGGggggddk", "kGgMggrddk", "kGgMMgrddk", "kGgggggddk", "kGgMggdddk", "kMMgggdddk", "kGgggggdDk", "kGggggddDk", "kMMMgggdDk", "kGMMMMMMDk", "mkkkkkkkkm"], {"k": "#0b0a0e", "G": "#8a8494", "g": "#6a6474", "d": "#4a4554", "D": "#322e3a", "m": "#3e6a2c", "M": "#6a9a44", "r": "#7a2a6a"}],
    wheel: [["...kkkkk...", "..kbbbbbk..", ".kb.kbk.bk.", "kb..kbk..bk", "kbkkkBkkkbk", "kb..kbk..bk", ".kb.kbk.bk.", "..kbbbbbk..", "...kkkkk..."], {"k": "#0b0a0e", "w": "#8a6a48", "b": "#6a4a30", "B": "#4a3220", "W": "#d8d0c0", "m": "#3e6a2c", "M": "#6a9a44"}],
  };
  // ================================================================ 방 꾸미기 (v0.26) — 초원은 숲 느낌, 성채는 고성 느낌의 소품을 방마다 무작위로
  // 서 있는 소품: r=충돌 반지름(없으면 밟고 지나감), w/h=사각 충돌, light=빛, flame=불꽃 위치(칸)
  const PROPS = {
    goblinStatue: { r: 12, foot: 2 }, armor: { r: 9, foot: 2 }, brazier: { r: 9, foot: 2, light: { r: 90, c: '255,150,60', ca: 0.2, dy: -18 }, flame: [[3, 0], [5, 0], [7, 0]] },
    candelabra: { r: 7, foot: 2, light: { r: 60, c: '255,190,90', ca: 0.14, dy: -26 }, flame: [[1, 0], [5, 0], [9, 0]] },
    bookshelf: { w: 34, h: 10, foot: 2 }, table: { w: 30, h: 8, foot: 2 }, chairBroken: { foot: 2 }, cage: { r: 11, foot: 2 },
    ruinPillar: { r: 10, foot: 2 }, signpost: { r: 4, foot: 2 },
    poolM: { w: 38, h: 18, pit: true }, poolL: { w: 64, h: 32, pit: true }, poolXL: { w: 92, h: 46, pit: true },
  };
  const propCanvas = name => art('prop_' + name, () => gCanvas(fromRows(PROP_MAPS[name][0]), PROP_MAPS[name][1]));
  // 방 스타일: 바닥을 칠할 때 쓰는 방별 설정 (타이틀 화면은 기본값)

  // ---------- 방 생성 때: 서 있는 소품 배치 (큰 것은 장애물이 되고, 문 사이 길이 막히면 뺀다)
  function decorRoom(r, stage, keyPts) {
    r.props = [];
    const W0 = A.x1 - A.x0, H0 = A.y1 - A.y0;
    const previousStyle = ROOMSTYLE; ROOMSTYLE = stage === 1 ? r.style : ROOMSTYLE;
    const paths = stage === 1 ? meadowCurves() : []; ROOMSTYLE = previousStyle;
    const onRoad = (x, y, clearance) => paths.some(c => { for (let t = c.a; t <= c.b; t += 6) { const m = c.at(t), px = c.vert ? m : t, py = c.vert ? t : m; if (Math.hypot(px - x, py - y) < clearance) return true; } return false; });
    if (SR_LAYOUT[r.type]) { srPlace(r, stage); return; } // v1.11 특별한 방은 정해진 배치만
    const ok = (x, y, rad) => x > A.x0 + rad + 4 && x < A.x1 - rad - 4 && y > A.y0 + 8 && y < A.y1 - rad - 4 && !obsHitL(r.obs, x, y, rad + 8) && !onRoad(x, y, rad + 20)
      && !keyPts.some(p => Math.hypot(p.x - x, p.y - y) < rad + (p.big ? CLEAR_R : 46)) && !r.props.some(p => Math.hypot(p.x - x, p.y - y) < rad + p.rad + 12);
    // 그려지는 모양(높이 포함)끼리도 겹치지 않게: 소품끼리, 소품과 나무·바위·벽 (v0.59)
    const obsVis = b => b.c ? (b.t === 'pillar' ? { x0: b.x - b.r * 2.4, y0: b.y - b.r * 6, x1: b.x + b.r * 2.4, y1: b.y + b.r } : { x0: b.x - b.r - 2, y0: b.y - b.r * 1.8, x1: b.x + b.r + 2, y1: b.y + b.r }) : b.t === 'pit' ? { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 } : { x0: b.x0, y0: b.y0 - (b.tower ? 90 : 40), x1: b.x1, y1: b.y1 };
    const add = (name, x, y) => { const sp = PROPS[name], rad = sp.r || (sp.w ? (sp.pit ? Math.max(sp.w, sp.h) / 2 + 6 : sp.w / 2) : 8); if (!ok(x, y, rad)) return false;
      const q = { name, x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2, rad }, me = propRect(q);
      if (r.props.some(p => rectHit(me, propRect(p), 6)) || r.obs.some(b => rectHit(me, obsVis(b), 4))) return false;
      r.props.push(q); return true; };
    const fightRoom = ['combat', 'elite', 'survive', 'start'].includes(r.type);
    if (stage === 3) decorOrc(r, add, W0, H0, keyPts);
    else if (stage === 2) {
      const nx = DOOR.n.x, topY = A.y0 + 18;
      if (r.doors.n != null && Math.random() < 0.5) { const nm = pick(['goblinStatue', 'goblinStatue', 'armor']); add(nm, nx - 46, topY + 4); add(nm, nx + 46, topY + 4); }
      const n = Math.max(1, Math.floor(W0 / 260));
      const pool = r.shape === 'chamber' ? ['bookshelf', 'bookshelf', 'candelabra', 'armor'] : ['armor', 'goblinStatue', 'candelabra', 'brazier', 'armor'];
      for (let i = 0; i < n; i++) if (Math.random() < 0.7) { const x = A.x0 + 50 + (i + rand(0.2, 0.8)) * (W0 - 100) / n; if (Math.abs(x - nx) > 70) add(pick(pool), x, topY); }
      if (Math.random() < 0.6) { const cs = [[A.x0 + 26, A.y0 + 30], [A.x1 - 26, A.y0 + 30], [A.x0 + 26, A.y1 - 24], [A.x1 - 26, A.y1 - 24]].sort(() => Math.random() - 0.5); const m = pick(['brazier', 'candelabra']); add(m, ...cs[0]); add(m, ...cs[1]); }
      if (r.shape === 'chamber' || (r.shape === 'hall' && Math.random() < 0.3)) {
        if (Math.random() < 0.6) { const x = CX + rand(-W0 * 0.25, W0 * 0.25), y = CY + rand(-H0 * 0.2, H0 * 0.2); if (add('table', x, y) && Math.random() < 0.7) add('chairBroken', x + pick([-28, 28]), y + 6); }
        if (Math.random() < 0.35) add('cage', pick([A.x0 + 40, A.x1 - 40]), A.y1 - 40);
      }
      if (r.shape === 'corridorV' && Math.random() < 0.6) { add('candelabra', A.x0 + 22, CY - 120); add('candelabra', A.x1 - 22, CY + 120); }
    } else {
      // 개울: 걸어서 못 건넘(투사체는 넘어감). 문 앞을 지나면 그 자리에 다리, 길이 막히면 다리를 더 놓는다
      r.bridges = null;
      if (r.style && r.style.path === 'brook') {
        const RS0 = ROOMSTYLE; ROOMSTYLE = r.style; const bc = meadowCurves()[0]; ROOMSTYLE = RS0;
        const lo = bc.vert ? A.y0 : A.x0, hi = bc.vert ? A.y1 : A.x1, at = t => { const m = bc.at(t); return bc.vert ? { x: m, y: t } : { x: t, y: m }; };
        const br = [];
        for (const kp of keyPts) { let bt = null, bd = 1e9; for (let t = lo; t <= hi; t += 4) { const q = at(t), d = Math.hypot(q.x - kp.x, q.y - kp.y); if (d < bd) { bd = d; bt = t; } } if (bd < 70 && !br.some(b => Math.abs(b - bt) < 60)) br.push(bt); }
        if (!br.length) br.push(lo + (hi - lo) * rand(0.3, 0.7));
        if (Math.random() < 0.5) { const t = lo + (hi - lo) * rand(0.12, 0.88); if (!br.some(b => Math.abs(b - t) < 120)) br.push(t); }
        const segs = () => { const out = []; for (let t = lo - 14; t <= hi + 14; t += 12) { if (br.some(b => Math.abs(b - t) < 20)) continue; const q = at(t), hw = bc.vert ? 16 : 7, hh = bc.vert ? 7 : 16; out.push({ t: 'pit', c: false, brook: true, x: q.x, y: q.y, w: hw * 2, h: hh * 2, x0: q.x - hw, x1: q.x + hw, y0: q.y - hh, y1: q.y + hh }); } return out; };
        for (let k = 0; k < 6; k++) {
          if (keyPts.length < 2) break;
          const nav = buildNav(r.obs.concat(segs())), dd = navFlood(nav, keyPts[0].x, keyPts[0].y);
          const miss = keyPts.find(p => dd[navIdx(p.x, p.y)] < 0); if (!miss) break;
          let bt = lo, bd = 1e9; for (let t = lo; t <= hi; t += 4) { const q = at(t), d = Math.hypot(q.x - miss.x, q.y - miss.y); if (d < bd) { bd = d; bt = t; } } br.push(bt);
        }
        r.obs = r.obs.concat(segs());
        r.bridges = br.map(t => at(t));
      }
      if (Math.random() < 0.4) { const k = randi(1, W0 > 900 ? 3 : 1); for (let i = 0; i < k; i++) add('ruinPillar', rand(A.x0 + 40, A.x1 - 40), rand(A.y0 + 30, A.y1 - 40)); }
      if (Math.random() < 0.3) { const ds = Object.keys(r.doors).filter(d => r.doors[d] != null); if (ds.length) { const q = doorIn(pick(ds), 70); add('signpost', q.x + pick([-40, 40]), q.y); } }
      // 물웅덩이 M·L·XL: 못 건너가는 장애물, 흙길·개울과 겹치지 않게
      if (r.type !== 'boss') {
        const farFromPath = (x, y, w, h) => !onRoad(x, y, Math.max(w, h) / 2 + 28);
        const n = Math.random() < 0.35 ? 0 : randi(1, W0 * H0 > 400000 ? 3 : 2);
        for (let i = 0; i < n; i++) {
          const k = pick(W0 > 500 && H0 > 300 ? ['poolM', 'poolM', 'poolL', 'poolL', 'poolXL'] : ['poolM', 'poolM', 'poolL']), sp = PROPS[k];
          for (let tries = 0; tries < 12; tries++) {
            const x = rand(A.x0 + sp.w / 2 + 30, A.x1 - sp.w / 2 - 30), y = rand(A.y0 + sp.h / 2 + 30, A.y1 - sp.h / 2 - 30);
            if (!farFromPath(x, y, sp.w, sp.h)) continue;
            if (add(k, x, y)) break;
          }
        }
      }
    }
    // 장애물로 등록 + 문 사이 길 검사
    const solid = p => PROPS[p.name].r || PROPS[p.name].w;
    const toObs = p => { const sp = PROPS[p.name]; if (sp.pit) return { t: 'pit', c: false, pool: p.name, seed: p.x * 31 + p.y, x: p.x, y: p.y, w: sp.w, h: sp.h, x0: p.x - sp.w / 2, y0: p.y - sp.h / 2, x1: p.x + sp.w / 2, y1: p.y + sp.h / 2 }; return sp.w ? { t: 'prop', c: false, x: p.x, y: p.y, w: sp.w, h: sp.h, x0: p.x - sp.w / 2, y0: p.y - sp.h, x1: p.x + sp.w / 2, y1: p.y } : { t: 'prop', c: true, x: p.x, y: p.y, r: sp.r }; };
    const base = r.obs.slice();
    for (;;) {
      const obs = base.concat(r.props.filter(solid).map(toObs)), nav = buildNav(obs);
      const conn = keyPts.length < 2 || (() => { const dd = navFlood(nav, keyPts[0].x, keyPts[0].y); return keyPts.every(p => dd[navIdx(p.x, p.y)] >= 0); })();
      if (conn || !r.props.some(solid)) { r.obs = obs; r.nav = nav; break; }
      const i = r.props.map(solid).lastIndexOf(true); r.props.splice(i, 1);
    }
  }
  function drawProp(p) {
    const c = propCanvas(p.name), sp = PROPS[p.name], x = (p.x - c.width / 2) & ~1, y = (p.y - c.height + (sp.foot || 0) * 2) & ~1;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; { const xa = x + 2, xb = x + c.width - 2; if (xb > xa) ctx.fillRect(xa, p.y, Math.ceil((xb - xa) / 2) * 2, 2); }
    ctx.drawImage(c, x, y);
    if (sp.flame) for (const [fx, fy] of sp.flame) {
      const f = Math.floor(time * 10 + fx * 3 + p.x) % 3;
      ctx.fillStyle = '#ff8a2a'; ctx.fillRect(x + fx * 2, y + fy * 2 - 2 - (f === 1 ? 2 : 0), 2, 2);
      ctx.fillStyle = '#ffe08a'; ctx.fillRect(x + fx * 2 + (f === 2 ? 2 : 0), y + fy * 2 - 4 - (f === 0 ? 2 : 0), 2, 2);
    }
  }

  // ---------- 바닥 무늬 생성기 (모두 2px 칸)
  function genFern() {
    const g = mkGrid(15, 10);
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI / 2 + (f - 2) * 0.6, L = rand(4.5, 6.5);
      for (let t = 1; t < L; t++) {
        const x = Math.round(7 + Math.cos(a) * t), y = Math.round(9 + Math.sin(a) * t * 0.85 + t * t * 0.07 * Math.abs(f - 2));
        if (!g[y] || g[y][x] === undefined) continue;
        g[y][x] = t > L - 1.5 ? 'M' : 'm';
        if (t % 2 === 0 && t < L - 1) { const sx = x + (Math.cos(a) > 0 ? 1 : -1); if (g[y - 1] && g[y - 1][sx] !== undefined) g[y - 1][sx] = 'd'; }
      }
    }
    return g;
  }
  const FERN_PAL = { m: '#36602a', M: '#6a9a44', d: '#24401c' };
  const SHROOMS = {
    red: fromRows(['.kkk.', 'kRWRk', 'kRRRk', 'kkkkk', '.kwk.', '.kkk.']),
    brown: fromRows(['.kkkk.', 'kbBbbk', 'kkkkkk', '.kwwk.', '.kkkk.']),
    tall: fromRows(['.kk.', 'kWWk', 'kkkk', '.kw.', '.kw.', '.kk.']),
    glow: fromRows(['.kkk.', 'kcCck', 'kkkkk', '.kwk.', '.kk.']),
  };
  const SHROOM_PAL = { k: '#121214', R: '#a83030', W: '#f0ece0', w: '#d8d0c0', b: '#8a5a30', B: '#a87040', c: '#3aa0b8', C: '#a0f0ff' };
  const BONES = fromRows(['k....kk', 'Wkk.kWk', '.kWWWk.', 'kWk..kW', 'k......']);
  const STONEPAD = fromRows(['.kkkk.', 'kGGggk', 'kGgggk', 'kgggdk', '.kkkk.']);
  const STONEPAD_PAL = { k: '#121214', G: '#a8a4ae', g: '#7c7a82', d: '#4c4a52' };
  const CANDLES = fromRows(['o.....', 'W..o..', 'W..W.o', 'Wk.W.W', 'kk.Wkk', '...kk.']);
  // 타원 영역에 점을 디더링으로 흩뿌린다
  function scatterPatch(g, cx, cy, rx, ry, cols, dens) {
    for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) {
      const e = (x * x) / (rx * rx) + (y * y) / (ry * ry); if (e > 1) continue;
      if (Math.random() < dens * (1 - e * 0.7)) { g.fillStyle = pick(cols); g.fillRect(((cx + x) & ~1), ((cy + y) & ~1), 2, 2); }
    }
  }
  function genWeb() {
    const g = mkGrid(12, 10);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI / 2; for (let t = 0; t < 11; t++) { const x = Math.round(Math.cos(a) * t), y = Math.round(Math.sin(a) * t * 0.85); if (g[y] && g[y][x] !== undefined) g[y][x] = 'w'; } }
    for (const R of [4, 7, 10]) for (let a = 0; a < Math.PI / 2; a += 0.12) { const x = Math.round(Math.cos(a) * R), y = Math.round(Math.sin(a) * R * 0.85); if (g[y] && g[y][x] !== undefined && Math.random() < 0.85) g[y][x] = 'W'; }
    return g;
  }
  function genCarpet(len, wid, vert) {
    // 붉은 융단: 금실 테두리, 마름모 무늬, 끝은 술 장식, 군데군데 해지고 바랬다
    const L = len, Wd = wid, g = mkGrid(vert ? Wd : L, vert ? L : Wd);
    const set = (i, j, c) => { const x = vert ? j : i, y = vert ? i : j; if (g[y] && g[y][x] !== undefined) g[y][x] = c; };
    for (let i = 0; i < L; i++) for (let j = 0; j < Wd; j++) {
      const e = Math.min(j, Wd - 1 - j), endD = Math.min(i, L - 1 - i);
      let c = e === 0 ? 'k' : e === 1 ? 'y' : e === 2 ? 'D' : 'R';
      if (c === 'R') { const m = ((i % 14) + 14) % 14, dj = Math.abs(j - (Wd - 1) / 2); if (Math.abs(m - 7) + dj === Math.round(Wd / 4) || (m === 7 && dj < 1)) c = 'y'; else if (Math.abs(m - 7) + dj < Wd / 4) c = 'r'; }
      if (endD === 0) c = j % 2 ? 'y' : '.'; else if (endD === 1) c = 'k';
      if (endD > 1 && endD < 10 && Math.random() < (10 - endD) / 40) c = '.';
      set(i, j, c);
    }
    for (let k = 0; k < L / 30; k++) { const i = randi(8, L - 9), j = randi(3, Wd - 4); for (let d = 0; d < 6; d++) set(i + randi(-2, 2), j + randi(-1, 1), dith(i + d, j, 0.5) ? 'D' : '.'); }
    return g;
  }
  const CARPET_PAL = { k: '#1a0c10', y: '#a8822e', D: '#4a0c14', R: '#7a1420', r: '#5a0e18' };
  function genRug(rx, ry) {
    const g = mkGrid(rx * 2 + 1, ry * 2 + 1);
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const e = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry)); if (e > 1) continue;
      g[y + ry][x + rx] = e > 0.92 ? 'k' : e > 0.84 ? 'y' : e > 0.62 ? 'P' : e > 0.55 ? 'y' : e > 0.25 ? ((Math.abs(x) + Math.abs(y)) % 4 === 0 ? 'p' : 'R') : 'y';
    }
    return g;
  }
  const RUG_PAL = { k: '#120a10', y: '#a8822e', P: '#3a1848', p: '#5a2a6a', R: '#6a1420' };
  const RUG_PALS = [
    RUG_PAL,
    { k: '#0a0c14', y: '#b8a060', P: '#142a4a', p: '#2a4a78', R: '#1a3050' },
    { k: '#0a100a', y: '#9a8a4a', P: '#1a3a22', p: '#2e5a36', R: '#5a1418' },
    { k: '#140c08', y: '#c8a050', P: '#4a2a14', p: '#7a4a22', R: '#7a2a14' },
    { k: '#0e0a10', y: '#8a8494', P: '#2a2232', p: '#4a3e5a', R: '#3a1a2a' },
  ];
  // 무늬가 다른 원형 (0 동심원, 1 햇살, 2 점박이)
  function genRugRound(rx, ry, pat) {
    const g = mkGrid(rx * 2 + 1, ry * 2 + 1);
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const e = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry)); if (e > 1) continue;
      const an = Math.atan2(y / ry, x / rx);
      let c = e > 0.92 ? 'k' : e > 0.84 ? 'y' : 'R';
      if (c === 'R') {
        if (pat === 0) c = e > 0.62 ? 'P' : e > 0.55 ? 'y' : e > 0.25 ? ((Math.abs(x) + Math.abs(y)) % 4 === 0 ? 'p' : 'R') : 'y';
        else if (pat === 1) c = e < 0.18 ? 'y' : Math.floor((an + Math.PI) / (TAU / 16)) % 2 ? (e > 0.6 ? 'P' : 'R') : (e > 0.6 ? 'p' : 'P');
        else c = e > 0.7 ? 'P' : (Math.round(x / 3 + y / 2) % 3 === 0 && (x + y) % 2 === 0 ? 'y' : e < 0.3 ? 'p' : 'R');
      }
      g[y + ry][x + rx] = c;
    }
    return g;
  }
  // 사각 융단: 무늬 띠 테두리, 가운데 마름모 문장, 네 귀 장식, 짧은 변에 술
  function genRugRect(wc, hc, torn) {
    const g = mkGrid(wc + 4, hc);
    for (let y = 0; y < hc; y++) for (let x = 0; x < wc; x++) {
      const e = Math.min(x, y, wc - 1 - x, hc - 1 - y);
      let c = e === 0 ? 'k' : e === 1 ? 'y' : e <= 3 ? ((x + y) % 3 === 0 ? 'y' : 'P') : e === 4 ? 'y' : 'R';
      if (c === 'R') {
        const dx = Math.abs(x - (wc - 1) / 2) / (wc / 2), dy = Math.abs(y - (hc - 1) / 2) / (hc / 2), d = dx + dy;
        if (d < 0.42) c = d > 0.36 ? 'y' : d > 0.2 ? 'P' : d > 0.12 ? 'p' : 'y';
        else if (Math.min(x, wc - 1 - x) + Math.min(y, hc - 1 - y) < 11 && Math.min(x, wc - 1 - x) > 4 && Math.min(y, hc - 1 - y) > 4) c = 'p';
        else if ((x * 3 + y * 5) % 17 === 0) c = 'P';
      }
      if (torn && (Math.sin(x * 0.7) + Math.sin(y * 0.9 + 1) > 1.4 || (x > wc * 0.7 && y > hc * 0.6 && dith(x, y, (x / wc - 0.7) * 3)))) c = '.';
      g[y][x + 2] = c;
    }
    for (let y = 1; y < hc - 1; y += 2) { g[y][0] = 'y'; g[y][1] = 'y'; g[y][wc + 2] = 'y'; g[y][wc + 3] = 'y'; }
    return g;
  }
  // 팔각 깔개: 별 무늬
  function genRugOct(r) {
    const n = r * 2 + 1, g = mkGrid(n, Math.round(n * 0.62));
    const ry = (g.length - 1) / 2;
    for (let y = 0; y < g.length; y++) for (let x = 0; x < n; x++) {
      const dx = Math.abs(x - r) / r, dy = Math.abs(y - ry) / ry, o = Math.max(dx, dy, (dx + dy) * 0.72);
      if (o > 1) continue;
      const an = Math.atan2((y - ry) / ry, (x - r) / r), star = o < 0.55 * (0.7 + 0.3 * Math.cos(an * 8));
      g[y][x] = o > 0.92 ? 'k' : o > 0.84 ? 'y' : star ? (o < 0.15 ? 'y' : 'p') : o > 0.66 && o < 0.72 ? 'y' : 'R';
    }
    return g;
  }
  // 짐승 가죽 깔개 (머리·다리 달린 털가죽)
  const PELT = fromRows([
    '.....kk.........kk.....', '....kFFk.......kFFk....', '.....kFFkkkkkkkFFk.....', '.......kFfffffffFk......', '.....kkFfffFffffFkk.....', '....kFFfffffffffffFFk...',
    '...kFffffDffffDfffffFk..', '..kFfffffffffffffffffFk.', '..kFffDfffffffffDffffFk.', '..kFfffffffDffffffffFk..', '...kFfffffffffffffffFk..', '....kFFfffDfffffffFFk...',
    '.....kkFffffffffFkk.....', '.......kFFkkkkFFk.......', '......kWkk....kkWk......', '.....kFk........kFk.....', '......k..........k......']);
  const PELT_PAL = { k: '#140c06', F: '#4a3018', f: '#6e4a2a', D: '#3a2412', W: '#d8d0c0' };

  // ---------- 바닥 꾸미기: 초원
  function paintMeadowDecor(g, R) {
    const fl = G ? (G.flatLights = []) : [];
    const MPs = meadowCurves(), onPath = (x, y, clearance = 20) => MPs.some(c => { for (let t = c.a; t <= c.b; t += 6) { const m = c.at(t), px = c.vert ? m : t, py = c.vert ? t : m; if (Math.hypot(px - x, py - y) < clearance) return true; } return false; });
    const busy = (x, y, r) => (R && obsHitL(R.obs, x, y, r)) || onPath(x, y, r + 20);
    const spot = (pad = 20, r = 10) => { for (let i = 0; i < 30; i++) { const x = rand(A.x0 + pad, A.x1 - pad), y = rand(A.y0 + pad, A.y1 - pad - 10); if (!busy(x, y, r)) return { x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2 }; } return null; };
    const area = (A.x1 - A.x0) * (A.y1 - A.y0) / 540000;
    // 땅 얼룩: 이끼·맨흙·짙은 풀
    for (let i = 0; i < 6 * area + 2; i++) { const p = spot(30, 0); if (p) scatterPatch(g, p.x, p.y, randi(20, 50), randi(12, 26), pick([['#2e5222', '#36602a'], ['#3a3020', '#46382a'], ['#1a2e14', '#22381a']]), 0.35); }
    // 낙엽 더미 (가을빛)
    for (let i = 0; i < randi(1, 4) * area; i++) { const p = spot(30, 10); if (p) scatterPatch(g, p.x, p.y, randi(18, 34), randi(10, 18), ['#a04a1a', '#d8883a', '#6a2a12', '#d8c050', '#8a3a14'], 0.45); }
    // 꽃밭
    for (let i = 0; i < randi(0, 3) * area; i++) { const p = spot(30, 10); if (p) { scatterPatch(g, p.x, p.y, randi(16, 30), randi(8, 16), ['#3e6a2c', '#4a7a34'], 0.5); scatterPatch(g, p.x, p.y, randi(14, 26), randi(7, 14), pick([['#e8e0c0', '#e0c040'], ['#b080e0', '#e8e0c0'], ['#e07090', '#e0c040']]), 0.22); } }
    // 고사리 · 키 큰 풀
    for (let i = 0; i < randi(6, 14) * area; i++) { const p = spot(10, 8); if (p) gPaint(g, genFern(), FERN_PAL, p.x - 14, p.y - 18); }
    for (let i = 0; i < 40 * area; i++) { const p = spot(6, 0); if (p) { const t = pick(['tuft1', 'tuft2', 'tuft3']); stamp(g, DECO_MAPS[t], Object.assign({}, DECO, Math.random() < 0.5 ? { m: '#4a7a34', M: '#78a850' } : { m: '#36602a', M: '#5a8a3a' }), p.x, p.y, 2, Math.random() < 0.5); } }
    for (let i = 0; i < 14 * area; i++) { const p = spot(6, 0); if (p) stamp(g, DECO_MAPS[pick(['flowerY', 'flowerP', 'flowerW'])], DECO, p.x, p.y, 2, Math.random() < 0.5); }
    // 바위 · 그루터기 · 통나무(버섯 돋은) · 덤불
    for (let i = 0; i < randi(1, 4) * area; i++) { const p = spot(40, 20); if (p) { stamp(g, DECO_MAPS.rockBig, DECO, p.x, p.y, 2, Math.random() < 0.5); if (Math.random() < 0.6) stamp(g, DECO_MAPS.rockB, DECO, p.x + 24, p.y + 14, 2); } }
    for (let i = 0; i < 8 * area; i++) { const p = spot(20, 6); if (p) stamp(g, DECO_MAPS[pick(['rockA', 'rockB', 'rockC', 'rockD'])], DECO, p.x, p.y, 2, Math.random() < 0.5); }
    for (let i = 0; i < randi(0, 3) * area; i++) { const p = spot(30, 12); if (p) { stamp(g, DECO_MAPS.stump, woodPal(), p.x, p.y, 2); if (Math.random() < 0.5) gPaint(g, SHROOMS.brown, SHROOM_PAL, p.x + 14, p.y + 4); } }
    for (let i = 0; i < randi(0, 2) * area; i++) { const p = spot(40, 16); if (p) { stamp(g, DECO_MAPS.log, woodPal(), p.x, p.y, 2, Math.random() < 0.5); for (let k = 0; k < randi(1, 3); k++) gPaint(g, pick([SHROOMS.brown, SHROOMS.red, SHROOMS.tall]), SHROOM_PAL, p.x + 4 + k * 8, p.y - 8); } }
    for (let i = 0; i < randi(2, 6) * area; i++) { const p = spot(20, 10); if (p) stamp(g, DECO_MAPS.bush, Object.assign({}, DECO, pick([{ r: '#c03040' }, { r: '#6a40a0' }, { r: '#e0c040' }])), p.x, p.y, 2, Math.random() < 0.5); }
    // 버섯: 요정의 고리(종류·크기 무작위) 또는 흩어진 무리
    const kinds = ['red', 'brown', 'tall', 'glow'];
    if (Math.random() < 0.4) {
      const rx = randi(36, 80), ry = Math.round(rx * 0.62), c = spot(rx + 20, rx * 0.6);
      if (c) { const k1 = pick(kinds), k2 = pick(kinds), n = Math.round(rx / 5.5); for (let i = 0; i < n; i++) { const a = i / n * TAU + rand(-0.1, 0.1), k = Math.random() < 0.8 ? k1 : k2, x = c.x + Math.cos(a) * rx, y = c.y + Math.sin(a) * ry; gPaint(g, SHROOMS[k], SHROOM_PAL, x - 5, y - 10); if (k === 'glow' && i % 3 === 0) fl.push({ x, y: y - 4, r: 34, a: 0.35, c: '120,230,255', ca: 0.12 }); } }
    }
    for (let i = 0; i < randi(1, 5) * area; i++) { const p = spot(20, 10); if (!p) continue; const k = pick(kinds); for (let j = 0; j < randi(2, 5); j++) gPaint(g, SHROOMS[k], SHROOM_PAL, p.x + randi(-10, 10), p.y + randi(-6, 6)); if (k === 'glow') fl.push({ x: p.x, y: p.y, r: 40, a: 0.4, c: '120,230,255', ca: 0.14 }); }
    if (Math.random() < 0.45) { const p = spot(40, 24); if (p && !onPath(p.x, p.y, 52)) { const sp = SPRINGS.springS; gPaint(g, sp, POND_PAL, p.x - sp[0].length, p.y - sp.length); } }
    // 이야기 소품: 꺼진 모닥불, 짐승 뼈, 부서진 수레바퀴, 거미줄, 룬 비석, 허수아비
    if (Math.random() < 0.35) { const p = spot(40, 20); if (p) { gPaint(g, fromRows(PROP_MAPS.campfire[0]), PROP_MAPS.campfire[1], p.x - 12, p.y - 6); fl.push({ x: p.x, y: p.y, r: 30, a: 0.3, c: '255,120,50', ca: 0.14, flick: true }); for (let k = 0; k < 2; k++) gPaint(g, STONEPAD, STONEPAD_PAL, p.x + pick([-30, 22]), p.y + randi(-4, 8)); } }
    if (Math.random() < 0.4) { const p = spot(30, 10); if (p) gPaint(g, fromRows(PROP_MAPS.deerSkull[0]), PROP_MAPS.deerSkull[1], p.x, p.y); }
    if (Math.random() < 0.4) { const p = spot(30, 10); if (p) gPaint(g, BONES, PROP_MAPS.deerSkull[1], p.x, p.y); }
    if (Math.random() < 0.25) { const p = spot(30, 10); if (p) gPaint(g, fromRows(PROP_MAPS.wheel[0]), PROP_MAPS.wheel[1], p.x, p.y); }
    if (Math.random() < 0.5) { const left = Math.random() < 0.5, web = genWeb(); gPaint(g, left ? web : web.map(r => r.slice().reverse()), { w: 'rgba(200,200,215,.55)', W: 'rgba(230,230,240,.75)' }, left ? A.x0 + 2 : A.x1 - 26, A.y0 + 2); }
    if (Math.random() < 0.4) { const p = spot(40, 14); if (p) { stamp(g, DECO_MAPS.rune, DECO, p.x, p.y, 2); fl.push({ x: p.x + 6, y: p.y + 12, r: 30, a: 0.25, c: '255,60,60', ca: 0.1 }); } }
    if (Math.random() < 0.35) { const p = spot(60, 20); if (p) stamp(g, DECO_MAPS.scarecrow, DECO, p.x, p.y - 30, 2, Math.random() < 0.5); }
  }
  // 초원 길 모양: 구불길·곧은길·갈림길·교차·징검돌·개울·없음
  function meadowCurves() {
    const st = ROOMSTYLE.path || 'wind', w = A.x1 - A.x0, h = A.y1 - A.y0, vert = h > w * 1.3, out = [];
    const doors = ROOMSTYLE.doors || [];
    if (st === 'none' && !doors.length) return out;
    // 문이 있는 방에서는 장식용 길 없음 스타일도 문 앞까지 가는 흙길로 바꾼다.
    const pathStyle = st === 'none' ? 'wind' : st;
    const kind = pathStyle === 'stones' ? 'stones' : pathStyle === 'brook' ? 'brook' : 'dirt';
    // 길·개울은 벽까지 닿지 않고 방 안에서 가늘어지며 끝난다 (ea·eb·ec = 끝에서 비우는 비율)
    const ea = ROOMSTYLE.ea != null ? ROOMSTYLE.ea : 0.12, eb = ROOMSTYLE.eb != null ? ROOMSTYLE.eb : 0.12, ec = ROOMSTYLE.ec != null ? ROOMSTYLE.ec : 0.12;
    const full = kind === 'brook'; // 개울은 맵 끝까지 이어진다
    if (kind === 'brook' && ROOMSTYLE.side) { // v0.68: 개울은 가운데가 아니라 문이 없는 벽 쪽 가장자리를 따라 흐른다
      const sd = ROOMSTYLE.side, ph = ROOMSTYLE.ph || 0;
      if (sd === 'n' || sd === 's') { const amp = Math.min(12, h * 0.035), base = sd === 's' ? A.y1 - Math.max(30, h * 0.13) : A.y0 + Math.max(34, h * 0.14); out.push({ vert: false, kind, at: x => base + Math.sin(x * 0.009 + ph) * amp + Math.sin(x * 0.025) * 3, a: A.x0 - 80, b: A.x1 + 80, fadeA: false, fadeB: false }); }
      else { const amp = Math.min(12, w * 0.035), base = sd === 'e' ? A.x1 - Math.max(30, w * 0.11) : A.x0 + Math.max(30, w * 0.11); out.push({ vert: true, kind, at: y => base + Math.sin(y * 0.011 + ph) * amp + Math.sin(y * 0.03) * 3, a: A.y0 - 80, b: A.y1 + 80, fadeA: false, fadeB: false }); }
      return out;
    }
    const ph = ROOMSTYLE.ph || 0;
    if (vert) {
      const amp = pathStyle === 'straight' ? 5 : Math.min(22, w * 0.075), center = y => { const edge = clamp(Math.min(y - A.y0, A.y1 - y) / 140, 0, 1), env = edge * edge * (3 - 2 * edge); return CX + (Math.sin(y * 0.012 + ph) * amp + Math.sin(y * 0.028 + ph * 1.7) * 5) * env; };
      const main = { vert: true, kind, at: center, a: doors.includes('n') ? A.y0 - 2 : A.y0 + h * ea, b: doors.includes('s') ? A.y1 + 2 : A.y1 - h * eb, fadeA: !doors.includes('n'), fadeB: !doors.includes('s') };
      out.push(main);
      // 좌우 문에서는 문턱에서 중앙 세로길까지 짧게 연결한다.
      for (const d of ['w', 'e']) if (doors.includes(d)) {
        const x0 = d === 'w' ? A.x0 - 2 : center(CY), x1 = d === 'w' ? center(CY) : A.x1 + 2;
        out.push({ vert: false, kind, at: x => CY + Math.sin((x - x0) / Math.max(1, x1 - x0) * Math.PI) * 3, a: x0, b: x1, fadeA: false, fadeB: false });
      }
      return out;
    }
    const amp = pathStyle === 'straight' ? 5 : Math.min(22, h * 0.09), base = h > 400 ? CY + clamp(ROOMSTYLE.off || 0, -0.18, 0.18) * Math.min(120, h * 0.22) : CY;
    const center = x => { const edge = clamp(Math.min(x - A.x0, A.x1 - x) / 140, 0, 1), env = edge * edge * (3 - 2 * edge); return CY + ((base - CY) + Math.sin(x * 0.009 + ph) * amp + Math.sin(x * 0.021 + ph * 1.7) * Math.min(7, amp * 0.3)) * env; };
    const main = { vert: false, kind, at: center, a: doors.includes('w') ? A.x0 - 2 : A.x0 + w * ea, b: doors.includes('e') ? A.x1 + 2 : A.x1 - w * eb, fadeA: !doors.includes('w'), fadeB: !doors.includes('e') };
    out.push(main);
    // 위아래 문에서 주 오솔길까지 연결되는 가지길.
    for (const d of ['n', 's']) if (doors.includes(d)) {
      const xDoor = DOOR[d].x, yRoad = center(xDoor), y0 = d === 'n' ? A.y0 - 2 : yRoad, y1 = d === 'n' ? yRoad : A.y1 + 2;
      if (Math.abs(yRoad - (d === 'n' ? A.y0 : A.y1)) > 5) out.push({ vert: true, kind, at: y => xDoor + Math.sin((y - y0) / Math.max(1, y1 - y0) * Math.PI) * 3, a: y0, b: y1, fadeA: false, fadeB: false });
    }
    return out;
  }
  // 흙길 한 칸 색: 가운데는 흙, 가장자리로 갈수록 흙 점이 성겨지며 풀색과 디더링으로 섞인다 (null = 칠하지 않음, 풀 그대로)
  function dirtCol(o, hw, x, y) {
    const t = Math.abs(o) / hw, B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], d = (lv, ox, oy) => lv * 16 > B4[(((y >> 1) + oy) & 3) * 4 + (((x >> 1) + ox) & 3)];
    if (t < 0.5) { const r = Math.random(); return r < 0.04 ? '#8a8478' : r < 0.18 ? '#7e6040' : '#62482e'; }
    const lv = Math.max(0, Math.min(1, (1.4 - t) / 0.9));
    if (d(lv, 0, 0)) return Math.random() < 0.35 ? '#56402a' : '#62482e';
    if (d(lv * 0.85, 1, 2)) return Math.random() < 0.5 ? '#3e3a22' : '#3a4426';
    return null;
  }
  // 나무다리: 개울을 가로지르는 널판 (vertFlow = 개울이 세로로 흐름)
  function genBridge(vertFlow) {
    const L = 22, Wd = 12, g = mkGrid(vertFlow ? L : Wd, vertFlow ? Wd : L);
    for (let i = 0; i < L; i++) for (let j = 0; j < Wd; j++) {
      const rail = j <= 1 || j >= Wd - 2, end = i === 0 || i === L - 1;
      let c = rail ? (j === 0 || j === Wd - 1 ? 'k' : (i % 6 === 0 ? 'k' : 'B')) : i % 3 === 2 ? 'k' : (i % 6 < 3 ? 'w' : 'b');
      if (!rail && i % 3 === 0 && (j === 3 || j === Wd - 4)) c = 'y';
      if (end && !rail) c = 'k';
      const x = vertFlow ? i : j, y = vertFlow ? j : i; g[y][x] = c;
    }
    return g;
  }
  const BRIDGE_PAL = { k: '#0b0a0e', w: '#8a6a48', b: '#6a4a30', B: '#4a3220', y: '#a8a090' };
  function paintMeadowCurve(g, c) {
    const L = 150, B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let t = c.a & ~1; t < c.b; t += 2) {
      const m = Math.round(c.at(t) / 2) * 2;
      const rawFade = Math.min(1, c.fadeA ? (t - c.a) / L : 1, c.fadeB ? (c.b - t) / L : 1), f = rawFade * rawFade * (3 - 2 * rawFade);
      if (c.kind === 'stones') { if (t % 22 === 0 && Math.random() < 0.08 + 0.92 * f) gPaint(g, STONEPAD, STONEPAD_PAL, (c.vert ? m : t) - 6 + randi(-4, 4), (c.vert ? t : m) - 4 + randi(-4, 4)); continue; }
      const hw = Math.max(4, Math.round((c.kind === 'brook' ? 12 + (Math.random() < 0.3 ? 2 : 0) : 10 + (Math.random() < 0.3 ? 2 : 0)) * (c.kind === 'brook' ? 0.45 + 0.55 * f : 0.72 + 0.28 * f) / 2) * 2);
      const span = c.kind === 'brook' ? hw : Math.ceil(hw * 1.4 / 2) * 2;
      for (let o = -span - 2; o <= span; o += 2) {
        const x = c.vert ? m + o : t, y = c.vert ? t : m + o, edge = o < -hw || o >= hw;
        if (c.kind === 'brook') { g.fillStyle = edge ? (Math.random() < 0.7 ? '#4a3424' : '#2e5222') : o <= -hw + 2 ? '#0c1a2c' : Math.random() < 0.06 ? '#6a9ac0' : o > hw - 6 ? '#1c4466' : '#13304c'; g.fillRect(x, y, 2, 2); continue; }
        if (f < 1 && !(f * 16 > B4[((y >> 1) & 3) * 4 + ((x >> 1) & 3)])) continue;
        const col = dirtCol(o + 1, hw, x, y); if (col) { g.fillStyle = col; g.fillRect(x, y, 2, 2); }
      }
      if (c.kind === 'brook' && t % 40 === 0 && Math.random() < 0.6) stamp(g, DECO_MAPS.rockB, DECO, (c.vert ? m : t) - 6, (c.vert ? t : m) - 4, 2);
    }
    if (c.kind === 'brook' && CUR_ROOM && CUR_ROOM.bridges) for (const b of CUR_ROOM.bridges) { const gr = genBridge(c.vert); gPaint(g, gr, BRIDGE_PAL, b.x - gr[0].length, b.y - gr.length); }
  }

  // ---------- 바닥 꾸미기: 성채
  function paintCastleDecor(g, R) {
    const fl = G ? (G.flatLights = []) : [];
    const busy = (x, y, r) => (R && obsHitL(R.obs, x, y, r));
    const spot = (pad = 20, r = 10) => { for (let i = 0; i < 30; i++) { const x = rand(A.x0 + pad, A.x1 - pad), y = rand(A.y0 + pad, A.y1 - pad); if (!busy(x, y, r)) return { x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2 }; } return null; };
    const W0 = A.x1 - A.x0, H0 = A.y1 - A.y0, area = W0 * H0 / 540000, sh = R ? R.shape : 'hall';
    // 붉은 융단
    const cp = { hall: 0.55, greathall: 0.75, corridor: 0.7, corridorV: 0.7, chamber: 0 }[sh] || 0;
    if (Math.random() < cp) { const D0 = DEC; DEC = null;
      // 융단이 기둥·잔해·벽·소품 밑으로 지나가면 깔지 않는다 (v0.59)
      const clear = (x0, y0, x1, y1) => !R || (!R.obs.some(o => o.c ? o.x + o.r > x0 - 4 && o.x - o.r < x1 + 4 && o.y + o.r > y0 - 4 && o.y - o.r * 1.6 < y1 + 4 : o.x1 > x0 - 4 && o.x0 < x1 + 4 && o.y1 > y0 - 4 && o.y0 - 30 < y1 + 4) && !(R.props || []).some(q => rectHit(propRect(q), { x0, y0, x1, y1 }, 4)));
      if (sh === 'corridorV' || (sh !== 'corridor' && R && R.doors.n != null && Math.random() < 0.45)) { const wd = sh === 'corridorV' ? 18 : 24, len = Math.floor((A.y1 - A.y0 - 20) / 2); if (clear(DOOR.n.x - wd, A.y0 + 6, DOOR.n.x + wd, A.y1 - 14)) gPaint(g, genCarpet(len, wd, true), CARPET_PAL, DOOR.n.x - wd, A.y0 + 6); }
      else { const wd = sh === 'corridor' ? 20 : 24, len = Math.floor((W0 - 60) / 2); if (clear(A.x0 + 30, CY - wd, A.x1 - 30, CY + wd)) gPaint(g, genCarpet(len, wd, false), CARPET_PAL, A.x0 + 30, CY - wd); }
      DEC = D0; }
    // 깔개: 원형(무늬 3종)·사각 문장 융단·해진 융단·팔각 별 무늬·짐승 가죽, 색 5종
    const nRug = sh === 'chamber' ? (Math.random() < 0.85 ? 1 : 0) : sh === 'greathall' ? randi(0, 2) : sh === 'hall' ? (Math.random() < 0.4 ? 1 : 0) : sh === 'corridorV' || sh === 'corridor' ? 0 : 0;
    for (let i = 0; i < nRug; i++) {
      const kind = pick(['round', 'rect', 'rect', 'torn', 'oct', 'pelt']), pal = pick(RUG_PALS);
      let grid, gp = pal;
      if (kind === 'round') { const rx = randi(24, 38); grid = genRugRound(rx, Math.round(rx * 0.6), randi(0, 2)); }
      else if (kind === 'rect' || kind === 'torn') grid = genRugRect(randi(30, 46), randi(18, 26), kind === 'torn');
      else if (kind === 'oct') grid = genRugOct(randi(18, 26));
      else { grid = Math.random() < 0.5 ? PELT : PELT.map(r => r.slice().reverse()); gp = PELT_PAL; }
      const p = spot(grid[0].length + 30, grid[0].length * 0.9); if (p) gPaint(g, grid, gp, p.x - grid[0].length, p.y - grid.length);
    }
    // 깨진 바닥판
    for (let i = 0; i < randi(2, 5) * area; i++) { const p = spot(20, 0); if (!p) continue; for (let k = 0; k < randi(4, 9); k++) { g.fillStyle = pick(['#121017', '#0b0a0e', '#3a3642']); g.fillRect(p.x + randi(-8, 8) * 2, p.y + randi(-4, 4) * 2, 2 * randi(1, 3), 2); } }
    // 핏자국 웅덩이 (도트)
    for (let i = 0; i < randi(0, 3) * area; i++) { const p = spot(30, 0); if (p) scatterPatch(g, p.x, p.y, randi(10, 22), randi(6, 12), ['#4a0c12', '#5a1016', '#3a080c'], 0.6); }
    // 뼈 · 해골
    for (let i = 0; i < randi(1, 4) * area; i++) { const p = spot(20, 6); if (p) gPaint(g, BONES, PROP_MAPS.deerSkull[1], p.x, p.y); }
    for (let i = 0; i < randi(0, 2) * area; i++) { const p = spot(20, 6); if (p) gPaint(g, fromRows(['.kkk.', 'kWWWk', 'kkWkk', 'kWWWk', '.kWk.']), PROP_MAPS.deerSkull[1], p.x, p.y); }
    // 바닥 촛불 무리 (벽 가까이)
    for (let i = 0; i < randi(0, 3); i++) { const x = rand(A.x0 + 30, A.x1 - 30), y = pick([A.y0 + 12, A.y1 - 14]); if (busy(x, y, 8)) continue; gPaint(g, CANDLES, { W: '#e8e0c8', k: '#0b0a0e', o: '#ffc060' }, x, y - 10); fl.push({ x: x + 6, y: y - 6, r: 44, a: 0.45, c: '255,190,90', ca: 0.14, flick: true }); }
    // 잔해 조각
    for (let i = 0; i < 6 * area; i++) { const p = spot(10, 0); if (p) { g.fillStyle = pick(['#2a2731', '#3a3642', '#4d4858']); g.fillRect(p.x, p.y, 2 * randi(1, 3), 2 * randi(1, 2)); } }
  }
  // 성채 윗벽 장식: 창문 자리마다 창·태피스트리·방패·초상화·사슬·해골 벽감 중 하나
  function paintCastleWall(g) {
    const T0 = A.y0 - 100;
    for (let i = 0; i < PILLARS.length - 1; i++) {
      const mx = Math.round((PILLARS[i] + PILLARS[i + 1]) / 4) * 2;
      if (Math.abs(mx - DOOR.n.x) < 8) continue;
      const k = ROOMSTYLE.wall ? ROOMSTYLE.wall[i % ROOMSTYLE.wall.length] : 'window';
      if (k === 'window') continue;
      // 창을 벽돌로 덮고 장식을 건다
      g.fillStyle = '#121017'; g.fillRect(mx - 14, T0 + 2, 28, 40);
      for (let y = T0 + 2; y < T0 + 42; y += 8) for (let x = mx - 14 + ((y / 8) % 2) * 9 - 9; x < mx + 14; x += 18) { g.fillStyle = '#2a2731'; g.fillRect(Math.max(mx - 14, x), y, Math.min(17, mx + 14 - Math.max(mx - 14, x)), 7); }
      const m = PROP_MAPS[k];
      const grid = fromRows(m[0]), w = grid[0].length * 2, h = grid.length * 2;
      gPaint(g, grid, m[1], mx - w / 2, T0 + 30 - h / 2 + (k === 'tapestry' ? 6 : 0));
    }
  }
  function drawFireflies() {
    if (G.stage !== 1 || !G.flies) return;
    for (const f of G.flies) {
      const x = f.x + Math.sin(time * f.s + f.p) * f.rx, y = f.y + Math.sin(time * f.s * 1.3 + f.p * 2) * f.ry, on = Math.sin(time * 2 + f.p) > -0.2;
      if (!on) continue; f.cx = x; f.cy = y;
      ctx.fillStyle = '#e8ff8a'; ctx.fillRect(Math.round(x) & ~1, Math.round(y) & ~1, 2, 2);
    }
  }
  // ---------------------------------------------------------------- 적 투사체 (v0.37): 조명 위에 2px 도트로, 검은 외곽선 + 밝은 심 + 깜빡이는 테두리 + 잔상
  // ================================================================ v1.17 최적화: 칸 무더기를 한 장으로 모아 그리기
  // fillRect를 수백 번 부르던 이펙트(텔레포터 빛기둥·보물 기둥·깃발·버프 고리)를 메모리 버퍼에 칠한 뒤 drawImage 한 번으로. 겉모습은 같음
  // __proto.opt = false 로 끄면 예전처럼 fillRect로 바로 그림 (같은 화면 비교용)
  let OPT = true;
  const LY = { buf: null, cap: 0, cv: null, g: null, imgs: new Map() };
  function pxLayer(x0, y0, w, h, add) {
    x0 = Math.floor(x0); y0 = Math.floor(y0); w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
    if (!OPT) return { rect(x, y, rw, rh, r, g, b, a) { ctx.fillStyle = `rgba(${r},${g},${b},${a})`; ctx.fillRect(x, y, rw, rh); }, flush() {} };
    const n = w * h * 4; if (LY.cap < n) { LY.buf = new Float32Array(n); LY.cap = n; } else LY.buf.fill(0, 0, n);
    const B = LY.buf; let any = false;
    return {
      rect(x, y, rw, rh, r, g, b, a) {
        if (a <= 0) return; any = true;
        let xa = Math.max(0, x - x0), ya = Math.max(0, y - y0); const xb = Math.min(w, x - x0 + rw), yb = Math.min(h, y - y0 + rh);
        const pr = r * a, pg = g * a, pb = b * a, ia = 1 - a;
        for (let yy = ya; yy < yb; yy++) for (let xx = xa, i = (yy * w + xa) * 4; xx < xb; xx++, i += 4) {
          if (add) { B[i] += pr; B[i + 1] += pg; B[i + 2] += pb; B[i + 3] += a; }
          else { B[i] = pr + B[i] * ia; B[i + 1] = pg + B[i + 1] * ia; B[i + 2] = pb + B[i + 2] * ia; B[i + 3] = a + B[i + 3] * ia; }
        }
      },
      flush() {
        if (!any) return;
        const key = w + 'x' + h; let img = LY.imgs.get(key); if (!img) { if (LY.imgs.size > 48) LY.imgs.clear(); img = new ImageData(w, h); LY.imgs.set(key, img); }
        const d = img.data;
        for (let i = 0; i < n; i += 4) { const A = B[i + 3]; if (A <= 0) { d[i + 3] = 0; continue; } const k = 1 / A; d[i] = B[i] * k; d[i + 1] = B[i + 1] * k; d[i + 2] = B[i + 2] * k; d[i + 3] = (A > 1 ? 1 : A) * 255; }
        if (!LY.cv || LY.cv.width < w || LY.cv.height < h) { [LY.cv, LY.g] = mkCanvas(Math.max(w, LY.cv ? LY.cv.width : 0), Math.max(h, LY.cv ? LY.cv.height : 0)); }
        LY.g.putImageData(img, 0, 0); ctx.drawImage(LY.cv, 0, 0, w, h, x0, y0, w, h);
      } };
  }
  const RGBN = new Map(); // 'r,g,b' 문자열 → 숫자 배열
  const rgbN = c => { let v = RGBN.get(c); if (!v) { v = c.split(',').map(Number); RGBN.set(c, v); } return v; };
  const HEXN = new Map();
  const hexN = c => { let v = HEXN.get(c); if (!v) { v = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; HEXN.set(c, v); } return v; };
  // 둥근 판(투사체 등): 반지름·색·좌표 짝홀마다 한 번만 칠해 두고 붙임
  const DISC = new Map();
  function pxDisc(cx, cy, r, col) {
    const rx = Math.round(cx), ry = Math.round(cy);
    if (!OPT) { ctx.fillStyle = col; const R = r * r; for (let y = -r; y <= r; y += 2) for (let x = -r; x <= r; x += 2) if (x * x + y * y <= R + 1) ctx.fillRect((Math.round(cx + x)) & ~1, (Math.round(cy + y)) & ~1, 2, 2); return; }
    const px = rx & 1, py = ry & 1, key = r + '|' + col + '|' + px + py; let e = DISC.get(key);
    if (!e) { const S = 2 * r + 6, [c, g] = mkCanvas(S, S), o = r + 2, R = r * r; g.fillStyle = col; let minX = 1e9, minY = 1e9;
      for (let y = -r; y <= r; y += 2) for (let x = -r; x <= r; x += 2) if (x * x + y * y <= R + 1) { const X = ((px + x) & ~1), Y = ((py + y) & ~1); g.fillRect(X + o, Y + o, 2, 2); }
      e = { c, o }; if (DISC.size > 200) DISC.clear(); DISC.set(key, e); }
    ctx.drawImage(e.c, rx - px - e.o, ry - py - e.o);
  }

  // v1.05 투사체·방향 화살표 도트 (회전은 rotW가 칸 단위로)
  const PROJ_W = (() => {
    const arrow = head => cellWeapon(14, 5, 7, 2, { k: '#0b0a0e', w: '#d8bd82', W: '#a8875a', m: head, M: '#ffffff', r: '#a92c30', R: '#e85a48' }, put => {
      for (let x = 2; x <= 9; x++) put(x, 2, 'w'); put(1, 2, 'W'); for (const y of [1, 2, 3]) put(10, y, 'm'); put(11, 2, 'm'); put(12, 2, 'M');
      for (const y of [1, 3]) { put(0, y, 'r'); put(1, y, 'r'); put(2, y, 'R'); } });
    const spear = head => cellWeapon(20, 5, 9, 2, { k: '#0b0a0e', o: '#9a673d', O: '#6a4428', g: '#d7a653', m: head, M: '#f0e5c8' }, put => {
      for (let x = 0; x <= 12; x++) put(x, 2, x === 0 ? 'O' : 'o'); for (const x of [6, 9]) for (const y of [1, 2, 3]) put(x, y, 'g');
      for (const y of [1, 2, 3]) { put(13, y, 'm'); put(14, y, 'm'); } put(15, 1, 'm'); put(15, 2, 'M'); put(15, 3, 'm'); put(16, 2, 'm'); put(17, 2, 'M'); });
    return { arrow: arrow('#c8ccd4'), arrowB: arrow('#ffffff'), spear: spear('#c8cbd0'), spearB: spear('#fff4dc') };
  })();
  const TRI_W = {}, triW = (col, n) => TRI_W[col + n] || (TRI_W[col + n] = cellWeapon(n + 2, n * 2 + 3, 1 + (n >> 1), n + 1, { k: '#000000', c: `rgb(${col})` }, put => { for (let x = 0; x <= n; x++) for (let y = -(n - x); y <= n - x; y++) put(x + 1, n + 1 + y, 'c'); }));
  function drawEProjs() {
    const blink = Math.floor(time * 14) % 2;
    for (const pr of G.eproj) {
      const gx = Math.round(pr.x) & ~1, gy = Math.round(pr.y) & ~1, hy = pr.y - 10;
      // 바닥 그림자 (날아가는 높이를 보여 준다)
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(gx - 4, gy, 8, 2); ctx.fillRect(gx - 2, gy - 2, 4, 2);
      if (pr.kind === 'arrow' || pr.kind === 'spear') {
        drawBlade(pr.kind === 'arrow' ? (blink ? PROJ_W.arrowB : PROJ_W.arrow) : (blink ? PROJ_W.spearB : PROJ_W.spear), gx, hy, pr.ang); // v1.05 칸 단위 회전 도트
        continue;
      }
      if (pr.kind === 'quill') {
        const ux = Math.cos(pr.ang), uy = Math.sin(pr.ang), L = 12;
        ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let k = L; k < L + 14; k += 2) ctx.fillRect(Math.round(pr.x - ux * k) & ~1, Math.round(hy - uy * k) & ~1, 2, 2);
        ctx.fillStyle = '#0b0a0e'; for (let k = 0; k <= L; k += 2) ctx.fillRect((Math.round(pr.x - ux * k) & ~1) - 2, (Math.round(hy - uy * k) & ~1) - 2, 6, 6);
        ctx.fillStyle = '#fff4dc'; for (let k = 2; k <= L; k += 2) ctx.fillRect((Math.round(pr.x - ux * k) & ~1) - 1, (Math.round(hy - uy * k) & ~1) - 1, 4, 4);
        ctx.fillStyle = blink ? '#ffffff' : '#ffc890'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 6, 6);
        continue;
      }
      if (pr.kind === 'rock') {
        pr.hist.forEach((q, i) => { ctx.fillStyle = `rgba(200,190,170,${0.25 * (i + 1) / pr.hist.length})`; ctx.fillRect(Math.round(q.x) & ~1, Math.round(q.y - 10) & ~1, 2, 2); });
        pxDisc(pr.x, hy, 9, '#0b0a0e'); pxDisc(pr.x, hy, 7, blink ? '#d0c8d8' : '#9a94a4'); pxDisc(pr.x, hy, 5, '#7a7484'); ctx.fillStyle = '#d0c8d8'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 4, 2);
        if (blink) { ctx.fillStyle = '#ffffff'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 2, 2); }
        continue;
      }
      const green = pr.kind === 'acid' || pr.kind === 'bile';
      const body = green ? (pr.kind === 'bile' ? '#c8e040' : '#80e040') : '#ff3048', rim = green ? '#f0ffb0' : '#ffd0d8', trail = green ? '150,230,60' : '255,60,80';
      pr.hist.forEach((q, i) => { const k = (i + 1) / pr.hist.length; ctx.fillStyle = `rgba(${trail},${0.55 * k})`; const rr = Math.max(2, Math.round(pr.r * k)); ctx.fillRect((Math.round(q.x) & ~1) - (rr & ~1) / 2, (Math.round(q.y - 10) & ~1) - (rr & ~1) / 2, rr & ~1 || 2, rr & ~1 || 2); });
      const r = Math.max(4, Math.round(pr.r + 1));
      pxDisc(pr.x, hy, r + 3, '#0b0a0e');
      pxDisc(pr.x, hy, r + 1, blink ? rim : body);
      pxDisc(pr.x, hy, r - 1, body);
      ctx.fillStyle = '#ffffff'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 4, 4);
    }
  }
  function drawPrompt() {
    const p = G.prompt; if (!p || mode !== 'play') return;
    ctx.font = '9px Galmuri9'; ctx.textAlign = 'center';
    const w = ctx.measureText(p.t).width + 10, x = Math.round(p.x), y = Math.round(p.y + Math.sin(time * 4) * 1.5);
    ctx.fillStyle = 'rgba(10,8,14,.85)'; ctx.fillRect(x - w / 2, y - 10, w, 14);
    ctx.strokeStyle = p.bad ? '#a04040' : '#c9a24a'; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2 + 0.5, y - 9.5, w - 1, 13);
    ctx.fillStyle = p.bad ? '#ff9090' : '#ffe9b0'; ctx.fillText(p.t, x, y);
  }
  function roomEnts(ents) {
    const R = G.dun && G.dun.cur; if (!R) return;
    if (R.sprites) for (const s of R.sprites) ents.push({ y: s.sy, d: s.ob && s.ob.tower ? () => { const P = G.player, b = s.ob, under = P.x > b.x0 - 6 && P.x < b.x1 + 6 && P.y > b.y0 - 50 && P.y < b.y1; ctx.globalAlpha = under ? 0.55 : 1; ctx.drawImage(s.cv, s.x, s.y); ctx.globalAlpha = 1; } : () => ctx.drawImage(s.cv, s.x, s.y) });
    if (R.props) for (const p of R.props) if (!PROPS[p.name].pit) ents.push({ y: p.y, d: () => drawProp(p) });
    if (G.drums) for (const dm of G.drums) ents.push({ y: dm.y, d: () => drawWarDrum(dm) });
    if (R.chest) ents.push({ y: R.chest.y, d: () => drawChest(R.chest) });
    if (R.socks) for (const s of R.socks) ents.push({ y: s.y, d: () => drawSock(s) });
    if (R.srp) for (const s of R.srp) ents.push({ y: s.y, d: () => drawSR(s) });
    if (R.type === 'shop') { ents.push({ y: R.keeper ? R.keeper.y - 5 : CY - 28, d: () => drawShopKeeper(R) }); for (const s of R.shop) ents.push({ y: s.y, d: () => drawShopItem(s) }); }
    if (R.type === 'reward' && R.chest) ents.push({ y: R.chest.y - 1, d: () => drawTreasure(R) });
    if (R.type === 'rest' && G.bonfire) ents.push({ y: G.bonfire.y, d: () => drawCampFire(G.bonfire) });
  }
  function roomLights(lights) {
    const R = G.dun && G.dun.cur; if (!R) return;
    srLights(lights, R); if (R.type === 'shop') lights.push({ x: CX, y: CY + 40, r: 140, a: 0.45, c: '255,200,140', ca: 0.06 });
    if (R.type === 'reward' && R.chest) { lights.push({ x: R.chest.x, y: R.chest.y - 10, r: R.chest.opened ? 80 : 120, a: 0.75, c: '255,210,110', ca: R.chest.opened ? 0.1 : 0.22 }); }
    if (R.type === 'rest' && G.bonfire) lights.push({ x: G.bonfire.x, y: G.bonfire.y - 10, r: 150 + Math.sin(time * 8) * 6, a: 0.85, c: '255,150,60', ca: 0.22 });
    if (R.exit) { lights.push({ x: R.exit.x, y: R.exit.y, r: 90, a: 0.7, c: '255,120,60', ca: 0.22 }); lights.push({ x: R.exit.x, y: R.exit.y - 70, r: 60, a: 0.45, c: '255,170,90', ca: 0.14 }); }
    if (R.tele && R.cleared) { lights.push({ x: R.tele.x, y: R.tele.y, r: 70, a: 0.6, c: '120,180,255', ca: 0.18 }); lights.push({ x: R.tele.x, y: R.tele.y - 60, r: 50, a: 0.4, c: '150,200,255', ca: 0.1 }); }
    if (R.props) for (const p of R.props) { const L = PROPS[p.name].light; if (L) lights.push({ x: p.x, y: p.y + L.dy, r: L.r + Math.sin(time * 9 + p.x) * 3, a: 0.8, c: L.c, ca: L.ca }); }
    if (G.flatLights) for (const l of G.flatLights) lights.push(l.flick ? Object.assign({}, l, { r: l.r + Math.sin(time * 10 + l.x) * 2 }) : l);
    if (G.stage === 1 && G.flies) for (const f of G.flies) if (f.cx != null) lights.push({ x: f.cx, y: f.cy, r: 14, a: 0.35, c: '220,255,120', ca: 0.2 });
    if (R.socks) for (const s of R.socks) { const on = s.dual ? G.dun.sock[0] || G.dun.sock[1] : G.dun.sock[s.i]; lights.push({ x: s.x, y: s.y - SOCK_H[G.stage] + 6, r: on ? 64 + Math.sin(time * 9 + s.i) * 3 : 30, a: on ? 0.8 : 0.35, c: on ? SK().rgb : '200,200,220', ca: on ? 0.22 : 0.05 }); }
    if (R.chest && !R.chest.opened) lights.push({ x: R.chest.x, y: R.chest.y - 10, r: 60, a: 0.6, c: R.chest.kind === 'secret' ? '200,140,255' : '255,200,110', ca: 0.18 });
    if (R.chest && R.chest.kind === 'boss' && !R.chest.fall) lights.push({ x: R.chest.x, y: R.chest.y - 10, r: R.chest.opened ? 90 : 130, a: 0.8, c: '255,190,90', ca: R.chest.opened ? 0.1 : 0.25 });
    if (G.stage >= 2) for (const b of R.obs) if (b.t === 'post') continue; else if (b.t === 'pit') lights.push({ x: b.x, y: b.y0 + 10, r: Math.max(b.w, b.h) * 0.55, a: 0.22 }); else lights.push({ x: b.x, y: b.y - (b.t === 'pillar' ? 20 : 8), r: b.c ? 42 : Math.max(b.w, b.h) * 0.6 + 20, a: 0.28 });
    for (const d in DIRS) { const st = doorState(R, d); if (st === 'open' || st === 'sealed') { const q = doorIn(d, 6); lights.push({ x: q.x, y: q.y, r: 50, a: 0.45, c: st === 'sealed' ? '255,60,60' : null, ca: 0.1 }); } }
  }

  // ---------- 미니맵 · 지도 · 순간이동
  const shapeFit = r => { const sh = SHAPES[r.shape] || SHAPES.field; return { w: sh.w >= 1300 ? 1 : sh.w >= 1000 ? 0.82 : sh.w >= 500 ? 0.6 : 0.36, h: sh.h >= 700 ? 1 : sh.h >= 500 ? 0.82 : sh.h >= 300 ? 0.6 : 0.36 }; };
  const roomColor = (r) => ({ boss: '#a02a34', shop: '#b08a2a', rest: '#c06a2a', reward: '#c0a040', secret: '#8a5ac0', elite: '#7a2a40', survive: '#5a4a7a', start: '#4a6a4a' }[r.type] || '#3a3444');
  const FIGHT_T = new Set(['combat', 'elite', 'survive', 'boss']);
  // 클리어 표시: 금색 체크 (검은 외곽선, s = 칸 크기)
  function drawCheck(x, y, s) {
    const cells = [[0, 2], [1, 3], [2, 2], [3, 1], [4, 0]], put = (c, col, o) => { ctx.fillStyle = col; for (const [cx, cy] of cells) { ctx.fillRect(x + cx * s - o, y + cy * s - o, s + o * 2, s + o * 2); ctx.fillRect(x + cx * s - o, y + (cy + 1) * s - o, s + o * 2, s + o * 2); } };
    put(cells, '#000', 1); put(cells, '#7dff9a', 0);
  }
  function drawMinimap() {
    const D = G.dun; if (!D) return;
    const W0 = 140, H0 = 74, x0 = VW - 8 - W0, y0 = 66, cw = 16, ch = 11, gap = 4;
    ctx.save();
    ctx.fillStyle = 'rgba(8,6,12,.72)'; ctx.fillRect(x0, y0, W0, H0);
    ctx.strokeStyle = 'rgba(201,162,74,.5)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, W0 - 1, H0 - 1);
    ctx.beginPath(); ctx.rect(x0 + 1, y0 + 1, W0 - 2, H0 - 2); ctx.clip();
    const cx = x0 + W0 / 2, cy = y0 + H0 / 2, cur = D.cur;
    const pos = r => ({ x: cx + (r.gx - cur.gx) * (cw + gap), y: cy + (r.gy - cur.gy) * (ch + gap) });
    ctx.fillStyle = '#6a6478';
    for (const r of D.rooms) { if (!r.visited) continue; for (const d in r.doors) { const id = r.doors[d]; if (id == null || hiddenDoor(r, d)) continue; const o = D.rooms[id]; if (!o.seen) continue; const p = pos(r); ctx.fillRect(Math.round(p.x + DIRS[d][0] * (cw / 2 + gap / 2)) - 1, Math.round(p.y + DIRS[d][1] * (ch / 2 + gap / 2)) - 1, 2, 2); } }
    for (const r of D.rooms) {
      if (!r.seen) continue;
      const sf = shapeFit(r), rw = Math.max(4, Math.round(cw * sf.w / 2) * 2), rh = Math.max(4, Math.round(ch * sf.h / 2) * 2), p = pos(r), x = Math.round(p.x - rw / 2), y = Math.round(p.y - rh / 2);
      if (r.visited) { ctx.fillStyle = roomColor(r); ctx.fillRect(x, y, rw, rh); }
      else { ctx.fillStyle = r.type === 'boss' ? 'rgba(160,40,52,.35)' : 'rgba(40,36,48,.9)'; ctx.fillRect(x, y, rw, rh); ctx.strokeStyle = r.type === 'boss' ? '#a02a34' : '#5a5466'; ctx.strokeRect(x + 0.5, y + 0.5, rw - 1, rh - 1); }
      if (r === cur) { ctx.strokeStyle = Math.floor(time * 4) % 2 ? '#ffe39a' : '#fff'; ctx.strokeRect(x - 0.5, y - 0.5, rw + 1, rh + 1); }
      if (r.visited && r.tele && r.cleared) { ctx.fillStyle = '#9fd2ff'; ctx.fillRect(x + rw - 4, y + 1, 3, 3); }
      if (r.exit) { ctx.fillStyle = '#ff7a40'; ctx.fillRect(x + 1, y + 1, 3, 3); }
      if (r.chest && !r.chest.opened && r.visited) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(x + 1, y + 1, 3, 3); }
      if (r.cleared && FIGHT_T.has(r.type)) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y, rw, rh); drawCheck(Math.round(p.x - 5), Math.round(p.y - 3), 2); }
    }
    ctx.restore();
    ctx.font = '8px Galmuri7'; ctx.textAlign = 'right'; ctx.fillStyle = '#000'; ctx.fillText('TAB 지도', VW - 11, y0 + H0 + 10); ctx.fillStyle = '#8a8496'; ctx.fillText('TAB 지도', VW - 12, y0 + H0 + 9);
  }
  const teleRooms = () => G.dun.rooms.filter(r => r.visited && r.tele && r.cleared);
  function openMap() {
    if (mode !== 'play' || G.trans) return;
    mode = 'map'; sfx('blip');
    const L = teleRooms(); G.mapSel = L.includes(G.dun.cur) ? G.dun.cur : L[0] || null;
    for (const k in pressed) pressed[k] = false;
  }
  function closeMap() { mode = 'play'; for (const k in pressed) pressed[k] = false; }
  function mapLayout() {
    const D = G.dun, cw = 50, ch = 32, gap = 14, cols = D.bx1 - D.bx0 + 1, rows = D.by1 - D.by0 + 1;
    const ox = VW / 2 - (cols * (cw + gap) - gap) / 2, oy = 70 + Math.max(0, (VH - 150 - rows * (ch + gap)) / 2);
    return { cw, ch, gap, pos: r => ({ x: ox + (r.gx - D.bx0) * (cw + gap), y: oy + (r.gy - D.by0) * (ch + gap) }) };
  }
  function updateMap() {
    if (take('tab') || take('escape') || take('m')) { closeMap(); return; }
    const L = teleRooms();
    const mv = [['arrowup', 'w', 0, -1], ['arrowdown', 's', 0, 1], ['arrowleft', 'a', -1, 0], ['arrowright', 'd', 1, 0]];
    for (const [k1, k2, dx, dy] of mv) if (take(k1) || take(k2)) {
      const s = G.mapSel || G.dun.cur; let best = null, bd = 1e9;
      for (const r of L) { const vx = r.gx - s.gx, vy = r.gy - s.gy, along = vx * dx + vy * dy; if (along <= 0) continue; const sc = along + Math.abs(vx * dy - vy * dx) * 2; if (sc < bd) { bd = sc; best = r; } }
      if (best) { G.mapSel = best; sfx('blip'); }
    }
    let go = take('enter') || take(' ') || take('f');
    if (take('j') && mouse.active > 0) {
      const M = mapLayout();
      const hit = L.find(r => { const p = M.pos(r); return mouse.x >= p.x && mouse.x <= p.x + M.cw && mouse.y >= p.y && mouse.y <= p.y + M.ch; });
      if (hit) { G.mapSel = hit; go = true; }
    }
    if (go && G.mapSel) {
      if (G.sealed) { sfx('block'); lootFeed('전투 중에는 순간이동할 수 없다', '#ff7070'); return; }
      const t = G.mapSel; closeMap();
      if (t !== G.dun.cur) goRoom(t, null, true);
    }
  }
  function drawMapOverlay() {
    const D = G.dun, M = mapLayout(), L = teleRooms();
    ctx.fillStyle = 'rgba(6,5,10,.86)'; ctx.fillRect(0, 0, VW, VH);
    ctx.textAlign = 'center'; ctx.font = 'bold 12px Galmuri11'; ctx.fillStyle = '#ffe39a';
    ctx.fillText(`STAGE ${G.stage} · ${STG().n}`, VW / 2, 40);
    ctx.font = '8px Galmuri7'; ctx.fillStyle = '#9a92a8';
    ctx.fillText(`${ER().foe} ${D.eliteDone}/2 · ${sealHud()} · ${D.bossOpen ? '보스 방 열림' : '보스 방 봉인'} · 골드 ${G.gold}G`, VW / 2, 54);
    // 통로
    ctx.fillStyle = '#5a5466';
    for (const r of D.rooms) { if (!r.visited) continue; const p = M.pos(r); for (const d in r.doors) { const id = r.doors[d]; if (id == null || hiddenDoor(r, d) || !D.rooms[id].seen) continue; const [dx, dy] = DIRS[d]; ctx.fillRect(Math.round(p.x + M.cw / 2 + dx * (M.cw / 2 + M.gap / 2) - (dx ? M.gap / 2 : 2)), Math.round(p.y + M.ch / 2 + dy * (M.ch / 2 + M.gap / 2) - (dy ? M.gap / 2 : 2)), dx ? M.gap : 4, dy ? M.gap : 4); } }
    for (const r of D.rooms) {
      if (!r.seen) continue;
      const sf = r.visited ? shapeFit(r) : { w: 0.82, h: 0.82 }, rw = Math.round(M.cw * sf.w), rh = Math.round(M.ch * sf.h), p0 = M.pos(r), x = Math.round(p0.x + (M.cw - rw) / 2), y = Math.round(p0.y + (M.ch - rh) / 2);
      ctx.fillStyle = r.visited ? roomColor(r) : 'rgba(30,27,36,.95)'; ctx.fillRect(x, y, rw, rh);
      if (r.cleared && FIGHT_T.has(r.type)) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x, y, rw, rh); }
      ctx.strokeStyle = r.visited ? 'rgba(255,255,255,.15)' : r.type === 'boss' ? '#a02a34' : '#5a5466'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, rw - 1, rh - 1);
      ctx.font = '8px Galmuri7'; ctx.fillStyle = r.visited ? '#f0e8d8' : r.type === 'boss' ? '#ff8080' : '#6a6478';
      ctx.fillText(r.visited || r.type === 'boss' ? roomTag(r.type) : '?', x + rw / 2, y + rh / 2 + 3);
      if (r.visited && r.tele) { ctx.fillStyle = r.cleared ? '#9fd2ff' : '#4a4560'; ctx.fillRect(x + rw - 6, y + 2, 4, 4); }
      if (r.visited && r.chest && !r.chest.opened) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(x + 2, y + 2, 4, 4); }
      if (r.cleared && FIGHT_T.has(r.type)) { drawCheck(x + rw - 5, y + rh - 6, 2); ctx.font = "8px Galmuri7"; }
      if (r === D.cur) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - 1, rw + 2, rh + 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + rw / 2 - 2, y - 7, 4, 4); }
      if (r === G.mapSel) { ctx.strokeStyle = Math.floor(time * 5) % 2 ? '#9fd2ff' : '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x - 3, y - 3, rw + 6, rh + 6); }
    }
    ctx.font = '8px Galmuri7'; ctx.fillStyle = '#8a8496';
    ctx.fillText(L.length ? '방향키·WASD 텔레포터 선택 · ENTER/클릭 순간이동 · TAB 닫기' : '방을 클리어하면 그 방의 텔레포터가 켜진다 · TAB 닫기', VW / 2, VH - 26);
    ctx.fillStyle = '#9fd2ff'; ctx.fillRect(VW / 2 - 150, VH - 44, 4, 4); ctx.fillStyle = '#8a8496'; ctx.textAlign = 'left'; ctx.fillText('텔레포터', VW / 2 - 143, VH - 40);
    ctx.fillStyle = '#ffd34d'; ctx.fillRect(VW / 2 - 80, VH - 44, 4, 4); ctx.fillStyle = '#8a8496'; ctx.fillText('열지 않은 상자', VW / 2 - 73, VH - 40);
    ctx.fillStyle = '#a02a34'; ctx.fillRect(VW / 2 + 10, VH - 44, 4, 4); ctx.fillStyle = '#8a8496'; ctx.fillText('보스', VW / 2 + 17, VH - 40);
    ctx.fillStyle = '#5a5466'; ctx.fillRect(VW / 2 + 50, VH - 44, 4, 4); ctx.fillStyle = '#8a8496'; ctx.fillText('? 가 보지 않은 방', VW / 2 + 57, VH - 40);
    drawCheck(VW / 2 + 140, VH - 46, 1); ctx.fillStyle = '#8a8496'; ctx.fillText('클리어', VW / 2 + 149, VH - 40);
    ctx.textAlign = 'left';
  }
  function drawTransition() {
    const tr = G && G.trans; if (!tr) return;
    const a = tr.phase === 'out' ? tr.t / tr.dur : 1 - tr.t / tr.dur;
    ctx.fillStyle = `rgba(0,0,0,${clamp(a, 0, 1)})`; ctx.fillRect(0, 0, VW, VH);
  }

  function startPhase(p) {
    window.AudioSys.setMood(p === 11 ? (G.stage === 3 ? 'orcboss' : G.stage === 2 ? 'citadelBoss' : 'boss') : p === 5 ? (G.stage === 2 ? 'citadelRest' : 'rest') : p === 10 ? (G.stage === 3 ? 'orcboss' : G.stage === 2 ? 'citadelSurvive' : 'survive') : G.stage === 3 ? 'orc' : G.stage === 2 ? 'citadel' : 'field', true);
    G.phase = p; G.enemies = []; G.tele = []; G.hazards = []; G.proj = []; G.eproj = []; G.bonfire = null; G.vortex = null; G.boss = null;
    G.waveIdx = 0; G.spawning = 0; G.phaseT = 0; G.surviveT = 0; G.spawnT = 0; G.hazardT = 2;
    G.phaseState = 'intro';
    const P = G.player; P.state = 'idle'; P.dead = false; P.hp = Math.max(P.hp, 1);
    if (p === 11) { banner(STG().boss, STG().bossSub); $('bossName').textContent = STG().boss; sfx('boss'); G.bossTime = 300; }
    else banner(`STAGE ${G.stage} · PHASE ${p}`, p === 1 ? `${STG().n} — ${phaseLabel(p)}` : phaseLabel(p));
    if (p === 5) { G.bonfire = { x: clamp(P.x + 40, A.x0 + 30, A.x1 - 30), y: clamp(P.y - 20, A.y0 + 30, A.y1 - 30) }; P.hp = G.stats.hp; }
  }
  function phaseScale() { const p = Math.min(G.phase, 10); return { hp: 1 + 0.07 * (p - 1), atk: 1 + 0.05 * (p - 1) }; }

  function spawnPoint() {
    // 65%는 벽 가장자리·문 쪽에서 몰려 들어오고, 나머지는 방 안 빈자리. 플레이어와는 적당히 떨어진 곳
    const P = G.player, dmin = clamp(Math.min(A.x1 - A.x0, A.y1 - A.y0) * 0.45, 90, 200), obs = G.obs || [];
    const doors = G.dun && G.dun.cur ? Object.keys(G.dun.cur.doors).filter(d => G.dun.cur.doors[d] != null) : [];
    let best = null, bd = -1;
    for (let i = 0; i < 60; i++) {
      let x, y;
      const r = Math.random();
      if (r < 0.25 && doors.length) { const q = doorIn(pick(doors), 30); x = q.x + rand(-24, 24); y = q.y + rand(-14, 14); }
      else if (r < 0.65) { const side = randi(0, 3); x = side === 0 ? A.x0 + 24 : side === 1 ? A.x1 - 24 : rand(A.x0 + 24, A.x1 - 24); y = side === 2 ? A.y0 + 24 : side === 3 ? A.y1 - 24 : rand(A.y0 + 24, A.y1 - 24); }
      else { x = rand(A.x0 + 22, A.x1 - 22); y = rand(A.y0 + 22, A.y1 - 22); }
      x = clamp(x, A.x0 + 18, A.x1 - 18); y = clamp(y, A.y0 + 18, A.y1 - 18);
      if (obsHitL(obs, x, y, 18)) continue;
      const d = Math.hypot(x - P.x, y - P.y);
      if (d >= dmin && d < 480) return { x, y };
      if (d > bd) { bd = d; best = { x, y }; }
    }
    return best || freePoint(CX, CY);
  }
  function queueSpawn(type, at) {
    const pt = at || spawnPoint();
    G.spawning++;
    G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: isEliteT(type) ? 16 : type === 'bigslime' ? 13 : 10, t: 0, dur: 0.7, owner: null, onFire: () => { G.spawning--; G.enemies.push(makeEnemy(type, pt.x, pt.y)); burst(pt.x, pt.y - 6, '#2a1830', 10); } });
  }
  function spawnWave(w) { for (const [type, n] of w) for (let i = 0; i < n; i++) queueSpawn(type); }

  function updatePhase(dt) {
    G.phaseT += dt;
    const p = G.phase, alive = G.enemies.filter(e => !e.dead).length;
    if (G.phaseState === 'intro') {
      if (G.phaseT > 1.4) {
        G.phaseState = 'run'; G.phaseT = 0;
        if (STG().phases[p]) spawnWave(STG().phases[p][0]);
        if (p === 5) setTimeout(() => { if (G && G.phase === 5 && mode === 'play') openRest(); }, 900);
        if (p === 11) { if (G.stage === 1) spawnSlimeKing(); else if (G.stage === 3) spawnKrugash(); else spawnBoss(); }
      }
      return;
    }
    if (G.phaseState !== 'run') return;
    const PH = STG().phases;
    if (PH[p]) {
      if (alive === 0 && G.spawning === 0) {
        G.waveIdx++;
        if (G.waveIdx < PH[p].length) spawnWave(PH[p][G.waveIdx]);
        else phaseClear();
      }
    } else if (p === 10) {
      G.surviveT += dt;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && alive + G.spawning < STG().surviveMax) { G.spawnT = G.stage === 1 ? 1.7 : 1.35; let r = Math.random(); for (const [t, w] of STG().survive) { if (r < w) { queueSpawn(t); break; } r -= w; } }
      if (G.surviveT >= 60) {
        G.enemies.forEach(e => { if (!e.dead) killEnemy(e, true); });
        G.tele = [];
        phaseClear();
      }
    }
  }
  function phaseClear() {
    G.phaseState = 'clear'; G.phaseT = 0;
    banner('PHASE CLEAR', G.phase === 10 ? '무언가 다가온다…' : '');
    setTimeout(() => { if (G && mode === 'play' && G.phaseState === 'clear') startPhase(G.phase + 1); }, 1600);
  }

  // ---------------------------------------------------------------- 무기 휘두르기 (공용)
  // 적·보스 무기: bladeAng를 목표 각도로 따라가고, swing이 있으면 빠르게 휘두르며 잔상을 남긴다
  function startSwing(e, toAng, side, dur) {
    let d = angDiff(toAng, e.bladeAng);
    if (side > 0 && d < 0) d += TAU; if (side < 0 && d > 0) d -= TAU;
    e.sw = { from: e.bladeAng, d, t: 0, dur };
  }
  function updateBlade(e, dt) {
    if (e.sw) {
      e.sw.t += dt;
      e.bladeAng = e.sw.from + e.sw.d * easeOut(e.sw.t / e.sw.dur);
      e.trail.push({ a: e.bladeAng, t: 0.11 });
      if (e.sw.t >= e.sw.dur) e.sw = null;
    } else e.bladeAng = lerpAng(e.bladeAng, e.bladeTarget, dt * 9);
    for (const s of e.trail) s.t -= dt;
    e.trail = e.trail.filter(s => s.t > 0);
  }

  // ---------------------------------------------------------------- 적
  function makeEnemy(type, x, y) {
    const sc = Object.assign({}, phaseScale());
    const base = {
      ghoul: { hp: 60, atk: 10, def: 20, spd: 46, r: 7, kb: 1, blade: 'squire' },
      exec: { hp: 420, atk: 19, def: 60, spd: 38, r: 12, kb: 0.25, grogiMax: 60, blade: 'headsman' }, bearer: { hp: 400, atk: 18, def: 55, spd: 38, r: 11, kb: 0.25, grogiMax: 60, blade: 'pole' }, flag: { hp: 90, atk: 0, def: 0, spd: 0, r: 9, kb: 0 },
      dog: { hp: 42, atk: 12, def: 10, spd: 70, r: 7, kb: 1 },
      butcher: { hp: 380, atk: 22, def: 60, spd: 34, r: 12, kb: 0.25, grogiMax: 60 },
      ghost: { hp: 230, atk: 15, def: 40, spd: 56, r: 8, kb: 0.6 },
      cultist: { hp: 45, atk: 12, def: 10, spd: 40, r: 7, kb: 1 },
      bloat: { hp: 70, atk: 20, def: 5, spd: 30, r: 9, kb: 0.5 },
      slime: { hp: 34, atk: 7, def: 5, spd: 95, r: 7, kb: 1.2 },
      bigslime: { hp: 100, atk: 11, def: 10, spd: 80, r: 11, kb: 0.6 },
      goblin: { hp: 44, atk: 8, def: 10, spd: 58, r: 7, kb: 1 },
      gthrower: { hp: 36, atk: 9, def: 5, spd: 46, r: 7, kb: 1 },
      hob: { hp: 300, atk: 16, def: 45, spd: 36, r: 12, kb: 0.3, grogiMax: 55 },
      garcher: { hp: 36, atk: 9, def: 5, spd: 46, r: 7, kb: 1 },
      toxslime: { hp: 40, atk: 7, def: 5, spd: 80, r: 8, kb: 1 },
      gbrute: { hp: 340, atk: 17, def: 45, spd: 34, r: 13, kb: 0.25, grogiMax: 60 },
      boar: { hp: 300, atk: 18, def: 35, spd: 52, r: 12, kb: 0.3, grogiMax: 55 },
      crow: { hp: 24, atk: 9, def: 0, spd: 105, r: 6, kb: 1.5 },
      mother: { hp: 440, atk: 20, def: 50, spd: 24, r: 14, kb: 0.2, grogiMax: 65 },
      orc: { hp: 85, atk: 14, def: 25, spd: 50, r: 8, kb: 0.9 }, othrow: { hp: 55, atk: 13, def: 10, spd: 42, r: 8, kb: 1 }, wolf: { hp: 60, atk: 13, def: 10, spd: 85, r: 7, kb: 1 },
      shaman: { hp: 60, atk: 11, def: 15, spd: 38, r: 8, kb: 1 }, slave: { hp: 30, atk: 7, def: 5, spd: 72, r: 6, kb: 1.2 },
      ocharge: { hp: 240, atk: 20, def: 35, spd: 46, r: 10, kb: 0.5, grogiMax: 30 }, odrum: { hp: 200, atk: 16, def: 30, spd: 34, r: 11, kb: 0.5, grogiMax: 30 }, otroll: { hp: 320, atk: 21, def: 40, spd: 42, r: 12, kb: 0.4, grogiMax: 30 }, ogrip: { hp: 290, atk: 22, def: 45, spd: 38, r: 11, kb: 0.5, grogiMax: 30 },
      urg: { hp: 620, atk: 24, def: 60, spd: 40, r: 18, kb: 0.15, grogiMax: 75 }, troll: { hp: 580, atk: 22, def: 50, spd: 36, r: 20, kb: 0.15, grogiMax: 80 },
    }[type];
    const kind = type === 'hob' ? 'hob' : null;
    if (type === 'hob') type = 'butcher';
    const SM = STG(); sc.hp *= SM.hpMul; sc.atk *= SM.atkMul;
    const ne = {
      type, kind, x, y, z: 0, squash: 0, r: base.r, hp: base.hp * sc.hp, maxHp: base.hp * sc.hp, atk: base.atk * sc.atk, def: base.def, spd: base.spd, kbRes: base.kb,
      state: 'chase', t: 0, cd: rand(0.4, 1.2), vx: 0, vy: 0, flash: 0, dead: false, face: 1, lockAng: 0, hitPlayer: false,
      grogiMax: base.grogiMax || 0, grogi: 0, grogiT: 0, pat: 0, walk: rand(0, 6), lean: 0,
      blade: base.blade || null, bladeAng: 120 * DEG, bladeTarget: 120 * DEG, trail: [], sw: null, rise: 0.35,
    };
    if (type === 'ghoul') { ne.sq = Math.random() < 0.5; if (ne.sq) ne.sv = randi(0, 2); else ne.blade = null; } // v0.96: 감염된 주민과 타락한 종자 반반, 종자는 외형 3종
    orcInit(ne);
    return ne;
  }
  function cancelTele(owner) { G.tele = G.tele.filter(t => t.owner !== owner); G.fx = G.fx.filter(f => !(f.kind === 'lob' && f.owner === owner)); }
  function alertMark(e, h, big) { G.fx.push({ kind: 'alert', o: e, h, s: big ? 3 : 2, t: 0.5, max: 0.5 }); }
  const restAng = e => e.type === 'exec' ? (e.face > 0 ? -115 : -65) * DEG : e.type === 'bearer' && !e.flagRef ? (e.face > 0 ? -78 : -102) * DEG : (e.face > 0 ? 125 : 55) * DEG; // 처형인은 도끼를 어깨에, 기수는 깃대를 세워 듦

  function updateEnemy(e, dt) {
    const P = G.player;
    e.flash = Math.max(0, e.flash - dt); e.rise = Math.max(0, e.rise - dt);
    e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= Math.pow(0.0015, dt); e.vy *= Math.pow(0.0015, dt);
    e.lean *= Math.pow(0.02, dt);
    e.glow = 0;
    for (const t of G.tele) if (t.owner === e) e.glow = Math.max(e.glow, t.t / t.dur);
    if (e.blade) updateBlade(e, dt);
    if (e.type === 'butcher') eliteTick(e, dt);
    if (e.type === 'slime' || e.type === 'bigslime' || e.type === 'toxslime') e.squash = Math.max(0, e.squash - dt);
    if (e.type === 'gbrute') bruteTick(e, dt);
    if (e.type === 'boar') boarTick(e, dt);
    if (e.type === 'crow') crowTick(e, dt);
    if (e.type === 'mother') motherTick(e, dt);
    if (e.orc) orcTick(e, dt);
    if (e.rallyT > 0) { e.rallyT -= dt; if (e.rallyT <= 0 && e.rallied) { e.atk = e.atkBase; e.rallied = false; } }
    if (e.type === 'exec') execTick(e, dt); else if (e.type === 'bearer') bearerTick(e, dt); else if (e.type === 'flag') flagTick(e, dt);
    if (e.haste > 0) { e.haste -= dt; if (Math.random() < dt * 8) G.parts.push({ x: e.x + rand(-5, 5), y: e.y - rand(20, 30), vx: 0, vy: -20, t: 0.3, c: '#ff6040', g: 0, glow: true }); }
    if (e.grogiT > 0) { e.grogiT -= dt; e.bladeTarget = 90 * DEG; if (e.grogiT <= 0) e.state = 'chase'; return; }
    const d = dist(e, P), a = angTo(e, P);
    e.t -= dt; e.cd -= dt;
    const moveTo = (ang, spd) => { if (e.haste > 0) spd *= 1.5; if (e.rallyT > 0) spd *= 1.25; if (e.state === 'chase' && d > 130 && Math.abs(angDiff(ang, a)) < 0.6) spd *= 1.3; ang = steer(e, ang); e.x += Math.cos(ang) * spd * dt; e.y += Math.sin(ang) * spd * dt; e.walk += dt * spd / 7; if (Math.abs(Math.cos(ang)) > 0.2) e.face = Math.cos(ang) > 0 ? 1 : -1; };
    if (e.state === 'chase' && e.blade && !e.sw) e.bladeTarget = restAng(e);
    if (e.state === 'stun') { if (e.t <= 0) e.state = 'chase'; return; }
    if (e.state === 'recover') { if (e.t <= 0) e.state = 'chase'; return; }
    if (e.state === 'hold') {
      if (e.blade && !e.slammed && e.t <= 0.07) { e.slammed = true; const to = e.holdAng + e.face * 70 * DEG; e.bladeAng += angDiff(to, e.bladeAng) * 0.6; startSwing(e, to, e.face, 0.07); } // v0.95 종자: 판정 순간 칼이 내려와 있게
      if (e.t <= 0) { e.slammed = false;
        const tt = { shape: 'cone', x: e.x, y: e.y, ang: e.holdAng, arc: 110 * DEG, r: e.type === 'ghost' ? 38 : 30 };
        e.lean = 0.35 * e.face; e.x += Math.cos(e.holdAng) * 6; e.y += Math.sin(e.holdAng) * 6;
        G.fx.push({ kind: 'claw', x: e.x, y: e.y - 8, ang: e.holdAng, r: e.type === 'ghost' ? 28 : 22, w: 2, glow: true, c: e.type === 'ghost' ? '170,210,255' : '255,200,170', t: 0.18, max: 0.18 });
        dust(e.x + Math.cos(e.holdAng) * 14, e.y + Math.sin(e.holdAng) * 10, 4);
        hitShape(tt, e.atk); e.state = 'recover'; e.t = 0.6; e.cd = rand(0.8, 1.4);
      }
      return;
    }
    if (e.state === 'wind') return;
    if (P.dead) return;

    if (e.orc) updateOrc(e, dt, d, a, moveTo);
    else if (e.type === 'slime' || e.type === 'bigslime') updateSlime(e, dt, d, a);
    else if (e.type === 'toxslime') updateToxSlime(e, dt, d, a);
    else if (e.type === 'gbrute') updateBrute(e, dt, d, a, moveTo);
    else if (e.type === 'boar') updateBoar(e, dt, d, a, moveTo);
    else if (e.type === 'crow') updateCrow(e, dt, d, a);
    else if (e.type === 'mother') updateMother(e, dt, d, a, moveTo);
    else if (e.type === 'exec') { if (e.state === 'chase') updateExec(e, dt, d, a, moveTo); }
    else if (e.type === 'bearer') { if (e.state === 'chase') updateBearer(e, dt, d, a, moveTo); }
    else if (e.type === 'flag') { /* 꽂힌 깃발: 움직이지 않음 */ }
    else if (e.type === 'ghoul' || e.type === 'ghost' || e.type === 'goblin') {
      if (e.state === 'chase') {
        if (d > 22) moveTo(a, e.spd);
        else if (e.cd <= 0) {
          // 바닥 표시 없이: 멈춰서 팔을 치켜들고 잠시 버틴 뒤 내려친다
          e.state = 'hold'; e.t = e.type === 'ghost' ? 0.7 : e.type === 'goblin' ? 0.55 : 0.6; e.holdMax = e.t; e.holdAng = a; if (e.blade) e.bladeTarget = a - (Math.cos(a) > 0 ? 1 : -1) * 120 * DEG;
          e.face = Math.cos(a) > 0 ? 1 : -1; e.lean = -0.2 * e.face;
        }
      }
    } else if (e.type === 'dog') {
      if (e.state === 'chase') {
        if (d > 120) moveTo(a, e.spd);
        else if (d < 70) moveTo(a + Math.PI, e.spd * 0.6);
        else moveTo(a + Math.PI / 2, e.spd * 0.4);
        if (e.cd <= 0 && d < 190) {
          e.state = 'wind'; e.lockAng = a; e.face = Math.cos(a) > 0 ? 1 : -1; alertMark(e, 30);
          G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 180, w: 16, t: 0, dur: 0.8, owner: e,
            onFire: () => { e.state = 'dash'; e.t = 0.5; e.hitPlayer = false; } });
        }
      } else if (e.state === 'dash') {
        e.x += Math.cos(e.lockAng) * 340 * dt; e.y += Math.sin(e.lockAng) * 340 * dt;
        if (Math.random() < 0.5) dust(e.x, e.y, 1);
        if (!e.hitPlayer && dist(e, P) < e.r + P.r + 2) { e.hitPlayer = true; hurtPlayer(e.atk, e); }
        const bonk = dashBlocked(e); if (bonk) { solveObs(e, e.r); dust(e.x, e.y, 6); addShake(2, e.lockAng); }
        if (e.t <= 0 || bonk) { e.state = 'recover'; e.t = bonk ? 1.1 : 0.9; e.cd = rand(1.4, 2.2); }
      }
    } else if (e.type === 'butcher') {
      if (e.state === 'dash') {
        const sp = e.enraged ? 400 : 360;
        e.x += Math.cos(e.lockAng) * sp * dt; e.y += Math.sin(e.lockAng) * sp * dt;
        G.fx.push({ kind: 'ghost', x: e.x, y: e.y, face: e.face, rot: 0.2 * e.face, t: 0.22, max: 0.22, map: e.kind === 'hob' ? 'butcher' : 'abom', pal: 'shadeB', sc: 2, glowy: true });
        if (Math.random() < 0.8) dust(e.x, e.y, 1);
        if (!e.hitPlayer && dist(e, P) < e.r + P.r + 4) { e.hitPlayer = true; hurtPlayer(e.atk * 1.1, e); }
        if (e.t <= 0 || e.x < A.x0 + e.r + 1 || e.x > A.x1 - e.r - 1 || e.y < A.y0 + e.r + 1 || e.y > A.y1 - e.r - 1 || dashBlocked(e)) {
          solveObs(e, e.r); e.state = 'recover'; e.t = 1.0; e.cd = rand(1.0, 1.6);
          addShake(6, e.lockAng); debris(e.x, e.y, 16); crack(e.x, e.y); sfx('blast');
          G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 8, t: 0.4, max: 0.4, c: '#ff4030', grow: 220 });
        }
      } else if (e.state === 'chase') {
        if (d > 40) moveTo(a, e.spd);
        if (e.cd <= 0) {
          if (d > 90 && d < 230) butcherAttack(e, a, 2);
          else if (d <= 75) butcherAttack(e, a, e.pat === 1 ? 0 : 1);
        }
      }
    } else if (e.type === 'cultist' || e.type === 'garcher') {
      // 피의 광신도: 거리를 벌리고 핏빛 구체를 쏜다
      if (e.state === 'chase') {
        if (d < 110) moveTo(a + Math.PI, e.spd);
        else if (d > 190) moveTo(a, e.spd);
        else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.5);
        if (Math.random() < dt * 0.5) e.strafe = -(e.strafe || 1);
        if (e.cd <= 0 && d < 270) {
          e.state = 'wind'; e.lockAng = a; e.face = Math.cos(a) > 0 ? 1 : -1;
          G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 300, w: 12, t: 0, dur: 0.85, owner: e, thin: true,
            onFire: () => {
              const bow = e.type === 'garcher';
              if (bow) for (const off of (Math.random() < 0.3 ? [-0.16, 0, 0.16] : [0])) G.eproj.push({ x: e.x + Math.cos(e.lockAng + off) * 10, y: e.y + Math.sin(e.lockAng + off) * 10, ang: e.lockAng + off, sp: 360, r: 3, dmg: e.atk, t: 1.2, hist: [], kind: 'arrow' });
              else G.eproj.push({ x: e.x + Math.cos(e.lockAng) * 10, y: e.y + Math.sin(e.lockAng) * 10, ang: e.lockAng, sp: 270, r: 5, dmg: e.atk, t: 1.6, hist: [] });
              if (bow) sfx('swing'); else { burst(e.x, e.y - 18, '#ff3040', 8); sfx('warn'); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 18, r: 4, t: 0.25, max: 0.25, c: '#ff5060', grow: 90 }); }
              e.state = 'recover'; e.t = 0.7; e.cd = rand(2.2, 3.2);
            } });
        }
      }
    } else if (e.type === 'bloat') {
      // 부풀어 오른 시체: 느리게 다가와 부풀어 터진다
      if (Math.random() < dt * 3) G.parts.push({ x: e.x + rand(-6, 6), y: e.y - rand(4, 18), vx: 0, vy: 30, t: 0.4, c: '#6a7a3a', g: 120 });
      if (e.state === 'chase') {
        moveTo(a, e.spd);
        if (d < 38) {
          e.state = 'wind'; alertMark(e, 38); sfx('warn');
          G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 54, t: 0, dur: 0.95, owner: e, heavy: true,
            onFire: tt => { e.exploded = true; bloatBlast(e.x, e.y, tt.r, e.atk); killEnemy(e, true); G.kills++; } });
        }
      }
    }
  }

  // 엘리트(도살꾼): 공격 3종 + 체력 50% 이하 격노
  function eliteTick(e, dt) {
    if (!e.enraged && e.hp < e.maxHp * 0.5 && !e.dead) {
      e.enraged = true; e.spd *= 1.25;
      G.fx.push({ kind: 'ring', x: e.x, y: e.y - 20, r: 8, t: 0.5, max: 0.5, c: '#ff3030', grow: 300 });
      addShake(5); sfx('roar'); alertMark(e, 70, true); burst(e.x, e.y - 24, '#ff3030', 16);
    }
    e.lift = 0;
    if (e.state === 'wind' && e.pat === 1) {
      const g = e.glow;
      e.lift = g < 0.25 ? 0 : g < 0.85 ? 26 * easeOut((g - 0.25) / 0.6) : 26 * (1 - (g - 0.85) / 0.15);
      if (e.lift > 4 && Math.random() < 0.5) G.fx.push({ kind: 'ghost', x: e.x, y: e.y - e.lift, face: e.face, rot: 0, t: 0.2, max: 0.2, map: e.kind === 'hob' ? 'butcher' : 'abom', pal: 'shadeB', sc: 2, glowy: true });
    }
    e.squash = Math.max(0, (e.squash || 0) - dt);
    // 팔: 상태마다 목표 각도, 공격 순간엔 빠르게 휘두른다
    if (e.armA == null) { e.armA = Math.PI / 2; e.armB = Math.PI / 2; e.armTrail = []; }
    const hang = Math.PI / 2, f = e.face;
    let ta, tb;
    if (e.grogiT > 0 || e.state === 'stun') { ta = hang + 0.35 * f; tb = hang - 0.25 * f; }
    else if (e.state === 'wind' && e.pat === 0) { ta = f > 0 ? -1.05 : Math.PI + 1.05; tb = hang - 0.7 * f; }
    else if (e.state === 'wind' && e.pat === 1) { ta = -Math.PI / 2 + 0.6 * f; tb = -Math.PI / 2 - 0.6 * f; }
    else if (e.state === 'wind') { ta = f > 0 ? Math.PI - 0.6 : 0.6; tb = f > 0 ? Math.PI + 0.3 : -0.3; }
    else if (e.state === 'dash') { ta = e.lockAng + Math.PI - 0.45 * f; tb = e.lockAng + Math.PI + 0.45 * f; }
    else { const sw = Math.sin(e.walk) * 0.35; ta = hang - 0.25 * f + sw; tb = hang + 0.15 * f - sw; }
    for (const k of ['A', 'B']) {
      const sw = e['sw' + k];
      if (sw) {
        sw.t += dt; e['arm' + k] = sw.from + sw.d * easeOut(sw.t / sw.dur);
        if (k === 'A') e.armTrail.push({ a: e.armA, t: 0.12 });
        if (sw.t >= sw.dur) e['sw' + k] = null;
      } else e['arm' + k] = lerpAng(e['arm' + k], k === 'A' ? ta : tb, dt * (e.state === 'wind' ? 14 : 8));
    }
    for (const s of e.armTrail) s.t -= dt;
    e.armTrail = e.armTrail.filter(s => s.t > 0);
    if (e.glow > 0 && Math.random() < 0.85) {
      const cx = e.x + e.face * 6, cy = e.y - 26 - e.lift, a = rand(0, TAU), r = rand(16, 30);
      G.parts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, t: 0.22, c: pick(['#ff3030', '#ff9060', '#a01010']), g: 0, glow: true });
    }
    if (e.enraged && Math.random() < 0.5) G.parts.push({ x: e.x + rand(-10, 10), y: e.y - rand(10, 40), vx: rand(-6, 6), vy: -rand(25, 50), t: 0.45, c: pick(['#ff3030', '#c0c0c0']), g: 0, glow: true });
  }
  function armSwing(e, k, to, side, dur) {
    const from = e['arm' + k]; let d = angDiff(to, from);
    if (side > 0 && d < 0) d += TAU; if (side < 0 && d > 0) d -= TAU;
    e['sw' + k] = { from, d, t: 0, dur };
  }
  function butcherAttack(e, a, pat) {
    const tm = e.enraged ? 0.85 : 1, side = e.face = Math.cos(a) > 0 ? 1 : -1;
    e.state = 'wind'; e.pat = pat; alertMark(e, 64); sfx('warn');
    if (pat === 0) { // 피의 손톱 할퀴기
      e.lean = -0.22 * side;
      G.tele.push({ shape: 'cone', x: e.x, y: e.y, ang: a, arc: 150 * DEG, r: 62, t: 0, dur: 0.95 * tm, owner: e, heavy: true,
        onFire: tt => {
          e.lean = 0.32 * side; e.x += Math.cos(tt.ang) * 14; e.y += Math.sin(tt.ang) * 14; hitShape(tt, e.atk);
          armSwing(e, 'A', tt.ang + side * 70 * DEG, side, 0.12); armSwing(e, 'B', tt.ang - side * 20 * DEG, side, 0.16);
          G.fx.push({ kind: 'claw', x: e.x, y: e.y - 14, ang: tt.ang, r: 50, w: 3, c: '255,70,50', glow: true, t: 0.26, max: 0.26 });
          G.fx.push({ kind: 'claw', x: e.x, y: e.y - 14, ang: tt.ang - 0.12 * side, r: 62, w: 2, c: '255,140,90', glow: true, t: 0.3, max: 0.3 });
          flashT = Math.max(flashT, 0.05); flashColor = '#ff5040';
          G.fx.push({ kind: 'claw', x: e.x, y: e.y - 14, ang: tt.ang + 0.15 * side, r: 36, w: 2, c: '255,200,180', glow: true, t: 0.2, max: 0.2 });
          G.fx.push({ kind: 'arcwave', x: e.x, y: e.y - 6, ang: tt.ang, arc: tt.arc, r0: 18, r1: 84, t: 0.28, max: 0.28, c: '255,60,40' });
          sparks(e.x + Math.cos(tt.ang) * 40, e.y + Math.sin(tt.ang) * 40, tt.ang, '#ff9070', 8);
          burst(e.x + Math.cos(tt.ang) * 30, e.y - 10, '#a3161c', 10, tt.ang);
          addShake(5, tt.ang); sfx('heavy');
          e.state = 'recover'; e.t = 0.9; e.cd = rand(1.0, 1.6);
        } });
    } else if (pat === 1) { // 도약 내려찍기
      e.lean = -0.1 * side;
      G.tele.push({ shape: 'circle', x: e.x, y: e.y, r: 70, t: 0, dur: 1.15 * tm, owner: e, heavy: true,
        onFire: tt => {
          e.lift = 0; e.squash = 0.2; hitShape(tt, e.atk * 1.2);
          armSwing(e, 'A', Math.PI / 2 + 0.4 * e.face, e.face, 0.08); armSwing(e, 'B', Math.PI / 2 - 0.2 * e.face, e.face, 0.08);
          G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 10, t: 0.45, max: 0.45, c: '#ff4030', grow: 280 });
          G.fx.push({ kind: 'ring', x: e.x, y: e.y, r: 6, t: 0.3, max: 0.3, c: '#ffe0d0', grow: 180 });
          for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU + rand(-0.2, 0.2); G.fx.push({ kind: 'arcwave', x: e.x, y: e.y, ang, arc: 40 * DEG, r0: 10, r1: 70, t: 0.3, max: 0.3, c: '255,120,80' }); }
          debris(e.x, e.y, 26); dust(e.x, e.y, 26); crack(e.x, e.y); crack(e.x + rand(-14, 14), e.y + rand(-8, 8));
          addShake(9); sfx('blast'); flashT = 0.06; flashColor = '#ff6040';
          e.state = 'recover'; e.t = 1.1; e.cd = rand(1.0, 1.6);
        } });
    } else { // 광란 돌진
      e.lockAng = a; e.lean = -0.25 * side;
      G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 230, w: 28, t: 0, dur: 0.9 * tm, owner: e, heavy: true,
        onFire: () => { e.state = 'dash'; e.t = 0.6; e.hitPlayer = false; sfx('whoosh'); addShake(3, a); dust(e.x, e.y, 10); } });
    }
  }
  function bloatBlast(x, y, r, dmg) {
    const P = G.player;
    if (!P.dead && Math.hypot(P.x - x, P.y - y) < r + P.r) hurtPlayer(dmg, null);
    G.fx.push({ kind: 'ring', x, y, r: 8, t: 0.45, max: 0.45, c: '#c8d080', grow: 220 });
    G.fx.push({ kind: 'ring', x, y, r: 6, t: 0.3, max: 0.3, c: '#ff8050', grow: 160 });
    G.fx.push({ kind: 'impact', shape: 'circle', x, y, r, t: 0.25, max: 0.25 });
    for (let i = 0; i < 30; i++) { const a = rand(0, TAU), sp = rand(60, 200); G.parts.push({ x, y: y - 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 60, t: rand(0.4, 0.8), c: pick(['#7a2a1c', '#8f9a6a', '#a3452e', '#5f6a45']), g: 300, floor: y + rand(-6, 10) }); }
    splat(x, y, 40, '70,80,30'); splat(x, y, 20);
    addShake(6); sfx('blast');
  }
  function updateEProj(dt) {
    const P = G.player;
    for (const pr of G.eproj) {
      pr.hist.push({ x: pr.x, y: pr.y }); if (pr.hist.length > 6) pr.hist.shift();
      if (pr.home && !P.dead) { const ta = Math.atan2(P.y - pr.y, P.x - pr.x); pr.ang += clamp(angDiff(ta, pr.ang), -pr.home * dt, pr.home * dt); }
      const ox = pr.x, oy = pr.y; pr.x += Math.cos(pr.ang) * pr.sp * dt; pr.y += Math.sin(pr.ang) * pr.sp * dt; pr.t -= dt;
      const ec = pr.kind === 'spear' ? ['#c8a070', '#8a6a48'] : pr.kind === 'acid' ? ['#7ac843', '#b8f080'] : pr.kind === 'bile' ? ['#9ae050', '#d8f0a0'] : pr.kind === 'rock' ? ['#5b5560', '#3a3540'] : pr.kind === 'arrow' ? ['#c8ccd4', '#8a6a48'] : pr.kind === 'quill' ? ['#e0d8c0', '#8a7a60'] : ['#ff3040', '#ff9080'];
      if (Math.random() < (pr.kind === 'rock' || pr.kind === 'arrow' || pr.kind === 'quill' || pr.kind === 'spear' ? 0.15 : 0.6)) G.parts.push({ x: pr.x + rand(-2, 2), y: pr.y - 10 + rand(-2, 2), vx: 0, vy: -12, t: 0.3, c: pick(ec), g: 0, glow: !['rock', 'arrow', 'quill', 'spear'].includes(pr.kind) });
      if (!P.dead && !pr.passed && Math.hypot(pr.x - P.x, pr.y - P.y) < pr.r + P.r) {
        if (P.iframe > 0) { hurtPlayer(pr.dmg, null); pr.passed = true; }
        else { const hp0 = P.hp; hurtPlayer(pr.dmg, null); if (pr.poison && P.hp < hp0) poisonPlayer(3, pr.dmg * 0.3); pr.t = 0; burst(pr.x, pr.y - 10, ec[0], 10); G.fx.push({ kind: 'ring', x: pr.x, y: pr.y - 10, r: 4, t: 0.25, max: 0.25, c: ec[1], grow: 90 }); }
      }
      if (pr.x < A.x0 || pr.x > A.x1 || pr.y < A.y0 || pr.y > A.y1 || segSolid(ox, oy, pr.x, pr.y)) { pr.t = 0; burst(pr.x, pr.y - 10, ec[0], 6); }
      if (pr.t <= 0 && pr.kind === 'acid') splat(pr.x, pr.y, 6, '60,120,30');
    }
    G.eproj = G.eproj.filter(pr => pr.t > 0);
  }

  // ---------------------------------------------------------------- 보스: 타락 기사단장 발도르
  function spawnBoss() {
    const P0 = G.player, b = makeEnemy('ghoul', clamp(P0.x, A.x0 + 60, A.x1 - 60), clamp(P0.y - 170, A.y0 + 40, A.y1 - 40));
    Object.assign(b, { type: 'boss', r: 16, hp: 3900 * STG().hpMul, maxHp: 3900 * STG().hpMul, atk: 25 * STG().atkMul, def: 80, spd: 58, kbRes: 0, grogiMax: 100,
      stage: 1, state: 'idle', cd: 1.5, shield: false, summonT: 0, vortexT: 0, nextPat: 0, blade: 'boss', rise: 0.8 });
    G.boss = b; G.enemies.push(b);
    dust(b.x, b.y, 30); burst(b.x, b.y - 20, '#3a1a48', 30);
    G.fx.push({ kind: 'skybeam', x: b.x, y: b.y, w: 60, c: '170,80,230', t: 0.7, max: 0.7 });
    bossRoar(b, '#b45cff');
  }
  function bossRoar(b, c) {
    sfx('roar'); addShake(9); slowmo = Math.max(slowmo, 0.5); flashT = 0.15; flashColor = c;
    G.fx.push({ kind: 'ring', x: b.x, y: b.y - 20, r: 10, t: 0.7, max: 0.7, c, grow: 520 });
    G.fx.push({ kind: 'ring', x: b.x, y: b.y - 20, r: 6, t: 0.5, max: 0.5, c: '#ffffff', grow: 360 });
    debris(b.x, b.y, 24);
  }
  function bossStageCheck(b) {
    const pct = b.hp / b.maxHp;
    if (b.stage === 1 && pct <= 0.7) { b.stage = 2; banner('2단계', '망령 기사 소환 · 죽음의 표식'); bossRoar(b, '#b45cff'); cancelTele(b); b.state = 'idle'; b.cd = 0.6; b.summonT = 0; }
    if (b.stage === 2 && pct <= 0.35) { b.stage = 3; banner('광폭화', '잿빛 회오리가 몰아친다'); bossRoar(b, '#ff3050'); cancelTele(b); b.state = 'idle'; b.cd = 0.6; b.vortexT = 0; b.spd *= 1.25; }
  }
  function updateBoss(b, dt) {
    const P = G.player;
    if (b.state === 'blink' && b.grogiT > 0) b.state = 'idle'; // 그림자 걸음 중 그로기면 취소
    if (b.state !== 'blink') b.fadeA = 1;
    b.flash = Math.max(0, b.flash - dt); b.rise = Math.max(0, b.rise - dt);
    b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= Math.pow(0.001, dt); b.vy *= Math.pow(0.001, dt);
    b.lean *= Math.pow(0.03, dt);
    updateBlade(b, dt);
    b.glow = 0;
    for (const t of G.tele) if (t.owner === b && t.shape !== 'spawn') b.glow = Math.max(b.glow, t.t / t.dur);
    if (b.glow > 0 && Math.random() < 0.9) { // 칼끝으로 어둠이 모인다
      const bl = BLADES.boss, hx = b.x + b.face * 4, hy = b.y - 30, tx = hx + Math.cos(b.bladeAng) * bl.reach, ty = hy + Math.sin(b.bladeAng) * bl.reach;
      const a = rand(0, TAU), r = rand(18, 34);
      G.parts.push({ x: tx + Math.cos(a) * r, y: ty + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, t: 0.22, c: pick(['#b45cff', '#e0b0ff', '#5a1f78']), g: 0, glow: true });
    }
    b.shield = G.enemies.some(e => e.type === 'ghost' && !e.dead);
    G.bossTime -= dt;
    if (G.bossTime <= 0 && !b.wipe) {
      b.wipe = true; cancelTele(b);
      banner('전멸기', '제한 시간 초과');
      sfx('roar'); G.tele.push({ shape: 'circle', x: CX, y: CY, r: 700, t: 0, dur: 2.0, owner: b, heavy: true, onFire: () => { hurtPlayer(9999, b, true); flashT = 0.3; flashColor = '#ffffff'; } });
    }
    if (b.grogiT > 0) { b.grogiT -= dt; b.bladeTarget = (b.face > 0 ? 70 : 110) * DEG; if (b.grogiT <= 0) { b.state = 'idle'; b.cd = 0.8; } return; }
    if (b.state === 'wind') return;
    if (P.dead) return;
    const recov = b.stage === 3 ? 0.7 : 1;
    const d = dist(b, P), a = angTo(b, P);
    if (Math.abs(Math.cos(a)) > 0.2 && b.state !== 'dash' && b.state !== 'triple') b.face = Math.cos(a) > 0 ? 1 : -1;

    if (b.stage >= 2) {
      b.summonT -= dt;
      if (b.summonT <= 0 && !b.shield && b.state === 'idle') {
        b.summonT = 22;
        for (const off of (b.stage === 3 ? [-1, 0, 1] : [-1, 1])) {
          const pt = { x: clamp(b.x + off * 70, A.x0 + 30, A.x1 - 30), y: clamp(b.y + (off === 0 ? 60 : 20), A.y0 + 30, A.y1 - 30) };
          G.tele.push({ shape: 'spawn', x: pt.x, y: pt.y, r: 14, t: 0, dur: 1.0, owner: b, portal: true, onFire: () => { G.enemies.push(makeEnemy('ghost', pt.x, pt.y)); burst(pt.x, pt.y - 10, '#9cc1ea', 14); G.fx.push({ kind: 'skybeam', x: pt.x, y: pt.y, w: 26, c: '150,200,255', t: 0.5, max: 0.5 }); } });
        }
        b.state = 'cast'; b.t = 1.1; b.bladeTarget = -90 * DEG; sfx('warn');
        G.fx.push({ kind: 'skybeam', x: b.x + b.face * 4, y: b.y - 60, w: 10, c: '170,80,230', t: 1.0, max: 1.0, up: true });
      }
    }
    if (b.stage === 3) {
      b.vortexT -= dt;
      if (b.vortexT <= 0 && !G.vortex) { b.vortexT = 22; G.vortex = { t: 0, r0: 430, r1: 115, shrink: 7, hold: 5, r: 430, tick: 0, cx: clamp(P.x, A.x0 + 120, A.x1 - 120), cy: clamp(P.y, A.y0 + 120, A.y1 - 120) }; }
    }

    if (b.state === 'blink') { updateBlink(b, dt); return; }
    if (b.state === 'cast') { b.t -= dt; if (b.t <= 0) { b.state = 'idle'; b.cd = 0.8; } return; }
    if (b.state === 'recover') { b.t -= dt; if (b.t <= 0) { b.state = 'idle'; b.cd = b.stage === 3 ? 0.25 : 0.45; } return; }
    if (b.state === 'dash') {
      const sp = 480;
      b.bladeTarget = b.lockAng; b.bladeAng = b.lockAng;
      b.x += Math.cos(b.lockAng) * sp * dt; b.y += Math.sin(b.lockAng) * sp * dt; b.dashLeft -= sp * dt;
      if (Math.random() < 0.8) dust(b.x, b.y, 1);
      G.fx.push({ kind: 'ghost', x: b.x, y: b.y, face: b.face, rot: 0.25 * b.face, t: 0.28, max: 0.28, map: 'baldor', pal: 'shade', sc: 2, glowy: true });
      for (let i = 0; i < 2; i++) { dg.fillStyle = `rgba(40,10,50,${rand(0.3, 0.6)})`; dg.fillRect(Math.round(b.x + rand(-6, 6)), Math.round(b.y + rand(-3, 3)), randi(2, 4), 2); }
      G.parts.push({ x: b.x + rand(-8, 8), y: b.y - rand(0, 6), vx: -Math.cos(b.lockAng) * 60, vy: -30, t: 0.4, c: pick(['#b45cff', '#5a1f78']), g: 0, glow: true });
      if (!b.hitPlayer && dist(b, P) < b.r + P.r + 6) { b.hitPlayer = true; hurtPlayer(b.atk * 1.15, b); }
      if (b.dashLeft <= 0 || b.x < A.x0 + b.r || b.x > A.x1 - b.r || b.y < A.y0 + b.r || b.y > A.y1 - b.r || dashBlocked(b)) {
        solveObs(b, b.r); b.state = 'recover'; b.t = 0.75 * recov; addShake(8, b.lockAng); dust(b.x, b.y, 20); debris(b.x, b.y, 18); crack(b.x, b.y); sfx('blast');
        if (b.chargesLeft > 0) { b.chargesLeft--; baldorCharge(b, angTo(b, P), 0.45); } // v0.92: 2단계 2연속·3단계 3연속 돌진 (다시 조준)
        else if (dist(b, P) < 150 && Math.random() < (b.stage === 3 ? 0.8 : 0.6)) { b.state = 'triple'; b.step = 0; b.t = 0.3 * recov; } // v0.88: 돌진 후 붙었으면 바로 3연베기
        G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 10, t: 0.4, max: 0.4, c: '#b45cff', grow: 260 });
        G.fx.push({ kind: 'arcwave', x: b.x, y: b.y - 6, ang: b.lockAng, arc: 140 * DEG, r0: 10, r1: 80, t: 0.3, max: 0.3, c: '190,90,255' });
      }
      return;
    }
    if (b.state === 'triple') {
      b.t -= dt;
      if (b.t <= 0) {
        if (b.step >= 3) { b.state = 'recover'; b.t = 0.6 * recov; return; }
        b.step++;
        const aa = angTo(b, P);
        b.face = Math.cos(aa) > 0 ? 1 : -1;
        const side = (b.step % 2 ? 1 : -1) * b.face, last = b.step === 3;
        b.bladeTarget = aa - side * 115 * DEG; b.lean = -0.18 * b.face;
        if (b.step === 1) alertMark(b, 78, true);
        sfx('warn');
        const dur = last ? 0.72 : 0.55; // v0.92: 0.8/0.95 → 0.55/0.72
        G.tele.push({ shape: 'cone', x: b.x, y: b.y, ang: aa, arc: (last ? 100 : 120) * DEG, r: last ? 96 : 76, t: 0, dur, owner: b, follow: true, heavy: last,
          onFire: tt => {
            startSwing(b, tt.ang + side * 85 * DEG, side, 0.1); b.lean = 0.25 * b.face;
            b.x += Math.cos(tt.ang) * 16; b.y += Math.sin(tt.ang) * 16;
            hitShape(tt, b.atk * (last ? 1.3 : 1)); sfx('heavy'); sfx('whoosh');
            G.fx.push({ kind: 'arcwave', x: b.x, y: b.y - 6, ang: tt.ang, arc: tt.arc, r0: 24, r1: tt.r + 26, t: 0.3, max: 0.3, c: '190,90,255' });
            const tx = b.x + Math.cos(tt.ang) * tt.r * 0.7, ty = b.y + Math.sin(tt.ang) * tt.r * 0.7;
            sparks(tx, ty, tt.ang, '#d9a8ff', last ? 14 : 7);
            if (last) { addShake(9, tt.ang); crack(tx, ty); debris(tx, ty, 20); sfx('blast'); G.fx.push({ kind: 'ring', x: tx, y: ty, r: 8, t: 0.4, max: 0.4, c: '#b45cff', grow: 240 }); }
            else addShake(4, tt.ang);
          } });
        b.t = dur + 0.16;
      }
      return;
    }
    // idle
    b.bladeTarget = restAng(b);
    const far = d > 200;
    if (d > 64) { const sp = b.spd * (far ? 1.6 : 1); b.x += Math.cos(a) * sp * dt; b.y += Math.sin(a) * sp * dt; b.walk += dt * (far ? 5 : 3.5); }
    b.cd -= dt * (far ? 1.6 : 1);
    if (b.cd > 0) return;
    // v0.88: 거리별 가중치 — 멀면 돌진 위주, 죽음의 표식(제자리 시전)은 가끔·연속 금지. 가까우면 3연베기 위주
    const mk = b.stage >= 2 && b.lastPat !== 'mark', bk = b.lastPat !== 'blink';
    let pat = d > 130 ? wpick2([['charge', 4], ['blink', bk ? 1.5 : 0], ['mark', mk ? 1 : 0]]) : wpick2([['triple', 4], ['charge', 1], ['blink', bk ? 0.8 : 0], ['mark', mk ? 0.7 : 0]]);
    b.lastPat = pat;
    if (pat === 'blink') { baldorBlink(b); return; }
    if (pat === 'triple') { b.state = 'triple'; b.step = 0; b.t = 0; }
    else if (pat === 'charge') { b.chargesLeft = b.stage - 1; alertMark(b, 78, true); baldorCharge(b, a, 0.75); } else if (pat === 'mark') {
      b.state = 'cast'; b.t = 0.6; b.bladeTarget = -90 * DEG;
      alertMark(b, 78, true); sfx('warn');
      G.fx.push({ kind: 'skybeam', x: b.x + b.face * 4, y: b.y - 60, w: 12, c: '170,80,230', t: 0.6, max: 0.6, up: true });
      const markHit = tt => {
          hitShape(tt, b.atk * 1.35); addShake(10); sfx('blast'); burst(tt.x, tt.y, '#8a3fb0', 30); crack(tt.x, tt.y); debris(tt.x, tt.y, 20);
          G.fx.push({ kind: 'skybeam', x: tt.x, y: tt.y, w: 70, c: '190,90,255', t: 0.45, max: 0.45 });
          G.fx.push({ kind: 'ring', x: tt.x, y: tt.y, r: 10, t: 0.5, max: 0.5, c: '#d9a8ff', grow: 220 });
          flashT = 0.1; flashColor = '#b45cff';
        };
      G.tele.push({ shape: 'circle', x: P.x, y: P.y, r: 46, t: 0, dur: 3.0, owner: b, track: true, mark: true, heavy: true, onFire: markHit });
      if (b.stage === 3) G.tele.push({ shape: 'circle', x: P.x, y: P.y, r: 46, t: 0, dur: 4.2, owner: b, track: true, mark: true, heavy: true, onFire: markHit }); // v0.92: 광폭화엔 표식 2개
    }
  }
  // v0.92 발도르: 돌진 (연속 돌진은 짧은 경고로 다시 조준)
  function baldorCharge(b, a, dur) {
    b.state = 'wind'; b.lockAng = a; b.face = Math.cos(a) > 0 ? 1 : -1; b.bladeTarget = a + Math.PI; b.lean = -0.2 * b.face; sfx('warn');
    G.tele.push({ shape: 'line', x: b.x, y: b.y, ang: a, len: 320, w: 32, t: 0, dur, owner: b, heavy: true,
      onFire: () => { b.state = 'dash'; b.dashLeft = 320; b.hitPlayer = false; sfx('whoosh'); sfx('blast'); addShake(5, a); dust(b.x, b.y, 14); } });
  }
  // 발도르 「그림자 걸음」 (v0.92, v0.93 느리게): 연기 속에 서서히 사라짐 → 나타날 자리에 보라 표식 → 서서히 나타남 → 0.8초 경고 후 큰 베기
  const BLINK_OUT = 0.45, BLINK_GAP = 0.3, BLINK_IN = 0.3;
  function baldorBlink(b) {
    const P = G.player, a0 = angTo(b, P);
    b.blinkTo = { x: clamp(P.x + Math.cos(a0) * 58, A.x0 + 30, A.x1 - 30), y: clamp(P.y + Math.sin(a0) * 42, A.y0 + 30, A.y1 - 30) };
    b.state = 'blink'; b.bt = 0; b.moved = false; b.bladeTarget = -60 * DEG; sfx('warn', 0.8);
    G.tele.push({ shape: 'spawn', x: b.blinkTo.x, y: b.blinkTo.y, r: 20, t: 0, dur: BLINK_OUT + BLINK_GAP + BLINK_IN, owner: b });
  }
  function updateBlink(b, dt) {
    const P = G.player, smoke = (x, y, n) => { for (let i = 0; i < n; i++) G.parts.push({ x: x + rand(-14, 14), y: y - rand(0, 50), vx: rand(-25, 25), vy: -rand(20, 55), t: rand(0.4, 0.8), c: pick(['#3e2b4a', '#5a1f78', '#b45cff']), g: 0, glow: Math.random() < 0.4 }); };
    b.bt += dt; const T = b.bt;
    if (T < BLINK_OUT) { b.fadeA = 1 - T / BLINK_OUT; if (Math.random() < 0.7) smoke(b.x, b.y, 2); return; }
    if (!b.moved) { b.moved = true; b.fadeA = 0; G.fx.push({ kind: 'ghost', x: b.x, y: b.y, face: b.face, rot: 0, t: 0.35, max: 0.35, map: 'baldor', pal: 'shade', sc: 2, glowy: true }); smoke(b.x, b.y, 14); b.x = b.blinkTo.x; b.y = b.blinkTo.y; solveObs(b, b.r); b.vx = b.vy = 0; sfx('whoosh', 0.8); }
    if (T < BLINK_OUT + BLINK_GAP) { b.fadeA = 0; return; }
    if (T < BLINK_OUT + BLINK_GAP + BLINK_IN) { b.fadeA = (T - BLINK_OUT - BLINK_GAP) / BLINK_IN; b.face = Math.cos(angTo(b, P)) > 0 ? 1 : -1; if (Math.random() < 0.6) smoke(b.x, b.y, 2); return; }
    b.fadeA = 1; sfx('warn'); alertMark(b, 78, true);
    const a = angTo(b, P); b.face = Math.cos(a) > 0 ? 1 : -1; b.state = 'wind'; b.bladeTarget = a - 115 * DEG * b.face; b.lean = -0.2 * b.face;
    G.tele.push({ shape: 'cone', x: b.x, y: b.y, ang: a, arc: 130 * DEG, r: 92, t: 0, dur: 0.8, owner: b, follow: true, heavy: true,
      onFire: tt => { startSwing(b, tt.ang + 85 * DEG * b.face, b.face, 0.1); b.lean = 0.25 * b.face; hitShape(tt, b.atk * 1.25); sfx('heavy'); sfx('whoosh'); addShake(7, tt.ang);
        G.fx.push({ kind: 'arcwave', x: b.x, y: b.y - 6, ang: tt.ang, arc: tt.arc, r0: 24, r1: tt.r + 26, t: 0.3, max: 0.3, c: '190,90,255' });
        b.state = 'recover'; b.t = b.stage === 3 ? 0.6 : 0.85; } });
  }
  function updateVortex(dt) {
    const v = G.vortex; if (!v) return;
    v.t += dt;
    if (v.t < v.shrink) v.r = v.r0 + (v.r1 - v.r0) * (v.t / v.shrink);
    else if (v.t < v.shrink + v.hold) v.r = v.r1;
    else { v.r += 160 * dt; if (v.r > 400) { G.vortex = null; return; } }
    const P = G.player;
    if (Math.hypot(P.x - v.cx, P.y - v.cy) > v.r) {
      v.tick -= dt;
      if (v.tick <= 0) { v.tick = 0.5; hurtPlayer(6, null, false, true); }
    }
  }

  // ---------------------------------------------------------------- 판정
  function inShape(t, x, y, pr) {
    const dx = x - t.x, dy = y - t.y, dd = Math.hypot(dx, dy);
    if (t.shape === 'circle') return dd <= t.r + pr;
    if (t.shape === 'cone') return dd <= t.r + pr && Math.abs(angDiff(Math.atan2(dy, dx), t.ang)) <= t.arc / 2 + (dd > 0 ? Math.atan(pr / Math.max(dd, 1)) : Math.PI);
    if (t.shape === 'line') {
      const ux = Math.cos(t.ang), uy = Math.sin(t.ang), along = dx * ux + dy * uy, perp = Math.abs(-dx * uy + dy * ux);
      return along >= -pr && along <= t.len + pr && perp <= t.w / 2 + pr;
    }
    return false;
  }
  function hitShape(t, dmg) { const P = G.player; if (inShape(t, P.x, P.y, P.r)) hurtPlayer(dmg, t.owner); }

  function hurtPlayer(raw, src, unblockable, dot) {
    const P = G.player;
    if (P.dead || mode !== 'play') return;
    if (P.grab && !unblockable) return;
    if (P.miracleT > 0 || P.shieldT > 0) { if (!dot) G.nums.push({ x: P.x, y: P.y - 26, v: '0', t: 0.5, c: '#ffe39a', s: 1 }); return; }
    if (!unblockable && !dot && P.iframe > 0) {
      if (P.state === 'dodge' && P.dodgeT < 0.16 && !P.perfectUsed) perfectDodge();
      return;
    }
    if (!dot && P.inv > 0 && !unblockable) return;
    const s = G.stats;
    let dmg = raw * (s.curse.has('glass') ? 1.25 : 1) * (1 - s.def / (s.def + 500)) * (RANGED() ? 1 : MELEE_DR) * (P.awakenT > 0 ? 0.7 : 1) * (P.state === 'storm' || P.state === 'cast' || P.state === 'aim' ? 0.5 : 1);
    dmg = Math.max(1, Math.round(dmg));
    P.hp -= dmg;
    G.nums.push({ x: P.x, y: P.y - 26, v: String(dmg), t: 0.8, c: '#ff5a4f', s: 1 });
    if (!dot) gearOnHurt();
    if (!dot) {
      P.inv = 0.45; P.hurtT = 0.2; sfx('hurt');
      addShake(7, src && src.x != null ? Math.atan2(P.y - src.y, P.x - src.x) : null);
      if (src && src.x != null && !unblockable) { const ka = Math.atan2(P.y - src.y, P.x - src.x); P.kx = Math.cos(ka) * 170; P.ky = Math.sin(ka) * 170; }
      hitstop = Math.max(hitstop, 0.07); zoomK = Math.max(zoomK, 0.02);
      flashT = Math.max(flashT, 0.07); flashColor = '#ff1a28';
      if (G.combo) G.combo.n = 0;
      P.gauge = Math.min(100, P.gauge + 6 * s.gaugeRate);
      burst(P.x, P.y - 10, '#a3161c', 10); splat(P.x, P.y, 8);
    }
    if (P.hp <= 0) playerDie();
  }
  function perfectDodge() {
    { const P0 = G.player; if (G.stats.efx.has('nova')) { gxNova(P0.x, P0.y); for (const o of nearFoes(P0.x, P0.y, 92)) damageEnemy(o, 1.2, { proc: true, ang: angTo(P0, o), gauge: 2 }); } }
    const P = G.player;
    P.perfectUsed = true; P.critNext = true;
    slowmo = 1.0; flashT = 0.12; flashColor = '#cfe6ff';
    P.gauge = Math.min(100, P.gauge + 15 * G.stats.gaugeRate);
    G.nums.push({ x: P.x, y: P.y - 30, v: '!', t: 0.8, c: '#9fd2ff', s: 2 });
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 6, t: 0.35, max: 0.35, c: '#9fd2ff' });
    if (G.stats.fx.has('vigil')) P.hp = Math.min(G.stats.hp, P.hp + G.stats.hp * 0.08);
    if (G.stats.fx.has('fangs')) P.chargeCd = [0, 0];
    sfx('perfect');
  }
  function playerDie() {
    const P = G.player;
    if (G.cls === 'priest' && P.gauge >= 100) { P.hp = 1; startMiracle(true); return; }
    P.hp = 0; P.dead = true; P.deadT = 0; P.state = 'dead';
    burst(P.x, P.y - 8, '#a3161c', 24); splat(P.x, P.y, 30);
    banner('사망', '가져온 모든 것을 잃었다');
  }
  function afterDeath() {
    const P = G.player;
    if (G.retries > 0) {
      G.retries--;
      Object.assign(P, { hp: G.stats.hp, dead: false, state: 'idle', inv: 1, iframe: 0 });
      restartRoom();
    } else showResult(false);
  }

  function damageEnemy(e, coef, o = {}) {
    if (e.dead) return;
    const P = G.player, s = G.stats;
    if (e.type === 'boss' && e.shield) {
      e.barHit = time;
      G.nums.push({ x: e.x, y: e.y - 60, v: '0', t: 0.5, c: '#9cc1ea', s: 1 });
      e.flash = 0.06; sfx('block');
      sparks(e.x, e.y - 20, o.ang || 0, '#9cc1ea', 4);
      return;
    }
    const crit = !o.dot && (P.critNext || Math.random() < s.crit + (P.echoT > 0 ? 0.25 : 0));
    if (P.critNext && !o.dot) { P.critNext = false; gxCrit(e, P.firstCrit); P.firstCrit = false; }
    let dmg = s.atk * coef * (1 - e.def / (e.def + 500)) * (crit ? s.critDmg : 1) * (e.grogiT > 0 ? 1.5 : 1) * (G.frenzyT > 0 ? 1.3 : 1) * (CL().dmgMul || 1) * (s.fx.has('tusk') && (e.type === 'boss' || isElite(e) || isSemi(e)) ? 1.15 : 1) * (s.efx.has('exec') && e.hp < e.maxHp * 0.3 ? 1.25 : 1) * (s.set4.has('orc') && P.hp < s.hp * 0.5 ? 1.3 : 1);
    dmg *= (e.vuln || 1) * (e.armorMul || 1);
    dmg = Math.max(1, Math.round(dmg));
    e.hitT = time;
    if (e.ward > 0) { e.barHit = time; const ab = Math.min(e.ward, dmg); e.ward -= ab; dmg -= ab; if (e.ward <= 0) { e.ward = 0; burst(e.x, e.y - 20, '#ff6060', 10); sfx('block', 1.3); } }
    e.hp -= dmg; e.flash = o.dot ? 0.06 : 0.12;
    if (!o.proc && !o.dot) { // v0.98 장비 효과 연계 (연계로 생긴 피해는 다시 연계하지 않음)
      if (crit && s.efx.has('bleed')) { if (!(e.bleedT > 0)) gxSpurt(e, 10, (o.ang == null ? -Math.PI / 2 : o.ang) - 0.4); e.bleedT = 3; if (!(e.bleedTick > 0)) e.bleedTick = 0.5; }
      if (s.efx.has('exec') && e.hp + dmg < e.maxHp * 0.3) gxExec(e);
      if (crit && s.efx.has('chain')) chainBolt(e);
      if (s.set4.has('order') && Math.random() < 0.12) ghostSword(e);
    }
    const killing = e.hp <= 0, small = e.type !== 'boss' && !isElite(e) && !isSemi(e);
    const top = e.tall || (e.type === 'boss' ? 62 : isElite(e) ? 52 : 36);
    G.nums.push({ x: e.x + rand(-5, 5), y: e.y - top, v: String(dmg), t: crit ? 0.95 : 0.7, c: o.dot ? '#ffa050' : crit ? '#ffd34d' : '#ffffff', s: o.dot ? 1 : crit ? 3 : 2,
      pop: o.dot ? 0 : crit ? 0.2 : 0.12, vx: o.dot ? 0 : Math.cos(o.ang || 0) * rand(25, 45) + rand(-12, 12), vy: o.dot ? 0 : crit ? -70 : -40 });
    const hy = e.y - (e.tall ? e.tall * 0.42 : e.type === 'boss' ? 26 : isElite(e) ? 20 : 12);
    if (!o.dot) {
      burst(e.x, hy, bloodOf(e), crit ? 16 : killing ? 12 : 8, o.ang);
      sparks(e.x, hy, o.ang || 0, crit ? '#ffd34d' : '#fff6dc', crit ? 9 : o.heavy ? 7 : 5);
      G.fx.push({ kind: 'hitflash', x: e.x, y: hy, t: 0.08, max: 0.08, r: crit ? 16 : 11 });
      const big = crit || o.heavy;
      G.fx.push({ kind: 'hitspark', x: e.x, y: hy, ang: o.ang || 0, rot: rand(-0.35, 0.35), t: big ? 0.16 : 0.12, max: big ? 0.16 : 0.12, r: (crit ? 26 : o.heavy ? 21 : 15) * (killing ? 1.3 : 1), c: crit ? '255,205,70' : o.heavy ? '255,225,180' : '255,246,225', crit });
      if (crit) G.fx.push({ kind: 'ring', x: e.x, y: hy, r: 6, t: 0.22, max: 0.22, c: '#ffd34d', grow: 260 });
      if (e.type !== 'ghost') splat(e.x, e.y, 4, splatOf(e));
      // 맞은 적: 짧게 떨리고, 맞은 방향으로 젖혀지고, 잡몹은 이동이 잠깐 끊긴다
      e.shk = big ? 0.2 : 0.14; e.shkAng = o.ang || 0; e.lastAng = o.ang;
      if (small) { e.lean = 0.22 * (Math.cos(o.ang || 0) > 0 ? 1 : -1); if (e.state !== 'dash') e.hitStun = Math.max(e.hitStun || 0, o.heavy ? 0.22 : 0.14); }
      if (!G.combo) G.combo = { n: 0, t: 0, pop: 0, best: 0 };
      G.combo.n++; G.combo.t = 2.6; G.combo.pop = 0.12; G.combo.best = Math.max(G.combo.best, G.combo.n);
    }
    if (!o.noStop) {
      let st = (o.heavy ? 0.085 : 0.05) + (crit ? 0.035 : 0) + (killing ? (small ? 0.035 : 0.1) : 0);
      st /= 1 + stopHeat * 3; stopHeat = Math.min(1.2, stopHeat + st);
      /* v1.08 역경직 제거 */
      // 평타(basic)는 화면 흔들림·줌 없음 — 치명타·특수기술·각성기만 화면을 흔든다 (히트스톱은 유지)
      if (!o.basic || crit) {
        addShake((o.heavy ? 4.5 : 2.5) + (crit ? 2 : 0) + (killing ? 1.5 : 0), o.ang);
        zoomK = Math.max(zoomK, o.heavy ? 0.022 : crit ? 0.018 : 0.007);
      }
    }
    P.gauge = Math.min(100, P.gauge + (o.gauge == null ? 4 : o.gauge) * s.gaugeRate);
    if (!o.dot) { sfx(o.heavy ? 'heavy' : 'hit', rand(0.88, 1.14)); if (crit) sfx('crit', rand(0.95, 1.08)); }
    const kb = (o.kb || 0) * e.kbRes * (o.kb && o.kb < 100 ? 1.35 : 1);
    if (kb > 0) { e.vx += Math.cos(o.ang) * kb; e.vy += Math.sin(o.ang) * kb; }
    if (o.stagger && ['ghoul', 'dog', 'ghost', 'cultist', 'goblin', 'garcher', 'slime', 'bigslime', 'toxslime', 'crow', 'orc', 'othrow', 'wolf', 'shaman', 'slave'].includes(e.type) && e.state !== 'dash' && !e.dash) {
      e.holdAng = null; e.hop = null; e.z = 0;
      cancelTele(e); e.state = 'stun'; e.t = o.stagger; e.lean = 0.35 * (Math.cos(o.ang || 0) > 0 ? 1 : -1);
    }
    if (e.grogiMax && e.grogiT <= 0 && o.grogi) {
      e.grogi += o.grogi;
      if (e.grogi >= e.grogiMax) {
        e.grogi = 0; e.grogiT = e.type === 'boss' ? 5 : 3; cancelTele(e); e.state = 'grogi';
        if (e.type === 'boss') banner('그로기!', '5초간 받는 피해 +50%');
        sfx('grogi'); flashT = 0.08; flashColor = '#ffe39a';
        G.fx.push({ kind: 'ring', x: e.x, y: e.y - 14, r: 10, t: 0.5, max: 0.5, c: '#ffd34d' });
      }
    }
    if (e.hp <= 0) killEnemy(e);
  }
  function killEnemy(e, silent) {
    e.dead = true; cancelTele(e);
    { const P = G.player; if (!RANGED() && P && !P.dead && e.type !== 'ghost' && e.type !== 'flag' && !e.ffKill) { const h = Math.max(1, Math.round(G.stats.hp * MELEE_KILL_HEAL * (isElite(e) || e.type === 'boss' ? 3 : 1))); if (P.hp < G.stats.hp) { P.hp = Math.min(G.stats.hp, P.hp + h); G.nums.push({ x: P.x, y: P.y - 30, v: '+' + h, t: 0.6, c: '#7dff9a', s: 1 }); } } } // 근접 투지
    const big = e.type === 'boss' ? 3 : isElite(e) ? 2 : 1;
    for (let i = 0; i < 16 * big; i++) G.parts.push({ x: e.x + rand(-6, 6) * big, y: e.y - rand(0, 26) * big, vx: rand(-14, 14), vy: rand(-40, -10), t: rand(0.5, 1.1), c: pick(['#3a3540', '#5b5560', '#1e1b22', '#7a2a1c']), g: -10 });
    burst(e.x, e.y - 8, bloodOf(e), 8 * big);
    if (e.type !== 'ghost') splat(e.x, e.y, 18 * big, splatOf(e));
    if (e.type === 'bigslime' && !silent) for (const s of [-1, 1]) { const m = makeEnemy('slime', clamp(e.x + s * 12, A.x0 + 10, A.x1 - 10), e.y); m.vx = s * 120; m.cd = 0.8; m.rise = 0; G.enemies.push(m); }
    if (silent) return;
    G.kills++;
    gearOnKill(e);
    orcOnKill(e);
    sfx('kill'); sfx('crunch', rand(0.85, 1.15));
    // 쓰러진 적은 맞은 방향으로 튕겨 날아가며 사라진다
    if (e.type !== 'boss' && e.type !== 'bigslime' && e.type !== 'bloat') {
      const ka = e.lastAng != null ? e.lastAng : angTo(G.player, e), el = isElite(e), sp = el ? rand(70, 100) : rand(170, 230);
      if (!G.corpses) G.corpses = [];
      G.corpses.push({ e, t: el ? 0.75 : 0.55, max: el ? 0.75 : 0.55, vx: Math.cos(ka) * sp, vy: Math.sin(ka) * sp * 0.6, z: 0, vz: el ? 120 : 170, rot: 0, vr: (Math.cos(ka) >= 0 ? 1 : -1) * (el ? 3 : rand(9, 13)), bounced: false });
    }
    // 웨이브의 마지막 한 마리: 짧은 슬로모션 마무리
    if (e.type !== 'boss' && !G.enemies.some(x => !x.dead) && G.spawning <= 0 && !G.tele.some(t => t.shape === 'spawn')) {
      slowmo = Math.max(slowmo, 0.5); zoomK = Math.max(zoomK, 0.05); /* v1.08 역경직 제거 */
      flashT = Math.max(flashT, 0.06); flashColor = '#fff4e0'; sfx('finisher');
      G.fx.push({ kind: 'ring', x: e.x, y: e.y - 10, r: 8, t: 0.4, max: 0.4, c: '#fff0d0', grow: 420 });
    }
    const gold = e.type === 'boss' ? STG().bossGold : isElite(e) ? 40 : isSemi(e) ? randi(15, 20) : randi(3, 7);
    G.gold += gold;
    if (e.type === 'bloat' && !e.exploded) {
      e.exploded = true; const ex = e.x, ey = e.y, dmg = e.atk * 0.8;
      G.tele.push({ shape: 'circle', x: ex, y: ey, r: 44, t: 0, dur: 0.45, owner: {}, heavy: true, onFire: tt => bloatBlast(ex, ey, tt.r, dmg) });
    }
    if (e.type !== 'boss' && e.type !== 'ghost') rollLoot(e);
    if (e.type !== 'boss' && Math.random() < (isElite(e) ? 1 : 0.15)) {
      G.iron += isElite(e) ? 3 : 1;
      G.nums.push({ x: e.x, y: e.y - 30, v: '1', t: 0.6, c: '#c9b07a', s: 1 });
    }
    if (e.type === 'boss') bossDefeated(e);
  }

  // ---------------------------------------------------------------- 플레이어 & 대검 콤보
  // a0/a1: 조준 방향 기준 상대 각도(도). 바라보는 쪽에 따라 좌우 반전.
  const SWING = [
    { wind: 0.07, swing: 0.09, rec: 0.18, a0: -125, a1: 95, reach: 54, coef: 1.0, grogi: 4, kb: 60, gauge: 4, lunge: 80 },
    { wind: 0.06, swing: 0.09, rec: 0.18, a0: 105, a1: -115, reach: 54, coef: 1.1, grogi: 4, kb: 60, gauge: 4, lunge: 80 },
    { wind: 0.13, swing: 0.26, rec: 0.24, a0: -150, a1: 250, reach: 60, coef: 1.8, grogi: 12, kb: 190, gauge: 7, lunge: 40, heavy: true, stagger: 0.5 },
  ];
  // 레인저 쌍검: 짧고 빠르다. 1타 앞손, 2타 뒷손, 3타 양손 교차베기로 파고든다
  const SWING_R = [
    { wind: 0.03, swing: 0.07, rec: 0.11, a0: -115, a1: 80, reach: 42, coef: 0.72, grogi: 2, kb: 25, gauge: 3, lunge: 110 },
    { wind: 0.03, swing: 0.07, rec: 0.11, a0: 105, a1: -90, reach: 42, coef: 0.76, grogi: 2, kb: 25, gauge: 3, lunge: 110 },
    { wind: 0.06, swing: 0.1, rec: 0.2, a0: -150, a1: 150, reach: 46, coef: 1.3, grogi: 7, kb: 130, gauge: 5, lunge: 260, heavy: true, stagger: 0.35 },
  ];
  const swingTable = () => (G && G.cls === 'ranger') ? SWING_R : (G && G.cls === 'priest') ? SWING_P : SWING;
  const PIVOT_Y = 10;
  function updatePlayer(dt) {
    const P = G.player, s = G.stats;
    for (const t of P.trail) t.t -= dt;
    P.trail = P.trail.filter(t => t.t > 0);
    for (const t of P.trail2) t.t -= dt;
    P.trail2 = P.trail2.filter(t => t.t > 0);
    if (P.dead) {
      P.deadT += dt;
      if (P.deadT > 2.0 && !P.deathHandled) { P.deathHandled = true; setTimeout(() => { P.deathHandled = false; afterDeath(); }, 10); }
      return;
    }
    if (P.grab) { P.hurtT = Math.max(0, P.hurtT - dt); updateGrabbed(P, dt); return; }
    P.inv = Math.max(0, P.inv - dt); P.hurtT = Math.max(0, P.hurtT - dt);
    P.iframe = Math.max(0, P.iframe - dt);
    P.awakenT = Math.max(0, P.awakenT - dt);
    if (P.stam < 2) { P.stamT += dt * s.stamRate; if (P.stamT >= 1.5) { P.stamT = 0; P.stam++; } }
    const charges = s.fx.has('bulwark') && G.cls === 'knight' ? 2 : 1;
    for (let i = 0; i < charges; i++) P.chargeCd[i] = Math.max(0, P.chargeCd[i] - dt);
    let mx = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0), my = (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0);
    const ml = Math.hypot(mx, my); if (ml) { mx /= ml; my /= ml; }
    P.moving = ml > 0;
    mouse.active = Math.max(0, mouse.active - dt);
    if (mouse.active > 0) P.ang = Math.atan2(mouse.y + cam.y - (P.y - 10), mouse.x + cam.x - P.x);
    else if (ml) P.ang = Math.atan2(my, mx);
    if (P.reload > 0) { P.reload -= dt; if (P.reload <= 0) { P.reload = 0; if (G.cls === 'gunner') P.ammo = GUN_MAG; sfx('reload'); } }
    if (G.cls === 'mage') P.mana = Math.min(MAGE_MANA_MAX, P.mana + MAGE_MANA_REGEN * dt);
    P.recoil = Math.max(0, (P.recoil || 0) - dt * 7);
    P.shieldT = Math.max(0, P.shieldT - dt); P.miracleT = Math.max(0, P.miracleT - dt);
    updatePoison(dt);
    if (Math.abs(Math.cos(P.ang)) > 0.15 && P.state !== 'charge' && P.state !== 'attack' && P.state !== 'shadow' && P.state !== 'storm' && P.state !== 'butt') P.face = Math.cos(P.ang) > 0 ? 1 : -1;

    if (pressed['j'] || pressed['k'] || pressed['e'] || pressed['l'] || (RANGED() && keys['j'])) { const te = touchAim(); if (te) P.ang = Math.atan2(te.y - (isElite(te) || te.type === 'boss' ? 20 : 8) - (P.y - 10), te.x - P.x); }
    const wantAtk = take('j'), wantSkill = take('k'), wantAwk = take('l') || take('e'), wantDodge = take(' ');
    const holdAny = !!(keys['j'] || mouse.down), holdAtk = RANGED() && holdAny, holdMelee = !RANGED() && holdAny; // 근접도 누르고 있으면 콤보가 이어진다 (v0.64)
    const free = P.state === 'idle' || P.state === 'attack' || P.state === 'rattack';

    if (wantDodge && P.stam > 0 && (free || P.state === 'butt' || P.state === 'pray' || (P.state === 'skill' && P.t > SKILL.wind + SKILL.swing))) {
      P.stam--; P.state = 'dodge'; P.t = 0; P.dodgeT = 0; P.iframe = 0.22; P.perfectUsed = false; P.combo = 0; P.queued = false; P.blinkEnd = false;
      const da = ml ? Math.atan2(my, mx) : P.ang;
      P.dvx = Math.cos(da); P.dvy = Math.sin(da);
      if (Math.abs(P.dvx) > 0.2) P.face = P.dvx > 0 ? 1 : -1;
      P.blinkFrom = { x: P.x, y: P.y };
      if (s.efx.has('blinkFire')) { (G.pfire = G.pfire || []).push({ x: P.x, y: P.y, t: 3, tick: 0 }); gxIgnite(P.x, P.y); }
      G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0, t: 0.35, max: 0.35, tint: true });
      blinkBurst(P.x, P.y - 10);
      sfx('dodge');
    }
    if (wantAwk && P.gauge >= 100 && free) {
      if (G.cls === 'ranger') startStorm(); else if (G.cls === 'mage') startMeteor(); else if (G.cls === 'priest') startMiracle(); else if (G.cls === 'gunner') startSnipe(); else startAwaken();
    }
    if (wantSkill && free) {
      const slot = P.chargeCd.findIndex((c, i) => i < charges && c <= 0);
      if (slot >= 0) {
        P.chargeCd[slot] = CL().skillCd * (1 - s.cdr); if (s.efx.has('echo')) { P.echoT = 3; gxFocus(); }
        if (G.cls === 'ranger') startShadow();
        else if (G.cls === 'mage') castFireball();
        else if (G.cls === 'priest') castHeal();
        else if (G.cls === 'gunner') fireShotgun();
        else {
        P.state = 'charge'; P.t = 0.22; P.chargeHit = new Set(); P.atkAng = P.ang; P.combo = 0; P.queued = false;
        P.face = Math.cos(P.ang) > 0 ? 1 : -1;
        P.iframe = Math.max(P.iframe, 0.12);
        sfx('whoosh');
        }
      }
    }

    if (P.state === 'idle') {
      if (RANGED() && (wantAtk || holdAtk)) startRanged();
      else if (wantAtk || holdMelee) startAttack(P.comboWin > 0 ? P.combo : 0);
      else if (P.comboWin > 0) P.comboWin -= dt;
      const fast = isCalm(), sp = fast ? 2 : 1;
      P.x += mx * s.spd * sp * dt; P.y += my * s.spd * sp * dt;
      if (ml) { P.walk += dt * 10 * sp; if (fast) runFx(dt, mx, my); else if (Math.random() < dt * 6) dust(P.x - mx * 4, P.y, 1); }
      if (G.cls === 'mage') P.blade = lerpAng(P.blade, (P.face > 0 ? -70 : -110) * DEG, dt * 10); // 지팡이를 세워 든다
      else if (G.cls === 'gunner') P.blade = P.reload > 0 ? P.ang + (1 - P.reload / GUN_RELOAD) * TAU * 2 : lerpAng(P.blade, P.ang, dt * 18); // 재장전 중 총을 두 바퀴 회전
      else if (G.cls === 'priest') P.blade = lerpAng(P.blade, (P.face > 0 ? 120 : 60) * DEG, dt * 10);
      else if (G.cls === 'ranger') { // 쌍검: 앞손은 아래로, 뒷손은 뒤로
        P.blade = lerpAng(P.blade, (P.face > 0 ? 20 : 160) * DEG, dt * 12); // v1.09 앞날: 몸 앞에서 아래·뒤로
        P.blade2 = lerpAng(P.blade2, (P.face > 0 ? 125 : 55) * DEG, dt * 12); // 뒷날: 몸 뒤에서 등 위로 솟게
      } else // 대검을 뒤로 끌며 든다
        P.blade = lerpAng(P.blade, (P.face > 0 ? (ml ? 160 : 140) : (ml ? 20 : 40)) * DEG, dt * 10);
    } else if (P.state === 'attack') {
      updateSwing(dt, wantAtk || holdMelee, mx, my);
    } else if (P.state === 'dodge') {
      // 점멸: 0.11초 동안 몸을 감추고 약 80px 순간 이동, 출발점과 도착점에 잔상과 빛
      P.t += dt; P.dodgeT += dt;
      if (P.t < BLINK) {
        P.x += P.dvx * (80 / BLINK) * dt; P.y += P.dvy * (80 / BLINK) * dt;
        if (Math.random() < 0.7) G.parts.push({ x: P.x + rand(-4, 4), y: P.y - rand(2, 20), vx: -P.dvx * 40, vy: -P.dvy * 40, t: 0.3, c: pick(['#9fd2ff', '#e4f2ff']), g: 0, glow: true });
      } else if (!P.blinkEnd) {
        P.blinkEnd = true;
        P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r);
        blinkBurst(P.x, P.y - 10);
        G.fx.push({ kind: 'streak', x0: P.blinkFrom.x, y0: P.blinkFrom.y - 10, x1: P.x, y1: P.y - 10, t: 0.18, max: 0.18 });
      }
      P.blade = lerpAng(P.blade, (P.face > 0 ? 150 : 30) * DEG, dt * 20);
      if (P.t >= BLINK + 0.09) P.state = 'idle';
    } else if (P.state === 'charge') {
      P.t -= dt;
      P.x += Math.cos(P.atkAng) * 340 * dt; P.y += Math.sin(P.atkAng) * 340 * dt;
      P.blade = lerpAng(P.blade, P.atkAng + Math.PI * 0.85 * P.face, dt * 16);
      if (Math.random() < 0.7) dust(P.x, P.y, 1);
      G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0.25 * P.face, t: 0.16, max: 0.16, tint: true });
      for (const e of G.enemies) if (!e.dead && !P.chargeHit.has(e) && dist(e, P) < e.r + P.r + 12) {
        P.chargeHit.add(e);
        damageEnemy(e, 1.2, { grogi: 10, kb: 120, ang: P.atkAng, heavy: true, stagger: 0.6, gauge: 5 });
      }
      if (P.t <= 0) startSkillSlash();
    } else if (P.state === 'skill') {
      updateSkillSlash(dt);
    } else if (P.state === 'awaken') {
      updateAwaken(dt);
    } else if (P.state === 'shadow') {
      updateShadow(dt);
    } else if (P.state === 'storm') {
      updateStorm(dt, mx, my);
    } else if (P.state === 'rattack') {
      updateRanged(dt, mx, my, wantAtk || holdAtk);
    } else if (P.state === 'butt') {
      updateButt(dt);
    } else if (P.state === 'cast') {
      updateCast(dt);
    } else if (P.state === 'aim') {
      updateAim(dt, mx, my);
    } else if (P.state === 'pray') {
      updatePray(dt);
    }
    if (P.state === 'idle' && P.comboWin <= 0) P.combo = 0;
    solveObs(P, P.r, P.state === 'dodge' && P.t < BLINK);
    P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r);
    if (['charge', 'skill', 'awaken', 'storm', 'shadow', 'butt'].includes(P.state)) hitCrack(P.x, P.y, 2, 60);
    if (G.bonfire && dist(P, G.bonfire) < 30) P.hp = Math.min(s.hp, P.hp + 20 * dt);
  }
  const BLINK = 0.11;
  // 전투가 끝난 방에서는 두 배로 달린다 (흙먼지·잔상·속도선·발소리)
  function isCalm() { return !!(G.dun && G.dun.cur && G.dun.cur.cleared && !G.sealed && !G.trans && !G.enemies.some(e => !e.dead)); }
  function runFx(dt, mx, my) {
    const P = G.player;
    P.runT = (P.runT || 0) - dt; P.stepT = (P.stepT || 0) - dt;
    if (P.runT <= 0) {
      P.runT = 0.045;
      for (let i = 0; i < 3; i++) G.parts.push({ x: P.x - mx * 6 + rand(-3, 3), y: P.y + rand(-1, 2), vx: -mx * rand(30, 70) + rand(-15, 15), vy: -my * rand(20, 50) - rand(10, 35), t: rand(0.25, 0.45), c: pick(G.stage === 1 ? ['#6a5a3a', '#4a3e28', '#7a6a4a'] : ['#5a5466', '#3e3a46', '#6a6474']), g: 60 });
      G.parts.push({ x: P.x - mx * 10 + rand(-4, 4), y: P.y - rand(6, 18), vx: -mx * 260, vy: -my * 260, t: 0.08, c: '#d8d0c0', g: 0 });
    }
    P.puffT = (P.puffT || 0) - dt; if (P.puffT <= 0) { P.puffT = 0.085; P.foot = -(P.foot || 1); G.fx.push({ kind: 'puff', x: P.x - mx * 8 + my * P.foot * 4, y: P.y + 1 - my * 4 - mx * P.foot * 2, t: 0.32, max: 0.32, c: G.stage === 1 ? '#b8ac8a' : '#8a8494' }); }
    if (P.stepT <= 0) { P.stepT = 0.085; P.stepN = (P.stepN || 0) + 1; sfx('step', P.stepN % 2 ? 1 : 1.25); }
  }
  function blinkBurst(x, y) {
    for (let i = 0; i < 12; i++) { const a = rand(0, TAU), sp = rand(30, 90); G.parts.push({ x, y: y + rand(-8, 8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: rand(0.2, 0.4), c: pick(['#9fd2ff', '#e4f2ff', '#5f86b8']), g: 0, glow: true }); }
    G.fx.push({ kind: 'ring', x, y, r: 4, t: 0.22, max: 0.22, c: '#9fd2ff' });
  }
  // 칼날이 base 기준 상대각 rel0→rel1을 쓸고 지나간 범위 안의 적을 벤다
  function sweepHits(base, sign, rel0, rel1, reach, hitSet, o) {
    const P = G.player, lo = Math.min(rel0, rel1), hi = Math.max(rel0, rel1), px = P.x, py = P.y - PIVOT_Y + 4 - (P.lift || 0);
    for (const e of G.enemies) {
      if (e.dead || hitSet.has(e)) continue;
      const ey = e.y - (e.tall ? e.tall * 0.3 : e.type === 'boss' ? 18 : isElite(e) ? 12 : 6);
      const d = Math.hypot(e.x - px, ey - py);
      if (d > reach + e.r) continue;
      const tol = Math.atan(e.r / Math.max(d, 1)) + 0.05;
      const ra = sign * angDiff(Math.atan2(ey - py, e.x - px), base);
      let hit = d < 14;
      for (let k = -3; k <= 3 && !hit; k++) { const r = ra + k * TAU; if (r >= lo - tol && r <= hi + tol) hit = true; }
      if (hit) { hitSet.add(e); damageEnemy(e, o.coef, Object.assign({ ang: angTo(P, e) }, o)); }
    }
  }

  // 특수기술: 돌진 참격 — 돌진 후 크게 올려베며 검기를 날린다
  const SKILL = { wind: 0.05, swing: 0.13, rec: 0.22, a0: -165, a1: 150, reach: 74 };
  function startSkillSlash() {
    const P = G.player;
    P.state = 'skill'; P.t = 0; P.sign = P.face; P.hitSet = new Set(); P.swingRel = SKILL.a0 * DEG; P.prevRel = P.swingRel; P.swooshed = false;
  }
  function updateSkillSlash(dt) {
    const P = G.player, S = SKILL;
    P.t += dt;
    const end = S.wind + S.swing;
    let rel;
    if (P.t < S.wind) rel = S.a0 * DEG;
    else if (P.t < end) rel = (S.a0 + (S.a1 - S.a0) * easeOut((P.t - S.wind) / S.swing)) * DEG;
    else rel = S.a1 * DEG;
    P.prevRel = P.swingRel; P.swingRel = rel; P.blade = P.atkAng + P.sign * rel;
    if (P.t >= S.wind && P.t - dt < end + 0.02) {
      if (!P.swooshed) {
        P.swooshed = true; sfx('whoosh'); addShake(4, P.atkAng);
        G.proj.push({ x: P.x + Math.cos(P.atkAng) * 16, y: P.y - 9 + Math.sin(P.atkAng) * 16, ang: P.atkAng, sp: 440, t: 0.45, hit: new Set(), r: 24, hist: [] });
      }
      sweepHits(P.atkAng, P.sign, P.prevRel, P.swingRel, S.reach, P.hitSet, { coef: 1.6, grogi: 15, kb: 220, heavy: true, stagger: 0.6, gauge: 6 });
      P.trail.push({ a: P.blade, t: 0.15 });
    }
    if (P.t >= end + S.rec) P.state = 'idle';
  }
  function updateProj(dt) {
    for (const pr of G.proj) {
      pr.hist.push({ x: pr.x, y: pr.y }); if (pr.hist.length > 5) pr.hist.shift();
      pr.ox = pr.x; pr.oy = pr.y; pr.x += Math.cos(pr.ang) * pr.sp * dt; pr.y += Math.sin(pr.ang) * pr.sp * dt; pr.t -= dt;
      if (Math.random() < 0.8) G.parts.push({ x: pr.x + rand(-6, 6), y: pr.y + rand(-14, 14), vx: Math.cos(pr.ang) * 40, vy: Math.sin(pr.ang) * 40, t: 0.25, c: pick(['#9fd2ff', '#ffffff']), g: 0, glow: true });
      for (const e of G.enemies) {
        if (e.dead || pr.hit.has(e)) continue;
        if (Math.hypot(e.x - pr.x, e.y - 8 - pr.y) < pr.r + e.r) { pr.hit.add(e); damageEnemy(e, 1.3, { ang: pr.ang, grogi: 8, kb: 150, gauge: 3, stagger: 0.4 }); }
      }
      if (pr.x < A.x0 - 20 || pr.x > A.x1 + 20 || pr.y < A.y0 - 20 || pr.y > A.y1 + 20 || segSolid(pr.ox, pr.oy + 8, pr.x, pr.y + 8)) { pr.t = 0; hitCrack(pr.x, pr.y + 8, 1, 34); }
    }
    G.proj = G.proj.filter(pr => pr.t > 0);
  }

  // 각성기: 성채의 맹세 — 떠오르며 회전베기 2회 → 거대한 빛의 검을 내려찍는다 → 5초간 받는 피해 30% 감소
  function startAwaken() {
    const P = G.player;
    P.gauge = 0; P.state = 'awaken'; P.t = 0; P.atkAng = P.ang; P.sign = P.face; P.combo = 0; P.queued = false;
    P.awkSet = [new Set(), new Set()]; P.awkSlam = false; P.iframe = 1.45; P.lift = 0; P.giant = 0; P.spinRel = -90 * DEG; P.awkSfx = 0;
    flashT = 0.12; flashColor = '#ffe39a'; sfx('awaken'); addShake(3);
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 50, t: 0.25, max: 0.25, c: '#ffd34d', grow: -180 });
  }
  function updateAwaken(dt) {
    const P = G.player;
    P.t += dt;
    const t = P.t;
    if (t < 0.9 && Math.random() < 0.9) {
      const a = rand(0, TAU), r = rand(34, 64);
      G.parts.push({ x: P.x + Math.cos(a) * r, y: P.y - 10 + Math.sin(a) * r * 0.6, vx: -Math.cos(a) * r * 2.6, vy: -Math.sin(a) * r * 1.6, t: 0.35, c: pick(['#ffd34d', '#fff0b0', '#ffaa40']), g: 0, glow: true });
    }
    if (t < 0.15) {
      P.lift = 7 * (t / 0.15); P.spinRel = -90 * DEG; P.blade = P.atkAng + P.sign * P.spinRel;
    } else if (t < 0.75) {
      const k = (t - 0.15) / 0.6, prev = P.spinRel;
      P.spinRel = -90 * DEG + k * 2 * TAU;
      P.blade = P.atkAng + P.sign * P.spinRel;
      P.face = Math.cos(P.blade) > 0 ? 1 : -1;
      if (P.awkSfx < 2 && k >= P.awkSfx * 0.5) { P.awkSfx++; sfx('whoosh'); G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 20, t: 0.25, max: 0.25, c: '#ffe39a', grow: 220 }); }
      sweepHits(P.atkAng, P.sign, prev, P.spinRel, 72, P.awkSet[k < 0.5 ? 0 : 1], { coef: 1.0, grogi: 7, kb: 90, gauge: 0, stagger: 0.3 });
      P.trail.push({ a: P.blade, t: 0.16 });
    } else if (t < 0.9) {
      const k = (t - 0.75) / 0.15;
      P.lift = 7 + 5 * k; P.giant = easeOut(k); P.face = P.sign;
      P.giantAng = P.atkAng - P.sign * 150 * DEG;
      P.blade = lerpAng(P.blade, P.giantAng, dt * 25);
    } else if (t < 1.03) {
      const k = easeOut((t - 0.9) / 0.11);
      P.giantAng = P.atkAng - P.sign * 150 * DEG + P.sign * 172 * DEG * k;
      P.blade = P.giantAng;
      P.trail.push({ a: P.blade, t: 0.22 });
      if (k >= 0.93 && !P.awkSlam) awakenSlam();
    } else if (t < 1.38) {
      P.lift = Math.max(0, P.lift - dt * 70); P.giant = Math.max(0, 1 - (t - 1.03) / 0.35);
    } else {
      P.state = 'idle'; P.awakenT = 5; P.lift = 0; P.giant = 0;
    }
  }
  function awakenSlam() {
    const P = G.player;
    P.awkSlam = true; P.lift = 0;
    const cx = P.x + Math.cos(P.atkAng) * 72, cy = P.y + Math.sin(P.atkAng) * 58;
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - cx, e.y - cy) < 88 + e.r || dist(e, P) < 56 + e.r) damageEnemy(e, 3.2, { grogi: 30, kb: 280, ang: angTo(P, e), heavy: true, stagger: 0.9, gauge: 0 });
    }
    G.fx.push({ kind: 'ring', x: cx, y: cy, r: 10, t: 0.55, max: 0.55, c: '#ffd34d', grow: 300 });
    G.fx.push({ kind: 'ring', x: cx, y: cy, r: 6, t: 0.3, max: 0.3, c: '#ffffff', grow: 200 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + rand(-0.2, 0.2), r = rand(30, 80); G.fx.push({ kind: 'pillar', x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.6, h: rand(70, 130), t: rand(0.35, 0.6), max: 0.6 }); }
    crack(cx, cy); crack(cx + rand(-20, 20), cy + rand(-10, 10));
    sparks(cx, cy, -Math.PI / 2, '#ffd34d', 18); sparks(cx, cy, Math.PI / 2, '#fff0b0', 10);
    dust(cx, cy, 30);
    flashT = 0.22; flashColor = '#ffe39a'; addShake(11, P.atkAng); hitstop = 0.12;
    sfx('heavy'); sfx('boss');
  }

  // 레인저 특수기술: 그림자 도약
  function smoke(x, y, n) {
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), sp = rand(20, 80); G.parts.push({ x: x + rand(-4, 4), y: y - rand(0, 18), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - 20, t: rand(0.3, 0.6), c: pick(['#2a1238', '#3d1d52', '#120818', '#6b3d8a']), g: -20 }); }
    G.fx.push({ kind: 'ring', x, y: y - 8, r: 6, t: 0.3, max: 0.3, c: '#8a5aa8', grow: 120 });
  }
  function startShadow() {
    const P = G.player;
    let best = null, bd = 1e9;
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = dist(P, e);
      if (d < 210 && Math.abs(angDiff(angTo(P, e), P.ang)) < 0.95 && d < bd) { bd = d; best = e; }
    }
    P.state = 'shadow'; P.t = 0; P.shTarget = best; P.shArrived = false; P.shFrom = { x: P.x, y: P.y };
    P.iframe = Math.max(P.iframe, 0.4); P.combo = 0; P.queued = false; P.hitSet = new Set(); P.swooshed = false;
    G.fx.push({ kind: 'ghost', x: P.x, y: P.y, face: P.face, rot: 0, t: 0.4, max: 0.4, map: 'ranger', pal: 'shadow', sc: 2 });
    smoke(P.x, P.y, 16); sfx('dodge');
  }
  function updateShadow(dt) {
    const P = G.player, T0 = 0.08, W0 = 0.02, SW = 0.12, RC = 0.18;
    P.t += dt;
    if (P.t < T0) return;
    if (!P.shArrived) {
      P.shArrived = true;
      const e = P.shTarget && !P.shTarget.dead ? P.shTarget : null;
      let tx, ty;
      if (e) { const a = angTo(P.shFrom, e); tx = e.x + Math.cos(a) * (e.r + 16); ty = e.y + Math.sin(a) * (e.r + 16) * 0.8; }
      else { tx = P.x + Math.cos(P.ang) * 110; ty = P.y + Math.sin(P.ang) * 110; }
      P.x = clamp(tx, A.x0 + P.r, A.x1 - P.r); P.y = clamp(ty, A.y0 + P.r, A.y1 - P.r);
      G.fx.push({ kind: 'streak', x0: P.shFrom.x, y0: P.shFrom.y - 10, x1: P.x, y1: P.y - 10, t: 0.22, max: 0.22, c: '160,90,220' });
      smoke(P.x, P.y, 14);
      P.atkAng = e ? angTo(P, e) : P.ang; P.face = Math.cos(P.atkAng) > 0 ? 1 : -1; P.sign = P.face;
      P.swingRel = -160 * DEG; P.prevRel = P.swingRel;
      if (e) P.critNext = true; // 등 뒤 기습은 치명타
    }
    const tt = P.t - T0;
    const rel = tt < W0 ? -160 * DEG : (-160 + 320 * easeOut((tt - W0) / SW)) * DEG;
    P.prevRel = P.swingRel; P.swingRel = Math.min(rel, 160 * DEG);
    P.blade = P.atkAng + P.sign * P.swingRel; P.blade2 = P.atkAng - P.sign * P.swingRel;
    if (tt >= W0 && tt - dt < W0 + SW + 0.02) {
      if (!P.swooshed) {
        P.swooshed = true; sfx('whoosh'); addShake(3, P.atkAng);
        G.fx.push({ kind: 'xslash', x: P.x + Math.cos(P.atkAng) * 22, y: P.y - 9 + Math.sin(P.atkAng) * 16, ang: P.atkAng, t: 0.28, max: 0.28 });
      }
      sweepHits(P.atkAng, P.sign, P.prevRel, P.swingRel, 48, P.hitSet, { coef: 2.0, grogi: 14, kb: 150, heavy: true, stagger: 0.6, gauge: 6 });
      P.trail.push({ a: P.blade, t: 0.14 }); P.trail2.push({ a: P.blade2, t: 0.14 });
    }
    if (P.t >= T0 + W0 + SW + RC) P.state = 'idle';
  }
  // 레인저 각성기: 칼날 폭풍
  function startStorm() {
    const P = G.player;
    P.gauge = 0; P.state = 'storm'; P.t = 0; P.stormTick = 0; P.spin = P.ang; P.combo = 0; P.queued = false;
    flashT = 0.12; flashColor = '#9ff0c8'; sfx('awaken'); addShake(4);
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 10, t: 0.4, max: 0.4, c: '#9ff0c8', grow: 220 });
  }
  function updateStorm(dt, mx, my) {
    const P = G.player, s = G.stats, DUR = 3.0;
    P.t += dt;
    P.x += mx * s.spd * 1.2 * dt; P.y += my * s.spd * 1.2 * dt;
    if (mx || my) P.walk += dt * 12;
    P.spin += dt * 26 * (P.face > 0 ? 1 : -1);
    P.blade = P.spin; P.blade2 = P.spin + Math.PI;
    P.trail.push({ a: P.blade, t: 0.12 }); P.trail2.push({ a: P.blade2, t: 0.12 });
    if (Math.random() < 0.9) { const a = rand(0, TAU), r = rand(20, 46); G.parts.push({ x: P.x + Math.cos(a) * r, y: P.y - 8 + Math.sin(a) * r * 0.6, vx: -Math.sin(a) * 120, vy: Math.cos(a) * 70, t: 0.3, c: pick(['#9ff0c8', '#e8fff4', '#3aa070']), g: 0, glow: Math.random() < 0.3 }); }
    P.stormTick -= dt;
    if (P.stormTick <= 0) {
      P.stormTick = 0.1; sfx('swing');
      for (const e of G.enemies) if (!e.dead && dist(e, P) < 58 + e.r) damageEnemy(e, 0.42, { grogi: 3, kb: 40, ang: angTo(P, e), stagger: 0.15, gauge: 0, noStop: true });
    }
    if (P.t >= DUR) {
      P.state = 'idle';
      G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 12, t: 0.45, max: 0.45, c: '#9ff0c8', grow: 260 });
      G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 8, t: 0.3, max: 0.3, c: '#ffffff', grow: 180 });
      for (let i = 0; i < 6; i++) G.fx.push({ kind: 'arcwave', x: P.x, y: P.y - 6, ang: i / 6 * TAU, arc: 50 * DEG, r0: 12, r1: 80, t: 0.3, max: 0.3, c: '120,255,180' });
      for (const e of G.enemies) if (!e.dead && dist(e, P) < 82 + e.r) damageEnemy(e, 1.6, { grogi: 20, kb: 240, ang: angTo(P, e), heavy: true, stagger: 0.7, gauge: 0 });
      crack(P.x, P.y); addShake(7); flashT = 0.1; flashColor = '#9ff0c8'; sfx('heavy');
    }
  }


  // ================================================================ 마법사 · 사제 · 거너
  const RANGED = () => G.cls === 'mage' || G.cls === 'gunner';
  // v0.72 직업 밸런스: 원거리는 안전한 대신 화력을 낮추고, 근접은 「근접 투지」로 버티게
  const GUN_RELOAD = 1.2, GUN_MAG = 5, GUN_RANGE = 400;        // 거너: 5발 발사 후 총을 두 바퀴 돌려 장전
  const MAGE_MANA_MAX = 100, MAGE_BOLT_COST = 20, MAGE_MANA_REGEN = 32;
  const MELEE_DR = 0.85, MELEE_KILL_HEAL = 0.03;               // 근접 투지: 받는 피해 -15%, 적 처치 시 최대 HP 3% 회복
  const heroHand = () => { const P = G.player; return { x: P.x + P.face * 3 - Math.cos(P.blade) * (P.recoil || 0) * 4, y: P.y - 8 - Math.sin(P.blade) * (P.recoil || 0) * 4 }; };
  function staffTip() { const P = G.player, h = heroHand(); return { x: h.x + Math.cos(P.blade) * 30, y: h.y + Math.sin(P.blade) * 30 }; }
  function muzzle() { const P = G.player, h = heroHand(); return { x: h.x + Math.cos(P.blade) * 37, y: h.y - 2 + Math.sin(P.blade) * 37 }; }
  // 직선 위의 적 (along 순 정렬)
  function rayHits(x, y, ang, len, w) {
    const ux = Math.cos(ang), uy = Math.sin(ang), out = [];
    for (const e of G.enemies) {
      if (e.dead) continue;
      const ey = e.y - (e.tall ? e.tall * 0.3 : e.type === 'boss' ? 18 : isElite(e) ? 12 : 8);
      const dx = e.x - x, dy = ey - y, along = dx * ux + dy * uy, perp = Math.abs(dx * uy - dy * ux);
      if (along > -4 && along < len && perp < w + e.r) out.push({ e, along });
    }
    return out.sort((a, b) => a.along - b.along);
  }
  function rayEnd(x, y, ang, len) {
    // 전장 벽에서 멈춘다
    const ux = Math.cos(ang), uy = Math.sin(ang); let L = len;
    if (ux > 0) L = Math.min(L, (A.x1 + 10 - x) / ux); if (ux < 0) L = Math.min(L, (A.x0 - 10 - x) / ux);
    if (uy > 0) L = Math.min(L, (A.y1 + 10 - y) / uy); if (uy < 0) L = Math.min(L, (A.y0 - 40 - y) / uy);
    if (G && G.obs && G.obs.length) for (let k = 6; k < L; k += 5) if (solidAt(x + ux * k, y + uy * k + 10)) { L = k; break; }
    return Math.max(0, L);
  }

  // ---------- 공용: 원거리 기본 공격
  function startRanged() {
    const P = G.player;
    if (G.cls === 'gunner') {
      const near = G.enemies.find(e => !e.dead && dist(e, P) < 30 + e.r && Math.abs(angDiff(angTo(P, e), P.ang)) < 1.3);
      if (near) return startButt();
      if (P.reload > 0) return;
      if (P.ammo <= 0) { P.reload = GUN_RELOAD; return; }
      return fireMusket();
    }
    if (G.cls === 'mage' && P.mana < MAGE_BOLT_COST) return;
    P.state = 'rattack'; P.t = 0; P.fired = false; P.atkAng = P.ang;
  }
  function updateRanged(dt, mx, my, hold) {
    const P = G.player, s = G.stats;
    P.t += dt;
    P.x += mx * s.spd * 0.55 * dt; P.y += my * s.spd * 0.55 * dt;
    if (mx || my) P.walk += dt * 8;
    if (G.cls === 'mage') {
      P.blade = lerpAng(P.blade, P.ang, dt * 28);
      if (!P.fired && P.t >= 0.05) { P.fired = true; castBolt(); }
      if (P.t >= 0.27) { P.state = 'idle'; if (hold) startRanged(); }
    } else {
      P.blade = P.reload > 0 ? P.ang + (1 - P.reload / GUN_RELOAD) * TAU * 2 : lerpAng(P.blade, P.ang, dt * 20);
      if (P.t >= 0.534) P.state = 'idle'; // 현재 연사속도의 절반으로 조정
    }
  }

  // ---------- 마법사
  function rangedWave() { const P = G.player; if (G.stats.efx.has('wave3') && ((P.shotN = (P.shotN || 0) + 1) % 3 === 0)) fireWave(P.ang); }
  function castBolt() { rangedWave();
    const P = G.player; if (P.mana < MAGE_BOLT_COST) { P.state = 'idle'; return; }
    P.mana = Math.max(0, P.mana - MAGE_BOLT_COST); P.boltN = (P.boltN || 0) + 1;
    const big = P.boltN % 3 === 0, tp = staffTip();
    G.mproj.push({ kind: 'bolt', x: tp.x, y: tp.y, ang: P.ang, sp: big ? 360 : 420, t: 0.72, r: big ? 7 : 4, coef: big ? 1.2 : 0.66, big, hist: [] }); // v0.72 밸런스: 0.78/1.4 → 0.66/1.2, 사거리 약 300px
    sfx(big ? 'boltBig' : 'bolt');
    G.fx.push({ kind: 'ring', x: tp.x, y: tp.y, r: 3, grow: big ? 90 : 50, t: 0.15, max: 0.15, c: '#c890ff' });
  }
  function castFireball() {
    const P = G.player, tp = staffTip(), n = G.stats.fx.has('ashstar') ? 3 : 1;
    P.blade = P.ang;
    for (let i = 0; i < n; i++) {
      const a = P.ang + (i - (n - 1) / 2) * 0.3;
      G.mproj.push({ kind: 'fireball', x: tp.x, y: tp.y, ang: a, sp: 300, t: 0.95, r: 9, coef: 2.2, br: n > 1 ? 54 : 66, hist: [] });
    }
    P.state = 'rattack'; P.t = 0.08; P.fired = true;
    sfx('fireball'); addShake(2, P.ang + Math.PI);
    G.fx.push({ kind: 'ring', x: tp.x, y: tp.y, r: 4, grow: 120, t: 0.2, max: 0.2, c: '#ffb060' });
  }
  function fireBlast(x, y, r, coef, burn) {
    sfx('blast'); addShake(5); flashT = Math.max(flashT, 0.04); flashColor = '#ffb060';
    G.fx.push({ kind: 'boom', x, y, r, t: 0.45, max: 0.45 });
    G.fx.push({ kind: 'ring', x, y, r: 6, grow: r * 3.6, t: 0.25, max: 0.25, c: '#ffd080' });
    for (let i = 0; i < 22; i++) { const a = rand(0, TAU), sp = rand(40, 170); G.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 30, t: rand(0.3, 0.7), c: pick(['#ffb060', '#ff6a2a', '#ffe0a0', '#a3161c']), g: 120, glow: true }); }
    splat(x, y, 8, '24,14,10');
    for (const e of G.enemies) {
      if (e.dead || Math.hypot(e.x - x, (e.y - 8 - y) * 1.15) > r + e.r) continue;
      damageEnemy(e, coef, { ang: Math.atan2(e.y - y, e.x - x), grogi: 10, kb: 150, heavy: true, stagger: 0.5, gauge: 4 });
      addBurn(e, burn || 3, 0.22);
    }
  }
  function addBurn(e, dur, coef) { if (e.dead) return; e.burnT = Math.max(e.burnT || 0, dur); e.burnCoef = Math.max(e.burnCoef || 0, coef); if (!(e.burnTick > 0)) e.burnTick = 0.5; }
  function startMeteor() {
    const P = G.player;
    P.gauge = 0; P.state = 'cast'; P.t = 0; P.combo = 0;
    let tx, ty;
    const te = touchAim();
    if (mouse.active > 0) { tx = mouse.x + cam.x; ty = mouse.y + cam.y; } else if (te) { tx = te.x; ty = te.y; } else { tx = P.x + Math.cos(P.ang) * 150; ty = P.y + Math.sin(P.ang) * 150; }
    const d = Math.hypot(tx - P.x, ty - P.y); if (d > 280) { tx = P.x + (tx - P.x) / d * 280; ty = P.y + (ty - P.y) / d * 280; }
    tx = clamp(tx, A.x0 + 20, A.x1 - 20); ty = clamp(ty, A.y0 + 20, A.y1 - 20);
    G.meteor = { x: tx, y: ty, t: 0, dur: 1.0, r: 120, fell: false, post: 0 };
    flashT = 0.1; flashColor = '#ffb060'; sfx('awaken'); addShake(3);
  }
  function updateCast(dt) {
    const P = G.player; P.t += dt;
    P.blade = lerpAng(P.blade, -Math.PI / 2 + P.face * 0.15, dt * 14);
    const tp = staffTip();
    if (Math.random() < 0.9) { const a = rand(0, TAU), r = rand(14, 30); G.parts.push({ x: tp.x + Math.cos(a) * r, y: tp.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, t: 0.22, c: pick(['#ffb060', '#c890ff', '#fff0d0']), g: 0, glow: true }); }
    if (P.t >= 1.05) P.state = 'idle';
  }
  function updateMeteor(dt) {
    const m = G.meteor; if (!m) return;
    m.t += dt;
    if (!m.fell) {
      const k = m.t / m.dur, mx = m.x - (1 - k) * 160, my = m.y - (1 - k) * 420;
      for (let i = 0; i < 3; i++) G.parts.push({ x: mx + rand(-8, 8), y: my + rand(-8, 8), vx: rand(-20, 20) - 60, vy: rand(-60, -20), t: rand(0.3, 0.6), c: pick(['#ffb060', '#ff6a2a', '#5b5560', '#ffe0a0']), g: 0, glow: Math.random() < 0.6 });
      if (m.t >= m.dur) {
        m.fell = true;
        sfx('blast'); sfx('heavy'); addShake(14); flashT = 0.2; flashColor = '#fff0d0'; /* v1.08 역경직 제거 */
        G.fx.push({ kind: 'boom', x: m.x, y: m.y, r: m.r, t: 0.7, max: 0.7 });
        G.fx.push({ kind: 'ring', x: m.x, y: m.y, r: 10, grow: 520, t: 0.35, max: 0.35, c: '#ffd080' });
        G.fx.push({ kind: 'ring', x: m.x, y: m.y, r: 10, grow: 300, t: 0.5, max: 0.5, c: '#ff6a2a' });
        G.fx.push({ kind: 'skybeam', x: m.x, y: m.y, w: 60, c: '255,150,70', t: 0.5, max: 0.5 });
        for (let i = 0; i < 3; i++) crack(m.x + rand(-30, 30), m.y + rand(-16, 16));
        splat(m.x, m.y, 30, '20,12,10');
        for (let i = 0; i < 60; i++) { const a = rand(0, TAU), sp = rand(60, 300); G.parts.push({ x: m.x, y: m.y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 60, t: rand(0.4, 1.0), c: pick(['#ffb060', '#ff6a2a', '#ffe0a0', '#5b5560', '#3a3540']), g: 260, floor: m.y + rand(-20, 20), glow: Math.random() < 0.5 }); }
        for (const e of G.enemies) {
          if (e.dead || Math.hypot(e.x - m.x, (e.y - m.y) * 1.15) > m.r + e.r) continue;
          damageEnemy(e, 5.0, { ang: Math.atan2(e.y - m.y, e.x - m.x), grogi: 45, kb: 320, heavy: true, stagger: 1.0, gauge: 0 });
          addBurn(e, 4, 0.35);
        }
      }
    } else { m.post += dt; if (m.post > 0.7) G.meteor = null; }
  }
  function updateMProj(dt) {
    for (const pr of G.mproj) {
      pr.hist.push({ x: pr.x, y: pr.y }); if (pr.hist.length > 7) pr.hist.shift();
      if (pr.kind === 'bolt') { // 약한 유도
        let best = null, bd = 170;
        for (const e of G.enemies) {
          if (e.dead) continue;
          const d = Math.hypot(e.x - pr.x, e.y - 8 - pr.y);
          if (d < bd && Math.abs(angDiff(Math.atan2(e.y - 8 - pr.y, e.x - pr.x), pr.ang)) < 0.9) { bd = d; best = e; }
        }
        if (best) pr.ang = lerpAng(pr.ang, Math.atan2(best.y - 8 - pr.y, best.x - pr.x), dt * 3.2);
      }
      const ox = pr.x, oy = pr.y; pr.x += Math.cos(pr.ang) * pr.sp * dt; pr.y += Math.sin(pr.ang) * pr.sp * dt; pr.t -= dt;
      const fire = pr.kind === 'fireball';
      if (Math.random() < (fire ? 1 : 0.6)) G.parts.push({ x: pr.x + rand(-2, 2), y: pr.y + rand(-2, 2), vx: -Math.cos(pr.ang) * 30 + rand(-15, 15), vy: -Math.sin(pr.ang) * 30 + rand(-25, 0), t: rand(0.2, 0.4), c: fire ? pick(['#ffb060', '#ff6a2a', '#ffe0a0']) : pick(['#c890ff', '#f0d8ff', '#8a5aa8']), g: 0, glow: true });
      let hitE = null;
      for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - pr.x, e.y - 8 - pr.y) < pr.r + e.r) { hitE = e; break; }
      const wall = pr.x < A.x0 || pr.x > A.x1 || pr.y < A.y0 - 20 || pr.y > A.y1 || segSolid(ox, oy + 8, pr.x, pr.y + 8);
      if (wall) hitCrack(pr.x, pr.y + 8, fire ? 3 : 1, fire ? 60 : 34);
      if (hitE || wall || pr.t <= 0) {
        if (!fire) {
          if (hitE) damageEnemy(hitE, pr.coef, { ang: pr.ang, grogi: pr.big ? 5 : 2, kb: pr.big ? 90 : 30, gauge: pr.big ? 4 : 2, stagger: pr.big ? 0.3 : 0.12, basic: true });
          G.fx.push({ kind: 'ring', x: pr.x, y: pr.y, r: 3, grow: pr.big ? 140 : 70, t: 0.18, max: 0.18, c: '#c890ff' });
          for (let i = 0; i < (pr.big ? 10 : 5); i++) { const a = rand(0, TAU), sp = rand(30, 110); G.parts.push({ x: pr.x, y: pr.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: rand(0.15, 0.35), c: pick(['#c890ff', '#f0d8ff']), g: 0, glow: true }); }
        } else fireBlast(pr.x, pr.y + 8, pr.br, pr.coef);
        pr.dead = true;
      }
    }
    G.mproj = G.mproj.filter(p => !p.dead);
    // 화상
    for (const e of G.enemies) if (!e.dead && e.burnT > 0) {
      e.burnT -= dt; e.burnTick -= dt;
      if (Math.random() < dt * 12) G.parts.push({ x: e.x + rand(-6, 6), y: e.y - rand(4, 20), vx: rand(-5, 5), vy: rand(-40, -20), t: rand(0.2, 0.45), c: pick(['#ffb060', '#ff6a2a', '#ffe0a0']), g: 0, glow: true });
      if (e.burnTick <= 0) { e.burnTick = 0.5; damageEnemy(e, e.burnCoef, { noStop: true, dot: true, gauge: 0.6, ang: 0 }); }
    }
  }
  function drawMProj(pr) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const fire = pr.kind === 'fireball', c1 = fire ? '255,140,60' : '190,120,255';
    pr.hist.forEach((q, i) => { const k = (i + 1) / pr.hist.length; ctx.fillStyle = `rgba(${c1},${0.45 * k})`; ctx.beginPath(); ctx.arc(q.x, q.y, pr.r * (0.4 + 0.6 * k), 0, TAU); ctx.fill(); });
    ctx.fillStyle = `rgba(${c1},0.9)`; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, TAU); ctx.fill();
    ctx.fillStyle = fire ? 'rgba(255,240,200,1)' : 'rgba(250,235,255,1)'; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r * 0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawMeteorMark() {
    const m = G.meteor; if (!m || m.fell) return;
    const k = m.t / m.dur;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,120,40,${0.12 + 0.18 * k})`; ctx.beginPath(); ctx.ellipse(m.x, m.y, m.r, m.r * 0.87, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = `rgba(255,190,90,${0.6 + 0.4 * Math.sin(time * 20)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(m.x, m.y, m.r, m.r * 0.87, 0, 0, TAU); ctx.stroke();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(m.x, m.y, m.r * k, m.r * 0.87 * k, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,230,180,.5)'; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const a = time * 1.5 + i / 6 * TAU; ctx.beginPath(); ctx.moveTo(m.x + Math.cos(a) * m.r * 0.3, m.y + Math.sin(a) * m.r * 0.26); ctx.lineTo(m.x + Math.cos(a + 2) * m.r * 0.9, m.y + Math.sin(a + 2) * m.r * 0.78); ctx.stroke(); }
    ctx.restore();
  }
  function drawMeteorRock() {
    const m = G.meteor; if (!m || m.fell) return;
    const k = m.t / m.dur, mx = m.x - (1 - k) * 160, my = m.y - (1 - k) * 420, R = 12 + k * 8;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createLinearGradient(mx - 120, my - 300, mx, my);
    gr.addColorStop(0, 'rgba(255,120,40,0)'); gr.addColorStop(1, 'rgba(255,170,80,.75)');
    ctx.strokeStyle = gr; ctx.lineWidth = R * 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(mx - 64, my - 168); ctx.lineTo(mx, my); ctx.stroke();
    ctx.fillStyle = 'rgba(255,170,80,.6)'; ctx.beginPath(); ctx.arc(mx, my, R * 1.6, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#2a2026'; ctx.beginPath(); ctx.arc(mx, my, R, 0, TAU); ctx.fill();
    ctx.fillStyle = '#5b4a50'; ctx.beginPath(); ctx.arc(mx - R * 0.25, my - R * 0.25, R * 0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffb060'; ctx.fillRect(Math.round(mx + R * 0.2), Math.round(my), 3, 2); ctx.fillRect(Math.round(mx - R * 0.5), Math.round(my + R * 0.3), 2, 2);
  }

  // ---------- 사제
  const SWING_P = [
    { wind: 0.06, swing: 0.1, rec: 0.16, a0: -120, a1: 95, reach: 40, coef: 0.95, grogi: 5, kb: 70, gauge: 4, lunge: 70 },
    { wind: 0.05, swing: 0.1, rec: 0.16, a0: 105, a1: -110, reach: 40, coef: 1.0, grogi: 5, kb: 70, gauge: 4, lunge: 70 },
    { wind: 0.14, swing: 0.12, rec: 0.26, a0: -175, a1: 35, reach: 44, coef: 1.5, grogi: 12, kb: 160, gauge: 6, lunge: 50, heavy: true, stagger: 0.5, slam: true },
  ];
  function holySlam(x, y) {
    G.fx.push({ kind: 'ring', x, y, r: 6, grow: 200, t: 0.28, max: 0.28, c: '#ffe39a' });
    G.fx.push({ kind: 'skybeam', x, y, w: 16, c: '255,225,140', t: 0.35, max: 0.35 });
    for (let i = 0; i < 12; i++) { const a = rand(0, TAU), sp = rand(40, 120); G.parts.push({ x, y: y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - 20, t: rand(0.25, 0.5), c: pick(['#ffe39a', '#fffbe6', '#c9a24a']), g: 0, glow: true }); }
    crack(x, y); sfx('heavy');
    for (const e of G.enemies) if (!e.dead && !G.player.hitSet.has(e) && Math.hypot(e.x - x, e.y - y) < 56 + e.r) damageEnemy(e, 0.8, { ang: Math.atan2(e.y - y, e.x - x), grogi: 6, kb: 120, stagger: 0.4, gauge: 2, basic: true });
  }
  function castHeal() {
    const P = G.player, s = G.stats;
    const v = Math.round(s.hp * 0.25), got = Math.min(v, Math.round(s.hp - P.hp)); P.hp += got;
    if (got > 0) G.nums.push({ x: P.x, y: P.y - 34, v: '+' + got, t: 0.9, c: '#7dff8a', s: 2 });
    if (s.fx.has('dawn')) P.shieldT = 2;
    P.state = 'pray'; P.t = 0; P.prayDur = 0.38; P.iframe = Math.max(P.iframe, 0.2); P.combo = 0;
    G.fx.push({ kind: 'skybeam', x: P.x, y: P.y, w: 30, c: '255,225,140', t: 0.6, max: 0.6 });
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 6, r: 8, grow: 260, t: 0.32, max: 0.32, c: '#ffe39a' });
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 6, r: 8, grow: 180, t: 0.45, max: 0.45, c: '#7dff8a' });
    for (let i = 0; i < 18; i++) G.parts.push({ x: P.x + rand(-14, 14), y: P.y - rand(0, 10), vx: rand(-10, 10), vy: rand(-70, -30), t: rand(0.5, 0.9), c: pick(['#ffe39a', '#fffbe6', '#7dff8a']), g: 0, glow: true });
    for (const e of G.enemies) if (!e.dead && dist(e, P) < 90 + e.r) damageEnemy(e, 1.1, { ang: angTo(P, e), kb: 200, grogi: 8, stagger: 0.5, gauge: 3, heavy: true });
    sfx('heal'); flashT = 0.06; flashColor = '#ffe39a';
  }
  function startMiracle(revive) {
    const P = G.player, s = G.stats;
    P.gauge = 0; P.hp = s.hp; P.miracleT = 3; P.state = 'pray'; P.t = 0; P.prayDur = 0.7; P.combo = 0;
    slowmo = 0.8; flashT = 0.25; flashColor = '#fffbe6'; sfx('awaken'); sfx('heal'); addShake(6);
    G.eproj = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; G.fx.push({ kind: 'skybeam', x: P.x + Math.cos(a) * 74, y: P.y + Math.sin(a) * 44, w: 16, c: '255,230,150', t: 0.9, max: 0.9 }); }
    G.fx.push({ kind: 'skybeam', x: P.x, y: P.y, w: 70, c: '255,240,190', t: 0.8, max: 0.8 });
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 6, r: 10, grow: 420, t: 0.45, max: 0.45, c: '#fffbe6' });
    G.fx.push({ kind: 'ring', x: P.x, y: P.y - 6, r: 10, grow: 260, t: 0.6, max: 0.6, c: '#ffd34d' });
    for (let i = 0; i < 8; i++) G.fx.push({ kind: 'arcwave', x: P.x, y: P.y - 6, ang: i / 8 * TAU, arc: 40 * DEG, r0: 16, r1: 150, t: 0.4, max: 0.4, c: '255,225,140' });
    for (const e of G.enemies) if (!e.dead && dist(e, P) < 150 + e.r) damageEnemy(e, 3.0, { ang: angTo(P, e), grogi: 35, kb: 280, heavy: true, stagger: 1.0, gauge: 0 });
    if (revive) banner('기적', '빛이 쓰러진 사제를 일으켜 세운다');
  }
  function updatePray(dt) {
    const P = G.player; P.t += dt;
    P.blade = lerpAng(P.blade, -Math.PI / 2 - P.face * 0.25, dt * 18);
    if (P.t >= (P.prayDur || 0.38)) P.state = 'idle';
  }

  // ---------- 거너
  function fireMusket() { rangedWave();
    const P = G.player;
    P.state = 'rattack'; P.t = 0; P.blade = P.ang; P.atkAng = P.ang; P.ammo = Math.max(0, P.ammo - 1); if (P.ammo === 0) P.reload = GUN_RELOAD; P.recoil = 1;
    const m = muzzle(), hits = rayHits(m.x, m.y, P.ang, GUN_RANGE, 5);
    let L = rayEnd(m.x, m.y, P.ang, GUN_RANGE);
    if (!hits.length || hits[0].along > L) hitCrack(m.x + Math.cos(P.ang) * L, m.y + Math.sin(P.ang) * L + 10, 1, 34);
    if (hits.length && hits[0].along <= L) { L = Math.min(L, hits[0].along); damageEnemy(hits[0].e, 2.2, { ang: P.ang, grogi: 9, kb: 120, gauge: 5, stagger: 0.4, heavy: true, basic: true }); }
    gunFx(m, P.ang, L, 1);
    P.x -= Math.cos(P.ang) * 5; P.y -= Math.sin(P.ang) * 5;
    sfx('shot');
  }
  function gunFx(m, ang, L, size) {
    G.fx.push({ kind: 'tracer', x0: m.x, y0: m.y, x1: m.x + Math.cos(ang) * L, y1: m.y + Math.sin(ang) * L, w: 2 * size, t: 0.12 + 0.08 * size, max: 0.12 + 0.08 * size, c: '255,220,150' });
    G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang, s: size, t: 0.08, max: 0.08 });
    for (let i = 0; i < 6 * size; i++) G.parts.push({ x: m.x, y: m.y, vx: Math.cos(ang) * rand(20, 60) + rand(-15, 15), vy: Math.sin(ang) * rand(20, 60) + rand(-25, -5), t: rand(0.4, 0.9), c: pick(['#5b5560', '#8d8496', '#3a3540']), g: -10 });
  }
  function startButt() {
    const P = G.player;
    P.state = 'butt'; P.t = 0; P.atkAng = P.ang; P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.sign = P.face;
    P.hitSet = new Set(); P.swingRel = -100 * DEG; P.prevRel = P.swingRel; P.swooshed = false; P.buttReload = false;
  }
  function updateButt(dt) {
    const P = G.player, W = 0.05, S = 0.1, R = 0.18;
    P.t += dt;
    const rel = P.t < W ? -100 : P.t < W + S ? -100 + 170 * easeOut((P.t - W) / S) : 70;
    P.prevRel = P.swingRel; P.swingRel = rel * DEG; P.blade = P.atkAng + P.sign * P.swingRel + Math.PI;
    if (P.t >= W && P.t - dt < W + S + 0.02) {
      if (!P.swooshed) { P.swooshed = true; sfx('swing'); }
      P.x += Math.cos(P.atkAng) * 90 * dt; P.y += Math.sin(P.atkAng) * 90 * dt;
      sweepHits(P.atkAng, P.sign, P.prevRel, P.swingRel, 36, P.hitSet, { coef: 0.9, grogi: 6, kb: 230, stagger: 0.55, gauge: 4, heavy: true, basic: true });
      P.trail.push({ a: P.atkAng + P.sign * P.swingRel, t: 0.11 });
    }
    // 개머리판 공격은 탄창 재장전을 생략하지 않는다
    if (P.t >= W + S + R) P.state = 'idle';
  }
  function fireShotgun() {
    const P = G.player;
    P.state = 'rattack'; P.t = 0; P.blade = P.ang; P.recoil = 1.8; P.reload = 0; P.ammo = GUN_MAG;
    const m = muzzle();
    for (let i = 0; i < 9; i++) { const a = P.ang + rand(-0.55, 0.55); G.fx.push({ kind: 'tracer', x0: m.x, y0: m.y, x1: m.x + Math.cos(a) * rand(100, 150), y1: m.y + Math.sin(a) * rand(100, 150), w: 1, t: 0.14, max: 0.14, c: '255,210,140' }); }
    G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang: P.ang, s: 2.2, t: 0.1, max: 0.1 });
    G.fx.push({ kind: 'arcwave', x: P.x, y: P.y - 8, ang: P.ang, arc: 70 * DEG, r0: 20, r1: 150, t: 0.22, max: 0.22, c: '255,190,110' });
    for (let i = 0; i < 16; i++) G.parts.push({ x: m.x, y: m.y, vx: Math.cos(P.ang) * rand(30, 90) + rand(-30, 30), vy: Math.sin(P.ang) * rand(30, 90) + rand(-40, 0), t: rand(0.5, 1.0), c: pick(['#5b5560', '#8d8496', '#3a3540']), g: -10 });
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = dist(e, P);
      if (d < 150 + e.r && Math.abs(angDiff(angTo(P, e), P.ang)) < 0.62) damageEnemy(e, 2.4 * (1 - Math.min(d, 150) / 150 * 0.5), { ang: angTo(P, e), kb: 300, grogi: 10, stagger: 0.7, heavy: true, gauge: 4 });
    }
    P.x -= Math.cos(P.ang) * 26; P.y -= Math.sin(P.ang) * 26;
    sfx('shotgun'); addShake(7, P.ang + Math.PI); flashT = 0.05; flashColor = '#ffd080';
  }
  function startSnipe() {
    const P = G.player;
    P.gauge = 0; P.state = 'aim'; P.t = 0; P.combo = 0; P.blade = P.ang;
    sfx('aim'); flashT = 0.08; flashColor = '#ffd080';
  }
  function updateAim(dt, mx, my) {
    const P = G.player, s = G.stats;
    P.t += dt;
    P.blade = lerpAng(P.blade, P.ang, dt * 7);
    P.x += mx * s.spd * 0.2 * dt; P.y += my * s.spd * 0.2 * dt;
    const m = muzzle();
    if (Math.random() < 0.8) { const a = rand(0, TAU), r = rand(16, 34) * (1 - P.t / 2.4); G.parts.push({ x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 5, vy: -Math.sin(a) * r * 5, t: 0.2, c: pick(['#ffd080', '#fff0d0', '#ff6a2a']), g: 0, glow: true }); }
    if (P.t >= 2.0) fireSnipe();
  }
  function fireSnipe() {
    const P = G.player, m = muzzle(), ang = P.blade, s = G.stats;
    const L = rayEnd(m.x, m.y, ang, 900);
    for (const h of rayHits(m.x, m.y, ang, L, 12)) {
      let coef = 7.0; if (s.fx.has('undertaker') && h.e.grogiT > 0) coef *= 2;
      damageEnemy(h.e, coef, { ang, grogi: 60, kb: 340, heavy: true, stagger: 1.2, gauge: 0 });
    }
    G.fx.push({ kind: 'tracer', x0: m.x, y0: m.y, x1: m.x + Math.cos(ang) * L, y1: m.y + Math.sin(ang) * L, w: 12, t: 0.4, max: 0.4, c: '255,200,110' });
    G.fx.push({ kind: 'tracer', x0: m.x, y0: m.y, x1: m.x + Math.cos(ang) * L, y1: m.y + Math.sin(ang) * L, w: 4, t: 0.5, max: 0.5, c: '255,255,240' });
    G.fx.push({ kind: 'muzzle', x: m.x, y: m.y, ang, s: 3, t: 0.14, max: 0.14 });
    G.fx.push({ kind: 'ring', x: m.x, y: m.y, r: 6, grow: 260, t: 0.3, max: 0.3, c: '#ffd080' });
    for (let i = 0; i < 30; i++) { const k = Math.random() * L; G.parts.push({ x: m.x + Math.cos(ang) * k, y: m.y + Math.sin(ang) * k, vx: rand(-30, 30), vy: rand(-40, 0), t: rand(0.3, 0.7), c: pick(['#ffd080', '#fff0d0', '#5b5560']), g: 0, glow: Math.random() < 0.5 }); }
    P.x -= Math.cos(ang) * 40; P.y -= Math.sin(ang) * 40;
    P.state = 'rattack'; P.t = 0; P.recoil = 2.5; P.reload = 0; P.ammo = GUN_MAG;
    sfx('snipe'); addShake(12, ang + Math.PI); flashT = 0.12; flashColor = '#fff0d0'; slowmo = Math.max(slowmo, 0.35); /* v1.08 역경직 제거 */
  }
  // 거너 조준점: 총구에서 탄이 닿는 곳까지 점선, 끝에 조준경 (적을 겨누면 붉게)
  function drawGunAim() {
    const P = G.player; if (G.cls !== 'gunner' || P.dead || P.state === 'aim' || P.state === 'butt') return;
    const m = muzzle(), ang = P.blade, hits = rayHits(m.x, m.y, ang, GUN_RANGE, 5), L = hits.length ? hits[0].along : rayEnd(m.x, m.y, ang, GUN_RANGE);
    const ready = P.reload <= 0, on = hits.length > 0, col = on ? '255,80,60' : '240,230,210';
    ctx.save();
    for (let d = 10; d < L - 8; d += 8) { ctx.fillStyle = `rgba(${col},${(ready ? 0.7 : 0.3) * (1 - d / 600)})`; ctx.fillRect(Math.round(m.x + Math.cos(ang) * d), Math.round(m.y + Math.sin(ang) * d), 2, 2); }
    const tx = Math.round(m.x + Math.cos(ang) * L), ty = Math.round(m.y + Math.sin(ang) * L), r = ready ? 6 : 5 + 4 * (P.reload / GUN_RELOAD);
    ctx.fillStyle = '#000'; for (const [dx, dy, w, h] of [[-r - 4, 0, 5, 2], [r, 0, 5, 2], [0, -r - 4, 2, 5], [0, r, 2, 5]]) ctx.fillRect(tx + dx - 1, ty + dy - 1, w + 2, h + 2);
    ctx.fillStyle = `rgba(${col},${ready ? 1 : 0.5})`;
    ctx.fillRect(tx - r - 4, ty, 5, 2); ctx.fillRect(tx + r, ty, 5, 2); ctx.fillRect(tx, ty - r - 4, 2, 5); ctx.fillRect(tx, ty + r, 2, 5);
    ctx.fillRect(tx, ty, 2, 2);
    if (on && ready) { ctx.strokeStyle = `rgba(${col},.8)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(tx + 1, ty + 1, r + 2, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
  function drawAimLine() {
    const P = G.player; drawGunAim(); if (P.state !== 'aim') return;
    const m = muzzle(), L = rayEnd(m.x, m.y, P.blade, 900), k = Math.min(1, P.t / 2);
    const blinkW = k > 0.8 && Math.floor(time * 20) % 2 === 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = blinkW ? 'rgba(255,255,255,.9)' : `rgba(255,60,40,${0.25 + 0.6 * k})`; ctx.lineWidth = Math.max(1, 10 * (1 - k));
    ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + Math.cos(P.blade) * L, m.y + Math.sin(P.blade) * L); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,200,.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + Math.cos(P.blade) * L, m.y + Math.sin(P.blade) * L); ctx.stroke();
    ctx.restore();
  }

  // ---------- 그리기 (마법사·사제·거너 공용)
  function drawHero() {
    const P = G.player, C = CL(), cls = G.cls;
    const tex = cls === 'priest' && (P.miracleT > 0 || P.state === 'pray') && weaponTier('priest') < 3 ? TOOLS.maceH : weaponTex(cls);
    if (P.dead) {
      drawShadow(P.x, P.y + 1, 8);
      drawBlade(tex, P.x + 10, P.y - 2, 0.2, 0.9);
      drawSprite(C.map, C.pal, 2, P.x, P.y + 4, P.face < 0, { rot: Math.PI / 2 * P.face, alpha: 0.85 });
      return;
    }
    if (P.state === 'dodge' && P.t < BLINK) return;
    const blink = P.inv > 0 && Math.floor(time * 16) % 2 === 0;
    drawShadow(P.x, P.y + 1, 8);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (P.state === 'cast') {
      ctx.strokeStyle = `rgba(255,150,70,${0.6 + Math.sin(time * 18) * 0.2})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(P.x, P.y, 22, 8, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = time * 4 + i / 6 * TAU; ctx.fillStyle = 'rgba(255,200,120,.9)'; ctx.fillRect(Math.round(P.x + Math.cos(a) * 22), Math.round(P.y + Math.sin(a) * 8), 2, 2); }
    }
    if (P.state === 'aim') { ctx.strokeStyle = `rgba(255,80,40,${0.4 + Math.sin(time * 16) * 0.2})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(P.x, P.y, 16 - P.t * 4, 6 - P.t * 1.5, 0, 0, TAU); ctx.stroke(); }
    if (P.miracleT > 0) { ctx.fillStyle = `rgba(255,220,120,${0.18 + Math.sin(time * 10) * 0.06})`; ctx.beginPath(); ctx.ellipse(P.x, P.y, 22, 9, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    const bob = P.state === 'idle' && P.moving ? -Math.abs(Math.sin(P.walk)) * 1.5 : 0;
    let rot = 0, alpha = blink ? 0.45 : 1, sx = 1, sy = 1;
    if (P.state === 'dodge') { alpha = 0.5 + 0.5 * clamp((P.t - BLINK) / 0.09, 0, 1); sx = 0.9; sy = 1.1; }
    if (P.state === 'attack') {
      const st = SWING_P[P.combo];
      if (P.t < st.wind) { rot = -0.15 * P.face; sy = 0.94; }
      else if (P.t < st.wind + st.swing) { rot = 0.2 * P.face; sx = 1.06; sy = 0.96; }
    }
    if (P.state === 'butt') { rot = (P.t < 0.05 ? -0.15 : 0.2) * P.face; sx = 1.06; }
    if (P.recoil > 0) { rot = -0.1 * P.face * P.recoil; }
    if (P.state === 'pray') sy = 1.05;
    if (P.state === 'idle' && P.moving) sy = 1 + Math.sin(P.walk * 2) * 0.04;
    const h = heroHand(), hy = h.y + bob;
    const behind = cls === 'priest' ? (P.state === 'idle' || P.state === 'dodge') : (Math.sin(P.blade) < -0.45 && P.state !== 'cast' && P.state !== 'butt');
    if (cls === 'priest' && P.state === 'attack') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawTrail(P.trail, h.x, hy, 10, tex.reach, '255,226,150', P.combo === 2); ctx.restore();
    }
    if (cls === 'gunner' && P.state === 'butt') drawTrail(P.trail, h.x, hy, 4, 30, '230,220,200', true);
    if (behind) drawBlade(tex, h.x, hy, P.blade, alpha);
    drawSprite(C.map, C.pal, 2, P.x, P.y + 2 + bob, P.face < 0, { rot, alpha, white: P.hurtT > 0.12, sx, sy });
    if (!behind) drawBlade(tex, h.x, hy, P.blade, alpha);
    weaponAura(tex, h.x, hy, P.blade, cls);
    if (cls === 'mage') {
      const tp = staffTip(), big = P.state === 'cast';
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = big ? 'rgba(255,170,80,.55)' : 'rgba(190,120,255,.4)'; ctx.beginPath(); ctx.arc(tp.x, tp.y + bob, (big ? 9 : 4) + Math.sin(time * 9), 0, TAU); ctx.fill();
      ctx.restore();
      const mw = 22, mh = 2, mx = Math.round(P.x - mw / 2), my = Math.round(P.y - 38);
      ctx.fillStyle = '#000'; ctx.fillRect(mx - 1, my - 1, mw + 2, mh + 2);
      ctx.fillStyle = '#694a80'; ctx.fillRect(mx, my, mw, mh);
      ctx.fillStyle = '#c890ff'; ctx.fillRect(mx, my, Math.round(mw * P.mana / MAGE_MANA_MAX), mh);
    }
    if (P.shieldT > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,236,160,${0.5 + Math.sin(time * 14) * 0.2})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(P.x, P.y - 10, 15, 17, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
    if (cls === 'gunner') return;
    ctx.fillStyle = 'rgba(232,228,216,.45)';
    ctx.fillRect(Math.round(P.x + Math.cos(P.ang) * 26) - 1, Math.round(P.y - 8 + Math.sin(P.ang) * 26) - 1, 2, 2);
  }

  function startAttack(i) {
    const P = G.player, st = swingTable()[i];
    P.state = 'attack'; P.combo = i; P.t = 0; P.queued = false; P.atkAng = P.ang; P.hitSet = new Set();
    P.face = Math.cos(P.ang) > 0 ? 1 : -1; P.sign = P.face;
    P.swingRel = st.a0 * DEG; P.prevRel = P.swingRel;
    P.swooshed = false; P.slamDone = false;
  }
  function updateSwing(dt, wantAtk, mx, my) {
    const P = G.player, s = G.stats, st = swingTable()[P.combo];
    P.t += dt;
    if (wantAtk) P.queued = true;
    const tSwingEnd = st.wind + st.swing, total = tSwingEnd + st.rec;
    let rel;
    if (P.t < st.wind) rel = (st.a0 - 12 * (P.t / st.wind)) * DEG;                // 예비동작: 살짝 더 젖힌다
    else if (P.t < tSwingEnd) rel = (st.a0 - 12 + (st.a1 - st.a0 + 12) * easeOut((P.t - st.wind) / st.swing)) * DEG;
    else rel = (st.a1 + 6 * Math.sin(Math.min(1, (P.t - tSwingEnd) / st.rec) * Math.PI)) * DEG;
    P.prevRel = P.swingRel; P.swingRel = rel;
    const ranger = G.cls === 'ranger';
    if (!ranger || P.combo === 0) P.blade = P.atkAng + P.sign * rel;
    if (ranger && P.combo === 1) { P.blade2 = P.atkAng + P.sign * rel; P.blade = lerpAng(P.blade, P.atkAng + P.sign * 70 * DEG, dt * 20); }
    if (ranger && P.combo === 2) { P.blade = P.atkAng + P.sign * rel; P.blade2 = P.atkAng - P.sign * rel; }
    if (ranger && P.combo === 0) P.blade2 = lerpAng(P.blade2, P.atkAng - P.sign * 120 * DEG, dt * 20);
    const swinging = P.t >= st.wind && P.t - dt < tSwingEnd + 0.02;
    if (swinging) {
      if (!P.swooshed) { P.swooshed = true; sfx(st.heavy ? 'whoosh' : 'swing'); }
      // 휘두르는 동안 앞으로 내딛는다
      P.x += Math.cos(P.atkAng) * st.lunge * dt; P.y += Math.sin(P.atkAng) * st.lunge * dt;
      // 지난 프레임~이번 프레임 사이 칼날이 쓸고 간 각도 안의 적을 벤다
      const lo = Math.min(P.prevRel, P.swingRel), hi = Math.max(P.prevRel, P.swingRel);
      const px = P.x, py = P.y - PIVOT_Y + 4;
      for (const e of G.enemies) {
        if (e.dead || P.hitSet.has(e)) continue;
        const ey = e.y - (e.tall ? e.tall * 0.3 : e.type === 'boss' ? 18 : isElite(e) ? 12 : 6);
        const d = Math.hypot(e.x - px, ey - py);
        if (d > st.reach + e.r) continue;
        const tol = Math.atan(e.r / Math.max(d, 1)) + 0.05;
        const ra = P.sign * angDiff(Math.atan2(ey - py, e.x - px), P.atkAng);
        let hit = false;
        for (const k of [-1, 0, 1]) { const r = ra + k * TAU; if (r >= lo - tol && r <= hi + tol) hit = true; }
        if (d < 14) hit = true;
        if (hit) {
          P.hitSet.add(e);
          damageEnemy(e, st.coef, { grogi: st.grogi, kb: st.kb, ang: angTo(P, e), heavy: st.heavy, stagger: st.stagger, gauge: st.gauge, basic: true });
        }
      }
      hitCrack(P.x + Math.cos(P.atkAng) * 30, P.y + Math.sin(P.atkAng) * 22, st.heavy ? 3 : 1, st.reach + 14);
      if (!ranger || P.combo !== 1) P.trail.push({ a: P.blade, t: 0.11 });
      if (ranger && P.combo >= 1) P.trail2.push({ a: P.blade2, t: 0.11 });
      if (st.slam && P.t >= tSwingEnd - dt && !P.slamDone) { P.slamDone = true; holySlam(P.x + Math.cos(P.atkAng) * 26, P.y + Math.sin(P.atkAng) * 18); }
      if (P.combo === 2 && s.efx.has('wave3') && P.t >= tSwingEnd - dt && !P.waveDone) { P.waveDone = true; fireWave(P.atkAng); }
      if (P.combo === 2 && s.fx.has('ember') && P.t >= tSwingEnd - dt && !P.emberDone) {
        P.emberDone = true;
        G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 20, t: 0.3, max: 0.3, c: '#ffaa50', grow: 240 });
        for (const e of G.enemies) if (!e.dead && dist(e, P) < 110 && !P.hitSet.has(e)) damageEnemy(e, 1.0, { grogi: 6, gauge: 2, ang: angTo(P, e), basic: true });
      }
    } else {
      P.x += mx * s.spd * 0.25 * dt; P.y += my * s.spd * 0.25 * dt;
    }
    // 후딜 중간부터 다음 타로 연결
    if (P.queued && P.combo < 2 && P.t >= tSwingEnd + st.rec * 0.35) { P.emberDone = false; P.waveDone = false; startAttack(P.combo + 1); return; }
    if (P.t >= total) { P.emberDone = false; P.waveDone = false; P.state = 'idle'; P.comboWin = P.combo < 2 ? 0.4 : 0; P.combo = P.combo < 2 ? P.combo + 1 : 0; }
  }

  // ---------------------------------------------------------------- 효과
  function burst(x, y, c, n, dir) {
    for (let i = 0; i < n; i++) {
      const a = dir == null ? rand(0, TAU) : dir + rand(-0.8, 0.8), s = rand(40, 140);
      G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, t: rand(0.3, 0.7), c, g: 280, floor: y + rand(8, 16) });
    }
  }
  function dust(x, y, n) { for (let i = 0; i < n; i++) { const a = rand(0, TAU), s = rand(10, 50); G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.4 - 6, t: rand(0.3, 0.6), c: '#5b5560', g: 0 }); } }
  function sparks(x, y, ang, c, n) { for (let i = 0; i < n; i++) G.fx.push({ kind: 'spark', x, y, ang: ang + rand(-0.9, 0.9), len: rand(6, 14), sp: rand(120, 220), t: 0.14, max: 0.14, c }); }
  function crack(x, y) {
    return; // 땅 갈라짐 효과는 끔
    dg.strokeStyle = 'rgba(8,6,10,.7)'; dg.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      let cx = x, cy = y, a = rand(0, TAU);
      dg.beginPath(); dg.moveTo(cx, cy);
      for (let k = 0; k < 5; k++) { a += rand(-0.5, 0.5); cx += Math.cos(a) * rand(4, 9); cy += Math.sin(a) * rand(3, 6); dg.lineTo(Math.round(cx), Math.round(cy)); }
      dg.stroke();
    }
  }
  function debris(x, y, n) {
    for (let i = 0; i < n; i++) { const a = rand(0, TAU), sp = rand(40, 160); G.parts.push({ x, y: y - 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - rand(60, 140), t: rand(0.4, 0.8), c: pick(['#3a3642', '#2a2731', '#4d4858', '#1d1a23']), g: 420, floor: y + rand(-4, 8) }); }
  }
  function hitStunTick(e, dt) {
    e.hitStun -= dt; e.flash = Math.max(0, e.flash - dt);
    e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= Math.pow(0.0015, dt); e.vy *= Math.pow(0.0015, dt);
    e.lean *= Math.pow(0.05, dt);
  }
  function updateCorpse(c, dt) {
    const e = c.e;
    c.t -= dt;
    e.x = clamp(e.x + c.vx * dt, A.x0 + 4, A.x1 - 4); e.y = clamp(e.y + c.vy * dt, A.y0 + 4, A.y1 - 4);
    c.vx *= Math.pow(c.bounced ? 0.004 : 0.3, dt); c.vy *= Math.pow(c.bounced ? 0.004 : 0.3, dt);
    c.z += c.vz * dt; c.vz -= 900 * dt; c.rot += c.vr * dt;
    if (c.z < 0) {
      c.z = 0;
      if (!c.bounced) { c.bounced = true; c.vz = 90; c.vr *= 0.3; dust(e.x, e.y, 6); }
      else { c.vz = 0; c.vr = 0; }
    }
    if (c.t <= 0) dust(e.x, e.y - 6, 8);
  }
  function drawCorpse(c) {
    const e = c.e, k = c.t / c.max, of = e.flash, ox = e.x, oy = e.y;
    e.flash = c.max - c.t < 0.08 ? 1 : 0;
    // v1.05: 몸을 따로 그린 뒤 칸 단위로 눕히고 찌그러뜨림 (매끈한 회전 금지)
    const bx = snap2(e.x), by = snap2(oy - 10), wf = e.flash ? 'snapW' : 'snap';
    if (!c[wf]) { const [cv2, g2] = mkCanvas(240, 240), main = ctx; g2.imageSmoothingEnabled = false; g2.setTransform(1, 0, 0, 1, 120 - bx, 170 - by); ctx = g2; try { drawEnemy(e); } finally { ctx = main; } c[wf] = cv2; } // 죽는 순간 한 번만 찍어 둠
    const t = pxXform(c[wf], 2, c.rot, 1 + (1 - k) * 0.15, 1 - (1 - k) * 0.35, false, { pvx: 120, pvy: 170 });
    ctx.save(); ctx.globalAlpha = Math.min(1, k * 2.5); ctx.drawImage(t.c, bx - t.ax, snap2(oy - 10 - c.z) - t.ay); ctx.restore();
    e.flash = of; e.x = ox; e.y = oy;
  }
  function addShake(n, ang) {
    shake = Math.max(shake, n);
    if (ang != null) { shakeX += Math.cos(ang) * n * 0.6; shakeY += Math.sin(ang) * n * 0.6; }
  }

  // ---------------------------------------------------------------- 필드 드랍 (잡몹·엘리트)
  // 체력 물약: HP 회복 / 투지 구슬: 각성 게이지 / 금화 주머니: 골드 / 핏빛 영약: 8초 공격력 +30% / 장비: 낮은 확률, 줍는 즉시 더 좋으면 바로 장착
  const LOOT = {
    meat:  { n: '체력 물약', map: 'potion', sc: 3, c: '#ff6a6a', light: '255,60,70' },
    bigmeat: { n: '대형 체력 물약', map: 'potion', sc: 4, c: '#ff6a6a', light: '255,60,70' },
    orb:   { n: '투지 구슬', map: 'orb', sc: 3, c: '#ffd34d', light: '255,210,90' },
    pouch: { n: '금화 주머니', map: 'pouch', sc: 3, c: '#ffd34d', light: '255,210,120' },
    vial:  { n: '핏빛 영약', map: 'vial', sc: 3, c: '#e070d0', light: '220,60,200' },
    gear:  { n: '장비', map: 'gear', sc: 2 },
    sealkey: { n: '봉인 열쇠', map: null, sc: 2, get c() { return SK().c; }, get light() { return SK().rgb; } }, // v1.18 엘리트가 떨어뜨리는 보스 문 열쇠 (챕터마다 다름)
  };
  // 잡몹 한 마리당 소모품은 최대 1개, 장비는 따로 굴린다
  const LOOT_TABLE = [['meat', 0.03], ['orb', 0.05], ['pouch', 0.03], ['vial', 0.01]];
  function spawnLoot(type, x, y, it) {
    const a = rand(0, TAU), sp = rand(30, 70);
    if (type === 'gear' && it && it.grade === 'legend') { sfx('legend'); flashT = Math.max(flashT, 0.06); flashColor = '#ff9a2e'; G.fx.push({ kind: 'skybeam', x, y, w: 24, c: '255,160,60', t: 0.7, max: 0.7 }); }
    G.loot.push({ type, it, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, z: 6, vz: rand(110, 150), t: 0, life: 1e9, /* v1.19 바닥에 떨어진 아이템은 사라지지 않는다 */ bob: rand(0, TAU) });
  }
  function rollLoot(e) {
    if (isSemi(e)) {
      if (Math.random() < 0.10) spawnLoot('bigmeat', e.x, e.y);
      if (Math.random() < 0.3) spawnLoot(pick(['orb', 'pouch', 'vial']), e.x, e.y);
    } else if (isElite(e)) {
      if (Math.random() < 0.30) spawnLoot('bigmeat', e.x, e.y);
      if (Math.random() < 0.7) spawnLoot(pick(['orb', 'pouch', 'vial']), e.x, e.y);
    } else {
      let r = Math.random();
      for (const [k, p] of LOOT_TABLE) { if (r < p) { spawnLoot(k, e.x, e.y); break; } r -= p; }
    }
    if (Math.random() < (isElite(e) ? (G.stage === 3 ? 0.08 : 0.05) : isSemi(e) ? 0.03 : 0.0084)) spawnLoot('gear', e.x, e.y, makeItem(G.cls));
  }
  // 물약은 HP가, 구슬은 게이지가 가득 차 있으면 줍지 않고 바닥에 남겨 둔다 (필요할 때 주우러 가기)
  function lootWanted(l) {
    const P = G.player, s = G.stats;
    if (l.type === 'meat' || l.type === 'bigmeat') return P.hp < s.hp || P.poisonT > 0;
    if (l.type === 'orb') return P.gauge < 100;
    return true;
  }
  // ---- v0.99 장비 효과 이펙트: 컨셉별 도트 연출 (2px 칸 · 검은/어두운 외곽선 · 디더). 바닥에 깔리는 것은 drawGearGround, 서 있는 것은 gearEnts(깊이 정렬), 나머지는 drawFx
  const GX = {
    // 결정적 난수 (프레임마다 같은 모양을 유지하거나 일정 간격으로 바꿀 때)
    hr(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); },
    c(x, y, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x) & ~1, Math.round(y) & ~1, 2, 2); },
    // 칸 목록을 외곽선과 함께: cells = [[x, y, col], ...]
    shape(cells, ol = '#0b0a0e', a = 1) {
      ctx.globalAlpha = a; ctx.fillStyle = ol;
      for (const q of cells) ctx.fillRect((Math.round(q[0]) & ~1) - 2, (Math.round(q[1]) & ~1) - 2, 6, 6);
      for (const q of cells) { ctx.fillStyle = q[2]; ctx.fillRect(Math.round(q[0]) & ~1, Math.round(q[1]) & ~1, 2, 2); }
      ctx.globalAlpha = 1;
    },
    // 바닥 타원 고리 (디더로 두께·옅어짐)
    ring(x, y, r, col, a, thick = 1, ry = 0.55, gap = 0, rot = 0) {
      const n = Math.max(24, Math.round(r * 1.5)); ctx.fillStyle = `rgba(${col},${a})`;
      for (let i = 0; i < n; i++) { if (gap && i % gap === 0) continue; const t = i / n * TAU + rot; for (let k = 0; k < thick; k++) { const rr = r - k * 2; ctx.fillRect(Math.round(x + Math.cos(t) * rr) & ~1, Math.round(y + Math.sin(t) * rr * ry) & ~1, 2, 2); } }
    },
    // 디더 원판 (가운데 진하고 바깥 옅게)
    disc(x, y, r, col, a, ry = 1, lv = 0.9) {
      ctx.fillStyle = `rgba(${col},${a})`; const R = Math.max(2, r), Ry = Math.max(2, r * ry);
      for (let yy = Math.round(y - Ry) & ~1; yy <= y + Ry; yy += 2) for (let xx = Math.round(x - R) & ~1; xx <= x + R; xx += 2) { const q = Math.hypot((xx - x) / R, (yy - y) / Ry); if (q < 1 && dith(xx >> 1, yy >> 1, lv * (1 - q * q))) ctx.fillRect(xx, yy, 2, 2); }
    },
    // 2px 선 (외곽선 있음/없음)
    line(x0, y0, x1, y1, col, ol) {
      const L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / 2)), pts = [];
      for (let i = 0; i <= n; i++) pts.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, col]);
      if (ol) GX.shape(pts, ol); else for (const p of pts) GX.c(p[0], p[1], col);
    },
    // 바닥에 떨어지는 조각: 출발·속도·높이를 시간으로 계산 (튕김 1회)
    bit(b, el) {
      const T = Math.min(el, b.land), x = b.x + b.vx * T, y = b.y + b.vy * T * 0.6, z = Math.max(0, b.vz * T - 260 * T * T);
      return { x, y, z, landed: el >= b.land };
    },
  };
  const fxPush = f => { f.max = f.max || f.t; G.fx.push(f); return f; };
  const gxEl = f => f.max - f.t; // 지난 시간

  // 시체 폭발: 살점·뼛조각이 튀고, 핏빛 충격파 + 짧은 섬광, 바닥에 피
  function gxCorpse(e) {
    const bits = []; for (let i = 0; i < 16; i++) { const a = rand(0, TAU), sp = rand(50, 150); bits.push({ x: e.x, y: e.y - 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(90, 180), land: 0, bone: i % 3 === 0, c: pick(['#8a1a20', '#a3242a', '#5a0e12']) }); }
    for (const b of bits) b.land = b.vz / 130;
    fxPush({ kind: 'gx_corpse', x: e.x, y: e.y, t: 0.75, bits, r: 64 });
    splat(e.x, e.y, 34); splat(e.x + rand(-10, 10), e.y + rand(-4, 4), 18);
    for (let i = 0; i < 8; i++) { const a = rand(-Math.PI, 0); G.parts.push({ x: e.x, y: e.y - 10, vx: Math.cos(a) * rand(40, 110), vy: Math.sin(a) * rand(60, 150), t: rand(0.3, 0.6), c: pick(['#c0303a', '#7a1018', '#ff6a40']), g: 300, floor: e.y + rand(-4, 6) }); }
    addShake(2.5); sfx('crunch', 0.8); sfx('blast', 1.3);
  }
  // 불길 점멸: 점화 순간
  function gxIgnite(x, y) { fxPush({ kind: 'gx_ignite', x, y, t: 0.4 }); sfx('fireball', 1.4); }
  // 검기: 앞으로 날아가는 초승달 칼날
  function gxWave(ang) {
    const P = G.player, col = { knight: ['220,235,255', '#8fb8ff'], ranger: ['230,210,255', '#b08aff'], priest: ['255,240,200', '#ffd060'], mage: ['200,230,255', '#6ab8ff'], gunner: ['255,225,190', '#ff9a50'] }[G.cls] || ['220,235,255', '#8fb8ff'];
    fxPush({ kind: 'gx_wave', x: P.x, y: P.y - 10, ang, t: 0.3, c: col[0], c2: col[1] });
  }
  // 출혈: 상처에서 뿜는 피
  function gxSpurt(e, n = 9, ang) {
    const a0 = ang == null ? rand(-Math.PI, 0) : ang, h = enemyH(e) * 0.5;
    for (let i = 0; i < n; i++) { const a = a0 + rand(-0.5, 0.5), sp = rand(60, 150); G.parts.push({ x: e.x + rand(-3, 3), y: e.y - h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, t: rand(0.35, 0.6), c: pick(['#c0202a', '#8a1018', '#e04048']), g: 380, floor: e.y + rand(-2, 6) }); }
    splat(e.x, e.y + 2, n + 4);
  }
  // 연쇄 번개: 꺾이는 번개 줄기 (조금 늦게 다음 대상으로)
  function gxBolt(a, b, delay = 0) { fxPush({ kind: 'gx_bolt', x0: a.x, y0: a.y - enemyH(a) * 0.5, x1: b.x, y1: b.y - enemyH(b) * 0.5, t: 0.32 + delay, max: 0.32 + delay, d0: delay, seed: rand(0, 999) }); }
  // 흡혈·핏빛 엄니: 생명 구슬이 플레이어에게 빨려 들어감
  function gxOrbs(e, kind) { for (let i = 0; i < 4; i++) fxPush({ kind: 'gx_orb', x: e.x + rand(-6, 6), y: e.y - enemyH(e) * 0.5, t: 0.55 + i * 0.07, d0: i * 0.07, sw: rand(-40, 40), o: kind }); }
  // 반격 파동
  function gxNova(x, y) { fxPush({ kind: 'gx_nova', x, y, t: 0.6, R: 92 }); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; G.parts.push({ x: x + Math.cos(a) * 10, y: y - 6 + Math.sin(a) * 6, vx: Math.cos(a) * 160, vy: Math.sin(a) * 90 - 30, t: 0.4, c: pick(['#ffe39a', '#fff6d8', '#ffb040']), g: 0, glow: true }); } sfx('perfect', 0.8); }
  // 처형: 붉은 X 베기
  function gxExec(e) { if ((e.gxExT || 0) > time) return; e.gxExT = time + 0.3; fxPush({ kind: 'gx_exec', x: e.x, y: e.y - enemyH(e) * 0.5, t: 0.28, s: Math.max(14, enemyW(e) * 0.8) }); }
  // 가시: 플레이어 둘레 땅에서 가시가 솟음
  function gxThorns(x, y) {
    const sp = []; for (let ring = 0; ring < 2; ring++) { const n = ring ? 11 : 7; for (let i = 0; i < n; i++) { const a = i / n * TAU + ring * 0.3 + rand(-0.12, 0.12), r = ring ? rand(48, 64) : rand(24, 34); sp.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.6, h: ring ? randi(9, 12) : randi(12, 16), d: ring * 0.06 + rand(0, 0.03), lean: Math.cos(a) * 0.35 }); } }
    fxPush({ kind: 'gx_thorns', x, y, t: 0.6, sp });
    sfx('crunch', 1.4);
  }
  // 전투 집중: 모여드는 빛
  function gxFocus() { const P = G.player; fxPush({ kind: 'gx_focus', x: P.x, y: P.y, t: 0.35 }); sfx('ready', 1.2); }
  // 탐욕: 금화가 쏟아짐
  function gxCoins(x, y) {
    const bits = []; for (let i = 0; i < 13; i++) { const a = rand(0, TAU), sp = rand(30, 100); bits.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(140, 220), land: 0, f: rand(0, 6) }); }
    for (const b of bits) b.land = b.vz / 130;
    fxPush({ kind: 'gx_coins', x, y, t: 1.1, bits }); sfx('coin', 1.1);
  }
  // 선제·회피 후 치명: 별빛 폭발
  function gxCrit(e, first) {
    fxPush({ kind: 'gx_crit', x: e.x, y: e.y - enemyH(e) * 0.5, t: 0.32 });
    if (first) G.nums.push({ x: e.x, y: e.y - enemyH(e) - 10, v: '선제!', t: 0.8, c: '#ffd060', s: 1, txt: true, vy: -50 });
  }
  // 점액왕 4세트: 산성 점액이 터져 사방으로
  function gxAcid(x, y) {
    const bits = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + rand(-0.2, 0.2), sp = rand(70, 130); bits.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rand(80, 150), land: 0, s: randi(2, 3) }); }
    for (const b of bits) b.land = b.vz / 130;
    fxPush({ kind: 'gx_acid', x, y, t: 0.85, bits, R: 84 });
    sfx('blast', 1.6); sfx('eat', 0.7);
  }
  // 기사단 4세트: 하늘에서 망령 대검이 내리꽂힘
  function gxGhostSword(e) { fxPush({ kind: 'gx_gsword', x: e.x, y: e.y + 2, t: 0.75, flip: Math.random() < 0.5 }); }
  const GSWORD = (() => { // 칼끝이 아래로 — 폭 7칸, 길이 26칸
    const rows = ['...www...', '...wWw...', '...www...', '....s....', '.wwwWwww.', 'wwWWWWWww', '.ww.S.ww.', '...sSs...', '...sSs...', '...sSs...', '...sSs...', '..bBWBb..', ...Array(16).fill('..bBWBb..'), '...BWB...', '...BWB...', '...BWB...', '...bWb...', '....W....', '....W....', '....w....'];
    return gCanvas(gOutline(fromRows(rows)), { k: '#101a3a', w: '#a8c0ff', W: '#ffffff', s: '#5a6ab0', S: '#8090d8', b: '#6a88d8', B: '#c8dcff' });
  })();
  // 핏빛 엄니 4세트(분노 상태) 발밑 표식은 drawGearGround

  // 바닥 레이어 (캐릭터·몬스터 아래)
  function drawGearGround() {
    const P = G.player, s = G.stats; if (!s) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // 불길 점멸: 타오르는 바닥
    if (G.pfire) for (const f of G.pfire) {
      const k = Math.min(1, f.t / 0.6), rx = 26, ry = 18, fl = Math.floor(time * 10);
      for (let yy = Math.round(f.y - ry) & ~1; yy <= f.y + ry; yy += 2) for (let xx = Math.round(f.x - rx) & ~1; xx <= f.x + rx; xx += 2) {
        const q = Math.hypot((xx - f.x) / rx, (yy - f.y) / ry); if (q >= 1) continue;
        const h = GX.hr(xx * 0.37 + yy * 1.91 + fl * 0.13), lv = (1 - q) * k;
        if (!dith(xx >> 1, yy >> 1, lv * 0.95)) continue;
        ctx.fillStyle = h > 0.85 ? `rgba(255,220,120,${0.8 * k})` : h > 0.55 ? `rgba(255,120,40,${0.65 * k})` : `rgba(170,40,16,${0.55 * k})`;
        ctx.fillRect(xx, yy, 2, 2);
      }
    }
    // 전투 집중: 발밑 예리한 고리 + 마름모 4개
    if (P.echoT > 0) {
      const k = Math.min(1, P.echoT / 0.4), R = 26, pul = 0.5 + 0.5 * Math.sin(time * 10);
      GX.ring(P.x, P.y + 1, R, '140,230,255', 0.85 * k, 2, 0.45, 5, time * 2.6);
      GX.ring(P.x, P.y + 1, R - 6, '220,250,255', (0.25 + 0.3 * pul) * k, 1, 0.45, 3, -time * 3.4);
      for (let i = 0; i < 4; i++) { const t = i / 4 * TAU + time * 1.3, x = P.x + Math.cos(t) * (R + 4), y = P.y + 1 + Math.sin(t) * (R + 4) * 0.45; ctx.fillStyle = `rgba(200,245,255,${0.9 * k})`; for (const [dx, dy] of [[0, -2], [-2, 0], [2, 0], [0, 2], [0, 0]]) ctx.fillRect((Math.round(x) & ~1) + dx, (Math.round(y) & ~1) + dy, 2, 2); }
    }
    // 선제·치명 준비: 금빛 조준 꺾쇠 4개
    if (P.critNext && !P.dead) {
      const R = 28 + Math.sin(time * 6) * 2, a = 0.7 + 0.3 * Math.sin(time * 9);
      for (let i = 0; i < 4; i++) { const t = i / 4 * TAU + Math.PI / 4 + time * 0.8, x = P.x + Math.cos(t) * R, y = P.y + 1 + Math.sin(t) * R * 0.45, ux = -Math.sign(Math.cos(t)) * 2, uy = -Math.sign(Math.sin(t)) * 2;
        ctx.fillStyle = `rgba(255,214,96,${a})`; for (let m = 0; m < 5; m++) { ctx.fillRect((Math.round(x) & ~1) + ux * m, Math.round(y) & ~1, 2, 2); ctx.fillRect(Math.round(x) & ~1, (Math.round(y) & ~1) + uy * m, 2, 2); } }
    }
    // 핏빛 엄니 4세트 분노 (HP 50% 이하): 붉은 톱니 고리 + 엄니 두 개
    if (s.set4.has('orc') && P.hp < s.hp * 0.5 && !P.dead) {
      const pul = 0.5 + 0.5 * Math.sin(time * 5), R = 24;
      GX.disc(P.x, P.y + 1, R * 0.9, '160,20,10', 0.25 + 0.12 * pul, 0.45, 0.5);
      const n = 28; for (let i = 0; i < n; i++) { const t = i / n * TAU - time * 1.2, rr = R + (i % 2 ? 0 : 3); GX.c(P.x + Math.cos(t) * rr, P.y + 1 + Math.sin(t) * rr * 0.45, `rgba(255,${i % 2 ? 70 : 120},50,${0.8})`); }
      for (const sd of [-1, 1]) { const bx = P.x + sd * (R + 6), by = P.y; ctx.fillStyle = 'rgba(255,230,200,0.85)'; for (let m = 0; m < 4; m++) ctx.fillRect((Math.round(bx + sd * (m < 2 ? 0 : -2 * (m - 1))) & ~1), (Math.round(by - m * 2) & ~1), 2, 2); }
      if (Math.random() < 0.3) { const t = rand(0, TAU); G.parts.push({ x: P.x + Math.cos(t) * R, y: P.y + Math.sin(t) * R * 0.45, vx: 0, vy: -rand(25, 50), t: 0.4, c: pick(['#ff5030', '#ffa060']), g: 0, glow: true }); }
    }
    // 바닥에 깔리는 일회성 효과
    for (const f of G.fx) {
      if (!f.kind || f.kind.slice(0, 3) !== 'gx_') continue;
      const el = gxEl(f), p = 1 - f.t / f.max;
      if (f.kind === 'gx_corpse') { const q = Math.min(1, el / 0.35); if (q < 1) { GX.disc(f.x, f.y, 14 + f.r * 0.6 * easeOut(q), '150,10,10', 0.5 * (1 - q), 0.55, 0.7); GX.ring(f.x, f.y, 10 + f.r * easeOut(q), '220,40,30', 0.85 * (1 - q), 3, 0.55, 0); GX.ring(f.x, f.y, 6 + f.r * 0.7 * easeOut(q), '255,140,60', 0.6 * (1 - q), 1, 0.55, 3); } }
      else if (f.kind === 'gx_ignite') { const q = easeOut(p); GX.ring(f.x, f.y, 8 + 22 * q, '255,140,40', 0.9 * (1 - p), 2, 0.7); GX.disc(f.x, f.y, 10 + 18 * q, '255,200,90', 0.5 * (1 - p), 0.7); }
      else if (f.kind === 'gx_nova') {
        const q = easeOut(Math.min(1, p * 1.3));
        GX.ring(f.x, f.y, 10 + f.R * q, '255,220,120', 0.9 * (1 - p), 3, 0.55);
        if (p > 0.15) GX.ring(f.x, f.y, 6 + f.R * 0.6 * easeOut((p - 0.15) / 0.85), '255,250,220', 0.6 * (1 - p), 1, 0.55, 4);
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.13, r0 = 8 + f.R * q * 0.5, r1 = 8 + f.R * q; ctx.fillStyle = `rgba(255,200,90,${0.7 * (1 - p)})`; for (let r = r0; r < r1; r += 4) ctx.fillRect(Math.round(f.x + Math.cos(a) * r) & ~1, Math.round(f.y + Math.sin(a) * r * 0.55) & ~1, 2, 2); }
        if (p < 0.25) GX.disc(f.x, f.y, 16, '255,250,220', 0.8 * (1 - p * 4), 0.6);
      }
      else if (f.kind === 'gx_focus') { const r = 44 * (1 - easeOut(p)) + 6, P0 = G.player; GX.ring(P0.x, P0.y + 1, r, '160,240,255', 0.9 * (1 - p * 0.6), 1, 0.45, 2, p * 3); }
      else if (f.kind === 'gx_acid') {
        const q = Math.min(1, el / 0.3); if (q < 1) { GX.ring(f.x, f.y, 10 + f.R * easeOut(q), '150,230,70', 0.85 * (1 - q), 2, 0.55, 0); GX.disc(f.x, f.y, 10 + 30 * q, '120,210,50', 0.45 * (1 - q), 0.55); }
        // 떨어진 점액 웅덩이 (작게, 금방 마름)
        for (const b of f.bits) { const B = GX.bit(b, el); if (!B.landed) continue; const fade = Math.max(0, f.t / 0.4); ctx.fillStyle = `rgba(120,210,50,${0.6 * Math.min(1, fade)})`; for (let i = -b.s; i <= b.s; i++) ctx.fillRect((Math.round(B.x) & ~1) + i * 2, Math.round(B.y) & ~1, 2, 2); }
      }
      else if (f.kind === 'gx_gsword') {
        const hitT = 0.16; if (el >= hitT) { const q = Math.min(1, (el - hitT) / 0.4), a = 1 - q;
          GX.ring(f.x, f.y, 8 + 46 * easeOut(q), '150,180,255', 0.85 * a, 2, 0.5);
          GX.disc(f.x, f.y, 26, '110,140,230', 0.35 * a, 0.5, 0.7);
          // 바닥 왕관 문장 (기사단)
          const cr = ['y...yy...y', 'yy.yyyy.yy', 'yyyyyyyyyy', 'yyyyyyyyyy']; ctx.fillStyle = `rgba(190,210,255,${0.8 * a})`;
          for (let j = 0; j < cr.length; j++) for (let i = 0; i < 10; i++) if (cr[j][i] === 'y') ctx.fillRect((Math.round(f.x) & ~1) - 10 + i * 2, (Math.round(f.y) & ~1) - 2 + j * 2 - 4, 2, 2); }
      }
    }
    ctx.restore();
  }
  // 서 있는 효과: 깊이 정렬에 넣는다
  function gearEnts(ents) {
    if (G.pfire) for (const f of G.pfire) for (let i = 0; i < 9; i++) { const ox = (GX.hr(f.x * 0.1 + i * 7.3) - 0.5) * 40, oy = (GX.hr(f.y * 0.1 + i * 3.1) - 0.5) * 26; if (Math.hypot(ox / 26, oy / 18) > 0.9) continue; ents.push({ y: f.y + oy, d: () => gxFlame(f.x + ox, f.y + oy, Math.min(1, f.t / 0.6), i) }); }
    for (const f of G.fx) if (f.kind === 'gx_thorns') for (const s of f.sp) ents.push({ y: s.y, d: () => gxSpike(f, s) });
    for (const f of G.fx) if (f.kind === 'gx_gsword') ents.push({ y: f.y + 1, d: () => gxSword(f) });
  }
  function gxFlame(x, y, k, i) {
    const fr = Math.floor(time * 12 + i * 3) % 4, h = Math.round((4 + (i % 3) + [0, 1, 2, 1][fr]) * k);
    if (h < 1) return;
    const cells = [], gx = Math.round(x) & ~1, gy = Math.round(y) & ~1;
    for (let j = 0; j < h; j++) { const t = j / h, w = t < 0.35 ? 1 : 0, sway = Math.round(Math.sin(time * 9 + i + j * 0.8) * (t > 0.5 ? 1 : 0)) * 2;
      for (let m = -w; m <= w; m++) cells.push([gx + m * 2 + sway, gy - j * 2, t > 0.7 ? '#fff0b0' : t > 0.4 ? '#ffd060' : m === 0 ? '#ff8a2a' : '#e04a1a']); }
    ctx.save(); GX.shape(cells, '#5a1008', 0.95); ctx.restore();
  }
  function gxSpike(f, s) {
    const el = gxEl(f) - s.d; if (el < 0) return;
    const up = el < 0.07 ? el / 0.07 : el < 0.32 ? 1 : Math.max(0, 1 - (el - 0.32) / 0.2), h = Math.round(s.h * up); if (h < 1) return;
    const cells = [], bx = Math.round(s.x) & ~1, by = (Math.round(s.y) & ~1) + (s.h - h) * 2; // 끝부터 솟고 끝을 남기며 가라앉는다
    for (let j = s.h - h; j < s.h; j++) { const t = j / s.h, w = t < 0.25 ? 2 : t < 0.6 ? 1 : 0, lx = Math.round(s.lean * j * 0.5) * 2;
      for (let m = -w; m <= w; m++) cells.push([bx + m * 2 + lx, by - j * 2, j === s.h - 1 ? '#f0ead0' : m < 0 ? '#a89a78' : m > 0 ? '#5a4e3a' : '#cfc4a0']); if (j === Math.round(s.h * 0.45)) cells.push([bx + lx + (s.lean > 0 ? 4 : -4), by - j * 2 - 2, '#cfc4a0']); }
    ctx.save(); GX.shape(cells); ctx.restore();
    if (el < 0.1) { ctx.fillStyle = 'rgba(90,70,50,0.7)'; ctx.fillRect(bx - 4, by + 2, 2, 2); ctx.fillRect(bx + 4, by + 2, 2, 2); }
  }
  function gxSword(f) {
    const el = gxEl(f), hitT = 0.16, W = GSWORD.width, H = GSWORD.height;
    let y, a; if (el < hitT) { y = f.y - 14 - (1 - el / hitT) * 130; a = 0.5 + 0.5 * el / hitT; } else { const q = (el - hitT) / (f.max - hitT); y = f.y - 14 + Math.min(1, (el - hitT) / 0.05) * 6 - Math.max(0, q - 0.5) * 30; a = q < 0.5 ? 1 : 1 - (q - 0.5) * 2; }
    const x = (Math.round(f.x - W / 2) & ~1), yy = Math.round(y - H + 10) & ~1;
    ctx.save(); ctx.globalAlpha = Math.max(0, a) * 0.92; if (f.flip) { ctx.translate(x + W, 0); ctx.scale(-1, 1); ctx.drawImage(GSWORD, 0, yy); } else ctx.drawImage(GSWORD, x, yy);
    ctx.restore();
    if (el < hitT) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(150,180,255,0.35)'; for (let k = 1; k < 5; k++) ctx.fillRect(Math.round(f.x) & ~1, yy - k * 8, 2, 4); ctx.restore(); }
    if (el > hitT && Math.random() < 0.5) G.parts.push({ x: f.x + rand(-10, 10), y: f.y - rand(0, 30), vx: rand(-8, 8), vy: -rand(30, 60), t: 0.5, c: pick(['#a8c0ff', '#e0ecff']), g: 0, glow: true });
  }
  // 위 레이어 (drawFx 에서 호출)
  function drawGearFx(f) {
    const el = gxEl(f), p = 1 - f.t / f.max;
    if (f.kind === 'gx_corpse') {
      if (el < 0.1) { ctx.globalCompositeOperation = 'lighter'; GX.disc(f.x, f.y - 8, 10 + el * 120, '255,220,170', 0.9 * (1 - el / 0.1)); ctx.globalCompositeOperation = 'source-over'; }
      const fade = Math.min(1, f.t / 0.25), cells = [];
      for (const b of f.bits) { const B = GX.bit(b, el), y = B.y - B.z;
        if (b.bone) { cells.push([B.x - 2, y, '#c8bea8'], [B.x, y, '#e8e0cc'], [B.x + 2, y, '#e8e0cc'], [B.x + 4, y + (B.landed ? 0 : -2), '#c8bea8']); } else { cells.push([B.x, y, b.c], [B.x + 2, y, b.c], [B.x, y - 2, '#c0303a'], [B.x + 2, y - 2, b.c]); } }
      GX.shape(cells, '#0b0a0e', fade);
    } else if (f.kind === 'gx_wave') {
      const q = easeOut(p), d = 18 + 175 * q, R = 44, span = 1.7, ux = Math.cos(f.ang), uy = Math.sin(f.ang) * 0.8;
      for (let g2 = 2; g2 >= 0; g2--) { // 잔상 2개 + 본체
        const dd = d - g2 * 14, cx = f.x + ux * (dd - R), cy = f.y + uy * (dd - R), a = g2 ? 0.35 / g2 : 1, cells = [];
        if (dd < 10) continue;
        for (let i = -20; i <= 20; i++) { const s = i / 20, ang = f.ang + s * span * 0.5, th = Math.round(5 * (1 - s * s)); for (let k = 0; k <= th; k++) { const rr = R - k * 2; cells.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.8, k <= 1 ? '#ffffff' : k <= 3 ? `rgb(${f.c})` : f.c2]); } }
        ctx.save(); if (g2) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * (1 - p); for (const c of cells) { ctx.fillStyle = c[2]; ctx.fillRect(Math.round(c[0]) & ~1, Math.round(c[1]) & ~1, 2, 2); } } else GX.shape(cells, '#141c34', p > 0.75 ? (1 - p) * 4 : 1); ctx.restore();
      }
      if (Math.random() < 0.6) G.parts.push({ x: f.x + ux * d + rand(-10, 10), y: f.y + uy * d + rand(-10, 10), vx: ux * 40, vy: uy * 40, t: 0.25, c: f.c2, g: 0, glow: true });
    } else if (f.kind === 'gx_bolt') {
      if (el < f.d0) return; const q = (el - f.d0) / (f.max - f.d0), flick = Math.floor(time * 24);
      if (q > 0.55 && flick % 2) return; // 끝날 때 깜빡임
      let rs = f.seed + flick * 13.1; const rnd = () => GX.hr(rs += 1.7);
      const L = Math.hypot(f.x1 - f.x0, f.y1 - f.y0), n = Math.max(3, Math.round(L / 12)), nx = -(f.y1 - f.y0) / (L || 1), ny = (f.x1 - f.x0) / (L || 1), pts = [];
      for (let i = 0; i <= n; i++) { const t = i / n, off = i === 0 || i === n ? 0 : (rnd() - 0.5) * 18; pts.push([f.x0 + (f.x1 - f.x0) * t + nx * off, f.y0 + (f.y1 - f.y0) * t + ny * off]); }
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(70,120,255,0.45)';
      for (let i = 0; i < n; i++) { const [a0, b0] = pts[i], [a1, b1] = pts[i + 1], m = Math.ceil(Math.hypot(a1 - a0, b1 - b0) / 2); for (let k = 0; k <= m; k++) ctx.fillRect((Math.round(a0 + (a1 - a0) * k / m) & ~1) - 2, (Math.round(b0 + (b1 - b0) * k / m) & ~1) - 2, 6, 6); }
      ctx.restore();
      const cells = []; for (let i = 0; i < n; i++) { const [a0, b0] = pts[i], [a1, b1] = pts[i + 1], m = Math.ceil(Math.hypot(a1 - a0, b1 - b0) / 2); for (let k = 0; k <= m; k++) cells.push([a0 + (a1 - a0) * k / m, b0 + (b1 - b0) * k / m, q < 0.4 ? '#ffffff' : '#bfe0ff']); }
      // 곁가지 2개
      for (let j = 0; j < 2; j++) { const i = 1 + Math.floor(rnd() * (n - 1)), [a0, b0] = pts[i], ang = Math.atan2(f.y1 - f.y0, f.x1 - f.x0) + (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.6); let x = a0, y = b0; for (let k = 0; k < 5; k++) { x += Math.cos(ang) * 2 + (rnd() - 0.5) * 2; y += Math.sin(ang) * 2 + (rnd() - 0.5) * 2; cells.push([x, y, '#8fc8ff']); } }
      GX.shape(cells, '#1a2a6a');
      for (const [x, y, r] of [[f.x0, f.y0, 4], [f.x1, f.y1, 6]]) { const s = q < 0.3 ? r + 2 : r; const st = []; for (let k = -s; k <= s; k += 2) { st.push([x + k, y, '#e0f0ff']); st.push([x, y + k, '#e0f0ff']); } st.push([x, y, '#ffffff']); GX.shape(st, '#1a2a6a', 1 - q * 0.5); }
    } else if (f.kind === 'gx_orb') {
      if (el < f.d0) return; const P = G.player, q = Math.min(1, (el - f.d0) / (f.max - f.d0 - 0.05)), e2 = q * q;
      const tx = P.x, ty = P.y - 14, mx = (f.x + tx) / 2 + f.sw, my = Math.min(f.y, ty) - 40, x = (1 - e2) * (1 - e2) * f.x + 2 * (1 - e2) * e2 * mx + e2 * e2 * tx, y = (1 - e2) * (1 - e2) * f.y + 2 * (1 - e2) * e2 * my + e2 * e2 * ty;
      const [c1, c2, c3] = f.o === 'orc' ? ['#ffb080', '#ff6a30', '#7a2010'] : ['#ff8a90', '#d01828', '#4a0810'];
      if (q < 1) { const cells = [[x, y - 2, c2], [x - 2, y, c2], [x, y, c1], [x + 2, y, c2], [x - 2, y + 2, c2], [x, y + 2, c2], [x + 2, y + 2, c3 === '#7a2010' ? '#c04020' : '#901018'], [x, y + 4, c2], [x - 2, y - 2, c1]]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = c2; ctx.globalAlpha = 0.5; for (let k = 1; k < 4; k++) { const e3 = Math.max(0, e2 - k * 0.05); ctx.fillRect(Math.round((1 - e3) * (1 - e3) * f.x + 2 * (1 - e3) * e3 * mx + e3 * e3 * tx) & ~1, Math.round((1 - e3) * (1 - e3) * f.y + 2 * (1 - e3) * e3 * my + e3 * e3 * ty) & ~1, 2, 2); } ctx.restore(); GX.shape(cells, c3); }
      else if (!f.popped) { f.popped = true; for (let i = 0; i < 6; i++) { const a = rand(0, TAU); G.parts.push({ x: P.x + Math.cos(a) * 8, y: P.y - 14 + Math.sin(a) * 6, vx: Math.cos(a) * 30, vy: -rand(30, 60), t: 0.4, c: c1, g: 0, glow: true }); } }
    } else if (f.kind === 'gx_exec') {
      const s = f.s * (0.6 + 0.4 * easeOut(Math.min(1, p * 3))), cells = [], a = p > 0.6 ? (1 - p) / 0.4 : 1;
      for (let k = -s; k <= s; k += 2) { const w = Math.abs(k) < s * 0.6 ? '#ffffff' : '#ff4040'; cells.push([f.x + k, f.y + k * 0.8, w]); if (p > 0.1) cells.push([f.x + k, f.y - k * 0.8, w]); }
      GX.shape(cells, '#3a0006', a);
    } else if (f.kind === 'gx_coins') {
      const fade = Math.min(1, f.t / 0.3), cells = [];
      for (const b of f.bits) { const B = GX.bit(b, el), y = B.y - B.z, fr = Math.floor(el * 14 + b.f) % 4, w = B.landed ? 1 : [1, 1, 0, 1][fr];
        if (w) cells.push([B.x - 2, y - 2, '#ffd860'], [B.x, y - 2, '#fff0a0'], [B.x + 2, y - 2, '#e8b830'], [B.x - 2, y, '#e8b830'], [B.x, y, '#c8901c'], [B.x + 2, y, '#e8b830'], [B.x - 2, y + 2, '#c8901c'], [B.x, y + 2, '#a87a18'], [B.x + 2, y + 2, '#a87a18'], [B.x, y - 4, '#ffd860'], [B.x, y + 4, '#8a6010'], [B.x - 4, y, '#e8b830'], [B.x + 4, y, '#a87a18']); else cells.push([B.x, y - 4, '#ffe080'], [B.x, y - 2, '#ffd860'], [B.x, y, '#c89a28'], [B.x, y + 2, '#a87a18'], [B.x, y + 4, '#8a6010']); }
      GX.shape(cells, '#2a1a04', fade);
      if (el < 0.12) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; GX.disc(f.x, f.y - 6, 14, '255,220,120', 0.7 * (1 - el / 0.12)); ctx.restore(); }
    } else if (f.kind === 'gx_crit') {
      const q = easeOut(p), r = 8 + 22 * q, cells = [];
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, L = i % 2 ? r * 0.55 : r; for (let k = 4; k < L; k += 2) cells.push([f.x + Math.cos(a) * k, f.y + Math.sin(a) * k, k < L * 0.5 ? '#ffffff' : '#ffd060']); }
      cells.push([f.x, f.y, '#ffffff']); GX.shape(cells, '#3a2400', 1 - p);
    } else if (f.kind === 'gx_acid') {
      if (el < 0.1) { ctx.globalCompositeOperation = 'lighter'; GX.disc(f.x, f.y - 10, 8 + el * 160, '200,255,140', 0.8 * (1 - el / 0.1)); ctx.globalCompositeOperation = 'source-over'; }
      const cells = []; for (const b of f.bits) { const B = GX.bit(b, el); if (B.landed) continue; const y = B.y - B.z - 8; for (let i = -1; i <= 1; i++) cells.push([B.x + i * 2, y - 2, i < 0 ? '#e8ffc0' : '#b8f080']); for (let i = -b.s + 1; i <= b.s - 1; i++) cells.push([B.x + i * 2, y, i < 0 ? '#b8f080' : '#7ac843']); for (let i = -1; i <= 1; i++) cells.push([B.x + i * 2, y + 2, '#4a9028']); }
      GX.shape(cells, '#1a3a0a');
      if (el < 0.5 && Math.random() < 0.5) { const a = rand(0, TAU); G.parts.push({ x: f.x + Math.cos(a) * rand(4, 30), y: f.y + Math.sin(a) * rand(2, 14), vx: 0, vy: -rand(20, 40), t: 0.4, c: pick(['#b8f080', '#e8ffc0']), g: 0, glow: true }); }
    }
  }
  // 머리 위 표식: 출혈 중 핏방울, 처형 가능(HP 30% 이하) 해골
  const BLOOD_ICON = gCanvas(gOutline(fromRows(['..r..', '.rrr.', 'rrRrr', 'rRwRr', 'rrRrr', '.rrr.'])), { r: '#c0202a', R: '#7a1018', w: '#ff9aa0', k: '#0b0a0e' });
  const SKULL_ICON = gCanvas(gOutline(fromRows(['.www.', 'wwwww', 'wrwrw', 'wwwww', '.wkw.'])), { w: '#e8e0cc', r: '#ff3030', k: '#0b0a0e' });
  function drawGearTop() {
    const s = G.stats; if (!s) return; const ex = s.efx.has('exec');
    for (const e of G.enemies) { if (e.dead || e.type === 'flag' || e.rise > 0) continue;
      const top = Math.round(e.y - enemyH(e) - 14) & ~1; let x = Math.round(e.x) & ~1;
      const icons = []; if (e.bleedT > 0) icons.push(BLOOD_ICON); if (ex && e.hp < e.maxHp * 0.3 && e.type !== 'boss') icons.push(SKULL_ICON);
      if (!icons.length) continue; x -= (icons.length * 16 - 2) / 2;
      icons.forEach((ic, i) => { const bob = Math.round(Math.sin(time * 6 + i) * 1) * 2; ctx.globalAlpha = ic === SKULL_ICON ? 0.75 + 0.25 * Math.sin(time * 10) : 1; ctx.drawImage(ic, (x + i * 16) & ~1, top + bob); });
      ctx.globalAlpha = 1;
    }
  }
  function gearLights(lights) {
    const P = G.player, s = G.stats;
    if (G.pfire) for (const f of G.pfire) lights.push({ x: f.x, y: f.y - 8, r: 70, a: 0.7 * Math.min(1, f.t / 0.6), c: '255,130,40', ca: 0.2 * Math.min(1, f.t / 0.6) });
    if (P && P.echoT > 0) lights.push({ x: P.x, y: P.y, r: 46, a: 0.4, c: '140,230,255', ca: 0.1 });
    if (P && s && s.set4.has('orc') && P.hp < s.hp * 0.5) lights.push({ x: P.x, y: P.y, r: 50, a: 0.4, c: '255,60,30', ca: 0.12 });
    for (const f of G.fx) {
      if (!f.kind || f.kind.slice(0, 3) !== 'gx_') continue; const p = 1 - f.t / f.max, a = 1 - p;
      const L = { gx_corpse: [90, '255,90,50'], gx_ignite: [70, '255,140,40'], gx_wave: [60, f.c], gx_nova: [120, '255,220,120'], gx_acid: [100, '150,240,70'], gx_gsword: [110, '150,180,255'], gx_coins: [50, '255,210,90'], gx_crit: [50, '255,220,120'], gx_exec: [40, '255,60,60'], gx_thorns: [60, '220,210,170'] }[f.kind];
      if (L) { let x = f.x, y = f.y; if (f.kind === 'gx_wave') { const d = 18 + 175 * easeOut(p); x += Math.cos(f.ang) * d; y += Math.sin(f.ang) * 0.8 * d; } lights.push({ x, y, r: L[0], a: 0.7 * a, c: L[1], ca: 0.22 * a }); }
      if (f.kind === 'gx_bolt' && gxEl(f) >= f.d0) { lights.push({ x: f.x1, y: f.y1, r: 70, a: 0.8 * a, c: '140,190,255', ca: 0.3 * a }); lights.push({ x: (f.x0 + f.x1) / 2, y: (f.y0 + f.y1) / 2, r: 60, a: 0.5 * a, c: '140,190,255', ca: 0.15 * a }); }
    }
  }
  // ================================================================ v1.02 대장간 방: 스테이지 사이에 걸어 다니는 고정 대장간
  // 곰 수인 대장장이 · 모루(강화) · 숫돌(재련) · 용광로(분해) · 장식 · 붉은 출구(다음 스테이지)
  const FORGE_STAGE = { n: '곰 대장장이의 대장간', sub: '바위 굴 속 대장간', dark: 0.6, ash: '255,150,70', torches: true };
  const inForge = () => !!(G && G.dun && G.dun.forge);
  const FG = (() => { // 도트 도구
    const mk = (w, h) => mkGrid(w, h);
    const put = (g, x, y, c) => { if (c == null) return; x = Math.round(x); y = Math.round(y); if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; };
    const ell = (g, cx, cy, rx, ry, f) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (q <= 1) put(g, x, y, typeof f === 'function' ? f(x - cx, y - cy, q) : f); } };
    const rect = (g, x0, y0, x1, y1, f) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(g, x, y, typeof f === 'function' ? f(x, y) : f); };
    const line = (g, x0, y0, x1, y1, c, w = 0) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 || 1; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let a = -w; a <= w; a++) for (let b = -w; b <= w; b++) put(g, x + a, y + b, c); } };
    return { mk, put, ell, rect, line };
  })();
  // v1.02 손으로 찍은 대장간 도트 (2px 칸·4단계 명암·왼쪽 위 광원). 곰 대장장이는 캐릭터와 같은 비율
  const FPAL = {'k': '#0b0a0e', '1': '#8a8494', '2': '#625c72', '3': '#45404f', '4': '#2c2834', 'i': '#d8dce4', 'I': '#a4aab4', 'j': '#6e747e', 'J': '#43474f', 'o': '#b07c44', 'O': '#83592f', 'p': '#5c3c20', 'P': '#3c2614', 'y': '#fff3c0', 'Y': '#ffd060', 'r': '#ff8a2a', 'R': '#d0401a', 'e': '#7a1a10', 'c': '#2e282c', 'C': '#18141a', 'u': '#7ab4da', 'U': '#3e6e94', 'g': '#f0c860', 'G': '#a07828', 'l': '#9a6440', 'L': '#64402a', 'b': '#8c5a32', 'B': '#5e3a1e', 'h': '#b88050', 'f': '#e6c494', 'F': '#b8946a', 'n': '#140e0c', 'w': '#ffffff', 'a': '#5a3e2a', 'A': '#3a281c', 't': '#3c3646', 'T': '#26212e'};
  const FMAP = {
    BEAR_A: ['..kk...kk.kkkkk', '.khBk.khBkkiIJk', '.khhhhbbbbkIJJk', 'khhhbbbbbbBkOkk', 'khbbbbbnbbBkOk.', 'kbbbbbbfffnkOk.', 'kBbbbbbFnFkkOk.', '.kBBbbbbbbkkOk.', 'kbkAaaaaAbbhhk.', 'kBkaaaaaaBbk...', 'khkAAgAAABk....', '.kkaaaaaaBk....', '..kaaaAaaBk....', '..ktTkktTk.....', '..ktTk.ktTk....', '.kPPPk.kPPPk...'],
    BEAR_B: ['..kk...kk......', '.khBk.khBk.....', '.khhhhbbbbk....', 'khhhbbbbbbBk...', 'khbbbbbnbbBk...', 'kbbbbbbfffnk...', 'kBbbbbbFnFk....', '.kBBbbbbbbk....', 'kbkAaaaaAbbbk..', 'kBkaaaaaaBkbhhk', 'khkAAgAAABkiIJk', '.kkaaaaaaBkIJJk', '..kaaaAaaBkkkkk', '..ktTkktTk.....', '..ktTk.ktTk....', '.kPPPk.kPPPk...'],
    ANVIL: ['....kkkkkkkkkkkk..', '.kkkiiiiiiiiiiiIk.', 'kiIIjjjjjjjjjjjJJk', '.kkJjjjjjjjjjJJk..', '....kkJjjjjjJJkk..', '.....kJjjjjjJk....', '....kJjjjjjjJJk...', '...kJJJJJJJJJJJk..', '..koooooooOOOppk..', '..kOOoOOOOpOppPk..', '..kOpOOOpOOpOpPk..', '..kPOpOOpOpOppPk..', '..kkkkkkkkkkkkkk..'],
    WHEEL: ['...kkkkk...', '.kk11122kk.', '.k1122223k.', 'k112222233k', 'k122222233k', 'k1222J2233k', 'k122222334k', 'k222222334k', '.k2223334k.', '.kk33344kk.', '...kkkkk...'],
    GFRAME: ['..kk.............kk..', '.kOpk...........kOpk.', '.kOpk...........kOpk.', '.kOpk...........kOpk.', '.kOpk...........kOpkk', '.kjjjjjjjjjjjjjjjjjJk', '.kOpk...........kOpkO', '.kOpk...........kOpkk', '.kOpk...........kOpk.', '.kOpk...........kOpk.', 'kOOpkkkkkkkkkkkkOppk.', '.kOkouuuuuuuuuUpkOk..', '.kOkOUUUUUUUUUUpkOk..', '.kOkpppppppppppPkOk..', '.kkkkkkkkkkkkkkkkkk..'],
    BARREL: ['..kkkkkk..', '.kuuuuuUk.', 'kJUUUUUUJk', 'kjjjjjjjJk', 'kooOOOOOpk', 'koOOOOOOpk', 'kjjjjjjjJk', 'koOOOOOOpk', 'koOOOOOppk', 'kjjjjjjjJk', '.kOOOOOpk.', '..kkkkkk..'],
    CRATE: ['kkkkkkkkkkk', 'kooooooooOk', 'koOOOOOOoPk', 'koOOOOOopPk', 'koOOOOopOPk', 'koOOOopOOPk', 'koOOopOOOPk', 'koOopOOOOPk', 'kOPPPPPPPPk', 'kkkkkkkkkkk'],
    COAL: ['......kkkk........', '....kkcJcCkk......', '..kkcCccRcCckk....', '.kcCcJCcccrCcckk..', 'kcCcRcccCcJccCcck.', 'kCcccCccccCcRcCcCk', 'kCCcCCCcCCCcCCCcCk', '.kkkkkkkkkkkkkkkk.'],
    ORE: ['.....kkkk.......', '...kk1223kk.kk..', '..k12L223Lkk12k.', '.k122223L33k2L3k', 'k12L2233L2k2L33k', 'k22233L333k23L3k', 'k333344334k3344k', '.kkkkkkkkkkkkkk.'],
    ARMOR: ['...kkkkk....', '..kiIIIjk...', '.kiIIjjjJk..', '.kIkkkkkJk..', '.kIjjkjjJk..', '..kjjjjJk...', '...kkOkk....', '.kkkiIIjkkk.', 'kiIkIIjjkjJk', 'kIJkIIjjkJJk', '.kkkIjjjkkk.', '...kIjjJk...', '...kjjjJk...', '...kjJjJk...', '...kkkkkk...', '.....kOk....', '.....kOk....', '.....kOk....', '.....kOk....', '...kkkOkkk..', '..kooOOOpPk.', '..kkkkkkkkk.'],
    BELLOWS: ['......kkkkkkkk..', '....kkooooooopk.', 'kkkkllLlLlLlLlPk', 'kJJklLlLlLlLlLkk', 'kkkklLlLlLlLlLPk', '....kkpppppppPk.', '......kkkkkkkk..'],
  };
  const FORGE_PAL = { b: '#8a3a26', B: '#5a2216', k: '#0b0a0e', s: '#9aa0a8', S: '#5e626a', D: '#3a3e44', w: '#d8dce4', o: '#6b4a2a', O: '#4a3020', q: '#8a6a40', h: '#6a6470', l: '#4a4652', d: '#34303a', x: '#221e26', r: '#ff8a3a', R: '#c03a1a', y: '#ffd060', Y: '#fff0b0', c: '#1a1618', C: '#2e2a2e', W: '#3a6a8a', V: '#6aa0c0', L: '#7a5232', g: '#8d9097', G: '#c0c4ca' };
  function genWheel(ph) { // 숫돌 바퀴: 밝은 흠집 하나가 돌며 회전을 보여 줌
    const g = fromRows(FMAP.WHEEL), [x, y] = [[5, 2], [8, 5], [5, 8], [2, 5]][ph & 3]; g[y][x] = 'i'; g[y + (ph & 1 ? 1 : 0)][x + (ph & 1 ? 0 : 1)] = 'I'; return g;
  }
  // 용광로: 돌 벽돌 화덕 + 굴뚝 + 불 아가리 (불은 따로)
  function genFurnace() { // v1.03: 벽돌마다 명암, 불벽돌 아치, 쇠띠, 재 더미, 그을린 굴뚝
    const W = 46, H = 60, g = FG.mk(W, H), cx = 22.5;
    const brick = (x, y, x0, w) => { const row = Math.floor(y / 3), off = (row % 2) * 3, col = Math.floor((x - x0 + off) / 6), bx = (x - x0 + off) % 6, by = y % 3, hsh = ((row * 7 + col * 13) % 5); // 줄눈 x, 벽돌 윗줄 밝게, 오른쪽 끝 어둡게
      if (by === 2 || bx === 5) return 'x'; if (bx === 4) return 'd'; return by === 0 ? (hsh < 2 ? 'h' : 'l') : (hsh < 2 ? 'l' : 'd'); };
    // 굴뚝
    FG.rect(g, 17, 3, 28, 18, (x, y) => x === 17 ? 'x' : x === 28 ? 'x' : brick(x, y, 17)); FG.rect(g, 15, 0, 30, 1, (x, y) => y === 0 ? 'h' : 'l'); FG.rect(g, 15, 2, 30, 2, 'D');
    for (let y = 3; y < 9; y++) for (let x = 18; x < 28; x++) if (dith(x, y, (9 - y) / 9)) g[y][x] = 'x'; // 그을음
    // 둥근 화덕
    FG.ell(g, cx, 34, 21, 17, (dx, dy) => { const x = Math.round(cx + dx), y = Math.round(34 + dy), c = brick(x, y, 0); return dx > 12 || dy > 9 ? (c === 'h' ? 'l' : c === 'l' ? 'd' : c) : dx < -12 && c === 'd' ? 'l' : c; });
    // 쇠띠
    FG.rect(g, 2, 41, 43, 42, (x, y) => y === 41 ? 'S' : 'D'); for (const x of [6, 16, 29, 39]) FG.put(g, x, 41, 'w');
    // 받침
    FG.rect(g, 1, 43, 44, 59, (x, y) => { const c = brick(x, y, 1); return x > 37 ? (c === 'h' ? 'l' : c === 'l' ? 'd' : c) : c; });
    // 불벽돌 아치 + 아가리
    FG.ell(g, cx, 47, 12, 10, (dx, dy, q) => dy > 2 ? null : q > 0.62 ? ((Math.round(Math.atan2(dy, dx) * 4) % 2) ? 'b' : 'B') : null);
    FG.ell(g, cx, 47, 9, 7.5, 'c'); FG.rect(g, 14, 47, 31, 55, 'c'); FG.rect(g, 13, 48, 13, 55, 'B'); FG.rect(g, 32, 48, 32, 55, 'B');
    FG.rect(g, 12, 56, 33, 56, 'S'); FG.rect(g, 12, 57, 33, 57, 'D');
    // 재 더미 (아가리 앞)
    for (const [x, y] of [[16, 58], [17, 58], [18, 58], [19, 59], [20, 58], [24, 59], [25, 58], [26, 58], [28, 59]]) FG.put(g, x, y, (x + y) % 2 ? 'g' : 'G');
    for (const [x, y] of [[8, 28], [9, 29], [36, 32], [35, 33], [14, 22], [31, 20], [5, 49], [40, 51]]) FG.put(g, x, y, 'R'); // 달아오른 틈
    return gOutline(g);
  }
  // 장식: 무기 걸이 · 담금질 통 · 석탄 더미 · 풀무 · 상자
  const FORGE_DECO = {
    rack: () => { // v1.03 벽걸이 무기대: 기둥·가로대(밝은 윗면), 장검·전투 도끼·둥근 방패
      const g = FG.mk(24, 24), wood = (x, y, w) => (x === 0 ? 'o' : x === w - 1 ? 'p' : 'O');
      for (const x0 of [1, 20]) FG.rect(g, x0, 0, x0 + 2, 23, (x) => wood(x - x0, 0, 3)); FG.rect(g, 0, 3, 23, 4, (x, y) => y === 3 ? 'q' : 'O'); FG.rect(g, 0, 5, 23, 5, 'O'); FG.rect(g, 0, 17, 23, 18, (x, y) => y === 17 ? 'q' : 'O');
      for (const x of [7, 13, 18]) FG.put(g, x, 5, 'S'); // 걸이못
      // 장검 (끝이 아래)
      FG.rect(g, 6, 6, 7, 6, 'g'); FG.rect(g, 6, 7, 7, 8, 'L'); FG.rect(g, 4, 9, 9, 9, (x) => x === 4 ? 'G' : x === 9 ? 'S' : 'g'); FG.rect(g, 6, 10, 7, 19, (x) => x === 6 ? 'w' : 's'); FG.put(g, 6, 20, 'w'); FG.put(g, 7, 20, 's'); FG.put(g, 6, 21, 's');
      // 전투 도끼
      FG.rect(g, 13, 6, 13, 21, (x, y) => y % 4 === 0 ? 'O' : 'L'); FG.ell(g, 15.5, 9, 2.6, 3.4, (dx, dy) => dx < -1.5 ? 'S' : dy < -1 ? 'w' : dx > 1 ? 'S' : 's'); FG.rect(g, 11, 8, 12, 9, 'S');
      // 둥근 방패 (가죽 + 쇠테 + 가운데 돌기)
      FG.ell(g, 18.5, 12, 3.6, 4.2, (dx, dy, q) => q > 0.62 ? 'S' : dx + dy < -1 ? 'q' : dx + dy > 1.5 ? 'p' : 'O'); FG.put(g, 18, 12, 'w'); FG.put(g, 19, 12, 'g');
      return gOutline(g); },
    tools: () => { // v1.03 공구판: 판자결 · 쇠못 · 집게 · 망치 · 줄 · 정
      const g = FG.mk(28, 16);
      FG.rect(g, 0, 0, 27, 15, (x, y) => x === 0 || y === 0 ? 'q' : x === 27 || y === 15 ? 'P' : y % 5 === 0 ? 'p' : ((x * 3 + y) % 11 === 0 ? 'p' : 'O'));
      for (const x of [4, 11, 17, 22]) FG.put(g, x, 2, 'w');
      FG.line(g, 4, 3, 3, 9, 'S'); FG.line(g, 5, 3, 6, 9, 'S'); FG.rect(g, 2, 10, 3, 12, 'D'); FG.rect(g, 6, 10, 7, 12, 'D'); FG.put(g, 4, 4, 'g'); // 집게
      FG.rect(g, 11, 3, 11, 12, (x, y) => y % 3 ? 'L' : 'O'); FG.rect(g, 9, 11, 13, 13, (x, y) => y === 11 ? 'w' : x === 13 ? 'S' : 's'); // 망치
      FG.rect(g, 17, 3, 17, 13, (x, y) => y > 9 ? 'L' : y % 2 ? 'g' : 'G'); // 줄
      FG.rect(g, 22, 3, 23, 4, 'L'); FG.rect(g, 22, 5, 23, 11, (x) => x === 22 ? 'g' : 'S'); FG.put(g, 22, 12, 'w'); // 정
      return gOutline(g); },
    barrel: () => fromRows(FMAP.BARREL),
    barrelOld: () => { const g = FG.mk(14, 16); FG.ell(g, 7, 9, 6, 7, (dx) => dx < -3 ? 'q' : dx > 3 ? 'O' : 'o'); FG.rect(g, 1, 4, 13, 4, 'D'); FG.rect(g, 1, 12, 13, 12, 'D'); FG.ell(g, 7, 3, 6, 1.6, (dx) => dx < 0 ? 'V' : 'W'); return gOutline(g); },
    coal: () => fromRows(FMAP.COAL),
    coalOld: () => { const g = FG.mk(22, 10); FG.ell(g, 11, 9, 10.5, 7, (dx, dy) => (Math.abs(dx * 3 + dy * 7) % 5 < 1) ? 'C' : 'c'); FG.put(g, 6, 6, 'R'); FG.put(g, 13, 5, 'r'); FG.put(g, 16, 7, 'R'); FG.put(g, 9, 8, 'R'); return gOutline(g); },
    bellows: () => fromRows(FMAP.BELLOWS),
    bellowsOld: () => { const g = FG.mk(18, 10); FG.line(g, 0, 5, 3, 5, 'S'); FG.ell(g, 9, 5, 6, 3.5, (dx, dy) => dy < -1 ? 'q' : (Math.round(dx) % 3 === 0 ? 'O' : 'o')); FG.line(g, 15, 2, 17, 0, 'L'); FG.line(g, 15, 8, 17, 9, 'L'); return gOutline(g); },
    crates: () => { const c = FMAP.CRATE, g = mkGrid(19, 16); const pt = (ox, oy) => c.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') g[oy + y][ox + x] = ch; })); pt(8, 0); pt(0, 6); return g; },
    cratesOld: () => { const g = FG.mk(24, 18); FG.rect(g, 0, 6, 11, 17, (x, y) => x === 0 || y === 6 || x === 11 || y === 17 ? 'O' : x === y - 6 ? 'O' : 'o'); FG.rect(g, 12, 9, 23, 17, (x, y) => x === 12 || y === 9 || x === 23 || y === 17 ? 'O' : 'o'); FG.rect(g, 3, 0, 9, 5, (x, y) => y === 0 ? 'G' : x === 9 ? 'S' : 'g'); return gOutline(g); },
    armor: () => fromRows(FMAP.ARMOR),
    armorOld: () => { const g = FG.mk(16, 30); FG.line(g, 8, 8, 8, 29, 'O'); FG.line(g, 3, 28, 13, 28, 'O'); FG.line(g, 2, 12, 14, 12, 'O');
      FG.ell(g, 8, 4, 4, 4, (dx, dy) => dy > 0.5 && Math.abs(dy - 1) < 0.6 ? 'x' : dx < -1 ? 'G' : dx > 1.5 ? 'S' : 'g'); // 투구
      FG.rect(g, 4, 10, 12, 20, (x, y) => (x === 8 && y > 11) ? 'S' : x < 6 ? 'G' : x > 10 ? 'S' : 'g'); FG.ell(g, 3, 11, 2, 2, 'g'); FG.ell(g, 13, 11, 2, 2, 'S'); FG.rect(g, 5, 20, 11, 21, 'L'); return gOutline(g); },
    ore: () => fromRows(FMAP.ORE),
    oreOld: () => { const g = FG.mk(22, 11); FG.ell(g, 11, 10, 10.5, 7.5, (dx, dy) => { const h = Math.abs(Math.sin(dx * 3.1 + dy * 5.7)); return h > 0.93 ? 'R' : h > 0.75 ? 'q' : dx < -3 && dy < -2 ? 'h' : dx > 4 ? 'd' : 'l'; }); return gOutline(g); },
    ingots: () => { const g = FG.mk(14, 6); for (const [x, y] of [[0, 3], [5, 3], [10, 3], [3, 0], [8, 0]]) FG.rect(g, x, y, x + 3, y + 2, (xx, yy) => yy === y ? 'G' : 'g'); return gOutline(g); },
  };
  const NEWDECO = new Set(['barrel', 'coal', 'bellows', 'crates', 'armor', 'ore']);
  const forgeArt = (k, fn) => art('forge_' + k, () => gCanvas(fn(), NEWDECO.has(k) ? FPAL : FORGE_PAL));
  // 방 만들기
  function makeForgeRoom() {
    const R = { id: 0, gx: 0, gy: 0, type: 'forge', shape: 'forge', doors: { n: null, s: null, w: null, e: null }, visited: true, seen: true, cleared: true, loot: [], seed: 4242, obs: [], props: [], style: { path: 'none', doors: [] }, tier: 0 };
    setArena(SHAPES.forge);
    const st = { furnace: { x: CX - 158, y: A.y0 + 96, r: 36, k: 'salv', t: 'F 용광로 · 분해' }, anvil: { x: CX - 92, y: CY + 30, r: 18, k: 'enh', t: 'F 모루 · 강화' }, grind: { x: CX + 152, y: CY + 22, r: 18, k: 'roll', t: 'F 숫돌 · 재련' } };
    R.stations = st; R.smith = { x: st.anvil.x - 14, y: st.anvil.y - 12 };
    R.rug = { x: CX + 22, y: CY + 34 }; // v1.02 가운데 러그
    R.deco = [{ n: 'tools', x: CX - 30, y: A.y0 + 28, wall: true }, { n: 'rack', x: CX + 52, y: A.y0 + 38, wall: true }, { n: 'rack', x: CX + 112, y: A.y0 + 38, wall: true },
      { n: 'bellows', x: CX - 224, y: A.y0 + 88 }, { n: 'coal', x: CX - 92, y: A.y0 + 98 }, { n: 'barrel', x: st.anvil.x + 38, y: st.anvil.y + 4 }, { n: 'ingots', x: st.anvil.x + 14, y: st.anvil.y + 26 },
      { n: 'armor', x: A.x0 + 26, y: CY + 36 }, { n: 'ore', x: A.x0 + 92, y: A.y1 - 14 }, { n: 'crates', x: A.x0 + 36, y: A.y1 - 10 }, { n: 'barrel', x: A.x1 - 26, y: CY + 12 }];
    for (const s of Object.values(st)) R.obs.push({ t: 'prop', c: true, x: s.x, y: s.y - 4, r: s.r });
    R.obs.push({ t: 'prop', c: true, x: R.smith.x - 4, y: R.smith.y - 2, r: 9 });
    for (const d of R.deco) if (!d.wall) R.obs.push({ t: 'prop', c: true, x: d.x, y: d.y - 4, r: d.n === 'coal' || d.n === 'ore' ? 16 : d.n === 'crates' ? 20 : 10 });
    R.exit = { x: A.x1 - 62, y: A.y1 - 44 };
    R.nav = buildNav(R.obs); R.sprites = [];
    return R;
  }
  function enterForge() {
    const R = makeForgeRoom();
    G.dun = { rooms: [R], start: R, cur: null, eliteDone: 2, keys: 0, sock: [true, true], bossOpen: true, gate: null, stage: G.stage, forge: true, bx0: 0, bx1: 0, by0: 0, by1: 0 };
    G.loot = []; G.drops = [];
    enterRoom(R, null);
    const P = G.player; P.x = CX + 22; P.y = A.y1 - 26;
    if (!G.forgeGreet) { G.forgeGreet = true; banner('곰 대장장이의 대장간', '모루 = 강화 · 숫돌 = 재련 · 용광로 = 분해 · 준비되면 붉은 출구로'); } else banner('대장간', `STAGE ${G.stage} 돌파 — 다음은 STAGE ${G.stage + 1}`);
    mode = 'play';
  }
  function leaveForge() { G.dun = null; applyClassUI(); nextStage(); }
  // 그리기
  function paintForgeFloor(g, R) { // 그을음 · 쇳조각 · 바닥 불씨 자국
    for (let i = 0; i < 9; i++) { const x = rand(A.x0 + 30, A.x1 - 30), y = rand(A.y0 + 30, A.y1 - 20), r = rand(18, 40); for (let yy = -r; yy < r; yy += 2) for (let xx = -r; xx < r; xx += 2) { const q = Math.hypot(xx / r, yy / (r * 0.6)); if (q < 1 && dith((x + xx) >> 1, (y + yy) >> 1, 0.5 * (1 - q))) { g.fillStyle = 'rgba(10,8,10,.55)'; g.fillRect(Math.round(x + xx) & ~1, Math.round(y + yy) & ~1, 2, 2); } } }
    const f = R.stations.furnace; for (let yy = -40; yy < 40; yy += 2) for (let xx = -70; xx < 70; xx += 2) { const q = Math.hypot(xx / 70, yy / 40); if (q < 1 && dith((f.x + xx) >> 1, (f.y + 10 + yy) >> 1, 0.6 * (1 - q))) { g.fillStyle = 'rgba(14,10,10,.6)'; g.fillRect(Math.round(f.x + xx) & ~1, Math.round(f.y + 10 + yy) & ~1, 2, 2); } }
    for (let i = 0; i < 40; i++) { const x = rand(A.x0 + 20, A.x1 - 20) & ~1, y = rand(A.y0 + 20, A.y1 - 10) & ~1; g.fillStyle = pick(['#5e626a', '#8d9097', '#4a3020', '#7a3a1a']); g.fillRect(x, y, 2, 2); if (Math.random() < 0.4) g.fillRect(x + 2, y, 2, 2); }
    // 가운데 러그: 테두리 띠 · 마름모 무늬 · 술 장식 · 닳은 자국 (2px 칸)
    { const W0 = 60, H0 = 30, x0 = (R.rug.x - W0) & ~1, y0 = (R.rug.y - H0) & ~1, C = { K: '#2a0c0a', d: '#5a1612', r: '#86261e', R: '#a8382a', o: '#b8863a', O: '#7a5424', c: '#d8c09a' };
      const px = (i, j, c) => { g.fillStyle = C[c]; g.fillRect(x0 + i * 2, y0 + j * 2, 2, 2); };
      for (let j = 0; j < H0; j++) for (let i = 0; i < W0; i++) {
        const e = Math.min(i, W0 - 1 - i, j, H0 - 1 - j), dx = Math.abs(i - (W0 - 1) / 2) / (W0 / 2), dy = Math.abs(j - (H0 - 1) / 2) / (H0 / 2), dm = dx * 1.0 + dy * 1.0;
        let c = e === 0 ? 'K' : e === 1 ? 'o' : e === 2 ? 'd' : e === 3 ? ((i + j) % 4 < 2 ? 'O' : 'd') : e === 4 ? 'd' : 'r';
        if (e > 4) { if (Math.abs(dm - 0.55) < 0.05) c = 'o'; else if (dm < 0.5) c = Math.abs(dm - 0.28) < 0.05 ? 'c' : dm < 0.14 ? 'R' : 'd'; else if (((i + j) % 6 === 0 || (i - j + 60) % 6 === 0) && dm > 0.62) c = 'R'; }
        if (e > 1 && Math.random() < 0.05) c = c === 'r' ? 'd' : c; // 닳은 자국
        px(i, j, c);
      }
      for (let j = 1; j < H0 - 1; j += 2) { px(-1, j, 'c'); px(W0, j, 'c'); if (j % 4 === 1) { px(-2, j, 'O'); px(W0 + 1, j, 'O'); } } // 양끝 술
    }
    // 모루 둘레: 그을음 + 식은 쇳가루 (디더)
    const a = R.stations.anvil; for (let yy = -22; yy <= 22; yy += 2) for (let xx = -54; xx <= 54; xx += 2) { const q = Math.hypot(xx / 54, yy / 22); if (q < 1 && dith((a.x + xx) >> 1, (a.y + yy) >> 1, 0.7 * (1 - q))) { g.fillStyle = Math.random() < 0.08 ? '#6e5a4a' : 'rgba(8,6,8,.6)'; g.fillRect((a.x + xx) & ~1, (a.y + yy) & ~1, 2, 2); } }
  }
  function forgeEnts(ents) {
    const R = G.dun && G.dun.cur; if (!R || R.type !== 'forge') return;
    const st = R.stations;
    ents.push({ y: st.furnace.y, d: () => drawFurnace(st.furnace) });
    ents.push({ y: st.anvil.y, d: () => { const c = art('forge_anvil2', () => gCanvas(fromRows(FMAP.ANVIL), FPAL)); ctx.drawImage(c, (st.anvil.x - c.width / 2) & ~1, (st.anvil.y - c.height + 4) & ~1); } });
    ents.push({ y: st.grind.y, d: () => drawGrind(st.grind) });
    ents.push({ y: R.smith.y, d: () => drawSmith(R) });
    for (const d of R.deco) ents.push({ y: d.y, d: () => { const c = forgeArt(d.n, FORGE_DECO[d.n]); ctx.drawImage(c, (d.x - c.width / 2) & ~1, (d.y - c.height + 4) & ~1); } });
  }
  function drawFurnace(f) {
    const c = forgeArt('furnace', genFurnace), x0 = (f.x - c.width / 2) & ~1, y0 = (f.y - c.height + 6) & ~1;
    ctx.drawImage(c, x0, y0);
    // 아가리 속 불: 2px 칸 불꽃이 일렁임
    const mx = x0 + 45, my = y0 + 108, fl = Math.floor(time * 12);
    for (let yy = -18; yy <= 0; yy += 2) for (let xx = -18; xx <= 18; xx += 2) { const h = GX.hr(xx * 1.7 + yy * 0.9 + fl * 0.37), lv = (1 - Math.abs(xx) / 19) * (1 + yy / 20); if (lv <= 0 || h > lv + 0.2) continue; ctx.fillStyle = yy > -4 ? (h < 0.4 ? '#fff0b0' : '#ffd060') : h < 0.5 ? '#ff8a2a' : '#c03a1a'; ctx.fillRect((mx + xx) & ~1, (my + yy) & ~1, 2, 2); }
    if (Math.random() < 0.25) G.parts.push({ x: x0 + 45 + rand(-6, 6), y: y0 + 4, vx: rand(-8, 8), vy: -rand(20, 45), t: rand(0.8, 1.6), c: pick(['#3a3438', '#2a2428']), g: -10 }); // 굴뚝 연기
    if (Math.random() < 0.3) G.parts.push({ x: mx + rand(-8, 8), y: my - 6, vx: rand(-10, 10), vy: -rand(20, 50), t: rand(0.3, 0.7), c: pick(['#ffb060', '#ff6a2a']), g: 0, glow: true });
  }
  function drawGrind(s) {
    const fr = art('forge_gframe', () => gCanvas(fromRows(FMAP.GFRAME), FPAL)), x0 = (s.x - fr.width / 2) & ~1, y0 = (s.y - fr.height + 4) & ~1;
    const ph = Math.floor((G.grindT > 0 ? time * 16 : time * 0.8)) & 3, wh = art('forge_wheel2_' + ph, () => gCanvas(genWheel(ph), FPAL));
    ctx.drawImage(wh, x0 + 10, y0); ctx.drawImage(fr, x0, y0);
    if (G.grindT > 0 && Math.random() < 0.7) G.parts.push({ x: x0 + 32, y: y0 + 8, vx: rand(40, 110), vy: -rand(20, 70), t: rand(0.2, 0.4), c: pick(['#fff0b0', '#ffd060', '#ff9a3a']), g: 260, glow: true });
  }
  function drawSmith(R) {
    const P = G.player, near = Math.hypot(P.x - R.smith.x, P.y - R.smith.y) < 70, cyc = (time % 1.3) / 1.3, fr = cyc < 0.82 ? 0 : 1;
    const c = art('forge_bear2_' + fr, () => gCanvas(fromRows(fr ? FMAP.BEAR_B : FMAP.BEAR_A), FPAL));
    ctx.drawImage(c, (R.smith.x - 15) & ~1, (R.smith.y - c.height + 2) & ~1);
    if (fr === 1 && !R.hit) { R.hit = true; const a = R.stations.anvil; sfx('block', 1.4); for (let i = 0; i < 7; i++) { const an = rand(-Math.PI, 0); G.parts.push({ x: R.smith.x + 10, y: R.smith.y - 8, vx: Math.cos(an) * rand(40, 110), vy: Math.sin(an) * rand(40, 100), t: rand(0.2, 0.45), c: pick(['#fff0b0', '#ffd060', '#ff8a2a']), g: 300, glow: true }); } }
    if (fr === 0) R.hit = false;
    const say = npcTalk('smith', near, ['쇠는 뜨거울 때 두드려야지', '...물건 좀 보자', '그 칼, 이가 나갔군', '돈 되는 건 다 녹여 주지', '숫돌은 저쪽이다'], ['살아서 왔군', '...왔나']);
    if (say) drawBubble(say.line, R.smith.x - 16, R.smith.y - c.height + 10, -1); // 몸통은 곰 왼쪽에 (모루 안내 글자와 안 겹치게)
  }
  function forgeLights(lights) {
    const R = G.dun && G.dun.cur; if (!R || R.type !== 'forge') return;
    const f = R.stations.furnace, fl = Math.sin(time * 13) * 6;
    lights.push({ x: f.x, y: f.y - 16, r: 190 + fl, a: 1, c: '255,120,40', ca: 0.26 });
    lights.push({ x: R.stations.anvil.x, y: R.stations.anvil.y - 16, r: 120, a: 0.7, c: '255,190,120', ca: 0.1 });
    lights.push({ x: R.stations.grind.x, y: R.stations.grind.y - 10, r: 90, a: 0.5, c: '200,200,220', ca: 0.05 });
  }
  function forgeInteract() {
    const R = G.dun && G.dun.cur; if (!R || R.type !== 'forge') return null;
    const P = G.player;
    for (const s of Object.values(R.stations)) if (Math.hypot(P.x - s.x, P.y - s.y) < s.r + 26) return { k: 'station', o: s, x: s.x, y: s.y - (s === R.stations.furnace ? 100 : 44), t: s.t };
    if (Math.hypot(P.x - R.smith.x, P.y - R.smith.y) < 36) return { k: 'station', o: R.stations.anvil, x: R.smith.x, y: R.smith.y - 44, t: 'F 대장장이 · 강화' };
    return null;
  }
  function updateGearFx(dt) { // v0.98
    const P = G.player;
    if (G.grindT > 0) G.grindT -= dt;
    if (P.echoT > 0) P.echoT -= dt;
    if (G.pfire) { for (const f of G.pfire) { f.t -= dt; f.tick -= dt;
        if (Math.random() < dt * 14) G.parts.push({ x: f.x + rand(-20, 20), y: f.y + rand(-12, 8) - 8, vx: rand(-6, 6), vy: -rand(30, 60), t: rand(0.3, 0.6), c: pick(['#ffb060', '#ff6a2a', '#ffe0a0']), g: 0, glow: true });
        if (f.tick <= 0) { f.tick = 0.3; for (const e of G.enemies) if (!e.dead && e.type !== 'flag' && Math.hypot(e.x - f.x, (e.y - f.y) / 0.7) < 26) { addBurn(e, 2, 0.2); damageEnemy(e, 0.12, { dot: true, proc: true, gauge: 0 }); } } }
      G.pfire = G.pfire.filter(f => f.t > 0); }
    for (const e of G.enemies) if (!e.dead && e.bleedT > 0) { e.bleedT -= dt; e.bleedTick -= dt;
      if (Math.random() < dt * 10) G.parts.push({ x: e.x + rand(-5, 5), y: e.y - rand(6, 20), vx: rand(-10, 10), vy: rand(10, 30), t: 0.4, c: pick(['#a3161c', '#7a1018']), g: 120, floor: e.y + 2 });
      if (e.bleedTick <= 0) { e.bleedTick = 0.5; gxSpurt(e, 4); damageEnemy(e, 0.15, { dot: true, proc: true, gauge: 0 }); } }
  }
  const fxRing = (x, y, c, grow) => G.fx.push({ kind: 'ring', x, y, r: 8, t: 0.35, max: 0.35, c, grow });
  const nearFoes = (x, y, r, skip) => G.enemies.filter(o => !o.dead && o !== skip && o.type !== 'flag' && Math.hypot(o.x - x, o.y - y) < r);
  function chainBolt(e) {
    const ts = nearFoes(e.x, e.y, 130, e).sort((a, b) => dist(a, e) - dist(b, e)).slice(0, 2);
    ts.forEach((t, i) => gxBolt(i ? ts[0] : e, t, i * 0.07));
    for (const t of ts) {
      damageEnemy(t, 0.5, { proc: true, ang: angTo(e, t), gauge: 0 }); }
    if (ts.length) { sfx('bolt', 1.3); sfx('hit', 1.6); }
  }
  function ghostSword(e) {
    gxGhostSword(e);
    for (const o of nearFoes(e.x, e.y, 52)) damageEnemy(o, 1.2, { proc: true, ang: -Math.PI / 2, gauge: 0 });
    sfx('hit', 0.7);
  }
  function fireWave(ang) {
    const P = G.player, ux = Math.cos(ang), uy = Math.sin(ang);
    gxWave(ang);
    for (const e of G.enemies) { if (e.dead || e.type === 'flag') continue; const dx = e.x - P.x, dy = e.y - P.y, al = dx * ux + dy * uy, pp = Math.abs(-dx * uy + dy * ux); if (al > 0 && al < 170 && pp < 22 + (e.r || 8)) damageEnemy(e, 0.9, { proc: true, ang, gauge: 1 }); }
    sfx('whoosh', 1.4);
  }
  function gearOnKill(e) {
    const P = G.player, s = G.stats; if (!s || e.type === 'flag') return;
    if (s.efx.has('corpse')) { gxCorpse(e); for (const o of nearFoes(e.x, e.y, 64, e)) damageEnemy(o, 0.6, { proc: true, ang: angTo(e, o), gauge: 1 }); }
    let heal = 0; if (s.efx.has('vamp')) { heal += 0.02; gxOrbs(e, 'vamp'); } if (s.set4.has('orc')) { heal += 0.03; gxOrbs(e, 'orc'); }
    if (heal && !P.dead) { const h = Math.max(1, Math.round(s.hp * heal)); P.hp = Math.min(s.hp, P.hp + h); G.nums.push({ x: P.x + 6, y: P.y - 34, v: '+' + h, t: 0.6, c: '#7dff8a', s: 1 }); }
    if (s.efx.has('greed') && Math.random() < 0.15) { spawnLoot('pouch', e.x, e.y); gxCoins(e.x, e.y); }
  }
  function gearOnHurt() {
    const P = G.player, s = G.stats;
    if (s.efx.has('thorns')) { gxThorns(P.x, P.y); for (const o of nearFoes(P.x, P.y, 72)) damageEnemy(o, 0.6, { proc: true, ang: angTo(P, o), gauge: 0 }); }
    if (s.set4.has('slime') && Math.random() < 0.3) { gxAcid(P.x, P.y); for (const o of nearFoes(P.x, P.y, 84)) damageEnemy(o, 0.8, { proc: true, ang: angTo(P, o), gauge: 0 }); }
  }
  function updateLoot(dt) {
    const P = G.player;
    updateGearFx(dt);
    const bc = G.dun && G.dun.cur && G.dun.cur.chest;
    if (bc && bc.fall > 0) { bc.fall = Math.max(0, bc.fall - dt * 1.4); bc.lift = Math.round(bc.fall * bc.fall * 180) & ~1;
      if (!bc.fall) { bc.lift = 0; addShake(7); sfx('drop'); sfx('coin'); dust(bc.x, bc.y, 24); G.fx.push({ kind: 'ring', x: bc.x, y: bc.y, r: 6, grow: 180, t: 0.4, max: 0.4, c: '#ffd34d' }); G.fx.push({ kind: 'skybeam', x: bc.x, y: bc.y, w: 30, c: '255,210,120', t: 0.6, max: 0.6, up: true }); } }
    for (const l of G.loot) {
      l.t += dt; l.life -= dt;
      if (l.z > 0 || l.vz > 0) { l.vz -= 420 * dt; l.z += l.vz * dt; if (l.z <= 0) { l.z = 0; l.vz = Math.abs(l.vz) > 50 ? -l.vz * 0.35 : 0; } }
      l.x += l.vx * dt; l.y += l.vy * dt; l.vx *= 0.9; l.vy *= 0.9;
      solveObs(l, 7); l.x = clamp(l.x, A.x0 + 8, A.x1 - 8); l.y = clamp(l.y, A.y0 + 8, A.y1 - 8);
      if (P.dead || l.t < 0.45 || l.type === 'gear' || !lootWanted(l)) continue;
      const d = dist(l, P);
      if (d < 56) { const k = Math.min(1, (300 * dt) / Math.max(d, 1)); l.x += (P.x - l.x) * k; l.y += (P.y - 4 - l.y) * k; }
      if (d < 12) { collectLoot(l); l.life = -1; }
    }
    G.loot = G.loot.filter(l => l.life > 0);
    if (G.frenzyT > 0) {
      G.frenzyT -= dt;
      if (Math.random() < dt * 14) G.parts.push({ x: P.x + rand(-7, 7), y: P.y - rand(4, 22), vx: rand(-6, 6), vy: rand(-40, -20), t: rand(0.3, 0.6), c: pick(['#ff3040', '#ff7070', '#a3161c']), g: 0, glow: true });
      if (G.frenzyT <= 0) lootFeed('핏빛 영약의 효과가 끝났다', '#9a8f8a');
    }
  }
  function collectLoot(l) {
    const P = G.player, s = G.stats, L = LOOT[l.type];
    if (l.type === 'meat' || l.type === 'bigmeat') {
      const v = Math.round(s.hp * (l.type === 'bigmeat' ? 0.3 : 0.15) * (s.curse.has('nopot') ? 0.5 : 1)), got = Math.min(v, s.hp - P.hp);
      P.hp += got; P.poisonT = 0; sfx('heal');
      G.nums.push({ x: P.x, y: P.y - 34, v: '+' + Math.round(got), t: 0.9, c: '#7dff8a', s: 2 });
      burst(P.x, P.y - 12, '#ff6a6a', 6);
      lootFeed(`${L.n} — HP +${Math.round(got)} · 해독`, L.c);
    } else if (l.type === 'orb') {
      P.gauge = Math.min(100, P.gauge + 15); sfx('ready');
      burst(P.x, P.y - 12, '#ffd34d', 8);
      lootFeed(`${L.n} — 투지 +15`, L.c);
    } else if (l.type === 'pouch') {
      const g = randi(25, 45); G.gold += g; sfx('coin');
      G.nums.push({ x: P.x, y: P.y - 34, v: '+' + g, t: 0.9, c: '#ffd34d', s: 2 });
      lootFeed(`${L.n} — 골드 +${g}`, L.c);
    } else if (l.type === 'sealkey') {
      const K = SK(); G.dun.keys++; sfx('perfect'); sfx('drop'); burst(P.x, P.y - 12, K.c, 12);
      G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 8, grow: 140, t: 0.4, max: 0.4, c: K.c });
      lootFeed(`<b style="color:${K.c}">${K.key}</b> 획득 — 보스 방 앞 ${K.sockN}에 바쳐라 (F)`, K.c, 4000);
    } else if (l.type === 'vial') {
      G.frenzyT = 8; sfx('frenzy'); flashT = 0.06; flashColor = '#ff3040';
      G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 8, grow: 160, t: 0.35, max: 0.35, c: '#ff3040' });
      lootFeed(`${L.n} — 8초간 공격력 +30%`, L.c);
    } else if (l.type === 'gear') {
      const it = l.it, g = gradeOf(it);
      SAVE.inv.push(it); G.fieldItems.push(it);
      let equipped = false, cmp = '';
      if (canEquip(it, G.cls)) {
        const curId = eqOf(G.cls)[it.slot], cur = SAVE.inv.find(i => i.id === curId);
        { const sl = slotOf(it), dv = itemVal(it) - (cur ? itemVal(cur) : 0); cmp = cur ? ` <span style="color:${dv > 0 ? '#7dff8a' : dv < 0 ? '#ff6a6a' : '#aaa'}">${sl.label} ${dv > 0 ? '▲' : dv < 0 ? '▼' : '='}${Math.abs(dv)}</span>` : ' <span style="color:#7dff8a">빈 칸</span>';
          G.nums.push({ x: P.x, y: P.y - 46, v: it.name, t: 1.4, c: g.c, s: 1, txt: true }); }
        if (!it.curse && !cur) { // v1.19 빈 칸일 때만 자동 장착 (저주 장비는 자동 장착하지 않음), 이미 끼고 있으면 가방으로
          eqOf(G.cls)[it.slot] = it.id; equipped = true;
          const oldHp = G.stats.hp; G.stats = calcStats(G.buffs);
          P.hp = clamp(P.hp + Math.max(0, G.stats.hp - oldHp), 1, G.stats.hp);
        }
      }
      persist(); sfx('drop');
      G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 10, grow: 120, t: 0.45, max: 0.45, c: g.c });
      lootFeed(`<b style="color:${g.c}">[${g.n}] ${it.name}</b>${cmp}${equipped ? ' — 즉시 장착!' : canEquip(it, G.cls) ? ' — 가방에 보관 (I)' : ' — 다른 직업 무기'}${it.efx ? ` · <span style="color:#7fd4ff">${EFX[it.efx].n}</span>` : ''}${it.set ? ` · <span style="color:${SETS[it.set].c}">${SETS[it.set].n}</span>` : ''}${it.curse ? ' · <span style="color:#ff6a6a">저주</span>' : ''}`, g.c, 4200);
    }
  }
  function lootFeed(html, c, ms = 2600) {
    const box = $('lootFeed'); if (!box) return;
    const el = document.createElement('div'); el.className = 'lf'; el.style.setProperty('--c', c); el.innerHTML = html;
    box.prepend(el);
    while (box.children.length > 5) box.lastChild.remove();
    setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 450); }, ms);
  }
  // ---- v1.00 드랍 장비 도트: 부위별 모양 (무기는 그 직업·등급의 실제 무기를 비스듬히), 등급색 팔레트
  const GEAR_ICON_MAP = { // 작은 아이콘 (2px 칸, 약 16px): 부위·직업 무기 종류와 등급색만 알아보게
    helm: ['...aa...', '..mmmm..', '.mllmmd.', '.mkkkkd.', '.mmmmmd.', '.mlmkmd.', '..dddd..'],
    armor: ['.tt..tt.', 'tmmttmmt', '.mlmamd.', '.mlaamd.', '.mmmmmd.', '..tttt..'],
    boots: ['.mld.mld', '.mld.mld', '.mad.mad', 'mmmdmmmd', 'dddddddd'],
    ring: ['..aa..', '.taat.', 't....t', 't....t', '.tttt.'],
    neck: ['t....t', '.t..t.', '..tt..', '.taat.', '.taat.', '..tt..'],
    knight: ['......lw', '.....lml', '....lmd.', '...lmd..', 't.lmd...', '.tmd....', '.ht.....', 'h..t....'],
    ranger: ['.....w.', '....lw.', '...lm..', 't.lm...', '.tm....', '.ht....', 'h......'],
    mage: ['.....aa', '....aWa', '....ta.', '...h...', '..h....', '.h.....', 'h......'],
    priest: ['....l.l', '...lmml', '....mmd', '...hld.', '..h....', '.h.....', 'h......'],
    gunner: ['......m', '.....md', '....md.', '...md..', '.hhd...', 'hhh....', 'hh.....'],
  };
  const GEAR_ICON_PAL = {
    common: { m: '#8d9097', l: '#c0c4ca', d: '#4d4f55', t: '#6a5a48', a: '#a8a8a8', W: '#ffffff', w: '#e8ecf0', h: '#6b4a2a', k: '#0b0a0e' },
    rare: { m: '#9fb0c8', l: '#e6eef8', d: '#4a5a78', t: '#c0c8d8', a: '#4f8dff', W: '#ffffff', w: '#ffffff', h: '#5a4030', k: '#0b0a0e' },
    unique: { m: '#5a4a6e', l: '#a890c8', d: '#2a1e38', t: '#c9a24a', a: '#b05cff', W: '#f0d8ff', w: '#e8d0ff', h: '#4a3040', k: '#0b0a0e' },
    legend: { m: '#e8c060', l: '#fff0b0', d: '#a07820', t: '#ffe08a', a: '#ff6a2a', W: '#ffffff', w: '#fffbe6', h: '#8a4a20', k: '#0b0a0e' },
  };
  const gearIconCache = {};
  function drawGearIcon(it, x, y) {
    const k = it.slot === 'weapon' ? (it.cls || 'knight') : it.slot, key = k + ':' + it.grade;
    const c = gearIconCache[key] || (gearIconCache[key] = gCanvas(gOutline(fromRows(GEAR_ICON_MAP[k])), GEAR_ICON_PAL[it.grade]));
    ctx.drawImage(c, Math.round(x - c.width / 2) & ~1, Math.round(y - c.height) & ~1);
  }
  // ---- v1.00 바닥 장비 비교: 가까이 가면 「바닥」과 「착용 중」을 나란히, F로 줍기
  let gearCmpId = null;
  function nearGear() {
    const P = G.player; let best = null, bd = 34;
    for (const l of G.loot) if (l.type === 'gear' && l.t > 0.45 && l.life > 0) { const d = Math.hypot(l.x - P.x, l.y - P.y); if (d < bd) { bd = d; best = l; } }
    return best;
  }
  function updateGearCmp() {
    const el = $('gearCmp'); if (!el) return;
    const l = G && mode === 'play' && G.player && !G.player.dead ? nearGear() : null;
    if (!l) { if (gearCmpId !== null || el.classList.contains('on')) { el.classList.remove('on'); gearCmpId = null; } return; } // v1.04: 주운 뒤에도 패널이 남던 문제 — 실제로 떠 있는지로 판단
    const key = l.it.id + ':' + Object.values(eqOf(G.cls)).join(','); if (gearCmpId === key) return; gearCmpId = key;
    const it = l.it, cur = canEquip(it, G.cls) ? SAVE.inv.find(i => i.id === eqOf(G.cls)[it.slot]) : null;
    const prevCUR = CUR; CUR = G.cls;
    let diff = '';
    if (canEquip(it, G.cls)) { SAVE.inv.push(it); const nx = statsIf(it.slot, it.id); SAVE.inv.pop(); const now = calcStats(G.buffs);
      diff = INV_STATS.map(([k, n, f]) => { const pct = ['crit', 'critDmg', 'cdr'].includes(k), dv = nx[k] - now[k]; if (Math.abs(dv) < (pct ? 0.0005 : 0.5)) return ''; return `<span class="${dv > 0 ? 'up' : 'dn'}">${n} ${dv > 0 ? '▲' : '▼'}${pct ? (Math.abs(dv) * 100).toFixed(0) + '%p' : f(Math.abs(dv))}</span>`; }).join('') || '<span>능력치 변화 없음</span>'; }
    else diff = `<span class="dn">${CLASSES[it.cls].n} 전용 무기 — 장착할 수 없음</span>`;
    const auto = canEquip(it, G.cls) && !it.curse && (!cur || itemVal(it) > itemVal(cur));
    const card = x => itemCard(x, false, false).replace(/(◆ [^—<]+) — [^<]*/, '$1').replace(/(☠ 저주) — ([^<]*)/, '$1: $2');
    el.innerHTML = `<div class="gcCols"><div><div class="gcH">바닥</div>${card(it)}</div><div><div class="gcH">착용 중</div>${cur ? card(cur) : `<div class="item gcEmpty" style="--c:#3a2f40">${canEquip(it, G.cls) ? '빈 칸' : '—'}</div>`}</div></div><div class="pkCmp">${diff}</div><div class="gcKey"><span class="kb">F</span> 줍기${auto ? ' · 바로 장착' : it.curse ? ' · 저주 장비는 가방으로' : ' · 가방으로'}</div>`;
    CUR = prevCUR;
    el.classList.add('on');
  }
  function drawLoot(l) {
    const L = LOOT[l.type];
    const blink = l.life < 4 && Math.floor(l.life * 8) % 2 === 0;
    const hover = l.z + (l.vz === 0 && l.z === 0 ? 2 + Math.sin(time * 4 + l.bob) * 1.5 : 0);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(l.x, l.y, 5, 2, 0, 0, TAU); ctx.fill();
    if (blink) return;
    if (l.type === 'gear') {
      const it = l.it, g = gradeOf(it), gi = { common: 0, rare: 1, unique: 2, legend: 3 }[it.grade], h = [50, 80, 115, 160][gi] * Math.min(1, l.t * 2);
      const pulse = 0.75 + Math.sin(time * 5) * 0.25, col = it.curse ? '150,60,200' : g.c.replace('#', '').match(/../g).map(x => parseInt(x, 16)).join(','), wcells = [1, 2, 2, 3][gi];
      const bx = Math.round(l.x) & ~1, by = Math.round(l.y) & ~1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let y = 20; y < h; y += 2) { const k = y / h; // 위로 갈수록 성기게 (v1.00: 아이콘 위에서 시작)
        for (let c = -wcells; c < wcells; c++) { const edge = c === -wcells || c === wcells - 1; if (!dith((bx >> 1) + c, (by - y) >> 1, (1 - k) * (edge ? 0.45 : 0.9) * pulse)) continue; ctx.fillStyle = `rgba(${col},${(edge ? 0.5 : 0.85) * (1 - k * 0.6)})`; ctx.fillRect(bx + c * 2, by - y, 2, 2); }
        if ((y >> 1) % 3 === 0) { ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; ctx.fillRect(bx - 1, by - y, 2, 2); } }
      if (gi === 3) for (let i = 0; i < 6; i++) { const a = time * 2.4 + i * TAU / 6, yy = by - 10 - ((time * 30 + i * 22) % (h * 0.8)); ctx.fillStyle = `rgba(${col},0.95)`; ctx.fillRect((Math.round(l.x + Math.cos(a) * 10) & ~1), Math.round(yy) & ~1, 2, 2); }
      if (it.set) { const sc = SETS[it.set].c.replace('#', '').match(/../g).map(x => parseInt(x, 16)).join(','); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + time * 0.8; ctx.fillStyle = `rgba(${sc},0.8)`; ctx.fillRect(Math.round(l.x + Math.cos(a) * 9) & ~1, Math.round(l.y + 1 + Math.sin(a) * 4) & ~1, 2, 2); } }
      ctx.restore();
      if (it.curse && Math.random() < 0.35) G.parts.push({ x: l.x + rand(-6, 6), y: l.y - rand(0, 10), vx: rand(-5, 5), vy: -rand(15, 35), t: rand(0.4, 0.8), c: pick(['#2a1030', '#5a2070', '#14081a']), g: 0 });
      drawGearIcon(it, l.x, l.y - hover + 1);
      return;
    }
    if (l.type === 'sealkey') { drawSealKey(l, l.x, l.y - hover + 1); return; }
    drawSprite(L.map, 'loot', L.sc, l.x, l.y - hover + 1, false);
  }

  // 이번 런에서 모은 골드·재료 중 아직 대장간에 넘기지 않은 몫을 넘긴다
  function commitRunMats() {
    const c = G.committed;
    SAVE.gold += G.gold - c.gold; SAVE.mats.iron += G.iron - c.iron; SAVE.mats.crystal += G.crystal - c.crystal;
    G.committed = { gold: G.gold, iron: G.iron, crystal: G.crystal };
  }
  function takeBossItems() {
    for (const it of G.newItems) {
      SAVE.inv.push(it);
      if (canEquip(it, G.cls) && !it.curse) { const cur = SAVE.inv.find(i => i.id === eqOf(G.cls)[it.slot]); if (!cur) eqOf(G.cls)[it.slot] = it.id; }
    }
  }
  // 1스테이지 클리어 → 대장간 → 2스테이지
  function stageClear() {
    if (!G || mode !== 'play') return;
    takeBossItems(); commitRunMats(); persist();
    enterForge(); // v1.02: 대장간 창 대신 걸어 다니는 대장간 방
    G.mood = null; setMood('rest');
  }
  function nextStage() {
    const P = G.player;
    G.stage++; G.clear = false; G.drops = []; G.loot = []; G.newItems = []; G.mproj = []; G.meteor = null; G.parts = []; G.fx = [];
    dg.clearRect(0, 0, W, H);
    G.ash = [];
    for (let i = 0; i < 70; i++) G.ash.push(G.stage === 3 ? { x: rand(0, VW), y: rand(0, VH), vx: rand(-5, 5), vy: -rand(8, 22), s: Math.random() < 0.25 ? 2 : 1, a: rand(0.3, 0.85), ff: rand(0, 6) } : G.stage === 1 ? { x: rand(0, VW), y: rand(0, VH), vx: rand(-8, 8), vy: rand(-4, 4), s: Math.random() < 0.3 ? 2 : 1, a: rand(0.3, 0.9), ff: rand(0, 6) } : { x: rand(0, VW), y: rand(0, VH), vx: rand(-6, 6), vy: rand(6, 16), s: Math.random() < 0.2 ? 2 : 1, a: rand(0.2, 0.6) });
    G.stats = calcStats(G.buffs);
    Object.assign(P, { hp: G.stats.hp, hpBack: G.stats.hp, dead: false, state: 'idle', x: CX, y: CY + 60, inv: 1.2, iframe: 0, poisonT: 0, reload: 0 });
    hudPrev.hearts = -1;
    for (const k in pressed) pressed[k] = false;
    mode = 'play';
    newDungeon();
  }
  // 테스트: 현재 스테이지를 즉시 클리어 (보스 보상 1~2개 지급)
  function debugStageClear() {
    if (!G || G.clear) return;
    G.enemies = []; G.tele = []; G.eproj = []; G.spawning = 0; G.phaseState = 'clear'; G.vortex = null; G.boss = null;
    $('ovRest').classList.remove('on');
    G.newItems = []; const n = Math.random() < 0.5 ? 2 : 1;
    for (let i = 0; i < n; i++) G.newItems.push(makeItem(G.cls));
    G.clear = true; G.crystal++;
    banner(`STAGE ${G.stage} 클리어`, '테스트 키로 넘김');
    sfx('drop');
    setTimeout(() => { if (G && G.clear && mode === 'play') { if (G.stage < lastStage()) stageClear(); else showResult(true); } }, 900);
  }

  // ================================================================ 챕터 3 — 핏빛 엄니 부락 (v0.53)
  // 오크는 "몬스터는 무기를 들지 않음"의 예외 (고블린 아처의 활과 함께). 늑대·트롤·고블린 노예는 맨몸.
  // 모든 그래픽은 2px 칸 · 검은 외곽선 · 4단계 명암(왼쪽 위 빛). 거대 엘리트·보스도 칸 크기는 그대로 두고 칸 수를 늘려 키운다.
  const ORC_BASE = { k: '#0b0a0e', e: '#ffd23a', w: '#ece0c4', W: '#b8ac90', b: '#7a5034', B: '#4e3020', m: '#a4a4b0', M: '#5e5e6a', n: '#e4e4ec', H: '#1a1214', r: '#a32a2a', R: '#5e1416', y: '#d8a840', c: '#ff8a3a', o: '#8a6034', O: '#5a3a1e', s: '#d8c49a', S: '#a89068', g: '#7ad050', f: '#8a7860', F: '#5a4a3a', p: '#e8e2d4', q: '#d8b040' };
  const ORC_SKINS = {
    green: { h: '#8fb35e', l: '#6e9444', d: '#4c6c30', D: '#30481f' },
    moss: { h: '#9aa85a', l: '#7a883e', d: '#56622a', D: '#38401a' },
    ash: { h: '#9aaa86', l: '#7a8a68', d: '#56644a', D: '#3a4432' },
    dark: { h: '#76984c', l: '#587a36', d: '#3e5826', D: '#283a18' },
    brown: { h: '#a0905a', l: '#7e7040', d: '#5a4e2a', D: '#3a321a' },
    scar: { h: '#8aa070', l: '#6a8052', d: '#4a5a38', D: '#2e3a22' },
    olive: { h: '#a8a860', l: '#868642', d: '#5e5e2c', D: '#3c3c1a' },
    red: { h: '#a8806a', l: '#88604c', d: '#604232', D: '#3c281e' },
    troll: { h: '#9aa8a8', l: '#76848a', d: '#56626a', D: '#3a444c' },
    cave: { h: '#9a9a72', l: '#787a54', d: '#56583a', D: '#383a24' },
    boss: { h: '#74a04a', l: '#527c32', d: '#365a20', D: '#203a12' }, // v0.91 짙은 녹색
    // v0.91 오크 피부 4색 — 개체마다 무작위 (녹색 · 황토 · 핏빛 · 잿빛)
    v0: { h: '#8fb35e', l: '#6e9444', d: '#4c6c30', D: '#30481f' },
    v1: { h: '#bc9c5c', l: '#967a3e', d: '#6a5428', D: '#44361a' },
    v2: { h: '#c07a5e', l: '#9a5a42', d: '#6c3c2c', D: '#46241a' },
    v3: { h: '#9aa2a2', l: '#788282', d: '#545c5e', D: '#363c3e' },
  };
  const ORC_VAR_T = { orc: 1, othrow: 1, shaman: 1, ocharge: 1, odrum: 1, ogrip: 1 };
  const orcPal = (skin, extra) => Object.assign({}, ORC_BASE, ORC_SKINS[skin], extra || {});
  // 측면(오른쪽을 봄) 오크 몸통 — 꼿꼿이 선 체형 (v0.54). 넓은 어깨에서 허리로 좁아지는 상체, 어깨 위에 얹힌 머리와 내민 아래턱.
  // 부위마다 따로 칠하고, 앞 부위가 뒤 부위를 덮는 경계에는 안쪽 외곽선. 앞팔+무기는 어깨(삼각근)를 축으로 따로 회전한다
  function genOrcBody(o) {
    const W = o.W, H = o.H, GH = H + (o.padTop || 0), g = mkGrid(W, GH), K = (x, y) => y * W + x;
    const ell = (cx, cy, rx, ry) => { const m = new Map(); rx = Math.max(1, rx); ry = Math.max(1, ry); for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) m.set(K(x, y), [x, y, dx, dy]); } return m; };
    const rect = (x0, y0, x1, y1) => { const m = new Map(); x0 = Math.round(x0); x1 = Math.round(x1); y0 = Math.round(y0); y1 = Math.round(y1); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m.set(K(x, y), [x, y, (x - cx) / Math.max(1, (x1 - x0) / 2), (y - cy) / Math.max(1, (y1 - y0) / 2)]); return m; };
    const uni = (...ms) => { const m = new Map(); for (const q of ms) for (const [k, v] of q) if (!m.has(k)) m.set(k, v); return m; };
    const sh4 = (dx, dy, b = 0) => { const v = dx * 0.7 + dy * 0.9 + b; return v < -0.6 ? 'h' : v < 0.05 ? 'l' : v < 0.65 ? 'd' : 'D'; };
    const inb = (x, y) => x >= 1 && x < W - 1 && y >= 1 && y < GH - 1;
    const paint = (m, fn, contour = 'k') => {
      const out = [];
      for (const [, [x, y, dx, dy]] of m) {
        if (!inb(x, y)) continue;
        let edge = false;
        if (contour) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ax, ny = y + ay; if (!m.has(K(nx, ny)) && inb(nx, ny) && g[ny][nx] !== '.') { edge = true; break; } }
        out.push([x, y, edge ? contour : fn(dx, dy, x, y)]);
      }
      for (const [x, y, c] of out) g[y][x] = c;
    };
    const recolor = (m, fn) => { for (const [, [x, y, dx, dy]] of m) if (inb(x, y) && g[y][x] !== '.' && g[y][x] !== 'k') g[y][x] = fn(dx, dy, x, y); };
    const setc = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (inb(x, y)) g[y][x] = c; };
    const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) setc(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); };
    const gy = GH - 2, legH = Math.round(H * (o.leg || 0.3)), torH = Math.round(H * (o.tor || 0.32));
    const waistY = gy - legH, shY = waistY - torH, cx = W * (o.cu || 0.42), shw = W * (o.sh || 0.25), wa = W * (o.wa || 0.16), lean = o.lean || 0.06;
    const off = y => (waistY - y) * lean, hs = o.head || 1, hunch = o.hunch || 0;
    const cS = cx + off(shY);
    // 망토 뒷자락 (몸 뒤)
    if (o.cape) { const yb = gy - 1; for (let y = shY; y <= yb; y++) { const t = (y - shY) / (yb - shY), x0 = cx + off(y) - shw * (1.0 + t * 0.55), x1 = cx + off(y) - shw * 0.0; for (let x = Math.round(x0); x <= Math.round(x1); x++) { if (y >= yb - 2 && ((x * 7 + y * 3) % 5 < (y - (yb - 2)) * 2)) continue; const fold = (x - Math.round(x0) + 1) % 4 === 0; setc(x, y, x <= x0 + 1 ? 'k' : fold ? 'Z' : x < x0 + 3 ? 'A' : (x + y) % 7 === 0 ? 'Z' : 'R'); } } }
    if (o.cloak && !o.cape) { const yb = waistY + Math.round(legH * 0.75); for (let y = shY + 1; y <= yb; y++) { const t = (y - shY) / (yb - shY), x0 = cx + off(y) - shw * (0.85 + t * 0.25), x1 = cx + off(y) - shw * 0.05; for (let x = Math.round(x0); x <= Math.round(x1); x++) if (!(y === yb && (x % 3 === 0))) setc(x, y, (x + y) % 4 === 0 ? 'F' : x < x0 + 2 ? 'f' : 'F'); } }
    // 뒷팔
    if (o.backArm) {
      // 뒷팔도 팔꿈치에서 꺾인다: 어깨 → 팔꿈치(뒤·아래) → 주먹(앞쪽으로)
      const long = o.backArm === 'long', aw = Math.max(2, Math.round(W * (o.armW || 0.1))), r = aw / 2 + 0.2;
      const S0 = { x: cS - shw * 0.5, y: shY + 2 }, E0 = { x: S0.x - aw * 0.6, y: long ? waistY - 1 : waistY - torH * 0.25 }, H0 = long ? { x: E0.x + aw * 0.4, y: gy - 2 } : { x: E0.x + aw * 1.4, y: waistY + 2 };
      const m = new Map(), seg = (A2, B2, rr) => { for (let y = Math.floor(Math.min(A2.y, B2.y) - rr - 1); y <= Math.ceil(Math.max(A2.y, B2.y) + rr + 1); y++) for (let x = Math.floor(Math.min(A2.x, B2.x) - rr - 1); x <= Math.ceil(Math.max(A2.x, B2.x) + rr + 1); x++) { const vx = B2.x - A2.x, vy = B2.y - A2.y, L0 = vx * vx + vy * vy || 1, t = clamp(((x - A2.x) * vx + (y - A2.y) * vy) / L0, 0, 1); if (Math.hypot(x - A2.x - vx * t, y - A2.y - vy * t) <= rr * (1 + 0.25 * Math.sin(Math.PI * t))) m.set(K(x, y), [x, y, (x - A2.x) / (rr * 2), 0]); } };
      seg(S0, E0, r + 0.3); seg(E0, H0, r); for (const [k, v] of ell(H0.x, H0.y + 0.5, r + 0.4, r + 0.3)) m.set(k, v);
      paint(m, (dx) => dx < -0.15 ? 'd' : 'D', null);
      if (long) { setc(H0.x - 1, H0.y + 2, 'w'); setc(H0.x + 1, H0.y + 2, 'w'); }
    }
    // 뒷다리
    const thW = Math.max(2, Math.round(W * (o.thigh || 0.12))), knee = waistY + Math.round(legH * 0.5);
    const blx = cx - W * 0.1, flx = cx + W * 0.06;
    paint(uni(rect(blx, waistY - 1, blx + thW - 1, knee), rect(blx - 1, knee, blx + thW - 2, gy - 2)), (dx) => dx < -0.4 ? 'd' : 'D', null);
    paint(rect(blx - 2, gy - 1, blx + thW - 1, gy), (dx) => dx < 0 ? 'B' : 'k', null);
    // 상체: 어깨에서 허리로 좁아진다 (+가슴 근육, 배)
    const torso = new Map();
    for (let y = shY; y <= waistY; y++) {
      const t = (y - shY) / Math.max(1, waistY - shY);
      let hw = shw + (wa - shw) * Math.pow(t, o.taper || 0.85);
      if (t < 0.18) hw *= Math.sqrt(1 - Math.pow((0.18 - t) / 0.18, 2) * 0.45);
      const c = cx + off(y), pec = t > 0.1 && t < 0.45 ? W * 0.035 * (o.pec || 1) : 0, bel = o.belly ? o.belly * W * 0.09 * Math.sin(Math.PI * clamp((t - 0.35) / 0.65, 0, 1)) : 0;
      for (let x = Math.round(c - hw * 0.9); x <= Math.round(c + hw + pec + bel); x++) torso.set(K(x, y), [x, y, (x - c) / (hw + 0.01), t * 2 - 1]);
    }
    paint(torso, (dx, dy) => sh4(dx, dy), null);
    const pecY = shY + Math.round(torH * 0.42);
    for (let x = Math.round(cx + off(pecY) - shw * 0.05); x <= Math.round(cx + off(pecY) + shw * 0.85); x++) if (g[pecY] && g[pecY][x] && g[pecY][x] !== '.') setc(x, pecY, 'D');
    if (o.abs) for (let y = pecY + 2; y < waistY - 2; y += 2) { setc(cx + off(y) + shw * 0.45, y, 'd'); setc(cx + off(y) + shw * 0.15, y, 'd'); }
    if (o.scars) { const sy = shY + Math.round(torH * 0.3); line(cx - shw * 0.3, sy, cx + shw * 0.2, sy + 3, 'D'); line(cx + shw * 0.1, sy + 4, cx + shw * 0.5, sy + 1, 'D'); }
    if (o.plate) recolor(rect(cx + off(shY) - shw * 0.25, shY + torH * 0.12, cx + off(shY) + shw * 0.95, shY + torH * 0.62), (dx, dy, x, y) => (x + y) % 5 === 0 ? 'n' : dy < -0.4 ? 'm' : 'M');
    if (o.drum) { const du = cx + off(waistY) + shw * 0.9, dv = waistY - torH * 0.25, dr = Math.max(3, torH * 0.38); paint(ell(du, dv, dr * 0.55, dr), (dx) => Math.abs(dx) > 0.72 ? 'b' : dx < -0.25 ? 's' : 'S', 'k'); for (let y = Math.round(dv - dr + 1); y < dv + dr; y += 2) setc(du + dr * 0.42, y, 'B'); }
    if (o.chestPaint) for (let i = 0; i < 3; i++) line(cx + off(shY) + shw * (0.15 + i * 0.22), shY + torH * 0.2, cx + off(shY) + shw * (0.02 + i * 0.22), shY + torH * 0.55, 'r');
    if (o.strap) { // 앞 어깨 → 뒤 허리로 비스듬한 가죽끈, 쇠 징과 작은 해골 전리품 (v0.91)
      const ax = cS + shw * 0.55, ay = shY + 1, bx = cx + off(waistY) - wa * 0.95, by = waistY - 2, n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
      for (let i = 0; i <= n; i++) { const x = ax + (bx - ax) * i / n, y = ay + (by - ay) * i / n; setc(x, y, i % 4 === 2 ? 'm' : 'b'); setc(x + 1, y, 'B'); }
      const mx = (ax + bx) / 2 + 1, my = (ay + by) / 2; setc(mx, my, 'w'); setc(mx + 1, my, 'w'); setc(mx, my + 1, 'k'); setc(mx + 1, my + 1, 'W'); setc(mx - 1, my - 1, 'w');
    }
    if (o.quiver) { const qn = Math.round(H * 0.42); for (let i = 0; i < 3; i++) for (let t = 0; t < qn; t++) setc(cx - shw * 0.7 + i - t * 0.3, waistY - 2 - t, t >= qn - 2 ? 'm' : 'o'); }
    // 앞다리
    paint(uni(rect(flx, waistY - 1, flx + thW - 1, knee), rect(flx + 1, knee, flx + thW, gy - 2)), (dx) => dx < -0.45 ? 'h' : dx < 0.25 ? 'l' : 'd', 'k');
    paint(rect(flx, gy - 1, flx + thW + 2, gy), (dx) => dx < -0.3 ? 'b' : 'B', 'k');
    if (o.greaves) { recolor(rect(flx + 1, knee, flx + thW, gy - 2), (dx, dy, x, y) => y === knee ? 'n' : dx < -0.3 ? 'n' : dx < 0.4 ? 'm' : 'M'); recolor(rect(flx, gy - 1, flx + thW + 2, gy), (dx) => dx < -0.3 ? 'm' : 'M'); setc(flx + thW + 1, knee, 'w'); }
    // 허리띠 + 아랫도리
    const belt = rect(cx + off(waistY) - wa * 1.1, waistY - 2, cx + off(waistY) + wa * 1.3 + (o.belly ? W * 0.04 : 0), waistY - 1);
    recolor(belt, (dx, dy) => dy < 0 ? 'b' : 'B');
    if (o.buckle === 'skull3') { const bx = Math.round(cx + off(waistY) + wa * 0.7), by = waistY - 3; for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) setc(bx + x, by + y, y === 0 ? 'q' : x === 1 && y === 1 ? 'y' : y === 1 ? 'k' : x === 1 ? 'k' : 'y'); }
    else if (o.buckle) { const bx = cx + off(waistY) + wa * 0.9; setc(bx, waistY - 2, o.buckle === 'gold' ? 'y' : 'w'); setc(bx + 1, waistY - 2, o.buckle === 'gold' ? 'y' : 'W'); setc(bx, waistY - 1, o.buckle === 'gold' ? 'y' : 'k'); }
    const kl = o.kilt || 'loin', kc = kl === 'fur' ? ['f', 'F'] : kl === 'red' ? ['r', 'R'] : kl === 'skirt' ? ['b', 'M'] : ['b', 'B'];
    const kx0 = kl === 'loin' ? cx + off(waistY) - wa * 0.2 : cx + off(waistY) - wa * 1.1, kx1 = cx + off(waistY) + wa * 1.15, ky1 = waistY + Math.round(legH * (kl === 'loin' ? 0.45 : 0.38));
    paint(rect(kx0, waistY, kx1, ky1), (dx, dy, x, y) => y === ky1 && x % 2 ? '.' : (kl === 'skirt' && x % 3 === 0) ? kc[1] : dy < -0.3 ? kc[0] : (x + y) % 3 ? kc[1] : kc[0], 'k');
    for (let x = Math.round(kx0); x <= Math.round(kx1); x++) if (g[ky1] && g[ky1][x] === '.' && g[ky1 - 1][x] !== '.') { /* 너덜너덜한 끝 */ }
    if (o.tassets) { // 털 아랫도리 위에 쇠 판금 두 장 + 가운데 늘어진 붉은 천 (v0.91)
      for (const [x0, x1] of [[kx0 + 1, kx0 + (kx1 - kx0) * 0.38], [kx0 + (kx1 - kx0) * 0.62, kx1]]) paint(rect(x0, waistY, x1, ky1 - 1), (dx, dy, x, y) => y === waistY + 1 && x % 2 ? 'y' : dx < -0.4 ? 'n' : dy > 0.4 ? 'M' : 'm', 'k');
      const fx = Math.round(kx0 + (kx1 - kx0) * 0.5); for (let y = waistY; y <= ky1 + 3; y++) for (let x = fx - 1; x <= fx + 1; x++) { if (y === ky1 + 3 && x !== fx) continue; setc(x, y, x === fx - 1 ? 'A' : x === fx + 1 ? 'R' : 'r'); }
    }
    // 앞 어깨 (삼각근) + 어깨 보호대 — 앞팔이 여기서 나온다
    const dX = cS + shw * 0.22, dY = shY + torH * 0.22, dl = o.delt || 1;
    paint(ell(dX, dY, W * 0.095 * dl, H * 0.06 * dl), (dx, dy) => sh4(dx, dy, -0.25), 'k');
    if (o.pauld === 'spiked') { // v0.91: 금 테두리 쇠 어깨갑옷 + 뒤로 휜 뼈 가시 셋 + 해골 장식
      const prx = W * 0.15 * dl, pry = H * 0.07 * dl, px = dX - 0.5, py = dY - H * 0.035 * dl;
      for (const i of [-1, 0, 1]) { const bx = px + i * prx * 0.55, by = py - pry * 0.55, L = i === 0 ? 6 : 5; for (let t = 0; t <= L; t++) { const x = bx - t * 0.45 - t * t * 0.05, y = by - t; setc(x, y, t === L ? 'W' : 'w'); if (t < L - 1) setc(x + 1, y, 'W'); } }
      paint(ell(px, py, prx, pry), (dx, dy) => dy > 0.55 ? 'y' : dy > 0.3 ? 'M' : dx < -0.25 && dy < 0 ? 'n' : dy < -0.05 ? 'm' : 'M', 'k');
      const kx = Math.round(px + prx * 0.25), ky = Math.round(py - pry * 0.05); setc(kx, ky, 'w'); setc(kx + 1, ky, 'w'); setc(kx, ky + 1, 'k'); setc(kx + 1, ky + 1, 'W');
    } else if (o.pauld) {
      const pc = o.pauld === 'metal' ? ['n', 'm', 'M'] : o.pauld === 'bone' ? ['w', 'W', 'B'] : ['b', 'B', 'k'];
      paint(ell(dX - 0.5, dY - H * 0.03 * dl, W * 0.115 * dl, H * 0.05 * dl), (dx, dy) => dy > 0.35 ? pc[2] : dx < -0.2 && dy < 0 ? pc[0] : pc[1], 'k');
      for (let i = -1; i <= 1; i++) { setc(dX + i * W * 0.05 * dl, dY - H * 0.08 * dl - 1, 'w'); if (o.pauld !== 'hide') setc(dX + i * W * 0.05 * dl, dY - H * 0.08 * dl - 2, 'W'); }
    }
    // 머리 (어깨 위) + 내민 아래턱
    const hx = cS + shw * (o.hfwd || 0.4) + hunch * W * 0.12, hy = shY - H * 0.085 * hs + hunch * H * 0.12, hrx = W * 0.115 * hs, hry = H * 0.085 * hs;
    const head = ell(hx, hy, hrx, hry), jaw = ell(hx + hrx * 0.35, hy + hry * 0.55, hrx * 0.88, hry * 0.6);
    // 굵은 목
    paint(rect(hx - hrx * 0.6, hy, hx + hrx * 0.3, shY + 2), (dx) => dx < 0 ? 'd' : 'D', null);
    paint(uni(head, jaw), (dx, dy) => sh4(dx, dy, -0.15), 'k');
    recolor(jaw, (dx, dy) => dy > 0.25 ? 'D' : 'd');
    line(hx - hrx * 0.2, hy + hry * 0.38, hx + hrx * 1.05, hy + hry * 0.38, 'D'); // 입
    for (let x = Math.round(hx); x <= Math.round(hx + hrx * 0.95); x++) setc(x, hy - hry * 0.42, 'D'); // 눈썹 뼈
    setc(hx + hrx * 1.12, hy - hry * 0.05, 'l'); setc(hx + hrx * 1.12, hy + hry * 0.12, 'd'); // 코
    setc(hx + hrx * 0.55, hy - hry * 0.15, 'e'); if (W >= 36) setc(hx + hrx * 0.55 + 1, hy - hry * 0.15, 'e');
    if (o.scarEye) line(hx + hrx * 0.35, hy - hry * 0.6, hx + hrx * 0.8, hy + hry * 0.25, 'R');
    // 뾰족한 귀 (뒤로)
    line(hx - hrx * 0.75, hy - hry * 0.1, hx - hrx * 1.45, hy - hry * 0.8, 'l'); setc(hx - hrx * 1.55, hy - hry * 0.95, 'd');
    if (o.earring) setc(hx - hrx * 0.85, hy + hry * 0.2, 'y');
    if (o.warpaint) { line(hx - hrx * 0.1, hy - hry * 0.15, hx + hrx * 0.95, hy - hry * 0.15, 'r'); line(hx + hrx * 0.2, hy + hry * 0.05, hx + hrx * 0.2, hy + hry * 0.6, 'r'); }
    else if (o.paint) for (let i = 0; i < 3; i++) setc(hx + hrx * (0.1 + i * 0.3), hy + hry * 0.05, o.paint === 'white' ? 'p' : 'r');
    // 엄니
    const tk = o.tusk == null ? 1 : o.tusk, tx = Math.round(hx + hrx * 1.0), ty = Math.round(hy + hry * 0.3);
    for (let i = 0; i <= tk; i++) { setc(tx, ty - i, i === tk ? 'W' : 'w'); if (tk >= 3) setc(tx - 1, ty - i + 1, 'W'); }
    if (tk >= 2) { setc(tx - 3, ty, 'w'); setc(tx - 3, ty - 1, 'W'); }
    // 머리 장식
    const top = x => { for (let y = 0; y < GH; y++) if (g[y][x] !== '.') return y; return GH; };
    const hh = o.hair;
    if (hh === 'mohawk') for (let x = Math.round(hx - hrx * 0.7); x <= Math.round(hx + hrx * 0.35); x++) { const y = top(x); setc(x, y - 1, 'H'); setc(x, y - 2, 'H'); if (x % 2 === 0) setc(x, y - 3, 'H'); }
    if (hh === 'topknot') { const kx = hx - hrx * 0.2, ky = hy - hry * 1.05; paint(ell(kx, ky - 1, 1.8, 1.6), () => 'H', 'k'); line(kx - 1, ky, kx - hrx * 1.1, ky + hry * 1.2, 'H'); setc(kx, ky + 1, 'y'); }
    if (hh === 'braid') { const bx = hx - hrx * 0.9, by = hy - hry * 0.5; for (let i = 0; i < Math.round(H * 0.25); i++) setc(bx - i * 0.25, by + i, i % 2 ? 'H' : 'F'); setc(bx - Math.round(H * 0.25) * 0.25, by + Math.round(H * 0.25), 'y'); }
    if (hh === 'band') { for (let x = Math.round(hx - hrx * 0.9); x <= Math.round(hx + hrx * 0.85); x++) { const y = top(x); setc(x, y + 1, 'r'); } setc(hx - hrx * 0.9, hy - hry * 1.0, 'q'); setc(hx - hrx * 1.1, hy - hry * 1.5, 'q'); setc(hx - hrx * 1.2, hy - hry * 1.9, 'q'); setc(hx - hrx * 1.0, hy - hry * 1.4, 'w'); }
    if (hh === 'hornhelm') {
      paint(ell(hx - hrx * 0.05, hy - hry * 0.45, hrx * 1.08, hry * 0.68), (dx, dy) => dy > 0.3 ? 'k' : dx < -0.2 ? 'n' : dy < -0.2 ? 'm' : 'M', 'k');
      for (let x = Math.round(hx + hrx * 0.1); x <= Math.round(hx + hrx * 0.4); x++) setc(x, hy - hry * 0.05, 'M');
      line(hx + hrx * 0.7, hy - hry * 0.75, hx + hrx * 1.5, hy - hry * 1.9, 'w'); line(hx - hrx * 0.6, hy - hry * 0.85, hx - hrx * 1.4, hy - hry * 1.9, 'W');
    }
    if (hh === 'skull') {
      paint(ell(hx + hrx * 0.1, hy - hry * 0.55, hrx * 1.15, hry * 0.62), (dx) => dx < 0.1 ? 'w' : 'W', 'k');
      setc(hx + hrx * 0.55, hy - hry * 0.55, 'k'); setc(hx + hrx * 0.95, hy - hry * 0.45, 'k');
      line(hx - hrx * 0.5, hy - hry * 1.0, hx - hrx * 1.1, hy - hry * 1.9, 'W'); line(hx + hrx * 0.2, hy - hry * 1.05, hx + hrx * 0.5, hy - hry * 1.9, 'w');
      setc(hx - hrx * 1.2, hy - hry * 0.8, 'q'); setc(hx - hrx * 1.4, hy - hry * 1.2, 'q');
    }
    if (hh === 'crown') {
      const cy0 = Math.round(hy - hry * 0.85);
      for (let x = Math.round(hx - hrx * 0.95); x <= Math.round(hx + hrx * 0.75); x++) { setc(x, cy0, 'W'); setc(x, cy0 - 1, 'w'); if (x % 3 === 0) { setc(x, cy0 - 2, 'w'); setc(x, cy0 - 3, 'W'); } }
      const sx = Math.round(hx - hrx * 0.1); setc(sx, cy0 - 1, 'c'); setc(sx, cy0 - 2, 'c'); setc(sx, cy0 - 3, 'y'); setc(sx + 1, cy0 - 1, 'y'); setc(sx - 1, cy0 - 1, 'y');
    }
    if (hh === 'bald') setc(hx - hrx * 0.2, hy - hry * 0.75, 'h');
    if (hh === 'warhelm') { // v0.91 크루가쉬: 금 테를 두른 철 투구 + 크게 휜 뿔 두 개 + 이마 해골 + 투구 아래로 빛나는 눈
      const horn = (x0, y0, x1, y1, x2, y2, r0) => { const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, u = 1 - t; pts.push([u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2, t]); }
        for (const [x, y, t] of pts) { const rr = r0 * (1 - t * 0.75); for (let yy = Math.floor(y - rr); yy <= Math.ceil(y + rr); yy++) for (let xx = Math.floor(x - rr); xx <= Math.ceil(x + rr); xx++) if (Math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= rr + 0.2) setc(xx, yy, t > 0.85 ? 'B' : t > 0.6 ? 'W' : (yy < y ? 'w' : 'W')); } };
      horn(hx - hrx * 0.6, hy - hry * 0.85, hx - hrx * 1.85, hy - hry * 0.75, hx - hrx * 1.55, hy - hry * 2.7, 2.1);
      horn(hx + hrx * 0.45, hy - hry * 0.95, hx + hrx * 2.0, hy - hry * 0.95, hx + hrx * 1.6, hy - hry * 2.65, 2.0);
      paint(ell(hx - hrx * 0.05, hy - hry * 0.8, hrx * 1.02, hry * 0.5), (dx, dy) => dy > 0.4 ? 'y' : dx < -0.3 && dy < -0.1 ? 'n' : dy < 0.05 ? 'm' : 'M', 'k');
      setc(hx - hrx * 0.6, hy - hry * 0.85, 'y'); setc(hx + hrx * 0.45, hy - hry * 0.95, 'y'); // 뿔 밑 금 고리
      setc(hx + hrx * 0.95, hy - hry * 0.35, 'M'); // 코 가리개
      const sx = Math.round(hx + hrx * 0.15), sy = Math.round(hy - hry * 1.0); setc(sx, sy, 'w'); setc(sx + 1, sy, 'w'); setc(sx, sy + 1, 'k'); setc(sx + 1, sy + 1, 'W'); // 이마 해골
      const ex = Math.round(hx + hrx * 0.5), ey = Math.round(hy - hry * 0.12); setc(ex - 1, ey - 1, 'k'); setc(ex, ey - 1, 'k'); setc(ex + 1, ey - 1, 'k'); setc(ex, ey, 'e'); setc(ex + 1, ey, 'E');
    }
    // 망토 어깨 털 (머리 뒤 · 어깨 위)
    if (o.cloak || o.cape) paint(ell(cS - shw * 0.15, shY + 1, shw * 0.95, Math.max(2, H * 0.05)), (dx, dy, x, y) => (x + y) % 3 === 0 ? 'F' : dy < 0 ? 'f' : 'F', 'k');
    if (o.collar) for (let x = Math.round(hx - hrx * 0.9); x <= Math.round(hx + hrx * 0.3); x++) setc(x, shY + 1, x % 2 ? 'm' : 'M');
    if (o.necklace) for (let i = 0; i < 5; i++) setc(hx - hrx * 0.4 + i * hrx * 0.32, shY + 2 + Math.abs(i - 2) * -0.5 + 1, i % 2 ? 'w' : o.necklace === 'skull' ? 'W' : 'w');
    return { g: gOutline(g), W, H, shX: dX, shY: dY };
  }
  // 앞팔 + 무기 (cellWeapon: 어깨가 축, 0°일 때 앞으로 뻗음)
  // 앞팔 + 무기 (cellWeapon: 어깨가 축, 0°일 때 앞으로 뻗음)
  // 위팔(이두근이 불룩) → 팔꿈치에서 꺾인 아래팔 → 둥근 주먹, 무기는 아래팔 방향으로 쥔다 (v0.55)
  function genArm(o) {
    const L = o.len, th = o.th, wl = o.wlen || 0, pal = Object.assign({}, orcPal(o.skin), o.pal || {});
    // 1) 무기를 손 기준 로컬 좌표(앞 = +x)에 그린다
    const WM = new Map(), put = (x, y, c) => WM.set(x + ',' + y, c), k = o.kind, hd = o.head || 4;
    // 무기는 몸보다 크게 (v0.56) — 손(0,0)에서 앞(+x)으로
    if (k === 'axe' || k === 'greataxe') {
      const big = k === 'greataxe', ht = big ? 2 : 1;
      for (let x = -3; x < wl; x++) for (let t = 0; t < ht; t++) put(x, t, (x + t) % 4 === 0 ? 'O' : t ? 'O' : 'o');
      for (let x = 2; x < wl - 4; x += 5) { put(x, -1, 'b'); put(x, ht, 'B'); } // 손잡이 감은 가죽
      const bw = Math.max(4, Math.round(hd * (big ? 0.75 : 0.7))), bx0 = wl - bw - (big ? 1 : 0);
      const blade = (sgn, h) => { for (let x = bx0; x < bx0 + bw; x++) { const t = (x - bx0) / (bw - 1), hh = Math.round(h * (0.35 + 0.65 * Math.sin(t * Math.PI * 0.5 + 0.2))); for (let y = 1; y <= hh; y++) { const yy = sgn < 0 ? -y : ht - 1 + y; const de = bx0 + bw - 1 - x; put(x, yy, de === 0 ? 'n' : de === 1 ? 'm' : y === hh ? 'm' : y === 1 ? 'k' : 'M'); } } };
      blade(-1, hd); blade(1, big ? hd : Math.round(hd * 0.45)); // 위 날 + 아래 수염 (대도끼는 양날)
      if (!big) { put(bx0 - 1, -1, 'M'); put(bx0 - 2, -2, 'm'); } // 뒤 가시
      put(wl, 0, 'm'); put(wl + 1, 0, 'n'); if (big) { put(wl, 1, 'm'); put(wl + 2, 0, 'n'); put(wl + 1, 1, 'n'); for (let y = 0; y < 5; y++) put(1 + (y % 2), ht + 1 + y, y < 2 ? 'r' : 'R'); }
    } else if (k === 'warAxe') { // 크루가쉬의 핏빛 대도끼 (v0.84): 초승달 양날, 톱니 날끝, 금 해골 장식, 타오르는 룬, 위 찌르기 가시, 뼈 물미, 사슬 해골, 흘러내리는 피
      const ht = 2, H = hd, hx = wl - 5, wmax = 7;
      for (let x = -3; x < wl; x++) for (let t = 0; t < ht; t++) put(x, t, x < 7 ? ((x + t) % 2 ? 'r' : 'R') : (x + t) % 4 === 0 ? 'O' : t ? 'O' : 'o');
      for (const gx of [7, 15, 23]) if (gx < hx - 3) { put(gx, -1, 'q'); put(gx, 0, 'y'); put(gx, 1, 'q'); put(gx, 2, 'q'); }
      for (let i = 0; i < 4; i++) { put(-4 - i, 0, i < 3 ? 'w' : 'W'); if (i < 2) put(-4 - i, 1, 'W'); } // 뼈 물미
      for (const sgn of [-1, 1]) {
        const maxd = x => H - 2.4 * Math.pow((x - hx) / wmax, 2), Y = d => sgn < 0 ? -d : ht - 1 + d;
        for (let x = hx - wmax - 1; x <= hx + wmax + 1; x++) for (let d = 1; d <= H; d++) {
          const wn = 1.5 + (wmax - 1.5) * Math.pow(Math.min(1, d / (H * 0.72)), 1.3), md = maxd(x);
          const horn = Math.abs(x - hx) === wmax + 1 && d >= md - 3 && d <= md - 0.5; // 날 양끝이 뒤로 말린 뿔
          if (!horn && (Math.abs(x - hx) > wn || d > md)) continue;
          const edge = d > md - 1.2 || horn && d > md - 1.5;
          let c = edge ? 'E' : d <= 1 ? 'Z' : x < hx - 1 ? 'A' : x > hx + 2 ? 'R' : 'r';
          if (edge && d > 4 && (x + 40) % 3 === 0) c = 'R'; // 톱니: 날끝이 이빨처럼 끊김
          put(x, Y(d), c);
        }
        const rd = Math.round(H * 0.42); for (const [dx, dd] of [[-2, 0], [0, 0], [2, 0], [-1, 1], [1, -1]]) put(hx + dx, Y(rd + dd), 'c'); // 타오르는 룬
      }
      for (let x = hx - 2; x <= hx + 1; x++) for (let y = -2; y <= ht + 1; y++) put(x, y, (y === -2 || y === ht + 1) ? 'q' : x === hx - 2 ? 'y' : 'q'); // 금 해골 받침
      put(hx - 1, -1, 'w'); put(hx, -1, 'w'); put(hx - 1, 0, 'e'); put(hx, 1, 'e'); put(hx - 1, 2, 'w'); put(hx, 2, 'W');
      for (let i = 0; i < 6; i++) { put(wl + i, 0, i < 5 ? 'n' : 'm'); if (i < 3) put(wl + i, 1, 'm'); } // 위 찌르기 가시
      for (let i = 0; i < 4; i++) put(hx - 4, ht + 1 + i, i % 2 ? 'M' : 'm'); put(hx - 5, ht + 5, 'w'); put(hx - 4, ht + 5, 'w'); put(hx - 5, ht + 6, 'W'); put(hx - 4, ht + 6, 'k'); // 사슬 해골
      for (const [x, L] of [[hx - 3, 2], [hx + 2, 3]]) for (let i = 0; i < L; i++) put(x, ht - 1 + Math.floor(H - 2.4 * Math.pow((x - hx) / wmax, 2)) + 1 + i, i < L - 1 ? 'R' : 'r'); // 날끝에 맺혀 흘러내리는 피
    } else if (k === 'spear') {
      for (let x = -5; x < wl; x++) put(x, 0, x % 6 === 0 ? 'O' : 'o');
      for (let i = 0; i < 6; i++) { const w2 = i < 2 ? i + 1 : i < 4 ? 2 : 1; for (let y = -w2 + 1; y <= w2 - 1; y++) put(wl + i, y, y === 0 ? 'n' : y < 0 ? 'm' : 'M'); }
      put(wl - 1, -1, 'r'); put(wl - 1, 1, 'r'); put(wl - 2, 2, 'R'); put(wl - 3, 3, 'q');
    } else if (k === 'staff') {
      for (let x = -4; x < wl; x++) put(x, (x % 7 === 3 ? 1 : 0), x % 5 === 0 ? 'O' : 'o');
      const sx = wl; // 짐승 두개골(길쭉한 주둥이) + 휜 뿔 두 개 + 붉은 보석 + 깃털
      for (let x = 0; x <= 2; x++) for (let y = -2; y <= 2; y++) put(sx + x, y, y === -2 ? 'w' : y === 2 ? 'W' : 'w');
      for (let x = 3; x <= 5; x++) for (let y = -1; y <= 1; y++) put(sx + x, y, y === 1 ? 'W' : 'w');
      put(sx + 1, -1, 'k'); put(sx + 1, 1, 'k'); put(sx + 4, 0, 'k'); put(sx + 6, 0, 'W'); put(sx + 6, -1, 'w');
      for (const sg of [-1, 1]) { put(sx, sg * 3, 'W'); put(sx - 1, sg * 4, 'W'); put(sx - 1, sg * 5, 'w'); put(sx, sg * 6, 'w'); }
      put(sx - 1, 0, 'r'); put(sx - 2, 1, 'q'); put(sx - 3, 2, 'q'); put(sx - 3, 3, 'r');
    } else if (k === 'club') {
      for (let x = -2; x < wl; x++) { const t = (x + 2) / (wl + 2), r = Math.max(0, Math.round(t * t * hd)); for (let y = -r; y <= Math.max(0, r - 1); y++) put(x, y, y === -r ? 'o' : y >= r - 1 && r > 1 ? 'O' : (x + y) % 4 ? 'o' : 'O'); if (r >= 2 && x % 3 === 0) { put(x, -r - 1, 'n'); put(x, r, 'n'); } }
      put(wl, 0, 'n'); put(wl, -1, 'm');
    } else if (k === 'stick') {
      for (let x = -1; x < wl; x++) put(x, 0, x % 3 === 0 ? 'W' : 'w');
      for (let y = -2; y <= 2; y++) for (let x = 0; x < 3; x++) if (Math.abs(y) + Math.abs(x - 1) <= 2) put(wl + x, y, y < 0 ? 'w' : 'W');
      for (let y = -1; y <= 1; y++) put(-2, y, 'W');
    } else if (k === 'gauntlet') {
      const g2 = Math.max(th + 1, hd);
      const cx2 = -g2 / 2 + 1.5, rx2 = g2 / 2 + 1.2, ry2 = g2 / 2 + 0.3;
      for (let x = -g2; x <= 3; x++) for (let y = -Math.ceil(ry2); y <= Math.ceil(ry2); y++) { const dx = (x - cx2) / rx2, dy = y / ry2; if (dx * dx + dy * dy <= 1) put(x, y, dy < -0.55 ? 'n' : dy < 0 ? 'm' : dy < 0.6 ? 'M' : 'k'); }
      for (let x = Math.round(cx2 - rx2 * 0.6); x <= Math.round(cx2 + rx2 * 0.6); x += 2) put(x, Math.round(ry2 * 0.15), 'k'); // 손가락 마디
      const sp2 = [-Math.round(ry2 * 0.5), 0, Math.round(ry2 * 0.5)]; for (const y of sp2) { put(Math.round(cx2 + rx2) + 1, y, 'n'); put(Math.round(cx2 + rx2) + 2, y, 'n'); } // 주먹 가시
    } else if (k === 'claw') {
      for (let i = -1; i <= 1; i++) for (let t = 0; t < 4; t++) put(1 + t, i * 2 + (t > 1 ? (i > 0 ? 1 : 0) : 0), t === 3 ? 'W' : 'w');
    }
    // 2) 팔 뼈대: 어깨 → 팔꿈치 → 손
    const bend = -(o.bend == null ? 30 : o.bend) * DEG, L1 = Math.max(2, Math.round(L * 0.55)), L2 = Math.max(2, L - L1 + 1);
    const E = { x: L1, y: 0 }, ux = Math.cos(bend), uy = Math.sin(bend), Hh = { x: E.x + ux * L2, y: E.y + uy * L2 };
    const r1 = Math.max(1, (th + 1) / 2), r2 = Math.max(0.8, th / 2), fist = o.kind !== 'gauntlet' && o.kind !== 'claw';
    const cells = new Map(), shade = v => v < -0.45 ? 'h' : v < 0.1 ? 'l' : v < 0.6 ? 'd' : 'D';
    const segD = (px, py2, ax, ay, bx, by) => { const vx = bx - ax, vy = by - ay, L0 = vx * vx + vy * vy || 1, t = clamp(((px - ax) * vx + (py2 - ay) * vy) / L0, 0, 1), cx = ax + vx * t, cy = ay + vy * t; return { d: Math.hypot(px - cx, py2 - cy), t, s: (-(px - ax) * vy + (py2 - ay) * vx) / Math.sqrt(L0) }; };
    const R = L + wl + 14;
    for (let y = -R; y <= R; y++) for (let x = o.wdir == null ? -3 : -R; x <= R; x++) {
      // 무기 (손에서 아래팔 방향으로)
      const wx = o.wdir == null ? ux : Math.cos(o.wdir * DEG), wy = o.wdir == null ? uy : Math.sin(o.wdir * DEG), dx = x - Hh.x, dy = y - Hh.y, lx = Math.round(dx * wx + dy * wy), ly = Math.round(-dx * wy + dy * wx), wc = WM.get(lx + ',' + ly);
      const a1 = segD(x, y, 0, 0, E.x, E.y), rr1 = r1 * (1 + 0.3 * Math.sin(Math.PI * a1.t));
      const a2 = segD(x, y, E.x, E.y, Hh.x, Hh.y);
      let c = null;
      if (a1.d <= rr1) c = shade(a1.s / rr1);
      if (a2.d <= r2 + 0.15) c = o.bracer && a2.t > 0.25 && a2.t < 0.8 ? (a2.t < 0.33 || a2.t > 0.72 ? 'y' : a2.s < -0.2 ? 'n' : a2.s < 0.4 ? 'm' : 'M') : shade(a2.s / (r2 + 0.15));
      if (wc) c = wc;
      if (fist && Math.hypot(x - Hh.x, y - Hh.y) <= Math.max(1.1, th * 0.62)) c = (y - Hh.y) < -0.3 ? 'h' : (y - Hh.y) < 0.5 ? 'l' : 'd';
      if (c) cells.set(x + ',' + y, c);
    }
    let mx = 1e9, my = 1e9, Mx = -1e9, My = -1e9;
    for (const k of cells.keys()) { const [x, y] = k.split(',').map(Number); mx = Math.min(mx, x); my = Math.min(my, y); Mx = Math.max(Mx, x); My = Math.max(My, y); }
    const px0 = 1 - mx, py0 = 1 - my;
    return cellWeapon(Mx - mx + 3, My - my + 3, px0, py0, pal, put2 => { for (const [k, c] of cells) { const [x, y] = k.split(',').map(Number); put2(x + px0, y + py0, c); } });
  }
  // 늑대 (네 발, 2프레임)
  function genWolf(frame) {
    const W = 26, H = 15, g = mkGrid(W, H), set = (x, y, c) => { if (y >= 1 && y < H - 1 && x >= 1 && x < W - 1) g[y][x] = c; };
    const ell = (cx, cy, rx, ry, b) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) { const v = dx * 0.6 + dy + b; set(x, y, v < -0.55 ? 'h' : v < 0 ? 'l' : v < 0.55 ? 'd' : 'D'); } } };
    const legs = frame ? [[7, 1], [9, -1], [15, -1], [17, 1]] : [[7, -1], [9, 1], [15, 1], [17, -1]];
    for (const [lx, off] of legs.slice(0, 2)) for (let y = 8; y <= 13; y++) set(lx + (y > 10 ? off : 0), y, 'D');
    for (let t = 0; t < 5; t++) set(5 - t, 6 - Math.round(t * 0.6) + (frame ? 0 : 1), t > 3 ? 'h' : 'd'); // 꼬리
    ell(11, 7, 7.5, 3.4, 0); ell(16, 6.6, 4.4, 4, -0.1);
    for (const [lx, off] of legs.slice(2)) for (let y = 9; y <= 13; y++) set(lx + (y > 10 ? off : 0), y, y === 13 ? 'D' : 'd');
    ell(20.5, 5, 3, 2.6, -0.2);
    for (let x = 22; x <= 24; x++) { set(x, 5, 'l'); set(x, 6, x === 24 ? 'k' : 'd'); }
    set(23, 7, 'w'); set(21, 7, 'w'); set(21, 4, 'e'); set(19, 2, 'l'); set(19, 1, 'd'); set(18, 2, 'd');
    for (let x = 9; x <= 15; x += 2) set(x, 3, 'H');
    return gOutline(g);
  }
  const WOLF_PAL = { k: '#0b0a0e', h: '#6a6470', l: '#4a4652', d: '#2e2a34', D: '#1c1a22', e: '#ff3a20', w: '#ece0c4', H: '#14121a' };
  PAL.wolfd = { k: '#0a080c', d: '#4a4652', D: '#26232c', l: '#6e6a78', L: '#8e8a98', t: '#e0d8c0', c: '#5a3a22', m: '#b4b8c0', e: '#ff3a20' };
  PAL.slave = { k: '#0e100c', s: '#7e8a6c', S: '#525c46', c: '#5a5048', C: '#3a342e', e: '#ff7a3a' };

  // 종류별 설정: 몸통·팔·무기·크기 (W·H 칸, 칸 하나 = 2px)
  const ORC_SPEC = {
    // 캐릭터 도트와 같은 비율 (v0.57): 머리가 키의 40% 안팎, 짧은 몸통과 다리, 적은 칸 수. 기사 12×14칸 · 고블린 14×14칸이 기준
    // 오크 전사: 표준 체격, 모히칸, 가죽 어깨받이, 해골 버클, 큰 도끼
    orc: { body: { W: 18, H: 19, sh: 0.27, wa: 0.2, tor: 0.24, leg: 0.2, head: 2.2, hfwd: 0.15, hair: 'mohawk', pauld: 'hide', buckle: 'skull', backArm: true, thigh: 0.14 }, skin: 'green', arm: { len: 5, th: 2, kind: 'axe', wlen: 12, head: 7, bend: 28 }, tall: 38, rest: 70 },
    // 투척꾼: 홀쭉하고 다리가 조금 긴 사냥꾼, 머리띠와 깃털, 흰 칠, 등에 투창
    othrow: { body: { W: 16, H: 20, sh: 0.23, wa: 0.17, tor: 0.23, leg: 0.24, head: 2.1, hfwd: 0.15, hair: 'band', quiver: true, earring: true, paint: 'white', backArm: true, thigh: 0.13 }, skin: 'moss', arm: { len: 5, th: 2, kind: 'spear', wlen: 18, bend: 18 }, carry: { bend: 135, wdir: 132, ang: 48, front: true }, tall: 40, rest: -150 },
    // 주술사: 늙고 구부정, 짐승 두개골 머리장식, 털 망토, 흰 칠
    shaman: { body: { W: 17, H: 19, sh: 0.22, wa: 0.2, tor: 0.25, leg: 0.19, lean: 0.15, head: 2.1, hfwd: 0.2, hair: 'skull', cloak: true, paint: 'white', kilt: 'fur', backArm: true, tusk: 0, thigh: 0.13 }, skin: 'ash', arm: { len: 5, th: 2, kind: 'staff', wlen: 14, bend: 40 }, tall: 38, rest: -60 },
    // 돌격대장: 땅딸막하고 넓적, 뿔 달린 쇠투구, 가슴 쇠판
    ocharge: { body: { W: 22, H: 22, sh: 0.31, wa: 0.25, tor: 0.25, leg: 0.18, head: 2.1, hfwd: 0.15, hair: 'hornhelm', plate: true, pauld: 'metal', kilt: 'skirt', backArm: true, tusk: 2, thigh: 0.15 }, skin: 'dark', arm: { len: 6, th: 3, kind: 'club', wlen: 14, head: 5, bend: 28 }, carry: { bend: 135, wdir: 135, ang: 45, front: true }, tall: 44, rest: -178, semi: '돌격대장' },
    // 북잡이: 배불뚝이, 땋은 머리, 배에 북
    odrum: { body: { W: 22, H: 21, sh: 0.28, wa: 0.24, belly: 1, tor: 0.27, leg: 0.17, head: 2.0, hfwd: 0.15, hair: 'braid', earring: true, kilt: 'fur', backArm: true, tusk: 2, thigh: 0.15 }, skin: 'olive', arm: { len: 5, th: 2, kind: 'stick', wlen: 8, bend: 42 }, tall: 42, rest: 45, semi: '북잡이' },
    // 거구 오크: 가장 큰 근육질, 대머리, 사슬 목줄, 찢어진 눈 흉터, 굵은 팔
    ogrip: { body: { W: 24, H: 24, sh: 0.32, wa: 0.21, tor: 0.27, leg: 0.19, delt: 1.3, head: 1.9, hfwd: 0.15, hair: 'bald', collar: true, scarEye: true, backArm: true, armW: 0.13, tusk: 2, thigh: 0.15 }, skin: 'red', arm: { len: 7, th: 4, kind: 'gauntlet', head: 7, bend: 22 }, tall: 48, rest: 80, semi: '거구 오크' },
    // 우르그: 투기장 챔피언, 상투, 뼈 어깨받이, 금 버클, 붉은 허리천
    urg: { body: { W: 28, H: 30, sh: 0.32, wa: 0.2, tor: 0.27, leg: 0.2, delt: 1.3, head: 1.9, hfwd: 0.15, hair: 'topknot', pauld: 'bone', necklace: true, buckle: 'gold', kilt: 'red', scars: true, paint: 'red', backArm: true, armW: 0.12, tusk: 2, thigh: 0.15 }, skin: 'scar', arm: { len: 9, th: 5, kind: 'gauntlet', head: 9, bend: 30 }, tall: 60, rest: 80, elite: true },
    // 트롤: 짐승이라 구부정 (긴 팔을 땅에 끌고 다님)
    troll: { body: { W: 32, H: 27, sh: 0.32, wa: 0.25, tor: 0.32, leg: 0.18, lean: 0.5, hunch: 0.8, head: 1.6, hfwd: 0.5, hair: 'mohawk', kilt: 'fur', backArm: 'long', armW: 0.12, tusk: 0, thigh: 0.15 }, skin: 'troll', pal: { e: '#ffe060' }, arm: { len: 14, th: 5, kind: 'claw', bend: 26 }, tall: 54, rest: 85, elite: true },
    otroll: { body: { W: 24, H: 22, sh: 0.32, wa: 0.25, tor: 0.32, leg: 0.18, lean: 0.4, hunch: 0.7, head: 1.7, hfwd: 0.45, hair: 'mohawk', kilt: 'fur', backArm: 'long', armW: 0.12, tusk: 0, thigh: 0.15 }, skin: 'cave', pal: { e: '#ff9a30' }, arm: { len: 11, th: 4, kind: 'claw', bend: 26 }, tall: 46, rest: 85, semi: '동굴 트롤' },
    // 크루가쉬: 거인 왕, 털 망토, 엄니 왕관, 쇠 어깨받이, 붉은 전투 칠
    // v0.91 재디자인: 흑녹색 블랙 오크 · 뿔 달린 철 투구 · 가시 어깨갑옷 · 붉은 전투 망토 · 해골 가슴끈 · 금 해골 버클 · 쇠 판금 · 정강이·팔 보호대 · 눈을 가로지른 붉은 칠
    krugash: { body: { W: 36, H: 38, padTop: 7, sh: 0.33, wa: 0.23, tor: 0.27, leg: 0.19, belly: 0.25, delt: 1.25, head: 1.9, hfwd: 0.15, hair: 'warhelm', cape: true, pauld: 'spiked', strap: true, chestPaint: true, warpaint: true, scars: true, buckle: 'skull3', kilt: 'fur', tassets: true, greaves: true, backArm: true, tusk: 3, thigh: 0.16 }, skin: 'boss', pal: { e: '#ff3a20', A: '#d83a2c', Z: '#2a0604', E: '#ffe8a0' }, arm: { len: 11, th: 5, kind: 'warAxe', wlen: 30, head: 16, bend: 24, bracer: true }, carry: { bend: 110, wdir: 170, ang: 70 }, tall: 88, rest: -120, boss: true },
  };


  const ORC_T = { orc: 1, othrow: 1, wolf: 1, shaman: 1, slave: 1, ocharge: 1, odrum: 1, otroll: 1, ogrip: 1, urg: 1, troll: 1 };
  const orcArt = {};
  function orcSprite(kind, v) {
    const key = v == null ? kind : kind + '#' + v;
    if (orcArt[key]) return orcArt[key];
    const S = ORC_SPEC[kind], skin = v == null ? S.skin : 'v' + v, pal = orcPal(skin, S.pal);
    const b = withSeed(kind.length * 977, () => genOrcBody(S.body));
    const cv = gCanvas(b.g, pal), wh = art('orcW_' + kind, () => gCanvas(b.g.map(r => r.map(c => c === '.' ? '.' : 'x')), { x: '#ffffff' }));
    return (orcArt[key] = { cv, wh, w: cv.width, h: cv.height, sx: (b.shX + 0.5) * 2 - cv.width / 2, sy: (b.shY + 0.5) * 2 - cv.height + 2, arm: genArm(Object.assign({ skin, pal: S.pal }, S.arm)), carry: S.carry ? genArm(Object.assign({ skin, pal: S.pal }, S.arm, S.carry)) : null });
  }
  function orcSetup(e, kind) {
    const S = ORC_SPEC[kind]; if (!S) return;
    e.orc = kind; e.tall = S.tall; e.aa = S.rest * DEG; e.aaT = e.aa; e.asw = null; e.steps = null;
    e.ov = ORC_VAR_T[kind] ? randi(0, 3) : undefined; // 보스·엘리트는 고유 색
    if (S.semi) e.semiName = S.semi;
  }
  function orcInit(e) {
    if (e.type === 'wolf') { e.orc = 'wolf'; e.tall = 30; e.flank = rand(0, TAU); }
    else if (e.type === 'slave') { e.orc = 'slave'; e.tall = 30; }
    else if (ORC_SPEC[e.type]) orcSetup(e, e.type);
  }
  // ---------- 오크 공통: 순서 공격(seq) · 팔 애니메이션 · 돌진
  // steps = [[기다림(초), 할 일], ...] — 할 일이 'stop'을 돌려주면 바로 끝낸다
  function oSeq(e, steps, rec, cd) { e.state = 'seq'; e.steps = steps.slice(); e.stepT = steps[0][0]; e.seqRec = rec; e.seqCd = cd; }
  function runSeq(e, dt) {
    if (!e.steps) { if (e.state === 'seq') endSeq(e); return; }
    e.stepT -= dt;
    while (e.steps && e.stepT <= 0) {
      const st = e.steps.shift(), r = st[1] ? st[1]() : null;
      if (r === 'stop' || !e.steps) { e.steps = null; if (e.state === 'seq') endSeq(e); return; }
      if (!e.steps.length) { e.steps = null; endSeq(e); return; }
      e.stepT += e.steps[0][0];
    }
  }
  function endSeq(e) { if (e.state !== 'seq') return; e.state = 'recover'; e.t = e.seqRec == null ? 0.5 : e.seqRec; e.cd = e.seqCd != null ? e.seqCd : rand(1, 1.6); }
  const armTo = (e, deg) => { e.aaT = deg * DEG; e.asw = null; };
  const oSwing = (e, deg, dur) => { e.asw = { from: e.aa, to: deg * DEG, t: 0, dur }; };
  // 타격 프레임용 휘두르기 (v0.89): 판정·충격 이펙트가 나는 바로 그 프레임에 무기가 이미 70% 내려와 있게 — 히트스톱 동안 무기가 머리 위에 멈춰 엇박으로 보이던 문제
  const oSlam = (e, deg, dur) => { const to = deg * DEG, f = e.aa + (to - e.aa) * 0.7; e.aa = f; e.asw = { from: f, to, t: 0, dur: dur * 0.5 }; };
  // 오크 공격 전조 (v0.89): 바닥 경고. 공격이 끊기면(기절·잡기 성공·사망) 같이 사라지고(oa), 실제 판정은 이 경고의 각도를 그대로 쓴다
  function oTele(e, o) { const t = Object.assign({ x: e.x, y: e.y, t: 0, owner: e, oa: true, ff: false }, o); G.tele.push(t); return t; }
  const oCt = (e, ang, r, arcDeg, dur, o) => oTele(e, Object.assign({ shape: 'cone', ang, r, arc: arcDeg * DEG, dur }, o));
  const oLt = (e, ang, len, w, dur, o) => oTele(e, Object.assign({ shape: 'line', ang, len, w, dur }, o));
  const oRt = (e, x, y, r, dur, o) => oTele(e, Object.assign({ shape: 'circle', x, y, r, dur }, o));
  const tAng = (t, fb) => (t && t.ang != null ? t.ang : fb);
  const faceTo = (e, a) => { e.face = Math.cos(a) > 0 ? 1 : -1; };
  const orcSm = e => (e.drumT > 0 ? 1.15 : 1) * (e.buffT > 0 ? 1.15 : 1) * (e.frenzyT > 0 ? 1.3 : 1);
  function glowFor(e, t) { e.glowT = t; e.glowMax = t; }
  function oCone(e, ang, reach, arcDeg, dmg, o = {}) {
    const S = ORC_SPEC[e.orc], hy = e.y - (e.tall || 30) * 0.3;
    hitShape({ shape: 'cone', x: e.x, y: e.y, ang, arc: arcDeg * DEG, r: reach, owner: e }, dmg * (e.buffT > 0 || e.drumT > 0 ? 1.15 : 1));
    if (isKrug(e)) { krugHitShape({ shape: 'cone', x: e.x, y: e.y, ang, arc: arcDeg * DEG, r: reach }, dmg, e); G.fx.push({ kind: 'claw', brute: true, seed: Math.random() * 999, x: e.x + Math.cos(ang) * 6, y: e.y - (e.tall || 30) * 0.3, ang, arc: Math.min(2.6, arcDeg * DEG), r: reach * 0.95, w: 8, c: '255,170,90', t: 0.4, max: 0.4 }); }
    G.fx.push({ kind: 'claw', brute: true, seed: Math.random() * 999, x: e.x + Math.cos(ang) * 6, y: hy, ang, arc: Math.min(2.4, arcDeg * DEG * 0.9), r: reach * 0.8, w: o.w || (reach > 60 ? 4 : 2), c: o.c || '255,215,170', t: 0.32, max: 0.32 });
    dust(e.x + Math.cos(ang) * reach * 0.6, e.y + Math.sin(ang) * reach * 0.4, o.dust || 4);
    e.lean = 0.3 * e.face; e.x += Math.cos(ang) * (o.step || 6); e.y += Math.sin(ang) * (o.step || 6);
    sfx(reach > 70 ? 'heavy' : 'swing', reach > 70 ? 0.75 : 1.1);
  }
  // 크루가쉬의 공격은 자기편 오크도 휩쓴다 (v0.73) — 같은 오크는 0.3초에 한 번만
  const isKrug = o => o && o.type === 'boss' && o.kind === 'krugash';
  function krugHitAlly(e, raw, b) {
    if (!e || e.dead || e === b || e.type === 'boss' || (e.ffT || 0) > time) return;
    e.ffT = time + 0.3; const dmg = Math.round(raw * 2.2); e.hp -= dmg; e.flash = 0.12; e.hitT = time;
    const a = Math.atan2(e.y - b.y, e.x - b.x); e.vx = (e.vx || 0) + Math.cos(a) * 280; e.vy = (e.vy || 0) + Math.sin(a) * 280; e.lean = 0.5 * (Math.cos(a) > 0 ? 1 : -1);
    G.nums.push({ x: e.x + rand(-4, 4), y: e.y - (e.tall || 24), v: String(dmg), t: 0.7, c: '#ff8a5a', s: 2, pop: 0.12, vx: Math.cos(a) * 30, vy: -40 });
    burst(e.x, e.y - 10, bloodOf(e), 10, a);
    if (e.hp <= 0) { e.ffKill = true; killEnemy(e); }
  }
  function krugHitShape(t, raw, b) { for (const e of G.enemies) if (!e.dead && e !== b && inShape(t, e.x, e.y, e.r || 8)) krugHitAlly(e, raw, b); }
  // 크루가쉬 전용 강타 이펙트: 섬광 · 이중 충격 고리 · 화염 폭발 · 흙기둥 · 날아가는 돌 조각 · 짧은 경직
  function krugImpact(x, y, power = 1, c = '255,120,50') {
    hitstop = Math.max(hitstop, 0.05 * power); addShake(6 + 4 * power); flashT = Math.max(flashT, 0.05 * power); flashColor = '#ff8a40';
    G.fx.push({ kind: 'boom', x, y: y - 4, r: 34 * power, t: 0.32, max: 0.32 });
    G.fx.push({ kind: 'ring', x, y, r: 8, t: 0.4, max: 0.4, c: '#ffd0a0', grow: 260 * power });
    G.fx.push({ kind: 'ring', x, y, r: 4, t: 0.55, max: 0.55, c: '#ff5030', grow: 380 * power });
    for (let i = 0; i < 14 * power; i++) { const a = rand(0, TAU), sp = rand(80, 240) * power; G.parts.push({ x: x + rand(-6, 6), y: y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - rand(80, 180), t: rand(0.5, 0.9), c: pick(['#5a4030', '#7a5a40', '#3a2a20', '#a08060']), g: 520, floor: y + rand(-6, 12) }); }
    for (let i = 0; i < 10 * power; i++) { const a = rand(0, TAU), sp = rand(40, 160); G.parts.push({ x, y: y - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - 40, t: rand(0.25, 0.5), c: pick(['#ffd070', '#ff8040', '#ffffff']), g: 0, glow: true }); }
    dust(x, y, 16 * power); debris(x, y, 18 * power);
  }
  function oCircle(e, r, dmg, c) {
    hitShape({ shape: 'circle', x: e.x, y: e.y, r, owner: e }, dmg);
    if (isKrug(e)) krugHitShape({ shape: 'circle', x: e.x, y: e.y, r }, dmg, e);
    G.fx.push({ kind: 'ring', x: e.x, y: e.y - 6, r: 6, t: 0.25, max: 0.25, c: c || '#ffd8a0', grow: r * 3.5 });
  }
  // 바닥을 따라 퍼지는 충격파 고리 (점멸로 넘는다)
  function addShock(owner, x, y, max, sp, dmg, c) { if (!G.shocks) G.shocks = []; G.shocks.push({ owner, x, y, r: 6, max, sp, dmg, hit: false, c: c || '255,210,150' }); addShake(Math.min(9, 3 + max / 30)); dust(x, y, 10); }
  function orcTick(e, dt) {
    if (!e.intro) { e.intro = true; if (e.semiName) { alertMark(e, e.tall + 8, true); sfx('roar', 1.25); } }
    if (e.asw) { e.asw.t += dt; const k = Math.min(1, e.asw.t / e.asw.dur); e.aa = e.asw.from + (e.asw.to - e.asw.from) * easeOut(k); if (k >= 1) { e.aaT = e.asw.to; e.asw = null; } }
    else { const S = ORC_SPEC[e.orc]; if ((e.state === 'chase' || e.state === 'idle') && S) e.aaT = (S.rest + (S.carry ? 0 : Math.sin(e.walk * 0.5) * 6)) * DEG; e.aa += (e.aaT - e.aa) * Math.min(1, dt * 12); }
    if (e.air && e.type !== 'boss') airTick(e, dt);
    { const S = ORC_SPEC[e.orc]; if (S && S.elite && e.state === 'chase') { const st = Math.floor(e.walk / 3); if (st !== e.lastStep) { e.lastStep = st; if (dist(e, G.player) < 420) { addShake(0.8); sfx('step', 0.5); } } } if (S && S.elite && !e.introBig) { e.introBig = true; eliteIntro(e); } }
    for (const k of ['buffT', 'drumT', 'frenzyT', 'glowT', 'wardT', 'up', 'crouch']) if (e[k] > 0) e[k] -= dt;
    if (e.wardT <= 0) e.ward = 0;
    if (e.state !== 'seq' && e.steps) e.steps = null;
    if (e.state !== 'seq') e.carryHold = false;
    if (e.chantHp != null && e.state === 'seq' && e.hp < e.chantHp - 0.5) { e.steps = null; e.state = 'recover'; e.t = 0.6; e.chantHp = null; burst(e.x, e.y - 30, '#8a8a8a', 8); sfx('block'); }
    if (e.cd2 != null) e.cd2 -= dt;
    // 트롤 재생: 3초 동안 맞지 않으면 초당 HP 2% (화상·중독 중에는 멈춤)
    if ((e.type === 'troll' || e.type === 'otroll') && !e.dead && e.hp < e.maxHp && time - (e.hitT || 0) > 3 && !(e.burnT > 0)) {
      e.hp = Math.min(e.maxHp, e.hp + e.maxHp * (e.type === 'otroll' ? 0.012 : 0.02) * (e.enraged ? 2 : 1) * dt);
      if (Math.random() < dt * 10) G.parts.push({ x: e.x + rand(-14, 14), y: e.y - rand(20, 50), vx: 0, vy: -26, t: 0.6, c: pick(['#7ad050', '#b8f080']), g: 0, glow: true });
    }
    // 돌진 (부딪히면 멈춘다)
    if (e.dash) {
      const D = e.dash, P = G.player; D.t -= dt;
      const ox = e.x, oy = e.y; e.x += Math.cos(D.ang) * D.sp * dt; e.y += Math.sin(D.ang) * D.sp * dt;
      const out = e.x < A.x0 + e.r || e.x > A.x1 - e.r || e.y < A.y0 + e.r || e.y > A.y1 - e.r;
      e.x = clamp(e.x, A.x0 + e.r, A.x1 - e.r); e.y = clamp(e.y, A.y0 + e.r, A.y1 - e.r);
      const wall = solveObs(e, e.r) || out;
      if (Math.random() < 0.6) dust(e.x, e.y, 1);
      if (D.ghost) G.fx.push({ kind: 'ghost', x: ox, y: oy, face: e.face, rot: 0.15 * e.face, t: 0.18, max: 0.18, orc: e.orc });
      if (D.plow) for (const o of G.enemies) if (o !== e && !o.dead && o.type !== 'boss' && !isElite(o) && Math.hypot(o.x - e.x, o.y - e.y) < e.r + o.r + 2) { o.vx += Math.cos(D.ang) * 260; o.vy += Math.sin(D.ang) * 260; o.lean = 0.5 * e.face; if (isKrug(e)) krugHitAlly(o, e.atk, e); }
      if (!D.done && !P.dead && Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r + 4) {
        D.done = true;
        if (D.grab) {
          if (P.iframe > 0) { if (P.state === 'dodge' && P.dodgeT < 0.16 && !P.perfectUsed) perfectDodge(); }
          else if (!P.grab && P.inv <= 0) { e.dash = null; startGrab(e, D.grab); return; }
        } else if (D.dmg) { const hp0 = P.hp; hurtPlayer(D.dmg, e); if (P.hp < hp0 && D.kb) { P.kx = Math.cos(D.ang) * D.kb; P.ky = Math.sin(D.ang) * D.kb; } if (D.onHit) D.onHit(); }
      }
      if (wall && D.onWall) { e.dash = null; D.onWall(); return; }
      if (D.t <= 0 || (wall && D.stopWall !== false)) e.dash = null;
    }
  }
  // 일반 오크 · 늑대 · 주술사 · 고블린 노예 · 준엘리트
  function updateOrc(e, dt, d, a, moveTo) {
    const P = G.player, sm = orcSm(e);
    if (e.state === 'seq') { runSeq(e, dt); return; }
    if (e.state === 'dazed') { if (e.t <= 0) { e.state = 'chase'; e.vuln = 1; } return; }
    if (e.state === 'grabbing') return;
    if (e.type === 'urg') { updateUrg(e, dt, d, a, moveTo); return; }
    if (e.type === 'troll') { updateTroll(e, dt, d, a, moveTo); return; }
    if (e.state !== 'chase') return;
    const t = e.type;
    if (t === 'orc') {
      if (d > 42) moveTo(a, e.spd * sm);
      else if (e.cd <= 0) {
        faceTo(e, a);
        if (Math.random() < 0.25) oSeq(e, [[0, () => { armTo(e, 30); e.lean = -0.25 * e.face; e.crouch = 0.25; glowFor(e, 0.35); e.tl = oLt(e, a, 70, 22, 0.35, { follow: true }); }], [0.35, () => { e.dash = { ang: tAng(e.tl, angTo(e, P)), sp: 270, t: 0.16, dmg: e.atk * 0.5, kb: 360 }; sfx('whoosh', 1.2); }], [0.25, null]], 0.45);
        else oSeq(e, [[0, () => { e.tl = oCt(e, a, 56, 105, 0.45, { follow: true }); oSwing(e, -115, 0.22); glowFor(e, 0.45); e.lean = -0.2 * e.face; }], [0.45, () => { const q = tAng(e.tl, a); faceTo(e, q); oSlam(e, 70, 0.1); oCone(e, q, 56, 105, e.atk); }], [0.2, null]], 0.5, rand(1.0, 1.6));
      }
    } else if (t === 'othrow') {
      if (d < 120) moveTo(a + Math.PI, e.spd * sm); else if (d > 210) moveTo(a, e.spd * sm); else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.5);
      if (Math.random() < dt * 0.5) e.strafe = -(e.strafe || 1);
      if (e.cd <= 0 && d < 300) {
        e.state = 'wind'; e.lockAng = a; faceTo(e, a); oSwing(e, -165, 0.3);
        G.tele.push({ shape: 'line', x: e.x, y: e.y, ang: a, len: 300, w: 12, t: 0, dur: 0.7, owner: e, thin: true,
          onFire: () => {
            for (const off of (Math.random() < 0.3 ? [-0.18, 0, 0.18] : [0])) G.eproj.push({ x: e.x + Math.cos(e.lockAng + off) * 12, y: e.y + Math.sin(e.lockAng + off) * 10, ang: e.lockAng + off, sp: 330, r: 3, dmg: e.atk * (e.buffT > 0 || e.drumT > 0 ? 1.15 : 1), t: 1.3, hist: [], kind: 'spear' });
            oSwing(e, 25, 0.1); sfx('whoosh', 0.9); e.state = 'recover'; e.t = 0.6; e.cd = rand(2.4, 3.2);
          } });
      }
    } else if (t === 'wolf') {
      e.flank += dt * 0.7 * (e.side || (e.side = Math.random() < 0.5 ? 1 : -1));
      const tx = P.x + Math.cos(e.flank) * 64, ty = P.y + Math.sin(e.flank) * 46, td = Math.hypot(tx - e.x, ty - e.y);
      if (td > 12) moveTo(Math.atan2(ty - e.y, tx - e.x), e.spd * sm * (td > 120 ? 1.15 : 0.8)); else faceTo(e, a);
      if (e.cd <= 0 && d < 120) {
        faceTo(e, a);
        oSeq(e, [[0, () => { e.lockA = angTo(e, P); e.crouch = 0.35; sfx('growl', 1.4); glowFor(e, 0.4); e.tl = oLt(e, e.lockA, 120, 18, 0.4, { follow: true }); }],
          [0.4, () => { e.lockA = tAng(e.tl, angTo(e, P)); faceTo(e, e.lockA); e.dash = { ang: e.lockA, sp: 340, t: 0.32, dmg: e.atk, kb: 160, onHit: () => { for (const o of G.enemies) if (o !== e && o.type === 'wolf' && !o.dead && o.state === 'chase' && Math.hypot(o.x - e.x, o.y - e.y) < 220) o.cd = Math.min(o.cd, 0.3); } }; }],
          [0.35, () => { e.crouch = 0.4; }], [0.35, null]], 0.25, rand(1.6, 2.4));
      }
    } else if (t === 'shaman') {
      if (d < 120) moveTo(a + Math.PI, e.spd * 1.1 * sm); else if (d > 230) moveTo(a, e.spd * sm); else moveTo(a + Math.PI / 2 * (e.strafe || 1), e.spd * 0.4);
      if (Math.random() < dt * 0.4) e.strafe = -(e.strafe || 1);
      if (e.cd2 == null) e.cd2 = rand(1.5, 3);
      const allies = G.enemies.filter(o => o !== e && !o.dead && o.orc && o.type !== 'wolf' && o.type !== 'slave' && o.type !== 'shaman' && !(o.ward > 0) && Math.hypot(o.x - e.x, o.y - e.y) < 150).sort((p, q) => q.maxHp - p.maxHp);
      if (e.cd2 <= 0 && allies.length) {
        faceTo(e, a);
        oSeq(e, [[0, () => { armTo(e, -95); glowFor(e, 0.8); e.chantHp = e.hp; sfx('warn', 0.8); }],
          [0.8, () => { e.chantHp = null; for (const o of allies.slice(0, 2)) if (!o.dead) { o.ward = o.wardMax = o.maxHp * 0.3; o.wardT = 4; G.fx.push({ kind: 'ring', x: o.x, y: o.y - (o.tall || 30) * 0.5, r: 8, t: 0.4, max: 0.4, c: '#ff4040', grow: 120 }); burst(o.x, o.y - 20, '#ff4040', 8); } sfx('heal', 0.7); }]], 0.4);
        e.cd2 = rand(5, 7);
      } else if (e.cd <= 0 && d < 300) {
        faceTo(e, a);
        oSeq(e, [[0, () => { armTo(e, -70); glowFor(e, 0.6); e.tl = oLt(e, a, 160, 10, 0.6, { follow: true, thin: true }); }], [0.6, () => { const S = orcSprite('shaman'), sx = e.x + e.face * S.sx, sy = e.y + S.sy; G.eproj.push({ x: sx + e.face * 16, y: sy + 6, ang: tAng(e.tl, angTo(e, P)), sp: 200, r: 5, dmg: e.atk, t: 2.4, hist: [] }); /* v0.90: 유도 없음 — 전조선 방향으로 곧게 */ sfx('warn'); burst(sx + e.face * 16, sy - 4, '#ff3040', 6); }]], 0.5, rand(2.6, 3.6));
      }
    } else if (t === 'slave') {
      if (d > 20) moveTo(a, e.spd * sm);
      else if (e.cd <= 0) { faceTo(e, a); oSeq(e, [[0, () => { e.up = 0.3; e.holdA = a; e.tl = oCt(e, a, 28, 110, 0.34); }], [0.34, () => { e.up = 0; oCone(e, e.holdA, 26, 110, e.atk, { step: 4, dust: 2 }); }]], 0.35, rand(0.6, 1.0) * (e.frenzyT > 0 ? 0.5 : 1)); }
    } else if (t === 'ocharge') {
      if (d > 44) moveTo(a, e.spd * sm);
      if (e.cd <= 0 && d > 90 && d < 380) {
        faceTo(e, a);
        // v0.90: 준비 동안은 몽둥이를 어깨에 멘 그대로(carryHold), 돌진을 시작하면 좌우로 크게 휘두르며 달림
        const club = k => () => { if (!e.dash) return; const up = k % 2 === 1; oSwing(e, up ? -150 : 75, 0.14); e.lean = (up ? -0.1 : 0.25) * e.face; sfx('swing', 0.9); if (Math.random() < 0.5) dust(e.x + Math.cos(e.lockA) * 20, e.y + Math.sin(e.lockA) * 12, 3); };
        oSeq(e, [[0, () => { alertMark(e, e.tall + 6, true); sfx('roar', 1.1); armTo(e, ORC_SPEC.ocharge.rest); e.carryHold = true; e.lean = -0.15 * e.face; }],
          [0.35, () => { dust(e.x, e.y, 8); addShake(2); sfx('step', 0.6); e.crouch = 0.2; e.tl = oLt(e, angTo(e, P), 620, 30, 0.35, { follow: true }); }],
          [0.35, () => { dust(e.x, e.y, 8); addShake(2); sfx('step', 0.6); e.lockA = tAng(e.tl, angTo(e, P)); faceTo(e, e.lockA); e.dash = { ang: e.lockA, sp: 390, t: 1.6, dmg: e.atk * 1.2, kb: 380, plow: true,
            onWall: () => { e.steps = null; e.state = 'dazed'; e.t = 1.5; e.vuln = 1.5; addShake(7, e.lockA); debris(e.x, e.y, 16); sfx('blast'); banner2(e, '기절!'); } }; e.carryHold = false; sfx('whoosh', 0.8); club(0)(); }],
          [0.2, club(1)], [0.2, club(2)], [0.2, club(3)], [0.2, club(4)], [0.2, club(5)], [0.2, club(6)], [0.2, club(7)], [0.25, null]], 0.8, rand(2.5, 3.5));
      } else if (e.cd <= 0 && d <= 60) { faceTo(e, a); oSeq(e, [[0, () => { e.holdA = a; e.tl = oCt(e, a, 64, 115, 0.45, { follow: true }); oSwing(e, -155, 0.25); glowFor(e, 0.45); e.lean = -0.15 * e.face; }], [0.45, () => { const q = tAng(e.tl, e.holdA); faceTo(e, q); oSlam(e, 65, 0.1); e.lean = 0.2 * e.face; oCone(e, q, 64, 115, e.atk); }], [0.3, () => { armTo(e, -178); }]], 0.6, rand(1.2, 1.8)); }
    } else if (t === 'odrum') {
      if (d < 140) moveTo(a + Math.PI, e.spd * sm); else if (d > 230) moveTo(a, e.spd * sm); else faceTo(e, a);
      e.beatT = (e.beatT == null ? 0.8 : e.beatT) - dt;
      if (e.beatT <= 0) {
        e.beatT = 1.2; e.beatN = (e.beatN || 0) + 1;
        if (e.beatN % 3 === 0) {
          oSeq(e, [[0, () => { oSwing(e, -125, 0.25); glowFor(e, 0.6); e.lean = -0.2 * e.face; oRt(e, e.x, e.y, 96, 0.6); }], [0.6, () => { oSlam(e, 50, 0.08); addShock(e, e.x, e.y, 96, 520, e.atk); sfx('blast', 0.8); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 20, r: 6, t: 0.3, max: 0.3, c: '#ff5040', grow: 200 }); }]], 0.5);
        } else {
          oSwing(e, -40, 0.08); setTimeout(() => { if (e && !e.dead) oSwing(e, 45, 0.1); }, 90);
          sfx('beat', 0.7); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 10, r: 10, t: 0.45, max: 0.45, c: '#d03a30', grow: 340 });
          for (const o of G.enemies) if (!o.dead && o.orc && o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 160) o.buffT = 1.4;
        }
      }
    } else if (t === 'otroll') { // 동굴 트롤: 크게 휘두르는 할퀴기(2연) · 몸을 던지는 도약 덮치기 · 3초 안 맞으면 재생 (v0.60)
      if (d > 60) moveTo(a, e.spd * sm);
      if (e.cd <= 0 && d < 86) {
        faceTo(e, a);
        const sw = () => { const q = tAng(e.tl, angTo(e, P)); faceTo(e, q); oSlam(e, 80, 0.13); oCone(e, q, 70, 170, e.atk, { w: 5, step: 8, dust: 8, c: '230,230,200' }); addShake(3); sfx('swing', 0.8); };
        oSeq(e, [[0, () => { e.tl = oCt(e, a, 70, 170, 0.5, { follow: true }); oSwing(e, -160, 0.3); glowFor(e, 0.5); e.lean = -0.2 * e.face; sfx('growl', 0.7); }], [0.5, sw], [0.25, () => { e.tl = oCt(e, angTo(e, P), 70, 170, 0.3, { follow: true }); oSwing(e, -150, 0.18); glowFor(e, 0.3); }], [0.3, sw], [0.25, null]], 0.8, rand(1.6, 2.4));
      } else if (e.cd <= 0 && d < 220 && Math.random() < 0.5) {
        faceTo(e, a);
        oSeq(e, [[0, () => { e.crouch = 0.5; e.lean = -0.3 * e.face; glowFor(e, 0.7); alertMark(e, e.tall + 6, true); sfx('growl', 0.6); }],
          [0.7, () => { e.crouch = 0; oRt(e, P.x, P.y, 44, 0.55, { pin: true }); leapTo(e, 0.55, 60, 0.3, () => { addShock(e, e.x, e.y, 80, 220, e.atk * 1.1, '200,210,160'); oCircle(e, 40, e.atk * 1.2); debris(e.x, e.y, 14); sfx('blast', 0.8); e.vuln = 1.4; banner2(e, '엎어졌다!'); }); }],
          [0.7, null], [0.9, () => { e.vuln = 1; e.lean = 0; }]], 0.5, rand(2.4, 3.2));
      } else if (e.cd <= 0) e.cd = 0.4;
    } else if (t === 'ogrip') {
      if (d > 52) moveTo(a, e.spd * sm);
      if (e.cd <= 0 && d < 74) {
        faceTo(e, a);
        oSeq(e, [[0, () => { e.lockA = a; armTo(e, -35); e.spread = 0.6; glowFor(e, 0.6); alertMark(e, e.tall + 6); sfx('growl', 0.8); e.tl = oLt(e, a, 84, 26, 0.6, { follow: true }); }],
          [0.6, () => { e.spread = 0; e.lockA = tAng(e.tl, angTo(e, P)); faceTo(e, e.lockA); oRt(e, e.x + Math.cos(e.lockA) * 58, e.y + Math.sin(e.lockA) * 58 * 0.85, 44, 0.32); e.dash = { ang: e.lockA, sp: 240, t: 0.24, grab: { dur: 1.15, need: 6, dmg: e.atk * 1.4, kind: 'throw' } }; armTo(e, 0); }],
          [0.32, () => { if (e.state !== 'seq') return 'stop'; oSwing(e, 250, 0.3); e.face = -e.face; setTimeout(() => { if (!e.dead) e.face = -e.face; }, 150); oCircle(e, 44, e.atk * 0.6); sfx('swing', 0.8); }],
          [0.4, null]], 0.9, rand(2.2, 3.2));
      }
    }
  }
  function banner2(e, txt) { G.nums.push({ x: e.x, y: e.y - (e.tall || 30) - 10, v: txt, t: 0.9, c: '#ffd34d', s: 1, txt: true }); }
  // 죽은 오크 근처의 고블린 노예는 1초간 격분
  function orcOnKill(e) {
    if (!e.orc || e.type === 'slave') return;
    for (const o of G.enemies) if (!o.dead && o.type === 'slave' && Math.hypot(o.x - e.x, o.y - e.y) < 170) { o.frenzyT = 1.2; burst(o.x, o.y - 14, '#ff6040', 4); }
  }

  // ---------- 잡기: 플레이어를 붙잡아 던지거나(throw) 내리꽂는다(slam). 공격 연타 또는 점멸로 빠져나온다
  function startGrab(e, g) {
    const P = G.player; if (P.dead || P.grab) return;
    P.grab = { by: e, t: 0, dur: g.dur, need: g.need, mash: 0, dmg: g.dmg, kind: g.kind, slams: 0 };
    P.state = 'grabbed'; P.kx = P.ky = 0; P.queued = false;
    e.state = 'grabbing'; e.steps = null; armTo(e, -95); G.tele = G.tele.filter(t => !(t.oa && t.owner === e));
    sfx('growl', 0.7); addShake(5); hitstop = Math.max(hitstop, 0.06);
    G.nums.push({ x: P.x, y: P.y - 40, v: '잡혔다!', t: 0.8, c: '#ff8a5a', s: 1, txt: true });
  }
  function releaseGrab(broke) {
    const P = G.player, gr = P.grab; if (!gr) return;
    const e = gr.by; P.grab = null; P.lift = 0; P.state = 'idle'; P.t = 0;
    if (broke) {
      P.iframe = 0.45; P.inv = 0.5; P.kx = -e.face * 260; P.ky = 0;
      if (e && !e.dead) { e.state = 'recover'; e.t = 1.0; e.grogi = Math.min(e.grogiMax || 0, (e.grogi || 0) + 12); e.lean = -0.4 * e.face; e.flash = 0.12; }
      G.nums.push({ x: P.x, y: P.y - 40, v: '탈출!', t: 0.8, c: '#9fd2ff', s: 1, txt: true }); sfx('perfect'); blinkBurst(P.x, P.y - 10);
    }
  }
  function updateGrabbed(P, dt) {
    const gr = P.grab, e = gr.by;
    if (!e || e.dead || e.grogiT > 0 || e.state !== 'grabbing') { releaseGrab(false); return; }
    gr.t += dt;
    const S = ORC_SPEC[e.orc], k = Math.min(1, gr.t / 0.25);
    const slamPhase = gr.kind === 'slam' ? (gr.t % 0.5) / 0.5 : 0;
    P.x = e.x + e.face * (e.r * 0.7 + 6); P.y = e.y + 2; P.face = -e.face;
    P.lift = (e.tall || 50) * 0.55 * k * (gr.kind === 'slam' ? 1 - Math.pow(slamPhase, 3) * 0.95 : 1);
    if (take('j') || take('k') || take('e')) { gr.mash++; addShake(1.5); sfx('hit', 1.6); P.hurtT = 0.06; }
    if (take(' ') && P.stam > 0) { P.stam--; gr.mash = gr.need; }
    if (gr.mash >= gr.need) { releaseGrab(true); return; }
    if (gr.kind === 'slam' && gr.t > 0.5 * (gr.slams + 1) && gr.slams < 2) {
      gr.slams++; hurtPlayer(gr.dmg * 0.5, null, true); addShake(9); dust(P.x, P.y, 14); debris(P.x, P.y, 10); sfx('blast', 0.9);
      if (G.player.dead) { releaseGrab(false); return; }
    }
    if (gr.t >= gr.dur) {
      releaseGrab(false);
      if (gr.kind === 'throw') {
        const dl = P.x - A.x0, dr = A.x1 - P.x, dtp = P.y - A.y0, db = A.y1 - P.y, m = Math.min(dl, dr, dtp, db);
        const ang = m === dl ? Math.PI : m === dr ? 0 : m === dtp ? -Math.PI / 2 : Math.PI / 2;
        hurtPlayer(gr.dmg, null, true); P.kx = Math.cos(ang) * 760; P.ky = Math.sin(ang) * 760; P.thrown = { t: 0.55, dmg: gr.dmg * 0.4 };
        sfx('whoosh', 0.7);
      } else { hurtPlayer(gr.dmg * 0.8, null, true); P.kx = e.face * 520; addShake(10); }
      e.state = 'recover'; e.t = 0.8; oSwing(e, 60, 0.15);
    }
  }

  // ---------- 전쟁 북: 문이 잠기면 울리기 시작, 울리는 동안 오크 이동 +15%. 3번(보스 북은 5번) 때리면 찢어진다
  function genWarDrum(broken) {
    const W = 20, H = 19, g = mkGrid(W, H), set = (x, y, c) => { if (y >= 1 && y < H - 1 && x >= 1 && x < W - 1) g[y][x] = c; };
    for (const lx of [3, 16]) for (let y = 11; y <= 17; y++) set(lx + (y > 14 ? (lx < 10 ? -1 : 1) : 0), y, 'O');
    for (let y = 5; y <= 14; y++) for (let x = 3; x <= 16; x++) { const edge = x === 3 || x === 16; set(x, y, edge ? 'B' : x < 7 ? 'b' : x < 13 ? 'B' : 'k'); if ((y === 7 || y === 12) && !edge) set(x, y, 'o'); }
    for (let x = 3; x <= 16; x++) for (let y = 2; y <= 5; y++) { const dx = (x - 9.5) / 7, dy = (y - 3.5) / 2; if (dx * dx + dy * dy <= 1.05) set(x, y, broken ? (Math.random() < 0.5 ? 'k' : 'S') : dx < -0.2 && dy < 0 ? 's' : 'S'); }
    for (let x = 5; x <= 14; x += 3) for (let y = 6; y <= 13; y++) if ((y + x) % 2 === 0) set(x, y, 'w');
    set(9, 9, 'w'); set(10, 9, 'w'); set(9, 10, 'k'); set(10, 10, 'W');
    if (broken) for (let i = 0; i < 6; i++) set(randi(4, 15), randi(1, 5), '.');
    return gOutline(g);
  }
  function hitDrums(x, y, power, rad) {
    if (!G || !G.drums) return false;
    let any = false;
    for (const d of G.drums) {
      if (d.broken || Math.hypot(x - d.x, y - (d.y - 10)) > rad + 18) continue;
      any = true; if (d.cd > 0) continue;
      d.cd = 0.22; d.hp -= power; d.anim = 0.18;
      debris(d.x, d.y - 14, 8); sfx('block', 0.7); addShake(3); /* v1.08 역경직 제거 */
      G.fx.push({ kind: 'hitspark', x: d.x, y: d.y - 16, ang: rand(0, TAU), rot: 0, t: 0.12, max: 0.12, r: 18, c: '255,220,180' });
      if (d.hp <= 0) {
        d.broken = true; sfx('blast'); addShake(8); flashT = 0.06; flashColor = '#ffd0a0'; debris(d.x, d.y - 14, 24); dust(d.x, d.y, 16);
        lootFeed(d.boss ? '전쟁 북이 찢어졌다 — 대족장의 가호가 약해진다' : '전쟁 북이 찢어졌다 — 오크들이 흔들린다', '#ff8a5a');
        if (!d.boss) for (const e of G.enemies) if (!e.dead && e.type === 'odrum') { e.steps = null; e.state = 'dazed'; e.t = 3; e.vuln = 1.3; banner2(e, '멍...'); }
        if (d.boss && G.drums.every(q => !q.boss || q.broken) && G.boss) { G.boss.armorMul = 1; banner('북이 멈췄다', '대족장의 보호가 풀렸다'); }
      }
    }
    return any;
  }
  function updateOrcWorld(dt) {
    const P = G.player;
    if (G.shocks) {
      for (const s of G.shocks) {
        const prev = s.r; s.r += s.sp * dt;
        const dd = Math.hypot(P.x - s.x, (P.y - s.y) / 0.62);
        if (!s.hit && !P.dead && prev - P.r <= dd && s.r + P.r >= dd) { s.hit = true; if (!P.grab && (P.lift || 0) < 6) hurtPlayer(s.dmg, s.owner && !s.owner.dead ? s.owner : null); }
        if (isKrug(s.owner)) for (const e of G.enemies) { if (e.dead || e === s.owner) continue; const de = Math.hypot(e.x - s.x, (e.y - s.y) / 0.62); if (prev - 6 <= de && s.r + 6 >= de) krugHitAlly(e, s.dmg, s.owner); }
      }
      G.shocks = G.shocks.filter(s => s.r < s.max);
    }
    G.drumBeat = Math.max(0, (G.drumBeat || 0) - dt); G.riteBeat = Math.max(0, (G.riteBeat || 0) - dt); if (G.boss && G.boss.riteT > 0) G.boss.riteT -= dt;
    if (G.drums) for (const d of G.drums) {
      d.cd = Math.max(0, (d.cd || 0) - dt); d.anim = Math.max(0, (d.anim || 0) - dt); d.pulse = Math.max(0, (d.pulse || 0) - dt);
      if (d.drop > 0) { d.drop -= dt; if (d.drop <= 0) { d.drop = 0; addShake(8); dust(d.x, d.y, 22); debris(d.x, d.y - 6, 10); sfx('blast', 0.8); G.fx.push({ kind: 'drumwave', x: d.x, y: d.y, t: 0.7, max: 0.7, R: 120, c: '255,90,40' }); } continue; }
      const active = !d.broken && (d.boss || (G.sealed && G.enemies.some(e => !e.dead && e.orc)));
      if (!active) continue;
      d.beatT = (d.beatT || 0) - dt;
      if (d.beatT <= 0) {
        d.beatT = 1.1; d.anim = 0.16; G.drumBeat = 0.18; sfx('beat', 0.55);
        if (d.boss) riteBeat(d); else
        G.fx.push({ kind: 'ring', x: d.x, y: d.y - 8, r: 8, t: 0.5, max: 0.5, c: '#c0302a', grow: 260 });
        for (const e of G.enemies) if (!e.dead && e.orc && e.type !== 'boss') e.drumT = 1.25;
      }
    }
    if (P.thrown) {
      P.thrown.t -= dt;
      const edge = P.x <= A.x0 + P.r + 3 || P.x >= A.x1 - P.r - 3 || P.y <= A.y0 + P.r + 3 || P.y >= A.y1 - P.r - 3 || solidAt(P.x, P.y);
      if (edge) { hurtPlayer(P.thrown.dmg, null, true); addShake(9); dust(P.x, P.y, 14); debris(P.x, P.y, 8); sfx('blast', 1.1); P.kx = P.ky = 0; P.thrown = null; }
      else if (P.thrown.t <= 0) P.thrown = null;
    }
  }
  function drawWarDrum(d) {
    const spr = art('wardrum' + (d.broken ? 'b' : ''), () => withSeed(4242, () => gCanvas(genWarDrum(d.broken), ORC_BASE)));
    if (d.drop > 0) { const k = d.drop / 0.55, oy = Math.round(k * k * 260 / 2) * 2; ctx.fillStyle = `rgba(0,0,0,${0.5 * (1 - k)})`; ctx.fillRect(Math.round(d.x - 14 * (1 - k * 0.6)) & ~1, d.y, Math.round(28 * (1 - k * 0.6)) & ~1, 4); ctx.drawImage(spr, Math.round(d.x - spr.width / 2) & ~1, Math.round(d.y + 2 - spr.height - oy)); return; }
    const sq = d.anim > 0 ? 1 - d.anim * 0.6 : 1, x = Math.round(d.x - spr.width / 2) & ~1;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; { const xa = x + 4, xb = x + spr.width - 4; if (xb > xa) ctx.fillRect(xa, d.y, Math.ceil((xb - xa) / 2) * 2, 2); }
    { const t = pxXform(spr, 2, 0, 1, sq, false, { pvx: 0 }), X = x - t.ax, Yd = snap2(d.y + 2) - t.ay; ctx.save(); ctx.drawImage(t.c, X, Yd); // v1.05 눌림도 칸 단위
      if (d.boss && !d.broken && d.anim > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = d.anim / 0.16 * 0.7; ctx.drawImage(t.c, X, Yd); }
      ctx.restore(); }
    if (!d.broken && d.hp < d.max) { const w = 22; ctx.fillStyle = '#000'; ctx.fillRect(Math.round(d.x - w / 2) - 1, Math.round(d.y - spr.height - 6) - 1, w + 2, 4); ctx.fillStyle = '#d8a840'; ctx.fillRect(Math.round(d.x - w / 2), Math.round(d.y - spr.height - 6), Math.round(w * d.hp / d.max), 2); }
  }
  function pxRing(x, y, r, col, a) {
    const n = Math.max(20, Math.round(r * 0.9));
    ctx.fillStyle = `rgba(0,0,0,${0.55 * a})`;
    for (let i = 0; i < n; i++) { const t = i / n * TAU; ctx.fillRect((Math.round(x + Math.cos(t) * r) & ~1) - 1, (Math.round(y + Math.sin(t) * r * 0.62) & ~1) - 1, 4, 4); }
    ctx.fillStyle = `rgba(${col},${a})`;
    for (let i = 0; i < n; i++) { const t = i / n * TAU; ctx.fillRect(Math.round(x + Math.cos(t) * r) & ~1, Math.round(y + Math.sin(t) * r * 0.62) & ~1, 2, 2); }
  }
  // ---- 전쟁 북 의식 (v0.82): 북이 울릴 때마다 붉은 파동·'둥!'·불씨, 북→대족장 핏빛 사슬로 힘이 흘러가고, 대족장은 룬 방벽에 감싸인다
  function riteBeat(d) {
    d.pulse = 0.55; d.beatN = (d.beatN || 0) + 1; G.riteBeat = 0.4; addShake(3);
    G.fx.push({ kind: 'drumwave', x: d.x, y: d.y, t: 0.75, max: 0.75, R: 150, c: '255,60,40' });
    G.fx.push({ kind: 'drumwave', x: d.x, y: d.y, t: 0.55, max: 0.55, R: 80, c: '255,200,120', delay: 0.08 });
    G.nums.push({ x: d.x + rand(-6, 6), y: d.y - 44, v: d.beatN % 2 ? '둥!' : '두웅!', t: 0.7, c: '#ff7a50', s: 1, txt: true, vy: -60 });
    for (let i = 0; i < 10; i++) { const a = rand(-Math.PI, 0); G.parts.push({ x: d.x + rand(-12, 12), y: d.y - 14, vx: Math.cos(a) * rand(30, 90), vy: Math.sin(a) * rand(60, 140), t: rand(0.4, 0.8), c: pick(['#ff4030', '#ff9040', '#ffd070']), g: 120, glow: true }); }
    const b = G.boss; if (b && !b.dead) { b.riteT = 0.35; G.fx.push({ kind: 'drumwave', x: b.x, y: b.y, t: 0.5, max: 0.5, R: 60, c: '255,70,40', delay: 0.42 }); }
  }
  function drawDrumWave(f, p0) {
    const el = (f.max - f.t) - (f.delay || 0); if (el < 0) return; const p = Math.min(1, el / (f.max - (f.delay || 0)));
    const r = f.R * easeOut(p), a = 1 - p, n = Math.max(24, Math.round(r * 0.7));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // 두께 3칸 링: 바깥은 디더로 성기게, 안쪽은 꽉
    for (let ring = 0; ring < 3; ring++) { const rr = r - ring * 4; if (rr < 2) continue; const lv = a * (1 - ring * 0.3);
      ctx.fillStyle = `rgba(${f.c},${0.85 * lv})`;
      for (let i = 0; i < n; i++) { const t = i / n * TAU, x = Math.round(f.x + Math.cos(t) * rr) & ~1, y = Math.round(f.y + Math.sin(t) * rr * 0.6) & ~1; if (dith(x >> 1, y >> 1, Math.min(1, lv * 1.3))) ctx.fillRect(x, y, 2, 2); } }
    // 바닥 붉은 번짐 (디더)
    if (p < 0.5) { const k = 1 - p * 2, R2 = r * 0.8; ctx.fillStyle = `rgba(${f.c},${0.25 * k})`;
      for (let y = Math.round(f.y - R2 * 0.6) & ~1; y <= f.y + R2 * 0.6; y += 2) for (let x = Math.round(f.x - R2) & ~1; x <= f.x + R2; x += 2) { const q = Math.hypot(x - f.x, (y - f.y) / 0.6) / R2; if (q < 1 && dith(x >> 1, y >> 1, (1 - q) * k)) ctx.fillRect(x, y, 2, 2); } }
    ctx.restore();
  }
  // 북 → 대족장 링크 (v0.83): 위로 휘는 활 궤적을 따라 핏빛 에너지 세 가닥이 서로 꼬이며 흐르고, 테두리는 디더 광채.
  // 평소엔 불씨 덩이가 계속 대족장 쪽으로 흘러가고, 북이 울리면 하얗게 달아오른 굵은 파동이 사슬을 타고 달려가 대족장에게 꽂힌다
  function drawRiteLink(d, x0, y0, x1, y1, b) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), lift = Math.min(90, L * 0.28), cxp = (x0 + x1) / 2, cyp = (y0 + y1) / 2 - lift;
    const at = k => { const u = 1 - k; return [u * u * x0 + 2 * u * k * cxp + k * k * x1, u * u * y0 + 2 * u * k * cyp + k * k * y1]; };
    const n = Math.max(20, Math.round(L / 2.2)), head = d.pulse > 0 ? easeOut(1 - d.pulse / 0.55) : -1, seen = new Set();
    const put = (x, y, col) => { x = Math.round(x) & ~1; y = Math.round(y) & ~1; const key = x * 4096 + y + col.length; if (seen.has(key)) return; seen.add(key); ctx.fillStyle = col; ctx.fillRect(x, y, 2, 2); };
    // 1) 바깥 디더 광채 + 검은 심지 (가닥이 땅 위에서도 또렷하게)
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i <= n; i += 2) { const k = i / n, [x, y] = at(k), [x2, y2] = at(Math.min(1, k + 0.01)), tx = x2 - x, ty = y2 - y, tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl, amp = 5 * Math.sin(k * Math.PI) + 2;
      for (const o of [-amp - 2, amp + 2]) put(x + nx * o, y + ny * o, 'rgba(18,3,3,.55)'); }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i <= n; i++) { const k = i / n, [x, y] = at(k), [x2, y2] = at(Math.min(1, k + 0.01)), tx = x2 - x, ty = y2 - y, tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
      const surge = head >= 0 ? Math.max(0, 1 - Math.abs(k - head) / 0.12) : 0, trail = head >= 0 && k < head ? Math.max(0, 1 - (head - k) / 0.35) * 0.6 : 0, taper = Math.sin(k * Math.PI);
      const amp = (4 + surge * 5) * taper + 1.5;
      // 광채 (디더)
      for (let o = -amp - 6; o <= amp + 6; o += 2) { const q = Math.abs(o) / (amp + 6); const lv = (1 - q) * (0.35 + surge * 0.6 + trail * 0.4); if (lv > 0 && dith((x + nx * o) >> 1, (y + ny * o) >> 1, lv)) put(x + nx * o, y + ny * o, `rgba(200,20,10,${0.35 + surge * 0.3})`); }
      // 꼬인 세 가닥: 앞쪽(cos>0)은 밝게, 뒤쪽은 어둡게
      for (let j = 0; j < 3; j++) { const ph = k * 22 - time * 9 + j * TAU / 3, off = Math.sin(ph) * amp, front = Math.cos(ph) > 0;
        put(x + nx * off, y + ny * off, surge > 0.3 ? 'rgba(255,240,200,1)' : front ? `rgba(255,${110 + trail * 120},${50 + trail * 80},.95)` : 'rgba(170,25,15,.8)'); }
      // 하얗게 달아오른 심 (파동이 지나는 자리)
      if (surge > 0) { put(x, y, 'rgba(255,255,230,1)'); put(x + nx * 2, y + ny * 2, 'rgba(255,200,120,.9)'); put(x - nx * 2, y - ny * 2, 'rgba(255,200,120,.9)'); }
    }
    // 2) 흐르는 불씨 덩이 (십자 4px)
    for (let m = 0; m < 5; m++) { const k = (time * 0.45 + m / 5 + d.x * 0.001) % 1, [x, y] = at(k), w = Math.sin(k * Math.PI);
      ctx.fillStyle = `rgba(255,190,90,${0.9 * w})`; const X = Math.round(x) & ~1, Y = Math.round(y) & ~1; ctx.fillRect(X - 2, Y, 6, 2); ctx.fillRect(X, Y - 2, 2, 6); ctx.fillStyle = `rgba(255,255,220,${w})`; ctx.fillRect(X, Y, 2, 2); }
    // 3) 북 쪽 닻: 도는 2px 고리 / 대족장 쪽 닻: 빨려 드는 나선 점
    const pu = (d.pulse || 0) / 0.55;
    for (let i = 0; i < 14; i++) { const t = i / 14 * TAU + time * 3; if (i % 3 === 2) continue; put(x0 + Math.cos(t) * (10 + pu * 4), y0 + Math.sin(t) * (5 + pu * 2), `rgba(255,90,40,${0.7 + pu * 0.3})`); }
    for (let i = 0; i < 10; i++) { const ph = (time * 1.4 + i / 10) % 1, r = 26 * (1 - ph), t = i * 2.4 + ph * 5; put(x1 + Math.cos(t) * r, y1 + Math.sin(t) * r * 0.7, `rgba(255,${80 + ph * 150},40,${ph})`); }
    if (head > 0.85) { const k = (head - 0.85) / 0.15; for (let i = 0; i < 12; i++) { const t = i / 12 * TAU; put(x1 + Math.cos(t) * (6 + k * 20), y1 + Math.sin(t) * (4 + k * 12), `rgba(255,230,180,${1 - k})`); } }
  }
  function drawRite() {
    const b = G.boss; if (!b || b.dead || !G.drums || !(b.armorMul < 1)) return;
    const bx = b.x, by = b.y - (b.tall || 60) * 0.45;
    ctx.save();
    for (const d of G.drums) { if (!d.boss || d.broken || d.drop > 0) continue;
      const x0 = d.x, y0 = d.y - 26; drawRiteLink(d, x0, y0, bx, by, b);
      // 북 위 핏빛 불꽃 기둥
      const fl = 0.5 + 0.5 * Math.sin(time * 10 + d.x); ctx.globalCompositeOperation = 'lighter';
      const pu = (d.pulse || 0) / 0.55, FH = 40 + pu * 26;
      for (let y = 0; y < FH; y += 2) { const k = y / FH, w = Math.round((12 * (1 - k) + Math.sin(y * 0.4 - time * 14) * 2 + fl * 2) / 2) * 2; if (w <= 0) continue; ctx.fillStyle = k < 0.3 ? `rgba(255,${200 - y * 3},${120 - y * 2},${0.8})` : `rgba(255,${50 + y * 2},30,${0.75})`; for (let x = -w; x < w; x += 2) if (dith((d.x + x) >> 1, (y0 - y) >> 1, (1 - k) * (0.75 + pu * 0.25) - Math.abs(x) / w * 0.3)) ctx.fillRect((Math.round(d.x) & ~1) + x, (Math.round(y0) & ~1) - y, 2, 2); }
    }
    ctx.restore();
  }
  // 대족장 발밑의 핏빛 의식진 (캐릭터 아래): 바깥 고리·룬 8개·안쪽 고리가 반대로 돌고, 북이 울리면 밝아진다
  const RUNES = ['010111010', '101010101', '111101111', '110011110', '011110011', '101111101', '111010111', '100111001'];
  function drawRiteGround() {
    const b = G && G.boss; if (!b || b.dead || !G.drums || !(b.armorMul < 1)) return;
    const rt = b.riteT > 0 ? b.riteT / 0.35 : 0, R = 58 + rt * 6, a = 0.5 + 0.15 * Math.sin(time * 4) + rt * 0.45;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const ring = (r, n, col, al, rot, gap) => { ctx.fillStyle = `rgba(${col},${al})`; for (let i = 0; i < n; i++) { if (gap && i % gap === 0) continue; const t = i / n * TAU + rot; ctx.fillRect(Math.round(b.x + Math.cos(t) * r) & ~1, Math.round(b.y + Math.sin(t) * r * 0.5) & ~1, 2, 2); } };
    ring(R, 120, '255,50,30', a, time * 0.4, 0); ring(R - 4, 110, '255,120,60', a * 0.6, time * 0.4, 9); ring(R * 0.62, 70, '255,60,30', a * 0.9, -time * 0.7, 6);
    for (let i = 0; i < 8; i++) { const t = i / 8 * TAU + time * 0.4, cx = (Math.round(b.x + Math.cos(t) * R * 0.82) & ~1) - 3, cy = (Math.round(b.y + Math.sin(t) * R * 0.41) & ~1) - 3, g = RUNES[i];
      ctx.fillStyle = `rgba(255,${120 + rt * 120},${60 + rt * 100},${Math.min(1, a + 0.1)})`; for (let k = 0; k < 9; k++) if (g[k] === '1') ctx.fillRect(cx + (k % 3) * 2, cy + ((k / 3) | 0) * 2, 2, 2); }
    // 중심 디더 번짐
    ctx.fillStyle = `rgba(200,30,20,${0.25 + rt * 0.3})`;
    for (let y = Math.round(b.y - R * 0.5) & ~1; y <= b.y + R * 0.5; y += 2) for (let x = Math.round(b.x - R) & ~1; x <= b.x + R; x += 2) { const q = Math.hypot(x - b.x, (y - b.y) * 2) / R; if (q < 1 && dith(x >> 1, y >> 1, (1 - q) * 0.55)) ctx.fillRect(x, y, 2, 2); }
    ctx.restore();
  }
  function drawRiteVignette() {
    if (!G || !(G.riteBeat > 0)) return; const a = G.riteBeat / 0.4;
    ctx.save(); ctx.fillStyle = `rgba(200,20,10,${0.22 * a})`;
    for (let y = 0; y < VH; y += 4) for (let x = 0; x < VW; x += 4) { const e = Math.max(Math.abs(x - VW / 2) / (VW / 2), Math.abs(y - VH / 2) / (VH / 2)); if (e > 0.72 && dith(x >> 2, y >> 2, (e - 0.72) / 0.28 * a)) ctx.fillRect(x, y, 4, 4); }
    ctx.restore();
  }
  function drawOrcWorld() {
    if (!G) return;
    drawRite();
    if (G.shocks) for (const s of G.shocks) { const k = s.r / s.max; pxRing(s.x, s.y, s.r, s.c, 1 - k * 0.6); pxRing(s.x, s.y, Math.max(2, s.r - 6), '255,250,230', 0.5 * (1 - k)); }
    const P = G.player;
    if (P && P.grab) {
      const gr = P.grab, x = Math.round(P.x), y = Math.round(P.y - 46 - (P.lift || 0)), w = 34, k = gr.mash / gr.need, blink = Math.floor(time * 10) % 2;
      ctx.font = '8px Galmuri7'; ctx.textAlign = 'center';
      const t = TOUCH.on ? '공격 연타 · 점멸로 탈출' : 'J 연타 · SPACE 탈출';
      ctx.fillStyle = '#000'; fillTextW(t, x + 1, y + 1); ctx.fillStyle = blink ? '#ffe9b0' : '#ff9a6a'; fillTextW(t, x, y);
      ctx.fillStyle = '#000'; ctx.fillRect(x - w / 2 - 1, y + 3, w + 2, 5); ctx.fillStyle = '#3a2a20'; ctx.fillRect(x - w / 2, y + 4, w, 3); ctx.fillStyle = '#9fd2ff'; ctx.fillRect(x - w / 2, y + 4, Math.round(w * k), 3);
    }
  }
  // 그리기: 몸통(좌우 반전) + 어깨축으로 도는 앞팔·무기
  function drawOrc(e, ya, al, bob, lean) {
    const white = e.flash > 0, flip = e.face < 0, z = e.z || 0;
    if (e.type === 'slave') {
      drawShadow(e.x, e.y + 1, 9);
      drawSprite(e.up > 0 ? 'goblinUp' : 'goblin', 'slave', 2, e.x, e.y + 2 + bob + ya, flip, { white, rot: lean, alpha: al });
      if (e.frenzyT > 0 && Math.random() < 0.4) G.parts.push({ x: e.x + rand(-5, 5), y: e.y - rand(14, 24), vx: 0, vy: -20, t: 0.3, c: '#ff6040', g: 0, glow: true });
      return;
    }
    if (e.type === 'wolf') {
      drawShadow(e.x, e.y + 1, 12);
      const sy = e.crouch > 0 ? 0.86 : 1, rot = e.dash ? -0.12 * e.face : lean, bob2 = e.state === 'chase' ? Math.sin(e.walk) * 0.8 : 0;
      drawSprite(e.dash || (e.state === 'chase' && Math.floor(e.walk * 0.8) % 2) ? 'wolfB' : 'wolfA', 'wolfd', 2, e.x, e.y + 2 + bob2 + ya, flip, { white, rot, alpha: al, sy });
      if ((e.drumT > 0 || e.buffT > 0) && Math.random() < 0.3) G.parts.push({ x: e.x + rand(-8, 8), y: e.y - rand(10, 20), vx: 0, vy: -20, t: 0.3, c: '#ff4030', g: 0, glow: true });
      return;
    }
    const S = orcSprite(e.orc, e.ov), y = e.y + 2 + bob * (S.h > 80 ? 1.6 : 1) - z + ya;
    drawShadow(e.x, e.y + 1, Math.max(10, S.w * 0.3) * (z > 0 ? Math.max(0.4, 1 - z / 300) : 1));
    const sx = 1 + (e.spread > 0 ? 0.06 : 0), sy = (e.crouch > 0 ? 0.9 : 1) * (e.state === 'dazed' ? 0.94 : 1);
    const shx = e.x + e.face * S.sx, shy = y + S.sy * sy, ang = e.face > 0 ? e.aa : Math.PI - e.aa;
    // 평소엔 무기를 어깨에 메고 등 뒤로 넘긴다: 몸보다 먼저 그려 머리·몸에 가려지게 (v0.70)
    const carrying = S.carry && (e.carryHold || ((e.state === 'chase' || e.state === 'idle') && !e.steps && !e.asw && Math.abs(angDiff(e.aa, ORC_SPEC[e.orc].rest * DEG)) < 0.5));
    const CY0 = carrying && ORC_SPEC[e.orc].carry, cang = CY0 ? (e.face > 0 ? CY0.ang * DEG : Math.PI - CY0.ang * DEG) : 0;
    if (CY0 && !CY0.front) drawBlade(S.carry, shx, shy, cang, al, white);
    { const src = white ? S.wh : S.cv, t = pxXform(src, 2, lean + (e.grogiT > 0 ? 0.2 * e.face : 0), sx, sy, flip, { pvx: (S.w / 2) & ~1, pvy: S.h - 2 }); // v1.05 칸 단위
      ctx.save(); ctx.globalAlpha = al; ctx.drawImage(t.c, snap2(e.x) - t.ax, snap2(y) - t.ay); ctx.restore(); }
    if (e.type === 'odrum') { // 북잡이: 허리에 멘 북을 들고 다닌다 (v0.59)
      const hit = e.beatT > 1.08 || (e.steps && e.glowT > 0), dx = e.face * Math.round(S.w * 0.34), dy = Math.round(S.h * 0.12);
      ctx.fillStyle = white ? '#fff' : '#2a1a10'; for (let k = 0; k < 6; k++) ctx.fillRect((Math.round(e.x - e.face * (4 - k * 2)) & ~1), Math.round(y - S.h * 0.62 + k * 3 * 1.1) & ~1, 2, 2); // 어깨끈
      drawSprite('heldDrum', 'heldDrum', 2, e.x + dx, y - dy + (hit ? 2 : 0), flip, { white, alpha: al });
    }
    if (!carrying) drawBlade(S.arm, shx, shy, ang, al, white); else if (CY0.front) drawBlade(S.carry, shx, shy, cang, al, white); // 창·몽둥이는 어깨 위에 수평으로
    if (e.rockHold) drawSprite('boulder', 'deco', e.type === 'boss' ? 4 : 3, e.x + e.face * 4, y - S.h - 2, false);
    if (e.glowT > 0) { const k = 1 - e.glowT / e.glowMax, r = S.arm.reach * 0.92; holdGlow(shx + Math.cos(ang) * r, shy + Math.sin(ang) * r, k, '255,120,60'); }
    if ((e.drumT > 0 || e.buffT > 0) && Math.random() < 0.3) G.parts.push({ x: e.x + rand(-S.w * 0.2, S.w * 0.2), y: y - S.h * rand(0.5, 0.9), vx: 0, vy: -24, t: 0.35, c: '#ff4030', g: 0, glow: true });
    if (e.state === 'dazed') for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 12) & ~1, Math.round(y - S.h - 4 + Math.sin(time * 6 + i * 2.1) * 3) & ~1, 2, 2); }
  }
  // ---------- 공중 도약 (그림자는 땅을 따라가고 몸만 떠오른다)
  function airTick(e, dt) {
    const Q = e.air, P = G.player; Q.t += dt;
    if (Q.track && Q.t < Q.track) { Q.x1 = clamp(P.x, A.x0 + e.r, A.x1 - e.r); Q.y1 = clamp(P.y, A.y0 + e.r, A.y1 - e.r); }
    const k = Math.min(1, Q.t / Q.dur), m = Q.ease ? easeOut(k) : k;
    e.x = Q.x0 + (Q.x1 - Q.x0) * m; e.y = Q.y0 + (Q.y1 - Q.y0) * m; e.z = Math.sin(k * Math.PI) * Q.h;
    if (k >= 1) { e.z = 0; e.air = null; solveObs(e, e.r, true); if (Q.onLand) Q.onLand(); }
  }
  function leapTo(e, dur, h, track, onLand) { const P = G.player; e.air = { t: 0, dur, h, track, x0: e.x, y0: e.y, x1: P.x, y1: P.y, onLand }; sfx('whoosh', 0.6); dust(e.x, e.y, 12); }
  const wpick2 = arr => { let t = Math.random() * arr.reduce((s, x) => s + x[1], 0); for (const [k, w] of arr) { if (t < w) return k; t -= w; } return arr[0][0]; };
  function eliteIntro(e) { sfx('roar', 0.85); addShake(6); dust(e.x, e.y, 20); G.fx.push({ kind: 'ring', x: e.x, y: e.y - e.tall * 0.4, r: 10, t: 0.6, max: 0.6, c: '#ffb070', grow: 380 }); }

  // ---------- 엘리트: 투기장 챔피언 우르그 — 3연타 · 대지 강타(충격파 2중) · 도약 내려찍기 / 50% 이하 관중 난입 + 4타 잡기
  function updateUrg(e, dt, d, a, moveTo) {
    const P = G.player;
    if (!e.enraged && e.hp < e.maxHp * 0.5) {
      e.enraged = true; e.spd *= 1.15; e.steps = null; e.state = 'recover'; e.t = 0.9;
      eliteIntro(e); banner('관중의 함성', '오크들이 투기장으로 난입한다'); oSwing(e, -100, 0.2);
      for (let i = 0; i < 4; i++) queueSpawn('orc');
      return;
    }
    if (e.state !== 'chase') return;
    if (d > 62) moveTo(a, e.spd * orcSm(e));
    if (e.cd > 0) return;
    faceTo(e, a);
    const pat = d < 84 ? wpick2([['combo', 6], ['pound', 3]]) : d < 330 ? wpick2([['leap', 5], ['pound', d < 150 ? 2 : 0], ['walk', 2]]) : 'walk';
    if (pat === 'walk') { e.cd = 0.5; return; }
    if (pat === 'combo') {
      // v0.89: 매 타격마다 바닥 전조, 판정은 그 전조의 각도로
      const punch = (ang, mul, reach, back, next) => () => { const q = tAng(e.tl, angTo(e, P)); faceTo(e, q); oSlam(e, back ? -60 : 15, 0.08); oCone(e, q, reach, 95, e.atk * mul, { w: 4, step: 9, dust: 6 }); addShake(3, q); if (next) e.tl = oCt(e, angTo(e, P), next[0], next[1], next[2], { follow: true }); };
      const steps = [[0, () => { e.tl = oCt(e, a, 60, 95, 0.5, { follow: true }); oSwing(e, -125, 0.3); glowFor(e, 0.5); e.lean = -0.18 * e.face; }],
        [0.5, punch(0, 1, 60, false, [60, 95, 0.26])], [0.12, () => oSwing(e, -70, 0.08)], [0.14, punch(0, 0.9, 60, true, [66, 100, 0.28])],
        [0.14, () => oSwing(e, 110, 0.12)], [0.14, () => { const q = tAng(e.tl, angTo(e, P)); faceTo(e, q); oSlam(e, -80, 0.1); oCone(e, q, 66, 100, e.atk * 1.2, { w: 5, step: 12, dust: 8 }); addShake(5); }]];
      if (e.enraged) steps.push([0.3, () => { armTo(e, -30); e.spread = 0.4; glowFor(e, 0.4); e.tl = oLt(e, angTo(e, P), 100, 28, 0.4, { follow: true }); }], [0.4, () => { e.spread = 0; e.dash = { ang: tAng(e.tl, angTo(e, P)), sp: 300, t: 0.26, grab: { dur: 1.2, need: 7, dmg: e.atk * 1.3, kind: 'slam' } }; }], [0.3, null]);
      oSeq(e, steps, 1.0, rand(0.9, 1.4));
    } else if (pat === 'pound') {
      oSeq(e, [[0, () => { oSwing(e, -150, 0.35); glowFor(e, 0.7); e.lean = -0.25 * e.face; sfx('growl', 0.6); oRt(e, e.x, e.y, 74, 0.7); }],
        [0.7, () => { oSlam(e, 85, 0.1); e.lean = 0.3 * e.face; addShock(e, e.x, e.y, 74, 520, e.atk); sfx('blast', 0.8); debris(e.x, e.y, 14); oRt(e, e.x, e.y, 136, 0.28); }],
        [0.28, () => { addShock(e, e.x, e.y, 136, 480, e.atk * 0.8); }], [0.3, null]], 0.9, rand(1.2, 1.8));
    } else {
      oSeq(e, [[0, () => { e.crouch = 0.35; alertMark(e, e.tall + 6, true); armTo(e, -40); }],
        [0.35, () => { oRt(e, P.x, P.y, 58, 0.75, { pin: true }); leapTo(e, 0.75, 130, 0.35, () => { oCircle(e, 58, e.atk * 1.3, '#ffd0a0'); addShock(e, e.x, e.y, 104, 260, e.atk * 0.6); debris(e.x, e.y, 18); sfx('blast'); oSlam(e, 80, 0.1); }); }],
        [0.85, null]], 1.0, rand(1.4, 2.0));
    }
  }
  // ---------- 엘리트: 사슬 풀린 트롤 그러크 — 재생 · 넓게 할퀴기 · 바위 뜯어 던지기 / 40% 이하 배 덮치기 / 25% 이하 분노
  function updateTroll(e, dt, d, a, moveTo) {
    const P = G.player;
    if (!e.enraged && e.hp < e.maxHp * 0.25) { e.enraged = true; eliteIntro(e); banner('분노한 트롤', '재생이 두 배로 빨라진다'); e.steps = null; e.state = 'recover'; e.t = 0.7; return; }
    if (e.state === 'toRock') {
      const rk = e.rock;
      if (!rk || !G.obs.includes(rk)) { e.state = 'chase'; return; }
      const ra = Math.atan2(rk.y - e.y, rk.x - e.x), rd = Math.hypot(rk.x - e.x, rk.y - e.y);
      moveTo(ra, e.spd * 1.25);
      if (rd < rk.r + e.r + 10 || e.t < -4) {
        // 바위를 뜯어낸다: 그 엄폐물이 방에서 사라진다
        const R = G.dun.cur; G.obs.splice(G.obs.indexOf(rk), 1); if (R) { R.sprites = (R.sprites || []).filter(s => s.ob !== rk); G.nav = R.nav = buildNav(G.obs); }
        debris(rk.x, rk.y, 20); dust(rk.x, rk.y, 14); addShake(5); sfx('blast', 0.7);
        faceTo(e, angTo(e, P));
        oSeq(e, [[0, () => { e.rockHold = true; armTo(e, -100); glowFor(e, 0.8); }],
          [0.8, () => {
            e.rockHold = false; oSwing(e, 45, 0.12);
            const tx = clamp(P.x, A.x0 + 10, A.x1 - 10), ty = clamp(P.y, A.y0 + 10, A.y1 - 10), dur = 1.0;
            G.fx.push({ kind: 'lob', x0: e.x, y0: e.y - e.tall, gy0: e.y, x1: tx, y1: ty, h: 90, d0: 0.5, t: dur, max: dur, rock: true, owner: e });
            G.tele.push({ shape: 'circle', x: tx, y: ty, r: 38, t: 0, dur, owner: e, onFire: tt => { const P2 = G.player; if (!P2.dead && inShape(tt, P2.x, P2.y, P2.r)) hurtPlayer(e.atk * 1.2, e); debris(tt.x, tt.y, 22); addShake(7); sfx('blast'); } });
          }]], 0.8, rand(1.2, 1.8));
      }
      return;
    }
    if (e.state !== 'chase') return;
    if (d > 66) moveTo(a, e.spd * orcSm(e));
    if (e.cd > 0) return;
    faceTo(e, a);
    const rocks = G.obs.filter(b => b.t === 'rock' && b.c && Math.hypot(b.x - e.x, b.y - e.y) < 320);
    const low = e.hp < e.maxHp * 0.4;
    const pat = d < 96 ? wpick2([['sweep', 5], ['flop', low ? 3 : 0]]) : wpick2([['rock', rocks.length ? 4 : 0], ['walk', 3], ['flop', low && d < 150 ? 2 : 0]]);
    if (pat === 'walk') { e.cd = 0.4; return; }
    if (pat === 'rock') { e.rock = rocks.sort((p, q) => Math.hypot(p.x - e.x, p.y - e.y) - Math.hypot(q.x - e.x, q.y - e.y))[0]; e.state = 'toRock'; e.t = 0; return; }
    if (pat === 'sweep') {
      const sw = () => { const q = tAng(e.tl, angTo(e, P)); faceTo(e, q); oSlam(e, 75, 0.14); oCone(e, q, 78, 180, e.atk, { w: 5, step: 8, dust: 10, c: '230,230,210' }); addShake(4); };
      const steps = [[0, () => { e.tl = oCt(e, a, 78, 180, 0.55, { follow: true }); oSwing(e, -170, 0.32); glowFor(e, 0.55); e.lean = -0.2 * e.face; }], [0.55, sw]];
      if (e.enraged) steps.push([0.3, () => { e.tl = oCt(e, angTo(e, P), 78, 180, 0.3, { follow: true }); oSwing(e, -170, 0.2); glowFor(e, 0.3); }], [0.3, sw]);
      steps.push([0.2, null]);
      oSeq(e, steps, 0.9, rand(1.0, 1.6));
    } else {
      oSeq(e, [[0, () => { e.lean = -0.4 * e.face; e.crouch = 0.6; glowFor(e, 0.6); sfx('growl', 0.5); e.tl = oLt(e, a, 150, 70, 0.85, { follow: true }); }],
        [0.6, () => { e.lean = 0.7 * e.face; e.dash = { ang: tAng(e.tl, angTo(e, P)), sp: 280, t: 0.25 }; }],
        [0.25, () => { oCone(e, e.dash ? e.dash.ang : a, 80, 80, e.atk * 1.4, { step: 0, dust: 20, w: 6 }); addShake(9); sfx('blast', 0.7); e.vuln = 1.5; banner2(e, '엎어졌다!'); }],
        [1.5, () => { e.vuln = 1; e.lean = 0; }]], 0.5, rand(1.6, 2.2));
    }
  }

  // ---------- 보스: 붉은 엄니 대족장 크루가쉬
  function spawnKrugash() {
    const P0 = G.player, b = makeEnemy('orc', clamp(P0.x, A.x0 + 90, A.x1 - 90), clamp(P0.y - 220, A.y0 + 60, A.y1 - 60));
    const S = STG();
    Object.assign(b, { type: 'boss', kind: 'krugash', r: 30, hp: 4200 * S.hpMul, maxHp: 4200 * S.hpMul, atk: 27 * S.atkMul, def: 90, spd: 46, kbRes: 0, grogiMax: 120,
      stage: 1, state: 'idle', cd: 1.6, summonT: 22, rise: 0.8, armorMul: 1, huntT: 11 });
    orcSetup(b, 'krugash'); b.semiName = null;
    G.boss = b; G.enemies.push(b);
    dust(b.x, b.y, 36); debris(b.x, b.y, 24);
    G.fx.push({ kind: 'skybeam', x: b.x, y: b.y, w: 70, c: '255,90,40', t: 0.7, max: 0.7 });
    bossRoar(b, '#ff5030');
  }
  function krugashStage(b) {
    const pct = b.hp / b.maxHp;
    if (b.stage === 1 && pct <= 0.7) {
      b.stage = 2; banner('2단계 — 전쟁 북 의식', '북이 울리는 동안 대족장이 받는 피해 -40% · 북을 부숴라'); bossRoar(b, '#ff4030'); cancelTele(b); b.steps = null; b.dash = null; b.air = null; b.z = 0; b.state = 'recover'; b.t = 1.0;
      const cs = [[A.x0 + 90, A.y0 + 80], [A.x1 - 90, A.y0 + 80], [A.x0 + 90, A.y1 - 70], [A.x1 - 90, A.y1 - 70]].sort((p, q) => Math.hypot(q[0] - b.x, q[1] - b.y) - Math.hypot(p[0] - b.x, p[1] - b.y)).slice(0, 2);
      for (const [x, y] of cs) {
        const dm = { x, y, hp: 5, max: 5, boss: true, beatT: rand(0.6, 1.2), drop: 0.55 }; G.drums.push(dm);
        G.fx.push({ kind: 'skybeam', x, y, w: 26, t: 0.7, max: 0.7, c: '255,60,30' });
        G.obs.push({ c: true, x, y: y - 4, r: 14, t: 'drum' });
        const m = makeEnemy('otroll', x + (x < CX ? 40 : -40), y + 12); G.enemies.push(m);
      }
      const R = G.dun.cur; G.nav = buildNav(G.obs); if (R) R.nav = G.nav;
      b.armorMul = 0.6;
    }
    if (b.stage === 2 && pct <= 0.35) {
      b.stage = 3; banner('피의 광란', '크루가쉬가 날뛴다'); bossRoar(b, '#ff2020'); cancelTele(b); b.steps = null; b.dash = null; b.air = null; b.z = 0; b.state = 'recover'; b.t = 0.8;
      for (const dm of G.drums) if (dm.boss && !dm.broken) { dm.broken = true; debris(dm.x, dm.y - 14, 24); dust(dm.x, dm.y, 14); }
      b.armorMul = 1; b.spd *= 1.25; b.frenzy = true; sfx('blast');
    }
  }
  function updateKrugash(b, dt) {
    const P = G.player;
    b.flash = Math.max(0, b.flash - dt); b.rise = Math.max(0, b.rise - dt); b.lean *= Math.pow(0.02, dt);
    orcTick(b, dt);
    if (b.air) airTick(b, dt);
    if (b.grogiT > 0) { b.grogiT -= dt; b.steps = null; b.dash = null; b.state = 'grogi'; armTo(b, 95); if (b.grogiT <= 0) { b.state = 'idle'; b.cd = 0.8; } return; }
    krugashStage(b);
    if (b.spikeQ && b.spikeQ.length) { // 솟아오르는 가시: 플레이어와 자기편 오크 모두 찌른다
      for (const q of b.spikeQ) { q.t -= dt; if (q.t <= 0 && !q.done) { q.done = true;
        G.fx.push({ kind: 'rockspike', x: q.x, y: q.y, t: 1.05, max: 1.05, v: (Math.random() * 4) | 0, fl: Math.random() < 0.5, sd: Math.random() * 1000 }); dust(q.x, q.y, 7); for (let i = 0; i < 3; i++) G.parts.push({ x: q.x + rand(-8, 8), y: q.y - 4, vx: rand(-60, 60), vy: -rand(90, 170), t: 0.5, c: pick(['#7a5e48', '#a88a6a', '#4a3628']), g: 420 });
        if (!P.dead && Math.hypot(P.x - q.x, (P.y - q.y) / 0.85) < 20 + P.r) hurtPlayer(b.atk * 0.75, b);
        for (const e of G.enemies) if (!e.dead && e !== b && Math.hypot(e.x - q.x, e.y - q.y) < 20 + (e.r || 8)) krugHitAlly(e, b.atk * 0.75, b);
        if (Math.random() < 0.35) { addShake(2); sfx('hit', 0.7); } } }
      b.spikeQ = b.spikeQ.filter(q => !q.done);
    }
    b.t -= dt; b.cd -= dt; b.summonT -= dt; if (b.stage === 3) b.huntT -= dt;
    // 관중의 투척: 투기장 둘레의 관중이 주기적으로 돌·뼈를 던진다. 가끔은 고기를 던져 준다 (v0.70)
    b.crowdT = (b.crowdT == null ? 5 : b.crowdT) - dt;
    if (b.crowdT <= 0 && !P.dead) {
      b.crowdT = b.stage === 3 ? 4.5 : b.stage === 2 ? 6 : 7.5;
      if (!b.crowdHint) { b.crowdHint = true; banner('관중의 투척', '흥분한 관중이 투기장 안으로 물건을 던진다'); }
      const n = b.stage === 3 ? 6 : b.stage === 2 ? 5 : 4, gift = Math.random() < 0.35 ? randi(0, n - 1) : -1;
      sfx('roar', 1.6);
      for (let i = 0; i < n; i++) {
        const tx = clamp(P.x + rand(-110, 110), A.x0 + 16, A.x1 - 16), ty = clamp(P.y + rand(-80, 80), A.y0 + 16, A.y1 - 16), dur = 1.0 + i * 0.12;
        // 위쪽 관람석의 관중만 던진다 (v0.86): 실제 관중 한 명을 골라 팔을 치켜들고 그 자리에서 던짐
        const crowd = (G.dun.cur && G.dun.cur.crowd) || [], th = crowd.length ? pick(crowd) : null; if (th) th.throwT = 0.5;
        const sx = th ? th.x + 6 : rand(A.x0, A.x1), sy = th ? th.y - 26 : A.y0 - 70;
        G.fx.push({ kind: 'lob', x0: sx, y0: sy, gy0: sy, x1: tx, y1: ty, h: 120, d0: 0.4, t: dur, max: dur, rock: i !== gift, meat: i === gift, owner: b });
        if (i === gift) { setTimeout(() => { if (G && G.boss === b && !b.dead) { spawnLoot('meat', tx, ty); G.nums.push({ x: tx, y: ty - 20, v: '관중의 선물!', t: 0.9, c: '#ffd34d', s: 1, txt: true }); } }, dur * 1000); continue; }
        G.tele.push({ shape: 'circle', x: tx, y: ty, r: 22, t: 0, dur, owner: { type: 'crowd' }, onFire: tt => { const P2 = G.player; if (!P2.dead && inShape(tt, P2.x, P2.y, P2.r)) hurtPlayer(b.atk * 0.4, b); debris(tt.x, tt.y, 8); addShake(2); } });
      }
    }
    if (P.dead) return;
    if (b.state === 'seq') { runSeq(b, dt); return; }
    if (b.state === 'recover') { if (b.t <= 0) { b.state = 'idle'; b.vuln = 1; } return; }
    if (b.state === 'grabbing') return;
    b.state = 'idle'; b.vuln = 1;
    const d = dist(b, P), a = angTo(b, P), fr = b.frenzy ? 0.8 : 1;
    if (d > 115) {
      const ang = steer(b, a), sp = b.spd * (d > 220 ? 1.5 : 1); // v0.88: 멀면 성큼성큼 좁혀 온다
      b.x += Math.cos(ang) * sp * dt; b.y += Math.sin(ang) * sp * dt; b.walk += dt * sp / 9; faceTo(b, a);
      b.x = clamp(b.x, A.x0 + b.r, A.x1 - b.r); b.y = clamp(b.y, A.y0 + b.r, A.y1 - b.r); solveObs(b, b.r, true);
      const st = Math.floor(b.walk / 3); if (st !== b.lastStep) { b.lastStep = st; addShake(1.2); sfx('step', 0.45); }
    }
    if (b.summonT <= 0) {
      b.summonT = b.stage === 3 ? 20 : 25; faceTo(b, a);
      b.summonN = (b.summonN || 0) + 1;
      const beasts = b.summonN % 2 === 0; // 짝수 번째는 맹수 우리를 연다
      oSeq(b, [[0, () => { oSwing(b, -120, 0.3); glowFor(b, 0.6); }], [0.6, () => { bossRoar(b, '#ff6040');
        if (beasts) { banner('맹수 우리가 열렸다', '굶주린 전투 늑대가 투기장으로 풀려난다'); const gate = { x: DOOR.n.x, y: A.y0 + 30 }; for (let i = 0; i < (b.stage === 3 ? 4 : 3); i++) queueSpawn('wolf', { x: gate.x + (i - 1.5) * 26, y: gate.y + rand(0, 16) }); }
        else { for (let i = 0; i < 3; i++) queueSpawn('orc'); if (b.stage === 3) { queueSpawn('slave'); queueSpawn('slave'); } } }]], 0.8, 0.8);
      return;
    }
    if (d > 220) b.cd -= dt * 0.6; // v0.88: 멀면 다음 패턴(접근기)을 빨리 꺼낸다
    if (b.cd > 0) return;
    faceTo(b, a);
    const near = d < 145, S2 = b.stage >= 2, S3 = b.stage === 3;
    // 3페이즈 고유 패턴: 추적하는 3연속 처형 타격. 매 타격 직전에 위치를 고정해
    // 플레이어가 계속 움직이면 피할 수 있지만, 한곳에 머무르면 연속으로 몰린다.
    if (S3 && b.huntT <= 0) {
      b.huntT = 19; b.cd = 0;
      oSeq(b, [[0, () => { banner('피의 사냥', '세 번의 붉은 표식이 차례로 떨어진다 · 계속 움직여라'); bossRoar(b, '#ff2020'); armTo(b, -145); glowFor(b, 1.1); sfx('warn', 1.2); }],
        [0.55, () => { const x = clamp(P.x, A.x0 + 58, A.x1 - 58), y = clamp(P.y, A.y0 + 58, A.y1 - 58); G.tele.push({ shape: 'circle', x, y, r: 54, t: 0, dur: 0.78, owner: b, heavy: true, onFire: tt => { if (!P.dead && inShape(tt, P.x, P.y, P.r)) hurtPlayer(b.atk * 0.9, b); debris(tt.x, tt.y, 18); addShake(7); sfx('blast', 0.8); } }); }],
        [0.82, () => { const x = clamp(P.x, A.x0 + 58, A.x1 - 58), y = clamp(P.y, A.y0 + 58, A.y1 - 58); G.tele.push({ shape: 'circle', x, y, r: 54, t: 0, dur: 0.78, owner: b, heavy: true, onFire: tt => { if (!P.dead && inShape(tt, P.x, P.y, P.r)) hurtPlayer(b.atk * 0.9, b); debris(tt.x, tt.y, 18); addShake(7); sfx('blast', 0.8); } }); }],
        [0.82, () => { const x = clamp(P.x, A.x0 + 58, A.x1 - 58), y = clamp(P.y, A.y0 + 58, A.y1 - 58); G.tele.push({ shape: 'circle', x, y, r: 54, t: 0, dur: 0.78, owner: b, heavy: true, onFire: tt => { if (!P.dead && inShape(tt, P.x, P.y, P.r)) hurtPlayer(b.atk * 0.9, b); debris(tt.x, tt.y, 18); addShake(7); sfx('blast', 0.8); } }); }],
        [0.9, null]], 0.8, 0.7);
      return;
    }
    // v0.70: 돌진 비중을 줄이고 투기장 가시 함정 추가, 같은 패턴 연속 금지
    // v0.88: 멀리서는 돌진·도약으로 붙는 패턴 위주, 제자리 패턴(가시·바위)은 가끔만. 가까우면 근접 연타 위주
    const inPlace = b.lastPat === 'spikes' || b.lastPat === 'boulder' ? 0.3 : 1; // 제자리 패턴 직후엔 또 제자리 패턴이 잘 안 나온다
    let pat = S3 ? (near ? wpick2([['grab', 3], ['frenzy', 2], ['chop', 3], ['stomp', 1], ['spikes', 0.5]]) : wpick2([['leap', 3], ['charge', 3], ['boulder', 0.7 * inPlace], ['spikes', 0.7 * inPlace]]))
      : S2 ? (near ? wpick2([['chop', 4], ['stomp', 2], ['grab', 1], ['spikes', 0.5]]) : wpick2([['charge', 3], ['leap', 2], ['boulder', 0.8 * inPlace], ['spikes', 0.7 * inPlace]]))
      : (near ? wpick2([['chop', 5], ['stomp', 2], ['spikes', 0.5]]) : wpick2([['charge', 3], ['leap', 1.5], ['spikes', 0.8 * inPlace]]));
    if (pat === b.lastPat && pat !== 'chop') pat = near ? 'chop' : (pat === 'charge' ? 'leap' : 'charge');
    b.lastPat = pat;
    const chop = (mul, reach, arc, up) => () => { const q = b.lockA == null ? angTo(b, P) : b.lockA; faceTo(b, q); oSlam(b, up ? -40 : 70, 0.12); oCone(b, q, reach, arc, b.atk * mul, { w: 6, step: 10, dust: 12 }); addShake(6, q); if (!up) krugImpact(b.x + Math.cos(q) * reach * 0.7, b.y + Math.sin(q) * reach * 0.55, 0.9); else { hitstop = Math.max(hitstop, 0.03); for (let i = 0; i < 12; i++) { const a = q + rand(-0.8, 0.8); G.parts.push({ x: b.x + Math.cos(a) * reach * 0.6, y: b.y - 20 + Math.sin(a) * reach * 0.4, vx: Math.cos(a) * 200, vy: Math.sin(a) * 120 - 60, t: 0.35, c: pick(['#ffd070', '#ff8040']), g: 200, glow: true }); } } };
    if (pat === 'walk') { b.cd = 0.6; return; }
    if (pat === 'spikes') { // 투기장 가시 함정 (v0.73): 방향마다 경고선 하나 → 대도끼를 내려찍으면 안쪽부터 가시가 차례로 솟는다
      const n = S3 ? 8 : S2 ? 6 : 4, a0 = S2 ? angTo(b, P) : (Math.random() < 0.5 ? 0 : Math.PI / 4), wd = 0.85 * fr;
      oSeq(b, [[0, () => { oSwing(b, -150, 0.3); glowFor(b, 0.7); b.lean = -0.2 * b.face; sfx('growl', 0.6); alertMark(b, b.tall + 8, true);
          for (let i = 0; i < n; i++) { const q = a0 + i / n * TAU, pts = []; for (let k = 0; k < 8; k++) { const x = b.x + Math.cos(q) * (44 + k * 32), y = b.y + Math.sin(q) * (44 + k * 32) * 0.85; if (x < A.x0 + 10 || x > A.x1 - 10 || y < A.y0 + 10 || y > A.y1 - 10) break; pts.push({ x, y }); }
            if (!pts.length) continue; const last = pts[pts.length - 1], L = Math.hypot(last.x - b.x, last.y - b.y) + 14;
            G.tele.push({ shape: 'line', x: b.x, y: b.y, ang: Math.atan2(last.y - b.y, last.x - b.x), len: L, w: 30, t: 0, dur: wd, owner: b, quiet: true, ff: false });
            pts.forEach((pt, k) => (b.spikeQ = b.spikeQ || []).push({ x: pt.x, y: pt.y, t: wd + k * 0.07 })); } }],
        [wd, () => { oSlam(b, 75, 0.1); b.lean = 0.25 * b.face; krugImpact(b.x + b.face * 34, b.y, 1.1); sfx('blast', 0.6); }], [0.8, null]], 0.7, rand(1.2, 1.7) * fr);
      return;
    }
    if (pat === 'chop') {
      // v0.89: 2·3타에도 바닥 전조. 3타는 다시 조준
      const c1 = chop(1, 126, 110);
      const steps = [[0, () => { b.lockA = angTo(b, P); G.tele.push({ shape: 'cone', x: b.x, y: b.y, ang: b.lockA, r: 126, arc: 110 * DEG, t: 0, dur: 0.6 * fr, owner: b, heavy: true }); oSwing(b, -150, 0.3); glowFor(b, 0.6); b.lean = -0.15 * b.face; }],
        [0.6 * fr, () => { c1(); oCt(b, b.lockA, 130, 150, 0.3, { heavy: true }); }], [0.3, chop(0.8, 130, 150, true)]];
      if (S2) steps.push([0.35, () => { b.lockA = angTo(b, P); faceTo(b, b.lockA); oCt(b, b.lockA, 128, 110, 0.38 * fr, { heavy: true }); oSwing(b, -150, 0.22); glowFor(b, 0.35); }], [0.38 * fr, chop(1.1, 128, 110)]);
      steps.push([0.25, null]);
      oSeq(b, steps, 0.9 * fr, rand(0.8, 1.3) * fr);
    } else if (pat === 'stomp') {
      const steps = [[0, () => { G.tele.push({ shape: 'circle', x: b.x, y: b.y, r: 164, t: 0, dur: 0.7 * fr, owner: b, heavy: true }); b.lean = -0.25 * b.face; b.crouch = 0.6; sfx('growl', 0.6); glowFor(b, 0.7); }], [0.7 * fr, () => { b.lean = 0.2 * b.face; b.crouch = 0; addShock(b, b.x, b.y, 164, 600, b.atk * 0.8); sfx('blast', 0.7); krugImpact(b.x, b.y, 1.4); if (S3) oRt(b, b.x, b.y, 200, 0.35, { heavy: true }); }]];
      if (S3) steps.push([0.35, () => { b.lean = 0.2 * b.face; addShock(b, b.x, b.y, 200, 620, b.atk * 0.6); sfx('blast', 0.8); krugImpact(b.x, b.y, 1.0); }]);
      steps.push([0.3, null]);
      oSeq(b, steps, 0.7, rand(1.0, 1.5) * fr);
    } else if (pat === 'charge') { // 휘두르며 돌진 (v0.73): 도끼를 뒤로 젖혔다가 달리면서 좌우로 크게 휘두르고, 끝에 내려찍는다
      const sweep = (k) => () => { if (!b.dash) return; const q = b.lockA, up = k % 2 === 1; oSlam(b, up ? -140 : 80, 0.12); oCone(b, q, 96, 150, b.atk * 0.7, { w: 6, step: 0, dust: 10 }); addShake(4, q); b.lean = (up ? -0.1 : 0.25) * b.face; };
      const steps = [[0, () => { b.lockA = a; G.tele.push({ shape: 'line', x: b.x, y: b.y, ang: a, len: 700, w: 60, t: 0, dur: 0.8, owner: b }); alertMark(b, b.tall + 8, true); sfx('roar', 0.8); oSwing(b, -165, 0.4); b.lean = -0.2 * b.face; }],
        [0.8, () => { b.dash = { ang: b.lockA, sp: 400, t: 1.6, dmg: b.atk * 0.8, kb: 360, plow: true, onWall: () => { b.dash = null; addShake(10, b.lockA); krugImpact(b.x + Math.cos(b.lockA) * 30, b.y + Math.sin(b.lockA) * 20, 1.2); banner2(b, '쿵!'); } }; sfx('whoosh', 0.6); }]];
      for (let k = 0; k < 5; k++) steps.push([k === 0 ? 0.12 : 0.3, sweep(k)]);
      steps.push([0.25, () => { b.dash = null; const q = angTo(b, P); faceTo(b, q); oSwing(b, -160, 0.2); glowFor(b, 0.4); b.tl = oCt(b, q, 130, 120, 0.4, { heavy: true, follow: true }); }],
        [0.4, () => { const q = tAng(b.tl, angTo(b, P)); faceTo(b, q); oSlam(b, 80, 0.1); oCone(b, q, 130, 120, b.atk * 1.2, { w: 6, step: 14, dust: 14 }); krugImpact(b.x + Math.cos(q) * 90, b.y + Math.sin(q) * 70, 1.3); b.vuln = 1.3; }],
        [0.7, () => { b.vuln = 1; }]);
      oSeq(b, steps, 0.6, rand(1.6, 2.2) * fr);
    } else if (pat === 'boulder') {
      oSeq(b, [[0, () => { b.rockHold = true; armTo(b, -100); glowFor(b, 0.9); sfx('growl', 0.5); dust(b.x, b.y, 10); }],
        [0.9 * fr, () => {
          b.rockHold = false; oSwing(b, 40, 0.12);
          const tx = clamp(P.x, A.x0 + 12, A.x1 - 12), ty = clamp(P.y, A.y0 + 12, A.y1 - 12), dur = 1.1;
          G.fx.push({ kind: 'lob', x0: b.x, y0: b.y - b.tall, gy0: b.y, x1: tx, y1: ty, h: 110, d0: 0.5, t: dur, max: dur, rock: true, owner: b });
          G.tele.push({ shape: 'circle', x: tx, y: ty, r: 46, t: 0, dur, owner: b, onFire: tt => {
            const P2 = G.player; if (!P2.dead && inShape(tt, P2.x, P2.y, P2.r)) hurtPlayer(b.atk * 1.1, b);
            debris(tt.x, tt.y, 26); addShake(8); sfx('blast');
            for (let i = 0; i < 6; i++) { const q = i / 6 * TAU + rand(-0.15, 0.15); G.eproj.push({ x: tt.x, y: tt.y, ang: q, sp: 170, r: 4, dmg: b.atk * 0.45, t: 0.9, hist: [], kind: 'rock' }); }
          } });
        }]], 0.7, rand(1.2, 1.8) * fr);
    } else if (pat === 'leap') {
      const land = () => { krugImpact(b.x, b.y, 1.5); oCircle(b, 76, b.atk * 1.2, '#ffc090'); addShock(b, b.x, b.y, 136, 290, b.atk * 0.6); debris(b.x, b.y, 26); addShake(10); sfx('blast'); oSlam(b, 80, 0.1); };
      const jump = (dur, h, tr) => () => { oRt(b, P.x, P.y, 76, dur, { heavy: true, pin: true }); leapTo(b, dur, h, tr, land); };
      oSeq(b, [[0, () => { b.crouch = 0.4; alertMark(b, b.tall + 8, true); armTo(b, -135); }], [0.4, jump(0.95, 260, 0.6)],
        [1.15, () => { b.crouch = 0.3; armTo(b, -135); }], [0.32, jump(0.85, 220, 0.5)], [1.05, null]], 0.9, rand(1.3, 1.8));
    } else if (pat === 'grab') {
      oSeq(b, [[0, () => { armTo(b, -40); b.spread = 0.5; glowFor(b, 0.5); alertMark(b, b.tall + 8, true); sfx('growl', 0.6); b.tl = oLt(b, a, 140, 40, 0.5, { heavy: true, follow: true }); }],
        [0.5, () => { b.spread = 0; b.dash = { ang: tAng(b.tl, angTo(b, P)), sp: 330, t: 0.3, grab: { dur: 1.45, need: 8, dmg: b.atk * 1.1, kind: 'slam' } }; armTo(b, 0); }],
        [0.4, () => { if (b.state !== 'seq') return 'stop'; }]], 1.0, rand(1.2, 1.6));
    } else if (pat === 'frenzy') {
      const steps = [[0, () => { oSwing(b, -140, 0.2); glowFor(b, 0.3); }]];
      for (let i = 0; i < 5; i++) steps.push([i === 0 ? 0.3 : 0.28, () => { const q = angTo(b, P); faceTo(b, q); b.tl = oCt(b, q, 120, 120, 0.24, { heavy: true }); }], [0.24, () => { const q = tAng(b.tl, angTo(b, P)); faceTo(b, q); const up = i % 2 === 1; oSlam(b, up ? -120 : 70, 0.1); oCone(b, q, 120, 120, b.atk * 0.7, { w: 5, step: 8, dust: 8 }); addShake(4, q); }]);
      steps.push([0.3, () => { b.steps = null; b.state = 'recover'; b.t = 2.0; b.vuln = 1.3; armTo(b, 90); banner2(b, '헉헉...'); return 'stop'; }]);
      oSeq(b, steps, 2.0, 0.8);
    }
  }
  // ---------- 오크 부락 방 그래픽 (2px 칸 · 디더링)
  const WOODPAL = { k: '#0b0806', K: '#060403', h: '#9a6a40', l: '#7a5030', d: '#553620', D: '#33200f', m: '#4a3a24', M: '#6a5634', w: '#e0d6c4', W: '#a89a84', r: '#9a2a24', R: '#5e1612', o: '#8a6034', O: '#5a3a1e', s: '#c8a070', y: '#d8a840', b: '#7a5a3a', B: '#4e3a26' };
  const EARTH = ['#24150d', '#2e1b11', '#3a2316', '#462b1a', '#53331e'];
  const SAND = ['#5a3e24', '#6a4a2c', '#7a5634', '#8a6440'];
  function paintOrcFloor(g, R) {
    g.fillStyle = '#0a0605'; g.fillRect(0, 0, W, H);
    // 값 노이즈 (거친 격자 → 보간)
    const CS = 28, gw = Math.ceil(W / CS) + 2, gh = Math.ceil(H / CS) + 2, NZ = Array.from({ length: gw * gh }, () => Math.random());
    const nz = (x, y) => { const fx = x / CS, fy = y / CS, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, at = (i, j) => NZ[(((j % gh) + gh) % gh) * gw + (((i % gw) + gw) % gw)]; const s = t => t * t * (3 - 2 * t); return (at(ix, iy) * (1 - s(tx)) + at(ix + 1, iy) * s(tx)) * (1 - s(ty)) + (at(ix, iy + 1) * (1 - s(tx)) + at(ix + 1, iy + 1) * s(tx)) * s(ty); };
    const ring = ROOMSTYLE.ground === 'ring' || R.shape === 'arena' || R.type === 'boss';
    const rx = (A.x1 - A.x0) * 0.4, ry = (A.y1 - A.y0) * 0.38;
    // 밟혀 다져진 길: 문에서 가운데로
    const paths = ROOMSTYLE.ground === 'tread' ? Object.keys(R.doors).filter(dd => R.doors[dd] != null).map(dd => DOOR[dd]) : [];
    const segD = (px, py, ax, ay) => { const bx = CX, by = CY, vx = bx - ax, vy = by - ay, L = vx * vx + vy * vy || 1, t = clamp(((px - ax) * vx + (py - ay) * vy) / L, 0, 1); return Math.hypot(px - ax - vx * t, py - ay - vy * t); };
    for (let y = (A.y0 - 4) & ~1; y < A.y1 + 4; y += 2) for (let x = (A.x0 - 4) & ~1; x < A.x1 + 4; x += 2) {
      let v = nz(x, y) * 0.75 + rand(-0.12, 0.12) + 0.2, pal = EARTH;
      if (ring) { const e = Math.hypot((x - CX) / rx, (y - CY) / ry); if (e < 1 && !(e > 0.9 && dith(x >> 1, y >> 1, (e - 0.9) * 10))) { pal = SAND; v = nz(x * 1.7, y * 1.7) * 0.6 + rand(-0.1, 0.1) + 0.25; } }
      if (pal === EARTH && paths.length) { let md = 1e9; for (const p of paths) md = Math.min(md, segD(x, y, p.x, p.y)); if (md < 16 && !(md > 10 && dith(x >> 1, y >> 1, (md - 10) / 6))) v -= 0.32; }
      const f = clamp(v, 0, 0.999) * (pal.length - 1), i = Math.floor(f), j = Math.min(pal.length - 1, i + (dith(x >> 1, y >> 1, f - i) ? 1 : 0));
      g.fillStyle = pal[j]; g.fillRect(x, y, 2, 2);
    }
    // 바닥 자국: 뼈 · 돌 · 짚 · 불탄 자리 · 발자국
    const inA = (x, y, m = 8) => x > A.x0 + m && x < A.x1 - m && y > A.y0 + m && y < A.y1 - m;
    const area = (A.x1 - A.x0) * (A.y1 - A.y0) / 540000;
    for (let i = 0; i < 26 * area; i++) { const x = randi(A.x0, A.x1) & ~1, y = randi(A.y0, A.y1) & ~1; if (!inA(x, y)) continue; g.fillStyle = '#0b0806'; g.fillRect(x - 2, y - 2, 12, 6); g.fillStyle = '#d8cfbc'; g.fillRect(x, y, 8, 2); g.fillRect(x - 2, y - 2, 2, 2); g.fillRect(x - 2, y + 2, 2, 2); g.fillRect(x + 8, y - 2, 2, 2); g.fillRect(x + 8, y + 2, 2, 2); }
    for (let i = 0; i < 60 * area; i++) { const x = randi(A.x0, A.x1) & ~1, y = randi(A.y0, A.y1) & ~1; if (!inA(x, y)) continue; g.fillStyle = '#1a120c'; g.fillRect(x, y + 2, 4, 2); g.fillStyle = pick(['#6a5a4a', '#5a4a3c', '#7a6a58']); g.fillRect(x, y, 4, 2); }
    for (let i = 0; i < 90 * area; i++) { const x = randi(A.x0, A.x1) & ~1, y = randi(A.y0, A.y1) & ~1; if (!inA(x, y)) continue; g.fillStyle = pick(['#8a7038', '#a08040', '#6a5428']); g.fillRect(x, y, 2, 4); if (Math.random() < 0.5) g.fillRect(x + 2, y - 2, 2, 4); }
    for (let i = 0; i < 4 * area + 1; i++) {
      const cx = randi(A.x0 + 40, A.x1 - 40), cy = randi(A.y0 + 30, A.y1 - 30), r = randi(10, 18);
      for (let y = -r; y <= r; y += 2) for (let x = -r * 1.4; x <= r * 1.4; x += 2) { const e = Math.hypot(x / 1.4, y) / r; if (e < 1 && dith((cx + x) >> 1, (cy + y) >> 1, 1 - e * 0.9)) { g.fillStyle = e < 0.4 ? '#0e0806' : '#1a0f09'; g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2); } }
      for (let k = 0; k < 5; k++) { g.fillStyle = pick(['#ff7030', '#c04020', '#ffb050']); g.fillRect((cx + randi(-r, r)) & ~1, (cy + randi(-r / 2, r / 2)) & ~1, 2, 2); }
    }
    for (let i = 0; i < 5 * area; i++) { let x = randi(A.x0 + 30, A.x1 - 30), y = randi(A.y0 + 20, A.y1 - 20); const a = rand(0, TAU); for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(14,8,5,.55)'; g.fillRect((x + (k % 2) * 6) & ~1, y & ~1, 4, 2); x += Math.cos(a) * 14; y += Math.sin(a) * 10; } }
    if (R.type === 'boss') paintArenaFloor(g);
    // 핏자국 (v0.84): 마른 핏물 웅덩이와 흩뿌린 방울, 무언가를 끌고 간 핏줄기
    const BL = ['#2e0806', '#4a0c08', '#6a1410'];
    for (let i = 0; i < (ring ? 7 : 5) * area + 2; i++) {
      const cx = randi(A.x0 + 30, A.x1 - 30), cy = randi(A.y0 + 24, A.y1 - 24), r = randi(5, 12);
      for (let y = -r; y <= r; y += 2) for (let x = -r * 1.6; x <= r * 1.6; x += 2) { const e = Math.hypot(x / 1.6, y) / r + Math.sin(x * 0.7 + y) * 0.12; if (e < 1 && dith((cx + x) >> 1, (cy + y) >> 1, 1.15 - e)) { g.fillStyle = BL[e < 0.45 ? 0 : e < 0.75 ? 1 : 2]; g.fillRect((cx + x) & ~1, (cy + y) & ~1, 2, 2); } }
      for (let k = 0; k < 7; k++) { const a = rand(0, TAU), d = rand(r * 1.1, r * 2.4); g.fillStyle = BL[randi(1, 2)]; g.fillRect((cx + Math.cos(a) * d * 1.5) & ~1, (cy + Math.sin(a) * d * 0.7) & ~1, 2, 2); }
      if (Math.random() < 0.45) { let x = cx, y = cy; const a = rand(0, TAU), L = randi(30, 80); for (let k = 0; k < L; k += 2) { x += Math.cos(a + Math.sin(k * 0.08) * 0.4) * 2; y += Math.sin(a + Math.sin(k * 0.08) * 0.4) * 1.2; if (!inA(x, y)) break; if (dith(k >> 1, 0, 1 - k / L)) { g.fillStyle = BL[1]; g.fillRect(x & ~1, y & ~1, 2, 2); g.fillRect((x + 4) & ~1, (y + 2) & ~1, 2, 2); } } }
    }
    // 바깥: 어두운 둔덕과 돌
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      if (x >= A.x0 && x < A.x1 && y >= A.y0 - 2 && y < A.y1) continue;
      const dd = Math.max(A.x0 - x, x - A.x1, y - A.y1, 0);
      if (y < A.y0) continue;
      g.fillStyle = dd < 10 && dith(x >> 1, y >> 1, 1 - dd / 10) ? '#24150d' : (x + y) % 14 === 0 ? '#1a100a' : '#120b07'; g.fillRect(x, y, 2, 2);
    }
  }
  // ---- v0.84 투기장 (보스방): 위쪽은 3단 관람석 + 낮은 말뚝 방책 + 맹수 우리 철문, 바닥은 피로 그린 부족 문장과 뼈 테두리
  const ARENA_TIERS = () => [A.y0 - 104, A.y0 - 86, A.y0 - 68];
  function paintArenaWall(g, R) {
    const T = ARENA_TIERS(), bar = A.y0 - 40;
    for (let y = 0; y < A.y0; y += 2) for (let x = 0; x < W; x += 2) { const k = clamp((y - (T[0] - 60)) / 90, 0, 1); g.fillStyle = dith(x >> 1, y >> 1, k * 0.6) ? '#2a0c08' : '#120604'; g.fillRect(x, y, 2, 2); }
    // 관람석: 계단식 판자 (윗면 밝게, 앞면 어둡게, 기둥)
    for (const ty of T) {
      for (let x = (A.x0 - 60) & ~1; x < A.x1 + 60; x += 2) { for (let k = 0; k < 18; k += 2) { const c = k < 2 ? '#7a5030' : k < 4 ? '#553620' : k < 16 ? ((x >> 1) % 13 === 0 ? '#1a0f08' : '#33200f') : '#140a05'; g.fillStyle = c; g.fillRect(x, ty + k, 2, 2); } }
      for (let x = A.x0 - 60; x < A.x1 + 60; x += 52) { g.fillStyle = '#0b0806'; g.fillRect(x & ~1, ty + 4, 6, 14); g.fillStyle = '#553620'; g.fillRect((x & ~1) + 2, ty + 4, 2, 14); }
    }
    // 방책: 낮은 말뚝, 핏자국, 밧줄, 꽂힌 해골
    const LW = 10;
    for (let x = (A.x0 - 60) & ~1; x < A.x1 + 60; x += LW) {
      const tip = bar + randi(-2, 2) * 2, base = A.y0 + 2;
      for (let y = tip; y < base; y += 2) for (let c = 0; c < LW - 2; c += 2) { const tY = tip + Math.abs(c - (LW - 4) / 2) * 2; if (y < tY) continue; g.fillStyle = c === 0 ? '#9a6a40' : c <= 2 ? '#7a5030' : c <= 4 ? '#553620' : '#33200f'; g.fillRect(x + c, y, 2, 2); }
      g.fillStyle = '#060403'; g.fillRect(x + LW - 2, tip + 4, 2, base - tip - 4);
      if (Math.random() < 0.3) { g.fillStyle = '#5e1612'; const sy = tip + randi(8, 20); for (let k = 0; k < randi(6, 16); k += 2) g.fillRect(x + 2, sy + k, 2, 2); g.fillStyle = '#9a2a24'; g.fillRect(x + 2, sy, 2, 4); }
      if (Math.random() < 0.12) gPaint(g, fromRows(ORC_WALL_MAPS.skull), WOODPAL, x - 2, tip - 12);
    }
    for (const by of [bar + 14, bar + 32]) { g.fillStyle = '#1e140c'; g.fillRect(A.x0 - 60, by, A.x1 - A.x0 + 120, 4); for (let x = A.x0 - 60; x < A.x1 + 60; x += 6) { g.fillStyle = (x / 6 | 0) % 2 ? '#8a7038' : '#5a4428'; g.fillRect(x & ~1, by, 4, 2); } }
    // 걸린 부족 깃발
    for (let i = 0; i < 6; i++) { const mx = Math.round((A.x0 + (i + 0.5) * (A.x1 - A.x0) / 6) / 2) * 2; if (Math.abs(mx - DOOR.n.x) < 90) continue; gPaint(g, fromRows(ORC_WALL_MAPS.banner), WOODPAL, mx - 9, bar + 8); }
    // 맹수 우리 철문 (북쪽 가운데): 어두운 굴 + 쇠창살 + 위에 큰 뿔 해골
    const gx = DOOR.n.x;
    for (let y = bar - 30; y < A.y0 + 2; y += 2) for (let x = gx - 34; x < gx + 34; x += 2) { const k = (y - (bar - 30)) / (A.y0 - bar + 32); g.fillStyle = dith(x >> 1, y >> 1, k * 0.35) ? '#1a0a06' : '#050202'; g.fillRect(x, y, 2, 2); }
    for (let x = gx - 32; x <= gx + 30; x += 8) { g.fillStyle = '#0b0806'; g.fillRect(x - 2, bar - 30, 6, A.y0 - bar + 32); g.fillStyle = '#6a6a74'; g.fillRect(x, bar - 30, 2, A.y0 - bar + 30); g.fillStyle = '#9a9aa4'; g.fillRect(x, bar - 30, 2, 4); }
    for (const yy of [bar - 18, bar + 10]) { g.fillStyle = '#0b0806'; g.fillRect(gx - 36, yy - 2, 72, 6); g.fillStyle = '#4a4a54'; g.fillRect(gx - 34, yy, 68, 2); }
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) { const px = gx + s * (40 + k * 2); g.fillStyle = '#0b0806'; g.fillRect(px - 4, bar - 40 - k * 2, 8, A.y0 - bar + 42 + k * 2); }
    for (const s of [-1, 1]) { g.fillStyle = '#7a5030'; g.fillRect(gx + s * 40 - 2, bar - 40, 4, A.y0 - bar + 40); }
    const SK = ['....kkkkkkk....', '..kkwwwwwwwkk..', '.kwwwwwwwwwwWk.', 'kwwkkkwwwkkkwWk', 'kwkrrkwwwkrrkWk', 'kwwkkkwkwkkkwWk', '.kwwwwkkkwwwWk.', 'w.kwkwkwkwkWk.w', 'Wk.kkkkkkkkk.kW', '.Wk.........kW.'];
    gPaint(g, fromRows(SK), WOODPAL, gx - 15, bar - 60);
    const horn = fromRows(['w......', 'Wk.....', '.Wk....', '..WWk..', '...kWWk']);
    gPaint(g, horn, WOODPAL, gx - 30, bar - 66); gPaint(g, horn.map(r => r.slice().reverse()), WOODPAL, gx + 16, bar - 66);
    g.fillStyle = '#0e0905'; g.fillRect(A.x0 - 60, A.y0 - 2, A.x1 - A.x0 + 120, 4);
  }
  // 관중: 관람석 계단마다 줄지어 서서 들썩이고, 대족장이 북을 치거나 관중이 던질 때·보스가 쓰러질 때 더 크게 환호
  function genSpectator(v) {
    const g = mkGrid(9, 13), skin = ['g', 't', 'v', 'a'][Math.floor(v / 2) % 4], dk = { g: 'G', t: 'T', v: 'V', a: 'A' }[skin]; // v0.91 관중도 피부 4색
    for (let y = 1; y <= 6; y++) for (let x = 1; x <= 7; x++) { const e = Math.hypot((x - 4) / 3.2, (y - 3.6) / 2.8); if (e < 1) g[y][x] = x >= 5 && y >= 3 ? dk : skin; }
    g[3][3] = 'e'; g[3][5] = 'e'; g[5][2] = 'w'; g[5][6] = 'w'; g[4][3] = g[4][5] = dk;
    if (v % 4 === 1) { g[1][3] = 'r'; g[1][4] = 'r'; g[0][4] = 'r'; } if (v % 4 === 2) { g[1][2] = 'm'; g[1][6] = 'm'; g[0][1] = 'n'; g[0][7] = 'n'; }
    for (let y = 7; y <= 12; y++) for (let x = 1; x <= 7; x++) g[y][x] = x <= 2 ? (v % 2 ? 'b' : 'B') : x >= 6 ? 'B' : (y === 8 && v % 3 === 0 ? 'r' : v % 2 ? 'b' : 'B');
    return gOutline(g);
  }
  const SPEC_PAL = { t: '#866c3a', T: '#5a4624', v: '#8a4a36', V: '#5c2e22', a: '#626a6a', A: '#42484a', k: '#0b0a0e', g: '#5e7a34', G: '#3e5424', H: '#2a3a18', h: '#7a8a3a', e: '#ffd23a', w: '#ece0c4', r: '#a32a2a', m: '#5e5e6a', n: '#c4c4cc', b: '#5a3a22', B: '#3a2414', y: '#d8a840' };
  function drawArenaCrowd() {
    const R = G.dun && G.dun.cur; if (!R || R.type !== 'boss' || G.stage !== 3) return;
    if (!R.crowd) { R.crowd = []; const T = ARENA_TIERS(); T.forEach((ty, ti) => { for (let x = A.x0 - 40 + ti * 8; x < A.x1 + 40; x += randi(18, 26)) { if (Math.abs(x - DOOR.n.x) < 64 || Math.random() < 0.12) continue; R.crowd.push({ x, y: ty + 4, v: randi(0, 11), ph: rand(0, TAU), arm: Math.random() < 0.5, wpn: pick([0, 0, 1, 2]), ti }); } }); }
    const b = G.boss, hype = (G.riteBeat > 0 ? 1 : 0) + (b && b.dead ? 1 : 0) + (b && b.crowdT > 3.8 ? 0.8 : 0) + (b && b.stage === 3 ? 0.4 : 0) + 0.25;
    for (const c of R.crowd) {
      if (c.throwT > 0) c.throwT -= 1 / 60; const spr = art('spec' + c.v, () => gCanvas(genSpectator(c.v), SPEC_PAL)), up = c.throwT > 0 ? 1 : Math.sin(time * (6 + c.v % 3) + c.ph) > 1 - Math.min(1.6, hype) ? 1 : 0, dy = up ? -4 : 0, x = Math.round(c.x) & ~1, y = Math.round(c.y - spr.height + dy) & ~1;
      if ((c.arm || c.throwT > 0) && up) { // 치켜든 팔과 무기
        ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x + 12, y - 8, 6, 14); ctx.fillStyle = '#5e7a34'; ctx.fillRect(x + 14, y - 6, 2, 10); ctx.fillRect(x + 14, y - 8, 2, 2);
        if (c.wpn === 1) { ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x + 12, y - 18, 8, 10); ctx.fillStyle = '#a4a4b0'; ctx.fillRect(x + 14, y - 16, 4, 6); ctx.fillStyle = '#8a6034'; ctx.fillRect(x + 14, y - 10, 2, 4); }
        if (c.wpn === 2) { ctx.fillStyle = '#0b0a0e'; ctx.fillRect(x + 13, y - 24, 4, 18); ctx.fillStyle = '#8a6034'; ctx.fillRect(x + 14, y - 20, 2, 14); ctx.fillStyle = '#e4e4ec'; ctx.fillRect(x + 14, y - 24, 2, 4); }
      }
      ctx.drawImage(spr, x, y);
    }
  }
  // 투기장 바닥 장식: 모래판 가장자리를 두른 뼈·해골, 가운데 피로 그린 엄니 해골 문장
  function paintArenaFloor(g) {
    const rx = (A.x1 - A.x0) * 0.4, ry = (A.y1 - A.y0) * 0.38;
    // 모래판 가장자리로 밀려난 뼈 (v0.85): 고른 간격 대신 군데군데 뭉친 무더기와 빈 구간, 바깥쪽으로 흩어짐, 방향·모양 제각각
    const bone = (x, y, kind) => { x &= ~1; y &= ~1; const B = (xx, yy, w, h, c) => { g.fillStyle = c; g.fillRect(x + xx, y + yy, w, h); };
      if (kind === 0) { B(-2, -2, 12, 6, '#0b0806'); B(0, 0, 8, 2, '#d8cfbc'); B(-2, -2, 2, 2, '#d8cfbc'); B(8, 2, 2, 2, '#a8a090'); } // 가로 뼈
      else if (kind === 1) { B(-2, -2, 6, 12, '#0b0806'); B(0, 0, 2, 8, '#d8cfbc'); B(-2, -2, 2, 2, '#d8cfbc'); B(2, 8, 2, 2, '#a8a090'); } // 세로 뼈
      else if (kind === 2) { for (let k = 0; k < 4; k++) B(k * 2 - 2, k * 2 - 2, 6, 6, '#0b0806'); for (let k = 0; k < 4; k++) B(k * 2, k * 2, 2, 2, k === 3 ? '#a8a090' : '#d8cfbc'); } // 비스듬한 뼈
      else if (kind === 3) { B(-4, -4, 12, 10, '#0b0806'); B(-2, -2, 8, 4, '#d8cfbc'); B(0, 0, 2, 2, '#0b0806'); B(4, 0, 2, 2, '#0b0806'); B(-2, 2, 8, 2, '#a8a090'); } // 해골
      else if (kind === 4) { B(-2, -2, 14, 8, '#0b0806'); for (let k = 0; k < 5; k++) B(k * 2, 0, 2, k % 2 ? 4 : 2, '#b8ac90'); } // 갈비 조각
      else { B(-1, -1, 4, 4, '#0b0806'); B(0, 0, 2, 2, '#b8ac90'); } }; // 부스러기
    const nC = randi(9, 13);
    for (let c = 0; c < nC; c++) {
      const t0 = rand(0, TAU), n = randi(3, 11), spread = rand(0.08, 0.22);
      for (let i = 0; i < n; i++) { const t = t0 + rand(-spread, spread), out = 1 + Math.abs(rand(-0.06, 0.1)) * (Math.random() < 0.7 ? 1 : -0.4), x = CX + Math.cos(t) * rx * out + rand(-6, 6), y = CY + Math.sin(t) * ry * out + rand(-4, 4);
        bone(x, y, Math.random() < 0.12 ? 3 : Math.random() < 0.1 ? 4 : Math.random() < 0.3 ? 5 : randi(0, 2)); }
    }
    for (let i = 0; i < 26; i++) { const t = rand(0, TAU), out = rand(0.92, 1.25); bone(CX + Math.cos(t) * rx * out, CY + Math.sin(t) * ry * out, Math.random() < 0.4 ? 5 : randi(0, 2)); } // 외따로 흩어진 뼈
    // 문장: 피로 그린 엄니 해골 + 엇갈린 도끼 (6px 붓질, 가장자리 디더, 흘러내린 핏방울)
    const S6 = 6, GW = 36, GH = 26, em = (i, j) => { // 1=칠 0=비움
      const x = i - GW / 2 + 0.5, y = j - 11;
      const skull = Math.hypot(x / 8.5, (y + 1) / 7.5) < 1 || (y >= 4 && y <= 9 && Math.abs(x) <= 6 - (y - 4) * 0.4);
      const eye = Math.hypot((Math.abs(x) - 3.6) / 2.4, (y + 0.5) / 2.1) < 1, nose = y >= 2.5 && y <= 4.5 && Math.abs(x) <= (y - 2) * 0.7, teeth = y >= 7 && y <= 8 && Math.abs(x) <= 4.5 && (Math.round(x + 10) % 2 === 0);
      const tusk = (s) => { const tx = x * s; for (let k = 0; k <= 1; k += 0.05) { const cx = 6 + k * 5 + Math.sin(k * 2.2) * 2, cy = 8 - k * 15, w = 1.6 * (1 - k) + 0.4; if (Math.hypot(tx - cx, y - cy) < w) return true; } return false; };
      const axe = (s) => { const ax = x * s; const t = (ax + y) / 2, d = Math.abs(ax - y) / 1.41; if (d < 0.8 && t > -14 && t < 12) return true; const hx = ax + 12, hy = y + 12; return hx > -6 && hx < 1 && hy > -1 && hy < 7 && Math.hypot(hx + 1, hy - 3) < 5.5; };
      if (skull && !eye && !nose && !teeth) return 1; if (tusk(1) || tusk(-1)) return 1; if (!skull && (axe(1) || axe(-1))) return 1; return 0; };
    const ox = CX - GW * S6 / 2, oy = CY - 86;
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { if (!em(i, j)) continue; const edge = !em(i - 1, j) || !em(i + 1, j) || !em(i, j - 1) || !em(i, j + 1);
      for (let a = 0; a < S6; a += 2) for (let bb = 0; bb < S6; bb += 2) { const x = (ox + i * S6 + a) & ~1, y = (oy + j * S6 + bb) & ~1; if (dith(x >> 1, y >> 1, edge ? 0.6 : 0.95)) { g.fillStyle = edge ? '#4a0a06' : ((x * 3 + y * 5) >> 1) % 9 === 0 ? '#5a100c' : '#7a1810'; g.fillRect(x, y, 2, 2); } }
      if (!em(i, j + 1) && Math.random() < 0.25) { const L = randi(2, 7) * 2; for (let k = 0; k < L; k += 2) { g.fillStyle = k > L - 4 ? '#4a0a06' : '#6a140e'; g.fillRect((ox + i * S6 + 2) & ~1, (oy + (j + 1) * S6 + k) & ~1, 2, 2); } } }
    for (let i = 0; i < 90; i++) { g.fillStyle = pick(['#4a0c08', '#7a1810']); g.fillRect((CX + rand(-120, 120)) & ~1, (CY + rand(-80, 70)) & ~1, 2, 2); }
  }
  // 위쪽 벽: 끝을 깎은 통나무 말뚝 울타리 + 가죽·해골·깃발 장식
  function paintOrcWall(g, R) {
    if (R.type === 'boss') return paintArenaWall(g, R);
    const top = A.y0 - 84;
    for (let y = 0; y < A.y0; y += 2) for (let x = 0; x < W; x += 2) { const k = clamp((y - (top - 40)) / 60, 0, 1); g.fillStyle = dith(x >> 1, y >> 1, k * 0.7) ? '#2a0e08' : '#140806'; g.fillRect(x, y, 2, 2); }
    // 하늘 연기 띠
    for (let i = 0; i < 40; i++) { const x = randi(0, W) & ~1, y = randi(top - 30, top + 20) & ~1; g.fillStyle = 'rgba(80,30,20,.35)'; g.fillRect(x, y, randi(6, 20) & ~1, 2); }
    const LW = 12;
    for (let x = (A.x0 - 40) & ~1; x < A.x1 + 40; x += LW) {
      const tip = top + randi(-3, 3) * 2, base = A.y0 + 2;
      for (let y = tip; y < base; y += 2) for (let c = 0; c < LW - 2; c += 2) {
        const tY = tip + Math.abs(c - (LW - 4) / 2) * 2; if (y < tY) continue;
        const col = c === 0 ? '#9a6a40' : c <= 4 ? '#7a5030' : c <= 6 ? '#553620' : '#33200f';
        g.fillStyle = (y - tip) % 22 === 20 && c > 0 ? '#2a180c' : col; g.fillRect(x + c, y, 2, 2);
      }
      g.fillStyle = '#060403'; g.fillRect(x + LW - 2, tip + 6, 2, base - tip - 6);
    }
    for (const by of [top + 24, A.y0 - 26]) { g.fillStyle = '#1e140c'; g.fillRect(A.x0 - 40, by, A.x1 - A.x0 + 80, 6); g.fillStyle = '#5a4428'; g.fillRect(A.x0 - 40, by, A.x1 - A.x0 + 80, 2); for (let x = A.x0 - 40; x < A.x1 + 40; x += 12) { g.fillStyle = '#3a2a18'; g.fillRect(x + 4, by + 2, 2, 4); } }
    g.fillStyle = '#0e0905'; g.fillRect(A.x0 - 40, A.y0 - 2, A.x1 - A.x0 + 80, 4);
    // 장식
    const deco = ROOMSTYLE.wall || [];
    const n = Math.max(2, Math.floor((A.x1 - A.x0) / 120));
    for (let i = 0; i < n; i++) {
      const k = deco[i % deco.length], mx = Math.round((A.x0 + (i + 0.5) * (A.x1 - A.x0) / n) / 2) * 2;
      if (!k || k === 'none' || Math.abs(mx - DOOR.n.x) < 44) continue;
      const m = ORC_WALL_MAPS[k], grid = fromRows(m), w = grid[0].length * 2, h = grid.length * 2;
      gPaint(g, grid, WOODPAL, mx - w / 2, (k === 'skull' ? top - 6 : k === 'spikes' ? A.y0 - 22 : top + 30) + (k === 'banner' ? -4 : 0));
    }
  }
  const ORC_WALL_MAPS = {
    hide: ['k.........k', 'kbkkkkkkkbk', '.kbbbbbbbk.', '.kbBbbbBbk.', '.kbbbwbbbk.', '.kbbwkwbbk.', '.kbbbwbbbk.', '.kbBbbbBbk.', '.kbbbbbbbk.', 'kbkkkkkkkbk', 'k.........k'],
    skull: ['.kkkkk.', 'kwwwwWk', 'kwkwkWk', 'kwwwwWk', '.kwkwk.', '..kok..', '..kok..'],
    banner: ['kkkkkkkkk', 'koooooook', '.krrrrrk.', '.krrwrrk.', '.krwwwrk.', '.krrwrrk.', '.krwrwrk.', '.krrrrrk.', '.kRrRrRk.', '.k.k.k.k.'],
    spikes: ['w...w...w', 'Wk.kWk.kW', '.kWk.kWk.', '..kWkWk..', '...kkk...'],
  };
  // 북쪽 문: 굵은 통나무 기둥 두 개와 뿔 달린 가로대 / 다른 문: 흙바닥 출구 + 말뚝
  function paintDoorOrc(g, d) {
    const p = DOOR[d];
    if (d === 'n') {
      for (let y = A.y0 - 70; y < A.y0 + 2; y += 2) for (let x = p.x - 22; x < p.x + 22; x += 2) { const k = (y - (A.y0 - 70)) / 72; g.fillStyle = dith(x >> 1, y >> 1, k * 0.5) ? '#160c08' : '#060302'; g.fillRect(x, y, 2, 2); }
      const post = mkGrid(9, 46); for (let y = 1; y < 45; y++) for (let x = 1; x < 8; x++) post[y][x] = (y % 9 === 8) ? 'D' : x <= 2 ? 'h' : x <= 4 ? 'l' : x <= 6 ? 'd' : 'D';
      const po = gOutline(post); gPaint(g, po, WOODPAL, p.x - 34, A.y0 - 88); gPaint(g, po, WOODPAL, p.x + 18, A.y0 - 88);
      const beam = mkGrid(40, 6); for (let x = 1; x < 39; x++) for (let y = 1; y < 5; y++) beam[y][x] = y === 1 ? 'h' : y === 4 ? 'D' : x % 7 ? 'l' : 'd';
      beam[1][2] = beam[2][1] = 'w'; beam[1][37] = beam[2][38] = 'w';
      gPaint(g, gOutline(beam), WOODPAL, p.x - 40, A.y0 - 82);
      const sk = fromRows(ORC_WALL_MAPS.skull); gPaint(g, sk, WOODPAL, p.x - 7, A.y0 - 96);
      const horn = fromRows(['w......', 'Wk.....', '.Wk....', '..WWk..', '...kWWk']);
      gPaint(g, horn, WOODPAL, p.x - 48, A.y0 - 94); gPaint(g, horn.map(r => r.slice().reverse()), WOODPAL, p.x + 34, A.y0 - 94);
      return;
    }
    if (d === 's') { gPaint(g, genFloorExit(20, 36, 's'), WOODPAL, p.x - 20, p.y); gPaint(g, genDoorPost(16), WOODPAL, p.x - 30, p.y - 6); gPaint(g, genDoorPost(16), WOODPAL, p.x + 20, p.y - 6); return; }
    const x0 = d === 'w' ? p.x - 80 : p.x;
    gPaint(g, genFloorExit(40, 20, d), WOODPAL, x0, p.y - 20);
    const px = d === 'w' ? p.x - 8 : p.x - 2;
    gPaint(g, genDoorPost(14), WOODPAL, px, p.y - 46); gPaint(g, genDoorPost(14), WOODPAL, px, p.y + 16);
  }
  // 토템: 얼굴을 깎아 쌓은 통나무, 꼭대기에 뿔
  function genTotem() {
    const Hc = randi(24, 30), W0 = 15, g = mkGrid(W0, Hc + 2), col = x => x <= 4 ? 'h' : x <= 7 ? 'l' : x <= 10 ? 'd' : 'D';
    for (let y = 4; y <= Hc; y++) for (let x = 3; x <= W0 - 4; x++) g[y][x] = col(x);
    const seg = randi(6, 8);
    for (let s = 0; (s + 1) * seg + 4 <= Hc; s++) {
      const y0 = 4 + s * seg;
      for (let x = 3; x <= W0 - 4; x++) g[y0][x] = 'D';
      g[y0 + 2][5] = 'K'; g[y0 + 2][9] = 'K'; g[y0 + 3][5] = 'r'; g[y0 + 3][9] = 'r';
      for (let x = 5; x <= 9; x++) g[y0 + seg - 2][x] = s % 2 ? 'w' : 'K';
      if (s % 2 === 0) { g[y0 + 1][2] = 'o'; g[y0 + 1][W0 - 3] = 'o'; g[y0 + 2][1] = 'o'; g[y0 + 2][W0 - 2] = 'O'; }
    }
    for (let x = 4; x <= W0 - 5; x++) g[3][x] = 'l';
    g[2][3] = 'w'; g[1][2] = 'w'; g[2][W0 - 4] = 'W'; g[1][W0 - 3] = 'w'; g[2][7] = 'r'; g[1][7] = 'y';
    for (let x = 2; x <= W0 - 3; x++) { g[Hc][x] = x % 2 ? 'm' : 'M'; g[Hc - 1][x] = g[Hc - 1][x] === '.' ? 'M' : g[Hc - 1][x]; }
    return gOutline(g);
  }
  // 말뚝 우리 (v0.84): 둘레는 끝을 깎은 말뚝 울타리, 안쪽은 종류별로 채운다 — 뼈 무더기 / 부서진 무기 더미 / 도살장 / 맹수 우리
  const PEN_PAL = Object.assign({}, WOODPAL, { S: '#7a6e5c', u: '#22140c', U: '#2e1c10', v: '#3a0c08', x: '#6a3418', X: '#4a2410', g: '#808088', G: '#4a4a54', n: '#d8d8e0', p: '#f4ecdc', q: '#c03a2a' });
  function genPalisade(wc, hc, kind) {
    kind = kind || pick(['bones', 'scrap', 'meat']); // v1.20 맹수 우리(짚더미 둥지)는 무작위 배치에서 뺌
    const HH = 14, W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0), set = (x, y, c) => { if (x >= 1 && x <= wc && y >= 1 && y < H0 - 1) g[y][x] = c; }, get = (x, y) => (g[y] && g[y][x]) || '.';
    const ix0 = 3, ix1 = wc - 2, iy0 = 5, iy1 = hc;
    // 1) 안쪽 바닥: 낮은 주파수 얼룩만 (잔노이즈 없이)
    const base = kind === 'meat' ? ['u', 'v'] : kind === 'scrap' ? ['u', 'X'] : kind === 'beast' ? ['U', 'u'] : ['u', 'U'], ph = rand(0, 6);
    for (let y = 1; y <= hc; y++) for (let x = 1; x <= wc; x++) { const v = 0.5 + 0.25 * Math.sin(x * 0.35 + ph) + 0.25 * Math.cos(y * 0.5 + x * 0.12); g[y][x] = dith(x, y, v * 0.6) ? base[1] : base[0]; if (y <= iy0 + 1 && dith(x, y, (iy0 + 2 - y) / 3)) g[y][x] = 'K'; }
    // 2) 내용물: 가운데 둔덕(타원) 안에 엇갈린 격자로 물건을 촘촘히 쌓고, 둔덕 오른쪽 아래는 한 단계 어둡게 → 쌓인 더미로 읽히게
    const r = (a, b) => randi(a, b), cx = (ix0 + ix1) / 2, cy = (iy0 + iy1) / 2 + 0.5, hx = Math.max(3, (ix1 - ix0) / 2 - 1), hy = Math.max(2, (iy1 - iy0) / 2);
    const inHeap = (x, y, s = 1) => Math.hypot((x - cx) / (hx * s), (y - cy) / (hy * s)) < 1;
    const stamp = (rows, x0, y0, shadow = true) => rows.forEach((rw, j) => [...rw].forEach((c, i) => { const x = x0 + i, y = y0 + j; if (c === '.' || x < ix0 || x > ix1 || y < iy0 || y > iy1) return; set(x, y, c); }));
    const heap = (cells, stepX, stepY, fill) => {
      for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) if (inHeap(x, y, 1.05) && !(Math.hypot((x - cx) / hx, (y - cy) / hy) > 0.9 && dith(x, y, 0.5))) set(x, y, fill);
      for (let y = iy0 - 1; y <= iy1; y += stepY) for (let x = ix0 - 2 + ((y / stepY | 0) % 2) * (stepX >> 1); x <= ix1; x += stepX) if (inHeap(x + 1, y + 1, 0.95)) stamp(pick(cells), x + r(0, 1), y);
    };
    const DARK = { p: 'w', w: 'W', W: 'S', n: 'g', g: 'G', G: 'K', r: 'R', q: 'r', y: 's', s: 'o', o: 'O', h: 'l', l: 'd' };
    const shade = () => { for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) if (inHeap(x, y, 1.05)) { const t = (x - cx) / hx * 0.6 + (y - cy) / hy * 0.8; if (t > 0.35 && DARK[get(x, y)] && !(t < 0.6 && dith(x, y, 0.5))) set(x, y, DARK[get(x, y)]); } };
    const SKULL = ['.ppw.', 'pKwKW', '.wWW.', '..W..'], SKULL2 = ['.pw.', 'KwKW', '.WW.'];
    const BONES = [['pwwwW', 'w...W'], ['pwwW'], ['p..', '.w.', '..W'], ['..p', '.w.', 'W..'], ['pW', '.w', '.W'], ['pp.', '.ww', '..W']];
    const scatter = (n, cells) => { for (let i = 0; i < n; i++) { const x = r(ix0, ix1 - 3), y = r(iy0, iy1 - 2); if (!inHeap(x + 1, y + 1, 1.1)) stamp(pick(cells), x, y); } };
    const area = Math.max(1, (ix1 - ix0) * (iy1 - iy0));
    if (kind === 'bones') { // v1.03: 뼈 하나하나가 읽히게 — 뼈마다 어두운 테두리, 큰 해골은 눈구멍·코·이빨, 갈비뼈, 둔덕 오른쪽 아래 그늘
      for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) { const q = Math.hypot((x - cx) / (hx * 1.08), (y - cy) / (hy * 1.08)); if (q < 1 && !(q > 0.85 && dith(x, y, 0.5))) set(x, y, q > 0.7 ? 'U' : 'K'); }
      const BN = { long: ['pp...wp', 'wwwwwwW', 'WW...WW'], short: ['pp.wp', 'wwwwW', 'WW.WW'], d1: ['pp...', 'pww..', '.wwW.', '..wWW', '...WW'], d2: ['...wp', '..wwp', '.wwW.', 'WwW..', 'WW...'],
        rib: ['..pwW..', '.w.w.W.', 'w..w..W', '.w.w.W.', '..wWW..'], skull: ['.ppwww.', 'ppwwwwW', 'pKKwKKW', 'wKKwKKW', '.wwKwW.', '.WwWwW.'], skull2: ['.pww.', 'pwwwW', 'wKwKW', '.wKW.', '.WWW.'] };
      const stampO = (rows, x0, y0) => { // 테두리(K) 먼저, 그 위에 뼈
        rows.forEach((rw, j) => [...rw].forEach((c, i) => { if (c === '.') return; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = x0 + i + dx, y = y0 + j + dy; if (x >= ix0 && x <= ix1 && y >= iy0 && y <= iy1 && inHeap(x, y, 1.08)) { const r2 = rows[j + dy], c2 = r2 && r2[i + dx]; if (!c2 || c2 === '.') set(x, y, 'K'); } } }));
        rows.forEach((rw, j) => [...rw].forEach((c, i) => { const x = x0 + i, y = y0 + j; if (c !== '.' && x >= ix0 && x <= ix1 && y >= iy0 && y <= iy1) set(x, y, c); })); };
      const pool = [BN.long, BN.long, BN.short, BN.d1, BN.d2, BN.rib, BN.skull2];
      for (let y = Math.round(iy0 + 1); y <= iy1 - 2; y += 3) for (let x = ix0 - 1 + ((y >> 1) % 2) * 4; x <= ix1 - 3; x += 7 + randi(-1, 1)) { const pc = pick(pool); if (inHeap(x + pc[0].length / 2, y + pc.length / 2, 0.92)) stampO(pc, x, y); }
      shade();
      const nS = Math.max(1, Math.round(area / 140)); for (let i = 0; i < nS; i++) stampO(Math.random() < 0.7 ? BN.skull : BN.skull2, Math.round(cx + rand(-hx * 0.55, hx * 0.35)) - 3, Math.round(cy + rand(-hy * 0.55, hy * 0.05)) - 3);
      for (let i = 0; i < area / 120; i++) { const x = r(ix0, ix1 - 6), y = r(iy0, iy1 - 2); if (!inHeap(x + 2, y + 1, 1.1)) stampO(pick([BN.short, BN.d1, BN.d2]), x, y); }
    } else if (kind === 'scrap') { // 부서진 칼날·도끼머리·투구를 쌓은 고철 더미 + 꽂힌 방패
      const BL = [['nggggG'], ['ngggG'], ['n...', '.g..', '..g.', '...o'], ['...n', '..g.', '.g..', 'o...'], ['.ggG.', 'gnggG', 'gK.KG'], ['xxxX']];
      heap(BL, 5, 2, 'G'); shade();
      for (let i = 0; i < Math.min(2, area / 300 + 1); i++) { const sx = Math.round(cx + rand(-hx * 0.6, hx * 0.6)), sy = Math.round(cy + rand(-hy * 0.5, hy * 0.3)), R0 = r(2, 3);
        for (let y = -R0; y <= R0; y++) for (let x = -R0; x <= R0; x++) { const d = Math.hypot(x, y); if (d <= R0 + 0.3) set(sx + x, sy + y, d > R0 - 0.7 ? 'G' : d < 0.8 ? 'n' : Math.abs(x) < 1 ? 'r' : x + y < 0 ? 'o' : 'O'); } }
      scatter(area / 60, [['nggG'], ['xxX']]);
    } else if (kind === 'meat') { // 도살장: 바닥 가득 핏물, 가운데 고깃덩이·갈비 더미, 박힌 식칼
      for (let y = iy0; y <= iy1; y++) for (let x = ix0; x <= ix1; x++) { const d = Math.hypot((x - cx) / (hx * 1.25), (y - cy) / (hy * 1.25)); if (d < 1 && dith(x, y, 1.3 - d)) set(x, y, d < 0.55 ? 'R' : 'v'); }
      const CHUNK = ['.rrq.', 'rqrrR', 'rrRRR'], RIB = ['p.p.p', 'w.w.w', 'rrrrR'], SH = ['.rrr.', 'rqwrR', 'rrrRR'];
      heap([CHUNK, CHUNK, SH, ['pwwW']], 6, 2, 'R'); shade(); for (let i = 0; i < area / 160 + 1; i++) stamp(RIB, Math.round(cx + rand(-hx * 0.5, hx * 0.3)), Math.round(cy + rand(-hy * 0.5, hy * 0.2)));
      for (let i = 0; i < area / 120 + 1; i++) stamp(['.nn', 'ngG', '.oO', '.oO'], Math.round(cx + rand(-hx * 0.5, hx * 0.5)), Math.round(cy - 2 + rand(-hy * 0.4, 0)));
      scatter(area / 70, [['q'], ['rq'], ['pwW']]);
    } else { // 맹수 우리: 짚더미 둥지, 그 위 갉아먹힌 뼈, 바닥을 기는 사슬, 발톱 자국
      heap([['yys'], ['ysy'], ['syo'], ['yyo'], ['ys']], 3, 1, 'o'); shade();
      for (let i = 0; i < 2; i++) { let x = ix0, y = r(iy0, iy1); for (let k = 0; x <= ix1; k++) { if (!inHeap(x, y, 0.9)) set(x, y, k % 2 ? 'G' : 'g'); x++; if (Math.random() < 0.25) y = clamp(y + pick([-1, 1]), iy0, iy1); } }
      for (let i = 0; i < area / 70 + 1; i++) stamp(pick(BONES), Math.round(cx + rand(-hx * 0.6, hx * 0.4)), Math.round(cy + rand(-hy * 0.5, hy * 0.3)));
      stamp(SKULL, Math.round(cx + rand(-hx * 0.3, hx * 0.2)) - 2, Math.round(cy - hy * 0.4));
      for (let i = 0; i < area / 120 + 1; i++) { const x = r(ix0, ix1 - 5), y = r(iy0, iy1 - 3); if (!inHeap(x, y, 1.1)) for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) set(x + k * 2 + j, y + j, 'K'); }
    }
    // 3) 뒤·옆 울타리: 뒤쪽은 작은 말뚝 앞면이 보이고, 옆은 말뚝 머리
    for (let x = 1; x <= wc; x++) { const c = (x - 1) % 3, tall = ((x - 1) / 3 | 0) % 2;
      if (c === 1) set(x, 1 - 0 + (tall ? 0 : 1), 'h');
      for (let y = 2 + (tall ? 0 : 1); y <= 4; y++) set(x, y, c === 0 ? 'l' : c === 1 ? 'd' : 'K');
      if (c === 0 && !tall) set(x, 2, 'K'); }
    for (let y = 2; y <= hc; y++) for (const [x, c] of [[1, 'h'], [2, 'd'], [wc - 1, 'l'], [wc, 'D']]) set(x, y, (y % 3 === 0) ? 'K' : c);
    // 4) 앞 울타리: 끝을 깎은 굵은 말뚝 (위로 솟은 뾰족 끝), 밧줄 감기, 꽂힌 해골, 흘러내린 피
    const SW = 4;
    for (let x0 = 1; x0 <= wc; x0 += SW) { const tall = Math.random() < 0.5 ? 2 : 0, top = hc + 1 - 2 - tall;
      for (let y = top; y <= hc + HH; y++) for (let c = 0; c < SW; c++) { const x = x0 + c; if (x > wc) continue; const d = y - top;
        if (d === 0 && c !== 1) continue; if (d === 1 && c === 3) continue;
        set(x, y, c === 3 ? 'K' : d === 0 ? 'h' : c === 0 ? 'h' : c === 1 ? 'l' : 'd'); }
      if (Math.random() < 0.22 && x0 + 3 <= wc) { const sy = top - 1; [['.pw.', 'pKwK', 'wwWW', '.WW.']].forEach(m => m.forEach((rr, j) => [...rr].forEach((ch, i) => { if (ch !== '.' && sy - 3 + j >= 0) { if (g[sy - 3 + j]) g[sy - 3 + j][x0 + i] = ch; } }))); for (let k = 0; k < r(2, 5); k++) set(x0 + 1, top + 1 + k, k % 2 ? 'R' : 'r'); }
      else if (Math.random() < 0.18) for (let k = 0; k < r(2, 6); k++) set(x0 + r(0, 2), hc + 2 + k, k > 2 ? 'R' : 'r');
    }
    for (let x = 1; x <= wc; x++) { const y = hc + 5 + ((x >> 1) & 1); if (get(x, y) !== 'K') set(x, y, (x % 2) ? 'y' : 'o'); const y2 = hc + 10 + (((x + 1) >> 1) & 1); if (get(x, y2) !== 'K') set(x, y2, (x % 2) ? 'o' : 'O'); }
    for (let x = 1; x <= wc; x++) { set(x, hc + HH, 'D'); if (Math.random() < 0.4) set(x, hc + HH - 1, 'U'); }
    return { g: gOutline(g), HH };
  }
  // 망루: 네 기둥 위 발판과 난간, 가죽 지붕, 앞에 사다리와 깃발
  function genWatchtower(wc, hc) {
    const HH = 36, W0 = Math.max(wc, 16) + 2, H0 = HH + hc + 2, g = mkGrid(W0, H0), set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && x < W0 - 1 && y >= 1 && y < H0 - 1) g[y][x] = c; };
    const x0 = 1, x1 = W0 - 2, gb = H0 - 2, gt = Math.min(gb - 2, HH + 1), pl = Math.round(HH * 0.48), cx = W0 / 2;
    for (let y = pl; y <= gt; y++) for (const x of [x0 + 3, x1 - 3]) set(x, y, 'D');
    for (let y = pl; y <= gb; y++) for (let k = 0; k < 3; k++) { set(x0 + k, y, k === 0 ? 'h' : k === 1 ? 'l' : 'd'); set(x1 - 2 + k, y, k === 0 ? 'l' : k === 1 ? 'd' : 'D'); }
    const n = Math.max(6, gb - pl - 6);
    for (let i = 0; i <= n; i++) { const t = i / n; set(x0 + 3 + (x1 - x0 - 6) * t, pl + 4 + (gb - pl - 8) * t, 'd'); set(x1 - 3 - (x1 - x0 - 6) * t, pl + 4 + (gb - pl - 8) * t, 'O'); }
    for (let x = x0; x <= x1; x++) { set(x, pl, 'h'); set(x, pl + 1, x % 4 ? 'l' : 'd'); set(x, pl + 2, 'D'); }
    for (let x = x0; x <= x1; x++) { set(x, pl - 6, 'o'); set(x, pl - 3, 'O'); }
    for (let x = x0; x <= x1; x += Math.max(3, Math.round((x1 - x0) / 4))) for (let y = pl - 7; y < pl; y++) set(x, y, 'l');
    for (let y = pl + 3; y <= pl + 9; y++) for (let x = Math.round(cx - 3); x <= Math.round(cx + 2); x++) set(x, y, y === pl + 9 && x % 2 ? '.' : (x === Math.round(cx) || x === Math.round(cx) - 1) && y > pl + 4 && y < pl + 8 ? 'w' : 'r');
    for (let y = pl + 3; y <= gb; y++) { set(x0 + 5, y, 'o'); set(x0 + 8, y, 'o'); if ((y - pl) % 3 === 0) for (let x = x0 + 6; x <= x0 + 7; x++) set(x, y, 'O'); }
    const ry = pl - 9;
    for (let y = 1; y <= ry; y++) { const hw = (y / ry) * (W0 / 2 + 1); for (let x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) set(x, y, y === ry ? 'D' : (y % 3 === 0 ? 'B' : x < cx - hw * 0.3 ? 'b' : x < cx + hw * 0.3 ? 'B' : 'D')); }
    for (let x = Math.round(cx - 2); x <= Math.round(cx + 2); x++) set(x, ry + 1, 'O');
    set(cx, 1, 'w'); set(cx - 1, 2, 'W');
    return { g: gOutline(g), HH };
  }
  // 가죽 천막: 앞면 삼각형, 가운데 어두운 입구, 꼭대기에 엇갈린 장대
  function genTent(wc, hc) {
    const HH = Math.round(Math.min(26, wc * 0.55)), W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0), cx = W0 / 2;
    for (let y = 1; y <= H0 - 2; y++) {
      const t = y / (H0 - 2), hw = Math.max(1, t * (wc / 2));
      for (let x = 1; x < W0 - 1; x++) {
        const dx = x + 0.5 - cx; if (Math.abs(dx) > hw) continue;
        let c = dx < -hw * 0.3 ? 'b' : dx < hw * 0.3 ? 'B' : 'D';
        if (y % 5 === 0) c = 'D';
        if (t > 0.55 && Math.abs(dx) < (t - 0.55) * wc * 0.45) c = 'K';
        if (Math.abs(dx) > hw - 1) c = 'O';
        g[y][x] = c;
      }
    }
    for (let i = 0; i < 3; i++) { const yy = Math.round((H0 - 2) * (0.3 + i * 0.2)); if (g[yy]) for (let x = 1; x < W0 - 1; x++) if (g[yy][x] === 'b') { g[yy][x] = 'w'; break; } }
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const x = Math.round(cx + s * k), y = 1 + 2 - k; if (g[y] && x > 0 && x < W0 - 1) g[y][x] = 'o'; }
    return { g: gOutline(g), HH };
  }
  function makeOrcObsSprites(R, out) {
    for (const b of R.obs) {
      if (b.t === 'pit' || b.t === 'prop' || b.t === 'drum' || b.t === 'post') continue;
      if (b.t === 'pillar') {
        const g0 = genTotem(), c = gCanvas(g0, WOODPAL);
        out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 6) & ~1, sy: b.y, ob: b });
      } else if (b.t === 'rock') {
        const c = rockCanvas(b.r);
        out.push({ cv: c, x: Math.round(b.x - c.width / 2) & ~1, y: Math.round(b.y - c.height + 6) & ~1, sy: b.y, ob: b });
      } else {
        const wc = Math.round(b.w / 2), hc = Math.round(b.h / 2), tent = !b.tower && b.w <= 100 && b.h <= 80 && Math.random() < 0.55;
        const { g, HH } = b.tower ? genWatchtower(wc, hc) : tent ? genTent(wc, hc) : genPalisade(wc, hc);
        out.push({ cv: gCanvas(g, PEN_PAL), x: Math.round(b.x0 - 2) & ~1, y: Math.round(b.y0 - HH * 2 - 2) & ~1, sy: b.y1, ob: b });
      }
    }
  }
  // 서 있는 소품 (부락)
  Object.assign(PROP_MAPS, {
    orcFire: [['...o..O...', '..oOyoOo..', '.OoyyyoOO.', 'kOryyyyrOk', 'kWWDDDDWWk', 'kDWWWWWWDk', '.kDDDDDDk.', '..kk..kk..'], { k: '#0b0a0e', o: '#ffd060', O: '#ff8a2a', y: '#fff0b0', r: '#c03020', W: '#8a8478', D: '#4a4640' }],
    skullPike: [['.kkkk.', 'kWWWWk', 'kWkkWk', 'kWWWWk', '.kWWk.', '..kok.', '..kok.', '..kok.', '..kOk.', '..kOk.', '..kOk.', '..kOk.', '.kkOkk'], { k: '#0b0a0e', W: '#e0d8c8', o: '#8a6034', O: '#5a3a1e' }],
    meatRack: [['kk..........kk', 'kok........kok', 'kokkkkkkkkkkok', 'kooooooooooook', 'kokrk.krk.krok', 'kokRk.kRk.kRok', 'kok.k..k..k.ok', 'kOk........kOk', 'kOk........kOk', 'kOk........kOk', 'kkk........kkk'], { k: '#0b0a0e', o: '#8a6034', O: '#5a3a1e', r: '#a03a30', R: '#6a2018' }],
    woodPile: [['..kkkkkkkkkk..', '.kooooooooosk.', '.kOOOOOOOOOok.', 'kkkkkkkkkkkkkk', 'kooooooooooosk', 'kOOOOOOOOOOOok', 'kkkkkkkkkkkkkk', 'kooooooooooosk', 'kOOOOOOOOOOOok', '.kkkkkkkkkkkk.'], { k: '#0b0a0e', o: '#8a6034', O: '#5a3a1e', s: '#c89a60' }],
    hideRack: [['kk........kk', 'kokkkkkkkkok', 'kobbbbbbbbok', 'kobBbbbbBbok', 'kobbbwwbbbok', 'kobbwkkwbbok', 'kobbbwwbbbok', 'kobBbbbbBbok', 'kobbbbbbbbok', 'kokkkkkkkkok', 'kOk......kOk', 'kOk......kOk', 'kkk......kkk'], { k: '#0b0a0e', o: '#8a6034', O: '#5a3a1e', b: '#8a6a48', B: '#5a4230', w: '#e0d8c8' }],
    boneHeap: [['..kk..kk..', '.kWWkkWWk.', 'kWkWWWWkWk', '.kWWwWWWk.', '..kkkkkk..'], { k: '#0b0a0e', W: '#e0d8c8', w: '#a8a090' }],
  });
  Object.assign(PROPS, {
    orcFire: { r: 9, foot: 2, light: { r: 96, c: '255,140,60', ca: 0.22, dy: -14 }, flame: [[3, 0], [5, 0], [7, 0]] },
    skullPike: { r: 4, foot: 1 }, meatRack: { r: 12, foot: 2 }, woodPile: { r: 12, foot: 2 }, hideRack: { r: 10, foot: 2 }, boneHeap: { foot: 1 },
  });
  // ---- v0.84: 부락의 잔혹한 소품 — 해골 든 철창, 식칼 박힌 도마 그루터기, 말뚝 바리케이드, 촛불 해골 무더기, 고기 매단 교수대
  let ORC_PROPS = false;
  function ensureOrcProps() {
    if (ORC_PROPS) return; ORC_PROPS = true;
    const P = PEN_PAL;
    spProp('orcCage', 16, 24, (x, y) => { // 나무 받침 위 쇠창살 우리, 안에 웅크린 해골
      if (y <= 2) return y === 0 ? (x >= 6 && x <= 9 ? 'g' : null) : x >= 1 && x <= 14 ? (y === 1 ? 'h' : 'd') : null;
      if (y >= 21) return x >= 0 && x <= 15 ? (y === 21 ? 'l' : 'D') : null;
      if (x < 1 || x > 14) return null;
      if (x % 3 === 1) return x === 1 ? 'n' : 'g';
      if (y === 10) return 'G';
      const sk = [['..', '.pw', 'pKwK', 'wwW', '.W'], 12];
      if (y >= 13 && y <= 15 && x >= 5 && x <= 8) return y === 13 ? (x === 5 ? '.' : 'p') : y === 14 ? (x === 6 || x === 8 ? 'K' : 'w') : (x === 8 ? 'W' : 'w');
      if (y >= 16 && y <= 20 && x >= 4 && x <= 10) return (y % 2 === 0 && x >= 5 && x <= 9) ? 'W' : (x === 7 ? 'w' : (y === 20 ? 'U' : 'u'));
      return y >= 18 ? 'U' : 'u';
    }, { r: 12, foot: 1 }, P);
    spProp('chopBlock', 20, 18, (x, y) => { // 식칼 박힌 도마 그루터기, 피가 흘러내린다
      const blade = y <= 8 && x >= 6 && x <= 13 && y >= 1 && x - 6 >= (8 - y) * 0.5 && x - 6 <= (8 - y) * 0.5 + 6;
      if (blade) return y === 1 || x - 6 > (8 - y) * 0.5 + 5 ? 'n' : y >= 7 ? 'G' : 'g';
      if (y <= 9 && x >= 13 && x <= 18 && y >= 3 && Math.abs(y - (3 + (x - 13) * 0.8)) < 1) return x > 16 ? 'O' : 'o';
      const ex = Math.hypot((x - 9.5) / 8, (y - 10) / 2.6);
      if (ex < 1 && y <= 12) return (x === 9 && y === 10) || ex > 0.85 ? 'd' : (Math.abs(ex - 0.45) < 0.12 ? 'l' : (x > 11 && y > 10 && x < 15 ? 'r' : 'h'));
      if (y > 10 && y <= 16 && x >= 2 && x <= 17) { if ((x === 12 || x === 13) && y <= 13 + (x % 2) * 2) return x === 12 ? 'r' : 'R'; return y === 16 ? 'D' : x <= 4 ? 'l' : x <= 13 ? 'd' : 'D'; }
      if (y === 17 && x >= 10 && x <= 16) return x % 2 ? 'v' : 'r';
      return null;
    }, { r: 10, foot: 2 }, P);
    spProp('spikeBar', 28, 16, (x, y) => { // 엇갈린 말뚝 바리케이드 (끝에 피)
      if (y >= 9 && y <= 11 && x >= 2 && x <= 25) return y === 9 ? 'h' : y === 10 ? 'l' : 'd';
      for (const cx of [5, 13, 21]) for (const s of [-1, 1]) { const t = (y - 10) * s, xx = cx + t * 0.7; if (Math.abs(x - xx) < 1.1 && y >= 1 && y <= 15) { const tip = y <= 2 || y >= 15; return tip ? (y <= 2 ? 'r' : 'D') : s > 0 ? 'l' : 'd'; } }
      if (y === 13 && x % 6 === 2) return 'o';
      return null;
    }, { r: 13, foot: 1 }, P);
    spProp('skullPile', 18, 16, (x, y) => { // 해골을 쌓아 올린 제단, 꼭대기엔 녹은 초
      const rows = [[3, 12], [6, 9], [9, 6]]; // [y top, 몇 개]
      if (y <= 2 && (x === 8 || x === 9)) return y === 0 ? (x === 8 ? 'y' : null) : y === 1 ? 's' : 'w';
      for (const [ty, n] of [[12, 4], [8, 3], [4, 2]]) { const w = n * 4, x0 = Math.round((18 - w) / 2); if (y >= ty - 1 && y <= ty + 2 && x >= x0 && x < x0 + w) { const lx = (x - x0) % 4, ly = y - ty + 1; if (ly === 0) return lx === 0 || lx === 3 ? null : 'p'; if (ly === 1) return lx === 0 ? 'w' : lx === 3 ? 'W' : 'w'; if (ly === 2) return lx === 1 || lx === 2 ? 'K' : 'W'; return lx === 3 ? null : 'W'; } }
      if (y >= 15) return x >= 2 && x <= 15 ? 'U' : null;
      return null;
    }, { r: 9, foot: 1, light: { r: 60, c: '255,170,80', ca: 0.12, dy: -30 }, flame: [[8, 0]] }, P);
    spProp('meatGallows', 24, 28, (x, y) => { // 고기와 사슬을 매단 교수대
      if (x >= 2 && x <= 3 && y >= 1) return x === 2 ? 'h' : 'd';
      if (x >= 20 && x <= 21 && y >= 1) return x === 20 ? 'l' : 'D';
      if (y >= 1 && y <= 2 && x >= 0 && x <= 23) return y === 1 ? 'h' : 'd';
      if (y === 3 && (x === 4 || x === 19)) return 'd';
      for (const [hx, len, kind] of [[8, 9, 'm'], [14, 5, 'c'], [17, 11, 'r']]) {
        if (x === hx && y >= 3 && y < 3 + len) return y % 2 ? 'g' : 'G';
        if (kind === 'm' && y >= 3 + len && y <= 3 + len + 7 && Math.abs(x - hx) <= (y - 3 - len < 2 ? 1 : 2)) return x === hx - 2 || (x === hx - 1 && y < 6 + len) ? 'q' : y > 7 + len ? 'R' : 'r';
        if (kind === 'c' && y === 3 + len && Math.abs(x - hx) <= 1) return 'n';
        if (kind === 'r' && y >= 3 + len && y <= 3 + len + 5 && x >= hx - 2 && x <= hx + 1) return (y - 3 - len) % 2 === 0 ? (x === hx - 2 ? 'p' : 'w') : (x === hx + 1 ? 'R' : 'r');
      }
      if (y >= 24 && y <= 26 && x >= 6 && x <= 18 && dith(x, y, 0.6)) return y === 26 ? 'v' : 'r';
      return null;
    }, { r: 12, foot: 1 }, P);
  }
  function decorOrc(r, add, W0, H0, keyPts) {
    ensureOrcProps();
    if (r.type === 'boss') { // 투기장: 철문 양옆 해골 말뚝, 네 귀퉁이 화톳불, 모래판 밖 둘레에 맹수 우리·교수대·바리케이드
      const nx = DOOR.n.x, topY = A.y0 + 18;
      for (const s of [-1, 1]) { add('skullPike', nx + s * 56, topY); add('skullPile', nx + s * 92, topY + 2); }
      for (const [x, y] of [[A.x0 + 30, A.y0 + 34], [A.x1 - 30, A.y0 + 34], [A.x0 + 30, A.y1 - 26], [A.x1 - 30, A.y1 - 26]]) add('orcFire', x, y);
      const rx = W0 * 0.4, ry = H0 * 0.38, ring = [['orcCage', 0.62], ['meatGallows', 0.8], ['spikeBar', 1.1], ['orcCage', 1.35], ['chopBlock', 1.9], ['spikeBar', 2.3], ['orcCage', 2.6], ['meatGallows', 3.3], ['spikeBar', 3.6], ['skullPile', 4.4], ['spikeBar', 5.0], ['orcCage', 5.5]];
      for (const [nm, t] of ring) add(nm, CX + Math.cos(t) * (rx + 46), CY + Math.sin(t) * (ry + 34));
      for (let i = 0; i < 6; i++) add(pick(['boneHeap', 'skullPike']), rand(A.x0 + 40, A.x1 - 40), pick([rand(A.y0 + 40, A.y0 + 90), rand(A.y1 - 70, A.y1 - 30)]));
      return;
    }
    const topY = A.y0 + 16, nx = DOOR.n.x;
    if (r.doors.n != null) { add('skullPike', nx - 40, topY); add('skullPike', nx + 40, topY); }
    const n = Math.max(1, Math.floor(W0 / 240));
    for (let i = 0; i < n; i++) if (Math.random() < 0.75) { const x = A.x0 + 50 + (i + rand(0.2, 0.8)) * (W0 - 100) / n; if (Math.abs(x - nx) > 70) add(pick(['meatRack', 'meatGallows', 'orcCage', 'hideRack', 'orcFire', 'skullPike', 'skullPile']), x, topY + 4); }
    const cs = [[A.x0 + 26, A.y0 + 30], [A.x1 - 26, A.y0 + 30], [A.x0 + 26, A.y1 - 24], [A.x1 - 26, A.y1 - 24]].sort(() => Math.random() - 0.5);
    add('orcFire', ...cs[0]); if (Math.random() < 0.6) add('orcFire', ...cs[1]);
    for (let i = 0; i < 3 + W0 * H0 / 160000; i++) add(pick(['boneHeap', 'boneHeap', 'skullPike', 'chopBlock', 'spikeBar', 'skullPile', 'orcCage', 'woodPile']), rand(A.x0 + 40, A.x1 - 40), rand(A.y0 + 40, A.y1 - 30));
  }

  // 3px 칸으로 그리던 맵을 1.5배 칸 수로 늘려 2px 칸으로 (크기는 그대로, 외곽선은 1칸으로 다시)
  function upMap(rows, f) {
    const h = rows.length, w = Math.max(...rows.map(r => r.length)), W2 = Math.round(w * f), H2 = Math.round(h * f);
    let g = Array.from({ length: H2 + 2 }, (_, y) => Array.from({ length: W2 + 2 }, (_, x) => { const sy = Math.floor((y - 1) / f), sx = Math.floor((x - 1) / f); return y >= 1 && x >= 1 && rows[sy] ? (rows[sy][sx] || '.') : '.'; }));
    for (let it = 0; it < 2; it++) { const kill = []; for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (g[y][x] === 'k' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => ((g[y + b] || [])[x + a] || '.') === '.')) kill.push([x, y]); for (const [x, y] of kill) g[y][x] = '.'; }
    g = gOutline(g);
    return g.map(r => r.join(''));
  }
  function bossMap2() { if (!MAPS.boss2) MAPS.boss2 = upMap(MAPS.boss, 1.5); return 'boss2'; }

  // ---------------------------------------------------------------- 보상
  function bossDefeated(b) {
    window.AudioSys.setMood('rest', true);
    slowmo = 1.6; flashT = 0.2; flashColor = '#ffffff';
    G.vortex = null; G.tele = [];
    G.enemies.forEach(e => { if (!e.dead && e !== b) killEnemy(e, true); });
    banner(G.stage < lastStage() ? `STAGE ${G.stage} 보스 처치` : '대족장 처치', '전리품 상자를 열어라 · 탐색을 마치면 붉은 출구로');
    { const R = G.dun.cur; R.cleared = true; G.rs.state = 'done'; sealRoom(false); if (R.exitP) R.exit = R.exitP; } // v1.01: 보스를 잡아도 바로 넘어가지 않는다
    const n = G.stage === 3 ? (Math.random() < 0.25 ? 3 : 2) : Math.random() < 0.25 ? 2 : 1;
    G.newItems = []; const items = [];
    for (let i = 0; i < n; i++) items.push(makeItem(G.cls, G.stage === 3 ? { grade: rollGradeW([40, 38, 18, 4]), legendFx: 'tusk' } : {}));
    G.dun.cur.chest = { x: CX, y: CY - 10, opened: false, kind: 'boss', items, fall: 1 }; // v0.98: 보스 장비는 하늘에서 떨어지는 상자로
    if (Math.random() < 0.4) G.crystal++;
    if (G.stage === 3) G.crystal++;
    G.clear = true;
  }
  function itemCard(it, withEquip, isNew) {
    const g = gradeOf(it), sl = slotOf(it), eq = eqOf()[it.slot] === it.id, ok = canEquip(it, CUR), v = itemVal(it);
    const statTxt = it.stat === 'crit' ? `치명 확률 +${v}%` : `${sl.label} +${v}`;
    const fx = (it.fx ? `<div class="fx">★ ${LEGEND_FX[it.fx].d}</div>` : '') + itemExtra(it, it.cls || CUR);
    const btn = withEquip ? (ok ? `<button class="pbtn" data-eq="${it.id}">${eq ? '장착 중' : '장착'}</button>` : `<span class="f7" style="color:var(--quiet)">${CLASSES[it.cls].n} 전용</span>`) : '';
    return `<div class="item" style="--c:${g.c}">${isNew ? '<span class="new">NEW</span>' : ''}<div class="gr">${g.n} · ${slotName(it)}</div><div class="nm">${it.name}${it.lv ? ` <span style="color:var(--gold-l)">+${it.lv}</span>` : ''}</div><div>${statTxt}</div>${it.opts.map(o => `<div>${optText(o)}</div>`).join('')}${fx}${btn}</div>`;
  }
  function statLine(cls) {
    const s = calcStats([], cls || CUR);
    return `${CLASSES[cls || CUR].n} 현재 장비 — 공격력 ${s.atk.toFixed(0)} · 방어력 ${s.def.toFixed(0)} · HP ${s.hp} · 치명 ${(s.crit * 100).toFixed(0)}% · 치명 피해 ${(s.critDmg * 100).toFixed(0)}% · 쿨감 ${(s.cdr * 100).toFixed(0)}%`;
  }
  let resultShowAll = false, resultWin = false;
  function showResult(win) {
    mode = 'result'; resultWin = win;
    window.AudioSys.setMood(win ? 'rest' : 'title', true);
    G.lostItems = SAVE.inv.length;
    let opened = false;
    if (win) { takeBossItems(); commitRunMats(); SAVE.clears++; if (G.stage === 3) SAVE.clears3 = (SAVE.clears3 || 0) + 1; }
    else wipeRunItems(); // 사망·포기: 이번 런의 장비·재료·골드를 모두 잃는다
    SAVE.best = Math.max(SAVE.best || 0, (G.stage - 1) * 11 + G.phase);
    persist();
    resultShowAll = false;
    $('resTitle').textContent = win ? '토벌 완료' : '사망';
    $('resTitle').style.color = win ? 'var(--gold-l)' : '#ff7070';
    $('resSub').textContent = win ? `STAGE ${G.stage === 3 ? '1 · 2 · 3' : '1 · 2'} 돌파 · 처치 수 ${G.kills} · ${opened ? '오크 부락이 열렸다 — 다음 토벌은 STAGE 3까지 이어진다' : '다음 토벌은 다시 빈손으로 시작한다'}` : `STAGE ${G.stage} ${G.dun && G.dun.cur ? ROOM_N[G.dun.cur.type] : ''}에서 쓰러졌다 · 장비 ${G.lostItems}개와 모든 재료·골드를 잃었다`;
    renderResultItems(win);
    $('ovResult').classList.add('on');
  }
  function renderResultItems(win) {
    const list = !win ? [] : resultShowAll ? SAVE.inv.slice().reverse() : [...G.newItems, ...G.fieldItems];
    $('resItems').innerHTML = list.length ? list.map(it => itemCard(it, true, !resultShowAll)).join('') : `<p>${!win ? '남은 장비가 없다.' : resultShowAll ? '보유 장비가 없다.' : '획득한 장비가 없다.'}</p>`;
    $('resMats').innerHTML = win ? `이번 런 — 골드 ${G.gold} · 철광석 조각 ${G.iron} · 정령의 결정 ${G.crystal} · 현장 장비 ${G.fieldItems.length}` : `<span style="color:#ff7070">잃음 — 골드 ${G.gold} · 철광석 조각 ${G.iron} · 정령의 결정 ${G.crystal} · 장비 ${G.lostItems}</span>`;
    $('resStats').textContent = statLine();
    $('btnInv').textContent = resultShowAll ? '이번 획득만 보기' : `장비 전체 보기 (${SAVE.inv.length})`;
    $('btnInv').style.display = win ? '' : 'none';
    $('resItems').querySelectorAll('[data-eq]').forEach(bt => bt.addEventListener('click', () => {
      const it = SAVE.inv.find(i => i.id === +bt.dataset.eq);
      eqOf()[it.slot] = it.id; persist(); sfx('select'); renderResultItems(win);
    }));
  }

  // ---------------------------------------------------------------- 휴식
  function openRest() {
    mode = 'rest';
    const keysB = Object.keys(BUFFS).filter(k => !G.buffs.includes(k));
    const opts = [];
    while (opts.length < 3 && keysB.length) opts.push(keysB.splice(randi(0, keysB.length - 1), 1)[0]);
    $('restChoices').innerHTML = opts.map((k, i) => `<button class="choice pf" data-b="${k}"><canvas class="px" width="16" height="16" data-icon="${k}"></canvas><b>${BUFFS[k].n}</b>${BUFFS[k].d}<br><span class="key">${i + 1}</span></button>`).join('');
    $('restChoices').querySelectorAll('canvas[data-icon]').forEach(c => drawIcon(c, BUFF_ICON[c.dataset.icon]));
    $('restChoices').querySelectorAll('[data-b]').forEach(bt => bt.addEventListener('click', () => chooseBuff(bt.dataset.b)));
    $('ovRest').classList.add('on');
  }
  function chooseBuff(k) {
    G.buffs.push(k);
    G.stats = calcStats(G.buffs);
    G.player.hp = G.stats.hp;
    $('ovRest').classList.remove('on');
    sfx('select');
    mode = 'play';
    restDone();
  }

  // ---------------------------------------------------------------- 배너
  let bannerTimer = null;
  function banner(t, sub) {
    const el = $('banner');
    el.innerHTML = `<div class="b1">${t}</div>${sub ? `<div class="b2 out">${sub}</div>` : ''}`;
    el.style.opacity = 1;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => { el.style.opacity = 0; }, 1500);
  }

  // ---------------------------------------------------------------- 업데이트
  const SAFE = { cx: (136 + VW) / 2, cy: (70 + 350) / 2 }; // UI 패널을 뺀 화면 영역의 중심
  // ---------------------------------------------------------------- 압박감 (v0.31)
  // 가까이 몰린 적이 많을수록 화면이 조여 오고(줌·어두운 테두리) 심장이 뛴다. 공격 직전 적은 으르렁거린다. 맞으면 살짝 밀려난다
  const WIND_STATES = new Set(['wind', 'hold', 'sqz', 'leap', 'dash', 'spit', 'bilecharge', 'dive']);
  function updatePressure(dt) {
    const P = G.player;
    G.slotT = (G.slotT || 0) - dt; if (G.slotT <= 0) { G.slotT = 0.4; assignSlots(); }
    let p = 0;
    for (const e of G.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - P.x, e.y - P.y);
      if (d < 160) p += (1 - d / 160) * (e.type === 'boss' ? 2.5 : isElite(e) ? 2 : 1);
      if (e.state !== e.pst) { if (WIND_STATES.has(e.state) && d < 240 && (G.growlT || 0) <= 0) { G.growlT = 0.22; sfx('growl', rand(0.8, 1.3)); } e.pst = e.state; }
    }
    G.growlT = (G.growlT || 0) - dt;
    G.press = (G.press || 0) + (p - (G.press || 0)) * Math.min(1, dt * 3);
    if (G.press > 1.3 && !P.dead) { G.beatT = (G.beatT || 0) - dt; if (G.beatT <= 0) { G.beatT = clamp(1.05 - G.press * 0.1, 0.5, 1); sfx('beat'); setTimeout(() => sfx('beat2'), 150); } }
    zoomK = Math.max(zoomK, Math.min(0.022, G.press * 0.006));
    // 맞고 밀려남
    if (P.kx || P.ky) {
      P.x += P.kx * dt; P.y += P.ky * dt; const k = Math.pow(0.0008, dt); P.kx *= k; P.ky *= k;
      if (Math.abs(P.kx) + Math.abs(P.ky) < 6) P.kx = P.ky = 0;
      solveObs(P, P.r); P.x = clamp(P.x, A.x0 + P.r, A.x1 - P.r); P.y = clamp(P.y, A.y0 + P.r, A.y1 - P.r);
    }
  }
  function updateCamera(dt, snap) {
    const P = G.player;
    // v1.07: 카메라는 캐릭터에 딱 붙음 (늦게 따라가며 미끄러지던 것·조준 방향 쏠림 제거). 보스전에서 보스 쪽 15% 보정만 천천히 바뀜
    const bk = snap ? 1 : Math.min(1, dt * 2.5), bxT = G.boss && !G.boss.dead ? (G.boss.x - P.x) * 0.15 : 0, byT = G.boss && !G.boss.dead ? (G.boss.y - P.y) * 0.15 : 0;
    cam.bx = (cam.bx || 0) + (bxT - (cam.bx || 0)) * bk; cam.by = (cam.by || 0) + (byT - (cam.by || 0)) * bk;
    let tx = P.x - SAFE.cx + cam.bx, ty = P.y - 10 - SAFE.cy + cam.by;
    { const x0 = A.x0 - 136, x1 = A.x1 + 16 - VW, y0 = A.y0 - (G.stage === 3 && G.dun && G.dun.cur && G.dun.cur.type === 'boss' ? 150 : 100), y1 = A.y1 + 88 - VH;
      const cx = x1 >= x0 ? clamp(tx, x0, x1) : (x0 + x1) / 2, cy = y1 >= y0 ? clamp(ty, y0, y1) : (y0 + y1) / 2; cam.clX = cx !== tx; cam.clY = cy !== ty; tx = cx; ty = cy; }
    cam.x = tx; cam.y = ty;
  }
  function update(rdt) {
    time += rdt;
    if (G) for (const a of G.ash) { a.x += (a.vx + Math.sin(time + a.y * 0.05) * 6) * rdt; a.y += a.vy * rdt; if (a.y > VH) { a.y = -4; a.x = rand(0, VW); } if (a.y < -6) a.y = VH; if (a.x < 0) a.x += VW; if (a.x > VW) a.x -= VW; }
    if (mode === 'map' && G) { updateMap(); return; }
    if (mode !== 'play') return;
    if (take('escape')) { openPause(); return; }
    if (take('tab')) { openMap(); return; }
    if (take('i')) { if (!G.player.dead && !G.trans) openInv('play'); return; }
    if (take('h')) { G.kg = !G.kg; G.kgT = G.kg ? 999 : 0; sfx('blip'); }
    if (G.kg && G.kgT < 900) { G.kgT -= rdt; if (G.kgT <= 0) G.kg = false; }
    const dbgK = k => { if (pressed[k] !== 'shift') return false; pressed[k] = false; return true; }; // v1.14 테스트 키는 Shift와 함께 (Shift+N·B·V·T), 그냥 누르면 아무 일 없음
    if (dbgK('n') && !G.clear) debugClearRoom();
    if (dbgK('v')) { debugStageClear(); return; }
    if (dbgK('t')) { // 테스트: 무기 등급 순환 (커먼 → 레어 → 유니크 → 레전더리)
      const gk = ['common', 'rare', 'unique', 'legend'][(weaponTier(G.cls) + 1) % 4];
      const it = makeItem(G.cls, { grade: gk, slot: 'weapon' });
      SAVE.inv.push(it); eqOf(G.cls).weapon = it.id; G.stats = calcStats(G.buffs); persist();
      lootFeed(`<b style="color:${gradeOf(it).c}">[${gradeOf(it).n}] ${it.name}</b> 장착 (테스트)`, gradeOf(it).c); sfx('drop');
    }
    if (dbgK('b') && !G.clear && G.dun.cur.type !== 'boss') debugToBoss();

    shake = Math.max(0, shake - rdt * 22);
    shakeX *= Math.pow(0.001, rdt); shakeY *= Math.pow(0.001, rdt);
    flashT = Math.max(0, flashT - rdt);
    zoomK *= Math.pow(0.0004, rdt); if (zoomK < 0.001) zoomK = 0;
    stopHeat = Math.max(0, stopHeat - rdt * 1.5);
    for (const e of G.enemies) if (e.shk > 0) e.shk -= rdt;
    if (G.combo && G.combo.pop > 0) G.combo.pop -= rdt;
    if (updateTrans(rdt)) return;
    if (hitstop > 0) { hitstop -= rdt; return; }
    let dt = rdt;
    if (slowmo > 0) { slowmo -= rdt; dt *= 0.35; }

    updatePlayer(dt);
    updatePressure(dt);
    updateRoom(dt);
    updateCamera(dt);
    updateProj(dt);
    updateEProj(dt);
    updateOrcWorld(dt);
    for (const e of G.enemies) if (!e.dead) { if (e.type === 'boss') { if (e.kind === 'slimeking') { updateSlimeKing(e, dt); slimeKingStage(e); } else if (e.kind === 'krugash') updateKrugash(e, dt); else { updateBoss(e, dt); bossStageCheck(e); } } else if (e.hitStun > 0 && e.state === 'chase') hitStunTick(e, dt); else { e.hitStun = 0; updateEnemy(e, dt); } }
    const P = G.player;
    const live = G.enemies.filter(e => !e.dead);
    for (let i = 0; i < live.length; i++) {
      const a = live[i];
      for (let j = i + 1; j < live.length; j++) {
        const b = live[j], d = dist(a, b), m = a.r + b.r;
        if (d < m && d > 0.01) { const push = (m - d) / 2, ux = (a.x - b.x) / d, uy = (a.y - b.y) / d; if (a.type !== 'boss' && a.type !== 'flag') { a.x += ux * push; a.y += uy * push; } if (b.type !== 'boss' && b.type !== 'flag') { b.x -= ux * push; b.y -= uy * push; } }
      }
      if (!P.dead && P.state !== 'dodge' && P.state !== 'charge') {
        const d = dist(a, P), m = a.r + P.r - 2;
        if (d < m && d > 0.01) { const ux = (P.x - a.x) / d, uy = (P.y - a.y) / d; P.x += ux * (m - d); P.y += uy * (m - d); }
      }
      if (a.type !== 'crow' && !(a.type === 'boss' && (a.kind === 'krugash' || a.state === 'jump' || a.z > 0))) solveObs(a, a.r);
      a.x = clamp(a.x, A.x0 + a.r, A.x1 - a.r); a.y = clamp(a.y, A.y0 + a.r, A.y1 - a.r);
    }
    G.enemies = G.enemies.filter(e => !e.dead || e.type === 'boss');
    G.tele = G.tele.filter(t => !t.oa || (t.owner && !t.owner.dead && t.owner.state === 'seq'));
    for (const t of G.tele) {
      t.t += dt;
      if (t.pin) { const Q = t.owner && t.owner.air; if (Q) { t.x = Q.x1; t.y = Q.y1; } }
      if (t.owner && !t.owner.dead && t.follow && t.t < t.dur * 0.6) { t.x = t.owner.x; t.y = t.owner.y; t.ang = angTo(t.owner, P); if (t.owner.sw == null && t.owner.blade) t.owner.bladeTarget = t.ang - ((t.owner.step % 2 ? 1 : -1) * t.owner.face) * 115 * DEG; }
      if (t.track && t.t < t.dur - 0.6) { t.x += (P.x - t.x) * Math.min(1, dt * 6); t.y += (P.y - t.y) * Math.min(1, dt * 6); }
    }
    const fired = G.tele.filter(t => t.t >= t.dur);
    G.tele = G.tele.filter(t => t.t < t.dur);
    for (const t of fired) {
      if (t.shape !== 'spawn' && t.shape !== 'line' && !t.noImpact) G.fx.push({ kind: 'impact', shape: t.shape, x: t.x, y: t.y, r: t.r, ang: t.ang, arc: t.arc, t: t.heavy ? 0.3 : 0.2, max: t.heavy ? 0.3 : 0.2, mark: t.mark });
      if (isKrug(t.owner) && !t.owner.dead && t.shape !== 'line' && t.shape !== 'spawn' && t.ff !== false) krugHitShape(t, t.owner.atk * 0.8, t.owner);
      t.onFire && t.onFire(t);
    }
    for (const h of G.hazards) {
      h.t -= dt;
      if (Math.hypot(P.x - h.x, P.y - h.y) < h.r + P.r - 3) { h.tick -= dt; if (h.tick <= 0) { h.tick = 0.5; hurtPlayer(4, null, false, true); } }
    }
    G.hazards = G.hazards.filter(h => h.t > 0);
    updateVortex(dt);
    for (const p of G.parts) {
      p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.96;
      if (p.floor && p.y > p.floor && p.g > 0) { if (p.c === '#8f1418' || p.c === '#a3161c') { dg.fillStyle = 'rgba(100,10,16,.6)'; dg.fillRect(Math.round(p.x), Math.round(p.y), 2, 1); } p.t = 0; }
    }
    G.parts = G.parts.filter(p => p.t > 0);
    for (const n of G.nums) { n.t -= dt; n.pop = Math.max(0, (n.pop || 0) - dt); n.x += (n.vx || 0) * dt; n.vx = (n.vx || 0) * Math.pow(0.02, dt); n.vy = (n.vy == null ? -24 : Math.min(-14, n.vy + 160 * dt)); n.y += n.vy * dt; }
    if (G.combo && G.combo.n > 0) { G.combo.t -= dt; if (G.combo.t <= 0) G.combo.n = 0; }
    if (G.corpses) { for (const c of G.corpses) updateCorpse(c, dt); G.corpses = G.corpses.filter(c => c.t > 0); }
    G.nums = G.nums.filter(n => n.t > 0);
    for (const f of G.fx) { f.t -= dt; if (f.grow) f.r += f.grow * dt; if (f.kind === 'spark') { f.x += Math.cos(f.ang) * f.sp * dt; f.y += Math.sin(f.ang) * f.sp * dt; } }
    G.fx = G.fx.filter(f => f.t > 0);
    for (const d of G.drops) d.t += dt;
    updateLoot(dt);
    updateMProj(dt); updateMeteor(dt);
    P.hpBack += (P.hp - P.hpBack) * Math.min(1, rdt * 3);
  }

  // ---------------------------------------------------------------- 렌더
  // 텔레그래프: 바닥(어둠 아래) + 발광(조명 위) 두 단계로 그린다
  function telePath(t, k = 1) {
    ctx.beginPath();
    if (t.shape === 'circle') ctx.arc(t.x, t.y, Math.max(0.1, t.r * k), 0, TAU);
    else if (t.shape === 'cone') { ctx.moveTo(t.x, t.y); ctx.arc(t.x, t.y, Math.max(0.1, t.r * k), t.ang - t.arc / 2, t.ang + t.arc / 2); ctx.closePath(); }
    else if (t.shape === 'line') {
      const ux = Math.cos(t.ang), uy = Math.sin(t.ang), nx = -uy * t.w / 2, ny = ux * t.w / 2, L = t.len * k;
      ctx.moveTo(t.x + nx, t.y + ny); ctx.lineTo(t.x + ux * L + nx, t.y + uy * L + ny); ctx.lineTo(t.x + ux * L - nx, t.y + uy * L - ny); ctx.lineTo(t.x - nx, t.y - ny); ctx.closePath();
    }
  }
  function teleFront(t, p) {
    ctx.beginPath();
    if (t.shape === 'circle') ctx.arc(t.x, t.y, Math.max(0.1, t.r * p), 0, TAU);
    else if (t.shape === 'cone') ctx.arc(t.x, t.y, Math.max(0.1, t.r * p), t.ang - t.arc / 2, t.ang + t.arc / 2);
    else if (t.shape === 'line') { const ux = Math.cos(t.ang), uy = Math.sin(t.ang), cx = t.x + ux * t.len * p, cy = t.y + uy * t.len * p; ctx.moveTo(cx - uy * t.w / 2, cy + ux * t.w / 2); ctx.lineTo(cx + uy * t.w / 2, cy - ux * t.w / 2); }
  }
  function teleEdgePoint(t) {
    if (t.shape === 'circle') { const a = rand(0, TAU); return { x: t.x + Math.cos(a) * t.r, y: t.y + Math.sin(a) * t.r }; }
    if (t.shape === 'cone') { const a = t.ang + rand(-t.arc / 2, t.arc / 2); return { x: t.x + Math.cos(a) * t.r, y: t.y + Math.sin(a) * t.r }; }
    const k = rand(0, 1), sd = Math.random() < 0.5 ? 1 : -1;
    return { x: t.x + Math.cos(t.ang) * t.len * k - Math.sin(t.ang) * t.w / 2 * sd, y: t.y + Math.sin(t.ang) * t.len * k + Math.cos(t.ang) * t.w / 2 * sd };
  }
  // 직선 예고(돌진선 등)의 양끝을 디더링으로 흐리게 (v0.80): 가운데는 그대로, 끝 쪽 F px는 2px 칸 베이어 디더로 점점 성기게 잘라낸 클립 안에 그린다
  function withLineFade(t, draw) {
    const F = Math.min(72, t.len * 0.3), W = t.w / 2 + 16, ux = Math.cos(t.ang), uy = Math.sin(t.ang), nx = -uy, ny = ux;
    ctx.save(); ctx.beginPath();
    const P4 = (u0, u1) => { ctx.moveTo(t.x + ux * u0 + nx * W, t.y + uy * u0 + ny * W); ctx.lineTo(t.x + ux * u1 + nx * W, t.y + uy * u1 + ny * W); ctx.lineTo(t.x + ux * u1 - nx * W, t.y + uy * u1 - ny * W); ctx.lineTo(t.x + ux * u0 - nx * W, t.y + uy * u0 - ny * W); ctx.closePath(); };
    if (t.len > F * 2) P4(F, t.len - F);
    for (const [ua, ub, dir] of [[-6, F, 1], [t.len - F, t.len + 26, -1]]) {
      const cs = [[ua, -W], [ua, W], [ub, -W], [ub, W]].map(([u, v]) => [t.x + ux * u + nx * v, t.y + uy * u + ny * v]);
      const x0 = Math.floor(Math.min(...cs.map(c => c[0])) / 2) * 2, x1 = Math.max(...cs.map(c => c[0])), y0 = Math.floor(Math.min(...cs.map(c => c[1])) / 2) * 2, y1 = Math.max(...cs.map(c => c[1]));
      for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) {
        const dx = x + 1 - t.x, dy = y + 1 - t.y, u = dx * ux + dy * uy, v = dx * nx + dy * ny; if (u < ua || u > ub || Math.abs(v) > W) continue;
        const k = dir > 0 ? (u + 6) / (F + 6) : (t.len + 26 - u) / (F + 26); if (dith(x >> 1, y >> 1, Math.min(1, k * 1.05))) ctx.rect(x, y, 2, 2);
      }
    }
    ctx.clip(); draw(); ctx.restore();
  }
  function drawTele(t) {
    if (t.shape === 'line' && !t.fading) { t.fading = true; withLineFade(t, () => drawTele(t)); t.fading = false; return; }
    const p = clamp(t.t / t.dur, 0, 1);
    ctx.save();
    if (t.shape === 'spawn') {
      const k = 0.5 + p * 0.7, c = t.portal ? '120,170,255' : '150,60,180';
      ctx.fillStyle = `rgba(20,6,26,${0.5 + p * 0.4})`;
      ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * k, t.r * 0.45 * k, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(${c},${0.4 + p * 0.5})`; ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) { const a = time * 3 + i / 8 * TAU; ctx.fillStyle = `rgba(${c},${0.5 + p * 0.5})`; ctx.fillRect(Math.round(t.x + Math.cos(a) * t.r * k * 1.15), Math.round(t.y + Math.sin(a) * t.r * 0.5 * k * 1.15), 2, 1); }
      ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * k, t.r * 0.45 * k, 0, 0, TAU); ctx.stroke();
      if (Math.random() < 0.5) G.parts.push({ x: t.x + rand(-t.r, t.r) * 0.7, y: t.y, vx: 0, vy: -rand(20, 50), t: 0.5, c: t.portal ? '#9cc1ea' : '#5a1f78', g: 0, glow: !!t.portal });
      ctx.restore(); return;
    }
    if (t.mark) { drawMarkTele(t, p); ctx.restore(); return; }
    if (isBossTele(t)) { drawBossTele(t, p); ctx.restore(); return; }
    const col = t.mark ? '120,30,170' : '170,10,20';
    ctx.fillStyle = `rgba(${col},${0.22 + 0.16 * p})`; telePath(t); ctx.fill();
    // 내부 경고 빗금 (흐름)
    telePath(t); ctx.clip();
    const R = (t.shape === 'line' ? t.len : t.r) + 20, off = (time * 40) % 14;
    ctx.strokeStyle = `rgba(${t.mark ? '170,70,230' : '230,30,40'},${0.18 + 0.22 * p})`; ctx.lineWidth = 4;
    for (let d = -R * 2; d < R * 2; d += 14) { ctx.beginPath(); ctx.moveTo(t.x + d + off - R, t.y - R); ctx.lineTo(t.x + d + off + R, t.y + R); ctx.stroke(); }
    // 차오르는 진행도
    ctx.fillStyle = `rgba(${t.mark ? '160,60,220' : '220,25,30'},${0.25 + 0.35 * p})`; telePath(t, p); ctx.fill();
    ctx.restore();
  }
  // ---------- 보스 패턴 경고 (v0.62): 일반 몬스터의 붉은 빗금과 다르게 — 짙은 진홍 바탕 + 금빛 이중 테두리 · 돌아가는 룬 · 밖으로 퍼지는 파문/쉐브론 · 가운데 해골 문장
  const isBossTele = t => t.owner && t.owner.type === 'boss' && !t.mark;
  const SKULL = ['.kkkkk.', 'kwwwwwk', 'kwkwkwk', 'kwwwwwk', '.kwkwk.', '..kkk..'];
  function teleCenter(t) { if (t.shape === 'circle') return { x: t.x, y: t.y }; const L = t.shape === 'line' ? t.len * 0.5 : t.r * 0.55; return { x: t.x + Math.cos(t.ang) * L, y: t.y + Math.sin(t.ang) * L }; }
  function drawBossTele(t, p) {
    ctx.fillStyle = `rgba(70,4,24,${0.38 + 0.2 * p})`; telePath(t); ctx.fill();
    telePath(t); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    if (t.shape === 'line') { // 진행 방향으로 흐르는 금빛 쉐브론
      const ux = Math.cos(t.ang), uy = Math.sin(t.ang), step = 18, off = (time * 120) % step, s2 = t.w * 0.42;
      ctx.lineWidth = 3;
      for (let d = off - step; d < t.len + step; d += step) { const cx = t.x + ux * d, cy = t.y + uy * d; ctx.strokeStyle = `rgba(255,${150 + 60 * p},60,${0.25 + 0.35 * p})`; ctx.beginPath(); ctx.moveTo(cx - ux * s2 - uy * s2, cy - uy * s2 + ux * s2); ctx.lineTo(cx, cy); ctx.lineTo(cx - ux * s2 + uy * s2, cy - uy * s2 - ux * s2); ctx.stroke(); }
    } else { // 중심에서 밖으로 퍼지는 파문
      const R = t.r, sp = 26;
      for (let k = 0; k < 4; k++) { const rr = ((time * 70 + k * R / 4) % R); ctx.strokeStyle = `rgba(255,${120 + 100 * (rr / R)},60,${(0.15 + 0.35 * p) * (1 - rr / R * 0.6)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(t.x, t.y, Math.max(1, rr), 0, TAU); ctx.stroke(); }
      if (t.shape === 'cone') for (let i = -2; i <= 2; i++) { const a = t.ang + i / 2 * t.arc / 2 * 0.85; ctx.strokeStyle = `rgba(255,200,90,${0.12 + 0.2 * p})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(t.x + Math.cos(a) * R, t.y + Math.sin(a) * R); ctx.stroke(); }
    }
    // 차오르는 진행도: 진홍 → 금빛
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(${200 + 55 * p},${40 + 120 * p * p},${30},${0.22 + 0.3 * p})`; telePath(t, p); ctx.fill();
  }
  function drawBossTeleGlow(t, p) {
    const near = p > 0.75, flick = near ? (Math.floor(time * 26) % 2 ? 1 : 0.45) : 0.8 + Math.sin(time * 9) * 0.2;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // 이중 테두리: 바깥 금빛 두꺼운 선 + 안쪽 흰 선
    ctx.strokeStyle = `rgba(255,190,70,${(0.6 + 0.4 * p) * flick})`; ctx.lineWidth = 3; telePath(t); ctx.stroke();
    ctx.strokeStyle = `rgba(255,245,220,${(0.35 + 0.5 * p) * flick})`; ctx.lineWidth = 1; telePath(t); ctx.stroke();
    ctx.fillStyle = `rgba(255,80,40,${(0.04 + 0.16 * p * p) * flick})`; telePath(t); ctx.fill();
    // 진행 경계선
    ctx.strokeStyle = 'rgba(255,240,200,.95)'; ctx.lineWidth = 2; teleFront(t, p); ctx.stroke();
    // 테두리를 따라 도는 룬 점
    const n = t.shape === 'circle' ? 20 : 14;
    for (let i = 0; i < n; i++) {
      let x, y; const u = (i / n + time * 0.25) % 1;
      if (t.shape === 'circle') { const a = u * TAU; x = t.x + Math.cos(a) * (t.r + 4); y = t.y + Math.sin(a) * (t.r + 4); }
      else if (t.shape === 'cone') { const a = t.ang - t.arc / 2 + u * t.arc; x = t.x + Math.cos(a) * (t.r + 4); y = t.y + Math.sin(a) * (t.r + 4); }
      else { const sd = i % 2 ? 1 : -1; x = t.x + Math.cos(t.ang) * t.len * u - Math.sin(t.ang) * (t.w / 2 + 4) * sd; y = t.y + Math.sin(t.ang) * t.len * u + Math.cos(t.ang) * (t.w / 2 + 4) * sd; }
      ctx.fillStyle = i % 3 ? `rgba(255,210,110,${0.85 * flick})` : `rgba(255,255,255,${flick})`; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, i % 3 ? 2 : 3, i % 3 ? 2 : 3);
    }
    // 가운데 해골 문장 (커졌다 작아지며 깜빡임)
    ctx.globalCompositeOperation = 'source-over';
    if ((t.shape === 'circle' && t.r < 30) || t.quiet) { ctx.restore(); return; } // 작은 원·가시 경고선엔 해골 문장 생략
    const c = teleCenter(t), sc = 2 + (near ? 1 : 0), w = SKULL[0].length * sc, h = SKULL.length * sc, bx = Math.round(c.x - w / 2), by = Math.round(c.y - h / 2 - 4);
    ctx.globalAlpha = (0.55 + 0.45 * p) * flick;
    SKULL.forEach((r, yy) => { for (let xx = 0; xx < r.length; xx++) { const ch = r[xx]; if (ch === '.') continue; ctx.fillStyle = ch === 'k' ? '#2a0408' : near ? '#ffffff' : '#ffd070'; ctx.fillRect(bx + xx * sc, by + yy * sc, sc, sc); } });
    ctx.globalAlpha = 1;
    ctx.restore();
    // 금빛·붉은 불티와 직전의 흰 섬광
    if (Math.random() < 0.95) { const e = teleEdgePoint(t); G.parts.push({ x: e.x, y: e.y, vx: rand(-10, 10), vy: -rand(30, 70), t: 0.55, c: pick(['#ffd070', '#ff6030', '#fff2c0']), g: 0, glow: true }); }
    if (near && Math.random() < 0.5) { const e = teleEdgePoint(t); G.parts.push({ x: e.x, y: e.y, vx: 0, vy: -rand(60, 110), t: 0.35, c: '#ffffff', g: 0, glow: true }); }
  }
  // ---------- 발도르 「죽음의 표식」 (v0.67): 회전하는 이중 마법진 + 조여 오는 조준 괄호 + 보스와 이어진 사슬 + 하늘에서 내려오는 망령 대검
  function drawMarkTele(t, p) {
    const R = t.r, cx = t.x, cy = t.y;
    ctx.fillStyle = `rgba(30,6,48,${0.22 + 0.15 * p})`; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { const rr = R * (1 - ((time * 0.9 + k / 3) % 1)); ctx.strokeStyle = `rgba(190,90,255,${0.35 * (1 - rr / R) + 0.1})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, rr), 0, TAU); ctx.stroke(); } // 안으로 빨려드는 파문
    ctx.restore();
    ctx.fillStyle = `rgba(150,40,220,${0.12 + 0.18 * p})`; ctx.beginPath(); ctx.arc(cx, cy, Math.max(0.1, R * p), 0, TAU); ctx.fill();
  }
  function drawMarkGlow(t, p) {
    const R = t.r, cx = t.x, cy = t.y, near = p > 0.72, flick = near ? (Math.floor(time * 24) % 2 ? 1 : 0.5) : 0.8 + 0.2 * Math.sin(time * 8);
    const b = t.owner, poly = (n, r, a0, step) => { ctx.beginPath(); for (let i = 0; i <= n; i++) { const a = a0 + (i * step % n) / n * TAU; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); };
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // 보스와 이어진 사슬 (추적 중임을 보여 줌)
    if (b && !b.dead) { const dx = cx - b.x, dy = cy - (b.y - 30), L = Math.hypot(dx, dy), n = Math.floor(L / 10); for (let i = 1; i < n; i++) { const k = i / n, w = Math.sin(k * Math.PI) * 10 * Math.sin(time * 3); if ((i + Math.floor(time * 12)) % 3 === 0) continue; ctx.fillStyle = `rgba(200,120,255,${0.25 + 0.35 * p})`; ctx.fillRect(Math.round(b.x + dx * k - dy / L * w) - 1, Math.round(b.y - 30 + dy * k + dx / L * w) - 1, 3, 2); } }
    // 바깥 고리 (두꺼운 보라 + 흰 선) · 룬 눈금 · 반대로 도는 안쪽 고리
    ctx.strokeStyle = `rgba(200,100,255,${(0.7 + 0.3 * p) * flick})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(255,235,255,${0.7 * flick})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R - 3, 0, TAU); ctx.stroke();
    for (let i = 0; i < 24; i++) { const a = time * 0.8 + i / 24 * TAU, l = i % 3 ? 3 : 7; ctx.strokeStyle = `rgba(230,170,255,${0.8 * flick})`; ctx.lineWidth = i % 3 ? 1 : 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - 4), cy + Math.sin(a) * (R - 4)); ctx.lineTo(cx + Math.cos(a) * (R - 4 - l), cy + Math.sin(a) * (R - 4 - l)); ctx.stroke(); }
    ctx.strokeStyle = `rgba(220,150,255,${0.6 * flick})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R * 0.62, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(210,130,255,${(0.5 + 0.4 * p) * flick})`; ctx.lineWidth = 2; poly(5, R * 0.6, -time * 1.4 - Math.PI / 2, 2); // 오망성
    for (let i = 0; i < 5; i++) { const a = -time * 1.4 - Math.PI / 2 + i / 5 * TAU; ctx.fillStyle = `rgba(255,240,255,${flick})`; ctx.fillRect(Math.round(cx + Math.cos(a) * R * 0.6) - 2, Math.round(cy + Math.sin(a) * R * 0.6) - 2, 4, 4); }
    // 조여 오는 조준 괄호 4개
    const g = R * (1.7 - 0.85 * p) + Math.sin(time * 10) * 2, arm = 9;
    ctx.strokeStyle = `rgba(255,${near ? 255 : 120},${near ? 255 : 220},${0.9 * flick})`; ctx.lineWidth = 2;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const x = cx + sx * g * 0.72, y = cy + sy * g * 0.72; ctx.beginPath(); ctx.moveTo(x - sx * arm, y); ctx.lineTo(x, y); ctx.lineTo(x, y - sy * arm); ctx.stroke(); }
    // 하늘에서 내려오는 망령 대검 (닿는 순간 폭발)
    const top = cy - 170 + 140 * p * p, blen = 54, bx = Math.round(cx), al = (0.25 + 0.6 * p) * flick;
    ctx.fillStyle = `rgba(150,60,230,${al * 0.5})`; ctx.fillRect(bx - 5, top - blen - 6, 10, blen + 16);
    ctx.fillStyle = `rgba(230,190,255,${al})`; ctx.fillRect(bx - 2, top - blen, 4, blen); ctx.fillRect(bx - 1, top, 2, 6);
    ctx.fillStyle = `rgba(255,255,255,${al})`; ctx.fillRect(bx - 1, top - blen, 1, blen);
    ctx.fillStyle = `rgba(200,120,255,${al})`; ctx.fillRect(bx - 9, top - blen - 2, 18, 3); ctx.fillRect(bx - 2, top - blen - 12, 4, 10);
    for (let i = 0; i < 3; i++) { const yy = top + 8 + ((time * 160 + i * 20) % Math.max(10, cy - top - 8)); if (yy < cy) { ctx.fillStyle = `rgba(220,160,255,${0.5 * al})`; ctx.fillRect(bx - 1, Math.round(yy), 2, 6); } }
    ctx.globalCompositeOperation = 'source-over';
    // 카운트다운: 박동하며 커진다
    const sec = Math.ceil(t.dur - t.t), beat = 1 - ((t.t % 1)), sc = 3 + (beat > 0.8 ? 1 : 0) + (near ? 1 : 0);
    drawNumber(String(sec), cx, cy - 6, near ? '#ffffff' : '#f0c8ff', sc);
    ctx.restore();
    if (Math.random() < 0.9) { const a = rand(0, TAU), r = R + rand(4, 26); G.parts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, vx: -Math.cos(a) * r * 2.4 - Math.sin(a) * 40, vy: -Math.sin(a) * r * 2.4 + Math.cos(a) * 40, t: 0.32, c: pick(['#d9a8ff', '#b45cff', '#ffffff']), g: 0, glow: true }); }
  }
  function drawTeleGlow(t) {
    if (t.shape === 'spawn') return;
    if (t.shape === 'line' && !t.fading) { t.fading = true; withLineFade(t, () => drawTeleGlow(t)); t.fading = false; return; }
    if (t.mark) return drawMarkGlow(t, clamp(t.t / t.dur, 0, 1));
    if (isBossTele(t)) return drawBossTeleGlow(t, clamp(t.t / t.dur, 0, 1));
    const p = clamp(t.t / t.dur, 0, 1), near = p > 0.72;
    const flick = near ? (Math.floor(time * 24) % 2 ? 1 : 0.35) : 0.75 + Math.sin(time * 10) * 0.25;
    const col = t.mark ? '200,90,255' : '255,40,30';
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${col},${(0.05 + 0.18 * p * p) * flick})`; telePath(t); ctx.fill();
    ctx.strokeStyle = `rgba(${col},${(0.55 + 0.45 * p) * flick})`; ctx.lineWidth = near || t.heavy ? 2 : 1; telePath(t); ctx.stroke();
    if (near) { ctx.strokeStyle = `rgba(255,230,220,${0.55 * flick})`; ctx.lineWidth = 1; telePath(t); ctx.stroke(); }
    // 진행 경계선
    ctx.strokeStyle = `rgba(255,${t.mark ? '210,255' : '200,170'},${0.85})`; ctx.lineWidth = t.heavy ? 2 : 1; teleFront(t, p); ctx.stroke();
    // 돌진 경로 화살표
    if (t.shape === 'line') {
      const ux = Math.cos(t.ang), uy = Math.sin(t.ang), step = 26, off = (time * 140) % step;
      ctx.strokeStyle = `rgba(255,120,100,${0.5 + 0.4 * p})`; ctx.lineWidth = 2;
      for (let d = off; d < t.len - 6; d += step) {
        const cx = t.x + ux * d, cy = t.y + uy * d, s = t.w * 0.28;
        ctx.beginPath(); ctx.moveTo(cx - ux * s - uy * s, cy - uy * s + ux * s); ctx.lineTo(cx, cy); ctx.lineTo(cx - ux * s + uy * s, cy - uy * s - ux * s); ctx.stroke();
      }
    }
    // 표식: 회전하는 문양과 카운트다운
    if (t.mark) {
      for (let i = 0; i < 16; i++) { const a = time * 2.2 + i / 16 * TAU; ctx.fillStyle = `rgba(230,170,255,${0.7 * flick})`; ctx.fillRect(Math.round(t.x + Math.cos(a) * (t.r + 5)) - 1, Math.round(t.y + Math.sin(a) * (t.r + 5)) - 1, 2, 2); }
      for (let i = 0; i < 6; i++) { const a = -time * 3 + i / 6 * TAU; ctx.strokeStyle = `rgba(230,170,255,${0.5 * flick})`; ctx.beginPath(); ctx.moveTo(t.x + Math.cos(a) * t.r * 0.3, t.y + Math.sin(a) * t.r * 0.3); ctx.lineTo(t.x + Math.cos(a + 1.2) * t.r * 0.85, t.y + Math.sin(a + 1.2) * t.r * 0.85); ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over';
      drawNumber(String(Math.ceil(t.dur - t.t)), t.x, t.y - 6, near ? '#ffffff' : '#e6b8ff', 3);
    }
    ctx.restore();
    // 가장자리에서 피어오르는 불씨
    if (Math.random() < (t.heavy ? 0.9 : 0.35)) { const e = teleEdgePoint(t); G.parts.push({ x: e.x, y: e.y, vx: rand(-6, 6), vy: -rand(20, 45), t: 0.45, c: t.mark ? '#d9a8ff' : pick(['#ff4030', '#ff9070']), g: 0, glow: true }); }
  }
  function drawBossAura(b) {
    if (b.dead) return;
    const bl = BLADES.boss, hx = b.x + b.face * 4, hy = b.y - 30;
    if (b.glow > 0) {
      drawBlade(bl, hx, hy, b.bladeAng, 0.35 + 0.5 * b.glow, false, 1, 'lighter');
      const tx = hx + Math.cos(b.bladeAng) * bl.reach, ty = hy + Math.sin(b.bladeAng) * bl.reach;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(tx, ty, 0, tx, ty, 10 + 14 * b.glow);
      gr.addColorStop(0, `rgba(240,200,255,${0.8 * b.glow})`); gr.addColorStop(1, 'rgba(180,90,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(tx - 30, ty - 30, 60, 60);
      ctx.restore();
    }
    // 붉은 눈빛
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const ex = b.x + b.face * 2, ey = b.y - 42;
    ctx.fillStyle = b.stage === 3 ? 'rgba(255,60,80,.9)' : 'rgba(210,130,255,.8)';
    ctx.fillRect(Math.round(ex) - 3, Math.round(ey), 6, 2);
    ctx.restore();
    if (b.stage === 3 && Math.random() < 0.9) G.parts.push({ x: b.x + rand(-14, 14), y: b.y - rand(4, 46), vx: rand(-8, 8), vy: -rand(30, 60), t: 0.45, c: pick(['#ff3050', '#b45cff', '#ff8060']), g: 0, glow: true });
    if (b.stage === 3 && Math.random() < 0.5) G.parts.push({ x: ex, y: ey, vx: -b.face * 40, vy: -10, t: 0.35, c: '#ff3050', g: 0, glow: true });
  }
  function drawShadow(x, y, w) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.32, 0, 0, TAU); ctx.fill(); }
  // 칼날 잔상: 휘두른 궤적을 초승달 모양으로 채운다
  function drawTrail(trail, px, py, rin, rout, col, heavy) {
    if (trail.length < 2) return;
    ctx.save();
    for (let i = 1; i < trail.length; i++) {
      const a0 = trail[i - 1].a, a1 = trail[i].a, life = trail[i].t / 0.11;
      const k = i / trail.length;
      ctx.fillStyle = `rgba(${col},${0.55 * life * (0.35 + 0.65 * k)})`;
      ctx.beginPath();
      ctx.moveTo(px + Math.cos(a0) * rin, py + Math.sin(a0) * rin);
      ctx.lineTo(px + Math.cos(a0) * rout, py + Math.sin(a0) * rout);
      ctx.lineTo(px + Math.cos(a1) * rout, py + Math.sin(a1) * rout);
      ctx.lineTo(px + Math.cos(a1) * rin, py + Math.sin(a1) * rin);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * life * k})`; ctx.lineWidth = heavy ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(px + Math.cos(a0) * rout, py + Math.sin(a0) * rout); ctx.lineTo(px + Math.cos(a1) * rout, py + Math.sin(a1) * rout); ctx.stroke();
    }
    ctx.restore();
  }

  function holdGlow(x, y, k, c) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const r = 6 + 10 * k, gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${c},${0.25 + 0.45 * k})`); gr.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    if (k > 0.75 && Math.floor(time * 24) % 2) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); }
    ctx.restore();
  }
  // 팔도 2px 칸 도트로 만들어 rotW로 돌린다 (v0.57): 위팔 → 팔꿈치 → 아래팔 → 손
  const limbCache = {};
  function cellLimb(kind, pal, len, w, back) {
    const key = kind + pal + len + w + (back ? 'b' : ''); if (limbCache[key]) return limbCache[key];
    const P = PAL[pal], L = Math.round(len / 2), th = Math.max(2, Math.round(w / 2)), zb = kind === 'zombie';
    const C = { k: P.k, h: P.hl ? (back ? P.S : P.hl) : zb ? (back ? '#5e665a' : '#a8b09c') : (back ? '#5a4036' : '#d0a892'), l: back ? P.S : P.s, d: back ? P.S : P.S, D: P.k, c: P.c, C: P.C, a: P.a, A: P.A || P.a, b: P.b };
    const bend = zb ? 28 * DEG : 12 * DEG, L1 = Math.round(L * 0.5), ux = Math.cos(bend), uy = Math.sin(bend), E = { x: L1, y: 0 }, Hh = { x: L1 + ux * (L - L1), y: uy * (L - L1) };
    const cells = new Map(), segD = (x, y, ax, ay, bx, by) => { const vx = bx - ax, vy = by - ay, l0 = vx * vx + vy * vy || 1, t = clamp(((x - ax) * vx + (y - ay) * vy) / l0, 0, 1); return [Math.hypot(x - ax - vx * t, y - ay - vy * t), t, (-(x - ax) * vy + (y - ay) * vx) / Math.sqrt(l0)]; };
    for (let y = -L; y <= L; y++) for (let x = -2; x <= L + 5; x++) {
      const [d1, t1, s1] = segD(x, y, 0, 0, E.x, E.y), [d2, t2, s2] = segD(x, y, E.x, E.y, Hh.x, Hh.y);
      const r1 = th / 2 + 0.3, r2 = (zb ? th - 1 : th) / 2 + 0.2;
      let c = null;
      if (d1 <= r1) c = s1 < -r1 * 0.4 ? 'h' : 'l';
      if (d2 <= r2) c = s2 < -r2 * 0.4 ? 'h' : (zb ? 'd' : 'l');
      if (c && !back && zb && Math.abs(t1 - 0.5) < 0.08 && d1 <= r1) c = 'c'; // 꿰맨 자국
      if (c && !zb && d2 <= r2 && t2 > 0.55 && t2 < 0.8 && Math.round(t2 * 10) % 2 === 0) c = Math.round(t2 * 10) % 4 ? 'c' : 'C'; // 손목 감은 천
      if (Math.hypot(x - Hh.x, y - Hh.y) <= th * 0.75) c = (y - Hh.y) < 0 ? 'l' : 'd';
      if (zb && x > Hh.x && x <= Hh.x + 3 && Math.abs(y - Hh.y - (x - Hh.x) * uy) <= 1.2 && (Math.round(y) - Math.round(Hh.y)) % 2 === 0) c = x >= Hh.x + 3 ? 'b' : 'l'; // 긴 손가락 + 손톱
      if (c) cells.set(x + ',' + y, c);
    }
    if (zb) { cells.set(Math.round(E.x) + ',' + (Math.round(E.y) + Math.ceil(th / 2)), 'b'); const wx = Math.round((E.x + Hh.x) / 2), wy = Math.round((E.y + Hh.y) / 2); cells.set(wx + ',' + wy, 'a'); }
    let mx = 1e9, my = 1e9, Mx = -1e9, My = -1e9; for (const k of cells.keys()) { const [x, y] = k.split(',').map(Number); mx = Math.min(mx, x); my = Math.min(my, y); Mx = Math.max(Mx, x); My = Math.max(My, y); }
    return (limbCache[key] = cellWeapon(Mx - mx + 3, My - my + 3, 1 - mx, 1 - my, C, put => { for (const [k, c] of cells) { const [x, y] = k.split(',').map(Number); put(x + 1 - mx, y + 1 - my, c); } }));
  }
  function drawArm(x, y, ang, len, w, white, back, pal) { drawBlade(cellLimb('arm', pal || 'butcher', len, w, back), x, y, ang, 1, white); }
  function drawArmOld(x, y, ang, len, w, white, back, pal) {
    const P = PAL[pal || 'butcher'], skin = white ? '#ffffff' : back ? P.S : P.s;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(ang);
    ctx.fillStyle = P.k; ctx.fillRect(-2, -w / 2 - 1, len + 2, w + 2);
    ctx.fillStyle = skin; ctx.fillRect(-1, -w / 2, len, w);
    if (!white) {
      ctx.fillStyle = back ? '#5a4036' : '#d0a892'; ctx.fillRect(-1, -w / 2, len, 1);
      ctx.fillStyle = P.c; ctx.fillRect(len - 10, -w / 2 - 1, 2, w + 2); ctx.fillRect(len - 6, -w / 2 - 1, 2, w + 2);
      ctx.fillStyle = P.C; ctx.fillRect(len - 8, -w / 2 - 1, 2, w + 2);
    }
    ctx.fillStyle = P.k; ctx.fillRect(len - 1, -w / 2 - 2, 9, w + 4);
    ctx.fillStyle = skin; ctx.fillRect(len, -w / 2 - 1, 7, w + 2);
    if (!white) { ctx.fillStyle = P.k; ctx.fillRect(len + 3, -w / 2, 1, w); ctx.fillStyle = P.b; ctx.fillRect(len + 4, -w / 2 - 1, 3, 2); ctx.fillRect(len + 1, w / 2 - 1, 2, 2); }
    ctx.restore();
  }
  // 누더기 거인 팔: 위팔 → 팔꿈치(뼈가 비죽) → 아래팔 → 길게 뻗은 손가락. 꿰맨 자국과 썩은 상처
  function drawZombieArm(x, y, ang, len, white, back) { drawBlade(cellLimb('zombie', 'abom', len + 4, 8, back), x, y, ang, 1, white); }
  function drawZombieArmOld(x, y, ang, len, white, back) {
    const P = PAL.abom, skin = white ? '#ffffff' : back ? '#4e564a' : P.s, dark = white ? '#ffffff' : back ? '#363c34' : P.S, hi = white ? '#ffffff' : back ? '#5e665a' : '#a8b09c';
    const hx = x + Math.cos(ang) * len, hy = y + Math.sin(ang) * len;
    let px = -Math.sin(ang), py = Math.cos(ang); if (py < 0) { px = -px; py = -py; }
    const ex = (x + hx) / 2 + px * 4, ey = (y + hy) / 2 + py * 4;
    const seg = (x0, y0, x1, y1, w, col) => { const L = Math.hypot(x1 - x0, y1 - y0); ctx.save(); ctx.translate(Math.round(x0), Math.round(y0)); ctx.rotate(Math.atan2(y1 - y0, x1 - x0)); ctx.fillStyle = col; ctx.fillRect(-1, -w / 2, L + 2, w); ctx.restore(); };
    // 윤곽
    seg(x, y, ex, ey, 9, P.k); seg(ex, ey, hx, hy, 7, P.k);
    // 위팔 (굵고 축 늘어짐) · 아래팔 (말라붙어 가늘다)
    seg(x, y, ex, ey, 7, skin); seg(ex, ey, hx, hy, 5, skin);
    if (!white) {
      seg(x, y, ex, ey, 2, hi); seg(ex, ey, hx, hy, 1, hi);
      const ux = (ex - x), uy = (ey - y);
      ctx.fillStyle = dark; ctx.fillRect(Math.round(x + ux * 0.6 + px * 2), Math.round(y + uy * 0.6 + py * 2), 3, 2);
      ctx.fillStyle = P.c; // 꿰맨 자국
      for (const t of [0.35, 0.6]) { const sx = Math.round(x + ux * t), sy = Math.round(y + uy * t); ctx.fillRect(sx - 1, sy - 2, 1, 4); ctx.fillRect(sx - 2, sy - 1, 3, 1); ctx.fillRect(sx - 2, sy + 1, 3, 1); }
      const fx = ex + (hx - ex) * 0.45, fy = ey + (hy - ey) * 0.45; // 썩은 상처
      ctx.fillStyle = P.A; ctx.fillRect(Math.round(fx) - 1, Math.round(fy) - 1, 3, 3); ctx.fillStyle = P.a; ctx.fillRect(Math.round(fx), Math.round(fy) - 1, 2, 2);
      ctx.fillStyle = P.k; ctx.fillRect(Math.round(ex + px * 3) - 1, Math.round(ey + py * 3) - 1, 4, 4); ctx.fillStyle = P.b; ctx.fillRect(Math.round(ex + px * 3), Math.round(ey + py * 3), 2, 2); // 팔꿈치 뼈
    }
    // 손: 손바닥 + 길게 갈라진 손가락 3개, 끝은 뼈가 드러난 손톱
    ctx.fillStyle = P.k; ctx.fillRect(Math.round(hx) - 3, Math.round(hy) - 3, 7, 7);
    ctx.fillStyle = skin; ctx.fillRect(Math.round(hx) - 2, Math.round(hy) - 2, 5, 5);
    for (const off of [-0.45, 0, 0.45]) {
      const a2 = ang + off, L2 = off ? 6 : 8, tx = hx + Math.cos(a2) * L2, ty = hy + Math.sin(a2) * L2;
      seg(hx, hy, tx, ty, 3, P.k); seg(hx, hy, tx, ty, 1.4, skin);
      if (!white) { ctx.fillStyle = P.b; ctx.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, 2, 2); }
    }
  }
  function drawButcher(e, ya, al) {
    const white = e.flash > 0, lf = e.lift || 0;
    const sq = e.squash > 0 ? 1 - 0.2 * (e.squash / 0.2) : 1 + Math.sin(e.walk * 2) * 0.03;
    const sx = e.squash > 0 ? 1 + 0.18 * (e.squash / 0.2) : 1;
    const crouch = e.state === 'wind' && e.pat === 1 && e.glow < 0.25 ? 1 - 0.14 * (e.glow / 0.25) : 1;
    const tr = e.enraged ? rand(-0.6, 0.6) : 0;
    drawShadow(e.x, e.y + 2, 17 - Math.min(7, lf * 0.3));
    const bp = e.kind === 'hob' ? 'hob' : 'abom';
    // 어깨는 큰 머리 바깥쪽 몸통 끝에 (v0.60: 팔을 들 때 머리 옆에 붙어 보이던 문제)
    const by = e.y + 2 + ya - lf, shY = by - (bp === 'hob' ? 21 : 22) * sq * crouch, so = bp === 'hob' ? 11 : 12;
    const fx = e.x + e.face * so + tr, bx = e.x - e.face * so + tr;
    if (e.armTrail && e.armTrail.length > 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawTrail(e.armTrail, fx, shY, 8, 30, '255,60,40', true); ctx.restore(); }
    if (bp === 'abom') drawZombieArm(bx, shY, e.armB, 20, white, true); else drawArm(bx, shY, e.armB, 20, 5, white, true, bp);
    drawSprite(bp === 'hob' ? 'butcher' : 'abom', bp, 2, e.x + tr, by, e.face < 0, { white, rot: e.lean + (e.grogiT > 0 ? 0.25 * e.face : 0), alpha: al, sx, sy: sq * crouch });
    if (bp === 'abom') drawZombieArm(fx, shY, e.armA, 20, white, false); else drawArm(fx, shY, e.armA, 20, 5, white, false, bp);
    if (e.grogiT > 0) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(by - 50 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); } }
  }
  // ---------- 버프 상태 표시 (v0.92): 타원 선 하나 대신 2px 도트 이펙트
  //  보호막(발도르 망령 방벽 · 주술사 피의 방벽 · 의식 방벽) = 격자 무늬 돔 + 위로 훑는 빛 + 도는 룬 + 맞으면 번쩍, 줄면 금이 감
  //  강화(북·함성·격분) = 발밑 도는 고리 + 솟는 불꽃 혀 + 머리 위 겹화살표
  //  망령 기사 → 발도르로 이어지는 영혼 사슬
  function enemyH(e) { return e.tall || (e.type === 'boss' ? (e.kind === 'slimeking' ? 50 : 64) : e.type === 'ghost' ? 38 : 24 + (e.r || 8) * 1.2); }
  function enemyW(e) { if (e.orc && e.orc !== 'wolf' && e.orc !== 'slave') return orcSprite(e.orc, e.ov).w * 0.5; return Math.max(14, enemyH(e) * 0.42); }
  function buffState(e) {
    if (e.dead) return null;
    const bar = e.type === 'boss' && e.shield ? { c: '150,200,255', h2: '230,245,255', k: 1 } : e.ward > 0 ? { c: '255,60,50', h2: '255,190,170', k: clamp(e.ward / (e.wardMax || e.ward), 0, 1) } : e.armorMul && e.armorMul < 1 && e !== G.boss ? { c: '255,90,40', h2: '255,210,150', k: 1 } : null;
    const emp = e.buffT > 0 || e.drumT > 0 ? '255,60,40' : e.rallyT > 0 ? '255,205,90' : e.frenzyT > 0 ? '255,130,40' : e.haste > 0 ? '255,190,60' : null;
    return bar || emp ? { bar, emp } : null;
  }
  // v0.94: 버프는 발밑 바닥 원으로만 (사용자 결정) — 몸을 덮는 돔·불꽃·화살표 없음
  //  보호막 = 두 겹 고리(바깥 실선 + 안쪽 반대로 도는 점선) + 둘레를 도는 룬 4개 + 디더 바닥 빛, 맞으면 번쩍. 주술사 방벽은 남은 양만큼만 바깥 고리가 이어짐
  //  강화 = 한 겹 끊긴 고리가 빠르게 돌고 안쪽에 맥동하는 디더 빛 + 고리에서 튀는 불티 몇 점
  function drawBuffBack(e) {
    const B = buffState(e); if (!B) return;
    const w = enemyW(e), cx = e.x, cy = e.y + 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const LR = w * 1.25 + 16, Ly = pxLayer(cx - LR - 4, cy - LR * 0.5 - 6, LR * 2 + 8, LR + 12, true); // v1.17 한 장으로
    const dot = (x, y, c, a) => { const v = rgbN(c); Ly.rect(Math.round(x) & ~1, Math.round(y) & ~1, 2, 2, v[0], v[1], v[2], a); };
    const ring = (rx, c, a, rot, gapEvery, len) => { const ry = rx * 0.45, n = Math.max(24, Math.round(rx * 1.7)), m = Math.round(n * (len == null ? 1 : len)); for (let i = 0; i < m; i++) { if (gapEvery && i % gapEvery === 0) continue; const t = i / n * TAU + rot; dot(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, c, a); } };
    const fill = (rx, c, a) => { const ry = rx * 0.45, v = rgbN(c); for (let y = Math.round(cy - ry) & ~1; y <= cy + ry; y += 2) for (let x = Math.round(cx - rx) & ~1; x <= cx + rx; x += 2) { const q = Math.hypot((x - cx) / rx, (y - cy) / ry); if (q < 1 && dith(x >> 1, y >> 1, 0.45 * (1 - q))) Ly.rect(x, y, 2, 2, v[0], v[1], v[2], a); } };
    if (B.bar) {
      const R = w * 1.25 + 10, k = B.bar.k, hit = e.barHit ? Math.max(0, 1 - (time - e.barHit) / 0.3) : 0, pul = 0.5 + 0.5 * Math.sin(time * 3);
      fill(R * 0.95, B.bar.c, (0.22 + 0.12 * pul + hit * 0.3) * (0.5 + 0.5 * k));
      ring(R, B.bar.c, 0.8 + hit * 0.2, -Math.PI / 2, 0, 0.15 + 0.85 * k); // 남은 양만큼 이어지는 바깥 고리
      ring(R + 2, B.bar.h2, (0.25 + hit * 0.6) * (0.4 + 0.6 * k), -Math.PI / 2, 4, 0.15 + 0.85 * k);
      ring(R * 0.72, B.bar.c, 0.55 + hit * 0.3, -time * 1.6, 3);
      for (let i = 0; i < 4; i++) { const t = i / 4 * TAU + time * 0.9, gx = (Math.round(cx + Math.cos(t) * R * 0.86) & ~1) - 3, gy = (Math.round(cy + Math.sin(t) * R * 0.86 * 0.45) & ~1) - 3, g = RUNES[(i * 3 + 1) % RUNES.length];
        const hv = rgbN(B.bar.h2), ha = (0.75 + hit * 0.25) * (0.5 + 0.5 * k); for (let m = 0; m < 9; m++) if (g[m] === '1') Ly.rect(gx + (m % 3) * 2, gy + ((m / 3) | 0) * 2, 2, 2, hv[0], hv[1], hv[2], ha); }
    }
    if (B.emp) {
      const R = w * (B.bar ? 0.75 : 1.0) + 6, pul = 0.5 + 0.5 * Math.sin(time * 7);
      fill(R * 0.9, B.emp, 0.18 + 0.2 * pul);
      ring(R, B.emp, 0.85, time * 3.2, 4);
      ring(R * 0.6, '255,230,170', 0.35 + 0.3 * pul, -time * 2.4, 3);
      if (Math.random() < 0.35) { const t = rand(0, TAU); G.parts.push({ x: cx + Math.cos(t) * R, y: cy + Math.sin(t) * R * 0.45, vx: 0, vy: -rand(20, 40), t: 0.35, c: `rgb(${B.emp})`, g: 0, glow: true }); }
    }
    Ly.flush();
    ctx.restore();
  }
  function drawBuffFront(e) { if (e.type === 'ghost' && !e.dead && G.boss && !G.boss.dead && G.boss.shield) drawSoulChain(e, G.boss); }
  // 망령 기사 → 발도르: 출렁이는 영혼 사슬, 빛 덩이가 발도르 쪽으로 흘러감
  function drawSoulChain(g2, b) {
    const x0 = g2.x, y0 = g2.y - 20, x1 = b.x, y1 = b.y - 34, L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(8, Math.round(L / 6)), nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i <= n; i++) { const t = i / n, wob = Math.sin(t * Math.PI) * Math.sin(time * 5 + t * 9) * 6, x = Math.round(x0 + (x1 - x0) * t + nx * wob) & ~1, y = Math.round(y0 + (y1 - y0) * t + ny * wob) & ~1;
      ctx.fillStyle = `rgba(130,180,250,${i % 2 ? 0.5 : 0.8})`; ctx.fillRect(x, y, 2, 2); ctx.fillRect(x, y + 2, 2, 2); if (i % 3 === 0) { ctx.fillStyle = 'rgba(90,130,210,0.5)'; ctx.fillRect(x + 2, y, 2, 2); ctx.fillRect(x - 2, y + 2, 2, 2); } }
    for (let j = 0; j < 3; j++) { const t = (time * 0.8 + j / 3) % 1, wob = Math.sin(t * Math.PI) * Math.sin(time * 5 + t * 9) * 6, x = Math.round(x0 + (x1 - x0) * t + nx * wob) & ~1, y = Math.round(y0 + (y1 - y0) * t + ny * wob) & ~1;
      ctx.fillStyle = 'rgba(220,240,255,0.95)'; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = 'rgba(150,200,255,0.5)'; ctx.fillRect(x - 4, y, 2, 2); ctx.fillRect(x + 2, y, 2, 2); ctx.fillRect(x, y - 4, 2, 2); ctx.fillRect(x, y + 2, 2, 2); }
    ctx.restore();
  }
  function drawEnemy(e) { drawBuffBack(e); drawEnemyBody(e); drawBuffFront(e); }
  function drawEnemyBody(e) {
    const flip = e.face < 0, white = e.flash > 0;
    const bob = Math.sin(e.walk) * 0.8, sq = 1 + Math.sin(e.walk * 2) * 0.03;
    const rise = e.rise > 0 ? e.rise / 0.35 : 0;
    const ya = rise * 10, al = (1 - rise * 0.8) * (e.fadeA == null ? 1 : e.fadeA);
    const lean = e.lean + (e.state === 'stun' ? 0.2 * e.face : 0);
    if (e.orc) drawOrc(e, ya, al, bob, lean);
    else if (e.type === 'slime' || e.type === 'bigslime' || e.type === 'toxslime') drawSlime(e, ya, al);
    else if (e.type === 'gbrute') drawBrute(e, ya, al);
    else if (e.type === 'boar') drawBoar(e, ya, al);
    else if (e.type === 'crow') drawCrow(e, ya, al);
    else if (e.type === 'mother') drawMother(e, ya, al);
    else if (e.type === 'exec') drawExec(e, ya, al);
    else if (e.type === 'bearer') drawBearer(e, ya, al);
    else if (e.type === 'flag') drawFlagEnt(e, ya, al);
    else if (e.type === 'boss' && e.kind === 'slimeking') drawSlimeKing(e, ya, al);
    else if (e.type === 'goblin' || e.type === 'garcher') {
      drawShadow(e.x, e.y + 1, 8);
      const pal = e.type;
      if (e.state === 'hold') {
        const k = e.state === 'hold' ? 1 - e.t / e.holdMax : e.glow, tr = k > 0.6 ? rand(-0.8, 0.8) : 0;
        drawSprite('goblinUp', pal, 2, e.x + tr, e.y + 2 + ya, flip, { white, rot: -0.12 * e.face * (0.5 + k), sy: 1 + 0.05 * k, alpha: al });
        holdGlow(e.x + e.face * 1, e.y - 26, k, '255,200,60');
      } else drawSprite('goblin', pal, 2, e.x, e.y + 2 + bob + ya, flip, { white, rot: lean, sy: sq, alpha: al });
      if (e.type === 'garcher' && !white) drawBow(e, ya);
    }
    else if (e.type === 'ghoul' && !e.sq) { // 감염된 주민 (원래 디자인)
      drawShadow(e.x, e.y + 1, 9);
      if (e.state === 'hold') {
        const k = 1 - e.t / e.holdMax, tr = k > 0.6 ? rand(-0.8, 0.8) : 0;
        drawSprite('ghoulUp', 'ghoul', 2, e.x + tr, e.y + 2 + ya, flip, { white, rot: -0.12 * e.face * (0.5 + k), sy: 1 + 0.06 * k, alpha: al });
        holdGlow(e.x + e.face * 1, e.y - 26, k, '255,60,40');
      } else drawSprite('ghoul', 'ghoul', 2, e.x, e.y + 2 + bob + ya, flip, { white, rot: lean, sy: sq, alpha: al });
    }
    else if (e.type === 'ghoul') { // v0.95 타락한 종자: 녹슨 장검을 든 견습 기사 (v0.96: 외형 3종 · 칼은 항상 몸 위에)
      drawShadow(e.x, e.y + 1, 9);
      const hold = e.state === 'hold', k = hold ? 1 - e.t / e.holdMax : 0, tr = k > 0.6 ? rand(-0.8, 0.8) : 0;
      const by = e.y + 2 + (hold ? 0 : bob) + ya, hx = e.x + e.face * 6 + tr, hy = by - 12, bl = BLADES.squire, mp = ['squire', 'squireB', 'squireC'][e.sv || 0];
      drawSprite(hold ? mp + 'Up' : mp, 'squire', 2, e.x + tr, by, flip, { white, rot: hold ? -0.12 * e.face * (0.5 + k) : lean, sy: hold ? 1 + 0.05 * k : sq, alpha: al });
      drawTrail(e.trail, hx, hy, 6, bl.reach, '230,220,210');
      drawBlade(bl, hx, hy, e.bladeAng, al, white);
      if (hold) holdGlow(e.x + e.face * 1, e.y - 26, k, '255,60,40');
    }
    else if (e.type === 'dog') { drawShadow(e.x, e.y + 1, 12); drawSprite(e.state === 'dash' || (e.state === 'chase' && Math.floor(e.walk * 0.8) % 2) ? 'houndB' : 'hound', 'hound', 2, e.x, e.y + 2 + (e.state === 'dash' ? 0 : bob * 0.5) + ya, flip, { white, sy: e.state === 'wind' ? 0.85 : 1, sx: e.state === 'dash' ? 1.15 : 1, alpha: al }); }
    else if (e.type === 'cultist') {
      drawShadow(e.x, e.y + 1, 9);
      const casting = e.state === 'wind';
      if (casting) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255,40,50,${0.4 + 0.5 * e.glow})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(e.x, e.y, 14, 6, 0, 0, TAU); ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = time * 4 + i / 6 * TAU; ctx.fillStyle = 'rgba(255,90,90,.9)'; ctx.fillRect(Math.round(e.x + Math.cos(a) * 14) - 1, Math.round(e.y + Math.sin(a) * 6), 2, 1); }
        ctx.restore();
      }
      drawSprite('chaplain', 'chaplain', 2, e.x, e.y + 2 + bob * 0.5 + ya, flip, { white, rot: lean, alpha: al, sy: casting ? 1.06 : sq });
      if (casting) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const hx = e.x + e.face * 3, hy = e.y - 18, rr = 3 + 7 * e.glow;
        const gr = ctx.createRadialGradient(hx, hy, 0, hx, hy, rr * 2);
        gr.addColorStop(0, 'rgba(255,230,230,.95)'); gr.addColorStop(0.4, 'rgba(255,40,60,.8)'); gr.addColorStop(1, 'rgba(255,40,60,0)');
        ctx.fillStyle = gr; ctx.fillRect(hx - rr * 2, hy - rr * 2, rr * 4, rr * 4);
        ctx.restore();
        if (Math.random() < 0.7) { const a = rand(0, TAU), r = rand(10, 18); G.parts.push({ x: e.x + Math.cos(a) * r, y: e.y - 18 + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, t: 0.2, c: '#ff4050', g: 0, glow: true }); }
      }
    }
    else if (e.type === 'bloat') {
      drawShadow(e.x, e.y + 1, 12);
      const winding = e.state === 'wind';
      const sw = winding ? 1 + 0.3 * e.glow : 1 + Math.sin(time * 4 + e.walk) * 0.04;
      const hot = winding && Math.floor(time * (6 + e.glow * 22)) % 2 === 0;
      drawSprite('bloat', hot ? 'bloatHot' : 'bloat', 2, e.x + (winding ? rand(-1.5, 1.5) * e.glow : 0), e.y + 2 + ya, flip, { white, sx: sw, sy: sw, alpha: al });
    }
    else if (e.type === 'butcher') drawButcher(e, ya, al);
    else if (e.type === 'ghost' || (e.type === 'boss' && e.kind !== 'slimeking')) {
      const sc = 2;
      const map = e.type === 'boss' ? 'baldor' : e.type === 'ghost' ? 'soldier' : 'ghoul';
      const pal = e.type === 'boss' ? 'boss' : e.type === 'ghost' ? 'ghost' : 'butcher';
      const handY = e.type === 'boss' ? 30 : e.type === 'butcher' ? 24 : 14;
      const hx = e.x + e.face * (e.type === 'boss' ? 4 : 3), hy = e.y - handY;
      const bl = BLADES[e.blade];
      const behind = !e.sw && Math.sin(e.bladeAng) < -0.2 === false && Math.cos(e.bladeAng) * e.face < 0;
      drawShadow(e.x, e.y + 2, e.type === 'boss' ? 24 : e.type === 'butcher' ? 16 : 10);
      if (e.type === 'boss' && !e.dead && Math.random() < 0.5) G.parts.push({ x: e.x + rand(-16, 16), y: e.y - rand(0, 48), vx: 0, vy: -24, t: 0.6, c: e.stage === 3 ? '#8a3fb0' : '#3e2b4a', g: 0 });
      if (bl && behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
      if (bl) drawTrail(e.trail, hx, hy, 10, bl.reach, e.type === 'ghost' ? '170,210,255' : e.type === 'boss' ? '190,120,240' : '230,220,210', e.type === 'boss');
      let rot = (e.grogiT > 0 ? 0.3 * e.face : e.state === 'dash' ? 0.25 * e.face : 0) + lean;
      if (e.type === 'ghost' && e.state === 'hold') { const k = 1 - e.t / e.holdMax; rot = -0.2 * e.face * (0.5 + k); }
      drawSprite(map, pal, sc, e.x, e.y + 3 + (e.grogiT > 0 ? 0 : bob) + ya - (e.lift || 0), flip, { white, rot, alpha: al * (e.type === 'ghost' ? 0.85 : 1), sy: e.grogiT > 0 ? 0.92 : sq });
      if (bl && !behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
      if (bl && !behind && (e.sw || !['idle', 'chase', 'recover', 'cast'].includes(e.state))) { // 칼자루를 쥔 건틀릿: 검을 등에 진 평소엔 숨기고 공격할 때만 (v0.66)
        const P0 = PAL[pal], fx = Math.round(hx) & ~1, fy = Math.round(hy) & ~1;
        ctx.globalAlpha = al * (e.type === 'ghost' ? 0.85 : 1); ctx.fillStyle = white ? '#fff' : P0.k; ctx.fillRect(fx - 4, fy - 4, 8, 8);
        ctx.fillStyle = white ? '#fff' : P0.l; ctx.fillRect(fx - 2, fy - 2, 4, 2); ctx.fillStyle = white ? '#fff' : P0.m; ctx.fillRect(fx - 2, fy, 4, 2); ctx.globalAlpha = 1;
      }
      if (e.type === 'ghost' && e.state === 'hold') {
        const k = 1 - e.t / e.holdMax;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const ox of [-5, 5]) { ctx.fillStyle = `rgba(200,230,255,${0.5 + 0.5 * k})`; ctx.fillRect(Math.round(e.x + ox - e.face * 3) - 2, Math.round(e.y - 40 - 4 * k) - 2, 4, 4); }
        ctx.restore();
        holdGlow(e.x - e.face * 3, e.y - 40, k, '150,200,255');
      }
      if (e.grogiT > 0) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(e.y - (e.type === 'boss' ? 62 : 50) + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); } }
    }
    if (e.type === 'boss' && e.kind !== 'slimeking' && e.kind !== 'krugash') drawBossAura(e);
    if (e.type === 'butcher' && !e.dead) {
      const lf = e.lift || 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (e.glow > 0) {
        const cx = e.x + e.face * 6, cy = e.y - 26 - lf, rr = 14 + 22 * e.glow;
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
        gr.addColorStop(0, `rgba(255,80,50,${0.55 * e.glow})`); gr.addColorStop(1, 'rgba(255,40,30,0)');
        ctx.fillStyle = gr; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
      }
      ctx.fillStyle = e.enraged ? 'rgba(255,60,40,.95)' : `rgba(220,240,110,${0.4 + 0.5 * e.glow})`;
      ctx.fillRect(Math.round(e.x + (e.face > 0 ? -1 : 1) * 3) - 3, Math.round(e.y - 34 - lf), 2, 2); ctx.fillRect(Math.round(e.x + (e.face > 0 ? -1 : 1) * 3) + 3, Math.round(e.y - 34 - lf), 2, 2);
      ctx.restore();
    }
    // 준엘리트·엘리트 이름표 (v0.69: 챕터 1~3 모두) — 엘리트는 주황, 준엘리트는 금색
    const nm = e.type !== 'boss' && !e.dead && (e.semiName || (isElite(e) ? eliteName(e) : null));
    if (nm) {
      const top = e.tall ? e.tall + 8 : (ELITE_TOP[e.kind === 'hob' ? 'hob' : e.type] || 60);
      ctx.font = '8px Galmuri7'; ctx.textAlign = 'center';
      const ty = Math.round(e.y - top - 5 - (e.z || 0) - (e.lift || 0)), el = isElite(e);
      ctx.fillStyle = '#000'; fillTextW(nm, Math.round(e.x) + 1, ty + 1); ctx.fillStyle = el ? '#ffa070' : '#f2d78c'; fillTextW(nm, Math.round(e.x), ty);
    }
    if (e.type !== 'boss' && e.hp < e.maxHp && !e.dead) {
      const w = isElite(e) ? 30 : isSemi(e) ? 22 : 16, top = e.tall ? e.tall + 8 : isElite(e) ? (ELITE_TOP[e.kind === 'hob' ? 'hob' : e.type] || 60) : 40;
      ctx.fillStyle = '#000'; ctx.fillRect(Math.round(e.x - w / 2) - 1, Math.round(e.y - top) - 1, w + 2, 4);
      ctx.fillStyle = '#b3262b'; ctx.fillRect(Math.round(e.x - w / 2), Math.round(e.y - top), Math.round(w * e.hp / e.maxHp), 2);
      if (e.grogiMax) { ctx.fillStyle = '#e8c35a'; ctx.fillRect(Math.round(e.x - w / 2), Math.round(e.y - top) + 2, Math.round(w * (e.grogiT > 0 ? 1 : e.grogi / e.grogiMax)), 1); }
    }
  }
  function drawRanger() {
    const P = G.player, storm = P.state === 'storm', tex = storm ? BLADES.daggerG : weaponTex('ranger');
    if (P.dead) {
      drawShadow(P.x, P.y + 1, 8);
      drawBlade(weaponTex('ranger'), P.x + 10, P.y - 2, 0.3, 0.9); drawBlade(weaponTex('ranger'), P.x - 8, P.y, 2.6, 0.9);
      drawSprite('ranger', 'ranger', 2, P.x, P.y + 4, P.face < 0, { rot: Math.PI / 2 * P.face, alpha: 0.85 });
      return;
    }
    if ((P.state === 'dodge' && P.t < BLINK) || (P.state === 'shadow' && P.t < 0.08)) return;
    const blink = P.inv > 0 && Math.floor(time * 16) % 2 === 0;
    drawShadow(P.x, P.y + 1, 8);
    if (storm) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(120,255,180,${0.45 + Math.sin(time * 20) * 0.15})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(P.x, P.y - 2, 30, 12, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    const bob = P.state === 'idle' && P.moving ? -Math.abs(Math.sin(P.walk)) * 1.5 : 0;
    let rot = 0, alpha = blink ? 0.45 : 1, sx = 1, sy = 1;
    if (P.state === 'dodge') { alpha = 0.5 + 0.5 * clamp((P.t - BLINK) / 0.09, 0, 1); sx = 0.9; sy = 1.1; }
    if (P.state === 'attack') {
      const st = SWING_R[P.combo];
      if (P.t < st.wind) { rot = -0.12 * P.face; sy = 0.94; }
      else if (P.t < st.wind + st.swing) { rot = 0.2 * P.face; sx = 1.08; }
    }
    if (P.state === 'shadow') { rot = 0.25 * P.face; sx = 1.1; sy = 0.92; }
    if (storm) { rot = Math.sin(time * 30) * 0.15; }
    if (P.state === 'idle' && P.moving) sy = 1 + Math.sin(P.walk * 2) * 0.04;
    const fhx = P.x + P.face * 4, fhy = P.y - 9, bhx = P.x - P.face * 3, bhy = P.y - 10;
    const swinging = P.state === 'attack' || P.state === 'shadow' || storm;
    const col = storm ? '120,255,180' : P.state === 'shadow' ? '190,140,255' : '200,255,225';
    if (swinging) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      drawTrail(P.trail, fhx, fhy, 6, storm ? 34 : 42, col, true);
      drawTrail(P.trail2, bhx, bhy, 6, storm ? 34 : 42, col, true);
      ctx.restore();
    }
    // 역수 쥐기: 주먹은 휘두르는 방향으로 뻗고, 날은 주먹 아래에서 뒤로 끌리듯 눕는다
    const REV = P.face * 100 * DEG, ext = swinging ? 5 : 0;
    const v1 = P.blade + REV, v2 = P.blade2 + REV;
    const f1x = fhx + Math.cos(P.blade) * ext, f1y = fhy + Math.sin(P.blade) * ext * 0.7, b2x = bhx + Math.cos(P.blade2) * ext, b2y = bhy + Math.sin(P.blade2) * ext * 0.7;
    // v1.09 겹침 순서: 뒷날(+광채) → 몸 → 앞날(+광채). 뒷날 광채가 몸 위로 올라오던 문제 수정
    drawBlade(tex, b2x, b2y, v2, alpha * 0.95); if (!storm) weaponAura(tex, b2x, b2y, v2, 'ranger');
    drawSprite('ranger', 'ranger', 2, P.x, P.y + 2 + bob, P.face < 0, { rot, alpha, white: P.hurtT > 0.12, sx, sy });
    drawBlade(tex, f1x, f1y, v1, alpha); if (!storm) weaponAura(tex, f1x, f1y, v1, 'ranger');
    if (storm) for (let i = 0; i < 4; i++) { const a = P.spin * 1.3 + i * Math.PI / 2; drawBlade(BLADES.daggerG, P.x + Math.cos(a) * 16, P.y - 10 + Math.sin(a) * 7, a, 0.75, false, 1, 'lighter'); }
    ctx.fillStyle = 'rgba(232,228,216,.45)';
    ctx.fillRect(Math.round(P.x + Math.cos(P.ang) * 26) - 1, Math.round(P.y - 8 + Math.sin(P.ang) * 26) - 1, 2, 2);
  }
  // v1.08 플레이어 그리기 래퍼: 몸 위치를 먼저 2px에 맞춰 손·무기 위치가 몸과 같이 움직이게, 무기 각도는 회전 한 칸(1/96바퀴)의 0.8배 넘게 바뀔 때만 다음 그림으로 (이동 사격 시 무기 떨림 방지)
  function drawPlayer() {
    const P = G.player, ox = P.x, oy = P.y, ob = P.blade, ob2 = P.blade2, th = TAU / ROT_N * 0.8;
    if (P.bladeShow == null || Math.abs(angDiff(P.blade, P.bladeShow)) > th) P.bladeShow = P.blade;
    if (P.blade2 != null && (P.blade2Show == null || Math.abs(angDiff(P.blade2, P.blade2Show)) > th)) P.blade2Show = P.blade2;
    P.x = snap2(P.x); P.y = snap2(P.y); P.blade = P.bladeShow; if (P.blade2 != null) P.blade2 = P.blade2Show;
    try { drawPlayerInner(); } finally { P.x = ox; P.y = oy; P.blade = ob; P.blade2 = ob2; }
  }
  function drawPlayerInner() {
    if (G.cls === 'ranger') return drawRanger();
    if (G.cls === 'mage' || G.cls === 'priest' || G.cls === 'gunner') return drawHero();
    const P = G.player;
    const lift = P.lift || 0;
    const hx = P.x + P.face * 2, hy = P.y - PIVOT_Y - lift;
    const holy = P.awakenT > 0 || P.state === 'awaken';
    const tex = holy ? BLADES.holy : weaponTex('knight');
    if (P.dead) {
      drawShadow(P.x, P.y + 1, 8);
      drawBlade(weaponTex('knight'), P.x + 14, P.y - 2, 0.15, 0.9);
      drawSprite('knight', 'knight', 2, P.x, P.y + 4, P.face < 0, { rot: Math.PI / 2 * P.face, alpha: 0.85 });
      return;
    }
    if (P.state === 'dodge' && P.t < BLINK) return; // 점멸 중에는 보이지 않는다
    const blink = P.inv > 0 && Math.floor(time * 16) % 2 === 0;
    drawShadow(P.x, P.y + 1, 8 - Math.min(3, lift * 0.3));
    if (holy) { ctx.fillStyle = `rgba(255,211,77,${0.22 + Math.sin(time * 11) * 0.07})`; ctx.beginPath(); ctx.ellipse(P.x, P.y, 20, 8, 0, 0, TAU); ctx.fill(); }
    const bob = P.state === 'idle' && P.moving ? -Math.abs(Math.sin(P.walk)) * 1.5 : 0;
    let rot = 0, alpha = blink ? 0.45 : 1, sx = 1, sy = 1;
    if (P.state === 'dodge') { alpha = 0.5 + 0.5 * clamp((P.t - BLINK) / 0.09, 0, 1); sx = 0.9; sy = 1.1; }
    if (P.state === 'charge') { rot = 0.3 * P.face; sx = 1.1; }
    if (P.state === 'attack') {
      const st = SWING[P.combo];
      if (P.t < st.wind) { rot = -0.15 * P.face; sy = 0.94; }
      else if (P.t < st.wind + st.swing) { rot = 0.22 * P.face; sx = 1.08; sy = 0.95; }
      else rot = 0.08 * P.face;
    }
    if (P.state === 'skill') { rot = (P.t < SKILL.wind ? -0.25 : 0.2) * P.face; sx = 1.06; sy = P.t < SKILL.wind ? 0.9 : 1.04; }
    if (P.state === 'awaken') { sy = P.t < 0.15 ? 0.88 : 1; rot = P.t > 0.9 && P.t < 1.1 ? 0.3 * P.sign : 0; }
    if (P.state === 'idle' && P.moving) sy = 1 + Math.sin(P.walk * 2) * 0.04;
    const swinging = P.state === 'attack' || P.state === 'skill' || P.state === 'awaken';
    const behind = !swinging && P.state !== 'charge';
    const trailCol = P.state === 'skill' ? '170,220,255' : holy ? '255,214,120' : P.combo === 2 ? '255,214,150' : '240,236,226';
    const giantK = P.state === 'awaken' ? (P.giant || 0) : 0;
    const rout = giantK > 0 ? tex.reach * (1 + 1.7 * giantK) : P.state === 'skill' ? SKILL.reach : tex.reach + 2;
    if (swinging) {
      if (holy || P.state === 'skill') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawTrail(P.trail, hx, hy + 4, 12, rout, trailCol, true); ctx.restore(); }
      drawTrail(P.trail, hx, hy + 4, 12, rout, trailCol, P.state !== 'attack' || P.combo === 2);
    }
    if (behind) { drawBlade(tex, hx - P.face * 2, hy + 2, P.blade, alpha); if (!holy) weaponAura(tex, hx - P.face * 2, hy + 2, P.blade, 'knight'); }
    drawSprite('knight', 'knight', 2, P.x, P.y + 2 + bob - lift, P.face < 0, { rot, alpha, white: P.hurtT > 0.12, sx, sy });
    if (giantK > 0) {
      drawBlade(BLADES.holy, hx, hy + 4, P.giantAng, 0.45 * giantK, false, 1 + 1.7 * giantK, 'lighter');
      drawBlade(BLADES.holy, hx, hy + 4, P.giantAng, 0.8 * giantK, false, 1 + 1.7 * giantK);
    } else if (!behind) {
      if ((P.state === 'attack' || P.state === 'skill') && P.trail.length > 3) {
        drawBlade(tex, hx, hy + 4, P.trail[P.trail.length - 3].a, 0.25);
        drawBlade(tex, hx, hy + 4, P.trail[P.trail.length - 2].a, 0.45);
      }
      drawBlade(tex, hx, hy + 4, P.blade, alpha);
      if (!holy) weaponAura(tex, hx, hy + 4, P.blade, 'knight');
    }
    if (holy && giantK === 0) drawBlade(tex, behind ? hx - P.face * 2 : hx, behind ? hy + 2 : hy + 4, P.blade, 0.35 + Math.sin(time * 9) * 0.1, false, 1, 'lighter');
    ctx.fillStyle = 'rgba(232,228,216,.45)';
    ctx.fillRect(Math.round(P.x + Math.cos(P.ang) * 26) - 1, Math.round(P.y - 8 + Math.sin(P.ang) * 26) - 1, 2, 2);
  }
  function drawProj(pr) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const fade = Math.min(1, pr.t / 0.12);
    const pts = pr.hist.concat([{ x: pr.x, y: pr.y }]);
    pts.forEach((q, i) => {
      const k = (i + 1) / pts.length;
      ctx.strokeStyle = `rgba(120,190,255,${0.55 * k * fade})`; ctx.lineWidth = Math.max(1, 6 * k);
      ctx.beginPath(); ctx.arc(q.x - Math.cos(pr.ang) * 14, q.y - Math.sin(pr.ang) * 14, pr.r, pr.ang - 1.15, pr.ang + 1.15); ctx.stroke();
    });
    ctx.strokeStyle = `rgba(255,255,255,${0.95 * fade})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pr.x - Math.cos(pr.ang) * 14, pr.y - Math.sin(pr.ang) * 14, pr.r, pr.ang - 1.0, pr.ang + 1.0); ctx.stroke();
    ctx.restore();
  }
  function drawFx(f) {
    if (f.kind && f.kind.charCodeAt(0) === 103 && f.kind.slice(0, 3) === 'gx_') { ctx.save(); drawGearFx(f); ctx.restore(); return; }
    const p = 1 - f.t / f.max;
    ctx.save();
    if (f.kind === 'ring') {
      ctx.strokeStyle = f.c; ctx.globalAlpha = 1 - p; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(1, f.grow ? f.r : f.r + p * 26), 0, TAU); ctx.stroke();
    } else if (f.kind === 'impact') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = f.mark ? `rgba(200,120,255,${0.7 * (1 - p)})` : `rgba(255,140,90,${0.7 * (1 - p)})`;
      telePath(f); ctx.fill();
      const k = 1 + p * 0.2;
      ctx.strokeStyle = `rgba(255,240,220,${0.9 * (1 - p)})`; ctx.lineWidth = 2;
      ctx.beginPath();
      if (f.shape === 'circle') ctx.arc(f.x, f.y, f.r * k, 0, TAU);
      else if (f.shape === 'cone') ctx.arc(f.x, f.y, f.r * k, f.ang - f.arc / 2, f.ang + f.arc / 2);
      ctx.stroke();
    } else if (f.kind === 'arcwave') {
      const r = f.r0 + (f.r1 - f.r0) * easeOut(p), w = 12 * (1 - p) + 2;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${f.c},${0.85 * (1 - p)})`; ctx.lineWidth = w;
      ctx.beginPath(); ctx.arc(f.x, f.y, r, f.ang - f.arc / 2, f.ang + f.arc / 2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - p)})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(f.x, f.y, r, f.ang - f.arc * 0.45, f.ang + f.arc * 0.45); ctx.stroke();
    } else if (f.kind === 'skybeam') {
      ctx.globalCompositeOperation = 'lighter';
      const w = f.w * (f.up ? 0.6 + 0.4 * Math.sin(p * Math.PI) : 1 - p * 0.85), a = f.up ? Math.sin(p * Math.PI) : 1 - p;
      const gr = ctx.createLinearGradient(0, -20, 0, f.y);
      gr.addColorStop(0, `rgba(${f.c},0)`); gr.addColorStop(1, `rgba(${f.c},${0.85 * a})`);
      ctx.fillStyle = gr; ctx.fillRect(Math.round(f.x - w / 2), -20, Math.round(w), f.y + 20);
      ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`; ctx.fillRect(Math.round(f.x - w / 8), -20, Math.max(1, Math.round(w / 4)), f.y + 20);
      if (!f.up) { ctx.fillStyle = `rgba(${f.c},${0.7 * a})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, w * 1.1, w * 0.4, 0, 0, TAU); ctx.fill(); }
    } else if (f.kind === 'alert') {
      const o = f.o;
      if (o && !o.dead) {
        const bounce = -Math.max(0, 1 - p * 4) * 6;
        drawNumber('!', o.x, o.y - f.h + bounce, Math.floor(time * 14) % 2 ? '#ff3b2c' : '#ffe0d0', f.s);
      }
    } else if (f.kind === 'spark') {
      ctx.strokeStyle = f.c; ctx.globalAlpha = 1 - p; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - Math.cos(f.ang) * f.len * (1 - p), f.y - Math.sin(f.ang) * f.len * (1 - p)); ctx.stroke();
    } else if (f.kind === 'puff') {
      // 달릴 때 발밑 흙먼지 뭉게 (2px 도트 고리가 퍼지며 사라짐)
      const r = 2 + p * 7, n = 7;
      ctx.globalAlpha = 0.85 * (1 - p); ctx.fillStyle = f.c;
      for (let i = 0; i < n; i++) { const a = i / n * TAU + f.x; ctx.fillRect(Math.round(f.x + Math.cos(a) * r) & ~1, Math.round(f.y - p * 6 + Math.sin(a) * r * 0.5) & ~1, 2, 2); }
      if (p < 0.4) ctx.fillRect(Math.round(f.x) & ~1, Math.round(f.y - p * 6) & ~1, 2, 2);
    } else if (f.kind === 'hitspark') {
      // 타격 순간의 별 모양 섬광 + 베인 자국
      ctx.globalCompositeOperation = 'lighter';
      const R = f.r * (0.55 + easeOut(Math.min(1, p * 1.6)) * 0.75), a = 1 - p, n = f.crit ? 8 : 6;
      ctx.fillStyle = `rgba(${f.c},${0.85 * a})`;
      for (let i = 0; i < n; i++) {
        const an = f.ang + f.rot + i * TAU / n, main = i === 0 || i === n / 2, L = R * (main ? 1.3 : i % 2 ? 0.5 : 0.85), w = (main ? 3 : 1.6) * (1 - p) + 0.6;
        const cx = Math.cos(an), cy = Math.sin(an);
        ctx.beginPath(); ctx.moveTo(f.x + cx * L, f.y + cy * L); ctx.lineTo(f.x - cy * w, f.y + cx * w); ctx.lineTo(f.x - cx * w, f.y - cy * w); ctx.lineTo(f.x + cy * w, f.y - cx * w); ctx.closePath(); ctx.fill();
      }
      if (p < 0.5) {
        const k = 1 - p * 2, pa = f.ang + Math.PI / 2 + f.rot, L = f.r * 1.4;
        ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 2.5 * k + 0.5;
        ctx.beginPath(); ctx.moveTo(f.x - Math.cos(pa) * L, f.y - Math.sin(pa) * L); ctx.lineTo(f.x + Math.cos(pa) * L, f.y + Math.sin(pa) * L); ctx.stroke();
      }
      ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(0.5, f.r * 0.18 * (1 - p)), 0, TAU); ctx.fill();
    } else if (f.kind === 'hitflash') {
      ctx.fillStyle = `rgba(255,250,235,${0.9 * (1 - p)})`;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.6 + p * 0.6), 0, TAU); ctx.fill();
      ctx.fillRect(Math.round(f.x - f.r * 1.6), Math.round(f.y), Math.round(f.r * 3.2), 1);
      ctx.fillRect(Math.round(f.x), Math.round(f.y - f.r * 1.2), 1, Math.round(f.r * 2.4));
    } else if (f.kind === 'claw' && f.brute) { // 오크·트롤: 거칠게 찢긴 세 줄 손톱자국 (v0.71) — 2px 칸, 들쭉날쭉한 굵기·흔들림, 검붉은 테두리, 끝에 튀는 파편, 칸 단위로 사라짐
      const hs = n => { const v = Math.sin(n * 127.1 + f.seed * 311.7) * 43758.5453; return v - Math.floor(v); };
      const r = f.r || 30, gap = Math.max(10, r * 0.3), arc = f.arc || 1.6, sweep = Math.min(1, p * 4), W0 = (f.w || 3) >= 4 ? 2.2 : 1.5;
      for (let i = -1; i <= 1; i++) {
        const st = hs(i + 3) * 0.18, en = 1 - hs(i + 7) * 0.22, rr0 = r + i * gap + (hs(i + 11) - 0.5) * 6, steps = Math.ceil(arc * rr0 / 2);
        for (let k = 0; k <= steps; k++) {
          const u = k / steps; if (u < st || u > en || u > sweep) continue;
          const uu = (u - st) / (en - st), a = f.ang - arc / 2 + arc * u, rr = rr0 + Math.sin(u * 9 + i * 2 + f.seed) * 2.5 + (hs(k * 0.37 + i * 13) - 0.5) * 3;
          const wd = Math.max(0, Math.round(W0 * Math.sin(Math.PI * uu) ** 0.7 * (0.55 + 0.8 * hs(k + i * 31)) - 0.4));
          const cx = f.x + Math.cos(a) * rr, cy = f.y + Math.sin(a) * rr * 0.85, nx = Math.cos(a), ny = Math.sin(a);
          if (hs(k * 1.7 + i) < p * 1.4 - 0.25) continue; // 칸 단위로 부서지며 사라짐
          for (let j = -wd - 1; j <= wd + 1; j++) {
            const x = (Math.round(cx + nx * j * 2) & ~1), y = (Math.round(cy + ny * j * 2) & ~1), edge = Math.abs(j) > wd;
            ctx.fillStyle = edge ? `rgba(30,6,4,${0.85 * (1 - p)})` : Math.abs(j) === wd ? `rgba(160,30,20,${1 - p * 0.6})` : `rgba(${f.c || '255,215,170'},${1 - p * 0.5})`;
            ctx.fillRect(x, y, 2, 2);
          }
        }
        if (p < 0.5 && sweep >= en) for (let q = 0; q < 3; q++) { const a = f.ang - arc / 2 + arc * en + hs(q + i * 5) * 0.3, rr = rr0 + (hs(q * 3 + i) - 0.5) * 10 + q * 3; ctx.fillStyle = q % 2 ? `rgba(160,30,20,${1 - p * 2})` : `rgba(${f.c || '255,215,170'},${1 - p * 2})`; ctx.fillRect(Math.round(f.x + Math.cos(a) * (rr + 6 * p * 4)) & ~1, Math.round(f.y + Math.sin(a) * (rr + 6 * p * 4) * 0.85) & ~1, 2, 2); }
      }
    } else if (f.kind === 'claw') {
      const r = f.r || 18, gap = Math.max(3, r * 0.16), sweep = Math.min(1, p * 2.5);
      if (f.glow) ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${f.c || '230,220,200'},${1 - p})`; ctx.lineWidth = (f.w || 1) + 1;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(f.x, f.y, r + i * gap, f.ang - 0.7, f.ang - 0.7 + 1.4 * sweep); ctx.stroke(); }
    } else if (f.kind === 'ghost') {
      if (f.glowy) ctx.globalCompositeOperation = 'lighter';
      drawSprite(f.map || CL().map, f.pal || (f.tint ? CL().ghostPal : CL().pal), f.sc || 2, f.x, f.y + 2, f.face < 0, { rot: f.rot, alpha: (f.tint || f.map ? 0.55 : 0.3) * (1 - p), white: !f.tint && !f.map });
    } else if (f.kind === 'pillar') {
      const a = f.t / f.max, h = f.h * (0.4 + 0.6 * Math.min(1, p * 3));
      const gr = ctx.createLinearGradient(0, f.y - h, 0, f.y);
      gr.addColorStop(0, 'rgba(255,220,120,0)'); gr.addColorStop(1, `rgba(255,220,120,${0.85 * a})`);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr; ctx.fillRect(Math.round(f.x - 3), Math.round(f.y - h), 6, Math.round(h));
      ctx.fillStyle = `rgba(255,255,230,${a})`; ctx.fillRect(Math.round(f.x), Math.round(f.y - h), 1, Math.round(h));
    } else if (f.kind === 'xslash') {
      ctx.globalCompositeOperation = 'lighter';
      const L = 26 * Math.min(1, p * 3);
      for (const d of [-0.78, 0.78]) {
        const a = f.ang + Math.PI / 2 + d, ux = Math.cos(a), uy = Math.sin(a);
        ctx.strokeStyle = `rgba(190,140,255,${0.8 * (1 - p)})`; ctx.lineWidth = 5 * (1 - p) + 1;
        ctx.beginPath(); ctx.moveTo(f.x - ux * L, f.y - uy * L); ctx.lineTo(f.x + ux * L, f.y + uy * L); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${1 - p})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(f.x - ux * L, f.y - uy * L); ctx.lineTo(f.x + ux * L, f.y + uy * L); ctx.stroke();
      }
    } else if (f.kind === 'drumwave') {
      drawDrumWave(f, p);
    } else if (f.kind === 'rockspike') {
      drawRockSpike(f, p);
    } else if (f.kind === 'spikes') { // 투기장 가시 함정: 솟았다가 다시 들어간다 (2px 칸 도트)
      const up = (p < 0.12 ? p / 0.12 : p > 0.7 ? (1 - p) / 0.3 : 1) * (f.big ? 1.7 : 1), bx = Math.round(f.x) & ~1, by = Math.round(f.y) & ~1;
      if (f.big && p < 0.25) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,90,40,${0.5 * (1 - p * 4)})`; ctx.fillRect(bx - 14, by - 30, 28, 30); ctx.restore(); }
      ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(bx - 12, by - 2, 24, 4);
      for (const [ox, h0] of [[-8, 8], [-3, 12], [2, 14], [7, 10], [11, 6]]) { const h = Math.round(h0 * up / 2) * 2; if (h <= 0) continue;
        ctx.fillStyle = '#140c08'; ctx.fillRect(bx + ox - 2, by - h - 2, 6, h + 2);
        ctx.fillStyle = '#b8b0a0'; ctx.fillRect(bx + ox, by - h, 2, h); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(bx + ox, by - h, 2, 2); ctx.fillStyle = '#7a3020'; ctx.fillRect(bx + ox, by - 4, 2, 2); }
    } else if (f.kind === 'lob') {
      drawLob(f, p);
    } else if (f.kind === 'boom') {
      ctx.globalCompositeOperation = 'lighter';
      const r = f.r * (0.5 + 0.5 * easeOut(Math.min(1, p * 2.5))), gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      gr.addColorStop(0, `rgba(255,240,200,${0.9 * (1 - p)})`); gr.addColorStop(0.45, `rgba(255,140,50,${0.7 * (1 - p)})`); gr.addColorStop(1, 'rgba(160,30,10,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.87, 0, 0, TAU); ctx.fill();
    } else if (f.kind === 'tracer') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${f.c},${0.8 * (1 - p)})`; ctx.lineWidth = f.w * (1 - p * 0.6) + 1;
      ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(f.x1, f.y1); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${1 - p})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(f.x0 + (f.x1 - f.x0) * p * 0.6, f.y0 + (f.y1 - f.y0) * p * 0.6); ctx.lineTo(f.x1, f.y1); ctx.stroke();
    } else if (f.kind === 'muzzle') {
      ctx.globalCompositeOperation = 'lighter';
      const L = 10 * f.s * (1 - p * 0.5), ux = Math.cos(f.ang), uy = Math.sin(f.ang);
      ctx.fillStyle = `rgba(255,220,140,${1 - p})`;
      ctx.beginPath(); ctx.moveTo(f.x - uy * 4 * f.s, f.y + ux * 4 * f.s); ctx.lineTo(f.x + ux * L * 1.6, f.y + uy * L * 1.6); ctx.lineTo(f.x + uy * 4 * f.s, f.y - ux * 4 * f.s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,255,240,${1 - p})`; ctx.beginPath(); ctx.arc(f.x, f.y, 3 * f.s, 0, TAU); ctx.fill();
    } else if (f.kind === 'streak') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${f.c || '120,190,255'},${0.6 * (1 - p)})`; ctx.lineWidth = 6 * (1 - p) + 1;
      ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(f.x1, f.y1); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - p)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(f.x0, f.y0); ctx.lineTo(f.x1, f.y1); ctx.stroke();
    }
    ctx.restore();
  }
  function drawBonfire(b) {
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(b.x - 9, b.y - 2, 18, 3); ctx.fillRect(b.x - 7, b.y - 4, 14, 2);
    ctx.fillStyle = '#6b6560'; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; ctx.fillRect(Math.round(b.x + Math.cos(a) * 11) - 1, Math.round(b.y + Math.sin(a) * 4), 3, 2); }
    for (let i = 0; i < 7; i++) {
      const h = 7 + ((Math.sin(time * 13 + i * 1.7) + 1) * 5);
      ctx.fillStyle = i % 3 === 0 ? '#ffe28a' : i % 2 ? '#ff8a2a' : '#e2501c';
      ctx.fillRect(Math.round(b.x - 7 + i * 2), Math.round(b.y - 4 - h), 2, Math.round(h));
    }
    if (Math.random() < 0.35) G.parts.push({ x: b.x + rand(-5, 5), y: b.y - 12, vx: rand(-6, 6), vy: -34, t: 0.9, c: '#ffb050', g: 0, glow: true });
  }
  function drawDrop(d) { // v0.98: 상자에서 튀어나와 착지 → 필드 장비와 같은 도트 빛기둥
    const p = clamp(d.t / 0.5, 0, 1), sx = d.sx == null ? d.x : d.sx, sy = d.sy == null ? d.y : d.sy;
    const x = sx + (d.x - sx) * p, y = sy + (d.y - sy) * p;
    drawLoot({ type: 'gear', it: d.it, x, y, z: Math.sin(p * Math.PI) * 34, vz: p < 1 ? 1 : 0, bob: d.x, life: 999, t: Math.max(0, d.t - 0.5) });
  }
  // 잿빛 회오리 (v0.67): 바깥은 핏빛 폭풍 — 안으로 휘몰아치는 잿빛 줄기 · 번개 · 안쪽을 향한 톱니 가장자리 · 조여 들 때 경고 화살표
  function drawVortex() {
    const v = G.vortex; if (!v) return;
    const shrinking = v.t < v.shrink, hold = !shrinking && v.t < v.shrink + v.hold, P = G.player, outside = Math.hypot(P.x - v.cx, P.y - v.cy) > v.r;
    ctx.save();
    ctx.beginPath(); ctx.rect(cam.x - 40, cam.y - 40, VW + 80, VH + 80); ctx.arc(v.cx, v.cy, v.r, 0, TAU, true);
    ctx.fillStyle = `rgba(36,8,22,${0.62 + 0.1 * Math.sin(time * 5)})`; ctx.fill('evenodd');
    ctx.clip('evenodd');
    // 디더링된 핏빛 안개 덩어리
    for (let y = (cam.y - 40) & ~3; y < cam.y + VH + 40; y += 4) for (let x = (cam.x - 40) & ~3; x < cam.x + VW + 40; x += 4) {
      const d = Math.hypot(x - v.cx, y - v.cy) - v.r; if (d < 0 || d > 160) continue;
      const n = Math.sin(x * 0.05 + time * 3 + Math.atan2(y - v.cy, x - v.cx) * 4) + Math.sin(y * 0.07 - time * 2);
      if (n > 0.6 - d / 200) { ctx.fillStyle = n > 1.3 ? 'rgba(160,30,60,.55)' : 'rgba(90,20,40,.5)'; ctx.fillRect(x, y, 4, 4); }
    }
    // 안으로 휘몰아치는 잿빛·핏빛 줄기 (나선)
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      const base = time * (2.2 + (i % 3) * 0.4) + i * 0.9, r0 = v.r + 8 + (i % 7) * 26;
      ctx.strokeStyle = i % 4 === 0 ? `rgba(230,60,90,${0.45 + 0.2 * Math.sin(time * 4 + i)})` : `rgba(170,160,180,${0.25 + 0.15 * Math.sin(time * 3 + i)})`;
      ctx.beginPath(); for (let k = 0; k <= 12; k++) { const a = base + k * 0.13, r = r0 - k * 2.2; const x = v.cx + Math.cos(a) * r, y = v.cy + Math.sin(a) * r; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    }
    // 번개: 가끔 폭풍 속에서 갈라지는 빛
    v.boltT = (v.boltT == null ? 1.2 : v.boltT) - 1 / 60;
    if (!v.bolt || v.bolt.t <= 0) { if (v.boltT <= 0) { v.boltT = rand(2.6, 4.2); /* 번개는 2.6~4.2초에 한 번, 천둥은 낮고 묵직하게 (v0.75) */ const a = rand(0, TAU), r1 = v.r + rand(30, 140), pts = []; let x = v.cx + Math.cos(a) * r1, y = v.cy + Math.sin(a) * r1; for (let k = 0; k < 7; k++) { pts.push([x, y]); x += Math.cos(a + Math.PI) * 12 + rand(-10, 10); y += Math.sin(a + Math.PI) * 12 + rand(-10, 10); } v.bolt = { pts, t: 0.14 }; sfx('blast', 0.5); } }
    if (v.bolt && v.bolt.t > 0) { v.bolt.t -= 1 / 60; ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,200,230,.9)'; ctx.lineWidth = 2; ctx.beginPath(); v.bolt.pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const fl = 0.7 + Math.sin(time * (shrinking ? 18 : 10)) * 0.3;
    // 톱니 가장자리 (안쪽을 향해, 돌면서 맥동)
    const n = Math.max(24, Math.round(v.r / 7)), tooth = 7 + 3 * Math.sin(time * 6);
    ctx.fillStyle = `rgba(255,40,70,${0.75 * fl})`; ctx.beginPath();
    for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * TAU + time * 0.6, r = i % 2 ? v.r - tooth : v.r + 2; const x = v.cx + Math.cos(a) * r, y = v.cy + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.arc(v.cx, v.cy, v.r + 4, 0, TAU, true); ctx.fill('evenodd');
    ctx.strokeStyle = `rgba(255,50,80,${0.85 * fl})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(v.cx, v.cy, v.r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(255,230,235,${0.75 * fl})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(v.cx, v.cy, v.r + 3, 0, TAU); ctx.stroke();
    // 조여 드는 동안: 안쪽을 가리키는 경고 화살표가 가장자리를 따라 흐른다
    if (shrinking) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU - time * 0.4, r = v.r + 16 + ((time * 40) % 14), x = v.cx + Math.cos(a) * r, y = v.cy + Math.sin(a) * r, ix = -Math.cos(a), iy = -Math.sin(a), s2 = 6;
      ctx.strokeStyle = `rgba(255,220,120,${0.8 * fl})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - ix * s2 - iy * s2, y - iy * s2 + ix * s2); ctx.lineTo(x, y); ctx.lineTo(x - ix * s2 + iy * s2, y - iy * s2 - ix * s2); ctx.stroke(); }
    ctx.restore();
    for (let i = 0; i < 10; i++) { const a = rand(0, TAU), r = v.r + rand(2, 90); G.parts.push({ x: v.cx + Math.cos(a) * r, y: v.cy + Math.sin(a) * r, vx: -Math.sin(a) * 150 - Math.cos(a) * 60, vy: Math.cos(a) * 150 - Math.sin(a) * 60, t: 0.5, c: Math.random() < 0.35 ? '#ff5070' : '#8d8496', g: 0, glow: Math.random() < 0.3 }); }
  }
  // 회오리 밖에 있으면 화면 가장자리가 붉게 맥동한다 (화면 좌표)
  function drawVortexVignette() {
    const v = G && G.vortex; if (!v) return;
    const P = G.player, out = Math.hypot(P.x - v.cx, P.y - v.cy) > v.r, k = out ? 0.55 + 0.35 * Math.sin(time * 12) : 0.18 + 0.08 * Math.sin(time * 4);
    const gr = ctx.createRadialGradient(VW / 2, VH / 2, VH * 0.35, VW / 2, VH / 2, VH * 0.85);
    gr.addColorStop(0, 'rgba(120,0,20,0)'); gr.addColorStop(1, `rgba(150,0,30,${k})`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
    const shr = v.t < v.shrink, hold = !shr && v.t < v.shrink + v.hold;
    if (shr || hold) { const left = shr ? v.shrink - v.t + v.hold : v.shrink + v.hold - v.t, txt = (shr ? '잿빛 회오리가 조여 온다 ' : '잿빛 회오리 ') + left.toFixed(1) + 's'; ctx.font = '9px Galmuri9'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(txt, VW / 2 + 1, 151); ctx.fillStyle = '#ff9aa8'; ctx.fillText(txt, VW / 2, 150); }
    if (out) { ctx.font = 'bold 12px Galmuri11'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText('회오리 안으로!', VW / 2 + 1, 167); ctx.fillStyle = Math.floor(time * 6) % 2 ? '#ffffff' : '#ff6070'; ctx.fillText('회오리 안으로!', VW / 2, 166); }
  }
  function drawTorches() {
    TORCHES.forEach((tc, i) => {
      ctx.fillStyle = '#2b2018'; ctx.fillRect(tc.x - 3, tc.y + 2, 6, 3); ctx.fillRect(tc.x - 1, tc.y + 5, 2, 6);
      const f = Math.sin(time * 11 + i * 1.3);
      ctx.fillStyle = '#e2501c'; ctx.fillRect(tc.x - 3, tc.y - 4 + Math.round(f), 6, 6);
      ctx.fillStyle = '#ff9a2e'; ctx.fillRect(tc.x - 2, tc.y - 6 + Math.round(f), 4, 6);
      ctx.fillStyle = '#ffe28a'; ctx.fillRect(tc.x - 1, tc.y - 3, 2, 3);
      if (Math.random() < 0.15) G && G.parts.push({ x: tc.x + rand(-2, 2), y: tc.y - 6, vx: rand(-4, 4), vy: -20, t: 0.6, c: '#ffb050', g: 0, glow: true });
    });
  }

  // v1.17 빛 도장: 반지름(정수)·세기(0.01 단위)·색마다 그라데이션을 한 번만 그려 두고 붙인다 (매 프레임 그라데이션 수백 개 생성 → 0)
  const LSTAMP = new Map();
  function lightStamp(r, a, c, ca) {
    const R = Math.max(1, Math.round(r)), key = c ? R + '|' + c + '|' + Math.round(ca * 100) : R + '|' + Math.round(a * 100);
    let st = LSTAMP.get(key); if (st) return st;
    const [cv2, g] = mkCanvas(R * 2, R * 2);
    if (c) { const A = Math.round(ca * 100) / 100, gr = g.createRadialGradient(R, R, 0, R, R, R * 0.8); gr.addColorStop(0, `rgba(${c},${A})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; }
    else { const A = Math.round(a * 100) / 100, gr = g.createRadialGradient(R, R, 0, R, R, R); gr.addColorStop(0, `rgba(0,0,0,${A})`); gr.addColorStop(0.55, `rgba(0,0,0,${A * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; }
    g.fillRect(0, 0, R * 2, R * 2);
    if (LSTAMP.size > 400) LSTAMP.clear();
    st = { c: cv2, R }; LSTAMP.set(key, st); return st;
  }
  // 조명: 어둠을 깔고 광원 자리만 지운 뒤, 따뜻한 빛을 더한다
  function renderLighting() {
    const P = G.player, lights = [];
    lights.push({ x: P.x, y: P.y - 8, r: 105, a: 0.95 });
    if (STG().torches) TORCHES.forEach(t => lights.push({ x: t.x, y: t.y + 20, r: 85 + Math.sin(time * 9 + t.x) * 3, a: 0.85, c: '255,150,60', ca: 0.12 }));
    if (G.drums && G.boss && G.boss.armorMul < 1) for (const d of G.drums) if (d.boss && !d.broken && !(d.drop > 0)) lights.push({ x: d.x, y: d.y - 20, r: 70 + (d.pulse || 0) * 90, a: 0.7, c: '255,60,30', ca: 0.12 + (d.pulse || 0) * 0.3 });
    if (G.bonfire) lights.push({ x: G.bonfire.x, y: G.bonfire.y - 6, r: 170 + Math.sin(time * 12) * 5, a: 1, c: '255,140,50', ca: 0.22 });
    if (P.state === 'attack' && P.trail.length) { const a = P.blade; lights.push({ x: P.x + Math.cos(a) * 30, y: P.y - 10 + Math.sin(a) * 30, r: 60, a: 0.6, c: '255,240,210', ca: 0.12 }); }
    if (P.awakenT > 0) lights.push({ x: P.x, y: P.y - 8, r: 120, a: 0.6, c: '255,210,90', ca: 0.18 });
    if (P.state === 'awaken') lights.push({ x: P.x, y: P.y - 14, r: 160 + (P.giant || 0) * 60, a: 0.9, c: '255,210,90', ca: 0.28 });
    if (P.state === 'storm') lights.push({ x: P.x, y: P.y - 10, r: 120, a: 0.8, c: '120,255,180', ca: 0.22 });
    if (P.state === 'shadow') lights.push({ x: P.x, y: P.y - 10, r: 70, a: 0.6, c: '170,110,240', ca: 0.18 });
    if (P.state === 'dodge' || P.state === 'skill' || P.state === 'charge') lights.push({ x: P.x, y: P.y - 10, r: 70, a: 0.6, c: '150,210,255', ca: 0.18 });
    for (const pr of G.proj) lights.push({ x: pr.x, y: pr.y, r: 70, a: 0.7, c: '150,210,255', ca: 0.22 });
    for (const pr of G.eproj) if (!['rock', 'arrow', 'quill'].includes(pr.kind)) lights.push({ x: pr.x, y: pr.y - 10, r: pr.kind === 'acid' || pr.kind === 'bile' ? 30 : 44, a: 0.6, c: pr.kind === 'acid' || pr.kind === 'bile' ? '140,230,60' : '255,50,60', ca: 0.22 });
    for (const f of G.fx) if (f.kind === 'pillar') lights.push({ x: f.x, y: f.y - 30, r: 55, a: 0.6 * (f.t / f.max), c: '255,210,90', ca: 0.2 * (f.t / f.max) });
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (e.type === 'boss') lights.push({ x: e.x, y: e.y - 30 - (e.z || 0), r: e.kind === 'slimeking' ? 90 : e.kind === 'krugash' ? 110 : 70, a: 0.45, c: e.kind === 'slimeking' ? (e.stage === 3 ? '230,90,170' : '140,230,90') : e.kind === 'krugash' ? (e.stage === 3 ? '255,50,30' : '255,130,60') : '170,80,230', ca: 0.14 });
      else if (e.type === 'ghost') lights.push({ x: e.x, y: e.y - 12, r: 40, a: 0.4, c: '150,200,255', ca: 0.12 });
      else if (e.type === 'butcher') lights.push({ x: e.x, y: e.y - 24, r: 40 + 40 * (e.glow || 0), a: 0.45, c: '255,60,40', ca: 0.06 + 0.16 * (e.glow || 0) + (e.enraged ? 0.06 : 0) });
      else if (e.type === 'crow') lights.push({ x: e.x, y: e.y - (e.z || 0) - 6, r: 24, a: 0.4, c: '150,100,200', ca: 0.06 });
      else if (e.type === 'mother') lights.push({ x: e.x, y: e.y - 24, r: 50 + 40 * Math.max(e.glow || 0, e.state === 'bilecharge' ? 1 - e.t / e.chargeMax : 0), a: 0.5, c: '150,230,80', ca: 0.08 + 0.15 * (e.glow || 0) });
      else if (e.type === 'gbrute' || e.type === 'boar') lights.push({ x: e.x, y: e.y - 24, r: 40 + 40 * (e.glow || 0), a: 0.45, c: e.type === 'boar' ? '255,70,40' : '255,190,60', ca: 0.05 + 0.15 * (e.glow || 0) + (e.enraged ? 0.06 : 0) });
      else if (e.type === 'cultist' && e.state === 'wind') lights.push({ x: e.x, y: e.y - 18, r: 46, a: 0.6, c: '255,40,60', ca: 0.2 });
      else lights.push({ x: e.x, y: e.y - 8, r: 22, a: 0.25 });
    }
    for (const t of G.tele) if (t.shape !== 'spawn' && !(t.r > 600)) { const lx = t.shape === 'line' ? t.x + Math.cos(t.ang) * t.len / 2 : t.x, ly = t.shape === 'line' ? t.y + Math.sin(t.ang) * t.len / 2 : t.y; lights.push({ x: lx, y: ly, r: (t.shape === 'line' ? t.len / 2 : t.r) + 16, a: 0.45, c: t.mark ? '170,60,220' : '240,30,30', ca: 0.1 + 0.12 * (t.t / t.dur) }); }
    gearLights(lights); forgeLights(lights);
    for (const f of G.fx) if (f.kind === 'skybeam') lights.push({ x: f.x, y: f.y - 20, r: 90, a: 0.7 * (f.t / f.max), c: f.c, ca: 0.25 * (f.t / f.max) });
    for (const t of G.tele) if (t.shape !== 'spawn') { const c = teleCenter(t), boss = t.mark || isBossTele(t); lights.push({ x: c.x, y: c.y, r: (t.shape === 'line' ? t.len * 0.5 : t.r) + 20, a: boss ? 0.45 : 0.35, c: t.mark ? '190,100,255' : boss ? '255,160,80' : '255,70,50', ca: 0.06 }); } // 바닥 경고가 어둠에 묻히지 않게
    if (G.vortex) lights.push({ x: G.vortex.cx, y: G.vortex.cy, r: G.vortex.r + 30, a: 0.35, c: '255,60,90', ca: 0.05 });
    for (const h of G.hazards) lights.push({ x: h.x, y: h.y, r: 40, a: 0.35, c: '120,200,60', ca: 0.08 });
    for (const d of G.drops) if (d.t > 0.6) { const gr = gradeOf(d.it); lights.push({ x: d.x, y: d.y - 20, r: 90, a: 0.8, c: hexRgb(gr.c), ca: 0.25 }); }
    for (const l of G.loot) { const c = l.type === 'gear' ? hexRgb(gradeOf(l.it).c) : LOOT[l.type].light; lights.push({ x: l.x, y: l.y - 6, r: l.type === 'gear' ? 60 : 26, a: 0.55, c, ca: l.type === 'gear' ? 0.22 : 0.12 }); }
    for (const pr of G.mproj) lights.push({ x: pr.x, y: pr.y, r: pr.kind === 'fireball' ? 60 : pr.big ? 40 : 28, a: 0.7, c: pr.kind === 'fireball' ? '255,140,60' : '190,120,255', ca: 0.22 });
    if (G.meteor) { const m = G.meteor, k = Math.min(1, m.t / m.dur); lights.push({ x: m.x, y: m.y, r: m.fell ? 200 : 60 + 80 * k, a: m.fell ? 1 - m.post / 0.7 : 0.6, c: '255,140,60', ca: m.fell ? 0.4 * (1 - m.post / 0.7) : 0.12 + 0.12 * k }); }
    for (const f of G.fx) if (f.kind === 'muzzle') lights.push({ x: f.x, y: f.y, r: 50 * f.s, a: f.t / f.max, c: '255,200,120', ca: 0.35 * f.t / f.max });
    if (G.player.miracleT > 0 || G.player.shieldT > 0) lights.push({ x: G.player.x, y: G.player.y - 10, r: 60, a: 0.6, c: '255,225,140', ca: 0.18 });
    if (G.cls === 'mage' && !G.player.dead) { const tp = staffTip(); lights.push({ x: tp.x, y: tp.y, r: G.player.state === 'cast' ? 70 : 30, a: 0.5, c: G.player.state === 'cast' ? '255,150,70' : '190,120,255', ca: 0.12 }); }
    { const t = weaponTier(G.cls); if (t === 3 && !G.player.dead) lights.push({ x: G.player.x, y: G.player.y - 14, r: 70, a: 0.5, c: LEGEND_FX_COL[G.cls].c, ca: 0.12 + 0.04 * Math.sin(time * 6) }); }
    // v0.92 버프 이펙트가 어둠에 묻히지 않게: 보호막·강화한 적, 망령 기사 영혼 사슬에 빛
    for (const e of G.enemies) { const B = buffState(e); if (!B) continue; const h = enemyH(e);
      if (B.bar) lights.push({ x: e.x, y: e.y, r: Math.max(40, enemyW(e) * 2 + 20), a: 0.55, c: B.bar.c, ca: 0.1 + 0.05 * Math.sin(time * 4) });
      if (B.emp) lights.push({ x: e.x, y: e.y - 4, r: 34, a: 0.45, c: B.emp, ca: 0.1 }); }
    for (const f of G.enemies) if (f.type === 'flag' && !f.dead) { lights.push({ x: f.x, y: f.y - 50, r: 60, a: 0.55, c: '255,200,110', ca: 0.12 }); lights.push({ x: f.x, y: f.y, r: FLAG_R + 20, a: 0.25, c: '255,200,90', ca: 0.04 }); }
    if (G.boss && !G.boss.dead && G.boss.shield) for (const g2 of G.enemies) if (g2.type === 'ghost' && !g2.dead) for (let i = 1; i <= 3; i++) { const t = i / 4; lights.push({ x: g2.x + (G.boss.x - g2.x) * t, y: g2.y - 20 + (G.boss.y - 14 - g2.y) * t, r: 30, a: 0.4, c: '120,170,240', ca: 0.06 }); }
    if (G.frenzyT > 0) lights.push({ x: G.player.x, y: G.player.y - 12, r: 48, a: 0.5, c: '255,40,50', ca: 0.14 + 0.05 * Math.sin(time * 10) });
    for (const f of G.fx) if (f.kind === 'hitspark') lights.push({ x: f.x, y: f.y, r: f.r * 1.6, a: 0.4 * (f.t / f.max), c: f.c, ca: 0.07 * (f.t / f.max) });
    for (const f of G.fx) if (f.kind === 'hitflash') lights.push({ x: f.x, y: f.y, r: 50, a: 0.7 * (f.t / f.max), c: '255,240,200', ca: 0.2 * (f.t / f.max) });
    for (const p of G.parts) if (p.glow) lights.push({ x: p.x, y: p.y, r: 8, a: 0.4 });
    roomLights(lights);
    if (flashT > 0) lights.push({ x: cam.x + VW / 2, y: cam.y + VH / 2, r: 900, a: Math.min(1, flashT * 4) });

    const vis = lights.filter(l => l.x + l.r > cam.x && l.x - l.r < cam.x + VW && l.y + l.r > cam.y && l.y - l.r < cam.y + VH);
    if (OPT) { // v1.17 빛 지도를 반 해상도로 (화면도 어차피 2px 칸으로 다시 뽑으므로 겉모습 같음) — 칠하는 넓이 1/4
      const H = LIGHTH, dark = `rgba(${G.stage === 1 ? '14,10,30' : G.stage === 3 ? '20,6,4' : '4,3,10'},${STG().dark})`;
      H.g.setTransform(1, 0, 0, 1, 0, 0); H.g.globalCompositeOperation = 'source-over'; H.g.clearRect(0, 0, VW / 2, VH / 2); H.g.fillStyle = dark; H.g.fillRect(0, 0, VW / 2, VH / 2);
      H.g.globalCompositeOperation = 'destination-out'; H.g.setTransform(0.5, 0, 0, 0.5, -CAMX / 2, -CAMY / 2);
      for (const l of vis) { const st = lightStamp(l.r, l.a, null, 0); H.g.drawImage(st.c, l.x - st.R, l.y - st.R); }
      ctx.drawImage(H.c, 0, 0, VW / 2, VH / 2, CAMX, CAMY, VW, VH);
      let anyC = false; H.gg.setTransform(1, 0, 0, 1, 0, 0); H.gg.globalCompositeOperation = 'source-over'; H.gg.clearRect(0, 0, VW / 2, VH / 2);
      H.gg.globalCompositeOperation = 'lighter'; H.gg.setTransform(0.5, 0, 0, 0.5, -CAMX / 2, -CAMY / 2);
      for (const l of vis) if (l.c) { anyC = true; const st = lightStamp(l.r, 0, l.c, l.ca); H.gg.drawImage(st.c, l.x - st.R, l.y - st.R); }
      if (anyC) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(H.gc, 0, 0, VW / 2, VH / 2, CAMX, CAMY, VW, VH); ctx.restore(); }
      return;
    }
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, VW, VH);
    lg.fillStyle = `rgba(${G.stage === 1 ? '14,10,30' : G.stage === 3 ? '20,6,4' : '4,3,10'},${STG().dark})`; lg.fillRect(0, 0, VW, VH);
    lg.globalCompositeOperation = 'destination-out';
    lg.setTransform(1, 0, 0, 1, -CAMX, -CAMY);
    for (const l of vis) {
      if (OPT) { const st = lightStamp(l.r, l.a, null, 0); lg.drawImage(st.c, l.x - st.R, l.y - st.R); continue; } // v1.17 미리 그린 빛 도장
      const gr = lg.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      gr.addColorStop(0, `rgba(0,0,0,${l.a})`); gr.addColorStop(0.55, `rgba(0,0,0,${l.a * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = gr; lg.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    lg.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(lightC, CAMX, CAMY);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const l of vis) if (l.c) {
      if (OPT) { const st = lightStamp(l.r, 0, l.c, l.ca); ctx.drawImage(st.c, l.x - st.R, l.y - st.R); continue; }
      const gr = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.8);
      gr.addColorStop(0, `rgba(${l.c},${l.ca})`); gr.addColorStop(1, `rgba(${l.c},0)`);
      ctx.fillStyle = gr; ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    ctx.restore();
  }
  const hexRgb = h => `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;

  // ---- v1.05 화면 도트화: 월드를 다 그린 뒤 화면을 2px 칸 격자로 한 번 다시 뽑는다 (매끈한 선·호·그라데이션 이펙트도 칸 단위가 됨)
  // 카메라·흔들림이 2px에 맞춰져 있어 이미 칸에 맞는 스프라이트는 그대로 남는다. 월드 글자는 뭉개지지 않게 이 뒤에 그린다.
  const [PXL, PXLg] = mkCanvas(VW / 2, VH / 2); PXLg.imageSmoothingEnabled = false;
  let wtextDefer = false; const WTEXT = [];
  function fillTextW(t, x, y) { if (!wtextDefer) return ctx.fillText(t, x, y); WTEXT.push({ t, x, y, font: ctx.font, align: ctx.textAlign, base: ctx.textBaseline, fs: ctx.fillStyle, a: ctx.globalAlpha, m: ctx.getTransform() }); }
  // v1.06 카메라 격자를 플레이어 기준으로: 카메라와 플레이어를 따로 반올림하면 둘의 차이가 0/2px로 오가며 화면이 떨림 → 지연(카메라-플레이어)만 반올림해서 더함
  let CAMX = 0, CAMY = 0;
  let CAM_LX = 0, CAM_LY = 0, CAM_INIT = false;
  function camSnap() { // v1.07: 카메라가 실제로 움직이는 방향의 반대로는 격자가 되돌아가지 않게 (멈출 때·출발할 때 앞뒤 떨림 방지)
    const P = G && G.player;
    let cx = P && !cam.clX ? snap2(cam.x - P.x) + snap2(P.x) : snap2(cam.x), cy = P && !cam.clY ? snap2(cam.y - P.y) + snap2(P.y) : snap2(cam.y); // 방 가장자리에 걸려 멈춘 축은 카메라 그대로
    if (CAM_INIT && Math.abs(cx - CAMX) <= 4 && Math.abs(cy - CAMY) <= 4) {
      const vx = cam.x - CAM_LX, vy = cam.y - CAM_LY;
      if ((cx - CAMX) * vx <= 0 && cx !== CAMX && Math.abs(snap2(cam.x) - CAMX) <= 2) cx = CAMX;
      if ((cy - CAMY) * vy <= 0 && cy !== CAMY && Math.abs(snap2(cam.y) - CAMY) <= 2) cy = CAMY;
    }
    CAMX = cx; CAMY = cy; CAM_LX = cam.x; CAM_LY = cam.y; CAM_INIT = true;
  }
  function pixelPass() {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
    PXLg.clearRect(0, 0, VW / 2, VH / 2); PXLg.drawImage(cv, 0, 0, VW, VH, 0, 0, VW / 2, VH / 2);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(PXL, 0, 0, VW / 2, VH / 2, 0, 0, VW, VH); ctx.restore();
    wtextDefer = false;
    for (const w of WTEXT) { ctx.save(); ctx.setTransform(w.m); ctx.font = w.font; ctx.textAlign = w.align; ctx.textBaseline = w.base; ctx.fillStyle = w.fs; ctx.globalAlpha = w.a; ctx.fillText(w.t, w.x, w.y); ctx.restore(); }
    WTEXT.length = 0;
  }
  // ================================================================ v1.12 타이틀 화면 도트 그림: 잿빛 하늘 · 붉은 달 · 성채 · 절벽 위 토벌대와 모닥불
  // 2px 칸(384×216). 가만있는 부분은 한 번 그려 두고, 재·불티·창불·모닥불만 매 프레임 칸 단위로 움직인다
  const TS = { cv: null, win: [], ash: [], emb: [] };
  function tsHash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function genTitleScene() {
    const [c, g] = mkCanvas(VW, VH), W = VW / 2, H = VH / 2, C = (x, y, col) => { g.fillStyle = col; g.fillRect(x * 2, y * 2, 2, 2); };
    // 하늘: 위는 검보라, 지평선 쪽은 잿불빛 (띠 사이 디더)
    const SKY = ['#06040b', '#0b0714', '#120a1c', '#1b0e22', '#271226', '#371728', '#4a1c28', '#5e2428', '#6e2e2a'];
    for (let y = 0; y < H; y++) { const t = Math.min(SKY.length - 1.001, y / 168 * (SKY.length - 1)), i = Math.floor(t), f = t - i; for (let x = 0; x < W; x++) C(x, y, dith(x, y, f) ? SKY[i + 1] : SKY[i]); }
    // 별 몇 개 (위쪽만)
    for (let i = 0; i < 70; i++) { const x = Math.floor(tsHash(i, 3) * W), y = Math.floor(tsHash(i, 7) * 70); C(x, y, tsHash(i, 9) < 0.2 ? '#c8b8d8' : '#5a4a6a'); }
    // 달: 잿빛 원반 + 붉은 달무리
    const mx = 300, my = 48, mr = 30;
    for (let y = -mr - 16; y <= mr + 16; y++) for (let x = -mr - 16; x <= mr + 16; x++) { const d = Math.hypot(x, y); if (d > mr && d < mr + 16 && dith(mx + x, my + y, (1 - (d - mr) / 16) * 0.55)) C(mx + x, my + y, d < mr + 6 ? '#7a3434' : '#4e2030'); }
    for (let y = -mr; y <= mr; y++) for (let x = -mr; x <= mr; x++) { const d = Math.hypot(x, y); if (d > mr) continue;
      const n = tsHash((x + 40) >> 2, (y + 40) >> 2) * 0.6 + tsHash((x + 40) >> 1, (y + 40) >> 1) * 0.4, lit = (x * -0.5 + y * -0.7) / mr;
      let col = n > 0.72 ? '#a8968a' : n > 0.6 ? '#bcaa9c' : '#d6c6b4'; if (lit > 0.45 && dith(x + 99, y + 99, (lit - 0.45) * 1.6)) col = n > 0.6 ? '#9a887c' : '#b8a696'; if (d > mr - 1.4) col = '#9a8478'; if (lit < -0.6 && d < mr - 2) col = '#ece0cc';
      C(mx + x, my + y, col); }
    // 구름 띠 (달 앞은 비움)
    for (const [cy, x0, x1, hh, col] of [[60, 150, 384, 3, '#1c0e1e'], [72, 200, 360, 2, '#2a1424'], [36, 240, 384, 2, '#160a1a'], [92, 120, 330, 2, '#3a1a26']]) for (let x = x0; x < x1; x++) { const w = hh + Math.round(Math.sin(x * 0.09 + cy) * 1.4 + Math.sin(x * 0.23) * 0.8); for (let k = 0; k < w; k++) if (Math.hypot(x - mx, cy + k - my) > mr + 1 && dith(x, cy + k, 0.85 - k * 0.15 - (x < x0 + 20 ? (x0 + 20 - x) / 20 : 0))) C(x, cy + k, col); }
    // 먼 산 두 겹 (위 테에 달빛)
    const ridge = (base, amp, seed, col, rim) => { for (let x = 0; x < W; x++) { const h = base - Math.abs(Math.sin(x * 0.031 + seed)) * amp - Math.abs(Math.sin(x * 0.083 + seed * 2)) * amp * 0.45 - tsHash(x >> 2, seed) * 3; for (let y = Math.floor(h); y < H; y++) C(x, y, y === Math.floor(h) ? rim : col); } };
    ridge(150, 26, 1.3, '#1d1022', '#3a2236'); ridge(166, 16, 4.1, '#140a18', '#2a1828');
    // 성채 마스크
    const M = Array.from({ length: H }, () => new Uint8Array(W)), R = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (x >= 0 && x < W && y >= 0 && y < H) M[y][x] = 1; };
    const cren = (x0, x1, y) => { for (let x = x0; x <= x1; x++) if (((x - x0) >> 1) % 2 === 0) { M[y][x] = 1; M[y - 1][x] = 1; } };
    const cone = (x0, x1, y0, apex) => { const cx = (x0 + x1) / 2, hw = (x1 - x0) / 2 + 1; for (let y = apex; y <= y0; y++) { const k = (y - apex) / (y0 - apex), w = Math.round(hw * k); for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) M[y][x] = 1; } M[apex - 1][Math.round(cx)] = 1; M[apex - 2][Math.round(cx)] = 1; };
    for (let x = 236; x <= 364; x++) { const top = Math.round(146 + ((x - 300) / 64) ** 2 * 16 + tsHash(x >> 1, 5) * 2); R(x, top, x, 175); } // 바위 언덕
    R(256, 116, 344, 150); cren(256, 344, 115); // 성벽
    R(284, 74, 316, 150); cren(284, 316, 73); // 본성
    R(260, 92, 272, 150); cone(259, 273, 91, 76); // 왼쪽 큰 탑
    R(246, 110, 254, 150); cone(245, 255, 109, 98); // 왼쪽 작은 탑
    R(330, 96, 342, 150); for (let x = 330; x <= 342; x++) { const j = Math.round(Math.abs(Math.sin(x * 1.7)) * 5); for (let y = 96 - j; y < 96; y++) M[y][x] = 1; } // 오른쪽 무너진 탑
    R(348, 112, 356, 150); cone(347, 357, 111, 100); // 오른쪽 작은 탑
    // 성채 칠하기: 몸은 아주 어둡게, 위·달쪽 테두리에 달빛, 벽돌결 디더
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!M[y][x]) continue;
      const up = y > 0 && !M[y - 1][x], side = (x < W - 1 && !M[y][x + 1] && x < mx) || (x > 0 && !M[y][x - 1] && x > mx);
      let col = '#0f0812'; if ((y % 4 === 0 || ((x + (y >> 2) * 3) % 8 === 0)) && dith(x, y, 0.5)) col = '#160c1a';
      if (side) col = '#2a1c2e'; if (up) col = '#4a3446'; C(x, y, col); }
    // 성문 (붉은 빛) · 걸린 찢어진 깃발
    for (let y = 136; y <= 150; y++) for (let x = 294; x <= 306; x++) { const ar = y < 140 ? Math.hypot(x - 300, (y - 140) * 1.4) <= 6.5 : true; if (ar) C(x, y, y > 146 ? '#5a1a14' : dith(x, y, (y - 136) / 14) ? '#3a0e10' : '#1a0608'); }
    for (const bx of [288, 309]) for (let y = 78; y < 98; y++) for (let x = bx; x < bx + 4; x++) { if (y > 92 && (x + y) % 3 === 0) continue; C(x, y, x === bx ? '#7a1c1c' : y === 78 ? '#a07a3a' : '#561216'); }
    TS.win = [[264, 100], [268, 112], [288, 86], [296, 92], [304, 86], [312, 98], [290, 110], [310, 112], [334, 104], [250, 118], [352, 120], [300, 104]];
    // 앞 절벽: 토벌대가 선 바위 턱 (왼쪽 글자 쪽으로 갈수록 낮아짐)
    const ledgeTop = x => Math.round(178 + Math.max(0, (220 - x) / 220) ** 1.5 * 22 + Math.sin(x * 0.11) * 1.2 + Math.sin(x * 0.037) * 1.5 + (x > 330 ? (x - 330) * 0.25 : 0)); // 한 줄로 이어진 능선 (v1.12: 왼쪽 계단처럼 끊기던 것 수정)
    TS.ledge = ledgeTop;
    for (let x = 0; x < W; x++) { const t = ledgeTop(x); for (let y = t; y < H; y++) { const d = y - t, n = tsHash(x >> 1, y >> 1);
      let col = d === 0 ? '#6a5a64' : d < 2 ? '#4a3c48' : n < 0.18 ? '#120e16' : (x + y * 2) % 13 === 0 ? '#1c1620' : d < 8 ? '#2e2632' : '#221a26';
      if (d > 2 && ((x * 3 + y) % 29 === 0 || (x - y * 2 + 300) % 31 === 0)) col = '#120e16'; // 바위 틈
      C(x, y, col); }
      if (x > 150 && tsHash(x, 1) < 0.35) { C(x, t - 1, '#2e4024'); if (tsHash(x, 2) < 0.4) C(x, t - 2, '#45603a'); } } // 마른 풀
    // 죽은 나무 실루엣 (오른쪽 끝) · 꽂힌 깃대
    { const tx = 372, tb = ledgeTop(372); for (let y = tb - 34; y < tb; y++) C(tx, y, '#100a12'), C(tx + 1, y, '#100a12'); for (const [x0, y0, dx, n] of [[tx, tb - 24, -1, 9], [tx + 1, tb - 30, 1, 8], [tx, tb - 16, -1, 6], [tx + 1, tb - 12, 1, 5]]) for (let i = 0; i < n; i++) C(x0 + dx * i, y0 - (i >> 1), '#100a12'); }
    { const fx = 212, fb = ledgeTop(212); for (let y = fb - 30; y < fb; y++) C(fx, y, '#3c2614'); for (let y = fb - 30; y < fb - 18; y++) for (let x = fx + 1; x < fx + 9; x++) { if (y > fb - 21 && (x + y) % 3 === 0) continue; C(x, y, x === fx + 1 ? '#a8342c' : y === fb - 30 ? '#c09a48' : '#7e2220'); } C(fx + 4, fb - 25, '#c09a48'); C(fx + 5, fb - 25, '#c09a48'); C(fx + 4, fb - 24, '#c09a48'); }
    return c;
  }
  // 토벌대: 모닥불을 가운데 두고 성채를 바라봄 (스프라이트는 게임 그대로, 무기도 같은 도트)
  const TS_HEROES = [['knight', 484, -2.25], ['priest', 516, -2.0], ['mage', 598, -1.4], ['ranger', 628, 1.9], ['gunner', 660, -0.25]]; // x는 px
  function drawTitleScene() {
    if (!TS.cv) TS.cv = genTitleScene();
    ctx.drawImage(TS.cv, 0, 0);
    const C = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(x * 2, y * 2, 2, 2); }, f = Math.floor(time * 8);
    // 창불: 칸마다 따로 깜빡
    for (const [i, [x, y]] of TS.win.entries()) { const on = (f + i * 5) % 23 !== 0; C(x, y, on ? ((f >> 1) + i) % 5 ? '#ff9a3a' : '#ffd060' : '#7a3010'); C(x, y + 1, on ? '#c0501a' : '#4a1a0c'); }
    // 모닥불 (칸 단위)
    const fx = 277, fy = TS.ledge(277);
    for (const [dx, c] of [[-3, '#4a3c48'], [-2, '#2e2632'], [2, '#2e2632'], [3, '#4a3c48']]) C(fx + dx, fy - 1, c);
    C(fx - 2, fy - 1, '#5c3c20'); C(fx - 1, fy - 1, '#3c2614'); C(fx, fy - 1, '#5c3c20'); C(fx + 1, fy - 1, '#3c2614');
    for (let i = -2; i <= 2; i++) { const h = 2 + ((f + i * 7 + 20) % 3) + (i === 0 ? 3 : Math.abs(i) === 1 ? 1 : 0); for (let k = 0; k < h; k++) C(fx + i, fy - 2 - k, k < 1 ? '#e2501c' : k < h - 1 ? '#ff9a2a' : '#ffe28a'); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let y = -14; y <= 4; y++) for (let x = -22; x <= 22; x++) { const d = Math.hypot(x / 22, y / 12); if (d < 1 && dith(fx + x, fy + y, (1 - d) * 0.45)) C(fx + x, fy - 3 + y, '#3a1a08'); }
    ctx.restore();
    // 토벌대
    for (const [cls, x, ang] of TS_HEROES) { const y = TS.ledge(x / 2 | 0) * 2 + 2, face = x / 2 < fx ? 1 : -1, bob = ((f >> 3) + x) % 6 === 0 ? -2 : 0;
      const tex = WEAP[cls][0], hx = x + face * 4, hy = y - 9 + bob;
      if (cls !== 'gunner') drawBlade(tex, hx - face * 6, hy, face > 0 ? ang : Math.PI - ang);
      drawSprite(cls, cls, 2, x, y + bob, face < 0);
      if (cls === 'gunner') drawBlade(tex, hx, hy + 2, face > 0 ? ang : Math.PI - ang); }
    // 재: 위에서 천천히 내림 / 불티: 모닥불에서 오름 (칸 단위)
    if (TS.ash.length < 90 && Math.random() < 0.6) TS.ash.push({ x: rand(0, 384), y: -2, vx: rand(-3, 1), vy: rand(6, 14), ph: rand(0, 6) });
    if (Math.random() < 0.25) TS.emb.push({ x: fx + rand(-2, 2), y: fy - 4, vx: rand(-3, 3), vy: -rand(8, 16), t: rand(1.5, 3) });
    for (const a of TS.ash) { a.x += (a.vx + Math.sin(time * 0.8 + a.ph) * 3) / 60; a.y += a.vy / 60; C(Math.round(a.x), Math.round(a.y), a.ph < 2 ? '#8a8088' : '#5a525c'); }
    for (const e of TS.emb) { e.x += (e.vx + Math.sin(time * 2 + e.t * 3) * 4) / 60; e.y += e.vy / 60; e.t -= 1 / 60; C(Math.round(e.x), Math.round(e.y), e.t > 1 ? '#ffb040' : '#c0401a'); }
    TS.ash = TS.ash.filter(a => a.y < 216); TS.emb = TS.emb.filter(e => e.t > 0);
  }
  function render() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    if (!G) { drawTitleScene(); ctx.restore(); return; } // v1.12 타이틀 도트 그림
    let sx = 0, sy = 0;
    // v1.07: 화면 흔들림 전부 끔 (사용자 결정 — 액션할 때 화면이 흔들리거나 움직이지 않게). shake 값은 계산만 남음
    // v1.05: 타격 줌(화면 전체 비정수 배율)은 도트 격자를 깨서 끔 — 흔들림·히트스톱으로 손맛
    camSnap(); ctx.translate(-CAMX + snap2(sx), -CAMY + snap2(sy)); // v1.05: 카메라·흔들림도 2px 단위 (v1.06 플레이어 기준)
    wtextDefer = !!G; WTEXT.length = 0;
    ctx.drawImage(G && G.stage === 1 && !(G.dun && G.dun.forge) ? floorM : floor, 0, 0);
    ctx.drawImage(decal, 0, 0);
    if (G && G.dun) drawRoomBack();
    if (!G || STG().torches) drawTorches();
    if (!G) {
      ctx.restore();
      ctx.fillStyle = 'rgba(4,3,10,.5)'; ctx.fillRect(0, 0, VW, VH);
      if (Math.random() < 0.5) titleEmbers.push({ x: rand(0, VW), y: VH + 4, vx: rand(-8, 8), vy: -rand(14, 34), t: rand(5, 10), c: pick(['#ff8a2a', '#c0303a', '#ffd060']) });
      for (const e of titleEmbers) { e.x += (e.vx + Math.sin(time + e.y * 0.03) * 8) / 60; e.y += e.vy / 60; e.t -= 1 / 60; ctx.fillStyle = e.c; ctx.globalAlpha = Math.min(1, e.t / 2); ctx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1); }
      ctx.globalAlpha = 1;
      for (let i = titleEmbers.length - 1; i >= 0; i--) if (titleEmbers[i].t <= 0 || titleEmbers[i].y < -4) titleEmbers.splice(i, 1);
      return;
    }
    if (G.bonfire && !(G.dun && G.dun.cur && G.dun.cur.type === 'rest')) drawBonfire(G.bonfire);
    for (const l of G.loot) drawLoot(l);
    drawMeteorMark();
    for (const t of G.tele) if (!t.mark) drawTele(t);
    // 보스 전조(경고)는 보스·캐릭터 그래픽 아래에 (v0.74)
    drawArenaCrowd(); drawRiteGround();
    drawGearGround();
    for (const t of G.tele) { if (t.mark) drawTele(t); drawTeleGlow(t); } // v0.79: 모든 몬스터의 예고는 캐릭터·몬스터 그래픽 아래에
    const ents = G.enemies.filter(e => !e.dead).map(e => ({ y: e.y, d: () => drawEnemyShk(e) }));
    if (G.corpses) for (const c of G.corpses) ents.push({ y: c.e.y, d: () => drawCorpse(c) });
    ents.push({ y: G.player.y, d: drawPlayer });
    roomEnts(ents); gearEnts(ents); forgeEnts(ents);
    for (const f of G.fx) if (f.kind === 'rockspike') ents.push({ y: f.y, d: () => drawFx(f) }); // 솟는 바위는 깊이 정렬
    ents.sort((a, b) => a.y - b.y).forEach(o => o.d());
    flushBubbles(); // v1.10 말주머니는 모든 물체 위에
    drawGearTop();
    for (const d of G.drops) drawDrop(d);
    for (const f of G.fx) if (f.kind !== 'rockspike') drawFx(f);
    for (const pr of G.proj) drawProj(pr);
    for (const pr of G.mproj) drawMProj(pr);
    drawMeteorRock(); drawAimLine();
    for (const p of G.parts) { ctx.globalAlpha = Math.min(1, p.t * 3); ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
    ctx.globalAlpha = 1;
    // 안개 (카메라보다 느리게 흘러 깊이감)
    ctx.globalAlpha = 0.9;
    const fx = ((time * 8 + cam.x * 0.5) % VW + VW) % VW, fy = cam.y;
    ctx.drawImage(fog, Math.round(cam.x - fx), Math.round(fy)); ctx.drawImage(fog, Math.round(cam.x + VW - fx), Math.round(fy));
    ctx.globalAlpha = 1;
    renderLighting();
    drawEProjs(); // 적 투사체는 어둠 위에 그려 항상 또렷하게
    drawOrcWorld();
    if (G.dun) drawFireflies();
    drawTelePillar(); drawExitPillar();
    drawTreasureBeam(G.dun && G.dun.cur);
    drawVortex();
    pixelPass(); // v1.05 화면 도트화 (글자·프롬프트·숫자는 이 뒤)
    drawPrompt();
    for (const n of G.nums) { ctx.globalAlpha = Math.min(1, n.t * 3); if (n.txt) { ctx.font = '9px Galmuri9'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(n.v, Math.round(n.x) + 1, Math.round(n.y) + 1); ctx.fillStyle = n.c; ctx.fillText(n.v, Math.round(n.x), Math.round(n.y)); } else drawNumber(n.v, n.x, n.y - (n.pop > 0 ? 2 : 0), n.pop > 0 ? '#ffffff' : n.c, n.s + (n.pop > 0 ? 1 : 0)); }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ---- 여기부터 화면 좌표
    drawVortexVignette(); drawRiteVignette();
    for (const a of G.ash) { ctx.fillStyle = `rgba(${STG().ash},${a.ff != null ? a.a * (0.35 + 0.65 * Math.max(0, Math.sin(time * 2.2 + a.ff))) : a.a})`; ctx.fillRect(Math.round(a.x), Math.round(a.y), a.s, a.s); }
    drawOffscreen();
    let danger = 0;
    if (!G.player.dead) for (const t of G.tele) if (t.shape !== 'spawn' && t.owner !== null && inShape(t, G.player.x, G.player.y, G.player.r)) danger = Math.max(danger, t.t / t.dur);
    if (danger > 0.35) {
      const k = (danger - 0.35) / 0.65, vg = ctx.createRadialGradient(VW / 2, VH / 2, 180, VW / 2, VH / 2, 470);
      vg.addColorStop(0, 'rgba(160,0,0,0)'); vg.addColorStop(1, `rgba(200,10,20,${(0.25 + 0.3 * k) * (0.7 + 0.3 * Math.sin(time * 30))})`);
      ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
    }
    if (slowmo > 0) { ctx.fillStyle = 'rgba(30,50,90,.14)'; ctx.fillRect(0, 0, VW, VH); }
    if (G.press > 0.6 && !G.player.dead) {
      const k = Math.min(1, (G.press - 0.6) / 3), vg = ctx.createRadialGradient(VW / 2, VH / 2, 200 - k * 50, VW / 2, VH / 2, 480);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(8,2,6,${0.15 + 0.35 * k})`);
      ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
    }
    if (G.player.hp / G.stats.hp < 0.3 && !G.player.dead) {
      const vg = ctx.createRadialGradient(VW / 2, VH / 2, 170, VW / 2, VH / 2, 460);
      vg.addColorStop(0, 'rgba(120,0,0,0)'); vg.addColorStop(1, `rgba(140,0,0,${0.35 + Math.sin(time * 5) * 0.1})`);
      ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
    }
    drawMinimap();
    drawCombo();
    if (flashT > 0) { ctx.globalAlpha = Math.min(0.6, flashT * 2.5); ctx.fillStyle = flashColor; ctx.fillRect(0, 0, VW, VH); ctx.globalAlpha = 1; }
    if (mode === 'map') drawMapOverlay();
    drawTransition();
  }
  // 맞는 순간 적 스프라이트를 맞은 방향으로 좌우 떨림
  function drawEnemyShk(e) {
    if (!(e.shk > 0)) return drawEnemy(e);
    const ox = e.x, oy = e.y, j = (Math.floor(e.shk * 60) % 2 ? 1 : -1) * Math.min(3, 1 + e.shk * 14);
    e.x += Math.round(Math.cos(e.shkAng) * j); e.y += Math.round(Math.sin(e.shkAng) * j * 0.5);
    drawEnemy(e);
    e.x = ox; e.y = oy;
  }
  // 연속 타격 카운터 (화면 우측)
  function drawCombo() {
    const C = G.combo; if (!C || C.n < 3 || G.player.dead) return;
    const s = C.pop > 0 ? 4 : 3, str = String(C.n), x = VW - 18, y = 170;
    const col = C.n >= 50 ? '#ff5a3c' : C.n >= 25 ? '#ffb030' : C.n >= 10 ? '#ffe39a' : '#ffffff';
    ctx.globalAlpha = Math.min(1, C.t * 2);
    const w = str.length * 4 * s - s;
    drawNumber(str, x - 34 - w / 2, y - (C.pop > 0 ? 2 : 0), C.pop > 0 ? '#ffffff' : col, s);
    drawNumber('HIT', x - 12, y + 5 * s - 10, col, 2);
    const bw = 60, k = Math.max(0, C.t / 2.6);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - bw, y + 5 * s + 4, bw, 3);
    ctx.fillStyle = col; ctx.fillRect(x - bw, y + 5 * s + 4, Math.round(bw * k), 3);
    ctx.globalAlpha = 1;
  }
  // 화면 밖 적: UI를 피한 안쪽 테두리에 방향 화살표
  function drawOffscreen() {
    const R0 = { x0: 142, y0: 76, x1: VW - 10, y1: VH - 88 }, cx = SAFE.cx, cy = SAFE.cy;
    for (const e of G.enemies) {
      if (e.dead) continue;
      const sx = e.x - cam.x, sy = e.y - 12 - cam.y;
      if (sx > 0 && sx < VW && sy > 0 && sy < VH) continue;
      const dx = sx - cx, dy = sy - cy, k = Math.min((dx > 0 ? R0.x1 - cx : cx - R0.x0) / Math.max(1e-3, Math.abs(dx)), (dy > 0 ? R0.y1 - cy : cy - R0.y0) / Math.max(1e-3, Math.abs(dy)));
      const ax = cx + dx * k, ay = cy + dy * k, a = Math.atan2(dy, dx);
      const big = e.type === 'boss' || isElite(e), winding = e.state === 'wind' || e.state === 'hold';
      const col = e.type === 'boss' ? '200,120,255' : winding ? '255,60,50' : big ? '255,90,70' : '200,70,70';
      const al = winding ? (Math.floor(time * 12) % 2 ? 1 : 0.4) : 0.75, s = big ? 7 : 5;
      drawBlade(triW(col, big ? 4 : 3), ax, ay, a, al); // v1.05 칸 단위 회전 도트
    }
  }

  // ---------------------------------------------------------------- 픽셀 아이콘
  const ICON_PAL = { s: '#8a5aa8', k: '#000000', w: '#ffffff', l: '#b9bfca', g: '#c9a24a', h: '#6a4528', b: '#8fc8ff', B: '#3d6fa8', G: '#e3b54a', W: '#fff0b0', y: '#f2d78c', r: '#d33a3a', R: '#8e1d21', e: '#7cc98a', E: '#3d7a4a', a: '#8d8496', A: '#5b5560' };
  const ICONS = {
    atk: [
      '..............kk', '.............kwk', '............kwlk', '...........kwlk.', '..........kwlk..', '.........kwlk...',
      '........kwlk....', '.......kwlk.....', '......kwlk......', '..kk.kwlk.......', '..kgkwlk........', '...kgkk.........',
      '..kgkgk.........', '.khk.kgk........', 'khk...kk........', 'kk..............'],
    skill: [
      '.....kkkk.......', '....kbbbbk...kk.', '...kbBkkkb..kwk.', '...kbk...kkkwlk.', '..kbk.....kwlk..', '..kbk....kwlk...',
      '..kbk...kwlk....', '...kbk.kwlk.....', '...kbkkwlk......', '..kk.kwlk.......', '..kgkwlk........', '...kgkk.........',
      '..kgkgk.........', '.khk.kgk........', 'khk...kk........', 'kk..............'],
    awaken: [
      '.......y........', '...y...y...y....', '....y..y..y.....', '.....kkkkk......', '..yykGGGGGkyy...', '....kGWWWGk.....',
      'yyy.kGWwWGk.yyy.', '....kGWWWGk.....', '..yykGGGGGkyy...', '.....kkkkk......', '....y..y..y.....', '...y...y...y....',
      '.......y........', '................', '................', '................'],
    blink: [
      '................', '..........kkk...', '.........kbbbk..', '.........kbwbk..', 'bbbbb....kbbbk..', '.........kkkkk..',
      '...bbbbbkbbbbbk.', '........kbbbbbk.', 'bbbbbbb.kbBbBbk.', '........kkbkbk..', '...bbbb..kb.kb..', '.........kk.kk..',
      '................', '................', '................', '................'],
    heart: [
      '................', '..kkk....kkk....', '.krrrk..krrrk...', 'krwrrrkkrrrrrk..', 'krrrrrrrrrrrrk..', 'krrrrrrrrrrrrk..',
      '.krrrrrrrrrrk...', '..krrrrrrrrk....', '...krrrrrrk.....', '....krrrrk......', '.....krrk.......', '......kk........'],
    bell: [
      '.......kk.......', '......kGGk......', '.....kGWGGk.....', '....kGWGGGGk....', '....kGWGGGGk....', '....kGGGGGGk....',
      '...kGGGGGGGGk...', '..kGGGGGGGGGGk..', '..kkkkkkkkkkkk..', '.......kGk......', '........k.......'],
    boot: [
      '................', '.....kkkk.......', '.....keEk.......', '.....keEk.......', '.....keEk.......', '.....keEkk......',
      '.....keeEEk.....', '....keeeeEEk....', '...keeeeeeEEk...', '...kkkkkkkkkk...', '..e....e....e...', '...e....e....e..'],
    rage: [
      '..............kk', '.............krk', '............krRk', '...........krRk.', '..........krRk..', '.........krRk...',
      '........krRk....', '.......krRk.....', '......krRk......', '..kk.krRk.......', '..kgkrRk........', '...kgkk.........',
      '..kgkgk.........', '.khk.kgk........', 'khk...kk........', 'kk..............'],
    shadow: [
      '................', '......kkkk......', '.....kssssk.....', '.....ksWsWk.....', '..k..kssssk..k..', '..kk..kkkk..kk..',
      '...kk.kssk.kk...', '....kkksskkk....', '.....kksskk.....', '....kkksskkk....', '...kk.kssk.kk...', '..kk..kssk..kk..',
      '..k..kss.ssk.k..', '.....kk...kk....', '................', '................'],
    storm: [
      '.....eeeee......', '...ee.....ee....', '..e...lll...e...', '.e..ll...ll..e..', '.e.l..kkk..l.e..', 'e.l..kwwwk..l.e.',
      'e.l.kwEEEwk.l.e.', 'e.l..kwwwk..l.e.', '.e.l..kkk..l.e..', '.e..ll...ll..e..', '..e...lll...e...', '...ee.....ee....',
      '.....eeeee......', '................', '................', '................'],
    dual: [
      'kk............kk', 'kwk..........kwk', 'klwk........kwlk', '.klwk......kwlk.', '..klwk....kwlk..', '...klwk..kwlk...',
      '....klwkkwlk....', '.....klwwlk.....', '.....kgkkgk.....', '....kgk..kgk....', '...khk....khk...', '..khk......khk..',
      '..kk........kk..', '................', '................', '................'],
    skull: ['.kkkkk.', 'kwwwwwk', 'kwkwkwk', 'kwwwwwk', '.kwkwk.', '.kwwwk.', '..kkk..'],
    crown: [
      '................', 'k.......k......k', 'kak....kAk....ka', 'kaak..kaaak..kaa', 'kaaakkaaaaakkaaa', 'kaaaaaaarraaaaaa',
      'kaaaaaarrrraaaaa', 'kaaaaaaarraaaaaa', 'kAAAAAAAAAAAAAAA', 'kkkkkkkkkkkkkkkk'],
  };
  const BUFF_ICON = { atk: ICONS.rage, spd: ICONS.blink, hp: ICONS.heart, stam: ICONS.boot, cd: ICONS.bell };
  // 새 직업 아이콘은 코드로 그린다 (윤곽선 자동)
  function genIcon(fn) {
    const g = Array.from({ length: 16 }, () => Array(16).fill('.'));
    const P = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < 16 && y >= 0 && y < 16) g[y][x] = c; };
    const disc = (cx, cy, r, c) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) P(x, y, c); };
    const line = (x0, y0, x1, y1, c, w) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 + 1; for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; P(x, y, c); if (w) P(x + 1, y, c); } };
    fn(P, disc, line);
    const out = g.map(r => r.slice());
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (g[y][x] === '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx] && g[y + dy][x + dx] !== '.')) out[y][x] = 'k';
    return out.map(r => r.join(''));
  }
  Object.assign(ICON_PAL, { o: '#ff9a2e', O: '#c0501a', p: '#c890ff', P: '#5a2a8a' });
  Object.assign(ICONS, {
    bolt: genIcon((P, disc, line) => { line(2, 13, 8, 7, 's'); line(1, 10, 6, 7, 'p'); line(4, 14, 8, 10, 'p'); disc(10, 6, 3.6, 'P'); disc(10, 6, 2.5, 'p'); disc(9.5, 5.5, 1, 'w'); }),
    fireball: genIcon((P, disc, line) => { line(1, 14, 6, 9, 'O', 1); line(3, 14, 7, 11, 'o'); line(1, 11, 5, 8, 'o'); disc(9.5, 6.5, 4.6, 'O'); disc(9.5, 6.5, 3.4, 'o'); disc(9, 6, 1.7, 'y'); }),
    meteor: genIcon((P, disc, line) => { line(1, 1, 7, 7, 'o', 1); line(3, 1, 8, 6, 'O', 1); line(1, 3, 6, 8, 'y'); disc(10, 9, 3.8, 'A'); disc(9.5, 8.5, 2.6, 'a'); for (let x = 3; x < 16; x += 2) P(x, 15, 'o'); P(13, 13, 'o'); P(6, 13, 'o'); }),
    mace: genIcon((P, disc, line) => { line(2, 14, 9, 7, 'h', 1); P(2, 14, 'g'); P(3, 13, 'g'); disc(11, 5, 3.4, 'l'); disc(11, 5, 1.8, 'w'); P(11, 0, 'l'); P(15, 5, 'l'); P(14, 2, 'l'); P(8, 2, 'l'); }),
    heal: genIcon((P, disc, line) => { for (let y = 2; y <= 13; y++) for (let x = 6; x <= 9; x++) P(x, y, 'W'); for (let y = 6; y <= 9; y++) for (let x = 2; x <= 13; x++) P(x, y, 'W'); line(7.5, 3, 7.5, 12, 'G'); line(3, 7.5, 12, 7.5, 'G'); P(1, 1, 'y'); P(14, 1, 'y'); P(1, 14, 'y'); P(14, 14, 'y'); }),
    miracle: genIcon((P, disc, line) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d > 5.2 && d < 6.6) P(x, y, 'y'); } disc(7.5, 7.5, 2.6, 'W'); disc(7.5, 7.5, 1.2, 'w'); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P(7.5 + Math.cos(a) * 4, 7.5 + Math.sin(a) * 4, 'G'); } }),
    musket: genIcon((P, disc, line) => { line(4, 11, 15, 1, 'A', 1); line(5, 11, 15, 2, 'l'); line(0, 14, 5, 10, 'h', 1); P(1, 14, 'h'); P(7, 9, 'g'); P(11, 5, 'g'); P(5, 12, 'A'); }),
    shotgun: genIcon((P, disc, line) => { line(0, 15, 5, 10, 'h', 1); line(4, 11, 7, 8, 'A', 1); for (let i = 0; i < 7; i++) { const a = -Math.PI / 4 + (i - 3) * 0.2, r = 6 + (i % 3) * 1.5; P(8 + Math.cos(a) * r, 7 + Math.sin(a) * r, 'y'); P(8 + Math.cos(a) * (r - 3), 7 + Math.sin(a) * (r - 3), 'o'); } }),
    snipe: genIcon((P, disc, line) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d > 5 && d < 6.3) P(x, y, 'r'); } line(7.5, 0, 7.5, 4, 'r'); line(7.5, 11, 7.5, 15, 'r'); line(0, 7.5, 4, 7.5, 'r'); line(11, 7.5, 15, 7.5, 'r'); P(7.5, 7.5, 'w'); }),
  });
  function drawIcon(c, map) {
    const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
    const oy = Math.floor((c.height - map.length) / 2), ox = Math.floor((c.width - map[0].length) / 2);
    map.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch !== '.' && ICON_PAL[ch]) { g.fillStyle = ICON_PAL[ch]; g.fillRect(ox + x, oy + y, 1, 1); } } });
  }
  // ---------------------------------------------------------------- 스킬 아이콘 32×32 (디더링 배경 + 윤곽선 자동)
  const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  // N=32: 1px 아이콘 / N=16: 캐릭터와 같은 2px 칸 아이콘 (같은 그리기 코드를 좌표·굵기만 반으로 줄여 다시 그린다)
  function icon32(theme, draw) { const c = iconBuild(theme, draw, 32); c.cell = iconBuild(theme, draw, 16); return c; }
  function iconBuild(theme, draw, N) {
    const [c, g] = mkCanvas(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - 15.5 * N / 32, y - 13 * N / 32) / (20 * N / 32), v = 1 - d + (BAYER4[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * 0.35;
      g.fillStyle = v > 0.66 ? theme[2] : v > 0.3 ? theme[1] : v > -0.05 ? theme[0] : '#06050a'; g.fillRect(x, y, 1, 1);
    }
    const L = { back: new Array(N * N).fill(null), main: new Array(N * N).fill(null), top: new Array(N * N).fill(null) };
    let cur = 'main';
    const px = (x, y, col) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < N && y >= 0 && y < N) L[cur][y * N + x] = col; };
    const each = fn => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) fn(x, y); };
    const api = {
      layer: k => { cur = k; },
      px,
      disc: (cx, cy, r, col) => each((x, y) => { if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) px(x, y, col); }),
      ring: (cx, cy, r0, r1, col, a0 = -999, a1 = 999) => each((x, y) => { const d = Math.hypot(x - cx, y - cy); if (d < r0 || d > r1) return; let a = Math.atan2(y - cy, x - cx) * 180 / Math.PI; if (a0 > -999) { while (a < a0) a += 360; if (a > a1) return; } px(x, y, col); }),
      rect: (x0, y0, x1, y1, col) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) px(x, y, col); },
      tri: (p, col) => each((x, y) => { const s = (a, b) => (b[0] - a[0]) * (y + 0.5 - a[1]) - (b[1] - a[1]) * (x + 0.5 - a[0]); const d1 = s(p[0], p[1]), d2 = s(p[1], p[2]), d3 = s(p[2], p[0]); if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) px(x, y, col); }),
      line: (x0, y0, x1, y1, w, col) => { const L2 = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L2, uy = (y1 - y0) / L2; each((x, y) => { const dx = x + 0.5 - x0 - 0.5, dy = y + 0.5 - y0 - 0.5, t = dx * ux + dy * uy, s = Math.abs(-dx * uy + dy * ux); if (t >= -0.5 && t <= L2 + 0.5 && s <= w / 2) px(x, y, col); }); },
      // 칼날: 한쪽 날은 밝게, 반대쪽은 어둡게, 끝은 뾰족하게
      blade: (x0, y0, x1, y1, w, cols, tip = 0.22) => { const L2 = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L2, uy = (y1 - y0) / L2; each((x, y) => { const dx = x - x0, dy = y - y0, t = (dx * ux + dy * uy) / L2, s = -dx * uy + dy * ux; if (t < 0 || t > 1) return; const hw = w / 2 * (t > 1 - tip ? (1 - t) / tip : 1) + 0.3; if (Math.abs(s) > hw) return; px(x, y, s < -hw * 0.25 ? cols[0] : s > hw * 0.4 ? cols[2] : cols[1]); }); },
      // 혜성 꼬리: 꼬리 끝(x0,y0)은 가늘고 어둡게, 머리(x1,y1)로 갈수록 굵고 밝게. 끝은 점으로 흩어진다
      comet: (x0, y0, x1, y1, r0, r1, cols, wave = 0) => {
        const n = 40, L2 = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / L2, ny = (x1 - x0) / L2;
        for (let i = 0; i <= n; i++) {
          const t = i / n, w = Math.sin(t * Math.PI * 2) * wave * (1 - t), cx = x0 + (x1 - x0) * t + nx * w, cy = y0 + (y1 - y0) * t + ny * w, r = r0 + (r1 - r0) * t * t;
          const col = cols[Math.min(cols.length - 1, Math.floor(t * cols.length))];
          if (t < 0.18) { if (i % 3 === 0) px(cx, cy, col); continue; }
          for (let yy = Math.floor(cy - r); yy <= Math.ceil(cy + r); yy++) for (let xx = Math.floor(cx - r); xx <= Math.ceil(cx + r); xx++) if ((xx - cx) ** 2 + (yy - cy) ** 2 <= r * r) px(xx, yy, col);
        }
      },
      arc: (cx, cy, r, a0, a1, w0, w1, cols, rev) => {
        const n = 60;
        for (let i = 0; i <= n; i++) {
          let t = i / n; const tt = rev ? 1 - t : t, an = (a0 + (a1 - a0) * t) * Math.PI / 180, w = (w0 + (w1 - w0) * tt * tt) / 2;
          const col = cols[Math.min(cols.length - 1, Math.floor(tt * cols.length))], x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r;
          if (tt < 0.15) { if (i % 3 === 0) px(x, y, col); continue; }
          for (let yy = Math.floor(y - w); yy <= Math.ceil(y + w); yy++) for (let xx = Math.floor(x - w); xx <= Math.ceil(x + w); xx++) if ((xx - x) ** 2 + (yy - y) ** 2 <= w * w) px(xx, yy, col);
        }
      },
      slash: (x0, y0, x1, y1, w, cols) => {
        const n = 40;
        for (let i = 0; i <= n; i++) {
          const t = i / n, k = Math.sin(t * Math.PI), r = w / 2 * k, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
          const col = cols[Math.min(cols.length - 1, Math.floor(k * cols.length))];
          for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) if ((xx - x) ** 2 + (yy - y) ** 2 <= r * r + 0.2) px(xx, yy, col);
        }
      },
      glow: (cx, cy, r, cols) => each((x, y) => { const d = Math.hypot(x - cx, y - cy) / r; if (d > 1) return; const v = 1 - d + (BAYER4[(y % 4) * 4 + (x % 4)] / 16 - 0.5) * 0.4; const i = Math.min(cols.length - 1, Math.floor(v * cols.length)); if (i >= 0) px(x, y, cols[i]); }),
      star: (x, y, r, col, core = '#ffffff') => { for (let i = -r; i <= r; i++) { px(x + i, y, col); px(x, y + i, col); } if (r > 2) { px(x - 1, y - 1, col); px(x + 1, y - 1, col); px(x - 1, y + 1, col); px(x + 1, y + 1, col); } px(x, y, core); },
    };
    if (N === 32) draw(api);
    else {
      const k = N / 32, S = v => v * k - (1 - k) * 0.5, W = (v, m) => Math.max(m, v * k);
      draw({
        layer: api.layer, px: (x, y, col) => px(S(x), S(y), col),
        disc: (cx, cy, r, col) => api.disc(S(cx), S(cy), W(r, 0.6), col),
        ring: (cx, cy, r0, r1, col, a0, a1) => api.ring(S(cx), S(cy), r0 * k, W(r1, r0 * k + 0.8), col, a0, a1),
        rect: (x0, y0, x1, y1, col) => api.rect(Math.round(S(x0)), Math.round(S(y0)), Math.round(S(x1)), Math.round(S(y1)), col),
        tri: (p, col) => api.tri(p.map(([x, y]) => [S(x), S(y)]), col),
        line: (x0, y0, x1, y1, w, col) => api.line(S(x0), S(y0), S(x1), S(y1), W(w, 1), col),
        blade: (x0, y0, x1, y1, w, cols, tip) => api.blade(S(x0), S(y0), S(x1), S(y1), W(w, 1.6), cols, tip),
        comet: (x0, y0, x1, y1, r0, r1, cols, wave = 0) => api.comet(S(x0), S(y0), S(x1), S(y1), W(r0, 0.4), W(r1, 0.6), cols, wave * k),
        arc: (cx, cy, r, a0, a1, w0, w1, cols, rev) => api.arc(S(cx), S(cy), r * k, a0, a1, W(w0, 0.6), W(w1, 1), cols, rev),
        slash: (x0, y0, x1, y1, w, cols) => api.slash(S(x0), S(y0), S(x1), S(y1), W(w, 1.6), cols),
        glow: (cx, cy, r, cols) => api.glow(S(cx), S(cy), r * k, cols),
        star: (x, y, r, col, core) => api.star(Math.round(S(x)), Math.round(S(y)), Math.max(1, Math.round(r * k)), col, core),
      });
    }
    const OUT = '#06050a', main = L.main, outl = main.slice();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!main[y * N + x]) { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < N && yy >= 0 && yy < N && main[yy * N + xx]) { outl[y * N + x] = OUT; break; } } }
    for (const layer of [L.back, outl, L.top]) layer.forEach((col, i) => { if (col) { g.fillStyle = col; g.fillRect(i % N, Math.floor(i / N), 1, 1); } });
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.strokeRect(0.5, 0.5, N - 1, N - 1);
    return c;
  }
  const STEEL = ['#ffffff', '#c8ccd8', '#6a7084'], GOLDP = ['#fff4c0', '#e8b84a', '#8a5a1a'], HOLY = ['#ffffff', '#ffe08a', '#c08a2a'];
  const FIG = (a, x, col, eye) => { a.disc(x, 10, 3.6, col); a.tri([[x, 11], [x - 6, 27], [x + 6, 27]], col); if (eye) { a.px(x + 1, 10, eye); a.px(x - 1, 10, eye); } };
  const ICON32 = {
    atk: icon32(['#1a0c0c', '#3a1414', '#6a2418'], a => {
      a.layer('back'); a.glow(23, 8, 7, ['#5a1a10', '#8a3018']);
      a.arc(15, 18, 12, 195, 325, 0.4, 4.2, ['#5a1a10', '#a03a18', '#e07030', '#ffc890']);
      a.arc(15, 18, 9, 215, 315, 0.3, 1.6, ['#a03a18', '#ffb070']);
      a.layer('main'); a.blade(9, 23, 27, 5, 6, STEEL, 0.22); a.line(12, 20, 24, 8, 0.8, '#8a90a0');
      a.line(6, 19, 13, 26, 2.4, '#c9902a'); a.line(6, 19, 13, 26, 0.8, '#ffe08a');
      a.line(4, 28, 8, 24, 2.6, '#4a2e1a'); a.px(5, 26, '#7a5232'); a.px(7, 25, '#7a5232'); a.disc(3.5, 28.5, 1.6, '#a3222a'); a.px(3, 28, '#ff8080');
      a.layer('top'); a.star(26, 6, 3, '#fff4c0'); a.px(20, 12, '#ffffff');
    }),
    skill: icon32(['#081428', '#10284a', '#1e4a80'], a => {
      a.layer('back'); for (const [y, l] of [[9, 10], [15, 13], [21, 9]]) a.comet(3, y, 3 + l, y, 0.3, 1.4, ['#1e4a80', '#4a90e0', '#9fd8ff']);
      a.arc(14, 19, 12, -105, 5, 0.4, 4, ['#1e4a80', '#3a80d0', '#9fd8ff', '#e8f4ff']);
      a.glow(26, 8, 5, ['#1e4a80', '#3a70b0']);
      a.layer('main'); a.blade(8, 24, 27, 8, 6, STEEL, 0.22); a.line(11, 21, 23, 11, 0.8, '#8a90a0');
      a.line(5, 19, 11, 27, 2.4, '#c9902a'); a.line(5, 19, 11, 27, 0.8, '#ffe08a'); a.line(3, 29, 7, 25, 2.6, '#4a2e1a'); a.px(4, 27, '#7a5232');
      a.layer('top'); a.star(27, 7, 2, '#cfe8ff'); a.px(22, 4, '#ffffff'); a.px(28, 15, '#9fd8ff');
    }),
    awaken: icon32(['#1a1206', '#3a2a0c', '#7a5a18'], a => {
      a.layer('back'); a.glow(16, 12, 12, ['#4a3410', '#7a5a18', '#b08a2a']);
      for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + 0.2; a.comet(16 + Math.cos(an) * 14, 12 + Math.sin(an) * 13, 16 + Math.cos(an) * 7, 12 + Math.sin(an) * 7, 0.3, 1.3, ['#8a6a20', '#d8b040', '#fff0b0']); }
      a.ring(16, 12, 8.5, 10, '#ffe08a'); a.ring(16, 12, 10, 10.8, '#c8902a');
      a.layer('main'); a.blade(16, 7, 16, 30, 8, HOLY, 0.28); a.line(16, 9, 16, 26, 0.8, '#fff8e0');
      a.line(9, 8, 23, 8, 2.6, '#c9902a'); a.line(9, 8, 23, 8, 0.8, '#ffe08a'); a.disc(9, 8, 1.4, '#a3222a'); a.disc(23, 8, 1.4, '#a3222a');
      a.line(16, 2, 16, 7, 2.8, '#7a5232'); a.disc(16, 2, 1.5, '#ffe08a');
      a.layer('top'); a.star(9, 19, 2, '#fff4c0'); a.star(24, 24, 2, '#fff4c0'); a.px(16, 15, '#ffffff');
    }),
    dual: icon32(['#0a160e', '#14301c', '#24502e'], a => {
      a.layer('back'); a.glow(16, 15, 9, ['#14301c', '#1e4a2c']);
      a.arc(16, 17, 12, 200, 300, 0.3, 3.4, ['#1e4a2c', '#3aa070', '#9ff0c8']);
      a.arc(16, 17, 12, -20, 80, 0.3, 3.4, ['#1e4a2c', '#3aa070', '#9ff0c8'], true);
      a.layer('main'); a.blade(7, 25, 25, 6, 4.6, STEEL, 0.3); a.blade(25, 25, 7, 6, 4.6, STEEL, 0.3);
      a.line(4, 28, 8, 24, 2.6, '#4a2e1a'); a.line(28, 28, 24, 24, 2.6, '#4a2e1a'); a.px(5, 27, '#7a5232'); a.px(27, 27, '#7a5232');
      a.line(5, 22, 10, 27, 1.8, '#a3222a'); a.line(27, 22, 22, 27, 1.8, '#a3222a');
      a.layer('top'); a.star(16, 14, 2, '#e8fff4'); a.px(24, 7, '#ffffff'); a.px(8, 7, '#ffffff');
    }),
    shadow: icon32(['#120a1c', '#24123a', '#4a2470'], a => {
      a.layer('back'); a.comet(3, 28, 11, 22, 0.4, 3.5, ['#24123a', '#3a2258', '#4a2a78']); a.comet(4, 18, 10, 16, 0.3, 2.4, ['#24123a', '#3a2258']);
      FIG(a, 8, '#2a1840'); FIG(a, 12, '#3e2466');
      a.glow(24, 15, 8, ['#3a1e5a', '#5a2e8a']);
      a.layer('main'); FIG(a, 17, '#1a0e26', '#e0a0ff'); a.line(13, 13, 21, 13, 1.6, '#a3222a'); a.px(21, 14, '#a3222a'); a.px(22, 15, '#a3222a');
      a.layer('top'); a.slash(18, 5, 30, 25, 3, ['#8a5ac8', '#e0b0ff', '#ffffff']); a.slash(18, 25, 30, 5, 3, ['#8a5ac8', '#e0b0ff', '#ffffff']); a.star(24, 15, 2, '#ffffff');
    }),
    storm: icon32(['#06140f', '#0c2a20', '#165040'], a => {
      a.layer('back'); a.glow(16, 16, 8, ['#0c2a20', '#1a5a40']);
      a.arc(16, 16, 12.5, 160, 430, 0.3, 3.4, ['#165040', '#3aa070', '#9ff0c8']);
      a.arc(16, 16, 8, -20, 250, 0.3, 2.4, ['#165040', '#3aa070', '#c8ffe4']);
      a.layer('main'); for (let i = 0; i < 4; i++) { const an = i * Math.PI / 2 + 0.4, cx = 16 + Math.cos(an) * 10, cy = 16 + Math.sin(an) * 10, tx = -Math.sin(an), ty = Math.cos(an); a.blade(cx - tx * 5, cy - ty * 5, cx + tx * 6, cy + ty * 6, 3.6, ['#ffffff', '#a8f0d0', '#3aa070'], 0.35); }
      a.layer('top'); a.star(16, 16, 2, '#e8fff4'); a.px(6, 7, '#9ff0c8'); a.px(26, 26, '#9ff0c8');
    }),
    bolt: icon32(['#0e0818', '#1e1036', '#3a1e66'], a => {
      a.layer('back');
      a.comet(3, 29, 20, 12, 0.8, 5.6, ['#4a2478', '#6a34a8', '#8a4ad0', '#a868f0']);
      a.comet(8, 29, 20, 15, 0.4, 2.4, ['#3e1c66', '#6a34a8', '#9a5ae0'], 1.4);
      a.comet(3, 23, 18, 11, 0.4, 2.2, ['#3e1c66', '#6a34a8', '#9a5ae0'], -1.4);
      a.comet(6, 26, 20, 12, 0.3, 1.8, ['#8a4ad0', '#c890ff', '#e8d0ff']);
      a.layer('main'); a.disc(21.5, 10.5, 6.6, '#6a2ab0'); a.disc(20.9, 9.9, 5, '#a060f0'); a.disc(20.2, 9.2, 3.2, '#d8b8ff'); a.disc(19.6, 8.6, 1.5, '#ffffff');
      a.layer('top'); a.star(26, 22, 2, '#d090ff'); a.star(10, 8, 1, '#d090ff'); a.px(28, 4, '#ffffff'); a.px(5, 17, '#b070ff'); a.px(15, 27, '#9a5ae0');
    }),
    fireball: icon32(['#180806', '#3a1208', '#6a2a0c'], a => {
      a.layer('back');
      a.comet(3, 29, 20, 12, 0.8, 6.8, ['#7a2008', '#b0380e', '#e05a1a', '#ff8a3a']);
      a.comet(9, 29, 21, 15, 0.4, 3.2, ['#6a1e08', '#c0401a', '#ff7a2a'], 1.8);
      a.comet(3, 22, 17, 10, 0.4, 3.0, ['#6a1e08', '#c0401a', '#ff7a2a'], -1.8);
      a.comet(6, 26, 20, 12, 0.3, 2.6, ['#ff7a2a', '#ffb050', '#ffe0a0']);
      a.layer('main'); a.disc(21.5, 10.5, 7.6, '#b0380e'); a.disc(20.9, 9.9, 5.9, '#ff6a1a'); a.disc(20.2, 9.2, 4, '#ffb040'); a.disc(19.6, 8.6, 2.2, '#fff0b0'); a.px(19, 8, '#ffffff');
      a.layer('top'); for (const [x, y, c] of [[29, 4, '#ffe0a0'], [28, 20, '#ffb060'], [11, 5, '#ffb060'], [5, 15, '#ff7a2a'], [16, 27, '#ff7a2a'], [24, 25, '#ffd080']]) a.px(x, y, c);
    }),
    meteor: icon32(['#120a0a', '#2a1410', '#5a2414'], a => {
      a.layer('back');
      a.comet(4, 4, 16, 15, 0.6, 7, ['#3a1006', '#6a1e08', '#a0300e', '#e0601e']);
      a.comet(9, 3, 18, 13, 0.4, 3, ['#6a1e08', '#c0401a', '#ff8a3a'], 1.4);
      a.comet(3, 9, 14, 17, 0.4, 3, ['#6a1e08', '#c0401a', '#ff8a3a'], -1.4);
      a.comet(6, 6, 16, 15, 0.3, 3, ['#ff8a3a', '#ffc060', '#ffe8b0']);
      a.ring(19, 29, 0, 10, '#5a1e0c'); a.ring(19, 29, 0, 6, '#a0401a'); a.ring(19, 29, 0, 3, '#ff8a3a');
      a.layer('main'); a.disc(20, 19, 7, '#3a2a2a'); a.disc(18.8, 17.8, 5, '#5a4848'); a.disc(17.8, 16.8, 2.4, '#8a7878'); a.px(16, 16, '#b0a0a0');
      a.px(23, 22, '#ff8a3a'); a.px(24, 21, '#ff8a3a'); a.px(22, 23, '#ffc060'); a.px(25, 18, '#ffc060');
      a.layer('top'); a.star(9, 26, 1, '#ffe0a0'); a.star(28, 26, 1, '#ffc060'); a.px(27, 11, '#ffb060'); a.px(12, 22, '#ff8a3a');
    }),
    mace: icon32(['#14100a', '#2e2414', '#5a4620'], a => {
      a.layer('back'); a.glow(21, 11, 10, ['#3a2e14', '#6a5420', '#a08030']);
      a.arc(15, 17, 12, 195, 300, 0.3, 3.2, ['#5a4620', '#c8902a', '#ffe8a0']);
      a.layer('main'); a.line(5, 27, 17, 15, 3.4, '#5a3a22'); a.line(5, 27, 17, 15, 1, '#8a6236'); a.line(5, 27, 8, 24, 3.6, '#c9902a'); a.line(13, 19, 15, 17, 3.6, '#c9902a'); a.px(6, 25, '#ffe08a'); a.px(14, 17, '#ffe08a');
      a.line(21, 3, 21, 19, 3.2, '#9aa0b0'); a.line(13, 11, 29, 11, 3.2, '#9aa0b0'); a.line(20, 3, 20, 19, 1, '#e0e4ec'); a.line(13, 10, 29, 10, 1, '#e0e4ec');
      a.disc(21, 11, 5.4, '#6a7084'); a.disc(20.3, 10.3, 4, '#a8aebc'); a.disc(19.6, 9.6, 2.2, '#e0e4ec'); a.px(19, 9, '#ffffff');
      a.layer('top'); a.star(27, 4, 3, '#fff4c0'); a.px(9, 7, '#ffe08a'); a.px(25, 22, '#ffe08a');
    }),
    heal: icon32(['#0a140a', '#18301a', '#2e5a2a'], a => {
      a.layer('back'); a.glow(16, 16, 12, ['#18301a', '#2e5a2a', '#4a7a2a']);
      for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + 0.39; a.comet(16 + Math.cos(an) * 15, 16 + Math.sin(an) * 15, 16 + Math.cos(an) * 9, 16 + Math.sin(an) * 9, 0.3, 1.4, ['#4a7a2a', '#a8c84a', '#f0f8b0']); }
      a.layer('main'); a.rect(13, 4, 18, 27, '#c9902a'); a.rect(5, 11, 26, 16, '#c9902a'); a.rect(14, 5, 17, 26, '#ffe08a'); a.rect(6, 12, 25, 15, '#ffe08a');
      a.rect(14, 5, 14, 26, '#fff8d8'); a.rect(6, 12, 25, 12, '#fff8d8'); a.rect(17, 6, 17, 26, '#b07a1a'); a.rect(6, 15, 25, 15, '#b07a1a'); a.rect(15, 13, 16, 14, '#ffffff');
      a.layer('top'); for (const [x, y] of [[6, 6], [26, 25], [25, 6], [6, 25]]) { a.px(x, y, '#7dff8a'); a.px(x - 1, y, '#4ac860'); a.px(x + 1, y, '#4ac860'); a.px(x, y - 1, '#4ac860'); a.px(x, y + 1, '#4ac860'); }
      a.comet(22, 30, 22, 22, 0.3, 1, ['#2e5a2a', '#7dff8a']); a.comet(9, 30, 9, 24, 0.3, 1, ['#2e5a2a', '#7dff8a']);
    }),
    miracle: icon32(['#16120a', '#3a3016', '#806a2a'], a => {
      a.layer('back'); a.glow(16, 18, 12, ['#3a3016', '#6a5a22', '#a08a40']);
      a.line(16, 8, 16, 30, 9, '#8a6a20'); a.line(16, 8, 16, 30, 6, '#d8b040'); a.line(16, 8, 16, 30, 3, '#fff4c0'); a.line(16, 8, 16, 30, 1, '#ffffff');
      a.layer('main');
      for (const sg of [-1, 1]) { const ox = 16 + sg * 2;
        a.comet(ox + sg * 13, 6, ox, 13, 0.6, 2.4, ['#c8c0b0', '#e8e0d0', '#ffffff']);
        a.comet(ox + sg * 14, 13, ox, 15, 0.6, 2.4, ['#b0a898', '#d8d0c0', '#f0ece0']);
        a.comet(ox + sg * 12, 20, ox, 17, 0.6, 2.2, ['#9a9284', '#c8c0b0', '#e8e0d0']);
        a.comet(ox + sg * 9, 26, ox, 19, 0.6, 2, ['#8a8274', '#b0a898', '#d8d0c0']); }
      a.disc(16, 16, 3.2, '#fff8d8'); a.disc(16, 16, 1.6, '#ffffff');
      a.layer('top'); a.ring(16, 5, 3.2, 4.6, '#ffe08a'); a.ring(16, 5, 2.6, 3.2, '#fff8d8'); a.star(5, 28, 1, '#fff4c0'); a.star(27, 28, 1, '#fff4c0');
    }),
    musket: icon32(['#100c0a', '#241a14', '#4a3020'], a => {
      a.layer('back'); a.comet(17, 4, 26, 6, 0.6, 3.4, ['#2a2630', '#4a4650', '#6a6670']); a.comet(22, 13, 27, 8, 0.5, 2.2, ['#2a2630', '#4a4650']);
      a.glow(27, 6, 6, ['#4a2a10', '#8a5018']);
      a.layer('main'); a.line(3, 27, 10, 21, 5.6, '#6b4a2a'); a.line(3, 28, 10, 22, 1.6, '#3e2818'); a.line(4, 25, 9, 21, 0.8, '#9a7248');
      a.line(9, 22, 20, 14, 3.4, '#7a5232'); a.line(9, 21, 20, 13, 0.8, '#a07a50');
      a.line(12, 19, 26, 8, 2.4, '#5a5e6a'); a.line(12, 18, 26, 7, 0.8, '#d8dce4');
      a.px(17, 15, '#e8b84a'); a.px(18, 15, '#e8b84a'); a.px(22, 11, '#e8b84a'); a.px(23, 11, '#e8b84a'); a.px(12, 21, '#3a3a40'); a.px(13, 22, '#3a3a40');
      a.layer('top'); a.slash(25, 8, 30, 3, 2.4, ['#ff9a3a', '#ffd080', '#ffffff']); a.slash(24, 5, 30, 7, 1.6, ['#ff9a3a', '#ffd080']); a.star(27, 6, 2, '#ffd080', '#ffffff');
    }),
    shotgun: icon32(['#140a06', '#2e1408', '#5a2a10'], a => {
      a.layer('back'); a.glow(13, 19, 8, ['#5a2a10', '#a04a18']);
      for (const [x, y] of [[23, 5], [27, 10], [28, 16], [27, 22], [21, 9], [24, 16], [22, 21]]) a.comet(11, 20, x, y, 0.3, 1.4, ['#5a2a10', '#c0501a', '#ff9a3a', '#ffe0a0']);
      a.layer('main'); a.line(3, 28, 10, 21, 5, '#2e2e34'); a.line(3, 27, 10, 20, 1.2, '#8d9097'); a.line(1, 30, 5, 26, 5, '#5a3a22'); a.px(2, 29, '#8a6236');
      a.layer('top'); a.slash(9, 22, 15, 16, 3.6, ['#ff7a2a', '#ffd080', '#ffffff']); for (const [x, y] of [[23, 5], [27, 10], [28, 16], [27, 22], [21, 9], [24, 16], [22, 21]]) a.px(x, y, '#fff8e0');
    }),
    snipe: icon32(['#140608', '#2e0c12', '#5a1420'], a => {
      a.layer('back'); a.glow(16, 16, 9, ['#2e0c12', '#5a1420', '#8a2030']);
      a.comet(3, 25, 15, 17, 0.3, 1.6, ['#5a1420', '#c06040', '#ffd080']);
      a.layer('main'); a.ring(16, 16, 10, 11.8, '#b02a30'); a.ring(16, 16, 10, 10.6, '#ff6a6a', 200, 320);
      a.line(16, 2, 16, 9, 1.4, '#e04848'); a.line(16, 23, 16, 30, 1.4, '#e04848'); a.line(2, 16, 9, 16, 1.4, '#e04848'); a.line(23, 16, 30, 16, 1.4, '#e04848');
      a.layer('top'); a.disc(16, 16, 1.4, '#ffffff'); for (const t of [12, 20]) { a.px(t, 16, '#ffb0b0'); a.px(16, t, '#ffb0b0'); } a.star(16, 16, 1, '#ffd0d0', '#ffffff');
    }),
    blink: icon32(['#081020', '#0e2040', '#1a3a70'], a => {
      a.layer('back'); for (const [y, l] of [[12, 9], [18, 12], [24, 8]]) a.comet(3, y, 3 + l, y, 0.3, 1.3, ['#1a3a70', '#4a80c0', '#9fd2ff']);
      a.glow(22, 17, 8, ['#1a3a70', '#3a6ab0']); FIG(a, 9, '#1e3a6a'); FIG(a, 15, '#3a6ab0');
      a.layer('main'); FIG(a, 22, '#cfe6ff', '#1a3a70'); a.line(19, 18, 19, 25, 1, '#ffffff');
      a.layer('top'); a.star(28, 7, 2, '#ffffff', '#ffffff'); a.px(26, 27, '#9fd2ff'); a.px(5, 6, '#9fd2ff');
    }),
  };
  function drawIcon32(c, key) { c.width = 32; c.height = 32; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 32, 32); if (ICON32[key]) { const I = ICON32[key].cell || ICON32[key]; g.drawImage(I, 0, 0, 32, 32); } } // v0.49: 캐릭터와 같은 2px 칸 아이콘
  drawIcon32($('skA').querySelector('canvas'), 'atk');
  drawIcon32($('skK').querySelector('canvas'), 'skill');
  drawIcon32($('skL').querySelector('canvas'), 'awaken');
  drawIcon32($('skD').querySelector('canvas'), 'blink');
  drawIcon($('bossIcon'), ICONS.skull); drawIcon($('bossIcon2'), ICONS.skull);
  drawIcon($('crown'), ICONS.crown);

  // 초상화: 기사 스프라이트의 머리와 상반신
  function portraitURL() {
    const [c, g] = mkCanvas(14, 14);
    const rows = MAPS[CLASSES[CUR].map], pal = PAL[CLASSES[CUR].pal];
    // 수인 직업(18칸 폭)은 얼굴을 기준으로 귀까지 보이게 잘라낸다
    const wide = rows[0].length >= 18, face = rows.findIndex(r => r.includes('s')), y0 = wide ? Math.max(0, face - 7) : 0;
    rows.slice(y0, y0 + (wide ? 13 : 12)).forEach((r, y) => { for (let x = 0; x < r.length; x++) { const ch = r[x]; if (ch !== '.' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(wide ? x - 2 : x + 1, y + (wide ? 1 : 2), 1, 1); } } });
    return c.toDataURL();
  }
  // ---------------------------------------------------------------- 파티 패널 (1~4P)
  function buildParty() {
    let html = `<div class="slot pf glass" id="p1">
      <div class="portrait"><img class="px" src="${portraitURL()}" alt=""><span class="pn">1P</span><span class="x">X</span></div>
      <div class="sinfo">
        <div class="sname"><b>${CLASSES[CUR].n}</b><span id="p1hpt"></span></div>
        <div class="pbar"><i class="back" id="p1back"></i><i class="hp" id="p1hp"></i></div>
        <div class="pbar thin"><i class="gold" id="p1g"></i></div>
        <div class="tags" id="p1tags"></div>
      </div></div>`;
    for (let i = 2; i <= 4; i++) html += `<div class="slot pf glass dim empty" style="height:40px">
      <div class="portrait" style="width:30px;height:30px;flex-basis:30px"><span class="q">?</span><span class="pn">${i}P</span></div>
      <div class="sinfo"><div class="sname"><b>빈 자리</b></div><div class="wait">온라인 합류 대기</div></div></div>`;
    $('party').innerHTML = html;
  }
  buildParty();
  function applyClassUI() {
    const C = CLASSES[CUR];
    buildParty();
    $('skK').querySelector('.skn').textContent = C.skill;
    $('skL').querySelector('.skn').textContent = C.awaken;
    const ic = C.icons || (CUR === 'ranger' ? ['dual', 'shadow', 'storm'] : ['atk', 'skill', 'awaken']);
    drawIcon32($('skA').querySelector('canvas'), ic[0]);
    drawIcon32($('skK').querySelector('canvas'), ic[1]);
    drawIcon32($('skL').querySelector('canvas'), ic[2]);
    $('skA').querySelector('.skn').textContent = CUR === 'gunner' ? '사격' : CUR === 'mage' ? '마력탄' : '공격';
    $('skA').classList.remove('cd'); $('skA').classList.add('ready');
    const sw = $('skA').querySelector('.sweep'); if (sw) sw.style.setProperty('--p', '0%');
    const nm = $('skA').querySelector('.num'); if (nm) nm.textContent = '';
  }

  // ---------------------------------------------------------------- HUD
  const hudPrev = { K: true, L: false, D: true, tags: '', hearts: -1 };
  function popSkill(id) { const el = $(id); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 360); }
  function setSkill(id, ready, cdPct, num) {
    const el = $(id);
    el.classList.toggle('ready', ready); el.classList.toggle('cd', !ready);
    const sw = el.querySelector('.sweep'); if (sw) sw.style.setProperty('--p', `${ready ? 0 : cdPct}%`);
    const n = el.querySelector('.num'); if (n) n.textContent = num;
  }
  const PEEK_IDS = ['party', 'phase', 'boss', 'skills'];
  let peekRects = null, peekAge = 0;
  function updatePeek() {
    if (!G) return;
    if (!peekRects || ++peekAge > 30) {
      peekAge = 0;
      const wr = $('wrap').getBoundingClientRect(), sc = wr.width / VW;
      peekRects = PEEK_IDS.map(id => { const el = $(id); if (el.style.display === 'none') return null; const r = el.getBoundingClientRect(); return { id, x0: (r.left - wr.left) / sc, y0: (r.top - wr.top) / sc, x1: (r.right - wr.left) / sc, y1: (r.bottom - wr.top) / sc }; });
    }
    const boxes = [];
    const P = G.player, ox = cam.x, oy = cam.y; boxes.push([P.x - 14 - ox, P.y - 30 - oy, P.x + 14 - ox, P.y + 4 - oy]);
    for (const e of G.enemies) if (!e.dead) { const h = e.tall || (e.type === 'boss' ? 64 : isElite(e) ? 56 : 40), w = e.tall ? e.tall * 0.45 : e.type === 'boss' ? 30 : isElite(e) ? 26 : 14; boxes.push([e.x - w - ox, e.y - h - (e.lift || 0) - oy, e.x + w - ox, e.y + 4 - oy]); }
    for (const r of peekRects) {
      if (!r) continue;
      const hit = boxes.some(b => b[0] < r.x1 && b[2] > r.x0 && b[1] < r.y1 && b[3] > r.y0);
      $(r.id).classList.toggle('peek', hit);
    }
  }
  // 조작 안내 (화면 위쪽)
  function keyGuideHTML() {
    const C = CL(), k = (key, t) => `<span class="ki"><span class="key">${key}</span>${t}</span>`;
    if (typeof TOUCH !== 'undefined' && TOUCH.on) return `<div class="kt">터치 조작</div>
      <div class="kr">${k('왼쪽 끌기', '이동')}${k('공격', '가까운 적 자동 조준')}${k('스킬', C.skill)}${k('각성', C.awaken)}${k('점멸', '회피')}</div>
      <div class="kr">${k('F', '상호작용')}${k('지도', '방 지도·순간이동')}${k('가방', '장비')}${k('❚❚', '일시정지')}</div>
      <div class="kh">공격 직전 점멸 = 퍼펙트 회피 · 화면을 탭하면 그쪽으로 공격</div>`;
    return `<div class="kt">조작 안내</div>
      <div class="kr">${k('WASD', '이동')}${k('LMB', '공격')}${k('RMB', C.skill)}${k('E', C.awaken)}${k('SPACE', '점멸')}</div>
      <div class="kr">${k('F', '상호작용')}${k('TAB', '지도')}${k('I', '장비')}${k('ESC', '일시정지')}${k('M', '음악')}</div>
      <div class="kh">공격 직전 점멸 = 퍼펙트 회피 · H 키로 이 안내를 다시 열고 닫기</div>`;
  }
  function hud() {
    const show = !!G && !['title', 'select', 'forge'].includes(mode);
    ['party', 'phase', 'skills'].forEach(id => { $(id).style.display = show && mode !== 'map' ? '' : 'none'; });
    { const kgOn = show && mode === 'play' && G && G.kg; if (kgOn && G.kgCls !== G.cls) { $('keyguide').innerHTML = keyGuideHTML(); G.kgCls = G.cls; } $('keyguide').style.opacity = kgOn ? 1 : 0; }
    $('mute').textContent = window.AudioSys.st.muted ? 'M 음악 켜기' : 'M 음악 끄기';
    if (!show) { $('boss').style.display = 'none'; return; }
    const P = G.player, s = G.stats;
    // 1P
    $('p1hp').style.width = `${clamp(P.hp / s.hp, 0, 1) * 100}%`;
    $('p1back').style.width = `${clamp(P.hpBack / s.hp, 0, 1) * 100}%`;
    $('p1hpt').textContent = `${Math.max(0, Math.ceil(P.hp))}/${s.hp}`;
    $('p1g').style.width = `${P.gauge}%`;
    $('p1').classList.toggle('dead', P.dead);
    $('p1').classList.toggle('hurt', P.hurtT > 0);
    const tags = G.buffs.map(b => `<span class="tag">${BUFFS[b].t}</span>`).join('') + (P.awakenT > 0 || P.state === 'awaken' ? '<span class="tag aw">각성</span>' : '') + (P.state === 'storm' ? '<span class="tag aw">폭풍</span>' : '') + (P.poisonT > 0 ? '<span class="tag" style="background:#4a2060;color:#d8b0ff">중독</span>' : '');
    if (tags !== hudPrev.tags) { $('p1tags').innerHTML = tags; hudPrev.tags = tags; }
    // 페이즈
    { const R = G.dun && G.dun.cur, rs = G.rs || {};
      $('phaseText').textContent = R ? `${G.stage} · ${roomName(R.type)}` : '';
      let sub = `${R ? SHAPES[R.shape].n + ' · ' : ''}${sealHud()} · ${G.gold}G`;
      if (R && R.type === 'survive' && rs.state === 'run') { const left = SURV_PT() - (rs.phT || 0), al = G.enemies.filter(e => !e.dead).length; sub = rs.ph >= SURV_N - 1 && left <= 0 ? `잔당 소탕 · 남은 적 ${al}` : (rs.ph || 0) >= SURV_N - 1 ? `최후의 습격 · ${Math.max(0, left).toFixed(0)}초 버텨라` : `습격 ${(rs.ph || 0) + 1}/${SURV_N} · 다음 습격까지 ${Math.max(0, left).toFixed(0)}초`; }
      else if (R && R.waves && (rs.state === 'run' || rs.state === 'intro')) sub = `웨이브 ${Math.min(rs.wave + 1, R.waves.length)}/${R.waves.length} · 남은 적 ${G.enemies.filter(e => !e.dead).length + G.spawning}`;
      else if (R && R.type === 'boss') sub = '보스전';
      $('phaseSub').textContent = sub; }
    if (hudPrev.hearts !== G.stage) { hudPrev.hearts = G.stage; $('hearts').innerHTML = `<span class="f7" style="color:var(--quiet)">STAGE ${G.stage} · ${STG().n}</span>`; }
    // 스킬: 공격 콤보 단계
    const step = G.cls === 'mage' ? (P.boltN || 0) % 3 : G.cls === 'gunner' ? (P.reload > 0 ? 0 : 3) : P.state === 'attack' ? P.combo + 1 : P.comboWin > 0 ? P.combo : 0;
    if (G.cls === 'gunner') setSkill('skA', P.reload <= 0 && P.ammo > 0 && !P.dead, (P.reload / GUN_RELOAD) * 100, '');
    $('comboPips').querySelectorAll('b').forEach((b, i) => b.classList.toggle('on', i < step));
    // 돌진 참격
    const charges = s.fx.has('bulwark') && G.cls === 'knight' ? 2 : 1, total = CL().skillCd * (1 - s.cdr);
    const readyN = P.chargeCd.slice(0, charges).filter(c => c <= 0).length;
    const minCd = Math.min(...P.chargeCd.slice(0, charges));
    const kReady = readyN > 0 && !P.dead;
    setSkill('skK', kReady, (minCd / total) * 100, kReady ? '' : Math.ceil(minCd));
    $('skK').querySelector('.pips').innerHTML = charges > 1 ? [0, 1].map(i => `<b class="${i < readyN ? 'on' : ''}"></b>`).join('') : '';
    if (kReady && !hudPrev.K) { popSkill('skK'); sfx('ready'); }
    hudPrev.K = kReady;
    // 각성
    const lReady = P.gauge >= 100 && !P.dead;
    setSkill('skL', lReady, 0, lReady ? '' : `${Math.floor(P.gauge)}`);
    $('skL').classList.toggle('awake', lReady);
    $('skL').querySelector('.fill').style.setProperty('--f', `${lReady ? 0 : P.gauge}%`);
    $('skL').querySelector('.ic').style.setProperty('--rot', `${(time * 120) % 360}deg`);
    $('skL').querySelector('.num').style.fontSize = lReady ? '' : '8px';
    if (lReady && !hudPrev.L) { popSkill('skL'); sfx('ready'); }
    hudPrev.L = lReady;
    // 점멸
    const dReady = P.stam > 0 && !P.dead;
    setSkill('skD', dReady, (1 - P.stamT / 1.5) * 100, '');
    $('skD').querySelectorAll('.pips b').forEach((b, i) => b.classList.toggle('on', i < P.stam));
    if (dReady && !hudPrev.D) popSkill('skD');
    hudPrev.D = dReady;
    // 보스
    const b = G.boss;
    $('boss').style.display = b ? 'block' : 'none';
    if (b) {
      b.hpBack = b.hpBack == null ? b.hp : b.hpBack + (b.hp - b.hpBack) * 0.06;
      $('bossfill').style.width = `${clamp(b.hp / b.maxHp, 0, 1) * 100}%`;
      $('bossback').style.width = `${clamp(b.hpBack / b.maxHp, 0, 1) * 100}%`;
      $('grogifill').style.width = `${b.grogiT > 0 ? (b.grogiT / 5) * 100 : (b.grogi / b.grogiMax) * 100}%`;
      $('bossTime').textContent = b.dead ? '처치' : `남은 시간 ${Math.floor(Math.max(0, G.bossTime) / 60)}:${String(Math.floor(Math.max(0, G.bossTime) % 60)).padStart(2, '0')}`;
      $('bossStage').textContent = b.dead ? '' : b.grogiT > 0 ? '그로기!' : b.stage === 3 ? (b.kind === 'slimeking' ? '폭주' : b.kind === 'krugash' ? '피의 광란' : '광폭화') : b.armorMul && b.armorMul < 1 ? '2단계 · 북의 가호' : `${b.stage}단계`;
      $('shieldtag').style.display = b.shield && !b.dead ? 'inline' : 'none';
    }
  }

  // ---------------------------------------------------------------- 메뉴 (키보드·마우스)
  let titlePanel = 'main', resetArmed = false;
  function menuBox() {
    if (mode === 'title') return $(titlePanel === 'main' ? 'tmMain' : titlePanel === 'howto' ? 'tmHowto' : 'tmSound');
    if (mode === 'pause') return $('pmMenu');
    return null;
  }
  function menuItems() { const box = menuBox(); return box ? [...box.querySelectorAll('.mi')] : []; }
  function moveSel(d) {
    const items = menuItems(); if (!items.length) return;
    let i = items.findIndex(x => x.classList.contains('sel'));
    i = (i + d + items.length) % items.length;
    items.forEach((x, k) => x.classList.toggle('sel', k === i)); sfx('blip');
  }
  function showTitlePanel(name) {
    titlePanel = name;
    $('tmMain').style.display = name === 'main' ? '' : 'none';
    $('tmHowto').style.display = name === 'howto' ? '' : 'none';
    $('ovTitle').classList.toggle('howto', name === 'howto');
    $('tmSound').style.display = name === 'sound' ? '' : 'none';
    resetArmed = false; $('tmMain').querySelector('[data-act="reset"]').textContent = '저장 초기화';
  }
  function activate(btn) {
    const act = btn.dataset.act;
    initAudio();
    sfx('select');
    if (act === 'start') openSelect();
    else if (act === 'forge') openForge('title');
    else if (act === 'howto') showTitlePanel('howto');
    else if (act === 'sound') showTitlePanel('sound');
    else if (act === 'back') showTitlePanel('main');
    else if (act === 'reset') {
      if (!resetArmed) { resetArmed = true; btn.textContent = '정말 지울까? 한 번 더 선택'; }
      else { SAVE = blankSave(); persist(); resetArmed = false; btn.textContent = '초기화 완료'; titleMats(); }
    }
    else if (act === 'resume') resume();
    else if (act === 'inv') openInv('pause');
    else if (act === 'quit') { $('ovPause').classList.remove('on'); showResult(false); }
  }
  document.querySelectorAll('.mi').forEach(btn => {
    btn.addEventListener('mouseenter', () => { btn.parentElement.querySelectorAll('.mi').forEach(x => x.classList.toggle('sel', x === btn)); });
    btn.addEventListener('click', () => activate(btn));
  });
  // 볼륨 슬라이더 (타이틀·일시정지 공용)
  function syncVol() {
    const st = window.AudioSys.st;
    document.querySelectorAll('.volBgm').forEach(el => { el.value = Math.round(st.bgm * 100); });
    document.querySelectorAll('.volSfx').forEach(el => { el.value = Math.round(st.sfx * 100); });
    document.querySelectorAll('.volBgmV').forEach(el => { el.textContent = Math.round(st.bgm * 100); });
    document.querySelectorAll('.volSfxV').forEach(el => { el.textContent = Math.round(st.sfx * 100); });
  }
  document.querySelectorAll('.volBgm').forEach(el => el.addEventListener('input', () => { initAudio(); window.AudioSys.setVolume('bgm', el.value / 100); syncVol(); }));
  document.querySelectorAll('.volSfx').forEach(el => el.addEventListener('input', () => { initAudio(); window.AudioSys.setVolume('sfx', el.value / 100); syncVol(); sfx('blip'); }));
  syncVol();

  function titleMats() {
    const b = SAVE.best || 0, bst = Math.floor((b - 1) / 11) + 1, bp = b - (bst - 1) * 11, bs = b ? `STAGE ${bst} · ${bp === 11 ? 'BOSS' : 'PHASE ' + bp}` : '없음';
    if ($('titleInfo')) $('titleInfo').innerHTML = `토벌 완료 <b>${SAVE.clears}</b>${SAVE.clears3 ? ` (오크 부락 <b>${SAVE.clears3}</b>)` : ''} / 시도 <b>${SAVE.runs}</b> · 최고 도달 <b>${bs}</b><br>로그라이크 — 장비·재료는 한 번의 토벌 동안만 유지되고, 쓰러지면 모두 잃는다`;
  }
  function start() {
    ['ovTitle', 'ovResult', 'ovPause', 'ovRest', 'ovSelect', 'ovForge', 'ovInv'].forEach(id => $(id).classList.remove('on'));
    initAudio(); sfx('select');
    applyClassUI();
    for (const k in pressed) pressed[k] = false;
    newRun();
    mode = 'play';
  }
  function toTitle() {
    ['ovResult', 'ovPause', 'ovRest', 'ovInv'].forEach(id => $(id).classList.remove('on'));
    G = null; mode = 'title'; titleMats(); showTitlePanel('main'); $('ovTitle').classList.add('on');
    window.AudioSys.setMood('title', true);
  }
  function openPause() { mode = 'pause'; syncVol(); $('ovPause').classList.add('on'); sfx('blip'); }
  function resume() { $('ovPause').classList.remove('on'); for (const k in pressed) pressed[k] = false; mode = 'play'; }
  $('btnAgain').addEventListener('click', start);
  $('btnTitle').addEventListener('click', toTitle);
  $('btnInv').addEventListener('click', () => { resultShowAll = !resultShowAll; sfx('blip'); renderResultItems(resultWin); });
  addEventListener('keydown', e => {
    const k = e.key;
    if (k === 'm' || k === 'M') { initAudio(); window.AudioSys.toggleMute(); return; }
    if (mode === 'inv') { if (invKey(k)) e.preventDefault(); return; }
    if (mode === 'pause' && (k === 'i' || k === 'I')) { openInv('pause'); return; }
    if (mode === 'title' || mode === 'pause') {
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); moveSel(-1); }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); moveSel(1); }
      else if (k === 'Enter' || k === ' ' || k === 'j' || k === 'J') { e.preventDefault(); const it = menuItems().find(x => x.classList.contains('sel')); if (it) activate(it); }
      else if (k === 'Escape') { if (mode === 'pause') resume(); else if (titlePanel !== 'main') showTitlePanel('main'); }
    } else if (mode === 'result' && k === 'Enter') start();
    else if (mode === 'select') {
      if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'ArrowRight' || k === 'd' || k === 'D') { const ks = Object.keys(CLASSES), d = (k === 'ArrowLeft' || k === 'a' || k === 'A') ? -1 : 1; selCls = ks[(ks.indexOf(selCls) + d + ks.length) % ks.length]; sfx('blip'); renderSelect(); }
      else if (k === 'Enter' || k === ' ' || k === 'j' || k === 'J') { e.preventDefault(); chooseClass(selCls); }
      else if (k === 'Escape') closeSelect();
    } else if (mode === 'forge') {
      if (k === 'Escape') closeForge();
      else if (k === 'Enter') { e.preventDefault(); doEnhance(); }
      else if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'w' || k === 'W' || k === 's' || k === 'S') {
        e.preventDefault();
        const list = forgeList(), i = list.findIndex(x => x.id === forgeSel), d = (k === 'ArrowUp' || k === 'w' || k === 'W') ? -1 : 1;
        if (list.length) { forgeSel = list[(i + d + list.length) % list.length].id; forgeMsg = null; sfx('blip'); renderForge(); }
      }
    }
    else if (mode === 'rest' && ['1', '2', '3'].includes(k)) { const b = $('restChoices').children[+k - 1]; if (b) b.click(); }
    else if (mode === 'pick' && ['1', '2', '3'].includes(k)) takePick(+k - 1);
    else if (mode === 'pick' && k === 'Escape') closePick();
  });

  // ---------------------------------------------------------------- 장비 · 인벤토리 (v0.52)
  // 장비 아이콘: 캐릭터와 같은 2px 칸 도트 (검은 외곽선, 왼쪽 위 빛, 등급색 포인트)
  const ITEM_ICON = {
    helm: ['....hhhh....', '..hhllllld..', '.hllggggldd.', '.hlllllllld.', 'hllllllllldd', 'hlDDDDDDDDld', 'hllDllDlDldd', 'hllllllllldd', '.hllllllldd.', '.hld....ldd.', '.hd......dd.'],
    armor: ['..hh....dd..', '.hllh..dlld.', 'hllllhhllldd', 'hlllggggllld', 'hllllggllldd', '.hllllllldd.', '.hlllllllld.', '.hllDDDDlld.', '.hlllllllld.', '..hlllllld..', '..ggggggGG..'],
    boots: ['..hhhh......', '..hlld......', '..hlld......', '..hlld......', '..ggGG......', '..hlld......', '..hllldd....', '..hllllllld.', '..hlllllllld', '..DDDDDDDDDD'],
    ring: ['....gggg....', '...gGhhGg...', '....GggG....', '...yy..YY...', '..yy....YY..', '..y......Y..', '..y......Y..', '..yy....YY..', '...yy..YY...', '....YYYY....'],
    neck: ['y..........Y', '.y........Y.', '..y......Y..', '...y....Y...', '....y..Y....', '.....yY.....', '....yyYY....', '...gGhgGg...', '...ghggGG...', '...gggGGG...', '....gGGG....', '.....GG.....'],
    great: ['..........hh', '.........hld', '........hld.', '.......hld..', '......hld...', '.....hld....', '..g.hld.....', '...ggd......', '...wgg......', '..ww..g.....', '.ww.........', 'yy..........'],
    dagger: ['........hh..', '.......hlld.', '......hlld..', '.....hlld...', '....hlld....', '...ggld.....', '..wgg.......', '.ww.g.......', 'yw..........'],
    staff: ['........ggg.', '.......ghhGg', '.......ghGGg', '........gGg.', '.......wy...', '......ww....', '.....ww.....', '....ww......', '...ww.......', '..ww........', '.ww.........', 'ww..........'],
    mace: ['........h.h.', '.......hllh.', '......hllldd', '.......lgdd.', '......hdddd.', '.....yw.d...', '....ww......', '...ww.......', '..ww........', '.ww.........', 'yy..........'],
    musket: ['...........h', '..........hl', '.........hl.', '........hl..', '.......wdl..', '......ww....', '....wwwy....', '..wwww......', '.wWWw.......', '.WW.........'],
  };
  const ICON_OF_CLS = { knight: 'great', ranger: 'dagger', mage: 'staff', priest: 'mace', gunner: 'musket' };
  const SLOT_ICON = { helm: 'helm', armor: 'armor', boots: 'boots', ring: 'ring', neck: 'neck' };
  const iconKeyOf = it => it.slot === 'weapon' ? ICON_OF_CLS[it.cls || 'knight'] : SLOT_ICON[it.slot];
  const darkHex = (h, k = 0.55) => '#' + [1, 3, 5].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
  const iconCache = {};
  function itemIconURL(key, gradeC) {
    const ck = key + gradeC; if (iconCache[ck]) return iconCache[ck];
    const rows = ITEM_ICON[key], w = 14, h = 14, g = mkGrid(w, h), oy = Math.floor((12 - rows.length) / 2);
    rows.forEach((r, y) => r.split('').forEach((ch, x) => { if (ch !== '.') g[y + 1 + oy][x + 1] = ch; }));
    const pal = { k: '#000', h: '#e8e2d4', l: '#a8a2ae', d: '#625c6c', D: '#2e2a36', w: '#a0703c', W: '#5a3a1e', y: '#f2d78c', Y: '#a8803a', g: gradeC, G: darkHex(gradeC) };
    return (iconCache[ck] = gCanvas(gOutline(g), pal).toDataURL());
  }
  const INV_TABS = [['all', '전체', () => true], ['weapon', '무기', it => it.slot === 'weapon'], ['armor', '방어구', it => ['helm', 'armor', 'boots'].includes(it.slot)], ['acc', '장신구', it => ['ring', 'neck'].includes(it.slot)]];
  const INV_STATS = [['atk', '공격력', v => v.toFixed(0)], ['def', '방어력', v => v.toFixed(0)], ['hp', '최대 HP', v => String(v)], ['crit', '치명 확률', v => (v * 100).toFixed(0) + '%'], ['critDmg', '치명 피해', v => (v * 100).toFixed(0) + '%'], ['cdr', '쿨타임 감소', v => (v * 100).toFixed(0) + '%'], ['spd', '이동 속도', v => v.toFixed(0)]];
  const INV_COLS = 10, GO = { legend: 0, unique: 1, rare: 2, common: 3 };
  let invTab = 'all', invSort = 'grade', invSel = null, invFrom = 'play', invSeen = new Set();
  const invCls = () => G ? G.cls : CUR;
  function invList() {
    const f = INV_TABS.find(t => t[0] === invTab)[2], cls = invCls();
    return SAVE.inv.filter(f).sort((a, b) => (canEquip(b, cls) - canEquip(a, cls)) ||
      (invSort === 'grade' ? (GO[a.grade] - GO[b.grade]) || ((b.lv || 0) - (a.lv || 0)) || (b.id - a.id) : (b.id - a.id)));
  }
  // 장착을 바꿨다고 가정했을 때의 능력치 (id가 null이면 그 칸을 비운 경우)
  function statsIf(slot, id) {
    const eq = eqOf(invCls()), prev = eq[slot];
    if (id == null) delete eq[slot]; else eq[slot] = id;
    const s = calcStats(G ? G.buffs : [], invCls());
    if (prev == null) delete eq[slot]; else eq[slot] = prev;
    return s;
  }
  function equipNow(it, on) {
    const cls = invCls(); if (!it || (on && !canEquip(it, cls))) return;
    if (on) eqOf(cls)[it.slot] = it.id; else delete eqOf(cls)[it.slot];
    if (G) { const P = G.player, oldHp = G.stats.hp; G.stats = calcStats(G.buffs); if (P) P.hp = clamp(P.hp + Math.max(0, G.stats.hp - oldHp), 1, G.stats.hp); }
    persist(); sfx(on ? 'select' : 'blip'); renderInv();
  }
  function openInv(from) {
    if (!G) return;
    invFrom = from || 'play'; mode = 'inv'; invTab = 'all';
    if (!invSel || !SAVE.inv.some(i => i.id === invSel)) invSel = null;
    $('ovPause').classList.remove('on'); $('ovInv').classList.add('on');
    for (const k in pressed) pressed[k] = false;
    sfx('blip'); renderInv();
  }
  function closeInv() {
    $('ovInv').classList.remove('on'); for (const k in pressed) pressed[k] = false;
    SAVE.inv.forEach(i => invSeen.add(i.id));
    if (invFrom === 'pause') openPause(); else { mode = 'play'; sfx('blip'); }
  }
  function renderInv() {
    const cls = invCls(), C = CLASSES[cls], eq = eqOf(cls), s = G ? G.stats : calcStats([], cls);
    $('ivGold').textContent = G ? G.gold : SAVE.gold; $('ivIron').textContent = G ? G.iron : SAVE.mats.iron; $('ivCrystal').textContent = G ? G.crystal : SAVE.mats.crystal;
    classPreview($('invPv'), cls);
    $('invCls').innerHTML = `${C.n}<small>${C.weapon}</small>`;
    const slotHTML = sk => {
      const sl = SLOTS.find(x => x.k === sk), it = SAVE.inv.find(i => i.id === eq[sk]), sel = invSel === 'slot:' + sk || (it && invSel === it.id);
      const ph = sk === 'weapon' ? ICON_OF_CLS[cls] : SLOT_ICON[sk];
      return `<button class="eqSlot ${sel ? 'sel' : ''}" data-slot="${sk}" style="--c:${it ? gradeOf(it).c : '#3a2f40'}"><div class="box">${it ? `<img src="${itemIconURL(iconKeyOf(it), gradeOf(it).c)}">${it.lv ? `<i class="lv">+${it.lv}</i>` : ''}` : `<img class="ph" src="${itemIconURL(ph, '#9a8ea5')}">`}</div><span>${sl.n}</span></button>`;
    };
    $('eqL').innerHTML = ['weapon', 'helm', 'armor'].map(slotHTML).join('');
    $('eqR').innerHTML = ['ring', 'neck', 'boots'].map(slotHTML).join('');
    $('invStats').innerHTML = INV_STATS.map(([k, n, f]) => `<span>${n}</span><b>${f(s[k])}</b>`).join('');
    const fx = [...s.fx];
    $('invFx').innerHTML = fx.length ? fx.map(k => `★ ${LEGEND_FX[k].n.trim()} — ${LEGEND_FX[k].d}`).join('<br>') : '<span class="no">레전더리 효과 없음</span>';
    const all = SAVE.inv.length;
    $('invTabs').innerHTML = INV_TABS.map(([k, n, f]) => `<button class="pbtn ${k === invTab ? 'sel' : ''}" data-tab="${k}">${n} ${SAVE.inv.filter(f).length}</button>`).join('') +
      `<button class="pbtn" data-sort="1">${invSort === 'grade' ? '등급순' : '최신순'}</button><span class="cnt">보유 ${all}</span>`;
    const list = invList(), ids = new Set(Object.values(eq));
    if (invSel != null && typeof invSel === 'number' && !list.some(i => i.id === invSel)) invSel = null;
    if (invSel == null && list[0]) invSel = list[0].id;
    $('invGrid').innerHTML = list.length ? list.map(it => {
      const g = gradeOf(it);
      return `<button class="ivCell ${it.id === invSel ? 'sel' : ''} ${canEquip(it, cls) ? '' : 'off'} ${invSeen.has(it.id) ? '' : 'new'}" data-id="${it.id}" style="--c:${g.c}" title="${it.name}"><img src="${itemIconURL(iconKeyOf(it), g.c)}">${it.lv ? `<i class="lv">+${it.lv}</i>` : ''}${ids.has(it.id) ? '<i class="eq">E</i>' : ''}</button>`;
    }).join('') : `<div class="invEmpty">${all ? '이 탭에 장비가 없다.' : '아직 얻은 장비가 없다. 적·상자·상인·보스에게서 얻을 수 있다.'}</div>`;
    $('eqL').parentElement.querySelectorAll('.eqSlot').forEach(b => b.addEventListener('click', () => {
      const it = SAVE.inv.find(i => i.id === eq[b.dataset.slot]); sfx('blip');
      if (it) { invTab = 'all'; invSel = it.id; } else { invTab = b.dataset.slot === 'weapon' ? 'weapon' : ['ring', 'neck'].includes(b.dataset.slot) ? 'acc' : 'armor'; invSel = 'slot:' + b.dataset.slot; }
      renderInv();
    }));
    $('invTabs').querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { invTab = b.dataset.tab; invSel = null; sfx('blip'); renderInv(); }));
    $('invTabs').querySelector('[data-sort]').addEventListener('click', () => { invSort = invSort === 'grade' ? 'new' : 'grade'; sfx('blip'); renderInv(); });
    $('invGrid').querySelectorAll('.ivCell').forEach(b => {
      b.addEventListener('click', () => { const id = +b.dataset.id; invSel = id; sfx('blip'); renderInv(); });
      b.addEventListener('dblclick', () => { const it = SAVE.inv.find(i => i.id === +b.dataset.id); if (it) equipNow(it, eq[it.slot] !== it.id); });
    });
    const sc = $('invGrid').querySelector('.ivCell.sel'); if (sc) sc.scrollIntoView({ block: 'nearest' });
    renderInvDetail();
  }
  function renderInvDetail() {
    const d = $('invDetail'), cls = invCls(), eq = eqOf(cls), cur = G ? G.stats : calcStats([], cls);
    if (typeof invSel === 'string') { const sk = invSel.slice(5), sl = SLOTS.find(x => x.k === sk); d.innerHTML = `<div class="dl"><div class="nm" style="--c:var(--quiet)">${sl.n} — 비어 있음</div><div class="rp">가방에서 ${sk === 'weapon' ? CLASSES[cls].weapon : sl.n}을(를) 골라 장착한다. ${sl.label}이(가) 오른다.</div></div>`; return; }
    const it = SAVE.inv.find(i => i.id === invSel);
    if (!it) { d.innerHTML = '<div class="dl"><div class="rp">장비를 고르면 자세한 정보와 능력치 비교가 나온다.</div></div>'; return; }
    const g = gradeOf(it), sl = slotOf(it), v = itemVal(it), on = eq[it.slot] === it.id, ok = canEquip(it, cls);
    const curIt = SAVE.inv.find(i => i.id === eq[it.slot]);
    const main = it.stat === 'crit' ? `치명 확률 +${v}%` : `${sl.label} +${v}`;
    let right = '';
    if (ok) {
      const nx = statsIf(it.slot, on ? null : it.id);
      const rows = INV_STATS.map(([k, n, f]) => {
        const dv = nx[k] - cur[k], same = Math.abs(dv) < (['crit', 'critDmg', 'cdr'].includes(k) ? 0.0005 : 0.5);
        const ds = same ? '–' : (dv > 0 ? '+' : '−') + f(Math.abs(dv)).replace('%', '') + (['crit', 'critDmg', 'cdr'].includes(k) ? '%p' : '');
        return `<span>${n}</span><b>${f(nx[k])}</b><em class="${same ? 'eq0' : dv > 0 ? 'up' : 'dn'}" style="font-style:normal">${ds}</em>`;
      }).join('');
      right = `<div class="dr"><div class="cmpT">${on ? '해제하면' : curIt ? `장착하면 (「${curIt.name}」 대신)` : '장착하면'}</div><div class="cmp">${rows}</div></div>`;
    }
    const btn = ok ? `<button class="pbtn ${on ? '' : 'primary'}" id="ivEq">${on ? '해제' : '장착'} <span class="pcOnly">[ENTER]</span></button>` : `<span class="f7" style="color:var(--quiet)">${CLASSES[it.cls].n} 전용 무기 — 지금 직업은 쓸 수 없다</span>`;
    d.innerHTML = `<div class="dl" style="--c:${g.c}"><div class="gr">${g.n} · ${slotName(it)}${on ? ' · 장착 중' : ''}</div><div class="nm">${it.name}${it.lv ? ` <b>+${it.lv}</b>` : ''}</div>
      <div class="mn">${main}</div>${it.opts.map(o => `<div class="op">${optText(o)}</div>`).join('')}${it.fx ? `<div class="fx">★ ${LEGEND_FX[it.fx].d}</div>` : ''}${itemExtra(it, cls)}
      ${it.lv || it.fail ? `<div class="rp">강화 +${it.lv || 0}${it.fail ? ` · 장인의 숨결 +${2 * it.fail}%p` : ''}</div>` : ''}
      <div class="row">${btn}</div></div>${right}`;
    const b = $('ivEq'); if (b) b.addEventListener('click', () => equipNow(it, !on));
  }
  function invKey(k) {
    const list = invList();
    if (k === 'Escape' || k === 'i' || k === 'I') { closeInv(); return true; }
    if (k === 'q' || k === 'Q' || k === 'e' || k === 'E') { const i = INV_TABS.findIndex(t => t[0] === invTab), d = (k === 'q' || k === 'Q') ? -1 : 1; invTab = INV_TABS[(i + d + INV_TABS.length) % INV_TABS.length][0]; invSel = null; sfx('blip'); renderInv(); return true; }
    if (k === 'Enter' || k === ' ') { const it = SAVE.inv.find(i => i.id === invSel); if (it) equipNow(it, eqOf(invCls())[it.slot] !== it.id); return true; }
    const dir = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1, ArrowUp: -INV_COLS, w: -INV_COLS, W: -INV_COLS, ArrowDown: INV_COLS, s: INV_COLS, S: INV_COLS }[k];
    if (dir && list.length) {
      let i = list.findIndex(x => x.id === invSel); if (i < 0) i = 0; else i = clamp(i + dir, 0, list.length - 1);
      invSel = list[i].id; sfx('blip'); renderInv(); return true;
    }
    return false;
  }
  $('ivClose').addEventListener('click', closeInv);

  // ---------------------------------------------------------------- 직업 선택
  let selCls = CUR;
  function classPreview(c, cls) {
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height);
    const C = CLASSES[cls], spr = sprite(C.map, C.pal, 4);
    const bx = c.width / 2, by = c.height - 6;
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(bx, by, 22, 6, 0, 0, TAU); g.fill();
    const drawW = (b, x, y, a, sc) => { if (b.cells) { const r = rotW(b, a); g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(2, 2); g.drawImage(r.c, -r.o, -r.o); g.restore(); return; } g.save(); g.translate(x, y); g.rotate(a); g.scale(sc, Math.cos(a) < 0 ? -sc : sc); g.drawImage(b.c, -b.pivotX, -b.pivotY); g.restore(); };
    if (cls === 'knight') drawW(BLADES.great, bx + 8, by - 22, -0.9, 1.4);
    else if (cls === 'ranger') { drawW(BLADES.dagger, bx - 12, by - 26, 2.88, 2); }
    else if (cls === 'mage') drawW(TOOLS.staff, bx + 14, by - 18, -1.35, 1.5);
    else if (cls === 'priest') drawW(TOOLS.mace, bx + 12, by - 24, -0.6, 1.5);
    g.drawImage(spr, Math.round(bx - spr.width / 2), by - spr.height);
    if (cls === 'ranger') drawW(BLADES.dagger, bx + 12, by - 24, 2.62, 2);
    if (cls === 'gunner') drawW(TOOLS.musket, bx + 6, by - 18, -0.35, 1.4);
  }
  function buildSelect() {
    const max = { atk: 30, def: 32, hp: 110, spd: 104, crit: 0.3 };
    $('selCards').innerHTML = Object.entries(CLASSES).map(([k, C]) => `
      <div class="selc pf" data-cls="${k}">
        <div class="pv"><canvas class="px" width="108" height="88" data-pv="${k}"></canvas></div>
        <h3>${C.n}</h3><div class="role">${C.role} · ${C.weapon}</div>
        <div class="st">
          <span>공격</span><div class="pbar"><i class="hp" style="width:${C.base.atk / max.atk * 100}%"></i></div>
          <span>방어</span><div class="pbar"><i class="gold" style="width:${C.base.def / max.def * 100}%"></i></div>
          <span>체력</span><div class="pbar"><i class="hp" style="width:${C.base.hp / max.hp * 100}%"></i></div>
          <span>속도</span><div class="pbar"><i class="gold" style="width:${C.base.spd / max.spd * 100}%"></i></div>
          <span>치명</span><div class="pbar"><i class="gold" style="width:${C.base.crit / max.crit * 100}%"></i></div>
        </div>
      </div>`).join('');
    $('selCards').querySelectorAll('canvas[data-pv]').forEach(c => classPreview(c, c.dataset.pv));
    $('selCards').querySelectorAll('.selc').forEach(el => {
      el.addEventListener('mouseenter', () => { if (selCls !== el.dataset.cls) { selCls = el.dataset.cls; sfx('blip'); renderSelect(); } });
      el.addEventListener('click', () => chooseClass(el.dataset.cls));
    });
  }
  function renderStages() {
    $('stageTabs').innerHTML = Object.entries(STAGES).map(([k, S]) => `<button class="stg pf ${+k === STAGE ? 'sel' : ''}" data-st="${k}"><span class="sn">STAGE ${k}</span><b>${S.n}</b><span class="sd">${'★'.repeat(S.diff)}${'☆'.repeat(2 - S.diff)}</span><span class="ss">${S.sub} · 보스 ${S.boss}</span></button>`).join('');
    $('stageTabs').querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => { setStage(+b.dataset.st); }));
  }
  function setStage(k) { if (!STAGES[k] || k === STAGE) return; STAGE = k; SAVE.lastStage = k; persist(); sfx('blip'); renderStages(); }
  function renderSelect() {
    $('stageTabs').style.display = 'none';
    $('selCards').querySelectorAll('.selc').forEach(el => el.classList.toggle('sel', el.dataset.cls === selCls));
    const C = CLASSES[selCls];
    $('selDetail').innerHTML = `<div class="sdh"><b>${C.n}</b> <span>${C.role} · ${C.weapon}</span></div><div class="sk2">
      <span class="key">LMB</span><span>${C.atkD}</span>
      <span class="key">RMB</span><span><b>${C.skill}</b> — ${C.skillD} <i>(쿨 ${C.skillCd}초)</i></span>
      <span class="key">E</span><span><b>${C.awaken}</b> — ${C.awakenD}</span></div>`;
  }
  function openSelect() { mode = 'select'; selCls = CUR; $('ovTitle').classList.remove('on'); buildSelect(); renderSelect(); $('ovSelect').classList.add('on'); }
  function closeSelect() { $('ovSelect').classList.remove('on'); mode = 'title'; $('ovTitle').classList.add('on'); }
  function chooseClass(cls) { CUR = cls; SAVE.lastCls = cls; persist(); start(); }

  // ---------------------------------------------------------------- 대장간
  let forgeFrom = 'title', forgeSel = null, forgeCls = CUR, forgeMsg = null;
  function openForge(from, m) {
    $('ovForge').dataset.m = m || 'all'; $('fgTitle').textContent = { enh: '모루 — 강화', roll: '숫돌 — 재련 (옵션 다시 굴리기)', salv: '용광로 — 분해' }[m] || '대장간 — 강화';
    forgeFrom = from; forgeCls = G ? G.cls : CUR; forgeMsg = from === 'between' ? `<span class="ok">STAGE ${G.stage} 클리어 — 보스 전리품이 들어왔다. 강화하고 다음 스테이지로</span>` : null; mode = 'forge';
    if (from === 'between' && G.newItems[0]) forgeSel = G.newItems[0].id;
    ['ovTitle', 'ovResult'].forEach(id => $(id).classList.remove('on'));
    $('fgTabs').style.display = from === 'between' || from === 'station' ? 'none' : '';
    $('fgClose').textContent = from === 'between' ? `STAGE ${G.stage + 1}로 [ESC]` : from === 'station' ? '대장간으로 [ESC]' : '돌아가기 [ESC]';
    $('fgClose').classList.toggle('primary', from === 'between');
    $('ovForge').classList.add('on'); renderForge();
  }
  function closeForge() {
    $('ovForge').classList.remove('on'); sfx('blip');
    if (forgeFrom === 'station') { mode = 'play'; for (const k in pressed) pressed[k] = false; if ($('ovForge').dataset.m === 'roll' && G) G.grindT = 0; }
    else if (forgeFrom === 'between') { applyClassUI(); nextStage(); }
    else if (forgeFrom === 'title') { mode = 'title'; titleMats(); $('ovTitle').classList.add('on'); }
    else { mode = 'result'; renderResultItems(resultWin); $('ovResult').classList.add('on'); }
  }
  function forgeList() {
    const ids = new Set(Object.values(eqOf(forgeCls)));
    const go = { legend: 0, unique: 1, rare: 2, common: 3 };
    return SAVE.inv.slice().sort((a, b) => (ids.has(b.id) - ids.has(a.id)) || (go[a.grade] - go[b.grade]) || ((b.lv || 0) - (a.lv || 0)) || (b.id - a.id));
  }
  function renderForge() {
    $('fgGold').textContent = SAVE.gold; $('fgIron').textContent = SAVE.mats.iron; $('fgCrystal').textContent = SAVE.mats.crystal;
    document.querySelectorAll('#fgTabs [data-cls]').forEach(b => b.classList.toggle('sel', b.dataset.cls === forgeCls));
    const list = forgeList();
    if (!forgeSel || !SAVE.inv.some(i => i.id === forgeSel)) forgeSel = list[0] ? list[0].id : null;
    const ids = new Set(Object.values(eqOf(forgeCls)));
    $('fgList').innerHTML = list.length ? list.map(it => `<button class="fgRow ${it.id === forgeSel ? 'sel' : ''}" data-id="${it.id}" style="--c:${gradeOf(it).c}">${ids.has(it.id) ? '<span class="eq">E</span>' : ''}<span class="nm">${it.name}</span>${it.lv ? `<span class="lv">+${it.lv}</span>` : ''}<span class="sl">${slotName(it)}</span></button>`).join('')
      : '<p>장비가 없다. 던전의 적·상자·상인·보스에게서 얻을 수 있다.</p>';
    $('fgList').querySelectorAll('.fgRow').forEach(b => b.addEventListener('click', () => { forgeSel = +b.dataset.id; forgeMsg = null; sfx('blip'); renderForge(); }));
    const selRow = $('fgList').querySelector('.fgRow.sel'); if (selRow) selRow.scrollIntoView({ block: 'nearest' });
    renderForgeDetail();
  }
  // v1.14 장착·해제 버튼은 창 왼쪽 아래 (예전 테스트 버튼 자리)
  function forgeEqRow(it, eq, ok, act = '') {
    const r = $('fgEqRow'); if (!r) return;
    if (!it) { r.innerHTML = ''; return; }
    if (!ok) { r.innerHTML = act + `<span class="f7" style="color:var(--quiet)">${CLASSES[it.cls].n} 전용 무기</span>`; return; }
    const n = CLASSES[forgeCls].n;
    r.innerHTML = act + (eq ? `<button class="pbtn" id="fgEq">${n} 장착 해제</button>` : `<button class="pbtn" id="fgEq">${n}에게 장착</button>`);
    $('fgEq').addEventListener('click', () => { const E = eqOf(forgeCls); if (eq) delete E[it.slot]; else E[it.slot] = it.id; tierCache.key = null; persist(); sfx('select'); renderForge(); });
  }
  function renderForgeDetail() {
    const it = SAVE.inv.find(i => i.id === forgeSel), d = $('fgDetail');
    if (!it) { forgeEqRow(null); d.innerHTML = `<p>${{ roll: '옵션을 다시 굴릴', salv: '녹여서 재료로 바꿀' }[$('ovForge').dataset.m] || '강화할'} 장비를 고른다.</p>`; return; }
    const g = gradeOf(it), sl = slotOf(it), lv = it.lv || 0, max = lv >= 15;
    const label = it.stat === 'crit' ? '치명 확률' : sl.label, unit = it.stat === 'crit' ? '%' : '';
    const cur = itemVal(it), next = max ? cur : itemVal(it, lv + 1);
    const c = enhCost(lv), rate = max ? 0 : enhRate(it);
    const has = { iron: SAVE.mats.iron >= c.iron, crystal: SAVE.mats.crystal >= c.crystal, gold: SAVE.gold >= c.gold };
    const can = !max && has.iron && has.crystal && has.gold;
    const eq = eqOf(forgeCls)[it.slot] === it.id, ok = canEquip(it, forgeCls);
    d.innerHTML = `
      <div class="fgHead" style="--c:${g.c}"><div class="gr">${g.n} · ${slotName(it)}</div><div class="big">${it.name} <b>+${lv}</b></div></div>
      <div class="fgStat"><span>${label}</span><b>${cur}${unit}</b>${max ? '' : `<i>▶</i><b class="up">${next}${unit}</b>`}</div>
      ${it.opts.map(o => `<div class="fgOpt">${optText(o)}</div>`).join('')}${it.fx ? `<div class="fgOpt fx">★ ${LEGEND_FX[it.fx].d}</div>` : ''}<div class="fgOpt">${itemExtra(it, forgeCls)}</div>
      ${max ? '<div class="fgRate"><b>MAX</b><span>최대 강화</span></div>' : `
      <div class="fgRate"><span>성공 확률</span><b>${rate}%</b>${it.fail ? `<em>장인의 숨결 +${2 * it.fail}%p</em>` : ''}</div>
      <div class="fgRisk">${lv + 1 >= 10 ? '<span style="color:#ff8080">실패 시 1단계 하락</span>' : '실패해도 단계 유지'} · 실패할 때마다 다음 성공률 +2%p</div>
      ${[5, 10, 15].includes(lv + 1) ? `<div class="mile">★ +${lv + 1} 달성 시 옵션 1줄 추가</div>` : ''}
      <div class="fgCost"><span class="${has.iron ? '' : 'no'}">철광석 조각 ${c.iron} <small>보유 ${SAVE.mats.iron}</small></span>${c.crystal ? `<span class="${has.crystal ? '' : 'no'}">정령의 결정 ${c.crystal} <small>보유 ${SAVE.mats.crystal}</small></span>` : ''}<span class="${has.gold ? '' : 'no'}">골드 ${c.gold} <small>보유 ${SAVE.gold}</small></span></div>`}
      <div id="fgMsg">${forgeMsg || ''}</div>`;
    // v1.15 강화·다시 굴리기·분해 버튼은 설명 칸 밖 (창 아래 줄, 장착 버튼 옆)
    const rc = rerollCost(it), sv = salvageGain(it), canR = SAVE.gold >= rc.gold && SAVE.mats.crystal >= rc.crystal;
    const act = (max ? '' : `<button class="pbtn primary" id="fgGo" ${can ? '' : 'disabled'}>강화하기 [ENTER]</button>`)
      + `<button class="pbtn" id="fgRoll" ${canR ? '' : 'disabled'}>옵션 다시 굴리기 <small>골드 ${rc.gold}${rc.crystal ? ` · 결정 ${rc.crystal}` : ''}</small></button>`
      + `<button class="pbtn" id="fgSalv" ${eq ? 'disabled' : ''}>${forgeSalvArm === it.id ? '정말 분해? 한 번 더' : '분해'} <small>${eq ? '장착 중' : `철광석 ${sv.iron}${sv.crystal ? ` · 결정 ${sv.crystal}` : ''}`}</small></button>`;
    forgeEqRow(it, eq, ok, act);
    const rb = $('fgRoll'); if (rb) rb.addEventListener('click', doReroll);
    const sb = $('fgSalv'); if (sb) sb.addEventListener('click', doSalvage);
    const go = $('fgGo'); if (go) go.addEventListener('click', doEnhance);
  }
  // v0.98 대장간: 옵션 다시 굴리기(옵션 줄 수는 그대로, 효과 옵션도 새로) · 분해(재료로 환급, 장착 중이면 불가, 두 번 눌러 확정)
  let forgeSalvArm = null;
  const GI = { common: 0, rare: 1, unique: 2, legend: 3 };
  const rerollCost = it => ({ gold: [40, 90, 160, 260][GI[it.grade]], crystal: GI[it.grade] >= 2 ? 1 : 0 });
  const salvageGain = it => ({ iron: [1, 2, 4, 6][GI[it.grade]] + Math.floor((it.lv || 0) / 2), crystal: [0, 0, 1, 2][GI[it.grade]] + ((it.lv || 0) >= 10 ? 1 : 0) });
  function doReroll() {
    const it = SAVE.inv.find(i => i.id === forgeSel); if (!it) return;
    const c = rerollCost(it); if (SAVE.gold < c.gold || SAVE.mats.crystal < c.crystal) { sfx('block'); forgeMsg = '<span class="ng">재료가 모자란다</span>'; renderForgeDetail(); return; }
    SAVE.gold -= c.gold; SAVE.mats.crystal -= c.crystal;
    const g = gradeOf(it), keep = it.opts.filter(o => o.cb), n = it.opts.length - keep.length, pool = OPTS.filter(o => !keep.some(k => k.k === o.k)), opts = keep.slice();
    for (let i = 0; i < n && pool.length; i++) { const o = pool.splice(randi(0, pool.length - 1), 1)[0]; opts.push({ k: o.k, v: Math.round(randi(o.r[0], o.r[1]) * (1 + (g.mul - 1) * 0.5)) }); }
    it.opts = opts; if (it.efx) it.efx = pick(Object.keys(EFX).filter(k => k !== it.efx));
    if (G) G.grindT = 1.6; persist(); sfx('drop'); forgeMsg = `<span class="ok">옵션을 다시 굴렸다${it.efx ? ` · 효과 「${EFX[it.efx].n}」` : ''}</span>`; renderForge();
    const d = $('fgDetail'); d.classList.remove('hitok', 'hitng'); void d.offsetWidth; d.classList.add('hitok');
  }
  function doSalvage() {
    const it = SAVE.inv.find(i => i.id === forgeSel); if (!it) return;
    if (Object.values(eqOf(forgeCls)).includes(it.id)) { sfx('block'); return; }
    if (forgeSalvArm !== it.id) { forgeSalvArm = it.id; sfx('blip'); renderForgeDetail(); return; }
    forgeSalvArm = null; const gn = salvageGain(it);
    SAVE.inv = SAVE.inv.filter(i => i.id !== it.id); for (const k of Object.keys(SAVE.equipBy)) for (const sl in SAVE.equipBy[k]) if (SAVE.equipBy[k][sl] === it.id) delete SAVE.equipBy[k][sl];
    SAVE.mats.iron += gn.iron; SAVE.mats.crystal += gn.crystal; forgeSel = null;
    persist(); sfx('crunch'); forgeMsg = `<span class="ok">「${it.name}」 분해 — 철광석 +${gn.iron}${gn.crystal ? ` · 결정 +${gn.crystal}` : ''}</span>`; renderForge();
  }
  function doEnhance() {
    const it = SAVE.inv.find(i => i.id === forgeSel);
    if (!it || (it.lv || 0) >= 15) return;
    const c = enhCost(it.lv || 0);
    if (SAVE.mats.iron < c.iron || SAVE.mats.crystal < c.crystal || SAVE.gold < c.gold) { sfx('block'); forgeMsg = '<span class="ng">재료가 모자란다</span>'; renderForgeDetail(); return; }
    SAVE.mats.iron -= c.iron; SAVE.mats.crystal -= c.crystal; SAVE.gold -= c.gold;
    const from = it.lv || 0, success = Math.random() * 100 < enhRate(it);
    if (success) {
      it.lv = from + 1; it.fail = 0;
      let extra = '';
      if ([5, 10, 15].includes(it.lv) && it.opts.length < 4) {
        const pool = OPTS.filter(o => !it.opts.some(x => x.k === o.k)), o = pick(pool);
        it.opts.push({ k: o.k, v: randi(o.r[0], o.r[1]) }); extra = ` · 새 옵션 「${optText(it.opts[it.opts.length - 1])}」`;
      }
      forgeMsg = `<span class="ok">강화 성공! +${from} → +${it.lv}${extra}</span>`; sfx('drop');
    } else {
      it.fail = (it.fail || 0) + 1;
      let t = `강화 실패… +${from} 유지`;
      if (from + 1 >= 10) { it.lv = from - 1; t = `강화 실패… +${from} → +${it.lv}`; }
      forgeMsg = `<span class="ng">${t} · 장인의 숨결 +2%p</span>`; sfx('hurt');
    }
    persist(); renderForge();
    const d = $('fgDetail'); d.classList.remove('hitok', 'hitng'); void d.offsetWidth; d.classList.add(success ? 'hitok' : 'hitng');
  }
  document.querySelectorAll('#fgTabs [data-cls]').forEach(b => b.addEventListener('click', () => { forgeCls = b.dataset.cls; forgeMsg = null; sfx('blip'); renderForge(); }));
  $('fgClose').addEventListener('click', closeForge);
  { const b = $('pkClose'); if (b) b.addEventListener('click', closePick); } // index.html이 옛 버전이어도 멈추지 않게


  // ---------------------------------------------------------------- 모바일 터치 조작
  // 왼쪽 아무 곳이나 눌러 끌면 가상 조이스틱(WASD), 오른쪽 버튼은 키 입력을 그대로 흉내 낸다 → 기존 입력 처리를 모두 재사용
  const TOUCH = { on: false, held: {}, stick: null, dirs: { w: false, a: false, s: false, d: false } };
  const keyEv = (type, key) => dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
  function enableTouch() {
    if (TOUCH.on) return; TOUCH.on = true; document.body.classList.add('touch'); fit();
    if (G) { G.kgCls = null; }
  }
  if (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 && !matchMedia('(pointer: fine)').matches) enableTouch();
  addEventListener('touchstart', () => enableTouch(), { passive: true });
  function setDir(k, on) { if (TOUCH.dirs[k] === on) return; TOUCH.dirs[k] = on; keyEv(on ? 'keydown' : 'keyup', k); }
  function stickTo(dx, dy) {
    const d = Math.hypot(dx, dy), R = 40, k = d > R ? R / d : 1;
    $('tKnob').style.transform = `translate(${dx * k}px,${dy * k}px)`;
    const dead = 12, a = Math.atan2(dy, dx), on = d > dead;
    // 8방향: 각 축은 ±67.5° 안이면 켠다
    setDir('d', on && Math.cos(a) > 0.38); setDir('a', on && Math.cos(a) < -0.38);
    setDir('s', on && Math.sin(a) > 0.38); setDir('w', on && Math.sin(a) < -0.38);
  }
  const zone = $('tZone'), stick = $('tStick');
  zone.addEventListener('touchstart', e => {
    e.preventDefault(); const t = e.changedTouches[0]; if (TOUCH.stick) return;
    TOUCH.stick = { id: t.identifier, x: t.clientX, y: t.clientY };
    const zr = zone.getBoundingClientRect(); stick.style.left = (t.clientX - zr.left) + 'px'; stick.style.top = (t.clientY - zr.top) + 'px'; /* 조이스틱은 zone 안 좌표 */ stick.classList.add('on'); stickTo(0, 0);
  }, { passive: false });
  zone.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (TOUCH.stick && t.identifier === TOUCH.stick.id) stickTo(t.clientX - TOUCH.stick.x, t.clientY - TOUCH.stick.y); }, { passive: false });
  const stickEnd = e => { for (const t of e.changedTouches) if (TOUCH.stick && t.identifier === TOUCH.stick.id) { TOUCH.stick = null; stick.classList.remove('on'); stickTo(0, 0); } };
  zone.addEventListener('touchend', stickEnd); zone.addEventListener('touchcancel', stickEnd);
  document.querySelectorAll('#touch .tb[data-k]').forEach(b => {
    const k = b.dataset.k;
    const dn = e => { e.preventDefault(); b.classList.add('dn'); TOUCH.held[k] = true; keyEv('keydown', k); };
    const up = e => { e.preventDefault(); b.classList.remove('dn'); if (TOUCH.held[k]) { TOUCH.held[k] = false; keyEv('keyup', k); } };
    b.addEventListener('touchstart', dn, { passive: false }); b.addEventListener('touchend', up); b.addEventListener('touchcancel', up);
    b.addEventListener('mousedown', dn); b.addEventListener('mouseup', up); b.addEventListener('mouseleave', up);
  });
  $('tFull').addEventListener('click', () => { const d = document.documentElement; if (!document.fullscreenElement) { (d.requestFullscreen || d.webkitRequestFullscreen || (() => {})).call(d); try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { } } else document.exitFullscreen && document.exitFullscreen(); });
  if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) $('tFull').style.display = 'none';
  // 조준 보조: 터치로 공격·기술을 쓰면 가까운 적을 향한다 (마우스로 조준 중이면 그대로)
  function touchAim() {
    if (!TOUCH.on || mouse.active > 0 || !G) return null;
    const P = G.player; let best = null, bd = 260;
    for (const e of G.enemies) { if (e.dead) continue; const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  function touchHud() {
    const show = TOUCH.on && (mode === 'play' || mode === 'map');
    $('touch').classList.toggle('on', show);
    document.body.classList.toggle('portrait', TOUCH.on && innerHeight > innerWidth);
    if (!show) { for (const k in TOUCH.held) if (TOUCH.held[k]) { TOUCH.held[k] = false; keyEv('keyup', k); } for (const k in TOUCH.dirs) setDir(k, false); return; }
    if (G && TOUCH.iconCls !== G.cls) {
      TOUCH.iconCls = G.cls; const C = CL(), ic = C.icons || (G.cls === 'ranger' ? ['dual', 'shadow', 'storm'] : ['atk', 'skill', 'awaken']);
      drawIcon32($('tAtk').querySelector('canvas'), ic[0]); drawIcon32($('tSkill').querySelector('canvas'), ic[1]); drawIcon32($('tAwk').querySelector('canvas'), ic[2]);
      
    }
    if (G && G.player) { const P = G.player, sk = P.chargeCd.some((c, i) => c <= 0 && i < (G.stats.fx.has('bulwark') && G.cls === 'knight' ? 2 : 1)); $('tSkill').classList.toggle('cd', !sk); $('tAwk').classList.toggle('cd', P.gauge < 100); $('tDodge').classList.toggle('cd', P.stam <= 0); $('tF').style.display = G.prompt ? '' : 'none'; }
    if (mode !== 'play' && (gearCmpId !== null || $('gearCmp').classList.contains('on'))) { $('gearCmp').classList.remove('on'); gearCmpId = null; }
  }

  // ---------------------------------------------------------------- 화면 맞춤
  var fitW = 0, fitH = 0; // enableTouch가 먼저 fit을 부를 수 있어 var/function으로 끌어올린다
  function viewW() { return window.visualViewport ? visualViewport.width : innerWidth; }
  function viewH() { return window.visualViewport ? visualViewport.height : innerHeight; }
  function fit() {
    fitW = viewW(); fitH = viewH();
    const fitS = Math.min(fitW / VW, fitH / VH), dpr = window.devicePixelRatio || 1;
    // v1.07: 2px 칸 하나가 모니터 픽셀 정수 개가 되게 (윈도 배율 125%·150% 포함). 0.25 단위 CSS 배율이면 칸이 3·4px로 섞여 움직일 때 우글거림
    const dev = Math.max(1, Math.floor(fitS * dpr * 2) / 2);
    const s = typeof TOUCH !== 'undefined' && TOUCH.on ? fitS : dev / dpr; // 모바일은 화면에 꽉 차게
    const wrap = $('wrap');
    wrap.style.width = `${VW * s}px`; wrap.style.height = `${VH * s}px`;
    cv.style.width = `${VW * s}px`; cv.style.height = `${VH * s}px`;
    $('ui').style.transform = `scale(${s})`;
    if (typeof TOUCH !== 'undefined' && TOUCH.on) {
      const u = Math.max(0.75, Math.min(1.35, fitH / 400)), side = (fitW - VW * s) / 2;
      const t = $('touch'); t.style.setProperty('--u', u.toFixed(3)); t.classList.toggle('side', side >= 46 * u);
    }
  }
  addEventListener('resize', fit); addEventListener('orientationchange', () => { fit(); setTimeout(fit, 250); setTimeout(fit, 700); });
  if (window.visualViewport) visualViewport.addEventListener('resize', fit);
  fit();

  // ---------------------------------------------------------------- 루프
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    try { update(dt); } catch (err) { console.error(err); }
    try { render(); } catch (err) { console.error(err); }
    try { hud(); updatePeek(); touchHud(); if (viewW() !== fitW || viewH() !== fitH) fit(); } catch (err) { console.error(err); }
    requestAnimationFrame(frame);
  }
  titleMats();
  requestAnimationFrame(frame);

  window.__proto = { set opt(v) { OPT = v; }, get opt() { return OPT; }, renderAt: (t, seed) => { const t0 = time; time = t; withSeed(seed || 7, () => { render(); }); time = t0; return document.getElementById('game').toDataURL(); }, setMode: m => { mode = m; }, sr: { SR, srPal, gCanvas }, camS: () => [CAMX, CAMY], spr: { sprite, drawSprite, drawBlade, BLADES, get ctx() { return ctx; } }, artk: { genHedge, genWallBlock, genPalisade, LEAF, STONE, PEN_PAL, gCanvas, withSeed, forge: () => ({ furnace: gCanvas(genFurnace(), FORGE_PAL), rack: gCanvas(FORGE_DECO.rack(), FORGE_PAL), tools: gCanvas(FORGE_DECO.tools(), FORGE_PAL), ingots: gCanvas(FORGE_DECO.ingots(), FORGE_PAL) }) }, WEAP, fxt: { chainBolt, ghostSword, fireWave, gearOnKill, gearOnHurt, fxRing, nearFoes, damageEnemy, killEnemy, gxNova, gxThorns, gxCoins, gxCrit, gxExec, gxSpurt, gxFocus, gxIgnite, gxOrbs }, gear: { makeItem, openPick, takePick, spawnLoot, openForge, EFX, SETS, CURSES, setCount, recalc: () => { G.stats = calcStats(G.buffs); } }, get G() { return G; }, get cam() { return cam; }, get fxs() { return { shake, zoomK }; }, get mode() { return mode; }, start, SAVE: () => SAVE, mk: makeEnemy, stage3: () => { G.stage = 3; G.last = 3; G.ash = []; newDungeon(); }, orc: { ORC_SPEC, orcSprite, genOrcBody, rotW }, inv: { open: openInv, close: closeInv, equipNow, statsIf, makeItem, get sel() { return invSel; } }, choose: chooseClass, dbg: { get ICON32() { return ICON32; }, pen: (wc, hc, k) => gCanvas(genPalisade(wc, hc, k).g, PEN_PAL), propCv: n => { ensureOrcProps(); return propCanvas(n); }, floorCv: () => fg.canvas, MAPS, PAL, sprite, propRect, navFlood, navIdx, get CENTER() { return { x: CX, y: CY - 10, r: CLEAR_R }; }, artCache, DOOR, doorIn, doorState, hitCrack, crackPoint, enterRoom, goRoom, newDungeon: () => { G.dun = genDungeon(G.stage); G.dun.cur = null; enterRoom(G.dun.start, null); }, get mode() { return mode; } } };
})();
