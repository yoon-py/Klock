// iOS 26 기본 떠 있는 반투명 탭바 (디자인의 탭바와 같은 모양)
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { color } from '../../src/theme';

export default function TabsLayout() {
  return (
    <NativeTabs tintColor={color.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="alarm.fill" md="alarm" />
        <NativeTabs.Trigger.Label>알람</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sleep">
        <NativeTabs.Trigger.Icon sf="moon.fill" md="bedtime" />
        <NativeTabs.Trigger.Label>수면</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="report">
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
        <NativeTabs.Trigger.Label>리포트</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
