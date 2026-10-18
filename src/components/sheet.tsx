// 시트 화면들이 같이 쓰는 부품 (디자인 PlanEdit, AlarmAdd, MissionCount* 의 공통 모양)
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { color, font } from '../theme';
import { MISSIONS } from '../missions';
import { missionLine } from '../missions';
import { draftMissions, setDraftMissions, updateDraft, useDraft } from '../store/draft';
import { Slider, Switch } from './index';

const WAKE_SOUND_NAMES: Record<string, string> = {
  dawn_bell: '새벽 종소리', sunrise_forest: '해 뜨는 숲', birds: '새소리', stream: '시냇물', piano: '잔잔한 피아노',
  xylophone: '맑은 실로폰', wind_chime: '바람 풍경', guitar: '경쾌한 기타', classic: '기본 알람음',
};
export const WAKE_SOUNDS = Object.entries(WAKE_SOUND_NAMES).map(([id, name]) => ({ id, name }));

/** × 닫기 / 제목 / ✓ 저장 */
export function SheetHeader({ title, onSave, saveLabel = '저장' }: { title: string; onSave?: () => void; saveLabel?: string }) {
  return (
    <View style={s.header}>
      <CircleButton icon="xmark" label="닫기" onPress={() => router.back()} />
      <Text style={s.headerTitle}>{title}</Text>
      {onSave ? <CircleButton icon="checkmark" label={saveLabel} tint={color.accent} onPress={onSave} /> : <View style={{ width: 44 }} />}
    </View>
  );
}

/** ‹ 뒤로 + 가운데 제목 (미션 설정 화면들) */
export function PushHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={[s.header, { justifyContent: 'center' }]}>
      <Pressable accessibilityLabel="뒤로" onPress={() => router.back()} style={s.back} hitSlop={8}>
        <SymbolView name="chevron.left" size={20} tintColor={color.text} weight="semibold" />
      </Pressable>
      <Text style={s.headerTitle}>{title}</Text>
      {right ? <View style={{ position: 'absolute', right: 8 }}>{right}</View> : null}
    </View>
  );
}

function CircleButton({ icon, label, tint, onPress }: { icon: 'xmark' | 'checkmark'; label: string; tint?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={[s.circle, { backgroundColor: tint ?? 'rgba(120,120,128,0.32)' }]}>
      <SymbolView name={icon} size={icon === 'xmark' ? 15 : 18} tintColor="#FFFFFF" weight="bold" />
    </Pressable>
  );
}

/** 아래 고정 버튼 두 개: 회색 작은 버튼 + 큰 버튼 */
export function BottomButtons({ left, onLeft, right, onRight, rightTone = 'accent', rightDisabled }: {
  left?: string; onLeft?: () => void; right: string; onRight: () => void; rightTone?: 'accent' | 'light'; rightDisabled?: boolean;
}) {
  return (
    <View style={s.bottom}>
      {left ? (
        <Pressable onPress={onLeft} style={[s.btn, { width: 108, backgroundColor: color.fill }]}>
          <Text style={{ ...font.headline, color: color.text }}>{left}</Text>
        </Pressable>
      ) : null}
      <Pressable disabled={rightDisabled} onPress={onRight} style={[s.btn, { flex: 1, backgroundColor: rightTone === 'accent' ? color.accent : '#F2F2F7', opacity: rightDisabled ? 0.4 : 1 }]}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: rightTone === 'accent' ? '#1A1205' : '#000000' }}>{right}</Text>
      </Pressable>
    </View>
  );
}

/** 미션 칸 5개 + 다시 잠들기 방지 (SPEC 6.3 미션 카드) */
export function MissionCard() {
  const d = useDraft();
  const list = draftMissions(d);
  const antiSnooze = d.alarm ? d.alarm.antiSnooze : d.schedule.antiSnooze;
  const tap = (i: number) => {
    Haptics.selectionAsync();
    const m = list[i];
    if (!m) return router.push('/mission-pick');
    const route = MISSIONS[m.type].settings;
    router.push(route ? { pathname: route as never, params: { i } } : { pathname: '/mission-pick', params: { at: i } });
  };
  return (
    <View style={s.card}>
      <View style={{ marginHorizontal: 18, paddingVertical: 16, gap: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ ...font.headline, color: color.text }}>미션</Text>
          <Text style={{ ...font.body, color: color.textSecondary }}>{list.length}/5</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 9 }}>
          {[0, 1, 2, 3, 4].map((i) => {
            const m = list[i];
            const next = i === list.length;
            return (
              <View key={i} style={{ flex: 1 }}>
                <Pressable
                  accessibilityLabel={m ? `${i + 1}번째 미션 ${MISSIONS[m.type].name}` : '미션 더하기'}
                  disabled={!m && !next}
                  onPress={() => tap(i)}
                  style={[s.slot, m ? { backgroundColor: MISSIONS[m.type].bg } : { borderWidth: 1, borderColor: `rgba(255,255,255,${next ? 0.14 : 0.07})`, backgroundColor: next ? color.fill : 'transparent' }]}>
                  {m ? (
                    <SymbolView name={MISSIONS[m.type].icon} size={24} tintColor={MISSIONS[m.type].fg} />
                  ) : (
                    <SymbolView name="plus" size={20} tintColor={next ? '#FFFFFF' : color.textTertiary} weight="semibold" />
                  )}
                </Pressable>
                {m ? (
                  <Pressable accessibilityLabel={`${MISSIONS[m.type].name} 빼기`} hitSlop={6} onPress={() => setDraftMissions(list.filter((_, j) => j !== i))} style={s.remove}>
                    <SymbolView name="xmark" size={8} tintColor="#FFFFFF" weight="bold" />
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
        <Text style={{ ...font.footnote, color: color.textSecondary }}>{missionLine(list)}</Text>
      </View>
      <View style={s.row}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...font.body, color: color.text }}>다시 잠들기 방지</Text>
          <Text style={{ ...font.footnote, color: color.textSecondary }}>미션 5분 뒤 한 번 더 확인해요</Text>
        </View>
        <Switch
          value={antiSnooze}
          onValueChange={(v) => updateDraft((x) => { if (x.alarm) x.alarm.antiSnooze = v; else x.schedule.antiSnooze = v; })}
        />
      </View>
    </View>
  );
}

/** 알람 소리: 사운드 및 햅틱 줄 + 음량 슬라이더 */
export function AlarmSoundCard() {
  const d = useDraft();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[s.caption, { paddingLeft: 18 }]}>알람 소리</Text>
      <View style={s.card}>
        <Pressable onPress={() => router.push('/wake-sound')} style={({ pressed }) => [s.row, { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator }, pressed && s.pressed]}>
          <Text style={{ ...font.body, color: color.text, flex: 1 }}>사운드 및 햅틱</Text>
          <Text style={{ ...font.body, color: color.textSecondary }}>{WAKE_SOUND_NAMES[d.schedule.wakeSound]}</Text>
          <SymbolView name="chevron.right" size={13} tintColor="#8E8E93" weight="semibold" />
        </Pressable>
        <View style={[s.row, { gap: 14 }]}>
          <SymbolView name="speaker.fill" size={18} tintColor="#8E8E93" />
          <Slider style={{ flex: 1 }} value={d.schedule.volume} onValueChange={(v) => updateDraft((x) => { x.schedule.volume = v; })} accessibilityLabel="알람 음량" />
          <SymbolView name="speaker.wave.3.fill" size={18} tintColor="#8E8E93" />
        </View>
      </View>
    </View>
  );
}

/** 오른쪽 값 + › 가 있는 줄 */
export function NavRow({ title, value, onPress, divider }: { title: string; value: string; onPress: () => void; divider?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, divider && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: color.separator }, pressed && s.pressed]}>
      <Text style={{ ...font.body, color: color.text, flex: 1 }}>{title}</Text>
      <Text style={{ ...font.body, color: color.textSecondary }}>{value}</Text>
      <SymbolView name="chevron.right" size={13} tintColor="#8E8E93" weight="semibold" />
    </Pressable>
  );
}

export const s = StyleSheet.create({
  header: { height: 60, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { ...font.headline, color: color.text },
  back: { position: 'absolute', left: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 34, backgroundColor: color.card },
  btn: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 26, backgroundColor: color.cardRaised, overflow: 'hidden' },
  row: { minHeight: 56, marginHorizontal: 18, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  slot: { aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  remove: { position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: 10, backgroundColor: '#636366', borderWidth: 2, borderColor: color.cardRaised, alignItems: 'center', justifyContent: 'center' },
  caption: { ...font.footnote, color: color.textSecondary },
  pressed: { backgroundColor: 'rgba(255,255,255,0.06)' },
});
