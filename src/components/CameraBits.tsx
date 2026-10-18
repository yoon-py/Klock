// 카메라 화면 공통 부품: 권한 안내, 예시 안내 카드, 닫기 (디자인 MissionPhotoCam, CodeScanCam)
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCameraPermissions } from 'expo-camera';
import type { SFSymbol } from 'sf-symbols-typescript';
import { color } from '../theme';

/** 카메라 권한: 처음이면 묻고, 거절했으면 "설정에서 켜기" (SPEC 7장) */
export function useCamera() {
  const [perm, request] = useCameraPermissions();
  useEffect(() => { if (perm && !perm.granted && perm.canAskAgain) request(); }, [perm, request]);
  return perm?.granted ?? false;
}

export function PermissionOff({ what = '카메라' }: { what?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <CloseButton />
      <Text style={{ fontSize: 17, color: color.text }}>{what} 권한이 꺼져 있어요</Text>
      <Pressable onPress={() => Linking.openSettings()} style={{ height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: color.fill, justifyContent: 'center' }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: color.accent }}>설정에서 켜기</Text>
      </Pressable>
    </View>
  );
}

export function CloseButton() {
  return (
    <Pressable accessibilityLabel="닫기" onPress={() => router.back()} style={st.close}>
      <SymbolView name="xmark" size={20} tintColor="#FFF" weight="semibold" />
    </Pressable>
  );
}

export function TipCard({ text, icons }: { text: string; icons: SFSymbol[] }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <View style={st.tip} accessibilityRole="summary">
      <Pressable accessibilityLabel="안내 닫기" onPress={() => setOpen(false)} style={st.tipClose}>
        <SymbolView name="xmark" size={15} tintColor="#FFF" weight="semibold" />
      </Pressable>
      <Text style={{ marginTop: 6, marginHorizontal: 28, fontSize: 17, fontWeight: '600', lineHeight: 25, color: '#FFF', textAlign: 'center' }}>{text}</Text>
      {/* TODO: 예시 사진 3장 (ASSETS.md 3장). 받기 전까지는 아이콘 */}
      <View style={{ marginTop: 16, flexDirection: 'row', gap: 12 }}>
        {icons.map((ic) => (
          <View key={ic} style={st.tipImg}><SymbolView name={ic} size={36} tintColor="#8E8E93" /></View>
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  close: { position: 'absolute', top: 56, left: 10, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  tip: { position: 'absolute', top: 112, left: 8, right: 8, padding: 20, paddingTop: 22, borderRadius: 12, backgroundColor: 'rgba(36,36,38,0.94)', zIndex: 6 },
  tipClose: { position: 'absolute', top: 8, right: 8, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  tipImg: { flex: 1, aspectRatio: 1, borderRadius: 10, backgroundColor: '#3A3A3C', alignItems: 'center', justifyContent: 'center' },
});
