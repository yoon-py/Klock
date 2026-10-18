// 다른 날짜 보기 (SPEC 6.17, 디자인 RecordsDateSheet)
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { getNights } from '../src/store';
import { sleptMin, ymd } from '../src/report';
import { durKo } from '../src/time';
import { color } from '../src/theme';

export default function ReportDates() {
  const today = ymd(new Date());
  const [sel, setSel] = useState(useLocalSearchParams<{ date?: string }>().date ?? today);
  // 오늘 + 기록이 있는 최근 날짜들
  const nights = getNights(30);
  const dates = [today, ...nights.map((n) => n.date).filter((x) => x !== today)];
  const label = (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <View style={{ flex: 1, backgroundColor: color.card, paddingHorizontal: 24, paddingTop: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.3, color: '#FFF' }}>다른 날짜 보기</Text>
      <Text style={{ marginTop: 4, fontSize: 13, color: color.textSecondary }}>리포트 탭은 늘 오늘 리포트로 열려요. 지난 날짜는 여기서 골라요.</Text>
      <ScrollView style={{ marginTop: 16 }} contentContainerStyle={{ gap: 2 }}>
        {dates.map((date) => {
          const n = nights.find((x) => x.date === date);
          const slept = n ? sleptMin(n) : null;
          const snoreSec = n?.sounds.filter((x) => x.kind === 'snore').reduce((a, x) => a + x.durationSec, 0) ?? 0;
          const on = sel === date;
          return (
            <Pressable key={date} onPress={() => setSel(date)} style={[st.row, on && { backgroundColor: 'rgba(255,181,71,0.16)' }]}>
              <View style={{ gap: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: on ? '600' : '500', color: '#FFF' }}>{label(date)}</Text>
                <Text style={{ fontSize: 12, color: '#6C6C70' }}>{(date === today ? '오늘 · ' : '') + (slept ? durKo(slept) : '기록 없음')}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 15, color: '#C7C7CC' }}>{snoreSec ? `코골이 ${Math.max(1, Math.round(snoreSec / 60))}분` : '코골이 없음'}</Text>
                {on ? <SymbolView name="checkmark.circle" size={18} tintColor="#FFB547" /> : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable onPress={() => router.dismissTo({ pathname: '/report', params: sel === today ? {} : { date: sel } })} style={st.cta}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#000' }}>{sel === today ? '오늘' : label(sel).split(' ').slice(0, 2).join(' ')} 리포트 보기</Text>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  row: { paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cta: { marginTop: 16, marginBottom: 30, height: 54, borderRadius: 27, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
});
