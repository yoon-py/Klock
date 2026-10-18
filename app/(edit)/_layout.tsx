import { Stack } from 'expo-router';
import { color } from '../../src/theme';

export default function EditLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.card } }}>
      <Stack.Screen name="mission-pick" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.82], sheetGrabberVisible: false, sheetCornerRadius: 34 }} />
      <Stack.Screen name="lock-lead" options={{ presentation: 'formSheet', sheetAllowedDetents: [0.7], sheetCornerRadius: 34 }} />
      <Stack.Screen name="mission/photo-cam" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#000' } }} />
      <Stack.Screen name="mission/code-scan" options={{ presentation: 'fullScreenModal', contentStyle: { backgroundColor: '#000' } }} />
    </Stack>
  );
}
