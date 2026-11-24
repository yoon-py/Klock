// 수면 중 · 소리 꺼진 뒤 듣기 (SPEC 6.13, 디자인 NightSession)
// 주변 소리 dB는 마이크로 실제로 재요. TODO: 코골이·잠꼬대 감지(SoundAnalysis)와 구간 저장, 화면 꺼져도 계속 듣기(설치판)
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import Svg, { Path } from 'react-native-svg';
import { File } from 'expo-file-system';
import { RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EndConfirm } from '../../src/components/EndConfirm';
import { get, useSetting } from '../../src/store';
import { endNight, nextWake, useNight, wakeMin } from '../../src/store/night';
import { soundLine } from '../../src/scenes';
import { durKo, fmtKo, toMin } from '../../src/time';

const wave = (amp: number, period: number, phase: number) =>
  'M0 40 ' + Array.from({ length: 79 }, (_, i) => `L${i * 10} ${(40 + amp * Math.sin((i * 10) / period + phase)).toFixed(1)}`).join(' ');
const WAVES = [
  { d: wave(6, 62, 0), c: '#7E6BFF', w: 3, o: 0.95, ms: 7000 },
  { d: wave(9, 70, 1), c: '#9B7BFF', w: 2, o: 0.7, ms: 9000 },
  { d: wave(4, 55, 2), c: '#5D7BFF', w: 2, o: 0.8, ms: 6000 },
  { d: wave(11, 66, 3), c: '#B08CFF', w: 1.2, o: 0.5, ms: 11000 },
];

export default function NightSession() {
  const inset = useSafeAreaInsets();
  const night = useNight();
  const [ss] = useSetting('sleepSound');
  const [schedule] = useSetting('schedule');
  const [now, setNow] = useState(new Date());
  const [db, setDb] = useState<number | null>(null);
  const [ending, setEnding] = useState(false);

  // 다시 소리를 틀면(사운드 시트) 소리 화면으로
  useEffect(() => { if (night.active && night.phase === 'sound') router.replace('/night/sound'); }, [night.active, night.phase]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 10_000); return () => clearInterval(t); }, []);

  // 주변 소리 크기: 1~2초마다 갱신 (녹음 파일은 지워요, 폰 밖으로 안 보내요)
  const recorder = useAudioRecorder({ ...RecordingPresets.LOW_QUALITY, isMeteringEnabled: true });
  useEffect(() => {
    let poll: ReturnType<typeof setInterval>;
    if (!get('prefs').recordNight) return; // 설정에서 녹음을 끄면 듣지도 않아요
    (async () => {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      // metering은 0이 가장 큰 소리(dBFS)라서, 사람이 보기 편한 dB로 대략 옮겨요 (+90)
      poll = setInterval(() => { const m = recorder.getStatus().metering; if (m !== undefined) setDb(Math.max(20, Math.round(m + 90))); }, 1500);
    })().catch(() => {});
    return () => {
      clearInterval(poll);
      recorder.stop().then(() => { if (recorder.uri) new File(recorder.uri).delete(); }).catch(() => {});
    };
  }, [recorder]);

  const move = useRef(WAVES.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    WAVES.forEach((w, i) => Animated.loop(Animated.timing(move[i], { toValue: -390, duration: w.ms, easing: Easing.linear, useNativeDriver: true })).start());
  }, [move]);

  const clock = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const left = Math.round((nextWake(now).getTime() - now.getTime()) / 60_000);

  return (
    <LinearGradient colors={['#1C1E50', '#15163A', '#101016', '#0E0E12']} locations={[0, 0.32, 0.62, 1]} style={{ flex: 1 }}>
      <Pressable accessibilityLabel="내리기" onPress={() => router.back()} style={[st.down, { top: inset.top + 8 }]}>
        <SymbolView name="chevron.down" size={22} tintColor="#FFF" weight="semibold" />
      </Pressable>

      <View style={[st.content, { paddingTop: inset.top + 76, paddingBottom: Math.max(inset.bottom, 16) + 8 }]}>
        <View style={st.clockBlock}>
          <Text maxFontSizeMultiplier={1.05} adjustsFontSizeToFit numberOfLines={1} style={st.clock}>{clock}</Text>
          <Text maxFontSizeMultiplier={1.15} style={st.until}>{durKo(left)} 후에 알람이 울려요</Text>
        </View>

        <View pointerEvents="none" style={st.wave}>
          {WAVES.map((w, i) => (
            <Animated.View key={i} style={{ position: 'absolute', transform: [{ translateX: move[i] }] }}>
              <Svg width={780} height={80}><Path d={w.d} fill="none" stroke={w.c} strokeWidth={w.w} opacity={w.o} /></Svg>
            </Animated.View>
          ))}
        </View>

        <View style={st.status}>
          <Text maxFontSizeMultiplier={1.15} style={st.statusTitle}>{!get('prefs').recordNight ? '밤사이 소리 녹음이 꺼져 있어요' : ss.offAfter === 'morning' ? '아침까지 재생 중' : '코골이 탐색 중'}</Text>
          <Text maxFontSizeMultiplier={1.15} style={st.meter}>주변 소리 <Text style={st.db}>{db ?? '--'}dB</Text></Text>
        </View>

        <Pressable onPress={() => setEnding(true)} style={st.end}>
          <Text maxFontSizeMultiplier={1.1} style={st.endText}>종료</Text>
        </Pressable>

        <View style={st.card}>
          <View style={st.thumb}><SymbolView name="moon.fill" size={18} tintColor="#D1D1D6" /></View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text maxFontSizeMultiplier={1.15} style={st.cardTitle} numberOfLines={1}>{soundLine(ss.scenes)}</Text>
            <Text maxFontSizeMultiplier={1.15} style={st.cardNote} numberOfLines={2}>소리가 꺼졌어요 · 코골이를 듣는 중</Text>
          </View>
          <Pressable accessibilityLabel="수면 사운드 고르기" onPress={() => router.push('/sound-sheet')} style={st.gridButton}>
            <SymbolView name="square.grid.2x2.fill" size={22} tintColor="#FFF" />
          </Pressable>
        </View>
      </View>

      {ending ? (
        <>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} onPress={() => setEnding(false)} />
          <EndConfirm
            title="수면 기록을 끝낼까요?"
            body={`밤사이 소리 녹음이 멈춰요. 앱 잠금과 ${fmtKo(wakeMin(nextWake()))} 알람은 그대로예요.`}
            action="기록 끝내기"
            onEnd={() => { endNight(); router.back(); }}
            onKeep={() => setEnding(false)}
          />
        </>
      ) : null}
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  down: { position: 'absolute', zIndex: 2, right: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  clockBlock: { paddingHorizontal: 20, alignItems: 'center', gap: 8 },
  clock: { width: '100%', textAlign: 'center', fontSize: 78, lineHeight: 88, fontWeight: '600', letterSpacing: -2, color: '#FFF' },
  until: { fontSize: 18, textAlign: 'center', color: '#D1D2E0' },
  wave: { flexShrink: 0, width: '100%', height: 80, marginTop: 46, overflow: 'hidden' },
  status: { flex: 1, minHeight: 92, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', gap: 7 },
  statusTitle: { fontSize: 19, textAlign: 'center', color: '#8E90A8' },
  meter: { fontSize: 15, color: '#8E90A8' },
  db: { fontSize: 16, fontWeight: '700', color: '#D1D1D6' },
  end: { flexShrink: 0, alignSelf: 'center', width: 84, height: 52, marginBottom: 14, borderRadius: 14, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  endText: { fontSize: 17, fontWeight: '700', color: '#000' },
  card: { flexShrink: 0, minHeight: 82, marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#24242C', flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { flexShrink: 0, width: 54, height: 46, borderRadius: 10, backgroundColor: '#2C2C36', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, color: '#FFF' },
  cardNote: { fontSize: 13, lineHeight: 17, color: '#8E90A8' },
  gridButton: { flexShrink: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
