// 미션 판정 기준값은 모두 여기에 (CLAUDE.md). 실제 폰으로 해 보고 조정해요.
export const RHYTHM = {
  beatMs: 450, // 글자 하나 말하는 박자
  wordPreviewMs: 900, // 시작 전 단어 그림 하나 보여 주는 시간
  countMs: 700, // 3·2·1 한 칸
  rouletteMs: 2000, // 문장 룰렛이 도는 시간
  listenFromMs: 120, // 박자 시작 뒤 이만큼 지나서부터 듣기 (박자 효과음이 마이크에 들어가지 않게)
  voiceAboveAmbientDb: 12, // 주변 소리보다 이만큼 크면 "말했다"로 봐요
};

// 스쿼트 (SPEC 6.15): 무릎 각도(엉덩이-무릎-발목)가 downAngle 아래로 갔다가 upAngle 위로 펴지면 1회
export const SQUAT = {
  downAngle: 100,
  upAngle: 160,
  minVisibility: 0.5, // 엉덩이·무릎·발목이 이만큼 확실히 보일 때만 세요 (0~1)
  minRepSec: 0.8, // 너무 빨리 까딱하면 안 셈
  maxRepSec: 6,
};

// 수면 가이드 호흡 (SPEC 6.19): [들이쉬기, 참기, 내쉬기] 초, 몇 번
export const GUIDE = {
  '478': { name: '4-7-8 호흡', steps: [4, 7, 8], rounds: 4 },
  '1m': { name: '1분 호흡', steps: [4, 0, 6], rounds: 6 },
} as const;

// 사진 미션: 등록 사진과의 특징 거리가 이 값 이하면 같은 곳 (Vision 특징 거리, 같은 곳 대략 0.3~0.6, 다른 곳 0.8 이상).
// 실제 폰으로 같은 곳·다른 곳을 여러 번 찍어 보고 조정해요.
export const PHOTO = { maxDistance: 0.65 };
