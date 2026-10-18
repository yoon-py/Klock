// 폰 두는 곳 안내 (SPEC 6.9, 디자인 SleepPhoneTip). 처음 "수면 시작"을 누를 때 이 화면 전에 마이크 권한을 물어요.
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { get, set } from '../../src/store';

export default function PhoneTip() {
  useEffect(() => { requestRecordingPermissionsAsync(); }, []);
  const go = (never: boolean) => {
    if (never) set('seen', { ...get('seen'), phoneTip: true });
    router.replace('/night/sound?start=1');
  };
  return (
    <LinearGradient colors={['#1C1E50', '#15163A', '#101016', '#0E0E12']} locations={[0, 0.32, 0.62, 1]} style={{ flex: 1 }}>
      <Text style={st.h1}>휴대폰을 베개 옆에 두어주세요</Text>
      <Text style={st.p}>{'충전기를 꽂아 두면 밤새 소리를 들어도\n배터리 걱정이 없어요'}</Text>
      {/* TODO: 베개 옆 충전 중인 폰 그림 (ASSETS.md 3장). 받기 전까지는 아이콘 */}
      <View style={st.art}>
        <SymbolView name="iphone.gen3.radiowaves.left.and.right" size={110} tintColor="#CFD1DC" />
        <SymbolView name="powerplug.fill" size={36} tintColor="#8E90B5" />
      </View>
      <Pressable onPress={() => go(false)} style={st.primary}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: '#000' }}>네 알겠습니다</Text>
      </Pressable>
      <Pressable onPress={() => go(true)} style={st.secondary}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#FFF' }}>다시 보지 않기</Text>
      </Pressable>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  h1: { position: 'absolute', top: 140, left: 16, right: 16, fontSize: 25, fontWeight: '700', letterSpacing: -0.5, color: '#FFF', textAlign: 'center' },
  p: { position: 'absolute', top: 196, left: 32, right: 32, fontSize: 17, lineHeight: 26, color: '#B6B8CC', textAlign: 'center' },
  art: { position: 'absolute', top: 300, left: 0, right: 0, height: 300, alignItems: 'center', justifyContent: 'center', gap: 18 },
  primary: { position: 'absolute', left: 24, right: 24, bottom: 112, height: 56, borderRadius: 14, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  secondary: { position: 'absolute', left: 24, right: 24, bottom: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
});
