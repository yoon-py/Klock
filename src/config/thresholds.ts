// 미션 판정 기준값은 모두 여기에 (CLAUDE.md). 실제 폰으로 해 보고 조정해요.
export const RHYTHM = {
  beatMs: 450, // 글자 하나 말하는 박자
  wordPreviewMs: 900, // 시작 전 단어 그림 하나 보여 주는 시간
  countMs: 700, // 3·2·1 한 칸
  rouletteMs: 2000, // 문장 룰렛이 도는 시간
  listenFromMs: 120, // 박자 시작 뒤 이만큼 지나서부터 듣기 (박자 효과음이 마이크에 들어가지 않게)
  voiceAboveAmbientDb: 12, // 주변 소리보다 이만큼 크면 "말했다"로 봐요
};

// 모노럴 비트 "잔잔하게" (SPEC 8장). 비트는 하나만 (특허 회피).
// 아이폰 스피커는 낮은 소리를 잘 못 내요. 실제 폰 스피커로 160~250Hz를 들어 보고 정해요.
export const BEAT = {
  carrierHz: 200, // 바탕 소리
  beatHz: 3, // 맥박 빠르기 (두 번째 사인파 = carrierHz + beatHz)
  amplitude: 0.7, // 가장 클 때 크기 (0~1). 미리 만든 파일(beat_calm.caf)과 같은 크기
  fadeInSec: 3, // 켤 때 서서히 커지는 시간
};
