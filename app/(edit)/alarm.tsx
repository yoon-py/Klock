// 알람 추가 / 편집 (SPEC 6.2, 디자인 AlarmAdd)
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AlarmSoundCard, MissionCard, SheetHeader, s as sheet } from '../../src/components/sheet';
import { commitDraft, updateDraft, useDraft } from '../../src/store/draft';
import { get } from '../../src/store';
import { DAYS, fromMin, repeatKo, toMin } from '../../src/time';
import { color, font } from '../../src/theme';

export default function AlarmAdd() {
  const { alarm } = useDraft();
  if (!alarm) return null;
  const isNew = !get('alarms').some((a) => a.id === alarm.id);
  const m = toMin(alarm.time);
  const date = new Date();
  date.setHours(Math.floor(m / 60), m % 60, 0, 0);

  return (
    <ScrollView style={{ backgroundColor: color.card }} contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
      <SheetHeader title={isNew ? '알람 추가' : '알람 편집'} onSave={() => { commitDraft(); router.back(); }} />

      <View style={[sheet.card, { paddingBottom: 20 }]}>
        <DateTimePicker
          value={date}
          mode="time"
          display="spinner"
          themeVariant="dark"
          locale="ko-KR"
          onChange={(_, d) => d && updateDraft((x) => { x.alarm!.time = fromMin(d.getHours() * 60 + d.getMinutes()); })}
        />
        <View style={{ paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ ...font.subhead, color: color.textSecondary }}>이름</Text>
          <TextInput
            value={alarm.label}
            onChangeText={(t) => updateDraft((x) => { x.alarm!.label = t; })}
            placeholder="예: 약 먹기"
            placeholderTextColor={color.textTertiary}
            accessibilityLabel="알람 이름"
            style={st.input}
          />
        </View>
      </View>

      <View style={sheet.card}>
        <View style={[sheet.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator }]}>
          <Text style={{ ...font.body, color: color.text, flex: 1 }}>반복</Text>
          <Text style={{ ...font.body, color: color.textSecondary }}>{repeatKo(alarm.repeat)}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, padding: 14, paddingTop: 12 }}>
          {DAYS.map((d, i) => (
            <Pressable
              key={d}
              accessibilityLabel={d + '요일'}
              accessibilityState={{ selected: alarm.repeat[i] }}
              onPress={() => updateDraft((x) => { x.alarm!.repeat[i] = !x.alarm!.repeat[i]; })}
              style={[st.day, { backgroundColor: alarm.repeat[i] ? color.accent : color.fill }]}>
              <Text style={{ fontSize: 17, fontWeight: '500', color: color.text }}>{d}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <MissionCard />
      <AlarmSoundCard />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48, gap: 18 },
  input: { flex: 1, height: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: color.fill, color: color.text, fontSize: 17 },
  day: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
