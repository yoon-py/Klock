// 탐색 탭 (SPEC 6.20): 수면 가이드 + 수면 사운드 고르기 + 끄는 시간. 고른 값은 바로 저장돼요.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useSetting, type SceneId, type SleepSound } from '../../src/store';
import { getNightState, startSound } from '../../src/store/night';
import { SCENES, scene, soundLine } from '../../src/scenes';
import { color } from '../../src/theme';

const OFFS: { label: string; v: SleepSound['offAfter'] }[] = [
  { label: '30분', v: 30 }, { label: '1시간', v: 60 }, { label: '아침까지', v: 'morning' },
];
const GUIDES = [
  { kind: '478', name: '4-7-8 호흡', len: '2분', icon: 'wind' },
  { kind: '1m', name: '1분 호흡', len: '1분', icon: 'circle.dotted' },
  // TODO: 몸 풀기 음성 가이드 (scripts/make-guide-voice.mjs로 음성 파일을 만든 뒤 추가)
] as const;
const PREVIEW_MS = 10_000;

export default function Explore() {
  const inset = useSafeAreaInsets();
  const [s, setS] = useSetting('sleepSound');
  const [playing, setPlaying] = useState<string | null>(null); // 미리 듣는 것 (장면 id 또는 'mix')
  const players = useRef<AudioPlayer[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    players.current.forEach((p) => { p.pause(); p.remove(); });
    players.current = [];
    setPlaying(null);
  }, []);
  useFocusEffect(useCallback(() => stop, [stop])); // 다른 탭으로 가면 멈춰요
  useEffect(() => stop, [stop]);

  const preview = async (key: string, ids: SceneId[], ms?: number) => {
    if (getNightState().active) return; // 수면 중에는 미리 듣기 대신 바로 바뀌어요
    if (playing === key) return stop();
    stop();
    const files = ids.map((id) => scene(id)?.sound).filter((x): x is number => !!x);
    if (!files.length) return;
    await setAudioModeAsync({ playsInSilentMode: true });
    players.current = files.map((f, i) => { const p = createAudioPlayer(f); p.loop = true; p.volume = i ? s.volumes.sceneB : s.volumes.sceneA; p.play(); return p; });
    setPlaying(key);
    if (ms) timer.current = setTimeout(stop, ms);
  };

  const save = (next: SleepSound) => {
    setS(next);
    const n = getNightState();
    if (n.active) startSound(n.phase === 'listen'); // 수면 중이면 고른 소리를 바로 틀어요
  };
  const pick = (id: SceneId) => {
    Haptics.selectionAsync();
    const on = s.scenes.includes(id);
    const scenes = on ? s.scenes.filter((x) => x !== id) : [id];
    save({ ...s, scenes });
    if (!on) preview(id, [id], PREVIEW_MS);
  };
  const addSecond = (id: SceneId) => { Haptics.selectionAsync(); save({ ...s, scenes: [s.scenes[0], id] }); };
  const fav = (id: SceneId) => setS({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] });

  const Row = ({ id }: { id: SceneId }) => {
    const x = scene(id)!;
    const idx = s.scenes.indexOf(id);
    const canAdd = idx < 0 && s.scenes.length === 1 && !!x.sound;
    return (
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: idx >= 0 }} onPress={() => pick(id)} style={({ pressed }) => [st.row, idx >= 0 && st.rowOn, pressed && { opacity: 0.7 }]}>
        <View style={st.tag}><Text style={st.tagText}>{x.tag}</Text></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 17, color: '#FFF' }}>{x.name}</Text>
          {x.note || !x.sound ? <Text style={{ fontSize: 13, color: color.nightSecondary }}>{x.sound ? x.note : '소리 준비 중'}</Text> : null}
        </View>
        {idx === 1 ? <Text style={{ fontSize: 13, color: color.night }}>섞는 중</Text> : null}
        {canAdd ? (
          <Pressable accessibilityLabel={x.name + ' 섞기'} onPress={() => addSecond(id)} hitSlop={6} style={st.icon}>
            <SymbolView name="plus.circle" size={22} tintColor={color.nightSecondary} />
          </Pressable>
        ) : null}
        <Pressable accessibilityLabel={x.name + ' 즐겨찾기'} accessibilityState={{ selected: s.favorites.includes(id) }} onPress={() => fav(id)} hitSlop={6} style={st.icon}>
          <SymbolView name={s.favorites.includes(id) ? 'heart.fill' : 'heart'} size={20} tintColor={s.favorites.includes(id) ? '#FF6B8A' : '#C7C7CC'} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <LinearGradient colors={['#17183A', '#0D0E1D', '#09090F']} locations={[0, 0.34, 1]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingTop: inset.top + 36, paddingBottom: inset.bottom + 120 }}>
        <Text style={st.title}>탐색</Text>

        <Text style={st.section}>수면 가이드</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
          {GUIDES.map((g) => (
            <Pressable key={g.kind} onPress={() => { stop(); router.push({ pathname: '/guide/breath', params: { kind: g.kind } }); }} style={({ pressed }) => [st.guide, pressed && { opacity: 0.7 }]}>
              <SymbolView name={g.icon} size={26} tintColor={color.night} />
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFF' }}>{g.name}</Text>
              <Text style={{ fontSize: 14, color: color.nightSecondary }}>{g.len}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={st.section}>사운드</Text>
        <View style={st.group}>
          <View style={[st.row, { minHeight: 64 }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 13, color: color.nightSecondary }}>지금 고른 소리</Text>
              <Text style={{ fontSize: 17, color: '#FFF' }} numberOfLines={1}>{soundLine(s.scenes)}</Text>
            </View>
            {s.scenes.some((id) => scene(id)?.sound) ? (
              <Pressable accessibilityLabel={playing === 'mix' ? '미리 듣기 멈추기' : '미리 듣기'} onPress={() => preview('mix', s.scenes)} style={st.play}>
                <SymbolView name={playing === 'mix' ? 'pause.fill' : 'play.fill'} size={18} tintColor="#16132E" />
              </Pressable>
            ) : null}
          </View>
        </View>

        {s.recent?.length ? (
          <>
            <Text style={st.sub}>최근에 들은 소리</Text>
            <View style={st.group}>
              {s.recent.map((r) => (
                <Pressable key={r.join()} onPress={() => { Haptics.selectionAsync(); save({ ...s, scenes: r }); }} style={({ pressed }) => [st.row, pressed && { opacity: 0.7 }]}>
                  <SymbolView name="clock.arrow.circlepath" size={18} tintColor={color.nightSecondary} />
                  <Text style={{ flex: 1, fontSize: 16, color: '#FFF' }} numberOfLines={1}>{soundLine(r)}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {s.favorites.length ? (
          <>
            <Text style={st.sub}>즐겨찾기</Text>
            <View style={st.group}>{s.favorites.map((id) => <Row key={id} id={id} />)}</View>
          </>
        ) : null}

        <Text style={st.sub}>모든 소리</Text>
        <View style={st.group}>{SCENES.map((x) => <Row key={x.id} id={x.id} />)}</View>

        <Text style={st.section}>끄는 시간</Text>
        <View style={{ marginHorizontal: 20, gap: 8 }}>
          <View accessibilityRole="radiogroup" style={st.seg}>
            {OFFS.map((o) => (
              <Pressable key={o.label} accessibilityRole="radio" accessibilityState={{ checked: s.offAfter === o.v }} onPress={() => save({ ...s, offAfter: o.v })} style={[st.segBtn, s.offAfter === o.v && { backgroundColor: '#636366' }]}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ fontSize: 13, color: color.nightSecondary, paddingHorizontal: 4 }}>
            {s.offAfter === 'morning' ? '아침까지 틀면 밤사이 녹음은 쉬고, 움직임으로만 잠을 살펴요.' : '소리가 서서히 꺼진 뒤부터 밤사이 소리를 녹음해요.'}
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  title: { marginHorizontal: 24, fontSize: 34, fontWeight: '700', letterSpacing: -0.6, color: color.nightText },
  section: { marginTop: 28, marginBottom: 10, marginHorizontal: 24, fontSize: 22, fontWeight: '700', color: color.nightText },
  sub: { marginTop: 16, marginBottom: 6, marginHorizontal: 28, fontSize: 13, color: color.nightSecondary },
  group: { marginHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  row: { minHeight: 56, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowOn: { backgroundColor: 'rgba(169,157,255,0.16)' },
  tag: { height: 26, paddingHorizontal: 8, borderRadius: 7, backgroundColor: 'rgba(110,140,240,0.18)', justifyContent: 'center' },
  tagText: { fontSize: 13, fontWeight: '600', color: '#9DB2FF' },
  icon: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  play: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.nightText, alignItems: 'center', justifyContent: 'center' },
  guide: { width: 150, height: 120, padding: 16, borderRadius: 20, backgroundColor: 'rgba(169,157,255,0.10)', justifyContent: 'space-between' },
  seg: { height: 40, padding: 3, borderRadius: 11, backgroundColor: 'rgba(118,118,128,0.24)', flexDirection: 'row', gap: 3 },
  segBtn: { flex: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
