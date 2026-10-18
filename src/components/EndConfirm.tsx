// 수면 끝내기 확인 시트 (디자인 NightSound, NightSession 공통)
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function EndConfirm({ title, body, action, onEnd, onKeep }: { title: string; body: string; action: string; onEnd: () => void; onKeep: () => void }) {
  return (
    <View style={st.confirm}>
      <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: -0.4, color: '#FFF' }}>{title}</Text>
      <Text style={{ fontSize: 15, lineHeight: 22, color: '#B6B8CC' }}>{body}</Text>
      <Pressable onPress={onEnd} style={st.confirmBtn}><Text style={{ fontSize: 17, fontWeight: '700', color: '#000' }}>{action}</Text></Pressable>
      <Pressable onPress={onKeep} style={{ height: 50, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 17, fontWeight: '600', color: '#FFF' }}>계속 자기</Text></Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  confirm: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, paddingTop: 28, paddingBottom: 40, gap: 10, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#1C1C24' },
  confirmBtn: { marginTop: 12, height: 54, borderRadius: 14, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
});
