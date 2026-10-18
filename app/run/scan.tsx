// 바코드 찍기 미션 (SPEC 6.15, 디자인 MissionScan). 등록한 코드와 값이 정확히 같아야 통과해요.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Clear, MissionTop, sfx } from '../../src/components/mission';
import { PermissionOff, useCamera } from '../../src/components/CameraBits';
import { getRun } from '../../src/store/run';
import { get } from '../../src/store';
import { BARCODE_TYPES } from '../../src/missions';
import { color } from '../../src/theme';

const BOX = 270, TOP = 300;

export default function ScanMission() {
  const mission = getRun().missions[getRun().index];
  const ids = mission?.type === 'barcode' ? mission.codeIds : [];
  const codes = get('codes').filter((c) => ids.includes(c.id));
  const granted = useCamera();
  const side = (useWindowDimensions().width - BOX) / 2;
  const [state, setScan] = useState<'live' | 'bad' | 'ok'>('live');
  const busy = useRef(false);
  const line = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(line, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })).start();
  }, [line]);
  if (!granted) return <PermissionOff />;

  const onScan = (value: string) => {
    if (busy.current || state === 'ok') return;
    busy.current = true;
    if (codes.some((c) => c.value === value)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScan('ok');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      sfx('fail');
      setScan('bad');
      setTimeout(() => { busy.current = false; }, 1500); // 같은 코드를 계속 읽어도 1.5초에 한 번만
    }
  };
  const frame = state === 'ok' ? color.success : state === 'bad' ? color.danger : '#1C1C1E';

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView style={StyleSheet.absoluteFill} barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }} onBarcodeScanned={(r) => onScan(r.data)} />
      <View style={[s.dim, { left: 0, right: 0, top: 0, height: TOP }]} />
      <View style={[s.dim, { left: 0, right: 0, top: TOP + BOX, bottom: 0 }]} />
      <View style={[s.dim, { left: 0, top: TOP, height: BOX, width: side }]} />
      <View style={[s.dim, { right: 0, top: TOP, height: BOX, width: side }]} />
      <View style={[s.frame, { borderColor: frame }]}>
        <Animated.View style={[s.scan, { transform: [{ translateY: line.interpolate({ inputRange: [0, 1], outputRange: [16, BOX - 18] }) }] }]} />
      </View>
      <MissionTop progressKey={state} />
      <View style={s.card}>
        <View style={s.thumb}>{codes[0]?.photoUri ? <Image source={{ uri: codes[0].photoUri }} style={StyleSheet.absoluteFill} /> : null}</View>
        <View style={{ gap: 4, flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', letterSpacing: -0.3, color: '#FFF' }}>이 물건의 코드를 스캔하세요</Text>
          <Text style={{ fontSize: 14, color: '#C7C7CC' }}>등록한 코드 · {codes.map((c) => c.name).join(', ')}</Text>
        </View>
      </View>
      <Text style={s.msg}>
        {state === 'bad' ? `등록한 코드가 아니에요. ${codes[0]?.name ?? ''}의 코드를 비춰 주세요` : 'QR코드/바코드를 사각형 안에 맞춰주세요'}
      </Text>
      {state === 'ok' ? <Clear text="등록한 코드가 맞아요" /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  dim: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)' },
  frame: { position: 'absolute', top: TOP, left: '50%', marginLeft: -BOX / 2, width: BOX, height: BOX, borderRadius: 20, borderWidth: 6 },
  scan: { position: 'absolute', left: 8, right: 8, height: 2, backgroundColor: '#FF2D55' },
  card: { position: 'absolute', top: 122, left: 16, right: 16, padding: 12, borderRadius: 18, backgroundColor: 'rgba(28,28,30,0.85)', flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 5 },
  thumb: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: color.accent, backgroundColor: color.fill },
  msg: { position: 'absolute', top: TOP + BOX + 34, left: 24, right: 24, fontSize: 20, fontWeight: '700', lineHeight: 28, color: '#FFF', textAlign: 'center' },
});
