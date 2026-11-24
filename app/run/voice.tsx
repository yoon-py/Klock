// 따라 말하기 미션 (SPEC 6.15, 디자인 MissionVoice). 아이폰 음성 인식(한국어)으로 들은 단어가 하나씩 밝아져요.
// 음성은 폰 안에서만 인식해요. 폰이 기기 안 인식을 못 하면 서버로 보내지 않고 안내만 해요 (CLAUDE.md).
import { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Clear, MissionTop, sfx } from '../../src/components/mission';
import { getRun, quietAlarm } from '../../src/store/run';
import { VOICE_SENTENCES } from '../../src/missions';
import { heardWords } from '../../src/speech';
import { color } from '../../src/theme';

/** 고른 문장 중에서 count개를 겹치지 않게 뽑아요 */
function pickSentences() {
  const m = getRun().missions[getRun().index];
  const pool = m?.type === 'repeat_sentence' && m.sentenceIds?.length ? m.sentenceIds : VOICE_SENTENCES;
  const count = m?.type === 'repeat_sentence' ? m.count ?? 1 : 1;
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count).map((x) => x.split(' '));
}

type Blocked = null | 'permission' | 'offline';
type SpeechPackage = typeof import('expo-speech-recognition');

let cachedSpeech: SpeechPackage | null | undefined;

function getSpeechPackage() {
  if (cachedSpeech !== undefined) return cachedSpeech;
  try {
    cachedSpeech = require('expo-speech-recognition') as SpeechPackage;
  } catch {
    cachedSpeech = null;
  }
  return cachedSpeech;
}

export default function VoiceRoute() {
  const speechPackage = getSpeechPackage();
  if (!speechPackage) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <MissionTop progressKey="speech-module-unavailable" />
        <Clear text="음성 인식 미션을 건너뛰어요" />
      </View>
    );
  }
  return <Voice speechPackage={speechPackage} />;
}

function Voice({ speechPackage }: { speechPackage: SpeechPackage }) {
  const Speech = speechPackage.ExpoSpeechRecognitionModule;
  const useSpeechRecognitionEvent = speechPackage.useSpeechRecognitionEvent;
  const [list] = useState(pickSentences);
  const [at, setAt] = useState(0); // 몇 번째 문장
  const [heard, setHeard] = useState(0);
  const [listening, setListening] = useState(false);
  const [blocked, setBlocked] = useState<Blocked>(null);
  const SENTENCE = list[at];
  const done = at + 1 >= list.length && heard >= SENTENCE.length;
  const state = useRef({ at, heard, done });
  state.current = { at, heard, done };

  const listen = async () => {
    if (state.current.done) return;
    if (!(await Speech.requestPermissionsAsync()).granted) return setBlocked('permission');
    if (!Speech.supportsOnDeviceRecognition()) return setBlocked('offline');
    quietAlarm(); // 마이크가 알람 소리를 듣지 않게
    Speech.start({ lang: 'ko-KR', interimResults: true, continuous: true, requiresOnDeviceRecognition: true, contextualStrings: list[state.current.at] });
  };
  useEffect(() => { listen(); return () => Speech.abort(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    if (!state.current.done) setTimeout(listen, 300); // 조용해서 끊겼으면 다시 들어요
  });
  useSpeechRecognitionEvent('error', (e) => { if (e.error === 'not-allowed') setBlocked('permission'); });
  useSpeechRecognitionEvent('result', (e) => {
    const words = list[state.current.at];
    const n = heardWords(words, e.results[0]?.transcript ?? '');
    if (n <= state.current.heard) return;
    sfx('tick');
    setHeard(n);
    if (n >= words.length && state.current.at + 1 < list.length) {
      // 다음 문장: 새로 듣기 시작해서 앞 문장 글자가 섞이지 않게
      setTimeout(() => { setAt(state.current.at + 1); setHeard(0); Speech.abort(); }, 500);
    }
  });
  useEffect(() => { if (done) Speech.abort(); }, [done]);

  const lv = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(lv, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(lv, { toValue: 0.35, duration: 450, useNativeDriver: true }),
    ])).start();
  }, [lv]);

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
      {blocked ? (
        <View style={{ position: 'absolute', left: 24, right: 24, bottom: 150, alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 16, lineHeight: 22, color: '#FFF', textAlign: 'center' }}>
            {blocked === 'permission' ? '마이크·음성 인식 권한이 꺼져 있어요' : '이 폰은 기기 안 음성 인식을 지원하지 않아서 이 미션을 쓸 수 없어요'}
          </Text>
          {blocked === 'permission' ? (
            <Pressable onPress={() => Linking.openSettings()} style={{ height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: color.cardRaised, justifyContent: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: color.accent }}>설정에서 켜기</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 172, height: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, opacity: listening ? 1 : 0.3 }}>
          {[10, 18, 26, 14, 22, 12, 8].map((h, i) => (
            <Animated.View key={i} style={{ width: 4, height: h, borderRadius: 2, backgroundColor: color.accent, transform: [{ scaleY: listening ? lv : 0.35 }] }} />
          ))}
        </View>
      )}
      <Pressable accessibilityLabel={listening ? '듣는 중' : '다시 듣기'} onPress={() => { if (!listening) listen(); }} style={{ position: 'absolute', alignSelf: 'center', bottom: 58, width: 76, height: 76, borderRadius: 38, backgroundColor: listening ? color.accent : color.fill, alignItems: 'center', justifyContent: 'center' }}>
        <SymbolView name="mic.fill" size={28} tintColor={listening ? '#041215' : '#FFF'} />
      </Pressable>
      {done ? <Clear text="문장을 끝까지 읽었어요" /> : null}
    </View>
  );
}
