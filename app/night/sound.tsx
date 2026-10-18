// 수면 중 · 소리 재생 (SPEC 6.12, 디자인 NightSound)
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { Slider } from '../../src/components';
import { EndConfirm } from '../../src/components/EndConfirm';
import { get, set, useSetting } from '../../src/store';
import { endNight, nextWake, fadeToListen, setLayerVolume, startNight, startSound, useNight, wakeMin } from '../../src/store/night';
import { SCENES, scene, soundLine } from '../../src/scenes';
import { startPlanDraft } from '../../src/store/draft';
import { fmtKo, toMin } from '../../src/time';
import { color } from '../../src/theme';

export default function NightSound() {
  const { start } = useLocalSearchParams<{ start?: string }>();
  const night = useNight();
  const [ss, setSs] = useSetting('sleepSound');
  const [schedule] = useSetting('schedule');
  const [sheet, setSheet] = useState<null | 'mix' | 'more' | 'end'>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { if (start && !night.active) startNight(); }, []); // 처음 한 번만
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  // 소리가 다 꺼지면 녹음 화면으로
  useEffect(() => { if (night.active && night.phase === 'listen') router.replace('/night/session'); }, [night.active, night.phase]);

  const a = scene(ss.scenes[0]);
  const leftMs = night.offAt ? Math.max(0, night.offAt - now) : 0;
  const mm = String(Math.floor(leftMs / 60000)).padStart(2, '0'), sec = String(Math.floor(leftMs / 1000) % 60).padStart(2, '0');
  const dim = night.startedAt && now - night.startedAt > 30_000 ? 0.75 : 0.55; // 30초 뒤 더 어둡게
  const nextScene = SCENES.find((x) => !ss.scenes.includes(x.id));

  const setVol = (k: 'beat' | 'sceneA' | 'sceneB', v: number) => {
    setSs({ ...get('sleepSound'), volumes: { ...get('sleepSound').volumes, [k]: v } });
    setLayerVolume(k === 'beat' ? 'beat' : k === 'sceneA' ? 'a' : 'b', v);
  };
  const setSecond = (id: string | null) => {
    set('sleepSound', { ...get('sleepSound'), scenes: id ? [ss.scenes[0], id as never].filter(Boolean) : ss.scenes.slice(0, 1) });
    startSound(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* TODO: 장면 영상 (ASSETS.md 3장). 받기 전까지는 장면 색 */}
      <LinearGradient colors={a?.bg ?? ['#08080C', '#08080C']} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${dim})` }]} />

      <Pressable accessibilityLabel="뒤로" onPress={() => router.back()} style={st.back}>
        <SymbolView name="chevron.left" size={20} tintColor="#FFF" weight="semibold" />
      </Pressable>

      <View style={st.center}>
        <Text style={{ fontSize: 17, color: 'rgba(255,255,255,0.78)' }}>기상 알람</Text>
        <Pressable onPress={() => { startPlanDraft(); router.push('/plan'); }} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingLeft: 36 }}>
          <Text style={st.alarm}>{fmtKo(wakeMin(nextWake()))}</Text>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>수정</Text>
        </Pressable>
        <View style={{ marginTop: 26, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <SymbolView name="music.note" size={16} tintColor="rgba(255,255,255,0.7)" />
          <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>{soundLine(ss.scenes, ss.monauralBeat)}</Text>
        </View>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          {ss.offAfter === 'morning' ? '알람 30분 전에 서서히 꺼져요' : `${mm}:${sec} 뒤 서서히 꺼지고, 그때부터 코골이를 들어요`}
        </Text>
      </View>

      <View style={st.controls}>
        <Pressable accessibilityLabel="소리 섞기" onPress={() => setSheet('mix')} style={st.ctl}>
          <SymbolView name="music.note.list" size={28} tintColor="#E5E5EA" />
        </Pressable>
        <Pressable accessibilityLabel="수면 종료" onPress={() => setSheet('end')} style={st.endBtn}>
          <SymbolView name="xmark" size={28} tintColor="#1C1C1E" weight="bold" />
        </Pressable>
        <Pressable accessibilityLabel="더보기" onPress={() => setSheet('more')} style={st.ctl}>
          <SymbolView name="ellipsis" size={28} tintColor="#E5E5EA" />
        </Pressable>
      </View>

      {sheet ? <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} onPress={() => setSheet(null)} /> : null}

      {sheet === 'mix' ? (
        <View style={st.panel}>
          <View style={st.panelHead}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFF' }}>소리 섞기</Text>
            <Pressable onPress={() => setSheet(null)}><Text style={st.done}>완료</Text></Pressable>
          </View>
          <Layer name="모노럴 비트" note="바닥에 낮게" value={ss.volumes.beat} onChange={(v) => setVol('beat', v)} />
          <Layer name={a?.name ?? '장면 없음'} note="장면 1" value={ss.volumes.sceneA} onChange={(v) => setVol('sceneA', v)} />
          {ss.scenes[1] ? (
            <Layer name={scene(ss.scenes[1])!.name} value={ss.volumes.sceneB} onChange={(v) => setVol('sceneB', v)} onRemove={() => setSecond(null)} />
          ) : nextScene && a ? (
            <Pressable onPress={() => setSecond(nextScene.id)} style={st.addB}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#C9C2FF' }}>+ 장면 하나 더 섞기 · {nextScene.name}</Text>
            </Pressable>
          ) : null}
          <Text style={{ marginTop: 12, fontSize: 13, color: color.nightSecondary }}>장면은 2개까지 섞을 수 있어요. 배경 화면은 장면 1을 따라가요.</Text>
        </View>
      ) : null}

      {sheet === 'more' ? (
        <View style={[st.panel, { paddingHorizontal: 12 }]}>
          <MenuItem icon="music.note" label="다른 소리 고르기" onPress={() => { setSheet(null); router.push('/sound-sheet'); }} />
          <MenuItem icon="moon.fill" label="지금 소리 끄고 녹음 시작" onPress={() => { setSheet(null); fadeToListen(2000); }} />
          <Pressable onPress={() => setSheet(null)} style={st.close}><Text style={{ fontSize: 17, color: '#FFF' }}>닫기</Text></Pressable>
        </View>
      ) : null}

      {sheet === 'end' ? (
        <EndConfirm
          title="수면을 끝낼까요?"
          body={`소리와 밤사이 녹음이 멈춰요. 앱 잠금과 ${fmtKo(wakeMin(nextWake()))} 알람은 그대로예요.`}
          action="끝내기"
          onEnd={() => { endNight(); router.back(); }}
          onKeep={() => setSheet(null)}
        />
      ) : null}
    </View>
  );
}

function Layer({ name, note, value, onChange, onRemove }: { name: string; note?: string; value: number; onChange: (v: number) => void; onRemove?: () => void }) {
  return (
    <View style={{ paddingVertical: 10, gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 }}>
        <Text style={{ fontSize: 16, color: '#FFF' }}>{name}</Text>
        {onRemove ? (
          <Pressable onPress={onRemove} style={{ height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, color: color.nightText }}>빼기</Text>
          </Pressable>
        ) : <Text style={{ fontSize: 13, color: color.nightSecondary }}>{note}</Text>}
      </View>
      <Slider value={value} onValueChange={onChange} tint={color.night} accessibilityLabel={name + ' 음량'} />
    </View>
  );
}

function MenuItem({ icon, label, onPress }: { icon: 'music.note' | 'moon.fill'; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ height: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <SymbolView name={icon} size={20} tintColor="#C9C2FF" />
      <Text style={{ fontSize: 17, color: '#FFF' }}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  back: { position: 'absolute', top: 60, left: 16, width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(60,60,66,0.6)', alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', top: 236, left: 0, right: 0, alignItems: 'center', gap: 10 },
  alarm: { fontSize: 58, fontWeight: '400', letterSpacing: -1, color: 'rgba(255,255,255,0.88)', textDecorationLine: 'underline' },
  controls: { position: 'absolute', left: 40, right: 40, bottom: 120, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  ctl: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  endBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(230,230,235,0.88)', alignItems: 'center', justifyContent: 'center' },
  panel: { position: 'absolute', left: 8, right: 8, bottom: 8, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 26, borderRadius: 34, backgroundColor: 'rgba(40,40,48,0.96)' },
  panelHead: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  done: { fontSize: 17, fontWeight: '600', color: color.night },
  addB: { marginTop: 6, height: 52, borderRadius: 14, backgroundColor: 'rgba(169,157,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  close: { marginTop: 6, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
});
