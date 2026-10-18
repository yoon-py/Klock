// 미션 문장 고르기 (디자인 MissionRhythmPick). 리듬·따라 말하기가 같이 써요. 1개 이상 골라야 저장돼요.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { RHYTHM_SENTENCES, VOICE_SENTENCES } from '../../../src/missions';
import { draftMissions, setDraftMissions, useDraft } from '../../../src/store/draft';
import { color } from '../../../src/theme';

export default function RhythmPick() {
  const i = Number(useLocalSearchParams<{ i: string }>().i ?? 0);
  const list = draftMissions(useDraft());
  const m = list[i]?.type === 'rhythm' || list[i]?.type === 'repeat_sentence' ? list[i] : null;
  const [sel, setSel] = useState<string[]>(m?.sentenceIds ?? []);
  if (!m) return null;
  const pool = m.type === 'rhythm' ? RHYTHM_SENTENCES : VOICE_SENTENCES;
  const all = sel.length === pool.length;

  const save = () => {
    const next = list.slice();
    next[i] = { ...m, sentenceIds: pool.filter((x) => sel.includes(x)) };
    setDraftMissions(next);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.card }}>
      <View style={st.header}>
        <Pressable onPress={() => router.back()} style={st.textBtn}><Text style={{ fontSize: 17, color: color.text }}>취소</Text></Pressable>
        <Text style={{ fontSize: 17, fontWeight: '600', color: color.text }}>미션 문장 고르기</Text>
        <Pressable disabled={sel.length === 0} onPress={save} style={st.textBtn}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: sel.length ? color.text : color.textTertiary }}>저장</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}>
        <Check label="전체 선택" on={all} onPress={() => setSel(all ? [] : [...pool])} />
        {pool.map((x) => (
          <Check key={x} label={x} on={sel.includes(x)} onPress={() => setSel(sel.includes(x) ? sel.filter((y) => y !== x) : [...sel, x])} />
        ))}
      </ScrollView>
    </View>
  );
}

function Check({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress} style={st.row}>
      <View style={[st.box, on ? { backgroundColor: color.accent } : { borderWidth: 2, borderColor: color.textTertiary }]}>
        {on ? <SymbolView name="checkmark" size={14} tintColor="#FFF" weight="bold" /> : null}
      </View>
      <Text style={{ fontSize: 17, color: color.text }}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  header: { height: 52, marginTop: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textBtn: { height: 44, paddingHorizontal: 8, justifyContent: 'center' },
  row: { height: 54, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 18 },
  box: { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});
