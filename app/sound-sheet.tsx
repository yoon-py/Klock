// 수면 사운드 시트 (SPEC 6.11, 디자인 SoundSheet). 완료하면 연 화면으로 돌아가요.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { get, set, type SleepSound } from '../src/store';
import { getNightState, startSound } from '../src/store/night';
import { SCENES } from '../src/scenes';
import { color } from '../src/theme';

const OFFS: { label: string; v: SleepSound['offAfter'] }[] = [
  { label: '30분', v: 30 }, { label: '1시간', v: 60 }, { label: '아침까지', v: 'morning' },
];

export default function SoundSheet() {
  const [s, setS] = useState(get('sleepSound'));
  const sel = s.scenes[0];

  const done = () => {
    const timerChanged = get('sleepSound').offAfter !== s.offAfter;
    set('sleepSound', s);
    // 수면 중이면 고른 소리를 바로 틀어요 (녹음 중이었으면 녹음은 다시 멈춰요)
    const n = getNightState();
    if (n.active) startSound(n.phase === 'listen' || timerChanged);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgb(40,40,48)' }}>
      <View style={st.head}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFF' }}>수면 사운드</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Pressable onPress={() => setS({ ...s, scenes: [] })} style={st.textBtn}>
            <Text style={{ fontSize: 15, color: color.nightSecondary, textDecorationLine: 'underline' }}>선택해제</Text>
          </Pressable>
          <Pressable onPress={done} style={st.textBtn}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: color.night }}>완료</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View accessibilityRole="radiogroup" style={{ marginTop: 10 }}>
          {SCENES.map((x) => {
            const on = sel === x.id, fav = s.favorites.includes(x.id);
            return (
              <Pressable
                key={x.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setS({ ...s, scenes: [x.id, ...s.scenes.slice(1).filter((y) => y !== x.id)] })}
                style={[st.row, on && { backgroundColor: 'rgba(255,255,255,0.10)' }]}>
                <View style={st.tag}><Text style={{ fontSize: 13, fontWeight: '600', color: '#9DB2FF' }}>{x.tag}</Text></View>
                <Text style={{ fontSize: 17, color: '#FFF', flex: 1 }}>{x.name}</Text>
                <Pressable
                  accessibilityLabel={x.name + ' 즐겨찾기'}
                  accessibilityState={{ selected: fav }}
                  onPress={() => setS({ ...s, favorites: fav ? s.favorites.filter((y) => y !== x.id) : [...s.favorites, x.id] })}
                  style={{ width: 44, height: 44, marginRight: -8, alignItems: 'center', justifyContent: 'center' }}>
                  <SymbolView name={fav ? 'heart.fill' : 'heart'} size={20} tintColor={fav ? '#FF6B8A' : '#C7C7CC'} />
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        <View style={{ marginTop: 14, gap: 8 }}>
          <Text style={{ fontSize: 13, color: color.nightSecondary, paddingLeft: 12 }}>끄는 시간</Text>
          <View accessibilityRole="radiogroup" style={st.seg}>
            {OFFS.map((o) => (
              <Pressable key={o.label} accessibilityRole="radio" accessibilityState={{ checked: s.offAfter === o.v }} onPress={() => setS({ ...s, offAfter: o.v })} style={[st.segBtn, s.offAfter === o.v && { backgroundColor: '#636366' }]}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ fontSize: 13, color: color.nightSecondary, paddingHorizontal: 12 }}>
            {s.offAfter === 'morning' ? '아침까지 틀면 밤사이 코골이 녹음은 쉬어요.' : '소리가 서서히 꺼진 뒤부터 코골이를 녹음해요.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  head: { height: 60, marginTop: 8, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textBtn: { height: 44, paddingHorizontal: 8, justifyContent: 'center' },
  row: { minHeight: 52, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  tag: { height: 26, paddingHorizontal: 8, borderRadius: 7, backgroundColor: 'rgba(110,140,240,0.18)', justifyContent: 'center' },
  seg: { height: 40, padding: 3, borderRadius: 11, backgroundColor: 'rgba(118,118,128,0.24)', flexDirection: 'row', gap: 3 },
  segBtn: { flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
