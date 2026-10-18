// 사진 찍기 미션 설정: 등록한 사진이 없으면 처음 안내, 있으면 격자 (SPEC 6.6)
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { BigButton, RegisterGrid, RegisterIntro } from '../../../src/components/RegisterList';
import { draftMissions, getDraft, setDraftMissions, useDraft, useDropIfAbandoned } from '../../../src/store/draft';
import { startRun } from '../../../src/store/run';
import { useSetting } from '../../../src/store';
import { keepPhoto } from '../../../src/files';

export default function PhotoSettings() {
  const p = useLocalSearchParams<{ i: string; adding?: string }>();
  const i = Number(p.i ?? 0);
  const list = draftMissions(useDraft());
  const m = list[i]?.type === 'photo' ? list[i] : null;
  const [photos, setPhotos] = useSetting('photos');
  // 하나도 체크하지 않고 나가면 이 미션은 빼요
  useDropIfAbandoned(i, p.adding === '1', () => { const x = draftMissions(getDraft())[i]; return x?.type === 'photo' && x.photoIds.length > 0; });
  if (!m) return null;

  const setChecked = (ids: string[]) => {
    const next = list.slice();
    next[i] = { ...m, photoIds: ids };
    setDraftMissions(next);
  };
  const openCamera = () => router.push({ pathname: '/mission/photo-cam', params: { i } });
  const fromAlbum = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (r.canceled) return;
    const id = String(Date.now());
    const uri = await keepPhoto(r.assets[0].uri, 'photo-' + id);
    setPhotos([...photos, { id, uri }]);
    setChecked([...m.photoIds, id]);
  };

  if (photos.length === 0) {
    return (
      <RegisterIntro
        title="사진 찍기"
        headline={'아침 행동과 관련된 것을\n찍으세요'}
        icon="sink.fill"
        note="세면대, 칫솔, 물컵처럼 일어나서 가야 하는 곳을 등록해요. 알람이 울리면 같은 곳을 찍어야 꺼져요.">
        <BigButton label="사진 찍기" light onPress={openCamera} />
        <BigButton label="앨범에서 선택" onPress={fromAlbum} />
      </RegisterIntro>
    );
  }
  return (
    <RegisterGrid
      title="사진 찍기"
      items={photos}
      checked={m.photoIds}
      onToggle={(id) => setChecked(m.photoIds.includes(id) ? m.photoIds.filter((x) => x !== id) : [...m.photoIds, id])}
      onAdd={openCamera}
      note="체크한 사진 중 하나와 같은 곳을 찍으면 알람이 꺼져요. 사진은 이 폰에만 저장돼요."
      onPreview={() => startRun([m], { preview: true })}
      onDone={() => router.back()}
    />
  );
}
