// 공통 부품. 애플 기본 부품(스위치·슬라이더·다이얼)을 Slipper 색으로 맞춰 쓰고,
// 그룹 목록만 직접 만들어요 (설정 앱 같은 둥근 카드 + 줄).
import { Children, type ReactNode } from 'react';
import { Pressable, Switch as RNSwitch, StyleSheet, Text, View, type SwitchProps } from 'react-native';
import RNSlider, { type SliderProps } from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { color, font, radius, space } from '../theme';

export function Group({ header, footer, children, raised }: { header?: string; footer?: string; children: ReactNode; raised?: boolean }) {
  const rows = Children.toArray(children);
  return (
    <View style={{ gap: 7 }}>
      {header ? <Text style={[s.caption, { paddingLeft: space.m }]}>{header}</Text> : null}
      <View style={[s.group, { backgroundColor: raised ? color.cardRaised : color.card }]}>
        {rows.map((row, i) => (
          <View key={i}>
            {row}
            {i < rows.length - 1 ? <View style={s.separator} /> : null}
          </View>
        ))}
      </View>
      {footer ? <Text style={[s.caption, { paddingHorizontal: space.m, lineHeight: 18 }]}>{footer}</Text> : null}
    </View>
  );
}

export function Row({ title, subtitle, value, onPress, accessory }: {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  accessory?: ReactNode; // 스위치 등 오른쪽 부품
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [s.row, pressed && { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.body}>{title}</Text>
        {subtitle ? <Text style={s.caption}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={[s.body, { color: color.textSecondary }]}>{value}</Text> : null}
      {accessory}
      {onPress && !accessory ? <SymbolView name="chevron.right" size={14} tintColor={color.textTertiary} weight="semibold" /> : null}
    </Pressable>
  );
}

export function Switch(props: SwitchProps & { tint?: string }) {
  return <RNSwitch trackColor={{ true: props.tint ?? color.accent }} {...props} />;
}

/** 음량 슬라이더. 5%마다 가벼운 햅틱 (SPEC 6.3) */
export function Slider({ tint = color.accent, ...props }: SliderProps & { tint?: string }) {
  return (
    <RNSlider
      minimumValue={0}
      maximumValue={1}
      step={0.05}
      minimumTrackTintColor={tint}
      maximumTrackTintColor="rgba(120,120,128,0.36)"
      thumbTintColor="#FFFFFF"
      {...props}
      onValueChange={(v) => {
        Haptics.selectionAsync();
        props.onValueChange?.(v);
      }}
    />
  );
}

/** 값 하나를 고르는 다이얼 (스쿼트 횟수, 잠그는 시각 등). 시간은 DateTimePicker를 그대로 써요. */
export function Wheel<T extends string | number>({ values, value, onChange, format = String }: {
  values: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <Picker selectedValue={value} onValueChange={(v) => onChange(v as T)} itemStyle={{ color: color.text, fontSize: 23 }}>
      {values.map((v) => (
        <Picker.Item key={String(v)} label={format(v)} value={v} />
      ))}
    </Picker>
  );
}

const s = StyleSheet.create({
  group: { borderRadius: radius.group, overflow: 'hidden' },
  row: { minHeight: 52, paddingHorizontal: space.m, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: color.separator, marginLeft: space.m },
  body: { ...font.body, color: color.text },
  caption: { ...font.footnote, color: color.textSecondary },
});
