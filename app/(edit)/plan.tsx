// 수면 | 기상 변경 (SPEC 6.3, 디자인 PlanEdit)
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler'; // 링이 손가락을 잡으면 스크롤이 양보하게
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SleepRing, GOAL_MIN } from '../../src/components/SleepRing';
import { AlarmSoundCard, MissionCard, NavRow, SheetHeader, s as sheet } from '../../src/components/sheet';
import { commitDraft, updateDraft, useDraft } from '../../src/store/draft';
import { durKo, fmtKo, fromMin, leadKo, toMin } from '../../src/time';
import { color, font } from '../../src/theme';

export default function PlanEdit() {
  const d = useDraft();
  const bed = toMin(d.schedule.bedtime), wake = toMin(d.schedule.wakeTime);
  const dur = (((wake - bed) % 1440) + 1440) % 1440;
  // ponytail: 열어 둘 앱 수는 앱 잠금 단계에서 스크린 타임 선택 결과로 더해요. 지금은 Slipper·전화 2개
  const allowCount = 2;
  const [dragging, setDragging] = useState(false);

  return (
    <ScrollView scrollEnabled={!dragging} style={{ backgroundColor: color.card }} contentContainerStyle={st.page}>
      <SheetHeader title="수면 | 기상" onSave={() => { commitDraft(); router.back(); }} />

      <View style={[sheet.card, { paddingTop: 18, paddingBottom: 22, gap: 14 }]}>
        <View style={{ flexDirection: 'row' }}>
          <TimeLabel icon="bed.double.fill" label="취침 시간" value={fmtKo(bed)} />
          <TimeLabel icon="alarm.fill" label="기상" value={fmtKo(wake)} />
        </View>
        <SleepRing
          bed={bed}
          wake={wake}
          onDrag={setDragging}
          onChange={(b, w) => updateDraft((x) => { x.schedule.bedtime = fromMin(b); x.schedule.wakeTime = fromMin(w); })}
        />
        <View style={{ alignItems: 'center', gap: 4, paddingHorizontal: 18 }}>
          <Text style={{ fontSize: 30, fontWeight: '700', color: color.text }}>{durKo(dur)}</Text>
          <Text style={{ ...font.subhead, color: color.textSecondary, textAlign: 'center' }}>
            {dur >= GOAL_MIN ? '이렇게 시간을 지정하면 수면 목표를 충족합니다.' : '이렇게 시간을 지정하면 수면 목표를 충족하지 않습니다.'}
          </Text>
        </View>
      </View>

      <MissionCard />
      <AlarmSoundCard />

      <View style={{ gap: 8 }}>
        <Text style={[sheet.caption, { paddingLeft: 18 }]}>앱 잠금</Text>
        <View style={sheet.card}>
          <NavRow title="앱 제한" value={`${allowCount}개 앱만 열림`} onPress={() => router.push('/block')} divider />
          <NavRow title="잠그는 시각" value={'잠들기 ' + leadKo(d.schedule.lock.leadMinutes)} onPress={() => router.push('/lock-lead')} />
        </View>
      </View>
    </ScrollView>
  );
}

function TimeLabel({ icon, label, value }: { icon: 'bed.double.fill' | 'alarm.fill'; label: string; value: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <SymbolView name={icon} size={15} tintColor="#A8A8AE" />
        <Text style={{ fontSize: 14, fontWeight: '600', color: color.textSecondary }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 30, fontWeight: '700', letterSpacing: -0.4, color: color.text }}>{value}</Text>
    </View>
  );
}

const st = StyleSheet.create({ page: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48, gap: 16 } });
