// 리듬 맞춰 말하기 미션 (SPEC 6.15, 디자인 MissionRhythm)
// 문장 룰렛 → 단어 그림 → 글자 칸 → 3·2·1 → 박자마다 칸이 켜지면 그 글자를 말해요.
// 지금은 박자마다 "소리를 냈는지"만 마이크로 재요. 안 들리면 그 회차를 다시 해요.
// TODO: 기기 안 음성 인식으로 글자까지 맞는지 판정 (설치판에서. Expo Go에는 음성 인식이 없어요)
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { File } from 'expo-file-system';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { Clear, MissionTop, sfx } from '../../src/components/mission';
import { PermissionOff } from '../../src/components/CameraBits';
import { getRun, quietAlarm } from '../../src/store/run';
import { RHYTHM_SENTENCES } from '../../src/missions';
import { RHYTHM as R } from '../../src/config/thresholds';

const EMOJI: Record<string, string> = {
  일어나자: '⏰', 힘을내자: '💪', 눈을뜨자: '👀', 아침이다: '🌅', 지각금지: '🏃', 할수있다: '✊', 해낼거야: '🔥',
  물한잔을: '🥛', 마셔보자: '😋', 기지개를: '🙆', 쭉켜보자: '🤸', 오늘하루: '☀️', 화이팅해: '💪', 일어나서: '🛏️',
  운동하자: '🏋️', 이불밖은: '🛌', 안전해요: '👍',
};

type Phase = 'roulette' | 'intro' | 'fill' | 'count' | 'speak' | 'fail' | 'clear';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Rhythm() {
  const mission = getRun().missions[getRun().index];
  const rounds = mission?.type === 'rhythm' ? mission.rounds : 1;
  const pool = mission?.type === 'rhythm' && mission.sentenceIds.length ? mission.sentenceIds : RHYTHM_SENTENCES;

  const [perm, setPerm] = useState<boolean | null>(null);
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<Phase>('roulette');
  const [sentence, setSentence] = useState(pool[0]);
  const [step, setStep] = useState(0); // 단어 / 보이는 칸 수 / 3·2·1 / 지금 박자
  const words = sentence.split(' ');
  const chars = sentence.replace(/ /g, '').split('');

  // 마이크: 소리 크기(dB)만 재요. 녹음 파일은 끝나면 지워요.
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const level = useRef(-160);
  const ambientDb = useRef(-60);
  useEffect(() => {
    quietAlarm(); // 마이크가 알람 소리를 듣지 않게
    let poll: ReturnType<typeof setInterval>;
    (async () => {
      const p = await requestRecordingPermissionsAsync();
      setPerm(p.granted);
      if (!p.granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      poll = setInterval(() => { level.current = recorder.getStatus().metering ?? -160; }, 50);
    })();
    return () => {
      clearInterval(poll);
      recorder.stop().then(() => { if (recorder.uri) new File(recorder.uri).delete(); }).catch(() => {});
    };
  }, [recorder]);

  // 한 회차 진행 (실패하면 글자 칸부터 다시)
  useEffect(() => {
    if (!perm) return;
    let alive = true;
    const run = async () => {
      if (phase === 'roulette') {
        // 룰렛처럼 문장이 빠르게 바뀌다가 점점 느려지며 하나에 멈춰요
        const pick = pool[Math.floor(Math.random() * pool.length)];
        let t = 0, d = 50, k = 0;
        while (t < R.rouletteMs && alive) {
          setSentence(pool[k++ % pool.length]);
          sfx('tick');
          await wait(d);
          t += d;
          d = Math.min(260, d * 1.18);
        }
        if (!alive) return;
        setSentence(pick);
        sfx('count');
        await wait(700);
        if (alive) { setStep(0); setPhase('intro'); }
      } else if (phase === 'intro') {
        for (let k = 0; k < words.length && alive; k++) { setStep(k); await wait(R.wordPreviewMs); }
        if (alive) { setStep(0); setPhase('fill'); }
      } else if (phase === 'fill') {
        for (let k = 1; k <= chars.length && alive; k++) { setStep(k); await wait(80); }
        if (alive) { setStep(3); setPhase('count'); }
      } else if (phase === 'count') {
        // 3·2·1 동안 주변 소리 크기를 재 둬요
        const ambient: number[] = [];
        for (let k = 3; k >= 1 && alive; k--) {
          setStep(k);
          sfx('count');
          for (let j = 0; j < R.countMs / 50 && alive; j++) { ambient.push(level.current); await wait(50); }
        }
        ambientDb.current = ambient.sort((a, b) => a - b)[Math.floor(ambient.length / 2)] ?? -60;
        if (alive) { setStep(0); setPhase('speak'); }
      } else if (phase === 'speak') {
        for (let k = 0; k < chars.length && alive; k++) {
          setStep(k);
          sfx('tick');
          let loudest = -160;
          for (let ms = 0; ms < R.beatMs && alive; ms += 30) {
            if (ms >= R.listenFromMs) loudest = Math.max(loudest, level.current);
            await wait(30);
          }
          if (loudest < ambientDb.current + R.voiceAboveAmbientDb) {
            if (alive) setPhase('fail');
            return;
          }
        }
        if (!alive) return;
        if (round < rounds) { setRound(round + 1); setPhase('roulette'); }
        else setPhase('clear');
      } else if (phase === 'fail') {
        sfx('fail');
        await wait(1400);
        if (alive) { setStep(0); setPhase('fill'); }
      }
    };
    run();
    return () => { alive = false; };
    // 문장·회차는 phase가 바뀔 때만 읽어요
  }, [phase, perm]);

  if (perm === false) return <PermissionOff what="마이크" />;

  const speaking = phase === 'speak';
  const showTiles = phase === 'fill' || phase === 'count' || phase === 'speak' || phase === 'fail';
  return (
    <LinearGradient colors={['#2533A8', '#1A2380', '#121860']} style={{ flex: 1 }}>
      <MissionTop progressKey={round + phase} />
      <Text style={st.round}>{round}<Text style={{ color: 'rgba(255,255,255,0.4)' }}>/{rounds}</Text></Text>
      <Text style={st.title}>
        {phase === 'fail' ? '소리가 안 들렸어요\n다시 해 볼게요' : speaking ? '지금이에요!\n리듬에 맞춰 말해요' : '리듬 맞춰 말하고\n알람 해제'}
      </Text>
      {speaking ? (
        <View style={st.status}>
          <SymbolView name="waveform" size={20} tintColor="#3BC4E8" />
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#3BC4E8' }}>듣고 있어요</Text>
        </View>
      ) : null}

      {phase === 'roulette' ? <Text style={st.roulette}>{sentence}</Text> : null}

      {phase === 'intro' ? (
        <View style={{ position: 'absolute', top: 420, left: 0, right: 0, alignItems: 'center', gap: 40 }}>
          <Text style={{ fontSize: 96 }}>{EMOJI[words[step]] ?? '⏰'}</Text>
          <Text style={{ fontSize: 36, fontWeight: '700', color: '#FFF' }}>{words[step]}</Text>
        </View>
      ) : null}

      {showTiles ? (
        <View style={st.grid}>
          {chars.map((c, i) => {
            const on = speaking && i === step;
            return (
              <View key={i} style={[st.tile, { opacity: phase === 'fill' && i >= step ? 0 : 1 }, on ? st.on : speaking && i === step - 1 ? st.prev : null]}>
                <Text style={{ fontSize: 36, fontWeight: '700', color: on ? '#2A2A2E' : '#FFF' }}>{c}</Text>
              </View>
            );
          })}
        </View>
      ) : null}

      {phase === 'count' ? <Text style={st.cd}>{step}</Text> : null}
      {phase === 'clear' ? <Clear /> : null}
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  round: { position: 'absolute', top: 72, alignSelf: 'center', fontSize: 18, fontWeight: '600', color: '#FFF', zIndex: 21 },
  title: { position: 'absolute', top: 172, left: 24, right: 24, fontSize: 31, fontWeight: '700', lineHeight: 43, letterSpacing: -0.5, color: '#FFF', textAlign: 'center' },
  status: { position: 'absolute', top: 312, left: 0, right: 0, height: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  roulette: { position: 'absolute', top: 440, left: 16, right: 16, fontSize: 34, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  grid: { position: 'absolute', top: 372, left: 12, right: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  tile: { width: 84, height: 84, borderRadius: 20, backgroundColor: 'rgba(95,125,235,0.38)', alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: '#E9EDF7', borderWidth: 4, borderColor: '#F2C744', transform: [{ scale: 1.03 }] },
  prev: { backgroundColor: 'rgba(150,170,235,0.45)' },
  cd: { position: 'absolute', top: 360, left: 0, right: 0, height: 200, fontSize: 168, fontWeight: '900', color: '#FFD43B', textAlign: 'center', textShadowColor: '#4A1F07', textShadowOffset: { width: 0, height: 8 }, textShadowRadius: 0 },
});
