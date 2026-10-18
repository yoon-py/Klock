// 따라 말하기 설정. 디자인에 없어서 리듬 설정(MissionRhythmSet) 모양을 따랐어요 (2026-10-16 사용자 요청).
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

const COUNTS = [1, 2, 3, 4, 5] as const;

export default function VoiceSettings() {
  const p = useLocalSearchParams<{ i: string; adding?: string }>();
  const i = Number(p.i ?? 0);
  const list = draftMissions(useDraft());
  const m = list[i]?.type === 'repeat_sentence' ? list[i] : null;
  const [count, setCount] = useState<(typeof COUNTS)[number]>(m?.count ?? 1);
  const [perm, setPerm] = useState(false);
  useEffect(() => { getRecordingPermissionsAsync().then((r) => setPerm(r.granted)); }, []);
  const saved = useRef(false);
  useDropIfAbandoned(i, p.adding === '1', () => saved.current);
  if (!m) return null;
  const n = Math.min(count, m.sentenceIds.length);

  const save = () => {
    const next = list.slice();
    next[i] = { ...m, count };
    setDraftMissions(next);
    saved.current = true;
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0C' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ backgroundColor: color.card, paddingBottom: 24 }}>
          <PushHeader title="따라 말하기" />
          <Text style={st.headline}>{'문장을 따라 말하고\n알람 해제'}</Text>
          <View style={st.previewBox}>
            <View style={st.phone}>
              <Text style={{ marginTop: 22, fontSize: 9.5, fontWeight: '600', lineHeight: 13, color: '#FFF', textAlign: 'center' }}>{'이 문장을 소리 내어\n읽어 주세요'}</Text>
              <Text style={{ marginTop: 14, marginHorizontal: 12, fontSize: 13, fontWeight: '600', lineHeight: 18 }}>
                <Text style={{ color: '#FFF' }}>{m.sentenceIds[0]?.split(' ').slice(0, 2).join(' ')} </Text>
                <Text style={{ color: '#4A4A4E' }}>{m.sentenceIds[0]?.split(' ').slice(2).join(' ')}</Text>
              </Text>
            </View>
            {!perm ? (
              <View style={st.permBadge}>
                <SymbolView name="mic.fill" size={14} tintColor="#AEAEB2" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#000' }}>마이크 권한 필수</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ marginTop: 26, textAlign: 'center', fontSize: 16, color: '#D1D1D6' }}>고른 문장 중에서 {n}개가 나와요</Text>
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
            <Wheel values={COUNTS} value={count} onChange={setCount} />
            <Text pointerEvents="none" style={{ position: 'absolute', right: 44, fontSize: 17, fontWeight: '600', color: color.text }}>문장</Text>
          </View>
        </View>
      </ScrollView>
      <BottomButtons
        left="미리보기"
        onLeft={() => startRun([{ ...m, count }], { preview: true })}
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
  phone: { width: 138, height: '100%', backgroundColor: '#000' },
  permBadge: { position: 'absolute', left: 12, bottom: 12, height: 32, paddingLeft: 8, paddingRight: 12, borderRadius: 9, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickRow: { height: 68, paddingLeft: 20, paddingRight: 18, borderRadius: 16, backgroundColor: color.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
