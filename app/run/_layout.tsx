import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { alarmIfMissionInterrupted, silenceInterruptedMissionAlarm } from '../../src/alarm';
import { isMissionActive, stopSound } from '../../src/store/run';

export default function RunLayout() {
  useEffect(() => stopSound, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (!isMissionActive()) return;
      if (state === 'active') silenceInterruptedMissionAlarm();
      else if (state === 'background') alarmIfMissionInterrupted().catch(() => {});
    });
    return () => sub.remove();
  }, []);
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', gestureEnabled: false, contentStyle: { backgroundColor: '#000' } }} />
    </>
  );
}
