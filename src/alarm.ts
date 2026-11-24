// 알람 울리기. 설치판은 AlarmKit(무음 모드에서도 울림), 없으면(Expo Go) 알림으로 대신 울려요.
// 정한 시각에 울리고, 앱을 열면 알람 화면 → 미션. AlarmKit 알람은 정지 버튼을 뺄 수 없어서,
// 미션을 끝낼 때까지 뒤따르는 알람을 미리 예약해 두고 끝내면 지워요 (SPEC 6.14).
import * as Notifications from 'expo-notifications';
import SlipperAlarm from '../modules/slipper-alarm';
import { get, set } from './store';
import { endNight, getNightState, nextWake } from './store/night';
import { isMissionActive, startRun } from './store/run';
import type { WakeSoundId } from './store/types';
import { toMin } from './time';

const FOLLOW_UPS = 5; // 알림판: 1분 간격
const MAX_RINGS = 10; // iOS는 예약 알림이 64개까지라 (1 + 5) x 10
const KIT_FOLLOW_UPS = 10; // AlarmKit판: 정지만 누르고 미션을 안 하면 3분마다 다시 (30분까지)
const KIT_FOLLOW_GAP = 3 * 60_000;
const NAG_GAP = 5 * 60_000; // 미션을 시작한 뒤에는 5분마다 (미션 중에 바로 다시 울리지 않게)
const RING_WINDOW = 60 * 60_000; // 울린 지 1시간 안이면 앱을 열 때 알람 화면

// 기상 사운드 id → 앱에 넣은 소리 파일 이름 (app.json의 expo-notifications sounds). 없는 건 새벽 종소리
const KIT_SOUND: Record<string, string> = {
  classic: 'classic.caf',
  dawn_bell: 'dawn_bell.caf',
  xylophone: 'xylophone.caf',
  sunrise_forest: 'sunrise_forest.caf',
  birds: 'birds.caf',
  stream: 'stream.caf',
  piano: 'piano.caf',
  wind_chime: 'wind_chime.caf',
  guitar: 'guitar.caf',
};
const kitSound = (wakeSound: WakeSoundId) => KIT_SOUND[wakeSound] ?? 'dawn_bell.caf';

type Ring = { key: string; at: Date; label: string; hasMissions: boolean; wakeSound: WakeSoundId };

/** 앞으로 7일 안에 울릴 것들 */
function upcomingRings(now = new Date()): Ring[] {
  const rings: Ring[] = [];
  const s = get('schedule');
  if (s.enabled) {
    let d = nextWake(now);
    for (let i = 0; i < 7; i++) {
      rings.push({ key: 'schedule@' + d.toISOString(), at: d, label: '', hasMissions: s.missions.length > 0, wakeSound: s.wakeSound });
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
      rings.push({ key: a.id + '@' + d.toISOString(), at: d, label: a.label, hasMissions: a.missions.length > 0, wakeSound: a.wakeSound });
      if (once) break;
    }
  }
  return rings.sort((x, y) => x.at.getTime() - y.at.getTime()).slice(0, MAX_RINGS);
}

/** 일정·알람이 바뀔 때마다 예약을 새로 해요 */
export async function scheduleAlarms() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (SlipperAlarm) return scheduleKit();
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

/** AlarmKit판 예약: 지금 미션 중인 알람의 것만 남기고 모두 새로 */
async function scheduleKit() {
  const kit = SlipperAlarm!;
  const active = get('activeRing');
  const keep = active ? { [active]: get('ringIds')[active] ?? [] } : {};
  const keepIds = new Set(Object.values(keep).flat());
  for (const ids of Object.values(get('ringIds'))) for (const id of ids) if (!keepIds.has(id)) kit.cancel(id);
  const rings = upcomingRings();
  const ringIds: Record<string, string[]> = { ...keep };
  set('ringIds', ringIds);
  if (!rings.length || !(await kit.requestAuthorization())) return;
  // 알림도 같이 하나 보내요. 알람 화면에서 바로 앱으로 들어올 수 있게 (소리는 알람이 내요)
  await Notifications.requestPermissionsAsync();
  for (const r of rings) {
    const sound = kitSound(r.wakeSound);
    const title = r.label || '좋은 아침이에요';
    const ids: string[] = [];
    for (let k = 0; k <= (r.hasMissions ? KIT_FOLLOW_UPS : 0); k++) ids.push(await kit.schedule(r.at.getTime() + k * KIT_FOLLOW_GAP, title, sound));
    ringIds[r.key] = ids;
    await Notifications.scheduleNotificationAsync({
      content: { title, body: r.hasMissions ? '눌러서 미션을 시작하세요. 미션을 끝내야 알람이 꺼져요.' : '눌러서 알람을 꺼요.', sound: false, data: { ring: r.key } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at },
    });
  }
  set('ringIds', ringIds);
}

const handled = new Set<string>();
const atOf = (key: string) => new Date(key.split('@')[1]).getTime();
let escapeAlarmId: string | null = null;
let escapeSequence = 0;

/** 실제 미션 도중 화면을 끄거나 앱을 벗어나면 곧바로 시스템 알람을 다시 울려요. */
export async function alarmIfMissionInterrupted() {
  const key = get('activeRing');
  if (!key || !SlipperAlarm || !isMissionActive()) return;
  const sequence = ++escapeSequence;
  if (escapeAlarmId) {
    SlipperAlarm.cancel(escapeAlarmId);
    escapeAlarmId = null;
  }
  const id = await SlipperAlarm.schedule(Date.now() + 1_500, '화면을 켜고 미션을 계속하세요', kitSound(soundForKey(key)));
  if (sequence !== escapeSequence || !isMissionActive() || get('activeRing') !== key) {
    SlipperAlarm.cancel(id);
    return;
  }
  escapeAlarmId = id;
  set('ringIds', { ...get('ringIds'), [key]: [...(get('ringIds')[key] ?? []), id] });
}

/** 미션 화면으로 돌아오면 회피 방지용 알람만 멈춰서 미션 중에는 조용하게 해요. */
export function silenceInterruptedMissionAlarm() {
  ++escapeSequence;
  if (!SlipperAlarm || !escapeAlarmId) return;
  SlipperAlarm.stop(escapeAlarmId);
  SlipperAlarm.cancel(escapeAlarmId);
  const key = get('activeRing');
  if (key) set('ringIds', { ...get('ringIds'), [key]: (get('ringIds')[key] ?? []).filter((id) => id !== escapeAlarmId) });
  escapeAlarmId = null;
}

/** 앱을 열었을 때·앞으로 돌아왔을 때: 울리는 중이거나 울린 지 1시간 안에 미션을 안 끝낸 알람이 있으면 알람 화면 */
export async function ringIfPending() {
  const tapped = Notifications.getLastNotificationResponse()?.notification;
  const shown = await Notifications.getPresentedNotificationsAsync();
  const now = Date.now();
  const fresh = (k: unknown): k is string => typeof k === 'string' && now >= atOf(k) - 60_000 && now - atOf(k) < RING_WINDOW && !get('doneRings').includes(k);
  let key = [tapped, ...shown].map((n) => n?.request.content.data?.ring).find(fresh);
  if (!key && SlipperAlarm) {
    const alerting = new Set(SlipperAlarm.alerting());
    const ringIds = get('ringIds');
    key = Object.keys(ringIds).find((k) => fresh(k) && (ringIds[k].some((id) => alerting.has(id)) || now >= atOf(k)));
  }
  if (key) await ring(key);
}

/** 알림이 왔거나(앱이 열려 있을 때) 알림을 눌렀을 때: 알람 화면을 띄워요 */
export async function ring(key: string) {
  if (handled.has(key) || get('doneRings').includes(key)) return;
  handled.add(key);
  // 남은 반복 알림은 지워요
  const left = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(left.filter((n) => n.content.data?.ring === key).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  await Notifications.dismissAllNotificationsAsync();
  const id = key.split('@')[0];
  const alarm = get('alarms').find((a) => a.id === id);
  const alarmSound = alarm ?? get('schedule');
  const missions = alarm ? alarm.missions : get('schedule').missions;
  if (SlipperAlarm) {
    // 울리는 알람은 멈추고(소리는 앱이 내요), 뒤따르는 알람은 미션 중에 바로 안 울리게 5분 간격으로 다시
    const kit = SlipperAlarm;
    for (const x of get('ringIds')[key] ?? []) { kit.stop(x); kit.cancel(x); }
    const ids: string[] = [];
    if (missions.length) for (let k = 1; k <= KIT_FOLLOW_UPS; k++) ids.push(await kit.schedule(Date.now() + k * NAG_GAP, '미션을 끝내야 알람이 꺼져요', kitSound(alarmSound.wakeSound)));
    set('ringIds', { ...get('ringIds'), [key]: ids });
    set('activeRing', key);
  }
  if (getNightState().active) endNight();
  if (alarm && !alarm.repeat.some(Boolean)) set('alarms', get('alarms').map((a) => (a.id === id ? { ...a, enabled: false } : a))); // 1회성은 울린 뒤 꺼요
  startRun(missions, {
    preview: false,
    label: alarm?.label,
    wakeSound: alarmSound.wakeSound,
    volume: alarmSound.volume,
    gentleWake: alarmSound.gentleWake,
    onDone: () => doneRing(key),
  });
}

function soundForKey(key: string): WakeSoundId {
  const id = key.split('@')[0];
  return get('alarms').find((alarm) => alarm.id === id)?.wakeSound ?? get('schedule').wakeSound;
}

/** 미션까지 다 끝냄: 뒤따르는 알람을 모두 지워요 */
function doneRing(key: string) {
  ++escapeSequence;
  escapeAlarmId = null;
  if (SlipperAlarm) for (const id of get('ringIds')[key] ?? []) SlipperAlarm.cancel(id);
  const { [key]: _, ...rest } = get('ringIds');
  set('ringIds', rest);
  set('activeRing', null);
  set('doneRings', [key, ...get('doneRings')].slice(0, 30));
}

// 앱이 열려 있을 때는 알림 배너·소리 대신 바로 알람 화면 (기상 사운드는 앱이 틀어요)
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});
