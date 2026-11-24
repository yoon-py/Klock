// 걷기 미션 (SPEC 6.15, 디자인 MissionWalk → MissionWalkCount). 아이폰 만보기 센서로 시작한 뒤 걸음 수를 세요.
// ponytail: 아이폰은 걸음 수를 몇 초에 한 번씩 묶어서 알려 줘서 숫자가 한 번에 여러 개 줄 수 있어요.
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { BigCount, Clear, MissionTop, Prepare, sfx, st as m } from '../../src/components/mission';
import { getRun } from '../../src/store/run';
import { color } from '../../src/theme';

type SensorsPackage = typeof import('expo-sensors');

let cachedSensors: SensorsPackage | null | undefined;

function getSensorsPackage() {
  if (cachedSensors !== undefined) return cachedSensors;
  try {
    cachedSensors = require('expo-sensors') as SensorsPackage;
  } catch {
    cachedSensors = null;
  }
  return cachedSensors;
}

export default function WalkRoute() {
  const sensorsPackage = getSensorsPackage();
  if (!sensorsPackage) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <MissionTop progressKey="pedometer-module-unavailable" />
        <Clear text="걷기 미션을 건너뛰어요" />
      </View>
    );
  }
  return <Walk Pedometer={sensorsPackage.Pedometer} />;
}

function Walk({ Pedometer }: { Pedometer: SensorsPackage['Pedometer'] }) {
  const mission = getRun().missions[getRun().index];
  const total = mission?.type === 'walk' ? mission.steps : 50;
  const [phase, setPhase] = useState<'prep' | 'count' | 'clear' | 'denied'>('prep');
  const [left, setLeft] = useState<number>(total);
  const last = useRef<number>(total);

  useEffect(() => {
    if (phase !== 'count') return;
    let sub: { remove(): void } | undefined;
    let alive = true;
    (async () => {
      const ok = (await Pedometer.isAvailableAsync()) && (await Pedometer.requestPermissionsAsync()).granted;
      if (!alive) return;
      if (!ok) return setPhase('denied');
      sub = Pedometer.watchStepCount(({ steps }) => {
        const l = Math.max(0, total - steps);
        if (l === last.current) return;
        last.current = l;
        sfx('rep');
        setLeft(l);
        if (l === 0) setTimeout(() => setPhase('clear'), 500);
      });
    })();
    return () => { alive = false; sub?.remove(); };
  }, [phase, total]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <MissionTop progressKey={phase + left} />
      {phase === 'prep' ? <Prepare onDone={() => setPhase('count')} /> : null}
      {phase === 'count' || phase === 'clear' ? (
        <>
          <Text style={[m.h2, { position: 'absolute', top: 300, left: 24, right: 24, fontWeight: '600' }]}>가볍게 걸으세요</Text>
          <BigCount left={left} max={total} top={400} />
        </>
      ) : null}
      {phase === 'denied' ? (
        <View style={{ position: 'absolute', top: 300, left: 24, right: 24, gap: 16, alignItems: 'center' }}>
          <Text style={[m.h2, { fontWeight: '600' }]}>{'동작 및 피트니스 권한이\n꺼져 있어요'}</Text>
          <Pressable onPress={() => Linking.openSettings()} style={{ height: 50, paddingHorizontal: 24, borderRadius: 25, backgroundColor: color.accent, justifyContent: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#000' }}>설정에서 켜기</Text>
          </Pressable>
        </View>
      ) : null}
      {phase === 'clear' ? <Clear /> : null}
    </View>
  );
}
