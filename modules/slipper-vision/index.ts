// 사진 비교(Vision)와 스쿼트 카메라(MediaPipe). 설치판에만 있어요 (ios/).
import { requireNativeView, requireOptionalNativeModule } from 'expo';
import type { ViewProps } from 'react-native';

type SlipperVision = {
  /** 두 사진의 특징 거리. 작을수록 같은 곳 */
  photoDistance(a: string, b: string): Promise<number>;
};

export default requireOptionalNativeModule<SlipperVision>('SlipperVision');

export type SquatCameraProps = ViewProps & {
  downAngle: number;
  upAngle: number;
  minVisibility: number;
  minRepSec: number;
  maxRepSec: number;
  /** false면 화면만 보여 주고 세지 않아요 */
  active: boolean;
  onPose?: (e: { nativeEvent: { visible: boolean; angle?: number } }) => void;
  onRep?: () => void;
};

export const SquatCamera = requireNativeView<SquatCameraProps>('SlipperVision');
