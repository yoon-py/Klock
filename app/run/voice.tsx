// 따라 말하기 미션 (SPEC 6.15, 디자인 MissionVoice)
// 지금은 마이크 버튼을 누를 때마다 한 단어씩 밝아져요. TODO: 기기 안 음성 인식(SFSpeechRecognizer ko-KR)
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Clear, MissionTop, sfx } from '../../src/components/mission';
import { getRun } from '../../src/store/run';
import { VOICE_SENTENCES } from '../../src/missions';

/** 고른 문장 중에서 count개를 겹치지 않게 뽑아요 */
function pickSentences() {
  const m = getRun().missions[getRun().index];
  const pool = m?.type === 'repeat_sentence' && m.sentenceIds?.length ? m.sentenceIds : VOICE_SENTENCES;
  const count = m?.type === 'repeat_sentence' ? m.count ?? 1 : 1;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count).map((x) => x.split(' '));
}

export default function Voice() {
  const [list] = useState(pickSentences);
  const [at, setAt] = useState(0); // 몇 번째 문장
  const [heard, setHeard] = useState(0);
  const SENTENCE = list[at];
  const lv = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(lv, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(lv, { toValue: 0.35, duration: 450, useNativeDriver: true }),
    ])).start();
  }, [lv]);
  const say = () => {
    if (heard >= SENTENCE.length) return;
    sfx('tick');
    if (heard + 1 < SENTENCE.length || at + 1 >= list.length) return setHeard(heard + 1);
    setTimeout(() => { setAt(at + 1); setHeard(0); }, 500); // 다음 문장
    setHeard(heard + 1);
  };
  const done = at + 1 >= list.length && heard >= SENTENCE.length;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <MissionTop progressKey={`${at}-${heard}`} />
      <View style={{ paddingTop: 136, paddingHorizontal: 24, gap: 6 }}>
        <Text style={{ fontSize: 15, color: '#98989F' }}>말하기 · 따라 말하기{list.length > 1 ? ` · ${at + 1}/${list.length}` : ''}</Text>
        <Text style={{ fontSize: 28, fontWeight: '600', letterSpacing: -0.4, color: '#FFF' }}>이 문장을 소리 내어 읽어 주세요</Text>
      </View>
      <Text style={{ position: 'absolute', top: 300, left: 24, right: 24, fontSize: 38, fontWeight: '600', lineHeight: 51, letterSpacing: -0.6 }}>
        {SENTENCE.map((w, i) => (
          <Text key={i} style={{ color: i < heard ? '#FFF' : '#4A4A4E' }}>{w} </Text>
        ))}
      </Text>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 172, height: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
        {[10, 18, 26, 14, 22, 12, 8].map((h, i) => (
          <Animated.View key={i} style={{ width: 4, height: h, borderRadius: 2, backgroundColor: '#FFB547', transform: [{ scaleY: lv }] }} />
        ))}
      </View>
      <Pressable accessibilityLabel="말하기" onPress={say} style={{ position: 'absolute', alignSelf: 'center', bottom: 58, width: 76, height: 76, borderRadius: 38, backgroundColor: '#FFB547', alignItems: 'center', justifyContent: 'center' }}>
        <SymbolView name="mic.fill" size={28} tintColor="#1A1205" />
      </Pressable>
      {done ? <Clear text="문장을 끝까지 읽었어요" /> : null}
    </View>
  );
}
