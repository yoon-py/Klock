// 바코드 찍기 미션 설정: 등록한 코드가 없으면 처음 안내, 있으면 격자 (SPEC 6.6)
import { router, useLocalSearchParams } from 'expo-router';
import { BigButton, RegisterGrid, RegisterIntro } from '../../../src/components/RegisterList';
import { draftMissions, getDraft, setDraftMissions, useDraft, useDropIfAbandoned } from '../../../src/store/draft';
import { startRun } from '../../../src/store/run';
import { useSetting } from '../../../src/store';

export default function CodeSettings() {
  const p = useLocalSearchParams<{ i: string; adding?: string }>();
  const i = Number(p.i ?? 0);
  const list = draftMissions(useDraft());
  const m = list[i]?.type === 'barcode' ? list[i] : null;
  const [codes] = useSetting('codes');
  // 하나도 체크하지 않고 나가면 이 미션은 빼요
  useDropIfAbandoned(i, p.adding === '1', () => { const x = draftMissions(getDraft())[i]; return x?.type === 'barcode' && x.codeIds.length > 0; });
  if (!m) return null;

  const setChecked = (ids: string[]) => {
    const next = list.slice();
    next[i] = { ...m, codeIds: ids };
    setDraftMissions(next);
  };
  const scan = () => router.push({ pathname: '/mission/code-scan', params: { i } });

  if (codes.length === 0) {
    return (
      <RegisterIntro
        title="QR/바코드"
        headline={'아침 행동과 관련된 것을\n스캔하세요'}
        icon="barcode.viewfinder"
        note="약통, 세면대 위 병, 책처럼 일어나서 가야 하는 곳에 있는 물건의 코드를 등록해요.">
        <BigButton label="스캔하기" light onPress={scan} />
      </RegisterIntro>
    );
  }
  return (
    <RegisterGrid
      title="QR/바코드"
      items={codes.map((c) => ({ id: c.id, uri: c.photoUri, label: c.name }))}
      checked={m.codeIds}
      onToggle={(id) => setChecked(m.codeIds.includes(id) ? m.codeIds.filter((x) => x !== id) : [...m.codeIds, id])}
      onAdd={scan}
      note="체크한 코드 중 하나를 스캔하면 알람이 꺼져요. 같은 상품이라도 등록한 코드만 통과해요."
      onPreview={() => startRun([m], { preview: true })}
      onDone={() => router.back()}
    />
  );
}
