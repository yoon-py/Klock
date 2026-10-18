// 잠그는 시각 (SPEC 6.7, 디자인 LockLead)
import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Wheel } from '../../src/components';
import { SheetHeader } from '../../src/components/sheet';
import { updateDraft, useDraft } from '../../src/store/draft';
import { durKo, fmtKo, toMin } from '../../src/time';
import { color } from '../../src/theme';

const LEADS = [30, 60, 90, 120] as const;

export default function LockLead() {
  const d = useDraft();
  const [lead, setLead] = useState(d.schedule.lock.leadMinutes);
  return (
    <View style={{ flex: 1, backgroundColor: color.card, paddingHorizontal: 16, paddingTop: 8 }}>
      <SheetHeader title="잠그는 시각" onSave={() => { updateDraft((x) => { x.schedule.lock.leadMinutes = lead; }); router.back(); }} />
      <Text style={{ marginTop: 22, fontSize: 17, fontWeight: '600', color: color.text, textAlign: 'center' }}>취침 몇 시간 전에 앱을 잠글까요?</Text>
      <Wheel values={LEADS} value={lead} onChange={setLead} format={durKo} />
      <Text style={{ fontSize: 28, fontWeight: '700', letterSpacing: -0.5, color: color.text, textAlign: 'center' }}>{fmtKo(toMin(d.schedule.bedtime) - lead)}</Text>
    </View>
  );
}
