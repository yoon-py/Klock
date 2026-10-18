import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { stopSound } from '../../src/store/run';

export default function RunLayout() {
  useEffect(() => stopSound, []);
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', gestureEnabled: false, contentStyle: { backgroundColor: '#000' } }} />;
}
