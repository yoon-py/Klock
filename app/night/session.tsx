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
      <Pressable accessibilityLabel="내리기" onPress={() => router.back()} style={st.down}>
        <SymbolView name="chevron.down" size={22} tintColor="#FFF" weight="semibold" />
      </Pressable>

      <View style={{ position: 'absolute', top: 136, left: 0, right: 0, alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 86, fontWeight: '600', letterSpacing: -2, color: '#FFF' }}>{clock}</Text>
        <Text style={{ fontSize: 19, color: '#D1D2E0' }}>{durKo(left)} 후에 알람이 울려요</Text>
      </View>

      <View pointerEvents="none" style={{ position: 'absolute', top: 340, left: 0, width: 390, height: 80, overflow: 'hidden' }}>
        {WAVES.map((w, i) => (
          <Animated.View key={i} style={{ position: 'absolute', transform: [{ translateX: move[i] }] }}>
            <Svg width={780} height={80}><Path d={w.d} fill="none" stroke={w.c} strokeWidth={w.w} opacity={w.o} /></Svg>
          </Animated.View>
        ))}
      </View>

      <View style={{ position: 'absolute', top: 440, left: 0, right: 0, alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 20, color: '#8E90A8' }}>{!get('prefs').recordNight ? '밤사이 소리 녹음이 꺼져 있어요' : ss.offAfter === 'morning' ? '아침까지 틀면 밤사이 코골이 녹음은 쉬어요.' : '코골이 탐색 중'}</Text>
        <Text style={{ fontSize: 15, color: '#8E90A8' }}>주변 소리 <Text style={{ fontSize: 16, fontWeight: '700', color: '#A9A6FF' }}>{db ?? '--'}dB</Text></Text>
      </View>

      <Pressable onPress={() => setEnding(true)} style={st.end}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#000' }}>종료</Text>
      </Pressable>

      <View style={st.card}>
        <View style={st.thumb}><SymbolView name="moon.fill" size={18} tintColor="#C9C2FF" /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 17, color: '#FFF' }} numberOfLines={1}>{soundLine(ss.scenes, ss.monauralBeat)}</Text>
          <Text style={{ fontSize: 13, color: '#8E90A8' }}>소리가 꺼졌어요 · 코골이를 듣는 중</Text>
        </View>
        <Pressable accessibilityLabel="수면 사운드 고르기" onPress={() => router.push('/sound-sheet')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <SymbolView name="square.grid.2x2.fill" size={22} tintColor="#FFF" />
        </Pressable>
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
  down: { position: 'absolute', top: 56, right: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  end: { position: 'absolute', top: 540, alignSelf: 'center', width: 84, height: 56, borderRadius: 12, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', left: 16, right: 16, bottom: 34, height: 76, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#24242C', flexDirection: 'row', alignItems: 'center', gap: 14 },
  thumb: { width: 62, height: 42, borderRadius: 8, backgroundColor: '#1D2455', alignItems: 'center', justifyContent: 'center' },
});
