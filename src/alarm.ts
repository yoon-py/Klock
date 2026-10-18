// 알람 울리기 (Expo Go 판). 정한 시각에 알림을 보내고, 누르거나 앱이 열려 있으면 알람 화면 → 미션.
// ponytail: 알림 소리는 기본음 한 번뿐이라 1분 간격으로 5번 더 보내요. 무음 모드·잠금 화면에서 계속 울리는 건 AlarmKit(설치판)에서.
import * as Notifications from 'expo-notifications';
import { get, set } from './store';
import { endNight, getNightState, nextWake } from './store/night';
import { startRun } from './store/run';
import { toMin } from './time';

const FOLLOW_UPS = 5;
const MAX_RINGS = 10; // iOS는 예약 알림이 64개까지라 (1 + 5) x 10

type Ring = { key: string; at: Date; label: string; hasMissions: boolean };

/** 앞으로 7일 안에 울릴 것들 */
function upcomingRings(now = new Date()): Ring[] {
  const rings: Ring[] = [];
  const s = get('schedule');
  if (s.enabled) {
    let d = nextWake(now);
    for (let i = 0; i < 7; i++) {
      rings.push({ key: 'schedule@' + d.toISOString(), at: d, label: '', hasMissions: s.missions.length > 0 });
      d = nextWake(new Date(d.getTime() + 60_000));
    }
  }
  for (const a of get('alarms')) {
    if (!a.enabled) continue;
    const once = !a.repeat.some(Boolean);
    const t = toMin(a.time);
    for (let i = 0; i < 8; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      d.setHours(Math.floor(t / 60), t % 60, 0, 0);
      if (d <= now || (!once && !a.repeat[d.getDay()])) continue;
      rings.push({ key: a.id + '@' + d.toISOString(), at: d, label: a.label, hasMissions: a.missions.length > 0 });
      if (once) break;
    }
  }
  return rings.sort((x, y) => x.at.getTime() - y.at.getTime()).slice(0, MAX_RINGS);
}

/** 일정·알람이 바뀔 때마다 예약을 새로 해요 */
export async function scheduleAlarms() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const rings = upcomingRings();
  if (!rings.length) return;
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return;
  for (const r of rings) {
    for (let k = 0; k <= FOLLOW_UPS; k++) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: r.label || '좋은 아침이에요',
          body: r.hasMissions ? '미션을 끝내야 알람이 꺼져요.' : '눌러서 알람을 꺼요.',
          sound: true,
          data: { ring: r.key },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(r.at.getTime() + k * 60_000) },
      });
    }
  }
}

const handled = new Set<string>();

/** 앱을 열었을 때: 알림을 눌러 열었거나, 울린 알림이 아직 남아 있으면 알람 화면 */
export async function ringIfPending() {
  const tapped = Notifications.getLastNotificationResponse()?.notification;
  const shown = await Notifications.getPresentedNotificationsAsync();
  // 지난번에 누른 알림이 다시 잡히지 않게, 30분 안에 울린 것만
  const fresh = (k: unknown): k is string => typeof k === 'string' && Math.abs(Date.now() - new Date(k.split('@')[1]).getTime()) < 30 * 60_000;
  const key = [tapped, ...shown].map((n) => n?.request.content.data?.ring).find(fresh);
  if (key) await ring(key);
}

/** 알림이 왔거나(앱이 열려 있을 때) 알림을 눌렀을 때: 알람 화면을 띄워요 */
export async function ring(key: string) {
  if (handled.has(key)) return;
  handled.add(key);
  // 남은 반복 알림은 지워요
  const left = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(left.filter((n) => n.content.data?.ring === key).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  await Notifications.dismissAllNotificationsAsync();
  if (getNightState().active) endNight();
  const id = key.split('@')[0];
  const alarm = get('alarms').find((a) => a.id === id);
  if (alarm && !alarm.repeat.some(Boolean)) set('alarms', get('alarms').map((a) => (a.id === id ? { ...a, enabled: false } : a))); // 1회성은 울린 뒤 꺼요
  startRun(alarm ? alarm.missions : get('schedule').missions, { preview: false, label: alarm?.label });
}

// 앱이 열려 있을 때는 알림 배너·소리 대신 바로 알람 화면 (기상 사운드는 앱이 틀어요)
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});
