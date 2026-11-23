// 호흡 가이드 (SPEC 6.19, 디자인 GuideBreath): 원이 들이쉴 때 커지고 내쉴 때 작아져요. 단계가 바뀔 때 약한 햅틱.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GUIDE } from '../../src/config/thresholds';
import { get } from '../../src/store';
import { color } from '../../src/theme';

const LABEL = ['들이쉬세요', '잠깐 참으세요', '천천히 내쉬세요'];
const SMALL = 0.5;

export default function Breath() {
  const { kind } = useLocalSearchParams<{ kind: keyof typeof GUIDE }>();
  const g = GUIDE[kind] ?? GUIDE['478'];
  const inset = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(SMALL)).current;
  const [round, setRound] = useState(0);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const run = (r: number, s: number) => {
      if (!alive) return;
      if (r >= g.rounds) return setDone(true);
      const sec = g.steps[s];
      if (sec === 0) return run(r, s + 1); // 참기가 없는 호흡
      setRound(r);
      setStep(s);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      if (s !== 1) Animated.timing(scale, { toValue: s === 0 ? 1 : SMALL, duration: sec * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start();
      t = setTimeout(() => (s < 2 ? run(r, s + 1) : run(r + 1, 0)), sec * 1000);
    };
    t = setTimeout(() => run(0, 0), 600);
    return () => { alive = false; clearTimeout(t); };
  }, [g, scale]);

  const start = () => router.replace(get('seen').phoneTip ? '/night/sound?start=1' : '/night/tip');

  return (
    <View style={{ flex: 1, backgroundColor: '#06060B' }}>
      <Pressable accessibilityLabel="가이드 닫기" onPress={() => router.back()} style={[st.close, { top: inset.top + 4 }]}>
        <SymbolView name="xmark" size={18} tintColor="#C9C7E8" weight="semibold" />
      </Pressable>
      <Text style={[st.head, { top: inset.top + 16 }]}>{g.name}</Text>
      {done ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: color.nightText }}>잘하셨어요</Text>
          <Text style={{ fontSize: 16, color: color.nightSecondary }}>이제 편하게 누워 볼까요?</Text>
          <Pressable onPress={start} style={[st.start, { bottom: inset.bottom + 90 }]}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#16132E' }}>수면 시작</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={[st.closeText, { bottom: inset.bottom + 30 }]}>
            <Text style={{ fontSize: 16, color: color.nightSecondary }}>닫기</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={st.ringOuter} />
          <Animated.View style={[st.circle, { transform: [{ scale }] }]} />
          <Text accessibilityLiveRegion="polite" style={st.label}>{LABEL[step]}</Text>
          <Text style={st.count}>{g.rounds}번 중 {round + 1}번째</Text>
          <Text style={[st.foot, { bottom: inset.bottom + 40 }]}>단계가 바뀔 때 폰이 살짝 울려요. 눈을 감고 따라 해도 괜찮아요.</Text>
        </View>
      )}
    </View>
  );
}

const SIZE = 260;
const st = StyleSheet.create({
  close: { position: 'absolute', left: 12, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  head: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#8E90A8' },
  ringOuter: { position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 1, borderColor: 'rgba(169,157,255,0.18)', marginTop: -120 },
  circle: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: 'rgba(169,157,255,0.42)', marginTop: -120 },
  label: { marginTop: 60, fontSize: 28, fontWeight: '600', color: color.nightText },
  count: { marginTop: 12, fontSize: 16, color: '#8E90A8' },
  foot: { position: 'absolute', left: 24, right: 24, textAlign: 'center', fontSize: 13, color: '#5D6078' },
  start: { position: 'absolute', left: 24, right: 24, height: 58, borderRadius: 29, backgroundColor: color.night, alignItems: 'center', justifyContent: 'center' },
  closeText: { position: 'absolute', height: 44, paddingHorizontal: 16, justifyContent: 'center' },
});
