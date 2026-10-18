// 스쿼트 미션 (SPEC 6.15, 디자인 MissionSquat → Grip → Elbow → Count)
// 지금은 디자인처럼 아래쪽을 누르면 한 번씩 세요. TODO: 움직임 센서 판정 (thresholds.ts)
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { BigCount, Clear, MissionTop, Prepare, sfx, st as m } from '../../src/components/mission';
import { getRun } from '../../src/store/run';
import { color } from '../../src/theme';

type Phase = 'prep' | 'grip' | 'elbow' | 'count' | 'clear';

export default function Squat() {
  const mission = getRun().missions[getRun().index];
  const total = mission?.type === 'squat' ? mission.count : 10;
  const [phase, setPhase] = useState<Phase>('prep');
  const [left, setLeft] = useState<number>(total);
  const [hold, setHold] = useState({ l: false, r: false });
  const [tap, setTap] = useState({ l: false, r: false });

  const press = (k: 'l' | 'r', on: boolean) => {
    const next = { ...hold, [k]: on };
    setHold(next);
    if (next.l && next.r) setTimeout(() => setPhase('elbow'), 450);
  };
  const tapSide = (k: 'l' | 'r') => {
    const next = { ...tap, [k]: true };
    setTap(next);
    if (next.l && next.r) setTimeout(() => setPhase('count'), 450);
  };
  const rep = () => {
    if (left <= 0) return;
    sfx('rep');
    setLeft(left - 1);
    if (left - 1 === 0) setTimeout(() => setPhase('clear'), 500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <MissionTop progressKey={phase + left} />

      {phase === 'prep' ? <Prepare onDone={() => setPhase('grip')} /> : null}

      {phase === 'grip' ? (
        <>
          <Text style={[m.h2, { position: 'absolute', top: 128, left: 24, right: 24, fontSize: 30 }]}>양 손으로 잡으세요</Text>
          {(['l', 'r'] as const).map((k) => (
            <Pressable
              key={k}
              accessibilityLabel={k === 'l' ? '왼손 엄지 대기' : '오른손 엄지 대기'}
              onPressIn={() => press(k, true)}
              onPressOut={() => press(k, false)}
              style={[st.half, k === 'l' ? { left: 0 } : { right: 0 }]}>
              <View style={[st.thumb, { backgroundColor: hold[k] ? color.accent : '#474B54', transform: [{ rotate: k === 'l' ? '28deg' : '-28deg' }] }, k === 'l' ? { left: 44 } : { right: 44 }]}>
                <View style={[st.nail, { backgroundColor: hold[k] ? '#FFC874' : '#6B6F79' }]} />
              </View>
            </Pressable>
          ))}
        </>
      ) : null}

      {phase === 'elbow' ? (
        <>
          <Text style={[m.h2, { position: 'absolute', top: 124, left: 24, right: 24 }]}>{'팔꿈치를 몸통에 붙이고\n아래 영역을 다시 탭하세요'}</Text>
          {(['l', 'r'] as const).map((k) => (
            <Pressable
              key={k}
              accessibilityLabel={k === 'l' ? '왼쪽 영역 탭' : '오른쪽 영역 탭'}
              onPressIn={() => tapSide(k)}
              style={[st.elbow, k === 'l' ? { left: -122 } : { right: -122 }, { backgroundColor: tap[k] ? color.accent : '#474B54' }]}
            />
          ))}
        </>
      ) : null}

      {phase === 'count' || phase === 'clear' ? (
        <>
          {/* TODO: 예시 영상 (squat_demo.mp4, ASSETS.md 3장) */}
          <View style={st.demo}>
            <SymbolView name="figure.cross.training" size={88} tintColor="#2C2C2E" />
          </View>
          <Text style={[m.h2, { position: 'absolute', top: 382, left: 24, right: 24, fontWeight: '600' }]}>{'영상을 따라\n스쿼트를 하세요'}</Text>
          <BigCount left={left} max={total} top={520} />
          <Pressable accessibilityLabel="스쿼트 한 번 (시연)" onPress={rep} style={{ position: 'absolute', left: 0, right: 0, top: 480, bottom: 0 }} />
        </>
      ) : null}

      {phase === 'clear' ? <Clear /> : null}
    </View>
  );
}

const st = StyleSheet.create({
  half: { position: 'absolute', top: 440, bottom: 0, width: '50%', overflow: 'hidden' },
  thumb: { position: 'absolute', top: 30, width: 112, height: 560, borderRadius: 56, alignItems: 'center' },
  nail: { marginTop: 16, width: 72, height: 82, borderRadius: 36 },
  elbow: { position: 'absolute', top: 236, width: 244, height: 640, borderRadius: 320 },
  demo: { position: 'absolute', top: 136, left: 24, right: 24, height: 176, borderRadius: 16, backgroundColor: '#ECE8E2', alignItems: 'center', justifyContent: 'center' },
});
