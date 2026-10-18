// 스쿼트·걷기 횟수 화면 공통 (디자인 MissionCountSquat, MissionCountWalk)
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { BottomButtons, PushHeader } from './sheet';
import { Wheel } from './index';
import { draftMissions, setDraftMissions, useDraft, useDropIfAbandoned } from '../store/draft';
import { startRun } from '../store/run';
import type { MissionConfig } from '../store';
import { color } from '../theme';

export function MissionCount<T extends number>({ title, headline, icon, values, unit, read, write }: {
  title: string;
  headline: string;
  icon: SFSymbol;
  values: readonly T[];
  unit: string;
  read: (m: MissionConfig) => T;
  write: (v: T) => MissionConfig;
}) {
  const p = useLocalSearchParams<{ i: string; adding?: string }>();
  const i = Number(p.i ?? 0);
  const list = draftMissions(useDraft());
  const [value, setValue] = useState<T>(list[i] ? read(list[i]) : values[1]);
  const saved = useRef(false);
  useDropIfAbandoned(i, p.adding === '1', () => saved.current);

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B0C' }}>
      <View style={{ backgroundColor: color.card, paddingBottom: 28 }}>
        <PushHeader title={title} />
        <Text style={{ marginTop: 10, marginHorizontal: 24, fontSize: 22, fontWeight: '700', lineHeight: 31, letterSpacing: -0.4, color: color.text, textAlign: 'center' }}>{headline}</Text>
        {/* TODO: 예시 영상 (ASSETS.md 3장). 받기 전까지는 아이콘으로 자리만 */}
        <View style={{ marginTop: 28, marginHorizontal: 24, height: 180, borderRadius: 16, backgroundColor: '#ECE8E2', alignItems: 'center', justifyContent: 'center' }}>
          <SymbolView name={icon} size={88} tintColor="#2C2C2E" />
        </View>
      </View>
      <View style={{ marginTop: 28, marginHorizontal: 24, borderRadius: 16, backgroundColor: color.card, overflow: 'hidden', justifyContent: 'center' }}>
        <Wheel values={values} value={value} onChange={setValue} />
        <Text pointerEvents="none" style={{ position: 'absolute', right: 44, fontSize: 17, fontWeight: '600', color: color.text }}>{unit}</Text>
      </View>
      <BottomButtons
        left="미리보기"
        onLeft={() => startRun([write(value)], { preview: true })}
        right="저장"
        onRight={() => {
          const next = list.slice();
          next[i] = write(value);
          setDraftMissions(next);
          saved.current = true;
          router.back();
        }}
      />
    </View>
  );
}
