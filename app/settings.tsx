// 설정 (SPEC 6.18, 디자인 Settings). v1은 로그인이 없어서 프로필 줄은 없어요.
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import Constants from 'expo-constants';
import type { SFSymbol } from 'sf-symbols-typescript';
import { Switch } from '../src/components';
import { useSetting } from '../src/store';
import { color, font } from '../src/theme';

export default function Settings() {
  const [prefs, setPrefs] = useSetting('prefs');
  const appearance = prefs.appearance ?? 'system';
  const setAppearance = (next: 'system' | 'light' | 'dark') => setPrefs({ ...prefs, appearance: next });
  return (
    <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={{ paddingTop: 54, paddingBottom: 48 }}>
      <Pressable onPress={() => router.back()} style={st.back}>
        <SymbolView name="chevron.left" size={18} tintColor={color.accent} weight="semibold" />
        <Text style={{ fontSize: 17, color: color.accent }}>리포트</Text>
      </Pressable>
      <Text style={{ ...font.largeTitle, color: color.text, paddingHorizontal: 20 }}>설정</Text>

      <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 24 }}>
        <View style={{ gap: 7 }}>
          <Text style={st.caption}>화면</Text>
          <View style={st.group}>
            <Row icon="circle.lefthalf.filled" tile="#636366" title="시스템 설정" divider onPress={() => setAppearance('system')}
              right={appearance === 'system' ? <SymbolView name="checkmark" size={16} tintColor={color.accent} weight="semibold" /> : null} />
            <Row icon="sun.max.fill" tile="#8E8E93" title="라이트" divider onPress={() => setAppearance('light')}
              right={appearance === 'light' ? <SymbolView name="checkmark" size={16} tintColor={color.accent} weight="semibold" /> : null} />
            <Row icon="moon.fill" tile="#163D48" title="다크" onPress={() => setAppearance('dark')}
              right={appearance === 'dark' ? <SymbolView name="checkmark" size={16} tintColor={color.accent} weight="semibold" /> : null} />
          </View>
        </View>

        <View style={{ gap: 7 }}>
          <Text style={st.caption}>기록</Text>
          <View style={st.group}>
            <Row icon="mic.fill" tile="#E5484D" title="밤사이 소리 녹음" sub="코골이·잠꼬대만 7일 보관" divider
              right={<Switch value={prefs.recordNight} onValueChange={(v) => setPrefs({ ...prefs, recordNight: v })} accessibilityLabel="밤사이 소리 녹음" />} />
            <Row icon="lock.fill" tile="#5E5CE6" title="권한" onPress={() => Linking.openSettings()} />
          </View>
          <Text style={[st.caption, { lineHeight: 19 }]}>녹음은 폰 안에서만 분석하고 밖으로 보내지 않아요. 알람, 미션, 소리, 앱 제한은 알람 탭에서 바꿔요.</Text>
        </View>

        <View style={st.group}>
          {/* TODO: 튜토리얼 묶음에서 연결 */}
          <Row icon="moon.fill" tile="#1E1F4A" title="사용법 다시 보기" divider onPress={() => {}} />
          <Row icon="square.grid.2x2.fill" tile="#636366" title="버전" right={<Text style={{ fontSize: 15, color: color.textSecondary }}>{Constants.expoConfig?.version}</Text>} />
        </View>
      </View>
    </ScrollView>
  );
}

function Row({ icon, tile, title, sub, right, onPress, divider }: { icon: SFSymbol; tile: string; title: string; sub?: string; right?: React.ReactNode; onPress?: () => void; divider?: boolean }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [st.row, divider && st.sep, pressed && { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
      <View style={[st.tile, { backgroundColor: tile }]}><SymbolView name={icon} size={16} tintColor="#FFF" /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 17, color: color.text }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 13, color: color.textSecondary }}>{sub}</Text> : null}
      </View>
      {right ?? (onPress ? <SymbolView name="chevron.right" size={13} tintColor="#5A5A5F" weight="semibold" /> : null)}
    </Pressable>
  );
}

const st = StyleSheet.create({
  back: { height: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  caption: { fontSize: 13, color: color.textSecondary, paddingHorizontal: 16 },
  group: { borderRadius: 22, backgroundColor: color.card, overflow: 'hidden' },
  row: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
  sep: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator },
  tile: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
