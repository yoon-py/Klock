// 스쿼트 미션 (SPEC 6.15, 2026-10-22 변경): 전면 카메라 + MediaPipe 자세 인식으로 앉았다 일어나면 1회.
// 카메라 영상은 저장하지 않고 폰 안에서만 분석해요 (modules/slipper-vision).
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SquatCamera } from '../../modules/slipper-vision';
import { BigCount, Clear, MissionTop, Prepare, sfx, st as m } from '../../src/components/mission';
import { PermissionOff, useCamera } from '../../src/components/CameraBits';
import { SQUAT } from '../../src/config/thresholds';
import { getRun } from '../../src/store/run';
import { color } from '../../src/theme';

export default function Squat() {
  const mission = getRun().missions[getRun().index];
  const total = mission?.type === 'squat' ? mission.count : 10;
  const [phase, setPhase] = useState<'prep' | 'count' | 'clear'>('prep');
  const [left, setLeft] = useState<number>(total);
  const [visible, setVisible] = useState(false);
  const granted = useCamera();
  if (!granted) return <PermissionOff />;

  const rep = () => {
    if (phase !== 'count' || left <= 0) return;
    sfx('rep');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLeft(left - 1);
    if (left - 1 === 0) setTimeout(() => setPhase('clear'), 500);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <SquatCamera
        style={StyleSheet.absoluteFill}
        {...SQUAT}
        active={phase === 'count'}
        onPose={(e) => setVisible(e.nativeEvent.visible)}
        onRep={rep}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderWidth: 6, borderColor: visible ? color.success : 'transparent' }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: phase === 'prep' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.25)' }]} />
      <MissionTop progressKey={phase + left} />
      {phase === 'prep' ? <Prepare onDone={() => setPhase('count')} title={'폰을 세워 두고\n온몸이 보이게 물러서세요'} /> : null}
      {phase !== 'prep' ? (
        <>
          <Text style={[m.h2, st.guide]}>{visible ? '스쿼트를 하세요' : '머리부터 발목까지\n보이게 물러서 주세요'}</Text>
          <BigCount left={left} max={total} top={520} />
        </>
      ) : null}
      {phase === 'clear' ? <Clear /> : null}
    </View>
  );
}

const st = StyleSheet.create({
  guide: { position: 'absolute', top: 120, left: 24, right: 24, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 8 },
});
