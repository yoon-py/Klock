// 미션 진행 화면 공통 부품 (SPEC 6.15, 디자인 MissionSquat* 등)
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { backToAlarm, nextMission } from '../store/run';
import { playSfx, type SFX } from '../sounds';
import { color } from '../theme';

const LIMIT_MS = 90_000; // 미션 남은 시간. 진행하면 다시 차요

// 미션 효과음 켜기/끄기 (미션이 여러 개여도 유지)
let soundOn = false;
export const sfx = (name: keyof typeof SFX) => { if (soundOn) playSfx(name); };

/** 맨 위 흰 줄(남은 시간) + ‹ 알람으로 + 소리 스위치. progressKey가 바뀌면 시간이 다시 차요. */
export function MissionTop({ progressKey }: { progressKey: unknown }) {
  const w = useRef(new Animated.Value(1)).current;
  const [on, setOn] = useState(soundOn);
  useEffect(() => {
    w.setValue(1);
    const a = Animated.timing(w, { toValue: 0, duration: LIMIT_MS, easing: Easing.linear, useNativeDriver: false });
    a.start(({ finished }) => finished && backToAlarm()); // 시간이 다 되면 알람이 다시 크게 울려요
    return () => a.stop();
  }, [progressKey, w]);
  return (
    <>
      <View style={st.barBg}>
        <Animated.View style={[st.bar, { width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <View style={st.top}>
        <Pressable accessibilityLabel="알람으로 돌아가기" onPress={backToAlarm} style={st.back}>
          <SymbolView name="chevron.left" size={20} tintColor="#FFF" weight="semibold" />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <SymbolView name={on ? 'speaker.wave.2.fill' : 'speaker.slash.fill'} size={18} tintColor="#8E8E93" />
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel="미션 소리"
            accessibilityState={{ checked: on }}
            onPress={() => { soundOn = !on; setOn(!on); }}
            style={[st.track, { backgroundColor: on ? color.accent : color.fill }]}>
            <View style={[st.knob, { transform: [{ translateX: on ? 20 : 0 }] }]} />
          </Pressable>
        </View>
      </View>
    </>
  );
}

/** 원형 5초 카운트다운 + "자리에서 일어나 준비하세요" + 바로 시작 */
export function Prepare({ onDone, title = '자리에서 일어나\n준비하세요' }: { onDone: () => void; title?: string }) {
  const [sec, setSec] = useState(5);
  useEffect(() => {
    if (sec === 0) return onDone();
    const t = setTimeout(() => setSec(sec - 1), 1000);
    return () => clearTimeout(t);
  }, [sec, onDone]);
  return (
    <View style={{ position: 'absolute', top: 196, left: 0, right: 0, alignItems: 'center' }}>
      <View accessibilityLabel={`${sec}초 뒤 시작`} style={st.ring}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFF' }}>{sec}</Text>
      </View>
      <Text style={st.h1}>{title}</Text>
      <Pressable onPress={onDone} style={st.start}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#000' }}>바로 시작</Text>
      </Pressable>
    </View>
  );
}

/** 큰 숫자가 하나씩 줄며 왼쪽으로 밀려요 (스쿼트·걷기 횟수). 다음 숫자는 오른쪽에 흐리게 */
export function BigCount({ left, max, top }: { left: number; max: number; top: number }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    x.setValue(195);
    Animated.timing(x, { toValue: 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [left, x]);
  const cell = (v: number, dx: number) => (
    <Text key={v} style={[st.num, { position: 'absolute', width: 390, left: -195 + dx, textAlign: 'center', color: dx ? '#8E8E93' : '#FFF', transform: [{ scale: dx ? 0.86 : 1 }] }]}>
      {v >= 0 && v <= max ? v : ''}
    </Text>
  );
  return (
    <View accessibilityLabel={left > 0 ? `${left}번 남았어요` : '다 했어요'} style={{ position: 'absolute', top, left: '50%', height: 160, justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ translateX: x }] }}>
        {cell(left + 1, -195)}
        {cell(left, 0)}
        {cell(left - 1, 195)}
      </Animated.View>
    </View>
  );
}

/** 초록 체크 → 다음 미션으로 */
export function Clear({ text }: { text?: string }) {
  const s = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    sfx('success');
    Animated.spring(s, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
    const t = setTimeout(nextMission, 1100);
    return () => clearTimeout(t);
  }, [s]);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', gap: 22, zIndex: 40 }]}>
      <Animated.View style={[st.clear, { transform: [{ scale: s }] }]}>
        <SymbolView name="checkmark" size={52} tintColor="#EEFBE6" weight="heavy" />
      </Animated.View>
      {text ? <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFF' }}>{text}</Text> : null}
    </View>
  );
}

export const st = StyleSheet.create({
  barBg: { position: 'absolute', top: 50, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.14)', zIndex: 31 },
  bar: { height: '100%', backgroundColor: '#FFF' },
  top: { position: 'absolute', top: 58, left: 0, right: 0, height: 56, paddingLeft: 8, paddingRight: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  track: { width: 62, height: 30, borderRadius: 15, padding: 2 },
  knob: { width: 38, height: 26, borderRadius: 13, backgroundColor: '#FFF' },
  ring: { width: 76, height: 76, borderRadius: 38, borderWidth: 5, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  h1: { marginTop: 42, fontSize: 34, fontWeight: '700', lineHeight: 46, letterSpacing: -0.6, color: '#FFF', textAlign: 'center' },
  h2: { fontSize: 27, fontWeight: '700', lineHeight: 36, letterSpacing: -0.5, color: '#FFF', textAlign: 'center' },
  start: { marginTop: 44, width: 116, height: 56, borderRadius: 10, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 128, fontWeight: '600', letterSpacing: -2, color: '#FFF' },
  clear: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#2DB411', alignItems: 'center', justifyContent: 'center' },
});
