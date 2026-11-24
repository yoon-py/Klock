// 알람이 울린 뒤 미션을 하는 동안의 상태 (미리보기도 같은 흐름을 써요)
import { router } from 'expo-router';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { MissionConfig, WakeSoundId } from './types';
import { get } from './index';
import { wakeSoundFile } from '../sounds';

export type Run = {
  missions: MissionConfig[];
  index: number;
  preview: boolean;
  label: string;
  startedAt: number;
  wakeSound: WakeSoundId;
  volume: number;
  gentleWake: boolean;
};

let run: Run = { missions: [], index: 0, preview: true, label: '', startedAt: 0, wakeSound: 'dawn_bell', volume: 0.9, gentleWake: true };
let onDone: (() => void) | undefined;
let player: AudioPlayer | null = null;
let ramp: ReturnType<typeof setInterval> | undefined;
let missionActive = false;

export const getRun = () => run;
export const isMissionActive = () => missionActive;

const ROUTE: Record<MissionConfig['type'], string> = {
  squat: '/run/squat', walk: '/run/walk', photo: '/run/photo', barcode: '/run/scan', repeat_sentence: '/run/voice', rhythm: '/run/rhythm',
};

/** 알람 화면부터 시작. 미리보기면 기록을 남기지 않아요. */
export function startRun(missions: MissionConfig[], opts: {
  preview: boolean;
  label?: string;
  wakeSound?: WakeSoundId;
  volume?: number;
  gentleWake?: boolean;
  onDone?: () => void;
}) {
  const schedule = get('schedule');
  run = {
    missions,
    index: 0,
    preview: opts.preview,
    label: opts.label ?? '',
    startedAt: Date.now(),
    wakeSound: opts.wakeSound ?? schedule.wakeSound,
    volume: opts.volume ?? schedule.volume,
    gentleWake: opts.gentleWake ?? schedule.gentleWake,
  };
  missionActive = false;
  onDone = opts.onDone;
  startSound();
  router.push('/run/alarm');
}

/** 알람 화면의 "미션 시작" / 미션 하나를 끝냈을 때 */
export function goMission(index = run.index) {
  run = { ...run, index };
  const m = run.missions[index];
  if (!m) return finish();
  missionActive = true;
  quietAlarm(); // 미션을 하는 동안에는 기상 사운드를 완전히 꺼요
  router.replace(ROUTE[m.type] as never);
}
export const nextMission = () => goMission(run.index + 1);

export function backToAlarm() {
  missionActive = false;
  setVolume(1);
  router.replace('/run/alarm');
}

/** 다 끝냄: 미리보기면 완료 화면, 실제 알람이면 아침 화면(나중 묶음) */
export function finish() {
  missionActive = false;
  stopSound();
  if (!run.preview) onDone?.(); // 실제 알람이면 뒤따르는 알람을 지워요 (src/alarm.ts)
  onDone = undefined;
  router.replace('/run/done');
}

export function closeRun() {
  missionActive = false;
  stopSound();
  router.back();
}

// 기상 사운드: 작게 시작해 30초에 걸쳐 설정 음량까지 커짐
let level = 1;
function startSound() {
  stopSound();
  setAudioModeAsync({ allowsRecording: false, shouldRouteThroughEarpiece: false, playsInSilentMode: true });
  player = createAudioPlayer(wakeSoundFile(run.wakeSound));
  player.loop = true;
  player.volume = run.gentleWake ? 0 : run.volume;
  player.play();
  const t0 = Date.now();
  level = 1;
  ramp = setInterval(() => {
    if (!player) return;
    const k = run.gentleWake ? Math.min(1, (Date.now() - t0) / 30000) : 1;
    player.volume = run.volume * k * level;
  }, 500);
}
function setVolume(l: number) { level = l; }
/** 말하기 미션 중에는 마이크가 알람 소리를 듣지 않게 멈춰요 */
export function quietAlarm() {
  setVolume(0);
  if (player) player.volume = 0;
}
/** 어떤 길로 화면을 나가든 소리를 꺼요 (run/_layout에서도 불러요) */
export function stopSound() {
  clearInterval(ramp);
  player?.pause();
  player?.remove();
  player = null;
}
