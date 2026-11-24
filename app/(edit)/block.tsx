// 앱 제한 · 잠그지 않을 앱 (SPEC 6.7, 디자인 BlockSetup)
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { color, font } from '../../src/theme';

export default function BlockSetup() {
  // ponytail: 고른 앱 목록은 앱 잠금 단계에서 스크린 타임 선택 화면(FamilyActivityPicker) 결과로 채워요
  const count = 2;
  return (
    <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={{ paddingBottom: 48 }}>
      <Pressable onPress={() => router.back()} style={st.back}>
        <SymbolView name="chevron.left" size={18} tintColor={color.accent} weight="semibold" />
        <Text style={{ fontSize: 17, color: color.accent }}>수면 | 기상</Text>
      </Pressable>
      <View style={{ paddingHorizontal: 20, paddingTop: 2, gap: 8 }}>
        <Text style={{ ...font.largeTitle, color: color.text }}>앱 제한</Text>
        <Text style={{ fontSize: 15, lineHeight: 22, color: color.textSecondary }}>잠그는 시각부터는 아래 앱만 열리고 나머지는 모두 잠겨요. 아침 미션을 끝내면 다시 열려요.</Text>
      </View>
      <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 7 }}>
        <Text style={{ ...font.footnote, color: color.textSecondary, paddingLeft: 16 }}>잠그지 않을 앱 · {count}개</Text>
        <View style={st.group}>
          <AppRow icon="moon.fill" tile="#2C2C30" tint="#D1D1D6" name="Slipper" />
          <AppRow icon="phone.fill" tile="#30A46C" tint="#FFF" name="전화 · 긴급 통화" />
          <Pressable
            onPress={() => Alert.alert('스크린 타임 앱 선택', '애플의 앱 선택 화면은 설치판(TestFlight)에서 열려요.')}
            style={({ pressed }) => [st.row, pressed && { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
            <View style={[st.tile, { backgroundColor: 'rgba(0,221,179,0.14)' }]}>
              <SymbolView name="plus" size={15} tintColor={color.accent} weight="bold" />
            </View>
            <Text style={{ fontSize: 17, color: color.accent }}>열어 둘 앱 더하기</Text>
          </Pressable>
        </View>
        <Text style={{ fontSize: 13, lineHeight: 19, color: color.textSecondary, paddingHorizontal: 16 }}>
          여기 없는 앱은 새로 설치한 앱까지 모두 잠겨요. 스크린 타임으로 잠가요. 급할 때는 침대 모드의 '긴급 잠금 해제'를 쓰면 돼요.
        </Text>
      </View>
    </ScrollView>
  );
}

function AppRow({ icon, tile, tint, name }: { icon: SFSymbol; tile: string; tint: string; name: string }) {
  return (
    <View style={[st.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator }]}>
      <View style={[st.tile, { backgroundColor: tile }]}>
        <SymbolView name={icon} size={16} tintColor={tint} />
      </View>
      <Text style={{ fontSize: 17, color: color.text, flex: 1 }}>{name}</Text>
      <Text style={{ fontSize: 15, color: color.textSecondary }}>항상 열림</Text>
    </View>
  );
}

const st = StyleSheet.create({
  back: { height: 44, marginTop: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  group: { borderRadius: 22, backgroundColor: color.card, overflow: 'hidden' },
  row: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
  tile: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
