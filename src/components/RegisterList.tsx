// 사진·바코드 미션 공통: 처음 안내 화면 / 등록한 것 격자 (디자인 MissionPhotoSet·List, CodeRegister·List)
import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { BottomButtons, PushHeader } from './sheet';
import { color } from '../theme';

export function RegisterIntro({ title, headline, icon, note, children }: { title: string; headline: string; icon: SFSymbol; note: string; children: ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: color.card }}>
      <PushHeader title={title} />
      <Text style={st.headline}>{headline}</Text>
      {/* TODO: 예시 사진 (ASSETS.md 3장). 받기 전까지는 아이콘으로 자리만 */}
      <View style={st.example}>
        <SymbolView name={icon} size={96} tintColor="#8E8E93" />
      </View>
      <Text style={st.note}>{note}</Text>
      <View style={{ position: 'absolute', left: 24, right: 24, bottom: 40, gap: 10 }}>{children}</View>
    </View>
  );
}

export function BigButton({ label, onPress, light }: { label: string; onPress: () => void; light?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[st.big, { backgroundColor: light ? '#F2F2F7' : color.fill }]}>
      <Text style={{ fontSize: 17, fontWeight: light ? '700' : '600', color: light ? '#000' : color.text }}>{label}</Text>
    </Pressable>
  );
}

export function RegisterGrid({ title, items, checked, onToggle, onAdd, note, onPreview, onDone }: {
  title: string;
  items: { id: string; uri?: string; label?: string }[];
  checked: string[];
  onToggle: (id: string) => void;
  onAdd: () => void;
  note: string;
  onPreview: () => void;
  onDone: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: color.card }}>
      <PushHeader title={title} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={st.grid}>
          <Pressable onPress={onAdd} style={[st.cell, st.add]}>
            <SymbolView name="plus" size={15} tintColor={color.text} weight="semibold" />
            <Text style={{ fontSize: 17, color: color.text }}>추가</Text>
          </Pressable>
          {items.map((it) => {
            const on = checked.includes(it.id);
            return (
              <Pressable key={it.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => onToggle(it.id)} style={[st.cell, { backgroundColor: color.fill }]}>
                {it.uri ? <Image source={{ uri: it.uri }} style={StyleSheet.absoluteFill} /> : null}
                {on ? (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' }]}>
                    <SymbolView name="checkmark" size={48} tintColor={color.accent} weight="heavy" />
                  </View>
                ) : null}
                {it.label ? (
                  <View style={st.label}><Text style={{ fontSize: 12, fontWeight: '600', color: '#FFF' }}>{it.label}</Text></View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <Text style={[st.note, { textAlign: 'left', marginHorizontal: 24 }]}>{note}</Text>
      </ScrollView>
      <BottomButtons left="미리보기" onLeft={checked.length ? onPreview : undefined} right="완료" rightTone="light" rightDisabled={checked.length === 0} onRight={onDone} />
    </View>
  );
}

const st = StyleSheet.create({
  headline: { marginTop: 40, marginHorizontal: 24, fontSize: 22, fontWeight: '700', lineHeight: 31, letterSpacing: -0.4, color: color.text, textAlign: 'center' },
  example: { marginTop: 24, alignSelf: 'center', width: 214, height: 280, borderRadius: 18, backgroundColor: color.cardRaised, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: 18, marginHorizontal: 32, fontSize: 15, lineHeight: 22, color: color.textSecondary, textAlign: 'center' },
  big: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  grid: { marginTop: 16, marginHorizontal: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47.5%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  add: { borderWidth: 1.5, borderColor: '#AEAEB2', flexDirection: 'row', gap: 6 },
  label: { position: 'absolute', left: 8, bottom: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.6)' },
});
