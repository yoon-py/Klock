// 리포트 계산 (SPEC 6.17). 폰으로 정확히 남는 것만: 잔 시간, 이번 주, 일어나기, 밤사이 소리
import { get, getNights, type NightRecord } from './store';
import { toMin } from './time';

export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const atDate = (date: string, hhmm: string) => {
  const [y, m, d] = date.split('-').map(Number), t = toMin(hhmm);
  return new Date(y, m - 1, d, Math.floor(t / 60), t % 60);
};

/** 잔 시간(분): 수면 시작 → 알람. 알람 기록이 아직 없으면 그날 기상 시각까지 */
export function sleptMin(n: NightRecord) {
  if (!n.sleepStart) return null;
  const end = n.alarmAt ? new Date(n.alarmAt) : atDate(n.date, get('schedule').wakeTime);
  const m = Math.round((end.getTime() - new Date(n.sleepStart).getTime()) / 60_000);
  return m > 0 ? m : null;
}
/** 일어나기(초): 알람 → 미션 완료 */
export function wakeSec(n: NightRecord) {
  if (!n.alarmAt || !n.missionDoneAt) return null;
  return Math.round((new Date(n.missionDoneAt).getTime() - new Date(n.alarmAt).getTime()) / 1000);
}

export const nightOf = (date: string) => getNights(60).find((n) => n.date === date);

/** 이번 주(월~일) 날짜 7개 */
export function weekDates(of: Date) {
  const monday = new Date(of);
  monday.setDate(of.getDate() - ((of.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return ymd(d); });
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
export function weekStats(of: Date) {
  const nights = getNights(60);
  const days = weekDates(of).map((date) => {
    const n = nights.find((x) => x.date === date);
    return { date, slept: n ? sleptMin(n) : null, wake: n ? wakeSec(n) : null, goal: n?.goalMinutes ?? null };
  });
  return {
    days,
    avgSlept: avg(days.flatMap((d) => (d.slept ? [d.slept] : []))),
    avgWake: avg(days.flatMap((d) => (d.wake !== null ? [d.wake] : []))),
  };
}
