// 수면 사운드 시트. 작은 화면과 큰 글자에서도 헤더·행이 겹치지 않게 세로로 흘러요.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { get, set, type SleepSound } from '../src/store';
import { getNightState, startSound } from '../src/store/night';
import { SCENES, soundLine } from '../src/scenes';
import { color } from '../src/theme';

const PLAYABLE = SCENES.filter((scene) => !!scene.sound);
const OFFS: { label: string; value: SleepSound['offAfter'] }[] = [
  { label: '30분', value: 30 },
  { label: '1시간', value: 60 },
  { label: '아침까지', value: 'morning' },
];

export default function SoundSheet() {
  const inset = useSafeAreaInsets();
  const [sound, setSound] = useState(get('sleepSound'));

  const done = () => {
    const timerChanged = get('sleepSound').offAfter !== sound.offAfter;
    set('sleepSound', sound);
    const night = getNightState();
    if (night.active) startSound(night.phase === 'listen' || timerChanged);
    router.back();
  };

  const select = (id: SleepSound['scenes'][number]) => {
    const scenes = sound.scenes.includes(id)
      ? sound.scenes.filter((item) => item !== id)
      : sound.scenes.length < 2 ? [...sound.scenes, id] : [sound.scenes[0], id];
    setSound({ ...sound, scenes });
  };

  return (
    <View style={st.page}>
      <View style={[st.header, { paddingTop: Math.max(inset.top, 8) }]}>
        <Text maxFontSizeMultiplier={1.15} style={st.title}>수면 사운드</Text>
        <Pressable accessibilityRole="button" onPress={done} style={st.doneButton}>
          <Text maxFontSizeMultiplier={1.1} style={st.doneText}>완료</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Math.max(inset.bottom, 20) + 32 }} showsVerticalScrollIndicator={false}>
        <View style={st.current}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text maxFontSizeMultiplier={1.15} style={st.currentLabel}>현재 선택</Text>
            <Text maxFontSizeMultiplier={1.15} style={st.currentValue} numberOfLines={2}>{soundLine(sound.scenes)}</Text>
          </View>
          <Pressable accessibilityLabel="수면 사운드 선택 해제" onPress={() => setSound({ ...sound, scenes: [] })} style={st.clearButton}>
            <Text maxFontSizeMultiplier={1.1} style={st.clearText}>선택 해제</Text>
          </Pressable>
        </View>

        <Text maxFontSizeMultiplier={1.15} style={st.section}>재생 가능한 사운드</Text>
        <View style={st.group}>
          {PLAYABLE.map((item, index) => {
            const selected = sound.scenes.includes(item.id);
            const favorite = sound.favorites.includes(item.id);
            return (
              <View key={item.id} style={[st.row, index < PLAYABLE.length - 1 && st.divider]}>
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => select(item.id)} style={st.rowMain}>
                  <View style={[st.check, selected && st.checkOn]}>{selected ? <Text style={st.checkText}>✓</Text> : null}</View>
                  <View style={st.tag}><Text maxFontSizeMultiplier={1.1} style={st.tagText}>{item.tag}</Text></View>
                  <Text maxFontSizeMultiplier={1.2} style={st.name} numberOfLines={2}>{item.name}</Text>
                </Pressable>
                <Pressable accessibilityLabel={`${item.name} 즐겨찾기`} accessibilityState={{ selected: favorite }} onPress={() => setSound({ ...sound, favorites: favorite ? sound.favorites.filter((id) => id !== item.id) : [...sound.favorites, item.id] })} style={st.favorite}>
                  <SymbolView name={favorite ? 'heart.fill' : 'heart'} size={20} tintColor={favorite ? '#FF6B8A' : '#C7C7CC'} />
                </Pressable>
              </View>
            );
          })}
        </View>

        <Text maxFontSizeMultiplier={1.15} style={st.section}>끄는 시간</Text>
        <View accessibilityRole="radiogroup" style={st.segment}>
          {OFFS.map((item) => (
            <Pressable key={item.label} accessibilityRole="radio" accessibilityState={{ checked: sound.offAfter === item.value }} onPress={() => setSound({ ...sound, offAfter: item.value })} style={[st.segmentButton, sound.offAfter === item.value && st.segmentButtonOn]}>
              <Text maxFontSizeMultiplier={1.1} style={st.segmentText}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text maxFontSizeMultiplier={1.2} style={st.help}>
          {sound.offAfter === 'morning' ? '알람 30분 전까지 재생해요.' : '소리가 서서히 꺼진 뒤부터 코골이를 들어요.'}
        </Text>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#18181B' },
  header: { minHeight: 68, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 16 },
  title: { flex: 1, fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  doneButton: { minWidth: 68, height: 42, paddingHorizontal: 16, borderRadius: 21, backgroundColor: '#F2F2F3', alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 15, fontWeight: '700', color: '#111113' },
  current: { minHeight: 76, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, backgroundColor: '#242428', flexDirection: 'row', alignItems: 'center', gap: 12 },
  currentLabel: { fontSize: 12, color: '#8E8E95' },
  currentValue: { fontSize: 16, color: '#F5F5F6' },
  clearButton: { minHeight: 40, paddingHorizontal: 10, justifyContent: 'center' },
  clearText: { fontSize: 14, color: '#C7C7CC' },
  section: { marginTop: 24, marginBottom: 8, marginHorizontal: 8, fontSize: 18, fontWeight: '700', color: '#F5F5F6' },
  group: { paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#242428', overflow: 'hidden' },
  row: { minHeight: 66, flexDirection: 'row', alignItems: 'center' },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#414146' },
  rowMain: { minHeight: 66, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#77777E', alignItems: 'center', justifyContent: 'center' },
  checkOn: { borderColor: '#F2F2F3', backgroundColor: '#F2F2F3' },
  checkText: { fontSize: 14, lineHeight: 17, fontWeight: '900', color: '#111113' },
  tag: { minWidth: 46, height: 28, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#3A3A3F', alignItems: 'center', justifyContent: 'center' },
  tagText: { fontSize: 12, fontWeight: '600', color: '#D1D1D6' },
  name: { flex: 1, fontSize: 16, color: '#FFFFFF' },
  favorite: { width: 44, height: 52, alignItems: 'center', justifyContent: 'center' },
  segment: { height: 44, padding: 3, borderRadius: 13, backgroundColor: '#242428', flexDirection: 'row', gap: 3 },
  segmentButton: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentButtonOn: { backgroundColor: '#636366' },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  help: { marginTop: 9, paddingHorizontal: 8, fontSize: 13, lineHeight: 19, color: color.nightSecondary },
});
