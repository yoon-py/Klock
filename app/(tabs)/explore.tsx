// 탐색 탭: 수면 사운드와 알람 사운드를 한 곳에서 미리 듣고 골라요.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { get, useSetting, type SceneId, type SleepSound, type WakeSoundId } from '../../src/store';
import { updateDraftAlarmSound, useDraft } from '../../src/store/draft';
import { getNightState, startSound } from '../../src/store/night';
import { SCENES, scene, soundLine } from '../../src/scenes';
import { WAKE_SOUNDS, wakeSoundFile, wakeSoundName } from '../../src/sounds';

type Mode = 'sleep' | 'alarm';
const OFFS: { label: string; value: SleepSound['offAfter'] }[] = [
  { label: '30분', value: 30 },
  { label: '1시간', value: 60 },
  { label: '아침까지', value: 'morning' },
];
const PREVIEW_MS = 10_000;

export default function Explore() {
  const params = useLocalSearchParams<{ mode?: string; picker?: string }>();
  const inset = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>(params.mode === 'alarm' ? 'alarm' : 'sleep');
  const picker = params.picker === '1';
  const [sleepSound, setSleepSound] = useSetting('sleepSound');
  const [schedule, setSchedule] = useSetting('schedule');
  const draft = useDraft();
  const selectedAlarm = picker ? (draft.alarm ?? draft.schedule).wakeSound : schedule.wakeSound;
  const [playing, setPlaying] = useState<string | null>(null);
  const players = useRef<AudioPlayer[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { if (params.mode === 'alarm' || params.mode === 'sleep') setMode(params.mode); }, [params.mode]);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    players.current.forEach((player) => { player.pause(); player.remove(); });
    players.current = [];
    setPlaying(null);
  }, []);
  useFocusEffect(useCallback(() => stop, [stop]));
  useEffect(() => stop, [stop]);

  const play = async (key: string, files: number[], volumes: number[]) => {
    if (playing === key) return stop();
    stop();
    if (!files.length) return;
    await setAudioModeAsync({ allowsRecording: false, shouldRouteThroughEarpiece: false, playsInSilentMode: true });
    players.current = files.map((file, index) => {
      const player = createAudioPlayer(file);
      player.volume = Math.min(volumes[index] ?? 0.6, 0.6);
      player.loop = true;
      player.play();
      return player;
    });
    setPlaying(key);
    timer.current = setTimeout(stop, PREVIEW_MS);
  };

  const previewSleep = (id: SceneId) => {
    const file = scene(id)?.sound;
    if (file) play(`sleep:${id}`, [file], [sleepSound.volumes.sceneA]);
  };
  const previewAlarm = (id: WakeSoundId) => play(`alarm:${id}`, [wakeSoundFile(id)], [picker ? (draft.alarm ?? draft.schedule).volume : schedule.volume]);

  const saveSleep = (next: SleepSound) => {
    setSleepSound(next);
    const night = getNightState();
    if (night.active) startSound(night.phase === 'listen');
  };
  const selectSleep = (id: SceneId) => {
    if (!scene(id)?.sound) return;
    Haptics.selectionAsync();
    const selected = sleepSound.scenes.includes(id);
    const sounds = selected ? sleepSound.scenes.filter((sound) => sound !== id) : sleepSound.scenes.length < 2 ? [...sleepSound.scenes, id] : [sleepSound.scenes[0], id];
    saveSleep({ ...sleepSound, scenes: sounds });
    if (!selected) previewSleep(id);
  };
  const selectAlarm = (id: WakeSoundId) => {
    Haptics.selectionAsync();
    if (picker) updateDraftAlarmSound({ wakeSound: id });
    else setSchedule({ ...get('schedule'), wakeSound: id });
    previewAlarm(id);
  };

  const currentTitle = mode === 'sleep' ? soundLine(sleepSound.scenes) : wakeSoundName(selectedAlarm);

  return (
    <View style={[st.page, { paddingTop: inset.top + 24 }]}>
      <View style={st.header}>
        <Text style={st.title}>{picker ? '알람 사운드 선택' : '탐색'}</Text>
        {picker ? (
          <Pressable accessibilityLabel="완료" onPress={() => { stop(); router.back(); }} style={st.doneButton}>
            <Text style={st.doneText}>완료</Text>
          </Pressable>
        ) : null}
      </View>

      {!picker ? (
        <View style={st.segment}>
          {(['sleep', 'alarm'] as const).map((item) => (
            <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: mode === item }} onPress={() => { stop(); setMode(item); }} style={[st.segmentButton, mode === item && st.segmentButtonOn]}>
              <Text style={[st.segmentText, mode === item && st.segmentTextOn]}>{item === 'sleep' ? '수면 사운드' : '알람 사운드'}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: inset.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <Text style={st.caption}>현재 사용 중</Text>
        <View style={st.currentCard}>
          <View style={st.currentIcon}>
            <Text style={st.currentIconText}>{mode === 'sleep' ? '☾' : '♪'}</Text>
          </View>
          <Text style={st.currentName} numberOfLines={1}>{currentTitle}</Text>
          <SelectionMark selected />
        </View>

        {mode === 'sleep' ? (
          <SleepLibrary
            value={sleepSound}
            playing={playing}
            onSelect={selectSleep}
            onPreview={previewSleep}
            onFavorite={(id) => saveSleep({ ...sleepSound, favorites: sleepSound.favorites.includes(id) ? sleepSound.favorites.filter((sound) => sound !== id) : [...sleepSound.favorites, id] })}
            onOffAfter={(offAfter) => saveSleep({ ...sleepSound, offAfter })}
          />
        ) : (
          <AlarmLibrary value={selectedAlarm} playing={playing} onSelect={selectAlarm} onPreview={previewAlarm} />
        )}
      </ScrollView>
    </View>
  );
}

function SleepLibrary({ value, playing, onSelect, onPreview, onFavorite, onOffAfter }: {
  value: SleepSound;
  playing: string | null;
  onSelect: (id: SceneId) => void;
  onPreview: (id: SceneId) => void;
  onFavorite: (id: SceneId) => void;
  onOffAfter: (value: SleepSound['offAfter']) => void;
}) {
  return (
    <>
      <Text style={st.section}>모든 수면 사운드</Text>
      <View style={st.group}>
        {SCENES.map((sound, index) => {
          const selected = value.scenes.includes(sound.id);
          const favorite = value.favorites.includes(sound.id);
          return (
            <View key={sound.id} style={[st.row, index < SCENES.length - 1 && st.divider]}>
              <Pressable disabled={!sound.sound} accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled: !sound.sound }} onPress={() => onSelect(sound.id)} style={[st.rowMain, !sound.sound && { opacity: 0.45 }]}>
                <SelectionMark selected={selected} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={st.rowName}>{sound.name}</Text>
                  <Text style={st.rowNote}>{sound.tag}{sound.sound ? '' : ' · 음원 준비 중'}</Text>
                </View>
              </Pressable>
              <Pressable accessibilityLabel={`${sound.name} 즐겨찾기`} onPress={() => onFavorite(sound.id)} style={st.iconButton}>
                <Text style={{ fontSize: 20, color: favorite ? '#FF6B8A' : '#A5A5AC' }}>{favorite ? '♥' : '♡'}</Text>
              </Pressable>
              {sound.sound ? (
                <Pressable accessibilityLabel={`${sound.name} 미리 듣기`} onPress={() => onPreview(sound.id)} style={st.playButton}>
                  <Text style={st.playText}>{playing === `sleep:${sound.id}` ? 'Ⅱ' : '▶'}</Text>
                </Pressable>
              ) : <View style={st.playPlaceholder} />}
            </View>
          );
        })}
      </View>

      <Text style={st.section}>끄는 시간</Text>
      <View style={st.segment}>
        {OFFS.map((item) => (
          <Pressable key={item.label} accessibilityRole="radio" accessibilityState={{ checked: value.offAfter === item.value }} onPress={() => onOffAfter(item.value)} style={[st.segmentButton, value.offAfter === item.value && st.segmentButtonOn]}>
            <Text style={[st.segmentText, value.offAfter === item.value && st.segmentTextOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={st.help}>{value.offAfter === 'morning' ? '알람 30분 전까지 재생해요.' : '설정한 시간이 지나면 서서히 소리를 줄여요.'}</Text>
    </>
  );
}

function AlarmLibrary({ value, playing, onSelect, onPreview }: {
  value: WakeSoundId;
  playing: string | null;
  onSelect: (id: WakeSoundId) => void;
  onPreview: (id: WakeSoundId) => void;
}) {
  const categories = ['기본 알람', '자연 기상음', '음악'] as const;
  return (
    <>
      {categories.map((category) => (
        <View key={category}>
          <Text style={st.section}>{category}</Text>
          <View style={st.group}>
            {WAKE_SOUNDS.filter((sound) => sound.category === category).map((sound, index, list) => {
              const selected = value === sound.id;
              return (
                <View key={sound.id} style={[st.row, index < list.length - 1 && st.divider]}>
                  <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => onSelect(sound.id)} style={st.rowMain}>
                    <SelectionMark selected={selected} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={st.rowName}>{sound.name}</Text>
                      <Text style={st.rowNote}>{sound.ready ? (sound.license === 'cc0' ? 'CC0 무료 음원' : '자체 제작') : '임시 사운드 · 출시 전 교체'}</Text>
                    </View>
                  </Pressable>
                  <Pressable accessibilityLabel={`${sound.name} 미리 듣기`} onPress={() => onPreview(sound.id)} style={st.playButton}>
                    <Text style={st.playText}>{playing === `alarm:${sound.id}` ? 'Ⅱ' : '▶'}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      ))}
      <Text style={st.help}>음악은 직접 제작했거나 앱 배포 권리가 확인된 파일만 추가돼요.</Text>
    </>
  );
}

function SelectionMark({ selected }: { selected: boolean }) {
  return (
    <View style={[st.selectionMark, selected && st.selectionMarkOn]}>
      {selected ? <Text style={st.selectionCheck}>✓</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#09090B' },
  header: { minHeight: 52, marginHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 34, fontWeight: '700', letterSpacing: -0.7, color: '#F7F7F8' },
  doneButton: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F2F2F3', justifyContent: 'center' },
  doneText: { fontSize: 15, fontWeight: '700', color: '#111113' },
  segment: { marginHorizontal: 20, marginTop: 14, padding: 3, height: 44, borderRadius: 13, backgroundColor: '#1C1C1F', flexDirection: 'row', gap: 3 },
  segmentButton: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentButtonOn: { backgroundColor: '#F1F1F2' },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#99999F' },
  segmentTextOn: { color: '#111113' },
  caption: { marginTop: 26, marginBottom: 8, marginHorizontal: 24, fontSize: 13, color: '#8D8D94' },
  currentCard: { minHeight: 72, marginHorizontal: 16, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#1B1B1E', flexDirection: 'row', alignItems: 'center', gap: 12 },
  currentIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#35353A', alignItems: 'center', justifyContent: 'center' },
  currentIconText: { fontSize: 24, fontWeight: '600', color: '#FFFFFF' },
  currentName: { flex: 1, fontSize: 17, fontWeight: '600', color: '#F5F5F6' },
  section: { marginTop: 28, marginBottom: 9, marginHorizontal: 24, fontSize: 20, fontWeight: '700', color: '#F5F5F6' },
  group: { marginHorizontal: 16, borderRadius: 20, paddingHorizontal: 14, backgroundColor: '#171719', overflow: 'hidden' },
  row: { minHeight: 66, flexDirection: 'row', alignItems: 'center' },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#36363B' },
  rowMain: { minHeight: 66, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowName: { fontSize: 16, color: '#F3F3F4' },
  rowNote: { fontSize: 12, color: '#898990' },
  iconButton: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#ECECEE', alignItems: 'center', justifyContent: 'center' },
  playText: { marginLeft: 1, fontSize: 13, fontWeight: '800', color: '#111113' },
  playPlaceholder: { width: 38 },
  selectionMark: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#77777E', alignItems: 'center', justifyContent: 'center' },
  selectionMarkOn: { borderColor: '#F2F2F3', backgroundColor: '#F2F2F3' },
  selectionCheck: { fontSize: 14, lineHeight: 17, fontWeight: '900', color: '#111113' },
  help: { marginTop: 10, marginHorizontal: 24, fontSize: 13, lineHeight: 19, color: '#85858C' },
});
