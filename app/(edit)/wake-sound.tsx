// 사운드 및 햅틱 (SPEC 6.4, 디자인 WakeSound)
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { WAKE_SOUNDS, s as sheet } from '../../src/components/sheet';
import { updateDraft, useDraft } from '../../src/store/draft';
import { wakeSoundFile } from '../../src/sounds';
import { color, font } from '../../src/theme';

export default function WakeSound() {
  const d = useDraft();
  const player = useRef<AudioPlayer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // remove()만 하면 iOS에서 소리가 계속 나서, 먼저 멈춰요
  const stop = () => { clearTimeout(timer.current); player.current?.pause(); player.current?.remove(); player.current = null; };
  useEffect(() => stop, []);

  // 누르면 3초 미리 듣기
  const preview = (id: string) => {
    stop();
    const p = createAudioPlayer(wakeSoundFile(id));
    p.volume = d.schedule.volume;
    p.play();
    player.current = p;
    timer.current = setTimeout(() => p.pause(), 3000);
  };

  return (
    <ScrollView style={{ backgroundColor: color.card }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 48, gap: 22 }}>
      <View style={[sheet.header, { justifyContent: 'flex-start', gap: 14 }]}>
        <Pressable accessibilityLabel="수면 | 기상으로 돌아가기" onPress={() => router.back()} style={st.backPill}>
          <SymbolView name="chevron.left" size={16} tintColor={color.text} weight="semibold" />
          <Text style={{ ...font.headline, color: color.text }}>{d.alarm ? '알람 추가' : '수면 | 기상'}</Text>
        </Pressable>
        <Text style={sheet.headerTitle}>사운드 및 햅틱</Text>
      </View>

      <View style={sheet.card}>
        <View style={sheet.row}>
          <Text style={{ ...font.body, color: color.text, flex: 1 }}>햅틱</Text>
          <Text style={{ ...font.body, color: color.textSecondary }}>기본 설정</Text>
        </View>
      </View>

      <View style={sheet.card} accessibilityRole="radiogroup">
        {WAKE_SOUNDS.map((w, i) => {
          const on = d.schedule.wakeSound === w.id;
          return (
            <Pressable
              key={w.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => { Haptics.selectionAsync(); updateDraft((x) => { x.schedule.wakeSound = w.id as never; }); preview(w.id); }}
              style={({ pressed }) => [sheet.row, { minHeight: 54 }, i < WAKE_SOUNDS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator }, pressed && sheet.pressed]}>
              <Text style={{ ...font.body, color: color.text, flex: 1 }}>{w.name}</Text>
              {on ? <SymbolView name="checkmark" size={16} tintColor={color.accent} weight="bold" /> : null}
            </Pressable>
          );
        })}
      </View>
      <Text style={[sheet.caption, { paddingHorizontal: 18, lineHeight: 19 }]}>눌러서 미리 들어 보세요. 작게 시작해 점점 커지고, 무음 모드에서도 울려요.</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  backPill: { height: 44, paddingLeft: 10, paddingRight: 16, borderRadius: 22, backgroundColor: 'rgba(120,120,128,0.32)', flexDirection: 'row', alignItems: 'center', gap: 6 },
});
