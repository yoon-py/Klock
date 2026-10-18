// 걷기 미션 (SPEC 6.15, 디자인 MissionWalk → MissionWalkCount)
// 지금은 화면을 누르면 한 걸음씩 세요. TODO: 만보기 센서 판정 + 처음 한 번 동작·피트니스 권한
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BigCount, Clear, MissionTop, Prepare, sfx, st as m } from '../../src/components/mission';
import { getRun } from '../../src/store/run';

export default function Walk() {
  const mission = getRun().missions[getRun().index];
  const total = mission?.type === 'walk' ? mission.steps : 50;
  const [phase, setPhase] = useState<'prep' | 'count' | 'clear'>('prep');
  const [left, setLeft] = useState<number>(total);

  const step = () => {
    if (left <= 0) return;
    sfx('rep');
    setLeft(left - 1);
    if (left - 1 === 0) setTimeout(() => setPhase('clear'), 500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <MissionTop progressKey={phase + left} />
      {phase === 'prep' ? <Prepare onDone={() => setPhase('count')} /> : null}
      {phase !== 'prep' ? (
        <>
          <Text style={[m.h2, { position: 'absolute', top: 300, left: 24, right: 24, fontWeight: '600' }]}>가볍게 걸으세요</Text>
          <BigCount left={left} max={total} top={400} />
          <Pressable accessibilityLabel="한 걸음 (시연)" onPress={step} style={{ position: 'absolute', left: 0, right: 0, top: 260, bottom: 0 }} />
        </>
      ) : null}
      {phase === 'clear' ? <Clear /> : null}
    </View>
  );
}
