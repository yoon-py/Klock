import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function NightLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#08080C' } }} />
    </>
  );
}
