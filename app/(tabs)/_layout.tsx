// iOS 26 기본 떠 있는 반투명 탭바 (디자인의 탭바와 같은 모양)
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform, StyleSheet, type ColorValue } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { color } from '../../src/theme';

export default function TabsLayout() {
  if (Platform.OS === 'web') return <WebTabs />;

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
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>탐색</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="report">
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
        <NativeTabs.Trigger.Label>리포트</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function WebTabIcon({ name, tint }: { name: 'alarm' | 'sleep' | 'explore' | 'report'; tint: ColorValue }) {
  if (name === 'alarm') {
    return (
      <Svg width={25} height={25} viewBox="0 0 24 24">
        <G fill={tint}>
          <Path d="M5.6 2.6a1 1 0 0 1 .1 1.4L3.6 6.2a1 1 0 1 1-1.5-1.3l2.1-2.2a1 1 0 0 1 1.4-.1zm12.8 0a1 1 0 0 1 1.4.1l2.1 2.2a1 1 0 1 1-1.5 1.3L18.3 4a1 1 0 0 1 .1-1.4z" />
          <Path d="M12 4.6a8.4 8.4 0 1 1 0 16.8 8.4 8.4 0 0 1 0-16.8zm1 4a1 1 0 1 0-2 0v4.3c0 .3.1.5.3.7l2.4 2.4a1 1 0 0 0 1.4-1.4L13 12.5z" />
        </G>
      </Svg>
    );
  }
  if (name === 'sleep') {
    return <Svg width={25} height={25} viewBox="0 0 24 24"><Path fill={tint} d="M20.6 14.7a.7.7 0 0 0-.9-.6 7.6 7.6 0 0 1-9.8-9.8.7.7 0 0 0-.6-.9 9 9 0 1 0 11.3 11.3z" /></Svg>;
  }
  if (name === 'explore') {
    return (
      <Svg width={25} height={25} viewBox="0 0 24 24">
        <Path fill={tint} d="M10.5 3a7.5 7.5 0 1 1-4.8 13.3l-3.4 3.4a1 1 0 0 1-1.4-1.4l3.4-3.4A7.5 7.5 0 0 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" />
      </Svg>
    );
  }
  return (
    <Svg width={25} height={25} viewBox="0 0 24 24">
      <G fill={tint}>
        <Rect x="3.5" y="12.5" width="4.4" height="8" rx="1.4" />
        <Rect x="9.8" y="7.5" width="4.4" height="13" rx="1.4" />
        <Rect x="16.1" y="3.5" width="4.4" height="17" rx="1.4" />
      </G>
    </Svg>
  );
}

function WebTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'bottom',
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: '#A1A1A8',
        tabBarActiveBackgroundColor: 'rgba(255,255,255,0.12)',
        tabBarLabelStyle: web.label,
        tabBarItemStyle: web.item,
        tabBarStyle: web.bar,
      }}>
      <Tabs.Screen name="index" options={{ title: '알람', tabBarIcon: ({ color: tint }) => <WebTabIcon name="alarm" tint={tint} /> }} />
      <Tabs.Screen name="sleep" options={{ title: '수면', tabBarIcon: ({ color: tint }) => <WebTabIcon name="sleep" tint={tint} /> }} />
      <Tabs.Screen name="explore" options={{ title: '탐색', tabBarIcon: ({ color: tint }) => <WebTabIcon name="explore" tint={tint} /> }} />
      <Tabs.Screen name="report" options={{ title: '리포트', tabBarIcon: ({ color: tint }) => <WebTabIcon name="report" tint={tint} /> }} />
    </Tabs>
  );
}

const web = StyleSheet.create({
  bar: {
    position: 'absolute', left: 20, right: 20, bottom: 25, height: 62,
    padding: 4, borderTopWidth: 0, borderRadius: 31,
    backgroundColor: 'rgba(38,38,42,0.55)', shadowColor: '#000',
    shadowOpacity: 0.45, shadowRadius: 15, shadowOffset: { width: 0, height: 10 },
  },
  item: { borderRadius: 27 },
  label: { fontSize: 10, lineHeight: 12, fontWeight: '600', marginTop: 1 },
});
