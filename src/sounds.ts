import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

// 소리 파일 연결. 아직 없는 소리는 임시 파일로 연결해 두고 TODO로 표시해요 (ASSETS.md).
const DAWN = require('../assets/placeholder/sounds/dawn_bell.caf');

const WAKE: Record<string, number> = {
  classic: require('../assets/sounds/wake/classic.caf'),
  dawn_bell: DAWN, // TODO: 사운드 디자이너 파일로 교체
  xylophone: require('../assets/placeholder/sounds/xylophone.caf'), // TODO: 교체
  // TODO: 아래 6개는 파일이 아직 없어서 새벽 종소리 임시 파일로 소리 나요
  sunrise_forest: DAWN, birds: DAWN, stream: DAWN, piano: DAWN, wind_chime: DAWN, guitar: DAWN,
};
export const wakeSoundFile = (id: string) => WAKE[id] ?? DAWN;

export const SFX = {
  tick: require('../assets/sounds/sfx/tick.m4a'),
  count: require('../assets/sounds/sfx/count.m4a'),
  rep: require('../assets/sounds/sfx/rep.m4a'),
  success: require('../assets/sounds/sfx/success.m4a'),
  fail: require('../assets/sounds/sfx/fail.m4a'),
};

// 미션 효과음 재생 (한 번 만든 플레이어를 되감아 다시 써요)
const sfxPlayers: Partial<Record<keyof typeof SFX, AudioPlayer>> = {};
export function playSfx(name: keyof typeof SFX) {
  const p = (sfxPlayers[name] ??= createAudioPlayer(SFX[name]));
  p.seekTo(0);
  p.play();
}
