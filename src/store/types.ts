// SPEC.md 5장 데이터 모델
export type MissionConfig =
  | { type: 'squat'; count: 5 | 10 | 15 | 20 | 25 | 30 }
  | { type: 'walk'; steps: 20 | 30 | 50 | 70 | 100 | 150 }
  | { type: 'photo'; photoIds: string[] }
  | { type: 'barcode'; codeIds: string[] }
  | { type: 'repeat_sentence'; sentenceIds: string[]; count: 1 | 2 | 3 | 4 | 5 }
  | { type: 'rhythm'; sentenceIds: string[]; rounds: 1 | 2 | 3 | 4 | 5; bgmLevel: 0 | 1 | 2 };

export type WakeSoundId =
  | 'dawn_bell' | 'sunrise_forest' | 'birds' | 'stream' | 'piano'
  | 'xylophone' | 'wind_chime' | 'guitar' | 'classic';

export type SceneId = 'fire' | 'rain' | 'sea' | 'train' | 'snow' | 'bugs' | 'fan' | 'white' | 'pink' | 'brown';

export type SleepSchedule = {
  enabled: boolean;
  bedtime: string; // "23:30"
  wakeTime: string; // "07:00"
  missions: MissionConfig[];
  antiSnooze: boolean;
  wakeSound: WakeSoundId;
  haptics: 'default' | 'none';
  volume: number;
  gentleWake: boolean;
  // ponytail: allowList는 앱 잠금 단계(6)에서 스크린 타임 토큰으로 채워요
  lock: { allowList: string | null; leadMinutes: 30 | 60 | 90 | 120 };
};

export type ExtraAlarm = {
  id: string;
  enabled: boolean;
  time: string;
  label: string;
  repeat: boolean[]; // 일~토 7칸
  missions: MissionConfig[];
  antiSnooze: boolean;
  wakeSound: WakeSoundId;
  haptics: 'default' | 'none';
  volume: number;
  gentleWake: boolean;
};

export type SleepSound = {
  scenes: SceneId[];
  volumes: { sceneA: number; sceneB: number };
  offAfter: 30 | 60 | 'morning';
  favorites: SceneId[];
  recent: SceneId[][]; // 최근에 들은 조합, 최대 3개
};

export type NightRecord = {
  date: string;
  sleepStart?: string;
  alarmAt: string;
  missionDoneAt?: string;
  goalMinutes: number;
  sounds: { id: string; kind: 'snore' | 'talk'; at: string; durationSec: number; file: string }[];
  emergencyUnlocks: { at: string; kind: '5min' | 'night' }[];
};
