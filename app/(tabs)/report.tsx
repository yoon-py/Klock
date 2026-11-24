// 리포트 탭 (SPEC 6.17, 디자인 Records). 늘 오늘(지난밤)으로 열리고, 날짜 칩으로 다른 날을 골라요.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { nightOf, sleptMin, wakeSec, weekStats, ymd } from '../../src/report';
import { useSetting } from '../../src/store';
import { durKo } from '../../src/time';
import { color } from '../../src/theme';

const DOW = ['월', '화', '수', '목', '금', '토', '일'];
const hm = (iso: string) => { const d = new Date(iso); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const ms = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export default function ReportTab() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const [schedule] = useSetting('schedule'); // 일정이 바뀌면 다시 계산
  const [, refresh] = useState(0);
  useFocusEffect(useCallback(() => refresh((x) => x + 1), [])); // 탭을 열 때마다 새 기록 반영
  const today = ymd(new Date());
  const day = date ?? today;
  const d = new Date(day + 'T12:00:00');
  const night = nightOf(day);
  const slept = night ? sleptMin(night) : null;
  const wake = night ? wakeSec(night) : null;
  const week = weekStats(d);
  const goal = night?.goalMinutes ?? 0;
  const max = Math.max(600, ...week.days.map((x) => x.slept ?? 0));

  const player = useRef<AudioPlayer | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  useEffect(() => () => { player.current?.pause(); player.current?.remove(); }, []);
  const toggle = (id: string, file: string) => {
    player.current?.pause();
    player.current?.remove();
    player.current = null;
    if (playing === id) return setPlaying(null);
    const p = createAudioPlayer({ uri: file });
    p.play();
    player.current = p;
    setPlaying(id);
  };
  const snore = night?.sounds.filter((x) => x.kind === 'snore').length ?? 0;
  const talk = night?.sounds.filter((x) => x.kind === 'talk').length ?? 0;

  return (
    <ScrollView style={{ backgroundColor: color.bg }} contentContainerStyle={{ paddingTop: 8, paddingBottom: 140 }} contentInsetAdjustmentBehavior="automatic">
      <View style={st.head}>
        <Text style={st.title}>리포트</Text>
        <Pressable onPress={() => router.push({ pathname: '/report-dates', params: { date: day } })} style={st.chip}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#FFF' }}>{day === today ? '오늘' : `${d.getMonth() + 1}월 ${d.getDate()}일`}</Text>
          <SymbolView name="chevron.down" size={11} tintColor="#FFF" weight="semibold" />
        </Pressable>
        <Pressable accessibilityLabel="설정" onPress={() => router.push('/settings')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <SymbolView name="gearshape" size={22} tintColor={color.textSecondary} />
        </Pressable>
      </View>
      <Text style={{ paddingHorizontal: 20, fontSize: 15, color: color.textSecondary }}>
        {d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })} · 지난밤
      </Text>

      <View style={{ marginTop: 22, marginHorizontal: 20, gap: 6 }}>
        <Text style={st.label}>잔 시간</Text>
        {slept ? (
          <>
            <Text style={st.big}>
              {Math.floor(slept / 60)}<Text style={st.unit}> 시간 </Text>{slept % 60}<Text style={st.unit}> 분</Text>
            </Text>
            <Text style={{ marginTop: 6, fontSize: 15, color: '#FFF' }}>
              {hm(night!.sleepStart!)} 수면 시작 → {night!.alarmAt ? hm(night!.alarmAt) : schedule.wakeTime} 알람
            </Text>
            {goal ? (
              <Text style={st.label}>
                목표 {durKo(goal)}보다 {durKo(Math.abs(goal - slept))} {slept < goal ? '적어요' : '많아요'}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={{ fontSize: 22, fontWeight: '300', color: '#FFF' }}>수면 시작을 누르지 않았어요</Text>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 26, gap: 28 }}>
        <Section title="이번 주">
          <View style={[st.card, { padding: 18, paddingBottom: 14, gap: 14 }]}>
            <Text style={{ fontSize: 17, fontWeight: '600', lineHeight: 24, color: '#FFF' }}>
              {week.avgSlept
                ? `하루 평균 ${durKo(week.avgSlept)} 잤어요.` + (goal ? ` 목표보다 ${durKo(Math.abs(goal - week.avgSlept))} ${week.avgSlept < goal ? '적어요' : '많아요'}.` : '')
                : '이번 주 기록이 아직 없어요.'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {week.days.map((x, i) => {
                const on = x.date === day;
                return (
                  <View key={x.date} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                    <View style={{ width: '100%', height: 120 }}>
                      {x.slept ? <View style={[st.bar, { height: (x.slept / max) * 120, backgroundColor: on ? color.accent : color.fill }]} /> : null}
                      {x.goal ? <View style={[st.goal, { bottom: (x.goal / max) * 120 }]} /> : null}
                    </View>
                    <Text style={{ fontSize: 13, color: on ? '#FFF' : color.textSecondary, fontWeight: on ? '600' : '400' }}>{DOW[i]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </Section>

        <Section title="일어나기">
          <View style={[st.card, { padding: 16, paddingHorizontal: 18, flexDirection: 'row' }]}>
            <Stat label="오늘 알람에서 미션까지" sec={wake} />
            <Stat label="이번 주 평균" sec={week.avgWake} />
          </View>
        </Section>

        <Section title="밤사이 소리" right={night?.sounds.length ? `코골이 ${snore}번 · 잠꼬대 ${talk}번` : undefined}>
          <View style={st.card}>
            {night?.sounds.length ? (
              night.sounds.map((x, i) => (
                <Pressable key={x.id} onPress={() => toggle(x.id, x.file)} accessibilityLabel={`${hm(x.at)} ${x.kind === 'snore' ? '코골이' : '잠꼬대'} 녹음 듣기`} style={[st.clip, i < night.sounds.length - 1 && st.sep]}>
                  <View style={st.play}><SymbolView name={playing === x.id ? 'pause.fill' : 'play.fill'} size={12} tintColor="#041215" /></View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontSize: 17, color: '#FFF' }}>{x.kind === 'snore' ? '코골이' : '잠꼬대'}</Text>
                    <Text style={{ fontSize: 13, color: color.textSecondary }}>{hm(x.at)}</Text>
                  </View>
                  <Text style={{ fontSize: 15, color: color.textSecondary }}>{ms(x.durationSec)}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={{ padding: 18, fontSize: 15, color: color.textSecondary }}>녹음된 소리가 없어요. 폰에만 7일 보관해요.</Text>
            )}
          </View>
        </Section>
      </View>
    </ScrollView>
  );
}

function Section({ title, right, children }: { title: string; right?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: -0.3, color: '#FFF' }}>{title}</Text>
        {right ? <Text style={{ fontSize: 14, color: color.textSecondary }}>{right}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Stat({ label, sec }: { label: string; sec: number | null }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={{ fontSize: 13, color: color.textSecondary }}>{label}</Text>
      <Text style={{ fontSize: 28, fontWeight: '300', color: '#FFF' }}>
        {sec === null ? '-' : <>{Math.floor(sec / 60)}<Text style={st.small}>분 </Text>{sec % 60}<Text style={st.small}>초</Text></>}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  head: { height: 52, paddingLeft: 20, paddingRight: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { flex: 1, fontSize: 34, fontWeight: '700', letterSpacing: -0.6, color: '#FFF' },
  chip: { height: 32, paddingLeft: 12, paddingRight: 10, borderRadius: 16, backgroundColor: color.card, flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 15, color: color.textSecondary },
  big: { fontSize: 64, fontWeight: '200', letterSpacing: -2, color: '#FFF' },
  unit: { fontSize: 22, fontWeight: '300', letterSpacing: 0, color: color.textSecondary },
  small: { fontSize: 15, color: color.textSecondary },
  card: { borderRadius: 22, backgroundColor: color.card, overflow: 'hidden' },
  bar: { position: 'absolute', bottom: 0, alignSelf: 'center', width: 22, borderRadius: 7 },
  goal: { position: 'absolute', alignSelf: 'center', width: 30, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.75)' },
  clip: { minHeight: 58, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 14 },
  sep: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator },
  play: { width: 32, height: 32, borderRadius: 16, backgroundColor: color.accent, alignItems: 'center', justifyContent: 'center' },
});
