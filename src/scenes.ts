// 수면 사운드 7개 + 소음 3개 (SPEC 6.11). CC0 출처는 assets/licenses/freesound/README.md에 기록해요.
import type { SceneId } from './store';

export const SCENES: { id: SceneId; tag: string; name: string; note?: string; bg: [string, string]; sound?: number }[] = [
  { id: 'fire', tag: '장소', name: '타닥타닥 모닥불', bg: ['#4A1C0B', '#0A0605'], sound: require('../assets/sounds/sleep/fire.m4a') },
  { id: 'rain', tag: '날씨', name: '창밖에 내리는 비', bg: ['#2B3038', '#101216'], sound: require('../assets/sounds/sleep/rain.m4a') },
  { id: 'sea', tag: '자연', name: '달빛 아래 파도', bg: ['#1C2650', '#070A18'], sound: require('../assets/sounds/sleep/sea.m4a') },
  { id: 'train', tag: '장소', name: '밤기차 창가', bg: ['#1B2238', '#0E1220'], sound: require('../assets/sounds/sleep/train.m4a') },
  { id: 'snow', tag: '날씨', name: '소복소복 눈 오는 밤', bg: ['#2A3142', '#12151E'], sound: require('../assets/placeholder/sounds/scene_snow.m4a') },
  { id: 'bugs', tag: '자연', name: '여름밤 풀벌레', bg: ['#14231C', '#0A110D'], sound: require('../assets/sounds/sleep/bugs.m4a') },
  { id: 'fan', tag: '일상', name: '선풍기 바람', bg: ['#23252B', '#111215'], sound: require('../assets/placeholder/sounds/scene_fan.m4a') },
  { id: 'white', tag: '소음', name: '백색 소음', note: '고르게 쏴아', bg: ['#16161A', '#0B0B0D'], sound: require('../assets/sounds/noise/white.m4a') },
  { id: 'pink', tag: '소음', name: '분홍 소음', note: '부드러운 빗소리 같은', bg: ['#1A1517', '#0C0A0B'], sound: require('../assets/sounds/noise/pink.m4a') },
  { id: 'brown', tag: '소음', name: '갈색 소음', note: '낮고 묵직한', bg: ['#17130F', '#0B0907'], sound: require('../assets/sounds/noise/brown.m4a') },
];
export const scene = (id?: SceneId) => SCENES.find((s) => s.id === id);

/** "장소 · 타닥타닥 모닥불 + 창밖에 내리는 비" */
export function soundLine(scenes: SceneId[]) {
  const a = scene(scenes[0]), b = scene(scenes[1]);
  const parts = [a ? `${a.tag} · ${a.name}` : null, b ? b.name : null].filter(Boolean);
  return parts.length ? parts.join(' + ') : '소리 없음';
}
