// 모노럴 비트를 앱에서 직접 만드는 부품 (ios/SlipperAudioModule.swift).
// Expo Go에는 이 부품이 없어서 null이에요. 그때는 미리 만든 파일로 대신 틀어요 (src/store/night.ts).
import { requireOptionalNativeModule } from 'expo';

type SlipperAudio = {
  start(carrierHz: number, beatHz: number, amplitude: number, volume: number, fadeInSec: number): void;
  setVolume(volume: number): void;
  stop(): void;
};

export default requireOptionalNativeModule<SlipperAudio>('SlipperAudio');
