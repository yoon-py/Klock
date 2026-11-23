// 저장소는 이 파일 하나로 모아요. 나중에 백업·동기화를 붙일 때 여기만 바꾸면 돼요.
import { useSyncExternalStore } from 'react';
import Storage from 'expo-sqlite/kv-store';
import * as SQLite from 'expo-sqlite';
import type { ExtraAlarm, NightRecord, SleepSchedule, SleepSound } from './types';

export * from './types';

// 기본값: SPEC.md 5장
const defaults = {
  schedule: {
    enabled: false,
    bedtime: '23:30',
    wakeTime: '07:00',
    missions: [],
    antiSnooze: true,
    wakeSound: 'dawn_bell',
    haptics: 'default',
    volume: 0.9,
    lock: { allowList: null, leadMinutes: 60 },
  } as SleepSchedule,
  // 수면 탭 다이얼로 "다음 기상 한 번만" 바꾼 것. replaces = 대신하는 원래 기상 시각
  wakeOnce: null as { at: string; replaces: string } | null,
  alarms: [] as ExtraAlarm[],
  sleepSound: {
    scenes: ['fire'],
    volumes: { sceneA: 0.75, sceneB: 0.5 },
    offAfter: 30,
    favorites: [],
    recent: [],
  } as SleepSound,
  // 사진·바코드 미션에 등록한 것들 (파일은 앱 문서 폴더)
  photos: [] as { id: string; uri: string }[],
  codes: [] as { id: string; value: string; name: string; photoUri?: string }[],
  // 설정: 밤사이 소리 녹음 (끄면 듣지도 않아요, SPEC 9장)
  prefs: { recordNight: true },
  // 처음 한 번만 보이는 안내들 (튜토리얼, 앱 제한·사운드 안내, 폰 두는 곳)
  seen: { tour: false, hintBlock: false, hintSound: false, phoneTip: false },
  // AlarmKit 알람 (src/alarm.ts): 울릴 것(key) → 예약한 알람 id들, 지금 미션 중인 것, 미션까지 끝낸 것
  ringIds: {} as Record<string, string[]>,
  activeRing: null as string | null,
  doneRings: [] as string[],
  // 수면 중 상태 (src/store/night.ts). 밤중에 앱이 꺼졌다 다시 열려도 이어서 하려고 저장해요
  night: { active: false, phase: 'sound' as 'sound' | 'listen', startedAt: 0, offAt: null as number | null, wakeAt: 0 },
};
type Settings = typeof defaults;
type Key = keyof Settings;

const cache: Partial<Settings> = {};
const listeners = new Set<() => void>();

export function get<K extends Key>(key: K): Settings[K] {
  if (!(key in cache)) {
    const raw = Storage.getItemSync(key);
    cache[key] = raw ? JSON.parse(raw) : defaults[key];
  }
  return cache[key] as Settings[K];
}

export function set<K extends Key>(key: K, value: Settings[K]) {
  cache[key] = value;
  Storage.setItemSync(key, JSON.stringify(value));
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** 화면에서 쓰는 방법: const [schedule, setSchedule] = useSetting('schedule') */
export function useSetting<K extends Key>(key: K) {
  const value = useSyncExternalStore(subscribe, () => get(key));
  return [value, (v: Settings[K]) => set(key, v)] as const;
}

// 수면 기록은 날짜별로 쌓이니 SQLite 표에 둬요. 내용은 JSON 한 칸.
const db = SQLite.openDatabaseSync('slipper.db');
db.execSync('CREATE TABLE IF NOT EXISTS nights (date TEXT PRIMARY KEY, data TEXT NOT NULL)');

export function saveNight(night: NightRecord) {
  db.runSync('INSERT OR REPLACE INTO nights (date, data) VALUES (?, ?)', night.date, JSON.stringify(night));
}

export function getNights(limit = 30): NightRecord[] {
  return db
    .getAllSync<{ data: string }>('SELECT data FROM nights ORDER BY date DESC LIMIT ?', limit)
    .map((r) => JSON.parse(r.data));
}
