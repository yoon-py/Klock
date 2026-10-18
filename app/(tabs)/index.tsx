// 알람 탭 (SPEC 6.1, 디자인 Main / TourPlan)
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Switch } from '../../src/components';
import { useSetting, type ExtraAlarm } from '../../src/store';
import { startAlarmDraft, startPlanDraft } from '../../src/store/draft';
import { repeatKo, splitKo, toMin } from '../../src/time';
import { color, font } from '../../src/theme';

export default function AlarmTab() {
  const [schedule] = useSetting('schedule');
  const [alarms, setAlarms] = useSetting('alarms');
  const openPlan = () => { startPlanDraft(); router.push('/plan'); };
  const openAlarm = (id?: string) => { startAlarmDraft(id); router.push('/alarm'); };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScrollView contentContainerStyle={st.page} contentInsetAdjustmentBehavior="automatic">
        <Text style={st.title}>알람</Text>

        <View style={[st.sectionHeader, { marginTop: 52 }]}>
          <SymbolView name="bed.double.fill" size={22} tintColor={color.text} />
          <Text style={st.sectionTitle}>수면 | 기상</Text>
        </View>
        <View style={[st.line, { minHeight: 120 }]}>
          {schedule.enabled ? (
            <View style={{ flex: 1, gap: 4 }}>
              <BigTime min={toMin(schedule.wakeTime)} on />
              <Text style={{ ...font.subhead, color: color.textSecondary }}>매일 · {schedule.bedtime}에 잠들어요</Text>
            </View>
          ) : (
            <Text style={st.empty}>알람 없음</Text>
          )}
          <Pressable onPress={openPlan} style={st.change}>
            <Text style={{ ...font.headline, color: color.accent }}>변경</Text>
          </Pressable>
        </View>

        {alarms.length > 0 ? (
          <>
            <View style={[st.sectionHeader, { marginTop: 28 }]}>
              <Text style={st.sectionTitle}>알람</Text>
            </View>
            {alarms.map((a) => (
              <AlarmRow
                key={a.id}
                alarm={a}
                onPress={() => openAlarm(a.id)}
                onToggle={(enabled) => setAlarms(alarms.map((x) => (x.id === a.id ? { ...x, enabled } : x)))}
                onDelete={() => setAlarms(alarms.filter((x) => x.id !== a.id))}
              />
            ))}
          </>
        ) : null}
      </ScrollView>

      <Pressable accessibilityLabel="알람 추가" onPress={() => openAlarm()} style={st.fab}>
        <SymbolView name="plus" size={24} tintColor="#FFF" weight="semibold" />
      </Pressable>
    </View>
  );
}

function BigTime({ min, on }: { min: number; on: boolean }) {
  const { ap, t } = splitKo(min);
  const c = on ? color.text : '#8E8E93';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
      <Text style={{ fontSize: 30, fontWeight: '300', color: c }}>{ap}</Text>
      <Text style={{ fontSize: 64, fontWeight: '200', letterSpacing: -1.5, color: c }}>{t}</Text>
    </View>
  );
}

function AlarmRow({ alarm, onPress, onToggle, onDelete }: { alarm: ExtraAlarm; onPress: () => void; onToggle: (v: boolean) => void; onDelete: () => void }) {
  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable accessibilityLabel="삭제" onPress={onDelete} style={st.delete}>
          <Text style={{ ...font.headline, color: '#FFF' }}>삭제</Text>
        </Pressable>
      )}>
      <View style={[st.line, { minHeight: 112, backgroundColor: color.bg }]}>
        <Pressable onPress={onPress} style={{ flex: 1, gap: 4, paddingVertical: 10 }}>
          <BigTime min={toMin(alarm.time)} on={alarm.enabled} />
          <Text style={{ ...font.subhead, color: alarm.enabled ? color.text : '#8E8E93' }}>
            {(alarm.label || '알람') + ', ' + repeatKo(alarm.repeat)}
          </Text>
        </Pressable>
        <Switch value={alarm.enabled} onValueChange={onToggle} accessibilityLabel={`${alarm.time} 알람`} />
      </View>
    </Swipeable>
  );
}

const st = StyleSheet.create({
  page: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 160 },
  title: { fontSize: 40, fontWeight: '700', letterSpacing: -0.6, color: color.text },
  sectionHeader: { paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator },
  sectionTitle: { ...font.title, color: color.text },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator },
  empty: { flex: 1, fontSize: 54, fontWeight: '300', letterSpacing: -1, color: '#6E6E73' },
  change: { height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: color.cardRaised, justifyContent: 'center' },
  fab: { position: 'absolute', right: 20, bottom: 110, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(44,44,46,0.92)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 11, shadowOffset: { width: 0, height: 8 } },
  delete: { width: 88, backgroundColor: color.danger, alignItems: 'center', justifyContent: 'center' },
});
