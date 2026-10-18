// 시트에서 고치는 중인 값. 저장(체크)을 눌러야 진짜 저장소에 들어가고, ×로 닫으면 버려요.
// 수면 | 기상(PlanEdit)과 알람 추가(AlarmAdd)가 미션·소리 화면을 같이 써서 한 곳에 둬요.
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { get, set, type ExtraAlarm, type MissionConfig, type SleepSchedule } from './index';

type Draft = { schedule: SleepSchedule; alarm: ExtraAlarm | null };

let draft: Draft = { schedule: get('schedule'), alarm: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function startPlanDraft() {
  draft = { schedule: structuredClone(get('schedule')), alarm: null };
  emit();
}

export function startAlarmDraft(id?: string) {
  const now = new Date();
  const repeat = [false, false, false, false, false, false, false];
  repeat[now.getDay()] = true; // 처음엔 오늘 요일 하나 (SPEC 6.2)
  const existing = get('alarms').find((a) => a.id === id);
  draft = {
    schedule: structuredClone(get('schedule')),
    alarm: existing
      ? structuredClone(existing)
      : {
          id: String(Date.now()),
          enabled: true,
          time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
          label: '',
          repeat,
          missions: [],
          antiSnooze: true,
        },
  };
  emit();
}

export function updateDraft(fn: (d: Draft) => void) {
  const next = structuredClone(draft);
  fn(next);
  draft = next;
  emit();
}

/** 지금 고치는 미션 목록 (알람 추가 중이면 그 알람 것, 아니면 수면 일정 것) */
export const draftMissions = (d: Draft): MissionConfig[] => (d.alarm ? d.alarm.missions : d.schedule.missions);
export function setDraftMissions(missions: MissionConfig[]) {
  updateDraft((d) => {
    if (d.alarm) d.alarm.missions = missions;
    else d.schedule.missions = missions;
  });
}

export function commitDraft() {
  if (draft.alarm) {
    const alarms = get('alarms').filter((a) => a.id !== draft.alarm!.id);
    set('alarms', [...alarms, draft.alarm].sort((a, b) => a.time.localeCompare(b.time)));
    // 소리·음량은 수면 일정 값을 같이 써요 (SPEC 6.2)
    const s = get('schedule');
    set('schedule', { ...s, wakeSound: draft.schedule.wakeSound, volume: draft.schedule.volume, haptics: draft.schedule.haptics });
  } else {
    if (draft.schedule.wakeTime !== get('schedule').wakeTime) set('wakeOnce', null); // 일정을 바꾸면 한 번만 바꾼 기상은 지워요
    set('schedule', { ...draft.schedule, enabled: true });
  }
}

export function useDraft() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => draft,
  );
}

/**
 * 미션 시트에서 막 고른 미션의 설정 화면용: 저장하지 않고 나가면 그 미션을 칸에서 빼요.
 * kept()가 화면을 떠날 때 false면 뺌.
 */
export function useDropIfAbandoned(i: number, adding: boolean, kept: () => boolean) {
  const keptRef = useRef(kept);
  keptRef.current = kept;
  useEffect(() => () => {
    if (adding && !keptRef.current()) setDraftMissions(draftMissions(draft).filter((_, j) => j !== i));
  }, [i, adding]);
}

export const getDraft = () => draft;
