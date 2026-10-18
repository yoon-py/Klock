// 수면 장면 7개 (SPEC 6.11). 소리·영상 파일이 아직 없는 장면은 소리 없이 배경색만 (TODO: ASSETS.md 2-2, 3장)
import type { SceneId } from './store';

export const SCENES: { id: SceneId; tag: string; name: string; bg: [string, string]; sound?: number }[] = [
  { id: 'fire', tag: '장소', name: '타닥타닥 모닥불', bg: ['#4A1C0B', '#0A0605'] },
  { id: 'rain', tag: '날씨', name: '창밖에 내리는 비', bg: ['#2B3038', '#101216'] },
  { id: 'sea', tag: '자연', name: '달빛 아래 파도', bg: ['#1C2650', '#070A18'] },
  { id: 'train', tag: '장소', name: '밤기차 창가', bg: ['#1B2238', '#0E1220'] },
  { id: 'snow', tag: '날씨', name: '소복소복 눈 오는 밤', bg: ['#2A3142', '#12151E'], sound: require('../assets/placeholder/sounds/scene_snow.m4a') },
  { id: 'bugs', tag: '자연', name: '여름밤 풀벌레', bg: ['#14231C', '#0A110D'] },
  { id: 'fan', tag: '일상', name: '선풍기 바람', bg: ['#23252B', '#111215'], sound: require('../assets/placeholder/sounds/scene_fan.m4a') },
];
export const scene = (id?: SceneId) => SCENES.find((s) => s.id === id);

export const BEAT_FILE = require('../assets/sounds/beat_calm.caf');

/** "장소 · 타닥타닥 모닥불 + 모노럴 비트" */
export function soundLine(scenes: SceneId[], beat: boolean) {
  const a = scene(scenes[0]), b = scene(scenes[1]);
  const parts = [a ? `${a.tag} · ${a.name}` : null, b ? b.name : null, beat ? '모노럴 비트' : null].filter(Boolean);
  return parts.length ? parts.join(' + ') : '소리 없음';
}
