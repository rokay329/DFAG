'use strict';
// 잿빛 왕관 토벌대 — 오프라인 솔로 프로토타입 v0.2
// 의존성 없음. index.html을 브라우저로 열면 실행된다.
(() => {
  const VW = 768, VH = 432;          // 화면(캔버스) 크기
  const W = 1700, H = 960;           // 바닥 캔버스 크기 — 방마다 전투장(A) 크기가 다르고 가장 큰 방이 들어가게 잡는다
  const cv = document.getElementById('game');
  cv.width = VW; cv.height = VH;
  const cam = { x: 0, y: 0 };
  const ctx = cv.getContext('2d');
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
    abom: [
      '....kkkkkk......',
      '...kHhhhhhk.....',
      '..kHhchhhhHk....',
      '..khchhhhhhk....',
      '..khekhhhekk....',
      '..khhmcmchhk....',
      '...kHhhhhHk.....',
      '..kkkSSSSkkk....',
      '.kSscSssSscSk...',
      'kSsAAbAssSsSsk..',
      'kssAbAbAsccssk..',
      'kSsAAbAsssSsSk..',
      '.kkssssscsssk...',
      '..ksSssssScsk...',
      '..kssaassssk....',
      '..kSssscssSk....',
      '...kSSSSSSk.....',
      '...kSSkkSSk.....',
      '...kSSk.kSSk....',
      '..kSSSk.kSSSk...',
      '..kkkkk.kkkkk...',
    ],
    mother: [
      '......kkkkkk........',
      '.....kHHHHHHk.......',
      '....kHhhhhhhHk......',
      '....kHhSssSsHk......',
      '....kHseSSesHk......',
      '...kHHssmmssHHk.....',
      '...kHHkssssskHHk....',
      '..kHHksSSSSSkHHk....',
      '..kHkssssssssskHk...',
      '.kHksSsssvsssSskk...',
      '.kkssSsvvVvvssSssk..',
      '.kssSssvVVVvsssSsk..',
      'kssSsssvVvVvssssSsk.',
      'ksk.kssssvssssssk.k.',
      'ksk.kSsssssssssSk.kk',
      '.kk.kSSsssssssSSk...',
      '....krRrRrRrRrRk....',
      '....kRrRrRrRrRrk....',
      '...krRrRrRrRrRrRk...',
      '...kRrRrRrRrRrRrk...',
      '...kkSSkkkkkSSkkk...',
      '....kSSk...kSSk.....',
      '...kSSSk...kSSSk....',
      '...kkkkk...kkkkk....',
    ],
    crowA: [
      'K.........K.',
      'Kk.......kK.',
      '.kk.kkk.kk..',
      '..kKkkkkek..',
      '...kkkkkkky.',
      '....kkkkk...',
      '.....k.k....',
    ],
    crowB: [
      '............',
      '....kkk.....',
      '.kkkKkkkek..',
      'kKkkkkkkkky.',
      'k..kkkkkk..k',
      '....kkkk....',
      '.....k.k....',
    ],
    gbrute: [
      '.......kkkkkk.......',
      '......kssssssk......',
      '..kk.ksesssseSk.kk..',
      '.kSSkkssrssrssSkSSk.',
      '..kk.kswwSSwwSk.kk..',
      '......kkSSSSkk......',
      '...kkkSsssssSSkkk...',
      '..kssssbsbsbsSSSsk..',
      '.ksshssssssssSSSssk.',
      'kssshsssrrsssSSSsssk',
      'kSsskssssssssSSkssSk',
      'kSsk.kssssssSSk.ksSk',
      'kSk..kSssssSSSk..kSk',
      'ksk..kcccccccck..ksk',
      'kssk.kcCcccCcck.kssk',
      '.kk..kccCccCcck..kk.',
      '.....kCcccccCck.....',
      '.....kSSk..kSSk.....',
      '....kSSSk..kSSSk....',
      '....kSSk....kSSk....',
      '...kkSSk....kSSkk...',
      '...kkkkk....kkkkk...',
    ],
    gbruteUp: [
      '.kssk..........kssk.',
      '.kSsk..........ksSk.',
      '..kSk..kkkkkk..kSk..',
      '..kSk.kssssssk.kSk..',
      '..kSSksesssseSkSSk..',
      '...kSSssrssrssSSk...',
      '....kkswwSSwwSkk....',
      '......kkSSSSkk......',
      '...kkkSsssssSSkkk...',
      '..kssssbsbsbsSSSsk..',
      '.ksshssssssssSSSssk.',
      '.kssssssrrssssSSssk.',
      '..kkssssssssSSSkk...',
      '....kssssssSSSk.....',
      '....kSssssSSSSk.....',
      '.....kcccccccck.....',
      '.....kcCcccCcck.....',
      '.....kCcccccCck.....',
      '.....kSSk..kSSk.....',
      '....kSSSk..kSSSk....',
      '...kkSSk....kSSkk...',
      '...kkkkk....kkkkk...',
    ],
    boar: [
      '.......b.b.b.b..........',
      '......kbkbkbkbkk........',
      '....kkDdDdDdDdDdkk......',
      '..kkdddddddddddddDkkk...',
      '.kddddddddddddddddDDDk..',
      'kdddddddddddddddDDreDDk.',
      'kdddddddddddddddDDDDDDpk',
      'kdddddddddddddddkDDDwpPk',
      '.kddddddddddddddkkDwwkk.',
      '.kLdddddddddddLk.kkk....',
      '..kLLddddddLLLk.........',
      '..kdk.kdk..kdk.kdk......',
      '..kdk.kdk..kdk.kdk......',
      '..khk.khk..khk.khk......',
      '..kkk.kkk..kkk.kkk......',
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
      '......rr........',
      '.....rrrr.......',
      '....kkkkkk......',
      '...kwllllmk.....',
      '...klkkkkkk.....',
      '...kllmmmmk.....',
      '...kkmggmkk.....',
      '..RkkkkkkkkR....',
      '.RRkwlmmmdkRk...',
      '.RRklmmmddkkk...',
      '.RRkmmgmmdk.....',
      '.RRkkmmmdkk.....',
      'RRR.kdmmdk......',
      'RR..kmkkmk......',
      'R...kdk.kdk.....',
      '....kdk.kdk.....',
      '...kkdk.kkdk....',
      '...kkkk..kkk....',
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
      '.....kkkk.....',
      '....kCCCCk....',
      '...kCssssCk...',
      '...kCsesekk...',
      '...kCSssSk....',
      '....kkSSkk....',
      '...kcccccck...',
      '..kcccCccCck..',
      '.kskcccCcckSk.',
      '.ks.kccCcck.sk',
      '.kS.kcccCck.Sk',
      '.kk.kcCccck.kk',
      '....kccCcck...',
      '....kCk.kCk...',
      '....kSk..kSk..',
      '...kkSk..kSk..',
      '...kkkk..kkkk.',
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
      '.k..........k.',
      'ksk........ksk',
      '.sk........ks.',
      '.kSk.kkkk.kSk.',
      '..kSkCCCCkSk..',
      '...kCssssCk...',
      '...kCsesekk...',
      '...kCSssSk....',
      '....kkSSkk....',
      '...kcccccck...',
      '..kcccCccCck..',
      '..kkcccCcck...',
      '....kccCcck...',
      '....kcccCck...',
      '....kcCccck...',
      '....kCk.kCk...',
      '....kSk..kSk..',
      '...kkSk..kSk..',
      '...kkkk..kkkk.',
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
      '...kRkeekRk...',
      '...kRkkkkRk...',
      '....kRrrRk....',
      '...kRRrrRRk...',
      '..kRrrRRrrRk..',
      '.khRrrRRrrRhk.',
      'kshkRrRRrRkhsk',
      '.kk.kRrRrk.kk.',
      '...kRrrRRrRk..',
      '...kRrrRRrrRk.',
      '..kRrrrRRrrrRk',
      '..kRRrrRRrrRRk',
      '.kRRRrrRRrRRRk',
      '.kkkkkkkkkkkkk',
    ],
    bloat: [
      '.....kkkkkk.....',
      '....kSSSSSSk....',
      '...kSssesssSk...',
      '...kSsssssssk...',
      '..kSsssPssssSk..',
      '.kSssPPssPsssSk.',
      '.kSsssssssPssSk.',
      'kSssPssssssssSSk',
      'kSsssssPsssPssSk',
      'kSssssssssssssSk',
      '.kSsssPsssssSSk.',
      '.kSSssssssSSSk..',
      '..kkSSSSSSSkk...',
      '...kSk...kSk....',
      '...kkk...kkk....',
    ],
    dog: [
      '...............kk.',
      '..............kdlk',
      '..............kdedk',
      'k............kddddk',
      'kDk.kkkkkkkkkkdddk.',
      '.kDkdllldlllddddk..',
      '..kdddddddddddddk..',
      '..kDdddDddddDdddk..',
      '..kDk.kDk..kDk.kDk.',
      '..kDk.kDk..kDk.kDk.',
      '..kk..kk...kk..kk..',
    ],
  };
  const PAL = {
    abom: { k: '#0e0c0c', H: '#4a5048', h: '#7a8274', e: '#d8e070', m: '#2a1414', s: '#8a9282', S: '#5a6256', c: '#2a2420', C: '#14100e', a: '#6e2a24', A: '#3d1411', b: '#d8d0b8' },
    mother: { k: '#0c0a0c', H: '#1a1418', h: '#3a2e34', s: '#b8b09c', S: '#7a7464', e: '#c8f060', m: '#2a1010', v: '#9ae050', V: '#4a7a20', r: '#4a3a38', R: '#2a2020', b: '#d8d0b8' },
    crow: { k: '#141018', K: '#5a5070', e: '#ff3030', y: '#8a8070' },
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
    boss: { k: '#050407', d: '#1d1a24', m: '#2f2a3a', l: '#4d465c', w: '#7a7090', g: '#6d1c83', e: '#d17aff', r: '#4a0f14', R: '#2a070b' },
    ghoul: { k: '#120f12', s: '#8a9476', S: '#59614c', c: '#4b3b30', C: '#2c231d', e: '#ff3b2c' },
    butcher: { k: '#0f0b0b', H: '#4a3a28', h: '#6e5a40', e: '#ff4030', m: '#2a1a14', s: '#b08a78', S: '#7a5a4c', c: '#9a9da4', C: '#4d4f55', a: '#6e2a24', A: '#3d1411', b: '#b01c22' },
    shadeB: { k: '#3a0808', H: '#701414', h: '#a02020', e: '#ffffff', m: '#3a0808', s: '#d03434', S: '#901c1c', c: '#ff6050', C: '#701414', a: '#b02424', A: '#701414', b: '#ff8070' },
    dog: { k: '#100c0c', d: '#4e3b33', D: '#2f231e', l: '#74594d', e: '#ff3b2c' },
    cultist: { k: '#0e080a', R: '#3d0c14', r: '#6a1722', e: '#ffcc66', s: '#c9b49a', h: '#24070b' },
    bloat: { k: '#121012', s: '#8f9a6a', S: '#5f6a45', P: '#a3452e', e: '#ff3b2c' },
    bloatHot: { k: '#300808', s: '#e05a36', S: '#a02818', P: '#ffd060', e: '#ffffff' },
    shadeR: { k: '#3a0808', s: '#b02424', S: '#701414', c: '#d03434', C: '#501010', e: '#ffffff' },
    shade: { k: '#2a0f3a', d: '#5a2280', m: '#7a34a6', l: '#a35fd0', w: '#d9a8ff', g: '#d9a8ff', e: '#ffffff', r: '#4a1a66', R: '#2a0f3a' },
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
  function drawSprite(map, pal, scale, x, y, flip, o = {}) {
    const s = sprite(map, pal, scale, o.white);
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.translate(Math.round(x), Math.round(y));
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale((flip ? -1 : 1) * (o.sx || 1), o.sy || 1);
    ctx.drawImage(s, -Math.floor(s.width / 2), -s.height);
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
    boss: makeBlade({ len: 92, wide: 13, grip: 14, tip: 10, handle: '#241a22', gold: '#5c1a70', mid: '#3c3846', edge: '#8a8199', dark: '#17151c', rune: '#b45cff' }),
    cleaver: makeBlade({ len: 36, wide: 14, grip: 10, tip: 3, cleaver: true, handle: '#3b2416', gold: '#2a2a2a', mid: '#8d9097', edge: '#c8cbd0', dark: '#4d4f55', rust: '#6e2a24' }),
    ghost: makeBlade({ len: 34, wide: 5, grip: 6, tip: 5, handle: '#3f5f8a', gold: '#9cc1ea', mid: '#9cc1ea', edge: '#e4f2ff', dark: '#5f86b8' }),
    dagger: makeBlade({ len: 26, wide: 5, grip: 6, tip: 6, handle: '#3b2416', gold: '#8a8a8a', mid: '#c8ccd4', edge: '#ffffff', dark: '#6b7280' }),
    daggerG: makeBlade({ len: 26, wide: 5, grip: 6, tip: 6, handle: '#1f4a34', gold: '#9ff0c8', mid: '#8ff0c0', edge: '#ffffff', dark: '#3aa070' }),
    holy: makeBlade({ len: 58, wide: 8, grip: 9, tip: 7, handle: '#8a6a20', gold: '#fff0b0', mid: '#ffd34d', edge: '#fffbe6', dark: '#c9952a' }),
  };
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
  function rotW(b, ang) {
    const flip = Math.cos(ang) < 0, step = ((Math.round(ang / TAU * ROT_N) % ROT_N) + ROT_N) % ROT_N, key = step + (flip ? 'f' : '');
    if (b.rot[key]) return b.rot[key];
    const a = step / ROT_N * TAU, ca = Math.cos(a), sa = Math.sin(a), R = Math.ceil(Math.hypot(b.w, b.h)) + 2, N = R * 2 + 3, out = new Map();
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) {
      const lx = x * ca + y * sa; let ly = -x * sa + y * ca; if (flip) ly = -ly;
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
  const TIER_FX = [null, { c: '120,170,255', p: ['#9fc8ff', '#ffffff'] }, { c: '190,110,255', p: ['#c890ff', '#f0d8ff'] }];
  const LEGEND_FX_COL = { knight: { c: '255,200,90', p: ['#ffe08a', '#ff9a2e', '#ffffff'] }, ranger: { c: '255,60,70', p: ['#ff4050', '#ffd0d0'] }, mage: { c: '255,150,60', p: ['#ffb060', '#fff0b0'] }, priest: { c: '255,235,160', p: ['#fff4c0', '#ffe08a'] }, gunner: { c: '110,255,150', p: ['#7aff9a', '#d8ffe0'] } };
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
    if (t >= 2) { ctx.globalAlpha = (t === 3 ? 0.3 : 0.16) + Math.sin(time * (t === 3 ? 7 : 4)) * 0.08; drawBlade(tex, x, y, ang, 1, false, scale, 'lighter'); ctx.globalAlpha = 1; }
    const ph = (time % 1.6) / 0.35;
    if (ph < 1) { const k = 0.2 + ph * 0.8, gx = x + ux * reach * k, gy = y + uy * reach * k; ctx.fillStyle = `rgba(255,255,255,${1 - ph * 0.5})`; ctx.fillRect(Math.round(gx) - 1, Math.round(gy) - 1, 2, 2); ctx.fillStyle = `rgba(${fx.c},.7)`; ctx.fillRect(Math.round(gx) - 2, Math.round(gy), 4, 1); ctx.fillRect(Math.round(gx), Math.round(gy) - 2, 1, 4); }
    ctx.restore();
    if (t >= 2 && Math.random() < (t === 3 ? 0.55 : 0.18)) { const k = rand(0.3, 1); G.parts.push({ x: x + ux * reach * k + rand(-2, 2), y: y + uy * reach * k + rand(-2, 2), vx: rand(-8, 8), vy: rand(-30, -10), t: rand(0.3, 0.6), c: pick(fx.p), g: 0, glow: true }); }
  }
  function drawBlade(b, x, y, ang, alpha = 1, white, scale = 1, comp) {
    if (b.cells) {
      const r = rotW(b, ang);
      ctx.save(); ctx.globalAlpha = alpha; if (comp) ctx.globalCompositeOperation = comp; if (white) ctx.filter = 'brightness(3)';
      ctx.translate(Math.round(x), Math.round(y)); if (scale !== 1) ctx.scale(scale, scale);
      ctx.drawImage(r.c, -r.o, -r.o); ctx.restore(); return;
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
  function drawNumber(str, x, y, color, s) {
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
    // 의식의 원
    g.strokeStyle = 'rgba(120,18,28,.35)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(CX, CY, 92, 62, 0, 0, TAU); g.stroke();
    g.beginPath(); g.ellipse(CX, CY, 82, 55, 0, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(140,22,32,.35)';
    for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.fillRect(Math.round(CX + Math.cos(a) * 87) - 1, Math.round(CY + Math.sin(a) * 58.5) - 1, 2, 2); }
    // 잔해: 뼈, 해골, 부서진 돌
    for (let i = 0; i < 26; i++) {
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
    if (!keys[k]) pressed[k] = true;
    keys[k] = true;
    if ([' ', 'arrowup', 'arrowdown', 'tab'].includes(k)) e.preventDefault();
  });
  addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
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
      dmgMul: 1.15, n: '기사', role: '탱커 · 그로기', map: 'knight', pal: 'knight', ghostPal: 'ghost', weapon: '대검과 방패',
      base: { atk: 20, def: 30, hp: 100, crit: 0.10, spd: 88 }, skill: '돌진 참격', skillCd: 8, awaken: '성채의 맹세',
      skillD: '돌진 후 크게 올려베며 푸른 검기를 날린다', awakenD: '금빛 회전베기 2회 → 빛의 거대검 내려찍기, 5초간 받는 피해 -30%',
      atkD: '느리고 묵직한 대검 3타, 3타는 회전베기',
    },
    ranger: {
      n: '어세신', role: '근접 연타 딜러', map: 'ranger', pal: 'ranger', ghostPal: 'rangerGhost', weapon: '쌍검',
      base: { atk: 17, def: 22, hp: 85, crit: 0.18, spd: 100 }, skill: '그림자 도약', skillCd: 7, awaken: '칼날 폭풍',
      skillD: '조준한 적의 등 뒤로 순간 이동해 X자로 베기, 치명타 확정', awakenD: '3초간 쌍검 회오리를 두르고 이동하며 연속 베기, 받는 피해 -50%',
      atkD: '빠른 쌍검 3타, 3타는 앞으로 파고드는 교차베기',
    },
    mage: {
      dmgMul: 0.88, n: '마법사', role: '원거리 광역 딜러', map: 'mage', pal: 'mage', ghostPal: 'mageGhost', weapon: '지팡이',
      base: { atk: 24, def: 14, hp: 75, crit: 0.12, spd: 90 }, skill: '화염구', skillCd: 10, awaken: '운석 낙하',
      skillD: '폭발하는 화염구를 날린다. 범위 피해 + 3초 화상', awakenD: '1초 영창 후 커서 위치에 운석이 떨어진다. 초대형 광역 + 화상',
      atkD: '약하게 유도되는 마력탄 연사, 3발마다 큰 탄 (누르고 있으면 연사)', icons: ['bolt', 'fireball', 'meteor'],
    },
    priest: {
      n: '사제', role: '회복 · 버프', map: 'priest', pal: 'priest', ghostPal: 'priestGhost', weapon: '메이스',
      base: { atk: 18, def: 26, hp: 95, crit: 0.08, spd: 90 }, skill: '치유의 빛', skillCd: 12, awaken: '기적',
      skillD: 'HP 25% 회복 + 주변 적을 빛으로 밀쳐낸다', awakenD: 'HP 완전 회복, 3초 무적, 큰 빛기둥. 게이지가 차 있으면 쓰러질 때 자동 발동',
      atkD: '메이스 3타, 3타는 땅을 내리쳐 빛의 충격파', icons: ['mace', 'heal', 'miracle'],
    },
    gunner: {
      n: '거너', role: '원거리 단일 폭딜', map: 'gunner', pal: 'gunner', ghostPal: 'gunnerGhost', weapon: '머스킷',
      base: { atk: 28, def: 18, hp: 82, crit: 0.25, spd: 92 }, skill: '산탄 사격', skillCd: 8, awaken: '집중 저격',
      skillD: '근거리 부채꼴 산탄 + 강한 넉백, 즉시 재장전', awakenD: '2초 조준 후 모든 적을 꿰뚫는 대형탄. 보스 그로기 대량 누적',
      atkD: '단발 사격(재장전 0.8초). 적이 붙어 있으면 개머리판 타격, 맞히면 즉시 재장전', icons: ['musket', 'shotgun', 'snipe'],
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
  };
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
      fx = slot.k === 'weapon' ? WEAPON_FX[wcls] : pick(['vigil', 'ember']);
      name = slot.k === 'weapon' ? LEGEND_FX[fx].n : LEGEND_FX[fx].n + slot.n;
    }
    return { id: SAVE.nextId++, grade: g.k, slot: slot.k, cls: wcls, name, stat: slot.stat, val, opts, fx, lv: 0, fail: 0 };
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
  const optText = o => OPTS.find(x => x.k === o.k).n.replace('{v}', o.v);

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
    const s = { atk: B.atk, def: B.def, hp: B.hp, crit: B.crit, critDmg: 1.5, cdr: 0, spd: B.spd, stamRate: 1, gaugeRate: 1, fx: new Set() };
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
    }
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
      cls: CUR, stage: 1, gold: 0, committed: { gold: 0, iron: 0, crystal: 0 },
      phase: 1, buffs: [], retries: 0, enemies: [], tele: [], parts: [], nums: [], hazards: [], drops: [], fx: [], ash: [], lights: [],
      waves: [], waveIdx: 0, spawning: 0, phaseState: 'intro', phaseT: 0, surviveT: 0, spawnT: 0, hazardT: 0,
      boss: null, bossTime: 300, proj: [], eproj: [], kills: 0, iron: 0, crystal: 0, newItems: [], loot: [], mproj: [], meteor: null, fieldItems: [], frenzyT: 0, bonfire: null, vortex: null, clear: false,
    };
    for (let i = 0; i < 70; i++) G.ash.push(G.stage === 1 ? { x: rand(0, VW), y: rand(0, VH), vx: rand(-8, 8), vy: rand(-4, 4), s: Math.random() < 0.3 ? 2 : 1, a: rand(0.3, 0.9), ff: rand(0, 6) } : { x: rand(0, VW), y: rand(0, VH), vx: rand(-6, 6), vy: rand(6, 16), s: Math.random() < 0.2 ? 2 : 1, a: rand(0.2, 0.6) });
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
      chargeCd: [0, 0], chargeHit: new Set(), gauge: 0, reload: 0, recoil: 0, poisonT: 0, poisonTick: 0, poisonDmg: 0, shieldT: 0, miracleT: 0, boltN: 0, awakenT: 0, critNext: false, dead: false, deadT: 0, walk: 0, moving: false,
    };
  }

  // ---------------------------------------------------------------- 페이즈
  const PHASES = {
    1: [[['ghoul', 4]], [['ghoul', 3], ['crow', 3]]],
    2: [[['ghoul', 3], ['dog', 2]], [['ghoul', 3], ['bloat', 2], ['crow', 2]]],
    3: [[['ghoul', 4], ['cultist', 2]], [['crow', 4], ['dog', 2], ['bloat', 1]]],
    4: [[['butcher', 1], ['ghoul', 3], ['cultist', 1]]],
    6: [[['ghoul', 4], ['dog', 2], ['bloat', 2]], [['ghoul', 3], ['cultist', 3], ['crow', 2]], [['ghoul', 5], ['dog', 2], ['cultist', 1]]],
    7: [[['mother', 1], ['ghoul', 2]], [['dog', 4], ['cultist', 2]], [['ghoul', 4], ['crow', 4], ['cultist', 2]]],
    8: [[['ghoul', 6], ['dog', 3], ['bloat', 2]], [['crow', 5], ['cultist', 3], ['bloat', 2]], [['butcher', 1], ['ghoul', 3], ['cultist', 2]]],
    9: [[['butcher', 1], ['mother', 1]], [['mother', 1], ['crow', 4], ['cultist', 2]]],
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
      const k = 1 - e.t / e.chargeMax, mx = e.x + e.face * 3, my = e.y - 36;
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
    const mx = e.x + e.face * 3, my = e.y - 36;
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
      const gr = ctx.createRadialGradient(e.x, e.y - 24 + ya, 0, e.x, e.y - 24 + ya, 14); gr.addColorStop(0, `rgba(170,240,90,${pulse})`); gr.addColorStop(1, 'rgba(170,240,90,0)');
      ctx.fillStyle = gr; ctx.fillRect(e.x - 14, e.y - 38 + ya, 28, 28);
      ctx.fillStyle = `rgba(200,250,110,${0.6 + 0.4 * e.glow})`; ctx.fillRect(Math.round(e.x + (flip ? 1 : -1) * 3) - 3, Math.round(e.y - 38 + ya), 2, 1); ctx.fillRect(Math.round(e.x + (flip ? 1 : -1) * 3) + 2, Math.round(e.y - 38 + ya), 2, 1);
      ctx.restore();
    }
    if (e.state === 'bilecharge' && !white) {
      const k = 1 - e.t / e.chargeMax, mx = e.x + e.face * 3, my = e.y - 36 + ya;
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
  const isEliteT = t => t === 'butcher' || t === 'gbrute' || t === 'boar' || t === 'hob' || t === 'mother';
  const isElite = e => isEliteT(e.type);
  function stamp(g, map, pal, x, y, sc = 2, flip) {
    const w = map[0].length;
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
    if (G) paintMeadowDecor(g, CUR_ROOM);
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
  function drawLob(f, p) {
    const k = (p - (f.d0 || 0)) / (1 - (f.d0 || 0)); if (k < 0) return;
    const x = f.x0 + (f.x1 - f.x0) * k, gy = f.gy0 + (f.y1 - f.gy0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(k * Math.PI) * f.h;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(x, gy, f.rock ? 8 : 4, f.rock ? 3 : 1.5, 0, 0, TAU); ctx.fill();
    if (f.rock) { drawSprite('boulder', 'deco', 2, x, y + 7, false, { rot: k * 6 }); return; }
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
    drawShadow(e.x, e.y + 2, 18);
    drawSprite(up ? 'gbruteUp' : 'gbrute', 'gbrute', 2, e.x + tr, e.y + 2 + ya, flip, { white, rot: e.lean + (e.grogiT > 0 ? 0.25 * e.face : 0), alpha: al, sx, sy });
    if (e.rockT > 0 && !white) drawSprite('boulder', 'deco', 3, e.x + tr, e.y - 40, false);
    if (up && e.state === 'wind' && e.rockT <= 0) holdGlow(e.x, e.y - 42, e.glow, '255,180,60');
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = e.enraged ? 'rgba(255,120,40,.95)' : `rgba(255,220,60,${0.4 + 0.5 * e.glow})`;
    const ex = Math.round(e.x + (flip ? -1 : 1) * 1), ey = Math.round(e.y - (up ? 32 : 38) + ya);
    ctx.fillRect(ex - 4, ey, 2, 1); ctx.fillRect(ex + 2, ey, 2, 1);
    ctx.restore();
    if (e.grogiT > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(e.y - 52 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); }
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
      const wall = e.x < A.x0 + e.r + 1 || e.x > A.x1 - e.r - 1 || e.y < A.y0 + e.r + 1 || e.y > A.y1 - e.r - 1;
      if (e.t <= 0 || wall) {
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
    drawShadow(e.x, e.y + 2, 19);
    drawSprite('boar', 'boar', 2, e.x + tr, e.y + 3 + ya, flip, { white, rot, alpha: al, sx, sy });
    if (!white && e.state === 'wind' && e.pat === 'quill') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(255,240,200,${0.4 + 0.5 * e.glow})`; ctx.fillRect(Math.round(e.x - 10 * e.face + i * 4 * e.face) - 1, Math.round(e.y - 30 - e.glow * 4 + ya), 2, 4); } ctx.restore(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = e.enraged ? 'rgba(255,40,30,1)' : `rgba(255,80,40,${0.5 + 0.5 * e.glow})`;
    ctx.fillRect(Math.round(e.x + e.face * 15) - 1, Math.round(e.y - 17 + ya), 2, 2);
    ctx.restore();
    if (e.grogiT > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(e.y - 40 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); }
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
  const bloodOf = e => e.type === 'ghost' ? '#9cc1ea' : e.type === 'crow' ? '#3a3446' : e.type === 'mother' ? '#6a8a2a' : isSlime(e) ? '#7ac843' : '#8f1418';
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
    const top = Math.round(by - h);
    for (let pass = 0; pass < 2; pass++) for (let i = 0; i < rows; i++) {
      const t = (i + 0.5) / rows, hw = Math.round(rowW(t) / px) * px + (pass === 0 ? px : 0), y = top + i * px - (pass === 0 && i === 0 ? px : 0);
      if (hw <= 0) continue;
      if (pass === 0) { ctx.fillStyle = o.white ? '#ffffff' : C.k; ctx.fillRect(Math.round(cx - hw), y, hw * 2, px + (i === rows - 1 ? px : 0) + (i === 0 ? px : 0)); continue; }
      ctx.fillStyle = o.white ? '#ffffff' : C.m; ctx.fillRect(Math.round(cx - hw), y, hw * 2, px);
      if (!o.white) {
        const sh = Math.max(px, Math.round(hw * 0.35 / px) * px);
        ctx.fillStyle = C.d; ctx.fillRect(Math.round(cx + hw - sh), y, sh, px);
        if (i >= rows - 2) ctx.fillRect(Math.round(cx - hw), y, hw * 2, px);
      }
    }
    if (!o.white) {
      ctx.fillStyle = C.l;
      ctx.fillRect(Math.round(cx - w * 0.22), top + px * 2, px * 2, px); ctx.fillRect(Math.round(cx - w * 0.28), top + px * 3, px, px * 2);
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
    const cx = e.x + tr, by = e.y + 2 + ya - z;
    drawBlob(cx, by, w0 * sx, h0 * sy, C, { white, alpha: 0.92 * al });
    if (!white) {
      const ey = Math.round(by - h0 * sy * 0.55), ex = Math.round(cx + e.face * 3);
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(ex - 5, ey, 2, 3); ctx.fillRect(ex + 2, ey, 2, 3);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(ex - 5, ey, 1, 1); ctx.fillRect(ex + 2, ey, 1, 1);
      if (tox) { ctx.fillStyle = '#9ae060'; ctx.fillRect(Math.round(cx - 7), Math.round(by - h0 * 0.35), 2, 2); ctx.fillRect(Math.round(cx + 5), Math.round(by - h0 * 0.25), 2, 2); ctx.fillRect(Math.round(cx - 1), Math.round(by - h0 * 0.8), 2, 2); }
      if (big) { ctx.fillStyle = 'rgba(10,30,30,.5)'; ctx.fillRect(Math.round(cx - 3), Math.round(by - h0 * 0.3), 4, 3); ctx.fillRect(Math.round(cx + 5), Math.round(by - h0 * 0.45), 2, 2); }
    }
    if (e.state === 'sqz' || e.state === 'spit') holdGlow(cx, by - h0 * 0.5, 1 - e.t / e.holdMax, big ? '120,255,230' : tox ? '200,110,255' : '160,255,90');
  }

  // ---------- 점액왕 구루그
  function spawnSlimeKing() {
    const P0 = G.player, S = STG(), b = makeEnemy('ghoul', clamp(P0.x, A.x0 + 80, A.x1 - 80), clamp(P0.y - 170, A.y0 + 50, A.y1 - 50));
    Object.assign(b, { type: 'boss', kind: 'slimeking', r: 22, hp: 2400 * S.hpMul, maxHp: 2400 * S.hpMul, atk: 17 * S.atkMul, def: 50, spd: 40, kbRes: 0, grogiMax: 90,
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
      if (b.dashLeft <= 0 || b.x < A.x0 + b.r || b.x > A.x1 - b.r || b.y < A.y0 + b.r || b.y > A.y1 - b.r) {
        b.x = clamp(b.x, A.x0 + b.r, A.x1 - b.r); b.y = clamp(b.y, A.y0 + b.r, A.y1 - b.r);
        b.state = 'recover'; b.t = enr ? 0.6 : 0.95; b.squash = 0.3; addShake(7, b.lockAng); sfx('blast');
        G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 10, t: 0.4, max: 0.4, c: '#b8f080', grow: 240 });
        if (b.stage >= 2) kingBurst(b, 6);
      }
      return;
    }
    // idle: 출렁이며 다가온다
    if (d > 80) { b.x += Math.cos(a) * b.spd * dt; b.y += Math.sin(a) * b.spd * dt; b.walk += dt * 4; }
    b.cd -= dt;
    if (b.cd > 0) return;
    const pats = ['jump', 'spit', 'roll'];
    let pat = pats[b.nextPat % 3]; b.nextPat += randi(1, 2);
    if (pat === 'spit' && d < 60) pat = 'jump';
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
  function drawSlimeKing(e, ya, al) {
    const C = SLIME_COL[e.stage === 3 ? 'kingR' : 'king'], white = e.flash > 0, z = e.z || 0;
    let sx = 1, sy = 1;
    if (e.squash > 0) { const k = Math.min(1, e.squash / 0.3); sx = 1 + 0.22 * k; sy = 1 - 0.22 * k; }
    else if (z > 4) { sx = 0.86; sy = 1.16; }
    else if (e.state === 'roll') { sx = 1.1; sy = 0.9; }
    else { sy = 1 + Math.sin(time * 4) * 0.035; sx = 2 - sy; }
    if (e.grogiT > 0) { sx = 1.15; sy = 0.82; }
    const W0 = 64, H0 = 50, cx = e.x, by = e.y + 2 + ya - z;
    drawShadow(e.x, e.y + 2, 30 * (1 - Math.min(0.55, z / 200)));
    if (e.glow > 0 && !white) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(cx, by - 24, 0, cx, by - 24, 50); gr.addColorStop(0, `rgba(160,255,90,${0.4 * e.glow})`); gr.addColorStop(1, 'rgba(160,255,90,0)'); ctx.fillStyle = gr; ctx.fillRect(cx - 50, by - 74, 100, 100); ctx.restore(); }
    drawBlob(cx, by, W0 * sx, H0 * sy, C, { white, alpha: 0.9 * al });
    if (white) return;
    const h = H0 * sy;
    // 몸 속에 떠 있는 해골과 뼈 (삼킨 것들)
    ctx.save(); ctx.globalAlpha = 0.5 * al;
    const skx = Math.round(cx - 8 + Math.sin(time * 1.3) * 3), sky = Math.round(by - h * 0.42 + Math.cos(time * 1.1) * 2);
    ctx.fillStyle = '#d8d0b8'; ctx.fillRect(skx, sky, 6, 5); ctx.fillRect(skx + 1, sky + 5, 4, 2);
    ctx.fillStyle = C.d; ctx.fillRect(skx + 1, sky + 2, 1, 1); ctx.fillRect(skx + 4, sky + 2, 1, 1);
    ctx.fillStyle = '#d8d0b8'; ctx.fillRect(Math.round(cx + 10 + Math.sin(time) * 2), Math.round(by - h * 0.25), 8, 2);
    if (e.state === 'roll') { ctx.fillStyle = C.l; for (let i = 0; i < 3; i++) { const aa = e.rollA + i * 2.1; ctx.fillRect(Math.round(cx + Math.cos(aa) * 20), Math.round(by - h / 2 + Math.sin(aa) * 14), 3, 3); } }
    ctx.restore();
    // 눈
    const ey = Math.round(by - h * 0.62), ex = Math.round(cx + e.face * 6);
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(ex - 10, ey, 5, 5); ctx.fillRect(ex + 4, ey, 5, 5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = e.stage === 3 ? 'rgba(255,70,140,.95)' : 'rgba(230,255,120,.9)'; ctx.fillRect(ex - 9, ey + 1, 3, 2); ctx.fillRect(ex + 5, ey + 1, 3, 2);
    ctx.restore();
    // 왕관
    const crY = Math.round(by - h - 7), crX = Math.round(cx - 9 + e.face * 2);
    ctx.fillStyle = '#0b0a0e'; ctx.fillRect(crX - 1, crY - 1, 20, 9);
    ctx.fillStyle = '#c9a24a'; ctx.fillRect(crX, crY + 3, 18, 4); ctx.fillRect(crX, crY, 3, 3); ctx.fillRect(crX + 7, crY - 2, 4, 5); ctx.fillRect(crX + 15, crY, 3, 3);
    ctx.fillStyle = '#ffe39a'; ctx.fillRect(crX, crY + 3, 18, 1);
    ctx.fillStyle = '#b01c22'; ctx.fillRect(crX + 8, crY + 4, 2, 2);
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
    // 흙길 (2px 도트) — 방마다 길 모양이 다르다 (meadowCurves)
    for (const c of meadowCurves()) paintMeadowCurve(g, c);
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
  }
  paintMeadowFloor(fmg);

  // ---------- 스테이지 정의
  const PHASES_MEADOW = {
    1: [[['slime', 4]], [['slime', 3], ['goblin', 2]]],
    2: [[['goblin', 4]], [['slime', 3], ['toxslime', 1], ['bigslime', 1]]],
    3: [[['goblin', 3], ['garcher', 2]], [['slime', 3], ['toxslime', 2], ['goblin', 1]]],
    4: [[['gbrute', 1], ['goblin', 3]]],
    6: [[['goblin', 4], ['garcher', 2]], [['bigslime', 2], ['toxslime', 2], ['slime', 2]], [['goblin', 4], ['slime', 2], ['garcher', 1]]],
    7: [[['slime', 4], ['bigslime', 2], ['toxslime', 1]], [['goblin', 5], ['garcher', 2]], [['boar', 1], ['slime', 3]]],
    8: [[['goblin', 5], ['garcher', 3]], [['bigslime', 2], ['toxslime', 2], ['goblin', 2]], [['gbrute', 1], ['goblin', 2], ['garcher', 1]]],
    9: [[['boar', 1], ['goblin', 3]], [['gbrute', 1], ['boar', 1]]],
  };
  const STAGES = {
    1: { n: '잿빛 초원', sub: '황혼이 내린 변경의 들판', diff: 1, hpMul: 1, atkMul: 1, dark: 0.34, ash: '205,240,120', torches: false,
      phases: PHASES_MEADOW, survive: [['slime', 0.3], ['goblin', 0.3], ['garcher', 0.15], ['bigslime', 0.1], ['toxslime', 0.15]], surviveMax: 10,
      boss: '점액왕 구루그', bossSub: '들판을 삼키는 거대한 점액 · 재의 왕관 파편 보유', bossGold: 160, elite: '거대 고블린 · 가시등 멧돼지' },
    2: { n: '무너진 성채', sub: '타락한 기사단의 의식장', diff: 2, hpMul: 1.15, atkMul: 1.12, dark: 0.66, ash: '160,150,170', torches: true,
      phases: PHASES, survive: [['ghoul', 0.4], ['dog', 0.15], ['bloat', 0.15], ['cultist', 0.15], ['crow', 0.15]], surviveMax: 12,
      boss: '타락 기사단장 발도르', bossSub: '무너진 성채의 주인 · 재의 왕관 파편 보유', bossGold: 250, elite: '누더기 거인 · 역병 어미' },
  };
  let STAGE = STAGES[SAVE.lastStage] ? SAVE.lastStage : 1;
  const STG = () => STAGES[G ? G.stage : STAGE];
  // ================================================================ 던전 (v0.23) — 엔터 더 건전식 방 구조
  // 한 스테이지 = 방 그래프. 전투 방은 들어가면 문이 잠기고 적을 모두 쓰러뜨려야 열린다.
  // 엘리트 방 2곳을 처치하면 보스 방 봉인이 풀린다. 갈림길·순환 고리·막다른 길 끝의 보물·상인, 금 간 벽 너머 비밀 방.
  const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
  const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };
  const DOOR = { n: { x: 719, y: A.y0 }, s: { x: 719, y: A.y1 }, w: { x: A.x0, y: CY }, e: { x: A.x1, y: CY } };
  // 방 크기·모양 (v0.25): 스테이지마다 5종
  const SHAPES = {
    field: { w: 1000, h: 540, n: '들판' }, trail: { w: 1100, h: 210, n: '오솔길' }, trailV: { w: 300, h: 640, n: '숲길' }, glade: { w: 560, h: 360, n: '숲속 빈터' }, plain: { w: 1400, h: 760, n: '너른 벌판' },
    hall: { w: 1000, h: 540, n: '의식장' }, corridor: { w: 1100, h: 190, n: '복도' }, corridorV: { w: 280, h: 640, n: '탑 계단' }, chamber: { w: 540, h: 340, n: '작은 방' }, greathall: { w: 1400, h: 760, n: '대회랑' },
  };
  function setArena(sh) {
    A.x0 = 136 + Math.max(0, Math.round((1000 - sh.w) / 4) * 2); A.x1 = A.x0 + sh.w;
    A.y0 = 100 + Math.max(0, Math.round((540 - sh.h) / 4) * 2); A.y1 = A.y0 + sh.h;
    CX = (A.x0 + A.x1) / 2; CY = (A.y0 + A.y1) / 2;
    PILLARS = []; for (let x = A.x0 + 34; x <= A.x1 - 20; x += 157) PILLARS.push(x);
    TORCHES = PILLARS.map(x => ({ x, y: A.y0 - 38 }));
    let nx = CX, bd = 1e9; for (let i = 0; i < PILLARS.length - 1; i++) { const m = (PILLARS[i] + PILLARS[i + 1]) / 2; if (Math.abs(m - CX) < bd) { bd = Math.abs(m - CX); nx = m; } }
    nx = Math.round(nx / 2) * 2;
    Object.assign(DOOR.n, { x: nx, y: A.y0 }); Object.assign(DOOR.s, { x: nx, y: A.y1 }); Object.assign(DOOR.w, { x: A.x0, y: CY }); Object.assign(DOOR.e, { x: A.x1, y: CY });
    NC = Math.ceil((A.x1 - A.x0) / NAV); NR = Math.ceil((A.y1 - A.y0) / NAV);
  }
  const doorIn = (d, k = 26) => ({ x: DOOR[d].x + (d === 'w' ? k : d === 'e' ? -k : 0), y: DOOR[d].y + (d === 'n' ? k : d === 's' ? -k : 0) });
  const ROOM_N = { start: '시작 방', combat: '전투 방', elite: '엘리트 방', survive: '봉인된 방', rest: '모닥불', reward: '보물 방', shop: '상인', secret: '비밀 방', boss: '보스' };
  const ROOM_TAG = { start: '시작', combat: '전투', elite: '엘리트', survive: '봉인', rest: '모닥불', reward: '보물', shop: '상인', secret: '비밀', boss: '보스' };

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
    const N = stage === 1 ? 12 : 13;
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
    for (const r of rooms) if (['start', 'shop', 'rest', 'reward', 'survive'].includes(r.type) || r === foyer || (r.type === 'combat' && Math.random() < 0.3)) r.hasTele = true;
    // 방 모양: 양쪽 문만 있는 전투 방은 오솔길·복도가 되기 쉽고, 엘리트·봉인은 넓은 방, 쉼터는 작은 방
    const [STD, COR, CORV, SMALL, BIG] = stage === 1 ? ['field', 'trail', 'trailV', 'glade', 'plain'] : ['hall', 'corridor', 'corridorV', 'chamber', 'greathall'];
    const wpick = arr => { let t = Math.random() * arr.reduce((a, b) => a + b[1], 0); for (const [k, w] of arr) { if (t < w) return k; t -= w; } return arr[0][0]; };
    for (const r of rooms) {
      const ds = Object.keys(r.doors).filter(d => r.doors[d] != null), hz = ds.every(d => d === 'w' || d === 'e'), vt = ds.every(d => d === 'n' || d === 's');
      r.shape = r.type === 'boss' ? STD
        : r.type === 'combat' ? (hz && Math.random() < 0.8 ? COR : vt && Math.random() < 0.8 ? CORV : wpick([[STD, 3], [SMALL, 2], [BIG, 2], [COR, ds.length <= 3 && !ds.includes('n') ? 1 : 0], [CORV, ds.length <= 3 && !ds.includes('w') ? 1 : 0]]))
        : r.type === 'elite' ? wpick([[STD, 2], [BIG, 3]])
        : r.type === 'survive' ? wpick([[STD, 1], [BIG, 2]])
        : r.type === 'start' ? STD
        : SMALL;
    }
    // 모든 칸에 적어도 오솔길/복도 하나는 나오게
    if (!rooms.some(r => r.shape === COR || r.shape === CORV)) { const nsCount = r => ['n', 's'].filter(d => r.doors[d] != null).length; const c = rooms.filter(r => r.type === 'combat').sort((a, b) => nsCount(a) - nsCount(b))[0]; if (c) c.shape = nsCount(c) <= 1 ? COR : CORV; }
    for (const r of rooms) { r.waves = r.type === 'combat' || r.type === 'elite' ? STAGES[stage].phases[r.tier] : null; setArena(SHAPES[r.shape]); layoutRoom(r, stage); }
    setArena(SHAPES[STD]);
    // 지도 경계
    const xs = rooms.map(r => r.gx), ys = rooms.map(r => r.gy);
    return { rooms, start: rooms[0], boss, foyer, cur: null, eliteDone: 0, stage, bx0: Math.min(...xs), bx1: Math.max(...xs), by0: Math.min(...ys), by1: Math.max(...ys) };
  }

  // ---------- 방 구조물: 기둥(나무) · 무너진 벽(덤불) · 잔해(바위) · 구덩이(연못)
  const U = (u, v) => ({ x: A.x0 + u * (A.x1 - A.x0), y: A.y0 + v * (A.y1 - A.y0) });
  const LAYOUTS = {
    open: () => [],
    pillars4: () => [['p', .28, .3], ['p', .72, .3], ['p', .28, .72], ['p', .72, .72]],
    pillars6: () => [['p', .22, .3], ['p', .5, .3], ['p', .78, .3], ['p', .22, .72], ['p', .5, .72], ['p', .78, .72]],
    ring: () => Array.from({ length: 8 }, (_, i) => ['p', .5 + Math.cos(i / 8 * TAU + 0.39) * 0.2, .52 + Math.sin(i / 8 * TAU + 0.39) * 0.3]),
    centerPit: () => [['pit', .5, .52, 300, 150]],
    twinPits: () => [['pit', .3, .5, 150, 220], ['pit', .7, .5, 150, 220]],
    cross: () => [['w', .5, .52, 26, 230], ['w', .5, .52, 380, 26]],
    lanes: () => [['w', .5, .33, 560, 26], ['w', .5, .7, 560, 26], ['r', .14, .5, 16], ['r', .86, .5, 16]],
    rubble: () => Array.from({ length: 8 }, () => ['r', rand(.15, .85), rand(.18, .85), rand(12, 22)]),
    pitBand: () => [['pit', .25, .52, 290, 64], ['pit', .75, .52, 290, 64], ['p', .5, .25], ['p', .5, .8]],
    blocks: () => [['w', .22, .27, 170, 90], ['w', .78, .27, 170, 90], ['w', .22, .78, 170, 90], ['w', .78, .78, 170, 90]],
    pitsScatter: () => [['pit', .25, .3, 110, 70], ['pit', .7, .25, 90, 80], ['pit', .5, .6, 130, 70], ['pit', .2, .75, 90, 60], ['pit', .82, .72, 100, 70], ['r', .4, .35, 15], ['r', .62, .82, 15]],
    halls: () => [['w', .36, .5, 26, 300], ['w', .64, .5, 26, 300], ['r', .18, .3, 18], ['r', .82, .74, 18]],
    pond: () => [['pit', .5, .48, 200, 120], ['p', .2, .25], ['p', .8, .25], ['p', .2, .78], ['p', .8, .78]],
  };
  // 모양 전용 배치 (크기 그대로)
  const LAYOUTS_SHAPE = {
    trailEdge: () => [...[.08, .3, .52, .74, .94].map(u => ['p', u, .1]), ...[.2, .42, .64, .86].map(u => ['p', u, .92]), ['r', .55, .5, 13]],
    trailZig: () => [['w', .2, .3, 46, 120], ['w', .42, .72, 46, 120], ['w', .64, .3, 46, 120], ['w', .86, .72, 46, 120]],
    trailPond: () => [['pit', .5, .5, 300, 80], ['p', .2, .12], ['p', .8, .9], ['r', .32, .9, 14]],
    vZig: () => [['w', .32, .24, 150, 30], ['w', .68, .5, 150, 30], ['w', .32, .76, 150, 30]],
    vEdge: () => [['p', .12, .18], ['p', .88, .32], ['p', .12, .48], ['p', .88, .62], ['p', .12, .8], ['r', .5, .35, 12]],
    colonnade: () => [...[.08, .26, .44, .62, .8, .96].map(u => ['p', u, .16]), ...[.08, .26, .44, .62, .8, .96].map(u => ['p', u, .86])],
    corrRubble: () => [['r', .18, .28, 22], ['r', .38, .72, 22], ['r', .58, .28, 22], ['r', .78, .72, 22]],
    corrPits: () => [['pit', .3, .3, 220, 56], ['pit', .7, .7, 220, 56]],
    vColon: () => [...[.12, .3, .48, .66, .84].map(v => ['p', .16, v]), ...[.12, .3, .48, .66, .84].map(v => ['p', .84, v])],
    vRubble: () => [['r', .3, .25, 20], ['r', .7, .45, 20], ['r', .3, .7, 20]],
    glade1: () => [['p', .2, .3], ['p', .8, .3], ['r', .5, .75, 14]],
    nave: () => [...[.12, .26, .4, .6, .74, .88].map(u => ['p', u, .3]), ...[.12, .26, .4, .6, .74, .88].map(u => ['p', u, .72])],
    groves: () => [['p', .2, .25], ['p', .25, .33], ['p', .16, .36], ['p', .8, .7], ['p', .85, .62], ['p', .76, .78], ['pit', .55, .35, 220, 110], ['r', .3, .75, 18]],
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
      if (solidOnly && b.t === 'pit') continue;
      if (b.c) { if (Math.hypot(x - b.x, y - b.y) < b.r + r) return b; }
      else { const cx = clamp(x, b.x0, b.x1), cy = clamp(y, b.y0, b.y1); if (Math.hypot(x - cx, y - cy) < r) return b; }
    }
    return null;
  }
  const solidAt = (x, y, r = 2) => !!(G && G.obs && G.obs.length && obsHitL(G.obs, x, y, r, true));
  // 원(유닛)을 장애물 밖으로 밀어낸다
  function solveObs(o, r, ignorePit) {
    const L = G && G.obs; if (!L || !L.length) return false;
    let hit = false;
    for (const b of L) {
      if (ignorePit && b.t === 'pit') continue;
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
        if (!obs.length && name !== 'open') continue;
        const nav = buildNav(obs), ok = keyPts.length < 2 || (() => { const dd = navFlood(nav, keyPts[0].x, keyPts[0].y); return keyPts.every(p => dd[navIdx(p.x, p.y)] >= 0); })();
        const center = navFlood(nav, CX, CY + 40);
        if (ok && keyPts.every(p => center[navIdx(p.x, p.y)] >= 0 || !nav[navIdx(CX, CY + 40)])) { r.layout = name; break; }
        obs = [];
      }
      r.obs = obs; r.nav = buildNav(obs);
      // 특수 지점
      const freeSpot = (cands) => cands.map(([u, v]) => U(u, v)).find(p => !obsHitL(obs, p.x, p.y, 34)) || U(.5, .5);
      if (r.hasTele) r.tele = freeSpot([[.5, .5], [.4, .62], [.6, .4], [.3, .5], [.7, .5], [.5, .3], [.5, .75], [.15, .2], [.85, .8]]);
      if (r.type === 'rest') { r.tele = U(.3, .62); }
      if (r.type === 'reward') { r.chest = { x: CX, y: CY - 20, opened: false, kind: 'reward' }; r.tele = U(.25, .7); }
      if (r.type === 'secret') r.chest = { x: CX, y: CY - 10, opened: false, kind: 'secret' };
      if (r.type === 'shop') {
        r.tele = U(.15, .78);
        const mul = stage === 2 ? 1.3 : 1;
        const all = [['meat', 35], ['orb', 45], ['vial', 55], ['gear', 160], ['iron', 30]];
        const pickd = [all[0], all[3], ...all.filter((_, i) => i !== 0 && i !== 3).sort(() => Math.random() - 0.5).slice(0, 2)].sort((a, b) => a[1] - b[1]);
        r.shop = pickd.map(([k, p], i) => ({ k, price: Math.round(p * mul / 5) * 5, x: CX - 135 + i * 90, y: CY + 30, sold: false }));
      }
      // 방 꾸미기 설정과 서 있는 소품
      r.style = stage === 1
        ? { path: pick(['wind', 'wind', 'wind', 'straight', 'straight', 'fork', 'fork', 'cross', 'stones', 'brook', 'none']), ph: rand(0, 6), off: pick([-1, 1]) * rand(0.5, 1), ea: rand(0.04, 0.22), eb: rand(0.04, 0.22), ec: rand(0.06, 0.2) }
        : { wall: Array.from({ length: 8 }, () => pick(['window', 'window', 'window', 'tapestry', 'tapestry', 'shieldSwords', 'shieldSwords', 'portrait', 'chains', 'skullNiche'])) };
      const pts = keyPts.slice();
      if (r.tele) pts.push(r.tele); if (r.chest) pts.push(r.chest); if (r.shop) pts.push(...r.shop, { x: CX, y: CY - 70 }, { x: CX + 30, y: CY - 70 }); if (r.type === 'rest') pts.push({ x: CX + 40, y: CY - 10 });
      if (r.type === 'boss' && r.style.path === 'brook') r.style.path = 'wind'; // 보스 방에는 개울 없음
      if (r.type !== 'boss') decorRoom(r, stage, pts); else r.props = [];
      r.sprites = null;
    });
  }

  // ---------- 진입·진행
  function newDungeon() {
    G.dun = genDungeon(G.stage);
    G.mood = null;
    enterRoom(G.dun.start, null);
    banner(`STAGE ${G.stage}`, `${STG().n} — 엘리트 둘을 쓰러뜨려 보스의 봉인을 풀어라`);
  }
  function setMood(m) { if (G.mood !== m) { G.mood = m; window.AudioSys.setMood(m, true); } }
  const hiddenDoor = (R, d) => R.crack && R.crack.dir === d && !R.crack.broken;
  function enterRoom(R, entry, opt = {}) {
    const D = G.dun, P = G.player;
    if (D.cur && D.cur !== R) D.cur.loot = G.loot.filter(l => l.life > 0);
    setArena(SHAPES[R.shape]);
    D.cur = R; R.visited = true; R.seen = true;
    for (const d in R.doors) if (R.doors[d] != null && !hiddenDoor(R, d)) D.rooms[R.doors[d]].seen = true;
    G.enemies = []; G.tele = []; G.hazards = []; G.proj = []; G.eproj = []; G.mproj = []; G.meteor = null; G.vortex = null; G.boss = null; G.bonfire = null;
    G.fx = []; G.parts = []; G.nums = []; G.corpses = []; G.spawning = 0;
    G.loot = R.loot || []; R.loot = [];
    G.obs = R.obs; G.nav = R.nav; G.navDist = null; G.navT = 0;
    if (!R.sprites) R.sprites = makeObsSprites(R);
    G.flies = G.stage === 1 ? Array.from({ length: randi(6, 14) }, () => ({ x: rand(A.x0 + 20, A.x1 - 20), y: rand(A.y0 + 10, A.y1 - 20), rx: rand(10, 30), ry: rand(6, 16), s: rand(0.6, 1.4), p: rand(0, 6) })) : null;
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
    if (fresh && R.type === 'elite') banner('엘리트 방', STG().elite);
    if (fresh && R.type === 'survive') banner('봉인된 방', '60초 동안 버텨라');
    if (fresh && R.type === 'boss') { banner(STG().boss, STG().bossSub); $('bossName').textContent = STG().boss; sfx('boss'); G.bossTime = 300; G.phase = 11; }
    if (R.type === 'rest') { G.bonfire = { x: CX + 40, y: CY - 10 }; if (!R.healed) { R.healed = true; P.hp = G.stats.hp; banner('모닥불', '불가에서 쉬면 축복을 하나 얻는다 · F'); } }
    if (R.type === 'shop' && !R.greeted) { R.greeted = true; banner('상인', '골드로 보급품을 산다 · F'); }
    if (R.type === 'reward' && !R.greeted) { R.greeted = true; banner('보물 방', ''); }
    if (R.type === 'secret' && !R.greeted) { R.greeted = true; banner('비밀 방', '숨겨진 보물이다'); }
    setMood(R.type === 'boss' && fresh ? 'boss' : R.type === 'survive' && fresh ? 'survive' : ['rest', 'shop', 'secret', 'reward'].includes(R.type) ? 'rest' : 'field');
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
    if (G.dun.rooms[id].type === 'boss' && G.dun.eliteDone < 2) return 'boss';
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
      if (R.type === 'survive') G.spawnT = 0;
      if (R.type === 'boss') { if (G.stage === 1) spawnSlimeKing(); else spawnBoss(); }
    } else if (rs.state === 'run') {
      if (R.waves) {
        const last = rs.wave >= R.waves.length - 1;
        if (G.spawning === 0 && (last ? alive === 0 : alive <= (R.type === 'elite' ? 0 : 2) && rs.t > 1.5)) { rs.wave++; rs.t = 0; if (rs.wave < R.waves.length) { spawnWave(R.waves[rs.wave]); sfx('growl', 0.8); addShake(2); } else roomClear(); }
      } else if (R.type === 'survive') {
        rs.surviveT += dt; G.spawnT -= dt;
        if (G.spawnT <= 0 && alive + G.spawning < STG().surviveMax) { G.spawnT = G.stage === 1 ? 1.7 : 1.35; let r = Math.random(); for (const [t, w] of STG().survive) { if (r < w) { queueSpawn(t); break; } r -= w; } }
        if (rs.surviveT >= 60) { G.enemies.forEach(e => { if (!e.dead) killEnemy(e, true); }); G.tele = []; G.spawning = 0; roomClear(); }
      }
    }
    updateNav(dt);
    G.crackCd = Math.max(0, (G.crackCd || 0) - dt);
    if (!G.sealed && !G.trans && !P.dead) checkDoors();
    // 상호작용 (F)
    G.prompt = P.dead ? null : nearInteract();
    if (take('f') && G.prompt) doInteract(G.prompt);
    // 비밀 벽 힌트: 가까이 가면 가끔 먼지가 떨어진다
    if (R.crack && !R.crack.broken) { const c = crackPoint(R); if (Math.hypot(P.x - c.x, P.y - c.y) < 220 && Math.random() < dt * 2.5) G.parts.push({ x: c.x + rand(-12, 12), y: c.y - rand(0, 20), vx: rand(-6, 6), vy: rand(10, 30), t: rand(0.4, 0.8), c: pick(['#6a6470', '#4d4858', '#8a8478']), g: 60 }); }
    // 텔레포터 위 F 안내는 nearInteract에서
  }
  function roomClear() {
    const R = G.dun.cur; R.cleared = true; G.rs.state = 'done';
    sealRoom(false);
    if (R.type === 'elite') {
      const n = ++G.dun.eliteDone;
      banner(n >= 2 ? '보스의 봉인이 풀렸다' : `엘리트 처치 ${n}/2`, n >= 2 ? `${STG().boss}의 방으로 가는 문이 열렸다` : '엘리트를 하나 더 쓰러뜨리면 보스 방이 열린다');
      if (n >= 2) sfx('grogi');
    } else if (R.type === 'survive') {
      banner('봉인 해제', '보상 상자가 나타났다');
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
    const D = G.dun; D.eliteDone = 2;
    const entry = Object.keys(D.boss.doors).find(d => D.boss.doors[d] != null);
    D.foyer.visited = D.foyer.seen = true; D.foyer.cleared = true;
    goRoom(D.boss, entry);
  }

  // ---------- 비밀 벽
  function crackPoint(R) { const d = R.crack.dir, p = DOOR[d]; return { x: p.x + (d === 'w' ? 6 : d === 'e' ? -6 : 0), y: p.y + (d === 'n' ? 6 : d === 's' ? -6 : 0) }; }
  function hitCrack(x, y, power = 1, rad = 40) {
    const R = G && G.dun && G.dun.cur; if (!R || !R.crack || R.crack.broken) return false;
    const c = crackPoint(R); if (Math.hypot(x - c.x, y - c.y) > rad) return false;
    if (G.crackCd > 0) return true;
    G.crackCd = 0.22; R.crack.hp -= power;
    debris(c.x, c.y, 10); sfx('block'); addShake(3); hitstop = Math.max(hitstop, 0.05);
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
    if (R.chest && !R.chest.opened && near(R.chest, 36)) return { k: 'chest', o: R.chest, x: R.chest.x, y: R.chest.y - 30, t: 'F 상자 열기' };
    if (R.shop) for (const it of R.shop) if (!it.sold && near(it, 26)) return { k: 'shop', o: it, x: it.x, y: it.y - 34, t: `F ${SHOP_N[it.k]} · ${it.price}G`, bad: G.gold < it.price };
    if (G.bonfire && !R.used && near(G.bonfire, 44)) return { k: 'rest', o: G.bonfire, x: G.bonfire.x, y: G.bonfire.y - 38, t: 'F 휴식 · 축복 선택' };
    if (R.tele && R.cleared && near(R.tele, 22)) return { k: 'tele', o: R.tele, x: R.tele.x, y: R.tele.y - 24, t: 'F 지도 · 순간이동' };
    return null;
  }
  const SHOP_N = { meat: '체력 물약', orb: '투지 구슬', vial: '핏빛 영약', gear: '장비 꾸러미', iron: '철광석 3개' };
  function rollGradeW(w) { let r = Math.random() * w.reduce((a, b) => a + b, 0); const ks = ['common', 'rare', 'unique', 'legend']; for (let i = 0; i < 4; i++) { if (r < w[i]) return ks[i]; r -= w[i]; } return 'common'; }
  function doInteract(it) {
    const R = G.dun.cur;
    if (it.k === 'chest') {
      const c = it.o; c.opened = true; c.openT = 0;
      sfx('drop'); sfx('coin'); addShake(3);
      G.fx.push({ kind: 'skybeam', x: c.x, y: c.y, w: 26, c: c.kind === 'secret' ? '200,140,255' : '255,210,120', t: 0.5, max: 0.5, up: true });
      const g = rollGradeW(c.kind === 'secret' ? [0, 35, 50, 15] : [25, 50, 20, 5]);
      spawnLoot('gear', c.x, c.y + 6, makeItem(G.cls, { grade: g }));
      spawnLoot('pouch', c.x, c.y + 6);
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
      if (G.stage === 1) paintMeadowFloor(fmg); else { paintCastle(fg); paintCastleWall(fg); paintCastleDecor(fg, R); }
      const g = G.stage === 1 ? fmg : fg;
      for (const b of R.obs) if (b.t === 'pit') (G.stage === 1 ? paintPond : paintChasm)(g, b);
      for (const d in R.doors) if (R.doors[d] != null && !hiddenDoor(R, d)) (G.stage === 1 ? paintDoorMeadow : paintDoorCastle)(g, d);
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
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) { const ch = g[y][x]; if (ch === '.' || !pal[ch]) continue; cx.fillStyle = pal[ch]; cx.fillRect(x0 + x * 2, y0 + y * 2, 2, 2); }
  }
  const fromRows = rows => { const w = Math.max(...rows.map(r => r.length)); return rows.map(r => r.padEnd(w, '.').split('')); };
  // 명암: 왼쪽 위에서 빛
  const shade4 = (dx, dy, r, j = 0.22) => { const v = (dx + dy * 1.1) / (r * 1.4) + rand(-j, j); return v < -0.5 ? 'h' : v < 0 ? 'l' : v < 0.5 ? 'd' : 'D'; };

  const STONE = { k: '#0b0a0e', K: '#050407', h: '#5e5868', l: '#423d4c', d: '#2d2935', D: '#1c1922', m: '#3a5226', M: '#567234', w: '#a49c8e', W: '#d8d0c0', r: '#7a1820' };
  const LEAF = Object.assign({ k: '#07100a', r: '#b83040', y: '#e0c040', p: '#a070d0', t: '#3a2a1c', T: '#22180e' }, TREE_PAL.green);

  // --- 장애물 생성기 -------------------------------------------------
  // 초원 덤불 벽: 잎 뭉치를 겹쳐 쌓는다 (발자국 wc×hc칸 + 높이 HH칸)
  function genHedge(wc, hc) {
    const HH = 9, W0 = wc + 4, H0 = hc + HH + 4, g = mkGrid(W0, H0);
    const n = Math.max(4, Math.round(wc * (hc + HH) / 16)), cl = [];
    for (let i = 0; i < n; i++) cl.push({ x: rand(3, W0 - 3), y: rand(4, H0 - 4), r: rand(3.2, 5.5) });
    cl.sort((a, b) => a.y - b.y);
    for (const c of cl) for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
      const dx = x - c.x, dy = (y - c.y) * 1.15;
      if (dx * dx + dy * dy < c.r * c.r && x >= 1 && x < W0 - 1 && y >= 1 && y < H0 - 1) g[y][x] = shade4(dx, dy, c.r);
    }
    for (let y = 6; y < H0 - 3; y++) for (let x = 3; x < W0 - 3; x++) if (g[y][x] === '.') g[y][x] = 'D';
    for (let x = 2; x < W0 - 2; x++) for (let y = H0 - 2; y >= 0; y--) if (g[y][x] !== '.') { if (Math.random() < 0.5) g[y][x] = 'D'; if (Math.random() < 0.3 && y + 1 < H0) g[y + 1][x] = 't'; break; }
    for (let i = 0; i < wc * hc / 20 + 3; i++) { const x = randi(2, W0 - 3), y = randi(2, H0 - 4); if ('hl'.includes(g[y][x])) g[y][x] = pick(['r', 'r', 'y', 'p']); }
    return { g: gOutline(g), HH };
  }
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
  function genWallBlock(wc, hc) {
    const HH = 12, W0 = wc + 2, H0 = hc + HH + 2, g = mkGrid(W0, H0);
    for (let y = 1; y <= hc + HH; y++) for (let x = 1; x <= wc; x++) {
      const top = y <= hc, ry = top ? y - 1 : y - 1 - hc, row = Math.floor(ry / 3), off = (row % 2) * 3, bx = (x - 1 + off) % 6;
      if (ry % 3 === 2) g[y][x] = top ? 'd' : 'K';
      else if (bx === 5) g[y][x] = top ? 'd' : 'K';
      else g[y][x] = top ? (ry % 3 === 0 && bx === 0 ? 'h' : 'l') : (ry % 3 === 0 ? 'd' : 'D');
    }
    for (let x = 1; x <= wc; x++) { g[hc][x] = 'h'; g[hc + 1][x] = 'D'; }
    for (let x = 1; x <= wc; x++) { if (Math.random() < 0.25) { g[1][x] = '.'; if (Math.random() < 0.4) g[2][x] = '.'; } }
    for (let i = 0; i < wc / 6; i++) { const x = randi(2, wc - 1); g[hc + HH][x] = pick(['m', 'M']); g[hc + HH - 1][x] = 'm'; }
    let cx = randi(3, wc - 3), cy = hc + 2; for (let i = 0; i < HH - 3; i++) { g[cy][cx] = 'K'; cx += randi(-1, 1); cy++; if (cx < 1 || cx > wc) break; }
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
    for (let i = 0; i < wc * hc / 40 + 2; i++) { const x = randi(3, W0 - 6), y = randi(4, H0 - 4); for (let k = 0; k < randi(2, 3); k++) if ('Ww'.includes(gAt(g, x + k, y))) g[y][x + k] = 'h'; }
    if (style !== 'swamp' && Math.random() < 0.6) { const mx = Math.round(cx + rand(-rx * 0.3, rx * 0.3)); for (let y = 3; y < H0 - 3; y += 2) for (let k = -1; k <= 1; k++) if ('Ww'.includes(gAt(g, mx + k + (y % 4 ? 1 : 0), y)) && Math.random() < 0.7) g[y][mx + k + (y % 4 ? 1 : 0)] = 'h'; }
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
    clear: { W: '#13304c', w: '#1c4466', D: '#0c1a2c', h: '#6a9ac0' },
    island: { W: '#13304c', w: '#1c4466', D: '#0c1a2c', h: '#6a9ac0' },
    rocky: { W: '#0f2a46', w: '#18406a', D: '#081624', h: '#8ab4d8' },
    swamp: { W: '#16221a', w: '#1e3024', D: '#0c140c', h: '#5a6a3a' },
  };
  const POND_PAL = { Y: '#a08a4a', K: '#0b0a0e', a: '#3a5a22', o: '#6a8a3a', A: '#c86a2a', I: '#2e5222', i: '#4a7a34', T: '#5a3a20', G: '#8a8494', g: '#6a6474', d: '#4a4554', k: '#081210', b: '#6e5236', B: '#4a3424', D: '#0c1a2c', W: '#13304c', w: '#1c4466', h: '#6a9ac0', L: '#3e6a2c', l: '#6a9a44', f: '#e8b8d0', R: '#4a6a2e', M: '#8aa84a', m: '#2e5222' };
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
  function paintTelePad(g, p) { gPaint(g, genTelePad(), TELE_PAL, p.x - 19, p.y - 11); }
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
        if (b.t === 'pit' || b.t === 'prop') continue;
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
      else if (st === 'boss') drawSeal(d, 1);
      else if (G.sealAnim > 0) drawSeal(d, G.sealAnim);
      if (R.doors[d] != null && G.dun.rooms[R.doors[d]].type === 'boss' && st !== 'crack') drawBossSigil(d, st === 'boss');
    }
    if (R.tele && R.cleared) {
      const p = R.tele, on = 0.55 + 0.35 * Math.sin(time * 4);
      ctx.save(); ctx.globalAlpha = on;
      const pad = art('padglow', () => { const g = genTelePad().map(r => r.map(c => c === 'r' ? 'r' : '.')); return gCanvas(g, { r: '#9fd2ff' }); });
      ctx.drawImage(pad, Math.round(p.x - 19) & ~1, Math.round(p.y - 11) & ~1);
      ctx.restore();
      for (let i = 0; i < 3; i++) { const a = time * 2 + i * 2.1, h = (time * 24 + i * 9) % 22; ctx.globalAlpha = 1 - h / 22; ctx.fillStyle = '#bfe2ff'; ctx.fillRect(Math.round(p.x + Math.cos(a) * 9) & ~1, Math.round(p.y - h) & ~1, 2, 2); }
      ctx.globalAlpha = 1;
    }
  }
  // 봉쇄: 성채는 쇠창살이 내려오고, 초원은 가시덤불이 자라난다 (k: 0→1)
  function drawSeal(d, k) {
    const p = DOOR[d], meadow = G.stage === 1, vert = d === 'n' || d === 's';
    const key = (meadow ? 'th' : 'bar') + d;
    const spr = art(key, () => withSeed(d.charCodeAt(0) * 99, () => meadow
      ? gCanvas(vert ? genThorns(22, d === 'n' ? 18 : 16, true) : genThorns(18, 24, false), THORN_PAL)
      : gCanvas(vert ? genBars(19, d === 'n' ? 28 : 16, true) : genBars(17, 21, false), BAR_PAL)));
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
    if (locked) { ctx.font = '8px Galmuri7'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(`엘리트 ${G.dun.eliteDone}/2`, q.x + 1, q.y + 19); ctx.fillStyle = '#ff8080'; ctx.fillText(`엘리트 ${G.dun.eliteDone}/2`, q.x, q.y + 18); }
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
      return gCanvas(g, STONE);
    }));
    let x = c.x - spr.width / 2, y = d === 'n' ? c.y - spr.height + 4 : c.y - spr.height / 2;
    if (G.stage === 1 && d === 'w') x = c.x - spr.width + 16; if (G.stage === 1 && d === 'e') x = c.x - 16;
    ctx.drawImage(spr, Math.round(x) & ~1, Math.round(y) & ~1);
  }
  function drawChest(c) {
    const sec = c.kind === 'secret', key = (c.opened ? 'chO' : 'chC') + (sec ? 's' : '');
    const spr = art(key, () => gCanvas(c.opened ? CHEST_O : CHEST_C, sec ? CHEST_PAL_S : CHEST_PAL));
    const bob = !c.opened && Math.floor(time * 2) % 2 ? 2 : 0, x = Math.round(c.x - spr.width / 2) & ~1, y = Math.round(c.y - spr.height + 2) & ~1;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; for (let xx = x + 2; xx < x + spr.width - 2; xx += 2) ctx.fillRect(xx, y + spr.height, 2, 2);
    ctx.drawImage(spr, x, y - bob);
    if (!c.opened && Math.floor(time * 6) % 7 === 0) { ctx.fillStyle = sec ? '#f0e0ff' : '#fff0b0'; ctx.fillRect((x + 6 + Math.floor(time * 6) % 14 * 1) & ~1, y + 4 - bob, 2, 2); }
  }
  function drawMerchant(R) {
    const x = CX & ~1, y = (CY - 70) & ~1, bob = Math.floor(time * 2) % 2 ? 2 : 0;
    const m = art('merch', () => gCanvas(MERCHANT, MERCHANT_PAL)), cart = art('cart', () => gCanvas(CART, CART_PAL)), lan = art('lantern', () => gCanvas(LANTERN, LANTERN_PAL));
    ctx.fillStyle = 'rgba(0,0,0,.4)'; for (let xx = x - 10; xx < x + 50; xx += 2) ctx.fillRect(xx, y, 2, 2);
    ctx.drawImage(cart, x + 12, y - cart.height + 2);
    ctx.drawImage(lan, x - 30, y - lan.height + 2);
    ctx.drawImage(m, x - m.width / 2, y - m.height + 2 - bob);
  }
  function drawShopItem(s) {
    const x = Math.round(s.x) & ~1, y = Math.round(s.y) & ~1, st = art('stand', () => gCanvas(STAND, STAND_PAL));
    ctx.drawImage(st, x - st.width / 2, y - st.height + 2);
    if (s.sold) return;
    const by = (y - 14 + (Math.floor(time * 2 + x) % 2 ? 0 : -2)) & ~1;
    if (s.k === 'gear') { const g = art('gearbox', () => gCanvas(GEARBOX, GEARBOX_PAL)); ctx.drawImage(g, x - g.width / 2, by - g.height + 4); }
    else if (s.k === 'iron') { const g = art('ironore', () => gCanvas(IRONORE, IRONORE_PAL)); ctx.drawImage(g, x - g.width / 2, by - g.height + 4); }
    else { const L = LOOT[s.k]; drawSprite(L.map, 'loot', L.sc, x, by + 4, false); }
    ctx.font = '8px Galmuri7'; ctx.textAlign = 'center';
    ctx.fillStyle = '#000'; ctx.fillText(`${s.price}G`, x + 1, y + 11); ctx.fillStyle = G.gold >= s.price ? '#ffd34d' : '#a06060'; ctx.fillText(`${s.price}G`, x, y + 10);
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
    const ok = (x, y, rad) => x > A.x0 + rad + 4 && x < A.x1 - rad - 4 && y > A.y0 + 8 && y < A.y1 - rad - 4 && !obsHitL(r.obs, x, y, rad + 8)
      && !keyPts.some(p => Math.hypot(p.x - x, p.y - y) < rad + 46) && !r.props.some(p => Math.hypot(p.x - x, p.y - y) < rad + p.rad + 12);
    const add = (name, x, y) => { const sp = PROPS[name], rad = sp.r || (sp.w ? (sp.pit ? Math.max(sp.w, sp.h) / 2 + 6 : sp.w / 2) : 8); if (!ok(x, y, rad)) return false; r.props.push({ name, x: Math.round(x / 2) * 2, y: Math.round(y / 2) * 2, rad }); return true; };
    const fightRoom = ['combat', 'elite', 'survive', 'start'].includes(r.type);
    if (stage === 2) {
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
        const RS0 = ROOMSTYLE; ROOMSTYLE = r.style; const curves = meadowCurves(); ROOMSTYLE = RS0;
        const farFromPath = (x, y, w, h) => curves.every(c => { for (let t = c.a; t < c.b; t += 12) { const m = c.at(t), px = c.vert ? m : t, py = c.vert ? t : m; if (Math.abs(px - x) < w / 2 + 34 && Math.abs(py - y) < h / 2 + 34) return false; } return true; });
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
    ctx.fillStyle = 'rgba(0,0,0,.35)'; for (let xx = x + 2; xx < x + c.width - 2; xx += 2) ctx.fillRect(xx, p.y, 2, 2);
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
    const MPs = meadowCurves(), onPath = (x, y) => MPs.some(c => c.vert ? Math.abs(x - c.at(y)) < 20 : Math.abs(y - c.at(x)) < 20);
    const busy = (x, y, r) => (R && obsHitL(R.obs, x, y, r)) || onPath(x, y);
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
    if (Math.random() < 0.45) { const p = spot(40, 24); if (p && !onPath(p.x, p.y - 12) && !onPath(p.x, p.y + 12) && !onPath(p.x - 18, p.y) && !onPath(p.x + 18, p.y)) { const sp = SPRINGS.springS; gPaint(g, sp, POND_PAL, p.x - sp[0].length, p.y - sp.length); } }
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
    if (st === 'none') return out;
    const kind = st === 'stones' ? 'stones' : st === 'brook' ? 'brook' : 'dirt';
    // 길·개울은 벽까지 닿지 않고 방 안에서 가늘어지며 끝난다 (ea·eb·ec = 끝에서 비우는 비율)
    const ea = ROOMSTYLE.ea != null ? ROOMSTYLE.ea : 0.12, eb = ROOMSTYLE.eb != null ? ROOMSTYLE.eb : 0.12, ec = ROOMSTYLE.ec != null ? ROOMSTYLE.ec : 0.12;
    const full = kind === 'brook'; // 개울은 맵 끝까지 이어진다
    if (vert) { const amp = st === 'straight' ? 6 : Math.min(40, w * 0.14), ph = ROOMSTYLE.ph || 0; out.push({ vert: true, kind, at: y => CX + Math.sin(y * 0.012 + ph) * amp + Math.sin(y * 0.03) * 4, a: full ? A.y0 - 80 : A.y0 + h * ea, b: full ? A.y1 + 80 : A.y1 - h * eb, fadeA: !full, fadeB: !full }); return out; }
    const ph = ROOMSTYLE.ph || 0, amp = st === 'straight' ? 8 : Math.min(70, h * 0.13), base = h > 400 ? CY + (ROOMSTYLE.off || 0) * Math.min(120, h * 0.22) : CY;
    const main = { vert: false, kind, at: x => base + Math.sin(x * 0.007 + ph) * amp + Math.sin(x * 0.02) * Math.min(8, amp * 0.3), a: full ? A.x0 - 80 : A.x0 + w * ea, b: full ? A.x1 + 80 : A.x1 - w * eb, fadeA: !full, fadeB: !full };
    out.push(main);
    if (st === 'fork' || st === 'cross') {
      const xb = CX + (ROOMSTYLE.off || 0.3) * w * 0.25, yb = main.at(xb), up = st === 'cross' || (ROOMSTYLE.off || 0) > 0;
      const ya = A.y0 + h * ec, yz = A.y1 - h * ec;
      out.push({ vert: true, kind: 'dirt', at: y => xb + Math.sin(y * 0.015 + ph) * 22, a: st === 'cross' ? ya : up ? ya : yb, b: st === 'cross' ? yz : up ? yb : yz, fadeA: st === 'cross' || up, fadeB: st === 'cross' || !up });
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
    const L = 90, B4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let t = c.a & ~1; t < c.b; t += 2) {
      const m = Math.round(c.at(t) / 2) * 2;
      const f = Math.min(1, c.fadeA ? (t - c.a) / L : 1, c.fadeB ? (c.b - t) / L : 1);
      if (c.kind === 'stones') { if (t % 22 === 0 && Math.random() < 0.25 + 0.75 * f) gPaint(g, STONEPAD, STONEPAD_PAL, (c.vert ? m : t) - 6 + randi(-4, 4), (c.vert ? t : m) - 4 + randi(-4, 4)); continue; }
      const hw = Math.max(4, Math.round((c.kind === 'brook' ? 12 + (Math.random() < 0.3 ? 2 : 0) : 10 + (Math.random() < 0.3 ? 2 : 0)) * (c.kind === 'brook' ? 0.45 + 0.55 * f : 0.35 + 0.65 * f) / 2) * 2);
      const span = c.kind === 'brook' ? hw : Math.ceil(hw * 1.4 / 2) * 2;
      for (let o = -span - 2; o <= span; o += 2) {
        const x = c.vert ? m + o : t, y = c.vert ? t : m + o, edge = o < -hw || o >= hw;
        if (c.kind === 'brook') { g.fillStyle = edge ? (Math.random() < 0.7 ? '#4a3424' : '#2e5222') : o <= -hw + 2 ? '#0c1a2c' : Math.random() < 0.06 ? '#6a9ac0' : o > hw - 6 ? '#1c4466' : '#13304c'; g.fillRect(x, y, 2, 2); continue; }
        if (f < 1 && !((0.2 + f * 1.1) * 16 > B4[((y >> 1) & 3) * 4 + ((x >> 1) & 3)])) continue;
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
    if (Math.random() < cp) {
      if (sh === 'corridorV' || (sh !== 'corridor' && R && R.doors.n != null && Math.random() < 0.45)) { const wd = sh === 'corridorV' ? 18 : 24, len = Math.floor((A.y1 - A.y0 - 20) / 2); gPaint(g, genCarpet(len, wd, true), CARPET_PAL, DOOR.n.x - wd, A.y0 + 6); }
      else { const wd = sh === 'corridor' ? 20 : 24, len = Math.floor((W0 - 60) / 2); gPaint(g, genCarpet(len, wd, false), CARPET_PAL, A.x0 + 30, CY - wd); }
    }
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
  function pxDisc(cx, cy, r, col) {
    ctx.fillStyle = col; const R = r * r;
    for (let y = -r; y <= r; y += 2) for (let x = -r; x <= r; x += 2) if (x * x + y * y <= R + 1) ctx.fillRect((Math.round(cx + x)) & ~1, (Math.round(cy + y)) & ~1, 2, 2);
  }
  function drawEProjs() {
    const blink = Math.floor(time * 14) % 2;
    for (const pr of G.eproj) {
      const gx = Math.round(pr.x) & ~1, gy = Math.round(pr.y) & ~1, hy = pr.y - 10;
      // 바닥 그림자 (날아가는 높이를 보여 준다)
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(gx - 4, gy, 8, 2); ctx.fillRect(gx - 2, gy - 2, 4, 2);
      if (pr.kind === 'arrow' || pr.kind === 'quill') {
        const ux = Math.cos(pr.ang), uy = Math.sin(pr.ang), L = pr.kind === 'arrow' ? 16 : 12;
        const shaft = pr.kind === 'arrow' ? '#f0d8a0' : '#fff4dc', tip = pr.kind === 'arrow' ? '#ffffff' : '#ffc890';
        // 속도선
        ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let k = L; k < L + 14; k += 2) ctx.fillRect(Math.round(pr.x - ux * k) & ~1, Math.round(hy - uy * k) & ~1, 2, 2);
        ctx.fillStyle = '#0b0a0e'; for (let k = 0; k <= L; k += 2) ctx.fillRect((Math.round(pr.x - ux * k) & ~1) - 2, (Math.round(hy - uy * k) & ~1) - 2, 6, 6);
        ctx.fillStyle = shaft; for (let k = 2; k <= L; k += 2) ctx.fillRect((Math.round(pr.x - ux * k) & ~1) - 1, (Math.round(hy - uy * k) & ~1) - 1, 4, 4);
        ctx.fillStyle = '#0b0a0e'; ctx.fillRect((Math.round(pr.x) & ~1) - 4, (Math.round(hy) & ~1) - 4, 10, 10);
        ctx.fillStyle = blink ? tip : '#ff5a4a'; ctx.fillRect((Math.round(pr.x) & ~1) - 2, (Math.round(hy) & ~1) - 2, 6, 6);
        if (pr.kind === 'arrow') { ctx.fillStyle = '#e03030'; ctx.fillRect((Math.round(pr.x - ux * L) & ~1) - 1, (Math.round(hy - uy * L) & ~1) - 1, 4, 4); }
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
    if (R.sprites) for (const s of R.sprites) ents.push({ y: s.sy, d: () => ctx.drawImage(s.cv, s.x, s.y) });
    if (R.props) for (const p of R.props) if (!PROPS[p.name].pit) ents.push({ y: p.y, d: () => drawProp(p) });
    if (R.chest) ents.push({ y: R.chest.y, d: () => drawChest(R.chest) });
    if (R.type === 'shop') { ents.push({ y: CY - 70, d: () => drawMerchant(R) }); for (const s of R.shop) ents.push({ y: s.y, d: () => drawShopItem(s) }); }
  }
  function roomLights(lights) {
    const R = G.dun && G.dun.cur; if (!R) return;
    if (R.tele && R.cleared) lights.push({ x: R.tele.x, y: R.tele.y, r: 46, a: 0.5, c: '120,180,255', ca: 0.14 });
    if (R.props) for (const p of R.props) { const L = PROPS[p.name].light; if (L) lights.push({ x: p.x, y: p.y + L.dy, r: L.r + Math.sin(time * 9 + p.x) * 3, a: 0.8, c: L.c, ca: L.ca }); }
    if (G.flatLights) for (const l of G.flatLights) lights.push(l.flick ? Object.assign({}, l, { r: l.r + Math.sin(time * 10 + l.x) * 2 }) : l);
    if (G.stage === 1 && G.flies) for (const f of G.flies) if (f.cx != null) lights.push({ x: f.cx, y: f.cy, r: 14, a: 0.35, c: '220,255,120', ca: 0.2 });
    if (R.chest && !R.chest.opened) lights.push({ x: R.chest.x, y: R.chest.y - 10, r: 60, a: 0.6, c: R.chest.kind === 'secret' ? '200,140,255' : '255,200,110', ca: 0.18 });
    if (R.type === 'shop') { lights.push({ x: CX - 24, y: CY - 110, r: 130, a: 0.85, c: '255,180,90', ca: 0.16 }); lights.push({ x: CX, y: CY + 20, r: 160, a: 0.7 }); }
    if (G.stage === 2) for (const b of R.obs) if (b.t === 'pit') lights.push({ x: b.x, y: b.y0 + 10, r: Math.max(b.w, b.h) * 0.55, a: 0.22 }); else lights.push({ x: b.x, y: b.y - (b.t === 'pillar' ? 20 : 8), r: b.c ? 42 : Math.max(b.w, b.h) * 0.6 + 20, a: 0.28 });
    for (const d in DIRS) { const st = doorState(R, d); if (st === 'open' || st === 'sealed') { const q = doorIn(d, 6); lights.push({ x: q.x, y: q.y, r: 50, a: 0.45, c: st === 'sealed' ? '255,60,60' : null, ca: 0.1 }); } }
  }

  // ---------- 미니맵 · 지도 · 순간이동
  const shapeFit = r => { const sh = SHAPES[r.shape] || SHAPES.field; return { w: sh.w >= 1300 ? 1 : sh.w >= 1000 ? 0.82 : sh.w >= 500 ? 0.6 : 0.36, h: sh.h >= 700 ? 1 : sh.h >= 500 ? 0.82 : sh.h >= 300 ? 0.6 : 0.36 }; };
  const roomColor = (r) => ({ boss: '#a02a34', shop: '#b08a2a', rest: '#c06a2a', reward: '#c0a040', secret: '#8a5ac0', elite: '#7a2a40', survive: '#5a4a7a', start: '#4a6a4a' }[r.type] || '#3a3444');
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
      if (r.chest && !r.chest.opened && r.visited) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(x + 1, y + 1, 3, 3); }
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
    ctx.fillText(`엘리트 ${D.eliteDone}/2 · ${D.eliteDone >= 2 ? '보스 방 열림' : '보스 방 봉인'} · 골드 ${G.gold}G`, VW / 2, 54);
    // 통로
    ctx.fillStyle = '#5a5466';
    for (const r of D.rooms) { if (!r.visited) continue; const p = M.pos(r); for (const d in r.doors) { const id = r.doors[d]; if (id == null || hiddenDoor(r, d) || !D.rooms[id].seen) continue; const [dx, dy] = DIRS[d]; ctx.fillRect(Math.round(p.x + M.cw / 2 + dx * (M.cw / 2 + M.gap / 2) - (dx ? M.gap / 2 : 2)), Math.round(p.y + M.ch / 2 + dy * (M.ch / 2 + M.gap / 2) - (dy ? M.gap / 2 : 2)), dx ? M.gap : 4, dy ? M.gap : 4); } }
    for (const r of D.rooms) {
      if (!r.seen) continue;
      const sf = r.visited ? shapeFit(r) : { w: 0.82, h: 0.82 }, rw = Math.round(M.cw * sf.w), rh = Math.round(M.ch * sf.h), p0 = M.pos(r), x = Math.round(p0.x + (M.cw - rw) / 2), y = Math.round(p0.y + (M.ch - rh) / 2);
      ctx.fillStyle = r.visited ? roomColor(r) : 'rgba(30,27,36,.95)'; ctx.fillRect(x, y, rw, rh);
      ctx.strokeStyle = r.visited ? 'rgba(255,255,255,.15)' : r.type === 'boss' ? '#a02a34' : '#5a5466'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, rw - 1, rh - 1);
      ctx.font = '8px Galmuri7'; ctx.fillStyle = r.visited ? '#f0e8d8' : r.type === 'boss' ? '#ff8080' : '#6a6478';
      ctx.fillText(r.visited || r.type === 'boss' ? ROOM_TAG[r.type] : '?', x + rw / 2, y + rh / 2 + 3);
      if (r.visited && r.tele) { ctx.fillStyle = r.cleared ? '#9fd2ff' : '#4a4560'; ctx.fillRect(x + rw - 6, y + 2, 4, 4); }
      if (r.visited && r.chest && !r.chest.opened) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(x + 2, y + 2, 4, 4); }
      if (r.type === 'elite' && r.cleared) { ctx.fillStyle = '#ffd34d'; ctx.fillText('✓', x + rw - 6, y + rh - 4); }
      if (r === D.cur) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x - 1, y - 1, rw + 2, rh + 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + rw / 2 - 2, y - 7, 4, 4); }
      if (r === G.mapSel) { ctx.strokeStyle = Math.floor(time * 5) % 2 ? '#9fd2ff' : '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x - 3, y - 3, rw + 6, rh + 6); }
    }
    ctx.font = '8px Galmuri7'; ctx.fillStyle = '#8a8496';
    ctx.fillText(L.length ? '방향키·WASD 텔레포터 선택 · ENTER/클릭 순간이동 · TAB 닫기' : '방을 클리어하면 그 방의 텔레포터가 켜진다 · TAB 닫기', VW / 2, VH - 26);
    ctx.fillStyle = '#9fd2ff'; ctx.fillRect(VW / 2 - 150, VH - 44, 4, 4); ctx.fillStyle = '#8a8496'; ctx.textAlign = 'left'; ctx.fillText('텔레포터', VW / 2 - 143, VH - 40);
    ctx.fillStyle = '#ffd34d'; ctx.fillRect(VW / 2 - 80, VH - 44, 4, 4); ctx.fillStyle = '#8a8496'; ctx.fillText('열지 않은 상자', VW / 2 - 73, VH - 40);
    ctx.fillStyle = '#a02a34'; ctx.fillRect(VW / 2 + 10, VH - 44, 4, 4); ctx.fillStyle = '#8a8496'; ctx.fillText('보스', VW / 2 + 17, VH - 40);
    ctx.fillStyle = '#5a5466'; ctx.fillRect(VW / 2 + 50, VH - 44, 4, 4); ctx.fillStyle = '#8a8496'; ctx.fillText('? 가 보지 않은 방', VW / 2 + 57, VH - 40);
    ctx.textAlign = 'left';
  }
  function drawTransition() {
    const tr = G && G.trans; if (!tr) return;
    const a = tr.phase === 'out' ? tr.t / tr.dur : 1 - tr.t / tr.dur;
    ctx.fillStyle = `rgba(0,0,0,${clamp(a, 0, 1)})`; ctx.fillRect(0, 0, VW, VH);
  }

  function startPhase(p) {
    window.AudioSys.setMood(p === 11 ? 'boss' : p === 5 ? 'rest' : p === 10 ? 'survive' : 'field', true);
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
        if (p === 11) { if (G.stage === 1) spawnSlimeKing(); else spawnBoss(); }
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
      ghoul: { hp: 60, atk: 10, def: 20, spd: 46, r: 7, kb: 1 },
      dog: { hp: 42, atk: 12, def: 10, spd: 70, r: 7, kb: 1 },
      butcher: { hp: 380, atk: 22, def: 60, spd: 34, r: 12, kb: 0.25, grogiMax: 60 },
      ghost: { hp: 160, atk: 14, def: 40, spd: 50, r: 8, kb: 0.6 },
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
    }[type];
    const kind = type === 'hob' ? 'hob' : null;
    if (type === 'hob') type = 'butcher';
    const SM = STG(); sc.hp *= SM.hpMul; sc.atk *= SM.atkMul;
    return {
      type, kind, x, y, z: 0, squash: 0, r: base.r, hp: base.hp * sc.hp, maxHp: base.hp * sc.hp, atk: base.atk * sc.atk, def: base.def, spd: base.spd, kbRes: base.kb,
      state: 'chase', t: 0, cd: rand(0.4, 1.2), vx: 0, vy: 0, flash: 0, dead: false, face: 1, lockAng: 0, hitPlayer: false,
      grogiMax: base.grogiMax || 0, grogi: 0, grogiT: 0, pat: 0, walk: rand(0, 6), lean: 0,
      blade: base.blade || null, bladeAng: 120 * DEG, bladeTarget: 120 * DEG, trail: [], sw: null, rise: 0.35,
    };
  }
  function cancelTele(owner) { G.tele = G.tele.filter(t => t.owner !== owner); G.fx = G.fx.filter(f => !(f.kind === 'lob' && f.owner === owner)); }
  function alertMark(e, h, big) { G.fx.push({ kind: 'alert', o: e, h, s: big ? 3 : 2, t: 0.5, max: 0.5 }); }
  const restAng = e => (e.face > 0 ? 125 : 55) * DEG;

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
    if (e.haste > 0) { e.haste -= dt; if (Math.random() < dt * 8) G.parts.push({ x: e.x + rand(-5, 5), y: e.y - rand(20, 30), vx: 0, vy: -20, t: 0.3, c: '#ff6040', g: 0, glow: true }); }
    if (e.grogiT > 0) { e.grogiT -= dt; e.bladeTarget = 90 * DEG; if (e.grogiT <= 0) e.state = 'chase'; return; }
    const d = dist(e, P), a = angTo(e, P);
    e.t -= dt; e.cd -= dt;
    const moveTo = (ang, spd) => { if (e.haste > 0) spd *= 1.5; if (e.state === 'chase' && d > 130 && Math.abs(angDiff(ang, a)) < 0.6) spd *= 1.3; ang = steer(e, ang); e.x += Math.cos(ang) * spd * dt; e.y += Math.sin(ang) * spd * dt; e.walk += dt * spd / 7; if (Math.abs(Math.cos(ang)) > 0.2) e.face = Math.cos(ang) > 0 ? 1 : -1; };
    if (e.state === 'chase' && e.blade && !e.sw) e.bladeTarget = restAng(e);
    if (e.state === 'stun') { if (e.t <= 0) e.state = 'chase'; return; }
    if (e.state === 'recover') { if (e.t <= 0) e.state = 'chase'; return; }
    if (e.state === 'hold') {
      if (e.t <= 0) {
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

    if (e.type === 'slime' || e.type === 'bigslime') updateSlime(e, dt, d, a);
    else if (e.type === 'toxslime') updateToxSlime(e, dt, d, a);
    else if (e.type === 'gbrute') updateBrute(e, dt, d, a, moveTo);
    else if (e.type === 'boar') updateBoar(e, dt, d, a, moveTo);
    else if (e.type === 'crow') updateCrow(e, dt, d, a);
    else if (e.type === 'mother') updateMother(e, dt, d, a, moveTo);
    else if (e.type === 'ghoul' || e.type === 'ghost' || e.type === 'goblin') {
      if (e.state === 'chase') {
        if (d > 22) moveTo(a, e.spd);
        else if (e.cd <= 0) {
          // 바닥 표시 없이: 멈춰서 팔을 치켜들고 잠시 버틴 뒤 내려친다
          e.state = 'hold'; e.t = e.type === 'ghost' ? 0.7 : e.type === 'goblin' ? 0.55 : 0.6; e.holdMax = e.t; e.holdAng = a;
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
        if (e.t <= 0) { e.state = 'recover'; e.t = 0.9; e.cd = rand(1.4, 2.2); }
      }
    } else if (e.type === 'butcher') {
      if (e.state === 'dash') {
        const sp = e.enraged ? 400 : 360;
        e.x += Math.cos(e.lockAng) * sp * dt; e.y += Math.sin(e.lockAng) * sp * dt;
        G.fx.push({ kind: 'ghost', x: e.x, y: e.y, face: e.face, rot: 0.2 * e.face, t: 0.22, max: 0.22, map: e.kind === 'hob' ? 'butcher' : 'abom', pal: 'shadeB', sc: 2, glowy: true });
        if (Math.random() < 0.8) dust(e.x, e.y, 1);
        if (!e.hitPlayer && dist(e, P) < e.r + P.r + 4) { e.hitPlayer = true; hurtPlayer(e.atk * 1.1, e); }
        if (e.t <= 0 || e.x < A.x0 + e.r + 1 || e.x > A.x1 - e.r - 1 || e.y < A.y0 + e.r + 1 || e.y > A.y1 - e.r - 1) {
          e.state = 'recover'; e.t = 1.0; e.cd = rand(1.0, 1.6);
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
              if (bow) sfx('swing'); else { burst(e.x, e.y - 22, '#ff3040', 8); sfx('warn'); G.fx.push({ kind: 'ring', x: e.x, y: e.y - 22, r: 4, t: 0.25, max: 0.25, c: '#ff5060', grow: 90 }); }
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
    else if (e.state === 'wind' && e.pat === 0) { ta = f > 0 ? -2.5 : -0.64; tb = hang - 0.7 * f; }
    else if (e.state === 'wind' && e.pat === 1) { ta = -Math.PI / 2 + 0.3 * f; tb = -Math.PI / 2 - 0.3 * f; }
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
      pr.x += Math.cos(pr.ang) * pr.sp * dt; pr.y += Math.sin(pr.ang) * pr.sp * dt; pr.t -= dt;
      const ec = pr.kind === 'acid' ? ['#7ac843', '#b8f080'] : pr.kind === 'bile' ? ['#9ae050', '#d8f0a0'] : pr.kind === 'rock' ? ['#5b5560', '#3a3540'] : pr.kind === 'arrow' ? ['#c8ccd4', '#8a6a48'] : pr.kind === 'quill' ? ['#e0d8c0', '#8a7a60'] : ['#ff3040', '#ff9080'];
      if (Math.random() < (pr.kind === 'rock' || pr.kind === 'arrow' || pr.kind === 'quill' ? 0.15 : 0.6)) G.parts.push({ x: pr.x + rand(-2, 2), y: pr.y - 10 + rand(-2, 2), vx: 0, vy: -12, t: 0.3, c: pick(ec), g: 0, glow: !['rock', 'arrow', 'quill'].includes(pr.kind) });
      if (!P.dead && !pr.passed && Math.hypot(pr.x - P.x, pr.y - P.y) < pr.r + P.r) {
        if (P.iframe > 0) { hurtPlayer(pr.dmg, null); pr.passed = true; }
        else { const hp0 = P.hp; hurtPlayer(pr.dmg, null); if (pr.poison && P.hp < hp0) poisonPlayer(3, pr.dmg * 0.3); pr.t = 0; burst(pr.x, pr.y - 10, ec[0], 10); G.fx.push({ kind: 'ring', x: pr.x, y: pr.y - 10, r: 4, t: 0.25, max: 0.25, c: ec[1], grow: 90 }); }
      }
      if (pr.x < A.x0 || pr.x > A.x1 || pr.y < A.y0 || pr.y > A.y1 || (pr.kind !== 'acid' && pr.kind !== 'bile' && solidAt(pr.x, pr.y))) { pr.t = 0; burst(pr.x, pr.y - 10, ec[0], 6); }
      if (pr.t <= 0 && pr.kind === 'acid') splat(pr.x, pr.y, 6, '60,120,30');
    }
    G.eproj = G.eproj.filter(pr => pr.t > 0);
  }

  // ---------------------------------------------------------------- 보스: 타락 기사단장 발도르
  function spawnBoss() {
    const P0 = G.player, b = makeEnemy('ghoul', clamp(P0.x, A.x0 + 60, A.x1 - 60), clamp(P0.y - 170, A.y0 + 40, A.y1 - 40));
    Object.assign(b, { type: 'boss', r: 16, hp: 3200 * STG().hpMul, maxHp: 3200 * STG().hpMul, atk: 26 * STG().atkMul, def: 80, spd: 52, kbRes: 0, grogiMax: 100,
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
        b.summonT = 26;
        for (const off of [-1, 1]) {
          const pt = { x: clamp(b.x + off * 70, A.x0 + 30, A.x1 - 30), y: clamp(b.y + 20, A.y0 + 30, A.y1 - 30) };
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

    if (b.state === 'cast') { b.t -= dt; if (b.t <= 0) { b.state = 'idle'; b.cd = 0.8; } return; }
    if (b.state === 'recover') { b.t -= dt; if (b.t <= 0) { b.state = 'idle'; b.cd = b.stage === 3 ? 0.35 : 0.6; } return; }
    if (b.state === 'dash') {
      const sp = 430;
      b.bladeTarget = b.lockAng; b.bladeAng = b.lockAng;
      b.x += Math.cos(b.lockAng) * sp * dt; b.y += Math.sin(b.lockAng) * sp * dt; b.dashLeft -= sp * dt;
      if (Math.random() < 0.8) dust(b.x, b.y, 1);
      G.fx.push({ kind: 'ghost', x: b.x, y: b.y, face: b.face, rot: 0.25 * b.face, t: 0.28, max: 0.28, map: 'boss', pal: 'shade', sc: 3, glowy: true });
      for (let i = 0; i < 2; i++) { dg.fillStyle = `rgba(40,10,50,${rand(0.3, 0.6)})`; dg.fillRect(Math.round(b.x + rand(-6, 6)), Math.round(b.y + rand(-3, 3)), randi(2, 4), 2); }
      G.parts.push({ x: b.x + rand(-8, 8), y: b.y - rand(0, 6), vx: -Math.cos(b.lockAng) * 60, vy: -30, t: 0.4, c: pick(['#b45cff', '#5a1f78']), g: 0, glow: true });
      if (!b.hitPlayer && dist(b, P) < b.r + P.r + 6) { b.hitPlayer = true; hurtPlayer(b.atk * 1.15, b); }
      if (b.dashLeft <= 0 || b.x < A.x0 + b.r || b.x > A.x1 - b.r || b.y < A.y0 + b.r || b.y > A.y1 - b.r) {
        b.state = 'recover'; b.t = 1.0 * recov; addShake(8, b.lockAng); dust(b.x, b.y, 20); debris(b.x, b.y, 18); crack(b.x, b.y); sfx('blast');
        G.fx.push({ kind: 'ring', x: b.x, y: b.y, r: 10, t: 0.4, max: 0.4, c: '#b45cff', grow: 260 });
        G.fx.push({ kind: 'arcwave', x: b.x, y: b.y - 6, ang: b.lockAng, arc: 140 * DEG, r0: 10, r1: 80, t: 0.3, max: 0.3, c: '190,90,255' });
      }
      return;
    }
    if (b.state === 'triple') {
      b.t -= dt;
      if (b.t <= 0) {
        if (b.step >= 3) { b.state = 'recover'; b.t = 0.9 * recov; return; }
        b.step++;
        const aa = angTo(b, P);
        b.face = Math.cos(aa) > 0 ? 1 : -1;
        const side = (b.step % 2 ? 1 : -1) * b.face, last = b.step === 3;
        b.bladeTarget = aa - side * 115 * DEG; b.lean = -0.18 * b.face;
        if (b.step === 1) alertMark(b, 78, true);
        sfx('warn');
        const dur = last ? 0.95 : 0.8;
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
        b.t = dur + 0.24;
      }
      return;
    }
    // idle
    b.bladeTarget = restAng(b);
    if (d > 64) { b.x += Math.cos(a) * b.spd * dt; b.y += Math.sin(a) * b.spd * dt; b.walk += dt * 3.5; }
    b.cd -= dt;
    if (b.cd > 0) return;
    const pats = ['triple', 'charge'];
    if (b.stage >= 2) pats.push('mark');
    let pat = pats[b.nextPat % pats.length]; b.nextPat += randi(1, 2);
    if (pat === 'triple' && d > 130) pat = 'charge';
    if (pat === 'triple') { b.state = 'triple'; b.step = 0; b.t = 0; }
    else if (pat === 'charge') {
      b.state = 'wind'; b.lockAng = a; b.bladeTarget = a + Math.PI; b.lean = -0.2 * b.face;
      alertMark(b, 78, true); sfx('warn');
      G.tele.push({ shape: 'line', x: b.x, y: b.y, ang: a, len: 300, w: 32, t: 0, dur: 1.0, owner: b, heavy: true,
        onFire: () => { b.state = 'dash'; b.dashLeft = 300; b.hitPlayer = false; sfx('whoosh'); sfx('blast'); addShake(5, a); dust(b.x, b.y, 14); } });
    } else if (pat === 'mark') {
      b.state = 'cast'; b.t = 0.6; b.bladeTarget = -90 * DEG;
      alertMark(b, 78, true); sfx('warn');
      G.fx.push({ kind: 'skybeam', x: b.x + b.face * 4, y: b.y - 60, w: 12, c: '170,80,230', t: 0.6, max: 0.6, up: true });
      G.tele.push({ shape: 'circle', x: P.x, y: P.y, r: 46, t: 0, dur: 3.0, owner: b, track: true, mark: true, heavy: true,
        onFire: tt => {
          hitShape(tt, b.atk * 1.35); addShake(10); sfx('blast'); burst(tt.x, tt.y, '#8a3fb0', 30); crack(tt.x, tt.y); debris(tt.x, tt.y, 20);
          G.fx.push({ kind: 'skybeam', x: tt.x, y: tt.y, w: 70, c: '190,90,255', t: 0.45, max: 0.45 });
          G.fx.push({ kind: 'ring', x: tt.x, y: tt.y, r: 10, t: 0.5, max: 0.5, c: '#d9a8ff', grow: 220 });
          flashT = 0.1; flashColor = '#b45cff';
        } });
    }
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
    if (P.miracleT > 0 || P.shieldT > 0) { if (!dot) G.nums.push({ x: P.x, y: P.y - 26, v: '0', t: 0.5, c: '#ffe39a', s: 1 }); return; }
    if (!unblockable && !dot && P.iframe > 0) {
      if (P.state === 'dodge' && P.dodgeT < 0.16 && !P.perfectUsed) perfectDodge();
      return;
    }
    if (!dot && P.inv > 0 && !unblockable) return;
    const s = G.stats;
    let dmg = raw * (1 - s.def / (s.def + 500)) * (P.awakenT > 0 ? 0.7 : 1) * (P.state === 'storm' || P.state === 'cast' || P.state === 'aim' ? 0.5 : 1);
    dmg = Math.max(1, Math.round(dmg));
    P.hp -= dmg;
    G.nums.push({ x: P.x, y: P.y - 26, v: String(dmg), t: 0.8, c: '#ff5a4f', s: 1 });
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
      G.nums.push({ x: e.x, y: e.y - 60, v: '0', t: 0.5, c: '#9cc1ea', s: 1 });
      e.flash = 0.06; sfx('block');
      sparks(e.x, e.y - 20, o.ang || 0, '#9cc1ea', 4);
      return;
    }
    const crit = !o.dot && (P.critNext || Math.random() < s.crit);
    if (P.critNext && !o.dot) P.critNext = false;
    let dmg = s.atk * coef * (1 - e.def / (e.def + 500)) * (crit ? s.critDmg : 1) * (e.grogiT > 0 ? 1.5 : 1) * (G.frenzyT > 0 ? 1.3 : 1) * (CL().dmgMul || 1);
    dmg = Math.max(1, Math.round(dmg));
    e.hp -= dmg; e.flash = o.dot ? 0.06 : 0.12;
    const killing = e.hp <= 0, small = e.type !== 'boss' && !isElite(e);
    const top = e.type === 'boss' ? 62 : isElite(e) ? 52 : 36;
    G.nums.push({ x: e.x + rand(-5, 5), y: e.y - top, v: String(dmg), t: crit ? 0.95 : 0.7, c: o.dot ? '#ffa050' : crit ? '#ffd34d' : '#ffffff', s: o.dot ? 1 : crit ? 3 : 2,
      pop: o.dot ? 0 : crit ? 0.2 : 0.12, vx: o.dot ? 0 : Math.cos(o.ang || 0) * rand(25, 45) + rand(-12, 12), vy: o.dot ? 0 : crit ? -70 : -40 });
    const hy = e.y - (e.type === 'boss' ? 26 : isElite(e) ? 20 : 12);
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
      hitstop = Math.max(hitstop, Math.min(0.2, st));
      addShake((o.heavy ? 4.5 : 2.5) + (crit ? 2 : 0) + (killing ? 1.5 : 0), o.ang);
      zoomK = Math.max(zoomK, o.heavy ? 0.022 : crit ? 0.018 : 0.007);
    }
    P.gauge = Math.min(100, P.gauge + (o.gauge == null ? 4 : o.gauge) * s.gaugeRate);
    if (!o.dot) { sfx(o.heavy ? 'heavy' : 'hit', rand(0.88, 1.14)); if (crit) sfx('crit', rand(0.95, 1.08)); }
    const kb = (o.kb || 0) * e.kbRes * (o.kb && o.kb < 100 ? 1.35 : 1);
    if (kb > 0) { e.vx += Math.cos(o.ang) * kb; e.vy += Math.sin(o.ang) * kb; }
    if (o.stagger && ['ghoul', 'dog', 'ghost', 'cultist', 'goblin', 'garcher', 'slime', 'bigslime', 'toxslime', 'crow'].includes(e.type) && e.state !== 'dash') {
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
    const big = e.type === 'boss' ? 3 : isElite(e) ? 2 : 1;
    for (let i = 0; i < 16 * big; i++) G.parts.push({ x: e.x + rand(-6, 6) * big, y: e.y - rand(0, 26) * big, vx: rand(-14, 14), vy: rand(-40, -10), t: rand(0.5, 1.1), c: pick(['#3a3540', '#5b5560', '#1e1b22', '#7a2a1c']), g: -10 });
    burst(e.x, e.y - 8, bloodOf(e), 8 * big);
    if (e.type !== 'ghost') splat(e.x, e.y, 18 * big, splatOf(e));
    if (e.type === 'bigslime' && !silent) for (const s of [-1, 1]) { const m = makeEnemy('slime', clamp(e.x + s * 12, A.x0 + 10, A.x1 - 10), e.y); m.vx = s * 120; m.cd = 0.8; m.rise = 0; G.enemies.push(m); }
    if (silent) return;
    G.kills++;
    sfx('kill'); sfx('crunch', rand(0.85, 1.15));
    // 쓰러진 적은 맞은 방향으로 튕겨 날아가며 사라진다
    if (e.type !== 'boss' && e.type !== 'bigslime' && e.type !== 'bloat') {
      const ka = e.lastAng != null ? e.lastAng : angTo(G.player, e), el = isElite(e), sp = el ? rand(70, 100) : rand(170, 230);
      if (!G.corpses) G.corpses = [];
      G.corpses.push({ e, t: el ? 0.75 : 0.55, max: el ? 0.75 : 0.55, vx: Math.cos(ka) * sp, vy: Math.sin(ka) * sp * 0.6, z: 0, vz: el ? 120 : 170, rot: 0, vr: (Math.cos(ka) >= 0 ? 1 : -1) * (el ? 3 : rand(9, 13)), bounced: false });
    }
    // 웨이브의 마지막 한 마리: 짧은 슬로모션 마무리
    if (e.type !== 'boss' && !G.enemies.some(x => !x.dead) && G.spawning <= 0 && !G.tele.some(t => t.shape === 'spawn')) {
      slowmo = Math.max(slowmo, 0.5); zoomK = Math.max(zoomK, 0.05); hitstop = Math.max(hitstop, 0.12);
      flashT = Math.max(flashT, 0.06); flashColor = '#fff4e0'; sfx('finisher');
      G.fx.push({ kind: 'ring', x: e.x, y: e.y - 10, r: 8, t: 0.4, max: 0.4, c: '#fff0d0', grow: 420 });
    }
    const gold = e.type === 'boss' ? STG().bossGold : isElite(e) ? 40 : randi(3, 7);
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
    if (P.reload > 0) { P.reload -= dt; if (P.reload <= 0) { P.reload = 0; sfx('reload'); } }
    P.recoil = Math.max(0, (P.recoil || 0) - dt * 7);
    P.shieldT = Math.max(0, P.shieldT - dt); P.miracleT = Math.max(0, P.miracleT - dt);
    updatePoison(dt);
    if (Math.abs(Math.cos(P.ang)) > 0.15 && P.state !== 'charge' && P.state !== 'attack' && P.state !== 'shadow' && P.state !== 'storm' && P.state !== 'butt') P.face = Math.cos(P.ang) > 0 ? 1 : -1;

    if (pressed['j'] || pressed['k'] || pressed['e'] || pressed['l'] || (RANGED() && keys['j'])) { const te = touchAim(); if (te) P.ang = Math.atan2(te.y - (isElite(te) || te.type === 'boss' ? 20 : 8) - (P.y - 10), te.x - P.x); }
    const wantAtk = take('j'), wantSkill = take('k'), wantAwk = take('l') || take('e'), wantDodge = take(' ');
    const holdAtk = RANGED() && (keys['j'] || mouse.down);
    const free = P.state === 'idle' || P.state === 'attack' || P.state === 'rattack';

    if (wantDodge && P.stam > 0 && (free || P.state === 'butt' || P.state === 'pray' || (P.state === 'skill' && P.t > SKILL.wind + SKILL.swing))) {
      P.stam--; P.state = 'dodge'; P.t = 0; P.dodgeT = 0; P.iframe = 0.22; P.perfectUsed = false; P.combo = 0; P.queued = false; P.blinkEnd = false;
      const da = ml ? Math.atan2(my, mx) : P.ang;
      P.dvx = Math.cos(da); P.dvy = Math.sin(da);
      if (Math.abs(P.dvx) > 0.2) P.face = P.dvx > 0 ? 1 : -1;
      P.blinkFrom = { x: P.x, y: P.y };
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
        P.chargeCd[slot] = CL().skillCd * (1 - s.cdr);
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
      else if (wantAtk) startAttack(P.comboWin > 0 ? P.combo : 0);
      else if (P.comboWin > 0) P.comboWin -= dt;
      const fast = isCalm(), sp = fast ? 2 : 1;
      P.x += mx * s.spd * sp * dt; P.y += my * s.spd * sp * dt;
      if (ml) { P.walk += dt * 10 * sp; if (fast) runFx(dt, mx, my); else if (Math.random() < dt * 6) dust(P.x - mx * 4, P.y, 1); }
      if (G.cls === 'mage') P.blade = lerpAng(P.blade, (P.face > 0 ? -70 : -110) * DEG, dt * 10); // 지팡이를 세워 든다
      else if (G.cls === 'gunner') P.blade = lerpAng(P.blade, P.ang, dt * 18); // 총구는 늘 조준 방향
      else if (G.cls === 'priest') P.blade = lerpAng(P.blade, (P.face > 0 ? 120 : 60) * DEG, dt * 10);
      else if (G.cls === 'ranger') { // 쌍검: 앞손은 아래로, 뒷손은 뒤로
        P.blade = lerpAng(P.blade, (P.face > 0 ? 50 : 130) * DEG, dt * 12);
        P.blade2 = lerpAng(P.blade2, (P.face > 0 ? 65 : 115) * DEG, dt * 12);
      } else // 대검을 뒤로 끌며 든다
        P.blade = lerpAng(P.blade, (P.face > 0 ? (ml ? 160 : 140) : (ml ? 20 : 40)) * DEG, dt * 10);
    } else if (P.state === 'attack') {
      updateSwing(dt, wantAtk, mx, my);
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
      const ey = e.y - (e.type === 'boss' ? 18 : isElite(e) ? 12 : 6);
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
      pr.x += Math.cos(pr.ang) * pr.sp * dt; pr.y += Math.sin(pr.ang) * pr.sp * dt; pr.t -= dt;
      if (Math.random() < 0.8) G.parts.push({ x: pr.x + rand(-6, 6), y: pr.y + rand(-14, 14), vx: Math.cos(pr.ang) * 40, vy: Math.sin(pr.ang) * 40, t: 0.25, c: pick(['#9fd2ff', '#ffffff']), g: 0, glow: true });
      for (const e of G.enemies) {
        if (e.dead || pr.hit.has(e)) continue;
        if (Math.hypot(e.x - pr.x, e.y - 8 - pr.y) < pr.r + e.r) { pr.hit.add(e); damageEnemy(e, 1.3, { ang: pr.ang, grogi: 8, kb: 150, gauge: 3, stagger: 0.4 }); }
      }
      if (pr.x < A.x0 - 20 || pr.x > A.x1 + 20 || pr.y < A.y0 - 20 || pr.y > A.y1 + 20 || solidAt(pr.x, pr.y + 8)) { pr.t = Math.min(pr.t, 0.05); hitCrack(pr.x, pr.y + 8, 1, 34); }
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
  const heroHand = () => { const P = G.player; return { x: P.x + P.face * 3 - Math.cos(P.blade) * (P.recoil || 0) * 4, y: P.y - 8 - Math.sin(P.blade) * (P.recoil || 0) * 4 }; };
  function staffTip() { const P = G.player, h = heroHand(); return { x: h.x + Math.cos(P.blade) * 30, y: h.y + Math.sin(P.blade) * 30 }; }
  function muzzle() { const P = G.player, h = heroHand(); return { x: h.x + Math.cos(P.blade) * 37, y: h.y - 2 + Math.sin(P.blade) * 37 }; }
  // 직선 위의 적 (along 순 정렬)
  function rayHits(x, y, ang, len, w) {
    const ux = Math.cos(ang), uy = Math.sin(ang), out = [];
    for (const e of G.enemies) {
      if (e.dead) continue;
      const ey = e.y - (e.type === 'boss' ? 18 : isElite(e) ? 12 : 8);
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
      return fireMusket();
    }
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
      P.blade = lerpAng(P.blade, P.ang, dt * 20);
      if (P.t >= 0.16) P.state = 'idle';
    }
  }

  // ---------- 마법사
  function castBolt() {
    const P = G.player; P.boltN = (P.boltN || 0) + 1;
    const big = P.boltN % 3 === 0, tp = staffTip();
    G.mproj.push({ kind: 'bolt', x: tp.x, y: tp.y, ang: P.ang, sp: big ? 360 : 420, t: 0.85, r: big ? 7 : 4, coef: big ? 1.4 : 0.78, big, hist: [] });
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
        sfx('blast'); sfx('heavy'); addShake(14); flashT = 0.2; flashColor = '#fff0d0'; hitstop = Math.max(hitstop, 0.12);
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
      pr.x += Math.cos(pr.ang) * pr.sp * dt; pr.y += Math.sin(pr.ang) * pr.sp * dt; pr.t -= dt;
      const fire = pr.kind === 'fireball';
      if (Math.random() < (fire ? 1 : 0.6)) G.parts.push({ x: pr.x + rand(-2, 2), y: pr.y + rand(-2, 2), vx: -Math.cos(pr.ang) * 30 + rand(-15, 15), vy: -Math.sin(pr.ang) * 30 + rand(-25, 0), t: rand(0.2, 0.4), c: fire ? pick(['#ffb060', '#ff6a2a', '#ffe0a0']) : pick(['#c890ff', '#f0d8ff', '#8a5aa8']), g: 0, glow: true });
      let hitE = null;
      for (const e of G.enemies) if (!e.dead && Math.hypot(e.x - pr.x, e.y - 8 - pr.y) < pr.r + e.r) { hitE = e; break; }
      const wall = pr.x < A.x0 || pr.x > A.x1 || pr.y < A.y0 - 20 || pr.y > A.y1 || solidAt(pr.x, pr.y + 8);
      if (wall) hitCrack(pr.x, pr.y + 8, fire ? 3 : 1, fire ? 60 : 34);
      if (hitE || wall || pr.t <= 0) {
        if (!fire) {
          if (hitE) damageEnemy(hitE, pr.coef, { ang: pr.ang, grogi: pr.big ? 5 : 2, kb: pr.big ? 90 : 30, gauge: pr.big ? 4 : 2, stagger: pr.big ? 0.3 : 0.12 });
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
    for (const e of G.enemies) if (!e.dead && !G.player.hitSet.has(e) && Math.hypot(e.x - x, e.y - y) < 56 + e.r) damageEnemy(e, 0.8, { ang: Math.atan2(e.y - y, e.x - x), grogi: 6, kb: 120, stagger: 0.4, gauge: 2 });
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
  function fireMusket() {
    const P = G.player;
    P.state = 'rattack'; P.t = 0; P.blade = P.ang; P.atkAng = P.ang; P.reload = 0.8; P.recoil = 1;
    const m = muzzle(), hits = rayHits(m.x, m.y, P.ang, 460, 5);
    let L = rayEnd(m.x, m.y, P.ang, 460);
    if (!hits.length || hits[0].along > L) hitCrack(m.x + Math.cos(P.ang) * L, m.y + Math.sin(P.ang) * L + 10, 1, 34);
    if (hits.length && hits[0].along <= L) { L = Math.min(L, hits[0].along); damageEnemy(hits[0].e, 2.4, { ang: P.ang, grogi: 9, kb: 120, gauge: 5, stagger: 0.4, heavy: true }); }
    gunFx(m, P.ang, L, 1);
    P.x -= Math.cos(P.ang) * 5; P.y -= Math.sin(P.ang) * 5;
    sfx('shot'); addShake(4, P.ang + Math.PI);
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
      sweepHits(P.atkAng, P.sign, P.prevRel, P.swingRel, 36, P.hitSet, { coef: 0.9, grogi: 6, kb: 230, stagger: 0.55, gauge: 4, heavy: true });
      P.trail.push({ a: P.atkAng + P.sign * P.swingRel, t: 0.11 });
    }
    // 개머리판으로 때리면 그 사이 재장전이 끝난다
    if (P.hitSet.size && !P.buttReload) { P.buttReload = true; if (P.reload > 0) { P.reload = 0; sfx('reload'); } }
    if (P.t >= W + S + R) P.state = 'idle';
  }
  function fireShotgun() {
    const P = G.player;
    P.state = 'rattack'; P.t = 0; P.blade = P.ang; P.recoil = 1.8; P.reload = 0;
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
    P.state = 'rattack'; P.t = 0; P.recoil = 2.5; P.reload = 0;
    sfx('snipe'); addShake(12, ang + Math.PI); flashT = 0.12; flashColor = '#fff0d0'; slowmo = Math.max(slowmo, 0.35); hitstop = Math.max(hitstop, 0.08);
  }
  // 거너 조준점: 총구에서 탄이 닿는 곳까지 점선, 끝에 조준경 (적을 겨누면 붉게)
  function drawGunAim() {
    const P = G.player; if (G.cls !== 'gunner' || P.dead || P.state === 'aim' || P.state === 'butt') return;
    const m = muzzle(), ang = P.blade, hits = rayHits(m.x, m.y, ang, 460, 5), L = hits.length ? hits[0].along : rayEnd(m.x, m.y, ang, 460);
    const ready = P.reload <= 0, on = hits.length > 0, col = on ? '255,80,60' : '240,230,210';
    ctx.save();
    for (let d = 10; d < L - 8; d += 8) { ctx.fillStyle = `rgba(${col},${(ready ? 0.7 : 0.3) * (1 - d / 600)})`; ctx.fillRect(Math.round(m.x + Math.cos(ang) * d), Math.round(m.y + Math.sin(ang) * d), 2, 2); }
    const tx = Math.round(m.x + Math.cos(ang) * L), ty = Math.round(m.y + Math.sin(ang) * L), r = ready ? 6 : 5 + 4 * (P.reload / 0.8);
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
        const ey = e.y - (e.type === 'boss' ? 18 : isElite(e) ? 12 : 6);
        const d = Math.hypot(e.x - px, ey - py);
        if (d > st.reach + e.r) continue;
        const tol = Math.atan(e.r / Math.max(d, 1)) + 0.05;
        const ra = P.sign * angDiff(Math.atan2(ey - py, e.x - px), P.atkAng);
        let hit = false;
        for (const k of [-1, 0, 1]) { const r = ra + k * TAU; if (r >= lo - tol && r <= hi + tol) hit = true; }
        if (d < 14) hit = true;
        if (hit) {
          P.hitSet.add(e);
          damageEnemy(e, st.coef, { grogi: st.grogi, kb: st.kb, ang: angTo(P, e), heavy: st.heavy, stagger: st.stagger, gauge: st.gauge });
        }
      }
      hitCrack(P.x + Math.cos(P.atkAng) * 30, P.y + Math.sin(P.atkAng) * 22, st.heavy ? 3 : 1, st.reach + 14);
      if (!ranger || P.combo !== 1) P.trail.push({ a: P.blade, t: 0.11 });
      if (ranger && P.combo >= 1) P.trail2.push({ a: P.blade2, t: 0.11 });
      if (st.slam && P.t >= tSwingEnd - dt && !P.slamDone) { P.slamDone = true; holySlam(P.x + Math.cos(P.atkAng) * 26, P.y + Math.sin(P.atkAng) * 18); }
      if (P.combo === 2 && s.fx.has('ember') && P.t >= tSwingEnd - dt && !P.emberDone) {
        P.emberDone = true;
        G.fx.push({ kind: 'ring', x: P.x, y: P.y - 8, r: 20, t: 0.3, max: 0.3, c: '#ffaa50', grow: 240 });
        for (const e of G.enemies) if (!e.dead && dist(e, P) < 110 && !P.hitSet.has(e)) damageEnemy(e, 1.0, { grogi: 6, gauge: 2, ang: angTo(P, e) });
      }
    } else {
      P.x += mx * s.spd * 0.25 * dt; P.y += my * s.spd * 0.25 * dt;
    }
    // 후딜 중간부터 다음 타로 연결
    if (P.queued && P.combo < 2 && P.t >= tSwingEnd + st.rec * 0.35) { P.emberDone = false; startAttack(P.combo + 1); return; }
    if (P.t >= total) { P.emberDone = false; P.state = 'idle'; P.comboWin = P.combo < 2 ? 0.4 : 0; P.combo = P.combo < 2 ? P.combo + 1 : 0; }
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
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 2.5);
    e.flash = c.max - c.t < 0.08 ? 1 : 0;
    ctx.translate(0, -c.z);
    ctx.translate(e.x, oy - 10); ctx.rotate(c.rot); ctx.scale(1 + (1 - k) * 0.15, 1 - (1 - k) * 0.35); ctx.translate(-e.x, -(oy - 10));
    drawEnemy(e);
    ctx.restore();
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
  };
  // 잡몹 한 마리당 소모품은 최대 1개, 장비는 따로 굴린다
  const LOOT_TABLE = [['meat', 0.084], ['orb', 0.049], ['pouch', 0.0315], ['vial', 0.0175]];
  function spawnLoot(type, x, y, it) {
    const a = rand(0, TAU), sp = rand(30, 70);
    G.loot.push({ type, it, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, z: 6, vz: rand(110, 150), t: 0, life: 18, bob: rand(0, TAU) });
  }
  function rollLoot(e) {
    if (isElite(e)) {
      if (Math.random() < 0.7) spawnLoot('bigmeat', e.x, e.y);
      if (Math.random() < 0.7) spawnLoot(pick(['orb', 'pouch', 'vial']), e.x, e.y);
    } else {
      let r = Math.random();
      for (const [k, p] of LOOT_TABLE) { if (r < p) { spawnLoot(k, e.x, e.y); break; } r -= p; }
    }
    if (Math.random() < (isElite(e) ? 0.105 : 0.0084)) spawnLoot('gear', e.x, e.y, makeItem(G.cls));
  }
  // 물약은 HP가, 구슬은 게이지가 가득 차 있으면 줍지 않고 바닥에 남겨 둔다 (필요할 때 주우러 가기)
  function lootWanted(l) {
    const P = G.player, s = G.stats;
    if (l.type === 'meat' || l.type === 'bigmeat') return P.hp < s.hp || P.poisonT > 0;
    if (l.type === 'orb') return P.gauge < 100;
    return true;
  }
  function updateLoot(dt) {
    const P = G.player;
    for (const l of G.loot) {
      l.t += dt; l.life -= dt;
      if (l.z > 0 || l.vz > 0) { l.vz -= 420 * dt; l.z += l.vz * dt; if (l.z <= 0) { l.z = 0; l.vz = Math.abs(l.vz) > 50 ? -l.vz * 0.35 : 0; } }
      l.x += l.vx * dt; l.y += l.vy * dt; l.vx *= 0.9; l.vy *= 0.9;
      solveObs(l, 7); l.x = clamp(l.x, A.x0 + 8, A.x1 - 8); l.y = clamp(l.y, A.y0 + 8, A.y1 - 8);
      if (P.dead || l.t < 0.45 || !lootWanted(l)) continue;
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
      const v = Math.round(s.hp * (l.type === 'bigmeat' ? 0.3 : 0.15)), got = Math.min(v, s.hp - P.hp);
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
    } else if (l.type === 'vial') {
      G.frenzyT = 8; sfx('frenzy'); flashT = 0.06; flashColor = '#ff3040';
      G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 8, grow: 160, t: 0.35, max: 0.35, c: '#ff3040' });
      lootFeed(`${L.n} — 8초간 공격력 +30%`, L.c);
    } else if (l.type === 'gear') {
      const it = l.it, g = gradeOf(it);
      SAVE.inv.push(it); G.fieldItems.push(it);
      let equipped = false;
      if (canEquip(it, G.cls)) {
        const curId = eqOf(G.cls)[it.slot], cur = SAVE.inv.find(i => i.id === curId);
        if (!cur || itemVal(it) > itemVal(cur)) {
          eqOf(G.cls)[it.slot] = it.id; equipped = true;
          const oldHp = G.stats.hp; G.stats = calcStats(G.buffs);
          P.hp = clamp(P.hp + Math.max(0, G.stats.hp - oldHp), 1, G.stats.hp);
        }
      }
      persist(); sfx('drop');
      G.fx.push({ kind: 'ring', x: P.x, y: P.y - 10, r: 10, grow: 120, t: 0.45, max: 0.45, c: g.c });
      lootFeed(`<b style="color:${g.c}">[${g.n}] ${it.name}</b>${equipped ? ' — 즉시 장착!' : ''}`, g.c, 4200);
    }
  }
  function lootFeed(html, c, ms = 2600) {
    const box = $('lootFeed'); if (!box) return;
    const el = document.createElement('div'); el.className = 'lf'; el.style.setProperty('--c', c); el.innerHTML = html;
    box.prepend(el);
    while (box.children.length > 5) box.lastChild.remove();
    setTimeout(() => { el.style.opacity = 0; setTimeout(() => el.remove(), 450); }, ms);
  }
  function drawLoot(l) {
    const L = LOOT[l.type];
    const blink = l.life < 4 && Math.floor(l.life * 8) % 2 === 0;
    const hover = l.z + (l.vz === 0 && l.z === 0 ? 2 + Math.sin(time * 4 + l.bob) * 1.5 : 0);
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(l.x, l.y, 5, 2, 0, 0, TAU); ctx.fill();
    if (blink) return;
    if (l.type === 'gear') {
      const g = gradeOf(l.it), h = (l.it.grade === 'legend' ? 150 : l.it.grade === 'unique' ? 110 : l.it.grade === 'rare' ? 80 : 55) * Math.min(1, l.t * 2);
      const pulse = 0.7 + Math.sin(time * 5) * 0.25;
      const grd = ctx.createLinearGradient(0, l.y - h, 0, l.y);
      grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, g.c);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.45 * pulse; ctx.fillStyle = grd; ctx.fillRect(l.x - 5, l.y - h, 10, h);
      ctx.globalAlpha = 0.8; ctx.fillRect(l.x - 1, l.y - h, 2, h);
      ctx.restore();
      const pk = 'loot_' + l.it.grade;
      if (!PAL[pk]) PAL[pk] = Object.assign({}, PAL.loot, { c: g.c }); // 등급색 칼날
      drawSprite('gear', pk, 3, l.x, l.y - hover + 1, false);
      return;
    }
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
      if (canEquip(it, G.cls)) { const cur = SAVE.inv.find(i => i.id === eqOf(G.cls)[it.slot]); if (!cur || itemVal(it) > itemVal(cur)) eqOf(G.cls)[it.slot] = it.id; }
    }
  }
  // 1스테이지 클리어 → 대장간 → 2스테이지
  function stageClear() {
    if (!G || mode !== 'play') return;
    takeBossItems(); commitRunMats(); persist();
    window.AudioSys.setMood('rest', true);
    openForge('between');
  }
  function nextStage() {
    const P = G.player;
    G.stage++; G.clear = false; G.drops = []; G.loot = []; G.newItems = []; G.mproj = []; G.meteor = null; G.parts = []; G.fx = [];
    dg.clearRect(0, 0, W, H);
    G.ash = [];
    for (let i = 0; i < 70; i++) G.ash.push(G.stage === 1 ? { x: rand(0, VW), y: rand(0, VH), vx: rand(-8, 8), vy: rand(-4, 4), s: Math.random() < 0.3 ? 2 : 1, a: rand(0.3, 0.9), ff: rand(0, 6) } : { x: rand(0, VW), y: rand(0, VH), vx: rand(-6, 6), vy: rand(6, 16), s: Math.random() < 0.2 ? 2 : 1, a: rand(0.2, 0.6) });
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
    setTimeout(() => { if (G && G.clear && mode === 'play') { if (G.stage < 2) stageClear(); else showResult(true); } }, 900);
  }

  // ---------------------------------------------------------------- 보상
  function bossDefeated(b) {
    window.AudioSys.setMood('rest', true);
    slowmo = 1.6; flashT = 0.2; flashColor = '#ffffff';
    G.vortex = null; G.tele = [];
    G.enemies.forEach(e => { if (!e.dead && e !== b) killEnemy(e, true); });
    banner(G.stage < 2 ? `STAGE ${G.stage} 클리어` : '토벌 완료', G.stage < 2 ? '보스의 전리품을 챙겼다 · 대장간으로' : '재의 왕관 파편을 회수했다');
    const n = Math.random() < 0.25 ? 2 : 1;
    G.newItems = [];
    for (let i = 0; i < n; i++) {
      const it = makeItem(G.cls);
      G.newItems.push(it);
      G.drops.push({ x: b.x + (i - (n - 1) / 2) * 34, y: b.y + 10, it, t: 0 });
    }
    if (Math.random() < 0.4) G.crystal++;
    G.clear = true;
    setTimeout(() => { if (G && G.clear) sfx('drop'); }, 900);
    setTimeout(() => { if (G && G.clear && mode === 'play') { if (G.stage < 2) stageClear(); else showResult(true); } }, 4200);
  }
  function itemCard(it, withEquip, isNew) {
    const g = gradeOf(it), sl = slotOf(it), eq = eqOf()[it.slot] === it.id, ok = canEquip(it, CUR), v = itemVal(it);
    const statTxt = it.stat === 'crit' ? `치명 확률 +${v}%` : `${sl.label} +${v}`;
    const fx = it.fx ? `<div class="fx">★ ${LEGEND_FX[it.fx].d}</div>` : '';
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
    if (win) { takeBossItems(); commitRunMats(); SAVE.clears++; }
    else wipeRunItems(); // 사망·포기: 이번 런의 장비·재료·골드를 모두 잃는다
    SAVE.best = Math.max(SAVE.best || 0, (G.stage - 1) * 11 + G.phase);
    persist();
    resultShowAll = false;
    $('resTitle').textContent = win ? '토벌 완료' : '사망';
    $('resTitle').style.color = win ? 'var(--gold-l)' : '#ff7070';
    $('resSub').textContent = win ? `STAGE 1 · 2 돌파 · 처치 수 ${G.kills} · 다음 토벌은 다시 빈손으로 시작한다` : `STAGE ${G.stage} ${G.dun && G.dun.cur ? ROOM_N[G.dun.cur.type] : ''}에서 쓰러졌다 · 장비 ${G.lostItems}개와 모든 재료·골드를 잃었다`;
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
    let tx = P.x - SAFE.cx + Math.cos(P.ang) * 24, ty = P.y - 10 - SAFE.cy + Math.sin(P.ang) * 16;
    if (G.boss && !G.boss.dead) { tx += (G.boss.x - P.x) * 0.15; ty += (G.boss.y - P.y) * 0.15; }
    { const x0 = A.x0 - 136, x1 = A.x1 + 16 - VW, y0 = A.y0 - 100, y1 = A.y1 + 88 - VH;
      tx = x1 >= x0 ? clamp(tx, x0, x1) : (x0 + x1) / 2; ty = y1 >= y0 ? clamp(ty, y0, y1) : (y0 + y1) / 2; }
    const k = snap ? 1 : Math.min(1, dt * 7);
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
  }
  function update(rdt) {
    time += rdt;
    if (G) for (const a of G.ash) { a.x += (a.vx + Math.sin(time + a.y * 0.05) * 6) * rdt; a.y += a.vy * rdt; if (a.y > VH) { a.y = -4; a.x = rand(0, VW); } if (a.y < -6) a.y = VH; if (a.x < 0) a.x += VW; if (a.x > VW) a.x -= VW; }
    if (mode === 'map' && G) { updateMap(); return; }
    if (mode !== 'play') return;
    if (take('escape')) { openPause(); return; }
    if (take('tab')) { openMap(); return; }
    if (take('h')) { G.kg = !G.kg; G.kgT = G.kg ? 999 : 0; sfx('blip'); }
    if (G.kg && G.kgT < 900) { G.kgT -= rdt; if (G.kgT <= 0) G.kg = false; }
    if (take('n') && !G.clear) debugClearRoom();
    if (take('v')) { debugStageClear(); return; }
    if (take('t')) { // 테스트: 무기 등급 순환 (커먼 → 레어 → 유니크 → 레전더리)
      const gk = ['common', 'rare', 'unique', 'legend'][(weaponTier(G.cls) + 1) % 4];
      const it = makeItem(G.cls, { grade: gk, slot: 'weapon' });
      SAVE.inv.push(it); eqOf(G.cls).weapon = it.id; G.stats = calcStats(G.buffs); persist();
      lootFeed(`<b style="color:${gradeOf(it).c}">[${gradeOf(it).n}] ${it.name}</b> 장착 (테스트)`, gradeOf(it).c); sfx('drop');
    }
    if (take('b') && !G.clear && G.dun.cur.type !== 'boss') debugToBoss();

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
    for (const e of G.enemies) if (!e.dead) { if (e.type === 'boss') { if (e.kind === 'slimeking') { updateSlimeKing(e, dt); slimeKingStage(e); } else { updateBoss(e, dt); bossStageCheck(e); } } else if (e.hitStun > 0 && e.state === 'chase') hitStunTick(e, dt); else { e.hitStun = 0; updateEnemy(e, dt); } }
    const P = G.player;
    const live = G.enemies.filter(e => !e.dead);
    for (let i = 0; i < live.length; i++) {
      const a = live[i];
      for (let j = i + 1; j < live.length; j++) {
        const b = live[j], d = dist(a, b), m = a.r + b.r;
        if (d < m && d > 0.01) { const push = (m - d) / 2, ux = (a.x - b.x) / d, uy = (a.y - b.y) / d; if (a.type !== 'boss') { a.x += ux * push; a.y += uy * push; } if (b.type !== 'boss') { b.x -= ux * push; b.y -= uy * push; } }
      }
      if (!P.dead && P.state !== 'dodge' && P.state !== 'charge') {
        const d = dist(a, P), m = a.r + P.r - 2;
        if (d < m && d > 0.01) { const ux = (P.x - a.x) / d, uy = (P.y - a.y) / d; P.x += ux * (m - d); P.y += uy * (m - d); }
      }
      if (a.type !== 'crow' && a.type !== 'boss') solveObs(a, a.r);
      a.x = clamp(a.x, A.x0 + a.r, A.x1 - a.r); a.y = clamp(a.y, A.y0 + a.r, A.y1 - a.r);
    }
    G.enemies = G.enemies.filter(e => !e.dead || e.type === 'boss');
    for (const t of G.tele) {
      t.t += dt;
      if (t.owner && !t.owner.dead && t.follow && t.t < t.dur * 0.6) { t.x = t.owner.x; t.y = t.owner.y; t.ang = angTo(t.owner, P); if (t.owner.sw == null) t.owner.bladeTarget = t.ang - ((t.owner.step % 2 ? 1 : -1) * t.owner.face) * 115 * DEG; }
      if (t.track && t.t < t.dur - 0.6) { t.x += (P.x - t.x) * Math.min(1, dt * 6); t.y += (P.y - t.y) * Math.min(1, dt * 6); }
    }
    const fired = G.tele.filter(t => t.t >= t.dur);
    G.tele = G.tele.filter(t => t.t < t.dur);
    for (const t of fired) {
      if (t.shape !== 'spawn' && t.shape !== 'line' && !t.noImpact) G.fx.push({ kind: 'impact', shape: t.shape, x: t.x, y: t.y, r: t.r, ang: t.ang, arc: t.arc, t: t.heavy ? 0.3 : 0.2, max: t.heavy ? 0.3 : 0.2, mark: t.mark });
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
  function drawTele(t) {
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
  function drawTeleGlow(t) {
    if (t.shape === 'spawn') return;
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
  function drawArm(x, y, ang, len, w, white, back, pal) {
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
  function drawZombieArm(x, y, ang, len, white, back) {
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
    const by = e.y + 2 + ya - lf, shY = by - 24 * sq * crouch;
    const fx = e.x + e.face * 9 + tr, bx = e.x - e.face * 9 + tr;
    if (e.armTrail && e.armTrail.length > 1) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawTrail(e.armTrail, fx, shY, 8, 30, '255,60,40', true); ctx.restore(); }
    const bp = e.kind === 'hob' ? 'hob' : 'abom';
    if (bp === 'abom') drawZombieArm(bx, shY, e.armB, 20, white, true); else drawArm(bx, shY, e.armB, 20, 5, white, true, bp);
    drawSprite(bp === 'hob' ? 'butcher' : 'abom', bp, 2, e.x + tr, by, e.face < 0, { white, rot: e.lean + (e.grogiT > 0 ? 0.25 * e.face : 0), alpha: al, sx, sy: sq * crouch });
    if (bp === 'abom') drawZombieArm(fx, shY, e.armA, 20, white, false); else drawArm(fx, shY, e.armA, 20, 5, white, false, bp);
    if (e.grogiT > 0) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(by - 50 + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); } }
  }
  function drawEnemy(e) {
    const flip = e.face < 0, white = e.flash > 0;
    const bob = Math.sin(e.walk) * 0.8, sq = 1 + Math.sin(e.walk * 2) * 0.03;
    const rise = e.rise > 0 ? e.rise / 0.35 : 0;
    const ya = rise * 10, al = 1 - rise * 0.8;
    const lean = e.lean + (e.state === 'stun' ? 0.2 * e.face : 0);
    if (e.type === 'slime' || e.type === 'bigslime' || e.type === 'toxslime') drawSlime(e, ya, al);
    else if (e.type === 'gbrute') drawBrute(e, ya, al);
    else if (e.type === 'boar') drawBoar(e, ya, al);
    else if (e.type === 'crow') drawCrow(e, ya, al);
    else if (e.type === 'mother') drawMother(e, ya, al);
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
    else if (e.type === 'ghoul') {
      drawShadow(e.x, e.y + 1, 9);
      if (e.state === 'hold') {
        const k = 1 - e.t / e.holdMax, tr = k > 0.6 ? rand(-0.8, 0.8) : 0;
        drawSprite('ghoulUp', 'ghoul', 2, e.x + tr, e.y + 2 + ya, flip, { white, rot: -0.12 * e.face * (0.5 + k), sy: 1 + 0.06 * k, alpha: al });
        holdGlow(e.x + e.face * 1, e.y - 26, k, '255,60,40');
      } else drawSprite('ghoul', 'ghoul', 2, e.x, e.y + 2 + bob + ya, flip, { white, rot: lean, sy: sq, alpha: al });
    }
    else if (e.type === 'dog') { drawShadow(e.x, e.y + 1, 12); drawSprite('dog', 'dog', 2, e.x, e.y + 2 + (e.state === 'dash' ? 0 : bob * 0.5) + ya, flip, { white, sy: e.state === 'wind' ? 0.85 : 1, sx: e.state === 'dash' ? 1.15 : 1, alpha: al }); }
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
      drawSprite('cultist', 'cultist', 2, e.x, e.y + 2 + bob * 0.5 + ya, flip, { white, rot: lean, alpha: al, sy: casting ? 1.06 : sq });
      if (casting) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const hx = e.x, hy = e.y - 22, rr = 3 + 7 * e.glow;
        const gr = ctx.createRadialGradient(hx, hy, 0, hx, hy, rr * 2);
        gr.addColorStop(0, 'rgba(255,230,230,.95)'); gr.addColorStop(0.4, 'rgba(255,40,60,.8)'); gr.addColorStop(1, 'rgba(255,40,60,0)');
        ctx.fillStyle = gr; ctx.fillRect(hx - rr * 2, hy - rr * 2, rr * 4, rr * 4);
        ctx.restore();
        if (Math.random() < 0.7) { const a = rand(0, TAU), r = rand(10, 18); G.parts.push({ x: e.x + Math.cos(a) * r, y: e.y - 22 + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, t: 0.2, c: '#ff4050', g: 0, glow: true }); }
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
      const sc = e.type === 'ghost' ? 2 : 3;
      const map = e.type === 'boss' ? 'boss' : e.type === 'ghost' ? 'soldier' : 'ghoul';
      const pal = e.type === 'boss' ? 'boss' : e.type === 'ghost' ? 'ghost' : 'butcher';
      const handY = e.type === 'boss' ? 30 : e.type === 'butcher' ? 24 : 14;
      const hx = e.x + e.face * (e.type === 'boss' ? 4 : 3), hy = e.y - handY;
      const bl = BLADES[e.blade];
      const behind = !e.sw && Math.sin(e.bladeAng) < -0.2 === false && Math.cos(e.bladeAng) * e.face < 0;
      drawShadow(e.x, e.y + 2, e.type === 'boss' ? 24 : e.type === 'butcher' ? 16 : 10);
      if (e.type === 'boss' && e.shield) { ctx.strokeStyle = 'rgba(156,193,234,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y - 28, 34, 38, 0, 0, TAU); ctx.stroke(); }
      if (e.type === 'boss' && !e.dead && Math.random() < 0.5) G.parts.push({ x: e.x + rand(-16, 16), y: e.y - rand(0, 48), vx: 0, vy: -24, t: 0.6, c: e.stage === 3 ? '#8a3fb0' : '#3e2b4a', g: 0 });
      if (bl && behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
      if (bl) drawTrail(e.trail, hx, hy, 10, bl.reach, e.type === 'ghost' ? '170,210,255' : e.type === 'boss' ? '190,120,240' : '230,220,210', e.type === 'boss');
      let rot = (e.grogiT > 0 ? 0.3 * e.face : e.state === 'dash' ? 0.25 * e.face : 0) + lean;
      if (e.type === 'ghost' && e.state === 'hold') { const k = 1 - e.t / e.holdMax; rot = -0.2 * e.face * (0.5 + k); }
      drawSprite(map, pal, sc, e.x, e.y + 3 + (e.grogiT > 0 ? 0 : bob) + ya - (e.lift || 0), flip, { white, rot, alpha: al * (e.type === 'ghost' ? 0.85 : 1), sy: e.grogiT > 0 ? 0.92 : sq });
      if (bl && !behind) drawBlade(bl, hx, hy, e.bladeAng, al, white);
      if (e.type === 'ghost' && e.state === 'hold') {
        const k = 1 - e.t / e.holdMax;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const ox of [-5, 5]) { ctx.fillStyle = `rgba(200,230,255,${0.5 + 0.5 * k})`; ctx.fillRect(Math.round(e.x + ox - e.face * 3) - 2, Math.round(e.y - 40 - 4 * k) - 2, 4, 4); }
        ctx.restore();
        holdGlow(e.x - e.face * 3, e.y - 40, k, '150,200,255');
      }
      if (e.grogiT > 0) { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(Math.round(e.x + Math.cos(time * 6 + i * 2.1) * 16), Math.round(e.y - (e.type === 'boss' ? 62 : 50) + Math.sin(time * 6 + i * 2.1) * 3), 2, 2); } }
    }
    if (e.type === 'boss' && e.kind !== 'slimeking') drawBossAura(e);
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
    if (e.type !== 'boss' && e.hp < e.maxHp && !e.dead) {
      const w = isElite(e) ? 30 : 16, top = isElite(e) ? (e.type === 'boar' ? 46 : 60) : 40;
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
    drawBlade(tex, b2x, b2y, v2, alpha * 0.95);
    drawSprite('ranger', 'ranger', 2, P.x, P.y + 2 + bob, P.face < 0, { rot, alpha, white: P.hurtT > 0.12, sx, sy });
    drawBlade(tex, f1x, f1y, v1, alpha);
    if (!storm) { weaponAura(tex, f1x, f1y, v1, 'ranger'); weaponAura(tex, b2x, b2y, v2, 'ranger'); }
    if (storm) for (let i = 0; i < 4; i++) { const a = P.spin * 1.3 + i * Math.PI / 2; drawBlade(BLADES.daggerG, P.x + Math.cos(a) * 16, P.y - 10 + Math.sin(a) * 7, a, 0.75, false, 1, 'lighter'); }
    ctx.fillStyle = 'rgba(232,228,216,.45)';
    ctx.fillRect(Math.round(P.x + Math.cos(P.ang) * 26) - 1, Math.round(P.y - 8 + Math.sin(P.ang) * 26) - 1, 2, 2);
  }
  function drawPlayer() {
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
  function drawDrop(d) {
    const g = gradeOf(d.it);
    const appear = clamp((d.t - 0.6) / 0.4, 0, 1);
    if (appear <= 0) return;
    const pulse = 0.75 + Math.sin(d.t * 4) * 0.2;
    const h = (d.it.grade === 'legend' ? 220 : d.it.grade === 'unique' ? 160 : 120) * appear;
    const grd = ctx.createLinearGradient(0, d.y - h, 0, d.y);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, g.c);
    ctx.globalAlpha = 0.55 * pulse; ctx.fillStyle = grd; ctx.fillRect(d.x - 6, d.y - h, 12, h);
    ctx.globalAlpha = 0.9; ctx.fillRect(d.x - 1, d.y - h, 2, h);
    ctx.globalAlpha = 1; ctx.fillStyle = g.c; ctx.fillRect(d.x - 3, d.y - 3, 6, 6); ctx.fillStyle = '#000'; ctx.fillRect(d.x - 1, d.y - 1, 2, 2);
  }
  function drawVortex() {
    const v = G.vortex; if (!v) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(cam.x - 20, cam.y - 20, VW + 40, VH + 40); ctx.arc(v.cx, v.cy, v.r, 0, TAU, true);
    ctx.fillStyle = 'rgba(40,30,48,.55)'; ctx.fill('evenodd');
    ctx.clip('evenodd');
    // 바깥을 휘감는 잿빛 소용돌이 띠
    for (let i = 0; i < 9; i++) {
      const rr = v.r + 12 + i * 22, a0 = time * (1.6 - i * 0.08) + i * 1.3;
      ctx.strokeStyle = `rgba(${i % 3 ? '150,140,160' : '200,80,110'},${0.18 + 0.1 * Math.sin(time * 3 + i)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(v.cx, v.cy, rr, a0, a0 + 1.4); ctx.stroke();
      ctx.beginPath(); ctx.arc(v.cx, v.cy, rr, a0 + Math.PI, a0 + Math.PI + 1.0); ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const fl = 0.7 + Math.sin(time * 14) * 0.3;
    ctx.strokeStyle = `rgba(255,50,80,${0.7 * fl})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(v.cx, v.cy, v.r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = `rgba(255,220,230,${0.6 * fl})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(v.cx, v.cy, v.r - 2, 0, TAU); ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 6; i++) { const a = rand(0, TAU), r = v.r + rand(2, 60); G.parts.push({ x: v.cx + Math.cos(a) * r, y: v.cy + Math.sin(a) * r, vx: -Math.sin(a) * 110, vy: Math.cos(a) * 110, t: 0.45, c: Math.random() < 0.3 ? '#ff5070' : '#8d8496', g: 0 }); }
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

  // 조명: 어둠을 깔고 광원 자리만 지운 뒤, 따뜻한 빛을 더한다
  function renderLighting() {
    const P = G.player, lights = [];
    lights.push({ x: P.x, y: P.y - 8, r: 105, a: 0.95 });
    if (STG().torches) TORCHES.forEach(t => lights.push({ x: t.x, y: t.y + 20, r: 85 + Math.sin(time * 9 + t.x) * 3, a: 0.85, c: '255,150,60', ca: 0.12 }));
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
      if (e.type === 'boss') lights.push({ x: e.x, y: e.y - 30 - (e.z || 0), r: e.kind === 'slimeking' ? 90 : 70, a: 0.45, c: e.kind === 'slimeking' ? (e.stage === 3 ? '230,90,170' : '140,230,90') : '170,80,230', ca: 0.14 });
      else if (e.type === 'ghost') lights.push({ x: e.x, y: e.y - 12, r: 40, a: 0.4, c: '150,200,255', ca: 0.12 });
      else if (e.type === 'butcher') lights.push({ x: e.x, y: e.y - 24, r: 40 + 40 * (e.glow || 0), a: 0.45, c: '255,60,40', ca: 0.06 + 0.16 * (e.glow || 0) + (e.enraged ? 0.06 : 0) });
      else if (e.type === 'crow') lights.push({ x: e.x, y: e.y - (e.z || 0) - 6, r: 24, a: 0.4, c: '150,100,200', ca: 0.06 });
      else if (e.type === 'mother') lights.push({ x: e.x, y: e.y - 24, r: 50 + 40 * Math.max(e.glow || 0, e.state === 'bilecharge' ? 1 - e.t / e.chargeMax : 0), a: 0.5, c: '150,230,80', ca: 0.08 + 0.15 * (e.glow || 0) });
      else if (e.type === 'gbrute' || e.type === 'boar') lights.push({ x: e.x, y: e.y - 24, r: 40 + 40 * (e.glow || 0), a: 0.45, c: e.type === 'boar' ? '255,70,40' : '255,190,60', ca: 0.05 + 0.15 * (e.glow || 0) + (e.enraged ? 0.06 : 0) });
      else if (e.type === 'cultist' && e.state === 'wind') lights.push({ x: e.x, y: e.y - 22, r: 46, a: 0.6, c: '255,40,60', ca: 0.2 });
      else lights.push({ x: e.x, y: e.y - 8, r: 22, a: 0.25 });
    }
    for (const t of G.tele) if (t.shape !== 'spawn' && !(t.r > 600)) { const lx = t.shape === 'line' ? t.x + Math.cos(t.ang) * t.len / 2 : t.x, ly = t.shape === 'line' ? t.y + Math.sin(t.ang) * t.len / 2 : t.y; lights.push({ x: lx, y: ly, r: (t.shape === 'line' ? t.len / 2 : t.r) + 16, a: 0.45, c: t.mark ? '170,60,220' : '240,30,30', ca: 0.1 + 0.12 * (t.t / t.dur) }); }
    for (const f of G.fx) if (f.kind === 'skybeam') lights.push({ x: f.x, y: f.y - 20, r: 90, a: 0.7 * (f.t / f.max), c: f.c, ca: 0.25 * (f.t / f.max) });
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
    if (G.frenzyT > 0) lights.push({ x: G.player.x, y: G.player.y - 12, r: 48, a: 0.5, c: '255,40,50', ca: 0.14 + 0.05 * Math.sin(time * 10) });
    for (const f of G.fx) if (f.kind === 'hitspark') lights.push({ x: f.x, y: f.y, r: f.r * 1.6, a: 0.4 * (f.t / f.max), c: f.c, ca: 0.07 * (f.t / f.max) });
    for (const f of G.fx) if (f.kind === 'hitflash') lights.push({ x: f.x, y: f.y, r: 50, a: 0.7 * (f.t / f.max), c: '255,240,200', ca: 0.2 * (f.t / f.max) });
    for (const p of G.parts) if (p.glow) lights.push({ x: p.x, y: p.y, r: 8, a: 0.4 });
    roomLights(lights);
    if (flashT > 0) lights.push({ x: cam.x + VW / 2, y: cam.y + VH / 2, r: 900, a: Math.min(1, flashT * 4) });

    const vis = lights.filter(l => l.x + l.r > cam.x && l.x - l.r < cam.x + VW && l.y + l.r > cam.y && l.y - l.r < cam.y + VH);
    lg.setTransform(1, 0, 0, 1, 0, 0);
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, VW, VH);
    lg.fillStyle = `rgba(${G.stage === 1 ? '14,10,30' : '4,3,10'},${STG().dark})`; lg.fillRect(0, 0, VW, VH);
    lg.globalCompositeOperation = 'destination-out';
    lg.setTransform(1, 0, 0, 1, -Math.round(cam.x), -Math.round(cam.y));
    for (const l of vis) {
      const gr = lg.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      gr.addColorStop(0, `rgba(0,0,0,${l.a})`); gr.addColorStop(0.55, `rgba(0,0,0,${l.a * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = gr; lg.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    lg.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(lightC, Math.round(cam.x), Math.round(cam.y));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const l of vis) if (l.c) {
      const gr = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.8);
      gr.addColorStop(0, `rgba(${l.c},${l.ca})`); gr.addColorStop(1, `rgba(${l.c},0)`);
      ctx.fillStyle = gr; ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    ctx.restore();
  }
  const hexRgb = h => `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;

  function render() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    if (!G) { cam.x = 192; cam.y = 88; }
    let sx = 0, sy = 0;
    if (G && (shake > 0 || Math.abs(shakeX) + Math.abs(shakeY) > 0.3)) { sx = Math.round(rand(-shake, shake) * 0.6 + shakeX); sy = Math.round(rand(-shake, shake) * 0.6 + shakeY); }
    if (G && zoomK > 0) { ctx.translate(VW / 2, VH / 2); ctx.scale(1 + zoomK, 1 + zoomK); ctx.translate(-VW / 2, -VH / 2); }
    ctx.translate(-Math.round(cam.x) + sx, -Math.round(cam.y) + sy);
    ctx.drawImage(G && G.stage === 1 ? floorM : floor, 0, 0);
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
    if (G.bonfire) drawBonfire(G.bonfire);
    for (const l of G.loot) drawLoot(l);
    drawMeteorMark();
    for (const t of G.tele) if (!t.mark) drawTele(t);
    const ents = G.enemies.filter(e => !e.dead).map(e => ({ y: e.y, d: () => drawEnemyShk(e) }));
    if (G.corpses) for (const c of G.corpses) ents.push({ y: c.e.y, d: () => drawCorpse(c) });
    ents.push({ y: G.player.y, d: drawPlayer });
    roomEnts(ents);
    ents.sort((a, b) => a.y - b.y).forEach(o => o.d());
    for (const t of G.tele) if (t.mark) drawTele(t);
    for (const d of G.drops) drawDrop(d);
    for (const f of G.fx) drawFx(f);
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
    if (G.dun) drawFireflies();
    for (const t of G.tele) drawTeleGlow(t);
    drawVortex();
    drawPrompt();
    for (const n of G.nums) { ctx.globalAlpha = Math.min(1, n.t * 3); drawNumber(n.v, n.x, n.y - (n.pop > 0 ? 2 : 0), n.pop > 0 ? '#ffffff' : n.c, n.s + (n.pop > 0 ? 1 : 0)); }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ---- 여기부터 화면 좌표
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
      ctx.save(); ctx.translate(Math.round(ax), Math.round(ay)); ctx.rotate(a);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(s + 1, 0); ctx.lineTo(-s, -s); ctx.lineTo(-s, s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(${col},${al})`; ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(-s + 1, -s + 1); ctx.lineTo(-s + 1, s - 1); ctx.closePath(); ctx.fill();
      ctx.restore();
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
    for (const e of G.enemies) if (!e.dead) { const h = e.type === 'boss' ? 64 : isElite(e) ? 56 : 40, w = e.type === 'boss' ? 30 : isElite(e) ? 26 : 14; boxes.push([e.x - w - ox, e.y - h - (e.lift || 0) - oy, e.x + w - ox, e.y + 4 - oy]); }
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
      <div class="kr">${k('F', '상호작용')}${k('지도', '방 지도·순간이동')}${k('❚❚', '일시정지')}</div>
      <div class="kh">공격 직전 점멸 = 퍼펙트 회피 · 화면을 탭하면 그쪽으로 공격</div>`;
    return `<div class="kt">조작 안내</div>
      <div class="kr">${k('WASD', '이동')}${k('LMB', '공격')}${k('RMB', C.skill)}${k('E', C.awaken)}${k('SPACE', '점멸')}</div>
      <div class="kr">${k('F', '상호작용')}${k('TAB', '지도')}${k('ESC', '일시정지')}${k('M', '음악')}</div>
      <div class="kh">공격 직전 점멸 = 퍼펙트 회피 · H 키로 이 안내를 다시 열고 닫기</div>`;
  }
  function hud() {
    const show = !!G && !['title', 'select', 'forge'].includes(mode);
    ['party', 'phase', 'skills', 'debug'].forEach(id => { $(id).style.display = show && mode !== 'map' ? '' : 'none'; });
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
      $('phaseText').textContent = R ? `${G.stage} · ${ROOM_N[R.type]}` : '';
      let sub = `${R ? SHAPES[R.shape].n + ' · ' : ''}엘리트 ${G.dun ? G.dun.eliteDone : 0}/2 · ${G.gold}G`;
      if (R && R.type === 'survive' && rs.state === 'run') sub = `버티기 ${Math.max(0, 60 - rs.surviveT).toFixed(0)}초`;
      else if (R && R.waves && (rs.state === 'run' || rs.state === 'intro')) sub = `웨이브 ${Math.min(rs.wave + 1, R.waves.length)}/${R.waves.length} · 남은 적 ${G.enemies.filter(e => !e.dead).length + G.spawning}`;
      else if (R && R.type === 'boss') sub = '보스전';
      $('phaseSub').textContent = sub; }
    if (hudPrev.hearts !== G.stage) { hudPrev.hearts = G.stage; $('hearts').innerHTML = `<span class="f7" style="color:var(--quiet)">STAGE ${G.stage} · ${STG().n}</span>`; }
    // 스킬: 공격 콤보 단계
    const step = G.cls === 'mage' ? (P.boltN || 0) % 3 : G.cls === 'gunner' ? (P.reload > 0 ? 0 : 3) : P.state === 'attack' ? P.combo + 1 : P.comboWin > 0 ? P.combo : 0;
    if (G.cls === 'gunner') setSkill('skA', P.reload <= 0 && !P.dead, (P.reload / 0.8) * 100, P.reload > 0 ? P.reload.toFixed(1) : '');
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
      $('bossStage').textContent = b.dead ? '' : b.grogiT > 0 ? '그로기!' : b.stage === 3 ? (b.kind === 'slimeking' ? '폭주' : '광폭화') : `${b.stage}단계`;
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
    const b = SAVE.best || 0, bs = b ? (b > 11 ? `STAGE 2 · ${b - 11 === 11 ? 'BOSS' : 'PHASE ' + (b - 11)}` : `STAGE 1 · ${b === 11 ? 'BOSS' : 'PHASE ' + b}`) : '없음';
    $('titleInfo').innerHTML = `토벌 완료 <b>${SAVE.clears}</b> / 시도 <b>${SAVE.runs}</b> · 최고 도달 <b>${bs}</b><br>로그라이크 — 장비·재료는 한 번의 토벌 동안만 유지되고, 쓰러지면 모두 잃는다`;
  }
  function start() {
    ['ovTitle', 'ovResult', 'ovPause', 'ovRest', 'ovSelect', 'ovForge'].forEach(id => $(id).classList.remove('on'));
    initAudio(); sfx('select');
    applyClassUI();
    for (const k in pressed) pressed[k] = false;
    newRun();
    mode = 'play';
  }
  function toTitle() {
    ['ovResult', 'ovPause', 'ovRest'].forEach(id => $(id).classList.remove('on'));
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
  });

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
  function openForge(from) {
    forgeFrom = from; forgeCls = G ? G.cls : CUR; forgeMsg = from === 'between' ? '<span class="ok">STAGE 1 클리어 — 보스 전리품이 들어왔다. 강화하고 다음 스테이지로</span>' : null; mode = 'forge';
    if (from === 'between' && G.newItems[0]) forgeSel = G.newItems[0].id;
    ['ovTitle', 'ovResult'].forEach(id => $(id).classList.remove('on'));
    $('fgTabs').style.display = from === 'between' ? 'none' : '';
    $('fgClose').textContent = from === 'between' ? `STAGE ${G.stage + 1}로 [ESC]` : '돌아가기 [ESC]';
    $('fgClose').classList.toggle('primary', from === 'between');
    $('ovForge').classList.add('on'); renderForge();
  }
  function closeForge() {
    $('ovForge').classList.remove('on'); sfx('blip');
    if (forgeFrom === 'between') { applyClassUI(); nextStage(); }
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
      : '<p>장비가 없다. 아래 「테스트 장비 받기」로 받아 보자.</p>';
    $('fgList').querySelectorAll('.fgRow').forEach(b => b.addEventListener('click', () => { forgeSel = +b.dataset.id; forgeMsg = null; sfx('blip'); renderForge(); }));
    const selRow = $('fgList').querySelector('.fgRow.sel'); if (selRow) selRow.scrollIntoView({ block: 'nearest' });
    renderForgeDetail();
  }
  function renderForgeDetail() {
    const it = SAVE.inv.find(i => i.id === forgeSel), d = $('fgDetail');
    if (!it) { d.innerHTML = '<p>강화할 장비를 고른다.</p>'; return; }
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
      ${it.opts.map(o => `<div class="fgOpt">${optText(o)}</div>`).join('')}${it.fx ? `<div class="fgOpt fx">★ ${LEGEND_FX[it.fx].d}</div>` : ''}
      ${max ? '<div class="fgRate"><b>MAX</b><span>최대 강화</span></div>' : `
      <div class="fgRate"><span>성공 확률</span><b>${rate}%</b>${it.fail ? `<em>장인의 숨결 +${2 * it.fail}%p</em>` : ''}</div>
      <div class="fgRisk">${lv + 1 >= 10 ? '<span style="color:#ff8080">실패 시 1단계 하락</span>' : '실패해도 단계 유지'} · 실패할 때마다 다음 성공률 +2%p</div>
      ${[5, 10, 15].includes(lv + 1) ? `<div class="mile">★ +${lv + 1} 달성 시 옵션 1줄 추가</div>` : ''}
      <div class="fgCost"><span class="${has.iron ? '' : 'no'}">철광석 조각 ${c.iron} <small>보유 ${SAVE.mats.iron}</small></span>${c.crystal ? `<span class="${has.crystal ? '' : 'no'}">정령의 결정 ${c.crystal} <small>보유 ${SAVE.mats.crystal}</small></span>` : ''}<span class="${has.gold ? '' : 'no'}">골드 ${c.gold} <small>보유 ${SAVE.gold}</small></span></div>`}
      <div class="row">${max ? '' : `<button class="pbtn primary" id="fgGo" ${can ? '' : 'disabled'}>강화하기 [ENTER]</button>`}${ok ? `<button class="pbtn" id="fgEq">${eq ? '장착 중' : `${CLASSES[forgeCls].n}에게 장착`}</button>` : `<span class="f7" style="color:var(--quiet)">${CLASSES[it.cls].n} 전용 무기</span>`}</div>
      <div id="fgMsg">${forgeMsg || ''}</div>`;
    const go = $('fgGo'); if (go) go.addEventListener('click', doEnhance);
    const eb = $('fgEq'); if (eb) eb.addEventListener('click', () => { eqOf(forgeCls)[it.slot] = it.id; persist(); sfx('select'); renderForge(); });
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
  $('fgTestMats').addEventListener('click', () => { SAVE.gold += 20000; SAVE.mats.iron += 60; SAVE.mats.crystal += 20; persist(); sfx('select'); forgeMsg = '<span class="ok">테스트 재료 지급: 골드 20000 · 철광석 60 · 결정 20</span>'; renderForge(); });
  $('fgTestItem').addEventListener('click', () => { const it = makeItem(forgeCls); SAVE.inv.push(it); forgeSel = it.id; persist(); sfx('drop'); forgeMsg = `<span class="ok">테스트 장비 지급: ${it.name}</span>`; renderForge(); });


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
  }

  // ---------------------------------------------------------------- 화면 맞춤
  var fitW = 0, fitH = 0; // enableTouch가 먼저 fit을 부를 수 있어 var/function으로 끌어올린다
  function viewW() { return window.visualViewport ? visualViewport.width : innerWidth; }
  function viewH() { return window.visualViewport ? visualViewport.height : innerHeight; }
  function fit() {
    fitW = viewW(); fitH = viewH();
    const fitS = Math.min(fitW / VW, fitH / VH);
    const s = typeof TOUCH !== 'undefined' && TOUCH.on ? fitS : Math.max(0.75, Math.floor(fitS * 4) / 4); // 모바일은 화면에 꽉 차게
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

  window.__proto = { get G() { return G; }, get cam() { return cam; }, get mode() { return mode; }, start, SAVE: () => SAVE, mk: makeEnemy, choose: chooseClass, dbg: { get ICON32() { return ICON32; }, artCache, DOOR, doorIn, doorState, hitCrack, crackPoint, enterRoom, goRoom, newDungeon: () => { G.stage = G.stage; G.dun = genDungeon(G.stage); G.dun.cur = null; }, get mode() { return mode; } } };
})();
