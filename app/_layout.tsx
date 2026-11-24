import { useEffect } from 'react';
import { Appearance, AppState, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { ring, ringIfPending, scheduleAlarms } from '../src/alarm';
import { useSetting } from '../src/store';
import { getNightState, resumeNight } from '../src/store/night';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { color } from '../src/theme';

export default function RootLayout() {
  // 일정·알람이 바뀌면 알림 예약을 다시 해요
  const [schedule] = useSetting('schedule');
  const [alarms] = useSetting('alarms');
  const [wakeOnce] = useSetting('wakeOnce');
  const [prefs] = useSetting('prefs');
  useEffect(() => { scheduleAlarms().catch(() => {}); }, [schedule, alarms, wakeOnce]);
  useEffect(() => {
    // react-native-web에는 setColorScheme 구현이 없어요. 웹은 브라우저의 prefers-color-scheme을 따라갑니다.
    if (Platform.OS !== 'web') Appearance.setColorScheme(prefs.appearance === 'system' || !prefs.appearance ? 'unspecified' : prefs.appearance);
  }, [prefs.appearance]);

  useEffect(() => {
    const t = setTimeout(() => {
      // 밤중에 앱이 꺼졌다 다시 열렸으면 수면 중 화면으로 (기상 시각이 지났으면 아래 알람이 처리해요)
      if (resumeNight()) router.push(getNightState().phase === 'sound' ? '/night/sound' : '/night/session');
      ringIfPending().catch(() => {});
    }, 500); // ponytail: 화면 이동이 준비될 때까지 잠깐 기다려요
    const onRing = (n: Notifications.Notification) => { const k = n.request.content.data?.ring; if (typeof k === 'string') ring(k); };
    const a = Notifications.addNotificationReceivedListener(onRing);
    const b = Notifications.addNotificationResponseReceivedListener((r) => onRing(r.notification));
    // 알람을 정지하고 홈 화면에서 앱을 다시 열었을 때도 미션으로
    const c = AppState.addEventListener('change', (s) => { if (s === 'active') ringIfPending().catch(() => {}); });
    return () => { clearTimeout(t); a.remove(); b.remove(); c.remove(); };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
        <Stack.Screen name="(tabs)" />
        {/* 수면 | 기상, 알람 추가와 그 안의 화면들: 아래에서 올라오는 시트 */}
        <Stack.Screen name="(edit)" options={{ presentation: 'modal', gestureEnabled: false }} />
        {/* 알람 → 미션 (미리보기도 같은 흐름). 미션을 끝내야 나갈 수 있어요 */}
        <Stack.Screen name="run" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        {/* 수면 가이드 (탐색 탭에서) */}
        <Stack.Screen name="guide/breath" options={{ presentation: 'fullScreenModal', gestureEnabled: false, contentStyle: { backgroundColor: color.bg } }} />
        {/* 수면 중 화면들 */}
        <Stack.Screen name="night" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="report-dates" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.8], sheetCornerRadius: 28, contentStyle: { backgroundColor: color.card } }} />
        <Stack.Screen name="sound-sheet" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.86], sheetCornerRadius: 34, contentStyle: { backgroundColor: color.cardRaised } }} />
        <Stack.Screen name="sound-library" options={{ presentation: 'fullScreenModal', gestureEnabled: true, contentStyle: { backgroundColor: color.bg } }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
