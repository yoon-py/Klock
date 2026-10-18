import { Stack } from 'expo-router';

export default function NightLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#08080C' } }} />;
}
