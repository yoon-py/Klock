// 수면 탭 (SPEC 6.8, 디자인 SleepTab)
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSetting } from '../../src/store';
import { startPlanDraft } from '../../src/store/draft';
import { nextWake, setNextWake, useNight, wakeMin } from '../../src/store/night';
import { missionSummary } from '../../src/missions';
import { soundLine } from '../../src/scenes';
import { durKo, fmtKo, toMin } from '../../src/time';
import { color } from '../../src/theme';

export default function SleepTab() {
  const [schedule] = useSetting('schedule');
  useSetting('wakeOnce'); // 다이얼로 바꾸면 다시 그려요
  const [seen] = useSetting('seen');
  const [sleepSound] = useSetting('sleepSound');
  const night = useNight();
  const inset = useSafeAreaInsets();
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t); }, []);

  const next = nextWake(now);
  const wake = wakeMin(next);
  const left = Math.round((next.getTime() - now.getTime()) / 60_000);
  const openPlan = () => { startPlanDraft(); router.push('/plan'); };
  const start = () => {
    if (night.active) return router.push(night.phase === 'sound' ? '/night/sound' : '/night/session');
    router.push(seen.phoneTip ? '/night/sound?start=1' : '/night/tip');
  };

  return (
    <LinearGradient colors={['#17183A', '#0D0E1D', '#09090F']} locations={[0, 0.34, 1]} style={{ flex: 1, paddingTop: inset.top + 36 }}>
      <Text style={st.title}>지금 주무시나요?</Text>
      {schedule.enabled ? <Text style={st.sub}>{durKo(left)} 동안 잘 수 있어요.</Text> : null}

      {/* 화면 높이에 맞춰 위아래로 줄어들어요. 작은 폰에서도 버튼이 탭바 위에 오게 */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={st.headRow}>
          <Text style={{ fontSize: 15, color: color.nightSecondary }}>다음 기상</Text>
        </View>

        {schedule.enabled ? (
          <>
            {/* 돌리면 다음 기상 한 번만 바뀌어요. 매일 기상은 수면 | 기상에서 (2026-10-16 사용자 요청) */}
            <DateTimePicker
              value={new Date(2000, 0, 1, Math.floor(wake / 60), wake % 60)}
              mode="time"
              display="spinner"
              themeVariant="dark"
              locale="ko-KR"
              minuteInterval={5}
              onChange={(_, d) => d && setNextWake(wakeMin(d))}
            />
            {/* 누르면 수면 | 기상 수정 화면으로 */}
            <View style={st.facts}>
              <Fact k="미션" v={missionSummary(schedule.missions)} onPress={openPlan} />
              <Fact k="앱 잠금" v={`${fmtKo(toMin(schedule.bedtime) - schedule.lock.leadMinutes)}부터`} onPress={openPlan} />
              <Fact k="수면 사운드" v={soundLine(sleepSound.scenes)} onPress={() => router.navigate({ pathname: '/explore', params: { mode: 'sleep' } })} />
            </View>
          </>
        ) : (
          <View style={{ height: 230, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <Text style={{ fontSize: 42, fontWeight: '300', color: '#55576A' }}>알람 없음</Text>
            <Pressable onPress={openPlan} style={st.setBtn}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: color.night }}>수면 | 기상 정하기</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Pressable onPress={start} style={[st.start, { marginBottom: Math.max(inset.bottom, 20) + 36 }]}>
        <SymbolView name="play.fill" size={16} tintColor="#16132E" />
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#16132E' }}>수면 시작하기</Text>
      </Pressable>
    </LinearGradient>
  );
}

/** 누를 수 있다는 걸 알리려고 값 둘레에 반투명 칸을 둘러요 */
function Fact({ k, v, onPress }: { k: string; v: string; onPress: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={st.factKey}>{k}</Text>
      <Pressable accessibilityLabel={`${k} ${v} 바꾸기`} onPress={onPress} style={({ pressed }) => [st.factBox, pressed && { opacity: 0.6 }]}>
        <Text style={st.factVal}>{v}</Text>
        <SymbolView name="chevron.right" size={11} tintColor={color.nightSecondary} weight="semibold" />
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  title: { marginHorizontal: 24, fontSize: 31, fontWeight: '700', letterSpacing: -0.6, color: color.nightText },
  sub: { marginTop: 8, marginHorizontal: 24, fontSize: 17, color: color.nightSecondary },
  headRow: { height: 40, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  facts: { marginTop: 6, marginHorizontal: 24, gap: 10 },
  factKey: { width: 92, fontSize: 16, color: '#8E90A8' },
  factVal: { fontSize: 16, color: color.nightText },
  factBox: { height: 34, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  setBtn: { height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center' },
  start: { flexShrink: 0, marginTop: 24, marginHorizontal: 24, height: 58, borderRadius: 29, backgroundColor: color.night, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});
