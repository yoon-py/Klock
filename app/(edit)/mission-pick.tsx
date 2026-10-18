// 미션 고르기 시트 (SPEC 6.5, 디자인 MissionPick)
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { MISSIONS, MISSION_GROUPS, type MissionType } from '../../src/missions';
import { draftMissions, setDraftMissions, useDraft } from '../../src/store/draft';
import { color } from '../../src/theme';

export default function MissionPick() {
  const { at } = useLocalSearchParams<{ at?: string }>();
  const list = draftMissions(useDraft());

  const pick = (type: MissionType) => {
    if (list.some((m) => m.type === type)) return; // 이미 고른 미션은 다시 못 골라요
    Haptics.selectionAsync();
    const next = list.slice();
    const i = at !== undefined ? Number(at) : next.length;
    next[i] = MISSIONS[type].make();
    setDraftMissions(next);
    router.back();
    // 설정할 게 있는 미션은 바로 설정 화면으로. 거기서 저장해야 칸에 남아요.
    const settings = MISSIONS[type].settings;
    if (settings) router.push({ pathname: settings as never, params: { i, adding: at === undefined ? 1 : 0 } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.card }}>
      <View style={st.header}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: color.text }}>미션</Text>
        <Pressable accessibilityLabel="닫기" onPress={() => router.back()} style={st.close}>
          <SymbolView name="xmark" size={18} tintColor="#FFFFFF" weight="semibold" />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }}>
        {MISSION_GROUPS.map((g) => (
          <View key={g.title} style={{ paddingTop: 14, gap: 4 }}>
            <Text style={st.group}>{g.title}</Text>
            {g.types.map((t) => {
              const m = MISSIONS[t];
              const added = list.some((x) => x.type === t);
              return (
                <Pressable key={t} onPress={() => pick(t)} accessibilityState={{ disabled: added, selected: added }} style={({ pressed }) => [st.row, pressed && !added && { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                  <View style={[st.tile, { backgroundColor: m.bg }]}>
                    <SymbolView name={m.icon} size={28} tintColor={m.fg} />
                  </View>
                  <Text style={{ fontSize: 18, color: color.text }}>{m.name}</Text>
                  <View style={{ flex: 1 }} />
                  {added ? <SymbolView name="checkmark" size={18} tintColor={color.accent} weight="bold" /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  header: { height: 64, alignItems: 'center', justifyContent: 'center' },
  close: { position: 'absolute', right: 12, top: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  group: { fontSize: 15, color: color.textSecondary, paddingHorizontal: 12, paddingBottom: 4 },
  row: { minHeight: 72, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 18 },
  tile: { width: 56, height: 56, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
