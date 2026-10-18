// 사진 등록 카메라 (디자인 MissionPhotoCam)
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView } from 'expo-camera';
import { CloseButton, PermissionOff, TipCard, useCamera } from '../../../src/components/CameraBits';
import { get, set } from '../../../src/store';
import { draftMissions, setDraftMissions, useDraft } from '../../../src/store/draft';
import { keepPhoto } from '../../../src/files';

export default function PhotoCam() {
  const i = Number(useLocalSearchParams<{ i: string }>().i ?? 0);
  const list = draftMissions(useDraft());
  const granted = useCamera();
  const cam = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  if (!granted) return <PermissionOff />;

  const shoot = async () => {
    if (busy || !cam.current) return;
    setBusy(true);
    const pic = await cam.current.takePictureAsync({ quality: 0.7 });
    const id = String(Date.now());
    const uri = await keepPhoto(pic.uri, 'photo-' + id);
    set('photos', [...get('photos'), { id, uri }]);
    const m = list[i];
    if (m?.type === 'photo') {
      const next = list.slice();
      next[i] = { ...m, photoIds: [...m.photoIds, id] };
      setDraftMissions(next);
    }
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 104, backgroundColor: 'rgba(0,0,0,0.55)' }} />
      <CloseButton />
      <TipCard text={'일어나서 할 일과 관련된\n물건이나 장소를 찍으세요'} icons={['sink.fill', 'shower.fill', 'mug.fill']} />
      <Pressable accessibilityLabel="찍기" onPress={shoot} style={st.shutter}>
        <View style={{ flex: 1, borderRadius: 40, backgroundColor: '#FFF' }} />
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  shutter: { position: 'absolute', bottom: 42, alignSelf: 'center', width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#FFF', padding: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
});
