// 리듬 맞춰 말하기 설정 (SPEC 6.6, 디자인 MissionRhythmSet)
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { BottomButtons, PushHeader } from '../../../src/components/sheet';
import { Wheel } from '../../../src/components';
import { draftMissions, setDraftMissions, useDraft, useDropIfAbandoned } from '../../../src/store/draft';
import { startRun } from '../../../src/store/run';
import { color, font } from '../../../src/theme';

const ROUNDS = [1, 2, 3, 4, 5] as const;
const LEVELS = ['작게', '보통', '크게'];
const PREVIEW = ['일', '어', '나', '자', '힘', '을', '내', '자'];

export default function RhythmSettings() {
  const p = useLocalSearchParams<{ i: string; adding?: string }>();
  const i = Number(p.i ?? 0);
  const list = draftMissions(useDraft());
  const m = list[i]?.type === 'rhythm' ? list[i] : null;
  const [rounds, setRounds] = useState<(typeof ROUNDS)[number]>(m?.rounds ?? 1);
  const [bg, setBg] = useState<0 | 1 | 2>(m?.bgmLevel ?? 0);
  const [perm, setPerm] = useState(false);
  useEffect(() => { getRecordingPermissionsAsync().then((r) => setPerm(r.granted)); }, []);
  const saved = useRef(false);
  useDropIfAbandoned(i, p.adding === '1', () => saved.current);
  if (!m) return null;

  const save = () => {
    const next = list.slice();
    next[i] = { ...m, rounds, bgmLevel: bg };
    setDraftMissions(next);
    saved.current = true;
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0C' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ backgroundColor: color.card, paddingBottom: 24 }}>
          <PushHeader title="리듬 맞춰 말하기" />
          <Text style={st.headline}>{'리듬 맞춰 말하고\n알람 해제'}</Text>
          <View style={st.previewBox}>
            <View style={st.phone}>
              <Text style={{ marginTop: 22, fontSize: 9.5, fontWeight: '600', lineHeight: 13, color: '#FFF', textAlign: 'center' }}>{'박자에 맞춰\n글자를 읽으세요'}</Text>
              <View style={{ marginTop: 14, width: 112, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {PREVIEW.map((c, k) => (
                  <View key={k} style={st.tile}><Text style={{ fontSize: 10, fontWeight: '600', color: '#FFF' }}>{c}</Text></View>
                ))}
              </View>
            </View>
            {!perm ? (
              <View style={st.permBadge}>
                <SymbolView name="mic.fill" size={14} tintColor="#AEAEB2" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#000' }}>마이크 권한 필수</Text>
              </View>
            ) : null}
          </View>
          <View style={{ marginTop: 26, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            <SymbolView name="music.note" size={16} tintColor={color.accent} />
            <Text style={{ fontSize: 16, color: '#D1D1D6' }}>효과음이 나오는 미션이에요</Text>
          </View>
        </View>

        <View style={{ padding: 24, paddingBottom: 0, gap: 14 }}>
          <Pressable onPress={() => router.push({ pathname: '/mission/rhythm-pick', params: { i } })} style={st.pickRow}>
            <Text style={{ ...font.body, color: color.text }}>미션 문장 고르기</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ ...font.headline, color: color.accent }}>{m.sentenceIds.length}개</Text>
              <SymbolView name="chevron.right" size={14} tintColor={color.accent} weight="bold" />
            </View>
          </Pressable>

          <View style={{ borderRadius: 16, backgroundColor: color.card, overflow: 'hidden', justifyContent: 'center' }}>
            <Wheel values={ROUNDS} value={rounds} onChange={setRounds} />
            <Text pointerEvents="none" style={{ position: 'absolute', right: 44, fontSize: 17, fontWeight: '600', color: color.text }}>번</Text>
          </View>

          <View style={{ padding: 20, paddingTop: 22, borderRadius: 16, backgroundColor: color.card, gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...font.body, color: color.text }}>배경음 크기</Text>
              <Text style={{ ...font.headline, color: color.accent }}>{LEVELS[bg]}</Text>
            </View>
            <View style={{ height: 44, justifyContent: 'center' }} accessibilityRole="radiogroup">
              <View style={st.track} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {LEVELS.map((l, k) => (
                  <Pressable key={l} accessibilityLabel={l} accessibilityRole="radio" accessibilityState={{ checked: bg === k }} onPress={() => setBg(k as 0 | 1 | 2)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={bg === k ? st.knob : st.dot} />
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: color.textSecondary }}>작게</Text>
              <Text style={{ fontSize: 14, color: color.textSecondary }}>크게</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <BottomButtons
        left="미리보기"
        onLeft={() => startRun([{ ...m, rounds, bgmLevel: bg }], { preview: true })}
        right={perm ? '저장' : '권한 허용하기'}
        rightTone={perm ? 'accent' : 'light'}
        onRight={perm ? save : () => requestRecordingPermissionsAsync().then((r) => setPerm(r.granted))}
      />
    </View>
  );
}

const st = StyleSheet.create({
  headline: { marginTop: 10, marginHorizontal: 24, fontSize: 22, fontWeight: '700', lineHeight: 31, letterSpacing: -0.4, color: color.text, textAlign: 'center' },
  previewBox: { marginTop: 28, marginHorizontal: 24, height: 180, borderRadius: 16, backgroundColor: '#0B0B0C', overflow: 'hidden', alignItems: 'center' },
  phone: { width: 138, height: '100%', backgroundColor: '#1A2380', alignItems: 'center' },
  tile: { width: 25, height: 25, borderRadius: 6, backgroundColor: 'rgba(110,140,240,0.35)', alignItems: 'center', justifyContent: 'center' },
  permBadge: { position: 'absolute', left: 12, bottom: 12, height: 32, paddingLeft: 8, paddingRight: 12, borderRadius: 9, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickRow: { height: 68, paddingLeft: 20, paddingRight: 18, borderRadius: 16, backgroundColor: color.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { position: 'absolute', left: 14, right: 14, height: 6, borderRadius: 3, backgroundColor: color.fill },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFF' },
  knob: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 } },
});
