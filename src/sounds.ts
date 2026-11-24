import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import type { WakeSoundId } from './store';

// 소리 파일 연결. 아직 없는 소리는 임시 파일로 연결해 두고 TODO로 표시해요 (ASSETS.md).
const DAWN = require('../assets/placeholder/sounds/dawn_bell.caf');

const WAKE: Record<string, number> = {
  classic: require('../assets/sounds/wake/classic.caf'),
  dawn_bell: DAWN, // TODO: 사운드 디자이너 파일로 교체
  xylophone: require('../assets/placeholder/sounds/xylophone.caf'), // TODO: 교체
  sunrise_forest: require('../assets/sounds/wake/sunrise_forest.m4a'),
  birds: require('../assets/sounds/wake/birds.m4a'),
  stream: require('../assets/sounds/wake/stream.m4a'),
  piano: require('../assets/sounds/wake/piano.m4a'),
  wind_chime: require('../assets/sounds/wake/wind_chime.m4a'),
  guitar: require('../assets/sounds/wake/guitar.m4a'),
};
export const wakeSoundFile = (id: string) => WAKE[id] ?? DAWN;

export type SoundLicense = 'owned' | 'public-domain' | 'cc0' | 'cc-by' | 'commercial';
export type WakeSoundMeta = {
  id: WakeSoundId;
  name: string;
  category: '기본 알람' | '자연 기상음' | '음악';
  license: SoundLicense;
  ready: boolean;
};

/** 출시 전 ready=false 항목은 권리가 확인된 실제 파일로 교체해야 해요. */
export const WAKE_SOUNDS: WakeSoundMeta[] = [
  { id: 'dawn_bell', name: '새벽 종소리', category: '기본 알람', license: 'owned', ready: false },
  { id: 'xylophone', name: '맑은 실로폰', category: '기본 알람', license: 'owned', ready: false },
  { id: 'classic', name: '기본 알람음', category: '기본 알람', license: 'owned', ready: true },
  { id: 'sunrise_forest', name: '해 뜨는 숲', category: '자연 기상음', license: 'cc0', ready: true },
  { id: 'birds', name: '새소리', category: '자연 기상음', license: 'cc0', ready: true },
  { id: 'stream', name: '시냇물', category: '자연 기상음', license: 'cc0', ready: true },
  { id: 'piano', name: '잔잔한 피아노', category: '음악', license: 'cc0', ready: true },
  { id: 'wind_chime', name: '바람 풍경', category: '음악', license: 'cc0', ready: true },
  { id: 'guitar', name: '경쾌한 기타', category: '음악', license: 'cc0', ready: true },
];

export const wakeSoundName = (id: string) => WAKE_SOUNDS.find((sound) => sound.id === id)?.name ?? '새벽 종소리';

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
