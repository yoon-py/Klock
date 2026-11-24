// 수면 중 상태: 소리 레이어(장면 1·2) 재생 → 정한 시간 뒤 서서히 꺼짐 → 소리 듣기(녹음)
// SPEC 8장. 비트는 하나만, 장면 소리는 그 위에 섞어요.
import { useSyncExternalStore } from 'react';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { get, set, saveNight, getNights } from './index';
import { scene } from '../scenes';
import { toMin } from '../time';

type Night = { active: boolean; phase: 'sound' | 'listen'; startedAt: number; offAt: number | null; wakeAt: number };
let night: Night = get('night');
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const setNight = (n: Partial<Night>) => { night = { ...night, ...n }; set('night', night); emit(); };
export const useNight = () => useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => night);

type Layer = { volume: number; pause(): void; remove(): void };
let players: { a?: Layer; b?: Layer } = {};
let offTimer: ReturnType<typeof setTimeout> | undefined;
let fadeTimer: ReturnType<typeof setInterval> | undefined;

const FADE_MS = 15_000; // 15초에 걸쳐 서서히 (SPEC 8장)

/** 지금 이후 가장 가까운 min(하루 중 분) 시각 */
function upcoming(min: number, now: Date) {
  const d = new Date(now);
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d;
}
export const wakeMin = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** 다음 기상 시각. 수면 탭에서 이번 한 번만 바꿨으면 그 시각, 그 뒤엔 원래 일정 (다음 날부터) */
export function nextWake(now = new Date()) {
  const o = get('wakeOnce');
  if (o && now < new Date(o.at)) return new Date(o.at);
  const d = upcoming(toMin(get('schedule').wakeTime), now);
  if (o && d.getTime() === new Date(o.replaces).getTime()) d.setDate(d.getDate() + 1); // 바꾼 날의 원래 알람은 건너뛰어요
  return d;
}

/** 수면 탭 다이얼: 다음 기상만 바꿔요. 원래 시각으로 돌리면 지워요 */
export function setNextWake(min: number) {
  const now = new Date();
  const regular = upcoming(toMin(get('schedule').wakeTime), now);
  set('wakeOnce', min === wakeMin(regular) ? null : { at: upcoming(min, now).toISOString(), replaces: regular.toISOString() });
}
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** "수면 시작": 기록을 남기고 소리를 틀어요 */
export function startNight() {
  const sch = get('schedule');
  const wake = nextWake();
  const goal = ((toMin(sch.wakeTime) - toMin(sch.bedtime)) % 1440 + 1440) % 1440;
  const old = getNights(60).find((n) => n.date === ymd(wake));
  saveNight({ ...(old ?? { sounds: [], emergencyUnlocks: [], alarmAt: '' }), date: ymd(wake), sleepStart: new Date().toISOString(), goalMinutes: goal });
  setNight({ startedAt: Date.now(), wakeAt: wake.getTime() });
  return startSound();
}

/** 밤중에 앱이 꺼졌다 다시 열렸을 때: 아직 기상 전이면 이어서 해요. 이어 갈 게 있으면 true */
export function resumeNight() {
  if (!night.active) return false;
  if (Date.now() >= night.wakeAt) { setNight({ active: false, phase: 'sound', offAt: null }); return false; } // 알람이 처리해요
  if (night.phase === 'sound') {
    if (night.offAt && night.offAt > Date.now()) startSound(false); // 끄는 시각은 그대로
    else setNight({ phase: 'listen', offAt: null });
  }
  return true;
}

/** 고른 소리를 틀고 끄는 시간을 맞춰요. resetTimer=false면 끄는 시각은 그대로 (소리 섞기에서 장면을 더하거나 뺄 때) */
export async function startSound(resetTimer = true) {
  stopPlayers();
  const stored = get('sleepSound');
  const playable = stored.scenes.filter((id) => !!scene(id)?.sound).slice(0, 2);
  const scenes = playable.length ? playable : ['brown' as const];
  const s = playable.length === stored.scenes.length ? stored : { ...stored, scenes };
  if (s !== stored) set('sleepSound', s);
  const wake = nextWake();
  // 최근에 들은 조합 맨 앞에 (같은 조합은 앞으로 옮김, SPEC 8장)
  if (s.scenes.length) set('sleepSound', { ...s, recent: [s.scenes, ...(s.recent ?? []).filter((r) => r.join() !== s.scenes.join())].slice(0, 3) });
  // 녹음 화면을 거쳐 다시 재생할 때도 수화기가 아니라 스피커로 나가게 녹음 모드를 명시적으로 꺼요.
  await setAudioModeAsync({ allowsRecording: false, shouldRouteThroughEarpiece: false, playsInSilentMode: true, shouldPlayInBackground: true });
  const a = scene(s.scenes[0])?.sound, b = scene(s.scenes[1])?.sound;
  if (a) players.a = loop(a, s.volumes.sceneA);
  if (b) players.b = loop(b, s.volumes.sceneB);

  // 끄는 시간: 30분·1시간 뒤, 아침까지면 알람 30분 전
  const keep = !resetTimer && night.phase === 'sound' && night.offAt;
  const offAt = keep ? night.offAt! : s.offAfter === 'morning' ? wake.getTime() - 30 * 60_000 : Date.now() + s.offAfter * 60_000;
  setNight({ active: true, phase: 'sound', offAt });
  clearTimeout(offTimer);
  offTimer = setTimeout(fadeToListen, offAt - Date.now());
}

function loop(src: number, volume: number) {
  const p = createAudioPlayer(src);
  p.loop = true;
  p.volume = volume;
  p.play();
  return p;
}

/** 소리 섞기 시트에서 음량을 바꿀 때 */
export function setLayerVolume(layer: 'a' | 'b', v: number) {
  const p = players[layer];
  if (p) p.volume = v;
}

/** 소리를 서서히 줄여 끄고, 그때부터 듣기(녹음) */
export function fadeToListen(ms = FADE_MS) {
  clearTimeout(offTimer);
  clearInterval(fadeTimer);
  const start = Object.fromEntries(Object.entries(players).map(([k, p]) => [k, p?.volume ?? 0]));
  const t0 = Date.now();
  fadeTimer = setInterval(() => {
    const k = Math.max(0, 1 - (Date.now() - t0) / ms);
    for (const [key, p] of Object.entries(players)) if (p) p.volume = (start[key] ?? 0) * k;
    if (k === 0) {
      clearInterval(fadeTimer);
      stopPlayers();
      // 아침까지 틀면 녹음은 쉬어요 (SPEC 6.11). 녹음 화면은 그대로 보여 줘요.
      setNight({ phase: 'listen', offAt: null });
    }
  }, 250);
}

export function endNight() {
  clearTimeout(offTimer);
  clearInterval(fadeTimer);
  stopPlayers();
  setNight({ active: false, phase: 'sound', offAt: null });
}

function stopPlayers() {
  for (const p of Object.values(players)) { p?.pause(); p?.remove(); }
  players = {};
}

export const getNightState = () => night;
