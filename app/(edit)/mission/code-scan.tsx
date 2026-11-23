// QR/바코드 등록 스캔 (디자인 CodeScanCam). 읽히면 틀이 초록 → 이름 붙이기 → 목록
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { CloseButton, PermissionOff, TipCard, useCamera } from '../../../src/components/CameraBits';
import { get, set } from '../../../src/store';
import { draftMissions, setDraftMissions, useDraft } from '../../../src/store/draft';
import { keepPhoto } from '../../../src/files';
import { BARCODE_TYPES } from '../../../src/missions';
import { color } from '../../../src/theme';

const BOX = 270, TOP = 300;

export default function CodeScan() {
  const i = Number(useLocalSearchParams<{ i: string }>().i ?? 0);
  const list = draftMissions(useDraft());
  const granted = useCamera();
  const cam = useRef<CameraView>(null);
  const [torch, setTorch] = useState(false);
  const [found, setFound] = useState<string | null>(null);
  const busy = useRef(false); // 카메라가 같은 코드를 연달아 보내도 한 번만 처리해요 (state는 다음 렌더까지 늦게 바뀜)
  const side = (useWindowDimensions().width - BOX) / 2;
  const line = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(line, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })).start();
  }, [line]);
  if (!granted) return <PermissionOff />;

  const onScan = async (value: string) => {
    if (busy.current) return;
    busy.current = true;
    setFound(value);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // 아침에 어디로 갈지 보여 주려고 물건 사진도 한 장 같이 저장해요 (SPEC 6.6)
    const pic = await cam.current?.takePictureAsync({ quality: 0.6 }).catch(() => null);
    const id = String(Date.now());
    const photoUri = pic ? await keepPhoto(pic.uri, 'code-' + id) : undefined;
    const save = (name?: string) => {
      set('codes', [...get('codes'), { id, value, name: name?.trim() || '코드 ' + (get('codes').length + 1), photoUri }]);
      const m = list[i];
      if (m?.type === 'barcode') {
        const next = list.slice();
        next[i] = { ...m, codeIds: [...m.codeIds, id] };
        setDraftMissions(next);
      }
      router.back();
    };
    Alert.prompt('이름을 붙여 주세요', '예: 바디워시', [{ text: '저장', onPress: save }], 'plain-text');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        ref={cam}
        style={StyleSheet.absoluteFill}
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={found ? undefined : (r) => onScan(r.data)}
      />
      {/* 사각형 밖은 어둡게 */}
      <View style={[st.dim, { left: 0, right: 0, top: 0, height: TOP }]} />
      <View style={[st.dim, { left: 0, right: 0, top: TOP + BOX, bottom: 0 }]} />
      <View style={[st.dim, { left: 0, top: TOP, height: BOX, width: side }]} />
      <View style={[st.dim, { right: 0, top: TOP, height: BOX, width: side }]} />
      <View style={[st.frame, { borderColor: found ? color.success : '#1C1C1E' }]}>
        {!found ? <Animated.View style={[st.scan, { transform: [{ translateY: line.interpolate({ inputRange: [0, 1], outputRange: [16, BOX - 18] }) }] }]} /> : null}
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 104, backgroundColor: 'rgba(28,28,30,0.85)' }} />
      <CloseButton />
      <Pressable accessibilityLabel="손전등" accessibilityState={{ selected: torch }} onPress={() => setTorch(!torch)} style={st.torch}>
        <SymbolView name={torch ? 'flashlight.on.fill' : 'flashlight.off.fill'} size={22} tintColor={torch ? color.goal : '#FFF'} />
      </Pressable>
      {!found ? <TipCard text={'일어나서 할 일과 관련된\n물건의 QR/바코드를 스캔하세요'} icons={['pills.fill', 'waterbottle.fill', 'book.fill']} /> : null}
      <Text style={st.msg}>{found ? '코드를 읽었어요' : 'QR코드/바코드를 사각형 안에 맞춰주세요'}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  dim: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)' },
  frame: { position: 'absolute', top: TOP, left: '50%', marginLeft: -BOX / 2, width: BOX, height: BOX, borderRadius: 20, borderWidth: 6 },
  scan: { position: 'absolute', left: 8, right: 8, height: 2, backgroundColor: '#FF2D55' },
  torch: { position: 'absolute', top: 56, right: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  msg: { position: 'absolute', top: TOP + BOX + 30, left: 24, right: 24, fontSize: 20, fontWeight: '700', lineHeight: 28, color: '#FFF', textAlign: 'center' },
});
