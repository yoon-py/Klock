// 알람 화면 (SPEC 6.14, 디자인 Alarm). 끄기·다시 알림 버튼 없음. 미션이 없을 때만 "알람 끄기".
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { MISSIONS, missionTitle } from '../../src/missions';
import { finish, getRun, goMission } from '../../src/store/run';

export default function Alarm() {
  const run = getRun();
  const first = run.missions[0];
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 10_000); return () => clearInterval(t); }, []);
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, [glow]);

  const date = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  const time = (now.getHours() % 12 || 12) + ':' + String(now.getMinutes()).padStart(2, '0');

  return (
    <LinearGradient colors={['#17183F', '#2C2352', '#5E3550', '#B25E3E', '#E8944A']} locations={[0, 0.26, 0.52, 0.78, 1]} style={{ flex: 1 }}>
      <Animated.View
        pointerEvents="none"
        style={[st.sun, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}
      />
      <View style={{ paddingTop: 140, alignItems: 'center' }}>
        <Text style={{ fontSize: 17, color: 'rgba(255,240,225,0.75)' }}>{date}</Text>
        <Text style={{ marginTop: 2, fontSize: 104, fontWeight: '200', letterSpacing: -3, color: '#FFF6E8' }}>{time}</Text>
        <Text style={{ marginTop: 10, fontSize: 24, fontWeight: '600', color: '#FFF6E8' }}>{run.label || '좋은 아침이에요'}</Text>
        <View style={st.pill}>
          <SymbolView name="speaker.wave.2.fill" size={13} tintColor="#FFD596" />
          <Text style={{ fontSize: 13, color: 'rgba(255,240,225,0.85)' }}>소리가 점점 커지고 있어요</Text>
        </View>
      </View>

      <View style={st.card}>
        {first ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={st.tile}>
                <SymbolView name={MISSIONS[first.type].icon} size={26} tintColor="#2B1A04" />
              </View>
              <View style={{ gap: 3, flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '600', color: '#FFF6E8' }}>
                  {missionTitle(first)}{run.missions.length > 1 ? ` 외 ${run.missions.length - 1}개` : ''}
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,240,225,0.78)' }}>끝내면 알람이 꺼지고 모든 앱이 열려요</Text>
              </View>
            </View>
            <Pressable onPress={() => goMission(0)} style={st.button}>
              <Text style={st.buttonText}>미션 시작</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={finish} style={st.button}>
            <Text style={st.buttonText}>알람 끄기</Text>
          </Pressable>
        )}
      </View>
    </LinearGradient>
  );
}

const st = StyleSheet.create({
  sun: { position: 'absolute', left: '50%', bottom: -330, width: 640, height: 640, marginLeft: -320, borderRadius: 320, backgroundColor: 'rgba(255,181,71,0.45)' },
  pill: { marginTop: 18, height: 30, paddingHorizontal: 14, borderRadius: 15, backgroundColor: 'rgba(255,240,225,0.12)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { position: 'absolute', left: 16, right: 16, bottom: 36, padding: 18, gap: 16, borderRadius: 28, backgroundColor: 'rgba(43,26,4,0.28)' },
  tile: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FFB547', alignItems: 'center', justifyContent: 'center' },
  button: { height: 56, borderRadius: 16, backgroundColor: '#FFF6E8', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 17, fontWeight: '600', color: '#2B1A04' },
});
