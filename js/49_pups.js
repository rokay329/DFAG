'use strict';
// 잿빛 왕관 원정대 — 49_pups.js : v3.23 2장 사냥개 → 갈색 강아지 · 3장 전투 늑대 → 회색 강아지
// 등장인물이 수인이라 너무 사실적이던 개 도트를 머리를 키운 덜 사실적인 비율로. 너무 귀엽지 않게 주둥이 · 붉은 눈은 남기고 (이빨은 그리지 않음),
// 명암은 기존 몬스터처럼 어두운 윤곽 + 채도 낮은 3단 (등 밝게 · 배 어둡게). 갈색 사냥개는 가시 목줄, 회색 늑대는 쫑긋한 귀 · 가죽 끈 · 뼈 장식
(() => {
  // v3.23 사용자 수정 도트 (사냥개 · 늑대)
  const DOG = [
    '...........kkkk.....',
    '..........kDDLLkk...',
    '.........kDDDLLddk..',
    '..k......kDDDddddk..',
    '.kdk.....kDDdddEedk.',
    '.kdk.....kLdddddddkk',
    '..kdk....kLdddddLLLk',
    '..kdkkkkkkDddddLLLE.',
    '..kdLLLLLDDddddkkk..',
    '..kdLLddddDDrgrgk...',
    '..kddddddddDDDdk....',
    '..kDDkkkDDkkkDDk....',
    '..kDDk.kDDk.kDDk....',
    '...kDDk.kDDk.kDDk...',
    '...kkkk.kkkk.kkkk...',
  ];
  const WOLF = [
    '...........k...k....',
    '..........kdk.kLk...',
    '..........kddkdLdk..',
    '..........kdddddddk.',
    '.k.......kLddddEedk.',
    'kLk......kLdddddddkk',
    'kLLk.....kLddddmmmmk',
    '.kdLk...kkDdddmmmmE.',
    '..kdLkkkkDDddmmkkk..',
    '..kdLLLLDDDddmmk....',
    '..kdLddddDDcbcbk....',
    '..kddddddddDDDdk....',
    '..kddk.kddk.kDDk....',
    '..kDDk.kDDk.kDDk....',
    '...kDDk.kDDk.kDDk...',
    '...kkkk.kkkk.kkkk...',
  ];
  // 걸음: 다리 칸만 바꿈 (대각선 한 쌍씩 들어 올림)
  // 걸음: 사용자 도트의 다리(비스듬히 내딛은 모양)와, 다리를 곧게 모은 모양을 번갈아
  const straight = M => { const R = M.slice(), n = R.length; R[n - 2] = R[n - 3]; R[n - 1] = R[n - 3].replace(/[dDL]/g, 'k'); return R; };
  MAPS.nDog = DOG; MAPS.nDogW1 = straight(DOG); MAPS.nDogW3 = DOG;
  MAPS.nWolf = WOLF; MAPS.nWolfW1 = straight(WOLF); MAPS.nWolfW3 = WOLF;
  // 기존 몬스터와 같은 결: 아주 어두운 윤곽 · 채도 낮은 3단 명암(등은 밝게 · 배는 어둡게) · 붉게 빛나는 눈
  PAL.nDog = { k: '#100c0c', d: '#8e6448', D: '#5c3e2c', L: '#b88e6e', /* v3.23 어두운 성채 바닥에서 보이게 두 단계 밝게 */  E: '#1a1010', e: '#ff3b2c', n: '#1a1010', r: '#7a1a22', g: '#b89040' };
  PAL.nWolf = { k: '#0a080c', d: '#5a5664', D: '#36323e', L: '#8a8694', m: '#b4b0bc', E: '#1a1010', e: '#ff3a20', n: '#1a1010', c: '#5a3a22', b: '#d8d0b8' };
})();
