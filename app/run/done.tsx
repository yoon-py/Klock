// 미리보기 끝 화면. (실제 알람의 아침 화면 WakeDone은 아침 묶음에서 옮겨요)
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { closeRun, getRun } from '../../src/store/run';

export default function Done() {
  const real = !getRun().preview; // ponytail: 실제 알람도 아침 화면(WakeDone)을 옮기기 전까지 이 화면을 써요
  return (
    <LinearGradient colors={['#FFF6E8', '#FFEACB', '#FFD596']} locations={[0, 0.46, 1]} style={{ flex: 1 }}>
      <View style={{ paddingTop: 124, paddingHorizontal: 28, gap: 10 }}>
        <SymbolView name="checkmark.circle" size={52} tintColor="#C26A00" />
        <Text style={{ marginTop: 14, fontSize: 15, fontWeight: '600', color: '#A65A00' }}>{real ? '좋은 아침' : '미리보기'}</Text>
        <Text style={{ fontSize: 36, fontWeight: '700', letterSpacing: -0.8, color: '#2B1A04' }}>{real ? '알람을 껐어요' : '미리보기를 마쳤어요'}</Text>
        <Text style={{ fontSize: 18, lineHeight: 27, color: '#6E5326' }}>{real ? '오늘도 좋은 하루 보내세요.' : '아침에 알람이 울리면 이렇게 미션을 끝내야 꺼져요.'}</Text>
      </View>
      <Pressable onPress={closeRun} style={{ position: 'absolute', left: 20, right: 20, bottom: 44, height: 56, borderRadius: 16, backgroundColor: '#2B1A04', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFF6E8' }}>돌아가기</Text>
      </Pressable>
    </LinearGradient>
  );
}
