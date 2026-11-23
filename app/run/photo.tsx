// 사진 찍기 미션 (SPEC 6.15, 디자인 MissionPhoto). 찍은 사진을 등록 사진과 폰 안에서 비교해요(Vision).
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import SlipperVision from '../../modules/slipper-vision';
import { Clear, MissionTop, sfx } from '../../src/components/mission';
import { PermissionOff, useCamera } from '../../src/components/CameraBits';
import { PHOTO } from '../../src/config/thresholds';
import { getRun } from '../../src/store/run';
import { get } from '../../src/store';
import { color } from '../../src/theme';

export default function PhotoMission() {
  const mission = getRun().missions[getRun().index];
  const ids = mission?.type === 'photo' ? mission.photoIds : [];
  const targets = get('photos').filter((p) => ids.includes(p.id));
  const target = targets[0];
  const granted = useCamera();
  const cam = useRef<CameraView>(null);
  const [phase, setPhase] = useState<'live' | 'check' | 'ok' | 'bad'>('live');
  if (!granted) return <PermissionOff />;

  const shoot = async () => {
    if (phase !== 'live') return;
    const pic = await cam.current?.takePictureAsync({ quality: 0.5 }).catch(() => null);
    if (!pic) return;
    setPhase('check');
    // 체크한 사진 중 하나라도 가까우면 통과
    const d = await Promise.all(targets.map((t) => SlipperVision!.photoDistance(pic.uri, t.uri).catch(() => Infinity)));
    if (Math.min(...d) <= PHOTO.maxDistance) setPhase('ok');
    else {
      sfx('fail');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPhase('bad');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" />
      <View style={[st.shade, { top: 0, height: 230 }]} />
      <MissionTop progressKey={phase} />
      <View style={st.card}>
        <View style={st.thumb}>{target ? <Image source={{ uri: target.uri }} style={StyleSheet.absoluteFill} /> : null}</View>
        <View style={{ gap: 4, flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', letterSpacing: -0.3, color: '#FFF' }}>이 사진과 같은 곳을 찍으세요</Text>
          <Text style={{ fontSize: 14, color: '#C7C7CC' }}>등록한 사진</Text>
        </View>
      </View>
      <View pointerEvents="none" style={st.frame}>
        {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <View key={c} style={[st.corner, c[0] === 't' ? { top: 0, borderTopWidth: 3 } : { bottom: 0, borderBottomWidth: 3 }, c[1] === 'l' ? { left: 0, borderLeftWidth: 3 } : { right: 0, borderRightWidth: 3 }]} />
        ))}
      </View>
      <Text style={st.hint}>네모 안에 들어오게 찍으세요</Text>
      <Pressable accessibilityLabel="찍기" onPress={shoot} style={st.shutter}>
        <View style={{ flex: 1, borderRadius: 40, backgroundColor: '#FFF' }} />
      </Pressable>
      {phase === 'check' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 40 }]}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#FFF' }}>같은 곳인지 보고 있어요</Text>
        </View>
      ) : null}
      {phase === 'ok' ? <Clear text="같은 곳이 맞아요" /> : null}
      {phase === 'bad' ? (
        <View style={st.sheet}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#FFF' }}>다른 곳 같아요</Text>
          <Text style={{ fontSize: 15, lineHeight: 21, color: '#C7C7CC' }}>등록한 사진처럼 같은 방향에서 다시 찍어 주세요.</Text>
          <Pressable onPress={() => setPhase('live')} style={st.retry}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: '#000' }}>다시 찍기</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  shade: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  card: { position: 'absolute', top: 122, left: 16, right: 16, padding: 12, borderRadius: 18, backgroundColor: 'rgba(28,28,30,0.85)', flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 5 },
  thumb: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: color.accent, backgroundColor: color.fill },
  frame: { position: 'absolute', top: 250, left: 40, right: 40, height: 380 },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#FFF' },
  hint: { position: 'absolute', left: 24, right: 24, bottom: 150, fontSize: 15, color: '#FFF', textAlign: 'center' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, paddingBottom: 44, gap: 10, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#1C1C1E', zIndex: 50 },
  retry: { marginTop: 10, height: 54, borderRadius: 16, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  shutter: { position: 'absolute', bottom: 46, alignSelf: 'center', width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#FFF', padding: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
});
